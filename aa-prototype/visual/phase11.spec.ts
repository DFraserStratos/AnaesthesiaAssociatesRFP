import { expect, test } from '@playwright/test'

/**
 * Phase 11 smoke — the integration surfaces render and their core interactions
 * work end to end in the real app (no crashes): the simulator translates and
 * applies a message, and the admin monitor's tabs + validators respond.
 */

test('integration simulator replays a message and shows the schedule effect', async ({ page }) => {
  await page.goto('/demo/integrations')
  await page.waitForLoadState('networkidle')
  // The default selected message is the headline S12 create; replay it.
  await page.getByRole('button', { name: 'Replay message' }).click()
  await expect(page.getByText(/Processed/).first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/phase11-simulator.png', fullPage: true })
})

test('admin Integrations monitor renders its tabs and the validators respond', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Integrations', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible()

  // Feed config tab shows the editable mappings.
  await page.getByRole('button', { name: 'Feed config' }).click()
  await expect(page.getByText('Christchurch Public').first()).toBeVisible()

  // Surgeon PDFs tab opens a facsimile + rows.
  await page.getByRole('button', { name: 'Surgeon PDFs' }).click()
  await page.getByRole('button', { name: 'Open' }).first().click()
  await expect(page.getByText('Ingest all rows')).toBeVisible()
  await page.getByRole('button', { name: '‹ Back to inbox' }).click()

  // Validators tab gives a verdict.
  await page.getByRole('button', { name: 'Validators' }).click()
  await page.getByPlaceholder(/ZAA0067/).fill('ZAA0067')
  await expect(page.getByText('Valid NHI')).toBeVisible()
  await page.getByPlaceholder('e.g. 21111').fill('99999')
  await expect(page.getByText("Outside this demo's curated subset")).toBeVisible()
  await page.screenshot({ path: 'visual/shots/phase11-monitor.png', fullPage: true })
})
