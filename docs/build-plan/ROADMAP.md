# AA Prototype · Build plan roadmap

The requirements catch-up (phases 14 to 44 and the UI unification track U1 to U7, archived in
`docs/archive/prototype-build/`) left the prototype matching the requirements catalogue at commit
`64b3dff7` (24 November 2026). This plan started empty there. Phases come only from requirement changes
committed after it: `/update-requirements` records a change, the owner commits it, and
`/update-build-plan` grades only the changed items and appends phases here, numbered upward from 45.
Most are expected to be UI and UX improvements. Routine fixes and polish are not phases: they use the
`app-change` skill. Neither phases nor routine changes touch the screenshots or the demo guide: the
owner brings both in step with one sweep (`/sweep`, last run in `docs/SWEEP.md`).

The plan is now planned against catalogue commit `5f87781` (25 November 2026). It holds **five
phases, 45 to 49**, all from one change: Donald's decisions of 25 November that give Contracts their
own section of the Admin app, with a page for each Contract, a grouped catalogue, Parties and Funding
tags as tabs, and Replace a Contract from a date (change log
`requirements-board/requirements/changes/2026-11-25-donald-contracts-section.md`, note AR-69; every
item at Verify, not yet seen by AA). The Contract model is unchanged; how the office finds, reads and
changes Contracts changes. The gap analysis graded the items it touched (1 Contradicts, 7 Partial, 3
Matches, 1 Grouping) and found four data-model deltas (DM-01 to DM-04): **12 units, all planned, none
parked**. The layout reference for every new screen is `docs/explorations/contracts-section.html`
(sections `#map`, `#catalogue`, `#record`, `#updating`, `#new`, `#parties`, `#tagstab`; the earlier
first pass is `contracts-ideas.html`). It is a design page, not a catalogue artifact: cite the path.

Settled prototype rulings are in `docs/DECISIONS.md`; known open work is in `docs/BACKLOG.md`. The
archived catch-up ROADMAP, PROGRESS and phase docs are history: read them as leads, never as rules.

## Owner decisions

These readings shape what a phase delivers. Rows are numbered from D90, above the archived catch-up's
D1 to D89, which code comments, tests and `docs/BACKLOG.md` still cite. The 2026-11-25 update
(catalogue `5f87781`) adds **D90 and D91**, the two new open questions that gate an unbuilt phase,
each with the default its phases build (none is answered: build without them), and **D92 to D96**, the
owner's directives for the Contracts section. OQ-146 gates no phase (see Open questions).

| ID | Decision | Gates | Source |
|---|---|---|---|
| D90 | **Disabling a Contract from a future date (OQ-144). Open** (new 2026-11-25; Donald to ask AA; no recommendation). Default, the catalogue's own fallback: no future-dated disable and no date on a Contract. Disable acts at once, after 45's confirm; a Contract replaced from a date and left active gets a to-do on the change date that stands in for a scheduled disable (49). Until the office disables it, both Contracts are offered, and 49's message for a replacement not priced as a fixed price says so. | 45, 49 | OQ-144; US-04.1.8 Technical discussion; US-04.1.2 |
| D91 | **A hospital's untagged Contracts on the step rail (OQ-145). Open** (new 2026-11-25; Donald to ask Ben; no recommendation). Default: as built. A hospital-held Contract with no funding tag sits under Special (`destinationOf`, US-04.2.17, which still Matches). 46's "Where it will show" and 47's "where the invoice goes" grouping both read `destinationOf` and never place a Contract themselves, so an answer changes one function. | 46, 47 | OQ-145 |
| D92 | **The Contracts section's shape. Decided** (owner, 2026-11-25 plan update). One Admin side-nav entry, Contracts, between Ledger and Master data, with routed tabs Contracts (`/admin/contracts`), Parties (`/admin/contracts/parties`) and Funding tags (`/admin/contracts/tags`). A Contract's page is `/admin/contracts/:contractId`, keyed by the Contract's id, never its AA code, because the AA code is editable. This overrides `contracts-section.html` `#record`, "a page at its AA code"; `#map` already says the id. New contract is `/admin/contracts/new` (with `?holder=`). All of it sits on the AdminPage frame: fit for the lists, ProfilePage fluid with the 412px rail for a Contract or a Party. The section opens on the catalogue. | 45 to 49 | Owner directive; US-13.4.1, FT-04.1, US-04.1.7; `docs/explorations/contracts-section.html` `#map` |
| D93 | **Old Master data links redirect until the owner's sweep. Decided** (owner). `/admin/masters?view=contracts`, with `&contract=<id>` or `&holder=<PartyId>`, goes to `/admin/contracts` or the Contract's page (45). The holder link maps to the holder grouping once 47 lands. `?view=parties` and `?view=fundingTags` go to the new tabs (48). The redirects keep the capture recipes, the demo guide (S5's `?view=contracts` links) and Playwright loading. In-app links go to the new routes directly. No phase edits the recipes, ATLAS or the guide: the sweep re-points them. The redirects stay after 49. | 45, 47, 48 | Owner directive; standing rule "Demo guide and catalogue screenshots" |
| D94 | **The to-do on the change date, and the late disable. Decided** (owner). The reminder is a warning rule in `src/domain/warnings/rules/`, a To-do and never a blocker in `lifecycle.ts`: "a replaced Contract is still active on or after its replacement's date". It shows in the Day view To-do and on the old Contract's page, and goes once the old Contract is disabled. Disabling a replaced Contract after its change date lists the Procedures from that date, not from today. Default for DM-01's home (the delta's recommendation): the link and date ride the new Contract's `contract.create` audit entry (`replaces: { contractId, fromISO }`), with no field on the Contract, which keeps "No dates" (US-04.1.2) and leaves OQ-144 open. So there is no `PERSIST_VERSION` bump unless the seed gains a replacement. | 49 | Owner directive; US-04.1.8 (Old one left active, Late disable); DM-01, DM-03, DM-04 |
| D95 | **Considered and not built. Decided** (catalogue). No desk page of Contract work, no adding one price range to many Contracts at once (every change is made on one Contract, from its page), and no "Try a List" screen for testing what the step rail offers. The label stays "Funding tag" and the tab stays "Parties". | 45 to 49 | US-04.1.2, US-04.2.15, US-04.1.5 and US-13.4.5 Notes; change log 2026-11-25 |
| D96 | **Stories split across phases. Decided** (owner). US-04.1.2 is built across three phases, with its unit on 47, which finishes it: 45 builds Disable confirmed; 46 builds New contract order and Similar name, and removes the warning-only "Replaces" picker on create; 47 builds Grouped, Two surgeons, the search and the Active, Disabled or all filter, where the holder filter becomes the holder grouping. US-04.1.3 spans 45 (one audited change per card) and 49 (what a replacement audits), with its unit on 49. DM-04 sits on 45 (confirm, list from today); its replaced case, listing from the change date, is US-04.1.8's Late disable in 49. | 45, 46, 47, 49 | Owner directive |

## Track

```
Contracts   45 the section & the Contract page ─▶ 46 New contract page ─▶ 47 the grouped catalogue
            ─▶ 48 Parties & Funding tags tabs ─▶ 49 Replace a Contract from a date
                                                                         (all new 2026-11-25)
```

One track, run in number order. 47 needs only 45, and 49 needs 45 and 46, but the owner tests each
phase before the next, so the order is the table's.

## Phases

| Phase | Title | Track | Depends on | Sessions | Delivers |
|---|---|---|---|---|---|
| 45 | [The Contracts section and the Contract page](phases/phase-45-contracts-section-and-contract-page.md) | Contracts | none | 2 sessions | A Contracts entry in the Admin side nav between Ledger and Master data, with the Contract list moved there on AdminPage fit with a tab strip; the old Master data links redirected (D93). A page per Contract at its id (D92), on ProfilePage fluid with a rail: cards edited and saved one at a time, each one audited change, refused in place; the holder Party's billing details read-only; the price ranges as a newest-first table with To, Change and Procedures priced, ended ranges folded after three; the Procedures on it, its event fees and its history; Disable confirmed, listing the Procedures from today; system Contracts limited. The side panel's edit path retired (create keeps it until 46). Covers US-04.1.7, US-04.2.15, DM-04 (plus US-04.1.2's Disable confirmed and US-04.1.3's per-card audit, D96) |
| 46 | [The New contract page](phases/phase-46-new-contract-page.md) | Lane A | 45 | 1 session | New contract as a full page (`/admin/contracts/new`, `?holder=`), filled in the order its rules depend on (holder and who it bills, pricing, where it is offered, name and codes), with a live "Where it will show" and the holder's similarly named Contracts as a hint, never a block. Saving lands on the new Contract's page. `ContractEditSheet` deleted, with its warning-only "Replaces" picker. No unit of its own: US-04.1.2's New contract order and Similar name (D96) |
| 47 | [The grouped Contract catalogue](phases/phase-47-grouped-contract-catalogue.md) | Lane B | 45 | 1 session | The catalogue grouped by holder, kind of holder, funding tag (No tag included), surgeon (a two-surgeon Contract under both), where the invoice goes or pricing kind, by a pure tested `groupContracts`. An index pane of groups with counts sits beside the list, with a GroupRow sub-heading variant. `?group=` and `?in=` live in the URL, and the last grouping is remembered per office user. The holder filter becomes the holder grouping. Covers US-04.1.2, finishing it |
| 48 | [The Parties and Funding tags tabs](phases/phase-48-parties-and-funding-tags-tabs.md) | Lane B | 45, 47 | 1 session | Parties and Funding tags as tabs of the Contracts section. Parties are grouped by kind, Contract-less ones included, and each Party has a page with its Contracts counted by funding tag, each count opening the catalogue. Picking a tag shows its Contracts grouped by hospital with counts. The three views leave Master data, with redirects and a pointer line. Covers US-04.1.5, US-13.4.1, US-13.4.5 |
| 49 | [Replace a Contract from a date](phases/phase-49-replace-contract-from-a-date.md) | Lane A | 45, 46 | 1 to 2 sessions | Replace from a date as one action, from a SidePanel record sheet: a copy with any setting changed and a new AA code; the Procedures from the date listed, locked ones left out, only the ticked ones moved; the old Contract left active with a to-do on the date, or disabled now. Every step is audited, in one change set (`replaceContract`). The to-do is a warning rule, never a blocker (D94). A late disable lists the Procedures from the change date. A "Demo: reach the change date" button. Covers US-04.1.8, US-04.1.3, DM-01, DM-02, DM-03 |

## Open questions

Three questions were added on 2026-11-25, all open; none is answered, so the phases build without
them. One older open question touches a planned phase.

| Question | Owner | Gates | Built meanwhile |
|---|---|---|---|
| OQ-144 Disabling a Contract from a future date | Donald to ask AA | 45, 49 (D90) | No scheduled disable; the to-do on the change date stands in |
| OQ-145 A hospital's untagged Contracts on the step rail | Donald to ask Ben | 46, 47 (D91) | As built: under Special, read through `destinationOf` |
| OQ-146 Which backstops each hospital and funding tag gets | Donald | none | As built (US-04.3.9 Matches): an RVG and a Fixed price backstop per place. 45's system-Contract pages and 47's groupings show whatever system Contracts the seed makes. Nothing is built for it |
| OQ-114 How each Party's invoices are delivered (older) | Donald to ask Ben and Vanessa | 48 (no new work) | As built: email or post, shown on the Party page |

## Sequencing rules

- **Every phase** runs as one ordinary session (two at most) in the main folder on `master`, except
  where [LANES.md](LANES.md) puts it in a build lane. A phase starts only when every phase in its
  `depends_on` is DONE and committed, and (outside a lane) the owner has tested the phase before it.
- **Build lanes for 46 to 49** (owner, 2026-11-25). 45 runs first, alone, in the main folder with its
  own kick-off prompt. Once 45 is DONE and committed, Phases 46 to 49 run as Wave 1 of two lanes, each
  in its own git worktree: **Lane A** builds 46 then 49 ([prompt](lanes/lane-a.prompt.md)), **Lane B**
  builds 47 then 48 ([prompt](lanes/lane-b.prompt.md)). The lane that finishes second joins them onto
  `master` as soon as the full gate is green; the owner then tests all four together, and the lanes are
  torn down. [LANES.md](LANES.md) holds the ownership table, the sync, the join and the conflict rules,
  and overrides a phase's kick-off prompt, the run-build-phase skill and CLAUDE.md for a lane session.
  A session on `master` never runs 46 to 49 from their own prompts. 45's own Stage 7 keeps
  `status.json` `guidance.lanes`.
- **Run order.** 45; then 46 and 47 side by side (Lanes A and B); then 49 and 48 side by side.
- **45 first.** It makes the section, its routes, the redirects (D93) and the Contract page. It also
  adds the shared pieces the later phases reuse: the Card editing and footer variant (46's and 48's
  pages, 49's sheet) and the ConfirmSheet danger variant over `stillOnContract` (49's late disable).
  From 45 to 46, New contract still opens the old `ContractEditSheet` in create mode; its edit path is
  gone.
- **46 after 45.** The new page lands on 45's Contract page. 46 deletes `ContractEditSheet` and its
  warning-only "Replaces" picker. From then until 49, a dated change is a new Contract made by hand,
  with no warning list, and Replace from a date waits for 49 (on 46's owner review list).
  `stillOnContract` and `proceduresStillOnContract` stay: 45 and 49 read them.
- **47 after 45.** It groups 45's moved list. 47 maps `?holder=` (and D93's redirected `&holder=`) to
  the holder grouping.
- **48 after 47.** Each Party's per-tag counts open the catalogue through 47's `?group=` and `?in=`
  URL, and the tags tab's hospital grouping reuses `groupContracts`. 48 removes the last three Master
  data views.
- **49 last, after 45 and 46.** Replace sits in 45's Contract page header and shares 45's
  still-on-Contract list (the late disable reads it from the change date). Its sheet reuses 46's
  rule-order form sections. 49 also has the only new store action.
- **`PERSIST_VERSION`.** No bump is expected: every screen reads data that already exists. 49 bumps
  it only if DM-01 takes a stored field, or the seed gains a replacement (D94's default needs
  neither). Any phase that seeds an acceptance criterion's example bumps it.
- **The screenshots and the guide wait for the sweep.** The redirects keep the recipes, ATLAS
  routes and S5's links loading. Recipes that click into the retired side panel break until the
  owner's sweep re-points them, and each phase lists those under "For the sweep". Phases update the
  Playwright specs in `aa-prototype/visual/` that they break, because the full gate runs them.

## Milestones

- **After 45:** Contracts as its own Admin section. Open any Contract on its own linkable page and
  change it one card at a time, one audit entry each. Read ten years of price ranges as a table with
  the Procedures each priced. See who a Contract touches before changing it, and disable it only
  after confirming the Procedures still on it.
- **After 47:** The catalogue grouped six ways with an index of groups and counts: every SXAP
  Contract across hospitals, or what one surgeon's Lists can be priced at. New Contracts are entered
  on their own page in rule order, with a live step-rail preview and a similar-name hint.
- **After 48:** The whole Contracts section: the Contracts, Parties and Funding tags tabs, a page per
  Party with its Contracts counted by tag, and each tag's Contracts by hospital. Master data keeps
  the rest of the reference data and points across.
- **After 49:** Replace a Contract from a date in one action: copied at the new rate, the ticked
  Procedures moved, the old one left active with a to-do on the date or disabled now, and a late
  disable listing from the change date. S5's "a new Contract supersedes the old one" now works as the
  guide scripts it; the owner's sweep brings the guide's wording in step.

## Parked

None. All 12 units of the 2026-11-25 update are planned.

## Standing rules

The rules every phase follows. The `run-build-phase` context pack quotes these sections to each phase.

### Running a phase

Every kick-off prompt is short: it names the phase, tells the agent to load the `run-build-phase`
skill (`requirements-board/agent/skills/run-build-phase/`), and adds only what the phase doc does not
already say. Every prompt carries the same Override block: commit when green (stage by path, never
push); skip the screenshot recipes, the demo guide and the capture (the owner's sweep does them). The
skill holds the rest, the same for every phase: a context pack (`phase-context.mjs`); the drift check;
plan and build; quick partial checks while building and the full green set at gates
(`phase-check.mjs`); the design-fidelity check and the manual checklist; the review; a short PROGRESS entry with a Handoffs block; and updating `status.json` and the plan page
so it names the next phase. A prompt line wins over the skill; the phase doc wins over the skill for
what to build.

### Owner review: agents test themselves

- **No plan-approval stop.** After the drift check, the agent writes its step plan and starts building
  straight away. It never enters plan mode itself. When the owner starts a session in plan mode, the
  agent does all its reading and the drift check first and presents the plan once; after approval it
  builds to the end without further stops.
- **The agent is the tester.** It runs the phase's manual test checklist itself, in the running app
  (start root `npm run dev` in the background if 5173 or 5174 is down), driving it with Playwright or
  the `/run` skill and checking screenshots by eye. "Handset" checks use the emulated mobile viewport
  unless a real phone is attached. Each item is reported pass or fail with its evidence.
- **Defaults over questions.** Where a phase doc says "ask the owner" about a product choice, the agent
  builds the stated default, labels it provisional where the doc says so, and logs it on the phase's
  "For the owner's review" list instead of asking.
- **Stop and ask only when it is very needed:** a drift-check stop the phase doc names, a blocker no
  documented default resolves, or an action that is destructive or hard to undo.
- **Then the owner tests.** The phase commits when green and hands over: what changed, where to try
  it and the "For the owner's review" list. The owner tests the phase.

### Front-end design

Before building or reshaping any screen, sheet, dialog, panel, row, banner or state, the agent loads
the `frontend-design` skill (the `run-build-phase` skill holds this step). It works inside the design
system, not over it: the `docs/design` files and `src/theme` tokens stay authoritative (PROGRESS
binding convention 17, CLAUDE.md "Design"), so it shapes layout, hierarchy, spacing, states and finish,
never a new palette, typeface or visual language, and the two hard rules (crimson identity only, teal
the only action colour) hold. Each changed screen is screenshotted beside its mockup at the same
viewport and compared before the phase is called done. A phase that touches UI names, in its doc, the
design page and screen for each screen it changes. Store, seed and pure-domain steps do not need it.

### One component per job

- UI in a phase is built from the shared components: `src/shared/ui/` (controls and feedback),
  `src/shared/surface/` (sheets, dialogs, modal behaviour), `src/shared/table/` (tables) and
  `src/shared/calendar/`. `src/shared/ui/README.md` lists what exists and how to add a variant.
- If a shared component cannot do what a phase needs, the phase extends it with a variant or prop that
  defaults to today's look and matches a pattern in `docs/design/`; it never copies the component into
  a screen file. A new private copy of a shared component is a review finding, and
  `src/apps/oneComponentPerJob.test.ts` enforces it (its allow-list only shrinks).
- A phase that rebuilds a screen also migrates any remaining copies on that screen.
- A shared component keeps its hooks: it takes `shot`, emits `data-shot` on the element recipes
  target, and passes `data-*` attributes through.
- The catalogue rows (`/demo/catalogue/*`) change in the same session as the component.
- A phase that touches UI carries the "Build on the shared components" work item and the review line.

### Demo triggers

The mechanism exists (`src/shared/demoTriggers`). A phase registers new entries or re-points existing
ones; none adds a trigger to the Control Panel page. Each entry declares:

- the route patterns it belongs to;
- the surfaces it shows on: harness bar, PWA sheet, or both;
- a `run(api, ctx)` that acts on the entity in the URL (`listId`, `bookingId`, `invoiceId`,
  `dateISO`) or on screen state published through `useDemoTriggerContext`, not a hardcoded seed id
  wherever possible;
- a disabled state.

The harness bar shows a trigger only on its screen. The Control Panel keeps the scenario jumps, the
clock and reset, and lists every trigger under its screen. Trigger bodies, the context hook and the
shared actor constants live in `src/shared` or `src/store`, so the PWA purity test holds. Product
actions stay in the product UI, not the bar. A trigger added or renamed keeps
`src/shared/demoTriggers/demoGuideSync.test.ts` green.

### PWA parity

The PWA has no harness bar and no Admin app, so a handset demo cannot switch to the office. A phase
whose beat has a mobile side that waits on the office, a colleague or a backend event registers a
PWA-surface entry for the mobile screen concerned (an office stand-in, run as
`OFFICE_SIMULATION_ACTOR`). These stand-ins show on the PWA only: in the framed build the presenter
plays the office in Admin.

### Demo guide and catalogue screenshots

A version of the demo guide (`docs/demo-guide/`, with `master-demo-guide.html`) and the catalogue
screenshots goes to Anaesthesia Associates for testing and approvals. They are brought in step with
the app in one **sweep the owner triggers** (`/sweep`, the project skill `.claude/skills/sweep/`),
which takes everything changed since the last sweep (`docs/SWEEP.md`), updates the recipes, ATLAS and
the guide, runs the full gate and the capture, and commits.

- **Phases do not touch** the capture recipes, `ATLAS.md` or the demo guide, and never run the
  capture, not even `--dry`. A phase doc may note, under "For the sweep", anything new worth a
  screenshot or a guide beat.
- A phase keeps tests that read the guide green: `src/shared/demoTriggers/demoGuideSync.test.ts`
  (a renamed or new demo trigger fixes the guide line the test names, nothing more).
- Recipes and images are never touched while updating the plan.

### Confirm before building

Phases that carry unresolved open questions (OQ) or Verify, Open or Proposed items are listed here.
Each checks them at its drift check, and if they are still open builds the owner-decision default or
the recommended reading and labels it provisional in the UI.

| Phase | Items | Open questions |
|---|---|---|
| 45 | US-04.1.7, US-04.2.15 and DM-04, plus US-04.1.2's Disable confirmed and US-04.1.3's per-card audit (all Verify: Donald's 25 November decisions, not yet seen by AA): the page per Contract and its cards, the price ranges table, the confirmed disable | OQ-144 (D90) |
| 46 | US-04.1.2's New contract order and Similar name (Verify): the New contract page in rule order and the similar-name hint | OQ-145 (D91) |
| 47 | US-04.1.2 (Verify): the six groupings, the index and the search; the holder filter folded into the holder grouping | OQ-145 (D91) |
| 48 | US-04.1.5, US-13.4.1 and US-13.4.5 (Verify): Parties and Funding tags as tabs, the Party page, each tag's Contracts by hospital | OQ-114 (as built) |
| 49 | US-04.1.8 and US-04.1.3 (Verify), DM-01 to DM-03: Replace from a date, the to-do on the date, the late disable from the change date | OQ-144 (D90) |
