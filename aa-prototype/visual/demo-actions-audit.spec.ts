import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 44, item 4: the Control Panel index audited end to end on the
 * framed build. For every row of "Demo actions by screen" that has an "Open
 * screen" link, the link lands on a screen whose harness-bar "Demo actions"
 * pill lists that entry (`[data-shot=demo-action-<id>]`). A screen that
 * registers nothing shows no pill at all.
 *
 * Every bar entry is accounted for in exactly one of the tables below, and the
 * first test holds the tables equal to the index the page renders, so a new
 * entry fails here until it is placed in one of them: nothing is skipped
 * silently.
 *
 *   LANDS       the seed alone puts the entry on its Open screen.
 *   DRIVEN      a `when` (or an empty index path) the screen alone does not
 *               satisfy: the spec drives the state first (`before`, from the
 *               seed) and/or after landing (`after`, on the landed screen).
 *   SKIP        cannot be driven here, each with its reason. Empty today.
 *   PWA_ONLY    no Open screen on the index ("Shown in the installed PWA");
 *               `pwa-demo-parity.spec.ts` audits them on the handset.
 */

/** Rows whose Open screen, from the seed, lands on a screen that lists the entry. */
const LANDS: readonly string[] = [
  // Admin · Billing monitor
  'billing-failure', 'arm-handoff-fault', 'xero-outage-start', 'xero-outage-restore', 'run-reconciliation-poll',
  'run-archive-job', 'run-next-billing-run', 'stage-payment-week', 'stage-bank-mismatch', 'stage-refund-after-payout',
  // Admin · Ledger, Audit, Booking detail, Review, Invoices, Intake
  'inject-unmatched-receipt', 'simulate-sign-in', 'hospital-description-arrives', 'stage-post-op', 'stage-combined-procedure',
  'pdf-list-resend', 'matching-receive-theatre-list', 'matching-send-update', 'matching-raw-row-other-role',
  // Admin · AA fee invoices and the Xero simulation
  'run-scheduled-fee-run', 'seed-month-of-bctis', 'record-fee-payment', 'xero-bulk-remittance',
  // Admin · Day view, Draft Lists, Conflicts
  'simulate-sickness', 'colleague-moves-list-to-office', 'colleague-hands-booking-to-souter', 'simulate-incoming-request',
  'add-draft-list-for-day', 'prepayment-two-days-before', 'add-prepaid-booking', 'raise-sample-warnings',
  'clear-sample-warnings', 'switch-office-user', 'load-full-scale',
  // Admin · Master data (each view publishes `adminMasters.view` on landing, which satisfies the `when`)
  'demo-backdated-range', 'stage-recurring-clash', 'load-sample-spreadsheet', 'go-live-data-load',
  // Admin · Review and Booking detail, prepaid (each shows, disabled, until its hinted step is done)
  'stage-longer-prepaid-procedure', 'prepayment-late-payment', 'prepayment-contract-changed',
  // Admin · Patients
  'receive-no-nhi-list',
  // Admin · Contracts (build plan Phase 49)
  'contract-reach-change-date',
  // Admin · Invoices and the Xero pair: the practice seed already holds open invoices (no List to authorise first)
  'regenerate-invoice', 'payment-full', 'payment-half', 'payment-replay', 'xero-amend-invoice', 'xero-void-invoice', 'xero-pay-bill',
  // Mobile (framed phone) and Web, List and Booking detail
  'photo-capture-future', 'load-multi-procedure-booking', 'web-payment-full', 'web-payment-half',
  // Future scope and the Demo data inspector
  'fire-hospital-message', 'replay-hospital-message', 'scan-nhi-leaks',
]

interface Drive {
  /** Why the screen alone does not show the entry. */
  why: string
  /** Run from the seed before the index is opened (gives the entry an index path). */
  before?: (page: Page) => Promise<void>
  /** Run on the landed screen before the pill is opened (publishes the context the `when` reads). */
  after?: (page: Page) => Promise<void>
}

/** Authorise Dr Souter's Mon 20 Jul AM List on Review, so its invoices reach Xero (as `demo-actions.spec.ts` does). */
async function authoriseAList(page: Page): Promise<void> {
  await page.goto('/admin/review/L-34821-2026-11-23-AM')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await expect(page.locator('[data-shot="review-delivery-summary"]')).toHaveText(/invoices? raised\./)
  // The store's write to localStorage is coalesced over about 250ms (ATLAS gotchas).
  await page.waitForTimeout(400)
}

/** Load the domain model's 3-procedure Booking on Dr Souter's next open List, from its own Open screen. */
async function loadThreeProcedureBooking(page: Page): Promise<void> {
  await openScreenFor(page, 'load-multi-procedure-booking')
  expect(await runDemoAction(page, 'load-multi-procedure-booking', { close: true })).not.toMatch(/^Refused/)
  await page.waitForTimeout(400)
}

async function openHelp(page: Page): Promise<void> {
  await page.locator('[data-shot="nav-help"]').first().click()
  await expect(page.locator('[data-shot="support-panel"]')).toBeVisible()
}

async function openProductSupport(page: Page): Promise<void> {
  await openHelp(page)
  await page.locator('[data-shot="support-tab-productSupport"]').click()
  await expect(page.locator('[data-shot="support-panel"]')).toHaveAttribute('data-tab', 'productSupport')
}

/** Rows whose `when` (or empty index path) needs a state the screen alone does not give; each is driven to it. */
const DRIVEN: Readonly<Record<string, Drive>> = {
  'feed-changes-primary': {
    why: 'Shows only on a Booking with two or more Procedures (catch-up Phase 23); its index path is null until the 3-procedure Booking is loaded.',
    before: loadThreeProcedureBooking,
  },
  'ask-colleague-make-available': {
    why: "Shows only while an Assign or Reassign picker is open (`adminPicker.listId`, catch-up Phase 32b).",
    after: async (page) => {
      await page.getByRole('button', { name: /^Assign Draft List/ }).first().click()
      await expect(page.getByRole('dialog').first()).toBeVisible()
    },
  },
  'nhi-hub-mode': {
    why: 'Shows only while an NHI lookup surface is open (`nhiHub.inUse`, catch-up Phase 40a): Add a booking on the landed web List.',
    after: async (page) => {
      await page.getByRole('button', { name: /Add a booking/ }).first().click()
      await expect(page.getByRole('dialog').getByRole('heading', { name: 'Add a booking' })).toBeVisible()
    },
  },
  'support-advance-ticket': { why: 'Shows only while the support panel is open (`support.tab`, catch-up Phase 43b).', after: openHelp },
  'support-raise-out-of-hours': { why: 'Shows only on the support panel\'s Help line tab (catch-up Phase 43b).', after: openHelp },
  'support-raise-public-holiday': { why: 'Shows only on the support panel\'s Product support tab (catch-up Phase 43b).', after: openProductSupport },
  'support-approve-call-out': { why: 'Shows only on the support panel\'s Product support tab (catch-up Phase 43b).', after: openProductSupport },
}

/** Rows that cannot be driven to a showing state here, each with its reason. */
const SKIP: Readonly<Record<string, string>> = {
  'pass-last-day': "No Open screen (no index path): it shows on an anaesthetist's record once a last day is set (build plan Phase 52).",
  'try-sign-in-after-last-day': 'No Open screen (no index path): it shows on the sign-in screen after signing out, once a last day has passed (build plan Phase 52).',
}

/**
 * Known app-side failures, reported to the owner rather than fixed here. Each runs as
 * `test.fail`, so the day the app is fixed the test reports "expected to fail" and the
 * entry comes off this list. None today: the three Xero pair entries' Open screen links
 * were re-pointed at the Xero pair in Phase 44 (`firstOpenXeroPairPath`).
 */
const APP_FAILURES: Readonly<Record<string, string>> = {}

const XERO_PAIR_ENTRIES = ['xero-amend-invoice', 'xero-void-invoice', 'xero-pay-bill'] as const

/** Index rows with no Open screen ("Shown in the installed PWA"): audited on the handset by `pwa-demo-parity.spec.ts`. */
const PWA_ONLY: readonly string[] = [
  'office-authorises-list', 'office-reviews-additional-invoice', 'office-reviews-credit', 'office-assigns-next-free',
  'office-adds-out-of-hours-list', 'availability-office-sets-public', 'office-assigns-draft-list', 'office-resolves-alert',
  'office-approves-contract-change', 'colleague-moves-list-to-me', 'colleague-moves-booking-to-me',
  'pwa-office-approves-prepayment', 'pwa-office-sends-prepayment-reminder', 'office-clears-warning',
  'office-sets-booking-contract', 'matching-office-matches-row', 'stub-office-adds-nhi', 'pwa-office-adds-nhi',
  'pwa-office-runs-payables', 'pwa-payment-full', 'pwa-payment-half', 'office-edits-booking', 'pwa-sign-out',
  'support-help-line-responds',
]

const pill = (page: Page) => page.locator('[data-shot="demo-actions"]')

/** From `/demo/control`, press the entry's "Open screen" and wait to leave the Control Panel. */
async function openScreenFor(page: Page, id: string): Promise<void> {
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  // An entry listed under more than one heading (`alsoScreens`) has a row under each; both open the same path.
  const open = page.locator(`[data-shot="index-${id}"]`).first().getByRole('button', { name: /Open screen/ })
  await expect(open, `${id}: the index row's Open screen`).toBeEnabled()
  await open.click()
  await expect(page).not.toHaveURL(/\/demo\/control/)
  await page.waitForLoadState('networkidle')
}

async function expectListed(page: Page, id: string): Promise<void> {
  await expect(pill(page), `${id}: the Demo actions pill on ${page.url()}`).toBeVisible()
  const row = page.locator(`[data-shot="demo-action-${id}"]`)
  if (!(await row.isVisible())) await pill(page).click()
  await expect(row, `${id}: listed in the Demo actions menu on ${page.url()}`).toBeVisible()
}

test('every index row is in exactly one table: lands, driven, skipped or PWA only', async ({ page }) => {
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="control-demo-index"]')).toBeVisible()
  const rows = await page.locator('[data-shot^="index-"]').evaluateAll((els) =>
    els.map((el) => {
      const button = [...el.querySelectorAll('button')].find((b) => /Open screen/.test(b.textContent ?? ''))
      return { id: (el.getAttribute('data-shot') ?? '').slice('index-'.length), open: button === undefined ? 'none' : button.disabled ? 'disabled' : 'enabled' }
    }),
  )
  const byId = new Map(rows.map((r) => [r.id, r.open]))
  const tables = [LANDS, Object.keys(DRIVEN), Object.keys(SKIP), PWA_ONLY]
  const placed = tables.flat()
  expect(new Set(placed).size, 'an id in two tables').toBe(placed.length)
  expect([...byId.keys()].sort(), 'the index rows against the tables').toEqual([...placed].sort())
  // From the seed: LANDS rows open a screen; PWA-only rows have none; a DRIVEN row is enabled or waits on its `before`.
  for (const id of LANDS) expect(byId.get(id), `${id}: Open screen at seed`).toBe('enabled')
  for (const id of PWA_ONLY) expect(byId.get(id), `${id}: no Open screen`).toBe('none')
  for (const [id, d] of Object.entries(DRIVEN)) expect(byId.get(id), `${id}: Open screen at seed`).toBe(d.before === undefined ? 'enabled' : 'disabled')
})

for (const id of [...LANDS, ...Object.keys(DRIVEN)]) {
  test(`index row ${id}: Open screen lands where Demo actions lists it`, async ({ page }) => {
    const failure = APP_FAILURES[id]
    if (failure !== undefined) test.fail(true, failure)
    const drive = DRIVEN[id]
    if (drive?.before !== undefined) await drive.before(page)
    await openScreenFor(page, id)
    if (drive?.after !== undefined) await drive.after(page)
    await expectListed(page, id)
  })
}

test('the three Xero pair entries open on the Xero pair of an open invoice, where Demo actions lists them', async ({ page }) => {
  await authoriseAList(page)
  for (const id of XERO_PAIR_ENTRIES) {
    await openScreenFor(page, id)
    await expect(page).toHaveURL(/\/demo\/xero\/invoices\/XR\d+/)
    await expectListed(page, id)
  }
})

test('a screen that registers nothing shows no pill', async ({ page }) => {
  // No entry routes to the Control Panel or the component catalogue (the Control Panel is only the index),
  // nor to a web screen with nothing of its own (the web profile, My availability).
  for (const path of ['/demo/control', '/demo/catalogue/admin', '/web/profile', '/web/availability/mine']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    // The harness bar has rendered (its clock), so an absent pill is the menu choosing not to show.
    await expect(page.getByRole('button', { name: /Demo clock/ })).toBeVisible()
    await expect(pill(page), `${path}: no Demo actions pill`).toHaveCount(0)
  }
})
