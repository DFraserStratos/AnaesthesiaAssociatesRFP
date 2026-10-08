# Phase 26 · Prepaid settings and anaesthetist profile

**Requirements covered:**
[FT-06.1](../../../../requirements-board/requirements/stories/FT-06.1.md) Prepaid procedure settings on the anaesthetist profile (Confirmed; Missing; changed at `60e2d1e`: procedures or whole RVG groups, no flag on the Contract) ·
[US-06.1.1](../../../../requirements-board/requirements/stories/US-06.1.1.md) Tick procedures or groups (Confirmed; Missing; retitled at `60e2d1e`: procedures one by one or a whole RVG group, no longer RVG codes and AA tag groups) ·
[US-06.1.2](../../../../requirements-board/requirements/stories/US-06.1.2.md) Admin can maintain on behalf (**Confirmed** at `60e2d1e`, was Proposed; Missing: the prepaid amounts sit on the anaesthetist's own first-party Contract, which the office keeps, OQ-91) ·
[US-12.1.1](../../../../requirements-board/requirements/stories/US-12.1.1.md) Dollar value per unit (Proposed; Partial; the anaesthetist-facing half, the lock half is Phase 25's) ·
[US-12.1.3](../../../../requirements-board/requirements/stories/US-12.1.3.md) Prepaid procedures (Confirmed; Missing; changed at `60e2d1e`: the stored list of procedures and RVG groups, each prepaid amount from the anaesthetist's own fixed-price Contract, kept by the office and never edited by the anaesthetist; the derivation is Phase 27's) ·
[US-12.1.4](../../../../requirements-board/requirements/stories/US-12.1.4.md) Anaesthetist identity, contact and bank details (Verify; Partial; one **HPI CPN**, OQ-52; bank details in the system, OQ-14) ·
[DM-19](../analysis/domain-model-delta.md#dm-19) prepaid settings on the anaesthetist profile (procedures or whole RVG groups).
**Left this phase (2026-10-08):** DM-33 (the anaesthetist profile) is merged into
[DM-32](../analysis/domain-model-delta.md#dm-32), which Phase 17 carries; this phase builds DM-32's
anaesthetist half that 17 hands on (bank details, GST number on the profile, prepaid settings,
admin-editable; the start date is Phase 28's) and records it against DM-32 in the PROGRESS entry.
No RV finding is closed here. RV-09 (prepayment as a patient category and a completion gate) is
Phase 27's; Phase 20 already removed the payment category.
Context only, closed elsewhere:
[FT-12.1](../../../../requirements-board/requirements/stories/FT-12.1.md) Profile settings (grouping) ·
[US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md) GST period (this phase lets the anaesthetist set it; the aligned GST schedule is Phase 38's) ·
[US-08.4.5](../../../../requirements-board/requirements/stories/US-08.4.5.md) Anaesthetist as supplier, AA as agent (Phase 22 added `gstNumber` and prints it; this phase lets the anaesthetist see and edit it) ·
[US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) Anaesthetist's own fixed-price Contracts (Phase 19a seeds Dr Souter's and the office keeps it; this phase shows its prices read-only on her profile and links the office to it) ·
[US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md) Set the prepaid amount and [US-03.1.8](../../../../requirements-board/requirements/stories/US-03.1.8.md) See the prepaid amount on the Booking (Phase 27) ·
[US-06.2.1](../../../../requirements-board/requirements/stories/US-06.2.1.md) Detect prepayment requirement (Phase 27; a Procedure or its RVG group in the set, and a person paying, OQ-73) ·
[US-05.1.3](../../../../requirements-board/requirements/stories/US-05.1.3.md) Body sections and AA groups (Phase 19; Verify; its "mark a whole RVG group as prepaid" line is built here) ·
[US-01.1.3](../../../../requirements-board/requirements/stories/US-01.1.3.md) New anaesthetist gets a populated canvas (the start date on the same record, Phase 28) ·
[DM-32](../analysis/domain-model-delta.md#dm-32) the fuller anaesthetist profile (Phase 17; see above).
**Decisions and questions.** Built as answered, with no provisional label:
[OQ-14](../../../../requirements-board/requirements/questions/OQ-14.md) (bank details in the system, on the profile),
[OQ-25](../../../../requirements-board/requirements/questions/OQ-25.md) (prepaid is a choice on the anaesthetist profile; a pre-payable flag on the Contract is not adopted, FT-06.1),
[OQ-52](../../../../requirements-board/requirements/questions/OQ-52.md) (one identifier, the HPI CPN),
[OQ-73](../../../../requirements-board/requirements/questions/OQ-73.md) (answered: any person paying for the patient, never an organisation; it shapes only this phase's seed coherence test),
[OQ-91](../../../../requirements-board/requirements/questions/OQ-91.md) (**D42**, answered 2026-10-08: the office creates and keeps every first-party Contract from the price list the anaesthetist supplies; anaesthetists never create or edit Contracts in the app) and
[OQ-48](../../../../requirements-board/requirements/questions/OQ-48.md) (**D45**: the procedure date decides the price in force; the profile shows the version in force today).
Still open, not this phase's to build: [OQ-92](../../../../requirements-board/requirements/questions/OQ-92.md)
(**D27**, a prepaid procedure with no price on the anaesthetist's own Contract: Phase 27 warns the
office and holds the invoice). This phase only shows the fact, "No price yet", beside such a
procedure; it raises no warning and labels nothing provisional.
**Depends on:** Phase 19a (Dr Souter's first-party holder and Contract, and the one place to read an
anaesthetist's own price: `ownPriceListFor` and `ownFixedPriceFor`) and Phase 20 (the payment
category removed everywhere; the office-set Booking `prepaymentRequired` flag with
`setBookingPrepayment`, read by `bookingRequiresPrepayment`, is the interim). Both bring Phase 19
(RVG groups and procedures, `RvgGroup`, `ProcedureType`, `procedureTypesInGroup`, `searchPicker`,
`procedureTabSections`, `rvgTabSections`) and Phase 18 (contract holders, dated Contract versions).
By the sequencing rules it runs after Phase 25 (the pricing snapshot copies the unit value this
profile edits), so 17 (`normaliseHpiCpn`, `isPlausibleHpiCpn`, the "HPI CPN" label, the duplicate
refusal, the Admin anaesthetist record page and the office-only privacy boundary), 21 (the payer on
the Booking and who is billed), 22 (`Anaesthetist.gstNumber`, `isValidGstNumber`,
`formatGstNumber` and the invoice supplier snapshot) and 24 (the anaesthetist's own price change on
a first-party Contract, with a reason) have landed too. It runs **immediately before Phase 27**,
which derives prepayment from the set stored here and takes the amount from the same first-party
Contract.
**Estimated:** 1 long session, at the top of the one-session budget (14 work items across three
apps). If it runs long, stop after work item 8 (model, pure helpers, store, seed and tests green) and
do the screens (items 9 to 14) in a second session.

## Goal

Give each anaesthetist a profile they own, show them their prepaid procedures with the price each
will be prepaid at, and give the office the same record to maintain on their behalf.

- **Mobile More tab and web app gain a Profile.** It shows and edits the anaesthetist's own dollar
  value per RVG unit, GST period, GST number (the one Phase 22 prints on invoices issued in their
  name) and contact details. It shows identity (registration number and the **HPI CPN**, their one
  Health Provider Index identifier, OQ-52) and the bank account read-only.
- **Prepaid procedures tick list** (US-06.1.1, US-12.1.3, FT-06.1, DM-19). The anaesthetist ticks
  **procedures** one by one, or a **whole RVG group** at a time (a published group or one of AA's
  own, US-05.1.3), on the two tabs the procedure picker uses (Procedures; RVG codes), under
  body-section headings, with one search. A procedure covered by a ticked group shows as covered
  "via" that group's code. The set is stored on the Anaesthetist record. Phase 19 dropped the old AA
  tag groups (Cosmetic, Plastics, Dental), so a group is one RVG group and each procedure sits in
  exactly one.
- **The prepaid price beside each procedure, read-only** (US-12.1.3, US-06.1.2, OQ-91 answered,
  D42). Each ticked procedure, and each procedure in a ticked group, shows the fixed price on the
  anaesthetist's own first-party Contract (19a's `ownFixedPriceFor`, the version in force today), or
  "No price yet" where the Contract has no line for it (OQ-92's case, which Phase 27 warns about). A
  read-only "Your price list" view lists every line of that Contract. The anaesthetist never edits a
  price here: the caption says the office keeps the price list from the prices they send. The
  prices are settings on the profile, not a fee on a Booking (the 2026-09-28 ruling on the
  anaesthetist's Booking is untouched here; 27 shows the prepaid amount on the Booking, US-03.1.8).
- **Bank account held in the system** (OQ-14), display-only in the demo. The office enters and edits
  it; the anaesthetist sees it masked. The payables run shows each payout's destination account and
  snapshots it on the disbursement record. No payment is held or routed by it.
- **Admin edits on the anaesthetist's behalf** (US-06.1.2, US-12.1.4). Phase 17's Admin anaesthetist
  record page (`/admin/masters/anaesthetists/:anaesthetistId`) gains the bank, HPI CPN (now editable,
  format-checked), profile and prepaid sections, and a link to the anaesthetist's own price list in
  the Contracts editor (18 and 19a), where the office keeps it. Every office edit is audited as the
  office acting for that anaesthetist.
- **One unit value.** The profile edits the same `Anaesthetist.unitValue` that fees read and that
  Phase 25's snapshot copies at AUTHORISED. A change re-prices only Procedures not yet authorised.
- **Privacy.** Anaesthetists never see their priority tier or pairing preferences (Phase 17's
  boundary): the profile reads `masters` only, never the office-only slice, and its "last changed"
  line never reads a tier or pairing audit entry.

**Pricing model in one place.** This phase adds no pricing structure. It reads an anaesthetist's
own prices only through 19a's `ownPriceListFor` and `ownFixedPriceFor` in
`aa-prototype/src/domain/billing/`, and group membership only through 19's
`procedureTypesInGroup`, so a v5 of the draft design stays a contained edit there. No screen reads
Contract lines, holders or versions directly. The prepaid-set helpers (item 2) sit in
`src/domain/billing/` beside them, because Phase 27's derivation calls them. References, read never
edited: the plain-language guide [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md)
regions `prepaid-already-agreed` (own set, person pays, full fee), `contracts-two-kinds` and
`what-the-anaesthetist-can-change` (true as written); the draft technical design v4
[AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) regions `prepayment` (the trigger and
the amount; of its amount options the catalogue settled on the fixed price on the anaesthetist's own
first-party Contract, US-06.2.2, so build no other), `contract-holder-fields` (the first-party
holder) and `contract-versions` (the profile shows the version in force today; a Booking takes the
version in force on its procedure date, OQ-48); its ERD
[AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) regions `contract-holder` and
`contract-line`.

Nothing is derived from the prepaid set in this phase. Phase 27 reads it. No S1 to S5 figure moves.
The record's start date (US-01.1.3) is Phase 28's and is not added here.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `60e2d1e` (rename-aware;
   never a plain `git diff` of the catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-06.1,US-06.1.1,US-06.1.2,FT-12.1,US-12.1.1,US-12.1.2,US-12.1.3,US-12.1.4,US-08.4.5,US-04.2.14,US-06.2.1,US-06.2.2,US-03.1.8,US-05.1.3,US-01.1.3,OQ-14,OQ-25,OQ-48,OQ-52,OQ-73,OQ-91,OQ-92
   ```

   At plan time (2026-10-08, `3d3a18c..60e2d1e`) these moved: FT-06.1 and US-06.1.1 (procedures or
   whole RVG groups, the trigger on the profile, no flag on the Contract); US-06.1.2 (Confirmed; the
   prepaid amounts on the anaesthetist's first-party Contract, kept by the office, OQ-91); US-12.1.3
   (the amount from the anaesthetist's own fixed-price Contract, which they never edit in the app);
   OQ-91 answered; OQ-73 answered; OQ-92 new and open; US-04.2.14, US-06.2.2 and US-03.1.8 new or
   rewritten (Phases 19a and 27); and the domain model. The plan already reflects all of this; diff
   only for anything after `60e2d1e`. To see why an item says what it says, run
   `npm --prefix requirements-board run source -- --item <ID> --text` and read only the cited
   passages (needs Node 22.18 or newer on PATH).
2. If an item changed after `60e2d1e`, re-read it whole and adjust the work items. If one is now
   Retired or Future, drop its work and say so in the PROGRESS entry.
3. Confirm the Verify and Proposed readings:

| Item | Build (the reading as at `60e2d1e`) | If it has changed |
|---|---|---|
| **US-12.1.4** (Verify): bank details in the system, on the profile; one HPI CPN | Office-held bank account (name and number) on the Anaesthetist, display-only; masked read-only on the anaesthetist's profile; payables run shows and snapshots the destination. `hpiId` labelled "HPI CPN", office-edited, format-checked | If the AC moves bank details to Xero only: add no bank field. Show "Bank account held in Xero" on both profiles and skip work item 7. If the anaesthetist may edit it: move `bankAccount` into the self-editable set. If OQ-52 is reopened: build the default of one field and log it |
| **US-12.1.1** (Proposed): "each anaesthetist sets their own" unit value | The anaesthetist edits it on the profile; the office can too | If it becomes office-set only: the profile shows it read-only with "Set by the AA office" |
| **US-12.1.2** (Proposed, closed in 38) | The anaesthetist sets the GST period on the profile | If it becomes office-only: read-only on the profile |
| **US-08.4.5** (Phase 22's): the anaesthetist's GST number on invoices issued in their name | The anaesthetist edits their own `gstNumber` on the profile with 22's validator; issued invoices keep 22's supplier snapshot | If the GST number becomes office-held: read-only on the profile with "Held by the AA office" |
| **US-05.1.3** (Verify, Phase 19's): AA's own groups beside the published ones | Ticking a group ticks whatever 19 built as an RVG group, published or AA's own | If AA's tag groups (Cosmetic, Dental, Plastics) come back as tags across groups: tick them too, expanded through 19's helper; never a second membership model here |
| **D42 / OQ-91** (answered 2026-10-08) | Prices read-only on the profile; no anaesthetist write path to any Contract | Not expected. If anaesthetists may edit their own price list later, that is new work, not this phase's |

4. Read what the earlier phases actually built (their PROGRESS entries). In particular:
   - Phase 19: the exact names of `RvgGroup`, `RvgGroupId`, `ProcedureType`, `ProcedureTypeId`,
     `masters.rvgGroups`, `masters.procedureTypes`, `masters.bodySections`, `procedureTypesInGroup`,
     `generalProcedureOf`, `searchPicker`, `procedureTabSections` and `rvgTabSections`, how a group
     or procedure is retired (no delete), and the group 19 put Rhinoplasty and Face-lift in. The
     two-tab picker components on mobile, web and Admin, which this phase's tick list mirrors.
   - Phase 19a: `ownPriceListFor(anaesthetistId, ..., dateISO)` and `ownFixedPriceFor(anaesthetistId,
     procedureTypeId, ...)`, their inputs, and Dr Souter's seeded price list (Rhinoplasty $1,200 and
     two or three cosmetic procedures, for example Face-lift). The Contracts editor route and how to
     open a Contract or filter the catalogue by holder (18).
   - Phase 17: `normaliseHpiCpn` and `isPlausibleHpiCpn` (`src/domain/surgeons.ts`), the `hpiId`
     audit label "HPI CPN", the duplicate refusal ("That HPI CPN is already held by ...") that checks
     surgeons and anaesthetists, the Admin anaesthetist record page
     (`apps/admin/screens/AnaesthetistRecord.tsx`, its header, tier card and pairings sections), the
     `officePrivate` slice and `src/apps/officePrivacy.test.ts` (its allowlist, and
     `OFFICE_PRIVATE_AUDIT_ACTIONS`). Reuse all of it; add no second HPI CPN validator and no second
     record page.
   - Phase 20: the Booking's `prepaymentRequired` interim flag and `prepaymentDetail`,
     `setBookingPrepayment`, and that `bookingRequiresPrepayment` reads the flag. This phase leaves
     them alone. Which seeded Bookings carry the flag (Riley's and Nair's at plan time).
   - Phase 21: the payer on the Booking and the one who-is-billed selector, with its payer and person
     checks (planned as `billablePartyForProcedure`, `isPayerBilled` and `isPersonParty`; use the
     names 21 shipped). The seed coherence test in item 8 uses `isPayerBilled` and `isPersonParty`,
     the same pair Phase 27 derives with (D23), never a second helper.
   - Phase 22: `Anaesthetist.gstNumber` (required), `isValidGstNumber` and `formatGstNumber` in
     `src/domain/billing/invoicePresentation.ts`, the `editAnaesthetist` refusal "Enter a GST number of
     8 or 9 digits.", the Admin GST number column and field, and the invoice supplier snapshot (an
     edit after issue must not change an issued invoice).
   - Phase 24: the anaesthetist's price change, with a reason, on a first-party Contract's Procedure.
     That is a per-Booking change, not a price-list edit; the profile does not offer it.
   - Phase 25: that the pricing snapshot copies the unit value at authorise and that the engine and
     Review read it. **If 25 has not landed**, do not claim the lock in copy: the profile note reads
     "A new rate applies to Bookings not yet invoiced", and the lock regression test in item 8 is
     added as `it.todo` with a handoff note for 25.
   - Phase 14 (built): the PWA demo-actions chip is `src/pwa/PwaDemoActions.tsx`, mounted in
     `src/pwa/MobileViewport.tsx`, not on the More tab. Confirm no trigger is registered for the More
     route and that the new More cards do not collide with the chip or with `PwaDemoPanel` (the
     `moreExtra` slot).
5. Record the current `PERSIST_VERSION` (16 at plan time, after Phases 14, 15 and 15a session 1;
   Phases 15a session 2 to 25 will have bumped it).

## Reference

**Design (convention 17).** No mockup has a More, profile or settings screen. Extend the design's own
patterns:

- Mobile: `docs/design/Mobile App.dc.html` for the card surfaces, row anatomy (label left, mono value
  right, chevron), the bottom-sheet treatment and the sticky teal primary action; the existing
  `MoreScreen` persona card. Everything edits in bottom sheets (the `useSurface()` Overlay in the mobile
  `SurfaceProvider`), never a desktop form. The tick list is a tall bottom sheet with the picker's two
  tabs, a search field and a sticky Save, built from the same row anatomy as Phase 19's mobile picker.
- Web: `docs/design/Web Dashboard.dc.html` for the top nav, panel anatomy (`apps/web/components/Panel.tsx`)
  and the desktop grid. The persona name and avatar in `WebNav` become the way into the profile; the
  four nav tabs stay as the design has them (Decisions log 2026-07-21, navigation structures).
- Admin: Phase 17's anaesthetist record page, the Master data table and `EditAnaesthetistSheet` (the
  `Admin Review.dc.html` table anatomy: mono data cells, neutral pills, row actions).
- Tokens from `docs/design/Design Language.dc.html`. Teal is the only action colour. Crimson stays on
  the avatar and nav underline only. "via H3", "No price yet", "Retired" and "Not on file" markers are
  neutral or warning-tone pills, never crimson. Money, prices, account numbers, GST numbers, RVG
  codes and the HPI CPN are Spline Sans Mono, tabular-nums.

**Catalogue.** The files linked above; `domain-model.md` (the anaesthetist profile and prepaid
settings, the first-party Contract, the HPI CPN glossary row, and section 3's prepayment rule: the
amount is the fixed price on the anaesthetist's own Contract, Phase 27). AR-28, AR-29 and AR-30 at the
regions named in the Goal. Evidence for OQ-91: the typed decision of 2026-10-08 (read it through
`npm --prefix requirements-board run source -- --item OQ-91 --text`); for OQ-52:
`requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md` #26 and #63.

**Analysis.** `../GAP-ANALYSIS.md`: everything before "## By epic", then the "EP-06 · Prepayment" rows for
FT-06.1, US-06.1.1 and US-06.1.2 and the "EP-12 · Anaesthetist profile and reporting" rows for
US-12.1.1 to US-12.1.4. `../epics/EP-06.md` and `../epics/EP-12.md` (same items).
`../analysis/domain-model-delta.md` (DM-19; DM-32 for the anaesthetist profile, into which DM-33 was
merged; DM-13 for groups and procedures; DM-09 for Contract lines; DM-22 for the GST number on the
invoice). `../analysis/reverse-check.md` RV-09 (context: why nothing is derived here).
`../analysis/prototype-map-apps-mobile-web.md` (More, Accounts GST tab, routes), `prototype-map-admin.md`
section 9 (Master data), `prototype-map-store-seed.md` (masters, seed cast),
`prototype-map-shell-demo-pwa.md` (the PWA `moreExtra` slot and `pwaPurity`).

**Code entry points (at plan time, prototype commit `b342a7d`; Phases 15a session 2 to 25 will have
moved lines and renamed things).**

- Types: `src/domain/types.ts` `Anaesthetist` (141 to 151; `hpiId` doc comment at 148 says "HPI
  practitioner identifier", reword to HPI CPN), `GstPeriod` (153), `AuditEntry` (655),
  `XeroAccPay` (790), `Disbursement` (819). Phase 22 added `gstNumber`; Phase 19 added `RvgGroup`
  and `ProcedureType`.
- Store: `src/store/mastersActions.ts` `AnaesthetistPatch` (171), `editAnaesthetist` (185, office-only
  today; its doc comment says a unit-value change re-prices every fee, which 25 made untrue for
  authorised Lists), `NewAnaesthetistFields` (222) and `addAnaesthetist` (241). `src/store/mutate.ts`
  (`Actor`, `MutationMeta`, the entry builder copying `before` and `after` at 187 to 188).
  `src/store/payablesActions.ts` (`payablesDue` 35, `disbursePayables` 55, `caseByAccPay` 83,
  `runPayables` 146, `disbursePayable` 160). `src/store/selectors.ts` (add the profile selectors
  here; `bookingRequiresPrepayment` 307 is left alone).
- Seed: `src/domain/seed/cast.ts` (`ANAE`, `ANAESTHETISTS` 44 to 58, `hpiId` values `10SOUM` to
  `23STRO`); `src/domain/seed/index.ts` (`SeedMasters`); `src/domain/seed/bookings.ts` (Riley's
  Booking on Souter Fri 24 AM, about 828, and Nair's on Souter Fri 24 PM, about 896: the septoplasty
  and the cosmetic rhinoplasty; Phases 19 to 21 re-point them onto procedures, Contracts and the
  payer on the Booking); 19a's first-party Contract seed; `src/domain/seed/seed.test.ts`.
  `src/store/appStore.ts` `PERSIST_VERSION` (136).
- Mobile: `src/apps/mobile/screens/MoreScreen.tsx`, `src/apps/mobile/routes.tsx` `MobileMoreRoute`
  (176), `src/apps/mobile/outlet.ts` (actor, anaesthetistId, `moreExtra`), `src/pwa/PwaDemoPanel.tsx`
  (the PWA's `moreExtra`).
- Web: `src/router.tsx` (web routes), `src/apps/web/routes.tsx`, `src/apps/web/WebApp.tsx`,
  `src/apps/web/components/WebNav.tsx` (`WebTab`, the persona block around 62),
  `src/apps/web/screens/AccountsScreen.tsx` (GST tab: local `periodLabel` 285, Segmented 292, default
  captured once at mount).
- Admin: 17's `src/apps/admin/screens/AnaesthetistRecord.tsx`; `src/apps/admin/screens/MasterData.tsx`
  `AnaesthetistsView` (171, raw `gstPeriod` enum in the table), `src/apps/admin/flows/EditAnaesthetistSheet.tsx`
  (61: "HPI" read-only), `AddAnaesthetistFlow.tsx` (72: "HPI id (optional)", unless 17 relabelled it),
  `fieldChrome.ts` (`GST_OPTIONS` 25), `src/apps/admin/RolesInfo.tsx` (24 and 28: role copy),
  `src/apps/admin/screens/BillingMonitorScreen.tsx` (`payablesDue` 49, Payables run card from 121),
  `src/apps/admin/screens/AuditViewer.tsx`; 18 and 19a's Contracts screens (the link target).
- Demo: `src/apps/demo/DemoXero.tsx` (ACCPAY pane: the Disbursed column and `disbursePayable`, about
  160 to 250).
- Audit copy: `src/shared/audit/actionLabels.ts` (`anaesthetist.*` at 70), `fieldLabels.ts` (`hpiId`
  at 125 is "HPI CPN" after Phase 17, `gstNumber` "GST number" after Phase 22), `auditNarrative.ts`.
- Shared UI: `src/shared/surface/` (BottomSheet, Dialog, `useSurface`), `src/shared/ui/` (Button, Field,
  SlidingSegmentedControl), `src/shared/format.ts` (`nameWithoutTitle`, `drSurname`, `formatCurrency`),
  `DemoBadge`; Phase 19's shared two-tab picker pieces.
- Tests to extend (under `aa-prototype/src/`): `store/mastersActions.test.ts`, `store/payablesActions.test.ts`,
  `store/mutate.test.ts`, `domain/seed/seed.test.ts`, `store/persistMigrate.test.ts`,
  `shared/audit/auditNarrative.test.ts`, `apps/web/screens/AccountsScreen.test.tsx`,
  `src/pwa/pwaPurity.test.ts` and 17's `src/apps/officePrivacy.test.ts` (both must stay green).
  Playwright (under `aa-prototype/visual/`, not `src/`): `web-phase05.spec.ts`, `admin-phase07.spec.ts`,
  `mobile-phase03.spec.ts`, `routing.spec.ts`, `pwa-device.spec.ts`, and 17's record-page spec.

## Work items

Model, pure helpers, store and seed first, then screens.

1. **Model** (`src/domain/types.ts`; DM-19, DM-32's anaesthetist half).
   - `Anaesthetist` gains `bankAccount?: BankAccount` and `prepaidSettings: PrepaidSettings` (required,
     empty by default).
   - `BankAccount { accountName: string; accountNumber: string }`. `accountNumber` is stored normalised
     as `BB-bbbb-AAAAAAA-SS(S)`.
   - `PrepaidSettings { procedureTypeIds: ProcedureTypeId[]; rvgGroupIds: RvgGroupId[] }`, on 19's
     ids (surrogate keys, never printed codes: the guide prints two T2s and two P6s). Comment it:
     "The anaesthetist's own prepaid set: procedures, or whole RVG groups (US-06.1.1). Phase 27 derives
     a Booking's prepayment requirement from it (US-06.2.1); the amount is the fixed price on their own
     first-party Contract (US-06.2.2), never stored here."
   - No price, amount or Contract reference on the profile: the price lives only on 19a's first-party
     Contract line, and no pre-payable flag goes on the Contract (OQ-25, FT-06.1).
   - `AuditEntry` gains `onBehalfOf?: AnaesthetistId`. `MutationMeta` gains the same optional field, and
     the entry builder in `mutate.ts` (beside the `before` and `after` copy) copies it onto the entry
     when set (US-06.1.2: "on their behalf" is visible in the audit, not inferred). Test in
     `mutate.test.ts`.
   - `Disbursement` gains `destination?: { accountName: string; accountMasked: string } | null`, a
     snapshot taken at run time (`null` when no bank account was on file) so a later bank edit never
     rewrites a past payout.
   - `hpiId` keeps its name (Phase 17 uses the same key for surgeons); reword its doc comment to "HPI
     CPN (Common Person Number): the practitioner's one Health Provider Index identifier (OQ-52)" if 17
     did not. `gstNumber` is Phase 22's; add nothing for it. Add no start date (Phase 28) and no tier
     (Phase 17 keeps it in the office-only slice).

2. **Pure helpers, with Vitest tests.**
   - `src/domain/bankAccount.ts` (US-12.1.4): `normaliseNzBankAccount(input)` accepts digits with or
     without dashes or spaces and returns the dashed form or `null` (2-digit bank, 4-digit branch,
     7-digit account, 2 or 3-digit suffix). `maskBankAccount(n)` returns `BB-bbbb-•••••AA-SS`. No bank
     modulus check (named as a demo simplification in the code comment). Tests: valid and invalid
     shapes, 2 and 3-digit suffixes, masking.
   - `src/domain/billing/prepaidSet.ts` (US-06.1.1, US-12.1.3), built on 19's `procedureTypesInGroup`:
     - `normalisePrepaidSettings(s)`: dedupes and sorts ids into one canonical order, so saving the
       same ticks twice is a no-op and audit diffs are stable. Explicit procedures are kept even when
       a ticked group also covers them, so unticking the group never silently drops a choice.
     - `validatePrepaidSettings(s, masters, before?)`: unknown procedures and unknown groups as a list
       of refusal reasons; a **newly** ticked retired procedure or group is refused (one already in
       `before` may stay, so a retire in 19's master never makes a profile unsaveable).
     - `expandPrepaidProcedures(s, masters): Set<ProcedureTypeId>`: the union of explicit procedures
       and every ticked group's procedures, retired ones included (an existing Procedure on a retired
       procedure is still detected). Membership is read at call time, so a 19 edit that moves a
       procedure between groups flows through. This is the set Phase 27's derivation calls; nothing
       calls it for a Booking in this phase.
     - `prepaidReasonFor(procedureTypeId, s, masters)`: `{ explicit: boolean; viaGroup: RvgGroupId | null } | null`
       (a procedure sits in exactly one group), used by the tick list ("via H3") and, later, by 27's
       banner ("Rhinoplasty is on Dr Souter's prepaid list").
     - `prepaidPriceRows(anaesthetistId, s, masters, contractData, dateISO)` (`contractData` is
       whatever 19a's helpers take, planned as `{ contracts, holders, lines }`): one row per covered
       procedure (explicit first, then by group), each `{ procedureTypeId, name, groupCode, reason,
       price: number | undefined }`, the price from 19a's `ownFixedPriceFor` for the version in force
       on `dateISO`; and `summarisePrepaidSettings(...)`: `{ procedureCount, groupCount,
       coveredCount, pricedCount, unpricedCount }` for the row summaries. Both read prices only
       through 19a's helper.
     - Tests: explicit and group ticks; group membership follows a procedure moved by 19's
       `editProcedureType`; explicit plus group overlap; untick group keeps an explicit procedure;
       unknown ids refused; a newly ticked retired id refused and an existing one kept; canonical
       ordering; empty set; prices from Souter's seeded Contract (Rhinoplasty $1,200), `undefined`
       for a procedure with no line, `undefined` for every procedure of an anaesthetist with no
       first-party Contract, and a Contract version not yet in force ignored.
   - `src/domain/anaesthetistProfile.ts`: the field policy as data.
     `SELF_EDITABLE_PROFILE_FIELDS = ['unitValue', 'gstPeriod', 'gstNumber', 'phone', 'email', 'prepaidSettings']`;
     `OFFICE_ONLY_PROFILE_FIELDS = ['bankAccount', 'hpiId', 'active']`. The registration number is the
     record's key and nobody edits it. Prices are not a profile field at all (OQ-91). Also move the GST
     period options and one `gstPeriodLabel()` here (Monthly, Two-monthly, Six-monthly), so mobile, web
     and admin cannot drift. `apps/admin/flows/fieldChrome.ts` re-exports or imports it. Test the
     policy lists are disjoint and cover every editable field.

3. **Store: profile edits** (`src/store/mastersActions.ts`; US-12.1.1, US-12.1.4, US-06.1.2).
   - Widen `editAnaesthetist(api, actor, registrationNumber, patch)`. `AnaesthetistPatch` gains
     `hpiId` and `bankAccount` (a `BankAccount` or `null` to clear); `gstNumber` is already there from
     Phase 22.
   - Guards, in order: `notFound`; any `role: 'system'` actor refused (integration feeds, the billing
     and payables runs and demo control all carry `role: 'system'`); an anaesthetist actor with no
     `anaesthetistId` refused; an anaesthetist actor may edit only their own record
     (`actor.anaesthetistId === registrationNumber`, else `notOwnProfile`) and only self-editable
     fields (else `officeOnlyField`, naming the field, for example "Bank details are held by the AA
     office.", "Your HPI CPN is held by the AA office."); the office may edit every field. Keep
     `invalidUnitValue`; round the unit value to cents; refuse an invalid bank number
     (`invalidBankAccount`) or an empty account name. The GST number keeps Phase 22's validation and
     refusal for both actors. The HPI CPN is stored through 17's `normaliseHpiCpn`, may be blank
     ("where available"), and a non-blank value must pass `isPlausibleHpiCpn` (`invalidHpiCpn`: "Enter
     an HPI CPN of two digits then four letters, for example 12ABCD.") and 17's duplicate check against
     surgeons and the other anaesthetists.
   - A patch that changes nothing is `ok` with no audit entry.
   - Audit stays `anaesthetist.update` with before and after of the changed fields only. When the office
     edits, set `onBehalfOf: registrationNumber`. Bank numbers are written to the audit **masked** in
     both before and after.
   - Rewrite the doc comment: a unit-value change re-prices only Procedures not yet authorised;
     authorised Lists price from Phase 25's snapshot.
   - **No price write path for the anaesthetist** (OQ-91, D42). Confirm that 18 and 19a's Contract,
     holder and line actions already refuse an anaesthetist actor on every Contract, their own
     first-party one included; add a test here that Dr Souter's actor cannot write her own Contract's
     lines.

4. **Store: prepaid settings** (`src/store/mastersActions.ts`, or a new `profileActions.ts` exported from
   `store/index.ts`; US-06.1.1, US-06.1.2, US-12.1.3).
   - `setPrepaidSettings(api, actor, registrationNumber, settings)`: the same actor rules as item 3
     (own record, or office on behalf). Validates with `validatePrepaidSettings` against the stored set
     (`unknownPrepaidProcedure`, `unknownPrepaidGroup`, `retiredPrepaidChoice`: "That procedure is
     retired. Pick a current one."), stores the normalised form, no-op when unchanged.
   - A procedure or group with no price on the anaesthetist's Contract is accepted (OQ-92's case is
     Phase 27's warning, not a refusal here).
   - Audited `anaesthetist.prepaid` with before and after `{ procedureTypeIds, rvgGroupIds }`;
     `onBehalfOf` when the office writes.
   - **Retiring is not guarded.** Phase 19 retires groups and procedures rather than deleting them, so
     a retire never breaks a prepaid set: the stored id stays, the tick list shows it with a "Retired"
     pill and lets it be unticked, and `expandPrepaidProcedures` still covers it. If 19 shipped a hard
     delete, refuse it while any prepaid set references the id (`inPrepaidSet`: "2 anaesthetists mark
     this as prepaid").

5. **Store: selectors** (`src/store/selectors.ts`).
   - `profileFor(state, registrationNumber)`: the view model both profiles read (unit value, GST label,
     contact, identity, masked bank or `null`, prepaid summary and price rows for `DEMO_TODAY` from the
     demo clock, and whether a first-party price list exists). It builds a new object, so screens
     select the raw record, masters and Contracts from the store and derive with `useMemo` (the
     `AccountsScreen` pattern), never pass `profileFor` straight to `useAppStore`, which would
     re-render forever.
   - `ownPriceListViewFor(state, registrationNumber, dateISO)`: the read-only price list (each line's
     procedure name, group code and fixed price, the Contract's name and AA code, and the date it is in
     force from), through 19a's `ownPriceListFor`; `null` when there is none.
   - The view model carries the GST number already formatted by 22's `formatGstNumber` and the HPI CPN
     as stored. It reads `masters` and the Contracts only, never the `officePrivate` slice.
   - `lastProfileChangeFor(state, registrationNumber)`: the newest `anaesthetist.update` or
     `anaesthetist.prepaid` audit entry, so the anaesthetist's profile can say "Last changed by Kirsty W.
     for you, 21 Jul" when the office acted on their behalf (US-06.1.2 visible from both sides). It
     reads only those two codes and never one in 17's `OFFICE_PRIVATE_AUDIT_ACTIONS` (the tier), and
     17's `officePrivacy.test.ts` must stay green with it in `store/selectors.ts`.

6. **Store: add anaesthetist.** `NewAnaesthetistFields` and `addAnaesthetist` accept an optional
   `bankAccount` (validated as above) and start with `prepaidSettings` empty. The optional `hpiId` gets
   the same HPI CPN normalise, format and duplicate checks as item 3 (unless 17 already added them).
   The `anaesthetist.create` audit `after` records the masked bank if given. A new anaesthetist has no
   first-party Contract; the office adds one in the Contracts editor when they send a price list.

7. **Payables run shows the destination** (`src/store/payablesActions.ts`; US-12.1.4 "used for the
   payables run"). Bank details are display-only in the demo: the run shows and records where each
   payout goes, and its amounts and behaviour do not change.
   - Resolve each ACCPAY's anaesthetist through the BillingCase already looked up in `disbursePayables`
     (`caseByAccPay`: case, then Booking, then List, then `anaesthetistId`).
   - `payablesDue` widens its input from `Pick<AppState, 'xero'>` to also take the billing cases,
     schedule and masters it needs to resolve the anaesthetist; update the `useMemo` call in
     `BillingMonitorScreen.tsx` and its dependencies. It gains `byAnaesthetist: { anaesthetistId, name,
     count, total, destinationMasked | null }[]`, sorted by surname, and `missingBank: number`
     (anaesthetists in the run with no bank account on file).
   - A payable whose anaesthetist has no bank account on file is still disbursed as today; its
     `destination` is `null` and the run card flags it (item 13). Every seeded anaesthetist has a bank
     account, so no seeded beat changes; the flag is reached only by an anaesthetist added without one.
   - Each `Disbursement` written stores `destination` (account name and masked number) at run time.
   - Tests (`payablesActions.test.ts`): destination snapshot written; a later `editAnaesthetist` bank
     change does not alter the stored snapshot; a no-bank anaesthetist's payable is disbursed with a
     `null` destination and counted in `missingBank`; `payablesDue` groups correctly; existing amounts
     and counts unchanged.

8. **Seed and tests** (one `PERSIST_VERSION` bump for the phase; nothing drawn from the seeded RNG).
   - `domain/seed/cast.ts`: every one of the 14 anaesthetists gets a `bankAccount`: account name from
     `nameWithoutTitle`, number built deterministically from the registration number on the non-issued
     bank code 99 (for example Souter `99-0101-0034821-00`), so it is plainly fictional. Every
     anaesthetist gets `prepaidSettings` (by procedure and group **system code** looked up through 19's
     masters, never a printed code):
     - **Souter:** Rhinoplasty ticked as a procedure (priced $1,200 on her seeded Contract), plus one
       whole RVG group that holds another of her priced procedures (for example the group 19 put
       "Face-lift" in, H3 in 19's plan), so her profile shows both kinds and the group's other procedures,
       its general procedure among them, read "No price yet". If no such group passes the coherence
       test below, tick a second procedure instead and pick a group none of her seeded Bookings uses.
     - **Two colleagues** with a set each, for the Admin table and the on-behalf beat (for example one
       with a whole group from the guide's Dental sub-heading, one with two procedures), with no
       first-party Contract, so their prepaid list reads "No price list yet". Everyone else empty.
   - `seed.test.ts`:
     - every `prepaidSettings` validates and is already normalised; every seeded id resolves and is
       not retired; every bank number normalises and is on bank 99; every seeded `hpiId` passes
       `isPlausibleHpiCpn` (17 tests uniqueness);
     - Souter's price rows: Rhinoplasty at $1,200 from her own Contract; at least one covered
       procedure with no price (so OQ-92's case is visible and Phase 27 has it to warn about);
     - **prepaid coherence (the guard for Phase 27):** for each anaesthetist, the seeded Bookings with
       a Procedure whose procedure is in `expandPrepaidProcedures` **and** which is billed to the payer
       on the Booking who is a person paying for the patient (21's `isPayerBilled` and
       `isPersonParty`, the rule Phase 27 derives with: the patient or a guardian, never an
       organisation; US-06.2.1, OQ-73 and D23 as answered) are exactly the
       Bookings Phase 20 seeded with the interim `prepaymentRequired` flag, and no others. That means
       Nair's Booking hits on the rhinoplasty and not on the septoplasty (the "checked across the
       whole Booking" case). If Riley's Procedure still has no procedure (it had none at plan time),
       it is listed as the known exception with a comment for 27, which sets it. A Booking that carries
       a prepaid procedure but bills a hospital or insurer is listed in a second, expected-not-flagged
       list, so 27 sees the person-only limit is already exercised. If any other seeded Booking hits,
       change the seeded set, never a Booking's procedure.
   - `mastersActions.test.ts` (or `profileActions.test.ts`): the permission matrix (own, colleague,
     office, integration) for every field in both policy lists, including `gstNumber` (self-editable)
     and `hpiId` (office only); validation, including an invalid and a duplicate HPI CPN and an invalid
     GST number; no-op writes; the audit shape including `onBehalfOf` and masked bank; the retired-id
     rules; Dr Souter's actor refused on her own Contract's lines (item 3); a GST number edit after a
     billing run leaves the issued invoice's supplier snapshot (22) and the pricing snapshot's payee
     (25) unchanged.
   - **Unit value and the lock** (US-12.1.1 technical note): an anaesthetist edits their unit value
     through `editAnaesthetist`; an AUTHORISED List's pricing snapshot, its Review figures and its
     invoice are unchanged, while an ACTIVE List's Booking re-prices. (`it.todo` if 25 has not landed.)
   - `persistMigrate.test.ts` and the `SEED_MARKERS` inspector entries follow the bump.

9. **Audit copy** (`src/shared/audit/`).
   - `actionLabels.ts`: `anaesthetist.prepaid` "Prepaid procedures updated".
   - `fieldLabels.ts`: `bankAccount` "Bank account", `prepaidSettings` / `procedureTypeIds` /
     `rvgGroupIds` "Prepaid procedures", "Prepaid procedures (one by one)", "Prepaid RVG groups".
     `phone` and `email` if missing. Leave `hpiId` ("HPI CPN", Phase 17) and `gstNumber` ("GST number",
     Phase 22) as they are.
   - `auditNarrative.ts`: renders procedures by name and groups by code and name (mono code), and
     appends "for Dr Melanie Souter" when `onBehalfOf` is set. `AuditViewer.tsx` shows the same "for"
     line in the actor column. Test in `auditNarrative.test.ts`.

10. **Shared profile components** (`src/shared/profile/`, exported through `src/shared/index.ts`; nothing
    imports from `apps/`, so `pwaPurity` holds; nothing reads the office-only slice, so 17's privacy
    test holds).
    - `PrepaidTickList`: a controlled editor over a draft `PrepaidSettings`, on the picker's two tabs
      and reusing 19's section helpers:
      - a summary line ("3 procedures prepaid · 1 group, 1 procedure · 2 without a price yet");
      - **Procedures** tab: body section, then subgroup, then procedure (19's `procedureTabSections`),
        each a checkbox row with the procedure name, its mono group code, and on the right the price
        from the anaesthetist's own Contract in mono (`$1,200.00`) or a neutral "No price yet" pill. A
        procedure covered by a ticked group shows ticked and disabled with a neutral "via H3" pill; an
        explicit one also in a ticked group shows ticked with "also via H3";
      - **RVG codes** tab: body section, then the guide's sub-heading, then group (19's
        `rvgTabSections`), each a checkbox row ticking the **whole group**, with code, name and
        "{n} procedures · {m} priced";
      - one search across both tabs (19's `searchPicker`), retired rows hidden unless ticked (then
        shown with a "Retired" pill and untickable only);
      - a one-line rule note: "Procedures on this list are paid for before the procedure, when the
        patient or someone for them pays." and a price note: "Prices come from your own price list,
        kept by the AA office. Send changes to the office." (office wording on the Admin variant:
        "Prices come from Dr Melanie Souter's own price list.").
      - Props: `variant: 'sheet' | 'panel'`, `value`, `onChange`, `masters`, `priceRows`. Explicit
        Save lives in the host, so each save is one audited write. No price is editable anywhere in
        it.
    - `OwnPriceList`: the read-only price list (procedure, group code, fixed price in mono), the
      Contract's name and "In force from 1 Jan 2026", the caption "Kept by the AA office from the
      prices you send.", and an empty state "No price list yet. Send your prices to the AA office."
    - `ProfileRow` (label, mono value, optional chevron or lock glyph) for the mobile list and the web
      read-only fields.
    - Component test: ticking a group marks its procedures "via"; unticking keeps an explicit
      procedure; search narrows across both tabs; prices and "No price yet" render from the rows; the
      emitted value is normalised; nothing in the component can change a price.

11. **Mobile profile** (`src/apps/mobile/screens/MoreScreen.tsx`, `routes.tsx`; FT-06.1, US-06.1.1,
    US-12.1.1, US-12.1.3, US-12.1.4). `MobileMoreRoute` passes `actor` and `anaesthetistId` from the
    outlet. Order on the screen: persona card, **Profile** card, **Prepaid procedures** card, the Demo
    prototype card, then `extra` (the PWA panel, unchanged).
    - Profile card rows: "Rate per unit" `$26.50` → `EditRateSheet` (bottom sheet: a mono dollar field
      with a decimal keypad, the note "A new rate applies to Bookings on Lists not yet authorised.
      Authorised Lists keep their locked rate.", sticky teal Save); "GST period" Monthly and "GST
      number" (mono, 22's format) → `EditGstSheet` (the GST period `SlidingSegmentedControl`, a mono GST
      number field with a numeric keypad, the caption "Printed on invoices issued in your name. Invoices
      already issued keep the number they were issued with.", sticky teal Save; a refusal renders
      verbatim); "Phone" and "Email" → `EditContactSheet`; "Registration" and "HPI CPN" (mono, captioned
      "Your unique identifier on the Health Provider Index.") read-only with a lock glyph; "Bank account"
      `99-0101-•••••21-00` with a lock glyph and the caption "Held by the AA office. Ask the office to
      change it." ("Not on file" if absent.)
    - Prepaid card: the summary, then the covered procedures as compact rows (name, "via H3" where it
      applies, price or "No price yet"; the first five with "and 4 more"), a "Change" row →
      `PrepaidProceduresSheet` (a tall bottom sheet hosting `PrepaidTickList variant="sheet"` with a
      sticky teal Save and a Cancel; Save calls `setPrepaidSettings`; a refusal renders verbatim), and a
      "Your price list" row → a read-only bottom sheet with `OwnPriceList`.
    - Under the prepaid card, the `lastProfileChangeFor` line when the last change was the office's.
    - The header eyebrow stays "Settings"; rename the component doc comment (deeper settings are no
      longer out of scope). `data-shot` hooks: `mobile-profile`, `mobile-prepaid`,
      `mobile-prepaid-sheet`, `mobile-price-list`.

12. **Web profile** (`src/apps/web/screens/ProfileScreen.tsx`, `routes.tsx`, `router.tsx`, `WebApp.tsx`,
    `components/WebNav.tsx`; same requirements).
    - Route `/web/profile` (`WebProfileRoute`). The persona name and avatar block in `WebNav` becomes a
      button to it, with the crimson underline when active; the four tabs are unchanged.
    - Layout, desktop grid (min width as the rest of the web app): left column panels **Billing** (unit
      value field with `$` prefix and "per RVG unit", the same rate note), **GST** (period Segmented, mono
      GST number field, the same caption as mobile), **Contact** (phone, email), **Identity**
      (registration, HPI CPN, read-only) and **Bank account** (masked, read-only, same caption). Each
      editable panel has its own teal "Save changes", enabled only when dirty.
      Right column: **Prepaid procedures** panel with `PrepaidTickList variant="panel"` and its Save,
      the "last changed by the office" line, and under it a **Your price list** panel (`OwnPriceList`,
      read-only).
    - `AccountsScreen` GST tab: the default period follows the profile. Keep the local override, but
      reset it when `masters.anaesthetists[id].gstPeriod` changes, and use the shared `gstPeriodLabel`
      (drop the local "Bi-monthly" map). The aligned-period window stays rolling (Phase 38). Extend
      `AccountsScreen.test.tsx`: editing the profile's GST period changes the tab's default.
    - `data-shot` hooks: `web-profile`, `web-prepaid-panel`, `web-price-list`.

13. **Admin on behalf** (`src/apps/admin/`; US-06.1.2, US-12.1.4).
    - `MasterData.tsx` `AnaesthetistsView`: columns Name, Reg, Unit $, GST period (label, not the enum),
      GST number (22's column, kept), HPI CPN, Bank (masked, or a warning-tone "Not on file" pill),
      Prepaid (summary such as "1 group · 1 procedure", or "None"), Phone, Email, Active, and the row
      action into 17's record page (keep 17's). If the table is too wide, drop Phone and Email first
      (they stay on the record page). Keep Unit $ the third column (a recipe highlights it). Header
      sub: "Profile settings are shared with each anaesthetist's own app. Office edits are recorded as
      made on their behalf."
    - **17's anaesthetist record page** (`AnaesthetistRecord.tsx`) gains, beside 17's tier and pairing
      sections (which stay office-only and unchanged): a **Profile** card (unit value, GST period, GST
      number, phone, email, HPI CPN, bank account masked, active) whose "Edit details" opens
      `EditAnaesthetistSheet`; a **Prepaid procedures** card with `PrepaidTickList variant="panel"`
      and its own Save (`setPrepaidSettings`); and an **Own price list** card: `OwnPriceList` in its
      office wording ("Kept by the office from the prices Dr Melanie Souter sends") with an "Open in
      Contracts" link to 19a's editor for that Contract, or, with none, "No price list yet" and a link
      to the Contracts catalogue filtered to first-party holders, where the office creates one through
      18 and 19a's flows (no new creation flow here). A line on the page reads "Changes are recorded as
      the office acting for Dr Melanie Souter."
    - `EditAnaesthetistSheet.tsx` (Details): unit value, GST period, GST number (22's field), phone,
      email, **HPI CPN** now editable with the item 3 format and duplicate checks shown inline, bank
      account name and number with inline validation, active; the read-only header line reads
      "Registration 34821 · HPI CPN 10SOUM". Save calls `editAnaesthetist`.
    - `AddAnaesthetistFlow.tsx`: optional bank account name and number; the HPI CPN field labelled
      "HPI CPN (optional)" with the same inline checks (17 may have relabelled it).
    - `BillingMonitorScreen.tsx` Payables run card: under the summary, a compact destinations list from
      `payablesDue.byAnaesthetist` ("Dr Souter · 2 payables · $1,234.00 to 99-0101-•••••21-00"), a
      warning-tone "No bank account on file" in place of the account for an anaesthetist without one,
      and a warning-tone summary line when `missingBank > 0`. The run itself is unchanged.
    - `DemoXero.tsx` ACCPAY pane: each disbursement shows "Paid to <name> · <masked>" from its snapshot
      ("Paid to <name> · no bank account on file" when `null`).
    - `RolesInfo.tsx`: anaesthetist edit copy adds "maintains their own profile: rate per unit, GST
      period, GST number, contact details and prepaid procedures; sees their own price list, which the
      office keeps"; office edit copy adds "maintains any anaesthetist's profile on their behalf,
      including bank details, the HPI CPN and their own price list".

14. **Playwright shots.** A new `visual/profile-phase26.spec.ts`: mobile More with the Profile and
    Prepaid cards, the prepaid sheet on both tabs (Rhinoplasty ticked with $1,200, a ticked group's
    procedures "via", one "No price yet"), the price list sheet, the web profile page, the Admin record
    page's prepaid and own price list cards, and the Payables run destinations. Update any existing
    shots the table columns, the record page or the More screen changed, and `routing.spec.ts` for
    `/web/profile`. Keep the PWA device spec green (the More screen gains cards above the PWA panel).

## Demo triggers

None. Everything here is shown through normal use: Dr Souter's seeded prepaid set and own price list
show on mobile, web and Admin; the anaesthetist edits their own profile on mobile or web; the office
edits it on the Admin record page and keeps the price list in the Contracts editor; the payables run
is an existing office button. Nothing is automatic, scheduled or external, so no registry entry is
added and the Control Panel is untouched. No warning rule is added either (OQ-92's warning is Phase
27's), so 15a's "Raise sample warnings" gains no sample here.

PWA: the profile, tick list and price list are part of the mobile More tab, so the installed PWA has
them natively. No mobile beat waits on the office (the anaesthetist changes their own set; a price
change is an email to the office outside the app), so no PWA office stand-in is needed. The
office-on-behalf edit is an Admin act shown in the framed build; its effect ("Last changed by Kirsty W.
for you") is visible on the handset only in the framed build, which is expected. Phase 27 registers
the prepayment triggers.

## Out of scope

- Deriving a Booking's prepayment requirement from the set, the prepaid amount on the Booking
  (US-03.1.8), the prepayment invoice generated at setup, part-paid tracking, the escalating warning
  and OQ-92's "no price" warning (Phase 27, D5, D6, D27). Phase 20's office-set Booking
  `prepaymentRequired` flag stays the interim, untouched. There is no estimate and no deposit anywhere.
- Any anaesthetist write path to a Contract, their own price list included (OQ-91, D42); the
  anaesthetist's price change with a reason on a Booking (Phase 24); a pre-payable flag on the
  Contract (OQ-25, not adopted). Editing Contract lines (19a's editor).
- Snapshotting the unit value at AUTHORISED (Phase 25 built it; this phase only proves the profile edit
  respects it).
- The aligned GST period window, current and previous period navigation, and the GST activity summary
  (Phase 38, US-12.1.2 and US-12.2.2).
- Payout detection from Xero and the ledger (Phases 36 and 37); an anaesthetist-facing payout history;
  holding or routing a payout by its bank account (bank details are display-only); the weekly payment
  cycle and the remittance advice (39a).
- The anaesthetist's start date and Slot generation from it (Phase 28, US-01.1.3). The priority tier
  and pairing preferences (Phase 17; office only, never on the anaesthetist's profile).
- HPI CPN register lookup or check-character validation (the catalogue asks for neither, and Phase
  40a builds neither; 40a only moves every HPI CPN display onto one label and formatter); the
  surgeon's HPI CPN (Phase 17).
- Changing how invoices print the GST number (Phase 22).
- Editing RVG groups, procedures or membership (Phase 19's Admin tabs; loads in Phase 42).
- A bank modulus check, bank verification, or letting the anaesthetist edit bank details.
- Login (43a), multiple personas, notifications to the anaesthetist when the office edits their
  profile or price list.
- A responsive web layout.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Mobile More: the Profile card shows $26.50, Monthly, Dr Souter's GST number (22's seed, mono),
      phone, email, registration 34821, HPI CPN 10SOUM and a masked bank number with the office caption.
      No "HPI id" or "HPI number" anywhere on any app. No en or em dash anywhere.
- [ ] Change the rate to 27.00 in the bottom sheet and save: the row updates; the audit viewer shows
      `anaesthetist.update` by Dr Souter (anaesthetist), unit value 26.50 to 27.00. A Booking on an
      ACTIVE List re-prices (office view); an AUTHORISED List's figures and invoice do not. Set it back.
- [ ] A zero or text rate is refused with the sentence in the sheet.
- [ ] GST sheet: a 7-digit GST number is refused with 22's sentence; a valid new one saves and the row
      shows it formatted. An invoice already issued to Dr Souter still shows the old number; set it
      back.
- [ ] Prepaid card: Rhinoplasty shows $1,200.00 from her own price list; the seeded group's procedures
      show "via" its code, Face-lift (or the seeded priced one) with its price and at least one "No
      price yet". "Your price list" opens a read-only sheet with every line and "Kept by the AA office";
      nothing in it is editable.
- [ ] Prepaid sheet, Procedures tab: tick a procedure outside her set (search it by name), save: the
      summary updates, it shows "No price yet", and one `anaesthetist.prepaid` entry is written. RVG
      codes tab: tick a whole group; its procedures show "via" on the Procedures tab. Untick the
      seeded group: its procedures clear but the explicit Rhinoplasty stays. Save twice with no change:
      no second audit entry. Set it back.
- [ ] As Dr Souter there is no way to change a price anywhere in mobile or web, and the store refuses
      an anaesthetist write to her own Contract (the test proves it; the UI offers none).
- [ ] Web: the persona block in the nav opens `/web/profile` with the underline. The panels match
      mobile's values; editing contact saves from its own panel; the Identity, bank and price list
      panels are read-only.
- [ ] Web profile GST period set to Two-monthly: Accounts → GST activity now defaults to Two-monthly.
- [ ] Admin → Master data → Anaesthetists: GST period shows labels; GST number, HPI CPN, Bank and
      Prepaid columns filled. Open Dr Souter's record page: the Profile, Prepaid procedures and Own
      price list cards sit beside 17's tier and pairings. Tick a further group in the Prepaid card and
      save. Back on the mobile profile, the set includes it and the line reads "Last changed by
      Kirsty W. for you". The audit entry shows "for Dr Melanie Souter" and role office. "Open in
      Contracts" lands on her price list in 19a's editor.
- [ ] A colleague with a seeded set and no price list: their record page and (as that persona, if the
      demo can switch) their profile read "No price list yet".
- [ ] Admin Edit details: change Dr Souter's bank number; an invalid number is refused inline; the audit
      shows masked before and after values only. Change her HPI CPN to `1ABCDE` (refused inline), then to
      another anaesthetist's or a surgeon's HPI CPN (refused as a duplicate), then to a fresh valid one
      (saved, audited "HPI CPN", shown on her mobile and web profile); set it back.
- [ ] Admin → Master data → RVG groups: retire the group Souter ticks: allowed; her tick list shows it
      with a "Retired" pill, still ticked, and it can be unticked but not newly ticked. Restore it.
- [ ] Add an anaesthetist without bank details and with HPI CPN `12abcd`: it is stored as `12ABCD`; the
      table shows "Not on file" for the bank.
- [ ] Billing monitor Payables run: the destinations list shows each anaesthetist and masked account;
      run it; the paid amounts are as before and the Xero simulator's ACCPAY pane shows "Paid to" on the
      disbursement. Edit that anaesthetist's bank afterwards: the past disbursement still shows the old
      masked number.
- [ ] Privacy: nothing on the mobile, web or PWA profile names a tier or a pairing preference; 17's
      `officePrivacy.test.ts` is green.
- [ ] S3 and S4 figures, and the S4 Beat 1 prepayment beat on Riley and Nair, behave exactly as before
      (the interim flag is untouched).
- [ ] PWA build (`npm run build:pwa`, then preview): More shows the Profile and Prepaid cards above the
      demo panel, the price list sheet opens, and the prepaid sheet saves.
- [ ] Teal is the only action colour; crimson only on the avatar and nav underline; "via", "No price
      yet", "Retired" and "Not on file" pills are neutral or warning tone; prices, GST number, HPI CPN,
      RVG codes and account numbers are mono.
- [ ] Catalogue screenshots: the recipes for `US-06.1.1`, `US-06.1.2`, `US-12.1.1`, `US-12.1.3` and
      `US-12.1.4` are created or updated as the Catalogue screenshots section says, every recipe this
      phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story
      without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is
      green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` green.

## Demo guide updates

No scripted figure changes. Patch these in the same session, and the matching sections of
`master-demo-guide.html`:

- `01-personas-and-responsibilities.md`: the anaesthetist's core actions gain "Maintain her own profile:
  rate per unit, GST period, GST number, contact details and prepaid procedures (one by one or whole RVG
  groups); see her own price list, which the office keeps from the prices she sends". Her permissions:
  "May edit her own profile settings; may not edit bank details, her HPI CPN, any Contract (her own
  price list included) or other master data". The office gains "Maintains any anaesthetist's profile
  on their behalf, including bank details, the HPI CPN and their own price list". Use "HPI CPN"
  wherever the guide says "HPI id" or "HPI number" for an anaesthetist.
- `02-workflows-and-handoffs.md`: a short "Profile and prepaid procedures" case (where the set lives,
  procedures or whole RVG groups, that each price comes from the anaesthetist's own price list kept by
  the office, who can edit what, that the office's edits are audited on the anaesthetist's behalf, the
  GST number printed on her invoices, bank details shown on the payables run). Leave the Pre-payment
  case as Phases 15a and 20 left it; 27 rewrites it.
- `03-demo-script.md`: an optional "Worth pointing at" before S4 Beat 1: "More → Prepaid procedures:
  Dr Souter has marked Rhinoplasty as prepaid, at $1,200 from her own price list, which the office
  keeps." Do not change the beat itself until 27 (it still narrates Phase 20's interim flag; any
  estimate or deposit wording in it is 27's to remove). If Phase 25 scripted an "edit the unit value
  after authorise" beat in S5 via Master data, add the alternative path through the anaesthetist's own
  profile.
- `04-presenter-cheat-sheet.md` Permission matrix: the "Edit master data" row stays No for the
  anaesthetist; a new row "Edit own profile (rate per unit, GST period, GST number, contact, prepaid
  procedures)" reads Yes, own · Yes, on their behalf · No; a row "Edit Contracts, own price list
  included" reads No · Yes · No if 18 or 19a has not added it.
- `04-presenter-cheat-sheet.md` section 8 (Pre-payment): one line that each anaesthetist chooses
  prepaid procedures and whole RVG groups on their profile, each priced from their own price list kept
  by the office (Phase 27 makes it apply when a person pays, at that price in full). Remove any line
  there that still says prepaid "codes" or "RVG codes" only. The payables and disbursement notes:
  payouts show the destination account (display only).
- `README.md` feature table: a row for "Anaesthetist profile and prepaid procedures".
- Control Panel scenario text: none expected. Grep `src/apps/demo` for "unit value", "master data",
  "prepaid" and "HPI" wording to confirm.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 26` first: earlier phases (17's record
page, 19a's price list) may have changed these recipes since this plan was written. Several current
captions and absent reasons describe the old model (prepaid "RVG codes or groups", an office-only
unit value, "HPI"); each one below is replaced when its recipe is updated.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-06.1.1](../../../../requirements-board/requirements/stories/US-06.1.1.md) Tick procedures or groups | absent ("prepaid RVG codes or groups"; per-procedure payment category) | captured. Create the recipe. Shots: mobile `mobile-prepaid-sheet` (More, Change; states `procedures`: the Procedures tab with Rhinoplasty ticked at $1,200.00, a ticked group's procedures "via" its code and one "No price yet"; `rvg-codes`: the RVG codes tab with the whole group ticked), and web `web-prepaid-panel` at `/web/profile` (highlight the tick list panel). Caption: "Anaesthetist ticks prepaid procedures one by one or a whole RVG group, each shown with the price from their own price list". Drop the absent reason. |
| [US-06.1.2](../../../../requirements-board/requirements/stories/US-06.1.2.md) Admin can maintain on behalf | absent ("no prepaid RVG codes or groups"; per-procedure setting) | captured. Create the recipe. Admin shots: `/admin/masters` state `table` (highlight the Prepaid column), then 17's record page `/admin/masters/anaesthetists/34821` states `prepaid` (the Prepaid procedures card with the tick list, highlight it) and `price-list` (the Own price list card, "Kept by the office from the prices Dr Melanie Souter sends", with "Open in Contracts"). Caption: "Office maintains an anaesthetist's prepaid procedures on their behalf; the prices sit on her own price list, which the office keeps". |
| [US-12.1.1](../../../../requirements-board/requirements/stories/US-12.1.1.md) Dollar value per unit | partial · admin-unit-value[list,edit] ("only by the office") | captured. Keep `admin-unit-value` (`list`, `edit`; Unit $ still the third column). Add a mobile `mobile-profile` shot at `/mobile/more` (states `profile` with the Rate per unit row highlighted, `rate-sheet` after tapping it) and a web `web-profile` shot at `/web/profile` (Billing panel highlighted). Caption: "Anaesthetist sets their own dollar value per RVG unit". Drop the partial reason. |
| [US-12.1.3](../../../../requirements-board/requirements/stories/US-12.1.3.md) Prepaid procedures | absent ("no prepaid RVG codes or groups") | captured. Create the recipe. Mobile `mobile-prepaid` on `/mobile/more` (the Prepaid procedures card: procedures and groups with each fixed price from her own Contract and "No price yet" where there is none; highlight the card) and state `price-list` (the read-only "Your price list" sheet, "Kept by the AA office"); reuse the admin `prepaid` state from US-06.1.2. Caption: "Prepaid procedures and RVG groups on the anaesthetist profile, each priced from their own fixed-price Contract, which the office keeps". Never "prepaid RVG codes". Phase 27 derives from it and keeps the shots. |
| [US-12.1.4](../../../../requirements-board/requirements/stories/US-12.1.4.md) Anaesthetist identity, contact and bank details | captured · admin-anaesthetist-record[edit,add] (captions "Editing an anaesthetist's phone and email", "Adding an anaesthetist with registration number, contact and HPI") | captured. Keep `admin-anaesthetist-record` (`edit`, `add`), re-shot with the HPI CPN and bank fields, and add state `record` on 17's record page (the Profile card with HPI CPN, masked bank account and GST number), plus the mobile `mobile-profile` identity and bank rows (read-only, lock glyph, bank masked). Captions: "Editing an anaesthetist's contact, HPI CPN and bank details", "Adding an anaesthetist with registration number, contact, HPI CPN and bank account", and for the new states "Anaesthetist identity, contact and bank details; one HPI CPN". |

**Recipes this phase breaks or touches.**
- `US-12.1.2` (`gst-period-setting`, `gst-period-view`): the Edit sheet gains fields and the anaesthetist
  can now set the GST period in their profile. Re-check the `[role=dialog] div:has(> div:text-is("GST period"))`
  highlight; replace the caption "GST period on the anaesthetist record, set by the office" (the
  period is no longer office-only; the aligned schedule is Phase 38's) and add a mobile or web profile
  state for the GST row.
- `US-04.2.14` (19a's `own-price-list`, partial): add an anaesthetist-side state, the mobile "Your
  price list" sheet (read-only, "Kept by the AA office"), and narrow its absent reason to what is still
  to come (the prepaid amount from it, Phase 27), since 20 and 24 have landed by now.
- `US-01.1.3` (`Add anaesthetist` flow): two optional bank fields are added (and "HPI CPN (optional)"
  if 17 did not relabel it). The recipe highlights `[role=dialog]`, so it should still pass; re-shoot
  to pick up the new fields and check the caption.
- `US-08.3.4`, `US-09.2.4`, `US-10.1.2`, `US-10.2.1` (Payables run, `[data-shot=billing-payables-run]`):
  the card gains a destinations list. The hook is unchanged, so the recipes pass; look at the shots
  and caption the destination account where the story is about the payout.
- 17's record-page recipes (US-13.6.3, US-01.3.6, and US-12.1.4 if 17 added one there): the page
  gains cards; re-check their highlights stay on the tier and pairing sections.
- Every recipe that shoots `/admin/masters` with `table th:nth-child(3)` (`US-12.1.1`) stays valid only
  while Unit $ stays the third column; keep it third or re-point the highlight to a `data-shot`.
  The `--dry` run is the check for the rest.

**ATLAS.md.** Routes: add `/web/profile`. Existing hooks: add `mobile-profile`, `mobile-prepaid`,
`mobile-prepaid-sheet`, `mobile-price-list`, `web-profile`, `web-prepaid-panel`, `web-price-list`
(and the record-page card hooks added). Seed data: Dr Souter's prepaid set (Rhinoplasty plus one whole
group, with priced and unpriced procedures), bank account, and the two colleagues with a set and no
price list.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS entry,
run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**. Fan out about three
independent Opus review subagents, one each for **quality**, **bugs/correctness** and **plan
adherence**. This session then independently verifies every finding against the catalogue files, this
doc and the code, fixes the confirmed ones (with a test for each bug), re-greens, and records the pass.
Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **Permissions hold in the store, not just the UI.** An anaesthetist actor cannot write another
  anaesthetist's record, nor bank, HPI CPN or active on their own (the GST number they can), nor any
  Contract, their own price list included (OQ-91); integration and system actors cannot write at all;
  the office can write everything. Every write goes through `mutate()`; `onBehalfOf` is set exactly
  when the office writes and never otherwise.
- **One price, one place.** Every price on the profile and the record page comes from 19a's
  `ownFixedPriceFor` or `ownPriceListFor` for the version in force on the demo date; no screen reads
  Contract lines directly, no price or amount is stored on the profile, nothing is editable, and
  "No price yet" shows exactly where the Contract has no line.
- **One unit value.** No second copy of the rate exists; the profile, the fee path and 25's snapshot
  all read `Anaesthetist.unitValue`. An edit after authorise leaves the snapshot, Review and the
  invoice unchanged. The rate note in the UI is true for the code as built.
- **Nothing derived yet.** No Booking, banner, gate, warning or review flag reads `prepaidSettings` in
  this phase; `bookingRequiresPrepayment` and 20's interim flag are untouched. The seed coherence test
  would catch 27 flagging an unintended seeded Booking.
- **The tick list is correct.** Procedures and whole groups on 19's ids; group expansion follows a
  procedure moved between groups; explicit procedures survive unticking a group; the stored form is
  canonical, so an unchanged save writes no audit; unknown ids are refused; a retired id already ticked
  stays and cannot be newly ticked.
- **Privacy.** The profile and its selectors never read the `officePrivate` slice or a tier or pairing
  audit entry; 17's `officePrivacy.test.ts` is green.
- **Bank data is handled carefully.** Masked on the anaesthetist's screens, in the audit and in the
  payables list; full only in the office's edit field. The disbursement snapshot does not move when the
  bank changes. Seeded numbers are on non-issued bank 99 and are deterministic, with no RNG draw.
  Display-only: no payout is held, rerouted or re-amounted by a bank account, present or missing.
- **One identifier, one validator each.** The HPI CPN is one field (`hpiId`), labelled "HPI CPN" on
  every surface and in the audit, normalised and checked by 17's helpers, unique across surgeons and
  anaesthetists, office-only. The GST number uses 22's validator and format only, and an edit never
  rewrites an issued invoice's supplier snapshot. No start date was added.
- **Mobile is mobile.** Bottom sheets with sticky Save, not a desktop form; the PWA panel still renders
  below and `pwaPurity` is green (the shared profile components import nothing from `apps/`). Web is a
  desktop layout and the four nav tabs are unchanged.
- **No gold-plating.** No prepayment derivation, prepaid amount on a Booking, "no price" warning,
  estimate, deposit, price editing, GST schedule rework, payout history, bank verification, payout
  hold, HPI CPN lookup, start date or notification. Plus the usual: teal-only actions, crimson identity
  only, no dashes in copy, one `PERSIST_VERSION` bump.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): readings taken rather than asked (the seeded prepaid sets and which group Souter
  ticks; a retired procedure or group staying in a prepaid set; the read-only "Your price list" view,
  OQ-91's recommendation, which the answer neither adds nor forbids; the profile showing the price in
  force today while a Booking takes the price on its procedure date, OQ-48; the anaesthetist editing
  their own contact details and GST number, where US-12.1.4 has admins hold the master record and
  only US-12.1.1 and US-12.1.2 say the anaesthetist sets the rate and GST period), anything logged rather
  than fixed, and the screens worth a look, each with its route and persona.
- Status row for catch-up Phase 26, and a phase entry: the drift-check result (including whether 25 had
  landed), what was built, the review pass (findings confirmed and fixed, anything not treated as a
  defect and why), tests added, and the `PERSIST_VERSION` bump. Record DM-32's anaesthetist half
  (DM-33 merged into it) as built here.
- Catalogue screenshots result: the recipes created or changed (US-06.1.1, US-06.1.2, US-12.1.1,
  US-12.1.3, US-12.1.4, and the touched US-12.1.2, US-04.2.14, US-01.1.3 and payables recipes), the
  REPORT.md counts (captured, partial, absent, failed) before and after, and any partial reason handed
  to a later phase.
- **Decisions log:**
  1. The anaesthetist edits their own rate per unit, GST period, GST number, contact details and
     prepaid set; bank details, HPI CPN, registration, active and every Contract (their own price list
     included, OQ-91) stay office-only. This supersedes the July reading that the anaesthetist has no
     access to master data (`editAnaesthetist` office-only since Phase 07, the `RolesInfo` copy and the
     persona permissions in the demo guide).
  2. Office edits to an anaesthetist's profile carry `onBehalfOf` on the audit entry.
  3. The prepaid set stores procedures and whole RVG groups separately, on 19's ids; groups expand at
     read time, so a procedure moved between groups flows through, and explicit procedures survive
     unticking a group. It holds no price: each prepaid price is read from the anaesthetist's own
     first-party Contract (US-12.1.3, US-06.2.2), shown read-only, with "No price yet" where there is
     none (OQ-92 stays Phase 27's).
  4. Bank details are held on the Anaesthetist (OQ-14), display-only: shown masked outside the office
     editor and in the audit, snapshotted on each disbursement, and never used to hold or route a
     payout.
  5. The web profile is reached from the persona block, keeping the design's four tabs; the Admin
     side extends Phase 17's anaesthetist record page rather than adding a second editor.
  6. The anaesthetist's HPI CPN (OQ-52: one identifier) is office-edited after creation, normalised and
     format-checked with Phase 17's helpers, and unique across surgeons and anaesthetists.
- **Handoff list:**
  - 27 derives the Booking requirement with `expandPrepaidProcedures` and `prepaidReasonFor` where a
    person pays for the patient (US-06.2.1, OQ-73), takes the amount from 19a's `ownFixedPriceFor`
    (the version in force on the procedure date), raises OQ-92's warning where it is undefined
    (`prepaidPriceRows` shows the same gap on the profile), removes 20's interim flag, sets Riley's
    procedure if it is still blank and turns the seed coherence test's exception into a pass.
  - 36 and 37 carry the disbursement destination into the ledger and the Xero-detected payout; 39a's
    remittance advice names it.
  - 28 adds the start date to the same record and to 17's record page (US-01.1.3).
  - 38 builds the aligned GST schedule on the profile's GST period.
  - 40a moves the profile screens' and the Admin record page's HPI CPN onto its shared `HPI_CPN_LABEL`
    and `formatHpiCpn`; it adds no lookup or check character (the shape check stays 17's).
  - 42 loads anaesthetist bank details and prepaid sets through the spreadsheet loader, if AA wants it;
    first-party price lists load with the other Contracts and lines.
