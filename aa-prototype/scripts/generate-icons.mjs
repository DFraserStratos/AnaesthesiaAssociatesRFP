/**
 * Rasterises the AA app-icon SVGs in `src/assets/pwa/` into the PNGs that `public/`
 * ships for the two PWA manifests, the iOS home screen and the favicon, and keeps
 * `public/favicon.svg` in step with the "any" artwork.
 *
 * Why Playwright and not sharp or @vite-pwa/assets-generator: both would be a new
 * dependency for a job that runs approximately never. @playwright/test and its Chromium
 * are already installed for the visual suite, and Chromium is the most faithful SVG
 * renderer available here — it resolves `fontFamily.serif` (src/theme/tokens.ts) exactly
 * as a browser would. The outputs are committed, so no build step depends on this script.
 *
 * Screenshots are taken with the page background painted crimson and `omitBackground`
 * left off, so every PNG is fully opaque — which is what iOS needs, since it composites
 * any alpha onto black and applies its own squircle rather than a pre-rounded corner.
 *
 * Idempotent: re-running just overwrites the same seven files.
 *
 *   npm run icons
 */
import { chromium } from '@playwright/test'
import { copyFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'src', 'assets', 'pwa')
const outDir = join(root, 'public')

/** [source svg, output png, pixel size] */
const TARGETS = [
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-512.png', 512],
  ['icon-maskable.svg', 'icon-maskable-192.png', 192],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512],
  ['icon.svg', 'apple-touch-icon-180.png', 180],
  ['icon.svg', 'favicon-32.png', 32],
]

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })

for (const [svg, png, size] of TARGETS) {
  const markup = readFileSync(join(srcDir, svg), 'utf8')
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:#A91E3E}` +
      `svg{display:block;width:${size}px;height:${size}px}</style>${markup}`,
  )
  await page.evaluate(() => document.fonts.ready.then(() => true))
  await page.screenshot({ path: join(outDir, png), type: 'png' })
  console.log(`  ${png.padEnd(26)} ${size}x${size}  <- ${svg}`)
}

await browser.close()

copyFileSync(join(srcDir, 'icon.svg'), join(outDir, 'favicon.svg'))
console.log(`  ${'favicon.svg'.padEnd(26)} vector    <- icon.svg`)
