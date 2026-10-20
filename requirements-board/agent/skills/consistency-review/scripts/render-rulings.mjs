// Renders rulings.md as a local HTML page with click-to-explain popovers for every code.
// Usage: node render-rulings.mjs --rulings <rulings.md> --req <catalogue dir> [--out <rulings.html>] [--subtitle "<text>"]
//   --out defaults to rulings.html beside rulings.md; --subtitle defaults to the baseline named in rulings.md.
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { esc, inline, shell } from './page-kit.mjs'
import { makeResolver, refCss, refClient, dataTag } from './ref-kit.mjs'

const { values: a } = parseArgs({ options: { rulings: { type: 'string' }, req: { type: 'string', default: 'requirements-board/requirements' }, out: { type: 'string' }, subtitle: { type: 'string' } } })
if (!a.rulings) { console.error('usage: node render-rulings.mjs --rulings <rulings.md> --req <catalogue dir> [--out <file.html>] [--subtitle <text>]'); process.exit(2) }
const src = a.rulings
const out = a.out ?? path.join(path.dirname(src), 'rulings.html')
const lines = fs.readFileSync(src, 'utf8').split('\n')
const baseline = lines.join('\n').match(/[Bb]aseline(?: commit)? `?([0-9a-f]{6,40})`?/)?.[1]
const decided = lines.find((l) => /^## Conflicts decided/.test(l))?.replace(/^## /, '')
const subtitle = a.subtitle ?? ['Yardstick for the consistency review', baseline && `baseline ${baseline}`, decided ? decided.replace(/^Conflicts/, 'the C conflicts are') : 'the C conflicts are not yet decided'].filter(Boolean).join(' · ')
const html = []
const toc = []
let inList = false
const close = () => { if (inList) { html.push('</ul>'); inList = false } }
let h2 = ''
for (const line of lines) {
  if (line.startsWith('# ')) { close(); continue }
  let m
  if ((m = line.match(/^## (.*)/))) { close(); h2 = m[1]; const id = 's-' + toc.length; toc.push({ id, t: h2, lvl: 2 }); html.push(`<h2 id="${id}">${inline(h2)}</h2>`); continue }
  if ((m = line.match(/^### (.*)/))) { close(); const id = 's-' + toc.length; toc.push({ id, t: m[1], lvl: 3 }); html.push(`<h3 id="${id}">${inline(m[1])}</h3>`); continue }
  if ((m = line.match(/^- (.*)/))) {
    if (!inList) { html.push('<ul class="rules">'); inList = true }
    const mm = m[1].match(/^\*\*([A-Z]-\d+)\s*([^*]*)\*\*\s*(.*)$/)
    const cls = h2.startsWith('No longer') ? 'stale' : h2.startsWith('Conflicts') ? 'conflict' : h2.startsWith('Fixed') ? 'fixed' : ''
    html.push(`<li class="${cls}">${mm ? `<span class="rid mono">${esc(mm[1])}</span> ${mm[2] ? `<strong>${inline(mm[2])}</strong> ` : ''}${inline(mm[3])}` : inline(m[1])}</li>`)
    continue
  }
  if (!line.trim()) { close(); continue }
  close()
  html.push(`<p class="${h2 ? '' : 'intro'}">${inline(line)}</p>`)
}
close()

const css = `
.layout{display:grid;grid-template-columns:240px 1fr;gap:28px;align-items:start}
nav{position:sticky;top:16px;max-height:calc(100vh - 32px);overflow:auto;font-size:13px;padding:12px}
nav a{display:block;padding:3px 6px;border-radius:6px;text-decoration:none;color:var(--muted)}
nav a:hover{background:var(--teal-t);color:var(--ink)} nav a.l2{font-weight:600;color:var(--ink);margin-top:8px}
nav a.l3{padding-left:14px}
main{min-width:0}
.top{position:sticky;top:0;z-index:2;background:var(--bg);padding:12px 0;border-bottom:1px solid var(--line);margin-bottom:8px}
ul.rules{list-style:none;padding:0;margin:0}
ul.rules li{background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:9px 12px;margin:6px 0}
ul.rules li em{color:var(--muted);font-style:normal;font-size:13px}
ul.rules li.stale{border-left:3px solid var(--medium)} ul.rules li.conflict{border-left:3px solid var(--teal)} ul.rules li.fixed{border-left:3px solid var(--epic)}
.rid{display:inline-block;min-width:44px;color:var(--faint);font-size:12px}
p.intro{color:var(--muted);font-size:14px;margin:6px 0}
.hidden{display:none!important}
@media (max-width:820px){.layout{grid-template-columns:1fr}nav{display:none}}`

const body = `<div class="wrap">
<h1>Current rulings</h1>
<div class="sub">${inline(subtitle)}</div>
<div class="layout" style="margin-top:20px">
<nav class="card">${toc.map((t) => `<a class="l${t.lvl}" href="#${t.id}">${esc(t.t)}</a>`).join('')}</nav>
<main><div class="top"><input id="q" type="search" placeholder="Filter rulings, by word or code (e.g. R-012)"></div>${html.join('\n')}</main>
</div></div>`

const script = `const q=document.getElementById('q');q.addEventListener('input',()=>{const v=q.value.trim().toLowerCase();
document.querySelectorAll('ul.rules li').forEach(li=>li.classList.toggle('hidden',!!v&&!li.textContent.toLowerCase().includes(v)))});`

const { blob, stats } = makeResolver(a.req, src).refsFor(body)
fs.writeFileSync(out, shell({ title: 'Current rulings', css: css + refCss, body, script, extra: dataTag(blob) + '<script>' + refClient + '</script>' }))
console.error('ref stats', JSON.stringify(stats))
console.log('wrote', out)
