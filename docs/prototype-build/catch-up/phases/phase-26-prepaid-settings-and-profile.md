# Phase 26 · Anaesthetist profile and bank details

**Requirements covered:**
[FT-12.1](../../../../requirements-board/requirements/stories/FT-12.1.md) Profile settings (the grouping: the dollar value per unit, contact details and bank account, nothing else; Proposed) ·
[US-12.1.4](../../../../requirements-board/requirements/stories/US-12.1.4.md) Anaesthetist identity, contact and bank details (Verify; Partial: one **HPI CPN**, OQ-52; bank details held in the system, OQ-14) ·
[RV-02](../analysis/reverse-check.md) the GST period is a per-anaesthetist setting and a selector on the GST report (remove it everywhere).
**Left this phase (2026-10-20 update, D64):** prepaid settings on the profile are Retired. FT-06.1, US-06.1.1, US-06.1.2, US-12.1.3 and
[DM-19](../analysis/domain-model-delta.md#dm-19) are gone: prepaid is a setting on the Contract (18 adds it, 27 starts prepayment from it), and
there is no prepaid tick list, own-price-list view, "on their behalf" editing or `prepaidSettings` here. US-12.1.2 (GST period) is Retired too.
**US-12.1.1** (dollar value per unit) is Phase 25's cover (the unit value in the pricing snapshot); this phase builds the
anaesthetist-facing setting 25 points at. DM-32's anaesthetist half (bank details) is built here (DM-33 was merged into it; Phase 17 built the rest).
Context only, closed elsewhere:
[US-12.2.2](../../../../requirements-board/requirements/stories/US-12.2.2.md) GST report (monthly; Phase 38 rebuilds it) ·
[US-08.4.5](../../../../requirements-board/requirements/stories/US-08.4.5.md) GST number on the invoice (Phase 22's `gstNumber` stays office-held in Master data; not on the profile) ·
[US-01.1.3](../../../../requirements-board/requirements/stories/US-01.1.3.md) start date (Phase 28, built) ·
[US-09.1.1](../../../../requirements-board/requirements/stories/US-09.1.1.md) payables run (Phases 36, 37 and 39a carry the destination further).
**Decisions and questions.** Built as answered, no provisional label:
[OQ-14](../../../../requirements-board/requirements/questions/OQ-14.md) (bank details in the system, on the profile, display-only here),
[OQ-52](../../../../requirements-board/requirements/questions/OQ-52.md) (one identifier, the HPI CPN) and **D64** (above).
**Depends on:** Phase 17 only (built: `normaliseHpiCpn`, `isPlausibleHpiCpn`, the duplicate check, the Admin anaesthetist record page, the
office-only privacy boundary). Needs nothing unbuilt, so it can run any time; it must run before Phase 38 (whose monthly GST report it leaves
in calendar months) and before 40a. Where 22 or 25 have not landed, see "Before you start" step 4.
**Estimated:** 1 session (11 work items).

## Goal

Give each anaesthetist a profile they can see, hold bank details in the system for the payables run, and take the GST period out of the
prototype.

- **The profile (FT-12.1, US-12.1.4).** Contact details, registration number, HPI CPN, the bank account and the dollar value per unit, the
  only billing setting. The anaesthetist sees it on the mobile More tab and on a web Profile page; they edit only their own rate per unit
  (US-12.1.1 "each anaesthetist sets their own"). Contact details, HPI CPN and bank account are held by the office (US-12.1.4: "Admins hold
  each anaesthetist's master record"), shown read-only to the anaesthetist, the bank account masked.
- **Bank account held in the system (OQ-14), display-only.** The office enters and edits it on the anaesthetist's record. The payables run
  shows each payout's destination account and snapshots it on the disbursement. No payment is held or routed by it.
- **No GST period anywhere (RV-02, US-12.1.2 Retired).** Remove `gstPeriod` from the type, the seed (Whitaker's six-monthly), the Admin
  record page, add and edit forms, the Master data column, the audit label and the web GST report's period switch. The report shows calendar
  months until Phase 38 rebuilds it.
- **No prepaid settings (D64).** Nothing about prepayment on the profile. Phase 20's interim Booking `prepaymentRequired` flag is untouched.
- **One unit value.** The profile edits the same `Anaesthetist.unitValue` that fees read and that Phase 25's snapshot copies at AUTHORISED.
- **Privacy.** Anaesthetists never see their priority tier or pairing preferences (Phase 17's boundary): the profile reads `masters` only,
  never the office-only slice.

No S1 to S5 figure moves.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `d4db277` (rename-aware; never a plain `git diff` of the catalogue folder):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff FT-12.1,US-12.1.1,US-12.1.2,US-12.1.4,US-12.2.2,US-08.4.5,FT-06.1,OQ-14,OQ-52
   ```

   If an item changed after `d4db277`, re-read it whole and adjust the work items. If one is now Retired or Future, drop its work and say so in
   the PROGRESS entry. To see why an item says what it says, run `npm --prefix requirements-board run source -- --item <ID> --text` (Node 22.18+).
2. Confirm the readings:

| Item | Build (the reading at `d4db277`) | If it has changed |
|---|---|---|
| **US-12.1.4** (Verify): bank details in the system, on the profile; one HPI CPN | Office-held `bankAccount` (name and number), display-only; masked read-only on the anaesthetist's profile; payables run shows and snapshots the destination. | Bank details in Xero only: add no bank field, show "Bank account held in Xero" and skip work items 2 and 5. The anaesthetist may edit it: move `bankAccount` into the self-editable set. |
| **US-12.1.1**: "each anaesthetist sets their own" | The anaesthetist edits only their rate on the profile; the office can edit it too. | Office-set only: the profile shows it read-only with "Set by the AA office". |
| **FT-12.1**: unit value, contact, bank only | No GST period, GST number, prepaid or tier on the profile. | If a setting returns, add only that field. |

3. Re-run `grep -rn gstPeriod aa-prototype/src` and list every hit (about 10 non-test files at plan time: `domain/types.ts`, `seed/cast.ts`,
   `billing/fixtures.ts`, `store/mastersActions.ts`, `AccountsScreen.tsx`, `AddAnaesthetistFlow.tsx`, `EditAnaesthetistSheet.tsx`,
   `AnaesthetistRecord.tsx`, `AnaesthetistsView.tsx`, `fieldChrome.ts`, `fieldLabels.ts`, plus fixtures in several tests).
4. Check what has landed. Phase 22: `Anaesthetist.gstNumber` is its field; leave it and its office-only Master data column alone (the
   profile does not show it). Phase 25: if its snapshot has landed, the rate note reads "A new rate applies to Bookings on Lists not yet
   authorised. Authorised Lists keep their locked rate." and the lock regression test runs; if not, the note reads "A new rate applies to
   Bookings not yet invoiced" and the test is `it.todo` with a handoff note for 25.
5. Record the current `PERSIST_VERSION` (25 at plan time; later phases will have bumped it) and note whether Phase 28's start date is on the
   record page and add form (it is, built); leave it as is.

## Reference

**Design (convention 17).** No mockup has a More, profile or settings screen. Extend the design's own patterns. Mobile: `Mobile App.dc.html`
(card surfaces, row anatomy with label left and mono value right, bottom sheets, sticky teal primary action) and the existing `MoreScreen`
persona card; the rate edits in a bottom sheet, never a desktop form. Web: `Web Dashboard.dc.html` (top nav, `Panel` anatomy). Admin: the
record page, Master data table and `EditAnaesthetistSheet` (`Admin Review.dc.html` table anatomy). Tokens from `Design Language.dc.html`.
Teal is the only action colour; crimson stays on the avatar and nav underline. "Not on file" is a warning-tone pill. Account numbers, the
HPI CPN, registration and money are Spline Sans Mono, tabular-nums.

**Catalogue and analysis.** The items above; `domain-model.md` (the anaesthetist profile, the HPI CPN row); notes 2026-10-16 (Greg, #22:
"all they have is a unit rate"). `../analysis/reverse-check.md` RV-02; `../analysis/prototype-map-admin.md` section 9;
`prototype-map-store-seed.md`; `prototype-map-apps-mobile-web.md` (More tab, Accounts GST tab).

**Code entry points (plan time; later phases will have moved lines).** Types `src/domain/types.ts` (`Anaesthetist` about 207,
`GstPeriod` 237, `Disbursement` 1361). Store `src/store/mastersActions.ts` (`editAnaesthetist` 282, office-only today; `AnaesthetistPatch`,
`NewAnaesthetistFields`, `addAnaesthetist`), `src/store/payablesActions.ts` (`payablesDue` 36, `disbursePayables` 56),
`src/store/selectors.ts`. Seed `src/domain/seed/cast.ts` (50 to 63), `seed.test.ts`. Mobile `src/apps/mobile/screens/MoreScreen.tsx`,
`routes.tsx`, `outlet.ts`; PWA `src/pwa/PwaDemoPanel.tsx` (the `moreExtra` slot), `PwaDemoActions.tsx`. Web `src/router.tsx`,
`apps/web/WebApp.tsx`, `components/WebNav.tsx`, `screens/AccountsScreen.tsx` (GST tab 385 to 424). Admin `screens/AnaesthetistRecord.tsx`,
`screens/masters/AnaesthetistsView.tsx`, `flows/EditAnaesthetistSheet.tsx`, `AddAnaesthetistFlow.tsx`, `flows/fieldChrome.ts` (`GST_OPTIONS`),
`RolesInfo.tsx`, `screens/BillingMonitorScreen.tsx` (Payables run card), `apps/demo/DemoXero.tsx` (ACCPAY pane). Audit copy
`src/shared/audit/fieldLabels.ts`. Tests to extend (under `aa-prototype/src/`): `store/mastersActions.test.ts`,
`store/payablesActions.test.ts`, `domain/seed/seed.test.ts`, `store/persistMigrate.test.ts`, `apps/web/screens/AccountsScreen.test.tsx`;
`pwa/pwaPurity.test.ts` and `apps/officePrivacy.test.ts` stay green. Playwright under `aa-prototype/visual/`.

## Work items

Model, pure helpers, store and seed first, then screens.

1. **Remove the GST period (RV-02, US-12.1.2 Retired).** Delete `gstPeriod` and `GstPeriod` from `types.ts`, the seed cast (all 14, Whitaker's
   six-monthly included), `billing/fixtures.ts`, every test fixture, `AnaesthetistPatch`, `NewAnaesthetistFields` and `addAnaesthetist`;
   delete `GST_OPTIONS`, the Segmented "GST period" in `AddAnaesthetistFlow` and `EditAnaesthetistSheet`, the "GST period" fact on
   `AnaesthetistRecord`, the Master data "GST" column and the `gstPeriod` audit label. `AccountsScreen` GST tab: drop the local
   `GstPeriod` type, the Segmented and the default read; show the calendar month of the demo date (the monthly case of `periodWindow`),
   headed "Month ({from} to {to})". Keep the rest of the report as is (Phase 38 rebuilds it). Update `AccountsScreen.test.tsx`: no period
   switch, the month window. Leave `gstNumber` (Phase 22) alone.
2. **Model and bank helpers.** `Anaesthetist` gains `bankAccount?: BankAccount` with `BankAccount { accountName: string; accountNumber: string }`,
   stored as `BB-bbbb-AAAAAAA-SS(S)`. `Disbursement` gains `destination?: { accountName: string; accountMasked: string } | null`, a snapshot
   taken at run time (`null` when none was on file) so a later bank edit never rewrites a past payout. Reword `Anaesthetist`'s doc comment (it
   names no GST period or prepaid settings). `src/domain/bankAccount.ts` (Vitest): `normaliseNzBankAccount(input)` accepts digits with or
   without dashes or spaces and returns the dashed form or `null` (2-digit bank, 4-digit branch, 7-digit account, 2 or 3-digit suffix);
   `maskBankAccount(n)` returns `BB-bbbb-•••••AA-SS`. No bank modulus check (a named demo simplification in the comment).
3. **Store: who edits what** (`mastersActions.ts`). Widen `editAnaesthetist`: the office edits every field (as today); an anaesthetist actor
   may edit only their own `unitValue` (`actor.anaesthetistId === registrationNumber`, else `notOwnProfile`; any other field is
   `officeOnlyField`, naming it, for example "Bank details are held by the AA office."); any `role: 'system'` actor is refused. Keep
   `invalidUnitValue`, round to cents. `AnaesthetistPatch` and `NewAnaesthetistFields` gain `bankAccount` (a `BankAccount`, or `null` to clear
   on edit), refused when invalid (`invalidBankAccount`) or with an empty account name. Phase 17's HPI CPN normalise, format and duplicate
   checks stay as built (confirm they apply on add and edit). A patch that changes nothing is `ok` with no audit entry. Audit stays
   `anaesthetist.update` with before and after of the changed fields only, the bank number written **masked** in both. Rewrite the doc
   comment: a unit-value change re-prices only Procedures not yet authorised (as built after 25; see step 4). Tests: the permission matrix
   (own, colleague, office, system) per field.
4. **Store: selector.** `profileFor(state, registrationNumber)` in `store/selectors.ts`: the view model both profiles read (unit value,
   contact, registration, HPI CPN as stored, masked bank or `null`). It builds a new object, so screens select the raw record and derive with
   `useMemo` (the `AccountsScreen` pattern), never pass it straight to `useAppStore`. It reads `masters` only, never the `officePrivate` slice.
5. **Payables run shows the destination** (`payablesActions.ts`; US-12.1.4 "used for the payables run"). Display only: amounts and behaviour do
   not change. Resolve each ACCPAY's anaesthetist through the BillingCase already looked up in `disbursePayables` (`caseByAccPay`).
   `payablesDue` widens its input from `Pick<AppState, 'xero'>` to also take what it needs to resolve the anaesthetist, and gains
   `byAnaesthetist: { anaesthetistId, name, count, total, destinationMasked | null }[]` (by surname) and `missingBank: number`; update the
   `useMemo` call in `BillingMonitorScreen.tsx`. A payable whose anaesthetist has no bank account is still disbursed, with `destination: null`.
   Each `Disbursement` stores its `destination` at run time. Tests: snapshot written; a later bank edit leaves it; no-bank anaesthetist
   disbursed with `null` and counted in `missingBank`; grouping; existing amounts and counts unchanged.
6. **Seed and tests** (one `PERSIST_VERSION` bump; nothing from the seeded RNG). Every one of the 14 anaesthetists gets a `bankAccount`: name
   from `nameWithoutTitle`, number built deterministically from the registration number on the non-issued bank code 99 (for example Souter
   `99-0101-0034821-00`), so it is plainly fictional. `seed.test.ts`: every number normalises and is on bank 99; every `hpiId` passes
   `isPlausibleHpiCpn`; no `gstPeriod` remains. `mastersActions.test.ts`: the matrix from item 3, validation, no-op writes, masked audit, the
   unit-value lock test (an edit after authorise leaves the pricing snapshot, Review and invoice unchanged while an ACTIVE List's Booking
   re-prices; `it.todo` if 25 has not landed). `persistMigrate.test.ts` and the `SEED_MARKERS` inspector entries follow the bump.
7. **Audit copy** (`src/shared/audit/fieldLabels.ts`): add `bankAccount` "Bank account"; remove `gstPeriod`; `phone` and `email` if missing;
   leave `hpiId` ("HPI CPN") as it is. Test the masked narrative in `auditNarrative.test.ts`.
8. **Mobile profile** (`MoreScreen.tsx`, `routes.tsx`; US-12.1.4, US-12.1.1). Shared `ProfileRow` (label, mono value, optional lock glyph) in
   `src/shared/profile/`, exported through `src/shared/index.ts` (imports nothing from `apps/`, so `pwaPurity` holds). `MobileMoreRoute`
   passes `actor` and `anaesthetistId`. Order on More: persona card, **Profile** card, the Demo prototype card, then `extra` (the PWA panel,
   unchanged). Rows: "Rate per unit" `$26.50` → `EditRateSheet` (bottom sheet: mono dollar field with a decimal keypad, the rate note from
   step 4 of the drift check, sticky teal Save, a refusal rendered verbatim); "Phone" and "Email" read-only; "Registration" and "HPI CPN"
   (captioned "Your unique identifier on the Health Provider Index.") read-only with a lock glyph; "Bank account" `99-0101-•••••21-00`, lock
   glyph, caption "Held by the AA office. Ask the office to change it." ("Not on file" if absent). The header eyebrow stays "Settings".
   `data-shot` hooks: `mobile-profile`, `mobile-rate-sheet`. Confirm no demo trigger is registered for the More route and the new card does
   not collide with `PwaDemoActions` or `PwaDemoPanel` (`moreExtra`).
9. **Web profile** (`apps/web/screens/ProfileScreen.tsx`, `routes.tsx`, `router.tsx`, `WebApp.tsx`, `components/WebNav.tsx`). Route
   `/web/profile`. The persona name and avatar in `WebNav` becomes the button to it, crimson underline when active; the four tabs are
   unchanged. Desktop panels: **Billing** (rate field with `$` prefix and "per RVG unit", the same rate note, its own teal "Save changes"
   enabled only when dirty), **Contact** (read-only), **Identity** (registration, HPI CPN, read-only) and **Bank account** (masked,
   read-only, same caption). `data-shot` hooks: `web-profile`, `web-billing-panel`.
10. **Admin** (`apps/admin/`). `AnaesthetistsView`: columns Name, Reg, Unit $ (keep it third, a recipe highlights it), HPI CPN, Bank (masked, or
    warning-tone "Not on file"), Phone, Email, Active, the row action into 17's record page and Phase 22's GST number column if it landed;
    drop the GST period column. `AnaesthetistRecord.tsx`: a **Profile** card (unit value, phone, email, HPI CPN, bank account masked,
    active) whose "Edit details" opens `EditAnaesthetistSheet`, beside 17's tier and pairing sections (unchanged); the stale doc comment about
    a later phase adding bank, GST number and prepaid settings is replaced. `EditAnaesthetistSheet` (and `AddAnaesthetistFlow`): unit value,
    phone, email, HPI CPN (editable, 17's inline checks), bank account name and number with inline validation, active; the add flow's bank
    fields optional, HPI labelled "HPI CPN (optional)"; the GST period field gone. `BillingMonitorScreen` Payables run card: under the
    summary, a destinations list from `byAnaesthetist` ("Dr Souter · 2 payables · $1,234.00 to 99-0101-•••••21-00"), a warning-tone "No bank
    account on file" for an anaesthetist without one, and a warning-tone summary line when `missingBank > 0`. `DemoXero.tsx` ACCPAY pane:
    "Paid to <name> · <masked>" from each snapshot ("no bank account on file" when `null`). `RolesInfo.tsx`: anaesthetist copy "sees their
    own profile and sets their rate per unit"; office copy "maintains any anaesthetist's profile, including bank details and the HPI CPN".
11. **Playwright shots.** A new `visual/profile-phase26.spec.ts`: mobile More with the Profile card and the rate sheet, the web profile page,
    the Admin record page's Profile card and the Payables run destinations. Update existing shots the table columns, the GST tab or the
    More screen changed, and `routing.spec.ts` for `/web/profile`. Keep the PWA device spec green.

## Demo triggers

None needed. Seeded bank details show on the Admin record, on the Payables run and on Dr Souter's own profile (More, and `/web/profile`);
the payables run is an existing office button. Nothing here is automatic, scheduled or external, so no trigger-registry entry is added and
the Control Panel is untouched.

PWA: the profile is part of the mobile More tab, so the installed PWA has it natively; no mobile beat waits on the office, so no stand-in is
needed.

## Out of scope

- Prepaid settings, tick lists, own price list views and "on their behalf" editing (Retired, D64); prepayment from the Contract (Phase 27).
- The GST period and any aligned GST schedule (Retired); the monthly GST report rebuild (Phase 38); the GST number on the profile (office-held,
  Phase 22).
- Anaesthetist editing of contact details, HPI CPN or bank details; a bank modulus check, bank verification, a payout hold or reroute.
- Payout detection and the ledger (Phases 36 and 37); an anaesthetist-facing payout history; remittance advice (39a).
- The pricing snapshot of the unit value (Phase 25); the start date (Phase 28); the tier and pairings (Phase 17, office only).
- HPI CPN register lookup or check character (40a only unifies the label and format); login (43a); notifications to the anaesthetist.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence (ROADMAP.md "Owner review: agents test themselves").

- [ ] Mobile More: the Profile card shows $26.50, phone, email, registration 34821, HPI CPN 10SOUM and a masked bank number with the
      office caption, all read-only except the rate. No "HPI id" or "HPI number" anywhere. No en or em dash anywhere.
- [ ] Change the rate to 27.00 in the bottom sheet and save: the row updates; the audit viewer shows `anaesthetist.update` by Dr Souter
      (anaesthetist), 26.50 to 27.00. An ACTIVE List's Booking re-prices (office view); an AUTHORISED List's figures and invoice do not
      (when 25 has landed). Set it back. A zero or text rate is refused with the sentence in the sheet.
- [ ] No GST period anywhere: Admin Master data has no GST column, the record page and Add and Edit forms have no field, the audit labels
      list none; web Accounts, GST tab shows the calendar month with no period switch.
- [ ] Web: the persona block opens `/web/profile` with the underline; the Billing panel saves a rate from its own panel; Contact, Identity
      and Bank account panels are read-only.
- [ ] Admin Master data, Anaesthetists: Unit $ third, HPI CPN and Bank columns filled. Dr Souter's record page shows the Profile card beside
      17's tier and pairings. Edit details: change her bank number (an invalid one is refused inline; the audit shows masked before and after
      only), then her HPI CPN to `1ABCDE` (refused inline), to another practitioner's (refused as a duplicate), to a fresh valid one (saved,
      audited "HPI CPN", shown on her mobile and web profile); set both back.
- [ ] Add an anaesthetist without bank details and with HPI CPN `12abcd`: stored as `12ABCD`; the table shows "Not on file".
- [ ] Billing monitor Payables run: the destinations list shows each anaesthetist and masked account; run it; paid amounts are as before and
      the Xero simulator's ACCPAY pane shows "Paid to" on the disbursement. Edit that anaesthetist's bank afterwards: the past disbursement
      keeps the old masked number. The added no-bank anaesthetist shows "No bank account on file" and is still paid.
- [ ] Privacy: nothing on the mobile, web or PWA profile names a tier or pairing preference; `officePrivacy.test.ts` is green.
- [ ] As Dr Souter there is no way to edit contact, HPI CPN or bank anywhere; the store refuses each (the test proves it).
- [ ] S3 and S4 figures behave exactly as before (the interim prepayment flag is untouched).
- [ ] PWA build (`npm run build:pwa`, then preview): More shows the Profile card above the demo panel and the rate sheet saves.
- [ ] Teal is the only action colour; crimson only on the avatar and nav underline; "Not on file" is neutral or warning tone; account
      numbers, HPI CPN and registration are mono.
- [ ] Catalogue screenshots: recipes updated as the section below says, a full `npm run capture` ends with no failed recipe, the new shots
      checked by eye, `npm run verify:board` green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` green.

## Demo guide updates

No scripted figure changes. Patch in the same session, and the matching sections of `master-demo-guide.html`:

- `01-personas-and-responsibilities.md`: the anaesthetist sees their own profile and sets their rate per unit; may not edit contact details,
  HPI CPN, bank details or other master data. The office holds each anaesthetist's profile, bank details and HPI CPN. Use "HPI CPN" wherever
  the guide says "HPI id" or "HPI number". Remove any mention of a GST period or prepaid settings on the profile.
- `02-workflows-and-handoffs.md`: a short "Profile and bank details" case (what the profile holds, who edits what, bank details display-only
  and shown on the payables run). Leave the Pre-payment case as 15a and 20 left it; 27 rewrites it.
- `04-presenter-cheat-sheet.md`: Permission matrix: a new row "Edit own rate per unit" reading Yes, own · Yes · No (anaesthetist, office,
  integration); the "Edit master data" row stays No for the anaesthetist. The payables and disbursement notes: payouts show the destination account (display only);
  the GST report is monthly.
- `README.md` feature table: a row for "Anaesthetist profile and bank details".
- Grep `src/apps/demo` and the guide for "GST period", "unit value", "master data" and "HPI" wording (none expected for the Control Panel).

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), after the review pass and before the PROGRESS entry.
Re-run `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 26` first.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-12.1.4](../../../../requirements-board/requirements/stories/US-12.1.4.md) Identity, contact and bank details | captured · admin-anaesthetist-record[edit,add] | Stays captured. Re-shoot `edit` (phone, email, HPI CPN and bank fields) and `add` (bank optional; the start date is 28's), and add state `record` on 17's record page (Profile card with HPI CPN and masked bank, highlighted) plus the mobile `mobile-profile` shot at `/mobile/more` (identity and bank rows, lock glyph, bank masked). Captions: "Editing an anaesthetist's contact, HPI CPN and bank details", "Adding an anaesthetist with registration number, contact, HPI CPN and bank account", "Anaesthetist identity, contact and bank details; one HPI CPN". |
| [US-12.1.1](../../../../requirements-board/requirements/stories/US-12.1.1.md) Dollar value per unit | partial · admin-unit-value[list,edit] ("only by the office") | captured. Keep `admin-unit-value` (Unit $ still the third column); add mobile `mobile-profile` states `profile` (Rate per unit row highlighted) and `rate-sheet`, and web `web-profile` (Billing panel highlighted). Caption "Anaesthetist sets their own dollar value per unit". Drop the partial reason. Phase 25 owns the lock states. |
| [FT-12.1](../../../../requirements-board/requirements/stories/FT-12.1.md) Profile settings | feature, no recipe | no change here. |

**Recipes this phase touches.**
- `US-06.1.1`, `US-06.1.2`, `US-12.1.3` and `US-12.1.2` (`gst-period-setting`, `gst-period-view`): Retired, so the recipes go absent with the
  reason "Retired" (replace any caption or absent reason that describes the old model); delete their shots.
- `US-12.2.2`: its caption "for the GST period" is Phase 38's; only confirm the GST tab still shoots without the period switch.
- `US-01.1.3` (`Add anaesthetist` flow): the GST period field is gone and two optional bank fields added; re-shoot and check the caption.
- `US-08.3.4`, `US-09.2.4`, `US-10.1.2`, `US-10.2.1` (`[data-shot=billing-payables-run]`): the card gains a destinations list; look at the
  shots and caption the destination account where the story is about the payout.
- 17's record-page recipes (US-13.6.3, US-01.3.6): the page gains a Profile card; check their highlights stay on the tier and pairing sections.
- Every recipe that shoots `/admin/masters` with `table th:nth-child(3)` stays valid only while Unit $ stays the third column. The `--dry`
  run is the check for the rest.

**ATLAS.md.** Routes: add `/web/profile`. Hooks: `mobile-profile`, `mobile-rate-sheet`, `web-profile`, `web-billing-panel`. Seed data: the
bank accounts; no GST period.

## Adversarial review (after build)

After the checklist and the four commands are green, run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**: about
three independent Opus review subagents (quality, bugs/correctness, plan adherence); verify each finding, fix the confirmed ones with a test,
re-green. Do not re-raise anything settled in the Decisions log.

**Steer reviewers at:**

- **Permissions hold in the store.** An anaesthetist actor writes only their own `unitValue`; never another record, nor contact, HPI CPN,
  bank or active; system actors write nothing; the office writes everything; every write through `mutate()`.
- **GST period is gone, completely.** No `gstPeriod`, `GstPeriod`, `GST_OPTIONS`, Master data column, form field, audit label, report period
  switch or demo-guide mention survives; `gstNumber` (Phase 22) is untouched and not on the profile; the GST report still renders as a month.
- **No prepaid residue.** No `prepaidSettings`, tick list, own-price-list view or prepaid copy on any profile; 20's interim flag untouched.
- **Bank data.** Masked on the anaesthetist's screens, in the audit and in the payables list; full only in the office's edit field. The
  disbursement snapshot does not move when the bank changes. Seeded numbers are on bank 99, deterministic, no RNG draw. Display-only: no
  payout held, rerouted or re-amounted by a bank account, present or missing.
- **One unit value.** No second copy of the rate; the profile, the fee path and 25's snapshot read `Anaesthetist.unitValue`. The rate note is
  true for the code as built (lock or fallback).
- **One identifier.** `hpiId` labelled "HPI CPN" on every surface and in the audit, checked by 17's helpers, office-only.
- **Privacy.** The profile never reads the `officePrivate` slice or a tier or pairing audit entry; `officePrivacy.test.ts` green.
- **Mobile is mobile.** Bottom sheet with sticky Save; the PWA panel still renders below; `pwaPurity` green; the four web nav tabs unchanged.
- **No gold-plating.** Teal-only actions, crimson identity only, no dashes in copy, one `PERSIST_VERSION` bump.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry): readings taken rather than asked: the anaesthetist edits only their own rate per unit
  (US-12.1.1) while contact details, HPI CPN and bank stay office-held (US-12.1.4, "Admins hold"); the GST number stays off the profile
  (office-held, Phase 22); the calendar-month GST tab until 38; the masked bank number shown to the anaesthetist; the Payables run
  destination (display only); and the screens worth a look, each with route and persona.
- Status row and phase entry: the drift-check result (including whether 22 and 25 had landed), what was built, the review pass, tests added,
  the `PERSIST_VERSION` bump, DM-32's anaesthetist half as built, and the catalogue screenshots result (recipes changed, REPORT.md counts
  before and after).
- **Decisions log:** (1) The profile holds the unit value, contact and bank only; no GST period, GST number or prepaid settings (D64, US-12.1.2
  Retired), superseding the July GST period reading. (2) The anaesthetist edits only their own rate; the office holds the rest, superseding
  the July reading that the anaesthetist has no access to master data. (3) Bank details are held on the Anaesthetist (OQ-14), display-only:
  masked outside the office editor and in the audit, snapshotted on each disbursement, never used to hold or route a payout. (4) The web
  profile is reached from the persona block, keeping the design's four tabs.
- **Handoff list:** 36 and 37 carry the disbursement destination into the ledger and the Xero-detected payout; 39a's remittance advice names
  it; 38 builds the monthly GST report from the calendar-month tab left here; 40a moves the profile screens' HPI CPN onto its shared label
  and formatter; 42 loads bank details through the spreadsheet loader if AA wants it; 25 reads the unit value the profile edits.
