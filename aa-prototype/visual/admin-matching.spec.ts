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
  await expect(bench.locator('[data-row-id]', { hasText: 'Mere Tipene' })).toHaveAttribute('data-row-change', 'waiting')
  await page.screenshot({ path: 'visual/shots/admin-intake-needs-nhi.png', fullPage: true })

  // A reload keeps the filter and the pick; search narrows the feed and lands in the URL.
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(feedItem(page, 'Mere Tipene')).toHaveAttribute('aria-selected', 'true')
  await page.locator('[data-shot="intake-search"]').getByRole('searchbox').fill('Tipene')
  await expect(page).toHaveURL(/filter=needs-nhi&q=Tipene$/)
  await expect(feedItem(page, 'Mere Tipene')).toHaveCount(1)
  // Phase 68: Add NHI on the waiting row (and its stub resolving) moved to 72; re-added there.
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
  // Phase 68: deciding rows (Create Booking, ticked differences, the day move, Reject, the later update) moved to 69; re-added there.
  // Phase 68: S1 Beat 1's balance warning preview on deciding Sarah Mitchell's row moved to 69; re-added there.
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
  await expect(page.locator('[data-shot="intake-bench-cancellation"] [data-row-id]').first()).toHaveAttribute('data-row-change', 'cancelled')
  await page.screenshot({ path: 'visual/shots/admin-intake-cancellation.png', fullPage: true })
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
