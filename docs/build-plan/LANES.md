# Build lanes: Phases 46 to 57 in three worktrees, in three waves

The owner's decisions of 25 November 2026. Once **Phase 45** (the Contracts section and the Contract
page) was built and committed on `master` as an ordinary session in the main folder, every later phase
is built in a **lane**: its own git worktree, branch and dev-server ports, run by its own Claude
session. The work is cut into **waves**. In a wave, each lane works through a short queue of phases;
when the wave's lanes have finished, one session **joins** them on a wave branch, checks the joined
code and fast-forwards `master`. The next wave starts from `master`.

- **Wave 1** builds the rest of the Contracts section (46 to 49, Lanes A and B), joined onto `master`
  before any People phase starts (the owner's call: the Contracts work comes together first).
- **Wave 2** lays the People foundations: Lane A builds the rate and tier card (50), making an
  anaesthetist inactive (52) and then the People section itself (53), the move every later People page
  builds on; Lane B builds Waiting for NHI on Intake (51) beside it.
- **Wave 3** builds the People pages (54 to 57) in all three lanes.

**The owner tests twice, never between phases or waves:** 45 to 49 once, on `master`, after Wave 1's
join (from `TEST-45-49.md`); 50 to 57 once, on `master`, after Wave 3's join (from `TEST-50-57.md`).
Wave 2 starts at Wave 1's join without waiting for the owner's test; a fix from that test lands on
`master` and reaches the lanes through their `git merge master` at each phase start. This is a
prototype: each phase must work, not be production ready.

The owner runs the lanes from two Claude accounts (`claude` and `claude2`), so the sessions never talk
to each other through Claude: everything they share goes through git and a folder in the shared git
directory, described below.

**This file overrides** the phase's kick-off prompt, the run-build-phase skill and CLAUDE.md wherever
they differ, for a lane session only. Phase 45 ran as an ordinary session in the main folder.

## The lanes

| | Lane A | Lane B | Lane C |
|---|---|---|---|
| Worktree | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneA` | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneB` | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneC` |
| Branch | `lane/a` | `lane/b` | `lane/c` |
| Ports (prototype, PWA, board) | 5273, 5274, 5280 | 5373, 5374, 5380 | 5473, 5474, 5480 |
| Usually run by | `claude` | `claude2` | either |
| Wave 1 theme | the Contract record: New contract, Replace from a date | the catalogue and the address book: grouping, Parties, Funding tags | idle |
| Wave 2 theme | the anaesthetist (rate and tier card, make inactive), then the People section | Waiting for NHI on Intake | idle |
| Wave 3 theme | the anaesthetist's page | the surgeon's and the specialty's pages, surgeon groups cut | the Patients tab and the patient's page |

- The main checkout (`/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP`, branch
  `master`) is the owner's. Its servers hold 5173, 5174 and 5180. A lane never edits, builds or runs
  anything there. The one exception is the fast-forward at a join (below), a single git command.
- A lane belongs to its worktree, not to an account. Any account can resume any lane: all the state is
  in the worktree and in git.
- Each worktree holds a git-ignored `.lane.env` at its root (`AA_LANE`, `AA_PROTO_PORT`,
  `AA_PWA_PORT`, `BOARD_PORT`). `aa-prototype/laneEnv.ts` (imported by both Vite configs and the
  Playwright config), the board's `server/laneEnv.ts`, `phase-check.mjs` and the capture runner read
  it themselves, filling any variable not already set. So `npm run dev`, `npm run shots` and
  `phase-check` all run on the lane's own ports however the session was started, and the servers and
  Playwright workers they start inherit them. No port lock is needed. If `.lane.env` is missing, stop
  and tell the owner.
- **A session can start anywhere.** The owner usually starts every session in the main checkout. The
  lane prompt has the session switch into its worktree with the `EnterWorktree` tool (`path`, never
  `name`) before doing anything else, so every command and edit after that happens in the worktree.
- If the worktree has no `node_modules` (in `aa-prototype/`, `requirements-board/` or the root), run
  `npm run setup` from the worktree root first. `git status` must stay clean afterwards; if it does
  not, stop and tell the owner.

## Waves

Each lane runs its queue in order, one phase at a time. A phase is **complete on a lane** when the lane
branch holds a commit whose subject starts `<id> complete:`. A wave **starts** when its start condition
holds on `master` (and so, after step 2 below, on your branch). A wave is **on `master`** when every
phase in it is DONE in `master`'s `docs/build-plan/PROGRESS.md`.

### Current wave: Wave 2 (Wave 1 joined 2026-11-25 at 449fea69)

| Wave | Starts when | Lane A | Lane B | Lane C | Joined on | Owner test after it |
|---|---|---|---|---|---|---|
| 1 | 45 is DONE on `master` | 46, then 49 | 47, then 48 | (none) | `wave/1` | 45 to 49, from `TEST-45-49.md` |
| 2 | all of Wave 1 (46 to 49) is on `master` | 50, then 52, then 53 | 51 | (none) | `wave/2` | none |
| 3 | 53 is on `master` | 54 | 55, then 56 | 57 | `wave/3` | 50 to 57, from `TEST-50-57.md` |

Sessions: 46 1; 47 1; 48 1; 49 1 to 2; 50 1; 51 1; 52 2; 53 2; 54 1; 55 1 to 2; 56 1; 57 1 to 2.

**Why this split.**
- Wave 1: 46 and 47 each need only 45; 49 needs 46, so it follows it in Lane A; 48 needs 47, so it
  follows it in Lane B. The Contracts work is joined onto `master` before any People phase starts, so
  no People phase has to keep clear of the Contracts files.
- Wave 2: 52 needs 50 (it builds on 50's card in the same file) and 49 (on `master` by then). 53 owns
  every shared shell file (router, side nav, `AdminApp`, routes, the Master data registry, the
  redirects), moves the screens 50 to 52 change and lifts the record pattern every People page builds
  on, so it comes last, after 50 and 52 in Lane A and after Lane B's 51, which it merges at its start.
  51 needs nothing from Lane A, so it runs beside 50 in Lane B. Keeping 53 after 50 to 52, not beside
  them, trades about two sessions for a mechanical join: 53 would otherwise move the very list and
  record 50 and 52 are changing.
- Wave 3: 54, 55 and 57 each need only 53 (and Wave 2's cards and counts); 56 needs 55 (its rows open
  the surgeon's page), so it follows it in Lane B.

### Who owns what in Wave 1

Keep to your side, and the merges stay mechanical.

| | Owns |
|---|---|
| Lane A | The New contract page and its folder; `domain/billing/contractSimilarity.ts`; `apps/admin/flows/contractDraft.ts`; deleting `ContractEditSheet.tsx` and its test, its catalogue rows and `ContractPanelExample`, and moving the D23 `MUST_KEEP` pin; the shared `Card` (46's `step` variant); `store/contractReplaceActions.ts`; `domain/billing/contractHistory.ts`; the warning rule `replacedContractStillActive.ts`; `ReplaceContractSheet.tsx`; the Contract page's header and lines (45's page); 45's `disableFromISO`; the Admin Day to-do row (`WarningsToDo.tsx`, `RailWorkCard.tsx`, `RightRail.tsx`) |
| Lane B | The Contract list screen (45's moved file) and its grouping, index and paging; `domain/billing/contractGroups.ts`; `GroupRow` in `shared/table/cells.tsx`; `apps/admin/components/GroupIndex.tsx`; the shell's `contractGrouping` and `setContractGrouping`; `FULL_SCALE.pageSizes.contracts`; `domain/billing/partyContracts.ts`; the Parties and Funding tags tabs, `PartyPage.tsx`, `PartyPanel` and `PartyFormFields`; `masterViews.ts`, `view.ts`, `MasterData.tsx`, `chrome.tsx`, `LoadResultPanel.tsx`, `GoLiveLoadView.tsx`; the redirect helper in `AdminMastersRoute` (45's) |

- **Where Lanes A and B meet:**
  - **The Contract list screen** is Lane B's. Lane A touches it in two places only: 46 changes where
    its New contract button goes (to the new page, keeping `?holder=`), and 49 changes the one header
    line about dated changes. Change those lines and nothing else there. Lane B keeps the New contract
    button and its handler where 45 put it, and leaves that header line's wording to 49.
  - **`router.tsx`, the Contracts route block:** Lane A swaps the `new` route's element (46); Lane B
    adds `parties`, `parties/:partyId` and `tags` (48). Add your own routes; never reorder the block.
  - **The section's tab strip** (45's): Lane B adds the Parties and Funding tags tabs. Lane A adds no
    tab.
- **Files every lane may add to:** `domain/types.ts`, `domain/billing/index.ts` and `types.ts`,
  `store/index.ts`, `shared/format.ts`, `shared/audit/` label maps, `shared/demoTriggers/registry.ts`,
  `src/apps/demo/catalogue/AdminCatalogue.tsx` and its example files, `specialtiesTags.test.tsx`, the
  Playwright specs in `aa-prototype/visual/` (`admin-phase07`, `admin-phase18a`,
  `contract-warnings-phase25a`, `overlays-u2` and others), `docs/build-plan/PROGRESS.md`,
  `docs/DECISIONS.md` and `docs/BACKLOG.md`. Lanes A and B also add to `domain/billing/contracts.ts`.
  Add your own lines, rows, exports, tests and entries. Never rewrite, sort or re-wrap what is already
  there.
- If your work seems to need another lane's side, don't build it there. Note it under "For the merge"
  in your progress entry, and in `notes.md`.

### Who owns what in Wave 2

| | Owns |
|---|---|
| Lane A | 50 and 52: today's anaesthetist record (`apps/admin/screens/AnaesthetistRecord.tsx`) and the cards and sheets they add for it (rate and tier card, status card, make-inactive and offer-back sheets, history card), each in its own new file; `apps/admin/flows/EditAnaesthetistSheet.tsx`; `screens/masters/AnaesthetistsView.tsx` (its tier filter); the anaesthetist's last day, reason and `isActiveOn` and every reader of the active flag (the canvas, roll-forward, pickers, finder, moves, AA fee run, payment-receipt guard); `store/anaesthetistStatusActions.ts`; the anaesthetist sign-in (`anaesthetistSession.ts` and the mobile, PWA and web sign-in screens). Then 53: every shared shell file (`router.tsx`, `SideNav.tsx`, `AdminApp.tsx`, `apps/admin/routes.tsx`, the Master data registry and views, the redirects), the People section and the shared record components lifted out of `ContractCards.tsx` |
| Lane B | 51: `IntakeScreen.tsx`'s `INTAKE_TABS` and the Waiting for NHI view moved from `screens/patients/`; `patientAttentionCount` and `matchingAttentionCount`; `PatientsScreen.tsx`'s waiting view; in `router.tsx` the Intake block's new route and the Patients block's `waiting` redirect; its route component in `routes.tsx` |

- **Where they meet:** only in `router.tsx` and `routes.tsx` (51's Intake and Patients lines, which 53
  then moves) and in `patientAttentionCount` (51 changes what it counts; 53 puts that count on the
  People entry). 53 merges Lane B's `51 complete:` commit at its start (step 6), so 53 builds on 51 and
  the join meets no conflict there. If 51 is not complete when 53 is due, Lane A stops as `blocked 51`.
- 50 and 52 build on today's screens; 53 moves them under People as they are, and Wave 3 rebuilds the
  pages. 53 must leave the Contract page's behaviour unchanged when it lifts the record pattern out of
  `ContractCards.tsx` (D104). 52 disables and re-enables Contracts through the existing
  `disableContract` and `enableContract`, from its own new files.
- Wave 1's shared-file rule ("Files every lane may add to") holds in Wave 2 too.

### Who owns what in Wave 3

| | Owns |
|---|---|
| Lane A | The anaesthetist's page (54) and its folder; its route in the People block; deleting `EditAnaesthetistSheet.tsx` and the Anaesthetists list's row Edit action and import of it; `domain/anaesthetistPanel.ts`; placing 50's and 52's cards (as they are) |
| Lane B | The surgeon's page (55) and its folder; removing the surgeon group record (DM-08): its type, store slice, seed, actions, retire and rename plumbing, `SurgeonGroupSheet`, audit labels and tests, with the migration and 55's `PERSIST_VERSION` bump, and the group's part of `chrome.tsx` (`NOUN`, lookup) and the `RetireSection` catalogue example; the surgeon edit sheet (create only); the specialty's page (56) and its folder, the Specialties tab's row actions and sheet, and `specialtyHolders` in `domain/specialties.ts`; their routes in the People block |
| Lane C | The Patients tab (57): its filters, search and pager; `patientsNeedingOffice`, `patientList` and `patientAttentionCount` in `patientSelectors.ts`; `patientParts.tsx`; `EditPatientSheet.tsx` (its form fields extracted); the patient's page and its folder; its routes and the `/admin/patients/follow-up` redirect in the People block |

- **`PairingSection`** (54 and 55 both need a panel layout): the first lane to need it adds one default-off prop; the other uses it after the sync. If both add one, keep both and log it under "For the merge". The specs `admin-phase17b`, `admin-phase18a` and `profile-phase26`, and `mastersPages.test.tsx`, are edited by more than one lane: change only your own steps and cases.
- **53's shared record components** (the cards edited one at a time and the side panel, D104) are
  everyone's: extend them with a prop that defaults to today's behaviour, with its catalogue row; never
  rewrite or copy them. If two lanes add a prop, keep both.
- **`router.tsx`, the People route block:** add or swap only your own routes; never reorder the block.
- **The side panel's sections** (pairings, linked Contracts, next Lists): the first lane to need one
  builds it as a shared section beside 53's components and writes it in `notes.md` at its phase start;
  the others reuse it after the sync.
- Wave 1's shared-file rule ("Files every lane may add to") holds in Wave 3 too.

## How a lane session runs

The owner pastes the same lane prompt every time (in `lanes/`). The session then does this.

1. **Check where you are.** After the lane prompt's `EnterWorktree` switch, `pwd` is your lane's
   worktree and `git branch --show-current` is your lane branch, or `wave/<n>` if you
   are the session doing a join. Otherwise stop and tell the owner. `cat .lane.env` shows your ports.
2. **Pick up `master`.** With a clean tree (no uncommitted changes to tracked files), run
   `git merge master`. It brings in the last join and any plan or requirements updates the owner has
   committed. Then re-read this file: the merge may have changed it. Skip this step with a dirty tree
   (a phase stopped mid-way: you are resuming it).
3. **Which wave is yours?** It is the first wave in the table whose queue for your lane holds a phase
   with no `<id> complete:` commit on your branch (none for your lane in that wave: look at the next).
   - If no wave has a phase left for your lane, this lane has finished: write `done` in your status
     file and tell the owner "Lane <X> has finished every wave."
   - If that wave's start condition does not hold in your branch's `PROGRESS.md` (after step 2), stop.
     Write `waiting <condition>` in your status file and tell the owner: "Lane <X> is waiting for
     <condition> on master. Paste this lane's prompt again once it is."
4. **Read the lane state.** Read `"$(git rev-parse --git-common-dir)/lanes/"`: every status file and
   `notes.md`. Read `git log --oneline master..lane/a`, `master..lane/b` and `master..lane/c`.
5. **Find your phase.** It is the first phase in your lane's queue for that wave that has no
   `<id> complete:` commit on your branch.
   - If every phase in your queue for the wave is complete, go to "Joining a wave".
   - If the phase has `<id> checkpoint:` commits or uncommitted work in the worktree, you are resuming:
     the skill's resume path (Stage 0) applies.
   - Check every id in the phase's `depends_on` (in `docs/build-plan/plan.json`). Each must be DONE in
     your branch's `PROGRESS.md`, or complete on another lane of the same wave (step 6 merges it). If
     one is neither (a re-plan can add one; 53's `51`, from Lane B, is the expected case), stop: write
     `blocked <id>` in your status file and tell the owner.
6. **Sync with the other lanes, at a phase start only.** For each other lane: if it has an
   `<id> complete:` commit of the current wave your branch does not hold, merge it
   (`git merge <that commit>`) and resolve by "Resolving conflicts". Then make
   `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --only typecheck`
   green before you start (the merged work's own tests ran in its lane; the join runs everything). Never merge another lane mid-phase, and never merge its work in progress.
7. **Build the phase.** Open its kick-off prompt (`docs/build-plan/phases/phase-<id>-*.prompt.md`) and
   follow it as if the owner had pasted it: load the run-build-phase skill and run all its stages,
   with the overrides below. Write `started` in your status file.

### Overrides for a lane session

- **Where:** only in your worktree, every path from its root. Never in the main checkout or in another
  lane's worktree.
- **Commits are part of the job.** Commit on your lane branch only, staging by path (`git add <paths>`,
  never `-A` or `.`). Your worktree's index is your own, so stage and commit together.
  - At a two-session phase's checkpoint, once the gate is green: commit with the subject
    `<id> checkpoint: ...`.
  - When the phase is finished (every stage done, `PROGRESS.md` updated): commit with the subject
    `<id> complete: ...`. End the message with the attribution lines your session is given, if any.
  - Never push. Never amend, rebase or reset a commit another lane or the owner made. Never delete a
    branch or a worktree.
- **No owner test between phases or waves.** The ROADMAP rule that the owner tests each phase before
  the next starts is replaced by the two owner tests in "Waves". Build your next phase straight after
  the last one's `complete:` commit, in the same session if it has room or the next one. Put everything
  for the owner on the phase's "For the owner's review" list as usual.
- **The quick checks per phase; every heavy check runs once, at the join** (owner, 25 Nov 2026: speed
  first; this is a prototype). In the run-build-phase skill:
  - Your gate, at a checkpoint and at the end, is the quick tier only:
    `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --changed` (typecheck,
    the Vitest tests related to your changes, the catalogue check) plus `npm run lint` in
    `aa-prototype/`, all green.
  - Never run the full Vitest suite, either build, verify-board or the whole Playwright suite in a lane
    phase, whatever the phase doc's checklist or the skill says (Stage 3 step 5, Stage 4 step 1,
    Stage 5 step 5). Update the Playwright specs your phase doc names and run just those files
    (`npx playwright test <files>` in `aa-prototype/`, on your lane's ports). A test elsewhere that your
    change breaks is the join's to find and fix: note any you suspect under "For the merge".
  - The join runs the full gate once over the whole wave and fixes what is left.
  - Skip the Stage 5 review (steps 1, 4 and 5): the join reviews the wave's phases at once, with each
    phase doc's "Adversarial review" steer bullets.
  - Keep Stage 4 steps 2 and 3, briefly: one quick look at each changed screen against its design, and
    the phase's main flows clicked through yourself in the running app on your ports (its checklist
    items about tests and suites are the join's). Fix what doesn't work. Polish beyond "it works and
    matches the design" waits for the owner's test.
- **Ports:** your lane's own. Ignore any port lock in the skill or a phase doc: there is none between
  lanes. Never stop a server you didn't start. Run
  `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --stop-servers` at the
  end, as the skill says.
- **Screenshots, recipes, ATLAS and the demo guide:** as for every phase in this plan, don't touch them
  and never run the capture. The owner's sweep does them. Generated Playwright output under
  `aa-prototype/visual/.output` is never committed.
- **The plan page is the join's job.** Skip the skill's Stage 7 edits to `status.json` and
  `index.html`, and don't change ROADMAP's run order. Write your status file instead. Your final
  message to the owner ends `Next: <the next phase in this lane's queue>`, or
  `this lane has finished Wave <n>`.
- **`PERSIST_VERSION`:** bump it only as the phase doc says (52 and 55 expect to; 49 only if its doc's
  condition holds). If a merge meets another lane's bump, set it one past the higher of the two,
  keeping both comment lines and both migrate test cases, and write it in `notes.md`.
- **Your memory doesn't carry over.** Claude's memory is kept per account and per folder, so a
  worktree session starts without the owner's saved rules. The rules that matter are in this file, the
  phase doc, the skill and CLAUDE.md.

### Talking to the other lanes

Everything goes through `"$(git rev-parse --git-common-dir)/lanes/"`. That is the main checkout's
`.git/lanes/`, visible from every worktree and never committed.

- **`A.status`, `B.status` and `C.status`:** one line, overwritten at each change:
  `<date +'%F %T'> <phase> <started|checkpoint|complete|wave-done|waiting|blocked|joining|joined|done> <a few words>`.
- **`notes.md`:** append-only, newest at the bottom. Head each entry `## <date> Lane <X>, <phase>`.
  Write what the other lanes need before they merge your work:
  - the commit id of your `complete:`
  - any `PERSIST_VERSION` bump
  - renamed or removed types, fields, exports, helpers or `data-shot` hooks
  - routes you added or changed (the Contracts block, the Intake and Patients blocks, the People
    block), and any change to the Contract list screen
  - shared components or props you added (53's record components in Wave 3)
  - demo triggers you registered or re-pointed
  - seed ids you appended (write these at the phase start, before building)
  - tests the other lanes will see fail, and shared files you touched

  Read it at every phase start (step 4).
- Never wait or poll for another lane. If you need something from one, write it in `notes.md` and
  carry on, or stop as `blocked` and tell the owner.

## Joining a wave

When your last phase in the wave is complete, write `wave-done` in your status file, then follow the
part for your wave. Every join then runs "Checking a join", "Writing up a join" and "Fast-forwarding
`master`".

### Joining Wave 1

The **Contracts join** (`wave/1`) is done by whichever of Lanes A and B finishes second. (Wave 1 was
joined under the two-lane rules this file had then; this part stays as the record.)

1. Look for the other Contracts lane's last phase: Lane A looks for
   `git log lane/b --grep='^48 complete:' --oneline`; Lane B for
   `git log lane/a --grep='^49 complete:' --oneline`.
2. **Not there: you finished first.** Stop. Tell the owner: "Lane <X> finished Wave 1, on `lane/<x>`.
   Lane <Y> is still running and will do the join." Do not wait or poll.
3. **There: you finished second, so you join.** Claim it with `git branch wave/1 lane/<x>`. If that
   fails because the branch exists, another session is already joining: stop as in step 2.
   Otherwise write `joining` in your status file, `git switch wave/1`, `git merge lane/<y>`, then
   `git merge master` if `master` has moved since the wave began.

### Joining Wave 2

Lane A finishes last (53 comes after Lane B's 51, which 53 merged at its start), so Lane A joins.
- **Lane B,** when 51 is complete: write `wave-done` and stop. Tell the owner: "Lane B finished Wave 2,
  on `lane/b`. Lane A merges it at 53's start and does the join." Do not wait or poll.
- **Lane A,** when 53 is complete: claim it with `git branch wave/2 lane/a` (if that fails, another
  session is joining: stop), write `joining` in `A.status`, `git switch wave/2`, `git merge lane/b`
  (already merged at 53's start, so this should be a no-op; it catches any later Lane B commit), then
  `git merge master` if `master` has moved since the wave began.

### Joining Wave 3

The last of the three lanes to finish joins all three. Look for the other lanes' last phases:
`git log lane/a --grep='^54 complete:'`, `git log lane/b --grep='^56 complete:'` and
`git log lane/c --grep='^57 complete:'` (each `--oneline`).
- **Not all there:** stop. Tell the owner: "Lane <X> finished Wave 3, on `lane/<x>`. Lane <Y> (and
  <Z>) is still running; the last to finish does the join." Do not wait or poll.
- **All there:** claim it with `git branch wave/3 lane/<x>` (if that fails, another session is
  joining: stop), write `joining` in your status file, `git switch wave/3`, merge the other two lane
  branches one at a time, then `git merge master` if `master` has moved.

### Checking a join

- **The full gate, all green:**
  `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs` (typecheck, both
  builds, all of Vitest, verify-board, all Playwright) and `npm run lint` in `aa-prototype/`. The lanes
  ran a lighter gate, so fix any failure from any of the joined phases here, then re-run the gate.
  `master`'s Playwright suite carried failures from before 45 (`docs/BACKLOG.md`): don't count those
  as the wave's, but don't add to them.
- Seed pins, fingerprints and count tests are re-measured on the joined code, never added up.
- No hook was lost: `git diff master...HEAD -- aa-prototype | grep '^-.*data-'`, and account for every
  line.
- **In the running app on your ports, check where the lanes meet:**
  - Wave 1, the Contracts lanes (`/admin/contracts`):
    - The grouped list (47) still opens New contract (46), and `?holder=` and a Party's
      `?group=holder&in=<id>` carry the holder to the page; a new Contract lands on its page and shows
      in its group.
    - A Party's page (48) opens its Contracts in the grouped catalogue, and its New contract opens
      46's page for that holder.
    - Replace from a date (49) on a Contract: the replacement shows beside the old one in the grouped
      list; the to-do shows on the change date ("Reach the change date"); a late disable lists the
      Procedures from the change date.
    - The section's tabs (Contracts, Parties, Funding tags) and every route in the block load,
      including `/admin/contracts/new`.
    - The old links redirect: `/admin/masters?view=contracts`, `&contract=<id>`, `&holder=<id>`,
      `?view=parties` (and `&party=<id>`) and `?view=fundingTags`. Master data shows its "now in
      Contracts" line.
  - Wave 2, 50 to 52:
    - The rate and tier card (50) saves once, as one audited change, and never on a single click; the
      Anaesthetists list filters by tier.
    - Intake's Waiting for NHI tab (51) loads, `/admin/patients/waiting` redirects to it, and the
      Intake and Patients counts count each waiting row once, in Intake.
    - Make an anaesthetist inactive (52) on one who holds an anaesthetist-kind Party's Contracts:
      refused while they hold a List after the last day; after the day (the demo trigger) no Slots,
      no sign-in, their own Contracts disabled, and those show Disabled in the grouped Contract list and
      on their Contract pages; made active again, the Contracts are offered back, and a
      re-enabled Contract that a replacement (49) left active brings its to-do back.
  - Wave 2, 53: the People entry sits where Patients was, with its count (51's Waiting for NHI rows
    counted on Intake, not on People); the four tabs load,
    searched, filtered and paged; every old link in D100 redirects; Master data keeps Places and its
    pointer; every Contract page behaves as before (edit a card, save, cancel, the side panel).
  - Wave 3: each page (anaesthetist, surgeon, specialty, patient) saves one card at a time, each an
    audited change; the side panels' sections are one shared component, not three copies; no surgeon
    group remains anywhere (seed, store, screens, audit labels) while the surgeon-group Party stays;
    the Patients tab's Needs follow-up count is People's attention count; the People route block kept
    every lane's routes.
  - The demo triggers the joined lanes registered or re-pointed show on their screens only.
- **The review, once for the joined phases** (the lanes skipped theirs). Three Opus subagents
  (`model: opus`), read-only, over `git diff master...HEAD`, one per lens: bugs and correctness
  (guards, lifecycle, audit, determinism, and the wave's risky spots: in Wave 1 the late disable and the
  move of ticked Procedures; in Wave 2 the inactive anaesthetist's Contracts, the redirects and the
  unchanged Contract page; in Wave 3 the surgeon group removal and its migration), plan adherence
  (every work item and checklist item of the joined phases delivered), and the join (one lane's work
  lost in a conflict, a part built twice, a hook dropped, a route or tab lost from a route block,
  `PERSIST_VERSION` or a seed pin wrong, a private copy of a shared component). Give each the joined
  phase docs' "Adversarial review" steer bullets. Ask for findings that would stop something working
  or break a rule in CLAUDE.md, not polish. Verify each finding yourself, fix the confirmed ones, and
  re-run the full gate.

### Writing up a join

- In `docs/build-plan/PROGRESS.md`, under the joined phases' last entry, add a short
  `Wave <n> joined` note: the date, which lanes it took in, each conflict
  and how it was resolved, the re-measured Vitest and Playwright counts, and anything for the owner.
- **The owner's test list**, written only by the join that ends a tested group:
  - The Contracts join writes `docs/build-plan/TEST-45-49.md`: one walk through the app on 5173 that
    covers 45 to 49 in about 15 numbered steps, each with where to click, the seed record to use and
    what should happen. Draw it from the five phases' manual checklists and the join's checks; leave
    out what a test already proves. End it with "Decisions to look at": the five phases' "For the
    owner's review" lists merged into one short list, one line each.
  - Wave 3's join writes `docs/build-plan/TEST-50-57.md` the same way for 50 to 57 (about 20 steps),
    its "Decisions to look at" merged from all eight phases.
  - Wave 2's join writes no test list.
- **Mark the wave** in this file's "Waves" heading: "Current wave: Wave <next> (Wave <n> joined
  <date>)". After Wave 3's join: "Current wave: none (Wave 3 joined <date>)".
- **Update the plan page:** in `docs/build-plan/status.json`, add every joined phase to `done`, keep
  `in_progress` to phases still building, set `next` to the next wave's phases, and set
  `guidance.lanes` to the next wave's queues (from the table in "Waves"; remove `guidance.lanes` after
  Wave 3). Clear the joined phases from `guidance.safe`, `wait` and `parallel`, mark the next wave's
  first phases safe once its start condition holds, and write a `headline` saying what is on `master`
  and, after the Contracts join or Wave 3's, for the owner's test, with `headline_sub` linking the test
  list. Then `node requirements-board/agent/skills/update-build-plan/tools/build-index.mjs` from the
  worktree root, which must print no warnings.
- Commit with the subject `Wave <n> joined: ...`.

### Fast-forwarding `master`

1. `git -C "/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP" merge --ff-only <your wave branch>`.
   Git refuses rather than touch the owner's uncommitted changes.
   - If it refuses because `master` moved: merge `master` into your wave branch, re-run
     `phase-check.mjs --only typecheck,build,build-pwa,vitest,verify-board`, commit, and try again.
   - If it refuses because of the owner's uncommitted changes, stop. Tell the owner the exact command
     to run once they have committed.
   - If this session isn't allowed to write to the main checkout (a session that entered its worktree
     with `EnterWorktree` usually isn't), don't keep trying. Write
     `joined, master fast-forward pending the owner` in every status file and stop. Tell the owner to
     paste this into a Claude session in the main folder: "Finish the Wave <n> join: fast-forward
     master to <your wave branch> as docs/build-plan/LANES.md's 'Fast-forwarding master' says (merging
     master into it first if it moved), then bring the lane branches up to master as its step 2
     says."
2. **Bring your own lane branch up:** `git switch lane/<x>` then `git merge --ff-only master`. The
   other lanes pick `master` up at their next start (step 2 of "How a lane session runs"). From the
   main folder, a lane branch that is checked out in a clean worktree is brought up with
   `git -C <worktree> merge --ff-only master`.
3. Write `joined` in every status file of a lane this join took in, and append a `notes.md` entry
   naming the wave branch, the phases it took in and the next wave's queues. Tell the owner what
   `master` now holds (not pushed) and:
   - after the Contracts join: that 45 to 49 are ready to test on 5173 from
     `docs/build-plan/TEST-45-49.md`, and to paste Lane A's and Lane B's prompts for Wave 2;
   - after Wave 2's: to paste all three lane prompts for Wave 3;
   - after Wave 3's: that 50 to 57 are ready to test from `docs/build-plan/TEST-50-57.md`, and to paste
     into a main-folder session: "Tear down the build lanes as docs/build-plan/LANES.md's Tear down
     section says."

### Resolving conflicts

This applies at a sync (step 6) and at a join.

- **A file only one lane owns** shouldn't conflict. If it does, keep the owning lane's version and
  re-apply the other side's lines by hand, checked against that phase's work items.
- **Imports, index exports, the store barrel, the billing barrel, the audit labels, the demo trigger
  registry, the catalogue rows:** take the union, with no duplicates.
- **`types.ts`:** keep every lane's additions. If two touched one type, keep every set of fields.
- **A route block** (Contracts, Intake, Patients, People): keep every lane's routes, in the order the
  block had plus each lane's additions where it put them. On the Contract list screen, keep Lane B's
  version and re-apply Lane A's New contract target and header line.
- **53's shared record components:** keep every lane's props; where two changed one default, keep
  today's behaviour as the default and log it under "For the owner's review".
- **`PERSIST_VERSION`:** one past the higher number, with every comment line and every migrate case.
- **Tests and specs:** keep every lane's tests. Where two changed one assertion, make it hold for the
  joined behaviour.
- **`PROGRESS.md`:** every status row and every entry, in phase order. Keep every Decisions-log line
  and handoff list. Re-measure test counts after the merge.
- **`docs/DECISIONS.md` and `docs/BACKLOG.md`:** take the union. Where order is free, Lane A's comes
  first, then B's, then C's.
- **A hook** (`shot`, `data-shot`, `data-testid`, a row `data-*`): if any side kept it, it stays.
- **`status.json` and `index.html`:** take `master`'s, then regenerate at the join ("Writing up a
  join"). Lanes don't edit them.
- **Never** resolve by taking one side's whole file, and never drop one lane's work to make a conflict
  go away. If a conflict can't be resolved without changing what another lane built, resolve it the
  smallest way that keeps both behaviours, and log it under "For the owner's review".

## Tear down

Only after Wave 3's join, from a session in the main folder, once `master` holds `wave/3`
(`git branch --contains wave/3` lists `master`):

1. Check every worktree is clean (`git -C <worktree> status --short` empty). If one isn't, stop and
   tell the owner.
2. `git worktree remove` each lane's worktree.
3. `git branch -d lane/a lane/b lane/c` and every `wave/*` branch (`-d` refuses an unmerged branch: if
   it does, stop and tell the owner).
4. Remove `"$(git rev-parse --git-common-dir)/lanes/"`.
5. Mark this file closed with a line at the top ("Closed <date>: Wave 3 joined; later phases run in
   the main folder"), remove the `lanes` key's branches from `docs/build-plan/plan.config.json`, and
   commit both by path. Leave the port plumbing in place: it is harmless without a `.lane.env`.

Don't tear down after Wave 1 or 2: the lanes carry on into the next wave.

## The lane prompts

The prompts are in `lanes/lane-a.prompt.md`, `lanes/lane-b.prompt.md` and `lanes/lane-c.prompt.md`,
and on the plan page (`index.html`, "Start now": a **Copy Lane A prompt**, **Copy Lane B prompt** and
**Copy Lane C prompt** button; each queued phase's card copies its lane's prompt too). The owner pastes
each into its own session, usually started in the main checkout. The same prompt starts, resumes and
joins, in every wave: the session works out which. A phase's own kick-off prompt is what a lane session
follows inside its worktree; never paste a lane phase's own prompt into a session on `master`.
