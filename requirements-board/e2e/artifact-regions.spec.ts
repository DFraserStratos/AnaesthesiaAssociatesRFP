/// <reference lib="dom" />
/**
 * Every named highlight of every artifact in the board's own catalogue finds its spot, and every heading
 * of every Markdown artifact carries the server's slug (read-only, the real-catalogue board: runs only
 * with BOARD_E2E_REAL=1). `npm run check` holds anchors to account without a browser; this covers what it
 * can't (a CSS selector's real match, a mermaid diagram's drawing, a passage in a PDF's text layer).
 * Generic: it names no artifact, so it runs on any project's catalogue, the starter's included.
 */
import { expect, test } from '@playwright/test'
import type { CatalogueSnapshot } from '../shared/types.ts'

test('every named highlight on an artifact shows its red box', async ({ page, request }) => {
  test.setTimeout(180_000)
  const snap = (await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot
  const spots = Object.values(snap.artifacts ?? {}).flatMap((r) => r.data.regions.map((g) => `${r.data.id}#${g.id}`))
  const missing: string[] = []
  for (const spot of spots) {
    const [id, region] = spot.split('#')
    await page.goto(`/#/artifacts/${id}?region=${region}`)
    const box = page.locator('.region-box')
    const flag = page.locator('.viewer-flag')
    await expect(box.or(flag).first()).toBeVisible({ timeout: 20_000 })
    if (await flag.isVisible()) missing.push(spot)
  }
  expect(missing).toEqual([])
})

test('every heading of every Markdown artifact carries the server slug, record IDs included (R-28)', async ({ page, request }) => {
  test.setTimeout(240_000)
  const snap = (await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot
  const docs = Object.values(snap.artifacts ?? {}).filter((r) => r.meta?.headings?.length)
  const wrong: string[] = []
  for (const r of docs) {
    await page.goto(`/#/artifacts/${r.data.id}`)
    const server = r.meta.headings!.map((h) => h.slug)
    await expect(page.locator('.doc-sheet')).toBeVisible({ timeout: 20_000 })
    const dom = await page.locator('.doc-sheet').evaluate((s) => [...s.querySelectorAll('[data-slug]')].map((h) => h.getAttribute('data-slug')))
    if (JSON.stringify(dom) !== JSON.stringify(server)) wrong.push(r.data.id)
  }
  expect(wrong).toEqual([])
})
