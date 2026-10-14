import { expect, test, type Page } from '@playwright/test'

/**
 * The PWA target, walked at real-handset size.
 *
 * This spec runs under the `pwa-device` Playwright project: the `iPhone 14 Pro`
 * descriptor (393x660 viewport, DPR 3, `isMobile`, `hasTouch`) against the PWA
 * dev server on 5174, which serves `pwa/index.html` and mounts the mobile app
 * under `MobileViewport` instead of `PhoneFrame`. The framed prototype on 5173
 * keeps its own project and its own 1440x900 desktop viewport; nothing here
 * touches it.
 *
 * It deliberately does NOT lock pixels — `visual/mobile-insets.spec.ts` does
 * that, on the frame, where the numbers are knowable. Here the point is
 * DEVICE-CORRECTNESS, which is what actually breaks when a layout designed
 * inside a 390x844 simulation meets a real viewport:
 *
 *   - the entry redirect lands on a tab, not a blank route
 *   - every screen fits the width (no horizontal document overflow) and the
 *     document itself never scrolls, because the host is `overflow: hidden`
 *     and the inner screens own scrolling
 *   - the safe-area contract resolves rather than collapsing to nothing
 *   - the self-hosted fonts really are self-hosted, so the installed app is
 *     not one airport wifi away from rendering in Helvetica
 */

/**
 * The host is `overflow: hidden` and `pwa/index.html` sets `overflow: hidden`
 * on html/body, so the DOCUMENT must never scroll in either axis. A horizontal
 * overflow is the classic phone regression (a fixed-width table, a long
 * unbroken string); a vertical one means something escaped the inner scrollers
 * and iOS will pan the whole page under the keyboard.
 */
async function expectNoDocumentScroll(page: Page, where: string): Promise<void> {
  const doc = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }))
  expect(doc.scrollWidth, `${where}: horizontal document overflow`).toBeLessThanOrEqual(doc.clientWidth)
  expect(doc.scrollHeight, `${where}: the document itself scrolled vertically`).toBeLessThanOrEqual(
    doc.clientHeight,
  )
}

/** Tab-bar-scoped, because the List header's back button is also called "Lists". */
function tab(page: Page, name: string) {
  return page.getByTestId('mobile-tab-bar').getByRole('button', { name, exact: true })
}

/**
 * Let the SlideStack land before measuring or capturing. `motion.cardAdvance`
 * is 260ms in; mid-slide the incoming layer is still translated off to the
 * right, which makes a screenshot unreadable and an overflow measurement
 * meaningless.
 */
async function settleSlide(page: Page): Promise<void> {
  await page.waitForTimeout(400)
}

test('the entry redirects to Lists, and all four tabs render within the device width', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // `/` is the browser-visited URL; the manifest's `start_url` skips this hop.
  await expect(page).toHaveURL(/\/mobile\/lists$/)
  await expect(page.getByTestId('mobile-lists-header')).toBeVisible()
  await expectNoDocumentScroll(page, 'Lists')
  await page.screenshot({ path: 'visual/shots/pwa-01-lists.png' })

  await tab(page, 'Availability').click()
  await expect(page).toHaveURL(/\/mobile\/availability$/)
  await expect(page.getByRole('group', { name: 'Availability view' })).toBeVisible()
  await expectNoDocumentScroll(page, 'Availability')
  await page.screenshot({ path: 'visual/shots/pwa-02-availability.png' })

  await tab(page, 'Balances').click()
  await expect(page).toHaveURL(/\/mobile\/balances$/)
  await expect(page.getByRole('group', { name: 'Balance section' })).toBeVisible()
  await expectNoDocumentScroll(page, 'Balances')

  await tab(page, 'More').click()
  await expect(page).toHaveURL(/\/mobile\/more$/)
  await expect(page.getByRole('button', { name: 'Reset demo data' })).toBeVisible()
  await expectNoDocumentScroll(page, 'More')

  await tab(page, 'Lists').click()
  await expect(page).toHaveURL(/\/mobile\/lists$/)
  await expectNoDocumentScroll(page, 'back on Lists')
})

test('a List opens, a Booking completes and the List submits, all within the device width', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Southern Cross PM: an ACTIVE list with one booking left to finish.
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await expect(page.getByTestId('mobile-list-header')).toBeVisible()
  await settleSlide(page)
  await expectNoDocumentScroll(page, 'List detail')
  await page.screenshot({ path: 'visual/shots/pwa-03-list.png' })

  await page.getByText('Margaret Ellison', { exact: false }).first().click()
  await expect(page.getByTestId('mobile-booking-header')).toBeVisible()
  await expect(page.getByTestId('mobile-booking-commit')).toBeVisible()
  await settleSlide(page)
  await expectNoDocumentScroll(page, 'Booking detail')
  await page.screenshot({ path: 'visual/shots/pwa-04-booking.png' })

  // The completion walk, as `visual/mobile-phase04.spec.ts` runs it, minus its
  // clock advance: that spec drives `/demo/control`, which is an AppShell
  // surface the PWA bundle deliberately does not contain. "Finish now" stamps
  // whatever the demo clock reads, and the booking completes either way.
  await page.getByRole('button', { name: 'Finish now' }).click()
  await page.getByRole('button', { name: 'Mark complete' }).click()

  // The completion overlay auto-dismisses back to the list, where the submit
  // bar is now enabled.
  const markList = page.getByRole('button', { name: 'Mark list completed' })
  await expect(markList).toBeVisible()
  await expectNoDocumentScroll(page, 'List after completion')

  await markList.click()
  await page.getByRole('button', { name: 'Submit to office' }).click()
  await expect(page.getByTestId('list-submission-overlay')).toContainText('List submitted')
  await page.screenshot({ path: 'visual/shots/pwa-05-submitted.png' })
  await expect(page.getByTestId('list-submission-overlay')).toHaveCount(0)
  await expect(page.getByText('Submitted to office', { exact: true })).toBeVisible()
  await expectNoDocumentScroll(page, 'submitted List')

  // "Play the office" defaults OFF (catch-up Phase 14): past the old 4s
  // auto-authorise delay the List is still waiting for the office.
  await page.waitForTimeout(4500)
  await expect(page.getByText('Submitted to office', { exact: true })).toBeVisible()

  // The Demo chip clears the List's submit footer.
  const chip = page.locator('[data-shot="pwa-demo-actions"]')
  await expect(chip).toBeVisible()
  await expect(chip).not.toContainText('Office auto')
  const chipBox = await chip.boundingBox()
  const footerBox = await page.getByTestId('mobile-list-footer').boundingBox()
  expect(chipBox !== null && footerBox !== null && chipBox.y + chipBox.height <= footerBox.y).toBe(true)

  // The office stand-in authorises and bills this List from the Demo sheet.
  await chip.click()
  const row = page.locator('[data-shot="pwa-demo-action-office-authorises-list"]')
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Run' }).click()
  await expect(row.getByRole('status')).toContainText('raised its invoices')
  await expect(row.getByRole('button', { name: 'Run' })).toBeDisabled()
  await page.screenshot({ path: 'visual/shots/pwa-06-office-stand-in.png' })

  // Billed = gone: the List has left the Done tab.
  await page.goto('/mobile/lists')
  await page.waitForLoadState('networkidle')
  const lists = page.locator('[data-shot="pwa-demo-actions"]')
  await expect(lists).toBeVisible()
  const listsChip = await lists.boundingBox()
  const tabBar = await page.getByTestId('mobile-tab-bar').boundingBox()
  expect(listsChip !== null && tabBar !== null && listsChip.y + listsChip.height <= tabBar.y).toBe(true)
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(page.getByText('Southern Cross')).toHaveCount(0)

  // No chip on More, which has no demo actions.
  await tab(page, 'More').click()
  await expect(page).toHaveURL(/\/mobile\/more$/)
  await expect(page.locator('[data-shot="pwa-demo-actions"]')).toHaveCount(0)
})

test('the safe-area contract resolves on the device host, at its emulation floors', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const host = page.locator('.aa-inset-device')
  await expect(host).toHaveCount(1)

  // `--aa-inset-top` is a custom property, so its computed value is still a
  // token stream (`max(0px, 12px)`), not a length. Borrow a length-typed
  // property for one tick to make the browser actually resolve it, then put it
  // back — that is the only way to read the USED value from outside the app.
  const resolvedTop = await host.evaluate((el) => {
    const previous = el.style.outlineOffset
    el.style.setProperty('outline-offset', 'var(--aa-inset-top)')
    const used = getComputedStyle(el).outlineOffset
    el.style.outlineOffset = previous
    return used
  })

  // A headless browser has no notch and no home bar, so every
  // `env(safe-area-inset-*)` reports 0. The top therefore lands on the
  // contract's own `max(…, 12px)` floor and the bottom on 0, which puts the tab
  // bar on its `max(calc(0 - 8), 10px)` floor of 10.
  //
  // On a real iPhone 14 Pro in standalone those same expressions read 59 and
  // 34 instead, giving a 69px Lists header and a 26px tab bar — the numbers
  // `visual/mobile-insets.spec.ts` locks on the frame. Asserting the floors is
  // the only honest thing to assert under emulation; asserting 59/34 here
  // would be asserting a number no headless browser can produce.
  expect(resolvedTop).toBe('12px')

  const tabBarPadding = await page
    .getByTestId('mobile-tab-bar')
    .evaluate((el) => getComputedStyle(el).paddingBottom)
  expect(tabBarPadding).toBe('10px')
  expect(Number.parseFloat(tabBarPadding)).toBeGreaterThan(0)

  // The floor propagates: the Lists header is `calc(--aa-inset-top + 10px)`.
  expect(
    await page.getByTestId('mobile-lists-header').evaluate((el) => getComputedStyle(el).paddingTop),
  ).toBe('22px')
})

test('the fonts are self-hosted and actually load', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)

  // Nothing may reach Google. An installed PWA that phones out for its type
  // renders in the system font the moment the venue wifi is unhelpful, and the
  // service worker cannot precache what it does not serve.
  const google = requests.filter(
    (url) => url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com'),
  )
  expect(google, `unexpected Google Fonts requests: ${google.join(', ')}`).toEqual([])

  // Every woff2 came from our own origin.
  const woff2 = requests.filter((url) => url.endsWith('.woff2'))
  expect(woff2.length).toBeGreaterThan(0)
  for (const url of woff2) expect(url.startsWith('http://localhost:5174/fonts/')).toBe(true)

  // `check()` alone would also pass if the family silently fell back to a
  // system font, so pair it with the FontFace set: each family must have a
  // face that really reached `loaded`. (The latin-ext subsets stay `unloaded`
  // by design; nothing on screen needs them.)
  expect(await page.evaluate(() => document.fonts.check('16px "Schibsted Grotesk"'))).toBe(true)
  expect(await page.evaluate(() => document.fonts.check('16px "Spline Sans Mono"'))).toBe(true)

  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family),
  )
  expect(loaded).toContain('Schibsted Grotesk')
  expect(loaded).toContain('Spline Sans Mono')
})

test('the office stand-in assigns a List to the next free session, from the Lists Demo sheet (catch-up Phase 28)', async ({ page }) => {
  await page.goto('/mobile/lists')
  await page.evaluate(() => window.localStorage.clear())
  await page.goto('/mobile/lists')
  await page.waitForLoadState('networkidle')
  // Dr Souter's next free session from Tue 21 Jul is Wed 22 PM ("Open for cover").
  const session = page.locator('[data-slot-id="S-34821-2026-07-22-PM"]')
  await page.getByRole('button', { name: 'Month', exact: true }).click()
  await expect(session).toContainText('Free session')

  await page.locator('[data-shot="pwa-demo-actions"]').click()
  const row = page.locator('[data-shot="pwa-demo-action-office-assigns-next-free"]')
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Run' }).click()
  await expect(row.getByRole('status')).toContainText("Assigned St George's · Mr T. Hale to your Wed 22 Jul PM session.")
  await page.screenshot({ path: 'visual/shots/pwa-07-office-assigns.png' })
  await row.getByRole('button', { name: 'Run' }).click()
  await expect(row.getByRole('status')).not.toContainText('Wed 22 Jul PM')
  await page.keyboard.press('Escape')

  await page.goto('/mobile/lists')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Month', exact: true }).click()
  await expect(session).toHaveAttribute('data-list-id', /^LG\d{4}$/)
  await expect(session).toContainText("St George's")
  await page.screenshot({ path: 'visual/shots/pwa-08-assigned-row.png' })
})

test('the office stand-in assigns a waiting request to Dr Souter, from the Lists Demo sheet (catch-up Phase 31)', async ({ page }) => {
  await page.goto('/mobile/lists')
  await page.evaluate(() => window.localStorage.clear())
  await page.goto('/mobile/lists')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="pwa-demo-actions"]').click()
  const row = page.locator('[data-shot="pwa-demo-action-office-assigns-draft-list"]')
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Run' }).click()
  const status = row.getByRole('status')
  await expect(status).toContainText('The office assigned a waiting request to your Wed 22 Jul PM: Forte Health · Mr V. Nand, 2 bookings.')
  const text = (await status.textContent()) ?? ''
  expect(/Draft List|slot|preferred|tier/i.test(text)).toBe(false)
  await page.screenshot({ path: 'visual/shots/pwa-09-office-assigns-draft.png' })
  await page.keyboard.press('Escape')

  await page.goto('/mobile/lists')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Month', exact: true }).click()
  const session = page.locator('[data-slot-id="S-34821-2026-07-22-PM"]')
  await expect(session).toHaveAttribute('data-list-id', 'LD-002')
  await expect(session).toContainText('Forte Health')
  // No Draft List shows on any PWA screen.
  expect(/Draft List|Unassigned/.test(await page.locator('body').innerText())).toBe(false)
  await page.screenshot({ path: 'visual/shots/pwa-10-draft-assigned-row.png' })
})

test('a colleague moves a List into my free session, then I return one of mine to the office (catch-up Phase 32)', async ({ page }) => {
  await page.goto('/mobile/availability')
  await page.evaluate(() => window.localStorage.clear())
  await page.goto('/mobile/availability')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="pwa-demo-actions"]').click()
  const row = page.locator('[data-shot="pwa-demo-action-colleague-moves-list-to-me"]')
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Run' }).click()
  const status = row.getByRole('status')
  await expect(status).toContainText('into your free session.')
  expect(/Draft List|slot|prefer|tier/i.test((await status.textContent()) ?? '')).toBe(false)
  await page.screenshot({ path: 'visual/shots/pwa-11a-colleague-stand-in.png' })
  // Close the Demo sheet (tap its scrim), then the notice shows on Find cover.
  await page.reload()
  await page.waitForLoadState('networkidle')
  const notice = page.locator('[data-shot="moved-to-you"]')
  await expect(notice).toContainText('to you.')
  await page.screenshot({ path: 'visual/shots/pwa-11-moved-to-you.png' })

  // The List is on Forward Lists with "New".
  await page.goto('/mobile/lists')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="list-row-badge"]').first()).toHaveText('New')
  await page.screenshot({ path: 'visual/shots/pwa-12-new-on-lists.png' })

  // Return one of her own Lists to the office from List detail: it leaves Forward Lists.
  await page.goto('/mobile/lists/L-34821-2026-07-23-AM')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="list-move"]').click()
  const sheet = page.locator('[data-shot="move-sheet"]')
  await sheet.locator('[data-shot="move-choice-office"]').click()
  await sheet.getByRole('button', { name: 'Move List' }).click()
  await expect(sheet.locator('[data-shot="move-done"]')).toContainText('Returned to the office')
  await page.screenshot({ path: 'visual/shots/pwa-13-returned.png' })
  await sheet.getByRole('button', { name: 'Done' }).click()
  await expect(page).toHaveURL(/\/mobile\/lists$/)
  await expect(page.locator('[data-list-id="L-34821-2026-07-23-AM"]')).toHaveCount(0)
})
