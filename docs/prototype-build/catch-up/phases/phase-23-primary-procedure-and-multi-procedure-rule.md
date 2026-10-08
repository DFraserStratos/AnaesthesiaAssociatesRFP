# Phase 23 · Primary Procedure, multi-procedure rule and combination Contracts

**Requirements covered:**
[US-03.2.1](../../../../requirements-board/requirements/stories/US-03.2.1.md) One primary Procedure (Confirmed; graded Contradicts) ·
[US-03.2.2](../../../../requirements-board/requirements/stories/US-03.2.2.md) Anyone with edit rights can set the primary (Confirmed; graded Partial) ·
[US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md) Combination Contracts (Confirmed; graded Missing; a combination is a fixed-fee Contract under the procedure, one spanning several procedures has a line under each parent, and the Merivale "Facelift plus 1 add on" is the second acceptance criterion) ·
[FT-05.3](../../../../requirements-board/requirements/stories/FT-05.3.md) Multi-procedure rule, superseding the RFP split-billing rule (Verify, OQ-90; graded Contradicts) ·
[US-05.3.1](../../../../requirements-board/requirements/stories/US-05.3.1.md) Multi-procedure BTM rule (Verify, OQ-90; graded Contradicts) ·
[DM-15](../analysis/domain-model-delta.md#dm-15) multi-procedure rule: one primary flag, time on every Procedure, modifier units split above four, no Contract-specific ordinals ·
[RV-02](../analysis/reverse-check.md#rv-02-modifier-units-never-split-across-procedures-the-above-4-total-rule-is-missing) modifier units never split across procedures.
**Carried across without regression** (they Match today only through the old model, ROADMAP.md
"Old-model matches are carried across"; each gets a test): [FT-03.2](../../../../requirements-board/requirements/stories/FT-03.2.md)
Booking structure, one primary and zero or more additional Procedures (Matches today through
`isAdditional` and `removeProcedure`'s refusal of the first Procedure by position; this phase
replaces both mechanisms, so it re-proves the structure), and
[US-05.3.5](../../../../requirements-board/requirements/stories/US-05.3.5.md) each Procedure's units
and dollars recorded (Matches; OQ-90 now names it), which must still match once shares are allocated.
**Answered and built as answered:**
[OQ-15](../../../../requirements-board/requirements/questions/OQ-15.md) (answered 2026-10-07: the
equal split with the remainder to the primary, 7 over 3 = 3 / 2 / 2, agreed with Ben, Vanessa and
Greg; no provisional label),
[OQ-53](../../../../requirements-board/requirements/questions/OQ-53.md) (a combination is a Contract
under each parent procedure; Greg accepted the model on 2026-10-07),
[OQ-66](../../../../requirements-board/requirements/questions/OQ-66.md) (D16 as superseded
2026-10-08: No contract (RVG) first, then the fitting Contracts under holder headings with composite
search; a combination is found the same way),
[OQ-62](../../../../requirements-board/requirements/questions/OQ-62.md) (D12 and D3 as superseded
2026-10-08: base units on the RVG group, a procedure may set its own, a Contract line may override
both; built in 19 and 19a, read here) and
[OQ-72](../../../../requirements-board/requirements/questions/OQ-72.md) (D22: a split after
invoicing is a credit note, then additional invoices; Phase 39's).
**Open, built as its default:** owner decision D26,
[OQ-90](../../../../requirements-board/requirements/questions/OQ-90.md) (whether the RVG default
multi-procedure rule still applies at all). Default, its recommendation: keep the RVG default as the
one system-wide rule for calculated Procedures, in one switchable pure function, labelled provisional
in one place.
**Left this phase on 2026-10-08:**
[US-04.2.5](../../../../requirements-board/requirements/stories/US-04.2.5.md) and
[US-05.3.4](../../../../requirements-board/requirements/stories/US-05.3.4.md) (Retired 2026-10-05:
Contracts do not define how additional procedures are priced, so there is no per-Contract rule);
FT-03.2 (now Matches, carried across above); and RV-34 (the procedure-ordinal price key, removed by
Phase 19a, which turned the bariatric ordinal row into a plain fixed-price line).
**Reads, without building:** Phase 19a's Contract lines and the one starting-units resolver (the
Contract's line for the procedure, then the procedure, then its RVG group, each value with its layer;
fixed price, fixed rate and fixed discount from the line only), and its fee path (the line's fixed
price as the whole price; else BTM x the fixed rate or the anaesthetist's unit value, less any fixed
discount); Phase 19b's itemised modifiers (the locked age and included modifiers, the claimed ones
with explanations, `resolveModifiers` as the one M total); Phase 20's candidate list and picker;
Phase 20a's three-part stack and its "who is invoiced" and "pricing basis" selectors; Phase 21's
payer on the Booking, Review and completeness; Phase 22's Split button and invoice layout.
**Depends on:** Phase 19b (modifiers as itemised records, `resolveModifiers`, `reconcileClaims`, the
locked age and P1, the explanation asked on claiming) and Phase 22 (invoice presentation, the Split
button on a Procedure's Contract line with typed $ or % shares that replaced `funderOverride`, one
BCTI per receivable invoice). Through them: 14 (the trigger registry), 15 (Booking vocabulary), 15a
(the warning routine, the Booking warning surfaces, no submit confirm step), 15b (Copy a Booking
removed, photo capture out of the chooser, the List state DRAFT renamed ACTIVE), 16 (`bctisFor`, the
one BCTI count), 17 (surgeons' rooms), 18 (contract holders, dated Contract versions, the AA code
generator, composite search, one stored No contract (RVG)), 19 (RVG groups, the curated procedure
list with a general procedure per group, the two-tab picker), 19a, 19b, 20 (one Contract per
Procedure, mandatory at setup, the candidate list with No contract (RVG) first and holder headings,
the RVG-code route to the lines across a group), 20a, 21 and 22.
**Estimated:** 2 sessions. Session 1: work items 1 to 9 (baseline, model, the pure allocation, the
Booking-level engine reading 19a's resolver and 19b's modifiers, the combination helpers, rewiring
every fee caller, store actions, seed, tests), ending green. Session 2: work items 10 to 16 (capture
with the primary first, the Booking total, Review and invoices, the Contract editor's combination
switch, combinations in the picker, the two triggers, copy sweep, Playwright, demo guide) and the
review pass. Session 1 is the heavy one: it changes the fee engine's shape under every caller. If it
overruns, finish items 1 to 7 and 9 green and carry item 8's Contract action (8f) into session 2 with
item 12, rather than splitting the engine rewire.

**Re-planned 2026-10-08 (catalogue `60e2d1e`).** Since the 2026-10-03 plan: the per-Contract
multi-procedure rule (RVG default, % of own code, add-on fee, not billable) and Contract-specific
second-procedure pricing are Retired (US-04.2.5, US-05.3.4), so the `MultiProcedureRule` type, its
editor section, its "Proposed" pills, the SXAP 50% and bariatric $950 rule seeds and every
rule-dependent branch are out; the bariatric $950 is now a plain fixed-price line (19a). OQ-15 is
answered, so the split carries no provisional label; OQ-90 (D26) now asks whether the rule applies at
all, and the draft design says it adjusts the units of CALCULATED Procedures only, so a fixed-price
Procedure keeps its price. Base units no longer live in default RVG Contracts or a Contract override
list (both Retired with FT-04.4): they resolve from the line, the procedure and the RVG group (19a).
Modifiers are 19b's itemised records with no ASA card, no ASA seed and no procedure-default pre-fill,
so the 2026-10-03 plan's "default modifiers join the primary's set" reading is out. A combination is
a fixed-fee Contract with a line under each parent procedure, offered beside the single-procedure
Contracts under its holder heading, not in a separate "Combinations" group; the Merivale schedule is
its second acceptance criterion. The List state for an editable assigned List is ACTIVE (15b).

## Goal

Give every Booking one explicit primary Procedure shown first, price calculated Procedures under the
RVG default multi-procedure rule (D26), and add combination Contracts.

- **Exactly one primary, shown first** (US-03.2.1, US-03.2.2, FT-03.2 carried across).
  `Procedure.isAdditional` becomes `Procedure.isPrimary`, with exactly one primary per Booking that
  has Procedures, guaranteed by the store and asserted by the seed test. The primary is always listed
  first on every surface (US-03.2.2 note), in capture, in 20a's stack, in Review and on invoice lines;
  the others follow in Booking order. The primary is a choice, not a time order: the first procedure
  done may not be the primary, and an ACC pre-op assessment never is (it is a pre-op event, 39b).
- **"Make primary".** Anyone with edit rights (the anaesthetist on mobile and web, the office in
  Admin, and an inbound hospital or surgeon feed) can make another Procedure primary while the Booking
  is editable. It re-anchors base and modifier units in one audited commit. AA staff normally set it
  at creation or import from the rooms' sheet order, so the first Procedure entered starts as the
  primary.
- **The RVG default multi-procedure rule, for calculated Procedures** (FT-05.3, US-05.3.1, DM-15,
  RV-02; D26 default, OQ-90 open). The draft technical design says that if the rule applies, "it
  adjusts the units of CALCULATED procedures" before pricing
  ([AR-29#price-precedence](../../../../requirements-board/requirements/artifacts/AR-29.md), its
  multi-procedure note), and the plain-language guide says each procedure on a Booking is priced on its
  own Contract ([AR-28#booking-to-invoice](../../../../requirements-board/requirements/artifacts/AR-28.md)).
  So pricing becomes Booking-level before Phase 24's price precedence:
  - base units on the primary only, from 19a's resolver for the primary's own Contract (line, then
    procedure, then RVG group) or the value recorded on it; structurally not editable on an
    additional Procedure;
  - time units on every Procedure, from its own recorded times and 19a's tier data;
  - modifier units (19b's itemised records, recorded once for the Booking on the primary, locked age
    included) all on the primary while the Booking total is 4 or fewer; above 4 split equally with the
    remainder to the primary (7 over 3 = 3 / 2 / 2; OQ-15 answered), **whichever Contracts the
    Procedures are on**;
  - a Procedure whose Contract line resolves a **fixed price** keeps that price (US-05.2.5): its BTM
    is recorded for reference, it takes no modifier share and loses none. A fixed-price primary still
    anchors the Booking's base and modifiers; its share sits inside its price. These participant
    readings are picked and logged under D26. Note that FT-05.3 and US-05.3.1 literally say "split
    equally across every Procedure in the Booking"; leaving a fixed-price additional Procedure out
    follows AR-29's CALCULATED note (a share given to it would never be billed), and it goes on the
    owner's review list as a departure from the literal wording, changed in `participantsOf` alone.
  - There is **no per-Contract multi-procedure rule and no ordinal pricing** (US-04.2.5 and US-05.3.4
    Retired).
- **One place, switchable.** The rule lives in one pure module in `aa-prototype/src/domain/billing`
  beside 19a's resolver and fee path, with one named switch (`MULTI_PROCEDURE_RULE_APPLIES`, D26) so
  AA's answer to OQ-90 is a one-place change: off, each Procedure is priced alone on its own Contract
  with its own base and modifiers. It is labelled provisional in one place only (the Admin Booking
  total's split caption) and in the Decisions log. The structures it reads (Contract lines, the
  resolver, the booking procedure's units) stay in 19a's one place behind the types the UI reads; this
  phase adds no second copy of them, so a v5 of the draft design stays a contained edit. Reference
  shape: [AR-29#booking-procedure-fields](../../../../requirements-board/requirements/artifacts/AR-29.md)
  and [AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md) (the
  primary flag is the catalogue's addition beside the draft's pricing fields: domain model,
  "`isPrimary` flag drives the multi-procedure rule").
- **Combination Contracts** (US-04.2.11; OQ-53, Greg accepted 2026-10-07). A combination is a
  fixed-fee Contract under the procedure, never a separate procedure. One spanning several procedures
  (an abdominoplasty, breast lift and liposuction) has a fixed-price **line under each parent
  procedure** ([AR-29#contract-line-fields](../../../../requirements-board/requirements/artifacts/AR-29.md),
  [AR-30#contract-line](../../../../requirements-board/requirements/artifacts/AR-30.md)), so 20's
  candidate rule ("has a line for the procedure, holder fits",
  [AR-29#contract-selection](../../../../requirements-board/requirements/artifacts/AR-29.md)) offers it
  under each parent **beside the single-procedure Contracts**, since the combined price can be lower
  than the parts. The Booking records only that Contract on one Procedure, never the components. A
  `Contract.isCombination` marker drives the "Combination" pill, the "Covers {parts}" caption and
  Phase 39's split; it has no pricing effect. The Merivale set fee schedule is seeded as the second
  acceptance criterion: "Face lift" $3,565, "Facelift plus 1 add on (eg bleph)" $3,910 and "Facelift
  plus 2 add ons (eg bleph & fat grafting)" $4,255, three fixed-fee Contracts under Face lift held by
  the Merivale Plastic Surgery rooms, the latter two combinations.
- **Visible everywhere it counts.** A seeded three-procedure Souter Booking carrying the domain
  model's worked example (AS3 2 + OB3 2 + ASE 2 + the locked A1 1 = 7 modifier units) shows 3 / 2 / 2
  on the office Booking total, in Review and on invoice lines. A seeded Southern Cross cosmetic
  combination is offered under each of its three parents, and the Merivale Contracts side by side
  under Face lift. Vitest worked examples cover every case.

**Old-model behaviour carried across.** FT-03.2's structure (one primary, additional Procedures in
the same Booking, the primary not removable) and US-05.3.5's per-Procedure units and dollars on
invoice lines both Match today through the mechanisms this phase replaces; tests prove each still
holds afterwards (work items 1, 8 and 9).

The anaesthetist's capture shows units and shares only. The 2026-09-28 ruling (no calculated fee on
the anaesthetist's Booking) stands wherever the catalogue gives no price: this phase adds no Booking
total, dollar share or calculated fee to an anaesthetist surface, and 20a's stack shows a
combination's pricing basis exactly as it shows any fixed-price Contract's. Invoices still group by
billable party (21), so the BCTI count (16's `bctisFor`) does not move.

## Before you start: drift check

1. Run `node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-03.2.1,US-03.2.2,US-03.2.3,US-04.2.11,FT-05.3,US-05.3.1,US-05.3.5,FT-03.2,US-04.2.5,US-05.3.4,US-04.3.2,US-05.2.5,US-03.3.4,US-03.3.8,US-05.1.4,US-08.6.4,OQ-15,OQ-90,OQ-53,OQ-62,OQ-66,OQ-72,OQ-77,OQ-89`
   (the baseline is `60e2d1e`; the tool is rename-aware, so never a plain `git diff` of the catalogue
   folder) and read the hunks. Re-read the domain model's "Booking" and "Procedure" sections (the
   `isPrimary` bullet and the Modifiers bullet), the Contract "Selection" paragraph (a combination is a
   fixed-fee Contract under the procedure; one spanning several is set against each parent) and "3.
   Calculation rules" ("Units within a Booking", the 7 over 3 worked example, the CALCULATED note).
   - If an item changed, re-read it whole and adjust the work items.
   - If one is now Retired or Future, drop its work and say so in the PROGRESS entry.
   - Watch in particular for: OQ-90 answered either way; a change to the threshold (4) or remainder
     rule; how a fixed-price Procedure takes part; any return of a per-Contract rule (the SXAP and
     CES "second code at 50%" point sits with OQ-89 and OQ-90); and any change to how a combination is
     recorded on the Booking (US-04.2.11) or split (US-08.6.4, OQ-77).
   - Check whether AR-29 has moved to a v5 (`requirements-board/requirements/artifacts/AR-29.md`); if
     its price precedence or booking procedure fields changed, follow v5 inside the same one place and
     log it.
2. Confirm the gate.

| Gate | If still open (what to build) | If answered differently |
|---|---|---|
| **OQ-90** (D26, Open: does the RVG default multi-procedure rule apply at all) | Build the default: the rule applies to every Booking with more than one Procedure, to calculated Procedures only, as the Goal says. Keep it in one pure module with `MULTI_PROCEDURE_RULE_APPLIES = true` as the one switch, and test the switch off (each Procedure priced alone on its own Contract, with its own base and modifiers). Label it provisional in one place: the Admin Booking total's split caption ("RVG multi-procedure rule · provisional, to confirm with AA (OQ-90)"). Log it on the "For the owner's review" list | If AA says each Procedure is priced alone: set the switch off, let the capture enable base and modifiers on every Procedure through the one role selector (item 3), keep `isPrimary` (FT-03.2 and US-03.2.x stand) and drop the split captions. If AA keeps the rule but changes who takes part (for example fixed-price Procedures share too): change `participantsOf` and its tests only |

   Answered, so build the answer with no provisional label:
   - **OQ-15**: the equal integer split, `floor(total / n)` each, the remainder to the primary,
     whichever Contracts. Whether it applies across different Contracts was not raised in the room;
     the catalogue text (US-05.3.1 note: "whichever Contracts the procedures are on") is the answer.
   - **OQ-53**: a combination is a Contract under each parent procedure; the Booking records only the
     Contract; Greg's "operation" container was not adopted.
   - **OQ-66** (D16 as superseded): every Contract carries 18's AA code, and 20's picker (No contract
     (RVG) first, then the fitting Contracts under holder headings, composite search, active and holder
     filters) is how Contracts are found. A combination adds no navigation of its own.
   - **OQ-62** (D12, D3 as superseded): base units resolve from the line, the procedure, the RVG
     group (19a); this phase reads the resolver's answer and never decides base units itself.
   - **OQ-72** (D22): a split asked for after the combined invoice is sent is a credit note, then
     additional invoices (Phase 39). OQ-77 (part 1 answered: the rebuilt invoices must equal the
     credit; part 3 open, D41) is 39's too.
3. Read what Phases 14 to 22 actually built (their PROGRESS entries). File and symbol names below are
   as at `60e2d1e` (the code is as 15a session 1 left it at `b342a7d`: Booking vocabulary, the
   warning routine). Follow any rename a later phase made:
   - 15: `store/bookingActions.ts` (`createBooking`, `addProcedure`, `removeProcedure`,
     `addPostOpAddendum`), `shared/booking/BookingDetailBody`, `validateBookingForBilling.ts`
     (`feeContextFor`), `buildInvoicesForBooking`, `buildPrePaymentInvoiceForBooking`,
     `BookingTotalPanel`, `bookingFee` (with `BookingFeeTotals`), seed `bookings.ts`, the markers
     `splitBillingBooking` and `bariatricType3Booking`, refusal `bookingCancelled`, routes
     `…/bookings/:bookingId`.
   - 15a: the warning routine and how a rule registers; the warning shows on opening the Booking and
     there is no confirm step at submit (US-13.7.3). Phase 19's out-of-range base-unit warning (D3) is
     one of its rules; item 7 makes it read the primary only.
   - 15b: Copy a Booking is gone (US-02.4.3 Retired), so no creation path makes a Booking whose only
     Procedure is additional (FT-03.2's former copy point, DM-39); photo capture is out of the Add a
     booking chooser; the editable assigned List state is ACTIVE. Confirm `copyBooking` no longer
     exists.
   - 16: `bctisFor`, the one BCTI count. This phase must not change what it counts.
   - 17: surgeons' rooms and how a surgeon belongs to them (item 9b may append Merivale Plastic
     Surgery).
   - 18: the contract holder (third or first party, holder is billed, billable party, anaesthetist,
     its kind and context link), the Contract as a dated version with the new-version flow, the AA code
     generator (`nextAaCode`), composite search, the active and holder filters, office-only editing,
     the one stored No contract (RVG), the Contract editor and catalogue.
   - 19: RVG groups under body sections (base and modifier units, a starting figure and range), the
     curated procedure list (each procedure in exactly one group, a general procedure per group), the
     Procedure's link to its procedure, the two-tab picker and its store pick action, the
     out-of-range warning (D3). Note which procedures exist for abdominoplasty, breast lift,
     liposuction and face lift, and in which groups.
   - 19a: the Contract line type (fixed price, fixed rate, fixed discount, base and modifier units,
     holder code), `lineFor`, `isPlainRvgContract`, `ownPriceListFor`, the one resolver's name,
     signature and layer names (`'line'`, `'procedure'`, `'group'`), `BtmBreakdown`'s layer fields,
     `FeeResult`'s resolved terms, the fee path (fixed price on any Procedure; else BTM x rate less
     discount), the line actions and their guards, the lines grid in the Contract editor, the time
     tiers as data, and that the ordinal key is gone (the bariatric 49120 at $950 is a plain line).
     19a left the time-only rule for an additional Procedure (`splitBillingUnits`) in place for this
     phase.
   - 19b: the `Modifier` master generated from AR-34, the Procedure's `modifierClaims`,
     `lockedModifiersFor`, `resolveModifiers` (the one M total: 19a's starting modifier units plus
     the locked and claimed items, or the manual M adjustment `modifierUnitsCaptured`),
     `reconcileClaims`, `claimModifier` and its refusals, the Modifiers section in capture (rows
     visible, actions hidden on an additional Procedure, as 19b left it), and how the seed migration
     left the Holt and bariatric additional Procedures' claims (AS2 became an ASA I or II claim worth
     0; AS3 now 2).
   - 20: one Contract per Procedure, mandatory at setup; the candidate selector (its name, its
     result shape: No contract (RVG) first, then holder headings), how it applies "has a line for the
     procedure" and holder fit, the composite search, the RVG codes tab route to the lines across a
     group, how `addProcedure` picks the new Procedure's Contract, `setProcedureContract`, and the
     anaesthetist's change flagged at review.
   - 20a: the Procedure's source wording, the three-part stack component, and its "who is invoiced"
     and "pricing basis with figure" selectors.
   - 21: the payer on the Booking, who is billed (the holder's billable party or the payer), invoice
     grouping by billable party (US-08.2.1), Review showing the stack, and the completion rules.
   - 22: the invoice line format, the Split button on a Procedure's Contract line and its shares
     (keyed by Procedure; 22's handoff may ask this phase to re-key them if Booking-level pricing moves
     the priced line), and one BCTI per receivable invoice.
4. Record the current `PERSIST_VERSION` (16 after 15a session 1; 15b to 22 will have bumped it).

## Reference

**Design (convention 17).** Capture follows `docs/design/Mobile App.dc.html` screen 3 (the procedure
card, the B / T / M stepper rows and their captions; 19b replaced the ASA card and chips with the
itemised Modifiers section) and its web twin in `Web Dashboard.dc.html`'s card anatomy. The Booking
total, Review row and per-procedure breakdown follow `Admin Review.dc.html` (mono tabular units, the
TOTAL UNITS block, row flags). The pill shape (`r-pill`), the accent tint note, the tokens and the
`motion/selection-slide` pattern come from `Design Language.dc.html` (transcribed in `src/theme/`). The
design has no provisional badge: the "Provisional" and "Combination" markers are small neutral pills,
as Phases 19, 19a and 22 do (not `DemoBadge`, which means demo simulation). Teal is the only action
colour: "Make primary" is a teal text action beside Edit. The "Primary" marker is a neutral pill, never
crimson and never a status colour. No mockup covers the Contract editor, the Contract picker or 20a's
stack; extend 19a's lines grid, 20's picker rows and 20a's stack.

**Pricing model (draft, one place).** [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md)
(the plain-language guide, true as written): `#booking-to-invoice` ("If a booking has more than one
procedure, each one is priced on its own contract") and `#contracts-two-kinds`.
[AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) (the draft technical design
v4): `#price-precedence` (the multi-procedure note: "If it does, it adjusts the units of CALCULATED
procedures before step 3"), `#booking-procedure-fields`, `#contract-line-fields`,
`#contract-selection`, `#resolver-layers` and `#open-points` ("RVG multi-procedure rule: whether it
still applies"). [AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) (its ERD):
`#booking-procedure`, `#contract-line`, `#contract`. AR-24 (`#booking-procedures`,
`#multi-procedure-rule`) is the catalogue's process diagram, and
[AR-02](../../../../requirements-board/requirements/artifacts/AR-02.md) `#third-party-surgeon` is the
Contract diagram spot US-04.2.11 links (a surgeon's rooms' fixed-fee Contract, as Merivale's).
AR-28 is true as written; AR-29 and AR-30 are a draft that a v5 may change.

**Catalogue.** The files linked above, plus
[US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md)
(add additional Procedures, each selecting its own Contract; built in 20),
[US-03.3.3](../../../../requirements-board/requirements/stories/US-03.3.3.md)
(recorded start and handover times),
[US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) and
[US-03.3.8](../../../../requirements-board/requirements/stories/US-03.3.8.md) (optional itemised
modifiers with explanations, the locked age modifier; built in 19b),
[US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md) (P1 included and locked
on Neurosurgery and Spine codes; 19b),
[US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) (the candidate list;
built in 20),
[US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md) (the fixed price is the
whole price),
[US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) (the anaesthetist's
own fixed-price Contract; a prepaid Procedure on it is fixed-price),
[US-08.6.4](../../../../requirements-board/requirements/stories/US-08.6.4.md) and
[OQ-77](../../../../requirements-board/requirements/questions/OQ-77.md) (the combined split, Phase
39's). The meeting notes `requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md`
points #8, #27 and #46 (the split, combinations and the primary), `2026-10-02-aa-meeting-with-greg.md`
#7 and #13 (combinations, the credit-and-rebill split) and the 2026-10-07 notes cited by FT-05.3,
US-04.2.11 and OQ-90 (the AA client meeting #1 for the agreed split; the AA meeting with Greg #2 and
#52 for combinations; the pricing model documents #12, #32 and #45 for the CALCULATED note). To see
why an item says what it says, run `npm --prefix requirements-board run source -- --item <ID> --text`
(needs Node 22.18 or newer on PATH). The catalogue screenshots on US-03.2.1 ("bills time units only,
base and modifiers stay on the first") and US-05.3.1 describe the superseded RFP rule; they are not a
spec, and the Catalogue screenshots step re-shoots them.

**Analysis.** `../GAP-ANALYSIS.md`: everything before "## By epic", the DM-15 row of "Structural
changes (data model)", the RV-02 row of "Prototype behaviour to remove or rework", the "Demo-trigger
buttons" summary, and the EP-03, EP-04 and EP-05 tables. `../epics/EP-03.md` (US-03.2.1, US-03.2.2,
FT-03.2), `../epics/EP-04.md` (US-04.2.11) and `../epics/EP-05.md` (FT-05.3, US-05.3.1, US-05.3.5).
`../analysis/domain-model-delta.md#dm-15` (with DM-09 for Contract lines, DM-43 for the resolver,
DM-44 for itemised modifiers and DM-50 for the price precedence 24 builds next),
`../analysis/reverse-check.md` (RV-02; RV-34 for the ordinal key 19a removed). Code maps:
`../analysis/prototype-map-domain.md` (section 5, billing maths), `prototype-map-shared.md` (capture
suite, Booking body, flows), `prototype-map-admin.md` (Review, Master data contracts),
`prototype-map-store-seed.md` (Booking actions, seed Bookings and Contracts) and
`prototype-map-shell-demo-pwa.md` (the PWA sheet and `pwaPurity`).

**Code entry points (at `60e2d1e`; Phases 15a session 2 to 22 will have moved lines and renamed some
symbols, so follow their PROGRESS entries).**

- Names the earlier phases plan (confirm each against their PROGRESS entries): 19's `pickProcedure`
  and `ProcedurePickerSheet`; 19a's `resolveStartingUnits` and `lineFor`; 18's `nextAaCode`; 20's
  `contractCandidatesFor`, `ContractPickerSheet`, `setProcedureContract` and `needsContractBookings`;
  20a's `procedureStackView` and `ProcedureStack`. All are new since `60e2d1e`.
- Types: `src/domain/types.ts`. `Procedure` (453; `isAdditional` at 494, with the RFP comment above
  it), `Contract` (216; 18's and 19a's shape by now), `BillingLine` (528), `CapturedUnits` (87) and
  `UnitProvenance` (86).
- Fee maths: `src/domain/billing/fee.ts`. `resolveBtm` (58), `splitBillingUnits` (107, the rule to
  remove; 19a and 19b left it in place for this phase), `FeeContext` (19a removed
  `procedureOrdinal`), `feeFor` (180), the "time units only" line description (227 to 229). 19's and
  19a's resolver module, 19a's line helpers, 19b's modifier module (`resolveModifiers`,
  `lockedModifiersFor`).
- Fee callers:
  - `validateBookingForBilling.ts` `feeContextFor` (77);
  - `invoiceBuild.ts` `buildInvoicesForBooking` (264; `feeContextFor` with `index + 1` at 289) and
    `buildPrePaymentInvoiceForBooking` (456; 484; still in place until 27);
  - `store/billingLineActions.ts` (ordinal from position at 174 and 259, `feeFor` at 175 and 260);
  - `shared/capture/feeContext.ts` (`procedureFee` 36, `bookingFee` 74) and its exports in
    `shared/capture/index.ts` (6); comments naming them in `shared/capture/BookingTotalPanel.tsx`
    (about 21) and `shared/surface/context.ts` (45, 47);
  - `shared/capture/BtmCaptureBlock.tsx`, `shared/booking/BookingDetailBody.tsx` (`bookingTotals`
    191, `bookingBreakdown` 205 to 246 with `procedureFee(... ordinal: index + 1 ...)` at 214 and the
    "Time units only" note at 229; the ordinal comment at 606 and `ordinal={index + 1}` at 614), 22's
    Split row, `shared/booking/OfficeBillingSetup.tsx` (`ordinal` prop at 14 and 36; hook
    `office-billing-setup-${ordinal}` at 58; heading "procedure {ordinal}" at 61; 20 and 21 reshape
    it);
  - `apps/admin/screens/ReviewScreen.tsx` (`primary = procs[0]` at 76), `apps/admin/reviewFlags.ts`
    (`naturalBtm` 53), `apps/web/screens/ListDetailView.tsx` (`procs[0]?.description` at 77), and
    every list row 20 and 20a added that shows "the primary Procedure" through `procs[0]`;
  - `domain/seed/billing.ts` `contextFor` (81).
- Store: `src/store/bookingActions.ts`. `createBooking` (78; first Procedure at 138),
  `addPostOpAddendum` (290; its Procedure at 364, `isAdditional: false`), `addProcedure` (422 to 470;
  `isAdditional: true` at 450), `removeProcedure` (502; the by-position guard from 519). These are the
  only places a Procedure is created (Copy went in 15b). `store/lifecycle.ts` `editRefusal` (48;
  integration actors may edit an ACTIVE List only) and `editProcedure` (438). 19b's
  `store/modifierActions.ts` (`claimModifier`, `reconcileClaims`). 19a's line actions and 18's Contract
  actions (`store/contractActions.ts`). `store/integrationActions.ts` `integrationActor(feedId)` (45,
  private, labels from `FEED_META`; its `createBooking` calls at 150 and 467);
  `domain/integrations/feeds.ts` (the feed configs at 82 to 84 carry `hospitalId`: St George's,
  Christchurch Public and Southern Cross only).
- Capture (shared by mobile, web and admin): `UnitsCard.tsx` (`isAdditional` prop at 22; B and M
  captions at 59 and 77), `BtmCaptureBlock.tsx` (the header with "PROCEDURE n", Edit and Remove at 123
  to 180, Remove offered when `ordinal > 1` at 164; the additional note from 209; `isAdditional`
  passed at 244), 19b's Modifiers section and picker, 19's procedure card, 20a's stack.
  `src/shared/flows/RemoveProcedureSheet` is the pattern for the new confirm sheet. 20's picker sheet
  for the combination rows.
- Admin: 18's and 19a's Contract editor (`src/apps/admin/flows/ContractEditSheet.tsx`, with 19a's
  lines grid), `apps/admin/screens/MasterData.tsx` (the Contracts catalogue).
- Seed: `domain/seed/bookings.ts` (the `addProcedure` spec helper with `isAdditional` at 264 and 275;
  the Holt pair at 545 to 565, 49115 primary and 49120 additional; the bariatric pair at 684 to 715,
  20880 and 49120 on Doyle's bariatric Contract, both fixed-price lines since 19a), `seed/history.ts`
  (229), `seed/audit.ts` (95), `seed/contracts.ts` (18's and 19a's holders, Contracts and lines),
  19's RVG group and procedure seed, `seed/patients.ts` (fixed patients), `seed/index.ts` (the
  `splitBillingBooking` scenario at 591 to 595, "Second procedure isAdditional: time units only", and
  `bariatricType3Booking` at 615 to 619, "second procedure priced by the ordinal rule", which 19a may
  already have reworded), `billing/fixtures.ts` (38).
- Copy and labels: `shared/audit/fieldLabels.ts` (`isAdditional` 54), `shared/audit/actionLabels.ts`,
  `apps/demo/DemoControlPanel.tsx` (S3 blurb at 285, steps at 297).
- Triggers: 14's `src/shared/demoTriggers/registry.ts` (route sets such as `MOBILE_LISTS` at 54),
  `src/store/demoActors.ts` and the PWA sheet.
- Tests to rework: `fee.test.ts`, 19a's and 19b's resolver and modifier tests, `contracts.test.ts`,
  `invoiceBuild.test.ts`, `prePaymentInvoice.test.ts`, `store/billingRun.test.ts`,
  `store/captureActions.test.ts`, `store/bookingActions.test.ts`, `store/btmCapture.test.ts`,
  `store/postOpAddendum.test.ts`, `domain/seed/seed.test.ts`, `apps/admin/reviewFlags.test.ts`,
  `feeParity.test.ts`, `src/pwa/pwaPurity.test.ts` (must stay green). Playwright (all in
  `aa-prototype/visual/`): `mobile-phase04.spec.ts`, `admin-phase08.spec.ts`,
  `booking-calculation-display.spec.ts`, `demo-actions.spec.ts`, `pwa-device.spec.ts`.

## Work items

Model, pure engine and seed first, then store, then UI. Every write goes through `mutate()` with an audit
meta. Every rule is a pure function in `src/domain/billing/` with a Vitest test.

1. **Baseline the figures (before any edit).** Regenerate 18's `feeParity.test.ts` fixture from the
   code as it stands after 22 (19a's lines and resolver, 19b's modifiers). Add a census test beside it
   that lists every seeded Booking with more than one Procedure: its Procedures, their Contracts and
   resolved terms (fixed price or calculated), each one's modifier items, the Booking's modifier total
   on the primary, its invoices and its BCTI count from `bctisFor`. At `60e2d1e` there are two: the
   Holt pair (Forte, 49115 primary and 49120 additional; both seeded AS2, which 19b maps to no claim,
   ASA I or II being AS1 at 0 units; follow 19b's entry) and the bariatric pair (Doyle, 20880 at $2,800 and 49120 at $950, both fixed-price
   lines since 19a).
   - At the end of the phase the fixture may differ only for the new seeded three-procedure Booking.
     Every other figure is unchanged, S3's Holt invoice included (it was $396.18 at `3d3a18c`; 19b
     re-baselined it when the ASA seed went, so pin whatever 22 left): Holt's modifier total on the
     primary is 4 or fewer, so nothing splits, and the bariatric pair is fixed-price on both Procedures,
     so the rule leaves it at $2,800 + $950.
   - Carried across, proved here: FT-03.2 (every seeded Booking has one primary and its additional
     Procedures in the same Booking) and US-05.3.5 (each Procedure's units and amount on its invoice
     line). Both assertions stay in the census and must hold at the end.
   - The BCTI count per anaesthetist and month is unchanged: grouping by billable party does not move.
   - List any other difference in the PROGRESS entry with its reason. None is expected.

2. **Model** (`src/domain/types.ts`), for DM-15, US-03.2.1 and US-04.2.11.
   - `Procedure.isAdditional: boolean` becomes `Procedure.isPrimary: boolean`. Rewrite the doc comment
     from the RFP split-billing rule to the catalogue rule, including "the primary is a choice, not the
     first done; an ACC pre-op assessment is a pre-op event (39b), never a Procedure, so never
     primary", and that the flag is the catalogue's addition beside the draft design's booking
     procedure fields (AR-29#booking-procedure-fields).
   - `Contract.isCombination: boolean`, required, so the compiler finds every Contract literal
     (No contract (RVG) included, always false). It marks a fixed-fee Contract whose price covers more
     than one procedure: every line of the version in force sets a fixed price (item 8f enforces it),
     one line per parent procedure. It has **no pricing effect**: the line's fixed price already prices
     the Procedure (19a). 18's new-version flow copies it. Nothing is added to the Booking: it records
     only the Contract (item 6).
   - No `MultiProcedureRule` type and no per-Contract rule field (US-04.2.5 and US-05.3.4 Retired).
     No base-unit field or override type: 19a's lines, procedures and groups are the model this phase
     reads.

3. **The multi-procedure allocation, pure** (new `src/domain/billing/multiProcedure.ts`), for FT-05.3,
   US-05.3.1 (both acceptance criteria), US-03.2.1 and US-03.2.2.
   - `MULTI_PROCEDURE_RULE_APPLIES = true`, commented "D26, OQ-90 open: the RVG default
     multi-procedure rule; false prices each Procedure alone". `MODIFIER_SPLIT_THRESHOLD = 4` and the
     remainder to the primary, commented as the catalogue values (OQ-15 answered 2026-10-07).
   - `primaryOf(procedures)` returns `{ kind: 'ok'; primary }`, or `{ kind: 'noPrimary' }` or
     `{ kind: 'severalPrimaries'; ids }`. The store guarantees exactly one; the engine refuses the other
     two cases rather than guessing.
   - `inDisplayOrder(procedures)`: the primary first, then the rest in Booking order. Every list of a
     Booking's Procedures (capture, 20a's stack, the Booking total, Review detail, invoice lines,
     history labels) uses it, so "Procedure 1" is always the primary.
   - `procedureRole(procedure, procedures)`: `{ role: 'primary' | 'additional'; baseCharged;
     modifiersRecorded }`, the one selector the capture and the store read to decide whether base and
     modifiers are editable on a Procedure. With the switch off every Procedure is base-charged and
     records its own modifiers.
   - `participantsOf(procedures, isCalculated)`: the primary, plus every additional Procedure that is
     calculated (no fixed price resolves for it on its own Contract). A fixed-price additional
     Procedure takes no share and loses none; the primary always takes part, whatever its pricing.
     Picked readings under D26, logged.
   - `allocateModifierUnits(total, participantIds, primaryId)` returns a record of shares.
     - `total <= 4`: all on the primary, 0 on the rest.
     - Otherwise each participant gets `floor(total / n)` and the primary also gets `total mod n`.
     - A single participant (the primary) takes everything.
   - `ProcedureAllocation { role: 'primary' | 'additional'; calculated: boolean; baseCharged: boolean; modifierShare: number; bookingModifierUnits: number; splitAcross: number }`.
     `splitAcross` is 1 when nothing was split.
   - `allocateBooking(procedures, isCalculated, bookingModifierUnits)` returns the allocation for every
     Procedure.
   - Tests (`multiProcedure.test.ts`), every worked example written out:
     - 0 units over 3: 0/0/0. 4 over 3: 4/0/0 (at the threshold, all on the primary).
     - 5 over 2: 3/2. **7 over 3: 3/2/2**, with the domain model's own inputs (AS3 2 + OB3 2 + ASE 2
       + A1 1). 6 over 4: 3/1/1/1. 8 over 4: 2/2/2/2.
     - 5 over 6: 5/0/0/0/0/0 (every share rounds to 0, the remainder is all of it). 9 over 1: 9.
     - The primary gets the remainder wherever it sits in Booking order (first, middle or last).
     - 7 over 3 with the three Procedures on three different calculated Contracts (No contract (RVG),
       a fixed-rate line, a fixed-discount line): still 3/2/2.
     - 7 over 3 with the third Procedure on a fixed-price line: split over 2, 4/3, and the third gets 0.
     - A fixed-price primary with two calculated additional Procedures and 7 units: 3/2/2, the primary's
       3 inside its price.
     - The shares always sum to the total.
     - `inDisplayOrder` puts a primary stored last at the top and keeps the others' order; a primary
       with a later start time than an additional Procedure stays primary.
     - No primary and two primaries are refused.
     - The switch off: every Procedure is its own participant set (its own base and modifiers), and
       `procedureRole` reports every Procedure base-charged.

4. **`feeFor` prices one Procedure from its allocation** (`fee.ts`), for FT-05.3, US-05.3.1 and RV-02.
   - `FeeContext.allocation: ProcedureAllocation` is **required**, so the compiler finds every caller
     for item 7.
   - `resolveBtm` keeps reading each Procedure's own inputs and its own Contract's line through 19a's
     resolver. On an additional Procedure base is 0 with a new layer value `'additional'` (added to 19
     and 19a's union, and grepped through every reader), whatever its procedure, its line, a range
     choice or stored capture. On the primary, `btm.modifiers` is the Booking's modifier total, 19b's
     `resolveModifiers` on the primary (the starting figure plus the locked and claimed items, or the
     manual M adjustment). An additional Procedure's own modifier items and starting modifier figure
     are ignored: the store forbids claims on it (item 8e), and the engine must not count them twice if
     old data carries them, or count the locked age modifier once per Procedure.
   - `splitBillingUnits` is deleted. Charged units are B + T + modifier share on the primary, and T +
     modifier share on a calculated additional Procedure.
   - Pricing stays 19a's, applied to the charged units: a fixed price resolves, so it is the whole
     price, the BTM (with the allocation) returned for reference, on primary and additional alike
     (US-05.2.5); otherwise charged units x (the line's fixed rate or the anaesthetist's unit value) x
     (1 less the line's fixed discount), rounded once. This is AR-29's CALCULATED step with the units
     adjusted first. Keep that rate and discount read in one place in `feeFor`, so 24's precedence
     slots in around it once.
   - Line descriptions, which reach invoice lines (inside 22's line format), with no dashes. A
     single-Procedure Booking keeps exactly the description 22 left, so no single-procedure invoice,
     snapshot or spec changes. With two or more Procedures:
     - calculated primary: "Anaesthesia, primary procedure (B 6 + T 6 + M 3 units)", and when split,
       "(B 6 + T 6 + M 3 of 7 units)";
     - calculated additional: "Anaesthesia, additional procedure (T 2 + M 2 of 7 units)", or "(T 2
       units)" with no share;
     - a fixed-price Procedure keeps 19a's "Contract price" line, with "primary procedure" or
       "additional procedure" added only when the Booking has two or more Procedures.
   - `FeeResult` gains `allocation` (echoed). `billableUnits` means the units charged at a rate, which
     is 0 on a fixed-price Procedure.
   - The office price override still applies per Procedure after the rule, as today. Phase 24 builds
     the full precedence (office override, the anaesthetist's typed price on adjustable Contracts, the
     fixed price, then calculated) with a recorded price source; an override or typed price replaces a
     Procedure's price but does not change who took part in the split (item 3 decides participation
     from the Contract line alone). Say so in a test and in the handoff.

5. **The Booking-level engine** (new `src/domain/billing/bookingFee.ts`).
   - `bookingFeeFor(procedures, ctxFor)`. `ctxFor(procedure)` returns that Procedure's `FeeContext`
     without an allocation, including its Contract version in force on the procedure date, its line
     and the resolver's starting values (19a), so `invoiceBuild` can inject each Procedure's resolved
     Contract.
   - Pass 1 resolves each Procedure's terms and B/T/M on its own Contract through 19a's resolver,
     classifies it calculated (no fixed price resolves) or fixed, and takes the Booking modifier total
     from the primary through 19b's `resolveModifiers`. Pass 2 calls `allocateBooking`, then `feeFor`
     for each. Base units count only on the primary; nowhere does a line's base figure reach an
     additional Procedure's charge.
   - With `MULTI_PROCEDURE_RULE_APPLIES` false it prices each Procedure alone (its own base, its own
     modifiers), so OQ-90's "No" is the switch plus the capture's role selector.
   - It returns `{ kind: 'ok'; primaryId; order; allocations; fees: Record<ProcedureId, FeeResult>; units; total }`
     (`order` from `inDisplayOrder`), or `{ kind: 'structural'; reason: 'noPrimary' | 'severalPrimaries' }`.
   - Export both new modules from `billing/index.ts`, beside 19a's resolver, so the pricing model stays
     in one place.
   - Tests (`bookingFee.test.ts`), dollar figures pinned from a hand calculation written in the test:
     - The seeded three-procedure example (item 9c) at Dr Souter's seeded unit value: the primary's
       base from its RVG group (or procedure figure), each Procedure's own T, M 3/2/2 from AS3 + OB3 +
       ASE + the locked A1, and the total.
     - The same Booking after making the second procedure primary: base from the new primary's own
       group or procedure figure (item 9c picks procedures whose base figures differ), modifiers still
       3/2/2 with the 3 now on the new primary, and the new primary listed first.
     - The same Booking with one additional Procedure on a fixed-rate line: still 3/2/2, each share
       priced at its own Contract's rate (US-05.2.6 carried across); with a fixed-discount line: the
       discount applies to that Procedure's charged units only.
     - A line base figure on the primary's Contract wins (19a's `'line'` layer); the same line base
       figure on an additional Procedure's Contract changes nothing; making that Procedure primary
       brings it into B.
     - An additional Procedure on a fixed-price line keeps its price and takes no share (the bariatric
       $2,800 + $950 unchanged).
     - A fixed-price primary with calculated additional Procedures: the additional Procedures earn T
       and their shares, never base.
     - Holt: the same total as before the phase, and the invoice still the figure item 1 pinned in
       `invoiceBuild.test.ts`.
     - A manual M adjustment on the primary is the total that splits.
     - A single Procedure on the seeded combination Contract (item 9b) charges the line's price,
       whichever parent procedure it carries; the Merivale "Facelift plus 1 add on" Procedure charges
       $3,910 ex GST, with GST at the invoice foot (US-05.2.7 carried across).
     - A single-Procedure Booking is unchanged (the parity fixture proves it at scale).
     - The switch off: Holt's additional Procedure regains its own base.
     - The structural refusals.

6. **Combination Contracts, pure** (US-04.2.11; OQ-53 and OQ-66 answered), beside 19a's line helpers
   and 20's candidate selector.
   - A combination is offered by **20's candidate rule as it stands**: valid on the procedure date, a
     line for the procedure (19a's `lineFor`), its holder fits the Booking. Because it has a line under
     each parent, it is offered for each parent and for no other procedure. Do not write a second
     procedure matcher or a separate "Combinations" group: it sits under its holder heading **beside
     the single-procedure Contracts** (Greg, 2026-10-07: the combined price can be lower than the
     parts). 20's composite search finds it by AA code, name or holder code like any Contract. On the
     RVG codes tab, 20's route to the lines across a group lists a combination's line for each parent
     in that group.
   - `combinationParts(contract, lines, procedures)` returns the parent procedures' names in line order,
     for the picker caption, 20a's stack and Phase 39's split. A single-parent combination (the
     Merivale "Facelift plus 1 add on") returns its one parent; its components are named in the
     Contract's name, and 39's split prefill handles one part (handoff).
   - `coveredByCombination(procedures, contractsAndLines)` returns, for each Procedure whose procedure
     is a parent of a combination Contract already chosen on another Procedure of the same Booking,
     that Procedure's id and the combination (the inline note in item 13; never a block).
   - The Booking records only the Contract: no component Procedures are created, and the Procedure on
     the combination keeps the parent procedure it was picked from.
   - Tests (extend 20's selector test, add `combination.test.ts`):
     - acceptance criterion 1: with the seeded combination set against three procedures, picking any
       of the three on a Southern Cross Booking offers it, beside the single-procedure Contracts that
       fit;
     - acceptance criterion 2: the Merivale "Facelift plus 1 add on" is a fixed-fee Contract under Face
       lift priced at $3,910, offered with "Face lift" ($3,565) and "Facelift plus 2 add ons" ($4,255)
       under the Merivale holder heading when the Booking's surgeon is in the Merivale rooms;
     - a fourth procedure, a Booking whose holder does not fit, and a version not in force are not
       offered it; No contract (RVG) still comes first;
     - its AA code typed on a parent procedure filters to it; typed on a fourth procedure it finds
       nothing new;
     - `combinationParts` order, and one part for a single-parent combination;
     - `coveredByCombination` finds a second Procedure for liposuction beside an abdominoplasty on the
       combination, and nothing when no combination is chosen.

7. **Rewire every fee caller onto `bookingFeeFor`.** No pricing path may read a position afterwards.
   - `validateBookingForBilling.ts`:
     - `feeContextFor(procedure, ctx)` takes no ordinal, and any fee check left in the validator
       prices through `bookingFeeFor`;
     - a structural result is a failure on field `isPrimary`: "This Booking needs exactly one primary
       procedure";
     - whatever 19 and 19a left for a ranged base figure with no value chosen (D3: any value accepted,
       an office warning out of range) applies to the primary only, because base is never charged on an
       additional Procedure.
   - 19's out-of-range base-unit warning rule (in 15a's routine) evaluates the primary only, and
     re-evaluates after Make primary. A warning raised on the old primary clears through the routine's
     normal re-run.
   - 21's completion rule for modifier explanations reads the primary's claims (the only claims a
     Booking holds once item 8e lands).
   - `invoiceBuild.ts`:
     - `buildInvoicesForBooking` resolves every Procedure's Contract version first, then prices the
       Booking once with `bookingFeeFor`, then keeps 21's grouping by billable party, 22's split and
       prepayment netting per Procedure, and orders lines with `inDisplayOrder`;
     - 22's split applies to each Procedure's allocated fee. Each Procedure still has its own priced
       line under its own Contract, so the split shares stay keyed by Procedure and need no re-key
       (close 22's handoff), and Make primary does not move a share. Test a split on an additional
       Procedure;
     - grouping is unchanged, so the invoices, the ACCPAYs and `bctisFor`'s count are unchanged for
       every seeded Booking; assert that the three-procedure Booking yields one receivable and one BCTI;
     - a structural result is exception `noPrimaryProcedure`;
     - `buildPrePaymentInvoiceForBooking` prices through the same engine until 27 replaces it.
   - `store/billingLineActions.ts` (both guards; they compute the ordinal from position today) and
     `seed/billing.ts` `contextFor`.
   - `shared/capture/feeContext.ts`:
     - reshape `bookingFee` to `bookingFee({ procedures, list, masters, billingLines })` and delete
       `procedureFee`. It returns `{ units, total, order, views: Record<ProcedureId, ProcedureFeeView> }`
       (`BookingFeeTotals` grows to this), and each view carries its `fee`, `allocation`, `baseLayer`,
       `contract`, `line` and `nonRvgLines`;
     - update the `shared/capture/index.ts` exports and the comments in `BookingTotalPanel` and
       `shared/surface/context.ts`;
     - `bookingFee` is the one UI assembler, and it must stay in step with `feeContextFor`.
   - UI callers: `BookingDetailBody`, `BtmCaptureBlock` (a `view` prop, no own pricing), 22's Split
     row, `OfficeBillingSetup` (any `ordinal` prop and "procedure {ordinal}" heading left go; it reads
     "primary procedure" or "additional procedure"; keep the `office-billing-setup-n` hook numbered by
     `inDisplayOrder` so recipes keep landing), 20a's stack (order only; its selectors are unchanged),
     `ReviewScreen`, `ListDetailView` and `reviewFlags` (`naturalBtm` keeps working per Procedure; the
     flags take the view's fee).
   - Grep `ordinal`, `isAdditional`, `splitBillingUnits` and `procs[0]` across `src/`. Only display
     numbering ("Procedure 2" labels, from `inDisplayOrder`) may remain.

8. **Store actions.**
   - a. **Creation keeps exactly one primary.**
     - `createBooking` creates its first Procedure with `isPrimary: true`. The first Procedure entered
       is the primary by default, which matches the rooms' sheet order AA staff work from.
     - `addProcedure` creates `isPrimary: false`. It starts on the **primary's** Contract when that
       Contract fits the new Procedure's procedure under 20's candidate rule (a line for it, a plain RVG
       Contract, or No contract (RVG)), not index 0's (20 wrote "the first Procedure's Contract";
       re-base it here), and otherwise follows 20's rule for a new Procedure (No contract (RVG), or
       blank and on the "Needs a Contract" list, as 20 built it).
     - The integration create paths (`integrationActions.ts`, about 150 and 467) and the manual flow go
       through `createBooking`, so they inherit this.
     - `addPostOpAddendum` creates its Procedure with `isPrimary: true` (the addendum is its own Booking
       until 38b replaces it with an additional invoice and 39b withdraws the anaesthetist's post-op
       flow).
   - b. **`setPrimaryProcedure(api, actor, procedureId)`** in `store/bookingActions.ts`, exported from
     `store/index.ts`. It serves US-03.2.2 and US-03.2.1.
     - Guard order: `notFound`, then `bookingCancelled`, then `editRefusal` (AUTHORISED is locked; the
       anaesthetist needs their own ACTIVE List; an integration actor needs ACTIVE; the office has
       ACTIVE and SUBMITTED, and the Draft Lists Phase 31 adds), then `bookingCompleted` for the
       anaesthetist only ("This Booking is marked complete. Amend it before changing the primary
       procedure."; the office corrects completed Bookings at review, as it does other fields), then
       `alreadyPrimary`.
     - One `mutate()`, two `procedure.setPrimary` metas (old and new, before and after), stamping the
       Booking. The audit source is the actor's, so a feed writes `integration`.
     - The effect:
       - the old primary's flag clears and the new one's sets;
       - the Booking's modifier records move from the old primary to the new one: 19b's
         `modifierClaims` (each with its explanation) and any manual M adjustment
         (`modifierUnitsCaptured`). The locked modifiers are derived, so they are re-derived for the
         new primary (its group's included P1, the patient's age on the procedure date) through 19b's
         `reconcileClaims`; a claim the new primary's group includes (a claimed P1 moving onto a Spine
         or Neurosurgery procedure) is dropped and kept in the audit `before`. Picked reading, logged;
       - the old primary's base inputs (a recorded base value, and the chosen value on a ranged
         starting figure, whichever fields 19 and 19a use) are cleared and kept in the audit `before`,
         so no additional Procedure carries base inputs (item 8e, the seed invariant);
       - the new primary's base starts from 19a's resolver for its own Contract and procedure (the
         line, the procedure, the group). If that figure is a range with no value chosen, 19's rule for
         that case applies; that is correct and needs no special case.
     - Returns `{ previousPrimaryId }`.
   - c. **`removeProcedure` guards by flag, not position.** It refuses `primaryProcedure`: "The primary
     procedure cannot be removed. Make another procedure primary first, or cancel the Booking if the
     whole booking is wrong." The 2026-07-27 ruling (no silent promotion) is carried forward: removal
     never promotes anything, and the user promotes explicitly.
   - d. `ProcedurePatch` omits `isPrimary`. `editProcedure` refuses an `isPrimary` key with
     `usePrimaryAction` ("Use Make primary to change the primary procedure.") as a defensive guard for
     untyped callers.
   - e. **Structural enforcement on additional Procedures** (US-05.3.1 "enforced structurally, not just
     as a UI hint"), through `procedureRole`:
     - `editProcedure` refuses a recorded base value on an additional Procedure, with
       `additionalProcedureBase`: "Base units are charged on the primary procedure only.";
     - 19b's `claimModifier` and `editModifierExplanation`, and `editProcedure`'s manual M adjustment,
       refuse an additional Procedure with `modifiersOnPrimary`: "Modifiers are recorded once for the
       Booking, on the primary procedure.";
     - only a value is refused. Clearing a key (`undefined`, or removing a claim) is allowed, because a
       procedure or Contract change clears base keys and 19b's `reconcileClaims` may remove claims, and
       changing an additional Procedure's procedure or Contract must keep working. Test both;
     - 19's procedure pick and 20's Contract pick on an additional Procedure write no base input (the
       resolver's starting figure shows, uncharged) and no claims. There is no procedure-default
       pre-fill to merge (19b, US-05.1.4).
   - f. **Contract action** (office only, audited, returning `Outcome`):
     `setContractCombination(contractId, isCombination)`, refused with `combinationNeedsLines` ("A
     combination Contract has a line under each procedure it covers.") when the version has no lines,
     and with `combinationNeedsFixedPrice` ("A combination Contract sets a fixed price on every line.")
     when any line has no fixed price. Extend 19a's line actions so they refuse, with the same
     sentence, clearing a fixed price on a combination's line or adding a line with none. 18's
     new-version flow copies the flag with the lines. No contract (RVG) can never be a combination.
     Before 25's lock, an edit re-prices unlocked Bookings on that Contract, and AUTHORISED invoices
     keep what they issued; say so in a test.
   - Tests (extend `bookingActions.test.ts`, `captureActions.test.ts`, 19b's modifier action tests and
     `postOpAddendum.test.ts`; add `store/multiProcedureActions.test.ts`):
     - create, add, post-op addendum, remove and set-primary each leave exactly one primary;
     - an added Procedure starts on the primary's Contract when it fits, also when the primary is not
       first, and otherwise on 20's rule;
     - set-primary moves the claims and the manual M adjustment, re-derives the locked modifiers,
       drops a now-included P1 claim into `before`, and clears the old base inputs, with both audit
       entries;
     - set-primary onto a Procedure whose Contract has a line base figure gives B from the line;
     - every guard in order;
     - an integration actor succeeds on ACTIVE and is refused on SUBMITTED with `integrationImmutable`;
     - the anaesthetist is refused on a completed Booking, and the office is not;
     - removing the primary is refused, and removing an additional Procedure still cascades its lines;
     - the base and modifier refusals, and that a procedure or Contract change on an additional
       Procedure still succeeds;
     - the combination guards and audits, and the line-action guard.

9. **Seed.** One `PERSIST_VERSION` bump for the phase. Draw nothing new from the seeded RNG, and do not
   call `takePatient()` for new data: it shifts every later draw. The parity fixture proves both.
   - a. `bookings.ts`: the spec helper's `isAdditional` becomes `isPrimary`, true for a Booking's first
     Procedure unless the spec says otherwise. Any modifier claim 19b's migration left on an additional
     Procedure (the Holt and bariatric pairs) moves to the primary, a duplicate code dropped, so modifiers
     are one set per Booking; neither figure moves (Holt's claims are worth 0, the bariatric pair is
     fixed-price). `history.ts`, `audit.ts` and `fixtures.ts` follow.
   - b. **Contracts and procedures.** Every Contract gets `isCombination: false`, except the new ones
     below. Everything new is appended after every existing holder, Contract, line, room and procedure,
     so no id or AA code moves; the seed test asserts every existing id and AA code is unchanged.
     - **The parents.** 19's procedures for abdominoplasty, breast lift, liposuction and face lift (each
       in exactly one RVG group). Append any that 19 and 19a did not seed, in its group, after every
       existing procedure (19a may already have added face lift and abdominoplasty for Dr Souter's price
       list).
     - **"Southern Cross cosmetic combination"**, held by the Southern Cross hospital holder 18 seeded
       (so who is billed follows that holder, as 21 built it), its AA code from 18's generator, in force
       from 2026-01-01, `isCombination: true`, with three fixed-price lines, one under each of
       abdominoplasty, breast lift and liposuction, each at the same demo-plausible combined price and
       holder code `SX-COMBO-ABL` ("Abdominoplasty, breast lift and liposuction, combined"), labelled
       demo data in a comment. Phase 39 relies on this name and holder code. No seeded Booking uses it,
       so no figure moves; Phase 39 stages the split.
     - **The Merivale set fee schedule** (US-04.2.11's second criterion, figures as the catalogue gives
       them, ex GST): append a "Merivale Plastic Surgery" room in 17's shape, with one existing cosmetic
       surgeon who has an ACTIVE Southern Cross Booking among its surgeons (BK0009's surgeon at plan
       time; confirm with a seed query and name the Booking in the PROGRESS entry and ATLAS.md), and a
       rooms holder in 18's shape for it (third party, holder not billed, so the payer on the Booking is
       billed). Then three Contracts, each with one fixed-price line under face lift: "Face lift"
       $3,565 (`isCombination: false`), "Facelift plus 1 add on (eg bleph)" $3,910 and "Facelift plus 2
       add ons (eg bleph & fat grafting)" $4,255 (both `isCombination: true`), each with its AA code.
       Putting the surgeon in the room moves no fee (the parity fixture proves it); check 17's privacy
       boundary and 20's candidate list for that surgeon's other Bookings and list what newly appears.
   - c. **The seeded three-procedure Booking**, spec in a new `src/domain/seed/multiProcedureDemo.ts` and
     shared with the trigger in item 14 (`MULTI_PROCEDURE_DEMO`: procedures, time offsets, modifier
     claims with explanations, patient).
     - Procedures: a laparoscopic cholecystectomy as primary, then an umbilical hernia repair and an
       inguinal hernia repair as additional Procedures, same anaesthetic, each with its own times
       (whatever 19's list calls them). Pick procedures whose resolved base figures differ, so Make
       primary visibly changes B; if 19's groups give them the same figure, pick another pair from 19's
       list and say so.
     - Modifiers, the domain model's worked example: claims AS3 ("ASA III, controlled COPD"), OB3 ("BMI
       42") and ASE ("Emergency case, acute cholecystitis") on the primary through 19b's `applyClaim`,
       each with its explanation, plus the locked A1 from the patient's age: 2 + 2 + 2 + 1 = 7.
     - Patient: one new fixed patient with an explicit id, aged 70 to 79 on the List date (so A1 is
       locked, under 19b's D29 bands), never from the generated pool.
     - Contracts: every Procedure on No contract (RVG), so all three are calculated and the payer on the
       Booking (the patient, 21) is billed.
     - List: a past Souter List that no S1 to S5 beat uses. Confirm with a one-off seed query at the
       drift check, and put the choice in the PROGRESS entry. Leave the List SUBMITTED (with its
       `list.submit` audit) and the Booking completed, so it sits in the Review queue and can be
       authorised to show invoice lines.
     - Build it after every existing seeded Booking, so its Booking, Procedure, patient and audit ids are
       allocated last and no existing seeded id moves. The seed test asserts the existing ids are
       unchanged.
     - Check the Review queue: it gains exactly this one row. "Next in queue" from Souter Mon 20 AM must
       still land on Mon 20 PM (S3 Beat 1), and no scripted count may move. Check 15a's to-do list count
       too: the new Booking raises no warning (its explanations are present; an emergency case is not a
       warning).
     - Add `scenario.multiProcedure` to the seed ids.
     - Replace the `splitBillingBooking` scenario detail ("Second procedure isAdditional: time units only
       on the BTM path.") with "Additional procedure: its own time units, base on the primary only,
       modifiers on the primary (4 or fewer)". Replace the `bariatricType3Booking` detail (whatever 19a
       left of "second procedure priced by the ordinal rule") with "two fixed-price lines: the
       additional procedure keeps its own Contract price". Add a `multiProcedureBooking` entry: "Three
       procedures, 7 modifier units, split 3 · 2 · 2".
   - d. `seed.test.ts`:
     - exactly one primary in every Booking with Procedures (FT-03.2 carried across);
     - no additional Procedure carries base inputs, modifier claims or a manual M adjustment;
     - every Contract has an `isCombination` value; every combination has at least one line, a fixed
       price on every line and a unique AA code; the Southern Cross combination has lines under its
       three parents, each resolving in 19's procedure list;
     - the Merivale holder, room and three Contracts, with $3,565, $3,910 and $4,255 under face lift;
     - every holder, Contract, line, procedure id and AA code that existed before this phase is
       unchanged;
     - the three-procedure Booking allocates 3/2/2;
     - bariatric is still $2,800 + $950 from its two fixed-price lines;
     - no seeded Procedure is on a combination Contract;
     - the parity fixture holds except for the new Booking, and `bctisFor` counts are unchanged.

   **Session 1 ends here, green:** `npm run build`, `npm run build:pwa`, `npx vitest run`, with the parity
   fixture diff limited to the new Booking.

10. **Capture UI, shared by mobile, web and admin** (US-03.2.1, US-03.2.2, US-05.3.1).
    - a. **The primary first.** `BtmCaptureBlock`s and 20a's stacks render in `inDisplayOrder`: the
      primary at the top, then the rest in Booking order. After Make primary the blocks re-sort with the
      theme's `motion/selection-slide` (never blocking; reduced motion falls back to the 80 ms fade).
    - b. **The block header.** When the Booking has more than one Procedure:
      - the primary shows a neutral "Primary" pill beside its "PROCEDURE 1" label and on the procedure
        part of 20a's stack (`data-shot="procedure-primary-pill"`);
      - each additional Procedure shows a teal "Make primary" text action beside Edit
        (`data-shot="make-primary"`). It is offered under the same rule as Edit, and hidden for the
        anaesthetist on a completed Booking;
      - "Remove" shows only on additional Procedures, by flag.
    - c. **`MakePrimarySheet`** (new, `src/shared/flows/`, through `useSurface().Overlay`, so it is a
      bottom sheet on mobile and a dialog on desktop), modelled on `RemoveProcedureSheet`.
      - Title: "Make this the primary procedure?"
      - Body: "Base units will come from {procedure}. The Booking's modifiers move to this procedure,
        and it moves to the top. {old procedure} becomes an additional procedure and stops carrying
        base units." Add "Its recorded base units are cleared." only when there is a recorded value,
        and "{code} is already included in {procedure}'s base units, so it is removed." only when a
        claim is dropped.
      - Actions: a teal "Make primary" and a secondary "Keep {old procedure}". It calls
        `setPrimaryProcedure`; a refusal shows in the sheet.
    - d. **The additional note** (the accent tint note, same place; keep the `procedure-additional-note`
      hook):
      - calculated: "Additional procedure. Base units are charged on the primary procedure only. It
        earns its own time units, and an equal share of the Booking's modifiers once they total more
        than 4."
      - fixed price: "Additional procedure on a fixed price. Its Contract's price is the whole price;
        its units are recorded for reference."
      - Units only, no dollar amount (the 2026-09-28 ruling, where the catalogue gives no price).
    - e. **Modifiers on an additional Procedure.** 19b's claim actions and claimed rows are not
      rendered there. One caption row replaces them: "Modifiers are recorded once for the Booking, on
      the primary procedure." US-05.1.4's acceptance criteria hold per Procedure, so an additional
      Procedure on a Neurosurgery or Spine code still shows its own locked included P1 at 0 units,
      read-only (from `lockedModifiersFor` on its own group; it adds nothing, and the engine never
      counts it). The age modifier is a Booking-level unit and shows once, on the primary.
      The range chooser (wherever 19 and 19a show a ranged starting figure) is hidden on an additional
      Procedure, which reads "Base not charged on an additional procedure".
    - f. **`UnitsCard` takes `allocation` in place of `isAdditional`.**
      - Primary B row: 19 and 19a's captions, including the layer caption ("From the Contract line",
        "From the procedure", "From the RVG group").
      - Additional B row: 0, caption "Base units are on the primary procedure", no stepper.
      - T row: unchanged on every Procedure.
      - Primary M row: the Booking total (19b's itemised total, or the manual adjustment it edits). Its
        caption adds "Booking total 7, split 3 · 2 · 2. This procedure carries 3." when split.
      - Additional M row: its share, with "Share of the Booking's 7 modifier units", or "None · the
        Booking's 3 modifier units stay on the primary" at 4 or fewer, or "Not shared · priced by its
        Contract's fixed price". No stepper.
    - g. **A Procedure on a combination Contract** shows a neutral "Combination" pill in the Contract
      part of 20a's stack and the caption "Covers {parts}" (from `combinationParts`). Its pricing basis
      shows through 20a's selector, as for any fixed-price Contract.
    - h. Mobile, web and admin share these components, so there is one change for all three, and the PWA
      gets it through the shared capture.

11. **The Booking total, Review and invoices (office).**
    - a. `BookingDetailBody` `bookingBreakdown` builds its rows from `bookingFee`, in `order`. The row
      notes are:
      - "Primary · B + T + M 3 of 7";
      - "Additional · T + M 2 of 7";
      - "Additional · fixed price" (the line's price; units for reference);
      - on a combination Contract, the Contract's name only ("Southern Cross cosmetic combination ·
        fixed price"), never the components.
      "Time units only" is deleted. Under the rows, one neutral caption: "RVG multi-procedure rule" with
      a neutral "Provisional · to confirm with AA (OQ-90)" pill, shown only when the Booking has more
      than one Procedure: the phase's one provisional label (D26). The history entity labels read
      "Primary · {description}" and "Additional · {description}". Hook:
      `data-shot="booking-total-split"` (inside the existing `booking-calculation` test id, which
      recipes already highlight).
    - b. The anaesthetist surfaces stay free of a calculated total: grep that no `bookingFee(...).total`
      reaches mobile or anaesthetist web output (`BookingDetailBody`'s `showBookingTotal` stays false for
      the anaesthetist).
    - c. `ReviewScreen`:
      - the row's `primary` is the `isPrimary` Procedure;
      - a multi-procedure row's BTM cell adds "M 7 · split 3 · 2 · 2" (mono, tabular);
      - the per-procedure detail (21's stack in Review) shows each share, primary first;
      - `entityLabels` use Primary and Additional.
    - d. Invoice lines carry item 4's descriptions inside 22's layout, primary first. Confirm that each
      line shows its own Procedure's units and amount (US-05.3.5 still matches), and that the seeded
      three-procedure Booking still gives one invoice and one ACCPAY.
    - e. `ListDetailView` (web) and any other row that shows "the operation" through `procs[0]` use the
      primary's description. Grep `[0]?.description` and `procs[0]`.

12. **The Admin Contract editor** (18's and 19a's `ContractEditSheet`), for US-04.2.11.
    - a. **Combination.** A "Combination of procedures" switch above 19a's lines grid, saved through
      `setContractCombination`, with the caption "A fixed price that covers more than one procedure.
      Offered under each procedure it has a line for, beside the single-procedure Contracts. The
      Booking records only this Contract." Refusals show inline. Hook: `data-shot="contract-combination"`.
    - b. The Contracts catalogue gains a neutral "Combination" pill on combination rows (and in the
      detail panel's header).
    - c. No multi-procedure rule section and no ordinal anywhere (US-04.2.5 Retired; 19a removed the
      ordinal).

13. **Combinations in the Contract picker** (20's picker sheet, mobile, web and admin).
    - A combination row sits under its holder heading beside the single-procedure Contracts, with the
      neutral "Combination" pill, the AA code, "Covers {parts}" and 20's pricing-basis caption, in the
      shape 20 gives the anaesthetist and the office. Typing its AA code filters to it with 20's match
      text. Hook: `data-shot="contract-picker-combination"`.
    - When `coveredByCombination` flags a Procedure, its block shows an accent tint note: "{Contract}
      already covers {procedure}. Remove this procedure unless it is billed separately." It never
      blocks.
    - No new group, search or navigation: 20's candidate list, holder headings and composite search
      are the answered navigation (OQ-66).

14. **Demo triggers** (registry entries in 14's `src/shared/demoTriggers/registry.ts`; bodies in a new
    `src/store/demoMultiProcedure.ts`, so `pwaPurity` holds). See "Demo triggers" below for labels and
    effects.
    - `stageMultiProcedureBooking(api)` reuses `MULTI_PROCEDURE_DEMO` and the real store actions:
      `createBooking`, `addProcedure` twice, 19's procedure pick, 20's Contract pick (No contract (RVG)),
      `editProcedure` for times and 19b's `claimModifier` for the three claims with their explanations
      (on the primary only, so item 8e never refuses it). It uses a demo actor (office role, audit
      source `demo`), added to 14's `src/store/demoActors.ts` beside `OFFICE_ACTOR`. It needs a patient
      aged 70 to 79 for the locked A1: it reuses the fixed patient from item 9c. It is idempotent per
      List.
    - `feedChangesPrimary(api, bookingId)` calls `setPrimaryProcedure` with an integration actor for the
      List's hospital: the feed config in `domain/integrations/feeds.ts` whose `hospitalId` is the List's
      hospital gives the `FEED_META` label; any other hospital gets `{ who: 'Hospital feed', role:
      'system', source: 'integration' }`. Export a small helper from `integrationActions.ts` for this
      rather than duplicating `integrationActor`. It targets the next Procedure after the current primary
      in Booking order, cycling.
    - Vitest (`demoMultiProcedure.test.ts`):
      - both bodies are deterministic;
      - the loader refuses a second load on the same List;
      - the feed change is audited with source `integration` and refused on a SUBMITTED List;
      - both entries' `disabledReason` strings;
      - the new ids are unique in the registry test.

15. **Copy, labels and scenario text sweep.**
    - Grep `src/` for "time units only", "Time units only", "Not charged on an additional procedure",
      "stay on the first", "first procedure", "split-billing", "split billing", "isAdditional" and
      "ordinal", and update each.
    - Labels: `fieldLabels` gets `isPrimary: 'Primary procedure'` and `isCombination: 'Combination of
      procedures'`; `isAdditional` is removed. `actionLabels` gets `procedure.setPrimary: 'Primary
      procedure changed'` and `contract.setCombination: 'Combination changed'`.
    - `DemoControlPanel.tsx` S3 scenario text (the blurb at 285, the steps at 297): "the split-billing
      and two-funder Lists" and "the split-billing Booking" become "the multi-procedure and split
      Lists" and "the multi-procedure Booking" (keep whatever 22 named the split).
    - Comments in `fee.ts`, `bookingActions.ts` and `types.ts` that cite the RFP split-billing rule are
      rewritten.
    - Every new string follows the no en/em dash rule: middots, commas or "to". No "slot" or "swap".

16. **Playwright and green.**
    - Update the specs that assert the old note, captions, procedure order or "Time units only":
      - `mobile-phase04.spec.ts` (the additional-procedure note);
      - `admin-phase08.spec.ts` (the multi-procedure invoice);
      - `booking-calculation-display.spec.ts` (still no anaesthetist total).
    - Add specs for:
      - mobile: add a procedure, "Make primary", the new primary moves to the top with the pill, the B
        captions change over, and the Modifiers section moves with it;
      - the Admin Booking total on the seeded three-procedure Booking, showing 3/2/2 and the one
        provisional pill (`booking-total-split`);
      - the Review row's split text;
      - the Contract editor's combination switch and its refusal;
      - the Contract picker on a Southern Cross Booking offering the combination for abdominoplasty
        beside the singles, and its AA code filtering to it (`contract-picker-combination`); and on the
        Merivale surgeon's Booking for face lift, the three Merivale Contracts under one heading;
      - both triggers from the harness bar (`demo-actions.spec.ts`);
      - `pwa-device.spec.ts`: the feed trigger from the PWA sheet on a two-procedure Booking.
    - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`. All must be green.

## Demo triggers

Two harness-bar entries, both also on the PWA sheet. "Make primary" and the combination offer are normal
use on every surface and need no trigger. No mobile beat waits on the office here, so no PWA office
stand-in is needed. The Control Panel page gets no trigger; only its S3 scenario text changes (item 15).

Seeded, no button: the three-procedure Souter Booking with 7 modifier units (3/2/2 on the Booking total,
in Review and on invoice lines once authorised), the Southern Cross cosmetic combination (picking
abdominoplasty, breast lift or liposuction on a Southern Cross Booking offers it in the picker, on
mobile, web and admin, and its AA code finds it there) and the Merivale set fee schedule (picking face
lift on the Merivale surgeon's Booking offers the three Merivale Contracts side by side).

The feed entry's label says "changes", not "swaps": the vocabulary rule is "move or reassign, never
swap".

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `load-multi-procedure-booking` | Load 3-procedure Booking (7 modifier units) | List detail and Booking detail in all three apps: `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId`, `/web/lists/:listId`, `/web/lists/:listId/bookings/:bookingId`, `/admin/day/:dateISO/bookings/:bookingId` | bar and pwa | Adds the `MULTI_PROCEDURE_DEMO` Booking (a cholecystectomy primary and two hernia repairs, AS3 + OB3 + ASE claimed with explanations plus the locked A1 = 7 modifier units, each on No contract (RVG), times set, not marked complete) to **Dr Souter's next open List**: the earliest Souter List dated after the demo clock's today that is ACTIVE, booked and has a hospital. Message: "Loaded on Dr Souter's {date} {session} List: 3 procedures, 7 modifier units, split 3 · 2 · 2." `indexPath` is that Booking's Admin detail | "Already loaded on {date} {session}" when that List holds a Booking for the demo patient; "Dr Souter has no open List ahead" when there is none |
| `feed-changes-primary` | Hospital feed changes the primary | Booking detail in all three apps (the Booking in the URL); `when` the Booking has two or more Procedures | bar and pwa | The inbound source for the List's hospital makes the next Procedure primary through `setPrimaryProcedure`, audited with source `integration` under the feed's label; the new primary moves to the top. Message: "{Feed} made {description} the primary. Base units now come from it." | The List is not ACTIVE ("A hospital feed cannot change a submitted List", mirroring `integrationImmutable`); the Booking is cancelled; fewer than two Procedures (hidden by `when`) |

Neither entry carries the Future-scope badge: the inbound source is in scope (US-03.2.2, Confirmed) and
is not the HL7/FHIR tooling that Phase 34 demotes. Both show the standard "Demo trigger" badge. This
phase applies the feed's change directly because the matching screen does not exist yet. Once it does,
the change should land as a matching row ("no automated decisions", FT-02.1). Phase 33's plan does not
yet list this entry, so put it in this phase's handoff to 33 and in the PROGRESS open items (44's
trigger audit is the backstop).

## Out of scope

- Base units, the resolver's layers, Contract lines and their editor, and the time tiers as data
  (19 and 19a; OQ-62 answered). This phase reads them.
- Modifiers as records, the locked age and P1, the explanation on claiming, and the modifier master
  (19b). This phase moves them between Procedures and reads their total.
- Any per-Contract multi-procedure rule, percentage of a second code, add-on fee or not-billable rule
  (US-04.2.5 and US-05.3.4 Retired). How a fee schedule such as SXAP or CES that prices a second code
  at 50% expresses it is open with OQ-89 and OQ-90; build nothing for it.
- The price precedence, the price source, the engine rejections and the anaesthetist's typed price or
  discount (Phase 24).
- Locking `isPrimary`, the allocation, the switch's state, the base layer and the combination Contract
  at AUTHORISED in the pricing snapshot (Phase 25). Until then a Contract edit re-prices unlocked
  Bookings.
- Splitting a combination's invoice: after it is sent, a credit note against the original and then
  additional invoices (US-08.6.4, US-08.6.5, OQ-72: Phase 39, on 38b's event element). The rebill total
  (OQ-77 part 1, answered) and a split before invoicing (OQ-77 part 3, D41) are 39's. Greg's
  "operation" container was not adopted and is not built.
- Any change to how a Procedure selects its Contract beyond an added Procedure starting on the
  primary's, or to the picker's navigation (Phase 20, OQ-66), to who is billed or the payer (Phase 21),
  or to invoice grouping and the split (Phases 21 and 22).
- The ACC pre-op assessment, which becomes a pre-op event (Phase 39b), never a Procedure.
- Setting the primary from an imported rooms' sheet or hospital row. Imports create through
  `createBooking`, so the first row's procedure is the primary; 33 and 34 edit the primary Procedure.
  Neither plans an import-driven primary change; note it in the handoff.
- The ledger's per-Procedure share records (Phase 36). The share is recorded on invoice lines as today.
- Spreadsheet loads (Phase 42). The combination flag stays a Contract editor field (a load column for
  42).
- Showing a calculated fee or Booking total on the anaesthetist Booking (the 2026-09-28 ruling stands
  where the catalogue gives no price; 24 decides the anaesthetist's price fields).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Mobile (Dr Souter): on an ACTIVE Booking, add a procedure. The first shows the "Primary" pill at
      the top (capture and 20a's stack). The new one shows the additional note, B 0 "Base units are on
      the primary procedure", its own T, the modifiers caption row instead of the Modifiers section,
      and "Make primary". It starts on the primary's Contract when that fits its procedure.
- [ ] "Make primary" opens the bottom sheet and names what moves. Confirm it. The new primary slides to
      the top with the pill, the B captions change over (with their layer), the Modifiers section now
      renders on the new primary with the same claims and explanations, the locked rows re-derive for
      it, and the Booking history shows two "Primary procedure changed" entries.
- [ ] On 19b's seeded Spine Booking (its P1 beat), add a second, non-Spine procedure and make it
      primary: the Spine Procedure, now additional, still shows P1 locked at 0 units (US-05.1.4), no
      claim actions, and the Booking's M total does not change because of it.
- [ ] "Remove" is not offered on the primary. Removing an additional Procedure still works.
- [ ] Changing the procedure or Contract on an additional Procedure still works (no base refusal), and
      it still shows B 0 and no Modifiers section.
- [ ] The anaesthetist sees no calculated fee or Booking total on mobile or web; the multi-procedure
      captions carry units only.
- [ ] Web (anaesthetist): the same Make primary walk works through the desktop dialog, and the List
      row's operation text is the primary's.
- [ ] Admin: open the seeded three-procedure Souter Booking. The Booking total rows read "Primary · B + T
      + M 3 of 7", "Additional · T + M 2 of 7" and "Additional · T + M 2 of 7", the provisional OQ-90 pill
      shows once, and the total equals the Vitest-pinned figure. The primary's Modifiers section lists
      AS3, OB3 and ASE with their explanations and the locked A1.
- [ ] Make the second procedure primary from Admin. It moves to the top, base changes to its own figure,
      the 3 moves to it, and the total changes to the second pinned figure. Make the cholecystectomy
      primary again, and the original total and order return.
- [ ] On the ACTIVE three-procedure Booking the loader trigger adds (not the seeded SUBMITTED one), put
      one hernia repair on a Contract with a fixed-price line: it shows "Additional · fixed price", takes
      no share, and the split becomes 4 · 3 over the other two. Put it back on No contract (RVG).
- [ ] Review queue: the seeded List's row shows "M 7 · split 3 · 2 · 2". "Next in queue" from Souter Mon 20
      AM still lands on Mon 20 PM. The Admin to-do list count is unchanged.
- [ ] Authorise the seeded List. One invoice to the payer on the Booking; its lines read "(B n + T n + M 3
      of 7 units)" and "(T n + M 2 of 7 units)", primary first, and each line's amount matches the Booking
      total row. The Xero simulator shows one ACCPAY for it.
- [ ] S3 Beat 1 after a reset: Holt AA-2026-0002 is the figure item 1 pinned, with one invoice, and its
      additional line reads "Anaesthesia, additional procedure (T 2 units)". The bariatric Booking is
      still $2,800 + $950. The split pair 22 kept is unchanged.
- [ ] Admin → Master data → Contracts: the Southern Cross cosmetic combination and the two Merivale
      add-on Contracts show the "Combination" pill and their AA codes; "Face lift" ($3,565) does not.
      Turning "Combination of procedures" on for a Contract with a calculated line (no fixed price) is
      refused with the sentence, and clearing a fixed price on a combination's line is refused.
- [ ] Contract picker (mobile, web and admin) on a Southern Cross Booking: pick abdominoplasty, then
      breast lift, then liposuction; each lists No contract (RVG) first and the combination under the
      Southern Cross heading beside the single-procedure Contracts that fit, with "Covers Abdominoplasty,
      Breast lift, Liposuction". Type its AA code: the list filters to it with the match text. Choose it:
      the Booking shows the Contract only, with the pill in 20a's stack. A fourth procedure is not offered
      it. Add a second Procedure for liposuction: the "already covers" note shows and nothing is blocked.
- [ ] On the Merivale surgeon's Booking, pick face lift: the picker lists "Face lift" $3,565, "Facelift
      plus 1 add on (eg bleph)" $3,910 and "Facelift plus 2 add ons" $4,255 under the Merivale Plastic
      Surgery heading, the latter two with the pill. Choose "Facelift plus 1 add on": the invoice line
      prices $3,910 ex GST with GST at the foot (office view).
- [ ] Demo actions (harness bar, on a Souter List or Booking): "Load 3-procedure Booking (7 modifier
      units)" adds it to the next open List with the message. A second run is disabled with "Already
      loaded".
- [ ] On that ACTIVE Booking, "Hospital feed changes the primary" moves the pill and the order. The audit
      entry shows the feed's label with source integration. On a SUBMITTED List it is disabled with the
      reason.
- [ ] PWA (`npm run build:pwa`, handset or device spec): both entries appear in the demo-actions sheet on
      a Booking, and the feed change works there.
- [ ] Audit viewer: `procedure.setPrimary` and the combination entries show before and after.
- [ ] No en or em dash in any new app copy (grep the diff), and no "slot" or "swap" in new copy.
      Actions are teal, the Primary, Combination and Provisional pills neutral, no crimson.
- [ ] Catalogue screenshots: the recipes for US-03.2.1, US-03.2.2, US-04.2.11, US-05.3.1 and US-05.3.5
      (and the shots of US-03.2.3) are created or updated, the retired US-04.2.5 and US-05.3.4 recipes
      are set absent, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no
      failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and
      `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` green.

## Demo guide updates

Patch these in the same session, with the matching sections of `master-demo-guide.html` (the workflows
block around its "additional Procedure is time-only" lines, the billing-engine steps, the "Split billing"
cheat-sheet card and the S3 section). Line numbers are as at `60e2d1e`; earlier phases move them.

- `04-presenter-cheat-sheet.md`: the "Split billing" section (98) becomes "Multi-procedure rule":
  - one primary per Booking, always listed first, and anyone with edit rights can make another primary;
  - base on the primary only, from its Contract line, procedure or RVG group (19a's wording stays);
  - time on every Procedure;
  - modifiers recorded once, on the primary, up to 4 units, then split equally with the remainder to
    the primary (7 over 3 = 3 / 2 / 2, agreed with AA on 7 October), whichever Contracts the
    Procedures are on;
  - a Procedure on a fixed price keeps its price and takes no share;
  - whether the rule applies at all is still to confirm with AA (OQ-90);
  - a combination (abdominoplasty, breast lift and liposuction; the Merivale facelift add-ons) is one
    fixed-price Contract offered under each of its procedures beside the single ones; the Booking
    records only the Contract, and splitting its invoice after it is sent is a credit note then
    additional invoices.
  Keep the split of one Procedure between parties in whatever form 22 left it (the Split button).
  Drop any SXAP "50% second procedure" or bariatric "add-on fee" line 19a left: no Contract prices
  additional procedures by its own rule.
- `02-workflows-and-handoffs.md`: "Multiple Procedures" (around 261 to 265) is rewritten the same way
  and adds "Make primary" and the combination Contract. Billing engine step 5 (around 349), "It enforces
  time-only additional Procedures", becomes "It applies the multi-procedure rule to calculated
  Procedures".
- `01-personas-and-responsibilities.md`: the anaesthetist's item about additional procedures (around
  51, "which charges time units only") mentions "Make primary" and drops the time-only wording. The
  office list gains "set the primary from the rooms' sheet, and correct it at review".
- `03-demo-script.md`:
  - S3 Beat 1 (around 248): "the one-invoice, same-funder split" Booking becomes "the one-invoice
    multi-procedure Booking (additional procedure on its own time units; modifiers stay on the primary
    at 4 or fewer)". Re-verify the Holt figure and the bariatric pair; they should not move.
  - S3 "Serves" line (232): "split billing" becomes "the multi-procedure rule".
  - Add an optional "Worth pointing at" after S3 Beat 1: open the seeded three-procedure Souter Booking
    in Admin, show 3 / 2 / 2 from AS3, OB3, emergency and the locked age modifier, click "Make primary" on
    the second procedure and show it move to the top with its own base. Then open the Contract picker on
    a Southern Cross Booking for abdominoplasty, show the combination beside the singles, and type its AA
    code; and on the Merivale surgeon's Booking show the three face lift Contracts. Name the two demo
    actions.
  - S5 discovery points: add OQ-90 (does the RVG multi-procedure rule apply at all; the build applies it
    to calculated Procedures). Drop any OQ-15, OQ-53 or OQ-66 point: all three are answered.
- Control Panel scenario text: the S3 blurb and steps (item 15), and the `splitBillingBooking`,
  `bariatricType3Booking` and `multiProcedureBooking` scenario detail (item 9c).

Other "split-billing" mentions at `60e2d1e` to reword the same way: `03-demo-script.md` lines 16, 236
and 257 ("the split-billing Booking" becomes "the multi-procedure Booking") and 292;
`04-presenter-cheat-sheet.md` section 7 "Split-billing invoice count" (267 to 270) and
`02-workflows-and-handoffs.md` 363. Those last three are the RFP's invoice-count tension, a live
discovery point: keep the point, name it "multi-procedure invoice count", state that invoices group by
billable party so a multi-procedure Booking is one invoice and one BCTI, and quote "Split Billing" only
as the RFP heading. The RFP source citation at workflows 281 stays.

This is not a milestone phase, so no full consistency read is required. Grep the four guide files and
the master guide for "time-only", "time units only", "ordinal" and "split billing" / "split-billing"
afterwards; only quoted RFP headings may remain.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 23` first: earlier phases (19a, 19b, 20,
20a and 21 especially) may have changed these recipes since this plan was written. Never leave a
caption that says an additional procedure bills time units only, that base and modifiers "stay on the
first", or that a second procedure is priced by an ordinal or a Contract rule.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-03.2.1](../../../../requirements-board/requirements/stories/US-03.2.1.md) One primary Procedure | captured · web-primary-and-additional, mobile-primary-and-additional (caption "Procedure 2 is additional: it bills time units only, base and modifiers stay on the first") | Stays `captured`. Replace the stale caption. Re-shoot both on BK0009 (`/web/lists/L-34821-2026-07-21-PM/bookings/BK0009`, and the mobile route; an ACTIVE Southern Cross Souter Booking at plan time, confirm in the built seed) after adding a second procedure: highlight `procedure-primary-pill` on the first block and the additional note (`procedure-additional-note`) on the second. Keep the shot `name`s. Caption: "One Procedure is the primary, shown first; base units, and modifiers under the usual rule, anchor to it" |
| [US-03.2.2](../../../../requirements-board/requirements/stories/US-03.2.2.md) Anyone with edit rights can set the primary | absent ("The first procedure on a booking is its fixed anchor ... no control to make another procedure primary") | `captured`. Create the shots: `web-make-primary` and `mobile-make-primary`, starting on BK0009 after clicking "Add another procedure", with states `before` (the teal "Make primary" action, `make-primary`), `sheet` (the `MakePrimarySheet`, a bottom sheet on mobile and a dialog on web, naming what moves) and `moved` (the new primary on top with the Primary pill); `admin-make-primary` on the seeded three-procedure Booking (`SEED_MARKERS.multiProcedureBooking`, its id from the built seed). Caption: "Anyone with edit rights can set the primary Procedure, and it is shown first". Drop the absent reason |
| [US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md) Add additional Procedures | partial · web-add-procedure (before, copy, added), mobile-add-procedure (before, added) | Not covered here (20's), but its shots show the additional block that changes. 15b drops the `copy` state; 20 sets the status and reason. Re-shoot both: the Primary pill, the Modifiers caption row on the added Procedure, the added Procedure starting on the primary's Contract. Keep the status and reason as 20 left them |
| [US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md) Combination Contracts | absent ("Not built yet: catch-up Phase 23 builds this.") | `captured`. Admin: `admin-contract-combination` on the Contract sheet for "Southern Cross cosmetic combination" (`contract-combination`, the switch and its caption, with the three fixed-price lines in 19a's grid), plus a state on the Contracts catalogue filtered by the Merivale holder showing the three face lift Contracts ($3,565, $3,910, $4,255), the two combinations pilled. Picker shots on mobile, web and admin (`contract-picker-combination`) on BK0009 (Southern Cross, ACTIVE; confirm and name it in ATLAS.md): picking abdominoplasty lists No contract (RVG) first and the combination under the Southern Cross heading beside the singles, with the pill and "Covers {parts}"; one state with its AA code typed, filtered to it; and on the Merivale surgeon's Booking for face lift, the three Merivale Contracts side by side. Caption in the catalogue's words: "A combination is a fixed-fee Contract under each procedure it covers, offered beside the single-procedure Contracts". Drop the absent reason |
| [US-05.3.1](../../../../requirements-board/requirements/stories/US-05.3.1.md) Multi-procedure BTM rule | captured · web-additional-base, mobile-additional-base (caption "Additional procedure: base units not charged and not editable"), plus the merged US-05.3.2 `additional-time` shots | Stays `captured`. Re-shoot both `additional-base` shots on BK0022 (`/web/lists/L-34821-2026-07-20-AM/bookings/BK0022`, and the mobile route): highlight `units-row-b` of the additional block (0, "Base units are on the primary procedure"); re-check the `nth=1` selector still lands, since the additional block loses its Modifiers section and the blocks follow `inDisplayOrder`. Re-check the `additional-time` shots (US-05.3.2's recipe) the same way. Add `admin-modifier-split` on the seeded three-procedure Booking, highlight `booking-total-split` ("Primary · B + T + M 3 of 7", "Additional · T + M 2 of 7" twice, the provisional OQ-90 pill). Captions in the catalogue's words ("Modifier units above 4 split equally, the remainder to the primary"). The anaesthetist shots show units and shares only |
| [US-05.3.5](../../../../requirements-board/requirements/stories/US-05.3.5.md) Ledger tracks each Procedure's share | captured · admin-per-procedure | Stays `captured` (carried across). Re-shoot `admin-per-procedure` (`/admin/day/2026-07-20/bookings/BK0022`, highlight `booking-calculation`): the rows now read "Primary" and "Additional", primary first. Keep the caption "The Booking's fee broken down by Procedure, on the office view". The share is still recorded on invoice lines |

FT-05.3 has a story (US-05.3.1), so it needs no recipe of its own.

**Retired items whose screens this phase ends.**
- `US-04.2.5` (Multi-procedure rule per Contract, Retired; shot `admin-ordinal-rows`, caption "Second
  procedure priced by an ordinal row on a Type 3 contract") and `US-05.3.4` (Contract-specific
  second-procedure rules, Retired; shot `admin-second-procedure` on the bariatric Booking BK0028,
  caption "Second procedure priced by the contract's own ordinal rule"): unless 19a already did, set
  each to `status: absent` with the reason "Retired: Contracts do not define how additional procedures
  are priced (removed in Phases 19a and 23)". Never leave either caption live.
- `US-05.3.3` (Modifier split above four units, Retired: merged into US-05.3.1) is `absent` with a
  reason that describes the old prototype ("no four unit threshold or equal split"), which this phase
  makes untrue. Replace the reason with "Retired: merged into US-05.3.1 (the split is built in Phase
  23)". `US-05.3.2` (also Retired, merged into US-05.3.1) keeps its `additional-time` shots, which
  US-05.3.1's images carry; re-check them as below.

**Recipes this phase breaks.**
- `US-03.2.1` highlights `[data-shot=procedure-additional-note]` and carries the "time units only"
  caption; `US-03.2.3` clicks "Add another procedure" and highlights `procedure-header` and
  `procedure-contract` at `nth=1`. Re-point both to the new block anatomy and order.
- `US-05.3.2` (shot `additional-time`) shoots an additional Procedure's times and T row at `nth=1`;
  re-check its selectors after the block loses the Modifiers section.
- `US-03.3.4`, `US-03.3.8` and `US-05.1.4` (19b's) shoot the Modifiers section; on a multi-procedure
  Booking it now shows on the primary only. Run `--dry`.
- `US-05.2.1`, `US-05.2.4` and `US-05.2.5` highlight `[data-testid=booking-calculation]`; the breakdown
  rows change to "Primary" and "Additional" notes, so check the highlight still lands. `US-05.2.5`'s
  bariatric shot gains "Additional · fixed price"; keep 19a's caption.
- `US-03.1.1`, `US-03.1.2`, `US-03.1.9`, `US-03.4.1` and `US-04.3.3` use `procedure-header` or 20a's
  stack, which gain the Primary pill and the Make primary action. Any recipe using
  `office-billing-setup-n` keeps landing because the numbering follows `inDisplayOrder`.
- `US-04.1.1`, `US-04.2.4` and any recipe that opens the Contract editor: the combination switch is new
  above 19a's lines grid. Check with `--dry`.
- The `--dry` run is the check for anything else.

**ATLAS.md.** Update Seed data (the three-procedure Souter Booking and its List, its patient aged 70 to
79; the Southern Cross cosmetic combination and its AA code; the Merivale room, holder, surgeon and
three Contracts with their AA codes; the bariatric pair now two fixed-price lines), Personas and IDs
(`SEED_MARKERS.multiProcedureBooking`, the Merivale surgeon's Booking), Existing hooks
(`procedure-primary-pill`, `make-primary`, `booking-total-split`, `contract-combination`,
`contract-picker-combination`) and the Demo control panel section for "Load 3-procedure Booking (7
modifier units)" and "Hospital feed changes the primary".

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS entry,
run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**:

- Fan out about three independent Opus review subagents, one each for **quality**, **bugs/correctness**
  and **plan adherence**. Add a fourth on **billing maths**, because the fee engine changes shape under
  every invoice.
- This session then verifies every finding independently against the catalogue files, this doc and the
  code. Fix the confirmed ones, each bug with a test, then re-green and record the pass.
- Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **The split is exact.** Recompute every worked example in `multiProcedure.test.ts` and
  `bookingFee.test.ts` by hand:
  - the threshold is "more than 4", so exactly 4 does not split;
  - the remainder goes to the primary wherever it sits;
  - the shares sum to the total;
  - Procedures on different calculated Contracts split together;
  - a fixed-price additional Procedure takes no share and loses none, and keeps its price;
  - the locked age modifier counts once for the Booking, never once per Procedure;
  - the switch and the threshold live in one place, and the only provisional label is the Admin
    Booking total's OQ-90 pill.
- **One engine, one place.** Every fee in the app comes from `bookingFeeFor` over 19a's resolver and fee
  path: the UI assembler, the validator, the invoice build (with resolved Contract versions), the
  prepayment build, the billing-line guards and the seed. No caller prices a Procedure alone or reads a
  position; grep `ordinal`, `[0]` near procedures, `isAdditional` and `splitBillingUnits`. No second
  copy of the line, resolver or modifier logic.
- **Base units are 19a's.** Every B comes from 19a's resolver (line, procedure, group) or the value
  recorded on the primary, counts on the primary only, and never reaches an additional Procedure's
  charge.
- **Modifiers are 19b's.** The Booking total is 19b's `resolveModifiers` on the primary; claims and
  explanations move with Make primary through `reconcileClaims`; no procedure-default pre-fill or ASA
  seed creeps back. An additional Procedure on a Neurosurgery or Spine code still shows its own locked
  P1 at 0 (US-05.1.4 holds per Procedure), and it never adds to the total.
- **Exactly one primary, always, shown first.** Every creation path (manual, post-op addendum,
  integration, seed, the trigger) makes one, and no Copy path remains (15b). Remove never promotes.
  Set-primary is a single commit with both audit entries. Every list of Procedures (capture, 20a's
  stack, total, Review, invoice lines) uses `inDisplayOrder`. A structural error fails loudly
  (validator failure, invoice exception) instead of guessing.
- **Re-anchoring is right.** After Make primary:
  - the claims and the manual M adjustment are on the new primary and gone from the old one;
  - the locked rows re-derive for the new primary, and a now-included claim is dropped into `before`;
  - the old primary's base inputs are cleared and kept in `before`;
  - the new primary's base comes from its own Contract through 19a's resolver;
  - 19's ranged-figure rule and out-of-range warning follow the primary, not the old one.
- **Structural, not cosmetic.** The store refuses base values, modifier claims and a manual M on an
  additional Procedure, and `isPrimary` patches, whatever the UI shows. Clearing (a procedure or
  Contract change, `reconcileClaims`) is still allowed.
- **Rights.** The integration actor works on ACTIVE only; the anaesthetist on their own ACTIVE List and
  not on a completed Booking; the office on ACTIVE and SUBMITTED; AUTHORISED on nobody.
- **No figure moved that should not.** The parity fixture differs only for the new Booking. Holt is
  unchanged, bariatric $2,800 + $950 from its lines, and 22's split pair is unchanged. Invoice grouping
  and `bctisFor`'s counts are unchanged. The new seed draws nothing from the RNG or the patient pool,
  and the combination, the Merivale room, holder and Contracts and any new procedures are appended.
  `PERSIST_VERSION` is bumped once.
- **The anaesthetist sees no calculated total.** The additional note, the M share captions, the
  "already covers" note and the Make primary sheet carry units only.
- **Combinations as answered.** A fixed-price line under each parent; offered only through 20's
  candidate rule (a line for the procedure, holder fit, version in force), beside the singles under its
  holder heading, with no second matcher and no separate group; found by its AA code through 20's
  search; `isCombination` with no pricing effect, refused without fixed prices on every line; the
  Booking holds one Procedure on the Contract and no components; the "already covers" note never
  blocks; both acceptance criteria tested.
- **No gold-plating.** No per-Contract rule, no operation container, no invoice split or credit, no
  precedence or adjustment, no lock, no ledger share, no loaders, no new picker navigation. Plus the
  usual: teal-only actions, neutral pills, no dashes in copy, sheets not modals on mobile, `pwaPurity`
  green, and the trigger bodies in `src/store`.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the D26 default built for OQ-90 (the rule applies, calculated Procedures only, one
  switch) and its participant readings (a fixed-price additional Procedure left out of the split,
  against the catalogue's literal "every Procedure in the Booking"), the picked readings below, anything logged rather than fixed,
  and the screens worth a look, each with its route and persona.
- A status row for catch-up Phase 23, and a phase entry covering:
  - the drift-check result and the OQ-90 status (and whether AR-29 moved to a v5);
  - what was built;
  - the parity result (the only diff being the new Booking), the BCTI count check, the FT-03.2 and
    US-05.3.5 carry-across checks, and the List chosen for the seeded Booking;
  - the procedures, room, holder and Contracts appended for the combinations, and the Merivale
    surgeon's Booking;
  - the `PERSIST_VERSION` from and to;
  - the tests added;
  - the review pass: findings confirmed and fixed, and anything not treated as a defect, with the reason.
- **Decisions log:**
  1. The catalogue multi-procedure rule replaces the RFP split-billing rule ("additional Procedure = time
     units only"), superseding the Phase 01, 04 and 08 readings. It applies to calculated Procedures
     only (AR-29's CALCULATED note); provisional under D26 (OQ-90), behind one switch.
  2. `isPrimary` replaces `isAdditional`, with an exactly-one invariant; the primary is listed first
     everywhere (US-03.2.2 note).
  3. No per-Contract multi-procedure rule (US-04.2.5 and US-05.3.4 Retired 2026-10-05): the 2026-10-03
     plan's rule options were never built. 19a's removal of the ordinal key and the 2026-07-22 "Type 3
     second-procedure fallback" stand; close handoff P2 here if 19a did not.
  4. The 2026-07-27 `removeProcedure` ruling is kept but re-based: the primary is refused by flag, not
     position, and removal never promotes. "Make primary" is the explicit route.
  5. OQ-15 answered 2026-10-07: the equal split with the remainder to the primary, whichever Contracts.
  6. Picked readings:
     - modifiers are recorded once per Booking, on the primary (19b's claims and manual adjustment), and
       move with Make primary; the locked modifiers are derived for the primary, so the age modifier
       counts once; a claim the new primary's base includes is dropped;
     - the participants are the primary plus calculated additional Procedures; a fixed-price additional
       Procedure takes no share and keeps its price; a fixed-price primary still anchors the base and
       modifiers, its share inside its price;
     - an office override or an anaesthetist's typed price (24) never changes who took part;
     - the integration actor may set the primary on an ACTIVE List only;
     - the anaesthetist must Amend a completed Booking first, and the office need not;
     - an added Procedure starts on the primary's Contract when it fits.
  7. Combination Contracts (OQ-53, Greg accepted 2026-10-07): a fixed-price Contract with a line under
     each parent procedure, marked `isCombination` with no pricing effect, offered through 20's
     candidate rule beside the single-procedure Contracts, recorded on the Booking as the Contract
     alone; the 2026-10-03 plan's separate "Combinations" group and its "two or more parents" rule are
     superseded (a Merivale add-on combination has one parent); the "operation" container was not
     adopted.
- **Handoff list:**
  - 22's split-shares re-key handoff is closed: shares stay keyed by Procedure.
  - 24 builds the price precedence around 19a's single rate and discount read in `feeFor`, after this
    phase's allocation: an office override or typed price replaces a Procedure's price and leaves the
    shares as they are; a fixed-price Procedure stays out of the split.
  - 25 snapshots `isPrimary`, the allocation (role, calculated, share, split across), the switch's
    state, the base layer and the combination Contract version at AUTHORISED.
  - 27: a prepaid Procedure on the anaesthetist's own fixed-price Contract is fixed-price, so it keeps
    the prepaid amount and takes no modifier share.
  - 31: the office's set-primary works on a Draft List's Bookings (`editRefusal` for DRAFT).
  - 33: re-point `feed-changes-primary` so the change lands as a matching row (not yet in 33's plan);
    imports keep the first row's procedure as primary, and a primary change from an import is not
    planned anywhere.
  - 36 records each Procedure's share on the ledger (US-05.3.5).
  - 39 credits the seeded combination's invoice and rebills it as additional invoices (US-08.6.4,
    US-08.6.5, OQ-72; OQ-77 part 1: the rebill equals the credit), using `isCombination` and
    `combinationParts`; a single-parent combination (Merivale) returns one part, so the split's prefill
    must allow adding rows beyond the parts.
  - 39b models the ACC pre-op assessment as an event, never a Procedure, so never primary.
  - 42: `isCombination` is a load column for Contracts.
  - 43's generator builds multi-procedure Bookings through `bookingFeeFor` and gives every Booking one
    primary.
  - 43a keeps the multi-procedure captions simple on the anaesthetist screens.
  - The OQ-90 outcome: the switch, the capture's role selector and the provisional pill.
- **Catalogue screenshots.** The step's result: recipes created (US-03.2.2, US-04.2.11) and changed
  (US-03.2.1, US-05.3.1, US-05.3.5, the US-03.2.3 and US-05.3.2 shots, the retired US-04.2.5 and
  US-05.3.4 set absent, plus every recipe the step broke), the `capture/REPORT.md` counts (captured,
  partial, absent, failed) before and after, and any partial reason handed to a later phase.
