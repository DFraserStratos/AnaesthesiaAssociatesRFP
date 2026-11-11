import { test, expect, type Page } from '@playwright/test'

/**
 * Desktop booking-detail regressions that only a browser can catch: the paired
 * capture cards matching heights and the header layout (moved here from the
 * attachments spec when catch-up Phase 20a removed attachments, RV-01).
 */

async function openEllison(page: Page): Promise<void> {
  await page.goto('/web')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Lists', exact: true }).click()
  await page.getByText('Southern Cross').first().click()
  await page.getByText('Margaret Ellison').first().click()
  await expect(page.getByText('RVG code', { exact: true }).last()).toBeVisible()
}

/** The office Booking: the only desktop Booking that carries the Booking total. */
async function openAdminBooking(page: Page): Promise<void> {
  await page.goto('/admin/day/2026-07-21')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-list-id="L-34821-2026-07-21-AM"]').click() // Souter's St George's AM (the band and rail card also name St George's since catch-up Phase 31)
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
  await expectSameHeight(page, 'Adjustment and charge', 'Billing lines')
})

test('desktop Booking total starts level with the first capture card', async ({ page }) => {
  await openAdminBooking(page)
  // The Procedure card leads the capture column since catch-up Phase 20a.
  const asa = await page.locator('[data-shot=procedure-stack]').first().boundingBox()
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

  // The procedure stack's heading row (catch-up Phase 20a) holds Edit beside the stack it acts on.
  const procedureHeader = page.getByTestId('procedure-header')
  await expect(procedureHeader.getByText('Procedure', { exact: true })).toBeVisible()
  const edit = procedureHeader.getByRole('button', { name: 'Edit' })
  await expect(edit).toBeVisible()
  const headerBox = await procedureHeader.boundingBox()
  const stackBox = await page.locator('[data-shot=procedure-stack]').first().boundingBox()
  const editBox = await edit.boundingBox()
  expect(headerBox).not.toBeNull()
  expect(stackBox).not.toBeNull()
  expect(editBox).not.toBeNull()
  // Edit sits on the heading row, within the stack's own width.
  expect(editBox!.x + editBox!.width).toBeLessThanOrEqual(stackBox!.x + stackBox!.width + 1)
})

