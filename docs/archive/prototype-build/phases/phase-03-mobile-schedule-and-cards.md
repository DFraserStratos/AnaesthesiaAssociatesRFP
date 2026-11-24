# Phase 03 — Mobile app: schedule, cards & availability

**Requirements covered:** M1–M3, M6–M9
**Depends on:** Phases 00–02.
**Estimated:** 1 session.

## Goal

The anaesthetist's mobile world — everything except the BTM/billing capture (Phase 04): Forward
Lists → Cards → Card navigation in the phone frame, card creation flows (copy, ad-hoc, photo-OCR
mock), and both availability screens. Modelled on RFP Appendix 3's navigation, modernised
(convention 11).

## Reference

**Authoritative visuals (convention 17):** `docs/design/Mobile App.dc.html` screens 1–2 (Forward Lists
home; List detail card stack) and `docs/design/Mobile Availability.dc.html`. Open them in a browser and
tap through — the transitions are the spec: card-advance slide-in with −24% parallax + 8% dim on
the view behind, sheet-in bottom sheets with scrim, tick-pop completion states. Match their layout
anatomy: list rows (status rail · AM/PM+time column · hospital/surgeon line · right-side state),
day-grouped sections with micro-caps headers, filter chips (Week/Month/To-Do/Done), the dashed
green Free row with its "Offer cover" pill, the holiday row, the "Done · unbilled" state, the
list-detail progress bar ("N of M complete") and the sticky footer bar.

RFP page 44 (Appendix 3) remains the functional reference for navigation depth and card content.

**Interaction grammar is binding convention 16:** bottom sheets and slide-in cards (never centred
desktop modals), bottom tab bar, thumb-reachable actions, steppers/chips/segmented controls over
dropdowns.

## Work items

1. **Forward Lists screen** (mobile home): chronological sections per day; each List row shows
   session times, surgeon/hospital, status chip, card count, and lifecycle badge (draft /
   completed-unbilled). Filters: Week / Month / To-Do (lists with incomplete cards) / Done. Days
   with no bookings collapse. Data respects the demo clock.
2. **Cards screen** (one List): header (date, session, surgeon @ hospital, list state),
   time-ordered cards with operation summary + completion tick, **＋ Add** entry point. Reserve the
   footer slot for Phase 04's "Completed" submit button (render a disabled placeholder stating it
   arrives with BTM capture).
3. **Card screen** (single scroll, per Appendix 3): patient block (name, NHI — both formats render
   with a format badge; the seeded provisional no-NHI patient shows an "NHI pending" badge instead,
   DOB, contact, operation, internal comment, contract/insurance note),
   attachments row (add photo/file — stored as data URLs), editable via the store's audited
   mutations; a **"Cancel card" action** (the legacy screen's "Delete Card", modernised) calls the
   store's audited `cancelCard` with a reason sheet — the card stays visible with a cancelled
   state, drops out of validation/submission, and the action is absent on SUBMITTED lists for the
   anaesthetist persona. The Outcome/BTM section renders as a clearly-labelled Phase 04 placeholder.
4. **Card copy**: action on a card → new card in the same list with skeleton info (patient/context),
   procedure-specific details cleared (per RFP "Card Copy"). Per the RFP, copy exists "as a way of
   adding an additional procedure": the new card records `copiedFromCardId` (same episode) and any
   procedure created on it is flagged `isAdditional` from the first — Phase 04 renders those with
   base/modifier capture structurally disabled (time units only), so copy can't double-charge base
   units the original card already claimed.
5. **Ad-hoc card + photo capture mock**: the ＋ Add flow offers *Enter manually* / *Photo of paper
   list*. Manual path: the form includes an explicit **billing-route selection** (Hospital /
   Billable Party / Insurer — the RFP: the route "is set explicitly… rather than derived"; on this
   path the anaesthetist records the hospital's/surgeon's advice, and the office can correct it in
   the admin app, Phase 06); typing an NHI offers a **"Look up NHI"** button — calls Phase 01's
   simulated `lookupNhi` (demo-badged: "simulating the NHI FHIR API via the Digital Services Hub")
   and, on a hit, pre-fills name/DOB/ethnicity for review (not silently accepted — still editable);
   on a miss, an honest "not found in this demo's records — enter manually" state. Saving goes
   through the store's shared **`upsertPatient`** (Phase 02): an NHI matching an existing seeded
   patient reuses that Patient record (visible: the new Card links to the same patient, prior
   episodes intact) rather than creating a duplicate — the RFP's intake-dedupe rule on this path. Photo path: pick
   an image (ship 2 bundled sample "paper card" photos) → brief simulated processing state →
   pre-filled draft card (canned extraction keyed to the sample, also running the NHI lookup if a
   valid NHI was extracted) for review/correct/save. Badge both simulated steps "demo simulation".
6. **Availability screens** (per `Mobile Availability.dc.html`): other-anaesthetists day view —
   date-picker strip (green dot = has free sessions), Everyone/Free-only segmented control, free-
   session count line, per-person cards with AM/PM cells in status colours; **request-cover flow**:
   tapping a free session slides up the request sheet (person, slot, optional message) → "Send
   cover request" → tick confirmation; simulated — records a pending cover request on the List +
   an audit entry, no real notification. **My availability**: half-day granularity, but writes go
   to the **AnaesthetistAvailability master via the store's `setAvailability`** — never directly to
   a List. The reconciliation pass reflects it instantly: only truly **Free** sessions restatus on
   the canvas; a session carrying any booking context — a non-Free status, an assigned
   hospital/surgeon, or Cards — is flagged as a conflict for the office instead of being silently
   changed (an empty-but-reserved List is *not* free: the RFP says a List's status "is meaningful
   on its own... even with no Cards attached"; availability is an independent master calendar
   *reconciled against* the canvas, not merged into List records).
7. **Lifecycle display rules** (read side only this phase): SUBMITTED lists render read-only with
   the "completed, unbilled" badge; edit affordances hidden/disabled per the store guards; the
   Balances tab remains an honest stub ("arrives with billing, Phase 10").

## Out of scope

BTM capture, validation, list submission (Phase 04). Web app reuse (Phase 05 extracts shared
pieces — don't pre-abstract).

## Manual test checklist

- [ ] Phone-frame flow matches Appendix 3's depth: Lists → Cards → Card, with back navigation; the 2-lists-per-day rhythm is visible on the home screen.
- [ ] Filters work: To-Do shows only lists with incomplete cards; Done shows submitted ones.
- [ ] Editing patient/context fields on a DRAFT card persists and writes an audit entry (verify in the data inspector).
- [ ] A SUBMITTED list is read-only for the anaesthetist persona (no edit affordances; guard message if forced).
- [ ] Card copy produces a skeleton card linked to its source (`copiedFromCardId`), flagged so its procedures will be additional-only (Phase 04 enforces the capture side); ad-hoc manual entry works, including the billing-route selection; the photo path produces a reviewable pre-filled card with the demo badge.
- [ ] "Look up NHI" on a seeded NHI pre-fills name/DOB/ethnicity (still editable, demo-badged); an unseeded NHI gives the honest not-found state; saving an ad-hoc card for an existing patient's NHI links to that same Patient record (no duplicate row — check the inspector).
- [ ] Cancelling a card (with reason) leaves it visible in a cancelled state, writes an audit entry, and the list's completion count ignores it; the action is unavailable on a SUBMITTED list.
- [ ] Setting own availability on a free session recolours the canvas (via the other-anaesthetists view or inspector); setting it on a session with booking context — Cards, **or** an empty-but-reserved List (non-Free status / assigned surgeon) — raises a conflict flag and leaves the List untouched.
- [ ] Request-cover: Free-only filter works; tapping a free session opens the sheet (320ms slide, scrim); sending shows the tick state and writes the pending request + audit entry.
- [ ] Side-by-side eyeball against the two mockup pages on DEMO_TODAY: same day structure, same states, transitions feel like the mockups' choreography.
- [ ] `npm run build` + `npx vitest run` green.

## PROGRESS.md updates

Status row + entry; log the UI patterns (list rows, card layout, sheet/dialog conventions) that Phases 04–07 must copy.
