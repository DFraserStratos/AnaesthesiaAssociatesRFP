# Requirements update, 2026-10-19: List approval and open questions with Greg

What the 2026-10-19 update did to the catalogue. It records the meeting with Greg on 19 October: a
read-through of EP-07 (the List approval workflow), which Donald confirmed on the board, and a pass
through the open questions. The main changes:

- **Prepayment:** a prepayment is held in a prepay holding account, not paid to the anaesthetist.
  The holding account works like an anaesthetist's account, and payment is two steps: collect the
  money, then transfer it to whoever did the List.
- **Unavailability:** an anaesthetist never keeps a List on a Slot they have marked unavailable,
  whether planned or short-notice sickness. They must transfer it or return it to the office.
- **Vacated Slot:** whoever moves a List is asked what the vacated Slot becomes.
- **Single Booking move:** a single Booking moves only to a colleague who is free in that Slot, which
  creates a List for it.
- **Lists never move day:** when Bookings move to another day, the old ones are cancelled and new
  Bookings arrive. Removals are detected from the PDF snapshots the rooms re-send.
- **Notices and to-dos:** these are cleared by hand with a tick and never expire. Lists and Bookings
  get an "alert the office" option.
- **NHI:** a Booking cannot be saved without an NHI.
- **Pricing:**
  - Contract lines have no time band.
  - Whether the anaesthetist may change a Contract's price is a flag on each Contract.
  - The RVG multi-procedure default is kept.

The log was built from the actual changes (`git diff HEAD` and untracked files under
`requirements-board/requirements`) and checked against the run's change list.

Source shorthand in this log: **N** `Notes 2026-10-19 · AA meeting with Greg`; `N #4` is point 4 of
that note. **T** is `Typed decision 2026-10-19 · Donald (product owner)`. These are Donald's answers
at the checkpoint after the meeting: an incoming booking without an NHI waits at intake; OQ-107 is
answered "No"; the intake-source question becomes a new question.

**Counts:**

- Questions: 7 answered this run, 4 answers extended, 5 open questions updated, 1 new question
  (OQ-108). OQ-70's answer is marked superseded.
- Items: 82 changed (18 by the link pass only; 12 also carry Donald's board edits), 2 added,
  0 retired, 0 moved.
- Artifacts: 2 registered (AR-42, AR-43). domain-model.md changed.
- Links: the link pass added 34 links across 30 files (`requirements-board/.links/links-report.md`).

## 1. Inputs

- Note: [notes/2026-10-19-aa-meeting-with-greg.md](../notes/2026-10-19-aa-meeting-with-greg.md)
  (points #1 to #24), artifact [AR-43](../artifacts/AR-43.md).
- Raw file:
  [AA Meeting with Greg Oct 19th Reconciled Transcript.md](../artifacts/files/AA%20Meeting%20with%20Greg%20Oct%2019th%20Reconciled%20Transcript.md)
  ([AR-42](../artifacts/AR-42.md)), already reconciled from two automatic transcriptions. The audio
  (`AA Meeting with Greg Oct 19th.mp3`) was not filed, as for earlier meetings.
- Donald's board edits during the meeting, 14:29 to 14:48 NZDT (`requirements-board/.history`):
  - EP-07: description reworded (the typo "complet" is fixed in this run).
  - Moved to Confirmed: FT-07.1 to FT-07.4, US-07.1.1, US-07.2.1, US-07.2.3, US-07.3.1 and
    US-07.3.2 (from Proposed), and US-07.4.1 and US-07.4.2 (from Verify).
- Donald's typed answers on the board: OQ-49, OQ-79, OQ-89 and OQ-90.
- Donald's "Claude, update X" requests in the transcript, for OQ-77, OQ-80, OQ-81, OQ-84, OQ-85
  and OQ-87, were treated as explicit instructions.
- A rewording of the open questions, done by another Claude session at Donald's request just before
  the meeting (L151), sits in the same diff for OQ-12, 13, 29, 47, 60, 81, 87, 89, 93, 95, 96, 97 and
  100 to 107. It restates each question; nothing there was answered. In this run OQ-83's owner, which
  that rewording had set to "Donald to ask Ben", was put back to "Donald", as the transcript says.
- Not part of this run, also uncommitted: the `.claude/skills/*` symlink to folder change, and the
  matching `requirements-board/ADOPTING.md` and `README.md` edits.

## 2. Questions

**Answered in this run** (Open to Answered).

| Question | Answer in one line | Source |
| --- | --- | --- |
| [OQ-77](../questions/OQ-77.md) | Before the combined invoice is sent, a split is a normal admin edit. After it is sent, it is the credit and rebill already settled. | N #2 |
| [OQ-80](../questions/OQ-80.md) | The pair is created when an admin approves the prepayment invoice. Its other side is a prepay holding account. A move changes nothing in the ledger. A second pair pays whoever did the List. | N #4 #15 |
| [OQ-81](../questions/OQ-81.md) | Short-notice sickness takes the same path as other unavailability: transfer the List or return it to the office, forced at the time. Never a conflict left in place. | N #5 |
| [OQ-84](../questions/OQ-84.md) | One path for everyone: whoever moves a List is asked whether the vacated Slot becomes free or unavailable. | N #6 |
| [OQ-85](../questions/OQ-85.md) | The receiver is found by type-ahead search or the free list. A Booking goes only to a free colleague, as a new List. Notifying is optional. No blacklist warning. | N #7 #16 #17 |
| [OQ-87](../questions/OQ-87.md) | Lists never move. A Booking moved to another day is a cancellation plus a new Booking. Removals are detected from re-sent snapshots. | N #8 #18 |
| [OQ-107](../questions/OQ-107.md) | No. A flag on each Contract decides whether the anaesthetist may change its price. | N #20; T |

**Answers extended** (status already Answered; a "The meeting adds" paragraph added):

- OQ-49: NHI mandatory, plus T (an incoming booking without an NHI waits at intake). Source: N #1.
- OQ-79: Donald's four answers, plus Greg's point that one tick clears both notices and to-dos.
  Placement (part 4) is designed by Claude for AA to check. Source: N #3.
- OQ-89: no time band. The add-on line was dropped, and the anaesthetist change is a per-Contract
  flag. Source: N #9 #20.
- OQ-90: keep the default, with Greg's correction that time units go on every procedure. Source:
  N #10.

**Marked superseded:** OQ-70's answer that the payable is updated to the new anaesthetist (N #4).

**Updated, still Open:**

- OQ-60: passed over. Source: N #22.
- OQ-83: deferred to the end of discovery. Source: N #22.
- OQ-93: Greg on a blank insurer and the office's approval check. Source: N #12.
- OQ-96: prepaid estimates, the holding account and an override together; Greg may draw it out.
  Source: N #15.
- OQ-102: Ben's ranking as the order colleagues are listed in. Source: N #16.

**New:** [OQ-108](../questions/OQ-108.md) Which source starts a booking, and which integration
comes first (for Ben and Vanessa; affects EP-02, FT-02.1, FT-02.2). Source: N #19.

## 3. Items changed, added and retired

**EP-01 Scheduling**

- [US-01.5.5](../stories/US-01.5.5.md) Mark unavailable while holding a List: also covers
  short-notice sickness. The system forces transfer or return when the Slot is marked. Ben's
  on-the-day practice recorded. Asks what the vacated Slot becomes. Sources: OQ-81, OQ-84, N #5 #6.
- [US-01.5.2](../stories/US-01.5.2.md) Conflict flagging: unavailability is never a conflict flag;
  the flag now covers hospital closures only. Verify to Confirmed. Sources: OQ-81, N #5.
- [US-01.5.4](../stories/US-01.5.4.md) Availability conflict dashboard: only closed-hospital
  conflicts remain. Sources: OQ-81, N #5.
- [US-01.4.1](../stories/US-01.4.1.md) and [US-01.4.3](../stories/US-01.4.3.md): the vacated Slot
  is free or unavailable by choice, for the office and the anaesthetist alike. This replaces the
  RFP-response line. Sources: OQ-84, N #6.
- [US-01.4.7](../stories/US-01.4.7.md) Anaesthetist moves a single Booking: rewritten per OQ-85.
  Verify to Confirmed. Sources: OQ-85, N #7 #16 #17.
- [US-01.4.2](../stories/US-01.4.2.md) Availability finder: colleagues listed by tier and preferred
  pairing (ordering only), plus type-ahead search. Sources: OQ-85, N #7 #16.
- [US-01.4.6](../stories/US-01.4.6.md) The List's anaesthetist did its procedures: a prepaid payable
  is the holding account and does not move. Stays Verify (trigger doubt). Sources: OQ-80, N #4.
- [US-01.1.1](../stories/US-01.1.1.md) Two Slots per anaesthetist per day: note that one List per
  Slot stays. Source: N #17.
- [FT-01.6](../stories/FT-01.6.md) Draft Lists: the reschedule-clash origin removed. Sources: OQ-87,
  N #8.

**EP-02 Booking intake**

- [US-02.5.2](../stories/US-02.5.2.md) retitled "Reschedule to another day arrives as cancel and new
  Booking" and rewritten. Verify to Confirmed. Sources: OQ-87, N #8 #18.
- **New** [US-02.2.3](../stories/US-02.2.3.md) Detect Bookings removed from a re-sent List
  (Verify). Sources: OQ-87, N #18.
- [US-02.5.3](../stories/US-02.5.3.md) Record a cancellation: a cancellation can be detected as a
  missing Booking, and a move to another day is a cancellation plus a new Booking. Sources: OQ-87,
  N #8 #18.
- [US-02.1.4](../stories/US-02.1.4.md) Unmatched queue and [US-02.1.2](../stories/US-02.1.2.md)
  Match rows: an incoming row with no NHI waits here until the office adds one. Sources: OQ-49,
  N #1, T.
- [EP-02](../stories/EP-02.md): note on OQ-108. Sources: OQ-108, N #19.

**EP-03, EP-04, EP-05 Booking capture and pricing**

- [US-04.2.4](../stories/US-04.2.4.md) Contract lines: no time band, add-on flag or quantity rule.
  Verify to Confirmed. Sources: OQ-89, N #9.
- [US-05.2.5](../stories/US-05.2.5.md) and [US-05.4.3](../stories/US-05.4.3.md): time-band wording
  removed. Sources: OQ-89, N #9.
- [US-04.2.2](../stories/US-04.2.2.md) Contract pricing terms: a per-Contract flag set by AA.
  Verify to Confirmed.
- [US-03.5.1](../stories/US-03.5.1.md) Apply an anaesthetist adjustment: applies the flag. Verify
  to Confirmed.
- The same flag wording also went into [FT-03.5](../stories/FT-03.5.md),
  [US-05.4.1](../stories/US-05.4.1.md), [US-05.4.2](../stories/US-05.4.2.md),
  [FT-05.4](../stories/FT-05.4.md) and [US-04.1.1](../stories/US-04.1.1.md).
- Sources for the flag items: OQ-107, N #20, T. Prepaid price changes are left on OQ-96.
- [FT-05.3](../stories/FT-05.3.md) and [US-05.3.1](../stories/US-05.3.1.md): the RVG default is
  confirmed (base units on the primary procedure only, time units on every procedure, modifiers
  split above four). Verify to Confirmed. Which procedure is primary is still unsettled. Sources:
  OQ-90, N #10.
- [US-03.6.3](../stories/US-03.6.3.md) retitled "Ask the office to check a Booking or List": an
  alert with a note, which posts an active notice. Proposed to Confirmed. Sources: OQ-79, N #3.
  [FT-03.6](../stories/FT-03.6.md)'s link wording follows it.
- [US-03.1.5](../stories/US-03.1.5.md) Anaesthetist sees the patient's NHI: Open to Confirmed.
  Sources: OQ-49, N #1.

**EP-06, EP-08, EP-09 Prepayment and billing**

- [EP-06](../stories/EP-06.md) and [FT-06.5](../stories/FT-06.5.md): the prepay holding account and
  the two steps.
- [US-06.5.1](../stories/US-06.5.1.md) retitled "Prepay holding account". Verify to Confirmed.
- [US-06.3.1](../stories/US-06.3.1.md) Raise the prepayment invoice: generated when an admin
  approves it; the pair is the patient and the holding account. Verify to Confirmed.
- [US-06.5.4](../stories/US-06.5.4.md) Prepaid Booking moved: the payable does not move, nothing is
  recalculated, and an optional patient email is allowed. Verify to Confirmed. Sources: OQ-70,
  OQ-80, N #4.
- [FT-06.4](../stories/FT-06.4.md) Settlement: the second pair from the holding account at
  authorisation. Confirmed to Verify, because Greg said "confirmed and submitted".
- [US-06.4.1](../stories/US-06.4.1.md), [US-08.2.2](../stories/US-08.2.2.md) Net prepayments and
  [US-09.1.3](../stories/US-09.1.3.md) Prepayment invoices also paired: aligned to the holding
  account.
- [FT-08.1](../stories/FT-08.1.md) Trigger and inputs: the prepayment invoice is generated on admin
  approval, no longer at booking setup.
- [US-06.5.2](../stories/US-06.5.2.md) and [US-06.3.5](../stories/US-06.3.5.md): wording aligned
  only.
- Sources for this group: OQ-80, OQ-96, N #4 #15.
- [US-08.6.4](../stories/US-08.6.4.md) Split a combined Procedure: before the invoice is sent it is
  an admin edit; after, a credit and rebill. Verify to Confirmed. [US-08.6.3](../stories/US-08.6.3.md)
  and [US-08.6.5](../stories/US-08.6.5.md) get sources only. Sources: OQ-77, N #2.

**EP-07 List approval**

- [EP-07](../stories/EP-07.md): typo fix only.
- [US-07.2.2](../stories/US-07.2.2.md): note on the insurer and the approval number (N #12).
- [US-07.3.1](../stories/US-07.3.1.md): no partial release (N #13).
- [US-07.3.2](../stories/US-07.3.2.md): corrections are new records (N #14).
- [US-07.4.1](../stories/US-07.4.1.md): invoices show quickly (N #24).
- The items Donald confirmed got N #11 as a source.

**EP-11 Patients**

- [US-11.1.4](../stories/US-11.1.4.md) Patient without NHI: a Booking cannot be saved without an
  NHI, and the incoming row waits at intake. Open to Confirmed.
- [US-11.1.5](../stories/US-11.1.5.md) retitled "Intake rows waiting for an NHI". It is kept
  because US-13.6.1 and US-14.4.1 link to it.
- [US-11.1.1](../stories/US-11.1.1.md): the NHI is present from creation.
- Sources: OQ-49, N #1, T.

**EP-13 Admin**

- [FT-13.8](../stories/FT-13.8.md) and [US-13.8.1](../stories/US-13.8.1.md): notices are active or
  resolved, cleared by a tick, and never expire. US-13.8.1 goes Confirmed to Verify, because the
  panel placement is Claude's design.
- **New** [US-13.8.3](../stories/US-13.8.3.md) Resolve a notice.
- [US-13.8.2](../stories/US-13.8.2.md): a notice stays active until resolved; a single Booking move
  can optionally notify. Verify to Confirmed.
- [US-13.7.2](../stories/US-13.7.2.md): the same tick clears to-dos.
- Sources: OQ-79, OQ-85, N #3 #7.

**domain-model.md:**

- the holding account and the two-step prepayment;
- the NHI is present from creation;
- a List never moves to another day or session, and a move is a cancellation plus a new Booking;
- notices are active or resolved;
- single-Booking moves;
- no time band, and the per-Contract flag.

Link pass: link-requirements over EP-01 to EP-13 (not EP-14 or EP-15) added 34 text links and `related` entries across 30 files.

## 4. New questions

- [OQ-108](../questions/OQ-108.md): see section 2.

## 5. Points with no requirement change

- N #15: still open; recorded on OQ-96.
- N #19: still open; new OQ-108, plus a note on EP-02.
- N #21: a prototype finding, outside requirements; see "For the build plan" below.
- N #22: OQ-60 and OQ-83 deferred; update lines only.
- N #23: scheduling of the next sessions.
- N #24: a note on US-07.4.1 only.

## 6. Left for follow-up

- **Screenshots** still show the old behaviour and need recapturing after the build: US-01.5.2,
  US-01.5.4, US-02.5.2, US-03.5.1, US-06.3.1, US-11.1.4 and US-13.8.1.
- **Diagram AR-24** (Billing / Invoice Flow) was redrawn in place on 19 October to match the
  catalogue.
  - The prepayment lane uses the holding account, and the second pair is marked "trigger to
    confirm".
  - The Contract can be changed until AUTHORISED; the adjustment is the per-Contract flag.
  - Changes before and after AUTHORISED are shown.
  - The engine shows the multi-procedure rule.
  - OQ-47 is shown as "not yet confirmed".
  - Regions: `prepayment-pair-undecided` became `prepayment-pair`, and `finalise-procedure` was
    removed.
  - New regions: `edit-until-authorised`, `after-authorised`, `prepayment-settlement` and
    `prepayment-move`. They are linked from US-07.2.1, US-07.3.2, US-08.6.4, FT-06.4, US-06.4.1,
    US-06.5.1, US-09.1.3 and US-06.5.4.
  - The notes on US-03.5.1, FT-03.5, US-03.4.1 and FT-03.4 that called the diagram stale were
    updated.
- **Still Verify:**
  - FT-06.4 and US-01.4.6: Greg named the second-step trigger "confirmed and submitted"; the catalogue
    uses authorisation.
  - US-02.2.3: new, raised by Greg.
  - US-13.8.1: the placement is Claude's design.
- **US-14.1.1** (HL7 S13 reschedule) still maps to "a reschedule", which now reads as cancel plus
  new when the day changes. It may want a look when the hospital integration is planned.
- **Tensions left as they are:**
  - [US-01.6.3](../stories/US-01.6.3.md) still lets the office assign a Draft List onto an
    unavailable Slot with a soft warning. OQ-81 now says an anaesthetist never keeps a List on a Slot
    they marked unavailable. The office override was not discussed.
  - [US-06.5.3](../stories/US-06.5.3.md): a cancelled and rebooked Booking still starts its own
    prepayment, and how a refund comes out of the holding account is not specified.

## 7. For the build plan

The next `/update-build-plan` run reads this section.

**The second-procedure entry in the prototype is wrong, and OQ-90 settles how it should work**
(N #10, N #21).

- **What was seen:** Donald added a second Procedure to a Booking in the prototype's anaesthetist
  capture. It showed base units on the additional Procedure (greyed, "not invoiced"). Greg and
  Donald agreed "the prototype's wrong": an additional Procedure carries no base units at all.
- **The rule, now Confirmed** (FT-05.3, US-05.3.1; OQ-90 answered "keep the default"):
  - Base units go on the primary Procedure only.
  - Time units go on every Procedure, from its own recorded times.
  - Modifier units all sit on the primary while the total is four or fewer. Above four they split
    equally across every Procedure.
  - Which Procedure is primary is not settled.
- **Where it lands:** Phase 23 (Primary Procedure, multi-procedure rule and combination Contracts),
  not built yet. It already plans the fix:
  - the additional Procedure's base row reads 0 with "Base units are on the primary procedure" and
    no stepper;
  - modifiers split above four (RV-02, DM-15).
- **What the update must change in Phase 23** (its doc and prompt): the phase builds OQ-90 as an
  open default under owner decision D26, which is now resolved.
  - Close D26 in ROADMAP.md's owner-decisions table.
  - Drop the "Provisional · to confirm with AA (OQ-90)" pill.
  - Drop the `MULTI_PROCEDURE_RULE_APPLIES` switch and its "price each Procedure alone" branch.
    Pricing each Procedure alone is "not correct" (Greg).
  - Build the rule with no provisional label.
  - FT-05.3 and US-05.3.1 moved Verify to Confirmed, so the re-grade picks them up.

**The build plan cites a removed AR-24 region.** `AR-24#prepayment-pair-undecided` is now
`AR-24#prepayment-pair`. It is cited in `docs/prototype-build/catch-up/phases/phase-27-prepayment-lifecycle.md`,
`plan.json` and `index.html`. Phase 27 should also take up the prepay holding account and the
two-step prepayment (OQ-80; EP-06, US-06.3.1, US-06.5.4, FT-06.4, US-09.1.3).

**Built phases with now-answered provisional readings** (the Schedule track, Phases 28 to 32, per
PROGRESS.md). These need follow-up work in a later phase; they are not plan-doc edits only.
- **OQ-79:** `NOTIFICATION_POOL_RULE` and the Notifications page caption build "keep every notice,
  paginated". Now notices are active or resolved: a tick hides them for the whole team, and nothing
  expires. There is also an "alert the office" option on Lists and Bookings (FT-13.8, US-13.8.1,
  new US-13.8.3, US-03.6.3).
- **OQ-84:** `VACATED_SESSION_DEFAULT` and its hint. Now answered: whoever moves a List, the
  anaesthetist or the office, is asked whether the vacated Slot becomes free or unavailable. Drop
  the provisional label (US-01.4.1, US-01.4.3).
- **OQ-81:** "the office's sickness entry keeps the conflict" is now wrong. Unavailability, including
  short-notice sickness, forces a transfer or a return to the office, and a List never stays as a
  conflict (US-01.5.5, US-01.5.2, US-01.5.4). The prototype's admin-simulate-sickness and
  unavailable-conflict beats change, and so does the demo guide.
- **OQ-85:** a single Booking moves only to a free colleague, as a new List, with a type-ahead
  search. Notifying the office is optional (US-01.4.7, US-01.4.2).
- **OQ-80:** the payee repoint planned for Phase 41 (the comment at `list.ownerMove`) is gone. A
  prepaid payable is the holding account and never moves.
