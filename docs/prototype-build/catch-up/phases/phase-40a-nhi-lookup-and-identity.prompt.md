Please run catch-up Phase 40a (NHI lookup and identity standards) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase (track: catch-up, one session). The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Overrides:
- One session. If it runs long, stop green at work item 7 so I can commit (you still never commit), and do items 8 to 16 in a short second sitting.
- PERSIST_VERSION: bump only if the seed's content changes (the two new fields are unseeded); add the migrate test (persisted state without nhiHubMode loads as Available) either way.
- The drift check runs against the plan's baseline, catalogue commit fbdd555.

Stop if: only the doc's two stops (the NHI stops being mandatory; the catalogue asks the system to validate an HPI CPN's check character or look practitioners up). A scheduled refresh in the catalogue is not a stop: keep the per-patient action and add a "Run register refresh" trigger, not a timer. Given purpose wording is used verbatim.

Hold to these above all:
- Validate before lookup: validateNhi in src/domain/nhi.ts is the only validator, its reasons exported once as NHI_REASONS and shown verbatim as typed; Look up stays disabled until the NHI is valid, and Save still needs a valid NHI when the Hub is down.
- The register is built by a pure function from the seed on its own stream, slotRng(seed, 'nhi-register'): it moves no existing draw, never enters the store, is never persisted, and reserves ZBW6638 and every intake-fixture NHI from 33, 34 and 40. Prove each in Vitest.
- The only wall-time element is the visible wait, a UI-layer timer like PhotoCaptureFlow's; everything stored comes from the demo clock, tests pass zero timing, no stale answer fills the form and no timer outlives its component.
- The d4db277 form: change only the patient section. The payer follows a found patient only while it is "The patient"; a "Someone else" payer (a guardian) is never overwritten by a lookup, a second lookup or a Retry; the RVG code, Procedure description and Contract are never touched. Tests, checklist, recipes and PWA parity run on Dr Souter's ACTIVE Tue 21 Jul PM List; never "Open", "DRAFT" or "Enter manually" for an assigned List.
- Refresh is office-only, one audited mutate stamped from clockISO, differences default to Keep, and it never touches Xero, the ledger, any Booking or 40's pendingDetails.
- HPI CPN: one label and one formatter (HPI_CPN_LABEL, formatHpiCpn in src/shared/format.ts) with a real grep-gate test; build no check character and no practitioner lookup, and say so in PROGRESS.

Phase goal: on every add-booking flow (mobile, web and Admin phone advice, on the d4db277 forms: an ACTIVE List, the RVG type-ahead, the Procedure description, the required NHI and the payer on the Booking, which follows a found patient but never overwrites a guardian), the NHI is validated as it is typed and only a valid NHI is looked up, through a simulated Digital Services Hub over a deterministic synthetic register, with checking, slow and unavailable states and a manual-entry fallback, and a statement that the NHI is used only to identify the patient. The office can refresh a patient from the register, stamped "Last refreshed". HPI CPN is the one practitioner identifier label and format everywhere it shows.
