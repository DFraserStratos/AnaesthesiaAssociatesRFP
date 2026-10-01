# Phase 26 · Prepaid settings and anaesthetist profile

**Requirements covered:**
[FT-06.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.1.md) Prepaid procedure settings on the anaesthetist profile (Confirmed) ·
[US-06.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.1.1.md) Tick codes or groups (Confirmed) ·
[US-06.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.1.2.md) Admin can maintain on behalf (Proposed) ·
[US-12.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.1.md) Dollar value per unit (Proposed; the anaesthetist-facing half, the lock half is Phase 25's) ·
[US-12.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.3.md) Prepaid procedures (Confirmed; the stored list, the derivation is Phase 27's) ·
[US-12.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.4.md) Anaesthetist identity, contact and bank details (Verify; changed at `501b0b8`: the identifier is one **HPI CPN**, OQ-52) ·
[DM-19](../analysis/domain-model-delta.md#dm-19) prepaid settings on the anaesthetist profile (RVG codes and groups) ·
[DM-33](../analysis/domain-model-delta.md#dm-33) anaesthetist profile: bank details, prepaid settings, HPI CPN, GST number, admin-editable (its start date is Phase 28's).
No RV finding is closed here. RV-09 (prepayment as a patient category and a completion gate) is
Phase 27's; Phase 20 already removed the payment category.
Context only, closed elsewhere:
[FT-12.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-12.1.md) Profile settings (grouping) ·
[US-12.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.2.md) GST period (this phase lets the anaesthetist set it; the aligned GST schedule is Phase 38's) ·
[US-08.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.5.md) Anaesthetist as supplier, AA as agent (Phase 22 added `gstNumber` and prints it; this phase lets the anaesthetist see and edit it) ·
[US-01.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.3.md) New anaesthetist gets a populated canvas (the start date on the same record, Phase 28) ·
[US-06.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.1.md) Detect prepayment requirement (Phase 27; now Verify and limited to a patient billable party, OQ-73) ·
[US-05.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.3.md) Group codes (built in Phase 19).
Open questions: [OQ-14](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-14.md) (Answered: bank details live in the system),
[OQ-25](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-25.md) (Answered: no Pre-paid Contract category),
[OQ-52](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-52.md) (Answered 2026-10-01: the HPI number and the CPN are one identifier, called the HPI CPN). None open here.
[OQ-73](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-73.md) (Open: who counts as the patient for the prepayment limit) is Phase 27's; it only shapes this
phase's seed coherence test.
**Depends on:** Phase 19 (RVG groups, `RvgGroupRef`, `codesInGroup`, `searchRvgCodes`) and Phase 20
(payment category removed; the office-set Booking `prepayment` flag is the interim). By the sequencing
rules it runs after Phase 25 (the AUTHORISED lock copies the unit value this profile edits), so 17
(`normaliseHpiCpn`, `isPlausibleHpiCpn`, the "HPI CPN" audit label and the duplicate refusal), 21 (the
Booking's effective billable party) and 22 (`Anaesthetist.gstNumber`, `isValidGstNumber`,
`formatGstNumber` and the invoice supplier snapshot) have landed too. It runs **immediately before
Phase 27**, which derives prepayment from the set stored here.
**Estimated:** 1 long session, at the top of the one-session budget (14 work items across three apps).
If it runs long, stop after work item 8 (model, pure helpers, store, seed and tests green) and do the
screens (items 9 to 14) in a second session; propose that split in plan mode if the mapping shows it
will not fit.

## Goal

Give each anaesthetist a profile they own, and give the office the same record to maintain on their
behalf.

- **Mobile More tab and web app gain a Profile.** It shows and edits the anaesthetist's own dollar value
  per RVG unit, GST period, GST number (the one Phase 22 prints on invoices issued in their name) and
  contact details. It shows identity (registration number and the **HPI CPN**, their one Health
  Provider Index identifier, OQ-52) and the bank account read-only.
- **Prepaid procedures tick list.** The anaesthetist ticks RVG codes individually, or whole groups (AA
  groups such as Cosmetic, Plastics and Dental, or an NZSA body-site group). A code covered by a ticked
  group shows as covered "via" that group. The set is stored on the Anaesthetist record.
- **Bank account held in the system** (OQ-14), display-only in the demo (DM-33). The office enters and
  edits it; the anaesthetist sees it masked. The payables run shows each payout's destination account
  and snapshots it on the disbursement record. No payment is held or routed by it.
- **Admin edits on the anaesthetist's behalf.** The Admin anaesthetist editor gains the bank, HPI CPN
  (now editable, format-checked) and prepaid sections. Every office edit is audited as the office
  acting for that anaesthetist.
- **One unit value.** The profile edits the same `Anaesthetist.unitValue` that fees read and that
  Phase 25's lock copies at AUTHORISED. A change re-prices only Bookings not yet authorised.

Nothing is derived from the prepaid set in this phase. Phase 27 reads it. No S1 to S5 figure moves.
The record's start date (US-01.1.3) is Phase 28's and is not added here.

## Before you start: drift check

1. Run `git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"`
   and read the hunks for FT-06.1, US-06.1.1, US-06.1.2, FT-12.1, US-12.1.1, US-12.1.2, US-12.1.3,
   US-12.1.4, US-08.4.5, US-01.1.3, US-06.2.1, US-05.1.3, OQ-14, OQ-25, OQ-52 and OQ-73, plus the
   domain model's entity diagram (`PREPAID_SETTING`, `PROFILE`), the HPI CPN glossary row and the
   Prepayment calculation rule. If an item changed, re-read it whole and adjust the work items. If one
   is now Retired or Future, drop its work and say so in the PROGRESS entry.
2. Confirm the Verify and Proposed readings. At `501b0b8` (2026-10-01 update) US-12.1.4 names one
   **HPI CPN** (OQ-52 answered) and US-06.2.1 limits prepayment to a patient billable party (OQ-73 open,
   Phase 27's). Nothing in this phase is provisional unless an answer below changes.

| Item | Build (the reading as at `501b0b8`) | If it has changed |
|---|---|---|
| **US-12.1.4** (Verify): bank details in the system, on the profile; one HPI CPN | Office-held bank account (name and number) on the Anaesthetist, display-only; masked read-only on the anaesthetist's profile; payables run shows and snapshots the destination. `hpiId` labelled "HPI CPN", office-edited, format-checked | If the AC moves bank details to Xero only: add no bank field. Show "Bank account held in Xero" on both profiles and skip work item 7. If the anaesthetist may edit it: move `bankAccount` into the self-editable set. If OQ-52 is reopened: stop and ask before item 3 |
| **US-12.1.1** (Proposed): "each anaesthetist sets their own" unit value | The anaesthetist edits it on the profile; the office can too | If it becomes office-set only: the profile shows it read-only with "Set by the AA office" |
| **US-06.1.2** (Proposed): admin maintains on behalf | Build as written | If retired: the Admin editor shows the prepaid set read-only and the store refuses office writes to it |
| **US-12.1.2** (Proposed, closed in 38) | The anaesthetist sets the GST period on the profile | If it becomes office-only: read-only on the profile |
| **US-08.4.5** (Phase 22's): the anaesthetist's GST number on invoices issued in their name | The anaesthetist edits their own `gstNumber` on the profile with 22's validator; issued invoices keep 22's supplier snapshot | If the GST number becomes office-held: read-only on the profile with "Held by the AA office" |

3. Read what the earlier phases actually built (their PROGRESS entries). File names below are as at
   `501b0b8` (the prototype code is unchanged since `501b0b8`); Phase 15 renamed Card to Booking
   (`CardDetailBody`, `cardFee` and so on may have new names). In particular:
   - Phase 19: the exact names of `RvgGroup`, `RvgGroupRef`, `masters.rvgGroups`, `codesInGroup`,
     `groupsOfCode`, `searchRvgCodes`, and the seeded groups (Cosmetic, Plastics, Dental, Bariatric)
     and their members. Also the guards on `deleteRvgGroup` and on deleting an AA code.
   - Phase 17: `normaliseHpiCpn` and `isPlausibleHpiCpn` (`src/domain/surgeons.ts`), the `hpiId`
     audit label already relabelled "HPI CPN", and the duplicate refusal ("That HPI CPN is already
     held by ...") that checks surgeons and anaesthetists. Reuse all three; add no second HPI CPN
     validator.
   - Phase 20: the Booking `prepayment` interim flag (`setBookingPrepayment`) and that
     `bookingRequiresPrepayment` (Phase 15's name for `cardRequiresPrepayment`) reads it. This phase
     leaves both alone.
   - Phase 21: `billablePartyForProcedure(booking, procedure, contract, patientId, masters)` and
     `isPersonParty(ref)` in `src/domain/billing/billableParty.ts` (a Procedure's effective billable
     party, and whether it is a person: the patient or someone paying for them), which the seed
     coherence test in item 8 uses.
   - Phase 22: `Anaesthetist.gstNumber` (required), `isValidGstNumber` and `formatGstNumber` in
     `src/domain/billing/invoicePresentation.ts`, the `editAnaesthetist` refusal "Enter a GST number of
     8 or 9 digits.", the Admin GST number column and field, and the invoice supplier snapshot (an
     edit after issue must not change an issued invoice).
   - Phase 25: that the locked per-Procedure record copies the unit value at authorise and that the
     engine and Review read the lock. **If 25 has not landed**, do not claim the lock in copy: the
     profile note reads "A new rate applies to Bookings not yet invoiced", and the lock regression test
     in item 8 is added as `it.todo` with a handoff note for 25.
   - Phase 14: its PWA demo-actions sheet is planned as a floating "Demo" chip mounted in
     `src/pwa/MobileViewport.tsx` (not on the More tab), shown only on routes with PWA triggers. Confirm
     where it landed, that no trigger is registered for the More route, and that the new More cards do
     not collide with it or with `PwaDemoPanel` (the `moreExtra` slot).
4. Record the current `PERSIST_VERSION` (13 at `501b0b8`; Phases 14 to 25 will have bumped it).

## Reference

**Design (convention 17).** No mockup has a More, profile or settings screen. Extend the design's own
patterns:

- Mobile: `docs/design/Mobile App.dc.html` for the card surfaces, row anatomy (label left, mono value
  right, chevron), the bottom-sheet treatment and the sticky teal primary action; the existing
  `MoreScreen` persona card. Everything edits in bottom sheets (the `useSurface()` Overlay in the mobile
  `SurfaceProvider`), never a desktop form. The tick list is a tall bottom sheet with a search field and
  a sticky Save.
- Web: `docs/design/Web Dashboard.dc.html` for the top nav, panel anatomy (`apps/web/components/Panel.tsx`)
  and the desktop grid. The persona name and avatar in `WebNav` become the way into the profile; the
  four nav tabs stay as the design has them (Decisions log 2026-07-21, navigation structures).
- Admin: the existing Master data table and `EditAnaesthetistSheet` (the `Admin Review.dc.html` table
  anatomy: mono data cells, neutral pills, row actions).
- Tokens from `docs/design/Design Language.dc.html`. Teal is the only action colour. Crimson stays on
  the avatar and nav underline only. "via Cosmetic", "AA" and "Not on file" markers are neutral or
  warning-tone pills, never crimson. Money, account numbers, GST numbers and the HPI CPN are Spline
  Sans Mono, tabular-nums.

**Catalogue.** The files linked above; `domain-model.md` section 2 (entity diagram: `PREPAID_SETTING`,
`PROFILE`), the HPI CPN glossary row, and section 3's Prepayment rule (the estimate uses "the
anaesthetist's own unit value", which is this field; Phase 27). Evidence for OQ-52:
`catalogue/notes/2026-10-01-aa-meeting-with-greg.md` #26 and #63.

**Analysis.** `../GAP-ANALYSIS.md`: everything before "## By epic", then the "EP-06 · Prepayment" rows for
FT-06.1, US-06.1.1 and US-06.1.2 and the "EP-12 · Anaesthetist profile and reporting" rows for
US-12.1.1 to US-12.1.4. `../epics/EP-06.md` and `../epics/EP-12.md` (same items).
`../analysis/domain-model-delta.md` (DM-19, DM-33; DM-13 for groups; DM-27 for the GST number on the
invoice; DM-32 for the HPI CPN). `../analysis/reverse-check.md`
RV-09 (context: why nothing is derived here). `../analysis/prototype-map-apps-mobile-web.md` (More,
Accounts GST tab, routes), `prototype-map-admin.md` section 9 (Master data), `prototype-map-store-seed.md`
(masters, seed cast), `prototype-map-shell-demo-pwa.md` (the PWA `moreExtra` slot and `pwaPurity`).

**Code entry points (at `501b0b8`).**

- Types: `src/domain/types.ts` `Anaesthetist` (141 to 151; `hpiId` doc comment at 148 says "HPI
  practitioner identifier", reword to HPI CPN), `GstPeriod` (153), `AuditEntry` (645),
  `Disbursement` (809), `XeroAccPay` (780). Phase 22 added `gstNumber`.
- Store: `src/store/mastersActions.ts` `AnaesthetistPatch` (171), `editAnaesthetist` (185, office-only
  today; its doc comment says a unit-value change re-prices every fee, which 25 made untrue for
  authorised Lists), `NewAnaesthetistFields` and `addAnaesthetist` (222 onward). `src/store/mutate.ts`
  (`Actor`, `MutationMeta`, the audit append at 170 to 180). `src/store/payablesActions.ts`
  (`payablesDue` 35, `disbursePayables` 55, `caseByAccPay`, `runPayables` 146, `disbursePayable` 160).
  `src/store/selectors.ts` (add the profile selectors here).
- Seed: `src/domain/seed/cast.ts` (`ANAE`, `ANAESTHETISTS` 45 to 58, `hpiId` values `10SOUM` to
  `23STRO`); `src/domain/seed/index.ts` (`SeedMasters`); `src/domain/seed/cards.ts`, which Phase 15
  renamed `bookings.ts` (`SEED_PREPAID_BOOKING_ID`, `SEED_MARKERS.prepaymentBooking`; Nair's Booking:
  41789 septoplasty plus 41800 rhinoplasty on Souter Fri 24 PM; Riley's split-deposit Booking on Souter
  Fri 24 AM, uncoded at `501b0b8`);
  `src/domain/seed/seed.test.ts`. `src/store/appStore.ts` `PERSIST_VERSION`.
- Mobile: `src/apps/mobile/screens/MoreScreen.tsx`, `src/apps/mobile/routes.tsx` `MobileMoreRoute`
  (173), `src/apps/mobile/outlet.ts` (actor, anaesthetistId, `moreExtra`), `src/pwa/PwaDemoPanel.tsx`
  (the PWA's `moreExtra`).
- Web: `src/router.tsx` (web routes 70 to 85), `src/apps/web/routes.tsx`, `src/apps/web/WebApp.tsx`,
  `src/apps/web/components/WebNav.tsx` (`WebTab`, persona block), `src/apps/web/screens/AccountsScreen.tsx`
  (GST tab: local `periodLabel` 285, Segmented 292 to 300, default captured once at mount).
- Admin: `src/apps/admin/screens/MasterData.tsx` `AnaesthetistsView` (166 to 186, raw `gstPeriod` enum
  in the table), `src/apps/admin/flows/EditAnaesthetistSheet.tsx` (61: "HPI" read-only),
  `AddAnaesthetistFlow.tsx` (72: "HPI id (optional)"),
  `fieldChrome.ts` (`GST_OPTIONS`), `src/apps/admin/RolesInfo.tsx` (24 and 29: role copy),
  `src/apps/admin/screens/BillingMonitorScreen.tsx` (Payables run card, 121 to 146),
  `src/apps/admin/screens/AuditViewer.tsx`.
- Demo: `src/apps/demo/DemoXero.tsx` (ACCPAY pane, disbursement stats around 388 and 515).
- Audit copy: `src/shared/audit/actionLabels.ts` (67), `fieldLabels.ts` (119 to 121; `hpiId` is
  "HPI CPN" after Phase 17, `gstNumber` "GST number" after Phase 22), `auditNarrative.ts`.
- Shared UI: `src/shared/surface/` (BottomSheet, Dialog, `useSurface`), `src/shared/ui/` (Button, Field,
  SlidingSegmentedControl), `src/shared/format.ts` (`nameWithoutTitle`, `drSurname`, `formatCurrency`),
  `DemoBadge`.
- Tests to extend (under `aa-prototype/src/`): `store/mastersActions.test.ts`, `store/payablesActions.test.ts`,
  `domain/seed/seed.test.ts`, `store/persistMigrate.test.ts`, `shared/audit/auditNarrative.test.ts`,
  `apps/web/screens/AccountsScreen.test.tsx`, `src/pwa/pwaPurity.test.ts` (must stay green).
  Playwright (under `aa-prototype/visual/`, not `src/`): `web-phase05.spec.ts`, `admin-phase07.spec.ts`, `mobile-phase03.spec.ts`,
  `routing.spec.ts`, `pwa-device.spec.ts`.

## Work items

Model, pure helpers, store and seed first, then screens.

1. **Model** (`src/domain/types.ts`; DM-19, DM-33).
   - `Anaesthetist` gains `bankAccount?: BankAccount` and `prepaidSettings: PrepaidSettings` (required,
     empty by default).
   - `BankAccount { accountName: string; accountNumber: string }`. `accountNumber` is stored normalised
     as `BB-bbbb-AAAAAAA-SS(S)`.
   - `PrepaidSettings { rvgCodes: string[]; groups: RvgGroupRef[] }`, using Phase 19's `RvgGroupRef`
     (`{ kind: 'site'; site } | { kind: 'aa'; groupId }`). Comment it: "The anaesthetist's own prepaid set
     (US-06.1.1). Phase 27 derives a Booking's prepayment requirement from it (US-06.2.1)."
   - `AuditEntry` gains `onBehalfOf?: AnaesthetistId`. `MutationMeta` gains the same optional field, and
     the entry builder in `mutate.ts` (around line 170) copies it onto the entry when set, the same way it
     copies `before` and `after` (US-06.1.2: "on their behalf" is visible in the audit, not inferred).
     Test in `mutate.test.ts`.
   - `Disbursement` gains `destination?: { accountName: string; accountMasked: string } | null`, a
     snapshot taken at run time (`null` when no bank account was on file) so a later bank edit never
     rewrites a past payout.
   - `hpiId` keeps its name (Phase 17 uses the same key for surgeons); reword its doc comment to "HPI
     CPN (Common Person Number): the practitioner's one Health Provider Index identifier (OQ-52)".
     `gstNumber` is Phase 22's; add nothing for it. Add no start date (Phase 28).

2. **Pure helpers, with Vitest tests.**
   - `src/domain/bankAccount.ts` (US-12.1.4): `normaliseNzBankAccount(input)` accepts digits with or
     without dashes or spaces and returns the dashed form or `null` (2-digit bank, 4-digit branch,
     7-digit account, 2 or 3-digit suffix). `maskBankAccount(n)` returns `BB-bbbb-•••••AA-SS`. No bank
     modulus check (named as a demo simplification in the code comment). Tests: valid and invalid
     shapes, 2 and 3-digit suffixes, masking.
   - `src/domain/billing/prepaidSet.ts` (US-06.1.1, US-12.1.3), built on 19's `codesInGroup`:
     - `normalisePrepaidSettings(s)`: dedupes and sorts codes and groups into one canonical order, so
       saving the same ticks twice is a no-op and audit diffs are stable. Explicit codes are kept even
       when a ticked group also covers them, so unticking the group never silently drops a choice.
     - `validatePrepaidSettings(s, masters)`: unknown codes, unknown AA groups and unknown sites as a
       list of refusal reasons.
     - `expandPrepaidCodes(s, masters): Set<string>`: the union of explicit codes and every ticked
       group's members. This is the function Phase 27's derivation calls; nothing calls it for a
       Booking in this phase.
     - `prepaidReasonFor(code, s, masters)`: `{ explicit: boolean; viaGroups: RvgGroupRef[] } | null`,
       used by the tick list ("via Cosmetic") and, later, by 27's banner.
     - `summarisePrepaidSettings(s, masters)`: `{ groupCount, codeCount, coveredCodeCount }` for the
       row summaries.
     - Tests: many-to-many membership (45200 in Cosmetic and Plastics), site groups, explicit plus group
       overlap, untick group keeps explicit code, unknown ids refused, canonical ordering, empty set.
   - `src/domain/anaesthetistProfile.ts`: the field policy as data.
     `SELF_EDITABLE_PROFILE_FIELDS = ['unitValue', 'gstPeriod', 'gstNumber', 'phone', 'email', 'prepaidSettings']`;
     `OFFICE_ONLY_PROFILE_FIELDS = ['bankAccount', 'hpiId', 'active']`. The registration number is the
     record's key and nobody edits it. Also move the GST period options and one `gstPeriodLabel()` here
     (Monthly, Two-monthly, Six-monthly), so mobile, web and admin cannot drift.
     `apps/admin/flows/fieldChrome.ts` re-exports or imports it. Test the policy lists are disjoint and
     cover every editable field.

3. **Store: profile edits** (`src/store/mastersActions.ts`; US-12.1.1, US-12.1.4, US-06.1.2).
   - Widen `editAnaesthetist(api, actor, registrationNumber, patch)`. `AnaesthetistPatch` gains
     `hpiId` and `bankAccount` (a `BankAccount` or `null` to clear); `gstNumber` is already there from
     Phase 22.
   - Guards, in order: `notFound`; any `role: 'system'` actor refused (integration feeds, the billing
     and payables runs and demo control all carry `role: 'system'`; `ActorRole` has no integration
     value); an anaesthetist actor with no `anaesthetistId` refused; an anaesthetist actor may
     edit only their own record (`actor.anaesthetistId === registrationNumber`, else `notOwnProfile`)
     and only self-editable fields (else `officeOnlyField`, naming the field, for example "Bank details
     are held by the AA office.", "Your HPI CPN is held by the AA office."); the office may edit every
     field. Keep `invalidUnitValue`; round the unit value to cents; refuse an invalid bank number
     (`invalidBankAccount`) or an empty account name. The GST number keeps Phase 22's validation and
     refusal for both actors. The HPI CPN is stored through 17's `normaliseHpiCpn`, may be blank ("where
     available"), and a non-blank value must pass `isPlausibleHpiCpn` (`invalidHpiCpn`: "Enter an HPI
     CPN of two digits then four letters, for example 12ABCD.") and 17's duplicate check against
     surgeons and the other anaesthetists.
   - A patch that changes nothing is `ok` with no audit entry.
   - Audit stays `anaesthetist.update` with before and after of the changed fields only. When the office
     edits, set `onBehalfOf: registrationNumber`. Bank numbers are written to the audit **masked** in
     both before and after.
   - Rewrite the doc comment: a unit-value change re-prices only Bookings on Lists not yet authorised;
     authorised Lists price from Phase 25's lock.

4. **Store: prepaid settings** (`src/store/mastersActions.ts`, or a new `profileActions.ts` exported from
   `store/index.ts`; US-06.1.1, US-06.1.2, US-12.1.3).
   - `setPrepaidSettings(api, actor, registrationNumber, settings)`: the same actor rules as item 3
     (own record, or office on behalf). Validates with `validatePrepaidSettings` (`unknownPrepaidCode` /
     `unknownPrepaidGroup`), stores the normalised form, no-op when unchanged.
   - Audited `anaesthetist.prepaid` with before and after `{ rvgCodes, groups }`; `onBehalfOf` when the
     office writes.
   - **Referential guards on Phase 19's masters.** `deleteRvgGroup` is also refused while any
     anaesthetist's prepaid set ticks the group (`groupInPrepaidSet`: "2 anaesthetists mark this group
     as prepaid"). Deleting an AA code (19's `deleteAaRvgCode`) is refused likewise (`codeInPrepaidSet`). Tagging or untagging a
     code into a group needs no guard: a group is ticked as a group, so its membership is meant to
     flow through (test that `expandPrepaidCodes` follows a re-tag).

5. **Store: selectors** (`src/store/selectors.ts`).
   - `profileFor(state, registrationNumber)`: the view model both profiles read (unit value, GST label,
     contact, identity, masked bank or `null`, prepaid summary). It builds a new object, so screens
     select the raw record and masters from the store and derive with `useMemo` (the `AccountsScreen`
     pattern), never pass `profileFor` straight to `useAppStore`, which would re-render forever.
   - The view model carries the GST number already formatted by 22's `formatGstNumber` and the HPI CPN
     as stored.
   - `lastProfileChangeFor(state, registrationNumber)`: the newest `anaesthetist.update` or
     `anaesthetist.prepaid` audit entry, so the anaesthetist's profile can say "Last changed by Kirsty W.
     for you, 21 Jul" when the office acted on their behalf (US-06.1.2 visible from both sides).

6. **Store: add anaesthetist.** `NewAnaesthetistFields` and `addAnaesthetist` accept an optional
   `bankAccount` (validated as above) and start with `prepaidSettings` empty. The optional `hpiId` gets
   the same HPI CPN normalise, format and duplicate checks as item 3 (today it is stored as typed). The
   `anaesthetist.create` audit `after` records the masked bank if given.

7. **Payables run shows the destination** (`src/store/payablesActions.ts`; US-12.1.4 "used for the
   payables run"). Bank details are display-only in the demo (DM-33): the run shows and records where
   each payout goes, and its amounts and behaviour do not change.
   - Resolve each ACCPAY's anaesthetist through the BillingCase already looked up in `disbursePayables`
     (`caseByAccPay`: case, then Booking, then List, then `anaesthetistId`).
   - `payablesDue` widens its input from `Pick<AppState, 'xero'>` to also take the billing cases,
     schedule and masters it needs to resolve the anaesthetist; update the `useMemo` call in
     `BillingMonitorScreen.tsx` (line 49) and its dependencies. It gains `byAnaesthetist: { anaesthetistId, name, count, total, destinationMasked | null }[]`,
     sorted by surname, and `missingBank: number` (anaesthetists in the run with no bank account on
     file).
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
     anaesthetist gets `prepaidSettings`:
     - Souter: `groups: [Cosmetic]` and one explicit code from a different group (for example 45030
       from Plastics), so her profile shows both kinds. The code must be one none of her seeded Bookings
       uses (the coherence test below decides).
     - Two colleagues with a set each (for example Beaumont: Plastics; Chen: Dental), for the Admin
       table and the on-behalf beat. Everyone else empty.
   - `seed.test.ts`:
     - every `prepaidSettings` validates and is already normalised; every bank number normalises and is
       on bank 99; every seeded `hpiId` passes `isPlausibleHpiCpn` (17 tests uniqueness);
     - **prepaid coherence (the guard for Phase 27):** for each anaesthetist, the seeded Bookings whose
       Procedures carry a code in `expandPrepaidCodes` **and** whose effective billable party is a
       person paying for the patient (21's `billablePartyForProcedure` passing `isPersonParty`: the
       patient or a guardian, never an organisation; US-06.2.1 as changed at `501b0b8` and OQ-73's
       recommendation, the reading Phase 27 builds) are exactly the Bookings Phase 20
       seeded with the interim `prepayment` flag, and no others. That means Nair's Booking hits on
       41800 and not on 41789 (the "checked across the whole Booking" case), and Riley's Booking, still
       uncoded, is listed as the known exception with a comment for 27 (which gives it a Cosmetic
       code). A Booking that carries a prepaid code but bills a hospital or insurer is listed in a
       second, expected-not-flagged list, so 27 sees the patient-only limit is already exercised. If any
       other seeded Booking hits, change the seeded set, never a Booking's code.
   - `mastersActions.test.ts` (or `profileActions.test.ts`): the permission matrix (own, colleague,
     office, integration) for every field in both policy lists, including `gstNumber` (self-editable)
     and `hpiId` (office only); validation, including an invalid and a duplicate HPI CPN and an invalid
     GST number; no-op writes; the audit shape including `onBehalfOf` and masked bank; the group and
     code delete guards; a GST number edit after a billing run leaves the issued invoice's supplier
     snapshot (22) and the AUTHORISED lock's payee (25) unchanged.
   - **Unit value and the lock** (US-12.1.1 technical note): an anaesthetist edits their unit value
     through `editAnaesthetist`; an AUTHORISED List's locked record, its Review figures and its invoice
     are unchanged, while a DRAFT Booking's fee re-prices. (`it.todo` if 25 has not landed.)
   - `persistMigrate.test.ts` and the `SEED_MARKERS` inspector entries follow the bump.

9. **Audit copy** (`src/shared/audit/`).
   - `actionLabels.ts`: `anaesthetist.prepaid` "Prepaid procedures updated".
   - `fieldLabels.ts`: `bankAccount` "Bank account", `prepaidSettings` / `rvgCodes` / `groups` "Prepaid
     procedures", "Prepaid codes", "Prepaid groups". `phone` and `email` if missing. Leave `hpiId`
     ("HPI CPN", Phase 17) and `gstNumber` ("GST number", Phase 22) as they are.
   - `auditNarrative.ts`: renders group refs by name (AA group name, or the site name) and codes in
     mono, and appends "for Dr Melanie Souter" when `onBehalfOf` is set. `AuditViewer.tsx` shows the
     same "for" line in the actor column. Test in `auditNarrative.test.ts`.

10. **Shared profile components** (`src/shared/profile/`, exported through `src/shared/index.ts`; nothing
    imports from `apps/`, so `pwaPurity` holds).
    - `PrepaidTickList`: a controlled editor over a draft `PrepaidSettings`. Sections:
      - a summary line ("Prepayment required for 5 codes · 1 group, 1 code");
      - **Groups**: AA groups first, each a checkbox row with name, code count and a mono member preview;
        NZSA body-site groups under a "By body site" disclosure, collapsed by default;
      - **Individual codes**: a search field over 19's `searchRvgCodes` (code, description, site or group
        name), then result rows with a checkbox, mono code and description. A code covered by a ticked
        group shows ticked and disabled with a neutral "via Cosmetic" pill; an explicit code also in a
        ticked group shows ticked with "also via Cosmetic".
      - a one-line rule note: "Procedures using these codes must be paid for before the procedure."
      - Props: `variant: 'sheet' | 'panel'`, `value`, `onChange`, `masters`. Explicit Save lives in the
        host, so each save is one audited write.
    - `ProfileRow` (label, mono value, optional chevron or lock glyph) for the mobile list and the web
      read-only fields.
    - Component test: ticking a group marks its members "via"; unticking keeps an explicit code; search
      narrows; the emitted value is normalised.

11. **Mobile profile** (`src/apps/mobile/screens/MoreScreen.tsx`, `routes.tsx`; FT-06.1, US-06.1.1,
    US-12.1.1, US-12.1.4). `MobileMoreRoute` passes `actor` and `anaesthetistId` from the outlet.
    Order on the screen: persona card, **Profile** card, **Prepaid procedures** card, the Demo prototype
    card, then `extra` (the PWA panel, unchanged).
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
    - Prepaid card: the summary and a "Change" row → `PrepaidProceduresSheet`, a tall bottom sheet
      hosting `PrepaidTickList variant="sheet"` with a sticky teal Save and a Cancel. Save calls
      `setPrepaidSettings`; a refusal renders verbatim in the sheet.
    - Under the prepaid summary, the `lastProfileChangeFor` line when the last change was the office's.
    - The header eyebrow stays "Settings"; rename the component doc comment (deeper settings are no
      longer out of scope). `data-shot` hooks: `mobile-profile`, `mobile-prepaid-sheet`.

12. **Web profile** (`src/apps/web/screens/ProfileScreen.tsx`, `routes.tsx`, `router.tsx`, `WebApp.tsx`,
    `components/WebNav.tsx`; same requirements).
    - Route `/web/profile` (`WebProfileRoute`). The persona name and avatar block in `WebNav` becomes a
      button to it, with the crimson underline when active; the four tabs are unchanged.
    - Layout, desktop grid (min width as the rest of the web app): left column panels **Billing** (unit
      value field with `$` prefix and "per RVG unit", the same rate note), **GST** (period Segmented, mono
      GST number field, the same caption as mobile), **Contact** (phone, email), **Identity**
      (registration, HPI CPN, read-only) and **Bank account** (masked, read-only, same caption). Each
      editable panel has its own teal "Save changes", enabled only when dirty.
      Right column: **Prepaid procedures** panel with `PrepaidTickList variant="panel"` and its Save, plus
      the "last changed by the office" line.
    - `AccountsScreen` GST tab: the default period follows the profile. Keep the local override, but
      reset it when `masters.anaesthetists[id].gstPeriod` changes, and use the shared `gstPeriodLabel`
      (drop the local "Bi-monthly" map). The aligned-period window stays rolling (Phase 38). Extend
      `AccountsScreen.test.tsx`: editing the profile's GST period changes the tab's default.
    - `data-shot` hooks: `web-profile`, `web-prepaid-panel`.

13. **Admin on behalf** (`src/apps/admin/`; US-06.1.2, US-12.1.4).
    - `MasterData.tsx` `AnaesthetistsView`: columns Name, Reg, Unit $, GST period (label, not the enum),
      GST number (22's column, kept), HPI CPN, Bank (masked, or a warning-tone "Not on file" pill),
      Prepaid (summary such as "1 group · 1 code", or "None"), Phone, Email, Active, Edit. If the table
      is too wide, drop Phone and Email first (they stay in the editor). Header sub: "Profile settings are shared with each anaesthetist's
      own app. Office edits are recorded as made on their behalf."
    - `EditAnaesthetistSheet.tsx` becomes two tabs (Segmented): **Details** (unit value, GST period,
      GST number (22's field), phone, email, **HPI CPN** now editable with the item 3 format and
      duplicate checks shown inline, bank account name and number with inline validation, active; the
      read-only header line reads "Registration 34821 · HPI CPN 10SOUM") and
      **Prepaid procedures** (`PrepaidTickList variant="panel"`). The header line reads "Changes are
      recorded as the office acting for Dr Melanie Souter." Details save calls `editAnaesthetist`; the
      prepaid tab saves with `setPrepaidSettings`. Widen the dialog for the tick list and let it scroll.
    - `AddAnaesthetistFlow.tsx`: optional bank account name and number; relabel "HPI id (optional)" to
      "HPI CPN (optional)" with the same inline checks.
    - `BillingMonitorScreen.tsx` Payables run card: under the summary, a compact destinations list from
      `payablesDue.byAnaesthetist` ("Dr Souter · 2 payables · $1,234.00 to 99-0101-•••••21-00"), a
      warning-tone "No bank account on file" in place of the account for an anaesthetist without one,
      and a warning-tone summary line when `missingBank > 0`. The run itself is unchanged.
    - `DemoXero.tsx` ACCPAY pane: each disbursement shows "Paid to <name> · <masked>" from its snapshot
      ("Paid to <name> · no bank account on file" when `null`).
    - `RolesInfo.tsx`: anaesthetist edit copy adds "maintains their own profile: rate per unit, GST
      period, GST number, contact details and prepaid procedures"; office edit copy adds "maintains any
      anaesthetist's profile on their behalf, including bank details and the HPI CPN".

14. **Playwright shots.** A new `visual/profile-phase26.spec.ts`: mobile More with the Profile card, the
    prepaid sheet with Cosmetic ticked, the web profile page, the Admin editor's prepaid tab, and the
    Payables run destinations. Update any existing shots the table columns or More screen changed, and
    `routing.spec.ts` for `/web/profile`. Keep the PWA device spec green (the More screen gains cards
    above the PWA panel).

## Demo triggers

None. Everything here is shown through normal use: the anaesthetist edits their own profile on mobile
or web, the office edits it in Admin, and the payables run is an existing office button. Nothing is
automatic, scheduled or external, so no registry entry is added and the Control Panel is untouched.
No warning rule is added either, so 15a's "Raise sample warnings" gains no sample here.

PWA: the profile and tick list are part of the mobile More tab, so the installed PWA has them natively.
No mobile beat waits on the office (the anaesthetist changes their own set), so no PWA office stand-in
is needed. The office-on-behalf edit is an Admin act shown in the framed build; its effect ("Last changed
by Kirsty W. for you") is visible on the handset only in the framed build, which is expected. Phase 27
registers the prepayment triggers.

## Out of scope

- Deriving a Booking's prepayment requirement from the set, the estimator, the prepayment invoice at
  setup, part-paid tracking, the alert and the completion gate (Phase 27, D5, D6). Phase 20's
  office-set Booking `prepayment` flag stays the interim, untouched.
- Snapshotting the unit value at AUTHORISED (Phase 25 built it; this phase only proves the profile edit
  respects it).
- The aligned GST period window, current and previous period navigation, and the GST activity summary
  (Phase 38, US-12.1.2 and US-12.2.2).
- Payout detection from Xero and the ledger (Phases 36 and 37); an anaesthetist-facing payout history;
  holding or routing a payout by its bank account (bank details are display-only, DM-33); the
  remittance advice (39a).
- The anaesthetist's start date and Slot generation from it (Phase 28, US-01.1.3).
- HPI CPN register lookup or check-character validation (the catalogue asks for neither, and Phase
  40a confirms it builds neither; 40a only moves every HPI CPN display onto one label and formatter);
  the surgeon's HPI CPN (Phase 17).
- Changing how invoices print the GST number (Phase 22).
- Editing RVG groups or membership (Phase 19's Admin tabs; loads in Phase 42).
- A bank modulus check, bank verification, or letting the anaesthetist edit bank details.
- Login, multiple personas, notifications to the anaesthetist when the office edits their profile.
- A responsive web layout.

## Manual test checklist

- [ ] Mobile More: the Profile card shows $26.50, Monthly, Dr Souter's GST number (22's seed, mono),
      phone, email, registration 34821, HPI CPN 10SOUM and a masked bank number with the office caption.
      No "HPI id" or "HPI number" anywhere on any app. No en or em dash anywhere.
- [ ] Change the rate to 27.00 in the bottom sheet and save: the row updates; the audit viewer shows
      `anaesthetist.update` by Dr Souter (anaesthetist), unit value 26.50 to 27.00. A DRAFT Booking's
      fee (office view) re-prices; an AUTHORISED List's figures and invoice do not. Set it back.
- [ ] A zero or text rate is refused with the sentence in the sheet.
- [ ] GST sheet: a 7-digit GST number is refused with 22's sentence; a valid new one saves and the row
      shows it formatted. An invoice already issued to Dr Souter still shows the old number; set it
      back.
- [ ] Prepaid sheet: Cosmetic is ticked and 45030 (or the seeded code) is ticked explicitly. Cosmetic's
      members show "via Cosmetic" (so rhinoplasty 41800 shows ticked and disabled). Tick Dental, search
      a code outside Cosmetic (for example "bariatric", then 20880) and tick it, save: the summary
      updates and one `anaesthetist.prepaid` entry is written. Untick Cosmetic: its members clear but the
      explicit code stays.
- [ ] Web: the persona block in the nav opens `/web/profile` with the underline. The panels match
      mobile's values; editing contact saves from its own panel; the Identity and bank panels are
      read-only.
- [ ] Web profile GST period set to Two-monthly: Accounts → GST activity now defaults to Two-monthly.
- [ ] Admin → Master data → Anaesthetists: GST period shows labels; GST number, HPI CPN, Bank and
      Prepaid columns filled.
      Edit Dr Souter → Prepaid procedures: tick Plastics and save. Back on the mobile profile, the set
      includes Plastics and the line reads "Last changed by Kirsty W. for you". The audit entry shows
      "for Dr Melanie Souter" and role office.
- [ ] Admin Details tab: change Dr Souter's bank number; an invalid number is refused inline; the audit
      shows masked before and after values only. Change her HPI CPN to `1ABCDE` (refused inline), then to
      another anaesthetist's or a surgeon's HPI CPN (refused as a duplicate), then to a fresh valid one
      (saved, audited "HPI CPN", shown on her mobile and web profile); set it back.
- [ ] Admin → Master data → RVG groups: deleting Cosmetic is refused while Souter ticks it.
- [ ] Add an anaesthetist without bank details and with HPI CPN `12abcd`: it is stored as `12ABCD`; the
      table shows "Not on file" for the bank.
- [ ] Billing monitor Payables run: the destinations list shows each anaesthetist and masked account;
      run it; the paid amounts are as before and the Xero simulator's ACCPAY pane shows "Paid to" on the
      disbursement. Edit that anaesthetist's bank afterwards: the past disbursement still shows the old
      masked number.
- [ ] S3 and S4 figures, and the S4 Beat 1 prepayment beat on Riley and Nair, behave exactly as before.
- [ ] PWA build (`npm run build:pwa`, then preview): More shows the Profile and Prepaid cards above the
      demo panel, and the prepaid sheet saves.
- [ ] Teal is the only action colour; crimson only on the avatar and nav underline; "via" and "Not on
      file" pills are neutral or warning tone; GST number, HPI CPN and account numbers are mono.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.

## Demo guide updates

No scripted figure changes. Patch these in the same session, and the matching sections of
`master-demo-guide.html`:

- `01-personas-and-responsibilities.md`: the anaesthetist's core actions gain "Maintain her own profile:
  rate per unit, GST period, GST number, contact details and prepaid procedures". Her permissions: "May
  edit her own profile settings; may not edit bank details, her HPI CPN or other master data". The
  office gains "Maintains any anaesthetist's profile on their behalf, including bank details and the
  HPI CPN". Use "HPI CPN" wherever the guide says "HPI id" or "HPI number" for an anaesthetist.
- `02-workflows-and-handoffs.md`: a short "Profile and prepaid procedures" case (where the set lives,
  who can edit it, that the office's edits are audited on the anaesthetist's behalf, the GST number
  printed on her invoices, bank details shown on the payables run). Leave the Pre-payment case as
  Phases 15a and 20 left it; 27 rewrites it.
- `03-demo-script.md`: an optional "Worth pointing at" before S4 Beat 1: "More → Prepaid procedures:
  Dr Souter has marked the Cosmetic group as prepaid; the rhinoplasty code is in it." Do not change the
  beat itself until 27. If Phase 25 scripted an "edit the unit value after authorise" beat in S5 via
  Master data, add the alternative path through the anaesthetist's own profile.
- `04-presenter-cheat-sheet.md` Permission matrix: the "Edit master data" row stays No for the
  anaesthetist, and a new row "Edit own profile (rate per unit, GST period, GST number, contact,
  prepaid procedures)" reads Yes, own · Yes, on their behalf · No.
- `04-presenter-cheat-sheet.md` section 8 (Pre-payment): one line that each anaesthetist chooses
  prepaid codes and groups on their profile (Phase 27 makes it apply only when the patient pays). The
  payables and disbursement notes: payouts show the destination account (display only).
- `README.md` feature table: a row for "Anaesthetist profile and prepaid procedures".
- Control Panel scenario text: none expected. Grep `src/apps/demo` for "unit value", "master data" and
  "HPI" wording to confirm.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS entry,
run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**. Fan out about three
independent Opus review subagents, one each for **quality**, **bugs/correctness** and **plan
adherence**. This session then independently verifies every finding against the catalogue files, this
doc and the code, fixes the confirmed ones (with a test for each bug), re-greens, and records the pass.
Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **Permissions hold in the store, not just the UI.** An anaesthetist actor cannot write another
  anaesthetist's record, nor bank, HPI CPN or active on their own (the GST number they can); integration and system actors cannot
  write at all; the office can write everything. Every write goes through `mutate()`; `onBehalfOf` is set
  exactly when the office writes and never otherwise.
- **One unit value.** No second copy of the rate exists; the profile, the fee path, 27's estimate and
  25's lock all read `Anaesthetist.unitValue`. An edit after authorise leaves the lock, Review and the
  invoice unchanged. The rate note in the UI is true for the code as built.
- **Nothing derived yet.** No Booking, banner, gate or review flag reads `prepaidSettings` in this phase;
  `bookingRequiresPrepayment` and 20's interim flag are untouched. The seed coherence test would catch 27
  flagging an unintended seeded Booking.
- **The tick list is correct.** Group expansion is many-to-many and follows re-tags; explicit codes
  survive unticking a group; the stored form is canonical, so an unchanged save writes no audit; unknown
  ids are refused; group and AA-code deletes are refused while referenced.
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
- **No gold-plating.** No prepayment derivation, estimator, GST schedule rework, payout history, bank
  verification, payout hold, HPI CPN lookup, start date or notification. Plus the usual: teal-only actions, crimson identity only, no dashes in
  copy, one `PERSIST_VERSION` bump.

## PROGRESS.md updates

- Status row for catch-up Phase 26, and a phase entry: the drift-check result (including whether 25 had
  landed), what was built, the review pass (findings confirmed and fixed, anything not treated as a
  defect and why), tests added, and the `PERSIST_VERSION` bump.
- **Decisions log:**
  1. The anaesthetist edits their own rate per unit, GST period, GST number, contact details and
     prepaid set; bank details, HPI CPN, registration and active stay office-only. This supersedes the July reading that the
     anaesthetist has no access to master data (`editAnaesthetist` office-only since Phase 07, the
     `RolesInfo` copy and the persona permissions in the demo guide).
  2. Office edits to an anaesthetist's profile carry `onBehalfOf` on the audit entry.
  3. The prepaid set stores explicit codes and group references separately; groups expand at read
     time, so a re-tag in the RVG master flows through, and explicit codes survive unticking a group.
  4. Bank details are held on the Anaesthetist (OQ-14), display-only (DM-33): shown masked outside the
     office editor and in the audit, snapshotted on each disbursement, and never used to hold or route
     a payout.
  5. The web profile is reached from the persona block, keeping the design's four tabs.
  6. The anaesthetist's HPI CPN (OQ-52: one identifier) is office-edited after creation, normalised and
     format-checked with Phase 17's helpers, and unique across surgeons and anaesthetists.
- **Handoff list:**
  - 27 derives the Booking requirement with `expandPrepaidCodes` and `prepaidReasonFor` for a patient
    billable party (US-06.2.1, OQ-73), retires 20's interim flag, gives Riley's Booking a Cosmetic code
    and turns the seed coherence test's exception into a pass.
  - 36 and 37 carry the disbursement destination into the ledger and the Xero-detected payout.
  - 28 adds the start date to the same record and to the Admin Details tab (US-01.1.3).
  - 38 builds the aligned GST schedule on the profile's GST period.
  - 40a moves the profile screens' and the Admin editor's HPI CPN onto its shared `HPI_CPN_LABEL` and
    `formatHpiCpn`; it adds no lookup or check character (the shape check stays 17's).
  - 42 loads anaesthetist bank details and prepaid sets through the spreadsheet loader, if AA wants it.
