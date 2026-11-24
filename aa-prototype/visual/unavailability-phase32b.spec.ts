import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'
import { keepSignedInScript } from './storage/demoReady'

// The PWA opens signed out on a fresh handset (catch-up Phase 43a); these PWA tests clear storage, so the session is re-seeded on each load.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(keepSignedInScript)
})

/**
 * Catch-up Phase 32b · Unavailability without conflicts, notices that resolve,
 * and alerting the office: the phase's manual test checklist, walked in the
 * running app with a screenshot per step (checked by eye).
 */

async function fresh(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

async function clean(page: Page, where: string, scope = 'body') {
  const text = await page.locator(scope).first().innerText()
  expect(/\bslots?\b/i.test(text), `${where} shows "slot"`).toBe(false)
  expect(/[\u2013\u2014]/.test(text), `${where} shows an en or em dash`).toBe(false)
  expect(/still being confirmed|keep as is/i.test(text), `${where} shows provisional text`).toBe(false)
}

const CRIMSON = 'rgb(169, 30, 62)'
async function noCrimsonControls(page: Page, scope: string) {
  const colours = await page.locator(`${scope} button`).evaluateAll((els) => els.flatMap((e) => [getComputedStyle(e).backgroundColor, getComputedStyle(e).borderColor, getComputedStyle(e).color]))
  expect(colours.includes(CRIMSON), `${scope}: a control uses crimson`).toBe(false)
}

const RUTHERFORD_WED22_AM = 'L-29104-2026-11-25-AM'
const SHARMA_WED22_PM = 'L-41267-2026-11-25-PM'
const SOUTER_WED22_AM = 'L-34821-2026-11-25-AM'
const SOUTER_BOOKING = 'BK0046'

test('1 · Reset: Rutherford Wed 22 AM reads Unavailable with no flag; his List waits in Draft Lists; Conflicts lists closures only', async ({ page }) => {
  await fresh(page, '/admin/day/2026-11-25')
  const am = page.locator('button[data-slot-id="S-29104-2026-11-25-AM"]')
  await expect(am).toContainText('Unavailable')
  await expect(am).not.toHaveAttribute('data-conflict', 'true')
  await expect(page.locator(`[data-draft-block="${RUTHERFORD_WED22_AM}"]`)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32b-01-day-wed22.png', fullPage: true })
  await page.locator(`[data-draft-block="${RUTHERFORD_WED22_AM}"]`).click()
  await expect(page.locator('[data-shot="admin-draft-list-drawer"]')).toContainText('Returned: anaesthetist unavailable')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32b-02-returned-draft-list.png', fullPage: true })
  await page.goto('/admin/conflicts')
  await page.waitForLoadState('networkidle')
  const reasons = await page.locator('tr[data-conflict-row]').allInnerTexts()
  expect(reasons.length).toBeGreaterThan(0)
  for (const r of reasons) expect(r).toContain('Hospital closed')
  await page.screenshot({ path: 'visual/shots/p32b-03-conflicts-closures.png', fullPage: true })
  await clean(page, 'Conflicts')
})

test('2 · Admin Change status on a booked session forces where the List goes, then the vacated choice; both routes; no conflict', async ({ page }) => {
  await fresh(page, '/admin/day/2026-11-25')
  // Route 1: return to the office.
  await page.locator(`button[data-list-id="${SHARMA_WED22_PM}"]`).click()
  await page.getByTestId('admin-list-drawer').locator('[data-shot="drawer-change-status"]').click()
  const sheet = page.locator('[data-shot="office-status-sheet"]')
  await sheet.locator('[data-status-choice="unavailable"]').click()
  await expect(sheet.locator('[data-shot="office-status-holds-list"]')).toBeVisible()
  await sheet.getByRole('button', { name: 'Continue' }).click()
  await expect(sheet).toContainText('Where does this List go?')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32b-04-office-where.png', fullPage: true })
  await noCrimsonControls(page, '[data-shot="office-status-sheet"]')
  await sheet.locator('[data-shot="office-status-choice-office"]').click()
  await expect(sheet.locator('[data-shot="office-status-vacated-unavailable"]')).toHaveAttribute('aria-checked', 'true')
  await expect(sheet.locator('[data-shot="office-status-vacated-free"]')).toBeVisible()
  await clean(page, 'office confirm', '[data-shot="office-status-sheet"]')
  await page.screenshot({ path: 'visual/shots/p32b-05-office-confirm.png', fullPage: true })
  await sheet.getByRole('button', { name: 'Return to the office' }).click()
  await expect(sheet.locator('[data-shot="office-status-done"]')).toContainText('Returned to the office')
  await page.screenshot({ path: 'visual/shots/p32b-06-office-done.png', fullPage: true })
  await sheet.getByRole('button', { name: 'Done' }).click()
  await page.keyboard.press('Escape')
  await expect(page.locator(`[data-draft-block="${SHARMA_WED22_PM}"]`)).toBeVisible()

  // Route 2: hand on to a colleague (open sessions only, tier order, Not preferred apart).
  await fresh(page, '/admin/day/2026-11-25')
  await page.locator(`button[data-list-id="${SHARMA_WED22_PM}"]`).click()
  await page.getByTestId('admin-list-drawer').locator('[data-shot="drawer-change-status"]').click()
  await sheet.locator('[data-status-choice="unavailable"]').click()
  await sheet.getByRole('button', { name: 'Continue' }).click()
  await sheet.locator('[data-shot="office-status-choice-colleague"]').click()
  const tiers = await sheet.locator('[data-shot="candidates-clear"] [data-candidate] [data-tier]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-tier'))))
  expect(tiers).toEqual([...tiers].sort((a, b) => a - b))
  await page.screenshot({ path: 'visual/shots/p32b-07-office-picker.png', fullPage: true })
  const picked = sheet.locator('[data-shot="candidates-clear"] button[data-candidate]').first()
  const pickedId = await picked.getAttribute('data-candidate')
  await picked.click()
  await sheet.locator('[data-shot="office-status-confirm-button"] button').click()
  await expect(sheet.locator('[data-shot="office-status-done"]')).toContainText('Moved to')
  await sheet.getByRole('button', { name: 'Done' }).click()
  await page.keyboard.press('Escape')
  await page.goto('/admin/day/2026-11-25')
  await page.waitForLoadState('networkidle')
  await expect(page.locator(`button[data-slot-id="S-${pickedId}-2026-11-25-PM"]`)).toHaveAttribute('data-list-id', SHARMA_WED22_PM)
  await expect(page.locator('button[data-slot-id="S-41267-2026-11-25-PM"]')).toContainText('Unavailable')
  await page.goto('/admin/conflicts')
  await expect(page.locator('body')).not.toContainText('Anaesthetist unavailable')
})

test('3 · Simulate sickness on a List with Bookings: the result says where the List went; no Conflicts row', async ({ page }) => {
  await fresh(page, '/admin/day/2026-11-25')
  const msg = await runDemoAction(page, 'simulate-sickness', { close: true })
  expect(msg).toMatch(/The List went (back to the Draft Lists|to Dr \w+) with its Bookings\. No conflict\./)
  await page.screenshot({ path: 'visual/shots/p32b-08-simulate-sickness.png', fullPage: true })
  await page.goto('/admin/conflicts')
  await page.waitForLoadState('networkidle')
  // 16 since catch-up Phase 32d (three bookless public Lists at a closed Christchurch Public are Public sessions).
  await expect(page.locator('[data-shot="nav-badge-conflicts"]')).toHaveText('16')
})

test('4 · Assign Draft List and Reassign: an unavailable colleague shows but cannot be picked; Ask Dr X frees the row; Preferred first within a tier', async ({ page }) => {
  await fresh(page, '/admin/draft-lists')
  // Dr Beaumont's Fri 24 AM clash (Dr Ngata's Tue 21 acute clash went with the public List kind, catch-up Phase 32d).
  await page.locator(`tr[data-draft-list-row="LD-RCB022-2026-11-27-AM"]`).click()
  await page.locator('[data-shot="admin-draft-list-drawer"]').getByRole('button', { name: /See everyone/ }).click()
  const closed = page.locator('[data-shot="candidates-not-available"] [data-candidate-closed="31902"]')
  await expect(closed).toBeVisible()
  await expect(closed).toHaveAttribute('role', 'group')
  await expect(closed.locator('button')).toHaveCount(1)
  await expect(closed).toContainText('Not available this session')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32b-09-assign-closed-row.png', fullPage: true })
  await closed.getByRole('button', { name: 'Ask Dr Beaumont to make this session available' }).click()
  await expect(page.locator('[data-shot="candidates-clear"] [data-candidate="31902"]')).toBeVisible()
  await page.locator('[data-shot="candidates-clear"] [data-candidate="31902"]').click()
  await page.getByRole('button', { name: /^Assign/ }).last().click()
  await expect(page.getByText('Draft List assigned')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32b-10-assign-after-agree.png', fullPage: true })

  // Rutherford's returned List: Preferred (Dr Sharma, Mr Whitford) first within her tier.
  await fresh(page, '/admin/day/2026-11-25')
  await page.locator(`[data-draft-block="${RUTHERFORD_WED22_AM}"]`).click()
  await page.locator('[data-shot="admin-draft-list-drawer"]').getByRole('button', { name: /See everyone/ }).click()
  const rows = page.locator('[data-shot="candidates-clear"] button[data-candidate]')
  const meta = await rows.evaluateAll((els) => els.map((e) => ({ tier: Number(e.querySelector('[data-tier]')?.getAttribute('data-tier')), preferred: /Preferred/.test(e.textContent ?? '') })))
  for (let i = 1; i < meta.length; i++) {
    const a = meta[i - 1]!
    const b = meta[i]!
    expect(a.tier <= b.tier).toBe(true)
    if (a.tier === b.tier) expect(!(b.preferred && !a.preferred)).toBe(true)
  }
  expect(meta.some((m) => m.preferred)).toBe(true)
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32b-11-preferred-order.png', fullPage: true })
  await clean(page, 'assign picker')
})

test('5 · Web and mobile as Dr Souter: mark a booked session unavailable, hand on, vacated pre-selected; the pool gets one notice', async ({ page }) => {
  await fresh(page, '/web/availability/mine?date=2026-11-26')
  const rail = page.locator('[data-shot="web-availability-rail"]')
  await rail.locator('[data-slot-id="S-34821-2026-11-26-PM"]').getByRole('button', { name: 'Change', exact: true }).click()
  await rail.locator('[data-status-choice="unavailable"]').click()
  await rail.getByRole('button', { name: 'Save', exact: true }).click()
  const sheet = page.locator('[data-shot="move-sheet"]')
  await sheet.locator('[data-shot="move-choice-office"]').click()
  await expect(sheet.locator('[data-shot="move-vacated-unavailable"]')).toHaveAttribute('aria-checked', 'true')
  await clean(page, 'web unavailable prompt', '[data-shot="move-sheet"]')
  await expect(sheet).not.toContainText('Draft List')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32b-12-web-unavailable-vacated.png', fullPage: true })
  await sheet.getByRole('button', { name: 'Move List' }).click()
  await sheet.getByRole('button', { name: 'Done' }).click()
  await page.goto('/admin/notifications')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-notification-row]')).toHaveCount(1)
  await expect(page.locator('[data-notification-row]')).toContainText('when marking the session not available')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/mobile/availability')
  await page.locator('button[data-date="2026-11-26"]').click()
  await page.locator('[data-shot="availability-change"]').click()
  const editor = page.locator('[data-shot="mobile-availability-sheet"]')
  await editor.locator('[data-slot-id="S-34821-2026-11-26-AM"]').getByRole('button', { name: 'Change', exact: true }).click()
  await editor.locator('[data-status-choice="unavailable"]').click()
  await editor.getByRole('button', { name: 'Save', exact: true }).click()
  const msheet = page.locator('[data-aa-mobile-product] [data-shot="move-sheet"]')
  await msheet.locator('[data-shot="move-choice-colleague"]').click()
  await msheet.locator('[data-shot="move-colleagues"] button').first().click()
  await expect(msheet.locator('[data-shot="move-vacated-unavailable"]')).toHaveAttribute('aria-checked', 'true')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32b-13-mobile-unavailable-vacated.png' })
})

test('6 · Notifications: count, tick hides for every admin (reload), Show resolved with who and when; the tick is the To-do Clear shape', async ({ page }) => {
  await fresh(page, '/admin/day/2026-11-24')
  await runDemoAction(page, 'colleague-moves-list-to-office', { choice: 'one', close: true })
  const card = page.locator('[data-shot="admin-notifications-rail"]')
  await expect(card.locator('[data-shot="admin-notifications-count"]')).toHaveText(/^1/)
  await card.scrollIntoViewIfNeeded()
  await card.screenshot({ path: 'visual/shots/p32b-14-rail-active.png' })
  const tick = card.locator('[data-shot="notification-tick"]')
  // The same shape as the To-do card's Clear.
  const clear = page.locator('[data-shot="admin-todo"] button', { hasText: 'Clear' }).first()
  if (await clear.count()) {
    const [a, b] = await Promise.all([tick.evaluate((e) => [getComputedStyle(e).borderColor, getComputedStyle(e).color, getComputedStyle(e).borderRadius]), clear.evaluate((e) => [getComputedStyle(e).borderColor, getComputedStyle(e).color, getComputedStyle(e).borderRadius])])
    expect(a).toEqual(b)
  }
  await tick.focus()
  await page.keyboard.press('Enter')
  await expect(card.locator('[data-shot="admin-notifications-count"]')).toHaveText(/^0/)
  await expect(card.locator('[data-notification-row]')).toHaveCount(0)
  await card.screenshot({ path: 'visual/shots/p32b-15-rail-resolved.png' })
  // Another admin (a reload) sees it gone too: the pool has no per-user state.
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="admin-notifications-rail"] [data-notification-row]')).toHaveCount(0)
  await page.goto('/admin/notifications?resolved=1')
  await page.waitForLoadState('networkidle')
  const row = page.locator('[data-notification-row][data-notification-resolved="true"]')
  await expect(row).toContainText(/Resolved by Kirsty W\., Tue 24 Nov, \d\d:\d\d/)
  await page.screenshot({ path: 'visual/shots/p32b-16-show-resolved.png', fullPage: true })
  await clean(page, 'Notifications')
})

test('7 · Alert the office on a Booking and a List (web and mobile): active in Admin, opens its target, stays until ticked; submit still works', async ({ page }) => {
  await fresh(page, `/web/lists/${SOUTER_WED22_AM}/bookings/${SOUTER_BOOKING}`)
  await page.locator('[data-shot="alert-office-action"]').getByRole('button', { name: 'Alert the office' }).click()
  const sheet = page.locator('[data-shot="alert-office-sheet"]')
  await sheet.getByLabel('Note for the office').fill('Not sure the funder is right for this one.')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32b-17-web-alert-note.png', fullPage: true })
  await noCrimsonControls(page, '[data-shot="alert-office-sheet"]')
  await sheet.getByRole('button', { name: 'Send to the office' }).click()
  await sheet.getByRole('button', { name: 'Done' }).click()
  await expect(page.locator('[data-shot="alert-office-sent"]')).toContainText('The office has been alerted')
  await page.screenshot({ path: 'visual/shots/p32b-18-web-alert-sent.png', fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/mobile/lists/${SOUTER_WED22_AM}`)
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="list-options"]').click()
  await page.locator('[data-shot="list-alert-office"]').click()
  const msheet = page.locator('[data-aa-mobile-product] [data-shot="alert-office-sheet"]')
  await msheet.getByLabel('Note for the office').fill('Please check the start time.')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32b-19-mobile-alert-sheet.png' })
  await msheet.getByRole('button', { name: 'Send to the office' }).click()
  await msheet.getByRole('button', { name: 'Done' }).click()
  await clean(page, 'mobile List')

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/admin/notifications')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="admin-notifications-page-count"]')).toHaveText(/^2/)
  await expect(page.locator('[data-shot="notification-alert-note"]').first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32b-20-admin-alerts.png', fullPage: true })
  const bookingRow = page.locator('[data-notification-row]', { hasText: 'a Booking' })
  await bookingRow.getByRole('button', { name: 'Open Booking' }).click()
  await expect(page.locator('[data-shot="office-alert-line"]')).toContainText('Alert from Dr Souter')
  await page.screenshot({ path: 'visual/shots/p32b-21-admin-booking-alert.png', fullPage: true })

  // Submitting still works while an alert is open (undecided: submit stays allowed).
  await page.goto('/web/lists/L-34821-2026-11-24-AM')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="alert-office-list"]').getByRole('button', { name: 'Alert the office' }).click()
  await page.locator('[data-shot="alert-office-sheet"]').getByLabel('Note for the office').fill('Check before it goes through.')
  await page.locator('[data-shot="alert-office-sheet"]').getByRole('button', { name: 'Send to the office' }).click()
  await page.locator('[data-shot="alert-office-sheet"]').getByRole('button', { name: 'Done' }).click()
  // The List's submit action ("Mark list completed") stays enabled: an alert changes no submit rule.
  await expect(page.getByRole('button', { name: 'Mark list completed' })).toBeEnabled()
  await page.screenshot({ path: 'visual/shots/p32b-23-submit-with-alert.png', fullPage: true })
})

test('8 · PWA: Office resolves this alert shows the resolved line', async ({ page }) => {
  const PWA = process.env['PWA_URL'] ?? `http://localhost:${process.env['AA_PWA_PORT'] ?? 5174}`
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${PWA}/mobile/lists/${SOUTER_WED22_AM}`)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(`${PWA}/mobile/lists/${SOUTER_WED22_AM}`)
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="list-options"]').click()
  await page.locator('[data-shot="list-alert-office"]').click()
  const sheet = page.locator('[data-shot="alert-office-sheet"]')
  await sheet.getByLabel('Note for the office').fill('Please check this List.')
  await sheet.getByRole('button', { name: 'Send to the office' }).click()
  await sheet.getByRole('button', { name: 'Done' }).click()
  await page.locator('[data-shot="pwa-demo-actions"]').click()
  const row = page.locator('[data-shot="pwa-demo-action-office-resolves-alert"]')
  await expect(row).toContainText('Office stand-in')
  await row.getByRole('button', { name: 'Run' }).click()
  await expect(row.getByRole('status')).toContainText('The office resolved your alert.')
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-shot="alert-office-resolved"]')).toContainText('The office has dealt with this')
  await page.screenshot({ path: 'visual/shots/p32b-22-pwa-resolved.png' })
})
