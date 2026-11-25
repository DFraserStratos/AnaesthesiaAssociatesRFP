Please run build plan Phase 52 (Make an anaesthetist inactive from a last day) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane A of the build lanes (docs/build-plan/LANES.md). If this session is not the Lane A session inside its worktree (branch lane/a), stop and tell me to paste docs/build-plan/lanes/lane-a.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (2 sessions: session 1 the domain, store, sign-in and seed, ending on a `52 checkpoint:` commit; session 2 the record's cards and sheets, the triggers and the specs). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Hold to these above all:
- Activity lives in one pure `isActiveOn(anaesthetist, dateISO)` in `domain/anaesthetistStatus.ts`; the stored `active` flag is deleted and every reader keys on the date the work is for (the AA fee run on the month, the receipt guard on existence only).
- Contracts are disabled and re-enabled only through `disableContract` and `enableContract`, from new files; the Contracts code is left untouched, and only Contracts the rule disabled are offered back.
- Make inactive is refused while they hold a List after the last day and shows those Lists; no List is ever deleted, and Slots follow `isActiveOn` after every action.
- `anaesthetistSession.ts` stays pure; Dr Souter's sign-in (S1's start) works exactly as today, and neither trigger makes her inactive.
- Bump `PERSIST_VERSION` once; the seed stays deterministic.

Phase goal: the office makes an anaesthetist inactive from a chosen last day with a reason, refused while they hold a List after it, cleared before the day, or made active again after it, each an audited change. After the last day they have no Slots, are offered or picked for nothing, cannot sign in on mobile, PWA or web, and the system disables the Contracts held by their own Party and linked to them; made active again, Slots and sign-in return from that day and those Contracts are offered back ticked with their prices. A status card, the make-inactive and offer-back sheets and a history card sit on today's anaesthetist record, the edit sheet's Active toggle goes, and the phase finishes US-04.1.2 (D96). Layout reference: docs/explorations/people-section.html, `#inactive`.
