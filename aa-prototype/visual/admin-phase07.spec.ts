import { test, expect } from '@playwright/test'

/**
 * Phase 07 admin walkthrough — the authorisation review queue + sanity-check
 * review screen (real calculator figures, RFP-grounded flags), the authorise
 * choreography, master-data editing (anaesthetist unit value; catch-up Phase 18's
 * Parties, the Contracts search and editor with a save-guard refusal, and adding
 * a hospital, which adds its Party and no Contract), and the audit viewer. A working artifact for eyeballing plus light assertions.
 */

test('admin phase 07 review + authorise', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  // Into the review queue.
  await page.getByRole('button', { name: /Review queue/ }).first().click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Review queue' })).toBeVisible()
  // Phase 08 replaced the "Handed to billing" placeholder with the live panel.
  await expect(page.getByText('Recently billed')).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Anaesthetist' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'List', exact: true })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'List date' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Bookings' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Submitted' })).toBeVisible()
  const queueWidth = await page.getByTestId('review-queue-screen').evaluate((element) => element.getBoundingClientRect().width)
  const tableWidth = await page.getByTestId('review-queue-table-shell').evaluate((element) => element.getBoundingClientRect().width)
  const recentlyBilledWidth = await page.getByTestId('review-queue-recently-billed').evaluate((element) => element.getBoundingClientRect().width)
  expect(queueWidth).toBeGreaterThan(1080)
  expect(Math.abs(tableWidth - recentlyBilledWidth)).toBeLessThanOrEqual(1)
  await page.screenshot({ path: 'visual/shots/a7-01-queue.png', fullPage: true })

  // Open Morrison's submitted list → the sanity-check review screen.
  await page.getByRole('row').filter({ hasText: /Morrison/ }).getByRole('button', { name: /Review/ }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('Total units')).toBeVisible()
  await expect(page.getByText(/to check before authorising/)).toBeVisible()
  const detailWidth = await page.getByTestId('review-detail-screen').evaluate((element) => element.getBoundingClientRect().width)
  expect(detailWidth).toBeGreaterThan(1080)
  await expect(page.getByRole('columnheader', { name: 'B · T · M' })).toHaveCSS('white-space', 'nowrap')
  await expect(page.getByTestId('review-btm-value').first()).toHaveCSS('white-space', 'nowrap')
  await page.screenshot({ path: 'visual/shots/a7-02-review.png', fullPage: true })

  // Per-booking History reconstructs the trail (booking + its procedures/lines).
  await page.getByRole('button', { name: 'History', exact: true }).first().click()
  await page.waitForTimeout(200)
  await expect(page.getByText('Booking history')).toBeVisible()
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

  // The RVG groups (catch-up Phase 19): rows under their anatomy headings; three rows share T2 (the guide's two and AA's own).
  await page.locator('[data-masters-view=rvgGroups]').click()
  await expect(page.getByRole('heading', { name: 'RVG groups' })).toBeVisible()
  await expect(page.locator('[data-rvg-anatomy=Head]')).toBeVisible()
  await expect(page.locator('[data-shot=masters-rvg-groups] tr[data-rvg-group-code=T2]')).toHaveCount(3)
  await page.screenshot({ path: 'visual/shots/a7-04-masters-rvg-groups.png', fullPage: true })
  await page.getByRole('button', { name: 'Anaesthetists' }).click()

  // Edit an anaesthetist's unit value.
  await page.getByRole('button', { name: 'Edit' }).first().click()
  await page.waitForTimeout(200)
  await page.getByLabel('Unit value ($)').fill('55')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('55.00').first()).toBeVisible()

  // Parties (catch-up Phase 18): kinds, billing names and delivery; no Insurers tab.
  await page.getByRole('button', { name: 'Parties', exact: true }).click()
  const parties = page.locator('[data-shot="parties"]')
  await expect(parties.locator('tr', { hasText: 'nib' }).getByText('Email')).toBeVisible()
  await expect(parties.locator('tr', { hasText: 'ACC' }).first().getByText('Funder')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Insurers', exact: true })).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/a7-05a-parties.png', fullPage: true })

  // Contracts: No contract · RVG first, a search by AA code, and the editor.
  await page.getByRole('button', { name: 'Contracts', exact: true }).click()
  const catalogue = page.locator('[data-shot="contract-catalogue"]')
  await expect(catalogue.locator('tr[data-contract]').first()).toContainText('AA-RVG')
  await page.getByLabel('Search by name, code or AA code').fill('COS-001')
  await expect(catalogue.locator('tr[data-contract]')).toHaveCount(1)
  await page.screenshot({ path: 'visual/shots/a7-05b-contract-search.png', fullPage: true })
  await page.getByLabel('Search by name, code or AA code').fill('')
  await page.getByRole('button', { name: 'New contract' }).click()
  const panel = page.locator('[data-shot="contract-detail"]')
  await expect(panel.getByText('Assigned on save')).toBeVisible()
  await panel.getByLabel('Name', { exact: true }).fill('Prepaid RVG test')
  await panel.locator('select').first().selectOption({ label: 'Christchurch Eye Surgery' })
  await panel.locator('[data-shot="contract-settings"]').getByRole('button', { name: 'Yes', exact: true }).first().click()
  await panel.getByRole('button', { name: 'Create contract' }).click()
  await expect(panel.getByRole('alert')).toContainText('A prepaid Contract cannot be priced from RVG units')
  await panel.getByRole('alert').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/a7-05c-contract-refusal.png', fullPage: true })
  await panel.getByRole('button', { name: 'Cancel' }).click()

  // Hospitals: adding one adds its Party, and no Contract.
  await page.getByRole('button', { name: 'Hospitals & holidays' }).click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'Add hospital' }).click()
  await page.waitForTimeout(200)
  await page.getByLabel('Hospital name').fill('Rangiora Day Surgery')
  await page.getByRole('button', { name: 'Add hospital' }).last().click()
  await page.waitForTimeout(300)
  await expect(page.getByText(/Its Party now appears in Parties/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a7-06-add-hospital.png', fullPage: true })
})

test('admin phase 07 audit viewer', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  await page.getByRole('button', { name: 'Audit', exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Audit' })).toBeVisible()
  // The count chip beside the filters, anchored. The seeded audit graph is now
  // larger than the viewer's 500-row cap, so the cap notice under the table also
  // ends in "entries" and a bare /entries/ matches both.
  await expect(page.getByText(/^\d+ entries$/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a7-07-audit.png', fullPage: true })
})
