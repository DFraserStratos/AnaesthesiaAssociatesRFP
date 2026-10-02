# Requirements update, 2026-10-02 (late afternoon): AA booking and pricing review with Greg

What the third update of 2026-10-02 did to the catalogue. It follows the morning run
([2026-10-02-requirements-update.md](2026-10-02-requirements-update.md)) and the midday run
([2026-10-02-aa-requirements-review-with-greg.md](2026-10-02-aa-requirements-review-with-greg.md)),
whose changes are still uncommitted in many of the same files. This run's lines are the ones that
cite `Notes 2026-10-02 · AA booking and pricing review with Greg`; `#n` below means a point of that
note. Donald's board edits of the session (14:31 to 15:43 NZDT) are kept as they stand, except the
spelling and typo fixes listed.

**Counts.** 0 questions answered · 1 board-created question given its source and context (OQ-82) ·
1 open question given a source (OQ-78) · 31 items changed · 5 link-only edits (US-02.1.2, US-03.5.1, US-03.6.2, US-03.7.1, US-04.3.4) · 1 story added (US-02.4.4) · 1 story
retired by this run (US-02.4.3; US-05.2.3 was retired on the board) · 0 moved between parents ·
3 new questions (OQ-87 to OQ-89). No status was moved by this run except the US-02.4.3 retirement;
every other status move of the session was Donald's on the board. domain-model.md not changed.

## 1. Inputs

- Note: [notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md](../catalogue/notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md) (points #1 to #65)
- Transcript: [AA Meeting with Greg Oct 2 C.md](../../Meeting%20Recordings/AA%20Meeting%20with%20Greg%20Oct%202%20C.md) (14:30 to 16:00 NZDT; ends as Donald pauses after US-05.2.6)
- Board edits during the session, 14:31 to 15:43 NZDT, from `requirements-board/.history` (edits
  tagged `board`): 35 entries on 22 items (EP-02, US-03.3.6, US-04.1.1, EP-05), and OQ-82 created on
  the board at about 14:40 (no history entry). Note #6 to #21.
- Donald's typed requests (note #2 to #5): split US-02.4.1 with the photo story out of MVP; retire
  US-02.4.3 and remove it from the prototype; flesh out US-02.5.2's specs and AC; give every FT-02.5
  story the context of an automated update from an integration.

## 2. Questions answered

None. OQ-82 (Do we want to automate the change emails), created on the board in the session with
empty sources, now cites #1 #25 and records the room's context; still Open, owner "Donald to ask
AA". OQ-78 (Default Contracts) cites #38: Greg is to revisit the default RVG Contract over the
weekend; not settled.

## 3. Items changed, added, retired or moved

### EP-02 · Booking intake and change handling

| Item | What changed | Sources |
| --- | --- | --- |
| [FT-02.3](../catalogue/requirements/FT-02.3.md) Manual booking entry by admin | Source only (board: Confirmed) | #7 #23 |
| [US-02.2.1](../catalogue/requirements/US-02.2.1.md) Read, correct and ingest a surgeon PDF list | Note: Future Work and why; Donald's mailbox idea (board: Future Work) | #6 #22 |
| [US-02.3.1](../catalogue/requirements/US-02.3.1.md) Create or amend a Booking | Note: every field editable by an admin until AA says otherwise (board: Confirmed) | #7 #24 |
| [US-02.3.2](../catalogue/requirements/US-02.3.2.md) Save Booking changes explicitly | Source only (board: Confirmed) | #7 |
| [US-02.3.3](../catalogue/requirements/US-02.3.3.md) Draft a booking update email | Note: automated email for an anaesthetist's own move is OQ-82; "tentative" dropped from the US-02.3.4 pointer. Stays Verify | #1 #25 |
| [US-02.3.4](../catalogue/requirements/US-02.3.4.md) Update email templates per kind of change | Stale "Tentative... so Proposed" note replaced (board: Confirmed) | #7 |
| [FT-02.4](../catalogue/requirements/FT-02.4.md) Anaesthetist ad hoc booking | "optionally, later," photo | #2 #3 |
| [US-02.4.1](../catalogue/requirements/US-02.4.1.md) **Add a Booking manually** (was "Add a Booking, manually or from a photo") | Split: photo text, AC and photo screenshots moved out; note on the split | #2 #26 |
| [US-02.4.4](../catalogue/requirements/US-02.4.4.md) **Add a Booking from a photo of the booking card** | **New**, Proposed, swimlane Future Work; photo text, AC and screenshots from US-02.4.1 | #2 #26 |
| [US-02.4.3](../catalogue/requirements/US-02.4.3.md) Copy a Booking | **Retired**; reason; `related: US-02.4.1` removed. **To be removed from the prototype** | #3 #27 |
| [FT-02.5](../catalogue/requirements/FT-02.5.md) Change types and audit | Source only | #5 #11 |
| [US-02.5.1](../catalogue/requirements/US-02.5.1.md) Apply a modification | Framed as the automated path; AC "Automated update"; note on post-MVP, US-02.1.5, US-14.6.2, Greg's insurance example | #5 #11 #35 |
| [US-02.5.2](../catalogue/requirements/US-02.5.2.md) Apply a reschedule | Board sentence kept ("automaticlly" spelled); Booking or whole List; why; human moves are US-01.4.3/US-01.4.7. 4 ACs (single Booking to same surgeon's List; whole List when Slot free; clash accepted as Draft List; history kept); Technical discussion (snapshots and deltas; Lists apparently don't merge; pause option not taken; open cases OQ-87). Stays Verify, Future Work | #4 #5 #9 #28 to #32 |
| [US-02.5.3](../catalogue/requirements/US-02.5.3.md) Record a cancellation | Automated cancellation; AC; Donald's reading of why it stays visible, as a note; post-MVP note | #5 #11 #33 |
| [US-02.5.4](../catalogue/requirements/US-02.5.4.md) Changes accepted until the procedure | Board's unfinished sentence completed: "locks once the anaesthetist submits the List"; first sentence extended to match; 2 ACs (open until submitted, hospital changes still via admin review; locked once submitted); note | #5 #10 #34 #35 |
| [US-02.5.5](../catalogue/requirements/US-02.5.5.md) Append-only change history | Each entry records its source (person or integration); note: stays MVP, reproducibility meaning | #11 #36 |
| [US-02.5.6](../catalogue/requirements/US-02.5.6.md) Concurrent edits | Integration example; note: Future Work and why | #5 #11 #37 |

### Other epics

| Item | What changed | Sources |
| --- | --- | --- |
| [FT-01.6](../catalogue/requirements/FT-01.6.md) Draft Lists | New "arises" bullet: an automated reschedule that clashes | #9 #29 |
| [US-03.3.4](../catalogue/requirements/US-03.3.4.md) Capture Procedure modifiers | Link to retired US-05.2.3 removed (the one check warning); `related: US-05.1.4` | #18 #45 |
| [US-03.3.6](../catalogue/requirements/US-03.3.6.md) Other billing lines (including UNIT X RATE) | Description and AC: hourly rate x time → Contract defined unit x rate, to match the board retitle; tension with US-05.2.6 noted (OQ-89) | #21 #55 |
| [US-04.1.1](../catalogue/requirements/US-04.1.1.md) Contract categories | Note: Verify, Greg reviewing at the weekend (board: Verify) | #12 #38 |
| [US-04.2.2](../catalogue/requirements/US-04.2.2.md) Contract pricing and adjustment rules | "hourly rate multiplied by time" basis → Contract defined rate, in text and AC; note pointing to OQ-89 | #55 |
| [US-05.1.1](../catalogue/requirements/US-05.1.1.md) RVG code master data | Notes: AA-sourced marker gone and why; the unique system code; OQ-88 (board: text, AC, Confirmed) | #13 #39 #42 |
| [US-05.1.4](../catalogue/requirements/US-05.1.4.md) Default modifiers | Board text rewritten to the spoken wording (procedure codes specify default modifiers; never included in base); held on the Procedure master; pre-filled and can be unticked (2 ACs); components + Master Data, Anaesthetist App | #14 #45 |
| [US-05.1.5](../catalogue/requirements/US-05.1.5.md) Modifier code master | AA's own list, partly from the guide, partly AA's | #15 #46 |
| [US-05.1.6](../catalogue/requirements/US-05.1.6.md) Procedure master mapped to RVG codes | Group, subgroup, default modifiers; system code per procedure as a note (OQ-88); one default Contract with a range or one per kind (settles the earlier count tension); "base unit and modifier figure"; naming and free-text notes (board: Confirmed) | #16 #40 #43 #48 to #51 |
| [FT-05.2](../catalogue/requirements/FT-05.2.md) Unit and fee calculation | Source only (board: Confirmed) | #17 |
| [US-05.2.1](../catalogue/requirements/US-05.2.1.md) Per-unit pricing rate | Applies wherever no fixed fee or own rate; Greg's "mandated" as an unsettled note; note OQ-89 (board: Confirmed) | #17 #52 |
| [US-05.2.2](../catalogue/requirements/US-05.2.2.md) Tiered time units | Technical discussion: tiers defined as data, not hard coded | #53 |
| [US-05.2.3](../catalogue/requirements/US-05.2.3.md) Conditional positioning modifier | Retirement note (board: Retired) | #18 |
| [US-05.2.5](../catalogue/requirements/US-05.2.5.md) Fixed fee schedule pricing | "is a is a" typo fixed; note OQ-89 | #19 #54 |
| [US-05.2.6](../catalogue/requirements/US-05.2.6.md) Contract defined rate | Link text space trimmed; unit rate, alternative to the anaesthetist's own value; note | #20 #55 |
| [US-08.4.4](../catalogue/requirements/US-08.4.4.md) Invoice reproducibility | Note: keep the invoice's "recipe", not regenerate from another point in time | #36 |

### Links applied by the link pass (12)

Batches EP-02, EP-05, EP-03+EP-04; 12 of 13 verified proposals applied (US-04.2.1 "default RVG Contract" → US-04.4.1 was dropped: US-04.4.1 is the hospital default, not the default RVG Contract).

- US-02.1.2 related US-01.3.3 · US-02.3.2 "List reassignment" → US-01.4.1 · US-02.3.3 "moves their own List" → US-01.4.3 · US-02.5.2 AC "Draft List" → FT-01.6 · US-02.5.4 "submits the List" → US-07.1.1, related US-07.2.1
- US-03.3.6 "Contract defines its own rate" → US-05.2.6 · US-03.5.1 "selected Contract allows an adjustment" → US-04.2.2 · US-03.6.2 related US-03.6.1 · US-03.7.1 "billable party" → FT-11.2 · US-04.3.4 "the List was authorised" → US-07.3.1
- US-05.2.2 "anaesthetic time" → US-03.3.3

## 4. New questions

- [OQ-87](../catalogue/questions/OQ-87.md) Automated reschedule rules still open (US-02.5.2): a single Booking with no List for the surgeon in the new session; a whole List into a session where the same surgeon has one; recognising a move in snapshots.
- [OQ-88](../catalogue/questions/OQ-88.md) RVG code master and procedure master, one list or two (US-05.1.1, US-05.1.6, US-05.1.4), and which carries the unique system code; parent and child or flat.
- [OQ-89](../catalogue/questions/OQ-89.md) Contract defined rate and fixed fee after the rewording (US-05.2.6, US-05.2.1, US-04.2.2, US-05.2.5, US-04.2.4).

## 5. For Donald to check

1. **US-02.5.4 lock point.** Your board sentence ended at "locks once the anaesthetist enters the";
   it was completed as "submits the List" from Greg's "Just make it on the submission of the list"
   and your "Yeah. So we...". Your spoken version was "once the [BTM data] is entered". The "Locked once
   submitted" AC says only that an automated change is not applied automatically; handling is left
   open. The description still says "right up to the start of the operating session" and the title
   "until the procedure": retitle if submission is the rule. The first sentence now reads "right up to the start of the operating session and beyond, until the anaesthetist submits the List".
2. **US-05.1.4 wording.** Your board text ("Some RVG base codes already include a modifier. Eg,
   Spine and neuro codes /. procedure will include...") was replaced by the wording spoken at L365 to
   L387 ("specify a default modifier... indicate the prone positioning modifier"), because "already
   include" contradicts "The modifiers are never included in the base". Check you're happy.
3. **US-02.5.2 ACs** go beyond the board sentence, as you asked, and are Greg's and your proposals
   (Verify); "apparently the two lists can't merge" is in Technical discussion, not an AC. Greg's "Change the date and put the new anaesthetist in"
   was not made an AC.
4. **US-03.3.6 and US-04.2.2** were moved from hourly rate x time to the Contract defined unit rate
   to match your US-05.2.6 and US-03.3.6 retitles; you said "We'll come back to that". Revert if you'd
   rather wait. US-03.3.6 still calls it a billing line outside BTM, while US-05.2.6 prices the whole
   Procedure (OQ-89 part 2).
5. **Possible duplicate:** US-05.2.6 (Contract defined rate) vs US-05.2.1's "Contract rate or
   discount" AC and US-04.2.2's "contract rate per unit" basis (OQ-89).
6. **Unique system code** sits on the RVG code master (your board edit) but your example was a
   procedure line; US-05.1.6 records your procedure-line example as a note (OQ-88).
7. **Prototype:** remove Copy a Booking (US-02.4.3); photo capture (US-02.4.4) and the FT-02.5
   automated change stories except US-02.5.5 are Future Work. For `/update-build-plan`.
8. **Run-2 open items:** none were settled by this session; they remain as listed in that log.
9. No conflict was found between this session's board edits and the earlier runs' changes.

## 6. Points with no requirement change

- #1, #8: OQ-82 is a question, not a decision; recorded on US-02.3.3.
- #44: US-05.1.3 group codes were already Confirmed; Donald's reservation is recorded in the note only.
- #47: Australia, Canada and the UK: market context.
- #56: tooling asides (board ID copy, checkpoint display).
- #57 to #60: follow-ups, carried by the items and questions above.
- #61 to #65: tensions, carried by section 5 and OQ-87 to OQ-89.
- Every other point is reflected in an item in section 3.
