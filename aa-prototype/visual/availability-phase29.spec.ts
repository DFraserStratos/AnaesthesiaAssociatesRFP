import { expect, test, type Page } from '@playwright/test'

/**
 * Catch-up Phase 29 · Availability calendar and status master: the mobile
 * calendar, its bottom sheet (days off ahead, a repeating series, one
 * instance), the web My availability page with a range in the rail, and the
 * Admin Availability statuses master; no "slot" and no List state on any of
 * them.
 */

async function fresh(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

const SLOT = /\bslots?\b/i
async function noSlot(page: Page, where: string) {
  const text = await page.locator('body').innerText()
  expect(SLOT.test(text), `${where} shows "slot"`).toBe(false)
}

test('mobile: My calendar, Add days off for a week, a fortnightly Friday PM series and one instance', async ({ page }) => {
  await fresh(page, '/mobile/availability')
  await expect(page.getByText('My availability', { exact: true })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Availability view' }).getByRole('button', { name: 'Free only' })).toBeVisible()
  await page.locator('[data-shot="availability-open-calendar"]').click()
  await expect(page).toHaveURL(/\/mobile\/availability\/calendar$/)
  const calendar = page.locator('[data-shot="mobile-availability-calendar"]')
  await expect(calendar.getByText('July 2026')).toBeVisible()
  // Souter's seeded leave, Sat 25 and Sun 26 Jul, as Holiday half-blocks.
  await expect(calendar.locator('[data-slot-id="S-34821-2026-07-25-AM"]')).toHaveAttribute('title', 'AM Holiday')
  await expect(page.getByRole('button', { name: 'Lists', exact: true })).toHaveCount(0) // no tab bar on the layer
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p29-01-mobile-calendar.png' })
  await noSlot(page, 'mobile calendar')

  // Days off ahead: On holiday, both sessions, Fri 14 to Sun 16 Aug. (A week
  // from Mon 10 Aug now meets her recurring Lists, which the move prompt asks
  // about first: catch-up Phase 32, US-01.5.5, in list-moves-phase32.spec.ts.)
  await page.locator('[data-shot="mobile-add-days-off"]').click()
  const sheet = page.locator('[data-shot="mobile-availability-sheet"]')
  await expect(sheet).toBeVisible()
  await expect(sheet.locator('[data-status-choice]')).toHaveCount(3)
  await expect(sheet.locator('[data-status-choice="holiday"]')).toHaveAttribute('aria-pressed', 'true')
  await sheet.getByLabel('From').fill('2026-08-14')
  await sheet.getByLabel('To').fill('2026-08-16')
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/p29-02-mobile-sheet-week.png' })
  await noSlot(page, 'mobile sheet')
  await sheet.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(sheet.locator('[data-shot="availability-result"]')).toContainText('6 sessions set to On holiday, 14 Aug to 16 Aug.')
  await sheet.getByRole('button', { name: 'Done', exact: true }).click()
  await page.locator('[data-shot="mobile-availability-calendar"]').getByRole('button', { name: 'Next month' }).click()
  await expect(calendar.locator('[data-slot-id="S-34821-2026-08-15-PM"]')).toHaveAttribute('title', 'PM Holiday')

  // A series: Unavailable, PM, every 2 weeks, Friday, no end date.
  await page.locator('[data-shot="mobile-add-days-off"]').click()
  await sheet.locator('[data-status-choice="unavailable"]').click()
  await sheet.getByRole('group', { name: 'Sessions' }).getByRole('button', { name: 'PM' }).click()
  await sheet.getByRole('group', { name: 'Repeat' }).getByRole('button', { name: 'Every 2 weeks' }).click()
  await sheet.getByLabel('Starts').fill('2026-08-14')
  await expect(sheet.locator('[data-weekday="5"]')).toHaveAttribute('aria-pressed', 'true')
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/p29-03-mobile-sheet-series.png' })
  await sheet.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(sheet.locator('[data-shot="availability-result"]')).toContainText('Series saved: Unavailable, Friday PM, every 2 weeks, no end date.')
  await expect(sheet.locator('[data-shot="availability-result"]')).toContainText('1 already set left as it is')
  await sheet.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(calendar.locator('[data-shot="mobile-availability-series"]')).toContainText('Unavailable, Friday PM, every 2 weeks, no end date')

  // One instance: Fri 28 Aug.
  await calendar.locator(`button[data-date="2026-08-28"]`).click()
  await expect(sheet.getByRole('button', { name: 'Change this one' })).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Delete this one' })).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Delete the series' })).toBeVisible()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/p29-04-mobile-instance.png' })
  await noSlot(page, 'series instance panel')
})

test('web: My availability, click then shift-click a range, the rail form', async ({ page }) => {
  await fresh(page, '/web/availability')
  await page.getByRole('group', { name: 'Availability page' }).getByRole('button', { name: 'My availability' }).click()
  await expect(page).toHaveURL(/\/web\/availability\/mine$/)
  await page.getByRole('button', { name: 'Next month' }).click()
  await page.locator('button[data-date="2026-08-17"]').click()
  await page.locator('button[data-date="2026-08-21"]').click({ modifiers: ['Shift'] })
  const rail = page.locator('[data-shot="web-availability-rail"]')
  await expect(rail).toContainText('Mon 17 Aug to Fri 21 Aug')
  await expect(rail.getByLabel('To')).toHaveValue('2026-08-21')
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/p29-05-web-mine-range.png', fullPage: true })
  await noSlot(page, 'web My availability')
  // The Find cover grid's own row opens My availability on that date.
  await page.goto('/web/availability')
  await page.locator('[data-shot="availability-change-mine"]').click()
  await expect(page).toHaveURL(/\/web\/availability\/mine\?date=2026-07-21$/)
  await expect(page.locator('[data-shot="web-availability-rail"]')).toContainText('Tuesday 21 July')
})

test('admin: Availability statuses, the sheet with its live preview, and a rename every view follows', async ({ page }) => {
  await fresh(page, '/admin/masters?view=availability-statuses')
  const table = page.locator('[data-shot="admin-availability-statuses"]')
  await expect(table.locator('tr[data-status-row]')).toHaveCount(3)
  for (const state of ['Draft', 'Active', 'Submitted', 'Authorised']) {
    await expect(table.locator('tr[data-status-row]').filter({ hasText: new RegExp(`^\\s*${state}\\b`) })).toHaveCount(0)
  }
  await expect(table).not.toContainText(/\bActive\b/)
  await page.screenshot({ path: 'visual/shots/p29-06-admin-statuses.png' })
  await noSlot(page, 'Admin Availability statuses')

  await page.getByRole('button', { name: 'Edit Unavailable' }).click()
  const sheet = page.locator('[data-shot="admin-availability-status-sheet"]')
  await expect(sheet.locator('[data-shot="status-sheet-id"]')).toHaveText('unavailable')
  await expect(sheet.locator('[data-swatch]')).toHaveCount(6)
  await sheet.getByLabel('Label', { exact: true }).fill('Blocked')
  await expect(sheet.locator('[data-shot="status-sheet-preview"]')).toContainText('Blocked')
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/p29-07-admin-status-sheet.png' })
  await sheet.getByLabel('Label', { exact: true }).fill('Active')
  await expect(sheet).toContainText("That is a List's state, not availability.")
  await sheet.getByLabel('Label', { exact: true }).fill('Blocked')
  await sheet.getByRole('button', { name: 'Save changes' }).click()
  await expect(table).toContainText('Blocked')

  await page.goto('/admin/day/2026-07-21')
  await expect(page.getByRole('button', { name: 'Blocked status' })).toBeVisible()
})
