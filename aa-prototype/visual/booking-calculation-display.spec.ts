import { expect, test, type Page } from '@playwright/test'

/**
 * The anaesthetist Booking carries no calculation: only Mark complete is pinned,
 * and the completion moment shows no units or fee. The office Booking keeps the
 * full fee panel.
 */

async function openMobileEllison(page: Page): Promise<void> {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.getByText('Margaret Ellison', { exact: false }).first().click()
  await expect(page.getByText('ASA status', { exact: true })).toBeVisible()
  await page.waitForTimeout(600)
}

async function openWebEllison(page: Page): Promise<void> {
  await page.goto('/web/lists')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross').first().click()
  await page.getByText('Margaret Ellison').first().click()
  await expect(page.getByText('ASA status', { exact: true })).toBeVisible()
  await page.waitForTimeout(200)
}

async function openAdminBooking(page: Page): Promise<void> {
  await page.goto('/admin/day/2026-07-21')
  await page.waitForLoadState('networkidle')
  await page.getByText("St George's").first().click()
  await page.getByRole('button', { name: 'Open', exact: true }).first().click()
  await expect(page.getByText(/Office billing setup/).first()).toBeVisible()
}

async function advanceClockTo1715(page: Page): Promise<void> {
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  for (let i = 0; i < 9; i++) {
    await page.getByRole('button', { name: '+1 hour', exact: true }).click()
  }
  await page.getByRole('button', { name: '+15 min', exact: true }).click()
}

test('mobile anaesthetist Booking pins Mark complete alone and completes without a calculation', async ({ page }) => {
  await advanceClockTo1715(page)
  await openMobileEllison(page)

  await expect(page.getByRole('group', { name: 'Anaesthetist Booking calculation' })).toHaveCount(0)
  await expect(page.getByTestId('booking-calculation')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Mark complete' })).toBeVisible()

  await page.getByRole('button', { name: 'Finish now' }).click()
  await page.getByRole('button', { name: 'Mark complete' }).click()
  const overlay = page.getByTestId('completion-overlay')
  await expect(overlay.getByText('Booking complete', { exact: true })).toBeVisible()
  await expect(overlay.getByText(/units/)).toHaveCount(0)
  await expect(overlay.getByText(/\$/)).toHaveCount(0)
})

test('web anaesthetist Booking rail carries Mark complete alone, level with ASA and sticky', async ({ page }) => {
  await openWebEllison(page)

  await expect(page.getByTestId('booking-calculation')).toHaveCount(0)
  const complete = page.getByRole('button', { name: 'Mark complete' })
  const asa = await page.getByText('ASA status', { exact: true }).locator('..').boundingBox()
  const completeBox = await complete.boundingBox()
  expect(asa).not.toBeNull()
  expect(completeBox).not.toBeNull()
  expect(Math.abs(asa!.y - completeBox!.y)).toBeLessThan(1)
  await expect(page.getByTestId('web-booking-commit')).toHaveCSS('position', 'sticky')
})

test('Admin Booking keeps the full fee panel', async ({ page }) => {
  await openAdminBooking(page)

  const calculation = page.getByTestId('booking-calculation')
  await expect(calculation).toContainText('BOOKING TOTAL')
  await expect(calculation).toContainText('$')
})
