import { test, expect, type Page } from '@playwright/test'

/**
 * Desktop card-detail regressions that only a browser can catch: the paired
 * capture cards matching heights, and the attachment add/remove cycle (whose
 * id allocation lives in the component, not the store, so no Vitest test
 * reaches it).
 */

async function openEllison(page: Page): Promise<void> {
  await page.goto('/web')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Lists', exact: true }).click()
  await page.getByText('Southern Cross').first().click()
  await page.getByText('Margaret Ellison').first().click()
  await expect(page.getByText('ASA status', { exact: true })).toBeVisible()
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

test('desktop Card total starts level with the first capture-card pair', async ({ page }) => {
  await openEllison(page)
  const asa = await cardByLabel(page, 'ASA status').boundingBox()
  const total = await page.getByText('CARD TOTAL', { exact: true }).locator('../../..').boundingBox()

  expect(asa).not.toBeNull()
  expect(total).not.toBeNull()
  expect(Math.abs(asa!.y - total!.y)).toBeLessThan(1)
})

test('desktop completion action is separate and matches the Card total width', async ({ page }) => {
  await openEllison(page)
  const total = await page.getByText('CARD TOTAL', { exact: true }).locator('../../..').boundingBox()
  const complete = await page.getByRole('button', { name: 'Mark complete' }).boundingBox()
  const stickyBackdrop = page.getByTestId('web-card-commit')
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
  const pageHeader = page.getByTestId('web-card-header')
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

test('attachments add and remove, and indexes never collide', async ({ page }) => {
  await openEllison(page)
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Add photo' }).click()
  await expect(page.getByRole('button', { name: /^Remove Photo/ })).toHaveCount(3)

  // Hidden until the thumbnail is hovered, but mounted the whole time so a
  // keyboard can still reach it.
  const removeSecond = page.getByRole('button', { name: 'Remove Photo 2' })
  await expect(removeSecond).toHaveCSS('opacity', '0')
  await removeSecond.hover()
  await expect(removeSecond).toHaveCSS('opacity', '1')
  await removeSecond.focus()
  await expect(removeSecond).toHaveCSS('opacity', '1')

  await removeSecond.click()
  await expect(page.getByRole('button', { name: /^Remove Photo/ })).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Remove Photo 1' })).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Remove Photo 3' })).toHaveCount(1)

  // The next photo counts past the highest index used, so it can neither
  // collide with Photo 3's id nor land out of order in the row.
  await page.getByRole('button', { name: 'Add photo' }).click()
  await expect(page.getByRole('button', { name: /^Remove Photo/ })).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Remove Photo 4' })).toHaveCount(1)

  // Removing every one returns the empty state.
  for (const name of ['Remove Photo 1', 'Remove Photo 3', 'Remove Photo 4']) {
    await page.getByRole('button', { name }).click()
  }
  await expect(page.getByText('No attachments.')).toBeVisible()
})
