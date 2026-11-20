import { expect, test, type Locator, type Page } from '@playwright/test'

async function openBooking(page: Page): Promise<void> {
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

  await openBooking(page)
  const disabledButton = page.locator('[data-aa-mobile-product] button:disabled').first()
  await expect(disabledButton).toBeVisible()
  await disabledButton.scrollIntoViewIfNeeded()
  const disabledTransform = await holdAtCentre(page, disabledButton)
  expect(disabledTransform).toBe('none')
  await page.mouse.up()
})

test('reduced motion removes geometric press and selection travel', async ({ page }) => {
  // The ASA and pre-assessment segmented bands went in catch-up Phase 19b (the
  // modifiers are an itemised list now); the Availability view toggle carries
  // the segmented-control half of this check.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openBooking(page)
  await expect(page.getByTestId('time-action-slider')).toHaveCSS('transition-property', 'opacity')

  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Availability' }).click()
  const view = page.getByRole('group', { name: 'Availability view' })
  await expect(view.locator('[data-sliding-segment-indicator]')).toHaveCSS('transition-property', 'opacity')
  const option = view.getByRole('button', { name: 'Free only' })
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
  // Catch-up Phase 38: the current month of the GST report (payments AA passed on), not amounts received.
  await expect(page.locator('[data-shot=balances-gst-month-header]')).toContainText('July 2026 · paid to you')
  await page.screenshot({ path: 'visual/shots/mobile-native-balances.png', fullPage: true })

  await page.goto('/mobile')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(300)
  await page.getByText('Add a booking', { exact: false }).first().click()
  await expect(page.getByRole('heading', { name: 'Add a booking' })).toBeVisible()
  // Catch-up Phase 20: the billing-route segmented control left this sheet (the
  // Contract is chosen on the step rail), so the sheet now carries no segment to
  // align; shoot its Contract row instead.
  await page.locator('[data-shot=manual-contract]').scrollIntoViewIfNeeded()
  await expect(page.locator('[data-shot=manual-contract]')).toContainText('Not chosen')
  await expect(page.locator('[role="dialog"] [data-sliding-segmented-control]')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/mobile-native-sheet-segment.png', fullPage: true })
})

test('Start now becomes the travelling Finish action without a validation-focus flash', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(300)
  await page.getByText('Add a booking', { exact: false }).first().click()
  await expect(page.getByRole('heading', { name: 'Add a booking' })).toBeVisible()

  await page.getByLabel('NHI').fill('ZZZ9005')
  await page.getByLabel('Name').fill('Timer Motion Test')
  await page.getByLabel('Date of birth').fill('1980-01-01')
  await page.getByLabel('Procedure description').fill('Timer interaction review')
  await page.getByRole('button', { name: 'Save booking' }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await page.getByText('Timer Motion Test', { exact: true }).click()

  const start = page.getByRole('button', { name: 'Start now' })
  await start.scrollIntoViewIfNeeded()
  const slider = page.getByTestId('time-action-slider')
  await expect(slider).toHaveAttribute('data-position', 'left')
  await start.evaluate((element) => {
    const retained = element as HTMLElement & { retainedAcrossSlide?: boolean }
    retained.retainedAcrossSlide = true
  })

  // Press and release by hand, because the point is to observe the held state
  // BETWEEN the two. `hover()` rather than a measured box + `mouse.move`: the
  // freshly opened Booking is still settling (the slide-in, then the reveal +
  // scroll), so a box measured here was ~60px stale by `mouse.up` and the
  // release landed off the button — the press never registered and the slider
  // never travelled. `hover()` runs the stability check, so the cursor lands
  // only once the button has stopped moving.
  await start.hover()
  await page.mouse.down()
  await page.waitForTimeout(45)
  expect(await start.evaluate((element) => getComputedStyle(element).outlineColor)).not.toBe('rgb(194, 64, 60)')
  await page.mouse.up()

  const finish = page.getByRole('button', { name: 'Finish now' })
  await expect(slider).toHaveAttribute('data-position', 'right')
  expect(
    await finish.evaluate(
      (element) =>
        (element as HTMLElement & { retainedAcrossSlide?: boolean }).retainedAcrossSlide,
    ),
  ).toBe(true)
  expect(await finish.evaluate((element) => getComputedStyle(element).outlineColor)).not.toBe('rgb(194, 64, 60)')
  expect(await slider.evaluate((element) => element.getAnimations().length)).toBeGreaterThan(0)
  await expect(page.getByText('Start', { exact: true })).toBeVisible()
  await expect(page.getByText('08:00', { exact: true })).toBeVisible()
  await expect(page.getByText('Stamped from the demo clock')).toHaveCount(0)
  await page.waitForTimeout(90)
  await page.screenshot({ path: 'visual/shots/mobile-time-action-slide.png', fullPage: true })

  // An RVG code makes the times required (the code itself is optional since
  // catch-up Phase 19), so Mark complete finds the missing handover.
  // The RVG code sits in the Billing sheet (owner review, 2026-11-16): tap the card,
  // set Patient › Standard (No contract · RVG, the lone Contract, is picked), then the code.
  await page.locator('[data-shot=capture-billing]').first().click()
  const sheet = page.locator('[data-shot=billing-sheet]')
  await sheet.locator('[data-rail-option=patient]').first().click()
  // Payment type always asks; the anaesthetist takes Standard (Prepaid is the office's).
  await sheet.locator('[data-rail-option=standard]').first().click()
  await sheet.locator('input[role=combobox]').fill('H1')
  await sheet.locator('button[data-rvg-code=H1]').first().click()
  await expect(sheet.locator('[data-shot=capture-procedure-code]')).toContainText('B 4')
  await page.getByRole('button', { name: 'Done' }).click()
  await page.getByRole('button', { name: 'Mark complete' }).click()
  const validationFocus = page.locator('[data-validation-focus="true"]')
  await expect(validationFocus).toBeFocused()
  await expect(validationFocus).toHaveCSS('outline-color', 'rgb(194, 64, 60)')
})
