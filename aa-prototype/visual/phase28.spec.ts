import { expect, test, type Page } from '@playwright/test'

/**
 * Catch-up Phase 28 · Slot and List split: the office's Find available (tier
 * order, not-preferred apart), Assign List shown the same in all three apps,
 * Schedule settings with the horizon and the beyond-horizon day, and the
 * rule that "slot" never reaches the screen.
 */

async function fresh(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

const tiersIn = async (page: Page, shot: string) =>
  page.locator(`[data-shot="${shot}"] button[data-candidate] [data-tier]`).evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-tier'))))

test('Find available lists open PM sessions by tier; with Ms Reid chosen, Dr Sharma sits apart and opens Assign List with Reid prefilled', async ({ page }) => {
  // Tue 21 Jul PM: Dr Sharma's session is free (open for cover), and the seed
  // records Ms Reid as not preferred with Dr Sharma (Phase 17).
  await fresh(page, '/admin/day/2026-07-21')
  await page.locator('[data-shot="admin-availability-finder-open"]').click()
  const finder = page.locator('[data-shot="admin-availability-finder"]')
  await expect(finder).toBeVisible()
  await finder.getByRole('group', { name: 'Session' }).getByRole('button', { name: 'PM' }).click()
  await expect(finder.locator('[data-shot="finder-count"]')).toContainText('free this PM')
  const clear = await tiersIn(page, 'candidates-clear')
  expect(clear.length).toBeGreaterThan(2)
  expect(clear).toEqual([...clear].sort((a, b) => a - b))
  await page.screenshot({ path: 'visual/shots/p28-01-finder-tiers.png' })

  await finder.locator('select[data-shot="finder-surgeon"]').selectOption('S-REID')
  await expect(finder.getByText('Not preferred with Ms Reid')).toBeVisible()
  const apart = finder.locator('[data-shot="candidates-not-preferred"] button[data-candidate]')
  await expect(apart).toHaveCount(1)
  await expect(apart.first()).toHaveAttribute('data-candidate', '41267')
  await expect(finder.locator('[data-shot="candidates-clear"] button[data-candidate="41267"]')).toHaveCount(0)
  const clearWithReid = await tiersIn(page, 'candidates-clear')
  expect(clearWithReid).toEqual([...clearWithReid].sort((a, b) => a - b))
  await page.screenshot({ path: 'visual/shots/p28-02-finder-not-preferred.png' })

  await apart.first().click()
  const assign = page.locator('[data-shot="admin-assign-list"]')
  await expect(assign).toBeVisible()
  await expect(assign.locator('select[data-shot="surgeon-picker"]')).toHaveValue('S-REID')
  await expect(page.locator('[data-shot="assign-list-pairing-warning"]')).toContainText('Ms A. Reid prefers not to work with Dr Priya Sharma.')
  await expect(assign.getByRole('button', { name: 'Assign anyway' })).toBeVisible()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/p28-03-finder-assign.png' })
})

test('Assign List on Dr Souter\'s free Wed 22 PM shows as a booked List in Admin, mobile and web', async ({ page }) => {
  await fresh(page, '/admin/day/2026-07-22')
  await page.locator('button[data-slot-id="S-34821-2026-07-22-PM"]').click()
  const drawer = page.locator('[data-shot="admin-slot-drawer"]')
  await expect(drawer).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p28-04-empty-session-drawer.png' })
  await drawer.getByRole('button', { name: 'Assign List', exact: true }).click()
  const sheet = page.locator('[data-shot="admin-assign-list"]')
  await sheet.getByRole('button', { name: 'Assign List', exact: true }).click()
  await expect(sheet.getByRole('alert')).toHaveText('Choose the hospital.')
  await sheet.getByLabel('Hospital').selectOption({ label: "St George's" })
  await sheet.getByLabel('Surgeon').selectOption('S-HALE')
  await sheet.getByRole('button', { name: 'Assign List', exact: true }).click()
  await expect(sheet).toHaveCount(0)
  const listDrawer = page.getByTestId('admin-list-drawer')
  await expect(listDrawer).toContainText('ACTIVE')
  await expect(listDrawer).toContainText("St George's")
  await page.screenshot({ path: 'visual/shots/p28-05-assigned-drawer.png' })

  await page.goto('/mobile/lists')
  await page.waitForLoadState('networkidle')
  const row = page.locator('[data-slot-id="S-34821-2026-07-22-PM"]')
  await expect(row).toHaveAttribute('data-list-id', /^LG\d{4}$/)
  await expect(row).toContainText("St George's")
  await expect(row).not.toContainText('Open for bookings')
  await page.screenshot({ path: 'visual/shots/p28-06-mobile-assigned.png' })

  await page.goto('/web/lists')
  await page.waitForLoadState('networkidle')
  const webRow = page.locator('tr[data-slot-id="S-34821-2026-07-22-PM"]')
  await expect(webRow).toContainText("St George's")
  await expect(webRow).toContainText('Private')
})

test('Schedule settings: the horizon shortens to 3 months with a preview and confirm, the day past it says so, and 4 restores it', async ({ page }) => {
  await fresh(page, '/admin/masters?view=scheduleSettings')
  const settings = page.locator('[data-shot="admin-schedule-settings"]')
  await expect(settings).toContainText('4 months')
  await expect(settings).toContainText('Sat 21 Nov 2026')
  await expect(settings).toContainText('Sessions with their own times keep them.')
  await page.screenshot({ path: 'visual/shots/p28-07-schedule-settings.png' })

  await settings.getByRole('button', { name: 'Edit horizon' }).click()
  const sheet = page.locator('[data-shot="admin-horizon-months"]')
  await sheet.getByLabel('Months ahead').fill('3')
  await expect(sheet.locator('[data-shot="horizon-preview"]')).toContainText('Removes 31 days after Wed 21 Oct 2026')
  await sheet.getByRole('button', { name: 'Save horizon' }).click()
  await sheet.getByRole('button', { name: 'Confirm and remove 31 days' }).click()
  await expect(settings).toContainText('3 months')

  await page.goto('/admin/day/2026-11-07')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="admin-day-beyond-horizon"]')).toContainText('Beyond the schedule horizon, which ends Wed 21 Oct 2026.')
  await expect(page.locator('input[type="date"]').first()).toHaveAttribute('max', '2026-10-21')
  await page.screenshot({ path: 'visual/shots/p28-08-beyond-horizon.png' })

  await page.goto('/admin/masters?view=scheduleSettings')
  await settings.getByRole('button', { name: 'Edit horizon' }).click()
  await sheet.getByLabel('Months ahead').fill('4')
  await expect(sheet.locator('[data-shot="horizon-preview"]')).toContainText('Adds 31 days, to Sat 21 Nov 2026.')
  await sheet.getByRole('button', { name: 'Save horizon' }).click()
  await expect(settings).toContainText('4 months')
})

test('"slot" never appears on the screens this phase touched', async ({ page }) => {
  await fresh(page, '/admin/day/2026-07-21')
  const SLOT = /\bslots?\b/i
  const check = async (where: string) => {
    const text = await page.locator('body').innerText()
    expect(SLOT.test(text), `${where} shows "slot"`).toBe(false)
  }
  await check('Admin Day')
  await page.locator('button[data-slot-id="S-41267-2026-07-21-PM"]').click()
  await check('empty-session drawer')
  await page.getByRole('button', { name: 'Edit times', exact: true }).click()
  await check('Edit times')
  await page.keyboard.press('Escape')
  // The demo inspector (/demo/data) is exempt: it names the code collections (slots, lists) by design.
  for (const path of ['/admin/masters?view=scheduleSettings', '/admin/masters?view=anaesthetists', '/admin/audit', '/mobile/lists', '/mobile/availability', '/web', '/web/lists', '/web/availability']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await check(path)
  }
})
