# Phase 50 · The rate and priority tier card

**Requirements covered:**
[US-01.3.6](../../../requirements-board/requirements/stories/US-01.3.6.md) Anaesthetist priority tiers for assignment (status 3 Verify, graded **Contradicts**, size M: tiers 1 to 4, office-only privacy, tier then seeded-shuffle order and the pickers' "Filter by tier" hold; but the tier saves on one click on its own card, and the Anaesthetists list has no tier filter). D105 puts its unit here: **this phase finishes it**.
DM-09 in [domain-model-delta.md](../analysis/domain-model-delta.md) (the rate and the tier are one card and one audited change; no new data, size S).
**Answered, built as answered** (owner, 25 November, for the build, not yet discussed with AA): D99 (the People section's shape; this phase builds on today's record, 54 moves it), D101 (Wave 2's split), D102 (the card's save).
No open question gates it.

**Depends on:** 45 (the shared `Card` `editing` and `footer` props; the Contract page's cards are the pattern).
**Estimated:** 1 session.

**Runs in:** Lane A of the build lanes (Wave 2, first in Lane A's queue, with Lane B's 51 beside it; 46 to 49 are already on `master`): built in the `AnaesthesiaAssociatesRFP-laneA` worktree, committed on `lane/a` with a `50 complete:` commit, and joined onto `master` with the rest of Wave 2 (50 to 53). [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-review and plan-page steps for a lane session (a lighter gate per phase; the full gate, one review and the owner's test come after the join).

## Goal

The priority tier is edited in a card with the rate per unit, never by a single click.

- **Rate and tier card** on today's anaesthetist record (`/admin/masters/anaesthetists/:anaesthetistId`), a new self-contained component. At rest: "Rate per unit $30.00" and "Priority tier: Tier 2 · office only", with Edit. Editing: the rate field and the tier choice, a hint that the tier orders suggestions and is never shown to anaesthetists, Cancel and Save. Cancel leaves both; Save writes only what changed, and when both changed, in one change set, so one save is one audited change; a refusal shows on the card.
- **One editor for the rate in Admin:** the old "Priority tier" card and the Profile card's rate row go; `EditAnaesthetistSheet` drops its rate field.
- **The Anaesthetists list filters by tier** (All, Tier 1 to Tier 4) beside its Tier column.

## Before you start

1. **Drift check** against the plan baseline `67cba2c`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-01.3.6
   ```

   Re-read anything changed after `67cba2c`. If US-01.3.6 is Retired or Future, drop it and record it. If the tier stops being edited on a card, or is no longer office-only, stop and tell the user. No linked question is open.
2. **Confirm 45 is DONE** and read its PROGRESS entry. Note from it: the `Card` `editing` and `footer` props (what `editing` sets, where Cancel and Save go, how a card shows a refusal in `FormError`) and how the Contract page's Overview card wires Edit (`TextAction` in `action`), a local draft and Save. Stop if 45 is not DONE.
3. **Built as answered, no label:** the card and its save (D102), and the card's self-containment (a design choice, so 54 places it as is). No on-screen caption: the story carries no open reading.
4. **Built defaults** (lines on the owner's review list, no on-screen caption):
   - **Rate and tier are one card titled "Rate and tier"**, on the left of the record's grid where "Priority tier" sat; Profile keeps Status, Phone, Email, HPI CPN and bank account.
   - **The tier choice in edit is `SlidingSegmentedControl`** (Tier 1 to 4, as the mock draws it), which only moves a local draft; a click never writes.
   - **Save with no change** closes the card and writes nothing.
   - **The list's tier filter state is local** (`FilterPills` above the table, not in the URL); 53 moves it with the list. Its label and `data-shot="tier-filter-list"` are new; the pickers' `tier-filter` hook is untouched.
   - **A refused rate leaves the tier unwritten:** the rate is written first and a refusal stops the save, so one save never half-lands; the tier write cannot refuse for an office actor with a known anaesthetist.
5. **Reads beyond the run-build-phase standard list:**
   - **Design:** [people-section.html](../../explorations/people-section.html) `#tier` (today's click-to-save control, the card at rest, the card editing with its footer). Layout of the record's grid from [Admin Review](../../design/Admin%20Review.dc.html); the editing treatment is 45's `Card` (Contract page, [contracts-section.html](../../explorations/contracts-section.html) `#updating`).
   - **ROADMAP.md:** D99 (People shape), D101 (Wave 2's split), D102 (the save), D105 (US-01.3.6 finished here); "Owner review: agents test themselves".
   - **GAP-ANALYSIS.md:** the EP-01 row for US-01.3.6 and the DM-09 row, with their `gaps.json` entries (the missing and wrong lists and evidence lines, which the work items answer).
   - **Catalogue:** US-01.3.6 in full (its Edit and save criterion and its Notes); US-12.1.4 (the page that later holds the card) only for its rate-and-tier sentence; [Notes 2026-11-25 · Donald people section](../../../requirements-board/requirements/notes/) item 7. [domain-model.md](../../../requirements-board/requirements/domain-model.md): the priority tier row (the office-private slice).
   - **DECISIONS.md:** honour "what the anaesthetist sees is one predicate" (`viewerOf`; tiers are office only). **BACKLOG.md:** closes none. **PROGRESS.md:** 45's entry (the `Card` props); the catch-up archive's Phase 17 entry only for the tier slice, `setPriorityTier` and the pickers' ordering, which stay as they are.

## Reference

- **Code:** `src/apps/admin/screens/AnaesthetistRecord.tsx` (the Priority tier card at the top, `changeTier`, the rate `DefRow` in Profile); `src/apps/admin/flows/EditAnaesthetistSheet.tsx` (`unitValue` state and its `TextField`, `save()`); `src/apps/admin/screens/masters/AnaesthetistsView.tsx` (the Tier column, `usePriorityTiers`, `tierFor`); `src/store/officePrivate.ts` (`setPriorityTier`, `anaesthetist.tierSet`); `src/store/mastersActions.ts` (`editAnaesthetist`, `OFFICE_HELD_FIELD`, `cleanUnitValue`, `UNIT_VALUE_INVALID`); `src/store/mutate.ts` (`withChangeSet`, kind `'save'`); `src/domain/pairingPreferences.ts` (`TIER_LABELS`, `TIER_VALUES`, `isPriorityTier`, `tierFor`); `src/shared/ui/` (`Card`, `SlidingSegmentedControl`, `FilterPills`, `TextField`, `TextAction`, `Button`, `FormError`, `DefRow`); `src/shared/profile/profileCopy.ts` (`RATE_PER_UNIT`); `src/apps/admin/components/pairing/` (`TierPill`, `usePriorityTiers`, `useProfileHistory`); `src/apps/officePrivacy.test.ts`; `src/apps/demo/catalogue/AdminCatalogue.tsx`; Playwright `visual/admin-phase07.spec.ts` (edits the rate in the sheet, around line 94) and `visual/admin-phase17.spec.ts` (`tier-card`, the record).
- **Keep the card self-contained:** it takes only `anaesthetistId` and `actor` and lives in its own file, so 54 reuses it unchanged. Use `ProfileChrome`'s exports (`PROFILE_CARD`, `PROFILE_FACTS` and the rest) as they are; the shared shell files (`router.tsx`, `routes.tsx`, `SideNav.tsx`, `AdminApp.tsx`) are 53's.

## Work items

1. **`RateTierCard`** (new `src/apps/admin/components/RateTierCard.tsx`, with `RateTierCard.test.tsx`). Props: `anaesthetistId`, `actor`; it reads the anaesthetist and `selectPriorityTier` itself, so 54 can place it unchanged on the anaesthetist's page. Built on shared `Card` (`title="Rate and tier"`, `shot="rate-tier-card"`, `editing`, `footer`). At rest: two `DefRow`s (`RATE_PER_UNIT` mono via `formatCurrency`; "Priority tier" as `TIER_LABELS[tier]` with "· office only" in mist) and Edit as a `TextAction` in `action`. Editing: `TextField` (label `RATE_LABEL`, mono, `inputMode="decimal"`, the hint from the sheet, "The dollar value per RVG unit. The anaesthetist can change it too."), a labelled `SlidingSegmentedControl` over the four tiers (local draft only) with the hint "Orders suggestions when the office assigns or moves a List. Never shown to anaesthetists.", `FormError` for a refusal, footer Cancel (`Button` secondary) then Save (primary). Hooks: `data-shot="rate-tier-card"`, `data-tier` on the shown tier.
2. **Save** (inside the card). Compare the draft to the live values: rate through `parseAmount` and the sheet's `UNIT_VALUE_INVALID` text for a bad value; tier through `isPriorityTier`. Run what changed inside `withChangeSet(useAppStore, 'save', ...)`: `editAnaesthetist(useAppStore, actor, id, { unitValue })` first, `setPriorityTier(useAppStore, actor, id, tier)` second, stopping at the first refusal (Before you start 4); show its `message` on the card and stay in edit. Nothing changed: close, write nothing. Cancel resets the draft and closes. The tier stays in the office-private slice; the card is imported only by Admin.
3. **The record page** (`AnaesthetistRecord.tsx`). Replace the "Priority tier" `Card` with `<RateTierCard>`; delete `changeTier`, `tierError`, `TIER_OPTIONS` and the imports they leave unused (`SlidingSegmentedControl`, `isPriorityTier`, `setPriorityTier`, `FormError`); remove the rate `DefRow` from Profile (the page keeps `HeaderActions`' "Edit details"). Update the component comment to say the page holds the rate and tier card, the profile and the pairing preferences.
4. **`EditAnaesthetistSheet`**: remove the `unitValue` state, its reset, its `TextField`, the `parseAmount` check and `unitValue` in the patch (and the then-unused imports); the sheet's comment drops "rate per unit". The anaesthetist's own rate editing in the web and mobile apps goes through `editAnaesthetist` and is untouched (`OFFICE_HELD_FIELD` stays).
5. **Tier filter on the list** (`AnaesthetistsView.tsx` only). `FilterPills` (`ariaLabel="Filter by tier"`, All then Tier 1 to Tier 4 from `TIER_LABELS`) in the header area above the table, local `useState`, `data-shot="tier-filter-list"`; it filters `rows` by `tierFor(tiers, id)`; an empty result shows the shared `EmptyState` line "No anaesthetists in this tier." If `MasterHeader` has no slot for it, place it in a fragment between the header and the table (do not edit `chrome.tsx`). Change the header sub to mention the card: "Open an anaesthetist for their record, rate, tier and pairing preferences."
6. **Tests.** `RateTierCard.test.tsx`: at rest shows the rate and "Tier 2 · office only" and writes nothing; a tier click changes only the draft (audit unchanged); Cancel restores; Save with a tier change writes one `anaesthetist.tierSet`; with a rate change one `anaesthetist.update`; with both, two audit entries in one change set (same `changeSetId`, the History sheet's one row) ; a bad rate shows `UNIT_VALUE_INVALID` and writes neither; Save with no change writes nothing. `EditAnaesthetistSheet` test (if one exists, else a small one): no rate field, and saving does not change `unitValue`. `AnaesthetistsView` test: the filter narrows the rows by tier and All restores them. Keep `officePrivacy.test.ts` and the anaesthetist-app tests green (the tier never appears there). Playwright: `visual/admin-phase07.spec.ts` edits the rate on the record's card (Edit, fill, Save) instead of the sheet; `visual/admin-phase17.spec.ts` keeps its `tier-card` provisional-line check (point it at `rate-tier-card`) and gains Edit, pick a tier, Save, and the list's tier filter. Run the specs you changed; the join runs the whole of `visual/`.
7. **Build on the shared components (one component per job).** `Card` (45's props), `DefRow`, `TextField`, `SlidingSegmentedControl`, `FilterPills`, `Button`, `TextAction`, `FormError`, `EmptyState`. No private `Card`, `Pill` or `Row`; no copy of `ContractCards`' private editable card (53 lifts that later). Defaults keep today's look; keep every hook. Add a `RateTierCard` row to `/demo/catalogue/admin` (at rest and editing) in this change.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| (product) | The card's Edit, Save and Cancel; the list's tier filter | Admin, anaesthetist record and list | none | normal use; one audit row per change in History | |
| PWA | none (Admin only; the tier is office only) | | | | |

## Out of scope

- Moving the card to the People pages (54), the list's move, search and pager (53), making an anaesthetist inactive (52).
- The candidate pickers' tier order, seeded shuffle and "Filter by tier" (they already match), the tier names, and any change to the tier's storage (no seed change, no `PERSIST_VERSION` bump).
- The anaesthetist's own rate editing in the apps; the shared shell files (53's); capture recipes, ATLAS and the demo guide (the owner's sweep).

## Manual test checklist

Run these yourself in the running app and report pass or fail with evidence.

- [ ] Admin, Master data, Anaesthetists, open Dr Sharma: the "Rate and tier" card shows the rate and "Tier N · office only"; no card saves on a click; Profile no longer lists the rate.
- [ ] Edit, click another tier: the History sheet shows nothing new yet; Cancel restores both values.
- [ ] Edit, change only the tier, Save: one `anaesthetist.tierSet` in History; the list's Tier pill follows. Change only the rate: one `anaesthetist.update`.
- [ ] Change both, Save: History shows them as one change; clearing the rate and saving shows the refusal on the card and leaves the tier as it was.
- [ ] "Edit details" (record and list row): the sheet has no rate field and still saves contact, bank and active.
- [ ] The list's tier filter: Tier 1 to Tier 4 narrow the rows, All restores, a tier with nobody shows the empty line.
- [ ] The anaesthetist web and mobile apps: no tier anywhere; the anaesthetist can still change her own rate.
- [ ] The availability finder and a Draft List picker still order by tier and filter by tier.
- [ ] The lane gate (LANES.md: the quick checks and this phase's own specs) green; the full Vitest, builds and `visual/` suite run at the wave's join.

## Demo guide updates

None by this phase: the owner's `/sweep` re-points the guide, the capture recipes and ATLAS. Keep `demoGuideSync.test.ts` green. In the progress entry, list the guide lines that name the record's Priority tier card or the Edit details rate field (grep `docs/demo-guide/` for "tier" and "Rate per unit") and the recipes US-01.3.6 touches, so the sweep finds them.

## Adversarial review (after build)

Standard pass (convention 18). Steer this phase's reviewers at:

- **Never a single click.** No tier control writes on select; a tier click and Cancel write nothing; nothing in the card writes before Save.
- **One save, one change.** Both writes sit in one `withChangeSet`, only what changed is written, a refusal leaves nothing half-saved, and History shows one change.
- **Office only.** The tier stays in `officePrivate`; `officePrivacy.test.ts` and the anaesthetist apps' tests pass; the anaesthetist's own rate editing is unchanged.
- **One editor.** The rate is gone from the sheet and Profile; no dead state or import left in either.
- **Self-containment.** The card takes only `anaesthetistId` and `actor`; no shell file edited.
- **Shared, once.** `Card` editing and footer, `FilterPills`, `SlidingSegmentedControl` used, no private copy; hooks kept; catalogue row added.
- **Copy and tokens.** No en or em dashes, no "slot" or phase numbers; teal the only action colour, crimson nowhere.

## PROGRESS.md updates

- **For the owner's review:** the built defaults of Before you start 4 (the card's title and place, the segmented control as a draft, no-change Save, the local list filter, rate first then tier); the guide lines and recipes the sweep must re-point.
- Status row and phase entry: drift check against `67cba2c`; D102 as built; the names 45 shipped that this phase used; tests added; `PERSIST_VERSION` unchanged; review pass. Handoffs: 53 (keeps the list's tier filter when the list moves; `data-shot="tier-filter-list"`), 54 (places `RateTierCard` unchanged on the anaesthetist's page).
