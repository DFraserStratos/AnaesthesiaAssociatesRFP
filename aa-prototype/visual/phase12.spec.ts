import { expect, test } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Phase 12 — the demo control panel, now the index (catch-up Phase 14). A
 * real-browser click-through of the scenario jumps and their beat links
 * (catch-up Phase 44) and the procedure-day jump, then
 * the PDF arrival (Admin Intake, PDF lists) and job run
 * (Finances · Xero) from the harness bar's Demo actions, asserting the console
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
  await expect(page.getByText(/1 December 2026/)).toBeVisible()

  // S1 scenario jump (catch-up Phase 44): reset only, then the seven beats in order, each a link to
  // its screen with its steps beside it; a beat whose target does not exist yet waits, disabled, its
  // label saying for what.
  await page.getByRole('button', { name: 'Jump', exact: true }).first().click()
  await page.locator('[data-shot="scenario-confirm"]').click()
  const result = page.locator('[data-shot="scenario-result"]')
  await expect(result).toContainText('Reset to the pristine seed; nothing staged. Follow the beats below in order.')
  await expect(result.locator('[data-shot="scenario-beat-2-steps"]')).toHaveText(
    "Demo actions → Import hospital file (St George's), then Create Booking on Sarah Mitchell's row",
  )
  await expect(page.getByText(/^Tuesday 24 November 2026 · /)).toBeVisible()
  await expect(result.locator('button[data-shot^="scenario-beat-"]')).toHaveCount(7)
  await expect(result.locator('[data-shot="scenario-beat-4"]')).toHaveText('Beat 4 · Admin Booking, after Create Booking')
  await expect(result.locator('[data-shot="scenario-beat-4"]')).toBeDisabled()
  await result.locator('[data-shot="scenario-beat-1"]').click()
  await expect(page).toHaveURL(/\/mobile\/more$/)
  // The beat links outlive the page (Phase 44 QA): back on the Control Panel they are still there.
  await page.goBack()
  await expect(page).toHaveURL(/\/demo\/control$/)
  await expect(page.locator('[data-shot="scenario-result"] button[data-shot^="scenario-beat-"]')).toHaveCount(7)

  // PDF arrival (catch-up Phase 34): Admin Intake, PDF lists, correct the flagged NHI and send to matching.
  await page.goto('/admin/intake/pdfs')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="demo-actions"]')).toHaveCount(1)
  await page.locator('[data-shot="pdf-inbox"] tbody tr').first().click()
  await page.locator('[data-shot="pdf-row-2"]').getByLabel('NHI').fill('ZAA0067')
  await page.locator('[data-shot="pdf-row-2-apply"]').click()
  await page.locator('[data-shot="pdf-send"]').click()
  await expect(page.getByText(/Sent to matching: 3 rows/)).toBeVisible()

  // Automated jobs: run the reconciliation poll from Finances · Xero.
  await page.goto('/admin/finances/xero')
  await page.waitForLoadState('networkidle')
  expect(await runDemoAction(page, 'run-reconciliation-poll')).toMatch(/Reconciliation poll/)

  expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([])
})
