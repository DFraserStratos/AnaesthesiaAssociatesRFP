# Review 05 - Card as billing anchor and the List approval state model

**RFP source:** `docs/rfp-reference/RFP.md` lines 824-938
**Reviewed:** 2026-07-27
**Lens:** demo-readiness (see `00-SUMMARY.md` for method)
**Note:** MISSING / PARTIAL claims in this file are unverified. `00-SUMMARY.md` carries the
adjudicated verdicts after the adversarial pass.

## Coverage table

| # | RFP feature or rule | Req ID | Status | Where in the app | Evidence |
|---|---|---|---|---|---|
| 1 | Generic process flow: the major components map onto mobile/web app, scheduling engine, Admin app, Billing engine, Xero (lines 843-855) | P2, P3, A5 | BUILT | Three apps behind the switcher plus demo surfaces; the billing monitor renders the flow as pipeline chips | `aa-prototype/src/apps/admin/screens/BillingMonitorScreen.tsx:27` docblock and `:173`-`:178` stage chips; shot `visual/shots/p9-02-monitor.png` shows "List authorised → Billing run → Invoices generated → Emailed / presented → Xero handoff" |
| 2 | The end-to-end narrative (hospital or surgeon's rooms → booking → capture → billing → anaesthetist paid) as an overview | N-A | N-A | RFP exposition, not a system feature; demonstrated as the guided S1 to S5 run, not as an in-app diagram | `aa-prototype/src/apps/demo/DemoControlPanel.tsx:383`-`:460` (S1 "Booking to theatre" through S3 "Money end-to-end"); `docs/demo-guide/03-demo-script.md:139`-`:160`; shot `visual/shots/demo-control.png` |
| 3 | Billing Engine as the centre, Xero as an AR/banking "add-on", a separate instance not used for general accounting (lines 833-837) | X1 | PARTIAL | Xero sim is downstream-only and clearly labelled, but the "separate instance · receivables and banking only · not the general ledger" framing is absent from the surface copy | `aa-prototype/src/apps/demo/DemoXero.tsx:56` subtitle; shot `visual/shots/demo-xero.png` (no AR/banking wording); see 05.3 |
| 4 | Invoices are "printed" and emailed from the billing engine, not from Xero; the GST "agent" relationship (lines 837-842) | B6 | BUILT | Invoice document rendered and delivered from the billing side; browser print; simulated email | `aa-prototype/src/apps/admin/screens/InvoiceDocument.tsx:19` docblock and `:130` "Billed by Anaesthesia Associates as agent for ..."; `aa-prototype/src/store/billingRun.ts:398` `markInvoiceEmailed`; shots `visual/shots/a8-04-emailed.png`, `visual/shots/a8-05-print-preview.png` |
| 5 | The Card is the entity from which all billing activity stems (line 858) | B1, D3 | BUILT | The run iterates the List's Cards; invoice building is per Card | `aa-prototype/src/store/billingRun.ts:1`-`:24` docblock; `aa-prototype/src/domain/billing/invoiceBuild.ts:256`-`:270` `buildInvoicesForCard`; test `billingRun.test.ts:107` "6 completed hospital-route cards yield 6 St George invoices" |
| 6 | Reference, don't absorb: billing records point at CardID / ProcedureID rather than duplicating Card data (lines 863-868) | D4, B6 | BUILT | `Invoice.cardId`, `InvoiceLine.procedureId`, `BillingCase.cardId`; billing lives in its own store slice | `aa-prototype/src/domain/types.ts:658`-`:672` (Invoice), `:674`-`:681` (InvoiceLine), `:693`-`:696` (BillingCase); `billingRun.ts:256`-`:262` writes only the `billing` slice plus the List's `billedAtISO` |
| 7 | Billing destination resolved per Procedure, not per Card (line 872) | B2, D4 | BUILT | `counterpartyForProcedure` per Procedure, with per-line funder override | `aa-prototype/src/domain/billing/invoiceBuild.ts:192`; tests `invoiceBuild.test.ts:184` "the insurer route bills the insurer; billable party defaults to the patient", `:274` funder-override allocation |
| 8 | Same-counterparty Procedures on a Card bill together on a single invoice (lines 875-877) | B6 | BUILT | Grouping by counterparty in first-appearance order inside one Card | `aa-prototype/src/domain/billing/invoiceBuild.ts:397`-`:427`; test `invoiceBuild.test.ts:225` "same-counterparty procedures share ONE invoice; the additional line is time-only"; test `billingRun.test.ts:244` |
| 9 | One Card, many invoices: different counterparties on one Card generate one invoice per counterparty; the model must not assume 1:1 (lines 878-884) | B6, §11 | BUILT | Seeded two-funder Card bills nib + St George's separately; the monitor states the per-Card invoice count | `aa-prototype/src/domain/seed/cards.ts:588`-`:618` (two-funder Card, nib line `funderOverride`); test `billingRun.test.ts:278` "two funders, as seeded ... expect(invoices).toHaveLength(2)"; `BillingMonitorScreen.tsx:271` "n invoices raised."; shot `visual/shots/a8-06-invoices-mixed.png` rows AA-2026-0003 (nib $152.38) and AA-2026-0004 (St George's $91.43) are the two halves of that one Card |
| 10 | The one-Card-many-invoices case is reachable on the guided demo path | B6 | PARTIAL | S3 stages Souter's Mon 20 **AM** List, whose split Card is same-counterparty (one invoice); the two-funder Card sits on the **PM** List | `aa-prototype/src/apps/demo/DemoControlPanel.tsx:423` stages `listIdForSlot(ANAE.souter, '2026-07-20', 'AM')`; `aa-prototype/src/domain/seed/cards.ts:516`-`:542` (AM split Card, both Procedures on the Forte hospital route); see 05.1 |
| 11 | Cards become immutable once locked (lines 887-890) | D3, D6 | BUILT | `editRefusal` refuses every actor on an AUTHORISED List; every Card/Procedure/BillingLine write path goes through it; List-level annotations (phone note, holiday conflict) remain possible by design, no Card write is | `aa-prototype/src/store/lifecycle.ts:48`-`:72`; call sites `lifecycle.ts:142,192,375,420,456,502`, `cardActions.ts:79,184,307,406`, `billingLineActions.ts:57,158,236,308`, `intake.ts:158`, `prepaymentActions.ts:196`; tests `lifecycle.test.ts:211` (office, anaesthetist and integration all refused), `cardActions.test.ts:130`, `captureActions.test.ts:225`, `phase06Actions.test.ts:110`; shot `visual/shots/a7-03-authorised.png` (lock icons per row, "Authorised · locked") |
| 12 | The lock is not bypassable from the UI or by the engine | N3, D3 | BUILT | `mutate.ts` is the only module that writes a domain slice (source-scan test); the billing run writes with `stampCardId: null`, so it never restamps a locked Card | `aa-prototype/src/store/mutate.test.ts:116`-`:136` `storeDiscipline`; `billingRun.ts:166`, `:239`, `:379` `stampCardId: null` with the "AUTHORISED Cards are locked" comment; test `billingRun.test.ts:143` "audits the whole run source=system and never stamps a locked card" |
| 13 | Step 1: the anaesthetist completes all Cards, then flags the List SUBMITTED (button label may read "Completed") (lines 893-895) | M2, D6 | BUILT | Mobile and web list footers; the button reads "Mark list completed" | `aa-prototype/src/apps/mobile/screens/ListDetailScreen.tsx:330`; `aa-prototype/src/shared/flows/SubmitListSheet.tsx:107`-`:119` ("Submit this list to the office?"); shots `visual/shots/m4-06-list-tick-enabled.png`, `visual/shots/m4-07-confirm-sheet.png`, `visual/shots/m4-08-submitted.png` |
| 14 | A List cannot be marked SUBMITTED unless all its Cards are correctly completed (lines 895-896) | D6, M5 | BUILT | `submitList` refuses `cardsNotCompleted`; completion itself is validation-gated; cancelled Cards excluded | `aa-prototype/src/store/lifecycle.ts:243`-`:250`, `:93`-`:127` `completionBlockersFor`; tests `lifecycle.test.ts:114` "blocks submission while any non-cancelled card is uncompleted, even when all validate", `:133` cancelled card does not block; shot `visual/shots/m4-09-blockers-sheet.png` ("Cards still to finish · Record the handover time.") |
| 15 | Step 2: the office sanity-checks the List, typically Contract, Insurer and reference completeness, across all Cards (lines 898-899) | A4 | PARTIAL | Review screen shows every Card with a Contract column and a "No billing reference" flag; Insurer appears only as the Route label and there is no per-Card drill-down from this screen | `aa-prototype/src/apps/admin/reviewFlags.ts:62`-`:116`; `aa-prototype/src/apps/admin/screens/ReviewScreen.tsx:205`-`:238` (columns Route / Contract / Flags); shot `visual/shots/a7-02-review.png`; see 05.2 |
| 16 | Step 3: the check is a review of the set of Cards, an office practice, not a system gate (line 900) | A4 | BUILT | Authorise is never blocked by open flags; a flagged Card still bills | `aa-prototype/src/apps/admin/screens/ReviewScreen.tsx:269` "flags open. Check or note them before authorising." with the Authorise button unconditionally enabled at `:281`; `authoriseList` has no flag guard (`lifecycle.ts:277`-`:307`); test `billingRun.test.ts:136` "the missing-billing-reference card bills anyway (an advisory, never a billing blocker)" |
| 17 | Step 4: when the office marks the List AUTHORISED it passes to the Billing Engine (lines 902, 906) | B1, A4 | BUILT | `authoriseList` emits `listAuthorised`; the run consumes the whole List | `aa-prototype/src/store/lifecycle.ts:305`; `aa-prototype/src/store/billingRun.ts:1`-`:24` + `wireBillingRun`; test `billingRun.test.ts:81` "wireBillingRun makes authorise raise invoices; a second run is refused (idempotence)"; UI copy `ReviewQueue.tsx:93` "Authorising a list hands it to the Billing Engine as a unit"; shots `visual/shots/a7-01-queue.png`, `visual/shots/a7-03-authorised.png` ("List authorised · locked for billing · 6 invoices raised by the billing run") |
| 18 | The List, not the Card, carries approval state (line 906) | D6 | BUILT | `state: ListState` on the List; Cards carry `completed` only | `aa-prototype/src/domain/types.ts:46` `ListState`, `:306` `state: ListState` on `List`; no state field on `Card` |
| 19 | DRAFT row: fully editable by the anaesthetist, also updatable by office and integrations | D3, D6 | BUILT | `editRefusal` allows anaesthetist (own List), office and integration on DRAFT | `aa-prototype/src/store/lifecycle.ts:52`-`:71`; test `lifecycle.test.ts:200` "integration edit of a SUBMITTED card is refused ...; DRAFT is allowed" |
| 20 | SUBMITTED row: editable only by office (OfficeAdmin) | D3, D6, A8 | BUILT | Anaesthetist refused `listSubmitted`; integration refused `integrationImmutable` and parked as a manual-intervention item; office allowed | `aa-prototype/src/store/lifecycle.ts:52`-`:69`; `aa-prototype/src/shared/card/CardDetailBody.tsx:186` mirrors the guard in the UI; tests `lifecycle.test.ts:184`, `:192`, `integrationActions.test.ts:162` "a message targeting a Card on a SUBMITTED List is NOT applied and parks as manual intervention"; shot `visual/shots/a-10-submitted-card.png` (office editing a Card on a SUBMITTED List) |
| 21 | AUTHORISED row: locked, immutable, passed to the Billing Engine as a unit | D6, B1 | BUILT | See rows 11, 12, 17 | `aa-prototype/src/store/lifecycle.ts:49`-`:51`; `aa-prototype/src/apps/admin/screens/ReviewScreen.tsx:286`-`:290` confirm copy "Authorising locks every Card on this List immutable (no further edits by anyone) and hands the List to the Billing Engine as a single unit" |
| 22 | Strictly ordered transitions, no DRAFT-to-AUTHORISED jump, no return channel to the anaesthetist | D6 | BUILT | `submitList` DRAFT-only, `authoriseList` SUBMITTED-only and office-only; issues resolved by phone note | `aa-prototype/src/store/lifecycle.ts:229`, `:281`, `:284`, `:322` `logListNote`; tests `lifecycle.test.ts:140`, `:156` "rejects authorising a non-SUBMITTED list (no DRAFT jump)", `:163` office only, `:573` "exposes NO return-to-anaesthetist / Returned transition anywhere" (module name scan) |
| 23 | Xero-status alignment, with SUBMITTED as the deliberate exception (line 936) | P9 | N-A | Naming rationale, not a feature; the vocabulary is used verbatim, and the Xero side runs DRAFT then AUTHORISED on the ACCPAY | `aa-prototype/src/domain/types.ts:46`; `aa-prototype/src/store/paymentActions.ts` ACCPAY DRAFT to AUTHORISED flip (test `paymentActions.test.ts`); shot `visual/shots/demo-xero.png` invoices tab |
| 24 | Immutability answer for late clinical corrections: post-op work runs as a new Card, the original stays locked (RFP tension, lines 887-890) | B8, §11 | BUILT | Post-op addendum card links to the locked original and runs its own submit-authorise-bill cycle | `aa-prototype/src/shared/card/CardDetailBody.tsx:470`-`:484` ("the original card stays locked and immutable (the RFP immutability answer)") and `:298`; `aa-prototype/src/store/postOpAddendum.test.ts` |

## Findings

### 05.1 - The one-Card-many-invoices case is not on the guided demo path  [PARTIAL]

- **RFP says:** "Where Procedures on a Card resolve to different counterparties (uncommon, but must be
  supported), the Card generates multiple invoices - one per distinct counterparty" ... "the
  relationship between Card and Invoice is properly one-to-many" (lines 878-884).
- **Built:** the rule is real and tested. `buildInvoicesForCard` groups a Card's tagged lines by
  counterparty (`aa-prototype/src/domain/billing/invoiceBuild.ts:397`-`:427`), the seed carries a
  two-funder Card on Souter's Mon 20 Jul **PM** List (`aa-prototype/src/domain/seed/cards.ts:588`-`:618`)
  that bills nib $132.50 and St George's $79.50 as two invoices
  (`billingRun.test.ts:278`), and the billing monitor prints the per-Card count, "2 invoices
  raised." (`aa-prototype/src/apps/admin/screens/BillingMonitorScreen.tsx:271`).
- **Gap:** the presenter path does not reach it. Scenario S3 submits
  `listIdForSlot(ANAE.souter, '2026-07-20', 'AM')`
  (`aa-prototype/src/apps/demo/DemoControlPanel.tsx:423`) and its panel text calls that the
  "split-billing List", but the AM List's split Card has both Procedures on the Forte hospital route
  (`aa-prototype/src/domain/seed/cards.ts:516`-`:542`), so it correctly produces **one** invoice.
  `docs/demo-guide/03-demo-script.md:151` then instructs the presenter to "Show the split-billing
  Card producing separate invoices where funders differ" on that staged List, which cannot happen
  there. Separately, the Invoices table has no Card column
  (`aa-prototype/src/apps/admin/screens/InvoicesScreen.tsx:115`), so even when the PM List is billed
  the two rows are not visibly attributed to one Card; only the billing monitor and the two invoice
  documents (same patient, different case references) show that.
- **Would a workshop audience notice:** yes, if the presenter follows the script - they would be told
  to point at two invoices that are not there. The recovery (authorise the Mon 20 PM List instead, or
  open the billing monitor) is easy but undocumented.
- **Severity:** notable

### 05.2 - The sanity-check screen covers reference completeness explicitly, Contract by column, Insurer only by route  [PARTIAL]

- **RFP says:** "The office performs a sanity check on the List - typically Contract, Insurer, and
  reference completeness - across all Cards within it" (lines 898-899).
- **Built:** `reviewFlagsForCard` (`aa-prototype/src/apps/admin/reviewFlags.ts:62`-`:116`) raises the
  RFP-grounded flags: not-completed, missing billing reference on the contract-holder route, the ACC
  advisory, pre-payment state and manual B/T/M override provenance. The review table shows Route and
  the resolved Contract name per Card (`ReviewScreen.tsx:221`-`:222`), so contract completeness is
  eyeballable and reads "None" when nothing resolves. Confirmed in
  `visual/shots/a7-02-review.png`.
- **Gap:** (a) there is no Insurer column or insurer-specific flag - the Insurer route shows only as
  "Insurer" in the Route cell, and which insurer (and whether it accepts direct claims) is enforced
  earlier by the mobile/web validator rather than surfaced here; (b) a genuinely unresolvable
  contract (an expired surgeon-, group- or organisation-held contract, which has no protected default)
  surfaces as a billing exception **after** authorisation in the billing monitor, not as a review flag
  before it (`visual/shots/p9-02-monitor.png`); (c) the screen is read-only - the per-Card actions are
  "History" and a list-level phone note, with no drill-down to the Card to fix a flagged field, so the
  fix path is Day view → List → Card (A2).
- **Would a workshop audience notice:** partly. The "check or note them before authorising" wording
  sets up a note, not a fix, so the read-only screen reads as deliberate; an office viewer may still
  ask "where do I correct it?" or "where does it show me the insurer?".
- **Severity:** cosmetic

### 05.3 - The Xero-as-add-on inversion is implemented but not stated on the Xero surface  [PARTIAL]

- **RFP says:** "it is probably more useful to think of the Billing Engine as the centre of the
  universe, and Xero as a Billing 'add-on' ... A separate instance of Xero will be established and its
  function is to provide an A/c Receivables and Banking Service to the billing engine. This instance
  of Xero will not be used for the general accounting work." (lines 833-837)
- **Built:** the behaviour is exactly the inverse model - invoices are numbered, rendered, printed and
  "emailed" from the billing side (`InvoiceDocument.tsx:19`, `billingRun.ts:398`), Xero receives only
  the ACCREC/ACCPAY pair, and the sim's own subtitle says "the simulated Xero organisation the Billing
  Engine hands off to ... the apps never read this, only the Billing Engine's own mirror"
  (`aa-prototype/src/apps/demo/DemoXero.tsx:56`). The demo guide narrates the framing
  (`docs/demo-guide/03-demo-script.md:152`-`:154`).
- **Gap:** no on-screen copy states the two load-bearing RFP facts - that this is a **separate** Xero
  instance and that it is **AR and banking only, not the general ledger**. `visual/shots/demo-xero.png`
  shows the callouts present (NHI, duplicate-invoice-number, archiving) and none of them carry it. The
  point then depends entirely on the presenter saying it.
- **Would a workshop audience notice:** only an accounting-minded viewer, and only as an unasked
  question ("is this their real Xero?"). One sentence would close it.
- **Severity:** cosmetic

### Checked and cleared (no finding raised)

- **Anaesthetist is told about the SUBMITTED lock.** The submit confirmation says "You will not be
  able to change these cards afterwards; the office makes any corrections"
  (`aa-prototype/src/shared/flows/SubmitListSheet.tsx:109`-`:111`), and the list footer becomes
  "Submitted to office" (`visual/shots/m4-08-submitted.png`). The Card screen itself carries no state
  banner, but the affordances are simply absent and the guard mirror is exact
  (`CardDetailBody.tsx:186`).
- **List-level writes on an AUTHORISED List.** `logListNote` (`lifecycle.ts:322`) and
  `addHospitalHoliday`'s conflict flags (`mastersActions.ts:358`-`:371`) can still annotate an
  AUTHORISED List. The RFP locks **Cards**, not the List record, and neither path touches a Card,
  Procedure or BillingLine - so this is not an immutability leak.
- **The billing engine writing to locked Cards.** Every billing mutation passes `stampCardId: null`,
  so a locked Card's `lastModifiedBy/At` is never restamped; the invoice/case records live in the
  `billing` slice (`billingRun.ts:166`, `:239`, `:379`; test `billingRun.test.ts:143`).
- **Grouping scope.** Grouping is per Card, not per List: six same-hospital Cards yield six invoices
  (`billingRun.test.ts:107`), matching the RFP's "grouping operation over the Procedures within a
  Card".

## Deliberate exclusions in this section

- **No "Returned" state.** `PROGRESS.md` convention 6 and REQUIREMENTS D6: the office fixes issues by
  phone, never returns the List. Enforced and even name-scanned in `lifecycle.test.ts:573`; the phone
  note (`logListNote`) is the recorded substitute. OUT-OF-SCOPE by decision, and it matches the RFP's
  own four-step process, which has no return step.
- **Authorisation is not gated on review flags.** REQUIREMENTS A4 ("per the RFP the check is an office
  practice, not a system gate") - deliberate, per RFP line 900.
- **Multi-user concurrency on a SUBMITTED List** (two sources editing the same Card) is out of scope
  per REQUIREMENTS §10 and named as a discovery item in §11; the prototype takes an audited
  last-write-wins stance.
- **Real Xero connection** (§10) - the ACCREC/ACCPAY handoff is simulated in-browser.

## RFP tensions in this section, and the choice made

| Tension | RFP lines | Resolution in the prototype | Decision ref |
|---|---|---|---|
| Split-billing invoice count: the grouping sections say same-counterparty Procedures are "billed together on a single invoice", while the Split Billing section says "two separate invoices must be generated" | 875-881 | Group by resolved counterparty; the two-invoice outcome arises because the additional Procedure has a different funder. Surfaced in UI copy: "Procedures billed to the same counterparty share one invoice per Card; where funders differ, separate invoices are raised ... This reading of the RFP split billing wording is held as a discovery question" (`InvoicesScreen.tsx:70`-`:75`) | REQUIREMENTS §11 "split-billing invoice count"; `invoiceBuild.ts:14`-`:16` |
| One route per Procedure vs one Procedure across two funders | 872-881 | Per-BillingLine `funderOverride` with a validator-checked conservation rule; office-side allocation | REQUIREMENTS D4, B5b, §11; `aa-prototype/src/shared/flows/FunderAllocationSheet.tsx` |
| Card immutability vs late clinical corrections (post-op charges) | 887-890 | A new Card/addendum linked to the locked original, running its own submit-authorise-bill cycle; stated in UI copy as "the RFP immutability answer" | REQUIREMENTS §11 "post-op charges vs locked Cards", B8; `CardDetailBody.tsx:470`-`:484` |
| Pre-payment collection vs the AUTHORISED billing trigger (a pre-day invoice on a List that is still DRAFT) | 887-902 with the pre-payment section | Pre-invoice raised before the procedure, balance billed at the run; refused once the List is AUTHORISED or billed; completion hard-gated with an audited office override | PROGRESS 2026-07-24 "Phase 09 - the FOUR open-question readings" (1); `prepaymentActions.ts:1`-`:22`, `:196` |
| "A List cannot be marked SUBMITTED unless all its Cards are correctly completed" (a system gate) vs "this check is ... not a system gate" for the office review | 895-900 | Both read literally: submission is completion-gated in the store, authorisation is not gated at all | PROGRESS 2026-07-22 "External plan review (Codex) - adopted rulings" item (1); REQUIREMENTS D6, A4 |
| The state table lets integrations update Cards while DRAFT but names only the office at SUBMITTED | 907-935 | Integrations lose write access at SUBMITTED; the message is not applied and parks as a manual-intervention item, losing nothing | REQUIREMENTS D3, I4; `lifecycle.ts:52`-`:58`; test `integrationActions.test.ts:162` |
| Billing-monitor location (Admin app vs a separate Billing Engine surface) | 843-855 | Inside the Admin Web App, stated in the screen's own copy | REQUIREMENTS §11 "billing-monitor location"; `BillingMonitorScreen.tsx:105`-`:108` |

## Beyond the RFP

- **`CompletionBlocker` list, not a boolean.** `completionBlockersFor` returns an ordered list of
  reasons so the submit sheet can name every outstanding Card and its specific failure
  (`lifecycle.ts:93`-`:127`; `visual/shots/m4-09-blockers-sheet.png`). The RFP only requires that
  submission be blocked.
- **Audited "Amend" (`uncompleteCard`).** A completed Card can be re-opened while the List is DRAFT
  (office also on SUBMITTED), and integrations can never take a completion back - the RFP describes
  completion but not its reversal (`lifecycle.ts:179`-`:214`).
- **Per-Card pipeline chips and a per-Card retry.** The monitor renders the RFP's process flow per
  authorised List, with a failed Card blocking only its own invoice
  (`BillingMonitorScreen.tsx:173`-`:178`; `visual/shots/p9-02-monitor.png`).
- **Grep-provable write discipline.** `storeDiscipline` scans the whole `src` tree to prove no module
  but `mutate.ts` (and the clock) writes state, which is what makes the immutability claim structural
  rather than per-call-site (`mutate.test.ts:116`-`:136`).
- **Idempotent billing run.** A second run on an already-billed List is refused, so a double
  authorise cannot double-invoice (`billingRun.test.ts:81`).
- **Phone note on the List** as the recorded stand-in for the RFP's "resolved by phone" practice,
  visible on the review screen and in the List's audit trail (`lifecycle.ts:322`;
  `visual/shots/a7-03-authorised.png` footer line).
