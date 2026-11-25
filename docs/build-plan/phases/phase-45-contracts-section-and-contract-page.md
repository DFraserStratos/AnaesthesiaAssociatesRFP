# Phase 45 · The Contracts section and the Contract page

**Requirements covered:**
[US-04.1.7](../../../requirements-board/requirements/stories/US-04.1.7.md) A page for each Contract (new at `5f87781`, status 3 Verify, graded **Partial**, size L: everything exists, but in one side panel with one Save, no route, no per-card save, no read-only Party billing block and no list of the Procedures on it),
[US-04.2.15](../../../requirements-board/requirements/stories/US-04.2.15.md) Price ranges on a fixed price (changed, status 3, **Partial**, size M: the rules are right; the table is oldest first, with no To, Change or Procedures column and no fold),
[US-04.1.2](../../../requirements-board/requirements/stories/US-04.1.2.md) **only its Disable confirmed criterion** and [US-04.1.3](../../../requirements-board/requirements/stories/US-04.1.3.md) **only its per-card half** (one audited change per card). Their units sit on 47 and 49 (D96).
Model delta: [DM-04](../analysis/domain-model-delta.md#dm-04--disabling-is-confirmed-and-lists-the-procedures-first) Disabling is confirmed and lists the Procedures first (S): the confirm and the list from today. Its replaced case (from the change date) is 49's.
**Open, built to its default:** [OQ-144](../../../requirements-board/requirements/questions/OQ-144.md) (D90: no future-dated disable; Disable acts at once, after the confirm).

**Depends on:** none in this plan. Built (archived catch-up): 18 and 18a (`ContractPanel`, `contractRefusal`, `destinationOf`, system Contracts), 19a (price ranges and their store actions), 24 (`demo-backdated-range`), 25 (`ContractHistory`, `lockedAgainstContract`), 25a (`stillOnContract`, `keptPriceOnContract`, `ContractChangeNotice`), 39b (`ContractEventFees`), U6 (`Card`, `DefRow`, `TableShell`), and the Admin page frame (`AdminPage`, `PageBody`, `ProfilePage`; commits `ed60129e`, `d4ba5358`).

**Estimated:** 2 sessions. **Checkpoint** after Work item 6: the section, routes, redirects and side nav; the list moved; the page shell with read-only cards, tabs and rail; links and triggers re-pointed; editing still through the old panel opened from the page. Session 2: items 7 to 13.

## Goal

Contracts leaves Master data for its own section of the Admin app, and every Contract gets a page of its own (D92).

- **Section.** A **Contracts** side-nav entry between Ledger and Master data. `/admin/contracts` is the list on `AdminPage fit` under a `LineTabs` strip: Contracts is live; Parties and Funding tags link to their Master data views until 48. The list keeps its holder headings, search, status, holder and funding-tag filters until 47. The old `/admin/masters?view=contracts` links, with `&contract=` or `&holder=`, redirect (D93); in-app links go to the new routes directly.
- **The Contract page**, `/admin/contracts/:contractId` (the Contract **id**, never the AA code, which is editable). It sits on `ProfilePage` fluid with the 412px rail. Header: back link, name, AA code, status, then Disable or Make active. Tabs: Overview, Bookings, Event fees, History.
- **Overview cards**, each edited and saved on its own as one `editContract` patch and one audited change, refused on the card with the rule's reason:
  - **price:** the ranges table, or the rate or discount;
  - **where it is offered;**
  - **who it bills**, with the holder Party's billing name and delivery read-only and a link to change them on the Party;
  - **invoice and codes;**
  - **what was fixed at creation**, read-only.
- **Price ranges table.** Newest first, with From, To worked out, Price, Change on the range before and Procedures priced. The current and future ranges always show; ended ranges fold after three. A range is added or corrected as a row.
- **Rail.** "On this Contract" lists the upcoming not-yet-billed Procedures, and the authorised ones at their locked price.
- **Disable asks first.** It lists the Procedures from today and moves nothing. Make active undoes it.
- **System Contracts** (No contract · RVG and the backstops) have the same page. Only their name, AA code and invoice description can change, and they have no Disable.
- **The side panel's edit path is retired.** `/admin/contracts/new` still opens the old `ContractPanel` in create mode until 46.

## Before you start

1. **Drift check** against the plan baseline `5f87781`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-04.1.7,US-04.2.15,US-04.1.2,US-04.1.3,OQ-144
   ```

   Re-read anything changed after `5f87781`. **Stop and tell the user** in any of these cases:
   - OQ-144 is answered with a future-dated disable. That puts a date on a Contract, against US-04.1.2's No dates criterion, and reshapes the dialog.
   - US-04.1.7 or US-04.2.15 is Retired or Future.
   - A card appears that saves several settings across cards at once, or adding one range to many Contracts comes back (D95).

   A changed card list or column set is not a stop: build the catalogue's.
2. **No phase to confirm.** This is the plan's first phase. Check `docs/build-plan/PROGRESS.md` has no 45 row, or resume from its checkpoint. From the archive (`docs/archive/prototype-build/PROGRESS.md`, grep the headings "Catch-up Phase 18", "18a", "19a", "24", "25", "25a", "U6") note:
   - 18a: the system-Contract notice wording;
   - 19a: `ContractPriceRanges`' refusal handling;
   - 24: the trigger's kept-price result line;
   - 25: what `ContractHistory` shows;
   - 25a: `StillOnNotice`, `NOTHING_MOVES`, D79 and D81;
   - U6: `Card` padding and the profile grid.
3. **Open, built to default, no label:** OQ-144 (D90). Disable acts at once once confirmed; no date on a Contract. The dialog's start date comes from one function (Work item 10), so 49 can widen it to the change date.
4. **Built defaults, logged on the owner's review list:**
   - "Procedures priced" (Work item 8's definition).
   - "On this Contract" counts every not-yet-authorised Procedure on the Contract, a past List still awaiting review included, then the authorised ones.
   - The tab is kept in `?tab=`.
   - The Change column shows the percentage on the range before ("First" on the oldest).
   - "Open the Party" and the Parties and Funding tags tabs go to Master data until 48.
   - The confirm's primary is `danger`.
   - Several cards may be in edit at once, each saving alone.
   - No unsaved-changes prompt on leaving the page.

### Reads beyond the run-build-phase standard list

- **Design.** The layout reference is `docs/explorations/contracts-section.html` (a design page, not a catalogue artifact):
  - **#map**: the section, its tabs and routes, the record keyed by id;
  - **#catalogue**: the list frame only (its grouping and index are 47's);
  - **#record**: the page: header, tabs with counts, the ranges table and fold, the cards, the "On this Contract" rail. Its "a page at its AA code" is overridden by D92;
  - **#updating**: a card in edit with its Cancel and Save footer, an added range row, and "Disable: who still has it, then confirm".

  Also read `docs/admin-layout-audit.md` "The page frame (one component, three modes)" (fit list, fluid record, 412px rail), [Admin Review](../../design/Admin%20Review.dc.html) (record cards, table rows, sheet footer alignment: the pattern the Card footer variant matches) and [Admin Day](../../design/Admin%20Day.dc.html) (the dark side nav).
- **ROADMAP.md:**
  - D90 (OQ-144 open, Disable acts at once);
  - D92 (the section's shape, the id in the URL);
  - D93 (redirects that stay after 49; in-app links direct);
  - D95 (no bulk range change, no desk page);
  - D96 (this phase builds Disable confirmed and the per-card audit);
  - the sequencing rules "45 first" and "The screenshots and the guide wait for the sweep".
- **GAP-ANALYSIS.md:**
  - the EP-04 table's US-04.1.7, US-04.2.15 and US-04.1.3 rows, and `epics/EP-04.md` `#us-04.1.7` and `#us-04.2.15` (the missing lists and evidence lines);
  - the Structural changes row DM-04, and [domain-model-delta.md](../analysis/domain-model-delta.md) `## DM-04`.
- **Catalogue:**
  - US-04.1.7 and US-04.2.15 in full;
  - US-04.1.2's Disable paragraph and its Disable confirmed criterion;
  - US-04.1.3's first paragraph;
  - OQ-144 (what hangs on it);
  - `domain-model.md` `### Contract` (the holder is fixed once created);
  - the note `notes/2026-11-25-donald-contracts-section.md` decisions 2, 4 and 6;
  - US-04.3.3 and US-04.3.9 for what a system Contract is.
- **docs/DECISIONS.md:**
  - "Buttons" (`variant="danger"` used once, Disable a neutral secondary). The header's Disable stays secondary. The confirm's danger primary is a second use: update the ruling in the same commit.
  - "Audit is append-only; a save is one change set" (each card save is one).
  - "Date text has one home" (range dates).
  - "What the anaesthetist sees is one predicate" (the page is office only: add it to `anaesthetistSimplicity.test.tsx`'s office-only modules).
- **docs/BACKLOG.md:**
  - The line beginning "Admin page frame follow-ups": the clause "the catalogue's ProfileChrome row still previews `ProfileHeader`, not `ProfilePage`" closes here (Work item 11). If the moved list's toolbar fits one row at 1280, also drop "the Contracts toolbar wraps to two rows at 1280"; otherwise leave it for 47.
  - The line "Captions tied to open questions, ...": add the who-it-bills card's file beside `ContractEditSheet.tsx` for D23. Do not delete the line.

## Reference

- **Routes and nav:** `src/router.tsx` (the `admin` block; the `intake` and `patients` blocks are the pattern; `RequireEntity`); `src/apps/admin/AdminApp.tsx` (`sectionForPath`, `SECTION_PATH`); `apps/admin/components/SideNav.tsx` (`NavSection`, the items array); `apps/admin/mastersPaths.ts` (`mastersViewPath`); `apps/admin/routes.tsx` (`AdminMastersRoute`; the new route components go here) and `screens/masters/MasterData.tsx`; `shell/RequireEntity.tsx`; `screens/IntakeScreen.tsx` (`AdminPage` + `LineTabs` + `LineTabLink`).
- **Frame:** `apps/admin/components/AdminPage.tsx` (`AdminPage` `fit`/`fluid`, `tabs`, `back`, `PageToolbar`, `PageBody rail`), `components/ProfileChrome.tsx` (`ProfilePage`, `PROFILE_GRID`, `PROFILE_FACTS`), `apps/admin/layout.ts` (`ADMIN_RIGHT_RAIL_WIDTH`).
- **Today's Contract UI, to move or retire:**
  - `screens/masters/ContractsView.tsx` (the `?contract=` panel opening at lines 60 to 70, `setHolder`, the holder `GroupRow`s);
  - `flows/ContractEditSheet.tsx`: `ContractPanel` with its `save`, `toggleStatus`, `stillOnDisabled`, `StillOnNotice`, `systemPatch`, `SYSTEM_EDITABLE`, `ReadOnlyField` and `PREPAID_BILLS_PAYER_HELPER`, and the system and disabled notices;
  - `flows/ContractPriceRanges.tsx`, `flows/ContractHistory.tsx`, `flows/ContractEventFees.tsx`, `flows/ContractChangeNotice.tsx`.
- **Store and domain:**
  - `store/contractActions.ts`: `editContract` audits a partial patch as one `contract.update`, and the rule checks the merged Contract; `disableContract`, `enableContract`, `addPriceRange`, `editPriceRange`, `deletePriceRange`;
  - `store/contractChangeSelectors.ts` (`stillOnContract`, `keptPriceForRange`) and `store/locks.ts` (`lockedAgainstContract`, `LockedAgainst`);
  - `domain/billing/priceRanges.ts` (`sortRanges` ascending, `rangesOf`, `rangeEnd`, `rangeInForce`, `rangeSpanText`, `formatRangeDate`, `formatRangePrice`, `validatePriceRanges`, `editRangeRefusal`, `deleteRangeRefusal`, `parsePriceText`);
  - `domain/billing/contractChanges.ts` (`proceduresStillOnContract`, `StillOnInput`, `keptPriceOnContract`, `keptPriceTitle`, `stillOnTitle`, `NOTHING_MOVES`);
  - `domain/billing/contracts.ts` (`SYSTEM_CONTRACT_EDITABLE_FIELDS`, `CONTRACT_REFUSAL_MESSAGES` incl. `holderBillingDetails`, `contractRefusal`, `billsPayerOnly`, `takesLinks`, `isRvgKind`);
  - `domain/billing/fallbacks.ts` (`destinationOf`, `isOpenPriceFallback`), `domain/billing/contractHistory.ts` (`contractDisabledOn`), `domain/billing/parties.ts` (`Party`: billing name, delivery);
  - `Procedure.enteredPrice`, and the lock snapshot's `procedures[].price` and `typed` (`domain/billing/lock.ts`).
- **Shared UI:** `shared/ui/Card.tsx` (no footer today), `DefRow.tsx` (`DefList`, `DefRow`), `LineTabs`, `Pill`, `Button`, `TextAction`, `AddRowButton`, `Notice`, `FormError`, `EmptyState`, `TextField`, `SelectField`; `shared/surface/ConfirmSheet.tsx` (no variant prop today); `shared/table/` (`TableShell`, `Th`, `Td`, `ClickableRow`); `apps/admin/components/ChipMultiSelect.tsx`.
- **Demo and tests that name the panel or `?view=contracts`:**
  - Code: `shared/demoTriggers/registry.ts` (`demo-backdated-range` near line 1885, `ADMIN_MASTERS`, `SEEDED_SHEETS_BY_VIEW`, `sampleSheetsFor`), `shared/demoTriggers/context.ts` (`adminMasters.view`, `adminContracts.openContractId`), `store/demoBackdatedRange.ts` (`BACKDATED_RANGE_CONTRACT_ID` `CT-MER-FACELIFT`), `apps/demo/demoScenarios.ts` (S5 Beat 4), `screens/masters/LoadResultPanel.tsx` (the `contracts` record path), `screens/masters/PartiesView.tsx` (`showContracts`).
  - Unit tests: `demoScenarios.test.ts` (`ROUTE_PATTERNS`), `demoTriggers.test.ts`, `loadViews.test.tsx`, `appCopy.test.ts` (`MUST_KEEP`, the D23 row), `ContractEditSheet.test.tsx`, `specialtiesTags.test.tsx`, `contractChangeSelectors.test.ts`, `anaesthetistSimplicity.test.tsx`, `shared/booking/EventSheets.test.tsx`.
  - Catalogue: `apps/demo/catalogue/AdminCatalogue.tsx` and `admin/storeExamples.tsx` (`ContractPanelExample`, `ContractPriceRangesExample`), `eventExamples.tsx`.
  - Playwright `visual/`: `contracts-phase19a`, `price-phase24`, `lock-phase25`, `contract-warnings-phase25a`, `split-phase22`, `phase39b-events`, `overlays-u2`, `admin-phase18a`.

## Work items

**Session 1 (to the checkpoint)**

1. **Paths and routes.**
   - New `apps/admin/contractsPaths.ts`, the one home for the section's URLs: `contractsPath(opts?: { holder?: string })`, `contractPath(id, tab?)` and `newContractPath(opts?: { holder?: string })`. 46 to 49 reuse these.
   - In `router.tsx`, a `contracts` block beside `ledger`:
     - index: the list;
     - `new`: the list with today's `ContractPanel` open in create mode, `initialHolderId` from `?holder=`. Closing returns to the list. 46 replaces this;
     - `:contractId`: the page, under `RequireEntity`, so an unknown id falls back to `/admin/contracts`.
   - Do not route `parties` or `tags` yet (48).
2. **Side nav.** Add `'contracts'` to `NavSection` and a "Contracts" item between Ledger and Master data (`SideNav.tsx`). Add a case in `sectionForPath` for `/admin/contracts` and `SECTION_PATH.contracts = '/admin/contracts'` (`AdminApp.tsx`).
3. **Redirects (D93).** In `AdminMastersRoute`, before `MasterData` renders, `?view=contracts` becomes a replace-navigation:
   - with `&contract=` naming a known Contract: `contractPath(id)`;
   - otherwise `contractsPath({ holder })`, with `&holder=` carried while it names a Party (47 maps it to the grouping).

   Keep it as one small helper 48 extends with its cases. Test the three URL forms and an unknown `&contract=`. It stays after 49. Master data's sub-nav "Contracts" entry reaches the section through it. Keep `masterViews.ts`'s `contracts` row: its `seeded` and catalogue row keep `loadViews.test.tsx` and `masterViews.test.ts` green until 48.
4. **The list, moved** (new folder `apps/admin/screens/contracts/`).
   - `ContractsSection.tsx`: `AdminPage mode="fit"` with `tabs`. A `LineTabs` strip of `LineTabLink`s, as `IntakeScreen.tsx` builds it: Contracts (`/admin/contracts`), Parties (`mastersViewPath('parties')`) and Funding tags (`mastersViewPath('fundingTags')`) until 48.
   - `ContractsView.tsx` moves into the folder unchanged in behaviour, except:
     - rows open `contractPath(id)` through `ClickableRow`;
     - the `?contract=` panel opening goes;
     - "New contract" goes to `newContractPath({ holder })`.
   - The section publishes `useDemoTriggerContext('adminContracts.tab', 'contracts')`, a new key in `DemoContextValues` that 48 reuses for its tabs. `sampleSheetsFor` reads it ahead of `adminMasters.view`, so `SEEDED_SHEETS_BY_VIEW` is unchanged.
5. **The Contract page shell** (new `screens/contracts/ContractPage.tsx`).
   - **`ProfilePage`** gains optional `tabs` (passed to `AdminPage`). Generalise its `back` doc comment; the default look is unchanged.
   - **Header:**
     - back "Contracts" (`contractsPath()`);
     - title: the name;
     - chip: `Pill mono` with the AA code, a status `Pill`, and a `System` pill where `systemRole` is set;
     - sub: "Held by <holder> · bills its holder | the payer · <pricing kind>";
     - actions: `Button variant="secondary"` Disable, or Make active, with none on a system Contract.
   - **Tabs** (`LineTabs`, kept in `?tab=`), each with its count: Overview, Bookings, Event fees (`ContractEventFees`) and History (`ContractHistory`).
   - **Notices:** the system notice and the disabled note (disable day from `contractDisabledOn`, and the review-flag sentence) move from the panel. The panel's after-the-disable list (`stillOnDisabled`) does not.
   - **Demo context:** publish `adminContracts.openContractId` while mounted.
   - **Overview, read-only:** `Card` + `DefList`/`DefRow` in the #record order. Price ranges go full width on top, then the cards on `PROFILE_GRID`:
     - **Price:** for fixed, today's `ContractPriceRanges` until item 9; for the RVG kinds, the rate, discount or "the anaesthetist's rate", undated, plus "Anaesthetist may change the price"; for open, the typed-amount line.
     - **Where it is offered:** the step-rail path from `destinationOf`, as the panel's placement line; linked surgeons and anaesthetist only where `takesLinks`; specialties; funding tag.
     - **Who it bills:** Bills (Its holder or The payer), with the D23 caption on a prepaid Contract. When it bills its holder, the Party's billing name and delivery (email or postal) read-only, with "Open the Party" going to `/admin/masters?view=parties&party=<id>`. Put that URL in one helper (`LoadResultPanel` builds the same today) so 48 re-points one line.
     - **Invoice and codes:** name, AA code, holder reference, invoice description, default RVG code.
     - **Fixed when it was created:** holder, pricing kind, prepaid, "Set when the Contract was created." (49 adds the Replace pointer).
   - **Until session 2:** a header `TextAction` "Edit in panel" opens today's `ContractPanel` in edit mode on the page, so the checkpoint loses no editing. Item 11 removes it.
   - **Rail** (`PageBody rail`, "On this Contract"):
     - a count;
     - the not-yet-authorised Procedures from `stillOnContract(state, id, EARLIEST)`, a named constant earlier than any List date (patient, date, List), each opening the Booking at `/admin/day/:dateISO/bookings/:bookingId`;
     - then the authorised ones from `lockedAgainstContract`, with their locked price;
     - "See all" opens the Bookings tab, which lists both in full as a `TableShell`.

     Add `lockedPrice` (the sum of `lock.procedures[].price` for this Contract) to `LockedAgainst`; `ContractHistory` keeps working. Test the Who it touches criterion: three upcoming and one authorised are listed, the authorised one at its locked price.
6. **Links and triggers re-pointed.**
   - Links: `LoadResultPanel`'s `contracts` record path goes to `contractPath`; Parties' "N active" (`showContracts`) navigates to `contractsPath({ holder })`.
   - S5 Beat 4 (`demoScenarios.ts`) opens the Health NZ agreed rate's page (`CONTRACT.healthNz`), with its label unchanged. `ROUTE_PATTERNS` gains `/admin/contracts` and `/admin/contracts/:contractId`.
   - The demo triggers follow "Demo triggers" below.
   - Grep `view=contracts`, `'contracts'` set on search params and `openContractId` for any builder left. Review flags, Billing cards and Audit rows link to no Contract today. Add no new links (not in the catalogue).

   **Checkpoint:** full gate green, `IN PROGRESS` row, `**Session 1**` paragraph (run-build-phase "Two-session phases").

**Session 2**

7. **Card editing and footer variant** (shared `Card`).
   - Add `footer?: ReactNode` (right-aligned actions under a hairline, as the Admin Review sheet footer) and `editing?: boolean`. While editing:
     - `data-editing` is set;
     - the head's `action` slot shows a quiet "Editing" label, per #updating;
     - the surface takes the design's focus treatment from a token.
   - Defaults keep today's look. Update the "Card (card)" row in `AdminCatalogue.tsx` (and the web row's text if it names props) with an editing example. Name Admin Review in the commit.
   - Each Overview card gets Edit (`TextAction` in `action`) and a local draft from the live Contract. Cancel discards. Save calls `editContract(useAppStore, actor, id, patch)` with **only that card's fields**:
     - **price (RVG kinds):** `pricing`, `anaesthetistMayOverridePrice`;
     - **where:** `linkedSurgeonIds`, `linkedAnaesthetistId`, `specialtyIds`, `fundingTagId`;
     - **who it bills:** `billsTo`;
     - **invoice and codes:** `name`, `aaCode`, `holderReference`, `invoiceDescription`, `defaultRvgGroupId` (19's code picker).
   - A refusal shows on that card (`FormError` or `Notice` with `outcome.message`), with nothing saved.
   - Reuse `billsPayerOnly` and `takesLinks` for what a card offers, never a copy.
   - Tests:
     - One card at a time: one `contract.update` entry whose before/after holds only that card's fields, one change set;
     - Refused in place: bills its holder for a Party with no billing details shows `holderBillingDetails` on the card, state unchanged;
     - Fixed settings: no Edit on that card;
     - Party details read-only: Christchurch Eye Surgery's name and email shown, the link opens the Party.
8. **`proceduresPerRange`** (pure, in `domain/billing/priceRanges.ts`, with tests). The owner's `proceduresPerRange(contract, procedures, lists)`, widened with the `bookings` and `locks` it needs (shape the input like `StillOnInput`). It returns a count per range start. **"Priced"** means a Procedure on the Contract, not cancelled, whose List date falls in the range's span (start to `rangeEnd`), and whose price came from the range:
   - not yet authorised: no `enteredPrice`;
   - authorised: the lock snapshot for it is not `typed` and its locked range start is this range's.

   A typed price, or an authorised price kept from an earlier range, is not counted. Log the definition. Tests:
   - each span's edges;
   - a typed price excluded;
   - an authorised kept price counted under its own range only;
   - cancelled excluded;
   - another Contract's excluded.
9. **The price ranges table** (new `screens/contracts/PriceRangesTable.tsx`; `ContractPriceRanges.tsx` is deleted).
   - `TableShell`/`Th`/`Td`, newest first: a display reverse, since `sortRanges` stays ascending for its callers.
   - Columns:
     - **From:** `formatRangeDate`;
     - **To:** `rangeEnd`, "Onwards" when open;
     - **Price ex GST:** `formatRangePrice`;
     - **Change:** a new pure `rangeChange(prev, next)` beside `rangeSpanText`, formatted once, "First" on the oldest;
     - **Procedures:** item 8;
     - an In force or Future `Pill`;
     - a row action, Correct.
   - **Fold:** the current and future ranges always show. Ended ranges show three, then a `TextAction` "Show N earlier ranges, back to <date>".
   - **Rows:**
     - "Add a price range" (`AddRowButton`) opens an editable row (date, price; "May be in the past.") saved through `addPriceRange`;
     - Correct edits the row through `editPriceRange`;
     - remove goes through `deletePriceRange`;
     - refusals show on the row (`editRangeRefusal`, `deleteRangeRefusal`, never the last range).
   - Keep the kept-price `Notice` under the table (`keptPriceOnContract`, `keptPriceTitle`). Show no list of re-priced Procedures (US-04.2.15), and none of #updating's "This change" rail or re-price preview.
   - Tests: the Table criterion (ranges from 1 April 2019 to 2026 built in the test, not the seed: 2026 first and in force, then 2025, 2024, 2023, and four folded) and To worked out (1 June runs to 30 September; 1 October has no end).
10. **Disable, confirmed (DM-04).**
    - `ConfirmSheet` gains `confirmVariant?: 'primary' | 'danger'` (default `primary`, today's look), passed to its `Button`. Update its catalogue row with a danger example. Name Admin Review's confirm in the commit. Update DECISIONS.md "Buttons".
    - The page's Disable opens it:
      - title "Disable <name>?";
      - body: "It leaves the step rail today, and no new Procedure can be put on it. Procedures already on it keep it and bill as normal. You can make it active again.";
      - the list: `stillOnContract(state, id, fromISO)` through `StillOnNotice`, moved out of `ContractEditSheet.tsx` to `screens/contracts/` over `ContractChangeNotice`, with `stillOnTitle` and `NOTHING_MOVES`; "No Procedure from today is on it." when empty;
      - labels Disable (danger) and Keep it active.
    - `fromISO` comes from one function, `disableFromISO(state, contractId, todayISO)`, in `store/contractChangeSelectors.ts`. It returns `todayISO` here; 49 widens it to the change date.
    - Confirm calls `disableContract`. Make active calls `enableContract` straight away.
    - Test Disable confirmed: a Procedure dated next week is listed before the change; after confirming, the Contract is disabled and the Procedure keeps it.
11. **Retire the panel's edit path.**
    - `ContractPanel` becomes create-only: drop the `contract` prop's edit branches (the tabs, `toggleStatus`, the system patch, the ranges, the disabled list) and the "Edit in panel" action. Create, with its Replaces section and the D23 caption, stays until 46.
    - Move `systemPatch` and `SYSTEM_EDITABLE` to the page. A system Contract's invoice-and-codes card edits only `SYSTEM_CONTRACT_EDITABLE_FIELDS`; its holder reference and default RVG code are read-only; the other cards have no Edit. Test the System Contract criterion.
    - Copy pin: the D23 caption on the who-it-bills card gets its own `MUST_KEEP` row; the `ContractEditSheet.tsx` row stays until 46.
    - Tests:
      - rewrite `ContractEditSheet.test.tsx` as `ContractPage.test.tsx`, keeping its RVG-code picker cases and a short create-only panel case;
      - update `specialtiesTags.test.tsx`, `contractChangeSelectors.test.ts`, `EventSheets.test.tsx` and `anaesthetistSimplicity.test.tsx` (add the page modules) where they drive the panel.
    - Catalogue:
      - `ContractPanelExample`: create only;
      - `ContractPriceRangesExample` becomes the table;
      - the ProfileChrome row previews `ProfilePage` (closes that BACKLOG clause).
12. **Playwright specs.** Move the eight specs listed in Reference from the panel to the page. Keep `goto`s on the new routes, except one that checks the redirect. Keep their assertions on the same figures. `npm run shots` green.
13. **Build on the shared components.**
    - The section, page, cards, table, rail and dialog use `AdminPage`, `ProfilePage`, `PageBody`, `LineTabs`, `Card` (item 7), `DefList`/`DefRow`, `TableShell`/`Th`/`Td`, `ClickableRow`, `Pill`, `Button`, `TextAction`, `AddRowButton`, `Notice`, `FormError`, `EmptyState`, the fields and `ConfirmSheet` (item 10).
    - No local `Card`, `Row`, `Section`, `Pill` or `Th`/`Td`. The panel's private `ReadOnlyField` is not copied: use `DefRow`.
    - Keep the hooks the specs target (`contract-detail` becomes the page's `shot`; `contract-disable`, `contract-tabs`, `contract-history`, `contract-system-notice`, `contract-disabled-note`, the ranges' row hooks) and the `/demo/catalogue/*` rows in step.
    - `oneComponentPerJob.test.ts`'s allow-list only shrinks.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `demo-backdated-range` (re-pointed) | Demo: add a backdated price range (unchanged) | `/admin/contracts` and `/admin/contracts/:contractId` (screen "Admin · Contracts") | bar | As today. `when`: `adminContracts.tab` is `contracts`, or `adminContracts.openContractId` is `CT-MER-FACELIFT`. On the Face lift's page the new range is the table's top row with its Procedures count and the kept-price notice. `indexPath`: `contractPath(BACKDATED_RANGE_CONTRACT_ID)`; `indexHint` follows | "Already added" |
| contracts and priceRanges sample sheets (re-pointed) | unchanged | `/admin/contracts` | bar | `routes` gain the list route; `sampleSheetsFor` reads `adminContracts.tab` first | as today |
| (product) | Edit, Save, Cancel on a card; Disable then Make active | a Contract's page | none | one audited change per save; the confirm lists the Procedures from today | |
| (product) | a system Contract's page | No contract · RVG | none | only name, AA code and invoice description editable; no Disable | |

Labels stay as they are, so `demoGuideSync.test.ts` stays green. PWA: none (Admin only).

## Out of scope

- The grouping, index and search changes (47); the New contract page and deleting `ContractEditSheet` (46); the Parties and Funding tags tabs and the Party page (48); Replace from a date, its header action, the late disable and the to-do (49).
- A future-dated disable (D90). Adding a range to many Contracts, and a desk page (D95). #updating's "This change" rail and re-price preview.
- New links from review flags, Billing cards or Audit rows. A seed change or a `PERSIST_VERSION` bump: none is needed.
- Capture recipes, ATLAS and the demo guide (the owner's sweep).

## Manual test checklist

- [ ] Side nav: Contracts sits between Ledger and Master data and is active on the list and on a page. The list fits the window under the tab strip; Parties and Funding tags open their Master data views.
- [ ] `/admin/masters?view=contracts`, `...&contract=CT-MER-FACELIFT` and `...&holder=<a Party>` land on the list, the Face lift's page and the filtered list. Back does not bounce to the redirect.
- [ ] A row opens the page at the Contract's id. Change the AA code: the URL still works.
- [ ] Face lift: header, the four tabs with counts, ranges newest first with To, Change, Procedures and In force. Add a range from a past date: it shows as the top row and the kept-price notice appears; correct it; removing the last range is refused.
- [ ] Edit Where it is offered and Save: one audit row with only those fields (History tab). Cancel discards. Bills its holder for a Party with no billing details is refused on the card.
- [ ] A Contract that bills Christchurch Eye Surgery shows the Party's billing name and email. "Open the Party" opens it.
- [ ] Rail and Bookings tab: the upcoming unbilled Procedures and the authorised ones at their locked price.
- [ ] Disable: the dialog lists the Procedures from today; Keep it active changes nothing; Disable disables, and the note shows the day. Make active restores it.
- [ ] No contract · RVG: only name, AA code and invoice description editable; no Disable.
- [ ] New contract (and from a Party's "N active" holder filter) still opens the create panel.
- [ ] Demo: add a backdated price range from the list and from the Face lift page. S5 Beat 4 opens the Health NZ agreed rate.
- [ ] 1280 and 1920 widths compared with #record and #updating; teal the only action colour; no dashes in copy.

## Demo guide updates

None: the owner's sweep. Keep `demoGuideSync.test.ts` green (labels unchanged). **For the sweep:**
- **Recipes that drive the panel or `?view=contracts` and break or go stale:** US-04.1.1, US-04.1.2, US-04.1.3, US-04.1.4, US-04.2.1, US-04.2.2, US-04.2.8, US-04.2.11, US-04.2.14, US-04.2.15, US-04.2.16, US-04.2.17, US-04.2.18, US-05.2.8, US-05.5.1, US-03.7.1, US-13.4.1 and FT-04.1, and ATLAS's Contracts entries.
- **New recipe:** US-04.1.7 has none.
- **Guide:** S5 Beat 4's "Master data, Contracts" wording and the trigger's screen label, in the `docs/demo-guide/` S5 page and the matching S5 section of `master-demo-guide.html`.

## Adversarial review (after build)

Standard pass (convention 18). Steer this phase's reviewers at:

- **One card, one change.** Each Save sends only its card's fields and writes one `contract.update` in one change set; a refusal leaves state and the other cards untouched; no card writes a fixed setting.
- **Routes.** Id, never AA code; every in-app link uses `contractsPaths.ts`; the redirect handles all three forms and an unknown id; no `?view=contracts` builder is left in `src/` beyond the redirect.
- **Ranges.** Newest first without changing `sortRanges`; the fold keeps the current and future ranges; `proceduresPerRange` matches its logged definition and is pure; no re-priced list.
- **Disable.** The list comes only through `disableFromISO`; nothing moves; the review flag still keys on the audit's disable day; system Contracts cannot be disabled.
- **Shared.** The `Card` and `ConfirmSheet` variants default to today's look, have catalogue rows and are named after a design pattern; no private copies; the panel's create path is untouched.
- **Determinism and copy.** Today from the demo clock (`useToday`); D23 pinned in both files; no dashes, no "slot".
- **Private copies.** A new private copy of a shared component, or one this phase was to migrate and left, is a finding.

## PROGRESS.md updates

- **For the owner's review:** the defaults in Before you start item 4; "Edit in panel" gone; create still in the panel until 46.
- **Status row and entry:**
  - drift check against `5f87781`; OQ-144 at its default;
  - the names shipped: `contractsPaths.ts` helpers, `ContractsSection`, `ContractPage`, the `Card` `footer`/`editing` props, `ConfirmSheet` `confirmVariant`, `disableFromISO`, `proceduresPerRange`, `rangeChange`, `LockedAgainst.lockedPrice`, the `adminContracts.tab` key, the redirect helper, the Party link helper;
  - tests added; specs moved; review pass.
- **Handoffs:**
  - 46: the create route and panel to replace; the Card variant; `ProfilePage` `tabs`.
  - 47: the list's new file; `?holder=` still a filter.
  - 48: the tab strip, the redirect helper, the Party link helper, the trigger key.
  - 49: the header action slot, `disableFromISO`, the moved `StillOnNotice`.
- **Decisions log:** D92 and D93 built; D96's 45 half built; DECISIONS.md "Buttons" amended (the danger confirm).
