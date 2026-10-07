# Requirements update, 2026-10-08: procedure picker and source text

What this update did to the catalogue:

- The procedure picker gains an **RVG codes** tab beside its **Procedures** tab. Both are lists under body-area headings.
- Picking an RVG code leads to the Contract lines across that code's group.
- Every RVG group has a **general procedure**.
- Every booking screen shows each Procedure as a three-part stack: the **source wording as received**, then the **procedure and RVG code**, then the **Contract** (name and holder, who is invoiced, pricing basis with figure).
- The source wording is kept verbatim from every intake channel.

This run's lines are the ones that cite `Notes 2026-10-08 · Procedure picker and source text`, and `#n` below means a point of that note. Other uncommitted changes in the same files (the 2026-10-06 and 2026-10-07 runs) are not part of it.

**Counts.** 0 questions answered · 12 items changed · 1 added · 0 retired · 0 moved · 1 new question · 2 questions updated · domain-model.md changed · 1 artifact registered (AR-35).

## 1. Inputs

- Note: [notes/2026-10-08-procedure-picker-and-source-text.md](../catalogue/notes/2026-10-08-procedure-picker-and-source-text.md) (points #1 to #9), registered as artifact AR-35.
- Donald's typed statement of 2026-10-08, recalling a meeting that was not recorded, plus his answers in the same session to four questions:
  - the picker layout
  - what an RVG code pick resolves to
  - what the Contract part shows
  - what to do with example wording
- The note ends with an **AI-made, illustrative** set of 35 source-wording rows mapped to NZSA RVG 2021 codes ([AR-35#illustrative-source-wording](../catalogue/artifacts/AR-35.md)). It is for seeding the prototype and is not from AA. Its codes and base units were checked against the guide's text by a reviewer agent.

## 2. Questions answered

None.

## 3. Items changed

| Item | Title | What changed | Sources |
| --- | --- | --- | --- |
| [FT-04.3](../catalogue/requirements/FT-04.3.md) | Contract selection on a Procedure | Picker has two tabs, Procedures and RVG codes, each one list under body-area headings with jump-to-section and one search (name, RVG code, system code). An RVG code pick offers the Contract lines across the group: a line sets the procedure, and No contract (RVG) sets the general procedure. Note on viability and proving it in the prototype. | #2 #3 #4 |
| [US-04.3.2](../catalogue/requirements/US-04.3.2.md) | Filtered Contract list | New paragraph and AC "From an RVG code": No contract (RVG) first, then the fitting lines for every procedure in the group, each naming its procedure. | #4 |
| [US-03.3.1](../catalogue/requirements/US-03.3.1.md) | Pick the procedure and Contract, with starting units | The anaesthetist's two routes are now the two tabs; AC "Two routes" rewritten. Stays Verify. | #2 #3 #4 |
| [US-05.1.6](../catalogue/requirements/US-05.1.6.md) | Procedure master mapped to RVG codes | Every RVG group has a general procedure (new bullet and two ACs). Picker wording updated for the tabs. Notes cover the rule against the 7 Oct clean-up, viability, the illustrative wording, source wording shown above, and OQ-103. | #1 #2 #3 #4 #5 |
| [US-05.1.3](../catalogue/requirements/US-05.1.3.md) | Body sections and AA groups | Body sections head both tabs: procedures under section and subgroup, RVG codes under section and the guide's sub-headings. | #2 #3 |
| [FT-05.1](../catalogue/requirements/FT-05.1.md) | RVG groups, procedures and modifiers | "Users ... or browse the RVG codes by body area". | #2 |
| [US-03.1.9](../catalogue/requirements/US-03.1.9.md) | Source wording, procedure and Contract shown together (was "Show the source wording beside the procedure") | Retitled. Each Procedure is shown as a three-part stack on every booking screen in both apps, and the source wording is not plain English. ACs rewritten (any source, the order, Contract summary, not matched yet). Links AR-35. Invoice-wording tension kept as before. | #6 #7 |
| [US-03.1.2](../catalogue/requirements/US-03.1.2.md) | See the Contract on each Procedure | What the Contract shows: name and holder, who is invoiced, pricing basis with figure, under the source wording and procedure. | #7 |
| [US-02.1.2](../catalogue/requirements/US-02.1.2.md) | Match rows to Lists and Bookings | Each row shows its procedure text exactly as received; new AC. | #8 |
| [US-02.3.1](../catalogue/requirements/US-02.3.1.md) | Create or amend a Booking | Optional "as given" field for phone or email bookings. | #8 |
| [US-02.4.1](../catalogue/requirements/US-02.4.1.md) | Add a Booking manually | Optional "as given" field for the anaesthetist. | #8 |
| [US-07.2.2](../catalogue/requirements/US-07.2.2.md) | Office review of Contracts and references | Procedures and their Contracts shown as the three-part stack. | #7 |

**Added**

| Item | Title | What it says | Sources |
| --- | --- | --- | --- |
| [US-02.5.7](../catalogue/requirements/US-02.5.7.md) | Keep the procedure text as received | Under FT-02.5, Confirmed. Kept verbatim from every channel (hospital download or feed, HL7 or FHIR, surgeon's PDF, email) and never overwritten. A later update is added with its source system and time. Optional "as given" on manual entry. Related US-02.5.5. | Notes 2026-10-07 · AA client meeting #26 #29; #6 #8 |

**domain-model.md**

- New "Source wording" bullet under Procedure: one or more source texts per Procedure, shown in the stack. Neither draft ERD has the field yet.
- The Booking section now points to it.
- The billing-context row reads "kept as received and shown above it".
- The Selection paragraph covers the two tabs and the RVG-code route.
- The procedure list paragraph covers the tabs and the general procedure.
- The "What changed" table row is updated.
- New glossary row "Source wording".

## 4. New and updated questions

- **New [OQ-103](../catalogue/questions/OQ-103.md), "Invoice wording for a group's general procedure"** (Open).
  - What a general procedure's name prints on the invoice.
  - Whether office review prompts for a more specific procedure.
  - Which procedure a holder's plain RVG Contract (OQ-98) sets when picked from the RVG codes tab.
- **[OQ-88](../catalogue/questions/OQ-88.md): "Update 2026-10-08", moved, not settled.** The RVG codes tab and general procedures fit the two-level shape. Question 2 (where the system code lives) is still unanswered.
- **[OQ-99](../catalogue/questions/OQ-99.md): "Update 2026-10-08".** The RVG codes tab gives the office a way to set a Procedure without a specific procedure. Whether that replaces leaving it blank is not decided.

## 5. Points with no requirement change

- **#1 and #9 (viability, examples):** recorded in notes on FT-04.3 and US-05.1.6, and as the illustrative table in the note (AR-35). They are not requirements in their own right. Seeding the prototype with the table is for the build plan.

## 6. For the build plan

The prototype work these imply:

- the two-tab picker in both apps
- the RVG-code route to Contract lines
- a general procedure per RVG group in the seed
- the three-part stack on every booking screen
- source wording kept per Procedure, with history
- "as given" on manual and ad hoc entry
- source wording on matching rows
- demo data seeded from the AR-35 illustrative wording, especially the rows that need an expert (14, 15, 17, 21, 26, 27, 34, 35) and the same Booking from two sources (rows 1 and 2)

This will bump `PERSIST_VERSION`.
