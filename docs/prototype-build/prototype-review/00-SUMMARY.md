# Prototype review · orchestrator summary

**Reviewed:** 2026-07-27 · against `docs/rfp-reference/RFP.md` in full
**Scope boundary:** `REQUIREMENTS.md` sections 10 and 11
**Slices:** `01-*.md` to `10-*.md` in this folder

---

## Headline verdict

**Nothing found in this review blocks the 10 August workshops.** Zero demo-blocking gaps survived
verification. The prototype answers every load-bearing requirement in the RFP's Candidate
Architecture, and the parts that carry the most weight in a vendor presentation are the parts that
hold up best: the BTM calculator was hand-checked against the RFP's own tier tables and matched to
the cent on nine worked examples; the List lifecycle guards, the route resolution, the ACCREC/ACCPAY
pairing and the NHI check-digit algorithms are all correct, tested and structurally enforced rather
than convention-enforced. All 488 Vitest tests across 43 files pass.

Five findings are **notable**, and four of the five are presenter risks rather than product defects.
Two of those four sit directly on scripted demo beats and should be fixed or scripted around before
10 August:

1. **Finding 04.3** · scenario S5 tells the presenter to open David Chen's Card History "for the full
   audit trail". From a pristine reset that History sheet shows **one line**, because the seed writes
   audit rows only for staged lifecycle facts. The audit mechanism is complete and provable; the
   scripted showcase of it under-delivers.
2. **Finding 05.1** · scenario S3 stages Souter's Mon 20 Jul **AM** List and the script says to show
   "the split-billing Card producing separate invoices where funders differ". That List's split Card
   is same-counterparty and correctly yields **one** invoice. The two-funder Card is on the **PM**
   List, which S3 does not submit.

The other three notable findings are: a Free List that receives an office phone booking is never
repainted, so the booked Card is unreachable from both anaesthetist apps (**04.1**); a runtime-added
anaesthetist gets a forward canvas but no day-grid row, and the header count then disagrees with the
rows (**02.2**); and the office governing-contract picker is unfiltered by route and holder, so a
wrong pick silently redirects an invoice (**03.1**, already parked as PROGRESS handoff item P1).

Everything else, 32 findings, is cosmetic: absent columns, absent captions, labels that are one
sentence short of the RFP's own wording, and one enum that cannot take a new row. No money is
mis-computed anywhere. No lifecycle guard leaks. No requirement in `REQUIREMENTS.md` is MISSING.

---

## Method and lens

Ten section reviewers each took a contiguous range of RFP lines, covering the document end to end
with no gaps and no overlaps:

| Slice | RFP lines | Subject |
|---|---|---|
| 01 | 180 to 456, 2002 to 2041 | Introduction, NFRs, data volumes, Appendix 3 to 5 screens |
| 02 | 487 to 592 | Schedule management and the core entities |
| 03 | 593 to 750 | Billing route resolution, supporting and master data |
| 04 | 751 to 822 | Key design principles and open questions |
| 05 | 824 to 938 | Card as billing anchor, List approval state model |
| 06 | 939 to 1123 | BTM calculation |
| 07 | 1125 to 1386 | Invoicing methods, payments, disbursement |
| 08 | 1388 to 1557 | Xero integration |
| 09 | 1560 to 1799 | Health systems integration (HL7 / FHIR) |
| 10 | 1802 to 1999 | NHI validation and patient identity (Appendices 1 and 2) |

Each reviewer enumerated the RFP's asks from the text **before** opening the app, then verified each
one three ways: the actual source at `file:line`, the test that pins the behaviour, and a screenshot
from `aa-prototype/visual/shots/` proving it renders. Slice 06 additionally hand-computed the BTM
maths against the RFP's tier tables rather than trusting the tests, and slice 10 hand-computed both
NHI check digits.

**The lens was demo-readiness, not production-readiness.** A gap counted only if it would weaken the
prototype in front of the 10 August audience. `REQUIREMENTS.md` section 10 (explicit exclusions) and
section 11 (known RFP tensions with readings already picked) defined the scope boundary, and a
logged decision in `PROGRESS.md` was treated as an answer, not a gap.

The ten slices produced **44 gap claims**. Each was then handed to an independent adversarial
verifier, prompted to **refute** it: to widen the search the reviewer ran, look for the mitigating
surface the reviewer missed, and check whether the omission was a logged decision rather than an
oversight. Verifiers could confirm, downgrade (status or severity), or refute.

| Verdict | Count |
|---|---|
| CONFIRMED | 27 |
| DOWNGRADED | 13 |
| REFUTED | 4 |
| **Total** | **44** |

Three of the 13 downgrades collapsed the claim entirely to BUILT with no residual gap. The four
refutations are listed in their own table below so it is visible that they were checked and
dismissed rather than missed.

---

## Findings register

Confirmed and downgraded findings only, ranked by **corrected** severity. Every claim below survived
an adversarial verifier whose brief was to knock it down.

### Demo-blocking

**None.** No claim, at any original severity, verified as demo-blocking.

### Notable (5)

#### 04.3 · The seeded audit trail is too thin for the beat scripted to showcase it
[`04-design-principles-and-open-questions.md`](04-design-principles-and-open-questions.md)

- **Claim:** the audit mechanism is complete, but the seed writes audit rows only for staged
  lifecycle facts, so the Card the guided script points at has a one-line history.
- **Verifier (CONFIRMED):** the only audit writers in `src/domain/seed/cards.ts` are the
  `card.complete` branch at `:195-208`, the soft-cancel branch, and `addListAudit` for submits at
  `:282-295`. No procedure-level or billing-line-level seed audit exists, so the History sheet's
  merged card + procedure + line query has nothing extra to show. `visual/shots/demo-data.png`
  confirms 37 audit rows against 170 Cards and 173 Procedures;
  `visual/shots/a7-08-history.png` shows a real Card history rendering exactly one
  `card.complete` entry. Chen's Card is seeded `auditComplete: true` with the time-unit override as
  **state**, not as an audited override, and S5 does a plain `resetDemo`
  (`src/apps/demo/DemoControlPanel.tsx:449-457`), so the "much-edited Card History" promise cannot
  be met from a pristine reset.
- **Corrected status:** PARTIAL · **notable**. The fix is either a richer seeded trail on one
  exemplar Card, or a script change telling the presenter to make two or three live edits first
  (which does produce a rich trail).

#### 05.1 · The one-Card-many-invoices case is not on the guided demo path
[`05-card-anchor-and-list-approval.md`](05-card-anchor-and-list-approval.md)

- **Claim:** the rule is implemented, seeded and tested, but S3 stages the wrong List for the beat
  that demonstrates it.
- **Verifier (CONFIRMED):** read the seed both sides of the boundary.
  `src/domain/seed/cards.ts:510-542` is the Souter Mon 20 AM split Card, with **both** procedures on
  the Forte hospital route under `CONTRACT.forteDefault`, so it correctly yields one invoice.
  `:583-618` is the two-funder Card (nib $132.50 / patient $79.50) on the **PM** List. S3 submits
  `listIdForSlot(ANAE.souter, '2026-07-20', 'AM')`
  (`src/apps/demo/DemoControlPanel.tsx:417-429`), while
  `docs/demo-guide/03-demo-script.md:141-151` tells the presenter to show separate invoices there.
  The Invoices table columns are Number, Raised, Counterparty, Layout, Total, Status
  (`src/apps/admin/screens/InvoicesScreen.tsx:113-118`), so two rows cannot be attributed to one
  Card on that screen either. Mitigation found but not enough to downgrade: the PM List is stageable
  off-script from the Data inspector's guard console.
- **Corrected status:** PARTIAL · **notable**. Recovery is easy (authorise the Mon 20 PM List, or use
  the billing monitor, which does print "2 invoices raised.") but currently undocumented.

#### 04.1 · A Free List that receives a booking is never repainted, so its Cards are invisible in both anaesthetist apps
[`04-design-principles-and-open-questions.md`](04-design-principles-and-open-questions.md)

- **Claim:** `editList` deliberately excludes `statusKey`, so an office phone booking leaves the List
  Free; only the admin day grid compensates with a derived display.
- **Verifier (CONFIRMED, and broader than claimed):**
  `ListPatch = Partial<Pick<List,'hospitalId'|'surgeonId'|'startTime'|'endTime'|'notes'>>`
  (`src/store/lifecycle.ts:490-523`), so no runtime action can repaint status, and
  `PhoneAdviceBooking.tsx:68-72` only calls `editList` with hospital, surgeon and times. Only
  `DayGrid` derives a booked display. Beyond the two surfaces cited, the verifier also found the web
  `WeekStrip` renders such a List as "Free / Open for cover" and non-clickable
  (`src/apps/web/components/WeekStrip.tsx:45,149`), and the dashboard day summary counts only
  private / public / preop Lists (`src/apps/web/screens/DashboardScreen.tsx:74-81`), so the booked
  Card is missing from the greeting line too. `docs/demo-guide/03-demo-script.md:100-107` Beat 2
  asserts "the new Card appears on that List, immediately visible in the anaesthetist's app", and
  `PhoneAdviceBooking`'s own docblock says the same.
- **Corrected status:** PARTIAL · **notable**. Not blocking: the presenter must pick Souter's own
  Free slot and then switch apps to expose it, and Souter has no Free session on the design day.

#### 02.2 · A newly added anaesthetist gets a canvas but never gets a day-grid row
[`02-schedule-entities.md`](02-schedule-entities.md)

- **Claim:** `addAnaesthetist` correctly extends the canvas and the flow's copy says the day grid
  gains rows, but the roster maps the static seed cast array.
- **Verifier (CONFIRMED):** verified in `DayGrid`, which the reviewer had not read. Rows come from
  the `anaesthetists` prop only (`src/apps/admin/components/DayGrid.tsx:51-54`), and that prop is
  `ANAESTHETISTS.map((a) => masters.anaesthetists[a.registrationNumber])` for **both** sort modes
  (`src/apps/admin/AdminApp.tsx:6,50-59`), with a comment explaining the cast-array order is
  deliberate roster order matching the Tue 21 mockup. A runtime-added registration number is not in
  that array, so it can never yield a row. `DayGrid.tsx:100-102` even hardcodes "Showing the demo's
  14 anaesthetists", while `AdminApp.tsx:82-86` counts distinct anaesthetists from the day's Lists,
  producing the 15-versus-14 mismatch. `addAnaesthetist` does create the master row plus forward
  Lists (`src/store/mastersActions.ts:270-305`), and `AddAnaesthetistFlow.tsx:16-18,54-57` promises
  the grid gains rows.
- **Corrected status:** PARTIAL · **notable**. Not demo-blocking: a grep of `docs/demo-guide` finds
  no "add anaesthetist" beat, so it only bites off-script.

#### 03.1 · The governing-contract picker is unfiltered by route and holder
[`03-billing-routes-and-master-data.md`](03-billing-routes-and-master-data.md)

- **Claim:** automatic resolution is correctly counterparty-based, but the office override picker
  lists every contract in the store, and the run derives the invoice counterparty from the pick.
- **Verifier (CONFIRMED):** verified the mechanism end to end rather than the picker alone. The
  select maps `Object.values(contracts)` with no route, holder or hospital predicate
  (`src/shared/flows/EditBillingSetupSheet.tsx:169-179`), and on the contract-holder route the
  invoice counterparty **is** the resolved contract's `holderType` / `holderId`
  (`src/domain/billing/invoiceBuild.ts:183-207`), so a billableParty- or surgeon-held pick redirects
  the invoice and its layout. `PROGRESS.md`'s handoff list records exactly this as open item **(P1)**
  "Holder-coherence advisory flag ... deferred again", with the same failure example, so it is
  parked rather than excluded.
- **Corrected status:** PARTIAL · **notable**. Requires the office to make a wrong pick, and PROGRESS
  states none of the handoff items blocks S1 to S5.

### Cosmetic (32)

| ID | Claim | Verifier's evidence | Corrected | Slice |
|---|---|---|---|---|
| 01.1 | Web Overdue table drops the Surgeon and Contract columns W4 names | Header row `src/apps/web/screens/AccountsScreen.tsx:88-96`; `AccpayInvoiceRow` carries no `surgeonId` / `contractId` (`src/store/selectors.ts:592-608`). Verifier checked the only other consumer (`src/apps/mobile/screens/BalancesScreen.tsx`), same omission. Downgraded because RFP.md:2037-2041 asks only for "a classic accounts outstanding view, ordered by date"; the columns come from our own W4 restatement, and the data is one join away | PARTIAL · cosmetic (was notable) | [01](01-nfr-reporting-and-app-screens.md) |
| 01.3 | Audit viewer lists entries in insertion order, not chronological order | `src/apps/admin/screens/AuditViewer.tsx:41` `return rows.slice().reverse() // newest first`; `visual/shots/a7-07-audit.png` AT column reads 07-17, 07-16, 07-16, 07-16, 07-14, 07-09, 07-16, 07-15, 07-14, 07-20, 07-20, 07-20. Verifier found no sort in any audit-rendering path repo-wide. Runtime entries still land on top, so the live audit beat is unaffected | PARTIAL · cosmetic | [01](01-nfr-reporting-and-app-screens.md) |
| 02.1 | `Anaesthetist.active` is editable but inert | Repo-wide grep for the domain flag returns only `src/domain/types.ts:150`, the 14 seeded `active: true` rows, the MasterData column plus its "active flag are editable" subheading, and the `editAnaesthetist` patch. `active` does not appear in `src/domain/seed/canvas.ts` or `src/store/clockActions.ts` at all; the seed passes registration numbers unfiltered (`src/domain/seed/index.ts:333`) | PARTIAL · cosmetic | [02](02-schedule-entities.md) |
| 02.3 | `lastModifiedBy` / `lastModifiedAt` are stamped but never rendered in the product | Grep confirms no hit in `src/apps` or `src/shared`, and no synonym copy either. Downgraded because `mutate.ts` stamps them in lockstep with the audit entry (test-pinned) and `src/shared/card/CardDetailBody.tsx:276-284` puts a one-tap History affordance on every card surface in all three apps, so "who touched this last" is on the same screen | PARTIAL · cosmetic (was notable) | [02](02-schedule-entities.md) |
| 02.4 | List Status master is a closed six-value enum with no available-for-emergency row and no Add action | `src/domain/types.ts:53-61,605-610`; "A fixed enumerated set (view only)" at `src/apps/admin/screens/MasterData.tsx:455-467`; on-call carried as free text in `visual/shots/a-01-day.png`. Downgraded because RFP.md:693-694 itself enumerates exactly those six, and convention 10 plus `src/domain/statusKeyParity.test.ts` pin them, so the view-only enum is a logged decision. Only the unmodelled "available for emergency" status is a residual | PARTIAL · cosmetic | [02](02-schedule-entities.md) |
| 02.5 | An informational insurer on the Hospital route cannot be recorded, and is actively cleared | Both sheets wipe it off-route (`src/shared/flows/EditBillingSetupSheet.tsx:109,128-147`, `EditProcedureSheet.tsx:52`, `ManualCardForm.tsx:105`). Verifier established the store action is route-agnostic (`src/store/cardActions.ts:137`), so the restriction is UI-only; the plan's "informationally-noted insurer" seed item is realised as prose on a billableParty-route card (`src/domain/seed/cards.ts:717-737`), not as `insurerId` | PARTIAL · cosmetic | [02](02-schedule-entities.md) |
| 02.6 | The admin day-view List drawer lists Cards by id, not time order, and shows no times | `src/apps/admin/components/ListDrawer.tsx:30-33` sorts on `a.id.localeCompare(b.id)` and `:74-92` renders patient name plus completion state only; `src/store/selectors.ts:70-74` `cardsForList` also sorts by id. Contrast `ListDetailScreen.tsx:65` and `ListDetailView.tsx:52`, which sort on `scheduledTime`. Seeded ids happen to run in time order, so the mis-order only shows for a runtime-added Card | PARTIAL · cosmetic | [02](02-schedule-entities.md) |
| 03.2 | List Status colour is not a field of the master and no swatch is shown | `ListStatus` is key / label / description only (`src/domain/types.ts:605-610`); table heads are Key, Label, Description with no swatch (`src/apps/admin/screens/MasterData.tsx:455-467`). RFP.md:693-694 names colour as a field of that master and hedges it "(to be confirmed)". Colour is single-sourced in `src/theme/statusColours.ts` and key-parity-tested, which is architecturally deliberate | PARTIAL · cosmetic | [03](03-billing-routes-and-master-data.md) |
| 03.4 | Same as 02.5, raised independently against RFP.md:576-577 and 606-607 | Verifier widened to every `insurerId` consumer in `src/apps` and `src/shared`: exactly three writers, all coercing to `undefined` off the insurer route. The display side already copes (`src/shared/card/OfficeBillingSetup.tsx:42`, `src/shared/capture/BtmCaptureBlock.tsx:94`), making this a two-line UI gap, not a model gap | PARTIAL · cosmetic | [03](03-billing-routes-and-master-data.md) |
| 04.2 | The office cannot add a Card to an already-booked List | The `isFreeEmpty` gate is real (`src/apps/admin/components/ListDrawer.tsx:39,98`), but the conclusion is wrong: two office paths already add a Card to a booked List. Card Copy (`src/shared/card/CardDetailBody.tsx:181,457-460` to `src/store/cardActions.ts:179-210`, which writes a new Card onto `source.listId`) runs under the office actor via `AdminCardDetail.tsx:65`; `MoveCardFlow.tsx:37-40` moves any Card into any non-AUTHORISED List. What remains is only de-novo new-patient creation on a booked List from an office surface | PARTIAL · cosmetic (was notable) | [04](04-design-principles-and-open-questions.md) |
| 04.4 | Same as 02.1, raised against design principle 1's "every ACTIVE Anaesthetist" | Verified from the generator end: `src/domain/seed/canvas.ts` consumes a flat `anaesthetistIds` array with no activity predicate, and `src/store/clockActions.ts:42` hands it every key of `masters.anaesthetists`. `src/store/mastersActions.ts:270` hardcodes `active: true`. The only test touching the flag asserts the write, not any consequence | PARTIAL · cosmetic | [04](04-design-principles-and-open-questions.md) |
| 04.5 | Same as 02.3, raised against design principle 9 | Downgraded on substance: "never shown on any screen" is too strong. The Data inspector renders the whole selected Card as pretty-printed JSON (`src/apps/demo/DemoData.tsx:168-182,405`), so both values are visible in-app on the scenario-finder surface | PARTIAL · cosmetic | [04](04-design-principles-and-open-questions.md) |
| 04.6 | Two of the six RFP open questions (insurer rate structure, hospital-route non-payment fallback) have no talking-point surface | Confirmed factually: read `docs/demo-guide/04-presenter-cheat-sheet.md:202-266` (ten ambiguity items) and `:268-310` (evaluator questions) in full, neither question appears, and no app string raises either. Downgraded from notable because it is presenter material only, no app behaviour is wrong, and the mechanism each question hangs off is on screen and self-explanatory (e.g. `MasterData.tsx:376` narrates the insurer's single default Type 1) | PARTIAL · cosmetic (was notable) | [04](04-design-principles-and-open-questions.md) |
| 05.2 | Sanity-check screen: no Insurer column, no pre-authorisation flag for an unresolvable contract, no fix path from the screen | All three hold. `src/apps/admin/screens/ReviewScreen.tsx:76-77` renders `routeLabel` only, so which insurer and whether it accepts direct claims never reach the screen; `reviewFlags.ts:63-116` has no insurer clause; the Contract cell prints "None" with no tone, and `src/store/billingRun.test.ts:331` confirms an unresolvable organisation-held contract surfaces only later as a billing exception; `AdminApp.tsx:165` mounts ReviewScreen with no card-open callback, unlike `ListDrawer` at `:202` | PARTIAL · cosmetic | [05](05-card-anchor-and-list-approval.md) |
| 05.3 | The Xero-as-add-on framing (separate instance, AR and banking only) is not in app copy | Verifier re-grepped `src` for the framing words: the only "receivables" strings are the anaesthetist aging panel titles, and "separate" appears only in unrelated copy. `src/apps/demo/DemoXero.tsx:53-69` describes what the org contains but never says separate instance or not-the-general-ledger. `REQUIREMENTS.md:88` (X1) explicitly asks the sim to show "the separate AR/banking instance", so this is a real requirement-level copy gap | PARTIAL · cosmetic | [05](05-card-anchor-and-list-approval.md) |
| 06.1 | The RVG base-unit table never reaches the RFP's stated 20 to 22 top end | `src/domain/seed/rvgCodes.ts:15-57`: 34 codes, max is `20880` gastric bypass (range 9 to 11); `42702` and `36561` sit at 3 units, below the RFP's stated floor of about 4; no neurosurgery site; the only vascular code is `34800` varicose veins at 4. The seed's own header comment claims "demo values within RFP-stated ranges", which the two 3-unit codes contradict. No logged decision covers a truncated span | PARTIAL · cosmetic | [06](06-btm-calculation.md) |
| 06.2 | No non-procedural codes for the separately itemised post-op / consult events | Factual core right: 34 surgical codes only, and `fee.ts` emits no unit-based line without an `rvgBaseCode`. Downgraded because `src/domain/seed/rvgCodes.ts:1-9` is an explicitly labelled demo stand-in with the real tables recorded as a discovery item for AA and NZSA, echoed on the master screen; B8's requirement (a post-op event as a linked Card running its own cycle) is fully built | PARTIAL · cosmetic (was notable) | [06](06-btm-calculation.md) |
| 06.3 | `accRelated` cannot be set by any user surface | Verifier widened to the integration path too (`src/store/integrationActions.ts:150-160` never sets it), so no path can set or clear it: writers are only the seed, the fixtures, and four hardcoded `accRelated: false` sites at `src/store/cardActions.ts:132,217,341,421`. Technically patchable via `editProcedure` (`src/store/lifecycle.ts:443`) but wired to no control. The flag is seeded on two cards, so the ACC advisory still demos | PARTIAL · cosmetic | [06](06-btm-calculation.md) |
| 06.4 | The ACC pre-op flat-fee code set (CS250, CS260, CS70) is not modelled or flagged | Verifier widened the search to the planning docs: the three code names appear nowhere in `aa-prototype/src` or `docs/prototype-build`, so they were never carried past the RFP. In-UI discovery notes exist for every comparable TBC (GST rate, mod-24 label, split-billing wording, Xero duplicate-number setting), which makes the absence of an ACC pre-op equivalent a genuine inconsistency against B9's "noted". The only trace is a generic hint at `src/shared/capture/AddBillingLineSheet.tsx:83-87` | PARTIAL · cosmetic | [06](06-btm-calculation.md) |
| 06.5 | The M row caption still credits a modifier the base code absorbs | Reproduced exactly: `src/shared/capture/UnitsCard.tsx:88-102` `modifierBreakdown` is absorption-blind, while the number beside it comes from `modifierUnits` via `resolveBtm`, which is absorption-aware; `ProcedureCodeCard.tsx:40-45` deliberately does not clear `selectedModifierCodes` on a code change. Verifier added that the stale P1 chip is also disabled (`ModifierChips.tsx:46-48`), so the user cannot deselect it. Mitigated by the verbatim absorption reason rendered directly beneath (`ModifierChips.tsx:72-75`) | PARTIAL · cosmetic | [06](06-btm-calculation.md) |
| 06.6 | The admin review footer labels one unit rate on a list that priced at two | Reproduced from `visual/shots/a7-08-history.png`: the Morrison totals row reads 50 units / $1,660.00 next to "@ $35.00/unit (list rate)", while the ACC Type 2 row on the same list prices 9 units at $225.00 ($25/unit), so the footer invites 50 x 35 = $1,750. `src/apps/admin/screens/ReviewScreen.tsx:92,248` takes the label straight from the anaesthetist master, unaware of contract-derived rates. Per-card fees are correct | PARTIAL · cosmetic | [06](06-btm-calculation.md) |
| 07.1 | Contract price rows cannot be keyed by surgeon in the UI | Engine supports it (`src/domain/billing/contracts.ts:64,92-93` scores `surgeonId`); the editor cannot produce such a row (`src/apps/admin/flows/ContractEditSheet.tsx:232-247,277-284` pass only contractId, code, ordinal, price), and no seeded row sets it. So one third of the RFP's "holder, surgeon and/or procedure type" keying is engine-only. The surgeon case is visible by **holder** via the seeded Doyle-held bariatric Type 3 | PARTIAL · cosmetic | [07](07-invoicing-methods-and-payments.md) |
| 07.2 | No office-side per-anaesthetist ledger view | Verifier checked the money layer, not the screens: `payablesDue` and `runPayables` are purely aggregate over ACCPAYs with no per-payee grouping (`src/store/payablesActions.ts:35-46,55-140`); the monitor uses the anaesthetist only as a List heading (`BillingMonitorScreen.tsx:126,163`); the Invoices table carries no anaesthetist column. The per-anaesthetist story lives on the anaesthetist surfaces plus the Xero sim's Payee column. No A-series requirement asks for it, and sections 10 and 11 do not exclude it either | PARTIAL · cosmetic | [07](07-invoicing-methods-and-payments.md) |
| 08.1 | The ACCPAY's "Buyer Generated Tax Invoice" framing is absent | `grep -rni "buyer generated|buyer-generated|BGTI"` over `docs/` and `aa-prototype/src` finds the term only at `RFP.md:1399`. Convention 10 asks for RFP vocabulary exactly as the RFP uses it. In fairness the RFP uses BGTI as a parenthetical accounting aside, and its own working term throughout is ACCPAY, which the prototype uses verbatim; the behaviour is complete and test-pinned | PARTIAL · cosmetic | [08](08-xero-integration.md) |
| 08.2 | The InvoiceNumber vs Reference split is not shown on the Xero side | `XeroAccRec` carries neither field (`src/domain/types.ts:765-774`) and the sim's Invoices tab has no Reference column (`src/apps/demo/DemoXero.tsx:120-136`), diverging from our own candidate model (`docs/rfp-reference/Data-Model-and-Flow.md:228-234`). Downgraded because the remittance key **is** displayed (`DemoXero.tsx:36-46`, borrowed from the linked billing invoice, with the `-P` suffix for the pair), the two values are correctly separated in the engine, and the invoice document prints both with an "internal reference only" caption | PARTIAL · cosmetic (was notable) | [08](08-xero-integration.md) |
| 08.3 | The ACCPAY's DRAFT to AUTHORISED flip is never printed as a status | `src/apps/demo/DemoXero.tsx:204` maps a draft ACCPAY to "Awaiting payment" and an authorised one to "Part paid", so the record's own status word is never on a row. Downgraded because the flip is directly observable per row in the "ACCPAY authorised" money column moving off $0.00, the model is spelled out in RFP vocabulary two lines above the table (`DemoXero.tsx:110-112`), and the underlying field is real and test-pinned | PARTIAL · cosmetic (was notable) | [08](08-xero-integration.md) |
| 08.4 | The mobile GST peek ignores the anaesthetist's own GST period | `src/apps/mobile/screens/BalancesScreen.tsx:41-45` hardcodes the current calendar month and never reads `gstPeriod`, while `src/apps/web/screens/AccountsScreen.tsx:145-166` honours the master field and offers all three periods. Verifier noted the shortfall is against M11 itself ("period selectable monthly/bi-monthly/six-monthly", `REQUIREMENTS.md:53`), which sits in the mobile section. Unreachable in the demo: the mobile persona is hardwired to Souter, who is monthly (`src/shell/appConfig.ts:27,47`, `src/domain/seed/cast.ts:45`) | PARTIAL · cosmetic | [08](08-xero-integration.md) |
| 09.4 | No acknowledgement is returned to the sending hospital system | Genuinely absent: no MSA / ACK construction, no outbound interface, pipeline is inbound-only (`src/store/integrationActions.ts:226-298`). The recorded decision only removed the over-claim from rendered copy rather than scoping the capability out, and the phase plan had asked for the ack posture to be noted in UI copy, so this is not OUT-OF-SCOPE. The RFP frames it as a describe-your-approach item and section 10 fences real endpoints. Note: the screen's docblock at `IntegrationMonitorScreen.tsx:36` still lists "per-message acknowledgement" and is now stale | **MISSING** · cosmetic | [09](09-health-systems-integration.md) |
| 09.5 | The integration message log ships empty, so the reliability surface is blank on a cold open | `src/store/appStore.ts:124-129` returns `{ feeds, messages: {} }` with a docblock saying so. Downgraded because `docs/prototype-build/phases/phase-11-integrations.md:75-90` never asks for pre-seeded rows: every reliability behaviour is specified as trigger-produced, "produced by a real mechanism, not hand-set". The intro paragraph carries the delivery-guarantee narrative with zero rows, the empty state names the fix, and S1 and S4 both fire messages before the monitor is opened | PARTIAL · cosmetic (was notable) | [09](09-health-systems-integration.md) |
| 09.6 | An S13 to a session the anaesthetist does not hold silently degrades to a time-only edit | Control flow confirmed at `src/store/integrationActions.ts:178-201`: an undefined target is indistinguishable from a same-List reschedule, so the date component is dropped and the message reports `processed` instead of parking a manual-intervention item as the noMatch, locked-target and cancelled-target cases all do (S12 even has a dedicated `noTargetList` refusal, so the asymmetry is unintended). Verifier narrowed reachability further: the fixed canvas guarantees two Lists per anaesthetist across the whole horizon, so `listForSlot` only misses for a date outside it | PARTIAL · cosmetic | [09](09-health-systems-integration.md) |
| 10.2 | The "open vs genuinely overdue" decision is not raised as a discovery item | RFP.md:1978-1979 explicitly says to decide it. `src/store/selectors.ts:280-291` returns a plain boolean with no aging input, and the chip tooltip is a single sentence (`BillingMonitorScreen.tsx:200-204`). Verifier read `REQUIREMENTS.md` section 11 in full: absent from both the tensions list and the pure-discovery paragraph, and absent from the cheat sheet's ten ambiguity items, even though the aging machinery (`receivablesAgingFor`) sits in the same file and the neighbouring Appendix 1 and 2 open items **are** surfaced | **MISSING** · cosmetic | [10](10-nhi-and-patient-identity.md) |
| 10.3 | The sequential-to-randomised NHI issuance change is not narrated in any UI copy | The validator panel at `src/apps/admin/screens/IntegrationMonitorScreen.tsx:410-420` is the only NHI narration in the app and covers the two shapes, the two algorithms, the mod-24 label discrepancy and the 1 July 2027 mandate. Range exhaustion, randomisation, the extra identifier capacity and the multiple-births rationale appear nowhere. Structurally the rule is honoured: `src/domain/nhi.ts:132-154` draws every character from the RNG for both formats, and `hiddenInternalId` remains the invariant key | PARTIAL · cosmetic | [10](10-nhi-and-patient-identity.md) |

### Cleared on verification (3)

Downgraded so far that no residual gap remains. Listed for the record rather than as findings.

| ID | Claim | Verifier's evidence | Corrected | Slice |
|---|---|---|---|---|
| 01.2 | Dashboard productivity and locum panels differ from Appendix 5 | Facts hold (four tiles for "July so far", one prior-year footer line, phone only in a `title` attribute), but the deviation is governed. `docs/design/Web Dashboard.dc.html:112-119` shows exactly the same four tiles with the same period label, convention 17 makes it authoritative, the screen's docblock says "Web Dashboard mockup is authoritative; W1", and `src/domain/seed/anaesthetistDashboard.ts:1-9` records why prior-year periods cannot be derived from a 4-month canvas. RFP Appendix 5 is a legacy screenshot, not a layout spec | BUILT · none | [01](01-nfr-reporting-and-app-screens.md) |
| 07.3 | The no-double-charge rule is enforced at the engine, but `isAdditional` is not locked in the store | Every assertion checks out, including the one that matters: `src/domain/billing/fee.ts:107-109` `splitBillingUnits` makes stored base and modifier values irrelevant for an additional procedure, and it is the only unit source for the fee (`:182`), so the rule is enforced at fee composition, not by UI discipline. `copyCard` sets `isAdditional: true` at creation (`src/store/cardActions.ts:213-220`), so Card Copy cannot become a side door. `ProcedurePatch` is permissive but no UI path constructs that patch | BUILT · none | [07](07-invoicing-methods-and-payments.md) |
| 10.1 | The outstanding-balance check is surfaced at billing time, not at check-in | The placement matches our own requirement verbatim: `REQUIREMENTS.md:90` (X3) asks for the check "before a new one bills", which is exactly where it sits, and `PROGRESS.md:519` deviation 3 records the plan's "card / monitor row" wording as an either-or consciously resolved to the monitor row. The check is real, derived from the billing mirror, and rendered with intake-framed tooltip copy (`BillingMonitorScreen.tsx:196-203`). Only residual nit: no unit test on the selector, which the manual checklist covers | BUILT · none | [10](10-nhi-and-patient-identity.md) |

---

## Refuted claims

Checked and dismissed. Recorded so it is visible these were examined, not missed.

| ID | Claim | Refuting evidence | Corrected | Slice |
|---|---|---|---|---|
| 03.3 | No browsable Patient master surface in the Admin app | The absence is scoped, not dropped. `REQUIREMENTS.md:69` (A6) enumerates the master screens (Hospitals, Surgeons, Anaesthetists, Insurers, Contracts + price lists, List Statuses, Permanent Lists, Hospital Holidays, RVG and modifier tables) and deliberately omits Patients, and `src/apps/admin/screens/MasterData.tsx:20-52` matches that list exactly. The master is otherwise reachable: editable from the card PATIENT panel, searchable by NHI through the shared manual-card flow's simulated lookup (`src/shared/flows/ManualCardForm.tsx:73-142`, used by the admin app too), and inspectable as raw records at `src/apps/demo/DemoData.tsx:176-178,405` | OUT-OF-SCOPE · none | [03](03-billing-routes-and-master-data.md) |
| 09.1 | HL7 messages carry no AIP personnel segments; routing and the FHIR Practitioner come from demo metadata | Logged as deliberate three times over. `src/domain/integrations/messages.ts:15` states "AIL/AIP location/personnel segments a real feed carries are out of the [demo extractor's] scope"; `PROGRESS.md:138` item (3) fences it as a section 10 exclusion; `PROGRESS.md:139` records that the Phase 11 adversarial pass re-examined it and did not treat it as a defect; `PROGRESS.md:560` restates it. That same pass corrected the segments the extractor **does** read to the RFP's annotated sample. One genuine residual surfaced in passing and worth parking: `src/apps/demo/DemoIntegrations.tsx:51-55` hardcodes the FHIR Practitioner to Souter, so a locked-target message on Dr Delaney's list still renders Souter's HPI. Two lines, cosmetic, and not what the title claims | OUT-OF-SCOPE · none | [09](09-health-systems-integration.md) |
| 09.2 | The internal representation the store consumes is a neutral parsed message, not FHIR | That **is** the specified design. `src/domain/integrations/fhir.ts:3-8` documents `ParsedMessage` as the deliberate single internal shape both transports converge on, and `src/store/integrationActions.ts:237-243` branches on transport into it. `REQUIREMENTS.md:95-96` asks only that each message show raw HL7 to translated FHIR R4 resource to resulting Card (I1) and that one feed deliver FHIR bundles directly (I2) - both satisfied, and the FHIR feed's bundle genuinely is the parse source via `extractFromFhir`. The stricter natively-FHIR-R4 ideal is an architecture aspiration for the real build with no observable consequence in a fake-backend prototype | BUILT · none | [09](09-health-systems-integration.md) |
| 09.3 | No RESTful FHIR interaction is shown, even in simulated form | The claim disproves itself by citing the two governing fences: `REQUIREMENTS.md` section 10 excludes "real HL7/FHIR endpoints or SFTP" and convention 4 forbids `fetch` outright, and the simulator says so on screen (`src/apps/demo/DemoIntegrations.tsx:115`). A simulated HTTP verb framing would be gold-plating against convention 15. Also partly factually wrong: the RFP's Bundle resource **is** modelled and rendered (`src/domain/integrations/fhir.ts:84,171` emit a real `resourceType: 'Bundle'` whose entries the translated pane prints), it is a message bundle rather than a transaction bundle, and the FHIR-first direction, the Digital Services Hub and Keycloak are all named as referenced-not-implemented in the on-screen callout | OUT-OF-SCOPE · none | [09](09-health-systems-integration.md) |

---

## Section-by-section score

Coverage rows are each slice's own enumeration of the RFP's asks in its line range. Verdicts are the
adversarial pass over that slice's gap claims.

| Slice | Coverage rows | BUILT | PARTIAL | MISSING | OUT-OF-SCOPE | N-A | Claims | CONFIRMED | DOWNGRADED | REFUTED | Notable |
|---|---|---|---|---|---|---|---|---|---|---|---|
| [01 · NFRs, reporting, Appendix 3 to 5 screens](01-nfr-reporting-and-app-screens.md) | 33 | 26 | 3 | 0 | 1 | 3 | 3 | 1 | 2 | 0 | 0 |
| [02 · Schedule entities](02-schedule-entities.md) | 34 | 29 | 5 | 0 | 0 | 0 | 6 | 4 | 2 | 0 | 1 |
| [03 · Billing routes and master data](03-billing-routes-and-master-data.md) | 34 | 30 | 4 | 0 | 0 | 0 | 4 | 3 | 0 | 1 | 1 |
| [04 · Design principles and open questions](04-design-principles-and-open-questions.md) | 28 | 21 | 6 | 0 | 1 | 0 | 6 | 3 | 3 | 0 | 2 |
| [05 · Card anchor and List approval](05-card-anchor-and-list-approval.md) | 24 | 19 | 3 | 0 | 0 | 2 | 3 | 3 | 0 | 0 | 1 |
| [06 · BTM calculation](06-btm-calculation.md) | 39 | 34 | 5 | 0 | 0 | 0 | 6 | 5 | 1 | 0 | 0 |
| [07 · Invoicing methods and payments](07-invoicing-methods-and-payments.md) | 49 | 47 | 2 | 0 | 0 | 0 | 3 | 2 | 1 | 0 | 0 |
| [08 · Xero integration](08-xero-integration.md) | 35 | 29 | 4 | 0 | 1 | 1 | 4 | 2 | 2 | 0 | 0 |
| [09 · Health systems integration](09-health-systems-integration.md) | 32 | 23 | 5 | 1 | 2 | 1 | 6 | 2 | 1 | 3 | 0 |
| [10 · NHI and patient identity](10-nhi-and-patient-identity.md) | 24 | 19 | 2 | 1 | 1 | 1 | 3 | 2 | 1 | 0 | 0 |
| **Total** | **332** | **277** | **39** | **2** | **6** | **8** | **44** | **27** | **13** | **4** | **5** |

The two MISSING coverage rows are the two capabilities the RFP mentions that the prototype genuinely
does not have: an acknowledgement back to the sending PAS (finding 09.4) and a stated reading on
"open vs genuinely overdue" (finding 10.2). Neither corresponds to a numbered requirement.

---

## The 67-requirement coverage matrix

Every requirement in `REQUIREMENTS.md` sections 1 to 9, mapped to BUILT / PARTIAL / MISSING with an
evidence pointer. Where no slice cited a requirement (P1, P5, P6, P7, B10) the status was established
directly against the source and the phase docs' `**Requirements covered:**` lines; those rows are
marked **(self-checked)**.

**Totals: 51 BUILT · 16 PARTIAL · 0 MISSING · 67 rows.**

### 1. Prototype-specific requirements (the demo harness)

| Req | Requirement | Status | Evidence |
|---|---|---|---|
| P1 | React SPA, Vite + React 18 + TS strict, no server | BUILT **(self-checked)** | `aa-prototype/package.json` (react ^18.3.1, vite, vitest, zustand); `aa-prototype/tsconfig.app.json:20` `"strict": true`; phase-00 doc covers P1 |
| P2 | Three apps, one shell | BUILT | `src/apps/mobile/`, `src/apps/web/`, `src/apps/admin/` behind `src/shell/AppShell.tsx`; slice 01 rows 4 and 10 |
| P3 | App switcher, no login, persona implied | BUILT | `src/shell/AppSwitcher.tsx:38`; slice 05 row 1 |
| P4 | Mobile app in a fixed phone frame | BUILT | `src/shell/PhoneFrame.tsx`; `visual/shots/m-01-home.png`; convention 12 |
| P5 | Fake backend, versioned `localStorage`, visible reset, no network | BUILT **(self-checked)** | `src/store/appStore.ts:112` `PERSIST_VERSION = 7` and `:182` persist; "Reset demo data" at `src/apps/demo/DemoControlPanel.tsx:281`; repo-wide grep for `fetch(` in `src` returns nothing outside tests |
| P6 | Deterministic demo clock with time of day | BUILT **(self-checked)** | `src/domain/clock.ts:31` `DEMO_TODAY = '2026-07-21'`, `:56` `now()`, `:87` `HORIZON_FUTURE_MONTHS = 4`; `advanceClockDays` / `advanceClockMinutes` in `src/store/clockActions.ts`; phase-02 and phase-12 docs |
| P7 | Demo control panel | BUILT **(self-checked)** | `src/apps/demo/DemoControlPanel.tsx:222-226` (Clock and reset · Scenario jumps S1 to S5 · Booking and integration events · Billing, money and exceptions), each trigger carrying a `DemoBadge` |
| P8 | True-to-life, not pixel-cloned | BUILT | Slice 01 row 19; note 01.4 records three legacy card fields the modern card omits, covered by convention 17 |
| P9 | Real RFP domain language | BUILT | Slice 01 row 7, slice 07 row 10; `src/domain/types.ts:46` `ListState`. Residual: the RFP's parenthetical "Buyer Generated Tax Invoice" label is unused (finding 08.1) |
| P10 | Believable seed data | BUILT | Slice 01 rows 25 and 26; `src/domain/seed/` (14 anaesthetists, 5 hospitals, 10 surgeons, 34 RVG codes, 20 modifiers, 12 contracts, 3,877 Lists). Residual: the RVG span stops at 11 base units (finding 06.1) |

### 2. Domain model

| Req | Requirement | Status | Evidence |
|---|---|---|---|
| D1 | Fixed canvas, 2 Lists per anaesthetist per day, rolling 4-month horizon | **PARTIAL** | `src/domain/seed/canvas.ts:96-104`; `src/domain/seed/seed.test.ts:60`; roll proven by `src/store/canvasRoll.test.ts:62`. The "every **active** anaesthetist" clause is unenforced (finding 02.1) and a runtime-added anaesthetist gets no day-grid row (finding 02.2) |
| D2 | List: session, lifecycle state, status from master, hospital, surgeon, overridable times, all-day via both Lists | BUILT | `src/domain/types.ts:301-325`; defaults `src/domain/seed/canvas.ts:50-58`, override `src/store/phase06Actions.test.ts:71`; all-day case `src/domain/seed/seed.test.ts:97`. Note: status colour lives in the theme, not on the master row (finding 03.2) |
| D3 | Card: patient-keyed, time-ordered, multi-source per the state table, soft-cancel, `lastModifiedBy/At`, append-only audit | **PARTIAL** | `src/domain/types.ts:370-398`; `src/store/mutate.ts:190-202`; `src/store/lifecycle.ts:48-72`. `cardsForList` sorts by id and the admin drawer shows no times (finding 02.6); `lastModifiedBy/At` render on no product screen (findings 02.3, 04.5) |
| D4 | Procedure: route, contract, insurer, billable-party override, typed price override, `accRelated`, `billingReference`, captured BTM inputs, `isAdditional`, BillingLines with funder override, `patientPaymentCategory` | **PARTIAL** | `src/domain/types.ts:444-526`; `src/domain/billing/validateCardForBilling.ts:188-203`. An informational insurer cannot be recorded off the Insurer route (findings 02.5, 03.4) and `accRelated` has no write surface (finding 06.3) |
| D5 | Master data by reference, availability and holidays reconciled not merged | BUILT | `src/domain/seed/index.ts:389-405` (15 flat id-keyed masters); `src/apps/admin/screens/MasterData.tsx:20-52`; reconciliation `src/store/lifecycle.ts:696-816`, tests `src/store/lifecycle.test.ts:400-457` |
| D6 | List lifecycle, strictly ordered, guard-enforced, no Returned state, completion-gated submission | BUILT | `src/store/lifecycle.ts:229,243-250,281,284`; `src/store/lifecycle.test.ts:114,140,156,163,573` |
| D7 | List reassignment with Cards, status and audit intact, canvas invariant preserved | BUILT | `src/store/lifecycle.ts:611`; `src/store/lifecycle.test.ts:296`; `visual/shots/a-07-reassign-pick.png` to `a-09-reassigned.png` |
| D8 | NHI both formats, "where available", one Patient per person across every intake path, NZHIS ethnicity | BUILT | `src/domain/nhi.ts:74-118` (both algorithms, hand-verified); `src/store/intake.ts:52-128` shared upsert; `src/domain/nhi.test.ts`, `src/store/intake.test.ts`. Residual: the issuance-history narration is absent (finding 10.3) |
| D9 | NHI never appears on any Xero-side screen | BUILT | `src/store/xeroHandoff.ts:53-65`; globally asserted by `src/store/xeroNhi.test.ts`; `src/apps/admin/screens/InvoiceDocument.tsx:26` |

### 3. Anaesthetist Mobile App

| Req | Requirement | Status | Evidence |
|---|---|---|---|
| M1 | Forward Lists view, 2/day visible, filterable, colour-coded | **PARTIAL** | `src/apps/mobile/screens/ForwardListsScreen.tsx:12-15,61-71`; `visual/shots/m-01-home.png`. A Free List holding an office-booked Card renders as "Free session" with no card count and no drill-in (`:103-118`, finding 04.1) |
| M2 | List to Cards view, add Card, soft-cancel, list-level Completed | BUILT | `src/apps/mobile/screens/ListDetailScreen.tsx:65,330`; `src/shared/flows/SubmitListSheet.tsx:107-119`; `visual/shots/m-02-list.png` |
| M3 | Card view: patient, operation, context, insurance note, attachments | BUILT | `src/shared/card/CardDetailBody.tsx:385-400`; `visual/shots/m-03-card.png` |
| M4 | BTM timesheet capture per Procedure | BUILT | `src/shared/capture/BtmCaptureBlock.tsx`, `AsaCard.tsx:40`, `ProcedureCodeCard.tsx:62`, `TimesCard.tsx`, `UnitsCard.tsx:37-81`, `AddBillingLineSheet.tsx`; `visual/shots/m4-01-fee-panel.png`. Note: the M row caption can over-credit an absorbed modifier (finding 06.5) |
| M5 | Validation before submit, clear inline errors | BUILT | `src/domain/billing/validateCardForBilling.ts:125-203`; `visual/shots/m4-09-blockers-sheet.png` |
| M6 | Card copy as a way of adding an additional procedure | BUILT | `src/store/cardActions.ts:179-245` (`copiedFromCardId`, `isAdditional` from the first); `src/store/cardActions.test.ts:145`; `visual/shots/m4-10-copied-time-only.png` |
| M7 | Ad-hoc Card creation with explicit route pick, plus photo capture | BUILT | `src/shared/flows/ManualCardForm.tsx:107`; `src/shared/flows/PhotoCaptureFlow.tsx:21-29`; `visual/shots/m-04-add.png`, `m-06-manual.png` |
| M8 | Availability of other anaesthetists | BUILT | `src/apps/mobile/screens/AvailabilityScreen.tsx:35,59`; `visual/shots/m-05-availability.png` |
| M9 | Own availability maintenance, reconciled into the canvas | BUILT | `src/store/lifecycle.ts:696-816`; `src/store/lifecycle.test.ts:424`; `visual/shots/m-05-availability.png` |
| M10 | Post-submission behaviour, disappearance at invoice generation, next-day reappearance | BUILT | `src/apps/mobile/screens/ForwardListsScreen.tsx:61-62,131-134`; `src/store/selectors.ts:112-120,651`; `src/store/billingRun.test.ts:162`; `visual/shots/a8-08-done-before-billing.png`, `a8-09-done-after-billing.png` |
| M11 | Outstanding balances flat list plus a GST-period activity report, period selectable | **PARTIAL** | `src/store/selectors.ts:644-731`; `visual/shots/w-09-overdue.png`, `w-10-gst.png`. The mobile GST section is hardcoded to a calendar month with no period selector (`src/apps/mobile/screens/BalancesScreen.tsx:41-45`, finding 08.4) |

### 4. Anaesthetist Web App

| Req | Requirement | Status | Evidence |
|---|---|---|---|
| W1 | Dashboard: week strip, receivables aging, productivity, leave, holiday notes, locum panel | BUILT | `src/apps/web/screens/DashboardScreen.tsx:220-320`; `visual/shots/w-01-dashboard.png`. Two W1 sub-items are unrendered (a 30/60-day productivity split, a holiday-notes line); the design mockup governs the layout per convention 17, so this cleared verification (01.2) |
| W2 | Lists view, actual times, drill-down with mobile parity | **PARTIAL** | `src/apps/web/screens/ListsScreen.tsx`, `ListDetailView.tsx:167`; `visual/shots/w-02-lists.png`, `w-03-list-detail.png`. A Free List holding a booked Card is described as "Free / open for cover" and marked non-clickable (`ListsScreen.tsx:50,70-72`, finding 04.1) |
| W3 | Availability day grid for finding locum cover | BUILT | `src/apps/web/screens/AvailabilityScreen.tsx`; `visual/shots/w-06-availability.png` |
| W4 | Overdue table: patient, contract, surgeon, first account date, aging buckets, ACC flag, date-ordered, flat | **PARTIAL** | `src/apps/web/screens/AccountsScreen.tsx:88-96`; `visual/shots/w-09-overdue.png`. No Surgeon column and no governing-contract column; `AccpayInvoiceRow` carries neither field (`src/store/selectors.ts:592-608`, finding 01.1) |

### 5. Admin Web App (office)

| Req | Requirement | Status | Evidence |
|---|---|---|---|
| A1 | One-day schedule dashboard with legend, mini calendar, navigation, internal notes, drill-down | **PARTIAL** | `src/apps/admin/AdminApp.tsx:50-86`, `src/apps/admin/components/DayGrid.tsx`; `visual/shots/a-01-day.png`, `a-03-drawer.png`, `a-04-card.png`. The roster maps the static seed cast, so a runtime-added anaesthetist has no row and the header count disagrees (`DayGrid.tsx:51-54,100-102`, finding 02.2) |
| A2 | Manual change handling: edit DRAFT/SUBMITTED, assign surgeons, set billing setup, phone bookings, cancel, move a Card | **PARTIAL** | `src/apps/admin/flows/` (EditListSheet, PhoneAdviceBooking, MoveCardFlow, ReassignListFlow); `src/shared/card/OfficeBillingSetup.tsx`; `src/store/phase06Actions.test.ts`. The governing-contract picker is unfiltered by route and holder (finding 03.1) and de-novo Card creation on an already-booked List has no office entry point (finding 04.2) |
| A3 | List reassignment for illness cover, canvas preserved | BUILT | `src/apps/admin/flows/ReassignListFlow.tsx:17-21,102`; `src/store/lifecycle.ts:611`; `src/store/lifecycle.test.ts:296` |
| A4 | Authorisation queue and sanity-check screen with contract / insurer / reference completeness flags | **PARTIAL** | `src/apps/admin/reviewFlags.ts:63-116`; `src/apps/admin/screens/ReviewScreen.tsx:205-290`; `visual/shots/a7-01-queue.png`, `a7-02-review.png`. No insurer column or insurer flag, no pre-authorisation flag for an unresolvable contract, no drill-down to fix (finding 05.2) |
| A5 | Billing-flow monitoring with per-Card errors and retry, plus a triggerable failure | BUILT | `src/apps/admin/screens/BillingMonitorScreen.tsx:65-99,173-178`; `src/store/selectors.ts:501-545`; `src/store/billingRun.test.ts:347`; `visual/shots/p9-02-monitor.png` |
| A6 | Master data screens, read/edit, for ten named masters | **PARTIAL** | `src/apps/admin/screens/MasterData.tsx:20-52`; `src/apps/admin/flows/ContractEditSheet.tsx`, `EditAnaesthetistSheet.tsx`, `PermanentListSheet.tsx`, `AddHolidaySheet.tsx`; `visual/shots/a7-04-masters.png`, `a7-05-contract.png`, `a7-06-add-hospital.png`. Five masters are view-only where A6 asks for read/edit; List Statuses shows no colour (finding 03.2); price rows cannot be keyed by surgeon (finding 07.1) |
| A7 | Audit trail viewer, append-only, Card and Procedure level, including automated actions | **PARTIAL** | `src/apps/admin/screens/AuditViewer.tsx`; `src/store/mutate.ts:150-209`; `src/store/mutate.test.ts:77-140`; `visual/shots/a7-07-audit.png`, `a7-08-history.png`. Entries render in insertion order (finding 01.3) and the seeded trail is 37 rows against 170 Cards (finding 04.3) |
| A8 | Role-based access including view scoping | BUILT | `src/apps/admin/RolesInfo.tsx:20-40`; `src/store/lifecycle.ts:45-71`; `src/store/lifecycle.test.ts:257`; `src/apps/moneyViewPurity.test.ts` |

### 6. Billing Engine

| Req | Requirement | Status | Evidence |
|---|---|---|---|
| B1 | Trigger on List AUTHORISED, whole List as a unit | BUILT | `src/store/lifecycle.ts:305`; `src/store/billingRun.ts:453-470`; `src/store/billingRun.test.ts:81` (idempotent second run refused) |
| B2 | Route resolution per Procedure, resolution by holder, protected default Type 1, scoped exactly as the RFP scopes it | **PARTIAL** | `src/domain/billing/invoiceBuild.ts:87-207`; `src/store/mastersActions.ts:49-163`; `src/store/contractActions.ts:28-30,111-119,157`; `src/store/billingRun.test.ts:189,232,317,331,445`. The office override picker is unfiltered and the run derives the counterparty from the pick (finding 03.1) |
| B3 | Fee = (B + T + M) x the anaesthetist's own $/unit, tiered time, one base code, P1 absorption, ASA seeding, pure and tested | BUILT | `src/domain/billing/fee.ts:180`, `timeUnits.ts:26-29`, `modifierUnits.ts:33-40`; `src/domain/billing/fee.test.ts:71` (paper spot-check $720); hand-verified against the RFP tiers on nine worked examples in slice 06 |
| B4 | Three charge bases plus Type 2 agreed rate / percent discount | BUILT | `src/domain/billing/fee.ts:188-250`; `src/domain/billing/contracts.ts:74-108`; `src/store/billingRun.test.ts:124,177,189,206`. Residual: price rows cannot be keyed by surgeon in the UI (finding 07.1) |
| B5 | Split billing: additional procedures time-only and structurally enforced; one procedure across two funders | BUILT | `src/domain/billing/fee.ts:107-109`; `src/shared/capture/UnitsCard.tsx:54-81`, `BtmCaptureBlock.tsx:164-171`; `src/store/billingRun.test.ts:292,455`; verified stronger than claimed (07.3 cleared) |
| B6 | Invoice generation, grouping per Card by counterparty, two layouts, email and print, nib portal, unique numbers, separate case reference | BUILT | `src/domain/billing/invoiceBuild.ts:216-220,397-433`; `src/store/billingRun.ts:186-194,398-408`; `visual/shots/a8-03-contract-holder-doc.png`, `a8-06-invoices-mixed.png`, `a8-07-patient-doc.png`. Residuals: the two-invoice case is off the guided path (finding 05.1) and the Xero side shows no Reference field (finding 08.2) |
| B7 | Pre-payment: typed prepayment detail, pre-procedure invoice, prominent flag, hard completion gate, audited override, balance follows | BUILT | `src/store/prepaymentActions.ts:1-22,196`; `src/domain/billing/prePaymentInvoice.test.ts`; `visual/shots/p9-05-gate.png` |
| B8 | Post-op additions as a new Card/addendum against the locked original | BUILT | `src/store/cardActions.ts:270-380`; `src/store/postOpAddendum.test.ts`; `src/shared/card/CardDetailBody.tsx:470-486`. Residual: no non-procedural RVG codes for a consult or ward review (finding 06.2) |
| B9 | ACC as ordinary contract-holder billing, flat-fee pre-op codes noted, review advisory on the Billable Party route | **PARTIAL** | `src/apps/admin/reviewFlags.ts:85`; `src/apps/admin/reviewFlags.test.ts:57`; `src/store/billingRun.test.ts:124`. `accRelated` has no write surface (finding 06.3) and the CS250/CS260/CS70 code set is neither modelled nor noted (finding 06.4) |
| B10 | Discretionary override (fixed / $ / %) with mandatory reason, visible in audit | BUILT **(self-checked)** | `src/domain/types.ts:433-437` (reason mandatory in every arm); `src/shared/flows/PriceOverrideSheet.tsx:55,93-96,106` (save disabled until a reason is typed); saved via `editProcedure`, so it audits through `mutate()` and surfaces in the Card History (`src/shared/card/HistorySheet.tsx:9-19`); `visual/shots/a-05-override.png`; phase-08 doc lists B10 |

### 7. Xero + payments simulation

| Req | Requirement | Status | Evidence |
|---|---|---|---|
| X1 | Simulated Xero surface showing the separate AR/banking instance: contacts and invoices | **PARTIAL** | `src/apps/demo/DemoXero.tsx:53-160`; `visual/shots/demo-xero.png`. The "separate instance, AR and banking only" framing X1 names is absent from the copy (finding 05.3) and the Xero records carry no InvoiceNumber or Reference field (finding 08.2) |
| X2 | Atomic ACCREC + DRAFT ACCPAY pair per invoice, linked by GUID via the case, similar numbers, idempotent retry | BUILT | `src/store/xeroHandoff.ts:207,234,242`; `src/store/xeroHandoff.test.ts`; `src/domain/types.ts:700-706`. Residuals: the BGTI label is unused (08.1) and the status word is never printed on a row (08.3) |
| X3 | Contact lifecycle: two resolution paths, hidden-ID workflow, NHI dedupe, outstanding-balance check, archived-contact handling, archive job, soft-limit rationale | BUILT | `src/store/xeroHandoff.ts:55-122`; `src/store/archiveActions.ts`, `archiveActions.test.ts` (four tests incl. a configurable window); `src/store/selectors.ts:280-291`; `visual/shots/demo-xero.png`, `p9-02-monitor.png` |
| X4 | Payment detection: webhook, daily reconciliation poll, pro-rata ACCPAY authorise, cumulative accumulation, no double-pay | BUILT | `src/store/paymentActions.ts:42-169`; `src/store/reconciliationPoll.ts:19-46`; `src/store/paymentActions.test.ts`, `payablesActions.test.ts` |
| X5 | Two-state money model plus a payables run, next-day rule | BUILT | `src/store/payablesActions.ts:55-140`; `src/store/payablesActions.test.ts:61,107`; `src/apps/admin/screens/BillingMonitorScreen.tsx:254-275` |

### 8. Integrations simulation

| Req | Requirement | Status | Evidence |
|---|---|---|---|
| I1 | HL7 v2 inbound SIU S12/S13/S14/S15, raw to FHIR to Card, configurable per-hospital mapping, mapping-driven extractor | **PARTIAL** | `src/domain/integrations/hl7.ts:60-105`, `feeds.ts:46-85`, `messages.ts:153-259`; `src/store/integrationActions.ts:137-220`; `src/domain/integrations/integrations.test.ts:50,58`; `visual/shots/phase11-simulator.png`. An S13 to a session the anaesthetist does not hold silently degrades to a time-only edit and reports processed (finding 09.6) |
| I2 | FHIR-native path, NZ profile fields visible, HPI on the Practitioner | BUILT | `src/domain/integrations/fhir.ts:196-238`; `src/domain/integrations/messages.ts:250-259`; `src/domain/integrations/integrations.test.ts:67,94,107`; `src/domain/seed/cast.ts:45-58` (HPI ids). Residual noted in the 09.1 verdict: `src/apps/demo/DemoIntegrations.tsx:51-55` hardcodes the rendered Practitioner to Souter |
| I3 | PDF ingestion with an extraction review screen and already-booked matching | BUILT | `src/apps/admin/screens/IntegrationMonitorScreen.tsx:205-334`; `src/domain/integrations/pdfSamples.ts`; `src/store/integrationActions.test.ts:244`; `visual/phase11.spec.ts:27-32` |
| I4 | Reliability and monitoring: statuses, triggerable failure, manual intervention, alerting, dedupe, auto-retry, locked-target path, dead letter | BUILT | `src/store/integrationActions.ts:41,226-328,490-503`; `src/store/integrationActions.test.ts:162,183,201,228`; `src/apps/admin/components/SideNav.tsx:36`. Residuals: the log ships empty (09.5) and no ACK is emitted (09.4) |
| I5 | NHI dual-format validator, simulated NHI lookup, NZHIS Level 4 ethnicity with quarantine and honest verdicts | BUILT | `src/domain/nhi.ts:74-118`; `src/domain/nzhis.ts:25-135`; `src/store/integrationActions.ts:389-418`; `src/apps/admin/screens/IntegrationMonitorScreen.tsx:400-430`; `visual/shots/phase11-monitor.png`, `m-06-manual.png`. Residual: the issuance-history narration is absent (finding 10.3) |

### 9. Non-functional

| Req | Requirement | Status | Evidence |
|---|---|---|---|
| N1 | Ease of use is the headline | BUILT | Convention 16 throughout `src/apps/mobile/`; `visual/shots/m-01-home.png`, `w-01-dashboard.png`; the money views are deliberately drill-down-free (`src/apps/mobile/screens/BalancesScreen.tsx:82-95`) |
| N2 | Colour-coded status language, consistent 1:1 with the legacy legend across all three apps | BUILT | `src/theme/statusColours.ts`; `src/domain/statusKeyParity.test.ts`; legends in `visual/shots/m-01-home.png`, `w-02-lists.png`, `a-01-day.png`. Note: colour is not a field of the List Status master (finding 03.2) |
| N3 | Every mutation writes an audit entry | BUILT | `src/store/mutate.ts:150-209` (throws on a meta-less write); `src/store/mutate.test.ts:77,91,116-140` proves by source scan that only `mutate.ts` writes domain slices. Residual: seeding is state, not mutation, so the cold-load trail is thin (finding 04.3) |
| N4 | Performance at seed scale, generator to 85, volume narrated not simulated | BUILT | `src/store/canvasRoll.test.ts:198` (85 x full horizon, about 23,000 Lists, invariants intact, under a 2s budget); `src/apps/demo/DemoXero.tsx:152-159` narrated counters decremented by the archive job |
| N5 | TypeScript strict, Vitest for billing maths, NHI and lifecycle guards, manual checklists for the rest | BUILT | `aa-prototype/tsconfig.app.json:20`; **488 tests across 43 files green** (`npx vitest run`, verified 2026-07-27); 11 Playwright specs and 76 committed shots under `aa-prototype/visual/` |
