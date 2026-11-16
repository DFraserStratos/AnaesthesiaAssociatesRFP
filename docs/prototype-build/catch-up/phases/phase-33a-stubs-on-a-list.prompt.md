Please run catch-up Phase 33a (Stubs on a List) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase. The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Overrides:
- Run it straight after Phase 33, in the same working tree.

Also read:
- Phase 33's doc: only its work items 1, 2 and 5 (the row model, the matcher's waiting rows and decideImportRow, the row panel). The PROGRESS entries of Phases 15a and 31 as well as 33's, for the names they shipped.

Hold to these above all:
- A stub is not a Booking: its own record in the intake slice, never in schedule.bookings, on its own id (never the NHI), linked to its waiting row; one isolation sweep proves no Booking count, fee, completion, billing, BCTI, search, warning or to-do path reads it.
- One path: only settleStubForRow changes a stub's status, inside decideImportRow's commit; resolveStub composes 33's correctImportRow and decideImportRow and is what 34 and 40 reuse.
- A List holding a stub never reads all-complete, through the stub's own marking only: no Warning record, no to-do entry, no prompt or block at submit or authorise.
- The stub readings are labelled once: in code (STUB_READINGS), once in the app and on the owner's list.
- Say "a stub", never "stub Booking"; no "slot" in app copy.

Phase goal: an incoming booking with no NHI still waits in the unmatched queue and creates no Booking, and a stub, a record of its own outside the Bookings table and never keyed on the NHI, stands in its place on its List, clearly marked in the mobile, web and Admin List views and never counted as a Booking; a List holding one never reads all-complete, with no warning, to-do entry, prompt or block; the office resolves it on Matching through one audited path, Add NHI creating the Booking that takes the stub's place or Reject removing it, which 34 and 40 reuse.
