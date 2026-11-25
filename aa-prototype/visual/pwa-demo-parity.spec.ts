import { expect, test, type Page } from '@playwright/test'

/**
 * Catch-up Phase 44, item 4: the installed PWA's Demo chip, screen by screen,
 * on the `pwa-device` project (iPhone 14 Pro on the PWA server). Each test
 * starts signed out and signs in through catch-up Phase 43a's sign-in screen,
 * which keeps the deep link, so the route under test is the one signed in to.
 * "Play the office" is never touched: it stays OFF, its default, and the chip
 * never shows "Office auto".
 *
 * SCREENS is the expected table, one row per mobile screen, built from the
 * registry (`src/shared/demoTriggers/registry.ts`): the entries whose surfaces
 * include 'pwa' and whose routes match the screen, minus those gated by a
 * `when` the screen alone does not satisfy (WHEN_GATED, each with its reason;
 * where the state can be driven, a row of its own drives it). Since catch-up
 * Phase 43a the app-wide Sign out puts the chip on every mobile screen, so the chip is absent only while a product sheet
 * is open that no entry acts over.
 *
 * Every row also checks 17's privacy boundary end to end: no mobile screen, and
 * no Demo sheet on it, renders a preference, a pairing or a tier.
 *
 * Not a row: "the prepaid list under the profile". The PWA's More shows the
 * profile as a card with no prepaid list beneath it (the prepayment lives on
 * the Contract, kept by the office), so there is no such mobile screen to check.
 */

test.use({ storageState: { cookies: [], origins: [] } })

const LABELS = {
  'stage-post-op': 'Stage post-op scenario',
  'office-authorises-list': 'Office authorises this List',
  'office-reviews-additional-invoice': 'Office reviews this event',
  'office-reviews-credit': 'Office reviews this credit',
  'office-assigns-next-free': 'Office assigns a List to my next free session',
  'office-adds-out-of-hours-list': 'The office adds an out-of-hours List for me tonight',
  'availability-office-sets-public': 'Office sets this session to Public',
  'office-assigns-draft-list': 'Office assigns a Draft List to me',
  'office-resolves-alert': 'Office resolves this alert',
  'office-approves-contract-change': 'Office approves this Contract change',
  'colleague-moves-list-to-me': 'Colleague moves a List into my free session',
  'colleague-moves-booking-to-me': 'Colleague moves a Booking to me',
  'prepayment-two-days-before': 'Move to 2 days before procedure',
  'pwa-office-approves-prepayment': 'Office approves and sends the prepayment invoice',
  'pwa-office-sends-prepayment-reminder': 'Office sends a prepayment reminder',
  'raise-sample-warnings': 'Raise sample warnings',
  'clear-sample-warnings': 'Clear sample warnings',
  'office-clears-warning': 'Office clears this warning',
  'office-sets-booking-contract': "Office sets this Booking's Contract",
  'photo-capture-future': 'Photo capture (Future scope)',
  'matching-office-matches-row': 'Hospital file imported and my booking matched',
  'stub-office-adds-nhi': 'Office adds the NHI to this stub',
  'pwa-office-adds-nhi': 'Office adds the NHI',
  'pwa-office-runs-payables': "Office runs this week's payment cycle",
  'pwa-payment-full': 'Payment received · full',
  'pwa-payment-half': 'Payment received · half',
  'load-multi-procedure-booking': 'Load 3-procedure Booking (7 modifier units)',
  'feed-changes-primary': 'Hospital feed changes the primary',
  'office-edits-booking': 'Office edits this Booking',
  'nhi-hub-mode': 'Hub: Available / Slow / Unavailable',
  'pwa-sign-out': 'Sign out',
  'support-help-line-responds': 'Help line responds to this request',
} as const

type PwaEntry = keyof typeof LABELS

/** PWA entries gated by a `when` that a screen alone does not satisfy; a row drives the state where it can. */
const WHEN_GATED: Readonly<Partial<Record<PwaEntry, string>>> = {
  'nhi-hub-mode': 'Only while an NHI lookup surface is open (`nhiHub.inUse`, catch-up Phase 40a). Driven: "A List · Add a booking open".',
  'support-help-line-responds': 'Only while Help is open (`support.tab` = helpLine, catch-up Phase 43b). Driven: "More · Help open".',
  'availability-office-sets-public': 'Only once a day was opened in My calendar\'s session panel (`mobileCalendar.day`, catch-up Phase 32d). Driven: "Availability · My calendar, after opening a day".',
  'feed-changes-primary': 'Only on a Booking with two or more Procedures (catch-up Phase 23). Driven: "A Booking with three Procedures (after Load 3-procedure Booking)".',
}

const ALWAYS: readonly PwaEntry[] = ['pwa-sign-out']
const LISTS: readonly PwaEntry[] = ['stage-post-op', 'office-assigns-next-free', 'office-adds-out-of-hours-list', 'office-assigns-draft-list', 'colleague-moves-booking-to-me', 'matching-office-matches-row', ...ALWAYS]
const A_LIST: readonly PwaEntry[] = ['stage-post-op', 'office-authorises-list', 'office-resolves-alert', 'colleague-moves-booking-to-me', 'photo-capture-future', 'matching-office-matches-row', 'stub-office-adds-nhi', 'pwa-office-adds-nhi', 'load-multi-procedure-booking', ...ALWAYS]
const A_BOOKING: readonly PwaEntry[] = [
  'stage-post-op', 'office-authorises-list', 'office-reviews-additional-invoice', 'office-reviews-credit', 'office-resolves-alert',
  'office-approves-contract-change', 'colleague-moves-booking-to-me', 'prepayment-two-days-before', 'pwa-office-approves-prepayment',
  'pwa-office-sends-prepayment-reminder', 'raise-sample-warnings', 'clear-sample-warnings', 'office-clears-warning',
  'office-sets-booking-contract', 'matching-office-matches-row', 'pwa-office-adds-nhi', 'pwa-payment-full', 'pwa-payment-half',
  'load-multi-procedure-booking', 'office-edits-booking', ...ALWAYS,
]
const LIST_ID = 'L-34821-2026-11-24-PM'
const BOOKING_ID = 'BK0009'

interface ScreenRow {
  screen: string
  path: string
  /** After signing in on `path`: bring up the state the row checks. */
  drive?: (page: Page) => Promise<void>
  /** 'absent': no chip (a product sheet is open and no entry acts over it). Otherwise the entries the sheet lists, exactly. */
  chip: 'absent' | readonly PwaEntry[]
}

async function settle(page: Page, ms = 400): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(ms)
}

const SCREENS: readonly ScreenRow[] = [
  { screen: 'Lists', path: '/mobile/lists', chip: LISTS },
  {
    screen: 'Lists · search',
    path: '/mobile/lists',
    drive: async (page) => {
      await page.getByRole('searchbox', { name: 'Search your Bookings' }).fill('Mitchell')
      await expect(page).toHaveURL(/\?q=Mitchell$/)
      await expect(page.locator('[data-shot="mobile-lookback-search"]')).toBeVisible()
    },
    chip: LISTS,
  },
  { screen: 'A List', path: `/mobile/lists/${LIST_ID}`, chip: A_LIST },
  {
    screen: 'A List · Add a booking open',
    path: `/mobile/lists/${LIST_ID}`,
    drive: async (page) => {
      await page.getByRole('button', { name: /Add a booking/ }).first().click()
      await expect(page.getByRole('dialog').getByRole('heading', { name: 'Add a booking' })).toBeVisible()
    },
    // The Hub entry acts over the open sheet, so the chip rises above it (catch-up Phase 40a).
    chip: [...A_LIST, 'nhi-hub-mode'],
  },
  {
    screen: 'A Booking, with its descriptions and events list',
    path: `/mobile/lists/${LIST_ID}/bookings/${BOOKING_ID}`,
    drive: async (page) => {
      await expect(page.locator('[data-shot="procedure-text"]').first()).toBeAttached()
      await expect(page.locator('[data-shot="procedure-events"]').first()).toBeAttached()
    },
    chip: A_BOOKING,
  },
  {
    screen: 'A Booking with three Procedures (after Load 3-procedure Booking)',
    // Dr Souter's next open List after Tue 21 Jul, where the entry stages the Booking (as `pwa-device.spec.ts` does).
    path: '/mobile/lists/L-34821-2026-11-25-AM',
    drive: async (page) => {
      await page.locator('[data-shot="pwa-demo-actions"]').click()
      const load = page.locator('[data-shot="pwa-demo-action-load-multi-procedure-booking"]')
      await load.getByRole('button', { name: 'Run' }).click()
      await expect(load.getByRole('status')).toContainText('3 procedures, 7 modifier units')
      await page.keyboard.press('Escape')
      await expect(load).toBeHidden()
      // The staged Booking takes the next Booking id after the whole practice's last (BK5101, as in `pwa-device.spec.ts`).
      await page.goto('/mobile/lists/L-34821-2026-11-25-AM/bookings/BK5101')
      await settle(page)
      await expect(page.locator('[data-shot="procedure-primary-pill"]').first()).toBeVisible()
    },
    chip: [...A_BOOKING.slice(0, -ALWAYS.length), 'feed-changes-primary', ...ALWAYS],
  },
  { screen: 'Availability', path: '/mobile/availability', chip: ['colleague-moves-list-to-me', ...ALWAYS] },
  { screen: 'Availability · My calendar', path: '/mobile/availability/calendar', chip: ALWAYS },
  {
    screen: 'Availability · My calendar, after opening a day',
    path: '/mobile/availability/calendar',
    drive: async (page) => {
      await page.locator('[data-shot="mobile-availability-grid"] button[data-date="2026-11-25"]').click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await settle(page)
    },
    chip: ['availability-office-sets-public', ...ALWAYS],
  },
  { screen: 'Balances', path: '/mobile/balances', chip: ['pwa-office-runs-payables', 'pwa-payment-full', 'pwa-payment-half', ...ALWAYS] },
  {
    screen: 'More, with the profile',
    path: '/mobile/more',
    drive: async (page) => {
      await expect(page.locator('[data-shot="mobile-profile"]')).toBeVisible()
      // "Play the office" stays OFF (its default since catch-up Phase 14).
      await expect(page.getByRole('switch', { name: 'Play the office' })).toHaveAttribute('aria-checked', 'false')
    },
    chip: ALWAYS,
  },
  {
    screen: 'More · profile, Rate per unit sheet open',
    path: '/mobile/more',
    drive: async (page) => {
      await page.locator('[data-shot="mobile-profile-rate-change"]').click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await settle(page)
    },
    chip: 'absent',
  },
  {
    screen: 'More · Help open',
    path: '/mobile/more',
    drive: async (page) => {
      await page.locator('[data-shot="nav-help"]').click()
      await expect(page.locator('[data-shot="support-panel"]')).toBeVisible()
      await settle(page)
    },
    // The help line's entry acts over the open Help sheet (catch-up Phase 43b), so the chip rises above it.
    chip: [...ALWAYS, 'support-help-line-responds'],
  },
]

/** 17's privacy boundary (D44, US-13.6.3): nothing anaesthetist-facing shows a preference, a pairing or a tier. */
const PRIVACY = /Not preferred|\bPreferred\b|Tier [1-4]|pairing/i

async function expectNoPreferenceOrTier(page: Page, where: string): Promise<void> {
  const text = await page.evaluate(() => document.body.innerText)
  expect(text.match(PRIVACY)?.[0] ?? null, `${where}: a preference, pairing or tier label`).toBeNull()
}

async function signInAt(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await settle(page)
  const signIn = page.locator('[data-shot="sign-in-screen"]')
  await expect(signIn).toBeVisible()
  await page.locator('[data-shot="sign-in-submit"]').click()
  await expect(signIn).toHaveCount(0)
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  await settle(page)
}

for (const row of SCREENS) {
  test(`Demo chip on ${row.screen}`, async ({ page }) => {
    await signInAt(page, row.path)
    if (row.drive !== undefined) await row.drive(page)
    await expectNoPreferenceOrTier(page, row.screen)

    const chip = page.locator('[data-shot="pwa-demo-actions"]')
    if (row.chip === 'absent') {
      await expect(chip, `${row.screen}: no Demo chip`).toHaveCount(0)
      return
    }
    await expect(chip, `${row.screen}: the Demo chip`).toBeVisible()
    await expect(chip).toHaveAccessibleName(`Demo actions for this screen, ${row.chip.length}`)
    await expect(chip).not.toContainText('Office auto')

    await chip.click()
    for (const id of row.chip) {
      const entry = page.locator(`[data-shot="pwa-demo-action-${id}"]`)
      await expect(entry, `${row.screen}: ${id}`).toBeVisible()
      await expect(entry).toContainText(LABELS[id])
    }
    await expect(page.locator('[data-shot^="pwa-demo-action-"]')).toHaveCount(row.chip.length)
    for (const id of Object.keys(WHEN_GATED) as PwaEntry[]) {
      if (!row.chip.includes(id)) await expect(page.locator(`[data-shot="pwa-demo-action-${id}"]`)).toHaveCount(0)
    }
    await expectNoPreferenceOrTier(page, `${row.screen}, Demo sheet open`)
    await page.keyboard.press('Escape')
  })
}
