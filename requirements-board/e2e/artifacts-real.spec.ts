/// <reference lib="dom" />
/**
 * Every highlight of every real artifact finds its spot in the board (read-only, port 5181):
 * `npm run check` holds anchors to account without a browser; this covers what it can't (a CSS
 * selector's real match, a mermaid diagram's drawing, a passage in a PDF's text layer).
 */
import { expect, test } from '@playwright/test'
import type { CatalogueSnapshot } from '../shared/types.ts'

test('every named highlight on a real artifact shows its red box', async ({ page, request }) => {
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
