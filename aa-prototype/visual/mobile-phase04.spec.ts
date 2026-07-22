import { test, type Page } from '@playwright/test'

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

test('capture: Ellison BTM block', async ({ page }) => {
  await openEllison(page)
  await page.screenshot({ path: 'visual/shots/m4-01-card-top.png', fullPage: true })
  // Scroll the phone frame's content to the capture block and the ink panel.
  await page.getByText('ASA status', { exact: true }).scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/m4-01-btm-block.png', fullPage: true })
  await page.getByText('TOTAL UNITS', { exact: true }).scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/m4-01-fee-panel.png', fullPage: true })
})

test('capture: code picker sheet', async ({ page }) => {
  await openEllison(page)
  await page.getByText('Change', { exact: true }).first().click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/m4-02-code-picker.png', fullPage: true })
})

test('capture: ASA III fee flash', async ({ page }) => {
  await openEllison(page)
  await page.getByRole('button', { name: 'III', exact: true }).click()
  await page.waitForTimeout(150)
  await page.screenshot({ path: 'visual/shots/m4-03-asa-flash.png', fullPage: true })
})

test('capture: finish now, complete, submit walk', async ({ page }) => {
  await advanceClockTo1715(page)
  await openEllison(page)

  // Finish now stamps the advanced demo clock; the fee ticks up.
  await page.getByRole('button', { name: 'Finish now' }).click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'visual/shots/m4-04-finish-stamped.png', fullPage: true })

  // Mark complete: catch the overlay mid-choreography (~400 ms in).
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

  // Submitted to office.
  await page.getByRole('button', { name: 'Submit to office' }).click()
  await page.waitForTimeout(600)
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

test('capture: copied card renders time-only', async ({ page }) => {
  await openEllison(page)
  await page.getByText('Copy for an additional procedure', { exact: false }).click()
  await page.waitForTimeout(600)
  // The copy lands on the list; open it (the row with no operation yet).
  await page.getByText('Procedure to capture', { exact: false }).first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'visual/shots/m4-10-copied-time-only.png', fullPage: true })
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
