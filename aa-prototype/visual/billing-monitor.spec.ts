import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * The Billing tab (build plan Phase 60, version C; US-13.3.1, US-13.3.2): one
 * table of Bookings under their List, grouped by anaesthetist in surname order,
 * opening on Problems. A problem's reason sits under the patient's name and its
 * fix beside it; Show all adds the rest of a List. The rail holds the Lists
 * awaiting approval, which open in Review (nothing on the tab approves). The
 * filter, search and anaesthetist live in the URL, so a reload and the Review
 * round trip keep the view; the pager counts Lists, 20 to a page.
 * (Earlier: catch-up Phase 37's processing monitor; Phase 58 made it Finances · Billing.)
 */

const SOUTER = '34821'
const ROPATA = '39560'
const SOUTER_MON16_AM = 'L-34821-2026-11-16-AM'
const SOUTER_THU_PM = 'L-34821-2026-11-19-PM'
const SOUTER_THU_PM_BOOKING = 'BK0188'
const ROPATA_THU_AM = 'L-39560-2026-11-19-AM'
const LOSA = 'BK0039'
const HEMI = 'BK0040'

/** A clean seed: the store persists to localStorage, so clear it and load again. */
async function fresh(page: Page, path = '/admin/finances/billing'): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Finances', level: 1 })).toBeVisible()
}

const table = (page: Page) => page.locator('[data-shot="billing-table"]')
const groups = (page: Page) => page.locator('tr[data-anaesthetist-id]')
const group = (page: Page, anaesthetistId: string) => page.locator(`tr[data-shot="billing-group-${anaesthetistId}"]`)
const lists = (page: Page) => page.locator('tr[data-list-id]')
const list = (page: Page, listId: string) => page.locator(`tr[data-shot="billing-list-${listId}"]`)
const rows = (page: Page) => page.locator('tr[data-booking-id]')
const row = (page: Page, bookingId: string) => page.locator(`tr[data-shot="billing-row-${bookingId}"]`)
const summary = (page: Page) => page.locator('[data-shot="billing-summary"]')
const empty = (page: Page) => page.locator('[data-shot="billing-empty"]')
const filterPill = (page: Page, name: string) => page.getByRole('group', { name: 'Which Bookings' }).getByRole('button', { name, exact: true })
const anaesthetistSelect = (page: Page) => page.locator('[data-shot="billing-filters"]').getByLabel('Anaesthetist', { exact: true })
const searchBox = (page: Page) => page.getByLabel('Search by patient, Booking, payer, hospital or anaesthetist')
const awaiting = (page: Page) => page.locator('[data-shot="billing-awaiting"]')

test('reset: opens on Problems, every List under All in surname order paged by List, the Lists awaiting approval, and no approve', async ({ page }) => {
  await fresh(page)

  // Problems by default, and nothing wrong at reset.
  await expect(filterPill(page, 'Problems')).toHaveAttribute('aria-pressed', 'true')
  await expect(empty(page)).toContainText('No billing problems.')
  await expect(summary(page)).toHaveText('0 Lists with a problem, 0 anaesthetists')

  // All: groups in surname order, 20 Lists to a page across the whole practice.
  await page.locator('[data-shot="billing-empty-show-all"]').click()
  await expect(page).toHaveURL(/show=all/)
  await expect(table(page)).toBeVisible()
  await expect(lists(page)).toHaveCount(20)
  await expect(page.locator('[data-shot="billing-pager"]')).toBeVisible()
  await expect(page.locator('[data-shot="billing-pager"]')).toContainText('Lists 1 to 20 of')
  const names = await groups(page).locator('[data-group-row-layout] > span:first-child').allTextContents()
  const surnames = names.map((n) => n.split(' ').at(-1) ?? '')
  expect(surnames).toEqual([...surnames].sort((a, b) => a.localeCompare(b)))

  // The rail: the first five Lists awaiting approval, each a link into Review, and See all.
  const rail = awaiting(page)
  await expect(rail).toBeVisible()
  await expect(rail.locator(`li[data-shot="billing-awaiting-${SOUTER_MON16_AM}"] a`)).toBeVisible()
  await expect(rail.locator('li[data-shot^="billing-awaiting-"]')).toHaveCount(5)
  await expect(page.locator('[data-shot="billing-awaiting-all"]')).toHaveText(/See all \d+/)

  // No Authorise or approve anywhere on the tab.
  await expect(page.getByRole('button', { name: /Authorise|Approve/ })).toHaveCount(0)
  await expect(page.locator('main, body').first()).not.toContainText('Phase 10 stub')

  // The seeded authorised List: its heading and its Booking with the four steps as words.
  await anaesthetistSelect(page).selectOption(SOUTER)
  await expect(list(page, SOUTER_THU_PM)).toBeVisible()
  await expect(list(page, SOUTER_THU_PM)).toContainText(/of \d+ sent/)
  const booking = row(page, SOUTER_THU_PM_BOOKING)
  await expect(booking).toBeVisible()
  await expect(booking.locator('[data-step-state]')).toHaveCount(4)
  await page.screenshot({ path: 'visual/shots/p37-monitor-01-reset.png', fullPage: true })
})

test('Awaiting approval opens Review with the filters on: authorise there, Back to Billing keeps them; reload keeps the view', async ({ page }) => {
  await fresh(page, `/admin/finances/billing?show=all&anaesthetist=${SOUTER}`)
  await expect(groups(page)).toHaveCount(1)
  await expect(page.locator('[data-shot="billing-filter-anaesthetist"]')).toHaveValue(SOUTER)
  await expect(lists(page)).toHaveCount(1)

  await awaiting(page).locator(`li[data-shot="billing-awaiting-${SOUTER_MON16_AM}"] a`).click()
  await expect(page).toHaveURL(new RegExp(`/admin/lists/to-authorise/${SOUTER_MON16_AM}$`))
  const back = page.locator('[data-shot="review-back-to-billing"]')
  await expect(back).toHaveText(/Billing/)
  await expect(back).not.toHaveText(/Billing monitor/)

  // Authorise on Review, with its usual confirm.
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await expect(page.getByText('List authorised · locked for billing')).toBeVisible()
  await expect(page.locator('[data-shot="review-delivery-summary"]')).toHaveText(/invoices? raised\./)

  await back.click()
  await expect(page).toHaveURL(new RegExp(`/admin/finances/billing\\?show=all&anaesthetist=${SOUTER}$`))
  await expect(page.locator('[data-shot="billing-filter-anaesthetist"]')).toHaveValue(SOUTER)
  await expect(groups(page)).toHaveCount(1)
  await expect(awaiting(page).locator(`li[data-shot="billing-awaiting-${SOUTER_MON16_AM}"]`)).toHaveCount(0)
  await expect(list(page, SOUTER_MON16_AM)).toBeVisible()
  await expect(lists(page)).toHaveCount(2)
  expect(await page.locator(`tr[data-shot="billing-list-${SOUTER_MON16_AM}"] ~ tr[data-booking-id]`).count()).toBeGreaterThanOrEqual(2)
  await expect(page.getByRole('button', { name: /Authorise|Approve/ })).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p37-monitor-02-back-from-review.png', fullPage: true })

  // Opened from To authorise, Review shows its ordinary breadcrumb instead.
  await page.goto('/admin/lists/to-authorise')
  await page.waitForLoadState('networkidle')
  await page.getByRole('row').filter({ hasText: /Souter/ }).filter({ hasText: /St George's/ }).getByRole('button', { name: /^Review / }).first().click()
  await expect(page).toHaveURL(/\/admin\/lists\/to-authorise\/L-/)
  await expect(page.locator('[data-shot="review-back-to-billing"]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'To authorise', exact: true })).toBeVisible()

  // Reload keeps the view: the filter, the anaesthetist and the Lists.
  await page.goto(`/admin/finances/billing?show=all&anaesthetist=${SOUTER}`)
  await page.waitForLoadState('networkidle')
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(filterPill(page, 'All')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-shot="billing-filter-anaesthetist"]')).toHaveValue(SOUTER)
  await expect(groups(page)).toHaveCount(1)
  await expect(lists(page)).toHaveCount(2)
  await page.screenshot({ path: 'visual/shots/p37-monitor-03-sorted.png', fullPage: true })
})

test("Trigger billing failure: Problems shows only Losa's Booking under Ropata's List, its reason and the way to Xero; Show all adds Hemi; Retry now on Xero clears it", async ({ page }) => {
  await fresh(page, '/admin/finances/billing')
  // The Demo actions work with search params on the URL too.
  expect(await runDemoAction(page, 'billing-failure', { close: true })).toMatch(/waits for Xero in the sync queue/)

  await expect(filterPill(page, 'Problems')).toHaveAttribute('aria-pressed', 'true')
  await expect(summary(page)).toHaveText('1 List with a problem, 1 anaesthetist')
  await expect(groups(page)).toHaveCount(1)
  await expect(group(page, ROPATA)).toContainText('1 with problems')
  await expect(lists(page)).toHaveCount(1)
  await expect(list(page, ROPATA_THU_AM)).toBeVisible()
  await expect(rows(page)).toHaveCount(1)
  const losa = row(page, LOSA)
  await expect(losa).toHaveAttribute('data-problem', 'waitingForXero')
  await expect(losa).toContainText('Losa Tuilagi')
  await expect(losa.locator(`[data-shot="billing-reason-${LOSA}"]`)).not.toBeEmpty()
  await expect(losa.getByText('Waiting for Xero').first()).toBeVisible()
  await expect(losa.locator(`[data-shot="billing-open-xero-${LOSA}"]`)).toBeVisible()
  // A hand-off still in the queue is not a failed run: no Retry, Fix the payer or Resolve & retry here.
  await expect(losa.locator(`[data-shot="billing-retry-${LOSA}"]`)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Resolve & retry' })).toHaveCount(0)

  // Show all adds the List's other Booking.
  await page.locator(`[data-shot="billing-show-all-${ROPATA_THU_AM}"]`).click()
  await expect(rows(page)).toHaveCount(2)
  await expect(row(page, HEMI)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p37-monitor-04-problems-only.png', fullPage: true })

  // Retry now on its queue row (Finances · Xero) hands it off; back on Billing the problem leaves the view.
  await page.locator('[data-shot="finances-tabs"] [data-finances-tab="xero"]').click()
  await expect(page).toHaveURL(/\/admin\/finances\/xero/)
  const table = page.locator('[data-shot="xero-table"]')
  await expect(table.locator('[data-queue-item]')).toHaveCount(1)
  await table.getByRole('button', { name: 'Retry now' }).click()
  await expect(page.locator('[data-shot="xero-empty"]')).toContainText('Nothing needs action in Xero.')
  await page.locator('[data-shot="finances-tabs"] [data-finances-tab="billing"]').click()
  await expect(page).toHaveURL(/\/admin\/finances\/billing/)
  await expect(filterPill(page, 'Problems')).toHaveAttribute('aria-pressed', 'true')
  await expect(empty(page)).toContainText('No billing problems.')
  await expect(page.locator('[data-shot="billing-xero-notice"]')).toHaveCount(0)
})

test('Payer loses billing email: Fix the payer beside the failed Booking, then it bills', async ({ page }) => {
  await fresh(page)
  // The trigger is registered at Wave 5's join; skip until it is in the Demo actions menu.
  await page.locator('[data-shot="demo-actions"]').click()
  const registered = (await page.locator('[data-shot="demo-action-payer-loses-billing-email"]').count()) > 0
  await page.keyboard.press('Escape')
  test.skip(!registered, 'the Payer loses billing email trigger is not registered yet')

  expect(await runDemoAction(page, 'payer-loses-billing-email', { close: true })).toMatch(/Fix the payer, then Retry/)
  await expect(rows(page)).toHaveCount(1)
  const failed = rows(page).first()
  const bookingId = (await failed.getAttribute('data-booking-id')) ?? ''
  await expect(failed).toHaveAttribute('data-problem', 'billingException')
  await expect(failed.locator(`[data-shot="billing-reason-${bookingId}"]`)).toContainText(/billing email or postal address/)
  await expect(failed.locator(`[data-shot="billing-fix-payer-${bookingId}"]`)).toBeVisible()
  await expect(failed.locator(`[data-shot="billing-retry-${bookingId}"]`)).toBeVisible()
  await expect(failed.locator(`[data-shot="billing-mark-resolved-${bookingId}"]`)).toBeVisible()

  // Retry alone still refuses, in place.
  await failed.locator(`[data-shot="billing-retry-${bookingId}"]`).click()
  await expect(page.locator(`[data-shot="billing-retry-error-${bookingId}"]`)).not.toBeEmpty()

  // Fix the payer, Save and retry: it bills and leaves Problems.
  await failed.locator(`[data-shot="billing-fix-payer-${bookingId}"]`).click()
  const sheet = page.locator('[data-shot="billing-fix-payer-sheet"]')
  await expect(sheet).toBeVisible()
  await sheet.getByLabel('Billing email').fill('accounts@example.co.nz')
  await sheet.locator('[data-shot="billing-fix-payer-save"]').click()
  await expect(sheet).toHaveCount(0)
  await expect(empty(page)).toContainText('No billing problems.')
  await page.screenshot({ path: 'visual/shots/p60-billing-fix-payer.png', fullPage: true })
})

test('filters: the pills, one anaesthetist, a Booking id, two quick edits, page 1 on a change, nothing matching, and reload', async ({ page }) => {
  await fresh(page, '/admin/finances/billing?show=all')

  // A filter change returns to page 1.
  await page.locator('[data-shot="billing-pager"]').getByRole('button', { name: 'Next page' }).click()
  await expect(page.locator('[data-shot="billing-pager"]')).toHaveAttribute('data-page', '2')
  await expect(page).toHaveURL(/page=2/)
  await filterPill(page, 'In progress').click()
  await expect(page).toHaveURL(/show=in-progress/)
  await expect(page).not.toHaveURL(/page=/)
  await expect(page.locator('[data-shot="billing-pager"]')).toHaveAttribute('data-page', '1')
  await filterPill(page, 'Done').click()
  await expect(page).toHaveURL(/show=done/)
  await filterPill(page, 'All').click()
  await expect(page).toHaveURL(/show=all/)

  // One anaesthetist.
  await anaesthetistSelect(page).selectOption(SOUTER)
  await expect(page).toHaveURL(new RegExp(`anaesthetist=${SOUTER}`))
  await expect(groups(page)).toHaveCount(1)
  await expect(group(page, SOUTER)).toBeVisible()
  await expect(lists(page)).toHaveCount(1)

  // Reload keeps it.
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(groups(page)).toHaveCount(1)
  await expect(anaesthetistSelect(page)).toHaveValue(SOUTER)

  // Back to everyone, then a Booking id narrows to its List and that Booking.
  await anaesthetistSelect(page).selectOption('')
  await expect(page).not.toHaveURL(/anaesthetist=/)
  await searchBox(page).fill(SOUTER_THU_PM_BOOKING)
  await expect(page).toHaveURL(new RegExp(`q=${SOUTER_THU_PM_BOOKING}`))
  await expect(lists(page)).toHaveCount(1)
  await expect(rows(page)).toHaveCount(1)
  await expect(row(page, SOUTER_THU_PM_BOOKING)).toBeVisible()

  // Two quick edits both land.
  await searchBox(page).fill('')
  await searchBox(page).fill('Souter')
  await anaesthetistSelect(page).selectOption(SOUTER)
  await expect(page).toHaveURL(/q=Souter/)
  await expect(page).toHaveURL(new RegExp(`anaesthetist=${SOUTER}`))

  // Nothing matching: the empty state clears the search and the anaesthetist.
  await searchBox(page).fill('zzzz nobody')
  await expect(empty(page)).toContainText('No Lists match.')
  await page.locator('[data-shot="billing-empty-clear"]').click()
  await expect(page).not.toHaveURL(/q=/)
  await expect(page).not.toHaveURL(/anaesthetist=/)
  await expect(lists(page)).toHaveCount(20)

  // An unknown id typed into the URL matches nothing; clearing shows every List again.
  await page.goto('/admin/finances/billing?show=all&anaesthetist=nobody')
  await page.waitForLoadState('networkidle')
  await expect(empty(page)).toContainText('No Lists match.')
  await page.locator('[data-shot="billing-empty-clear"]').click()
  await expect(lists(page)).toHaveCount(20) // the first page of the practice's Lists
})
