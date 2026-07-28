import { expect, test, type Locator, type Page } from '@playwright/test'

async function openCard(page: Page): Promise<void> {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(300)
  await page.getByText('Margaret Ellison', { exact: false }).first().click()
  await page.waitForTimeout(350)
}

async function holdAtCentre(page: Page, locator: Locator): Promise<string> {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(55)
  return locator.evaluate((element) => getComputedStyle(element).transform)
}

async function indicatorPosition(indicator: Locator): Promise<{ x: number; y: number }> {
  return indicator.evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform)
    return { x: matrix.m41, y: matrix.m42 }
  })
}

async function expectHighlightAligned(group: Locator): Promise<void> {
  const indicator = group.locator('[data-sliding-segment-indicator]')
  const selected = group.locator('button[aria-pressed="true"]')
  const indicatorBox = await indicator.boundingBox()
  const selectedBox = await selected.boundingBox()
  expect(indicatorBox).not.toBeNull()
  expect(selectedBox).not.toBeNull()
  expect(Math.abs(indicatorBox!.x - selectedBox!.x)).toBeLessThan(1)
  expect(Math.abs(indicatorBox!.y - selectedBox!.y)).toBeLessThan(1)
  expect(Math.abs(indicatorBox!.width - selectedBox!.width)).toBeLessThan(1)
  expect(Math.abs(indicatorBox!.height - selectedBox!.height)).toBeLessThan(1)
}

test('mobile buttons compress while held without affecting presenter controls', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')

  const listButton = page
    .getByText('Southern Cross', { exact: false })
    .first()
    .locator('xpath=ancestor::button[1]')
  const pressedTransform = await holdAtCentre(page, listButton)
  expect(pressedTransform).not.toBe('none')
  await page.mouse.up()
  await page.waitForTimeout(120)
  await expect(listButton).toHaveCSS('transform', 'none')

  const presenterButton = page.getByRole('button', { name: 'Zoom out' })
  const presenterTransform = await holdAtCentre(page, presenterButton)
  expect(presenterTransform).toBe('none')
  await page.mouse.up()

  await openCard(page)
  const disabledButton = page.locator('[data-aa-mobile-product] button:disabled').first()
  await expect(disabledButton).toBeVisible()
  await disabledButton.scrollIntoViewIfNeeded()
  const disabledTransform = await holdAtCentre(page, disabledButton)
  expect(disabledTransform).toBe('none')
  await page.mouse.up()
})

test('ASA and modifier highlights slide horizontally and across the two-column grid', async ({ page }) => {
  await openCard(page)

  const asa = page.getByRole('group', { name: 'ASA physical status' })
  await asa.scrollIntoViewIfNeeded()
  const asaIndicator = asa.locator('[data-sliding-segment-indicator]')
  const asaStart = await indicatorPosition(asaIndicator)
  await asa.getByRole('button', { name: 'IV', exact: true }).click()
  await expect(asaIndicator).toHaveAttribute('data-selected-value', 'AS4')
  expect(await asaIndicator.evaluate((element) => element.getAnimations().length)).toBeGreaterThan(0)
  await page.waitForTimeout(220)
  const asaEnd = await indicatorPosition(asaIndicator)
  expect(asaEnd.x).not.toBe(asaStart.x)
  expect(Math.abs(asaEnd.y - asaStart.y)).toBeLessThan(1)

  const preAssessment = page.getByRole('group', { name: 'Pre-assessment' })
  await preAssessment.scrollIntoViewIfNeeded()
  const standard = preAssessment.getByRole('button', { name: /Standard/ })
  if ((await standard.getAttribute('aria-pressed')) !== 'true') {
    await standard.click()
    await page.waitForTimeout(220)
  }
  const modifierIndicator = preAssessment.locator('[data-sliding-segment-indicator]')
  const modifierStart = await indicatorPosition(modifierIndicator)
  await preAssessment.getByRole('button', { name: /Phone, complex/ }).click()
  await expect(modifierIndicator).toHaveAttribute('data-selected-value', 'PA2')
  expect(await modifierIndicator.evaluate((element) => element.getAnimations().length)).toBeGreaterThan(0)
  await page.waitForTimeout(220)
  const modifierEnd = await indicatorPosition(modifierIndicator)
  expect(modifierEnd.x).not.toBe(modifierStart.x)
  expect(modifierEnd.y).not.toBe(modifierStart.y)

  await page.screenshot({ path: 'visual/shots/mobile-native-segments.png', fullPage: true })
})

test('reduced motion removes geometric press and selection travel', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openCard(page)

  const asa = page.getByRole('group', { name: 'ASA physical status' })
  await asa.scrollIntoViewIfNeeded()
  const asaIndicator = asa.locator('[data-sliding-segment-indicator]')
  await expect(asaIndicator).toHaveCSS('transition-property', 'opacity')

  const option = asa.getByRole('button', { name: 'IV', exact: true })
  const pressedTransform = await holdAtCentre(page, option)
  expect(pressedTransform).toBe('none')
  await page.mouse.up()
  await option.click()
  await expect(option).toHaveAttribute('aria-pressed', 'true')
})

test('secondary-screen and bottom-sheet highlights stay aligned', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Availability' }).click()
  const availability = page.getByRole('group', { name: 'Availability view' })
  await expectHighlightAligned(availability)
  await availability.getByRole('button', { name: 'Free only' }).click()
  await page.waitForTimeout(220)
  await expectHighlightAligned(availability)
  await page.screenshot({ path: 'visual/shots/mobile-native-availability.png', fullPage: true })

  await page.getByRole('button', { name: 'Balances' }).click()
  const balances = page.getByRole('group', { name: 'Balance section' })
  await balances.getByRole('button', { name: 'GST this month' }).click()
  await page.waitForTimeout(220)
  await expectHighlightAligned(balances)
  await page.screenshot({ path: 'visual/shots/mobile-native-balances.png', fullPage: true })

  await page.goto('/mobile')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(300)
  await page.getByText('Add a card', { exact: false }).first().click()
  await page.getByText('Enter manually', { exact: false }).first().click()
  await page.getByText('Billing route', { exact: true }).scrollIntoViewIfNeeded()
  const formSegment = page.locator('[role="dialog"] [data-sliding-segmented-control]').first()
  await expectHighlightAligned(formSegment)
  await page.screenshot({ path: 'visual/shots/mobile-native-sheet-segment.png', fullPage: true })
})
