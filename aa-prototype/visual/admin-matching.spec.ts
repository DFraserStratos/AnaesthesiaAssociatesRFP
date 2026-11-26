import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Admin, Intake, Arrivals (build plan Phase 68; D117; was Matching, catch-up Phase 33). The feed beside the
 * docked workbench, with no import or upload button; its filter, search and picked item in the URL; arrivals
 * landing as their kind from their source, nothing applied; the old Matching addresses redirecting with
 * replace. Nothing changes the schedule until the office decides (RV-13).
 */

async function fresh(page: Page, path = '/admin/intake'): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

const feedItem = (page: Page, text: string) => page.locator('[data-shot="intake-feed-item"]', { hasText: text })
const workbench = (page: Page) => page.locator('[data-shot="intake-workbench"]')

test('Arrivals: the feed beside the docked workbench, no import or upload button, only "Add a PDF by hand"', async ({ page }) => {
  await fresh(page)
  await expect(page.locator('[data-shot="intake-section"]')).toBeVisible()
  const tabs = page.locator('[data-shot="intake-tabs"]')
  await expect(tabs.getByRole('link', { name: /^Arrivals/ })).toBeVisible()
  await expect(tabs.getByRole('link', { name: 'Sources' })).toBeVisible()
  await expect(page.locator('[data-shot="intake-sources-strip"]')).toContainText('Inbound only')
  await expect(page.locator('[data-shot="intake-split"]')).toBeVisible()
  await expect(page.locator('[data-shot="intake-feed"]')).toBeVisible()
  await expect(workbench(page)).toBeVisible()
  await expect(page.getByText('Import hospital file')).toHaveCount(0)
  await expect(page.getByText('Upload PDF')).toHaveCount(0)
  await expect(page.locator('[data-shot="intake-add-pdf"]')).toHaveText('Add a PDF by hand')
  expect(/download/i.test(await page.locator('[data-shot="intake-arrivals"]').innerText())).toBe(false)
  await page.screenshot({ path: 'visual/shots/admin-intake-arrivals.png', fullPage: true })
})

test('Needs NHI: the filter and the picked item live in the URL; the seeded row waits with its stub', async ({ page }) => {
  await fresh(page)
  await page.locator('[data-shot="intake-filters"]').getByRole('button', { name: /^Needs NHI/ }).click()
  await expect(page).toHaveURL(/\/admin\/intake\?filter=needs-nhi$/)
  // The seeded row waiting for an NHI, with its stub on a List (catch-up Phase 33a).
  const mere = feedItem(page, 'Mere Tipene')
  await expect(mere).toHaveAttribute('data-arrival-kind', 'needsNhi')
  await mere.click()
  await expect(mere).toHaveAttribute('aria-selected', 'true')
  const key = await mere.getAttribute('data-arrival-key')
  expect(key).not.toBeNull()
  await expect(page).toHaveURL(/\/admin\/intake\?filter=needs-nhi&item=/)
  expect(new URL(page.url()).searchParams.get('item')).toBe(key)
  await expect(workbench(page)).toHaveAttribute('data-arrival-kind', 'needsNhi')
  const bench = page.locator('[data-shot="intake-bench-needsNhi"]')
  await expect(bench).toBeVisible()
  // Phase 72: the bench's parts, top to bottom: as received, the List with its stub, the one address, Add NHI.
  await expect(bench.locator('[data-shot="waiting-nhi-row"]')).toHaveAttribute('data-row-id', 'IRS001')
  await expect(bench.locator('[data-shot="waiting-nhi-patient"]')).toContainText('Mere Tipene')
  await expect(bench.locator('[data-shot="waiting-nhi-stub"]')).toContainText("Stub on Dr Souter's List")
  await expect(bench.locator('a[data-shot="waiting-nhi-email"]')).toHaveAttribute('href', /^mailto:/)
  await expect(bench.locator('[data-shot="waiting-nhi-add"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/admin-intake-needs-nhi.png', fullPage: true })

  // A reload keeps the filter and the pick; search narrows the feed and lands in the URL.
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(feedItem(page, 'Mere Tipene')).toHaveAttribute('aria-selected', 'true')
  await page.locator('[data-shot="intake-search"]').getByRole('searchbox').fill('Tipene')
  await expect(page).toHaveURL(/filter=needs-nhi&q=Tipene$/)
  await expect(feedItem(page, 'Mere Tipene')).toHaveCount(1)

  // Phase 72: Add NHI, the one path: the Booking takes the stub's place and the row leaves Needs NHI.
  await page.locator('[data-shot="waiting-nhi-add"]').click()
  const sheet = page.locator('[data-shot="add-nhi-sheet"]')
  await sheet.getByLabel('NHI', { exact: true }).fill('ZQA1024')
  await sheet.locator('[data-shot="add-nhi-save"]').click()
  await expect(feedItem(page, 'Mere Tipene')).toHaveCount(0)
})

test("St George's sends the day-before List: the file lands as a heading over its Lists, nothing applied", async ({ page }) => {
  await fresh(page)
  expect(await runDemoAction(page, 'intake-stg-day-before', { close: true })).not.toMatch(/^Refused/)
  await page.goto('/admin/intake?filter=hospital-H-STG')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="intake-group-header"]').first()).toBeVisible()
  const exact = page.locator('[data-shot="intake-feed-item"][data-arrival-kind="matchesExactly"]')
  await expect(exact.first()).toBeVisible()
  await exact.first().click()
  await expect(workbench(page)).toHaveAttribute('data-arrival-kind', 'matchesExactly')
  await expect(page.locator('[data-shot="intake-bench-matchesExactly"] [data-row-id]').first()).toHaveAttribute('data-row-change', 'unchanged')
  await page.screenshot({ path: 'visual/shots/admin-intake-stg-day-before.png', fullPage: true })
})

test('An update to a List AA holds: the match basis, the versions and a tick per Booking; Apply decides the whole List', async ({ page }) => {
  await fresh(page)
  expect(await runDemoAction(page, 'intake-stg-day-before', { close: true })).not.toMatch(/^Refused/)
  await page.goto('/admin/intake?filter=hospital-H-STG')
  await page.waitForLoadState('networkidle')
  const update = page.locator('[data-shot="intake-feed-item"][data-arrival-kind="update"]').first()
  await expect(update).toBeVisible()
  await update.click()
  const bench = page.locator('[data-shot="intake-bench-update"]')
  await expect(bench).toBeVisible()
  await expect(bench.locator('[data-shot="intake-match-basis"] [data-key="surgeon"]')).toHaveAttribute('data-agreed', 'true')
  await expect(bench.locator('[data-shot="intake-version-track"] [data-proposed="true"]')).toHaveCount(1)
  await expect(bench.locator('[data-shot="intake-lands-card"]')).toBeVisible()
  expect(/score|%/i.test(await bench.innerText())).toBe(false)
  const diff = bench.locator('[data-shot="intake-update-diff"]')
  const changed = diff.locator('tr[data-change="changed"]').first()
  await expect(changed).toHaveAttribute('data-ticked', 'true')
  await page.screenshot({ path: 'visual/shots/admin-intake-update-bench.png', fullPage: true })
  // Untick one change: it is left out; Apply decides the rest as one change set and the feed moves on.
  const leftOutId = await changed.getAttribute('data-row-id')
  await changed.locator('[data-row-tick]').click()
  await expect(changed).toHaveAttribute('data-ticked', 'false')
  await bench.locator('[data-shot="matching-apply"]').click()
  await page.goto('/admin/intake?filter=decided')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="intake-feed-item"][data-arrival-kind="update"]').first().click()
  await expect(page.locator('[data-shot="intake-update-decided"]')).toContainText('left out')
  await expect(page.locator(`tr[data-row-id="${leftOutId}"]`)).toContainText('Left out')
})

test('Reject an update with a reason: nothing on the schedule changes', async ({ page }) => {
  await fresh(page)
  expect(await runDemoAction(page, 'intake-stg-day-before', { close: true })).not.toMatch(/^Refused/)
  await page.goto('/admin/intake?filter=hospital-H-STG')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="intake-feed-item"][data-arrival-kind="update"]').first().click()
  const bench = page.locator('[data-shot="intake-bench-update"]')
  await bench.locator('[data-shot="intake-update-reject"]').click()
  await expect(bench.getByRole('button', { name: 'Reject List' })).toBeDisabled()
  await bench.locator('[data-shot="intake-update-reject-form"]').getByRole('button', { name: 'Not an AA booking' }).click()
  await bench.getByRole('button', { name: 'Reject List' }).click()
  await expect(page.locator('[data-shot="intake-feed-item"][data-arrival-kind="update"]')).toHaveCount(0)
})

test('Southern Cross cancels a Booking: one Cancellation, its row cancelled on the workbench', async ({ page }) => {
  await fresh(page)
  expect(await runDemoAction(page, 'intake-sx-cancels', { close: true })).not.toMatch(/^Refused/)
  await page.goto('/admin/intake?filter=hospital-H-SX')
  await page.waitForLoadState('networkidle')
  const cancellation = page.locator('[data-shot="intake-feed-item"][data-arrival-kind="cancellation"]')
  await expect(cancellation).toHaveCount(1)
  await cancellation.click()
  await expect(workbench(page)).toHaveAttribute('data-arrival-kind', 'cancellation')
  const bench = page.locator('[data-shot="intake-bench-cancellation"]')
  await expect(bench.locator('[data-shot="intake-cancellation-booking"]').first()).toBeVisible()
  await expect(bench.locator('[data-shot="intake-lands-card"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/admin-intake-cancellation.png', fullPage: true })
  // Mark cancelled: the Booking stays visible, marked cancelled.
  await bench.locator('[data-shot="intake-cancellation-apply"]').click()
  await expect(page.locator('[data-shot="intake-feed-item"][data-arrival-kind="cancellation"]')).toHaveCount(0)
})

test('the old Matching addresses land on Arrivals with replace, so Back skips them', async ({ page }) => {
  await fresh(page, '/admin/day/2026-11-24')
  for (const old of ['/admin/intake/matching', '/admin/matching', '/admin/integrations']) {
    await page.goto(old)
    await expect(page).toHaveURL(/\/admin\/intake$/)
    await expect(page.locator('[data-shot="intake-arrivals"]')).toBeVisible()
  }
  await page.goto('/admin/day/2026-11-24')
  await page.waitForLoadState('networkidle')
  await page.goto('/admin/intake/matching')
  await expect(page).toHaveURL(/\/admin\/intake$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/admin\/day\/2026-11-24$/)
})
