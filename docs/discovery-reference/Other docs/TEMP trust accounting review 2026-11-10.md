# TEMP: Trust accounting model and catalogue review

Working file, 10 November 2026. A summary of Greg's 28 October whiteboard walkthrough of how money
moves through AA's trust accounting in Xero, checked against the transcripts, followed by a
read-only review of every related item in the requirements catalogue. **Nothing in the catalogue has
been edited yet.** Delete this file once the findings are applied or filed.

All paths below are relative to the repo root. `REQ` = `requirements-board/requirements/`.

---

## 1. Sources

| What | Path | Where to look |
|---|---|---|
| 28 Oct afternoon transcript (main source), artifact AR-49 | `REQ/artifacts/files/AA Meeting with Greg 28th Oct B Reconciled Transcript.md` | L441-463 lead-in; L465-537 trust vs holding; L539-599 ordinary invoice walkthrough; L601-625 control accounts and sub-ledgers; L627-657 prepaid walkthrough; L731-769 holding-account wording; L803-851 section 6.5 and reconciliation before payment runs; L853-885 cancellation; L921-967 anaesthetist reports and BCTI; L975+ reconciliation notes |
| 23 Oct transcript (earlier, partly superseded) | `REQ/artifacts/files/AA Meeting with Greg 23rd Oct Reconciled Transcript.md` | L365-381 "only one trust, Xero is operating on the trust account"; L459-477 "every cent in the trust is allocated to a party" and the old draft-payable idea |
| 28 Oct morning transcript, artifact AR-48 | `REQ/artifacts/files/AA Meeting with Greg 28th Oct A Reconciled Transcript.md` | L851-861 prepayment held in a holding account |
| Catalogue note for 28 Oct | `REQ/notes/2026-10-28-aa-meeting-with-greg.md` | Points 8, 47-51, 62-73 (faithful to the transcript) |
| Catalogue note for 23 Oct | `REQ/notes/2026-10-23-aa-meeting-with-greg.md` | |
| Catalogue note for 19 Oct (first appearance of the holding account) | `REQ/notes/2026-10-19-aa-meeting-with-greg.md` | #4, #15 (cited by OQ-80) |
| Diagram "Where the money goes, prepaid or not" | `REQ/artifacts/AR-52.md`, `REQ/artifacts/files/AR-52.svg` | |
| Diagram "Billing to Xero to Payment Lifecycle" | `REQ/artifacts/AR-25.md` (+ its file) | |
| Domain model | `REQ/domain-model.md` | L21, L38, L53, L699-738, L765-770, L934-965, glossary ~L1016-1031 |
| Whiteboard photo | Donald's Photos library (not in repo) | Matches the transcript; worth adding as an artifact |

---

## 2. How it works

Everything sits inside **Xero** (the dotted box on the whiteboard). Four accounts matter:

| Account | What it is |
|---|---|
| **Trust (bank)** | AA's one real bank account. Every dollar from patients and payers lands here; every payment to an anaesthetist and every refund leaves from here. "There's only one trust. Xero is operating on the trust account." (23 Oct L369) |
| **Sales** | Records the work billed. |
| **Debtors (accounts receivable)** | A **control account** holding only the total owed *to* AA. Its **sub-ledger** has the detail: each patient, payer and contract holder (hospital, insurer) (28 Oct B L925). |
| **Control creditors (accounts payable)** | A control account holding the total AA *owes*. Its sub-ledger has each anaesthetist (Nick, Ben, Rod...) **plus the AA Holding account**. |

"Control account" and "sub-ledger" are the correct terms. Control accounts hold totals; sub-ledgers
hold the detail; each sub-ledger must equal its control account. Greg wants that demonstrated
**before every payment run**, together with the app's own ledger equalling Xero. If they don't
balance, stop (28 Oct B L603-607, L841-851).

### Scenario 1: ordinary invoice, $100, Dr Nick (28 Oct B L539-599)

1. **Invoice** to the patient: credit Sales 100, debit Debtors 100.
2. **Bill** (the payable to the anaesthetist): credit Creditors 100 under Nick. AA owes Nick only
   once the patient pays: "we never owe this until this is paid" (L573-577).
3. **Patient pays**: debit Trust 100, credit Debtors 100.
4. **Pay Nick**: debit Creditors 100, credit Trust 100. Everything nets to zero.

### Scenario 2: prepaid, $200, done by Dr Ben (28 Oct B L627-657)

1. **Invoice** before the procedure: credit Sales 200, debit Debtors 200.
2. **Paid**: debit Trust 200, credit Debtors 200. The payable goes to Creditors under **Holding**:
   "we now owe the anaesthetist 200, but we don't know which anaesthetist, so we're going to stick
   it in there" (L631-637).
3. **Transfer** once the procedure is done: debit Holding 200, credit Ben 200. "That's an accounting
   move." Not a payment, not a new invoice to the patient (L645-653).
4. **Pay Ben** in the normal payment run.

### Points Greg stressed

- **Don't confuse the holding account with the trust account** (L467). The AA Holding account is not
  a bank account and not a chart-of-accounts ledger. It is a creditor, "a fake anaesthetist" that
  receives and transfers but "never actually gets paid itself" (L467-475). Accountants have holding
  accounts "all over the place", so wording should be "an accounts payable holding account"
  (L805-815). The app's ledger may treat it as an anaesthetist: "It doesn't know" (L823).
- A prepaid booking moved to another anaesthetist changes nothing in the ledger: the payable is
  Holding, which does not move; nothing is recalculated (L765-769, L887-893).
- Cancellation: unpaid, a credit note nullifies it; paid, a full refund from Holding, a normal
  refund transaction, automatically as part of cancelling the booking (L853-881).
- Money leaves Holding only through the system: "Otherwise, the balance breaks" (L839-841).
- None of it is "handled centrally by the office": "It's just automated" (L759).
- Prepaid contracts are not editable; exceptions by hand-raised invoice or credit note (L773-779).
- Anaesthetist reports read the engine's ledger; the outstanding list should click through to the
  booking (L929-939); the GST report lists payments AA made to the anaesthetist; AA generates the
  BCTIs, possibly one per weekly run (L951-967).

### Superseded thinking

- 19 Oct: the holding account first appears (OQ-80's answer cites Notes 2026-10-19 #4, #15).
- 23 Oct: talk reverted to a *draft payable to the anaesthetist, reassigned if the anaesthetist
  changes* (L467-475), and Greg called it "AA prepayments... like a debtor" (L375-381).
- 28 Oct: confirmed as the **AA Holding creditor plus a journal transfer**. This is current.

### Caveats on the evidence

- "Expect the Xero automation to do, it'll just do it" (28 Oct B L735) is attributed to Greg but runs
  on from Donald's line; the speaker is uncertain. Greg's firm quote is L759.
- "The second pair is the buyer-generated tax invoice" (L959-963): Donald asked which pair and the
  answer was unclear. It could be the bill (scenario 1, step 2) or the transfer. The safe reading:
  the BCTI is the payable to a named anaesthetist.
- Greg mirrored the app's ledger against Xero "by patient" (L847). "By anaesthetist" is an
  extension, though a reasonable one.
- Greg swapped the AR and AP labels while talking (L549); the transcript keeps the slip.

---

## 3. Questions for Greg or the accountant

1. **When is the payable to the AA Holding account created?** The catalogue (OQ-80) and AR-52
   prepaid step 2 create it when the prepayment invoice is raised. On the whiteboard Greg records it
   only after payment (L637). If at invoice, US-06.5.1's "its balance is all the deposits received"
   is wrong, because unpaid invoices would be counted too.
2. **What exactly is the BCTI, and how many?** Which entry Greg meant by "the second pair" is
   unclear; one per procedure or one per weekly run is open (OQ-29). The AA fee examples in FT-10.3,
   US-10.3.1 and US-10.3.3 ($500 + $5 x 40) assume one per procedure.
3. **What releases a prepayment to the anaesthetist** is still open (OQ-125), but
   `REQ/domain-model.md` L38 states "when the List is authorised" as settled.

---

## 4. Missing from the catalogue

| Gap | Suggested home |
|---|---|
| **Balance check before every payment run**: each sub-ledger equals its control account and the app ledger equals Xero (by payer and by anaesthetist, Holding included); stop the run if not. Partly a manual control ("the accountant or Vanessa has to demonstrate", L851); the app supplies the totals and blocks the run. In no story and not in the domain model; only in the note (#64), OQ-47 and OQ-111. | New story under FT-10.2 or FT-13.2; domain model |
| **The Holding payable is never authorised for a payment run**; it leaves only by transfer or refund. | Exception in EP-10, FT-10.2, US-10.2.1, US-09.2.1; acceptance criterion in US-06.5.1 |
| Xero: anaesthetists and the AA Holding account set up as **creditor contacts** (FT-09.3 covers patients only). | EP-09 |
| Xero: **posting the Holding-to-anaesthetist journal transfer**. | EP-09 |
| Xero: **posting a cancellation** (credit note if unpaid, refund out of trust if paid, automatic on cancel). | EP-09 |
| **One trust bank account** that Xero operates on, every receipt in and payment or refund out. | EP-09 or EP-10 |
| **AA owes the anaesthetist only what has been paid** (L577). | EP-08 (US-08.3.5 lists owed / collected / paid out but not this rule) |
| Holding as a row in the per-anaesthetist ledger (only US-06.5.1 says so). | US-08.3.4, US-08.3.5 |
| Prepaid step 4 (paid in the ordinary weekly run, US-10.2.7) not stated in any live EP-06 item. | US-06.5.1 |
| Acceptance criteria for the transfer itself (automatic on release, prepaid amount, journal from Holding, no Xero payment). | US-06.4.1, US-06.5.1 |
| US-06.5.2 doesn't say the cash refund leaves the trust bank account. | US-06.5.2 |
| No live story says AA generates the BCTI, or when; nothing on the BCTI for a prepaid procedure. | EP-08 / EP-09 / EP-12, after question 2 |
| Which Xero organisation holds AA's own fee invoices: the fee goes to a non-trust bank account (OQ-60) but FT-09.4 says the organisation is trust-only. | OQ-60 |
| Domain model has no passage on the anaesthetist's outstanding list (US-12.2.1 has the click-through). | domain model |
| `domain-model.md` L699 "total patients owe equals the total owed to anaesthetists" should add "and the AA Holding account". | domain model |

---

## 5. Wording fixes

### Recurring themes

| Problem | Items |
|---|---|
| The transfer called a "payment" or a "second pair", when it is a journal move between two creditors | US-06.4.1 ("The anaesthetist's payment is the transfer"), FT-06.3 ("paid later by a transfer"), US-06.5.1, US-06.3.1, FT-08.3 ("a second pair moves it to them"), US-09.1.3 ("a second pair, from the holding account"), US-01.4.6 L23, L29 ("paid from it at settlement"), OQ-80 answer |
| The Holding account "holds the money", when the cash is in the trust account and Holding is only owed it | EP-06 ("holds the money in the AA Holding account"), US-06.5.1 ("collected into the holding account"), FT-08.3 ("AA holds it there"), US-08.3.1 ("where AA holds the money") |
| Paying a receivable releases or authorises the matching payable: wrong for a prepayment | EP-10, FT-10.2, US-10.2.1, US-09.2.1, US-10.1.2 ("two states on every ledger pair") |
| Xero described as receivables and banking only, leaving out payables | EP-09, US-09.4.1, US-08.3.2, `domain-model.md` L21 |
| "AA's account" where it should say the trust account | EP-10 ("lands in the AA account first"), FT-12.2, US-12.1.4, AR-25 |

### Individual fixes

| Item | Phrase | Fix |
|---|---|---|
| US-08.3.1 | "neither can be created, paid or reversed without the other" | Limit to "created or reversed"; the halves are paid at different times |
| US-08.6.5 (and US-08.6.2, US-08.6.4) | "reversal of the linked payable to the anaesthetist" | "reverses the linked payable, to the AA Holding account or the anaesthetist, wherever it sits" |
| US-09.1.3 | "so the trust account in Xero balances" | "so the creditors sub-ledger still equals its control account" |
| EP-09 | "mirrors an ACCREC and a draft ACCPAY" | List the pair, the journal transfer, credit notes, refunds and payment runs |
| EP-08 | "This internal ledger, not Xero, is the system of record" | Add that it mirrors Xero and must balance with it |
| US-06.5.2 AC | "whichever anaesthetist held it" | "whichever anaesthetist the Booking was with" |
| US-10.2.5 Notes | "that money is still in trust" | "the payable still sits with the AA Holding account" (all money is always in trust) |
| US-09.1.4 | "since renamed by IRD", "pending OQ-29" in the description | Move to Notes (VOICE.md) |
| US-12.1.4 | "from AA's account to the anaesthetist once their receivable is paid" | "from AA's trust account ... once the payer has paid" |
| US-13.2.1 L33, L39 | "what is owing to them, and what they owe" | "what AA owes them, and anything they owe AA" |
| US-12.2.2 image caption | "for the GST period" | Conflicts with "There is no GST period" (domain model L53) |
| `domain-model.md` L38 | "when the List is authorised (the engine acts only then)" | Add OQ-125 and mark as our reading |
| `domain-model.md` L935-936, glossary ~L1030 | "sits in AA's trust account ... until the procedure is done" | "until the anaesthetist is paid" |
| `domain-model.md` L717, ~L1031 | sub-ledgers "(patients; ...)" | "payers and Contract holders" |
| `domain-model.md` L53, L770 | part-payment / repayment plan sentence in the GST report | Delete (Greg, L951; US-12.2.2 already dropped it) |

---

## 6. Diagrams

**AR-52** (`REQ/artifacts/AR-52.md`, `REQ/artifacts/files/AR-52.svg`): mostly right.
- Prepaid step 2 shows "AA Holding +$200" when the invoice is approved, before any money comes in.
  Depends on question 1: move the chip to step 3, or mark it draft until paid.
- The debtors sub-ledger lists only patients and a guardian; add contract holders (hospitals,
  insurers). Greg's Sales account is missing (optional).
- Five steps per flow against the whiteboard's four (step 1 changes nothing in the books); region
  notes could map them to Greg's four.

**AR-25** (`REQ/artifacts/AR-25.md`): needs a revision.
- No prepaid branch: the ACCPAY always goes to the anaesthetist; no Holding account, no transfer.
- Region `generate-send` says invoices are "never sent from Xero"; who sends is a build decision
  (note 28 Oct #50, domain model L731).
- "Paid into AA's account" should say trust account.
- "DRAFT · buyer-created tax invoice" per ACCPAY is shown as settled; OQ-29 is open.
- No balance check before the payables run ("Fri: ledger closed and reconciled" is not "if they
  don't balance, stop").
- Dated 8 Oct, sourced to 14 Oct only.

---

## 7. Open questions

| Question | State |
|---|---|
| OQ-125 release trigger | Still open; 28 Oct says only "once the procedure is done" |
| OQ-29 BCTI | Partly answered: Greg's view is that the BCTI is the payable (L959). How many, the agency treatment and the BCTI's new IRD name remain for the accountant |
| OQ-47 accountant and weekly cycle | The balance check should come out of it as a story; the weekly cycle is still open |
| OQ-60, OQ-112 | Not answered; OQ-60 now also depends on the BCTI-per-run choice |
| OQ-97 part credit of a prepayment | Still open |
| OQ-120 does the invoice name the anaesthetist | Still open (deferred, L897) |
| OQ-73, OQ-134 | Still open; don't affect the accounting model |
| OQ-40 (answered) | Still has "held in the trust account as a pending payment" and "draft payable pair is repointed"; add a pointer to OQ-80 and the 28 Oct note |
| OQ-42 (answered) | Still has one BCTI per invoice; add a superseded pointer |
| OQ-111 (answered) | Stale "Still to answer" section; reconcile with OQ-115: the system instructs, Xero executes, no manual entries in Xero |
| OQ-80 (answered) | "a second pair moves it ... in place of another invoice to the patient" was overtaken on 28 Oct by the journal transfer (L835-837); L637 reopens when the Holding payable is created |
| OQ-115, OQ-70, OQ-03, OQ-21, OQ-96, OQ-104, OQ-116, OQ-119, OQ-71 | Consistent with the model |

---

## 8. Checked and fine

- **EP-06**: FT-06.2, FT-06.5 (the best statement of the model), US-06.2.1, US-06.2.2, US-06.2.6,
  US-06.3.2, US-06.3.4 to US-06.3.7, US-06.5.3, US-06.5.4.
- **EP-08**: FT-08.1, FT-08.2, FT-08.4 to FT-08.6, US-08.2.1 to US-08.2.3, US-08.3.3, US-08.3.4,
  US-08.4.1 to US-08.4.6, US-08.5.1, US-08.5.2, US-08.6.1, US-08.6.3, US-08.6.6.
- **EP-09 / EP-10**: FT-09.1, US-09.1.1, FT-09.2, US-09.2.2 to US-09.2.4, FT-09.3, US-09.3.1,
  US-09.3.3, US-09.3.4, FT-09.4, US-09.4.2, FT-10.1, US-10.1.1, US-10.2.3, US-10.2.4, US-10.2.6,
  US-10.2.7 (apart from the balance check gap), US-10.3.2.
- **Other epics**: US-01.4.7, US-02.5.3, US-03.1.5, US-03.7.2, US-03.7.3, US-04.2.11, US-04.3.7,
  US-05.2.5, US-05.3.5, US-11.1.1, US-11.2.2, US-11.3.1, US-11.4.1, US-12.2.1, US-12.2.3,
  US-13.2.2, US-13.5.2, US-13.7.4, US-15.0.6, EP-04, EP-11, EP-13, FT-03.7, FT-07.2, FT-11.2,
  FT-13.2.
- **Note 2026-10-28**: faithful. Two small omissions: "we never owe this until this is paid" (L573)
  isn't quoted, and the AR/AP label slip (L549) isn't noted.

---

## 9. Next steps

1. Put questions 1 to 3 (section 3) to Greg or the accountant; add 1 and 2 as open questions.
2. Apply the wording fixes (section 5) and write the missing stories (section 4), following
   `REQ/VOICE.md`; run `npm run check`.
3. Revise AR-25; fix AR-52 once question 1 is answered.
4. Add superseded pointers to OQ-40, OQ-42, OQ-111 and OQ-80.
5. Register the whiteboard photo as an artifact (`add-artifact` skill) and link it from AR-52 and
   US-06.5.1.
