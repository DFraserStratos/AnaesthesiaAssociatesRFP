import { test, expect } from '@playwright/test'

/**
 * Phase 07 admin walkthrough — the authorisation review queue + sanity-check
 * review screen (real calculator figures, RFP-grounded flags), the authorise
 * choreography, master-data editing (anaesthetist unit value, add hospital with
 * its auto default Type 1, the protected default-contract lock), and the audit
 * viewer. A working artifact for eyeballing plus light assertions.
 */

test('admin phase 07 review + authorise', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  // Into the review queue.
  await page.getByRole('button', { name: /Review queue/ }).first().click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Review queue' })).toBeVisible()
  await expect(page.getByText('Handed to billing')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a7-01-queue.png', fullPage: true })

  // Open Morrison's submitted list → the sanity-check review screen.
  await page.getByRole('button', { name: /Morrison/ }).first().click()
  await page.waitForTimeout(300)
  await expect(page.getByText('Total units')).toBeVisible()
  await expect(page.getByText(/to check before authorising/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a7-02-review.png', fullPage: true })

  // Per-card History reconstructs the trail (card + its procedures/lines).
  await page.getByRole('button', { name: 'History', exact: true }).first().click()
  await page.waitForTimeout(200)
  await expect(page.getByText('Card history')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a7-08-history.png', fullPage: true })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)

  // Log a phone note (no return-to-anaesthetist channel exists).
  await page.getByRole('button', { name: 'Log phone note' }).click()
  await page.waitForTimeout(200)
  await page.locator('textarea').fill('Confirmed the missing reference with St George\'s.')
  await page.getByRole('button', { name: 'Log note' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText(/Confirmed the missing reference/)).toBeVisible()

  // Authorise for billing → confirm → choreography.
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await page.waitForTimeout(400)
  await expect(page.getByText('List authorised · locked for billing')).toBeVisible()
  await expect(page.getByText('Authorised · locked', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a7-03-authorised.png', fullPage: true })
})

test('admin phase 07 master data', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  await page.getByRole('button', { name: 'Master data' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Master data' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Anaesthetists' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a7-04-masters.png', fullPage: true })

  // Edit an anaesthetist's unit value.
  await page.getByRole('button', { name: 'Edit' }).first().click()
  await page.waitForTimeout(200)
  await page.getByLabel('Unit value ($)').fill('55')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('55.00').first()).toBeVisible()

  // Contracts — the protected default lock.
  await page.getByRole('button', { name: 'Contracts', exact: true }).click()
  await page.waitForTimeout(200)
  await expect(page.getByText(/default Type 1 contracts are protected/)).toBeVisible()
  await page.getByRole('button', { name: 'Edit' }).first().click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'visual/shots/a7-05-contract.png', fullPage: true })
  await page.keyboard.press('Escape')

  // Hospitals — add one, its default Type 1 is created.
  await page.getByRole('button', { name: 'Hospitals & holidays' }).click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'Add hospital' }).click()
  await page.waitForTimeout(200)
  await page.getByLabel('Hospital name').fill('Rangiora Day Surgery')
  await page.getByRole('button', { name: 'Add hospital' }).last().click()
  await page.waitForTimeout(300)
  await expect(page.getByText(/default Type 1 contract .* now appears in Contracts/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a7-06-add-hospital.png', fullPage: true })
})

test('admin phase 07 audit viewer', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  await page.getByRole('button', { name: 'Audit', exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Audit' })).toBeVisible()
  await expect(page.getByText(/entries/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a7-07-audit.png', fullPage: true })
})
