import { expect, test } from '@playwright/test'

/**
 * Phase 12 — the finished demo control panel. A real-browser click-through of
 * the new controls (scenario jumps, procedure-day jump, PDF arrival, automated
 * jobs) that also asserts the console stays clean across the interaction.
 */

test('control panel: scenario jump, procedure-day jump, PDF ingest and jobs run clean', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))

  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')

  // The four labelled groups are present.
  await expect(page.getByText('Clock & reset', { exact: true })).toBeVisible()
  await expect(page.getByText('Scenario jumps · S1 to S5', { exact: true })).toBeVisible()
  await expect(page.getByText('Booking & integration events', { exact: true })).toBeVisible()
  await expect(page.getByText('Billing, money & exceptions', { exact: true })).toBeVisible()

  // Procedure-day jump advances the clock to 28 July.
  await page.getByRole('button', { name: /Procedure day/ }).click()
  await expect(page.getByText(/28 July 2026/)).toBeVisible()

  // S1 scenario jump: Jump -> Confirm -> result message + onward nav.
  await page.getByRole('button', { name: 'Jump', exact: true }).first().click()
  await page.getByRole('button', { name: 'Confirm jump' }).click()
  await expect(page.getByText(/Sarah Mitchell/)).toBeVisible()
  await page.getByRole('button', { name: 'Go to Mobile app' }).click()
  await expect(page).toHaveURL(/\/mobile/)

  // PDF arrival: ingest a row, expect a created/updated confirmation.
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Ingest PDF row' }).click()
  await expect(page.getByText(/Brian Holt/)).toBeVisible()

  // Automated jobs: run the reconciliation poll.
  await page.getByRole('button', { name: 'Run reconciliation poll' }).click()
  await expect(page.getByText(/Reconciliation poll/)).toBeVisible()

  expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([])
})
