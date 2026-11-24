Please run requirements catch-up Phase 34 (The rooms' PDF lists, where a List came from, and the S1 rebuild) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (2 sessions with the doc's cut line, Intake track). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override:
- Say at the start which session this is. Session 1 (work items 1 to 5) ends green with a short PROGRESS note; the When done steps (checklist, review, capture, demo guide, full entry) run at the end of session 2.
- This phase edits PROGRESS binding convention 4, as the doc's "PROGRESS.md updates" says.

Also read:
- PROGRESS.md: conventions 4, 5, 7, 13 and 15 to 19; the entries of Phases 15 and 21 for their real names, beside those the doc's drift-check step 7 lists.

Hold to these above all:
- No sync: hospital rows arrive only through 33's Import hospital file; no sync action, channel, schedule, button or last-synced time (D52).
- No silent apply and no direct write: PDF list rows and fired HL7 messages reach a Booking, List or Patient only through 33's decision or 33a's resolve; ingestPdfRow and its callers go.
- Every List records its origin through one helper on every creation path, a PDF List with its sender; the build choices live in one place (work item 2).
- One email helper: extend 17b's with the List's sender in front, never a second one.
- Do not extend the HL7/FHIR simulator; nothing picks a Contract except the PWA stand-in's scripted rail answer.
- Session 2 never squeezes the S1 rebuild: the Intake home shrinks to a plain grouping first.

Phase goal: the rooms' PDF lists are uploaded with their sender, corrected and sent to the matching screen as rows, a re-sent List showing its differences, nothing applied until the office decides; every List keeps where it came from, a PDF List the address it arrived from, which the office's emails go to first; the HL7/FHIR tooling moves to a Future-scope surface and Christchurch Public stops being a live feed; and S1 tells the import-then-match story with the wording kept as received, the office answering where the invoice goes through the decided step rail, a no-NHI booking waiting as a stub, and a rooms' PDF List showing its sender.
