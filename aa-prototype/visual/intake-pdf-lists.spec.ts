import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * The rooms' PDFs on Admin, Intake, Arrivals (build plan Phase 68; D117, D119; was the PDF lists tab, catch-up
 * Phase 34; the inbox rebuild of 27 Nov 2026). The old PDF lists address lands on the inbox with Source set to
 * Rooms' PDFs, with replace; the rooms email Mr Okafor's List and it lands by itself as a New List from the rooms,
 * its patient with no NHI as its own Needs NHI arrival, and its opened page shows its rows. Nothing is written until
 * the office decides. Phase 70: the new List bench (the page beside the values, the placement) and Add a PDF by hand.
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
  await expect(page).toHaveURL(/\/admin\/intake\?source=rooms$/)
  await expect(page.locator('[data-shot="intake-inbox-filters"]').getByLabel('Source', { exact: true })).toHaveValue('rooms')
  // No upload: only "Add a PDF by hand" in the header.
  await expect(page.getByText('Upload PDF')).toHaveCount(0)
  await expect(page.locator('[data-shot="intake-add-pdf"]')).toBeVisible()

  expect(await runDemoAction(page, 'intake-rooms-email-list', { close: true })).not.toMatch(/^Refused/)
  // Under Source: Rooms' PDFs, so it came from the rooms.
  const okafor = page.locator('[data-shot="intake-inbox-row"][data-arrival-kind="newList"]', { hasText: 'Okafor' })
  await expect(okafor.first()).toBeVisible()
  await okafor.first().click()
  await expect(page).toHaveURL(/\/admin\/intake\/arrival\/[^?]+\?source=rooms$/)
  await expect(page.locator('[data-shot="intake-arrival-page"]')).toHaveAttribute('data-arrival-kind', 'newList')
  await expect(page.locator('[data-shot="intake-bench-newList"] [data-row-id]').first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/intake-pdf-new-list.png', fullPage: true })

  // Its patient sent with no NHI waits under Waiting for an NHI, from the rooms.
  await page.locator('[data-shot="intake-arrival-back"]').click()
  await expect(page).toHaveURL(/\/admin\/intake\?source=rooms$/)
  await page.locator('[data-shot="intake-inbox-filters"]').getByLabel('Show', { exact: true }).selectOption({ label: 'Waiting for an NHI' })
  await expect(page).toHaveURL(/\/admin\/intake\?show=needs-nhi&source=rooms$/)
  await expect(page.locator('[data-shot="intake-inbox-row"][data-arrival-kind="needsNhi"]').first()).toBeVisible()

  // Phase 68: the re-sent PDF's differences (the time change, the added and the missing patient) waiting for approval moved to 69; re-added there.
})

test('the new List bench: the page beside the values, the named anaesthetist suggested, placed as one change set with its stub', async ({ page }) => {
  await fresh(page, '/admin/intake?source=rooms')
  expect(await runDemoAction(page, 'intake-rooms-email-list', { close: true })).not.toMatch(/^Refused/)
  // The emailed List (the seed holds another of Mr Okafor's rooms PDFs, at Forte Health).
  const okafor = page.locator('[data-shot="intake-inbox-row"][data-arrival-kind="newList"]', { hasText: 'Okafor' }).filter({ hasText: "St George's" })
  await expect(okafor).toHaveCount(1)
  const key = await okafor.getAttribute('data-arrival-key')
  await okafor.click()
  const bench = page.locator('[data-shot="intake-bench-newList"]')
  // Who sent it, in the page's quiet line under the List's name.
  await expect(page.locator('[data-shot="intake-arrival-page"]')).toContainText(' · from ')
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
  const submit = page.locator('[data-decision-footer] [data-shot="intake-place-list-submit"]')
  await expect(submit).toHaveText(/^Place in .*Rutherford/)
  await submit.click()
  // Placed (Sione Faleolo still waits for his NHI): its bench stays, reading Placed, with nothing left to place,
  // and it leaves the inbox's Rooms' PDFs view, which shows only what is still to decide.
  await expect(bench.locator('[data-shot="intake-newlist-decided"]')).toContainText('Placed')
  await expect(place).toHaveCount(0)
  await page.locator('[data-shot="intake-arrival-back"]').click()
  await expect(page).toHaveURL(/\/admin\/intake\?source=rooms$/)
  await expect(page.locator('[data-shot="intake-inbox-row"]').first()).toBeVisible()
  await expect(page.locator(`[data-shot="intake-inbox-row"][data-arrival-key="${key}"]`)).toHaveCount(0)
})

test('Add a PDF by hand: choose a sample, type the sender; it opens on its own page like a mailbox PDF', async ({ page }) => {
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
  await expect(page).toHaveURL(/\/admin\/intake\/arrival\//)
  await expect(page.locator('[data-shot="intake-arrival-page"]')).toBeVisible()
})
