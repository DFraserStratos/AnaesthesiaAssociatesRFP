import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 32a · an anaesthetist moves a single Booking to a colleague
 * (US-01.4.7, US-01.4.6). Seed pins (`BOOKING_MOVE_DEMO`): Dr Souter's Wed 22
 * Jul AM List at Christchurch Eye Surgery (Mr Whitford), Booking BK0046 to Dr
 * Whitaker (free), Dr Chen not available, Dr Fitzgerald already holding a List;
 * BK0047 to Dr Ropata with the office tick off; the paid Nair Booking BK0038
 * (Fri 24 PM) for the honour-system line.
 */

const SOURCE = 'L-34821-2026-07-22-AM'
const FORBIDDEN = /\bslots?\b|swap|blacklist|whitelist|preferred|\btier\b|warning|anyway|estimate|deposit|Draft List|[–—]/i

async function fresh(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

async function clean(page: Page, scope: string, where: string): Promise<void> {
  const text = await page.locator(scope).innerText()
  expect(FORBIDDEN.test(text), `${where}: "${text.match(FORBIDDEN)?.[0] ?? ''}"`).toBe(false)
}

test('web: Move to a colleague, find by name, a blocked colleague, tell the office, done', async ({ page }) => {
  await fresh(page, `/web/lists/${SOURCE}/bookings/BK0046`)
  const action = page.locator('[data-shot="move-booking-action"]')
  await expect(action).toContainText('Move to a colleague')
  await expect(action).toContainText('Hand this Booking to a colleague who is free that session.')
  await action.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p32a-01-web-action.png', fullPage: true })

  await action.getByRole('button', { name: 'Move to a colleague' }).click()
  const sheet = page.locator('[data-shot="move-booking-sheet"]')
  await expect(sheet).toContainText('Free this session')
  const free = sheet.locator('[data-shot="move-booking-receiver"]')
  await expect(free).toHaveText([/Dr Mark Delaney/, /Dr Kate Morrison/, /Dr Tom Ngata/, /Dr Hannah Ropata/, /Dr Priya Sharma/, /Dr Ben Whitaker/])
  await expect(sheet.locator('[data-shot="move-booking-blocked"]')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p32a-02-web-free.png' })

  // Type-ahead: names narrow as each letter is typed; a colleague away shows, neutral, not pickable.
  const search = sheet.locator('[data-shot="move-booking-search"] input')
  await search.pressSequentially('ch')
  const blocked = sheet.locator('[data-shot="move-booking-blocked"][data-anaesthetist-id="45178"]')
  await expect(blocked).toContainText('Not available this session. They can set it available in their app, then you can move it.')
  await expect(blocked).toHaveAttribute('aria-disabled', 'true')
  expect(await blocked.evaluate((el) => el.tagName)).not.toBe('BUTTON')
  await page.screenshot({ path: 'visual/shots/p32a-03-web-blocked.png' })
  await search.fill('fitz')
  await expect(sheet.locator('[data-shot="move-booking-blocked"][data-anaesthetist-id="43015"]')).toContainText('Already has a List this session')
  await search.fill('zzz')
  await expect(sheet).toContainText('No anaesthetist matches')
  await clean(page, '[data-shot="move-booking-sheet"]', 'search step')

  await search.fill('whit')
  await sheet.locator('[data-shot="move-booking-receiver"][data-anaesthetist-id="36208"]').click()
  const confirm = sheet.locator('[data-shot="move-booking-confirm"]')
  await expect(confirm).toContainText("A new List is created in Dr Whitaker's Wed 22 Jul AM session at Christchurch Eye Surgery.")
  await expect(confirm).toContainText('Dr Whitaker is paid for it.')
  await expect(confirm.locator('[data-shot="move-booking-honour"]')).toHaveCount(0)
  const tick = confirm.locator('[data-shot="move-booking-tell-office"] input')
  await expect(tick).not.toBeChecked()
  await clean(page, '[data-shot="move-booking-confirm"]', 'confirm step')
  await page.screenshot({ path: 'visual/shots/p32a-04-web-confirm.png' })
  await tick.check()
  await confirm.getByRole('button', { name: 'Move Booking' }).click()
  const done = sheet.locator('[data-shot="move-booking-done"]')
  await expect(done).toContainText('Moved to Dr Whitaker.')
  await expect(done).toContainText('The office has been told.')
  await page.screenshot({ path: 'visual/shots/p32a-05-web-done.png' })
  await done.getByRole('button', { name: 'Back to your List' }).click()
  await expect(page).toHaveURL(new RegExp(`/web/lists/${SOURCE}$`))
  await expect(page.locator('body')).not.toContainText('BK0046')

  // A second Booking, tick off: no "office told" line.
  await page.goto(`/web/lists/${SOURCE}/bookings/BK0047`)
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="move-booking-action"]').getByRole('button', { name: 'Move to a colleague' }).click()
  await sheet.locator('[data-shot="move-booking-receiver"][data-anaesthetist-id="39560"]').click()
  await sheet.getByRole('button', { name: 'Move Booking' }).click()
  await expect(done).toContainText('Moved to Dr Ropata.')
  await expect(done).not.toContainText('The office has been told.')

  // The office's side: a new ACTIVE List on Dr Whitaker's row, the drawer line, and one pool row.
  await page.goto('/admin/day/2026-07-22')
  await page.waitForLoadState('networkidle')
  const whitaker = page.locator('[data-slot-id="S-36208-2026-07-22-AM"]')
  await expect(whitaker).toHaveAttribute('data-list-id', /^LG\d{4}$/)
  await expect(whitaker).toContainText('Christchurch Eye Surgery')
  await expect(page.locator('[data-shot="admin-notifications-rail"]')).toContainText('Dr Souter moved a Booking')
  await expect(page.locator('[data-shot="admin-notifications-rail"] [data-notification-row]')).toHaveCount(1)
  await whitaker.click()
  await expect(page.locator('[data-shot="drawer-booking-moved-here"]')).toContainText('Booking moved here by Dr Souter')
  await page.screenshot({ path: 'visual/shots/p32a-06-admin-day.png' })
})

test('mobile: the same flow from the Booking sheet, as a bottom sheet', async ({ page }) => {
  await fresh(page, `/mobile/lists/${SOURCE}/bookings/BK0046`)
  const phone = page.locator('[data-aa-mobile-product]')
  const action = phone.locator('[data-shot="move-booking-action"]')
  await action.scrollIntoViewIfNeeded()
  await action.getByRole('button', { name: 'Move to a colleague' }).click()
  const sheet = phone.locator('[data-shot="move-booking-sheet"]')
  await expect(sheet).toContainText('Free this session')
  await expect(sheet.locator('[data-shot="move-booking-search"]')).toBeInViewport()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32a-07-mobile-sheet.png' })
  await sheet.locator('[data-shot="move-booking-receiver"][data-anaesthetist-id="36208"]').click()
  await expect(sheet.locator('[data-shot="move-booking-confirm"]')).toContainText('Dr Whitaker is paid for it.')
  await page.screenshot({ path: 'visual/shots/p32a-08-mobile-confirm.png' })
  await sheet.getByRole('button', { name: 'Move Booking' }).click()
  await expect(sheet.locator('[data-shot="move-booking-done"]')).toContainText('Moved to Dr Whitaker.')
  await page.screenshot({ path: 'visual/shots/p32a-09-mobile-done.png' })
  await sheet.getByRole('button', { name: 'Back to your List' }).click()
  await expect(page).toHaveURL(new RegExp(`/mobile/lists/${SOURCE}$`))
})

test('prepaid: the confirm step shows the honour-system line, never estimate or deposit', async ({ page }) => {
  await fresh(page, '/web/lists/L-34821-2026-07-24-PM/bookings/BK0038')
  await page.locator('[data-shot="move-booking-action"]').getByRole('button', { name: 'Move to a colleague' }).click()
  const sheet = page.locator('[data-shot="move-booking-sheet"]')
  await sheet.locator('[data-shot="move-booking-receiver"]').first().click()
  const honour = sheet.locator('[data-shot="move-booking-honour"]')
  await expect(honour).toHaveText(/^This Booking is prepaid\. The prepaid amount stays as agreed, and moves to Dr \w+ once the List is authorised\.$/)
  await clean(page, '[data-shot="move-booking-confirm"]', 'prepaid confirm')
  await page.screenshot({ path: 'visual/shots/p32a-10-prepaid-honour.png' })
})

test('the submit sheet says who did the procedures, in one sentence and no extra step', async ({ page }) => {
  await fresh(page, '/web/lists/L-34821-2026-07-21-AM')
  await page.getByRole('button', { name: 'Mark list completed' }).click()
  const note = page.locator('[data-shot="submit-doer-note"]')
  await expect(note).toHaveText('Submitting says you did every procedure on this List. If a colleague is doing one, move it to them first.')
  await expect(page.getByRole('button', { name: 'Submit to office' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32a-11-submit-doer.png' })
})

test('Admin Day: Colleague hands a Booking to Dr Souter puts a new List on her row and the pool', async ({ page }) => {
  await fresh(page, '/admin/day/2026-07-21')
  const message = await runDemoAction(page, 'colleague-hands-booking-to-souter', { close: true })
  expect(message).toBe('Dr Hughes moved a Booking (Wed 22 Jul PM, Christchurch Eye Surgery) to Dr Souter. A new List was created.')
  await expect(page.locator('[data-shot="admin-notifications-rail"]')).toContainText('Dr Hughes moved a Booking')
  await page.goto('/admin/day/2026-07-22')
  await page.waitForLoadState('networkidle')
  const souter = page.locator('[data-slot-id="S-34821-2026-07-22-PM"]')
  await expect(souter).toHaveAttribute('data-list-id', /^LG\d{4}$/)
  await page.screenshot({ path: 'visual/shots/p32a-12-admin-trigger.png' })

  // Her side, in the framed mobile app: the Moved to you panel on Find cover.
  await page.goto('/mobile/availability')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="moved-to-you-booking-row"]')).toContainText('Dr Hughes moved a Booking to you: Wed 22 Jul PM, Christchurch Eye Surgery')
  await page.screenshot({ path: 'visual/shots/p32a-13-moved-to-you.png' })
})

test('no warning for a not-preferred receiver: Mrs Riley (Ms Lim) to Dr Ropata reads like any other move', async ({ page }) => {
  await fresh(page, '/web/lists/L-34821-2026-07-24-AM/bookings/BK0034')
  await page.locator('[data-shot="move-booking-action"]').getByRole('button', { name: 'Move to a colleague' }).click()
  const sheet = page.locator('[data-shot="move-booking-sheet"]')
  await clean(page, '[data-shot="move-booking-sheet"]', 'free colleagues')
  await sheet.locator('[data-shot="move-booking-receiver"][data-anaesthetist-id="39560"]').click()
  const confirm = sheet.locator('[data-shot="move-booking-confirm"]')
  await expect(confirm).toContainText("A new List is created in Dr Ropata's Fri 24 Jul AM session at Forte Health.")
  await expect(confirm.locator('[data-shot="move-booking-honour"]')).toContainText('moves to Dr Ropata once the List is authorised.')
  await clean(page, '[data-shot="move-booking-confirm"]', 'not-preferred confirm')
  // Web footer (UI unification U2, question 13): Back hugging first, the primary last.
  await expect(confirm.getByRole('button')).toHaveText(['Back', 'Move Booking'])
  await page.screenshot({ path: 'visual/shots/p32a-14-not-preferred-confirm.png' })
})

test('the Control Panel indexes both triggers', async ({ page }) => {
  await fresh(page, '/demo/control')
  const admin = page.locator('[data-shot="index-colleague-hands-booking-to-souter"]')
  await expect(admin).toContainText('Colleague hands a Booking to Dr Souter')
  await expect(admin.getByRole('button', { name: 'Open screen' })).toBeEnabled()
  const pwa = page.locator('[data-shot="index-colleague-moves-booking-to-me"]')
  await expect(pwa).toContainText('Colleague moves a Booking to me')
  await expect(pwa).toContainText('Shown in the installed PWA')
  await admin.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p32a-15-control-panel.png' })
})
