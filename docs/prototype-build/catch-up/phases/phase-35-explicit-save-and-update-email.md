# Phase 35 · Explicit save and the update email

**Requirements covered:**
[US-02.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.1.md) Create or amend a Booking ·
[US-02.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.2.md) Save Booking changes explicitly ·
[US-02.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.3.md) Draft a booking update email ·
[US-02.5.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.5.md) Append-only change history ·
[US-02.5.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.6.md) Concurrent edits ·
[DM-29](../analysis/domain-model-delta.md#dm-29) Explicit-save change sets, booking update email draft and concurrent-edit detection.
Also touches, without closing:
[US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md) (List reassignment; this phase adds the cover-change email to the flow Phase 28 rebuilt),
[US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md) (the Audit viewer; this phase adds the change-set column).
No RV finding is in scope ([reverse-check.md](../analysis/reverse-check.md) has none for EP-02's save and history).
**Open questions:** [OQ-46](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-46.md) (which changes the update email covers, and who receives it). Answered and relied on: [OQ-07](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-07.md) (optimistic concurrency with a row-version backstop).
**Depends on:** Phase 17 (hospital and surgeons' room contact emails, `Surgeon.roomId`), Phase 25 (Contract version history and the per-Procedure lock, which the as-at view reads and which makes AUTHORISED Bookings read-only), Phase 33 (hospital rows land for an admin decision, so nothing applies silently and every inbound write goes through the guarded, versioned paths). Through them: 14 (trigger registry, context hook, shared actors), 15 (Booking vocabulary, `BookingDetailBody`, Booking source), 20 to 24 (the Contract, billable party, required-input, primary Procedure and adjustment edits that now sit inside a save) and 28 (`reassignList` over Slots, via 33 to 31 to 30 to 29). **Not guaranteed before 35** (they are not in its dependency chain): 27 (prepayment commands), 32 (the office swap confirmation), 34 (the S1 rebuild; normally done first by Intake track order) and 39. Every work item that mentions them applies only if that phase is DONE; the drift check records which.
**Estimated:** 2 sessions, and a full two. Session 1 is the save boundary (work items 1 to 12: model, pure change-set maths, the save action, the draft store, the Admin save bar, the unsaved-changes guard and grouped history with the as-at view). Stop green there. Session 2 is concurrency, the update email and adding a Booking to a booked List (items 13 to 21). **Spill point:** if session 1 runs long, the as-at view (work item 6 and the "View as at" part of item 12) moves to the start of session 2; nothing else depends on it. If session 2 then runs long, finish the demo-guide patch and the adversarial pass in a short third sitting rather than dropping either.

## Goal

Today every office edit on a Booking applies the instant it is made: the time stepper and notes
write straight away, and each sheet saves on its own, so the history is a stream of per-field
mutations with no save boundary. This phase makes Admin Booking editing **draft-then-save**:

- the office edits freely, sees "3 unsaved changes", and presses **Save changes** or **Discard**;
- leaving the page with unsaved edits warns, whether by the side nav, the back link, the app switcher,
  the browser back button or a reload;
- each save writes **one change set**: every field changed since the previous save, with before and
  after, who and when, grouped under one id in the append-only audit;
- the History sheet shows saves as single rows, and an admin can open the Booking **as at** any point
  in its history (a point-in-time reconstruction, with the Contract version in force).

Every Booking and Procedure carries a **row version**. When a save finds that someone else saved the
same Booking since the draft began, a change to a different field **merges** (both kept, and the admin
is told), and a change to the same field shows a plain-language **clash prompt** where the admin keeps
theirs or yours. Nothing is ever lost silently.

After a saved change, **Draft update email** opens the admin's mail client (a real `mailto:` link)
prefilled with a subject, boilerplate, the list of changes and the To address: the surgeon's rooms for
a Booking change, the hospital for a cover change (List reassignment), per the OQ-46 recommendation.
Past about 2,000 characters the body is shortened and says so. A badged preview panel shows the same
email for presenters without a mail client. The system sends and records nothing.

The office can also **add a Booking to a List that already has Bookings**, and amend a Booking's time
with a proper time field rather than only the 5-minute stepper.

Anaesthetist flows (mobile, web, PWA) keep their immediate saves. The shared Booking detail stays one
component: a context decides whether its writes go to the real store (immediate) or to a draft
(Admin).

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.3.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.3.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.3.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.5.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.5.6.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.5.2.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-46.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-07.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   If an item changed, re-read it and adjust the work items before planning. If a covered item is
   now Retired or Future, drop it from this phase and say so in the PROGRESS entry. The likeliest
   changes: US-02.3.2 or US-02.3.3 moving from Proposed to Confirmed with wording changes (rebuild to
   the new acceptance criteria), or US-02.5.6 gaining a field-by-field auto-apply policy (put it in
   `MERGE_POLICY`, work item 5).
2. **OQ-46 (email scope and recipients).** If it is still open, build the recommendation exactly:
   offer the button after any saved change to a Booking and after a List reassignment; To is the
   surgeon's room for Booking changes and the hospital contact for cover changes; the admin can
   switch the recipient (rooms, hospital or both) and edit everything in their mail client. Label the
   recipient choice "Provisional (OQ-46)" in the UI. If it has been answered, build the answer: the
   trigger list and recipients live in one table in `src/domain/updateEmail.ts`, so the change is
   local.
3. **Confirm what earlier phases delivered** (their PROGRESS entries and handoff notes). Write these
   down before touching code, because the draft must capture every write the Booking detail can make:
   - **15:** the post-rename names (`Booking`, `BookingId`, `editBooking` + `BookingPatch`,
     `createBooking`, `cancelBooking`, `reassignBooking`, `copyBooking`, `shared/booking/`,
     `BookingDetailBody`, `AdminBookingDetail`, the route `/admin/day/:dateISO/bookings/:bookingId`),
     the Booking source values (including the office's `admin`), and where attachments now live
     (15 moved them out of `BookingPatch` into their own actions).
   - **17:** `Hospital.contactEmail`, `SurgeonRoom { contactEmail, phone }`, `Surgeon.roomId`,
     `surgeonsInRoom`.
   - **20 to 24:** every Booking and Procedure field the Admin detail now edits (Contract picker,
     insurer and funding source, billable party and override, required inputs, invoice email,
     not-on-schedule flag, primary Procedure, base-unit override, anaesthetist adjustment) and the
     store action each uses.
   - **25:** the Contract version history helper (the one that returns the version in force at a
     date) and the lock record; AUTHORISED Bookings are read-only.
   - **20 and 25 closed two of US-02.5.5's gaps** (gaps.json: "Contract chosen automatically at
     billing is not persisted or audited" and "no versioned Contracts"): confirm that every Contract
     selection (20's picker and default, audited `procedure.contract` or its successor) and every
     adjustment (24) is an audited Procedure write, and that 25's lock and version history exist. If
     either is missing, stop and report: this phase does not rebuild them.
   - **27 (if DONE):** the estimate and prepayment-invoice actions on the Booking (commands, not
     drafted edits).
   - **28:** `reassignList` (over `moveListToSlot`) and `ReassignListFlow`'s success step.
     **32 (if DONE):** the office swap confirmation action.
   - **34 (if DONE):** the rebuilt S1, for the milestone consistency read.
   - **33:** the matching screen's apply action. It must write through `editBooking` /
     `editProcedure` (or an equally guarded path through `mutate()`), so its writes bump row versions
     in work item 3. If it bypasses them, fix that here.
   - **14:** the registry file, `DemoContextValues`, the shared actor constants module and the PWA
     sheet's `office-stand-in` badge.
   - The current `PERSIST_VERSION` (13 at `1f067a8`; 14 to 34 will have bumped it).
4. **Build the write inventory** (it drives work items 8 and 9). Grep every store action called from
   `src/shared/booking/`, `src/shared/capture/` and the flows the Booking detail mounts, and classify
   each one. The expected result:

   | Write | Today | Admin after this phase |
   |---|---|---|
   | `editBooking` (time, notes) | immediate (stepper, notes on blur) | drafted |
   | `editPatient` (`EditPatientSheet`) | immediate sheet save | drafted; the sheet button reads "Apply" |
   | `editProcedure` (Times, Units, ASA, code, modifiers, notes, override, billing setup, Contract, adjustment, required inputs, make primary) | immediate | drafted |
   | `addProcedure`, `removeProcedure` | immediate | drafted |
   | `addBillingLine`, `removeBillingLine`, funder allocation or 22's covered amount | immediate | drafted |
   | billable party create or change (21) | immediate | drafted |
   | attachments (15) | immediate | drafted if they live in the snapshot's slices; otherwise a command |
   | `completeBooking`, `uncompleteBooking` | command | command, disabled while unsaved |
   | `cancelBooking`, `reassignBooking` (Move), `copyBooking` | command | command, disabled while unsaved; cancel and move write a change set |
   | prepayment estimate and invoice (27 if built), post-op or additional invoice (39 if built) | command | command, disabled while unsaved |

   A write is **drafted** when it only changes the Booking, its Procedures and billing lines, its
   patient, its billable parties or its attachments. Anything that raises money, changes lifecycle
   state or creates another Booking is a **command**: it acts on the real store at once, and only
   when there are no unsaved changes. A write whose store action also touches a slice outside the
   snapshot (the List, a Slot, `billing`, `masters` other than the patient and billable parties) or
   emits an app event (`emitAppEvent` in `store/events.ts` is a module-level emitter shared by every
   store instance, so a drafted `listAuthorised` would reach the real billing run) is a command,
   whatever it looks like in the UI. Record the final table in the PROGRESS entry.
5. Record the result, including "no drift", in the PROGRESS entry.

## Reference

**Design (convention 17):**
- `docs/design/Admin Day.dc.html` and `docs/design/Admin Review.dc.html`: the Admin chrome, the
  List drawer and its action row, tables, the amber advisory treatment, and the authorised-banner
  anatomy that the save strip follows (a single-line banner with a status pill, a stamp and one
  action).
- `docs/design/Design Language.dc.html`: tokens. Teal `#0D6E63` is the only action colour (Save
  changes, Draft update email, Add booking); crimson never appears on the save bar or the clash
  prompt. The unsaved bar uses the **warning** tint and on-tint (an unsaved draft is a caution, not an
  error); the saved strip uses the success tint; the merge notice and the "changed by the office"
  banner use a neutral info treatment. Spline Sans Mono with tabular-nums for change-set ids, counts,
  times and character counts. e-2 for the sticky bar, radius `card` for panels, the `sheet-in` motion
  for the clash sheet, and "motion never blocking".
- `docs/design/Mobile App.dc.html`: only for the one-line "changed by the office" banner on the
  mobile Booking (bottom sheets, no desktop modals).
- No mockup covers the save bar, the clash prompt, the as-at panel or the email preview. Extend the
  Admin's banner, rail-card and sheet patterns. Admin is desktop: overlays through
  `useSurface().Overlay` (the web `Dialog`).

**Catalogue:** the five covered files above; OQ-46; OQ-07; `domain-model.md` §1 row "No path for
telling hospitals about Booking changes" and §2 "Booking" and "Surgeon, surgeons' room and
blacklist"; [US-13.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.1.md)
and [US-13.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.1.md)
(where the contact emails come from);
[US-08.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.4.md)
(invoice reproducibility, which 25 closed and the as-at view illustrates).

**Analysis:**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): theme 11 "Explicit save, update email, concurrency", the
  DM-29 row, "Demo-trigger buttons" (Booking detail), "Uncertainty" (OQ-46), and the EP-02 table and
  its verifier note (point 5: buffering must be admin-only; the router is not a data router).
- [epics/EP-02.md](../epics/EP-02.md): US-02.3.1, US-02.3.2, US-02.3.3, US-02.5.5, US-02.5.6.
- `gaps.json`: the entries for the five covered IDs and `DM-29`.
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-29 (and DM-26 for the
  contact emails).
- [analysis/prototype-map-shared.md](../analysis/prototype-map-shared.md) §2 (surface seam), §3
  (Booking detail body, History), §5 (flows and sheets), §6 (audit presentation);
  [prototype-map-admin.md](../analysis/prototype-map-admin.md) §1, §3 (List drawer), §4 (Booking
  flows, `AdminBookingDetail`), §10 (Audit viewer);
  [prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md) §1 and §2 (`mutate`,
  lifecycle guards);
  [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) (harness bar, the
  router, the PWA demo sheet and `pwaPurity`).

**Code entry points** (names after Phase 15; line numbers are from `1f067a8` and will have moved):
- `aa-prototype/src/store/mutate.ts`: `mutate()` (L150; returns `void` today and stamps
  `lastModifiedBy/AtISO` on Cards only, through `deriveStampCardId`, now the Booking stamp;
  work item 2 changes both),
  `MutationMeta`, `Outcome` and `refuse(code, message, details?)` (L35 to 47), `ID_FORMATS` (L61),
  `resetDomainState` (the demo Reset: a wholesale replace that keeps seeded ids). The
  `storeDiscipline` source scan lives in `mutate.test.ts`. `AuditEntry` has no sequence field:
  the append-only `audit` array order is the sequence.
- `aa-prototype/src/store/lifecycle.ts`: `editRefusal` (L48), `editCard` / `editProcedure`
  (L415 to 477, now `editBooking` / `editProcedure`), `reassignList` (L550, rebuilt by 28).
- `aa-prototype/src/store/appStore.ts`: `PERSIST_VERSION`, `createAppStore({ persisted })` (L204),
  `AppStoreApi`.
- `aa-prototype/src/domain/types.ts`: `Card` (L370, now `Booking`), `Procedure` (L444),
  `AuditEntry` (L645).
- `aa-prototype/src/shared/card/CardDetailBody.tsx` (now `shared/booking/BookingDetailBody.tsx`):
  `stepTime` and `saveNotes` (L327 to 335), the notes `onBlur` (L651), the command handlers (L363 to
  463), the History entity-id set (L260).
- `aa-prototype/src/shared/card/HistorySheet.tsx`, `HistoryTimeline.tsx`;
  `aa-prototype/src/shared/audit/` (`actionLabels.ts` with its source-scanning test, `fieldLabels.ts`,
  `auditNarrative.ts` with `coalesceAudit`).
- The flows the Booking detail mounts: `shared/flows/EditPatientSheet.tsx`, `EditProcedureSheet.tsx`,
  `EditBillingSetupSheet.tsx`, `PriceOverrideSheet.tsx`, `FunderAllocationSheet.tsx`,
  `RemoveProcedureSheet.tsx`, `CancelBookingSheet.tsx` (`CancelCardSheet.tsx` at `1f067a8`),
  `PrepaymentOverrideSheet.tsx` (if 27 kept it); `shared/capture/*` (every card calls
  `editProcedure(useAppStore, ...)`); `apps/admin/flows/MoveBookingFlow.tsx` (`MoveCardFlow.tsx` at
  `1f067a8`) for `reassignBooking`.
- `aa-prototype/src/apps/admin/screens/AdminCardDetail.tsx` (now `AdminBookingDetail.tsx`) and its
  route wrapper in `apps/admin/routes.tsx`.
- `aa-prototype/src/apps/admin/components/ListDrawer.tsx` (`isFreeEmpty` gate, L40 and L96 to 100),
  `apps/admin/flows/PhoneAdviceBooking.tsx` (`isScriptedS2Booking`), `apps/admin/flows/ReassignListFlow.tsx`,
  `apps/admin/screens/AuditViewer.tsx`.
- `aa-prototype/src/router.tsx` (`BrowserRouter` at L64 with `v7_startTransition` and
  `v7_relativeSplatPath`, so `useBlocker` is unavailable today); `aa-prototype/pwa/main.tsx` (the
  PWA's own router, untouched); `src/shell/AppShell.tsx` (`handleSelect` sets `currentApp` then
  navigates; the route effect re-syncs it, so a blocked switch settles back on the current app).
- `aa-prototype/src/apps/demo/DemoControlPanel.tsx`: the S5 jump (L428 to 447) that stages David
  Chen's trail.
- `aa-prototype/src/shared/demoTriggers/` (Phase 14): `registry.ts`, `types.ts` (`choices`,
  `disabledReason`, `run` returning `{ ok; message }`), `match.ts`, `context.ts`
  (`useDemoTriggerContext`, `DemoContextValues`); the actors module `src/store/demoActors.ts`
  (`OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`); `src/pwa/pwaPurity.test.ts`.

## Work items

### Session 1: the save boundary

1. **Model** (`src/domain/types.ts`):
   - `Booking.rowVersion: number` and `Procedure.rowVersion: number` (US-02.5.6: "each Booking and
     Procedure carries a row version").
   - `ChangeSetId = string`; `AuditEntry.changeSetId?: ChangeSetId` (DM-29: a change set is a group of
     audit entries, not a new collection, so there is one history, not two).
   - `ChangeSetKind = 'save' | 'create' | 'cancel' | 'move' | 'listReassign'`.
   - No new slice. The "fields changed since the previous save" (US-02.3.2 "Changes known") are
     derived from the audit by change-set id.
2. **`mutate()` groups and versions** (`src/store/mutate.ts`):
   - `MutationMeta.changeSetId?`, and an optional last argument `options?: { changeSet?: ChangeSetKind }`.
     With it, `mutate` allocates one `CS####` id (new `ID_FORMATS.changeSet`, prefix `CS`, pad 4) and
     stamps it on every entry of the call. `mutate` returns `{ changeSetId: ChangeSetId | null }`
     (callers that ignore the return are unaffected).
   - In the same loop as the `lastModifiedBy/AtISO` stamp, bump `rowVersion` by one on the touched
     Booking (any change to it or its children, exactly the set the stamp already covers) and on the
     touched Procedure (a procedure entity, or a billing line's parent). Integration, anaesthetist and
     system writes bump too: that is what lets a save detect them.
   - `rowVersion`, `lastModifiedBy` and `lastModifiedAtISO` never appear in an audit `before` or
     `after`.
   - Convention 7's wording gains "a save groups its entries under one change-set id; `mutate` bumps
     row versions" (PROGRESS update).
   - Vitest (`mutate.test.ts`): one call with `changeSet` gives every entry the same id and allocates
     exactly one; versions bump once per call per entity; a List-only mutation bumps no Booking;
     `storeDiscipline` still passes.
3. **Seed and migration:**
   - Every seeded Booking and Procedure gets `rowVersion: 1`, set in the seed builders (the `addCard`
     and `addProcedure` successors in `domain/seed/`), not patched afterwards. Seeded audit entries
     carry no `changeSetId`: the seed's history is per mutation, which is honest.
   - The canvas generator and every RNG input are untouched; the seed-determinism test proves it.
   - Bump `PERSIST_VERSION` by one; extend `persistMigrate.test.ts` so a stale store is discarded.
4. **Pure change-set maths** (`src/domain/changeSets.ts`, no React, no store imports):
   - `BookingSnapshot { booking; procedures; billingLines; patient?; billableParties; attachments? }`
     and `snapshotBooking(source, bookingId)`, where `source` is a narrow structural type (the
     schedule and the patient and billable-party masters), so the helper stays pure. The related-id
     set is the Booking, its Procedures, their billing lines, the Booking's patient, every billable
     party the Booking or its Procedures reference, and the Booking's attachments if 15 keeps them in
     their own slice.
   - `FieldChange { entityType; entityId; field; before; after; kind: 'update' | 'create' | 'remove' }`
     and `diffSnapshots(base, next): FieldChange[]`: structural equality with stable key order,
     arrays and objects compared as whole values (a modifier list is one field), and
     `IGNORED_FIELDS` (`rowVersion`, `lastModifiedBy`, `lastModifiedAtISO`).
   - `changeSetsFor(audit, entityIds)`: entries grouped by `changeSetId`, each group with its header
     entry, newest first; ungrouped entries pass through.
   - Vitest `changeSets.test.ts`: stamps ignored; a changed array is one change; created and removed
     entities; nested objects (a price override union, a covered amount) compare structurally.
5. **Merge rules** (same module, pure; US-02.5.6):
   - `mergeForSave(base, mine, current, policy)` returns
     `{ apply: FieldChange[]; kept: FieldChange[]; clashes: Clash[]; blocked?: BlockReason }`, where
     `mine = diff(base, draft)` and `theirs = diff(base, current)`.
   - A field only in mine is applied. A field only in theirs is kept (reported as merged). The same
     field changed to the same value on both sides is not a clash. The same field changed to
     different values is a `Clash { key; entityType; entityId; field; base; mine; theirs; theirsBy;
     theirsAtISO }` (who and when come from the audit).
   - Entity-level rules: a Procedure mine changed and theirs removed, or theirs changed and mine
     removed, is a clash on the whole Procedure. An entity mine created never clashes. A Booking
     cancelled, moved to another List or whose List became AUTHORISED since the base is `blocked`
     (not a clash): nothing is saved and the admin is told why.
   - `MERGE_POLICY: { alwaysAsk: readonly FieldKey[] }`, default empty, with a comment quoting
     US-02.5.6 ("which fields may auto-apply and which must stop for a person is a business policy, to
     be mapped field-by-field with AA"). A field in `alwaysAsk` is a clash whenever both sides touched
     the Booking. One labelled constant, so a later answer is a one-line change.
   - `resolveClashes(mergeResult, resolutions: Record<ClashKey, 'mine' | 'theirs'>)`: every clash must
     have a resolution or it throws.
   - Vitest: disjoint fields merge with both kept; same field, same value is silent; same field,
     different values clashes with both values and theirs' author; removed-versus-edited Procedure
     clashes; cancelled, moved and authorised are blocked; `alwaysAsk` promotes a disjoint pair to a
     clash; `resolveClashes` applies each choice.
6. **As-at reconstruction** (`src/domain/bookingAsAt.ts`, pure; US-02.5.5 technical discussion:
   "point-in-time reconstruction, what a Booking looked like at an instant"):
   - `bookingAsAt(now: BookingSnapshot, entries: AuditEntry[], cut)` where `cut` is
     `{ afterEntryId }` or `{ atISO }`. It starts from the current snapshot and undoes, newest first,
     every entry after the cut: an update restores its `before` keys; a `*.create` removes the
     entity; a `*.remove` restores the entity from its `before` snapshot. It returns
     `{ snapshot; incompleteAt?: { entryId; action } }` and stops, reporting `incompleteAt`, at an
     entry whose action is not in its reverse table or lacks usable `before` values.
   - **Order by audit sequence, not time.** The demo clock has minute resolution, so several entries
     share an `atISO`. A time cut means "after the last entry at or before that minute".
   - The Contract version shown for each Procedure is resolved by the UI through Phase 25's version
     helper (the version in force at the cut, or the locked version once AUTHORISED); the pure
     helper takes no Contract data.
   - Vitest `bookingAsAt.test.ts`: a scripted sequence (create, three edits including a grouped save,
     add and remove a Procedure) reconstructs the exact snapshot captured after each step; every
     seeded Booking reconstructs back to its creation entry without `incompleteAt`. If a seeded
     action code fails, add it to the reverse table or correct that seed audit entry, and list which
     in the PROGRESS entry.
7. **The save action** (`src/store/bookingSaveActions.ts`, exported from `src/store/index.ts`;
   US-02.3.2 "Explicit save", "Changes known", "History"; US-02.3.1 "recorded against the admin";
   US-02.5.6):
   - `saveBookingChanges(api, actor, bookingId, draft: { base: BookingSnapshot; next: BookingSnapshot }, resolutions?)`
     returns `Outcome<{ changeSetId; changes; kept; resolved }>`.
   - Refusals as data: `notFound`; non-office actor (`officeOnly`: anaesthetists keep immediate saves);
     `editRefusal(actor, currentList)`; `noChanges`; `blocked` with a plain reason ("This Booking was
     cancelled by Tama R. at 09:16 while you were editing. Nothing was saved."); `editClash` with
     `details: { clashes, kept }` when a clash has no resolution.
   - Fast path when the current Booking's `rowVersion` and every touched Procedure's equal the base's.
     Otherwise run `mergeForSave`.
   - **Ids created in the draft are remapped.** The draft allocated its own ids from a copy of the
     counters, so a new Procedure could collide with one the real store allocated meanwhile. Allocate
     fresh real ids for every created entity and rewrite references (a billing line's `procedureId`,
     a billable-party reference).
   - Re-check invariants on the candidate state before committing, reusing the existing guards rather
     than re-implementing them: funder allocation or covered amount conserved
     (`allocationNotConserved` or 22's successor), exactly one primary Procedure (23), a Contract the
     Procedure is eligible for (20's filter). A failure refuses with that guard's own message.
   - One `mutate(..., { changeSet: 'save' })`: one meta per changed entity, reusing the existing
     action codes (`booking.update`, `procedure.update`, `procedure.create`, `procedure.remove`,
     `billingLine.*`, `patient.update`, `billableParty.*`) so labels and the as-at reverse table work
     unchanged, plus a header meta `booking.save` on the Booking with
     `after: { kind, fields: FieldRef[], kept: FieldRef[], resolved: { field; chose }[] }`.
   - `cancelBooking`, `reassignBooking`, `createBooking` and `reassignList` (and 32's office swap
     confirmation, if built) accept `{ changeSet?: ChangeSetKind }` and pass it to `mutate`; the Admin
     callers pass `cancel`, `move`, `create` and `listReassign`. Mobile and web callers pass nothing.
   - Convenience `saveBookingPatch(api, actor, bookingId, { booking?: BookingPatch; procedures?:
     Record<ProcedureId, ProcedurePatch> })`: takes `base = snapshotBooking(current)`, applies the
     patches to a copy for `next`, and calls `saveBookingChanges`. It is the one path for saves that do
     not come from the Admin draft: the S5 jump (item 12) and both demo triggers (items 14 and 19), so
     none of them hand-builds snapshots. Given a `base` argument (the concurrency trigger passes the
     real current snapshot), it behaves identically.
   - Labels: `booking.save` "Booking saved" in `actionLabels.ts`; the header keys in `fieldLabels.ts`.
     The source-scanning label test must pass.
   - Selector `lastChangeSetFor(state, bookingId)` in `store/selectors.ts`.
   - Vitest `bookingSaveActions.test.ts`: one save gives N entries and a header under one id, all
     `who: 'Kirsty W.'`, `source: 'office'`; the Booking's `rowVersion` rises by exactly one; an
     anaesthetist actor is refused; a stale base with a different field merges and records `kept`; the
     same field refuses `editClash` with both values; `theirs` and `mine` resolutions each land and are
     recorded; a List authorised in between refuses and writes nothing (audit length unchanged); a
     draft-created Procedure gets a fresh id when the real store allocated one meanwhile; a save that
     would break funder conservation refuses with that guard's message.
8. **The draft store** (`src/shared/booking/draft/`; DM-29 "anaesthetist mobile flows keep immediate
   saves"):
   - `BookingStoreContext` carries `{ api: AppStoreApi; mode: 'immediate' | 'draft' }`.
     `useBookingStore(selector)` and `useBookingApi()` read it and fall back to `useAppStore` and
     `'immediate'` when there is no provider, so mobile, web and the PWA behave exactly as today.
   - `BookingDraftProvider({ bookingId, actor, children })` creates a non-persisted store with
     `createAppStore({ persisted: false })`, initialised from the real state by reference
     (structural sharing, no deep clone; every store write is immutable). While clean, it follows the
     real store (subscribe and re-copy). On the first drafted write it stops following and holds
     `base = snapshotBooking(state it last copied)`.
   - `useBookingDraft()` returns `{ dirty; changes; base; save(resolutions?); discard() }`. `dirty`
     is `diffSnapshots(base, snapshotBooking(draft)).length > 0`, so undoing an edit by hand makes the
     draft clean again. `discard()` re-copies the real state.
   - The draft store is never persisted, never wired to the billing run, and its own audit entries
     are thrown away: Save writes the net change set to the real store.
   - **Demo Reset while dirty.** `resetDomainState` rebuilds the seed with the same ids, so the Booking
     usually does not disappear and its `rowVersion` returns to 1, which could let a stale draft
     fast-path over the reset. Detect a reset as "the real `audit` array is shorter than when the
     draft began, or its entry at that length differs" (or the Booking is gone); the draft then
     discards itself and shows one line: "This Booking was reset. Your unsaved changes were
     discarded."
   - Vitest: a drafted write does not reach the real store; discard restores; a clean draft follows a
     real change; a dirty draft does not; hand-undo makes it clean; a demo Reset discards a dirty
     draft; each drafted action in the inventory changes only the snapshot's slices (plus `audit` and
     `counters`) and emits no app event.
9. **Route the Booking detail's reads and writes through the context** (the mechanical refactor):
   - In `src/shared/booking/**`, `src/shared/capture/**` and the flows from the write inventory,
     replace `useAppStore(selector)` with `useBookingStore(selector)` and the `useAppStore` api argument
     with `useBookingApi()`. At `1f067a8` `shared/card`, `shared/capture` and `shared/flows` hold 25
     files with 26 `useAppStore(selector)` reads and about 44 `useAppStore` api arguments (70 uses in
     all), plus the four reads in `AdminCardDetail.tsx`; later phases will have added more. Budget the
     refactor accordingly.
   - Commands keep the **real** store explicitly and read `useBookingDraft()?.dirty` to disable
     themselves with the reason "Save or discard your changes first".
   - In draft mode the sheets' primary button reads **Apply** instead of Save (from `mode`), so the
     office is never told a sheet "saved" something that is not yet saved.
   - Add a source-scanning Vitest beside `storeDiscipline`: `useAppStore` may not appear in those
     folders except in the named command allowlist. A future edit cannot bypass the draft silently.
   - Mobile and web mount no provider. `TimesCard.test.tsx` and the other capture tests pass
     unchanged, and a new web test proves an edit on `/web/.../bookings/:bookingId` still writes
     immediately.
10. **Admin Booking detail becomes draft-then-save** (`apps/admin/screens/AdminBookingDetail.tsx`;
    US-02.3.2 "Explicit save"; US-02.3.1 "amend ... time"):
    - Wrap the screen in `BookingDraftProvider`. The page header (patient name, NHI badge, primary
      Procedure) reads from the draft, so a patient edit shows at once.
    - **Unsaved bar** (`data-shot="booking-save-bar"`), sticky under the page header, e-2, warning
      tint: "3 unsaved changes" (mono count) and the changed field labels ("Time · Notes · Procedure 2
      Contract"), then **Discard** (secondary) and **Save changes** (teal primary). Hidden when clean.
    - **Saved strip** after a save: success tint, "Saved · 3 changes · 09:14 · Kirsty W.", the change
      set id in mono, and the update-email actions from work item 16. It is derived from
      `lastChangeSetFor` (not local state), so it is still there after leaving and returning, until
      the next save or **Dismiss** (a per-viewer UI flag, not domain state).
    - **Time amend:** in draft mode the Scheduled time row is a real time input (`type="time"`, step
      300, styled with the `Field` primitives) beside the existing plus and minus 5 minute steppers.
      Notes write to the draft on change; there is no blur write. Mobile and web keep the stepper and
      the blur save.
    - Save refusals render verbatim in the bar. `editClash` opens the clash sheet (work item 13;
      until session 2, render the refusal message).
    - Commands are disabled while dirty, with the reason shown under them.
11. **Unsaved-changes warning** (US-02.3.2 "Unsaved warning"):
    - Migrate `AppRouter` (framed build only) from `<BrowserRouter><Routes>` to
      `createBrowserRouter(createRoutesFromElements(...))` and `<RouterProvider>`, with the same route
      tree. In 6.30 the flags split: `v7_relativeSplatPath` (and the data-router flags
      `v7_fetcherPersist`, `v7_normalizeFormMethod`, `v7_partialHydration`,
      `v7_skipActionErrorRevalidation`, to keep the console free of future-flag warnings) go in
      `createBrowserRouter`'s `future` option; `v7_startTransition` goes on
      `<RouterProvider future={...}>`. Create the router once at module level, not inside a
      component. `pwa/main.tsx` keeps its own `BrowserRouter` (no Admin in the PWA).
    - `useUnsavedChangesGuard(dirty, count)` in `src/shared/booking/draft/`: `useBlocker` when the
      pathname would change, and a `beforeunload` listener while dirty (the browser's own prompt on
      reload or tab close). Outside a data router (existing `MemoryRouter` tests) it degrades to
      `beforeunload` only, detected through `UNSAFE_DataRouterContext`, so those tests keep working.
    - The blocked-navigation dialog (web `Dialog`): "Leave without saving? You have 3 unsaved changes
      to this Booking." with **Keep editing** (teal) and **Discard and leave** (secondary).
    - Covers the side nav, the back link, the app switcher, the Demo actions menu's navigation, the
      Control Panel's links and the browser back button.
    - Vitest with `createMemoryRouter`: navigating away while dirty shows the dialog; Keep editing
      stays; Discard and leave navigates and the real store is unchanged; a clean draft never blocks.
    - Run `npm run shots` straight after this item: the router swap is the riskiest change in the
      phase.
12. **History shows saves, and the as-at view** (US-02.3.2 "History"; US-02.5.5):
    - `HistoryTimeline` (shared): entries sharing a `changeSetId` render as one row, "Saved by
      Kirsty W. · Office · 3 changes", with the per-field ledger beneath (Procedure rows labelled
      "Procedure n · description" as today), and chips from the header: "Merged with Tama R.'s change"
      and "Clash resolved: kept yours". `coalesceAudit` still applies to entries with no change set.
      Mobile and web histories show the office's saves grouped too.
    - **Admin only:** each change-set row and each ungrouped entry has **View as at**, which opens a
      read-only panel in the sheet (`data-shot="booking-as-at"`): "As at Tue 21 Jul 09:14, after
      Kirsty W.'s save", then patient name, List (date, session, hospital, surgeon), time, each
      Procedure (description, code, base units, Contract name and version through 25's helper),
      billable party and notes. No money. If `incompleteAt` is set: "History before this point is
      incomplete (Procedure removed)", in mist.
    - **Audit viewer:** a Change set column (mono `CS0003`, blank when none); clicking it filters to
      that change set.
    - **Contract selections and adjustments in the ledger** (US-02.5.5 "including every Contract
      selection and adjustment"): a save that changes a Procedure's Contract or its anaesthetist
      adjustment shows both as labelled fields in the change-set row, and the as-at panel shows the
      Contract that was selected at the cut. A Vitest in `bookingSaveActions.test.ts` asserts both land
      in one change set with before and after.
    - **S5 staging:** in the S5 jump (`DemoControlPanel.tsx`), replace the office
      `editCard(... notes)` step with one `saveBookingPatch` call as the office that saves the note
      and a time change together, so S5 Beat 1 shows a grouped save. Update the jump's message.
    - Green checkpoint: build, PWA build, Vitest and shots. This is the end of session 1.

### Session 2: concurrency, the update email and Add booking

13. **Clash prompt and merge notice** (US-02.5.6: "neither change is ever lost silently";
    "same-field contention is escalated to a person as a clear, actionable message"):
    - `apps/admin/flows/SaveClashSheet.tsx` through `useSurface().Overlay`
      (`data-shot="booking-clash-sheet"`): headline "Tama R. saved this Booking while you were
      editing". One row per clash: the field label, "Theirs: 09:30 (Tama R., 09:16)", "Yours: 09:45",
      and a segmented **Keep theirs · Keep yours** with nothing preselected. Beneath, one quiet line
      for the merged fields: "Also saved by Tama R. and kept: Notes." Primary **Save with these
      choices** is disabled until every clash has a choice; Cancel returns to the draft intact.
    - After a merged save the saved strip reads "Saved · merged with Tama R.'s change to Notes".
    - Plain language throughout; no row versions, ids or technical errors in the copy.
    - While the Admin draft is dirty and someone else saves, a neutral one-line notice appears above
      the bar: "Tama R. saved this Booking at 09:16. Your changes will be checked against theirs when
      you save." (the same banner as work item 18).
14. **Publish the draft for the demo trigger** (Phase 14's context hook):
    - Add `'admin.bookingDraft'` to `DemoContextValues`:
      `{ bookingId; dirty; dirtyFields: FieldRef[]; baseRowVersion }`, published by
      `AdminBookingDetail` through `useDemoTriggerContext`. UI state only, never domain state.
    - `src/shared/demoTriggers/concurrentEdit.ts` (pure): `concurrentEditFor(current: BookingSnapshot,
      draft: DemoContextValues['admin.bookingDraft'], mode: 'differentField' | 'sameField')` returns the
      second user's change. Supported fields, in order: the Booking's time, then its notes. Same
      field: the first dirty supported field, set to a value different from both base and the draft
      (time plus 15 minutes, or a note "Rooms confirmed by phone."). Different field: the first
      supported field that is not dirty.
    - `SECOND_OFFICE_ACTOR = { who: 'Tama R.', role: 'office', source: 'office' }` in
      `src/store/demoActors.ts`: a fictional second coordinator (never a real AA staff name). "Tama" is
      also in the seed's patient first-name pool (`seed/patients.ts`), so check no seeded patient is
      "Tama R..." on the demo dates; if one is, pick another name and use it everywhere below.
    - The trigger body (see the "Demo triggers" table) runs `saveBookingPatch` as `SECOND_OFFICE_ACTOR`
      against the **real** store, from the real current snapshot. So the "other user" writes a real
      change set with a real row-version bump, through the same path.
    - Vitest: each mode's field choice; same-field never equals the draft's value; the trigger bumps
      the real `rowVersion` and leaves the draft untouched; then the Admin save merges (different
      field) or refuses `editClash` (same field).
15. **The update email builder** (`src/domain/updateEmail.ts` + `updateEmail.test.ts`, pure;
    US-02.3.3 "Compose window", "To address", "Length", "Nothing sent"):
    - `buildBookingUpdateEmail({ changes, context, to, signature })` and
      `buildCoverChangeEmail({ list context, fromAnaesthetist, toAnaesthetist, bookingCount, to,
      signature })` return `{ to; subject; body; href; shortened; omittedCount; length }`.
    - `EMAIL_TRIGGERS` (the OQ-46 table): Booking save, create, cancel and move go to the surgeon's
      room; List reassignment (and 32's confirmed swap, if built) goes to the hospital contact.
    - `EMAIL_FIELDS` allowlist with plain labels: time, patient name, Procedure description (added,
      removed, changed), cancellation, move to another List (date and session), hospital and surgeon
      where they changed. **Never** in an email: NHI, date of birth, internal notes, Contract, billable
      party, prices, overrides, funders, units or captured times. A save whose changes are all outside
      the allowlist offers no email ("Nothing in this save is for the rooms").
    - Plain text with CRLF line breaks. Subject "Booking update · Tue 21 Jul PM · St George's".
      Body: "Kia ora," then one line saying the booking has been updated in the Anaesthesia Associates
      system, the context lines (patient, date and session, hospital, surgeon, anaesthetist), a
      "Changes:" list ("- Time: was 09:00, now 09:30"), a line asking them to reply if anything is
      wrong, and "Ngā mihi," with the office signature. Cover change: "Dr Rutherford is no longer the
      anaesthetist for this List. Dr Sharma will be the anaesthetist." plus the number of Bookings
      (no patient names in a List email).
    - `MAILTO_MAX_LENGTH = 2000` (one labelled constant, on the whole encoded `href`). Past it, change
      lines are dropped from the end and a line is added: "This list was shortened to fit an email
      link. 3 more changes are in the booking record." The greeting, context and sign-off are always
      kept.
    - `to` empty gives `mailto:?subject=...`.
    - Recipient helper `updateEmailRecipients(state, subject, choice)` in `store/selectors.ts`: the
      surgeon's room is `List.surgeonId` to `Surgeon.roomId` to `SurgeonRoom.contactEmail`; the
      hospital is `List.hospitalId` to `Hospital.contactEmail`; `both` joins the two known addresses.
      28 made `surgeonId` optional on a List, so a List with no surgeon has no rooms address (To empty,
      with the reason "No surgeon on this List"), never a thrown lookup.
    - Vitest: fields outside the allowlist never appear; an over-long change set gives
      `href.length <= 2000`, `shortened` and the note; a short one is not shortened; encoding of `&`,
      `?`, `#`, `+`, apostrophes, line breaks and macrons (Māori names) round-trips through
      `decodeURIComponent`; no `–` or `—` anywhere in subject or body; an empty `to` is valid.
16. **Draft update email on the Admin Booking detail** (US-02.3.3):
    - The saved strip (work item 10) shows **Draft update email** as a real `<a href={mailto}>`
      (teal secondary, `Mail` icon) and **Preview**, for the last change set of kind save, create,
      cancel or move on this Booking. Opening it writes nothing (AC "Nothing sent": the test asserts
      the audit length is unchanged).
    - **Send to:** "Surgeon's rooms · Hospital · Both" (default rooms), with the resolved address
      shown, or "No contact email held for Riverside Orthopaedic Rooms. To will be left empty." A
      small caption "Provisional (OQ-46)".
    - **Preview panel** `UpdateEmailPreview` (`data-shot="update-email-preview"`) with
      `DemoBadge label="Demo preview"`: To, Subject, and Body in mono with pre-wrap; "1,184 of 2,000
      characters"; a "Shortened to fit" pill when `shortened`; and one line: "Opens in your mail
      client. The system does not send or record it."
    - In the History sheet, each change-set row (Admin only) also has **Draft update email** for that
      change set, through the same builder.
17. **Cover-change email after reassignment** (OQ-46 recommendation; US-02.3.3's main trigger):
    - `ReassignListFlow` (as 28 rebuilt it): after the success moment, the flow shows a final step
      instead of closing the drawer: "List reassigned to Dr Sharma", **Draft update email to St
      George's** (the hospital contact), **Preview** and **Done**. The reassignment's metas carry
      `changeSet: 'listReassign'`.
    - If 32's office swap confirmation reassigns through the same action, give its success state the
      same offer.
    - Update `ReassignListFlow.test.tsx`: success shows the offer, and the `mailto` To is the
      hospital's contact email.
18. **Add a Booking to a booked List, and the "changed by the office" notice** (US-02.3.1: "create a
    new Booking on a List"):
    - `ListDrawer`: the Bookings section header gets **Add booking** (teal, `data-shot="list-add-booking"`)
      on any assigned List the office may edit (DRAFT or SUBMITTED, not AUTHORISED), whether or not it
      already has Bookings. It opens the shared `AddBookingFlow` with the office actor and that List
      (no hospital step: the List already has one). Booking source `admin` (15); the new Booking takes
      the default Contract (20); the create carries `changeSet: 'create'`, so the Booking detail offers
      the update email.
    - **Book (phone advice)** stays for a free Slot without a List, and the `isScriptedS2Booking`
      prefill still works (S2 Beat 2).
    - **Changed by the office notice** (in `BookingDetailBody`, all surfaces): when a change set saved
      by another actor lands on this Booking while the screen is open (compare
      `lastChangeSetFor` with the value at mount), a neutral one-line banner shows "Kirsty W. saved
      changes to this Booking: Time. View history", dismissible. On mobile it sits under the masthead
      and never covers the completion dock.
19. **Register the demo triggers** (Phase 14's registry; details in "Demo triggers" below). Bodies
    live in `src/shared/demoTriggers/`, so `pwaPurity` holds. Nothing is added to the Control Panel
    page; its index lists the new entries automatically.
20. **Playwright** (`npm run shots`): add `visual/admin-phase35.spec.ts` with shots of the unsaved bar
    with three changes, the leave-without-saving dialog, a grouped save in History with the as-at
    panel open, the clash sheet (fired by the trigger), the saved strip with the email preview, the
    reassign flow's email step, and the drawer's Add booking on a booked List. Keep every existing
    Admin Booking spec passing: any spec that edits on the Admin Booking detail now presses **Save
    changes** (grep the `visual/` specs for Admin Booking edits).
21. **Finish green:**
    - `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    - `persistMigrate.test.ts` covers the bumped version;
    - `pwaPurity.test.ts` passes: the draft store, the context, the guard and the trigger bodies live
      in `src/shared` and `src/store` and import nothing from `apps/admin`, `apps/demo` or `shell`
      (the clash sheet and the email preview are Admin components);
    - the demo-trigger registry test passes (ids unique, no dashes, each `indexPath` matches its
      routes).

## Demo triggers

| Id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `concurrent-booking-save` | Someone else saves this Booking now | Admin · Booking detail (`/admin/day/:dateISO/bookings/:bookingId`) | bar | `choices`: "A different field (merges on Save)" and "The same field (clash on Save)". Reads `admin.bookingDraft` from the context hook, builds the change with `concurrentEditFor`, and saves it as `SECOND_OFFICE_ACTOR` (Tama R.) through `saveBookingPatch` (so `saveBookingChanges`) on the real store. The Admin's draft is untouched; the notice appears; the admin's next Save merges or opens the clash sheet. Message names the field, for example "Tama R. saved Time on this Booking. Press Save changes to see what happens." | No dirty draft published: "Change a field on this Booking first, and do not save". Same field with no dirty time or notes: "Change the time or the notes first". Booking cancelled or List AUTHORISED: "This Booking can no longer be edited" |
| `office-edits-booking` | Office edits this Booking | Mobile · Booking detail (`/mobile/lists/:listId/bookings/:bookingId`) | pwa | Badge `office-stand-in`. The office (`OFFICE_ACTOR`, Kirsty W.) saves one change set on this Booking through `saveBookingPatch`: the time moves 30 minutes later. The handset updates live and shows the "changed by the office" banner; History shows the grouped office save. Message: "The office moved this Booking to 09:30." | Booking cancelled, or List AUTHORISED ("This Booking is locked"), or the time would pass 23:55 |

- **Draft update email is a product action, not a trigger.** It is the real `mailto:` link on the
  saved strip, the History row and the reassign flow. Its preview panel carries a `DemoBadge` because
  it exists for presenters; it is not in the registry.
- **No hospital-feed trigger for concurrency.** The gap analysis proposed "Hospital changes this
  booking now", but after Phase 33 nothing from a hospital applies without an admin decision, so the
  second source is simulated as a second office user. A hospital row the office applies on the
  matching screen while a draft is open bumps the same row versions and is caught at Save in exactly
  the same way; mention it as a talking point, not a trigger.
- **PWA parity.** The mobile side of this phase is the arrival of an office save, which the handset
  cannot produce itself, so `office-edits-booking` is the PWA stand-in. In the framed build the
  presenter makes the change in Admin and saves. Mobile edits themselves stay immediate and need no
  trigger. The PWA never shows `concurrent-booking-save` (no Admin).

## Out of scope

- Sending or recording the email. The system only builds a `mailto:` link (US-02.3.3 "Nothing
  sent"). No outbox, no "sent" flag, no template editor. Phase 41 owns letter templates.
- Explicit save for List edits (`EditListSheet` already saves through its own sheet) and for anything
  outside the Booking detail (Review screen actions, Master data, the matching screen). OQ-46 asks
  whether List changes join the save; the recommendation covers only the reassignment email, and this
  phase builds only that.
- Drafts for anaesthetists. Mobile, web and the PWA keep immediate saves (DM-29).
- A field-by-field auto-apply policy. `MERGE_POLICY` ships empty; the mapping is for discovery with AA
  (US-02.5.6 technical discussion).
- Locking, edit presence ("Tama is editing") and real multi-user sync. The second user is simulated.
- Hospital-feed conflict simulation (see "Demo triggers").
- An as-at view for Lists, Contracts or invoices. The as-at view is for a Booking. Contract versions
  and invoice reproduction are Phase 25's.
- A patient-level history or patient view (Phase 40).
- Replacing Copy, post-op or additional-invoice behaviour. They stay commands (Phases 15 and 39).

## Manual test checklist

- [ ] Admin, Tue 21 Jul, open a Booking. Nudge the time, type in Notes, change a Procedure's Contract.
      The unsaved bar reads "3 unsaved changes" with those field names. The Day view and the
      anaesthetist's mobile Booking still show the old values.
- [ ] Undo the time by hand. The count drops to 2.
- [ ] Try Mark complete, Cancel and Copy while unsaved. Each is disabled with "Save or discard your
      changes first".
- [ ] Open Edit patient in draft mode. Its button reads Apply; the header name changes at once; nothing
      is saved yet.
- [ ] Click Day view in the side nav. The leave-without-saving dialog appears. Keep editing stays;
      Discard and leave goes, and reopening the Booking shows the old values.
- [ ] Edit again and switch app in the harness bar, then use the browser back button. Both are
      blocked, and the app switcher still shows Admin. Reload the tab: the browser's own prompt
      appears.
- [ ] Edit again (do not save) and press the harness bar's Reset. The draft discards itself with
      "This Booking was reset. Your unsaved changes were discarded." and shows the seeded values.
- [ ] Save changes. The saved strip shows "Saved · 3 changes", a mono change-set id and Draft update
      email. History shows one "Saved by Kirsty W. · 3 changes" row with before and after for each
      field.
- [ ] Change a Procedure's Contract and its anaesthetist adjustment in one save. History shows both,
      with before and after, in the one change-set row.
- [ ] In History, press View as at on an earlier entry. The panel shows the Booking as it was then,
      with the Contract name and version, and no money.
- [ ] Admin Audit viewer shows the Change set column; clicking the id filters to that save.
- [ ] Preview the email. To is the surgeon's rooms' contact email, Subject and Body list only the
      allowed changes (no Contract change, no NHI, no notes), and the character count shows. Switch
      Send to Hospital, then Both. Press Draft update email: the mail client opens with the same
      content. The audit gains no entry.
- [ ] Paste a very long Procedure description (about 1,800 characters) and change the time, then
      save. The preview says "Shortened to fit", the body ends with the shortened note (singular or
      plural as fits), the time line is still there, and the link is at most 2,000 characters.
- [ ] A Booking whose surgeon's room has no contact email: the preview says To will be left empty,
      and the link opens with an empty To.
- [ ] Edit the Notes (do not save). Demo actions, Someone else saves this Booking now, "A different
      field". The notice names Tama R. and the draft still shows your note. Save changes: the save
      merges, the strip says "merged with Tama R.'s change to Time", the Booking shows both changes,
      and History shows both saves.
- [ ] Edit the time (do not save). Fire "The same field". Save: the clash sheet shows theirs and
      yours. Keep yours: the time is yours and History shows "Clash resolved: kept yours". Repeat and
      keep theirs.
- [ ] With the trigger's menu open and no draft, the trigger is disabled with "Change a field on this
      Booking first, and do not save".
- [ ] Open the List drawer on a List that already has Bookings. Add booking opens the add flow; the
      new Booking appears in the drawer; its detail offers Draft update email.
- [ ] A free Slot still offers Book (phone advice), and the S2 Beat 2 prefill still fills.
- [ ] Reassign a List (S2 Beat 3). The flow ends on "List reassigned" with Draft update email to the
      hospital; the preview names the old and new anaesthetist and the Booking count, and no patient
      names.
- [ ] Web anaesthetist Booking: edits still save immediately (no bar, no Apply wording).
- [ ] Mobile (framed): an office save made in Admin shows the "Kirsty W. saved changes" banner on the
      open Booking.
- [ ] Installed PWA (`npm run build:pwa` and preview): on a mobile Booking, the demo sheet shows Office
      edits this Booking with the office stand-in badge; firing it moves the time and shows the
      banner; History shows the office save grouped.
- [ ] S5 jump: David Chen's History shows a grouped office save among the per-field entries.
- [ ] No en or em dashes in any new copy (bar, strip, dialog, clash sheet, preview, email, trigger
      labels and messages).
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are all green.

## Demo guide updates

- `docs/demo-guide/03-demo-script.md`:
  - **S5 Beat 1:** History now shows the office's grouped save beside per-field entries; add the
    **View as at** click and one Say line ("each save is one change set; we can show the Booking as
    it was at any point"). Update Expected.
  - **S5 discovery points** (line 410 at `1f067a8`): replace "single-user by design, audited
    last-write-wins" with optimistic concurrency: row versions, different-field edits merge,
    same-field edits go to a person; the field-by-field policy is for discovery.
  - **S2 Beat 3:** the reassignment now ends on the email step; add **Draft update email → Preview**
    and a Say line on cover emails (Vanessa's main need, OQ-46 provisional). Update Expected (the
    flow no longer auto-closes).
  - **Any beat that edits on the Admin Booking detail** (for example the S3 optional Funder allocation
    aside, and whatever 20 to 25, and 27 if DONE, scripted there): add "then **Save changes**".
  - A short optional beat after S2 Beat 2 or in S5: "Two people edit one Booking" (edit Notes, fire
    Someone else saves this Booking now, Save, show the merge; then the same-field clash).
  - Direct URLs: no new routes.
- `docs/demo-guide/04-presenter-cheat-sheet.md`: the save bar and its warning, the email preview,
  the two new triggers and where they show, and the recovery ("if a draft gets stuck, Discard").
  Rewrite discovery topic **"9. Concurrency"** (L260 at `1f067a8`, "The prototype is single-user and
  uses audited last-write-wins behaviour"): optimistic concurrency with row versions is now shown,
  and only the field-by-field auto-apply policy remains for discovery.
- `docs/demo-guide/02-workflows-and-handoffs.md`: office Booking changes are saved explicitly as one
  change set and can be followed by an update email to the rooms; cover changes email the hospital.
- `docs/demo-guide/01-personas-and-responsibilities.md`: one line naming Tama R. as a demo-only second
  office user for the concurrency beat.
- `docs/demo-guide/master-demo-guide.html`: the same sections, including the S5 discovery callout
  (L967 at `1f067a8`, "single-user, audited last-write-wins") and the "9 · Concurrency" card
  (L1105 to 1106).
- Control Panel: the S5 jump message (work item 12).
- **Milestone:** 35 is a milestone phase. End with a consistency read of `master-demo-guide.html`
  against the run sheet (S1 as rebuilt by 34 if 34 is DONE, S2, S5), and fix drift in the same
  session. Finish with a grep of `docs/demo-guide/` for "last-write-wins" and "single-user": none
  should remain.

## Adversarial review (after build)

After the manual test checklist and `npm run build` / `npm run build:pwa` / `npx vitest run` /
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**: fan out independent Opus review subagents (one each for
**quality**, **bugs and correctness** and **plan adherence**; add a fourth on the draft-store refactor,
since it touches every capture component), then this session independently verifies every finding
against the catalogue and the code, fixes the confirmed ones, re-greens, and records the pass in the
phase entry. Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**
- **Nothing bypasses the draft on Admin.** Every write from the Admin Booking detail lands in the
  draft or is a named command that is disabled while dirty. Look for a `useAppStore` left in
  `shared/booking`, `shared/capture` or a mounted flow, a blur or timer write, and a sheet that still
  says Save in draft mode. A drafted action must not touch slices outside the snapshot or emit an app
  event through the shared `emitAppEvent`; a demo Reset must discard a dirty draft.
- **Mobile, web and the PWA are unchanged.** No provider means immediate saves; no Apply wording; no
  bar; the anaesthetist never calls `saveBookingChanges`.
- **Nothing is lost silently** (US-02.5.6). A stale base with a different field keeps both; the same
  field always reaches the clash sheet; a removed-versus-edited Procedure clashes; a cancel, move or
  authorise in between blocks the save with a reason. Check that the merge uses the real current
  state at Save time, not the state at draft start.
- **Ids and invariants at save.** Draft-created ids are remapped against the real counters;
  references are rewritten; funder conservation, one primary Procedure and Contract eligibility are
  re-checked on the merged candidate, not only in the draft.
- **One save is one change set** with a header, the actor is the office, the row version rises by one,
  and `rowVersion` and the stamps never appear in audit before or after. `coalesceAudit` never merges
  across change sets.
- **As-at correctness.** Reconstruction orders by audit sequence (minute-resolution clock ties), stops
  honestly at an unknown action, and matches the snapshot after each step in the round-trip test.
- **The email.** The encoded link is at most 2,000 characters, the shortened note is present when
  lines were dropped, only allowlisted fields appear (no NHI, DOB, notes, money or Contract), recipients
  follow the OQ-46 table and are labelled provisional, and opening it writes no audit entry.
- **The unsaved guard** blocks every in-app route change and the browser back, prompts on reload, never
  blocks a clean draft, and the router migration changed no URL or Playwright entry point.
- **Triggers.** `concurrent-booking-save` acts only on the Booking in the URL and the published draft,
  writes through the real save path as Tama R., and never touches the draft; `office-edits-booking` is
  PWA-only with the office stand-in badge; both bodies sit in `src/shared` and pass `pwaPurity`.
- **Copy and design.** No en or em dashes; teal only for actions; crimson nowhere on the new surfaces;
  warning tint for unsaved, success for saved, neutral for notices.

## PROGRESS.md updates

- Status table: Phase 35 row DONE with the date.
- Phase entry "Phase 35 · Explicit save and the update email (date)":
  - the drift-check result and the OQ-46 status (recommendation built and labelled provisional, or the
    answer built);
  - the write inventory table (drafted versus command) as built;
  - the model: `rowVersion` on Booking and Procedure, `AuditEntry.changeSetId`, the `CS` id format,
    `mutate`'s `changeSet` option;
  - `PERSIST_VERSION` from and to;
  - the router migration to a data router and anything it changed in tests;
  - which seeded audit actions the as-at test had to add to the reverse table or correct;
  - tests added (changeSets, bookingAsAt, bookingSaveActions, draft store, guard, updateEmail,
    concurrentEdit, the source-scan, the web immediate-save test, the Playwright spec);
  - the adversarial review pass and what it fixed.
- Binding conventions: convention 7 gains "a save groups its audit entries under one change-set id,
  and `mutate()` bumps the Booking and Procedure row versions".
- Decisions log:
  - **Supersedes** the 2026-07-22 fourth-review #8 stance ("single-user by design, audited
    last-write-wins"): optimistic concurrency with row versions; different-field edits merge,
    same-field edits go to a person; the second user in the demo is the fictional Tama R.
  - **Extends** the 2026-07-27 audit-presentation decision: change-set grouping sits above
    view-only coalescing, and the as-at view is Admin-only and money-free.
  - New: drafted edits versus commands (and why commands are disabled while unsaved); the email field
    allowlist and the OQ-46 recipients as provisional; `MAILTO_MAX_LENGTH` as one labelled constant;
    no hospital-feed concurrency trigger after 33.
- Handoff notes:
  - **40:** the patient view can link each invoice's Booking to its as-at view.
  - **41:** prepayment letters and reminders can reuse `updateEmail.ts`'s mailto builder and length
    rule.
  - **43:** the NHI leak scan should cover email bodies built by `updateEmail.ts` (the allowlist test
    is the first guard).
  - **44:** the S5 rewrite keeps the grouped save and the as-at click; the PWA-parity audit includes
    `office-edits-booking`; the cheat sheet keeps the concurrency beat.
