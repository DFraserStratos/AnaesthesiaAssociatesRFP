/**
 * GENERATED, DO NOT EDIT. Written by `npm run rvg:modifiers`
 * (scripts/generate-rvg-modifiers.mjs) from the catalogue's artifact AR-34:
 *   requirements-board/requirements/artifacts/files/NZSA RVG 2021 modifiers.md
 *     (section "2a. The modifying factors table (pages 12 to 13)")
 *   requirements-board/requirements/artifacts/files/NZSA RVG 2021 included modifiers.csv
 * Values as printed; emphasis stripped, en and em dashes replaced with a hyphen.
 * The drift guard (rvgModifiers.test.ts) fails when a source file changes until
 * this is re-generated.
 */

export interface RvgModifierRow {
  code: string
  block: string
  factor: string
  unitsAsPrinted: string
  trigger: string
  /** The table's Source column says Automatic (age, from the date of birth). */
  automatic: boolean
  page: number
}

export interface RvgIncludedModifierRow {
  rvgCode: string
  groupName: string
  baseUnits: number
  includedModifier: string
  includedUnits: number
  note: string
  page: number
}

export const RVG_MODIFIER_ROWS: readonly RvgModifierRow[] = [
  {
    "code": "PA1",
    "block": "Pre-assessment",
    "factor": "Telephone Pre-assessment - Simple [<15 minutes]",
    "unitsAsPrinted": "1",
    "trigger": "Phone pre-assessment under 15 minutes",
    "automatic": false,
    "page": 12
  },
  {
    "code": "PA2",
    "block": "Pre-assessment",
    "factor": "Telephone Pre-assessment - Complex [>15 minutes]",
    "unitsAsPrinted": "2",
    "trigger": "Phone pre-assessment over 15 minutes",
    "automatic": false,
    "page": 12
  },
  {
    "code": "PA3",
    "block": "Pre-assessment",
    "factor": "Face-To-Face Pre-assessment - Prior To Day Of Surgery [Maximum 4 Units]",
    "unitsAsPrinted": "2 + Time",
    "trigger": "In-person pre-assessment before the day of surgery; 2 plus time, capped at 4 units in total",
    "automatic": false,
    "page": 12
  },
  {
    "code": "PA4",
    "block": "Pre-assessment",
    "factor": "Face-To-Face Pre-assessment - On Day Of Surgery - Complex [Complex Assessment + Management Of Significant Issues]",
    "unitsAsPrinted": "2",
    "trigger": "In-person complex assessment on the day of surgery",
    "automatic": false,
    "page": 12
  },
  {
    "code": "PA5",
    "block": "Pre-assessment",
    "factor": "Cancellation of Case on Day of Surgery [After Complex Pre-assessment]",
    "unitsAsPrinted": "2 [Max]",
    "trigger": "Case cancelled on the day, after a complex pre-assessment",
    "automatic": false,
    "page": 12
  },
  {
    "code": "A1",
    "block": "Age",
    "factor": "Age >1, and/but <2, 70-80-year-old",
    "unitsAsPrinted": "1",
    "trigger": "Patient age over 1 and under 2, or 70 to 80",
    "automatic": true,
    "page": 12
  },
  {
    "code": "A2",
    "block": "Age",
    "factor": "Age < 1 year old and/but > 80-year-old",
    "unitsAsPrinted": "2",
    "trigger": "Patient age under 1, or over 80",
    "automatic": true,
    "page": 12
  },
  {
    "code": "AS1",
    "block": "ASA",
    "factor": "ASA I or II",
    "unitsAsPrinted": "0",
    "trigger": "ASA physical status I or II",
    "automatic": false,
    "page": 12
  },
  {
    "code": "AS3",
    "block": "ASA",
    "factor": "ASA III",
    "unitsAsPrinted": "2",
    "trigger": "ASA III",
    "automatic": false,
    "page": 12
  },
  {
    "code": "AS4",
    "block": "ASA",
    "factor": "ASA IV",
    "unitsAsPrinted": "4",
    "trigger": "ASA IV",
    "automatic": false,
    "page": 12
  },
  {
    "code": "ASE",
    "block": "ASA",
    "factor": "Emergency case",
    "unitsAsPrinted": "2",
    "trigger": "Emergency case",
    "automatic": false,
    "page": 12
  },
  {
    "code": "OB1",
    "block": "BMI",
    "factor": "BMI < 35",
    "unitsAsPrinted": "0",
    "trigger": "Body mass index under 35",
    "automatic": false,
    "page": 12
  },
  {
    "code": "OB2",
    "block": "BMI",
    "factor": "BMI 35 - 40",
    "unitsAsPrinted": "1",
    "trigger": "BMI 35 to 40",
    "automatic": false,
    "page": 12
  },
  {
    "code": "OB3",
    "block": "BMI",
    "factor": "BMI > 40",
    "unitsAsPrinted": "2",
    "trigger": "BMI over 40",
    "automatic": false,
    "page": 12
  },
  {
    "code": "OB4",
    "block": "BMI",
    "factor": "BMI > 50",
    "unitsAsPrinted": "3",
    "trigger": "BMI over 50",
    "automatic": false,
    "page": 12
  },
  {
    "code": "AI1",
    "block": "Airway / position",
    "factor": "Awake Intubation - However accomplished",
    "unitsAsPrinted": "2",
    "trigger": "Awake intubation by any technique",
    "automatic": false,
    "page": 12
  },
  {
    "code": "P1",
    "block": "Airway / position",
    "factor": "Any position that is non-supine, non- lithotomy, or non-lateral IF not already accounted for (It is included in Spine and Neuro Base units)",
    "unitsAsPrinted": "2",
    "trigger": "Patient positioned other than supine, lithotomy or lateral (e.g. prone, sitting, park bench), unless the base units already include it",
    "automatic": false,
    "page": 12
  },
  {
    "code": "VM1",
    "block": "Monitoring",
    "factor": "Vascular monitoring (Art Line, CVL, PA Catheter) NOT EXPECTED of Anaesthesia/Procedure",
    "unitsAsPrinted": "2",
    "trigger": "Arterial line, central line or PA catheter not normally expected for the anaesthetic or procedure",
    "automatic": false,
    "page": 13
  },
  {
    "code": "TTE1",
    "block": "Echo",
    "factor": "Peri-operative Transthoracic Echocardiogram - i.e. Full Report + Formal Report [Accredited Anaesthetist ONLY]",
    "unitsAsPrinted": "6",
    "trigger": "Peri-operative TTE with full and formal report; accredited anaesthetist only",
    "automatic": false,
    "page": 13
  },
  {
    "code": "TTE2",
    "block": "Echo",
    "factor": "Non-operative Transthoracic Echocardiogram - i.e. in Emergent Situation To Assess Filling [Accredited Anaesthetist ONLY]",
    "unitsAsPrinted": "2",
    "trigger": "Emergent TTE to assess filling; accredited anaesthetist only",
    "automatic": false,
    "page": 13
  },
  {
    "code": "PACU1",
    "block": "Recovery",
    "factor": "Recovery Room Care - Provide documentation if >15 minutes being claimed for",
    "unitsAsPrinted": "As Per T1/T2",
    "trigger": "Recovery room care, billed at the time-unit rates; documentation needed if more than 15 minutes is claimed",
    "automatic": false,
    "page": 13
  },
  {
    "code": "EAA1",
    "block": "Post-op / cover",
    "factor": "Elective Additional Anaesthetic Assistance [Discuss with patient + payer pre-surgery if possible]",
    "unitsAsPrinted": "4",
    "trigger": "A second anaesthetist assisting electively",
    "automatic": false,
    "page": 13
  },
  {
    "code": "POC 1",
    "block": "Post-op / cover",
    "factor": "ICU Care: Anaesthetist In Hospital Providing Cover per day",
    "unitsAsPrinted": "25",
    "trigger": "Per day of in-hospital ICU cover",
    "automatic": false,
    "page": 13
  },
  {
    "code": "POC2a",
    "block": "Post-op / cover",
    "factor": "HDU Care: Anaesthetist At Home Providing Cover per day",
    "unitsAsPrinted": "4-6",
    "trigger": "Per day of HDU cover from home; 4 to 6 \"depending on patient complexity\" (AR-16#p6)",
    "automatic": false,
    "page": 13
  },
  {
    "code": "POC2b",
    "block": "Post-op / cover",
    "factor": "PLUS: Telephone Call Requiring Significant Management Change",
    "unitsAsPrinted": "1 [Per Call]",
    "trigger": "Add-on to POC2a, per call",
    "automatic": false,
    "page": 13
  },
  {
    "code": "POC2c",
    "block": "Post-op / cover",
    "factor": "PLUS: Face-To-Face Visit Resulting in Significant Management Change",
    "unitsAsPrinted": "4 + Time",
    "trigger": "Add-on to POC2a, per visit, plus time",
    "automatic": false,
    "page": 13
  },
  {
    "code": "POC3a",
    "block": "Post-op / cover",
    "factor": "Non-Complex Ward/PACU Review - Nerve Catheter/Epidural/IV Fluids/ Analgesia",
    "unitsAsPrinted": "1+ Time",
    "trigger": "Non-complex ward or PACU review, plus time",
    "automatic": false,
    "page": 13
  },
  {
    "code": "POC3b",
    "block": "Post-op / cover",
    "factor": "Complex Ward/PACU Review with significant documented management issues",
    "unitsAsPrinted": "2 + Time",
    "trigger": "Complex review with documented management issues, plus time",
    "automatic": false,
    "page": 13
  },
  {
    "code": "NC1",
    "block": "Nerve catheter",
    "factor": "In situ Plexus/Nerve Catheter patient in hospital",
    "unitsAsPrinted": "1",
    "trigger": "Plexus or nerve catheter in place while patient is in hospital",
    "automatic": false,
    "page": 13
  },
  {
    "code": "NC2",
    "block": "Nerve catheter",
    "factor": "In situ Plexus/Nerve Catheter at hospital discharge [1 Unit/day to maximum of 3 Units]",
    "unitsAsPrinted": "1",
    "trigger": "Catheter in place at discharge; 1 unit per day, at most 3 units",
    "automatic": false,
    "page": 13
  }
]

export const RVG_INCLUDED_MODIFIERS: readonly RvgIncludedModifierRow[] = [
  {
    "rvgCode": "H7A",
    "groupName": "Neurosurgery",
    "baseUnits": 10,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include Loading for Prone Positioning if needed (+2)",
    "page": 7
  },
  {
    "rvgCode": "H7b",
    "groupName": "Neurosurgery",
    "baseUnits": 12,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include Loading for Prone Positioning if needed (+2)",
    "page": 7
  },
  {
    "rvgCode": "H8a",
    "groupName": "Neurosurgery",
    "baseUnits": 12,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include Loading for Prone Positioning if needed (+2)",
    "page": 7
  },
  {
    "rvgCode": "H8b",
    "groupName": "Neurosurgery",
    "baseUnits": 14,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include Loading for Prone Positioning if needed (+2)",
    "page": 7
  },
  {
    "rvgCode": "H9a",
    "groupName": "Neurosurgery",
    "baseUnits": 20,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include Loading for Prone Positioning if needed (+2)",
    "page": 7
  },
  {
    "rvgCode": "H9b",
    "groupName": "Neurosurgery",
    "baseUnits": 22,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include Loading for Prone Positioning if needed (+2)",
    "page": 7
  },
  {
    "rvgCode": "S1",
    "groupName": "SPINE",
    "baseUnits": 8,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  },
  {
    "rvgCode": "S2",
    "groupName": "SPINE",
    "baseUnits": 8,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  },
  {
    "rvgCode": "S3a",
    "groupName": "SPINE",
    "baseUnits": 10,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  },
  {
    "rvgCode": "S3b",
    "groupName": "SPINE",
    "baseUnits": 12,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  },
  {
    "rvgCode": "S4",
    "groupName": "SPINE",
    "baseUnits": 16,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  },
  {
    "rvgCode": "S5",
    "groupName": "SPINE",
    "baseUnits": 20,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  },
  {
    "rvgCode": "S6",
    "groupName": "SPINE",
    "baseUnits": 8,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  },
  {
    "rvgCode": "S7",
    "groupName": "SPINE",
    "baseUnits": 8,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  },
  {
    "rvgCode": "S8a",
    "groupName": "SPINE",
    "baseUnits": 8,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  },
  {
    "rvgCode": "S8b",
    "groupName": "SPINE",
    "baseUnits": 10,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  },
  {
    "rvgCode": "S9a",
    "groupName": "SPINE",
    "baseUnits": 10,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  },
  {
    "rvgCode": "S9b",
    "groupName": "SPINE",
    "baseUnits": 12,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  },
  {
    "rvgCode": "S9c",
    "groupName": "SPINE",
    "baseUnits": 14,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  },
  {
    "rvgCode": "S10",
    "groupName": "SPINE",
    "baseUnits": 18,
    "includedModifier": "P1",
    "includedUnits": 2,
    "note": "These Base Units include loading for prone positioning if needed",
    "page": 9
  }
]
