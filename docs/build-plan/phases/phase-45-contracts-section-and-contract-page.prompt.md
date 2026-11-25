Please run build plan Phase 45 (The Contracts section and the Contract page) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (2 sessions; the checkpoint is after Work item 6). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Hold to these above all:
- The Contract page is keyed by the Contract id, never the AA code (D92). Every in-app link goes through `contractsPaths.ts`. Old `?view=contracts` links (`&contract=`, `&holder=`) redirect from one helper in `AdminMastersRoute`, and the redirect stays.
- One card, one save: `editContract` gets only that card's fields and writes one audited `contract.update`. A refusal shows on that card with `outcome.message`, and nothing changes.
- Disable lists `stillOnContract` from the date `disableFromISO` gives (today for now; 49 widens it). Nothing moves, and Make active undoes it. A system Contract has no Disable and edits only `SYSTEM_CONTRACT_EDITABLE_FIELDS`.
- The `Card` footer/editing and `ConfirmSheet` `confirmVariant` additions default to today's look and get their catalogue rows. Build no private copy. Amend DECISIONS.md "Buttons" for the danger confirm.
- Create still opens the old `ContractPanel` until 46, with the D23 caption pinned in both files. Keep the trigger labels unchanged, change no seed and do not bump `PERSIST_VERSION`.

Phase goal: Contracts becomes its own Admin section, between Ledger and Master data, with the Contract list moved onto it. Every Contract gets a page at `/admin/contracts/:contractId`: a header with Disable or Make active; Overview, Bookings, Event fees and History tabs; and an "On this Contract" rail. Its cards (price, where it is offered, who it bills, invoice and codes) are each edited and saved on their own as one audited change. The settings fixed at creation and the holder Party's billing details are read-only. The price ranges become a newest-first table with To, Change and Procedures priced, and ended ranges fold after three. Disable is confirmed over the Procedures still on the Contract from today. System Contracts are limited to their name, AA code and invoice description. The side panel keeps only create, until 46.
