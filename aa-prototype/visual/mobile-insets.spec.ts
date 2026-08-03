import { expect, test, type Locator, type Page } from '@playwright/test'

/**
 * The framed pixel lock for the inset contract.
 *
 * The mobile app used to hardcode twelve pixel insets that encoded
 * `PhoneFrame`'s FAKE chrome: a 54px status bar and a 34px home indicator. They
 * are now `calc()` / `max()` expressions against the four `--aa-inset-*` custom
 * properties the host publishes (see the `── The inset contract ──` block in
 * `src/theme/global.css`), so ONE layout serves both the simulated frame and
 * the installed PWA on a real handset.
 *
 * The frame publishes exactly 54 / 34, so every one of those expressions must
 * still resolve to the integer it was hardcoded to. That claim is arithmetic,
 * but arithmetic is not a test: this spec reads `getComputedStyle` on each
 * anchor through Playwright, which resolves `calc()` and `max()` for real, and
 * asserts the resolved pixel.
 *
 * Two things it buys:
 *   1. The refactor is safe to REPEAT. The next call site that swaps a literal
 *      for a `calc()` gets an arithmetic proof rather than an eyeball.
 *   2. It is the guarantee that the desktop prototype stayed PIXEL-IDENTICAL
 *      through the PWA work. The vendor workshops run on the framed build; a
 *      silent 6px drift in the card dock is the kind of thing nobody notices
 *      until it is on a projector.
 *
 * It also locks the contract's own foundation — that `.aa-inset-simulated` is
 * still on the device and still resolves 54 / 34 — so a future refactor that
 * drops the class fails loudly here instead of quietly collapsing every
 * expression to its `var()` fallback or its floor.
 */

/** Resolved computed value of `property` on the first match of `locator`. */
async function computed(locator: Locator, property: string): Promise<string> {
  return locator.first().evaluate(
    (el, prop) => getComputedStyle(el).getPropertyValue(prop),
    property,
  )
}

/**
 * The dock / tab-bar clearance a scroller reserves below its last item.
 *
 * This USED to be the scroller's own `padding-bottom`, and these expectations
 * used to read it there. It is now a `DockSpacer` at the tail instead, because
 * trailing padding contributes no scrollable extent, so a screen whose content
 * stopped just short of filling its scroller left the last item stranded under
 * the dock with nothing to scroll (see `src/shared/ui/DockSpacer.tsx`).
 *
 * Where the scroller is a flex column with a `gap`, the spacer is exactly that
 * much shorter and the gap makes up the difference, so every reserved total
 * below is unchanged from the padding it replaced.
 */
async function clearance(scroller: Locator): Promise<string> {
  const spacer = scroller.getByTestId('dock-spacer')
  await expect(spacer).toHaveCount(1)
  return computed(spacer, 'height')
}

async function openLists(page: Page): Promise<void> {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
}

/** Lists tab → the Southern Cross PM list (a DRAFT list, so the footer is live). */
async function openList(page: Page): Promise<void> {
  await openLists(page)
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(400)
}

/** ... and on into Margaret Ellison's card, which carries the completion dock. */
async function openCard(page: Page): Promise<void> {
  await openList(page)
  await page.getByText('Margaret Ellison', { exact: false }).first().click()
  await page.waitForTimeout(500)
}

test('the frame publishes the simulated insets the whole contract is measured against', async ({ page }) => {
  await openLists(page)

  const device = page.locator('.aa-inset-simulated')
  await expect(device).toHaveCount(1)

  const insets = await device.evaluate((el) => {
    const style = getComputedStyle(el)
    return {
      top: style.getPropertyValue('--aa-inset-top').trim(),
      bottom: style.getPropertyValue('--aa-inset-bottom').trim(),
      left: style.getPropertyValue('--aa-inset-left').trim(),
      right: style.getPropertyValue('--aa-inset-right').trim(),
    }
  })

  // 54 = the fake status bar, 34 = the fake home indicator. Every expectation
  // below is derived from these two numbers.
  expect(insets).toEqual({ top: '54px', bottom: '34px', left: '0px', right: '0px' })

  // The device is also the phone: the app mounts inside it.
  await expect(device.locator('[data-aa-mobile-product]')).toHaveCount(1)
})

test('Lists tab: header 64, scroller 116, tab bar 26', async ({ page }) => {
  await openLists(page)

  // calc(54 + 10)
  expect(await computed(page.getByTestId('mobile-lists-header'), 'padding-top')).toBe('64px')
  // calc(34 + 82) — no column gap on this scroller, so the spacer is the lot.
  expect(await clearance(page.getByTestId('mobile-lists-scroll'))).toBe('116px')
  // max(calc(34 - 8), 10) — the deliberate overlap onto the home indicator's
  // own 8px lower margin.
  expect(await computed(page.getByTestId('mobile-tab-bar'), 'padding-bottom')).toBe('26px')
})

test('List detail: header 60, scroller 130, submit footer 32', async ({ page }) => {
  await openList(page)

  // calc(54 + 6)
  expect(await computed(page.getByTestId('mobile-list-header'), 'padding-top')).toBe('60px')
  // calc(34 + 86), plus this column's 10px gap = the 130 it replaced.
  expect(await clearance(page.getByTestId('mobile-list-scroll'))).toBe('120px')
  // max(calc(34 - 2), 14)
  expect(await computed(page.getByTestId('mobile-list-footer'), 'padding-bottom')).toBe('32px')
})

test('Card detail: header 60, completion dock 32', async ({ page }) => {
  await openCard(page)

  // calc(54 + 6)
  expect(await computed(page.getByTestId('mobile-card-header'), 'padding-top')).toBe('60px')
  // max(calc(34 - 2), 14)
  expect(await computed(page.getByTestId('mobile-card-commit'), 'padding-bottom')).toBe('32px')
})

test('BottomSheet panel: 36', async ({ page }) => {
  await openList(page)
  await page.getByText('Add a card', { exact: false }).first().click()

  // The panel, not the scrim: `[role="dialog"]` is the sheet itself, and it is
  // inside the phone (BottomSheet is absolute to MobileApp's root).
  const sheet = page.locator('[data-aa-mobile-product] [role="dialog"]')
  await expect(sheet).toHaveCount(1)
  await page.waitForTimeout(400) // let the 320ms slide settle

  // max(calc(34 + 2), 20)
  expect(await computed(sheet, 'padding-bottom')).toBe('36px')
})

test('Availability, Balances and More: 64 top, 116 bottom', async ({ page }) => {
  await openLists(page)

  // None of these three screens has a testid, and adding one to source this
  // spec does not own would be the wrong trade. Each is reached through its
  // MobileHeader eyebrow instead: eyebrow div → text column → header row →
  // the padded element under test (the phase13 `xpath=..` idiom).
  await page.getByRole('button', { name: 'Availability' }).click()
  await page.waitForTimeout(300)
  // Availability splits the two: a `flex: none` header block, then a date
  // strip, segmented control and summary, then the scroller.
  const availabilityHeader = page.getByText('Find cover', { exact: true }).locator('xpath=../../..')
  const availabilityScroll = page.getByText('My availability', { exact: true }).locator('xpath=../../..')
  // Each walk must land on exactly one element, or the pixel below is measured
  // off whatever happened to be first.
  await expect(availabilityHeader).toHaveCount(1)
  await expect(availabilityScroll).toHaveCount(1)
  expect(await computed(availabilityHeader, 'padding-top')).toBe('64px')
  // calc(34 + 74), plus this column's 8px gap = the 116 it replaced.
  expect(await clearance(availabilityScroll)).toBe('108px')

  // Balances and More are single scroll divs carrying both paddings.
  await page.getByRole('button', { name: 'Balances' }).click()
  await page.waitForTimeout(300)
  const balances = page.getByText('Your account', { exact: true }).locator('xpath=../../..')
  await expect(balances).toHaveCount(1)
  expect(await computed(balances, 'padding-top')).toBe('64px')
  expect(await clearance(balances)).toBe('116px')

  await page.getByRole('button', { name: 'More' }).click()
  await page.waitForTimeout(300)
  const more = page.getByText('Settings', { exact: true }).locator('xpath=../../..')
  await expect(more).toHaveCount(1)
  expect(await computed(more, 'padding-top')).toBe('64px')
  expect(await clearance(more)).toBe('116px')
})

test('read-only Card scroller: 40 when the completion dock is absent', async ({ page }) => {
  await openCard(page)

  // With a dock the scroller's clearance is the MEASURED dock height plus
  // a little, plus `--aa-keyboard-inset` so the reserved space grows with the software
  // keyboard. Neither term is a safe-area inset, and the keyboard one is unset
  // outside the PWA host, so THIS spec's inset expression only shows on a card
  // with no dock. Make one: a cancelled card is read-only, drops its dock
  // (`showBar` false AND `summary` null) and stays on screen. Every card
  // the seed puts in front of the anaesthetist is either capturable or
  // completed, so both keep their dock; cancelling in-test is the reliable
  // route to the dockless branch.
  await page.getByRole('button', { name: 'Cancel card' }).click()
  const sheet = page.locator('[data-aa-mobile-product] [role="dialog"]')
  await sheet.getByLabel('Reason').fill('Inset lock: reach the dockless card layout')
  await sheet.getByRole('button', { name: 'Cancel card', exact: true }).click()
  await expect(sheet).toHaveCount(0)

  await expect(page.getByTestId('mobile-card-commit')).toHaveCount(0)
  // max(calc(34 - 6), 12), plus this column's 12px gap = the 40 it replaced.
  expect(await clearance(page.getByTestId('mobile-card-scroll'))).toBe('28px')
})
