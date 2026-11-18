#!/usr/bin/env node
// Renders <plan>/index.html from plan.json, status.json and each phase's kick-off prompt file.
// The page answers three questions first: which phases are done, which are safe to start now, and
// which can run side by side. Everything else (every phase with its prompt, the sequencing rules, how
// a phase runs, milestones, parked items, the gap analysis) sits behind collapsed sections.
// Its words come from plan.config.json "index" (defaults below). Dependency-free. Run from the repo root:
//   node <tools>/build-index.mjs [--plan <dir>]
// Re-run whenever plan.json, status.json, gaps.json or a prompt file changes.
//
// How a phase's state is worked out:
// - done / in progress: the progress file's status table (DONE, IN PROGRESS), else status.json.
// - wave: 0 when done; otherwise 1 + the highest wave of its unfinished dependencies (1 when every
//   dependency is done, so it can start now). Phases in the same wave do not depend on each other, so
//   they can run side by side.
// - safe / wait: the owner's call, in status.json "guidance" (see below). A wave-1 phase with no call
//   is shown as "can start" without a safety claim.
// - re-plan: one of its blocked_by_oqs questions was answered after the plan's baseline commit, so the
//   phase doc predates the answer until update-build-plan re-plans it.
//
// status.json (beside plan.json, all optional):
//   { "in_progress": ["17"],
//     "guidance": {
//       "as_of": "2026-11-04",
//       "headline": "One sentence for the top of the page",
//       "safe":  { "32a": "why it is safe" },
//       "wait":  { "18": "what it is waiting for" },
//       "parallel": "a note on running the safe phases side by side",
//       "lanes": [ { "name": "Lane A", "where": "the worktree folder", "queue": ["26", "27"],
//                    "prompt_file": "lanes/lane-a.prompt.md" } ] } }
// "lanes" (optional) is for building in parallel worktrees: each lane is listed under "Start now" with
// its queue and a button copying its prompt (a path beside plan.json), and a queued phase's card
// copies its lane's prompt instead of its own kick-off prompt.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { linkFrom, loadConfig, phaseStatus, statusListsOf } from './config.mjs';

const config = loadConfig();
const CWD = process.cwd();
const ROOT = join(CWD, config.plan);
const OUT = join(ROOT, 'index.html');
const SELF = relative(CWD, fileURLToPath(import.meta.url)).split('\\').join('/');
const IX = config.index;
const APP = config.appNoun;
const CATALOGUE_REL = linkFrom(config.plan, config.requirements);

const warnings = [];
const warn = (m) => warnings.push(m);

// ---------- inputs ----------

const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const readText = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : null);

const plan = readJson('plan.json');
const gaps = readText('gaps.json') ? readJson('gaps.json') : {};
const gapMd = readText('GAP-ANALYSIS.md') ?? '';
const statusJson = readText('status.json') ? readJson('status.json') : {};
const G = statusJson.guidance ?? {};

// ---------- helpers ----------

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Minimal inline Markdown: escape first, then `code`, **bold**, [text](url).
const inlineMd = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`);

const oqHref = (id) => `${CATALOGUE_REL}/questions/${encodeURIComponent(id)}.md`;
const firstSentence = (text) => {
  const t = String(text ?? '').trim();
  // The first ". " or "; " after 40 characters, outside brackets.
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if ((c === '.' || c === ';') && depth === 0 && i >= 40 && /\s/.test(t[i + 1] ?? ' ')) { cut = i; break; }
  }
  const s = cut >= 0 ? `${t.slice(0, cut)}.` : t;
  return s.length > 260 ? `${s.slice(0, 250).replace(/[\s,;(]+\S*$/, '')}...` : s;
};
const fill = (html, vars) => String(html).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? esc(vars[k]) : m));
const listWords = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const fmtDate = (d) => {
  const m = String(d ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(d ?? '');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
};

// ---------- phases and their state ----------

const phases = plan.phases ?? [];
const byNum = new Map(phases.map((p) => [p.num, p]));
const phaseNums = new Set(byNum.keys());
const progress = phaseStatus(config);
const builtPhases = new Set(progress.doneRows);
const doneDate = progress.doneDate;
const progressName = config.progress ? basename(config.progress) : null;
const isDone = (n) => doneDate.has(n) || (!config.progress && (statusJson.done ?? []).includes(n));
const isWip = (n) => !isDone(n) && (progress.inProgressRows.includes(n) || (statusJson.in_progress ?? []).includes(n));

for (const n of statusJson.in_progress ?? []) if (!phaseNums.has(n)) warn(`status.json names phase ${n}, which is not in plan.json`);
for (const key of ['safe', 'wait'])
  for (const n of Object.keys(G[key] ?? {})) {
    if (!phaseNums.has(n)) warn(`status.json guidance.${key} names phase ${n}, which is not in plan.json`);
    else if (isDone(n)) warn(`status.json guidance.${key} names phase ${n}, which is done`);
  }

// Every covered id should be in gaps.json (a built phase may keep ids a later re-grade closed).
const knownIds = new Set([...(gaps.items ?? []), ...(gaps.dataModelDeltas ?? []), ...(gaps.reverseFindings ?? [])].map((x) => x.id));
if (gaps.items)
  for (const p of phases)
    for (const id of p.covers ?? []) if (!knownIds.has(id) && !builtPhases.has(p.num)) warn(`Phase ${p.num} covers ${id}, which is not in gaps.json`);

const waveMemo = new Map();
const waveOf = (n, seen = new Set()) => {
  if (waveMemo.has(n)) return waveMemo.get(n);
  if (isDone(n)) return 0;
  if (seen.has(n)) { warn(`Dependency cycle through phase ${n}`); return 1; }
  seen.add(n);
  const open = (byNum.get(n)?.depends_on ?? []).filter((d) => phaseNums.has(d) && !isDone(d));
  const w = isWip(n) ? 1 : 1 + Math.max(0, ...open.map((d) => waveOf(d, seen)));
  waveMemo.set(n, w);
  return w;
};
const openDeps = (p) => (p.depends_on ?? []).filter((d) => phaseNums.has(d) && !isDone(d));

// Questions a phase is blocked by: open now, or answered since the plan's baseline (re-plan first).
let boardConfig = {};
try { boardConfig = JSON.parse(readFileSync(join(CWD, config.requirements, 'board.config.json'), 'utf8')); } catch {}
const answeredCodes = new Set(statusListsOf(boardConfig).questionStatuses.filter((s) => s.role === 'answered').map((s) => String(s.code)));
const qStatus = (text) => text?.match(/^status:\s*"?([^"\s]+)/m)?.[1] ?? null;
const qPath = (id) => `${config.requirements}/questions/${id}.md`;
const qNow = (id) => (existsSync(join(CWD, qPath(id))) ? qStatus(readFileSync(join(CWD, qPath(id)), 'utf8')) : null);
const qThen = (id) => {
  if (!plan.commit) return null;
  try { return qStatus(execFileSync('git', ['show', `${plan.commit}:${qPath(id)}`], { cwd: CWD, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); } catch { return null; }
};
const qInfo = new Map();
for (const p of phases)
  for (const q of p.blocked_by_oqs ?? [])
    if (!qInfo.has(q)) {
      const now = qNow(q);
      const then = qThen(q);
      qInfo.set(q, { open: now !== null && !answeredCodes.has(now), answeredSince: now !== null && answeredCodes.has(now) && then !== null && !answeredCodes.has(then) });
    }
const replanOqs = (p) => (p.blocked_by_oqs ?? []).filter((q) => qInfo.get(q)?.answeredSince);
const openOqs = (p) => (p.blocked_by_oqs ?? []).filter((q) => qInfo.get(q)?.open);

// One state per phase, for colour: done, wip, safe (start now), safe-later, wait, ready, later.
const stateOf = (p) => {
  const n = p.num;
  if (isDone(n)) return 'done';
  if (isWip(n)) return 'wip';
  const w = waveOf(n);
  if (G.safe?.[n]) return w === 1 ? 'safe' : 'safe-later';
  if (G.wait?.[n]) return 'wait';
  if (w === 1) return replanOqs(p).length ? 'wait' : 'ready';
  return 'later';
};
const STATE_WORD = { done: 'Done', wip: 'In progress', safe: 'Safe to start', 'safe-later': 'Safe, after its dependencies', wait: 'Wait', ready: 'Can start', later: 'Later' };

const done = phases.filter((p) => isDone(p.num));
const wip = phases.filter((p) => isWip(p.num));
const safeNow = phases.filter((p) => stateOf(p) === 'safe');
const safeLater = phases.filter((p) => stateOf(p) === 'safe-later');
const readyUnflagged = phases.filter((p) => stateOf(p) === 'ready');
const waitNow = phases.filter((p) => stateOf(p) === 'wait' && waveOf(p.num) === 1);
const replanLater = phases.filter((p) => !isDone(p.num) && waveOf(p.num) > 1 && !G.safe?.[p.num] && (replanOqs(p).length || G.wait?.[p.num]));
const shortCommit = String(plan.commit ?? '').slice(0, 7);

// ---------- pieces ----------

const chip = (p) => {
  const s = stateOf(p);
  const marks = [];
  if (!['done', 'wip'].includes(s) && replanOqs(p).length) marks.push('<i class="mk" aria-hidden="true"></i>');
  return `<a class="chip s-${s}" href="#p-${esc(p.num)}" title="${esc(`${p.num} ${p.title} (${STATE_WORD[s]})`)}">${esc(p.num)}${marks.join('')}</a>`;
};

// Lanes: parallel worktrees, each with a queue and one prompt that wraps its phases' kick-off prompts.
const LANES = (Array.isArray(G.lanes) ? G.lanes : []).map((l, i) => ({ ...l, id: `lane-${i + 1}`, prompt: l.prompt_file ? readText(l.prompt_file) : null }));
for (const l of LANES) {
  if (!l.prompt) warn(`status.json guidance.lanes: ${l.name ?? l.id} has no prompt file (${l.prompt_file ?? 'none given'})`);
  for (const n of l.queue ?? []) if (!phaseNums.has(n)) warn(`status.json guidance.lanes: ${l.name ?? l.id} queues phase ${n}, which is not in plan.json`);
}
const laneOf = (n) => LANES.find((l) => l.prompt && (l.queue ?? []).includes(n));

const copyButton = (p, label = 'Copy kick-off prompt') => {
  const lane = laneOf(p.num);
  if (lane) return `<button class="btn" type="button" data-copy="${esc(lane.id)}">Copy ${esc(lane.name ?? 'lane')} prompt</button>`;
  return p.prompt_file && readText(p.prompt_file) ? `<button class="btn" type="button" data-copy="prompt-${esc(p.num)}">${esc(label)}</button>` : '';
};
const docLink = (p) => (p.file ? `<a class="lnk" href="${esc(p.file)}">Phase plan</a>` : '');

// The map: tracks down the side, waves across. A column is what can run once everything to its left is done.
const trackOrder = [];
for (const p of phases) if (!trackOrder.includes(p.track)) trackOrder.push(p.track);
// Waves past MAP_WAVES share one "Later" column (in wave order): far phases get re-planned anyway.
const MAP_WAVES = Number(IX.mapWaves ?? 6);
const maxWave = Math.max(0, ...phases.map((p) => waveOf(p.num)));
const lastCol = Math.min(maxWave, MAP_WAVES + 1);
const colOf = (n) => Math.min(waveOf(n), lastCol);
const colHead = (w) => (w === 0 ? 'Done' : w === 1 ? 'Now' : w > MAP_WAVES ? 'Later' : String(w));
const map = `
<div class="map-scroll" tabindex="0" aria-label="Phases by track and wave">
  <table class="map">
    <thead><tr><th scope="col" class="tk"><span class="sr">Track</span></th>${Array.from({ length: lastCol + 1 }, (_, w) => `<th scope="col" class="${w === 0 ? 'dn' : w === 1 ? 'now' : w > MAP_WAVES ? 'lt' : ''}">${esc(colHead(w))}</th>`).join('')}</tr></thead>
    <tbody>
${trackOrder
  .map((t) => {
    const ps = phases.filter((p) => p.track === t);
    const cells = Array.from({ length: lastCol + 1 }, (_, w) => {
      const here = ps.filter((p) => colOf(p.num) === w).sort((a, b) => waveOf(a.num) - waveOf(b.num));
      return `<td class="${w === 0 ? 'dn' : w === 1 ? 'now' : w > MAP_WAVES ? 'lt' : ''}">${here.map(chip).join('')}</td>`;
    }).join('');
    return `      <tr><th scope="row" class="tk">${esc(t)}</th>${cells}</tr>`;
  })
  .join('\n')}
    </tbody>
  </table>
</div>
<ul class="key">
  <li><span class="chip s-done">00</span> Done</li>
  <li><span class="chip s-safe">00</span> Safe to start</li>
  <li><span class="chip s-safe-later">00</span> Safe, once the phases to its left are done</li>
  <li><span class="chip s-wait">00</span> Can start, but wait</li>
  ${readyUnflagged.length ? '<li><span class="chip s-ready">00</span> Can start, no call made</li>' : ''}
  <li><span class="chip s-later">00</span> Later</li>
  <li><span class="chip s-later">00<i class="mk" aria-hidden="true"></i></span> Its questions were answered after the plan was written: re-plan first</li>
</ul>
<p class="fine">Each column needs the columns to its left. Phases in the same column don't depend on each other, so they can run side by side.${maxWave > MAP_WAVES ? ` Later holds the last ${esc(maxWave - MAP_WAVES)} waves, in order.` : ''}</p>`;

const startCard = (p) => `
  <article class="card">
    <div class="card-top"><span class="num">${esc(p.num)}</span><h3>${esc(p.title)}</h3></div>
    <p class="what">${esc(firstSentence(p.delivers || p.goal))}</p>
    <p class="why">${inlineMd(G.safe?.[p.num] ?? '')}</p>
    <p class="meta">${esc(p.est_sessions)}${p.track ? `, ${esc(p.track)} track` : ''}</p>
    <div class="acts">${copyButton(p)}${docLink(p)}</div>
  </article>`;

const headline =
  G.headline ??
  (safeNow.length
    ? `Safe to start now: ${listWords(safeNow.map((p) => p.num))}.`
    : wip.length
      ? `In progress: ${listWords(wip.map((p) => p.num))}.`
      : readyUnflagged.length
        ? `Can start now: ${listWords(readyUnflagged.map((p) => p.num))}.`
        : 'Nothing is ready to start.');

const laneRows = LANES.length
  ? `<ul class="rows lanes">${LANES.map(
      (l) => `<li><span class="chip s-safe">${esc((l.name ?? l.id).replace(/^Lane\s+/i, ''))}</span><div><b>${esc(l.name ?? l.id)}</b>${l.where ? ` · ${inlineMd(l.where)}` : ''}<br>Queue: ${(l.queue ?? []).map((n) => byNum.get(n)).filter(Boolean).map(chip).join(' ')}${
        l.prompt ? `<details class="pr"><summary>Show the prompt</summary><pre id="${esc(l.id)}">${esc(l.prompt.trim())}</pre></details>` : ''
      }</div><div class="acts">${l.prompt ? `<button class="btn" type="button" data-copy="${esc(l.id)}">Copy ${esc(l.name ?? 'lane')} prompt</button>` : ''}</div></li>`,
    ).join('')}</ul>`
  : '';

const nowSection = `
<section class="now" aria-labelledby="h-now">
  <h2 id="h-now">Start now</h2>
  ${wip.length ? `<p class="lead">In progress: ${wip.map((p) => `<a href="#p-${esc(p.num)}">${esc(p.num)} ${esc(p.title)}</a>`).join(', ')}.</p>` : ''}
  ${safeNow.length ? `${safeNow.length > 1 ? `<p class="lead">These ${safeNow.length} can run at the same time.${G.parallel ? ` ${inlineMd(G.parallel)}` : ''}</p>` : G.parallel ? `<p class="lead">${inlineMd(G.parallel)}</p>` : ''}
  ${laneRows}
  <div class="cards">${safeNow.map(startCard).join('')}</div>` : '<p class="lead">No phase is marked safe to start. Add calls to <code>status.json</code> "guidance".</p>'}
  ${
    safeLater.length
      ? `<h3 class="sub">Safe next</h3>
  <ul class="rows">${safeLater
    .map((p) => `<li><a class="chip s-safe-later" href="#p-${esc(p.num)}">${esc(p.num)}</a><div><b>${esc(p.title)}</b>, after ${esc(listWords(openDeps(p)))}. ${inlineMd(G.safe[p.num])}</div><div class="acts">${copyButton(p, 'Copy prompt')}</div></li>`)
    .join('')}</ul>`
      : ''
  }
  ${
    readyUnflagged.length
      ? `<h3 class="sub">Can start, no call made yet</h3>
  <ul class="rows">${readyUnflagged.map((p) => `<li><a class="chip s-ready" href="#p-${esc(p.num)}">${esc(p.num)}</a><div><b>${esc(p.title)}</b>${openOqs(p).length ? `. Open: ${openOqs(p).map((q) => `<a href="${esc(oqHref(q))}">${esc(q)}</a>`).join(', ')}` : ''}</div></li>`).join('')}</ul>`
      : ''
  }
</section>`;

const waitReason = (p) => {
  if (G.wait?.[p.num]) return inlineMd(G.wait[p.num]);
  const qs = replanOqs(p);
  return `Answered since the plan was written: ${qs.map((q) => `<a href="${esc(oqHref(q))}">${esc(q)}</a>`).join(', ')}. Re-plan first.`;
};
const waitSection =
  waitNow.length || replanLater.length
    ? `
<section aria-labelledby="h-wait">
  <h2 id="h-wait">Unblocked, but wait</h2>
  ${waitNow.length ? `<ul class="rows">${waitNow.map((p) => `<li><a class="chip s-wait" href="#p-${esc(p.num)}">${esc(p.num)}</a><div><b>${esc(p.title)}</b>. ${waitReason(p)}</div></li>`).join('')}</ul>` : ''}
  ${
    replanLater.length
      ? `<details class="fold"><summary>Later phases the next plan update rewrites (${esc(replanLater.length)})</summary>
    <ul class="rows tight">${replanLater.map((p) => `<li><a class="chip s-later" href="#p-${esc(p.num)}">${esc(p.num)}</a><div><b>${esc(p.title)}</b>. ${waitReason(p)}</div></li>`).join('')}</ul>
  </details>`
      : ''
  }
</section>`
    : '';

// ---------- the folds ----------

let promptsFound = 0;
const phaseEntry = (p) => {
  const s = stateOf(p);
  const prompt = p.prompt_file ? readText(p.prompt_file) : null;
  if (prompt) promptsFound++;
  else warn(`Phase ${p.num}: prompt file not found (${p.prompt_file ?? 'none given'})`);
  if (p.file && !existsSync(join(ROOT, p.file))) warn(`Phase ${p.num}: plan doc not found (${p.file})`);
  const deps = p.depends_on ?? [];
  const oqs = p.blocked_by_oqs ?? [];
  const when = isDone(p.num) ? `Done ${fmtDate(doneDate.get(p.num))}` : STATE_WORD[s];
  return `
  <details class="ph st-${s}" id="p-${esc(p.num)}">
    <summary><span class="num">${esc(p.num)}</span><span class="t">${esc(p.title)}</span><span class="pill p-${s}">${esc(when)}</span></summary>
    <div class="ph-body">
      <p>${esc(firstSentence(p.delivers || p.goal))}</p>
      <p class="meta">${deps.length ? `After ${esc(listWords(deps))}` : 'No dependencies'}. ${esc(p.est_sessions)}. ${esc(p.track)} track.${oqs.length ? ` Questions: ${oqs.map((q) => `<a href="${esc(oqHref(q))}">${esc(q)}</a>${qInfo.get(q)?.answeredSince ? ' (answered since)' : qInfo.get(q)?.open ? ' (open)' : ''}`).join(', ')}.` : ''}</p>
      ${G.safe?.[p.num] ? `<p class="why">${inlineMd(G.safe[p.num])}</p>` : G.wait?.[p.num] ? `<p class="why w">${inlineMd(G.wait[p.num])}</p>` : ''}
      <div class="acts">${docLink(p)}${prompt ? `<button class="btn quiet" type="button" data-copy="prompt-${esc(p.num)}">Copy kick-off prompt</button>` : ''}</div>
      ${prompt ? `<details class="pr"><summary>Show the prompt</summary><pre id="prompt-${esc(p.num)}">${esc(prompt.trim())}</pre></details>` : ''}
    </div>
  </details>`;
};

const vars = { phases: phases.length, first: phases[0]?.num ?? '', last: phases[phases.length - 1]?.num ?? '', commit: shortCommit };
const ruleParas = String(plan.sequencing_rules ?? '')
  .split(/\n\s*\n/)
  .filter((p) => p.trim())
  .map((p) => {
    const t = p.trim();
    const m = t.match(/^([A-Z][^.:]{0,40}[.:])\s+([\s\S]*)$/);
    return m ? `<p><b>${esc(m[1])}</b> ${esc(m[2])}</p>` : `<p>${esc(t)}</p>`;
  })
  .join('\n    ');
const howTo = IX.howTo ?? [
  '<b>Pick a phase that is safe to start</b>, open a fresh Claude Code session and paste its kick-off prompt.',
  '<b>Drift check first.</b> Each session diffs its items against <code>{commit}</code>, reports what changed, and adapts before building.',
  '<b>The agent plans, builds and tests itself.</b> Agents never commit.',
  `<b>When the catalogue changes,</b> run the <code>update-build-plan</code> skill; it re-renders this page with <code>node ${esc(SELF)}</code>.`,
];
const callouts = IX.callouts ?? [];
const headlineMd = (() => {
  const lines = gapMd.split('\n');
  const start = lines.findIndex((l) => l.trim() === '### Headline');
  if (start < 0) return '';
  const out = [];
  for (let i = start + 1; i < lines.length && !/^#{1,3}\s/.test(lines[i]); i++) out.push(lines[i]);
  return out.join('\n').trim();
})();

const fold = (id, title, body) => `
  <details class="fold big" id="${id}"><summary>${title}</summary>
    <div class="fold-body">${body}</div>
  </details>`;

const foldsSection = `
<section class="folds" aria-label="Reference">
  ${fold('all', `Every phase <span class="cnt">${esc(phases.length)}</span>`, `<p class="fine">${esc(done.length)} done, ${esc(phases.length - done.length)} to go. Status comes from ${progressName ? `the status table in <code>${esc(progressName)}</code>` : '<code>status.json</code>'}.</p>${phases.map(phaseEntry).join('')}`)}
  ${fold('rules', 'Sequencing rules', ruleParas || '<p>None recorded.</p>')}
  ${fold('how', 'How a phase runs', `<ol class="how">${howTo.map((li) => `<li>${fill(li, vars)}</li>`).join('')}</ol>${callouts.map((c) => `<p class="note">${fill(c.html, vars)}</p>`).join('')}`)}
  ${(plan.milestones ?? []).length ? fold('milestones', 'What each milestone can show', `<ul class="plain">${plan.milestones.map((m) => `<li><b><a href="#p-${esc(m.after)}">After ${esc(m.after)}</a></b> ${esc(m.can_show)}</li>`).join('')}</ul>`) : ''}
  ${(plan.parked ?? []).length ? fold('parked', `Parked <span class="cnt">${esc(plan.parked.length)}</span>`, `<ul class="plain">${plan.parked.map((x) => `<li><b>${esc(x.id)}</b> ${esc(x.reason)}</li>`).join('')}</ul>`) : ''}
  ${fold('about', 'About this plan', `${IX.intro ? `<p>${fill(IX.intro, vars)}</p>` : ''}${headlineMd.split(/\n\s*\n/).filter(Boolean).map((p) => `<p>${inlineMd(p.trim())}</p>`).join('')}<p>Plan baseline <code>${esc(shortCommit)}</code>. The full plan is <a href="ROADMAP.md">ROADMAP.md</a>, the gap analysis <a href="GAP-ANALYSIS.md">GAP-ANALYSIS.md</a>, the data <a href="plan.json">plan.json</a>.</p>`)}
</section>`;

// ---------- page ----------

const CSS = `:root {
  --bg:#eef2f1; --sheet:#ffffff; --ink:#1c2a2e; --ink-2:#4a5b5f; --ink-3:#7f8e90; --line:#d3dcdb;
  --teal:#0d6e63; --teal-2:#0a5a51; --teal-t:#d8ece8; --amber:#9c5f0c; --amber-t:#f6e8d2;
  --sage:#8aa59e; --sage-t:#e3eae8; --focus:#0d6e63;
  --ui:'Schibsted Grotesk',system-ui,sans-serif; --data:'Spline Sans Mono',ui-monospace,monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg:#121a1c; --sheet:#1a2427; --ink:#e4ecea; --ink-2:#b2c0bf; --ink-3:#7f8f90; --line:#2c3a3d;
  --teal:#3fb3a3; --teal-2:#5cc7b8; --teal-t:#173d38; --amber:#e0a552; --amber-t:#3a2c17; --sage:#5d7a73; --sage-t:#213230; --focus:#5cc7b8; } }
* { box-sizing:border-box; }
html { scroll-behavior:smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior:auto; } }
body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.55 var(--ui); }
.chip, .num, .cnt, .map thead th { font-variant-numeric:tabular-nums; }
a { color:var(--teal); text-underline-offset:2px; }
:focus-visible { outline:2px solid var(--focus); outline-offset:2px; }
code { font:500 .86em var(--data); background:var(--sage-t); padding:1px 5px; border-radius:4px; }
.wrap { max-width:1120px; margin:0 auto; padding:40px 32px 96px; }
.top { display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; color:var(--ink-3); font-size:14px; margin:0 0 28px; }
.top b { color:var(--ink-2); font-weight:600; }
h1 { font:800 clamp(30px,4.6vw,52px)/1.04 var(--ui); letter-spacing:-.02em; margin:0 0 12px; max-width:20ch; }
.sub-h { font-size:18px; color:var(--ink-2); margin:0 0 28px; max-width:62ch; }
.progress { display:flex; height:6px; border-radius:3px; overflow:hidden; background:var(--line); max-width:420px; margin:0 0 8px; }
.progress span { background:var(--sage); }
.fine { font-size:13.5px; color:var(--ink-3); margin:8px 0 0; max-width:70ch; }
h2 { font:750 24px/1.2 var(--ui); letter-spacing:-.01em; margin:56px 0 14px; }
h3 { margin:0; }
.sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }

/* the map */
.map-scroll { overflow-x:auto; background:var(--sheet); border:1px solid var(--line); border-radius:10px; }
.map { border-collapse:separate; border-spacing:0; width:100%; min-width:720px; }
.map th, .map td { padding:7px 8px; border-bottom:1px solid var(--line); vertical-align:middle; text-align:left; }
.map tr:last-child th, .map tr:last-child td { border-bottom:none; }
.map thead th { font:600 12.5px var(--ui); color:var(--ink-3); padding-top:10px; padding-bottom:10px; }
.map th.tk { position:sticky; left:0; background:var(--sheet); font:600 13px var(--ui); color:var(--ink-2); white-space:nowrap; padding-left:14px; min-width:116px; z-index:1; }
.map .now { background:color-mix(in srgb, var(--teal-t) 55%, transparent); }
.map thead th.now { color:var(--teal); }
.map td { min-width:60px; }
.map td.dn { width:150px; }
.map td.lt { width:30%; }
.map td.dn .chip { min-width:36px; height:24px; font-size:11.5px; }
.chip { position:relative; display:inline-flex; align-items:center; justify-content:center; min-width:42px; height:28px; padding:0 7px; margin:2px 4px 2px 0;
  font:600 12.5px var(--data); border-radius:6px; text-decoration:none; border:1.5px solid transparent; }
.chip .mk { position:absolute; top:-4px; right:-4px; width:9px; height:9px; border-radius:50%; background:var(--amber); border:2px solid var(--sheet); }
.s-done { background:var(--sage-t); color:var(--ink-3); }
.s-wip { background:var(--amber-t); color:var(--amber); border-color:var(--amber); border-style:dashed; }
.s-safe { background:var(--teal); color:#fff; }
.s-safe:hover { background:var(--teal-2); }
.s-safe-later { background:var(--sheet); color:var(--teal); border-color:var(--teal); }
.s-wait { background:var(--amber-t); color:var(--amber); border-color:var(--amber); }
.s-ready { background:var(--sheet); color:var(--ink); border-color:var(--ink-2); }
.s-later { background:transparent; color:var(--ink-3); border-color:var(--line); }
a.chip:hover { border-color:var(--ink); }
.key { list-style:none; padding:0; margin:14px 0 0; display:flex; flex-wrap:wrap; gap:8px 20px; font-size:13.5px; color:var(--ink-2); }
.key li { display:inline-flex; align-items:center; gap:8px; }
.key .chip { min-width:34px; height:22px; font-size:11px; margin:0; }

/* start now */
.lead { color:var(--ink-2); max-width:70ch; margin:0 0 16px; }
.cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:16px; }
.card { background:var(--sheet); border:1px solid var(--line); border-top:4px solid var(--teal); border-radius:10px; padding:18px 20px 18px; display:flex; flex-direction:column; }
.card-top { display:flex; gap:12px; align-items:baseline; margin-bottom:8px; }
.num { font:600 14px var(--data); color:var(--teal); flex:none; }
.card h3 { font:700 19px/1.25 var(--ui); }
.what { margin:0 0 10px; color:var(--ink); }
.why { margin:0 0 10px; color:var(--ink-2); font-size:14.5px; padding-left:12px; border-left:3px solid var(--teal-t); }
.why.w { border-left-color:var(--amber-t); }
.meta { margin:0 0 14px; color:var(--ink-3); font-size:13.5px; }
.acts { display:flex; gap:14px; align-items:center; flex-wrap:wrap; margin-top:auto; }
.btn { font:600 14px var(--ui); background:var(--teal); color:#fff; border:none; padding:9px 14px; border-radius:7px; cursor:pointer; }
.btn:hover { background:var(--teal-2); }
.btn.quiet { background:transparent; color:var(--teal); border:1.5px solid var(--teal); padding:6px 11px; font-size:13.5px; }
.btn.ok { background:var(--sage); color:#fff; border-color:var(--sage); }
.lnk { font-weight:600; font-size:14px; }
h3.sub { font:700 16px var(--ui); margin:28px 0 8px; color:var(--ink-2); }
.rows { list-style:none; padding:0; margin:0; max-width:900px; }
.rows li { display:grid; grid-template-columns:auto 1fr auto; gap:14px; align-items:start; padding:12px 0; border-bottom:1px solid var(--line); color:var(--ink-2); }
.rows li b { color:var(--ink); font-weight:650; }
.rows .chip { margin-top:-2px; }
.rows.tight li { padding:8px 0; font-size:14.5px; }

/* folds */
.folds { margin-top:56px; border-top:1px solid var(--line); }
details.fold > summary { cursor:pointer; list-style:none; }
details.fold > summary::-webkit-details-marker { display:none; }
details.fold.big { border-bottom:1px solid var(--line); }
details.fold.big > summary { font:700 18px var(--ui); padding:16px 0; display:flex; align-items:center; gap:10px; }
details.fold > summary::before { content:''; width:8px; height:8px; border-right:2px solid var(--ink-3); border-bottom:2px solid var(--ink-3); transform:rotate(-45deg); transition:transform .15s; flex:none; }
details.fold[open] > summary::before { transform:rotate(45deg); }
@media (prefers-reduced-motion: reduce) { details.fold > summary::before { transition:none; } }
section > details.fold > summary { font:600 15px var(--ui); color:var(--ink-2); padding:14px 0 4px; display:flex; align-items:center; gap:10px; }
.cnt { font:500 13px var(--data); color:var(--ink-3); }
.fold-body { padding:0 0 24px 18px; max-width:900px; }
.fold-body p { max-width:75ch; }
.how li { margin:8px 0; }
.note { color:var(--ink-2); font-size:14.5px; }
.plain { padding-left:18px; } .plain li { margin:8px 0; color:var(--ink-2); } .plain b { color:var(--ink); }
details.ph { border-bottom:1px solid var(--line); }
details.ph > summary { cursor:pointer; list-style:none; display:grid; grid-template-columns:48px 1fr auto; gap:12px; align-items:baseline; padding:10px 0; }
details.ph > summary::-webkit-details-marker { display:none; }
details.ph .t { font-weight:600; }
details.ph.st-done .t { color:var(--ink-3); font-weight:500; }
details.ph:target > summary { background:var(--teal-t); }
.pill { font:600 12px var(--ui); padding:2px 9px; border-radius:20px; white-space:nowrap; }
.p-done { background:var(--sage-t); color:var(--ink-3); }
.p-safe, .p-safe-later { background:var(--teal-t); color:var(--teal); }
.p-wait, .p-wip { background:var(--amber-t); color:var(--amber); }
.p-ready { background:var(--sheet); color:var(--ink-2); border:1px solid var(--line); }
.p-later { color:var(--ink-3); }
.ph-body { padding:0 0 16px 60px; }
.ph-body p { margin:4px 0 8px; }
details.pr { margin-top:10px; }
details.pr > summary { cursor:pointer; font-size:13.5px; color:var(--ink-3); }
pre { margin:8px 0 0; padding:14px 16px; font:400 12px/1.65 var(--data); white-space:pre-wrap; background:var(--sheet); border:1px solid var(--line); border-radius:8px; color:var(--ink-2); max-height:340px; overflow:auto; }
footer { color:var(--ink-3); font-size:13px; margin-top:48px; }
@media (max-width:640px) {
  .wrap { padding:24px 16px 72px; }
  .rows li { grid-template-columns:auto 1fr; } .rows li .acts { grid-column:2; }
  .ph-body { padding-left:0; }
  details.ph > summary { grid-template-columns:44px 1fr; } details.ph .pill { grid-column:2; justify-self:start; }
}
@media print { pre { max-height:none; } details { display:block; } }`;

const SCRIPT = `document.querySelectorAll('[data-copy]').forEach(function (b) {
  b.addEventListener('click', function () {
    var el = document.getElementById(b.getAttribute('data-copy'));
    if (!el) return;
    var label = b.textContent;
    navigator.clipboard.writeText(el.textContent).then(function () {
      b.textContent = 'Copied'; b.classList.add('ok');
      setTimeout(function () { b.textContent = label; b.classList.remove('ok'); }, 1600);
    });
  });
});
function openTarget() {
  var id = decodeURIComponent(location.hash.slice(1));
  var el = id && document.getElementById(id);
  if (!el) return;
  for (var n = el; n; n = n.parentElement) if (n.tagName === 'DETAILS') n.open = true;
}
window.addEventListener('hashchange', openTarget);
openTarget();`;

const asOf = G.as_of ? `Safety calls as of ${esc(fmtDate(G.as_of))}.` : '';
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(IX.title ?? config.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Spline+Sans+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
${CSS}
</style>
</head>
<body>
<!-- Generated by ${esc(SELF)}. Do not edit by hand: edit plan.json, status.json or the phase prompt files and re-run it. -->
<main class="wrap">
  <div class="top"><b>${esc(IX.title ?? config.title)}</b><span>${esc(done.length)} of ${esc(phases.length)} phases done. ${asOf}</span></div>
  <h1>${esc(headline)}</h1>
  ${G.headline_sub ? `<p class="sub-h">${inlineMd(G.headline_sub)}</p>` : ''}
  <div class="progress" aria-hidden="true"><span style="width:${phases.length ? ((done.length / phases.length) * 100).toFixed(1) : 0}%"></span></div>
  <p class="fine">${esc(phases.length - done.length)} ${phases.length - done.length === 1 ? 'phase' : 'phases'} to go.</p>
  <h2 class="sr">The phases by track</h2>
  <div style="margin-top:28px">${map}</div>
${nowSection}
${waitSection}
${foldsSection}
  <footer>Rendered by <code>${esc(basename(SELF))}</code> from <code>plan.json</code> and <code>status.json</code>, plan baseline <code>${esc(shortCommit)}</code>.</footer>
</main>
<script>
${SCRIPT}
</script>
</body>
</html>
`;

writeFileSync(OUT, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`Wrote ${OUT} (${kb} KB): ${phases.length} phases, ${promptsFound} prompts, ${done.length} done, ${safeNow.length} safe now, ${maxWave} waves.`);
if (warnings.length) {
  console.warn(`${warnings.length} warning(s):`);
  for (const w of warnings) console.warn(`  - ${w}`);
}
