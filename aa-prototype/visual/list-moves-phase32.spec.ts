import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 32 · An anaesthetist moves her own List, and the shared
 * notification pool. Dr Souter hands her St George's Mon 27 Jul PM List (Ms G.
 * Lim) on to Dr Ropata, who has a not-preferred pairing with Ms Lim, and sees
 * no warning (US-01.4.5); returns her Thu 23 AM List to the office; marks her
 * Thu 23 PM session Unavailable and is asked where its List goes (US-01.5.5).
 * The office sees each move in the shared pool (US-13.8.1, US-13.8.2).
 */

async function fresh(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

const FORBIDDEN = /\bslots?\b|swap|blacklist|whitelist|not preferred|preferred|tier|warning|[–—]/i

async function clean(page: Page, scope: string, where: string) {
  const text = await page.locator(scope).innerText()
  expect(FORBIDDEN.test(text), `${where}: "${text.match(FORBIDDEN)?.[0] ?? ''}"`).toBe(false)
}

test('web: hand a List on to a colleague with no warning, then the office sees it', async ({ page }) => {
  await fresh(page, '/web/availability?date=2026-07-27')
  await expect(page.locator('[data-shot="availability-move-mine-pm"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32-01-web-grid.png', fullPage: true })

  await page.locator('[data-shot="availability-move-mine-pm"]').click()
  const sheet = page.locator('[data-shot="move-sheet"]')
  await expect(sheet.locator('[data-shot="move-where"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32-01b-web-where.png', fullPage: true })
  await sheet.locator('[data-shot="move-choice-colleague"]').click()

  // The flat colleague list: Dr Ropata (not preferred with Ms Lim) offered like anyone else.
  const colleagues = sheet.locator('[data-shot="move-colleagues"]')
  await expect(colleagues.locator('[data-shot="move-colleague-39560"]')).toContainText('Dr Hannah Ropata')
  const names = await colleagues.locator('button span span:first-child').allInnerTexts()
  const surnames = names.map((n) => n.trim().split(/\s+/).pop() ?? '')
  expect(surnames).toEqual([...surnames].sort((a, b) => a.localeCompare(b)))
  await clean(page, '[data-shot="move-sheet"]', 'colleague list')
  await page.screenshot({ path: 'visual/shots/p32-02-web-colleagues.png', fullPage: true })

  await colleagues.locator('[data-shot="move-colleague-39560"]').click()
  const confirm = sheet.locator('[data-shot="move-confirm"]')
  await expect(confirm).toContainText('Dr Hannah Ropata')
  await expect(confirm.getByRole('button', { name: 'Move List' })).toBeVisible()
  await clean(page, '[data-shot="move-sheet"]', 'confirm step')
  await page.screenshot({ path: 'visual/shots/p32-03-web-confirm.png', fullPage: true })

  await confirm.getByRole('button', { name: 'Move List' }).click()
  await expect(sheet.locator('[data-shot="move-done"]')).toContainText('Moved to Dr Ropata')
  await page.screenshot({ path: 'visual/shots/p32-03b-web-moved.png', fullPage: true })
  await sheet.getByRole('button', { name: 'Done' }).click()
  // Her old cell is Free; the List is on Ropata's row.
  await expect(page.locator('[data-slot-id="S-34821-2026-07-27-PM"]')).toContainText('Free')
  await expect(page.locator('[data-slot-id="S-39560-2026-07-27-PM"]')).toContainText("St George's")

  // Admin Day on that date: the notification on the rail, the drawer line.
  await page.goto('/admin/day/2026-07-27')
  await page.waitForLoadState('networkidle')
  const card = page.locator('[data-shot="admin-notifications-rail"]')
  await expect(card).toContainText("Dr Souter moved Mon 27 Jul PM (St George's, Ms G. Lim) to Dr Ropata")
  await page.screenshot({ path: 'visual/shots/p32-04-admin-rail.png', fullPage: true })
  await card.locator('[data-notification-row]').first().click()
  await expect(page.locator('[data-shot="drawer-moved-here"]')).toContainText('Moved here by Dr Souter')
  await expect(page.locator('[data-testid="admin-list-drawer"]')).not.toContainText(/acknowledged|not preferred/i)
  await page.screenshot({ path: 'visual/shots/p32-05-admin-drawer.png', fullPage: true })
  // History: the move is one "List moved by its anaesthetist", with no pairing acknowledgement.
  await page.locator('[data-testid="admin-list-drawer"]').getByRole('button', { name: /History/ }).first().click()
  const history = page.getByRole('dialog').last()
  await expect(history).toContainText('List moved by its anaesthetist')
  await expect(history).not.toContainText(/acknowledged|not preferred/i)
  await page.screenshot({ path: 'visual/shots/p32-05b-admin-history.png', fullPage: true })
})

test('web: a colleague free cell is status only where she has no List that session', async ({ page }) => {
  // Wed 22 PM: Dr Souter's session is free, so nothing in the PM column moves; her AM List does.
  await fresh(page, '/web/availability?date=2026-07-22')
  await expect(page.locator('[data-shot="availability-move-mine-am"]')).toBeVisible()
  await expect(page.locator('[data-shot$="-pm"][data-shot^="availability-move-to-"]')).toHaveCount(0)
  await expect(page.locator('[data-shot$="-am"][data-shot^="availability-move-to-"]').first()).toBeVisible()
})

test('web: return a List to the office from List detail, choosing Unavailable', async ({ page }) => {
  await fresh(page, '/web/lists/L-34821-2026-07-23-AM')
  await page.locator('[data-shot="list-move"]').click()
  const sheet = page.locator('[data-shot="move-sheet"]')
  await sheet.locator('[data-shot="move-choice-office"]').click()
  await expect(sheet.locator('[data-shot="move-vacated"]')).toBeVisible()
  await expect(sheet.locator('[data-shot="move-vacated-free"]')).toHaveAttribute('aria-checked', 'true')
  await sheet.locator('[data-shot="move-vacated-unavailable"]').click()
  await clean(page, '[data-shot="move-sheet"]', 'return confirm')
  await expect(sheet).not.toContainText('Draft List')
  await page.screenshot({ path: 'visual/shots/p32-06-web-return-confirm.png', fullPage: true })
  await sheet.getByRole('button', { name: 'Move List' }).click()
  await expect(sheet.locator('[data-shot="move-done"]')).toContainText('Returned to the office')
  await page.screenshot({ path: 'visual/shots/p32-07-web-returned.png', fullPage: true })
  await sheet.getByRole('button', { name: 'Done' }).click()
  // The List left her schedule: the page falls back.
  await expect(page).not.toHaveURL(/L-34821-2026-07-23-AM/)

  await page.goto('/admin/notifications')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="admin-notifications-table"]')).toContainText('Dr Souter returned Thu 23 Jul AM')
  await page.getByRole('button', { name: 'Open Draft List' }).first().click()
  await expect(page.locator('[data-shot="draft-list-returned-by"]')).toContainText('Returned to the office by Dr Souter')
  await expect(page.locator('[data-shot="draft-list-returned-by"]').locator('..')).toContainText('Moved to the office')
  await page.screenshot({ path: 'visual/shots/p32-08-admin-draft-list.png', fullPage: true })
})

test('mobile: marking a booked session Unavailable asks where its List goes', async ({ page }) => {
  await fresh(page, '/mobile/availability')
  await page.locator('button[data-date="2026-07-23"]').click()
  await expect(page.locator('[data-shot="availability-move-pm"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32-09-mobile-find-cover.png' })
  await page.locator('[data-shot="availability-change"]').click()
  const editor = page.locator('[data-shot="mobile-availability-sheet"]')
  await expect(editor).toBeVisible()
  await editor.locator('[data-slot-id="S-34821-2026-07-23-PM"]').getByRole('button', { name: 'Change', exact: true }).click()
  await editor.locator('[data-status-choice="unavailable"]').click()
  await editor.getByRole('button', { name: 'Save', exact: true }).click()

  const sheet = page.locator('[data-aa-mobile-product] [data-shot="move-sheet"]')
  await expect(sheet.locator('[data-shot="move-unavailable-line"]')).toContainText('You are marking this session Unavailable')
  await expect(sheet.locator('[data-shot="move-choice-office"]')).toBeVisible()
  await expect(sheet.locator('[data-shot="move-choice-colleague"]')).toBeVisible()
  await clean(page, '[data-aa-mobile-product] [data-shot="move-sheet"]', 'unavailable prompt')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32-10-mobile-unavailable-prompt.png' })

  await sheet.locator('[data-shot="move-choice-colleague"]').click()
  await sheet.locator('[data-shot="move-colleagues"] button').first().click()
  await expect(sheet.locator('[data-shot="move-confirm"]')).toContainText('Your session: Unavailable')
  await sheet.getByRole('button', { name: 'Move List' }).click()
  await expect(sheet.locator('[data-shot="move-done"]')).toBeVisible()
  await sheet.getByRole('button', { name: 'Done' }).click()
  // The status saved once the List had gone, with no conflict.
  await expect(editor.locator('[data-shot="availability-result"]')).toContainText('1 session set to Unavailable on Thu 23 Jul. Its List went first, where you chose.')
  await expect(editor).not.toContainText(/flagged|conflict/i)
  await page.screenshot({ path: 'visual/shots/p32-11-mobile-after-prompt.png' })
})

test('mobile: the move sheet from Find cover', async ({ page }) => {
  await fresh(page, '/mobile/availability')
  await page.locator('button[data-date="2026-07-23"]').click()
  await page.locator('[data-shot="availability-move-am"]').click()
  const sheet = page.locator('[data-aa-mobile-product] [data-shot="move-sheet"]')
  await expect(sheet.locator('[data-shot="move-where"]')).toBeVisible()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32-09b-mobile-move-sheet.png' })
  await clean(page, '[data-aa-mobile-product] [data-shot="move-sheet"]', 'mobile move sheet')
})

test('admin: a colleague returns a List, then a busy morning pages the pool', async ({ page }) => {
  await fresh(page, '/admin/day/2026-07-21')
  await expect(page.locator('[data-shot="admin-notifications-rail"]')).toContainText('No notifications yet')
  const one = await runDemoAction(page, 'colleague-moves-list-to-office', { choice: 'one', close: true })
  expect(one).toMatch(/returned .+ to the office\. It is now a Draft List\./)
  await expect(page.locator('[data-shot="admin-notifications-rail"] [data-notification-row]')).toHaveCount(1)
  await page.locator('[data-shot="admin-notifications-rail"]').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p32-12-admin-one-move.png', fullPage: true })
  await page.locator('[data-shot="admin-notifications-rail"]').screenshot({ path: 'visual/shots/p32-12b-notifications-card.png' })

  await runDemoAction(page, 'colleague-moves-list-to-office', { choice: 'busy', close: true })
  await page.goto('/admin/notifications')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="admin-notifications-pager"]')).toContainText('Page 1 of 2')
  await expect(page.locator('[data-notification-row]')).toHaveCount(6)
  await page.screenshot({ path: 'visual/shots/p32-13-notifications-page-1.png', fullPage: true })
  await page.getByRole('button', { name: 'Older' }).click()
  await expect(page.locator('[data-shot="admin-notifications-pager"]')).toContainText('Page 2 of 2')
  await expect(page.locator('[data-notification-row]')).toHaveCount(3)
  await page.screenshot({ path: 'visual/shots/p32-14-notifications-page-2.png', fullPage: true })
  // The same after visiting another Admin screen and coming back.
  await page.goto('/admin/audit')
  await page.goto('/admin/notifications?page=2')
  await expect(page.locator('[data-notification-row]')).toHaveCount(3)

  await page.goto('/admin/day/2026-07-21')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'visual/shots/p32-15-admin-day-after.png', fullPage: true })
})

test('web: days off over two booked sessions prompt one List at a time, then apply', async ({ page }) => {
  await fresh(page, '/web/availability/mine?date=2026-07-27')
  const rail = page.locator('[data-shot="web-availability-rail"]')
  await rail.getByRole('button', { name: 'Change both sessions' }).click()
  await rail.locator('[data-status-choice="holiday"]').click()
  await rail.getByRole('button', { name: 'Save', exact: true }).click()

  const intro = page.locator('[data-shot="move-lists-intro"]')
  await expect(intro).toContainText('2 of your sessions have Lists')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32-16-web-range-intro.png', fullPage: true })
  await intro.getByRole('button', { name: 'Choose where they go' }).click()

  const sheet = page.locator('[data-shot="move-sheet"]')
  for (const step of ['1 of 2', '2 of 2']) {
    await expect(sheet.locator('[data-shot="move-list-header"]')).toContainText(step)
    if (step === '1 of 2') await page.waitForTimeout(400)
    if (step === '1 of 2') await page.screenshot({ path: 'visual/shots/p32-17-web-range-prompt.png', fullPage: true })
    await sheet.locator('[data-shot="move-choice-office"]').click()
    await expect(sheet.locator('[data-shot="move-confirm"]')).toContainText('Your session: On holiday')
    await sheet.getByRole('button', { name: 'Move List' }).click()
    await expect(sheet.locator('[data-shot="move-done"]')).toContainText('Returned to the office')
    await sheet.getByRole('button', { name: 'Done' }).click()
  }
  await expect(rail.locator('[data-shot="availability-result"]')).toContainText('2 sessions set to On holiday on Mon 27 Jul. 2 Lists went first, where you chose.')
  await page.screenshot({ path: 'visual/shots/p32-18-web-range-applied.png', fullPage: true })
})

test('My calendar (mobile and web): a day holding a movable List offers Move this List', async ({ page }) => {
  await fresh(page, '/mobile/availability/calendar')
  await page.locator('[data-shot="mobile-availability-calendar"] button[data-date="2026-07-23"]').click()
  const move = page.locator('[data-shot="availability-panel-move"]').first()
  await expect(move).toBeVisible()
  await move.getByRole('button', { name: 'Move this List' }).click()
  await expect(page.locator('[data-aa-mobile-product] [data-shot="move-where"]')).toBeVisible()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32-19-mobile-calendar-move.png' })

  await fresh(page, '/web/availability/mine?date=2026-07-23')
  await page.locator('[data-shot="web-availability-rail"] [data-shot="availability-panel-move"]').first().getByRole('button', { name: 'Move this List' }).click()
  await expect(page.locator('[data-shot="move-where"]')).toBeVisible()
})

test('the Control Panel indexes both triggers', async ({ page }) => {
  await fresh(page, '/demo/control')
  await expect(page.getByText('Colleague moves a List to the office')).toBeVisible()
  await expect(page.getByText('Colleague moves a List into my free session')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32-20-control-panel.png', fullPage: true })
})
