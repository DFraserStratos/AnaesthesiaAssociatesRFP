import { expect, test } from '@playwright/test'

test('global demo clock advances live, stays on route and persists across reload', async ({ page }) => {
  await page.goto('/admin/day/2026-07-21')
  await page.waitForLoadState('networkidle')

  // Enter a routed Card first: clock use must not interrupt the workflow being presented.
  await page.getByText("St George's").first().click()
  await page.getByRole('button', { name: 'Open', exact: true }).first().click()
  await expect(page).toHaveURL(/\/admin\/day\/2026-07-21\/cards\/[^/]+$/)
  await expect(page.getByText(/Office billing setup/).first()).toBeVisible()
  const cardURL = page.url()

  const appSwitcher = page.getByRole('button', { name: /Admin Web App/ })
  const trigger = page.getByRole('button', { name: /Demo clock/ })
  await expect(trigger).toContainText('8:00')

  const switcherBox = await appSwitcher.boundingBox()
  const triggerBox = await trigger.boundingBox()
  expect(switcherBox).not.toBeNull()
  expect(triggerBox).not.toBeNull()
  expect(triggerBox!.x).toBeGreaterThan(switcherBox!.x + switcherBox!.width)

  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: /Tuesday 21 July 2026/ })
  await expect(dialog).toBeVisible()

  const shortcutNames = [
    '+15 min',
    '+1 hour',
    'Next day',
    'Next morning',
    '+7 days',
    'Procedure day · 28 Jul',
  ] as const
  for (const name of shortcutNames) {
    await expect(dialog.getByRole('button', { name, exact: true })).toBeVisible()
  }

  // The popup is keyboard-reachable and Escape closes it while restoring focus.
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: '+15 min', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()

  await trigger.click()
  const openDialog = page.getByRole('dialog', { name: /Tuesday 21 July 2026/ })
  await openDialog.getByRole('button', { name: '+1 hour', exact: true }).click()
  await expect(openDialog).toBeVisible()
  await expect(openDialog).toContainText('9:00')
  await expect(trigger).toContainText('9:00')
  expect(page.url()).toBe(cardURL)

  // Procedure day resets the target to 08:00; the same open popup can then add an hour.
  await openDialog.getByRole('button', { name: 'Procedure day · 28 Jul', exact: true }).click()
  const procedureDialog = page.getByRole('dialog', { name: /Tuesday 28 July 2026/ })
  await expect(procedureDialog).toContainText('8:00')
  await expect(
    procedureDialog.getByRole('button', { name: 'Procedure day · 28 Jul', exact: true }),
  ).toBeDisabled()
  await procedureDialog.getByRole('button', { name: '+1 hour', exact: true }).click()
  await expect(procedureDialog).toContainText('9:00')

  const dialogBox = await procedureDialog.boundingBox()
  const viewport = page.viewportSize()
  expect(dialogBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(dialogBox!.x).toBeGreaterThanOrEqual(0)
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(viewport!.width)

  await page.screenshot({ path: 'visual/shots/shell-clock-open.png' })

  // Outside click closes the popup without changing the route.
  await page.locator('main').click({ position: { x: 20, y: 20 } })
  await expect(procedureDialog).toBeHidden()
  expect(page.url()).toBe(cardURL)
  await expect(page.getByText(/Office billing setup/).first()).toBeVisible()

  // The store and router both persist, although normal clock use needs no reload.
  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(page.url()).toBe(cardURL)
  await expect(page.getByText(/Office billing setup/).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Demo clock/ })).toContainText('9:00')
})
