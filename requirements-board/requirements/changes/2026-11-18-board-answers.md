# Requirements update, 2026-11-18: board answers to thirteen questions

Donald answered thirteen questions on the Requirements Board on 17 and 18 November. These are his
decisions for the build, mostly not yet discussed with AA. A story whose meaning changed now sits
at Verify (3); stories already at Agreed or Confirmed whose meaning did not change keep their status.

The main changes:

- **Age modifier settled** ([US-03.3.8](../stories/US-03.3.8.md), [US-03.3.4](../stories/US-03.3.4.md)):
  the patient's age on the procedure date, inclusive lower bounds as the RVG prints them, no age
  modifier on base codes already split by age, and nothing pre-filled from the ASA grade or procedure
  defaults (OQ-95).
- **A credit note is always for the whole invoice** ([US-08.6.5](../stories/US-08.6.5.md),
  [US-06.4.1](../stories/US-06.4.1.md)): anything still owed is raised afresh on a new additional
  invoice (OQ-97).
- **Labels** "Not preferred" and "Preferred" for pairings, and Tier 1 to Tier 4 (Tier 4 the default)
  for priority tiers, until AA picks names (OQ-102).
- **No automatic hospital sync in the first release** (OQ-109): the matching screen imports St
  George's and Southern Cross files through an integration; the automatic sync,
  [US-02.1.5](../stories/US-02.1.5.md), moves under [FT-14.6](../stories/FT-14.6.md) as later work.
- **The surgeon master list is the address book** (OQ-126), people only, kept by AA's admin team; a
  surgeon can be held, and loaded at cutover, without an HPI CPN, which admin staff fill in (OQ-129).
- **Contract warnings and review flag** ([US-04.1.2](../stories/US-04.1.2.md),
  [US-04.2.15](../stories/US-04.2.15.md), [US-07.2.2](../stories/US-07.2.2.md)): a warning listing
  Procedures still on an old Contract after a dated change or when it is disabled; a warning listing
  authorised Procedures a backdated price range covers that kept their old price (OQ-133); a review
  flag, never a block, on a not-yet-authorised Procedure dated on or after the day its Contract was
  disabled (OQ-135).
- **Prepayment and balance alerts stay separate** and show side by side on the Booking (OQ-134).
- **Support** ([US-15.0.8](../stories/US-15.0.8.md), new [US-15.0.9](../stories/US-15.0.9.md)):
  8:30am to 5:00pm NZT, Monday to Friday, excluding public holidays, with P1 to P4 response times for
  two channels: product support for AA, and a help line for app users (OQ-137).
- **Public Slots** ([US-01.2.1](../stories/US-01.2.1.md), [US-01.2.2](../stories/US-01.2.2.md),
  [US-13.1.1](../stories/US-13.1.1.md)): Public is a Slot status that works like Unavailable, shows
  "Public" with an optional note and no List detail, set by the anaesthetist or the office (OQ-139).
- **A payer on each Procedure confirmed** (OQ-140): the provisional "AA to confirm" wording from 17
  November is settled across EP-04, EP-06, EP-08, EP-11 and EP-13.

In all, 51 items changed and 1 was added; none were retired. Thirteen questions were applied, three new
questions were raised (OQ-141 to OQ-143), three question bodies were corrected, and the domain model
was updated.

## 1. Inputs

- Board answers, uncommitted in `REQ/questions/`: OQ-95, OQ-97, OQ-102, OQ-109 (17 November), OQ-126,
  OQ-129, OQ-133, OQ-134, OQ-135, OQ-136, OQ-137, OQ-139, OQ-140 (18 November). No meeting, transcript
  or note: each change cites its question.
- Also uncommitted, and not part of this update: this morning's
  [surgeon contacts update](2026-11-18-donald-surgeon-contacts-no-rooms.md) (OQ-127, OQ-128), and
  rewordings of ten open questions (OQ-12, OQ-13, OQ-29, OQ-47, OQ-60, OQ-73, OQ-83, OQ-114, OQ-125,
  OQ-132) into question, what hangs on it, already settled and background, with no new answer.

## 2. Questions answered

| Question | Answer | Applied to |
| --- | --- | --- |
| [OQ-95](../questions/OQ-95.md) Modifiers: the age bands, and no ASA pre-fill | The recommendation: age on the procedure date, inclusive lower bounds, no age modifier on age-split codes; no ASA or procedure-default pre-fill. To confirm with Vanessa. | US-03.3.8, US-03.3.4, US-03.3.1, US-05.1.5, domain model |
| [OQ-97](../questions/OQ-97.md) Credit note for part of a prepayment | Full credit, then a fresh start for anything new. | US-08.6.5, US-06.4.1, domain model |
| [OQ-102](../questions/OQ-102.md) Names for preference lists and priority tiers | "Not preferred" and "Preferred"; Tier 1 to Tier 4, Tier 4 the default, until AA picks names. | US-01.3.5, US-01.3.6, US-13.6.3, US-13.6.4, domain model |
| [OQ-109](../questions/OQ-109.md) St George's and Southern Cross | Both: the matching screen imports hospital files through an integration. No automatic sync in the first release. | FT-02.1, US-02.1.5 (moved), US-02.5.1, EP-14, FT-14.6, US-14.3.1, domain model |
| [OQ-126](../questions/OQ-126.md) An address book of surgeons | The master data is the address book; people only; kept by the AA admin team. | FT-13.6, US-13.6.2, US-13.6.6, domain model |
| [OQ-129](../questions/OQ-129.md) HPI CPNs for the starting surgeon list | AA admin staff fill them in; rows load without one. | US-13.6.2, US-13.4.3, domain model |
| [OQ-133](../questions/OQ-133.md) Procedures affected by a backdated price or a dated change | Option 3 with two warnings. | US-04.1.2, US-04.2.15, domain model |
| [OQ-134](../questions/OQ-134.md) Overdue alerts and the outstanding prepayment alert | Two rules, shown together. | US-06.3.2 (earlier today), US-11.3.2 |
| [OQ-135](../questions/OQ-135.md) Review flag for a Disabled Contract | A review flag, never a block, from the day it was disabled. | US-07.2.2, US-04.1.2, domain model |
| [OQ-136](../questions/OQ-136.md) Per-Booking references on a holder's invoice | No other number than the insurer approval number. | US-04.2.2, US-11.4.3 and the domain model (applied earlier today); OQ-142 raised |
| [OQ-137](../questions/OQ-137.md) Support hours | 8:30am to 5:00pm NZT, weekdays, no public holidays; two channels with P1 to P4 response times. | US-15.0.8, US-15.0.9 (new), US-02.5.4, EP-15; OQ-141 raised |
| [OQ-139](../questions/OQ-139.md) What a public hospital Slot shows | "Public" plus an optional note, no List detail; a Slot status like Unavailable; not open for cover. | US-01.2.1, US-01.2.2, US-13.1.1, domain model |
| [OQ-140](../questions/OQ-140.md) A payer on each Procedure | Yes, with a change offered to the other Procedures billing the same payer. | US-04.1.1, US-04.1.5, US-04.2.1, US-04.2.14, US-04.3.3, US-06.2.1, US-06.3.1, US-06.3.5, US-07.2.2, US-08.1.1, US-08.2.1, US-08.2.2, US-08.2.3, US-08.4.2, FT-11.2, US-11.2.1 to US-11.2.4, US-13.7.1, domain model |

## 3. Items changed, added, retired or moved

| Item | Title | What changed | Sources |
| --- | --- | --- | --- |
| [US-01.2.1](../stories/US-01.2.1.md) | Anaesthetist sets half-day availability | Public as a choice with an optional note; the office can set it; Admin App added to components; Agreed (4) to Verify (3). | OQ-139 |
| [US-01.2.2](../stories/US-01.2.2.md) | Slot status master data | Public added to the starting values: not open for bookings, its own label, colour as master data. | OQ-139 |
| [US-01.3.5](../stories/US-01.3.5.md) | Not-preferred pairing warning | The "Not preferred" label. | OQ-102 |
| [US-01.3.6](../stories/US-01.3.6.md) | Anaesthetist priority tiers | Tier 1 to Tier 4 labels, Tier 4 the default. | OQ-102 |
| [FT-02.1](../stories/FT-02.1.md) | Hospital booking download and matching screen | Theme rewritten: the matching screen imports the two hospitals' files through an integration. | OQ-109 |
| [US-02.1.5](../stories/US-02.1.5.md) | Automatic sync from St George's and Southern Cross | Moved under FT-14.6, Future Work, rewritten as a later release. | OQ-109 |
| [US-02.5.1](../stories/US-02.5.1.md), [US-02.5.3](../stories/US-02.5.3.md) | Inbound changes; Record a cancellation | Notes and a link corrected for the sync move; a stale question marker moved to Notes. | OQ-109 |
| [US-02.5.4](../stories/US-02.5.4.md) | Inbound changes accepted until the List is authorised | Technical discussion's support hours updated. | OQ-137 |
| [US-03.3.8](../stories/US-03.3.8.md) | Age modifier from the patient's age | Bands stated as settled; boundary and age-split code criteria added. | OQ-95 |
| [US-03.3.4](../stories/US-03.3.4.md), [US-03.3.1](../stories/US-03.3.1.md) | Optional modifiers; modifiers | Nothing pre-filled from the ASA grade or procedure defaults; stale OQ-95 markers removed. | OQ-95 |
| [US-04.1.2](../stories/US-04.1.2.md) | Create, edit and disable Contracts | Warning listing Procedures dated on or after a dated change still on the old Contract, also when it is disabled. | OQ-133, OQ-135 |
| [US-04.2.15](../stories/US-04.2.15.md) | Price ranges on a fixed price | Warning, with a count and list, for authorised Procedures a backdated range covers. | OQ-133 |
| [US-04.1.1](../stories/US-04.1.1.md), [US-04.1.5](../stories/US-04.1.5.md), [US-04.2.1](../stories/US-04.2.1.md), [US-04.2.14](../stories/US-04.2.14.md), [US-04.3.3](../stories/US-04.3.3.md) | Contract holders; Party; Fixed-price Contracts; Anaesthetist's own price list; Billing route | The payer on each Procedure recorded as settled; stale question markers moved to Notes. | OQ-140 |
| [US-05.1.5](../stories/US-05.1.5.md) | Modifier code master | Notes point at the settled age bands. | OQ-95 |
| [US-06.4.1](../stories/US-06.4.1.md) | Nothing further after a prepaid procedure | A credit is for the whole prepayment invoice, then a new additional invoice by hand; criterion and Technical discussion added. | OQ-97 |
| [US-06.3.2](../stories/US-06.3.2.md) | Track prepayment status and alert when outstanding | Notes link to the balance alert by name (the OQ-134 line was added earlier today). | OQ-134 |
| [US-06.2.1](../stories/US-06.2.1.md), [US-06.3.1](../stories/US-06.3.1.md), [US-06.3.5](../stories/US-06.3.5.md) | Detect prepayment; Raise the prepayment invoice; Re-check when the Booking changes | Payer on each Procedure settled. | OQ-140 |
| [US-07.2.2](../stories/US-07.2.2.md) | Office review of Contracts and references | Review flag for a Procedure on a Disabled Contract, dated on or after the day it was disabled; never a block. | OQ-135, OQ-140 |
| [US-08.6.5](../stories/US-08.6.5.md) | Credit note option on additional invoices | A credit note always credits the whole invoice; two criteria added. | OQ-97 |
| [US-08.1.1](../stories/US-08.1.1.md), [US-08.2.1](../stories/US-08.2.1.md), [US-08.2.2](../stories/US-08.2.2.md), [US-08.2.3](../stories/US-08.2.3.md), [US-08.4.2](../stories/US-08.4.2.md) | Process an AUTHORISED List; Group by billable party; Prepaid Procedures left off; Split a fee; Send to the invoice email | Payer on each Procedure settled; invoices grouped by payer. | OQ-140 |
| [US-11.3.2](../stories/US-11.3.2.md) | Alert on booking a patient with unpaid bills | Separate from, and shown beside, the outstanding prepayment alert. | OQ-134 |
| [FT-11.2](../stories/FT-11.2.md), [US-11.2.1](../stories/US-11.2.1.md) to [US-11.2.4](../stories/US-11.2.4.md) | Who is billed; the payer stories | Payer on each Procedure settled; the feature cut back to its theme. | OQ-140 |
| [FT-13.6](../stories/FT-13.6.md) | Surgeons | The surgeon master list is AA's address book of surgeons. | OQ-126 |
| [US-13.6.2](../stories/US-13.6.2.md) | Surgeon profile | The address book; HPI CPN filled in by admin staff, a surgeon saved without one until known. | OQ-126, OQ-129 |
| [US-13.6.3](../stories/US-13.6.3.md), [US-13.6.4](../stories/US-13.6.4.md) | Not-preferred and preferred pairings | The "Not preferred" and "Preferred" labels. | OQ-102 |
| [US-13.6.6](../stories/US-13.6.6.md) | Surgeon specialties | No separate address book to search by specialty. | OQ-126 |
| [US-13.4.3](../stories/US-13.4.3.md) | Reference data loaded at cutover | Rows load without an HPI CPN; admin staff fill the numbers in. | OQ-129 |
| [US-13.1.1](../stories/US-13.1.1.md) | One-day dashboard | A Public Slot shows "Public" and its note, no List detail; Agreed (4) to Verify (3). | OQ-139 |
| [US-13.7.1](../stories/US-13.7.1.md) | Warning routine | Payer on each Procedure settled. | OQ-140 |
| [EP-14](../stories/EP-14.md), [FT-14.6](../stories/FT-14.6.md), [US-14.3.1](../stories/US-14.3.1.md) | Health systems integration; Further hospital feeds and automatic matching; Real-time processing | The automatic sync is later work; the epic cut back to its theme. | OQ-109 |
| [EP-15](../stories/EP-15.md) | Non-functional requirements | Theme mentions support; cut back to its theme. | OQ-137 |
| [US-15.0.8](../stories/US-15.0.8.md) | Help line for app users | Retitled and rewritten: hours, P1 to P4 response times (P3 4 hours); Open (2) to Verify (3). | OQ-137 |
| [US-15.0.9](../stories/US-15.0.9.md) | Product support for AA | New, at Verify (3): hours, P1 to P4 (P3 3 business days), after-hours, public holiday and Christmas cover. | OQ-137 |
| [domain-model.md](../domain-model.md) | Several sections | Modifiers, credit in full, labels, first-release hospital imports, the address book, the two Contract warnings and review flag, Public Slots, the payer on each Procedure. | All of the above |

The voice reviews also moved provenance markers for already-answered questions (for example OQ-67,
OQ-96, OQ-117) out of several descriptions into Notes, with no change of meaning.

## 4. New questions

- [OQ-141](../questions/OQ-141.md) Support cover from 8:00am: whether AA needs support from 8:00am,
  when its office opens. Left open by OQ-137.
- [OQ-142](../questions/OQ-142.md) Approval number and ACC claim number on the holder's invoice: the
  two points OQ-136 left undecided.
- [OQ-143](../questions/OQ-143.md) Surgeons without an HPI CPN or a full name: whether the HPI CPN
  ever becomes required (OQ-129's question offered "before the surgeon's first Booking"), and whether
  rows with no title or surname load at cutover.

Question bodies corrected (answers untouched): [OQ-126](../questions/OQ-126.md) (no longer cites the
retired surgeons' room record), [OQ-13](../questions/OQ-13.md) (the matching screen's integration, per
OQ-109) and [OQ-114](../questions/OQ-114.md) (the Procedure's payer, per OQ-140).

Links: a links pass over the touched epics added 18 links (text links and related) across 16 items.

## 5. Points with no requirement change

- OQ-136: applied earlier today to US-04.2.2, US-11.4.3 and the domain model; nothing further.
- OQ-12, OQ-13, OQ-29, OQ-47, OQ-60, OQ-73, OQ-83, OQ-114, OQ-125, OQ-132: reworded only, no new answer.

## 6. For the next update

- Still to confirm with AA: every answer here is Donald's for the build. OQ-95 is to confirm with
  Vanessa.
- Whether ASE stacks with an ASA code is not covered by OQ-95's answer, and no open question holds it
  (noted on US-05.1.5).
- The age 80 boundary in US-03.3.8 (A2 at exactly 80) is our reading of "inclusive lower bounds as
  printed", since the RVG prints A2 as "> 80"; it is part of what Vanessa confirms.
- [US-08.2.2](../stories/US-08.2.2.md) keeps Agreed (4): only its wording moved to one final invoice
  per payer, which [US-08.2.1](../stories/US-08.2.1.md) (at Verify) holds; its own rule is unchanged.
- The screenshot caption on US-11.2.2 still says the payer is "Provisional (OQ-140)"; the capture
  recipes write it, so it changes when the prototype is captured again.
- `/update-build-plan` should pick up: the Public Slot status, the labels, the two Contract warnings
  and the Disabled Contract review flag, credit notes always in full, the age modifier bands, and the
  surgeon saved without an HPI CPN.
