#!/usr/bin/env node
// Renders docs/prototype-build/catch-up/index.html from plan.json, gaps.json,
// GAP-ANALYSIS.md and each phase's kick-off prompt file.
// Dependency-free. Run from the repo root:
//   node docs/prototype-build/catch-up/tools/build-index.mjs
// Re-run whenever plan.json, gaps.json or a prompt file changes.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..'); // docs/prototype-build/catch-up
const OUT = join(ROOT, 'index.html');

const CATALOGUE_REL = '../../discovery-reference/Updated%20Requirements/catalogue';
const BOARD_URL = 'http://localhost:5180/#/board?item=';

const warnings = [];
const warn = (m) => warnings.push(m);

// ---------- inputs ----------

const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const readText = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : null);

const plan = readJson('plan.json');
const gaps = readJson('gaps.json');
const gapMd = readText('GAP-ANALYSIS.md') ?? '';
if (!gapMd) warn('GAP-ANALYSIS.md not found');

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

const isCatalogueId = (id) => /^(EP|FT|US)-/.test(id);
const reqHref = (id) => `${CATALOGUE_REL}/requirements/${encodeURIComponent(id)}.md`;
const oqHref = (id) => `${CATALOGUE_REL}/questions/${encodeURIComponent(id)}.md`;
const boardHref = (id) => BOARD_URL + encodeURIComponent(id);

const sessionsOf = (s) => {
  const m = String(s ?? '').match(/\d+/);
  return m ? Number(m[0]) : 0;
};

// ["14","15","16","19"] -> "14 to 16, 19"
const compressNums = (list) => {
  const nums = [...new Set(list.map(Number))].sort((a, b) => a - b);
  const parts = [];
  for (let i = 0; i < nums.length; ) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
    if (j - i >= 2) parts.push(`${nums[i]} to ${nums[j]}`);
    else for (let k = i; k <= j; k++) parts.push(String(nums[k]));
    i = j + 1;
  }
  return parts.join(', ');
};

const phaseLinks = (nums) =>
  [...new Set(nums)]
    .sort((a, b) => Number(a) - Number(b))
    .map((n) => `<a href="#phase-${esc(n)}">${esc(n)}</a>`)
    .join(', ');

// ---------- lookups ----------

const VERDICTS = ['Contradicts', 'Partial', 'Missing', 'Matches', 'Grouping', 'OutOfScope'];
const VCLASS = {
  Contradicts: 'v-con', Partial: 'v-par', Missing: 'v-mis', Matches: 'v-mat', Grouping: 'v-grp', OutOfScope: 'v-oos',
};

const itemById = new Map();
for (const it of gaps.items ?? []) itemById.set(it.id, { ...it, kind: 'item' });
for (const d of gaps.dataModelDeltas ?? []) itemById.set(d.id, { ...d, kind: 'dm' });
for (const r of gaps.reverseFindings ?? []) itemById.set(r.id, { ...r, kind: 'rv' });

const phases = plan.phases ?? [];
const phasesCovering = new Map(); // item id -> [phase num]
for (const p of phases) {
  for (const id of p.covers ?? []) {
    if (!phasesCovering.has(id)) phasesCovering.set(id, []);
    phasesCovering.get(id).push(p.num);
    if (!itemById.has(id)) warn(`Phase ${p.num} covers ${id}, which is not in gaps.json`);
  }
}

const TRACKS = {
  Foundations: { cls: 'setup', tag: 'e' },
  Demo: { cls: 'setup', tag: 'e' },
  Contracts: { cls: 'trackA', tag: 'a' },
  Billing: { cls: 'trackA', tag: 'a' },
  Money: { cls: 'trackC', tag: 'c' },
  Schedule: { cls: 'trackB', tag: 'b' },
  Intake: { cls: 'trackB', tag: 'b' },
  Prepayment: { cls: 'trackD', tag: 'd' },
  Patients: { cls: 'trackD', tag: 'd' },
  'Master data': { cls: 'trackE', tag: 'f' },
  NFR: { cls: 'trackE', tag: 'f' },
};
const trackOf = (t) => TRACKS[t] ?? { cls: 'setup', tag: 'e' };

// ---------- GAP-ANALYSIS.md sections ----------

const mdSection = (md, heading) => {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start < 0) return null;
  const level = heading.match(/^#+/)[0].length;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#+)\s/);
    if (m && m[1].length <= level) break;
    out.push(lines[i]);
  }
  return out.join('\n').trim();
};

const headlineMd = mdSection(gapMd, '### Headline');
if (!headlineMd) warn('GAP-ANALYSIS.md has no "### Headline" section');

const themesMd = mdSection(gapMd, '### Themes');
const mdThemes = [];
if (themesMd) {
  for (const line of themesMd.split('\n')) {
    const m = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*(.*)$/);
    if (m) {
      const titleRaw = m[1].replace(/\.$/, '');
      const size = (titleRaw.match(/\(([^)]+)\)\s*$/) || [])[1] || '';
      mdThemes.push({ title: titleRaw.replace(/\s*\([^)]+\)\s*$/, ''), size, description: m[2], item_ids: [] });
    }
  }
} else warn('GAP-ANALYSIS.md has no "### Themes" section');

let themes;
if (Array.isArray(gaps.themes) && gaps.themes.length) {
  themes = gaps.themes.map((t) => {
    const md = mdThemes.find((x) => x.title.toLowerCase() === String(t.title).toLowerCase());
    return { ...t, size: md?.size ?? '', fromJson: true };
  });
} else {
  themes = mdThemes;
  if (!themes.length) warn('No themes found in gaps.json or GAP-ANALYSIS.md');
}

// ---------- rendering pieces ----------

const itemChip = (id) => {
  const it = itemById.get(id);
  const v = it?.kind === 'item' ? it.verdict : null;
  const cls = v ? VCLASS[v] : it?.kind === 'dm' ? 'v-dm' : it?.kind === 'rv' ? 'v-rv' : 'v-unk';
  const label = it?.kind === 'item' ? `${v} · ${it.title}` : it ? `${it.kind === 'dm' ? 'Data model' : 'Reverse check'} · ${it.title}` : 'Not in gaps.json';
  let href;
  if (isCatalogueId(id)) href = reqHref(id);
  else if (it?.kind === 'dm') href = `analysis/domain-model-delta.md#${id.toLowerCase()}`;
  else if (it?.kind === 'rv') href = 'analysis/reverse-check.md';
  const main = href ? `<a href="${esc(href)}">${esc(id)}</a>` : esc(id);
  const board = isCatalogueId(id)
    ? `<a class="brd" href="${esc(boardHref(id))}" title="Open ${esc(id)} in the Requirements Board">board</a>`
    : '';
  return `<span class="it" title="${esc(label)}"><i class="${cls}"></i>${main}${board}</span>`;
};

const bar = (counts, total) => {
  if (!total) return '<div class="bar"></div>';
  const segs = VERDICTS.filter((v) => counts[v])
    .map((v) => `<span class="${VCLASS[v]}" style="width:${((counts[v] / total) * 100).toFixed(2)}%" title="${esc(`${v}: ${counts[v]}`)}"></span>`)
    .join('');
  return `<div class="bar">${segs}</div>`;
};

const legend = () =>
  `<div class="legend">${VERDICTS.filter((v) => v !== 'OutOfScope' || gaps.counts?.OutOfScope)
    .map((v) => `<span><i class="${VCLASS[v]}"></i>${esc(v === 'OutOfScope' ? 'Out of scope' : v)}</span>`)
    .join('')}<span><i class="v-dm"></i>Data model (DM)</span><span><i class="v-rv"></i>Reverse check (RV)</span></div>`;

// ---------- sections ----------

const counts = gaps.counts ?? {};
const totalSessions = phases.reduce((n, p) => n + sessionsOf(p.est_sessions), 0);
const shortCommit = String(plan.commit ?? gaps.catalogue_commit ?? '').slice(0, 7);
const generated = gaps.generated ?? '';
const firstNum = phases[0]?.num ?? '';
const lastNum = phases[phases.length - 1]?.num ?? '';

const hero = `
<header class="hero">
  <p class="kicker">AA Prototype · Requirements catch-up</p>
  <h1>The catch-up: <em>from the RFP to the catalogue</em></h1>
  <p class="hero-sub">The prototype was built in July against the original RFP, in fourteen phases. The requirements catalogue has since become the source of truth and moved a long way: Bookings instead of Cards, Slots and Draft Lists, one Contract per Procedure locked at authorise, admin-decided hospital matching, an internal ledger with Xero as its mirror. This plan closes every verified gap in ${esc(phases.length)} further phases, numbered ${esc(firstNum)} to ${esc(lastNum)}, each one focused session (at most two) with one coherent deliverable, and every automatic or external event given a demo button on the screen where it matters.</p>
  <p class="hero-meta">Catalogue commit <code>${esc(shortCommit)}</code> · gap analysis ${esc(generated)} · plan rendered from <code>plan.json</code> and <code>gaps.json</code></p>
  <div class="stats">
    <div class="stat"><b>${esc(gaps.in_scope ?? '')}</b><span>in-scope items</span></div>
    <div class="stat"><b>${esc(counts.Matches ?? 0)}</b><span>match today</span></div>
    <div class="stat"><b>${esc(counts.Partial ?? 0)}</b><span>partial</span></div>
    <div class="stat"><b>${esc(counts.Contradicts ?? 0)}</b><span>contradict</span></div>
    <div class="stat"><b>${esc(counts.Missing ?? 0)}</b><span>missing</span></div>
    <div class="stat"><b>${esc(phases.length)}</b><span>phases (${esc(firstNum)} to ${esc(lastNum)})</span></div>
    <div class="stat"><b>${esc(totalSessions)}</b><span>est. sessions</span></div>
  </div>
</header>`;

const themesSection = `
<section class="prose">
  <h2>What changed since the prototype</h2>
  <div class="rule"></div>
  ${(headlineMd ?? '').split(/\n\s*\n/).filter(Boolean).map((p) => `<p>${inlineMd(p.trim())}</p>`).join('\n  ')}
  <p class="note">The themes below are the gap analysis's own grouping. Each lists the phases that carry its items. Full reasoning: <a href="GAP-ANALYSIS.md">GAP-ANALYSIS.md</a>.</p>
  <ol class="themes">
${themes
  .map((t) => {
    const ids = t.item_ids ?? [];
    const ph = [...new Set(ids.flatMap((id) => phasesCovering.get(id) ?? []))];
    const desc = t.fromJson ? esc(t.description) : inlineMd(t.description);
    return `    <li>
      <div class="th-head"><b>${esc(t.title)}</b>${t.size ? `<span class="tag e">${esc(t.size)}</span>` : ''}</div>
      <p>${desc}</p>
      <p class="th-meta">${ids.length ? `${esc(ids.length)} items` : ''}${ph.length ? ` · built in phase${ph.length > 1 ? 's' : ''} ${phaseLinks(ph)}` : ''}</p>
    </li>`;
  })
  .join('\n')}
  </ol>
</section>`;

const epicRows = (gaps.epics ?? [])
  .map((ep) => {
    const c = ep.counts ?? {};
    const total = VERDICTS.reduce((n, v) => n + (c[v] || 0), 0);
    const nn = ep.id.toLowerCase();
    const ph = [
      ...new Set(
        (gaps.items ?? [])
          .filter((i) => i.epic === ep.id)
          .flatMap((i) => phasesCovering.get(i.id) ?? []),
      ),
    ];
    const epicDetail = existsSync(join(ROOT, 'epics', `${ep.id}.md`));
    if (!epicDetail) warn(`epics/${ep.id}.md not found`);
    const num = (v) => `<td class="n">${c[v] ? esc(c[v]) : ''}</td>`;
    return `      <tr>
        <td><a href="GAP-ANALYSIS.md#${esc(nn)}"><b>${esc(ep.id)}</b></a> ${esc(ep.title)}<div class="read">${epicDetail ? `<a href="epics/${esc(ep.id)}.md">gap detail</a> · ` : ''}<a href="${esc(reqHref(ep.id))}">requirement</a></div></td>
        <td class="barcell">${bar(c, total)}</td>
        ${num('Contradicts')}${num('Partial')}${num('Missing')}${num('Matches')}${num('Grouping')}
        <td class="n"><b>${esc(total)}</b></td>
        <td class="read">${ph.length ? phaseLinks(ph) : ''}</td>
      </tr>`;
  })
  .join('\n');

const glanceSection = `
<section>
  <h2>The gap at a glance</h2>
  <div class="rule"></div>
  <p class="prose-p">Every in-scope epic, feature and story, graded against the running prototype and re-checked by an adversarial verifier. Retired and Future items are excluded (${esc((gaps.excluded ?? []).length)}). Plus ${esc((gaps.dataModelDeltas ?? []).length)} data-model deltas (DM) and ${esc((gaps.reverseFindings ?? []).length)} reverse-check findings (RV): behaviour the prototype still has that the catalogue has retired or superseded.</p>
  ${legend()}
  <div class="tscroll">
  <table class="scorecard epics">
    <thead><tr><th>Epic</th><th>Verdicts</th><th class="n">Contra.</th><th class="n">Partial</th><th class="n">Missing</th><th class="n">Match</th><th class="n">Group.</th><th class="n">Items</th><th>Phases</th></tr></thead>
    <tbody>
${epicRows}
      <tr class="tot">
        <td><b>Total</b></td>
        <td class="barcell">${bar(counts, gaps.in_scope ?? 0)}</td>
        <td class="n"><b>${esc(counts.Contradicts ?? 0)}</b></td><td class="n"><b>${esc(counts.Partial ?? 0)}</b></td><td class="n"><b>${esc(counts.Missing ?? 0)}</b></td><td class="n"><b>${esc(counts.Matches ?? 0)}</b></td><td class="n"><b>${esc(counts.Grouping ?? 0)}</b></td>
        <td class="n"><b>${esc(gaps.in_scope ?? '')}</b></td><td></td>
      </tr>
    </tbody>
  </table>
  </div>
</section>`;

// Flow: phases grouped by track in order of first appearance.
const trackOrder = [];
for (const p of phases) if (!trackOrder.includes(p.track)) trackOrder.push(p.track);
const flow = trackOrder
  .map((t) => {
    const nodes = phases
      .filter((p) => p.track === t)
      .map((p) => `<a class="fnode" href="#phase-${esc(p.num)}">${esc(p.num)} ${esc(p.title)}</a>`)
      .join(' &rarr; ');
    return `<span class="fpar">${esc(t.toLowerCase())}:</span> ${nodes}`;
  })
  .join('<br>\n    ');

const ruleParas = String(plan.sequencing_rules ?? '')
  .split(/\n\s*\n/)
  .filter((p) => p.trim())
  .map((p) => {
    const t = p.trim();
    const m = t.match(/^([A-Z][^.:]{0,40}[.:])\s+([\s\S]*)$/);
    return m ? `<p><b>${esc(m[1])}</b> ${esc(m[2])}</p>` : `<p>${esc(t)}</p>`;
  })
  .join('\n  ');

const howSection = `
<section class="prose">
  <h2>How this works</h2>
  <div class="rule"></div>
  <ol class="howto">
    <li><b>Get the owner decisions first.</b> D1 to D11 (the table at the top of <a href="ROADMAP.md">ROADMAP.md</a>) each gate one phase. A phase whose answer has not come in builds the stated default and labels it provisional.</li>
    <li><b>Pick the next phase</b> from the table below, respecting the order in "Sequencing and rules". The Contracts track (17 to 25) and the Schedule track (28 to 32) each run strictly in order.</li>
    <li><b>Open a fresh Claude Code session</b> and paste that phase's kick-off prompt. The agent reads the roadmap, its phase doc, the gap detail for its items, the prototype maps and <code>PROGRESS.md</code> before touching anything.</li>
    <li><b>Drift check first.</b> The catalogue keeps moving. Each session diffs its items against <code>${esc(shortCommit)}</code>, reports what changed, and adapts the plan before building.</li>
    <li><b>The agent enters plan mode</b>, turns the phase doc into work-sized steps, and waits for approval before changing any file.</li>
    <li><b>Every phase ends the same way:</b> <code>npm run build</code>, <code>npm run build:pwa</code>, <code>npx vitest run</code> and (for UI work) <code>npm run shots</code> green; the checklist run and reported item by item; the adversarial review-and-fix pass (PROGRESS convention 18); the demo guide patched for any beat it broke; a <code>PROGRESS.md</code> entry. Agents never commit.</li>
    <li><b>When the catalogue changes,</b> follow <a href="README.md">README.md</a>: re-grade the changed items, merge them into <code>gaps.json</code>, update the affected phase docs, and re-render this page with <code>node docs/prototype-build/catch-up/tools/build-index.mjs</code>.</li>
  </ol>
  <div class="callout green">
    <p><strong>Demo buttons live on their screens.</strong> Anything that cannot be shown through normal use (scheduled jobs, backend events, external systems) gets a trigger in the harness bar's "Demo actions" menu, listed only on the screen where it matters. The installed PWA has no harness bar, so it gets the same list as a badged demo-actions sheet, plus office stand-ins for beats that wait on the office. Phase 14 builds the mechanism; every later phase registers into it.</p>
  </div>
  <div class="callout">
    <p><strong>The checklists are the contract.</strong> Each phase ends with a short manual test checklist. The kick-off prompt makes the agent run and report it, but click through it yourself too: it doubles as a rehearsal for the workshop beats that phase touches.</p>
  </div>
  <div class="flow">
    ${flow}
  </div>
</section>

<section class="prose">
  <h2>Sequencing and rules</h2>
  <div class="rule"></div>
  ${ruleParas}
</section>`;

const tableRows = phases
  .map((p) => {
    const tr = trackOf(p.track);
    const after = (p.depends_on ?? []).length ? compressNums(p.depends_on) : 'Start here';
    return `      <tr><td><a href="#phase-${esc(p.num)}">${esc(p.num)}</a></td><td><b>${esc(p.title)}</b><div class="read">${esc(p.delivers)}</div></td><td><span class="tag ${tr.tag}">${esc(p.track)}</span></td><td>${esc(sessionsOf(p.est_sessions) || p.est_sessions)}</td><td class="read">${esc(after)}</td><td class="n">${esc((p.covers ?? []).length)}</td></tr>`;
  })
  .join('\n');

const tableSection = `
<section>
  <h2>The phases at a glance</h2>
  <div class="rule"></div>
  <div class="tscroll">
  <table class="scorecard">
    <thead><tr><th>#</th><th>Phase and what it delivers</th><th>Track</th><th>Sessions</th><th>After</th><th class="n">Items</th></tr></thead>
    <tbody>
${tableRows}
    </tbody>
  </table>
  </div>
</section>`;

let promptsFound = 0;
const articles = phases
  .map((p) => {
    const tr = trackOf(p.track);
    const deps = p.depends_on ?? [];
    const after = deps.length ? `After ${deps.length > 1 ? 'phases' : 'phase'} ${compressNums(deps)}` : 'Start here';
    const prompt = p.prompt_file ? readText(p.prompt_file) : null;
    if (prompt) promptsFound++;
    else warn(`Phase ${p.num}: prompt file not found (${p.prompt_file ?? 'none given'})`);
    if (p.file && !existsSync(join(ROOT, p.file))) warn(`Phase ${p.num}: plan doc not found (${p.file})`);
    const covers = p.covers ?? [];
    const oqs = p.blocked_by_oqs ?? [];
    const triggers = p.demo_triggers ?? [];
    return `
<article class="phase ${tr.cls}" id="phase-${esc(p.num)}">
  <div class="phase-head">
    <span class="pnum">${esc(p.num)}</span>
    <div class="phase-title">
      <h3>${esc(p.title)}</h3>
      <div class="badges">
        <span class="badge trk">${esc(p.track)}</span>
        <span class="badge dep">${esc(after)}</span>
        <span class="badge est">${esc(p.est_sessions)}</span>
        ${p.file ? `<a class="badge doc" href="${esc(p.file)}">plan doc &nearr;</a>` : ''}
        <span class="badge dep">${esc(covers.length)} item${covers.length === 1 ? '' : 's'} covered</span>
      </div>
    </div>
  </div>
  <p class="goal">${esc(p.goal_short || p.goal)}</p>
  <div class="items">${covers.map(itemChip).join('')}</div>
  ${oqs.length ? `<p class="oqs">Open questions: ${oqs.map((q) => `<a href="${esc(oqHref(q))}">${esc(q)}</a>`).join(' · ')}</p>` : ''}
  ${
    triggers.length || p.risks
      ? `<details>
    <summary>Demo triggers and risks</summary>
    ${triggers.length ? `<ul class="checks">${triggers.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="psum">No new demo triggers: this phase demos through normal use.</p>'}
    ${p.risks ? `<p class="psum"><b>Risks.</b> ${esc(p.risks)}</p>` : ''}
  </details>`
      : ''
  }
  <details>
    <summary>What to check when it's done</summary>
    <ul class="checks">
${(p.checks ?? []).map((c) => `      <li>${esc(c)}</li>`).join('\n')}
    </ul>
  </details>
  ${
    prompt
      ? `<div class="prompt-wrap">
    <div class="prompt-bar">
      <span>Kick-off prompt - paste into a fresh Claude Code session</span>
      <button class="copy" data-target="prompt-${esc(p.num)}">Copy</button>
    </div>
    <pre id="prompt-${esc(p.num)}">${esc(prompt.trim())}</pre>
  </div>`
      : `<div class="callout"><p><strong>Kick-off prompt missing.</strong> Expected <code>${esc(p.prompt_file ?? '')}</code>.</p></div>`
  }
</article>`;
  })
  .join('\n');

const phasesSection = `
<section>
  <h2>The phases</h2>
  <div class="rule"></div>
  ${legend()}
${articles}
</section>`;

const parked = plan.parked ?? [];
const milestones = plan.milestones ?? [];
const tailSection = `
<section>
  <h2>Parked</h2>
  <div class="rule"></div>
  <p class="prose-p">In scope, but deliberately not planned yet.</p>
  <ul class="defects">
${parked
  .map((x) => {
    const it = itemById.get(x.id);
    return `    <li class="keep"><b>${esc(x.id)}${it?.title ? ` · ${esc(it.title)}` : ''}</b> ${itemChip(x.id)}<br>${esc(x.reason)}</li>`;
  })
  .join('\n')}
  </ul>
</section>

<section>
  <h2>Milestones</h2>
  <div class="rule"></div>
  <p class="prose-p">What a workshop can be shown once each milestone phase is done.</p>
  <ul class="defects ms">
${milestones.map((m) => `    <li><b><a href="#phase-${esc(m.after)}">After phase ${esc(m.after)}</a></b><br>${esc(m.can_show)}</li>`).join('\n')}
  </ul>
</section>`;

// ---------- page ----------

// CSS: the original build plan's (docs/prototype-build/index.html), then additions.
const BASE_CSS = `:root {
  --paper:#f7f3ec; --paper-2:#efe9de; --card:#fffdf8; --ink:#211d16; --ink-2:#574e40; --ink-3:#8a7f6c;
  --rust:#b3400f; --rust-deep:#8a3009; --rust-soft:#f4e0d4;
  --green:#2c6e49; --green-soft:#e3efe6; --amber:#9a6a08; --amber-soft:#f6ecd4;
  --plum:#7a4a63; --plum-soft:#f0e2ea;
  --line:#ddd3c2; --mono:'JetBrains Mono',monospace;
}
* { box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { margin:0; background:var(--paper); color:var(--ink); font:16px/1.62 'Archivo',sans-serif;
  background-image:radial-gradient(circle at 12% -4%, rgba(179,64,15,.06), transparent 38%),
  radial-gradient(circle at 110% 8%, rgba(44,110,73,.05), transparent 32%); }
.wrap { max-width:1080px; margin:0 auto; padding:0 28px 120px; }
a { color:var(--rust); }
.hero { padding:64px 0 32px; border-bottom:3px solid var(--ink); }
.kicker { font:600 12px/1 var(--mono); letter-spacing:.22em; text-transform:uppercase; color:var(--rust); margin:0 0 16px; }
h1 { font:900 clamp(40px,6vw,72px)/0.98 'Fraunces',serif; letter-spacing:-.015em; margin:0 0 10px; }
h1 em { font-style:italic; font-weight:300; color:var(--rust); }
.hero-sub { max-width:760px; font-size:18px; color:var(--ink-2); margin:16px 0 0; }
.stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); border:1.5px solid var(--ink); margin:34px 0 0; background:var(--card); }
.stat { padding:16px 20px 12px; border-right:1.5px solid var(--ink); }
.stat:last-child { border-right:none; }
.stat b { display:block; font:700 30px/1 'Fraunces',serif; }
.stat span { font:600 11px/1.4 var(--mono); letter-spacing:.08em; text-transform:uppercase; color:var(--ink-3); }
h2 { font:700 32px/1.1 'Fraunces',serif; margin:58px 0 6px; }
.rule { height:3px; background:var(--ink); width:64px; margin:10px 0 20px; }
.prose p { max-width:770px; }
ol.howto { max-width:770px; padding-left:22px; }
ol.howto li { margin:10px 0; }
ol.howto b { font-family:'Fraunces',serif; }
.callout { background:var(--card); border:1.5px solid var(--ink); border-left:6px solid var(--rust); padding:16px 20px; max-width:790px; margin:22px 0; }
.callout.green { border-left-color:var(--green); }
.flow { font:600 13px var(--mono); background:var(--card); border:1px solid var(--line); padding:18px 22px; margin:20px 0; line-height:2.1; max-width:840px; }
.flow .fnode { background:var(--paper-2); padding:3px 8px; border-radius:3px; white-space:nowrap; }
.flow .fpar { color:var(--green); }
.scorecard { width:100%; border-collapse:collapse; margin:18px 0 8px; max-width:960px; background:var(--card); border:1.5px solid var(--ink); }
.scorecard th, .scorecard td { text-align:left; padding:11px 16px; border-bottom:1px solid var(--line); font-size:14.5px; vertical-align:top; }
.scorecard th { font:600 11px var(--mono); letter-spacing:.08em; text-transform:uppercase; color:var(--ink-3); background:var(--paper-2); }
.scorecard tr:last-child td { border-bottom:none; }
.scorecard .read { color:var(--ink-2); font-size:13.5px; }
.tag { font:600 10.5px var(--mono); letter-spacing:.04em; text-transform:uppercase; padding:2px 7px; border-radius:3px; white-space:nowrap; }
.tag.a { background:var(--rust-soft); color:var(--rust-deep); }
.tag.b { background:var(--green-soft); color:var(--green); }
.tag.c { background:var(--plum-soft); color:var(--plum); }
.tag.hi { background:var(--rust); color:#fff; }
.defects { list-style:none; margin:18px 0 0; padding:0; max-width:850px; }
.defects li { background:var(--card); border:1px solid var(--line); border-left:5px solid var(--rust); padding:13px 18px; margin-bottom:10px; font-size:14.5px; color:var(--ink-2); }
.defects li b { color:var(--ink); font-family:'Fraunces',serif; }
.defects li.keep { border-left-color:var(--ink-3); }
.defects code, .prose code, .scorecard code { font:600 12px var(--mono); background:var(--paper-2); padding:1px 5px; border-radius:3px; color:var(--rust-deep); }
.phase { background:var(--card); border:1.5px solid var(--ink); margin:0 0 26px; padding:24px 26px 22px; }
.phase.setup { border-left:6px solid var(--ink); }
.phase.trackA { border-left:6px solid var(--rust); }
.phase.trackB { border-left:6px solid var(--green); }
.phase.trackC { border-left:6px solid var(--plum); }
.phase-head { display:flex; gap:18px; align-items:flex-start; }
.pnum { font:300 46px/1 'Fraunces',serif; font-style:italic; color:var(--rust); flex:none; min-width:64px; }
.phase-title h3 { font:700 23px/1.15 'Fraunces',serif; margin:2px 0 8px; }
.badges { display:flex; flex-wrap:wrap; gap:6px; }
.badge { font:600 10.5px/1 var(--mono); letter-spacing:.06em; text-transform:uppercase; padding:4px 8px; border-radius:3px; text-decoration:none; }
.badge.dep { background:var(--paper-2); color:var(--ink-2); }
.badge.est { background:var(--rust-soft); color:var(--rust-deep); }
.badge.trk { background:var(--ink); color:var(--paper); }
.badge.doc { border:1px solid var(--line); color:var(--rust); }
.badge.doc:hover { background:var(--rust); color:#fff; border-color:var(--rust); }
.badge.hi { background:var(--rust); color:#fff; }
.goal { margin:14px 0 12px; color:var(--ink-2); font-size:15px; }
details { border-top:1px dashed var(--line); padding-top:10px; margin-bottom:14px; }
summary { font:600 12px var(--mono); letter-spacing:.05em; text-transform:uppercase; color:var(--rust); cursor:pointer; }
.psum { font-size:13.5px; color:var(--ink-2); max-width:880px; }
.checks { font-size:13px; color:var(--ink-2); padding-left:20px; }
.checks li { margin:6px 0; }
.prompt-wrap { border:1px solid var(--line); }
.prompt-bar { display:flex; justify-content:space-between; align-items:center; background:var(--ink); color:var(--paper); padding:8px 14px; font:600 11px var(--mono); letter-spacing:.06em; text-transform:uppercase; }
.copy { font:600 11px var(--mono); background:var(--rust); color:#fff; border:none; padding:6px 14px; border-radius:3px; cursor:pointer; }
.copy:hover { background:var(--rust-deep); }
.copy.done { background:var(--green); }
pre { margin:0; padding:16px 18px; font:400 12px/1.7 var(--mono); white-space:pre-wrap; background:#fbf9f4; color:var(--ink-2); max-height:360px; overflow:auto; }
footer { margin-top:80px; border-top:3px solid var(--ink); padding-top:16px; font:400 12.5px var(--mono); color:var(--ink-3); display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; }
@media print { pre { max-height:none; } body { background:#fff; } }`;

const EXTRA_CSS = `
/* catch-up additions, drawn from the same palette */
.hero-meta { font:600 12px/1.6 var(--mono); color:var(--ink-3); margin:14px 0 0; letter-spacing:.02em; }
.hero-meta code { font:600 12px var(--mono); background:var(--paper-2); padding:1px 5px; border-radius:3px; color:var(--rust-deep); }
.prose-p { max-width:770px; }
.note { font-size:14px; color:var(--ink-3); }
.tag.d { background:var(--amber-soft); color:var(--amber); }
.tag.e { background:var(--ink); color:var(--paper); }
.tag.f { background:var(--paper-2); color:var(--ink-2); border:1px solid var(--line); }
.phase.trackD { border-left:6px solid var(--amber); }
.phase.trackE { border-left:6px solid var(--ink-3); }
.tscroll { overflow-x:auto; max-width:100%; }
.scorecard td.n, .scorecard th.n { text-align:right; font-variant-numeric:tabular-nums; }
.scorecard tr.tot td { background:var(--paper-2); }
.epics td { padding:9px 12px; }
.barcell { min-width:180px; width:30%; vertical-align:middle !important; }
.bar { display:flex; height:14px; border:1px solid var(--ink); background:var(--paper-2); overflow:hidden; }
.bar span { display:block; height:100%; }
.v-con { background:var(--rust); }
.v-par { background:var(--amber); }
.v-mis { background:var(--plum); }
.v-mat { background:var(--green); }
.v-grp { background:var(--line); }
.v-oos { background:var(--ink-3); }
.v-dm { background:var(--ink); }
.v-rv { background:var(--rust-deep); }
.v-unk { background:var(--paper-2); }
.legend { display:flex; flex-wrap:wrap; gap:6px 16px; font:600 11px var(--mono); letter-spacing:.05em; text-transform:uppercase; color:var(--ink-3); margin:12px 0 4px; }
.legend span { display:inline-flex; align-items:center; gap:6px; }
.legend i { display:inline-block; width:11px; height:11px; border:1px solid var(--ink); }
ol.themes { max-width:850px; padding:0; list-style:none; counter-reset:th; margin:18px 0 0; }
ol.themes li { counter-increment:th; background:var(--card); border:1px solid var(--line); border-left:5px solid var(--rust); padding:13px 18px 8px; margin-bottom:10px; }
ol.themes li p { margin:6px 0; font-size:14.5px; color:var(--ink-2); }
.th-head { display:flex; gap:10px; align-items:baseline; flex-wrap:wrap; }
.th-head b { font:700 17px/1.25 'Fraunces',serif; color:var(--ink); }
.th-head b::before { content:counter(th) ". "; color:var(--rust); }
.th-meta { font:600 11.5px var(--mono); color:var(--ink-3) !important; }
.items { display:flex; flex-wrap:wrap; gap:5px; margin:0 0 12px; }
.it { display:inline-flex; align-items:center; gap:6px; font:600 11px/1 var(--mono); background:var(--paper-2); border-radius:3px; padding:4px 7px; }
.it > i { display:inline-block; width:8px; height:8px; border-radius:50%; flex:none; }
.it a { text-decoration:none; color:var(--ink); }
.it a:hover { color:var(--rust); text-decoration:underline; }
.it a.brd { font-weight:400; font-size:10px; color:var(--ink-3); text-transform:uppercase; letter-spacing:.05em; }
.oqs { font:600 11.5px var(--mono); color:var(--ink-3); margin:0 0 12px; }
.defects.ms li { border-left-color:var(--green); }
.defects li .it { margin-left:6px; vertical-align:middle; }
@media (max-width:640px) { .wrap { padding:0 16px 80px; } .phase { padding:18px 16px; } .phase-head { gap:12px; } .pnum { font-size:34px; min-width:44px; } }`;

const COPY_SCRIPT = `document.querySelectorAll('.copy').forEach(function (b) {
  b.addEventListener('click', function () {
    var text = document.getElementById(b.getAttribute('data-target')).textContent;
    navigator.clipboard.writeText(text).then(function () {
      b.textContent = 'Copied'; b.classList.add('done');
      setTimeout(function () { b.textContent = 'Copy'; b.classList.remove('done'); }, 1800);
    });
  });
});`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AA Prototype · Requirements Catch-up</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700;9..144,900&family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
${BASE_CSS}
${EXTRA_CSS}
</style>
</head>
<body>
<!-- Generated by docs/prototype-build/catch-up/tools/build-index.mjs. Do not edit by hand: edit plan.json, gaps.json or the phase prompt files and re-run it. -->
<div class="wrap">
${hero}
${themesSection}
${glanceSection}
${howSection}
${tableSection}
${phasesSection}
${tailSection}

</div>
<footer class="wrap" style="padding-top:0">
  <span>AA prototype requirements catch-up · catalogue ${esc(shortCommit)} · gap analysis ${esc(generated)} · rendered by tools/build-index.mjs from plan.json and gaps.json</span>
  <span>docs/prototype-build/catch-up/index.html</span>
</footer>

<script>
${COPY_SCRIPT}
</script>
</body>
</html>
`;

writeFileSync(OUT, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`Wrote ${OUT} (${kb} KB): ${phases.length} phases, ${promptsFound} prompts, ${themes.length} themes, ${(gaps.epics ?? []).length} epics, ${totalSessions} est. sessions.`);
if (warnings.length) {
  console.warn(`${warnings.length} warning(s):`);
  for (const w of warnings) console.warn(`  - ${w}`);
}
