# Requirements update: a Lists section in the Admin app, 2026-11-27

## Inputs

- [Notes 2026-11-27 · Donald lists section](../notes/2026-11-27-donald-lists-section.md) (AR-74):
  Donald's typed decisions in the session, after the exploration page
  `docs/explorations/lists-ideas.html` (shape A chosen, Claude's defaults accepted, the badge toggle
  added).

## Questions answered

None.

## Items changed, added, retired or moved

| Item | Title | What changed | Sources |
| --- | --- | --- | --- |
| [US-13.1.3](../stories/US-13.1.3.md) | The Lists section | **New.** One nav entry with four routed tabs (Draft Lists, Conflicts, Contracts to set, To authorise), each with its own table, filters and one-line sub; tab counts count what needs doing, hidden at zero; the nav badge counts a List once (what it counts: OQ-151); a List's review page sits under To authorise; old addresses keep working. Verify (3). | #1 #6 #8; Notes 2026-11-26 · Donald contracts to set #7; Notes 2026-11-26 · Donald finances section #3 |
| [US-07.2.4](../stories/US-07.2.4.md) | Lists waiting to be authorised | **New.** The To authorise tab: submitted Lists oldest submitted first, search, date filter, Needs a look (review flags, changed since submitted, Needs a price); each row opens the review page, which goes back to the tab; the only place a List is authorised. Verify (3). | #2; Notes 2026-11-26 · Donald finances section #3 |
| [FT-13.1](../stories/FT-13.1.md) | Schedule dashboard | Theme also covers the Lists section. Agreed (4) to Verify (3). | #1 |
| [US-13.3.1](../stories/US-13.3.1.md) | Billing status of each List and Booking | "Lists awaiting approval" rows open the To authorise tab; criterion renamed to match. | #2 |
| [US-13.3.3](../stories/US-13.3.3.md) | The Finances section | Lists are authorised on To authorise; the Payments tab also holds procedure events awaiting approval beside those waiting for the run (new criterion); the counting rule is shared with the Lists section. | #2 #3 #6 |
| [US-03.7.2](../stories/US-03.7.2.md) | Bill an event | The events' review step happens on Finances › Payments (new criterion). | #3 |
| [US-07.3.1](../stories/US-07.3.1.md) | Authorise the List | Authorised on its review page, opened from To authorise, and nowhere else. Agreed (4) to Verify (3). | Notes 2026-11-26 · Donald finances section #3; #2 |
| [US-07.2.2](../stories/US-07.2.2.md) | Office review of Contracts and references | The review happens on the review page opened from To authorise. | #2 |
| [US-04.3.12](../stories/US-04.3.12.md) | Lists waiting for Contracts | A Contracts to set tab in the Lists section covers every date (past first, then soonest); the Day rail's tab shows the day in view; new criterion "Every date". | Notes 2026-11-26 · Donald contracts to set #7; #4 |
| [US-01.6.2](../stories/US-01.6.2.md) | See Draft Lists flagged in the Admin App | The Draft Lists tab covers all dates with day group rows, search, filters (date, hospital, why no anaesthetist), paging and time waited; the day view band shows the day's own; new criterion "Filtered". Agreed (4) to Verify (3). | #5 |
| [US-01.5.4](../stories/US-01.5.4.md) | Lists at closed hospitals | Retitled and rewritten as the Conflicts tab across every date; a conflict is a hospital closure only; resolved from the row by reassigning or clearing. Two new criteria. Proposed (1) to Verify (3). | #1 #7 |
| [US-01.5.2](../stories/US-01.5.2.md) | Conflict flagging | A flagged List shows on the Conflicts tab; a conflict is always a hospital closure, a not-preferred pairing never is. Agreed (4) to Verify (3). | #7 |
| [US-01.3.5](../stories/US-01.3.5.md) | Not-preferred pairing warning when assigning or moving a List | The picker's group is "Not preferred", never called a conflict. Agreed (4) to Verify (3). | #7 |
| [domain-model.md](../domain-model.md) | Preferences | Not-preferred pairings are grouped apart and never called a conflict. | #7 |

## New questions

- [OQ-151](../questions/OQ-151.md) What the Lists badge counts: every List that needs something, or the
  next 7 days plus anything overdue (Donald leans to everything; the prototype shows both with a
  demo toggle in its harness bar). Affects US-13.1.3.

## Points with no requirement change

- #8, the toggle itself: a prototype control for showing AA both counts, not a requirement; the
  question is OQ-151.
- #9 (built without a phased plan): how and when the work is built.
