# Requirements update, 2026-10-07: List lifecycle states

What this update did to the catalogue. A List's lifecycle gains a state: DRAFT → ACTIVE → SUBMITTED →
AUTHORISED. DRAFT now means a Draft List (no anaesthetist); ACTIVE is a List with all five of its
pairing, and takes over everything the catalogue used to call DRAFT. This run's lines are the ones
that cite `Notes 2026-10-07 · List lifecycle states`; `#n` below means a point of that note. Other
uncommitted changes in the same files (the 2026-10-06 directors meeting run) are not part of it.

**Counts.** 0 questions answered · 9 items changed · 0 added · 0 retired · 0 moved · 0 new questions ·
domain-model.md changed · 2 artifacts touched (AR-22 redrawn, AR-23 registered).

## 1. Inputs

- Note: [notes/2026-10-07-list-lifecycle-states.md](../catalogue/notes/2026-10-07-list-lifecycle-states.md) (points #1 to #4), registered as artifact AR-23.
- Donald's typed decision of 2026-10-07, made while redrawing the early-project lifecycle flowchart
  as [AR-22](../catalogue/artifacts/AR-22.md) (Booking & List Lifecycle / Status), read against the
  List pairing on [AR-17](../catalogue/artifacts/AR-17.md).

## 2. Questions answered

None.

## 3. Items changed

| Item | Title | What changed | Sources |
| --- | --- | --- | --- |
| [EP-07](../catalogue/requirements/EP-07.md) | List approval workflow | Four states, not three; DRAFT described as a Draft List and ACTIVE as a List with all five of its pairing; the anaesthetist edits Bookings while ACTIVE; a List that goes back to the office becomes DRAFT again. | #1 #2 #3 |
| [FT-07.1](../catalogue/requirements/FT-07.1.md) | ACTIVE (was DRAFT) | Renamed; describes how a List becomes ACTIVE (assigned from a Draft List, or set up assigned); note that the state was called DRAFT until 7 October; components add Admin App and Scheduling Engine; links AR-22#active and #active-list. | #2 #3 |
| [FT-01.6](../catalogue/requirements/FT-01.6.md) | Draft Lists | A Draft List is the DRAFT state; assigning an anaesthetist makes it an active List; a List going back to the office becomes DRAFT again; "different from an active List". | #1 #3 |
| [US-01.6.3](../catalogue/requirements/US-01.6.3.md) | Assign a Draft List to an anaesthetist | The Draft List becomes an active List; criterion "Becomes a List" now "Becomes active". | #2 |
| [US-01.6.2](../catalogue/requirements/US-01.6.2.md) | See Draft Lists flagged in the Admin App | "a real one" and "an assigned List" now "an active List". | #1 #2 |
| [US-01.2.2](../catalogue/requirements/US-01.2.2.md) | Slot status master data | The availability status is distinguished from the DRAFT, ACTIVE, SUBMITTED and AUTHORISED List state. | #3 |
| [EP-01](../catalogue/requirements/EP-01.md) | Schedule canvas, Slots and Lists | "An active List is assigned to an anaesthetist"; a Draft List is in the DRAFT state until assigned. | #1 #2 |
| [FT-01.3](../catalogue/requirements/FT-01.3.md) | List assignment | With all five of its pairing a List is an active List. | #2 |
| domain-model.md | | List state bullet (four states, how a List moves between DRAFT and ACTIVE); a "What changed since the RFP" row; glossary rows List, Active List (new) and Draft List; "becomes an active List in a Slot". | #1 #2 #3 |

Artifacts: AR-22 redrawn with a DRAFT panel before ACTIVE (was DRAFT), its "amended or moved" step
turned into a bracketed note, and the note added to its sources (#4). FT-01.6, US-01.6.1 to
US-01.6.4 and US-01.4.3 link to its DRAFT regions.

## 4. New questions

None.

## 5. Points with no requirement change

- #4 (the diagram): reflected in AR-22 and the artifact links, not in any item's text.

## 6. Left as they are

- The ER diagram in domain-model.md still draws DRAFT_LIST as its own entity beside LIST. It is the
  logical model of what is stored, which is for the developers; redraw it if DRAFT should read as a
  state of one List entity.
- EP-07's title "List approval workflow" is kept; "List lifecycle" would fit the four states better.
- OQ-44's answer still says "turn it into a List": a historical answer, not edited.
- The link-requirements workflow was not run: the new text links (active List → FT-07.1, lifecycle →
  EP-07) were added by hand.
