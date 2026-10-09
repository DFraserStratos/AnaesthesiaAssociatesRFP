import { test, expect, type Page } from '@playwright/test'

/**
 * Catch-up Phase 17: surgeons, rooms, pairing preferences and priority tiers.
 * The Master data views, Ms A. Reid's profile, Dr Priya Sharma's record, the
 * Edit list warning and the two Reassign list pickers. Admin only: nothing
 * here has a mobile, web or PWA shot (the stories forbid one).
 *
 * The Chen Tue 21 PM picker is opened only, never confirmed: confirming moves
 * the List into Dr Sharma's Free PM, which S2 Beat 2 books by phone.
 */

const CHEN_TUE_PM = 'L-45178-2026-07-21-PM'
const SHARMA_TUE_AM = 'L-41267-2026-07-21-AM'
const RUTHERFORD_WED_AM = 'L-29104-2026-07-22-AM'

async function openList(page: Page, dateISO: string, listId: string) {
  await page.goto(`/admin/day/${dateISO}`)
  await page.waitForLoadState('networkidle')
  await page.locator(`[data-list-id="${listId}"]`).click()
  await expect(page.getByTestId('admin-list-drawer')).toBeVisible()
}

test('phase 17 master data views', async ({ page }) => {
  await page.goto('/admin/masters?view=surgeons')
  await page.waitForLoadState('networkidle')
  const surgeons = page.locator('[data-shot="masters-surgeons"]')
  await expect(surgeons.getByText('47REIA')).toBeVisible()
  await expect(surgeons.locator('tr', { hasText: 'Ms A. Reid' }).getByText('1 Not preferred')).toBeVisible()
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17-01-surgeons.png', fullPage: true })

  await page.getByRole('button', { name: "Surgeons' rooms", exact: true }).click()
  await expect(page).toHaveURL(/view=surgeonRooms/)
  const rooms = page.locator('[data-shot="masters-surgeon-rooms"]')
  await expect(rooms.locator('tr', { hasText: 'Merivale Eye Rooms' }).getByText('Mr J. Whitford')).toBeVisible()
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17-02-rooms.png', fullPage: true })

  await page.getByRole('button', { name: 'Surgeon groups', exact: true }).click()
  await expect(page.locator('[data-shot="masters-surgeon-groups"]').getByText('Canterbury Orthopaedic Surgeons')).toBeVisible()

  await page.getByRole('button', { name: 'Anaesthetists', exact: true }).click()
  await expect(page.locator('tr[data-anaesthetist="39560"] [data-tier="4"]')).toBeVisible()
})

test('phase 17 surgeon profile and add sheet', async ({ page }) => {
  await page.goto('/admin/masters/surgeons/S-REID')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="surgeon-hpi-chip"]')).toContainText('47REIA')
  await expect(page.locator('[data-shot="surgeon-room-card"]').getByText('Mr J. Whitford')).toBeVisible()
  const section = page.locator('[data-shot="pairing-section"]')
  await expect(section.locator('[data-pairing-group="NOT_PREFERRED"]').getByText('Ms A. Reid prefers not to work with Dr Priya Sharma')).toBeVisible()
  await section.getByText('Ended entries').click()
  await expect(section.getByText('Dr Rawiri Hughes prefers not to work with Ms A. Reid')).toBeVisible()
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17-03-reid-profile.png', fullPage: true })

  await page.getByRole('button', { name: 'Add pairing' }).click()
  const counterpart = page.locator('select[data-shot="pairing-counterpart"]')
  const sharmaDisabled = () => counterpart.locator('option[value="41267"]').evaluate((o) => (o as HTMLOptionElement).disabled)
  expect(await sharmaDisabled()).toBe(true)
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17-04-add-sheet.png', fullPage: true })
  await page.getByText('The anaesthetist asked').click()
  expect(await sharmaDisabled()).toBe(false)

  await page.keyboard.press('Escape')
  await page.goto('/admin/masters/surgeons/S-NOPE')
  await expect(page).toHaveURL(/\/admin\/masters$/)
})

test('phase 17 anaesthetist record', async ({ page }) => {
  await page.goto('/admin/masters/anaesthetists/41267')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="tier-card"]').getByText('Tier names are provisional.')).toBeVisible()
  await expect(page.locator('[data-pairing-group="NOT_PREFERRED"]').getByRole('link', { name: 'Ms A. Reid' })).toBeVisible()
  await expect(page.locator('[data-pairing-group="PREFERRED"]').getByRole('link', { name: 'Mr J. Whitford' })).toBeVisible()
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17-05-sharma-record.png', fullPage: true })
})

test('phase 17 edit list warning', async ({ page }) => {
  await openList(page, '2026-07-21', SHARMA_TUE_AM)
  await page.getByRole('button', { name: 'Edit list', exact: true }).click()
  await page.locator('select[data-shot="surgeon-picker"]').selectOption('S-REID')
  await expect(page.locator('[data-shot="edit-list-pairing-warning"]')).toContainText('Ms A. Reid prefers not to work with Dr Priya Sharma')
  await expect(page.getByRole('button', { name: 'Save list anyway' })).toBeVisible()
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17-06-edit-list-warning.png', fullPage: true })
})

test('phase 17 reassign pickers (open only)', async ({ page }) => {
  await openList(page, '2026-07-21', CHEN_TUE_PM)
  await page.getByRole('button', { name: 'Reassign list', exact: true }).click()
  const apart = page.locator('[data-shot="candidates-not-preferred"]')
  await expect(apart).toContainText('Not preferred with Ms Reid')
  await expect(apart.locator('[data-candidate="41267"]')).toBeVisible()
  const clearTiers = await page.locator('[data-shot="candidates-clear"] [data-tier]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-tier'))))
  expect(clearTiers).toEqual([...clearTiers].sort((a, b) => a - b))
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17-07-reassign-apart.png', fullPage: true })

  await openList(page, '2026-07-22', RUTHERFORD_WED_AM)
  await page.getByRole('button', { name: 'Reassign list', exact: true }).click()
  await expect(page.locator('[data-shot="candidates-clear"] [data-candidate="41267"]').getByText('Preferred')).toBeVisible()
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17-08-reassign-tiers.png', fullPage: true })
  await page.locator('[data-shot="tier-filter"]').getByRole('button', { name: 'Tier 1' }).click()
  const filtered = await page.locator('[data-candidate] [data-tier]').evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))
  expect(new Set(filtered)).toEqual(new Set(['1']))
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17-09-reassign-filter.png', fullPage: true })
})
