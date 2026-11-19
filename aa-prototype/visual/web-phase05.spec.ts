import { test, expect } from '@playwright/test'

/**
 * Phase 05 web walkthrough — dashboard, lists table, list detail, booking detail
 * (shared BTM capture), availability grid + the move sheet (catch-up Phase 32;
 * the cover request is retired), and the accounts
 * (Outstanding + the monthly GST report, catch-up Phase 38) surfaces. Working artifacts for eyeballing, plus a few
 * assertions that the shared flows actually reach the web app.
 */

test('web phase 05 walkthrough', async ({ page }) => {
  await page.goto('/web')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  // Dashboard.
  await expect(page.getByRole('heading', { name: /Kia ora, Dr Souter/ })).toBeVisible()
  // Catch-up Phase 38: Financial position beside Who's free; no Productivity, Leave or ageing panels.
  await expect(page.locator('[data-shot=web-financial-position]')).toBeVisible()
  await expect(page.getByRole('heading', { name: /Productivity|Leave|Receivables/ })).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/w-01-dashboard.png', fullPage: true })

  // Lists table.
  await page.getByRole('button', { name: 'Lists', exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Lists' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w-02-lists.png', fullPage: true })

  // Drill into today's Southern Cross PM list.
  await page.getByText('Southern Cross').first().click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/w-03-list-detail.png', fullPage: true })

  // Drill into a booking → shared booking body + BTM capture.
  await page.getByText('Margaret Ellison').first().click()
  await page.waitForTimeout(300)
  await expect(page.locator('[data-shot="capture-billing"]').last()).toBeVisible()
  // No ASA card (catch-up Phase 19b): Ellison's A1 is pre-applied from her age.
  await expect(page.getByText('ASA status')).toHaveCount(0)
  await expect(page.locator('[data-shot="capture-modifier-applied"][data-modifier-code="A1"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w-04-booking-detail.png', fullPage: true })

  // A BTM edit: claim ASA III with its explanation (writes through the same guard as mobile).
  await page.locator('[data-shot="modifier-add"]').click()
  await page.locator('[data-shot="modifier-picker"] [data-modifier-code="AS3"]').click()
  await page.getByPlaceholder('A short reason, as an insurer would ask').fill('ASA III on pre-op review')
  await page.getByRole('button', { name: 'Claim', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-shot="capture-modifier-claim"][data-modifier-code="AS3"]')).toContainText('ASA III on pre-op review')
  await page.screenshot({ path: 'visual/shots/w-05-btm-edit.png', fullPage: true })

  // Availability grid.
  await page.getByRole('button', { name: 'Availability', exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w-06-availability.png', fullPage: true })

  // Move one of her own Lists (catch-up Phase 32): her List cell → Move → a colleague → Move List.
  await page.locator('[data-shot^="availability-move-mine-"]').first().click()
  await page.waitForTimeout(300)
  await page.locator('[data-shot="move-choice-colleague"]').click()
  await page.locator('[data-shot="move-colleagues"] button').first().click()
  await expect(page.getByRole('button', { name: 'Move List' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w-07-move-sheet.png', fullPage: true })
  await page.getByRole('button', { name: 'Move List' }).click()
  await page.waitForTimeout(300)
  await expect(page.locator('[data-shot="move-done"]')).toContainText('Moved to')
  await page.screenshot({ path: 'visual/shots/w-08-move-done.png', fullPage: true })
  await page.getByRole('button', { name: 'Done' }).click()

  // Accounts → Outstanding (catch-up Phase 38).
  await page.getByRole('button', { name: 'Accounts', exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
  await expect(page.locator('[data-shot=web-accounts-outstanding]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w-09-outstanding.png', fullPage: true })

  // Accounts → GST report: the month picker and its actions.
  await page.getByRole('link', { name: 'GST report' }).click()
  await page.waitForTimeout(300)
  await expect(page.locator('[data-shot=web-gst-month-picker]')).toBeVisible()
  await expect(page.locator('[data-shot=web-gst-actions]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w-10-gst-report.png', fullPage: true })
})

test('web List detail: each Booking opens by keyboard from the patient name (UI unification U1)', async ({ page }) => {
  await page.goto('/web')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Lists', exact: true }).click()
  await page.getByText('Southern Cross').first().click()
  await page.waitForTimeout(300)

  const handles = page.getByRole('button', { name: /^Open Booking for / })
  expect(await handles.count()).toBeGreaterThan(1)
  const ellison = page.getByRole('button', { name: /^Open Booking for Margaret Ellison at \d\d:\d\d$/ })
  await expect(ellison).toBeVisible()

  // Tab moves handle to handle (rows are not focusable), with a visible focus.
  await handles.first().focus()
  await page.keyboard.press('Tab')
  await expect(handles.nth(1)).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(handles.first()).toBeFocused()
  expect(await handles.first().evaluate((el) => el.matches(':focus-visible'))).toBe(true)
  await page.screenshot({ path: 'visual/shots/w-11-list-detail-keyboard.png', fullPage: true })

  // Enter on Margaret Ellison's name opens her Booking.
  const listURL = page.url()
  await ellison.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/bookings\//)
  await expect(page.locator('[data-shot="capture-billing"]').last()).toBeVisible()

  // The mouse still opens a Booking from anywhere on the row (its NHI cell, not the name).
  await page.goto(listURL)
  await page.locator('tr', { hasText: 'Margaret Ellison' }).locator('td').nth(2).click()
  await expect(page).toHaveURL(/\/bookings\//)
})
