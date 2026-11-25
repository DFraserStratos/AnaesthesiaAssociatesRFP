# Build lanes: Phases 46 to 49 in two worktrees

The owner's decision of 25 November 2026: once **Phase 45** (the Contracts section and the Contract
page) is built and committed on `master` as an ordinary session in the main folder, Phases 46 to 49 are
built by **two sessions at once**, each in its own git worktree (a **lane**), working through a queue
of two phases (one **wave**). When both lanes finish, the session that finishes second joins them,
checks the joined code and fast-forwards `master`. The owner then tests all four phases together on
`master`, and the lanes are torn down. The owner runs the lanes from two Claude accounts (`claude` and
`claude2`), so the sessions never talk to each other through Claude: everything they share goes
through git and a folder in the shared git directory, described below.

**This file overrides** the phase's kick-off prompt, the run-build-phase skill and CLAUDE.md wherever
they differ, for a lane session only. Phase 45, and any phase after 49, runs as an ordinary session in
the main folder and ignores this file.

## The lanes

| | Lane A | Lane B |
|---|---|---|
| Worktree | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneA` | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneB` |
| Branch | `lane/a` | `lane/b` |
| Ports (prototype, PWA, board) | 5273, 5274, 5280 | 5373, 5374, 5380 |
| Usually run by | `claude` | `claude2` |
| Theme | the Contract record: New contract, Replace from a date | the catalogue and the address book: grouping, Parties, Funding tags |

- The main checkout (`/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP`, branch
  `master`) is the owner's. Its servers hold 5173, 5174 and 5180. A lane never edits, builds or runs
  anything there. The one exception is the fast-forward at the join (below), a single git command.
- A lane belongs to its worktree, not to an account. Either account can resume either lane: all the
  state is in the worktree and in git.
- Each worktree holds a git-ignored `.lane.env` at its root (`AA_LANE`, `AA_PROTO_PORT`,
  `AA_PWA_PORT`, `BOARD_PORT`). `aa-prototype/laneEnv.ts` (imported by both Vite configs and the
  Playwright config), the board's `server/laneEnv.ts`, `phase-check.mjs` and the capture runner read
  it themselves, filling any variable not already set. So `npm run dev`, `npm run shots` and
  `phase-check` all run on the lane's own ports however the session was started, and the servers and
  Playwright workers they start inherit them. No port lock is needed. If `.lane.env` is missing, stop
  and tell the owner.
- **A session can start anywhere.** The owner usually starts both sessions in the main checkout. The
  lane prompt has the session switch into its worktree with the `EnterWorktree` tool (`path`, never
  `name`) before doing anything else, so every command and edit after that happens in the worktree.
- If the worktree has no `node_modules` (in `aa-prototype/`, `requirements-board/` or the root), run
  `npm run setup` from the worktree root first. `git status` must stay clean afterwards; if it does
  not, stop and tell the owner.

## Waves

Each lane runs its queue in order, one phase at a time. A phase is **complete on a lane** when the lane
branch holds a commit whose subject starts `<id> complete:`.

### Current wave: Wave 1 (the only one)

**It starts when Phase 45 is DONE on `master`:** its row in `docs/build-plan/PROGRESS.md` reads DONE
and its work is committed. A checkpoint after 45's first session is not enough.

| Lane | Queue | Sessions |
|---|---|---|
| A | 46, then 49 | 1 + 1 to 2 |
| B | 47, then 48 | 1 + 1 |

Why this split: 46 and 47 each need only 45. 49 needs 45 and 46, so it follows 46 in Lane A. 48 needs
45 and 47, so it follows 47 in Lane B. Neither lane needs anything the other builds in this wave.

**Who owns what in Wave 1.** Keep to your side, and the merges stay mechanical.

| | Owns |
|---|---|
| Lane A | The New contract page and its folder; `domain/billing/contractSimilarity.ts`; `apps/admin/flows/contractDraft.ts`; deleting `ContractEditSheet.tsx` and its test, its catalogue rows and `ContractPanelExample`, and moving the D23 `MUST_KEEP` pin; the shared `Card` (46's `step` variant); `store/contractReplaceActions.ts`; `domain/billing/contractHistory.ts`; the warning rule `replacedContractStillActive.ts`; `ReplaceContractSheet.tsx`; the Contract page's header and lines (45's page); 45's `disableFromISO`; the Admin Day to-do row (`WarningsToDo.tsx`, `RailWorkCard.tsx`, `RightRail.tsx`) |
| Lane B | The Contract list screen (45's moved file) and its grouping, index and paging; `domain/billing/contractGroups.ts`; `GroupRow` in `shared/table/cells.tsx`; `apps/admin/components/GroupIndex.tsx`; the shell's `contractGrouping` and `setContractGrouping`; `FULL_SCALE.pageSizes.contracts`; `domain/billing/partyContracts.ts`; the Parties and Funding tags tabs, `PartyPage.tsx`, `PartyPanel` and `PartyFormFields`; `masterViews.ts`, `view.ts`, `MasterData.tsx`, `chrome.tsx`, `LoadResultPanel.tsx`, `GoLiveLoadView.tsx`; the redirect helper in `AdminMastersRoute` (45's) |

- **Where they meet:**
  - **The Contract list screen** is Lane B's. Lane A touches it in two places only: 46 changes where
    its New contract button goes (to the new page, keeping `?holder=`), and 49 changes the one header
    line about dated changes. Change those lines and nothing else there. Lane B keeps the New contract
    button and its handler where 45 put it, and leaves that header line's wording to 49.
  - **`router.tsx`, the Contracts route block:** Lane A swaps the `new` route's element (46); Lane B
    adds `parties`, `parties/:partyId` and `tags` (48). Add your own routes; never reorder the block.
  - **The section's tab strip** (45's): Lane B adds the Parties and Funding tags tabs. Lane A adds no
    tab.
- **Files both lanes add to:** `domain/billing/index.ts` and `types.ts`, `domain/billing/contracts.ts`,
  `store/index.ts`, `shared/format.ts`, `shared/demoTriggers/registry.ts`,
  `src/apps/demo/catalogue/AdminCatalogue.tsx` and its example files, `specialtiesTags.test.tsx`, the
  Playwright specs in `aa-prototype/visual/` (`admin-phase07`, `admin-phase18a`,
  `contract-warnings-phase25a`, `overlays-u2` and others), `docs/build-plan/PROGRESS.md`,
  `docs/DECISIONS.md` and `docs/BACKLOG.md`. Add your own lines, rows, exports, tests and entries.
  Never rewrite, sort or re-wrap what is already there.
- If your work seems to need the other lane's side, don't build it there. Note it under "For the
  merge" in your progress entry, and in `notes.md`.

### Next waves

None. Wave 1 is the last: after its join, the lanes are torn down ("Tear down", below) and later phases
run in the main folder again.

## How a lane session runs

The owner pastes the same lane prompt every time (in `lanes/`). The session then does this.

1. **Check where you are.** After the lane prompt's `EnterWorktree` switch, `pwd` is your lane's
   worktree and `git branch --show-current` is your lane branch, or `wave/1` if you are the session
   doing the join. Otherwise stop and tell the owner. `cat .lane.env` shows your ports.
2. **Pick up `master`.** With a clean tree (no uncommitted changes to tracked files), run
   `git merge master`. It brings in Phase 45 and any plan or requirements updates the owner has
   committed. Then re-read this file: the merge may have changed it. Skip this step with a dirty tree
   (a phase stopped mid-way: you are resuming it).
3. **Is Phase 45 done?** If `docs/build-plan/PROGRESS.md` on your branch does not show 45 as DONE,
   stop. Write `waiting 45` in your status file and tell the owner: "Phase 45 isn't committed as DONE
   on master yet. Paste this lane's prompt again once it is."
4. **Read the lane state.** Read `"$(git rev-parse --git-common-dir)/lanes/"`: both status files and
   `notes.md`. Read `git log --oneline master..lane/a` and `master..lane/b`.
5. **Find your phase.** It is the first phase in your lane's queue under "Current wave" that has no
   `<id> complete:` commit on your branch.
   - If every phase in your queue is complete, go to "The join".
   - If the phase has `<id> checkpoint:` commits or uncommitted work in the worktree, you are resuming:
     the skill's resume path (Stage 0) applies.
   - Check every id in the phase's `depends_on` (in `docs/build-plan/plan.json`) is DONE in your
     branch's `PROGRESS.md`. If one is not (a re-plan can add one), stop: write `blocked` in your
     status file and tell the owner.
6. **Sync with the other lane, at a phase start only.** If the other lane has an `<id> complete:`
   commit your branch does not hold, merge it (`git merge <that commit>`) and resolve by "Resolving
   conflicts". Then make
   `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --only typecheck,build,build-pwa,vitest`
   green before you start. Never merge the other lane mid-phase, and never merge its work in progress.
7. **Build the phase.** Open its kick-off prompt (`docs/build-plan/phases/phase-<id>-*.prompt.md`) and
   follow it as if the owner had pasted it: load the run-build-phase skill and run all its stages,
   with the overrides below. Write `started` in your status file.

### Overrides for a lane session

- **Where:** only in your worktree, every path from its root. Never in the main checkout or in the
  other lane's worktree.
- **Commits are part of the job.** Commit on your lane branch only, staging by path (`git add <paths>`,
  never `-A` or `.`). Your worktree's index is your own, so stage and commit together.
  - At a two-session phase's checkpoint (49 may have one), once the gate is green: commit with the
    subject `<id> checkpoint: ...`.
  - When the phase is finished (every stage done, `PROGRESS.md` updated): commit with the subject
    `<id> complete: ...`. End the message with the attribution lines your session is given, if any.
  - Never push. Never amend, rebase or reset a commit the other lane or the owner made. Never delete a
    branch or a worktree.
- **No owner test between phases.** The ROADMAP rule that the owner tests each phase before the next
  starts is replaced, for 46 to 49, by one owner test of all four on `master` after the join. Build
  your next phase straight after the last one's `complete:` commit, in the same session if it has room
  or the next one. Put everything for the owner on the phase's "For the owner's review" list as usual.
- **Ports:** your lane's own. Ignore any port lock in the skill or a phase doc: there is none between
  lanes. Never stop a server you didn't start. Run
  `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --stop-servers` at the
  end, as the skill says.
- **Screenshots, recipes, ATLAS and the demo guide:** as for every phase in this plan, don't touch them
  and never run the capture. The owner's sweep does them. Generated Playwright output under
  `aa-prototype/visual/.output` is never committed.
- **The plan page is the join's job.** Skip the skill's Stage 7 edits to `status.json` and
  `index.html`, and don't change ROADMAP's run order. Write your status file instead. Your final
  message to the owner ends `Next: <the next phase in this lane's queue>`, or `this lane has finished
  Wave 1`.
- **`PERSIST_VERSION`:** bump it only as the phase doc says (none of 46 to 49 expects to). If a merge
  meets the other lane's bump, set it one past the higher of the two, keeping both comment lines and
  both migrate test cases, and write it in `notes.md`.
- **Your memory doesn't carry over.** Claude's memory is kept per account and per folder, so a
  worktree session starts without the owner's saved rules. The rules that matter are in this file, the
  phase doc, the skill and CLAUDE.md.

### Talking to the other lane

Everything goes through `"$(git rev-parse --git-common-dir)/lanes/"`. That is the main checkout's
`.git/lanes/`, visible from both worktrees and never committed.

- **`A.status` and `B.status`:** one line, overwritten at each change:
  `<date +'%F %T'> <phase> <started|checkpoint|complete|wave-done|waiting|joining|joined|blocked> <a few words>`.
- **`notes.md`:** append-only, newest at the bottom. Head each entry `## <date> Lane <X>, <phase>`.
  Write what the other lane needs before it merges your work:
  - the commit id of your `complete:`
  - any `PERSIST_VERSION` bump
  - renamed or removed types, fields, exports, helpers or `data-shot` hooks
  - routes you added or changed in the Contracts block, and any change to the list screen
  - demo triggers you registered or re-pointed
  - tests the other lane will see fail, and shared files you touched

  Read it at every phase start (step 4).
- Never wait or poll for the other lane. If you need something from it, write it in `notes.md` and
  carry on, or stop as `blocked` and tell the owner.

## The join

When your last phase in the wave is complete:

1. Write `wave-done` in your status file.
2. **Look for the other lane's last phase:** Lane A looks for
   `git log lane/b --grep='^48 complete:' --oneline`; Lane B for
   `git log lane/a --grep='^49 complete:' --oneline`.
3. **Not there: you finished first.** Stop. Tell the owner: "Lane <X> finished Wave 1, on `lane/<x>`.
   Lane <Y> is still running and will do the join." Do not wait or poll.
4. **There: you finished second, so you join.** Claim it with `git branch wave/1 lane/<x>`. If that
   fails because the branch exists, the other lane is already joining: stop as in step 3. Otherwise
   write `joining` in your status file, `git switch wave/1`, `git merge lane/<y>`, then
   `git merge master` if `master` has moved since the wave began.
5. **Check the joined code.**
   - The full gate, all green:
     `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs` (typecheck, both
     builds, all of Vitest, verify-board, all Playwright) and `npm run lint` in `aa-prototype/`.
   - Seed pins, fingerprints and count tests are re-measured on the joined code, never added up.
   - No hook was lost: `git diff master...wave/1 -- aa-prototype | grep '^-.*data-'`, and account for
     every line.
   - In the running app on your ports (`/admin/contracts`), check where the lanes meet:
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
     - The demo triggers both lanes registered or re-pointed show on their screens only.
   - One adversarial reviewer (Opus) on the join alone. Steer it at: one lane's work lost in a
     conflict, a part built twice, a hook dropped, a route or tab lost from the Contracts block,
     `PERSIST_VERSION` or a seed pin wrong on the joined code, a private copy of a shared component.
6. **Write it up.**
   - In `docs/build-plan/PROGRESS.md`, under the wave's last entry, add a short `Wave 1 joined` note:
     the date, each conflict and how it was resolved, the re-measured Vitest and Playwright counts,
     and anything for the owner.
   - Mark the wave finished in this file: "Current wave: none (Wave 1 joined <date>)".
   - Update the plan page: in `docs/build-plan/status.json`, every phase from 46 to 49 DONE in `done`,
     `in_progress` empty, `next` the next phase in `plan.json` if any, `guidance.lanes` removed,
     `guidance.safe`, `wait` and `parallel` cleared of 46 to 49, and a `headline` saying the four are on
     `master` for the owner's test. Then
     `node requirements-board/agent/skills/update-build-plan/tools/build-index.mjs` from the worktree
     root, which must print no warnings.
   - Commit with the subject `Wave 1 joined: ...`.
7. **Fast-forward `master`:**
   `git -C "/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP" merge --ff-only wave/1`.
   Git refuses rather than touch the owner's uncommitted changes.
   - If it refuses because `master` moved: merge `master` into `wave/1`, re-run
     `phase-check.mjs --only typecheck,build,build-pwa,vitest,verify-board`, commit, and try again.
   - If it refuses because of the owner's uncommitted changes, stop. Tell the owner the exact command
     to run once they have committed.
   - If this session isn't allowed to write to the main checkout (a session that entered its worktree
     with `EnterWorktree` usually isn't), don't keep trying. Write
     `joined, master fast-forward pending the owner` in both status files and stop. Tell the owner to
     paste this into a Claude session in the main folder: "Finish the Wave 1 join: fast-forward master
     to wave/1 as docs/build-plan/LANES.md's join step 7 says (merging master into wave/1 first if it
     moved), then tear the lanes down as its Tear down section says."
8. Write `joined` in both status files and append a `notes.md` entry. Tell the owner: `master` now
   holds Phases 46 to 49 (not pushed), ready to test on 5173; and to tear the lanes down, paste into a
   main-folder session: "Tear down the Contracts lanes as docs/build-plan/LANES.md's Tear down section
   says."

### Resolving conflicts

This applies at the sync (step 6) and at the join.

- **A file only one lane owns** shouldn't conflict. If it does, keep the owning lane's version and
  re-apply the other side's lines by hand, checked against that phase's work items.
- **Imports, index exports, the store barrel, the billing barrel, the audit labels, the demo trigger
  registry, the catalogue rows:** take the union, with no duplicates.
- **`types.ts`:** keep both lanes' additions. If both touched one type, keep both sets of fields.
- **The Contracts route block and the list screen:** keep both lanes' routes; on the list screen, keep
  Lane B's version and re-apply Lane A's New contract target and header line.
- **`PERSIST_VERSION`:** one past the higher number, with both comment lines and both migrate cases.
- **Tests and specs:** keep both lanes' tests. Where both changed one assertion, make it hold for the
  joined behaviour.
- **`PROGRESS.md`:** both status rows and both entries, in phase order (46, 47, 48, 49). Keep both
  sets of Decisions-log lines and handoff lists. Re-measure test counts after the merge.
- **`docs/DECISIONS.md` and `docs/BACKLOG.md`:** take the union. Where order is free, Lane A's comes
  first.
- **A hook** (`shot`, `data-shot`, `data-testid`, a row `data-*`): if either side kept it, it stays.
- **`status.json` and `index.html`:** take `master`'s, then regenerate at the join (step 6). Lanes
  don't edit them.
- **Never** resolve by taking one side's whole file, and never drop one lane's work to make a conflict
  go away. If a conflict can't be resolved without changing what the other lane built, resolve it the
  smallest way that keeps both behaviours, and log it under "For the owner's review".

## Tear down

Run from a session in the main folder, only once `master` holds `wave/1` (`git branch --contains
wave/1` lists `master`):

1. Check both worktrees are clean (`git -C <worktree> status --short` empty). If one isn't, stop and
   tell the owner.
2. `git worktree remove` each lane's worktree.
3. `git branch -d lane/a lane/b wave/1` (`-d` refuses an unmerged branch: if it does, stop and tell the
   owner).
4. Remove `"$(git rev-parse --git-common-dir)/lanes/"`.
5. Mark this file closed with a line at the top ("Closed <date>: Wave 1 joined; later phases run in
   the main folder"), and commit it by path. Leave the port plumbing in place: it is harmless without
   a `.lane.env`.

## The lane prompts

The prompts are in `lanes/lane-a.prompt.md` and `lanes/lane-b.prompt.md`, and on the plan page
(`index.html`, "Start now": a **Copy Lane A prompt** and a **Copy Lane B prompt** button; each queued
phase's card copies its lane's prompt too). The owner pastes Lane A's into a `claude` session and Lane
B's into a `claude2` session, both usually started in the main checkout. The same prompt starts,
resumes and joins: the session works out which. A phase's own kick-off prompt is what a lane session
follows inside its worktree; never paste one of 46 to 49's own prompts into a session on `master`.
