#!/usr/bin/env python3
"""Generates requirements.csv and open-questions.csv for the AA future-state requirements.

Run from anywhere; writes the CSVs next to this script.
Edit the ROWS / QUESTIONS lists below, re-run, and the CSVs are rebuilt with safe quoting.
"""
import csv, os

OUT = os.path.dirname(os.path.abspath(__file__))

# Component vocabulary
SCH = "Scheduling Engine"
BIE = "Billing/Invoice Engine"
MOB = "Anaesthetist App (mobile + web)"
ADM = "Admin App"
XERO = "Xero Integration"
INT = "Health Integration"
MD = "Master Data"
NFR = "Cross-cutting"

# Status vocabulary
C = "Confirmed"      # from 2026-09 meeting notes / Q&A with Donald
R = "RFP"            # carried from RFP unchanged
P = "Proposed"       # Claude recommendation, needs sign-off
F = "Future"         # RFP scope that does not reflect current reality; keep, but later
O = "Open"           # depends on an open question

# Source shorthands
RFP_S = "RFP: Schedule Management"
RFP_B = "RFP: Billing Engine"
RFP_X = "RFP: Xero Integration"
RFP_H = "RFP: Health Systems Integration"
RFP_A = "RFP: Appendices"
RFP_O = "RFP: Project Overview"
NOTES = "Meeting notes 2026-09 (AA lead administrator)"
D2, D3, D4, D5, D6, D7 = ("Diagram: High level process", "Diagram: Entity infographic",
    "Diagram: Mid level process", "Diagram: Booking/List update", "Diagram: Booking & List lifecycle",
    "Diagram: Billing route")
QA = "Q&A 2026-09-24"
DATA = "Data files (fee schedules, NZSA RVG 2021)"

ROWS = []
def epic(id, title, desc, comp, status, source):
    ROWS.append([id, "Epic", "", title, desc, "", comp, status, source])
def feat(id, parent, title, desc, comp, status, source, notes=""):
    ROWS.append([id, "Feature", parent, title, desc, notes, comp, status, source])
def story(id, parent, title, desc, comp, status, source, notes=""):
    ROWS.append([id, "Story", parent, title, desc, notes, comp, status, source])

# ---------------------------------------------------------------- EP-01
epic("EP-01", "Schedule canvas and Lists",
     "Maintain the rolling four-month schedule: every active anaesthetist has an AM and PM List on every day, whether or not anything is booked. Lists carry availability, and once assigned carry exactly one surgeon and one hospital.",
     SCH, C, f"{RFP_S}; {D3}; {D4}; {QA} #7")
feat("FT-01.1", "EP-01", "Rolling canvas generation",
     "The Scheduling Engine pre-generates the fixed Schedule > Day > Anaesthetist > List structure on a rolling four-month horizon.", SCH, R, RFP_S)
story("US-01.1.1", "FT-01.1", "Two Lists per anaesthetist per day",
      "As the system, I create exactly two Lists (AM and PM) for every active anaesthetist on every day in the horizon, even when they hold no bookings, so the calendar renders a complete picture with no gaps.", SCH, R, RFP_S,
      "About 85 x 120 x 2 = 20,000 List records at current roster size.")
story("US-01.1.2", "FT-01.1", "Horizon rolls forward daily",
      "As the system, I extend the horizon each day and project Permanent Lists into the new days, so standing arrangements appear automatically.", SCH, R, RFP_S)
story("US-01.1.3", "FT-01.1", "New anaesthetist gets a populated canvas",
      "As an admin, when I add an anaesthetist their forward Lists are created immediately, so the canvas is ready to accept bookings.", SCH, R, RFP_S)
story("US-01.1.4", "FT-01.1", "List default times",
      "As an admin, I can set default AM and PM start and end times that can be overridden per List, and an all-day booking simply uses both Lists.", SCH, R, RFP_S)

feat("FT-01.2", "EP-01", "List availability status",
     "Availability is set at the half-day List level, independent of whether the List holds bookings. Whether this is the same thing as the RFP's separate Anaesthetist Availability calendar is OQ-27.", SCH, R, RFP_S)
story("US-01.2.1", "FT-01.2", "Anaesthetist sets half-day availability",
      "As an anaesthetist, I set each List to available, available for emergency, unavailable or on leave from my app, so the office sees my availability immediately.", MOB, R, RFP_S,
      "Exact status set is master data and still to be confirmed (RFP lists private, public, pre-op, holiday, unavailable, free as candidates).")
story("US-01.2.2", "FT-01.2", "List status master data",
      "As an admin, I maintain the ListStatus table (description, colour) so statuses can be added or renamed without code changes.", MD, R, RFP_S)
story("US-01.2.3", "FT-01.2", "Status is independent of bookings",
      "As the system, I never derive List status from booking activity, so 'on leave Tuesday PM' is meaningful with zero bookings.", SCH, R, RFP_S)

feat("FT-01.3", "EP-01", "List assignment",
     "An unassigned List has no surgeon or hospital. Once assigned it is exactly one anaesthetist + one surgeon + one hospital + one day + one session.", SCH, C, f"{D3}; {QA} #7")
story("US-01.3.1", "FT-01.3", "Assigned List pairing rule",
      "As the system, I enforce that an assigned List has exactly one surgeon and one hospital, so bookings on it inherit an unambiguous location and surgeon.", SCH, C, f"{D3}; {QA} #7", "Theatre is not recorded (RFP).")
story("US-01.3.2", "FT-01.3", "Permanent Lists drive most assignments",
      "As an admin, I maintain Permanent Lists (hospital, day of week, anaesthetist, AM/PM, surgeon) so roughly 80% of assignments populate automatically.", MD, R, RFP_S)
story("US-01.3.3", "FT-01.3", "Manual List assignment",
      "As an admin, I assign a surgeon and hospital to an available List when a surgeon's rooms call, so ad hoc sessions are captured.", ADM, R, RFP_S)
story("US-01.3.4", "FT-01.3", "AM and PM can differ",
      "As an admin, I can assign AM and PM Lists on the same day to different surgeons and/or hospitals.", SCH, C, D3)

feat("FT-01.4", "EP-01", "List reassignment and locum search",
     "Lists move between anaesthetists at short notice without disturbing their bookings or history.", SCH, R, RFP_S)
story("US-01.4.1", "FT-01.4", "Reassign a List with its bookings",
      "As an admin, I reassign a List (with all its bookings) to another anaesthetist, and the bookings, status history and audit trail are preserved.", ADM, R, RFP_S,
      "Mechanism is an RFP open question; see OQ-08.")
story("US-01.4.2", "FT-01.4", "Availability finder",
      "As an admin or anaesthetist, I see AM/PM availability across all anaesthetists for a given day, so I can find a locum for illness cover.", f"{ADM}; {MOB}", R, f"{RFP_S}; {RFP_A}")

story("US-01.4.3", "FT-01.4", "Anaesthetist requests a swap",
      "As an anaesthetist, from the availability view I request that a List be swapped to a colleague, and the office confirms the reassignment.", MOB, P, f"{RFP_O} ('displays the availability of other anaesthetists where swaps are needed')")

feat("FT-01.5", "EP-01", "Hospital holiday calendar and conflicts",
     "Each hospital's closures are held separately and reconciled against the canvas as flagged conflicts.", MD, R, RFP_S)
story("US-01.5.1", "FT-01.5", "Hospital holiday calendar",
      "As an admin, I maintain each hospital's closure and holiday dates independently.", MD, R, RFP_S)
story("US-01.5.3", "FT-01.5", "Anaesthetist availability calendar",
      "As an anaesthetist, I maintain my own availability calendar in the app, independent of any List assignment, and the system reconciles it against my Lists as flagged conflicts.", MOB, O, f"{RFP_S} (master data table; principle 7)",
      "RFP keeps Anaesthetist Availability separate from List Status; the catalogue's FT-01.2 folds them together. Which reading is intended is OQ-27.")
story("US-01.5.2", "FT-01.5", "Conflict flagging",
      "As the system, I flag Lists that conflict with a hospital closure or the anaesthetist's own unavailability rather than silently merging the data.", SCH, O, RFP_S, "Hard block vs soft warning is open; see OQ-09.")

# ---------------------------------------------------------------- EP-02
epic("EP-02", "Booking intake and change handling",
     "Bookings arrive from hospital downloads, surgeon PDFs, admin entry and anaesthetist ad hoc entry. Every change (new, modify, reschedule, cancel) is applied to the schedule with its source recorded, right up to the procedure.",
     SCH, C, f"{D4}; {D5}; {QA} #4")
feat("FT-02.1", "EP-02", "Hospital booking download and matching screen",
     "The current real pathway: AA staff download bookings from the hospital and match them to Lists and Bookings on a matching screen. No live integration exists today.", ADM, C, f"{QA} #4")
story("US-02.1.1", "FT-02.1", "Import a hospital booking download",
      "As an admin, I import a downloaded hospital booking file so its rows appear in the matching screen.", ADM, C, f"{QA} #4", "File format(s) to be confirmed; see OQ-13.")
story("US-02.1.2", "FT-02.1", "Match rows to Lists and Bookings",
      "As an admin, for each imported row I match it to an existing List and Booking, create a new Booking on an existing List, create a new List, or reject it, so the schedule reflects the hospital's data.", ADM, C, f"{QA} #4")
story("US-02.1.3", "FT-02.1", "Show differences on match",
      "As an admin, when a row matches an existing Booking I see the field-level differences (time, patient, procedure) before applying them.", ADM, P, f"{QA} #4")
story("US-02.1.4", "FT-02.1", "Unmatched queue",
      "As an admin, rows that cannot be matched automatically stay in a queue for manual intervention and are never silently dropped.", ADM, C, f"{D5}")

feat("FT-02.2", "EP-02", "Surgeon PDF list ingest",
     "Surgeons' rooms email PDF lists. The system reads them, lets staff edit, and ingests them as Bookings.", ADM, R, f"{RFP_H}; {D4}")
story("US-02.2.1", "FT-02.2", "Read a PDF list",
      "As an admin, I upload an emailed PDF list and the system extracts the bookings for review.", ADM, R, RFP_H)
story("US-02.2.2", "FT-02.2", "Edit then ingest",
      "As an admin, I correct extracted fields before ingesting them into the schedule.", ADM, R, RFP_H)

feat("FT-02.3", "EP-02", "Manual booking entry by admin",
     "Admin staff create and amend Bookings directly when they arrive by phone or email.", ADM, R, f"{RFP_S}; {D4}")
story("US-02.3.1", "FT-02.3", "Create or amend a Booking",
      "As an admin, I create a Booking on a List or amend an existing one (patient, time, procedures, contract) with the change recorded against me.", ADM, R, RFP_S)

feat("FT-02.4", "EP-02", "Anaesthetist ad hoc booking",
     "Anaesthetists add missing Bookings from the app, optionally from a photo of the physical hospital or surgeon card.", MOB, R, f"{RFP_B}; {D4}; {D5}")
story("US-02.4.1", "FT-02.4", "Add a Booking from scratch",
      "As an anaesthetist, I add a Booking to my List when the hospital's list differs from my app, and it flows back to the Scheduling Engine.", MOB, R, RFP_B)
story("US-02.4.2", "FT-02.4", "Photo capture of the physical card",
      "As an anaesthetist, I photograph the hospital or surgeon card and the system pre-fills the Booking for me to confirm.", MOB, R, f"{RFP_B}; {D4}")
story("US-02.4.3", "FT-02.4", "Copy a Booking",
      "As an anaesthetist, I copy a Booking's skeleton (patient, list, references) without its procedure details to quickly add another Booking.", MOB, R, RFP_B)

feat("FT-02.5", "EP-02", "Change types and audit",
     "Every inbound change is classified and applied: new, modification, reschedule (date, List and/or time) or cancellation, with source and history recorded.", SCH, C, D5)
story("US-02.5.1", "FT-02.5", "Apply a modification",
      "As the system, I update an existing Booking from any source and record who or what changed it, when, and what changed.", SCH, C, f"{D5}; {RFP_S}")
story("US-02.5.2", "FT-02.5", "Apply a reschedule",
      "As the system, I move a Booking to a new date, List and/or time, keeping its history intact.", SCH, C, D5)
story("US-02.5.3", "FT-02.5", "Record a cancellation",
      "As the system, I record a cancellation and update the schedule; the Booking remains visible in history.", SCH, C, D5, "No cancellation fees known today; see OQ-01.")
story("US-02.5.4", "FT-02.5", "Changes accepted until the procedure",
      "As the system, I accept booking changes from all sources right up to the start of the session, so late bookings are supported.", SCH, R, f"{RFP_S}; {RFP_H}")
story("US-02.5.5", "FT-02.5", "Append-only change history",
      "As the system, I keep an append-only change log for Bookings and Procedures (including contract selection and adjustments), so an invoice can be reproduced against what was true when raised.", SCH, R, RFP_S)
story("US-02.5.6", "FT-02.5", "Concurrent edits",
      "As the system, I handle the same Booking being edited by two sources close together without losing either change silently.", SCH, O, RFP_S, "Mechanism open; see OQ-07.")

# ---------------------------------------------------------------- EP-03
epic("EP-03", "Booking and Procedure capture (anaesthetist)",
     "The anaesthetist sees their Lists and Bookings, records the clinical billing data for each Procedure, sees and can change the Contract, applies any permitted adjustment, and marks Bookings complete.",
     MOB, C, f"{RFP_B}; {D4}; {D6}; {D7}; {NOTES}")
feat("FT-03.1", "EP-03", "View schedule, Lists and Bookings",
     "Mobile and web views of upcoming work including Bookings, Procedures and selected Contracts.", MOB, R, f"{RFP_A}; {D4}")
story("US-03.1.1", "FT-03.1", "Schedule to List to Booking drill-down",
      "As an anaesthetist, I navigate from my schedule to a List, to a Booking, to its Procedures.", MOB, R, RFP_A)
story("US-03.1.2", "FT-03.1", "See the Contract on each Procedure",
      "As an anaesthetist, I see which Contract is applied to each Procedure before and after the session.", MOB, C, f"{D4}; {QA} #4")
story("US-03.1.3", "FT-03.1", "Attachments",
      "As an anaesthetist, I attach files or photos to a Booking or List.", MOB, R, RFP_O)
story("US-03.1.4", "FT-03.1", "Web app parity",
      "As an anaesthetist, everything I can do on mobile I can also do on the web app.", MOB, R, RFP_B)

feat("FT-03.2", "EP-03", "Booking structure: primary and additional procedures",
     "A Booking has exactly one primary Procedure and zero or more additional Procedures in the same anaesthetic episode.", SCH, C, f"{NOTES}; {D3}")
story("US-03.2.1", "FT-03.2", "One primary Procedure",
      "As the system, I require every Booking with procedures to have exactly one primary Procedure, which anchors base units and modifiers.", SCH, C, NOTES)
story("US-03.2.2", "FT-03.2", "Anyone with edit rights can set the primary",
      "As an admin, anaesthetist or inbound source, I can set or change which Procedure is primary while the Booking is editable.", f"{SCH}; {MOB}; {ADM}", C, NOTES)
story("US-03.2.3", "FT-03.2", "Add additional Procedures",
      "As an anaesthetist or admin, I add further Procedures to a Booking, each with its own Contract.", f"{MOB}; {ADM}", C, D3)

feat("FT-03.3", "EP-03", "Record clinical billing data per Procedure",
     "Base code, times, ASA, modifiers and other billing lines are captured on each Procedure.", MOB, R, f"{RFP_B}; {D7}")
story("US-03.3.1", "FT-03.3", "Select an RVG code",
      "As an anaesthetist, I pick the RVG code from a curated, searchable dropdown grouped by anatomical site and other groupings, and the base units are seeded from it.", MOB, C, f"{RFP_B}; {QA} #2 #5")
story("US-03.3.2", "FT-03.3", "Override a ranged base code",
      "As an anaesthetist, when the RVG code has a unit range (e.g. 6 to 8) I choose the exact value within it.", MOB, R, RFP_B)
story("US-03.3.3", "FT-03.3", "Record anaesthetic start and handover times",
      "As an anaesthetist, I record the time I took exclusive care and the time of handover at PACU, and time units are calculated from them.", MOB, R, RFP_B)
story("US-03.3.4", "FT-03.3", "ASA seeds the modifier field",
      "As an anaesthetist, I enter the ASA score in its own field and it seeds the modifier (M) units, which I can then adjust to add other modifiers.", MOB, R, RFP_B)
story("US-03.3.5", "FT-03.3", "Itemise modifiers",
      "As an anaesthetist, I itemise modifier codes (age, BMI, emergency, positioning, awake intubation, pre-assessment) rather than only a total, because contracts may require itemisation.", MOB, P, f"{RFP_B}; {DATA}")
story("US-03.3.6", "FT-03.3", "Other billing lines",
      "As an anaesthetist, I add non-BTM billing lines to a Procedure (post-op ward or HDU reviews, nerve catheters, pain consults, medical transport, contract add-on fees) including ones dated days after the procedure.", MOB, R, RFP_B)
story("US-03.3.7", "FT-03.3", "Rate x time capture",
      "As an anaesthetist whose Contract permits an hourly arrangement, I capture the charge as a rate x time billing line through the same capture path.", MOB, R, RFP_B)

feat("FT-03.4", "EP-03", "Contract on the Procedure",
     "The Contract is normally set by admin at booking setup, visible to the anaesthetist, who may change it; admin approves the selection (timing is OQ-26).", f"{MOB}; {ADM}", O, f"{D7}; {QA} #4")
story("US-03.4.1", "FT-03.4", "Anaesthetist can change the Contract",
      "As an anaesthetist, I can change the Contract on a Procedure from the filtered list of relevant Contracts, and the change is audited and flagged for office review.", MOB, C, f"{QA} #4")

feat("FT-03.5", "EP-03", "Anaesthetist adjustment",
     "When the Contract allows it, the anaesthetist can discount or fix the final price after recording BTM in full.", MOB, C, f"{D7}; {QA} #3 #6")
story("US-03.5.1", "FT-03.5", "Adjustment field appears when permitted",
      "As an anaesthetist, when the selected Contract allows adjustment I see an extra field to enter a percentage discount or a fixed final price.", MOB, C, f"{QA} #3")
story("US-03.5.2", "FT-03.5", "BTM still recorded in full",
      "As the system, I keep the full base, time and modifier record even when a 100% discount is applied, so the work is still recorded.", BIE, C, f"{QA} #6")
story("US-03.5.3", "FT-03.5", "Adjustment reason",
      "As an anaesthetist, I record a reason with any adjustment for the office and the audit trail.", MOB, P, f"{RFP_S} (priceOverride note)")

feat("FT-03.6", "EP-03", "Booking completeness validation",
     "The app validates minimum billing data before a Booking can be marked complete.", MOB, C, f"{RFP_B}; {D6}")
story("US-03.6.1", "FT-03.6", "Mark a Booking complete",
      "As an anaesthetist, I mark a Booking complete only when every Procedure has a Contract, an RVG code or fee line, times, and any Contract-required inputs.", MOB, C, f"{RFP_B}; {D6}; {D7}")
story("US-03.6.2", "FT-03.6", "Incomplete Bookings listed",
      "As an anaesthetist, I see which Bookings on a List are still incomplete and what is missing.", MOB, C, D6)

# ---------------------------------------------------------------- EP-04
epic("EP-04", "Contracts",
     "The Contract is the single object that defines billing rules, pricing and invoice recipient for a Procedure. It replaces the RFP's separate billing-route resolution. Contracts are master data managed by AA; each Procedure selects exactly one.",
     MD, C, f"{D3}; {D7}; {QA} #2 #3 #4")
feat("FT-04.1", "EP-04", "Contract catalogue",
     "Admin creates and manages the catalogue of Contracts across the confirmed categories.", ADM, C, f"{QA} #2")
story("US-04.1.1", "FT-04.1", "Contract categories",
      "As an admin, I create Contracts in these categories: RVG Default Post-paid, RVG Default Pre-paid, RVG Default Hospital, Hospital, Surgeon Solo, Surgeon Group, Insurance.", MD, O, f"{QA} #2",
      "ACC arrangements are Hospital or contract-holder Contracts with ACC pricing, not a separate category (RFP). The Pre-paid category conflicts with Q&A #5 (prepaid is a procedure property); see OQ-25.")
story("US-04.1.2", "FT-04.1", "Create, edit, retire Contracts",
      "As an admin, I create, edit, version and retire Contracts with effective-from, effective-to and review dates, so fee schedule updates (e.g. 1 April) are applied cleanly.", ADM, C, f"{QA} #2; {DATA}")
story("US-04.1.3", "FT-04.1", "Contract audit and versioning",
      "As the system, I keep every Contract version so an invoice raised under an older version is reproducible.", MD, R, RFP_S)

feat("FT-04.2", "EP-04", "Contract definition",
     "Recommended field set for a Contract. See domain-model.md for the full structure.", MD, P, f"{QA} #3; {DATA}")
story("US-04.2.1", "FT-04.2", "Holder and applicability scope",
      "As an admin, I define who holds the Contract (hospital, surgeon or surgeon group, insurer, or the Booking's billable party) and where it applies (hospitals, surgeons, insurers, RVG codes or groups, funding source, anaesthetists).", MD, P, f"{QA} #2 #3")
story("US-04.2.2", "FT-04.2", "Pricing basis",
      "As an admin, I set the pricing basis: RVG units x anaesthetist unit value; RVG units x contract rate or discount; fixed fee schedule; or rate x time.", MD, P, f"{QA} #3; {RFP_B}; {DATA}")
story("US-04.2.3", "FT-04.2", "Base unit override",
      "As an admin, I can set Contract-specific base units for an RVG code or group where the Contract departs from the NZSA value.", MD, P, f"{QA} #3")
story("US-04.2.4", "FT-04.2", "Fixed fee schedule lines",
      "As an admin, I enter fee schedule lines with the holder's own code, description, price (GST excl and incl), optional RVG mapping, optional time band, add-on flag and quantity rule.", MD, P, DATA,
      "Real examples: SXAP AP codes, CES HNZ codes, ACC OPT codes, Merivale set fees, vitrectomy time bands, GA add-on fees, liposuction per area.")
story("US-04.2.5", "FT-04.2", "Multi-procedure rule per Contract",
      "As an admin, I set how additional procedures are priced under this Contract: RVG default rule, percentage of second code (e.g. 50%), add-on fee, or not billable.", MD, P, f"{DATA}; {NOTES}")
story("US-04.2.6", "FT-04.2", "Adjustment and override permissions",
      "As an admin, I set whether the anaesthetist may apply a discount or fixed final price, and whether office price override is allowed.", MD, C, f"{QA} #3; {D7}")
story("US-04.2.7", "FT-04.2", "Required booking inputs",
      "As an admin, I declare which per-Booking inputs the Contract requires (invoice email, billable party, prepaid amount, insurer member or claim reference), so the app prompts for them and blocks completion until present.", MD, P, f"{QA} #2")
story("US-04.2.8", "FT-04.2", "Invoice presentation and delivery",
      "As an admin, I set the invoice layout (contract holder vs patient), delivery method (email, portal upload for the direct insurer) and GST treatment.", MD, P, f"{RFP_B}; {RFP_X}")
story("US-04.2.9", "FT-04.2", "Organisational and individual Contracts",
      "As an admin, I can scope a Contract to the organisation (default) or to specific anaesthetists, to allow for individual arrangements later.", MD, R, RFP_B)

feat("FT-04.3", "EP-04", "Contract selection on a Procedure",
     "Exactly one Contract per Procedure, chosen from a filtered list and defaulted where derivable.", f"{ADM}; {MOB}", C, f"{D3}; {D7}; {QA} #2 #4")
story("US-04.3.1", "FT-04.3", "Exactly one Contract per Procedure",
      "As the system, I require each Procedure to reference exactly one Contract before its Booking can be complete.", SCH, C, D3)
story("US-04.3.2", "FT-04.3", "Filtered Contract list",
      "As an admin or anaesthetist, when I pick a Contract I see only those relevant to the List's hospital, the surgeon, the patient's insurer or funding and the RVG code.", f"{ADM}; {MOB}", C, f"{QA} #2")
story("US-04.3.3", "FT-04.3", "Default hospital Contract derived from location",
      "As the system, I default a Procedure to the RVG Default Hospital Contract for the List's hospital where no other Contract applies.", SCH, C, f"{QA} #2")
story("US-04.3.4", "FT-04.3", "Admin sets Contracts at booking setup",
      "As an admin, I apply the Contract to each Procedure when the Booking is created or matched, before the procedure day.", ADM, C, f"{D7}; {QA} #4")
story("US-04.3.5", "FT-04.3", "Contract locked at AUTHORISED",
      "As the system, I snapshot the selected Contract version onto the Procedure when the List is AUTHORISED so later Contract edits cannot change the invoice.", BIE, C, f"{D7}; {RFP_S}")

feat("FT-04.4", "EP-04", "Every hospital and direct insurer has a default Contract",
     "Guarantees a Contract always resolves for hospital-located work.", MD, R, RFP_S)
story("US-04.4.1", "FT-04.4", "Mandatory default Contract",
      "As an admin, when I create a hospital or a direct-billing insurer the system creates its RVG Default Hospital (or Insurance default) Contract so there is never a 'no contract' branch.", MD, P, RFP_S, "RFP mandates the default Contract as a one-off admin step; auto-creation is our proposal.")

# ---------------------------------------------------------------- EP-05
epic("EP-05", "RVG master data and fee calculation rules",
     "The NZSA RVG codes, AA's additional codes, and the pure calculation rules (base, time, modifiers, multi-procedure split, pricing bases, adjustments). All calculation is deterministic and testable.",
     BIE, C, f"{RFP_B}; {NOTES}; {QA} #1 #2; {DATA}")
feat("FT-05.1", "EP-05", "RVG code master",
     "NZSA RVG 2021 codes plus AA-maintained additions, with grouping for search and prepaid selection.", MD, C, f"{QA} #2 #5; {DATA}")
story("US-05.1.1", "FT-05.1", "Load NZSA RVG codes",
      "As an admin, the NZSA RVG code set (code, description, section, base units or range, absorbed positioning loading) is loaded as master data.", MD, C, f"{QA} #2; {DATA}")
story("US-05.1.2", "FT-05.1", "Add AA codes",
      "As an admin, I add procedure codes that the NZSA guide does not cover and assign their base units, marked as AA-sourced.", MD, C, f"{QA} #2")
story("US-05.1.3", "FT-05.1", "Group codes",
      "As an admin, I tag codes into groups (anatomical site from the guide, plus AA groups such as cosmetic, dental, plastics) so they are searchable and selectable as a set.", MD, C, f"{QA} #5")
story("US-05.1.4", "FT-05.1", "Absorbed modifiers",
      "As the system, I know which base codes already include a loading (e.g. spine and neuro include prone positioning) so P1 is not double-charged.", BIE, R, f"{RFP_B}; {DATA}")
story("US-05.1.5", "FT-05.1", "Modifier code master",
      "As an admin, the modifier code set (PA1-PA5, A1-A2, AS1-AS4, ASE, OB1-OB4, AI1, P1, VM1, TTE1-2, PACU1, EAA1, POC1-3, NC1-2) with unit values is master data.", MD, R, f"{RFP_B}; {DATA}")

feat("FT-05.2", "EP-05", "Unit and fee calculation",
     "Fee = (base + time + modifier units) x unit value, unless the Contract's pricing basis says otherwise.", BIE, R, RFP_B)
story("US-05.2.1", "FT-05.2", "Per-anaesthetist unit value",
      "As the system, I price RVG units at the individual anaesthetist's own dollar value per unit, never a shared price list (Commerce Act).", BIE, R, RFP_B)
story("US-05.2.2", "FT-05.2", "Tiered time units",
      "As the system, I calculate 1 unit per 15 minutes or part thereof for the first two hours, then 1 unit per 10 minutes or part thereof from the start of the third hour.", BIE, R, f"{RFP_B}; {DATA}")
story("US-05.2.3", "FT-05.2", "Conditional positioning modifier",
      "As the system, I only add P1 when the base code does not already include a positioning loading.", BIE, R, RFP_B)
story("US-05.2.4", "FT-05.2", "Contract rate or discount",
      "As the system, when the Contract has an agreed rate or discount I apply it instead of the anaesthetist's unit value.", BIE, R, f"{RFP_S}; {RFP_B}")
story("US-05.2.5", "FT-05.2", "Fixed fee schedule pricing",
      "As the system, when the Contract is a fixed fee schedule I price from the matched schedule line (including time band and add-ons) and ignore RVG units for pricing, while still recording BTM.", BIE, C, f"{QA} #3 #6; {DATA}")
story("US-05.2.6", "FT-05.2", "Rate x time pricing",
      "As the system, when a Contract permits an individually arranged rate I price a billing line as rate x duration.", BIE, R, RFP_B)
story("US-05.2.7", "FT-05.2", "GST",
      "As the system, I hold prices GST exclusive and derive inclusive amounts, since fee schedules are published both ways and anaesthetists report GST.", BIE, P, f"{DATA}; {RFP_X}")

feat("FT-05.3", "EP-05", "Multi-procedure rule (supersedes RFP split-billing rule)",
     "Within one Booking: base units only on the primary; time units on every Procedure; modifiers on the primary unless total modifier units exceed 4, in which case they are split equally across all Procedures with the remainder to the primary.", BIE, C, f"{NOTES}; {QA} #1")
story("US-05.3.1", "FT-05.3", "Base units on primary only",
      "As the system, I never allow base units on an additional Procedure in a Booking; the field is not editable there.", BIE, C, f"{QA} #1; {RFP_B}")
story("US-05.3.2", "FT-05.3", "Time units on every Procedure",
      "As the system, I calculate time units for each Procedure from its own recorded times.", BIE, C, f"{QA} #1")
story("US-05.3.3", "FT-05.3", "Modifier split above four units",
      "As the system, when total modifier units are 4 or fewer they all sit on the primary; when more than 4 I divide them equally across all Procedures in the Booking and allocate any remainder to the primary.", BIE, C, f"{NOTES}; {QA} #1",
      "Worked example in domain-model.md: 7 modifier units over 3 procedures = 3 / 2 / 2.")
story("US-05.3.4", "FT-05.3", "Contract-specific second-procedure rules",
      "As the system, when the Contract defines its own rule (e.g. 50% of the second AP code, or an add-on fee) I apply that instead of the RVG default.", BIE, P, DATA)
story("US-05.3.5", "FT-05.3", "Ledger tracks each Procedure's share",
      "As the system, I record the units and dollars attributed to each Procedure so that Procedures on different Contracts each carry the right amount.", BIE, C, D7)

feat("FT-05.4", "EP-05", "Adjustments and overrides",
     "Anaesthetist adjustment and office price override are applied after the base calculation and fully audited.", BIE, C, f"{D7}; {QA} #3 #6")
story("US-05.4.1", "FT-05.4", "Apply anaesthetist adjustment",
      "As the system, I apply a percentage discount or replace the total with a fixed final price, only when the locked Contract allows it, and record the pre-adjustment figure.", BIE, C, f"{QA} #3 #6")
story("US-05.4.2", "FT-05.4", "Office price override",
      "As an admin, I can apply a discretionary override (fixed final fee, dollar adjustment or percentage) with a reason during review.", ADM, O, f"{RFP_S}; {D7}",
      "RFP says priceOverride is independent of any Contract; Diagram 7 lists 'whether discount / price override is allowed' on the Contract. Gating is OQ-16.")

feat("FT-05.5", "EP-05", "ACC",
     "ACC is billed via the contract holder's Contract using standard BTM; no separate calculation path.", BIE, R, RFP_B)
story("US-05.5.1", "FT-05.5", "ACC through the holder's Contract",
      "As the system, I treat ACC-funded procedures as ordinary Procedures priced by the hospital or contract holder's ACC Contract.", BIE, R, RFP_B)
story("US-05.5.2", "FT-05.5", "ACC pre-op flat fee codes",
      "As an anaesthetist, I can bill ACC pre-operative assessments using CS250, CS260 and CS70 as billing lines.", MOB, O, f"{RFP_B}; {DATA}", "Confirm with AA billing; see OQ-12.")

# ---------------------------------------------------------------- EP-06
epic("EP-06", "Prepayment",
     "Certain procedures (typically cosmetic, plastics, dental) are prepaid. Which ones is an anaesthetist-level setting keyed on RVG codes or groups. Prepayment is invoiced at booking setup, tracked before the procedure, and settled against the final amount afterwards.",
     BIE, C, f"{D7}; {NOTES}; {QA} #5")
feat("FT-06.1", "EP-06", "Prepaid procedure settings on the anaesthetist profile",
     "Anaesthetists choose which RVG codes or groups require prepayment.", MOB, C, f"{NOTES}; {QA} #5")
story("US-06.1.1", "FT-06.1", "Tick codes or groups",
      "As an anaesthetist, I mark individual RVG codes or whole groups (e.g. all cosmetic) as prepaid in my profile.", MOB, C, f"{QA} #5")
story("US-06.1.2", "FT-06.1", "Admin can maintain on behalf",
      "As an admin, I can view and edit an anaesthetist's prepaid settings on their behalf.", ADM, P, f"{QA} #5")

feat("FT-06.2", "EP-06", "Prepayment trigger and amount",
     "When a Booking's procedure matches a prepaid setting, prepayment is required and an amount is set.", BIE, C, f"{D7}; {QA} #5")
story("US-06.2.1", "FT-06.2", "Detect prepayment requirement",
      "As the system, when any Procedure's RVG code on a Booking is in the anaesthetist's prepaid set, I flag the Booking as requiring prepayment.", BIE, C, f"{D7}; {QA} #5; {RFP_B} (additional elective procedure case)",
      "Q&A #5: prepaid is a property of the procedure choice, not the contract. Whether a Pre-paid Contract category also triggers it is OQ-25.")
story("US-06.2.2", "FT-06.2", "Set the prepaid amount",
      "As an admin or anaesthetist, I set the prepaid amount as an estimated full fee (default, derived from the Contract or RVG estimate) or a deposit, and it is stored on the Booking.", f"{ADM}; {MOB}", C, f"{QA} #5")
story("US-06.2.3", "FT-06.2", "Prepayment is an estimate",
      "As the system, I treat a 'full' prepayment as an estimate: the final amount is calculated after the procedure and may be more or less.", BIE, C, f"{QA} #5")

feat("FT-06.3", "EP-06", "Prepayment invoicing and tracking",
     "Prepayment invoices flow through the same ledger and Xero pairing as final invoices.", BIE, C, D7)
story("US-06.3.1", "FT-06.3", "Raise the prepayment invoice",
      "As the system, I raise a prepayment invoice to the billable party at booking setup, with a linked receivable and payable in the internal ledger and the matching Xero pair.", BIE, C, D7)
story("US-06.3.2", "FT-06.3", "Track prepayment status",
      "As an admin, I see for each upcoming prepaid Booking whether the prepayment is unpaid, part paid or paid.", ADM, C, f"{D7}; {QA} #9")
story("US-06.3.3", "FT-06.3", "Alert on unpaid prepayment",
      "As an admin, I am alerted when a prepayment is still outstanding as the procedure approaches so I can follow up or the anaesthetist can decide to cancel.", ADM, C, f"{QA} #9; {DATA} (Merivale terms)")
story("US-06.3.4", "FT-06.3", "Re-check after each receipt",
      "As the system, after each prepayment receipt is reconciled I re-check whether any prepayment requirement is still outstanding.", BIE, C, D7)
story("US-06.3.5", "FT-06.3", "Re-check when the Booking changes",
      "As the system, I re-check the prepayment requirement and amount whenever the Booking's procedures or Contract change before the procedure.", BIE, P, "Claude")

feat("FT-06.4", "EP-06", "Settlement after the procedure",
     "Final amount less prepaid amount is invoiced or credited.", BIE, C, f"{D7}; {QA} #5")
story("US-06.4.1", "FT-06.4", "Invoice the remaining balance",
      "As the system, after AUTHORISED I calculate the final amount, deduct the prepaid amount, and invoice the remaining balance if positive.", BIE, C, f"{D7}; {QA} #5")
story("US-06.4.2", "FT-06.4", "Credit or refund when prepaid exceeds final",
      "As the system, when the prepaid amount exceeds the final amount I create a credit and surface it for refund handling.", BIE, O, f"{QA} #5", "Refund mechanism open; see OQ-03.")

# ---------------------------------------------------------------- EP-07
epic("EP-07", "List approval workflow",
     "DRAFT, SUBMITTED, AUTHORISED at List level. SUBMITTED removes anaesthetist edit access; AUTHORISED locks Bookings, Procedures and Contracts and hands the List to the Billing/Invoice Engine.",
     f"{MOB}; {ADM}", C, f"{RFP_B}; {D6}; {D7}")
feat("FT-07.1", "EP-07", "DRAFT",
     "The anaesthetist completes Bookings and submits the List.", MOB, R, f"{RFP_B}; {D6}")
story("US-07.1.1", "FT-07.1", "Submit a completed List",
      "As an anaesthetist, once every Booking on a List is complete I press 'Completed' and the List becomes SUBMITTED.", MOB, R, f"{RFP_B}; {D6}")
story("US-07.1.2", "FT-07.1", "Cannot submit an incomplete List",
      "As the system, I refuse to submit a List while any Booking is incomplete and show what is missing.", MOB, R, f"{RFP_B}; {D6}")

feat("FT-07.2", "EP-07", "SUBMITTED",
     "Office reviews and corrects; anaesthetist can view but not edit.", ADM, R, f"{RFP_B}; {D6}")
story("US-07.2.1", "FT-07.2", "Anaesthetist loses edit access",
      "As the system, once a List is SUBMITTED the anaesthetist cannot edit its Bookings; it remains visible marked 'completed, unbilled'.", MOB, R, f"{RFP_B}; {D6}")
story("US-07.2.2", "FT-07.2", "Office review of Contracts and references",
      "As an admin, I review each Booking's Procedures, Contracts, insurer details and references, and approve or correct the Contract selections made earlier.", ADM, O, f"{D6}; {D7}; {QA} #4",
      "Q&A #4 reads 'AA staff approve before submitting a list', which may mean pre-procedure approval rather than at SUBMITTED review; see OQ-26.")
story("US-07.2.3", "FT-07.2", "Office corrections",
      "As an admin, I correct Bookings directly; there is no 'returned' state and issues are resolved by phone, initiated by the office.", ADM, R, RFP_B)

feat("FT-07.3", "EP-07", "AUTHORISED",
     "Locked and handed to the Billing/Invoice Engine as a unit.", BIE, R, f"{RFP_B}; {D6}; {D7}")
story("US-07.3.1", "FT-07.3", "Authorise the List",
      "As an admin, I mark the List AUTHORISED, which locks its Bookings, Procedures and selected Contract versions and passes the whole List to the Billing/Invoice Engine.", ADM, R, f"{RFP_B}; {D7}")
story("US-07.3.2", "FT-07.3", "Immutable after AUTHORISED",
      "As the system, I reject any edit to an AUTHORISED List's Bookings or Procedures.", SCH, R, RFP_B)

feat("FT-07.4", "EP-07", "List visibility in the anaesthetist app",
     "Lists drop off the anaesthetist's to-do view when invoices are generated, and reappear as outstanding-balance lines.", MOB, R, RFP_X)
story("US-07.4.1", "FT-07.4", "List disappears on invoice generation",
      "As an anaesthetist, a List drops out of my List view when its invoices are generated (not at AUTHORISED, not at payment), and the invoices appear in my outstanding balances.", MOB, O, RFP_X, "RFP flags this trigger as a build detail to confirm; OQ-31.")

# ---------------------------------------------------------------- EP-08
epic("EP-08", "Billing/Invoice Engine and internal ledger",
     "On AUTHORISED the engine reads each locked Procedure and Contract, applies the multi-procedure rules, calculates final amounts, nets prepayments, creates linked receivable and payable records in its own ledger, generates and sends invoices, and mirrors to Xero. The internal ledger is the system of record.",
     BIE, C, f"{D2}; {D4}; {D7}; {QA} #9")
feat("FT-08.1", "EP-08", "Trigger and inputs",
     "Single integration point: an AUTHORISED List.", BIE, R, f"{RFP_B}; {D7}")
story("US-08.1.1", "FT-08.1", "Process an AUTHORISED List",
      "As the system, I process a List when it becomes AUTHORISED, iterating its Bookings and Procedures and reading each Procedure's locked Contract.", BIE, R, f"{RFP_B}; {D7}")
story("US-08.1.2", "FT-08.1", "Contract already resolved",
      "As the system, I do not resolve billing routes at this point; the recipient, rules and pricing come from the locked Contract on each Procedure.", BIE, C, f"{D7}; {QA} #2")

feat("FT-08.2", "EP-08", "Invoice grouping",
     "One invoice per distinct billable party per Booking.", BIE, R, f"{RFP_B}; {D7}")
story("US-08.2.1", "FT-08.2", "Group by billable party",
      "As the system, I group a Booking's Procedures by the Contract's resolved billable party and generate one invoice per group, so a Booking can produce several invoices.", BIE, R, f"{RFP_B}; {D7}")
story("US-08.2.2", "FT-08.2", "Net prepayments",
      "As the system, I deduct any prepayment already invoiced for the Booking before determining the remaining amount to invoice.", BIE, C, D7)

story("US-08.2.3", "FT-08.2", "Split one Procedure's fee between two payers",
      "As the system, where a Contract defines a covered amount or percentage, I invoice the contract holder or insurer for the covered portion and the patient (billable party) for the gap, as two invoices.", BIE, P, f"{RFP_B} (Split Billing, situation 2); {DATA} (NZSA RVG p4 gap / top-up)",
      "The one-Contract-per-Procedure model does not naturally express partial cover; mechanism is OQ-23.")

feat("FT-08.6", "EP-08", "Billing after AUTHORISED",
     "Billing lines dated after the List was invoiced (ward and HDU reviews, nerve catheter days, pain consults) and corrections to invoiced Bookings.", BIE, O, f"{RFP_B} (Time units in detail)")
story("US-08.6.1", "FT-08.6", "Supplementary invoice for late billing lines",
      "As an anaesthetist, I add a post-operative billing line to a Booking whose List has already been invoiced, and the system raises a supplementary invoice with its own ledger pair, without unlocking the original.", f"{MOB}; {BIE}", P, f"{RFP_B} (Time units in detail)", "Flow is OQ-24.")
story("US-08.6.2", "FT-08.6", "Credit note and re-issue",
      "As an admin, when an invoiced Booking is found to be wrong, I raise a credit note against the receivable, reverse the linked payable, and re-issue a corrected invoice, all audited.", f"{ADM}; {BIE}", O, "Claude (gap made load-bearing by RFP immutability rule)", "Who may action and how Xero pairs are reversed is OQ-28.")

feat("FT-08.3", "EP-08", "Internal ledger",
     "Linked receivable (from billable party) and payable (to anaesthetist) per invoice, tracked per patient and anaesthetist, independent of Xero contact lifecycle.", BIE, C, f"{D7}; {QA} #9")
story("US-08.3.1", "FT-08.3", "Linked receivable and payable pair",
      "As the system, for every invoice I create a receivable from the billable party and a matching payable to the anaesthetist, linked to each other and to the Booking and Procedures.", BIE, C, f"{D7}; {RFP_X}")
story("US-08.3.2", "FT-08.3", "Ledger is the system of record",
      "As the system, the internal ledger, not Xero, is the source of truth for balances shown to anaesthetists and admins.", BIE, C, f"{QA} #9; {RFP_X}")
story("US-08.3.3", "FT-08.3", "Patient-linked history survives Xero archiving",
      "As the system, I keep every patient's billing history in the ledger even after their Xero contact is archived or purged.", BIE, C, f"{QA} #9")
story("US-08.3.4", "FT-08.3", "Money in and money out",
      "As the system, I track dollars in (receipts) and dollars out (disbursements) so AA can see the ledger is in equilibrium overall, per anaesthetist and per patient.", BIE, C, f"{D7}; {QA} #12")
story("US-08.3.5", "FT-08.3", "Per-anaesthetist ledger position",
      "As the system, I can show each anaesthetist's position: what is owed to them, what has been collected, what has been paid out.", BIE, R, RFP_B)

feat("FT-08.4", "EP-08", "Invoice generation and despatch",
     "Invoices are produced and sent from the engine, not from Xero.", BIE, R, f"{RFP_B}; {D4}")
story("US-08.4.1", "FT-08.4", "Generate invoice documents",
      "As the system, I generate the invoice document with a layout for contract holders and a different layout for patients.", BIE, R, RFP_B)
story("US-08.4.2", "FT-08.4", "Send to the invoice email",
      "As the system, I email the invoice to the invoice email captured on the Booking (which may be a guardian rather than the patient) or queue it for portal upload where the Contract says so.", BIE, C, f"{QA} #13; {RFP_B}")
story("US-08.4.5", "FT-08.4", "Anaesthetist as supplier, AA as agent",
      "As the system, I present each receivable invoice in the anaesthetist's name (supplier name, GST number) with AA identified as agent, so the GST agency treatment is correct.", BIE, P, f"{RFP_B} (Generic Process Flow: agency and GST legislation)", "Confirm treatment with AA's accountant; OQ-29.")
story("US-08.4.3", "FT-08.4", "Unique invoice numbers",
      "As the system, I issue unique invoice numbers, and the receivable and payable numbers are visibly similar for human matching.", BIE, R, RFP_X)
story("US-08.4.4", "FT-08.4", "Invoice reproducibility",
      "As the system, I can regenerate any past invoice exactly from the locked data and Contract version.", BIE, R, RFP_S)

feat("FT-08.5", "EP-08", "Processing status and failures",
     "Status reported for office monitoring; failures do not vanish.", BIE, R, f"{RFP_X}; {D4}")
story("US-08.5.1", "FT-08.5", "Report processing status",
      "As the system, I record for each List and Booking whether processing succeeded, and why not if it failed.", BIE, R, RFP_X)
story("US-08.5.2", "FT-08.5", "Booking-level vs List-level failure",
      "As the system, a failure on one Booking does not silently block or discard the rest of the List.", BIE, O, RFP_X, "Whether it blocks the whole List is open; see OQ-05.")

# ---------------------------------------------------------------- EP-09
epic("EP-09", "Xero integration",
     "A dedicated Xero organisation provides accounts receivable and banking. The engine mirrors each ledger pair as an ACCREC and a draft ACCPAY, detects payments by webhook plus daily poll, and manages contacts with a hidden ID so NHI never reaches Xero.",
     XERO, R, f"{RFP_X}; {RFP_A}; {D7}")
feat("FT-09.1", "EP-09", "Invoice pair creation",
     "ACCREC to the payer, ACCPAY draft to the anaesthetist, created together and linked by the engine.", XERO, R, f"{RFP_X}; {D7}")
story("US-09.1.1", "FT-09.1", "Create ACCREC and draft ACCPAY",
      "As the system, for each ledger pair I create an ACCREC to the billable party and a DRAFT ACCPAY to the anaesthetist in the same transaction and store both Xero IDs on the ledger record.", XERO, R, f"{RFP_X}; {D7}")
story("US-09.1.2", "FT-09.1", "InvoiceNumber and Reference",
      "As the system, I put the engine's unique invoice number in Xero InvoiceNumber (the remittance matching key) and the internal case reference in Reference.", XERO, R, RFP_X)
story("US-09.1.4", "FT-09.1", "ACCPAY as buyer-created tax invoice",
      "As the system, the ACCPAY to the anaesthetist carries buyer-created tax invoice wording and the details that treatment requires.", XERO, P, f"{RFP_X} (ACCPAY 'a form of Buyer Generated Tax Invoice')", "OQ-29.")
story("US-09.1.3", "FT-09.1", "Prepayment invoices also paired",
      "As the system, prepayment invoices create the same ACCREC and draft ACCPAY pair.", XERO, C, D7)

feat("FT-09.2", "EP-09", "Payment detection",
     "Webhook first, daily poll as safety net, idempotent handler.", XERO, R, RFP_X)
story("US-09.2.1", "FT-09.2", "Webhook on INVOICE events",
      "As the system, on a Xero invoice webhook I fetch the invoice, detect payment, find the ledger record by Xero ID and update it.", XERO, R, RFP_X)
story("US-09.2.2", "FT-09.2", "Daily reconciliation poll",
      "As the system, I poll Xero daily for paid invoices to catch missed webhooks.", XERO, R, RFP_X)
story("US-09.2.4", "FT-09.2", "Detect disbursement",
      "As the system, I detect when an ACCPAY is paid in Xero's payables run (webhook or poll) and record the disbursement against the ledger payable, so 'disbursed to anaesthetist' is a tracked state.", XERO, P, f"{RFP_B} (two payment states); {D4}")
story("US-09.2.3", "FT-09.2", "Idempotent by InvoiceID",
      "As the system, both paths use the same handler keyed by InvoiceID so duplicates are no-ops.", XERO, R, RFP_X)

feat("FT-09.3", "EP-09", "Contact management and archiving",
     "One Xero contact per real patient keyed on a hidden internal ID; NHI never sent; archived after inactivity.", XERO, R, RFP_A)
story("US-09.3.1", "FT-09.3", "Hidden ID in ContactNumber",
      "As the system, I identify billing contacts to Xero by a hidden internal ID in ContactNumber and cache the returned ContactID.", XERO, R, RFP_A)
story("US-09.3.2", "FT-09.3", "NHI never sent to Xero",
      "As the system, I never send the NHI to Xero in any field.", XERO, R, RFP_A)
story("US-09.3.3", "FT-09.3", "Scheduled archiving",
      "As the system, I archive Xero contacts whose invoices are fully paid after a defined inactivity window (e.g. 90 days).", XERO, R, RFP_A)
story("US-09.3.4", "FT-09.3", "Invoice against an archived contact",
      "As the system, when a returning patient's contact is archived I invoice against it, unarchiving first if Xero requires it.", XERO, O, RFP_A, "Sandbox test; see OQ-10.")

feat("FT-09.4", "EP-09", "Xero organisation configuration",
     "Separate org for AR and banking only.", XERO, R, RFP_B)
story("US-09.4.1", "FT-09.4", "Dedicated Xero organisation",
      "As AA, a separate Xero organisation is used solely for receivables, payables to anaesthetists and banking, not general accounting.", XERO, R, RFP_B)
story("US-09.4.2", "FT-09.4", "Duplicate invoice number prevention",
      "As AA, the Xero setting preventing duplicate invoice numbers is enabled.", XERO, O, RFP_X, "Confirm as mandated config; see OQ-11.")

# ---------------------------------------------------------------- EP-10
epic("EP-10", "Payments, disbursement and AA fees",
     "All money lands in the AA account. Payment of a receivable releases the matching payable (in full, or for exactly the amount received). AA is paid via a separate invoice to the anaesthetist, managed by the system.",
     BIE, C, f"{RFP_B}; {D7}; {QA} #8")
feat("FT-10.1", "EP-10", "Single payment destination",
     "Direct hospital-to-anaesthetist payments are retired.", BIE, R, RFP_B)
story("US-10.1.1", "FT-10.1", "All payments into AA",
      "As the system, I model one payment path: billable party pays AA, AA disburses to the anaesthetist.", BIE, R, RFP_B)
story("US-10.1.2", "FT-10.1", "Two payment states",
      "As the system, I track 'paid into AA' and 'disbursed to anaesthetist' as separate states on every ledger pair.", BIE, R, f"{RFP_B}; {D7}")

feat("FT-10.2", "EP-10", "Releasing payables",
     "Payables are authorised for the payables run once the receivable is paid.", BIE, C, f"{D7}; {RFP_X}")
story("US-10.2.1", "FT-10.2", "Full payment releases the payable",
      "As the system, when a receivable is paid in full I authorise the matching payable so it enters the next payables run.", BIE, C, f"{D7}; {RFP_X}")
story("US-10.2.2", "FT-10.2", "Partial payment releases exactly that amount",
      "As the system, when a receivable is part paid I authorise a payable for exactly the amount received and leave the remainder outstanding.", BIE, C, D7)
story("US-10.2.3", "FT-10.2", "Reconcile back to the ledger",
      "As the system, every receipt recorded in Xero is reconciled back to the ledger record it belongs to.", BIE, C, D7)
story("US-10.2.4", "FT-10.2", "Bulk remittance stays in Xero",
      "As the system, I rely on Xero bank reconciliation and its remittance add-on for bulk hospital payments; unmatched items are handled in Xero.", XERO, R, RFP_X)

feat("FT-10.3", "EP-10", "AA fee invoicing",
     "AA is paid by a separate invoice to the anaesthetist, distinct from any procedure's receivable and payable.", BIE, C, f"{QA} #8")
story("US-10.3.1", "FT-10.3", "Generate AA fee invoices",
      "As the system, I generate AA's fee invoice to each anaesthetist, separate from procedure receivables and payables, and track it in the ledger.", BIE, C, f"{QA} #8", "Basis and frequency open; see OQ-02.")
story("US-10.3.2", "FT-10.3", "AA fee visible to the anaesthetist",
      "As an anaesthetist, I can see AA fee invoices and their payment status in my app.", MOB, P, f"{QA} #8")

# ---------------------------------------------------------------- EP-11
epic("EP-11", "Patients and billable parties",
     "A patient record keyed on NHI, with contact details; a per-Booking billable party and invoice email that may differ from the patient (guardian); admin visibility of each patient's outstanding balances and alerts when a patient with unpaid bills is booked again.",
     MD, C, f"{NOTES}; {QA} #9 #13; {RFP_A}")
feat("FT-11.1", "EP-11", "Patient record",
     "One record per patient, NHI as unique ID.", MD, C, NOTES)
story("US-11.1.1", "FT-11.1", "Patient keyed on NHI",
      "As the system, I keep one patient record per NHI with demographics, ethnicity (NZHIS Level 4) and contact details supplied by the hospital, surgeon or AA.", MD, C, f"{NOTES}; {RFP_S}; {RFP_H}",
      "NHI is the clinical identifier and dedupe key. Billing and ledger records key on the hidden internal patient ID, per RFP Appendix 1 policy; NHI is a cross-reference there. See OQ-30 on Appendix 1 vs 2.")
story("US-11.1.2", "FT-11.1", "Dual-format NHI validation",
      "As the system, I validate both the current NHI format (AAANNNC, modulus 24) and the new format (AAANNAX, modulus 23), and never assume NHIs are numeric or sequential, ready before 1 July 2027.", MD, R, RFP_A)
story("US-11.1.3", "FT-11.1", "Deduplicate on NHI",
      "As the system, I match returning patients on NHI regardless of name or address changes.", MD, R, RFP_A)
story("US-11.1.4", "FT-11.1", "Patient without NHI",
      "As an admin, I can create a patient where the NHI is not yet known and attach it later.", MD, P, RFP_H)

feat("FT-11.2", "EP-11", "Billable party and invoice contact",
     "Per Booking: who pays and where the invoice goes, defaulting to the patient.", SCH, C, f"{QA} #13; {RFP_S}")
story("US-11.2.1", "FT-11.2", "Default billable party is the patient",
      "As the system, I default the billable party to the patient for patient-direct Contracts.", SCH, R, RFP_S)
story("US-11.2.2", "FT-11.2", "Guardian or other override",
      "As an admin or anaesthetist, I set a different billable party and invoice email (e.g. a guardian for a child) on the Booking.", f"{ADM}; {MOB}", C, f"{QA} #13")
story("US-11.2.3", "FT-11.2", "Invoice email required for patient-direct",
      "As the system, I require an invoice email when the Contract bills the patient or their billable party directly.", SCH, C, f"{QA} #2 #13")

feat("FT-11.3", "EP-11", "Patient outstanding balances and alerts",
     "Admins see a patient's unpaid invoices and are alerted when that patient is booked again.", ADM, C, f"{NOTES}; {QA} #9")
story("US-11.3.1", "FT-11.3", "Patient outstanding bills view",
      "As an admin, I open a patient and see all their invoices with paid, part paid and unpaid status across all anaesthetists.", ADM, C, NOTES)
story("US-11.3.2", "FT-11.3", "Alert on booking a patient with unpaid bills",
      "As an admin, when a Booking is created or matched for a patient with unpaid invoices I am alerted so AA can follow up before the procedure.", ADM, C, f"{QA} #9")
story("US-11.3.3", "FT-11.3", "Follow-up tools",
      "As an admin, I can record follow-up actions and re-send invoices for a patient's outstanding items.", ADM, P, f"{QA} #9")

feat("FT-11.4", "EP-11", "Insurers",
     "Insurer master and the two insured-patient flows.", MD, R, RFP_S)
story("US-11.4.1", "FT-11.4", "Insurer master data",
      "As an admin, I maintain insurers with an acceptsDirectClaims flag; direct insurers hold Insurance Contracts.", MD, R, RFP_S)
story("US-11.4.2", "FT-11.4", "Insured patient who forwards the invoice",
      "As the system, where the insurer does not accept direct claims I invoice the patient, who forwards it to their insurer.", BIE, R, RFP_B)

# ---------------------------------------------------------------- EP-12
epic("EP-12", "Anaesthetist profile and reporting",
     "Each anaesthetist's settings (unit value, GST period, prepaid procedures) and their two reporting needs: outstanding balances and periodic activity summary.",
     MOB, C, f"{RFP_X}; {NOTES}")
feat("FT-12.1", "EP-12", "Profile settings",
     "Per-anaesthetist configuration that drives billing.", MOB, C, f"{RFP_B}; {NOTES}")
story("US-12.1.1", "FT-12.1", "Dollar value per unit",
      "As an anaesthetist, I set my own dollar value per RVG unit.", MOB, R, RFP_B)
story("US-12.1.2", "FT-12.1", "GST period",
      "As an anaesthetist, I set my GST period (monthly, two-monthly, six-monthly) so my activity summary aligns to it.", MOB, R, RFP_X)
story("US-12.1.3", "FT-12.1", "Prepaid procedures",
      "As an anaesthetist, my prepaid RVG codes and groups are part of my profile (see EP-06).", MOB, C, NOTES)
story("US-12.1.4", "FT-12.1", "Identity and contact",
      "As an admin, I hold each anaesthetist's contact details, registration number and HPI where available.", MD, R, f"{RFP_S}; {RFP_H}")
story("US-12.1.5", "FT-12.1", "Bank details for disbursement",
      "As an admin, I hold each anaesthetist's bank account for the payables run.", MD, O, f"{RFP_B}", "Where these live (system vs Xero only) is open; see OQ-14.")

feat("FT-12.2", "EP-12", "Reporting for anaesthetists",
     "Flat outstanding list and GST-aligned activity summary.", MOB, R, RFP_X)
story("US-12.2.1", "FT-12.2", "Outstanding balances list",
      "As an anaesthetist, I see a flat list of my unpaid payables (around 100 rows typically) with no rollup; queries go to the office.", MOB, R, RFP_X)
story("US-12.2.2", "FT-12.2", "Activity summary for GST",
      "As an anaesthetist, I see a date-ranged summary of amounts received and their GST component aligned to my GST period.", MOB, R, RFP_X)
story("US-12.2.3", "FT-12.2", "Dashboard",
      "As an anaesthetist, my web dashboard summarises calendar, financial position and locum availability.", MOB, R, RFP_A)

# ---------------------------------------------------------------- EP-13
epic("EP-13", "Admin oversight and master data",
     "The Admin App gives the office a one-day schedule dashboard, billing flow monitoring, ledger balance tools (whole ledger, per anaesthetist, per patient) and management of all master data.",
     ADM, C, f"{RFP_A}; {QA} #12")
feat("FT-13.1", "EP-13", "Schedule dashboard",
     "One-day view across all anaesthetists with drill-downs.", ADM, R, RFP_A)
story("US-13.1.1", "FT-13.1", "One-day dashboard",
      "As an admin, I see all anaesthetists' AM and PM Lists for a day with status, hospital, surgeon and booking counts, and drill into any List.", ADM, R, RFP_A)
story("US-13.1.2", "FT-13.1", "Pre-op review of tomorrow",
      "As an admin, I review tomorrow's Lists as an operational practice with no tracked state.", ADM, R, RFP_B)

feat("FT-13.2", "EP-13", "Ledger balance tools",
     "Clear tools showing how far out of balance the ledger is, overall and per patient or anaesthetist.", ADM, C, f"{QA} #12")
story("US-13.2.1", "FT-13.2", "Whole-ledger balance",
      "As an admin, I see the overall ledger position: receivables outstanding, receipts held, payables due, disbursed, and any imbalance.", ADM, C, f"{QA} #12", "Detailed requirements to be worked out later.")
story("US-13.2.2", "FT-13.2", "Per-patient balance",
      "As an admin, I see a patient's profile balance (see EP-11).", ADM, C, f"{QA} #12")
story("US-13.2.3", "FT-13.2", "Per-anaesthetist balance",
      "As an admin, I see each anaesthetist's ledger position.", ADM, C, f"{QA} #12")

feat("FT-13.3", "EP-13", "Billing flow monitoring",
     "Monitor List to engine to Xero for completion and errors. Placing it in the Admin App (rather than a separate engine console) is our proposal; the RFP left it open.", ADM, P, f"{RFP_X}; {QA} #12")
story("US-13.3.1", "FT-13.3", "Processing monitor",
      "As an admin, I see which AUTHORISED Lists have been invoiced, sent and mirrored to Xero, and which failed and why.", ADM, R, RFP_X)
story("US-13.3.2", "FT-13.3", "Manual intervention",
      "As an admin, I can retry or resolve a failed item.", ADM, R, RFP_X)

feat("FT-13.4", "EP-13", "Master data management",
     "Admin maintains all reference data.", ADM, R, RFP_S)
story("US-13.4.1", "FT-13.4", "Maintain reference tables",
      "As an admin, I maintain hospitals, surgeons, surgeon groups, insurers, anaesthetists, list statuses, Permanent Lists, the master (public holiday) calendar, hospital holiday calendars, RVG codes and groups, modifier codes and Contracts.", ADM, C, f"{RFP_S}; {QA} #2")

feat("FT-13.5", "EP-13", "Roles, permissions and audit",
     "Role-based access and full audit of manual and automated actions.", NFR, R, RFP_O)
story("US-13.5.1", "FT-13.5", "Role-based access",
      "As AA, view, edit and approval rights are granted by role (anaesthetist, office admin, and others as needed), not per individual.", NFR, R, RFP_O)
story("US-13.5.2", "FT-13.5", "Audit trail of all actions",
      "As an admin, I can see who or what did every create, update, reassignment, authorisation, invoice, payment and disbursement, and when.", NFR, R, f"{RFP_O}; {RFP_S}")

# ---------------------------------------------------------------- EP-14
epic("EP-14", "Health systems integration (future)",
     "RFP scope for HL7 v2 and FHIR R4 hospital integration. No live hospital integration exists today (the real pathway is a manual download and matching screen, EP-02), so this is retained as future scope.",
     INT, F, f"{RFP_H}; {QA} #4")
feat("FT-14.1", "EP-14", "HL7 v2 inbound", "Receive and parse SIU S12 to S15 with per-hospital field mapping.", INT, F, RFP_H)
story("US-14.1.1", "FT-14.1", "Parse SIU messages",
      "As the system, I receive HL7 v2.3.1 SIU S12, S13, S14 and S15 messages and map them to Booking changes with configurable per-hospital mapping.", INT, F, RFP_H)
feat("FT-14.2", "EP-14", "FHIR R4", "Consume FHIR Appointment, Patient and Practitioner; translate v2 to FHIR internally.", INT, F, RFP_H)
story("US-14.2.1", "FT-14.2", "FHIR-native internal model",
      "As the system, I represent inbound bookings internally as FHIR R4 resources, translating HL7 v2 into that form.", INT, F, RFP_H)
feat("FT-14.3", "EP-14", "Near real time", "Process messages as they arrive rather than SFTP batches.", INT, F, RFP_H)
story("US-14.3.1", "FT-14.3", "Real-time processing",
      "As the system, I act on each message as received to support late bookings up to session start.", INT, F, RFP_H)
feat("FT-14.4", "EP-14", "NZ identity standards", "NHI FHIR API, HPI, NZHIS ethnicity.", INT, F, RFP_H)
story("US-14.4.1", "FT-14.4", "NHI lookup via Digital Services Hub",
      "As the system, I look up and validate patients against the NHI FHIR API and reference anaesthetists by HPI.", INT, F, RFP_H)
feat("FT-14.5", "EP-14", "Reliability and monitoring", "Delivery guarantees, retries, alerting, manual intervention.", INT, F, RFP_H)
story("US-14.5.1", "FT-14.5", "Integration failure visibility",
      "As an admin, I see integration failures and can intervene manually.", INT, F, RFP_H)

# ---------------------------------------------------------------- EP-15
epic("EP-15", "Non-functional requirements",
     "Ease of use is the headline requirement. Data entered once. Mobile-first anaesthetist experience. Deterministic, testable billing maths. Volumes: about 85 anaesthetists, 28,000 invoices a year.",
     NFR, R, RFP_O)
story("US-15.0.1", "EP-15", "Ease of use",
      "As any user, the system is intuitive enough for people who are not comfortable with modern systems, especially the operational screens.", NFR, R, RFP_O)
story("US-15.0.2", "EP-15", "Mobile-first for anaesthetists",
      "As an anaesthetist, the mobile app is my primary tool and is designed mobile-first, with the web app as a full alternative.", MOB, R, RFP_O)
story("US-15.0.3", "EP-15", "Enter once",
      "As any user, data is entered once and is current everywhere it appears.", NFR, R, RFP_O)
story("US-15.0.4", "EP-15", "Volumes",
      "As the system, I handle about 85 anaesthetists, 20,000 List records in the horizon and 28,000 invoices a year without degradation.", NFR, R, RFP_O)
story("US-15.0.5", "EP-15", "Testable billing rules",
      "As the team, all fee, unit, split and pricing logic is pure, deterministic and covered by automated tests with worked examples.", BIE, P, "Engineering practice carried from the prototype")
story("US-15.0.6", "EP-15", "Privacy and data minimisation",
      "As AA, NHI is confined to the clinical and ledger systems and never propagates to finance platforms.", NFR, R, RFP_A)

# ---------------------------------------------------------------- open questions
QUESTIONS = [
 ["OQ-01", "Cancellation fees", "Are there any fees charged to anyone when a Booking or List is cancelled (late cancellation, day-of cancellation after pre-assessment, PA5)?", "US-02.5.3", "Donald to ask AA", "Open", QA + " #10"],
 ["OQ-02", "AA fee basis", "How is AA's fee to the anaesthetist calculated and when is it invoiced (percentage of collections, per invoice, monthly, per procedure)? Does it net against payables or is it always a separate receivable?", "FT-10.3", "AA", "Open", QA + " #8"],
 ["OQ-03", "Refund when prepaid exceeds final", "When the prepaid estimate exceeds the final calculated fee, is the difference refunded, held as credit against future work, or written off? Who actions it and where (Xero credit note vs engine)?", "US-06.4.2", "AA", "Open", QA + " #5"],
 ["OQ-04", "Prepaid amount source", "Is the default prepaid amount the Contract's fixed fee, an RVG estimate at the anaesthetist's unit value, or always entered by hand? Can it be a deposit percentage?", "US-06.2.2", "AA / Donald", "Open", QA + " #5"],
 ["OQ-05", "Booking-level vs List-level failure", "If one Booking fails in the Billing/Invoice Engine, does the whole List wait or do the other Bookings invoice?", "US-08.5.2", "Design", "Open (from RFP)", RFP_X],
 ["OQ-06", "Base units on RVG code or on Contract", "Recommendation: base units live on the RVG code master; a Contract may override them. The alternative (every RVG code has its own default Contract carrying base units) multiplies Contracts by codes. Confirm the recommendation.", "US-04.2.3; US-05.1.1", "Donald", "Proposed", QA + " #2 #3"],
 ["OQ-07", "Concurrency", "How are near-simultaneous edits to the same Booking from two sources handled (last write wins with history, optimistic locking, field-level merge)?", "US-02.5.6", "Design", "Open (from RFP)", RFP_S],
 ["OQ-08", "List reassignment mechanism", "Exact mechanism for moving a List between anaesthetists while preserving bookings, status history and audit.", "US-01.4.1", "Design", "Open (from RFP)", RFP_S],
 ["OQ-09", "Holiday and availability conflicts", "Are hospital closures and anaesthetist unavailability hard blocks or soft warnings when assigning Lists and Bookings?", "US-01.5.2", "AA", "Open (from RFP)", RFP_S],
 ["OQ-10", "Invoicing an archived Xero contact", "Does Xero require an unarchive step before invoicing an archived contact?", "US-09.3.4", "Sandbox test", "Open (from RFP)", RFP_A],
 ["OQ-11", "Xero duplicate invoice number setting", "Confirm the Xero organisation setting preventing duplicate invoice numbers is a mandated configuration item.", "US-09.4.2", "AA / Xero setup", "Open (from RFP)", RFP_X],
 ["OQ-12", "ACC pre-op codes", "Confirm ACC pre-operative assessments (CS250, CS260, CS70) are billed separately as flat-fee lines and that ACC otherwise follows the holder's Contract.", "US-05.5.2", "AA billing", "Open (from RFP)", RFP_B],
 ["OQ-13", "Hospital download format", "What file format(s) does the hospital booking download arrive in, per hospital, and what fields does it contain? Needed to specify the matching screen.", "US-02.1.1", "Donald / AA", "Open", QA + " #4"],
 ["OQ-14", "Anaesthetist bank details", "Do anaesthetist bank accounts live in the system, in Xero only, or both?", "US-12.1.5", "AA", "Open", "Claude"],
 ["OQ-15", "Modifier split when units do not divide evenly", "Confirm the split is an equal integer division with the remainder to the primary (7 units over 3 procedures = 3, 2, 2), and that it applies regardless of whether the procedures are on different Contracts.", "US-05.3.3", "AA / Donald", "Confirm", NOTES + "; " + QA + " #1"],
 ["OQ-16", "Office adjustment at review", "Can the office apply or change the anaesthetist adjustment or a price override during SUBMITTED review, and does that need the Contract's permission too?", "US-05.4.2", "AA", "Open", QA + " #6"],
 ["OQ-17", "List status vocabulary", "Final set of List availability statuses and colours (RFP offers two candidate lists).", "US-01.2.2", "AA", "Open (from RFP)", RFP_S],
 ["OQ-18", "Contract holder codes vs RVG codes", "Fixed fee schedules use the holder's own codes (SXAP AP codes, HNZ codes, ACC OPT codes). Should the anaesthetist select the holder code directly when such a Contract applies, with an optional RVG mapping for BTM recording, or always pick an RVG code and have the system map it?", "US-04.2.4; US-05.2.5", "Donald / AA", "Proposed", DATA],
 ["OQ-19", "Hospital dispute fallback", "If a hospital or contract holder later disputes or fails to pay, is there a defined fallback to the patient or is the Contract final?", "EP-10", "AA", "Open (from RFP)", RFP_S],
 ["OQ-20", "Insurer rate structures", "Does the direct insurer (NIB) need its own rate table distinct from the Contract model if arrangements grow?", "US-11.4.1", "AA", "Open (from RFP)", RFP_S],
 ["OQ-21", "Deposit refund on cancellation", "If a prepaid Booking is cancelled before the procedure, is the prepayment refunded in full, partly, or retained?", "EP-06", "AA", "Open", "Claude"],
 ["OQ-23", "Gap / partial-cover billing", "RFP Split Billing situation 2: one Procedure partly covered by a contract holder or insurer with the patient paying the gap (NZSA RVG also describes insurer gap and top-up). Under one-Contract-per-Procedure, how is this expressed: a covered amount or percent on the Contract, a second billing line, or a second Contract on the same Procedure?", "US-08.2.3", "Donald / AA", "Open", "Audit 2026-09-24 #1; " + RFP_B],
 ["OQ-24", "Billing lines after AUTHORISED", "Post-op ward/HDU reviews, nerve catheter days and pain consults can occur days after the List was invoiced, but Bookings are immutable after AUTHORISED and the List has left the app. Supplementary invoice on the same Booking, a new Booking, or re-open?", "US-08.6.1", "Donald / AA", "Open", "Audit 2026-09-24 #2; " + RFP_B],
 ["OQ-25", "Is a Pre-paid Contract category still wanted?", "Q&A #2 lists 'RVG Default Contract Pre-paid' as a category; Q&A #5 says prepaid is a property of the procedure choice, not the contract. Keep the category (and if so, does it trigger prepayment on its own) or drop it and rely on the anaesthetist's prepaid RVG settings?", "US-04.1.1; US-06.2.1", "Donald", "Open", "Audit 2026-09-24 #3; " + QA + " #2 #5"],
 ["OQ-26", "When does AA approve Contract selections?", "Q&A #4: 'AA staff will be approving before submitting a list.' Does that mean approval before the procedure (when the Booking is set up), or during the SUBMITTED review after the anaesthetist submits? Affects whether the anaesthetist can change a Contract after AA has approved it.", "FT-03.4; US-07.2.2", "Donald", "Open", "Audit 2026-09-24 #8; " + QA + " #4"],
 ["OQ-27", "List status vs anaesthetist availability calendar", "The RFP has both a List Status painted on the List and a separate Anaesthetist Availability calendar reconciled against the canvas as conflicts. Are these one concept (the anaesthetist sets List status directly) or two?", "FT-01.2; US-01.5.3", "Donald / AA", "Open", "Audit 2026-09-24 #5; " + RFP_S],
 ["OQ-28", "Correction after invoicing", "When an invoiced Booking is wrong (office error, hospital query), what is the credit note and re-issue flow, who may action it, and how are the ledger pair and the Xero ACCREC/ACCPAY pair reversed?", "US-08.6.2", "AA", "Open", "Audit 2026-09-24 #19"],
 ["OQ-29", "GST agency treatment", "Confirm with AA's accountant: receivable invoices issued in the anaesthetist's name with AA as agent, and the ACCPAY treated as a buyer-created tax invoice. What must appear on each document?", "US-08.4.5; US-09.1.4", "AA accountant", "Open", "Audit 2026-09-24 #6; " + RFP_B],
 ["OQ-30", "NHI in Xero: Appendix 1 vs Appendix 2", "RFP Appendix 1 says NHI is attached as a custom field on the Xero contact; Appendix 2 says NHI is never sent to Xero. The catalogue follows Appendix 2. Confirm.", "US-09.3.2; US-11.1.1", "Donald / Greg", "Open", "Audit 2026-09-24 #7; " + RFP_A],
 ["OQ-31", "Event that removes a List from the anaesthetist's view", "RFP proposes invoice generation but flags it as a build detail to confirm.", "US-07.4.1", "AA", "Open (from RFP)", RFP_X],
 ["OQ-32", "Base unit override beyond the RVG range", "RFP open item: the RVG dropdown may be overridden by the anaesthetist for a given procedure. Can they set base units outside the published value or range, and is that flagged for office review?", "US-03.3.2", "AA", "Open (from RFP)", RFP_X + " (Open Items Carried Forward)"],
 ["OQ-33", "Unpaid-patient alert threshold", "Does the alert when booking a patient with unpaid invoices fire on any open invoice, or only on overdue ones (RFP Appendix 2 asks the same of the outstanding-balance check)?", "US-11.3.2", "AA", "Open", "Audit 2026-09-24 #16; " + RFP_A],
 ["OQ-34", "Which intake pathway carries most bookings today?", "RFP says emailed surgeon PDFs are currently the main pathway; Q&A #4 describes the hospital download and matching screen. Relative volumes decide the priority of FT-02.1 vs FT-02.2.", "FT-02.1; FT-02.2", "AA", "Open", "Audit 2026-09-24 #10"],
 ["OQ-22", "Who may set the Contract from hospital data", "When integrations exist in future, can inbound hospital data set or suggest the Contract, or is it always an AA decision?", "US-04.3.4", "Design (future)", "Open", QA + " #4"],
]

os.makedirs(OUT, exist_ok=True)
with open(os.path.join(OUT, "requirements.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
    w.writerow(["ID", "Type", "Parent", "Title", "Description", "Notes", "Component", "Status", "Source"])
    w.writerows(ROWS)
with open(os.path.join(OUT, "open-questions.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
    w.writerow(["ID", "Title", "Question", "Affects", "Owner", "Status", "Source"])
    w.writerows(QUESTIONS)

# sanity: unique IDs, parents exist
ids = [r[0] for r in ROWS]
assert len(ids) == len(set(ids)), "duplicate IDs"
idset = set(ids)
for r in ROWS:
    if r[2]: assert r[2] in idset, f"missing parent {r[2]} for {r[0]}"
from collections import Counter
print(Counter(r[1] for r in ROWS), "questions:", len(QUESTIONS))
print(Counter(r[7] for r in ROWS))
