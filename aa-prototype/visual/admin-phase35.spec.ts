import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 35 · explicit save on the Admin Booking, change sets, History's
 * as-at view, the update email composer and its templates (US-02.3.1 to
 * US-02.3.4). Margaret Ellison's Booking (BK0009, Tue 21 Jul) carries the
 * draft walk-through.
 */

const BOOKING = '/admin/day/2026-11-24/bookings/BK0009'

async function fresh(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(300)
}

/** Three drafted changes: the time +5, a note, and the primary Procedure's Contract. */
async function threeChanges(page: Page): Promise<void> {
  await page.locator('[data-shot="booking-patient"]').getByRole('button', { name: /later|\+/ }).last().click()
  await page.locator('[data-shot="booking-notes-for-the-office"] textarea').fill('Patient asked for an earlier start.')
  await page.locator('[data-shot="contract-combo"]').first().click()
  const list = page.locator('[data-shot="contract-combo-list"]')
  await list.getByRole('option').filter({ hasText: 'No contract' }).first().click()
  await expect(page.locator('[data-testid="unsaved-count"]')).toHaveText('3')
}

test('the unsaved bar, leave without saving, Save, the saved strip and History as at', async ({ page }) => {
  await fresh(page, BOOKING)
  await threeChanges(page)
  const bar = page.locator('[data-shot="booking-save-bar"]')
  await expect(bar).toContainText('3 unsaved changes')
  await expect(bar).toContainText('Time')
  await expect(bar).toContainText('Notes')
  await expect(bar).toContainText('Contract')
  await expect(page.locator('[data-shot="booking-update-email"]')).toBeDisabled()
  await expect(page.locator('[data-shot="booking-update-email-reason"]')).toHaveText('Save your changes first. The email uses saved changes.')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'visual/shots/p35-01-unsaved-bar.png' })

  // Leaving with unsaved changes asks first.
  await page.getByRole('navigation').getByText('Day view', { exact: true }).click()
  const leave = page.locator('[data-shot="leave-without-saving"]')
  await expect(leave).toBeVisible()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/p35-02-leave-without-saving.png' })
  await leave.getByRole('button', { name: 'Keep editing' }).click()
  await expect(leave).toHaveCount(0)
  await expect(page).toHaveURL(new RegExp(`${BOOKING}$`))

  // Save: one change set, the saved strip, no email prompt.
  await page.locator('[data-shot="booking-save"]').click()
  await expect(bar).toHaveCount(0)
  const strip = page.locator('[data-shot="booking-saved-strip"]')
  await expect(strip).toContainText('Saved · 3 changes')
  await expect(strip).toContainText(/CS\d{4}/)
  await page.screenshot({ path: 'visual/shots/p35-03-saved-strip.png' })

  // History: one grouped save; View as at opens the Booking as it was.
  await page.locator('[data-shot="booking-history-button"]').click()
  const history = page.locator('[data-shot="booking-history"]')
  const set = history.locator('[data-shot="history-change-set"]').first()
  await expect(set).toContainText('Saved by Kirsty W.')
  await expect(set).toContainText('3 changes')
  await history.locator('[data-shot="history-view-as-at"]').nth(1).click()
  const asAt = page.locator('[data-shot="booking-as-at"]')
  await expect(asAt).toBeVisible()
  await expect(asAt).not.toContainText('$')
  await expect(asAt).toContainText('LL4 · ')
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'visual/shots/p35-04-history-as-at.png' })
})

test('Edit patient in the draft: Apply, the NHI field, required and validated', async ({ page }) => {
  await fresh(page, BOOKING)
  await page.locator('[data-shot="booking-patient"]').getByRole('button', { name: /Edit/ }).first().click()
  const field = page.locator('[data-shot="patient-nhi-field"]')
  await expect(field).toBeVisible()
  const nhi = field.locator('input')
  await expect(nhi).toHaveValue('ZAA0067')
  await nhi.fill('')
  await expect(field).toContainText('The NHI is required.')
  await expect(page.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled()
  await nhi.fill('ZAA0068')
  await expect(field).not.toContainText('The NHI is required.')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p35-10-edit-patient-nhi.png' })
  await nhi.fill('ZAA0067')
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
})

test('the composer: two saves ticked and the preview', async ({ page }) => {
  await fresh(page, BOOKING)
  await page.locator('[data-shot="booking-patient"]').getByRole('button', { name: '5 minutes later' }).click()
  await page.locator('[data-shot="booking-save"]').click()
  await page.locator('[data-shot="booking-patient"]').getByRole('button', { name: '5 minutes later' }).click()
  await page.locator('[data-shot="booking-notes-for-the-office"] textarea').fill('Theatre 3.')
  await page.locator('[data-shot="booking-save"]').click()
  await expect(page.locator('[data-shot="booking-save-bar"]')).toHaveCount(0)

  await page.locator('[data-shot="booking-update-email"]').click()
  const composer = page.locator('[data-shot="update-email-composer"]')
  await expect(composer).toBeVisible()
  const ticks = composer.locator('input[data-pick-key]')
  await expect(ticks.first()).toBeChecked()
  await ticks.nth(1).check()
  await expect(ticks.nth(1)).toBeChecked()
  // The time shows once, first value to last; notes never go in the email.
  const body = composer.locator('[data-shot="update-email-body"]')
  await expect(body).toContainText('16:00')
  await expect(body).toContainText('16:10')
  await expect(body).not.toContainText('Theatre 3.')
  await expect(composer.locator('[data-shot="update-email-length"]')).toContainText('of 2,000 characters')
  const href = (await composer.locator('[data-shot="update-email-open"]').getAttribute('href')) ?? ''
  expect(href.startsWith('mailto:')).toBe(true)
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/p35-05-composer-two-ticked.png' })
})

test('the composer opened from a pool notification', async ({ page }) => {
  await fresh(page, '/admin/day/2026-11-24')
  await runDemoAction(page, 'colleague-moves-list-to-office', { choice: 'busy', close: true })
  await page.goto('/admin/notifications')
  await page.waitForLoadState('networkidle')
  const draft = page.locator('[data-shot="pool-cover-email"]').first()
  await expect(draft).toBeVisible()
  await draft.click()
  const composer = page.locator('[data-shot="update-email-composer"]')
  await expect(composer).toBeVisible()
  await expect(composer.locator('input[data-pick-key]:checked')).toHaveCount(1)
  await expect(composer).toContainText('Draft cover-change email')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/p35-06-composer-from-pool.png' })
})

test('Master data · Email templates: the editor', async ({ page }) => {
  await fresh(page, '/admin/masters?view=emailTemplates')
  const table = page.locator('[data-shot="email-templates"]')
  await expect(table).toContainText('Booking change')
  await page.getByRole('button', { name: /^Edit Booking change/ }).click()
  const editor = page.locator('[data-shot="email-template-editor"]')
  await expect(editor).toBeVisible()
  await editor.getByLabel('Body').fill('Hello {unknown}')
  await expect(editor).toContainText('{unknown}')
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeDisabled()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/p35-07-email-template-editor.png' })
})

test('the List drawer: Draft update email after an assignment, and Add Booking on a booked List', async ({ page }) => {
  await fresh(page, '/admin/day/2026-11-25')
  await page.locator('[data-draft-block="L-29104-2026-11-25-AM"]').click()
  const draftDrawer = page.locator('[data-shot="admin-draft-list-drawer"]')
  await draftDrawer.locator('[data-available="41267"]').getByRole('button', { name: 'Assign' }).click()
  await page.getByRole('button', { name: 'Assign Draft List', exact: true }).click()
  await expect(page.getByText('Draft List assigned')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.goto('/admin/day/2026-11-25')
  await page.waitForLoadState('networkidle')
  await page.locator('button[data-slot-id="S-41267-2026-11-25-AM"]').click()
  const drawer = page.getByTestId('admin-list-drawer')
  const email = drawer.locator('[data-shot="drawer-update-email"]')
  await expect(email).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p35-08-drawer-update-email.png' })
  await email.click()
  const composer = page.locator('[data-shot="update-email-composer"]')
  await expect(composer.locator('[data-shot="update-email-body"]')).toContainText('Sharma')
  await page.keyboard.press('Escape')
  await expect(composer).toHaveCount(0)

  // Add Booking on a booked List (Dr Souter's Wed 22 AM, six Bookings), with the Procedure description.
  await page.keyboard.press('Escape')
  await expect(drawer).toHaveCount(0)
  await page.locator('button[data-list-id="L-34821-2026-11-25-AM"]').click()
  await expect(drawer).toContainText('Souter')
  await expect(drawer).toContainText(/Bookings \([1-9]/i)
  await drawer.locator('[data-shot="list-add-booking"]').click()
  const form = page.getByRole('dialog')
  await form.getByLabel('Name').fill('Aroha Test')
  await form.getByLabel('Procedure description').fill('bilat TKJR')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p35-09-drawer-add-booking.png' })
})
