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

test('real sources open their spot: an RFP printed page, and a note point', async ({ page }) => {
  test.setTimeout(90_000)
  // US-01.1.1 cites the RFP's printed p.18 (PDF p.19) first, and points 17 and 36 of the 29 September notes.
  await page.goto('/#/outline?item=US-01.1.1')
  const rows = page.locator('.sheet .sources-section .link-row')
  await rows.filter({ hasText: 'RFP: Booking and Billing Systems Upgrade' }).first().click()
  await expect(page).toHaveURL(/#\/artifacts\/AR-15\?region=p19$/)
  await expect(page.locator('.pdf-page[data-page="19"] .region-box')).toBeVisible({ timeout: 30_000 })

  await page.goto('/#/outline?item=US-01.1.1')
  await rows.filter({ hasText: 'Notes on the AA client meeting, 29 September' }).getByRole('button', { name: 'Point 36' }).click()
  await expect(page).toHaveURL(/#\/artifacts\/AR-10\?region=L\d+-\d+$/)
  await expect(page.locator('.doc-sheet .region-box')).toBeVisible()
  await expect(page.locator('.viewer-flag')).toHaveCount(0)
})
