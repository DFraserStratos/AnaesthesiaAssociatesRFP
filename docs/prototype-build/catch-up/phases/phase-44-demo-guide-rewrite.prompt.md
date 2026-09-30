Please run catch-up Phase 44 (Demo guide rewrite and final sweep) of the Anaesthesia Associates prototype. The repo root is /Users/d.fraser/Local Dev/Anaesthesia Associates RFP (the app is aa-prototype/); every path below is relative to it.

This phase is planned as two sessions. Session 1: the drift check, the inventory, the scenario-jump module, the audit, guide-sync and copy-guard tests, the copy sweep and the re-baselined figures (work items 1 to 7), ending with a draft Phase 44 PROGRESS entry that holds what Session 2 needs. Session 2: the run sheet, the other guide files, the master guide, the QA pass and the close-out (items 8 to 13). If a draft Phase 44 entry already exists in PROGRESS.md, you are in Session 2: read it first, re-run the drift check, and start at item 8.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the owner decisions table (D1 to D11), the sequencing rules (44 runs last, after 14 to 43), the "Demo triggers", "PWA parity" and "Demo guide" sections, the "Milestone demos" list (the "After 44" line is this phase's acceptance) and "Parked" (US-08.6.4 stays out).
2. docs/prototype-build/catch-up/phases/phase-44-demo-guide-rewrite.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic", especially "Demo impact (S1 to S5)", "Demo-trigger buttons", "Remove or rework" and "Uncertainty". Then RV-17 (and RV-22) in docs/prototype-build/catch-up/analysis/reverse-check.md, and sections 5.1, 7 and 9 of analysis/prototype-map-shell-demo-pwa.md for orientation.
4. The "Demo triggers" and "Demo guide updates" sections of every catch-up phase doc, docs/prototype-build/catch-up/phases/phase-14 to phase-43: the inventory of what each phase registered and which beats it patched.
5. The catalogue files this phase relies on, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/FT-08.2.md, US-06.4.1.md, US-05.2.2.md, US-05.2.7.md, FT-13.3.md and US-11.1.2.md;
   - questions/OQ-08.md, OQ-50.md and OQ-30.md;
   - the status line of every questions/OQ-*.md file, because the guide's discovery points and "Open questions" tab are built from their status at HEAD.
6. All of docs/demo-guide/: README.md, 01-personas-and-responsibilities.md, 02-workflows-and-handoffs.md, 03-demo-script.md, 04-presenter-cheat-sheet.md and master-demo-guide.html, as the earlier phases left them.
7. docs/design/Design Language.dc.html (the tokens the master guide transcribes: crimson identity only, teal the only action colour, mono tabular figures) and docs/design/Mobile App.dc.html (the header, dock and tab bar the PWA Demo chip must clear). These are the AUTHORITATIVE visual reference (convention 17).
8. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 13, 14, 16, 17 and 18);
   - the Decisions-log entries this phase amends or supersedes: 2026-07-22 "Time-unit partial-interval rounding = round UP per started interval, a named ASSUMPTION", and the Phase 12 entry (the scenario jumps and the guided script); for context, 2026-07-28 "Build-phase scaffolding removed from rendered app copy";
   - every catch-up phase entry, 14 to 43: its name map, the D1 to D11 branch it built, its provisional labels, and its handoff notes "For 44".
Also read requirements-board/capture/ATLAS.md ("Scenario jumps" and the scenario hooks), because the capture recipes use { "scenario": "Sn" }.

Then do the drift check in the phase doc:
- run git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md" (read the whole diff; at plan time, 2026-10-01, it was empty), and for anything changed decide whether it changes a scripted beat or one of RV-17's readings;
- if a change or a late owner answer is not reflected in the build, script the app as built, label it provisional, and list it for me; do not rework features in this phase;
- drop, or move to Future-scope narration, any beat whose item is now Retired or Future, and log it;
- write down the OQs open at HEAD and the D1 to D11 branch table (answered or default, and the exact label the UI shows);
- note each cited requirement's status: Confirmed is AA's rule, Proposed is the design pending sign-off (never "AA confirmed"), Open or Verify is provisional;
- confirm Phases 14 to 43 are DONE in the PROGRESS status table (stop and tell me if any is not);
- note the current PERSIST_VERSION and the Vitest and Playwright counts.
Then enter plan mode, turn this session's work items into ordered steps (Session 1: the inventory, then the scenario module, the audit and sync tests and the copy sweep, then the figures; Session 2: the run sheet, the other guide files and the master guide, then the QA pass and the close-out), and wait for my approval.

While working:
- No behaviour change. This phase changes copy, the scenario-jump module, tests and docs. Billing maths, guards, the ledger and the seed stay as Phases 14 to 43 left them. If a scenario truly cannot be staged through existing guarded store actions and the seed must change, bump PERSIST_VERSION by one, extend the migrate test and say why.
- Script the app as built. Every Click step, label and figure is read from the running app after a Reset, never computed by hand and never carried over from July or an interim phase. Where two surfaces disagree, that is a bug for the QA pass.
- Open stays open. Never describe as settled anything that is Open, Confirm or Proposed at HEAD. Settled readings are stated plainly; open ones are labelled provisional and cite the OQ id, not "the RFP"; Future items carry the Future scope badge. Keep the OQ-50 caveat (on the Control Panel callout), the OQ-30 NHI-in-Xero caveat and the NHI "modulus 24" flag.
- Scenario jumps: keep the ids S1 to S5 and the scenario-s1 to scenario-s5 and scenario-confirm data-shot hooks exactly; stage through guarded store actions only, as the shared actors; offer one deep link per core beat, resolved from state.
- Demo triggers: add no harness-bar entry and nothing to the Control Panel page, which stays the index (scenario jumps, clock and reset, Demo actions by screen). Audit every entry: it shows only on its own screen, office stand-ins are PWA only, nothing routes to /demo/control, and every scripted "Demo actions" or "Demo sheet" press exists. A mobile beat with no handset path gets a PWA-only stand-in only if an existing store action covers it, following Phase 14's contract with its body in src/shared or src/store so pwaPurity holds; otherwise log it.
- The rewrite: beats numbered with no letters, optional material as marked asides, a Handset line on every beat with a mobile side, provisional readings named with their OQ or D number, discovery points only for questions open at HEAD. The master guide is regenerated in full from the Markdown and stays self-contained (no network, opens from the file system, prints S1 to S5 one scenario per page).
- Design and copy: the master guide keeps its tokens in step with Design Language (teal the only action colour, crimson identity only); no en or em dashes in any app copy; the new copy guard test enforces it.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go. Add the Vitest tests the doc lists (demoScenarios, demoTriggerAudit, demoGuideSync, appCopy) and the Playwright audit specs. demoGuideSync's assertions against the real guide files stay skipped until the Session 2 rewrite lands, then are un-skipped; the phase never closes with them skipped. A new PWA Playwright spec needs the pwa-device testMatch and the prototype testIgnore in playwright.config.ts widened.
- Names: the doc names things as planned (for example Phase 14's src/store/demoActors.ts with OFFICE_ACTOR, SOUTER_ACTOR and OFFICE_SIMULATION_ACTOR, which some later plans call SIMULATED_OFFICE_ACTOR). Each phase's PROGRESS entry records what was built; where they differ, the entry wins.
- Do not edit CLAUDE.md; tell me what is stale in it instead.
- Do not commit or push.

End of Session 1: build, build:pwa and Vitest green; write the draft Phase 44 PROGRESS entry (status IN PROGRESS) with the drift-check result, the OQ list, the D1 to D11 table, the beat and registry inventory and the figures table; tell me Session 2 starts at item 8. Do not start the rewrite in Session 1 if the session is running long.

When done (end of Session 2):
- run the manual test checklist and report each item, including S1 to S5 run end to end from Reset on the framed build, and every beat with a mobile side run on a handset with "Play the office" OFF (say whether it was a real phone or the emulated 393x660 viewport);
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green, and npm run verify:board if any board file changed;
- run the adversarial review-and-fix pass (convention 18: fan out three Opus review subagents for quality, bugs and plan adherence, plus a fourth "presenter" who follows only master-demo-guide.html through the app cold, all steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones; re-green);
- update PROGRESS.md: the status row and a phase entry (the drift-check result, the OQ list and D1 to D11 table, the re-baselined figures, the parity matrix, the trigger audit result, the copy sweep site by site, the tests added, the before and after counts, PERSIST_VERSION, the review pass); the Decisions-log entries listed in the phase doc (one amended, one superseded, two new); the catch-up closing summary; and the open-items handoff;
- the demo guide is this phase's deliverable: all five files in docs/demo-guide rewritten or brought into line, master-demo-guide.html regenerated in full, the scenario text in demoScenarios.ts, aa-prototype/README.md and requirements-board/capture/ATLAS.md updated, ending with a consistency read of the master guide against the Markdown and the running app;
- give me short, clear notes on what changed, what you logged rather than fixed, and anything still provisional.

Phase goal: one coherent S1 to S5 run sheet and a regenerated master guide that match the finished app in the catalogue's vocabulary, with rebuilt scenario jumps, no stale "open RFP question" copy (the OQ-50 caveat kept), every demo trigger audited to its own screen, every mobile beat runnable on a handset, and the catch-up recorded in PROGRESS.md.
