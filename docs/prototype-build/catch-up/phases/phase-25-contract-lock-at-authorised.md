# Phase 25 · Contract versions and the AUTHORISED lock

**Requirements covered** (status and grade at catalogue `60e2d1e`):
[US-04.1.3](../../../../requirements-board/requirements/stories/US-04.1.3.md) Contract audit and versioning (**Confirmed** since 2026-10-08; Partial: Phase 18 builds the dated version chain, and this phase lists each version with the invoices raised under it, so an invoice raised under an older version is traced to it and reproduced),
[US-04.3.5](../../../../requirements-board/requirements/stories/US-04.3.5.md) Contract locked at AUTHORISED (Confirmed; Partial: no snapshot. Its technical discussion now names the snapshot's contents from the draft design, and Greg read it on 7 October: "Yep. Good."),
[US-07.3.1](../../../../requirements-board/requirements/stories/US-07.3.1.md) Authorise the List (Proposed; Partial: the lock and snapshot half),
[US-08.1.1](../../../../requirements-board/requirements/stories/US-08.1.1.md) Process an AUTHORISED List using each Procedure's locked Contract (Proposed; **Contradicts**: the engine re-resolves the Contract and the payer and prices from live masters; merges the retired US-08.1.2),
[US-08.4.4](../../../../requirements-board/requirements/stories/US-08.4.4.md) Invoice reproducibility (Proposed; Partial: keep the invoice's "recipe", clarified 2026-10-02),
[US-15.0.3](../../../../requirements-board/requirements/stories/US-15.0.3.md) Enter once (Proposed; Partial: the billing exception half);
[DM-08](../analysis/domain-model-delta.md#dm-08) (a pricing snapshot per Procedure, written at authorise and read by the run and by regeneration);
[RV-01](../analysis/reverse-check.md#rv-01-billing-engine-re-resolves-contract-and-payer-at-billing-time-no-contract-lock-at-authorised) (the engine re-resolves the Contract and the payer at billing time).

**Touches, without closing** (each is built elsewhere; this phase records its output in the snapshot
and changes none of its rules):
[DM-42](../analysis/domain-model-delta.md#dm-42) (DM-06 merged into it on 2026-10-08: whoever submits
a List did its procedures, so the List's anaesthetist at authorise is the **payee** stamped here; the
moves are Phases 32 and 32a, and a moved prepaid Booking's payee repoint is Phase 41, D38);
[DM-43](../analysis/domain-model-delta.md#dm-43) and
[DM-50](../analysis/domain-model-delta.md#dm-50) (the resolver's values and the layer each came from,
Phases 19 and 19a, and the one price precedence with its price source, Phase 24: the snapshot holds
their output);
[US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) (Confirmed; Matches today
only through Type 2's `agreedUnitRate`, carried across by 18, 19a and 24 as a Contract line's fixed
rate; this phase locks the rate used, with a parity test);
[US-05.3.5](../../../../requirements-board/requirements/stories/US-05.3.5.md) (Confirmed, Matches: the
units and dollars per Procedure; the snapshot carries each Procedure's units and price, which Phase
36's ledger reads);
[US-07.3.2](../../../../requirements-board/requirements/stories/US-07.3.2.md) (Matches: an AUTHORISED
List is immutable; this phase's office fix on a held-back Booking is the one guarded exception, and
only for a Booking with no invoice);
[US-08.5.1](../../../../requirements-board/requirements/stories/US-08.5.1.md),
[US-08.5.2](../../../../requirements-board/requirements/stories/US-08.5.2.md) (Matches;
[OQ-05](../../../../requirements-board/requirements/questions/OQ-05.md) answered: failure is per
Booking and a List never fails as a whole) and
[US-13.3.2](../../../../requirements-board/requirements/stories/US-13.3.2.md) (Confirmed, Matches: the
office's manual fix), which the re-based failure beat shows;
[US-12.1.1](../../../../requirements-board/requirements/stories/US-12.1.1.md) (Partial: only its
technical note, the unit value copied at AUTHORISED).

**Left this phase on 2026-10-08:**
[US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md) (Retired: no payment
setting on the Contract; the split is a Booking action, Phase 22's Split button, D18 superseded) and
[US-04.4.2](../../../../requirements-board/requirements/stories/US-04.4.2.md) (Retired with FT-04.4: no
default RVG Contracts; base units sit on the RVG group, the procedure or a Contract line, D12 and D3
superseded). DM-06 merged into DM-42. The "Contract defined unit rate" and the hourly rate x time line
are gone (Phase 24; DM-46): the rate a calculated price uses is the Contract line's fixed rate or the
anaesthetist's own unit value. **The append-only `ContractVersion` copies go too**: Phase 18 makes
each version its own dated Contract record linked to the one it replaces, with a started version's
terms frozen, so the snapshot names the version by its id ("each version is its own row, so the id is
enough", AR-29 pricing snapshot) and copies the resolved values it priced from. There is no
`masters.contractVersions` store and no "a version on every edit" helper.

**Answered and built as answered** (no provisional labels):
[OQ-48](../../../../requirements-board/requirements/questions/OQ-48.md) (D45: the date of the
procedure decides the Contract version in force; Phase 18 built the lookup),
[OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) (No contract (RVG) is the one
default; no hospital, insurer or procedure default Contract, so nothing to fall back to),
[OQ-05](../../../../requirements-board/requirements/questions/OQ-05.md) (failure per Booking),
[OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md) (D17, superseded 2026-10-08:
the Contract bills its holder's billable party when the holder pays AA, otherwise the payer on the
Booking; the snapshot copies whichever was billed) and
[OQ-91](../../../../requirements-board/requirements/questions/OQ-91.md) (D42: the office keeps the
anaesthetists' first-party Contracts).
**Open, nearby, not blocking** (their defaults are built elsewhere; the snapshot records whatever was
applied): [OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md) (D40: the time band
and an anaesthetist discount on top of a line's fixed discount are still open; the snapshot copies
the time tiers and the discount as applied),
[OQ-90](../../../../requirements-board/requirements/questions/OQ-90.md) (D26: the RVG multi-procedure
rule kept; the snapshot copies the rule as applied),
[OQ-80](../../../../requirements-board/requirements/questions/OQ-80.md) (D38: a prepayment's pair at
generation; prepayments are not locked here) and
[OQ-60](../../../../requirements-board/requirements/questions/OQ-60.md) (what the AA fee counts; 16's
count is unchanged).

**Depends on:** Phases 19a, 22, 23 and 24, and through them the whole Contracts track:
- 18: contract holders (third or first party, holder billed, billable party), Contracts as dated
  versions (`previousVersionId`, `versionChain`, `versionInForce`, `termsLocked` on a started version,
  "New version"), AA codes, the Contract detail's Versions list (`data-shot="contract-versions"`), and
  the resolver's interim ended-Contract fallback that this phase deletes;
- 19: RVG groups and procedures (invoice wording, general procedure per group), the base source and
  layer (`baseSource`, `baseLayer`, `baseGuide`), the starting and recorded values and the
  out-of-range office warning;
- 19a: Contract lines (fixed price, fixed rate, fixed discount, base and modifier units, holder code),
  the resolver's one typed output with each value's layer and the line id, the RVG time tiers as data,
  and the first-party Contracts;
- 19b: modifiers as itemised records (`modifierItems`: code, units, explanation, lock reason);
- 20: exactly one Contract per Procedure, mandatory at setup, the route gone, and the interim
  office-set prepayment flag; 20a: the source wording and the three-part stack, with "who is invoiced"
  and "pricing basis" each one selector;
- 21: the payer on the Booking, who is billed (the holder or the payer), holder references and
  completion, the insurance-indication and child-payer warnings;
- 22: Contract-driven layout, delivery and GST (prices held ex GST), invoices in the anaesthetist's
  name with AA as agent (the supplier snapshot), and the Split button with typed $ or % shares;
- 23: exactly one primary Procedure, the RVG multi-procedure rule with the 3/2/2 modifier split, and
  combination Contracts;
- 24: the one price precedence with a recorded price source (office override, the anaesthetist's
  typed price on No contract (RVG) and first-party Contracts only, the line's fixed price, else BTM x
  the fixed rate or the anaesthetist's unit value less a locked fixed discount) and the engine
  rejections.
Phases 14 (trigger registry), 15 (Booking), 15a (warnings, never blocks), 15b (ACTIVE) and 16 (AA-FEE
invoices, `bctiRecords` and `bctisFor`) are in place.
**Estimated:** 1 session on the outline, but realistically 2: sixteen work items touching the engine,
the seed, three apps and the demo guide. Plan the split after work item 9 (snapshot, lock, engine,
seed and tests green; the UI still reads live figures) and do items 10 to 16, the demo guide and the
review pass in a second session.

## Goal

When the office authorises a List, `authoriseList` writes a **pricing snapshot** for every Procedure on
every non-cancelled Booking, in the same commit that flips the List to AUTHORISED (US-04.3.5, DM-08,
[AR-29 · pricing snapshot](../../../../requirements-board/requirements/artifacts/AR-29.md#pricing-snapshot),
held where
[AR-30 · booking procedure](../../../../requirements-board/requirements/artifacts/AR-30.md#booking-procedure)
sits). Following the draft design, each Procedure's snapshot holds:

- the **procedure** (its name, invoice wording and RVG code as printed, 19) and the source wording for
  display (20a);
- the **Contract version** (its id, which is the version, since each version is its own record in
  Phase 18; [AR-30 · contract](../../../../requirements-board/requirements/artifacts/AR-30.md#contract)),
  with its AA code, name, holder and the Contract line used (19a);
- the **resolved values and the layer each came from** (19a's resolver output: base and modifier units
  from the line, the procedure or the group; the fixed price, rate and discount from the line);
- the **recorded BTM** (base units with the starting value, the value chosen in a range or typed, and
  the out-of-range flag; time units with the RVG time tiers applied; the itemised modifiers with their
  explanations and lock reasons, 19b), and the Booking-level units (the primary flag, the RVG
  multi-procedure rule and this Procedure's share of the 3/2/2 split, a combination line's parent, 23);
- the **rate and discount used** and the **price with its source** (24: office override, anaesthetist
  price, Contract fixed price or calculated), with the office override's and the anaesthetist's price
  inputs and reasons;
- the **split shares** (22's typed $ or % per party and the amount each pays);
- the **payer or billable party** (21: the holder's billable party when the holder is billed, otherwise
  the payer on the Booking), with the details the invoice prints;
- and, once per Booking, the **payee anaesthetist** (the List's anaesthetist at authorise, who did its
  procedures, DM-42) with the supplier details 22's invoice prints, the patient details the invoice
  prints, the presentation (layout, delivery, GST treatment), the GST rate and any pre-payment
  already invoiced.

That is the invoice's **recipe** (US-08.4.4). The billing run then prices **only** from the snapshot
(US-08.1.1, RV-01): no effective-date fallback, no route or payer resolution, and no "Resolve & retry"
that edits a master. A Contract with no version valid on the procedure date is never swapped for No
contract (RVG) or anything else: the engine **rejects that Booking** (the catalogue's "the engine
rejects the Booking ... when the Contract is not valid on the procedure date",
[AR-29 · validation before pricing](../../../../requirements-board/requirements/artifacts/AR-29.md#price-validation)),
and so do 24's rejections. Failure stays per Booking (OQ-05): a rejected or failed Booking issues none
of its invoices, the rest of the List bills, and the List never fails. Review shows each rejection
before authorise as an advisory flag, so the office normally fixes it first; nothing new blocks
authorise (15a: warnings never block).

Locked Bookings display from the snapshot: the stack's Contract part, the fee, units, rate and price
source stop drifting when a master changes, and carry a "Contract vN locked at authorise" badge. Later
changes to RVG groups, procedures, Contracts, holders, payers or the anaesthetist's unit value never
alter an issued invoice
([AR-28 · keeping prices up to date](../../../../requirements-board/requirements/artifacts/AR-28.md#keeping-prices-up-to-date):
work already priced keeps its price). Phase 18's Versions list on the Contract detail gains the
invoices raised under each version (US-04.1.3,
[AR-29 · contract versions](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-versions)).

**The invoice keeps its recipe** (US-08.4.4's 2026-10-02 note): reproducing an invoice means producing
the invoice as raised again from what it was generated from, even after the rate, a name or the
patient's address has changed. It is not a way to go back to another point in time and build a new
invoice from the data as it then stood. So the Admin invoice document prints the addressee, the
patient and the supplier from the snapshot, not from live masters, and a screen-contextual
**Regenerate from locked data** button rebuilds the invoice from the stored inputs and proves it
identical.

The S4 Beat 3 billing failure no longer works as built (it ends a Contract and "Resolve & retry" restores
it from the monitor), so the re-homed **Trigger billing failure** is re-based on a cause that still
fails under a lock: a **holder reference** (here COS ACC's claim reference, 21) that the locked
Contract version needs and the Booking lacks. The office supplies it in the Billing monitor and
retries, once. A Contract not valid on the procedure date is the second cause, shown by hand (manual
test "No fallback"); a handoff fault is the fallback if 21 made a missing reference block authorise.

**The pricing model in one place** (ROADMAP "Pricing model in one place"). The snapshot type, its
builder, the lock-only pricing and the comparison live in `aa-prototype/src/domain/billing` (a new
`lock.ts`, re-exported from the billing index, plus the seed), behind one view type the UI reads
(`lockViewFor`). AR-29 and AR-30 are a **draft** (v4) that a v5 may change before or during the
build: a change to what the snapshot holds is then an edit to `lock.ts`, its tests and the seed, never
to a screen. US-04.3.5, US-07.3.1 and US-15.0.3 still say the exact fields are "to be determined in
discovery"; build AR-29's list plus what the printed invoice and the payee need, and log it for the
owner.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `60e2d1e` (rename-aware;
   never a plain `git diff` of the catalogue folder), and read it for this phase's items:

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-04.1.3,US-04.3.5,US-07.3.1,US-08.1.1,US-08.4.4,US-15.0.3,US-07.3.2,US-05.3.5,US-05.2.6,US-12.1.1,US-08.5.1,US-08.5.2,US-13.3.2,US-04.2.2,US-04.2.8,US-04.2.10,US-01.4.6,US-06.5.4,OQ-05,OQ-48,OQ-78,OQ-80,OQ-89,OQ-90
   ```

   - Check `US-04.1.3`, `US-04.3.5`, `US-07.3.1`, `US-08.1.1`, `US-08.4.4` and `US-15.0.3`, and the
     items this phase leans on: `US-07.3.2`, `US-05.3.5`, `US-05.2.6` (the fixed rate),
     `US-12.1.1` (its technical note), `US-08.5.1`, `US-08.5.2`, `US-13.3.2`, `US-04.2.2` (lines and
     holder references), `US-04.2.8` (presentation), `US-04.2.10` (dated versions), `US-01.4.6` and
     `US-06.5.4` (who is paid), the questions above, and in `domain-model.md` the Booking ("Billing
     fails per Booking"), the "Procedure billing context" table (`contractId`: "locked at
     AUTHORISED"; "pricing snapshot: set at authorisation"), and the pricing section (the resolver,
     `price(procedure)`, the engine's rejections and the pricing snapshot bullet).
   - At `60e2d1e`, relative to the plan's earlier baseline `3d3a18c`:
     - US-04.1.3 became **Confirmed** (text unchanged).
     - US-04.3.5's technical discussion gained the draft design's snapshot contents (AR-29 p8: the
       procedure, the Contract version, the resolved values and their layers, the recorded BTM, the
       rate and discount used, the price and its source, the payer or billable party; "later changes
       to the RVG, procedures or Contracts never alter issued billing"), and a note that Greg agreed
       on 7 October. It still says the draft may change, and the fields are still "to be determined
       in discovery".
     - US-07.3.1, US-08.1.1 and US-08.4.4 gained artifact links only; US-15.0.3 is unchanged.
     - `domain-model.md`: Contracts are dated versions linked to the one they replace, the version in
       force on the procedure date prices it (OQ-48 answered); the engine rejects a Booking when a
       typed price sits on a Contract that is not adjustable, when BTM is missing and no fixed price
       resolves, or when the Contract is not valid on the procedure date; the pricing snapshot bullet
       as above.
     - US-04.2.12 and US-04.4.2 are Retired (above). OQ-48 and OQ-78 are answered. OQ-89 narrowed
       to the time band.
   - If an item changed after `60e2d1e`, re-read it and adjust the work items before building. If
     discovery names the fields to freeze, or a v5 of the design changes the snapshot, lock exactly
     those plus whatever the printed invoice and the payee need, inside `lock.ts`, and record the list
     in the Decisions log. If an item is now Retired or Future, drop it and say so in the PROGRESS entry.
2. **OQ-48 is answered (D45).** The version in force on the **procedure date** (the List date) prices
   the Procedure; Phase 18's `versionInForce` is the one lookup and holds the one label. The snapshot
   records it as `pricingDateISO` and names the version found. Add no second rule.
3. **OQ-05 is answered** (failure per Booking; a List never fails as a whole; a Booking with any failed
   Procedure or billable party is held back whole, for a manual fix by AA admin staff). The prototype
   already isolates per Booking (the Phase 09 reading): keep the isolation, test it under the lock
   (work item 6), including a split Booking, and record in the Decisions log that the Phase 09 reading
   is now confirmed.
4. **Confirm what Phases 16 and 18 to 24 actually delivered** (their PROGRESS entries and handoff
   lists). The snapshot must capture every price, invoice and payee input they added, under the names
   they gave. Write down, before touching code:
   - 18's version model as built: the version record, `previousVersionId`, `versionInForce`,
     `termsLocked` and which fields stay editable on a started version (planned: name, review date,
     valid to); 19a's line guards on a started version. If any pricing term on a started version can
     still be edited in place, the snapshot already copies it: add that edit to the immunity test
     (work item 4) and log it; do **not** build an append-only version store.
   - what 18 to 24 left in `resolveContractForProcedure` and its callers: 18's interim fallback (an
     ended hospital- or insurer-held Contract with no successor falls to No contract (RVG) with an
     interim `billedAs`), `contractIneffective`, and anything 20 and 21 kept "for Phase 25". All of it
     goes here (work item 6).
   - 19's and 19a's resolver output type (base and modifier units with their layer, the range, the
     fixed price, rate and discount with their layer, the line id) and the base source vocabulary
     (`baseSource`, `baseLayer`, `baseGuide`, the starting and recorded values, the out-of-range flag;
     19's handoff: "25 snapshots `baseSource`, `baseLayer`, the starting value and the recorded
     value"); where 19a holds the RVG time tiers (planned `masters.rvgTimeRule`, read through
     `timeUnitsFromMinutes`).
   - 19b's `modifierItems` and `resolveModifiers` (its handoff: "25 snapshots `modifierItems` (codes,
     units, explanations, lock reasons) and the starting value's layer").
   - 20a's "who is invoiced" and "pricing basis" selectors as 21 and 24 re-pointed them, and the
     stack component's props.
   - 21's payer on the Booking (its field names), who-is-billed function, holder references (the
     declared list on the Contract version, the values on the Booking or Procedure; the claim
     reference on Losa Tuilagi's COS ACC Booking), the completion rule, and `authoriseBlockersFor` if
     21 kept one. **If a missing holder reference blocks authorise**, the failure trigger uses the
     handoff fallback (see "Demo triggers"). 21's handoff may say "Phase 25 adds a Contract not in
     force" as an authorise blocker (the pre-2026-10-08 plan did); build it as the engine's per-Booking
     rejection instead (work item 4) and record the change in the Decisions log.
   - 22's presentation fields on the Contract version, the payer's delivery address, the supplier
     snapshot (`Invoice.supplier`, `supplierFor`), `GST_RATE`, and the Split action's stored shares
     (planned per Procedure on the Booking, `splitShares`).
   - 23's Booking-level pricing entry point (`bookingFeeFor`) and its context type, the primary flag,
     the multi-procedure rule as applied and the combination lines.
   - 24's pricing function, its `priceSource` vocabulary, the anaesthetist's typed price and discount,
     the office override (`type`, `value`, `reason`), the fixed rate and fixed discount as read, and
     its rejection codes and messages.
   - **every place that works out the payee live**: `handoffCase` in `store/xeroHandoff.ts` (~l.153,
     the ACCPAY contact from `list.anaesthetistId`), the two `anaesthetistIdForCase` helpers
     (`store/paymentActions.ts` ~l.67 for receipts, `store/selectors.ts` ~l.611 for the web accounts),
     16's `bctiRecords` (which anaesthetist a BCTI counts against) and 22's `Invoice.supplier`.
   - **every place that prints an invoice from live masters**: `InvoiceDocument.tsx` (~l.50 to 54 at
     `60e2d1e`: the anaesthetist from `list.anaesthetistId`, the patient from `masters.patients`, the
     addressee through `counterpartyName`, the claim references from live Procedures) and whatever 22
     added for the supplier and agent blocks.
   - how pre-payment invoices are raised at this point (20's interim office-set flag carrying today's
     `prepaymentDetail`; Phase 27 rebuilds prepayment after this phase).
5. Record the current `PERSIST_VERSION` (16 at `60e2d1e`; 15a session 2 and 15b to 24 will have
   bumped it).
6. Record the result, including "no drift", in the PROGRESS entry.

## Reference

**Design (convention 17):**
- `docs/design/Admin Review.dc.html`: the authorised state is the model for the lock treatment. After
  authorise the table dims to 0.72, each row gets a small mist-stroke lock glyph, and the header pill
  reads "Authorised · locked" in the success tint. The version badge follows that anatomy: the lock
  glyph plus a mono `v2`, neutral tint, beside the Contract name in the CONTRACT column. It is not a
  seventh status colour.
- `docs/design/Design Language.dc.html` for tokens: neutral pill tint and on-tint, Spline Sans Mono
  tabular-nums for version numbers and money, 4pt spacing, radius `pill` and `card`, teal as the only
  action colour, crimson for identity only.
- No mockup covers Master data, the invoice document or the Billing monitor. Extend the admin's own
  table, rail-card and pill patterns, and 18's Contract detail panel. Admin is desktop: panels and
  overlays, not bottom sheets.
- `docs/design/Mobile App.dc.html` for the badge on the shared Booking billing block and the stack.

**Catalogue:** the six covered files above; `domain-model.md` as listed in the drift check;
[US-08.1.2](../../../../requirements-board/requirements/stories/US-08.1.2.md) (Retired, but its text is
the confirmed departure quoted in US-08.1.1's acceptance criterion);
[US-08.5.1](../../../../requirements-board/requirements/stories/US-08.5.1.md),
[US-08.5.2](../../../../requirements-board/requirements/stories/US-08.5.2.md) and
[US-13.3.2](../../../../requirements-board/requirements/stories/US-13.3.2.md) (failure reporting,
per-Booking isolation and the manual fix);
[US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) (lines and holder
references), [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) (the fixed
rate the snapshot copies), [US-05.3.5](../../../../requirements-board/requirements/stories/US-05.3.5.md)
(units and dollars per Procedure), [US-01.4.6](../../../../requirements-board/requirements/stories/US-01.4.6.md)
and [US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md) (who is paid; the
prepaid payee is Phase 41's), [US-12.1.1](../../../../requirements-board/requirements/stories/US-12.1.1.md)
(the unit value copied at AUTHORISED);
`requirements-board/requirements/notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md` item #36
(the recipe); `requirements-board/requirements/notes/2026-10-07-pricing-model-documents.md` #12 and
#33 (the snapshot) and `2026-10-07-aa-meeting-with-greg.md` #56 (Greg's agreement).

**Pricing model artifacts** (draft v4; the reference shape, not a naming mandate):
- [AR-28 · keeping prices up to date](../../../../requirements-board/requirements/artifacts/AR-28.md#keeping-prices-up-to-date):
  the plain-language rule this phase makes true (dated versions; old work keeps its price). AR-28 is
  true as written.
- [AR-29 · pricing snapshot](../../../../requirements-board/requirements/artifacts/AR-29.md#pricing-snapshot)
  (what the snapshot holds),
  [AR-29 · contract versions](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-versions)
  (a price review creates a new dated Contract linked to the one it replaces, its lines copied then
  changed, the old version's valid-to set to the day before; listing each version's invoices is
  US-04.1.3's, not the design's),
  [AR-29 · contract fields](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-fields)
  (validity and the previous version on the Contract, the id the snapshot names),
  [AR-29 · booking procedure pricing fields](../../../../requirements-board/requirements/artifacts/AR-29.md#booking-procedure-fields)
  (the pricing fields the snapshot sits beside),
  [AR-29 · validation before pricing](../../../../requirements-board/requirements/artifacts/AR-29.md#price-validation)
  (the rejections the lock builder runs) and
  [AR-29 · price precedence](../../../../requirements-board/requirements/artifacts/AR-29.md#price-precedence)
  (the price source recorded).
- [AR-30 · booking procedure](../../../../requirements-board/requirements/artifacts/AR-30.md#booking-procedure)
  (where the snapshot sits) and
  [AR-30 · contract](../../../../requirements-board/requirements/artifacts/AR-30.md#contract) (the
  dated version it names).

**Analysis:**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): the Contract and pricing themes, the DM-08, DM-42, DM-43,
  DM-50 and RV-01 rows, "Demo impact" (S4 Beat 3, S5 Beat 4), and the EP-04, EP-07, EP-08 and EP-15
  tables.
- [epics/EP-04.md](../epics/EP-04.md), [EP-07.md](../epics/EP-07.md), [EP-08.md](../epics/EP-08.md),
  [EP-15.md](../epics/EP-15.md).
- `gaps.json`: the entries for the six covered IDs (US-04.3.5 now names the missing "layer each value
  came from"; US-08.4.4 re-graded on the recipe: the invoice document reads the addressee, the patient
  and the anaesthetist live), `US-05.2.6`, `US-05.3.5`, `US-08.5.2`, `DM-08`, `DM-42`, `DM-43`,
  `DM-50` and `RV-01`.
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-08 (including its "Also":
  the per-Procedure units and dollars), DM-42, DM-43 and DM-50;
  [analysis/reverse-check.md](../analysis/reverse-check.md) RV-01.
- [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md) §2, §4, §7, §8;
  [prototype-map-domain.md](../analysis/prototype-map-domain.md) §5;
  [prototype-map-admin.md](../analysis/prototype-map-admin.md) §5 to §7 and §9;
  [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) for the harness bar
  and the PWA office stand-in.

**Code entry points** (named as at `60e2d1e`, after Phases 14, 15 and 15a session 1; use the names
Phases 15a to 24 gave them):
- `aa-prototype/src/domain/types.ts`: `Contract` (18's version fields), the holder, the Contract line
  (19a), `Procedure` (`governingContractId` and the 19 to 24 fields), `Booking` (21's payer, 22's
  split shares), `Patient` (`name`, `nhi`, `address`), `Invoice`, `InvoiceLine`, `BillingCase` (no
  payee field today), `BillingReceipt.anaesthetistId`, `XeroAccPay`, the `masters` and `billing` slice
  shapes.
- `aa-prototype/src/domain/billing/invoiceBuild.ts`: `resolveContractForProcedure` (~l.114; the
  fallback and `contractIneffective` branch at ~l.144, as 18 to 21 left them),
  `counterpartyForProcedure`, `buildInvoicesForBooking` (~l.264), `InvoiceBuildContext`, the
  line-description snapshot.
- `aa-prototype/src/domain/billing/contracts.ts` (18: `versionChain`, `versionInForce`, `termsLocked`),
  `fee.ts` (`feeFor`, `FeeContext`, `FeeResult`), 19's and 19a's resolver, 19a's time tiers and
  `timeUnits.ts`, 19b's modifier module, 23's `bookingFee.ts` (`bookingFeeFor`), 24's precedence and
  rejections, 22's split and `invoicePresentation.ts` (`supplierFor`, `GST_RATE`), 21's who-is-billed
  and holder-reference helpers.
- `aa-prototype/src/domain/billing/validateBookingForBilling.ts` (`feeContextFor` ~l.77).
- `aa-prototype/src/store/lifecycle.ts`: `authoriseList` (~l.262), 21's `authoriseBlockersFor` if kept.
- `aa-prototype/src/store/billingRun.ts`: `runBillingForList` (~l.68), `retryBillingCase` (~l.285),
  `wireBillingRun`; `aa-prototype/src/store/xeroHandoff.ts`: `handoffCase` (~l.153, the payee lookup
  inside it); `aa-prototype/src/store/paymentActions.ts`: `anaesthetistIdForCase` (~l.67,
  `receivePayment`); 16's `bctiRecords` and `bctisFor`.
- `aa-prototype/src/store/contractActions.ts` (18's `createContractVersion`, `editContract` and 19a's
  line actions), `mastersActions.ts` (`editAnaesthetist`'s doc comment about re-pricing), 19's RVG
  group and procedure actions.
- `aa-prototype/src/store/selectors.ts`: `billingContextForBooking` (~l.836), `prePaidByProcedure`
  (~l.345), `billingMonitor` (~l.428), `anaesthetistIdForCase` (~l.611, the web accounts),
  `invoiceLinesFor`, `isBackdropInvoice`.
- `aa-prototype/src/shared/capture/feeContext.ts`: `procedureFee` (~l.36), `bookingFee` (~l.74) (the
  live display path); `BtmCaptureBlock.tsx`, `BookingTotalPanel.tsx`; 20a's stack component.
- `aa-prototype/src/shared/booking/BookingDetailBody.tsx`, `OfficeBillingSetup.tsx`, 21's Billing block.
- `aa-prototype/src/apps/admin/screens/ReviewScreen.tsx` (tiles, CONTRACT column,
  `@ $x/unit (list rate)`), `apps/admin/reviewFlags.ts` (`reviewFlagsForBooking`),
  `InvoiceDocument.tsx` (the rail, and the live `masters` reads at ~l.50 to 54),
  `BillingMonitorScreen.tsx` (`resolveAndRetry` ~l.65, its `contractIneffective` /
  `contractMissing` branch ~l.79), `MasterData.tsx` and 18's Contract detail panel (Versions).
- `aa-prototype/src/shared/demoTriggers/registry.ts` (14's `billing-failure` entry ~l.197, which at
  `60e2d1e` end-dates COS ACC through `editContract`; `arm-handoff-fault` ~l.230; `stage-post-op`),
  `memory.ts` (14's non-persisted trigger memory), and `src/store/demoStaging.ts` (absent at
  `60e2d1e`; create it here unless an earlier phase did).
- `aa-prototype/src/domain/seed/`: `contracts.ts`, `bookings.ts` (the Ropata Thu 16 failure List;
  Losa Tuilagi's COS ACC Booking, `billingReference: 'ACC45-118844'` at ~l.945, or 21's renamed
  reference), `history.ts` (the `L-HIST-*` AUTHORISED Lists), `billing.ts`, `index.ts`
  (`SEED_LIST_IDS.billingFailure` ~l.499, markers).
- `aa-prototype/src/apps/demo/DemoControlPanel.tsx`: S4 (~l.311, "then Resolve & retry Losa
  Tuilagi") and S5 (~l.340, Health NZ, as 18 rewrote it) scenario text; the S5 jump authorises
  `SEED_LIST_IDS.whitakerFri17`.
- `aa-prototype/src/store/officeStandIn.ts` (`authoriseAsSimulatedOffice`),
  `aa-prototype/src/pwa/officeSimulation.ts`, `aa-prototype/src/store/demoActors.ts` (`OFFICE_ACTOR`).
- Tests: `store/billingRun.test.ts` (the post-completion unit-value case at ~l.454, as 22 and 24 left
  it), `store/billingRetry.test.ts`, `store/lifecycle.test.ts`, `store/demoScenarios.test.ts`,
  `store/officeStandIn.test.ts`, `pwa/officeSimulation.test.ts`, `domain/seed/seed.test.ts`, 18's
  `domain/billing/feeParity.test.ts`; Playwright `visual/admin-phase09.spec.ts` (billing failure),
  `visual/admin-phase08.spec.ts` (invoice).

## Work items

Snapshot, lock and engine first, re-greened before any UI. Every shape below lives in
`aa-prototype/src/domain/billing` (plus the seed); the UI reads `lockViewFor` and the store's
selectors, never raw snapshot fields, so a v5 of the design stays a contained edit.

1. **Pin the figures before touching anything.** Run 18's `feeParity.test.ts` and record the S3, S4
   and S5 figures as they stand after Phase 24 (Holt, the Prentice split under 22's Split with typed
   shares, the design-day fees, the bariatric $2,800 + $950 from 19a's lines, the Contract fixed-rate
   examples 18 to 24 carried across (US-05.2.6: Health NZ $23, St George's ACC $25, COS ACC $24, Aria
   as 24 left it), and 24's office override and anaesthetist price lines). Add a new
   `domain/billing/__parity__/phase-25-invoices.json` fixture: for each Booking on the S3 Lists
   (Souter Mon 20 AM and PM) and the S5 List (Whitaker Fri 17), the invoice drafts the current engine
   produces (party, supplier, patient line, layout, delivery, lines, subtotal, GST, total). Written
   once with `toMatchFileSnapshot`, never run with `-u`. Every later item must keep it passing: the
   lock changes where the numbers come from, never the numbers.

2. **The snapshot types** (`domain/billing/lock.ts`, re-exported through `domain/types.ts` only as the
   state slice needs; AR-29 `pricing-snapshot`, AR-30 `booking-procedure`):
   - `BookingLock`, one per Booking:
     - `bookingId`, `listId`, `lockedAtISO` (from the demo clock, `clockISO(s.clock)` inside the
       recipe, never `Date.now()`), `lockedBy`, `origin: 'authorise' | 'migrated' | 'officeFix'`,
       `pricingDateISO` (the procedure date, OQ-48);
     - `state: 'locked' | 'rejected'` with `rejections[]` (Procedure, code, message) when rejected;
     - `payee: { anaesthetistId, name, …supplier details }`: the List's anaesthetist at authorise
       (DM-42: whoever submits did the procedures), with the supplier details 22's invoice and the
       BCTI print, as 22 built them;
     - `patient: { name, nhi, address? }` as the invoice prints it (US-08.4.4's recipe);
     - `gstRate`; `prePaid` (the pre-payment already invoiced per Procedure, today's
       `prePaidByProcedure` value with its counterparty; Phase 27 replaces it);
     - `expected: { subtotal, gst, total }` as a checksum (absent when rejected);
     - `procedures: ProcedureSnapshot[]`.
   - `ProcedureSnapshot`, one per non-cancelled Procedure (the catalogue's list, then what the
     invoice needs):
     - `procedureId`; `procedure: { id, name, invoiceWording, rvgCode, groupId, isGeneral }` (19);
       `sourceWording?` (20a, display only, never priced);
     - `contract: { versionId, aaCode, name, holderId?, holderName?, holderParty: 'third' | 'first'
       | 'none', isNoContract, versionLabel }` (18; `versionId` is the version, since each version is
       its own record; `versionLabel` is the version's position in 18's chain, "v2", or 18's label if
       it built one) and `lineId?` (19a);
     - `resolved`: 19a's resolver output verbatim (base and modifier units each with its layer and the
       range, fixed price, fixed rate and fixed discount each with its layer or null);
     - `recorded`: base units (the starting value, the recorded value, its source per 19, the value
       chosen in a range, `outOfGuideRange`), time units (minutes or times captured, overridden flag,
       the RVG time tiers applied, D40), `modifierItems` (19b: code, units, explanation, lock reason);
     - `bookingUnits`: `isPrimary`, the multi-procedure rule as applied (D26: the state of 23's
       `MULTI_PROCEDURE_RULE_APPLIES` switch), 23's allocation (role, calculated, share, split
       across), this Procedure's share of the 3/2/2 split, a combination line's parent procedure and
       the combination Contract version (23's handoff list);
     - `price`: the rate used (`{ kind: 'contractFixedRate' | 'anaesthetistUnitValue', value }`), the
       discount used (the Contract's locked fixed discount and any anaesthetist discount, as 24 combined
       them), the anaesthetist's typed price and its reason, the office override (`type`, `value`,
       `reason`), `priceExGst` and `priceSource` (24's vocabulary: office override, anaesthetist price,
       Contract fixed price, calculated), plus what 24's handoff names: its intermediate figures
       (`contractPrice`, `afterAdjustment`, `beforeOverride`, `total`), the rate's and the discount's
       origin, the adjustment's author and the `adjustmentAllowed` result it was applied under;
     - `billed`: who is invoiced (21: the holder's billable party, or the payer on the Booking) with
       the details the invoice prints (name, email or portal, address, the guardian relationship when
       the payer is not the patient);
     - `split?`: 22's shares (party, typed `{ kind: 'amount' | 'percent', value }`, `amountExGst`);
     - `holderReferences`: the references the locked version declares and the values held (21);
     - `presentation`: layout, delivery, portal name, GST treatment (22, from the version);
     - `billingLines`: copies of the non-BTM lines (events stay 38b's and 39b's).
   - `lockViewFor(lock, procedureId?)`: the one view type every screen reads (labels for the price
     source and each layer, the pricing basis with its figure, who is invoiced, the version badge
     text). 20a's "who is invoiced" and "pricing basis" selectors call it for a locked Booking.
   - State: `billing.locks: Record<BookingId, BookingLock>`; `BillingCase.payeeAnaesthetistId`,
     stamped by the run from `lock.payee` (work item 6); `Invoice.lockedFrom?: { procedureId,
     contractVersionId }[]`, stamped by the run, so a version lists its invoices without walking lines
     (US-04.1.3).
   - No `ContractVersion` record and no `masters.contractVersions`: Phase 18's version chain is the
     history.

3. **Versions listed with their invoices** (selectors in `store/selectors.ts`; US-04.1.3, AR-29
   `contract-versions`):
   - `invoicesByContractVersion(state, versionId)` (reads `Invoice.lockedFrom`) and
     `invoicesForChain(state, contractId)` keyed by version, newest first, over 18's `versionChain`.
   - Confirm and test the frozen history the lock relies on: a started version's terms and lines are
     refused (18's `termsLocked`, 19a's line guards), only the fields 18 left editable change in place,
     and a new version never alters the one before it except its end date.
   - Tests: invoice counts per version after the S3 and S5 jumps; a new version has none; an ended
     version keeps its invoices.

4. **The lock builder** (`domain/billing/lock.ts`, pure):
   - `buildBookingLock(input)` returns a `BookingLock` in state `locked` or `rejected`. The input
     carries the Booking, its non-cancelled Procedures, the List, the patient, the payer, and the
     masters the price and the printed invoice read (the List's anaesthetist, the holders, the Contract
     versions in force and their lines, the RVG groups and procedures, the modifier table, the time
     tiers, billing lines, pre-payments, parties).
   - It resolves everything **once**, from live data, with the same pure functions the live preview
     uses (18's `versionInForce`, 19a's resolver and time tiers, 19b's `resolveModifiers`, 23's
     `bookingFeeFor`, 24's precedence and rejections, 21's who-is-billed, 22's split and
     `supplierFor`), so the lock and the preview cannot disagree.
   - The payee is the List's anaesthetist at authorise. Phases 32 and 32a move a List or a single
     Booking to whoever does it before submit (US-01.4.6), so at authorise the List's anaesthetist did
     the work; the lock fixes it from then on.
   - Warnings never block (15a): an out-of-range base-unit value, a child payer, the insurance
     indication or any other open warning locks as entered, with `outOfGuideRange` recorded.
   - **Rejections** (the engine rejects the Booking, never the List; there is no fallback): `noContract`
     (a guard: 20 requires one), `contractMissing` (an id that no longer exists),
     `contractNotValidOnDate` (no version of the Procedure's Contract is valid on the procedure date:
     "{AA code} · {Contract} is not valid on {date}. Choose a Contract that is." No contract (RVG) is
     never substituted), and 24's rejections as built (a typed price or discount on a Contract that is
     not adjustable; BTM missing with no fixed price). A rejected Booking holds the reasons and no
     price.
   - A blank holder reference is **not** a rejection: it is recorded on the snapshot and checked by
     the run (work item 6), so the office can supply it into the lock.
   - `priceBookingFromLock(lock)` and `invoiceDraftsFromLock(lock)` take the lock only, with no masters
     argument, so the signature proves the engine cannot read live data. `invoiceDraftsFromLock`
     groups by who is invoiced, applies the split (one invoice per party), 24's office override and
     anaesthetist price lines, the pre-payment deduction lines, the line descriptions, the supplier
     block from `payee`, the addressee and patient lines, and the presentation, all from the lock.
     This replaces the live path in `buildInvoicesForBooking`.
   - `compareInvoice(stored, storedLines, draft)` returns `{ identical, differences[] }` over party,
     addressee details, patient line, supplier, layout, delivery, GST treatment, every line
     (description, units, amount), subtotal, GST and total.
   - Tests (`lock.test.ts`):
     - **Parity:** for every completed seeded Booking, `priceBookingFromLock(buildBookingLock(...))`
       equals the live price to the cent, and `invoiceDraftsFromLock` equals item 1's fixture.
     - **Immunity:** after building a lock, change every master the price, the invoice or the payee
       reads (the anaesthetist's unit value, name and supplier details; an RVG group's base and
       modifier units and range; a procedure's own units, name and invoice wording; a modifier's units
       in the table; the time tiers; a Contract's name and valid-to; a new version back-dated over the
       procedure date; an upcoming version's lines; the holder's billable party and its details; the
       payer's name, email and address; the patient's name and address) and the lock still prices,
       splits, presents and prints identically, to the same payee.
     - Each snapshot field is populated for each price source (office override; the anaesthetist's
       typed price on No contract (RVG) and on a first-party Contract; a Contract fixed price; a
       calculated price at a fixed rate and at the anaesthetist's unit value less a fixed discount),
       for base units from the line, the procedure and the group with a value chosen in its range, for
       locked age and P1 modifiers and a claimed one with its explanation, for a split with a $ share
       and a % share, for an additional Procedure under the RVG rule, for a combination line under a
       parent procedure (23), for the holder billed and for the payer billed, and for an out-of-range
       base-unit value.
     - Each rejection, a Contract ended after the Booking was completed, and that a rejection never
       substitutes another Contract.

5. **`authoriseList` writes the locks** (`store/lifecycle.ts`):
   - One `mutate()` flips the List to AUTHORISED, keeps 21's "approved at authorise" stamp on every
     still-unapproved Procedure if 21 built one, writes `billing.locks` for every non-cancelled Booking
     (locked or rejected), and audits `list.authorise` plus one `booking.lock` per Booking (`after`:
     the version ids, the price sources, the payee, the pricing date, `expected.total`, or the
     rejection reasons). Then it emits `listAuthorised`, as today.
   - No new authorise blocker. Whatever 21 left in `authoriseBlockersFor` stays as built; a rejection
     holds one Booking back at billing, never the List. A refused authorise writes nothing. A List with
     only cancelled Bookings locks nothing and still authorises.
   - Add readable labels for every new audit code (`booking.lock`, `lock.supplyReference`,
     `booking.relock`) in `src/shared/audit/actionLabels.ts`; the label scan in
     `auditNarrative.test.ts` fails on an unlabelled `action: '<code>'` literal.
   - Everything that authorises goes through this one function (Review, 14's
     `authoriseAsSimulatedOffice` in `src/store/officeStandIn.ts`, `src/pwa/officeSimulation.ts`, the
     S3 and S5 jumps in `DemoControlPanel.tsx`, `apps/demo/DemoData.tsx`, 14's `stage-post-op` entry
     as 38b will later reshape it), so all of them lock.
   - Tests (`lifecycle.test.ts`): the flip and the locks are one commit; the event fires after it; the
     audit rows; a rejected Booking authorises with its siblings; every caller path locks.
   - Satisfies US-04.3.5 and US-07.3.1 ("locks the List's Bookings, Procedures and the Contract
     versions selected for them"; "reference data snapshotted at lock").

6. **The engine prices only from the lock** (`store/billingRun.ts`, `domain/billing/invoiceBuild.ts`):
   - `runBillingForList` reads `billing.locks[bookingId]` and builds with `invoiceDraftsFromLock`. It
     no longer calls `billingContextForBooking`, `prePaidByProcedure` or anything that reads
     `state.masters`. A Booking with no lock fails as `lockMissing` ("This Booking has no locked
     billing record. Authorise the List again from Review.") and cannot occur after the reseed.
   - A `rejected` lock fails its Booking with the rejection's code and message (US-08.5.1's reason).
   - **The run checks holder references against the locked version** (21's helper over the
     snapshot's `holderReferences`): a blank one fails that Booking as `referenceMissing` with the
     reference and the version in the message: "{AA code} · COS ACC needs a claim reference. None was
     recorded when this List was authorised." It is the engine's backstop to 21's completion rule: a
     completed Booking can still lose one on a SUBMITTED List through an office edit.
   - Delete the fallback: 18's interim ended-Contract fallback to No contract (RVG) and its `billedAs`,
     the `contractIneffective` code and every UI string keyed on it (including
     `BillingMonitorScreen`'s ~l.79 branch), any `defaultContractFor` remnant, and route or payer
     resolution at billing time. Whatever of `resolveContractForProcedure` 20 and 21 left for the
     preview becomes a plain lookup used by the lock builder only. Grep `contractIneffective`,
     `billedAs` and `defaultContractFor` to zero.
   - **Failure stays per Booking (OQ-05, US-08.5.2).** A failure on any Procedure or party of a
     Booking holds the whole Booking back: none of its invoices is issued, including the second
     invoice of a split, and the List's other Bookings still bill. The List itself never fails.
   - **The payee comes from the lock.** The run stamps `BillingCase.payeeAnaesthetistId` from
     `lock.payee` and builds 22's `Invoice.supplier` from it. `handoffCase` takes the ACCPAY contact
     from the case's payee (no `list.anaesthetistId` lookup); both `anaesthetistIdForCase` helpers and
     16's `bctiRecords` read the stamped payee. Pre-payment cases, raised at setup before any lock,
     keep today's join until Phases 27 and 41 give them their own payee (D38); the helper's doc
     comment says so.
   - Stamp `Invoice.lockedFrom` on every invoice raised.
   - Tests (`billingRun.test.ts`, `billingRetry.test.ts`, `xeroHandoff.test.ts`,
     `paymentActions.test.ts`):
     - After authorise, retire or end the Contract, add a back-dated version, change the unit value,
       an RVG group's and a procedure's base units, the time tiers and the payer's details; the run
       and a retry produce the fixture's invoices exactly.
     - Rework the ~l.454 case: a unit-value change **after** authorise no longer affects the run; a
       change **before** authorise does (the lock is at AUTHORISED, not at completion).
     - The old "$23 vs $28.50 fallback" test (as 18 re-expressed it) becomes a
       `contractNotValidOnDate` rejection test: the Booking is held back with the message, the
       sibling bills, nothing is priced at No contract (RVG).
     - `referenceMissing` fails exactly one Booking, bills its sibling, and records the reason on the
       case. On a split Booking it raises neither party's invoice.
     - Payee: the case, the invoice's supplier, the ACCPAY contact, the receipt's `anaesthetistId` and
       the BCTI record all name the locked payee, also in a test-only state where the List's
       `anaesthetistId` is altered after authorise.
     - 16's `bctisFor` gives the same counts as before this phase for the seeded and S3 months.
   - Satisfies US-08.1.1's acceptance criterion ("the engine does not resolve a billing route or
     determine a payer"), RV-01, and DM-08's payee stamp.

7. **The office's manual fix, never a master edit** (`store/lockActions.ts`, new; US-08.5.2,
   US-13.3.2):
   - `supplyLockedReference(api, actor, caseId, key, value, procedureId?)`: office only; only for a
     `failed` case whose code is `referenceMissing`; only for a reference the locked version declares
     and the lock holds blank; refuses an empty value. It fills that one value on the snapshot (and the
     Booking's or Procedure's own field, so the Booking detail agrees), audited `lock.supplyReference`
     with before blank and after the value. The List is AUTHORISED, so `editRefusal` would refuse the
     field write: this action applies its own guards instead. It never changes a Contract, a version,
     a price or any pricing field of the lock.
   - `relockHeldBackBooking(api, actor, caseId, { procedureId, contractId })`: office only; only for a
     `failed` case whose Booking has **no issued invoice** and whose code is `contractNotValidOnDate`;
     the Contract must be one 20's fitting list offers for that Procedure and valid on the procedure
     date. It sets the Procedure's Contract and rebuilds that Booking's lock (`origin: 'officeFix'`),
     audited `booking.relock`. A Booking that has an invoice is never re-locked: a wrong price there is
     a credit note and rebill (Phase 39). Other rejections show their reason with no action (US-08.5.2
     says other manual fixes are supported later).
   - `retryBillingCase` rebuilds from the lock only. It stays idempotent: it refuses a case that is
     not `failed`, a rebuild that still fails leaves the case untouched, and the first invoice reuses
     the failed case's id.
   - Tests: supply then retry raises exactly one invoice and one Xero pair; a second retry is refused
     and raises nothing; supply is refused on a non-failed case, an undeclared reference, a filled one
     and a non-office actor; relock is refused on a Booking with an invoice and on a Contract not
     valid on the date; the supplied value appears on the regenerated invoice.

8. **Regenerate from the recipe** (store selector, pure):
   - `regenerateInvoiceFromLock(state, invoiceId)` finds the invoice's Booking lock, runs
     `invoiceDraftsFromLock`, picks the draft for the same party, and returns `compareInvoice`'s result
     plus a summary from `lockViewFor` (Contract, AA code and version, price source, layers, payee,
     who is invoiced, split, locked at, lines). It never writes state, and it never reads a master or
     reconstructs one as at a date: it is the recipe, not a replay (US-08.4.4).
   - It returns a reason instead of a result for invoices with no lock: pre-payment invoices (raised at
     setup, before the lock; Phase 27 rebuilds them) and 16's AA-FEE invoices.
   - Tests: every invoice raised by the S3 and S5 jumps and by the failure-and-retry path regenerates
     identical, before and after a new Contract version, an RVG group or procedure edit, a unit-value
     edit, and a patient address and payer email edit; both invoices of the Prentice split, an
     invoice carrying 24's adjustment and override delta lines, and 24's no-charge invoice (a price
     of 0 or a 100% discount, BTM still recorded) regenerate identical (24's handoff); a
     hand-corrupted stored line or supplier reports exactly that difference.
   - Satisfies US-08.4.4.

9. **Seed, persist, re-green** (end of the engine half):
   - Every AUTHORISED List in the seed gets its locks at seed time. Today that is the `L-HIST-*`
     backdrop Lists in `history.ts`, whose invoices are stored totals, not priced Procedures. Give them
     `origin: 'migrated'` locks that freeze the stored lines (`HIL*`, one per `HINV*` invoice) as fixed
     lines against the Procedure's Contract version, with the party and patient details as the invoice
     prints them, so regenerate reproduces them honestly and labels them "Migrated history: locked
     from the invoice as loaded". Their payee is the List's anaesthetist, so the stamped payee on each
     history case matches what the live join gave before. Use the Contract Phase 20 gave the `HP*`
     Procedures (one is mandatory from 20), else No contract (RVG), and record the choice. Build them
     with a small pure helper in the seed, not with the live pricing path, and stamp
     `payeeAnaesthetistId` on their cases. Lock any other AUTHORISED List earlier phases seeded through
     `buildBookingLock`.
   - The failure scenario: keep Losa Tuilagi's claim reference `ACC45-118844` in the seed (the trigger
     clears it, so the pristine List authorises and bills cleanly), and confirm the COS ACC version
     declares the claim reference (21 seeded it).
   - No new RNG draws; the canvas generator's draw order is unchanged.
   - **Bump `PERSIST_VERSION` by one** from the value recorded at drift-check step 5, with a comment
     line in the history block.
   - Seed tests (`seed.test.ts`): every AUTHORISED List has a lock for every non-cancelled Booking and
     Procedure; every non-prepayment billing case has a payee equal to its List's anaesthetist; no
     seeded SUBMITTED List would reject a Booking (S2 Beat 4, S3 and 21's child review List stay clean);
     the seed is identical across two builds.
   - `demoScenarios.test.ts`: after each S1 to S5 jump, every AUTHORISED List is fully locked and every
     raised invoice regenerates identical.
   - `npm run build`, `npm run build:pwa`, `npx vitest run` green before any UI.

10. **Locked Bookings display from the snapshot** (`shared/capture/feeContext.ts` and callers):
    - One helper, `feeViewFor(state, booking)`, decides: when `billing.locks` holds the Booking, the
      fee, units, rate, price source, layers and the stack's Contract part come from
      `priceBookingFromLock` and `lockViewFor`, never from masters. Every fee display calls it:
      `BookingDetailBody`, `BtmCaptureBlock`, `BookingTotalPanel`, `OfficeBillingSetup`, the web
      Booking detail, `ReviewScreen`, and 20a's stack (its "who is invoiced" and "pricing basis"
      selectors).
    - Test: edit the unit value, an RVG group's base units, a procedure's invoice wording and the
      Contract's name after authorise; the Booking detail, the stack and Review show the locked
      values, and an ACTIVE Booking by the same anaesthetist shows the new ones.
    - Satisfies US-15.0.3 (billing is the one exception to "entered once, current everywhere") and
      US-04.3.5's display gap.

11. **The locked badge** (shared, all three apps through `useSurface()`):
    - In 21's Billing block and on the stack's Contract part, a neutral pill with the lock glyph:
      "Contract v2 locked at authorise", with the locked time on hover or in the web and admin detail
      line ("Locked 21 Jul 10:42 by Kirsty W."). One pill per distinct Contract version on the Booking.
    - Mobile and web show the same pill; whatever price 24 shows the anaesthetist reads from the lock
      and is read-only after authorise. Admin shows it beside the fee.
    - `OfficeBillingSetup` on a locked Booking renders read-only from the lock: the Contract as locked
      (AA code, name, version), who is invoiced, the price source and pricing basis with its figure,
      each layer, the split (office only) and the payee. It never offers a Contract picker or a share
      editor.
    - `data-shot="booking-lock-badge"`.

12. **Review screen** (`ReviewScreen.tsx`, `apps/admin/reviewFlags.ts`):
    - After authorise, the CONTRACT column shows the locked name plus the lock glyph and mono `v2` (the
      mockup's row lock glyph, placed with the Contract). Tiles and the totals row read the lock.
      `@ $26.50/unit (list rate)` becomes `@ $26.50/unit (locked)` after authorise and stays as 24
      labelled it before; a fixed rate reads "(Contract rate, locked)".
    - Before authorise, a Booking the engine would reject shows an advisory flag from
      `reviewFlagsForBooking` (pure, calling `buildBookingLock`): "Will be held back at billing:
      {reason}", with an Open link to fix it. A blank holder reference shows "Claim reference missing:
      billing will hold this Booking back". Both are Review flags, not 15a warnings and not authorise
      blockers. `data-shot="review-held-back-flag"`.
    - After authorise, the row's detail names the payee, the price source and, for a split,
      "Split: {party} {share}" with the share as typed ($48 or 48%) (office only).

13. **Versions with their invoices** (18's Contract detail panel, `MasterData.tsx`):
    - 18's Versions list (`data-shot="contract-versions"`) gains, per version, "N invoices" that
      expands to invoice numbers linking to `/admin/invoices/:invoiceId`, from
      `invoicesForChain`. "Current", "Upcoming from" and "Ended" stay 18's.
    - Viewing an earlier version stays 18's read-only view (US-04.1.3: "an earlier version can be
      viewed"); add its invoice list there too.
    - No contract (RVG) has one version; it shows its invoices the same way.

14. **Invoice document: printed from the recipe** (`InvoiceDocument.tsx`):
    - For a locked invoice, the addressee block, the "For the care of" patient line, the supplier block
      and the holder references print from the lock, not from `masters` or live Procedures (today's
      ~l.50 to 54 reads). Pre-payment invoices and AA-FEE invoices keep today's reads; the code comment
      says why (27 and 16 own them).
    - A "Locked record" rail card from `lockViewFor`: Contract (AA code · name, version, linking to
      that version in 18's panel), holder and who is invoiced, locked at and by, pricing date, payee
      ("Paid to Dr Souter", with the supplier details 22 prints), split ("Full" or "Split: {share as
      typed} to {party}"), and per Procedure the procedure and RVG code, the price source with the
      rate and discount used, and the base and modifier units with their layer ("From the Contract
      line", "From the procedure", "From the RVG group, chosen in range", "Set by the anaesthetist"),
      with "Outside the range" where `outOfGuideRange` is set. Migrated invoices say "Migrated history:
      locked from the invoice as loaded".
    - The Regenerate result (from the trigger) shows under the card: "Regenerated from locked data:
      identical (4 lines, total $396.18)" in success tint, or the difference list in warning tint. The
      trigger's `run` stores the result in 14's non-persisted trigger memory
      (`src/shared/demoTriggers/memory.ts`), keyed by invoice id, and the rail reads it from there: no
      domain write, no `PERSIST_VERSION` impact, and a reload clears it.
      `data-shot="invoice-locked-record"`.
    - Test: after authorise, change the patient's address and the payer's email, and the invoice
      document renders the original (component or selector test).

15. **Billing monitor: fix without editing the master** (`BillingMonitorScreen.tsx`):
    - Remove the `editContract(... effectiveToISO: undefined)` branch from `resolveAndRetry`.
    - A `referenceMissing` row shows the reason, the line "Held back: none of this Booking's invoices
      was issued. The rest of the List billed." (OQ-05), and an inline field for the missing reference
      (21's label, "Claim reference") with a teal "Add and retry" button: `supplyLockedReference`,
      then `retryBillingCase`, then `handoffCase`. `data-shot="billing-supply-input"`.
    - A `contractNotValidOnDate` row shows the same held-back line and "Choose a Contract and retry",
      which opens 20's Contract picker for that Procedure (the same component, filtered to Contracts
      valid on the procedure date) and calls `relockHeldBackBooking`, then retries.
      `data-shot="billing-relock"`.
    - Handoff failures keep today's plain "Resolve & retry" (re-invoke `handoffCase`).
    - Any other failure shows its reason and a "Retry" that rebuilds from the lock, with the note "Retry
      rebuilds from the locked record. A wrong price after invoicing is corrected by a credit note and
      rebill." (Phase 39).
    - Update the monitor's intro copy: the engine prices from each Booking's locked record. Phase 37
      later restyles the monitor (US-13.3.1); keep these rows self-contained so they move with it.

16. **Triggers, Control Panel text, shots and copy** (see "Demo triggers"):
    - Re-point 14's `billing-failure` entry; register `regenerate-invoice`. Bodies in `src/store`.
    - `DemoControlPanel.tsx`: rewrite the S4 billing-failure clause ("then Resolve & retry Losa
      Tuilagi" becomes "then enter the claim reference on Losa Tuilagi and Add and retry") and the S5
      jump text and Beat 4 clause (as 18 left it: a New version on Health NZ; add that the version
      list shows Whitaker's invoices under the version they were raised on, and that Regenerate on
      Hemi Walker's invoice says identical).
    - Vitest `src/shared/demoTriggers/demoTriggers.test.ts`: the re-based failure fails Tuilagi with
      `referenceMissing`, raises none of her invoices and bills Hemi Walker; its second press says
      "Already triggered"; `regenerate-invoice` is visible only on `/admin/invoices/:invoiceId`,
      disabled with its reason on pre-payment and AA-FEE invoices, and reports identical for S3
      invoices.
    - Playwright: re-point `visual/admin-phase09.spec.ts` to the new failure and the inline "Add and
      retry"; extend `visual/admin-phase08.spec.ts` with the locked-record card and a regenerate run;
      add shots for `contract-versions` with invoices, `booking-lock-badge`, `review-held-back-flag`
      and `billing-relock`.
    - Capture recipes are done in the Catalogue screenshots step below, which owns the recipe list,
      the `--dry` check and the full capture. While building, run
      `npm --prefix requirements-board run capture -- --only US-04.1.2,US-04.1.3,US-04.3.5,US-07.3.1,US-08.1.1,US-08.4.4,US-08.5.1,US-08.5.2,US-13.3.2,US-15.0.3 --dry`
      to find broken recipes early.
    - Grep new copy for en and em dashes; teal on every new action; crimson nowhere new; no "slot" in
      app copy; "Booking", never "card".

## Demo triggers

| Label | Screen (routes) | Surface | Effect |
|---|---|---|---|
| **Regenerate from locked data** (new, `regenerate-invoice`) | Admin · Invoice (`/admin/invoices/:invoiceId`) | Harness bar | `regenerateInvoiceFromLock` on the invoice in `ctx.params.invoiceId`. Read-only: the result goes to 14's trigger memory and the rail's result line says "identical" with the line count and total, or lists the differences; the bar message says the same. Works after a new Contract version, a Contract ended or retired, an RVG group or procedure edit, a unit-value edit, or a patient address or payer email change. Disabled with a reason on pre-payment invoices ("Raised at setup, before the lock") and AA-FEE invoices ("Not priced from a Procedure") |
| **Trigger billing failure** (re-pointed `billing-failure`) | Admin · Billing monitor (`/admin/billing`) | Harness bar | `stageBillingFailure(api)` in `src/store/demoStaging.ts`, replacing the body 14 moved into `registry.ts`: on `SEED_LIST_IDS.billingFailure` (Ropata Thu 16), submit if ACTIVE; as `OFFICE_ACTOR` (14's `src/store/demoActors.ts`), clear Losa Tuilagi's claim reference through the ordinary office Procedure or Booking edit 21 built (`editRefusal` allows it on a SUBMITTED List; confirm 21 does not un-complete the Booking or block authorise on it); then `authoriseList`. The run holds her Booking back whole as `referenceMissing` (the locked COS ACC version needs a claim reference), with none of its invoices issued, and bills Hemi Walker (OQ-05). Disabled "Already triggered" once the List is billed. The old body (ending COS ACC through `editContract`) is deleted |

**Existing actions that now demonstrate the lock (no new button):**
- **Unit-value edit** (Admin, Master data, Anaesthetists, Dr Souter): after an S3 or S5 List is
  authorised, change the unit value. The locked Booking and Review keep $26.50 "(locked)", Regenerate
  says identical, and an ACTIVE Booking shows the new rate.
- **RVG group or procedure edit** (Admin, Master data, the RVG groups and procedures 19 built): change
  the base units of a group or a procedure on an authorised S3 Booking. The locked Booking and its
  invoice keep the old units and layer; an ACTIVE Booking on that procedure re-prices.
- **S5 Beat 4's New version** (18's product action: Health NZ agreed rate, New version from 1 Aug 2026
  at $24.00, the rate set with 19a's line grid "Set for all lines"): the Versions list shows the current version with Whitaker's invoices and the upcoming
  one with none; the Hemi Walker invoice regenerates identical.
- **No fallback** (by hand, not scripted): set COS ACC's valid-to to 15 Jul in Master data before
  triggering, then submit and authorise the Ropata List from Review. Review flags Tuilagi "Will be held
  back at billing: … not valid on 16 Jul"; after authorise she is held back with
  `contractNotValidOnDate`, Walker bills, and "Choose a Contract and retry" fixes her without touching
  the master. Reset afterwards.

**Fallback for the failure cause.** If drift-check step 4 finds that 21 made a missing holder reference
an authorise blocker, the cause above cannot reach the run. Then re-base `billing-failure` on the
handoff path: arm 14's handoff fault and authorise the Ropata List, so Tuilagi's pair fails and the
sibling's succeeds; retire the separate `arm-handoff-fault` entry into it, and say so in the Decisions
log. Under OQ-05 a Booking whose pairs are partly posted to Xero when another fails is part of the
manual fix (US-08.5.2), so stage the fault on a one-invoice Booking.

**PWA.** No new PWA entry. Regenerate and the Billing monitor are admin-only surfaces, and the handset
beat that waits on the office ("Office authorises this List", Phase 14) now writes locks through
`authoriseList` with nothing else to stand in for. Check in a test (14's office stand-in test and
`src/pwa/officeSimulation.test.ts`) that `authoriseAsSimulatedOffice` and "Play the office" lock the
List with the handset's anaesthetist as payee, and that a rejected Booking holds back only that
Booking.

**Phase 15a's shared "Raise sample warnings":** no change; this phase registers no warning rule (the
held-back flags are Review flags).

## Out of scope

- Correcting an invoiced Booking's Contract, price, party or payee: a credit note, then a rebill (Phase
  39, with the credit note option to any party, US-08.6.5, and the rebill from a copy of the original's
  lines, US-08.6.6). Retry never changes pricing; the relock is only for a held-back Booking with no
  invoice.
- Events on a Procedure (38b's element, its review step and the additional invoice; 39b's pre-op and
  post-op kinds) and splitting a combined Procedure (39). This phase locks the billing lines a Booking
  holds at authorise; an event invoiced in a later run is 38b's and 39b's.
- Prepayment (Phase 27): a prepaid Procedure priced at the anaesthetist's own fixed price, locked, with
  nothing left to bill, and its invoice, ledger pair and draft Xero pair at generation. This phase only
  snapshots pre-payment already invoiced, as 20's interim flag left it.
- Moving a List or a single Booking to whoever does it (US-01.4.6, Phases 32 and 32a) and repointing a
  moved prepaid Booking's payee (US-06.5.4, D38, Phase 41). This phase only fixes the payee at
  authorise.
- The Split action itself (22), the precedence and rejections (24), the resolver and its layers (19,
  19a), the modifiers (19b), who is billed (21): the snapshot copies their output.
- New Contract versions and the version chain (18). This phase adds the invoices per version only.
- Explicit save, change sets and as-at history of Bookings (35), which can show a Booking's locked
  version.
- The internal ledger (36): it reads locked invoices, the per-Procedure units and price, and the
  stamped payee; nothing here changes BillingCase's money fields.
- The processing monitor's restyle, sorting and filtering (US-13.3.1, Phase 37), manual fixes for other
  rejections (US-08.5.2 says they are supported later) and BCTI period approval (39a).
- Temporal-table style point-in-time queries over every entity (US-08.4.4's technical discussion): the
  2026-10-02 note asks for the recipe, not a replay; the prototype keeps Contract versions (18) and
  locks billing only.
- An anaesthetist-facing unit-value setting (26), hospital rename or edit (42): US-15.0.3's "change
  once, shows everywhere" gaps for those entities belong there. US-12.1.1 is covered here only for the
  snapshot of the unit value.
- Any change to per-Booking failure isolation (OQ-05 answered it as built) or to which date decides the
  price (OQ-48, built by Phase 18).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to
the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] **S3 figures.** Jump S3, authorise Souter Mon 20 AM and PM. Invoices and totals are exactly as
      before this phase (Holt $396.18; the Prentice split). Each Booking shows "Contract vN locked at
      authorise" on its stack and Billing block; Review shows the lock glyph and version in the
      CONTRACT column and "(locked)" on the rate.
- [ ] **Regenerate.** Open one of those invoices; Demo actions, **Regenerate from locked data**: the
      rail says identical, with the line count and total. The Locked record card names the Contract,
      AA code, version, who is invoiced, payee, price source, rate and discount, and each units layer.
      Both Prentice invoices regenerate identical and their cards read "Split" with the share as typed.
- [ ] **Recipe.** After authorise, change the Holt patient's address (or the payer's email) and Dr
      Souter's supplier details in Master data. The invoice document still prints the originals, and
      Regenerate says identical. Set them back.
- [ ] **Payee.** In the Xero simulation, the ACCPAY behind the Holt invoice is to Dr Souter, and
      receiving a payment on it credits her web Accounts. Nothing about who is paid changes when
      masters are edited.
- [ ] **Unit value after authorise.** Master data, Dr Souter, change the unit value from $26.50 to
      $28.00. The authorised Bookings and Review still show $26.50 (locked) and the same totals;
      Regenerate still says identical; an ACTIVE Souter Booking shows the new rate. Set it back.
- [ ] **RVG data after authorise.** Change the base units on the RVG group (or the procedure) of a
      procedure on an authorised S3 Booking. The locked Booking, Review and invoice keep the old units
      and layer; an ACTIVE Booking on that procedure re-prices. Set it back.
- [ ] **Versions with their invoices (S5 Beat 4).** Jump S5. Health NZ agreed rate, New version from
      1 Aug 2026 at $24.00. The Versions list shows the current version with Whitaker's invoices, each
      linking to its invoice, and the upcoming one with none; viewing the earlier version shows its
      terms and invoices. The Hemi Walker invoice regenerates identical.
- [ ] **No fallback.** Set COS ACC to end on 15 Jul; submit the Ropata Thu 16 List and open Review:
      Tuilagi's row says "Will be held back at billing: … not valid on 16 Jul". Authorise: Tuilagi is
      held back with no invoice, Walker bills, nothing priced at No contract (RVG). "Choose a Contract
      and retry" with a Contract valid on the date bills her once. Reset.
- [ ] **Billing failure (S4 Beat 3).** Reset. Billing monitor, Demo actions, **Trigger billing
      failure**. Losa Tuilagi fails with "… COS ACC needs a claim reference …" and "Held back: none of
      this Booking's invoices was issued"; she has no invoice; Hemi Walker is billed and the List is not
      failed. Enter `ACC45-118844` and **Add and retry**: one invoice and one Xero pair appear, the row
      clears, and History shows `lock.supplyReference`. Pressing the trigger again says "Already
      triggered". No Contract changed (COS ACC's versions and audit are untouched).
- [ ] **Idempotent retry.** After the retry, the case offers no second retry, and the invoice count on
      the List is unchanged by any further click.
- [ ] **Warnings do not block the lock.** A Booking with an out-of-range base-unit value (19's office
      warning open) or a child payer (21) authorises and bills at the value entered; its Locked record
      card says "Outside the range".
- [ ] **Seeded history.** Open a historical backdrop invoice by URL: the Locked record card reads
      "Migrated history", and Regenerate says identical.
- [ ] **Pre-payment and AA-FEE invoices.** Regenerate is disabled with its reason on each.
- [ ] **PWA.** On the installed PWA, submit a List and use "Office authorises this List": it authorises
      and bills; the Booking (while visible) shows the locked badge, and any price shown is read-only.
- [ ] No en or em dashes in any new UI copy; no "slot" in app copy; teal on every new action; crimson
      nowhere new.
- [ ] Catalogue screenshots: the recipes for US-04.1.3, US-04.3.5, US-07.3.1, US-08.1.1, US-08.4.4 and
      US-15.0.3 (plus US-08.5.1, US-08.5.2 and US-13.3.2, which this phase re-points, and US-04.1.2 if
      its `--dry` run fails) are created or updated, a full `npm run capture` ends with no failed recipe
      and no story without a recipe, the covered items' new shots are checked by eye, and
      `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      all green.

## Demo guide updates

In the same session, patch `docs/demo-guide/03-demo-script.md`, `04-presenter-cheat-sheet.md`,
`02-workflows-and-handoffs.md`, the matching sections of `master-demo-guide.html`, and the Control Panel
scenario text:
- **S3 Beat 1 and Beat 2 "Expected":** add that each authorised Booking now carries "Contract vN locked
  at authorise", and that the billing run prices from that record: the Contract version, the values and
  where each came from, the price and its source, who is invoiced and who is paid (Dr Souter), and the
  Prentice split. Figures are unchanged.
- **S4 Beat 3 (billing failure and retry), rewritten:**
  - Click: Admin Billing monitor, Demo actions, **Trigger billing failure**; on Losa Tuilagi, enter the
    claim reference and **Add and retry**.
  - Say: "The engine prices only from what was locked at authorise, so a Contract edit can no longer
    break a run, and nothing is ever swapped for a default. What can still fail is a reference the
    locked Contract needs and the Booking lacks. A List never fails as a whole: the failed Booking is
    held back with none of its invoices issued, and the rest of the List bills. The office supplies the
    reference and retries once, without touching the Contract."
  - Expected: Tuilagi fails with the reason and has no invoice; Walker bills; retry raises exactly one
    invoice.
  - Replace 18's "a Contract held by a surgeon's rooms (Canterbury Orthopaedic Surgeons), which has no fallback, was ended" wording (whatever 18 left).
- **S5 staging text:** the jump authorises Whitaker's Fri 17 List, which locks the Health NZ version in
  force on 17 Jul.
- **S5 Beat 4, renamed "Contract versions and the invoice recipe"** (18 made it "Contract versions"):
  New version on Health NZ from 1 Aug at $24.00, show the Versions list with Whitaker's invoices under
  the current version and none under the new one, then **Regenerate from locked data** on the Hemi
  Walker invoice. Say: a price review is a new dated version; work already done keeps its price, and an
  invoice keeps the recipe it was raised from (the Contract version, the values and where each came
  from, the price and its source, who was invoiced, the patient details and who is paid), so it can be
  produced again exactly, whatever has changed since. It is not a replay of the data as at a date.
- **S5, new optional beat "Unit value after authorise":** change Dr Souter's unit value; the authorised
  Booking keeps its locked rate, Regenerate says identical, an ACTIVE Booking takes the new rate. Reset
  the value afterwards.
- **S4 discovery points:** replace the "billing-failure isolation" open point with the answered rule
  (OQ-05: per Booking, a List never fails, the whole Booking is held back for a manual fix) and keep
  "which fields are frozen at authorise" (US-15.0.3: the draft design names them; still to be confirmed
  in discovery).
- **Cheat sheet:** rewrite "3. Billing failure isolation" to the answered rule and add a "Lock at
  authorise" entry: what is locked (the AR-29 list: procedure, Contract version, values and layers,
  recorded BTM, rate and discount, price and source, who is invoiced, split, payee), no fallback (a
  Contract not valid on the procedure date holds that Booking back), the office's fix in the monitor,
  regenerate from the recipe.
- **Workflows doc:** the authorise step writes the lock and fixes the payee; the billing run reads only
  the lock; a failed Booking is held back whole while the List bills; the office's fix supplies a
  missing reference or, for a Booking never invoiced, chooses a Contract valid on the date, and never
  edits a master; the invoice document prints from the lock.
- **Control Panel:** the S4 and S5 scenario text as in work item 16.
- **Milestone consistency read** (Phase 25 is a milestone): read `master-demo-guide.html` end to end
  against the run sheet and the cheat sheet, and fix any beat still describing a contract fallback, a
  hospital or default Contract, "Resolve & retry restores the contract", effective-dating as the reason
  invoices stay fixed, base units read from the RVG code or a default RVG Contract, Type 1/2/3, a
  payment setting on the Contract, or failure isolation as an open question.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 25` first: earlier phases (18 above all)
may have changed these recipes since this plan was written. This step absorbs work item 16's
capture-recipe work; do it here, not twice. Replace any caption that describes the old model (a
default Contract, a fallback, Type 1/2/3, the route, "resolve and retry" restoring a Contract).

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/` matches
what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-04.1.3](../../../../requirements-board/requirements/stories/US-04.1.3.md) Contract audit and versioning | absent at `60e2d1e`; Phase 18 sets it `partial` with one shot `versions` on Health NZ agreed rate's `contract-versions` ("Every version of a Contract is kept and can be opened") and hands the completion here | Captured. Extend 18's `versions` shot (keep its `name`) on `/admin/masters`, opening Health NZ agreed rate in 18's Contract detail: the Versions list (`contract-versions`) after the S5 jump and a New version from 1 Aug, with the current version's "N invoices" expanded to Whitaker's invoices and the upcoming version showing none; add a `view` state opening the earlier version read-only with its invoices. Caption in the catalogue's words: every version of a Contract is kept, and an invoice raised under an older version is listed under it. Drop 18's partial reason. If 18 did not land the shot, create it as described. |
| [US-04.3.5](../../../../requirements-board/requirements/stories/US-04.3.5.md) Contract locked at AUTHORISED | captured · admin-contract-before, admin-locked-contract | Stays captured. Both start on BK0012 (`/admin/day/2026-07-20/bookings/BK0012`; re-check the id after 19a to 24 seed more Bookings). Re-shoot `contract-before` on the Booking before authorise (the stack and billing setup re-price live, no badge) and `locked-contract` after authorise with `booking-lock-badge` highlighted and the read-only setup showing the Contract version, the price source and each value's layer. Captions: "Before authorise, the Contract and its values still follow the masters" and "Authorised: the Contract version, values and price are locked onto each Procedure". |
| [US-07.3.1](../../../../requirements-board/requirements/stories/US-07.3.1.md) Authorise the List | captured · admin-authorise (confirm, authorised) | Stays captured. Re-shoot both states on `/admin/review/L-25490-2026-07-20-AM`: `confirm` notes the lock, and `authorised` shows the banner plus the lock glyph and version in the CONTRACT column. Add a `held-back-flag` state: with COS ACC ended on 15 Jul, the Ropata Thu 16 Review shows Tuilagi's "Will be held back at billing" flag (`review-held-back-flag`) while authorise stays available. Keep the shot `name`s. |
| [US-08.1.1](../../../../requirements-board/requirements/stories/US-08.1.1.md) Process an AUTHORISED List using each Procedure's locked Contract | captured · admin-authorise-list (confirm, authorised), admin-billing-run | Stays captured. Re-shoot `admin-authorise-list` on `/admin/review/L-34821-2026-07-20-AM` and `admin-billing-run` on `/admin/billing` (the pipeline row now prices from the locked record; caption names it). Add `admin-billing-supply-input`: the Tuilagi row with "Held back: none of this Booking's invoices was issued", the inline claim reference field and "Add and retry" (`billing-supply-input`), staged by the re-pointed `billing-failure` trigger. Keep the image order the catalogue file lists (the US-08.1.2 `admin-review-contracts` image first; its caption "Each procedure already carries its locked contract before billing" must now be true of the shot). |
| [US-08.4.4](../../../../requirements-board/requirements/stories/US-08.4.4.md) Invoice reproducibility | partial · admin-snapshot-invoice | Captured. Re-shoot `admin-snapshot-invoice` on `/admin/invoices` with a caption that no longer says "fixed from the contract in force", and add `admin-locked-record` (`invoice-locked-record`: Contract, AA code, version, price source, layers, who is invoiced, payee, split) with a `regenerated` state after the "Regenerate from locked data" trigger ("Regenerated from locked data: identical"), shot after a patient address or unit-value edit so the caption can say the invoice is produced again from its recipe, unchanged. Drop the partial reason. |
| [US-15.0.3](../../../../requirements-board/requirements/stories/US-15.0.3.md) Enter once | captured · web-entered-by-anaesthetist, admin-seen-by-office | Stays captured. Verify both still resolve on BK0009 (`/web/lists/L-34821-2026-07-21-PM/bookings/BK0009` and `/admin/day/2026-07-21/bookings/BK0009`, `time-capture-track`). Add `admin-billing-exception`: after authorise and a unit-value edit, the locked Booking still shows its locked rate with `booking-lock-badge` while an ACTIVE Booking shows the new one (the billing exception to "entered once"). |

**Recipes this phase breaks.**
- `US-08.5.1` (shot `failure-reason`), `US-08.5.2` (`card-failure`, states `failed` and `retried`) and
  `US-13.3.2` (`resolve-retry`, highlight `tr:has(button:has-text("Resolve & retry"))`) stage the
  failure through a `{ "trigger": "billing-failure" }` setup step, which now stages the missing claim
  reference by itself. `US-08.5.1` only highlights Tuilagi's row on the Ropata pipeline
  (`billing-pipeline-L-39560-2026-07-16-AM`): check the highlight still finds it and that the shot shows
  the new reason. `US-08.5.2` and `US-13.3.2` then click "Resolve & retry": replace those clicks and
  highlights with filling the inline claim reference (`billing-supply-input`) and clicking "Add and
  retry". `US-08.5.2`'s
  captions say a failed Booking is held back whole while the List bills (OQ-05); `US-13.3.2`'s caption
  names the office's manual fix ("supplies the missing reference and retries"), never "Resolve & retry".
- `US-04.1.2` (`contracts`, `edit-contract`): Phase 18 sets it captured; re-check its highlights on 18's
  Contract detail now that the Versions list carries invoice counts.
- `US-02.4.2`, `US-04.1.2` and `US-08.4.4` mention Whitaker, Tuilagi or Health NZ: re-check any seed id
  or row text this phase's seed changes.
- Recipes on authorised Bookings that read the rate or total (`card-calculation` users, 20a's stack
  shots) may show "(locked)" and the badge; the `--dry` run is the check.

**ATLAS.md.** Update Seed data (locks on seeded AUTHORISED Lists, migrated locks on the history
backdrop), Existing hooks (`booking-lock-badge`, `invoice-locked-record`, `billing-supply-input`,
`billing-relock`, `review-held-back-flag`; `contract-versions` now with invoices) and the demo-trigger
section (the re-pointed "Trigger billing failure" and the new "Regenerate from locked data").

## Adversarial review (after build)

After the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**. Fan out independent Opus review subagents for
**quality**, **bugs/correctness** and **plan adherence**, plus a **money-integrity** lens, because this
phase changes where every invoice's numbers come from. This session then independently verifies every
finding against the catalogue and the code, fixes the confirmed ones (adding a test wherever a bug had
none), re-greens, and records the pass in the phase entry. Do not re-raise anything settled in the
Decisions log.

**Steer this phase's reviewers at:**
- **The engine reads no live master.** `runBillingForList`, `retryBillingCase` and
  `regenerateInvoiceFromLock` take nothing from `state.masters` or live billing lines. The
  `priceBookingFromLock` signature has no masters argument. Try to find a path that still does (a
  helper that looks up a Contract name, a holder, a group's base units, a procedure's wording, the time
  tiers, a payer's email, the GST rate, the supplier details, the pre-payment netting).
- **Recipe, not replay (US-08.4.4).** A locked invoice's document prints its addressee, patient and
  supplier from the lock; nothing rebuilds an invoice from masters as at a date. Change a patient's
  address, a payer's email and an anaesthetist's name after authorise and look for any reprint or
  regenerate that moves.
- **Snapshot completeness against AR-29.** Every item in AR-29's pricing snapshot is held (procedure,
  Contract version, resolved values with their layers, recorded BTM with the itemised modifiers, rate
  and discount used, price and source, payer or billable party), plus the split, the payee, the patient
  details, the holder references and the presentation. The immunity test changes each input.
- **One place.** The snapshot type, builder, lock-only pricing and comparison live in
  `domain/billing/lock.ts`; no screen reads a raw snapshot field instead of `lockViewFor`; no second
  copy of the resolver or the precedence exists in the lock path.
- **No fallback remains.** `contractIneffective`, `billedAs` and `defaultContractFor` are gone; a
  Contract not valid on the procedure date rejects that Booking with readable copy, never a silent No
  contract (RVG). No warning (15a) became a blocker, and no new authorise blocker exists.
- **The payee is fixed at authorise.** No locked case, invoice supplier, ACCPAY contact, receipt or BCTI
  record finds its anaesthetist by joining Booking to List. Only pre-payment cases keep the join, and
  the code says why (27, 41).
- **Failure per Booking (OQ-05).** A failed or rejected Booking issues none of its invoices, both halves
  of a split included; its siblings bill; the List is never marked failed.
- **The office fix.** `supplyLockedReference` fills only a blank, declared reference on a failed case
  and touches no pricing field; `relockHeldBackBooking` refuses any Booking with an invoice. Neither
  edits a master.
- **Parity.** Item 1's fixture passes unchanged. S3, S4 and S5 figures are identical to Phase 24's
  (US-05.2.6's fixed rates included), and 16's BCTI counts are unchanged.
- **Atomicity and idempotency.** The List flip and its locks are one `mutate()`; a refused authorise
  writes nothing; the event fires after the commit. Retry never duplicates an invoice, a case or a Xero
  pair, and a second retry is refused.
- **Versions.** The invoice counts per version are right after the S3 and S5 jumps and a New version;
  no started version's terms change in place.
- **Display drift.** No fee display or stack of a locked Booking changes after a master edit, in any app.
  ACTIVE Bookings still re-price.
- **Seeds and determinism.** Every AUTHORISED List is fully locked at seed time; migrated locks are
  labelled; no new RNG draws; no `Date.now()`; `PERSIST_VERSION` bumped; trigger bodies live in
  `src/store` and the PWA purity test holds.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the snapshot's field list (AR-29's draft list plus the invoice and payee fields; the
  catalogue still says "to be determined in discovery"), the rejection reading (a Contract not valid on
  the procedure date holds the Booking back rather than blocking authorise), the office relock for a
  never-invoiced held-back Booking, anything logged rather than fixed, and the screens worth a look,
  each with its route and persona.
- Status row for catch-up Phase 25, and a phase entry: the drift-check result against `60e2d1e`
  (including what 16 and 18 to 24 were found to provide, every live payee join and every live invoice
  print replaced, and any change to the fields to freeze), the snapshot's field list, the tests added,
  `PERSIST_VERSION` old to new, and the adversarial pass.
- **Decisions log** (each names the ruling it supersedes where there is one):
  - **Contract fallback at billing time is removed** (supersedes the 2026-07-23 Phase 08 build decision
    (1), "Contract resolution at billing time", its "$23 vs $28.50 fallback" test, and Phase 18's
    interim ended-Contract fallback to No contract (RVG)). A Contract not valid on the procedure date
    rejects that Booking; the engine reads the lock.
  - **The billing-failure demo is re-based** (supersedes the Phase 09 failure demo that end-dated COS
    ACC and restored it in "Resolve & retry"). The cause is a holder reference missing from the locked
    record; the office supplies it and retries; the master is never edited from the monitor. Note the
    handoff fallback if it was used.
  - **What is locked** (US-04.3.5; AR-29 pricing snapshot, a draft): per Procedure, the procedure, the
    Contract version, the resolved values and their layers, the recorded BTM with the itemised
    modifiers, the Booking-level units, the rate and discount used, the price and its source, who is
    invoiced, the split, the holder references and the presentation; per Booking, the payee, the
    patient details, the GST rate and pre-payment already invoiced. Kept in `domain/billing/lock.ts`.
  - **The invoice keeps its recipe** (US-08.4.4, 2026-10-02): a locked invoice prints and regenerates
    from the lock; nothing reconstructs data as at a date.
  - **The payee is fixed at authorise** (DM-42, DM-08): the List's anaesthetist at authorise is stamped
    on the lock and the billing case; the ACCPAY, receipts, web accounts and BCTI records read it, not a
    live Booking-to-List join (pre-payment cases excepted until 27 and 41).
  - **Versions are Phase 18's dated records**: the snapshot names the version by id; no separate version
    store; versions list their invoices.
  - **Engine rejections are per Booking, not authorise blockers** (amends the earlier plan's
    `contractNotInForce` blocker and any handoff from 21 that expected one): the catalogue's "the
    engine rejects the Booking"; Review previews them as advisory flags.
  - **Failure per Booking is confirmed** (OQ-05 answered; the Phase 09 per-Card reading stands).
  - **The office's manual fix**: `supplyLockedReference` (a missing holder reference) and
    `relockHeldBackBooking` (a never-invoiced Booking whose Contract was not valid on the date) are the
    only post-authorise writes to a lock; an invoiced Booking is corrected only by credit and rebill.
  - **Seeded history carries migrated locks** that freeze the stored lines.
  - Update the `editAnaesthetist` note: a unit-value change re-prices unlocked Bookings only.
- **Handoff notes:**
  - 27: a prepaid Procedure's price (the anaesthetist's own fixed price, locked, nothing left to bill)
    goes into the snapshot through `buildBookingLock` with its own price source, never a second
    builder; the lock's `prePaid` is replaced by that. Pre-payment cases still find their payee by the
    live join and print from live masters; 27 stamps a payee when it builds the prepayment record.
  - 32 and 32a: moving a List or a single Booking to whoever does it must land before authorise; after
    authorise the payee is locked and only a credit note and rebill (39) changes it.
  - 35: explicit save and as-at history can show "Contract vN" on a Booking from the lock and 18's
    chain.
  - 36: the ledger's receivable legs come from locked invoices, each Procedure's units and price from
    the snapshot (US-05.3.5), and the payable leg's payee from `lock.payee`; `Invoice.lockedFrom` gives
    the version lineage.
  - 37: the processing monitor restyle keeps the supply-and-retry and relock rows and their
    `billing-supply-input` and `billing-relock` hooks; the failure code is `referenceMissing` (the
    earlier plan called it `requiredInputMissing`).
  - 38b and 39b: an event recorded before authorise is a billing line the lock copies; an event
    invoiced in a later run carries its own recipe; a Procedure's lock is never rewritten.
  - 39: the credit note and rebill are the only way to change an invoiced Booking's price, split or
    payee; the rebill from a copy of the original's lines (US-08.6.6) copies the locked lines and needs
    a new lock (decide there whether it locks at the current version or the original one).
  - 39b and 42: there is no `masters.contractVersions` store; new Contract lines on a started version go
    through 18's New version, and loads append versions through 18's helpers.
  - 41: repointing a moved prepaid Booking's payee (US-06.5.4, D38) changes the prepayment's payee,
    never a lock.
  - 43: the generator writes locks for its AUTHORISED Lists through `buildBookingLock`.
  - 44: S4 Beat 3 and S5 Beat 4 as rewritten here.
- **Catalogue screenshots.** The step's result: recipes created (US-04.1.3) and changed (US-04.3.5,
  US-07.3.1, US-08.1.1, US-08.4.4, US-15.0.3, plus US-08.5.1, US-08.5.2, US-13.3.2 and any other recipe
  the step broke), the `capture/REPORT.md` counts (captured, partial, absent, failed) before and after,
  and any partial reason handed to a later phase.
