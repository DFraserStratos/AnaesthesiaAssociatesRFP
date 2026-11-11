import { expect, test, type Page } from '@playwright/test'

/**
 * Catch-up Phase 19b: modifiers as itemised records. Ellison's A1 is
 * pre-applied from her age and removable; ASA III is claimed with its
 * explanation inline; the Spine Booking shows P1 included at 0; a "2 + Time"
 * modifier asks for units; the completion backstop scrolls to a claim with no
 * explanation; Admin lists the RVG modifier table as printed with the one
 * provisional note. Mobile uses the bottom sheet, web and Admin the dialog.
 */

const ELLISON_MOBILE = '/mobile/lists/L-34821-2026-07-21-PM/bookings/BK0009'
const ELLISON_WEB = '/web/lists/L-34821-2026-07-21-PM/bookings/BK0009'
// The `includedModifierBooking` seed marker (BK0158, re-coded to S3a).
const SPINE_MOBILE = '/mobile/lists/L-34821-2026-07-27-PM/bookings/BK0158'
const ELLISON_ADMIN = '/admin/day/2026-07-21/bookings/BK0009'

async function fresh(page: Page, path: string): Promise<void> {
  await page.goto('/mobile')
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)
}

const section = (page: Page) => page.locator('[data-shot="capture-modifiers"]').first()
const mCaption = (page: Page) => page.locator('[data-shot="units-row-m"]').first()

async function openPicker(page: Page): Promise<void> {
  await section(page).locator('[data-shot="modifier-add"]').click()
  await expect(page.locator('[data-shot="modifier-picker"]')).toBeVisible()
}

async function claim(page: Page, code: string, reason: string): Promise<void> {
  await openPicker(page)
  await page.locator(`[data-shot="modifier-picker"] [data-modifier-code="${code}"]`).click()
  await page.getByPlaceholder('A short reason, as an insurer would ask').fill(reason)
  await page.getByRole('button', { name: 'Claim', exact: true }).click()
}

test('mobile: Ellison shows A1 pre-applied, nothing else; Remove and Put back', async ({ page }) => {
  await fresh(page, ELLISON_MOBILE)
  await expect(page.getByText('ASA status')).toHaveCount(0)
  const applied = section(page).locator('[data-shot="capture-modifier-applied"]')
  await expect(applied).toHaveCount(1)
  await expect(applied).toHaveAttribute('data-modifier-code', 'A1')
  await expect(applied).toContainText("From the patient's age (72) on the procedure date")
  await expect(section(page).locator('[data-shot="capture-modifier-claim"]')).toHaveCount(0)
  await expect(mCaption(page)).toContainText('A1 age +1')
  await section(page).scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/m19b-01-age-applied.png', fullPage: true })

  await applied.getByRole('button', { name: 'Remove' }).click()
  await expect(section(page).locator('[data-shot="capture-modifier-removed"]')).toContainText('Removed: A1')
  await expect(mCaption(page)).toContainText('None applied')
  await page.screenshot({ path: 'visual/shots/m19b-02-age-removed.png', fullPage: true })
  await section(page).getByRole('button', { name: 'Put back' }).click()
  await expect(section(page).locator('[data-shot="capture-modifier-applied"]')).toHaveCount(1)
  await expect(mCaption(page)).toContainText('A1 age +1')
})

test('mobile: claiming ASA III asks for its explanation inline; Cancel discards; OB2 stacks', async ({ page }) => {
  await fresh(page, ELLISON_MOBILE)
  await openPicker(page)
  const picker = page.locator('[data-shot="modifier-picker"]')
  // A1 is applied, so it cannot be claimed a second time.
  await expect(picker.locator('[data-modifier-code="A1"]')).toBeDisabled()
  await expect(picker.locator('[data-modifier-code="A1"]')).toContainText('Applied')
  await picker.locator('[data-modifier-code="AS3"]').click()
  const claimButton = page.getByRole('button', { name: 'Claim', exact: true })
  await expect(claimButton).toBeDisabled()
  await page.screenshot({ path: 'visual/shots/m19b-03-claiming.png', fullPage: true })
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.locator('[data-shot="modifier-explanation"]')).toHaveCount(0)
  await picker.locator('[data-modifier-code="AS3"]').click()
  await page.getByPlaceholder('A short reason, as an insurer would ask').fill('ASA III on pre-op review')
  await expect(claimButton).toBeEnabled()
  await claimButton.click()
  // The phone closes on a claim.
  await expect(page.locator('[data-shot="modifier-picker"]')).toHaveCount(0)
  const claimed = section(page).locator('[data-shot="capture-modifier-claim"][data-modifier-code="AS3"]')
  await expect(claimed).toContainText('ASA III on pre-op review')
  await expect(claimed).toContainText('+2')

  await claim(page, 'OB2', 'BMI 37 at pre-op')
  await expect(mCaption(page)).toContainText('A1 age +1 · AS3 +2 · OB2 +1')
  await expect(page.locator('[data-shot="units-row-m"] .mono').first()).toHaveText('4')
  await section(page).scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/m19b-04-claimed.png', fullPage: true })

  await section(page).locator('[data-modifier-code="OB2"]').getByRole('button', { name: 'Remove' }).click()
  await expect(section(page).locator('[data-modifier-code="OB2"]')).toHaveCount(0)
})

test('mobile: a "2 + Time" modifier asks for units, and M rises by them', async ({ page }) => {
  await fresh(page, ELLISON_MOBILE)
  await openPicker(page)
  await page.locator('[data-shot="modifier-picker"] [data-modifier-code="PA3"]').click()
  const units = page.locator('[data-shot="modifier-units"]')
  await expect(units).toContainText('RVG: 2 + Time')
  // The stepper starts at the printed floor (2 + Time: at least 2) and cannot go below it.
  await expect(units.getByRole('button', { name: 'Fewer units' })).toBeDisabled()
  await units.getByRole('button', { name: 'More units' }).click()
  await page.getByPlaceholder('A short reason, as an insurer would ask').fill('Seen in clinic, 30 minutes')
  await page.getByRole('button', { name: 'Claim', exact: true }).click()
  await expect(section(page).locator('[data-modifier-code="PA3"]')).toContainText('+3')
  await expect(mCaption(page)).toContainText('PA3 +3')
})

test('mobile: the Spine Booking shows P1 included at 0, Applied in the picker, removable', async ({ page }) => {
  await fresh(page, SPINE_MOBILE)
  const p1 = section(page).locator('[data-shot="capture-modifier-applied"][data-modifier-code="P1"]')
  await expect(p1).toContainText('Included in the base units of S3a. Cannot be added twice.')
  await expect(p1).toContainText('0')
  await section(page).scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/m19b-05-included-p1.png', fullPage: true })
  await openPicker(page)
  const row = page.locator('[data-shot="modifier-picker"] [data-modifier-code="P1"]')
  await row.scrollIntoViewIfNeeded()
  await expect(row).toContainText('Applied')
  await expect(row).toBeDisabled()
  await page.screenshot({ path: 'visual/shots/m19b-06-included-not-addable.png', fullPage: true })
  await page.getByRole('button', { name: 'Close sheet' }).click()
  await expect(page.locator('[data-shot="modifier-picker"]')).toHaveCount(0)
  await p1.getByRole('button', { name: 'Remove' }).click()
  await expect(section(page).locator('[data-shot="capture-modifier-removed"]')).toContainText('Removed: P1')
  await section(page).getByRole('button', { name: 'Put back' }).click()
  await expect(section(page).locator('[data-shot="capture-modifier-applied"][data-modifier-code="P1"]')).toHaveCount(1)
})

test('web: the picker is a dialog that stays open for another claim', async ({ page }) => {
  await fresh(page, ELLISON_WEB)
  await claim(page, 'AS3', 'ASA III on pre-op review')
  await expect(page.locator('[data-shot="modifier-picker"]')).toContainText('AS3 claimed.')
  await page.screenshot({ path: 'visual/shots/w19b-01-picker-dialog.png', fullPage: true })
  await page.keyboard.press('Escape')
  await expect(section(page).locator('[data-shot="capture-modifier-claim"][data-modifier-code="AS3"]')).toContainText('ASA III on pre-op review')
})

test('web: A1 pre-applied with no other modifier; Remove and Put back', async ({ page }) => {
  await fresh(page, ELLISON_WEB)
  const applied = section(page).locator('[data-shot="capture-modifier-applied"]')
  await expect(applied).toHaveCount(1)
  await expect(section(page).locator('[data-shot="capture-modifier-claim"]')).toHaveCount(0)
  await applied.getByRole('button', { name: 'Remove A1' }).click()
  await expect(section(page).locator('[data-shot="capture-modifier-removed"]')).toContainText('Removed: A1')
  await section(page).getByRole('button', { name: 'Put back A1' }).click()
  await expect(section(page).locator('[data-shot="capture-modifier-applied"]')).toHaveCount(1)
})

test('admin: claiming ASA III on the Admin Booking raises M by 2, in a dialog', async ({ page }) => {
  await fresh(page, ELLISON_ADMIN)
  const m = page.locator('[data-shot="units-row-m"] .mono').first()
  await expect(m).toHaveText('1')
  await section(page).locator('[data-shot="modifier-add"]').click()
  await expect(page.locator('[role=dialog] [data-shot="modifier-picker"]')).toBeVisible()
  await page.locator('[data-shot="modifier-picker"] [data-modifier-code="AS3"]').click()
  await page.getByPlaceholder('A short reason, as an insurer would ask').fill('ASA III on pre-op review')
  await page.getByRole('button', { name: 'Claim', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(m).toHaveText('3')
})

test('completion backstop: a claim with no explanation stops Mark complete and is focused', async ({ page }) => {
  await fresh(page, ELLISON_MOBILE)
  // Test-only store setup: claim AS3 through the UI (so the store persists), then
  // blank its explanation and stamp Ellison's handover in the persisted payload.
  await claim(page, 'AS3', 'placeholder')
  await expect
    .poll(() => page.evaluate(() => (window.localStorage.getItem('aa-demo') ?? '').includes('placeholder')), { timeout: 5_000 })
    .toBe(true)
  await page.evaluate(() => {
    const raw = window.localStorage.getItem('aa-demo')!
    const persisted = JSON.parse(raw) as { state: { schedule: { procedures: Record<string, Record<string, unknown>> } } }
    const p = persisted.state.schedule.procedures.P0009!
    p.handoverISO = '2026-07-21T17:20:00'
    p.modifierClaims = [{ modifierId: 'MOD-RVG-AS3', explanation: '' }]
    window.localStorage.setItem('aa-demo', JSON.stringify(persisted))
  })
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Mark complete' }).click()
  await expect(section(page)).toBeFocused()
  await expect(section(page)).toBeInViewport()
  await expect(section(page).locator('[data-modifier-code="AS3"]')).toContainText('Add a short explanation for AS3, or remove it.')
  await page.screenshot({ path: 'visual/shots/m19b-07-backstop.png', fullPage: true })
  await section(page).getByRole('button', { name: 'Add a short explanation' }).click()
  await page.getByPlaceholder('A short reason, as an insurer would ask').fill('ASA III on pre-op review')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('button', { name: 'Mark complete' }).click()
  await expect(page.getByTestId('completion-overlay')).toBeVisible()
})

test('admin: the Modifiers tab lists the 30 RVG rows as printed with the one provisional note; add an AA modifier', async ({ page }) => {
  await fresh(page, '/admin/masters?view=modifiers')
  const rvg = page.locator('[data-shot="masters-modifiers-rvg"] tbody tr')
  await expect(rvg).toHaveCount(30)
  await expect(page.locator('[data-shot="masters-modifiers-provisional"]')).toContainText('The age bands are still to confirm with AA (OQ-95).')
  await expect(page.locator('tr[data-modifier-code="PA3"]')).toContainText('2 + Time')
  await expect(page.locator('tr[data-modifier-code="POC2a"]')).toContainText('Entered at capture')
  await expect(page.locator('tr[data-modifier-code="AS3"] td').nth(3)).toHaveText('2')
  await expect(page.locator('tr[data-modifier-code="A1"]')).toContainText('From age')
  await expect(page.locator('tr[data-modifier-code="P1"]')).toContainText('Optional, or included by the RVG group')
  await expect(page.locator('tr[data-modifier-code="AS2"]')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/a19b-01-modifiers.png', fullPage: true })

  await page.getByRole('button', { name: 'Add AA modifier' }).click()
  await page.getByLabel('Code').fill('AAX1')
  await page.getByLabel('Modifying factor').fill('Demo AA modifier')
  await page.getByLabel('Units').fill('1')
  await page.screenshot({ path: 'visual/shots/a19b-02-add-aa.png', fullPage: true })
  await page.getByRole('button', { name: 'Add modifier', exact: true }).click()
  await expect(page.locator('[data-shot="masters-modifiers-aa"] tr[data-modifier-code="AAX1"]')).toContainText('Demo AA modifier')

  await page.goto('/admin/masters?view=rvgGroups')
  await expect(page.locator('[data-shot="masters-rvg-included"]')).toHaveCount(20)
  await expect(page.locator('tr[data-rvg-group-code="S3a"] [data-shot="masters-rvg-included"]')).toHaveText('P1 · 0')
  await expect(page.locator('tr[data-rvg-group-code="LL4"] [data-shot="masters-rvg-included"]')).toHaveCount(0)
})
