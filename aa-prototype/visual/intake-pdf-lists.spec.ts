import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * The rooms' PDFs on Admin, Intake, Arrivals (build plan Phase 68; D117, D119; was the PDF lists tab, catch-up
 * Phase 34). The old PDF lists address lands on the Rooms PDFs filter with replace; the rooms email Mr Okafor's
 * List and it lands by itself as a New List marked as a rooms' PDF, its patient with no NHI as its own Needs NHI
 * item, and the workbench shows its rows. Nothing is written until the office decides.
 */

async function fresh(page: Page, path: string) {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

test('the rooms email a List: it lands under Rooms PDFs as a New List with its no-NHI patient waiting, nothing applied', async ({ page }) => {
  // The old PDF lists address lands on the Rooms PDFs filter.
  await fresh(page, '/admin/intake/pdfs')
  await expect(page).toHaveURL(/\/admin\/intake\?filter=rooms-pdfs$/)
  await expect(page.locator('[data-shot="intake-filters"]').getByRole('button', { name: /^Rooms PDFs/ })).toHaveAttribute('aria-pressed', 'true')
  // No upload: only the quiet "Add a PDF by hand" at the feed's foot.
  await expect(page.getByText('Upload PDF')).toHaveCount(0)
  await expect(page.locator('[data-shot="intake-add-pdf"]')).toBeVisible()

  expect(await runDemoAction(page, 'intake-rooms-email-list', { close: true })).not.toMatch(/^Refused/)
  const okafor = page.locator('[data-shot="intake-feed-item"][data-arrival-kind="newList"]', { hasText: 'Okafor' })
  await expect(okafor.first()).toBeVisible()
  await expect(okafor.first().locator('[data-source-kind="rooms"]')).toBeVisible()
  await okafor.first().click()
  await expect(okafor.first()).toHaveAttribute('aria-selected', 'true')
  await expect(page).toHaveURL(/filter=rooms-pdfs&item=/)
  await expect(page.locator('[data-shot="intake-workbench"]')).toHaveAttribute('data-arrival-kind', 'newList')
  await expect(page.locator('[data-shot="intake-bench-newList"] [data-row-id]').first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/intake-pdf-new-list.png', fullPage: true })

  // Its patient sent with no NHI waits under Needs NHI.
  await page.locator('[data-shot="intake-filters"]').getByRole('button', { name: /^Needs NHI/ }).click()
  await expect(page).toHaveURL(/\/admin\/intake\?filter=needs-nhi$/)
  await expect(page.locator('[data-shot="intake-feed-item"][data-arrival-kind="needsNhi"]', { has: page.locator('[data-source-kind="rooms"]') }).first()).toBeVisible()

  // Phase 68: the upload with a sender, correcting a read value and creating the List from the PDF (with its origin on the Booking) moved to 70; re-added there.
  // Phase 68: the re-sent PDF's differences (the time change, the added and the missing patient) waiting for approval moved to 69; re-added there.
})
