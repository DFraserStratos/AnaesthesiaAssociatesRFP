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
  await page.getByRole('button', { name: /^Lists/ }).first().click()
  await page.locator('[data-lists-tab="to-authorise"]').click()
  await page.waitForTimeout(300)
  await expect(page.locator('[data-lists-page="to-authorise"]')).toBeVisible()
  // Phase 08 replaced the "Handed to billing" placeholder with the live panel, now Recently authorised.
  await expect(page.getByText('Recently authorised')).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Anaesthetist · List' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'List date' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Bookings' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Submitted' })).toBeVisible()
  const queueWidth = await page.getByTestId('review-queue-screen').evaluate((element) => element.getBoundingClientRect().width)
  const tableWidth = await page.getByTestId('review-queue-table-shell').evaluate((element) => element.getBoundingClientRect().width)
  const recentlyBilledWidth = await page.getByTestId('review-queue-recently-billed').evaluate((element) => element.getBoundingClientRect().width)
  expect(queueWidth).toBeGreaterThan(1080)
  // Recently billed sits in the page's rail, beside the table.
  expect(recentlyBilledWidth).toBeLessThan(tableWidth)
  await expect(page.locator('[data-page-rail]').getByTestId('review-queue-recently-billed')).toBeVisible()
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

  // Master data and Audit sit under More at the foot of the side nav.
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('button', { name: 'More' }).click()
  await page.getByRole('button', { name: 'Master data' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Master data' })).toBeVisible()
  // Master data opens on Hospitals since build plan Phase 53; anaesthetists are in People.
  await expect(page.getByRole('heading', { name: 'Hospitals & holidays' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a7-04-masters.png', fullPage: true })

  // The RVG groups (catch-up Phase 19): rows under their anatomy headings; three rows share T2 (the guide's two and AA's own).
  await page.locator('[data-masters-view=rvgGroups]').click()
  await expect(page.getByRole('heading', { name: 'RVG groups' })).toBeVisible()
  await expect(page.locator('[data-rvg-anatomy=Head]')).toBeVisible()
  await expect(page.locator('[data-shot=masters-rvg-groups] tr[data-rvg-group-code=T2]')).toHaveCount(3)
  await page.screenshot({ path: 'visual/shots/a7-04-masters-rvg-groups.png', fullPage: true })
  await page.locator('nav[aria-label="Admin"]').getByRole('button', { name: 'People' }).click()

  // Edit an anaesthetist's unit value: on the record's Rate and tier card (build plan Phase 50), Edit then Save.
  await page.locator('tr[data-anaesthetist]').first().locator('.aa-table-entity-link').click()
  const rateTier = page.locator('[data-shot="rate-tier-card"]')
  await rateTier.getByRole('button', { name: 'Edit rate and offer order' }).click()
  await rateTier.getByLabel('Rate per unit ($)').fill('55')
  await rateTier.getByRole('button', { name: 'Save' }).click()
  await expect(rateTier.locator('[data-shot="rate-tier-rate"]')).toContainText('$55.00')
  await page.goto('/admin/masters?view=anaesthetists')
  await expect(page.getByText('$55.00').first()).toBeVisible()

  // Parties (catch-up Phase 18): a tab of the Contracts section since build plan Phase 48, grouped by kind;
  // Master data keeps no Parties or Insurers view and points across.
  await page.goto('/admin/masters')
  await expect(page.locator('[data-masters-view="parties"]')).toHaveCount(0)
  await expect(page.locator('[data-shot="masters-moved-note"]')).toContainText('Funding tags are in Contracts')
  await page.goto('/admin/contracts/parties')
  const parties = page.locator('[data-shot="parties"]')
  await expect(parties.locator('tr[data-party="PY-NIB"]').getByText('Email')).toBeVisible()
  await expect(parties.locator('tr[data-party-group="funder"]')).toContainText('Funders')
  await expect(parties.locator('tr[data-party="PY-ACC"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a7-05a-parties.png', fullPage: true })

  // Contracts: No contract · RVG first, a search by AA code, and the editor.
  await page.locator('[data-contracts-tab="contracts"]').click()
  await expect(page).toHaveURL(/\/admin\/contracts$/)
  const catalogue = page.locator('[data-shot="contract-catalogue"]')
  await expect(catalogue.locator('tr[data-contract]').first()).toContainText('AA-RVG')
  await page.getByLabel('Search by name, code or AA code').fill('COS-001')
  await expect(catalogue.locator('tr[data-contract]')).toHaveCount(1)
  await page.screenshot({ path: 'visual/shots/a7-05b-contract-search.png', fullPage: true })
  await page.getByLabel('Search by name, code or AA code').fill('')
  // New contract is its own page (build plan Phase 46): a refusal from the guard shows in place.
  await page.getByRole('button', { name: 'New contract' }).click()
  await expect(page).toHaveURL(/\/admin\/contracts\/new$/)
  const form = page.locator('[data-shot="contract-new-page"]')
  await expect(form.locator('[data-shot="new-contract-on-save"]')).toContainText("assigned from the holder's prefix")
  await form.locator('[data-shot="contract-links"] select').selectOption({ label: 'Christchurch Eye Surgery' })
  await form.getByRole('button', { name: 'Create contract' }).click()
  await expect(form.getByRole('alert')).toContainText('A Contract needs a name.')
  await form.getByRole('alert').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/a7-05c-contract-refusal.png', fullPage: true })
  await form.getByRole('button', { name: 'Cancel' }).click()
  await expect(page).toHaveURL(/\/admin\/contracts$/)
  // Back to Master data from the Contracts section.
  // Master data and Audit sit under More at the foot of the side nav.
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('button', { name: 'More' }).click()
  await page.getByLabel('Admin').getByRole('button', { name: 'Master data' }).click()

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

  // Master data and Audit sit under More at the foot of the side nav.
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('button', { name: 'More' }).click()
  await page.getByRole('button', { name: 'Audit', exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Audit' })).toBeVisible()
  // The count chip beside the filters, anchored. The seeded audit graph is now
  // larger than one page (catch-up Phase 43 replaced the 500-row cap with pages of 100; the count
  // carries thousands separators).
  await expect(page.getByText(/^[\d,]+ entries$/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a7-07-audit.png', fullPage: true })
})
