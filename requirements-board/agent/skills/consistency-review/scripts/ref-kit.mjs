// Click-to-explain popovers for reference codes (rulings, catalogue items, questions, artifacts, note cites).
// Server side: resolve every code that appears in a page's text into one JSON blob. Client side: wrap codes, show popovers.
// Generic: note shorthands (e.g. G1016, V6) come from the rulings file's "Cite shorthand" line (`KEY = Notes <date> · <words>`),
// and CL<date> / TD<date> descriptions from the same line when present.
import fs from 'node:fs'
import path from 'node:path'

// ---- shared matcher (evaluated on the server too, so both sides recognise exactly the same codes)
export const RE_SRC = String.raw`
function buildRe(titles, shorts) {
  const esc = (s) => s.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&')
  const pts = '(?:\\s*,?\\s*#\\d+(?:\\s*-\\s*#?\\d+)?)'
  const tl = titles.slice().sort((a, b) => b.length - a.length).map(esc).join('|')
  const words = '(?: · (?:' + (tl ? tl + '|' : '') + "[A-Za-z0-9&' ]+?(?=\\s+#\\d)))?"
  const sl = (shorts || []).slice().sort((a, b) => b.length - a.length).map(esc).join('|')
  const parts = [
    'Notes \\d{4}-\\d\\d-\\d\\d' + words + pts + '*',
    ...(sl ? ['(?:' + sl + ')' + pts + '*'] : []),
    '(?:CL|TD)\\d{4}-\\d\\d-\\d\\d(?:\\s*\\(?§\\d+)?',
    'AR-\\d+(?:#[A-Za-z0-9][\\w-]*)?',
    'OQ-\\d+', 'EP-\\d+', 'FT-\\d+\\.\\d+', 'US-\\d+\\.\\d+\\.\\d+',
    'S-\\d{3}', 'R-\\d{3}', '[FC]-\\d+', '[LMSQ]-\\d{2}',
  ]
  return new RegExp('(?<![\\w-])(?:' + parts.join('|') + ')(?!\\w)', 'g')
}
const normKey = (s) => s.replace(/\s+/g, ' ').trim()
`
export const buildRe = new Function(RE_SRC + '; return buildRe;')()
export const normKey = new Function(RE_SRC + '; return normKey;')()

// ---- catalogue readers
const unq = (v) => { v = v.trim(); if (v.startsWith('"')) { try { return JSON.parse(v) } catch { return v.slice(1, -1) } } if (v.startsWith("'")) return v.slice(1, -1).replace(/''/g, "'"); return v }
function readMd(file) {
  if (!fs.existsSync(file)) return null
  const raw = fs.readFileSync(file, 'utf8')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const fm = {}
  if (m) for (const l of m[1].split('\n')) { const k = l.match(/^([A-Za-z_]+):\s*(.*)$/); if (k && k[2].trim()) fm[k[1]] = unq(k[2]) }
  return { fm, body: m ? m[2] : raw, raw }
}
export function plain(md) {
  return md.replace(/<!--[\s\S]*?-->/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\((?:<[^>]*>|[^)]*)\)/g, '$1')
    .replace(/<[^>]+>/g, '').replace(/\*\*/g, '').replace(/`/g, '').replace(/^\s{0,3}#+\s+/gm, '').replace(/^\s*[-*]\s+/gm, '')
    .replace(/[ \t]+/g, ' ').split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean).join('\n\n')
}
function trim(s, n) {
  if (s.length <= n) return s
  const cut = s.slice(0, n)
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), n * 0.6)).replace(/[\s,;:]+$/, '') + '…'
}
const slug = (s) => s.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function loadRulings(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  const rulings = {}, shorthand = {}
  const logLabels = {}
  const sh = lines.find((l) => /(^|\s)[A-Z][A-Za-z]*\d+ = Notes \d{4}-\d\d-\d\d · /.test(l))
  if (sh) {
    for (const m of sh.matchAll(/([A-Z][A-Za-z]*\d+) = Notes (\d{4}-\d\d-\d\d) · (.*?)(?= · [A-Z]+(?:\d+|<date>) = |$)/g)) shorthand[m[1]] = { date: m[2], words: m[3].trim() }
    for (const m of sh.matchAll(/(CL|TD)<date> = (.*?)(?= · [A-Z-]+(?:\d+|<date>|nn) = |$)/g)) logLabels[m[1]] = m[2].trim().replace(/\.$/, '')
  }
  let h2 = '', h3 = '', bold = '', cur = null
  const flush = () => { cur = null }
  for (const line of lines) {
    let m
    if ((m = line.match(/^## (.*)/))) { flush(); h2 = m[1]; h3 = ''; bold = ''; continue }
    if ((m = line.match(/^### (.*)/))) { flush(); h3 = m[1]; continue }
    if ((m = line.match(/^# /))) { flush(); continue }
    if ((m = line.match(/^\*\*([^*]+)\*\*\s*$/))) { flush(); bold = m[1]; continue }
    if ((m = line.match(/^- (.*)/))) {
      flush()
      const mm = m[1].match(/^\*\*([FRSC]-\d+)\*{0,2}\s*(.*)$/)
      if (!mm) continue
      const id = mm[1]
      let rest = m[1].slice(m[1].indexOf(id) + id.length)
      let title = ''
      if (id[0] === 'C') { const t = m[1].match(/^\*\*C-\d+\s+(.*?)\.?\*\*\s*(.*)$/); if (t) { title = t[1]; rest = t[2] } }
      else rest = rest.replace(/^\*+\s*/, '')
      cur = { id, kind: id[0], h2, h3, bold, title, text: rest }
      rulings[id] = cur
      continue
    }
    if (!line.trim()) { flush(); continue }
    if (cur) cur.text += ' ' + line.trim()
  }
  for (const r of Object.values(rulings)) {
    const t = r.text.match(/^(.*?)\s_(\d{4}-\d\d-\d\d[^_]*|standing rule)_\s*(.*)$/s)
    let text = r.text, cite = ''
    if (t) { text = (t[1] + ' ' + t[3]).trim(); cite = t[2].trim() }
    r.text = text.replace(/_([^_]+)_/g, '$1').trim(); r.cite = cite
    r.head = r.kind === 'C' ? r.title : r.kind === 'S' ? (r.bold || 'No longer true') : (r.h3 || r.h2)
    r.pill = { F: 'Fixed ruling', R: 'Ruling', S: 'No longer true', C: 'Conflict, decided' }[r.kind]
  }
  return { rulings, shorthand, logLabels }
}

// reqDir: the catalogue folder (absolute, or relative to the working directory)
export function makeResolver(reqDir, rulingsFile) {
  const REQ = path.resolve(reqDir)
  // A status is a number whose label lives in board.config.json: show the label.
  const config = (() => { try { return JSON.parse(fs.readFileSync(path.join(REQ, 'board.config.json'), 'utf8')) } catch { return {} } })()
  const statusName = (list, code) => (code === '' || code == null ? '' : ((Array.isArray(list) ? list.find((d) => String(d?.code) === String(code))?.label : undefined) ?? String(code)))
  const { rulings, shorthand, logLabels } = loadRulings(rulingsFile)
  const shorts = Object.keys(shorthand)
  const shortRe = new RegExp('^(?:' + (shorts.length ? shorts.slice().sort((a, b) => b.length - a.length).join('|') : '(?!)') + ')')
  const noteDir = path.join(REQ, 'notes')
  const notes = fs.readdirSync(noteDir).filter((f) => /^\d{4}-\d\d-\d\d-.+\.md$/.test(f)).map((f) => {
    const base = f.replace(/\.md$/, ''), date = base.slice(0, 10)
    const raw = fs.readFileSync(path.join(noteDir, f), 'utf8')
    const title = (raw.match(/^# (.*)$/m)?.[1] ?? base).replace(/,\s*\d{4}-\d\d-\d\d$/, '').trim()
    // numbered points at the very start of a line, continuation lines indented
    const points = {}
    const L = raw.split('\n')
    for (let i = 0; i < L.length; i++) {
      const m = L[i].match(/^(\d+)\. (.*)$/)
      if (!m) continue
      const buf = [m[2]]
      let j = i + 1
      for (; j < L.length; j++) {
        if (!L[j].trim()) { buf.push(''); continue }
        if (/^\s+\S/.test(L[j])) buf.push(L[j].trim()); else break
      }
      points[m[1]] = buf.join(' ').replace(/ {2,}/g, ' ').replace(/\s+$/, '').replace(/\[([^\]]+)\]\((?:<[^>]*>|[^)]*)\)/g, '$1').trim()
    }
    const cov = raw.match(/^- \*\*Covered:\*\*([\s\S]*?)(?=\n- \*\*|\n\n)/m)
    return { base, date, title, slug: base.slice(11), points, covered: cov ? trim(plain(cov[1]), 420) : '' }
  })
  const titles = [...new Set(notes.map((n) => n.title))]
  const logs = fs.existsSync(path.join(REQ, 'changes')) ? fs.readdirSync(path.join(REQ, 'changes')).filter((f) => /^\d{4}-\d\d-\d\d-.+\.md$/.test(f)).map((f) => {
    const raw = fs.readFileSync(path.join(REQ, 'changes', f), 'utf8')
    return { date: f.slice(0, 10), title: (raw.match(/^# (.*)$/m)?.[1] ?? f).trim(), raw }
  }) : []
  const re = buildRe(titles, shorts)
  const cache = {}
  const itemRef = (id) => {
    const md = readMd(path.join(REQ, 'stories', id + '.md'))
    return md ? { id, title: md.fm.title ?? id, type: md.fm.type ?? ({ EP: 'epic', FT: 'feature', US: 'story' }[id.slice(0, 2)]), status: statusName(config.statuses, md.fm.status ?? ''), parent: md.fm.parent, md } : null
  }
  const pointsOf = (s) => {
    const out = []
    for (const m of s.matchAll(/#(\d+)(?:\s*-\s*#?(\d+))?/g)) { const a = +m[1], b = m[2] ? +m[2] : a; for (let n = a; n <= Math.min(b, a + 80); n++) out.push(n) }
    return [...new Set(out)]
  }
  const noteEntry = (note, ptsText, label) => {
    const want = pointsOf(ptsText)
    const pts = want.filter((n) => note.points[n] != null).map((n) => ({ n, text: note.points[n] }))
    return { k: 'note', title: note.title, date: note.date, label, points: pts, missing: want.filter((n) => note.points[n] == null), covered: want.length ? '' : note.covered }
  }
  function resolve(key) {
    let m
    if ((m = key.match(/^(EP-\d+|FT-\d+\.\d+|US-\d+\.\d+\.\d+)$/))) {
      const it = itemRef(m[1]); if (!it) return null
      const par = it.parent ? itemRef(it.parent) : null
      const body = it.md.body.split(/\n## /)[0]
      return { k: 'item', id: it.id, type: it.type, title: it.title, status: it.status, parent: par ? { id: par.id, title: par.title, type: par.type } : null, desc: trim(plain(body), 700) }
    }
    if ((m = key.match(/^(OQ-\d+)$/))) {
      const md = readMd(path.join(REQ, 'questions', m[1] + '.md')); if (!md) return null
      const [q, ...rest] = md.body.split(/\n## Answer\s*\n/)
      const ans = rest.join('\n').split(/\n## /)[0]
      return { k: 'q', id: m[1], title: md.fm.title ?? m[1], status: statusName(config.questionStatuses, md.fm.status ?? ''), question: trim(plain(q), 600), answer: ans.trim() ? trim(plain(ans), 700) : '' }
    }
    if ((m = key.match(/^(AR-\d+)(?:#(.+))?$/))) {
      const md = readMd(path.join(REQ, 'artifacts', m[1] + '.md')); if (!md) return null
      const e = { k: 'ar', id: m[1], title: md.fm.title ?? m[1], kind: md.fm.kind ?? '', date: md.fm.date ?? '', status: md.fm.status ?? '', desc: trim(plain(md.body), 600), region: null }
      if (m[2]) {
        const rs = md.raw.split(/^\s*- id: /m).slice(1)
        const r = rs.find((x) => unq(x.split('\n')[0]) === m[2])
        const name = r?.match(/^\s+name:\s*(.*)$/m)?.[1], note = r?.match(/^\s+note:\s*(.*)$/m)?.[1]
        e.region = { id: m[2], name: name ? unq(name) : '', note: note ? unq(note) : '' }
      }
      return e
    }
    if ((m = key.match(/^([FRSC]-\d+)$/)) && rulings[m[1]]) { const r = rulings[m[1]]; return { k: 'ruling', id: r.id, title: r.head, pill: r.pill, text: r.text, cite: r.cite } }
    if ((m = key.match(/^Notes (\d{4}-\d\d-\d\d)(?: · (.*?))?((?: ?,? ?#\d.*)?)$/))) {
      const same = notes.filter((n) => n.date === m[1]); if (!same.length) return null
      let note
      if (m[2]) { const s = slug(m[2]); note = same.find((n) => n.slug === s) ?? same.find((n) => n.slug.startsWith(s)) }
      else { const want = pointsOf(m[3]); note = same.find((n) => want.every((x) => n.points[x] != null)) ?? same[0] }
      return note ? noteEntry(note, m[3], '') : null
    }
    if ((m = key.match(shortRe)) && /^((?: ?,? ?#\d.*)?)$/.test(key.slice(m[0].length))) {
      const k = m[0], rest = key.slice(k.length)
      const s = shorthand[k]; if (!s) return null
      const note = notes.find((n) => n.date === s.date && n.slug === slug(s.words)); if (!note) return null
      return noteEntry(note, rest, k)
    }
    if ((m = key.match(/^(CL|TD)(\d{4}-\d\d-\d\d)(?:\s*\(?§(\d+))?$/))) {
      const same = logs.filter((l) => l.date === m[2])
      const secs = m[3] ? same.map((l) => { const h = l.raw.match(new RegExp('^## ' + m[3] + '\\. (.*)$', 'm')); return h ? `${l.title}, section ${m[3]}: ${h[1]}` : null }).filter(Boolean) : []
      const where = secs.length ? secs : same.map((l) => l.title)
      if (m[1] === 'TD') return { k: 'log', title: `${logLabels.TD ? logLabels.TD.replace(/ of that date.*$/, '') : 'Typed decision'}, ${m[2]}`, pill: 'Typed decision', text: `A decision typed or given as an explicit instruction on ${m[2]}, as recorded in the requirements change log of that date.`, where }
      if (!same.length) return null
      return { k: 'log', title: `Change log, ${m[2]}`, pill: 'Change log', text: `The record of what the requirements update of ${m[2]} changed in the catalogue.`, where }
    }
    return null
  }
  const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  // scan the page's text, resolve each distinct code, report counts
  function refsFor(html) {
    const text = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]*>/g, '\x01'))
    const refs = {}, stats = {}
    const kindOf = (k) => /^Notes /.test(k) ? 'note cite' : shortRe.test(k) && !/^[FC]-/.test(k) ? 'note shorthand' : /^(CL|TD)/.test(k) ? 'CL/TD' : /^[LMSQ]-\d\d$/.test(k) ? 'change id' : k.match(/^(EP|FT|US|OQ|AR)/)?.[1] ?? 'ruling'
    for (const mt of text.matchAll(re)) {
      const key = normKey(mt[0])
      if (key in cache === false) cache[key] = resolve(key)
      const kind = kindOf(key)
      if (kind === 'change id') continue
      stats[kind] ??= { resolved: new Set(), unresolved: new Set() }
      if (cache[key]) { refs[key] = cache[key]; stats[kind].resolved.add(key) } else stats[kind].unresolved.add(key)
    }
    const out = {}
    for (const [k, v] of Object.entries(stats)) out[k] = { resolved: v.resolved.size, unresolved: [...v.unresolved] }
    return { blob: JSON.stringify({ refs, titles, shorts }).replace(/</g, '\\u003c'), stats: out }
  }
  return { refsFor }
}

export const refCss = `
.ref{text-decoration:underline dotted var(--teal);text-decoration-thickness:1.5px;text-underline-offset:3px;cursor:pointer;border-radius:3px}
.ref:hover,.ref.on{background:var(--teal-t)}.ref:focus-visible{outline:2px solid var(--teal);outline-offset:1px}
@keyframes flash{0%,60%{box-shadow:0 0 0 3px var(--teal)}100%{box-shadow:var(--shadow)}}.flash{animation:flash 1.6s ease-out}
.pop{position:absolute;z-index:60;width:420px;max-width:calc(100vw - 32px);max-height:min(70vh,520px);overflow:auto;background:var(--paper);color:var(--ink);border:1px solid var(--line);border-top:3px solid var(--teal);border-radius:10px;
 box-shadow:0 8px 28px rgba(10,20,15,.22),0 1px 3px rgba(10,20,15,.12);padding:12px 14px 14px;font-size:14px;line-height:1.5;white-space:normal;font-weight:400;text-align:left;text-indent:0}
.pop.t-epic{border-top-color:var(--epic)}.pop.t-feature{border-top-color:var(--feature)}.pop.t-story{border-top-color:var(--story)}.pop.t-artifact{border-top-color:var(--artifact)}
.pop .ph{display:flex;gap:8px;align-items:flex-start;justify-content:space-between}
.pop .pt{font-weight:700;font-size:15.5px;line-height:1.3;margin:0;letter-spacing:-.005em}
.pop .pc{background:none;border:0;font-size:20px;line-height:1;padding:0 2px;color:var(--faint);cursor:pointer;font-weight:400}.pop .pc:hover{color:var(--ink)}
.pop .pm{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0 8px}
.pop .pid{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11.5px;color:var(--faint)}
.pop .pp{display:inline-block;padding:0 8px;border-radius:999px;font-size:11.5px;font-weight:600;background:var(--teal-t);color:var(--teal);white-space:nowrap}
.pop .pp.t-epic{background:color-mix(in srgb,var(--epic) 15%,var(--paper));color:var(--epic)}
.pop .pp.t-feature{background:color-mix(in srgb,var(--feature) 15%,var(--paper));color:var(--feature)}
.pop .pp.t-story{background:color-mix(in srgb,var(--story) 15%,var(--paper));color:var(--story)}
.pop .pp.t-artifact{background:color-mix(in srgb,var(--artifact) 15%,var(--paper));color:var(--artifact)}
.pop .pp.s{background:var(--bg);color:var(--muted);border:1px solid var(--line)}
.pop p{margin:0 0 8px}.pop p:last-child{margin-bottom:0}
.pop .pl{font-size:12px;font-weight:600;color:var(--muted);text-transform:none;margin:10px 0 3px}
.pop .pq{margin:6px 0;padding:6px 10px;border-left:3px solid var(--teal);background:var(--bg);border-radius:0 6px 6px 0}
.pop .pq b.n{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:12px;color:var(--teal);margin-right:6px}
.pop .pq.miss{color:var(--faint);border-left-color:var(--line)}
.pop .psrc{font-size:12px;color:var(--muted);margin-top:8px}
.pop .pin{font-size:13px;color:var(--muted);margin:0 0 8px}`

export const refClient = RE_SRC + String.raw`
;(function(){try{
const D=JSON.parse(document.getElementById('refdata').textContent),R=D.refs,re=buildRe(D.titles,D.shorts);
const SKIP=new Set(['SCRIPT','STYLE','BUTTON','TEXTAREA','INPUT','SELECT','OPTION','NOSCRIPT']);
const isJump=k=>/^[LMSQ]-\d\d$/.test(k)&&document.getElementById(k);
function ok(n){for(let e=n.parentElement;e;e=e.parentElement){if(SKIP.has(e.tagName))return false;if(e.classList&&(e.classList.contains('pop')||e.classList.contains('ref')||e.classList.contains('cid')))return false}return true}
const nodes=[],tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
for(let n;(n=tw.nextNode());)if(n.nodeValue.length>3&&ok(n))nodes.push(n);
for(const n of nodes){const t=n.nodeValue;re.lastIndex=0;let last=0,frag=null,m;
 while((m=re.exec(t))){const raw=m[0],key=normKey(raw);if(!(isJump(key)||R[key]))continue;
  frag=frag||document.createDocumentFragment();if(m.index>last)frag.appendChild(document.createTextNode(t.slice(last,m.index)));
  const s=document.createElement('span');s.className='ref';s.dataset.k=key;s.tabIndex=0;s.setAttribute('role','button');s.textContent=raw;frag.appendChild(s);last=m.index+raw.length}
 if(frag){if(last<t.length)frag.appendChild(document.createTextNode(t.slice(last)));n.parentNode.replaceChild(frag,n)}}
let pop=null,cur=null;
function h(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function rich(el,txt){txt.split(/(\*\*[^*]+\*\*|` + "`" + String.raw`[^` + "`" + String.raw`]+` + "`" + String.raw`)/).forEach(p=>{if(!p)return;
 if(p.startsWith('**')&&p.length>4)el.appendChild(h('strong',null,p.slice(2,-2)));else if(p.startsWith('` + "`" + String.raw`')&&p.length>2)el.appendChild(h('code',null,p.slice(1,-1)));else el.appendChild(document.createTextNode(p))});return el}
function paras(box,txt){txt.split(/\n\n/).forEach(p=>box.appendChild(rich(h('p'),p)))}
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
function build(e,key){const box=h('div','pop t-'+(e.type||(e.k==='ar'?'artifact':'')));box.setAttribute('role','dialog');
 const hd=h('div','ph');const ttl=h('h3','pt',e.title);hd.appendChild(ttl);const x=h('button','pc','×');x.setAttribute('aria-label','Close');x.onclick=close;hd.appendChild(x);box.appendChild(hd);
 const meta=h('div','pm');const pill=(t,c)=>meta.appendChild(h('span','pp '+(c||''),t));
 if(e.k==='item'){pill(cap(e.type),'t-'+e.type);if(e.status)pill(e.status,'s');meta.appendChild(h('span','pid',e.id));box.appendChild(meta);
  if(e.parent)box.appendChild(h('div','pin','In '+e.parent.type+': '+e.parent.title));if(e.desc)paras(box,e.desc)}
 else if(e.k==='q'){pill('Question');if(e.status)pill(e.status,'s');meta.appendChild(h('span','pid',e.id));box.appendChild(meta);
  if(e.question)paras(box,e.question);if(e.answer){box.appendChild(h('div','pl','Answer'));paras(box,e.answer)}}
 else if(e.k==='ar'){pill(cap(e.kind||'Artifact'),'t-artifact');if(e.date)pill(e.date,'s');meta.appendChild(h('span','pid',e.id));box.appendChild(meta);
  if(e.region){const r=h('div','pq');r.appendChild(h('b','n','Spot'));r.appendChild(document.createTextNode((e.region.name||e.region.id)+(e.region.note?': '+e.region.note:'')));box.appendChild(r)}
  if(e.desc)paras(box,e.desc)}
 else if(e.k==='ruling'){pill(e.pill);meta.appendChild(h('span','pid',e.id));box.appendChild(meta);paras(box,e.text);if(e.cite)box.appendChild(h('div','psrc','Source: '+e.cite))}
 else if(e.k==='note'){pill('Note','');pill(e.date,'s');meta.appendChild(h('span','pid',e.label||key));box.appendChild(meta);
  if(e.covered){box.appendChild(h('div','pl','Covered'));box.appendChild(h('p',null,e.covered))}
  e.points.forEach(p=>{const q=h('div','pq');q.appendChild(h('b','n','#'+p.n));rich(q,p.text);box.appendChild(q)});
  e.missing.forEach(n=>{const q=h('div','pq miss');q.appendChild(h('b','n','#'+n));q.appendChild(document.createTextNode('This point is not in the note.'));box.appendChild(q)})}
 else if(e.k==='log'){pill(e.pill);meta.appendChild(h('span','pid',key));box.appendChild(meta);box.appendChild(h('p',null,e.text));(e.where||[]).forEach(w=>box.appendChild(h('div','pin',w)))}
 return box}
function place(a){const r=a.getClientRects()[0]||a.getBoundingClientRect(),vw=document.documentElement.clientWidth,w=Math.min(420,vw-32);
 pop.style.width=w+'px';let left=Math.min(Math.max(r.left,16),vw-16-w);pop.style.left=(left+scrollX)+'px';pop.style.top='0px';
 const ph=pop.offsetHeight,below=innerHeight-r.bottom,above=r.top;let top;
 if(below>=ph+14||below>=above)top=r.bottom+6;else top=Math.max(8,r.top-ph-6);
 pop.style.top=(top+scrollY)+'px'}
function close(){if(pop){pop.remove();pop=null}if(cur){cur.classList.remove('on');cur=null}}
function jump(id){const t=document.getElementById(id);if(!t)return;for(let p=t.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
 t.classList.remove('hidden');t.scrollIntoView({behavior:'smooth',block:'center'});t.classList.remove('flash');void t.offsetWidth;t.classList.add('flash')}
function open(a){const k=a.dataset.k;if(cur===a){close();return}close();if(isJump(k)){jump(k);return}
 const e=R[k];if(!e)return;pop=build(e,k);document.body.appendChild(pop);cur=a;a.classList.add('on');place(a)}
document.addEventListener('click',ev=>{const a=ev.target.closest&&ev.target.closest('.ref');
 if(a){ev.preventDefault();ev.stopPropagation();open(a);return}if(pop&&!ev.target.closest('.pop'))close()},true);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape')close();else if((ev.key==='Enter'||ev.key===' ')&&ev.target.classList&&ev.target.classList.contains('ref')){ev.preventDefault();open(ev.target)}});
addEventListener('resize',()=>{if(pop&&cur)place(cur)});
}catch(e){console.error('ref popovers failed',e)}})();
`
export const dataTag = (blob) => `<script type="application/json" id="refdata">${blob}</script>`
