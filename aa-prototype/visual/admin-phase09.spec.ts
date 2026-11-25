import { test, expect } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Phase 09 admin walkthrough — the billing monitor (trigger a failure, see
 * per-booking isolation, resolve & retry) and the prepayment warning on a
 * booking (the warnings panel + the office's raise action; no gate, no override). A working
 * artifact for eyeballing plus light assertions.
 */

test('admin phase 09: billing monitor failure, resolve and retry (re-based on the Xero hand-off, catch-up Phase 25)', async ({ page }) => {
  // Trigger the seeded billing failure from the Billing monitor's Demo actions menu.
  await page.goto('/admin/billing')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Billing monitor' })).toBeVisible()
  const message = await runDemoAction(page, 'billing-failure')
  expect(message).toMatch(/waits for Xero in the sync queue/)
  await page.screenshot({ path: 'visual/shots/p9-01-trigger.png', fullPage: true })
  // Pressed once, it reads Already triggered.
  await expect(page.locator('[data-shot="demo-action-billing-failure"]').getByText('Already triggered')).toBeVisible()
  await page.keyboard.press('Escape')
  // The monitor pages its anaesthetist groups at 20 across the whole practice: filter to Dr Ropata's.
  await page.locator('[data-shot="billing-monitor-filters"]').getByLabel('Anaesthetist').selectOption('39560')

  // Losa Tuilagi's hand-off waits for Xero in the sync queue (catch-up Phase 37); Hemi Walker billed; the List is not failed.
  const queue = page.locator('[data-shot="billing-xero-queue"]')
  await expect(queue.getByRole('button', { name: 'Retry now' })).toHaveCount(1)
  await expect(page.locator('[data-shot="monitor-waiting-for-xero"]')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Resolve & retry' })).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p9-02-monitor.png', fullPage: true })

  // Retry now hands it off once; no Contract is edited.
  await queue.getByRole('button', { name: 'Retry now' }).click()
  await page.waitForTimeout(400)
  await expect(queue.getByRole('button', { name: 'Retry now' })).toHaveCount(0)
  await expect(queue.getByText('Nothing is waiting for Xero.')).toBeVisible()
  await expect(page.locator('[data-shot="monitor-waiting-for-xero"]')).toHaveCount(0)
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
