import { expect, test } from '@playwright/test'

/**
 * Catch-up Phase 38a: the main view from today, search and the date lookup,
 * on the framed mobile app and the web app. Screenshots land in
 * `visual/shots/` (gitignored) for the eye; the assertions are the behaviour.
 */

const SHOTS = 'visual/shots/phase38a'

test('mobile: the main view opens at Today with the earlier hint; submitted rows are quieter', async ({ page }) => {
  await page.goto('/mobile/lists')
  await page.waitForLoadState('networkidle')
  const hint = page.locator('[data-shot="mobile-main-view-earlier"]')
  // Mon 13 Jul AM (catch-up Phase 23's three-procedure Booking) and Mon 20 Jul AM and PM.
  await expect(hint).toHaveText(/3 earlier Lists not yet authorised/)
  // Today sits at the top of the scroller: the earlier rows are scrolled out of view.
  const scroller = page.getByTestId('mobile-lists-scroll')
  expect(await scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  await page.screenshot({ path: `${SHOTS}/mobile-main-view.png` })
  await hint.click()
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBe(0)
  await expect(page.locator('[data-list-id="L-34821-2026-11-23-PM"][data-quiet="true"]')).toContainText('Done · unbilled')
  await page.screenshot({ path: `${SHOTS}/mobile-main-view-earlier.png` })
})

test('mobile: the date sheet goes to March 2026 and Fri 13 Mar shows its invoiced List', async ({ page }) => {
  await page.goto('/mobile/lists')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Go to a date' }).click()
  const sheet = page.locator('[data-shot="mobile-lookback-calendar"]')
  await expect(sheet).toBeVisible()
  await sheet.getByRole('button', { name: /November 2026\. Choose a month and year/ }).click()
  await sheet.getByRole('button', { name: 'March 2026', exact: true }).click()
  await page.screenshot({ path: `${SHOTS}/mobile-date-sheet-march.png` })
  await sheet.getByRole('button', { name: /^Friday 13 March 2026, 1 List/ }).click()
  await expect(page).toHaveURL(/\/mobile\/lists\?day=2026-03-13$/)
  await expect(page.getByTestId('mobile-lists-day-chip')).toContainText('Fri 13 Mar 2026')
  await expect(page.locator('[data-list-id="L-HIST-2026-03-13-AM"]')).toContainText('Invoiced')
})

test('mobile: search for Mitchell shows Upcoming and Past, never her Booking on a colleague\'s List', async ({ page }) => {
  await page.goto('/mobile/lists')
  await page.waitForLoadState('networkidle')
  await page.getByRole('searchbox', { name: 'Search your Bookings' }).fill('Mitchell')
  await expect(page).toHaveURL(/\?q=Mitchell$/)
  const results = page.locator('[data-shot="mobile-lookback-search"]')
  await expect(results.locator('button[data-booking-id]')).toHaveCount(3)
  await expect(page.getByTestId('mobile-lists-search-count')).toHaveText('3 Bookings for Mitchell')
  await page.screenshot({ path: `${SHOTS}/mobile-search-mitchell.png` })
})

test('web: Lists opens with the earlier group; search and the day view', async ({ page }) => {
  await page.goto('/web/lists')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="web-main-view-earlier"]')).toContainText('Earlier, not yet authorised')
  await expect(page.locator('[data-shot="web-main-view-earlier"] tr[data-list-id]')).toHaveCount(3)
  await page.screenshot({ path: `${SHOTS}/web-main-view.png` })

  await page.goto('/web/lists?day=2026-03-13')
  await expect(page.locator('[data-shot="web-lookback-day"] tr[data-list-id]')).toHaveCount(1)
  await page.screenshot({ path: `${SHOTS}/web-day.png` })

  await page.goto('/web/lists?q=Mitchell')
  await expect(page.locator('[data-shot="web-lookback-search"] tr[data-booking-id]')).toHaveCount(3)
  await page.screenshot({ path: `${SHOTS}/web-search.png` })
})
