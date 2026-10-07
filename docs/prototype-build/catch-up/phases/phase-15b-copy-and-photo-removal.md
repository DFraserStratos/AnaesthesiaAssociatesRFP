# Phase 15b · Copy and photo capture out of the prototype

**Requirements covered:**
[RV-25](../analysis/reverse-check.md#rv-25-photo-of-the-paper-booking-card-is-a-first-class-option-in-the-add-a-booking-flow)
photo of the paper booking card offered as a first-class option in the Add a booking flow.
Follow-up work for built Phase 15's covers (they stay on Phase 15; this phase does the removal they now
ask for): [RV-03](../analysis/reverse-check.md#rv-03-copy-a-booking-is-retired-and-flagged-for-removal-from-the-prototype-but-phase-15-rebuilt-it)
Copy a Booking is Retired but Phase 15 rebuilt it, and
[DM-39](../analysis/domain-model-delta.md#dm-39) remove the copy action and its fields, photo capture is
Future Work.
Retired or Future, so removed or hidden here, not built:
[US-02.4.3](../../../../requirements-board/requirements/stories/US-02.4.3.md)
Copy a Booking (Retired 2026-10-02, "to be removed from the prototype"),
[US-02.4.4](../../../../requirements-board/requirements/stories/US-02.4.4.md)
Add a Booking from a photo of the booking card (Proposed, Future Work) and
[US-02.4.2](../../../../requirements-board/requirements/stories/US-02.4.2.md)
Photo capture of the physical card (Retired).
Read alongside (unchanged by this phase):
[US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md)
Add a Booking manually,
[FT-02.4](../../../../requirements-board/requirements/stories/FT-02.4.md)
Anaesthetist ad hoc booking,
[US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md)
Add additional Procedures (the path that replaces Copy),
[FT-03.2](../../../../requirements-board/requirements/stories/FT-03.2.md)
Booking structure, and
[domain-model.md](../../../../requirements-board/requirements/domain-model.md) section 2,
"Booking > Sources" (still stale: see the drift check).
Evidence: [the 2026-10-02 booking and pricing review with Greg](../../../../requirements-board/requirements/notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md)
points #2, #3, #26 and #27.
**Depends on:** Phase 15a, both sessions. 15a's session 2 reshapes the banner area of the shared
`BookingDetailBody` (the warnings panel), which is where the copied-from banner sits, so this phase
edits that file after it. Phase 14's registry (`src/shared/demoTriggers/`) carries the one optional
trigger. Runs straight after 15a and before 16, so the first milestone (after 16) has the warnings and
the removals.
**Estimated:** 1 session. A removal with a small reshaping of the Add a booking sheet; no new model.

## Goal

The 2026-10-02 review took two capture paths out of the first release, and the prototype still shows
both.

**Copy a Booking is Retired** (US-02.4.3). Greg: "I think it's redundant because it was probably an
early response to the fact that they couldn't add a procedure to a booking." Donald: "It should be
retired, and its features removed from the prototype." Phase 15 rebuilt Copy as a skeleton-only new
Booking the same day, so that build, and its Decisions-log ruling, are now superseded. This phase
removes Copy completely: the store action, its audit action and label, `Booking.copiedFromBookingId`,
the `'copy'` Booking source and its label, the "Copy booking" action and the copied-from banner in the
shared `BookingDetailBody` (one component, so all three apps), their tests, recipes and demo-guide
lines. Another procedure for the same patient is added inside the Booking with **Add another
procedure** (US-03.2.3), which already exists and does not change.

**Adding a Booking from a photo is Future Work** (US-02.4.4, RV-25). The "Photo of paper list" choice
leaves the Add a booking sheet on mobile and web and in the office's phone-advice flow. With one way in
left, the sheet stops being a fork: **"Add a booking" opens straight on the manual form**, titled "Add
a booking". The photo source wording ("Added from a photo of the booking card") leaves app copy and the
`'anaesthetistPhoto'` source value goes. The simulated `PhotoCaptureFlow` stays in code only behind
one badged Future-scope demo action on the mobile List screen, so a presenter can still answer "what
about photographing the card?" without it reading as first-release scope (default; see work item 7
for the fallback that deletes it instead).

`Booking.source` stays optional and display-only, with four live values. No behaviour other than
these two capture paths changes: the post-op addendum, attachments, the warnings and every billing
figure are untouched.

## Before you start: drift check

1. Run the catalogue diff since this plan's baseline:

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-02.4.1,US-02.4.2,US-02.4.3,US-02.4.4,FT-02.4,US-03.2.3,FT-03.2
   ```

   Read the hunks for US-02.4.1, US-02.4.2, US-02.4.3, US-02.4.4, FT-02.4, US-03.2.3, FT-03.2 and the
   domain-model's Booking section (its Sources bullet and the glossary).
2. If an item changed, re-read it and adjust the work items. Specifically:
   - **US-02.4.3.** If Copy came back (status no longer Retired), stop and tell the owner: removing a
     restored feature is destructive.
   - **US-02.4.4.** If photo capture moved back into the first release (swimlane no longer Future
     Work, or status Confirmed), keep the "Photo of paper list" choice and the chooser, drop work
     items 6 and 7, and do the Copy removal only. If it was Retired, take work item 7's fallback
     (delete `PhotoCaptureFlow`).
   - **US-02.4.1.** If manual entry gained a second entry route (a template, a search, a scan of a
     different kind), keep the chooser with those choices instead of opening straight on the form.
   - **Domain-model "Booking > Sources".** At `3d3a18c` it still lists "anaesthetist ad hoc
     (optionally from a photo of the physical card), copy of another Booking", which contradicts
     US-02.4.3 (Retired) and US-02.4.4 (Future Work); DM-39 follows the stories. If the bullet has
     been corrected, note it; if not, log it on the "For the owner's review" list as a catalogue fix
     for the requirements owner (this phase never edits the catalogue).
3. **Open questions: none.** No OQ blocks this phase and nothing built here is provisional. The two
   readings below are defaults, recorded in PROGRESS and on the owner's review list:
   - **The sheet opens straight on the manual form**, because a one-choice chooser is a dead step
     (ease of use is the headline requirement). The back chevron to the fork goes with it.
   - **The photo flow is kept behind one badged Future-scope demo action** on the mobile List screen,
     the same treatment Phase 14 gave the HL7/FHIR tooling and Phase 34 gives surgeon PDF ingest.
4. **Confirm 15a is DONE**, both sessions: a Phase 15a PROGRESS entry marked DONE, `WarningsPanel` in
   `BookingDetailBody`, and no submit confirm step. If 15a's session 2 has not landed, stop: this phase
   edits the same banner block. Note the current `PERSIST_VERSION` (16 after 15a session 1; 15a session
   2 may have bumped it).
5. Record the result (changed items, the Sources bullet's state, the two defaults) in the PROGRESS
   entry.

## Reference

**Design (convention 17).** [Design Language.dc.html](../../../design/Design%20Language.dc.html): teal
is the only action colour, the `DemoBadge` warning tint marks a simulation, and the Future-scope badge
is the one Phase 14 already uses (`DemoTriggerBadge`, `badge: 'future-scope'`, which renders
`DemoBadge tone="future"`; use the same `DemoBadge tone="future"` inside the sheet, convention 13).
[Mobile App.dc.html](../../../design/Mobile%20App.dc.html) screen 2 (the List with its dashed "Add a
booking" button) and screen 3 (the Booking detail, whose action stack loses "Copy booking"). No mockup
draws the chooser; the manual form's own section headings ("Patient", "Operation", "Billing route")
stay, under one sheet title. On web the surface seam renders the same flow as a `Dialog`.

**Catalogue and analysis.**
- The items above. US-02.4.3's note is the instruction ("Retired 2026-10-02 and to be removed from the
  prototype"); US-02.4.4's note records the split and the move to Future Work.
- [analysis/reverse-check.md](../analysis/reverse-check.md): RV-25 (the evidence list is the work list
  for the photo half) and RV-03 (the evidence list for the Copy half).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md#dm-39) DM-39 ("Impact": delete
  the copy action, its audit action, the field, the source value, their tests and demo-guide beats;
  decide whether to keep the photo flow behind a Future-scope badge) and the contradictions list (the
  stale Sources bullet).
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Summary item 11 ("Removals and hide-from-demo") and the
  "Hide or badge" line; the RV-03 and RV-25 rows; [epics/EP-02.md](../epics/EP-02.md) (FT-02.4).
- [analysis/prototype-map-shared.md](../analysis/prototype-map-shared.md) (the Booking detail body,
  the flows) and [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) (the
  trigger registry, the PWA sheet).
- PROGRESS.md Decisions log: **2026-10-02 "Copy is a skeleton-only new Booking"** (superseded here),
  Phase 15's `Booking.source` entry (amended here: two values go) and **2026-07-23 "Phase 03 store
  additions"** (`createCard` as "the ad-hoc/manual AND photo path"; the photo half becomes a
  Future-scope demo).

**Code entry points** (paths under `aa-prototype/src/` unless noted; line numbers at plan time, before
15a session 2):
- **Copy, store:** `store/bookingActions.ts` `copyBooking` and its section header (~176-269), the
  `addProcedure` doc comment that says its skeleton "mirrors copyBooking's" (~418);
  `store/index.ts:70` (export).
- **Copy, model:** `domain/types.ts` `BookingSource` (~371, drop `'anaesthetistPhoto'` and `'copy'`)
  and `Booking.copiedFromBookingId` with its doc comment (~382-383).
- **Copy, UI:** `shared/booking/BookingDetailBody.tsx`: the `Copy` icon import (L2), `copyBooking`
  import (L15), the `onCopied` prop and its doc (~44-45, ~125), `doCopy` (~339-346), the
  `copiedFromBookingId` term in `hasBanners` (~466) and the copied-from banner (~479-483), the "Copy
  booking" button and its caption (~647-655). The three wrappers that pass `onCopied`:
  `apps/mobile/screens/BookingDetailScreen.tsx` (~15, ~48, ~120) with `apps/mobile/routes.tsx:127`,
  `apps/web/screens/BookingDetailView.tsx` (~16, ~33, ~93) with `apps/web/routes.tsx:108`, and
  `apps/admin/screens/AdminBookingDetail.tsx` (~16, ~28, ~70) with `apps/admin/routes.tsx:126`.
- **Copy, audit and format:** `shared/audit/actionLabels.ts:25` (`'booking.copy'`),
  `shared/audit/fieldLabels.ts:27` (`copiedFromBookingId`), `shared/format.ts` `BOOKING_SOURCE_LABELS`
  (~166-176, the `anaesthetistPhoto` and `copy` entries), `domain/seed/audit.ts` `bookingContext`
  (~121).
- **Comments that name Copy:** `shared/surface/context.ts:86` and `:92`, `shared/surface/SurfaceProvider.tsx:189`,
  `domain/billing/fee.ts:103` ("an additional procedure (e.g. on a copied Booking)").
- **Photo:** `shared/flows/AddBookingFlow.tsx` (the `Mode` union, `sourceFor`, the chooser ~102-107 with
  `ChooseButton`, the back chevron, the photo prong ~119), `shared/flows/PhotoCaptureFlow.tsx`,
  `shared/flows/sampleExtractions.ts`, `shared/flows/index.ts:7-8`. Callers of `AddBookingFlow`:
  `apps/mobile/routes.tsx` (~137, `MobileListsRoute`, opened by `ListDetailScreen`'s `onAddBooking`
  when `list.state === 'DRAFT'`), `apps/web/screens/ListDetailView.tsx:257`,
  `apps/admin/flows/PhoneAdviceBooking.tsx:97`.
- **Keep:** `assets/samplePaperCards.ts` (`PAPER_CARD_A`, `PAPER_CARD_B`): `assets/sampleAttachments.ts`
  uses them for the attach sheet's "Booking card photo" samples. `ManualBookingForm`'s `attachment` and
  `initial` props stay (the kept photo demo uses them).
- **Triggers:** `shared/demoTriggers/registry.ts` (`MOBILE_LISTS` ~54, the Future-scope entries
  ~448-497 as the pattern), `shared/demoTriggers/memory.ts` (the UI-only trigger memory store),
  `shared/demoTriggers/types.ts`, `pwa/pwaPurity.test.ts`.
- **Persistence:** `store/appStore.ts` `PERSIST_VERSION` (~136) and its version comment block.
- **Tests to change:** `store/bookingActions.test.ts` (`describe('copyBooking')` ~146-310 and the
  header comment), `store/bookingSource.test.ts` (`SOURCES` ~21, "Copy stamps copy" ~75-80),
  `shared/audit/auditNarrative.test.ts:267`, `shared/demoTriggers/demoTriggers.test.ts`.
  Playwright (`aa-prototype/visual/`): `mobile-phase04.spec.ts:149-160` (the Copy test and shot
  `m4-10-copied-skeleton.png`), and every spec that clicks "Enter manually": `mobile-phase03.spec.ts:55`,
  `mobile-interactions.spec.ts:145` and `:158`, `admin-phase06.spec.ts:187` and `:214`.
- **Docs in the app folder:** `aa-prototype/README.md` (~91 "Booking creation and Copy", ~390 "No real
  camera. `PhotoCaptureFlow` …").
- **Outside the app:** recipes `requirements-board/capture/recipes/US-02.4.1.json`, `US-02.4.2.json`,
  `US-02.4.3.json`, `US-03.2.3.json`, `US-11.1.3.json`, `US-14.4.1.json` (and a new `US-02.4.4.json`),
  and `requirements-board/capture/ATLAS.md` (~157, ~319, ~364-366, ~375).

## Work items

1. **Baseline.** Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` and
   record the counts. Then the inventory grep, kept for the PROGRESS entry:

   ```
   grep -rn -e copyBooking -e copiedFromBookingId -e "booking\.copy" -e "'copy'" -e onCopied -e "Copy booking" -e "Copy of another" -e doCopy -e anaesthetistPhoto -e "Photo of paper" -e "Enter manually" aa-prototype/src aa-prototype/visual aa-prototype/pwa
   ```

   Ignore the unrelated "Copy" hits (`GradientLab` "Copy config", `PwaDemoPanel` "Copy diagnostics",
   the `routing.spec.ts` comment).

2. **Copy out of the store and the model.**
   - Delete `copyBooking` and its section from `store/bookingActions.ts`, and its export from
     `store/index.ts`. Reword the `addProcedure` doc comment so it stands alone (its skeleton is an
     empty additional Procedure that inherits the funding context from the Booking's first
     Procedure; no reference to Copy).
   - In `domain/types.ts`: delete `Booking.copiedFromBookingId` and its comment, and narrow
     `BookingSource` to `'hospitalDownload' | 'surgeonPdf' | 'admin' | 'anaesthetistAdHoc'` (both
     `'copy'` and `'anaesthetistPhoto'` go; work item 6 covers the photo half). Update its comment:
     the catalogue's live sources, with the domain-model bullet's copy and photo entries noted as
     Retired and Future Work (DM-39).
   - `domain/seed/audit.ts` `bookingContext`: drop the `copiedFromBookingId` line.
   - Let `tsc -b` find every other use; there should be none outside the files named here.

3. **Copy out of the shared Booking detail** (`shared/booking/BookingDetailBody.tsx`, so mobile, web,
   Admin and the PWA at once). Change only the copy pieces; 15a's warnings panel and the prepayment
   row beside it stay exactly as 15a left them.
   - Remove the `Copy` icon and `copyBooking` imports, `doCopy`, the `onCopied` prop and its doc
     comment, the `copiedFromBookingId` term in `hasBanners` and the copied-from banner.
   - Remove the "Copy booking" button and its caption ("Starts a new Booking for this patient on this
     List. To add a procedure to this Booking, use Add another procedure."). The action stack keeps
     "Cancel booking" alone. "Add another procedure" stays where it is, in the Procedures section, and
     is now the only way to add a Procedure for the same patient; it needs no new caption.
   - Remove `onCopied` from `BookingDetailScreen`, `BookingDetailView` and `AdminBookingDetail` and
     from their three route call sites.
   - Reword the comments in `shared/surface/context.ts` (~86, ~92), `SurfaceProvider.tsx` (~189) and
     `domain/billing/fee.ts` (~103: "an additional procedure (added with Add another procedure)").

4. **Audit and format.** Delete `'booking.copy'` from `ACTION_LABELS`, `copiedFromBookingId` from
   `FIELD_LABELS`, and the `copy` and `anaesthetistPhoto` entries from `BOOKING_SOURCE_LABELS`
   (`Record<BookingSource, string>` then type-checks the narrowed union). Historical audit rows that
   name `booking.copy` cannot exist after the reseed in work item 5.

5. **Persistence and the seed.**
   - The seed creates no copies and stamps neither removed source (Phase 15's seed rule gives scenario
     Bookings `hospitalDownload`, `surgeonPdf` or `admin`, and leaves history Bookings unset). Prove it
     with a seed test: no seeded Booking has `copiedFromBookingId`, every seeded `source` is one of the
     four live values, and no seeded audit row has action `booking.copy`.
   - The persisted shape still changes (a field and two union members go), and a rehearsal's
     persisted state may hold a copy made by hand, whose `'copy'` source would now have no label.
     **Bump `PERSIST_VERSION`** by one from whatever 15a left (16 at plan time), with a comment line:
     "Copy a Booking removed (US-02.4.3 Retired): no `copiedFromBookingId`, no `'copy'` or
     `'anaesthetistPhoto'` source".

6. **Photo capture out of the Add a booking sheet** (`shared/flows/AddBookingFlow.tsx`).
   - Delete the chooser: the `'choose'` mode, the "Enter manually" and "Photo of paper list"
     `ChooseButton`s, the `ChooseButton` helper and the back chevron ("Back to Add a booking"). The
     sheet opens on the manual form under a sheet title **"Add a booking"**, styled one step above the
     form's own 17px bold section headings ("Patient", "Operation", "Billing route") so the title and
     the first section do not read as equals (take the sheet-title treatment from the design files).
     `Mode` becomes `'manual' | 'photo' | 'done'`, reset to its starting mode each time the sheet
     opens. The "Add a booking" title shows in manual mode only; photo mode keeps
     `PhotoCaptureFlow`'s own "Photo of the paper list" heading, so the sheet never stacks two titles.
   - Add an optional `initialMode?: 'manual' | 'photo'` prop, default `'manual'`. Only the Future-scope
     demo (work item 7) passes `'photo'`. In photo mode the sheet shows no back control (there is no
     fork to go back to; the sheet's own close is the exit) and carries a `<DemoBadge tone="future" />`
     ("Future scope", convention 13) above the existing `PhotoCaptureFlow` demo badges.
   - `sourceFor` becomes: `'admin'` for an office actor, `'anaesthetistAdHoc'` otherwise, for both
     modes. A Booking made through the Future-scope photo demo is an anaesthetist ad hoc Booking with a
     photo attachment, which is honest, and no app copy says "from a photo".
   - The three callers need no change for the manual path beyond the new prop default (mobile
     `MobileListsRoute` also gains the work item 7 request subscription): web `ListDetailView` and
     mobile `MobileListsRoute` open the manual form directly; `PhoneAdviceBooking`'s "Continue to add booking"
     lands on the manual form with its S2 lookup prefill, as before minus the "Enter manually" click.
   - Update the `AddBookingFlow` doc comment: one way in (manual), the photo prong reachable only
     through the Future-scope demo action.
   - Component test (new `shared/flows/AddBookingFlow.test.tsx`): opening the sheet shows the manual
     form and the title, with no "Photo of paper list" and no "Enter manually"; with
     `initialMode="photo"` it shows the sample-card picker and the Future-scope badge; an office actor
     saves with source `admin`, an anaesthetist with `anaesthetistAdHoc` in both modes.

7. **The Future-scope photo demo** (default), or the fallback.
   - **Default: keep it behind one demo action.** Add `photoCaptureRequest: { listId: string; n: number } | null`
     with `requestPhotoCapture(listId)` and `clearPhotoCaptureRequest()` to the UI-only store in
     `shared/demoTriggers/memory.ts` (not persisted, no domain state, no audit; the counter `n` lets a
     second request re-open the sheet). `MobileListsRoute` in `apps/mobile/routes.tsx` subscribes:
     when a request names the List on screen, it opens `AddBookingFlow` with `initialMode="photo"` and
     clears the request; closing the sheet returns `initialMode` to `'manual'`.
   - Register the entry in `shared/demoTriggers/registry.ts` (see Demo triggers): it calls only
     `requestPhotoCapture`, so `pwaPurity.test.ts` holds. Add a registry test: shown only on
     `/mobile/lists/:listId`, disabled on a List that is not DRAFT, and `run` sets the request for the
     List in the URL.
   - **Fallback (use it if the request plumbing fights the slide stack, or if the drift check found
     US-02.4.4 Retired):** delete `PhotoCaptureFlow.tsx`, `sampleExtractions.ts` and their exports in
     `shared/flows/index.ts`, drop `initialMode`, and register no trigger. Keep
     `assets/samplePaperCards.ts` (the attach sheet's samples use it) and `ManualBookingForm`'s
     `attachment` prop if anything else passes it, otherwise drop it too. Record which way it went.

8. **Tests and specs.**
   - `store/bookingActions.test.ts`: delete `describe('copyBooking')` and the header comment's Copy
     line. If a test inside it asserts something that is not about Copy (the rights matrix of another
     action, `findBookingByCorrelation`), move it under the action it tests rather than losing it.
   - `store/bookingSource.test.ts`: `SOURCES` becomes the four live values; delete "Copy stamps copy";
     keep the creation-path tests (manual and office prongs, HL7/FHIR, PDF row, addendum).
   - `shared/audit/auditNarrative.test.ts:267`: test a live value (`'admin'` renders "Office entry").
   - Playwright: delete the Copy test in `visual/mobile-phase04.spec.ts` (and its `m4-10` shot); remove
     the "Enter manually" click from `mobile-phase03.spec.ts`, `mobile-interactions.spec.ts` (twice)
     and `admin-phase06.spec.ts` (twice), each now waiting for the manual form's "Patient" heading
     instead. Add one spec: the mobile and web Add a booking sheets open on the manual form with no
     photo choice, and a Booking detail on all three surfaces has no "Copy booking".
   - Re-run the inventory grep from work item 1: no hit for `copyBooking`, `copiedFromBookingId`,
     `booking.copy`, `onCopied`, `doCopy`, "Copy booking", "Copy of another", `anaesthetistPhoto`,
     "Photo of paper" or "Enter manually" may survive in `src`, `visual` or `pwa`; list any accepted
     leftover in PROGRESS.

9. **Prototype README.** `aa-prototype/README.md`: "Booking creation and Copy (`bookingActions.ts`)"
   becomes "Booking creation"; the "No real camera" line says `PhotoCaptureFlow` is a Future-scope demo
   reached from the mobile List's Demo actions (or delete the line under the fallback).

10. **Demo guide, Control Panel and ATLAS** (the same session; see Demo guide updates).

11. **Finish.** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, all green;
    then the review pass, the catalogue screenshot step and the PROGRESS entry.

## Demo triggers

None is needed for the removal: Copy is gone, and manual entry demos through normal use.

1. **"Photo capture (Future scope)"** (default only; none under the fallback) · Mobile · List
   (`/mobile/lists/:listId`) · surfaces bar and pwa · `badge: 'future-scope'` · description "Opens the
   simulated photo of a paper booking card on this List. Photo capture is Future Work (US-02.4.4), not
   first-release scope." · `run` calls `requestPhotoCapture(ctx.params.listId)` and returns "Photo
   capture opened on this List (Future scope)." · disabled "This List is no longer open for new
   Bookings" when the List is not DRAFT, and "List not found" for a stale id · `indexPath`
   `/mobile/lists/L-34821-2026-07-21-PM` (Dr Souter's Tue 21 PM List, a DRAFT List the recipes already
   use). Nothing is added to the Control Panel page; its index lists the entry under Mobile · List.

**PWA:** the same entry shows in the PWA Demo sheet on the List screen (surfaces include `pwa`), so the
handset demo matches the framed one. No office stand-in is needed: nothing here waits on the office.

## Out of scope

- **Add another procedure** (`addProcedure`) and its behaviour: unchanged. Exactly one primary
  Procedure, "Make primary" and the multi-procedure rule are Phase 23's.
- The post-op addendum Booking and its `source` stamping (38b replaces it with an additional invoice,
  39b with post-op events).
- `Booking.source` as a field: it stays optional and display-only, read by no rule (Phase 15). Phase 33
  re-points the HL7/FHIR `hospitalDownload` stamp through the matching screen.
- The rebill drafted from a copy of an invoice's lines (US-08.6.6, Phase 39) and "Copy original lines":
  a different thing from Copy a Booking. Leave every "copy" outside Copy a Booking alone ("Copy
  diagnostics", "Copy config", "copied" URLs).
- Attachments and the attach sheet's "Booking card photo" samples (US-03.1.3, built in 15). The
  sample paper-card assets stay.
- Surgeon PDF ingest and the HL7/FHIR tooling (badged by 14, demoted by 34).
- Any edit to a catalogue requirement's text or status, including the stale domain-model Sources
  bullet (logged for the owner).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to
the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Mobile → Dr Souter Tue 21 Jul PM List → Margaret Ellison's Booking
      (`/mobile/lists/L-34821-2026-07-21-PM/bookings/BK0009`): no "Copy booking" button, no copy
      caption; "Add another procedure" still adds a time-only Procedure 2; "Cancel booking" still works.
- [ ] The same Booking on web (`/web/lists/L-34821-2026-07-21-PM/bookings/BK0009`) and in Admin
      (`/admin/day/2026-07-21/bookings/BK0009`): no Copy action; the warnings panel and the
      prepayment row (Annette Riley, `/admin/day/2026-07-24/bookings/BK0038`) look exactly as 15a left
      them.
- [ ] Mobile and web: "Add a booking" on the Tue 21 PM List opens straight on the manual form under
      "Add a booking", with no chooser, no "Photo of paper list" and no back chevron; a saved Booking
      shows "SOURCE · Added by anaesthetist".
- [ ] Admin S2: Dr Sharma's Tue 21 PM Free List → Book (phone advice) → St George's, Mr T. Hale →
      Continue to add booking lands on the manual form; Look up fills it; Review → Save booking → Done;
      the Booking shows "Office entry".
- [ ] Mobile List Demo actions (harness bar): "Photo capture (Future scope)" shows with its badge,
      opens the sample-card picker on that List, and a saved Booking carries the paper-card photo and
      "Added by anaesthetist"; the entry is disabled on an AUTHORISED or SUBMITTED List and absent on
      every other screen. (Fallback: no such entry anywhere.)
- [ ] PWA (`npm run dev:pwa`): the Add a booking sheet opens on the manual form, no Booking offers
      Copy, and the Demo sheet on a List offers the Future-scope photo entry (default only).
- [ ] The Audit viewer and History sheets render every action with a label (no raw `booking.copy`
      after Reset); the Data Inspector shows no `copiedFromBookingId`.
- [ ] After Reset, S1 to S5 run as scripted in the patched guide, with every figure unchanged
      (Holt's $396.18 in S3 included).
- [ ] No app copy says "copy" for a Booking or "photo" as a Booking source; no new string has an en
      or em dash; teal is the only action colour.
- [ ] Catalogue screenshots: the recipes this phase broke are re-pointed (US-02.4.1, US-03.2.3,
      US-11.1.3, US-14.4.1), US-02.4.2 and US-02.4.3 are absent as Retired, US-02.4.4 has an absent
      Future recipe, a full `npm run capture` ends with no failed recipe and no story without a recipe,
      the changed shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.

## Demo guide updates

- `03-demo-script.md` **S2 Beat 2**: "Select **Continue to add booking → Enter manually → Look up**"
  becomes "Select **Continue to add booking → Look up**". Nothing in S1, S3, S4 or S5 uses Copy.
- `04-presenter-cheat-sheet.md`: in "Split billing", delete the "**Copy booking** starts a new
  Booking…" line (the "Add another procedure" line above it stays the talking point); under
  "Anaesthetist Mobile", "Add, copy or missing Booking" becomes "Add a missing Booking". Add one line
  under the anaesthetist features: "Photo of the booking card: Future Work (Demo actions, badged)".
- `02-workflows-and-handoffs.md`: the readiness line (~101) drops "photo/" ("Manual phone booking,
  mobile and web manual Booking creation, …"); the "**Photo:**" fallback (~126) becomes "Photo of the
  booking card: Future Work (US-02.4.4); a badged Future-scope demo on the mobile List"; delete the
  "**Copy booking** is different…" bullet under "Multiple Procedures" (~265-266); the readiness table
  row (~467) becomes "Mobile/web manual Booking creation".
- `01-personas-and-responsibilities.md`: item 9 becomes "Create a missing Booking manually"; item 10
  becomes "Record an additional procedure inside a Booking with **Add another procedure**, which
  charges time units only"; the web line (~103) "Create or copy a Booking" becomes "Create a Booking".
  The RFP section list keeps "`Card Copy`" (it names the RFP's sections), with "(retired)" after it.
- `master-demo-guide.html`: the same passages: the intake paragraph (~693, "photo extraction"), S2
  Beat 2's click list (~876), the split-billing card (~1044, the Copy sentence), and the persona,
  workflow and cheat-sheet sections that mirror the edits above.
- `DemoControlPanel.tsx`: check the `SCENARIOS` text (S2 especially) for "Enter manually", Copy or
  photo wording and patch it to match.
- `requirements-board/capture/ATLAS.md`: see Catalogue screenshots.

Not a milestone phase: no full consistency read is required.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 15b` first.

**Covered items.** None: `recipe-status.mjs 15b` prints "no stories covered", because the phase covers
one reverse-check finding (RV-25) and only removes Retired and Future surfaces. Every recipe it touches
is a recipe it breaks:

**Recipes this phase breaks.**

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md) Add a Booking manually | captured · add-card[choose,manual] on web and mobile (`/…/lists/L-34821-2026-07-21-PM`); `choose` captions "Add a Booking, enter manually or from a photo" | captured. Keep the shot name `add-card`; drop the `choose` state (the fork is gone); the `manual` state clicks "Add a booking" only (no "Enter manually"), highlight the sheet or dialog as now, caption "Add a Booking: enter the patient and operation" |
| [US-02.4.2](../../../../requirements-board/requirements/stories/US-02.4.2.md) Photo capture of the physical card (Retired) | captured · photo-capture[scan,prefilled], clicks "Photo of paper list" | absent, no shots, `absentReason` "Retired: photo capture is US-02.4.4 (Future Work); the Add a booking choice was removed in Phase 15b" |
| [US-02.4.3](../../../../requirements-board/requirements/stories/US-02.4.3.md) Copy a Booking (Retired) | captured · copy-card[button,copied] on web (`BK0006`) and mobile (`BK0009`) | absent, no shots, `absentReason` "Retired: removed in Phase 15b" |
| [US-02.4.4](../../../../requirements-board/requirements/stories/US-02.4.4.md) Add a Booking from a photo of the booking card (Future Work) | none (its `images` hand-link four files under `assets/US-02.4.2/`) | create, absent, no shots, `absentReason` "Future: photo capture is Future Work; Phase 15b took it out of the Add a booking sheet and keeps it only as a badged Future-scope demo action on the mobile List" (under the fallback: "…and removed the simulation") |
| [US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md) Add additional Procedures | partial · add-procedure[before,copy,added] on web, [before,added] on mobile | partial, same `absentReason`. Drop the web `copy` state (it highlights "Copy booking"); `before` and `added` stay |
| [US-11.1.3](../../../../requirements-board/requirements/stories/US-11.1.3.md) | captured · dedupe-nhi[lookup,linked] on web and mobile, each clicks "Enter manually" | captured; remove the "Enter manually" click and its wait from every state |
| [US-14.4.1](../../../../requirements-board/requirements/stories/US-14.4.1.md) | partial · nhi-lookup on web and mobile, clicks "Enter manually" | partial, same reason; remove the "Enter manually" click and its wait |

Keep every other shot `name`. Run `node scripts/capture.ts --dry` to find any recipe this list misses
(any step that clicks "Enter manually", "Photo of paper list" or "Copy booking").

**The US-02.4.4 image links.** US-02.4.4's `images` point at `assets/US-02.4.2/*-photo-capture-*.png`,
files the runner generated for US-02.4.2. Once US-02.4.2 is absent, the full capture prunes them and
`npm run check` reports four missing image files on US-02.4.4. Empty US-02.4.4's `images` list in the
same step (the `images` field only, the runner's field; never its text or status), so `npm run
verify:board` is green, and record it in PROGRESS.

**ATLAS.md.** Overlays that need clicks: "Add booking" now opens the manual form directly (drop "The
sheet offers 'Enter manually' and 'Photo of paper list'"), and delete the "Copy booking" bullet; add
the Future-scope photo entry under the mobile List's demo actions (default only). Seed data: delete "A
Copy reads 'Copy of another Booking'" from the Booking source paragraph. The "photo capture on the
phone" example in the rules (~157) can stay as an example of a one-platform story.

## Adversarial review (after build)

After the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm
run shots` are green, and before writing the PROGRESS entry, run the standard adversarial
review-and-fix pass (PROGRESS convention 18): independent Opus review subagents for **quality**,
**bugs/correctness** and **plan adherence**. This session verifies every finding against the catalogue
and the code, fixes the confirmed ones (with a test where a bug had none), re-greens and records the
pass. Do not re-raise anything settled in the Decisions log, except the Copy ruling this phase
supersedes.

**Steer this phase's reviewers at:**
- **Completeness:** no Copy residue anywhere (store, types, audit labels, field labels, format labels,
  seed audit, props, routes, comments, tests, specs, recipes, ATLAS, README, guide); the inventory grep
  is clean.
- **Nothing else moved:** `addProcedure`, the post-op addendum, attachments, the warnings panel, the
  prepayment row and its `data-shot="booking-prepayment"` hook, and every billing figure are unchanged;
  the Booking detail's action stack still lays out cleanly on mobile, web and Admin with Copy gone.
- **The sheet:** opens on the manual form in every caller (mobile, web, phone advice), resets each
  time it opens, keeps the S2 lookup prefill, and has no dead back control; the source stamped is
  `admin` or `anaesthetistAdHoc` only.
- **The Future-scope demo:** the request store is UI-only (no domain state, not persisted), the entry
  shows only on the mobile List route in the bar and the PWA sheet with its badge, disables on a
  non-DRAFT List, and a second request re-opens the sheet; `pwaPurity.test.ts` holds. Under the
  fallback, no orphan import or sample remains, and the paper-card assets the attach sheet uses stay.
- **Persistence:** `PERSIST_VERSION` bumped with its comment; the seed test proves no seeded Booking or
  audit row carries a removed field or value; `BOOKING_SOURCE_LABELS` type-checks against the narrowed
  union.
- **Tooling:** the broken recipes re-pointed, the two Retired recipes and the new Future one absent
  with reasons, US-02.4.4's dangling image links gone, no failed recipe, `npm run verify:board` green.
- **Copy rules:** no en or em dashes in any changed string; no "copy" or "photo" source wording in app
  copy; teal-only actions.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the Add a booking sheet opening straight on the manual form (Mobile and Web, Dr
  Souter's Tue 21 PM List, "Add a booking"; Admin, Book (phone advice)); the photo flow kept as a
  Future-scope demo (or removed, if the fallback ran), with the question "keep the Future-scope photo
  demo or delete it?"; the domain-model "Booking > Sources" bullet still naming copy and photo (a
  catalogue fix for the requirements owner); US-02.4.4's emptied image list.
- **Status.** A catch-up status row for Phase 15b, DONE at the end.
- **Phase entry:** the drift-check result against `3d3a18c` and 15a's state; the inventory grep before
  and after with any accepted leftover; which way work item 7 went; the `PERSIST_VERSION` bump; the
  checklist item by item with evidence; Vitest and Playwright counts before and after; the review
  pass.
- **Decisions log:**
  - Supersede **2026-10-02 "Copy is a skeleton-only new Booking"** (Phase 15): Copy a Booking is
    removed (US-02.4.3 Retired 2026-10-02, "to be removed from the prototype"; Greg: redundant, a
    workaround for not being able to add a procedure to a Booking). **Add another procedure** is the
    only way to add a Procedure for the same patient. The two July rulings that entry already
    superseded (2026-07-22 Third external plan review #2, the `copyCard` part of 2026-07-23 Phase 03
    store additions) stay superseded.
  - Amend Phase 15's **`Booking.source`** entry: the live values are `hospitalDownload`, `surgeonPdf`,
    `admin` and `anaesthetistAdHoc`; `'copy'` and `'anaesthetistPhoto'` are removed (DM-39), and the
    Future-scope photo demo stamps `anaesthetistAdHoc`.
  - **Photo capture is Future Work** (US-02.4.4, RV-25): out of the Add a booking sheet, which opens
    straight on the manual form; `PhotoCaptureFlow` kept only behind the badged "Photo capture
    (Future scope)" demo action on the mobile List (or deleted). Amends the photo half of 2026-07-23
    "Phase 03 store additions" (`createCard` as "the ad-hoc/manual AND photo path").
- **Catalogue screenshots:** the recipes changed (US-02.4.1, US-03.2.3, US-11.1.3, US-14.4.1), the
  absent ones (US-02.4.2, US-02.4.3, new US-02.4.4), US-02.4.4's images, and the `REPORT.md` counts
  before and after (captured, partial, absent, failed).
- **Handoff notes:** Phase 33 re-points the HL7/FHIR `hospitalDownload` stamp (the source union now
  has four values); Phase 34 can reuse this phase's Future-scope request pattern if it wants a
  badged entry point for surgeon PDF ingest; Phase 44's sweep checks no Copy or photo wording crept
  back into the rewritten S1 to S5.
