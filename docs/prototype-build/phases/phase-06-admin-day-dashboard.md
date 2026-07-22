# Phase 06 — Admin app: day dashboard, changes & reassignment

**Requirements covered:** A1–A3, D7 office-side
**Depends on:** Phase 05 (shared components).
**Estimated:** 1 session.

## Goal

The office's operational cockpit: the one-day schedule dashboard (Appendix 4, modernised), manual
change handling, and short-notice List reassignment. After this phase the office can *run the day*;
authorisation and master data follow in Phase 07.

## Reference

**Authoritative visuals (convention 17):** `Design/Admin Day.dc.html`. Match its anatomy: the dark
ink side nav (crimson active marker, Review-queue count badge, office persona footer); header with
the date title + summary line ("14 anaesthetists · 22 sessions · 5 free · 2 lists submitted") and
‹ Today › controls; the day grid — 148px surname column, hour ruler 07:00–17:00+ with faint
gridlines, 44px rows, proportional time blocks (status-tint fill, 3px inset status bar, two text
lines, dashed Free blocks, hatched Unavailable, full-width holiday blocks); block adornments: the
amber **"!" needs-attention badge** (amber border on the block) and the small dark **has-note
dot**, both in the legend; the footer legend strip; and the right rail — mini month calendar
(crimson today), **Internal notes** panel (timestamped `HH:MM · initials` entries, amber left-bar
for flagged ones, "+ Add note"), and the **Awaiting review** panel (list rows with "Review →"
linking into Phase 07's queue).

RFP page 45 (Appendix 4) remains the functional reference. The design shows a subset of nav items —
extend the same pattern with Billing monitor, Master data and Audit (convention/Decisions log).
Keep the density and drill-down; improve legibility (convention 11).

## Work items

1. **One-day dashboard** (admin home):
   - Grid: one row per anaesthetist (surname-alphabetical), columns spanning 07:00–18:00+, each List rendered as a block across its time span, coloured by status, labelled (hospital/surgeon or annotation e.g. "covered by NW 26/5" — seed a few in Phase 02's data or add now via seed tweak), on-leave rows visually distinct.
   - Legend (shared component), mini month calendar, day navigation (◀ Today ▶, ±1 week, ±4 weeks), date picker, internal-notes panel (persisted per day in the store).
   - Click a block → **List drawer/panel**: state, cards summary, actions (open detail, reassign; "review for authorisation" appears in Phase 07).
   - **Conflict flags**: a List scheduled on a hospital holiday, or where the anaesthetist's availability says unavailable → warning icon + tooltip. Reconciliation is surfaced as *advisory* (the RFP leaves hard-vs-soft open — note the reading in UI copy and the Decisions log).
2. **Manual change handling**: office persona edits DRAFT and SUBMITTED Lists/Cards through the
   shared detail components (store guards already permit office edits of SUBMITTED); assign or
   override a List's surgeon and hospital; create a booking on a free List ("phone call from
   surgeon's rooms" path). Every change audited with source=office.
2a. **Card reassignment** (distinct from List reassignment, item 3 — the RFP's routine case: a
   hospital/surgeon moves one patient's booking): a "Move to another list" action on a Card opens
   a target picker (same anaesthetist's other session, another anaesthetist, or another day) and
   calls the store's `reassignCard` — the Card moves alone, both Lists' other Cards and status are
   untouched, the move shows in the Card's own audit trail (viewable via its History affordance).
   Blocked against an AUTHORISED source or target.
3. **List reassignment** (illness cover), using the store's slot mechanics (Phase 02 — the fixed
   canvas must survive): from the List panel → "Reassign" → pick-target flow surfacing the
   availability grid **filtered to anaesthetists whose session is Free** (the guard rejects
   non-free targets) → confirm dialog states the mechanics ("Dr B's free PM becomes this list;
   Dr A's PM becomes Unavailable") with the vacated-slot status pickable (default Unavailable) →
   the incoming List takes the target slot with Cards/status/audit intact, the vacated slot
   regenerates as a fresh List. Before/after visible on the day grid — both rows still show
   exactly two sessions; the audit records from→to.
4. **Admin nav truthfulness**: Authorisation, Master Data, Audit and Billing Monitor nav items
   exist as honest placeholders naming their phases (07, 07, 07, 09).

## Out of scope

Authorisation queue, master data screens, audit viewer (Phase 07). Billing monitor (Phase 09).

## Manual test checklist

- [ ] Day dashboard for `DEMO_TODAY` reproduces the mockup's day (Souter's two private lists, Beaumont/Ngatai holiday rows, Delaney unavailable, Hughes free, Fitzgerald's flagged "surgeon TBC" block with the amber "!" badge, note dots) with legend and working day navigation; internal notes persist per day.
- [ ] A hospital-holiday conflict and an availability conflict each show the advisory flag with a tooltip.
- [ ] The seeded all-day booking (Rutherford/Forte Health) renders as two adjacent same-context blocks spanning the full day — no special "all-day" entity, just both Lists sharing hospital/surgeon per the RFP.
- [ ] Drill into a List → edit a Card as office on a SUBMITTED list (allowed) — then switch persona to anaesthetist and confirm the same edit is blocked.
- [ ] Book a card onto a free List via the phone-advice path; it appears on the grid and in the anaesthetist's mobile view.
- [ ] Move a single Card to a different List (different session or anaesthetist): it appears in the new List, the old List's other Cards are untouched, and the move is visible in the Card's own audit trail.
- [ ] Reassign today's List to a free anaesthetist: cards and audit history intact, grid updates, audit records the move — and the canvas invariant visibly holds (both rows still have two sessions: the target's Free slot absorbed, the vacated slot regenerated with the chosen status). A non-free target is not offered/rejected.
- [ ] `npm run build` + `npx vitest run` green.

## PROGRESS.md updates

Status row + entry; log the advisory-conflict reading and any day-grid rendering decisions.
