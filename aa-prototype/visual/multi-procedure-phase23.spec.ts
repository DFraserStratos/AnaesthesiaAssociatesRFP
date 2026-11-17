import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 23: the primary Procedure and the multi-procedure rule.
 *  - Make primary on the phone (Ellison, BK0009, Souter Tue 21 PM): the new
 *    primary moves to the top with the Primary pill, B changes over and the
 *    Modifiers section moves with it.
 *  - The seeded three-procedure Booking (BK0184, Souter Mon 13 Jul AM,
 *    SUBMITTED): the Admin Booking total reads 3 · 2 · 2, and its Review row
 *    reads "M 7 · split 3 · 2 · 2".
 *  - Both demo actions from the harness bar.
 * Units only for the anaesthetist: no fee on the phone.
 */

const ELLISON_MOBILE = '/mobile/lists/L-34821-2026-07-21-PM/bookings/BK0009'
const SEEDED_ADMIN = '/admin/day/2026-07-13/bookings/BK0184'
const SEEDED_LIST = 'L-34821-2026-07-13-AM'

async function settle(page: Page, ms = 500): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(ms)
}

test('mobile: add a procedure, Make primary moves it to the top with the pill, B changes over and the Modifiers follow', async ({ page }) => {
  await page.goto(ELLISON_MOBILE)
  await settle(page)
  // One Procedure: no pill, no Make primary.
  await expect(page.locator('[data-shot="procedure-primary-pill"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Add another procedure' }).click()
  await settle(page, 700)

  const headers = page.locator('[data-testid="procedure-header"]')
  await expect(headers).toHaveCount(2)
  await expect(headers.nth(0).locator('[data-shot="procedure-primary-pill"]')).toHaveText('Primary')
  await expect(page.locator('[data-shot="procedure-additional-note"]')).toContainText('Base units are charged on the primary procedure only')
  const makePrimary = page.locator('[data-shot="make-primary"]')
  await expect(makePrimary).toHaveCount(1)
  // The additional Procedure's B row: 0, on the primary; the Modifiers caption row instead of the section.
  await expect(page.locator('[data-shot="units-row-b"]').filter({ hasText: 'Base units are on the primary procedure' })).toHaveCount(1)
  await expect(page.locator('[data-shot="modifiers-on-primary"]')).toHaveCount(1)
  await expect(page.getByText(/\$\d/)).toHaveCount(0) // units only on the phone

  // Before: Ellison's hip is first, with its own base; the added Procedure second.
  const blocks = page.locator('[data-procedure-id]')
  const firstBefore = await blocks.first().getAttribute('data-procedure-id')
  const secondBefore = await blocks.nth(1).getAttribute('data-procedure-id')
  await expect(blocks.first().locator('[data-shot="units-row-b"]')).not.toContainText('Base units are on the primary procedure')
  await expect(blocks.first().locator('[data-shot="modifiers-on-primary"]')).toHaveCount(0)

  await makePrimary.click()
  const sheet = page.locator('[data-shot="make-primary-sheet"]')
  await expect(sheet).toBeVisible()
  await expect(page.getByText('Make this the primary procedure?')).toBeVisible()
  await page.locator('[data-shot="make-primary-confirm"]').click()
  await settle(page, 600)

  // The added Procedure (stored second) is now first, with the pill; Ellison's hip is additional.
  await expect(blocks.first()).toHaveAttribute('data-procedure-id', secondBefore!)
  await expect(blocks.nth(1)).toHaveAttribute('data-procedure-id', firstBefore!)
  // B changed over: the hip (now second) reads base on the primary; the Modifiers section moved to the first.
  await expect(blocks.nth(1).locator('[data-shot="units-row-b"]')).toContainText('Base units are on the primary procedure')
  await expect(blocks.nth(1).locator('[data-shot="modifiers-on-primary"]')).toHaveCount(1)
  await expect(blocks.first().locator('[data-shot="modifiers-on-primary"]')).toHaveCount(0)
  await expect(headers.nth(0).locator('[data-shot="procedure-primary-pill"]')).toHaveText('Primary')
  await expect(page.locator('[data-shot="procedure-additional-note"]')).toHaveCount(1)
  await expect(page.locator('[data-shot="units-row-b"]').filter({ hasText: 'Base units are on the primary procedure' })).toHaveCount(1)
  await expect(page.locator('[data-shot="modifiers-on-primary"]')).toHaveCount(1)
})

test('admin: the seeded three-procedure Booking totals 3 · 2 · 2, primary first, no provisional label', async ({ page }) => {
  await page.goto(SEEDED_ADMIN)
  await settle(page)
  const split = page.locator('[data-testid="booking-calculation"] [data-shot="booking-total-split"]')
  await expect(split).toContainText('Primary · B + T + M 3 of 7')
  await expect(split).toContainText('Additional · T + M 2 of 7')
  await expect(split).toContainText('Modifiers 7, split 3 · 2 · 2')
  await expect(split).not.toContainText('provisional')
  await expect(page.locator('[data-testid="booking-calculation"]')).toContainText('$636.00')
  await expect(page.locator('[data-testid="procedure-header"]').nth(0).locator('[data-shot="procedure-primary-pill"]')).toHaveText('Primary')
})

test('admin: Make primary on the second procedure, then back, moves the 3 and the total', async ({ page }) => {
  await page.goto(SEEDED_ADMIN)
  await settle(page)
  await page.locator('[data-shot="make-primary"]').first().click()
  await page.locator('[data-shot="make-primary-confirm"]').click()
  await settle(page, 600)
  const calc = page.locator('[data-testid="booking-calculation"]')
  // Umbilical hernia primary: B 4 + T 2 + M 3 = 9; cholecystectomy T 6 + M 2 = 8; inguinal T 3 + M 2 = 5. 22 x $26.50.
  await expect(calc).toContainText('$583.00')
  await page.locator('[data-shot="make-primary"]').first().click()
  await page.locator('[data-shot="make-primary-confirm"]').click()
  await settle(page, 600)
  await expect(calc).toContainText('$636.00')
})

test('admin: the mixed bariatric Booking bills no base, labelled provisional (OQ-132)', async ({ page }) => {
  await page.goto('/admin/day/2026-07-14/bookings/BK0028')
  await settle(page)
  const split = page.locator('[data-shot="booking-total-split"]')
  await expect(split).toContainText('Primary · fixed price')
  await expect(split).toContainText('No base units billed (provisional, OQ-132)')
})

test('admin Review: the seeded List row reads M 7 · split 3 · 2 · 2', async ({ page }) => {
  await page.goto(`/admin/review/${SEEDED_LIST}`)
  await settle(page)
  await expect(page.locator('[data-shot="review-modifier-split"]')).toHaveText('M 7 · split 3 · 2 · 2')
  await expect(page.locator('[data-shot="review-procedure-share"]').first()).toHaveText('Primary · B + T + M 3 of 7')
})

test('demo actions: load the 3-procedure Booking, then the hospital feed changes the primary', async ({ page }) => {
  await page.goto(ELLISON_MOBILE.replace('/mobile', '/web'))
  await settle(page)
  const loaded = await runDemoAction(page, 'load-multi-procedure-booking', { close: true })
  expect(loaded).toMatch(/^Loaded on Dr Souter's .+ List: 3 procedures, 7 modifier units, split 3 · 2 · 2\.$/)
  // A second run is disabled.
  await page.locator('[data-shot="demo-actions"]').click()
  await expect(page.locator('[data-shot="demo-action-load-multi-procedure-booking"]')).toContainText('Already loaded')
  await page.keyboard.press('Escape')

  // The staged Booking (the next id after the seed's BK0184) on Dr Souter's Wed 22 Jul AM List.
  await page.goto('/web/lists/L-34821-2026-07-22-AM/bookings/BK0185')
  await settle(page)
  const first = page.locator('[data-shot="procedure-stack"]').first()
  await expect(first).toContainText('Laparoscopic cholecystectomy')
  const changed = await runDemoAction(page, 'feed-changes-primary', { close: true })
  expect(changed).toMatch(/ made .+ the primary\. Base units now come from it\.$/)
  await settle(page, 400)
  await expect(first).not.toContainText('Laparoscopic cholecystectomy')
  await expect(page.locator('[data-testid="procedure-header"]').first().locator('[data-shot="procedure-primary-pill"]')).toHaveText('Primary')

  // On the seeded SUBMITTED List the feed is disabled, with its reason.
  await page.goto(SEEDED_ADMIN)
  await settle(page)
  await page.locator('[data-shot="demo-actions"]').click()
  await expect(page.locator('[data-shot="demo-action-feed-changes-primary"]')).toContainText('A hospital feed cannot change a submitted List')
  await page.keyboard.press('Escape')
})
