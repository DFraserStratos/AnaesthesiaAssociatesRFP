# NZSA RVG 2021 · modifiers reference

## About this file

A transcription of every modifier, and every modifier-related rule, in the **NZSA Relative Value
Guide 2021** (`NZSA RVG 2021.pdf` in this folder, 15 pages, registered as artifact **AR-16**; page
*n* is spot `AR-16#pn`, and the existing regions are `AR-16#time-units` and `AR-16#derivation`).

It serves the directors' modifier rule (Donald, 7 Oct 2026, answer to question 1 of *How procedures
are priced and who pays*):

- Some modifiers cannot be removed: **age**, which comes from the patient.
- Some RVG codes' base units **already include a modifier** (e.g. Neurosurgery: "These Base Units
  include Loading for Prone Positioning if needed" (+2), the (+2) being P1's own value). On those codes the system shows that
  modifier pre-selected at **0** and locked, so the anaesthetist cannot add it a second time.
- All other modifiers are optional, chosen by the anaesthetist.

Section 2 lists the modifiers, section 3 the group-level (body area) modifier guidance, section 4
the codes whose base units include a modifier (also in `NZSA RVG 2021 included modifiers.csv`), and
section 5 the other rules that bear on modifiers and time units.

**Provenance:** transcribed by an agent on 2026-10-07 from the PDF (pages rendered and read
visually, cross-checked against a pypdf text extraction, then re-checked in a second full pass).
Numbers and wording are copied as printed, including the guide's own typos and inconsistencies.
Spot-check against the PDF before relying on it. Where the agent interprets rather than
transcribes, the text says so ("Interpretation").

Code clash warning: the guide reuses codes across tables. Modifier **A1, A2** are also Abdomen base
codes, modifier **P1** is also a Perineum base code, time code **T1** is also a Thorax base code,
**T2** appears twice in Breast, and **P6** appears in both Urology and Obstetric. A system key
needs the table (base / time / modifier) as well as the code.

## 1. How the guide builds a fee (page 6)

"RVG based reimbursements are calculated using: PROCEDURAL/BASE UNITS · TIME UNITS and · MODIFYING
UNITS." (AR-16#p6). Reimbursement is "derived by multiplying the total relative value units by a
monetary value" (AR-16#p3).

## 2. Every modifier the guide defines

### 2a. The modifying factors table (pages 12 to 13)

Preamble, quoted (AR-16#p12): "It is strongly recommended that all modifying factors are itemised on
your records and the patient's records. In addition, itemisation may be a mandatory requirement of
contracts. Modifying units can be added to base units under the following circumstances:"

The table is printed in blocks separated by blank grey rows; the *Block* column records them.
*Source* says how the system would know the modifier applies: **Automatic** = derived from patient
data the system holds (only age, per the rule above); **Chosen** = the anaesthetist selects it
(several rest on a clinical assessment, e.g. ASA grade or BMI, but the guide leaves all
modifying units "at the discretion of the individual anaesthetist", AR-16#p14).

| Code | Block | Modifying factor (as printed) | Units (as printed) | Trigger / how measured | Source | Page |
|---|---|---|---|---|---|---|
| PA1 | Pre-assessment | Telephone Pre-assessment – Simple [<15 minutes] | 1 | Phone pre-assessment under 15 minutes | Chosen | 12 |
| PA2 | Pre-assessment | Telephone Pre-assessment – Complex [>15 minutes] | 2 | Phone pre-assessment over 15 minutes | Chosen | 12 |
| PA3 | Pre-assessment | Face-To-Face Pre-assessment – Prior To Day Of Surgery [Maximum 4 Units] | 2 + Time | In-person pre-assessment before the day of surgery; 2 plus time, capped at 4 units in total | Chosen | 12 |
| PA4 | Pre-assessment | Face-To-Face Pre-assessment – On Day Of Surgery – Complex [Complex Assessment + Management Of Significant Issues] | 2 | In-person complex assessment on the day of surgery | Chosen | 12 |
| PA5 | Pre-assessment | Cancellation of Case on Day of Surgery [After Complex Pre-assessment] | 2 [Max] | Case cancelled on the day, after a complex pre-assessment | Chosen | 12 |
| A1 | Age | Age >1, and/but <2, 70-80-year-old | 1 | Patient age over 1 and under 2, or 70 to 80 | **Automatic** (patient date of birth at date of procedure) | 12 |
| A2 | Age | Age < 1 year old and/but > 80-year-old | 2 | Patient age under 1, or over 80 | **Automatic** (patient date of birth at date of procedure) | 12 |
| AS1 | ASA | ASA I or II | 0 | ASA physical status I or II | Chosen (clinical grade) | 12 |
| AS3 | ASA | ASA III | 2 | ASA III | Chosen (clinical grade) | 12 |
| AS4 | ASA | ASA IV | 4 | ASA IV | Chosen (clinical grade) | 12 |
| ASE | ASA | Emergency case | 2 | Emergency case | Chosen | 12 |
| OB1 | BMI | BMI < 35 | 0 | Body mass index under 35 | Chosen (clinical measure) | 12 |
| OB2 | BMI | BMI 35 - 40 | 1 | BMI 35 to 40 | Chosen (clinical measure) | 12 |
| OB3 | BMI | BMI > 40 | 2 | BMI over 40 | Chosen (clinical measure) | 12 |
| OB4 | BMI | BMI > 50 | 3 | BMI over 50 | Chosen (clinical measure) | 12 |
| AI1 | Airway / position | Awake Intubation - However accomplished | 2 | Awake intubation by any technique | Chosen | 12 |
| P1 | Airway / position | Any position that is non-supine, non- lithotomy, or non-lateral *IF not already accounted for (It is included in Spine and Neuro Base units)* | 2 | Patient positioned other than supine, lithotomy or lateral (e.g. prone, sitting, park bench), unless the base units already include it | Chosen, but **locked at 0** on Spine and Neurosurgery codes (section 4) | 12 |
| VM1 | Monitoring | Vascular monitoring (Art Line, CVL, PA Catheter) NOT EXPECTED of Anaesthesia/Procedure | 2 | Arterial line, central line or PA catheter not normally expected for the anaesthetic or procedure | Chosen | 13 |
| TTE1 | Echo | Peri-operative Transthoracic Echocardiogram - i.e. Full Report + Formal Report [Accredited Anaesthetist ONLY] | 6 | Peri-operative TTE with full and formal report; accredited anaesthetist only | Chosen | 13 |
| TTE2 | Echo | Non-operative Transthoracic Echocardiogram – i.e. in Emergent Situation To Assess Filling [Accredited Anaesthetist ONLY] | 2 | Emergent TTE to assess filling; accredited anaesthetist only | Chosen | 13 |
| PACU1 | Recovery | Recovery Room Care – Provide documentation if >15 minutes being claimed for | As Per T1/T2 | Recovery room care, billed at the time-unit rates; documentation needed if more than 15 minutes is claimed | Chosen | 13 |
| EAA1 | Post-op / cover | Elective Additional Anaesthetic Assistance [Discuss with patient + payer pre-surgery if possible] | 4 | A second anaesthetist assisting electively | Chosen | 13 |
| POC 1 | Post-op / cover | ICU Care: Anaesthetist In Hospital Providing Cover per day | 25 | Per day of in-hospital ICU cover | Chosen | 13 |
| POC2a | Post-op / cover | HDU Care: Anaesthetist At Home Providing Cover per day | 4-6 | Per day of HDU cover from home; 4 to 6 "depending on patient complexity" (AR-16#p6) | Chosen | 13 |
| POC2b | Post-op / cover | PLUS: Telephone Call Requiring Significant Management Change | 1 [Per Call] | Add-on to POC2a, per call | Chosen | 13 |
| POC2c | Post-op / cover | PLUS: Face-To-Face Visit Resulting in Significant Management Change | 4 + Time | Add-on to POC2a, per visit, plus time | Chosen | 13 |
| POC3a | Post-op / cover | Non-Complex Ward/PACU Review – Nerve Catheter/Epidural/IV Fluids/ Analgesia | 1+ Time | Non-complex ward or PACU review, plus time | Chosen | 13 |
| POC3b | Post-op / cover | Complex Ward/PACU Review with significant documented management issues | 2 + Time | Complex review with documented management issues, plus time | Chosen | 13 |
| NC1 | Nerve catheter | In situ Plexus/Nerve Catheter patient in hospital | 1 | Plexus or nerve catheter in place while patient is in hospital | Chosen | 13 |
| NC2 | Nerve catheter | In situ Plexus/Nerve Catheter at hospital discharge [1 Unit/day to maximum of 3 Units] | 1 | Catheter in place at discharge; 1 unit per day, at most 3 units | Chosen | 13 |

Total: **30 modifier codes** (5 PA, 2 age, 4 ASA incl. emergency, 4 BMI, AI1, P1, VM1, 2 TTE,
PACU1, EAA1, 6 POC, 2 NC).

Notes on the table, as printed:

- **No AS2 or ASA V code.** ASA I and II share AS1 (0 units); the table jumps from AS3 to AS4.
- **ASE (Emergency case)** sits in the ASA block. The guide does not say whether it stacks with an
  ASA code. Interpretation: it is a separate factor (page 6 lists "Emergency operation" as its own
  example), so it likely stacks.
- **Age boundaries are not exact.** A1 reads "Age >1, and/but <2, 70-80-year-old"; A2 reads "Age <
  1 year old and/but > 80-year-old". Read literally, a child of exactly 1 is in neither band (A1
  says ">1", A2 says "< 1"), over 1 and under 2 is A1, 2 to under 70 attracts nothing, 70 to 80
  is A1, and over 80 is A2. Page 6 phrases the same bands as "<1, 1-2, 70-80, >80". Whether a patient aged
  exactly 80 (or 80 and some months) is A1 or A2 is **uncertain**; the system needs a ruling (e.g.
  completed years at the date of procedure: 80 = A1, 81+ = A2).
- **BMI bands overlap at the top.** OB3 "BMI > 40" (2) and OB4 "BMI > 50" (3) both cover BMI over
  50. Interpretation: the bands are alternatives and the highest applicable one is claimed (as with
  age and ASA), not summed.
- **Units that are not a plain number:** "2 + Time" (PA3, POC3b), "4 + Time" (POC2c), "1+ Time"
  (POC3a), "2 [Max]" (PA5), "As Per T1/T2" (PACU1), "4-6" (POC2a), "1 [Per Call]" (POC2b), and NC2's
  bracketed cap. The system's modifier unit field needs to allow a range, a cap, a per-call or
  per-day count, and an "+ Time" component.
- Many of these codes are services (pre-assessment, post-op cover, ICU/HDU days) rather than
  patient-complexity loadings, but the guide lists them all as modifying factors.

### 2b. Modifiers named in the general rules, with or without a code

| Factor | Units | Where | Has a code in the table? |
|---|---|---|---|
| "ASA score, e.g. >2" | (see AS3/AS4) | p6, Modifying units | Yes (AS1 to AS4) |
| "Extremes of age, e.g. <1, 1-2, 70-80, >80" | (see A1/A2) | p6 | Yes (A1, A2) |
| "Elevated BMI, e.g. >35" | (see OB2 to OB4) | p6 | Yes (OB1 to OB4) |
| "Frailty" | **none given** | p6 | **No.** Frailty is listed as an example but has no code or unit value anywhere in the guide |
| "Emergency operation." | (see ASE) | p6 | Yes (ASE) |
| Crisis: "we consider it reasonable to add modifiers for the resuscitation and insertion of invasive monitoring, e.g. 2 units for an arterial line, 2 units for central line." | 2 each | p6 | Partly: VM1 (2) covers vascular monitoring "NOT EXPECTED"; there is no separate resuscitation code |
| Upper Limb: "*Add 2 units if sitting position*" | +2 | p8 | No own code; a positioning loading (see section 3) |
| Neurosurgery / Spine prone loading | +2 (Neuro, P1's value); unstated (Spine) | p7, p9 | Included in base units (section 4); the matching modifier is P1, whose row says "It is included in Spine and Neuro Base units" |
| "If a second procedure requires a change of patient position, modifying units may need to be added." | not stated | p6 | No (interpretation: P1) |

### 2c. Time units (page 12, `AR-16#time-units`)

| Code | Time (as printed) | Unit |
|---|---|---|
| T1 | Every 15 Minutes or part thereof [For the first TWO hours] | 1 |
| T2 | Every 10 Minutes of part thereof [From the start of the THIRD hour] | 1 |

Check against the guide's own worked example (p14): 150 minutes = 8 (120 min / 15) + 3 (30 min /
10) = 11 time units, as printed; 20 minutes = 2 time units (one 15-minute block plus part of
another), as printed.

## 3. Modifier guidance by body area

**The guide has no table of "typical and maximum" modifier values by body area.** *How procedures
are priced and who pays* (section 7) says "Page 12 of the RVG gives guidance on when modifier units
may be added to the base units, with typical and maximum values for each body area". Page 12 (and
13) of this 2021 edition hold only the time table and the flat modifying-factors table above: one
value per code, not grouped by body area, with no "typical" column. The only maxima are per code
(PA3 4, PA5 2, NC2 3) and the only range is POC2a 4-6. That sentence in the pricing guide should be
corrected or its source found (possibly a different document or edition).

What the guide does give by body area is three group-level positioning notes in the base-unit
tables. Transcribed faithfully:

| Body area (group) | Note as printed | Units as printed | Effect | Codes covered | Page |
|---|---|---|---|---|---|
| Neurosurgery (under Head) | "*These Base Units include Loading for Prone Positioning if needed*" | (+2), P1's value | Prone loading already in base units: P1 locked at 0 on every code, 'a' and 'b' alike | H7A, H7b, H8a, H8b, H9a, H9b | 7 |
| SPINE | "These Base Units include loading for prone positioning if needed" | none printed (units cell blank) | Prone loading already in base units: P1 locked at 0. Value 2 taken from P1, whose note says "It is included in Spine and Neuro Base units" | S1, S2, S3a, S3b, S4, S5, S6, S7, S8a, S8b, S9a, S9b, S9c, S10 | 9 |
| UPPER LIMB | "*Add 2 units if sitting position*" | +2 | An **addition**, not an inclusion: +2 when the patient is sitting | Uncertain: printed as the last row of the Upper Limb group, directly under UL4; may apply to UL1 to UL4 or only UL4 (shoulder replacement) | 8 |

Interpretation for Upper Limb: sitting is a non-supine, non-lithotomy, non-lateral position, so the
"+2 if sitting" is the P1 loading spelled out for this group. The system should offer one 2-unit
positioning modifier, not P1 plus a second Upper Limb +2.

Other base-unit tables split codes by patient age or position without saying a modifier is
included (not treated as included modifiers; noted for completeness):

- **H6a / H6b** (Ocular, p7): "Ocular Procedure Under Local Anaesthetic or Eye Block or GA > 2yo" 4;
  "Ocular Procedure Under GA [YOUNGER than Aged TWO Years]" 5.
- **P1 / P2** (Perineum, p10): "Circumcision (> 2 y.o.)" in P1 (4); "Circumcision (< 2 y.o.)" in P2 (5).
- The guide does not say whether the age modifier A1/A2 also applies on top of H6b or P2.
  **Uncertain**; since age is automatic and cannot be removed under the rule, the directors should
  confirm that stacking is intended.

## 4. Codes whose base units include a modifier

Also in `NZSA RVG 2021 included modifiers.csv` (one row per code). The included modifier is **P1**
("Any position that is non-supine, non- lithotomy, or non-lateral", 2 units) in every case. The
`included_units` value is the modifier's own value that the base units already account for; the
system shows P1 at 0 and locked on these codes.

Neurosurgery group note (p7), quoted verbatim: "*These Base Units include Loading for Prone
Positioning if needed*" with "(+2)" in the units column. The (+2) is P1's own value (2 units), the
loading the base units include. P1 is included in all Neuro (H7A to H9b) and Spine (S1 to S10) base
units, per the P1 row (p12): "IF not already accounted for (It is included in Spine and Neuro Base
units)". Donald confirmed it on 8 October: H7, H8 and H9 are headings with no base units; the 'a'
and 'b' sub-codes are the actual codes, and all of their base units include prone positioning.

| Code | Procedure (as printed) | Base units | Included | Page |
|---|---|---|---|---|
| H7A | Cranioplasty/Cerebrospinal fluid shunt procedures supine/lateral · Supine/lateral | 10 | P1, 2 | 7 |
| H7b | Cranioplasty/Cerebrospinal fluid shunt procedures supine/lateral · Prone/park bench/sitting | 12 | P1, 2 | 7 |
| H8a | Non-Vascular Open Intracranial/Spinal cord · Supine/lateral | 12 | P1, 2 | 7 |
| H8b | Non-Vascular Open Intracranial/Spinal cord · Prone/park bench/sitting | 14 | P1, 2 | 7 |
| H9a | Vascular Open Intracranial/Spinal cord Procedures · Supine/lateral | 20 | P1, 2 | 7 |
| H9b | Vascular Open Intracranial/Spinal cord Procedures · Prone/park bench/sitting | 22 | P1, 2 | 7 |

Neurosurgery notes:

- The sub-codes are printed on separate lines under H7, H8 and H9: "A" and "b" for H7 (capital A
  as printed), "a" and "b" for H8 and H9. The combined codes (H7A etc.) are this file's spelling.
- H7's title line itself reads "...procedures supine/lateral" before splitting into Supine/lateral
  and Prone/park bench/sitting, as printed.
- H7, H8 and H9 themselves are headings with no base units.
- Base units differ between the pair: Donald's example "H7A or H7B, the base units are 10" is half
  right: H7A is 10, **H7b is 12**. P1 is included in both: it must not be added again, whichever
  variant is picked. The (+2) is P1's value, not the gap between the "a" and "b" codes.

Spine group note (p9), quoted verbatim: "These Base Units include loading for prone positioning if
needed" (no units printed; value 2 from P1, whose row on p12 says "It is included in Spine and
Neuro Base units").

| Code | Sub-group | Procedure (as printed) | Base units | Included | Page |
|---|---|---|---|---|---|
| S1 | | Removal of Spinal Hardware | 8 | P1, 2 | 9 |
| S2 | Cervical | Anterior Cervical Procedures e.g. Anterior Disc Fusion, Disc Replacement | 8 | P1, 2 | 9 |
| S3a | Cervical | Posterior Cervical Procedures [1-2 levels] e.g. Foraminotomy | 10 | P1, 2 | 9 |
| S3b | Cervical | Posterior Cervical Procedures [>2 levels or Front + Back] | 12 | P1, 2 | 9 |
| S4 | Thoracic | Intrathoracic Spinal Procedures | 16 | P1, 2 | 9 |
| S5 | Thoracic | Extensive Thoracic/Lumbar Decompression and Fusion e.g. Scoliosis | 20 | P1, 2 | 9 |
| S6 | Lumbar | Discectomy/Decompression Procedures – [ 1-2 levels] | 8 | P1, 2 | 9 |
| S7 | Lumbar | Minimally Invasive Lateral Lumbar Procedures | 8 | P1, 2 | 9 |
| S8a | Lumbar | Anterior Decompression/Fusion – Single Level | 8 | P1, 2 | 9 |
| S8b | Lumbar | Anterior Decompression/Fusion – Multiple Level | 10 | P1, 2 | 9 |
| S9a | Lumbar | Posterior Decompression/Fusion – Single Level | 10 | P1, 2 | 9 |
| S9b | Lumbar | Posterior Decompression/Fusion – Two Level | 12 | P1, 2 | 9 |
| S9c | Lumbar | Posterior Decompression/Fusion – Three + Level | 14 | P1, 2 | 9 |
| S10 | Lumbar | Combined Anterior and Posterior Surgical Approach | 18 | P1, 2 | 9 |

Total: **20 codes** (6 Neurosurgery, 14 Spine).

"Include" wording elsewhere that is **not** an included modifier (checked on every page):

- T3 (p8): "Complex Mastectomy (includes axillary node surgery) dissection": procedure scope.
- A12 (p10): "INCLUDES Open/Laparoscopic/Combined Technique": surgical technique.
- E1 (p11): "Gastroscopy, Colonoscopy - includes Sedation for Uncomplicated Biopsies": scope.
- Page 6: "The base units take into account a brief (<15 minutes) pre and post-operative visit."
  This is a general inclusion for every code (see section 5), not a modifier.

## 5. Other rules bearing on modifiers and time units

| Rule (quoted) | Page | Bearing |
|---|---|---|
| "Patient complexity separate to the surgical procedure comes under modifying units." | 6 | Modifiers are for the patient; base units are for the procedure |
| "Base units are categorised according to the anatomical site of the procedure being performed, the patient position and the complexity of the anaesthesia required." | 6 | Why position can be inside base units (Neuro, Spine) |
| "The base units take into account a brief (<15 minutes) pre and post-operative visit." | 6 | A short visit is not a PA or POC modifier |
| "When multiple procedures are performed during one anaesthetic only ONE Base Unit should be charged according to the RVG. If a second procedure requires a change of patient position, modifying units may need to be added." | 6 | Multiple procedures: one base, plus a position modifier if position changes |
| "NB: If multiple procedures are performed on one case at one time, ONE base unit is charged plus time" | 11 | Same rule, at the end of the base-unit table |
| "Modifying units are to be used to recognise the time commitment involved in pre-operative and post-operative care. They should also be used to reflect the increase in intraoperative care that is required when patient co-morbidity or complexity is significant, e.g. ASA score, e.g. >2 · Extremes of age, e.g. <1, 1-2, 70-80, >80 · Elevated BMI, e.g. >35 · Frailty · Emergency operation." | 6 | General modifier definition |
| "The NZSA recognises that unexpected intraoperative crises do occur and no single RVG code has been generated to reflect this. However, should a crisis occur, the added time units, and medical transport code if applicable can reflect the increase in care and we consider it reasonable to add modifiers for the resuscitation and insertion of invasive monitoring, e.g. 2 units for an arterial line, 2 units for central line." | 6 | Crisis: time units, M3, and 2-unit modifiers |
| "Anaesthetic time commences when the anaesthetist begins exclusive and continuous care of the patient and ceases when the anaesthetist is no longer in professional attendance i.e. when the patient is safely placed under the supervision of other personnel. This includes time spent before and after surgery e.g. time related to straightforward consent, the insertion of blocks and time spent involved in PACU care post-surgery." | 6 | What counts as time |
| "Contract issues relating to start and finish times for anaesthesia need to be discussed by the individual anaesthetist or contracting arrangement e.g. joint venture/company/partnership with the Lead Provider of the contract." | 6 | Contracts may define time differently |
| "T7b Diagnostic TOE: Full Examination, Including Report [Nil Time Units ]" | 8 | A code that takes no time units |
| "M3 Medical Transport - Preparation, Monitoring, Ventilator, Circulatory Support" 4 + Time; CP1 to CP6 (Pain consultations and procedures) "4 + Time", "6 + Time", "8 + Time" | 11 | Base codes whose units are stated as base plus time |
| "If you feel that the fixed fee applied to your patient is unreasonably low, due to patient complexity, then it is reasonable to request a 'top up' which may utilise the RVG modifiers as a guide. For example, this might be +2 units for morbid obesity, + 2 time units for an otherwise simple tooth extraction. The critical step is discussing this with the contract holder/insurance provider prior to service provision." | 4 | Modifiers on fixed-price contracts are a negotiated top-up, agreed before the service |
| "Where it is known that two anaesthetists are needed for a case, whatever the circumstances, prior approval must be sought from the Lead Provider of that contract before surgery to ensure appropriate remuneration." | 4 | Goes with EAA1 |
| "It is strongly recommended that all modifying factors are itemised on your records and the patient's records. In addition, itemisation may be a mandatory requirement of contracts." | 12 | Each modifier is itemised (supports the "short explanation per modifier" proposal) |
| "N.B: The pre-operative, modifying and post-operative units are at the discretion of the individual anaesthetist." | 14 | Modifiers are the anaesthetist's call (the age lock is AA's rule, not the guide's) |
| Worked example 1: "Three-year-old child for grommets, ASA1, procedure time 20 minutes OT to PACU": Base Unit 4 · Time unit 2 · Modifier 0 · Total units 6 | 14 | Consistent with T1 and AS1 |
| Worked example 2: "Forty-five-year-old woman for laparoscopic hysterectomy, who attends for preoperative assessment prior to admission, ASA2 (asthma and HTN), BMI 37, anxious, procedure time 150 minutes OT to PACU, two post-operative visits for extensive pain management": Preop assess 2 · Base unit 6 · Time unit 11 · Modifying unit 2 (BMI) · Postop visit 2 · Total 23 | 14 | **Inconsistent with the table:** BMI 37 is OB2 = 1 unit, but the example claims 2 (BMI). Time 11 matches T1/T2. |

**Emergency and after-hours:** the guide has an "Emergency case" modifier (ASE, 2) and lists
"Emergency operation" on p6, but **no after-hours, night, weekend or public-holiday loading**
anywhere in the 15 pages. Any such loading AA uses is outside the RVG (e.g. Vanessa's list of AA
modifiers not in the RVG).

## Uncertainties and gaps to confirm

1. No "typical and maximum values for each body area" table exists in this edition (section 3).
2. Spine's included prone loading has no printed unit value; it is P1 (2 units), whose row says "It is included in Spine and Neuro Base units" (settled: P1 is included in every Neuro H7A to H9b and Spine S1 to S10 code).
3. Upper Limb "+2 if sitting": scope (all UL codes or UL4 only) is unclear from the layout.
4. Age band boundaries (exactly 1, 2, 70, 80) are ambiguous as printed.
5. Whether A1/A2 stack on the age-split base codes H6b and P2.
6. Frailty is named as a modifier with no code or units.
7. Worked example 2 gives BMI 37 two units; the table gives one.
8. Whether ASE (emergency) stacks with an ASA code; whether BMI bands are exclusive (assumed yes).
9. Duplicate codes across tables (A1, A2, P1, T1, T2, P6).
