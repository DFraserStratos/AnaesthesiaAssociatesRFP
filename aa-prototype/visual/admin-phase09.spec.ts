import { test, expect } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Phase 09 admin walkthrough — the Billing tab (trigger a failure, see
 * per-booking isolation, resolve & retry; build plan Phase 60's table) and the prepayment warning on a
 * booking (the warnings panel + the office's raise action; no gate, no override). A working
 * artifact for eyeballing plus light assertions.
 */

test('admin phase 09: billing monitor failure, resolve and retry (re-based on the Xero hand-off, catch-up Phase 25)', async ({ page }) => {
  // Trigger the seeded billing failure from Finances · Billing's Demo actions menu (build plan Phase 58).
  await page.goto('/admin/finances/billing')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Finances', level: 1 })).toBeVisible()
  const message = await runDemoAction(page, 'billing-failure')
  expect(message).toMatch(/waits for Xero in the sync queue/)
  await page.screenshot({ path: 'visual/shots/p9-01-trigger.png', fullPage: true })
  // Pressed once, it reads Already triggered.
  await expect(page.locator('[data-shot="demo-action-billing-failure"]').getByText('Already triggered')).toBeVisible()
  await page.keyboard.press('Escape')
  // The Billing tab opens on Problems (build plan Phase 60): filter to Dr Ropata's all the same.
  await page.locator('[data-shot="billing-filters"]').getByLabel('Anaesthetist', { exact: true }).selectOption('39560')

  // Losa Tuilagi's hand-off waits for Xero in the sync queue (catch-up Phase 37); Hemi Walker billed; the List is not failed.
  await expect(page.locator('tr[data-booking-id][data-problem="waitingForXero"]')).toHaveCount(1)
  await expect(page.locator('tr[data-shot="billing-list-L-39560-2026-11-19-AM"]')).not.toContainText('Billing failed')
  await page.locator('[data-shot="billing-show-all-L-39560-2026-11-19-AM"]').click()
  await expect(page.locator('tr[data-booking-id]')).toHaveCount(2)
  await expect(page.locator('tr[data-booking-id][data-problem]')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Resolve & retry' })).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p9-02-monitor.png', fullPage: true })

  // Retry now, on the Xero tab (it opens on Needs action, the waiting hand-off listed), hands it off once; no Contract is edited.
  await page.locator('[data-shot="finances-tabs"] [data-finances-tab="xero"]').click()
  await expect(page).toHaveURL(/\/admin\/finances\/xero/)
  const table = page.locator('[data-shot="xero-table"]')
  await expect(table.getByRole('button', { name: 'Retry now' })).toHaveCount(1)
  await table.getByRole('button', { name: 'Retry now' }).click()
  await page.waitForTimeout(400)
  await expect(page.getByRole('button', { name: 'Retry now' })).toHaveCount(0)
  await expect(page.locator('[data-shot="xero-empty"]')).toContainText('Nothing needs action in Xero.')
  await page.locator('[data-shot="finances-tabs"] [data-finances-tab="billing"]').click()
  await expect(page).toHaveURL(/\/admin\/finances\/billing/)
  await page.locator('[data-shot="billing-filters"]').getByLabel('Anaesthetist', { exact: true }).selectOption('39560')
  await expect(page.locator('tr[data-booking-id][data-problem="waitingForXero"]')).toHaveCount(0)
  await expect(page.locator('[data-shot="billing-empty"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p9-03-retried.png', fullPage: true })
})

test('admin phase 09: prepayment warning on a booking (never a block)', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  // Navigate the day view forward to Friday 24 July (Tue 21 -> Fri 24).
  for (let i = 0; i < 3; i++) {
    await page.getByTestId('admin-day-nav').getByRole('button', { name: 'Next day', exact: true }).click()
    await page.waitForTimeout(200)
  }
  await expect(page.getByRole('heading', { name: /Friday 27 November 2026/ })).toBeVisible()
  // The day grid's focus filters carry the warnings key (catch-up Phase 15a).
  await expect(page.getByRole('button', { name: 'Has warnings' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p9-04-friday.png', fullPage: true })

  // Open Souter's AM list (Forte / Ms G. Lim) and its booking: the warning banner.
  await page.getByText('Ms G. Lim', { exact: false }).first().click()
  await page.waitForTimeout(300)
  await page.getByTestId('admin-list-drawer').getByRole('button', { name: /^Open Booking for / }).first().click()
  await page.waitForTimeout(300)
  await expect(page.locator('[data-shot="booking-warnings"]')).toBeVisible()
  await expect(page.getByText('Prepayment of $1,200.00 from Annette Riley is awaiting approval on Invoices and has not been sent.')).toBeVisible()
  await expect(page.getByText(/never a block/)).toBeVisible()
  await expect(page.getByRole('button', { name: /Raise pre-procedure invoice/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Override/ })).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p9-05-gate.png', fullPage: true })
})
