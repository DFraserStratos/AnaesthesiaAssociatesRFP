import { expect, test, type Page } from '@playwright/test'

/**
 * Catch-up Phase 32c · Out-of-hours sessions: the phase's manual test
 * checklist (as the owner decided the design on 2026-11-10: an evening Slot
 * the office opens, then any List goes in it), walked in the running app with
 * a screenshot per step (checked by eye).
 */

const SOUTER = '34821'
const SHARMA = '41267'
const CHEN = '45178'
const SOUTER_PM = 'L-34821-2026-07-21-PM'
const SOUTER_OOH = 'S-34821-2026-07-21-OOH'
const DAY = '/admin/day/2026-07-21'
const PWA = 'http://localhost:5174'

async function fresh(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

async function clean(page: Page, where: string, scope = 'body') {
  const text = await page.locator(scope).first().innerText()
  expect(/\bslots?\b/i.test(text), `${where} shows "slot"`).toBe(false)
  expect(/[–—]/.test(text), `${where} shows an en or em dash`).toBe(false)
  expect(/\bOOH\b/.test(text), `${where} shows the raw session value`).toBe(false)
}

const CRIMSON = 'rgb(169, 30, 62)'
async function noCrimsonControls(page: Page, scope: string) {
  const colours = await page.locator(`${scope} button`).evaluateAll((els) => els.flatMap((e) => [getComputedStyle(e).backgroundColor, getComputedStyle(e).borderColor, getComputedStyle(e).color]))
  expect(colours.includes(CRIMSON), `${scope}: a control uses crimson`).toBe(false)
}

const rulerLabels = (page: Page) => page.locator('.mono').evaluateAll((els) => els.map((e) => e.textContent ?? '').filter((t) => /^\d\d:00$/.test(t)))

/** Admin Day: Open out-of-hours session on a row, at the default times; lands on its drawer. */
async function openEvening(page: Page, reg: string) {
  const row = page.locator(`[data-day-grid-row="${reg}"]`)
  await row.locator('.aa-row-gutter').hover()
  await row.locator('[data-shot="out-of-hours-open"]').click()
  const sheet = page.locator('[data-shot="out-of-hours-open-sheet"]')
  await expect(sheet).toBeVisible()
  await sheet.getByRole('button', { name: 'Open out-of-hours session' }).click()
  await expect(page.getByTestId('admin-list-drawer')).toBeVisible()
}

async function assignNewList(page: Page) {
  await page.getByTestId('admin-list-drawer').getByRole('button', { name: 'Assign List' }).click()
  const sheet = page.locator('[data-shot="admin-assign-list"]')
  await sheet.locator('[data-shot="assign-hospital"]').selectOption('H-SX')
  await sheet.getByLabel('Surgeon').selectOption('S-PATEL')
  await sheet.getByRole('button', { name: /Assign List|Assign anyway/ }).click()
}

async function closeDrawer(page: Page) {
  const close = page.getByTestId('admin-list-drawer').locator('button[aria-label="Close"]')
  if (await close.count()) await close.first().click()
}

test('1 · Reset: Admin Day Tue 21 Jul as before (ruler to 18:00, no evening block)', async ({ page }) => {
  await fresh(page, DAY)
  expect((await rulerLabels(page)).at(-1)).toBe('18:00')
  await expect(page.locator('[data-shot="daygrid-evening-block"]')).toHaveCount(0)
  const open = page.locator(`[data-day-grid-row="${SOUTER}"] [data-shot="out-of-hours-open"]`)
  await expect(open).toHaveCSS('opacity', '0')
  await page.screenshot({ path: 'visual/shots/p32c-01-day-reset.png', fullPage: true })
  // Hovering the row's blocks shows nothing; only the right gutter, beside where the evening session will appear.
  await page.locator(`[data-day-grid-row="${SOUTER}"] button[data-list-id="${SOUTER_PM}"]`).hover()
  await expect(open).toHaveCSS('opacity', '0')
  await page.locator(`[data-day-grid-row="${SOUTER}"] .aa-row-gutter`).hover()
  await expect(open).toHaveCSS('opacity', '1')
  const row = await page.locator(`[data-day-grid-row="${SOUTER}"]`).boundingBox()
  const box = await open.boundingBox()
  expect(box!.x + box!.width).toBeGreaterThan(row!.x + row!.width - 12)
  await page.screenshot({ path: 'visual/shots/p32c-01b-row-hover.png', fullPage: true })
})

test('2 · Open an out-of-hours session for today: 18:00 to 21:00, Free, after PM on a longer ruler; no second that day', async ({ page }) => {
  await fresh(page, DAY)
  const row = page.locator(`[data-day-grid-row="${SOUTER}"]`)
  await row.locator('.aa-row-gutter').hover()
  await row.locator('[data-shot="out-of-hours-open"]').click()
  const sheet = page.locator('[data-shot="out-of-hours-open-sheet"]')
  await expect(sheet.getByLabel('Start')).toHaveValue('18:00')
  await expect(sheet.getByLabel('End')).toHaveValue('21:00')
  await clean(page, 'open sheet', '[data-shot="out-of-hours-open-sheet"]')
  await noCrimsonControls(page, '[data-shot="out-of-hours-open-sheet"]')
  await page.screenshot({ path: 'visual/shots/p32c-02-open-sheet.png', fullPage: true })
  await sheet.getByRole('button', { name: 'Open out-of-hours session' }).click()
  const drawer = page.getByTestId('admin-list-drawer')
  await expect(drawer).toContainText('Out-of-hours')
  await expect(drawer).toContainText('18:00 to 21:00')
  await expect(drawer.getByRole('button', { name: 'Assign List' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32c-03-empty-evening-drawer.png', fullPage: true })
  await closeDrawer(page)
  const block = row.locator('[data-shot="daygrid-evening-block"]')
  await expect(block).toContainText('Free')
  expect((await rulerLabels(page)).at(-1)).toBe('21:00')
  const pm = await page.locator(`button[data-list-id="${SOUTER_PM}"]`).boundingBox()
  const eve = await block.boundingBox()
  expect(eve!.x).toBeGreaterThan(pm!.x + pm!.width - 1)
  await expect(row.locator('[data-shot="out-of-hours-open"]')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p32c-04-evening-block-free.png', fullPage: true })
})

test('3 · Any List goes in: a new one (Assign List), or a Draft List for the evening; an empty one closes', async ({ page }) => {
  await fresh(page, DAY)
  // A new List.
  await openEvening(page, SOUTER)
  await assignNewList(page)
  await expect(page.getByTestId('admin-list-drawer')).toContainText('Southern Cross')
  await closeDrawer(page)
  await expect(page.locator(`[data-day-grid-row="${SOUTER}"] [data-shot="daygrid-evening-block"]`)).toContainText('Southern Cross')
  await page.screenshot({ path: 'visual/shots/p32c-05-evening-new-list.png', fullPage: true })

  // A Draft List for the evening.
  await page.goto('/admin/draft-lists')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /New Draft List/ }).click()
  const nd = page.locator('[data-shot="admin-new-draft-list"]')
  await nd.locator('[data-shot="draft-list-hospital"]').selectOption('H-STG')
  await nd.locator('[data-shot="draft-list-surgeon"]').selectOption('S-HALE')
  await nd.getByText('Out-of-hours', { exact: true }).click()
  await page.screenshot({ path: 'visual/shots/p32c-06-evening-draft-list.png', fullPage: true })
  await nd.getByRole('button', { name: /Save Draft List/ }).click()
  await page.goto(DAY)
  await page.waitForLoadState('networkidle')
  await openEvening(page, SHARMA)
  const waiting = page.locator('[data-shot="drawer-session-draft-lists"]')
  await expect(waiting).toContainText("St George's")
  await page.screenshot({ path: 'visual/shots/p32c-07-draft-list-waiting.png', fullPage: true })
  await waiting.getByRole('button', { name: 'Assign here' }).click()
  await expect(page.getByTestId('admin-list-drawer')).toContainText('ACTIVE')
  await closeDrawer(page)
  await expect(page.locator(`[data-day-grid-row="${SHARMA}"] [data-shot="daygrid-evening-block"]`)).toContainText("St George's")

  // An empty one closes.
  await openEvening(page, CHEN)
  await page.getByTestId('admin-list-drawer').locator('[data-shot="drawer-close-out-of-hours"]').click()
  await expect(page.locator(`[data-day-grid-row="${CHEN}"] [data-shot="daygrid-evening-block"]`)).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p32c-08-after-close.png', fullPage: true })
  await clean(page, 'Admin Day')
})

async function stageSouterEveningList(page: Page) {
  await fresh(page, DAY)
  await openEvening(page, SOUTER)
  await assignNewList(page)
  await closeDrawer(page)
}

test('4 · Mobile as Dr Souter: the List after PM, moon and 18:00; add a Booking, capture, complete, submit', async ({ page }) => {
  await stageSouterEveningList(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/mobile/lists')
  await page.waitForLoadState('networkidle')
  const ids = await page.locator('[data-aa-mobile-product] [data-list-id]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.listId ?? ''))
  const row = page.locator('[data-shot="out-of-hours-row"]').first()
  const id = (await row.getAttribute('data-list-id')) ?? ''
  expect(ids.indexOf(id)).toBe(ids.indexOf(SOUTER_PM) + 1)
  await expect(row).toContainText('18:00')
  await expect(row).toContainText('Out-of-hours · Ms K. Patel')
  await page.screenshot({ path: 'visual/shots/p32c-09-mobile-lists.png' })
  await clean(page, 'mobile Lists', '[data-aa-mobile-product]')
  await row.click()
  await page.waitForTimeout(500)
  await expect(page.getByText(/Southern Cross Out-of-hours/).first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32c-10-mobile-detail.png' })
  await page.getByText('Add a booking', { exact: false }).first().click()
  await page.getByLabel('NHI').fill('ZZZ0016')
  await page.getByLabel('Name').fill('Evening Patient')
  await page.getByLabel('Date of birth').fill('1980-02-02')
  await page.getByLabel('Operation').fill('Appendicectomy, laparoscopic')
  await page.getByRole('button', { name: 'Choose an RVG code' }).click()
  await page.getByPlaceholder('Search RVG code or description').fill('appendicectomy')
  await page.locator('button[data-rvg-code=A3]', { hasText: 'Appendicectomy, laparoscopic' }).click()
  await page.getByLabel('Scheduled time').fill('18:30')
  await page.getByRole('button', { name: 'Save booking' }).click()
  const done = page.getByRole('button', { name: 'Done' })
  if (await done.count()) await done.click()
  await page.getByText('Evening Patient').first().click()
  await page.waitForTimeout(500)
  const bookingUrl = page.url()
  await page.getByRole('button', { name: 'Start now' }).click()
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '+1 hour' }).click()
  await page.goto(bookingUrl)
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Finish now' }).click()
  await page.getByRole('button', { name: 'Mark complete' }).click()
  await page.waitForTimeout(1400)
  await page.goto(`/mobile/lists/${id}`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Mark list completed' }).click()
  await page.getByRole('button', { name: 'Submit to office' }).click()
  await page.waitForTimeout(1400)
  await expect(page.getByText('Submitted to office', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32c-11-mobile-submitted.png' })
})

test('5 · Web as Dr Souter: Lists, week strip and the availability grid show the evening after PM', async ({ page }) => {
  await stageSouterEveningList(page)
  await page.goto('/web/lists')
  await page.waitForLoadState('networkidle')
  const rows = await page.locator('tr[data-list-id]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.listId ?? ''))
  const pmAt = rows.indexOf(SOUTER_PM)
  const next = page.locator(`tr[data-list-id="${rows[pmAt + 1]}"]`)
  await expect(next).toContainText('Out-of-hours')
  await expect(next).toContainText('18:00')
  await page.screenshot({ path: 'visual/shots/p32c-12-web-lists.png', fullPage: true })
  await clean(page, 'web Lists')
  await page.goto('/web')
  await page.waitForLoadState('networkidle')
  await expect(page.locator(`[data-slot-id="${SOUTER_OOH}"]`)).toContainText('Southern Cross')
  await page.screenshot({ path: 'visual/shots/p32c-13-web-dashboard.png', fullPage: true })
  await page.goto('/web/availability?date=2026-07-21')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('Out-of-hours', { exact: true }).first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32c-14-web-availability.png', fullPage: true })
})

test('6 · Review authorises it and the billing run bills it; the audit shows the session opened', async ({ page }) => {
  await stageSouterEveningList(page)
  const id = (await page.locator(`[data-day-grid-row="${SOUTER}"] [data-shot="daygrid-evening-block"]`).getAttribute('data-list-id')) ?? ''
  // The office moves Dr Souter's completed Mon 20 PM Booking onto it, she submits, the office authorises.
  await page.goto('/admin/day/2026-07-20')
  await page.waitForLoadState('networkidle')
  await page.locator('button[data-list-id="L-34821-2026-07-20-PM"]').click()
  await page.getByTestId('admin-list-drawer').getByRole('button', { name: 'Move' }).first().click()
  await page.locator('input[type="date"]').last().fill('2026-07-21')
  await page.locator('button', { hasText: 'Souter · Out-of-hours' }).first().click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/mobile/lists/${id}`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Mark list completed' }).click()
  await page.getByRole('button', { name: 'Submit to office' }).click()
  await page.waitForTimeout(1400)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`/admin/review/${id}`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Out-of-hours list')
  await page.screenshot({ path: 'visual/shots/p32c-15-review.png', fullPage: true })
  await page.getByRole('button', { name: /Authorise/ }).first().click()
  const confirm = page.getByRole('button', { name: /Authorise/ }).last()
  if (await confirm.isVisible()) await confirm.click().catch(() => undefined)
  await page.waitForTimeout(800)
  await page.goto('/admin/billing')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).toContainText('Out-of-hours')
  await page.screenshot({ path: 'visual/shots/p32c-16-billing.png', fullPage: true })
  await page.goto('/admin/audit')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).toContainText('Out-of-hours session opened')
})

test('7 · Availability: the office finder offers a free evening session; she marks it unavailable and it leaves the finder', async ({ page }) => {
  await fresh(page, DAY)
  await openEvening(page, SOUTER)
  await closeDrawer(page)
  await page.locator('[data-shot="admin-availability-finder-open"]').click()
  await page.getByText('Out-of-hours', { exact: true }).first().click()
  await expect(page.locator('[data-shot="finder-count"]')).toHaveText('1 anaesthetist free out of hours')
  await page.screenshot({ path: 'visual/shots/p32c-17-finder-evening.png', fullPage: true })
  await page.keyboard.press('Escape')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/mobile/availability')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="availability-mine-ooh"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32c-18-mobile-availability.png' })
  await page.goto('/mobile/availability')
  await page.locator('button[data-date="2026-07-21"]').click()
  await page.locator('[data-shot="availability-change"]').click()
  const editor = page.locator('[data-shot="mobile-availability-sheet"]')
  await editor.locator(`[data-slot-id="${SOUTER_OOH}"]`).getByRole('button', { name: 'Change', exact: true }).click()
  await editor.locator('[data-status-choice="unavailable"]').click()
  await editor.getByRole('button', { name: 'Save', exact: true }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/p32c-19-evening-unavailable.png' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(DAY)
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="admin-availability-finder-open"]').click()
  await page.getByText('Out-of-hours', { exact: true }).first().click()
  await expect(page.locator('[data-shot="finder-count"]')).toHaveText('No one is free out of hours.')
})

test('8 · PWA: "The office adds an out-of-hours List for me tonight"; reload keeps it; Reset removes it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${PWA}/mobile/lists`)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(`${PWA}/mobile/lists`)
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="pwa-demo-actions"]').click()
  const action = page.locator('[data-shot="pwa-demo-action-office-adds-out-of-hours-list"]')
  await expect(action).toContainText('Office stand-in')
  await action.getByRole('button', { name: 'Run' }).click()
  await expect(action.getByRole('status')).toContainText('The office added an out-of-hours List for tonight at 18:00.')
  await page.keyboard.press('Escape')
  await page.goto(`${PWA}/mobile/lists`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="out-of-hours-row"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p32c-20-pwa-row.png' })
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="out-of-hours-row"]')).toBeVisible()
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="out-of-hours-row"]')).toHaveCount(0)
})

test('9 · Keyboard reaches the row control and the sheet; no crimson on controls', async ({ page }) => {
  await fresh(page, DAY)
  const open = page.locator(`[data-day-grid-row="${SOUTER}"] [data-shot="out-of-hours-open"]`)
  await page.locator(`[data-day-grid-row="${SOUTER}"] button[data-list-id="${SOUTER_PM}"]`).focus()
  await page.keyboard.press('Tab')
  await expect(open).toBeFocused()
  await expect(open).toHaveCSS('opacity', '1')
  await page.screenshot({ path: 'visual/shots/p32c-21-keyboard-focus.png', fullPage: true })
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-shot="out-of-hours-open-sheet"]')).toBeVisible()
  await noCrimsonControls(page, `[data-day-grid-row="${SOUTER}"]`)
})
