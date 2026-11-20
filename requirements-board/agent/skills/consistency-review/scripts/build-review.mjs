// Assembles the stage-2 workflow output (from its journal) into changes.json and a local review page.
// Usage: node build-review.mjs --journal <journal.jsonl> --rulings <rulings.md> --out <run dir> --baseline <commit>
//          [--repo <repo root, default .>] [--req <catalogue dir relative to the repo, default requirements-board/requirements>]
//          [--storage-key <localStorage key prefix, default consistency-review>] [--protected <AR ids, comma separated>]
// Reads <out>/fixups.json and <out>/question-fixups.json when present (hand corrections that survive rebuilds).
// Writes <out>/changes.json and <out>/review.html. Edit paths in changes.json are relative to the repo root.
// Every change and question carries a fingerprint (fp) of what it proposes; decisions on the page are kept by it.
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { esc, inline, shell } from './page-kit.mjs'
import { makeResolver, refCss, refClient, dataTag } from './ref-kit.mjs'
import { fingerprint, makeGuard, questionFingerprint, seriesId } from './guard.mjs'

const { values: a } = parseArgs({ options: {
  journal: { type: 'string' }, rulings: { type: 'string' }, out: { type: 'string' }, baseline: { type: 'string' },
  repo: { type: 'string', default: '.' }, req: { type: 'string', default: 'requirements-board/requirements' },
  'storage-key': { type: 'string', default: 'consistency-review' }, protected: { type: 'string' },
} })
for (const k of ['journal', 'rulings', 'out', 'baseline']) if (!a[k]) { console.error(`missing --${k}\n` + fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 6).join('\n')); process.exit(2) }
const { journal: journalPath, rulings: rulingsPath, repo, out, baseline } = a
const REQ_REL = a.req.replace(/\/+$/, '')
// Protected artifacts come from the run's arguments and are recorded in changes.json for apply.mjs. Left out, nothing
// is protected, so say so: an empty --protected "" states that the run has none.
if (a.protected === undefined) console.error('WARNING: no --protected given, so no artifact is protected in this run. Pass the protectedArtifacts ids (comma separated), or --protected "" if there are none.')
const protectedIds = (a.protected ?? '').split(/[\s,]+/).filter(Boolean)
const guard = makeGuard({ repo, req: REQ_REL, protectedIds })
if (guard.unknownProtected.length) console.error(`WARNING: --protected names no artifact in the catalogue: ${guard.unknownProtected.join(', ')} (a misspelt id protects nothing).`)
const lc = (s) => String(s ?? '').trim().toLowerCase()

// ---------- read journal
const labels = {}
const results = {}
for (const line of fs.readFileSync(journalPath, 'utf8').split('\n')) {
  if (!line.trim()) continue
  const e = JSON.parse(line)
  if (e.type === 'started') labels[e.key] = e.label
  if (e.type === 'result') results[e.key] = e.result
}
const byLabel = {}
for (const [k, r] of Object.entries(results)) if (labels[k] && r) byLabel[labels[k]] = r

// verify runs, keyed exactly as the workflow keyed them
const findings = {}
const proposedQuestions = []
let rawCount = 0
for (const [label, r] of Object.entries(byLabel)) {
  if (label.startsWith('find:')) rawCount += r.findings?.length ?? 0
  if (!label.startsWith('verify:')) continue
  (r.verified ?? []).forEach((f, i) => { findings[`${label.replace('verify:', '')}/${i + 1}`] = f })
  proposedQuestions.push(...(r.newQuestions ?? []))
}
const consolidations = Object.entries(byLabel).filter(([l]) => l.startsWith('consolidate:')).map(([l, r]) => ({ group: l.replace('consolidate:', ''), ...r }))

// ---------- catalogue lookups
const REQ = path.join(repo, REQ_REL)
const titles = {}
for (const f of fs.readdirSync(path.join(REQ, 'stories'))) {
  const m = fs.readFileSync(path.join(REQ, 'stories', f), 'utf8').match(/^title:\s*(.*)$/m)
  if (m) titles[f.replace('.md', '')] = m[1].replace(/^"|"$/g, '')
}
for (const f of fs.readdirSync(path.join(REQ, 'artifacts')).filter((f) => /^AR-\d+\.md$/.test(f))) {
  const m = fs.readFileSync(path.join(REQ, 'artifacts', f), 'utf8').match(/^title:\s*(.*)$/m)
  if (m) titles[f.replace('.md', '')] = m[1].replace(/^"|"$/g, '')
}
const rulings = {}
for (const line of fs.readFileSync(rulingsPath, 'utf8').split('\n')) {
  const m = line.match(/^- \*\*([A-Z]-\d+)\*?\*?\s*(.*)$/)
  if (m) rulings[m[1]] = m[2].replace(/\*\*/g, '').replace(/_/g, '').slice(0, 400)
}

// ---------- assemble changes
// agents may give absolute or repo-relative paths: keep the part from the catalogue folder on
// An absolute path is made relative to this repository, so a path into another tree stays outside the catalogue and
// is refused (never silently re-pointed at this repository's file).
const norm = (p) => { if (path.isAbsolute(p)) return path.relative(path.resolve(repo), p); const i = p.indexOf(REQ_REL + '/'); return i >= 0 ? p.slice(i) : p }
const dedupe = (arr, key) => { const s = new Set(); return arr.filter((x) => { const k = key(x); if (s.has(k)) return false; s.add(k); return true }) }
const changes = []
const usedKeys = new Set()
// Exact duplicates (same file, old and new) are one edit; the same old text with a different new is kept twice and flagged.
const editKey = (e) => JSON.stringify([e.file, e.old, e.new])
for (const c of consolidations) {
  for (const ch of c.changes ?? []) {
    const fs_ = ch.keys.map((k) => findings[k]).filter(Boolean)
    ch.keys.forEach((k) => usedKeys.add(k))
    const edits = (ch.editsOverride?.length ? ch.editsOverride : fs_.flatMap((f) => f.edits ?? [])).concat(ch.extraEdits ?? [])
    changes.push({
      title: ch.title, size: ch.size, topic: ch.topic, why: ch.why, confidence: ch.confidence, keys: ch.keys, group: c.group,
      items: [...new Set(fs_.flatMap((f) => f.items ?? []).concat(edits.map((e) => path.basename(e.file).replace(/\.(md|svg)$/, ''))))],
      evidence: dedupe(fs_.flatMap((f) => f.evidence ?? []), (e) => e.cite + e.quote),
      rulings: [...new Set(fs_.flatMap((f) => f.rulings ?? []))],
      edits: dedupe(edits.map((e) => ({ ...e, file: norm(e.file) })), editKey),
      said: ch.action ?? (fs_.length && fs_.every((f) => f.action === fs_[0].action) ? fs_[0].action : undefined),
    })
  }
}
const dropped = consolidations.flatMap((c) => c.dropped ?? [])
for (const [k, f] of Object.entries(findings)) {
  if (usedKeys.has(k) || dropped.find((d) => d.key === k)) continue
  changes.push({ title: f.summary, size: f.size, topic: f.topic, why: `${f.summary} ${f.change} (Not reviewed by the final pass.)`, confidence: 'medium', keys: [k], group: 'unreviewed',
    items: f.items ?? [], evidence: f.evidence ?? [], rulings: f.rulings ?? [], edits: dedupe((f.edits ?? []).map((e) => ({ ...e, file: norm(e.file) })), editKey), said: f.action, unreviewed: true })
}

// Questions: the consolidators' first (numbered as before, so question-fixups keep their meaning), then every
// verifier question no consolidator kept, merged or dismissed, marked as not reviewed by the final pass.
const kept = dedupe(consolidations.flatMap((c) => c.newQuestions ?? []), (q) => lc(q.title))
const coveredQ = new Set(kept.flatMap((q) => [q.title, ...(q.from ?? [])]).map(lc))
// A dismissal counts only with a reason, which changes.json records so it can be inspected.
const dismissedQuestions = dedupe(consolidations.flatMap((c) => (c.dismissedQuestions ?? []).filter((d) => String(d?.reason ?? '').trim()).map((d) => ({ ...d, group: c.group }))), (d) => lc(d.title))
  .filter((d) => !coveredQ.has(lc(d.title)))
const dismissedQ = new Set(dismissedQuestions.map((d) => lc(d.title)))
const unkept = dedupe(proposedQuestions.filter((q) => !coveredQ.has(lc(q.title)) && !dismissedQ.has(lc(q.title))), (q) => lc(q.title))
const questions = [...kept, ...unkept.map((q) => ({ ...q, unreviewed: true }))].map(({ from, ...q }) => ({ ...q, affects: q.affects ?? [], body: q.body ?? '' }))

// hand fixups: replace an edit (matched by file, old and a fragment of new) with a corrected one
const fixPath = path.join(out, 'fixups.json')
const fixups = fs.existsSync(fixPath) ? JSON.parse(fs.readFileSync(fixPath, 'utf8')) : []
for (const ch of changes) ch.edits = ch.edits.map((e) => { const f = fixups.find((x) => x.file === e.file && x.old === e.old && e.new.includes(x.newContains)); return f ? { file: e.file, ...f.edit, fixed: true } : e })

// ---------- what each change asks for: edits to apply, a redraw, or a flag to acknowledge
// A redraw is a diagram change too big for a text swap, on an artifact that is neither protected nor retired.
// Without an action from the agents (journals from before actions existed) a diagram verifier's edit-less change
// is taken as a redraw request.
const artifactIds = (ch) => [...new Set(ch.items.filter((i) => /^AR-\d+$/.test(i)))]
for (const ch of changes) {
  const live = artifactIds(ch).filter((id) => !guard.isProtected(id) && !guard.isRetiredArtifact(id))
  const asksRedraw = ch.said ? ch.said === 'redraw' : ch.keys.some((k) => /^diagrams\./.test(k))
  ch.action = ch.edits.length ? 'edit' : asksRedraw && live.length ? 'redraw' : 'flag'
  if (ch.action === 'redraw') ch.redraw = live // the diagrams to redraw, for Stage 4 (changes.json)
  ch.needsRedraw = ch.action === 'redraw'
  delete ch.said
}

// ---------- validate edits: inside the catalogue, applies exactly once, a change's edits apply together,
// no clashes between changes
const fileCache = {}
const readRepo = (f) => { const p = guard.target(f); return (fileCache[p] ??= fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null) }
const spans = {}
const order = { large: 0, medium: 1, small: 2 }
changes.sort((a, b) => order[a.size] - order[b.size] || a.topic.localeCompare(b.topic))
const counters = { large: 0, medium: 0, small: 0 }
const totals = { large: 0, medium: 0, small: 0 }
for (const ch of changes) totals[ch.size]++
const applyAll = (text, es) => { for (const e of es) { if (text.split(e.old).length !== 2) return null; text = text.replace(e.old, () => e.new) } return text }
for (const ch of changes) {
  ch.id = seriesId(ch.size[0].toUpperCase(), ++counters[ch.size], totals[ch.size])
  for (const e of ch.edits) {
    const why = guard.refusal(e.file, e.old)
    if (why) { e.problem = `refused: ${why}`; continue }
    const text = readRepo(e.file)
    if (text == null) { e.problem = 'file not found'; continue }
    const first = text.indexOf(e.old)
    if (first < 0) { e.problem = 'text not found in file'; continue }
    if (text.indexOf(e.old, first + 1) >= 0) { e.problem = 'text occurs more than once'; continue }
    e.at = first
  }
  // the same text replaced two ways in one change
  for (const e of ch.edits) if (ch.edits.some((x) => x !== e && x.file === e.file && x.old === e.old && x.new !== e.new)) e.problem ??= 'conflicts with another edit of this change (same text, different replacement)'
  // the change's own edits, in order: each must still apply after the ones before it
  const byFile = {}
  for (const e of ch.edits) if (!e.problem) (byFile[e.file] ??= []).push(e)
  for (const [file, es] of Object.entries(byFile)) {
    let text = readRepo(file)
    for (const e of es) {
      if (text.split(e.old).length !== 2) { e.problem = 'no longer applies after an earlier edit of this change'; continue }
      text = text.replace(e.old, () => e.new)
    }
  }
  for (const e of ch.edits) if (!e.problem) (spans[e.file] ??= []).push({ ch: ch.id, e })
}
// two changes clash on a file if applying one stops the other's edits from applying (either order)
for (const [file, list] of Object.entries(spans)) {
  const byCh = {}
  for (const s of list) (byCh[s.ch] ??= []).push(s.e)
  const ids = Object.keys(byCh)
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const t = readRepo(file), a = byCh[ids[i]], b = byCh[ids[j]]
    const ab = applyAll(t, a) != null && applyAll(applyAll(t, a) ?? '', b) != null
    const ba = applyAll(t, b) != null && applyAll(applyAll(t, b) ?? '', a) != null
    if (!ab || !ba) { a.forEach((e) => (e.problem ??= `clashes with an edit in ${ids[j]}`)); b.forEach((e) => (e.problem ??= `clashes with an edit in ${ids[i]}`)) }
  }
}
for (const ch of changes) ch.fp = fingerprint(ch)

questions.forEach((q, i) => { q.id = seriesId('Q', i + 1, questions.length); q.srcFp = questionFingerprint(q) })
// hand question fixups: drop answered questions, fold duplicates into another, rewrite. Keys are Q-nn@<srcFp>
// (bound to that question) or a plain Q-nn, which is pinned to the question it first acted on and skipped once
// that id names a different question (after a re-run of stage 2, or when more questions are found).
const qfixPath = path.join(out, 'question-fixups.json')
const qfix = fs.existsSync(qfixPath) ? JSON.parse(fs.readFileSync(qfixPath, 'utf8')) : {}
const questionPins = (() => { try { return JSON.parse(fs.readFileSync(path.join(out, 'changes.json'), 'utf8')).questionPins ?? {} } catch { return {} } })()
const fixWarn = (m) => console.error(`question-fixups: ${m}`)
function fixTarget(key) {
  const m = String(key).match(/^(Q-\d+)(?:@([0-9a-f]{12}))?$/)
  if (!m) { fixWarn(`${key} is not a question id; skipped`); return null }
  if (m[2]) {
    const q = questions.find((x) => x.srcFp === m[2])
    if (!q) fixWarn(`${key} matches no question in this build; skipped`)
    return q ?? null
  }
  const q = questions.find((x) => x.id === m[1])
  if (!q) { fixWarn(`${key} matches no question in this build; skipped`); return null }
  if (questionPins[m[1]] && questionPins[m[1]] !== q.srcFp) {
    fixWarn(`${key} was written for another question; ${m[1]} is now "${q.title}". Skipped: write it as ${q.id}@${q.srcFp} if it is meant for this one`)
    return null
  }
  if (!questionPins[m[1]]) fixWarn(`${key} has no fingerprint; pinned to "${q.title}" (${q.id}@${q.srcFp})`)
  questionPins[m[1]] = q.srcFp
  return q
}
for (const [from, to] of Object.entries(qfix.merge ?? {})) {
  const a = fixTarget(from), b = fixTarget(to)
  if (a && b) { b.body += ` (Also covers ${a.id}: ${a.body})`; b.affects = [...new Set([...b.affects, ...a.affects])]; a.gone = true }
}
for (const k of Object.keys(qfix.remove ?? {})) { const q = fixTarget(k); if (q) q.gone = true }
for (const [k, v] of Object.entries(qfix.rewrite ?? {})) { const q = fixTarget(k); if (q && !q.gone) Object.assign(q, v) }
questions.splice(0, questions.length, ...questions.filter((q) => !q.gone))
for (const q of questions) { delete q.gone; q.fp = questionFingerprint(q) }
fs.writeFileSync(path.join(out, 'changes.json'), JSON.stringify({ baseline, req: REQ_REL, protected: protectedIds, changes, questions, dismissedQuestions, dropped, rawCount, findings: Object.keys(findings).length, questionPins }, null, 2))

// ---------- word diff
function diff(a, b) {
  const tok = (s) => s.split(/(\s+|[.,;:()"/])/).filter((x) => x !== '')
  const A = tok(a), B = tok(b)
  if (A.length * B.length > 4e6) return { del: esc(a), ins: esc(b) }
  const dp = Array.from({ length: A.length + 1 }, () => new Uint32Array(B.length + 1))
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  let i = 0, j = 0, html = ''
  while (i < A.length || j < B.length) {
    if (i < A.length && j < B.length && A[i] === B[j]) { html += esc(A[i]); i++; j++ }
    else if (i < A.length && (j >= B.length || dp[i + 1][j] >= dp[i][j + 1])) { html += `<del>${esc(A[i])}</del>`; i++ }
    else { html += `<ins>${esc(B[j])}</ins>`; j++ }
  }
  return { merged: html.replace(/<\/ins><ins>/g, '').replace(/<\/del><del>/g, '') }
}

// ---------- render
const label = (id) => titles[id] ? `${esc(titles[id])} <span class="id mono">${esc(id)}</span>` : id === 'domain-model' ? 'Domain model' : `<span class="mono">${esc(id)}</span>`
const typeOf = (id) => id.startsWith('EP') ? 'epic' : id.startsWith('FT') ? 'feature' : id.startsWith('US') ? 'story' : id.startsWith('AR') ? 'artifact' : 'other'
// the friendly label, then the full repo-relative path, so the reader sees exactly where an edit lands
const fileLabel = (f) => { const b = path.basename(f).replace(/\.(md|svg)$/, ''); return `${f.endsWith('.svg') ? `${label(b)} <span class="tag">drawing</span>` : label(b)} <span class="path mono">${esc(f)}</span>` }
const actionPill = (ch) => ch.action === 'redraw' ? '<span class="pill redraw">needs redrawing</span>' : ch.action === 'flag' ? '<span class="pill flag">flag only</span>' : ''

function changeCard(ch) {
  const edits = ch.edits.map((e) => {
    const d = diff(e.old, e.new)
    return `<div class="edit${e.problem ? ' bad' : ''}"><div class="efile">${fileLabel(e.file)}${e.problem ? `<span class="warn">Edit will not apply: ${esc(e.problem)}</span>` : ''}</div>
${d.merged != null ? `<div class="diff">${d.merged}</div>` : `<div class="diff"><del>${d.del}</del></div><div class="diff"><ins>${d.ins}</ins></div>`}</div>`
  }).join('')
  const held = ch.edits.some((e) => e.problem) ? `<p class="held">If accepted as it is, none of this change's edits will be applied: a change applies whole or not at all.</p>` : ''
  const flagNote = ch.action === 'flag' ? `<p class="sub">No edits: accepting acknowledges it; any follow-up is done by hand or as a question.</p>` : ''
  return `<article class="change card s-${ch.size}" id="${ch.id}" data-id="${ch.id}" data-fp="${ch.fp}" data-size="${ch.size}" data-topic="${esc(ch.topic)}">
<header><div class="ttl"><span class="cid mono">${ch.id}</span><h4>${esc(ch.title)}</h4></div>
<div class="meta"><span class="pill size-${ch.size}">${ch.size}</span>${ch.confidence === 'medium' ? '<span class="pill conf">check closely</span>' : ''}${ch.unreviewed ? '<span class="pill conf">not reviewed by the final pass</span>' : ''}${actionPill(ch)}</div></header>
<p class="why">${inline(ch.why)}</p>
<div class="items">${ch.items.map((i) => `<span class="item ty-${typeOf(i)}">${label(i)}</span>`).join('')}</div>
${edits ? `<div class="edits">${edits}</div>` : ''}${held}${flagNote}
<details class="ev"><summary>Evidence${ch.rulings.length ? ` and rulings (${ch.rulings.join(', ')})` : ''}</summary>
${ch.rulings.map((r) => `<div class="rule"><span class="mono">${esc(r)}</span> ${inline(rulings[r] ?? '')}</div>`).join('')}
${ch.evidence.map((e) => `<blockquote>${esc(e.quote)}<cite>${esc(e.cite)}</cite></blockquote>`).join('')}</details>
<footer class="decide"><button data-v="accept">Accept</button><button data-v="reject">Reject</button><button data-v="change">Change it…</button>
<textarea placeholder="How should it change?" hidden></textarea></footer></article>`
}

const topicsOf = (size) => [...new Set(changes.filter((c) => c.size === size).map((c) => c.topic))]
const section = (size, blurb) => {
  const list = changes.filter((c) => c.size === size)
  if (!list.length) return ''
  return `<section id="sec-${size}"><h2><span class="pill size-${size}">${size}</span> ${list.length} change${list.length > 1 ? 's' : ''}</h2><p class="sub">${blurb}</p>
${topicsOf(size).map((t) => `<details class="topic" ${size === 'small' ? '' : 'open'}><summary>${esc(t)} <span class="sub">(${list.filter((c) => c.topic === t).length})</span></summary>${list.filter((c) => c.topic === t).map(changeCard).join('')}</details>`).join('')}</section>`
}
const qCards = questions.map((q) => `<article class="change card q" id="${q.id}" data-id="${q.id}" data-fp="${q.fp}" data-size="question" data-topic="Questions">
<header><div class="ttl"><span class="cid mono">${q.id}</span><h4>${esc(q.title)}</h4></div>${q.unreviewed ? '<div class="meta"><span class="pill conf">not reviewed by the final pass</span></div>' : ''}</header>${q.body.split(/\n\s*\n/).map((para) => `<p class="why">${para.split('\n').map(inline).join('<br>')}</p>`).join('')}
<div class="items">${(q.affects ?? []).map((i) => `<span class="item ty-${typeOf(i)}">${label(i)}</span>`).join('')}</div>
<footer class="decide"><button data-v="accept">Add as open question</button><button data-v="reject">Skip</button><button data-v="change">Change it…</button><textarea placeholder="How should it change?" hidden></textarea></footer></article>`).join('')

const bad = changes.filter((c) => c.edits.some((e) => e.problem)).length
const nRedraw = changes.filter((c) => c.action === 'redraw').length
const nFlag = changes.filter((c) => c.action === 'flag').length
const css = `
.bar{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);padding:10px 0}
.bar .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.bar .prog{margin-left:auto;font-size:13px;color:var(--muted)}
.stats{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
.stat{padding:10px 14px;min-width:120px}.stat b{display:block;font-size:22px}
.size-large{background:var(--large-t);color:var(--large)}.size-medium{background:var(--medium-t);color:var(--medium)}.size-small{background:var(--small-t);color:var(--small)}
.pill.conf{background:var(--medium-t);color:var(--medium)}.pill.redraw{background:#e8eaf7;color:var(--artifact)}.pill.flag{background:var(--bg);color:var(--muted);border:1px solid var(--line)}
details.topic{margin:10px 0}details.topic>summary{cursor:pointer;font-weight:600;font-size:16px;padding:6px 0}
.change{margin:12px 0;padding:14px 16px;border-left:4px solid var(--line)}
.change.s-large{border-left-color:var(--large)}.change.s-medium{border-left-color:var(--medium)}.change.s-small{border-left-color:var(--small)}.change.q{border-left-color:var(--teal)}
.change header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.ttl{display:flex;gap:10px;align-items:baseline}.ttl h4{margin:0;font-size:16px}
.cid{color:var(--faint);font-size:12px}.meta{display:flex;gap:6px;flex-shrink:0}
.why{margin:8px 0}
.items{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}
.item{font-size:13px;padding:2px 8px;border-radius:6px;background:var(--bg);border-left:3px solid var(--line)}
.item.ty-epic{border-left-color:var(--epic)}.item.ty-feature{border-left-color:var(--feature)}.item.ty-story{border-left-color:var(--story)}.item.ty-artifact{border-left-color:var(--artifact)}
.id{color:var(--faint);font-size:11px;margin-left:4px}
.tag{font-size:11px;color:var(--artifact);margin-left:4px}
.path{font-size:11px;color:var(--faint);overflow-wrap:anywhere}
.held{color:var(--large);font-size:13px;margin:6px 0}
.stale{margin:12px 0;padding:10px 14px;border-left:4px solid var(--medium);font-size:14px}
.edit{border:1px solid var(--line);border-radius:8px;margin:8px 0;overflow:hidden}
.edit.bad{border-color:var(--large)}
.efile{font-size:13px;padding:6px 10px;background:var(--bg);border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center}
.warn{color:var(--large);font-weight:600;font-size:12px;margin-left:auto}
.diff{padding:8px 10px;white-space:pre-wrap;font-size:14px;line-height:1.6;overflow-wrap:anywhere}
del{background:var(--del);color:var(--del-ink);text-decoration:line-through;text-decoration-thickness:1px}
ins{background:var(--ins);color:var(--ins-ink);text-decoration:none}
details.ev{margin:8px 0;font-size:14px}details.ev summary{cursor:pointer;color:var(--muted)}
.rule{margin:6px 0;padding:6px 10px;background:var(--teal-t);border-radius:6px}
blockquote{margin:6px 0;padding:6px 12px;border-left:3px solid var(--line);color:var(--muted)}blockquote cite{display:block;font-style:normal;font-size:12px;color:var(--faint);margin-top:2px}
.decide{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid var(--line)}
.decide textarea{flex-basis:100%;font:inherit;padding:8px;border-radius:6px;border:1px solid var(--line);background:var(--paper);color:var(--ink);min-height:60px}
.change[data-state=accept]{background:color-mix(in srgb,var(--ins) 35%,var(--paper))}.change[data-state=accept] button[data-v=accept]{background:var(--teal);color:#fff;border-color:var(--teal)}
.change[data-state=reject]{opacity:.55}.change[data-state=reject] button[data-v=reject]{background:var(--ink);color:var(--paper)}
.change[data-state=change] button[data-v=change]{border-color:var(--teal);color:var(--teal)}
.hidden{display:none!important}
select{font:inherit;font-size:13px;padding:5px 8px;border-radius:7px;border:1px solid var(--line);background:var(--paper);color:var(--ink)}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--paper);padding:8px 16px;border-radius:8px;opacity:0;transition:opacity .2s}.toast.on{opacity:1}`

const body = `<div class="wrap">
<h1>Requirements consistency review</h1>
<div class="sub">Proposed changes to the catalogue at baseline <span class="mono">${esc(baseline)}</span>. Nothing has been applied. Decide each change, then copy or save your decisions and hand them back.</div>
<div class="stats">
<div class="card stat"><b>${changes.filter((c) => c.size === 'large').length}</b>large</div>
<div class="card stat"><b>${changes.filter((c) => c.size === 'medium').length}</b>medium</div>
<div class="card stat"><b>${changes.filter((c) => c.size === 'small').length}</b>small</div>
<div class="card stat"><b>${questions.length}</b>new questions</div>
<div class="card stat"><b>${rawCount}</b>raw flags → <b style="display:inline;font-size:inherit">${Object.keys(findings).length}</b> verified</div>
${nRedraw ? `<div class="card stat"><b>${nRedraw}</b>to redraw</div>` : ''}
${nFlag ? `<div class="card stat"><b>${nFlag}</b>flag only</div>` : ''}
${bad ? `<div class="card stat" style="color:var(--large)"><b>${bad}</b>with an edit that won't apply as written</div>` : ''}
</div>
<div class="card stale hidden" id="stale"></div>
<div class="bar"><div class="row">
<select id="fsize"><option value="">All sizes</option><option>large</option><option>medium</option><option>small</option><option value="question">questions</option></select>
<select id="fstate"><option value="">Any decision</option><option value="none">Undecided</option><option value="accept">Accepted</option><option value="reject">Rejected</option><option value="change">Change requested</option></select>
<button id="accSmall">Accept all small</button>
<button id="copy" class="primary">Copy decisions</button><button id="save">Save decisions file</button>
<span class="prog" id="prog"></span></div></div>
${section('large', 'A rule changes meaning, the fix spans several items, a status moves off agreed or confirmed, or a diagram needs redrawing.')}
${section('medium', 'Out-of-date or contradicting wording in one item that would change what someone builds.')}
${section('small', 'Retired terms, names, stale sources and phrasing. Collapsed by topic.')}
${questions.length ? `<section id="sec-q"><h2>New questions</h2><p class="sub">Things the reviewers found unsettled. Accepting adds an open question; it never changes a requirement.</p>${qCards}</section>` : ''}
</div><div class="toast" id="toast"></div>`

// Decisions are kept by fingerprint (what the change proposes), not by id: the same change keeps its decision under
// a new id after a rebuild, and a different change at an old id starts undecided. Entries saved by a page from
// before fingerprints (keyed by id) are never shown as current; they are listed to decide again.
const script = `
const KEY='${esc(a['storage-key'])}-${esc(baseline)}';let raw={};try{raw=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
const st={},legacy={};for(const[k,v]of Object.entries(raw)){if(k.startsWith('fp:'))st[k.slice(3)]=v;else legacy[k]=v}
const save=()=>{try{const o={...legacy};for(const[k,v]of Object.entries(st))o['fp:'+k]=v;localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}};
const cards=[...document.querySelectorAll('article.change')];
const fps=new Set(cards.map(c=>c.dataset.fp));
(function(){const old=[...Object.keys(legacy).filter(k=>legacy[k]&&legacy[k].v),...Object.entries(st).filter(([f,v])=>!fps.has(f)&&v&&v.v).map(([,v])=>v.id||'?')];
 if(!old.length)return;const el=document.getElementById('stale');el.textContent='Decided on an earlier build of this page, for changes that have since changed or could not be checked: '+old.join(', ')+'. Those decisions are not shown or exported; decide the changes again.';el.classList.remove('hidden')})();
const dec=c=>st[c.dataset.fp];
function paint(c){const s=dec(c);c.dataset.state=s?s.v:'';const ta=c.querySelector('textarea');ta.hidden=!(s&&s.v==='change');if(s&&s.note!=null&&ta.value!==s.note)ta.value=s.note}
function prog(){const n=cards.filter(dec).length;document.getElementById('prog').textContent=n+' of '+cards.length+' decided'}
cards.forEach(c=>{paint(c);c.querySelectorAll('button[data-v]').forEach(b=>b.onclick=()=>{const v=b.dataset.v;const cur=dec(c);
 if(cur&&cur.v===v&&v!=='change'){delete st[c.dataset.fp]}else{st[c.dataset.fp]={v,note:cur?cur.note:'',id:c.dataset.id}}save();paint(c);prog();filter();if(v==='change')c.querySelector('textarea').focus()});
 c.querySelector('textarea').oninput=e=>{st[c.dataset.fp]={v:'change',note:e.target.value,id:c.dataset.id};save()}});
const fs_=document.getElementById('fsize'),fst=document.getElementById('fstate');
function filter(){cards.forEach(c=>{const s=dec(c);const ok=(!fs_.value||c.dataset.size===fs_.value)&&(!fst.value||(fst.value==='none'?!s:s&&s.v===fst.value));c.classList.toggle('hidden',!ok)});
 document.querySelectorAll('details.topic').forEach(d=>d.classList.toggle('hidden',![...d.querySelectorAll('article')].some(a=>!a.classList.contains('hidden'))));
 document.querySelectorAll('section').forEach(s=>s.classList.toggle('hidden',![...s.querySelectorAll('article')].some(a=>!a.classList.contains('hidden'))))}
fs_.onchange=filter;fst.onchange=filter;
document.getElementById('accSmall').onclick=()=>{cards.filter(c=>c.dataset.size==='small'&&!dec(c)).forEach(c=>{st[c.dataset.fp]={v:'accept',note:'',id:c.dataset.id};paint(c)});save();prog();filter()};
const ref=c=>c.dataset.id+'@'+c.dataset.fp;
function text(){const g=v=>cards.filter(c=>dec(c)&&dec(c).v===v);
 return ['Consistency review decisions (baseline ${esc(baseline)})','ACCEPT: '+g('accept').map(ref).join(' '),'REJECT: '+g('reject').map(ref).join(' '),'CHANGE:',...g('change').map(c=>'- '+ref(c)+': '+(dec(c).note||'').replace(/\\n/g,' ')),'UNDECIDED: '+cards.filter(c=>!dec(c)).map(c=>c.dataset.id).join(' ')].join('\\n')}
function saved(){const o={};cards.forEach(c=>{const s=dec(c);if(s)o[c.dataset.id]={v:s.v,note:s.note||'',fp:c.dataset.fp}});return{version:2,baseline:'${esc(baseline)}',decisions:o}}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),1800)}
document.getElementById('copy').onclick=async()=>{try{await navigator.clipboard.writeText(text());toast('Decisions copied. Paste them into Claude Code.')}catch(e){prompt('Copy these decisions:',text())}};
document.getElementById('save').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(saved(),null,2)],{type:'application/json'}));a.download='consistency-review-decisions.json';a.click();toast('Saved to your Downloads folder')};
prog();`

const { refsFor } = await makeResolver(REQ, rulingsPath)
const { blob, stats } = refsFor(body)
fs.writeFileSync(path.join(out, 'review.html'), shell({ title: 'Consistency review', css: css + refCss, body, script, extra: dataTag(blob) + '<script>' + refClient + '</script>' }))
console.error('ref stats', JSON.stringify(stats))
console.log(JSON.stringify({ changes: changes.length, large: counters.large, medium: counters.medium, small: counters.small, questions: questions.length, questionsUnreviewed: questions.filter((q) => q.unreviewed).length, questionsDismissed: dismissedQuestions.length, badEdits: changes.flatMap((c) => c.edits).filter((e) => e.problem).length, redraw: nRedraw, flag: nFlag, unreviewed: changes.filter((c) => c.unreviewed).length }))
