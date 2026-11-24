import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 37 (US-13.3.1): the Admin Billing monitor restyled as the
 * processing monitor. One group per anaesthetist in surname order; Lists
 * awaiting approval open in Review (no Authorise on the monitor); authorised
 * Lists expand to their pipeline; filters, Problems only and the sort live in
 * the URL, so a reload and the Review round trip keep the view.
 */

const SOUTER = '34821'
const ROPATA = '39560'
const DELANEY = '27731'
const SOUTER_MON_AM = 'L-34821-2026-11-23-AM'
const SOUTER_THU_PM = 'L-34821-2026-11-19-PM'
const ROPATA_THU_AM = 'L-39560-2026-11-19-AM'

/** A clean seed: the store persists to localStorage, so clear it and load again. */
async function fresh(page: Page, path = '/admin/billing'): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Billing monitor', level: 1 })).toBeVisible()
}

const groups = (page: Page) => page.locator('section[data-shot^="billing-group-"]')
const group = (page: Page, anaesthetistId: string) => page.locator(`section[data-shot="billing-group-${anaesthetistId}"]`)
const pipeline = (page: Page, listId: string) => page.locator(`tbody[data-shot="billing-pipeline-${listId}"]`)
const awaitingRow = (page: Page, listId: string) => page.locator(`tr[data-shot="billing-awaiting-${listId}"]`)
const tileValue = (page: Page, key: string) => page.locator(`[data-shot="billing-tile-${key}"]`)
const count = (page: Page) => page.locator('[data-shot="billing-monitor-count"]')

async function groupOrder(page: Page): Promise<string[]> {
  return groups(page).evaluateAll((els) => els.map((e) => (e.getAttribute('data-shot') ?? '').replace('billing-group-', '')))
}

/** The Lists in one group's table, top to bottom (awaiting rows, then authorised pipelines). */
async function listOrder(page: Page, anaesthetistId: string): Promise<string[]> {
  return group(page, anaesthetistId)
    .locator('[data-shot^="billing-awaiting-"], [data-shot^="billing-pipeline-"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-list-id') ?? ''))
}

test('reset: one group per anaesthetist in surname order, the Lists awaiting approval, and no Authorise', async ({ page }) => {
  await fresh(page)

  // Groups in surname order (Chen, Delaney, Morrison, Ropata, Souter, Whitaker at seed).
  const order = await groupOrder(page)
  expect(order).toEqual(['45178', DELANEY, '25490', ROPATA, SOUTER, '36208'])
  const names = await groups(page).locator('h2').allTextContents()
  const surnames = names.map((n) => n.split(' ').at(-1) ?? '')
  expect(surnames).toEqual([...surnames].sort((a, b) => a.localeCompare(b)))

  // Every SUBMITTED List sits in its anaesthetist's group as Awaiting approval, with a teal Open in Review.
  const awaiting = page.locator('tr[data-shot^="billing-awaiting-"]')
  const awaitingCount = await awaiting.count()
  expect(awaitingCount).toBeGreaterThanOrEqual(6)
  await expect(tileValue(page, 'awaiting')).toContainText(String(awaitingCount))
  for (const listId of [SOUTER_MON_AM, 'L-34821-2026-11-23-PM', ROPATA_THU_AM, 'L-25490-2026-11-23-AM', 'L-27731-2026-11-20-AM', 'L-36208-2026-11-20-AM']) {
    const anaesthetistId = listId.split('-')[1]!
    const row = group(page, anaesthetistId).locator(`tr[data-shot="billing-awaiting-${listId}"]`)
    await expect(row).toBeVisible()
    await expect(row.getByText('Awaiting approval')).toBeVisible()
    await expect(row.locator(`[data-shot="billing-open-in-review-${listId}"]`)).toHaveText('Open in Review')
  }
  // Teal, the one action colour (filled or teal-outlined), never crimson.
  await expect(page.locator(`[data-shot="billing-open-in-review-${SOUTER_MON_AM}"]`)).toHaveCSS('border-color', 'rgb(13, 110, 99)')

  // No Authorise anywhere on the monitor; the intro carries no RFP placement caveat.
  await expect(page.getByRole('button', { name: /Authorise/ })).toHaveCount(0)
  await expect(page.locator('main, body').first()).not.toContainText('Phase 10 stub')
  await expect(page.getByText('Lists awaiting approval open in Review, where they are authorised.')).toBeVisible()
  await expect(tileValue(page, 'problems')).toContainText('0')

  // The seeded authorised List opens expanded at seed scale: stage strip and Booking rows; the chevron folds it.
  const seeded = pipeline(page, SOUTER_THU_PM)
  await expect(seeded).toBeVisible()
  await expect(seeded.locator('ol[aria-label="Billing pipeline"]')).toBeVisible()
  expect(await seeded.locator('tr[data-booking-id]').count()).toBeGreaterThan(0)
  const chevron = seeded.getByRole('button', { name: / details$/ })
  await chevron.click()
  await expect(seeded.getByRole('button', { name: / details$/ })).toHaveAttribute('aria-expanded', 'false')
  await expect(seeded.locator('ol[aria-label="Billing pipeline"]')).toHaveCount(0)
  await expect(page).toHaveURL(new RegExp(`shut=${SOUTER_THU_PM}`))
  await seeded.getByRole('button', { name: / details$/ }).click()
  await expect(seeded.locator('ol[aria-label="Billing pipeline"]')).toBeVisible()

  // Problems only with nothing wrong.
  await page.locator('[data-shot="billing-monitor-filters"]').getByRole('button', { name: 'Problems only' }).click()
  await expect(page.locator('[data-shot="billing-monitor-empty"]')).toHaveText('No problems. Every authorised list has billed, been sent and reached Xero.')
  await expect(groups(page)).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p37-monitor-01-reset.png', fullPage: true })
})

test('Open in Review with a filter on: authorise there, Back to Billing monitor keeps the filter; sort both ways; reload keeps the view', async ({ page }) => {
  await fresh(page, `/admin/billing?anaesthetist=${SOUTER}`)
  await expect(groups(page)).toHaveCount(1)
  await expect(page.locator('[data-shot="billing-filter-anaesthetist"]')).toHaveValue(SOUTER)

  await page.locator(`[data-shot="billing-open-in-review-${SOUTER_MON_AM}"]`).click()
  await expect(page).toHaveURL(new RegExp(`/admin/review/${SOUTER_MON_AM}$`))
  const back = page.locator('[data-shot="review-back-to-billing"]')
  await expect(back).toHaveText(/Billing monitor/)

  // Authorise on Review, with its usual confirm.
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await expect(page.getByText('List authorised · locked for billing')).toBeVisible()
  await expect(page.locator('[data-shot="review-delivery-summary"]')).toHaveText(/invoices? raised\./)

  await back.click()
  await expect(page).toHaveURL(new RegExp(`/admin/billing\\?anaesthetist=${SOUTER}$`))
  await expect(page.locator('[data-shot="billing-filter-anaesthetist"]')).toHaveValue(SOUTER)
  await expect(groups(page)).toHaveCount(1)
  await expect(awaitingRow(page, SOUTER_MON_AM)).toHaveCount(0)
  const authorised = group(page, SOUTER).locator(`tbody[data-shot="billing-pipeline-${SOUTER_MON_AM}"]`)
  await expect(authorised).toBeVisible()
  await expect(authorised.getByRole('button', { name: / details$/ })).toHaveAttribute('aria-expanded', 'true')
  await expect(authorised.locator('ol[aria-label="Billing pipeline"]')).toBeVisible()
  expect(await authorised.locator('tr[data-booking-id]').count()).toBe(3)
  await expect(page.getByRole('button', { name: /Authorise/ })).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p37-monitor-02-back-from-review.png', fullPage: true })

  // Opened from the Review queue, Review shows its ordinary breadcrumb instead.
  await page.goto('/admin/review')
  await page.waitForLoadState('networkidle')
  await page.getByRole('row').filter({ hasText: /Souter/ }).filter({ hasText: /St George's/ }).getByRole('button', { name: /^Review / }).first().click()
  await expect(page).toHaveURL(/\/admin\/review\/L-/)
  await expect(page.locator('[data-shot="review-back-to-billing"]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Review queue', exact: true })).toBeVisible()

  // Sort by Date · session both ways: Souter's two authorised Lists swap; aria-sort follows.
  await page.goto(`/admin/billing?anaesthetist=${SOUTER}`)
  await page.waitForLoadState('networkidle')
  const souter = group(page, SOUTER)
  const dateHead = souter.locator('th[aria-sort]').filter({ hasText: 'Date · session' })
  await expect(dateHead).toHaveAttribute('aria-sort', 'none')
  await dateHead.getByRole('button').click()
  await expect(dateHead).toHaveAttribute('aria-sort', 'ascending')
  await expect(page).toHaveURL(/sort=date-asc/)
  let lists = await listOrder(page, SOUTER)
  const authorisedOrder = (ids: string[]) => ids.filter((id) => id === SOUTER_THU_PM || id === SOUTER_MON_AM)
  expect(authorisedOrder(lists)).toEqual([SOUTER_THU_PM, SOUTER_MON_AM])
  await dateHead.getByRole('button').click()
  await expect(dateHead).toHaveAttribute('aria-sort', 'descending')
  await expect(page).toHaveURL(/sort=date-desc/)
  lists = await listOrder(page, SOUTER)
  expect(authorisedOrder(lists)).toEqual([SOUTER_MON_AM, SOUTER_THU_PM])
  // Awaiting rows still lead the group.
  expect(lists[0]).toMatch(/^L-34821-/)
  expect(await souter.locator('tr[data-shot^="billing-awaiting-"]').count()).toBeGreaterThan(0)
  await expect(souter.locator('th[aria-sort]').filter({ hasText: 'Hospital' })).toHaveAttribute('aria-sort', 'none')

  // Reload keeps the view: the filter, the sort and the order.
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="billing-filter-anaesthetist"]')).toHaveValue(SOUTER)
  await expect(groups(page)).toHaveCount(1)
  await expect(group(page, SOUTER).locator('th[aria-sort]').filter({ hasText: 'Date · session' })).toHaveAttribute('aria-sort', 'descending')
  expect(authorisedOrder(await listOrder(page, SOUTER))).toEqual([SOUTER_MON_AM, SOUTER_THU_PM])
  await page.screenshot({ path: 'visual/shots/p37-monitor-03-sorted.png', fullPage: true })
})

test('Trigger billing failure, then Problems only shows only Ropata\'s List, expanded; Retry now clears it', async ({ page }) => {
  await fresh(page, '/admin/billing?sort=date-asc')
  // The Demo actions work with search params on the URL.
  expect(await runDemoAction(page, 'billing-failure', { close: true })).toMatch(/waits for Xero in the sync queue/)

  await expect(tileValue(page, 'problems')).toContainText('1')
  await page.locator('[data-shot="billing-tile-problems"]').click()
  await expect(page).toHaveURL(/problems=1/)
  await expect(page).toHaveURL(/sort=date-asc/)
  await expect(page.locator('[data-shot="billing-monitor-filters"]').getByRole('button', { name: 'Problems only' })).toHaveAttribute('aria-pressed', 'true')

  await expect(groups(page)).toHaveCount(1)
  await expect(group(page, ROPATA)).toBeVisible()
  await expect(page.locator('tr[data-shot^="billing-awaiting-"]')).toHaveCount(0)
  await expect(page.locator('tbody[data-shot^="billing-pipeline-"]')).toHaveCount(1)
  const ropata = pipeline(page, ROPATA_THU_AM)
  await expect(ropata).toHaveAttribute('data-problems', /waitingForXero/)
  await expect(ropata.locator('ol[aria-label="Billing pipeline"]')).toBeVisible()
  await expect(ropata.locator('[data-shot="monitor-waiting-for-xero"]')).toHaveCount(1)
  await expect(ropata.getByText('Waiting for Xero').first()).toBeVisible()
  await expect(count(page)).toHaveText('1 list')
  await expect(page.getByRole('button', { name: 'Resolve & retry' })).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p37-monitor-04-problems-only.png', fullPage: true })

  // Retry now on its queue row hands it off; the problem and the List leave the view.
  const queue = page.locator('[data-shot="billing-xero-queue"]')
  await expect(queue.locator('[data-queue-item]')).toHaveCount(1)
  await queue.getByRole('button', { name: 'Retry now' }).click()
  await expect(queue.getByText('Nothing is waiting for Xero.')).toBeVisible()
  await expect(page.locator('[data-shot="billing-monitor-empty"]')).toHaveText('No problems. Every authorised list has billed, been sent and reached Xero.')
  await expect(tileValue(page, 'problems')).toContainText('0')
})

test('filters: one anaesthetist, a hospital, a date range, Clear filters, an unknown id, and reload', async ({ page }) => {
  await fresh(page)
  const all = (await count(page).textContent()) ?? ''
  const filters = page.locator('[data-shot="billing-monitor-filters"]')

  // One anaesthetist.
  await filters.getByLabel('Anaesthetist').selectOption(DELANEY)
  await expect(page).toHaveURL(new RegExp(`anaesthetist=${DELANEY}`))
  await expect(groups(page)).toHaveCount(1)
  await expect(group(page, DELANEY)).toBeVisible()
  await expect(count(page)).toHaveText('1 list')

  // Reload keeps it.
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(groups(page)).toHaveCount(1)
  await expect(filters.getByLabel('Anaesthetist')).toHaveValue(DELANEY)

  // Clear, then a hospital: only St George's Lists.
  await page.locator('[data-shot="billing-filter-clear"]').click()
  await expect(count(page)).toHaveText(all)
  await filters.getByLabel('Hospital').selectOption('H-STG')
  await expect(page).toHaveURL(/hospital=H-STG/)
  const rows = page.locator('[data-shot^="billing-awaiting-"], [data-shot^="billing-pipeline-"]')
  const n = await rows.count()
  expect(n).toBeGreaterThan(0)
  for (let i = 0; i < n; i++) await expect(rows.nth(i)).toContainText("St George's")
  await expect(group(page, '45178')).toHaveCount(0) // Chen's Lists are at Christchurch Eye Surgery

  // A date range on top: Fri 17 Jul only.
  await page.locator('[data-shot="billing-filter-from"]').fill('2026-11-20')
  await page.locator('[data-shot="billing-filter-to"]').fill('2026-11-20')
  await expect(page).toHaveURL(/from=2026-11-20/)
  await expect(page).toHaveURL(/to=2026-11-20/)
  await expect(groups(page)).toHaveCount(1)
  await expect(group(page, DELANEY)).toBeVisible()
  await expect(count(page)).toHaveText('1 list')

  await page.locator('[data-shot="billing-filter-clear"]').click()
  await expect(count(page)).toHaveText(all)
  await expect(page).toHaveURL(/\/admin\/billing$/)

  // An unknown id typed into the URL shows all.
  await page.goto('/admin/billing?anaesthetist=nobody&hospital=H-NOWHERE')
  await page.waitForLoadState('networkidle')
  await expect(count(page)).toHaveText(all)
  await expect(groups(page)).toHaveCount(6)
})
