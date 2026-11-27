# Requirements update: the priority tiers become an offer order, 2026-11-27

## Inputs

- [Notes 2026-11-27 · Donald offer order](../notes/2026-11-27-donald-offer-order.md) (AR-75): Donald's
  typed decision in the session. Not yet seen by AA or Greg.

## Questions answered

- **OQ-102** (already Answered): an "Update 2026-11-27" line records that the tiers are now the offer
  order (Offer first, Offer second, Offer third, Standard); the pairing names are unchanged. Source
  added: Notes 2026-11-27 · Donald offer order #1 #2 #3.

## Items changed

- [US-01.3.6](../stories/US-01.3.6.md) Anaesthetist offer order for assignment (was "Anaesthetist
  priority tiers for assignment"): rewritten around the offer order; the four values, the short form
  beside an "Offer order" heading and the full form where a value stands alone; new criterion "Short
  and full names"; the default is Standard. Earlier in the session (same change, Notes 2026-10-19 ·
  AA meeting with Greg #16): the description now states preferred pairing orders anaesthetists within
  the same level, before the shuffle, with a criterion for it. Status stays Verify. Sources: #1 #2 #3.
- [US-12.1.4](../stories/US-12.1.4.md) Anaesthetist identity, contact and bank details: the card is
  the rate and offer order card; the list filters by offer order; criterion reworded ("Rate and offer
  order together"). Status stays Verify. Sources: #2 #3.
- [US-01.3.5](../stories/US-01.3.5.md) Not-preferred pairing warning: "priority tier" becomes "offer
  order" in the description and Notes. Status stays Verify. Source: #2.
- [US-13.6.4](../stories/US-13.6.4.md) Preferred pairings: ordered by offer order and, within it,
  preferred pairing. Status stays Verify. Source: #2.
- [US-01.4.2](../stories/US-01.4.2.md), [US-01.4.5](../stories/US-01.4.5.md),
  [US-01.4.7](../stories/US-01.4.7.md): the word "tier" becomes "offer order" in their links and
  criteria. The requirement itself is unchanged (anaesthetists still see availability alone), so
  their statuses stay as they were and no source is added.
- `domain-model.md`: the ERD's PRIORITY_TIER becomes OFFER_ORDER (Standard default); the "Priority
  tier" entry and glossary row become "Offer order"; the summary table row reworded.

Screenshot captions that still say "tier" (US-01.3.6, US-01.4.2, US-13.6.4) are left for the next
sweep, which retakes the screenshots.

On review, US-01.3.6's and US-13.6.4's Notes now mark as our reading (the prototype shown to Greg on
19 October) that preferred pairing orders anaesthetists within the same offer order. OQ-102's title
is now "Names for preference lists and the offer order".

## New questions

None.

## Points with no requirement change

None: #1 is the reason, recorded in US-01.3.6's Notes; #2 and #3 change the items above.
