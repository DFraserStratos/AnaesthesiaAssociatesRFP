import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Draft Lists (catch-up Phase 31; FT-01.6, US-01.6.1 to US-01.6.4, US-13.1.1,
 * US-01.3.5, US-01.3.6, OQ-81 part 2): the page in ascending date order, the
 * band and the rail card, assigning (it becomes ACTIVE in the anaesthetist's
 * session), the not-preferred group, changing the date, removing, and a
 * recurring booking on leave becoming a Draft List.
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
  expect(/blacklist|whitelist|Surgeon TBC/i.test(text), `${where} shows a retired word`).toBe(false)
  expect(/[–—]/.test(text), `${where} shows an en or em dash`).toBe(false)
}

test('Draft Lists: soonest first, the band and rail card, and assigning St George\'s to Dr Fitzgerald makes it ACTIVE', async ({ page }) => {
  await fresh(page, '/admin/draft-lists')
  // 47 across the whole practice (the scripted ten plus the colleagues' recurring and returned Lists).
  await expect(page.locator('[data-shot="nav-badge-draftLists"]')).toHaveText('47')
  const rows = page.locator('tr[data-draft-list-row]')
  await expect(rows).toHaveCount(47)
  await expect(rows.first()).toHaveAttribute('data-draft-list-row', 'LD-001')
  await expect(page.locator('tr[data-draft-list-row="LD-003"]')).toContainText('3 d 22 h')
  await page.screenshot({ path: 'visual/shots/p31-01-draft-lists.png', fullPage: true })
  await cleanCopy(page, 'Draft Lists')

  await page.goto('/admin/day/2026-11-24')
  await page.waitForLoadState('networkidle')
  const band = page.locator('[data-shot="daygrid-draft-band"]')
  await expect(band).toHaveAttribute('data-draft-band-count', '1')
  // Draft Lists left the rail: the band above the grid and the Draft Lists page carry them.
  await expect(page.locator('[data-shot="admin-draft-lists-rail"]')).toHaveCount(0)
  // The counts line under the date has gone; the band's own heading counts the day's Draft Lists.
  await expect(band).toContainText('Draft Lists')
  await page.screenshot({ path: 'visual/shots/p31-02-day-band.png', fullPage: true })

  await page.locator('[data-draft-block="LD-001"]').click()
  const drawer = page.locator('[data-shot="admin-draft-list-drawer"]')
  await expect(drawer).toContainText('DRAFT')
  await expect(drawer).toContainText('Unassigned')
  // The drawer offers the first few free colleagues; Dr Fitzgerald is in See everyone's picker.
  await drawer.locator('[data-shot="draft-list-available"]').getByRole('button', { name: /^See everyone/ }).click()
  await page.locator('button[data-candidate="43015"]').click()
  await page.getByRole('button', { name: 'Assign Draft List' }).click()
  await expect(page.getByText('Draft List assigned')).toBeVisible()
  // The drawer becomes the session drawer, with the List ACTIVE in her PM.
  const sessionDrawer = page.locator('[data-testid="admin-list-drawer"][data-list-id="LD-001"]')
  await expect(sessionDrawer).toContainText('ACTIVE')
  await page.keyboard.press('Escape')
  await page.goto('/admin/day/2026-11-24')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-slot-id="S-43015-2026-11-24-PM"]')).toContainText("St George's")
  // The band empties (catch-up Phase 32d: LD-001 was the day's only Draft List).
  await expect(page.locator('[data-shot="daygrid-draft-band"]')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p31-03-assigned.png', fullPage: true })
})

test('The Reid request puts Dr Sharma apart as not preferred; changing the date moves it; removing an empty one goes to History', async ({ page }) => {
  await fresh(page, '/admin/draft-lists')
  const msg = await runDemoAction(page, 'simulate-incoming-request', { close: true })
  expect(msg).toContain('Christchurch Eye Surgery · Ms A. Reid, Thu 26 Nov PM')
  const row = page.locator('tr[data-draft-list-row]', { hasText: 'Thu 26 Nov' }).first()
  await row.getByRole('button', { name: /^Assign/ }).click()
  const sheet = page.locator('[data-shot="admin-assign-draft-list"]')
  await expect(sheet.locator('[data-shot="candidates-not-preferred"]')).toContainText('Sharma, Priya')
  await expect(sheet).toContainText('Not preferred with Ms Reid')
  await sheet.locator('[data-shot="candidates-not-preferred"] button[data-candidate="41267"]').click()
  await expect(sheet.locator('[data-shot="assign-draft-list-pairing-warning"]')).toContainText('prefers not to work with Dr Priya Sharma')
  await expect(page.getByRole('button', { name: 'Assign anyway' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p31-04-not-preferred.png', fullPage: true })
  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByRole('button', { name: 'Cancel' }).click()

  await page.locator('tr[data-draft-list-row="LD-003"]').getByRole('button', { name: 'Change date' }).click()
  const redate = page.locator('[data-shot="admin-redate-draft-list"]')
  await redate.locator('input[type="date"]').fill('2026-12-02')
  await redate.getByRole('button', { name: 'Change date' }).click()
  await expect(page.locator('tr[data-draft-list-row="LD-003"]')).toContainText('Wed 2 Dec')
  await expect(page.locator('tr[data-draft-list-row="LD-003"]')).toContainText('3 d 22 h')
  // It now waits on its new day's band.
  await page.goto('/admin/day/2026-12-02')
  await expect(page.locator('[data-shot="daygrid-draft-band"] [data-draft-block="LD-003"]')).toBeVisible()
  await page.goto('/admin/draft-lists')

  await page.locator('tr[data-draft-list-row="LD-001"]').getByRole('button', { name: 'Remove' }).click()
  await page.getByRole('button', { name: 'Duplicate request' }).click()
  await page.locator('[data-shot="admin-remove-draft-list"]').getByRole('button', { name: 'Remove' }).click()
  await expect(page.locator('tr[data-draft-list-row="LD-001"]')).toHaveCount(0)
  await page.locator('[data-draft-tab="history"]').click()
  await expect(page.locator('tr[data-draft-history-row="LD-001"]')).toContainText('Removed: Duplicate request')
  await page.screenshot({ path: 'visual/shots/p31-05-history.png', fullPage: true })
})

test('A recurring booking for Dr Beaumont on Thursday AM, while she is away, makes a Draft List for Thu 26 Nov', async ({ page }) => {
  await fresh(page, '/admin/masters?view=recurringBookings')
  await page.getByRole('button', { name: 'Add recurring booking' }).click()
  const sheet = page.locator('[data-shot="recurring-booking-sheet"]')
  await sheet.getByLabel('Anaesthetist').selectOption({ label: 'Dr Sarah Beaumont' })
  await sheet.getByLabel('Day of week').selectOption('4')
  await sheet.getByLabel('Hospital (usual)').selectOption({ label: 'Christchurch Eye Surgery' })
  await sheet.getByLabel('Usual surgeon').selectOption({ label: 'Mr J. Whitford' })
  await expect(sheet.locator('[data-shot="recurring-booking-preview"]')).toContainText('sends 1 session to a Draft List (anaesthetist unavailable)')
  await sheet.getByRole('button', { name: 'Apply to canvas now' }).click()
  await expect(sheet.locator('[data-shot="recurring-booking-result"]')).toContainText('1 session to a Draft List')
  await page.screenshot({ path: 'visual/shots/p31-06-recurring-clash.png', fullPage: true })
  await sheet.locator('[data-shot="recurring-booking-draft-lists"]').click()
  await expect(page.locator('tr[data-draft-list-row]', { hasText: 'Thu 26 Nov' })).toContainText('Recurring booking · Dr Beaumont unavailable')
})

test('Draft Lists by keyboard (UI unification U6, bug 3): Tab to a row handle past the rail\'s first five, Enter opens its drawer', async ({ page }) => {
  await fresh(page, '/admin/draft-lists')
  const sixth = page.locator('tr[data-draft-list-row]').nth(5)
  const listId = await sixth.getAttribute('data-draft-list-row')
  const handle = sixth.getByRole('button', { name: /^Open Draft List / })
  await expect(handle).toHaveCount(1)
  // Rows never take focus; the handle does.
  await expect(sixth).not.toHaveAttribute('tabindex', /.*/)
  // Tab in from the row above: its last control, then Tab lands on this row's handle.
  // Its last enabled control (catch-up Phase 32d: the row above may hold Bookings, so its Remove is disabled).
  await page.locator('tr[data-draft-list-row]').nth(4).locator('button:not([disabled])').last().focus()
  await page.keyboard.press('Tab')
  await expect(handle).toBeFocused()
  await page.keyboard.press('Enter')
  const drawer = page.locator('[data-shot="admin-draft-list-drawer"]')
  await expect(drawer).toBeVisible()
  await expect(page.locator(`[data-testid="admin-list-drawer"][data-list-id="${listId}"]`)).toHaveCount(1)
})
