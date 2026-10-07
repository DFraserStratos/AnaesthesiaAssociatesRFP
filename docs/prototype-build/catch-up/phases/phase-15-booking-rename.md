# Phase 15 · Card becomes Booking

**Requirements covered:** [US-03.1.3](../../../../requirements-board/requirements/stories/US-03.1.3.md) Attachments;
[DM-01](../analysis/domain-model-delta.md#dm-01) Card becomes Booking (the rename only; the booking-level state DM-01 also names lands later: warnings in 15a, billable party and invoice email in 21, prepayment in 27);
[DM-39](../analysis/domain-model-delta.md#dm-39) List-level attachments, Copy a Booking as a skeleton, and an optional stored Booking source;
[RV-12](../analysis/reverse-check.md#rv-12-vocabulary-card-for-a-booking) "Card" used for a Booking throughout the UI;
[RV-03](../analysis/reverse-check.md#rv-03-card-copy-is-used-as-the-additional-procedure-mechanism) Card Copy used as the additional-procedure mechanism.
Read alongside (not closed here): [US-02.4.3](../../../../requirements-board/requirements/stories/US-02.4.3.md) Copy a Booking,
[US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md) Add a Booking manually or from a photo,
[FT-03.2](../../../../requirements-board/requirements/stories/FT-03.2.md) Booking structure,
[US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md) Add additional Procedures, and
[domain-model.md](../../../../requirements-board/requirements/domain-model.md) section 2 "Booking" and section 4, the glossary (Booking, Card, Recurring booking, Timesheet).
**Depends on:** none. Runs first with Phase 14, in either order. It must run before any phase that edits booking code (15a onward). If 14 ran first, this rename also covers the demo-trigger registry's route patterns, labels and context keys.
**Estimated:** 2 sessions. Session 1 is the mechanical rename (work items 1 to 9), re-greened and demoable. Session 2 adds the fields and reworks Copy (work items 10 to 17).

## Goal

The catalogue replaced "Card" with **Booking**: an appointment for one patient within a List.
"Card" now means only the physical hospital or surgeon booking card. The prototype still says Card
throughout: in types, ids, store actions, selectors, audit strings, seed, routes, test hooks and
the copy of all three apps, the Control Panel and the demo guide. This phase renames all of it.

The renamed Booking is where later phases add the booking-level state the domain model now names
(DM-01): warnings (15a), billable party and invoice email (21) and prepayment state (27). This
phase adds none of it, and adds no insurer or funding source either: the catalogue holds those on
neither the Booking nor the Patient (OQ-55, built in 20).

It does add two small things:

- **List-level attachments** sit beside Booking attachments, with a badged, simulated file attach
  in place of today's canned "Add photo" (US-03.1.3).
- **An optional `Booking.source`** says how a Booking entered the system (hospital download,
  surgeon PDF, admin, anaesthetist ad hoc or photo, copy). The catalogue lists the sources only
  descriptively (domain-model "Booking > Sources"); no story requires a stored field and the audit
  trail already records where each change came from (DM-39). So it is a thin, optional,
  display-only field: stamped where a creation path knows it, shown as one quiet line, and read
  by no rule, validation or billing code.

Finally, **Copy becomes what the catalogue says it is**: a new Booking with only the skeleton
(patient, List and references) and a fresh **primary** Procedure, inheriting nothing else.
Additional Procedures are added inside a Booking with "Add another procedure", which already
exists. Copy stops being the RFP's additional-procedure mechanism, and that settled July ruling
is superseded.

The rename is the widest diff of the catch-up by file count (about 180 files use the word). It
has to be mechanical, reviewable and re-greened on its own before anything changes behaviour.

The wording sweep also applies the glossary's other rules to every string it touches, in the app
and the demo guide: a List is **reassigned** or **moved**, never "swapped", and "timesheet" is
never used (say a completed or submitted Booking). Renaming "Permanent List" to "recurring
booking" is Phase 30's, so leave it alone here, and never let the Booking rename produce
"Permanent Booking".

## Before you start: drift check

1. Diff the covered and read-alongside items against the plan's catalogue snapshot, `501b0b8`:

   ```
   git diff 501b0b8 -- "requirements-board/requirements/stories/US-03.1.3.md" "requirements-board/requirements/stories/US-02.4.3.md" "requirements-board/requirements/stories/US-02.4.1.md" "requirements-board/requirements/stories/FT-02.4.md" "requirements-board/requirements/stories/FT-03.2.md" "requirements-board/requirements/stories/US-03.2.3.md" "requirements-board/requirements/stories/EP-02.md" "requirements-board/requirements/stories/EP-03.md" "requirements-board/requirements/domain-model.md"
   ```

   Also run the whole-catalogue diff from ROADMAP.md "When the catalogue changes" and scan it for
   any new item that names Booking, Copy, source or attachments.

   For reference, the 2026-10-01 update (the meeting with Greg, now `501b0b8`) already folded
   into this doc changed none of the covered stories. US-02.4.1 gained a note only (the anaesthetist must still be able
   to create a Booking on the fly in theatre). The domain model's Booking section now names the
   booking-level state (warnings, billable party and invoice email, prepayment) and says the
   Booking holds no insurer or funding source; its Sources list is unchanged. The glossary added
   "Recurring booking" (not a Booking for one patient) and "Timesheet: not used", and the
   reassignment wording moved from "swap" to "move". The gap re-grade made the stored source
   optional (DM-01, DM-39), and the old DM-34 is now DM-39.
2. If an item changed since `501b0b8`, re-read it and adjust the work items. Specific things to
   look for:
   - **Booking sources** (domain-model "Booking > Sources"). If the list of sources changed, the
     `BookingSource` union in work item 10 follows the catalogue. If a story now requires a stored
     source or reads it in a rule, make the field required and say so in PROGRESS.
   - **Copy** (US-02.4.3). If "references" is now defined, carry exactly those. The reading used
     here is below.
   - **Attachments** (US-03.1.3, Proposed). If it moved to Future or Retired, drop work items 11
     and 12, keep today's Booking photo attach under the new names, and note the drop in PROGRESS.md.
   - **Vocabulary** (glossary). If "Booking" was renamed again, stop and ask the owner before
     renaming 180 files.
3. If US-03.1.3 is now Retired or Future, remove it from this phase's covers and record that in the
   PROGRESS entry. DM-01, DM-39, RV-03 and RV-12 are model findings: they stand unless the
   domain-model's Booking section changes.
4. **Check whether Phase 14 has run** (look for `aa-prototype/src/shared/demoTriggers/`, with
   `registry.ts` and the `useDemoTriggerContext` hook, and for a Phase 14 PROGRESS entry). If it has,
   work item 7 includes the registry.
5. **Open questions.** None block this phase, and nothing here is provisional:
   - [OQ-34](../../../../requirements-board/requirements/questions/OQ-34.md) is
     answered: the hospital download carries most bookings today. It changes nothing built here.
   - [OQ-53](../../../../requirements-board/requirements/questions/OQ-53.md) is
     answered: a combination is a Contract set against each parent procedure (US-04.2.11), built in
     23. Leave the Procedure structure alone here.
   - **Reading of "references" in Copy** (US-02.4.3 leaves the word undefined, and the gap
     analysis grades it Matches at low confidence on that point): the Booking's billing reference
     (the hospital or PO reference, stored today as `Procedure.billingReference` on the primary
     Procedure). It is **not** the hospital appointment correlation (`correlationRef`). A copy is a
     different appointment, and sharing the correlation would let a hospital change message hit
     two Bookings. Record it in the Decisions log as the reading used.

## Reference

**Design files (convention 17).** Visuals do not change in this phase. Only words, one new small
section on the List screens and the attach sheet change.

- `docs/design/Design Language.dc.html`: the tokens. Teal `#0D6E63` is the only action colour, so
  "Add attachment" and "Copy booking" are teal text actions. The `DemoBadge` warning tint marks
  the simulated picker. `radius.card` (14) is the visual card radius, and its name stays.
- `docs/design/Mobile App.dc.html`: Screen 2 (the List card stack) is the layout reference for the
  new List attachments row. Screen 3 (Card detail and BTM capture) is the reference for the
  Booking detail, which does not move. The mockups still label things "Card". Leave the design
  files alone; the vocabulary follows the catalogue.
- `docs/design/Admin Day.dc.html` (the List drawer, where List attachments show read-only) and
  `docs/design/Admin Review.dc.html` (the review Booking rows, which get the copy sweep only).
- No mockup covers the web List detail. Extend the web Booking detail's panel pattern (PROGRESS
  Decisions log 2026-07-27, "The web card detail and List detail are now DESKTOP layouts").

**Catalogue items:** see the links under Requirements covered. The whole of US-03.1.3 is one
sentence: "The anaesthetist can attach files or photos to a Booking, or to a List as a whole." Its
images (a web and a mobile "Add photo") show today's UI.

**Analysis files:**

- `docs/prototype-build/catch-up/gaps.json`: the items `US-03.1.3` and `US-02.4.3`
  (Matches, with the "references" ambiguity), `dataModelDeltas` DM-01 and DM-39, and
  `reverseFindings` RV-03 and RV-12.
- `docs/prototype-build/catch-up/epics/EP-03.md#us-03.1.3`.
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: Theme 4 (only its Copy-a-Booking-as-skeleton part; the
  multi-procedure and primary-Procedure rest is 23's),
  "Structural first" item 1, "Remove or rework" (the stale "Card" copy and the post-op addendum
  Card), and the DM-01 and DM-20 correction under "Structural changes" (the stored source is
  optional).
- `docs/prototype-build/catch-up/analysis/prototype-map-store-seed.md` (sections 1 to 3, 6 and 7),
  `prototype-map-domain.md` (section 2, Card, Procedure, Invoice and BillingCase, and section 5,
  the billing modules), `prototype-map-shared.md` (sections 2, 3 and 5) and
  `prototype-map-shell-demo-pwa.md` (sections 1, 5 and 7).
- `requirements-board/capture/ATLAS.md`: the catalogue's screenshot recipes hard-code this app's
  routes, ids, button text and test hooks (work item 16).

**Code entry points** (paths under `aa-prototype/src/`):

- **Model:** `domain/types.ts`. `Card` is at L370, `CardId` at L39 and `CardAttachment` at L358.
  `Procedure.cardId`, `Invoice.cardId`, `BillingCase.cardId` and `IntegrationMessage.resultCardId`
  all need renaming.
- **Billing modules:** `domain/billing/validateCardForBilling.ts` (`validateCardForBilling`,
  `CardBillingContext`, `feeContextFor`), `domain/billing/invoiceBuild.ts`
  (`buildInvoicesForCard`, `buildPrePaymentInvoiceForCard`, `CardBuildResult`) and
  `domain/billing/fixtures.ts` (`mkCard`).
- **Store core:** `store/mutate.ts` (`ID_FORMATS.card` prefix `C`, `stampCardId`) and
  `store/appStore.ts` (`schedule.cards`, `PERSIST_VERSION = 13` at L130 with its version comment
  block).
- **Booking actions:** `store/cardActions.ts` (`createCard` L70, `copyCard` L179,
  `addPostOpAddendum` L270, `addProcedure` L394, `removeProcedure` L474).
- **Lifecycle:** `store/lifecycle.ts` (`getCard`, `completionBlockersFor`, `completeCard`,
  `uncompleteCard`, `cancelCard`, `editCard` + `CardPatch`, `editList` + `ListPatch`,
  `reassignCard`, refusal code `cardsNotCompleted`).
- **Other store modules:** `store/selectors.ts` (`cardsForList`, `proceduresForCard`,
  `casesForCard`, `invoicesForCard`, `billingContextForCard`, `cardRequiresPrepayment`,
  `prePaymentInvoicesForCard`, `paidPrePaymentCaseForCard`, `findCardByCorrelation`,
  `cardsOnListByNhi`), `store/billingRun.ts`, `store/prepaymentActions.ts`,
  `store/integrationActions.ts` and `store/intake.ts` (`viaCardId`).
- **Seed:** `domain/seed/cards.ts` (`addCard`, `CardSpec`, scenario ids), `domain/seed/audit.ts`,
  `domain/seed/history.ts`, `domain/seed/billing.ts` and `domain/seed/index.ts` (`SEED_MARKERS`,
  `SEED_PREPAID_CARD_ID`).
- **Shared UI:**
  - `shared/card/CardDetailBody.tsx`: `addPhoto` L336, `doCopy` L362, the Attachments section
    L604, "Copy for an additional procedure" L709 and "Cancel card" L715.
  - `shared/card/OfficeBillingSetup.tsx` and `shared/card/HistorySheet.tsx`.
  - `shared/surface/` (`CardLayout`, `CardLayoutSlots`, `CardTotal`, `CardTotalProps`,
    `CardTotalLine`, `MobileCardLayout`, `WebCardLayout`).
  - `shared/capture/CardTotalPanel.tsx` and `shared/capture/feeContext.ts` (`cardFee`).
  - `shared/flows/AddCardFlow.tsx`, `ManualCardForm.tsx`, `PhotoCaptureFlow.tsx`,
    `CancelCardSheet.tsx` and `sampleExtractions.ts`.
  - `shared/audit/actionLabels.ts` and `fieldLabels.ts`, and `shared/format.ts`.
- **Apps and shell:**
  - Mobile: `apps/mobile/screens/CardDetailScreen.tsx` and `ListDetailScreen.tsx`,
    `apps/mobile/navigation.ts` (L39 `matchPath('/mobile/lists/:listId/cards/:cardId')`),
    `apps/mobile/routes.tsx` and `apps/mobile/components/SlideStack.tsx` (`slide-card`).
  - Web: `apps/web/screens/CardDetailView.tsx`, `ListDetailView.tsx` and `apps/web/routes.tsx`.
  - Admin: `apps/admin/screens/AdminCardDetail.tsx`, `apps/admin/flows/MoveCardFlow.tsx`,
    `apps/admin/reviewFlags.ts` (`reviewFlagsForCard`), `apps/admin/routes.tsx`,
    `apps/admin/AdminApp.tsx`, `apps/admin/screens/InvoicesScreen.tsx`,
    `BillingMonitorScreen.tsx` (`MonitorCardRow`) and `apps/admin/components/ListDrawer.tsx`.
  - Router and demo: `router.tsx` (L76 and L92 `cards/:cardId`),
    `apps/demo/DemoControlPanel.tsx` (the `SCENARIOS` text and trigger messages),
    `apps/demo/DemoData.tsx` and `apps/demo/DemoIntegrations.tsx`.
  - PWA: `pwa/officeSimulation.ts` and `aa-prototype/pwa/main.tsx`.
- **Assets:** `src/assets/samplePaperCards.ts` (`PAPER_CARD_A` and `PAPER_CARD_B`: physical cards,
  which keep their names).
- **Tests:** `store/cardActions.test.ts`, `store/demoScenarios.test.ts`,
  `domain/billing/validateCardForBilling.test.ts`, `shared/audit/auditNarrative.test.ts`,
  `apps/admin/screens/ClickableTableRows.test.tsx` and `pwa/pwaPurity.test.ts`. Playwright specs
  live in `aa-prototype/visual/`, including `card-attachments.spec.ts`,
  `card-calculation-display.spec.ts`, `routing.spec.ts` and `mobile-interactions.spec.ts`.

## Work items

### Session 1 · Step A: the mechanical rename (no behaviour change)

1. **Baseline.** Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`
   before touching anything. Record the Vitest and Playwright counts, and keep the
   `visual/shots/` PNGs as the before set. Step A must end with the same counts, apart from
   renamed files and the new redirect test, and with screenshots that differ only in wording.

2. **Fix the rename rules before editing.** Every hit for `card` falls into one of three classes.
   Write the rules into the PROGRESS entry so reviewers can check against them.

   | Class | Examples | Action |
   |---|---|---|
   | **The entity** (a patient's appointment on a List) | `Card`, `CardId`, `cardId`, `schedule.cards`, `cardActions`, `cardsForList`, `validateCardForBilling`, `CardDetailBody`, `AddCardFlow`, `CardTotal`, `MonitorCardRow`, audit `'card'`, "Add a card", "Card total", `slide-card`, `data-shot="card-*"` | Rename to Booking |
   | **A visual card** (a bordered UI panel or design token) | `AsaCard`, `TimesCard`, `UnitsCard`, `ProcedureCodeCard`, `NotesCard`, `OverrideCard`, `BillingLinesCard`, `ControlCard`, `RecordCard`, `RailCard`, `MoneyFlowCard`, `EmptyCard`, `radius.card`, `easing.card`, `motion.cardAdvance`, `data-shot="xero-accpay-card"`, `CreditCard` (icon) | Keep. These follow the Design Language's own names |
   | **The physical card** (the hospital or surgeon's paper booking card) | `samplePaperCards.ts`, `PAPER_CARD_A/B`, "Paper card A", "photograph the card", the photo-capture copy | Keep, and say "booking card" or "paper card" wherever the text could be misread |

   The name map below is the contract. Record it in PROGRESS so parallel phase docs written
   against the old names can translate. The TypeScript compiler is the safety net: rename the
   type first and let `tsc -b` find every use.

   | Old | New |
   |---|---|
   | `Card`, `CardId`, `CardCancellation`, `CardAttachment` | `Booking`, `BookingId`, `BookingCancellation`, `Attachment` |
   | `Procedure.cardId`, `Invoice.cardId`, `BillingCase.cardId`, `IntegrationMessage.resultCardId` | `bookingId`, `resultBookingId` |
   | `copiedFromCardId`, `cardType`, `addendumOfCardId` | `copiedFromBookingId`, `bookingType`, `addendumOfBookingId` |
   | `schedule.cards`; id kind `card`, prefix `C` | `schedule.bookings`; id kind `booking`, prefix `BK` (`BK0001`) |
| seeded history Booking ids `HC01` to `HC14` (`history.ts`) | `HBK01` to `HBK14` (history Procedures `HP` and cases `HBC` keep their ids) |
   | `store/cardActions.ts`: `createCard`, `copyCard`, `CreateCardInput`, outcome `{ cardId }` | `store/bookingActions.ts`: `createBooking`, `copyBooking`, `CreateBookingInput`, `{ bookingId }` |
   | `getCard` (returns `{ card, list }`), `completeCard`, `uncompleteCard`, `cancelCard`, `editCard`, `CardPatch`, `reassignCard` | `getBooking` (returns `{ booking, list }`), `completeBooking`, `uncompleteBooking`, `cancelBooking`, `editBooking`, `BookingPatch`, `reassignBooking` |
   | `stampCardId` (mutate meta) | `stampBookingId` |
   | selectors `cardsForList`, `proceduresForCard`, `casesForCard`, `invoicesForCard`, `billingContextForCard`, `cardRequiresPrepayment`, `prePaymentInvoicesForCard`, `paidPrePaymentCaseForCard`, `findCardByCorrelation`, `cardsOnListByNhi` | the same names with `Booking` |
   | `validateCardForBilling`, `CardBillingContext`, `buildInvoicesForCard`, `buildPrePaymentInvoiceForCard`, `CardBuildResult` | `validateBookingForBilling`, `BookingBillingContext`, `buildInvoicesForBooking`, `buildPrePaymentInvoiceForBooking`, `BookingBuildResult` |
   | `shared/card/`, `CardDetailBody`, `CardDetailScreen`, `CardDetailView`, `AdminCardDetail`, `AdminCardDetailRoute`, `WebCardDetailRoute` | `shared/booking/`, `BookingDetailBody`, `BookingDetailScreen`, `BookingDetailView`, `AdminBookingDetail`, `AdminBookingDetailRoute`, `WebBookingDetailRoute` |
   | `AddCardFlow`, `ManualCardForm`, `CancelCardSheet`, `MoveCardFlow`, `reviewFlagsForCard`, `MonitorCardRow` | `AddBookingFlow`, `ManualBookingForm`, `CancelBookingSheet`, `MoveBookingFlow`, `reviewFlagsForBooking`, `MonitorBookingRow` |
   | surface `CardLayout`, `CardLayoutSlots`, `CardTotal`, `CardTotalProps`, `CardTotalLine`, `MobileCardLayout`, `WebCardLayout`; `CardTotalPanel`; `cardFee` | `BookingLayout`, `BookingLayoutSlots`, `BookingTotal`, `BookingTotalProps`, `BookingTotalLine`, `MobileBookingLayout`, `WebBookingLayout`; `BookingTotalPanel`; `bookingFee` |
   | audit `entityType: 'card'`, actions `card.create`, `card.copy`, `card.update`, `card.complete`, `card.uncomplete`, `card.cancel`, `card.reassign`, `card.billed`, `card.billingException`, `card.prepaymentOverride` | `'booking'`, `booking.*` (the same suffixes) |
   | refusal codes such as `cardsNotCompleted`, `cardCancelled` | `bookingsNotCompleted`, `bookingCancelled` (grep `refuse(` for the rest) |
   | `CardFeeTotals` (`shared/capture`) | `BookingFeeTotals` |
   | seed `cards.ts`, `addCard`, `CardSpec`, `SEED_PREPAID_CARD_ID`, `CardScenarioIds`; `counters.card`; billing fixture `mkCard` (`domain/billing/fixtures.ts`) | `bookings.ts`, `addBooking`, `BookingSpec`, `SEED_PREPAID_BOOKING_ID`, `BookingScenarioIds`; `counters.booking`; `mkBooking` |
   | `SEED_MARKERS` keys ending `Card` (about 17 in `domain/seed/index.ts` `buildMarkers`: `splitBillingCard`, `twoFunderCard`, `pendingCaptureCard`, `prepaymentCard`, `cancelledCard`, `bariatricType3Card` and the rest) | the same keys ending `Booking` (`splitBillingBooking` and so on); the Control Panel, tests and the Phase 14 registry read them |
   | routes `…/cards/:cardId` | `…/bookings/:bookingId` |
   | test hooks `slide-card`, `mobile-card-header`, `mobile-card-header-actions`, `mobile-card-scroll`, `mobile-card-commit`, `card-calculation`, `data-shot="card-*"` | `slide-booking`, `mobile-booking-*`, `booking-calculation`, `data-shot="booking-*"` |

   Code comments follow the code wherever they name the entity. Leave historical review citations
   ("M6; 3rd review #2") intact. Work item 13 rewrites the comments that call Copy the
   additional-procedure mechanism.

   Out of the map on purpose: "Permanent List" and its code (`permanent*`) stay for Phase 30's
   "recurring booking" rename, and "Draft List" is Phase 31's. A recurring booking is not a
   Booking for one patient, so no identifier or string this phase writes may blur the two.

3. **Domain layer.** Rename in `domain/types.ts`, then `domain/billing/` (file rename
   `validateCardForBilling.ts` becomes `validateBookingForBilling.ts`, with its test),
   `invoiceBuild.ts`, `fixtures.ts` and `domain/integrations/` where it names the entity.
   User-facing validator messages rendered verbatim (for example "This Card is missing its List
   or anaesthetist.") become Booking. The domain purity test still passes. No maths changes:
   every billing test passes unmodified apart from names.

4. **Store.**
   - `store/mutate.ts`: the id kind becomes `booking`, with prefix `BK`. **The allocation order
     is unchanged, so seed numbering is preserved (`C0009` becomes `BK0009`).** `stampCardId`
     becomes `stampBookingId`, and the stamping rule (booking to self, procedure or billing line
     to its parent) is unchanged.
   - `store/appStore.ts`: `schedule.cards` becomes `schedule.bookings`, and `resetDomainState`
     and `backfillMerge` follow.
   - `git mv store/cardActions.ts store/bookingActions.ts`, with its test.
   - Rename the entity names in `lifecycle.ts`, `selectors.ts`, `billingRun.ts`,
     `prepaymentActions.ts`, `integrationActions.ts` and `intake.ts` (`viaCardId` becomes
     `viaBookingId`), and in the `store/index.ts` barrel. The other store modules that name the
     entity follow too (`billablePartyActions`, `billingLineActions`, `dayNoteActions`,
     `contractActions`, `mastersActions`, `paymentActions`, `persistStorage`, `xeroHandoff`); let
     `tsc -b` and a grep find them.
   - Every audit `entityType` and action string, and every refusal message and code, follows the
     map. The `storeDiscipline` test in `store/mutate.test.ts` still passes: all writes go through
     `mutate()`.

5. **Seed.**
   - `git mv domain/seed/cards.ts domain/seed/bookings.ts` and rename its helpers and scenario
     ids. The seed builds ids by hand, not through `allocateId`: change the `C${…padStart(4)}`
     formatter in `bookings.ts` (`addCard`, about L175) to `BK`, rename `build.cards` in
     `history.ts` (about L212) to `build.bookings`, and rename the `counters.card` key
     in `domain/seed/index.ts` (about L434) to `counters.booking`, so the store's allocator
     continues from the seed.
   - `audit.ts`, `history.ts`, `billing.ts` and `index.ts` (`SEED_MARKERS` entity types,
     `SEED_PREPAID_BOOKING_ID`) follow.
   - The 14 seeded history Bookings in `history.ts` are not `C####`: they are built as
     `HC${n}` (about L196). Rename them to `HBK${n}` (`HC05` becomes `HBK05`), and follow in
     `seed.test.ts` (the `HC01` audit assertion, about L112) and the requirements-board recipe
     that types `HC05` (item 16).
   - **Do not add, remove or reorder any RNG draw.** Add a Vitest seed test that pins `BK0001`
     to Hemi Walker (Souter Tue 21 AM) and `BK0009` to Margaret Ellison (Souter Tue 21 PM). It
     proves the numbering and the redirect mapping in item 7.
   - **Bump `PERSIST_VERSION`** by one from its current value (13 when this plan was written; 14
     may have bumped it if it ran first), with a comment
     line: "Card renamed to Booking: `schedule.bookings`, BK ids, `booking.*` audit".

6. **Shared UI.**
   - `git mv shared/card shared/booking`, and rename `CardDetailBody` and the surface seam types
     and bundles in `shared/surface/`.
   - `CardTotalPanel` becomes `BookingTotalPanel`, and `cardFee` becomes `bookingFee` in
     `shared/capture/feeContext.ts`.
   - Rename the flows `AddBookingFlow`, `ManualBookingForm` and `CancelBookingSheet`.
   - In `shared/audit/`: rename the `ACTION_LABELS` keys and labels ("Booking created", "Booking
     copied" and so on), the `FIELD_LABELS` keys (`bookingId`, `copiedFromBookingId`), and the
     empty-state subject in `HistorySheet` ("booking").
   - `auditNarrative.test.ts` fixtures follow.

7. **Apps, shell, PWA and routes.**
   - **Routes.** In `router.tsx`, `lists/:listId/cards/:cardId` becomes
     `lists/:listId/bookings/:bookingId` and `day/:dateISO/cards/:cardId` becomes
     `day/:dateISO/bookings/:bookingId`. In `apps/mobile/navigation.ts`, `listsStackLocation`
     matches `/mobile/lists/:listId/bookings/:bookingId`. Every `navigate(...)` and `<Link to>`
     that builds a Booking path follows: `apps/web/routes.tsx`, `apps/mobile/routes.tsx`,
     `AdminApp.tsx`, `InvoicesScreen.tsx`, the Control Panel scenario `nav` targets and the
     Phase 14 registry if present.
   - **Legacy redirects.** Old `/cards/` URLs redirect, with `replace`, to the matching
     `/bookings/` URL, mapping a legacy id with a pure helper, `legacyBookingId('C0009')` giving
     `'BK0009'` and `legacyBookingId('HC05')` giving `'HBK05'`. Anything already in `BK` or
     `HBK` form passes through. This covers the framed web and
     admin routes, the mobile splat (handled in `listsStackLocation` or `MobileListsRoute`, so it
     also works in the PWA) and presenters' bookmarks. Put the helper in `src/shared/` (not
     `src/shell/AppShell.tsx`), so `pwaPurity.test.ts` holds. `RequireEntity` then bounces a
     stale id as before.
   - **File renames:** `BookingDetailScreen`, `BookingDetailView`, `AdminBookingDetail`,
     `MoveBookingFlow`, `reviewFlagsForBooking` (with its test) and `MonitorBookingRow`. The
     `SlideStack` test ids follow, and so do `ClickableTableRows.test.tsx`, `DemoData`
     (`GuardAction` values, the marker filter) and `DemoIntegrations`.
   - **PWA:** `src/pwa/officeSimulation.ts`, the `src/pwa/bootMetrics.ts` comment ("172 Cards")
     and the `aa-prototype/pwa/main.tsx` comment. `src/pwa/PwaDemoPanel.tsx`'s local `Card`
     component is a visual card (class 2) and keeps its name.
   - **If Phase 14 has run:** rename the registry's route patterns, entry labels, the published
     context key (`cardId` becomes `bookingId`, if 14 used the old name) and its tests.

8. **Copy sweep (RV-12).** Every user-visible string in the three apps, the Control Panel, the
   Data Inspector, the Integrations simulator, the Xero simulator and the PWA More panel. Known
   strings include:
   - "Add a card" becomes "Add a booking", and "Continue to add card" becomes "Continue to add
     booking".
   - "Save card" becomes "Save booking", and "Card added" becomes "Booking added".
   - "Cancel card" becomes "Cancel booking", and "Card total" becomes "Booking total".
   - "Card history" becomes "Booking history".
   - "Cards still to finish" becomes "Bookings still to finish", and "N card(s) to finish"
     becomes "N booking(s) to finish".
   - "Card complete" becomes "Booking complete", "No cards on this list yet." becomes "No
     bookings on this List yet.", and "Move card" becomes "Move booking".
   - `Section label={`Cards (n)`}` in `ListDrawer` becomes "Bookings (n)".
   - The refusal texts from item 4.

   "Copy for an additional procedure" is **not** renamed here: item 13 replaces it. The physical
   card keeps its name ("Photograph the booking card", "Paper card A").

   Gate: `grep -rniE "\bcards?\b" aa-prototype/src aa-prototype/pwa` must return only visual-card
   and physical-card hits (class 2 and 3 in item 2). List any remaining hits in the PROGRESS entry
   with their class. No en or em dash is introduced: grep for `–` and `—` in changed files. No
   user-visible string says "swap" for a List changing hands or "timesheet" at all (`grep -rniE
   "swap|timesheet"` over the same folders; today the hits are code comments and CSS
   `font-display: swap`, which stay).

9. **Tests and Playwright, then re-green (end of session 1).**
   - Rename the test and spec files: `card-attachments.spec.ts` becomes
     `booking-attachments.spec.ts`, and `card-calculation-display.spec.ts` becomes
     `booking-calculation-display.spec.ts`.
   - Update string, route and test-id assertions.
   - Add a `routing.spec.ts` case: open `/web/lists/L-34821-2026-07-21-PM/cards/C0009` and land on
     `/web/lists/L-34821-2026-07-21-PM/bookings/BK0009`. Add the same for admin and mobile.
   - Add a Vitest test for `legacyBookingId` (`C0009`, `HC05`, an already-new id, and an
     unknown string that passes through for `RequireEntity` to bounce).
   - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, all green.
     Compare screenshots with the baseline: only wording differs.
   - Walk S1 to S5 quickly in the browser. **Stop here if the session ends.** The app is
     demoable with Booking vocabulary and nothing else changed. Record the checkpoint in PROGRESS
     (status IN PROGRESS).

### Session 2 · Step B: source, attachments and Copy

10. **Optional `Booking.source`** (DM-01, DM-39). Keep it thin: a descriptive field, not a
    workflow input.
    - Add
      `export type BookingSource = 'hospitalDownload' | 'surgeonPdf' | 'admin' | 'anaesthetistAdHoc' | 'anaesthetistPhoto' | 'copy'`
      to `domain/types.ts` and an **optional** `source?: BookingSource` on `Booking`. It sits
      beside `correlationRef`, which stays as the integration key. Absent means "not recorded"
      and renders nothing. No validator, lifecycle guard, selector filter, billing module or
      review flag reads it, and later phases must not start to: the audit trail stays the record
      of where each change came from.
    - `createBooking` takes an optional `source` in `CreateBookingInput` and, when given, records
      it in the `booking.create` audit `after`. Its only UI caller is `ManualBookingForm.save()`
      (both prongs: the photo prong pre-fills the same form), so add an optional `source` prop to
      `ManualBookingForm`, passed by `AddBookingFlow` from the prong and the actor. `copyBooking`
      and `addPostOpAddendum` build the Booking literal directly, so they set `source` there.
      Stamp it on each creation path that knows it:

      | Path | Source |
      |---|---|
      | `AddBookingFlow` manual prong, anaesthetist actor (mobile, web) | `anaesthetistAdHoc` |
      | `AddBookingFlow` photo prong, anaesthetist actor | `anaesthetistPhoto` |
      | `AddBookingFlow` from Admin (`PhoneAdviceBooking`), either prong | `admin` |
      | `processMessage` S12 create (HL7/FHIR simulator) | `hospitalDownload`. This is interim: it stands in for the hospital download until 33 routes it through the matching screen |
      | `ingestPdfRow` create | `surgeonPdf` |
      | `copyBooking` | `copy` |
      | `addPostOpAddendum` | `admin` for an office actor, `anaesthetistAdHoc` otherwise. This is interim: the addendum is replaced by the additional invoice in 39 and post-op events in 39b |

    - **Seed rule** (deterministic, no RNG draw), for the scenario Bookings in
      `domain/seed/bookings.ts` only, applied in this order:
      1. Scenario Bookings that the script describes as phoned in or added by the anaesthetist
         get that explicit value.
      2. A Booking with a `correlationRef`, or on a List at a hospital with a seeded feed (St
         George's, Southern Cross, Christchurch Public), gets `hospitalDownload`.
      3. A Booking at Forte Health or Christchurch Eye Surgery gets `surgeonPdf`: those are the
         surgeon-PDF hospitals in `domain/integrations/pdfSamples.ts`.
      4. Anything left (a List with no hospital) gets `admin`, so every scenario Booking has one.
      The generated history Bookings in `history.ts` stay unset: the field is optional, and
      leaving them alone keeps the history generator untouched and the persisted size flat.
    - **Display.** Add a `BOOKING_SOURCE_LABELS` map in `shared/format.ts`:
      - `hospitalDownload`: "Hospital download"
      - `surgeonPdf`: "Surgeon PDF"
      - `admin`: "Office entry"
      - `anaesthetistAdHoc`: "Added by anaesthetist"
      - `anaesthetistPhoto`: "Added from a photo of the booking card"
      - `copy`: "Copy of another Booking"

      Show it, when set, as one quiet micro-cap line in the Booking detail context block
      ("SOURCE · Surgeon PDF"), on all three surfaces via `BookingDetailBody`. When unset, show
      nothing (no "Unknown" placeholder). Add a `FIELD_LABELS` entry for `source`. No list,
      table, filter or column shows it.
    - **Tests:**
      - each creation path stamps its source (bookingActions, integrationActions, intake/PDF,
        addendum);
      - every seeded source that is set is a valid `BookingSource`, and every scenario Booking
        has one;
      - a Booking with no source renders no source line;
      - `buildSeed()` is still deterministic (two builds deep-equal).

11. **Attachments model** (US-03.1.3, DM-39).
    - `Attachment` (renamed from `CardAttachment`: `id`, `name`, kind `photo`, `pdf` or `other`,
      optional `dataUrl`) is shared by `Booking.attachments` and a new optional
      **`List.attachments?: Attachment[]`**. It is optional so the roughly 3,900 generated Lists
      carry nothing, and absent is read as empty. `reassignList` already spreads the List, so its
      attachments travel with it. Assert that in a test.
    - Add a new `store/attachmentActions.ts`:
      - `addAttachment(api, actor, target, file)` and `removeAttachment(api, actor, target, attachmentId)`,
        where `target` is `{ kind: 'booking', id }` or `{ kind: 'list', id }`.
      - Rights come from `editRefusal` on the List (the Booking's List for a Booking target).
        A cancelled Booking refuses with `bookingCancelled`, and an AUTHORISED List refuses as
        today.
      - Ids are store-allocated through `allocateId(counters, 'attachment')`, with prefix `AT`
        and pad 4 (add it to `ID_FORMATS`). This replaces the component-side `${cardId}-A${n}`
        allocation in `addPhoto`, and supersedes the 2026-07-27 fix that counted one past the
        highest index. Display names ("Photo 3") are no longer derived from ids.
      - Audit: `booking.attachmentAdd`, `booking.attachmentRemove`, `list.attachmentAdd` and
        `list.attachmentRemove`, with `after` and `before` carrying `{ attachmentId, name, kind }`
        only, **never the data URL**, to keep the audit small. A Booking target stamps that
        Booking. A List target sets `stampBookingId: null`.
      - Add `ACTION_LABELS` entries ("Attachment added", "Attachment removed", "List attachment
        added", "List attachment removed").
    - Remove `attachments` from `BookingPatch`, so `editBooking` can no longer write attachments
      and every attachment write goes through the new actions. `createBooking`'s photo-path
      `attachment` input uses the same allocator.
    - **Tests:**
      - add and remove on a Booking and on a List;
      - the rights matrix: anaesthetist on own DRAFT only, office on DRAFT and SUBMITTED, refused
        on AUTHORISED and on a cancelled Booking;
      - ids are unique across add, remove and re-add;
      - the audit carries no `dataUrl`;
      - `reassignList` keeps List attachments.

12. **Simulated attach UI.**
    - **Samples.** Add a new `src/assets/sampleAttachments.ts`:
      - "Photo of the booking card" (photo, reusing `PAPER_CARD_A` and `PAPER_CARD_B`);
      - "Surgeon's letter" and "Consent form" (pdf, each a small inline SVG facsimile in the
        style of `samplePaperCards.ts` and the `domain/integrations/pdfSamples.ts` facsimile);
      - "Theatre list" (pdf).

      All are data URLs of a few KB. There is no real file input: data URLs persist to
      localStorage against the 5 MB budget, and the gap analysis asked for a badged simulation.
    - **Shared components.** In a new `src/shared/attachments/`, add:
      - `AttachmentStrip.tsx`, extracted from `BookingDetailBody`'s Attachments section. It
        keeps the thumbnail grid, the hover and focus-revealed remove on the thumbnail and the
        paired-height behaviour pinned by `booking-attachments.spec.ts`. A pdf renders as its
        facsimile with a small "PDF" chip.
      - `AddAttachmentSheet.tsx`, through `useSurface().Overlay`, so it is a bottom sheet on
        mobile and a dialog on web. It has two sections, "Take a photo" and "Choose a file", each
        listing the samples, under a `DemoBadge` reading "Simulated file picker".
    - **Booking detail.** "Add photo" becomes "Add attachment" (teal text action, `Paperclip` or
      `ImagePlus` icon), opening the sheet with a Booking target.
    - **Mobile List detail** (`ListDetailScreen.tsx`). Add a "List attachments" section after the
      Booking rows and before the dashed "Add a booking" button: a micro-cap label, the strip (or
      "No attachments on this List." when empty) and the teal "Add attachment" action when the
      List is editable. Hide the whole section when the List is not editable and has no
      attachments. Keep the `DockSpacer` tail rule intact.
    - **Web List detail** (`ListDetailView.tsx`). Add a "List attachments" panel under the
      Bookings table panel, using the same components.
    - **Admin** (`ListDrawer.tsx`). Add a read-only "Attachments (n)" row with thumbnails. Admin
      add is not required by US-03.1.3; do not add it.
    - **Seed** one List attachment: "Theatre list · St George's" (pdf) on Dr Souter's Tue 28 Jul
      AM List (the S1 destination List), so the feature is visible after Reset. Add it to
      `SEED_MARKERS`. **Bump `PERSIST_VERSION`** again with a comment line ("Booking.source, List
      attachments, AT ids").
    - Add `data-shot` hooks `booking-attachments` and `list-attachments`, and update
      `booking-attachments.spec.ts` to cover the List strip and the sheet.

13. **Copy becomes a skeleton-only new Booking** (RV-03, US-02.4.3).
    - Rewrite `copyBooking` in `store/bookingActions.ts`. The new Booking:
      - is on the same List, with the same `patientId`, `copiedFromBookingId` set and
        `source: 'copy'`;
      - has `completed: false`, and no notes, attachments, `scheduledTime`, `correlationRef` or
        `cancellation`;
      - has **one fresh primary Procedure** with `isAdditional: false`, an empty description and
        no RVG code, times, ASA, modifiers, billing lines, override, insurer, billable party
        (`billablePartyId`), payment category or governing Contract;
      - carries the source's primary `billingReference`, which is the "references" reading from
        the drift check;
      - gets `billingRoute: 'hospital'` as a **default, not an inheritance**: the same starting
        value `ManualBookingForm` offers any new Booking. Without it the anaesthetist could not
        complete the copy (the validator demands a route and only the office's
        `OfficeBillingSetup` can set one), so a copy made on mobile would block its List's
        submit until the office stepped in. This is interim: 20 removes the route and puts the
        default hospital Contract in its place.

      Delete the "inherit the funding context" block and the doc comment that calls Copy the
      additional-procedure mechanism. The audit stays `booking.copy` plus `procedure.create`,
      with `after: { isAdditional: false, billingRoute: 'hospital' }`.
    - The source Booking is untouched. The copy is incomplete and fails validation until it is
      captured (the RVG code and times). Once captured, the anaesthetist completes it unaided,
      and the office can change the route in review as for any Booking.
    - **UI.** The button "Copy for an additional procedure" becomes **"Copy booking"**, with a
      one-line caption under the actions: "Starts a new Booking for this patient on this List.
      To add a procedure to this Booking, use Add another procedure."
    - `onCopied` becomes `onCopied(newBookingId)`, and all three wrappers open the new Booking,
      not the List:
      - mobile `/mobile/lists/:listId/bookings/:newId`, checking that the slide stack replaces
        its top layer cleanly;
      - web `/web/lists/:listId/bookings/:newId`;
      - admin `/admin/day/:dateISO/bookings/:newId`.
    - "Add another procedure" (`addProcedure`) is now the only way to add an additional Procedure.
      Leave its behaviour alone: 23 owns exactly-one-primary, "Make primary" and the
      multi-procedure rule.
    - **Keep the time-only additional-procedure beat alive until 23.** Copy no longer creates one,
      so confirm that the two seeded two-procedure Bookings still render and price exactly as
      before: Brian Holt on Souter Mon 20 AM at Forte (the S3 split Booking, AA-2026-0002 at
      $396.18) and the bariatric Booking on Fitzgerald Tue 14. The existing
      `store/demoScenarios.test.ts` assertion on Holt's 396.18 must pass unchanged; add one on the
      bariatric Booking's fee if none exists. If the demo
      guide or cheat sheet pointed at Copy for this talking point, re-point it to Holt. Seed a new
      two-procedure Booking only if the demo-guide read in item 14 finds a scripted beat that
      neither seeded Booking serves.
    - **Playwright:** `visual/mobile-phase04.spec.ts` (about L151) clicks "Copy for an additional
      procedure" and expects to land on the List. Rework it for "Copy booking" landing on the new
      Booking. Update the `copyCard` comment in `store/captureActions.test.ts` (about L295).
    - **Tests** (rework the existing Copy tests):
      - the copy's Procedure is primary (`isAdditional: false`), none of the listed fields is
        inherited, and the route is `'hospital'` even when the source's was `insurer` or
        `billableParty`;
      - an anaesthetist actor can capture and `completeBooking` the copy with no office step;
      - `billingReference` is carried and `correlationRef` is not;
      - `source` is `'copy'`;
      - `feeFor` on a captured copy charges base and modifier units (not time-only);
      - the copy blocks `submitList` until completed, as today;
      - the rights matrix is unchanged;
      - `findBookingByCorrelation` still finds exactly one Booking after a copy.

14. **Demo guide, Control Panel and in-app scenario text** (the same session).
    - Sweep `docs/demo-guide/01-personas-and-responsibilities.md`, `02-workflows-and-handoffs.md`,
      `03-demo-script.md`, `04-presenter-cheat-sheet.md`, `README.md` and the same sections of
      `master-demo-guide.html`: Card becomes Booking, the physical card keeps its name, and route
      tables change `/cards/<cardId>` to `/bookings/<bookingId>`.
    - Persona item 10 ("Copy a Card skeleton when recording an additional procedure, with
      time-only charging rules") becomes the new Copy plus "Add another procedure".
    - Vocabulary in the same sweep: `01-personas-and-responsibilities.md` "See availability for
      possible cover or swaps" becomes "possible cover or reassignment". The modifier-picker lines
      that say a sibling "swaps it in" (02 workflows, 04 cheat sheet and the matching
      `master-demo-guide.html` paragraphs) become "replaces it", so a `swap` grep of the guide
      comes back clean. Nothing in the guide says "timesheet"; keep it that way. "Permanent
      lists" stays for Phase 30.
    - Add an optional aside in S1 Beat 2 on the List's attachments (the seeded theatre-list PDF).
    - Update `DemoControlPanel.tsx`: the `SCENARIOS` text and trigger result messages ("a fourth
      Booking", "the split-billing Booking", "open its booking").
    - The planning docs under `docs/prototype-build/` (phases 00 to 13, historical PROGRESS
      entries) are history. Do not rewrite them.

15. **The prototype README and analysis maps.**
    - Update `aa-prototype/README.md`'s `src/` folder map: `shared/booking/`,
      `store/bookingActions.ts`, `store/attachmentActions.ts`, `shared/attachments/` and
      `domain/seed/bookings.ts`.
    - Add one line at the top of each
      `docs/prototype-build/catch-up/analysis/prototype-map-*.md`: "Phase 15 renamed Card to
      Booking; translate names with the map in PROGRESS.md (Phase 15 entry)." Do not rewrite the
      maps.

16. **Keep the catalogue's screenshot tooling working.**
    - `requirements-board/capture/recipes/*.json` (about 96 files) and `capture/ATLAS.md`
      hard-code `/cards/C0009`-style routes, `C####` and `HC##` ids, "Add a card", "Cancel card", "Card
      history", `slide-card`, `mobile-card-*`, `card-calculation` and `data-shot=card-*`.
      Update them with a scripted, reviewed replace to the new routes, ids, text and hooks.
    - `recipes/US-02.4.3.json` and `US-03.2.3.json` click "Copy for an additional procedure".
      Point them at "Copy booking", and make the "copied" step expect the new Booking (item 13),
      not the List.
    - `recipes/US-07.3.2.json` types the history id `HC05`: it becomes `HBK05` (item 5).
    - **Do not change any shot `name` field**: those name the catalogue's asset files.
    - Run `npm run verify:board` from the repo root, green.
    - The images are re-captured in this phase's Catalogue screenshots step (after the review pass), not here; this item only keeps the recipes pointing at real screens.

17. **Finish and flag.**
    - Final `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, all
      green.
    - The stale catalogue images and captions for US-02.4.3, US-03.2.3 and US-03.1.3 ("Copy for an
      additional procedure", "Add photo") are re-shot and re-captioned by the Catalogue screenshots
      step below. Do not edit catalogue files in this phase; the capture runner writes the items'
      `images`.

## Demo triggers

None. Everything in this phase demos through normal use:

- the attach sheet and "Copy booking" are product actions in the product UI;
- the attach sheet's file picker is a simulation, so it carries a `DemoBadge` inside the sheet,
  not a harness-bar button;
- `Booking.source`, where set, is visible on the Booking itself.

**PWA:** no stand-in is needed. The attach sheet, the List attachments section and Copy live on
the mobile screens, so they ship in `dist-pwa` unchanged. Check them under `npm run dev:pwa`.

If Phase 14 has run, its registry entries are **re-pointed, not added**: route patterns
`…/cards/:cardId` become `…/bookings/:bookingId`, labels say Booking, and the context key follows
the map. The Control Panel index lists them under the renamed screens.

## Out of scope

- The booking-level state DM-01 names:
  - warnings and the warning triangle (15a);
  - billable party and invoice email (21);
  - prepayment state (27). Estimated duration is per Procedure (DM-40), also 27.
  - Insurer and funding source are held on neither the Booking nor the Patient (OQ-55); 20
    removes the Procedure's insurer. Do not add either here.
- Any rule, filter, report or warning that reads `Booking.source`.
- Moving a Booking to the List of the anaesthetist who did it (US-01.4.6, 32), and anaesthetists
  moving their own Lists (32).
- Search by NHI or name and the past-day calendar (US-03.1.6, US-03.1.7, which DM-39 also
  mentions): 38a.
- The "Permanent List" to "recurring booking" rename (30) and Draft Lists (31).
- Exactly one primary Procedure, "Make primary", the 3/2/2 modifier split and the multi-procedure
  rule (23). Time-only additional Procedures stay as they are until then.
- Routing hospital messages through a matching screen: `hospitalDownload` is stamped by today's
  HL7/FHIR path as an interim (33). Surgeon PDF upload (34).
- The post-op addendum Booking itself (RV-10, replaced by free-form additional invoices in 39 and
  pre-op and post-op events in 39b). Only its names change here.
- A real camera or file input, an attachment viewer or download beyond the thumbnail, OCR, and
  attaching from Admin.
- Any edit to a catalogue requirement's text or status (the capture runner writes the screenshots and the items' `images`; that is the Catalogue screenshots step).
- The design mockups' own "Card" labels, the RFP reference docs, and the historical planning docs
  and PROGRESS entries.
- Renaming visual-card components and design tokens (item 2, class 2).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] No screen in Mobile, Web, Admin, the Control Panel, the Data Inspector, the Integrations or Xero simulators, or the PWA More panel says "card" for a Booking. "Card" survives only for the physical booking card (photo capture) and in visual-card component names.
- [ ] Old bookmarks redirect: `/web/lists/L-34821-2026-07-21-PM/cards/C0009`, `/mobile/lists/L-34821-2026-07-21-PM/cards/C0009` and `/admin/day/2026-07-21/cards/C0009` each land on Margaret Ellison's Booking under `/bookings/BK0009`.
- [ ] After Reset, S1 to S5 run as scripted in the updated guide, and every figure is unchanged, including Holt's $396.18 in S3.
- [ ] The Audit viewer and every History sheet read "Booking created", "Booking completed" and so on, and filter by Booking. There are no raw `card.*` codes.
- [ ] A new manual Booking on mobile shows "Added by anaesthetist". A photo Booking shows "Added from a photo of the booking card". An Admin phone-advice Booking shows "Office entry". A fired MSG-STG-1001 shows "Hospital download". An ingested PDF row shows "Surgeon PDF". A seeded Forte scenario Booking shows "Surgeon PDF". A generated history Booking shows no source line and no placeholder, and nothing else on screen (lists, tables, filters, review flags) changes with the source.
- [ ] No app screen or demo-guide page says "swap" for a List changing hands, or "timesheet". "Permanent list" wording is unchanged (Phase 30's).
- [ ] On a DRAFT Booking, "Add attachment" opens the sheet (bottom sheet on mobile, dialog on web) with the "Simulated file picker" badge. A photo and a PDF both attach, show as thumbnails and remove. Each add and remove appears in History.
- [ ] On Dr Souter's Tue 28 Jul AM List, the seeded "Theatre list · St George's" PDF shows under List attachments on mobile and web. A second file can be attached to the List. The Admin List drawer shows both read-only.
- [ ] On a SUBMITTED List, the anaesthetist sees no attach or remove controls on the List or its Bookings; the office can still attach to a Booking. On an AUTHORISED List, nobody can.
- [ ] "Copy booking" on Ellison opens a new Booking. It has the same patient and List, a blank primary procedure with base and modifier capture enabled (not the additional-procedure note) and the source's billing reference. It shows "Copy of another Booking", with the default hospital route and no contract, insurer or attachments. The anaesthetist captures and completes it on mobile with no office step. The original Booking is unchanged, and the List's submit is blocked until the copy is completed.
- [ ] "Add another procedure" on a Booking still adds a time-only additional Procedure, as before.
- [ ] The PWA (`npm run dev:pwa`) shows the renamed copy, the List attachments section, the attach sheet and Copy. An old `/cards/` URL redirects there too.
- [ ] The before and after screenshots from `npm run shots` differ only in wording and the new attachment sections.
- [ ] `npm run verify:board` green after the recipe sweep.
- [ ] Catalogue screenshots: the recipes for US-03.1.3 are created or updated, any recipe this phase broke is re-pointed (the Copy recipes US-02.4.3 and US-03.2.3, US-07.3.2 and the `card-calculation` ones), a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa` and `npx vitest run` green, and `npm run shots` green.

## Demo guide updates

All four docs, the README and `master-demo-guide.html` change wording (Card to Booking, keeping
the physical card) and route tables (`/cards/` to `/bookings/`). Specific beats:

- **S1:**
  - Beat 1 "a fourth Card for Sarah Mitchell" becomes a fourth Booking.
  - Beat 2 becomes "the Booking fills over the days before theatre", with an optional aside
    opening the List's seeded theatre-list PDF.
  - The capture steps' button names change ("Cards still to finish" becomes "Bookings still to
    finish").
- **S2:** the phone-advice steps become "Continue to add booking, Enter manually, Look up, Review,
  Save booking, Done". The reassignment "preserves the Bookings".
- **S3:** "the split-billing Booking" and "the two-funder Booking". The figures are unchanged.
- **S4:** "addendum Booking" (still present until 39), and the billing failure "isolates that
  Booking".
- **S5:** "the audit trail of a much-edited Booking".
- **Personas** (01) item 10 and the web-parity line: the new Copy, and "Add another procedure" for
  additional procedures. "Cover or swaps" becomes "cover or reassignment".
- **Vocabulary, all docs:** a List is reassigned or moved, never swapped; the modifier-picker
  "swaps it in" lines become "replaces it"; no "timesheet". "Permanent lists" stays for Phase 30.
- **Workflows** (02): manual and photo "Booking creation"; "photographs a paper booking card".
- **Cheat sheet** (04): "Add, copy or missing Booking"; the time-only line points at Holt.
- **Control Panel:** the `SCENARIOS` text and the trigger result messages.

This is not a milestone phase, so no full consistency read is required. Patch the same sections of
`master-demo-guide.html` in the same session.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 15` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-03.1.3](../../../../requirements-board/requirements/stories/US-03.1.3.md) Attachments | partial · web-attachments[empty,added], mobile-attachments[empty,added] | captured (a Booking and a List both take attachments, other file types included, as a badged simulation); drop the partial reason. Keep the `attachments` shots on web and mobile with states `empty` and `added`, now on `/bookings/BK0009`, highlight `[data-shot=booking-attachments]`, click "Add attachment" and pick a sample in the sheet; captions "Attachments section with Add attachment" and "A photo attached to the Booking". Add a state `sheet` showing the "Simulated file picker" badge. Add a new shot `list-attachments` on web and mobile at the Tue 28 Jul AM List (the seeded "Theatre list · St George's" PDF), highlight `[data-shot=list-attachments]`, caption "Attachments on the whole List" |

**Recipes this phase breaks.** Nearly all of them: about 96 recipes name "card" in a route, id, button
text or hook, and 57 use a `/cards/` start route. Work item 16 is the scripted, reviewed replace
(routes to `/bookings/BK####`, `C####` and `HC##` ids, "Add a card", "Cancel card", "Card history",
`slide-card`, `mobile-card-*`, `card-calculation` to `booking-calculation`, `data-shot=card-*`). The
named ones are:
- `US-02.4.3` and `US-03.2.3`: click "Copy for an additional procedure" (to "Copy booking", the
  "copied" step now expects the new Booking), and their captions say "on a Card" and "copy the card
  for an additional procedure". Reword to the new Copy: a skeleton Booking with its own primary
  Procedure; `US-03.2.3`'s "Add another procedure" shot stays the additional-procedure path.
- `US-07.3.2`: types the history id `HC05`, now `HBK05`.
- The four recipes fixed in Phase 14's baseline sweep (US-03.5.2, US-05.2.1, US-05.3.5, US-05.4.1)
  and every recipe on `card-calculation`: now `booking-calculation`.
- Any recipe whose caption still says "Card" for a Booking: reword to Booking. Keep every shot `name`.

**ATLAS.md.** Routes (`/cards/` to `/bookings/`), Personas and IDs (`C####` to `BK####`, `HC##` to
`HBK##`), Seed data worth shooting (Margaret Ellison's `BK0009`, the new List attachment on Tue 28 Jul
AM), Overlays (the attach sheet) and Existing hooks (`slide-booking`, `mobile-booking-*`,
`booking-calculation`, `booking-attachments`, `list-attachments`).

## Adversarial review (after build)

After the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:

1. Fan out independent Opus review subagents: one each for **quality**, **bugs/correctness** and
   **plan adherence**, plus a fourth for **rename completeness**, given the diff size.
2. This session independently verifies every finding against the catalogue, this doc and the code.
3. Fix the confirmed findings and re-green all four suites.
4. Record the pass in the phase entry.

Do not re-raise anything settled in the Decisions log, except the rulings this phase explicitly
supersedes.

**Steer this phase's reviewers at:**

- **Rename completeness and correctness.** No entity-sense `card` survives in identifiers, audit
  strings, refusal codes, routes, test ids or user-visible copy. No visual-card component, design
  token or physical-card wording was renamed by mistake. The grep gate's leftovers are all class 2
  or 3.
- **Behaviour parity of step A.** Every billing figure, validation message (apart from the word),
  lifecycle guard and seed value is identical before and after. The id numbering is preserved
  (`BK0009` is Ellison, `HBK05` the old `HC05`). No RNG draw was added or reordered.
- **Redirects.** Every legacy `/cards/` URL, including the mobile splat, the PWA and admin day
  URLs, resolves to the right Booking or bounces cleanly through `RequireEntity`. The helper lives
  outside the PWA-forbidden closure.
- **Copy.** The new Booking inherits exactly patient, List and billing reference. Its route is
  the `'hospital'` default, never the source's; there is no insurer, billable party, category,
  Contract, time, correlation, note or attachment. Its Procedure is primary, its fee charges base
  units, and an anaesthetist can complete it unaided. The source Booking and the correlation
  lookup are unaffected.
- **Source.** It is optional and display-only: every creation path that knows its source
  (integration, PDF, addendum, copy, the add flow and the scenario seed) stamps the right value,
  absent renders nothing, and no validator, guard, selector, billing module, review flag or test
  fixture depends on it being set. The seed rule uses no randomness and leaves the history
  generator untouched.
- **Scope.** The rename adds no booking-level state (no warnings, billable party, invoice email,
  prepayment, insurer or funding source on the Booking), and does not touch "Permanent List" or
  Draft List code.
- **Vocabulary.** No new or changed user-visible string says "swap" for a List or "timesheet",
  and no rename produced "Permanent Booking".
- **Attachments.**
  - All writes go through `addAttachment` and `removeAttachment` under `mutate()`, with the
    rights matrix honoured; `editBooking` can no longer write them.
  - Ids are store-allocated and unique, and no data URL lands in the audit log.
  - List attachments survive `reassignList`.
  - The persisted size stays well inside the budget.
- **Copy rules:** no en or em dashes in any new or changed string; teal only for the new actions;
  the simulated picker is badged.
- **Tooling:** the requirements-board recipes point at real routes and selectors, no shot `name`
  changed, `npm run verify:board` passes, and the full capture run ends with no failed recipe.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- **Status.** Add a row for catch-up Phase 15 to the status table (in the catch-up section, which
  Phase 14 adds if it ran first). Mark it IN PROGRESS at the session 1 checkpoint and DONE at the
  end.
- **Phase entry:**
  - the drift-check result against `501b0b8`, and whether Phase 14 had run;
  - the rename rules (item 2) and the **full old-to-new name map**, for later phases whose docs
    use Card names;
  - the grep gate's accepted leftovers;
  - the `BookingSource` values, that the field is optional and display-only, and the seed rule;
  - the attachment model and id prefix;
  - both `PERSIST_VERSION` bumps;
  - test and spec counts before and after;
  - the review pass.
- **Decisions log:**
  1. **Vocabulary.** The catalogue's Booking replaces the RFP's Card everywhere, in identifiers as
     well as copy. This amends convention 10 ("RFP vocabulary" becomes the catalogue's
     vocabulary, which supersedes the RFP) and goes beyond RV-12's "identifiers may stay",
     because later phases write new Booking code. "Card" means only the physical booking card.
     Lists are reassigned or moved, never swapped, and "timesheet" is not used.
  2. **Copy supersedes two July rulings:** the 2026-07-22 Third external plan review #2 ("Card
     Copy is the RFP's additional-procedure mechanism") and the `copyCard` part of the 2026-07-23
     Phase 03 store-additions entry. Copy is now a skeleton-only new Booking with a primary
     Procedure. "References" is read as the billing reference, not the correlation ref (recorded
     as the reading used, since US-02.4.3 does not define the word). The copy's route is the
     add-flow default `'hospital'`, not the source's, as an interim until 20.
  3. **`Booking.source`** is optional and display-only (DM-39: no story requires it; the audit
     trail records each change's source). No rule reads it. HL7/FHIR creates stamp
     `hospitalDownload` as an interim until 33, and the addendum source follows the actor until
     39 replaces the addendum.
  4. **Attachment ids** are store-allocated (`AT####`) through `addAttachment` and
     `removeAttachment`, superseding the 2026-07-27 component-side index fix. Audit entries carry
     metadata only.
- **Catalogue screenshots:** the recipes created or changed (US-03.1.3, the Copy and history recipes, the
  hook sweep), the `REPORT.md` counts before and after (captured, partial, absent, failed), and any
  partial reason handed to a later phase.
