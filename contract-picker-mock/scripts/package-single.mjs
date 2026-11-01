// Packs the built mock (dist/) into ONE self-contained HTML file for the client:
// the script, the styles and the two fonts are inlined, so it opens by double-click
// (file://) with no server, no internet and nothing else beside it.
//
//   npm run package   →   release/AA-Contract-Picker.html
//
// Fonts: Schibsted Grotesk and Spline Sans Mono, SIL Open Font License 1.1
// (licences in public/fonts/), which allows embedding.
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const out = join(root, 'release', 'AA-Contract-Picker.html')

let html = readFileSync(join(dist, 'index.html'), 'utf8')
const fromDist = (url) => join(dist, url.replace(/^\.?\//, ''))

// Font files become data: URIs.
const dataUri = (url) => `data:font/woff2;base64,${readFileSync(fromDist(url)).toString('base64')}`

// Preload hints point at files that will not exist: drop them.
html = html.replace(/<link rel="preload"[^>]*>\s*/g, '')

// Stylesheets: inline, with their font urls embedded.
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => {
  const css = readFileSync(fromDist(href), 'utf8').replace(/url\((['"]?)([^)'"]+\.woff2)\1\)/g, (_m, _q, u) => `url(${dataUri(u)})`)
  return `<style>\n${css}\n</style>`
})

// The module script: inline. "</script" inside the code would end the tag early.
html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, (_, src) => {
  const js = readFileSync(fromDist(src), 'utf8').replace(/<\/script/gi, '<\\/script')
  return `<script type="module">\n${js}\n</script>`
})

if (/\b(src|href)="\/(assets|fonts)\//.test(html)) throw new Error('A dist/ file was left un-inlined; check index.html.')

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, html)
console.log(`Wrote ${out} (${Math.round(statSync(out).size / 1024)} KB)`)
