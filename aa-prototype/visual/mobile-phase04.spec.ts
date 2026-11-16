import { expect, test, type Page } from '@playwright/test'

/** Phase 04 BTM capture walkthrough screenshots (working artifacts, not assertions). */

async function openEllison(page: Page): Promise<void> {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(500)
  await page.getByText('Margaret Ellison', { exact: false }).first().click()
  await page.waitForTimeout(600)
}

/** Advance the demo clock so Finish now stamps a realistic afternoon time. */
async function advanceClockTo1715(page: Page): Promise<void> {
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  for (let i = 0; i < 9; i++) {
    await page.getByRole('button', { name: '+1 hour' }).click()
  }
  await page.getByRole('button', { name: '+15 min' }).click()
  await page.waitForTimeout(200)
}

test('mobile Booking header groups status and History above the Patient card', async ({ page }) => {
  await openEllison(page)

  const header = page.getByTestId('mobile-booking-header')
  const actions = page.getByTestId('mobile-booking-header-actions')
  const status = actions.getByText('Private', { exact: true }).locator('..')
  const history = actions.getByRole('button', { name: 'History', exact: true })
  // The Patient card by its hook: "Patient" is also the payer's relationship since catch-up Phase 21.
  const patient = page.locator('[data-shot="booking-patient"]')

  await expect(history).toBeVisible()
  const headerBox = await header.boundingBox()
  const statusBox = await status.boundingBox()
  const historyBox = await history.boundingBox()
  const patientBox = await patient.boundingBox()

  expect(headerBox).not.toBeNull()
  expect(statusBox).not.toBeNull()
  expect(historyBox).not.toBeNull()
  expect(patientBox).not.toBeNull()
  expect(historyBox!.x).toBeGreaterThan(statusBox!.x + statusBox!.width)
  expect(Math.abs(
    statusBox!.y + statusBox!.height / 2 - (historyBox!.y + historyBox!.height / 2),
  )).toBeLessThan(2)
  expect(patientBox!.y - (headerBox!.y + headerBox!.height)).toBeLessThan(20)
  await expect(page.getByRole('button', { name: 'History', exact: true })).toHaveCount(1)

  await history.click()
  await expect(page.getByRole('dialog').getByText('Booking history', { exact: true })).toBeVisible()
})

test('mobile Booking header folds History out of the compact navigation row', async ({ page }) => {
  await openEllison(page)

  const header = page.getByTestId('mobile-booking-header')
  await expect(header.getByRole('button', { name: 'History', exact: true })).toBeVisible()

  await page.getByTestId('mobile-booking-scroll').evaluate((el) => el.scrollTo({ top: 40 }))

  await expect(header.getByRole('button', { name: 'History', exact: true })).toHaveCount(0)
})

test('capture: Ellison BTM block', async ({ page }) => {
  await openEllison(page)
  await page.screenshot({ path: 'visual/shots/m4-01-booking-top.png', fullPage: true })
  // Scroll the phone frame's content to the capture block. What the scroll
  // shows is the masthead folded to its nav row above the Mark complete dock.
  await page.locator('[data-shot="capture-billing"]').last().scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/m4-01-btm-block.png', fullPage: true })
  // The Modifiers section (catch-up Phase 19b): A1 pre-applied from her age, nothing else.
  const modifiers = page.locator('[data-shot="capture-modifiers"]')
  await modifiers.scrollIntoViewIfNeeded()
  await expect(modifiers.locator('[data-shot="capture-modifier-applied"]')).toHaveCount(1)
  await expect(modifiers.locator('[data-shot="capture-modifier-applied"]')).toContainText("From the patient's age (72) on the procedure date")
  await expect(modifiers.locator('[data-shot="capture-modifier-claim"]')).toHaveCount(0)
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/m4-01-modifiers.png', fullPage: true })
})

test('capture: code picker sheet', async ({ page }) => {
  await openEllison(page)
  await page.locator('[data-shot=capture-billing]').first().click()
  await page.locator('[data-shot=billing-sheet] [data-shot=capture-procedure-code]').getByRole('button', { name: /\. Change$/ }).first().click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/m4-02-code-picker.png', fullPage: true })
})

test('capture: ASA III claimed with its explanation', async ({ page }) => {
  await openEllison(page)
  await page.locator('[data-shot="modifier-add"]').click()
  await page.locator('[data-shot="modifier-picker"] [data-modifier-code="AS3"]').click()
  await page.getByPlaceholder('A short reason, as an insurer would ask').fill('ASA III on pre-op review')
  await page.getByRole('button', { name: 'Claim', exact: true }).click()
  await expect(page.locator('[data-shot="capture-modifier-claim"][data-modifier-code="AS3"]')).toBeVisible()
  await page.waitForTimeout(150)
  await page.screenshot({ path: 'visual/shots/m4-03-asa-claimed.png', fullPage: true })
})

test('capture: finish now, complete, submit walk', async ({ page }) => {
  await advanceClockTo1715(page)
  await openEllison(page)

  // Finish now stamps the advanced demo clock.
  await page.getByRole('button', { name: 'Finish now' }).click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'visual/shots/m4-04-finish-stamped.png', fullPage: true })

  // Mark complete: catch the overlay mid-choreography (~400 ms in).
  // The modifiers step on an RVG price (catch-up Phase 21a): "None apply" is a valid answer.
  await page.locator('[data-shot="capture-modifiers-none"]').click()
  await page.getByRole('button', { name: 'Mark complete' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/m4-05-completion-overlay.png', fullPage: true })

  // The overlay auto-dismisses back to the list: row tick + enabled bar.
  await page.waitForTimeout(900)
  await page.screenshot({ path: 'visual/shots/m4-06-list-tick-enabled.png', fullPage: true })

  // Confirm sheet.
  await page.getByRole('button', { name: 'Mark list completed' }).click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/m4-07-confirm-sheet.png', fullPage: true })

  // Successful submission gets the same full-screen fanfare as Booking completion,
  // then settles on the read-only submitted List.
  await page.getByRole('button', { name: 'Submit to office' }).click()
  await expect(page.getByTestId('list-submission-overlay')).toContainText('List submitted')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/m4-08-submission-overlay.png', fullPage: true })
  await page.waitForTimeout(900)
  await expect(page.getByTestId('list-submission-overlay')).toHaveCount(0)
  await expect(page.getByText('Submitted to office', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/m4-08-submitted.png', fullPage: true })
})

test('capture: blockers sheet names the offenders', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: 'Mark list completed', exact: false }).click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/m4-09-blockers-sheet.png', fullPage: true })
})

test('capture: refused completion focuses the first missing field', async ({ page }) => {
  await openEllison(page)

  await page.getByRole('button', { name: 'Mark complete' }).click()

  const finish = page.getByRole('button', { name: 'Finish now' })
  await expect(finish).toBeFocused()
  await expect(finish).toBeInViewport()
  // The red outline on Finish now is the only cue for a missing time (owner review, 2026-11-17): no note, no Required pill.
  await expect(page.getByText('Add the finish time.')).toHaveCount(0)
})

test('capture: Chen read-only with adjusted-manually provenance', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(500)
  await page.getByText('David Chen', { exact: false }).first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'visual/shots/m4-11-chen-readonly.png', fullPage: true })
})
