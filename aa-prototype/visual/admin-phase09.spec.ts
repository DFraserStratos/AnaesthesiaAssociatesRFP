import { test, expect } from '@playwright/test'

/**
 * Phase 09 admin walkthrough — the billing monitor (trigger a failure, see
 * per-card isolation, resolve & retry) and the pre-payment gate surfaced on a
 * card (the outstanding banner + the office raise / override actions). A working
 * artifact for eyeballing plus light assertions.
 */

test('admin phase 09: billing monitor failure, resolve and retry', async ({ page }) => {
  // Trigger the seeded billing failure from the demo control panel.
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Trigger failure' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText(/rating failure|billing monitor/i).first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p9-01-trigger.png', fullPage: true })

  // Into the Admin app billing monitor.
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /Billing monitor/ }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Billing monitor' })).toBeVisible()
  // The failed COS card and its resolve action are present; the sibling billed.
  await expect(page.getByRole('button', { name: /Resolve/ }).first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p9-02-monitor.png', fullPage: true })

  // Resolve & retry recovers the failed card.
  await page.getByRole('button', { name: /Resolve/ }).first().click()
  await page.waitForTimeout(400)
  await expect(page.getByRole('button', { name: /Resolve/ })).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p9-03-retried.png', fullPage: true })
})

test('admin phase 09: pre-payment gate on a card', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  // Navigate the day view forward to Friday 24 July (Tue 21 -> Fri 24).
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: '›', exact: true }).first().click()
    await page.waitForTimeout(200)
  }
  await expect(page.getByRole('heading', { name: /Friday 24 July 2026/ })).toBeVisible()
  // The day grid legend carries the pre-payment indicator key.
  await expect(page.getByText('Pre-payment flagged')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p9-04-friday.png', fullPage: true })

  // Open Souter's AM list (Forte / Ms G. Lim) and its card → the gate banner.
  await page.getByText('Ms G. Lim', { exact: false }).first().click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Open', exact: true }).first().click()
  await page.waitForTimeout(300)
  await expect(page.getByText('Pre-payment required', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Raise pre-procedure invoice/ })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p9-05-gate.png', fullPage: true })
})
