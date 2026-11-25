# Phase 52 · Make an anaesthetist inactive from a last day

**Requirements covered:**
[US-12.1.6](../../../requirements-board/requirements/stories/US-12.1.6.md) Make an anaesthetist inactive (status 3 Verify, graded **Contradicts**, size L: Active is an immediate boolean in the edit sheet that trims Slots from today; no last day, reason, clear, sign-in effect, Contract disable or offer-back),
[US-13.5.3](../../../requirements-board/requirements/stories/US-13.5.3.md) Sign in to the anaesthetist app (status 3, graded **Partial**, size M: its new Inactive criterion; sign-in consults nothing),
[US-01.1.1](../../../requirements-board/requirements/stories/US-01.1.1.md) Two Slots per anaesthetist per day (status 4, graded **Partial**, size M: no Slots after a last day, Slots again from the day made active),
[US-04.1.2](../../../requirements-board/requirements/stories/US-04.1.2.md) Create, edit and disable Contracts (status 3, graded **Partial**: its Inactive anaesthetist criterion; this phase holds the story's unit and finishes it, D96).
Domain model: [DM-05, DM-06, DM-07](../analysis/domain-model-delta.md) (last day and `isActiveOn`; own Contracts disabled and offered back; no sign-in after the last day), as D103 settles them.
**Answered, built as answered:** D103 (the built defaults of DM-05 to DM-07), D101 (Wave 2's split), D96 (the story split).
**Open, built to its default:** [OQ-147](../../../requirements-board/requirements/questions/OQ-147.md) (D97: sign-in stops entirely; later remittances by email from the office, nothing built). [OQ-83](../../../requirements-board/requirements/questions/OQ-83.md) as built (the simulated sign-in). [OQ-144](../../../requirements-board/requirements/questions/OQ-144.md) has no effect (D90: the date is the anaesthetist's, never the Contract's).

**Depends on:** 49 (on `master` already: 49 changes how a Contract is disabled, and a re-enabled replaced Contract brings its to-do back) and 50 (the rate and tier card on the same record file, earlier in Lane A).
**Estimated:** 2 sessions. Session 1: domain, store, sign-in and seed with their tests (work items 1 to 8), ending on a `52 checkpoint:` commit. Session 2: the screens, triggers and specs (items 9 to 15).

**Runs in:** Lane A of the build lanes, Wave 2, after 50 and before 53: built in the `AnaesthesiaAssociatesRFP-laneA` worktree, committed on `lane/a` with a `52 complete:` commit, and joined onto `master` with the rest of Wave 2 (50 to 53). [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-review and plan-page steps for a lane session.

## Goal

The office makes an anaesthetist inactive from a chosen last day, with a reason, and can clear it before the day or make them active again after it. After the last day they have no Slots, are offered and picked for nothing, cannot sign in (mobile, PWA, web), and the Contracts held by their own Party and linked to them are disabled by the system; made active again, Slots and sign-in come back from that day and the office is offered those Contracts back, ticked, with prices. Activity is one pure `isActiveOn(anaesthetist, dateISO)`; every reader of today's `active` flag moves to it. The status card, both sheets and a history card sit on today's anaesthetist record (54 later places them on the anaesthetist's page); the edit sheet's Active toggle goes.

## Before you start

1. **Drift check** against the plan baseline `67cba2c` (the context pack runs it):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-12.1.6,US-13.5.3,US-01.1.1,US-04.1.2,OQ-147,OQ-83,OQ-144
   ```

   Stop and tell the owner if: the last day becomes a date on a Contract or OQ-144 is answered with future-dated disables; OQ-147 is answered with a read-only sign-in kept after the last day; "own Party" gains a stored link; or Lists after the last day stop refusing (become moved or deleted). A reworded criterion or a new example is not a stop: build to it and record it.
2. **Confirm DONE:** 50 complete on `lane/a`, and 45 to 49 DONE on `master`. Note from 50's entry: its card's component and file, how it uses 45's Card editing and footer props, and where the record's cards sit. From 49's entry: what `disableContract` now does (`disableFromISO`, the derived "replaced Contract still active" to-do), and anything it changed in `enableContract`. From 45's entry: the Card editing variant and the Contract page path helper (`contractsPaths.ts`, read only) for linking a Contract.
3. **Built as answered, no label** (D103): last day and reason stored on the anaesthetist; activity derived, no clock hook keeps a flag; last day today or later; Slots after it go when it is set and come back if it is cleared; made active again, Slots from that day (today on the demo clock); "own Party" derived (holder an anaesthetist-kind Party, `linkedAnaesthetistId` the person); the system disables those Contracts on `dayAdvanced`, one audited change each; only Contracts that rule disabled are offered back; sign-in refused after the last day at the attempt and at the stored-session gate, with its own audited reason; `PERSIST_VERSION` bumped.
4. **Open, built to default** (each a line on the owner's review list, no on-screen caption):
   - **OQ-147 (D97):** sign-in stops entirely; nothing is built for later remittances (the office emails them).
   - **The shape:** `active` is deleted from `Anaesthetist` (deleting it makes the typecheck list every reader); added `lastDayISO`, `inactiveReason` and `activeAgainISO` (the day made active again), all `null` by default. `isActiveOn` is true from the start date, false after the last day until `activeAgainISO`. Setting a new last day clears `activeAgainISO`; the audit keeps earlier spells.
   - **Reason:** Left the practice, Long leave, Other (the mock's three), stored as a code with labels in one place.
   - **Changing the last day** is Clear then Make inactive again; no Change action.
   - **AA fee run:** an anaesthetist is in a month's run when active on any day of that month (`isActiveDuring`), so the month someone leaves is still billed.
   - **Lists that refuse:** every List and Draft List assigned to them dated after the last day, not cancelled.
   - **Seed:** one of the 71 full-scale colleagues (none of the scripted 14, no own Contracts, few Lists) gets a last day of `2026-11-20`, reason Left the practice, so an inactive record, its history card and the sign-in refusal are demoable in the framed app and the PWA; the full-scale builder gives them no Slot or List after it. Nobody in the cast is inactive; Dr Beaumont stays active (the story's example is run by the trigger).
   - **Sign-in trigger** picks the anaesthetist whose last day passed most recently (the seeded colleague unless the office made someone else inactive), never Dr Souter.
5. **Reads beyond the run-build-phase standard list:**
   - **Design:** [people-section.html](../../explorations/people-section.html) `#inactive` is the layout reference (the make-inactive dialog with its Lists, "After 31 Dec" consequences and Reason; "Inactive from 31 Dec" before the day and the Inactive pill after; the Beaumont example), with `#map` for where the cards will sit on 54's page. [Admin Review](../../design/Admin%20Review.dc.html) for the record's card and table chrome; [Mobile App](../../design/Mobile%20App.dc.html) for the sign-in screen's refusal; [Web Dashboard](../../design/Web%20Dashboard.dc.html) for the web app's no-longer-active page.
   - **ROADMAP.md:** D103 (the built defaults above), D101 (Wave 2's split; by design Contracts change only through `disableContract` and `enableContract`, from new files), D96 (52 holds US-04.1.2's unit and walks the whole story at its close), D97 (OQ-147 default), D90 (OQ-144 untouched), D105 (52 builds US-12.1.4's make-inactive action; 54 finishes the story); the sequencing rule "Wave 2" and the `PERSIST_VERSION` line; "Owner review: agents test themselves".
   - **GAP-ANALYSIS.md:** the EP-12 table row and note for US-12.1.6, EP-13's row for US-13.5.3, EP-01's note and row for US-01.1.1, EP-04's note on US-04.1.2's cascade; the DM-05, DM-06, DM-07 rows, and in [domain-model-delta.md](../analysis/domain-model-delta.md) those three sections with the adversarial note (more flag readers: matching open-slot, rebook candidates, list-move demo; the receipt guard at `paymentActions.ts:294`). Their `gaps.json` evidence lines name the code.
   - **Catalogue:** the four stories in full with their 25 November Notes; [US-12.1.4](../../../requirements-board/requirements/stories/US-12.1.4.md) (the page the action sits on) and [US-01.4.2](../../../requirements-board/requirements/stories/US-01.4.2.md) (the availability finder) for context; OQ-147. [domain-model.md](../../../requirements-board/requirements/domain-model.md) "Active and inactive anaesthetists" (under Surgeon, contacts, preferences and priority tiers) and "Contract".
   - **DECISIONS.md:** honour the sign-in rulings (simulated `account` audit rows; the PWA session is per-viewer browser storage; specs preset it signed in). Supersedes no ruling. **BACKLOG.md:** closes none.
   - **PROGRESS.md:** 45's, 49's and 50's entries (above). Archive ([prototype-build/PROGRESS.md](../../archive/prototype-build/PROGRESS.md)): Catch-up Phase 28 for `startDateISO`, `anaesthetistCanvasDelta` and the `listsAhead` refusal; Catch-up Phase 43a for `anaesthetistSession.ts`, `recordAnaesthetistSignIn` and `pwaPurity.test.ts`; Phase 10 for the `dayAdvanced` hooks and their order in `main.tsx`.

## Reference

- **Domain:** `domain/types.ts` (`Anaesthetist`), `domain/seed/canvas.ts` (`generateCanvasForDates`, the active filter at about line 116, `canvasMastersFrom`), `domain/seed/cast.ts`, `domain/seed/fullScale/index.ts` (lines about 413 and 769), `domain/draftLists.ts`, `domain/listMoves.ts`, `domain/bookingMoves.ts`, `domain/seed/parties.ts`, `domain/seed/pricedItems.ts` (Beaumont's Rhinoplasty), `domain/billing/contracts.ts` (`linkedAnaesthetistId`; read only).
- **Store:** `store/mastersActions.ts` (`editAnaesthetist`, `listsAhead`, `addAnaesthetist`), `store/slotActions.ts` (`anaesthetistCanvasDelta`), `store/clockActions.ts` (`rollCanvasForward`, the `dayAdvanced` emit), `store/events.ts`, `store/archiveActions.ts` (the subscriber pattern), `store/selectors.ts` (slot picker about line 201, AA fee preview about 1587, rebook candidates), `store/aaFeeActions.ts`, `store/matchingSelectors.ts`, `store/draftListActions.ts`, `store/listMoveDemo.ts`, `store/paymentActions.ts` (line about 294), `store/authDemoActions.ts`, `store/contractActions.ts` (`disableContract`, `enableContract`; read only), `store/appStore.ts` (`PERSIST_VERSION`), `main.tsx`.
- **Apps:** `apps/admin/screens/AnaesthetistRecord.tsx`, `apps/admin/flows/EditAnaesthetistSheet.tsx`, `apps/admin/screens/masters/AnaesthetistsView.tsx`, `apps/admin/components/pairing/PairingAddSheet.tsx`, `apps/mobile/screens/SignInScreen.tsx`, `apps/mobile/MobileApp.tsx`, `apps/web/WebApp.tsx`, `apps/demo/DemoData.tsx`, `pwa/PwaDemoActions.tsx`, `shared/session/anaesthetistSession.ts`, `shared/demoClockShortcuts.ts`, `shared/demoTriggers/registry.ts`, `shared/demoTriggers/demoGuideSync.test.ts` (`NOT_SCRIPTED`), `shared/audit/actionLabels.ts`; shared `ConfirmSheet`, `SidePanel`, `DateFields`, `Checkbox`, `SelectField`, `Notice`, `EmptyState`, `Pill`, `Card`, `DefRow`, `TextAction`, `TableShell`; Playwright `visual/phase28.spec.ts`, `visual/profile-phase26.spec.ts`.

## Work items

**Session 1: domain, store, sign-in, seed**

1. **The pure rule** (new `src/domain/anaesthetistStatus.ts`, with tests; no React or store). The fields of Before you start 4 on `Anaesthetist` (`active` deleted) and `InactiveReason` with `INACTIVE_REASON_LABELS`. `isActiveOn(a, dateISO)`, `isActiveDuring(a, fromISO, toISO)`, `statusOn(a, todayISO)` (`active`, `leaving` with the last day, `inactive` since the day after, for the card, list and header), `listsAfterLastDay(lists, draftLists, id, lastDayISO)`, `ownContracts(contracts, parties, id)` (holder kind `anaesthetist` and `linkedAnaesthetistId` the person) and `contractsToOfferBack(contracts, audit, id, lastDayISO)` (still Disabled, whose latest `contract.disable` is by the rule's system actor and dated after the last day). Tests: every criterion's dates (31 January: active on it, inactive 1 February; active again 1 March), start-date edge, `activeAgainISO`, a Contract the office disabled by hand never offered back.
2. **Every reader moves to it.** Deleting `active` makes the typecheck list them; then grep `active` across `src` for anything typed loosely (`?.active`). Each reads the date the work is for: canvas generator and `canvasMastersFrom` (per date), roll-forward (new dates), `anaesthetistCanvasDelta`, the slot picker (`selectors.ts`), the matching open-slot read, Draft List candidates and assignment (`draftLists.ts`, `draftListActions.ts`), List and Booking moves, the availability finder, rebook candidates, the list-move demo and `DemoData.tsx`'s invariant (the List or Slot date); the pairing picker (today); the AA fee preview and run (`isActiveDuring` the month). The receipt guard (`paymentActions.ts`) refuses only an unknown anaesthetist, so a payment for work before the last day lands.
3. **Store actions** (new `store/anaesthetistStatusActions.ts`, office-only, through `mutate()`): `makeAnaesthetistInactive(api, actor, id, lastDayISO, reason)` refused when the day is before today or the start date, or (code `listsAfterLastDay`) while `listsAfterLastDay` returns any, the refusal carrying those Lists; on success one `anaesthetist.makeInactive` change plus the `canvas.trim` of Slots after the day. `clearLastDay` (only while today is on or before it; `anaesthetist.clearLastDay`, Slots after the day regenerated, so nothing about them has changed). `makeAnaesthetistActive(api, actor, id, enableIds)` (only after the last day; `anaesthetist.makeActive` with `activeAgainISO` today, Slots from today, then `enableContract` for each ticked id). Labels in `actionLabels.ts`. Tests for each criterion and refusal.
4. **The Contract rule** (in the same file or a new `store/inactiveContractsJob.ts`): `runInactiveContractsJob(api)` disables, through `disableContract` under one named system actor, every Active own Contract of each anaesthetist whose last day is before today and who has no rule disable yet for this spell; idempotent. `wireInactiveContracts(api)` subscribes it to `dayAdvanced`, wired in `main.tsx` after `wireArchiveJob`. Tests: Beaumont's Rhinoplasty disabled once the clock passes her day and not offered on the rail; a second `dayAdvanced` adds nothing; made active again with it ticked, it is Active; if it was a replaced Contract (49), its to-do returns.
5. **Sign-in** (DM-07). `anaesthetistSession.ts` stays pure (`pwaPurity.test.ts`). `recordAnaesthetistSignIn` takes the anaesthetist and a reason (defaults keep today's Souter rows); a store selector `signInRefusal(state, anaesthetistId)` returns "No longer active" after the last day. `SignInScreen` checks it before signing in and shows the refusal with the audit row (`auth.signInFailed`, reason `No longer active`). The stored-session gate in `MobileApp.tsx` signs a handset out (one `auth.signOut` with the reason) once the clock passes the persona's last day. The web app (`WebApp.tsx`) renders a no-longer-active page in place of its screens for an inactive persona. Dr Souter, active, signs in exactly as today (S1 starts there).
6. **Edit and add.** `editAnaesthetist` no longer takes active; its start-date canvas logic stays. `addAnaesthetist` writes the new fields as `null`.
7. **Seed** (Before you start 4): the full-scale colleague's last day, with no Slot or List after it (`everydayPractice.test.ts` holds this); every seed and fixture (`cast.ts`, `fullScale/index.ts`, `domain/billing/fixtures.ts`) drops `active`.
8. **`PERSIST_VERSION`** bumped (one past the current; at the join the higher of two bumps wins, LANES.md). End session 1 green with a `52 checkpoint:` commit.

**Session 2: the record, sheets, triggers**

9. **Status card** (new file beside 50's card, placed on `AnaesthetistRecord.tsx`; hook `data-shot="anaesthetist-status"`): Active since the start date with "Make inactive"; "Inactive from <day>" with the reason and Clear; Inactive since <day> with the reason, a `Pill`, and "Make active". The record header's `sub` and the Anaesthetists list's status column read `statusOn` today; the Profile card's Status row goes.
10. **Make-inactive sheet** (new `apps/admin/flows/MakeInactiveSheet.tsx`, on `ConfirmSheet`; hook `make-inactive-sheet`): last day (shared date field, today or later), reason, "After <day>" lines (no sign-in; the own Contracts that will be disabled, by name). The refusal shows in place: "She has 2 Lists after 31 Dec. Reassign them first.", each List a link to where the office reassigns it (the Admin day view at that date).
11. **Offer-back sheet** (new `apps/admin/flows/MakeActiveSheet.tsx`; hook `make-active-sheet`): "Make <name> active again from today", each Contract from `contractsToOfferBack` with a `Checkbox` ticked, its name and price as the Contract page formats it (each name a link to the Contract's page); "No Contracts were disabled with them" when none. Confirm calls item 3.
12. **History card** (new file; hook `anaesthetist-history`): a few past Lists (date, hospital, surgeon) with See all expanding in place, and a link to their ledger page (`/admin/ledger/anaesthetists/:id`) for invoices and payments. Shown for every anaesthetist.
13. **Edit sheet:** the Status segmented control and its "removed from today" notice go from `EditAnaesthetistSheet.tsx`.
14. **Tests:** components (refusal lists the Lists; Clear; Make active ticks and enables), the record and list status; Playwright: move `visual/phase28.spec.ts` and `visual/profile-phase26.spec.ts` off the toggle onto the new actions; run the specs you changed (the join runs the whole of `visual/`). Walk all of US-04.1.2's criteria at the close (D96) and record each.
15. **Build on the shared components (one component per job).** Cards, sheets and rows from `Card`, `ConfirmSheet`, `DefRow`, `Pill`, `TextAction`, `Checkbox`, `Notice`, `EmptyState`, the shared date field and `TableShell`; extend with a defaulted prop if one falls short, with its `/demo/catalogue/admin` row; no private copies. Copy: Booking, List, Contract; "Inactive" for anaesthetists (never "Retire"); no dashes.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `pass-last-day` (new) | Demo: pass the last day | Admin, an anaesthetist's record | bar | moves the demo clock to the day after their last day with `advanceClockToDate`, so their Slots end, the finder skips them and their own Contracts show Disabled; the Control Panel's reset puts the clock back | no last day ahead |
| `try-sign-in-after-last-day` (new) | Demo: try signing in after the last day | Mobile Sign in; PWA Sign in | bar; PWA sheet | tries the sign-in of the anaesthetist whose last day passed most recently (Before you start 4) and shows the refusal and its audit row; never makes Dr Souter inactive | no anaesthetist's last day has passed |
| (product) | Make inactive, its refusal, Clear, Make active with the offer-back sheet | record | none | normal use | |

Both new ids go on `NOT_SCRIPTED` in `demoGuideSync.test.ts` with the reason "Not yet in the run sheet; the sweep scripts it".

## Out of scope

- The anaesthetist's page in People, its side panel and Make inactive placed there (54); the Anaesthetists list's search, filters and pager (53); hiding inactive people from the list by default.
- Any edit to `store/contractActions.ts`, `domain/billing/contracts.ts`, `contractHistory.ts`, `screens/contracts/` or `ContractCards.tsx`; a date on a Contract (OQ-144).
- Remittance access for a departed anaesthetist (OQ-147); a real identity provider (OQ-83).
- Capture recipes, ATLAS, the demo guide and the capture.

## Manual test checklist

Run these yourself in the running lane app and report pass or fail with evidence.

- [ ] Dr Beaumont's record: Make inactive with a last day and a reason; the audit shows `anaesthetist.makeInactive`; the card reads "Inactive from <day>"; her Slots up to the day remain, after it are gone.
- [ ] Give her a List after a chosen day, then try that day: refused in place, the List listed and its link opens it.
- [ ] Clear before the day: Slots after it return, audit `anaesthetist.clearLastDay`, card back to Active.
- [ ] Set it again, "Demo: pass the last day": her Rhinoplasty Contract shows Disabled (system actor), is not offered on a List, she is absent from assignment, the finder and the pairing picker; her history card and ledger link show her past work.
- [ ] Make active: the sheet offers Rhinoplasty, $1,350.00, ticked; confirm: Active again, Slots from today; a Contract the office disabled by hand is not offered.
- [ ] Mobile and PWA Sign in: the trigger shows "No longer active" and its audit row; Dr Souter signs in as before; with Souter made inactive and the day passed, a signed-in handset is signed out and the web app shows its no-longer-active page; Reset restores.
- [ ] The edit sheet has no Status control; the Anaesthetists list shows Active, Inactive from <day>, Inactive.
- [ ] AA fee run for the month of a last day includes them; a payment receipt naming them after the day lands.
- [ ] The lane gate (LANES.md: the quick checks and this phase's own specs) green; the full Vitest, builds and `visual/` suite run at the wave's join.

## Demo guide updates

None by this phase. For the sweep: a make-inactive beat on the demo clock (make inactive, pass the last day, sign-in refused, make active with the offer-back), the two new triggers to script (and to take off `NOT_SCRIPTED`), the recipes for US-12.1.6, US-13.5.3 and US-01.1.1, and any recipe or guide line that used the edit sheet's Status control. In the progress entry, list the guide lines to re-point (grep `docs/demo-guide/` and `master-demo-guide.html` for "inactive" and "Sign in": `02-workflows-and-handoffs.md` line 73 "switched active or inactive", the Beat 1 sign-in section and optional sign-out aside in `03-demo-script.md`, and the matching `master-demo-guide.html` sections), so the sweep finds them.

## Adversarial review (after build)

Standard pass (convention 18), run at the Wave 2 join under LANES.md. Steer it at:

- **One rule.** No reader of activity is left on a stored flag or on today where the work's date applies; `isActiveOn` is the only place the rule lives; the AA fee month and the receipt guard behave as Before you start 4 says.
- **Contracts by the rule only.** Disables and re-enables go through `disableContract` and `enableContract`; no Contracts file edited; only rule disables are offered back; the job is idempotent across repeated `dayAdvanced`.
- **Sign-in.** `anaesthetistSession.ts` imports nothing from the store; S1's Souter sign-in is unchanged; the gate signs out once, not on every render.
- **Canvas.** Make inactive, clear and make active each leave Slots exactly as `isActiveOn` says; no List is ever deleted; the seed is deterministic and `PERSIST_VERSION` bumped.
- **Private copies.** A new private copy of a shared component, or the removed toggle surviving anywhere, is a finding.

## PROGRESS.md updates

- **For the owner's review:** the built defaults of Before you start 4 (OQ-147 by email, the field shape, reasons, no Change action, the AA fee month rule, which Lists refuse, the seeded inactive colleague, how the sign-in trigger picks); the sweep items above.
- Status row and phase entry: drift check against `67cba2c`; D103, D96 as built; OQ-147, OQ-83, OQ-144 as above; US-04.1.2 walked in full; the names 49 and 50 shipped that this used; the names 54 will place (the status, history cards and both sheets, their props); `PERSIST_VERSION` from and to.
- Decisions log: the field shape and the AA fee month rule, each also in `docs/DECISIONS.md`.
