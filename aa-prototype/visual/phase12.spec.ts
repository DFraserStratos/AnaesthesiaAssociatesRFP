import { expect, test } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Phase 12 — the demo control panel, now the index (catch-up Phase 14). A
 * real-browser click-through of the scenario jumps and procedure-day jump, then
 * the re-homed PDF arrival (Admin Integrations, Surgeon PDFs tab) and job run
 * (Billing monitor) from the harness bar's Demo actions, asserting the console
 * stays clean across the interaction.
 */

test('control panel: scenario jump, procedure-day jump, PDF ingest and jobs run clean', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))

  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')

  // The three labelled groups are present, and no trigger buttons remain.
  await expect(page.getByText('Clock & reset', { exact: true })).toBeVisible()
  await expect(page.getByText('Scenario jumps · S1 to S5', { exact: true })).toBeVisible()
  await expect(page.getByText('Demo actions by screen', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ingest PDF row' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Trigger failure' })).toHaveCount(0)

  // Procedure-day jump advances the clock to 28 July.
  await page.getByRole('button', { name: /Procedure day/ }).click()
  await expect(page.getByText(/28 July 2026/)).toBeVisible()

  // S1 scenario jump now resets to the clean live-arrival state.
  await page.getByRole('button', { name: 'Jump', exact: true }).first().click()
  await page.getByRole('button', { name: 'Confirm jump' }).click()
  await expect(page.getByText(/clean S1 state/)).toBeVisible()
  await page.getByRole('button', { name: 'Go to Mobile app' }).click()
  await expect(page).toHaveURL(/\/mobile/)

  // PDF arrival: from Admin Integrations, Surgeon PDFs tab, ingest a row.
  await page.goto('/admin/integrations')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="demo-actions"]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Surgeon PDFs' }).click()
  expect(await runDemoAction(page, 'ingest-pdf-row', { close: true })).toMatch(/Brian Holt/)

  // Automated jobs: run the reconciliation poll from the Billing monitor.
  await page.goto('/admin/billing')
  await page.waitForLoadState('networkidle')
  expect(await runDemoAction(page, 'run-reconciliation-poll')).toMatch(/Reconciliation poll/)

  expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([])
})
