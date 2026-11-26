import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * The rooms' PDFs on Admin, Intake, Arrivals (build plan Phase 68; D117, D119; was the PDF lists tab, catch-up
 * Phase 34). The old PDF lists address lands on the Rooms PDFs filter with replace; the rooms email Mr Okafor's
 * List and it lands by itself as a New List marked as a rooms' PDF, its patient with no NHI as its own Needs NHI
 * item, and the workbench shows its rows. Nothing is written until the office decides. Phase 70: the new List bench
 * (the page beside the values, the placement) and Add a PDF by hand. Updated by the phase, run at the Wave 7 join.
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

  // Phase 68: the re-sent PDF's differences (the time change, the added and the missing patient) waiting for approval moved to 69; re-added there.
})

test('the new List bench: the page beside the values, the named anaesthetist suggested, placed as one change set with its stub', async ({ page }) => {
  await fresh(page, '/admin/intake?filter=rooms-pdfs')
  expect(await runDemoAction(page, 'intake-rooms-email-list', { close: true })).not.toMatch(/^Refused/)
  // The emailed List (the seed holds another of Mr Okafor's rooms PDFs, at Forte Health).
  const okafor = page.locator('[data-shot="intake-feed-item"][data-arrival-kind="newList"]', { hasText: 'Okafor' }).filter({ hasText: "St George's" })
  await expect(okafor).toHaveCount(1)
  const key = await okafor.getAttribute('data-arrival-key')
  await okafor.click()
  const bench = page.locator('[data-shot="intake-bench-newList"]')
  await expect(bench.locator('[data-shot="intake-newlist-sender"]')).toContainText('@')
  // The page sits beside the values read from it; choosing a value lights its box.
  await expect(bench.locator('[data-shot="intake-pdf-page"]')).toBeVisible()
  await expect(bench.locator('[data-shot="intake-pdf-values"]')).toBeVisible()
  const value = bench.locator('[data-shot="intake-pdf-values"] [data-pdf-value]').first()
  const valueKey = await value.getAttribute('data-pdf-value')
  await value.click()
  await expect(bench.locator(`[data-pdf-box="${valueKey}"]`)).toHaveAttribute('data-selected', 'true')
  // The named anaesthetist's session is suggested first.
  const place = bench.locator('[data-shot="intake-place-list"]')
  await expect(place.locator('[data-place-option="suggested"]')).toBeVisible()
  await expect(place).toContainText('Rutherford')
  await page.screenshot({ path: 'visual/shots/intake-pdf-new-list-bench.png', fullPage: true })
  await place.getByRole('button', { name: /^Place in/ }).click()
  // Placed (Sione Faleolo still waits for his NHI): it leaves the Rooms PDFs filter, which shows only what is
  // still to decide, and its bench stays, reading Placed, with nothing left to place.
  await expect(page.locator(`[data-shot="intake-feed-item"][data-arrival-key="${key}"]`)).toHaveCount(0)
  await expect(bench.locator('[data-shot="intake-newlist-decided"]')).toContainText('Placed')
  await expect(place).toHaveCount(0)
})

test('Add a PDF by hand: choose a sample, type the sender; it lands selected like a mailbox PDF', async ({ page }) => {
  await fresh(page, '/admin/intake')
  await page.locator('[data-shot="intake-add-pdf"]').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Sample files')).toBeVisible()
  await dialog.getByRole('radio').first().click()
  await dialog.getByLabel('Sent from').fill('not an address')
  await dialog.getByRole('button', { name: 'Add PDF' }).click()
  await expect(dialog).toContainText('email address')
  await dialog.getByLabel('Sent from').fill('rooms@example.com')
  await dialog.getByRole('button', { name: 'Add PDF' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page).toHaveURL(/item=/)
  await expect(page.locator('[data-shot="intake-workbench"]')).toBeVisible()
})
