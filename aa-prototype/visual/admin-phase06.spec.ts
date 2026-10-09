import { test, expect } from '@playwright/test'

/**
 * Phase 06 admin walkthrough — the one-day dashboard (grid + right rail),
 * internal notes, the list drawer, the office billing-setup edits (incl. the %
 * override and funder allocation), a single-booking move, and list reassignment.
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
  await page.locator('[data-list-id="L-34821-2026-07-21-AM"]').click() // Souter's St George's AM (the band and rail card also name St George's since catch-up Phase 31)
  await page.waitForTimeout(300)
  await expect(page.getByRole('button', { name: 'Edit list' })).toBeVisible()
  const listDrawerLeft = await page.getByTestId('admin-list-drawer').evaluate((element) => element.getBoundingClientRect().left)
  expect(listDrawerLeft).toBe(rightRailLeft)
  await page.screenshot({ path: 'visual/shots/a-03-drawer.png', fullPage: true })

  // Open a booking as the office → the billing-setup section.
  await page.getByRole('button', { name: 'Open', exact: true }).first().click()
  await page.waitForTimeout(300)
  await expect(page.getByText(/Office billing setup/).first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a-04-booking.png', fullPage: true })

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

  // Back to the day, navigate to Wed 22 for its conflicts (catch-up Phase 30: real facts).
  await page.getByRole('button', { name: 'Day view', exact: true }).first().click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: '›', exact: true }).first().click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/a-06-wed.png', fullPage: true })
})

test('admin mini calendar supports keyboard date navigation', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  const calendar = page.getByTestId('admin-right-rail')
  const selectedDay = calendar.getByRole('button', { name: 'Tuesday 21 July 2026', exact: true })
  await expect(selectedDay).toHaveAttribute('aria-current', 'date')
  await expect(selectedDay).toHaveAttribute('aria-pressed', 'true')
  await expect(selectedDay).toHaveAttribute('tabindex', '0')

  await selectedDay.focus()
  expect(await selectedDay.evaluate((element) => getComputedStyle(element).boxShadow)).toContain('rgb(169, 30, 62)')
  await page.screenshot({ path: 'visual/shots/a-12-calendar-keyboard.png', fullPage: true })
  await page.keyboard.press('ArrowRight')
  const nextDay = calendar.getByRole('button', { name: 'Wednesday 22 July 2026', exact: true })
  await expect(nextDay).toBeFocused()
  await expect(nextDay).toHaveAttribute('aria-pressed', 'false')
  expect(await nextDay.evaluate((element) => getComputedStyle(element).boxShadow)).toContain('rgb(169, 30, 62)')
  await expect(page.getByRole('heading', { name: /Tuesday 21 July 2026/ })).toBeVisible()

  await page.keyboard.press('ArrowDown')
  await expect(calendar.getByRole('button', { name: 'Wednesday 29 July 2026', exact: true })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(calendar.getByRole('button', { name: 'Monday 27 July 2026', exact: true })).toBeFocused()
  await page.keyboard.press('End')
  const nextMonthDay = calendar.getByRole('button', { name: 'Sunday 2 August 2026', exact: true })
  await expect(nextMonthDay).toBeFocused()
  await expect(page.getByRole('group', { name: /^August 2026 calendar/ })).toBeVisible()

  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/admin\/day\/2026-08-02$/)
  await expect(page.getByRole('heading', { name: /Sunday 2 August 2026/ })).toBeVisible()
  await expect(nextMonthDay).toHaveAttribute('aria-pressed', 'true')
  await expect(nextMonthDay).toHaveCSS('border-color', 'rgb(169, 30, 62)')

  await page.keyboard.press('PageUp')
  await expect(calendar.getByRole('button', { name: 'Thursday 2 July 2026', exact: true })).toBeFocused()
  await page.keyboard.press('Shift+PageDown')
  const nextYearDay = calendar.getByRole('button', { name: 'Friday 2 July 2027', exact: true })
  await expect(nextYearDay).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page).toHaveURL(/\/admin\/day\/2027-07-02$/)
  await expect(page.getByRole('heading', { name: /Friday 2 July 2027/ })).toBeVisible()
})

test('admin phase 06 list reassignment', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.locator('input[type="date"]').fill('2026-07-22')
  await page.waitForTimeout(300)

  // S2 Beat 3: Rutherford phoned in sick (the office recorded Wed 22 AM as
  // Unavailable, catch-up Phase 30). His availability conflict must not follow
  // the List into Sharma's open AM session; the vacated session keeps its
  // Unavailable status by default ("Keep as is").
  const rutherfordRow = page.getByText('Rutherford, James', { exact: true }).locator('..')
  await rutherfordRow.getByText('Christchurch Eye Surgery', { exact: true }).click()
  await expect(page.getByText(/Dr Rutherford is marked .+ for this session\. Note: unwell, short notice\./)).toBeVisible()
  await page.getByRole('button', { name: 'Reassign list', exact: true }).click()
  await expect(page.getByText(/whose .* session is free/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a-07-reassign-pick.png', fullPage: true })
  await page.getByRole('button', { name: /Sharma, Priya.*Free AM/ }).click()
  await expect(page.getByText(/stays Unavailable unless you mark it otherwise/)).toBeVisible()
  await expect(page.getByText(/Proposed reading|regenerat|absorb/i)).toHaveCount(0)
  const vacated = page.locator('select[data-shot="reassign-vacated"]')
  await expect(vacated).toHaveValue('unavailable')
  await page.screenshot({ path: 'visual/shots/a-08-reassign-confirm.png', fullPage: true })
  await page.getByRole('button', { name: 'Confirm reassignment', exact: true }).click()
  await expect(page.getByTestId('list-reassignment-overlay')).toContainText('List reassigned')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/a-09-reassign-success.png', fullPage: true })
  await expect(page.getByTestId('list-reassignment-overlay')).toHaveCount(0)

  const sharmaRow = page.getByText('Sharma, Priya', { exact: true }).locator('..')
  await sharmaRow.getByText('Christchurch Eye Surgery', { exact: true }).click()
  const drawer = page.getByTestId('admin-list-drawer')
  await expect(drawer.getByText('Sharma, Priya', { exact: true })).toBeVisible()
  await expect(drawer.getByText('Anaesthetist unavailable', { exact: true })).toHaveCount(0)
  await expect(drawer.getByText(/is marked .+ for this session/)).toHaveCount(0)
  await drawer.getByRole('button', { name: 'History', exact: true }).click()
  await expect(page.getByText('List reassigned', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a-10-reassigned.png', fullPage: true })
  await page.keyboard.press('Escape')
  await page.goto('/admin/day/2026-07-22')
  await page.waitForLoadState('networkidle')
  // Rutherford's vacated AM session is now Unavailable, an empty session with no List.
  const vacatedBlock = page.locator('button[data-slot-id="S-29104-2026-07-22-AM"]')
  await expect(vacatedBlock).toContainText('Unavailable')
  await expect(vacatedBlock).not.toHaveAttribute('data-list-id', /.+/)
})

test('admin phase 06 office edits a SUBMITTED booking', async ({ page }) => {
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
  // The office can cancel a booking on a SUBMITTED list (checklist item 7); this
  // affordance is hidden for the anaesthetist and was ACTIVE-only before the fix.
  await expect(page.getByRole('button', { name: /Cancel booking/ })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a-10-submitted-booking.png', fullPage: true })
})

test('S2 phone-advice lookup fills and saves the complete booking', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  // Sharma's free Tue 21 PM is an empty session (catch-up Phase 28): its drawer
  // offers Assign List (the teal primary), then Book (phone advice), Edit times
  // and History, and prints no List state.
  await page.locator('button[data-slot-id="S-41267-2026-07-21-PM"]').click()
  const drawer = page.getByTestId('admin-list-drawer')
  await expect(drawer).toHaveAttribute('data-slot-id', 'S-41267-2026-07-21-PM')
  await expect(drawer.getByText(/ACTIVE|DRAFT|\bOpen\b/)).toHaveCount(0)
  const assignList = drawer.getByRole('button', { name: 'Assign List', exact: true })
  const bookPhoneAdvice = drawer.getByRole('button', { name: 'Book (phone advice)', exact: true })
  const editTimes = drawer.getByRole('button', { name: 'Edit times', exact: true })
  const history = drawer.getByRole('button', { name: 'History', exact: true })
  const [assignBox, bookBox, timesBox, historyBox] = await Promise.all([
    assignList.boundingBox(),
    bookPhoneAdvice.boundingBox(),
    editTimes.boundingBox(),
    history.boundingBox(),
  ])
  // Assign List, the one primary, on its own full-width row; the rest beneath, on one row.
  for (const box of [timesBox, historyBox]) expect(box?.y).toBe(bookBox?.y)
  expect(assignBox?.y ?? 0).toBeLessThan(bookBox?.y ?? 0)
  expect(assignBox?.width ?? 0).toBeGreaterThan((historyBox?.x ?? 0) + (historyBox?.width ?? 0) - (bookBox?.x ?? 0) - 1)
  // Assign List is the one teal primary (the design's only action colour).
  expect(await assignList.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(13, 110, 99)')
  expect(await bookPhoneAdvice.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe('rgb(13, 110, 99)')
  await page.screenshot({ path: 'visual/shots/a-11-phone-drawer.png', fullPage: true })
  await bookPhoneAdvice.click()
  // Times prefill from the schedule settings (US-01.1.4): 13:00 to 17:30 for PM.
  await expect(page.getByLabel('Start', { exact: true })).toHaveValue('13:00')
  await expect(page.getByLabel('End', { exact: true })).toHaveValue('17:30')
  await page.getByLabel('Hospital').selectOption({ label: "St George's" })
  await page.getByLabel('Surgeon').selectOption('S-HALE')
  await page.getByRole('button', { name: 'Continue to add booking' }).click()
  await expect(page.getByRole('heading', { name: 'Add a booking' })).toBeVisible()

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

  await page.getByRole('button', { name: 'Save booking' }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByText('Demo Patient', { exact: true })).toBeVisible()
  // The session now holds a Private List (P5 closed): the block reads St George's.
  await page.keyboard.press('Escape')
  await expect(page.locator('button[data-slot-id="S-41267-2026-07-21-PM"]')).toContainText("St George's")
})

test('generic manual-booking lookup still requires an NHI', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.getByText('Add a booking', { exact: false }).first().click()
  await expect(page.getByRole('heading', { name: 'Add a booking' })).toBeVisible()

  await expect(page.getByRole('button', { name: 'Look up' })).toBeDisabled()
  await expect(page.getByLabel('Name')).toHaveValue('')
  await expect(page.getByLabel('Procedure code')).toHaveValue('')
})
