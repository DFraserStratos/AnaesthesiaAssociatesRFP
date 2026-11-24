/**
 * The full-scale demonstration's figures (catch-up Phase 43; US-15.0.4), in one
 * labelled block. Every figure the app quotes about scale is read from here,
 * from the horizon setting (`appSettings.schedule.horizonMonths`, Phase 28) or
 * counted from the loaded data, never typed in copy. The horizon is not here.
 *
 * The shares are the generated set's model mix, for the owner's review.
 */
export const FULL_SCALE = {
  /** AA's practice: the 14 demo anaesthetists plus 71 generated. */
  anaesthetists: 85,
  /** The billed history: invoices raised over this many months before today. */
  historyMonths: 12,
  /** US-15.0.4: about 28,000 invoices a year. */
  targetInvoicesPerYear: 28000,
  /**
   * How much each of the 71 works (their profile is set in `names.ts`): weekly recurring sessions (a full
   * week has ten), and, for part time and light, whole weekdays off held as a weekly Unavailable series.
   */
  workProfiles: {
    full: { sessionsPerWeek: { min: 6, max: 8 }, weekdaysOff: { min: 0, max: 0 } },
    part: { sessionsPerWeek: { min: 3, max: 5 }, weekdaysOff: { min: 1, max: 2 } },
    light: { sessionsPerWeek: { min: 1, max: 2 }, weekdaysOff: { min: 2, max: 3 } },
  },
  /** Of the 71, the share whose weekly Unavailable series also closes the weekend (the rest leave weekends Free). */
  weekendsOffShare: 0.8,
  /** Of an anaesthetist's recurring sessions, the share at their home hospital with their regular surgeons. */
  homeHospitalShare: 0.75,
  /** Regular surgeons per anaesthetist at their home hospital. */
  regularSurgeons: { min: 2, max: 4 },
  /** Ad hoc Lists (not from a recurring booking) per anaesthetist per week, on Free weekday sessions. */
  adhocListsPerWeek: { min: 0, max: 2 },
  /** Ad hoc Lists reach this many weeks ahead. */
  adhocWeeks: 6,
  /** Forward Bookings per booked List over the next ten days (thinning after). */
  forwardBookingsPerList: { min: 2, max: 5 },
  /** Forward booking reaches this many days ahead (the seed's filler reaches ten). */
  forwardDays: 21,
  /** Procedures left on No contract · RVG when a candidate Contract also fits. */
  noContractShare: 0.18,
  /** The pricing kinds across the generated Contracts (weights). */
  pricingKindMix: { rvgAnaesthetistRate: 4, rvgContractRate: 2, rvgDiscount: 1, fixed: 3 },
  /** Of the Procedures on an RVG Contract that allows the anaesthetist's override, the share with a typed price. */
  typedPriceShare: 0.1,
  /** Generated surgeons saved without an HPI CPN. */
  noCpnSurgeonShare: 0.15,
  /** Generated surgeons (with a practice name and contacts, no rooms). */
  surgeons: 24,
  /** Bookless sessions that are Public sessions ("CPH"), never open for bookings or cover. */
  publicSessionShare: 0.04,
  /** Of the 71, the share taking a block of leave in the horizon (their recurring Lists in it become Draft Lists by the clash rule). */
  leaveBlockShare: 0.7,
  /**
   * Cover already arranged: of the recurring Lists that fall under leave (Draft Lists by the clash rule), the share
   * the office has given a free colleague, within the next `nearDays` and after; the rest wait as Draft Lists.
   */
  cover: { nearDays: 28, nearShare: 0.9, laterShare: 0.9 },
  /** The everyday practice (`scope: 'practice'`): Bookings on each of the 71's past-fortnight Lists, and the share of its invoices already paid in. */
  practicePastBookingsPerList: { min: 2, max: 5 },
  practicePaidShare: 0.7,
  /** A leave block's length in weekdays. */
  leaveBlockWeekdays: { min: 5, max: 10 },
  /** The spring school holidays' weekdays (2026): this share of leave blocks starts inside them. */
  schoolHolidays: { startISO: '2026-09-28', endISO: '2026-10-09', share: 0.35 },
  /** Single leave days besides the block. */
  singleLeaveDays: { min: 0, max: 2 },
  /** The office's priority tiers for the 71 (the directors in Tier 1 are the demo's): shares in Tier 2 and Tier 3, the rest at the Tier 4 default. */
  priorityTierShares: { tier2: 0.15, tier3: 0.35 },
  /** Pairing preferences between generated anaesthetists and generated surgeons. */
  pairingPreferences: 12,
  /** Below this age the payer on a Procedure is a synthetic guardian (no child-payer warning in history). */
  guardianPayerAgeUnder: 16,
  /** Of the Bookings with a second Procedure, the share whose second Procedure bills another payer (a few Bookings bill two). */
  secondPayerShare: 0.12,
  /** Bookings whose patient is insured: the insurer (a Party) and an approval number on the Booking (D28). */
  insuredShare: 0.05,
  /** Bookings with a second Procedure (one primary, the multi-procedure rule applied). */
  secondProcedureShare: 0.08,
  /** A practice-sized handful of prepaid Bookings (on the anaesthetists' prepaid price lists), as a share of the generated Bookings. */
  prepaidShare: 0.001,
  /** Generated anaesthetists who keep a prepaid price list with the office. */
  prepaidPriceListAnaesthetists: 6,
  /** Authorised Lists carrying a problem the processing monitor recognises (a few in a thousand). */
  monitorProblemShare: 0.0015,
  /**
   * Invoices raised per billed Booking, measured on the generated set (a holder and a payer on one
   * Booking, a second payer, a prepayment): the booking density divides by it to land on the target.
   */
  invoicesPerBooking: 1.05,
  /** Forward Lists holding one stub for a no-NHI intake row. */
  stubs: 6,
  /** The payment mix of the history, by invoice age. */
  paymentMix: {
    /** Older than this: paid in (and paid out) unless one of the shares below says otherwise. */
    settledAfterDays: 45,
    /** Of the older invoices, the share still outstanding. */
    olderOutstandingShare: 0.03,
    /** Of the older invoices, the share part paid. */
    olderPartPaidShare: 0.01,
    /** Of the newer invoices, the share already paid. */
    newerPaidShare: 0.45,
  },
  /** The page sizes the screens use at scale. */
  pageSizes: { day: 30, invoices: 50, audit: 100, ledger: 50, monitorGroups: 20, monitorListsPerGroup: 25, demoTables: 200 },
  /** Generated invoice numbers: a reserved series that cannot collide with the live `AA-2026-` counter or the `AA-2026-H` backdrop. */
  invoiceNumberPrefix: 'AA-S-',
  /** Generated registration numbers: a reserved block the cast cannot collide with. */
  registrationBase: 60001,
} as const

export type FullScaleConstants = typeof FULL_SCALE
