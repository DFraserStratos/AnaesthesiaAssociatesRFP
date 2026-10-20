# AA Prototype · Requirements catch-up roadmap

The prototype was built in July 2026 against the original RFP (phases 00 to 13, see
[../ROADMAP.md](../ROADMAP.md)). The requirements catalogue is now the source of truth and has moved
a long way from the RFP. This catch-up brings the prototype up to the catalogue as at commit
**`d4db277`**. Future Work lane and retired items are out; retired behaviour the prototype still has is removed
or reworked. The plan was updated on 2026-10-01 for the AA meeting with Greg
([change log](../../../requirements-board/requirements/changes/2026-10-01-requirements-update.md)),
on 2026-10-03 for the three 2026-10-02 meetings with Greg (change logs:
[morning](../../../requirements-board/requirements/changes/2026-10-02-requirements-update.md),
[requirements review](../../../requirements-board/requirements/changes/2026-10-02-aa-requirements-review-with-greg.md),
[booking and pricing review](../../../requirements-board/requirements/changes/2026-10-02-aa-booking-and-pricing-review-with-greg.md)),
on 2026-10-08 for the Contract and pricing model rewrite (change logs:
[2026-10-07 requirements update](../../../requirements-board/requirements/changes/2026-10-07-requirements-update.md),
with the 2026-10-05 typed decision, the 2026-10-06 directors' answers and the 2026-10-08 follow-ups;
[List lifecycle states](../../../requirements-board/requirements/changes/2026-10-07-list-lifecycle-states.md);
[procedure picker and source text](../../../requirements-board/requirements/changes/2026-10-08-procedure-picker-and-source-text.md)),
and again on 2026-10-20 for the 14, 16 and 19 October meetings with Greg and the consistency review
(change logs: [2026-10-16 requirements update](../../../requirements-board/requirements/changes/2026-10-16-requirements-update.md),
with Greg's pricing model v6, which overwrote AR-28, AR-29 and AR-30 in place;
[2026-10-19 meeting with Greg](../../../requirements-board/requirements/changes/2026-10-19-aa-meeting-with-greg.md);
the consistency review committed at `b791b90`, with Donald's typed decisions of 2026-10-20; the
[status recode](../../../requirements-board/requirements/changes/2026-10-20-status-recode.md) is a relabel only).
That update dropped the procedure master (the procedure on a Booking is the text received; the RVG
groups are the one master list, and the RVG code on a Procedure is optional, picked by type-ahead),
kept the rooms', the hospital's and a new invoice description apart, made prepaid a setting on the
Contract (no prepaid settings and no GST period on the profile), replaced first and third party with
settings (who is billed, whether the anaesthetist may change the price, prepaid), made Contract lines
standalone and optional, staged every Contract change for review before it becomes a new dated version
that is never backdated, let the anaesthetist change a submitted List, its Contract included, until it
is AUTHORISED, put the price, rate and discount on the Procedure with the last change standing and no
reason asked, merged other billing lines into events, made the NHI mandatory, held prepayments in a
prepay holding account paid out by a second pair once the List is authorised, answered the 19 October
schedule questions (unavailability is never a conflict, whoever moves a List chooses what the vacated
Slot becomes, a single Booking moves only to a free colleague as a new List, Lists never move day,
notices are ticked resolved, an anaesthetist can alert the office) and confirmed the RVG
multi-procedure rule. The changed items were re-graded (194 of 287 in scope), and the data-model
delta and reverse check redone (new deltas DM-55 to DM-57; DM ids are stable). **The reverse check was
renumbered**: RV ids now name different findings from the 2026-10-08 plan, and every phase's RV covers
were re-placed by meaning (see Sequencing rules).

The plan closes every verified gap in the [gap analysis](GAP-ANALYSIS.md): 209 gap items, 39
data-model deltas (DM) and 36 reverse findings (RV), with nothing parked. Per-gap detail is in
[epics/](epics/), the machine-readable set in [gaps.json](gaps.json), and the code index in
[analysis/](analysis/) (prototype maps, [data-model delta](analysis/domain-model-delta.md),
[reverse check](analysis/reverse-check.md)).

There are forty-five phases, numbered from 14 (about 81 sessions in all). Phases added in updates
carry a letter suffix (15a, 15b, 19a, 19b, 20a, 27a, 32a, 32b, 38a, 38b, 39a, 39b, 40a, 43a) so they sit where
they run. Each one is sized for **one focused Claude Code session (two at most) with one coherent
deliverable**, like the originals, and has a plan in `phases/phase-NN-<slug>.md`. Every phase leaves
the app green, demoable and fully migrated, because the prototype is shown in live workshops between
phases. **Built:** 14, 15, 15a, 15b, 16, 17 and 28 to 32 (the Schedule track ran ahead of the
Contracts track while the pricing requirements settled). **Next:** 32a, then 32b and 38a, then the
Contracts track from 18.

## Owner decisions

These readings shape what a phase delivers, not just its labels. Each is a question on the
Requirements Board (the OQ named in its row). **Nine were answered at the 2026-10-01 meeting with
Greg (D1 to D8, D10) and fourteen more at the 2026-10-02 meetings (D12 to D25)**; D42 to D46 record
questions answered on 2026-10-07 and 2026-10-08. The 2026-10-20 update re-read every row against the
14, 16 and 19 October answers and the consistency review: **D11, D26, D27, D32, D33, D38, D39, D40 and
D41 are now answered**; D2, D3, D6, D9, D12, D13, D16, D17, D20, D37, D42, D43 and D45 are superseded
or extended in whole or in part (each row says how, with the old reading struck through); D50 and D58
to D64 record the other answers the phases now build; and **D47 to D49 and D51 to D57** are new open
questions that gate an unbuilt phase, each with the default its phase builds. The phases they gate
build the answer, not a default. **Still open: D28 (in part), D29 to D31, D34 to D37, D47 to D49 and
D51 to D57.** Agents test themselves (see "Owner review" below): an open row's phase builds its
default, labels it provisional in the UI where the row says so, keeps it in one place so a different
answer is a small change, and logs it on the phase's "For the owner's review" list; the phase's drift
check confirms the gating answer first.

| # | Decision | Gates | Answer (or default while open) |
|---|---|---|---|
| D1 | AA fee basis and netting (OQ-02) | 16 | **Answered.** A monthly AA fee invoice per anaesthetist: fixed charges plus a charge per BCTI (for example $500 + $5 x 40), from a settings page (US-10.3.3), raised by a monthly run. The payable equals the receivable, and the fee is always a separate invoice, never netted. What the per-invoice charge counts is OQ-60, still open: build its recommendation (each BCTI once, against the anaesthetist who did it) with Greg's 2026-10-02 view (only paid invoices count), both provisional inside one pure function. The count reads one BCTI per receivable invoice, which is provisional: the catalogue's "one per procedure" is unresolved (see Sequencing rules). The weekly payment cycle (US-10.2.7, OQ-47 Proposed) is 39a's. When the monthly run happens (month end or the 20th) is OQ-112, open since 2026-10-20; 16 is built and no unbuilt phase depends on it |
| D2 | Insurer and funding source: on the Booking or the Patient (OQ-55) | 20, 21 | **Superseded 2026-10-08** by OQ-55's update and OQ-93: ~~Neither. `Procedure.insurerId` goes and nothing replaces it; no per-Booking override either (D17)~~. **Extended 2026-10-16** (OQ-55; OQ-93 answered in part): the Booking holds the insurer and the insurance approval number, taken from the source data and recorded by the office (US-11.4.3, built in 21); `Procedure.insurerId` still goes as a route (20). The Contract, not the insurance, decides who is billed. The parts still open are D28 |
| D3 | Ranged base codes: drop the published-range bound (RV-10, OQ-56) | 19, 19a, 20 | **Answered.** The anaesthetist may enter any base units. An out-of-range entry is accepted and raises an after-procedure warning for the office (15a's routine). No hard bound (the v6 design keeps it). **Superseded 2026-10-16** (the base-unit source) by OQ-88 and OQ-62's updates: ~~the starting base units resolve from the Contract line, then the procedure's own figure, then its RVG group~~ the starting base units come from the Contract line where the line states them, else the RVG group, and from then on are the Procedure's own value (19a; there is no procedure layer). How a range is held is OQ-101 (D35) |
| D4 | Child as billable party: block or warn (OQ-54) | 21 | **Answered.** A mild, clearable warning on the to-do list only. No block. **Superseded 2026-10-08** (wording) by US-11.2.4 and OQ-54's update: ~~a child who is the billable party~~ the child is the **payer on the Booking** (prefilled from the patient, editable by the office or the anaesthetist to a guardian); the warning prompts a check of the guardian's details, and there is none when a guardian or an organisation pays |
| D5 | Hard prepayment completion gate (OQ-57) | 15a, 27 | **Answered.** No block; a clear warning in both apps. 15a removed the gate and its audited override (session 1, built); 27 strengthens the warning as the procedure date nears |
| D6 | Who raises the prepayment invoice, and when (OQ-58) | 27, 27a | **Answered**, then **superseded 2026-10-08** (the amount) and **2026-10-16 and 2026-10-19** (the trigger and the timing) by OQ-25, OQ-76, OQ-80 and US-06.3.1: ~~the system generates it at setup when a Procedure matches the anaesthetist's prepaid list, creating the ledger pair and the draft Xero pair, and holds it until an admin approves and sends it~~. New reading: the office picking a Contract flagged prepaid starts the prepayment (D64); the amount is that Contract line's price, in full (D27); the invoice is generated when an admin approves it on the screen where outgoing invoices are approved, creating its pair (a receivable from the payer on the Booking and a payable to the prepay holding account) and the draft Xero pair, and is then sent with a standard letter (41); a later submit does not invoice it again; after the procedure nothing is invoiced or credited automatically (41) |
| D7 | Can an anaesthetist hand a List on without office confirmation (OQ-39)? | 32, 32a | **Answered.** Yes. The anaesthetist returns their own List to the office (it becomes a Draft List) or moves it into a colleague's free session, with no acceptance and no office confirmation. Who is told is answered too (D15). A single Booking can be moved as well (US-01.4.7, 32a). Since 2026-10-07 the anaesthetist sees no preference prompt on their own move (D44). Since 2026-10-19 a single Booking moves only to a colleague free in that Slot, as a new List (OQ-85, D61) |
| D8 | Receivables ageing and an "Overdue" view (RV-35, OQ-59) | 38 | **Answered.** A flat outstanding list, oldest first, with no buckets, no age chips and no Overdue view |
| D9 | When a List leaves the anaesthetist's main view (OQ-31) | 38a | **Answered 2026-10-07** (OQ-31): ~~Open. Default: they stay, shown as "completed, unbilled" and then "billed"~~; **changed 2026-10-16** (OQ-31, OQ-26): ~~a List leaves the main view once the office has finalised it and sent it to invoicing; invoiced work is found by archive or search~~. A List leaves the anaesthetist's main view once it is AUTHORISED (not at submit, not when billed, not on payment), and its invoices show in outstanding balances straight away (19 October); until then a submitted List stays visible, less prominent, and editable (D63). Earlier work is found by search on patient name, NHI or date, with no calendar archive (US-07.4.1, US-07.4.2, US-03.1.6, US-03.1.7). 38a builds it, now before the Contracts track |
| D10 | How an additional invoice is priced (OQ-45) | 38b | **Answered.** Free-form lines (description, quantity, amount), with no Contract pricing or unit rules. Its other details are answered too (D22). Since 2026-10-07 the anaesthetist can raise one on their own Procedure too, through the same review step (US-08.6.3). Since 2026-10-16 other billing lines merge into events too (D13) |
| D11 | Can a Booking without an NHI be created (OQ-49)? | 33, 40, 40a | **Answered 2026-10-16 and 2026-10-19** (OQ-49, with Donald's typed answer): ~~Open, leaning to a mandatory NHI. Default kept: yes, flagged as provisional and on the problem list; its List cannot be authorised until the NHI is added~~. The NHI is mandatory, with no blank and no pending state: a Booking cannot be saved without one, and an incoming booking without one waits on the matching screen's unmatched queue, creating no Booking or patient, until the office adds the NHI. 33 parks such rows; 40 makes the NHI required on every form, removes the provisional patient and "NHI pending", and builds the office's view of rows waiting for an NHI; there is no authorise guard |
| D12 | Where base units live, and how a procedure is picked (OQ-62) | 19, 19a, 20 | **Superseded 2026-10-08** (~~one or two default RVG Contracts per procedure; one procedure master~~) and **superseded again 2026-10-16** by OQ-88 (answered, D39) and OQ-62's update: ~~two levels, RVG groups and a curated procedure list with a general procedure per group; a two-tab picker (Procedures, RVG codes)~~. New reading: the RVG groups are the one master list (a hidden key, so the same code can sit on several rows with different base units); there is no procedure list, no general procedure and no picker tabs; the procedure on a Booking is the text received; the RVG code on a Procedure is optional, picked by type-ahead showing code, description and base units, and is the anaesthetist's to set (19, 20) |
| D13 | How pre-op and post-op events are modelled (OQ-63) | 38b, 39b | **Answered.** "Event" is the one name for everything recorded against a Procedure after setup: pre-op, post-op, additional invoices and credits. Its own element and its own invoice line; an admin can add one; an invoice tick and a "same as" billable-party tick. Recorded before the Procedure's invoice is approved it travels with that invoice, after it it is invoiced in the next run; one standard review step, no separate approval. **Extended 2026-10-16**: other billing lines merge into events (US-03.3.6 Retired); a billing event is a free-form charge or a credit on the Procedure (US-03.7.2); events can be added at any time, before invoicing too. 39b adds them and removes the BillingLine entity |
| D14 | Logical model of days, Slots and Lists (OQ-64) | 15b, 28 to 32 | **Answered.** A Slot is a status container a List goes into; every Slot is stored across the horizon (four months in current practice, configurable); statuses are a user-maintained list (fixed ID, editable label and colour), starting from free, on holiday and unavailable; "slot" is never said in the UI; marking unavailable a Slot that holds a List offers return to the office (a Draft List) or assign to a colleague. The room also settled OQ-81 parts 1 and 2 (the calendar is painted before recurring bookings; a recurring booking on an unavailable Slot becomes a Draft List); part 3, short-notice sickness, is open. Since 2026-10-07 a List's states are DRAFT (a Draft List), ACTIVE, SUBMITTED and AUTHORISED (EP-07): 15b renames today's DRAFT to ACTIVE and 31 adds DRAFT. OQ-81 part 3 was answered 2026-10-19 (D59): unavailability never leaves a List in place, and the conflict flag covers hospital closures only (32b) |
| D15 | Who is told when an anaesthetist moves their own List (OQ-65) | 32, 35 | **Answered.** A new shared notification pool in the Admin App, one for the whole team and separate from the to-do list; the move posts to it, the office sends the cover-change email from the on-demand button, and the colleague sees the List with a notice. Vanessa agreed the shared pool on 2026-10-07. What else posts, and expiry, are OQ-79. What posts to the pool and how notices end was answered 2026-10-19 (OQ-79, D58; 32b) |
| D16 | Contract identifiers and finding Contracts (OQ-66) | 18, 20 | **Superseded 2026-10-08** (~~the picker filters by procedure then hospital and always offers the default RVG Contract~~) and **superseded again 2026-10-16** by OQ-66's update and OQ-98 (answered, D32): ~~the Contracts with a line for the procedure, in one list under holder headings; from the RVG codes tab, the lines across the group~~. New reading: the picker lists Contracts, not lines: No contract (RVG) first, then the hospital's Contracts, then surgeons' or rooms' and anaesthetists' arrangements, valid on the procedure date and whose holder fits the Booking (the List's hospital, the surgeon or rooms, the Booking's own anaesthetist), with no test for a line; picking a Contract leads to its lines; an RVG code finds the lines whose default RVG code matches; one composite search on AA code, holder codes and names. The short AA code stays (US-04.1.4). The Contract catalogue filters by active or all and by holder. Anaesthetists see only their own price-list Contracts |
| D17 | Who a Contract belongs to, and who pays (OQ-67) | 18, 21 | **Superseded 2026-10-08** (~~no per-Booking override; picking a default Contract asks for the payer's name and email~~) and **settled 2026-10-16** (OQ-67, the v6 design; OQ-78 confirmed): the Contract decides who is billed: its holder's billable party when the holder is billed (it pays AA itself), otherwise the payer named on the Booking. Holders are insurers, hospitals, surgeons or surgeons' rooms, and anaesthetists; AA holds No contract (RVG), the one default in the whole system, and is never billed. ~~First party and third party~~ are dropped: a Contract's behaviour comes from its settings (D50, D64). Every Booking names a payer, prefilled from the patient and editable to a guardian |
| D18 | Contract split basis (OQ-68) | 22 | **Superseded 2026-10-05** by US-04.2.12 (Retired) and US-08.2.3: ~~each share a typed $ or %, set on the Booking, defaulting from the Contract~~. New reading: splitting is a user action on the Booking, a Split button on the Procedure's Contract line, each share typed in $ or %, with no setting on the Contract and no default from it |
| D19 | Update email: a prompt or a button (OQ-69) | 35 | **Answered.** An on-demand button on any Booking; the admin picks one or more changes from the change history; no prompt after saving or after a cover change. Templates per kind of change (US-02.3.4). **OQ-82 answered 2026-10-07:** emails stay manual in the first release, for admin and anaesthetist changes alike; sending them automatically is Future (US-02.3.5) |
| D20 | A prepaid Booking moved to another anaesthetist (OQ-70) | 32a, 41 | **Superseded 2026-10-08** (~~the move re-checks the prepayment and only the payable half of the draft pair is updated~~) and **superseded again 2026-10-19** by OQ-80 (D38), which marks OQ-70's answer superseded: ~~the anaesthetist who does it keeps the agreed amount; whether the payable is updated on a move is OQ-80 (repoint only the payee)~~. A prepaid Booking's payable is the prepay holding account, so moving its List or the Booking changes nothing in the ledger, nothing is repointed or recalculated, and the second pair pays whoever did the List (27a); a payable that is not prepaid follows the Booking to whoever does it (US-01.4.6, 32a). The office may send the patient an informational email (US-06.5.4, 41) |
| D21 | A negative invoice with no later payment (OQ-71) | 39a | **Answered.** Handled outside the system: nothing is built (39a's carry-forward and recovery invoice go) |
| D22 | Additional invoice details (OQ-72) | 38b, 39 | **Answered.** "Desc" is description; an additional invoice can go to any billable party; a credit note option credits the original to any party, then new additional invoices are raised; a rebill can start from a copy of the original's lines (US-08.6.6). **OQ-77 parts 1 and 2 answered 2026-10-07:** the rebuilt invoices must equal the credited invoice (against the old recommendation), with the amounts split freely; the credit reverses the linked payable. Part 3 is open (D41). Part 3 was answered 2026-10-19 (D41) |
| D23 | Prepayment when the patient is not the billable party (OQ-73) | 27 | **Answered.** Only where the payer on the Booking is a person paying for the patient (the patient or, for example, a guardian), never an organisation. **Extended 2026-10-16**: in the typical prepay Contract (an anaesthetist's price list) the holder is not billed, so the payer on the Booking prepays |
| D24 | Patient balance warning threshold (OQ-74) | 40 | **Answered.** The days count from the invoice date; a credit balance is a mild warning. The consistency review (2026-10-20) restated it: a mild alert under the threshold, a strong one over it, a mild one for a credit balance |
| D25 | RVG time rule (OQ-75) | 19a | **Answered.** A part interval is always rounded up under the RVG tiers (15 minutes for the first two hours, then 10). **Superseded in part 2026-10-08:** ~~it feeds the prepayment estimate (27)~~; there is no estimate (US-06.2.4 Retired), so the rule applies to recorded time units only, held as data in 19a |
| D26 | Does the RVG default multi-procedure rule apply (OQ-90) | 23 | **Answered 2026-10-19** (OQ-90): ~~Open. Default (its recommendation), one switchable pure function~~. Keep the RVG default as the one system-wide rule for calculated Procedures: base units on the primary only, time units on every Procedure from its own start and finish times, modifier units on the primary while the Booking total is four or fewer, else split as evenly as possible with the remainder to the primary (7 over 3 is 3, 2, 2). 23 builds it with no provisional label and no switch: `MULTI_PROCEDURE_RULE_APPLIES` and its "price each Procedure alone" branch are not built (Greg: "not correct"). No per-Contract rules. Which Procedure is primary is not settled (Vanessa's practice takes the most expensive): the primary is whichever is set, the first by default |
| D27 | Prepaid procedure with no price on the anaesthetist's own Contract (OQ-92) | 27 | **Answered 2026-10-16** (OQ-92): no longer arises: the office picks a Contract flagged prepaid, and its line always carries the price. ~~Default: an office warning through 15a's routine, and the prepayment invoice is held until the office adds a price~~. No warning rule is built |
| D28 | Insurance on the Booking (OQ-93) | 21 | **Answered in part 2026-10-16** (OQ-93, US-11.4.3): the insurer and the insurance approval number are stored on the Booking, from the source data, recorded by the office; a blank insurer is fine when the patient pays; an insured Booking with no approval number sends the office to ring the rooms; the anaesthetist can complete without it; insurance never decides who is billed. ~~Default: a simple insurance indication that suggests the insurer's Contracts in the picker~~. **Open:** whether insurance narrows the Contract list, whether a warning is the right response, and whether Greg's "approval number" is the design's insurance acceptance reference. Default: the insurer does not narrow the list (v6 no longer lists it as context); a soft, clearable review warning when an insurer is named but no insurer Contract is chosen; one approval-number field |
| D29 | Modifiers: the age bands, and no ASA pre-fill (OQ-95) | 19b | **Open, narrowed 2026-10-20** (OQ-95; Donald's typed decision): no modifier is locked. The age modifier (A1, A2) and any modifier a code's base units include are pre-applied and shown selected (an included one at 0 units), and the anaesthetist can remove them; nothing pre-fills from ASA or a procedure default. Whether anything is pre-applied at all is Ben's open doubt. Default (its recommendation): the patient's age on the procedure date, inclusive lower bounds as printed, no age modifier on the age-split base codes H6b and P2; keep pre-application in one switchable rule |
| D30 | Can the price be changed on a prepaid procedure (OQ-96) | 27, 41 | **Open, wider since 2026-10-19:** the v6 design makes the prepaid amount an editable fixed price (raised, an additional invoice; lowered, a refund), the directors said by hand only, and the holding account, a change of anaesthetist and an override may now meet on one procedure. Default (its recommendation): the price on a prepaid Procedure stays the prepaid amount and is locked (the Contract's editable setting does not apply there); any difference is an additional invoice or a credit note raised by hand (41) |
| D31 | Credit note for part of a prepayment (OQ-97) | 41 | **Open.** Default: a credit note for a stated part of a prepayment invoice is allowed, reversing the same amount of the linked payable (the holding account's, or the anaesthetist's after the second pair); credit in full and rebill (39) stays the route for corrections. v6 invokes a refund for a lowered prepaid price without saying how; the directors' rule stands until OQ-96 |
| D32 | Plain RVG Contracts of a holder (OQ-98) | 18, 19a, 20 | **Answered 2026-10-16** (OQ-98): a Contract may hold no lines, and selection offers every Contract valid on the date that fits the Booking's context, with no test for a line. ~~Default: a holder's plain RVG Contract has no lines and applies to every procedure at RVG pricing~~. A Contract with no lines prices at RVG (the anaesthetist's unit value, or the rate or discount set on the Procedure). 18 allows it, 19a seeds them, 20 offers them |
| D33 | Booking set up without a matched procedure (OQ-99) | 20, 21, 33 | **Answered 2026-10-16** (OQ-99): there is no procedure to match; at setup the office identifies who pays (holder, then Contract, then line), and the RVG code is optional and the anaesthetist's. ~~Default: the office may leave the procedure blank at setup or set a group's general procedure; a procedure is required before the anaesthetist can mark the Booking complete~~. Completion needs a Contract, not a procedure or an RVG code (US-03.6.1, 21) |
| D34 | Is a Contract schedule upload needed for the first release (OQ-100) | 25, 42 | **Open** (Greg's position moved: header and lines, a staged review, Alter or Replace). Default (its recommendation): the first release is a developer-run seed load plus office screens, every Contract edit staged and reviewed on 25's dashboard as the second-person check on screen; no in-app Contract schedule upload (US-04.2.13 is Future Work) |
| D35 | How an RVG base unit range is held (OQ-101) | 19, 20 | **Open** (v6 holds one required base-units figure per group, and the same code can appear on more than one row). Default (its recommendation): each RVG group row holds a starting figure and, where the guide prints one, the published range; the anaesthetist starts from the figure and may pick any value, with an out-of-range warning for the office (D3) |
| D36 | Names for preference lists and priority tiers (OQ-102) | 17, 32b | **Open.** Default: "Not preferred" and "Preferred" for the pairings, and plain tier labels, Tier 1 to Tier 4 with Tier 4 the default, until AA picks names; one label set. 2026-10-19: Ben's ranking (directors, shareholders, non-shareholders) is the order available colleagues are listed in, ordering only; 32b adds the preferred pairing to the office's order |
| D37 | Which description goes on the invoice (OQ-103) | 19a, 20a, 22 | **Open, retitled 2026-10-16** (was "Invoice wording for a group's general procedure"): the general procedure falls away with the procedure master (D12), so ~~each general procedure is named by section, tier and code, and office review flags a Procedure left on one~~ is withdrawn. Agreed in principle: each Procedure has an invoice description (US-08.4.6), copied from the Contract line's description where there is one, else from the Booking's description. Default (its recommendation): that, editable by the office at review, the received descriptions untouched; for an RVG-only pick it starts as the Booking's description, never a group name such as "H1 minor procedures" |
| D38 | When a prepayment's pair is created and amended (OQ-80) | 27, 27a, 32a, 36, 41 | **Answered 2026-10-19** (OQ-80, superseding OQ-70): the pair is created when an admin approves the prepayment invoice; its other side is a prepay holding account, kept like an anaesthetist's account; a move changes nothing in the ledger; a second pair pays whoever did the List. ~~Default: created when the prepayment invoice is generated; on a move only the payable's payee is repointed (41)~~. 27 creates the pair at approval with the holding account as payee; 27a builds the account and the second pair at authorisation (the catalogue's trigger; Greg said "confirmed and submitted", labelled to confirm); no phase builds a payee repoint |
| D39 | RVG code master and procedure master, one list or two (OQ-88) | 19 | **Answered 2026-10-16** (OQ-88): one list, the RVG groups; the procedure master goes (US-05.1.6 Retired). ~~Overtaken in part: two levels, a general procedure per group, two tabs. Open: where the system code sits~~. Each row has a hidden key; whether a human-readable system code is added (US-05.1.1 note) is not settled: default none beyond the hidden id, with the RVG code and description searchable |
| D40 | Contract fixed rate, fixed price and line extras (OQ-89) | 19a, 24 | **Answered 2026-10-19** (OQ-89): no time band, add-on flag or quantity rule on Contract lines; the fixed rate is a unit rate in place of the anaesthetist's for the whole Procedure; whether the anaesthetist may change a Contract's price, rate or discount, a discount added on top included, is a flag on each Contract (OQ-107, D50). ~~Open: the time band, and a discount on top of a fixed discount. Default: no time band, no adjustment on a fixed-discount line~~ |
| D41 | Splitting a combined invoice before it is sent (OQ-77 part 3) | 39 | **Answered 2026-10-19** (OQ-77): before the combined invoice is sent, a split is a normal admin edit; after it is sent, it is the credit and rebill (D22). ~~Default: a split asked for before sending uses the same credit and rebill once the invoice is raised~~ |
| D42 | Who maintains the anaesthetists' own price-list Contracts (OQ-91) | 19a, 27 | **Answered 2026-10-08, extended 2026-10-16.** The anaesthetist tells the office which procedures they want prepaid and at what price; the office creates and maintains their price-list Contract (flagged prepaid where wanted; whether they may change its prices is the Contract's setting, D50); anaesthetists never create or edit Contracts in the app (US-04.2.14). How the lists reach the office is open |
| D43 | Do the supine ('a') Neurosurgery and Spine codes include P1 (OQ-94) | 19b | **Answered 2026-10-08; superseded in part 2026-10-20** (Donald): P1 is included in the base units of every Neurosurgery code H7A to H9b and every Spine code S1 to S10 and shows selected at 0 units (from the included-modifiers CSV, AR-34), but ~~it cannot be unselected~~ it is not locked: the anaesthetist can turn it off and cannot add it a second time (US-05.1.4) |
| D44 | What the blacklist warning shows an anaesthetist (OQ-43) | 17, 31, 32, 32a | **Answered 2026-10-07.** Pairing preferences are private and two-way, admin only (not preferred and preferred, US-13.6.3, US-13.6.4); admin get a soft warning when assigning or moving a List, never a block; there is no warning at all when an anaesthetist hands on their own List (US-01.4.5); the name "blacklist" goes (OQ-102, D36). 2026-10-16: Donald said the preference lists may also belong on the profile; nothing settled, they stay admin-only. A single-Booking move shows no pairing warning (OQ-85, D61) |
| D45 | Which date decides the price in force (OQ-48) | 18, 25 | **Answered 2026-10-07, extended 2026-10-16.** The procedure date picks the Contract version. Every change, a correction or a renewal, creates a new version from a date the office chooses, never past and never backdated; only one future-dated version at a time, correctable or withdrawable until it starts; nothing deleted (US-04.2.10). 18 builds the version records, 25 the staged submit, its checks and the relink |
| D46 | Should anaesthetists browse and pull Draft Lists (OQ-86) | 31 | **Answered 2026-10-07: no.** Assigning Draft Lists is an office job; anaesthetists never browse or claim them |
| D47 | Prepaid price when the Contract changes before the procedure (OQ-104) | 25, 27 | **Open.** Default (its recommendation; Donald 2026-10-20: the build assumes it): a prepaid Procedure keeps the price on its issued prepayment invoice; a new Contract version does not relink it, and the version's review dashboard shows it to the office. In one place, so "follow the price on the procedure date" is a small change |
| D48 | How a surgeon's fixed-price arrangement is found for a Booking (OQ-105) | 18, 19a, 20 | **Open.** Default (its recommendation): a Contract held by the surgeon's rooms, linked to the surgeons it covers, offered on their Bookings after the hospital's Contracts, picked by the office |
| D49 | Routine procedures as lines on No contract (RVG) (OQ-106) | 19a, 20 | **Open.** Default (its recommendation): not in the first release; No contract (RVG) has no lines |
| D50 | Can the anaesthetist depart from a fixed price (OQ-107, with OQ-16) | 18, 24 | **Answered 2026-10-19: no.** A flag on each Contract, set by AA, decides whether the anaesthetist may change its price, rate or discount (typically yes on Contracts priced from RVG units, no on a hospital's fixed price or a surgeon's fixed fee, where no discount may be added either); no reason is asked. The office can change any price at any time, as the last person to touch it, and the last change stands, neither side outranking the other (OQ-16). Supersedes the 2026-10-08 reading that only No contract (RVG) and the anaesthetist's own Contracts are adjustable |
| D51 | Which source starts a booking, and which integration comes first (OQ-108) | 33, 34 | **Open.** Default (Donald, 2026-10-20): the hospital download stays the priority intake pathway; surgeon PDF ingest stays Future Work |
| D52 | Are St George's and Southern Cross synced in the first release (OQ-109) | 34 | **Open.** Default: build the catalogue as written: rows from the two hospitals arrive on the matching screen with nothing applied until the office decides, delivered in the demo by an action (no schedule, sync button or last-synced time) |
| D53 | Paying anaesthetists through Xero or from the new system (OQ-111) | 37, 39a | **Open.** Already settled: Xero is not the ledger; trust payments are made from the new system, with bank details on the profile. Default: build US-09.2.4 as written (the ACCPAY paid in Xero's payables run, the engine detecting it and recording the disbursement), with 39a's weekly run recording what is released; the detection in one place, so "paid from the new system" is a small change |
| D54 | Anaesthetist moving their own List or a Booking: are colleagues ordered by tier (OQ-113) | 32a, 32b | **Open.** Default: as US-01.3.6 and US-01.4.5 say: by availability alone in the anaesthetist apps, with no tier or preference order; the office's finders order by tier, then preferred pairing |
| D55 | What the insurer's "accepts direct claims" flag is for (OQ-114) | 18, 21, 42 | **Open.** Default: it pre-fills the "is billed" setting when the office creates the insurer's contract holder, and does nothing else: it creates no Contract, and the holder's setting decides who is billed |
| D56 | Cancelled prepayment refund: from the system or through Xero (OQ-115) | 41 | **Open.** Default: as US-06.5.1 and US-06.5.2 say: the refund is paid out from the system and recorded, the holding-account pair reversed by a credit linked to the prepayment invoice; Xero mirrors it |
| D57 | Mixed Bookings: does the final invoice deduct a prepayment (OQ-116) | 27, 41 | **Open.** Default: keep US-08.2.2's netting, a visible deduction line on a Booking that mixes prepaid and other Procedures; a Booking that is all prepaid has nothing left to bill |
| D58 | What posts to the notification pool, and how notices end (OQ-79) | 32b, 21 | **Answered 2026-10-19.** Notices are active or resolved: any admin ticks one to resolve it, which hides it for everyone (who and when are kept; a "show resolved" filter brings it back); nothing expires; the same tick clears a to-do. Sources: an anaesthetist's List move, an "alert the office" with a note on a List or Booking (US-03.6.3), and, optionally, a single-Booking move. Supersedes 32's provisional keep-every-notice pool; 32b builds it, 21 shows the alerts at review |
| D59 | Short-notice sickness: Draft List or conflict (OQ-81) | 32b | **Answered 2026-10-19.** Unavailability, short-notice sickness included, never leaves a List in place: marking unavailable a Slot that holds a List forces a transfer or a return to the office there and then, for the office as for the anaesthetist; the conflict flag covers hospital closures only (US-01.5.2, US-01.5.4, US-01.5.5). Supersedes 30's office-recorded sickness keeping its conflict; 32b builds it. The office does not assign a Draft List onto an unavailable session until it is made available with the anaesthetist's agreement (US-01.6.3) |
| D60 | What a Slot shows after its List is moved away (OQ-84) | 32b | **Answered 2026-10-19.** Whoever moves a List, the anaesthetist or the office, is asked whether the vacated Slot becomes free or unavailable (US-01.4.1, US-01.4.3, US-01.5.5). 28 and 32 built it as a provisional default; 32b drops the provisional label and asks on every path |
| D61 | How an anaesthetist moves a single Booking (OQ-85) | 32a | **Answered 2026-10-19.** The receiver is found by type-ahead or the list of free colleagues; a Booking goes only to a colleague free in that Slot, creating a List there (never into an existing List; two Lists in a Slot are not supported); notifying the office or drafting the update email is optional; no pairing warning. Supersedes 32a's find-or-create placement and its automatic pool notice |
| D62 | Automated reschedule from an integration (OQ-87) | 33 | **Answered 2026-10-19.** Lists never move day: a Booking moved to another day is a cancellation plus a new Booking; detecting removals from re-sent snapshots is Future Work (US-02.2.3). Supersedes the matching screen's "Reschedule" change type and the S13 cross-List move |
| D63 | When the anaesthetist's edit window ends (OQ-26, OQ-17) | 20, 38a | **Answered 2026-10-16.** The anaesthetist can see and change a submitted List, its Contract included, until the office authorises it; changes are audited and seen at review; the last change stands, neither side outranking the other; AUTHORISED stays immutable. Supersedes binding convention 6's "only the office after submit" (RV-19); 38a builds it, and 20's Contract change uses it |
| D64 | Where prepaid is set (OQ-25) | 18, 26, 27 | **Answered 2026-10-16** (reversing Donald's earlier board answer): prepaid is a setting on the Contract, placed by the office; nothing about prepayment sits on the anaesthetist's profile (FT-06.1, US-06.1.1, US-06.1.2 and US-12.1.3 Retired), and the GST period goes too (US-12.1.2 Retired). 18 adds the setting, 27 starts prepayment from it, 26 is the profile without them |

## Tracks

```
Foundations   14 demo-trigger registry · 15 Card becomes Booking · 15a warnings & to-do list
              ─▶ 15b Copy and photo capture out, DRAFT becomes ACTIVE                     (all built)
Money fix     16 AA fee as a monthly invoice                                               (built)
Schedule      28 Slot/List split ─▶ 29 availability ─▶ 30 conflicts ─▶ 31 Draft Lists
              ─▶ 32 own List moves & notification pool                                     (built)
              ─▶ 32a single-Booking moves ─▶ 32b unavailability, notices that resolve, alert the office
List approval 38a edit until AUTHORISED, main view & search                      (after 31; before 20)
Contracts     17 surgeons, rooms, preferences & tiers (built) ─▶ 18 holders, settings & dated Contracts
              ─▶ 19 RVG groups & type-ahead ─▶ 19a Contract lines & starting values ─▶ 19b modifiers
              ─▶ 20 one Contract per Procedure ─▶ 20a descriptions & invoice description
              ─▶ 21 payer, insurer & completeness ─▶ 22 invoice presentation & split
              ─▶ 23 primary & multi-procedure rule ─▶ 24 prices on the Procedure & editable flag
              ─▶ 25 staged Contract changes & AUTHORISED lock     (19 and 21 after 15a; 20 after 38a)
Profile       26 anaesthetist profile & bank details                     (needs nothing unbuilt)
Prepayment    27 prepayment lifecycle ─▶ 27a prepay holding account & second pair       (after 25)
Intake        33 matching screen ─▶ 34 sync & S1 rebuild ─▶ 35 explicit save & update email
                                                                  (33 after 20a; 35 after 32)
Money         36 internal ledger ─▶ 37 Xero resilience & monitor │ 38 web accounts & monthly GST report
              │ 38b events & additional invoices ─▶ 39 credit notes & rebill
              ─▶ 39a weekly payment runs                                        (after 37, 39)
Capture       38b ─▶ 39b pre-op, post-op & billing events
Patients      40 mandatory NHI, balance warning, patient view ─▶ 40a NHI lookup & identity
Late          41 prepayment letters, settlement by hand & refunds ─ 42 reference data & loads
              ─ 43 scale & privacy ─ 43a sign-in & ease of use
Demo          44 demo guide rewrite & final sweep
```

Run order from here: 32a, 32b, 38a, then 18 to 25, 26, 27, 27a, then Intake (33 to 35) and Money
(36 on), with the remaining phases as their dependencies allow.

## Phases

| # | Phase | Delivers | Depends on | Covers (gaps / DM / RV) |
|---|-------|----------|------------|---:|
| 14 | [Screen-contextual demo triggers](phases/phase-14-demo-trigger-registry.md) | **Built.** A shared, route-scoped trigger registry and a context hook in `src/shared`. A "Demo actions" menu in the harness bar and a PWA demo-actions sheet. Every existing Control Panel trigger re-homed to its screen; the Control Panel becomes the index. "Office authorises this List" on the PWA. Interim Future-scope badges on the HL7/FHIR tooling. First new trigger: "Simulate sign-in attempts". FT-13.5's remaining gaps close with 39 (the audit carve-out) and 43a (sign-in) | none | 1 / 0 / 0 |
| 15 | [Card becomes Booking](phases/phase-15-booking-rename.md) | **Built.** Card renamed to Booking across the model, ids, audit, seed, routes, registry and copy. Adds List-level attachments (now Retired: 20a removes them, RV-01), an optional Booking source, and Copy as a skeleton-only new Booking (Retired: 15b removed it) | none | 1 / 2 / 0 |
| 15a | [Warnings and the to-do list](phases/phase-15a-warnings-and-to-do-list.md) | **Built.** One pure warning routine with Warning records on the Booking, the prepayment gate replaced by a warning (D5). A to-do list on the Admin dashboard with Clear, a warning triangle on Bookings in all three apps, the warning visible on opening a Booking, the Day view outline down to the Booking, and no confirm step at submit. Later phases plug in their rules (19, 21, 27, 40) | 14, 15 | 4 / 1 / 0 |
| 15b | [Copy and photo capture out, and DRAFT becomes ACTIVE](phases/phase-15b-copy-and-photo-removal.md) | **Built.** Copy a Booking removed from all three apps, the store, the seed and the guide. Photo capture out of the Add a booking chooser, kept only as a badged Future-scope demo action. The List state the prototype called DRAFT renamed ACTIVE. (Its RV ids were renumbered away: see Sequencing rules) | 15a | 0 / 0 / 0 |
| 16 | [AA fee as its own monthly invoice](phases/phase-16-aa-fee-invoice.md) | **Built.** The payable equals the receivable, and a part payment releases exactly what was received. AA fee settings and a monthly run raising one AA-FEE invoice per anaesthetist (fixed items plus a per-BCTI charge, D1, counted by one pure function), shown in Admin and web Accounts. Xero pairs carry the invoice number and reference, and Xero holds no patient names. US-09.1.1's prepayment payee (the holding account) closes with 27 and 27a | 15a, 15b | 8 / 1 / 0 |
| 17 | [Surgeons, rooms, pairing preferences and priority tiers](phases/phase-17-surgeons-rooms-blacklist.md) | **Built.** Surgeon profile with one HPI CPN field, surgeons' rooms with contacts, surgeon groups and a hospital contact email. Private two-way pairing preferences, admin only (D44), and an admin-only priority tier per anaesthetist (D36), on one shared helper every office pairing path uses. Follow-ups: bank details (DM-32) in 26, preferred pairing in the office's order (US-13.6.4) in 32b | 14, 15 | 7 / 2 / 0 |
| 18 | [Contract holders, settings and dated Contracts](phases/phase-18-contract-model.md) | A contract-holder master (insurer, hospital, surgeon or rooms, anaesthetist; "is billed" with a billable party; a practitioner link), with AA holding No contract (RVG). Contracts with settings (editable, prepaid), no kinds, as dated version records never backdated or deleted, with a short AA code, composite search and active and holder filters, office-only. A Contract may have no lines. One No contract (RVG) replacing the default Type 1s; the ACC review flag gone | 17 | 6 / 3 / 3 |
| 19 | [RVG groups and the RVG code type-ahead](phases/phase-19-rvg-and-procedure-masters.md) | RVG groups as the one master list (hidden key, the same code on several rows, anatomy heading, base and modifier units, starting figure and range) plus AA's own, office-maintained and audited, with no procedure list. An optional RVG code picked by type-ahead (code, description, base units) on mobile, web and Admin. Any base-unit value accepted, with an after-procedure office warning when out of range | 15a, 18 | 3 / 1 / 1 |
| 19a | [Contract lines and starting values](phases/phase-19a-default-rvg-contracts.md) | Standalone Contract lines (line key, holder reference code, description, default RVG code, fixed price, rate, discount, units; no time band, no quantity rule) replacing ContractPrice and the Type 2 terms, with no ordinal key. Combinations as lines of their own. The anaesthetists' price-list Contracts, kept by the office and flagged prepaid where wanted. Starting values filled from the line or the RVG group onto the Procedure, reset on a Contract change. RVG time tiers held as data | 18, 19 | 5 / 2 / 1 |
| 19b | [Modifiers: the RVG table, pre-applied age and included modifiers, explanations](phases/phase-19b-modifiers.md) | The modifier master seeded from the NZSA RVG 2021 table plus AA's own. Modifiers as itemised records on the Procedure, each claimed one with a short explanation. Age (A1, A2) and the included P1 on every Neurosurgery and Spine code pre-applied and removable, never locked. The ASA card and its seeding and the absorbed-modifier refusals gone | 19a | 5 / 1 / 3 |
| 20 | [One Contract per Procedure](phases/phase-20-one-contract-per-procedure.md) | Billing route, payment category (everywhere) and the Procedure's insurer as a route removed. Exactly one Contract (and line, where it has lines) per Procedure, mandatory at setup, with a "Needs a Contract" list and no hospital default. A picker of Contracts (No contract (RVG) first, the hospital's, then surgeons' and anaesthetists'), then their lines, with composite search and an RVG-code reverse lookup. The anaesthetist may change the Contract, line and RVG code until AUTHORISED, flagged at review | 19a, 19b, 38a | 10 / 1 / 1 |
| 20a | [Booking descriptions, the invoice description and the Contract on each Procedure](phases/phase-20a-source-wording-and-procedure-stack.md) | Each Procedure keeps the rooms' and the hospital's descriptions exactly as received, never overwritten, and hand-entered text as source text. An invoice description per Procedure, copied from the line or the Booking's description and editable by the office. Every booking screen shows the descriptions, the Contract (name, holder, who is invoiced, pricing basis with figure) and the RVG code where RVG-priced. Booking and List attachments removed. Demo wording seeded from AR-35 | 20 | 5 / 1 / 1 |
| 21 | [Payer, insurer and completeness](phases/phase-21-billable-party-and-required-inputs.md) | A payer on every Booking, prefilled from the patient and editable to a guardian; who is billed decided by the Contract's holder or that payer; the guardian override gone. The insurer and approval number on the Booking (office), a review warning and a child-payer warning. Completion needing a Contract, times only where timed, and modifier explanations ("finish", not "handover"). Review shows the descriptions, Contract, RVG code, payer, insurer, references, alerts and late edits | 15a, 20a, 32b | 12 / 3 / 2 |
| 22 | [Invoice presentation, delivery and the split](phases/phase-22-invoice-presentation-and-delivery.md) | Invoices issued in the anaesthetist's name with AA as agent. Contract-driven layout (the holder's with the BTM breakdown), delivery and GST, prices held ex GST, each line printing the Procedure's invoice description. The run sends to email or portal. A Split button on a Procedure with typed $ or % shares replaces funderOverride. Provisional BCTI wording on the ACCPAY, one per receivable invoice | 21 | 7 / 1 / 1 |
| 23 | [Primary Procedure and the multi-procedure rule](phases/phase-23-primary-procedure-and-multi-procedure-rule.md) | Exactly one primary Procedure, with "Make primary" on every surface and the feed. The RVG default multi-procedure rule as the one system-wide rule (D26 answered): base on the primary only, time on every Procedure, the 3/2/2 modifier split, with no switch and no provisional label | 19b, 22 | 4 / 1 / 1 |
| 24 | [Prices on the Procedure, the editable flag, fixed rate and discount](phases/phase-24-anaesthetist-adjustment.md) | The price, rate and discount held on the Procedure: its price if held, else BTM x rate x (1 - discount), the discount its own invoice line, a no-charge invoice at $0, BTM optional on a fixed price, a submission refused when no price can be worked out. The anaesthetist changes them only where the Contract's editable flag allows; the office changes any; no reason, audited, flagged at review, last change stands. The rate x time line and Method 3 gate gone | 23 | 11 / 2 / 3 |
| 25 | [Contract versions, staged changes and the AUTHORISED lock](phases/phase-25-contract-lock-at-authorised.md) | Contract edits staged per Contract on a review dashboard (header diff, line counts, blocking errors, warnings) and submitted all or nothing as a new dated version, never backdated, one future version at a time, relinking un-invoiced Procedures by line key (a prepaid one keeps its price). A pricing snapshot per Procedure at authorise (Contract version and line, values, BTM, unit value, price, payer, payee) the engine prices from. Versions listed with their invoices; "Regenerate from locked data" | 19a, 22, 23, 24 | 9 / 2 / 1 |
| 26 | [Anaesthetist profile and bank details](phases/phase-26-prepaid-settings-and-profile.md) | The anaesthetist profile as the catalogue holds it: contact details, registration, HPI CPN, bank details held in the system and the unit value, visible to the anaesthetist on mobile and web and kept by the office. The GST period removed everywhere, the GST report left monthly. No prepaid settings (prepaid is a Contract setting) | 17 | 2 / 0 / 1 |
| 27 | [Prepayment lifecycle](phases/phase-27-prepayment-lifecycle.md) | Prepayment started by a Contract flagged prepaid, for a payer who is a person. The amount is that line's price, in full, shown to the anaesthetist. The invoice generated when an admin approves it, with its pair to the prepay holding account and the draft Xero pair, then sent. A prepaid Procedure keeps its price through Contract changes and is priced at it, locked, with nothing left to bill. Part-paid tracking, an escalating warning, and re-checks on a change of Procedures, Contract or payer, never on a move | 15a, 21, 25 | 10 / 1 / 1 |
| 27a | [Prepay holding account and the second pair](phases/phase-27a-prepay-holding-account.md) | The prepay holding account, kept like an anaesthetist's account, with its balance and entries in Admin; its payables never paid out before the List is authorised. At authorisation a second pair (with its draft Xero pair) moves each prepaid amount to the anaesthetist who did the List, so a moved prepaid Booking needs no change | 27 | 4 / 1 / 1 |
| 28 | [Slot and List split](phases/phase-28-slot-list-split.md) | **Built.** A Slot record for every active anaesthetist's session across a configurable horizon, free by default, holding availability and default times (D14). A List with its own id, created on assignment and shown in place of the status. Status independent of bookings in all three apps and the finders, the admin finder ordered by tier with not-preferred pairings apart. Reassign moves a List between Slots. Follow-ups: the finder's type-ahead search (32a) and preferred-pairing order (32b) | 15b, 17 | 8 / 2 / 0 |
| 29 | [Availability calendar and status master](phases/phase-29-availability-calendar.md) | **Built.** Availability kept from a calendar on mobile and web as the Slot's own status, with days off ahead, series and single-instance edits. Slot statuses a user-maintained master list with fixed IDs, editable labels and colours, separate from the List's state | 28 | 5 / 0 / 0 |
| 30 | [Conflicts, holidays and the conflict dashboard](phases/phase-30-conflicts-and-holidays.md) | **Built.** Conflicts with a List colour change and clearing, holidays edited and deleted, a cross-date conflict dashboard, recurring bookings (DM-53). Its availability conflict and office-recorded sickness conflict are superseded (D59): 32b removes them | 29 | 5 / 1 / 0 |
| 31 | [Draft Lists and the day dashboard](phases/phase-31-draft-lists.md) | **Built.** The DRAFT state: Draft Lists with hospital, surgeon, day and session required, holding Bookings, flagged with waiting time, assigned by the office only (D46) with the preference and tier helper. A recurring booking on an unavailable session becomes a Draft List. The Day dashboard shows Draft Lists and booking counts. Follow-up: no assignment onto an unavailable session (32b) | 17, 30 | 11 / 2 / 0 |
| 32 | [Anaesthetist moves their own List, and the notification pool](phases/phase-32-swap-requests.md) | **Built.** An anaesthetist returns their own List to the office or moves it into a colleague's free session, at once, with no preference warning, also when marking a booked session unavailable. Every move posts to a shared notification pool in the Admin App. Follow-ups (D58, D60): notices ticked resolved, alerts from a List or Booking and the vacated-session choice without its provisional label (32b) | 29, 31 | 6 / 2 / 0 |
| 32a | [Anaesthetist moves a single Booking](phases/phase-32a-single-booking-moves.md) | An anaesthetist moves a single Booking to a colleague free in that session, found by type-ahead or the free list, creating a List there (never into an existing List), with an optional office notice; the payable follows whoever does it, a prepaid one stays with the holding account. The type-ahead also lands in the office's finders. The office's single-Booking move kept to the same day, a day change being a cancellation and a new Booking | 32 | 3 / 1 / 1 |
| 32b | [Unavailability without conflicts, notices that resolve, and alerting the office](phases/phase-32b-unavailability-and-notices.md) | Unavailability never a conflict: marking a booked session unavailable, sickness included, forces a return or a hand-on for the office as for the anaesthetist, with the vacated-session choice everywhere; conflicts cover hospital closures only; no Draft List assigned onto an unavailable session. Notices active or resolved with a tick, a count and "show resolved". An "alert the office" with a note on a List or Booking. The office's finders ordered by tier, then preferred pairing | 32a | 2 / 1 / 2 |
| 33 | [Hospital download and the matching screen](phases/phase-33-hospital-matching-screen.md) | One theatre list a day per hospital lands on a review-and-merge screen, each row showing its text as received: match, create a Booking, a List or a Draft List, or reject, with field differences approved and nothing applied automatically. A day move arrives as a cancellation plus a new Booking. Rows with no NHI wait in the unmatched queue. Approved changes apply until the List is AUTHORISED. Created Bookings wait for the office to set their Contract | 20a, 31 | 7 / 1 / 1 |
| 34 | [Hospital sync and the S1 rebuild](phases/phase-34-hospital-sync-and-s1.md) | Sync from St George's and Southern Cross only, into the matching queue. The third live feed stopped. The HL7/FHIR simulator and monitor, and surgeon PDF ingest, demoted to a Future-scope surface. S1 rebuilt around sync, match, the wording as received and the office's Contract choice | 33 | 1 / 0 / 3 |
| 35 | [Explicit save and the update email](phases/phase-35-explicit-save-and-update-email.md) | Admin draft-then-save with change sets and as-at history. An on-demand mailto update email picked from the change history (D19), started from a per-kind template, to the rooms or the hospital, including from a List-move notification; manual only. Add a Booking to a booked List keeping the hand-entered text as source text; correct the RVG code, Contract or invoice description until AUTHORISED | 17, 25, 32, 33 | 5 / 1 / 1 |
| 36 | [Internal ledger and balance views](phases/phase-36-internal-ledger.md) | BillingCase promoted to linked receivable and payable legs as the system of record, created with the invoice, one payable leg per receivable, the prepay holding account's legs and second pairs included. Phase 16's BCTI count re-reads from the ledger with a parity test. An Admin Ledger screen (whole ledger and per anaesthetist) with an imbalance indicator | 16, 22, 25, 27a | 7 / 2 / 0 |
| 37 | [Xero mirror resilience and the processing monitor](phases/phase-37-xero-mirror-resilience.md) | Disbursement detected from Xero (D53's default). Bulk hospital remittance left in Xero. An outage queue with backoff. A void made in Xero is flagged. The processing monitor grouped by anaesthetist, with sorting, filtering, a problems-only view and "Open in Review" on Lists awaiting approval | 36 | 4 / 0 / 0 |
| 38 | [Web accounts, outstanding list and monthly GST report](phases/phase-38-web-accounts-truth.md) | A ledger-backed financial position with the Productivity and Leave panels removed. A flat outstanding list with no ageing (D8). A monthly GST report of the payments AA passed to the anaesthetist, with each GST component, to download, email or print on web | 36 | 4 / 1 / 3 |
| 38a | [Edit until AUTHORISED, the main view and search](phases/phase-38a-find-past-work.md) | The anaesthetist can still see and change a submitted List until it is authorised, the last change standing and the office seeing late edits at review. A List leaves the main view at AUTHORISED and its invoices show in balances straight away. The main view starts at today, with earlier Lists not yet authorised reached by scrolling back and submitted ones less prominent. Search by patient name, NHI or date reaches authorised and invoiced work | 31 | 8 / 1 / 1 |
| 38b | [Events on a Procedure and the additional invoice](phases/phase-38b-events-and-additional-invoices.md) | The event element on a Procedure with one standard review step and next-run invoicing (D13), and the events list on every Procedure in all three apps. A free-form additional invoice to any party (D10, D22), raised by the office or by the anaesthetist on their own Procedure (reached through 38a's search), recorded as an event, replaces the addendum Booking | 36, 38a | 3 / 2 / 1 |
| 39 | [Credit notes, credit-and-rebill and the combined split](phases/phase-39-additional-invoices-and-credit.md) | A credit note option to any party, for the office and for the anaesthetist on their own Procedure, credit in full and rebill from a copy of the original's lines, and a combination line split after its invoice is sent by a credit then per-component invoices equal to the credit (before sending, a normal admin edit, D41), each reversing the ledger, the payable and Xero, with a negative invoice to an anaesthetist already paid. Credits recorded as events; credit notes audited; payments, receipts and disbursements kept out of the audit viewer | 38b | 6 / 2 / 0 |
| 39a | [Payment runs: the weekly cycle, BCTI approval, netting and remittance](phases/phase-39a-payment-runs-and-remittance.md) | A weekly ISO-week payment cycle (Friday close, Monday checks, Tuesday schedule, anomalies rolled forward) with an approve-for-payment step for the period's BCTIs, holding-account payables kept out until released, negative invoices netted per anaesthetist, and a remittance advice in Admin and web Accounts | 37, 39 | 3 / 1 / 0 |
| 39b | [Pre-op, post-op and billing events](phases/phase-39b-pre-and-post-op-events.md) | Pre-op and post-op events on a Procedure from mobile, web and Admin (date, time or fixed fee, invoice tick, billable party), and billing events (a free-text charge or a credit), as new kinds on 38b's element, at any time: on the Procedure's invoice before approval or invoiced in the next run after it, through one review step. The ACC pre-op assessment as a fixed-fee pre-op event. The BillingLine entity removed | 24, 38a, 38b | 4 / 1 / 0 |
| 40 | [Patients: mandatory NHI, balance warning, patient view](phases/phase-40-patients-and-alerts.md) | A patient record with invoices, follow-up actions and re-send. The NHI mandatory on every form, with the provisional patient and "NHI pending" gone, and the office's view of intake rows waiting for an NHI (urgent as the date nears; "Add NHI" matches the row). A mild or strong warning at booking when the patient paying owes money, a mild one for a credit balance (D24), with one admin-editable threshold field | 15a, 34, 36, 39 | 10 / 1 / 2 |
| 40a | [NHI lookup and identity standards](phases/phase-40a-nhi-lookup-and-identity.md) | NHI lookup with validation at entry, Hub states with a manual fallback, a purpose statement and refresh from the register, on the current add-booking forms (an ACTIVE List, the NHI required, the RVG type-ahead, the payer on the Booking). HPI CPN shown consistently | 26, 40 | 2 / 0 / 0 |
| 41 | [Prepayment letters, settlement by hand and refunds](phases/phase-41-prepayment-followup-credits-refunds.md) | Prepayment letters on 27's approval stating the prepaid amount as the price, and reminders. Settlement with nothing automatic: by-hand additional invoices and credit notes on a prepaid Procedure, a part credit allowed (D31). A full refund from the holding account on cancellation (D56), a fresh prepayment at the new anaesthetist's price on rebooking, and a moved prepaid Booking changing nothing, with an optional patient email | 27a, 32a, 39 | 6 / 0 / 0 |
| 42 | [Reference data and controlled loads](phases/phase-42-reference-data-and-loads.md) | Every master editable, including hospitals, insurers, recurring bookings and public holidays. A spreadsheet loader with row validation for RVG groups, contract holders, Contracts and standalone lines, modifiers and calendars; no Contract schedule upload (D34). A clean-cut go-live demo | 17, 18, 19, 19a, 19b, 25, 29, 30 | 4 / 1 / 0 |
| 43 | [Scale and privacy](phases/phase-43-scale-and-privacy.md) | A full-scale in-memory dataset with timings (the processing monitor included), generated in the 2026-10-20 shapes (RVG groups with no procedure list, holders with settings, Contracts with or without lines, a payer and an NHI on every Booking, prepaid Contracts with the holding account), a restricted raw-row view, an NHI leak scan and a synthetic-data badge | 34, 36, 37, 42 | 2 / 0 / 0 |
| 43a | [Sign-in and ease of use: simple anaesthetist screens and point-of-need help](phases/phase-43a-ease-of-use.md) | A simulated PWA sign-in with sign-out. Anaesthetist screens free of office-only complexity while keeping the descriptions, Contract and RVG code and the prices the catalogue gives them, and point-of-need help on mobile capture, Admin Day and Admin Review, with a first-run hint per app | 20a, 21, 24, 31, 39b | 2 / 0 / 0 |
| 44 | [Demo guide rewrite and final sweep](phases/phase-44-demo-guide-rewrite.md) | S1 to S5 rewritten, Control Panel jumps rebuilt, stale copy swept, master guide regenerated in full, trigger and PWA-parity audit, PROGRESS entry | all | 0 / 0 / 0 |
| | **Total** | 209 gaps, 39 DM and 36 RV closed; none parked. Built phases also keep items they delivered that now Match, were retired or were merged (for example FT-13.7, US-03.1.3, DM-01, DM-53) | | **232 / 49 / 36** |

## Sequencing rules

- **Built: 14 to 17 and 28 to 32.** 15 renamed Card to Booking; 15a built the warning routine that
  19, 21, 27 and 40 each register a rule into (19 out-of-range base units; 21 a child payer and an
  insurer named with no insurer Contract; 27 prepayment escalation; 40 a paying patient with a
  balance); 15b took out Copy and photo capture and renamed the assigned List's state ACTIVE; 16 made
  the AA fee a monthly invoice; 17 built the preference and tier helper every office pairing path
  reuses; 28 to 32 built Slots and Lists, the availability calendar and status master, conflicts and
  recurring bookings, Draft Lists and the anaesthetist's own List moves with the notification pool.
  Built phases' docs and records are frozen. Follow-up work the 16 to 20 October answers create on
  their surfaces goes to later phases: 32b (unavailability, notices, alerts, the office's order), 32a
  (the finder's type-ahead), 38a (the edit window), 26 (bank details, DM-32), 27 and 27a (US-09.1.1's
  prepayment payee), 39 and 43a (FT-13.5's audit carve-out and sign-in). Their covers keep what they
  delivered.
- **RV ids were renumbered by the 2026-10-20 reverse check** (DM ids are stable). The old RV ids on
  built 15 (RV-03, RV-12), 15b (RV-25, RV-36), 16 (RV-07), 28 (RV-14) and 32 (RV-15, RV-30) named
  findings those phases closed; the same numbers now name other findings, so those ids left the built
  phases' covers (their docs are unchanged) and every RV unit was placed by meaning. RV-15 and RV-17
  are now "keep as demo scaffold" findings, not units (see Parked).
- **The Schedule track finishes with 32a and 32b, then 38a, before the Contracts track resumes.**
  - 32a is the anaesthetist's single-Booking move as OQ-85 answered it (D61): only to a colleague
    free in that session, as a new List; no payee repoint (D38).
  - 32b follows up built 28 to 32 for the 19 October answers (D58, D59, D60): it removes the
    availability conflict, forces return or hand-on on every unavailability path, asks what the
    vacated session becomes everywhere, adds the resolve tick to notices and the "alert the office"
    source that 21's review shows, and orders the office's finders by tier then preferred pairing.
  - 38a now runs here, not in the money track: a List leaves the anaesthetist's main view when it is
    AUTHORISED, not when it is invoiced, so it no longer waits on billing; and it opens the
    anaesthetist's edit window to AUTHORISED (D63), which 20's Contract change relies on. Its search is
    the entry point 38b, 39 and 39b use for authorised and invoiced work.
- **BCTI granularity is built one way and labelled provisional.** The catalogue says both "one BCTI
  per procedure" (US-09.1.4 note, OQ-29, the 2026-10-01 note #41) and "the same value as its
  receivable" (OQ-42), and a receivable can hold several Procedures, so both cannot hold (DM-22 says
  as much). The plan builds one BCTI, the ACCPAY, per receivable invoice, the same value. 16 counts
  BCTIs for the fee run through one pure, tested function; 22 (a split gives two invoices, so two
  BCTIs), 36 (the ledger's payable legs), 38b (additional invoices), 39 (re-issued invoices; whether a
  credit note or negative invoice counts is OQ-60) and 39b (event invoices) feed it and keep it the
  only count, and 36 adds a parity test. "One per procedure" stays an open point beside OQ-29 and
  OQ-60; if it flips, the count function, the $700 seed and the S3 and S4 figures are re-baselined in
  one place. A prepayment's pairs go to and from the holding account (27, 27a): keep them out of the
  count unless the function's switch says otherwise.
- **The pricing model lives in one place.** The technical design v6
  ([AR-29](../../../requirements-board/requirements/artifacts/AR-29.md), regions such as
  `data-model`, `rvg-group-fields`, `contract-holder-fields`, `contract-fields`,
  `contract-line-fields`, `booking-procedure-fields`, `contract-behaviour`, `contract-selection`,
  `resolver`, `null-handling`, `time-entry`, `price-validation`, `pricing-snapshot`, `billable-party`,
  `prepayment`, `contract-versions`, `effective-dates`, `future-dated-versions`, `line-identity`,
  `review-dashboard`, `effect-on-bookings`, `data-loading`, `history`, `integrity-rules`) and its ERD
  ([AR-30](../../../requirements-board/requirements/artifacts/AR-30.md): `rvg-group`, `contract-line`,
  `contract`, `contract-holder`, `booking-procedure`) replaced the draft v4 in place on 2026-10-16
  (same AR numbers; v4 regions such as `price-precedence`, `resolver-layers` and AR-30's `procedure`
  no longer exist, so phase docs must not cite them). They are Greg's proposal for the development
  team: field names are for orientation only, and the catalogue wins where they differ (the
  documents' price step order is not adopted, FT-05.2; modifiers as records per Procedure are our
  addition). Every phase that builds these structures (18, 19, 19a, 19b, 20, 20a, 21, 23, 24, 25, 27,
  27a) keeps the structures and the pricing rule in **one place in `aa-prototype/src/domain/billing`**
  (plus the seed), behind types the UI reads, so a later design change stays a contained edit; each
  links the v6 executive summary ([AR-28](../../../requirements-board/requirements/artifacts/AR-28.md):
  `how-a-procedure-is-priced`, `who-gets-the-invoice`, `no-contract-rvg`, `typical-arrangements`,
  `booking-to-invoice`, `booking-updates`, `prepayment`, `price-reviews-and-controls`), AR-29 and AR-30
  at the regions it builds. Modifiers are seeded from `NZSA RVG 2021 modifiers.md` and
  `NZSA RVG 2021 included modifiers.csv` (artifact AR-34), never re-transcribed from the RVG.
- **Old-model matches are carried across.** Several items grade Matches only through the old model:
  FT-03.2's primary Procedure, US-05.2.1 (the anaesthetist's own unit value), US-05.2.7 (ex-GST
  prices), US-05.3.5 (units and dollars per Procedure), FT-08.2's and US-08.2.1's grouping by
  billable party and FT-05.5's ACC as an ordinary holder. 18 keeps the Type 2 and Type 3 terms in
  place while it rewrites the Contract; 19a moves them onto lines; 20, 21, 23 and 24 keep the rest
  working. Each says so, with a parity test.
- **The Contracts track runs strictly in order: 18, 19, 19a, 19b, then 20 to 25.**
  - 18 rebuilds holders (kinds, "is billed", a practitioner link) and Contracts (settings, dated
    version records, AA code, retire and never delete) and replaces the default Type 1s with No
    contract (RVG); it keeps today's terms, resolver and route so the app stays green until 19a and 20.
  - 19 (RVG groups and the type-ahead), 19a (standalone lines, starting values, combinations as
    lines, the anaesthetists' price lists, time tiers) and 19b (modifiers) come before 20, so the code,
    the lines and the modifiers are final before 20's picker, 23's Booking-level pass and 25's lock.
  - 20 also needs 38a (the edit window to AUTHORISED). It leaves interims: who is billed is the
    holder's billable party when the holder is billed, else the Procedure's existing `billablePartyId`
    override (the seeded guardians), else the patient, until 21 re-expresses the override as the payer
    on the Booking; the seeded `funderOverride` split stays until 22's Split button; and once the
    payment category goes, prepayment is read from the Contract's prepaid setting (18) with today's
    `prepaymentDetail` kept until 27.
  - **20 owns removing `PatientPaymentCategory`** (about 15 non-test files read it) everywhere. 27
    then removes only the deposit and split paths and `prepaymentDetail` (about 9 non-test files).
  - 20a runs straight after 20, so the descriptions have a Contract to sit beside, and before 21's
    review and 33's matching screen, which both show them. Its "who is invoiced" and "pricing basis"
    read one selector each, which 21 and 24 re-point; 22 prints its invoice description.
  - 24 holds the price, rate and discount on the Procedure and adds the editable flag and the
    discount line; 25 stages Contract changes and locks what 18 to 24 built, in a pricing snapshot
    per Procedure.
- **26 needs nothing unbuilt.** It keeps its place after 25, but can run any time if AA wants bank
  details sooner; it removes the GST period (RV-02), so it runs before 38, whose monthly GST report it
  leaves in calendar months.
- **27 then 27a, after 25, back to back.** 27 needs 18's prepaid setting, 19a's price lists, 21's
  payer and 25's lock. It generates the prepayment invoice when an admin approves it, with a pair
  whose payable is the prepay holding account (US-06.3.1, US-09.1.3; D38), never paid out by the
  payables run. 27a then builds the account itself and the second pair at authorisation, so prepaid
  money reaches the anaesthetist who did the List again. There is no estimate and no excess path: a
  prepaid Procedure is priced at the prepaid amount; the `negativeTotal` guard stays for every other
  negative.
- **Intake (33 to 35) runs after 31 and 20a** (33 also after 32b in run order), because a row can
  create a Draft List and every row and Booking shows the descriptions as received. A row with no NHI
  waits in 33's unmatched queue (D11); a day move is a cancellation plus a new Booking (D62). 34 needs
  only 33. 35 also needs 25's versioned history and 32's moves.
- **Money:** 36 runs after 16, 22, 25 and 27a (it promotes the holding account's legs and the second
  pairs into the ledger). Then 37 and 38 can run in any order (both need only 36); 38b after 36 and 38a;
  39 after 38b; 39a after 37 and 39 (it keeps holding-account payables out of a run until 27a's second
  pair releases them, and nets 39's negative invoices).
- **Capture:** 39b runs after 24, 38a and 38b, because 38b builds the event element 39b adds pre-op,
  post-op and billing-event kinds to, and soon after 38b, because 38b withdraws the anaesthetist's
  post-op Card flow that 39b brings back as events. 39b removes the BillingLine entity (DM-46) once
  billing events exist; 24 removes only the rate x time line and its gate.
- **The remaining phases:**
  - 40 runs after 15a, 34, 36 and 39 (a patient credit balance needs 39's credit notes; the waiting
    rows need 33's queue); 40a after 26 and 40.
  - 41 runs after 27a, 32a and 39 (letters on 27's approval, the by-hand routes of 38b and 39, the
    holding account for refunds).
  - 42 runs after every master-data phase (17, 18, 19, 19a, 19b, 25, 29, 30).
  - 43 runs after 34, 36, 37 and 42, late because its generator follows the final model: Slots and
    Lists, recurring bookings, RVG groups with no procedure list, holders with settings, Contracts with
    or without lines, each Procedure's Contract by 20's rules, a payer and an NHI on every Booking,
    prepaid Contracts with the holding account, values on the Procedure and the snapshot. 43a runs
    after the capture and review screens settle (20a, 21, 24, 31, 39b).
  - 44 runs last.
- **Contracts and Schedule are independent until 33.** The Schedule track went first while the
  pricing requirements settled; it finishes with 32a and 32b, then 38a, and the Contracts track
  resumes at 18.
- **Vocabulary.** Booking, not Card; move or reassign, never swap; never "timesheet". Per OQ-64,
  "slot" never reaches app copy (say session, AM or PM); Slot stays a code and planning word. A
  List's states are DRAFT (a Draft List, no anaesthetist), ACTIVE, SUBMITTED and AUTHORISED; never
  "DRAFT" for an assigned List. "Not preferred" and "Preferred", never "blacklist" or "whitelist" in
  app copy (D36). There is **no procedure list**: the procedure on a Booking is the text received,
  "RVG code" names what is picked from the RVG groups, and the rooms' description, the hospital's
  description and the invoice description are three things kept apart. "First party" and "third
  party" are not used: say what the Contract's settings do (who is billed, whether the anaesthetist may
  change the price, prepaid). Times are start and finish, never "handover". "Event" is the one name for
  everything recorded against a Procedure after setup; keep its user-facing label in one place (38b
  builds it). The prepaid amount is never called an estimate or a deposit; the money is held in the
  prepay holding account. Notices are active or resolved; an anaesthetist "alerts the office".
- **Open questions with a recommendation are built as that recommendation** (the open D rows'
  defaults) and labelled provisional, each kept in one place so a different answer is a small change.
- **Every phase opens with a drift check** against `d4db277` for its items and linked OQs (built
  phases keep their own baselines), and confirms any owner decision it depends on.
- **Every phase closes the same way:**
  - `npm run build`, `npm run build:pwa` and `npx vitest run` are green.
  - `npm run shots` (Playwright) is green for any phase that touches UI; `data-shot` hooks and specs
    move with the code they follow.
  - The adversarial review pass has run (PROGRESS convention 18).
  - The catalogue screenshots match the app: the phase's capture recipes are created or updated, a
    full `npm run capture` has run with no failed recipe, and `npm run verify:board` is green (see
    "Catalogue screenshots" below, and PROGRESS convention 19).
  - `PERSIST_VERSION` is bumped whenever the seed's shape or content changes.
  - Billing maths stays pure with Vitest tests.
  - The Decisions log is updated wherever a settled ruling is superseded. Known cases: the route
    model, the protected default Type 1 per hospital and insurer, the Method 3 hourly rate line, the
    price override with a mandatory reason, the 2026-10-08 readings this update withdrew (the
    procedure-first and two-tab picker, adjustable meaning No contract (RVG) and first-party Contracts,
    the price precedence with a recorded price source), the guardian override record, the 2026-09-28
    "no calculation" decision (where the catalogue shows a price), absorbed P1 modifiers and locked
    modifiers, the 2026-07-22 ASA seeding values, the addendum Card, the prepayment completion gate,
    the prepayment estimate and deposit, the overpaid prepayment's `negativeTotal` failure, the
    prepayment payable to the anaesthetist on receipt, binding convention 6's office-only edits after
    submit, the provisional patient without an NHI, Phase 15's List attachments, Phase 30's
    availability conflict and office-recorded sickness, Phase 28's and 32's provisional vacated-session
    default and keep-every-notice pool, office write-through per tap, hospital auto-apply and Phase 14's
    keeping Surgeon PDFs in scope.
  - A PROGRESS.md entry is recorded, ending with its "For the owner's review" list.

**Where the critic's review was not followed.** The escalating unpaid-prepayment warning (US-06.3.2,
Confirmed) and the re-check (US-06.3.5) stay in 27 rather than moving to 41: the warning is the
control that replaced the completion gate, and moving it would leave S4 Beat 1 with no control for
fourteen phases. Contract pricing terms (US-04.2.2) close in 24, not 19a, because their last missing
parts are pricing rules (the adjustable rule, the price precedence, the fixed rate and discount). In
the second review, Phase 32's file name (`phase-32-swap-requests.md`) is kept although "swap" is no
longer catalogue vocabulary: the plan tools pin an existing phase's doc path in `plan.json`, so
renaming only the slug would put the slug, the doc and the links out of step. The phase title and
every app-facing word already say "move". Renaming the file is a separate mechanical step (move both
files, then update `plan.json` and the links) if wanted. Phases 17
(`phase-17-surgeons-rooms-blacklist.md`), 19a (`phase-19a-default-rvg-contracts.md`), 38a
(`phase-38a-find-past-work.md`) and 39 (`phase-39-additional-invoices-and-credit.md`) keep their file
names for the same reason, although their titles have moved on.

**Placement notes for the 2026-10-20 update** (catalogue `d4db277`).

- **Two new phases.** **32b** follows up the built Schedule track for the 19 October answers (DM-56,
  RV-25, RV-26, US-13.8.3, US-03.6.3; it re-opens built 30's US-01.5.2 and US-01.5.4, 31's US-01.6.3,
  32's US-01.5.5, FT-13.8, US-13.8.1, US-13.8.2 and DM-41, and 17's US-13.6.4 and 28's US-01.4.2,
  which stay on their built phases' covers, as built 15's Copy finding and DM-39 did when 15b removed Copy). **27a** takes
  the prepay holding account and the second pair (DM-21, FT-06.5, US-06.5.1 from 41; US-09.1.3 and
  FT-09.1, now gaps again; RV-24), so prepaid money reaches the anaesthetist again straight after 27.
- **38a moves forward and widens**: the edit window to AUTHORISED (DM-55, RV-19, FT-07.2, US-07.2.3)
  joins its main view and search, the archive becomes search, and it runs after 32b and before 20.
- **18** drops first and third party for holder kinds and settings (editable, prepaid), allows
  Contracts with no lines, keeps versions never backdated and never deleted (RV-32), and gives
  US-04.2.10's staged submit and relink to 25. **19** loses the procedure list, the general procedures
  and the two tabs (US-05.1.6 Retired): RVG groups with a hidden key and a type-ahead. **19a** makes
  lines standalone with a default RVG code and a line key, collapses the resolver to starting values
  on the Procedure, and takes the combinations as lines (US-04.2.11 from 23). **19b**'s age and P1
  are pre-applied and removable, never locked (Donald, 2026-10-20).
- **20** builds a picker of Contracts then lines, an optional RVG code by type-ahead with a reverse
  lookup, and the anaesthetist's change until AUTHORISED. **20a** keeps the rooms' and the hospital's
  descriptions apart, adds the invoice description (US-08.4.6) and removes attachments (RV-01;
  US-03.1.3 Retired). **21** takes the insurer and approval number on the Booking (US-11.4.3,
  FT-11.4), "finish" for "handover" and times only where timed (US-03.3.3), the new completion rules
  (references are the office's job) and RV-21; US-08.2.1 now Matches. **22** takes the invoice
  documents (US-08.4.1). **23** loses the switch (D26 answered) and the combination Contracts.
- **24** is rebuilt around values on the Procedure, the editable flag (D50), the office changing any
  price, no reason, the discount line and the no-charge invoice (US-03.5.2, US-05.2.6, US-05.4.2
  join); there is no precedence and no price source; BillingLine's removal (DM-46) moves to 39b, and
  24 keeps the rate x time removal (RV-03). **25** takes the staged Contract changes and review
  dashboard (DM-57, US-04.1.6), US-04.2.10's submit and relink, and US-12.1.1's unit value in the
  snapshot, and becomes 2 sessions.
- **26** is repurposed: the profile prepaid settings are Retired (DM-19, FT-06.1, US-06.1.1,
  US-06.1.2, US-12.1.3 leave), so it is the profile with bank details (FT-12.1, US-12.1.4) and the
  GST period's removal (RV-02); it needs nothing unbuilt. **27** starts prepayment from the Contract's
  prepaid setting and generates the invoice at admin approval (D6, D27, D38), and no longer needs 26.
  **41** loses the trust account to 27a and the payee repoint altogether.
- **32a** builds the single-Booking move as answered (D61): only into a free colleague's session as
  a new List, notification optional, no repoint; it takes RV-27 (the office's single-Booking move).
- **33** turns the reschedule into a cancellation plus a new Booking (D62), parks rows with no NHI
  (D11) and needs no procedure match (D33). **34** loses FT-14.6 (its stories are all Future Work:
  no auto-match toggle and no manual-provider sheets; a manual sheet imports through 33) and takes
  RV-12, RV-14 and RV-16. **36** takes US-08.3.1 (the pair created with the invoice, the
  holding-account legs). **38** loses US-12.1.2 (Retired) and builds a monthly report of payments
  passed. **39** builds the combined split after sending only (D41) on combination lines. **39a**
  loses FT-10.2 (now Matches). **39b** replaces other billing lines with billing events and removes
  BillingLine (DM-46); US-03.3.6 is Retired. **40** builds the mandatory NHI (D11 answered) and takes
  EP-11, FT-11.3, US-11.1.1, RV-20 and RV-36.
- **Files keep their names**, pinned by the plan tools, although several titles have moved on:
  19 (`phase-19-rvg-and-procedure-masters.md`), 19a (`phase-19a-default-rvg-contracts.md`), 20a
  (`phase-20a-source-wording-and-procedure-stack.md`), 21, 24 (`phase-24-anaesthetist-adjustment.md`),
  25 (`phase-25-contract-lock-at-authorised.md`), 26 (`phase-26-prepaid-settings-and-profile.md`), 34,
  38a (`phase-38a-find-past-work.md`) and 41.
- **Left the plan:** Retired US-03.1.3, US-03.3.6, US-05.1.6, FT-06.1, US-06.1.1, US-06.1.2,
  US-12.1.2 and US-12.1.3; FT-14.6 out of scope (its stories are all Future Work, as are FT-02.2's);
  now Matching US-08.2.1 and FT-10.2; DM-19 dropped; RV-15 and RV-17 now "keep as demo scaffold"
  findings, not units.

**Placement notes for the 2026-10-08 update** (catalogue `60e2d1e`; historical, the 2026-10-20 notes above win where they differ, and RV ids below use the 2026-10-08 numbering).

- **15b also renames DRAFT to ACTIVE** (RV-36), early, so every later phase works in the new
  lifecycle's words; the DRAFT state for Draft Lists (DM-52, EP-07, FT-07.1) is 31's.
- **17 widens** from a blacklist to private two-way preferences, not preferred and preferred
  (US-13.6.3, US-13.6.4, OQ-43 answered), and admin-only priority tiers (US-01.3.6, DM-54), and
  becomes 2 sessions. The anaesthetist-side prompt the old plan gave 32 and 32a goes (US-01.4.5).
- **18 is rebuilt** around contract holders (DM-48, US-04.1.5), dated versions (US-04.2.10, OQ-48)
  and one No contract (RVG) (DM-49, RV-33, OQ-78): categories, multi-dimension scope, the payment
  setting, required inputs and the line extras go. It keeps the Type 2 and Type 3 pricing terms in
  place for 19a, so fees do not move.
- **19 narrows** to RVG groups, the procedure list with a general procedure per group, and the
  two-tab picker (DM-13, FT-05.1). **Modifiers move to the new 19b** (DM-44, FT-03.3, US-03.3.4,
  US-03.3.8, US-05.1.4, US-05.1.5, RV-23, RV-35, RV-38): they became itemised records with locked age
  and included P1, an explanation each, and the real RVG table, which together would pass two
  sessions inside 19.
- **19a is repurposed.** The default RVG Contracts it was to build are retired (FT-04.4, US-04.4.1,
  US-04.4.2), so it builds the Contract lines (DM-09, FT-04.2, US-04.2.4), the line, procedure, group
  resolver (DM-43), the anaesthetists' own price lists (US-04.2.14, OQ-91 answered) and the time tiers
  as data (US-05.2.2), and drops the ordinal key (RV-34). Its file name stays.
- **20a is new**: source wording and the three-part stack (DM-51, US-02.5.7, US-03.1.9, US-03.1.2,
  US-02.4.1), seeded from AR-35, after 20 and before 21 and 33.
- **20** loses DM-12 (to 21), DM-37 (merged into DM-10), RV-27 (dropped) and US-03.1.2 (to 20a), and
  takes US-03.3.1 (the two-tab pick then the Contract, with starting units).
- **21** loses US-04.2.7 (Retired) and US-04.3.7 (Future), and takes the payer on the Booking, the
  insurance indication (DM-12, OQ-93) and grouping by billable party (US-08.2.1).
- **22** loses US-04.2.12 (Retired) and DM-27 (merged into DM-22, 36); the split becomes a Booking
  action (RV-37).
- **23** loses FT-03.2 (now Matches, carried across), US-04.2.5 and US-05.3.4 (Retired); OQ-15 is
  answered and OQ-90's default builds the rule.
- **24** becomes the price precedence phase (DM-50, US-05.2.5, US-05.4.3); US-05.2.6 now Matches and
  is carried across by 18, 19a and 24.
- **26** loses DM-33 (merged into DM-32, on 17). **27** loses the estimator, the contingency units,
  the estimated duration and the excess path (US-06.2.3 to US-06.2.5 Retired, DM-40 dropped, OQ-38
  answered) and takes US-03.1.8 and US-08.2.2.
- **30** takes DM-53 (recurring bookings); **31** takes DM-52, EP-07 and FT-07.1 (OQ-86 answered).
  **32** no longer needs 27 or a preference prompt; **32a** drops DM-06 (merged into DM-42).
- **33** now depends on 20a and shows the source wording on every row (US-02.1.2); created Bookings
  wait for the office's Contract. **35**'s OQ-82 is answered (manual only).
- **38** loses US-07.2.1 and D9's default to **38a**, which becomes the anaesthetist's main view,
  archive and search (US-07.4.1, US-07.4.2, FT-07.4, OQ-31 answered) and is 2 sessions.
- **38b** and **39** add the anaesthetist's own additional invoice and credit note (US-08.6.3,
  US-08.6.5); 38b now depends on 38a. **39a** takes the weekly payment cycle (US-10.2.7, FT-10.2) and
  is 2 sessions. **39b** loses the UNIT x RATE and Contract add-on fee lines (US-03.3.6).
- **40** loses DM-47 (merged into DM-23, on 36; 40 still builds the follow-up tools). **41** is rebuilt
  around "nothing automatic, by hand" (US-06.4.2 Retired). **42** takes OQ-100's default and 19b's
  modifiers. **43a** keeps the stack on anaesthetist screens.
- **40a and 43 change only in what they build on.** 40a's add-booking forms are the new ones (an
  ACTIVE List with no "Open" label, 19's two-tab picker, 20a's "as given" field, 21's payer on the
  Booking in place of the billable-party fields). 43's generator builds the new shapes (recurring
  bookings, holder-fit Contracts or No contract (RVG), a payer on every Booking, first-party Contracts
  for any prepaid set) and is now 2 sessions, as its doc already expected.
- **Left the plan:** Retired US-04.2.5, US-04.2.7, US-04.2.12, US-04.4.1, US-04.4.2, FT-04.4,
  US-05.3.4, US-06.2.3, US-06.2.4, US-06.2.5 and US-06.4.2; Future Work US-04.3.7 (and the new
  US-02.3.5 and US-04.2.13); now Matching FT-03.2 and US-05.2.6; DM-06, DM-27, DM-33, DM-37 and DM-47
  merged into other deltas, DM-40 dropped; RV-27 dropped (absorbed into RV-13).

**The critic's review of the 2026-10-08 update** was followed in full: 40a and 43 were added to the
re-planned phases; 20 owns removing the payment category everywhere and 27 removes only the interim
flag, the deposit and split paths and `prepaymentDetail`; 27 creates the prepayment's ledger pair and
draft Xero pair at generation, with approval only sending it (US-06.3.1, US-09.1.3); 19b asks for a
claimed modifier's explanation when it is saved, with 21's completion block as the backstop
(US-03.3.4, US-03.6.1); 20's interim keeps the seeded guardian `billablePartyId` overrides until 21;
21, 24, 25, 19b and 20a link the AR-28, AR-29 and AR-30 regions they build (AR-35 has no regions, so
20a cites its note's "Illustrative source wording" heading by name); 38 depends on 36 only, and 38a
on 28 and 38.

**Earlier placement notes** (historical; the later notes above win where they differ, and RV ids use the numbering of their day).

**The critic's review of the 2026-10-03 update** was followed in full. Where it offered a choice,
or the plan went further:

- 39 was too big for two sessions, so it is split. The new 38b takes the event element, its review
  step and the events list, as suggested, **and also the additional invoice**, so 38b has a
  deliverable that can be demoed on its own instead of an empty list; 39 keeps the credit work.
- Also followed: one admin-editable balance threshold in 40 (a single field, not US-13.7.4's
  settings page); "Open in Review" in 37's monitor, with authorising kept on Review and logged for
  the owner; 39 added to 40's dependencies and 32a to 41's; 39b alone builds billing lines.

**Placement notes for the 2026-10-01 update.**

- 15a is new and early: the catalogue's warning routine is cheap to build over today's data, and
  four later phases plug a rule into it. Removing the gate there (D5) gives an early, correct S4 Beat 1.
- US-05.5.2 (ACC pre-op codes) moves from 19 and US-03.3.6 (other billing lines) from 39 to 39b,
  because the ACC pre-op assessment and late lines are now pre-op and post-op events.
- US-08.6.4 is unparked into 39 now that OQ-53 is answered; its combination Contract is 23's.
- 39a is split from 39 so neither passes two sessions: 39 raises the negative invoice, 39a nets it.
- US-09.3.1 goes to 16, which already edits the Xero simulator.
- US-15.0.1 gets its own late phase (43a) once the capture screens settle.
- 32 becomes the anaesthetist's own move; the payee repoint of a moved prepaid Booking (US-06.5.4)
  is 41's, beside the trust account. (Since 2026-10-03 the doer rule, US-01.4.6, is 32a's.)

**Placement notes for the 2026-10-03 update** (the three 2026-10-02 meetings with Greg).

- **15b is new.** The owner asked for Copy a Booking (US-02.4.3, Retired) to be removed. Phase 15
  built it, and RV-03 and DM-39 stay on 15's covers, so the removal is 15b's work, beside hiding
  photo capture (US-02.4.4 is Future Work; RV-25).
- **28 takes the horizon setting, free-by-default generation and the finders** (FT-01.1, US-01.1.1,
  US-01.4.2); US-01.1.1's recurring-clash criterion is completed in 31.
- **31 no longer turns an anaesthetist's unavailability into Draft Lists**: the anaesthetist chooses
  (US-01.5.5, in 32), and office-marked sickness stays a conflict (OQ-81 part 3). 31 turns a
  recurring clash into a Draft List instead (OQ-81 part 2).
- **32 takes the shared notification pool** (FT-13.8, US-13.8.1, US-13.8.2, DM-41) and
  return-or-assign (US-01.5.5, RV-30). The single-Booking move (US-01.4.7, DM-42), the doer rule and
  FT-01.4 are 32a's.
- **33** loses US-02.5.1 and US-02.5.2 (Future Work) and keeps the automated S13 to S15 out of the
  demo (RV-28). **34** loses surgeon PDF upload (US-02.2.1, Future Work) and the sync-state criteria
  US-02.1.5 dropped, badges the Surgeon PDFs tab (RV-26), and is 1 session. **35** loses concurrent
  edits (US-02.5.6, Future Work) and US-02.5.5 (Matches), and takes FT-02.3, the US-02.3.4 templates
  and RV-31.
- **37 takes the processing monitor restyle** (US-13.3.1), with "Open in Review" on Lists awaiting
  approval, and is 2 sessions.
- **38b is new, split from 39** so neither passes two sessions. Because additional invoices and
  credits are events (OQ-63), 38b builds the event element and its review step (DM-17), the events
  list (US-03.7.3) and the additional invoice (DM-18, RV-10, US-08.6.1, US-08.6.3). 39 keeps the
  credit work: the credit note option (US-08.6.5), the rebill from copied lines (US-08.6.6),
  credit-note audit (US-13.5.2, DM-45), credit in full and rebill, and the combined split. 39b adds
  the pre-op and post-op kinds.
- **40** drops US-11.1.1 (Matches), gets one admin-editable balance threshold and depends on 39.
  **41** depends on 32a. **43a** takes anaesthetist sign-in (US-13.5.3, PWA first).
- FT-13.5, RV-12 and US-03.1.3 now Match and stay on built 14 and 15.

### Demo triggers

Phase 14 built the mechanism and re-homed every existing trigger. Later phases register new entries
or re-point existing ones; none adds a trigger to the Control Panel page. Each entry declares:

- the route patterns it belongs to;
- the surfaces it shows on: harness bar, PWA sheet, or both;
- a `run(api, ctx)` that acts on the entity in the URL (`listId`, `bookingId`, `invoiceId`,
  `dateISO`) or on screen state published through `useDemoTriggerContext` (an edit draft, a selected
  import row, a local tab), not a hardcoded seed id wherever possible;
- a disabled state.

The harness bar shows a trigger only on its screen. The Control Panel keeps the scenario jumps, the
clock and reset, and lists every trigger under its screen with a link that opens it. Trigger bodies,
the context hook and the shared actor constants live in `src/shared` or `src/store`, so the PWA
purity test holds.

Product actions stay in the product UI, not the bar. Examples are "Create additional invoice",
"Credit note", "Credit in full and rebill", "Split", "Approve and send", "Run monthly fee invoices",
"Draft update email" and "Import hospital bookings" (with a badged sample-file picker). 15a's "Raise
sample warnings" is one shared trigger: each phase that adds a warning rule adds its sample to it.

### PWA parity

The PWA has no harness bar and no Admin app, so a handset demo cannot switch to the office. Every
phase whose beat has a mobile side that waits on the office, a colleague or a backend event
registers a PWA-surface entry for the mobile screen concerned, for example "Office authorises this
List" (14), "Office clears this warning" (15a), "Office approves this Contract change" (21), "Office
approves and sends the prepayment invoice" (27), "Office assigns a Draft List to me" (31),
"Colleague moves a List into my free session" (32), "Colleague moves a Booking to me" (32a: a new List
in my free session), "Office resolves this alert" (32b), "Hospital row arrives and the office matches
it" (33), "Office reviews this additional invoice" (38b), "Office reviews this event" (39b), "Office
adds the NHI" (40) and "Sign out" (43a). These stand-ins show on the PWA only: in the framed build the
presenter plays the office in Admin. "Play the office" stays as a signposted scaffold, defaults to OFF
and shows a badge when on, and loses nothing because 14 added the per-List trigger. Phase 44 checks
PWA parity beat by beat.

### Demo guide

- **Each phase patches the beats it breaks,** in the same session: `docs/demo-guide` (run sheet,
  cheat sheet, workflows, personas), the matching sections of `master-demo-guide.html`, and the
  Control Panel scenario text. The self-contained guide presenters use is never more than one phase
  stale. Each phase doc names the beats in its "Demo guide updates" section.
- **Each milestone phase (38a, 25, 27a, 35, 39a; 16 is built) ends with a consistency read** of
  `master-demo-guide.html` against the run sheet.
- **Phase 44 rewrites the S1 to S5 run sheet** around the new model and regenerates
  `master-demo-guide.html` in full.
- **Known beats the 2026-10-20 changes break, and who patches them:** 32a S2's single-Booking move (a
  new List in a free session); 32b S2 Beat 3 and 3a (sickness forces a return or a hand-on, with no
  conflict; the conflict dashboard shows hospital closures only; notices ticked resolved); 38a the
  cheat sheet's "office-only edits after submit" lines and any beat narrating billed Lists vanishing;
  18 the cheat sheet's Contracts section (holders and settings, no Type 1/2/3, no first or third
  party, no default hospital Contract) and S5 Beat 4; 19 and 20 S1 Beat 3's capture (the RVG code by
  type-ahead, no procedure pick, no tabs) and S1 Beat 1 and S2 Beat 2 (the office sets the Contract,
  No contract (RVG) first); 19b the workflows and personas lines on ASA (optional, nothing locked);
  20a S1 Beat 2 (the descriptions); 21 S3 Beat 1 (who is billed) and S2 Beat 4 (the child-payer
  warning); 22 S3 Beat 1's "Funder allocation" aside; 24 S5 Beat 1 (price changes with no reason);
  25 S4 Beat 3 (the billing failure re-based, no un-end-dating) and S5 Beat 4 (a staged price review);
  27 and 27a S4 Beat 1 (a prepaid Contract, the invoice generated on approval, the holding account,
  the second pair at authorise) and the cheat sheet's prepayment lines; 33 and 34 S1; 38b S4 Beat 2's
  post-op addendum; 39 a credit-and-rebill beat; 39a S4 Beat 5; 39b any billing-line narration; 40 the
  "Provisional patient (NHI pending)" scenario link; 41 any refund, trust account or payee-repoint
  narration.

### Front-end design

Every phase from 15 on touches UI, so every kick-off prompt from 15 on tells the agent to invoke the
`/frontend-design:frontend-design` skill before building or reshaping any screen, sheet, dialog,
panel, row, banner or state. The skill works inside the design system, not over it: the
`docs/design` files and `src/theme` tokens stay authoritative (PROGRESS convention 17, CLAUDE.md
"Design"), so it shapes layout, hierarchy, spacing, states and finish, never a new palette, typeface
or visual language, and the two hard rules (crimson identity only, teal the only action colour)
hold. Store, seed and pure-domain steps do not need it. A new or re-planned phase that touches UI
carries the same "While working:" bullet.

### Owner review: agents test themselves

The owner (2026-10-02) is running the phases back to back and will not review the app after each
one. One proper review comes **after all catch-up phases are finished**. So, from Phase 15 on:

- **No plan-approval stop.** After the drift check, the agent writes its step plan (in the session,
  and in the PROGRESS entry) and starts building straight away. It does not enter plan mode or wait
  for approval.
- **The agent is the tester.** It runs the phase's manual test checklist itself, in the running app
  (start root `npm run dev` in the background if 5173 or 5174 is down), driving it with Playwright
  or the `/run` skill and checking screenshots by eye. "Handset" checks use the emulated mobile
  viewport unless a real phone is already attached. Each item is reported pass or fail with its
  evidence. It never hands the checklist, a click-through or a screenshot check to the owner.
- **Defaults over questions.** Where a phase doc says "ask the owner" about a product choice, the
  agent builds the stated default, labels it provisional where the doc says so, and logs the question
  for the end-of-catch-up review instead of asking.
- **Stop and ask only when it is very needed:** a drift-check stop condition the phase doc names (a
  vocabulary rename, a reopened decision that changes the model, a covered item that has left its
  lane so the phase no longer makes sense), a blocker no documented default resolves, or an action
  that is destructive or hard to undo. Everything else is decided, recorded and carried forward.
- **Owner review queue.** Each phase's PROGRESS entry ends with a short "For the owner's review"
  list: the defaults built for open questions, provisional readings, anything logged rather than
  fixed, and the screens worth a look. Phase 44 gathers these lists into one review list for the
  owner's end-of-catch-up review.

### Catalogue screenshots

The catalogue's stories carry screenshots of the prototype, taken by the Requirements Board's capture
runner from one recipe per item (`requirements-board/requirements/capture/recipes/<ID>.json`; format, routes, hooks
and selector tips in `requirements-board/requirements/capture/ATLAS.md`). When a phase is done, the screenshots on
its stories must show what it built, and no other story's screenshots may be left showing a screen the
phase changed. Every phase therefore ends with this step, after the review pass and before the
PROGRESS.md entry:

1. **Recipes for the covered items.** For every story the phase covers (and every feature it covers
   that has no stories), create the recipe if it is missing and update it if it exists, so it matches
   what was built:
   - `status`: `captured` when the story is fully in the prototype, `partial` with an `absentReason`
     saying exactly what is still missing (and which later phase builds it), `absent` only if the
     phase built nothing visible for it (say why);
   - shots for each screen and app the story lives on (web and mobile both, where both have it), with
     states for the change the story describes (before and after, closed and open, warning and
     cleared), and the highlight on this story's area;
   - captions in the catalogue's current words (Booking, not Card), with no en or em dashes.
   `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs <phase>` lists the covered items and
   their current recipes.
2. **Recipes the phase broke.** Any other recipe whose route, id, text or selector the phase changed
   is updated to the new screen, keeping its shot `name`s (rename a shot only when the old name
   describes retired behaviour; the runner deletes the old generated image). A retired or Future Work item whose screen the
   phase removes gets `status: absent` with the reason "Retired: removed in Phase NN" (or "Future Work lane").
   Add `data-shot` hooks rather than brittle selectors, and move hooks with the code they follow.
   Stage a per-screen demo trigger with the runner's `trigger` step (added in Phase 14, because shots
   hide the harness bar that holds the "Demo actions" menu); on the PWA, open its Demo sheet instead.
3. **Capture.** With the prototype on 5173 and the PWA on 5174 (if they are not running, start root
   `npm run dev` in the background and stop it afterwards), run `node scripts/capture.ts --dry` in
   `requirements-board/`, fix what fails, then a full `npm run capture`. The full run rewrites only
   images that changed, links them into the items' `images`, and rewrites `requirements-board/requirements/capture/REPORT.md`. It
   must end with no failed recipe and no story without a recipe.
4. **Look at the shots.** Open the new and changed images for the covered items and check that each
   shows the built feature, the highlight lands on it, and the caption is true.
5. **Keep ATLAS current.** Where the phase changes routes, seed ids, personas, overlays or hooks that
   recipes rely on, update the matching `ATLAS.md` sections.
6. `npm run verify:board` from the repo root is green.

The runner, not the agent, writes the catalogue items' `images` and the files under
`requirements-board/requirements/assets/`; the phase still never edits a requirement's text or status. This step replaces
any older advice in a phase doc to leave screenshots stale or for the owner to re-shoot them.

**Stale captions after the 2026-10-20 update.** Many current captions describe the old behaviour.
The phase that rebuilds the screen replaces them when it updates the recipe, and its "Catalogue
screenshots" rows say what the new shot must show. The change logs name: a required reason on
US-03.5.1, US-05.4.1 and US-05.4.2 (24, no reason); "handover" on US-03.3.3 and US-03.6.1 (21,
"finish"); the GST period on US-12.2.2 (38, a monthly report) and US-13.4.1 (42); "NHI pending" on
US-11.1.4 (40); the availability conflict on US-01.5.2 and US-01.5.4 and the notices on US-13.8.1
(32b); the day move on US-02.5.2, now Future Work's automatic path (33 marks its recipe absent if its
screen goes); the prepayment invoice on US-06.3.1 (27, generated on approval). Still standing from
2026-10-08 where not yet rebuilt: US-04.3.3 (20, No contract (RVG) first), US-03.3.4 (19b, optional
itemised modifiers, nothing locked), US-06.2.2 (27, the line's price), US-08.2.2 (27, nothing left to
bill), US-06.4.1 (41, the by-hand routes), US-04.2.2 (24, the line terms and the editable flag), the
US-05.1.x captions (19, 19b), US-03.1.2 and US-03.1.9 (20a, the descriptions with the Contract), the
US-11.2.x captions (21, the payer on the Booking) and US-07.4.1 (38a, gone at AUTHORISED and found by
search). Recipes and images are never touched while updating the plan.

### Confirm before building

These phases carry unresolved open questions (OQ) or Verify, Open or Proposed items. Each checks them
at its drift check, and if they are still open builds the owner-decision default (the open D rows) or
the recommended reading and labels it provisional in the UI.

| Phase | Items | Open questions |
|---|---|---|
| 18 | US-04.1.5 (Verify): the holder fields per v6; how a surgeon's arrangement is held; what the insurer's direct-claims flag does | OQ-105, OQ-114 |
| 19 | US-05.1.3 (Verify): whether the anatomy heading browses or filters, and whether AA groupings stay; how a range is held; the system code | OQ-101 |
| 19a | FT-04.2 (Verify): the v6 line fields; routine lines on No contract (RVG); where a surgeon's prices sit | OQ-106, OQ-105 |
| 19b | US-03.3.4, US-03.3.8, US-05.1.4 and US-05.1.5 (Verify): whether anything is pre-applied at all (Ben), the age bands | OQ-95 |
| 20 | FT-03.4, US-03.4.1 and US-03.3.1 (Verify): how a surgeon's arrangement is found, routine lines on No contract (RVG), how a range is held | OQ-105, OQ-106, OQ-101 |
| 20a | US-03.1.9 (Open), US-08.4.6 (Proposed): which description the invoice prints, views per app | OQ-103 |
| 21 | US-03.6.1 (Verify), FT-11.4, US-11.4.2 and US-11.4.3 (Proposed): whether insurance narrows the list, the warning, the approval reference, the direct-claims flag | OQ-93, OQ-114 |
| 22 | US-08.2.3 (Verify), US-08.4.1, US-08.4.5 and US-09.1.4 (Proposed): whether % shares must total 100; GST agency, the BCTI's new name and its granularity | OQ-29 |
| 23 | Which Procedure is primary (Vanessa takes the most expensive; not settled, no question yet) | none |
| 25 | US-04.1.6 (Proposed): the staged review; the upload's first-release need; a prepaid Procedure's price through a new version | OQ-100, OQ-104 |
| 26 | US-12.1.4 (Verify), FT-12.1 (Proposed) | none |
| 27 | EP-06 and US-06.3.5 (Verify): a price change on a prepaid procedure, the prepaid price through a Contract change, mixed Bookings | OQ-96, OQ-104, OQ-116 |
| 27a | FT-06.5 (Verify), FT-09.1 (Proposed): the second pair's trigger (authorisation in the catalogue; Greg said "confirmed and submitted") | none |
| 32a | US-01.4.6 (Verify): the doer rule's trigger; whether colleagues are ordered by tier for the anaesthetist | OQ-113 |
| 32b | US-13.8.1 (Verify): the panel placement is our design; the office's order (Ben's ranking) | OQ-113, OQ-102 |
| 33, 34 | FT-02.1 (Verify), US-02.1.5 (Proposed): the delivery format per hospital; which source comes first; whether the two hospitals sync in the first release | OQ-13, OQ-108, OQ-109 |
| 35 | US-02.3.3 (Verify) | none |
| 37 | US-09.2.4, US-10.2.4 (Proposed): payment through Xero or from the new system; the grouping and filters are Greg's suggestions; approval kept on Review behind "Open in Review" (our reading) | OQ-111 |
| 38 | US-12.2.2 (Verify): payments passed, the GST agency treatment | OQ-29 |
| 38b | US-08.6.1 and US-08.6.3 (Verify); the user-facing name "event" | none |
| 39 | FT-08.6, US-08.6.2 and US-08.6.5 (Verify), US-08.6.6 (Proposed) | none |
| 39a | US-10.2.6 (Verify), US-10.2.7 (Proposed): who approves, the 20th-of-the-month fit, where payments are made | OQ-47, OQ-111 |
| 39b | US-05.5.2 (Open): ACC codes (parked by Donald) | OQ-12 |
| 40 | US-11.3.2 (Verify): the editable threshold beside US-13.7.4's "fixed until AA asks" (Future) | none |
| 41 | FT-06.4, US-06.4.1, US-06.5.2 and US-06.5.3 (Verify): a part credit, the refund route, mixed Bookings, a price change on a prepaid procedure | OQ-96, OQ-97, OQ-115, OQ-116 |
| 42 | US-13.4.3 (Proposed): whether a Contract schedule upload is in the first release; the direct-claims flag | OQ-100, OQ-114 |
| 43a | US-13.5.3 (Verify): the sign-in experience (deferred to the end of discovery) | OQ-83 |

## Milestone demos

These are what you can show at each point.

- **After 16** (built; 15a and 15b ran before it): Booking vocabulary everywhere, with Copy a Booking
  gone, photo capture out of the Add a booking chooser, and an assigned List called ACTIVE. Every
  demo action on its own screen, in the harness bar and on a handset, with the HL7/FHIR tooling badged
  Future scope. Warnings, never blocks: one routine, the to-do list, a triangle on Bookings and a
  warning clear on opening, the prepayment gate turned into a warning, and no confirm step at submit.
  The corrected payables story: the payable equals the receivable, AA's fee is a monthly invoice
  built from its settings, and Xero holds no patient names.
- **After 38a** (28 to 32 built; 32a, 32b and 38a finish the schedule and the anaesthetist's side of
  List approval): every session stored and free by default over a configurable horizon, Slots and
  Lists, statuses as a user-maintained list, the availability calendar with series, recurring
  bookings, Draft Lists in the DRAFT state with a waiting flag that become ACTIVE when the office
  assigns them with preferences and tiers, never onto an unavailable session; unavailability
  (sickness included) that forces a return or a hand-on and is never a conflict, the conflict
  dashboard showing hospital closures; whoever moves a List choosing what the vacated session
  becomes; anaesthetists handing on Lists and moving single Bookings into a free colleague's session
  as a new List; the shared notification pool with notices ticked resolved and alerts raised from a
  List or Booking; and the anaesthetist changing a submitted List until it is authorised, a main view
  from today and a search for past work. S2 is re-scripted.
- **After 25:** the catalogue's pricing model, end to end:
  - contract holders (insurers, hospitals, surgeons or rooms, anaesthetists) with an "is billed"
    setting, and Contracts with settings (editable, prepaid), dated versions never backdated, AA codes,
    and one No contract (RVG) held by AA;
  - RVG groups as the one master list and an optional RVG code picked by type-ahead;
  - standalone Contract lines (fixed price, rate, discount or units, a default RVG code), Contracts
    with no lines, combinations as lines, the anaesthetists' price lists, and starting values filled
    from the line or the RVG group, any base value accepted with an office warning when out of range;
  - optional itemised modifiers with explanations, the age and included P1 pre-applied and removable;
  - one Contract per Procedure, mandatory at setup, picked from a list of Contracts (No contract (RVG)
    first) then its lines, changeable by the anaesthetist until AUTHORISED;
  - the rooms', the hospital's and the invoice descriptions kept apart and shown with the Contract and
    the RVG code on every booking screen;
  - the payer on the Booking, who is billed decided by the Contract, the insurer and approval number,
    the child-payer warning, and completion needing a Contract, times only where timed and modifier
    explanations;
  - invoices sent by the billing run with each Procedure's invoice description, and a Split button
    with typed $ or % shares;
  - the RVG multi-procedure rule (base on the primary, time on every Procedure, the 3/2/2 split);
  - the price, rate and discount on the Procedure, the discount as its own line, a no-charge invoice
    at $0, the anaesthetist changing them only where the Contract allows and the office changing any,
    with no reason;
  - Contract changes staged on a review dashboard and submitted as a new dated version that relinks
    un-invoiced work, and a lock at AUTHORISED that reproduces invoices exactly.

  S1 Beat 3, S2 Beat 2, S3, S4 Beat 3 and S5 are re-scripted.
- **After 27a:** prepayment started by picking a Contract flagged prepaid for a person paying: the
  amount is that line's price, in full and shown to the anaesthetist; the invoice is generated when an
  admin approves it, its payable held in the prepay holding account; part-paid tracking and a warning
  in both apps that strengthens as the date nears; at authorisation the prepaid Procedure is priced at
  its amount with nothing raised automatically, and a second pair pays whoever did the List. S4 Beat 1
  is re-scripted.
- **After 35:** S1 rebuilt: one theatre list a day from the two integrated hospitals, the
  review-and-merge screen showing each row's wording as received, rows without an NHI waiting, a day
  move as a cancellation plus a new Booking, then a Booking whose Contract the office sets (No contract
  (RVG) first). Explicit save with change sets, and the on-demand update email picked from the change
  history, started from a template, to the rooms or the hospital, including from a List-move
  notification.
- **After 39a:** the money story on the internal ledger: balances shown in or out of balance, the
  holding account's legs and second pairs, Xero mirror resilience and a processing monitor grouped by
  anaesthetist with sorting and filters, ledger-backed web accounts with a flat outstanding list and a
  monthly GST report of payments passed, events on a Procedure with the events list and free-form
  additional invoices to any party (office and anaesthetist), the credit note option,
  credit-and-rebill from copied lines and a combination split after sending that equals the credit,
  and weekly ISO-week payment runs with BCTI approval, netting and a remittance advice. S4 Beats 2 to
  5 are re-scripted.
- **After 44:** every verified gap closed: pre-op, post-op and billing events on every Procedure (no
  billing lines), patients with a mandatory NHI, intake rows waiting for one, balance warnings,
  follow-up tools and NHI lookup, prepayment letters, by-hand settlement of prepaid work with part
  credits, refunds from the holding account, a moved prepaid Booking changing nothing,
  reference-data loads, full-scale and privacy demos, anaesthetist sign-in, point-of-need help, and the
  rewritten S1 to S5 run sheet.

## Parked

Nothing is parked. US-08.6.4 (split a combined Procedure into additional invoices), parked in the
first plan while OQ-53 was open, is in Phase 39: a combination is now a line of its own on its
holder's Contract (OQ-53, built in 19a), and a split after the invoice is sent is a credit then one
additional invoice per component equal to the credit (OQ-72, OQ-77).

Kept but not planned as work: the PWA's "Play the office" auto-authorise, a signposted demo scaffold
(Phase 14 badged it, defaulted it to OFF and added the per-List "Office authorises this List"
trigger; the renumbered reverse check no longer lists it). Two reverse findings are "keep as demo
scaffold", not units: RV-15 (the Integrations nav attention badge and patient names in the message
log, which fall away when 34 demotes the Messages tab) and RV-17 (the badged photo-capture demo
action; 44 checks the badge is still there if it is shown).

Out of the plan (not parked: excluded or already met). Since the 2026-10-20 update: Retired US-03.1.3
(attachments: 20a removes them, RV-01), US-03.3.6 (other billing lines: merged into events, 39b),
US-05.1.6 (the procedure master, never built), FT-06.1, US-06.1.1, US-06.1.2 and US-12.1.3 (the
profile's prepaid settings, never built) and US-12.1.2 (the GST period: 26 removes it, RV-02); out of
scope FT-14.6 and FT-02.2 (every live story in the Future Work lane; 34 drops the auto-match toggle and
badges the PDF tab); now Matching US-08.2.1 and FT-10.2 (carried across without regression in 21 and
39a); DM-19 dropped. Built phases also keep delivered items that now Match (for example FT-13.7,
US-13.7.2, FT-10.3, US-10.2.1, US-01.4.3, US-01.4.5). Since the 2026-10-08 update: Retired US-04.2.5,
US-04.2.7, US-04.2.12, US-04.4.1, US-04.4.2, FT-04.4, US-05.3.4, US-06.2.3, US-06.2.4, US-06.2.5 and
US-06.4.2 (their prototype code, such as the protected default Type 1s, the ordinal price rows, the
deposit and the estimate, is removed in 18, 19a and 27); Future Work US-04.3.7, US-02.3.5 and
US-04.2.13; now Matching FT-03.2 (carried across in 23); DM-06, DM-27, DM-33, DM-37 and DM-47 merged
into other deltas; DM-40 dropped. Since the 2026-10-03 update: Future Work US-02.2.1, US-02.4.4,
US-02.5.1 to US-02.5.4, US-02.5.6 and US-13.7.4; Retired US-02.4.3 and US-05.2.3; now Matching
US-02.5.5; DM-36 dropped.

## When the catalogue changes

The catalogue keeps changing, and this plan is pinned to commit `d4db277` (built phases keep the
baselines their docs name).

1. **Every phase starts with a drift check.** Diff the catalogue files for the phase's covered IDs
   and their linked OQs against the snapshot, and check whether any owner decision it depends on has
   been answered:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff <covered IDs and OQs, comma separated>
   ```

   It diffs each of those IDs that changed since the snapshot (`plan.json` "commit"), and
   `domain-model.md`, with rename detection: the catalogue moved to `requirements-board/requirements/`
   after the 2026-10-03 snapshot, so a plain `git diff` would show every file as deleted and added.

   Record the result in the phase's PROGRESS entry.
2. **For each changed item, re-run the gap analysis for that item only**, following
   [README.md](README.md). Then update `gaps.json`, the epic file and the phase doc before building:
   - An item that was retired or moved to Future leaves the phase's covers.
   - A new item goes into the phase that touches its surface, or into a new phase if none fits.
   - An answered OQ removes the "confirm before building" flag; an answered owner decision replaces
     its default.
3. **Move the snapshot commit only when the whole gap analysis is re-run.** Partial re-runs record
   their own commit against the items they refreshed.
