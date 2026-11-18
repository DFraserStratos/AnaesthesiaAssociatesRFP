# Phase 33a · Stubs on a List

**Requirements covered:**
[FT-02.6](../../../../requirements-board/requirements/stories/FT-02.6.md) Stubs on a List (status 3, graded Contradicts; renamed from "Stub Bookings on a List" at `a68f09b`, unparked by OQ-118's answer),
[US-02.6.1](../../../../requirements-board/requirements/stories/US-02.6.1.md) Stub in place of a booking that could not be posted (status 3, Contradicts),
[US-02.6.2](../../../../requirements-board/requirements/stories/US-02.6.2.md) Stub clearly marked for anaesthetists and the office (status 3, Missing),
[US-02.6.3](../../../../requirements-board/requirements/stories/US-02.6.3.md) Office resolves a stub from intake (status 3, Missing; the Booking taking the stub's place is our reading),
[DM-58](../analysis/domain-model-delta.md#dm-58) (a Stub record on the List, outside the Bookings table, on its own identifier).
Also closes, without owning: [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md)'s "Stub on the List" criterion (33's covers) and gives 40 the stub that [US-11.1.4](../../../../requirements-board/requirements/stories/US-11.1.4.md) and [US-11.1.5](../../../../requirements-board/requirements/stories/US-11.1.5.md) now name.
**Answered, built as answered:** [OQ-118](../../../../requirements-board/requirements/questions/OQ-118.md) (D66, 4 November, Donald for the build: "Yes, we will have stubs", seen by the anaesthetist and the office) with [OQ-49](../../../../requirements-board/requirements/questions/OQ-49.md) (D11: no Booking or patient without an NHI; the row waits in 33's unmatched queue). No provisional label on either.

**Depends on:** Phase 33 (the intake slice, `ImportRow`, `stageImportRows`, `suggestDecision` with `waitingForNhi` and the List a waiting row would land on, `correctImportRow`, `decideImportRow`, the Matching screen and row panel, `matching.selectedRowId`, `SAMPLE_SX` R4; use the names it shipped). Built: 14 (registry, PWA sheet, `OFFICE_SIMULATION_ACTOR`), 15a (`WarningTriangle`, `warningTone`, the to-do list, no confirm at submit, US-13.7.3), 31 (Draft Lists, `removeDraftList`, `redateDraftList`), 38a (search), 16 (`bctiRecordsFrom`). Runs straight after 33; 34 and 40 follow and reuse its resolve path.
**Estimated:** 1 session: items 1 to 5 (model, pure rules, store, seed), green checkpoint, then 6 to 9 (three apps, triggers, guide, shots).

## Goal

When an incoming booking for a List cannot become a Booking (no NHI), the row still waits in 33's unmatched queue and creates nothing (D11), and a **stub** stands in its place on that List until the office resolves it from intake. A stub is not a Booking: its own record, outside `schedule.bookings`, on an identifier that is never the NHI, linked to its waiting row. Anaesthetists (mobile, web) and the office (Admin Day drawer, Draft List drawer, Review) see it clearly marked as a booking with a problem the office must resolve. It is never counted, priced, completed, billed or found as a Booking.

A List holding a stub never reads all-complete, through the stub's own marking only: 15a's triangle anatomy on the stub row and a "1 waiting at intake" note beside the List's progress. It registers no Booking warning, adds no to-do entry, and submit and authorise neither prompt nor block (15a removed the confirm step).

The office resolves it on Matching: **Add NHI** creates the Booking through 33's guarded path and the Booking takes the stub's place; **Reject** removes the stub. Both go through one audited function that 34's rows and 40's waiting view reuse.

## Before you start

1. **Drift check** against the plan baseline `63a4490`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff FT-02.6,US-02.6.1,US-02.6.2,US-02.6.3,US-02.1.4,US-11.1.4,US-11.1.5,US-13.7.3,US-02.1.2,OQ-118,OQ-49
   ```

   Re-read anything changed after `63a4490`. If a covered item is Retired or Future, drop it and record it; if OQ-118 is reopened or a stub is redefined as a Booking, stop and tell the user.
2. **Confirm 33 is DONE** and read its PROGRESS entry: the slice and row names, how `suggestDecision` exposes the List a no-NHI row would land on (if it does not, add a pure `landingListFor(view, row)` beside `findMatch`, the same List-key rule), where `stageImportRows` commits, and the row panel's waiting state. Note `PERSIST_VERSION`.
3. **Our readings, built and labelled once** (one `STUB_READINGS` block in `domain/intake/stubs.ts`, one mist caption in the stub sheet, "How a stub reads is our reading, to confirm with AA", and the owner's review list): the Booking takes the stub's place (US-02.6.3); what a stub shows (US-02.6.2: patient name, procedure wording and time as received, the reason, the source); how a List holding one reads (US-02.6.1: the triangle and "1 waiting at intake", no prompt or block); no stub when the row has no List to land on or its List is AUTHORISED; a stub follows its List on a reassign or move; removing or re-dating a Draft List takes its stub off and the row keeps waiting; a row the office decides onto another List resolves the stub and the Booking appears there. OQ-118 part 1 (how often) is unknown; nothing hangs on it.

## Reference

- **Catalogue:** the covered items; US-02.1.4, US-11.1.4, US-11.1.5, US-13.7.3 for context; OQ-118's Answer; [domain-model.md](../../../../requirements-board/requirements/domain-model.md) glossary "Stub"; Greg's 28 October notes (`npm --prefix requirements-board run source -- --item US-02.6.1 --text`).
- **Plan:** `gaps.json` entries for the five covers; DM-58 and DM-30 in `analysis/domain-model-delta.md`; ROADMAP D11, D66.
- **Design** (convention 17): [Design Language](../../../design/Design%20Language.dc.html) (warning tint, the dashed "Free" treatment as the precedent for a placeholder row, pills, mono time); [Mobile App](../../../design/Mobile%20App.dc.html) (List rows, bottom sheet), [Web Dashboard](../../../design/Web%20Dashboard.dc.html), [Admin Day](../../../design/Admin%20Day.dc.html) (drawer rows) and [Admin Review](../../../design/Admin%20Review.dc.html). No mockup has a stub: extend the Booking row.
- **Code:** 33's `src/domain/intake/` and intake store actions; `src/shared/warnings/WarningTriangle.tsx`, `tone.ts`; `src/apps/mobile/screens/ListDetailScreen.tsx` (its `model`, `activeCount`, `done`, "Mark list completed"), `ForwardListsScreen.tsx`; `src/apps/web/screens/ListDetailView.tsx`, `ListsScreen.tsx`, `DashboardScreen.tsx`; `src/apps/admin/components/SlotDrawer.tsx`, `DayGrid.tsx` (`daygrid-block-count`), `draftLists/`, `screens/ReviewScreen.tsx`, 33's Matching screen; `src/store/selectors.ts` (`bookingsForList`), `lifecycle.ts` (`submitList`, `authoriseList`), `draftListActions.ts`, `billingRun.ts`; `src/domain/billing/bcti.ts`; `src/shared/demoTriggers/`; `src/shared/audit/actionLabels.ts`; `appStore.ts`.

## Work items

1. **Model** (`src/domain/types.ts`). `StubId` (`STB0001`, from a counter in the intake slice, never the NHI or the hospital's ref). `Stub { id, listId, importRowId, reason: 'noNhi', asReceived: { patientName, procedureText?, scheduledTime?, hospitalId, sourceLabel }, createdAtISO, status: 'standing' | 'resolved' | 'removed', settledAtISO?, settledBy?, bookingId? }`. `reason` is a union so another cause is one member more. Held in 33's intake slice as `stubs` (with `nextStubSeq`), never in `schedule`. Add it wherever the intake slice is listed (persist, reset, Demo data page).
2. **Pure rules** (new `src/domain/intake/stubs.ts`, PWA-safe, with `stubs.test.ts`): `stubFor(row, landingList)` (undefined when the row has an NHI, no landing List, or the List is AUTHORISED); `stubsOnList(stubs, listId)` (standing only, time-ordered with Bookings by `scheduledTime`); `listStubNote(count)` ("1 waiting at intake", "2 waiting at intake"); `STUB_READINGS` (item 3 of Before you start). No React, store, `Date.now()` or `new Date()`.
3. **Store** (new `src/store/stubActions.ts`, with tests).
   - **Place.** `stageImportRows` places a stub for each staged no-NHI row with a landing List, in its own commit (meta `stub.place`), from any source: a row of a hospital file imported on 33's Matching screen and, from 34, a rooms' PDF row (there is no sync, D52). The List's Bookings are added as usual.
   - **Settle, one place.** `settleStubForRow(draft, row, outcome)`, called inside `decideImportRow`'s commit: a create or match marks the stub `resolved` with the `bookingId`; reject marks it `removed`. Metas `stub.resolve`, `stub.remove`. No other code changes a stub's status.
   - **Resolve, one path.** `resolveStub(api, actor, stubId, { kind: 'addNhi', nhi } | { kind: 'reject', reason })`: `addNhi` runs `correctImportRow` (validated on entry) and then, when 33's suggestion is `createBooking` on the stub's List or a match there, `decideImportRow` with it and no picks, so the Booking lands on the stub's List with no Contract and waits on 20's "Needs an invoice destination" list; any other suggestion stops after the NHI with `needsDecision` and the stub stands. `reject` runs `decideImportRow` reject. Refusals pass through 33's (`invalidNhi`, `listLocked`, `wordingOrCodeRequired`, `staleSuggestion`) and leave the row and stub unchanged. Office actors only (the PWA stand-in as `OFFICE_SIMULATION_ACTOR`).
   - **The List changes.** `removeDraftList` and `redateDraftList` take a standing stub off (`removed`, reason in the meta) and leave its row waiting; reassign and own-List moves change nothing (the stub follows `listId`).
   - Selectors: `stubsForList(state, listId)`, `stubForRow(state, rowId)`, `standingStubCount(state)`.
4. **Never a Booking** (tests, one sweep file `stubIsolation.test.ts`): with the seeded stub standing, `bookingsForList`, mobile and web progress counts, the Day grid count, the dashboard summary, `completionBlockersFor`, the warning routine and the to-do list, `needsContractBookings`, the billing run, `bctiRecordsFrom`, 38a's search and the audit viewer's Booking filter all return what they return without it. `submitList` and `authoriseList` succeed on a List holding a stub, with no prompt and no refusal, and the stub stands afterwards.
5. **Seed and `PERSIST_VERSION`.** One batch with one waiting no-NHI row (synthetic patient, AR-35-style wording, a time) and its stub, on a Dr Souter ACTIVE List at St George's or Southern Cross a few days after `DEMO_TODAY`, away from every scripted-beat List. Confirm `SAMPLE_SX` R4 lands on a List and so places a stub when imported; if not, re-point R4 to a session with a List and pin it. Keep `rng()` order, bump `PERSIST_VERSION` by one. **Green checkpoint:** build, build:pwa, vitest.
6. **Display** (new `src/shared/stubs/`, PWA-safe: `StubRow`, `StubMarker`, `StubSheet`, `ListStubNote`). `StubRow`: a dashed-border warning-tint row in the Bookings' time order, 15a's disc and triangle anatomy drawn from `warningTone('mild')` (not a `Warning`), the patient name as received, wording in mono as received, "Waiting at intake: no NHI" and "The office is resolving this". Never tappable into a Booking.
   - **Mobile** List: `StubRow`; tap opens `StubSheet` (bottom sheet: what was received, the reason, the source, the readings caption). The progress line reads "3 of 3 complete · 1 waiting at intake" and the bar never fills to the done colour while a stub stands; "Mark list completed" stays enabled. Lists row (`ForwardListsScreen`): `StubMarker` beside the count.
   - **Web** `ListDetailView`: the same row and note; the sheet as a popover; Lists and Dashboard rows show `StubMarker`.
   - **Admin:** `SlotDrawer` and the Draft List drawer show `StubRow` with a teal "Resolve on Matching" link (`/admin/matching`, the row selected); Review shows it in the Bookings table, its stats not counting it; the Day grid block gets `StubMarker` beside `daygrid-block-count` (count unchanged).
   - Hooks: `list-stub`, `stub-sheet`, `list-stub-note`, `daygrid-block-stub`, `stub-resolve-link`.
7. **Matching screen.** A waiting row with a standing stub names it ("A stub stands on Dr Souter's <day> <session> List", from the List) and its panel's NHI field gains **Add NHI** (teal) beside **Reject**, both through `resolveStub`; after Add NHI the panel shows the Booking created and a link to it. The Unmatched filter is unchanged. `actionLabels.ts`: `stub.place`, `stub.resolve`, `stub.remove` ("Stub placed on List", "Stub replaced by Booking", "Stub removed").
8. **Triggers** (below), PWA sheet entry, Reset and reload.
9. **Guide, shots, review pass, PROGRESS.**
10. **Build on the shared components; migrate these copies (UI unification).**
    - UI in this phase is built from the shared components: `AttentionDot` (U3) for `StubMarker`; `OverlayHeader` (U2) for `StubSheet` on mobile and `PopoverPanel` (U2) for it on the web; `ProgressBar` (U5) for the List's progress line; `TextAction` (U5) for "Resolve on Matching"; `Button` (U5) for Add NHI and Reject.
    - This phase also migrates these existing copies on the screens it rebuilds: `StubMarker` is built on `AttentionDot` (the anatomy 15a's `WarningTriangle` composes), never a private disc; nothing else.
    - Default props keep today's look; keep every `shot`, `data-shot`, `data-testid`, `data-validation-*` and row `data-*` hook on the element recipes and specs target; update the catalogue rows (`/demo/catalogue/*`) for components removed or merged.
    - If the U phase that builds a component named here has not landed when this phase starts, stop and say so (the Sequencing rules put it first); never build a private copy. See [`docs/ui-unification/PLAN.md`](../../../ui-unification/PLAN.md) section 3 and [`README.md`](../../../ui-unification/README.md) section 8.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| (33's) Import hospital file | Import hospital file, Southern Cross sample (33's own button; no new one) | Admin · Matching | bar | R4, a row of the imported file, now also places a stub on its List | as 33 |
| (product) | Add NHI, Reject | Admin · Matching, unmatched row | none | `resolveStub` | as `resolveStub` refuses |
| (seed) | the seeded stub | Mobile, web, Admin List views | none | shown on Reset | |
| `stub-office-adds-nhi` | Office adds the NHI to this stub | Mobile · List detail and `StubSheet` | pwa | `resolveStub` as `OFFICE_SIMULATION_ACTOR` with the synthetic NHI the fixture holds for that row; message "The office added the NHI. The Booking now stands in the stub's place." `badge: 'office-stand-in'` | no standing stub on this List |

No pre-filled NHI on Matching: the cheat sheet carries the seeded row's NHI to type.

## Out of scope

- 40's view of waiting rows, its urgency and chase details, and the NHI required on every form (40 reuses `resolveStub`); 40a's as-typed NHI check on Add NHI; 34's sources (they reach stubs through `stageImportRows`).
- A Booking warning, a to-do entry, a confirm or block at submit or authorise for a stub (warnings are records on a Booking; US-13.7.3).
- Stubs for any reason but a missing NHI; a stub for a row with no landing List; matching a later row to a stub by patient name (never by name: the office rejects the waiting row).
- 43's scale stubs.

## Manual test checklist

Run these yourself in the running app and report pass or fail with evidence.

- [ ] Reset: Dr Souter's seeded List on mobile shows the stub in time order, marked, with "1 waiting at intake"; the sheet shows what was received and the readings caption; the List's count and the dashboard summary exclude it.
- [ ] Web List detail and Lists row: the same stub and marker; nothing opens a Booking.
- [ ] Admin Day: the block's count unchanged with the stub marker; the drawer row and "Resolve on Matching" open the waiting row; Review shows it, uncounted.
- [ ] Complete every Booking on that List: progress still reads "1 waiting at intake", no to-do entry or Booking warning appears; submit and authorise go through with no prompt; the stub stands.
- [ ] Matching, Import hospital file, Southern Cross sample: R4 waits and a stub appears on its List in all three apps.
- [ ] Add NHI with an invalid NHI: refused, nothing changes. With a valid one: the Booking takes the stub's place on the List (mobile, web, Admin), on "Needs an invoice destination", the audit shows `stub.resolve` with `importRow.decide`.
- [ ] Reject a waiting row: the stub goes; audited.
- [ ] Remove a Draft List holding a stub: the stub goes, the row still waits.
- [ ] PWA: "Office adds the NHI to this stub" from the sheet; reload keeps state; Reset restores the stub; build, build:pwa and vitest green.
- [ ] Catalogue screenshots: recipes below, a full `npm run capture` with no failed recipe, shots checked by eye, `npm run verify:board` green.

## Demo guide updates

Locate by text in `docs/demo-guide/`. `03-demo-script.md`: the beat where 33 shows Southern Cross's no-NHI row (S4 Beat 4 as 33 left it, or S1's waiting row if 34 has run) gains the stub on the List and Add NHI; a discovery point for the readings. `04-presenter-cheat-sheet.md`: "What if the patient has no NHI?" (waits at intake, a stub on the List, never a Booking) and the seeded row's NHI to type. `02-workflows-and-handoffs.md`: Workflow 1's waiting row. `master-demo-guide.html`: the same passages; the Control Panel lists the PWA entry under its screen.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), after the review pass. Run `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 33a` first.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-02.6.1](../../../../requirements-board/requirements/stories/US-02.6.1.md) | none | Create, `captured`. Mobile `stub-on-list` at the seeded List, highlight `[data-shot=list-stub]`, `[data-shot=list-stub-note]`; Admin `stub-placed` on the drawer after importing the Southern Cross file. Caption "An incoming booking with no NHI waits at intake; a stub, not a Booking, stands in its place on its List". |
| [US-02.6.2](../../../../requirements-board/requirements/stories/US-02.6.2.md) | none | Create, `captured`. Mobile List and state `sheet` (`stub-sheet`); web List detail; Admin drawer and Review. Caption "The stub is clearly marked for the anaesthetist and the office as a booking the office must resolve". |
| [US-02.6.3](../../../../requirements-board/requirements/stories/US-02.6.3.md) | none | Create, `captured`. Admin Matching, the seeded row selected: states `waiting` (NHI field, Add NHI, Reject) and `resolved` (the drawer with the Booking in the stub's place). Caption "The office adds the NHI at intake and the Booking takes the stub's place (our reading)". |
| [FT-02.6](../../../../requirements-board/requirements/stories/FT-02.6.md) | none | Carried by its stories; create a one-shot recipe (the mobile stub) only if `recipe-status.mjs` lists it. |
| [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md) | 33's | Add state `stub` (R4's List drawer with the stub); drop "the List shows no stub" from the caption. |
| US-11.1.4, US-11.1.5 | | No change here (Phase 40 owns them). |

**Recipes this phase breaks.** 33's Matching recipes whose counts or nav badge now include the seeded waiting row; recipes of Dr Souter's seeded List on mobile, web, the Day grid and Review. Keep shot `name`s.

**ATLAS.md.** Seed data (the stub, its List, row id and the NHI to type); Existing hooks (item 6's); Demo actions (`stub-office-adds-nhi`).

## Adversarial review (after build)

Standard pass (convention 18), steered at:

- **Not a Booking.** No stub in `schedule.bookings` or any Booking selector, count, fee, completion, billing, BCTI, search or warning path; the isolation sweep covers every one; the stub id is never the NHI.
- **One path.** Only `settleStubForRow` changes a stub's status, only inside `decideImportRow`'s commit; `resolveStub` composes 33's actions with no second create path; a refusal strands nothing.
- **No prompt.** Submit and authorise untouched; no to-do or Warning record for a stub.
- **Display.** One shared component set, PWA-safe; teal the only action colour, no crimson; no en or em dashes, no "stub Booking", no "slot"; readings labelled once.
- **Seed.** `rng()` order, `PERSIST_VERSION` bumped once, scripted-beat Lists untouched.
- **Private copies.** A new private copy of a shared component (`docs/ui-unification/README.md` section 8), or a copy this phase was to migrate and left, is a finding.

## PROGRESS.md updates

- **For the owner's review:** the readings in Before you start item 3 (labelled, one place each); Add NHI creates the Booking with no Contract, waiting on "Needs an invoice destination"; the seeded stub's List and row.
- Status row and phase entry: drift check against `63a4490`, OQ-118 and OQ-49 as built, names 33 shipped, tests added, `PERSIST_VERSION` old to new, review pass, catalogue screenshot result (REPORT.md counts before and after). Handoffs: 34 (stubs placed through `stageImportRows`), 40 (`resolveStub` for its waiting view), 40a (Add NHI's field), 43 (stubs through the same module), 44 (the beat and cheat-sheet line).
- Decisions log: D66 built (a stub, not a Booking, on its own record); the readings; superseded: 33's "no stub on the List" default.
