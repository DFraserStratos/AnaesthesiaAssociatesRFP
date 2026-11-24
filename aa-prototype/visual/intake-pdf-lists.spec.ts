import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 34: the rooms' PDF lists on Admin Intake. Upload one with the
 * address it came from, correct the flagged NHI on the seeded list, send it to
 * matching, create the List from its first row and read where it came from,
 * then receive the re-sent list and see only its changed time wait for approval.
 */

async function fresh(page: Page, path: string) {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

const row = (page: Page, text: string) => page.locator('[data-shot^="matching-row-"]', { hasText: text })

test('upload with a sender, correct, send, create the List with its origin, then the re-sent differences', async ({ page }) => {
  await fresh(page, '/admin/intake/pdfs')

  // The seeded Okafor list, as received, with its sender.
  await expect(page.locator('[data-shot="pdf-inbox"]')).toContainText('leanne.pa@avonsidesurgical.example')

  // Upload: the badged sample picker, "Sent from" required and prefilled.
  await page.locator('[data-shot="pdf-upload-open"]').click()
  const upload = page.locator('[data-shot="pdf-upload"]')
  await expect(upload).toContainText('Sample files')
  await upload.locator('[data-sample-id="PDF-WHITFORD-0812"]').click()
  const sender = upload.getByLabel('Sent from')
  await expect(sender).toHaveValue('bookings@merivaleeye.example')
  await sender.fill('')
  await page.locator('[data-shot="pdf-upload-confirm"]').click()
  await expect(upload).toBeVisible()
  await sender.fill('bookings@merivaleeye.example')
  await page.locator('[data-shot="pdf-upload-confirm"]').click()
  await expect(page.locator('[data-shot="pdf-list-header"]')).toContainText('bookings@merivaleeye.example')
  await page.getByRole('button', { name: 'Back to PDF lists' }).click()

  // Okafor's list: the printed NHI is invalid, so Send is refused until it is corrected.
  await page.locator('[data-shot="pdf-inbox"] tbody tr', { hasText: 'leanne.pa@avonsidesurgical.example' }).click()
  // Catch-up Phase 40a: the NHI is checked as typed, with the validator's reason, and no Hub lookup on a PDF row.
  const nhi2 = page.locator('[data-shot="pdf-row-2"]').getByLabel('NHI')
  await nhi2.fill('ZAA006')
  await expect(page.locator('[data-shot="pdf-row-2"]')).toContainText('7 characters, AAA1234 or AAA12AB')
  await nhi2.fill('ZAA0069')
  await expect(page.locator('[data-shot="pdf-row-nhi-reason"]')).toContainText('The check digit does not match.')
  await expect(page.locator('[data-shot="pdf-row-2-apply"]')).toBeDisabled()
  await expect(page.locator('[data-shot="pdf-row-2"] [data-shot="nhi-lookup-status"]')).toHaveCount(0)
  await page.locator('[data-shot="pdf-row-2"]').getByLabel('NHI').fill('ZAA0067')
  await expect(page.locator('[data-shot="pdf-row-nhi-reason"]')).toHaveCount(0)
  await page.locator('[data-shot="pdf-row-2-apply"]').click()
  await expect(page.locator('[data-shot="pdf-correction"]').first()).toContainText('ZAA0068')
  await page.locator('[data-shot="pdf-send"]').click()
  await expect(page.getByText(/Sent to matching: 3 rows/)).toBeVisible()

  // On Matching: the rooms' rows with their micro-cap and wording; nothing written yet.
  await page.locator('[data-shot="pdf-open-matching"]').click()
  await expect(page).toHaveURL(/\/admin\/intake\/matching$/)
  await expect(row(page, 'Brian Holt')).toContainText('Rooms PDF')
  await expect(row(page, 'Brian Holt')).toContainText('R inguinal hernia mesh')

  // The first decision creates the List; it reads where it came from.
  await row(page, 'Brian Holt').click()
  const panel = page.locator('[data-shot="matching-panel"]')
  await expect(panel).toBeVisible()
  await panel.getByRole('radio', { name: /Create a List in a session/ }).click()
  await panel.getByRole('button', { name: /Rutherford/ }).first().click()
  await page.locator('[data-shot="matching-apply"]').click()
  await expect(page.locator('[data-shot="matching-banner"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/intake-pdf-created-list.png', fullPage: true })
  // The other two rows land on the new List (their suggestion), so the re-send can show a difference.
  for (const name of ['Margaret Ellison', 'Hemi Parata']) {
    await page.keyboard.press('Escape')
    await row(page, name).click()
    await expect(panel).toBeVisible()
    await page.locator('[data-shot="matching-apply"]').click()
    await expect(page.locator('[data-shot="matching-banner"]')).toBeVisible()
  }
  await page.goto('/admin/day/2026-12-09/bookings/BK0191')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="booking-list-origin"]')).toContainText("From a rooms' PDF")
  await expect(page.locator('[data-shot="booking-list-origin"]')).toContainText('leanne.pa@avonsidesurgical.example')

  // The re-sent list: the unchanged row is skipped, the changed time a modification, the new patient a new row.
  await page.goto('/admin/intake/pdfs')
  await page.waitForLoadState('networkidle')
  expect(await runDemoAction(page, 'pdf-list-resend')).toMatch(/marked Re-sent/)
  await page.locator('[data-shot="pdf-inbox"] tbody tr', { hasText: 'Re-sent' }).click()
  await page.locator('[data-shot="pdf-send"]').click()
  await page.locator('[data-shot="pdf-open-matching"]').click()
  await page.keyboard.press('Escape')
  await expect(row(page, 'Ruth Calder')).toContainText('New')
  await expect(row(page, 'Margaret Ellison')).toHaveCount(1)
  await expect(row(page, 'Margaret Ellison')).toContainText('Modification')
  await expect(row(page, 'Hemi Parata')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/intake-pdf-resent.png', fullPage: true })
})
