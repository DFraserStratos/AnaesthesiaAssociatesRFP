import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 30 · Conflicts, holidays and the conflict dashboard: the
 * Wed 22 Day grid in the conflict colour, the Conflicts screen, the drawer's
 * Clear sheet, Simulate sickness, reassign from a row, the hospital calendar
 * and holiday sheet, and Recurring bookings with "Apply to canvas now". No
 * "slot", no "Permanent", and no "DRAFT" on an assigned List.
 */

async function fresh(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

async function cleanCopy(page: Page, where: string) {
  const text = await page.locator('body').innerText()
  expect(/\bslots?\b/i.test(text), `${where} shows "slot"`).toBe(false)
  expect(/permanent/i.test(text), `${where} shows "Permanent"`).toBe(false)
  expect(/\bDRAFT\b/.test(text), `${where} shows DRAFT`).toBe(false)
  expect(/[\u2013\u2014]/.test(text), `${where} shows an en or em dash`).toBe(false)
}

const RUTHERFORD_WED22_AM = 'L-29104-2026-07-22-AM'
const MORRISON_WED22_PM = 'L-25490-2026-07-22-PM'

test('Wed 22 Day grid: conflicted Lists in the amber colour, the legend and the Conflict filter', async ({ page }) => {
  await fresh(page, '/admin/day/2026-07-22')
  const conflicted = page.locator('button[data-conflict="true"]')
  await expect(conflicted).toHaveCount(5)
  await expect(page.locator(`button[data-list-id="${RUTHERFORD_WED22_AM}"]`)).toContainText('Anaesthetist unavailable')
  await expect(page.locator(`button[data-list-id="${MORRISON_WED22_PM}"]`)).toContainText('Hospital closed')
  await expect(page.locator('[data-shot="daygrid-legend-conflict"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p30-01-wed22-grid.png', fullPage: true })
  await page.getByRole('button', { name: 'Conflict', exact: true }).click()
  await expect(page.locator('button[data-list-id]:not([data-conflict])')).toHaveCount(0)
  await cleanCopy(page, 'Day grid')

  // The drawer names the sickness and shows the session's status chip.
  await page.getByRole('button', { name: 'Conflict', exact: true }).click()
  await page.locator(`button[data-list-id="${RUTHERFORD_WED22_AM}"]`).click()
  const drawer = page.getByTestId('admin-list-drawer')
  await expect(drawer.getByText(/Dr Rutherford is marked .+ for this session\. Note: unwell, short notice\./)).toBeVisible()
  await expect(drawer.locator('[data-shot="drawer-attention"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p30-02-drawer-sickness.png', fullPage: true })
})

test('Clear from the drawer, Show cleared and Flag again', async ({ page }) => {
  await fresh(page, '/admin/day/2026-07-22')
  await page.locator(`button[data-list-id="${MORRISON_WED22_PM}"]`).click()
  const drawer = page.getByTestId('admin-list-drawer')
  await drawer.getByRole('button', { name: 'Clear conflict' }).click()
  const sheet = page.locator('[data-shot="conflict-clear-sheet"]')
  await expect(sheet).toBeVisible()
  await sheet.getByRole('textbox').fill('Theatre confirmed running')
  await page.screenshot({ path: 'visual/shots/p30-03-clear-sheet.png', fullPage: true })
  await sheet.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(drawer.locator('[data-shot="drawer-conflict-cleared"]')).toContainText('Theatre confirmed running')
  await page.keyboard.press('Escape')
  await page.goto('/admin/conflicts?cleared=1')
  await page.waitForLoadState('networkidle')
  const cleared = page.locator(`tr[data-conflict-row="${MORRISON_WED22_PM}"][data-conflict-cleared="true"]`)
  await expect(cleared).toContainText('Theatre confirmed running')
  await cleared.getByRole('button', { name: 'Flag again' }).click()
  await expect(page.locator(`tr[data-conflict-row="${MORRISON_WED22_PM}"]:not([data-conflict-cleared])`)).toBeVisible()
})

test('Conflicts screen: grouped by day, the two kinds, filters in the URL; Simulate sickness and reassign from a row', async ({ page }) => {
  await fresh(page, '/admin/conflicts')
  await expect(page.getByRole('heading', { name: 'Conflicts', exact: true })).toBeVisible()
  // 18 Lists plus Dr Beaumont's two Draft Lists at the Southern Cross closure (catch-up Phase 31).
  await expect(page.locator('[data-shot="nav-badge-conflicts"]')).toHaveText('20')
  for (const d of ['2026-07-22', '2026-10-26', '2026-11-13']) await expect(page.locator(`section[data-conflict-date="${d}"]`)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p30-04-conflicts.png', fullPage: true })
  await cleanCopy(page, 'Conflicts')

  await page.getByRole('button', { name: 'Anaesthetist unavailable' }).click()
  await expect(page).toHaveURL(/reason=unavailable/)
  await page.reload()
  await expect(page.locator('tr[data-conflict-row]')).toHaveCount(1)
  await page.getByRole('button', { name: 'All', exact: true }).click()

  // Simulate sickness on today's grid, then the new row on Conflicts.
  await page.goto('/admin/day/2026-07-21')
  await page.waitForLoadState('networkidle')
  const msg = await runDemoAction(page, 'simulate-sickness', { close: true })
  expect(msg).toMatch(/recorded as Unavailable for Tue 21 Jul (AM|PM)\. The List keeps its Bookings/)
  await page.goto('/admin/conflicts')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('section[data-conflict-date="2026-07-21"]')).toContainText('phoned in, simulated')
  await page.screenshot({ path: 'visual/shots/p30-05-simulated-sickness.png', fullPage: true })

  // Reassign Rutherford's Wed 22 AM to Dr Sharma: the row leaves and the badge drops.
  const badge = page.locator('[data-shot="nav-badge-conflicts"]')
  const before = Number(await badge.textContent())
  await page.locator(`tr[data-conflict-row="${RUTHERFORD_WED22_AM}"]`).getByRole('button', { name: 'Reassign' }).click()
  await expect(page.locator('[data-shot="reassign-not-available"]')).toBeVisible()
  await page.getByRole('button', { name: /Sharma, Priya.*Free AM/ }).click()
  await expect(page.locator('select[data-shot="reassign-vacated"]')).toHaveValue('unavailable')
  await page.getByRole('button', { name: 'Confirm reassignment', exact: true }).click()
  await expect(page.locator('[data-shot="conflicts-confirmation"]')).toContainText('now covers Wed 22 Jul AM')
  await expect(page.locator(`tr[data-conflict-row="${RUTHERFORD_WED22_AM}"]`)).toHaveCount(0)
  await expect(badge).toHaveText(String(before - 1))
  await page.screenshot({ path: 'visual/shots/p30-06-reassigned.png', fullPage: true })
})

test('Phone advice on an unavailable session warns and books; the List is flagged', async ({ page }) => {
  await fresh(page, '/admin/day/2026-07-21')
  // Ngata is unavailable all Tue 21 (ICU on call): an empty closed session.
  await page.locator('button[data-slot-id="S-38455-2026-07-21-AM"]').click()
  const drawer = page.getByTestId('admin-list-drawer')
  await expect(drawer.locator('[data-shot="drawer-closed-session"]')).toBeVisible()
  await drawer.getByRole('button', { name: 'Book (phone advice)' }).click()
  await expect(page.locator('[data-shot="phone-advice-conflict-warning"]')).toContainText('The Booking will be accepted and the List flagged as a conflict.')
  await page.screenshot({ path: 'visual/shots/p30-07-phone-advice-warning.png', fullPage: true })
})

test('Hospitals & holidays: the calendar, and moving and deleting a closure clears its flags', async ({ page }) => {
  await fresh(page, '/admin/masters?view=hospitals')
  await page.getByRole('button', { name: /Theatre maintenance closure/ }).click()
  const sheet = page.locator('[data-shot="holiday-edit-sheet"]')
  await expect(sheet).toContainText('It flags 6 Lists now')
  await page.screenshot({ path: 'visual/shots/p30-08-holiday-edit.png', fullPage: true })
  await sheet.locator('input[type="date"]').fill('2026-07-23')
  await sheet.getByRole('button', { name: 'Save changes' }).click()
  await expect(sheet).toContainText(/Holiday updated\. \d+ Lists? flagged, 6 flags cleared\./)
  await sheet.getByRole('button', { name: 'Done' }).click()

  await page.getByRole('button', { name: 'Calendar', exact: true }).click()
  await page.getByLabel('Hospital').selectOption({ label: 'Southern Cross' })
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next month' }).click()
  await expect(page.locator('button[data-calendar-day="2026-10-26"]')).toContainText('Labour Day')
  await expect(page.locator('button[data-calendar-day="2026-10-26"]')).toContainText('flagged')
  await page.screenshot({ path: 'visual/shots/p30-09-hospital-calendar.png', fullPage: true })
  await cleanCopy(page, 'Hospitals')
})

test('Recurring bookings: the view, the sheet\'s preview and result, Apply to canvas now and retire', async ({ page }) => {
  await fresh(page, '/admin/masters')
  await page.locator('[data-masters-view="recurringBookings"]').click()
  await expect(page.getByRole('heading', { name: 'Recurring bookings', exact: true })).toBeVisible()
  await cleanCopy(page, 'Recurring bookings')
  await page.getByRole('button', { name: 'Apply to canvas now' }).click()
  await expect(page.locator('[data-shot="recurring-bookings-apply-result"]')).toContainText('The canvas already matches every recurring booking.')

  // Edit Dr Rutherford's Monday AM: the preview, then the result with Show on day grid.
  const row = page.locator('tr[data-recurring-booking]', { hasText: 'Rutherford' }).filter({ hasText: 'Mon' }).filter({ hasText: 'AM' }).first()
  await row.getByRole('button', { name: 'Edit' }).click()
  const sheet = page.locator('[data-shot="recurring-booking-sheet"]')
  await sheet.getByLabel('Usual surgeon').selectOption('S-LIM')
  await expect(sheet.locator('[data-shot="recurring-booking-preview"]')).toContainText(/Applying updates \d+/)
  await page.screenshot({ path: 'visual/shots/p30-10-recurring-preview.png', fullPage: true })
  await sheet.getByRole('button', { name: 'Apply to canvas now', exact: true }).click()
  await expect(sheet.locator('[data-shot="recurring-booking-result"]')).toContainText(/Applied to \d+ future Mondays: 0 Lists added, \d+ updated/)
  await page.screenshot({ path: 'visual/shots/p30-11-recurring-result.png', fullPage: true })
  await sheet.getByRole('button', { name: 'Done' }).click()

  // Retire it: the row goes muted to the foot.
  await row.getByRole('button', { name: 'Edit' }).click()
  await sheet.getByRole('button', { name: 'Retire', exact: true }).click()
  await page.locator('[data-shot="recurring-booking-retire"]').getByRole('button', { name: 'Retire', exact: true }).click()
  await expect(sheet.locator('[data-shot="recurring-booking-result"]')).toContainText('Retired after')
  await sheet.getByRole('button', { name: 'Done' }).click()
  await expect(page.locator('tr[data-retired="true"]')).toHaveCount(1)
  await expect(page.locator('tr[data-recurring-booking]').last()).toHaveAttribute('data-retired', 'true')
  await page.screenshot({ path: 'visual/shots/p30-12-recurring-retired.png', fullPage: true })
})
