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
