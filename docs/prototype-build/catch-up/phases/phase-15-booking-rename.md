# Phase 15 · Card becomes Booking

**Requirements covered:** [US-03.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.3.md) Attachments;
[DM-01](../analysis/domain-model-delta.md#dm-01) Card becomes Booking (the rename and `source` only; its booking-level billing fields land in 20, 21 and 27);
[DM-34](../analysis/domain-model-delta.md#dm-34) Booking source, List-level attachments and Copy a Booking;
[RV-12](../analysis/reverse-check.md#rv-12-vocabulary-card-for-a-booking) "Card" used for a Booking throughout the UI;
[RV-03](../analysis/reverse-check.md#rv-03-card-copy-is-used-as-the-additional-procedure-mechanism) Card Copy used as the additional-procedure mechanism.
Read alongside (not closed here): [US-02.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.3.md) Copy a Booking,
[US-02.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.1.md) Add a Booking manually or from a photo,
[FT-03.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.2.md) Booking structure,
[US-03.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.3.md) Add additional Procedures, and
[domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md) section 2 "Booking" and the glossary.
**Depends on:** none. Runs first with Phase 14, in either order. It must run before any phase that edits booking code (16 onward). If 14 ran first, this rename also covers the demo-trigger registry's route patterns, labels and context keys.
**Estimated:** 2 sessions. Session 1 is the mechanical rename (work items 1 to 9), re-greened and demoable. Session 2 adds the fields and reworks Copy (work items 10 to 17).

## Goal

The catalogue replaced "Card" with **Booking**: an appointment for one patient within a List.
"Card" now means only the physical hospital or surgeon booking card. The prototype still says Card
throughout: in types, ids, store actions, selectors, audit strings, seed, routes, test hooks and
the copy of all three apps, the Control Panel and the demo guide. This phase renames all of it.

It also adds the first two Booking-level facts the catalogue asks for:

- **`Booking.source`** records how every Booking entered the system (hospital download, surgeon
  PDF, admin, anaesthetist ad hoc, anaesthetist photo, copy).
- **List-level attachments** sit beside Booking attachments, with a badged, simulated file attach
  in place of today's canned "Add photo".

Finally, **Copy becomes what the catalogue says it is**: a new Booking with only the skeleton
(patient, List and references) and a fresh **primary** Procedure, inheriting nothing else.
Additional Procedures are added inside a Booking with "Add another procedure", which already
exists. Copy stops being the RFP's additional-procedure mechanism, and that settled July ruling
is superseded.

The rename is the widest diff of the catch-up by file count (about 180 files use the word). It
has to be mechanical, reviewable and re-greened on its own before anything changes behaviour.

## Before you start: drift check

1. Diff the covered and read-alongside items against the plan's catalogue snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-03.1.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.4.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.4.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-02.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-03.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-03.2.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/EP-02.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/EP-03.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Also run the whole-catalogue diff from ROADMAP.md "When the catalogue changes" and scan it for
   any new item that names Booking, Copy, source or attachments.
2. If an item changed, re-read it and adjust the work items. Specific things to look for:
   - **Booking sources** (domain-model "Booking > Sources"). If the list of sources changed, the
     `BookingSource` union in work item 10 follows the catalogue.
   - **Copy** (US-02.4.3). If "references" is now defined, carry exactly those. The default
     reading is below.
   - **Attachments** (US-03.1.3, Proposed). If it moved to Future or Retired, drop work items 11
     and 12, keep today's Booking photo attach under the new names, and note the drop in PROGRESS.md.
   - **Vocabulary** (glossary). If "Booking" was renamed again, stop and ask the owner before
     renaming 180 files.
3. If US-03.1.3 is now Retired or Future, remove it from this phase's covers and record that in the
   PROGRESS entry. DM-01, DM-34, RV-03 and RV-12 are model findings: they stand unless the
   domain-model's Booking section changes.
4. **Check whether Phase 14 has run** (look for `aa-prototype/src/shared/demoTriggers/`, with
   `registry.ts` and the `useDemoTriggerContext` hook, and for a Phase 14 PROGRESS entry). If it has,
   work item 7 includes the registry.
5. **Open questions.** None block this phase. Two sit nearby, and neither needs a provisional label:
   - [OQ-34](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-34.md)
     asks whether the surgeon PDF is the main pathway by volume. It affects nothing built here: the
     source is recorded either way.
   - [OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md)
     (combined procedures) is parked, so leave the Procedure structure alone.
   - **Default reading of "references" in Copy:** the Booking's billing reference (the hospital or
     PO reference, stored today as `Procedure.billingReference` on the primary Procedure). It is
     **not** the hospital appointment correlation (`correlationRef`). A copy is a different
     appointment, and sharing the correlation would let a hospital change message hit two
     Bookings. Label this reading in the Decisions log. The gap analysis flagged US-02.4.3's
     "references" as ambiguous.

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
  (Matches, with the "references" ambiguity), `dataModelDeltas` DM-01 and DM-34, and
  `reverseFindings` RV-03 and RV-12.
- `docs/prototype-build/catch-up/epics/EP-03.md#us-03.1.3`.
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: Themes 5 and 6, "Structural first" item 1, and
  "Remove or rework".
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
     `viaBookingId`), and in the `store/index.ts` barrel.
   - Every audit `entityType` and action string, and every refusal message and code, follows the
     map. The `storeDiscipline` test in `store/mutate.test.ts` still passes: all writes go through
     `mutate()`.

5. **Seed.**
   - `git mv domain/seed/cards.ts domain/seed/bookings.ts` and rename its helpers and scenario
     ids. The seed builds ids by hand, not through `allocateId`: change the `C${…padStart(4)}`
     formatter in `bookings.ts` (`addCard`, about L175) and the generated history Bookings in
     `history.ts` (`build.cards[cardId]`, about L212) to `BK`, and rename the `counters.card` key
     in `domain/seed/index.ts` (about L434) to `counters.booking`, so the store's allocator
     continues from the seed.
   - `audit.ts`, `history.ts`, `billing.ts` and `index.ts` (`SEED_MARKERS` entity types,
     `SEED_PREPAID_BOOKING_ID`) follow.
   - **Do not add, remove or reorder any RNG draw.** Add a Vitest seed test that pins `BK0001`
     to Hemi Walker (Souter Tue 21 AM) and `BK0009` to Margaret Ellison (Souter Tue 21 PM). It
     proves the numbering and the redirect mapping in item 7.
   - **Bump `PERSIST_VERSION`** by one from its current value (13 at `1f067a8`), with a comment
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
     `'BK0009'`. Anything already in `BK` form passes through. This covers the framed web and
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
   with their class. No en or em dash is introduced: grep for `–` and `—` in changed files.

9. **Tests and Playwright, then re-green (end of session 1).**
   - Rename the test and spec files: `card-attachments.spec.ts` becomes
     `booking-attachments.spec.ts`, and `card-calculation-display.spec.ts` becomes
     `booking-calculation-display.spec.ts`.
   - Update string, route and test-id assertions.
   - Add a `routing.spec.ts` case: open `/web/lists/L-34821-2026-07-21-PM/cards/C0009` and land on
     `/web/lists/L-34821-2026-07-21-PM/bookings/BK0009`. Add the same for admin and mobile.
   - Add a Vitest test for `legacyBookingId`.
   - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, all green.
     Compare screenshots with the baseline: only wording differs.
   - Walk S1 to S5 quickly in the browser. **Stop here if the session ends.** The app is
     demoable with Booking vocabulary and nothing else changed. Record the checkpoint in PROGRESS
     (status IN PROGRESS).

### Session 2 · Step B: source, attachments and Copy

10. **`Booking.source`** (DM-01, DM-34).
    - Add
      `export type BookingSource = 'hospitalDownload' | 'surgeonPdf' | 'admin' | 'anaesthetistAdHoc' | 'anaesthetistPhoto' | 'copy'`
      to `domain/types.ts` and a **required** `source: BookingSource` on `Booking`. It sits
      beside `correlationRef`, which stays as the integration key.
    - `createBooking` takes a required `source` in `CreateBookingInput` and records it in the
      `booking.create` audit `after`. Its only UI caller is `ManualBookingForm.save()` (both
      prongs: the photo prong pre-fills the same form), so add a required `source` prop to
      `ManualBookingForm`, passed by `AddBookingFlow` from the prong and the actor. `copyBooking`
      and `addPostOpAddendum` build the Booking literal directly, so they set `source` there.
      Stamp it on every creation path:

      | Path | Source |
      |---|---|
      | `AddBookingFlow` manual prong, anaesthetist actor (mobile, web) | `anaesthetistAdHoc` |
      | `AddBookingFlow` photo prong, anaesthetist actor | `anaesthetistPhoto` |
      | `AddBookingFlow` from Admin (`PhoneAdviceBooking`), either prong | `admin` |
      | `processMessage` S12 create (HL7/FHIR simulator) | `hospitalDownload`. This is interim: it stands in for the hospital download until 33 routes it through the matching screen |
      | `ingestPdfRow` create | `surgeonPdf` |
      | `copyBooking` | `copy` |
      | `addPostOpAddendum` | `admin` for an office actor, `anaesthetistAdHoc` otherwise. This is interim: RV-10 replaces the addendum in 39 |

    - **Seed rule** (deterministic, no RNG draw). A Booking with a `correlationRef`, or on a List
      at a hospital with a seeded feed (St George's, Southern Cross, Christchurch Public), gets
      `hospitalDownload`. A Booking at Forte Health or Christchurch Eye Surgery gets
      `surgeonPdf`: those are the surgeon-PDF hospitals in `pdfSamples.ts`. Scenario Bookings
      that the script describes as phoned in or added by the anaesthetist get the explicit value.
      The generated history Bookings in `history.ts` follow the same hospital rule. A Booking on a
      List with no hospital gets `admin`. Nothing is left unset.
    - **Display.** Add a `BOOKING_SOURCE_LABELS` map in `shared/format.ts`:
      - `hospitalDownload`: "Hospital download"
      - `surgeonPdf`: "Surgeon PDF"
      - `admin`: "Office entry"
      - `anaesthetistAdHoc`: "Added by anaesthetist"
      - `anaesthetistPhoto`: "Added from a photo of the booking card"
      - `copy`: "Copy of another Booking"

      Show it as one quiet micro-cap line in the Booking detail context block ("SOURCE · Surgeon
      PDF"), on all three surfaces via `BookingDetailBody`. Add a `FIELD_LABELS` entry for
      `source`.
    - **Tests:**
      - each creation path stamps its source (bookingActions, integrationActions, intake/PDF,
        addendum);
      - every seeded Booking has a valid source;
      - `buildSeed()` is still deterministic (two builds deep-equal).

11. **Attachments model** (US-03.1.3, DM-34).
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
        style of `samplePaperCards.ts` and the `pdfSamples.ts` facsimile);
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
        no RVG code, times, ASA, modifiers, billing lines, override, billing route, insurer,
        payer, payment category or governing Contract;
      - carries the source's primary `billingReference`, which is the "references" reading from
        the drift check.

      Delete the "inherit the funding context" block and the doc comment that calls Copy the
      additional-procedure mechanism. The audit stays `booking.copy` plus `procedure.create`,
      with `after: { isAdditional: false }`.
    - The source Booking is untouched. The copy is incomplete and fails validation until it is
      captured ("billing route not set" and the RVG or line failures). That is correct: 20
      replaces the route with a default Contract.
    - **UI.** The button "Copy for an additional procedure" becomes **"Copy booking"**, with a
      one-line caption under the actions: "Starts a new Booking for this patient on this List.
      To add a procedure to this Booking, use Add another procedure."
    - `onCopied` becomes `onCopied(newBookingId)`, and all three wrappers open the new Booking,
      not the List:
      - mobile `/mobile/lists/:listId/bookings/:newId`, checking that the slide stack swaps its
        top layer cleanly;
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
      - the copy's Procedure is primary (`isAdditional: false`), and none of the listed fields is
        inherited;
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
      hard-code `/cards/C0009`-style routes, `C####` ids, "Add a card", "Cancel card", "Card
      history", `slide-card`, `mobile-card-*`, `card-calculation` and `data-shot=card-*`.
      Update them with a scripted, reviewed replace to the new routes, ids, text and hooks.
    - `recipes/US-02.4.3.json` and `US-03.2.3.json` click "Copy for an additional procedure".
      Point them at "Copy booking", and make the "copied" step expect the new Booking (item 13),
      not the List.
    - **Do not change any shot `name` field**: those name the catalogue's asset files.
    - Run `npm run verify:board` from the repo root, green.
    - Re-capturing the catalogue images is not part of this phase (work item 17 flags it).

17. **Finish and flag.**
    - Final `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, all
      green.
    - Record in PROGRESS "Discovered for later" that the catalogue's US-02.4.3 and US-03.2.3
      images and captions ("Copy for an additional procedure") and US-03.1.3's ("Add photo") now
      show retired UI. They need a re-capture and a caption edit by the catalogue owner (through
      the catalogue, `npm run check`). Do not edit catalogue files in this phase.

## Demo triggers

None. Everything in this phase demos through normal use:

- the attach sheet and "Copy booking" are product actions in the product UI;
- the attach sheet's file picker is a simulation, so it carries a `DemoBadge` inside the sheet,
  not a harness-bar button;
- `Booking.source` is visible on every Booking.

**PWA:** no stand-in is needed. The attach sheet, the List attachments section and Copy live on
the mobile screens, so they ship in `dist-pwa` unchanged. Check them under `npm run dev:pwa`.

If Phase 14 has run, its registry entries are **re-pointed, not added**: route patterns
`…/cards/:cardId` become `…/bookings/:bookingId`, labels say Booking, and the context key follows
the map. The Control Panel index lists them under the renamed screens.

## Out of scope

- The other Booking-level billing fields of DM-01:
  - billable party and invoice email (21);
  - insurer and funding source (20);
  - prepayment state and estimated duration (27).
- Exactly one primary Procedure, "Make primary", the 3/2/2 modifier split and the multi-procedure
  rule (23). Time-only additional Procedures stay as they are until then.
- Routing hospital messages through a matching screen: `hospitalDownload` is stamped by today's
  HL7/FHIR path as an interim (33). Surgeon PDF upload (34).
- The post-op addendum Booking itself (RV-10, replaced by additional invoices in 39). Only its
  names change here.
- A real camera or file input, an attachment viewer or download beyond the thumbnail, OCR, and
  attaching from Admin.
- Re-capturing or re-captioning the catalogue's screenshots, and any edit to catalogue files.
- The design mockups' own "Card" labels, the RFP reference docs, and the historical planning docs
  and PROGRESS entries.
- Renaming visual-card components and design tokens (item 2, class 2).

## Manual test checklist

- [ ] No screen in Mobile, Web, Admin, the Control Panel, the Data Inspector, the Integrations or Xero simulators, or the PWA More panel says "card" for a Booking. "Card" survives only for the physical booking card (photo capture) and in visual-card component names.
- [ ] Old bookmarks redirect: `/web/lists/L-34821-2026-07-21-PM/cards/C0009`, `/mobile/lists/L-34821-2026-07-21-PM/cards/C0009` and `/admin/day/2026-07-21/cards/C0009` each land on Margaret Ellison's Booking under `/bookings/BK0009`.
- [ ] After Reset, S1 to S5 run as scripted in the updated guide, and every figure is unchanged, including Holt's $396.18 in S3.
- [ ] The Audit viewer and every History sheet read "Booking created", "Booking completed" and so on, and filter by Booking. There are no raw `card.*` codes.
- [ ] A new manual Booking on mobile shows "Added by anaesthetist". A photo Booking shows "Added from a photo of the booking card". An Admin phone-advice Booking shows "Office entry". A fired MSG-STG-1001 shows "Hospital download". An ingested PDF row shows "Surgeon PDF". A seeded Forte Booking shows "Surgeon PDF".
- [ ] On a DRAFT Booking, "Add attachment" opens the sheet (bottom sheet on mobile, dialog on web) with the "Simulated file picker" badge. A photo and a PDF both attach, show as thumbnails and remove. Each add and remove appears in History.
- [ ] On Dr Souter's Tue 28 Jul AM List, the seeded "Theatre list · St George's" PDF shows under List attachments on mobile and web. A second file can be attached to the List. The Admin List drawer shows both read-only.
- [ ] On a SUBMITTED List, the anaesthetist sees no attach or remove controls on the List or its Bookings; the office can still attach to a Booking. On an AUTHORISED List, nobody can.
- [ ] "Copy booking" on Ellison opens a new Booking. It has the same patient and List, a blank primary procedure with base and modifier capture enabled (not the additional-procedure note) and the source's billing reference. It shows "Copy of another Booking", with no route, contract or attachments. The original Booking is unchanged, and the List's submit is blocked until the copy is completed.
- [ ] "Add another procedure" on a Booking still adds a time-only additional Procedure, as before.
- [ ] The PWA (`npm run dev:pwa`) shows the renamed copy, the List attachments section, the attach sheet and Copy. An old `/cards/` URL redirects there too.
- [ ] The before and after screenshots from `npm run shots` differ only in wording and the new attachment sections.
- [ ] `npm run verify:board` green after the recipe sweep.
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
  additional procedures.
- **Workflows** (02): manual and photo "Booking creation"; "photographs a paper booking card".
- **Cheat sheet** (04): "Add, copy or missing Booking"; the time-only line points at Holt.
- **Control Panel:** the `SCENARIOS` text and the trigger result messages.

This is not a milestone phase, so no full consistency read is required. Patch the same sections of
`master-demo-guide.html` in the same session.

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
  (`BK0009` is Ellison). No RNG draw was added or reordered.
- **Redirects.** Every legacy `/cards/` URL, including the mobile splat, the PWA and admin day
  URLs, resolves to the right Booking or bounces cleanly through `RequireEntity`. The helper lives
  outside the PWA-forbidden closure.
- **Copy.** The new Booking inherits exactly patient, List and billing reference. There is no
  route, insurer, payer, category, Contract, time, correlation, note or attachment. Its Procedure
  is primary and its fee charges base units. The source Booking and the correlation lookup are
  unaffected.
- **Source.** Every creation path, including integration, PDF, addendum, copy and seed, stamps
  the right value. None is left unset, and the seed rule uses no randomness.
- **Attachments.**
  - All writes go through `addAttachment` and `removeAttachment` under `mutate()`, with the
    rights matrix honoured; `editBooking` can no longer write them.
  - Ids are store-allocated and unique, and no data URL lands in the audit log.
  - List attachments survive `reassignList`.
  - The persisted size stays well inside the budget.
- **Copy rules:** no en or em dashes in any new or changed string; teal only for the new actions;
  the simulated picker is badged.
- **Tooling:** the requirements-board recipes point at real routes and selectors, no shot `name`
  changed, and `npm run verify:board` passes.

## PROGRESS.md updates

- **Status.** Add a row for catch-up Phase 15 to the status table (in the catch-up section, which
  Phase 14 adds if it ran first). Mark it IN PROGRESS at the session 1 checkpoint and DONE at the
  end.
- **Phase entry:**
  - the drift-check result, and whether Phase 14 had run;
  - the rename rules (item 2) and the **full old-to-new name map**, for later phases whose docs
    use Card names;
  - the grep gate's accepted leftovers;
  - the `BookingSource` values and the seed rule;
  - the attachment model and id prefix;
  - both `PERSIST_VERSION` bumps;
  - test and spec counts before and after;
  - the review pass.
- **Decisions log:**
  1. **Vocabulary.** The catalogue's Booking replaces the RFP's Card everywhere, in identifiers as
     well as copy. This amends convention 10 ("RFP vocabulary" becomes the catalogue's
     vocabulary, which supersedes the RFP) and goes beyond RV-12's "identifiers may stay",
     because later phases write new Booking code. "Card" means only the physical booking card.
  2. **Copy supersedes two July rulings:** the 2026-07-22 Third external plan review #2 ("Card
     Copy is the RFP's additional-procedure mechanism") and the `copyCard` part of the 2026-07-23
     Phase 03 store-additions entry. Copy is now a skeleton-only new Booking with a primary
     Procedure. "References" is read as the billing reference, not the correlation ref (label it
     as a reading).
  3. **`Booking.source`** is required. HL7/FHIR creates stamp `hospitalDownload` as an interim
     until 33, and the addendum source follows the actor until 39.
  4. **Attachment ids** are store-allocated (`AT####`) through `addAttachment` and
     `removeAttachment`, superseding the 2026-07-27 component-side index fix. Audit entries carry
     metadata only.
- **Discovered for later:** the catalogue images and captions for US-02.4.3, US-03.2.3 and
  US-03.1.3 show retired UI and need a re-capture and caption edit by the catalogue owner.
