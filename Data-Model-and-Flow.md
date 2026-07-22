# Anaesthesia Associates — Data Model & End-to-End Flow

Derived from *Anaesthesia Associates — Booking and Billing Systems Upgrade, Request for Proposal (Final), July 2026* and its Candidate Architecture. This is a reading of the RFP's **candidate** design — per the RFP it is "a reference model... expected to be challenged, refined, and extended."

> **Viewing:** these diagrams use [Mermaid](https://mermaid.js.org/). They render natively on GitHub, in VS Code (Markdown preview / Mermaid extension), or by pasting a block into <https://mermaid.live>. A rendered companion is provided in `Data-Model-and-Flow.html` (double-click to open in a browser).

---

## Systems / actors at a glance

| System | Role |
|---|---|
| **Scheduling engine** | Owns the Schedule → Day → Anaesthetist → List → Card → Procedure tree ("the canvas"). |
| **Anaesthetist mobile / web app** | Calendar + Card views, timesheet (BTM) capture, availability/locum, outstanding balances. |
| **Admin web app (office)** | Manual change handling, List sanity-check, authorisation, billing-flow monitoring. |
| **Integration engine** | Ingests hospital bookings (HL7 v2 → FHIR R4, real-time) + manual PDF/photo pathway. |
| **Billing engine** | The hub. Consumes AUTHORISED Lists, resolves billing, calculates fees, generates invoices. |
| **Xero (separate instance)** | AR + banking only. Holds ACCREC (collect) / ACCPAY (disburse) pairs. Not general ledger. |

---

## 1 · Data Model — Scheduling & Master Data

The structural spine `Schedule → Day → Anaesthetist → List` is a **fixed canvas** (every active anaesthetist gets exactly two Lists — AM/PM — for every Day on a rolling 4-month horizon). **Status, Hospital, Surgeon and Cards are "painted onto" that canvas.** Master/reference data is decoupled and referenced by ID.

```mermaid
erDiagram
    SCHEDULE ||--o{ DAY : contains
    DAY ||--o{ LIST : "2 per anaesthetist"
    ANAESTHETIST ||--o{ LIST : "owns, reassignable"
    LIST ||--o{ CARD : "time-ordered"
    CARD ||--o{ PROCEDURE : "1..n"
    PROCEDURE ||--o{ BILLING_LINE : "1..n"

    LIST }o--|| LIST_STATUS : status
    LIST }o--|| HOSPITAL : "located at"
    LIST }o--o| SURGEON : "paired with"
    CARD }o--|| PATIENT : "for, by NHI"
    PROCEDURE }o--|| CONTRACT : "rate governed by"
    PROCEDURE }o--o| INSURER : "billed to, nullable"
    PROCEDURE }o--o| PATIENT : "billable-party override"

    CONTRACT }o--o| HOSPITAL : "scoped to"
    CONTRACT }o--o| INSURER : "scoped to"
    HOSPITAL ||--o{ HOSPITAL_HOLIDAY : "closure calendar"
    ANAESTHETIST ||--o{ PERMANENT_LIST : "standing arrangements"
    ANAESTHETIST ||--o{ ANAESTHETIST_AVAILABILITY : "mobile-maintained"
    PERMANENT_LIST ||..o{ LIST : "projects into"
    ANAESTHETIST_AVAILABILITY }o..o{ LIST : "reconciled against"
    HOSPITAL_HOLIDAY }o..o{ LIST : "reconciled against"
    PROCEDURE }o..o| RVG_CODE : "base code"
    PROCEDURE }o..o{ MODIFIER_CODE : modifiers

    SCHEDULE {
        int id PK
    }
    DAY {
        int id PK
        int scheduleId FK
        date calendarDate
    }
    LIST {
        int id PK
        int dayId FK
        int anaesthetistId FK
        enum session "AM or PM"
        enum state "DRAFT, SUBMITTED, AUTHORISED"
        int statusId FK
        int hospitalId FK
        int surgeonId FK "nullable"
        time startTime "default, overridable"
        time endTime "default, overridable"
    }
    CARD {
        int id PK
        int listId FK
        string patientNHI FK
        time cardTime
        int billablePartyId FK "nullable"
        string lastModifiedBy
        datetime lastModifiedAt
        string auditLog "append-only history"
    }
    PROCEDURE {
        int id PK
        int cardId FK
        enum billingRoute "Hospital, BillableParty, Insurer"
        int governingContractId FK
        int insurerId FK "nullable"
        int billablePartyId FK "nullable, e.g. guardian"
        decimal priceOverride "nullable"
        string overrideReason
        bool isAdditional "split-billing flag"
        string rvgBaseCode "nullable"
        datetime anaestheticStart
        datetime handoverTime
    }
    BILLING_LINE {
        int id PK
        int procedureId FK
        enum chargeBasis "RVG, fixed, rate x time"
        decimal units "nullable"
        decimal amount
        string description "ancillary, ACC pre-op, hourly, etc"
    }
    ANAESTHETIST {
        int id PK "registration no"
        string name
        string contact
        decimal unitValue "own dollar per unit"
    }
    HOSPITAL {
        int id PK
        string name
    }
    SURGEON {
        int id PK
        string name
    }
    PATIENT {
        string nhi PK
        string hiddenInternalId UK "only id sent to Xero"
        string name
        date dob
        string demographics
    }
    INSURER {
        int id PK
        string name "e.g. NIB"
        bool acceptsDirectClaims
    }
    CONTRACT {
        int id PK
        string name "Default for type 1"
        enum type "1 ref, 2 agreed, 3 fixed"
        int hospitalId FK "nullable"
        int insurerId FK "nullable"
        decimal rateOrDiscount "nullable"
        decimal fixedPrice "nullable"
    }
    LIST_STATUS {
        int id PK
        string description
        string colour
    }
    PERMANENT_LIST {
        int id PK
        int hospitalId FK
        int anaesthetistId FK
        enum dayOfWeek
        enum session "AM or PM"
    }
    ANAESTHETIST_AVAILABILITY {
        int id PK
        int anaesthetistId FK
        date period
        string status
    }
    HOSPITAL_HOLIDAY {
        int id PK
        int hospitalId FK
        date closureDate
    }
    RVG_CODE {
        string code PK
        string description
        string anatomicalSite
        string baseUnits "single value or range"
        string absorbsModifiers "e.g. prone positioning"
    }
    MODIFIER_CODE {
        string code PK
        string modifierGroup "PA, A, AS, ASE, OB, P, AI"
        decimal units
    }
```

**Notes**
- **The List is the unit of availability and of billing approval** (not the Anaesthetist or Day). Availability varies independently between AM and PM.
- **Cards are mutable from multiple sources** (hospital/surgeon integration, mobile app) right up to the procedure day → hence `lastModifiedBy/At` **plus a full append-only audit log** at Card/Procedure level (invoices must be reproducible against the rules in force when raised).
- **A List can be reassigned to another anaesthetist at short notice** without disturbing its Cards, status history or audit trail.
- **`governingContract` always resolves** — every Hospital and every direct-billing Insurer holds at least a default **Type 1** Contract, so there is no "no contract found" branch.
- `PERMANENT_LIST` is the *template*; the `LIST` rows on the canvas are the *generated instances*. Availability and holiday calendars are **reconciled against** the canvas (conflicts flagged), not merged into it.

---

## 2 · Data Model — Billing Engine & Xero

The Billing Engine **references** the Card/Procedure by ID rather than absorbing them. Billing destination is resolved **per Procedure**, so **one Card can yield multiple invoices** (one per counterparty). Each invoice creates a **matched Xero pair**: an **ACCREC** (collect into the AA account) and a **draft ACCPAY** (payable to the anaesthetist) — linked in the Billing Engine's own case record via the returned Xero GUIDs.

```mermaid
erDiagram
    CARD ||--o{ INVOICE : "1..n by counterparty"
    INVOICE ||--|{ INVOICE_LINE : contains
    PROCEDURE ||--o{ INVOICE_LINE : "billed on"
    INVOICE ||--|| BILLING_CASE : "tracked by"
    BILLING_CASE ||--|| XERO_ACCREC : "links via GUID"
    BILLING_CASE ||--|| XERO_ACCPAY : "links via GUID"
    XERO_ACCREC }o--|| XERO_CONTACT : "paying party"
    XERO_ACCPAY }o--|| ANAESTHETIST : "payable to"
    PATIENT ||--o| XERO_CONTACT : "resolves via hidden ID"
    XERO_ACCREC ||--o{ PAYMENT_IN : "collected by"
    XERO_ACCPAY ||--o{ DISBURSEMENT : "settled by"

    INVOICE {
        int id PK
        string invoiceNumber UK "remittance match key"
        string caseReference "internal display only"
        int cardId FK
        enum counterparty "Hospital, Insurer, Patient"
        decimal total
        datetime emailedAt "sent from Billing Engine"
    }
    INVOICE_LINE {
        int id PK
        int invoiceId FK
        int procedureId FK
        decimal amount
    }
    BILLING_CASE {
        int id PK
        int cardId FK
        int procedureId FK
        string accrecGuid "Xero GUID"
        string accpayGuid "Xero GUID"
        string invoiceNumber
    }
    XERO_ACCREC {
        string guid PK
        string contactId FK
        string invoiceNumber UK "duplicate-prevention on"
        string reference "internal CaseReference"
        enum status "AUTHORISED, PAID, etc"
        decimal amount
    }
    XERO_ACCPAY {
        string guid PK
        int anaesthetistId FK
        enum status "DRAFT then AUTHORISED"
        decimal amount "undiscounted payable"
    }
    XERO_CONTACT {
        string contactId PK "Xero key, primary billing id"
        string contactNumber UK "hidden internal ID"
        bool archived
    }
    PAYMENT_IN {
        int id PK
        string accrecGuid FK
        decimal amount "supports partials"
        date receivedDate "into AA account"
    }
    DISBURSEMENT {
        int id PK
        string accpayGuid FK
        int anaesthetistId FK
        decimal amount
        date paidDate
        string payablesRunId
    }
```

**Notes**
- **`InvoiceNumber` is the reconciliation key** (what hospitals/insurers quote on remittances); `Reference`/CaseReference is display-only (Xero doesn't enforce its uniqueness). AA prefers ACCREC/ACCPAY numbers to be *similar* for easy human matching.
- **Two-state money model:** *invoice paid (into AA)* and *disbursed to anaesthetist* are tracked separately — AA operates like a **trust account**. Direct-to-anaesthetist hospital payments are **retired**; one path now.
- **Payment detection:** Xero **webhook** on INVOICE events (primary) + **daily reconciliation poll** (safety net), idempotent by InvoiceID. When the ACCREC is paid, the linked ACCPAY flips **DRAFT → AUTHORISED** for the next payables run. Partial payments pass through **pro-rata**.
- **Bulk remittance & bank reconciliation** stay inside Xero's own tools — out of scope for the Billing Engine beyond populating `InvoiceNumber` reliably.

### 2a · Patient identity & Xero contact lifecycle

Three identifiers, each scoped to one system, keep Xero performant (≈10k active-contact soft limit vs ≈28k invoices/yr, ~99% one-time) while the **NHI never leaves the practice system**.

```mermaid
flowchart TD
    INTAKE["Patient intake"] --> VAL["PMS validates against NHI<br/>dedupe prior episodes + credit check"]
    VAL --> CACHE{"PMS holds cached<br/>Xero ContactID for hidden ID?"}
    CACHE -->|yes| USE["Use cached ContactID<br/>no Xero query"]
    CACHE -->|no| QUERY["GET /Contacts where<br/>ContactNumber == hidden_id"]
    QUERY --> EXISTS{"Contact exists in Xero?"}
    EXISTS -->|yes| CACHEIT["Cache ContactID"]
    EXISTS -->|no| CREATE["Create Xero contact<br/>ContactNumber = hidden_id<br/>NHI never sent"]
    CREATE --> CACHEIT
    USE --> BAL["GET /Invoices AUTHORISED<br/>surface unpaid balances at check-in"]
    CACHEIT --> BAL
    BAL --> INV["Raise invoice against ContactID"]
    INV --> ARCH["Nightly job: archive contact once<br/>fully paid + ~90-day inactivity"]

    classDef xero fill:#e6f4ea,stroke:#34a853,color:#111;
    class QUERY,CREATE,BAL,INV,ARCH xero;
```

> **⚠ RFP inconsistency to resolve:** the *"separating clinical and billing identifiers"* section says NHI is kept as a **cross-reference custom field on the Xero contact** (searchable), whereas **Appendix 2** says the **NHI never resides in Xero** at all. The diagram follows Appendix 2 (the stricter data-minimisation model). This needs confirmation with AA.

---

## 3 · List lifecycle (the billing trigger)

Approval state lives on the **List**, not the Card. Reaching **AUTHORISED** locks the Cards and hands the whole List to the Billing Engine as one unit. (Xero status names are reused where possible; SUBMITTED is the deliberate exception, for user continuity.)

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT: DRAFT — fully editable by anaesthetist; office + integrations may update
    SUBMITTED: SUBMITTED — editable by office only (OfficeAdmin); anaesthetist loses edit access
    AUTHORISED: AUTHORISED — Cards locked, immutable

    DRAFT --> DRAFT: anaesthetist edits Cards
    DRAFT --> SUBMITTED: taps Completed, all Cards valid
    SUBMITTED --> SUBMITTED: office corrections (issues resolved by phone)
    SUBMITTED --> AUTHORISED: office signs off after sanity check
    AUTHORISED --> [*]: handed to Billing Engine as a unit
```

- **No "Returned" state** — Cards are never sent back to the anaesthetist; office resolves issues by phone.
- The List **drops off the anaesthetist's mobile view at invoice generation** (not merely at AUTHORISED), reappearing next day as line items in the outstanding-balance view.

---

## 4 · End-to-End Flow — Booking → Payment

```mermaid
flowchart TD
    %% Stage 1 - origination
    PL["Permanent Lists<br/>standing arrangements"] --> RESERVE["List reserved for<br/>Surgeon at Hospital"]
    ADHOC["Ad-hoc booking<br/>phone from surgeon rooms"] --> RESERVE

    %% Stage 2 - card population
    RESERVE --> CARDS["Cards created / updated<br/>mutable until procedure day"]
    HOSPINT["Hospital PAS<br/>HL7 v2 SIU S12/13/14/15<br/>or FHIR R4"] --> INTENG["Integration engine<br/>HL7 to FHIR, real-time"]
    INTENG --> CARDS
    PDFDOC["Surgeon emails PDF list"] --> PDFREAD["PDF reader / OCR"]
    PDFREAD --> CARDS
    MOBADD["Anaesthetist ad-hoc Card<br/>photo capture"] --> CARDS

    %% Stage 3 - capture
    CARDS --> BTM["Day of procedure — mobile capture<br/>base code, start/handover, modifiers, ASA"]

    %% Stage 4 - submit + authorise
    BTM --> SUBMIT["List flagged SUBMITTED<br/>app validates minimum billing data"]
    SUBMIT --> OFFICE["Office sanity-check<br/>Contract, Insurer, references"]
    OFFICE -->|issue found| PHONE["Resolved by phone<br/>no return-to-anaesthetist"]
    PHONE --> OFFICE
    OFFICE --> AUTH["List AUTHORISED<br/>Cards LOCK, immutable"]

    %% Stage 5 - billing engine
    AUTH --> ROUTE{"Resolve billing route<br/>per Procedure"}
    ROUTE -->|Hospital| RATE["Look up governing Contract<br/>apply Type 1 / 2 / 3"]
    ROUTE -->|Insurer| RATE
    ROUTE -->|Billable Party| RATE
    RATE --> CALC["Compute fee — BTM<br/>Base + Time T1/T2 + Modifiers<br/>x anaesthetist unit value"]
    CALC --> SPLIT{"Split billing?"}
    SPLIT -->|"2nd+ procedure"| SPLITR["Time units ONLY<br/>no base/modifier re-charge"]
    SPLIT -->|no| GROUP["Group Procedures by<br/>counterparty, per Card"]
    SPLITR --> GROUP

    %% Stage 6 - invoicing + xero
    GROUP --> EMAIL["Generate + EMAIL invoice<br/>from Billing Engine"]
    EMAIL --> XPAIR["Xero: ACCREC collect<br/>+ ACCPAY draft to anaesthetist<br/>linked by GUID"]
    XPAIR --> DROP["List drops off mobile;<br/>reappears next day as<br/>outstanding-balance line"]

    %% Stage 7 - payment + disbursement
    XPAIR --> PAYIN["Payment into AA account"]
    PAYIN --> DETECT["Xero webhook INVOICE event<br/>+ daily reconciliation poll"]
    DETECT --> FLIP["ACCREC paid: ACCPAY to AUTHORISED<br/>partials passed through pro-rata"]
    FLIP --> DISB["Payables run —<br/>AA disburses to anaesthetist"]
    DISB --> TRUST["Two tracked states:<br/>invoice paid + disbursed<br/>AA acts as trust account"]

    classDef ext fill:#e8f0fe,stroke:#4285f4,color:#111;
    classDef money fill:#e6f4ea,stroke:#34a853,color:#111;
    classDef lock fill:#fce8e6,stroke:#ea4335,color:#111;
    class HOSPINT,INTENG,PDFDOC,PDFREAD,MOBADD,ADHOC ext;
    class PAYIN,DETECT,FLIP,DISB,TRUST money;
    class AUTH,SPLITR lock;
```

### Narrative walk-through

1. **Origination** — a List is reserved for a surgeon at a hospital, either automatically from **Permanent Lists** or ad-hoc (phone from the surgeon's rooms). ~80% of surgeon assignments come from the permanent arrangement.
2. **Card population** — appointment **Cards** are filled progressively over weeks, ideally via **hospital integration** (HL7 v2 SIU messages translated to FHIR R4 in real time), otherwise via **emailed PDF lists** (PDF/OCR ingest) or **ad-hoc entry** on the mobile app (incl. photographing a paper card). Cards stay mutable to the day.
3. **Data capture** — on the day, the anaesthetist records **BTM** data per Procedure (base RVG code, anaesthetic start/handover times, modifier codes; ASA seeds the modifier field).
4. **Submit → Authorise** — the anaesthetist marks the List **SUBMITTED** (app enforces minimum billing data); the **office** sanity-checks all Cards and marks it **AUTHORISED**, which **locks the Cards**.
5. **Billing Engine** — on the AUTHORISED List it iterates Cards/Procedures, **resolves the counterparty per Procedure**, looks up the **governing Contract** (Type 1/2/3), computes the fee (tiered time at the 2-hour T1/T2 breakpoint; base capped at one per anaesthetic), enforces **split-billing** (2nd+ procedure = time units only), and **groups Procedures by counterparty** into invoice boundaries.
6. **Invoicing + Xero** — invoices are **generated and emailed from the Billing Engine** (supporting the GST "agency" relationship), and a matched **ACCREC (collect) + draft ACCPAY (disburse)** pair is created in Xero, linked by GUID. The List then drops off the anaesthetist's mobile view.
7. **Payment + disbursement** — payment lands in the **AA account**; detection via **webhook + daily poll** flips the ACCPAY to **AUTHORISED**; a **payables run disburses to the anaesthetist**. "Paid" and "disbursed" are tracked as distinct states.

---

## 5 · Design tensions / open questions to resolve in discovery

Flagged by the RFP itself, or surfaced by the modelling above — useful to address in a proposal:

- **NHI in Xero — contradiction** (see §2a): cross-reference field vs. never-in-Xero. Needs a ruling.
- **Concurrency** — how to handle a Card/Procedure edited simultaneously by integration + mobile app.
- **List reassignment mechanism** — precise handling that preserves Cards, status and audit history.
- **Availability vs holiday reconciliation** — hard constraint, soft warning, or advisory?
- **Card- vs List-level billing failure** — does one failed Card block the whole List's processing?
- **Where office billing-flow monitoring lives** — Admin Web App vs a dedicated Billing Engine admin surface.
- **Exact "List disappears from mobile" trigger** — confirmed as invoice generation, to be locked down.
- **Hospital route non-payment** — is there a fallback to the Billable Party, or is the Hospital route final?
- **Insurer route scaling** — whether direct-insurer billing needs its own rate structure beyond the single Type 1 default.
- **Second-procedure pricing rules** — "various rules apply depending on the nature of the contract"; needs detailed rules capture.
- **NHI dual-format** (Appendix 1) — support both old (mod-24) and new (mod-23, alphanumeric) formats by **1 July 2027**.
```
