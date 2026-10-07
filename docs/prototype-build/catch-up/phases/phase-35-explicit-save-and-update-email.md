# Phase 35 · Explicit save and the update email

**Requirements covered:**
[FT-02.3](../../../../requirements-board/requirements/stories/FT-02.3.md) Manual booking entry by admin (Confirmed at `3d3a18c`) ·
[US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md) Create or amend a Booking (Confirmed; new note: every Booking field is editable by an admin until AA says otherwise) ·
[US-02.3.2](../../../../requirements-board/requirements/stories/US-02.3.2.md) Save Booking changes explicitly (Confirmed; "Changes known" now keeps each saved change in the history, where the update email picks it) ·
[US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md) Draft a booking update email (Verify: an on-demand button on any Booking, the admin picks one or more changes from the history; new "Pick changes" criterion) ·
[US-02.3.4](../../../../requirements-board/requirements/stories/US-02.3.4.md) Update email templates per kind of change (Confirmed, new at `3d3a18c`) ·
[DM-35](../analysis/domain-model-delta.md#dm-35) Explicit-save change sets, an on-demand Booking update email picked from the change history, and email templates per kind of change ·
[RV-31](../analysis/reverse-check.md#rv-31-admin-edits-to-a-booking-write-through-on-every-tap-the-catalogue-wants-an-explicit-save-with-an-unsaved-warning) Admin edits write through on every tap (supersedes, for the office only, the 2026-07-23 "write-through per tap" ruling).
**Left this phase at `3d3a18c`:** [US-02.5.6](../../../../requirements-board/requirements/stories/US-02.5.6.md) Concurrent edits (Future Work swimlane: "related to an automated thing"), so the row versions, the merge rules, the clash sheet, the second office user and the "Someone else saves this Booking now" trigger are gone; [US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md) Append-only change history (re-graded Matches; this phase extends it, below, but has nothing left to close).
Also touches, without closing:
[US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md) (Matches: a save groups its entries under one change set, and the Admin History gains an as-at view; every entry keeps its source),
[US-01.4.1](../../../../requirements-board/requirements/stories/US-01.4.1.md) (Confirmed; its note now says the admin is **not** prompted after a reassignment and picks the cover change from the change history with the on-demand button),
[US-01.4.3](../../../../requirements-board/requirements/stories/US-01.4.3.md) (Confirmed; an anaesthetist's own move posts to the shared notification pool, built by Phase 32, and the office sends the cover-change email from the on-demand button),
[US-13.8.2](../../../../requirements-board/requirements/stories/US-13.8.2.md) (Verify, Phase 32: the List-move notification; this phase adds "Draft cover-change email" to it),
[US-13.5.2](../../../../requirements-board/requirements/stories/US-13.5.2.md) (Confirmed; the Audit viewer gains a change-set column).
**Open questions:** answered and built as answered:
[OQ-69](../../../../requirements-board/requirements/questions/OQ-69.md) (owner decision D19: an on-demand button on the admin screen for any Booking, used ad hoc; the admin picks one or more changes from the history; "not since last email"; no prompt after saving or after a cover change),
[OQ-65](../../../../requirements-board/requirements/questions/OQ-65.md) (D15: the office is told through the shared notification pool and sends the cover-change email from it; the colleague sees the List with a notice, Phase 32),
[OQ-46](../../../../requirements-board/requirements/questions/OQ-46.md) (the surgeon's room for a change to a Booking, the hospital contact for a cover change; the admin can edit the To) and
[OQ-07](../../../../requirements-board/requirements/questions/OQ-07.md) (optimistic concurrency, now Future Work with US-02.5.6: not built).
Still open: [OQ-82](../../../../requirements-board/requirements/questions/OQ-82.md) (should the email for an anaesthetist's own move be sent automatically; Donald wondered, Greg agreed, AA to decide). It has no recommendation, so this phase builds what the catalogue says today, on demand only, and logs it for the owner. US-02.3.3 stays Verify (Ben to confirm the office's cover-change email from a List move); build it as written.
**Depends on:** Phase 17 (hospital and surgeons' room contact emails, `Surgeon.roomId`), Phase 25 (Contract version history and the per-Procedure lock, which the as-at view reads and which makes AUTHORISED Bookings read-only), Phase 32 (the anaesthetist's own List moves and the shared notification pool, FT-13.8 and DM-41, whose List-move notifications carry the cover-change email), Phase 33 (hospital rows land for an admin decision, so nothing applies silently and every inbound write goes through the guarded paths). Through them: 14 (trigger registry, context hook, shared actors), 15 (Booking vocabulary, `BookingDetailBody`, Booking source), 15a (the warning routine; warnings are derived, and clearing one is a command), 15b (Copy a Booking is gone, so it is not in the write inventory), 19 to 24 (the procedure-first picker, Contract picker, the payer's name and email that 21 captures, required inputs, primary Procedure, base-unit override, split share and adjustment edits that now sit inside a save), 27 (the prepayment estimate and its re-check on change), 28 (`reassignList` over `moveListToSlot`), 29 and 30, and 31 (Draft Lists, which hold Bookings, and the office's Draft List assignment). **Not guaranteed before 35** (not in its dependency chain): 32a (the single-Booking move; normally done first by Schedule track order), 34 (the S1 rebuild; normally done first by Intake track order), 36 and later, and 38b and 39. Every work item that mentions them applies only if that phase is DONE; the drift check records which.
**Estimated:** 2 sessions. Session 1 is the save boundary (work items 1 to 10: model, pure change-set maths, the as-at reconstruction, the save action, the draft store and its refactor, the Admin save bar with fuller editing, the unsaved-changes guard, grouped history with the as-at view). Stop green there. Session 2 is the update email (templates, the pure builder, the change picker and compose panel, the notification pool and List drawer entry points) and adding a Booking to a booked List (items 11 to 19). **Spill point:** if session 1 runs long, the as-at view (work item 4 and the "View as at" part of item 10) moves to the start of session 2; nothing else depends on it. If session 2 then runs long, ship the template list edit-only (the four seeded templates, no Add or Retire) and drop the picker's "In an earlier draft" chip, and log both in the handoff for 44, rather than squeezing the demo-guide patch or the adversarial pass, which both stay in session 2.

## Goal

Today every office edit on a Booking applies the instant it is made: the time stepper and notes
write straight away, and each sheet saves on its own, so the history is a stream of per-field
mutations with no save boundary (RV-31). This phase makes Admin Booking editing **draft-then-save**:

- the office edits freely, sees "3 unsaved changes", and presses **Save changes** or **Discard**;
- leaving the page with unsaved edits warns, whether by the side nav, the back link, the app switcher,
  the browser back button or a reload;
- each save writes **one change set**: every field changed since the previous save, with before and
  after, who and when, grouped under one id in the append-only audit;
- the History sheet shows saves as single rows, and an admin can open the Booking **as at** any point
  in its history (a point-in-time reconstruction, with the Contract version in force);
- the office can edit **every field** of a Booking (US-02.3.1's note): the patient's NHI, the
  procedure description on a SUBMITTED List, and the time through a proper time field.

**Draft update email** (OQ-69 answered) is an on-demand button on every Booking in the Admin App,
used ad hoc when a change has left the rooms or the hospital out of sync. It is never a prompt after
a save or after a cover change. Pressed, it opens a compose panel: the admin **picks one or more
changes from the Booking's change history**, the system starts from the **admin-maintained template
for that kind of change** (US-02.3.4: a change of anaesthetist, a cancellation, an error, a general
change), and a real `mailto:` link opens the admin's mail client with the subject, boilerplate, the
picked changes and the To address (OQ-46: the surgeon's room for a Booking change, the hospital
contact for a cover change). The admin edits everything, To included, and sends it themselves. Past
about 2,000 characters the body is shortened and says so. A badged preview panel shows the same email
for presenters without a mail client. The system sends nothing and never records an email as sent.

The **cover-change email** for an anaesthetist's own move (OQ-65 answered) is reached from the move's
notification in Phase 32's shared notification pool, with the move already picked; for the office's
own reassignment it is picked from the history (US-01.4.1: no prompt), from any of the List's Bookings
or from the List drawer. The office can also **add a Booking to a List that already has Bookings**
(or to a Draft List).

Anaesthetist flows (mobile, web, PWA) keep their immediate saves. The shared Booking detail stays one
component: a context decides whether its writes go to the real store (immediate) or to a draft
(Admin). Concurrent-edit detection is Future Work (US-02.5.6) and is not built: a save applies the
admin's own changes onto the real Booking as it is at Save time.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot (`3d3a18c`, the three
   2026-10-02 meetings with Greg):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-02.3,US-02.3.1,US-02.3.2,US-02.3.3,US-02.3.4,US-02.5.5,US-02.5.6,US-01.4.1,US-01.4.3,US-13.8.1,US-13.8.2,US-13.5.2,OQ-46,OQ-65,OQ-69,OQ-82,OQ-07
   ```

   What `3d3a18c` already changed, and this plan already reflects: FT-02.3, US-02.3.1 and US-02.3.2
   Confirmed; US-02.3.3 rewritten as an on-demand button with picked changes (and the new "Pick
   changes" criterion); US-02.3.4 new; US-02.5.6 moved to Future Work; US-02.5.5 gained the source
   sentence (already met); US-01.4.1's "not prompted" note; US-01.4.3's pool criteria; OQ-65 and
   OQ-69 answered; OQ-82 new. If an item changed again, re-read it and adjust the work items before
   planning. If a covered item is now Retired or Future, drop it and say so in the PROGRESS entry.
   The likeliest changes: US-02.3.3 moving from Verify to Confirmed (nothing to change), OQ-82
   answered "automate it" (see step 2), or US-02.3.2 stating whether a List reassignment goes
   through the explicit save (this plan treats it as its own event, work item 5).
2. **The update email's answers.** OQ-69, OQ-65 and OQ-46 are answered: build them with no provisional
   label anywhere (no caption on the button, the panel or the pool row). **OQ-82** (automate the
   email for an anaesthetist's own move) is open with no recommendation: build on demand only, add no
   switch, and put it on the owner's review list. If it has been answered "automate" by the time you
   start, stop and report rather than build an outbox: an automatic send is a new mechanism this plan
   does not size.
3. **Confirm what earlier phases delivered** (their PROGRESS entries and handoff notes). Write these
   down before touching code, because the draft must capture every write the Booking detail can make:
   - **15 and 15b:** the post-rename names (`Booking`, `BookingId`, `editBooking` + `BookingPatch`,
     `createBooking`, `cancelBooking`, `reassignBooking`, `shared/booking/`, `BookingDetailBody`,
     `AdminBookingDetail`, the route `/admin/day/:dateISO/bookings/:bookingId`), the Booking source
     values (including the office's `admin`), where attachments live (15 moved them into their own
     actions), and that 15b removed `copyBooking` and the Copy control (if it is still there, 15b
     is not DONE: stop and report).
   - **15a:** warnings are derived by the pure routine (not stored on the Booking), so the draft shows
     the warnings its own edits would raise; clearing one (`clearWarning`, writing
     `schedule.warningClearances`) is a command that touches no Booking field.
   - **17:** `Hospital.contactEmail`, `SurgeonRoom { contactEmail, phone }`, `Surgeon.roomId`,
     `surgeonsInRoom`.
   - **19 to 24:** every Booking and Procedure field the Admin detail now edits and the store action
     each uses. As planned: `pickProcedure` (19), the base-unit override (19a), `setProcedureContract`
     (20), the payer's name and email captured on the Procedure for a default or patient-direct
     Contract and the required inputs (21; there is no per-Booking billable-party override and no
     guardian record any more, D17), `setBookingSplitShare` over `Booking.splitShares` with
     `validateSplitShare` (22), `setPrimaryProcedure` (23), and `setAnaesthetistAdjustment` and
     `setOfficeOverride` (24); 21's `approveContractSelection` and `confirmScheduleMiss` are review
     decisions. Confirm the real names. There is no insurer or funding-source field on the Booking or
     Procedure (D2), and 22 deleted `funderOverride`, `FunderAllocationSheet` and the
     `allocationNotConserved` refusals.
   - **25:** the Contract version helper (the version in force at a date) and the lock record;
     AUTHORISED Bookings are read-only.
   - **20 and 25:** every Contract selection and adjustment is an audited Procedure write, and the lock
     and version history exist (US-02.5.5 Matches on that basis). If either is missing, stop and
     report: this phase does not rebuild them.
   - **27:** the estimate input on the Procedure (`setEstimatedDuration`, office only: a drafted edit),
     the approval and send action `approvePrepaymentInvoice` (a command), and the one re-check
     `syncPrepayment(api, bookingId, cause)`, run as the engine after commit from the Booking and
     Procedure edits and the moves. It is idempotent. A save must run it once on the real store (work
     item 5), because the draft store's side effects are thrown away.
   - **28:** `reassignList` (over `moveListToSlot`), `ReassignListFlow` (which still auto-closes and
     offers no email, per US-01.4.1), and the Admin Day drawer as 28 left it (`SlotDrawer.tsx`, or
     `ListDrawer.tsx` if it kept the name: a Slot holding a List, or an empty Slot with Assign List and
     Book (phone advice)).
   - **31:** the Draft List model (no anaesthetist, may hold Bookings), `assignDraftList`, and the
     Draft List drawer's **Add Booking** (15's office add-Booking flow).
   - **32:** the anaesthetist's move actions (to the office, which makes a Draft List through
     `detachListToDraft`; into a colleague's free session; the return-or-assign hand-on when a booked
     session is marked unavailable; as planned `moveListToOffice`, `pushListToSlot` and
     `markUnavailableAndMoveList` in `src/store/listMoveActions.ts`), the audit code each writes (as
     planned `list.ownerMove` with `after.route` `office` or `colleague`, and no `list.reassign`), and
     the **shared notification pool** (FT-13.8, DM-41): the `Notification` record (`NT####`, as
     planned `{ kind: 'listMoved', byActor, listId, route, cause, fromAnaesthetistId,
     toAnaesthetistId?, dateISO, session, hospitalId, surgeonId, message? }`), the selectors in
     `src/store/notifications.ts` (`notificationPool`, `latestNotifications`), the Admin pool page
     (as planned `/admin/notifications`) and its Day rail card, and the row component. Work item 15
     adds the cover-change email to its List-move rows. Also 32's Admin demo triggers that make an
     anaesthetist move a List (as planned `colleague-moves-list-to-office`, whose "A busy morning"
     choice includes hand-ons into colleagues' sessions; confirm one of them moves a List into a
     colleague's session).
   - **32a (if DONE):** `moveBookingToAnaesthetist` (as planned, in `src/store/listMoveActions.ts`,
     audit code `booking.movedToAnaesthetist`) and whether it posts to the pool (as planned yes,
     under `SINGLE_BOOKING_MOVE_RULE.notifyPool`, OQ-85's recommendation). A single-Booking move
     changes no List's anaesthetist, so this phase treats it as a Booking `move` for the rooms, not a
     cover change (OQ-46 defines a cover change as "a new anaesthetist on a List"). 32a's handoff
     calls it a cover change for the hospital contact: this phase keeps the catalogue's definition,
     puts the new anaesthetist on the move's email line so the admin can switch to the Change of
     anaesthetist template or the hospital, and logs the reading for the owner.
   - **Every action that changes a List's anaesthetist** (28's `reassignList`, 31's `assignDraftList`,
     32's moves): list the action codes and the `before` and `after` owner fields each writes. The
     cover-change rows in the picker (work item 12) read exactly these.
   - **33:** the matching screen's apply action (as planned `decideImportRow(api, actor, rowId,
     decision)`, the one path from a hospital row to the schedule). It must write through `editBooking` /
     `editProcedure` (or an equally guarded path through `mutate()`); it gains `changeSet: 'match'`
     in work item 5 so an applied row is one pickable history row.
   - **34 (if DONE):** the rebuilt S1, for the milestone consistency read.
   - **14:** the registry file, `DemoContextValues`, the shared actor constants module and the PWA
     sheet's `office-stand-in` badge.
   - The current `PERSIST_VERSION` (16 at `3d3a18c`, after 15a session 1; 15a to 34 will have bumped it).
4. **Build the write inventory** (it drives work items 6 and 7). Grep every store action called from
   `src/shared/booking/`, `src/shared/capture/` and the flows the Booking detail mounts, and classify
   each one. The expected result:

   | Write | Today | Admin after this phase |
   |---|---|---|
   | `editBooking` (time, notes) | immediate (stepper, notes on blur) | drafted |
   | `editPatient` (`EditPatientSheet`, which gains NHI) | immediate sheet save | drafted; the sheet button reads "Apply" |
   | `editProcedure` (description, Times, Units, ASA, code, modifiers, notes, base-unit override, required inputs, the payer's name and email), `pickProcedure` (19), `setProcedureContract` (20), `setPrimaryProcedure` (23), `setAnaesthetistAdjustment` and `setOfficeOverride` (24) | immediate | drafted |
   | `addProcedure`, `removeProcedure` | immediate | drafted |
   | `addBillingLine`, `removeBillingLine`, `setBookingSplitShare` (22) | immediate | drafted |
   | `setEstimatedDuration` (27) | immediate | drafted; the save runs `syncPrepayment` on the real store |
   | attachments (15) | immediate | drafted if they live in the snapshot's slices; otherwise a command |
   | `completeBooking`, `uncompleteBooking` | command | command, disabled while unsaved |
   | `cancelBooking`, `reassignBooking` (Move), 32a's single-Booking move if built | command | command, disabled while unsaved; each writes a change set |
   | `approvePrepaymentInvoice` (27); `approveContractSelection` and `confirmScheduleMiss` (21); 38b's events and additional invoice and 39's credit actions if built | command | command, disabled while unsaved |
   | `clearWarning` (15a) | command | command; stays enabled while unsaved (it writes only `warningClearances`, never a Booking field) |
   | `recordUpdateEmailDrafted` (this phase) | none | command; disabled while unsaved (the email uses saved changes) |

   A write is **drafted** when it only changes the Booking, its Procedures and billing lines, its
   patient or its attachments. Anything that raises money, changes lifecycle state or creates another
   Booking is a **command**: it acts on the real store at once, and only when there are no unsaved
   changes. A write whose store action also touches a slice outside the snapshot (the List, a Slot,
   `billing`, other `masters`) or emits an app event (`emitAppEvent` in `store/events.ts` is a
   module-level emitter shared by every store instance, so a drafted `listAuthorised` would reach the
   real billing run) is a command, whatever it looks like in the UI. The one exception is a derived
   follow-on the store runs after an edit (27's `syncPrepayment`, which writes `billing`): the edit
   stays drafted, and `saveBookingChanges` runs the follow-on once on the real store. In the draft
   store it is gated off (a draft-mode no-op), so a draft never generates, re-estimates or withdraws
   a prepayment invoice and never emits an app event; the prepayment panel reads "Updates when you
   save" while the draft is dirty. Record the final table in the PROGRESS entry.
5. **Fields the office cannot edit today** (US-02.3.1's note: every field is editable by an admin
   until AA says otherwise). At `3d3a18c`: the patient's NHI (`EditPatientSheet` has no NHI field)
   and the procedure description on a SUBMITTED List (`BtmCaptureBlock` sets
   `editable = list.state === 'DRAFT'`, L119). List any other Booking or Procedure field the Admin
   detail shows but cannot edit after 19 to 27; work item 8 opens each one up for the office, or
   records why not (a lifecycle field such as approval state, a derived value, or a locked AUTHORISED
   Booking).
6. Record the result, including "no drift", in the PROGRESS entry.

## Reference

**Design (convention 17):**
- `docs/design/Admin Day.dc.html` and `docs/design/Admin Review.dc.html`: the Admin chrome, the
  List drawer and its action row, tables, the amber advisory treatment, and the authorised-banner
  anatomy that the save strip follows (a single-line banner with a status pill, a stamp and one
  action).
- `docs/design/Design Language.dc.html`: tokens. Teal `#0D6E63` is the only action colour (Save
  changes, Draft update email, Open in mail client, Add Booking); crimson never appears on the save
  bar, the compose panel or the template editor. The unsaved bar uses the **warning** tint and on-tint
  (an unsaved draft is a caution, not an error); the saved strip uses the success tint; the "changed
  by the office" banner uses a neutral info treatment. Spline Sans Mono with tabular-nums for
  change-set ids, counts, times and character counts. e-2 for the sticky bar, radius `card` for
  panels, and "motion never blocking".
- `docs/design/Mobile App.dc.html`: only for the one-line "changed by the office" banner on the
  mobile Booking (bottom sheets, no desktop modals).
- No mockup covers the save bar, the as-at panel, the compose panel or the template editor. Extend the
  Admin's banner, rail-card, table and sheet patterns. Admin is desktop: overlays through
  `useSurface().Overlay` (the web `Dialog`); the compose panel is a wide two-column dialog (picker
  left, template, recipient and preview right).

**Catalogue:** the covered files above; US-01.4.1, US-01.4.3, US-13.8.1 and US-13.8.2 (the
reassignment, the anaesthetist's own move and the pool the cover-change email is reached from);
OQ-69, OQ-65, OQ-46 and OQ-07 (answered), OQ-82 (open); the evidence notes
`requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` #6, #10, #18 and #31 (the on-demand button,
"not since last email", pick one or many, the templates, the pool) and
`requirements-board/requirements/notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md` #1, #7, #23, #24 and #25
(OQ-82 raised, manual entry confirmed, every field editable, the automated-email question), and
`requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md` #22 and #60; `domain-model.md` §1 row "No path
for telling hospitals about Booking changes" and §2 "Booking" and "Surgeon, surgeons' room and
blacklist"; [US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md)
and [US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md)
(where the contact emails come from);
[US-08.4.4](../../../../requirements-board/requirements/stories/US-08.4.4.md)
(invoice reproducibility, which 25 closed and the as-at view illustrates).

**Analysis:**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): theme 8 "Intake becomes a matching screen" (explicit Save,
  change sets, update-email draft and templates), the DM-35 row, the RV-31 row, "Demo-trigger
  buttons" and the EP-02 table and its structural note (explicit save gated on the office actor so
  the anaesthetist apps stay write-through).
- [epics/EP-02.md](../epics/EP-02.md): FT-02.3, US-02.3.1, US-02.3.2, US-02.3.3, US-02.3.4;
  [epics/EP-01.md](../epics/EP-01.md): US-01.4.1, US-01.4.3; [epics/EP-13.md](../epics/EP-13.md):
  US-13.8.2.
- `gaps.json`: the entries for FT-02.3, US-02.3.1 to US-02.3.4 and the `DM-35` delta.
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-35 (and DM-32 for the
  contact emails, DM-05 for the anaesthetist's own move, DM-41 for the pool, DM-31 for derived
  warnings); [analysis/reverse-check.md](../analysis/reverse-check.md) RV-31.
- [analysis/prototype-map-shared.md](../analysis/prototype-map-shared.md) §2 (surface seam), §3
  (Booking detail body, History), §5 (flows and sheets), §6 (audit presentation);
  [prototype-map-admin.md](../analysis/prototype-map-admin.md) §1, §3 (List drawer), §4 (Booking
  flows, `AdminBookingDetail`), §9 (Master data), §10 (Audit viewer);
  [prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md) §1 and §2 (`mutate`,
  lifecycle guards);
  [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) (harness bar, the
  router, the PWA demo sheet and `pwaPurity`).

**Code entry points** (line numbers are from `3d3a18c` and will have moved):
- `aa-prototype/src/store/mutate.ts`: `mutate()` (L154; returns `void` today and stamps
  `lastModifiedBy/AtISO` on the Booking through `deriveStampBookingId`, L138), `MutationMeta`,
  `Outcome` and `refuse(code, message, details?)` (L43), `ID_FORMATS` (L61), `resetDomainState`
  (L222: the demo Reset, a wholesale replace that keeps seeded ids). The `storeDiscipline` source scan
  lives in `mutate.test.ts`. `AuditEntry` has no sequence field: the append-only `audit` array order
  is the sequence.
- `aa-prototype/src/store/lifecycle.ts`: `editRefusal` (L48), `editBooking` (L402), `editProcedure`
  (L438), `reassignList` (L543, rebuilt by 28); `store/intake.ts` `editPatient` (L145).
- `aa-prototype/src/store/appStore.ts`: `PERSIST_VERSION` (L136, 16 at `3d3a18c`), `backfillMerge`
  (the `appSettings` merge at L205 is the pattern for a new master), `createAppStore({ persisted })`,
  `AppStoreApi`.
- `aa-prototype/src/domain/types.ts`: `Hospital` (L155), `Surgeon` (L160), `Booking` (L373),
  `Procedure` (L453), `AuditEntry` (L655). `aa-prototype/src/domain/nhi.ts`: `validateNhi` (L54) for
  the NHI field.
- `aa-prototype/src/shared/booking/BookingDetailBody.tsx`: `stepTime` and `saveNotes` (L326 to 335),
  the steppers (L562 to 563), the notes `onBlur` (L592), the command handlers, the History entity-id
  set (`historyEntityIds`, L758).
- `aa-prototype/src/shared/booking/HistorySheet.tsx`, `HistoryTimeline.tsx`;
  `aa-prototype/src/shared/audit/` (`actionLabels.ts` with its source-scanning test, `fieldLabels.ts`,
  `auditNarrative.ts` with `coalesceAudit`, L309).
- The flows the Booking detail mounts: `shared/flows/EditPatientSheet.tsx`, `EditProcedureSheet.tsx`,
  `EditBillingSetupSheet.tsx`, `PriceOverrideSheet.tsx`, `RemoveProcedureSheet.tsx`,
  `CancelBookingSheet.tsx`, the sheets 19 to 24 added (the Contract picker, payer capture, split
  share, adjustment) and 27's `PrepaymentPanel` and estimated-duration control
  (`FunderAllocationSheet.tsx` is deleted by 22); `shared/capture/*` (`BtmCaptureBlock.tsx` L119 for
  the DRAFT-only description edit; every card calls `editProcedure(useAppStore, ...)`);
  `apps/admin/flows/MoveBookingFlow.tsx` for `reassignBooking`. At `3d3a18c` these folders and
  `AdminBookingDetail.tsx` hold about 100 `useAppStore` uses; later phases will have added more.
- `aa-prototype/src/apps/admin/screens/AdminBookingDetail.tsx` and its route wrapper in
  `apps/admin/routes.tsx` (`AdminBookingDetailRoute`, L93).
- `aa-prototype/src/apps/admin/components/ListDrawer.tsx` (`isFreeEmpty` gate L41, the action row
  L108 to 110; `SlotDrawer.tsx` after 28, with 31's Draft List mode),
  `apps/admin/flows/PhoneAdviceBooking.tsx` (`isScriptedS2Booking`),
  `apps/admin/flows/ReassignListFlow.tsx` (its auto-dismissing "List reassigned" overlay, L46 and
  L127, stays), `apps/admin/screens/AuditViewer.tsx`, `apps/admin/screens/MasterData.tsx` (the `NAV`
  entity list at L41, where Email templates is added); Phase 31's Draft List screen, and Phase 32's
  notification pool screen and its rows (confirm the names from their PROGRESS entries).
- `aa-prototype/src/router.tsx` (`BrowserRouter` at L65 with `v7_startTransition` and
  `v7_relativeSplatPath`, so `useBlocker` is unavailable today); `aa-prototype/pwa/main.tsx` (the
  PWA's own router, untouched); `src/shell/AppShell.tsx` (`handleSelect` sets `currentApp` then
  navigates; the route effect re-syncs it, so a blocked switch settles back on the current app).
- `aa-prototype/src/apps/demo/DemoControlPanel.tsx`: the S5 jump (L320 to 345), whose office
  `editBooking(... notes)` step (L330) becomes a grouped save.
- `aa-prototype/src/shared/demoTriggers/` (Phase 14): `registry.ts`, `types.ts` (`choices`,
  `disabledReason`, `run` returning `{ ok; message }`), `match.ts`, `context.ts`
  (`useDemoTriggerContext`, `DemoContextValues`); the actors module `src/store/demoActors.ts`
  (`OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`); `src/pwa/pwaPurity.test.ts`.

## Work items

### Session 1: the save boundary

1. **Model** (`src/domain/types.ts`):
   - `ChangeSetId = string`; `AuditEntry.changeSetId?: ChangeSetId` (DM-35: a change set is a group of
     audit entries, not a new collection, so there is one history, not two).
   - `ChangeSetKind = 'save' | 'create' | 'cancel' | 'move' | 'listReassign' | 'match'`
     (`listReassign` covers every change of a List's anaesthetist: the office's reassignment, 31's
     Draft List assignment and 32's moves; `move` covers a Booking moved to another List, including
     32a's single-Booking move; `match` is a hospital row the office applied on 33's matching screen).
   - No change-set slice, and no row version (US-02.5.6 is Future Work; DM-35: "skip the row
     version"). The "fields changed since the previous save" (US-02.3.2 "Changes known") are derived
     from the audit by change-set id.
2. **`mutate()` groups** (`src/store/mutate.ts`):
   - `MutationMeta.changeSetId?`, and an optional last argument `options?: { changeSet?: ChangeSetKind }`.
     With it, `mutate` allocates one `CS####` id (new `ID_FORMATS.changeSet`, prefix `CS`, pad 4) and
     stamps it on every entry of the call, and on the first entry records the kind
     (`changeSetKind`). `mutate` returns `{ changeSetId: ChangeSetId | null }` (callers that ignore
     the return are unaffected).
   - `lastModifiedBy` and `lastModifiedAtISO` never appear in an audit `before` or `after`.
   - Convention 7's wording gains "a save groups its entries under one change-set id" (PROGRESS update).
   - Vitest (`mutate.test.ts`): one call with `changeSet` gives every entry the same id and allocates
     exactly one; a call without it allocates none; `storeDiscipline` still passes.
3. **Pure change-set maths** (`src/domain/changeSets.ts`, no React, no store imports):
   - `BookingSnapshot { booking; procedures; billingLines; patient?; attachments? }` and
     `snapshotBooking(source, bookingId)`, where `source` is a narrow structural type (the schedule and
     the patient master), so the helper stays pure. The related-id set is the Booking, its Procedures
     (with the payer details 21 holds on them), their billing lines, the Booking's patient, and the
     Booking's attachments if 15 keeps them in their own slice.
   - `FieldChange { entityType; entityId; field; before; after; kind: 'update' | 'create' | 'remove' }`
     and `diffSnapshots(base, next): FieldChange[]`: structural equality with stable key order,
     arrays and objects compared as whole values (a modifier list is one field), and
     `IGNORED_FIELDS` (`lastModifiedBy`, `lastModifiedAtISO`).
   - `changeSetsFor(audit, entityIds)`: entries grouped by `changeSetId`, each group with its header
     entry and kind, newest first; ungrouped entries pass through.
   - Vitest `changeSets.test.ts`: stamps ignored; a changed array is one change; created and removed
     entities; nested objects (a price override union, a split share) compare structurally.
4. **As-at reconstruction** (`src/domain/bookingAsAt.ts`, pure; US-02.5.5 technical discussion:
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
5. **The save action** (`src/store/bookingSaveActions.ts`, exported from `src/store/index.ts`;
   US-02.3.2 "Explicit save", "Changes known", "History"; US-02.3.1 "recorded against the admin"):
   - `saveBookingChanges(api, actor, bookingId, draft: { base: BookingSnapshot; next: BookingSnapshot })`
     returns `Outcome<{ changeSetId; changes }>`.
   - Refusals as data: `notFound`; non-office actor (`officeOnly`: anaesthetists keep immediate saves);
     `editRefusal(actor, currentList)`; `noChanges`; `blocked` with a plain reason when the Booking
     was cancelled, moved to another List, or its List became AUTHORISED since the draft began
     ("This Booking was cancelled at 09:16 while you were editing. Nothing was saved."). These are the
     existing lifecycle guards read at Save time, not concurrency detection.
   - **Apply onto the real current state.** `changes = diffSnapshots(base, next)` (the admin's own
     edits); each is applied to the real Booking as it is at Save time, and each audit `before` is read
     from that real state, so the record is true even if something else wrote in between. A field
     whose real value already equals the admin's is skipped. Fields the admin did not touch are left
     alone. There is no merge, clash or version check (US-02.5.6 Future Work); say so in a comment.
   - **Ids created in the draft are remapped.** The draft allocated its own ids from a copy of the
     counters, so a new Procedure could collide with one the real store allocated meanwhile (for
     example a billing-engine write). Allocate fresh real ids for every created entity and rewrite
     references (a billing line's `procedureId`, a split share's key).
   - Re-check invariants on the candidate state before committing, reusing the existing guards rather
     than re-implementing them: a valid split share (22's `validateSplitShare`, and its refusal for a
     share on a Contract that bills one party in full), exactly one primary Procedure (23), a Contract
     the Procedure is eligible for (20's filter, by procedure and hospital), a valid NHI
     (`validateNhi`). A failure refuses with that guard's own message. Warnings (15a) are derived and
     never refuse a save.
   - One `mutate(..., { changeSet: 'save' })`: one meta per changed entity, reusing the existing
     action codes (`booking.update`, `procedure.update`, `procedure.create`, `procedure.remove`,
     `billingLine.*`, `patient.update`) so labels and the as-at reverse table work unchanged, plus a
     header meta `booking.save` on the Booking with `after: { kind, fields: FieldRef[] }`.
   - **Derived follow-ons run once, for real.** After the commit, call `syncPrepayment(api,
     bookingId, cause)` once on the real store. It writes its own engine rows (actor "Billing
     engine"), not part of the office's change set. A save that adds a Procedure on the
     anaesthetist's prepaid list for a person paying for the patient yields exactly one held
     prepayment invoice (not none, not two); a save that changes nothing 27 reads leaves the
     prepayment as it was (27's run is idempotent).
   - `cancelBooking`, `reassignBooking`, `createBooking`, `reassignList`, `assignDraftList` (31) and
     33's `decideImportRow` accept `{ changeSet?: ChangeSetKind }` and pass it to `mutate`; the Admin callers pass
     `cancel`, `move`, `create`, `listReassign` and `match`. 32's List moves pass `listReassign`, and
     32a's single-Booking move (if built) passes `move`, **whichever app calls them**, so every move
     is one pickable row in the history. Other mobile and web callers pass nothing.
   - **A List reassignment is its own event, not a save** (US-02.3.2 leaves open whether it goes
     through the explicit save): it applies at once from its flow, as today, with no email step
     (US-01.4.1), and carries its own `listReassign` change set that the update email can pick. An open
     Booking draft on that List saves normally onto the List's new anaesthetist.
   - Convenience `saveBookingPatch(api, actor, bookingId, { booking?: BookingPatch; procedures?:
     Record<ProcedureId, ProcedurePatch> })`: takes `base = snapshotBooking(current)`, applies the
     patches to a copy for `next`, and calls `saveBookingChanges`. It is the one path for saves that do
     not come from the Admin draft: the S5 jump (item 10) and the PWA trigger (item 17), so neither
     hand-builds snapshots.
   - Labels: `booking.save` "Booking saved" in `actionLabels.ts`; the header keys in `fieldLabels.ts`.
     The source-scanning label test must pass.
   - Selector `lastChangeSetFor(state, bookingId)` in `store/selectors.ts`.
   - Vitest `bookingSaveActions.test.ts`: one save gives N entries and a header under one id, all
     `who: 'Kirsty W.'`, `source: 'office'`; an anaesthetist actor is refused; an engine write to
     another field between draft and save is left intact and the save's `before` values come from the
     real state; a List authorised in between refuses and writes nothing (audit length unchanged); a
     draft-created Procedure gets a fresh id when the real store allocated one meanwhile; a save
     carrying an invalid split share refuses with 22's message; an invalid NHI refuses with
     `validateNhi`'s message; a save changing a Procedure's Contract and its adjustment lands both in
     one change set with before and after; a save adding a prepaid-list Procedure yields one held
     prepayment invoice on the real store.
6. **The draft store** (`src/shared/booking/draft/`; DM-35 "anaesthetist mobile flows keep immediate
   saves"):
   - `BookingStoreContext` carries `{ api: AppStoreApi; mode: 'immediate' | 'draft' }`.
     `useBookingStore(selector)` and `useBookingApi()` read it and fall back to `useAppStore` and
     `'immediate'` when there is no provider, so mobile, web and the PWA behave exactly as today.
   - `BookingDraftProvider({ bookingId, actor, children })` creates a non-persisted store with
     `createAppStore({ persisted: false })`, initialised from the real state by reference
     (structural sharing, no deep clone; every store write is immutable). While clean, it follows the
     real store (subscribe and re-copy). On the first drafted write it stops following and holds
     `base = snapshotBooking(state it last copied)`.
   - `useBookingDraft()` returns `{ dirty; changes; base; save(); discard() }`. `dirty` is
     `diffSnapshots(base, snapshotBooking(draft)).length > 0`, so undoing an edit by hand makes the
     draft clean again. `discard()` re-copies the real state.
   - The draft store is never persisted, never wired to the billing run, runs `syncPrepayment` as a
     no-op (a draft-mode flag on the store), and its own audit entries are thrown away: Save writes
     the net change set to the real store.
   - **Demo Reset while dirty.** `resetDomainState` rebuilds the seed with the same ids, so the Booking
     usually does not disappear. Detect a reset as "the real `audit` array is shorter than when the
     draft began, or its entry at that length differs" (or the Booking is gone); the draft then
     discards itself and shows one line: "This Booking was reset. Your unsaved changes were
     discarded."
   - Vitest: a drafted write does not reach the real store; discard restores; a clean draft follows a
     real change; a dirty draft does not; hand-undo makes it clean; a demo Reset discards a dirty
     draft; each drafted action in the inventory changes only the snapshot's slices (plus `audit` and
     `counters`) and emits no app event.
7. **Route the Booking detail's reads and writes through the context** (the mechanical refactor):
   - In `src/shared/booking/**`, `src/shared/capture/**` and the flows from the write inventory,
     replace `useAppStore(selector)` with `useBookingStore(selector)` and the `useAppStore` api argument
     with `useBookingApi()`. Budget for about 100 uses at `3d3a18c` plus what 19 to 27 added.
   - Commands keep the **real** store explicitly and read `useBookingDraft()?.dirty` to disable
     themselves with the reason "Save or discard your changes first".
   - In draft mode the sheets' primary button reads **Apply** instead of Save (from `mode`), so the
     office is never told a sheet "saved" something that is not yet saved.
   - Add a source-scanning Vitest beside `storeDiscipline`: `useAppStore` may not appear in those
     folders except in the named command allowlist. A future edit cannot bypass the draft silently.
   - Mobile and web mount no provider. `TimesCard.test.tsx` and the other capture tests pass
     unchanged, and a new web test proves an edit on `/web/.../bookings/:bookingId` still writes
     immediately.
8. **Admin Booking detail becomes draft-then-save, with fuller editing**
   (`apps/admin/screens/AdminBookingDetail.tsx`; US-02.3.2 "Explicit save"; US-02.3.1 and its note;
   FT-02.3):
   - Wrap the screen in `BookingDraftProvider`. The page header (patient name, NHI badge, primary
     Procedure) reads from the draft, so a patient edit shows at once.
   - **Unsaved bar** (`data-shot="booking-save-bar"`), sticky under the page header, e-2, warning
     tint: "3 unsaved changes" (mono count) and the changed field labels ("Time · Notes · Procedure 2
     Contract"), then **Discard** (secondary) and **Save changes** (teal primary). Hidden when clean.
   - **Saved strip** after a save: success tint, "Saved · 3 changes · 09:14 · Kirsty W." and the
     change-set id in mono. No email prompt (OQ-69: the email is on demand, never offered after a
     save). It is derived from `lastChangeSetFor` (not local state), so it is still there after
     leaving and returning, until the next save or **Dismiss** (a per-viewer UI flag).
   - **Time amend:** in draft mode the Scheduled time row is a real time input (`type="time"`, step
     300, styled with the `Field` primitives) beside the existing plus and minus 5 minute steppers.
     Notes write to the draft on change; there is no blur write. Mobile and web keep the stepper and
     the blur save.
   - **NHI:** `EditPatientSheet` gains an NHI field for the office (both NHI formats through
     `validateNhi`, its message inline; Phase 40a later adds the register lookup). Anaesthetist
     surfaces keep the sheet as it is.
   - **Procedure description on a SUBMITTED List:** the office can edit it (and every other Procedure
     field the drift check listed) while the List is DRAFT or SUBMITTED; `BtmCaptureBlock`'s
     `editable` becomes "DRAFT, or SUBMITTED in draft mode". AUTHORISED stays read-only (25's lock).
     Every other field step 5 of the drift check found is opened up the same way, or its reason is
     recorded.
   - Save refusals render verbatim in the bar.
   - Commands are disabled while dirty, with the reason shown under them.
9. **Unsaved-changes warning** (US-02.3.2 "Unsaved warning"):
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
10. **History shows saves, and the as-at view** (US-02.3.2 "History"; US-02.5.5):
    - `HistoryTimeline` (shared): entries sharing a `changeSetId` render as one row, "Saved by
      Kirsty W. · Office · 3 changes", with the per-field ledger beneath (Procedure rows labelled
      "Procedure n · description" as today). `coalesceAudit` still applies to entries with no change
      set and never merges across change sets. Mobile and web histories show the office's saves
      grouped too.
    - The Booking's History also shows the **owner changes of its List** while the Booking was on it
      (the `listReassign` change sets: "Dr Rutherford to Dr Sharma, reassigned by Kirsty W." or
      "moved by Dr Rutherford"), so a cover change is in the Booking's history, where the update email
      picks it (US-01.4.1 note).
    - **Admin only:** each change-set row and each ungrouped entry has **View as at**, which opens a
      read-only panel in the sheet (`data-shot="booking-as-at"`): "As at Tue 21 Jul 09:14, after
      Kirsty W.'s save", then patient name, List (date, session, hospital, surgeon), time, each
      Procedure (description, code, base units, Contract name and version through 25's helper) and
      notes. No money. If `incompleteAt` is set: "History before this point is incomplete
      (Procedure removed)", in mist.
    - **Audit viewer:** a Change set column (mono `CS0003`, blank when none); clicking it filters to
      that change set.
    - **S5 staging:** in the S5 jump (`DemoControlPanel.tsx`), replace the office
      `editBooking(... notes)` step with one `saveBookingPatch` call as the office that saves the note
      and a time change together, so S5 Beat 1 shows a grouped save. Update the jump's message.
    - Green checkpoint: build, PWA build, Vitest and shots. This is the end of session 1.

### Session 2: the update email, its templates, and Add Booking

11. **Email templates per kind of change** (US-02.3.4; DM-35 "a small EmailTemplate master per
    change kind"):
    - Model: `UpdateEmailKind = 'anaesthetistChange' | 'cancellation' | 'correction' | 'bookingChange'`
      (fixed ids, the catalogue's three examples plus a general change; labels "Change of
      anaesthetist", "Cancellation", "Correction of an error", "Booking change"). `EmailTemplate { id;
      name; kind: UpdateEmailKind; recipient: 'rooms' | 'hospital' | 'both'; subject; body; active }`
      in `masters.emailTemplates`, id format `ET###`. Placeholders: `{patient}`, `{date}`,
      `{session}`, `{hospital}`, `{surgeon}`, `{anaesthetist}`, `{previousAnaesthetist}`,
      `{bookingCount}`, `{changes}` and `{signature}`.
    - Seed four, one per kind, in plain NZ English with no dashes: "Change of anaesthetist" (to the
      hospital; "Kia ora, {previousAnaesthetist} is no longer the anaesthetist for the {date}
      {session} List at {hospital}. {anaesthetist} will be the anaesthetist. ... Ngā mihi,
      {signature}"), "Cancellation" (to the rooms), "Correction of an error" (to the rooms) and
      "Booking change" (to the rooms). Thread `emailTemplates` through `freshAppState`,
      `backfillMerge`, `DomainPatch` and `resetDomainState`; the canvas generator and every RNG input
      are untouched (the seed-determinism test proves it). Bump `PERSIST_VERSION` by one and extend
      `persistMigrate.test.ts` so a stale store is discarded.
    - Pure `validateTemplate(template)` in `src/domain/updateEmail.ts`: an unknown placeholder, an
      empty subject, or a body without `{changes}` (except the anaesthetist-change kind, which can
      carry `{previousAnaesthetist}` and `{anaesthetist}` instead) is reported; `renderTemplate` leaves
      no placeholder unfilled (an unknown one renders as empty, never as braces).
    - Store actions (`src/store/emailTemplateActions.ts`, office only, audited through `mutate()`):
      `saveEmailTemplate` (edit name, recipient, subject, body), `addEmailTemplate` (a new template
      for a kind) and `setEmailTemplateActive` (retire or restore; a kind always keeps one active
      template, refused otherwise). Labels in `actionLabels.ts`.
    - **Master data · Email templates** (`MasterData.tsx` `NAV` gains `emailTemplates`): a table of
      templates (name, kind, sends to, active), and an editor sheet with the fields, a placeholder
      list to insert from, `validateTemplate`'s messages inline, and a live preview rendered against
      a sample Booking (badged "Sample"). Teal Save; Add template; Retire.
    - Vitest: the four seeded templates validate; each kind keeps one active; edits are audited; a
      body with an unknown placeholder is reported; rendering never leaves braces; no `–` or `—` in
      any seeded template.
12. **The update email builder and the change picker** (`src/domain/updateEmail.ts` +
    `updateEmail.test.ts`, pure; US-02.3.3 "Compose window", "Pick changes", "To address", "Length",
    "Nothing sent"; OQ-69, OQ-46):
    - **Pickable changes.** `pickableChanges(audit, subject, lookups)` where `subject` is
      `{ kind: 'booking'; bookingId }` or `{ kind: 'list'; listId }`. For a Booking it returns the
      rows of its History, newest first: each change set (a save, a creation, a cancellation, a move,
      an applied hospital row), each coalesced group of ungrouped edits (an anaesthetist's change on
      mobile can leave the rooms out of sync too), and each owner change of its List while the
      Booking was on it. For a List it returns the List's owner changes. Each row is
      `PickableChange { key; atISO; who; role; kind: 'save' | 'create' | 'cancel' | 'move' | 'match' |
      'cover' | 'edit'; lines: EmailLine[]; emailable: boolean }`. A row whose changes are all outside
      the allowlist is `emailable: false` ("Nothing here for the rooms or the hospital").
    - `EMAIL_FIELDS` allowlist with plain labels: time, patient name, Procedure description (added,
      removed, changed), cancellation, move to another List (date and session, and the anaesthetist
      where the move changed it), the anaesthetist on a cover change, hospital and surgeon where they
      changed. **Never** in an email: NHI, date of birth, internal notes, Contract, billable party or
      payer details, prices, overrides, adjustments, split shares, units, captured times, estimates or
      warnings.
    - `netPicked(rows)`: when several picked rows touch the same field, the line shows the first
      `before` and the last `after` in audit order; a field that netted back to its original value
      is dropped and counted ("1 picked change cancelled out and is not listed"). Two cover changes
      picked together give one line from the first to the last anaesthetist.
    - `defaultKindFor(picked)`: any cover row gives `anaesthetistChange`, a cancellation gives
      `cancellation`, otherwise `bookingChange`. `correction` is the admin's choice (an error is not
      something the history can tell apart). The kind picks the default template (the first active
      one of that kind) and the default recipient from the template.
    - `buildUpdateEmail({ template, context, lines, to, signature })` returns `{ to; subject; body;
      href; shortened; omittedCount; length }`. Plain text with CRLF line breaks; change lines as
      "- Time: was 09:00, now 09:30". For a List subject, no patient names: the context is the List
      (date, session, hospital, surgeon) and the Booking count.
    - `MAILTO_MAX_LENGTH = 2000` (one labelled constant, on the whole encoded `href`). Past it, change
      lines are dropped from the end and a line is added: "This list was shortened to fit an email
      link. 3 more changes are in the booking record." The template's greeting, context and sign-off
      are always kept. `to` empty gives `mailto:?subject=...`.
    - Recipient helper `updateEmailRecipients(state, subject, choice)` in `store/selectors.ts`: the
      surgeon's room is `List.surgeonId` to `Surgeon.roomId` to `SurgeonRoom.contactEmail`; the
      hospital is `List.hospitalId` to `Hospital.contactEmail`; `both` joins the two known addresses.
      A Draft List has a surgeon and a hospital (31), so it resolves the same way; a List with no
      surgeon has no rooms address (To empty, with the reason "No surgeon on this List"), never a
      thrown lookup.
    - Vitest: only the picked rows appear; fields outside the allowlist never appear; netting over two
      picked saves, and a field changed and changed back drops out with the note; a cover row picked
      from a Booking and from its List gives the same anaesthetist line; a double reassignment picked
      together gives one line; the default kind and recipient for a cover, a cancellation and a time
      change; an over-long pick gives `href.length <= 2000`, `shortened` and the note (singular and
      plural); a short one is not shortened; encoding of `&`, `?`, `#`, `+`, apostrophes, line breaks
      and macrons (Māori names) round-trips through `decodeURIComponent`; no `–` or `—` anywhere in
      subject or body; an empty `to` is valid.
13. **The compose panel and the on-demand button** (US-02.3.3; OQ-69 answered):
    - `apps/admin/flows/UpdateEmailComposer.tsx` through `useSurface().Overlay`, a wide dialog
      (`data-shot="update-email-composer"`). Left, **Pick changes**: the `pickableChanges` rows as a
      list with tickboxes, newest first (who, when, a one-line summary, the lines beneath), the
      non-emailable rows shown disabled with their reason. The newest emailable row is ticked when the
      panel opens from the Booking; the context's row is ticked when it opens from a notification or
      the List drawer; the admin ticks or unticks any. A quiet chip "In an earlier draft at 09:14"
      marks rows already picked in a draft (a hint read from `updateEmail.drafted` entries; it changes
      nothing). Right: **Template** (default from `defaultKindFor`, any active template selectable),
      **Send to** "Surgeon's rooms · Hospital · Both" (default from the template) with the resolved
      address, or "No contact email held for Riverside Orthopaedic Rooms. To will be left empty.",
      then the **preview** `UpdateEmailPreview` (`data-shot="update-email-preview"`, `DemoBadge
      label="Demo preview"`): To, Subject, and Body in mono with pre-wrap, "1,184 of 2,000
      characters", a "Shortened to fit" pill when `shortened`, and one line: "Opens in your mail
      client. The system does not send it." The admin edits To and everything else in their mail
      client (AC "To address": "the admin can edit it either way").
    - Primary **Open in mail client** is a real `<a href={mailto}>` (teal), disabled until at least
      one emailable row is ticked. Clicking it writes one audited entry through
      `recordUpdateEmailDrafted(api, actor, { subject, pickedKeys, templateId, recipient })` (office
      only): action `updateEmail.drafted`, label "Update email drafted (not sent)",
      `stampBookingId: null`. Nothing else: no "sent" flag, no outbox, no copy of the body or address
      (AC "Nothing sent"). Previewing, ticking and switching templates write nothing.
    - **The on-demand button.** The Admin Booking detail's action row always shows **Draft update
      email** (teal secondary, `Mail` icon) on every Booking, including cancelled ones (the rooms may
      need telling). While the draft is dirty it is disabled with "Save your changes first. The email
      uses saved changes." (it reads saved history only, and a dirty page's `beforeunload` guard must
      never fire on a `mailto:` click). With no emailable row in the history it is disabled with "No
      saved changes to email yet". There is no prompt after a save, a reassignment or an assignment.
    - Component tests: the button on a Booking with saved changes opens the panel with the newest row
      ticked; unticking every row disables Open in mail client; switching Send to changes To; the
      cover row defaults to the Change of anaesthetist template and the hospital; Open writes exactly
      one `updateEmail.drafted` entry and no other state; the button is disabled while dirty.
14. **Cover-change email from the List drawer** (US-01.4.1 note: picked, not prompted; OQ-46):
    - The List drawer (`SlotDrawer` for a List, and its Draft List mode) gains **Draft update email**
      in its action row when the List has at least one owner change in its history. It opens the
      composer with `{ kind: 'list'; listId }`, the newest owner change ticked, the Change of
      anaesthetist template and the hospital. `ReassignListFlow` and 31's assignment flow are not
      changed: they end as they do today, with no email step.
    - Update `ReassignListFlow.test.tsx` only if 28's assertions read anything this phase moved; a new
      test proves the drawer's button after a reassignment opens a hospital email naming both
      anaesthetists and the Booking count, with no patient names.
15. **Cover-change email from the notification pool** (OQ-65 answered; US-02.3.3; US-13.8.2):
    - Each List-move notification in 32's pool for a List moved into a colleague's session (including
      a hand-on after marking a booked session unavailable) gains **Draft cover-change email**
      (`data-shot="pool-cover-email"`). It opens the composer for that List with that move's row
      ticked, the Change of anaesthetist template and the hospital contact.
    - A notification for a List returned to the office (a Draft List, no new anaesthetist yet) shows
      "Assign this Draft List first. Its cover email is drafted from the List drawer after." with a
      link to the Draft List; it is not a cover change until the office assigns it.
    - A single-Booking move notification (32a, if built and if it posts to the pool, OQ-85) offers
      **Draft update email** for that Booking (a `move` row, the rooms, with the new anaesthetist on
      its line), not a hospital email by default; the admin can switch the template or Send to. 32a's
      handoff reads this move as a cover change for the hospital: the catalogue's definition wins
      here (OQ-46: a cover change is a new anaesthetist on a List), logged for the owner.
    - The pool stays a log of things that need no action (US-13.8.1): drafting an email does not mark,
      remove or reorder a notification, and the row shows no "emailed" state (the hint lives in the
      picker only).
    - Test: after an anaesthetist moves a List into Dr Sharma's session, the notification's button
      opens the composer with the move ticked, To the hospital, and a body naming both anaesthetists
      and the Booking count, with no patient names; a return-to-office notification offers no email.
16. **Add a Booking to a booked List, and the "changed by the office" notice** (US-02.3.1: "create a
    new Booking on a List"; FT-02.3):
    - The List drawer (a Slot holding a List): the Bookings section header gets **Add Booking** (teal,
      `data-shot="list-add-booking"`, the same control and label 31 put on the Draft List drawer, so
      there is one control, not two) on any List the office may edit (approval state DRAFT or
      SUBMITTED, not AUTHORISED), whether or not it already has Bookings. It opens 15's office
      add-Booking flow (`AddBookingFlow` with the office actor and that List; no hospital step: the
      List already has one) and the procedure-first picker (19). Booking source `admin` (15); the new
      Booking takes the default Contract (20); `createBooking` carries `changeSet: 'create'` from both
      drawers, so the creation is a pickable row for the rooms email; `syncPrepayment` runs as it does
      for any created Booking.
    - **Book (phone advice)** stays for a free session without a List, and the `isScriptedS2Booking`
      prefill still works (S2 Beat 2).
    - **Changed by the office notice** (in `BookingDetailBody`, all surfaces): when a change set saved
      by another actor lands on this Booking while the screen is open (compare `lastChangeSetFor`
      with the value at mount), a neutral one-line banner shows "Kirsty W. saved changes to this
      Booking: Time. View history", dismissible. On mobile it sits under the masthead and never
      covers the completion dock or 15a's warning triangle. This is a notice, not concurrency
      handling.
17. **Register the demo triggers** (Phase 14's registry; details in "Demo triggers" below). Bodies
    live in `src/shared/demoTriggers/`, so `pwaPurity` holds. Nothing is added to the Control Panel
    page; its index lists the new entries automatically.
18. **Playwright** (`npm run shots`): add `visual/admin-phase35.spec.ts` with shots of the unsaved bar
    with three changes, the leave-without-saving dialog, a grouped save in History with the as-at
    panel open, the saved strip, the composer with two rows ticked and the preview, the composer
    opened from a pool notification, the Email templates editor, the List drawer's Draft update email
    and its Add Booking on a booked List, and the NHI field in the office's Edit patient sheet. Keep
    every existing Admin Booking spec passing: any spec that edits on the Admin Booking detail now
    presses **Save changes** (grep the `visual/` specs for Admin Booking edits).
19. **Finish green:**
    - `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    - `persistMigrate.test.ts` covers the bumped version;
    - `pwaPurity.test.ts` passes: the draft store, the context, the guard and the trigger bodies live
      in `src/shared` and `src/store` and import nothing from `apps/admin`, `apps/demo` or `shell`
      (the composer and the template editor are Admin components);
    - the demo-trigger registry test passes (ids unique, no dashes, each `indexPath` matches its
      routes);
    - the source-scanning label test covers `booking.save`, `updateEmail.drafted` and the template
      actions.

## Demo triggers

| Id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `office-edits-booking` | Office edits this Booking | Mobile · Booking detail (`/mobile/lists/:listId/bookings/:bookingId`) | pwa | Badge `office-stand-in`. The office (`OFFICE_ACTOR`, Kirsty W.) saves one change set on this Booking through `saveBookingPatch`: the time moves 30 minutes later. The handset updates live and shows the "changed by the office" banner; History shows the grouped office save. Message: "The office moved this Booking to 09:30." | Booking cancelled, or List AUTHORISED ("This Booking is locked"), or the time would pass 23:55 |
| `anaesthetist-moves-list-to-colleague` (only if 32 shipped no Admin trigger for this move; as planned, `colleague-moves-list-to-office`'s "A busy morning" choice already includes hand-ons, so this is likely not needed) | An anaesthetist moves this List to a colleague | Admin · Day view and the List drawer (`/admin/day/:dateISO`), on the List in the context | bar | Runs 32's move into a colleague's free session as the List's anaesthetist (the first colleague with a free session that day, blacklist-clean), so the pool gains a List-move notification with **Draft cover-change email**. Message names both anaesthetists and points to the pool | No List in context, the List is a Draft List or AUTHORISED, or no colleague has a free session that day |

- **The update email is a product action, not a trigger.** Product actions this phase adds:
  **Draft update email** on every Admin Booking (the composer with the change picker and the badged
  preview panel alongside the real `mailto:`), **Draft update email** in the List drawer,
  **Draft cover-change email** on a List-move notification in the pool, and **Master data · Email
  templates** (edit a template, then draft an email of that kind). The preview carries a `DemoBadge`
  because it exists for presenters; it is not in the registry.
- **The office side of an anaesthetist's move** needs an anaesthetist to move a List first. In the
  framed build the presenter moves it on mobile (Phase 32's flow) and switches to Admin; to stay in
  Admin, use 32's trigger for a move into a colleague's session, or the conditional one above.
- **No concurrency trigger.** US-02.5.6 is Future Work, so "Someone else saves this Booking now" and
  the fictional second office user are not built.
- **PWA parity.** The mobile side of this phase is the arrival of an office save, which the handset
  cannot produce itself, so `office-edits-booking` is the PWA stand-in. In the framed build the
  presenter makes the change in Admin and saves. Mobile edits themselves stay immediate and need no
  trigger. The update email is office-only and has no PWA side.

## Out of scope

- Sending the email or recording it as sent. The system only builds a `mailto:` link (US-02.3.3
  "Nothing sent") and records that a draft was opened. No outbox, no "sent" flag, no stored body or
  address. Phase 41 owns letter templates (prepayment letters and reminders), which may reuse this
  phase's builder.
- An automatic email after an anaesthetist's own move (OQ-82, open). On demand only.
- A prompt after a save, a reassignment or a Draft List assignment (OQ-69 answered; US-01.4.1), and
  any "changes since the last email" tracking ("not since last email").
- Concurrent-edit detection, row versions, merging or a clash prompt (US-02.5.6, Future Work), and
  locking or edit presence.
- Explicit save for List edits (`EditListSheet` already saves through its own sheet) and for anything
  outside the Booking detail (Review screen actions, Master data, the matching screen). US-02.3.2 does
  not say whether a List reassignment goes through the explicit save; this phase treats it as its own
  event with its own change set.
- Notification pool behaviour beyond the email action: 32 owns the pool, its rows, paging and the
  colleague's notice; expiry and actioned states are OQ-79.
- Drafts for anaesthetists. Mobile, web and the PWA keep immediate saves (DM-35).
- An as-at view for Lists, Contracts or invoices. The as-at view is for a Booking. Contract versions
  and invoice reproduction are Phase 25's.
- A patient-level history or patient view (Phase 40), and NHI register lookup (Phase 40a).
- Events, additional invoices and credits stay commands (Phases 38b, 39 and 39b).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin, Tue 21 Jul, open a Booking. Nudge the time, type in Notes, change a Procedure's Contract.
      The unsaved bar reads "3 unsaved changes" with those field names. The Day view and the
      anaesthetist's mobile Booking still show the old values.
- [ ] Undo the time by hand. The count drops to 2.
- [ ] Try Mark complete, Cancel, Move and Draft update email while unsaved. Each is disabled with its
      reason ("Save or discard your changes first", or "Save your changes first. The email uses saved
      changes.").
- [ ] Open Edit patient in draft mode. Its button reads Apply; it has an NHI field; an invalid NHI
      shows the validator's message; the header name changes at once; nothing is saved yet.
- [ ] On a SUBMITTED List, the office can edit a Procedure's description; the anaesthetist's web view
      of the same Booking still cannot.
- [ ] Click Day view in the side nav. The leave-without-saving dialog appears. Keep editing stays;
      Discard and leave goes, and reopening the Booking shows the old values.
- [ ] Edit again and switch app in the harness bar, then use the browser back button. Both are
      blocked, and the app switcher still shows Admin. Reload the tab: the browser's own prompt
      appears.
- [ ] Edit again (do not save) and press the harness bar's Reset. The draft discards itself with
      "This Booking was reset. Your unsaved changes were discarded." and shows the seeded values.
- [ ] Save changes. The saved strip shows "Saved · 3 changes" and a mono change-set id, and no email
      prompt. History shows one "Saved by Kirsty W. · 3 changes" row with before and after for each
      field.
- [ ] Change a Procedure's Contract and its anaesthetist adjustment in one save. History shows both,
      with before and after, in the one change-set row.
- [ ] In History, press View as at on an earlier entry. The panel shows the Booking as it was then,
      with the Contract name and version, and no money.
- [ ] Admin Audit viewer shows the Change set column; clicking the id filters to that save.
- [ ] Draft update email on that Booking: the composer lists its history newest first with the latest
      save ticked; To is the surgeon's rooms' contact email; the preview lists only the allowed
      changes (no Contract change, no NHI, no notes) and the character count. Tick an older save that
      changed the time too: the time shows once, first value to last. Untick everything: Open in mail
      client is disabled. Switch Send to Hospital, then Both. Open in mail client: the mail client
      opens with the same content; History gains one "Update email drafted (not sent)" row and nothing
      says sent; the picked rows now carry "In an earlier draft".
- [ ] Change a field and change it back across two saves, then pick both: the field drops out with
      the "cancelled out" note.
- [ ] Pick a cancellation: the Cancellation template is chosen. Switch to Correction of an error: the
      subject and boilerplate change and the picked changes stay.
- [ ] Master data · Email templates: edit the Booking change template's subject, then draft an email
      for a time change: the new subject is used. A body with `{unknown}` is reported in the editor.
      Add a template for Correction, then retire it; retiring the last active template of a kind is
      refused.
- [ ] Paste a very long Procedure description (about 1,800 characters) and change the time, then
      save and pick both. The preview says "Shortened to fit", the body ends with the shortened note
      (singular or plural as fits), the time line is still there, and the link is at most 2,000
      characters.
- [ ] A Booking whose surgeon's room has no contact email: the composer says To will be left empty,
      and the link opens with an empty To.
- [ ] Open the List drawer on a List that already has Bookings. Add Booking opens the add flow; the
      new Booking appears in the drawer; its Draft update email lists the creation. Add Booking also
      works on a Draft List, and the Booking takes the default Contract.
- [ ] A free session still offers Book (phone advice), and the S2 Beat 2 prefill still fills.
- [ ] Reassign a List (S2 Beat 3). The flow ends as before, with no email step. Open one of its
      Bookings: History shows the cover change; Draft update email with the cover change ticked
      defaults to Change of anaesthetist and the hospital, and names both anaesthetists. The List
      drawer's Draft update email gives the List version: the Booking count and no patient names.
- [ ] Reassign the same List twice, then pick both cover changes: one line from the first to the
      last anaesthetist.
- [ ] As an anaesthetist on mobile, move your own List into a colleague's free session (Phase 32). In
      Admin, the pool's notification of the move offers Draft cover-change email; the composer opens
      with the move ticked and To the hospital contact; the notification is unchanged afterwards.
- [ ] As an anaesthetist, return a List to the office. Its notification offers no email and points to
      the Draft List; assign it to Dr Sharma, and the List drawer's Draft update email names the
      original anaesthetist and Dr Sharma.
- [ ] If 32a is DONE: move a single Booking to a colleague. It is a move row in that Booking's
      history, for the rooms; no hospital email is offered for it.
- [ ] A save that adds a Procedure on the anaesthetist's prepaid list (a person paying for the
      patient) creates one held prepayment invoice for admin approval, not two and not none (27's
      re-check runs once, on the real store).
- [ ] Web anaesthetist Booking: edits still save immediately (no bar, no Apply wording, no NHI field).
- [ ] Mobile (framed): an office save made in Admin shows the "Kirsty W. saved changes" banner on the
      open Booking.
- [ ] Installed PWA (`npm run build:pwa` and preview): on a mobile Booking, the demo sheet shows Office
      edits this Booking with the office stand-in badge; firing it moves the time and shows the
      banner; History shows the office save grouped.
- [ ] S5 jump: David Chen's History shows a grouped office save among the per-field entries.
- [ ] No en or em dashes in any new copy (bar, strip, dialog, composer, preview, seeded templates,
      email text, trigger labels and messages), and no "slot" in app copy.
- [ ] Catalogue screenshots: the recipes for US-02.3.1, US-02.3.2, US-02.3.3 and US-02.3.4 are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

- `docs/demo-guide/03-demo-script.md`:
  - **S5 Beat 1:** History now shows the office's grouped save beside per-field entries; add the
    **View as at** click and one Say line ("each save is one change set; we can show the Booking as
    it was at any point"). Update Expected.
  - **S5 discovery points** (L425 to 426 at `3d3a18c`): replace "the concurrency model (single-user by
    design, audited last-write-wins, ...)" with: the office saves explicitly and every save is one
    change set; handling two sources editing at once is Future Work with the automated integrations
    (US-02.5.6), and the prototype applies each save in order, audited.
  - **S2 Beat 3:** the reassignment ends as before; add the cover-change email: open the List drawer
    (or a Booking), **Draft update email**, the cover change ticked, the hospital, the Change of
    anaesthetist template; Say: "Vanessa's main need: the hospital hears about a cover change without
    her typing it. It is on demand, so nobody is nagged after every change." Update Expected.
  - **The anaesthetist's own move beat** (as 32 scripted it): add the office side, the pool
    notification's **Draft cover-change email** to the hospital. Say: "The office sees every move in
    the shared pool and sends the hospital the cover email from there." Whether this should be sent
    automatically is with AA (OQ-82): leave it out of the Say line unless asked.
  - **The rooms email:** in S2 after Beat 2 or in S5, save two changes on one Booking, then **Draft
    update email**, pick both, show the netted body and the template. Say: "AA asked for a button they
    use when it matters, picking the changes to report, starting from their own templates."
  - **Any beat that edits on the Admin Booking detail** (whatever 19 to 27 scripted there, for
    example a Contract pick, a payer capture or an estimate edit): add "then **Save changes**".
  - Direct URLs: the Email templates view in Master data, if it has its own route.
- `docs/demo-guide/04-presenter-cheat-sheet.md`: the save bar and its warning, the on-demand email
  button and its composer (pick changes, templates, rooms for a Booking, hospital for a cover change,
  the pool notification after an anaesthetist's move), Master data · Email templates, the PWA
  trigger, and the recovery ("if a draft gets stuck, Discard"; "the email is always on the Booking and
  the List drawer, nothing is lost by skipping it"). Rewrite discovery topic **"9. Concurrency"**
  (L280 to 284 at `3d3a18c`): the office saves explicitly as one change set; concurrent edits from
  automated sources are Future Work in the catalogue (US-02.5.6), so the prototype applies saves in
  order, each audited.
- `docs/demo-guide/02-workflows-and-handoffs.md`: office Booking changes are saved explicitly as one
  change set; the office drafts an update email on demand from any Booking, picking the changes from
  its history and starting from a template; cover changes (an office reassignment, a Draft List
  assignment, or an anaesthetist's own move, reached from the pool) email the hospital contact.
- `docs/demo-guide/01-personas-and-responsibilities.md`: Vanessa's line gains the on-demand update
  email and the templates she maintains.
- `docs/demo-guide/master-demo-guide.html`: the same sections, including the S5 discovery callout
  (L982 at `3d3a18c`) and the "9 · Concurrency" card (L1121 to 1122).
- Control Panel: the S5 jump message (work item 10).
- **Milestone:** 35 is a milestone phase. End with a consistency read of `master-demo-guide.html`
  against the run sheet (S1 as rebuilt by 34 if 34 is DONE, S2 including 32's move beat, S5), and fix
  drift in the same session. Finish with a grep of `docs/demo-guide/` for "after each save", "after a
  save", "since the last email" and "Tama": none should describe the email or a second editor.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 35` first: earlier phases may have
changed these recipes since this plan was written (Phase 33 left placeholder `absent` recipes for
US-02.3.2 and US-02.3.3, and Phases 28 and 31 moved the drawer and the Booking routes). Because the
phase covers FT-02.3, the tool lists its four stories (if it still lists US-02.5.5 and US-02.5.6, from
an earlier version of this plan, both are handled under "Recipes this phase breaks"). The harness bar is hidden in shots, so a
List-move notification is staged from the `/demo/control` entry for 32's move trigger in `setup` if
it is runnable there; otherwise from a `setup` that makes the move on mobile in a first browser step
(ATLAS.md, Shell).

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md) Create or amend a Booking | partial · admin-phone-advice-booking[free-list,form] admin-amend-booking | captured (admin). Keep `phone-advice-booking`. Re-shoot `amend-booking` as the draft: an edit on the Admin Booking detail opens the Apply sheet (Edit patient with its NHI field) and the unsaved bar (`booking-save-bar`, "3 unsaved changes") shows. Add `add-booking-booked-list` (the List drawer on a List that already has Bookings, **Add Booking** highlighted via `list-add-booking`, then the office add-Booking flow open). Drop the partial reason. Caption: "The office creates a Booking on any List, or amends any field, and each change is recorded against them" |
| [US-02.3.2](../../../../requirements-board/requirements/stories/US-02.3.2.md) Save Booking changes explicitly | absent (placeholder: "Not built yet: catch-up Phase 35 builds this.") | captured (admin). Shots: `save-bar` (unsaved bar listing the changed fields, `booking-save-bar`), `leave-guard` (the leave-without-saving dialog after navigating away with unsaved edits), `saved-history` (after Save changes: History shows one grouped save with who and when, `booking-as-at` open). Replace the placeholder |
| [US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md) Draft a booking update email | absent (placeholder: "Not built yet: catch-up Phase 35 builds this.") | captured (admin). Shots: `pick-changes` (the composer from a Booking's Draft update email with two history rows ticked, `update-email-composer` highlighted), `email-preview` (`update-email-preview` with To the surgeon's room, subject, boilerplate and the picked changes, "The system does not send it" visible), and `cover-change-email` (a List-move notification in the pool with Draft cover-change email, `pool-cover-email`, then the composer with the move ticked and To the hospital contact). Captions: "The office picks the changes from the history; the email opens in their own mail client and the system sends nothing" |
| [US-02.3.4](../../../../requirements-board/requirements/stories/US-02.3.4.md) Update email templates per kind of change | none (create it) | captured (admin). Shots: `template-list` (Master data · Email templates with the four kinds) and `template-edit` (the editor sheet with the placeholder list and the sample preview). Caption: "Admins keep a template per kind of change; the update email starts from it" |

**Recipes this phase breaks.** Admin Booking detail edits are now draft-then-save, History groups by
change set and shows the List's cover changes, and the Edit patient sheet gains a field. Found at plan
time:
- `US-02.3.1` `amend-booking`: re-shot as above (the Edit sheet now applies to the draft).
- `US-02.5.5` `card-history` and `audit-log`, and `US-02.5.1` `card-history`: the History tab shows
  grouped saves and the as-at control, and the Audit viewer the change-set column; re-shoot and check
  the `[role=dialog]` highlight still lands. Keep the shot `name`s.
- `US-13.5.2` `audit-viewer` (`/admin/audit`): gains the change-set column; check only.
- `US-01.4.1` `reassign`: unchanged (the flow still auto-closes); check only.
- `US-02.5.6`: Future Work, out of this phase; leave its recipe as it is.
- Recipes that edit on the Admin Booking detail and then expect the change to be saved by the sheet
  (as 19 to 27 left them, for example `US-04.3.2` `contract-picker`, `US-04.3.4` `billing-setup`,
  `US-07.2.2` `correct-contract`, `US-05.4.2` and `US-07.2.3` `price-override`, `US-11.1.1`
  `edit-patient`). They mostly open the sheets, so most keep working; any that now needs the buttons
  to read **Apply** (draft mode) or a **Save changes** step is updated. The `--dry` run is the check.

**ATLAS.md.** Update Routes (the data-router migration changes no URL; note the Booking route name as
built and the Email templates view), Existing hooks (`booking-save-bar`, `booking-as-at`,
`update-email-composer`, `update-email-preview`, `pool-cover-email`, `list-add-booking`), Overlays
(the leave-without-saving dialog, the composer, the template editor) and the Admin selector tips
(sheet buttons read Apply in draft mode; Save changes in the bar).

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
  bar; no NHI field or SUBMITTED description edit for the anaesthetist; the anaesthetist never calls
  `saveBookingChanges`.
- **Save applies onto the real state.** The admin's changes are applied to the Booking as it is at
  Save time, `before` values are read from it, untouched fields are left alone, and a cancel, move or
  authorise in between blocks the save with a reason. No row version, merge or clash code was added
  (US-02.5.6 is Future Work).
- **Ids and invariants at save.** Draft-created ids are remapped against the real counters;
  references are rewritten; split-share validity, one primary Procedure, Contract eligibility and the
  NHI format are re-checked on the candidate, not only in the draft.
- **One save is one change set** with a header, the actor is the office, and the stamps never appear
  in audit before or after. `coalesceAudit` never merges across change sets. Every List owner change
  carries a `listReassign` change set whichever app made it.
- **As-at correctness.** Reconstruction orders by audit sequence (minute-resolution clock ties), stops
  honestly at an unknown action, and matches the snapshot after each step in the round-trip test.
- **The email.** It is on demand only: no prompt after a save, a reassignment or an assignment, and no
  automatic send (OQ-82). Only the picked rows appear, netted per field; only allowlisted fields
  appear (no NHI, DOB, notes, money, Contract or payer details); a List email names no patient. The
  encoded link is at most 2,000 characters, with the shortened note when lines were dropped.
  Recipients follow the template and OQ-46 (rooms for a Booking change, the hospital for a cover
  change). Opening a draft writes exactly one `updateEmail.drafted` entry: nothing is labelled or
  stored as sent, no body or address is kept, and no Booking field or `lastModifiedBy` changes.
- **Templates.** Every kind keeps one active template; rendering never leaves braces; an edited
  template is used by the next draft; the seeded text has no dashes; edits are audited.
- **Cover changes are reachable everywhere a List changes hands** (the Booking's history, the List
  drawer and the pool notification), picked, never prompted; a return to the office offers nothing
  until assignment; a single-Booking move is a rooms change, not a cover change; drafting does not
  alter the pool.
- **Derived follow-ons.** A save runs `syncPrepayment` once on the real store; in the draft store it
  is a no-op, so a draft never touches `billing` or emits an app event.
- **The unsaved guard** blocks every in-app route change and the browser back, prompts on reload, never
  blocks a clean draft, never fires on the `mailto:` click, and the router migration changed no URL or
  Playwright entry point.
- **Triggers.** `office-edits-booking` is PWA-only with the office stand-in badge and acts only on
  the Booking in the URL through `saveBookingPatch`; the conditional move trigger (if added) acts on
  the List in context; bodies sit in `src/shared` and pass `pwaPurity`.
- **Copy and design.** No en or em dashes; no "slot" in app copy; teal only for actions; crimson
  nowhere on the new surfaces; warning tint for unsaved, success for saved, neutral for notices.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built, the readings taken, anything logged rather than fixed, and the
  screens worth a look, each with its route and persona. At least: OQ-82 built as on demand only;
  US-02.3.3 still Verify (Ben to confirm the office's cover-change email from a List move); the four
  seeded template kinds and their wording (Correction of an error and Booking change are our split of
  Greg's examples); the newest change ticked by default in the picker; anaesthetist edits and applied
  hospital rows being pickable; the List-level email naming no patients; a List reassignment as its
  own event, not a save; a single-Booking move (32a) as a rooms change, not a cover change, against
  32a's handoff (OQ-46's "a new anaesthetist on a List"); every field the office can now edit (and any
  left read-only, with why).
- Status table: Phase 35 row DONE with the date.
- Phase entry "Phase 35 · Explicit save and the update email (date)":
  - the drift-check result against `3d3a18c`; OQ-69, OQ-65 and OQ-46 built as answered; OQ-82's status;
  - what 31, 32 (and 32a if DONE) delivered that this phase hooks into (the owner-change action codes,
    the Draft List assignment, the pool's notification record and row);
  - the write inventory table (drafted versus command) as built, and the fields opened up for the
    office;
  - the model: `AuditEntry.changeSetId`, the `CS` id format, `mutate`'s `changeSet` option,
    `masters.emailTemplates` and the `ET` id format;
  - `PERSIST_VERSION` from and to;
  - the router migration to a data router and anything it changed in tests;
  - which seeded audit actions the as-at test had to add to the reverse table or correct;
  - tests added (changeSets, bookingAsAt, bookingSaveActions, draft store, guard, updateEmail with the
    picker, netting and templates, the composer component tests, the source-scan, the web
    immediate-save test, the drawer and pool tests, the Playwright spec);
  - the Catalogue screenshots result: recipes created or changed, the REPORT.md counts (captured,
    partial, absent, failed) before and after, and any partial reason handed to a later phase;
  - the adversarial review pass and what it fixed.
- Binding conventions: convention 7 gains "a save groups its audit entries under one change-set id".
- Decisions log:
  - **Supersedes**, for the office only, the 2026-07-23 Phase 04 capture-UX ruling "write-through per
    tap, never debounce" (RV-31): Admin Booking edits are draft-then-save; the anaesthetist keeps
    write-through.
  - **Kept**: the 2026-07-22 fourth-review #8 stance (single-user, audited, saves applied in order)
    stands, because concurrent edits (US-02.5.6) are Future Work; record that a save applies the
    admin's own changes onto the real state.
  - **Extends** the 2026-07-27 audit-presentation decision: change-set grouping sits above view-only
    coalescing; the Booking's History shows its List's cover changes; the as-at view is Admin-only and
    money-free.
  - New: drafted edits versus commands (and why commands are disabled while unsaved, and why 27's
    re-check runs at save); the email field allowlist; the OQ-46 recipients; the on-demand button
    with changes picked from the history and no prompt anywhere (OQ-69, D19); templates per kind of
    change with four seeded kinds (US-02.3.4); the cover email reached from the pool notification
    (OQ-65, D15) and from the List drawer, never from the reassign flow (US-01.4.1); the "drafted, not
    sent" audit entry as a picker hint only; a List reassignment as its own event, not a save; a
    single-Booking move as a Booking change for the rooms, not a cover change (OQ-46's "a new
    anaesthetist on a List"); `MAILTO_MAX_LENGTH` as one labelled constant; on demand only pending
    OQ-82.
- Handoff notes:
  - **40:** the patient view can link each invoice's Booking to its as-at view; 40a's NHI lookup
    replaces the plain NHI field in the office's Edit patient sheet.
  - **41:** prepayment letters and reminders can reuse `updateEmail.ts`'s mailto builder, length rule
    and the template master (a new kind per letter).
  - **43:** the NHI leak scan should cover email bodies and templates built by `updateEmail.ts` (the
    allowlist test is the first guard).
  - **44:** the S5 rewrite keeps the grouped save and the as-at click; S2 keeps the cover-change email
    from the drawer and the pool; the PWA-parity audit includes `office-edits-booking`; the cheat
    sheet's concurrency topic says Future Work; the drift check re-reads OQ-82 and US-02.3.3.
