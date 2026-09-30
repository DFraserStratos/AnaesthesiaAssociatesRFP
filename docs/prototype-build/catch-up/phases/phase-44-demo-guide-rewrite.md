# Phase 44 · Demo guide rewrite and final sweep

**Requirements covered:**
[RV-17](../analysis/reverse-check.md#rv-17-stale-open-rfp-question--discovery-item-copy) Stale
"open RFP question / discovery item" copy. No DM items and no gap items: every gap, DM and RV item
except this one closed in Phases 14 to 43 (US-08.6.4 stays parked, see [ROADMAP](../ROADMAP.md#parked)).
Read alongside, because RV-17 cites them as the readings the copy must now state:
[FT-08.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.2.md) (one invoice per billable party within a Booking) ·
[US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md) (prepayment invoiced at setup, balance after AUTHORISED) ·
[US-05.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.2.md) (tiered time units, "or part thereof") ·
[US-05.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.7.md) (prices held GST exclusive) ·
[FT-13.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.3.md) (billing monitor in the Admin App, "our own proposal") ·
[OQ-08](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-08.md) (List reassignment mechanism, Answered) ·
[OQ-50](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-50.md) (the rule after two hours, **Open**: its caveat stays).
Also read, for the S5 caveat that must stay:
[OQ-30](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-30.md) (NHI in Xero, Open) and
[US-11.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.2.md) (still says "modulus 24"; the mod-11 label stays flagged).
**Depends on:** every catch-up phase, 14 to 43, DONE. This phase runs last. It changes no domain
behaviour; it re-walks and re-scripts what 14 to 43 built.
**Estimated:** 2 sessions (one is not realistic for four new Vitest files, two
Playwright specs, a copy sweep of about twenty sites, five rewritten guide files, a regenerated
1,400-line master guide, two full walks of S1 to S5 plus a handset pass, and a four-reviewer
adversarial pass).
- **Session 1 (code and baseline):** drift check, items 1 to 7. It ends green with a draft Phase 44
  PROGRESS entry (status IN PROGRESS) holding what Session 2 needs, because scratchpad notes do not
  survive the session: the drift-check result, the OQ list at HEAD, the D1 to D11 table, the beat and
  registry inventory (item 1) and the re-baselined figures (item 7).
- **Session 2 (documents, QA, close-out):** items 8 to 13, starting from that draft entry.
Regressions the QA pass finds are fixed only if small (item 12); anything larger is logged, never a
third session.

## Goal

Thirty phases each patched only the beats they broke. The presenter now needs one coherent script
that matches the finished app, told in the catalogue's vocabulary (Booking, Slot, List, Draft List,
Contract, billable party, ledger), and one self-contained master guide generated from it.

This phase:

- **rewrites the S1 to S5 run sheet** (`docs/demo-guide/03-demo-script.md`) around the new model,
  folding in every lettered beat and optional aside the earlier phases left, renumbering them, and
  adding the new beats the gap analysis asked for: **sync then match** (S1), **Draft List assign
  with the waiting flag**, the **blacklist warning**, the **conflict dashboard**, **swap with office
  confirmation** (S2), **credit-and-rebill** (S4), the **missing-NHI list** and **authorise, then
  edit the unit value, with the invoice unchanged** (S5);
- **re-baselines every figure** the guide quotes from the running app after a reset, never by hand;
- **rebuilds the Control Panel scenario jumps** as a pure, tested module whose jumps stage only what
  their scenario needs and then offer one deep link per beat;
- **regenerates `master-demo-guide.html` in full** from the rewritten Markdown, and brings the
  personas, workflows, cheat sheet and demo-guide README into line;
- **sweeps stale "open RFP question / discovery item / assumption" copy** from the app (RV-17),
  stating the catalogue's reading where it is settled, citing the OQ where it is still open, and
  keeping the OQ-50 caveat; a source-scan test stops it coming back;
- **audits every registered demo trigger**: it shows only on its own screen, the Control Panel is
  only the index, and every beat with a mobile side can be run on a handset through the PWA sheet;
- runs a **full QA pass** on the framed build and on a handset, and **records the catch-up** in
  PROGRESS.md.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot. This phase scripts the whole app, so
   read the whole diff, not only RV-17's references:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   At plan time (2026-10-01) there was no diff. For each changed item:
   - if it is one RV-17 cites (FT-08.2, US-06.4.1, US-05.2.2, US-05.2.7, FT-13.3, OQ-08, OQ-50), re-read
     it and adjust work item 6's wording for it;
   - if it changes a behaviour a scripted beat relies on, check the owning phase's PROGRESS entry for
     whether the build followed it. If the build did not, **do not change the build here**: script the
     app as built, label the beat provisional, and list the item for the owner in the PROGRESS entry;
   - if an item is now Retired or Future, drop its beat (or move it to "What to narrate rather than
     click" as Future scope) and record that in the PROGRESS entry.
2. **Every open question the guide will name.** Re-read the status of each OQ at HEAD
   (`catalogue/questions/OQ-*.md`). The guide's "Open questions" list and every discovery point are
   built from HEAD statuses, not from this doc. At `1f067a8` the Open, Confirm or Proposed ones were
   OQ-02, 03, 05, 06, 10, 12, 13, 15, 17, 18, 19, 23, 27, 29, 30, 31, 38, 39, 40, 41, 42, 43, 44, 45,
   46, 47, 48, 49, 50, 51, 52, 53 and 54. Anything now Answered is stated as the rule, with no caveat;
   anything still open keeps "provisional" in the same words the UI uses.
   **Requirement statuses matter too** (catalogue `README.md`, "Status"): a **Confirmed** item is
   AA's rule and is stated plainly; a **Proposed** item (most of the catalogue, including FT-08.2,
   US-05.2.2, US-05.2.7 and FT-13.3) is the system's design pending AA sign-off, so the app and guide
   may describe it as how the system works but never as "AA confirmed"; an **Open** or **Verify**
   item is provisional and says so. "Settled" in this doc means an Answered OQ or a Confirmed item;
   a Proposed item is "the design".
   - **OQ-50** (the rule after two hours). If still open, keep its one caveat (work item 6). If
     answered, remove the caveat, state the rule, and check `src/domain/billing/timeUnits.ts` agrees;
     if it does not, stop and raise it with the owner (a billing change is not this phase's to make).
   - **OQ-30** (NHI in Xero). If still open, S5's "no NHI in Xero" beat keeps its "stricter reading,
     to confirm" line.
3. **Owner decisions D1 to D11.** From the PROGRESS entries of Phases 16, 19, 20, 21, 27, 32, 38, 39
   and 40, write down which branch each phase built (answered or default) and the exact provisional
   label it shows. If the owner has answered a decision since its phase ran and the build still
   carries the default, script the build as it stands, label it provisional, and raise it with the
   owner; do not rework the feature here.
4. **Prerequisites.** Confirm Phases 14 to 43 are DONE in the PROGRESS status table. If any is not,
   stop and tell the owner: 44 runs last. Read every catch-up phase entry's handoff notes "For 44"
   (at least 16, 25, 27, 32, 33, 34, 35, 36, 37 and 38 leave one), and the name maps each entry
   records (routes, registry ids, store actions, seed constants). This doc names things as they were
   planned; the entries record what was built. Where they differ, the entry wins.
5. Note the current `PERSIST_VERSION` and the Vitest and Playwright counts before you start.
6. Record the drift-check result in the PROGRESS entry.

## Reference

**Design files (convention 17):**
- `docs/design/Design Language.dc.html`: the master guide's own tokens (`:root` in
  `master-demo-guide.html`) are transcribed from it. Keep them in step: neutrals, status colours, crimson
  `#A91E3E` for identity only, teal `#0D6E63` the only action colour (the guide's buttons), mono
  tabular numbers for figures. The status legend follows Phase 29's Slot status master data
  (`SLOT_STATUSES` / `SEED_STATUS`, seven seeded rows at plan time, OQ-17 provisional) with the
  colour tokens in `src/theme/statusColours.ts`; take the count and names from the seed as built.
- `docs/design/Mobile App.dc.html`: the header, dock and tab-bar positions the PWA "Demo" chip must
  clear during the handset audit.
- The six layout pages (Mobile App, Mobile Availability, Web Dashboard, Web Availability, Admin Day,
  Admin Review): only as the yardstick for spotting visual regressions during the QA pass.

**Catalogue:** the RV-17 references above, OQ-30 and US-11.1.2, and every OQ file the guide names
(step 2).

**Analysis:**
- `../analysis/reverse-check.md`: RV-17 (and RV-22 for the "Play the office" scaffold wording).
- `../GAP-ANALYSIS.md`: everything before "## By epic", especially "Demo impact (S1 to S5)", "Demo-trigger
  buttons", "Remove or rework" and "Uncertainty".
- `../ROADMAP.md`: "Demo triggers", "PWA parity", "Demo guide", "Milestone demos" (the "After 44" line
  is this phase's acceptance), "Parked".
- `../analysis/prototype-map-shell-demo-pwa.md`: sections 5.1 (Control Panel, `SCENARIOS`), 7 (PWA) and
  9 (the registry pattern). The code has moved a long way since the map; use it for orientation only.
- Every catch-up phase doc's "Demo triggers" and "Demo guide updates" sections (`phases/phase-14` to
  `phase-43`): the inventory of what each phase registered and which beats it patched.

**Code entry points** (paths at `1f067a8`, or marked as created by a catch-up phase; Phases 14, 15,
28 and 34 renamed or moved several, and each phase's PROGRESS name map is what was actually built):
- `aa-prototype/src/apps/demo/DemoControlPanel.tsx`: `SCENARIOS` (`:360` at `1f067a8`, with
  `Scenario`/`ScenarioResult` types and a `nav` link list per jump), `ScenarioJumps` (`:458`), the
  "Demo actions by screen" index (added by Phase 14), the billing-assumption callout (`:319-340`).
- `aa-prototype/src/shared/demoTriggers/` (**new in Phase 14**): `types.ts`, `match.ts`
  (`demoTriggersFor`), `registry.ts` (`DEMO_TRIGGERS`), `context.ts` (`useDemoTriggerContext`),
  `memory.ts`, `demoTriggers.test.ts`.
- `aa-prototype/src/shell/DemoActionsMenu.tsx` (**new in Phase 14**), `AppShell.tsx`, `appConfig.ts`,
  `src/router.tsx` and each app's `routes.tsx` (`src/apps/{admin,mobile,web}/routes.tsx`).
- `aa-prototype/src/pwa/PwaDemoActions.tsx` (**new in Phase 14**), `PwaDemoPanel.tsx`,
  `officeSimulation.ts`, `MobileViewport.tsx`, `pwaPurity.test.ts`; `aa-prototype/pwa/main.tsx`.
- `aa-prototype/src/store/demoActors.ts` (**new in Phase 14**: `OFFICE_ACTOR`, `SOUTER_ACTOR`,
  `OFFICE_SIMULATION_ACTOR`; Phase 35 adds `SECOND_OFFICE_ACTOR`, Tama R.; Phases 32 and 41 call the
  simulated actor `SIMULATED_OFFICE_ACTOR` in their plans, so use whatever name Phase 14's entry
  records), `src/store/officeStandIn.ts` (**new in Phase 14**), `clockActions.ts` (`resetDemo`, `:110`),
  `src/domain/seed` (`SEED_LIST_IDS` in `index.ts`, `SEED_MARKERS`, `listIdForSlot` in `canvas.ts`,
  `ANAE` in `cast.ts`).
- RV-17's copy sites at `1f067a8` (confirm each by grep; 15 renamed Card files, 27 and 28 rewrote some):
  `apps/admin/screens/InvoicesScreen.tsx:88-89`, `shared/card/CardDetailBody.tsx:532`,
  `apps/admin/screens/InvoiceDocument.tsx:216,511`, `apps/admin/flows/ReassignListFlow.tsx:31,112`,
  `shared/capture/UnitsCard.tsx:68`, `apps/demo/DemoControlPanel.tsx:336-339`. Further hits at `1f067a8`:
  `apps/admin/screens/BillingMonitorScreen.tsx:107-111,203`, `apps/admin/screens/IntegrationMonitorScreen.tsx:416`,
  `apps/demo/DemoXero.tsx:501`, and comments in `domain/billing/timeUnits.ts:7-8`,
  `store/prepaymentActions.ts:19-20`, `domain/billing/agencyFee.ts:4`, `domain/billing/invoiceBuild.ts:34`,
  `apps/admin/reviewFlags.ts:7`, `domain/types.ts:554,788`, `domain/seed/rvgCodes.ts:8`,
  `domain/billing/modifierCodes.ts:6`, `store/paymentActions.ts:21`, `domain/nhi.ts:4`,
  `apps/admin/flows/ReassignListFlow.tsx:31-32`.
- `aa-prototype/src/shared/audit/auditNarrative.test.ts`: the "label coverage" source scan
  (`import.meta.glob('../../store/**/*.ts', { query: '?raw', ... })`, `:225`) to copy for the copy
  guard (work item 6d); `src/pwa/pwaPurity.test.ts` and `src/domain/domainPurity.test.ts` use the same
  pattern.
- Playwright: `aa-prototype/visual/demo-actions.spec.ts` (**new in Phase 14**), `visual/pwa-device.spec.ts`
  (the PWA project), `visual/phase12.spec.ts` (scenario jumps), `playwright.config.ts` (the
  `pwa-device` project has `testMatch: /pwa-device\.spec\.ts$/` and `prototype` the matching
  `testIgnore`, so a new PWA spec needs both regexes widened).
- Docs: all of `docs/demo-guide/`; `aa-prototype/README.md` (Control Panel, Demo actions, Office
  simulation sections); `requirements-board/capture/ATLAS.md` ("Scenario jumps" table, the
  `scenario-s1` to `scenario-s5` and `scenario-confirm` hooks) and the capture recipes whose setup is
  `{ "scenario": "Sn" }` (about 20, for example `US-08.1.1.json`).

## Work items

Session 1: the inventory (1), the code (items 2 to 6, small, test-backed) and the figures (7).
Session 2: the documents (8 to 11), the QA pass (12) and the record (13). No domain or billing behaviour changes. The seed does not change unless a
scenario jump truly cannot be staged through existing guarded actions; if it does, bump
`PERSIST_VERSION` by one, extend the migrate test, and say why.

### Session 1: code and baseline (items 1 to 7)

1. **Inventory (working notes in the scratchpad while you work; the tables Session 2 needs are
   copied into the draft PROGRESS entry at the end of Session 1, not into a separate report file).**
   - Every beat, lettered beat (1b, 3a, 3b and so on) and optional aside in the current
     `03-demo-script.md`, with its screens, the Demo actions entries it presses, whether it has a
     mobile side, and its source phase.
   - Every registry entry: dump `DEMO_TRIGGERS` (id, label, `screen`, `routes`, `surfaces`, `badge`,
     `indexPath` on the pristine seed) with a throwaway script or `vitest` snippet in the scratchpad.
   - Every scenario jump's current staging and message.
   - The D1 to D11 branch table from drift-check step 3, and the open OQ list from step 2.
   This inventory drives items 2 to 12.
2. **Scenario jumps become a pure, tested module** (`aa-prototype/src/apps/demo/demoScenarios.ts`).
   Move `SCENARIOS` out of `DemoControlPanel.tsx`:

   ```ts
   interface ScenarioBeatLink { beat: string; label: string; path: (state: AppState) => string | null }
   interface DemoScenario {
     id: 'S1' | 'S2' | 'S3' | 'S4' | 'S5'   // stable: capture recipes use { "scenario": "Sn" }
     title: string
     blurb: string
     stage: (api: AppStoreApi) => { ok: boolean; message: string }
     beats: readonly ScenarioBeatLink[]     // one per core beat, in script order
   }
   ```

   - Every `stage` starts with `resetDemo(api)` and then applies only what its scenario cannot reach
     from the pristine seed, through the real guarded store actions as `OFFICE_ACTOR` or
     `SOUTER_ACTOR` (never a direct state write). Expected at plan time, confirm against the
     inventory:
     - **S1, S2, S4:** reset only (S4's staging, if any, is done live from each beat's Demo actions).
     - **S3:** reset, then check both Souter Mon 20 Lists are SUBMITTED (the existing precondition).
     - **S5:** reset; stage the audit trail on David Chen's Booking with Phase 35's
       `saveBookingChanges` for the office edit (so History shows a grouped change set) and the
       anaesthetist's own edit path for the ASA edits; then authorise Dr Whitaker's Fri 17 List so a
       Contract version is locked (Phase 25) and its invoices exist.
   - `beats[].path` resolves a deep link from state (seed constants, `listIdForSlot`, or a selector
     such as "the first S3 invoice after authorise"), returning `null` with the reason in the label
     when the target does not exist yet (for example an invoice before the List is authorised).
   - Messages are rewritten to the new beats: short, each beat named by its screen and its Demo
     actions entry, no en or em dashes, no "Control Panel" instructions except the index.
   - Vitest `demoScenarios.test.ts`: on a fresh store each `stage` returns `ok: true`; S3's Lists are
     SUBMITTED; S5 leaves a change set on Chen's History and a locked Contract version on Whitaker's
     Bookings; staging twice from reset gives deep-equal domain state (determinism); every non-null
     beat path matches one of the app's route patterns and names ids that exist in state; every
     title, blurb, message and label is dash-free.
3. **Control Panel page reads the module** (`DemoControlPanel.tsx`): `ScenarioJumps` renders from
   `DEMO_SCENARIOS`. After a jump it shows the message and a numbered list of beat links ("Beat 1 ·
   Admin Intake"), each navigating to `path(state)` evaluated at click time (disabled with its reason
   when `null`). Keep the `scenario-<id>` and `scenario-confirm` `data-shot` hooks exactly. Keep
   "Clock & reset" and Phase 14's "Demo actions by screen" index; no trigger buttons on the page.
   Update the page subtitle. Rework the billing-assumption callout per item 6a.
4. **Trigger audit, in tests.**
   - Vitest `src/shared/demoTriggers/demoTriggerAudit.test.ts` (extends, does not duplicate, 14's
     `demoTriggers.test.ts`):
     - every entry with `badge: 'office-stand-in'` has `surfaces` exactly `['pwa']`;
     - every entry that declares `'pwa'` has only `/mobile/...` routes (the PWA has nothing else);
     - no entry declares a `/demo/control` route (the Control Panel is the index, never a trigger host);
     - no two entries visible on the same route **and the same surface** share a label (a bar entry
       and a PWA entry may share one, as Phase 27's "Move to 2 days before procedure" does);
     - every entry's `indexPath`, on the pristine seed **and** on each scenario's staged state, is
       `null` or matches one of its own `routes`;
     - every entry carrying `badge: 'future-scope'` is bar only and is one of an explicit expected
       list kept in the test: at plan time Phase 34's `fire-hospital-message` and
       `replay-hospital-message` (Future-scope surface routes only, `/demo/integrations...`) and
       `auto-match` (`/admin/intake/matching`); confirm ids and routes against 34's entry. A new
       future-scope entry must be added to the list deliberately.
   - Playwright `aa-prototype/visual/demo-actions-audit.spec.ts` (framed build): for every row of the
     Control Panel index that has an "Open screen" link, click it and assert the harness bar's
     `[data-shot=demo-actions]` pill lists `[data-shot=demo-action-<id>]`; then open one screen that
     registers nothing (for example `/web/lists`, if still empty by then) and assert the pill is absent.
   - Playwright, PWA project (`visual/pwa-device.spec.ts`, or a new spec with the `pwa-device`
     `testMatch` and the `prototype` `testIgnore` widened to match it): for each mobile screen (Lists,
     a List, a Booking, Availability and its calendar, Balances, More and the profile under it),
     assert the "Demo" chip is present or absent as the inventory (item 1) expects (item 12's parity
     matrix corrects the table in Session 2 if the handset pass disagrees), and that each
     expected entry's label is in the sheet. Keep the expected table in the spec, one row per screen.
5. **Guide-to-registry sync check** (Vitest, node `fs`):
   `src/shared/demoTriggers/demoGuideSync.test.ts` reads `../docs/demo-guide/03-demo-script.md` and
   `master-demo-guide.html` (tags stripped), resolved from the test file's own path, and skips with a
   clear message if the docs folder is absent. Convention for the rewrite (item 8): a harness-bar
   press is written **Demo actions → Label**, a handset press **Demo sheet → Label**. The test
   extracts every such label and asserts it is a registered label on an entry with the matching
   surface, and that every registered entry appears in the run sheet or in an explicit
   `NOT_SCRIPTED` list with a one-line reason (for example a diagnostic entry). This is the guard
   that keeps the guide honest as the catalogue keeps moving. **Timing:** the current run sheet does
   not use the convention, so write the test in Session 1 with its extraction unit-tested on a small
   inline fixture and the two assertions against the real files marked `it.skip` with a comment
   "enabled after the item 8 rewrite"; Session 2 un-skips them as soon as item 8 lands, and the
   phase does not close with them skipped.
6. **Stale copy sweep (RV-17).**
   a. **RV-17's sites** (grep each first; several were rewritten by 16, 21, 22, 27, 28 or 34, and a
      site that no longer exists is recorded as "already fixed by Phase NN"):
      - **Invoices screen subtitle:** state FT-08.2: one invoice per billable party within a Booking.
        No "discovery question". (Phase 21 may already have done this.)
      - **Booking detail prepayment note** (`CardDetailBody.tsx:532` at `1f067a8`, renamed by 15,
        rewritten by 27): no "RFP open question". State US-06.4.1: invoiced at setup, the balance
        invoiced after authorise. Keep the D6 provisional label if D6 is unanswered (it is the named
        FT-08.1 exception).
      - **Invoice document GST footer** (`InvoiceDocument.tsx:216`): prices are held GST exclusive and
        GST is added at the NZ standard rate (US-05.2.7). No "demo assumption" or "discovery item".
        Phase 22 made layout and GST Contract-driven (and Phase 18 added GST incl/excl on fee lines),
        so word the footer to what 22's entry says the invoice now shows, not to this sentence.
        Keep Phase 22's provisional agency wording (OQ-29) where it sits.
      - **Invoice document prepayment text** (`:511`): drop "the timing ... is a discovery point".
      - **Reassign List flow** (`ReassignListFlow.tsx:31,112`, reworked by 28 and 30): no "Proposed
        reading" or "replaceable" copy. OQ-08 is answered; the Slot move is the mechanism.
      - **T stepper caption** (`UnitsCard.tsx:68`, wherever it still renders): drop "(assumption)":
        "From start and finish · 1 unit per 15 min or part thereof, then per 10 min after 2 h".
      - **Control Panel callout** (`DemoControlPanel.tsx:336-339`): this is where **the OQ-50 caveat
        stays**: "Time units are tiered: 1 unit per 15 minutes or part thereof for the
        first two hours, then 1 per 10 minutes or part thereof. How the rule works after two hours is
        still being confirmed against the NZSA RVG (OQ-50)." Keep the label "Billing rule" rather
        than "Billing assumption".
   b. **Further hits at `1f067a8`, same treatment:**
      - Billing monitor subtitle (`BillingMonitorScreen.tsx:107-111`): the placement is "our own
        proposal" (FT-13.3), so write "The office's billing monitor, in the Admin App (proposed)", not
        "the RFP leaves open". The "Prior balance" sentences and the `:203` tooltip belong to Phase 40
        (RV-21) and should already be gone; if they are still there, that is a Phase 40 regression for
        item 12 (fix only if small), not new work here.
      - Xero pair fee line (`DemoXero.tsx:501`): Phase 16 took the fee off the payable and should
        have removed this line; if a fee-basis note survives on the AA fee pair, it cites the basis as
        provisional (OQ-02, D1 as built), not "prototype assumption" or "the RFP does not specify".
      - NHI validator note (`IntegrationMonitorScreen.tsx:416`, or wherever Phase 34 moved the
        Validators tab): **keep** the mod-11 flag, because US-11.1.2 still says "modulus 24". Reword
        "the RFP labels" to "the requirement labels" and "a discovery item" to "flagged for AA to
        confirm". Tell the owner the catalogue text still needs correcting.
   c. **Wider sweep.** Grep `aa-prototype/src` (excluding tests) for `RFP`, `open question`,
      `discovery`, `assumption`, `proposed reading`, `to confirm with AA`, `prototype's proposal` and
      `Type 1|Type 2|Type 3|billing route|addendum|5%|service fee`. Classify every rendered hit:
      - **settled in the catalogue** (an Answered OQ, or a Confirmed item): state the rule plainly;
      - **still open** (Open, Confirm or Proposed OQ at HEAD): keep it, labelled "provisional" or
        "to confirm with AA", citing the catalogue OQ id, not "the RFP";
      - **Future**: the "Future scope" badge (Phase 14's `DemoBadge` tone), never "open question".
      Never describe as settled anything still open. A Proposed catalogue item may be stated as the
      design ("proposed"), not as AA's confirmed rule. Update code comments that cite a superseded
      ruling (`timeUnits.ts:7-8`, `prepaymentActions.ts:19-20`, `agencyFee.ts:4`, `invoiceBuild.ts:34`,
      `reviewFlags.ts:7`, `types.ts:554,788`, `rvgCodes.ts:8`, `modifierCodes.ts:6`,
      `paymentActions.ts:21`, `nhi.ts:4`, `ReassignListFlow.tsx:31-32`, each wherever it now lives) to
      cite the catalogue item or OQ; no behaviour change.
   d. **Copy guard test** (`aa-prototype/src/appCopy.test.ts`, modelled on the label-coverage scan in
      `auditNarrative.test.ts`, via `import.meta.glob(..., { query: '?raw' })`): read every
      `src/**/*.ts(x)` and `pwa/**/*.ts(x)` except `*.test.*`, strip `//`, `/* */` and JSX `{/* */}`
      comments, and fail on:
      - `–` or `—` anywhere in what remains (string literals and JSX text);
      - `/RFP (open question|leaves|labels|is silent|does not (state|specify))/i`,
        `/open RFP question/i`, `/discovery (item|question|point)/i`, `/\(assumption\)/i`,
        `/(demo|prototype) assumption/i`, `/proposed reading/i`.
      Seed each pattern from a real `1f067a8` hit (the grep in the Reference list: "is an RFP open
      question", "a demo assumption", "% prototype assumption", "The RFP labels") so a unit test
      proves the guard would have caught it.
      An allowlist keyed by file and phrase holds the kept caveats, each with a one-line reason and
      the OQ id (OQ-50 on the Control Panel; OQ-30 on the Xero callout; the NHI label). An entry whose
      OQ is Answered at HEAD should be deleted, not kept.
7. **Re-baseline the figures (no code).** From **Reset → Confirm reset** (and from each scenario jump),
   walk every beat on the framed build and write down every figure and identifier the guide will
   quote, read from the screen: invoice numbers and totals, GST, the payable, the AA-FEE invoice total,
   ledger tiles and the imbalance amount, the prepayment estimate and part-paid amounts, the 3/2/2
   split and base units, credit and rebill numbers, conflict and Draft List counts, waiting times,
   sync times. Never compute a figure by hand; where two surfaces show the same figure, they must
   agree, and a disagreement is a bug for item 12. The table goes into the PROGRESS entry.
**End of Session 1:** build, build:pwa and Vitest green (the item 5 file-level assertions still
skipped); the draft Phase 44 PROGRESS entry holds the drift-check result, OQ list, D1 to D11 table,
inventory and figures table; hand back with a note that Session 2 starts at item 8.

### Session 2: documents, QA and close-out (items 8 to 13)

Start by reading the draft Phase 44 PROGRESS entry and re-running the drift check (the catalogue may
have moved between sessions).

8. **Rewrite `docs/demo-guide/03-demo-script.md`.** Keep the house structure: the one continuous
   object, Pre-demo setup, Direct URLs, then each scenario's **Serves**, **Time**, **Stage it**, beats
   with **Click / Say / Expected** (and **Worth pointing at** where useful), and **Discovery points**;
   then Recommended run orders, What to narrate rather than click, Recovery from demo accidents.
   New rules for this rewrite:
   - Beats are numbered 1, 2, 3 with no letters; optional material is a clearly marked
     **Optional aside** after the beat it belongs to, with its own Click / Say / Expected.
   - Every beat with a mobile side carries a **Handset:** line naming the PWA path (Demo sheet →
     Label, or "no office step needed").
   - Demo presses use the item 5 convention (**Demo actions → Label**, **Demo sheet → Label**).
   - Every provisional reading is named as provisional with its OQ or D number, in the UI's words.
   - Discovery points list only questions open at HEAD, by OQ id and title.
   - Then un-skip `demoGuideSync.test.ts` (item 5) and make it pass.

   The target shape (confirm each beat and its order against the inventory; merge, trim or move to
   an aside if a scenario would run over its time):

   | Scenario (time) | Core beats | Optional asides |
   |---|---|---|
   | **S1 · Booking to theatre** (6 to 7 min) | 1 The booking arrives by **sync, then match**: Mobile Tue 28 Jul AM (three booked); Admin Intake, pull on open, Sarah Mitchell's row, patient reused by NHI, Create Booking on St George's default Contract (and the unpaid-balance alert if Phase 40 shows one for her: script it, do not hide it); back to Mobile for the fourth Booking. 2 The day arrives (clock, catch-up pull applies nothing). 3 Capture on mobile (the one primary Procedure, Contract checks at Mark complete, no fee shown). | A failed sync loses nothing (34). The other providers' sheets and the Future-scope auto-match (34). Surgeon PDF upload (34). |
   | **S2 · Office day** (8 to 10 min) | 1 Read the day: Slots and Lists, the statuses from the Slot status master (OQ-17 provisional), booking counts, the Draft Lists band. 2 **Draft List assign with the waiting flag**, and the **blacklist warning** on the picker (31, 17). 3 A phone-advice booking into a Free Slot (28). 4 Illness cover from the **conflict dashboard**, then the update email (30, 35). 5 **Swap request, confirmed by the office** (32). 6 Authorise a submitted List: every Contract shown and approved, the adjustment and override layers (21, 24). | Availability weeks ahead from the phone (29). Simulate sickness and move a holiday (30). Simulate incoming request (31). The blacklisted swap variant (32). Stage child billed directly (21, D4). |
   | **S3 · Money end to end** (8 to 10 min) | 1 Authorise; the run locks, raises and sends every invoice in Dr Souter's name (22, 25). 2 The Xero pair: the payable equals the receivable; provisional buyer-created wording (16, 22). 3 Payment, ledger and disbursement detected from Xero; the web financial position moves (36, 37, 38). 4 AA's own fee invoice (16). 5 The ledger balances: an unmatched receipt, then allocate (36). | The 3-procedure Booking, 3/2/2 and Make primary (23). Billed Lists stay visible (38, D9). |
   | **S4 · Exceptions** (10 to 12 min) | 1 Pre-payment from the prepaid list: estimate, invoice at setup, part paid (26, 27, D5, D6). 2 An **additional invoice** on an authorised Procedure (39, replaces the addendum). 3 Billing failure on a missing required input, and retry (25). 4 The unmatched queue (33). 5 A partial payment releases exactly what was received (16, 36, 37). 6 **Credit in full and rebill** (39). 7 The date approaches (27; last, because it moves the clock). | Xero outage, a void made in Xero, bulk hospital remittance (37). Prepayment letter, overpaid credit, refund on cancellation (41). |
   | **S5 · Compliance tour** (7 to 8 min) | 1 The audit trail: change sets and View as at (35). 2 NHI: the new-format NHI validates on the synced row, and the **missing-NHI problem list** with attach (40, D11). 3 No NHI in Xero (OQ-30 caveat), and the NHI leak scan (43). 4 Contract versions and the lock: end-date Health NZ, Regenerate from locked data (25). 5 **Authorise, then edit the unit value: the invoice is unchanged** (25, 26). | Two people edit one Booking (35). Simulate sign-in attempts (14). Restricted raw-row view and the synthetic-data badge (43). A controlled go-live load (42). The patient view (40). |

   Also rewrite: **Pre-demo setup** (the Control Panel is the index; demo actions live in the bar on
   each screen and in the Demo sheet on a handset; "Play the office" off by default), **Direct URLs**
   (regenerate every table from the routes as built: Booking routes, Intake, Draft Lists, Conflicts,
   Swaps, Ledger, profile, Accounts sub-tabs, the Future-scope surface; drop dead ones such as
   `/web/accounts/overdue` except as a redirect note), **How to read the readiness** (every catch-up
   phase built; the provisional readings listed), **Recommended run orders** with the new times,
   **What to narrate rather than click** (HL7 v2, FHIR R4 and near real time as Future scope; real
   Xero, email and OCR; the full-scale point now has 43's load), and **Recovery from demo accidents**
   (the Control Panel's beat links and "Open screen" links; stuck draft: Discard; imported twice:
   nothing new added).
9. **Bring the other guide files into line** (one consistency pass each; subagents can draft 01, 02
   and 04 in parallel from the rewritten 03 while you check them):
   - `04-presenter-cheat-sheet.md`: the five nouns and "Terms not to use" in catalogue vocabulary;
     lifecycle and permissions; one Contract per Procedure, billable party, required inputs, the
     multi-procedure rule, adjustment and override, the lock; the money model on the ledger with the
     payable equal to the receivable and the AA fee as its own invoice; prepayment from the prepaid
     list; "Present but honestly demo-only" (Demo actions menu, Demo sheet, office stand-ins, "Play the
     office" off by default, Future-scope surfaces, the synthetic-data badge); the "RFP ambiguities"
     section becomes **"Open questions to raise"**, one entry per OQ open at HEAD that a beat touches,
     with its recommendation; likely evaluator questions re-answered.
   - `02-workflows-and-handoffs.md`: every workflow re-read end to end against the app (schedule
     canvas with Slots, intake by sync and matching, Draft Lists, cover by conflict or swap, capture,
     submit and review, billing run and lock, ledger and Xero, AA fee, exceptions), and the readiness
     table (every row built, with its phase).
   - `01-personas-and-responsibilities.md`: duties and permissions as built (profile, prepaid list,
     swap request; the office's matching, Draft Lists, conflicts, approvals, ledger, credit and rebill;
     the intake operator; Tama R. as the demo-only second office user).
   - `docs/demo-guide/README.md`: the product description and mental model (Slot, List, Booking,
     Procedure, Contract), **Source priority** (the catalogue first, then the PROGRESS Decisions log,
     then the code; the RFP is historical input), the readiness snapshot with its real snapshot date, and the best demo shape.
   - Grep all five files for stale vocabulary and remove it unless it is deliberate (a "Terms not to
     use" row, a Future-scope note): `Card` (except "the physical booking card"), `billing route`,
     `Type 1|2|3`, `addendum`, `5%`, `net payable`, `service fee`, `Overdue`, `mirror`, `gate` (under
     the D5 default), `MSG-`, `PID-2`, `HL7` or `FHIR` outside Future-scope notes, `free session`,
     `Surgeon TBC`, `Resolve & retry` (if renamed), `Funder allocation`, `two-funder`.
10. **Regenerate `docs/demo-guide/master-demo-guide.html` in full** from the rewritten Markdown. Keep
    the shell: the tab bar (Learn, Overview, Personas, Workflows, Script, Cheat sheet, and the
    discovery tab relabelled **Open questions**; keep its `data-panel="discovery"` id, or rename it
    together with every script and link that targets it), the tokens in `:root` (transcribed from Design Language), the
    "Print S1 to S5" handout (every scenario on a fresh page), the collapse details, and the rule that
    it is self-contained (no network, opens from the file system). Rewrite every tab's content:
    - **Learn it, gently**: the one-breath summary, the shape of it (Slot, List, Booking), the five
      nouns, the life of a List, the quiz (new questions on Booking, Contract, ledger; every answer
      true of the built app), and **Now drive it** re-written to the new S1 Beat 1 to 3 click path.
    - **Overview, Personas, Workflows, Script, Cheat sheet**: the rewritten Markdown, word for word
      where the Markdown is prose, the same figures and labels everywhere.
    - **Open questions**: the OQs open at HEAD that a beat touches, id, title, the prototype's
      provisional reading and the recommendation; no question that is answered.
    - Check it in a browser: every tab, the print preview, the wizard, and the status-colour legend
      (the Slot status master as seeded, with the `statusColours.ts` tokens).
11. **Docs beside the guide.**
    - `aa-prototype/README.md`: the Control Panel paragraph (index plus scenario jumps with beat links),
      the Demo actions and PWA sheet sections as finally built, and the Office simulation section.
    - `requirements-board/capture/ATLAS.md`: the "Scenario jumps" table (what each jump stages and its
      story) and the "Events" list (now "Demo actions by screen"). Re-run any capture recipe whose
      `{ "scenario": "Sn" }` expectations changed only if the owner asks; otherwise check the recipes
      still resolve their selectors. Run `npm run verify:board` if any board file changed.
    - Tell the owner (do not edit without their say-so) that `CLAUDE.md`'s "Current state" paragraph
      and its `PERSIST_VERSION` number are stale after the catch-up, with the suggested wording.
12. **Full QA pass.**
    - **Framed build** (`npm run dev`, desktop width): run S1 to S5 exactly as written, once from
      **Reset** and once from each scenario jump, pressing only what the script says. Every Expected
      line holds; every figure matches item 7; every Demo actions entry the script names is on that
      screen and nowhere it should not be.
    - **Handset** (`npm run build:pwa`, then `npm run preview:pwa -- --host` (the PWA config sets no host) opened on a real phone on the local
      network, or `npm run dev:pwa` at the `pwa-device` viewport of 393x660 if no phone is available;
      say which in the PROGRESS entry): with "Play the office" OFF, run every beat that has a mobile
      side using only the handset and its Demo sheet. Fill the **parity matrix**: one row per beat,
      columns mobile side (yes or no), handset path (the sheet entry or "self-contained"), result.
      Expected PWA entries (planned labels; the inventory and each entry's name map win): Office
      authorises this List (14, re-worded by 38); Payment received · full / half on Balances (14, 36);
      Office approves this Contract change (21); Office sets the estimate and raises the prepayment
      invoice, Patient pays half / full of the pre-payment, Move to 2 days before procedure (27);
      Office assigns a List to my next free Slot (28); Office reassigns this List (30); Office assigns
      a Draft List to me (31); Office confirms this swap, Office declines this swap (32); Hospital sync
      delivers my booking (34, re-pointed from 33's "Hospital row arrives and the office matches it");
      Office edits this Booking (35); Office runs payables (36); Office raises the additional invoice
      (39); Office attaches the NHI (40); Office sends a pre-payment reminder, Office refunds this
      pre-payment from the trust account (41). Phases 26, 29, 37, 42 and 43 planned no PWA entry;
      record each as "no PWA stand-in required" in the matrix.
    - **A beat with a mobile side and no handset path is a gap.** If an existing store action covers it,
      register a PWA-only office stand-in following Phase 14's contract (body in `src/shared` or
      `src/store`, `badge: 'office-stand-in'`, disabled state, dash-free copy) and add it to the audit
      tests. Otherwise log it for the owner. Do not add scenario jumps to the PWA; its reset on More is
      the stage step.
    - **Regressions:** fix small ones here, with a test. Log anything larger in the PROGRESS open-items
      handoff for the owner rather than growing this phase.
    - `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.
13. **Close-out:** the adversarial review, then PROGRESS.md (below).

## Demo triggers

This phase **adds no harness-bar trigger** and nothing to the Control Panel page. It audits the
registry that Phases 14 to 43 filled, beat by beat:

| Check | Where | How |
|---|---|---|
| Every entry shows only on its own screen | Harness bar, framed build | `demo-actions-audit.spec.ts` (item 4): each index row's "Open screen" lands on a screen whose pill lists it; an unregistered screen shows no pill |
| The Control Panel is only the index | `/demo/control` | No entry routes there (Vitest, item 4); the page holds Clock & reset, Scenario jumps with beat links, and "Demo actions by screen" |
| Office stand-ins are PWA only | PWA sheet | Vitest (item 4): `office-stand-in` means `surfaces: ['pwa']` and `/mobile` routes only |
| Every scripted press exists | Run sheet and master guide | `demoGuideSync.test.ts` (item 5) |
| Every beat with a mobile side runs on a handset | PWA, real phone | The parity matrix (item 12) and the PWA spec's per-screen table (item 4) |

**PWA equivalents:** none new by plan. If the parity matrix finds a mobile beat with no handset path,
item 12 says when to add a PWA-only stand-in and when to log it.

**Scenario jumps (not triggers):** S1 to S5 on the Control Panel, rebuilt in items 2 and 3, each
followed by one deep link per beat.

## Out of scope

- Any new product behaviour, and any change to billing maths, lifecycle guards, the ledger, or the
  seed's content (beyond a scenario-staging need, which bumps `PERSIST_VERSION`).
- Reworking a feature whose owner decision or OQ was answered after its phase ran: script it as built,
  label it provisional, raise it with the owner.
- Re-grading the gap analysis or moving the `1f067a8` snapshot (the ROADMAP's "When the catalogue
  changes" procedure owns that).
- The parked US-08.6.4 (split a combined Procedure into additional invoices, OQ-53).
- Future-scope items (HL7 v2, FHIR R4, near real time, the Digital Services Hub lookup) beyond keeping
  their badges and narration honest.
- Re-capturing the catalogue's screenshots with the capture tool.
- Scenario jumps or a scenario picker on the PWA.
- Editing `CLAUDE.md` without the owner's approval.
- Fixing large regressions found in the QA pass (logged, not fixed).

## Manual test checklist

- [ ] Drift check run (in both sessions); the OQ list and the D1 to D11 branch table are recorded;
      nothing the guide or the app calls settled is an Open, Confirm or Proposed OQ at HEAD, and no
      Proposed, Open or Verify requirement is described as AA confirmed.
- [ ] Control Panel: each of S1 to S5 jumps after "Confirm jump", shows its message and one link per
      core beat; every link lands on the right screen (a `null` link is disabled with its reason); no
      trigger buttons on the page; "Demo actions by screen" still lists every entry.
- [ ] S1 to S5 run end to end on the framed build **from Reset**, exactly as written, with every
      Expected line and figure matching.
- [ ] S5 run from its jump: Chen's History shows the staged change set; Whitaker's Bookings show the
      locked Contract version; Regenerate from locked data says identical after the unit-value edit.
- [ ] Every "Demo actions → Label" in the script is on that beat's screen; opening three unrelated
      screens shows no stray entries.
- [ ] Handset, "Play the office" OFF: every beat with a mobile side completes using only the phone and
      its Demo sheet; the chip clears the header avatar, the dock and the tab bar; the parity matrix is
      complete with no unexplained gap.
- [ ] App copy: no "open RFP question", "discovery item", "discovery question", "(assumption)" or
      "proposed reading" remains in rendered text; the OQ-50 caveat is on the Control Panel callout;
      the NHI mod-11 flag and the OQ-30 Xero callout are still shown.
- [ ] `master-demo-guide.html` opens from the file system with the network off; every tab reads the
      same as the Markdown; "Print S1 to S5" puts each scenario on a fresh page; the Learn wizard's
      "Now drive it" steps work on the app; the Open questions tab lists only open questions.
- [ ] The five guide files have no stale vocabulary from the item 9 list (except deliberate "Terms not
      to use" rows and Future-scope notes).
- [ ] No en or em dash in any app copy changed by this phase (the copy guard test passes).
- [ ] `demoGuideSync.test.ts` runs against the rewritten run sheet and master guide with nothing
      skipped.
- [ ] `npm run verify:board` green if any board file changed.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.

## Demo guide updates

This phase **is** the demo guide update. Every file changes:

- `docs/demo-guide/03-demo-script.md`: rewritten in full (item 8): S1 to S5 renumbered with the new
  beats, handset lines, provisional labels, discovery points from HEAD, Direct URLs, run orders,
  narration list, recovery.
- `docs/demo-guide/04-presenter-cheat-sheet.md`, `02-workflows-and-handoffs.md`,
  `01-personas-and-responsibilities.md`, `README.md`: brought into line (item 9).
- `docs/demo-guide/master-demo-guide.html`: regenerated in full (item 10).
- The Control Panel scenario text: now in `demoScenarios.ts` (items 2 and 3).
- Beside the guide: `aa-prototype/README.md`, `requirements-board/capture/ATLAS.md` (item 11).

End with the final consistency read: the master guide against the Markdown, and both against the
running app.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:

- fan out three independent Opus review subagents, one each for **quality**, **bugs/correctness** and
  **plan adherence**, each given this doc, the rewritten guide files, the diff and the running app's
  URLs; add a fourth, **presenter**, who reads only `master-demo-guide.html` and follows S1 to S5 in
  the app cold, reporting every place the guide and the app disagree;
- this session then independently verifies every finding against the catalogue at HEAD, this doc and
  the running app, fixes the confirmed ones (with a test wherever a code bug had none), re-greens, and
  records the pass in the phase entry;
- do not re-raise anything already settled in the Decisions log.

**Steer this phase's reviewers at:**

- **Guide truth.** Every Click step exists as written (button labels, screen names, Demo actions and
  Demo sheet labels), every Expected line and figure is what the app shows after a Reset, and the
  master guide says the same as the Markdown. Hunt for figures carried over from July or from an
  interim phase ($144.76, $7.62, 5%, "two-funder", AA-2026 numbers that moved).
- **Open stays open.** No copy, in the app or the guide, calls an Open, Confirm or Proposed OQ settled,
  and no Answered OQ keeps a stale caveat. OQ-50, OQ-30 and the NHI "modulus 24" flag are still shown.
  Every provisional D1 to D11 reading is labelled in the guide exactly as the UI labels it.
- **Trigger placement.** No entry shows on a screen it does not belong to; office stand-ins never
  appear in the framed build's bar; nothing is registered on `/demo/control`; bodies live in
  `src/shared` or `src/store`, so `pwaPurity.test.ts` holds; any stand-in added in item 12 follows
  Phase 14's contract and is audited.
- **PWA parity.** Every beat with a mobile side has a working handset path with "Play the office" OFF;
  the parity matrix has no row marked "self-contained" that actually waits on the office.
- **Scenario jumps.** Staging uses guarded store actions only (no direct state writes), is
  deterministic, keeps the `scenario-*` hooks and the S1 to S5 ids the capture recipes rely on, and
  beat links never point at a stale id.
- **The tests are real guards.** The copy guard strips comments correctly (no false passes from
  JSX text split across lines, no false failures from comments), its allowlist is minimal and each
  entry names a live OQ; the guide-sync test fails when a scripted label is renamed, and none of its
  assertions is still skipped.
- **No scope creep.** No behaviour change beyond copy, the scenario module and any audited stand-in;
  `PERSIST_VERSION` bumped only if the seed changed.

## PROGRESS.md updates

- **Status row** for catch-up Phase 44, and a phase entry with:
  - the drift-check result (catalogue changes since `1f067a8` and what each did to the script; the OQ
    list at HEAD; the D1 to D11 table: answered or default, and the label each shows);
  - the re-baselined figures table (item 7);
  - the parity matrix (item 12) and how the handset was tested (real phone or emulated viewport);
  - the trigger audit result: entries per screen, any stand-in added, any gap logged;
  - the copy sweep: each RV-17 site as reworded, already fixed (by which phase) or kept (with the OQ);
  - what was built: `demoScenarios.ts`, the beat links, `demoTriggerAudit.test.ts`,
    `demoGuideSync.test.ts`, `appCopy.test.ts`, the audit spec;
  - `PERSIST_VERSION` (unchanged, or from and to, with why);
  - the before and after Vitest and Playwright counts;
  - the review pass.
- **Decisions log:**
  1. **Amended:** 2026-07-22 "Time-unit partial-interval rounding = round UP per started interval, a
     named ASSUMPTION". Rounding up per part interval is now the catalogue rule (US-05.2.2, "or part
     thereof"); only the rule after two hours stays open (OQ-50), and its one caveat lives on the
     Control Panel callout.
  2. **Superseded:** the Phase 12 scenario-jump design (jumps defined inline in `DemoControlPanel.tsx`,
     reset-only S1, S2, S4, navigation to app roots). Jumps now live in `demoScenarios.ts`, stage
     through guarded actions only, and offer one deep link per beat.
  3. **New:** the demo guide's source priority is the requirements catalogue, then this Decisions log,
     then the code; the RFP is historical input. Discovery points and the "Open questions" tab are
     built from catalogue OQ statuses at the time of writing.
  4. **New:** app copy never calls an Open, Confirm or Proposed item settled; kept caveats cite the OQ
     id; `appCopy.test.ts` enforces the stale phrases and the no-dash rule.
- **Catch-up closing summary** (a short section after the entry): every phase 14 to 44 DONE; 165 gaps,
  34 DM and 20 RV closed; US-08.6.4 parked (OQ-53); the provisional readings still shown in the app,
  each with its OQ or D number; the snapshot commit the build was made against (`1f067a8`) and the
  HEAD commit this phase checked; a pointer to the ROADMAP's "When the catalogue changes" procedure
  for the next round.
- **Open-items handoff:** any regression logged in item 12, any parity gap not fixed, the catalogue
  correction for US-11.1.2's "modulus 24", and the stale `CLAUDE.md` lines for the owner.
