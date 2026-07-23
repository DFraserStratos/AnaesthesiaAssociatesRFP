import { test, expect } from '@playwright/test'

/**
 * Phase 06 admin walkthrough — the one-day dashboard (grid + right rail),
 * internal notes, the list drawer, the office billing-setup edits (incl. the %
 * override and funder allocation), a single-card move, and list reassignment.
 * A working artifact for eyeballing plus light assertions that the office flows
 * reach the admin app.
 */

test('admin phase 06 walkthrough', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  // Day dashboard reproduces the mockup day.
  await expect(page.getByRole('heading', { name: /Tuesday 21 July 2026/ })).toBeVisible()
  await expect(page.getByText('Internal notes')).toBeVisible()
  await expect(page.getByText('Awaiting review')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a-01-day.png', fullPage: true })

  // Add an internal note.
  await page.getByRole('button', { name: '+ Add note' }).click()
  await page.getByPlaceholder('Add an internal note for this day').fill('Locum cover confirmed for Ngata PM.')
  await page.getByRole('button', { name: 'Save note' }).click()
  await page.waitForTimeout(200)
  await expect(page.getByText('Locum cover confirmed for Ngata PM.')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a-02-note.png', fullPage: true })

  // Open a booked block → the list drawer.
  await page.getByText("St George's").first().click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('button', { name: 'Edit list' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a-03-drawer.png', fullPage: true })

  // Open a card as the office → the billing-setup section.
  await page.getByRole('button', { name: 'Open', exact: true }).first().click()
  await page.waitForTimeout(300)
  await expect(page.getByText(/Office billing setup/).first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a-04-card.png', fullPage: true })

  // A % price override with a reason.
  await page.getByRole('button', { name: 'Price override', exact: true }).first().click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: '% adjust', exact: true }).click()
  await page.getByPlaceholder('-10').fill('-10')
  await page.getByPlaceholder('Why the price differs').fill('Goodwill discount, long-standing patient.')
  await page.screenshot({ path: 'visual/shots/a-05-override.png', fullPage: true })
  await page.getByRole('button', { name: 'Save override', exact: true }).click()
  await page.waitForTimeout(300)
  // The billing-setup summary reflects the saved % override.
  await expect(page.getByText(/Adjustment .*10%/).first()).toBeVisible()

  // Back to the day, navigate to Wed 22 for the advisory conflicts.
  await page.getByRole('button', { name: 'Day view', exact: true }).first().click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: '›', exact: true }).first().click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/a-06-wed.png', fullPage: true })
})

test('admin phase 06 list reassignment', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  // Open a booked block and reassign the list to a free colleague.
  await page.getByText("St George's").first().click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Reassign list', exact: true }).click()
  await page.waitForTimeout(200)
  await expect(page.getByText(/whose .* session is free/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a-07-reassign-pick.png', fullPage: true })
  await page.getByRole('button', { name: /Free (AM|PM) →/ }).first().click()
  await page.waitForTimeout(200)
  await expect(page.getByText(/Proposed reading/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a-08-reassign-confirm.png', fullPage: true })
  await page.getByRole('button', { name: 'Confirm reassignment', exact: true }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/a-09-reassigned.png', fullPage: true })
})

test('admin phase 06 office edits a SUBMITTED card', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  // Navigate to Mon 20 (Morrison's SUBMITTED list) and open it.
  await page.locator('input[type="date"]').fill('2026-07-20')
  await page.waitForTimeout(300)
  await page.getByText(/Mr S\. Tan/).first().click()
  await page.waitForTimeout(300)
  await expect(page.getByText(/Mon 20 Jul .* SUBMITTED/)).toBeVisible()
  await page.getByRole('button', { name: 'Open', exact: true }).first().click()
  await page.waitForTimeout(300)
  // The office can cancel a card on a SUBMITTED list (checklist item 7); this
  // affordance is hidden for the anaesthetist and was DRAFT-only before the fix.
  await expect(page.getByRole('button', { name: /Cancel card/ })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a-10-submitted-card.png', fullPage: true })
})
