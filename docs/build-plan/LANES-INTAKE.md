# Build lanes: the Intake rebuild, Phases 68 to 72, in Waves 6 and 7

The owner's decisions of 26 November 2026. The Admin app's Intake (the matching screen) is rebuilt as
the front door for every List and change: the approved Idea 1, "Feed and workbench"
(`docs/explorations/intake-ideas.html`, section 10), from the requirements change at `8637b65`
(`requirements-board/requirements/changes/2026-11-26-donald-intake-front-door.md`). It is built in
**lanes**, the same way as the Finances build in [LANES.md](LANES.md): each lane is its own git worktree,
branch and dev-server ports, run by its own Claude session, and the work is cut into **waves**.

- **Wave 6** is the shared groundwork, alone: Lane D builds 68 (the Intake routes and two-view shell,
  the feed, the docked workbench frame, the read models, the arrival side of the data, the seed, the
  six demo actions, and the old screens and triggers retired). It owns every shared and shell file the
  later phases would otherwise meet in, and it fixes the file contract below.
- **Wave 7** builds the workbench side by side in four lanes, each in its own files: Lane D the updates
  to a List we hold (69), Lane E new Lists and PDFs (70), Lane F Sources and confirming unchanged Lists
  (71), Lane G Needs NHI, the stub guard and Validators to Help (72).

**These lanes run beside the Finances lanes** (A, B and C, Wave 5), and never meet them:
- their own lane letters (D to G), wave numbers (6 and 7), ports (5573 and up) and branches
  (`lane/d` to `lane/g`, `wave/7`);
- their own coordination folder, `"$(git rev-parse --git-common-dir)/lanes-intake/"`, never
  `.git/lanes/` (the Finances teardown deletes that folder, and `setup-lanes.sh` writes into it, so
  **never run `setup-lanes.sh` for these lanes**);
- **Intake never lands on `master` while Finances Wave 5 runs.** 68 is built on `lane/d`, made from
  `master`; Wave 7's lanes take it from `lane/d`, not from `master`; and the Wave 7 join waits until
  Finances Wave 5 is on `master` (58 to 67 DONE in `master`'s `docs/build-plan/PROGRESS.md`). So the
  Finances lanes never merge Intake work at their phase starts, and the conflicts between the two
  builds (the demo trigger registry, the store barrel, the seed pins, `PERSIST_VERSION`) are settled
  once, at the Intake join, against the joined Finances code.

**Test once, at the very end** (owner, 26 Nov 2026: speed first; this is a prototype). This overrides
the run-build-phase skill's gate, review, screen-proof and checklist steps, ROADMAP's per-phase owner
test, the phase docs' checklists and CLAUDE.md's "full gate before merging a branch", for 68 to 72:

- **A phase** finishes on the quick checks only: `node
  requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --changed` plus `npm run lint` in
  `aa-prototype/` (about a minute). It skips the adversarial review, the screen-proof against the design
  and the manual test checklist run. Assume the work is good enough and move on. Playwright specs it
  moves are re-pointed but not run; they may be broken until the join.
- **Wave 6 has no join**: Wave 7 starts from `68 complete:` on `lane/d`.
- **Wave 7's join is the only full gate:** `phase-check.mjs` without `--changed` (both builds, all of
  Vitest, verify-board, all of Playwright) plus lint, one review of all five phases, fixes, the merge to
  `master`, and one owner test sheet for the whole Intake rebuild, `docs/build-plan/TEST-68-72.md`.

The sessions may run on different Claude accounts, so they never talk to each other through Claude:
everything they share goes through git and the coordination folder.

**This file overrides** the phase's kick-off prompt, the run-build-phase skill and CLAUDE.md wherever they
differ, for an Intake lane session only. A Finances lane session ignores this file.

**Use subagents as much as possible** (owner, 26 Nov 2026). A lane session sends parallel subagents to
read code and requirements, to build independent pieces of a phase (one per file or bench part, each
told exactly which files are its own), and, at the final join, to review. The session keeps its own
context for decisions, for the parts that need the whole picture, and for joining the pieces.

## The lanes

| | Lane D | Lane E | Lane F | Lane G |
|---|---|---|---|---|
| Worktree | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneD` | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneE` | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneF` | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneG` |
| Branch | `lane/d` | `lane/e` | `lane/f` | `lane/g` |
| Ports (prototype, PWA, board) | 5573, 5574, 5580 | 5673, 5674, 5680 | 5773, 5774, 5780 | 5873, 5874, 5880 |
| Wave 6 theme | the groundwork (68) | idle | idle | idle |
| Wave 7 theme | updates to a List we hold (69) | new Lists and PDFs (70) | Sources and confirming unchanged Lists (71) | Needs NHI, the stub guard, Validators to Help (72) |

- The main checkout (`/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP`, branch
  `master`) is the owner's. Its servers hold 5173, 5174 and 5180; the Finances lanes hold 5273 to 5480.
  A lane never edits, builds or runs anything in the main checkout or in another lane's worktree. The
  exceptions are "Setting up the lanes" (Lane D's first session, before it enters its worktree) and the
  fast-forward at the Wave 7 join, each a few git commands.
- A lane belongs to its worktree, not to an account. Any account can resume any lane.
- Each worktree holds a git-ignored `.lane.env` at its root (`LANE`, `AA_PROTO_PORT`, `AA_PWA_PORT`,
  `BOARD_PORT`). `aa-prototype/laneEnv.ts`, the board's `server/laneEnv.ts`, `phase-check.mjs` and the
  capture runner read it themselves, so `npm run dev`, `npm run shots` and `phase-check` run on the
  lane's own ports however the session was started. If `.lane.env` is missing, stop and tell the owner.
- **A session can start anywhere.** The lane prompt has the session switch into its worktree with the
  `EnterWorktree` tool (`path`, never `name`) before doing anything else.
- If the worktree has no `node_modules` (in `aa-prototype/`, `requirements-board/` or the root), run
  `npm run setup` from the worktree root first. `git status` must stay clean afterwards; if it does not,
  stop and tell the owner.

## Setting up the lanes

Only Lane D's session does this, once, at the start of Wave 6, from the main checkout, before it enters
its worktree. Lanes E, F and G never set up: if their worktree does not exist, they stop and tell the
owner "Paste Lane D's prompt first: it sets the Intake lanes up."

1. `git worktree list` shows no `-laneD` worktree (if it does, the lanes exist: skip this section).
2. The main checkout is on `master` with no tracked changes (`git status --porcelain
   --untracked-files=no` empty), and `master` holds this file. Otherwise stop and tell the owner to
   commit first.
3. No `lane/d`, `lane/e`, `lane/f` or `lane/g` branch exists and no `-laneD` to `-laneG` folder exists
   beside the repo. Otherwise stop and tell the owner.
4. Run, from the main checkout (warn, don't stop, if a port is already listening):

   ```
   L="$(git rev-parse --git-common-dir)/lanes-intake"; mkdir -p "$L"
   P="/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP"
   for spec in D:5573:5574:5580 E:5673:5674:5680 F:5773:5774:5780 G:5873:5874:5880; do
     IFS=: read -r X A W B <<< "$spec"; x=$(echo "$X" | tr 'DEFG' 'defg')
     lsof -nP -iTCP:"$A" -sTCP:LISTEN >/dev/null 2>&1 && echo "WARNING: port $A in use"
     git worktree add "$P-lane$X" -b "lane/$x" master
     printf 'LANE=%s\nAA_PROTO_PORT=%s\nAA_PWA_PORT=%s\nBOARD_PORT=%s\n' "$X" "$A" "$W" "$B" > "$P-lane$X/.lane.env"
   done
   NOW="$(date +'%F %T')"
   echo "$NOW 68 ready lanes set up from master" > "$L/D.status"
   for X in E F G; do echo "$NOW - waiting Wave 7 (68 complete on lane/d)" > "$L/$X.status"; done
   printf '# Intake lane notes\n\nAppend-only, newest at the bottom. Each entry: ## <date> Lane <X>, <phase>\n\n## %s setup\n\nIntake lanes D to G created from master at %s.\n' "$NOW" "$(git rev-parse --short HEAD)" > "$L/notes.md"
   ```

5. Then carry on with the lane prompt: enter Lane D's worktree and run `npm run setup` there. (Lanes E,
   F and G run their own `npm run setup` at their first start.)

## Waves

Each lane runs its queue in order, one phase at a time. A phase is **complete on a lane** when the lane
branch holds a commit whose subject starts `<id> complete:`.

### Current wave: Wave 6

| Wave | Starts when | Lane D | Lane E | Lane F | Lane G | Joined on | Checks at the join | Owner test after it |
|---|---|---|---|---|---|---|---|---|
| 6 | this file is committed on `master` (now; Finances Wave 5 may still be running) | 68 | (none) | (none) | (none) | no join | none | none |
| 7 | `68 complete:` is on `lane/d` | 69 | 70 | 71 | 72 | `wave/7`, once Finances Wave 5 is on `master` | the full gate and the review | 68 to 72, from `TEST-68-72.md` |

Sessions: 68 2; 69 1 to 2; 70 1 to 2; 71 1; 72 1.

**Why this split.**
- Wave 6: 68 owns every file the later phases would collide on (the Intake route block, the section
  frame, the feed, the workbench frame and dispatcher, the read models, the types, the selectors, the
  ingest actions, the seed, `PERSIST_VERSION`, the demo trigger registry and the store barrel's
  Intake lines), so it goes first and alone. It also builds the whole arrival side (everything that
  makes an arrival appear), so Wave 7 builds only decisions.
- Wave 7: once 68 has given each kind of arrival its own bench file, the four lanes never meet in a
  file. Lane D takes every update to a List AA holds, from any source (a hospital's update, a re-sent
  PDF with its removals, a cancellation), so one difference table serves them all. Lane E takes every
  new List, from any source (a PDF read beside its values, a hospital List no one holds), and placing
  it. Lane F takes the Sources view, held messages and the Lists that match exactly. Lane G takes
  waiting for an NHI, the stub guard (outside Intake: the lifecycle guards and the Day drawers) and the
  Validators explanation.

### The file contract 68 sets up

68 gives every piece its own file, so Wave 7's lanes never meet in one. The phase doc may refine the
names; whatever 68 ships, it writes in the coordination folder's `notes.md` and its PROGRESS entry,
and Wave 7 follows that. Paths are under `aa-prototype/src/`.

- **Routes.** `router.tsx`'s Intake block: `/admin/intake` is Arrivals, `/admin/intake/sources` is
  Sources; the old `/admin/intake/matching`, `/waiting`, `/pdfs`, `/quality`, `/validators` and
  `/admin/matching` redirect with replace, carrying the `selectRowId` state as the selected arrival.
  The wrappers live in `apps/admin/routes.tsx`'s Intake block. `AdminApp.tsx` and `SideNav.tsx` are not
  edited: `SECTION_PATH.intake` stays `/admin/intake/matching`, which redirects, and the Intake badge
  keeps reading `matchingAttentionCount`, re-based inside `store/matchingSelectors.ts`.
- **The section, in `apps/admin/screens/intake/`:** `IntakeSection.tsx` (a `fit` AdminPage: the title,
  "From the rooms and hospitals. Nothing changes until you apply it.", LineTabs Arrivals and Sources,
  the quiet sources strip, the quiet "Add a PDF by hand" action, disabled until 70 sets
  `ADD_PDF_BY_HAND_READY`), `intakeTabs.ts` (the tab list, in its own file for oxlint), `intakePaths.ts` (every `/admin/intake` link goes through it),
  `ArrivalsView.tsx` (the feed beside the workbench in `WorkbenchSplit`; the selected arrival in the
  URL), `SourcesView.tsx` (a placeholder at 68's end; 71 builds it).
- **The feed, `screens/intake/feed/`:** `IntakeFeed.tsx`, `FeedFilters.tsx` (To decide, Needs NHI,
  Rooms PDFs, each hospital, Decided; the search box), `FeedGroupHeader.tsx` (a hospital file over its
  Lists; Intake's own, never `GroupRow`), `FeedItem.tsx` (every kind, from the read model),
  `SourceMark.tsx`, `useFeedKeys.ts` (J and K). Finished by 68; no Wave 7 lane edits them.
- **The workbench, `screens/intake/workbench/`:** `Workbench.tsx` (the frame every kind shares: the
  kind, the source and time, the List's title line, and the dispatcher), and one bench per kind, each
  taking `{ arrival, actor, onDone }`: `UpdateBench.tsx` and `CancellationBench.tsx` (69),
  `NewListBench.tsx` and `UnreadableBench.tsx` (70), `MatchesExactlyBench.tsx` and
  `HeldMessageBench.tsx` (71), `NeedsNhiBench.tsx` (72). At 68's end each bench is a working stub that
  shows the arrival's rows, read only, with no copy about later work. 68 also creates
  `workbench/newList/AddPdfByHand.tsx` as a stub (props `{ open, onClose, actor }`, exporting
  `ADD_PDF_BY_HAND_READY = false`) that `IntakeSection.tsx` opens; 70 fills it and flips the constant.
- **The docked split:** `shared/surface/WorkbenchSplit.tsx` (exported from `shared/surface/index.ts`), a new shared component (non-modal; the feed
  column and the workbench side by side at full height, like the Day view's grid and rail), with its
  `/demo/catalogue/admin` row and test. `SidePanel` stays modal and unchanged.
- **Read models, pure and tested, in `domain/intake/`:** `arrivals.ts` (an arriving List: rows of one
  arrival that share hospital, day, session and surgeon; its kind: update, new List, cancellation,
  needs NHI, unreadable, matches exactly, held; its source mark; its flags, data quality among them),
  `listChanges.ts` (the change summary per List and per Booking, removals included for a whole-List
  snapshot such as a re-sent PDF), `matchBasis.ts` (each match key, ticked or not), `listVersions.ts`
  (a List's versions from its origin and change history), `unchanged.ts` (Lists that match exactly,
  identical re-arrivals included), `stubMatch.ts` (an arriving row that matches a waiting stub's List, name and birth date, and
  carries its NHI), `placement.ts` (the named anaesthetist's Slot suggested, other free
  Slots that day, a Draft List), `pdfRead.ts` (the simulated reader's output: each value with a
  confidence and its box on the page, and the "to check" threshold; no vendor is named anywhere).
- **Store:** `store/intakeSelectors.ts` (the arrivals, one arrival, the feed counts), new ingest
  actions in `store/intakeIngest.ts` (a PDF from the rooms' mailbox, a hospital batch, a cancellation, a
  failed feed message, each audited and none an office decision), `store/intakeDecide.ts` (the one
  List-level decision path, D118: one or more Lists decided in one change set, each row applied, left
  out, rejected or a removal confirmed, with an optional placement; 69's `intakeApply.ts`, 70's
  `intakePlace.ts` and 71's `intakeBulk.ts` only map their bench to it), `matchingSelectors.ts` (the
  badge).
- **Data:** the additions to `domain/types.ts`; the Okafor story's everyday feed in
  `domain/seed/intakeSeed.ts` and the samples in `domain/intake/hospitalDownloads.ts`; `PERSIST_VERSION` 82 in `store/appStore.ts`.
- **Demo actions:** the six bodies in `shared/demoTriggers/intakeArrivals.ts`, registered in
  `registry.ts` on the Arrivals screen; the old intake triggers retired; the PWA stand-ins
  (`matching-office-matches-row`, `stub-office-adds-nhi`, `pwa-office-adds-nhi`) kept working.
- **Deleted by 68:** `screens/IntakeScreen.tsx`, `screens/MatchingScreen.tsx` (and their tests),
  `matching/MatchingTable.tsx`, `matching/ImportDialog.tsx`, `intake/PdfListsTab.tsx`,
  `intake/WaitingNhiTab.tsx` (its `waitingNhiTab.test.tsx` stays for 72), `intake/DataQualityTab.tsx`,
  `intake/ValidatorsTab.tsx`, both header buttons. The files the Wave 7 lanes reuse or delete stay for them (below).

### Who owns what in Wave 6

| | Owns |
|---|---|
| Lane D (68) | Everything in the file contract above; `router.tsx`'s Intake block and `routes.tsx`'s Intake wrappers; `store/matchingSelectors.ts`; `store/matchingDemo.ts` (old bodies retired, the stand-in parts kept; it passes to 69 for Wave 7); `store/officeStandIn.ts` (`addNhiAsSimulatedOffice` re-pointed to the ingest; it passes to 72); `stageImportRows` in `store/matchingActions.ts` (it passes to 69); `domain/intake/hospitalDownloads.ts` (samples); `components/StubResolveLink.tsx`, `screens/AdminBookingDetail.tsx` and `apps/demo/demoScenarios.ts` (their Intake links re-pointed through `intakePaths.ts`); `test/adminRoutes.tsx` (the route mirror); `shared/surface/index.ts`; `store/index.ts`'s Intake lines; `shared/demoTriggers/registry.ts` (its intake entries) and the trigger tests (`matchingTriggers`, `demoTriggers`, `demoGuideSync`); the catalogue rows of the deleted parts and `apps/demo/catalogue/admin/patientExamples.tsx`; the seed tests whose pins move; the Playwright specs whose Intake URLs move (`admin-matching`, `intake-pdf-lists`, `phase11`, `phase12`, `admin-patients`, `admin-layout`, `screens`, `pwa-demo-parity`, `demo-actions-audit`; re-pointed, not run) |

### Who owns what in Wave 7

| | Owns |
|---|---|
| Lane D (69) | `workbench/UpdateBench.tsx`, `workbench/CancellationBench.tsx`, new `workbench/update/` parts (`ListDiffTable.tsx`, `MatchBasisStrip.tsx`, `VersionTrack.tsx`, `SlotCard.tsx`), new `store/intakeApply.ts` (a whole List applied as one change set, a Booking left out, removals confirmed, reject) with tests, `store/matchingActions.ts`, `store/matchingDemo.ts` (the PWA stand-in, handed over by 68), `matching/RowPanel.tsx`, `DiffTable.tsx`, `DecisionCards.tsx`, `matchingText.ts` (reuse or delete) and their catalogue rows; `matching/RawRowSheet.tsx` stays with its export and props unchanged for 71; `docs/DECISIONS.md` line 14 |
| Lane E (70) | `workbench/NewListBench.tsx`, `workbench/UnreadableBench.tsx`, new `workbench/newList/` parts (`PdfPage.tsx` with its highlight boxes, `PdfValuesTable.tsx`, `PlaceListCard.tsx`), `workbench/newList/AddPdfByHand.tsx` (68's stub, filled), new `store/intakePlace.ts` (a whole List placed as one change set) with tests, `store/pdfListActions.ts`, `store/stubSettle.ts`, `domain/intake/pdfLists.ts`, `intake/PdfListReview.tsx`, `intake/PdfUploadDialog.tsx` (reuse or delete) and their catalogue rows |
| Lane F (71) | `screens/intake/SourcesView.tsx` and new `screens/intake/sources/` parts, `workbench/MatchesExactlyBench.tsx`, `workbench/HeldMessageBench.tsx`, new `domain/intake/sources.ts`, new `store/intakeBulk.ts` (confirm unchanged Lists together, and `dismissHeldMessage` if 68 shipped none) with tests, `store/rawRowActions.ts`, `store/integrationActions.ts`; imports `matching/RawRowSheet.tsx` unchanged and nothing else from `apps/admin/matching/` |
| Lane G (72) | `workbench/NeedsNhiBench.tsx`, `intake/AddNhiSheet.tsx`, `intake/WaitingNhiView.tsx` (folded in or deleted), the waiting-NHI parts of `store/patientActions.ts` and `store/patientSelectors.ts`, `store/stubActions.ts`, `store/stubDemo.ts`, `store/stubSelectors.ts`, `store/officeStandIn.ts` (handed over by 68), `store/lifecycle.ts` (the stub guard in `submitList` and `authoriseBlockersFor`, with a new `store/lifecycleStubGuard.test.ts`), `shared/flows/SubmitListSheet.tsx` (an optional `listReason` prop), `domain/listProgress.ts` (an optional standing-stub count), `domain/intake/stubs.ts`, `store/lookback.ts`, the Lists readings (`apps/mobile/screens/ListDetailScreen.tsx`, `ForwardListsScreen.tsx`, `ListsScreen.tsx`, `ListsLookback.tsx`, `WeekStrip.tsx`, `apps/web/screens/ListDetailView.tsx`, `shared/schedule/ListRow.tsx`; `DayGrid.tsx` and the Day drawers (`SlotDrawer`, `ListBookingsTable`, `DraftListDrawer`) only if a submit control or stub reading needs it), the Help panel's NHI and ethnicity format explanation (`shared/support/`: a new `FormatChecks.tsx`, add-only lines in `supportCopy.ts` and `SupportPanel.tsx`) |

- **No Wave 7 phase edits** 68's files: the route block, `IntakeSection.tsx`, `intakePaths.ts`,
  `ArrivalsView.tsx`, the feed, `Workbench.tsx`, `WorkbenchSplit.tsx`, 68's read models, selectors and
  ingest actions, `matchingSelectors.ts`, `intakeSeed.ts` or `registry.ts`. If a phase needs a change
  there (a field on the read model, a filter, a trigger), it builds what it can in its own files and
  notes the change in `notes.md` and under "For the merge"; the Wave 7 join makes it.
- **Files every lane may add to:** `domain/types.ts`, `domain/intake/index.ts`, `store/index.ts`,
  `shared/format.ts`, `shared/audit/` label maps, `src/apps/demo/catalogue/AdminCatalogue.tsx` and its
  example files, the Playwright specs in `aa-prototype/visual/` (change only your own steps and cases),
  `docs/build-plan/PROGRESS.md`, `docs/DECISIONS.md` and `docs/BACKLOG.md`. Add your own lines, rows,
  exports, tests and entries. Never rewrite, sort or re-wrap what is already there. **Owner-approved
  exception:** a lane may remove or rewrite its own Intake lines (exports of actions it deletes, catalogue
  rows of parts it deletes).
- If your work seems to need another lane's side, don't build it there. Note it under "For the merge"
  in your progress entry, and in `notes.md`.

### Never touched: the Finances build

Until Finances Wave 5 is on `master`, and in any Intake phase:
- nothing under `aa-prototype/src/apps/admin/screens/finances/`; `BillingMonitorScreen`,
  `InvoicesScreen`, `InvoiceDocument`, `LedgerScreen`, `AaFeesScreen`, `PaymentRunScreen`,
  `XeroPanels`, `PaymentCyclePanel`, `HoldingAccountPanel`, `LedgerPaymentRuns`, `ReconciliationCard`;
  `store/billingRun.ts`, `store/invoiceMaterialise.ts` and the other store files [LANES.md](LANES.md)'s
  Wave 5 table lists; `GroupRow` in `shared/table/cells.tsx`;
- `store/selectors.ts` (Lane A's no-address readers): `dataQualityItems` stays there;
- `PatientRecord` (a no-address reader): the data-quality flag on the patient's page is made by the Wave
  7 join, after Finances is on `master`;
- `ReviewScreen.tsx`: the stub guard reaches its action bar through `authoriseBlockersFor`;
- `AdminApp.tsx`, `SideNav.tsx`.

If an Intake need seems to touch one, note it for the join; never build it there.

## How a lane session runs

The owner pastes the same lane prompt every time (in `lanes/`). The session then does this.

1. **Check where you are.** After the lane prompt's `EnterWorktree` switch, `pwd` is your lane's
   worktree and `git branch --show-current` is your lane branch, or `wave/7` if you are the session
   doing the join. Otherwise stop and tell the owner. `cat .lane.env` shows your ports.
2. **Pick up `master`.** With a clean tree (no uncommitted changes to tracked files), run
   `git merge master`. Then re-read this file: the merge may have changed it. Skip this step with a dirty
   tree (a phase stopped mid-way: you are resuming it). (While Finances Wave 5 runs, `master` moves only
   by docs; once Wave 5 has joined, this brings the Finances code in early, in small pieces.)
3. **Which wave is yours?** The first wave in the table whose queue for your lane holds a phase with no
   `<id> complete:` commit on your branch and not DONE in your branch's `PROGRESS.md`.
   - If none, this lane has finished: write `done` in your status file and tell the owner "Lane <X> has
     finished every wave."
   - Wave 7's start condition is `68 complete:` on `lane/d`
     (`git log lane/d --grep='^68 complete:' --oneline`). If it does not hold, stop. Write
     `waiting 68 complete on lane/d` in your status file and tell the owner: "Lane <X> is waiting for
     68 on lane/d. Paste this lane's prompt again once Lane D has finished 68."
4. **Read the lane state.** Read `"$(git rev-parse --git-common-dir)/lanes-intake/"`: every status file
   and `notes.md`. Read `git log --oneline master..lane/d` (and `lane/e`, `lane/f`, `lane/g`). Skim the
   Finances lanes' `"$(git rev-parse --git-common-dir)/lanes/notes.md"` for a `PERSIST_VERSION` bump or a
   shared-file change you will meet at the join; never write there except the one line 68 writes.
5. **Find your phase.** The first phase in your lane's queue for that wave with no `<id> complete:`
   commit on your branch.
   - If every phase in your queue for the wave is complete, go to "Joining Wave 7".
   - If the phase has `<id> checkpoint:` commits or uncommitted work in the worktree, you are resuming:
     the skill's resume path (Stage 0) applies.
6. **Sync, at a phase start only.** In Wave 7, if your branch does not hold `68 complete:` from `lane/d`,
   merge it (`git merge <that commit>`). Then, for each other Intake lane with a `complete:` commit of
   Wave 7 your branch does not hold, merge it too, resolving by "Resolving conflicts". Then make
   `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --only typecheck` green
   before you start. Never merge another lane mid-phase, and never merge its work in progress. Never
   merge `lane/a`, `lane/b`, `lane/c` or `wave/5`.
7. **Build the phase.** Open its kick-off prompt (`docs/build-plan/phases/phase-<id>-*.prompt.md`) and
   follow it as if the owner had pasted it: load the run-build-phase skill and run its stages, with the
   overrides below. Write `started` in your status file.

### Overrides for a lane session

- **Where:** only in your worktree, every path from its root.
- **Subagents, as much as possible:** parallel subagents for reading (the code a phase replaces, the
  stories, the mock's sections), for independent pieces of the build (each given its own files and the
  shared components to use), and for any review the join runs.
- **Commits are part of the job.** Commit on your lane branch only, staging by path (`git add <paths>`,
  never `-A` or `.`). Commit early, in small pieces.
  - At a two-session phase's checkpoint, once the quick checks are green: `<id> checkpoint: ...`.
  - When the phase is finished (built, quick checks green, `PROGRESS.md` updated): `<id> complete: ...`.
    End the message with the attribution lines your session is given, if any.
  - Never push. Never amend, rebase or reset a commit another lane or the owner made. Never delete a
    branch or a worktree.
- **Quick checks only; test once at the very end.** Your gate, at a checkpoint and at the end, is
  `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --changed` plus `npm run
  lint` in `aa-prototype/`, both green. Never run the full Vitest suite, either build, verify-board or
  the Playwright suite. Update the Playwright specs your phase moves, but don't run them. Skip the
  screen-proof, the manual test checklist run and the adversarial review. If it typechecks, lints and
  its own tests pass, commit and move on.
- **No owner test between phases or waves.** Put everything for the owner on the phase's "For the
  owner's review" list as usual.
- **Ports:** your lane's own. Never stop a server you didn't start. Run
  `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --stop-servers` at the
  end if you started any.
- **Screenshots, recipes, ATLAS and the demo guide:** don't touch them and never run the capture, even
  `--dry`. The owner's sweep re-points them. Keep `demoGuideSync.test.ts` green: a new demo action that
  plays an old beat keeps the old label; any other gap goes in the test's own allowance list, named for
  the sweep. Generated Playwright output under `aa-prototype/visual/.output` is never committed.
- **The plan page is the join's job.** Skip the skill's Stage 7 edits to `status.json` and
  `index.html`. Write your status file instead. Your final message to the owner ends `Next: <the next
  phase in this lane's queue>`, or `this lane has finished Wave <n>`.
- **`PERSIST_VERSION`:** 68 takes it from 80 to 82 (Finances Lane B took 81 on `lane/b`) and appends one
  line saying so, and why, to both `"$(git rev-parse --git-common-dir)/lanes/notes.md"` (the Finances
  notes) and this build's `lanes-intake/notes.md`. No Wave 7 phase expects to bump it; one that must
  takes one past the highest number named in either notes file, and writes it in both.
- **Vocabulary and copy:** no vendor name for the PDF reader anywhere in app copy or requirements; no en
  or em dashes in app copy; Booking never Card; no "slot", "swap" or "timesheet" in copy; no phase
  numbers in copy.
- **Your memory doesn't carry over.** The rules that matter are in this file, the phase doc, the skill
  and CLAUDE.md.

### Talking to the other lanes

Everything goes through `"$(git rev-parse --git-common-dir)/lanes-intake/"`, the main checkout's
`.git/lanes-intake/`, visible from every worktree and never committed.

- **`D.status`, `E.status`, `F.status`, `G.status`:** one line, overwritten at each change:
  `<date +'%F %T'> <phase> <started|checkpoint|complete|wave-done|waiting|blocked|joining|joined|done> <a few words>`.
- **`notes.md`:** append-only, newest at the bottom. Head each entry `## <date> Lane <X>, <phase>`.
  Write what the other lanes need before they merge your work:
  - the commit id of your `complete:`;
  - 68: the file contract as shipped (every file name, each bench's props, the read models' exports and
    what each returns, the selectors, the ingest actions, the arrival kinds and flags, the routes, the
    six demo actions' ids and labels, the retired triggers, `PERSIST_VERSION`);
  - renamed or removed types, fields, exports, helpers or `data-shot` hooks;
  - shared components or props you added;
  - a change you need in 68's files from the join;
  - tests the other lanes will see fail, and shared files you touched.
- Never wait or poll for another lane. If you need something from one, write it in `notes.md` and carry
  on, or stop as `blocked` and tell the owner.

## Joining Wave 7

When your Wave 7 phase is complete, write `wave-done` in your status file. The last Intake lane to
finish joins. Look for the other lanes' phases (`git log lane/<y> --grep='^<id> complete:' --oneline`):
`69` on `lane/d`, `70` on `lane/e`, `71` on `lane/f`, `72` on `lane/g`.

- **Not all there: you finished early.** Stop. Tell the owner: "Lane <X> finished Wave 7, on
  `lane/<x>`. The last lane to finish does the join." Do not wait or poll.
- **Finances Wave 5 not on `master` yet** (any of 58 to 67 not DONE in `git show
  master:docs/build-plan/PROGRESS.md`): stop. Write `waiting Finances Wave 5 on master` in your status
  file and tell the owner: "Intake Wave 7 is ready to join. Paste Lane <X>'s prompt again once Finances
  Wave 5 is on master."
- **All there and Wave 5 on `master`: you join.** Claim it with `git branch wave/7 lane/<x>`. If that
  fails because the branch exists, another session is already joining: stop as above. Otherwise write
  `joining` in your status file, `git switch wave/7`, merge each other Intake lane branch one at a time
  (resolving by "Resolving conflicts"), then `git merge master` (it brings in the joined Finances code).

### Checking Wave 7's join: the full gate, once

This is the one full test of the Intake rebuild.

- **The full gate, all green:**
  `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs` (typecheck, both builds,
  all of Vitest, verify-board, all Playwright) and `npm run lint` in `aa-prototype/`. No lane ran the
  heavy checks, so fix any failure from any of 68 to 72 here, then re-run the gate. Known failures on
  `master` from before (`docs/BACKLOG.md`) aren't the wave's, but don't add to them.
- **Where the two builds meet:** `registry.ts` (Finances' added triggers kept, Intake's retired ones
  gone, the six Intake actions in), `store/index.ts`, `domain/types.ts`, the catalogue rows, the audit
  labels: take the union. `PERSIST_VERSION`: one past the higher of the two builds, every comment line
  and migrate case kept. Seed pins, fingerprints and count tests are re-measured on the joined code,
  never added up.
- No hook was lost: `git diff <master before Wave 6>...HEAD -- aa-prototype | grep '^-.*data-'`, and
  account for every line removed with a deleted screen.
- **What the join makes:** every change a lane noted in `notes.md` or under "For the merge" (changes to
  68's files); the data-quality flag on the patient's page (`PatientRecord`, now that Finances is on
  `master`).
- **In the running app on your ports, check where the lanes meet:**
  - `/admin/intake` opens on Arrivals with the feed beside the docked workbench; Sources is the second
    tab; the old Intake URLs redirect with replace and Back does not loop; no Import or Upload button,
    only "Add a PDF by hand".
  - Play the six demo actions in order (the Okafor story, `intake-ideas.html` section 2): the rooms'
    PDF lands as a New List and is placed in Dr Rutherford's AM Slot with a stub; the re-send lands as
    an Update with the missing Booking offered as a removal; St George's day-before List lands as an
    Update with the stub's NHI, and its other Lists as matching exactly, confirmed together; the
    Southern Cross cancellation keeps the Booking visible, marked cancelled; the scan's unsure values
    are marked to check and light up on the page; the failed message is held on Sources, never dropped.
  - Each apply is one change set per List in the history; nothing changes until Apply; inbound only is
    stated on Sources.
  - Needs NHI: one Add NHI path, through the Hub lookup; the Intake badge counts each waiting arrival
    once; the Patients badge never counts them.
  - The stub guard: a List holding only a stub reads "1 waiting at intake", and cannot be submitted or
    authorised (the reason shown in the Review queue's action bar and the submit sheet); a List with real
    Bookings and a stub still can.
  - The PWA stand-ins (`matching-office-matches-row`, `stub-office-adds-nhi`, `pwa-office-adds-nhi`)
    still work on the handset.
  - Finances still works: open `/admin/finances` and its six tabs once.
- **The review, once for all five phases.** Three Opus subagents (`model: opus`), read-only, over the
  diff since `master` before Wave 6, one per lens: bugs and correctness (guards, audit and change sets,
  determinism, the redirects, the counts, the stub guard, the ingest never deciding anything), plan
  adherence (every work item of 68 to 72 delivered), and the joins (one lane's work lost in a conflict, a
  part built twice, a hook dropped, a route or trigger lost, a private copy of a shared component, a
  Finances file touched). Give each the phase docs' review steer bullets. Ask for findings that would
  stop something working or break a rule in CLAUDE.md, not polish. Verify each finding yourself, fix the
  confirmed ones, and re-run the full gate.

### Writing up the join

- In `docs/build-plan/PROGRESS.md`, under 72's entry, add a short `Wave 7 joined` note: the date, the
  lanes it took in, each conflict and how it was resolved, the checks run (the re-measured Vitest and
  Playwright counts), and anything for the owner.
- **Write the owner's test sheet,** `docs/build-plan/TEST-68-72.md`, like `TEST-50-57.md`: one walk
  through the app on 5173 covering 68 to 72 in about 20 numbered steps, each with where to click, the
  seed record or demo action to use and what should happen. Draw it from the five phases' manual
  checklists and the join's checks; leave out what a test already proves. End it with "Decisions to look
  at": the five phases' "For the owner's review" lists merged into one short list, one line each.
- **Mark the wave** in this file's "Waves" heading: "Current wave: none (Wave 7 joined <date>)".
- **Update the plan page:** in `docs/build-plan/status.json`, add 68 to 72 to `done`, remove the Intake
  lanes from `guidance.lanes`, write a `headline` saying the Intake rebuild is on `master` for the
  owner's test, with `headline_sub` linking `TEST-68-72.md`. Then
  `node requirements-board/agent/skills/update-build-plan/tools/build-index.mjs` from the worktree root,
  which must print no warnings.
- Commit with the subject `Wave 7 joined: ...`.

### Fast-forwarding `master`

1. `git -C "/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP" merge --ff-only wave/7`.
   Git refuses rather than touch the owner's uncommitted changes.
   - If it refuses because `master` moved: merge `master` into `wave/7`, re-run `phase-check.mjs --only
     typecheck,build,build-pwa,vitest,verify-board`, commit, and try again.
   - If it refuses because of the owner's uncommitted changes, stop. Tell the owner the exact command to
     run once they have committed.
   - If this session isn't allowed to write to the main checkout, don't keep trying. Write
     `joined, master fast-forward pending the owner` in every Intake status file and stop. Tell the
     owner to paste this into a Claude session in the main folder: "Finish the Intake Wave 7 join:
     fast-forward master to wave/7 as docs/build-plan/LANES-INTAKE.md's 'Fast-forwarding master' says
     (merging master into it first if it moved)."
2. **Bring your own lane branch up:** `git switch lane/<x>` then `git merge --ff-only master`.
3. Write `joined` in every Intake status file and append a `notes.md` entry. Tell the owner what
   `master` now holds (not pushed), that 68 to 72 are ready to test on 5173 from
   `docs/build-plan/TEST-68-72.md`, and to paste into a main-folder session: "Tear down the Intake build
   lanes as docs/build-plan/LANES-INTAKE.md's Tear down section says."

### Resolving conflicts

This applies at a sync and at the join.

- **A file only one lane owns** shouldn't conflict. If it does, keep the owning lane's version and
  re-apply the other side's lines by hand, checked against that phase's work items.
- **Imports, index exports, the store barrel, the intake barrel, the audit labels, the catalogue rows:**
  take the union, with no duplicates.
- **`types.ts`:** keep every lane's (and Finances') additions. If two touched one type, keep every set
  of fields.
- **68's files, the demo trigger registry:** 68's version, plus the changes lanes noted for the join,
  plus every Finances entry.
- **`PERSIST_VERSION`:** one past the higher number, with every comment line and every migrate case.
- **Tests and specs:** keep every lane's tests. Where two changed one assertion, make it hold for the
  joined behaviour.
- **`PROGRESS.md`:** every status row and every entry, in phase order. Keep every Decisions-log line and
  handoff list.
- **`docs/DECISIONS.md` and `docs/BACKLOG.md`:** take the union. Where order is free, Lane D's comes
  first, then E's, F's and G's.
- **A hook** (`shot`, `data-shot`, `data-testid`, a row `data-*`): if any side kept it, it stays.
- **`status.json` and `index.html`:** take `master`'s, then regenerate at the join.
- **Never** resolve by taking one side's whole file, and never drop one lane's (or the Finances build's)
  work to make a conflict go away. If a conflict can't be resolved without changing what another lane
  built, resolve it the smallest way that keeps both behaviours, and log it under "For the owner's
  review".

## Tear down

Only after the Wave 7 join, from a session in the main folder, once `master` holds `wave/7`
(`git branch --contains wave/7` lists `master`):

1. Check every Intake worktree is clean (`git -C <worktree> status --short` empty). If one isn't, stop
   and tell the owner.
2. `git worktree remove` each of `-laneD` to `-laneG`.
3. `git branch -d lane/d lane/e lane/f lane/g wave/7` (`-d` refuses an unmerged branch: if it does, stop
   and tell the owner).
4. Remove `"$(git rev-parse --git-common-dir)/lanes-intake/"`. Never touch `.git/lanes/` (the Finances
   lanes' folder) or `lane/a` to `lane/c`.
5. Remove `lane/d` to `lane/g` from `docs/build-plan/plan.config.json`'s `lanes.branches`, mark this file
   closed with a line at the top ("Closed <date>: Wave 7 joined"), and commit both by path.

## The lane prompts

The prompts are in `lanes/lane-d.prompt.md`, `lanes/lane-e.prompt.md`, `lanes/lane-f.prompt.md` and
`lanes/lane-g.prompt.md`, and on the plan page (`index.html`, "Start now"). The owner pastes each into its
own session, usually started in the main checkout: Lane D's first, since it sets the Intake lanes up.
Lanes E, F and G can be pasted at once; they wait, and say so, until 68 is complete on `lane/d`. The same
prompt starts, resumes and joins: the session works out which. A phase's own kick-off prompt is what a
lane session follows inside its worktree; never paste a lane phase's own prompt into a session on
`master`.
