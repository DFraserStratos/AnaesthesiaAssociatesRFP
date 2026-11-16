Please run catch-up Phase 34 (Hospital sync, the rooms' PDF lists and the S1 rebuild) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase. The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Overrides:
- Two sessions with the doc's cut line: say at the start which session this is.
- Session 1 ends green (build, build:pwa, vitest) with a short PROGRESS note. The When done steps (checklist, full gate, review, capture, demo guide, full entry) run at the end of session 2.
- This phase edits PROGRESS binding convention 4, as the doc's "PROGRESS.md updates" says.

Also read:
- PROGRESS.md: conventions 4, 5, 7, 13 and 15 to 19 especially; the entries of Phases 15 and 21 for their real names, beside those the doc's drift-check step 7 lists.

Hold to these above all:
- No silent apply and no direct write: synced rows, PDF list rows and fired HL7 messages reach a Booking, List or Patient only through 33's decision or 33a's resolve. ingestPdfRow and its callers go.
- No invented sync mechanics: a Simulate sync demo action per integrated hospital; no schedule, pull on open, Sync button, last-synced time or persisted sync state. The two hospitals are named once, in INTEGRATED_HOSPITALS. Christchurch Public stops being a live feed.
- The rooms' PDF lists are product, unbadged, and reach the schedule only through stageImportRows with the rooms as source; the re-sent List match (surgeon, hospital, date, session) is our reading, in one pure function, labelled.
- Do not extend the HL7/FHIR simulator: move its log and mapping to the Future-scope surface unchanged.
- Nothing picks a Contract except the PWA stand-in's scripted rail answer (Payment type, Patient › Standard: No contract · RVG); no "default Contract" anywhere.
- Session 2 never squeezes the S1 rebuild: the Intake home shrinks to a plain grouping first.
- App copy: never "slot"; no crimson on rows, pills or banners.

Phase goal: rows from St George's and Southern Cross arrive on the matching screen through Simulate sync, and the rooms' PDF lists are uploaded, corrected and sent there as rows, a re-sent List showing its differences, nothing applied until the office decides; Christchurch Public stops being a live feed and the HL7/FHIR tooling moves to a Future-scope surface; and S1 tells the sync-then-match story with the wording kept as received, a no-NHI booking waiting as a stub, and the office answering where the invoice goes through the decided step rail.
