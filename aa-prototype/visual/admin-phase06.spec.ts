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
  const rightRailLeft = await page.getByTestId('admin-right-rail').evaluate((element) => element.getBoundingClientRect().left)
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
  const listDrawerLeft = await page.getByTestId('admin-list-drawer').evaluate((element) => element.getBoundingClientRect().left)
  expect(listDrawerLeft).toBe(rightRailLeft)
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

test('S2 phone-advice lookup fills and saves the complete booking', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  const sharmaRow = page.getByText('Sharma, Priya', { exact: true }).locator('..')
  await sharmaRow.getByRole('button').nth(1).click()
  const editList = page.getByRole('button', { name: 'Edit list', exact: true })
  const bookPhoneAdvice = page.getByRole('button', { name: 'Book (phone advice)', exact: true })
  const history = page.getByRole('button', { name: 'History', exact: true })
  const [editBox, bookBox, historyBox] = await Promise.all([
    editList.boundingBox(),
    bookPhoneAdvice.boundingBox(),
    history.boundingBox(),
  ])
  expect(editBox?.y).toBe(bookBox?.y)
  expect(historyBox?.y).toBe(bookBox?.y)
  expect(bookBox?.width ?? 0).toBeGreaterThan(editBox?.width ?? 0)
  await page.screenshot({ path: 'visual/shots/a-11-phone-drawer.png', fullPage: true })
  await bookPhoneAdvice.click()
  await page.getByLabel('Hospital').selectOption({ label: "St George's" })
  await page.getByLabel('Surgeon').selectOption({ label: 'Mr T. Hale' })
  await page.getByRole('button', { name: 'Continue to add card' }).click()
  await page.getByRole('button', { name: 'Enter manually' }).click()

  const lookup = page.getByRole('button', { name: 'Look up' })
  await expect(lookup).toBeEnabled()
  await lookup.click()

  await expect(page.getByLabel('NHI')).toHaveValue('DEM1239')
  await expect(page.getByLabel('Name')).toHaveValue('Demo Patient')
  await expect(page.getByLabel('Date of birth')).toHaveValue('1990-01-01')
  await expect(page.getByLabel('Phone')).toHaveValue('021 555 0190')
  await expect(page.getByLabel('Procedure code')).toHaveValue('20950')
  await expect(page.getByLabel('Operation')).toHaveValue('Appendicectomy, laparoscopic')
  await expect(page.getByLabel('Scheduled time')).toHaveValue('15:00')
  await expect(page.getByLabel('Insurer (optional)')).toHaveValue('I-NIB')
  await expect(page.getByLabel('Billing reference')).toHaveValue('STG-HALE-2107')
  await expect(page.getByText(/Patient and booking details pre-filled/)).toBeVisible()

  await page.getByRole('button', { name: 'Save card' }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByText('Demo Patient', { exact: true })).toBeVisible()
})

test('generic manual-card lookup still requires an NHI', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.getByText('Add a card', { exact: false }).first().click()
  await page.getByText('Enter manually', { exact: false }).first().click()

  await expect(page.getByRole('button', { name: 'Look up' })).toBeDisabled()
  await expect(page.getByLabel('Name')).toHaveValue('')
  await expect(page.getByLabel('Procedure code')).toHaveValue('')
})
