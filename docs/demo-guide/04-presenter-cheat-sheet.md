# Presenter Cheat Sheet

## The 30-second explanation

> Anaesthesia Associates coordinates bookings and billing for about 85 independent anaesthetists.
> The system maintains a rolling AM/PM schedule, keeps patient Bookings current, lets anaesthetists
> capture BTM billing data, lets the office check and authorise completed Lists, then calculates and
> issues invoices. Xero is used for receivables and banking, while the Billing Engine remains the
> system that translates financial events back into each anaesthetist's view.

## The five nouns to remember

| Term | Meaning |
|---|---|
| Schedule | The rolling four-month calendar |
| List | One anaesthetist's half-day AM or PM operating session; every List has exactly one hospital and one surgeon (AA rooms is a location) |
| Draft List | A List with no anaesthetist yet, state DRAFT; the office assigns it |
| Booking | One patient appointment inside a List |
| Procedure | One clinical procedure inside a Booking; each resolves its own billing route |
| BTM | Base units + Time units + Modifier units |

## Terms not to use

| Avoid | Use instead | Why |
|---|---|---|
| SSA | Anaesthetist | SSA does not appear in the RFP |
| Shift | List or AM/PM session | List is the RFP's scheduling unit |
| Claim/sign up for a shift | Move your own List to a colleague's free session or back to the office, at once; office reassigns the List | Self-service claiming is not specified |
| Delete Booking | Soft-cancel Booking | History and audit must be retained |
| Send back to anaesthetist | Resolve by phone; office corrects | There is no Returned state |
| Surgeon TBC List | Draft List | A List with no anaesthetist yet has a name and a state |
| Slot | Session (AM or PM) | The app never says slot |
| Blacklist | Not preferred | The pairing warns and never blocks |
| Open or DRAFT for an assigned List | Active | DRAFT is only for a Draft List |
| A List being prepared (for a Draft List) | Draft List | One name for it |
| Xero calculates the invoice | Billing Engine calculates/issues; Xero provides AR/banking | The RFP explicitly puts the Billing Engine at the centre |
| ACC route | Contract-holder route with ACC-related context | ACC is not a separate billing route |

## The lifecycle

```text
ACTIVE -> SUBMITTED -> AUTHORISED -> Billing run completed
```

- `ACTIVE`: anaesthetist, office and integrations may update.
- `SUBMITTED`: the office reviews and corrects; the anaesthetist sees it less prominent ("Done ·
  unbilled") and can still change it until it is authorised. The last change stands, and Review
  shows "Changed since submitted".
- `AUTHORISED`: Bookings are locked; the whole List hands to billing. The List leaves the
  anaesthetist's main view at once, its invoices show in their balances at once, and search finds it.
- Billing-run completion: the prototype stamps `billedAt` for the office's billing monitor; it no
  longer decides what the anaesthetist sees.
- There is no `RETURNED` state.
- `DRAFT` means a Draft List with no anaesthetist yet (catch-up Phase 31); an assigned List is never DRAFT.

## Permission matrix

| Action | Anaesthetist | Office | System/integration |
|---|---:|---:|---:|
| View own Lists/Bookings | Yes | Yes, all | As needed |
| View colleague patient details | No | Yes | As needed |
| Edit a Booking on an `ACTIVE` List | Yes, own | Yes | Yes |
| Edit a `SUBMITTED` Booking | Yes, own, until authorised | Yes | No, park for intervention |
| Edit an `AUTHORISED` Booking | No | No | No |
| Submit a List | Yes, own | No; office receives it after submission | No |
| Authorise a List | No | Yes | No |
| Reassign a whole List | No | Yes | No |
| Edit master data | No | Yes | No |
| Monitor billing/integrations | No | Yes | Automated events write status |

## The billing rules most likely to be questioned

### Fee calculation

```text
Fee = (Base + Time + Modifier units) x anaesthetist's own dollar value per unit
```

- The anaesthetist Booking shows no units or fee, only Mark complete; Admin Bookings retain the full
  billing view.
- **Reset → Confirm reset** in the shared top bar restores the pristine data and clock from any app
  while keeping the current app.
- Time: 1 unit per 15 minutes for the first two hours.
- Time after two hours: 1 unit per 10 minutes.
- Each anaesthetist has an independent dollar value per unit.
- The anaesthetist selects the RVG code; the system does not automatically infer it.
- Some RVG codes are ranges and require professional judgement.
- Positioning cannot be charged again if the base code already includes it.
- The RFP does not define partial-interval rounding; the prototype rounds up per started interval as
  a discovery assumption.

### Three billing routes

1. Hospital or other contract holder
2. Billable Party, usually the patient
3. Direct-claim Insurer

The route is explicit per Procedure. It is not inferred from flags.

### Patient insurance distinction

- **Direct Insurer route:** AA invoices the one insurer that accepts direct claims.
- **Insured reimbursement:** AA invoices the patient; the patient seeks reimbursement from their
  insurer.

Do not treat these as the same workflow.

### Split billing

- A second/additional Procedure in the same episode (**Add another procedure**) is time-only; Brian Holt
  on Dr Souter's Mon 20 AM List (the S3 split Booking) shows it.
- Base and Modifiers cannot be charged again.
- One Procedure may allocate conserved lines across two funders.
- The prototype groups lines by counterparty; different funders create separate invoices.

### Contracts

- Type 1: reference only; standard anaesthetist rate.
- Type 2: agreed rate or discount.
- Type 3: fixed price.
- Every hospital and direct-billing insurer must have a protected default Type 1.
- Surgeon/group/organisation-held contracts do not have that guaranteed fallback in the prototype.

## The money model

```text
Payer -> ACCREC -> AA account -> ACCPAY (full amount) -> Anaesthetist
```

- `ACCREC`: money AA is collecting.
- `ACCPAY`: the full amount AA owes the anaesthetist; it equals the ACCREC. AA's own fee is never
  deducted from it (it is invoiced to the anaesthetist separately).
- Paid into AA and disbursed to the anaesthetist are separate states.
- A partial payment releases the payable for exactly the amount received; the rest stays outstanding.
- Both Xero records carry the InvoiceNumber (the ACCPAY's ends `-P`) and the case Reference.
- The mobile/web app reads the Billing Engine's mirror, never Xero directly.
- Outstanding balances are flat individual payable rows, not a Booking-level rollup and not amounts the
  anaesthetist personally owes.

### AA's monthly fee

```text
Month end: fee settings + BCTIs paid that month -> AA-FEE invoice (ACCREC) -> Anaesthetist pays AA's own account; never netted
```

- Admin → Billing monitor → **Open AA fee invoices**: Fee settings (fixed items plus a charge per BCTI)
  and **Run monthly fee invoices** (one AA-FEE invoice per active anaesthetist per month).
- Seeded sample: $350.00 + $150.00 fixed, $5.00 per BCTI. "Seed a month of BCTIs" then the run gives Dr
  Rutherford $500 + $5 x 40 = $700.00 before GST, $805.00 with GST.
- Caveat: the fixed schedule, the paid-only count and BCTI granularity (per invoice or per procedure) are
  with AA's accountant; amounts are held ex GST, with GST at the foot of the fee invoice.

## What each app is for

### Anaesthetist Mobile

- Procedure-day Lists and Bookings
- A main view from today with earlier un-authorised Lists, and past work by patient name, NHI or date
- BTM capture
- Complete Booking and submit List
- Add a missing Booking
- Photo of the booking card: Future Work (Demo actions, badged)
- Availability and cover: mark days off ahead, repeating days off, change or delete one occurrence
  (My calendar, a bottom sheet)
- Move a List to a colleague or the office; hand one Booking to a free colleague (Move to a colleague)
- Later: balances

### Anaesthetist Web

- Wider dashboard and date ranges
- A main view from today with earlier un-authorised Lists, and past work by patient name, NHI or date
- Same List/Booking detail and capture functions
- Availability and cover: mark days off ahead, repeating days off, change or delete one occurrence
  (My availability, the same form as the phone)
- Move a List to a colleague or the office; hand one Booking to a free colleague (Move to a colleague)
- Accounts and GST activity

### Admin Web

- Whole-day operational control
- Phone/manual changes
- Move one Booking
- Reassign a whole List
- Draft Lists: Lists with no anaesthetist yet, soonest first; assign one from a grouped, tier-ordered picker
- Correct billing setup
- Review and authorise
- Master data and audit
- Surgeon profiles: the HPI CPN is each surgeon's unique index (not the patient's NHI), each surgeon
  sits in one surgeons' room with its contact email and phone, and surgeons can belong to groups
- Pairing preferences and priority tiers: kept on both the surgeon profile and the anaesthetist
  record, admin only; a not-preferred pairing warns and never blocks; cover suggestions run in tier
  order, shuffled within a tier; seeded: Ms A. Reid prefers not to work with Dr Sharma, and Mr J.
  Whitford prefers to work with Dr Sharma
- Sessions and Lists: every active anaesthetist has an AM and a PM session a day from their start date
  over a configurable horizon (four months); the status is on the session, Free by default, and a List
  put into it shows in its place; default session times are one setting, sessions can have their own
- Find available (Day header): office only; the free anaesthetists for a session in tier order,
  shuffled within a tier, with not-preferred pairings apart once a surgeon is chosen; picking one opens
  Assign List
- Availability statuses (Master data): rename, recolour or add a status and every app follows; rules
  read the status's ID; it is availability only, never a List's state (Active, Submitted or
  Authorised, or Draft for a Draft List)
- The app never says "slot": it says session, AM or PM
- Later: billing and integration monitoring

## Strong phrases to use

- "The List is the unit of availability and approval."
- "Every session exists even when there is no activity; a List shows in its place when assigned."
- "The status lives on the session; the List, its hospital, surgeon and Bookings are put into it."
- "The office handles exceptions; the system removes repetitive work."
- "The Billing Engine references the Booking; it does not duplicate the scheduling record."
- "The captured inputs remain reproducible, not just the final total."
- "AA tracks collection and disbursement as two separate states."
- "This is a candidate design we would validate during discovery."

## Statements to avoid

- "Anaesthetists pick up open shifts."
- "The app automatically chooses the clinical RVG code."
- "ACC has its own billing route."
- "Every insured patient is billed to an insurer."
- "Authorisation means the patient has paid."
- "Xero is the source for the mobile balance view."
- "The prototype is connected to live hospital, Xero, NHI, email or OCR services."
- "This workflow is final" when the RFP explicitly leaves it open.

## Prototype readiness

Snapshot date: **24 July 2026**. Phases 00 to 12 are built and clickable. Phase 13, a subtle
mobile atmospheric background, is the only remaining phase and is purely visual.

### Built and clickable

- Mobile Lists, Bookings, BTM, completion and submission
- Web dashboard, Lists, availability and accounts views
- Admin day view, changes, cover, review, authorisation, masters and audit
- Draft Lists, including recurring clashes
- Billing run and invoice documents (Phase 08)
- The anaesthetist's edit window to `AUTHORISED`, the main view from today, and search by patient
  name, NHI or date over months of history (catch-up Phase 38a)
- Pre-payment, post-op addendum and billing monitor with per-booking isolation and retry (Phase 09)
- Xero collection/payable pairs, payments, reconciliation poll, payables, live balances and GST (Phase 10)
- HL7/FHIR/PDF ingestion, integration monitor, mapping fix and dedupe (Phase 11)
- The demo control panel with S1 to S5 scenario jumps (Phase 12), now the index of the per-screen
  Demo actions (catch-up Phase 14)

### Present but honestly demo-only (keep the badge in view)

- The Xero simulator, integration simulator and the control panel are labelled "demo simulation":
  they simulate external systems and are not proposed end-user product screens.
- The billing monitor itself is proposed product UI; only its simulation triggers are badged.
- **Demo actions** (the pill in the top bar, beside the app switcher) holds the simulated events for
  the screen you are on, each badged "Demo trigger". It appears only on screens that have one. The
  control panel is now the index of them, with an **Open screen** link per entry (catch-up Phase 14).
- On a handset, the amber **Demo** chip opens the same actions as a sheet. Its **Office authorises
  this List** is badged "Office stand-in": the phone has no Admin app, so it plays the office for one
  submitted List. On Lists, **Office assigns a List to my next free session** (also an office
  stand-in) assigns a List to Dr Souter's earliest free session, which then shows as a booked List.
  On Availability, **Colleague moves a List into my free session** (badged "Colleague stand-in")
  plays a colleague handing one of their Lists on to her, so the Moved to you notice shows. On Lists,
  **Colleague moves a Booking to me** (also "Colleague stand-in", with a choice per candidate) plays a
  colleague handing her one Booking as a new List in a session she is free in; a session she is not
  available in is offered only after she sets it available in My calendar (her acceptance).
- On **Admin Day** and **Notifications**, **Demo actions → Colleague moves a List to the office**
  stages another anaesthetist's own return (One move), or **A busy morning (8 moves)** to show the
  Notifications page paging. Nothing waits for the office, so there is no office stand-in for it.
- On **Admin Day**, **Demo actions → Colleague hands a Booking to Dr Souter** (catch-up Phase 32a):
  a colleague moves one of their Bookings into her free session as a new List, with the office notice
  ticked, so the new List and the pool row show without switching persona. The move itself is plain
  product use: **Move to a colleague** on any of her Bookings (S2 Beat 3d).
- On **Admin Day** and **Conflicts**, **Demo actions → Simulate sickness** (catch-up Phase 32b) records
  a phoned-in sickness as the office: pick a List "to the office" or "to Dr X" and the List goes there
  in the same step, never a conflict.
- In the Admin **Assign Draft List** and **Reassign** pickers, each colleague marked unavailable shows
  read only with **Ask Dr X to make this session available** (badged "Colleague stand-in"): it plays
  that anaesthetist freeing the session, so the row becomes assignable. On a handset List or Booking,
  **Office resolves this alert** (badged "Office stand-in") plays the office ticking her alert.
  **Alert the office**, the tick and **Show resolved** are product actions, not demo actions.
- **Future scope** badges (grey, telescope icon) mark the HL7 v2 and FHIR tooling: the Integrations
  simulator, the Admin Integrations Messages and Feed config tabs, and the hospital-message demo
  actions. Say so plainly: in scope today is the St George's and Southern Cross download into a
  matching screen, which a later build shows.
- **Play the office** (PWA More tab) is off by default and badged "Simulated office" while on. It
  auto-authorises every submitted List and is a scaffold, not the proposed flow: use **Office
  authorises this List** instead.
- Optional Admin Audit aside: **Demo actions → Simulate sign-in attempts** adds five audited rows
  (account provisioned with no admin access to credentials, Admin sign-in with MFA, a failed attempt,
  a self-service password reset, an Apple social-login sign-in on mobile). Set Entity type to
  **account** to see them together. The identity service (Auth0 or Entra External ID) is simulated.

### Still upcoming

- Phase 13 adds one brand-derived atmospheric gradient behind the in-phone mobile canvas, plus a
  clearly badged tuning lab in the grey area outside the phone. It changes nothing in the workflows,
  data, web or admin apps.

## RFP ambiguities: present as discovery decisions

### 1. NHI in Xero (settled)

- One RFP section said NHI could be a searchable Xero contact cross-reference; Appendix 2 said NHI
  never leaves the practice system.
- Confirmed with AA: no NHI or other personal information in Xero, patient names included. Patient and
  guardian contacts are named only by their hidden internal ID.

Say:

> AA confirmed the rule: Xero holds no NHI and no patient name, only a hidden ID that links each
> transaction back to the billing system.

### 2. Exact List disappearance trigger (answered)

- A List leaves the anaesthetist's main view when the office authorises it (OQ-31, 16 October), not
  at submit, not when billed, not on payment.
- Its invoices show in their balances at once (Xero returns the ID straight away).
- Older work is found by search on patient name, NHI or date; there is no calendar archive.

### 3. Billing failure isolation

- The RFP asks whether one failed Booking blocks the whole List.
- The prototype isolates the failed Booking and bills the others, then supports resolve-and-retry.

### 4. Monitoring location

- The RFP leaves Admin Web versus a separate Billing Engine screen open.
- The prototype places monitoring in Admin Web.

### 5. List reassignment mechanics

- Settled by US-01.4.1: the List moves into the colleague's free session, keeping its id, Bookings and
  history; nothing about billing is recalculated.
- Answered (D60, OQ-84): whoever moves a List, the anaesthetist or the office, chooses what the
  vacated session becomes, Free or Unavailable, on every path; Free is chosen first, and when the move
  comes from marking the session unavailable, that status is chosen first.
- Answered (D7, OQ-39): an anaesthetist moves her own List at once, back to the office (a Draft List)
  or into a colleague's free session. Nobody accepts and the office does not confirm.
- Answered (D15, OQ-65): every such move posts to one shared notification pool in the Admin App, the
  same for every admin, separate from the to-do list.
- Answered (D58, OQ-79): notices are active or resolved. An admin ticks one (the same tick as a to-do's
  Clear) and it is hidden for the whole office; **Show resolved** brings it back with who and when;
  nothing expires. An anaesthetist's **Alert the office** with a note joins the pool. Whether an
  alerted Booking may still be submitted is open (the prototype allows it).
- Answered (OQ-102's 19 October note, D54): the office's pickers order free colleagues by tier, then
  preferred pairing; the anaesthetist apps stay by availability alone. The names are still open
  (OQ-102).
- Answered (D44, OQ-43): no warning on the anaesthetist's own move. She sees colleagues by
  availability alone; pairing preferences are the office's alone and warn only on the office's paths.
- Answered (D61, OQ-85; D54, OQ-113): she can also move a single Booking, to a colleague free in
  that session, found by typing a name or from the free list in name order (never by tier or
  pairing). It always becomes a new List in their session, never added to an existing List (the rule
  for now; it may change if it does not work in practice). Telling the office is her option.
- Answered (D38, OQ-80): the payable follows the Booking; a prepaid Booking's payable stays the AA
  Holding account, the new anaesthetist claims the prepaid amount, and nothing is recalculated or
  repointed. Whoever submits a List did every procedure on it (the doer rule).

### 6. Hospital-closure conflicts (unavailability is never one)

- Answered (OQ-09): a soft warning. Nothing blocks the office; the List is accepted and flagged.
- A conflict is a List at a closed hospital. An anaesthetist's unavailability, short-notice sickness
  included, is never a conflict (D59, OQ-81 part 3 answered): whoever marks a booked session
  unavailable, the office included, returns the List to the office or hands it to a colleague there
  and then.
- The List changes colour (amber, with its kind's bar and a reason line) and shows on the Conflicts
  screen across every date.
- It clears when the clash goes (the closure moved or deleted, or the List's hospital changed) or when
  the office clears it, with an optional note and "Flag again".
- The office never assigns or moves a List onto an unavailable session: it is made available first,
  with the anaesthetist's agreement (US-01.6.3).
- Not conflicts: a recurring booking landing on an unavailable session becomes a Draft List (Phase 31),
  and anyone who marks a booked session unavailable is asked first whether the List returns to the
  office or goes to a colleague (US-01.5.5).

### 7. Split-billing invoice count

- RFP grouping text says same-counterparty Procedures share an invoice.
- Split-billing text says two invoices in both split cases.
- The prototype groups by counterparty, with two invoices when funders differ.

### 8. Pre-payment

- The RFP requires payment before the procedure.
- AA decided not to block (OQ-57): an unpaid prepayment is a strong before-procedure warning in both
  apps, and completing, submitting and authorising all go through. There is no override.
- The escalation as the date nears and the automatic prepayment invoice come later (catch-up Phase 27).
- Warnings: one routine; a To-do card in Admin; a small triangle on Bookings in all three apps; the
  warning at the top of the Booking when it opens. Never a block, and no confirm step at submit.

### 9. Concurrency

- Several sources can change a Booking.
- The RFP asks how concurrent updates should be handled.
- The prototype is single-user and uses audited last-write-wins behaviour; production concurrency is
  a discovery topic.

### 10. Modifier values and time rounding

- The RFP names example modifier ranges, not a certified full NZSA table.
- The prototype values are demo-plausible and must not be described as authoritative.
- Partial time-interval rounding is a prototype assumption.
- Codes in the same band (pre-assessment, age, ASA, BMI) are one-per-procedure, so tapping a sibling
  replaces it: those per-group ranges only add up if one code applies. The RFP implies the rule rather
  than stating it, and a pre-assessment follow-up (PA5) stacks on top, which is a question for AA.

### 11. Open versus genuinely overdue prior balances

- The billing monitor's "Prior balance" intake flag reads any open (unpaid) prior episode.
- The RFP asks whether to separately distinguish "open" from "genuinely overdue" in this check; the
  prototype flags any open balance and holds the distinction as a discovery question.
- Invoices carry a raised date but no due date, so aging is derived, not contractual.

### 12. ACC pre-op flat-fee codes (CS250, CS260, CS70)

- ACC is not a billing route: ACC-related work bills through the normal contract-holder routes.
- ACC pre-operative assessment has its own flat-fee code set (CS250, CS260, CS70); the prototype
  captures these as ancillary fixed-amount billing lines with the code named in the description.
- The RFP flags the code set as a special pre-assessment case to confirm with AA billing.

## Likely evaluator questions

### "Who actually uses mobile versus web?"

The same anaesthetist. Mobile is the primary in-theatre/on-the-move interface; web provides a wider
planning and accounts view.

### "Who creates the shifts?"

The system creates AM and PM sessions on the rolling canvas. Recurring bookings supply recurring
defaults, painted after the anaesthetist's own calendar. "Apply to canvas now" repopulates the schedule
ahead after a change, without touching booked Lists. Office staff reserve and amend Lists and handle
exceptions. "Shift" is not the RFP term.

### "Can an anaesthetist edit after submission?"

Yes, until the office authorises the List. A submitted List stays on the anaesthetist's main view, less
prominent, and they can still change it; every change is audited and Review shows "Changed since
submitted". The last change stands, and a Booking reopened after submit must be completed again before
the office can authorise. Authorised Bookings are immutable.

### "What happens when the office finds a mistake?"

Office staff phone for clarification and make the correction. There is no Returned state; the
anaesthetist can also correct it themselves until the office authorises it.

### "Why is Xero not doing all the billing?"

AA has agency-specific billing rules and needs Procedure-level calculation, grouping and
anaesthetist-facing views. Xero is the AR and banking add-on.

### "How do late hospital changes work?"

While the List is `ACTIVE`, mapped hospital messages can update the Booking in near real time. Once the
List is `SUBMITTED` or `AUTHORISED`, an inbound change must park for manual intervention.

### "What if the patient has no NHI?"

The RFP is internally inconsistent: one section treats NHI as the unique patient identifier, another
says "where available". The prototype uses a hidden internal ID as the invariant and allows a
provisional NHI-pending patient.

### "Is the demo using real patient or integration data?"

No. All names and data are fictional. Hospital, PDF/OCR, NHI, email, Xero and payment events are
simulated in-browser.

## One-line close

> The prototype demonstrates a single audited flow from a changing theatre schedule to captured
> clinical billing inputs, controlled office authorisation, reliable invoicing and transparent
> collection and disbursement.
