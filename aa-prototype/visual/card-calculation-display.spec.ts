import { expect, test, type Page } from '@playwright/test'

const OFF = 'Hide the Card calculation'
const UNITS = 'Show Card units only'
const FEE = 'Show Card units and fee'

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

async function openAdminCard(page: Page): Promise<void> {
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

test('top-bar control directly selects all modes and persists across apps and reload', async ({ page }) => {
  await openMobileEllison(page)

  const control = page.getByRole('group', { name: 'Anaesthetist Card calculation' })
  const appSwitcher = page.getByRole('button', { name: /Anaesthetist Mobile App/ })
  const controlBox = await control.boundingBox()
  const switcherBox = await appSwitcher.boundingBox()
  expect(controlBox).not.toBeNull()
  expect(switcherBox).not.toBeNull()
  expect(controlBox!.x + controlBox!.width).toBeLessThanOrEqual(switcherBox!.x)
  await expect(control.getByRole('button', { name: FEE })).toHaveAttribute('aria-pressed', 'true')

  const fullCalculation = page.getByTestId('card-calculation')
  await expect(fullCalculation).toHaveAttribute('data-calculation-mode', 'fee')
  await expect(fullCalculation).toContainText('$')
  const fullDock = await page.getByTestId('mobile-card-commit').boundingBox()

  const unitsButton = control.getByRole('button', { name: UNITS })
  await unitsButton.focus()
  await page.keyboard.press('Space')
  await expect(unitsButton).toBeFocused()
  const unitsCalculation = page.getByTestId('card-calculation')
  await expect(unitsCalculation).toHaveAttribute('data-calculation-mode', 'units')
  await expect(unitsCalculation).toContainText('CARD UNITS')
  await expect(unitsCalculation).not.toContainText('$')
  await expect(page.getByRole('button', { name: 'Mark complete' })).toBeVisible()
  const unitsDock = await page.getByTestId('mobile-card-commit').boundingBox()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'visual/shots/card-calculation-mobile-units.png', fullPage: true })

  await control.getByRole('button', { name: OFF }).click()
  await expect(page.getByTestId('card-calculation')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Mark complete' })).toBeVisible()
  const offDock = await page.getByTestId('mobile-card-commit').boundingBox()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'visual/shots/card-calculation-mobile-off.png', fullPage: true })

  expect(fullDock).not.toBeNull()
  expect(unitsDock).not.toBeNull()
  expect(offDock).not.toBeNull()
  expect(unitsDock!.height).toBeLessThan(fullDock!.height)
  expect(offDock!.height).toBeLessThan(unitsDock!.height)

  await page.reload()
  await expect(page.getByRole('button', { name: OFF })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('card-calculation')).toHaveCount(0)

  await openWebEllison(page)
  await expect(page.getByRole('button', { name: OFF })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('card-calculation')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Mark complete' })).toBeVisible()
})

test('web units and off modes preserve the sticky commit rail position', async ({ page }) => {
  await openWebEllison(page)

  await page.getByRole('button', { name: UNITS }).click()
  const unitsCalculation = page.getByTestId('card-calculation')
  await expect(unitsCalculation).toHaveAttribute('data-calculation-mode', 'units')
  await expect(unitsCalculation).toContainText('CARD UNITS')
  await expect(unitsCalculation).not.toContainText('$')
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'visual/shots/card-calculation-web-units.png', fullPage: true })

  const complete = page.getByRole('button', { name: 'Mark complete' })
  const unitsBox = await unitsCalculation.boundingBox()
  const completeWithUnitsBox = await complete.boundingBox()
  expect(unitsBox).not.toBeNull()
  expect(completeWithUnitsBox).not.toBeNull()
  expect(completeWithUnitsBox!.y - (unitsBox!.y + unitsBox!.height)).toBeCloseTo(8, 0)
  expect(Math.abs(completeWithUnitsBox!.width - unitsBox!.width)).toBeLessThan(1)

  await page.getByRole('button', { name: OFF }).click()
  const asa = await page.getByText('ASA status', { exact: true }).locator('..').boundingBox()
  const completeOnlyBox = await complete.boundingBox()
  expect(asa).not.toBeNull()
  expect(completeOnlyBox).not.toBeNull()
  expect(Math.abs(asa!.y - completeOnlyBox!.y)).toBeLessThan(1)
  await expect(page.getByTestId('web-card-commit')).toHaveCSS('position', 'sticky')
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'visual/shots/card-calculation-web-off.png', fullPage: true })
  await page.locator('main').evaluate((main) => {
    main.scrollTop = 500
  })
  const stickyAt500 = await complete.boundingBox()
  await page.locator('main').evaluate((main) => {
    main.scrollTop = 700
  })
  const stickyAt700 = await complete.boundingBox()
  expect(stickyAt500).not.toBeNull()
  expect(stickyAt700).not.toBeNull()
  expect(Math.abs(stickyAt500!.y - stickyAt700!.y)).toBeLessThan(1)
})

test('completion animation follows units and off privacy modes', async ({ page }) => {
  await advanceClockTo1715(page)
  await openMobileEllison(page)
  await page.getByRole('button', { name: UNITS }).click()
  await page.getByRole('button', { name: 'Finish now' }).click()
  await page.getByRole('button', { name: 'Mark complete' }).click()
  const unitsOverlay = page.getByTestId('completion-overlay')
  await expect(unitsOverlay.getByText('Card complete', { exact: true })).toBeVisible()
  await expect(unitsOverlay.getByText(/units$/)).toBeVisible()
  await expect(unitsOverlay.getByText(/\$/)).toHaveCount(0)

  await page.goto('/demo/control')
  // Two legitimately different controls share the name "Reset demo data": the
  // harness bar's icon button (in the <header> banner, on every screen) and the
  // control panel's own explanatory card. `exact` cannot separate them because
  // both accessible names are that exact string, so scope to the routed app.
  const controlPanel = page.getByRole('main')
  await controlPanel.getByRole('button', { name: 'Reset demo data', exact: true }).click()
  await controlPanel.getByRole('button', { name: 'Confirm reset', exact: true }).click()
  await advanceClockTo1715(page)
  await openMobileEllison(page)
  await page.getByRole('button', { name: OFF }).click()
  await page.getByRole('button', { name: 'Finish now' }).click()
  await page.getByRole('button', { name: 'Mark complete' }).click()
  const offOverlay = page.getByTestId('completion-overlay')
  await expect(offOverlay.getByText('Card complete', { exact: true })).toBeVisible()
  await expect(offOverlay.getByText(/units$/)).toHaveCount(0)
  await expect(offOverlay.getByText(/\$/)).toHaveCount(0)
})

test('Admin keeps the full calculation when the anaesthetist preference is off', async ({ page }) => {
  await page.goto('/mobile')
  await page.getByRole('button', { name: OFF }).click()
  await openAdminCard(page)

  await expect(page.getByRole('button', { name: OFF })).toHaveAttribute('aria-pressed', 'true')
  const calculation = page.getByTestId('card-calculation')
  await expect(calculation).toHaveAttribute('data-calculation-mode', 'fee')
  await expect(calculation).toContainText('CARD TOTAL')
  await expect(calculation).toContainText('$')
})

test('top-bar calculation control stays contained at a narrower viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')

  const control = page.getByRole('group', { name: 'Anaesthetist Card calculation' })
  const clock = page.getByRole('button', { name: /Demo clock/ })
  const controlBox = await control.boundingBox()
  const clockBox = await clock.boundingBox()
  expect(controlBox).not.toBeNull()
  expect(clockBox).not.toBeNull()
  expect(controlBox!.x).toBeGreaterThanOrEqual(0)
  expect(clockBox!.x + clockBox!.width).toBeLessThanOrEqual(1024)
  await expect(control.getByRole('button', { name: OFF })).toBeVisible()
  await expect(control.getByRole('button', { name: UNITS })).toBeVisible()
  await expect(control.getByRole('button', { name: FEE })).toBeVisible()
})
