# Build lanes: two worktrees, built in waves

The owner's decision of 18 November 2026: from Phase 26 on, the catch-up is built by **two sessions
at once**, each in its own git worktree (a **lane**), working through a short queue of phases (a
**wave**). When both lanes finish a wave, the session that finishes second joins them, checks the
joined code and fast-forwards `master`. The owner runs the lanes from two Claude accounts (`claude`
and `claude2`), so the sessions never talk to each other through Claude: everything they share goes
through git and a folder in the shared git directory, described below.

**This file overrides** the phase's kick-off prompt, the run-build-phase skill and CLAUDE.md wherever
they differ, for a lane session only. A phase doc's own "Running beside" or "If the owner runs it
beside" notes (17b and 32d have them) are replaced by this file: ignore their worktree folders, ports
and lock.

## The lanes

| | Lane A | Lane B |
|---|---|---|
| Worktree | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneA` | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneB` |
| Branch | `lane/a` | `lane/b` |
| Ports (prototype, PWA, board) | 5273, 5274, 5280 | 5373, 5374, 5380 |
| Usually run by | `claude` | `claude2` |
| Theme | billing: profile, prepayment, Contracts, money | schedule, intake and master data |

- The main checkout (`/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP`, branch
  `master`) is the owner's. Its servers hold 5173, 5174 and 5180. A lane never edits, builds or runs
  anything there. The one exception is the fast-forward at a join (below), which is a single git command.
- A lane belongs to its worktree, not to an account. Either account can resume either lane: all the
  state is in the worktree and in git.
- Each worktree holds a git-ignored `.lane.env` at its root (`AA_LANE`, `AA_PROTO_PORT`, `AA_PWA_PORT`,
  `BOARD_PORT`), written when the worktree was set up. The Vite configs and Playwright
  (`aa-prototype/laneEnv.ts`), the board's Vite config, `phase-check.mjs` and the capture runner read
  it themselves, filling any variable not already set. So `npm run dev`, `npm run shots`,
  `phase-check` and capture all run on the lane's own ports however the session was started, and the
  dev servers and Playwright workers they start inherit them. `portEnv` in `plan.config.json` and
  `board.config.json` names the variables. No port lock is needed. If `.lane.env` is missing, stop
  and tell the owner.
- **A session can start anywhere.** The owner usually starts both sessions in the main checkout. The
  lane prompt has the session switch into its worktree with the `EnterWorktree` tool (`path`, never
  `name`) before doing anything else, so every command and edit after that happens in the worktree.

## Waves

Each lane runs its queue in order, one phase at a time. A phase is **complete on a lane** when the
lane branch holds a commit whose subject starts `<id> complete:`.

### Current wave: Wave 1

| Lane | Queue | Sessions |
|---|---|---|
| A | 26, then 27, then 27a | 1 + 2 + 1 |
| B | 32d, then 33 | 2 + 2 |

Why this split: all five phases have every dependency built. 26, 27 and 27a are the plan's next three
in run order. 32d and 33 depend on nothing unfinished: the plan runs them after 25a and 17b by
preference, not dependency ("none needs another, any order"). 33's doc already copes without 27
("not guaranteed before 33"). 32d goes before 33 because 33 creates Lists in sessions, and it should
do so after Public has become a Slot status.

**Who owns what in Wave 1.** Keep to your side and the merges stay mechanical.

| | Owns |
|---|---|
| Lane A | The `Anaesthetist` type and its profile (bank details, HPI CPN mandatory, `gstPeriod` removed: `AnaesthetistRecord`, `AnaesthetistsView`, `AddAnaesthetistFlow`, `EditAnaesthetistSheet`, `mastersActions.ts`, web `AccountsScreen`'s GST period switch, the mobile and web profile, `ProfileRow`). Prepayment (`src/domain/billing` prepayment rules, the prepayment invoice and its pair, the outgoing-invoices approval screen, the AA setting, the AA Holding account, the Xero simulator's pairs, `OfficeBillingSetup`, `BillingCard`, `PricingSheet`, `PaidBySheet`, `ContractRail`'s Prepaid branch, `prepaymentDetail`'s removal) |
| Lane B | Slot statuses and List kinds (Public as a Slot status, the `public` List kind retired: `resolveDisplayStatus`, `statusColours.ts`, `recurringBookings.ts`, `recordedWindow.ts`, `DraftListSheet`, `AssignListFields`, `RecurringBookingSheet`, the Day grid, availability grid and calendars). Intake (import batches and rows, the matching screen, `src/domain/integrations`, `Booking.source`, the matcher, the no-NHI queue) |

- **Where they meet.** Booking and Procedure store actions: 33 creates Bookings only through 22a's
  existing creation path, while 27 adds its re-check to the Procedure, Contract and payer mutations.
  Neither rewrites the other's function; each adds its own lines. In the seed, 26 adds bank details,
  27 adds prepayment states, and 32d re-kinds public Lists (Dr Sharma's Tue 14 Jul List stays private,
  with the same id). Demo guide beats: 27 has S4 Beat 1, 33 has S1 Beat 1 and S4 Beat 4, 32d has S2.
- **Files both lanes add to:** `src/domain/types.ts`, the audit label files
  (`shared/audit/actionLabels.ts`, `fieldLabels.ts`, `auditNarrative.ts`), `src/domain/seed/index.ts`
  and the seed files, `store/mutate.ts`'s `ID_FORMATS`, the store barrel, `src/store/appStore.ts`
  (`PERSIST_VERSION` and its migrate test), `shared/demoTriggers/registry.ts`, the component
  catalogue (`src/apps/demo/catalogue/`) and its tests, the seed pin and golden tests,
  `docs/prototype-build/PROGRESS.md`, `requirements-board/requirements/capture/ATLAS.md` and the demo
  guide. Add your own lines, rows, exports and entries. Never rewrite, sort or re-wrap what is already
  there.
- If your work seems to need the other lane's side, don't build it there. Note it under "For the
  merge" in your progress entry, and in `notes.md` (below).

### Next waves (provisional)

The session that joins a wave checks the next one against `plan.json` as it stands then, and
rewrites "Current wave" above.

| Wave | Lane A | Lane B |
|---|---|---|
| 2 | 25a, then 36 | 33a, then 17b (17b needs 26, joined in Wave 1) |
| 3, likely | 37, then 38 | 34, then 35 |
| 4, likely | 38b, then 39 | 42, then 39b |
| Later | 39a, 40, 40a, 41, 43, 43a, 43b, then U7 (alone), then 44 (alone) | |

Rules for choosing a wave: every phase's `depends_on` is built or in an earlier wave (never in the
other lane's queue for the same wave). 25a keeps to Lane A, because it edits 25's lock snapshot and
22's holder layout, and nothing else in billing runs beside it. A U phase never runs beside a catch-up
phase: U7 and 44 each run alone, one lane, as a wave of their own. Balance the lanes in sessions where
the dependencies allow.

## How a lane session runs

The owner pastes the same lane prompt every time (the end of this file). The session then does this.

1. **Check where you are.** After the lane prompt's `EnterWorktree` switch, `pwd` is your lane's
   worktree and `git branch --show-current` is your lane branch, or `wave/<n>` if you are the session
   doing the join. Otherwise stop and tell the owner. `cat .lane.env` shows your lane's ports (see
   "The lanes").
2. **Pick up `master`.** With a clean tree (no uncommitted changes to tracked files), merge in what
   `master` has gained: `git merge master`. It is a fast-forward after a join. Otherwise it brings in
   the owner's requirements or plan updates. Then re-read this file: the merge may have changed it.
   Skip this step with a dirty tree (a phase stopped mid-way: you are resuming it).
3. **Read the lane state.** Read `"$(git rev-parse --git-common-dir)/lanes/"`: both status files and
   `notes.md`. Read `git log --oneline master..lane/a` and `master..lane/b`.
4. **Find your phase.** It is the first phase in your lane's queue under "Current wave" that has no
   `<id> complete:` commit on your branch.
   - If every phase in your queue is complete, go to "The join".
   - If the phase has commits (`<id> checkpoint:`) or uncommitted work in the worktree, you are
     resuming: the skill's resume path (Stage 0) applies.
   - Check every id in the phase's `depends_on` (in `plan.json`) is DONE in your branch's
     `PROGRESS.md`. If one is not (a re-plan can add one), stop: write `blocked` in your status file
     and tell the owner.
5. **Sync with the other lane, at a phase start only.** If the other lane has a `<id> complete:`
   commit your branch does not hold, merge it (`git merge <that commit>`) and resolve by "Resolving
   conflicts". Then make `npm run build`, `npm run build:pwa` and `npx vitest run` green before you
   start. Never merge the other lane mid-phase, and never merge its work in progress.
6. **Build the phase.** Open its kick-off prompt (`phases/phase-<id>-*.prompt.md`) and follow it as if
   the owner had pasted it: load the run-build-phase skill and run all its stages, with the overrides
   below. Write `started` in your status file.

### Overrides for a lane session

- **Where:** only in your worktree, every path from its root. Never in the main checkout or in the
  other lane's worktree.
- **Commits are part of the job.** This replaces the skill's "nothing is committed". Commit on your
  lane branch only, staging by path (`git add <paths>`, never `-A` or `.`). Your index is your own,
  so stage and commit together.
  - At a two-session phase's checkpoint, once the gate is green: commit with the subject
    `<id> checkpoint: ...`.
  - When the phase is finished (Stages 4 to 6 done, `PROGRESS.md` updated): commit with the subject
    `<id> complete: ...`. End the message with the attribution lines your session is given, if any.
  - Never push. Never amend, rebase or reset a commit the other lane or the owner made. Never delete a
    branch or a worktree.
- **Ports:** your lane's own (see "The lanes"). Ignore the skill's and any phase doc's port lock
  (`phase-ports.lock`): there is none between lanes. Never stop a server you didn't start.
  `node T/phase-check.mjs --stop-servers` at the end, as the skill says.
- **Captures are not committed on a lane branch.** Two branches rewriting the same PNGs cannot be
  merged. Run `phase-check --capture <IDs>` for your phase's recipes and look at the shots. Then
  restore the generated files: `git checkout -- requirements-board/requirements/assets
  requirements-board/requirements/capture/REPORT.md`, and delete any new untracked image under
  `assets/` (`git clean -n` first, then `git clean -f <those paths>`). Skip Stage 5's final
  `--capture all`: the join runs it once on the joined code. Recipe and ATLAS edits are text: commit
  them.
- **The plan page is the join's job.** Skip the skill's Stage 7 edits to `status.json` and
  `index.html`, and don't change ROADMAP's run order. Instead, write your status file. Your final
  notes still go to the owner, ending with `Next: <the next phase in this lane's queue>, or this lane
  has finished Wave <n>`.
- **`PERSIST_VERSION`:** bump it as the phase doc says. When a merge meets the other lane's bump,
  set it one past the higher of the two, keeping both comment lines and both migrate test cases.
- **Your memory doesn't carry over.** Claude's memory is kept per account and per folder, so a
  worktree session starts without the owner's saved rules. The rules that matter are in this file,
  the phase doc, the skill and CLAUDE.md.

### Talking to the other lane

Everything goes through `"$(git rev-parse --git-common-dir)/lanes/"`, which is the main checkout's
`.git/lanes/` and visible from both worktrees.

- `A.status` and `B.status`: one line, overwritten at each change:
  `<date +'%F %T'> <phase> <started|checkpoint|complete|wave-done|joining|joined|blocked> <a few words>`.
- `notes.md`: append-only, newest at the bottom. Each entry is headed `## <date> Lane <X>, <phase>`.
  Write what the other lane needs before it merges your work: a renamed type or field, a changed
  shared helper, a seed id that moved, a test it will see fail. Read it at every phase start (step 3).
- Never wait or poll for the other lane. If you need something from it, write it in `notes.md` and
  carry on, or stop as `blocked` and tell the owner.

## The join

When your last phase in the wave is complete:

1. Write `wave-done` in your status file.
2. **Look for the other lane's last phase:** `git log <other lane branch> --grep='^<its last id>
   complete:' --oneline`.
3. **Not there: you finished first.** Stop. Tell the owner: "Lane <X> finished Wave <n>, on
   `lane/<x>`. Lane <Y> is still running and will do the join." Do not wait or poll.
4. **There: you finished second, so you join.** Claim it with `git branch wave/<n> lane/<x>`. If
   that fails because the branch exists, the other lane is already joining: stop as in step 3.
   Otherwise write `joining` in your status file, `git switch wave/<n>`, `git merge lane/<y>`, then
   `git merge master` if `master` has moved since the wave began.
5. **Check the joined code.** Use the full `node T/phase-check.mjs` (typecheck, both builds, Vitest,
   verify-board, Playwright), all green. Then:
   - The seed holds both lanes' pins. Seed pin and fingerprint tests are re-measured on the joined
     seed, never added up. The S1 to S5 golden tests pass.
   - No hook was lost: `git diff master...wave/<n> -- aa-prototype | grep '^-.*data-'`, and account
     for every line.
   - Where the lanes meet, check in the running app on your ports. For Wave 1: a Booking created from
     a hospital row (33) and then given a prepaid Contract (27) raises its prepayment invoice for its
     payer. A Public Slot (32d) is never offered as a free session on 33's matching screen. Dr
     Sharma's Tue 14 Jul List still stages the post-op scenario.
   - Capture: `phase-check --capture` for every recipe either lane's phases list, look at the shots,
     then one `node T/phase-check.mjs --capture all`. Commit the images, `REPORT.md` and ATLAS this
     time.
   - One adversarial reviewer (Opus) on the join alone. Steer it at: one lane's work lost in a
     conflict, a part built twice, a hook dropped, `PERSIST_VERSION` or a seed pin wrong on the joined
     seed.
6. **Write it up.**
   - In `PROGRESS.md`, under the wave's last entry, add a short `Wave <n> joined` note: the date,
     each conflict and how it was resolved, the re-measured Vitest, Playwright and capture counts,
     and anything for the owner.
   - Re-read every phase's "Demo guide updates" against the joined app.
   - Choose the next wave by "Rules for choosing a wave", from `plan.json` as it is now. Rewrite
     "Current wave" in this file, and the "Next waves" table if it changed.
   - Update the plan page: `status.json` (every phase in the wave DONE, `next.phases` the first phase
     of each lane's new queue, `guidance.parallel` naming the new wave's two queues, `safe` those two
     phases, `wait` the rest of the queues, `guidance.lanes` each lane's new `queue`), then `node P/build-index.mjs`, which must print no
     warnings.
   - Commit with the subject `Wave <n> joined: ...`.
7. **Fast-forward `master`:** `git -C "/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP"
   merge --ff-only wave/<n>`. Git refuses rather than touching the owner's uncommitted changes.
   - If it refuses because `master` moved: merge `master` into `wave/<n>`, re-run `phase-check
     --only typecheck,build,build-pwa,vitest,verify-board`, commit, and try again.
   - If it refuses because of the owner's uncommitted changes, stop. Tell the owner the exact
     command to run once they have committed.
   - Then move your own lane branch on: `git switch lane/<x> && git merge --ff-only master`. The other
     lane picks it up at its next start (step 2).
8. Write `joined` in both status files (`<n> joined, next <its first phase>`) and append a `notes.md`
   entry. Tell the owner: `master` now holds Wave <n> (not pushed), the next wave's two queues, and
   that pasting each lane's prompt again starts it.

### Resolving conflicts

This applies at the sync (step 5) and at the join.

- **A file only one lane owns** shouldn't conflict. If it does, keep the owner's version and re-apply
  the other side's lines by hand, checked against that phase's work items.
- **Imports, index exports, the store barrel, `ID_FORMATS`, the audit labels, the trigger
  registry:** take the union, with no duplicates.
- **`types.ts` and the seed index:** keep both lanes' additions. If both touched one type, keep both
  sets of fields.
- **`PERSIST_VERSION`:** one past the higher number, with both comment lines and both migrate cases.
- **Catalogue files and tests, ATLAS.md, the demo guide:** take the union. Where order is free,
  Lane A's comes first. A minimum row count takes the larger number.
- **PROGRESS.md:** both status rows and both entries, in phase order. Keep both sets of
  Decisions-log lines and handoff lists. Re-measure test counts after the merge.
- **A hook** (`shot`, `data-shot`, `data-testid`, `data-validation-*`, a row `data-*`): if either
  side kept it, it stays.
- **`status.json` and `index.html`:** take `master`'s, then regenerate at the join (step 6). Lanes
  don't edit them.
- **Never** resolve by taking one side's whole file, and never drop one lane's work to make a
  conflict go away. If a conflict can't be resolved without changing what the other lane built,
  resolve it the smallest way that keeps both behaviours, and log it under "For the owner's review".

## The lane prompts

The prompts are in `lanes/lane-a.prompt.md` and `lanes/lane-b.prompt.md`, and on the plan page
(`index.html`, "Start now": a **Copy Lane A prompt** and a **Copy Lane B prompt** button, and the
same button on each queued phase's card). The owner pastes Lane A's into a `claude` session and
Lane B's into a `claude2` session, both usually started in the main checkout. Each prompt names its
worktree, branch and ports, has the session switch into the worktree with `EnterWorktree`, then
sends it here. The same prompt starts, resumes and joins: the session works out which.

The joining session keeps `status.json`'s `guidance.lanes` up to date (each lane's `queue` for the new
wave) when it updates the plan page. A phase's own "Copy kick-off prompt" in the full phase list is
for a single session on `master` only: never paste one into a lane.
