Please run requirements catch-up Phase 40a (NHI lookup and identity standards) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (one session, track: Patients). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: if the session runs long, stop green at work item 7 so I can commit (you still never commit), and do items 8 to 16 in a short second sitting.

Hold to these above all:
- Validate before lookup: validateNhi in src/domain/nhi.ts is the only validator, its reasons exported once as NHI_REASONS; Look up stays disabled until the NHI is valid, and Save still needs a valid NHI when the Hub is down.
- The register is a pure function of the seed on its own stream, slotRng(seed, 'nhi-register'): it moves no existing draw, is never in the store or persisted, and reserves ZBW6638 and every intake-fixture NHI.
- The add form's payer block is 22a's (the payer each new Procedure takes, through setProcedurePayer and the Paid by sheet): a found patient fills it only while it is "The patient", a "Someone else" guardian is never overwritten, and the lookup adds no payer-writing path.
- The only wall-time element is the visible wait, a UI-layer timer; stored times come from the demo clock and no stale answer fills the form.
- Refresh is office-only, one audited mutate stamped from clockISO, differences default to Keep, and it never touches Xero, the ledger, any Booking or 40's pendingDetails.
- HPI CPN has one label and one formatter with a real grep-gate test; build no check character and no practitioner lookup.

Phase goal: on every add-booking flow (mobile, web and Admin phone advice, on an ACTIVE List with the RVG type-ahead, the Procedure description, the required NHI and 22a's payer block, which follows a found patient but never overwrites a guardian), the NHI is validated as it is typed and only a valid NHI is looked up, through a simulated Digital Services Hub over a deterministic synthetic register, with checking, slow and unavailable states, a manual-entry fallback and a statement that the NHI is used only to identify the patient. The office can refresh a patient from the register, stamped "Last refreshed". HPI CPN is the one practitioner identifier label and format everywhere it shows.
