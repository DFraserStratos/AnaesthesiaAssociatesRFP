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

### Current wave: Wave 7

Wave 1 (Lane A 26, 27, 27a; Lane B 32d, 33) was joined on 18 November 2026, Wave 2 (Lane A 25a, 36;
Lane B 33a, 17b) and Wave 3 (Lane A 37, 38; Lane B 34, 35) on 19 November 2026, Wave 4 (Lane A
38b, 39; Lane B 42, 43) and Wave 5 (Lane A 39a, 41; Lane B 39b, 40) on 20 November 2026, and Wave 6
(Lane A 40a; Lane B 43a, 43b) on 23 November 2026; `master` holds all six
(`PERSIST_VERSION` 75).

| Lane | Queue | Sessions |
|---|---|---|
| A | U7 (alone) | as its phase doc says |
| B | nothing | |

Why this split: U7 (UI unification, the last U phase) needs every phase Wave 6 finished (40a, 43b and
phases already joined), and a U phase never runs beside a catch-up phase, so it runs alone. Lane A
takes it, as the "Next waves" table planned. 44 needs U7, so it runs alone afterwards.

**A wave of one lane.** There is no other lane to merge. When U7 is complete, the Lane A session does
"The join" itself: at step 2 there is no other lane's phase to look for, so it goes straight to step 4,
claims `wave/7` from `lane/a`, skips `git merge lane/b` (lane/b holds nothing lane/a lacks once both
are fast-forwarded to Wave 6's `master`), merges `master` if it moved, and carries on from step 5.
Lane B is not started for Wave 7: if its prompt is pasted, the session finds an empty queue, writes
`wave-done` in `B.status` and stops.

### Next waves (provisional)

The session that joins a wave checks the next one against `plan.json` as it stands then, and
rewrites "Current wave" above.

| Wave | Lane A | Lane B |
|---|---|---|
| 8 | 44 (alone) | |

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
   - Where the lanes meet, check in the running app on your ports. For Wave 7 (one lane): U7's migrated screens in all three apps, including 43b's support panel on the shared `SidePanel` (`underHarness`) and the PWA Help sheet, and 43a's InfoTips and first-run cards. (Wave 6's checks, done at its join: 40a's NHI lookup on the add-booking form 43a simplified, and on the Add NHI sheet; a looked-up NHI reusing the single record; sign-in and a framed Reset landing on the patient record route; 43b's help line on the PWA beside 40's and 41's stand-ins.) (Wave 5's checks, done at its join: 39a's payment run nets a
     39 negative invoice beside 39b's new events (a post-op event invoiced, then credited, nets in the
     next run); 41's prepayment cancellation and refund on a Booking whose patient 40 now requires an
     NHI for; 40's patient view and balance warning after a 39a run and a 41 refund; Load full-scale
     data (43) still loads, and its Ledger and Billing monitor timings hold, with 39a's runs and 40's
     patient view in the app.) (Wave 4's checks, done at its join: 43's full-scale load with 38b's
     events and 39's credits, a credit and rebill on a generated invoice; a Party edited in 42's Master
     data still bills its credit and rebill. Wave 3's: 37's monitor and Xero sim beside 34's matching screen; 38's web Accounts and dashboard after
     35's explicit save. Wave 2's: the seed's masters after 25a's and 17b's removals, 36's balance
     views beside 17b's changes, 33a's stubs on a List that 25a's warnings read. Wave 1's: a Booking
     from a hospital row given a prepaid Contract raises its prepayment for its payer; a Public Slot is
     never offered on the matching screen; Dr Sharma's Tue 14 Jul List still stages post-op.)
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
   - If the session isn't allowed to write to the main checkout (a session that entered its worktree
     with `EnterWorktree` usually isn't: that is what stalled Wave 1's join), don't keep trying. Write
     `joined, master fast-forward pending the owner` in both status files and stop. Tell the owner to
     paste this into a Claude session in the main folder: "Finish the Wave <n> join: fast-forward
     master to wave/<n> as LANES.md's join step 7 says (merging master into wave/<n> first if it
     moved), then fast-forward both lane branches." That session does it.
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
