import { test, expect, type Page } from '@playwright/test'

/**
 * Desktop booking-detail regressions that only a browser can catch: the paired
 * capture cards matching heights, and the attachment add/remove cycle through
 * the simulated picker, on a Booking and on a whole List (US-03.1.3). Ids are
 * store-allocated since catch-up Phase 15 (`attachmentActions.test.ts`).
 */

async function openEllison(page: Page): Promise<void> {
  await page.goto('/web')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Lists', exact: true }).click()
  await page.getByText('Southern Cross').first().click()
  await page.getByText('Margaret Ellison').first().click()
  await expect(page.getByText('ASA status', { exact: true })).toBeVisible()
}

/** The office Booking: the only desktop Booking that carries the Booking total. */
async function openAdminBooking(page: Page): Promise<void> {
  await page.goto('/admin/day/2026-07-21')
  await page.waitForLoadState('networkidle')
  await page.getByText("St George's").first().click()
  await page.getByRole('button', { name: 'Open', exact: true }).first().click()
  await expect(page.getByText(/Office billing setup/).first()).toBeVisible()
}

/** The CaptureSection wrapping a micro-caps label is that label's parent. */
function cardByLabel(page: Page, label: string) {
  return page.getByText(label, { exact: true }).locator('..')
}

async function expectSameHeight(page: Page, left: string, right: string): Promise<void> {
  const a = await cardByLabel(page, left).boundingBox()
  const b = await cardByLabel(page, right).boundingBox()
  expect(a).not.toBeNull()
  expect(b).not.toBeNull()
  expect(Math.abs(a!.height - b!.height)).toBeLessThan(1)
}

test('paired capture cards match heights on the desktop', async ({ page }) => {
  await openEllison(page)
  await expectSameHeight(page, 'ASA status', 'Procedure code')
  await expectSameHeight(page, 'Adjustment and charge', 'Billing lines')
})

test('desktop Booking total starts level with the first capture-card pair', async ({ page }) => {
  await openAdminBooking(page)
  const asa = await cardByLabel(page, 'ASA status').boundingBox()
  const total = await page.getByText('BOOKING TOTAL', { exact: true }).locator('../../..').boundingBox()

  expect(asa).not.toBeNull()
  expect(total).not.toBeNull()
  expect(Math.abs(asa!.y - total!.y)).toBeLessThan(1)
})

test('desktop completion action is separate and matches the Booking total width', async ({ page }) => {
  await openAdminBooking(page)
  const total = await page.getByText('BOOKING TOTAL', { exact: true }).locator('../../..').boundingBox()
  // The seeded office Booking is already complete, so the bar is its success state.
  const complete = await page.getByRole('button', { name: 'Amend', exact: true }).locator('..').boundingBox()
  const stickyBackdrop = page.getByTestId('web-booking-commit')
  const backdrop = await stickyBackdrop.boundingBox()

  expect(total).not.toBeNull()
  expect(complete).not.toBeNull()
  expect(backdrop).not.toBeNull()
  expect(Math.abs(total!.x - complete!.x)).toBeLessThan(1)
  expect(Math.abs(total!.width - complete!.width)).toBeLessThan(1)
  expect(complete!.y - (total!.y + total!.height)).toBeCloseTo(8, 0)
  expect(total!.x - backdrop!.x).toBeCloseTo(12, 0)
  expect(backdrop!.width - total!.width).toBeCloseTo(24, 0)
  await expect(stickyBackdrop).toHaveCSS('border-top-left-radius', '0px')
  await expect(stickyBackdrop).toHaveCSS('border-top-right-radius', '0px')
  await expect(stickyBackdrop).toHaveCSS('border-bottom-left-radius', '26px')
  await expect(stickyBackdrop).toHaveCSS('border-bottom-right-radius', '26px')
})

test('desktop header actions are grouped with the records they act on', async ({ page }) => {
  await openEllison(page)
  const pageHeader = page.getByTestId('web-booking-header')
  await expect(pageHeader.getByRole('button', { name: 'History' })).toBeVisible()

  const procedureHeader = page.getByTestId('procedure-header')
  const procedureTitle = procedureHeader.getByText('Left total hip replacement', { exact: true })
  const edit = procedureHeader.getByRole('button', { name: 'Edit' })
  const titleBox = await procedureTitle.boundingBox()
  const editBox = await edit.boundingBox()

  expect(titleBox).not.toBeNull()
  expect(editBox).not.toBeNull()
  expect(editBox!.x - (titleBox!.x + titleBox!.width)).toBeLessThanOrEqual(12)
})

test('Booking attachments: the simulated picker attaches a photo and a PDF, and both remove', async ({ page }) => {
  await openEllison(page)
  const section = page.locator('[data-shot="booking-attachments"]')
  await expect(section.getByText('No attachments.')).toBeVisible()

  await section.getByRole('button', { name: 'Add attachment' }).click()
  const sheet = page.locator('[data-shot="add-attachment-sheet"]')
  await expect(sheet.getByText('Simulated file picker')).toBeVisible()
  await expect(sheet.getByRole('group', { name: 'Take a photo' })).toBeVisible()
  await expect(sheet.getByRole('group', { name: 'Choose a file' })).toBeVisible()
  await sheet.getByRole('group', { name: 'Take a photo' }).getByRole('button').first().click()
  await expect(sheet).toHaveCount(0)

  await section.getByRole('button', { name: 'Add attachment' }).click()
  await page.locator('[data-shot="add-attachment-sheet"]').getByRole('button', { name: /Surgeon's letter/ }).click()
  await expect(section.getByRole('button', { name: /^Remove / })).toHaveCount(2)
  await expect(section.getByText('PDF', { exact: true })).toBeVisible()

  // Hidden until the thumbnail is hovered, but mounted the whole time so a
  // keyboard can still reach it.
  const removePhoto = section.getByRole('button', { name: 'Remove Booking card photo A' })
  await expect(removePhoto).toHaveCSS('opacity', '0')
  await removePhoto.hover()
  await expect(removePhoto).toHaveCSS('opacity', '1')
  await removePhoto.click()
  await section.getByRole('button', { name: "Remove Surgeon's letter" }).click()
  await expect(section.getByText('No attachments.')).toBeVisible()

  // Each add and remove is in the Booking's history.
  await page.getByRole('button', { name: 'History' }).first().click()
  const history = page.getByRole('dialog')
  await expect(history.getByText('Attachment added').first()).toBeVisible()
  await expect(history.getByText('Attachment removed').first()).toBeVisible()
})

test('List attachments: the seeded theatre list shows on web, a second attaches, and Admin reads both', async ({ page }) => {
  await page.goto('/web/lists/L-34821-2026-07-28-AM')
  await page.waitForLoadState('networkidle')
  const section = page.locator('[data-shot="list-attachments"]')
  await expect(section.getByText('List attachments')).toBeVisible()
  await expect(section.getByRole('img', { name: "Theatre list · St George's" })).toBeVisible()
  await section.getByRole('button', { name: 'Add attachment' }).click()
  await page.locator('[data-shot="add-attachment-sheet"]').getByRole('button', { name: /Consent form/ }).click()
  await expect(section.getByRole('img')).toHaveCount(2)

  await page.goto('/admin/day/2026-07-28')
  await page.waitForLoadState('networkidle')
  await page.getByText("St George's").first().click()
  const drawer = page.locator('[data-shot="admin-list-attachments"]')
  await expect(drawer.getByText('Attachments (2)')).toBeVisible()
  await expect(drawer.getByRole('button')).toHaveCount(0)
})
