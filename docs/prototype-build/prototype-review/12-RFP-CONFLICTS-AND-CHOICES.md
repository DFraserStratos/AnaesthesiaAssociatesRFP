# Review 12 - the RFP's conflicts, ambiguities and TBCs, and the choice the prototype made

The RFP contradicts itself in places, leaves several rules explicitly open, and marks a handful of
items "to be confirmed". Every one of those points is a place where the prototype had to pick a
reading, and every reading is a place a workshop question can land. This file collects all of them in
one register, built in three passes and then deduplicated:

1. `REQUIREMENTS.md` section 11, the standing register of known RFP tensions plus the pure discovery
   items;
2. the `## Decisions log` in `PROGRESS.md`, including the four named ASSUMPTION entries (time-unit
   rounding, Type 3 second-procedure fallback, SXAP Type 2 rate, ASA seeding values) and the
   labelled demo readings that sit alongside them;
3. every tension the ten slice reviewers surfaced in
   `docs/prototype-build/prototype-review/01-*.md` to `10-*.md`, several of which were not in either
   of the first two sources.

RFP line references throughout are the reviewers' own, against `docs/rfp-reference/RFP.md`. Paths
written as `src/...` are relative to `aa-prototype/`.

**How to read the last column.**

| Verdict | Means |
|---|---|
| Defensible | The reading is recorded, the RFP supports it, and a presenter can explain it in a sentence. Say what we chose and why. |
| Defensible, expect the question | Same, but the RFP's own wording points both ways, so an attentive evaluator will probably raise it. Have the RFP line numbers ready. |
| Needs an answer from AA | Either the RFP explicitly defers the decision, or the two readings have different money or compliance consequences. Do not assert a position as settled. |
| No decision recorded | Nobody picked a reading, nothing in the app flags it, and the behaviour was arrived at incidentally. These are the ambush risks; they have their own section below. |

---

## 1. Schedule, Lists and the fixed canvas

| Conflict | RFP lines | Choice made | Recorded where | Workshop status |
|---|---|---|---|---|
| The schedule section's status vocabulary (available, available for emergency, unavailable, on leave) versus the legacy legend the build adopts (private, public, pre-op, holiday, unavailable, free) | 540-542, with the List Status master at 693-694 | The legacy six, 1:1 with the legend, colour-mapped once in `src/theme/statusColours.ts`. "Available for emergency" is carried as free text on the List, not as a status, so it cannot be filtered, counted or coloured | Binding convention 10 + N2; PROGRESS 2026-07-21 "Status colour mapping"; slice 02 finding 02.4 | Defensible, expect the question |
| The List Status master's fields are "description, colour", and the RFP marks the whole entry "(to be confirmed)" | 693-694 | Colour is single-sourced in the theme layer and key-parity-tested, not carried as an editable master field, so the master screen shows Key / Label / Description with no swatch | Binding convention 10; slice 03 finding 03.2 | Defensible |
| Surgeon assignment is "approximately 80% defined in the anaesthetist's Permanent List", but the RFP's principle-6 field list for Permanent Lists omits surgeon | 547-549 | Reading picked: a nullable `surgeonId` on `PermanentList`, still carried as a discovery item | `REQUIREMENTS.md` section 11 (permanent-list surgeon); PROGRESS 3rd review #4 | Defensible |
| Principle 1 says the canvas "does not grow or shrink with activity", principle 2 says adding an Anaesthetist means populating their forward schedule | 752-760 vs 761-762 | The canvas grows with the **roster** and with the **horizon**, never with activity: `addAnaesthetist` extends forward, advancing the clock generates the far edge, and reassignment absorbs and regenerates so the two-per-day count is invariant | `REQUIREMENTS.md` D1 and D7; PROGRESS 3rd review #3 | Defensible |
| Principle 8 requires List reassignment at short notice but the RFP leaves the mechanism explicitly open (restated as open question 2) | 782-786, 808-810 | Free-target only, absorb the target's empty List, regenerate the vacated slot. Guard-tested, and labelled a replaceable proposal in the confirm dialog itself | `REQUIREMENTS.md` section 11; PROGRESS 1st review #3, relabelled by 4th review #6; Phase 06 decision 8 | Defensible |
| Principle 7 says availability and holiday data is "expected to be reconciled ... (e.g. flagged conflicts, surfaced as constraints)" without saying hard or soft (open question 3) | 777-781, 810-812 | Advisory only: an amber conflict flag with a message, never a block. A truly Free slot restatuses; a booked or reserved slot conflict-flags | PROGRESS Phase 06 decision 1 | Defensible |
| Whether availability windows should also conflict-flag at generation time | 777-781 | At generation, approved leave takes the slot cleanly (a templated booking under a leave window yields a clean Holiday List); conflicts at generation come only from hospital holidays over booked Lists | PROGRESS 2026-07-23 "Availability reconciliation, both directions" | Defensible |
| Principle 3 says status "is not derived from Card activity", yet the office needs a booked-looking block after a phone booking onto a Free slot | 764-767 | Stored `statusKey` is never derived from Cards; the admin day grid derives a **display** status instead | PROGRESS Phase 06 decision 5 | Defensible in principle, but the derivation is missing on both anaesthetist surfaces (confirmed finding 04.1), so a booked Free List reads "Free session" to the anaesthetist. Be ready for it |
| Principle 10 says the append-only-log versus mutable-records-with-audit-columns choice "should be made deliberately as part of the technical design" | 799-802 | Both, deliberately: an append-only audit array as the history of record, plus `lastModifiedBy` / `lastModifiedAt` stamped in the same commit for the RFP's named Card fields | Binding convention 7; PROGRESS 7th review A8 | Defensible |
| "Full audit of changes is required at the Card level ... every create, update, and reassignment must be logged", against a demo that must load with plausible history | 567-570 | Runtime mutations always audit through `mutate()`; seeding writes state without audit, so the cold-load trail is only completes and submits (37 entries against 170 Cards) | PROGRESS 2026-07-23 "Seed audit is minimal"; slice 02 exclusions; confirmed finding 04.3 | Defensible **only if the presenter says it**: do something live first, then open the trail |
| The Card's patient has "unique identifier: NHI number", while the integration section links records "to the NHI number where available" and Appendix 2 puts dedupe on the NHI at intake | 555 vs 1775 and 1956-1957 | `hiddenInternalId` is the invariant key; `nhi` is optional and validated whenever present; one seeded provisional "NHI pending" patient proves the case | `REQUIREMENTS.md` section 11 (patient-without-NHI) and D8; PROGRESS 3rd review #5 | Defensible |
| Data Volumes states ~85 anaesthetists while the seed follows the design mockups' 14-person cast | 365-367 | Scale is narrated and generator-tested at 85 (about 23,000 Lists inside a 2-second budget) plus a paging footnote on the day grid, not seeded at 85 | `REQUIREMENTS.md` N4; PROGRESS 6th review #9 and 7th review B21 | Defensible |

## 2. Billing routes, contracts and rate resolution

| Conflict | RFP lines | Choice made | Recorded where | Workshop status |
|---|---|---|---|---|
| The Billable Party route says "No Contract applies", but Method 3 requires that "a Billable Party, Hospital, or Insurer must hold a Contract that explicitly permits an individually-arranged structure" | 616-617 vs 1163-1165 | Contract is optional on that route; a billableParty-held contract exists only to carry `permitsIndividualArrangement`, which gates rate x time capture | `REQUIREMENTS.md` section 11 (billable-party contract nullability) and B2; PROGRESS 5th review #1 and #2 | Defensible |
| Method 3's permission is held by "a Billable Party, Hospital, or Insurer", but `Contract.holderType` originally had no billableParty member | 1163-1167 | `holderType` gained `billableParty`; the seeded permitting contract is billableParty-held (Aria Skin and Laser Clinic) and the seeded rate x time card bills under it | PROGRESS 5th review #2; 2026-07-23 "Contract-holder placements (seed)" | Defensible |
| "Contract is looked up by counterparty ... not by any other dimension" versus the later ask that the selection hierarchy allow both individual and organisational contracts | 669-670 vs 1151-1153 | `selectContract` filters on holder plus effective date, then ranks individual-anaesthetist scope above organisational, and a negotiated contract above the protected default. Every seeded contract stays organisational, as the RFP says is true today | PROGRESS 5th review #3, recorded in the `contracts.ts` docblock | Defensible |
| Method 2's price list should be keyed by "procedure type", but the demo model has no procedure-type master | 1147 | `rvgBaseCode` stands in for procedure type across the curated code set, labelled a demo simplification | PROGRESS 5th review #3 (partially adopted) | Defensible |
| "Care will be required in the design of the charging of multiple procedures. Various rules apply", with no rules stated; and "2nd procedure pricing usually requires additional rules" | 677-678, 1149 | **ASSUMPTION.** A Type 3 additional procedure takes a fixed price only from an ordinal-keyed price row; with no matching ordinal row the fee falls back to the BTM path, time-only when the procedure is additional | PROGRESS 2026-07-22 "Type 3 second-procedure fallback (demo reading)"; hardened by the Phase 08 review; carried as handoff item P2 | Needs an answer from AA |
| The Insurer route's rate is "governed by the Contract held for that Insurer", yet the only insurer contract that exists is the mandatory Type 1 default | 620-622, 739-741 | Built literally: nib holds a default Type 1 and the insurer route resolves it, so nib bills at standard rates. Whether the route eventually needs its own rate structure is left open | `REQUIREMENTS.md` section 11, pure discovery items (insurer rate structure) | Needs an answer from AA, and it is **not** flagged anywhere on screen or in the cheat sheet (finding 04.6) |
| Is the Hospital route final once resolved, or does non-payment fall back to the Billable Party? | implicit in 601-613 | Not solved. The route is set explicitly and stays set; no fallback path exists in the engine | `REQUIREMENTS.md` section 11, pure discovery items (hospital-route non-payment fallback) | Needs an answer from AA, and likewise not flagged on screen (finding 04.6) |
| The insurer field's dual purpose: route determinant on the Insurer route, informational note under the Hospital route | 581-582, 606-607 | The type allows both; every write path allows only the first, and switching a procedure to the Hospital route silently clears a recorded insurer | **NONE RECORDED** (findings 02.5 and 03.4) | No decision recorded, see section 9 |

## 3. BTM: base, time and modifier units

| Conflict | RFP lines | Choice made | Recorded where | Workshop status |
|---|---|---|---|---|
| The T1 and T2 tiers are defined but partial-interval rounding is never stated | 1032-1041 | **ASSUMPTION.** Round up per started interval, implemented as the named constant `PARTIAL_INTERVAL_ROUNDING` and surfaced to users twice (the capture caption and the control panel) as an assumption to confirm with AA | PROGRESS 2026-07-22, "Time-unit partial-interval rounding = round UP per started interval - a named ASSUMPTION, not a settled rule" | Needs an answer from AA (labelled honestly, so safe to present) |
| ASA "seeds the M field" yet AS1 to AS4 also appear as modifier codes in the same table, so the seed could double-count | 1055-1071 | ASA is captured in its own field, the AS group is filtered out of the chip set, and the calculator appends the ASA code only when the chip list does not already contain it | `ModifierChips.tsx:24`, `fee.ts:81-84`, test `fee.test.ts:55` | Defensible |
| The RFP gives no unit values for the ASA classes | 1055-1071 | **ASSUMPTION.** AS1=0, AS2=1, AS3=3, AS4=4, inside the RFP's stated 0 to 4 range, labelled demo-plausible and pinned by the paper spot-check test | PROGRESS 2026-07-22 "ASA seeding values (demo-plausible, labelled)" | Needs an answer from AA |
| The modifier and RVG tables are illustrative in the RFP, not a schedule | modifier table 1062-1097; base values 973-980 | Demo-plausible values within the RFP's stated ranges, labelled as such in code and on screen, with the real tables recorded as a discovery item for AA and NZSA to supply | PROGRESS 2026-07-22 (2nd review #9); on-screen copy on both master tabs | Needs an answer from AA (supply the real tables) |
| Base values are described as ranging from about 4 units to 20-22 units (major vascular, neurosurgery) | 973-980 | The curated set spans 3 to 11 units, with no neurosurgery site and one vascular code. No logged decision covers the narrowed spread | `REQUIREMENTS.md` P10 (curated subset); confirmed finding 06.1 | Defensible only as "the table is an acknowledged placeholder". Do not present the spread as representative |
| Range base codes leave the exact figure to professional judgement, but principle 10 requires an invoice to be reproducible | 1018-1019 vs 799-802 | The chosen figure persists as `baseUnitsSelected` (captured data, not a derivation) and the validator refuses an absent or out-of-range choice | `REQUIREMENTS.md` D4 | Defensible |
| Positioning is "sometimes already built into the base code" and sometimes added as P1 | 1020-1023 | An explicit `absorbsModifierCodes` list per RVG code; the P1 chip is disabled and struck through and the domain's refusal reason renders verbatim | `REQUIREMENTS.md` B3; `rvgCodes.ts:25-40`, `modifierUnits.ts:34-40` | Defensible (note the caption bug at finding 06.5: the M breakdown still credits an absorbed chip) |
| "ACC patients are never billed directly" versus "who the contract holder claims from is invisible to the billing engine" | 1108-1113 | Advisory, not an engine guard: `accRelated` never reaches `domain/billing/`, and a Billable-Party-route ACC procedure raises an office review warning at authorisation | `REQUIREMENTS.md` B9; PROGRESS 6th review #3 | Defensible |
| The ACC pre-operative assessment flat-fee code set (CS250, CS260, CS70), which the RFP itself marks as a confirmation item, versus "ACC does not require a distinct billing path" | 1114-1118 | Treated as a generic ancillary fixed-fee billing line. The code set is not modelled and the RFP's own TBC is not surfaced anywhere | **NONE RECORDED**; B9 says only "optional flat-fee pre-op codes noted" (finding 06.4) | No decision recorded, see section 9 |

## 4. Invoicing, split billing, pre-payment and the money model

| Conflict | RFP lines | Choice made | Recorded where | Workshop status |
|---|---|---|---|---|
| Same-counterparty procedures are "billed together on a single invoice" (twice), while the Split Billing section says "two separate invoices must be generated" in either split scenario | 672-675, 875-881, 1205-1207 vs 1372 | Group by resolved counterparty, one invoice per Card per counterparty; the two-invoice outcome arises because the additional procedure has a **different funder**. Stated in the Invoices screen's own copy and held as a discovery question | `REQUIREMENTS.md` section 11 (split-billing invoice count); PROGRESS 4th review #1; Phase 08 decision 3 | Defensible, expect the question |
| One route per Procedure versus a single Procedure split across two funders | 574-577, 872-881, 1201-1203 | Route stays single-valued on the Procedure; a per-BillingLine `funderOverride` carries the split, with a conservation rule checked to the cent at completion and re-checked at billing time | `REQUIREMENTS.md` section 11, D4, B5b; PROGRESS 5th review #4 | Defensible |
| Card immutability once locked versus late clinical corrections (post-op charges against a locked Card) | 887-890 | A new linked Card / addendum running its own submit, authorise and bill cycle; the original stays locked. Labelled in UI copy as the RFP's own immutability answer | `REQUIREMENTS.md` section 11 (post-op charges vs locked Cards) and B8 | Defensible |
| Pre-payment "must be collected before the procedure proceeds", but the billing engine is triggered by AUTHORISED, which is after | 1183-1185 vs 1364, with 887-902 | The office raises the pre-procedure invoice before the day; the post-authorisation run bills only the balance as a visible deduction line. Marking the card complete is hard-blocked until paid or audited-overridden | `REQUIREMENTS.md` section 11 (pre-payment vs AUTHORISED-trigger timing); PROGRESS Phase 09 reading 1; settled at the 2nd external review and reaffirmed through the 5th | Defensible (and settled: do not reopen it in the room) |
| "A List cannot be marked SUBMITTED unless all its Cards are correctly completed" (a system gate) versus the office review being "not a system gate" | 895-900 | Both read literally: submission is completion-gated in the store, authorisation is not gated by review flags at all | PROGRESS 2026-07-22 first external review, item (1); `REQUIREMENTS.md` D6 and A4 | Defensible |
| Invoice GST treatment is undefined; the RFP speaks only of the GST component of amounts received | 1240-1247 | **ASSUMPTION.** GST-exclusive lines plus 15% plus total, with an explicit demo-assumption and discovery caption on every invoice document | PROGRESS Phase 08 decision 4 | Needs an answer from AA (labelled on the document, so safe to present) |
| The ACCPAY is "the undiscounted payable" while the ACCREC may carry a Type 2 contract discount, and the RFP never says where AA's agency margin is taken | 1400 | "Undiscounted" read as before AA's agency fee, which the RFP puts outside the billing engine, so the ACCPAY total equals the ACCREC total. Surfaced as a discovery note on the Xero sim's Invoices tab | PROGRESS 2026-07-24 Phase 10 decisions, item 2 (`D-payee-amount`) | Needs an answer from AA (where the margin is taken) |
| Trust-account framing versus a plain two-state ledger | 1234-1236 | Implemented as the two-state model plus an increment-only payables run, which **is** trust-account behaviour; the words "trust account" appear in no UI copy | `REQUIREMENTS.md` X5 wording only; **no separate decision entry** | No decision recorded, see section 9 (the behaviour is built and correct) |
| Does a Card-level processing failure block the whole List, or only that Card? | 1543-1545 | Per-Card isolation: a failed Card blocks only its own invoice, stated in the monitor's own copy and enforced by the run | PROGRESS Phase 09 reading 2 and the monitor copy. Note this one is **not** in `REQUIREMENTS.md` section 11 | Defensible |
| Where office billing monitoring lives: the Admin Web App or a separate Billing Engine admin surface | 843-855, 1546-1548 | Inside the Admin Web App, labelled in the screen's own copy as a picked reading of an open RFP question | `REQUIREMENTS.md` section 11 (billing-monitor location); PROGRESS 4th review #7 | Defensible |
| The trigger for a List leaving the anaesthetist's view: the state table implies AUTHORISED, the next paragraph says invoice generation and the RFP calls it "a build detail to confirm" | 1479-1500 | `billedAt` = completion of the List's billing run. A per-card failure or a Xero handoff failure does not restore visibility; the billing monitor owns those | `REQUIREMENTS.md` section 11 (list-disappearance trigger); PROGRESS 3rd review #12, reaffirmed against the 4th, 5th and 7th review re-raises | Defensible; the RFP itself asks for confirmation, so put it to AA |

## 5. Xero, patient identity and contact lifecycle

| Conflict | RFP lines | Choice made | Recorded where | Workshop status |
|---|---|---|---|---|
| Appendix 1's design policy wants the NHI stored as a searchable cross-reference custom field on the Xero contact; Appendix 2 says the NHI never leaves the PMS and never resides in Xero | 1873-1885 vs 1924, 1937-1939, 1999 | Follow Appendix 2 (stricter data minimisation): only the hidden internal ID (Xero `ContactNumber`) and the `ContactID` cross over. The contradiction is surfaced as an on-screen callout in the Xero sim and enforced by a test that serialises the whole Xero slice against 100+ seeded NHIs | Binding convention 8; `REQUIREMENTS.md` section 11; PROGRESS 2026-07-24 Phase 10 decisions item 1; `Data-Model-and-Flow.md:292, 392` | **Needs an answer from AA.** This is the flagship contradiction and the prototype says so on screen |
| Appendix 1 labels the current NHI check digit "Modulus 24", but its own example `ZAA0067` validates only under a weighted sum mod 11 (a literal mod 24 gives `ZAA0061`) | 1832, 1835 | Mod 11 for the current AAANNNC format and mod 23 for the new AAANNAX format; both RFP examples pinned as unit tests; the label discrepancy stated on screen in the validator | PROGRESS 2026-07-22 "NHI check digits use the official Health NZ algorithms" (user-approved at planning); `REQUIREMENTS.md` D8 repeats the RFP's label and carries the note | Needs an answer from AA (confirm the algorithm, and the label) |
| Archived-contact handling is itself flagged TBC: whether invoicing an archived contact requires an unarchive step first is "to be confirmed in sandbox testing" | 1972-1973 | Unarchive on invoice, with the TBC wording carried into the audit entry for the action rather than attempting invoice-against-archived and falling back | `REQUIREMENTS.md` X3; `store/xeroHandoff.ts:41-42`. Note the wording reaches a user only as JSON in the Audit viewer's before-to-after cell, not as a callout | Needs an answer from AA (sandbox test) |
| Whether Xero's duplicate-invoice-number-prevention org setting is a mandated configuration item | 1552-1554 | Left open and surfaced as a warn callout in the Xero sim rather than assumed | `REQUIREMENTS.md` section 11, pure discovery items; X1 | Needs an answer from AA |
| Appendix 2's outstanding-balance check is specified as a Xero API call (`GET /Invoices?ContactIDs=...&Statuses=AUTHORISED`), while the prototype's rule is that apps read the billing engine's own mirror and never the Xero slice | 1977 | Implemented over the billing mirror (schedule plus billing cases plus invoices), never the Xero slice | `docs/prototype-build/phases/phase-10-xero-and-payments.md:111`; binding convention 9 | Defensible (an architecture choice, not a behaviour change) |
| Whether the outstanding-balance filter should distinguish "open" from "genuinely overdue" | 1978-1979 | A single unpaid boolean. No reading picked and the decision is not flagged anywhere | **NONE RECORDED** (finding 10.2) | No decision recorded, see section 9 |
| `billableParty` is described as "to Patient by default", yet the RFP elsewhere treats Patient and Billable Party as parallel record classes to deduplicate and archive | 583-587 | The payer defaults to the patient and needs no record; the typed `BillableParty` (own hidden internal ID, no NHI) is an override only, gets its own Xero contact, and archives on the same rules | `REQUIREMENTS.md` section 11 (guardian identity), D4, X3; PROGRESS 3rd review #6, 7th review A1 and B15 | Defensible |
| Data Volumes says "~50% of invoices are for a small number of major contract holders" while Appendix 2 says "~99% one-time" | 361-364 vs 1906-1907 | Not actually contradictory (share of invoice volume versus share of contacts). The prototype narrates Appendix 2's figures only; the structural answer to the 50% half is that organisational contacts are never archived | No decision recorded, and none needed (covered structurally by X3) | Defensible |

## 6. Health systems integration

| Conflict | RFP lines | Choice made | Recorded where | Workshop status |
|---|---|---|---|---|
| Once a List is reserved, hospital updates must be "received, interpreted and acted on automatically", but the RFP's own lifecycle state table makes a SUBMITTED or AUTHORISED List office-only | 1586 vs 907-935 | Integration writes to a locked target are refused into a manual-intervention item: nothing is applied and nothing is lost | `REQUIREMENTS.md` D3 and I4; PROGRESS 7th external review finding B11 | Defensible |
| Which PID field carries the NHI: the RFP's single webPAS sample puts the identifier in PID-3, so any per-hospital default is a guess | 1620-1640 | Feed A (St George's) is seeded as PID-2 and Feed B (Christchurch Public) as PID-3, labelled a demo choice. The difference is what makes the per-hospital mapping load-bearing rather than decorative | PROGRESS 2026-07-24 Phase 11 message-shape and feed decisions, item 1 | Defensible |
| "Ideally FHIR-native" engine versus the HL7 v2 reality of NZ hospital PAS | 1762-1766 | The RFP resolves this itself (a v2 pre-processor as a transitional bridge); the prototype ships a translated feed and a native FHIR feed side by side | No decision recorded, and none needed | Defensible |
| Delivery guarantees: respondents must describe store-on-receipt, dedupe, retry, alerting **and** acknowledgement | 1783 | The inbound half is fully demonstrated (store-then-process, MSH-10 dedupe, three attempts with auto-retry, dead-letter, manual-intervention queue, amber alert badge). There is no outbound acknowledgement of any kind | No decision recorded on the ACK; `REQUIREMENTS.md` section 10 fences real endpoints. Finding 09.4 (MISSING) | Defensible with the caveat stated, but volunteer it rather than be caught by it |
| How a Card or Procedure edited concurrently by multiple sources (surgeon integration, hospital integration, mobile app) should be handled | 1580-1586, and open question 1 at 808-810 | No system answer attempted: single-user by design, with an audited last-write-wins stance; the audit trail, `lastModifiedBy` and the live integration writes demonstrate the multi-source reality | `REQUIREMENTS.md` sections 10 and 11 (pure discovery items, concurrency); PROGRESS 4th review #8 | Needs an answer from AA |

## 7. Screens, reporting and the non-functional asks

| Conflict | RFP lines | Choice made | Recorded where | Workshop status |
|---|---|---|---|---|
| Reporting asks for "monthly activity summaries" (a summary), while the balance-view section specifies a date-ranged list of amounts received each with its GST component | 344-347 vs the balance-view section | Built as a transaction list (one row per receipt, GST per row, period total as a footer) with a Monthly / Bi-monthly / Six-monthly selector, which satisfies both readings | PROGRESS 2026-07-22 seventh external review, item A17 ("our 'summary' wording under-promised") | Defensible |
| "Access rights should be managed by role rather than on an individual user basis" versus a prototype with no authentication at all | 353-355 | Roles are real in the domain (`Actor.role` guards a tested role and source matrix) and enumerated in a roles panel; user-to-role administration is excluded | `REQUIREMENTS.md` section 10 and A8 | Defensible |
| "The mobile app displays the calendar" versus Appendix 3, whose mobile screens are a chronological list with Week and Month filters, not a calendar grid | 332-336 plus Appendix 3 | Reading picked: the forward-Lists view with Week / Month / To-Do / Done windows, which is the legacy app's own pattern. Calendar grids appear only in the web week strip and the admin mini calendar | **NONE RECORDED**; implicit in M1 only | No decision recorded, but no consequence, see section 9 |

## 8. Where the RFP and the design mockups disagree

Adjacent to the RFP's own conflicts, and worth having ready, because the mockups are the
authoritative visual reference (convention 17) while the RFP rule wins on business logic (convention
17b).

| Conflict | Choice made | Recorded where | Workshop status |
|---|---|---|---|
| The mockups simplified four business rules: flat "15 min each" time units, a three-chip modifier demo set, "ASA 3 or above adds +1", and a Route column showing anaesthetic technique (GA/Spinal) | The RFP rule wins in every case: tiered T1/T2, all RFP-named modifier groups, real ASA seeding values, and a Route column showing the RFP billing route | PROGRESS 2026-07-21 "Mockup simplifications the build must NOT inherit"; convention 17b | Defensible |
| The mockup NHI `ZAE0311` (David Chen) fails the mod-11 check | The seed carries `ZAE0310`; the other three design-day NHIs validate as printed | PROGRESS 2026-07-23 "ZAE0311 to ZAE0310" | Defensible |
| Appendix 5's dashboard shows Productivity as 30 days / 60 days / 6 months against two prior years; the design mockup shows four tiles for one period | The design mockup governs, and the 4-month demo canvas cannot produce prior-year periods anyway | Convention 17; `src/domain/seed/anaesthetistDashboard.ts` docblock; downgraded claim 01.2 | Defensible |
| The design dashboard's "who's free" panel names an anaesthetist the seed has on leave | The panel reads live availability, so its names legitimately differ from the mockup | PROGRESS handoff list, resolved and informational | Defensible |
| The mockups' design-day fees had to reconcile to the cent through the real tiered calculator | **ASSUMPTION.** The Southern Cross SXAP Type 2 agreed rate is seeded at $26.50, which makes the specific-beats-default contract path genuinely exercised while the mockup fees still match exactly | PROGRESS 2026-07-23 "SXAP Type 2 agreed rate = $26.50" | Defensible (a seed value, not a rule) |

---

## 9. Tensions with **no recorded decision** (the ambush list)

These are the items where nobody picked a reading, nothing in the app flags the question, and the
present behaviour was arrived at incidentally rather than chosen. They are the most valuable rows in
this file: each one is a question an attentive evaluator can ask that has no prepared answer.

### 9.1 The insurer field's dual purpose (the sharpest one)

The RFP says a Procedure's insurer is the route determinant on the Insurer route and "may otherwise
be recorded informationally when noted by the hospital under the Hospital route" (lines 581-582,
606-607). The prototype's **model allows exactly that** (`Procedure.insurerId` is route-agnostic, and
both card-detail read paths display it on any route), but **every write path forbids it**: all three
editors coerce `insurerId` to `undefined` unless the route is Insurer, and the insurer picker renders
only on that route. So switching a procedure to the Contract-holder route silently deletes a recorded
insurer, and there is no field in which to note one. No seeded card pairs a hospital route with an
insurer. Two independent reviewers raised this (findings 02.5 and 03.4) and both were CONFIRMED.
Nothing in `REQUIREMENTS.md` sections 10 or 11 or the Decisions log excludes it. **Risk in the room:**
"where do you record that the hospital told you the patient is with nib?" has no good answer today.
It is a two-line UI fix.

### 9.2 "Open" versus "genuinely overdue" (an explicit RFP decision point, unanswered)

RFP lines 1978-1979 say, in as many words, "Decide whether to separately distinguish 'open' vs
'genuinely overdue' in this filter." The prototype implements a single unpaid boolean with the tooltip
"This patient has an unpaid prior episode (intake check)", picks neither reading, and flags the
decision nowhere: not in section 11, not among the presenter cheat sheet's ten ambiguity items, not as
UI copy. The aging machinery needed to distinguish the two readings already exists in the same
selectors file. Every neighbouring Appendix 1 and Appendix 2 open item **is** surfaced on screen,
which makes this one conspicuous by absence (finding 10.2, CONFIRMED as MISSING).

### 9.3 The ACC pre-operative flat-fee code set (an RFP TBC the app never carries)

The RFP names CS250, CS260 and CS70 as a possible ACC pre-operative-assessment flat-fee code set and
marks it a confirmation item (lines 1114-1118). The three code names appear nowhere in the app or in
the prototype-build docs. The only trace is a generic hint on the fixed-amount billing-line option
("e.g. an ACC pre-op flat fee"). `REQUIREMENTS.md` B9 promised these would be "noted"; they were not,
and unlike the time-rounding assumption there is no discovery flag (finding 06.4).

### 9.4 The insurer route's own rate structure (registered as discovery, but invisible)

Section 11 lists it among the pure discovery items "the prototype flags as talking points", but a grep
of the app for "rate table" or "own rate" returns nothing and it is absent from the cheat sheet's ten
ambiguity items. So there is a registered question with no position, no on-screen flag and no
presenter prompt (finding 04.6). The mechanism is at least visible: the insurer's single default Type
1 contract is on screen, and its atomic creation is narrated on the Insurers master tab.

### 9.5 Hospital-route non-payment fallback (same shape as 9.4)

"If the hospital accepts the route then disputes or fails to pay, does it fall back to the Billable
Party, or is the Hospital final?" is the RFP's own open question 5 and is registered in section 11.
The engine has no fallback path, no position is recorded, and nothing in the app or the cheat sheet
raises it (finding 04.6). This one has real money consequences in production, so it is worth asking
first rather than being asked.

### 9.6 The trust-account framing

The RFP frames AA's money handling as operating "as a Trust account would" (lines 1234-1236). The
prototype implements exactly that behaviour (two-state paid-in and disbursed, plus an increment-only
payables run that can never double-pay), but there is no Decisions-log entry choosing the framing and
the words "trust account" appear in no UI copy. `REQUIREMENTS.md` X5 is the only place the phrase
lives. **Risk in the room:** an accountant asks whether client money is segregated, and the answer is
behavioural rather than stated.

### 9.7 Acknowledgement back to the sending PAS

RFP line 1783 asks respondents to describe their approach to delivery guarantees including
acknowledgement. Nothing outbound exists at all: no MSA or ACK construction and no outbound interface.
A Phase 11 review-fix removed the earlier "acknowledged per message" claim from the monitor copy, so
nothing on screen over-claims, but no decision scoped the capability out either, and the screen's own
docblock still lists per-message acknowledgement as surfaced posture (finding 09.4, CONFIRMED as
MISSING). Volunteer this one.

### 9.8 The truncated base-unit range

The RFP describes base values spanning about 4 to 20-22 units, naming major vascular and neurosurgery
at the top end. The curated demo table spans 3 to 11, has no neurosurgery site, and puts two codes
below the RFP's stated floor. The "demo-plausible values" decision covers value **provenance**, not a
narrowed **span**, so no logged decision covers this (finding 06.1). A clinician in the room may well
notice.

### Recorded nowhere, but genuinely needing no decision

Listed for completeness so nobody mistakes them for the items above.

| Tension | Why no decision is needed |
|---|---|
| "The mobile app displays the calendar" versus Appendix 3's chronological list | The reading is implicit in M1 and matches the legacy app's own pattern; the calendar view exists on the web and admin surfaces, so no information is lost either way |
| "~50% of invoices to major holders" versus Appendix 2's "~99% one-time" | The two figures measure different things (invoice volume versus contact count) and are not in conflict; the structural consequence, that organisational contacts are never archived, is already built |
| "Ideally FHIR-native" versus the HL7 v2 reality | The RFP resolves its own tension in the next sentence, proposing a v2 pre-processor as the transitional bridge, which is exactly what the prototype ships |

---

## Questions to put to AA

A presenter can take this list into the room as it stands. The first four are the ones with the
largest downstream consequences.

1. **NHI in Xero.** Appendix 1 wants the NHI as a searchable cross-reference on the Xero contact;
   Appendix 2 says it must never leave the PMS. We implemented Appendix 2. Which governs?
2. **NHI check digit.** Appendix 1 labels the current-format algorithm "Modulus 24", but your own
   example `ZAA0067` validates only under a weighted sum mod 11. We use mod 11 (and mod 23 for the
   new format). Can you confirm the algorithms, and is the label a typo?
3. **Time units.** The RFP gives the 15-minute and 10-minute tiers but is silent on partial intervals.
   We round up per started interval. Is that the rule, or is it round to nearest, or truncate?
4. **The real code tables.** We need the authoritative RVG base-unit table (including the true
   4 to 20-22 unit spread and the codes that absorb positioning), the modifier unit values, and the
   ASA seeding values. Are the ACC pre-op flat-fee codes (CS250, CS260, CS70) in current use, and do
   they belong in that table?
5. **Second and subsequent procedures under a Type 3 contract.** The RFP says only that "various
   rules apply". We key fixed prices by procedure ordinal and fall back to time-only BTM when no
   ordinal row matches. Do some contracts instead intend a flat per-occurrence price?
6. **Split billing.** Your grouping sections say same-counterparty procedures share one invoice; your
   Split Billing section says two invoices must be generated. Is the intent one invoice per
   counterparty per Card (our reading), or literally two invoices in both split scenarios?
7. **The Insurer route.** Today every insurer holds only a default Type 1, so a direct-billed insurer
   bills at standard rates. Will that hold, or does the Insurer route need its own rate structure?
8. **Hospital-route non-payment.** If a hospital accepts the route and then disputes or fails to pay,
   does the invoice fall back to the Billable Party, or is the Hospital final?
9. **Informational insurer.** When a hospital notes the patient's insurer but the hospital is being
   billed, do you need that recorded as data on the Procedure, or is a free-text note enough?
10. **The outstanding-balance check at intake.** Should it distinguish "open" from "genuinely
    overdue", and if so at what aging threshold? And should it fire at check-in as well as before
    billing?
11. **GST and the agency margin.** We invoice GST-exclusive lines plus 15%. Is that correct, and where
    is AA's agency fee taken, given the RFP calls the ACCPAY "the undiscounted payable"?
12. **Xero specifics.** Does invoicing an archived contact require an unarchive step first (your own
    TBC), and is the duplicate-invoice-number-prevention org setting a mandated configuration item?
13. **Client money.** Should the AA holding account be described and operated as a formal trust
    account, with the segregation language that implies?
14. **Acknowledgements.** What acknowledgement does each hospital PAS require from us per message
    (HL7 ACK/MSA, an application-level ack, or none)?
15. **Concurrency.** When the hospital feed, the surgeon's rooms and the anaesthetist's app touch the
    same Card at once, what should win? Our stance is audited last-write-wins.
16. **Feed shapes.** Which PID field carries the NHI at each hospital, and can each feed supply the
    AIL and AIP location and personnel segments (which would let routing come off the wire rather
    than from configuration)?
17. **List status vocabulary.** Is "available for emergency" or on-call a status in its own right (so
    it can be filtered, counted and coloured), or is it correctly a note against the session?
18. **The disappearance trigger.** You call it "a build detail to confirm": does a List leave the
    anaesthetist's view at AUTHORISED, or at invoice generation (our reading)?
19. **Reassignment.** Is our mechanism acceptable, namely free-target only, absorbing the target's
    empty List and regenerating the vacated slot so every anaesthetist always holds exactly two
    Lists a day?
20. **The overdue view.** Does the anaesthetist need the Surgeon and governing-Contract columns the
    legacy screen implies, or are patient, payer, dates and aging sufficient?
