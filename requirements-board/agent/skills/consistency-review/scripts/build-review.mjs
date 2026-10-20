// Assembles the stage-2 workflow output (from its journal) into changes.json and a local review page.
// Usage: node build-review.mjs --journal <journal.jsonl> --rulings <rulings.md> --out <run dir> --baseline <commit>
//          [--repo <repo root, default .>] [--req <catalogue dir relative to the repo, default requirements-board/requirements>]
//          [--storage-key <localStorage key prefix, default consistency-review>]
// Reads <out>/fixups.json and <out>/question-fixups.json when present (hand corrections that survive rebuilds).
// Writes <out>/changes.json and <out>/review.html. Edit paths in changes.json are relative to the repo root.
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { esc, inline, shell } from './page-kit.mjs'
import { makeResolver, refCss, refClient, dataTag } from './ref-kit.mjs'

const { values: a } = parseArgs({ options: {
  journal: { type: 'string' }, rulings: { type: 'string' }, out: { type: 'string' }, baseline: { type: 'string' },
  repo: { type: 'string', default: '.' }, req: { type: 'string', default: 'requirements-board/requirements' },
  'storage-key': { type: 'string', default: 'consistency-review' },
} })
for (const k of ['journal', 'rulings', 'out', 'baseline']) if (!a[k]) { console.error(`missing --${k}\n` + fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 6).join('\n')); process.exit(2) }
const { journal: journalPath, rulings: rulingsPath, repo, out, baseline } = a
const REQ_REL = a.req.replace(/\/+$/, '')

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
  r.verified.forEach((f, i) => { findings[`${label.replace('verify:', '')}/${i + 1}`] = f })
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
const norm = (p) => { const i = p.indexOf(REQ_REL + '/'); return i >= 0 ? p.slice(i) : path.isAbsolute(p) ? path.relative(path.resolve(repo), p) : p }
const dedupe = (arr, key) => { const s = new Set(); return arr.filter((x) => { const k = key(x); if (s.has(k)) return false; s.add(k); return true }) }
const changes = []
const usedKeys = new Set()
for (const c of consolidations) {
  for (const ch of c.changes) {
    const fs_ = ch.keys.map((k) => findings[k]).filter(Boolean)
    ch.keys.forEach((k) => usedKeys.add(k))
    const edits = (ch.editsOverride?.length ? ch.editsOverride : fs_.flatMap((f) => f.edits)).concat(ch.extraEdits ?? [])
    changes.push({
      title: ch.title, size: ch.size, topic: ch.topic, why: ch.why, confidence: ch.confidence, keys: ch.keys, group: c.group,
      items: [...new Set(fs_.flatMap((f) => f.items).concat(edits.map((e) => path.basename(e.file).replace(/\.(md|svg)$/, ''))))],
      evidence: dedupe(fs_.flatMap((f) => f.evidence), (e) => e.cite + e.quote),
      rulings: [...new Set(fs_.flatMap((f) => f.rulings))],
      edits: dedupe(edits.map((e) => ({ ...e, file: norm(e.file) })), (e) => e.file + e.old),
    })
  }
}
const dropped = consolidations.flatMap((c) => c.dropped)
for (const [k, f] of Object.entries(findings)) {
  if (usedKeys.has(k) || dropped.find((d) => d.key === k)) continue
  changes.push({ title: f.summary, size: f.size, topic: f.topic, why: `${f.summary} ${f.change} (Not reviewed by the final pass.)`, confidence: 'medium', keys: [k], group: 'unreviewed',
    items: f.items, evidence: f.evidence, rulings: f.rulings, edits: f.edits.map((e) => ({ ...e, file: norm(e.file) })), unreviewed: true })
}
const questions = dedupe(consolidations.flatMap((c) => c.newQuestions), (q) => q.title.toLowerCase())
// hand fixups: replace an edit (matched by file, old and a fragment of new) with a corrected one
const fixPath = path.join(out, 'fixups.json')
const fixups = fs.existsSync(fixPath) ? JSON.parse(fs.readFileSync(fixPath, 'utf8')) : []
for (const ch of changes) ch.edits = ch.edits.map((e) => { const f = fixups.find((x) => x.file === e.file && x.old === e.old && e.new.includes(x.newContains)); return f ? { file: e.file, ...f.edit, fixed: true } : e })

// ---------- validate edits: applies exactly once, no clashes between changes
const fileCache = {}
const readRepo = (f) => (fileCache[f] ??= fs.existsSync(path.join(repo, f)) ? fs.readFileSync(path.join(repo, f), 'utf8') : null)
const spans = {}
const order = { large: 0, medium: 1, small: 2 }
changes.sort((a, b) => order[a.size] - order[b.size] || a.topic.localeCompare(b.topic))
const counters = { large: 0, medium: 0, small: 0 }
for (const ch of changes) {
  ch.id = `${ch.size[0].toUpperCase()}-${String(++counters[ch.size]).padStart(2, '0')}`
  for (const e of ch.edits) {
    const text = readRepo(e.file)
    if (text == null) { e.problem = 'file not found'; continue }
    const first = text.indexOf(e.old)
    if (first < 0) { e.problem = 'text not found in file'; continue }
    if (text.indexOf(e.old, first + 1) >= 0) { e.problem = 'text occurs more than once'; continue }
    e.at = first
    ;(spans[e.file] ??= []).push({ ch: ch.id, e })
  }
  ch.needsRedraw = ch.edits.length === 0
}
// two changes clash on a file if applying one stops the other's edits from applying (either order)
const applyAll = (text, es) => { for (const e of es) { if (text.split(e.old).length !== 2) return null; text = text.replace(e.old, () => e.new) } return text }
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
questions.forEach((q, i) => { q.id = `Q-${String(i + 1).padStart(2, '0')}` })
// hand question fixups: drop answered questions, fold duplicates into another (ids stay stable)
const qfixPath = path.join(out, 'question-fixups.json')
const qfix = fs.existsSync(qfixPath) ? JSON.parse(fs.readFileSync(qfixPath, 'utf8')) : {}
for (const [from, to] of Object.entries(qfix.merge ?? {})) {
  const a = questions.find((q) => q.id === from), b = questions.find((q) => q.id === to)
  if (a && b) { b.body += ` (Also covers ${from}: ${a.body})`; b.affects = [...new Set([...b.affects, ...a.affects])] }
}
const gone = new Set([...Object.keys(qfix.remove ?? {}), ...Object.keys(qfix.merge ?? {})])
questions.splice(0, questions.length, ...questions.filter((q) => !gone.has(q.id)))
for (const q of questions) if (qfix.rewrite?.[q.id]) Object.assign(q, qfix.rewrite[q.id])
fs.writeFileSync(path.join(out, 'changes.json'), JSON.stringify({ baseline, changes, questions, dropped, rawCount, findings: Object.keys(findings).length }, null, 2))

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
const fileLabel = (f) => { const b = path.basename(f).replace(/\.(md|svg)$/, ''); return f.endsWith('.svg') ? `${label(b)} <span class="tag">drawing</span>` : label(b) }

function changeCard(ch) {
  const edits = ch.edits.map((e) => {
    const d = diff(e.old, e.new)
    return `<div class="edit${e.problem ? ' bad' : ''}"><div class="efile">${fileLabel(e.file)}${e.problem ? `<span class="warn">Edit will not apply: ${esc(e.problem)}</span>` : ''}</div>
${d.merged != null ? `<div class="diff">${d.merged}</div>` : `<div class="diff"><del>${d.del}</del></div><div class="diff"><ins>${d.ins}</ins></div>`}</div>`
  }).join('')
  return `<article class="change card s-${ch.size}" id="${ch.id}" data-id="${ch.id}" data-size="${ch.size}" data-topic="${esc(ch.topic)}">
<header><div class="ttl"><span class="cid mono">${ch.id}</span><h4>${esc(ch.title)}</h4></div>
<div class="meta"><span class="pill size-${ch.size}">${ch.size}</span>${ch.confidence === 'medium' ? '<span class="pill conf">check closely</span>' : ''}${ch.unreviewed ? '<span class="pill conf">not reviewed by the final pass</span>' : ''}${ch.needsRedraw ? '<span class="pill redraw">needs redrawing</span>' : ''}</div></header>
<p class="why">${inline(ch.why)}</p>
<div class="items">${ch.items.map((i) => `<span class="item ty-${typeOf(i)}">${label(i)}</span>`).join('')}</div>
${edits ? `<div class="edits">${edits}</div>` : ''}
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
const qCards = questions.map((q) => `<article class="change card q" id="${q.id}" data-id="${q.id}" data-size="question" data-topic="Questions">
<header><div class="ttl"><span class="cid mono">${q.id}</span><h4>${esc(q.title)}</h4></div></header>${q.body.split(/\n\s*\n/).map((para) => `<p class="why">${para.split('\n').map(inline).join('<br>')}</p>`).join('')}
<div class="items">${(q.affects ?? []).map((i) => `<span class="item ty-${typeOf(i)}">${label(i)}</span>`).join('')}</div>
<footer class="decide"><button data-v="accept">Add as open question</button><button data-v="reject">Skip</button><button data-v="change">Change it…</button><textarea placeholder="How should it change?" hidden></textarea></footer></article>`).join('')

const bad = changes.filter((c) => c.edits.some((e) => e.problem)).length
const css = `
.bar{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);padding:10px 0}
.bar .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.bar .prog{margin-left:auto;font-size:13px;color:var(--muted)}
.stats{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
.stat{padding:10px 14px;min-width:120px}.stat b{display:block;font-size:22px}
.size-large{background:var(--large-t);color:var(--large)}.size-medium{background:var(--medium-t);color:var(--medium)}.size-small{background:var(--small-t);color:var(--small)}
.pill.conf{background:var(--medium-t);color:var(--medium)}.pill.redraw{background:#e8eaf7;color:var(--artifact)}
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
.edit{border:1px solid var(--line);border-radius:8px;margin:8px 0;overflow:hidden}
.edit.bad{border-color:var(--large)}
.efile{font-size:13px;padding:6px 10px;background:var(--bg);border-bottom:1px solid var(--line);display:flex;gap:10px;align-items:center}
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
${bad ? `<div class="card stat" style="color:var(--large)"><b>${bad}</b>with an edit that won't apply as written</div>` : ''}
</div>
<div class="bar"><div class="row">
<select id="fsize"><option value="">All sizes</option><option>large</option><option>medium</option><option>small</option><option value="question">questions</option></select>
<select id="fstate"><option value="">Any decision</option><option value="none">Undecided</option><option value="accept">Accepted</option><option value="reject">Rejected</option><option value="change">Change requested</option></select>
<button id="accSmall">Accept all small</button>
<button id="copy" class="primary">Copy decisions</button><button id="save">Save decisions file</button>
<span class="prog" id="prog"></span></div></div>
${section('large', 'A rule changes meaning, the fix spans several items, a status moves off Confirmed, or a diagram needs redrawing.')}
${section('medium', 'Out-of-date or contradicting wording in one item that would change what someone builds.')}
${section('small', 'Retired terms, names, stale sources and phrasing. Collapsed by topic.')}
${questions.length ? `<section id="sec-q"><h2>New questions</h2><p class="sub">Things the reviewers found unsettled. Accepting adds an open question; it never changes a requirement.</p>${qCards}</section>` : ''}
</div><div class="toast" id="toast"></div>`

const script = `
const KEY='${esc(a['storage-key'])}-${esc(baseline)}';let st={};try{st=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}};
const cards=[...document.querySelectorAll('article.change')];
function paint(c){const s=st[c.dataset.id];c.dataset.state=s?s.v:'';const ta=c.querySelector('textarea');ta.hidden=!(s&&s.v==='change');if(s&&s.note!=null&&ta.value!==s.note)ta.value=s.note}
function prog(){const n=cards.filter(c=>st[c.dataset.id]).length;document.getElementById('prog').textContent=n+' of '+cards.length+' decided'}
cards.forEach(c=>{paint(c);c.querySelectorAll('button[data-v]').forEach(b=>b.onclick=()=>{const v=b.dataset.v;const cur=st[c.dataset.id];
 if(cur&&cur.v===v&&v!=='change'){delete st[c.dataset.id]}else{st[c.dataset.id]={v,note:cur?cur.note:''}}save();paint(c);prog();filter();if(v==='change')c.querySelector('textarea').focus()});
 c.querySelector('textarea').oninput=e=>{st[c.dataset.id]={v:'change',note:e.target.value};save()}});
const fs_=document.getElementById('fsize'),fst=document.getElementById('fstate');
function filter(){cards.forEach(c=>{const s=st[c.dataset.id];const ok=(!fs_.value||c.dataset.size===fs_.value)&&(!fst.value||(fst.value==='none'?!s:s&&s.v===fst.value));c.classList.toggle('hidden',!ok)});
 document.querySelectorAll('details.topic').forEach(d=>d.classList.toggle('hidden',![...d.querySelectorAll('article')].some(a=>!a.classList.contains('hidden'))));
 document.querySelectorAll('section').forEach(s=>s.classList.toggle('hidden',![...s.querySelectorAll('article')].some(a=>!a.classList.contains('hidden'))))}
fs_.onchange=filter;fst.onchange=filter;
document.getElementById('accSmall').onclick=()=>{cards.filter(c=>c.dataset.size==='small'&&!st[c.dataset.id]).forEach(c=>{st[c.dataset.id]={v:'accept',note:''};paint(c)});save();prog();filter()};
function text(){const g=v=>cards.filter(c=>st[c.dataset.id]&&st[c.dataset.id].v===v).map(c=>c.dataset.id);
 return ['Consistency review decisions (baseline ${esc(baseline)})','ACCEPT: '+g('accept').join(' '),'REJECT: '+g('reject').join(' '),'CHANGE:',...g('change').map(id=>'- '+id+': '+(st[id].note||'').replace(/\\n/g,' ')),'UNDECIDED: '+cards.filter(c=>!st[c.dataset.id]).map(c=>c.dataset.id).join(' ')].join('\\n')}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),1800)}
document.getElementById('copy').onclick=async()=>{try{await navigator.clipboard.writeText(text());toast('Decisions copied. Paste them into Claude Code.')}catch(e){prompt('Copy these decisions:',text())}};
document.getElementById('save').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({baseline:'${esc(baseline)}',decisions:st},null,2)],{type:'application/json'}));a.download='consistency-review-decisions.json';a.click();toast('Saved to your Downloads folder')};
prog();`

const { refsFor } = makeResolver(REQ, rulingsPath)
const { blob, stats } = refsFor(body)
fs.writeFileSync(path.join(out, 'review.html'), shell({ title: 'Consistency review', css: css + refCss, body, script, extra: dataTag(blob) + '<script>' + refClient + '</script>' }))
console.error('ref stats', JSON.stringify(stats))
console.log(JSON.stringify({ changes: changes.length, large: counters.large, medium: counters.medium, small: counters.small, questions: questions.length, badEdits: changes.flatMap((c) => c.edits).filter((e) => e.problem).length, redraw: changes.filter((c) => c.needsRedraw).length, unreviewed: changes.filter((c) => c.unreviewed).length }))
