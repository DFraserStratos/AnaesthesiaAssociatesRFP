# AA Prototype · Requirements catch-up roadmap

The prototype was built in July 2026 against the original RFP (phases 00 to 13, see
[../ROADMAP.md](../ROADMAP.md)). The requirements catalogue is now the source of truth and has moved
a long way from the RFP. This catch-up brings the prototype up to the catalogue as at commit
**`60e2d1e`**. Future and Retired items are out; retired behaviour the prototype still has is removed
or reworked. The plan was updated on 2026-10-01 for the AA meeting with Greg
([change log](../../../requirements-board/requirements/changes/2026-10-01-requirements-update.md)),
on 2026-10-03 for the three 2026-10-02 meetings with Greg (change logs:
[morning](../../../requirements-board/requirements/changes/2026-10-02-requirements-update.md),
[requirements review](../../../requirements-board/requirements/changes/2026-10-02-aa-requirements-review-with-greg.md),
[booking and pricing review](../../../requirements-board/requirements/changes/2026-10-02-aa-booking-and-pricing-review-with-greg.md)),
and again on 2026-10-08 for the Contract and pricing model rewrite (change logs:
[2026-10-07 requirements update](../../../requirements-board/requirements/changes/2026-10-07-requirements-update.md),
with the 2026-10-05 typed decision, the 2026-10-06 directors' answers and the 2026-10-08 follow-ups;
[List lifecycle states](../../../requirements-board/requirements/changes/2026-10-07-list-lifecycle-states.md);
[procedure picker and source text](../../../requirements-board/requirements/changes/2026-10-08-procedure-picker-and-source-text.md)).
That last update brought contract holders (third party and first party), dated Contract versions,
one stored No contract (RVG) and no default Contracts, base units on the RVG group with a curated
procedure list and a two-tab picker, Contract lines with a fixed price, rate or discount, one price
precedence, itemised optional modifiers with only age and included P1 locked, the source wording and
three-part Procedure stack, the payer on the Booking, prepayment at the anaesthetist's own fixed
price with nothing calculated afterwards, the DRAFT, ACTIVE, SUBMITTED, AUTHORISED List lifecycle,
private pairing preferences and priority tiers, the weekly payment cycle, and the List leaving the
anaesthetist's main view once invoiced. The changed items were re-graded (133 of 292 in scope), and the
data-model delta and reverse check redone (new deltas DM-48 to DM-54 and findings RV-33 to RV-38;
DM ids are stable).

The plan closes every verified gap in the [gap analysis](GAP-ANALYSIS.md): 220 gap items, 46
data-model deltas (DM) and 34 reverse findings (RV), with nothing parked. Per-gap detail is in
[epics/](epics/), the machine-readable set in [gaps.json](gaps.json), and the code index in
[analysis/](analysis/) (prototype maps, [data-model delta](analysis/domain-model-delta.md),
[reverse check](analysis/reverse-check.md)).

There are forty-three phases, numbered from 14 (about 77 sessions in all). Phases added in updates
carry a letter suffix (15a, 15b, 19a, 19b, 20a, 32a, 38a, 38b, 39a, 39b, 40a, 43a) so they sit where
they run. Each one is sized for **one focused Claude Code session (two at most) with one coherent
deliverable**, like the originals, and has a plan in `phases/phase-NN-<slug>.md`. Every phase leaves
the app green, demoable and fully migrated, because the prototype is shown in live workshops between
phases. **Built:** 14 and 15. **In progress:** 15a (session 1 committed at `b342a7d`; session 2 to
build, against its own dated "Requirements changed since session 1" section).

## Owner decisions

These readings shape what a phase delivers, not just its labels. Each is a question on the
Requirements Board (the OQ named in its row). **Nine were answered at the 2026-10-01 meeting with
Greg (D1 to D8, D10) and fourteen more at the 2026-10-02 meetings (D12 to D25).** The 2026-10-08
update re-read every row against the new answers: **D9 is now answered** (OQ-31), and D2, D3, D4,
D6, D12, D16, D17, D18, D20 and D25 are superseded in whole or in part (each row says how, with the
old reading struck through). **D26 to D41** are the open questions that gate an unbuilt phase, each
with the default its phase builds; **D42 to D46** record questions answered on 2026-10-07 and
2026-10-08. The phases they gate build the answer, not a default. **Still open: D11 and D26 to
D41.** Agents test themselves (see "Owner review" below): an open row's phase builds its default,
labels it provisional in the UI where the row says so, keeps it in one place so a different answer
is a small change, and logs it on the phase's "For the owner's review" list; the phase's drift check
confirms the gating answer first.

| # | Decision | Gates | Answer (or default while open) |
|---|---|---|---|
| D1 | AA fee basis and netting (OQ-02) | 16 | **Answered.** A monthly AA fee invoice per anaesthetist: fixed charges plus a charge per BCTI (for example $500 + $5 x 40), from a settings page (US-10.3.3), raised by a monthly run. The payable equals the receivable, and the fee is always a separate invoice, never netted. What the per-invoice charge counts is OQ-60, still open: build its recommendation (each BCTI once, against the anaesthetist who did it) with Greg's 2026-10-02 view (only paid invoices count), both provisional inside one pure function. The count reads one BCTI per receivable invoice, which is provisional: the catalogue's "one per procedure" is unresolved (see Sequencing rules). The weekly payment cycle (US-10.2.7, OQ-47 Proposed) is 39a's |
| D2 | Insurer and funding source: on the Booking or the Patient (OQ-55) | 20, 21 | **Superseded 2026-10-08** by OQ-55's update and OQ-93: ~~Neither. `Procedure.insurerId` goes and nothing replaces it; no per-Booking override either (D17)~~. New reading: the Contract still decides who is billed and `Procedure.insurerId` still goes as a route (20). Greg says the Booking holds the funding source and the guide puts an insurance indication on the Booking, so a simple insurance indication on the Booking, guiding the Contract choice and driving a review warning, is built as OQ-93's default (D28, in 21). The per-hospital default Contract is overtaken (D16) |
| D3 | Ranged base codes: drop the published-range bound (RV-04, OQ-56) | 19, 19a | **Answered.** The anaesthetist may enter any base units. An out-of-range entry is accepted and raises an after-procedure warning for the office (15a's routine). No hard bound. **Superseded 2026-10-08** (the base-unit source) by US-05.1.1 and OQ-62's update: ~~the base units come from the procedure's default RVG Contract (D12)~~ the starting base units resolve from the Contract line, then the procedure's own figure, then its RVG group (19 reads the group and procedure, 19a adds the line layer). How a range is held is OQ-101 (D35) |
| D4 | Child as billable party: block or warn (OQ-54) | 21 | **Answered.** A mild, clearable warning on the to-do list only. No block. **Superseded 2026-10-08** (wording) by US-11.2.4 and OQ-54's update: ~~a child who is the billable party~~ the child is the **payer on the Booking** (prefilled from the patient, editable by the office or the anaesthetist to a guardian); the warning prompts a check of the guardian's details, and there is none when a guardian or an organisation pays |
| D5 | Hard prepayment completion gate (RV-09, OQ-57) | 15a, 27 | **Answered.** No block; a clear warning in both apps. 15a removed the gate and its audited override (session 1, built); 27 strengthens the warning as the procedure date nears |
| D6 | Who raises the prepayment invoice at setup (OQ-58) | 27 | **Answered.** The system generates it when a Procedure matches the anaesthetist's prepaid list, only where the payer on the Booking is a person paying for the patient (D23), and holds it until an admin approves and sends it. Generating it creates the ledger pair and the draft Xero pair (US-06.3.1, US-09.1.3); the approval only sends it. FT-08.1 names it as its one exception. **Superseded 2026-10-08** (the amount and what follows) by US-06.2.2, OQ-04, OQ-38, OQ-61 and OQ-76: ~~an estimate from estimated duration, RVG time and two contingency modifier units~~ the amount is the fixed price on the anaesthetist's own first-party Contract line, always in full (no deposit, no part), shown to the anaesthetist (US-03.1.8); after the procedure nothing is invoiced or credited automatically, either way, and extras or credits are raised by hand (41). When the pair is created is OQ-80 (D38: at generation) |
| D7 | Can an anaesthetist hand a List on without office confirmation (OQ-39)? | 32, 32a | **Answered.** Yes. The anaesthetist returns their own List to the office (it becomes a Draft List) or moves it into a colleague's free session, with no acceptance and no office confirmation. Who is told is answered too (D15). A single Booking can be moved as well (US-01.4.7, 32a). Since 2026-10-07 the anaesthetist sees no preference prompt on their own move (D44) |
| D8 | Receivables ageing and an "Overdue" view (RV-19, OQ-59) | 38 | **Answered.** A flat outstanding list, oldest first, with no buckets, no age chips and no Overdue view |
| D9 | Do billed Lists vanish from the anaesthetist's view (OQ-31)? | 38a | **Answered 2026-10-07** (OQ-31): ~~Open. Default: they stay, shown as "completed, unbilled" and then "billed"~~. A List leaves the anaesthetist's main view once the office has finalised it and sent it to invoicing; the main view starts at today, with earlier Lists not yet invoiced reachable by scrolling back; invoiced work is found by archive or search (US-07.4.1, US-07.4.2, US-03.1.6). Moved from 38 to 38a |
| D10 | How an additional invoice is priced (OQ-45) | 38b | **Answered.** Free-form lines (description, quantity, amount), with no Contract pricing or unit rules. Its other details are answered too (D22). Since 2026-10-07 the anaesthetist can raise one on their own Procedure too, through the same review step (US-08.6.3) |
| D11 | Can a Booking without an NHI be created (OQ-49)? | 40 | **Open**, now leaning to a mandatory NHI: Vanessa (2026-10-07) wants the NHI mandatory and the patient identifier throughout (a temporary NHI where none); whether a Booking without one is refused or held pending is undecided. Default kept: yes, flagged as provisional and on the problem list; its List cannot be authorised until the NHI is added. Keep the rule in one place so "refuse" is a small change |
| D12 | Where base units live, and how a procedure is picked (OQ-62) | 19, 19a | **Superseded 2026-10-08** by US-05.1.1, US-05.1.6, US-04.4.2 (Retired) and OQ-88's update: ~~base units in one or two default RVG Contracts per procedure, which any other Contract may override for a procedure, RVG code or group; one procedure master with a system code per line~~. New reading: two levels, RVG groups as published (plus AA's own) holding the base units, and a curated procedure list, each procedure in exactly one group with an optional own figure; a Contract line may override both; every group has a general procedure; the picker has two tabs (Procedures, RVG codes). No default RVG Contracts. Where the system code sits is still open (OQ-88, D39) |
| D13 | How pre-op and post-op events are modelled (OQ-63) | 38b, 39b | **Answered.** "Event" is the one name for everything recorded against a Procedure after setup: pre-op, post-op, additional invoices and credits. Its own element and its own invoice line; an admin can add one; an invoice tick and a "same as" billable-party tick. Recorded before the Procedure's invoice is approved it travels with that invoice, after it it is invoiced in the next run; one standard review step, no separate approval |
| D14 | Logical model of days, Slots and Lists (OQ-64) | 15b, 28 to 32 | **Answered.** A Slot is a status container a List goes into; every Slot is stored across the horizon (four months in current practice, configurable); statuses are a user-maintained list (fixed ID, editable label and colour), starting from free, on holiday and unavailable; "slot" is never said in the UI; marking unavailable a Slot that holds a List offers return to the office (a Draft List) or assign to a colleague. The room also settled OQ-81 parts 1 and 2 (the calendar is painted before recurring bookings; a recurring booking on an unavailable Slot becomes a Draft List); part 3, short-notice sickness, is open. Since 2026-10-07 a List's states are DRAFT (a Draft List), ACTIVE, SUBMITTED and AUTHORISED (EP-07): 15b renames today's DRAFT to ACTIVE and 31 adds DRAFT |
| D15 | Who is told when an anaesthetist moves their own List (OQ-65) | 32, 35 | **Answered.** A new shared notification pool in the Admin App, one for the whole team and separate from the to-do list; the move posts to it, the office sends the cover-change email from the on-demand button, and the colleague sees the List with a notice. Vanessa agreed the shared pool on 2026-10-07. What else posts, and expiry, are OQ-79 |
| D16 | Contract identifiers and finding Contracts (OQ-66) | 18, 20 | **Superseded 2026-10-08** by OQ-66's update, OQ-78 (answered) and US-04.3.2: ~~the picker filters by procedure then hospital and always offers the default RVG Contract; 19a scopes every Contract to its master procedures~~. The short AA code stays (US-04.1.4, searchable). New reading: No contract (RVG) is offered first for every procedure; then the Contracts valid on the procedure date with a line for the procedure whose holder fits the Booking (the hospital, the surgeon or rooms, and only the Booking's own anaesthetist for a first-party Contract), in one list under holder headings, with one composite search across AA code, holder codes and names; from the RVG codes tab, the lines across the group. The Contract catalogue filters by active or all and by holder. No hospital filter default. Anaesthetists see only their own first-party Contracts |
| D17 | Who a Contract belongs to, and who pays (OQ-67) | 18, 21 | **Superseded 2026-10-08** by OQ-67's update, OQ-78 (answered) and US-11.2.2: ~~no per-Booking override; picking a default Contract asks for the payer's name and email~~. New reading: the Contract decides who is billed through its holder: the holder's billable party when the holder pays AA, otherwise the payer named on the Booking. Every Booking names a payer, prefilled from the patient and editable to a guardian; there is no default Contract asking for payer details. No contract (RVG), the one default, bills the payer on the Booking (Greg may come back on it) |
| D18 | Contract split basis (OQ-68) | 22 | **Superseded 2026-10-05** by US-04.2.12 (Retired) and US-08.2.3: ~~each share a typed $ or %, set on the Booking, defaulting from the Contract~~. New reading: splitting is a user action on the Booking, a Split button on the Procedure's Contract line, each share typed in $ or %, with no setting on the Contract and no default from it |
| D19 | Update email: a prompt or a button (OQ-69) | 35 | **Answered.** An on-demand button on any Booking; the admin picks one or more changes from the change history; no prompt after saving or after a cover change. Templates per kind of change (US-02.3.4). **OQ-82 answered 2026-10-07:** emails stay manual in the first release, for admin and anaesthetist changes alike; sending them automatically is Future (US-02.3.5) |
| D20 | A prepaid Booking moved to another anaesthetist (OQ-70) | 32, 32a, 41 | **Superseded 2026-10-08** by OQ-70's update, US-06.3.5 and US-06.5.4: ~~the move re-checks the prepayment and only the payable half of the draft pair is updated~~. New reading: an honour system. No logic detects a List or Booking move and nothing is re-checked or re-calculated; the anaesthetist who does it keeps the agreed amount and claims no more. Whether the payable is still updated on a move is OQ-80 (D38: repoint only the payee) |
| D21 | A negative invoice with no later payment (OQ-71) | 39a | **Answered.** Handled outside the system: nothing is built (39a's carry-forward and recovery invoice go) |
| D22 | Additional invoice details (OQ-72) | 38b, 39 | **Answered.** "Desc" is description; an additional invoice can go to any billable party; a credit note option credits the original to any party, then new additional invoices are raised; a rebill can start from a copy of the original's lines (US-08.6.6). **OQ-77 parts 1 and 2 answered 2026-10-07:** the rebuilt invoices must equal the credited invoice (against the old recommendation), with the amounts split freely; the credit reverses the linked payable. Part 3 is open (D41) |
| D23 | Prepayment when the patient is not the billable party (OQ-73) | 27 | **Answered.** Only where the payer on the Booking is a person paying for the patient (the patient or, for example, a guardian), never an organisation |
| D24 | Patient balance warning threshold (OQ-74) | 40 | **Answered.** The days count from the invoice date; a credit balance is a mild warning |
| D25 | RVG time rule (OQ-75) | 19a | **Answered.** A part interval is always rounded up under the RVG tiers (15 minutes for the first two hours, then 10). **Superseded in part 2026-10-08:** ~~it feeds the prepayment estimate (27)~~; there is no estimate (US-06.2.4 Retired), so the rule applies to recorded time units only, held as data in 19a |
| D26 | Does the RVG default multi-procedure rule still apply (OQ-90) | 23 | **Open.** Default (its recommendation): keep the RVG default as the one system-wide rule for calculated Procedures: base units on the primary only, time on every Procedure, modifier units on the primary up to a Booking total of four, then split equally with the remainder to the primary (that leg was agreed on 2026-10-07, OQ-15). No per-Contract rules (US-04.2.5, US-05.3.4 Retired). One switchable pure function |
| D27 | Prepaid procedure with no price on the anaesthetist's own Contract (OQ-92) | 27 | **Open.** Default: an office warning through 15a's routine, and the prepayment invoice is held until the office adds a price to that Contract; never an estimate |
| D28 | Insurance indication on the Booking (OQ-93) | 21 | **Open.** Default: a simple insurance or funding indication on the Booking, taken from the source data and editable by the office; it suggests the insurer's Contracts in the picker and raises a soft warning at office review when it says an insurer pays but no insurer Contract is chosen. It never decides who is billed |
| D29 | Age modifier bands and stacking, and no ASA pre-fill (OQ-95) | 19b | **Open.** Default: the patient's age on the procedure date, inclusive lower bounds as printed, no age modifier on the age-split base codes (H6b, P2); no ASA or procedure-default pre-fill (ASA is one of the optional modifiers) |
| D30 | Can the price be changed on a prepaid procedure (OQ-96) | 27 | **Open.** Default: the price on a prepaid Procedure stays the prepaid amount and is locked; any difference is an additional invoice or a credit note raised by hand |
| D31 | Credit note for part of a prepayment (OQ-97) | 41 | **Open.** Default: a credit note for a stated part of a prepayment invoice is allowed, reversing the same amount of the linked payable; credit in full and rebill (39) stays the route for corrections |
| D32 | Plain RVG Contracts of a holder, offered for every procedure (OQ-98) | 18, 19a, 20 | **Open.** Default: a holder's plain RVG Contract has no lines and applies to every procedure at RVG pricing (the anaesthetist's unit value), offered when its holder fits the Booking, as No contract (RVG) is offered by rule |
| D33 | Booking set up without a matched procedure (OQ-99) | 20, 21, 33 | **Open.** Default: the office may leave the procedure blank at setup, or set a group's general procedure from the RVG codes tab, with the Contract chosen by holder or No contract (RVG); a procedure is required before the anaesthetist can mark the Booking complete; Bookings with a blank procedure show on the office's list |
| D34 | Is a Contract schedule upload needed for the first release (OQ-100) | 42 | **Open.** Default: the first release is a developer-run seed load plus office screens, with a second-person check on screen; no in-app Contract schedule upload (US-04.2.13 is Future Work) |
| D35 | How an RVG base unit range is held (OQ-101) | 19, 19a | **Open.** Default: each RVG group holds a starting figure and, where the guide prints one, the published range; the anaesthetist starts from the figure and may pick any value, with an out-of-range warning for the office (D3) |
| D36 | Names for preference lists and priority tiers (OQ-102) | 17 | **Open.** Default: "Not preferred" and "Preferred" for the pairings, and plain tier labels, Tier 1 to Tier 4 with Tier 4 the default, until AA picks names; one label set |
| D37 | Invoice wording for a group's general procedure (OQ-103) | 19, 20, 20a, 21 | **Open.** Default: each general procedure is named by section, tier and code in plain words AA can edit (for example "Head, moderate procedure (H3)"); a plain RVG Contract picked from the RVG codes tab sets the group's general procedure, as No contract (RVG) does; office review flags a Procedure on a general procedure so the office can pick a specific one, without blocking |
| D38 | When a prepayment's pair is created and amended (OQ-80) | 27, 32a, 41 | **Open** (refreshed 2026-10-08). Default: the receivable and payable pair, with its draft Xero pair (ACCREC and DRAFT ACCPAY, as US-06.3.1 and US-09.1.3 say), is created when the prepayment invoice is generated, and the admin's approval only sends it; on a move before the procedure only the payable's payee is repointed (one store action, 41), with no recalculation and no re-check (D20) |
| D39 | RVG code master and procedure master, one list or two (OQ-88) | 19 | **Overtaken in part** by the catalogue: two levels, each procedure in exactly one RVG group, no nesting, a general procedure per group, a Procedures tab and an RVG codes tab (questions 1 and 3; ~~the old recommendation: one procedure master~~). **Open:** where the system code sits. Default: every RVG group and every procedure has a surrogate id and a unique, human-readable system code, both searchable |
| D40 | Contract fixed rate, fixed price and line extras (OQ-89) | 19a, 24 | **Answered in part 2026-10-07:** the Contract's fixed rate is a unit rate in place of the anaesthetist's, for the whole Procedure (no billing line); the fixed discount is a separate, locked setting; add-on flags and quantity rules are dropped (~~the old recommendation: lines keep time bands and add-ons~~). **Open:** the time band, and whether the anaesthetist can add a discount on top of a fixed discount. Default: no time band on Contract lines (the draft design has none), and no anaesthetist adjustment on a line that carries a fixed discount (US-05.4.1); each in one place |
| D41 | Splitting a combined invoice before it is sent (OQ-77 part 3) | 39 | **Open.** Default (its recommendation): a split asked for before the combined invoice is sent uses the same credit and rebill once it is raised, so there is one flow |
| D42 | Who maintains the anaesthetists' own fixed-price Contracts (OQ-91) | 19a, 26, 27 | **Answered 2026-10-08.** The office always creates and maintains them, from the price list each anaesthetist supplies; anaesthetists never create or edit Contracts in the app (US-04.2.14) |
| D43 | Do the supine ('a') Neurosurgery and Spine codes include P1 (OQ-94) | 19b | **Answered 2026-10-08.** P1 is included in the base units of every Neurosurgery code H7A to H9b ('a' and 'b' alike) and every Spine code S1 to S10: a pill pre-selected at 0 units that cannot be unselected (US-05.1.4, from the included-modifiers CSV, AR-34) |
| D44 | What the blacklist warning shows an anaesthetist (OQ-43) | 17, 31, 32, 32a | **Answered 2026-10-07.** Pairing preferences are private and two-way, admin only (not preferred and preferred, US-13.6.3, US-13.6.4); admin get a soft warning when assigning or moving a List, never a block; there is no warning at all when an anaesthetist hands on their own List (US-01.4.5); the name "blacklist" goes (OQ-102, D36) |
| D45 | Which date decides the price in force (OQ-48) | 18 | **Answered 2026-10-07.** The procedure date. Validity sits on the Contract version, and a price review creates a new dated version (US-04.2.10) |
| D46 | Should anaesthetists browse and pull Draft Lists (OQ-86) | 31 | **Answered 2026-10-07: no.** Assigning Draft Lists is an office job; anaesthetists never browse or claim them |

## Tracks

```
Foundations  14 demo-trigger registry · 15 Card becomes Booking · 15a warnings & to-do list
             ─▶ 15b Copy and photo capture out, DRAFT becomes ACTIVE
Money fix    16 AA fee as a monthly invoice                                    (after 15b)
Contracts    17 surgeons, rooms, preferences & tiers ─▶ 18 holders & dated Contracts
             ─▶ 19 RVG groups, procedures & two-tab picker ─▶ 19a Contract lines & resolver
             ─▶ 19b modifiers ─▶ 20 one Contract per Procedure ─▶ 20a source wording & stack
             ─▶ 21 payer on the Booking & completeness ─▶ 22 invoice delivery & split
             ─▶ 23 primary, multi-procedure & combinations ─▶ 24 price precedence & adjustment
             ─▶ 25 lock at AUTHORISED                                (19 and 21 after 15a)
Prepayment   26 prepaid settings & profile ─▶ 27 prepayment lifecycle           (after 25, 15a)
Schedule     28 Slot/List split ─▶ 29 availability ─▶ 30 conflicts ─▶ 31 Draft Lists
             ─▶ 32 own List moves & notification pool ─▶ 32a single-Booking moves
Intake       33 matching screen ─▶ 34 sync & S1 rebuild ─▶ 35 explicit save & update email
                                                                 (33 after 20a; 35 after 32)
Money        36 internal ledger ─▶ 37 Xero resilience & monitor │ 38 web accounts
             │ 38b events & additional invoices ─▶ 39 credit notes & rebill
             ─▶ 39a weekly payment runs                                       (after 37, 39)
Capture      38a main view, archive & search (after 28, 38) ─▶ 38b ─▶ 39b pre-op & post-op events
Patients     40 missing NHI, balance warning, patient view ─▶ 40a NHI lookup & identity
Late         41 prepayment letters, settlement by hand, trust & refunds ─ 42 reference data & loads
             ─ 43 scale & privacy ─ 43a sign-in & ease of use
Demo         44 demo guide rewrite & final sweep
```

## Phases

| # | Phase | Delivers | Depends on | Covers (gaps / DM / RV) |
|---|-------|----------|------------|---:|
| 14 | [Screen-contextual demo triggers](phases/phase-14-demo-trigger-registry.md) | **Built.** A shared, route-scoped trigger registry and a context hook in `src/shared`. A "Demo actions" menu in the harness bar and a PWA demo-actions sheet. Every existing Control Panel trigger re-homed to its screen; the Control Panel becomes the index. "Office authorises this List" on the PWA. Interim Future-scope badges on the HL7/FHIR tooling. First new trigger: "Simulate sign-in attempts" | none | 1 / 0 / 0 |
| 15 | [Card becomes Booking](phases/phase-15-booking-rename.md) | **Built.** Card renamed to Booking across the model, ids, audit, seed, routes, registry and copy. Adds List-level attachments, an optional Booking source, and Copy as a skeleton-only new Booking (now Retired: 15b removes it) | none | 1 / 2 / 2 |
| 15a | [Warnings and the to-do list](phases/phase-15a-warnings-and-to-do-list.md) | **In progress.** One pure warning routine with Warning records on the Booking (session 1, built, with the prepayment gate replaced by a warning, D5). A to-do list on the Admin dashboard with Clear, a warning triangle on Bookings in all three apps, the warning visible on opening a Booking, the Day view outline down to the Booking, and no confirm step at submit. Keeps its 2026-10-03 drift-check baseline (the commit its doc names); its doc's dated "Requirements changed since session 1 (2026-10-08)" section lists what session 2 builds differently | 14, 15 | 4 / 1 / 0 |
| 15b | [Copy and photo capture out, and DRAFT becomes ACTIVE](phases/phase-15b-copy-and-photo-removal.md) | Copy a Booking removed from all three apps, the store, the seed and the guide. Photo capture out of the Add a booking chooser, kept at most as a badged Future-scope demo. The List state the prototype calls DRAFT renamed ACTIVE everywhere (RV-36), with no behaviour change, so every later phase works in the new lifecycle's words | 15a | 0 / 0 / 2 |
| 16 | [AA fee as its own monthly invoice](phases/phase-16-aa-fee-invoice.md) | Step 1: the payable equals the receivable, and a part payment releases exactly what was received. Step 2: AA fee settings and a monthly run raising one AA-FEE invoice per anaesthetist (fixed items plus a per-BCTI charge, D1, counted by one pure function), shown in Admin and web Accounts. Xero pairs carry the invoice number and reference, and Xero holds no patient names, only the hidden ID | 15a, 15b | 8 / 1 / 1 |
| 17 | [Surgeons, rooms, pairing preferences and priority tiers](phases/phase-17-surgeons-rooms-blacklist.md) | Surgeon profile with one HPI CPN field, surgeons' rooms with contacts, surgeon groups and a hospital contact email. Private two-way pairing preferences (not preferred and preferred) on surgeon and anaesthetist records, admin only (D44), and an admin-only priority tier per anaesthetist (D36). One shared helper separates not-preferred candidates with a soft warning and orders by tier, shuffled within a tier, on every office pairing path | 14, 15 | 7 / 2 / 0 |
| 18 | [Contract holders and dated Contracts](phases/phase-18-contract-model.md) | A contract-holder master (third or first party, holder is billed, billable party, anaesthetist). Contracts as dated versions with a new-version flow (D45), a short AA code, composite search and active and holder filters, office-only editing. One stored No contract (RVG) replacing the per-hospital and per-insurer default Type 1s (RV-33). Type 1/2/3 gone as categories with fees unchanged; the ACC review flag gone | 17 | 7 / 3 / 2 |
| 19 | [RVG groups, procedures and the two-tab picker](phases/phase-19-rvg-and-procedure-masters.md) | RVG groups under body sections (base units, modifier units, starting figure and range) plus AA's own, a curated procedure list with a general procedure per group, office-maintained and audited. A two-tab picker (Procedures, RVG codes) on mobile, web and Admin. Any base-unit value accepted, with an after-procedure office warning when out of range (D3) | 15a, 18 | 4 / 1 / 1 |
| 19a | [Contract lines and the starting-units resolver](phases/phase-19a-default-rvg-contracts.md) | Contract lines (one per procedure: fixed price, fixed rate, fixed discount, base and modifier units, holder code) replacing ContractPrice and the Type 2 terms, with no ordinal key (RV-34). The anaesthetists' own fixed-price Contracts, kept by the office (D42). The line, procedure, RVG group resolver with each value's layer, and the RVG time tiers held as data | 18, 19 | 4 / 2 / 1 |
| 19b | [Modifiers: the RVG table, locked age and included modifiers, explanations](phases/phase-19b-modifiers.md) | The modifier master seeded from the NZSA RVG 2021 table (AR-34) plus AA's own. Modifiers as itemised records on the Procedure, each optional one with a short explanation asked for when it is claimed. Age (A1, A2) and included P1 on every Neurosurgery and Spine code applied and locked (D43). The ASA card and its seeding, absorbed-modifier refusals and procedure-default pre-fill gone | 19a | 5 / 1 / 3 |
| 20 | [One Contract per Procedure](phases/phase-20-one-contract-per-procedure.md) | Billing route, payment category (everywhere, for an interim office-set prepayment flag) and the Procedure's insurer removed. Exactly one Contract per Procedure, mandatory at setup, with a "needs a Contract" list and no hospital default. One picker after the two tabs: No contract (RVG) first, then fitting Contracts under holder headings, composite search, and the RVG-code route to lines across the group. The anaesthetist may change procedure or Contract until submit, flagged at review | 19a, 19b | 10 / 1 / 1 |
| 20a | [Source wording and the three-part Procedure stack](phases/phase-20a-source-wording-and-procedure-stack.md) | Each Procedure keeps the text as received from every intake path, never overwritten, with an optional "as given" on manual entry. Every booking screen in both apps shows each Procedure as source wording, then procedure and RVG code, then the Contract (name, holder, who is invoiced, pricing basis with figure). Demo wording seeded from AR-35 | 20 | 4 / 1 / 0 |
| 21 | [Payer on the Booking, who is billed, and completeness](phases/phase-21-billable-party-and-required-inputs.md) | A payer on every Booking, prefilled from the patient and editable to a guardian; who is billed decided by the Contract's holder or that payer; the guardian override gone. An insurance indication with a review warning (D28), a child-payer warning (D4), holder references, and completion needing a procedure, a Contract, references and modifier explanations. Review shows the stack, the payer and the warnings | 15a, 20a | 10 / 3 / 1 |
| 22 | [Invoice presentation, delivery and the split](phases/phase-22-invoice-presentation-and-delivery.md) | Invoice issued in the anaesthetist's name with AA as agent. Contract-driven layout, delivery and GST, prices held ex GST. The run sends each invoice to email or portal. A Split button on a Procedure's Contract line with typed $ or % shares (D18) replaces `funderOverride`. Provisional BCTI wording on the ACCPAY, still one BCTI per receivable invoice | 21 | 6 / 1 / 1 |
| 23 | [Primary Procedure, multi-procedure rule and combination Contracts](phases/phase-23-primary-procedure-and-multi-procedure-rule.md) | Exactly one primary Procedure, with "Make primary" on every surface and the feed. The RVG default multi-procedure rule for calculated Procedures with the 3/2/2 modifier split (D26), no per-Contract rules. Combination Contracts with a line under each parent procedure | 19b, 22 | 5 / 1 / 1 |
| 24 | [Price precedence, fixed rate and discount, and the anaesthetist adjustment](phases/phase-24-anaesthetist-adjustment.md) | One price precedence with a recorded price source and engine rejections: office override, the anaesthetist's typed price on adjustable Contracts only, the line's fixed price as the whole price, then BTM x the fixed rate or the anaesthetist's unit value less a locked fixed discount. The anaesthetist adjustment on No contract (RVG) and own Contracts only; third-party prices read-only. The hourly rate x time line and Method 3 gate gone | 23 | 8 / 3 / 2 |
| 25 | [Contract versions and the AUTHORISED lock](phases/phase-25-contract-lock-at-authorised.md) | A pricing snapshot per Procedure written at authorise (procedure, Contract version, resolved values and layers, BTM, rate and discount, price and source, payer or billable party, payee). The engine prices only from it. Versions listed with their invoices. "Regenerate from locked data". The billing-failure trigger is re-based | 19a, 22, 23, 24 | 6 / 1 / 1 |
| 26 | [Prepaid settings and anaesthetist profile](phases/phase-26-prepaid-settings-and-profile.md) | An anaesthetist profile on mobile and web: unit value, GST period, HPI CPN, GST number, bank details and a prepaid tick list of procedures and whole RVG groups, showing each fixed price from their own Contract. Admin can edit it on the anaesthetist's behalf | 19a, 20 | 6 / 1 / 0 |
| 27 | [Prepayment lifecycle](phases/phase-27-prepayment-lifecycle.md) | Prepayment derived from the prepaid set for a payer who is a person (D23). The amount is the anaesthetist's own fixed price, in full, shown to them; a missing price warns the office (D27). The invoice generated at setup with its ledger pair and draft Xero pair, and sent on admin approval (D6, D38). A prepaid Procedure priced at the prepaid amount, locked (D30), with nothing left to bill. Part-paid tracking, an escalating warning, and re-checks on a change of Procedures, Contract or payer, never on a move | 15a, 21, 25, 26 | 10 / 1 / 1 |
| 28 | [Slot and List split](phases/phase-28-slot-list-split.md) | A Slot record for every active anaesthetist's session across a configurable horizon, free by default, holding availability and default times (D14). A List with its own id, created on assignment and shown in place of the status. Status independent of bookings in all three apps and the finders, the admin finder ordered by tier with not-preferred pairings apart. Added anaesthetists on the Admin Day grid. Reassign moves a List between Slots | 15b, 17 | 8 / 2 / 1 |
| 29 | [Availability calendar and status master](phases/phase-29-availability-calendar.md) | Availability kept from a calendar on mobile and web as the Slot's own status, with days off ahead, series and single-instance edits. Web parity. Slot statuses become a user-maintained master list with fixed IDs, editable labels and colours, separate from the List's state | 28 | 5 / 0 / 0 |
| 30 | [Conflicts, holidays and the conflict dashboard](phases/phase-30-conflicts-and-holidays.md) | Conflicts raised on every path, with a List colour change and clearing. Holidays can be edited and deleted. A cross-date conflict dashboard. Permanent Lists become recurring bookings (DM-53), retirable, and edits repopulate the canvas | 29 | 5 / 1 / 0 |
| 31 | [Draft Lists and the day dashboard](phases/phase-31-draft-lists.md) | The DRAFT state (EP-07): Draft Lists with hospital, surgeon, day and session required, able to hold Bookings, flagged "unassigned" with waiting time in one date-sorted place, assigned by the office only (D46) with the preference and tier helper, becoming ACTIVE, removed or re-dated. A recurring booking on an unavailable session becomes a Draft List. The pairing rule is enforced. The Day dashboard shows Draft Lists and booking counts | 17, 30 | 11 / 2 / 0 |
| 32 | [Anaesthetist moves their own List, and the notification pool](phases/phase-32-swap-requests.md) | An anaesthetist returns their own List to the office (it goes back to DRAFT) or moves it into a colleague's free session, at once, with no preference warning (D44), also when they mark a booked session unavailable. No prepayment re-check (D20). Every move posts to a shared notification pool in the Admin App (D15). The cover-request marker is gone | 29, 31 | 6 / 2 / 2 |
| 32a | [Anaesthetist moves a single Booking](phases/phase-32a-single-booking-moves.md) | An anaesthetist moves a single Booking to a colleague found by search, only onto an available session, landing on the colleague's List (created if needed), with the payable following (the doer rule), no prepayment re-check and a pool notification | 32 | 3 / 1 / 0 |
| 33 | [Hospital download and the matching screen](phases/phase-33-hospital-matching-screen.md) | Imported rows, each showing its procedure text as received, are matched, used to create a Booking, a List or a Draft List, or rejected, with field differences and change types; a later update is matched by date, surgeon, location and session. An unmatched queue. No automated decisions. Created Bookings wait for the office to set their Contract | 20a, 31 | 7 / 1 / 2 |
| 34 | [Hospital sync, manual sheets and the S1 rebuild](phases/phase-34-hospital-sync-and-s1.md) | Sync from St George's and Southern Cross only, into the matching queue. Manual-provider sheets with a demo auto-match toggle. The HL7/FHIR simulator and monitor, and surgeon PDF ingest, are demoted to a Future-scope surface, and S1 is rebuilt around sync, match, the source wording and the office's Contract choice | 33 | 2 / 0 / 3 |
| 35 | [Explicit save and the update email](phases/phase-35-explicit-save-and-update-email.md) | Admin draft-then-save with change sets and as-at history. An on-demand mailto update email picked from the change history (D19), started from a per-kind template, to the rooms or the hospital, including from a List-move notification; manual only. Add a Booking to a booked List with an optional "as given", edit the NHI, correct a submitted description | 17, 25, 32, 33 | 5 / 1 / 1 |
| 36 | [Internal ledger and balance views](phases/phase-36-internal-ledger.md) | BillingCase promoted to linked receivable and payable legs as the system of record (one payable leg per receivable), with the payee stamped at authorise. Phase 16's BCTI count re-reads from the ledger with a parity test. An Admin Ledger screen (whole ledger and per anaesthetist) with an imbalance indicator | 16, 22, 25, 27 | 6 / 2 / 0 |
| 37 | [Xero mirror resilience and the processing monitor](phases/phase-37-xero-mirror-resilience.md) | Disbursement detected from Xero. Bulk hospital remittance left in Xero. An outage queue with backoff. A void made in Xero is flagged. The processing monitor grouped by anaesthetist, with sorting, filtering, a problems-only view and "Open in Review" on Lists awaiting approval (authorising stays on Review) | 36 | 4 / 0 / 0 |
| 38 | [Web accounts, outstanding list and GST schedule](phases/phase-38-web-accounts-truth.md) | A ledger-backed financial position with the Productivity and Leave panels removed. A flat outstanding list with no ageing (D8). A cash-basis GST schedule of payables actually paid, with a balance check | 36 | 5 / 1 / 3 |
| 38a | [The anaesthetist's main view, archive and search](phases/phase-38a-find-past-work.md) | The main view on mobile, web and the PWA starts at today, with earlier un-invoiced Lists reached by scrolling back and submitted ones marked; invoiced Lists leave it (D9). A calendar archive that jumps to any past day and drills to List, Booking and Procedure, invoiced work included, and a search for Bookings by NHI or patient name | 28, 38 | 6 / 0 / 0 |
| 38b | [Events on a Procedure and the additional invoice](phases/phase-38b-events-and-additional-invoices.md) | The event element on a Procedure with one standard review step and next-run invoicing (D13), and the events list on every Procedure in all three apps. A free-form additional invoice to any party (D10, D22), raised by the office or by the anaesthetist on their own Procedure, recorded as an event, replaces the addendum Booking | 36, 38a | 3 / 2 / 1 |
| 39 | [Credit notes, credit-and-rebill and the combined split](phases/phase-39-additional-invoices-and-credit.md) | A credit note option to any party (D22), for the office and for the anaesthetist on their own Procedure, credit in full and rebill from a copy of the original's lines, and a combined Procedure split by credit then per-component invoices that equal the credit, each reversing the ledger, the payable and Xero, with a negative invoice to an anaesthetist already paid. Credits recorded as events on 38b's element; credit notes audited | 23, 38b | 6 / 2 / 0 |
| 39a | [Payment runs: the weekly cycle, BCTI approval, netting and remittance](phases/phase-39a-payment-runs-and-remittance.md) | A weekly ISO-week payment cycle (Friday close, Monday checks, Tuesday schedule, anomalies rolled forward) with an approve-for-payment step for the period's BCTIs, negative invoices netted per anaesthetist, and a remittance advice in Admin and web Accounts. A negative with no later payment is handled outside the system (D21) | 37, 39 | 4 / 1 / 0 |
| 39b | [Pre-op and post-op events](phases/phase-39b-pre-and-post-op-events.md) | Pre-op and post-op events on a Procedure from mobile, web and Admin (date, time or fixed fee, invoice tick, billable party), as new kinds on 38b's element: on the Procedure's invoice before approval or invoiced in the next run after it, through one review step (D13), shown in the Procedure's events list. The ACC pre-op assessment as a fixed-fee pre-op event. Billing lines with their own date and preset types | 24, 38a, 38b | 5 / 0 / 0 |
| 40 | [Patients: missing NHI, balance warning, patient view](phases/phase-40-patients-and-alerts.md) | A patient record with invoices, follow-up actions and re-send. A missing-NHI problem list with attach and merge, and an authorise guard (D11 default). A mild or strong warning at booking when the patient paying owes money, counted from the invoice date, and a mild one for a credit balance (D24), with one admin-editable threshold field (not a warnings settings page) | 15a, 34, 36, 39 | 7 / 1 / 1 |
| 40a | [NHI lookup and identity standards](phases/phase-40a-nhi-lookup-and-identity.md) | NHI lookup with validation at entry, Hub states with a manual fallback, a purpose statement and refresh from the register, on the 2026-10-08 add-booking forms (ACTIVE Lists, the two-tab picker, the payer on the Booking). HPI CPN shown consistently | 26, 40 | 2 / 0 / 0 |
| 41 | [Prepayment letters, settlement by hand, trust account and refunds](phases/phase-41-prepayment-followup-credits-refunds.md) | Prepayment letters stating the prepaid amount as the price, and reminders. Settlement with nothing automatic: by-hand additional invoices and credit notes on a prepaid Procedure, a part credit of a prepayment allowed (D31). A provisional trust account holding prepayments until the procedure, refund on cancellation, only the payable's payee repointed when a prepaid Booking moves (D38), and a fresh prepayment at the new anaesthetist's own price on rebooking | 27, 32a, 39, 39a | 8 / 1 / 0 |
| 42 | [Reference data and controlled loads](phases/phase-42-reference-data-and-loads.md) | Every master editable, including hospitals, insurers, recurring bookings and public holidays. A spreadsheet loader with row validation for RVG groups and procedures, contract holders, Contracts and lines (blank inherits, 0 is zero), modifiers and calendars; no Contract schedule upload (D34). A clean-cut go-live demo | 17, 18, 19, 19a, 19b, 29, 30 | 4 / 1 / 0 |
| 43 | [Scale and privacy](phases/phase-43-scale-and-privacy.md) | A full-scale in-memory dataset with timings (the processing monitor included), generated in the 2026-10-08 shapes (recurring bookings, holder-fit Contracts or No contract (RVG), a payer on every Booking), a restricted raw-row view, an NHI leak scan and a synthetic-data badge | 34, 36, 37, 42 | 2 / 0 / 0 |
| 43a | [Sign-in and ease of use: simple anaesthetist screens and point-of-need help](phases/phase-43a-ease-of-use.md) | A simulated PWA sign-in with sign-out. Anaesthetist screens free of office-only Contract complexity while keeping the three-part stack and the price fields the catalogue gives them, and point-of-need help on mobile capture, Admin Day and Admin Review, with a first-run hint per app | 20a, 21, 24, 31, 39b | 2 / 0 / 0 |
| 44 | [Demo guide rewrite and final sweep](phases/phase-44-demo-guide-rewrite.md) | S1 to S5 rewritten, Control Panel jumps rebuilt, stale copy swept, master guide regenerated in full, trigger and PWA-parity audit, PROGRESS entry | all | 0 / 0 / 1 |
| | **Total** | 220 gaps, 46 DM and 34 RV closed; none parked. Built 14 and 15 also list four items that now Match or are closed (FT-13.5, US-03.1.3, DM-01, RV-12) | | **222 / 47 / 35** |

## Sequencing rules

- **14 and 15 are built.** 15 renamed Card to Booking before any phase that edits booking code.
- **15a is in progress.** Session 1 (work items 1 to 8: the pure routine in `src/domain/warnings`,
  the app-settings record, `warningClearances`, the `store/warnings.ts` selectors, the audited
  `clearWarning`, the gate and override removed per D5, the stop-gap banner, `PERSIST_VERSION` 16) is
  committed at `b342a7d` and is never rewritten or undone. Session 2 (items 9 to 15: surfaces,
  triggers, review, the to-do list) is updated in place. By the owner's exception, 15a's doc and
  prompt keep their 2026-10-03 drift-check baseline (the commit the doc names, before the catalogue
  moved); instead the doc carries a dated "Requirements changed since session 1 (2026-10-08)" section
  near the top, which the prompt points at, saying per area what session 2 builds differently
  (mostly nothing: its covered items changed only in formatting). A change
  that would undo session 1 is not planned but reported as NEEDS OWNER. 15a runs before 19, 21, 27 and
  40, which each register a warning rule into its routine (19 out-of-range base units; 21 a child
  payer and insurer-will-pay with no insurer Contract; 27 prepayment escalation and a prepaid procedure
  with no price; 40 a paying patient with a balance).
- **15b runs straight after 15a, before 16.** It removes Copy a Booking (Retired), takes photo
  capture out of the Add a booking chooser, and renames the List state DRAFT to ACTIVE (RV-36), a
  mechanical rename re-greened on its own, so no later phase writes "DRAFT" for an assigned List.
  The DRAFT state itself, meaning a Draft List, arrives in 31. RV-03 and DM-39 stay on built 15's
  covers.
- **16 runs straight after 15b, by design.** The fee fix is isolated and cheap, and it changes the S3
  figures. Step 1 (fee removal) is re-greened before step 2 (the monthly fee invoice) starts. The
  first milestone (after 16) includes the warnings, the removals and the ACTIVE rename.
- **BCTI granularity is built one way and labelled provisional.** The catalogue says both "one BCTI
  per procedure" (US-09.1.4 note, OQ-29, the 2026-10-01 note #41) and "the same value as its
  receivable" (OQ-42), and a receivable can hold several Procedures, so both cannot hold (DM-22 says
  as much). The plan builds one BCTI, the ACCPAY, per receivable invoice, the same value: the
  transcript's "per transaction" (B L71-81), and what US-10.2.1's release needs. 16 counts BCTIs for
  the fee run through one pure, tested function (each once against the anaesthetist who did it, and,
  per Greg's 2026-10-02 view, only once paid, both switchable there); 22 (a split gives two invoices,
  so two BCTIs), 36 (the ledger's payable legs), 38b (additional invoices), 39 (re-issued invoices;
  whether a credit note or negative invoice counts is OQ-60) and 39b (event invoices) feed it and
  keep it the only count, and 36 adds a parity test. "One per procedure" stays an open point to
  raise with AA's accountant beside OQ-29 and OQ-60; if it flips, the count function, the $700 seed
  and the S3 and S4 figures are re-baselined in one place.
- **The pricing model lives in one place.** The draft technical design v4
  ([AR-29](../../../requirements-board/requirements/artifacts/AR-29.md), regions such as
  `data-model`, `contract-holder-fields`, `contract-fields`, `contract-line-fields`,
  `booking-procedure-fields`, `contract-selection`, `resolver-layers`, `null-handling`,
  `price-validation`, `price-precedence`, `pricing-snapshot`, `billable-party`, `prepayment`,
  `contract-versions`, `data-loading`) and its ERD
  ([AR-30](../../../requirements-board/requirements/artifacts/AR-30.md): `rvg-group`, `procedure`,
  `contract-line`, `contract`, `contract-holder`, `booking-procedure`) are the reference shape for RVG
  groups, procedures, contract holders, Contracts, Contract lines and booking procedures. They are a
  **draft**: a v5 may change them before or during the build. So every phase that builds these
  structures (18, 19, 19a, 19b, 20, 20a, 21, 23, 24, 25, 27) keeps the structures, the resolver and the price
  precedence in **one place in `aa-prototype/src/domain/billing`** (plus the seed), behind types the
  UI reads, so a later design change stays a contained edit; each such phase doc says so in its Goal
  or Work items and links the plain-language guide
  ([AR-28](../../../requirements-board/requirements/artifacts/AR-28.md), true as written), AR-29 and
  AR-30 at the regions it builds. Modifiers are seeded from `NZSA RVG 2021 modifiers.md` and
  `NZSA RVG 2021 included modifiers.csv` (artifact AR-34), never re-transcribed from the RVG.
- **Old-model matches are carried across.** Several items grade Matches only because of the old
  model: US-05.2.6's fixed rate (through Type 2's `agreedUnitRate`), FT-03.2's primary Procedure,
  US-05.2.1, US-05.2.7 (ex-GST prices), US-05.3.5, US-05.4.2 (office override), FT-08.2's grouping and
  FT-05.5's ACC as an ordinary holder. 18 keeps the Type 2 and Type 3 terms in place while it rewrites
  the Contract (DM-07); 19a moves them onto lines; 20, 21, 23 and 24 keep the rest working. Each says
  so, with a parity test.
- **The Contracts track runs strictly in order: 17, 18, 19, 19a, 19b, then 20 to 25.**
  - 17 builds the preference and tier helper every office pairing path reuses (28, 31), and the
    privacy boundary that keeps preferences and tiers out of the anaesthetist apps.
  - 18 rewrites the Contract around holders and dated versions and replaces the default Type 1s with
    No contract (RVG); it keeps today's resolver and route so the app stays green until 20.
  - 19 (RVG groups, procedures, the two-tab picker), 19a (Contract lines, the resolver, first-party
    price lists, time tiers) and 19b (modifiers) come before 20 so the procedure, the lines, the
    starting units and the modifiers are final before 20's Contract picker, 23's Booking-level pass
    and 25's lock build on them. 19a needs 19's procedures, because a line is keyed by procedure.
  - 20 leaves three interims: who is billed is the holder's billable party (when the holder is
    billed), else the Procedure's existing `billablePartyId` override (the seeded guardians), else the
    patient, until 21 re-expresses the override as the payer on the Booking; the seeded
    `funderOverride` two-funder split stays until 22's Split button; and an office-set
    `prepaymentRequired` flag on the Booking stays until 27 derives it.
  - **20 owns removing `PatientPaymentCategory`** (about 15 non-test files read it) everywhere, not
    only as a pricing input: its prepayment meaning becomes that interim flag, which carries today's
    `prepaymentDetail` (full or split, deposit) unchanged. 27 then removes only the interim flag, the
    deposit and split paths and `prepaymentDetail` (about 9 non-test files).
  - 20a runs straight after 20, so the stack's Contract part has a Contract to show, and before 21's
    review and 33's matching screen, which both show the stack. Its "who is invoiced" and "pricing
    basis" read one selector each, which 21 and 24 re-point.
  - 23 builds the combination Contracts 39 needs to split a combined Procedure.
  - 24 builds the one price precedence, the fixed rate and discount on lines, and the adjustment.
  - 25 locks what 18 to 24 built, in a pricing snapshot per Procedure.
- **26 and 27 run back to back, after 25.** 27 also needs 21's payer on the Booking (prepayment is
  only for a person paying). Generating the prepayment invoice creates its ledger pair and its draft
  Xero pair (US-06.3.1, US-09.1.3, which Matches today and must not regress; D38); the admin's
  approval only sends it. There is no estimate and no excess path any more: a prepaid Procedure is
  priced at the prepaid amount (US-06.4.1), so the deduction leaves nothing to bill; the
  `negativeTotal` guard stays for every other negative.
- **The Schedule track runs strictly in order, 28 to 32a.** 28 is the Slot/List foundation (every
  Slot stored, free by default, over a configurable horizon) and needs 15b's ACTIVE rename and 17's
  helper (the admin finder orders by tier). 31 adds the DRAFT state with Draft Lists and reuses 17's
  helper; 32 needs 31 (a List returned to the office goes back to DRAFT) and builds the notification
  pool 35 reads. **32 no longer needs 27**: a move re-checks no prepayment (honour system, D20). 32a
  extends 32's move helpers to a single Booking and carries the doer rule.
- **Intake (33 to 35) runs after 31 and 20a**, because a row can create a Draft List, a created
  Booking waits for the office to set its Contract, and every row and Booking shows the source
  wording. 34 needs only 33. 35 also needs 25's versioned history and 32's moves (the cover-change
  email is reached from a List-move notification).
- **Money:** 36 runs after 16, 22, 25 and 27 (it re-points prepayment status and AA fee invoices).
  Then 37 and 38 can run in any order (38 needs only 36: the "billed Lists stay visible" work that
  tied it to 28 moved to 38a); 38a after 28 and 38 (its main view lists 28's Lists); 38b after 36 and
  38a (the anaesthetist reaches
  an invoiced Procedure through 38a's archive or search, since invoiced Lists leave the main view). 39
  runs after 23 and 38b (credits are events on 38b's element). 39a runs after 37 and 39 (it records
  the weekly payment runs and nets 39's negative invoices).
- **Capture:** 39b runs after 24, 38a and 38b, because 38b builds the event element 39b adds pre-op
  and post-op kinds to, and soon after 38b, because 38b withdraws the anaesthetist's post-op Card flow
  that 39b brings back as events. It needs nothing from 39 or 39a, so it may run straight after 38b.
- **The remaining phases:**
  - 40 runs after 15a, 34, 36 and 39 (a patient credit balance needs 39's credit notes); 40a after
    26 and 40.
  - 41 runs after 27, 32a, 39 and 39a (it needs 38b's and 39's by-hand routes, the ledger, the weekly
    run, and adds the payee repoint to 32's and 32a's moves).
  - 42 runs after every master-data phase (17, 18, 19, 19a, 19b, 29, 30).
  - 43 runs after 34, 36, 37 and 42, late because its generator follows the final model: Slots and
    Lists, recurring bookings (not Permanent Lists), RVG groups and procedures, contract holders,
    Contracts and lines, each Procedure's Contract by 20's rules (No contract (RVG) or a holder-fit
    Contract, never a hospital or procedure default), a payer on every Booking (21) and first-party
    Contracts for any generated prepaid set. 43a runs after the capture and review screens settle
    (20a, 21, 24, 31, 39b).
  - 44 runs last.
- **Contracts and Schedule are independent from 17 until 33.** Contracts go first because the track
  is mostly Confirmed and carries the S3, S4 and S5 money beats.
- **Vocabulary.** Booking, not Card; move or reassign, never swap; never "timesheet". Per OQ-64,
  "slot" never reaches app copy (say session, AM or PM); Slot stays a code and planning word. A
  List's states are DRAFT (a Draft List, no anaesthetist), ACTIVE, SUBMITTED and AUTHORISED; never
  "DRAFT" for an assigned List after 15b. "Draft List" is kept. "Not preferred" and "Preferred", never
  "blacklist" or "whitelist" in app copy (D36). The catalogue's Procedure is the design's booking
  procedure; "procedure" alone means a procedure-list entry. "Event" is the one name for everything
  recorded against a Procedure after setup; keep its user-facing label in one place (38b builds it),
  because Greg was unconvinced by it. The prepaid amount is never called an estimate or a deposit.
- **Open questions with a recommendation are built as that recommendation** (the D26 to D41
  defaults) and labelled provisional, each kept in one place so a different answer is a small change.
- **Every phase opens with a drift check** against `60e2d1e` (15a: against its 2026-10-03 baseline,
  read with its dated section) for its items and linked OQs, and confirms any owner decision it
  depends on.
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
    model, the 5% fee netting, Copy as an additional procedure and then Phase 15's skeleton Copy,
    binding convention 6's DRAFT for an assigned List, absorbed P1 modifiers, the 2026-07-22 ASA
    seeding values, the protected default Type 1 per hospital and insurer, the Method 3 hourly rate
    line, the guardian override record, the 2026-09-28 fee hidden from the anaesthetist (where the
    catalogue now shows the Contract's price), the addendum Card, the prepayment completion gate, the
    overpaid prepayment's `negativeTotal` failure, the prepayment estimate and deposit, the silent BTM
    fallback, availability reconciliation's conflict flag, office write-through per tap, the
    cover-request flow, hospital auto-apply and Phase 14's keeping Surgeon PDFs in scope.
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

**Placement notes for the 2026-10-08 update** (catalogue `60e2d1e`).

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

**Earlier placement notes** (historical; the 2026-10-08 notes above win where they differ).

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
"Colleague moves a List into my free session" (32), "Colleague moves a Booking to me" (32a),
"Hospital row arrives and the office matches it" (33), "Office reviews this additional invoice"
(38b), "Office reviews this event" (39b), "Office attaches the NHI" (40) and "Sign out" (43a). These
stand-ins show on the PWA only: in the framed build the presenter plays the office in Admin. "Play
the office" (RV-22) stays as a signposted scaffold, defaults to OFF and shows a badge when on, and
loses nothing because 14 added the per-List trigger. Phase 44 checks PWA parity beat by beat.

### Demo guide

- **Each phase patches the beats it breaks,** in the same session: `docs/demo-guide` (run sheet,
  cheat sheet, workflows, personas), the matching sections of `master-demo-guide.html`, and the
  Control Panel scenario text. The self-contained guide presenters use is never more than one phase
  stale. Each phase doc names the beats in its "Demo guide updates" section.
- **Each milestone phase (16, 25, 27, 32a, 35, 39a) ends with a consistency read** of
  `master-demo-guide.html` against the run sheet.
- **Phase 44 rewrites the S1 to S5 run sheet** around the new model and regenerates
  `master-demo-guide.html` in full.
- **Known beats the 2026-10-08 changes break, and who patches them:** 15a turns S4 Beat 1's gate into
  a warning, with no confirm step; 15b drops the Copy lines and the "DRAFT" wording for an assigned
  List; 17 S2 Beat 3's reassign (preferences apart, tier order); 18 the cheat sheet's Contracts section
  (Type 1/2/3 and "every hospital and insurer must have a protected default Type 1") and S5 Beat 4's
  "Health NZ agreed rate (Type 2)"; 19 and 19b S1 Beat 3's capture (the two-tab pick; no ASA seeding,
  itemised modifiers with explanations, locked age and P1), the workflows doc's "She records ASA" and
  the personas doc's "Record ASA"; 20 S1 Beat 1 and S2 Beat 2 (no hospital default Contract: the office
  sets it, No contract (RVG) first); 20a S1 Beat 2 (the stack); 21 S3 Beat 1 (who is billed); 22 S3
  Beat 1's "Funder allocation" aside (the Split button); 25 S4 Beat 3 and S5 Beat 4; 27 S4 Beat 1
  (the anaesthetist's own fixed price, generated, approved and sent; no estimate) and the cheat sheet's
  prepayment lines; 34 S1; 38b S4 Beat 2's post-op addendum; 39 a credit-and-rebill beat; 39a S4
  Beat 5 (the weekly run); 41 any balance-invoice narration (nothing automatic, by hand).

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
runner from one recipe per item (`requirements-board/capture/recipes/<ID>.json`; format, routes, hooks
and selector tips in `requirements-board/capture/ATLAS.md`). When a phase is done, the screenshots on
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
   `node docs/prototype-build/catch-up/tools/recipe-status.mjs <phase>` lists the covered items and
   their current recipes.
2. **Recipes the phase broke.** Any other recipe whose route, id, text or selector the phase changed
   is updated to the new screen, keeping its shot `name`s (rename a shot only when the old name
   describes retired behaviour; the runner deletes the old generated image). A Retired or Future item whose screen the
   phase removes gets `status: absent` with the reason "Retired: removed in Phase NN" (or "Future").
   Add `data-shot` hooks rather than brittle selectors, and move hooks with the code they follow.
   Stage a per-screen demo trigger with the runner's `trigger` step (added in Phase 14, because shots
   hide the harness bar that holds the "Demo actions" menu); on the PWA, open its Demo sheet instead.
3. **Capture.** With the prototype on 5173 and the PWA on 5174 (if they are not running, start root
   `npm run dev` in the background and stop it afterwards), run `node scripts/capture.ts --dry` in
   `requirements-board/`, fix what fails, then a full `npm run capture`. The full run rewrites only
   images that changed, links them into the items' `images`, and rewrites `capture/REPORT.md`. It
   must end with no failed recipe and no story without a recipe.
4. **Look at the shots.** Open the new and changed images for the covered items and check that each
   shows the built feature, the highlight lands on it, and the caption is true.
5. **Keep ATLAS current.** Where the phase changes routes, seed ids, personas, overlays or hooks that
   recipes rely on, update the matching `ATLAS.md` sections.
6. `npm run verify:board` from the repo root is green.

The runner, not the agent, writes the catalogue items' `images` and the files under
`requirements-board/requirements/assets/`; the phase still never edits a requirement's text or status. This step replaces
any older advice in a phase doc to leave screenshots stale or for the owner to re-shoot them.

**Stale captions after the 2026-10-08 update.** Many current captions describe the old behaviour.
The phase that rebuilds the screen replaces them when it updates the recipe, and its "Catalogue
screenshots" rows say what the new shot must show: US-04.3.3 (a default hospital Contract: 20, No
contract (RVG) first in the picker), US-03.3.4 (ASA seeding: 19b, optional itemised modifiers with
the locked age and P1), US-06.2.2 and US-06.3.1 (an estimated fee: 27, the fixed price from the
anaesthetist's own Contract), US-08.2.2 (a balance invoice: 27, the deduction leaving nothing to
bill), US-06.4.1 (a balance invoice: 41, nothing raised automatically and the by-hand routes),
US-04.2.2 (Contract types 1 to 3: 24, the line terms and the precedence), the US-05.1.x captions (19,
19a and 19b), US-03.1.2 (20a, the stack), the US-11.2.x captions (the guardian override: 21) and
US-07.4.1 (a List gone on invoice generation: 38a, the main view and the archive). Recipes and images
are never touched while updating the plan.

### Confirm before building

These phases carry unresolved open questions (OQ) or Open/Verify items. Each checks them at its drift
check, and if they are still open builds the owner-decision default (D26 to D41) or the recommended
reading and labels it provisional in the UI.

| Phase | Items | Open questions |
|---|---|---|
| 15a | FT-13.7 (Verify): where the to-do list sits (US-13.7.2 leaves it open) | none |
| 16 | FT-10.3, US-10.3.1 and US-10.3.3 (Verify): the fixed-charge schedule; whether only paid invoices count (Greg's view, for AA's accountant); BCTI granularity (one per receivable invoice built; "one per procedure" unresolved) | OQ-60, OQ-29 |
| 17 | US-01.3.6 and US-13.6.4 (Verify): the names of the pairings and tiers; how tiers and the not-preferred grouping combine (assumed: tiers order each group) | OQ-102 |
| 18 | US-04.1.5 (Verify): the holder record; the draft design's shape | OQ-98 |
| 19 | US-05.1.3 (Verify): whether cosmetic and dental groupings stay tags; where the system code sits; how a range is held; the general procedure's wording | OQ-88, OQ-101, OQ-103 |
| 19a | FT-04.2, US-04.2.4 (Verify): the time band; plain RVG Contracts of a holder | OQ-89, OQ-98 |
| 19b | US-03.3.4, US-05.1.5 (Verify): age bands, stacking, no ASA pre-fill | OQ-95 |
| 20 | US-04.3.2: plain RVG Contracts, a Booking set up without a procedure, the general procedure set from the RVG codes tab | OQ-98, OQ-99, OQ-103 |
| 20a | US-03.1.9: invoice wording (the procedure's own; Nick and Rob's view to confirm), the general procedure's name | OQ-103 |
| 21 | US-11.4.2 (Proposed); the insurance indication; completion without a procedure; the general-procedure review flag | OQ-93, OQ-99, OQ-103 |
| 22 | US-08.2.3 (Verify): whether % shares must total 100, the split's line wording; GST agency, the BCTI's new name and its granularity | OQ-29 |
| 23 | FT-05.3, US-05.3.1 (Verify): whether the RVG default multi-procedure rule applies at all | OQ-90 |
| 24 | US-04.2.2, US-03.5.1 (Verify): the time band; a discount on top of a fixed discount | OQ-89 |
| 26 | US-12.1.4 (Verify) | none |
| 27 | EP-06, US-06.3.1, US-06.3.5 (Verify): a prepaid procedure with no price, a price change on a prepaid procedure, when the pair is created | OQ-92, OQ-96, OQ-80 |
| 28 to 31 | US-01.3.2, US-01.5.2 (Verify): short-notice sickness (the generation order and the recurring clash were settled in the room) | OQ-81 |
| 32, 32a | US-01.4.6, US-01.4.7 and US-13.8.2 (Verify): the vacated session, the pool's lifecycle, the single-Booking experience, when the pair is amended | OQ-84, OQ-79, OQ-85, OQ-80 |
| 33, 34 | FT-02.1 (Verify): the delivery format per hospital; 33 also a Booking created without a matched procedure | OQ-13, OQ-99 |
| 35 | US-02.3.3 (Verify) | none |
| 37 | US-13.3.1 (Confirmed): the grouping and filters are Greg's suggestions, not settled; approval kept on Review behind "Open in Review" (our reading of the note) | none |
| 38 | US-12.2.2 (Verify) | none |
| 38a | US-07.4.1, US-07.4.2 (Verify); US-03.1.6, US-03.1.7 (Proposed) | none |
| 38b | US-08.6.1, US-08.6.3 and US-03.7.3 (Verify); the user-facing name "event" | none |
| 39 | FT-08.6, US-08.6.2, US-08.6.4 and US-08.6.5 (Verify), US-08.6.6 (Proposed): a split asked for before the combined invoice is sent | OQ-77 |
| 39a | US-10.2.6 (Verify), US-10.2.7 (Proposed): who approves, the 20th-of-the-month fit | OQ-47 |
| 39b | FT-03.7 and US-03.7.1 (Verify), US-05.5.2 (Open): ACC codes | OQ-12 |
| 40 | US-11.1.4 (Open), US-11.3.2 (Verify): the editable threshold beside US-13.7.4's "fixed until AA asks" (Future); Booking without NHI (D11, leaning mandatory) | OQ-49 |
| 41 | FT-06.5 and US-06.5.1 to US-06.5.4 (Verify): a part credit of a prepayment, when the pair is amended, the trust cycle | OQ-97, OQ-80, OQ-47 |
| 42 | US-13.4.3 (Proposed): whether a Contract schedule upload is in the first release | OQ-100 |
| 43a | US-13.5.3 (Verify): the sign-in experience | OQ-83 |

## Milestone demos

These are what you can show at each point.

- **After 16** (15a and 15b run before it): Booking vocabulary everywhere, with Copy a Booking gone,
  photo capture out of the Add a booking chooser, and an assigned List called ACTIVE. Every demo
  action on its own screen, in the harness bar and on a handset, with the HL7/FHIR tooling badged
  Future scope. Warnings, never blocks: one routine, the to-do list, a triangle on Bookings and a
  warning clear on opening, the prepayment gate turned into a warning, and no confirm step at submit.
  The corrected payables story: the payable equals the receivable, AA's fee is a monthly invoice
  built from its settings, and Xero holds no patient names.
- **After 25:** the catalogue's pricing model, end to end:
  - surgeons' rooms and profiles, with private not-preferred and preferred pairings and priority
    tiers guiding the office's pickers;
  - contract holders (third party and first party) and dated Contract versions with AA codes, and
    one No contract (RVG) with no hospital or insurer defaults;
  - RVG groups under body sections, a curated procedure list with a general procedure per group,
    and a two-tab picker (Procedures, RVG codes);
  - Contract lines with a fixed price, rate, discount or units, the anaesthetists' own price lists,
    and starting units from the line, the procedure or the group, any value accepted with an office
    warning when out of range;
  - optional itemised modifiers with explanations, with age and the included P1 locked;
  - one Contract per Procedure, mandatory at setup, No contract (RVG) first, and the three-part stack
    (source wording, procedure and RVG code, Contract) on every booking screen;
  - the payer on the Booking, who is billed decided by the Contract's holder, the insurance
    indication and child-payer warnings, and holder references;
  - invoices sent by the billing run and a Split button with typed $ or % shares;
  - the 3/2/2 modifier split, combination Contracts, one price precedence with fixed rate and
    discount, and the anaesthetist adjustment on No contract (RVG) and their own Contracts only;
  - a lock at AUTHORISED that reproduces invoices exactly.

  S1 Beat 3, S2 Beat 2, S3, S4 Beat 3 and S5 are re-scripted.
- **After 27:** prepayment from the anaesthetist's prepaid set of procedures and RVG groups for a
  person paying: the amount is their own fixed price from their first-party Contract, in full and
  shown to them, a missing price warns the office, the invoice is generated at setup with its ledger
  and draft Xero pair and sent on admin approval, part-paid tracking, a warning in both apps that strengthens as the date nears, and a
  prepaid Procedure billed at the prepaid amount with nothing raised automatically. S4 Beat 1 is
  re-scripted.
- **After 32a:** the office's schedule: every session stored and free by default over a
  configurable horizon, Slots and Lists, statuses as a user-maintained list, the availability
  calendar with series, the conflict dashboard, recurring bookings, Draft Lists in the DRAFT state
  that hold Bookings with a waiting flag (including from a recurring clash) and become ACTIVE when the
  office assigns them with preferences and tiers, anaesthetists returning or handing on their own
  Lists with no preference warning (also when they mark a booked session unavailable) and moving
  single Bookings, and the office's shared notification pool. S2 is re-scripted.
- **After 35:** S1 rebuilt: hospital sync, then the matching screen showing each row's wording as
  received, then a Booking whose Contract the office sets (No contract (RVG) first). Explicit save
  with change sets, and the on-demand update email picked from the change history, started from a
  template, to the rooms or the hospital, including from a List-move notification.
- **After 39a:** the money story on the internal ledger: balances shown in or out of balance, Xero
  mirror resilience and a processing monitor grouped by anaesthetist with sorting and filters,
  ledger-backed web accounts with a flat outstanding list and a cash-basis GST schedule, the
  anaesthetist's main view from today with an archive and search for invoiced work, events on a
  Procedure with the events list and free-form additional invoices to any party (office and
  anaesthetist), the credit note option, credit-and-rebill from copied lines and a split combined
  procedure that equals the credit, and weekly ISO-week payment runs with BCTI approval, netting and a
  remittance advice. S4 Beats 2 to 5 are re-scripted.
- **After 44:** every verified gap closed: pre-op and post-op events on every Procedure, patients
  with balance warnings, follow-up tools and NHI lookup, prepayment letters, by-hand settlement of
  prepaid work with part credits, the trust account and refunds, the payee following a moved prepaid
  Booking on the honour system, reference-data loads, full-scale and privacy demos, anaesthetist
  sign-in, point-of-need help, and the rewritten S1 to S5 run sheet.

## Parked

Nothing is parked. US-08.6.4 (split a combined Procedure into additional invoices), parked in the
first plan while OQ-53 was open, is in Phase 39: OQ-53 made a combination a Contract with a line under
each of its parent procedures (built in 23), OQ-72 made the split a credit then one additional
invoice per component, and OQ-77 (parts 1 and 2) made the components equal the credit.

Kept but not planned as work: RV-22, the PWA's "Play the office" auto-authorise. It stays as a
signposted demo scaffold. Phase 14 badged it, defaulted it to OFF, and added the per-List "Office
authorises this List" trigger in its place.

Out of the plan (not parked: excluded or already met). Since the 2026-10-03 update: Future Work
US-02.2.1, US-02.4.4, US-02.5.1 to US-02.5.4, US-02.5.6 and US-13.7.4; Retired US-02.4.3 and
US-05.2.3 (their prototype code is removed in 15b and 19b); now Matching US-02.5.5 and US-11.1.1;
DM-36, dropped from the delta. Since the 2026-10-08 update: Retired US-04.2.5, US-04.2.7, US-04.2.12,
US-04.4.1, US-04.4.2, FT-04.4, US-05.3.4, US-06.2.3, US-06.2.4, US-06.2.5 and US-06.4.2 (their
prototype code, such as the protected default Type 1s, the ordinal price rows, the deposit and the
estimate, is removed in 18, 19a and 27); Future Work US-04.3.7, US-02.3.5 and US-04.2.13; now
Matching FT-03.2 and US-05.2.6 (carried across without regression in 18, 19a, 23 and 24); DM-06,
DM-27, DM-33, DM-37 and DM-47 merged into other deltas; DM-40 dropped; RV-27 dropped (absorbed into
RV-13). US-05.2.5, which Matched at the 2026-10-03 update, is a gap again (Contradicts) and is in 24.

## When the catalogue changes

The catalogue keeps changing, and this plan is pinned to commit `60e2d1e` (Phase 15a keeps its
2026-10-03 baseline, read with its dated "Requirements changed since session 1" section).

1. **Every phase starts with a drift check.** Diff the catalogue files for the phase's covered IDs
   and their linked OQs against the snapshot, and check whether any owner decision it depends on has
   been answered:

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff <covered IDs and OQs, comma separated>
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
