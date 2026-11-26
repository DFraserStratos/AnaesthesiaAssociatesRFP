# Requirements update, 2026-11-26: Intake as the front door

Donald decided how incoming Lists and changes reach the schedule. The matching screen (the Admin app's
Intake) becomes the front door for everything the surgeons' rooms and the hospitals send: one feed of
arrivals grouped by List, each placed as a new List or merged into a List AA holds, with a second view
of each source's state. Feeds and the rooms' mailbox arrive on their own, with no import button; the
office still decides every arrival. The decisions are Donald's, for the build, and not yet seen by AA
or Greg, so every story whose requirements changed is at Verify; Proposed items stay Proposed, and
wording-only edits keep their status.

The main changes:

- **One feed, a List at a time** ([FT-02.1](../stories/FT-02.1.md), [US-02.1.2](../stories/US-02.1.2.md),
  [US-02.1.4](../stories/US-02.1.4.md)). Rows are grouped by the List they belong to; the office applies
  a whole List's changes at once and can leave out any one Booking's change. Filters by source, Needs
  NHI and Decided.
- **Why it matched** ([US-02.1.3](../stories/US-02.1.3.md)). Match keys, the List's earlier versions and
  its Slot shown before applying; the hospital's List is proposed as an update to the List the rooms
  sent. No confidence score.
- **No import button** ([US-02.1.1](../stories/US-02.1.1.md), [US-02.1.5](../stories/US-02.1.5.md)).
  Hospital rows arrive on their own; US-02.1.5 moves from FT-14.6 to FT-02.1 and out of Future Work.
- **PDFs from the mailbox** ([US-02.2.1](../stories/US-02.2.1.md), [US-02.2.4](../stories/US-02.2.4.md),
  [US-02.2.3](../stories/US-02.2.3.md)). Read as they arrive, added by hand as a fallback, shown beside
  the values read with unsure values marked; a re-sent List merged as the next version, with its missing
  Bookings offered as removals (US-02.2.3 out of Future Work).
- **Placing a new List** ([US-02.1.2](../stories/US-02.1.2.md), [US-01.6.1](../stories/US-01.6.1.md),
  [US-01.3.3](../stories/US-01.3.3.md)). The named anaesthetist's Slot suggested; a Draft List can be
  made from intake.
- **Waiting for an NHI** ([US-11.1.5](../stories/US-11.1.5.md), [US-11.1.4](../stories/US-11.1.4.md),
  [US-02.6.3](../stories/US-02.6.3.md)). A filter on the feed, not a tab; an NHI on a later arrival
  resolves the stub when the office applies it.
- **New stories:** [US-02.1.6](../stories/US-02.1.6.md) Confirm unchanged Lists together,
  [US-02.1.7](../stories/US-02.1.7.md) See each source's state (inbound only),
  [US-02.6.4](../stories/US-02.6.4.md) A List holding only a stub cannot be submitted or authorised.

## 1. Inputs

- Note: [2026-11-26-donald-intake-front-door.md](../notes/2026-11-26-donald-intake-front-door.md)
  (AR-72), 17 points.
- Typed decisions from Donald in the session, quoted in the note; the exploration
  `docs/explorations/intake-ideas.html` (commits b4fca40e, 86ee39c6, 27e25401), Idea 1 and its
  recommendation.

## 2. Questions answered

- [OQ-109](../questions/OQ-109.md): update line. Part 2 (sync in the first release) replaced: hospital
  rows arrive on their own, no import button, the office decides every row. Part 1 (which two hospitals
  are integrated today) still open. #5.
- [OQ-44](../questions/OQ-44.md): update line. A Draft List can be made on the matching screen. #10.
- [OQ-13](../questions/OQ-13.md) (open): its "what hangs on the answer" links reworded for rows that
  arrive on their own. #5.

## 3. Items changed or added

| Item | Title | What changed | Status | Points |
|---|---|---|---|---|
| [EP-02](../stories/EP-02.md) | Booking intake and change handling | Cut back to its broad theme: four sources, one matching screen as the front door; the rules it carried already live in stories | 3 | #1 #5 |
| [FT-02.1](../stories/FT-02.1.md) | Matching screen for incoming Lists (was Hospital booking download and matching screen) | Theme: the front door for every List and change, arrivals on their own, the office decides | 3 | #1 #5 #14 |
| [US-02.1.1](../stories/US-02.1.1.md) | Hospital bookings reach the matching screen (was Import hospital bookings) | Nobody imports a file; criterion "No import step" | 4 to 3 | #5 |
| [US-02.1.2](../stories/US-02.1.2.md) | Decide an arriving List (was Match rows to Lists and Bookings) | A whole List at a time with per-Booking leave-out; options incl. the named anaesthetist's Slot suggested and Draft List; any source | 4 to 3 | #2 #9 #10 #12 |
| [US-02.1.3](../stories/US-02.1.3.md) | Show why a List matched and what it changes (was Show differences on match) | Match keys, earlier versions, its Slot, no score; hospital's List updates the rooms' List | 4 to 3 | #3 #4 |
| [US-02.1.4](../stories/US-02.1.4.md) | One feed of everything waiting (was Unmatched queue) | One feed grouped by List, filters, unreadable PDFs land with a reason, Needs NHI in the feed | 3 | #1 #2 #6 #11 |
| [US-02.1.5](../stories/US-02.1.5.md) | Hospital rows arrive on their own (was Automatic sync from St George's and Southern Cross) | Moved from FT-14.6 to FT-02.1, out of Future Work; no import or sync button; inbound only | 1 to 3 | #5 #14 |
| [US-02.1.6](../stories/US-02.1.6.md) | Confirm unchanged Lists together | New | 3 | #12 |
| [US-02.1.7](../stories/US-02.1.7.md) | See each source's state | New; related to US-14.5.1 | 3 | #13 #14 |
| [US-02.2.1](../stories/US-02.2.1.md) | Read, correct and ingest a surgeon PDF list | Read from the mailbox, add by hand, PDF beside the values read with unsure values marked, re-sent List merged, unreadable PDF lands; reading method the development team's choice | 3 | #4 #6 #7 #8 |
| [US-02.2.3](../stories/US-02.2.3.md) | Detect Bookings removed from a re-sent List | Out of Future Work; removals offered for the office to confirm | 3 | #8 |
| [US-02.2.4](../stories/US-02.2.4.md) | A List keeps where it came from | Sender is the email's address, or the one typed for a PDF added by hand | 3 | #6 |
| [US-02.6.3](../stories/US-02.6.3.md) | Office resolves a stub from intake | An NHI on a later arrival turns the stub into the Booking when applied; one way to add an NHI by hand | 3 | #11 |
| [US-02.6.4](../stories/US-02.6.4.md) | A List holding only a stub cannot be submitted or authorised | New; links US-07.1.1 and US-07.3.1 | 3 | #15 |
| [US-01.6.1](../stories/US-01.6.1.md) | Create a Draft List | Also made on the matching screen from an arrival; criterion "From the matching screen" | 4 to 3 | #10 |
| [US-01.3.3](../stories/US-01.3.3.md) | Manual List assignment | Placing an arriving List in a free Slot is the same act | 4 to 3 | #9 |
| [US-11.1.5](../stories/US-11.1.5.md) | Intake rows waiting for an NHI | A Needs NHI filter on the feed, not a tab; NHI from a later arrival | 3 | #11 |
| [US-11.1.4](../stories/US-11.1.4.md) | Patient without NHI | Rows wait in the feed under Needs NHI | 3 | #11 |
| [EP-14](../stories/EP-14.md) | Health systems integration | Theme: two hospitals' rows reach the matching screen in the first release; never writes back | 1 | #5 #14 |
| [FT-14.6](../stories/FT-14.6.md) | Further hospital feeds and automatic matching | No longer "starts with an automatic sync" | 1 | #5 |
| [US-14.3.1](../stories/US-14.3.1.md) | Real-time processing | Technical discussion: the two hospitals arrive on their own in the first release | 1 | #5 |
| [FT-02.2](../stories/FT-02.2.md), [FT-02.3](../stories/FT-02.3.md), [US-02.5.4](../stories/US-02.5.4.md) | | Link text only ("hospital download", "automatic sync") | unchanged | #1 #5 |
| [domain-model.md](../domain-model.md) | | Hospital integrations row and intake paragraph (arrive on their own, mailbox, no import button, inbound only, re-sent List merged); Draft List from the matching screen; stub guard; Matching screen and Stub glossary | | #1 #5 #6 #8 #10 #11 #13 #14 #15 |

## 4. New questions

None. Still open and noted for later: what stays Future Work in [US-14.3.1](../stories/US-14.3.1.md)
(real-time processing) now that the two hospitals' rows arrive on their own, and how
[US-14.5.1](../stories/US-14.5.1.md) (failure alerts, retries) relates to the first-release sources view
([US-02.1.7](../stories/US-02.1.7.md)).

## 5. Points with no requirement change

- #16: the prototype's Data quality and Validators tabs leave Intake; no requirement names either.
- #17: AR-21 is out of date (rooms' PDFs marked future work, "until submitted"). Not redrawn in this run;
  a line is in `docs/BACKLOG.md`.
- Screenshot captions on US-02.1.1, US-02.1.4, US-02.2.1 and US-02.6.1 still show the old import and
  upload behaviour; they change at the owner's next screenshot sweep.

## 6. Links

The link run over EP-01, EP-02, EP-11 and EP-14 applied 11 links across 9 items (text links to
US-02.1.5, US-02.6.1, US-01.4.2 and US-02.3.3; related links among US-02.1.3, US-02.1.5, US-02.1.6,
US-02.1.7, US-02.6.3, US-01.4.5 and US-14.6.1).
