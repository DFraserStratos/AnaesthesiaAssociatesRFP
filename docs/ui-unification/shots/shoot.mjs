import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
const require = createRequire(process.argv[2] + '/')
const { chromium } = require('@playwright/test')
const out = process.argv[3]
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const browser = await chromium.launch()
const index = {}
for (const app of ['admin', 'web', 'mobile']) {
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(`http://localhost:${process.env.AA_PROTO_PORT ?? 5173}/demo/catalogue/${app}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-catalogue-row]')
  await page.waitForTimeout(800)
  const rows = await page.$$('[data-catalogue-row]')
  fs.mkdirSync(path.join(out, app), { recursive: true })
  index[app] = []
  for (const row of rows) {
    const name = await row.getAttribute('data-catalogue-row')
    const stage = await row.$(':scope > div:first-child > *')
    const file = `${app}/${slug(name)}.png`
    try { await (stage ?? row).screenshot({ path: path.join(out, file) }); index[app].push({ name, file }) }
    catch (e) { index[app].push({ name, error: String(e).slice(0, 120) }) }
  }
  await ctx.close()
}
await browser.close()
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index, null, 1))
console.log(Object.entries(index).map(([a, r]) => `${a}: ${r.length} rows, ${r.filter(x => x.error).length} errors`).join('\n'))
