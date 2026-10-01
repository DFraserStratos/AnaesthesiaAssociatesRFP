# Phase 35 · Explicit save and the update email

**Requirements covered:**
[US-02.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.1.md) Create or amend a Booking ·
[US-02.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.2.md) Save Booking changes explicitly ·
[US-02.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.3.md) Draft a booking update email (now Verify) ·
[US-02.5.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.5.md) Append-only change history ·
[US-02.5.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.6.md) Concurrent edits ·
[DM-35](../analysis/domain-model-delta.md#dm-35) Explicit-save change sets and the Booking update email draft (offered after a Booking change and after a List reassignment).
Also touches, without closing:
[US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md) (List reassignment; its Notes now say the admin is offered the update email to the hospital contact afterwards, and this phase adds it to the flow Phase 28 rebuilt),
[US-01.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.3.md) (an anaesthetist moves their own List, built by Phase 32; this phase offers the office the cover-change email afterwards, per OQ-65's recommendation),
[US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md) (the Audit viewer; this phase adds the change-set column).
No RV finding is in scope ([reverse-check.md](../analysis/reverse-check.md) has none for EP-02's save and history).
**Open questions:** answered and built as answered: [OQ-46](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-46.md) (the email is offered after any saved Booking change, to the surgeon's room, and after a List reassignment, to the hospital contact; the admin can edit it, To included) and [OQ-07](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-07.md) (optimistic concurrency with a row-version backstop). Still open, so this phase builds the recommendation, labelled provisional and kept in one place: [OQ-69](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-69.md) (a prompt after each save or an on-demand button: the on-demand button with remembered changes) and [OQ-65](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-65.md) (who is told when an anaesthetist moves their own List: the office is notified and offered the cover-change email).
**Depends on:** Phase 17 (hospital and surgeons' room contact emails, `Surgeon.roomId`), Phase 25 (Contract version history and the per-Procedure lock, which the as-at view reads and which makes AUTHORISED Bookings read-only), Phase 32 (the anaesthetist's own List move and the office's notice of it, after which the cover-change email is offered), Phase 33 (hospital rows land for an admin decision, so nothing applies silently and every inbound write goes through the guarded, versioned paths). Through them: 14 (trigger registry, context hook, shared actors), 15 (Booking vocabulary, `BookingDetailBody`, Booking source), 15a (the warning routine; warnings are derived, and clearing one is a command), 19 to 24 (the procedure-first picker, Contract, billable party, required-input, primary Procedure, base-unit override and adjustment edits that now sit inside a save), 27 (the prepayment estimate, the generated prepayment invoice and its re-check on change), 28 (`reassignList` over `moveListToSlot`), 29 and 30, and 31 (Draft Lists, which hold Bookings, and the office's Draft List assignment). **Not guaranteed before 35** (they are not in its dependency chain): 34 (the S1 rebuild; normally done first by Intake track order), 36 and later, and 39. Every work item that mentions them applies only if that phase is DONE; the drift check records which.
**Estimated:** 2 sessions, and a full two. Session 1 is the save boundary (work items 1 to 12: model, pure change-set maths, the save action, the draft store, the Admin save bar, the unsaved-changes guard and grouped history with the as-at view). Stop green there. Session 2 is concurrency, the update email (Booking changes and cover changes, including after an anaesthetist's own move) and adding a Booking to a booked List (items 13 to 21). **Spill point:** if session 1 runs long, the as-at view (work item 6 and the "View as at" part of item 12) moves to the start of session 2; nothing else depends on it. If session 2 then runs long, drop the History sheet's per-save re-draft ("Draft update email for this save", the last bullet of work item 16; no acceptance criterion needs it) and log it in the handoff for 44, rather than squeezing the demo-guide patch or the adversarial pass, which both stay in session 2.

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

**Draft update email** opens the admin's mail client (a real `mailto:` link) prefilled with a
subject, boilerplate, the list of changes and the To address, as OQ-46 answered it: the surgeon's
rooms for a change to a Booking, the hospital contact for a cover change (a new anaesthetist on a
List). The admin can switch or edit the To address and edit everything else in their mail client.
Per OQ-69's recommendation (provisional, one labelled constant) it is an **on-demand button that
remembers the changes**: the system keeps every saved change since the last email was drafted, so
two saves make one email with the net change, and pressing the button builds the draft from them. A
prompt after each save stays available as the other setting of the same constant. The cover-change
email is offered after the office reassigns a List, after the office assigns a Draft List that had
an anaesthetist before, and, per OQ-65's recommendation, from the office's notice when an anaesthetist
moves their own List into a colleague's Slot (Phase 32). Past about 2,000 characters the body is
shortened and says so. A badged preview panel shows the same email for presenters without a mail
client. The system sends nothing and never records an email as sent; it records only that a draft
was opened, which is what "since the last email" counts from.

The office can also **add a Booking to a List that already has Bookings** (or to a Draft List), and
amend a Booking's time with a proper time field rather than only the 5-minute stepper.

Anaesthetist flows (mobile, web, PWA) keep their immediate saves. The shared Booking detail stays one
component: a context decides whether its writes go to the real store (immediate) or to a draft
(Admin).

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.3.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.3.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.3.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.5.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.5.6.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.5.2.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-46.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-65.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-69.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-07.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   If an item changed, re-read it and adjust the work items before planning. If a covered item is
   now Retired or Future, drop it from this phase and say so in the PROGRESS entry. The likeliest
   changes: US-02.3.3 moving from Verify to Confirmed once OQ-65 and OQ-69 are answered, US-02.3.2
   stating whether a List reassignment goes through the explicit save (this plan treats it as its own
   event, work item 7), or US-02.5.6 gaining a field-by-field auto-apply policy (put it in
   `MERGE_POLICY`, work item 5).
2. **The update email's open points.** OQ-46 is answered at `501b0b8` (the recommendation agreed:
   Booking change to the surgeon's room, cover change to the hospital contact, editable by the admin),
   so build it as the answer with no provisional label on the recipients; Greg's hedged view that
   mainly the rooms care is already the default. Then check the two follow-ups:
   - **OQ-69** (prompt after each save, or an on-demand button). If it is still open, build the
     recommendation: the on-demand button with the changes remembered since the last email
     (`UPDATE_EMAIL_OFFER = 'onDemand'`, work item 15), with one caption "On demand from remembered
     changes (provisional, OQ-69)" in the preview panel. If it has been answered "prompt", flip the
     constant to `'promptAfterSave'` and drop the caption; the prompt variant is built and tested
     either way.
   - **OQ-65** (who is told when an anaesthetist moves their own List). If it is still open, build
     the recommendation: the office is notified (Phase 32's notice) and offered the cover-change email
     to the hospital; the colleague's notice is 32's. Caption the offer on 32's notice "Provisional
     (OQ-65)". If it has been answered, build the answer: who is offered the email after a move lives
     in `EMAIL_TRIGGERS` (work item 15), so the change is local.
3. **Confirm what earlier phases delivered** (their PROGRESS entries and handoff notes). Write these
   down before touching code, because the draft must capture every write the Booking detail can make:
   - **15:** the post-rename names (`Booking`, `BookingId`, `editBooking` + `BookingPatch`,
     `createBooking`, `cancelBooking`, `reassignBooking`, `copyBooking`, `shared/booking/`,
     `BookingDetailBody`, `AdminBookingDetail`, the route `/admin/day/:dateISO/bookings/:bookingId`),
     the Booking source values (including the office's `admin`), and where attachments now live
     (15 moved them out of `BookingPatch` into their own actions).
   - **15a:** warnings are derived by the pure routine (not stored on the Booking), so the draft
     shows the warnings its own edits would raise; clearing one (`clearWarning`, writing
     `schedule.warningClearances`) is a command that touches no Booking field.
   - **17:** `Hospital.contactEmail`, `SurgeonRoom { contactEmail, phone }`, `Surgeon.roomId`,
     `surgeonsInRoom`.
   - **19 to 24:** every Booking and Procedure field the Admin detail now edits (the procedure-first
     picker and its master procedure, Contract picker, billable party and override, required inputs,
     invoice email, not-on-schedule flag, primary Procedure, base-unit override, anaesthetist
     adjustment, and 22's typed split share) and the store action each uses. As planned they are
     `pickProcedure` (19), `setProcedureContract` (20), `setBillableParty` and `setInvoiceEmail` (21),
     `setBookingSplitShare` over `Booking.splitShares` with `validateSplitShare` (22),
     `setPrimaryProcedure` (23), and `setAnaesthetistAdjustment` and `setOfficeOverride` (24); 21's
     `approveContractSelection` and `confirmScheduleMiss` are review decisions. Confirm the real
     names. There is no insurer or funding-source field on the Booking or Procedure any more (D2,
     removed by 20), and 22 deleted `funderOverride`, `FunderAllocationSheet` and the
     `allocationNotConserved` refusals.
   - **25:** the Contract version history helper (the one that returns the version in force at a
     date) and the lock record; AUTHORISED Bookings are read-only.
   - **20 and 25 closed two of US-02.5.5's gaps** (gaps.json: "Contract chosen automatically at
     billing is not persisted or audited" and "no versioned Contracts"): confirm that every Contract
     selection (20's picker and default, audited `procedure.contract` or its successor) and every
     adjustment (24) is an audited Procedure write, and that 25's lock and version history exist. If
     either is missing, stop and report: this phase does not rebuild them.
   - **27:** the estimate input on the Procedure (`setEstimatedDuration`, office only: a drafted
     edit; the contingency units are a global setting, not a Booking edit), the approval and send
     action `approvePrepaymentInvoice` (a command), and the one re-check `syncPrepayment(api,
     bookingId, cause)`, run as the engine after commit from `createBooking`, `addProcedure`,
     `removeProcedure`, `editProcedure`, `setProcedureContract`, 21's billable-party edits,
     `setEstimatedDuration`, `setPrimaryProcedure`, `cancelBooking` and the moves. It generates,
     re-estimates or withdraws a held prepayment invoice (writing `billing` and handing off a draft
     pair), and it is idempotent. A save must run it once on the real store (work item 7), because
     the draft store's side effects are thrown away.
   - **28:** `reassignList` (over `moveListToSlot`), `ReassignListFlow`'s success step, and the Admin
     Day drawer, which 28 renamed from `ListDrawer.tsx` to `SlotDrawer.tsx` (a Slot holding a List,
     or an empty Slot with Assign List and Book (phone advice)).
   - **31:** the Draft List model (no anaesthetist, may hold Bookings), `assignDraftList`, the
     Draft List drawer (the drawer's unassigned mode, which already has **Add Booking** through 15's
     office add-Booking flow), and the unavailability path that turns Lists into Draft Lists.
   - **32:** the anaesthetist's two move actions (`moveListToOffice`, which makes a Draft List;
     `pushListToSlot`, into a colleague's free Slot), the doer's-List Booking move
     `moveBookingToDoer` (US-01.4.6), the audit codes each writes (as planned: `list.ownerMove` with
     `after.route` `office` or `colleague`, and `booking.movedToDoer`), and the office's notice of a
     move: `officeMoveNotices` in `src/store/listMoveNotices.ts` (derived from the audit, no entity,
     no dismissal), shown as the **Moved by anaesthetists** block on 31's Day dashboard band and as
     a line in `SlotDrawer`'s attention area. Work item 17 extends those rows with the cover-change
     email. Also 32's Admin trigger `colleague-moves-list-to-office`.
   - **Every action that changes a List's anaesthetist** (28's `reassignList`, 31's Draft List
     assignment, 32's two moves, any unavailability path from 29 or 31): list the action codes and the
     `before` and `after` owner fields each writes. The cover-change detector (work item 15) reads
     exactly these.
   - **34 (if DONE):** the rebuilt S1, for the milestone consistency read.
   - **33:** the matching screen's apply action. It must write through `editBooking` /
     `editProcedure` (or an equally guarded path through `mutate()`), so its writes bump row versions
     in work item 3. If it bypasses them, fix that here.
   - **14:** the registry file, `DemoContextValues`, the shared actor constants module and the PWA
     sheet's `office-stand-in` badge.
   - The current `PERSIST_VERSION` (13 at `501b0b8`; 14 to 34 will have bumped it).
4. **Build the write inventory** (it drives work items 8 and 9). Grep every store action called from
   `src/shared/booking/`, `src/shared/capture/` and the flows the Booking detail mounts, and classify
   each one. The expected result:

   | Write | Today | Admin after this phase |
   |---|---|---|
   | `editBooking` (time, notes) | immediate (stepper, notes on blur) | drafted |
   | `editPatient` (`EditPatientSheet`) | immediate sheet save | drafted; the sheet button reads "Apply" |
   | `editProcedure` (Times, Units, ASA, code, modifiers, notes, base-unit override, required inputs), `pickProcedure` (19), `setProcedureContract` (20), `setPrimaryProcedure` (23), `setAnaesthetistAdjustment` and `setOfficeOverride` (24) | immediate | drafted |
   | `addProcedure`, `removeProcedure` | immediate | drafted |
   | `addBillingLine`, `removeBillingLine`, `setBookingSplitShare` (22) | immediate | drafted |
   | `setBillableParty` (create or change, and its override) and `setInvoiceEmail` (21) | immediate | drafted |
   | `setEstimatedDuration` (27) | immediate | drafted; the save runs `syncPrepayment` on the real store |
   | attachments (15) | immediate | drafted if they live in the snapshot's slices; otherwise a command |
   | `completeBooking`, `uncompleteBooking` | command | command, disabled while unsaved |
   | `cancelBooking`, `reassignBooking` (Move), `moveBookingToDoer` (32), `copyBooking` | command | command, disabled while unsaved; cancel and the two moves write a change set |
   | `approvePrepaymentInvoice` (27); `approveContractSelection` and `confirmScheduleMiss` (21); additional invoice (39 if built) | command | command, disabled while unsaved |
   | `clearWarning` (15a) | command | command; stays enabled while unsaved (it writes only `warningClearances`, never a Booking field) |

   A write is **drafted** when it only changes the Booking, its Procedures and billing lines, its
   patient, its billable parties or its attachments. Anything that raises money, changes lifecycle
   state or creates another Booking is a **command**: it acts on the real store at once, and only
   when there are no unsaved changes. A write whose store action also touches a slice outside the
   snapshot (the List, a Slot, `billing`, `masters` other than the patient and billable parties) or
   emits an app event (`emitAppEvent` in `store/events.ts` is a module-level emitter shared by every
   store instance, so a drafted `listAuthorised` would reach the real billing run) is a command,
   whatever it looks like in the UI. The one exception is a derived follow-on that the store runs
   after an edit (27's `syncPrepayment`, which writes `billing` and hands off a draft pair): the edit
   stays drafted, and `saveBookingChanges` runs the follow-on once on the real store. In the draft
   store it is gated off (a draft-mode no-op), so a draft never generates, re-estimates or withdraws
   a prepayment invoice and never emits an app event; the prepayment panel reads "Updates when you
   save" while the draft is dirty. Record the final table in the PROGRESS entry.
5. Record the result, including "no drift", in the PROGRESS entry.

## Reference

**Design (convention 17):**
- `docs/design/Admin Day.dc.html` and `docs/design/Admin Review.dc.html`: the Admin chrome, the
  List drawer and its action row, tables, the amber advisory treatment, and the authorised-banner
  anatomy that the save strip follows (a single-line banner with a status pill, a stamp and one
  action).
- `docs/design/Design Language.dc.html`: tokens. Teal `#0D6E63` is the only action colour (Save
  changes, Draft update email, Add Booking); crimson never appears on the save bar or the clash
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

**Catalogue:** the five covered files above; US-01.4.1 and US-01.4.3 (the reassignment and the
anaesthetist's own move, after which the cover-change email is offered); OQ-46 (answered), OQ-69 and
OQ-65 (open, recommendations built), OQ-07; the evidence note
`catalogue/notes/2026-10-01-aa-meeting-with-greg.md` #22 and #60 (Greg's "a prompt after every save
would annoy" and "mainly the rooms care"); `domain-model.md` §1 row "No path for telling hospitals
about Booking changes" (rewritten at `501b0b8` with the OQ-46 recipients) and §2 "Booking" and
"Surgeon, surgeons' room and blacklist"; [US-13.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.1.md)
and [US-13.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.1.md)
(where the contact emails come from);
[US-08.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.4.md)
(invoice reproducibility, which 25 closed and the as-at view illustrates).

**Analysis:**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): theme 9 "Intake becomes staged matching" (explicit save
  with change set, then the mailto update email) and theme 2 "Anaesthetist moves own List" (US-01.4.1's
  email offer after), the DM-35 row, "Demo-trigger buttons" (Draft update email), "Uncertainty"
  (OQ-69, OQ-65), and the EP-02 table and its structural note (explicit save gated on the office
  actor so the anaesthetist apps stay write-through).
- [epics/EP-02.md](../epics/EP-02.md): US-02.3.1, US-02.3.2, US-02.3.3, US-02.5.5, US-02.5.6;
  [epics/EP-01.md](../epics/EP-01.md): US-01.4.1, US-01.4.3.
- `gaps.json`: the entries for the five covered IDs, US-01.4.1 and the `DM-35` delta.
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-35 (and DM-32 for the
  contact emails, DM-05 for the anaesthetist's own move, DM-31 for derived warnings).
- [analysis/prototype-map-shared.md](../analysis/prototype-map-shared.md) §2 (surface seam), §3
  (Booking detail body, History), §5 (flows and sheets), §6 (audit presentation);
  [prototype-map-admin.md](../analysis/prototype-map-admin.md) §1, §3 (List drawer), §4 (Booking
  flows, `AdminBookingDetail`), §10 (Audit viewer);
  [prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md) §1 and §2 (`mutate`,
  lifecycle guards);
  [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) (harness bar, the
  router, the PWA demo sheet and `pwaPurity`).

**Code entry points** (names after Phase 15; line numbers are from `501b0b8` and will have moved):
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
  `EditBillingSetupSheet.tsx`, `PriceOverrideSheet.tsx`, `RemoveProcedureSheet.tsx`,
  `CancelBookingSheet.tsx` (`CancelCardSheet.tsx` at `501b0b8`), the sheets 19 to 24 added (the
  Contract picker, billable party, split share, adjustment) and 27's `PrepaymentPanel` and
  estimated-duration control (`FunderAllocationSheet.tsx` was deleted by 22, and
  `PrepaymentOverrideSheet.tsx` by 15a);
  `shared/capture/*` (every card calls `editProcedure(useAppStore, ...)`);
  `apps/admin/flows/MoveBookingFlow.tsx` (`MoveCardFlow.tsx` at `501b0b8`) for `reassignBooking`.
- `aa-prototype/src/apps/admin/screens/AdminCardDetail.tsx` (now `AdminBookingDetail.tsx`) and its
  route wrapper in `apps/admin/routes.tsx`.
- `aa-prototype/src/apps/admin/components/ListDrawer.tsx` (`isFreeEmpty` gate, L40 and L96 to 100;
  `SlotDrawer.tsx` after 28, with 31's unassigned mode for Draft Lists and 32's attention line),
  `apps/admin/flows/PhoneAdviceBooking.tsx` (`isScriptedS2Booking`), `apps/admin/flows/ReassignListFlow.tsx`
  (at `501b0b8` it ends on a `SuccessOverlay` "List reassigned" that auto-dismisses through
  `onReassigned`, L42 to 48 and L124 to 131), `apps/admin/screens/AuditViewer.tsx`; Phase 31's Draft
  List screen and `assignDraftList` flow, and Phase 32's `officeMoveNotices` rows on the Day band
  and in `SlotDrawer` (confirm the names from their PROGRESS entries).
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
   - `ChangeSetId = string`; `AuditEntry.changeSetId?: ChangeSetId` (DM-35: a change set is a group of
     audit entries, not a new collection, so there is one history, not two).
   - `ChangeSetKind = 'save' | 'create' | 'cancel' | 'move' | 'listReassign'` (`listReassign` covers
     every change of a List's anaesthetist: the office's reassignment, 31's Draft List assignment and
     32's two moves; `move` covers a Booking moved to another List, including 32's doer's-List move).
   - No change-set slice. The "fields changed since the previous save" (US-02.3.2 "Changes known")
     are derived from the audit by change-set id.
   - **The last-email mark** (US-02.3.2 "Changes known": "it also keeps the changes since the last
     email"; OQ-69's recommendation): `UpdateEmailMark { key: string; throughSeq: number; atISO;
     by; role; recipient: 'rooms' | 'hospital' | 'both' | 'none' }`, keyed `booking:<BookingId>` or
     `list:<ListId>`, stored in `schedule.updateEmailMarks: Record<string, UpdateEmailMark>` beside
     15a's `warningClearances` (not a field on the Booking or List, so drafting an email bumps no row
     version, changes no `lastModifiedBy` and never touches a locked Booking). `throughSeq` is the
     audit length when the draft was opened: "changes since the last email" are the change sets
     after it, ordered by audit sequence. Empty at seed. This records that a draft was opened, never
     that anything was sent.
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
   - `schedule.updateEmailMarks` seeds empty; thread it through `freshAppState`, `backfillMerge`,
     `DomainPatch` and `resetDomainState` exactly as 15a threaded `warningClearances`.
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
     than re-implementing them: a valid split share (22's `validateSplitShare`, and its
     `contractNotSplit` refusal for a share on a Contract that bills one party in full), exactly one
     primary Procedure (23), a Contract the Procedure is eligible for (20's filter, by procedure and
     hospital). A failure refuses with that guard's own message. Warnings (15a) are derived and never
     refuse a save.
   - One `mutate(..., { changeSet: 'save' })`: one meta per changed entity, reusing the existing
     action codes (`booking.update`, `procedure.update`, `procedure.create`, `procedure.remove`,
     `billingLine.*`, `patient.update`, `billableParty.*`) so labels and the as-at reverse table work
     unchanged, plus a header meta `booking.save` on the Booking with
     `after: { kind, fields: FieldRef[], kept: FieldRef[], resolved: { field; chose }[] }`.
   - **Derived follow-ons run once, for real.** After the commit, call `syncPrepayment(api,
     bookingId, cause)` once on the real store. It writes its own engine rows (actor "Billing
     engine"), not part of the office's change set. A save that adds a Procedure on the
     anaesthetist's prepaid list for a patient billable party yields exactly one held prepayment
     invoice (not none, not two); a save that changes nothing 27 reads leaves the prepayment as it
     was (27's run is idempotent).
   - `cancelBooking`, `reassignBooking`, `createBooking`, `reassignList` and `assignDraftList` (31)
     accept `{ changeSet?: ChangeSetKind }` and pass it to `mutate`; the Admin callers pass
     `cancel`, `move`, `create` and `listReassign`. 32's `moveListToOffice` and `pushListToSlot` pass
     `listReassign`, and `moveBookingToDoer` passes `move`, **whichever app calls them**, so the
     email can follow them (OQ-46, OQ-65). Other mobile and web callers pass nothing.
   - **A List reassignment is its own event, not a save** (US-02.3.2 leaves open whether it goes
     through the explicit save): it applies at once from its flow, as today, and carries its own
     `listReassign` change set. An open Booking draft on that List is caught at Save only if the
     reassignment touched the Booking itself; otherwise the draft saves normally onto the List's new
     anaesthetist.
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
     draft-created Procedure gets a fresh id when the real store allocated one meanwhile; a save
     carrying an invalid split share refuses with 22's message; a save adding a prepaid-list
     Procedure yields one held prepayment invoice on the real store.
8. **The draft store** (`src/shared/booking/draft/`; DM-35 "anaesthetist mobile flows keep immediate
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
   - The draft store is never persisted, never wired to the billing run, runs `syncPrepayment` as a
     no-op (a draft-mode flag on the store), and its own audit entries are thrown away: Save writes
     the net change set to the real store.
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
     with `useBookingApi()`. At `501b0b8` `shared/card`, `shared/capture` and `shared/flows` hold 25
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

### Session 2: concurrency, the update email and Add Booking

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
15. **The update email builder and the remembered changes** (`src/domain/updateEmail.ts` +
    `updateEmail.test.ts`, pure; US-02.3.3 "Compose window", "To address", "Length", "Nothing sent";
    US-02.3.2 "Changes known"; OQ-46 answered; OQ-69 and OQ-65 recommendations):
    - `buildBookingUpdateEmail({ changes, context, to, signature })` and
      `buildCoverChangeEmail({ list context, fromAnaesthetist, toAnaesthetist, bookingCount, to,
      signature })` return `{ to; subject; body; href; shortened; omittedCount; length }`.
    - `EMAIL_TRIGGERS` (the OQ-46 answer, one table, no provisional label): Booking change sets of
      kind save, create, cancel and move go to the **surgeon's room**; a cover change (a new
      anaesthetist on a List, from any `listReassign` change set) goes to the **hospital contact**.
      The row for an anaesthetist's own move into a colleague's Slot is marked OQ-65 in a comment
      (its recommendation: the office is offered the cover-change email); a move to the office makes a
      Draft List with no anaesthetist, so it is not yet a cover change and offers nothing until the
      office assigns it. **A doer move** (`moveBookingToDoer`, US-01.4.6) moves one Booking to another
      anaesthetist's List: no List changes hands, so under OQ-46 it is a change to a Booking (a `move`
      change set, the rooms, on demand from that Booking), not a cover change. 32's handoff note
      called it a cover change; this plan follows OQ-46's definition ("a new anaesthetist on a
      List"), and the reading is one row of `EMAIL_TRIGGERS` if AA wants the hospital told.
    - `UPDATE_EMAIL_OFFER: 'onDemand' | 'promptAfterSave' = 'onDemand'` (one labelled constant, with
      a comment quoting OQ-69 and OQ-46's answer: "Greg thinks a prompt after every save would annoy
      users"). `onDemand`: the
      button is always there while remembered changes exist. `promptAfterSave`: the saved strip also
      opens a one-line prompt "Email the rooms about this change? Draft update email · Not now". Both
      paths are built and covered by a component test that renders each value.
    - **Remembered Booking changes** (pure): `changesSinceLastEmail(audit, bookingId, mark)` takes the
      Booking's change sets after `mark.throughSeq` (all of them when there is no mark), in audit
      order, and nets them per field: the first `before`, the last `after`, dropping a field that netted
      back to its original value. A Procedure added and removed again since the mark nets to nothing.
      Entries with no change set (anaesthetist immediate edits, seed history) are not remembered: the
      email is built from the office's saved changes and the moves that carry a change set.
    - **Cover-change detection** (pure): `coverChangeSinceLastEmail(audit, listId, mark, currentOwner)`
      reads the owner changes after the mark (the action codes the drift check listed for 28, 31 and
      32); the baseline is the owner before the first of them, the current owner is the List's now. No
      change, a return to the baseline, or no current anaesthetist gives `null`. So reassigning twice
      makes one email from the first to the last anaesthetist, and a List moved to the office and then
      assigned to Dr Sharma by the office gives "Dr Rutherford is no longer the anaesthetist... Dr
      Sharma will be".
    - `EMAIL_FIELDS` allowlist with plain labels: time, patient name, Procedure description (added,
      removed, changed), cancellation, move to another List (date and session, and the anaesthetist
      where the move changed it, as a doer move does), hospital and surgeon where they changed.
      **Never** in an email: NHI, date of birth, internal notes, Contract, billable party, prices,
      overrides, adjustments, split shares, units, captured times, estimates or warnings. Remembered
      changes all outside the allowlist offer no email ("Nothing since the last email is for the
      rooms").
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
      The default choice comes from `EMAIL_TRIGGERS`. A Draft List has a surgeon and a hospital (31), so
      it resolves the same way; a List with no surgeon has no rooms address (To empty, with the reason
      "No surgeon on this List"), never a thrown lookup.
    - Vitest: fields outside the allowlist never appear; two saves since the mark net to one change
      per field and a field changed and changed back drops out; changes before the mark are not
      included; anaesthetist edits with no change set are not included; cover detection over a double
      reassignment, a return to the original anaesthetist (null) and a move to the office then an
      office assignment; an over-long change set gives `href.length <= 2000`, `shortened` and the note;
      a short one is not shortened; encoding of `&`, `?`, `#`, `+`, apostrophes, line breaks and
      macrons (Māori names) round-trips through `decodeURIComponent`; no `–` or `—` anywhere in
      subject or body; an empty `to` is valid.
16. **Draft update email on the Admin Booking detail** (US-02.3.3; OQ-69's on-demand button):
    - **The on-demand button.** The Booking detail's action row shows **Draft update email** (teal
      secondary, `Mail` icon) whenever `changesSinceLastEmail` has allowlisted changes, with a mono
      count "2 changes since the last email", and **Preview**. The saved strip (work item 10) repeats
      it straight after a save. It is a real `<a href={mailto}>`. While the draft is dirty it is
      disabled with "Save your changes first. The email uses saved changes." (it is built from saved
      changes only, and a dirty page's `beforeunload` guard must never fire on a `mailto:` click).
    - **Opening the draft** writes one audited entry through `recordUpdateEmailDrafted(api, actor,
      { key, recipient })` (office only): it sets the `UpdateEmailMark` to the current audit length,
      action `updateEmail.drafted`, label "Update email drafted (not sent)", `stampBookingId: null`.
      Nothing else: no "sent" flag, no outbox, no copy of the body or address (AC "Nothing sent"). The
      button then reads "No changes since the last email" until the next saved change.
    - **Send to:** "Surgeon's rooms · Hospital · Both" (default from `EMAIL_TRIGGERS`: rooms for a
      Booking), with the resolved address shown, or "No contact email held for Riverside Orthopaedic
      Rooms. To will be left empty." The admin edits To and everything else in their mail client (AC
      "To address": "the admin can edit it either way").
    - **Preview panel** `UpdateEmailPreview` (`data-shot="update-email-preview"`) with
      `DemoBadge label="Demo preview"`: To, Subject, and Body in mono with pre-wrap; "1,184 of 2,000
      characters"; a "Shortened to fit" pill when `shortened`; a line naming what the changes are
      since ("Since the last email, drafted by Kirsty W. at 09:14", or "Since the Booking was created");
      the caption "On demand from remembered changes (provisional, OQ-69)"; and one line: "Opens in
      your mail client. The system does not send it." Previewing writes nothing.
    - In the History sheet, each change-set row (Admin only) also has **Draft update email for this
      save**, built from that one change set; it writes the same "drafted" entry but does not move
      the mark (it is a re-send of an older change, not the latest). `updateEmail.drafted` entries
      show in History as their own rows.
17. **Cover-change email: reassignment, Draft List assignment and the anaesthetist's own move**
    (OQ-46 answered; OQ-65's recommendation; US-01.4.1 Notes; US-02.3.3's main trigger):
    - `ReassignListFlow` (as 28 rebuilt it): replace the auto-dismissing `SuccessOverlay` with a final
      step: "List reassigned to Dr Sharma", **Draft update email to St George's** (the hospital
      contact), **Preview** and **Done**. The reassignment's metas carry `changeSet: 'listReassign'`.
    - 31's Draft List assignment: when `coverChangeSinceLastEmail` finds a change (the List had an
      anaesthetist before, for example one moved to the office or made a Draft List by
      unavailability), its success state makes the same offer. A Draft List that never had an
      anaesthetist offers nothing (not a cover change).
    - **32's office move notices** (OQ-65; `officeMoveNotices` rows on the Day band's **Moved by
      anaesthetists** block and the `SlotDrawer` attention line): each row for a `list.ownerMove`
      into a colleague's Slot gains **Draft update email to <hospital>** and **Preview**, with the
      caption "Provisional (OQ-65)", shown while `coverChangeSinceLastEmail` finds a change. A row for
      a move to the office says "The cover email will be offered when you assign this List." A
      `booking.movedToDoer` row offers no hospital email (work item 15) and links to the Booking,
      whose on-demand button covers the rooms. 32's colleague notices are unchanged.
    - **The drawer** (`SlotDrawer` for a List, and its Draft List mode) shows the same on-demand
      button whenever the List has a cover change since its last email, so an offer passed over in
      the flow is never lost. Opening any of them records `updateEmail.drafted` against
      `list:<ListId>`.
    - Update `ReassignListFlow.test.tsx`: success shows the offer and no longer auto-closes, and the
      `mailto` To is the hospital's contact email. Add a test on 32's notice: after an anaesthetist
      moves a List into Dr Sharma's Slot, the office notice offers the email, To is the hospital, and
      the body names both anaesthetists and the Booking count, with no patient names. And a doer-move
      row offers no hospital email.
18. **Add a Booking to a booked List, and the "changed by the office" notice** (US-02.3.1: "create a
    new Booking on a List"):
    - `SlotDrawer` (a Slot holding a List): the Bookings section header gets **Add Booking** (teal,
      `data-shot="list-add-booking"`, the same control and label 31 put on the Draft List drawer, so
      there is one control, not two) on any List the office may edit (approval state DRAFT or
      SUBMITTED, not AUTHORISED), whether or not it already has Bookings. It opens 15's office
      add-Booking flow (`AddBookingFlow` with the office actor and that List; no hospital step: the
      List already has one) and the procedure-first picker (19). Booking source `admin` (15); the new
      Booking takes the default Contract (20); `createBooking` carries `changeSet: 'create'` from both
      drawers, so it is remembered for the rooms email; `syncPrepayment` runs as it does for any
      created Booking.
    - **Book (phone advice)** stays for a free Slot without a List, and the `isScriptedS2Booking`
      prefill still works (S2 Beat 2).
    - **Changed by the office notice** (in `BookingDetailBody`, all surfaces): when a change set saved
      by another actor lands on this Booking while the screen is open (compare
      `lastChangeSetFor` with the value at mount), a neutral one-line banner shows "Kirsty W. saved
      changes to this Booking: Time. View history", dismissible. On mobile it sits under the masthead
      and never covers the completion dock or 15a's warning triangle.
19. **Register the demo triggers** (Phase 14's registry; details in "Demo triggers" below). Bodies
    live in `src/shared/demoTriggers/`, so `pwaPurity` holds. Nothing is added to the Control Panel
    page; its index lists the new entries automatically.
20. **Playwright** (`npm run shots`): add `visual/admin-phase35.spec.ts` with shots of the unsaved bar
    with three changes, the leave-without-saving dialog, a grouped save in History with the as-at
    panel open, the clash sheet (fired by the trigger), the saved strip with the on-demand button and
    the email preview (two saves remembered), the reassign flow's email step, 32's office move notice
    with the email offer, and the drawer's Add Booking on a booked List. Keep every existing Admin
    Booking spec passing: any spec that edits on the Admin Booking detail now presses **Save
    changes** (grep the `visual/` specs for Admin Booking edits), and any spec that waited for the
    reassign overlay to auto-close now presses **Done**.
21. **Finish green:**
    - `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    - `persistMigrate.test.ts` covers the bumped version;
    - `pwaPurity.test.ts` passes: the draft store, the context, the guard and the trigger bodies live
      in `src/shared` and `src/store` and import nothing from `apps/admin`, `apps/demo` or `shell`
      (the clash sheet and the email preview are Admin components);
    - the demo-trigger registry test passes (ids unique, no dashes, each `indexPath` matches its
      routes);
    - the source-scanning label test covers `booking.save` and `updateEmail.drafted`.

## Demo triggers

| Id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `concurrent-booking-save` | Someone else saves this Booking now | Admin · Booking detail (`/admin/day/:dateISO/bookings/:bookingId`) | bar | `choices`: "A different field (merges on Save)" and "The same field (clash on Save)". Reads `admin.bookingDraft` from the context hook, builds the change with `concurrentEditFor`, and saves it as `SECOND_OFFICE_ACTOR` (Tama R.) through `saveBookingPatch` (so `saveBookingChanges`) on the real store. The Admin's draft is untouched; the notice appears; the admin's next Save merges or opens the clash sheet. Message names the field, for example "Tama R. saved Time on this Booking. Press Save changes to see what happens." | No dirty draft published: "Change a field on this Booking first, and do not save". Same field with no dirty time or notes: "Change the time or the notes first". Booking cancelled or List AUTHORISED: "This Booking can no longer be edited" |
| `office-edits-booking` | Office edits this Booking | Mobile · Booking detail (`/mobile/lists/:listId/bookings/:bookingId`) | pwa | Badge `office-stand-in`. The office (`OFFICE_ACTOR`, Kirsty W.) saves one change set on this Booking through `saveBookingPatch`: the time moves 30 minutes later. The handset updates live and shows the "changed by the office" banner; History shows the grouped office save. Message: "The office moved this Booking to 09:30." | Booking cancelled, or List AUTHORISED ("This Booking is locked"), or the time would pass 23:55 |

- **Draft update email is a product action, not a trigger.** It is the real `mailto:` link on the
  Admin Booking detail (the on-demand button and the saved strip), the History row, the reassign
  flow's last step, 31's Draft List assignment, the List drawer and 32's office move notice. Its
  preview panel carries a `DemoBadge` because it exists for presenters; it is not in the registry.
- **The office side of an anaesthetist's move** needs an anaesthetist to move a List first. In the
  framed build the presenter moves it on mobile (Phase 32's flow) and switches to Admin; to stay in
  Admin, use 32's `colleague-moves-list-to-office` trigger on the Day view, then assign the Draft
  List: the assignment offers the cover email. This phase adds no trigger for it.
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

- Sending the email or recording it as sent. The system only builds a `mailto:` link (US-02.3.3
  "Nothing sent") and records that a draft was opened, which is what "since the last email" counts
  from. No outbox, no "sent" flag, no stored body, no template editor. Phase 41 owns letter templates.
- Explicit save for List edits (`EditListSheet` already saves through its own sheet) and for anything
  outside the Booking detail (Review screen actions, Master data, the matching screen). US-02.3.2 does
  not say whether a List reassignment goes through the explicit save; this phase treats it as its own
  event with its own change set, and the cover-change email follows it (OQ-46).
- A settings screen for `UPDATE_EMAIL_OFFER`. It is one labelled constant until OQ-69 is answered.
- Notifying anyone other than the office after an anaesthetist's move. 32 owns the office and
  colleague notices; this phase only adds the email offer to the office's (OQ-65).
- Drafts for anaesthetists. Mobile, web and the PWA keep immediate saves (DM-35).
- A field-by-field auto-apply policy. `MERGE_POLICY` ships empty; the mapping is for discovery with AA
  (US-02.5.6 technical discussion).
- Locking, edit presence ("Tama is editing") and real multi-user sync. The second user is simulated.
- Hospital-feed conflict simulation (see "Demo triggers").
- An as-at view for Lists, Contracts or invoices. The as-at view is for a Booking. Contract versions
  and invoice reproduction are Phase 25's.
- A patient-level history or patient view (Phase 40).
- Replacing Copy, additional-invoice or pre-op and post-op event behaviour. They stay commands
  (Phases 15, 39 and 39b).

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
      allowed changes (no Contract change, no NHI, no notes), the character count shows, and the
      caption reads "On demand from remembered changes (provisional, OQ-69)"; the recipient choice
      carries no provisional label. Switch Send to Hospital, then Both. Press Draft update email: the
      mail client opens with the same content. History gains one "Update email drafted (not sent)"
      row and nothing says sent; the button now reads "No changes since the last email".
- [ ] Remembered changes: change the time and save; change the time again and add a Procedure and
      save. Without drafting in between, the button reads "2 changes since the last email" and the
      body shows the time once (first value to last) and the added Procedure. Change a field and
      change it back across two saves: it drops out of the email.
- [ ] While the draft is dirty, Draft update email is disabled with "Save your changes first. The
      email uses saved changes."
- [ ] In History, Draft update email for an older save builds an email from that save alone and does
      not reset the "since the last email" count.
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
- [ ] Open the List drawer on a List that already has Bookings. Add Booking opens the add flow; the
      new Booking appears in the drawer; its detail offers Draft update email. Add Booking also works
      on a Draft List, and the Booking takes the default Contract.
- [ ] A free Slot still offers Book (phone advice), and the S2 Beat 2 prefill still fills.
- [ ] Reassign a List (S2 Beat 3). The flow ends on "List reassigned" with Draft update email to the
      hospital and Done (no auto-close); the preview names the old and new anaesthetist and the
      Booking count, and no patient names. Press Done without drafting: the List drawer still offers
      the cover email.
- [ ] Reassign the same List twice without drafting: one email from the first to the last
      anaesthetist. Reassign it back to the original anaesthetist: no cover email is offered.
- [ ] As an anaesthetist on mobile, move your own List into a colleague's free Slot (Phase 32). In
      Admin, 32's office notice of the move offers Draft update email to the hospital, captioned
      "Provisional (OQ-65)"; the To is the hospital contact.
- [ ] As an anaesthetist, move a List to the office. The office notice says the cover email will be
      offered on assignment; assign the Draft List to Dr Sharma, and the assignment offers the email
      naming the original anaesthetist and Dr Sharma.
- [ ] Move a Booking to the anaesthetist who did it (32). Its office notice row offers no hospital
      email; the Booking's on-demand button offers the rooms email naming the new anaesthetist.
- [ ] A save that adds a Procedure on the anaesthetist's prepaid list (patient billable) creates one
      held prepayment invoice for admin approval, not two and not none (27's re-check runs once, on
      the real store).
- [ ] Web anaesthetist Booking: edits still save immediately (no bar, no Apply wording).
- [ ] Mobile (framed): an office save made in Admin shows the "Kirsty W. saved changes" banner on the
      open Booking.
- [ ] Installed PWA (`npm run build:pwa` and preview): on a mobile Booking, the demo sheet shows Office
      edits this Booking with the office stand-in badge; firing it moves the time and shows the
      banner; History shows the office save grouped.
- [ ] S5 jump: David Chen's History shows a grouped office save among the per-field entries.
- [ ] No en or em dashes in any new copy (bar, strip, dialog, clash sheet, preview, email, trigger
      labels and messages).
- [ ] Catalogue screenshots: the recipes for US-02.3.1, US-02.3.2, US-02.3.3, US-02.5.5 and US-02.5.6 are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

- `docs/demo-guide/03-demo-script.md`:
  - **S5 Beat 1:** History now shows the office's grouped save beside per-field entries; add the
    **View as at** click and one Say line ("each save is one change set; we can show the Booking as
    it was at any point"). Update Expected.
  - **S5 discovery points** (line 410 at `501b0b8`): replace "single-user by design, audited
    last-write-wins" with optimistic concurrency: row versions, different-field edits merge,
    same-field edits go to a person; the field-by-field policy is for discovery.
  - **S2 Beat 3:** the reassignment now ends on the email step; add **Draft update email → Preview**
    and a Say line on cover emails ("Vanessa's main need: the hospital hears about a cover change
    without her typing it, agreed with AA"). Update Expected (the flow no longer auto-closes; press
    Done).
  - **The anaesthetist's own move beat** (as 32 scripted it): add the office side, the move notice's
    **Draft update email** to the hospital, with a Say line that who else is told is still being
    confirmed (OQ-65).
  - **The rooms email:** in S2 after Beat 2 or in S5, save two changes on one Booking and show the
    on-demand button's "2 changes since the last email" and the netted body. Say line: "AA felt a
    prompt after every save would annoy, so the system remembers the changes and the office emails
    them when ready" (our recommendation for OQ-69, still to confirm).
  - **Any beat that edits on the Admin Booking detail** (whatever 19 to 27 scripted there, for
    example a Contract pick, a billable-party override or an estimate edit): add "then **Save
    changes**".
  - A short optional beat after S2 Beat 2 or in S5: "Two people edit one Booking" (edit Notes, fire
    Someone else saves this Booking now, Save, show the merge; then the same-field clash).
  - Direct URLs: no new routes.
- `docs/demo-guide/04-presenter-cheat-sheet.md`: the save bar and its warning, the on-demand email
  button and its preview (remembered changes, rooms for a Booking, hospital for a cover change,
  including after an anaesthetist's move), the two new triggers and where they show, and the recovery
  ("if a draft gets stuck, Discard"; "if the email offer was passed over, the List drawer or the Booking
  still has it").
  Rewrite discovery topic **"9. Concurrency"** (L260 at `501b0b8`, "The prototype is single-user and
  uses audited last-write-wins behaviour"): optimistic concurrency with row versions is now shown,
  and only the field-by-field auto-apply policy remains for discovery.
- `docs/demo-guide/02-workflows-and-handoffs.md`: office Booking changes are saved explicitly as one
  change set, and the office drafts an update email to the rooms on demand from the changes since the
  last one; cover changes (an office reassignment, a Draft List assignment, or an anaesthetist's own
  move into a colleague's Slot) email the hospital contact.
- `docs/demo-guide/01-personas-and-responsibilities.md`: one line naming Tama R. as a demo-only second
  office user for the concurrency beat.
- `docs/demo-guide/master-demo-guide.html`: the same sections, including the S5 discovery callout
  (L967 at `501b0b8`, "single-user, audited last-write-wins") and the "9 · Concurrency" card
  (L1105 to 1106).
- Control Panel: the S5 jump message (work item 12).
- **Milestone:** 35 is a milestone phase. End with a consistency read of `master-demo-guide.html`
  against the run sheet (S1 as rebuilt by 34 if 34 is DONE, S2 including 32's move beat, S5), and fix
  drift in the same
  session. Finish with a grep of `docs/demo-guide/` for "last-write-wins" and "single-user": none
  should remain.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 35` first: earlier phases may have
changed these recipes since this plan was written (Phase 33 may have left placeholder `absent`
recipes for US-02.3.2 and US-02.3.3, and Phase 28 and 31 moved the drawer and the Booking routes).
The harness bar is hidden in shots, so the concurrent save is staged from the `/demo/control` entry
for "Someone else saves this Booking now" in `setup` if it is runnable there; otherwise the clash
sheet is shot from a `setup` that edits and saves in a second browser step (ATLAS.md, Shell).

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-02.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.1.md) Create or amend a Booking | partial · admin-phone-advice-booking[free-list,form] admin-amend-booking | captured (admin). Keep `phone-advice-booking`. Re-shoot `amend-booking` as the draft: an edit on the Admin Booking detail opens the Apply sheet and the unsaved bar (`booking-save-bar`, "3 changes") shows. Add `add-booking-booked-list` (the List drawer on a List that already has Bookings, **Add Booking** highlighted via `list-add-booking`, then the office add-Booking flow open). Drop the partial reason. Caption: "The office creates a Booking on a List, or amends one, and each change is recorded against them" |
| [US-02.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.2.md) Save Booking changes explicitly | none (create it); a placeholder `absent` may exist | captured (admin). Shots: `save-bar` (unsaved bar listing the changed fields, before/after, `booking-save-bar`), `leave-guard` (the leave-without-saving dialog after navigating away with unsaved edits), `saved-history` (after Save changes: History shows one grouped save with who and when, `booking-as-at` open). Replace the placeholder |
| [US-02.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.3.md) Draft a booking update email | none (create it); a placeholder `absent` may exist | captured (admin). Shots: `email-offer` (the saved strip with the on-demand button), `email-preview` (`update-email-preview` with To the surgeon's room, subject, boilerplate and the list of changes, "Nothing is sent" visible), and `cover-change-email` (the reassign flow's last step offering the hospital contact email, built from the reassignment). Highlight the preview panel. Captions: "Update email drafted from the saved changes; the office reviews and sends it themselves" |
| [US-02.5.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.5.md) Append-only change history | captured · admin-card-history, admin-audit-log | captured, re-shot: `card-history` now shows the grouped change sets and the as-at panel (`booking-as-at`, no money shown); `audit-log` shows the change-set column. Keep both shot `name`s |
| [US-02.5.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.6.md) Concurrent edits | absent | captured (admin). Shots: `merged-notice` (a different-field concurrent save by Tama R. merges on Save, with the admin told) and `clash-sheet` (a same-field clash, `booking-clash-sheet`, "Tama R. saved this Booking while you were editing"), plus on mobile (PWA stand-in "Office edits this Booking") `office-edit-banner` (the "Kirsty W. saved changes to this Booking" banner). Remove the absent reason |

**Recipes this phase breaks.** Admin Booking detail edits are now draft-then-save, History groups by
change set, and the reassign flow no longer auto-closes. Found at plan time:
- `US-02.3.1` `amend-booking`: re-shot as above (the Edit sheet now applies to the draft).
- `US-02.5.5` `card-history` and `audit-log`, and `US-02.5.1` `card-history`: the History tab shows
  grouped saves and the as-at control; check the `[role=dialog]` highlight still lands.
- `US-13.5.2` `audit-viewer` (`/admin/audit`): gains the change-set column; check only.
- `US-01.4.1` `reassign`, state `after`: it waits 2500ms then presses Escape expecting the overlay to
  auto-close. It now ends on the email step; press Done instead and keep the shot `name`s.
- Recipes that edit on the Admin Booking detail and then expect the change to be saved by the sheet:
  `US-04.3.2` `contract-picker`, `US-04.3.4` `billing-setup`, `US-07.2.2` `correct-contract`,
  `US-11.2.2` `guardian-payer` (the "Edit billing setup" sheet), `US-05.4.2` and `US-07.2.3`
  `price-override` (its "Save override" button), `US-11.1.1` `edit-patient`. They only open the sheets
  today, so most keep working; any that now needs the buttons to read **Apply** (draft mode) or a
  **Save changes** step is updated. The `--dry` run is the check.

**ATLAS.md.** Update Routes (the data-router migration changes no URL; note the Booking route name as
built), Existing hooks (`booking-save-bar`, `booking-as-at`, `booking-clash-sheet`,
`update-email-preview`, `list-add-booking`), Overlays (the leave-without-saving dialog, the clash
sheet, the email preview, the reassign flow's email step) and the Admin selector tips (sheet buttons
read Apply in draft mode; Save changes in the bar).

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
  references are rewritten; split-share validity, one primary Procedure and Contract eligibility are
  re-checked on the merged candidate, not only in the draft.
- **One save is one change set** with a header, the actor is the office, the row version rises by one,
  and `rowVersion` and the stamps never appear in audit before or after. `coalesceAudit` never merges
  across change sets.
- **As-at correctness.** Reconstruction orders by audit sequence (minute-resolution clock ties), stops
  honestly at an unknown action, and matches the snapshot after each step in the round-trip test.
- **The email.** The encoded link is at most 2,000 characters, the shortened note is present when
  lines were dropped, only allowlisted fields appear (no NHI, DOB, notes, money or Contract), and
  recipients follow `EMAIL_TRIGGERS` as OQ-46 answered it (rooms for a Booking change, the hospital
  contact for a cover change; no provisional label on them). Opening a draft writes exactly one
  `updateEmail.drafted` entry and moves only the mark: nothing is labelled or stored as sent, no body
  or address is kept, and no row version or `lastModifiedBy` changes.
- **Remembered changes** (OQ-69's recommendation). "Since the last email" counts by audit sequence
  from the mark; change sets net per field; a field changed back drops out; entries with no change set
  never appear; a History re-draft of an older save does not move the mark; a demo Reset clears the
  marks. `UPDATE_EMAIL_OFFER` is the only switch, and both values work.
- **Cover changes everywhere a List changes hands.** The reassign flow, 31's Draft List assignment, the
  List drawer and 32's office move notice all offer it from `coverChangeSinceLastEmail`; a double
  reassignment makes one email; a return to the original anaesthetist and a move to the office offer
  nothing; a doer move offers no hospital email (it is a Booking `move`, for the rooms); 32's moves
  carry their change set whichever app calls them.
- **Derived follow-ons.** A save runs `syncPrepayment` once on the real store; in the draft store it
  is a no-op, so a draft never touches `billing` or emits an app event.
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
  - the drift-check result; OQ-46 built as answered; the OQ-69 and OQ-65 status (recommendation built
    and labelled provisional, or the answer built, and the `UPDATE_EMAIL_OFFER` value shipped);
  - what 31 and 32 delivered that this phase hooks into (the owner-change action codes, the Draft List
    assignment and the office move notice);
  - the write inventory table (drafted versus command) as built;
  - the model: `rowVersion` on Booking and Procedure, `AuditEntry.changeSetId`, the `CS` id format,
    `mutate`'s `changeSet` option, `schedule.updateEmailMarks`;
  - `PERSIST_VERSION` from and to;
  - the router migration to a data router and anything it changed in tests;
  - which seeded audit actions the as-at test had to add to the reverse table or correct;
  - tests added (changeSets, bookingAsAt, bookingSaveActions, draft store, guard, updateEmail with
    remembered changes and cover detection, the offer-mode component test, concurrentEdit, the
    source-scan, the web immediate-save test, the reassign and move-notice tests, the Playwright spec);
  - the Catalogue screenshots result: recipes created or changed, the REPORT.md counts (captured,
    partial, absent, failed) before and after, and any partial reason handed to a later phase;
  - the adversarial review pass and what it fixed.
- Binding conventions: convention 7 gains "a save groups its audit entries under one change-set id,
  and `mutate()` bumps the Booking and Procedure row versions".
- Decisions log:
  - **Supersedes** the 2026-07-22 fourth-review #8 stance ("single-user by design, audited
    last-write-wins"): optimistic concurrency with row versions; different-field edits merge,
    same-field edits go to a person; the second user in the demo is the fictional Tama R.
  - **Extends** the 2026-07-27 audit-presentation decision: change-set grouping sits above
    view-only coalescing, and the as-at view is Admin-only and money-free.
  - New: drafted edits versus commands (and why commands are disabled while unsaved, and why 27's
    re-check runs at save); the email field allowlist; the OQ-46 recipients as answered; the on-demand
    button with remembered changes and the "drafted, not sent" mark as OQ-69's provisional
    recommendation in one constant; the office's cover email after an anaesthetist's move as OQ-65's
    provisional recommendation; a List reassignment as its own event, not a save; a doer move as a
    Booking change for the rooms, not a cover change (OQ-46's "a new anaesthetist on a List");
    `MAILTO_MAX_LENGTH` as one labelled constant; no hospital-feed concurrency trigger after 33.
- Handoff notes:
  - **40:** the patient view can link each invoice's Booking to its as-at view.
  - **41:** prepayment letters and reminders can reuse `updateEmail.ts`'s mailto builder and length
    rule.
  - **43:** the NHI leak scan should cover email bodies built by `updateEmail.ts` (the allowlist test
    is the first guard).
  - **44:** the S5 rewrite keeps the grouped save and the as-at click; S2 keeps the reassign email
    step and the office side of 32's move; the PWA-parity audit includes `office-edits-booking`; the
    cheat sheet keeps the concurrency beat; the drift check re-reads OQ-69 and OQ-65 and flips
    `UPDATE_EMAIL_OFFER` or `EMAIL_TRIGGERS` if they were answered differently.
