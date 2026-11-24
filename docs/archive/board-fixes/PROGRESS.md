# Board fixes: shared progress log

Read in full before execution; update the verified result last. One writer at a time.

## Binding conventions and accepted constraints

1. Source of truth: [FINDINGS.md](FINDINGS.md) (R-01 to R-164, A-1 to A-10). Proposed fixes there are
   options, not mandates; the phase SPEC states the required outcome.
2. Every owned finding ends with one disposition: **Fixed** (regression test where practical),
   **Not reproducible at HEAD** (evidence), **Won't fix** (user accepted, reason), or **Moved**
   (named owner, recorded here and in both SPECs).
3. Existing stack only (Vite, React 18, zustand, @xyflow/react, TypeScript, Node >= 22.18, Vitest,
   Playwright). New dependencies need a recorded reason.
4. Visual changes follow `requirements-board/DESIGN.md`. Board code, scripts and skills stay
   project-generic. The About page stays in step with the skills.
5. Each phase bumps the board version (`requirements-board/package.json` and its lock file) and adds
   a `CHANGELOG.md` entry: minor for behaviour a user or agent can see, patch otherwise.
6. Finish green: `npm run verify:board` from the repo root. Touched Playwright specs pass on a free
   port (never 5173, 5174, 5180 or 5181). Until B12 adds them to `verify:board`, a phase that touches
   `agent/` also runs the tools' `node --test` suites.
7. Fixes do not change requirement content. Any catalogue data migration is shown to the user
   before it runs and leaves `npm run check` green.
8. Agent-tool changes stay backward compatible with the live catch-up plan (lanes in other
   worktrees), or ship with a migration the plan's owner accepts.
9. Git: commit and merge, never push. Stage by path at commit time only; never stage mid-phase
   (`mv`/`rm`, not `git mv`/`git rm`). Commit only this phase's files.
10. App phases run one at a time in the serial order; B12 and B13 may run in parallel worktrees
    (see PLAN.md "Build order").
11. **Touch rights:** the phase owning a finding delivers its whole fix, making minimal edits in other
    phases' files where needed and naming them in its entry. The shared-files table in PLAN.md is a
    guide, not a fence.
12. **Doc lines:** a phase updates the doc lines (README, SCHEMA, About, DESIGN, SKILL.md) that describe
    behaviour it changes and lists them under "Doc facts" in its entry; B14 does the whole-file pass.
13. **Proof fails first:** every regression proof must fail on the code before the fix and pass
    after it (agent-tool phases included).
14. **Worktree versions:** B12 and B13 take their board version at merge time (master's version plus
    their bump; CHANGELOG entry on top; lock file regenerated with `npm install`).
15. **Light phase review** (accepted decision 14; replaces the review step in every SPEC's execution
    obligations and BUILD-BOOK Section 5's three-reviewer minimum). After implementation and initial
    verification, launch **two fresh reviewer subagents on Sonnet** (`model: sonnet`), in parallel,
    given the SPEC, the owned findings and the diff, not the session's conclusions:
    - **Reviewer 1, completeness and correctness:** every owned finding and SPEC acceptance item is
      met, and the changed code has no bugs, edge-case failures or tests that do not prove their claim.
    - **Reviewer 2, quality plus the phase's lens** (security, data integrity and so on, as named in
      the kick-off prompt).
    If the phase's diff is small (under about 300 changed lines, tests excluded), **one** Sonnet
    reviewer covering both briefs is enough. The session verifies every finding itself against the
    code (no separate verifier agents), fixes confirmed issues, adds missing regression tests and
    reruns the checks. No further reviewers unless a finding cannot be settled from the code; then at
    most one more, recorded with its reason. B15 keeps its three closing lenses (B15-REQ-14), on
    Sonnet.
16. **Programme branch** (accepted decision 15). All programme work, code and these planning docs
    alike, is committed to the local branch **`board-fixes`**, never to master.
    - **Where:** its worktree `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-board`. A phase session switches into it with the `EnterWorktree`
      tool (`path`, never `name`) before doing anything else. Its git-ignored `.lane.env` gives
      its ports (prototype 5473, PWA 5474, board 5480). The main checkout stays the owner's (master;
      5173, 5174, 5180), and the catch-up lane worktrees are untouched.
    - **Keeping current:** at phase start, if master has commits that `board-fixes` lacks, run
      `git merge master` in the worktree first (merge, never rebase), so the phase builds on the
      current board and catalogue. Resolve conflicts (on the board version, keep the higher version
      and put the phase's CHANGELOG entry on top), keep `verify:board` green, and note the merge in
      the phase entry.
    - **B12 and B13** each work in their own worktree on a branch made from `board-fixes`, set up
      ahead of time by the owner's planning session (installed, clean tree, ports checked), after the
      `worktree-lanes` skill:

      | | B12 | B13 |
      |---|---|---|
      | Worktree | `AnaesthesiaAssociatesRFP-board-B12` | `AnaesthesiaAssociatesRFP-board-B13` |
      | Branch | `board-fixes-b12` | `board-fixes-b13` |
      | Ports (prototype, PWA, board) in its `.lane.env` | 5573, 5574, 5580 | 5673, 5674, 5680 |

      A B12 or B13 session runs like this. The same kick-off prompt starts, resumes and finishes it.
      1. **Get in.** Switch into its own worktree with `EnterWorktree` (`path`, never `name`); check
         `git branch --show-current` and `cat .lane.env`. If the worktree is missing, stop and tell
         the owner. Never edit, build or run anything in the main checkout, the programme worktree
         or the other one's worktree, except the single fast-forward in step 5.
      2. **Catch up, at start and on every resume.** With a clean tree (no uncommitted changes to
         tracked files), run `git merge board-fixes` (merge, never rebase), resolve as in step 4, and
         make `verify:board` green before building. If master has commits your branch lacks, `git merge
         master` too, as the serial phases do (B12 needs the live plan's current files). Skip this with
         a dirty tree: a session stopped
         mid-way and you are resuming it.
      3. **Commit names.** At a checkpoint in a multi-session run, with `verify:board` green, commit
         `<id> checkpoint: ...`; when the phase is finished, with its PROGRESS entry and PHASE STATUS
         line written, commit `<id> complete: ...` (`B12 complete: ...`). These are how a later
         session tells start, resume and finish apart. If the branch already holds `<id> complete:`,
         only step 5 is left.
      4. **Merge on your own branch.** Before finishing, merge `board-fixes` into your branch once
         more and resolve every conflict there, never in the programme worktree: the board version
         is one minor bump past `board-fixes`' current version, the CHANGELOG entry goes above the
         newest one, the lock file is regenerated with `npm install` in `requirements-board/`, the
         `verify` script is merged by hand, and PROGRESS and the PHASE STATUS block keep both sides'
         lines. Make `verify:board` green, then commit `<id> complete: ...`.
      5. **Fast-forward `board-fixes`, one git command.** If `git -C <programme worktree> status
         --porcelain --untracked-files=no` is empty, run `git -C <programme worktree> merge --ff-only
         board-fixes-<id>`. If it refuses because `board-fixes` moved, go back to step 4 and try once
         more. If the programme worktree has uncommitted work (a serial phase is mid-way), or this
         session is not allowed to write there (a session that entered its worktree with
         `EnterWorktree` usually is not), do not keep trying: stop and give the owner this sentence to
         paste into a session in the programme worktree: "Fast-forward board-fixes to
         board-fixes-<id> as PROGRESS convention 16 step 5 says." Never delete the branch or the
         worktree; the owner tears them down.

      In convention 14, PLAN.md and the B12 and B13 specs, "master's version" means `board-fixes`'
      version, and "merged into master" means fast-forwarded into `board-fixes` as above.
    - **Into master:** `board-fixes` merges into master once, after B15 closes, or earlier only when
      the owner asks (for example to give the live lanes B12's fixes). The board version is settled
      at that merge as in convention 14. Master's `docs/board-fixes/index.html` is a pointer page to
      this worktree; at that merge, take this branch's version of it. Until then the live catch-up plan keeps using master's board
      and tools, which also keeps convention 8 safe.
    - Never push.
17. **The plan page names the next phase.** `index.html` is built once; its only live part is the
    **PHASE STATUS** block near the top of its script. The session that finishes a phase adds or
    updates its entry there (`status: 'COMPLETE'`, the date, a one-line note; `'IN PROGRESS'` is
    allowed while a phase runs) in the same commit as its PROGRESS entry. From that block the page
    works out the progress tiles, the ticks on the map and order strip, the status table and the
    "Next up" banner, and opens on the next phase. Edit nothing else in the page by hand.

## Phase ownership and sequencing gates

See [PLAN.md](PLAN.md) for territories, the shared-files order and the build order.

Serial (app): B01, B02, B03, B04, B08, B05, B07, B06, B09, B10, B11, B14, B15.
Agent tools in parallel: B12 (after B02), B13 (REQ-07b after B04); both before B14.

## Phase status

| Phase | Outcome | Status | Planning/build gate | Notes |
|---|---|---|---|---|
| B01 | Origin security | COMPLETE | D-01 and B01-Q1 to Q3 recorded (accepted decision 13) | 2026-11-19, board 1.13.0; R-35 Won't fix (warned instead), user's choice |
| B02 | Status identity | COMPLETE | D-02 and B02-Q3 to Q6 recorded (accepted decision 16); no migration needed | 2026-11-19, board 1.14.0; R-01 and R-07 board halves delivered (B06, B12 close); A-2 confirmed and fixed |
| B03 | Load resilience | COMPLETE | D-06 and B03-Q2, Q3 recorded (accepted decision 17) | 2026-11-19, board 1.15.0; all 14 findings fixed; issue-surface contract in the entry |
| B04 | One rule, one helper | COMPLETE | D-03 and B04-Q1 to Q3 recorded (accepted decision 18) | 2026-11-19, board 1.16.0; all 18 findings fixed; D-03 contract for B13 in the entry |
| B08 | Git history reader | COMPLETE | D-07, D-05 with B05-Q2/Q3, B08-Q1 to Q3, Q5, Q6 recorded (accepted decision 19) | 2026-11-19, board 1.17.0; all 10 findings fixed; deletion bound and contracts for B05 and B09 in the entry |
| B05 | Server write model | COMPLETE | D-04, B05-Q5, Q6 recorded (accepted decision 20); D-05 recorded (decision 19) | 2026-11-19, board 1.18.0; all 7 findings fixed; R-45 and R-111 server halves delivered (B06 closes); write protocol for B07 and B06 in the entry |
| B07 | Store sync and layout | COMPLETE | D-10, B07-Q5, Q6 recorded (accepted decision 21) | 2026-11-19, board 1.19.0; all 6 findings fixed; delivery shape, D-10 signal and unsaved-moves signal for B06, B09, B10, B11 in the entry |
| B06 | Edit sheets and Settings | COMPLETE | B06-Q2 to Q5 and D-04e retirement recorded (accepted decision 22) | 2026-11-19, board 1.20.0; all 16 findings fixed; Q4 lock-out added scope; whole-record and base-less config writes retired |
| B09 | Diff and history UI | COMPLETE | B09-Q2 to Q4 and the Open rule recorded (accepted decision 23) | 2026-11-20, board 1.21.0; all 13 findings fixed; Diff count can rise (stricter minor rule); journal gains `seen` lines (additive) |
| B10 | Artifact viewers | COMPLETE | after B01, B03, B04, B07; D-01c, B01-Q2 and D-10 recorded; B10-Q2, Q3 (accepted decision 24) | 2026-11-20, board 1.22.0; all 10 findings and the timeline label fixed; workers and object URLs bounded (1 and 0 after 10 rounds, were 40 and 40) |
| B11 | Board canvas and views | COMPLETE | after B03, B05, B07; D-06 recorded; B11-Q1 to Q5 recorded (accepted decision 25) | 2026-11-20, board 1.23.0; all 13 findings fixed; lane merge on B05's route; D-04e's last legacy shape (base-less lane lists) retired |
| B12 | Build-plan tools | COMPLETE | after B02; D-08 and B12-Q3, Q6 recorded (accepted decision 28); D-03 not needed | 2026-11-20, board 1.25.0; all 15 findings fixed, R-07 closed; A-4 and A-10 confirmed and fixed; lanes read on master (migration at the master merge) |
| B13 | Consistency and linking tools | COMPLETE | REQ-07b after B04 (D-03, landed); B13-Q1 to Q5 recorded (accepted decision 27) | 2026-11-20, board 1.24.0; all 14 findings fixed; stage 1 parse error found and fixed; new agent suites for B12 to add to verify:board |
| B14 | Scripts, kit and docs | COMPLETE | D-09 and B14-Q1 to Q5 recorded (accepted decision 29) | 2026-11-20, board 1.26.0; all 16 findings fixed; the exported kit passes its own check, typecheck, Vitest and region sweep |
| B15 | Closing audit | COMPLETE | B15-Q2 to Q5, Q7 recorded (accepted decision 30) | 2026-11-20, board 1.26.1; 164 of 164 dispositions verified, A-1 to A-10 hold, no regression found; **programme complete** (review/CLOSING-REVIEW.md) |

**Programme COMPLETE (2026-11-20, B15).** Every finding has a verified disposition; deferred follow-up and
manual acceptance owed are listed in `review/CLOSING-REVIEW.md` section 7.

## Deferred decisions

Programme-level decisions. Each SPEC's own questions (`Bnn-Qn`) are listed in its "Deferred
decisions" section and resolved in that phase's planning.

| ID | Question / source gap | Owner phase | Depends on this | Resolve before | Boundary / acceptance impact | Status / answer |
|---|---|---|---|---|---|---|
| D-01 | Origin security model (fs.deny vs normalisation, CORS, SVG CSP, write token) | B01 | B10 | B01 build | B10's link handling; whether B01-REQ-10 applies | **Accepted 2026-11-19** (accepted decision 13): deny rule and normalisation; CORS off plus cross-site refusal; no page CSP; no write token |
| D-02 | Status registry format, recode versioning, migration; plan-tool readability | B02 | B06, B12, B14 | B02 build | Settings UI, plan-tool status rule, SCHEMA and starter docs; whether B02 touches `catalogueDiff.ts` | **Accepted 2026-11-19** (accepted decision 16): no-overlap recodes; removed statuses under `removedStatuses` in `board.config.json`; no migration; `catalogueDiff.ts` untouched |
| D-03 | How agent `.mjs` tools share `shared/*.ts` rules, including the note-cite resolution rule | B04 | B12, B13 | B04 build (and before B12 builds if needed) | B13-REQ-07b (R-141) shape; parity tests | **Accepted 2026-11-19** (accepted decision 18): direct import of `shared/*.ts` from the catalogue path; not in the workflow runtime or generated pages |
| D-04 | Write protocol (patch + base rev vs three-way merge; conflict reply; in-place YAML scope; config writes) | B05 | B06, B07 | B05 build | All client save flows; one-line-diff convention if items are edited in place | **Accepted 2026-11-19** (accepted decision 20): patch + base rev + optional base values, merged when nothing overlaps; `collisions` and `blocked` in the 409; in place for every record kind; config bases per section; lane route with a lane-list base |
| D-05 | ID reuse rule: SCHEMA "never reused" vs deliberate documented reuse (A-1, R-54); with B05-Q2/Q3 | B05 (user) | B08, B14 | B08 build (planning-only gate in a B05 planning conversation) | SCHEMA text; journal and history handling; possible deleted-ID list (data migration) | **Accepted 2026-11-19** (accepted decision 19): reuse stays; a restore continues its history; journal cut only at a committed deletion |
| D-06 | Bad-data issue surface and error-boundary recovery | B03 | B06, B10, B11 | B03 build | How later phases report bad data | **Accepted 2026-11-19** (accepted decision 17): panel in place and a "This page" group in the pill; auto-retry on catalogue change; copyable details; page-wide error capture; repaired storage mentioned |
| D-07 | Git reader contract (cache key/bounds, SHA-256, unstaged moves, deletion and rename bounds) | B08 | B05, B09 | B08 build | Timeline and diff inputs; R-54 history cut | **Accepted 2026-11-19** (accepted decision 19): HEAD + index identity keys, bounded LRUs, hybrid clean-form names, unchanged unstaged moves followed, full lists with `deleted` markers |
| D-08 | Lane-aware plan state on master | B12 | catch-up lanes | B12 build | update-build-plan behaviour while lanes run | **Accepted 2026-11-20** (accepted decision 28): read the configured lane branches' commits and progress rows, with a guard when lanes are declared but not configured |
| D-09 | Kit export source and target refusal rules | B14 | none | B14 build | Export behaviour and docs | **Accepted 2026-11-20** (accepted decision 29): HEAD by default, `--uncommitted` for trials (tracked files only); a marker with file hashes, exact match or refused; no `--force` |
| D-10 | Asset version and change signal (event and URL token) | B07 | B09, B10 | B07 build | R-96 and R-104 consumers | **Accepted 2026-11-19** (accepted decision 21): an `assets` entry on the batched delivery and every token in the snapshot; token = git blob hash; `?v=<token>` |

## Accepted decisions

- 2026-11-18, orchestrator (programme structure, not product behaviour):
  1. **Touch rights and doc lines** conventions adopted (conventions 11 and 12), so that one owner
     delivers each fix without a fence of file ownership.
  2. **Serial app order** B01, B02, B03, B04, B08, B05, B07, B06, B09, B10, B11, B14, B15; B08 moved
     before B05 (R-54 needs B08's deletion bound); B07 before B06 (event shape first).
  3. **Re-homed adjudications:** A-2 to B02 (recode), A-4 and A-10 to B12 (build-index, status
     normalisation). B15 confirms all of A-1 to A-10.
  4. **Split deliveries, single owners:** R-07 board half B02, plan-tool half B12 (B12 closes);
     R-54 ID rule and journal B05, history cut by B08's deletion bound (B05 closes).
  5. **New owners:** event shape and asset change signal (D-10) to B07; issue surface and
     `ProblemPill` to B03; `src/api.ts` transport to B05; `src/nav.ts` leave guard and the artifact
     details form to B06; `textCompare.ts` and `diffModel.ts` to B09; `scripts/link-index.ts` to
     B13; R-31 path sweep across all scripts and server env paths to B14; R-139 capture fix and
     R-150 deny terms to B12; HistoryView screenshot failure label to B10.
  6. **Agent-tool tests** join `verify:board` in B12 (every `*.test.mjs` under `agent/`).
- 2026-11-18, orchestrator, after the integration and fidelity reviews:
  7. **More split deliveries:** R-01 board and server half B02, lock-out UI B06, B06 closes; R-45 and
     R-111 server halves B05, B06 closes; R-56 wholly B05 including the store's `renameLane` and
     `deleteLane`; R-68 allocation rule and the minimal Settings call-site edit B02; R-119 lane merge
     B11, extending B05's lane route under touch rights.
  8. **Planning-only gates:** D-05 (with B05-Q2/Q3) before B08 builds; D-03 before B12 builds if
     B12 needs shared code (not needed if D-02 picks the no-overlap rule).
  9. **D-10** is B07's: B07 produces the asset version and change signal; B09 and B10 consume it.
  10. **Answered spec questions** (marked in the specs): B01-Q4, B04-Q4 (convention 12); B02-Q1 (UI
      in B06; R-68 call site B02); B02-Q2 (plan-tool half moved to B12); B03-Q1 (Freeform cycle
      members are B03's), B03-Q4 (unknown-type labels are B03's), B03-Q5 (B03 hardens the shared
      browser-storage reader), B03-Q6 (B03 names parent cycles in the check); B05-Q1 (B08 provides
      the deletion bound, B05 consumes it), B05-Q4 (shared-files rows; `src/api.ts` is B05's);
      B06-Q1 (D-04 covers config writes), B06-Q4 (B06 may add the per-field signal itself; still
      a product choice), B06-Q6 (nav.ts, details form, save actions are B06's); B07-Q1 to Q4 (B07 on
      `catalogueApi.ts`; owns the event shape and node reuse; ProblemPill is B03's, B07 edits text);
      B08-Q4 (deletion and rename bounds are B08's), B08-Q6 (B08 investigates); B09-Q1, B10-Q1
      (D-10, B07); B12-Q1, Q2, Q4, Q5 (tool tests, starter deny terms, R-139, A-4 are B12's); B14-Q1
      (env-path sweep is B14's; only the choice remains); B15-Q1 (A-2, A-4, A-10 judged by their
      owners), B15-Q6 (B15 marks the programme closed).
  11. **REPO_ROOT symlink case of R-47** goes to B01 (path rules); B03 reuses it.
  12. **R-139 closes only when the committed capture report is correct**, not merely flagged stale.
- 2026-11-19, user (B01's opening questions, asked ahead of the B01 session):
  13. **D-01 and B01-Q1 to Q3:**
      - **D-01a, raw-file boundary: both.** A Vite deny rule on the catalogue folders (following
        `REQUIREMENTS_DIR` and the in-tree folder, every spelling, case-insensitive) is the
        boundary, and the plugin normalises paths so every spelling of its own prefix reaches the
        board's file route or a 404.
      - **D-01b, other origins: CORS off plus server-side cross-site refusal** (fetch-metadata or
        an equivalent), so other pages can neither read board responses nor embed board files. The
        board's own new-tab file links and HEAD probes keep working.
      - **D-01c: no page-wide CSP.** The sanitiser and click interception (REQ-01 to REQ-03) carry
        the boundary; raw SVG responses keep their own no-script CSP (REQ-05).
      - **D-01d: no write token.** B01-REQ-10 adds nothing.
      - **B01-Q1, shortcuts (symlinks): warn, do not block.** The user chose "a simple warning"
        over refusing links. A file route or reader that meets a symlink whose real target lies
        outside its base still serves it, and a warning names the link and its target (at least
        in the server log and in `npm run check`; B01's planning picks the exact surface). This
        replaces REQ-07's "no file route or reader follows a link out of its base" and the
        refusal half of PR-07: the proof becomes "an escaping link produces the warning".
        R-35 closes as **Won't fix (warned instead), user's choice**. The R-47 REPO_ROOT case in
        REQ-07 and PR-07 (correct resolution, `meta.path` and inside/outside classification
        across a symlinked parent) is unchanged.
      - **B01-Q2, a link to another spot in the same drawing: bring that spot into view** with
        the viewer's existing reveal behaviour; a missing target does nothing. B10 builds on this.
      - **B01-Q3, unsafe IDs: refuse only clearly unsafe ones**: a path separator (`/` or `\`),
        a `..` segment, NUL or another control character. No project ID pattern, so the shared
        kit keeps working with other projects' IDs.
- 2026-11-19, user:
  14. **Lighter phase reviews.** The user judged four reviewers per phase too heavy. Phases use
      convention 15: two Sonnet reviewers (one for a small diff), verified by the session itself;
      B15's three closing lenses run on Sonnet.
  15. **Programme branch.** The user asked for all board-fixes work on its own branch. Convention 16:
      branch `board-fixes` from master at the commit recording this decision, worked in its own
      worktree, merged into master after B15 or on request.
      **B01 moved onto the branch** (2026-11-19, at the user's request): B01 (`d1e033a6`, board
      1.13.0) had been committed to master just before the branch existed. It was never pushed and no
      other branch held it, so master was moved back to `e3e7bf54` and B01 now lives only on
      `board-fixes`. Master then got one commit, the pointer page above.

- 2026-11-19, user (B02's planning questions, asked in the B02 session):
  16. **D-02 and B02-Q3 to Q6, A-2's fix:**
      - **D-02b, recodes never overlap.** `statuses:recode` refuses any target that is a source (other
        than an identity pair such as `4=4`) in its own map or a source in any earlier recode, and any
        target that is neither a fresh code past the list's high-water mark nor an explicit merge into
        a live code (the merge target named as an identity pair). Following every recorded recode in
        order (`normaliseStatus`, today's chain rule) then reads every version, old or new, correctly;
        no recode records which versions it applies to, and `catalogueDiff.ts` is not touched. A swap
        in place (`4=5,5=4`) is impossible; a project renumbers to fresh codes. An overlapping history
        already on disk (an adopting repo) is reported by the check.
      - **D-02a, removed statuses are kept.** Removing a status records its code and last label under
        a new top-level key in `board.config.json`:
        `"removedStatuses": { "statuses": [{ "code": 7, "label": "On hold" }], "questionStatuses": [] }`.
        The plan tools read only the `statuses` and `questionStatuses` arrays, so they never see a
        removed code as live; older boards ignore unknown keys. A stored removed code shows its last
        label marked removed. A new status takes a code past every code ever used: live, removed,
        any numeric key or value of a recorded recode, and any code a record holds.
      - **D-02c, no migration.** This repo has never removed a status and its one recode maps names
        to codes, so every registry fact derives (items: high-water 6, next 7; questions: 4, next 5).
        Nothing is written to the real `board.config.json`, `status-recodes.json` or `.history/`; the
        first removal or recode writes what it needs. The starter kit and older catalogues need no step.
      - **B02-Q3 and Q4, cosmetic problems repairable, structural ones lock.** A list with only
        tone, label, help or heading problems is **degraded**: each bad field falls back alone, the
        problem is reported, and Settings may save (repair) it. A list that is not a list, has an
        entry without a valid code or a duplicated code, breaks a role rule (missing, duplicated or
        unknown role) or the settle rules, or a config file that does not parse, is **damaged**: the
        server refuses status saves for that list (file unchanged). A damaged list reads as the
        readable part of the project's own list (first entry wins for a duplicated code; a role is
        kept only when exactly one entry, with an unduplicated code, holds it), never the built-in
        defaults, which apply only to an absent key or file. While its default role is unresolved
        new cards (or questions) are refused; a status change is accepted only to a code the readable
        list defines.
      - **B02-Q5, a recode updates the config too.** `statuses:recode` moves each config entry to its
        new code in the same run (an entry merged away is dropped, refused if it holds a role), so
        files and config never disagree, and a rerun of the same command completes an interrupted
        run without recording it twice.
      - **B02-Q6: no code column** in the CSV (the SPEC's default; not asked).
      - **A-2's fix: refuse while a board runs.** The board keeps a lock file (`board-<pid>.lock`,
        named by its process ID) in its journal folder while it runs; `statuses:recode` refuses, saying to stop
        the board first, while that process is alive. A stale lock (dead process) is ignored.
      - **R-07 rule for B12** (plan-tool half): unchanged. Follow every recorded recode in order from
        the stored value (`scope.mjs` `normaliseStatus` as it is). It is correct for every version
        because B02 refuses any overlapping recode upstream. B12's proof: an attempted overlapping
        recode is refused by `statuses:recode`, and the plan tools read the 2026-10-20 entry as today.
        D-03 is not needed for this (accepted decision 8). `status-recodes.json` stays an array of
        `{ date, note?, items, questions }`.

- 2026-11-19, user (B03's planning questions, asked in the B03 session):
  17. **D-06, B03-Q2 and B03-Q3:**
      - **D-06, both surfaces.** A crash caught by the error boundary shows a recovery panel in the
        failed region (a plain sentence, the message, Close card when a card or question is open, Try
        again, Go to board for other views, and a collapsed Details with the stack and a Copy button),
        and the problem pill gains a **This page** group naming the failed region, with the same
        actions, until it recovers; "All clear" waits for recovery. Boundaries sit round each routed
        view and each sheet (modal and docked); B10 and B11 reuse the same component for viewers and
        the canvas. A failed region **retries once by itself when the catalogue changes** (an agent
        fixes the file); a retry that fails again shows the panel again, never a loop. **Uncaught
        errors from event handlers and promises** are caught page-wide and listed in the pill
        (dismissable). A browser preference **reset because it was damaged** is mentioned in the pill
        (dismissable). Later phases report their own client-side failures through the same store
        (`src/clientProblems.ts`), never a new masthead mark, toast or banner.
      - **B03-Q2, damaged layout entries are dropped by the next save.** Until then they are ignored
        on read and named in an error issue on `layout`; only layout bytes change, never requirement
        content. A layout whose top level is not an object still blocks saves, as unparseable JSON does.
      - **B03-Q3, a byte-order mark is tolerated everywhere and kept.** Record files and
        `board-layout.json`, `board.config.json` and `status-recodes.json` read as if it were absent;
        when the board or its scripts rewrite such a file, the mark is kept, so nothing changes that
        the user did not change. (The user, owner of B02's config format, agreed.)

- 2026-11-19, user (B04's planning questions, asked in the B04 session):
  18. **D-03 and B04-Q1 to Q3:**
      - **D-03 = A, direct import.** Agent `.mjs` tools import `shared/*.ts` directly under Node type
        stripping, locating the board from the catalogue path they already take (as `build-packs.mjs`
        already loads `yaml` with `createRequire(<req>/../package.json)`):
        `await import(pathToFileURL(join(req, '..', 'shared', 'sources.ts')).href)`. One implementation,
        no mirrored copy. Works from `requirements-board/agent/...`, in the linked and copied install
        modes and in a kit export (the board, with `shared/`, ships beside the catalogue); proven on Node
        22.18. Not usable inside the workflow runtime or a generated browser page (ref-kit's inline
        matcher): there B13 resolves in Node and embeds the results. Stated rule: `shared/` stays
        erasable TypeScript (no enums, namespaces or parameter properties), with `.ts` import extensions
        and `import type` for types. B12 may use the same mechanism if it needs shared code.
      - **B04-Q1, an image whose target is a record ID is not a link.** `![x](US-01.1.2)` renders as an
        image, so `mentions` never counts it and `unlink` never rewrites it.
      - **B04-Q2, point lists:** `#2 #3`, `#2#3` and `#2, #3` each mean points 2 and 3, every number checked.
      - **B04-Q3, every new report is a warning** (two artifacts sharing a `file` or note, an artifact
        listing a prefix twice, a selector the browser rejects), so none can block a save. Existing link
        rules keep their severity; if the truer code rule reveals a new error on the real catalogue, the
        session stops and shows the user first.

- 2026-11-19, user and B08 session (B08's planning questions; D-05 asked ahead of B05 as the
  planning-only gate of accepted decision 8):
  19. **D-05, B05-Q2, B05-Q3, D-07 and B08-Q1 to Q3, Q5, Q6:**
      - **D-05, reuse stays** (user). The top freed ID is reissued, as today; SCHEMA is corrected by
        B14. A reused ID's history starts at the deletion: B08 marks it, B05 cuts there.
      - **B05-Q3, a restore continues** (user). When the re-added record is the same record (same type,
        reads as the deleted version, as a revert or undo makes it), its history carries on across the
        gap; otherwise it starts fresh. B08 keeps both the deleted and the re-added versions readable;
        B05 applies the rule.
      - **B05-Q2, journal cut only at a committed deletion** (user). A file merely missing (hand delete
        not yet committed, branch switch, stash) keeps its journal; B05 cuts when reading, at B08's bound.
      - **D-07(d), unchanged unstaged moves are followed** (user). A tracked file missing from the working
        tree is paired with an untracked file of identical clean-form content and read as a rename. An
        edited move shows once staged.
      - **D-07(a), cache keys** (session, from evidence): committed data by repository top and HEAD;
        staged renames by HEAD plus the index identity (path from `git rev-parse --git-path index`, its
        mtime, size and inode), so linked worktrees cache too; unstaged pairing recomputed every read
        from `ls-files`, hashes of candidates cached by path, size and mtime; per-file results by HEAD
        plus the resolved chain of earlier paths. No dependence on the watcher.
      - **D-07(b), bounds:** every cache a size-bounded LRU with HEAD in its key (values in the B08 entry).
      - **D-07(c), working names, hybrid:** a file git reports clean takes its index blob name; any other
        is named by `git hash-object --stdin-paths` (filters, eol and the repository's object format).
        The journal hashes in process with the object format it finds once per repository.
      - **D-07(e), full lists plus optional markers:** a deletion version carries `deleted: true`
        (`GitVersion`), an asset commit removing the file `deleted: true`, and `GitFileHistory` gains
        `screenshotsEnded`. A rename-away ends the history (no bound). One walker applies both rules.
        A reuse with no committed deletion gets no bound (B05-REQ-20).
      - **B08-Q1:** a merge is listed alone (default). **B08-Q2:** a historical blob is served as checked
        out (`git cat-file --filters`), the stored blob if the filter cannot run. **B08-Q3:** a stored
        screenshot hash of the wrong width is re-hashed on the next scan with no change logged; old
        entries stay unfetchable (404). **B08-Q5:** the blob check stays unbounded over the file's
        earlier paths; the `?src=` case is gated by `blobWasAt` too. **B08-Q6:** `git status` takes
        `index.lock` unless optional locks are off; every reader's git runs with `GIT_OPTIONAL_LOCKS=0`
        (proof in the B08 entry).

- 2026-11-19, user and B05 session (B05's planning questions):
  20. **D-04, B05-Q5, B05-Q6 and R-54's mentions and history rule:**
      - **D-05 not reopened** (decision 19 stands: reuse stays). No deleted-ID list, no migration.
      - **D-04a, stale writes merge when nothing overlaps** (user). A record write sends `patch` (the
        fields it changed), `baseRev` and optionally `base` (each patched field's value as the client
        started from it). Disk at `baseRev`: the patch applies. Disk moved on, with `base`: each patched
        field's disk value is compared with its base value; none changed, the patch merges onto the file
        as it is now; any changed, 409 naming them. Without `base` the check stays strict (any disk change
        is a 409, today's batch rule). "Keep mine" resends the same patch on the current rev.
      - **D-04b, conflict body:** `{ error, current }` as today, plus `collisions?: string[]` (the patched
        fields that changed on disk) and, for a multi-record write, `blocked: [{ id, current, collisions? }]`
        naming every blocker (`current` is the first, so today's store rollback still works). Status
        meanings unchanged (400 malformed, 404 missing, 409 changed on disk, 422 not answerable by Keep
        mine, 503 no free ID).
      - **D-04c, in place for every record kind** (user): items and questions as well as artifact
        sidecars. A save to an existing file changes only the lines of the fields it changes; creates
        are written in the canonical form. A change that cannot be written without losing data is
        refused with 422, the file untouched.
      - **D-04d, config bases per section:** `config.revs` (`project`, `components`, `statuses`,
        `questionStatuses`; the rev of each section as on disk) is derived, never written, and travels in
        the snapshot and config events (B07 keeps it). `PUT /api/config` may send `bases`; a stale section
        is a 409 with `section` and `current: { data, rev }`. B02's guards run on the merged result.
      - **D-04e, transition:** today's shapes (`{ record, baseRev }`, a base-less config write, a
        base-less `lanes`) stay accepted with at least today's guarantees; a whole record at the right
        base is reduced to the fields that differ from disk. Each is retired by the phase that removes its
        last caller (B06: record and config; B07 or B11: `setLanes`), which records it.
      - **D-04f, lanes:** one route, `POST /api/lanes { op: 'rename' | 'remove', from, to?, lanesRev,
        stories: { id: rev } }`, all or nothing; a rename onto an existing lane is a lane-rule refusal
        (B11 adds the merge).
      - **B05-Q5, lane lists carry a base** (user): `layout.lanesRev`, derived and never written. The lane
        route requires it; a layout write that sends `lanes` or `firstLane` may send it (409 when stale).
        Position patches never carry a precondition.
      - **B05-Q6, `artifact:new` never stages** (user, kick-off prompt; convention 9): a plain,
        non-overwriting move, no `git mv`. B08 follows an unchanged unstaged move (D-07(d)).
      - **R-54, bare mentions kept and documented** (user): plain-text mentions of a deleted ID stay as
        written and name a card that later takes the ID; README says so, B14 writes the SCHEMA line.
      - **R-54, history rule** (session, from decision 19 and B08's contract): a board create at an ID
        sets any leftover journal aside first; `created` journal entries carry the record; a card that
        reappears in a sync as a different record starts a new life in its journal (old lines kept in the
        file). On read, the timeline starts at the newest life start: a committed deletion whose two sides
        differ (a restore continues), or a `created` journal entry whose record differs from the newest
        git version before it. The artifact timeline cuts at its deletion bound the same way.

- 2026-11-19, user (B07's planning questions, asked in the B07 session):
  21. **D-10, B07-Q5 and B07-Q6:**
      - **D-10, a delivery entry and the git blob hash.** Every batched `catalogue:changed` delivery may
        carry `assets: { [src]: token | null }`, `src` as `item.images` writes it (`assets/<ID>/<name>`),
        `null` for a file removed; the cards are the `<ID>` segment. The snapshot carries `assets` for every
        file, so a tab loading later has the same tokens. The token is the file's git blob hash in the
        repository's width (the journal's fingerprint, cached by size and mtime), so a touch without a
        content change keeps it and it survives restarts. URL form `/requirements/assets/...?v=<token>`
        (`assetUrl(src, token)`); B01's route already admits the query and serves the current file for any
        token. An assets-only delivery causes no record update, no board rebuild and no
        `useCatalogueRefresh` run. B09 (R-96) and B10 (R-104) consume it; they build no signal of their own.
      - **B07-Q5, check then report.** A Mapped move still in flight when the page unloads keeps its target
        fields in the tab's session storage. After the reload they are compared with the cards as loaded:
        landed, nothing is said; not landed, the Card moves group says it was not saved. Never replayed.
      - **B07-Q6, save the moves and offer Reload; kept moves are same-tab.** While Offline the board asks
        its own server every 2 s; when it answers, kept Freeform moves are saved over HTTP at once and the
        problem pill says the server is back with a Reload button. Unsaved moves are kept in session storage
        (a reload of the same tab, including Vite's automatic one, keeps them; a closed tab does not, and
        closing with unsaved moves asks first).
      - **Downstream:** B06 reads `hasUnsavedMoves()` (store) in its leave guard; B09 and B10 read the
        store's `assets` slice; B11 keeps node and `data` identity reuse. `setLanes`' missing `lanesRev`
        stays with B11 (B07 does no lane work).

- 2026-11-19, user and B06 session (B06's planning questions, asked in the B06 session):
  22. **B06-Q2 to Q5:**
      - **B06-Q2, merge silently** (user). While a sheet (item, question, artifact details) has unsaved
        edits and the record changes on disk only in fields the user has not changed, the sheet takes
        the change into its draft quietly (new base, the user's changed fields laid over the disk copy).
        Keep mine / Load theirs appears only when a field the user changed also changed on disk. Applies
        to the user's own Mapped drags of the card being edited.
      - **B06-Q3, block and offer to add, server too** (user). A component list that would leave a
        component in use (by a card or an artifact) unlisted shows those names with their counts and an
        "Add them" button, and Save stays off until they are listed. The server refuses the same save
        (422), but only when the save adds unlisted in-use components compared with the list on disk,
        so a save that leaves things no worse still goes through. This replaces the old server rule
        (a dropped name refused only if `state.config` knew it), judged against the disk list.
        Minimal edit to B05's config route under touch rights.
      - **B06-Q4, lock components and project too** (user; added scope, no finding owns it, FID-14).
        `parseConfig` derives a per-section read state for `project` and `components` (any problem
        reading that section is `damaged`; derived, never written) beside B02's `statusState`; it travels
        in the snapshot and config deliveries as part of the config. Settings shows a damaged section's
        problems and offers no editing or Save; it returns to normal live when repaired. The server
        refuses a save of a section damaged on disk (422, file unchanged), as B02 does for status lists.
      - **B06-Q5, no record identity beyond the content** (session, from evidence; owner B06). The board's
        own create and delete clear any stored draft for the IDs they create or remove. A draft whose
        record reappears from outside the board is treated as any disk change under Q2: it resumes, and
        a clash on a field the user changed raises Keep mine / Load theirs. With field patches, Keep mine
        writes only the user's changed fields. D-05 (reuse stays) makes outside re-creation the only
        remaining case; no identity marker is added.
      - **D-04e retirement** (session, from decision 20): B06 removes the last callers of the whole-record
        write (`putItem`, `putQuestion`, `putArtifact`) and of the base-less config write, so the server
        stops accepting both (`{ record }` is a 400; a Settings section sent without its base is a 400).

- 2026-11-20, user and B09 session (B09's planning questions, asked in the B09 session):
  23. **B09-Q2 to Q4, and the Open rule:**
      - **B09-Q2, timings recorded, not gating** (user). B09-REQ-01 rule 5's targets (two 2,000-block
        documents with up to 50 changed blocks paired in under 100 ms; no input holding the pairing step over
        250 ms; one 5,000-token paragraph pair marked in under 50 ms) are measured in Node and recorded in
        the B09 entry; a miss is recorded with its figure and does not block R-25.
      - **B09-Q3, a new starting number is a marked change** (user). The first item of a numbered list keeps
        its number in the comparison key, so a list that now starts at another number shows that item as
        edited with its marker marked, and is not minor. Items renumbered after an insert or removal, and a
        bullet character change (`-`, `*`, `+`), read as unchanged and are minor.
      - **B09-Q4, Viewed ticks are live across tabs** (user). An open Diff review shows ticks made in another
        tab of the same browser at once (a `storage` listener), besides never erasing them (R-93).
      - **Open rule** (session, from DESIGN.md "Open (not for a removed one)"; the SPEC's assumption
        confirmed): a Diff review card offers Open only when its record is on the board now, never for a
        Removed card or one unreadable on its After side.
      - **Downstream:** none outside B09. B15 reruns the B09 proofs.

- 2026-11-20, user (B10's planning questions, asked in the B10 session):
  24. **B10-Q2 and B10-Q3:**
      - **B10-Q3, both** (user). On the Artifacts tab a picked Kind stays a toggle (count 0) and a picked
        Area or Status stays an option, with its select shown whenever a value is picked, even when no
        artifact on show has it or (Area) the config no longer lists it. When filters are why nothing
        shows, the empty state says so and offers **Clear filters**. A saved kind or status the board does
        not know is dropped by the store's shape check (`readJson`'s coerce), never by a second reader.
      - **B10-Q2, yes** (user). A compare version that is read but does not decode as an image reads
        "Could not be drawn", as the card timeline's screenshots do (B10-REQ-11); REQ-05's proof gains
        that row.
      - **Downstream:** none outside B10. DESIGN.md's Artifacts tab and history lines change (Doc facts).

- 2026-11-20, user and B11 session (B11's planning questions, asked in the B11 session):
  25. **B11-Q1 to Q5, and R-128's form:**
      - **B11-Q1, the open card alone in the collapsed strip** (user). A collapsed lane stays collapsed; while
        the open card sits in it, its strip grows to draw that one card (placed, hit-testable, centred, no
        overlap with the next lane) and shrinks back when the card closes. Opening a card never changes the
        collapsed-lanes preference; the lane toggle works as usual.
      - **B11-Q2, the case-variant band stays its own flagged band** (session, from evidence: the check warns
        on a `swimlane` that is not exactly a lane name, `shared/check.ts`, and systemic issue 5 says bad data
        is shown, never folded away). Its menu offers a fix that works (move its stories into the lane it
        matches, the first lane included) in place of "Add as a lane"; `shared/check.ts` is not touched.
      - **B11-Q3, the walk skips collapsed lanes; Left and Right stay in the column** (user). Up and Down skip
        stories in a collapsed lane (as board search already does), except the open card drawn there (Q1).
        Left and Right on a story step among the stories of the same parent, as drawn (REQ-06 as written).
      - **B11-Q4, stale collapsed keys are kept** (user). No pruning. Board renames, merges and deletes move
        or drop the key (R-120), and a lane added on the board starts open; a key left by an outside rename
        stays until a lane of that name is added or removed on the board.
      - **B11-Q5, the Outline's bulk buttons are disabled while searching** (user), with a title saying
        search shows every match expanded; the twisty is inert and looks it.
      - **R-128 form** (session, from decision 24's rule for the Artifacts filters): a picked owner who no
        longer owns a question stays listed as an option and selected, so the control shows the filter in
        force and "All owners" clears it.
      - **Downstream:** none outside B11. DESIGN.md's board lines change (Doc facts). The lane merge is a form
        of B05's `POST /api/lanes` rename (decision 20's D-04f, touch rights, decision 7).

- 2026-11-20, user and planning session:
  26. **B12 and B13 run as lanes, after the `worktree-lanes` skill** (user). Convention 16's B12 and
      B13 bullet now carries the skill's process: both worktrees are set up ahead of time and checked;
      the session catches up by merging `board-fixes` (and master) at start and on every resume;
      `<id> checkpoint:` and `<id> complete:` commit subjects tell start, resume and finish apart; all
      conflicts are resolved on the phase's own branch; and `board-fixes` moves by one `merge
      --ff-only`, handed to the owner when the session cannot write to the programme worktree. Not
      adopted: the skill's waves and join (two side branches feed a moving programme branch), its
      `LANES.md` (convention 16 holds the rules) and its status files (`.git/lanes/` belongs to the
      catch-up lanes, which B12 must not write).
      - **Downstream:** the B12 and B13 specs and kick-off prompts; PLAN "Version numbers in worktree
        phases".

- 2026-11-20, user and B13 session (B13's planning questions, asked in the B13 session):
  27. **B13-Q1 to Q5, and how decisions bind:**
      - **B13-Q1, refuse them all, no override** (user). Beyond edits outside the catalogue folder and to
        protected artifacts, `apply.mjs` refuses an edit to `notes/`, `changes/` or `reference/`, an edit
        whose text lies in a question's `## Answer` section, and an edit to a retired item or a retired
        artifact (its sidecar or drawn file). A refusal is a `FAIL` line and holds the whole change back
        (B13-REQ-02); the review page marks the edit as one that will not apply. No override flag: a hand
        fix is made by hand, as Stage 4 already does for `FAIL` lines.
      - **B13-Q2, the latest run, old files reported** (user). Each link run has its own folder:
        `links:index` starts one (the previous run folder is kept under `.links/runs/`), the workflow
        writes its proposal files there by default, and `links:apply` with no folder argument applies that
        latest run only, naming it in its output and report. Loose `*.verified.json` files left in `.links/`
        from before this fix are never applied by default; they are listed in the output and left in place
        for the user to delete. Naming a folder (`links:apply -- <dir>`) applies that folder, as today.
      - **B13-Q3, warn and continue** (user). A consolidation group topic that matches no rulings topic is
        named in the stage-2 log and its returned result, with how many findings fell to the catch-all
        group; the run goes on. The "This repo" groups are realigned to the suggested topics.
      - **B13-Q4, retired diagrams are left out** (user). A diagram whose sidecar is Retired (or names a
        `superseded_by`) gets no artifact pack and no diagram verifier; `index.json` lists it under a new
        `skippedDiagrams` field (additive) so the count is visible.
      - **B13-Q5, one batch per epic** (user). A bare epic ID in `batches` becomes its own batch; a list
        stays one batch; a mix works; anything else stops the run before any agent with a returned error.
        The log states the grouping.
      - **How a decision binds (R-09)** (session, from the SPEC's risk "neither too strict nor too loose").
        Each change carries a fingerprint of its proposed effect (its edits as file, `old`, `new`, order
        ignored; for a change without edits its title, items and action); each question one of its title,
        body and affects. The page keeps decisions by fingerprint, so the same change keeps its decision
        under a new id and a different change at an old id starts undecided; exported decisions, the
        pasted text and `accepted-ids.txt` carry `id@fingerprint`. `decisions.mjs` and `apply.mjs` match by
        fingerprint, name any decision whose change has changed or gone, and treat a bare id (a decisions
        file or text from before this phase) as unverified: `apply.mjs` applies it only with an explicit
        `--unverified`. `question-fixups.json` takes `Q-nn@fingerprint` keys; a plain `Q-nn` key is honoured
        and pinned to the question it acted on, and skipped with a warning once that id names another.
      - **Downstream:** none outside B13. B14's R-31 sweep and docs pass take the new `links:index`,
        `links:apply` and workflow argument shapes from B13's entry.

- 2026-11-20, user (B12's planning questions, asked in the B12 session):
  28. **D-08, B12-Q3 and B12-Q6:**
      - **D-08, read the lanes, with a guard** (user). A new optional top-level `plan.config.json` key
        `"lanes": { "branches": ["lane/a", "lane/b"], "complete": "{id} complete:", "checkpoint": "{id} checkpoint:" }`
        (only `branches` is needed; the two subject patterns are the defaults). The update-build-plan view
        (`phaseStatus(c, root, { lanes: true })`: plan-state, apply-plan-update's kept baselines,
        recipe-status `--check`) reads each configured branch other than the current one: commits on
        `HEAD..<branch>` whose subject matches `complete` mean built, `checkpoint` partly built; the branch's
        own progress file (`git show <branch>:<progress>`) DONE rows built, IN PROGRESS rows partly built; the
        stronger state wins. When `status.json` declares `guidance.lanes` and `lanes.branches` is unset,
        plan-state reports the lanes as unaccounted and apply-plan-update refuses (exit 2, naming them) unless
        given `--ignore-lanes`. The context pack keeps reading its own branch only (LANES.md step 4).
      - **B12-Q3, the owner applies the config at the master merge** (user). Project words leave
        `phase-context.mjs` for optional `runner.context` keys with generic defaults; the exact additive JSON
        (`runner.context.countNouns`, `runner.context.notPhaseBefore` and the D-08 `lanes` key) is recorded in
        the B12 entry and applied to the live `plan.config.json` when `board-fixes` merges into master. Old tools
        ignore the keys. The section names (`decisionsSection`, `handoffSection`) default to the skill's own
        words "Decisions log" and "Discovered for later", so the live plan needs no key for them.
      - **B12-Q6, warn only** (user). A fresh-plan remake that reuses a phase number with a new slug points
        `plan.json` at the new doc; apply-plan-update reports both paths and leaves the old file.
      - **Downstream:** B14 documents the new keys (`lanes`, `runner.context.countNouns`, `notPhaseBefore`,
        `decisionsSection`, `handoffSection`) in its whole-file pass; the owner applies the migration at the
        master merge; the catch-up lanes need nothing until then (they keep master's tools).

- 2026-11-20, user and B14 session (B14's planning questions, asked in the B14 session):
  29. **D-09, B14-Q1 to Q5, and the B14 "Discovered for later" rows:**
      - **D-09 source, HEAD with a trial flag** (user). `kit:export` builds the kit from the board's files
        as committed at HEAD and records that commit in the kit (`.kit-export.json`, START-HERE). With
        `--uncommitted` it takes the tracked files as they are on disk instead, never an untracked or
        ignored file, and names every board file that differs from HEAD. Outside a git repository it
        refuses. A real export therefore follows the commit of its version bump.
      - **D-09 refusal, an exact marker, no force** (user). Every export writes
        `requirements-board/.kit-export.json` (version, commit, a SHA-256 per file). A target that already
        holds a `requirements-board/` is replaced only when that folder has the marker and every file
        matches it: none added, removed or changed (`.history/`, `.pdf-facts/` and `package-lock.json`
        count; only `node_modules/` is exempt, and kept). Fixed rule on top: never the running board, a
        folder inside it or one containing it, compared by real path. Every refusal happens before the
        target is touched; the message names the target, the reason and what to do (an empty folder, or
        the folder an earlier export wrote and nobody changed). There is no `--force`.
      - **B14-Q1, relative folder values are relative to the board folder** (user). `REQUIREMENTS_DIR`,
        `HISTORY_DIR`, `REPO_ROOT` and `PDF_FACTS_DIR` given as relative paths resolve against
        `requirements-board/` whatever the working folder; README says so. Script arguments, by contrast,
        resolve against the folder the command was run from.
      - **Discovered rows** (user): B14 takes the export blockers (denied words in
        `agent/shared-rules.test.mjs` and `tests/inPlace.test.ts`) and the doc-only rows (backslash file
        names, the stale recode lock, `page_offset` on a replacement, B12's new plan keys and `plan-state
        --from`). The code rows owned by "B14" or "B12 or B14" (escaping base folder warning,
        `resolve-source`/`new-artifact` unguarded facts, tests-only tsconfig, `steps.ts ?? []`,
        `phase-context.mjs` note rule, `plan-state --to`, the git-test timeouts, `.origin-fixture` cleanup)
        move to B15 to judge.
      - **B14-Q2, no upgrade mode** (session, from the SPEC's assumption). README and ADOPTING say an
        adopter upgrades by exporting to a fresh staging folder and copying everything but `requirements/`
        into their board; an upgrade mode is recorded under "Discovered for later".
      - **B14-Q3, both e2e ports follow the environment** (session). The fixture board takes
        `BOARD_E2E_PORT` (default `BOARD_PORT` + 2), the real-catalogue board `BOARD_E2E_REAL_PORT` (default
        `BOARD_PORT` + 3), with `BOARD_PORT` filled from `.lane.env` and defaulting to 5180: 5182 and 5183 in
        the main checkout, 5482 and 5483 here, never 5181.
      - **B14-Q4, `installStatus` is deleted** with its test (session, from evidence: no caller). The
        install itself keeps the mode in use: a manifest means copy, links into the board mean link,
        nothing means copy; `--link` and `--copy` choose.
      - **B14-Q5, starter copies of the two folder guides** (session). `starter/requirements/notes/README.md`
        and `changes/README.md` ship; `SHARED_REQ` keeps only `SCHEMA.md`, which becomes neutral. The live
        notes README keeps its legacy citation table (this project's notes rely on it), with a path that
        exists and a role in place of "4 here".
      - **Downstream:** B15 tests the export rules and the port mechanism (B15-REQ-20, -21).

- 2026-11-20, user and B15 session (B15's planning questions, asked in the B15 session):
  30. **B15-Q2 to Q5 and Q7:**
      - **B15-Q2, items moved to B15 are judged, not built** (user, kick-off prompt: "Build nothing new
        beyond small confirmed regressions; record anything larger with an owner"). Each row moved to B15
        (decision 29's code rows, the e2e flake rows, the `/__open-in-editor` residual, the SCHEMA example
        row, `board-edges`) is verified and either fixed as a small confirmed regression (B15-REQ-17) or
        listed as deferred follow-up with a named owner.
      - **B15-Q3, the Low sample** (session, B15 owns it): B15 independently re-runs fail-first on every
        Medium finding, every security-theme finding, every systemic-issue-1 write-loss finding, and one
        Low finding per phase that owns Lows; for every other Low it checks that the ledger records a
        failing run and that the proof runs and passes in a suite B15 runs.
      - **B15-Q4, full verify in a freshly installed kit** (user). In the scratch kit: `npm ci` from the
        network, the kit's catalogue check, its full `verify` (typecheck, Vitest, agent tests) and the
        fixture e2e on a free port. If the network fails, `node_modules` is linked instead and a fresh
        install is listed as manual acceptance owed.
      - **B15-Q5, COMPLETE with an owed list** (user). The programme is recorded COMPLETE when every
        finding has a verified disposition and every open item is a listed deferral or exclusion with an
        owner; manual acceptance the user still owes is listed in CLOSING-REVIEW.md and does not hold the
        close.
      - **B15-Q7, report, fix on the user's OK** (user). Drift in root `CLAUDE.md` is listed with proposed
        wording; B15 edits it only if the user approves those edits in this session.
      - **Downstream:** none outside B15.

## Planning handoff

- 2026-11-18: orchestrator created FINDINGS.md (copy of the verified review report), PLAN.md, this
  ledger and the phase folders. Fifteen dedicated author subagents (one per phase, same model as
  the orchestrator) wrote `phases/<phase>/SPEC.md`. Every author verified its findings at HEAD
  d4341735: all 164 still reproduce or hold by mechanism (R-154 leaks nothing today; mechanism
  stands). Authors raised boundary collisions; the orchestrator resolved them in PLAN.md (revised
  territories, shared-files table, build order, D-10) and the accepted decisions above.
- 2026-11-18: two fresh reviewers wrote `review/INTEGRATION.md` (28 findings: 5 blocking, 17
  should-fix, 6 minor) and `review/REQUIREMENTS.md` (17: 3 blocking, 8 should-fix, 6 minor; coverage
  of all 164 confirmed). Both trace mostly to specs lagging the revised PLAN. Orchestrator applied
  the PLAN and PROGRESS corrections (accepted decisions 7 to 12) and routed each spec's corrections
  to its author.
- 2026-11-18: every author applied its corrections; both reviewers rechecked. Integration: 32 of 32
  findings resolved (4 raised by the recheck, all fixed). Fidelity: 19 of 19 resolved (2 raised by
  the recheck, all fixed); coverage 164 of 164 with every split delivery covered on both sides.
  No finding was rejected. `index.html` built from PLAN and the specs; every phase has its SPEC
  link and kick-off prompt.
- **Planning package complete.** All phases are ready for implementation planning. None is ready to
  build until its gate's decisions are recorded. **Next action:** start B01 with its kick-off prompt
  (index.html); D-05 needs a short B05 planning conversation before B08 builds.

## Discovered for later

| Item | Found by | Owner | Note |
|---|---|---|---|
| `deleteLane` has the same two-write flaw as R-56 | B05 author | B05 (B05-REQ-13) | taken into scope |
| `git status` may take the index lock in lane worktrees and break an agent's commit | B08 author (B08-Q6) | B08 | **Confirmed and fixed in B08** (`GIT_OPTIONAL_LOCKS=0` on every reader call) |
| HistoryView's screenshot `Shot` labels every load failure "never committed" (same flaw as R-103) | B09 author | B10 | taken into B10 scope |
| Two layout saves that both succeed can land out of order; StrictMode double start-up load | B07 author | B07 | taken into scope |
| `artifact:new` uses `git mv`, which stages mid-phase | B05 author (B05-Q6) | B05 | **Done in B05** (decision 20): a plain, non-overwriting move, never staged |
| Fixture e2e port 5182 is fixed, so two lanes collide | B14 author (B14-Q3) | B14 | **Done in B14**: `BOARD_E2E_PORT`, default `BOARD_PORT` + 2 (decision 29) |
| `/history-blob/<sha>?src=assets/x.png` serves any blob in the repository by full sha, typed by `src`'s extension (same-origin only; needs the hash) | B01 security review | B08 | **Done in B08**: the `src` case is gated by `blobWasAt` |
| `catalogueDiff.ts:135` compares git's real top with `REPO_ROOT` as given (the E7a mixed-path defect) | B01 completeness review | B09 | **Done in B09**: `fileInRepo` resolves `REPO_ROOT` through `realPath` (test in `tests/catalogueDiff.test.ts`) |
| A base folder that is itself an escaping link (`assets/` linked out of the requirements folder) is not warned: `linkOut` compares against the base's real path | B01 completeness review | B14 (moved by B03) | not built in B03 (outside its 14 findings; R-47's isolation does not depend on it); a check warning would suffice |
| A top-level visit from another site can still open Vite's `/__open-in-editor` (navigations are allowed so links to the board work); Vite still serves the board's own source, `node_modules` and any `.html` outside the catalogue as same-origin pages (SPEC residual) | B01 | B15 | Vite's dev model; consider refusing cross-site navigations to `/__open-in-editor`; **B15: deferred** to the board owner (CLOSING-REVIEW section 7); CHANGELOG 1.13.0 corrected |
| A screenshot whose file name holds a backslash cannot be served (`\` is read as `/`, as the file system on Windows would) | B01 correctness review | B14 (docs) | **Done in B14**: README, Screenshots paragraph |
| `verify:board` saw 5 s Vitest timeouts in `gitHistory.test.ts` under full parallel load (once in four runs; passes alone) | B01 | B12 or B14 | the live origin test adds a Vite boot to the load; consider raising git-test timeouts |
| The 5 s timeouts recurred in B02 across `gitHistory`, `catalogueDiff`, `api` and `catalogue` tests while the machine's load average was 20 to 26 (antivirus scanning); all pass alone, and the suite passed once the load fell | B02 | B12 or B14 | same item as above; B02's script tests that spawn node carry a 60 s timeout |
| The Settings Add row's use of the high-water mark has no browser test (the helper and the server refusal are unit-tested) | B02 review | B06 | B06 owns the Settings UI and can prove it with the lock-out |
| A lock left by a crashed board whose process ID is later reused makes `statuses:recode` refuse until the file is deleted (the message names the file) | B02 review | B14 (docs) | **Done in B14**: SCHEMA's statuses paragraph says to delete the named lock |
| `statuses:recode` writes `board.config.json` through `formatJson`, so a hand layout it would lay out differently is reflowed (data unchanged; Settings does the same) | B02 review | none | accepted: `formatJson` is the file's house layout |
| The write routes' `guard()` runs `checkCatalogue` unguarded, so a check that throws on unexpected data turns a save into a 500 (the load is backstopped, writes are not) | B03 | B05 | **Done in B05**: backstopped with `issuesFor`'s wording, so only a new such error refuses |
| `scripts/resolve-source.ts` runs `pdfFacts.ts` with no timeout and no try; `scripts/new-artifact.ts` derives SVG and Markdown facts unguarded | B03 | B14 | the board's load is safe; the scripts are not |
| `.pdf-facts/` is never pruned (an old version's entry stays) and a killed write leaves a `.tmp` | B03 review | none | documented in README; delete the folder any time |
| `tsconfig.node.json` now carries `jsx` and `vite/client` types so tests can import `.tsx`; a tests-only tsconfig would keep them out of server code | B03 review | B14 | |
| `shared/proseDiff.ts` keeps its own fence and backtick heuristics (`FENCE`, `closed`) for the Diff review's block splitting | B04 | B09 | not a "what is code for links" rule; could adopt `markdownCode.ts` |
| `decodeEntities` knows six named entities, so `# &copy; 2026` reads "&copy; 2026" where the page shows "©" (slug differs); a footnote `[^1]` in a heading reads "^1" | B04 review | none | no catalogue heading uses either |
| `lintFrontmatter` keeps a `#` warning quiet when any other frontmatter string holds the same text after the `#` | B04 review | none | contrived false negative |
| A mermaid edge label written without spaces (`A--text-->B`) is read as a node `text`; unverified whether mermaid accepts that form | B04 review | none | |
| A retired artifact's `page_offset` is applied to its replacement's pages (from before B04) | B04 review | B14 (docs) | **Done in B14**: SCHEMA "Which artifact" states the rule |
| The 5 s Vitest timeouts in git and live-server tests recurred in B04 (load 20 to 34); the same files time out on the pre-B04 board too | B04 | B15 (moved by B14) | same item as B01's and B02's; **Done in B15**: Vitest `hookTimeout` 60 s (the hooks were what failed); final `verify:board` green at load 16 to 19; individual test limits unchanged (deferred, watch) |
| git's own rename detection (`-M`) can pair a deleted card with a similar new card added in the same commit, so the new card inherits the old one's history with no deletion bound | B08 review | B05 | the same case as REQ-11.4 (reuse with no committed deletion); B05-REQ-20's own cut covers it |
| An LFS version is served as its pointer (`GIT_LFS_SKIP_SMUDGE`, so a request never fetches); viewers show the pointer text | B08 review | B10 | a viewer could say "stored in LFS" instead |
| `e2e/one-rule.spec.ts` R-101 ("a decomposed passage is boxed over exactly its words") fails 2 runs in 3 on this machine, on the pre-B05 board as well (pixel box off by more than its tolerance) | B05 | B10, then B15 | passed in B04's runs; viewer geometry, not the write model; **B15:** not seen in two full runs (144 of 144, and the kit 137 of 137); deferred to the board owner (watch) |
| An artifact ID reissued before the old sidecar's deletion is committed shows the old sidecar's commits as its past (artifacts have no journal to mark a new life; git sees an edit) | B05 review | none (B15 to confirm) | the card case is cut by the journal; an artifact would need a marker kept outside the catalogue; **B15: confirmed**, accepted under D-05; no owner |
| A card deleted by hand and re-created as another card inside one watcher debounce (600 ms) reads as an edit, so no new life starts | B05 review | none | same class as B08's `-M` pairing row |
| `writeAll` (`server/catalogueApi.ts`) reads a file's bytes for put-back a moment before the writer's own read; an agent write in that window would be put back over if a later file then failed | B05 review | none | microseconds, on a failure path only |
| `src/components/useEditableRecord.ts` and `shared/steps.ts` keep their own JSON equality; B05's three copies became `sameValue` (`shared/patch.ts`) | B05 review | B06, B09 | adopt `sameValue` when touching those files |
| `setLanes` (adding and reordering lanes) sends no `lanesRev`, so two tabs can still undo each other's lane additions | B05 (D-04e) | B07 or B11 | **Done in B11**: `setLanes` sends it and the layout PUT requires it with `lanes` or `firstLane` |
| The history readers' per-read costs: one `ls-files --deleted` per read, the whole-history rename log re-run per HEAD (as before B08), negative history-blob checks not cached | B08 review | none | measured acceptable here (card history 2.6 s cold, was 5.5 s); revisit on a much larger repository |
| The B08-territory git test files now set a 60 s test timeout (the readers run one more git process per read); other live-server and Diff tests keep 5 s | B08 | B12 or B14 | same item as the 5 s timeout rows above |
| The watcher never stops watching an outside artifact file whose artifact was removed (`watchArtifactFiles`, `cataloguePlugin.ts`) | B07 SPEC | none | harmless: an event for it feeds nothing (`planSync` finds no artifact using it) |
| A stale echo of an earlier layout save, arriving after a later save's answer, can show the older position of that card for a moment, until the later echo arrives (no move then waits or is in flight) | B07 review | none | self-correcting; REQ-05.4 covers waiting and in-flight moves |
| A save's own delivery and its HTTP answer travel on two sockets; a delivery older than an answer the tab already applied could in principle arrive after it (deliveries are sent before the answer, so only on a severe stall) | B07 | B06 | if sheet conflict handling needs it, put `seq` on write answers |
| `tests/resync.test.ts` and `tests/storeSync.test.ts` twins share `artifactInfo`'s process-wide cache, so artifact facts are compared partly through it | B07 review | none | facts are cached per file version, which is what a full read uses too |
| The `logged` deliveries in `store.ts` are bounded only by how long a load takes (a load that never settles would let it grow) | B07 review | none | dev-only; `fetch` has no timeout today |
| `e2e/board-mapped.spec.ts` "clicking a lane name renames it" failed once in a full fixture run at load 17 and passed 6 of 6 on repeat (B05's flaky row) | B07 | B15 | same item as B05's; **B15:** not seen in two full runs (144 of 144, and the kit 137 of 137); deferred to the board owner (watch) |
| `e2e/one-rule.spec.ts` R-101 failed in every full fixture run in B06 and in 4 to 12 of 12 single runs; the pre-B06 board fails it 4 of 6 and 1 of 3, and B06's board with its artifact page changes taken out 3 of 8 against 4 of 8 with them | B06 | B10, then B15 | the viewer pixel-box flake (B05's row), not the edit sheets; **B15:** not seen in two full runs (144 of 144, and the kit 137 of 137); deferred to the board owner (watch) |
| Settings rows are keyed by index, so focus falls to `body` after Remove or Move; every row's buttons are named just "Remove", "Move up", "Move down"; the accent and tone swatch radio groups have no arrow keys | B06 review | none (B15 to judge) | pre-existing accessibility in Settings, outside B06's findings; **B15: deferred** to the board owner (pre-existing accessibility) |
| Unsaved Settings edits are not counted by the leave prompt (`hasUnsavedWork`), and Discard changes in Settings does not ask | B06 review | none (a product choice) | pre-existing; DESIGN's "every way out asks" is about sheets |
| The veil markup and its Escape handling exist in `Sheet.tsx` and in the artifact panel's `PanelVeil` / `usePanelKeys` (now exported from `ArtifactPanel.tsx` for the artifact page's orphan state) | B06 review | B10 | B10 owns `src/artifacts/*`; one shared veil component would do |
| The Writing voice section hand-rolls the conflict banner and save bar the other sections now share (`ConflictBanner`, `SaveBar`) | B06 review | none | cosmetic duplication |
| A long paragraph whose every word recurs, edited at two distant places, still tints whole: past the word table's budget nothing is unique to anchor on | B09 review | none | REQ-01 promises one-word changes; real prose has once-only words |
| Pairing two wholly different 2,000-paragraph documents of long (30-word) paragraphs takes about 380 ms at load 12, over B09's non-gating 250 ms target | B09 review | none | recorded (decision 23); short paragraphs 150 ms |
| A run of Freeform drags or screenshot re-captures that grows (collapse keeps the latest time) changes its timeline key, so its open disclosure closes | B09 review | none | R-95's stated case (a newer entry above) holds |
| A card first seen outside any repository (or clean with no git history) shows no "Created" entry; a second `seen` after an offline delete and re-create is not a life start | B09 review | none | REQ-12 rule 3 covers the uncommitted case; the board's own create starts a life |
| `shared/steps.ts` still writes `lcsPairs(...) ?? []`, now unreachable; `alike` is exported for tests only | B09 review | B14 | harmless; `steps.ts` left untouched (P-06) |
| `shared/proseDiff.ts` keeps its own fence heuristics (B04's row) | B04 | none | not needed by any B09 finding; left |
| `e2e/artifacts.spec.ts` "stepping back, a jump from the panel ... reduced motion fly nothing" failed once in B09's full fixture run (load about 12) and passed 3 of 3 alone | B09 | B15 | viewer animation timing, no diff code; **B15:** not seen in two full runs (144 of 144, and the kit 137 of 137); deferred to the board owner (watch) |
| `tests/catalogue.test.ts` "round-trips every item file" failed once in a `verify:board` run at load 22 and passed alone and in the next full run | B09 | B12 or B14 | the timeout rows above |
| `tests/api.test.ts` "serves a version of a removed artifact ..." and once `diffUi` (R-92) and `originLive` failed in `verify:board` runs at load 18 to 24; each passes alone (`diffUi` 3 of 3) and in the next full run | B10 | B12 or B14 | the timeout rows above |
| `e2e/board-mapped.spec.ts` "clicking a lane name renames it" failed in one of two full fixture runs and 1 of 3 alone (no B10 code on that path) | B10 | B15 | B05's and B07's row; **B15:** not seen in two full runs (144 of 144, and the kit 137 of 137); deferred to the board owner (watch) |
| `e2e/one-rule.spec.ts` R-101 (the viewer pixel-box flake routed to B10) passed 3 of 3 alone and in both full fixture runs after B10; not traced to one cause (B10's Markdown reader now places a request once, not on every effect run) | B10 | B15 | confirm over more runs; **B15:** not seen in two full runs (144 of 144, and the kit 137 of 137); deferred to the board owner (watch) |
| A PDF thumbnail opens its document through `pdfDocs.ts`, which reads every page's size first (as `loadPdf` did), so a thumbnail of a long PDF waits on all its pages | B10 review | none | the reader needs the sizes; a first-page-only open would be a second path |
| History compare checks an old non-PDF version with a HEAD and `Image.decode()` before its `<img>` loads it (three requests, cached); an SVG with no size might fail `decode()` in a browser other than Chromium (unverified) | B10 review | none | the board is used in Chromium-based browsers |
| An LFS version is still served as its pointer; the compare and timeline now read "Could not be drawn" for it rather than "never committed" | B10 | none | B08's row; "stored in LFS" wording not added |
| A second lane-list write sent before the first has answered (Add lane twice quickly, or Add lane while a delete is in flight) carries the old `lanesRev` and is refused ("Lanes not saved"), nothing written | B11 review | none | safe; a queue for lane writes (as Freeform moves have) would send the second on the first's rev |
| A renamed collapsed lane shows open for one render until the server answers (the key moves on success) | B11 review | none | cosmetic |
| In a collapsed lane the open card is placed at the strip's top while the hidden cards of its stack keep their stacked places (one may share its spot) | B11 review | none | hidden cards are never hit-tested; a collapsed lane's drop index is the stack's foot |
| The full fixture e2e run at load 29 lost `board-mapped` "dragging a feature to an earlier slot", `artifacts` R-104 and `diff` "uncommitted edits arrive live"; each passed 3 of 3 alone, and `board-mapped` 13 of 13 twice, `artifacts` with `diff` 59 of 59 | B11 | B15 | load timing, the same class as the rows above; **B15:** not seen in two full runs (144 of 144, and the kit 137 of 137); deferred to the board owner (watch) |
| `consistency-rulings.js` had not parsed since 2026-10-20 (an unescaped backtick in a template literal), so stage 1 of the consistency review could not run | B13 | B13 | **Done in B13** (the REQ-09 proof parses the workflow) |
| `scripts/linkProposals.ts` has its own code-masking copy | B04 review | B13 | **Done in B13**: it uses `markdownCode.ts` and `LINK_SOURCE` |
| `run-build-phase/tools/phase-context.mjs` (about line 210) matches note cites by title words, a third note rule | B13 review | B14 (left by B12: outside its findings) | could use B04's import as `consistency-review/scripts/board-kit.mjs` does |
| The new agent suites (`consistency-review.test.mjs`, `workflows.test.mjs`) run by hand until `verify:board` runs every `*.test.mjs` under `agent/` | B13 | B12 | **Done in B12**: `verify` runs `node --test "agent/**/*.test.mjs"` (73 tests) |
| `apply-links.ts` and `link-index.ts` take the links root from the script's folder only, so a CLI test needs a named run folder | B13 | B14 | the R-31 env-path sweep |
| `kit:export` copies untracked, git-ignored files: the `.pdf-facts/` cache (project words) and a leftover `.origin-fixture/` (an unreadable file aborts the export); and `agent/shared-rules.test.mjs` and `tests/inPlace.test.ts` hold denied words, so a scratch export fails its leak check before B12's terms are reached | B12 | B14 (D-09) | **Done in B14**: built from HEAD (decision 29); the two test files reworded; the HEAD export passes |
| `tests/originLive.test.ts` leaves its `.origin-fixture/<dir>` behind when its hook times out under load | B12 | B15 (moved by B14, decision 29) | no longer reaches a kit (HEAD source); cleanup in a `finally` still open; **Done in B15**: cleanup in a `finally`, hook 60 s |
| `plan-state.mjs` reads each changed item's current status from the working tree even with `--to` (the R-138 class) | B12 SPEC | B14 or none | display only; regrade-ids now reads at the ref |
| The 5 s and 10 s Vitest timeouts recurred in B12's full runs at load 20 to 46 (`originLive`, `api`, `catalogue`, `skillInstall`); each passed alone and the next full run was green | B12 | B14 | the timeout rows above; **moved to B15** (decision 29). B14's first full run lost `originLive`'s `afterAll` hook (10 s) at load 16 to 25; it passed alone (52 of 52) and the next full run was green; **Done in B15**: Vitest `hookTimeout` 60 s (the hooks were what failed); final `verify:board` green at load 16 to 19; individual test limits unchanged (deferred, watch) |
| B14's code rows not taken (decision 29): the escaping base folder warning, `resolve-source`/`new-artifact` unguarded facts, tests-only tsconfig, `steps.ts ?? []`, `phase-context.mjs`'s note rule, `plan-state --to`, the git-test timeouts, `.origin-fixture` cleanup | B01 to B13 | B15 | each row above keeps its note; B15 judges them; **B15: deferred** to the board owner, each listed in CLOSING-REVIEW section 7 (the `.origin-fixture` cleanup and timeouts done in B15) |
| No upgrade mode for a board already adopted: an adopter re-exports to a fresh folder and copies over by hand (README, ADOPTING "Upgrading") | B14 (B14-Q2) | none | a `kit:export --upgrade` that keeps `requirements/` and the "This repo" blocks would be later work |
| `e2e/board-edges.spec.ts` (real-catalogue project) fails its three tests ("edges missing on load", 322 missing) on the pre-B14 board too (a scratch copy of `0047a169`, own port) | B14 | B15 | not B14 code: `board-edges` is untouched; B11's canvas area; **Done in B15**: a stale spec (Mapped is the default since 1.12); it now pins Freeform, 3 of 3 |
| A screenshot kept because another item lists it is never revisited once that item drops it (the check does not flag an unlisted file) | B14 review | none | documented in README's capture Output; a later recipe run removes it |
| `requirements/SCHEMA.md`'s Sources examples cite this project's RFP (`"RFP p.27 · Pricing Engine ..."`, AR-15) and ship in the kit; no deny term matches them | B14 | B15 | neutral examples would read better; not a leak of people or numbers; **B15: deferred** to the board owner (kit); UP-6 |
| Card find has no DESIGN line (B10's suggestion) | B10 | none | left: DESIGN.md was not otherwise touched in B14 |
| Plan tools fall back to built-in status lists on an unreadable `board.config.json`, and read an unreadable `status-recodes.json` as none (SY-1); the board does the same for the recodes file, which also lowers the high-water mark (SY-4) | B15 systemic review | board owner | pre-existing; decision 16 kept the tools' reader; outcome 2 met with deviations |
| No page-level boundary over the masthead, problem pill and new-card button (SY-2) | B15 systemic review | board owner | D-06 named views and sheets only |
| Mermaid fence extraction (`shared/files.ts`) and the Diff splitter keep their own fence tests (SY-3, SY-5) | B15 systemic review | board owner | the second is B04's row |
| Two `git` spawns skip `gitEnv` (SY-6); `capture --only` recursion has no cycle guard (SY-7); `/API` spellings reach the SPA page (SY-8) | B15 systemic review | board owner | nits, no security effect |
| Layout PUT records a path-like card ID (CO-2); item delete removes screenshots after the atomic step (CO-3); rename detection unbounded on a huge repository (CO-4, unmeasured); a 409 when the patch already equals disk (CO-1, as D-04a states); CO-5 to CO-8 nits | B15 correctness review | board owner | pre-existing or by decision; see `review/CLOSING-CORRECTNESS.md` |

## Phase entries

### B15 · Closing audit · COMPLETE · 2026-11-20

Board 1.26.0 to **1.26.1**, on `board-fixes` in the programme worktree (master had nothing new; no merge). Audit
commit `d5499c70`; B15's code and doc changes in `f1f83eff` (checkpoint, the kit's source); this entry with the
closing report in the `B15 complete` commit. Decisions: accepted decision 30 (B15-Q4, Q5, Q7 asked; Q2 from the
kick-off prompt; Q3 settled by the session). Plan: `phases/B15-closing-audit/IMPLEMENTATION.md`. Report:
**`review/CLOSING-REVIEW.md`** (coverage, verdicts, proof, the five lists).

**Dispositions (B15 owns no finding; it verifies all 164).** Mechanical cross-check: 164 of 164 with exactly one
final disposition, 163 Fixed and R-35 Won't fix (decision 13); no gap, duplicate, conflict or move; every split
delivery has both halves. Fail-first re-run independently (B15-Q3 sample, 69 findings plus A-2, A-4, A-10) on the
pre-phase code and at HEAD: every one fails for its defect and passes now (R-07's plan-tool half is B12's
recorded guard). Four proofs the auditors could not show were re-run by B15: R-08 by hand on the old
`links:apply` (a removed link came back), R-102, R-12 and R-98 by their phase's own e2e spec on the pre-phase
code (ports 5791 to 5793). Evidence: `review/CLOSING-FAILFIRST-APP.md`, `review/CLOSING-FAILFIRST-TOOLS.md`.
A-1 to A-10 all hold at the audit commit (table in CLOSING-REVIEW section 2).

**What shipped (small confirmed fixes, B15-REQ-17):**
- `e2e/board-edges.spec.ts` pins Freeform: the real-catalogue project failed 3 of 3 (322 "missing" edges, on the
  pre-B14 board too) because Mapped became the default in 1.12 and joins only the open card's lineage; now 3 of 3.
  Test-only; the proof is that failing run and the pass.
- `tests/originLive.test.ts`: teardown in a `finally` with a 60 s limit (the audit-commit `verify:board` failed on
  its 10 s `afterAll`; `.origin-fixture/` folders were left behind).
- `vite.config.ts`: Vitest `hookTimeout` 60 s (the first final run failed `exportKit` and `skillInstall`
  `afterAll` cleanups at load 15 with all 1,191 tests passing; the rerun was green). A recorded manual check: a
  load-dependent timeout has no fail-first test.
- Docs (text only): README folder map, START-HERE `.claude/skills/` line, CHANGELOG 1.13.0's
  `/__open-in-editor` claim; CHANGELOG 1.26.1.

**Touch-rights edits (convention 11):** `tests/originLive.test.ts` (B01), `vite.config.ts` (B01, B14),
`e2e/board-edges.spec.ts` (B11's area), `README.md`, `starter/START-HERE.html`, `CHANGELOG.md` 1.13.0 line (B14's
docs, B01's entry); `PLAN.md` and `index.html` closing status only.

**Deviations:** (1) The audit commit is `board-fixes`' head, not master (convention 16). (2) Four fail-first
proofs needed B15's own runs (above). (3) Two test-harness fixes (timeouts) are proven by recorded failing runs,
not tests. (4) The live `plan.config.json` keys stay unwritten (decision 28: the owner applies them at the master
merge).

**Verification:** `verify:board` at the audit commit: red (`originLive` hook); final: **green** (77 files, 1,191
Vitest tests, check OK, 73 agent tests). Playwright: fixture 5482 and real 5483, **144 of 144**. `npm run check`
OK. Live plan tools read-only: exit 0, nothing written. Installed skills match `agent/` exactly. Kit from HEAD
`f1f83eff` to the scratchpad (outside any repository): 347 files, leak and reference checks clean, versions agree
(1.26.1), starter "This repo" blocks; in the kit `npm ci` (network), check, `verify` (1,142 Vitest, 72 agent) and
fixture e2e on 5792 **137 of 137**; ADOPTING in a scratch repo through `install-skills` (7 skills, 3 workflows).
No programme commit changed a record, `aa-prototype/`, `contract-picker-mock/` or the catch-up plan; root
`CLAUDE.md` only B12's recorded `verify:board` line.

**Review (B15-REQ-14):** three fresh Sonnet reviewers: unmet promises (with quality and conventions), systemic
regression (with origin security), correctness (with agent-tools truth); files `review/CLOSING-*.md`. 23 findings,
no programme regression. Fixed: UP-1 (`board-edges`), UP-2, UP-3, UP-5 (docs). Owed: UP-4/CO-9 (`lanes` key).
Not a defect: CO-1 (decision 20). Deferred to the board owner: SY-1 to SY-8, CO-2 to CO-8, UP-6 (Discovered rows).

**Outcomes:** 1 Met; 2 Met with accepted deviations (SY-1, SY-4); 3 Met; 4 Met; 5 Met; 6 Met with accepted
deviations (decision 13; `/__open-in-editor` by top-level visit); 7 Met with accepted deviations (the owed `lanes`
key). Systemic issues: 1, 3, 4, 5 Met; 2 Met with deviations.

**Doc facts (convention 12):** `requirements-board/README.md` Layout (`shared/statuses.ts`, `shared/bom.ts`,
`server/historyDir.ts`); `starter/START-HERE.html` "I edited a skill" answer; `CHANGELOG.md` 1.13.0 origin bullet
and the 1.26.1 entry; headers of `e2e/board-edges.spec.ts` (comment) and `vite.config.ts` (comment). Root
`CLAUDE.md` not edited (decision 30, Q7): its kit sentence could add that an export is built from HEAD and
refuses a used target; proposed to the user.

**Manual acceptance owed (the user):** the `plan.config.json` keys at the master merge (B12's entry); the
`CLAUDE.md` kit wording; an optional UI walk-through (CLOSING-REVIEW section 7).

**Programme status: COMPLETE** (decision 30, Q5). Next: merge `board-fixes` into master when the owner chooses
(convention 16), applying the owed migration then.

### B14 · Scripts, kit and docs · COMPLETE · 2026-11-20

Board 1.25.0 to **1.26.0**, on `board-fixes` in the programme worktree (master had nothing new; no merge).
Decisions: accepted decision 29 (D-09, B14-Q1 asked; B14-Q2 to Q5 settled from evidence), recorded before
building. Plan and evidence: `phases/B14-scripts-kit-and-docs/IMPLEMENTATION.md` (written alongside the first
bite rather than strictly before it; deviation 1). Every finding reproduced or held at `0047a169`; B05-Q6 was
already done by B05. Fail-first proofs ran the new tests against a `git archive 0047a169` copy in the
scratchpad through `*_UNDER_TEST` variables.

**Dispositions**

| Finding | Disposition | Proof (fails on `0047a169`, passes now) |
|---|---|---|
| R-05 | **Fixed.** Target checks before anything is read and again before the swap: the board, inside it or containing it (real paths, `realpathSync.native`), a folder with other files and no board, a link or file at `requirements-board/`, and any board without a matching `.kit-export.json` (added, removed or changed file) are refused, byte for byte unchanged; no `--force`. The swap is whole (incoming sibling, rename, restore on failure), keeping `node_modules` | `tests/exportKit.test.ts` (old: 13 of 17 fail; `--to ..` under the npm environment replaced the scratch board's catalogue with the starter and deleted `starter/` and the export script, R-05 exactly). Live: re-exporting into the scratch kit that had run its tests was refused, naming its `.history/` files |
| R-31 | **Fixed.** `scripts/userPath.ts` (`INIT_CWD` only when npm's script line names the running script); `artifact:new` file and `--mermaid` (inside checks on the resolved path), `export:csv --out`, `artifact:steps --out`, `links:index <out>`, `links:apply <dir>`, `kit:export --to`; printed paths via `shown` (`new-artifact`, `capture`, `recode-statuses`, `link-index`, `apply-links`, `export-csv`) | `tests/userPath.test.ts` (old scripts: 6 of 10 fail), `exportKit.test.ts` relative `--to` twice, no nesting |
| R-39 | **Fixed.** `pruneShots` keeps a generated file another item lists and the run names it with its users | `tests/captureFiles.test.ts` (new function; old prune deleted it) |
| R-129 | **Fixed.** After installing, every owned entry with no current source (manifest copy, link or folder of links into this board's `agent/`, dangling or not) is removed and reported; foreign entries never | `tests/skillInstall.test.ts` both modes (old: fail) |
| R-130 | **Fixed.** Junk never counts against ownership | same file, both modes (old: link mode fails) |
| R-131 | **Fixed.** `server/junk.ts` shared by install and export (a test asserts both import it); tracked `.claude/skills/svg-diagram/__pycache__` removed with `rm`; no dangling link under `.claude` | same file (old: both modes install `__pycache__`); `find .claude -type l ! -exec test -e` empty |
| R-132 | **Fixed** (B14-Q4): `installStatus` and its test deleted; no caller remains | grep |
| R-134 | **Fixed.** `parseOnly`: `--only X` and `--only=X`; missing, empty, flag, comma-only or repeated values exit 1 before any work | `captureFiles.test.ts`, `tests/captureArgs.test.ts` (old capture: 5 of 5 fail, exiting 0 after a full run that wrote `REPORT.md`) |
| R-148 | **Fixed.** `artifact:steps` defaults to `http://localhost:$BOARD_PORT` after `loadLaneEnv` (`server/laneEnv.ts`, now shared by Vite, capture, artifact:steps and Playwright); `--url` wins; skills and starter blocks updated | `userPath.test.ts` (old: always 5180); quoted and non-numeric `BOARD_PORT` cases |
| R-149 | **Fixed.** SCHEMA names statuses by role; the live notes README's "4 here" is a role; deny term `\b\d+ here\b` | `exportKit.test.ts` planted pin fails; HEAD export passes |
| R-152 | **Fixed** (B14-Q5): starter `notes/README.md` and `changes/README.md` ship, `SHARED_REQ` is SCHEMA only; the live notes README path is `docs/discovery-reference/Contract Files/` (exists) | `exportKit.test.ts` ships the starter guides; grep of the kit |
| R-153 | **Fixed.** Export-time reference check (`npm run` scripts and backticked board paths in shipped `.md`, `.html`, `playwright.config.ts`); `<!-- kit:omit -->` for source-only passages; `e2e/artifact-regions.spec.ts` (generic, ships) split from `artifacts-real.spec.ts` (project); START-HERE and README list run-build-phase | `exportKit.test.ts` planted script and path fail; the first real run flagged 16 lines, all fixed; the kit's region sweep passes on the starter |
| R-154 | **Fixed** per D-09: built from HEAD (`ls-tree` + one `cat-file --batch`), `--uncommitted` takes tracked files only and names every changed file; deny terms for the voice patterns' people (case-sensitive) | `exportKit.test.ts` (untracked and ignored files never ship; HEAD vs `--uncommitted`; planted person fails; "benefit", "michaelmas" pass). The old export died on `.origin-fixture/` (EACCES) |
| R-155 | **Fixed.** Install keeps the mode in use (manifest copy, board links link, none copy; `--link`/`--copy`); About shows the command with that meaning, `.claude` text and the commit claim corrected | `skillInstall.test.ts` (old: fails); in this worktree `install-skills` with no flag kept links (`git status -- .claude`: only the intended `__pycache__` removal and B13's new test-file link, both committed) |
| R-156 | **Fixed.** README skill list and Settings passage (fixed board name, `board` key and `project.locale` dropped on save), README `:48` and START-HERE `:139` | read-through below |
| R-157 | **Fixed** (B14-Q3): fixture `BOARD_E2E_PORT` (`BOARD_PORT` + 2), real `BOARD_E2E_REAL_PORT` (+ 3): 5182 and 5183 by default, 5482 and 5483 here | real project booted on 5483, fixture on 5482 (5181 was not bound, per the phase's port rule) |
| B05-Q6 | **Already done by B05** (decision 20): `artifact:new` moves without `git mv` | B05's `tests/newArtifact.test.ts` |

**What shipped:** new `scripts/userPath.ts`, `server/boardPaths.ts`, `server/laneEnv.ts`, `server/junk.ts`,
`e2e/artifact-regions.spec.ts`, `starter/requirements/notes/README.md`, `starter/requirements/changes/README.md`,
tests `exportKit`, `userPath`, `captureArgs`; rewritten `scripts/export-kit.ts`, `server/skillInstall.ts`,
`scripts/install-skills.ts`; changed `capture.ts`, `captureFiles.ts`, `shoot-steps.ts`, `export-csv.ts`,
`new-artifact.ts`, `recode-statuses.ts`, `playwright.config.ts`, `vite.config.ts`; `starter/deny.txt` (four
people, the "N here" pin); docs below.

**Touch-rights edits (convention 11):** `server/catalogueFs.ts`, `server/artifactFiles.ts`, `server/historyDir.ts`,
`server/pdfFactsStore.ts` (env values through `envPath`); `scripts/link-index.ts`, `scripts/apply-links.ts`
(B13's, path lines only); `agent/skills/consistency-review/SKILL.md` (step 7 check wording),
`agent/skills/update-build-plan/SKILL.md` (two `verify:board` mentions to the board's `verify`), the add-artifact
and svg-diagram SKILL.md lines on ports and the region spec; `agent/shared-rules.test.mjs` (B04: a denied word in
a comment; the note comparison skips when a catalogue has no notes, as the kit's starter has none),
`agent/workflows/workflows.test.mjs` (B13: a denied name), `tests/inPlace.test.ts` (B05: a denied name),
`tests/writeModel.test.ts` (B05: "more than 10 artifacts" became "every sidecar on disk"), the 17 fixture spec
headers (their fixed port wording); `requirements/README.md` (this project's folder guide, the ID line);
`docs/board-fixes/index.html` (PHASE STATUS, D-09).

**Deviations:** (1) IMPLEMENTATION.md was written alongside the first bite, after the decisions were recorded.
(2) The baseline `verify:board` overlapped the first edits; B12's green run at `0047a169` stands as the baseline.
(3) The reference check found more than R-153 named (root-only `verify:board`/`dev:board` in skill bodies and
SCHEMA), fixed. (4) Two earlier phases' tests assumed this project's catalogue (more than 10 artifacts, some
notes) and failed in the kit; both fixed under touch rights. (5) `vite.config.ts` now loads every `.lane.env` key
(was `BOARD_PORT` only), documented as intentional. (6) R-157's proof did not bind 5181 (the phase forbids it);
the change itself means no e2e board takes it.

**Verification:** `npm run verify:board` green after the review fixes (77 files, 1,191 Vitest tests; check OK; 73
agent tests). The first full run lost only `originLive`'s `afterAll` hook (10 s) at load 16 to 25; it passed
alone. Playwright here: fixture `status-picker` and `origin` 7 of 7 on 5482; real project on 5483: the two
`artifact-regions` and two `artifacts-real` tests pass; `board-edges` fails its three tests on the pre-B14
board as well (Discovered). **Kit:** `kit:export` from HEAD `07bf7964` to the scratchpad: 347 files, leak and
reference checks clean; in the kit (`node_modules` linked) `check` OK, `tsc -b`, Vitest 1,142 passed (12 skipped,
the starter-only and project-only tests), agent tests 72 passed (1 skipped) after the shared-rules fix, and
`BOARD_E2E_REAL=1` region sweep 2 of 2 on 5492 and 5493.

**Review (convention 15):** two Sonnet reviewers (diff about 1,600 added lines). Neither found a blocking issue;
both confirmed every finding and SPEC row met. Confirmed and fixed: the incoming copy outside the swap's `try`
(a failed copy left a folder that then blocked the target; leftovers are now ignored), link ownership by
substring (a link to another copy of a board counted as ours; now resolved against this board's `agent/`),
`realpathSync` without `.native` (wrong-case paths on macOS), renames in `git status` (`--no-renames`), quoted
or non-numeric `BOARD_PORT` falling back silently, the loosened artifact-count assertion, README's script map
naming `export-kit` in the kit, the upgrade wording (it overwrote filled-in "This repo" blocks), the
`package-lock.json` wording, and missing tests (dry run, relative `--to` twice, `--to ..` refusal). Regression
tests added for the ownership, swap, port and test-gap items. Not taken: Reviewer 2's claim that a nested npm
call keeps the first `INIT_CWD` (the phase brief and SPEC record that it is the outer script's folder);
low-`BOARD_PORT` collisions (documented: keep worktree ports 4 apart); kept shared shots never revisited
(documented).

**Doc facts (convention 12):**
- **`requirements-board/README.md`:** the `agent/` paragraph (run-build-phase, link mode per top-level entry,
  mode kept, stale removal, junk); the command list (`dev`, `test:e2e` ports, `artifact:steps`, `install-skills`,
  `kit:export` in `kit:omit`); Settings sentence and the run-from-root and **Environment** paragraphs; server and
  scripts maps; `HISTORY_DIR` relative rule; the backslash screenshot line; the fixed board name and dropped
  `board` key after Project config; capture `--only` and Output (kept shared shots); Adding artifacts (paths,
  `artifact:steps` port); "Sharing the board" rewritten (source, checks, target rules, upgrade) inside `kit:omit`.
- **`requirements-board/ADOPTING.md`:** the kit paragraph and **Upgrading**; step 1 `.pdf-facts/`; step 2 folder
  guides; Settings; add-artifact and svg-diagram URLs; `lanes` key; step 5 install (removal, junk, links per
  top-level entry, mode kept); step 7 ports and `artifact-regions.spec.ts`, deny list wording.
- **`requirements/SCHEMA.md`:** line 6 dev command; `id` rows for items and artifacts; the lane merge; the
  recode lock; the handed-on `page_offset`; Conventions (retire rather than delete, IDs after a delete, retire
  artifacts, answering a question by role, never a status by number).
- **`requirements/notes/README.md`:** data path, the answered role. **Starter:** `START-HERE.html` (version and
  commit, Settings line, run-build-phase row, port tip), `requirements/README.md` (config row, IDs),
  `this-repo/add-artifact.md` and `svg-diagram.md` (dev server URL).
- **About page** (`src/views/AboutView.tsx`): the skills lede (commits), the `dev` and `install-skills`
  commands, the `.claude/skills/` sentence.
- **SKILL.md:** add-artifact ("This repo" URL, the region spec and `artifact:steps`), svg-diagram ("This repo"
  URL, step 8), consistency-review step 7, update-build-plan screenshot section.
- **Headers:** `export-kit.ts`, `install-skills.ts`, `skillInstall.ts`, `shoot-steps.ts`, `export-csv.ts`,
  `new-artifact.ts`, `playwright.config.ts`, `vite.config.ts`, the new modules. **`CHANGELOG.md`** 1.26.0.
- **Whole-file pass, confirmed true:** every earlier phase's Doc facts in README (B01 serving, B03 load and crash
  bullets, B04 one-rule section, B05 save, write, lanes and Delete bullets, B06 sheets and config paragraph,
  B07 watcher, screenshot-version and kept-moves bullets, B08 History, B09 Diff review, B10 artifacts paragraph,
  B11 Mapped bullet, B12 `verify` and capture Output, B13 linking and consistency); SCHEMA's statuses paragraph
  matches B02's registry (removed statuses, no reissue, damaged lists, recode rules); the starter config and
  `starter/this-repo/update-requirements.md` agree on codes; B12's plan keys (`lanes`, `runner.context.*`,
  `plan-state --from`) are in the update-build-plan and run-build-phase SKILL.md files and now ADOPTING.
  DESIGN.md: B09 to B11's lines read as their entries say; card find still has no line (Discovered).

**What later phases need:**
- **B15:** export with `npm --prefix requirements-board run kit:export -- --to <scratch>` after committing (HEAD
  source; `--uncommitted` to try work); never into this repo; a used kit is refused by design, so export into a
  fresh folder each time. Playwright ports: `BOARD_PORT` + 2 and + 3 (`BOARD_E2E_PORT`, `BOARD_E2E_REAL_PORT`).
  Rerun `tests/{exportKit,userPath,skillInstall,captureFiles,captureArgs}.test.ts`. Judge the code rows moved by
  decision 29 and the `board-edges` failure (Discovered).
- **The owner:** nothing to migrate. Lanes get the new install and capture rules at the master merge; their
  commands keep their meaning (`install-skills -- --link`, `capture --only ... --dry`, `artifact:new`).

### B12 · Build-plan tools · COMPLETE · 2026-11-20

Board 1.24.0 (B13) to **1.25.0**. Plan and evidence: `phases/B12-build-plan-tools/IMPLEMENTATION.md`.
Decisions: accepted decision 28 (D-08, B12-Q3, B12-Q6), asked in this session; decision 16's R-07 rule
applied (D-03 not needed). Worktree `AnaesthesiaAssociatesRFP-board-B12`, branch `board-fixes-b12`. Master
merged first (`58e0b6ba`, the wave 4 join: prototype, catalogue and screenshots only); `board-fixes` merged
before finishing (B13, 1.24.0: its decision took number 27, so B12's is 28; PROGRESS and PHASE STATUS keep
both sides).

**Dispositions** (every proof failed on the pre-B12 tools, `git archive 58e0b6ba` in the scratchpad, and
passes after, unless the row says otherwise)

| Finding | Disposition | Proof |
|---|---|---|
| R-14 | **Fixed.** An `IN PROGRESS` row (or status.json `in_progress`) is partly built, never built, in `built` and `builtByEntry`, so plan-state, `recipe-status --check` and the pack treat it as unbuilt; entry-only stays built; `keepBaseline` and the returned fields unchanged | `config.test.mjs` R-14; existing `phaseStatus` test passes |
| R-15 | **Fixed.** `last.json` keeps one record per check: a quick (`--changed`) PASS or OMIT never replaces a FAIL or SKIP on record; a full-form pass (`--only`, `--failed`, the gate) clears it; shape `{ at, changed, results }` kept (per-result `form` added) | `phase-check.test.mjs` (gate fails, `--changed` green, `--failed` re-runs; `--only` clears; a pre-B12 file read, old keys kept) |
| R-16 | **Fixed.** `regrade-ids` compares each id's out-of-scope verdict at the baseline and at `<ref>`: into scope is re-graded (`scopeChanged`), out of scope is listed under `dropped`; an in-scope-to-in-scope lane move stays cosmetic | `regrade-ids.test.mjs` (moved out, moved in, between lanes, retired, feature flip) |
| R-17 | **Fixed** per D-08: `laneStatus` and `phaseStatus(c, root, { lanes: true })` (plan-state, apply-plan-update's kept baselines, `recipe-status --check`) read each configured lane branch's `complete`/`checkpoint` commits and progress rows; declared but unconfigured lanes, or a configured branch that does not exist, make plan-state say so and apply-plan-update refuse (`--ignore-lanes`); the pack reads its own branch only | `config.test.mjs` (fixture master plus two lane branches; inside a lane the own view is unchanged); `apply-plan-update.test.mjs` guards; live, read-only: with the proposed key on a plan copy, Lane B's `39b complete:` reads built and Lane A's checkpointed 39a partly built (master alone: neither) |
| R-18 | **Fixed.** A fresh-plan remake keeps an old doc only for the same slug and moves to the new path once a doc is written there; the old one is reported (`superseded`, stderr), never deleted (Q6); an update run (`architect:update`) keeps every existing path | `apply-plan-update.test.mjs` (fresh remake; update run; renamed slug with no new doc) |
| R-19 | **Fixed.** A track range expands over that track only; a number followed by a month is not a phase. Live: 26's previous phase is U6 (was 25a), U6 holds its step alone | `phase-context.test.mjs` R-19; compatibility diff |
| R-135 | **Fixed.** `plan-state.mjs --diff <IDs> --from <sha>`; bare `--diff` byte-identical; the pack prints the command with its own baseline (also in each cut diff); SKILL Stage 2 step 1 | `plan-state.test.mjs`; `diffIds` case; live `plan-state --diff` byte-identical |
| R-136 | **Fixed.** `needs`/`after` canonicalised after load | `phase-check.test.mjs` (alias waits; failed alias skips the dependent) |
| R-137 | **Fixed.** A cycle is a config error at load (exit 2 naming it, before the lock) in every scheduling mode; `--stop-servers` and `--capture` still run; the scheduler ends never-ready checks as SKIP (RED) instead of spinning | `phase-check.test.mjs` (old tool hung 30 s, now exit 2 in all modes, no lock, nothing started) |
| R-138 | **Fixed.** `regrade-ids` reads item list (`git ls-tree`), heads, recodes, board config and question `affects` at `<ref>` in one batch | `regrade-ids.test.mjs` (uncommitted edits ignored) |
| R-139 | **Fixed.** A non-dry `capture.ts --only` run rewrites `REPORT.md` as a full run would, with its IDs from this run and failures outside it carried over (`scripts/captureReport.ts`); unreadable recipes are marked `invalid recipe:` and never carried; SKILL Stage 5 step 6 says to check the report | `tests/captureReport.test.ts`; manual walk on a scratch catalogue with a stand-in page on 5573: the final capture fails FT-01.6 and its stories; after the fix the **old** `--only FT-01.6` left "Failed recipe 5" with FT-01.6 listed, the **new** one moved FT-01.6 back to Captured (220 + 4 failing stories = the full run's 224), totals agreeing with rows |
| R-150 | **Fixed.** run-build-phase's body names roles (state version, demo guide, source rule, the decisions section); "This repo" gains State version, Source rule, the demo guide's large page and the progress headings; starter placeholders added; `starter/deny.txt` gains `PERSIST_VERSION`, `master-demo-guide`, `\bRFP rule`, `demo clock`, `control panel` | grep of the body outside "This repo" finds none; scratch `kit:export`: a term planted in the body is flagged; no B12 file is flagged. The export as a whole still fails on leaks from before B12 (Discovered) |
| R-151 | **Fixed.** Generic "not a phase" words in code (a `*_VERSION` constant generically); project nouns and `BK0` from `runner.context.countNouns` / `notPhaseBefore`; `decisionsSection` / `handoffSection` (defaults "Decisions log", "Discovered for later"); a configured heading the file lacks is noted | `phase-context.test.mjs` R-151; live packs for every unbuilt phase identical with and without the proposed keys (only built 25 and 29 differ) |
| R-164 | **Fixed.** `readBlobs` (one `git cat-file --batch`), `sidesMany`, `substanceVerdicts` (recodes once); `changedInSubstance` and `substanceDiff` keep their signatures; regrade-ids, phase-briefs and the pack batch | `regrade-ids.test.mjs` (about 200 entries under 20 git processes; the old tool hundreds); on this repo's 110 real entries verdicts and diffs identical to the 1.23 functions, 0.3 s against 40 s |
| R-07 (plan-tool half) | **Fixed; R-07 closed** (B02's board half and this). `normaliseStatus` unchanged (decision 16) | `scope.test.mjs` (idempotent after a fresh-code renumber; the board's `recodeHistoryProblems` flags an overlap; this catalogue's history reads as today). A guard, not fail-first: no plan-tool code changes; the fail-first proof is B02's `tests/recodeStatuses.test.ts` (convention 13 exception, recorded) |
| A-4 | **Confirmed and Fixed.** Lane rows render under "Start now" whether or not a phase is safe | `build-index.test.mjs` A-4 (failed on the old tool: no lanes) |
| A-10 | **Confirmed and Fixed.** The "re-plan first" flag compares both sides through `normaliseStatus`; one answered since still flags | `build-index.test.mjs` A-10 (the old tool flagged the question answered before the recode) |

**What shipped:** `update-build-plan/tools/`: `config.mjs` (`parseProgress`, `phaseStatus` lanes view,
`laneStatus`, config `lanes`), `req-changes.mjs` (`readBlobs`, `sidesMany`, `substanceVerdicts`),
`regrade-ids.mjs` (rewritten), `scope.mjs` (`statusesFrom`), `plan-state.mjs` (`--from`, lanes, `lanes`
key), `apply-plan-update.mjs` (guard, slug rule, `superseded`), `recipe-status.mjs`, `phase-briefs.mjs`,
`build-index.mjs` (A-4, A-10); `run-build-phase/tools/`: `phase-check.mjs` (merge, canonical deps,
cycles, backstop), `phase-context.mjs` (vocabulary, run order, `--from` command, section names, batched
drift); both SKILL.md files; new tests `phase-check`, `config`, `regrade-ids`, `apply-plan-update`,
`plan-state`, `build-index`, `scope` (`*.test.mjs`) and `tests/captureReport.test.ts`.

**Touch-rights edits (convention 11):** `scripts/capture.ts` and new `scripts/captureReport.ts` (B14's
next), `starter/deny.txt`, `starter/this-repo/run-build-phase.md`, `package.json` (`verify`), root
`CLAUDE.md` (the `verify:board` line), `README.md` and `ADOPTING.md` lines (Doc facts),
`docs/board-fixes/index.html` (PHASE STATUS).

**Migration for the plan's owner (decision 28, at the `board-fixes` to master merge; additive, inert to
today's tools):** in `docs/prototype-build/catch-up/plan.config.json` add the top-level key
`"lanes": { "branches": ["lane/a", "lane/b"] }`, and under `runner.context`
`"countNouns": ["Lists?", "Bookings?", "Procedures?", "Contracts?", "patients?", "invoices?"]` and
`"notPhaseBefore": ["BK0*"]`. Without `lanes`, plan-state warns and apply-plan-update refuses while
`status.json` declares lanes; without the context keys, no live pack of an unbuilt phase changes today.
**For the lanes:** nothing until that merge; afterwards run-build-phase tells a resumed phase to use the
pack's `--from` command, and `--failed` remembers the full gate (both backward compatible).

**Deviations:** (1) Decision number 28, not 27 (B13 took 27 first). (2) The guard also refuses a configured
branch that does not exist (review). (3) The R-07 proof is a guard (see its row). (4) The R-150 export
proof could not show a passing export: leaks from before B12 fail it (Discovered). (5) The report header
line now says a limited run updates its rows, so the next full capture changes `REPORT.md`'s third line once.
(6) `regrade-ids` judges both sides by the target's recodes and roles (decision 16's rule).

**Verification:** `npm run verify:board` green after the final `board-fixes` merge (74 test files, 1,141
Vitest tests; check OK; 73 agent tests, B13's two suites included). Other full runs at load 20 to 46 timed
out in `originLive`, `api`, `catalogue`, `skillInstall` and `diffUi` (5, 10 and 30 s limits); each passed
alone and the next full run was green (the timeout rows below).
Live-plan compatibility, read-only (`scratchpad/compat.sh`, before and after): packs for 26, 27a, 33, 39a,
39b, 40, 41, 44, U6 differ only in the run-order line (R-19) and the `--from` command; `plan-state --diff`,
`phase-check --list` and `recipe-status --check` identical; plan-state adds the lane warning and `lanes`
key, regrade-ids `scopeChanged` and `dropped`, `config.mjs --json` `"lanes": null`. Writing tools ran only
on copies (`build-index` old and new on a plan copy: identical page but the generator comment) and fixtures.
Nothing written under `docs/prototype-build/`, the lane branches or `.git/lanes/`.

**Review outcomes (convention 15):** two Sonnet reviewers (diff about 1,300 added lines). Confirmed and
fixed: the guard missed a configured branch that does not exist; a carried-over report failure could be a
stale unreadable-recipe line; an update applied without its outline label could repoint a doc to a missing
path; a cycle blocked `--stop-servers`; `--failed` wording said "full form" where the rule is any failure
on record; naming and comments (no "D-08" in tool code, `phaseState`, one `changes` in plan-state, the
"Start now" lead hoisted). Regression tests added for the first four. Not taken: the live packs missing
the project nouns until the migration (accepted by decision 28; no unbuilt phase's pack changes);
`unaccounted` comparing counts (a wrong branch name is now refused as missing).

**Doc facts (convention 12):** run-build-phase `SKILL.md` ("This repo": demo guide, State version, Source
rule, progress headings; body: Ground rules big files, Stage 0 step 2, Stage 2 intro and steps 1 and 6,
Stage 3 steps 2 and 5, Stage 4 step 2, Stage 5 steps 3 and 6, Stage 6 Built bullet and step 3, the tools
table, the `runner` paragraph); update-build-plan `SKILL.md` (in-progress rule, `progress` row, new
`lanes` row, `runner` row context keys, Stage 0 steps 2 and 3, `runReverse`, Stage 3 step 1, Fresh plan
step 4); tool headers and `--help` of `phase-check.mjs`, `phase-context.mjs`, `plan-state.mjs`,
`apply-plan-update.mjs`, `regrade-ids.mjs`, `config.mjs`, `capture.ts`; `requirements-board/README.md`
(`npm run verify` line, capture Output); `ADOPTING.md` (run-build-phase "This repo" list, `runner.context`
keys); root `CLAUDE.md` (`verify:board`); `CHANGELOG.md` 1.25.0. About page checked: nothing it says changed.

**What later phases need:**
- **B14:** verify the `starter/` changes (deny terms, run-build-phase placeholders) and the `capture.ts`
  report change rather than redo them; document the new keys (`lanes`, `runner.context.countNouns`,
  `notPhaseBefore`, `decisionsSection`, `handoffSection`) and `plan-state --from` in the whole-file pass;
  the export leaks and the timeout rows below are yours; `phase-context.mjs`'s note-cite title-word rule
  (B13's row) is left to you.
- **B15:** confirm the dispositions and the A-4 and A-10 verdicts with `build-index.test.mjs`; R-07 closes
  with B02's `tests/recodeStatuses.test.ts` and `scope.test.mjs`.
- **The plan's owner:** the migration above at the master merge.

### B13 · Consistency and linking tools · COMPLETE · 2026-11-20

Branch `board-fixes-b13` in worktree `AnaesthesiaAssociatesRFP-board-B13` (ports 5673, 5674, 5680), run as a
lane after convention 16. Caught up at start: `board-fixes` was the branch start; `git merge master` brought 11
commits of catalogue and plan files (no board code). Baseline `verify:board` green apart from the known load
timeouts (`originLive`, one `api` history test; both pass alone); agent `node --test` suites 29 of 29.
Decisions: accepted decision 27 (B13-Q1 to Q5 asked in this session; how a decision binds settled from the
SPEC's risk). D-03 consumed as B04 shipped it. Plan: `phases/B13-consistency-and-linking-tools/IMPLEMENTATION.md`.
All 14 findings reproduced at HEAD (owned files unchanged since `d4341735` apart from line drift).

| Finding | Disposition | Proof (fails on the starting code, passes now) |
|---|---|---|
| R-34 | **Fixed**: `guard.mjs` refuses edits outside the catalogue (`..`, absolute, links, another checkout), to `notes/`, `changes/`, `reference/`, a question's answer, a retired item or artifact, a protected artifact's sidecar or drawing, by any spelling of the name; a missing file or a folder is a `FAIL`. Protected ids reach `apply.mjs` in `changes.json` (`build-review.mjs --protected`, warned when left out or unknown; `apply.mjs --protected` adds). Full paths on the page | `consistency-review.test.mjs` REQ-01 (twelve cases plus a healthy change that lands; an outside file byte-identical) |
| R-140 | **Fixed**: a change applies whole or is `HELD`; the page checks a change's own edits in sequence and flags the same text replaced two ways (no longer dropped) | REQ-02 |
| R-09 | **Fixed**: fingerprints on every change and question; the page keeps decisions by fingerprint; exports, pasted text and `accepted-ids.txt` carry `id@fp`; `decisions.mjs` reads the file or the pasted text and names moved, stale and unverified decisions; `apply.mjs` refuses a changed one and needs `--unverified` for a bare id; question fixups by `Q-nn@srcFp`, plain keys pinned | REQ-03 (page in jsdom, file, pasted text, pre-phase file, apply) and the question-fixup test |
| R-20 | **Fixed**: unkept verifier questions shown "not reviewed by the final pass"; a consolidator may dismiss only with a reason, recorded in `dismissedQuestions`; consolidators list what each kept question covers (`from`) | REQ-04 (no consolidator, `null` consolidator, keep, merge, dismiss, reasonless dismissal) |
| R-21 | **Fixed**: `action` edit, redraw or flag; redraw only on a live, unprotected diagram; "flag only" pill; counts apart; old journals classified the same way | REQ-05 |
| R-144 | **Fixed**: series ids two digits up to 99, four past it (`S-0104`), never three; one change-id pattern on server and page | REQ-06 |
| R-141 | **Fixed**: ref-kit and build-packs resolve with `resolveNoteCite` (via `board-kit.mjs`); whole cites without points are one reference; no first-note guess; prompts and skills teach slug words; stage 1 is given the prefixes that resolve | REQ-07 (parity with the board over apostrophe, `&`, colon, non-ASCII notes); `workflows.test.mjs` REQ-07a |
| R-142 | **Fixed**: one shorthand key pattern for keys and terminators | REQ-07 (e) |
| R-143 | **Fixed**: Retired or replaced diagrams left out (`skippedDiagrams`); `/`-rooted files resolved from the repository | REQ-08 |
| R-145 | **Fixed**: `ownerShort` (default the first word of `owner`, the whole owner when that word is an article, "the product owner" with no owner) | `workflows.test.mjs` REQ-09 |
| R-147 | **Fixed** (warn and continue, decision 27): unmatched group topics logged and returned (`groupCheck`) with the catch-all count; this repo's groups realigned | REQ-10 (stubbed run; SKILL groups parse and match) |
| R-08 | **Fixed**: `linkRuns.ts`; `links:index` starts `.links/current/`, the previous run with proposals moves to `.links/runs/<start>/`; the workflow writes there; `links:apply` applies that run only and names it; loose old files listed, never applied by default; an empty run names the newest earlier run with proposals | `tests/linkRuns.test.ts` (two runs, a removed link not restored; loose files; a CLI dry run on a fixture catalogue whose report names the run) |
| R-133 | **Fixed**: positions in the field's original text, overlap skipped with a reason, spliced from the end; code by `markdownCode.ts` (B04), links by `LINK_SOURCE` | `tests/linkProposals.test.ts` (three new cases) |
| R-146 | **Fixed**: bare ids one batch each, lists one batch, mixes; a batch named twice runs once; anything else, or a non-list, returns an error before any agent | `workflows.test.mjs` REQ-13 |

**Fail-first evidence:** `consistency-review.test.mjs` against HEAD's scripts (`CR_SCRIPTS=<HEAD copy>`): 9 of 10
fail on the behaviour (REQ-01 and REQ-05 with `CR_NO_PROTECTED=1`, since HEAD has no `--protected`: an absolute
outside edit was not refused; every action undefined); REQ-15 (preserved behaviour) passes on both.
`workflows.test.mjs` against HEAD's workflows (`WF_DIR`): 6 of 7 fail (`epics.join is not a function`; with HEAD's
parse error escaped, "## Conflicts for the" and "note title words"); the groups check failed on HEAD's SKILL.
`tests/linkProposals.test.ts` R-133 cases: 3 of 3 fail with HEAD's `linkProposals.ts`. `tests/linkRuns.test.ts`:
`linkRuns.ts` does not exist at HEAD, whose `apply-links.ts` reads every `*.verified.json` in `.links/`.

**What shipped:** new `scripts/guard.mjs` (edit rules, fingerprints, id scheme) and `scripts/board-kit.mjs` (the
board's note rule, retired-artifact and artifact-path rules, one home) in `agent/skills/consistency-review/`;
changed `apply.mjs`, `build-review.mjs`, `decisions.mjs`, `ref-kit.mjs` (`makeResolver` now async),
`render-rulings.mjs`, `build-packs.mjs`; the three workflows; new `scripts/linkRuns.ts`; changed
`scripts/apply-links.ts`, `scripts/link-index.ts`, `scripts/linkProposals.ts`. Tests:
`agent/skills/consistency-review/consistency-review.test.mjs`, `agent/workflows/workflows.test.mjs`,
`tests/linkRuns.test.ts`, three cases in `tests/linkProposals.test.ts`. Board 1.24.0 (lock file by `npm install`).

**Deviations:** (1) Found and fixed in territory: `consistency-rulings.js` had not parsed since `d4db2772`
(2026-10-20, an unescaped backtick around `answered` in a template literal), so stage 1 could not run; the REQ-09
proof covers it. (2) The run folder is `.links/current/`, with earlier runs under `.links/runs/<start>/`, so the
workflow's default `outDir` needs no new argument (decision 27's behaviour; the folder name differs from
"runs/<time>" as first described). (3) A dismissal needs a reason, a new consolidator field (`dismissedQuestions`)
and `from` on kept questions (SPEC left the shape open). (4) `board-kit.mjs` added after review to keep one copy of
the board-import and artifact rules. (5) `apply.mjs` is now `parseArgs`-based; unknown options it never had
(none were documented) are refused.

**Verification:** `npm run verify:board` green (73 files, 1,136 tests; one earlier full run at load 23 to 38 lost six git and live-server tests to 5 s and 10 s timeouts, all 196 tests of those files passed alone, then the full run passed); `node --test` over every `*.test.mjs` under
`requirements-board/agent/` (the new suites run by hand until B12 adds them to `verify:board`):
`node --test $(find requirements-board/agent -name '*.test.mjs')`. Read-only dry runs on the real catalogue:
`build-packs.mjs` into the scratchpad (81 units, 13 live diagrams, AR-30 and AR-52 left out, every cited note
point found); `ref-kit` on the R-141 cites (the slug cite with and without points opens the 2026-11-05 decisions
note; the title-words cite and "Notes <date> #3" are unresolved, as on the board). `apply.mjs` and `links:apply`
were never run on the real catalogue. No Playwright spec touched.

**Review (convention 15):** two Sonnet reviewers. Reviewer 1 (completeness, correctness): one blocking (a
name clash left mid-refactor, caught before commit), case-variant names bypassing the refusals on macOS, a folder
path crashing the tools, `links:index` archiving runs with no proposals, reasonless dismissals, legacy decisions
losing their verdict, the protected list replaceable from the command line, an absolute path into another checkout
re-pointed at this one, an `inside` edge, an article as the owner's first word, unreadable ids dropped silently,
two changes sharing a fingerprint, non-list batches; plus test gaps. Reviewer 2 (quality, compatibility, docs):
the protected list could be forgotten silently, duplicated retired and path rules and board imports, an empty run
silent in `links:apply`, the group-check wording, fingerprint prefix matching inconsistent, dead fields, duplicate
batches, every note prefix in every extractor prompt, `ownerShort` undocumented. All verified against the code and
fixed with regression cases, except: Reviewer 2's "manual test command" (recorded here and for B12) and its note
that `phase-context.mjs` keeps a "title words" note rule (B12 territory, below). Docs truth was checked and found
accurate.

**Touch rights (convention 11):** `starter/this-repo/consistency-review.md` (B14's kit text: `--protected`, the
group warning, `ownerShort`); `agent/skills/update-requirements/SKILL.md` and `agent/skills/add-artifact/SKILL.md`,
only the sentences on note cites and linking (PLAN territory).

**Doc facts (convention 12):** consistency-review `SKILL.md`: This repo (`--protected`, realigned groups, the
group check), Stage 0.2 (live diagrams, `skippedDiagrams`, note points), Stage 1.2 (slug words), Stage 2 (actions,
questions kept, merged or dismissed), Stage 3.1 (command with `--protected`, id scheme, fingerprints, actions,
refusals, whole changes), Stage 3.2 (fixups change fingerprints; `Q-nn@srcFp` keys), Stage 4.1 to 4.3 (decisions by
fingerprint, `--unverified`, `HELD`), Stage 4.6 (redraws only; flags acknowledged). update-requirements `SKILL.md`
source forms (slug words) and Stage 5 step 2 (batch shapes, run). add-artifact `SKILL.md` note bullet. README.md
script list (`links:index`, `links:apply`), "Linking requirements" steps 1 to 3, "Consistency review" paragraph.
Workflow `meta.whenToUse` and args comments (link-requirements; consistency-rulings `ownerShort`;
consistency-changes groups). Starter consistency-review "This repo". About page unchanged (still true).

**For later phases:** **B12**: add `agent/skills/consistency-review/consistency-review.test.mjs` and
`agent/workflows/workflows.test.mjs` to `verify:board` with the other agent tests (accepted decision 6);
`run-build-phase/tools/phase-context.mjs` (about line 210) matches note cites by title words, a third note rule
(could use `board-kit.mjs`'s `boardNoteRules` or B04's import). **B14**: R-31 sweep of `link-index.ts` and
`apply-links.ts` (the links root is `<script>/../.links`; a `--links-dir` or env path would let a CLI test run
without a fixture copy); command shapes: `links:index [-- <out.md>]` starts a run beside its output,
`links:apply [-- <dir>] [-- --dry-run]` defaults to `.links/current`; `build-review.mjs --protected`,
`apply.mjs --unverified --protected`, `decisions.mjs <file or pasted text>`; README and SKILL lines above. **B05**:
nothing new (`apply-links.ts` still writes through `writeItem`). **B15**: rerun the B13 proofs.

### B11 · Board canvas and views · COMPLETE · 2026-11-20

Board 1.22.0 to **1.23.0**. Plan and evidence: `phases/B11-board-canvas-and-views/IMPLEMENTATION.md` (plan, "As built", the
manual keyboard walk, "Recovery"). Decisions: accepted decision 25 (B11-Q1, Q3, Q4, Q5 asked in this session; Q2 and R-128's form
settled from evidence); the SPEC marks them answered. Inherited D-06 and decision 20 (B05's lane route). No master merge was needed.
All 13 findings reproduced at HEAD `30e2155f` by reading (line drift only), then as failing tests.

**Dispositions**

Proof files: `tests/boardCanvas.test.ts` (layout, graph, moves through `dragLayout`), `tests/boardWalk.test.ts` (walk, camera),
`tests/laneMerge.test.ts` (API), a B11 block at the end of `tests/store.test.ts`, `tests/listViews.test.ts` (jsdom), and
`e2e/board-canvas.spec.ts` (fixture board 5182, 11 tests).

| Finding | Disposition | Proof |
|---|---|---|
| R-29 | **Fixed**: `mappedLayout` puts every card no epic reaches (missing or wrong-type parent, parent cycles) in the orphan column, each followed by what hangs under it (cycle-safe, each once), lane by lane; no add slot, never a drop column | boardCanvas R-29 block (every card placed as in Freeform, no overlap, lane counts and heights); e2e "R-29": a story under a feature whose epic is missing is drawn and search finds it (1 match, opens) |
| R-113 | **Fixed**: `isShown` (graph.ts) shows the open card's ancestors too (cycle-safe), so Mapped gives a retired feature its column while a story under it is open; the merged sub-finding by `dragHold`'s `keepDirect` (the direct column held in the hit-test map and the drawn preview) | boardCanvas "draws a live story under a retired feature ..." (both modes) and "an epic's only direct story dropped back ... writes nothing"; e2e "R-113" |
| R-114 | **Fixed** (B11-Q1): `mappedLayout`'s `open` draws the open card alone at the top of its collapsed lane's strip, which grows by one card; the lane stays collapsed | boardCanvas "draws the open card alone in its collapsed lane ..."; e2e "R-114" (Show on board into collapsed MVP: drawn, in view right of the panel, clear of the next lane's header) |
| R-86 | **Fixed**: `planMove` counts the slot within the moving card's own run of the drawn stack (live peers for a live card, retired for a retired one), so its neighbours are in file order and a drop between them keeps it | boardCanvas: foot drop with Show retired on and off (one file written, below every live card, preview equals commit); drop back in place with a retired card between neighbours, for every card; `move.test.ts` unchanged and green |
| R-115 | **Fixed**: the walk and Enter run only from the page, the pane or a card; any button, link, field, menu, menu item, toolbar or dialog inside the canvas keeps its keys | e2e "R-115" (Enter on Add lane opens its box with focus; Enter on a lane toggle collapses it; arrows on it leave the card; Enter from the page still moves into the panel); manual walk |
| R-116 | **Fixed**: walk, search open and Show on board are an **aim**, made once after the render that draws the selection, at max(zoom, 0.9) (Show on board 1), with geometry from the board's own layout; the plain selection pan (click, link, Back) runs only when no aim is pending, at the current zoom | e2e "R-116" with and without reduced motion (search Enter and a step from 0.3 end at 0.9; a click keeps the zoom); manual walk (zoom 0.90 every step; before it drifted 0.90 to 0.76) |
| R-117 | **Fixed**: `src/board/camera.ts` `centreViewport` puts a card wider than the board with its left edge 24 px right of the panel, else centres it; `cardInView` is the old test, so no second pan | boardWalk camera block; e2e "R-117" (ArrowUp to an epic at zoom 1.4: title right of the panel, no second pan) |
| R-118 | **Fixed** (B11-Q3): `src/board/walk.ts` `walkStep`, pure: Left/Right among the same type under the same parent as drawn; Up/Down down a story's column as drawn (Mapped lane by lane, live first, collapsed lanes skipped but the open card; Freeform the stack order), Up from the top to the parent, Down from a feature or epic to the first card drawn under it; the orphan column included | boardWalk (6 walk cases in both modes, and the orphan column); e2e "R-118"; manual walk across epics, features, stories and a collapsed lane |
| R-119 | **Fixed** (B11-Q2): `POST /api/lanes` rename onto another lane's name in any case (the first lane's too) merges in the same all-or-nothing write (`laneMergeTarget`, `shared/move.ts`); the store sends it as a rename; a case-variant or first-lane band offers **Move into ‹lane›**; a typed merge asks first (review) | laneMerge (case band, first-lane band, named onto named and onto the first lane, plain renames unchanged, failure part way and damaged layout leave every file); store "sent as a merge"; e2e "R-119" (Move into, then a typed rename asks and merges) |
| R-120 | **Fixed** (B11-Q4): `followCollapsedLane` (store) moves a renamed lane's key, drops it on merge and delete, and Add lane drops any key of the new name; read and written only through `useView` (B03's `fields` and `writeJson`); no pruning | store B11 block (rename keeps, delete drops, stale key cleared, merge leaves the target, refusal leaves all); e2e "R-120" (collapsed through rename and reload; deleted then re-added starts open) |
| R-126 | **Fixed** (B11-Q5): while searching the twisty is faint and inert, and the three bulk buttons are `aria-disabled` with a described note | listViews (folds in the page and in `localStorage` unchanged by twisty clicks while searching; bulk buttons inert, then working) |
| R-127 | **Fixed**: About's scroll effect keys on `location.key` as well as `s` | listViews (a contents link to the section in the URL scrolls again; another section scrolls) |
| R-128 | **Fixed** (decision 25): a picked owner stays an option while applied | listViews (the control reads the owner, All owners clears it, the stepper agrees with the list) |

**Before-proofs:** new unit tests on an archive of `30e2155f` in the scratchpad, with stubs reproducing the old board's own code for
the new seams (`dragLayout` as BoardView's old rest layout, `walkStep` as its old sibling walk, `centreViewport` as the old
midpoint): boardCanvas 9 of 12 fail (the 3 passing are preservation checks: no orphan add slot, a hidden feature with nothing open
takes no column, the foot drop with Retired off), boardWalk 6 of 8 (Freeform file order and narrow centring pass), laneMerge 5 of 6
(a plain rename), the store block 4 of 5 (a refusal), listViews 4 of 4. The e2e spec ran with the pre-B11 sources swapped in: 9 of
11 fail; the reduced-motion R-116 case passes (no ease, nothing to re-target) and is a preservation check. Each review regression
(the drawn lane, the orphan walk, the stale aim) was shown failing against this phase's first cut.

**What shipped:**
- **New:** `src/board/walk.ts`, `src/board/camera.ts`; the tests above; `e2e/board-canvas.spec.ts`.
- **Changed:** `src/board/mappedLayout.ts` (orphan column, `open`, `keepDirect`, `laneFloors`, `dragHold`, `dragLayout`,
  `dropTarget(…, drawn)`), `src/board/graph.ts` (`isShown`), `shared/move.ts` (`planMove`, `laneMergeTarget`),
  `src/views/BoardView.tsx` (hold, aims, camera, keys, walk), `src/board/LaneHeaders.tsx` (Move into, `MergeAsk`, Add lane key),
  `src/store.ts` (`renameLane`, `deleteLane`, `setLanes` rev, `followCollapsedLane`), `server/catalogueApi.ts` (merge, `lanesRev`
  required), `src/views/OutlineView.tsx`, `AboutView.tsx`, `QuestionsView.tsx`, `src/styles.css` (`.twisty.inert`,
  `.btn[aria-disabled]`).

**Deviations:**
1. **Lane floors.** Beyond the SPEC's direct-column case, lifting the bottom card of a lane's tallest stack let a drop back in place
   land in the next lane; `dragHold` holds every lane at its drag-start height in the hit-test map and the preview.
2. **The lane under the pointer is read from the preview as drawn** (review), the slot from the hit-test map.
3. **A typed merge asks first** (review); "Move into" from the menu does not.
4. **D-04e's last legacy shape retired** (decision 20 assigned it to the phase removing its last caller): a layout PUT with `lanes`
   or `firstLane` and no `lanesRev` is a 400. A tab still running a pre-B11 board gets a 400 adding a lane until reloaded.
5. **Modified arrows never walk** (review; the old board hijacked Alt Left).

**Verification:**
- **`npm run verify:board` green:** 1,128 tests (72 files), check OK. One earlier run lost `originLive.test.ts` to its known Vite-boot
  timeout under load (passes alone, 52).
- **E2e (fixture, 5182):** `board-canvas` 11 of 11; `board-mapped` 13 of 13 (twice); `board-search`, `question-step`, `bad-data` and
  `edit-sheets` green; the full fixture project at load 29: 106 passed, 3 failed, each passing 3 of 3 alone (Discovered); `artifacts`
  with `diff` 59 of 59 after.
- **Manual keyboard walk** on 5480 over a scratch copy of the real catalogue, before and after (IMPLEMENTATION.md table).
- **Real catalogue:** `npm run check` OK, no errors; no file under `requirements/` changed. **Migration:** none (preferences keep
  their shape).

**Review outcomes (convention 15):** two Sonnet reviewers (about 450 changed lines outside tests).
- **Confirmed and fixed, each with a regression test shown failing first:** a finished aim blocked the click pan when the same card
  was reopened after Esc (both reviewers; e2e); the preview could grow the pointer's lane while the hit-test used the shorter one,
  flipping the target (reviewer 1; unit); Down from an orphan feature did not follow the drawn column (reviewer 2; unit).
- **Also fixed:** an aim with an unmeasured pane no longer moves the camera; modified arrows keep their jobs; a typed merge asks; the
  Outline bulk buttons stay focusable with a described reason; the drag hold is worked out without an earlier hold; `dragLayout`
  takes the hold (two layouts per drag start, not three); the leftover sort runs only when cards are unreached; the R-29 search
  proof (reviewer 1); doc wording (the orphan grouping is lane by lane, a split README sentence, DESIGN wrapping).
- **Recorded, not changed** (Discovered): a second lane write before the first answers is refused; a renamed collapsed lane shows
  open for a render; hidden cards sharing the open card's spot in a collapsed strip.
- **Not changed:** the render-time `placeRef` assignment (commented; the same pattern as `onKeyRef`); the orphan-drop test asserts
  the SPEC's rule as written (a drop never gets a null parent).

**Touch-rights edits (convention 11):**
- `server/catalogueApi.ts` (B05's): the lane route's merge form; the layout PUT's `lanesRev` requirement; the route comment.
- `src/store.ts` (B05, B07 and B06's): lane actions and `followCollapsedLane` only.
- Tests moved to the retired shape, intent kept: `tests/writeModel.test.ts` (the lane-list writes send `lanesRev`; "refused name"
  is now a padded name, since a rename onto `later` merges), `tests/api.test.ts` (the lanes block sends `lanesRev`).
- `playwright.config.ts` (B14's): the new spec in the fixture project.
- `docs/board-fixes/index.html`: B11 status.

**Doc facts (convention 12):**
- **`requirements-board/DESIGN.md`:** Interaction, two new bullets (the arrow walk and its controls; where a card lands); Board
  modes, the lanes bullet (Move into, a merge after asking, a collapsed lane with the open card, collapse follows board renames, the
  orphan column) and Drag feedback (lanes held, the lane as drawn, a card lands among its own kind).
- **`requirements-board/README.md`:** src map (`walk`, `camera`, `dragLayout`); the Mapped bullet (merge, Move into, `lanesRev` on
  every lane write, collapsed lanes follow, `dragLayout`/`dragHold`, the orphan column, `walk.ts`, `camera.ts`).
- **`CHANGELOG.md`** 1.23.0. **Headers:** `walk.ts`, `camera.ts`, `dragHold`, `dragLayout`, `dropTarget`, `isShown`,
  `laneMergeTarget`, `followCollapsedLane`, the lane route comment.
- **Checked, nothing changed:** the About page (its lane line "Rename and add them from the board's lane headers" stays true),
  SCHEMA (the `lanes` paragraph names no merge rule; B14 may add one), ADOPTING, the SKILL.md files.

**What later phases need:**
- **B14:** the DESIGN and README lines above in the whole-file pass; SCHEMA's `lanes` paragraph could say a board rename onto
  another lane merges; the Playwright config now lists `board-canvas.spec.ts`.
- **B15:** rerun `tests/{boardCanvas,boardWalk,laneMerge,listViews}.test.ts`, the B11 block of `tests/store.test.ts` and
  `e2e/board-canvas.spec.ts`; repeat the keyboard walk (IMPLEMENTATION.md) if a browser is at hand.

### B10 · Artifact viewers · COMPLETE · 2026-11-20

Board 1.21.0 to **1.22.0**. Plan and evidence: `phases/B10-artifact-viewers/IMPLEMENTATION.md`. Decisions: accepted decision 24
(B10-Q2 yes, B10-Q3 both, asked in this session); the SPEC marks them answered. Inherited D-01c (no page CSP, so no CSP
re-runs), B01-Q2 (reveal kept), D-06, D-10. No master merge was needed. All ten findings and the addition reproduced at
HEAD `40d59025` by reading (line drift only).

**Dispositions**

Proof files: `tests/artifactRelease.test.ts` (fake pdf.js keeping pdf.js's worker rule, StrictMode), `tests/artifactLabels.test.ts`,
`tests/artifactsTab.test.ts`, `tests/cardFind.test.ts` (all jsdom), and the "B10 · artifact viewers" block at the end of
`e2e/artifacts.spec.ts` (Chromium, fixture board 5182, development build so StrictMode).

| Finding | Disposition | Proof |
|---|---|---|
| R-13 | **Fixed**: `src/artifacts/pdfDocs.ts` shares one `PDFWorker` and counts documents by URL; `openPdf`/`closePdf`/`withPdf`; an unheld document waits in an idle list of 3, then is destroyed; any failed load (before the document opens, at it, or at a page) is destroyed and forgotten; the reader holds its document through `useLoaded`'s new `dispose`, thumbnails and compare pages only while drawing | release tests (thumbnails in turn, late reader, partway failure, held document survives, compare pages one open, failure before open retried, boundary unmount); e2e leak counts |
| R-163 | **Fixed**: `src/artifacts/objectUrls.ts` (`ownUrl`, `dropUrl` revokes only its own); `CanvasBody`, `MermaidPicture` and compare pictures dispose through `useLoaded` | release tests (six edits leave one URL, none after unmount; a late drawing revoked); e2e (six source edits on screen leave at most 1, the minimap's URL still fetches, 0 on the board) |
| R-98 | **Fixed**: the found answer is kept with the request it answers (spot, file version, region content) and reads null for any other; no reset effect | e2e: a panel click on an unfindable spot in an open drawing, Markdown and PDF shows the flag; found spots show none |
| R-100 | **Fixed**: Markdown and PDF effects key on the region's content; placing is once per request (`placed` ref), so a correction re-boxes without moving the view, and a spot found only now is placed | e2e: a quote moved on disk moves the box (one box), broken shows the flag and no box, fixed boxes again, in Markdown and PDF |
| R-99 | **Fixed**: `CanvasViewer`'s last placement is an object (`Placement`: focus, region, image, follow), compared field by field | e2e: viewBox sampled through a request takes more than 4 values (2 before), the same region asked again eases, a fresh open and reduced motion at most 2 |
| R-103 | **Fixed**: `src/artifacts/pictureFailure.ts`; `pictureOf` never throws and returns a picture or a failure: none (null or empty source), gone (404), drawn (mermaid error, pdf.js parse error, `decode()` failure, B10-Q2), read (other status, no answer) | labels tests (each row) |
| R-104 | **Fixed** (D-10): gallery and lightbox use `assetUrl(src, assets[src])` | artifactsTab (only the changed file's URL changes; lightbox follows); e2e (file rewritten on disk: gallery and open lightbox show 320 px wide without a reload, the other URL unchanged, `?v=` served 200, a non-asset with `?v=` 404) |
| R-105 | **Fixed**: the lightbox is portalled to `document.body` | artifactsTab (parent is body, keys kept); e2e (`elementFromPoint` at the New card button and the divider beside a docked card is the lightbox; a click there closes it and starts no card; over a modal sheet, Esc closes only the lightbox) |
| R-106 | **Fixed** (B10-Q3): picked kinds and areas stay listed (count 0, an area not in config), selects show when one is picked, "Nothing matches the filters." with Clear filters; unknown kinds and statuses dropped inside the store's coerce (one status, one area kept, as the selects pick one); `readPrefs` is `readJson` alone | artifactsTab (4); e2e (saved prefs through a reload, Clear filters, damaged prefs load defaults) |
| R-33 | **Fixed**: scrolling only when asked (a new query, another card, find opening, a step); a re-find keeps the current match by its live range (`keptMatch`), else the next after it; find back after Edit keeps its match unscrolled | cardFind (5) |
| B10-REQ-11 (Shot) | **Fixed**: `Shot` asks the server (HEAD) on an image error: 404 Not kept, 200 Could not be drawn, other Could not be read | labels tests (3, one a preservation check) |

**Leak numbers** (e2e, 10 rounds of Artifacts tab with PDF and mermaid thumbnails, the PDF reader, the mermaid page, the board):
before **20 workers and 20 object URLs after 5 rounds, 40 and 40 after 10**; after **1 worker and 0 URLs at both**, PDF documents
open 1 (idle). After a PDF history compare stepped through 5 page changes: 1 worker, 3 documents open (all idle), 0 URLs.

**Before-proofs:** every new unit test was run on a `git archive 40d59025` copy in the scratchpad (a throwing `pdfDocs.ts` stub
there for the two tests using the new module): release 8 of 8 fail (20 workers where 1 is allowed, 7 URLs where 1), labels 6 of 7
(the passing one is the full-size link preservation check), artifactsTab 6 of 6, cardFind 3 of 4 (typing and stepping scroll was
already true). The review regressions fail there too (late reader `held`, boundary unmount, find after Edit), and the
retry-after-early-failure test fails against this phase's first `pdfDocs.ts`. The e2e block ran on the same copy (its Vite allowed
to serve the linked `node_modules`, a harness change only): all 7 fail.

**What shipped:**
- **New:** `src/artifacts/pdfDocs.ts`, `objectUrls.ts`, `pictureFailure.ts`; tests above.
- **Changed:** `src/artifacts/content.ts` (`useLoaded(key, load, dispose?)`, `releaseCanvas`), `PdfReader.tsx` (loader moved to
  `pdfDocs.ts`; `pageTexts` forgets a cut-short read; region key and placing), `Thumb.tsx`, `VisualCompare.tsx` (failures, page in
  the key only for a PDF, the whole source in the key), `ArtifactViewer.tsx`, `MarkdownReader.tsx`, `CanvasViewer.tsx`;
  `src/components/CardFind.tsx`, `Screenshots.tsx`, `HistoryView.tsx` (`Shot` only); `src/views/ArtifactsView.tsx`;
  `src/artifactIndex.ts` (prefs coerce, `readPrefs`, `NO_FILTERS`).
- **Shared module:** `useLoaded`'s new argument is optional; `src/diff/DiffFile.tsx` is unchanged.
- **Development hooks:** `window.__BOARD_PDF__` and `window.__BOARD_URLS__` (development builds only) for the leak counts.

**Deviations:**
1. Two small truthfulness fixes in the territory beyond the findings: the compare's version key now uses the whole mermaid source
   (two sources sharing their first 64 characters and length shared a picture), and a failed pdf.js load is retried by the next PDF.
2. The R-98 e2e uses the panel click (FINDINGS' scenario): a URL change re-asks the spot a second time, so the old board showed
   the flag that way.
3. Statuses and areas keep only their first saved value (the selects pick one), so every pick has its control.

**Verification:**
- `npm run verify:board`: tsc and check OK; Vitest 1,090 of 1,091 in the final run (the failure is `api.test.ts`'s known 5 s git
  timeout at load 19, passing alone); an earlier run also lost `diffUi` and `originLive` the same way, both passing alone
  (Discovered). `npm run check` on the real catalogue: OK, no errors; no file under `requirements/` changed.
- `e2e/artifacts.spec.ts` 42 of 42 (twice). Full fixture project: 126 of 126 in the second run; the first lost the known Mapped
  lane-rename flake (Discovered). `e2e/one-rule.spec.ts` 3 of 3 alone.
- **Migration:** none (saved prefs keep their key and shape; an older board reads them).

**Review outcomes (convention 15):** two Sonnet reviewers (about 600 changed lines outside tests).
- **Confirmed and fixed, each with a test shown failing first:** a pdf.js or worker failure before `getDocument` left a rejected
  entry cached for good (both reviewers); test 2's document count could be masked by earlier tests' idle documents (now asserts
  nothing held); find toggled off by Edit reset to the first match and scrolled; release on an error-boundary unmount had no proof.
- **Also fixed:** a rejected pdf.js import is no longer cached; a text read cut short by release no longer rejects unhandled;
  mermaid compare pictures no longer redrawn on a page change; the found key built with `JSON.stringify` (no `|` joiner); the
  test-only reset export removed; `prefsShape` unexported; a formatting slip.
- **Recorded, not changed** (Discovered): thumbnails read every page size; the HEAD plus `decode()` triple fetch and a possible
  non-Chromium `decode()` difference.
- **Not reproducible:** none. A reviewer's portal bubbling concern: the scrim ignores events whose target is not itself, and the
  e2e shows a backdrop click closes only the lightbox.

**Touch-rights edits (convention 11):** `e2e/fixtureCatalogue.ts` (`png` exported, B14's helper area); `docs/board-fixes/index.html`
(B10 status). `HistoryView.tsx` (B09's) only in `Shot`, as assigned.

**Doc facts (convention 12):**
- **`requirements-board/DESIGN.md`:** Artifacts tab, a new Filters bullet; artifact History (the failure labels); the card History's
  screenshot sentence (same words).
- **`requirements-board/README.md`:** src map (`content`, `pdfDocs`, `objectUrls`, `pictureFailure`); the screenshot version bullet
  (gallery and lightbox follow, unchanged stays cached); the artifacts paragraph (failure labels; viewers release PDF documents and
  object URLs, one worker, three idle).
- **`CHANGELOG.md`** 1.22.0. **Headers:** `pdfDocs.ts`, `objectUrls.ts`, `pictureFailure.ts`, `useLoaded`, `CardFind`'s `keptMatch`,
  `Lightbox`, `prefsShape`.
- **Checked, nothing changed:** the About page (its Artifacts lines still true), SCHEMA, ADOPTING, the SKILL.md files; card find has
  no DESIGN line (B14's whole-file pass may add one).

**What later phases need:**
- **B11:** nothing from B10's viewers; `RegionBoundary` unmounts release viewers' resources through `useLoaded`.
- **B14:** the README and DESIGN lines above in the whole-file pass; the shared veil (B06's Discovered row) was not taken up here.
- **B15:** rerun `tests/{artifactRelease,artifactLabels,artifactsTab,cardFind}.test.ts` and the B10 block of `e2e/artifacts.spec.ts`;
  confirm the `one-rule` R-101 observation over more runs.

### B09 · Diff and history UI · COMPLETE · 2026-11-20

Board 1.20.0 to **1.21.0**. Plan and evidence: `phases/B09-diff-and-history-ui/IMPLEMENTATION.md` (plan, "As built").
Decisions: accepted decision 23 (B09-Q2 timings recorded only, B09-Q3 a new start number is a marked change, B09-Q4
live ticks, all asked in this session; the Open rule settled from DESIGN.md); the SPEC marks them answered. No master
merge was needed. All 13 findings reproduced at HEAD `f7edee77` (R-25, R-88, R-89 run with the real functions; the rest
by reading, line drift only). Another session committed the plan page meanwhile (`851631c5`); nothing of theirs is in
this commit.

**Dispositions**

Proof files: `tests/diffTruth.test.ts` (pure: comparison, lists, minor rule, marks, mermaid, timeline, journal),
`tests/diffUi.test.ts`, `tests/diffScroll.test.ts`, `tests/historyUi.test.ts` (jsdom), additions to
`tests/viewedStore.test.ts` and `tests/catalogueDiff.test.ts`, and three tests at the end of `e2e/diff.spec.ts`.

| Finding | Disposition | Proof |
|---|---|---|
| R-25 | **Fixed**: `lcsPairs` matches the common start (always), then the old table on the rest when it fits (so every input the old table held gives the old pairs), else trims the common end and cuts the middle at values found once on each side, recursively. Never null. `pairBlocks` makes equal-key pairs `same`; `pairRun` reads each block's words once and, past 40,000 comparisons, looks 100 blocks ahead. `wordDiff` and `lineDiff` (no 400-line bail) inherit it | diffTruth: 800, 1,538 and 2,000-paragraph one-word changes (one edited row, two folds); 5,000-token paragraph marks one word; 2,000-line line diff is one line; identical blocks never edited; past-the-cap pairs valid; P-06 2,000 random inputs equal to the old function; `stepChanges` unchanged |
| R-89 | **Fixed** (B09-Q3): keys carry an item's bullet-or-number and its text without the marker; `markerChanged` (bullet against number, or two list starts at different numbers) makes an edit whose marker is marked (the item drawn as a paragraph led by a marked marker); an edited pair with no mark either side is tinted whole | diffTruth: insert at item 2 and at the top, removal at the top, bullet characters, bullet to number, new start, the no-blank-row invariant over five cases |
| R-88 | **Fixed**: Markdown fields are minor only with the same blocks (`sameBlocks`: keys and markers); `source` line by line; title and author squashed as before | diffTruth: joined paragraphs, merged and split bullets, depth, heading, mermaid joins both ways not minor; re-wrap, spaces, bullets, renumbering minor; merged bullets counted on the card |
| R-90 | **Fixed**: a leaf's sentinels set the mark state; a leaf a change touches is marked whole | diffTruth: change ending inside a line-crossing code span, change starting inside one |
| R-91 | **Fixed**: a mermaid source change that is not minor is a drawing change (`fileChanged`), so the card shows both drawings tagged "Drawing changed" and is not minor; Open only for a record on the board now (decision 23) | diffTruth mermaid; diffUi "Drawing changed" with two pictures, Open absent for a record gone since |
| R-92 | **Fixed**: a file that changed format draws each side as what it is (Markdown typeset, opening only) | diffUi md to svg and svg to md |
| R-93 | **Fixed** (B09-Q4): a tick merges its one key into the stored comparison read fresh; other tabs pick it up through `storage`; a blocked store keeps the tab's own ticks | viewedStore: two hooks over one storage (tick, untick, retick); storage event; blocked untick keeps another tick (review) |
| R-94 | **Fixed**: the error is kept with its comparison and dropped when another is named; "Reading git" whenever stale with no cards to dim | e2e "B09 R-94" (old "No card differs" and an old error never shown under new refs) |
| R-95 | **Fixed**: entries keyed by type, time, full commit name, source and kind with a repeat count; day headings by day | historyUi: an open disclosure stays on its entry when a newer one is added; unique keys for equal times and both hash widths (preservation) |
| R-96 | **Fixed** (D-10): the History view re-reads when the card's own screenshot versions in the store's `assets` change | historyUi: another card's version change causes no read, this card's causes one |
| R-97 | **Fixed**: a missing neighbour is unchanged | historyUi: one change in 60 lines shows lines 30, 31, the change, 32 |
| R-87 | **Fixed**: the journal appends `{ kind: 'seen' }` when `baseline` first sees a card; `buildTimeline` starts the journal's detail at the earlier of `seen` and the first entry, never shows `seen`, and gives a card first seen with no earlier git version a "Created" entry (not committed yet while git has none). Old journals read as before; an older board drops `seen` lines (`collapse`) | diffTruth: offline committed retitle once; first seen uncommitted; then committed; old journal unchanged (preservation); the journal writes `seen` once |
| R-32 | **Fixed**: one landing per page (`land` returns a cancel; `cancelLanding` on leaving the tab); wheel, touchstart, mousedown and scroll keys cancel; a glide that cannot move waits for nothing, else one correction at `scrollend` or a 900 ms fallback; the jump loop ends when a write does not move the page | diffScroll (9, controlled container); e2e "B09 R-32" with reduced motion and without, in Chromium: k to the bottom, wheel up, not pulled back, j stays up |

**Before-proofs** (new tests on a `git archive f7edee77` in the scratchpad, `cancelLanding` and `entryKeys` stubbed there):
41 of the 48 new unit tests fail before (the review's top-of-list test included), and so does the `catalogueDiff` link
test. The 7 passing before are preservation checks: P-06 random and steps, "a new starting number is not minor" and
"re-spaced source" (the old rule agreed), the old-journal case, unique keys, Open offered on the board. The
blocked-storage untick (a flaw of this phase's first cut, not of the old board) was shown failing with that cut's
read-back restored. The e2e proofs ran with the pre-B09 `scroll.ts`, `DiffView.tsx` and `useDiffData.ts` swapped in: R-94 showed
"No card ... differs" under the new refs; R-32 was pulled back to the bottom with reduced motion (1,796 against
under 1,496) and without (moved 302 px after the reader stopped). All pass after.

**Timings (B09-REQ-01 rule 5, recorded, decision 23)**, Node, best of runs, load 4 to 12:

| Case | After | Before |
|---|---|---|
| 2,000 blocks, 50 changed, pairing | 3 to 5 ms (target 100) | 4 ms, but wrong (every block edited) |
| Two wholly different 1,000-block documents (short paragraphs) | 83 to 99 ms | 1,190 ms |
| Two wholly different 2,000-block documents (short paragraphs) | 150 ms (target 250) | 4,809 ms |
| Wholly different 30-word paragraphs, 1,000 x 1,000 / 2,000 x 2,000 | 211 / 380 ms (**2,000 x 2,000 misses 250**) | (review: 290 / 558 ms with the first window) |
| 5,000-token paragraph, one word / 100 scattered words, marking | 0.5 / 1.7 ms (target 50) | 0.2 ms, but tinted whole |

**What shipped:**
- **Changed:** `shared/textCompare.ts` (`lcsPairs` rewritten round `table`, `anchors`, `middle`); `shared/proseDiff.ts`
  (`Block.start`, `shownMark`, `markerChanged`, `bodyOf`, `keyOf`, `sameBlocks`, `alikeWords`, `pairRun` window and
  `same` rows, `markPair` marker and no-blank rule, `wordDiff` without the null path); `shared/history.ts` (`seen` kind,
  `isMinorChange`, `lineDiff`, `buildTimeline` start and "Created"); `shared/diffModel.ts` (mermaid `fileChanged`);
  `server/historyJournal.ts` (`seen` at first sight); `server/catalogueDiff.ts` (`realPath`); `src/diff/diffMarks.ts`,
  `scroll.ts`, `DiffView.tsx`, `useDiffData.ts`, `viewedStore.ts`, `DiffCard.tsx`, `DiffFile.tsx`;
  `src/components/HistoryView.tsx` (`shotVersionsOf`, `entryKeys`, `Diff` context).
- **New tests:** `tests/diffTruth.test.ts` (28), `tests/diffUi.test.ts` (5), `tests/diffScroll.test.ts` (9),
  `tests/historyUi.test.ts` (4); additions to `tests/viewedStore.test.ts` (2 and a blocked-untick case),
  `tests/catalogueDiff.test.ts` (1), `e2e/diff.spec.ts` (3).

**Tests changed on purpose:** `tests/writeModel.test.ts` "an unchanged save ... journal nothing" asserted no journal file
exists; it now holds the start's `seen` line, so the test compares the file before and after (intent kept).

**Touch-rights edits (convention 11):**
- `server/historyJournal.ts` (shared row; B09's first-sight part), `server/catalogueDiff.ts` (B08's git side; the B01
  discovered row assigned to B09: one `realPath`).
- `tests/writeModel.test.ts` (B05's), above.
- `docs/board-fixes/index.html`: B09 status.

**Deviations:**
1. List starts are compared between paired list starts, not in the key (the review found the keyed start mis-paired a
   top-of-list insert); the user's answer to B09-Q3 holds.
2. `pairRun`'s window (100 past 40,000 comparisons) is an addition for speed: past it, a removed block pairs only with
   the next 100 added blocks.
3. A line-diff over its table budget no longer shows everything removed then added: lines found once each side anchor it.
4. An edited row with no visible mark is tinted whole (heading level, table alignment), beyond REQ-02's list cases.
5. The 2,000 x 2,000 long-paragraph pairing misses the non-gating 250 ms target (recorded, decision 23).

**Verification:**
- **`npm run verify:board` green:** 1,063 tests (64 files), check OK. One earlier run lost `catalogue.test.ts`'
  round-trip at load 22 (passes alone and in the final run; Discovered).
- **`e2e/diff.spec.ts` (fixture, 5182):** 17 of 17 after the review fixes. **Full fixture project** (before the review
  fixes): 112 of 114; failures `one-rule` R-101 (the known viewer flake) and once a stepped-diagram animation test that
  passed 3 of 3 alone (Discovered).
- **R-32 in a real browser with reduced motion:** Playwright Chromium with `reducedMotion: 'reduce'` emulated (and without),
  before and after as above.
- **Real catalogue:** `npm run check` OK, no errors; no file under `requirements/` changed. **Journal compatibility:** old
  journals read as before (test); no journal is rewritten. **Migration:** none.

**Review outcomes (convention 15):** two Sonnet reviewers (about 470 changed lines outside tests).
- **Confirmed and fixed, each with a test shown failing first:** a list's start number in the first item's key
  mis-paired an insert or removal at the top of a numbered list (both reviewers; the fix was in flight when reviewer 1
  read it, which it reported as Q3 unimplemented); an untick with storage blocked dropped the tab's other ticks.
- **Also fixed:** an old error could show again on returning to its comparison before the new read failed (cleared when
  another comparison is named); the start scan's quadratic walk (`break`); marker digits counted as words in pairing;
  the pairing window tightened after the reviewer's timings; `setError` renamed `setFailed`; two DESIGN lines my edits
  had joined; a long argument spread in `lcsPairs` (found in self-review).
- **Recorded, not changed** (Discovered): distant edits in a paragraph with no once-only words; the 2,000 x 2,000
  long-paragraph timing; a growing drag or re-capture run's key; "Created" for a card outside git; the dead `?? []` in
  `steps.ts` and the test-only `alike`; the `collapse` cast (safe: filtered first). A reviewer's "spurious Created after
  a deletion bound" does not arise: `currentLife` drops a `seen` line before the bound.
- **Not reproducible:** none.

**Doc facts (convention 12):**
- **`requirements-board/DESIGN.md`** (Diff review): Keys (one landing, the reader wins, unreachable targets); Default
  (nothing old speaks under a new pick); the card head's Open; changed words (length never tints, list markers, no blank
  edit); an artifact's file (mermaid drawings, format change); Minor changes; Viewed across tabs.
- **`requirements-board/README.md`:** the History bullet (`seen`, first sight, old journals), the screenshot paragraph
  (an open History re-reads on its own versions), the Diff review's page paragraph (`textCompare.ts`, the minor rule).
- **`CHANGELOG.md`** 1.21.0, naming that the Diff tab's count can rise. **Headers:** `textCompare.ts`, `scroll.ts`,
  `viewedStore.ts` `writeViewed`, `historyJournal.ts` `baseline`, `history.ts` `JournalEntry`, `isMinorChange`, `lineDiff`.
- **Checked, nothing changed:** the About page (Diff review paragraph still true), SCHEMA (the journal is outside the
  catalogue), ADOPTING, the SKILL.md files.

**What later phases need:**
- **B10:** `HistoryView.tsx`'s `Shot` label is untouched (yours); `HistoryTimeline` now keys entries with `entryKeys` and
  `Diff` shows only real context, for the artifact timeline too. `land()` returns a cancel.
- **B14:** README and DESIGN lines above in the whole-file pass; the `steps.ts` `?? []` row.
- **B15:** rerun `tests/{diffTruth,diffUi,diffScroll,historyUi,viewedStore}.test.ts` and `e2e/diff.spec.ts`; A-5 (the
  timeline's line diff on card moves) is still B15's to confirm.

### B06 · Edit sheets and Settings · COMPLETE · 2026-11-19

Board 1.19.0 to **1.20.0**. Plan and evidence: `phases/B06-edit-sheets-and-settings/IMPLEMENTATION.md` (plan, "As
built", the manual keyboard and focus check, "Recovery"). Decisions: accepted decision 22 (B06-Q2 merge silently,
B06-Q3 block and offer "Add them" with a server rule, B06-Q4 lock project and components, all asked in this
session; B06-Q5 and the D-04e retirement settled from evidence); the SPEC marks them answered. Master merged first
(`adbb3687`: catalogue, plan and capture files only, no board code). All 16 findings reproduced at that HEAD
(line drift only, plus B02, B03, B05 and B07's deliveries).

**Dispositions**

Proof files: `tests/sheetWrites.test.ts` (node: helpers, merge, section state, server), `tests/editSheets.test.ts`
and `tests/settingsView.test.ts` (jsdom), `e2e/edit-sheets.spec.ts` (fixture board). Before-proofs ran against a
`git archive adbb3687` in the scratchpad (one test per run, so no draft leaks between tests there).

| Finding | Disposition | Proof |
|---|---|---|
| R-01 (closes, with B02) | **Fixed**: a damaged status list shows a banner with its problems and no rows, Add or Save; other sections work; it returns live when repaired. A degraded list shows its problems and can be saved (the repair, B02-Q4) | settingsView "a damaged status list ..."; e2e "a damaged status list is locked, and comes back when repaired, without a reload" |
| R-02 | **Fixed**: sheets send `{ patch, baseRev, base }` of the fields the user changed (`patchBetween`); a disk change to untouched fields is taken in quietly (B06-Q2); a clash raises Keep mine / Load theirs naming the fields; Keep mine lays the user's fields over the current copy (`overlay`). Status menu, Retire and the answer flip send `{ status }` | editSheets: item Keep mine, silent merge of the user's own drag, status alone, question Keep mine, artifact details Keep mine; e2e R-02 through files (description kept, parent and `artifacts:` kept) |
| R-12 | **Fixed**: a gone artifact with a stored details draft shows the orphan panel (every changed detail, the veil on Esc and the crumb, Discard edits); with none, the gone message; full screen is left either way; a returning artifact picks its draft up | e2e R-12 (full screen left, masthead back, Esc and crumb ask, Discard) |
| R-41 | **Fixed** (typing kept, form not locked): what is typed during a save stays an unsaved change on the saved copy; failure and 409 keep the draft | editSheets "a save that succeeds leaves the later typing" (fails before); the failure/409 case is a preservation check |
| R-42 | **Fixed**: the orphan sheet asks before every exit (Esc, scrim, close, guarded ways out); a confirmed discard resets the hook (final); the store's create and delete clear drafts for those IDs | editSheets "Esc and the scrim ask first ..." and "a card the board creates at a reused ID never opens with an old draft" |
| R-43 | **Fixed**: the orphan list is every changed field (`changedRows`), readable (cards with titles, status labels, kind names, a cleared field "Cleared"), unchanged fields left out | editSheets "shows every unsaved change in readable form" |
| R-45 | **Fixed**: each Settings section sends `bases` from `config.revs`; a disk change while dirty (or a 409) shows Load theirs / Keep mine; Keep mine merges row by row (`shared/settingsMerge.ts`), renumbering a new status whose code the file took (B02's rule), and notes what it decided; Save waits for the answer | settingsView R-45 block (3); sheetWrites merge block (3); e2e R-45 (status 7 on disk kept with the reworded help) |
| R-107 | **Fixed**: the docked orphan registers the guard and now has the veil, so a board click, arrow walk or search asks | editSheets "in the docked panel, a board click asks" |
| R-108 | **Fixed**: `guarded` runs at once while a modal scrim is open (the docked draft is kept); the docked panel drops a waiting question when a question sheet opens over it; New card's waiting create reads the form as it is then, and not at all once it has gone | editSheets R-108 block (3) |
| R-109 | **Fixed**: the opener is read at first render; the sheet takes focus only if nothing inside has it; a swap keeps the first opener; close falls back to the docked card or `main`, never `body` | editSheets focus block; e2e "a new card opened in Edit takes the typing" and "New card on Outline ..." |
| R-110 | **Fixed**: the safe answer is focused only when the question appears (keyed on its title); inert is reapplied every render | editSheets "the veil takes focus once"; manual check (board search keeps focus while a file changes) |
| R-111 (closes, with B05) | **Fixed**: Cmd/Ctrl S with no change sends nothing (still prevents the browser dialog); a dirty draft that only differs by tidying leaves Edit without a write; a blank new card is still dropped | editSheets R-111 block (2) |
| R-112 | **Fixed**: a sheet adopts its record when it appears (and a stored draft then resumes under Q2); the not-found sheet allows "renamed, removed, or does not read" and shows the check's error for that ID; the question stepper anchors when the record first appears | editSheets R-112 block (3) |
| R-123 | **Fixed** (B06-Q3): a non-empty component list that leaves in-use components unlisted names them with counts and "Add them", and Save waits; the server refuses a save that newly leaves one unlisted, judged against the disk list; a new row is never locked by its name | settingsView R-123 block (2); sheetWrites server "refuses a first component ..." |
| R-124 | **Fixed**: "Used by" counts cards and artifacts; a lower-case code on disk leaves the section clean (codes upper-cased only as typed) | settingsView "counts artifacts" and "a lower-case code on disk leaves the section clean"; the server already counted artifacts (preservation test in sheetWrites) |
| R-125 | **Fixed**: a section is dirty only when saving would change the file (`norm` both sides); after a save the form shows the saved (trimmed) value | settingsView "a project name saved with outer spaces ..." |
| B06-Q4 (added scope, user) | **Delivered**: `config.sectionState` for `project` and `components`; locked in Settings while damaged, live recovery; the server refuses a save of a damaged section | sheetWrites "how the project and components sections read" and "never saves over ..."; settingsView "a components or project section read with problems is locked" |

Before-proofs: `settingsView` 10 of 10 fail before; `editSheets` 18 of 20 original tests fail before (the two that pass
are preservation checks: a failing save keeps typing, a sibling swap keeps its opener), plus the 5 review tests that
reach old code (question and artifact Keep mine, veil focus return, body fallback, panel focus); `sheetWrites` server
and section-state block 5 of 6 fail (the one passing is the server's artifact count, already there); the pure helper
blocks fail on import (new modules); `e2e/edit-sheets.spec.ts` 6 of 6 fail before. The review regressions that the old
code does not reach (New card under StrictMode, leaving Edit keeps focus, Settings typing during a save, the panel's
StrictMode focus ref) were each shown failing with the fix taken out.

**What shipped:**
- **New:** `src/drafts.ts` (the draft store, `forgetDrafts`), `shared/settingsMerge.ts` (`mergeFields`, `mergeRows`,
  `mergeStatusLists`); tests `tests/sheetWrites.test.ts` (12), `tests/editSheets.test.ts` (27),
  `tests/settingsView.test.ts` (11), `e2e/edit-sheets.spec.ts` (6).
- **Changed:** `src/components/useEditableRecord.ts` (rewritten: kind, patch saves, silent merge, collisions, typing
  during a save, R-112 adoption, final discard, `cancelPending`); `EditChrome.tsx` (field labels, conflict fields,
  `changedRows`, `OrphanedDraft` asking, `OrphanBody`, `NotFoundSheet`); `Sheet.tsx` (focus and veil); `ItemModal.tsx`,
  `QuestionModal.tsx` (patch saves, orphan rows, not-found, docked drop, stepper anchor); `NewCardButton.tsx`;
  `src/nav.ts` (`guarded`, `hasUnsavedWork`); `src/views/ArtifactPage.tsx` (`ArtifactGone`, full screen);
  `src/views/SettingsView.tsx` (sections rewritten round `useSection`); `src/store.ts` (save actions).

**Store save actions after B06 (for B11 and later phases that edit `src/store.ts`):**
`saveItem(id, { patch, baseRev, base })`, `saveQuestion(id, change)`, `saveArtifact(id, change)` (each over
`api.patchItem` / `patchQuestion` / `patchArtifact`; set the returned record); `saveConfig(patch)` returns the saved
config and needs `bases` for every section sent; `createItem`, `createQuestion`, `deleteItem`, `deleteQuestion` clear
stored drafts for the IDs they create or remove. `api.putItem`, `putQuestion`, `putArtifact` are gone.

**Touch-rights edits (convention 11):**
- `server/catalogueApi.ts` (B05's): the record PUTs require `patch` (`requirePatch`; `{ record }` is a 400); the
  config PUT requires a base per section sent (400), refuses a damaged `project` or `components` section (422), and
  judges the components rule against the disk list; header lines.
- `shared/config.ts` (B02's): `sectionState`, `CheckedSection`, `SectionState`; a stray doubled doc line removed.
- `shared/patch.ts` (B05's): `changedFields`, `patchBetween`, `overlay`, `fieldValue`.
- `src/api.ts` (B05's): `putItem`, `putQuestion`, `putArtifact` removed; doc lines.
- `src/App.tsx` (B07's): the leave prompt reads `hasUnsavedWork(reloading)`.
- `src/artifacts/ArtifactPanel.tsx` (B10's later): `usePanelKeys` and `PanelVeil` exported, the veil's focus return
  and inert, patch saves.
- `src/styles.css`: `.main:focus` without an outline.
- `tsconfig.node.json`: `src/globals.d.ts` included (tests render the Settings page).
- `playwright.config.ts`: the new spec in the fixture project.
- Tests moved to the retired shapes' replacements, intent kept: `tests/api.test.ts` (records as patches, config
  writes with bases via `withBases`, the malformed-record test as a malformed patch), `tests/artifacts.test.ts` (an
  artifact patch naming a file, regions, source or `extra` is refused; details saved), `tests/writeModel.test.ts`
  (the whole-record test now proves the 400 and a one-field patch), `tests/historyJournal.test.ts`,
  `tests/loadResilienceApi.test.ts`, `tests/originRules.test.ts`, `tests/resync.test.ts` (bases),
  `tests/config.test.ts` (`sectionState` in the shape and asserted).
- `requirements/SCHEMA.md`: one doc sentence (components rule, damaged sections), no requirement.
- `docs/board-fixes/index.html`: B06 status.

**Deviations:**
1. **D-04e retirement done here** (decision 22): the server no longer accepts `{ record }` or a base-less config
   section, as decision 20 assigned to the phase removing the last callers. A tab still running a pre-B06 board gets
   a 400 on save until reloaded.
2. **B06-Q3's server rule is in the config route**; `shared/check.ts` was not touched (it already reports a component
   missing from a non-empty list).
3. **Focus work beyond the SPEC**, from the review and the manual check: focus returns after the veil is answered,
   a modal sheet keeps focus when the focused field goes, errors are announced.
4. **A degraded status list can be saved unchanged** (the repair) and Keep mine in Settings leaves a note naming what
   it decided.

**Verification:**
- **`npm run verify:board` green:** 1,014 tests (60 files), check OK.
- **Fixture e2e (5182):** 115 of 116 pass; the failure is `one-rule.spec.ts` R-101, the known viewer pixel-box flake
  (rates in Discovered: the same with B06's artifact page changes taken out). `edit-sheets`, `settings`,
  `artifacts`, `item-links`, `item-delete`, the question specs and `bad-data` all pass.
- **Real catalogue:** `npm run check` OK, no errors; no file under `requirements/` changed but SCHEMA.md.
- **Manual keyboard and focus check** (IMPLEMENTATION.md table): item modal and docked, question, artifact details;
  open, Edit, Esc, Cmd S, navigate away, conflict, Keep mine, Load theirs, close; before on the pre-B06 board too. The
  docked panel takes no focus on open, before and after.
- **Migration:** none (drafts are tab memory; `sectionState` is derived).

**Review outcomes (convention 15):** two Sonnet reviewers (about 1,000 changed lines outside tests).
- **Confirmed and fixed, each with a regression test shown failing first:**
  - New card created nothing in development: its "form still there" flag was set at creation and cleared by
    StrictMode's double mount (high; reviewer 1);
  - a sheet opened with nothing focused gave focus back to `body` on close (reviewer 1);
  - Settings dropped what was typed while a section saved, and could keep a stale form if the file moved during the
    save (reviewer 1);
  - answering the veil left focus on `body` (reviewer 2); the artifact panel's veil needed its place kept in a ref
    under StrictMode;
  - artifact "Replaced by" in the orphan list was a bare ID (reviewer 1);
  - question and artifact Keep mine had no proof (reviewer 1): tests added.
- **Also fixed:** save errors and Settings errors `role="alert"`; the locked banner `role="status"`; the "In use"
  note a labelled group instead of a live region; the veil's `aria-describedby`; an `h2` on the orphan sheet; the
  `restoreFocus` comment and its duplicate blur listener; `plain()` simplified; the orphan reader's `as never`.
- **Found in the manual check and fixed:** leaving Edit with Esc dropped focus to `body` (test added, failing first).
- **Not changed** (Discovered): Settings rows keyed by index and their button names, swatch arrow keys, Settings edits
  outside the leave prompt, the duplicated veil, the Voice section's own banner. The `hasUnsavedDrafts` re-export the
  reviewer called dead is kept: the tests import it from the hook.
- **Not reproducible:** none.

**Doc facts (convention 12):**
- **`requirements-board/README.md`:** shared map (`patch.ts` client half, new `settingsMerge.ts`), src map (`nav.ts`
  `hasUnsavedWork`, new `drafts.ts`); "How it works": the save bullet (whole record refused, bases required), a new
  sheets bullet (patches, silent merge, Keep mine, typing during a save, records that appear, Settings per section),
  the docked-guard line (modal over the panel), the unsaved-edits bullet (drafts store, orphans, artifact page,
  create and delete clear drafts); the config paragraph (`sectionState`, locked sections, the components rule).
- **`requirements-board/DESIGN.md`:** Interaction (the modal-over-panel way out; disk changes, orphaned and missing
  records; focus; the veil's focus once and inert); the artifact page's Edit details (orphan, full screen);
  Settings (per-section saves, conflict, Keep mine note, locked sections, degraded repair, components rule).
- **`requirements/SCHEMA.md`:** the components and damaged-section sentence after the vocabulary lists.
- **`CHANGELOG.md`** 1.20.0. **Headers:** `server/catalogueApi.ts` routes, `useEditableRecord.ts`, `EditChrome.tsx`,
  `drafts.ts`, `settingsMerge.ts`, `ArtifactPage.tsx`, `nav.ts`.
- **Checked, nothing changed:** the About page (says Settings edits `board.config.json`; nothing on conflicts or
  drafts), ADOPTING, the SKILL.md files.

**What later phases need:**
- **B09:** nothing from B06's sheets; the History view is untouched.
- **B10:** `src/artifacts/ArtifactPanel.tsx` now exports `usePanelKeys` and `PanelVeil` (used by `ArtifactPage`'s
  orphan state); keep the veil's focus return and inert, or move both into one shared veil with `Sheet.tsx`'s
  (Discovered). The artifact page leaves full screen when its artifact is gone (`ArtifactPage.tsx`).
- **B11:** the store save actions above; `guarded` (`src/nav.ts`) now runs at once while a modal scrim is open;
  `BoardView` and `LaneNode` callers need no change.
- **B14:** README, DESIGN and SCHEMA lines above in the whole-file pass; the D-04e retirement means the protocol has
  one record shape.
- **B15:** rerun `tests/{sheetWrites,editSheets,settingsView}.test.ts` and `e2e/edit-sheets.spec.ts`; repeat the
  manual keyboard check (IMPLEMENTATION.md) if a browser is at hand.

### B07 · Store sync and layout · COMPLETE · 2026-11-19

Board 1.18.0 to **1.19.0**. Plan and evidence: `phases/B07-store-sync-and-layout/IMPLEMENTATION.md` (approved plan,
then "Baseline and measurements", "As built", "Recovery"). Decisions: accepted decision 21 (D-10, B07-Q5, B07-Q6),
asked in this session; the SPEC marks them answered. No master merge was needed. All six findings reproduced at
HEAD `418bd3bd` before the build (line drift only; B05's notifier and lane wiring in place).

**Dispositions**

Each proof failed on the pre-B07 board (a `git archive` of `418bd3bd` in the scratchpad) and passes after; 57 of the
61 new tests fail there, and the 4 that pass are preservation checks (the whole-folder fallback, the hand-delete
journal step, config revs on the delivery, "newer moves win").

| Finding | Disposition | Proof |
|---|---|---|
| R-40 | **Fixed** (decision 21): `hasUnsavedMoves()` (store) feeds the leave prompt with `hasUnsavedDrafts()`; unsaved Freeform moves (waiting, failed, in flight) are mirrored to session storage and put back and sent after the next load; a Mapped move queued or in flight is kept and checked after a reload, reported only if it did not land, never replayed; while Offline the board pings `/api/ping` every 2 s, saves kept moves when it answers and the pill offers Reload; the dead reconnect handler is gone; Offline and card-move text tell the truth (prefix once) | `tests/storeSync.test.ts` "unsaved card moves are guarded and kept" (4); manual Leave and Stay runs on 5482 (IMPLEMENTATION.md) |
| R-57 | **Fixed**: `forgetCards` (from `deleteItem` and from a delivery that removes a card) strips waiting, in-flight and kept saves and undo and redo entries, dropping an emptied entry; a kept move whose card is gone after a reload is dropped; the layout PUT keeps no position for an ID with no item file on disk (touch rights, B05's route) | `storeSync` "removed cards leave no position behind" (3); `tests/writeModel.test.ts` R-57 server half (deleted on disk dropped, created on disk not yet synced kept) |
| R-58 | **Fixed**: deliveries carry `epoch` and `seq`, the snapshot the `seq` it is current to; a load logs deliveries that arrive meanwhile and applies the newer ones over the snapshot; a load started before one already applied is dropped; a delivery from another `epoch` reloads | `storeSync` "a snapshot never takes the store back" (4: held snapshot with delete, update and layout; two loads in reverse order; batched delivery mid-load; another epoch) |
| R-59 | **Fixed**: Freeform saves run one at a time on `layoutQueue`; a failure merges `{ ...sending, ...pending }`; a layout delivery merges per card (cards waiting or in flight keep their place, the rest follow the file) | `storeSync` "layout saves are ordered" (3) |
| R-158 | **Fixed**: `watchBatch.ts` hands the re-sync the changed paths (any event is "look again"; a watcher error, a failed re-sync or over 500 paths reads everything); `syncFromDisk(paths)` re-reads only those files (`planSync`, `partialLoad`), keeps parse issues per source (`LoadResult.sources`), scans only changed screenshot folders, ignores paths that feed nothing, and falls back to a full read for a folder it cannot judge alone or on any error | `tests/resync.test.ts`: equivalence over 30 seeded random bursts (400 run once) against a fresh `loadCatalogue` and a twin server doing full reads (state, issues, assets, deliveries, journal files); fallback; hand-delete journal step; counts (one file read, notes read nothing and send nothing, echo sends nothing, a card change walks no screenshot folder, a screenshot change walks only its card's); `tests/watchBatch.test.ts` (6) |
| R-159 | **Fixed**: one `catalogue:changed` delivery per re-sync and per write request (`shared/delivery.ts`; B05's notifier merges into it, still one check per request); `applyDelivery` makes one store update, keeps unchanged record identities, skips an artifact at the same rev and facts and applies a meta-only change; `buildNodes(..., prev)` and `BoardView` reuse unchanged nodes and `data` | `resync` delivery counts and config revs on the delivery; `storeSync` "one delivery, one store update" (3); `tests/graph.test.ts` identity test; browser measurement below |
| D-10 (REQ-08) | **Delivered** (decision 21) | `resync` "screenshot versions" (4: rewrite, unchanged across deliveries, touch and restart, burst names each card once, removal null); `tests/originLive.test.ts` the version URL and an old one served the current file |

**The delivery shape (for B06, B09, B10, B11):** `CatalogueDelivery` (`shared/types.ts`):
`{ epoch, seq, items?, questions?, artifacts?, layout?, config?, issues?, assets? }`, record maps `id → record | null`,
`assets` `src → version | null`. One per re-sync and per write request (records in the order they changed; `issues` when
they changed, and on any write that changed records). `config` carries `revs` and `statusState` as before, `layout` its
`lanesRev`. The snapshot is `CatalogueSnapshot` with `epoch`, `seq` and `assets`. The store applies deliveries with
`applyDelivery` (`applyEvent` is gone); `useCatalogueRefresh` runs on deliveries that change records (`changesRecords`).
`GET /api/ping` answers `{ epoch, seq }`.

**D-10 for B09 and B10:** read `useCatalogue((s) => s.assets)` (`src → git blob hash`, the journal's own hash, so it
matches a "Screenshot updated" entry's `to.sha`); a card's assets are the keys under `assets/<ID>/`. Build image URLs
with `assetUrl(src, version)` (`?v=`). An assets-only delivery changes no record, rebuilds nothing and does not run
`useCatalogueRefresh`; B09 decides how a timeline reacts.

**Unsaved-moves signal for B06:** `hasUnsavedMoves()` from `src/store.ts`; App's beforeunload reads it beside
`hasUnsavedDrafts()` (B06 moves both into `src/nav.ts`). The pill's Reload (`reloadKeepingMoves` in `App.tsx`)
skips the prompt for moves only, since they are kept.

**Node reuse for B11:** `buildNodes(g, counts, prev)` keeps `data` when `item` (same object), `w`, `h`,
`openQuestions`, `childCount` and `tone` match, and the whole node when position, `hidden`, `zIndex` and handles also
match; `BoardView` keeps React Flow's own node for a card whose built node is unchanged and where it was built.

**Measured** (details in IMPLEMENTATION.md; load averages 9 to 25, noisy; the counts are the binding proof):
- One-file re-sync on a copy of the real catalogue: 34 to 91 ms after, 544 to 1,487 ms before in interleaved pairs
  (13 to 19 times cheaper). 50 files over 2 s: 4 or 5 deliveries and 0.5 to 1.4 s of server time, against 54 deliveries
  and 3.0 to 8.9 s.
- Browser (development build): 300 records changed settled in 1.0 s with 504 card renders and 2 builds, against 8.4 s,
  4,690 renders and 600 builds; one record changed, 2 renders against 670 (StrictMode doubles each).

**What shipped:**
- **New:** `server/watchBatch.ts`, `shared/delivery.ts`; tests `tests/resync.test.ts` (47), `tests/storeSync.test.ts` (17),
  `tests/watchBatch.test.ts` (6), `tests/deliveries.ts` (test helper).
- **Changed:** `server/catalogueApi.ts` (notifier into deliveries, snapshot fields, `/api/ping`, `planSync`, `partialLoad`,
  `readChanges`, `syncFromDisk(paths?)`, image link cache, header); `server/catalogueFs.ts` (`judgeFile`,
  `judgeRecordFile`, `ParseSources`, `parseIssuesOf`, `inFileOrder`, `layoutIssues`, `configIssues`, `imageLinkOut`,
  `loadCatalogue` on them); `server/cataloguePlugin.ts` (watcher through `watchBatch`, one send per delivery);
  `shared/types.ts`; `src/store.ts`; `src/App.tsx`; `src/useCatalogueRefresh.ts`; `src/api.ts` (`ping`, `assetUrl`
  version); `src/storage.ts` (session area, `removeJson`); `src/board/graph.ts`; `src/views/BoardView.tsx`.
- **Tests changed for the shape only (intent kept):** `tests/store.test.ts` (`deliver` helper),
  `tests/{api,artifacts,writeCost,writeModel}.test.ts` (collect `changesOf(d)`); `tests/graph.test.ts` and
  `tests/originLive.test.ts` gained a test each.

**Touch-rights edits (convention 11):**
- `server/historyJournal.ts` (B08's hashing): the scan extracted as `shotScanner`, by folder (`ids`), returning each
  file's hash; `memoryJournal()` replaces `NO_JOURNAL` (per server, in memory).
- `server/catalogueApi.ts` layout PUT (B05's): no position for an ID with no item file.
- `src/components/ProblemPill.tsx` (B03's): Offline, "Server is back" and card-move text; the Reload line.
- `src/views/AboutView.tsx`, `requirements-board/DESIGN.md`: the pill sentences.
- `docs/board-fixes/index.html`: B07 status.

**Deviations:**
1. Folder events go to the re-sync as paths; `planSync` judges them (a whole read for the catalogue, a record folder or
   `assets/` itself), not `watchBatch`.
2. The image symbolic-link test is cached between re-syncs (dropped for a changed screenshot folder, cleared on a whole
   read): it was half of a re-sync's cost after the first measurement.
3. A delivery carries `issues` only when they changed (a re-sync) or for a write that changed records.
4. The kept-moves "card is gone" rule applies to cards the store saw leave and to kept moves after a reload; a move for
   a card the store never held is still sent (the server drops it).
5. The delete and lane routes still re-read the whole folder (`syncFromDisk()`), as B05 left them.
6. `setLanes` still sends no `lanesRev` (B05's D-04e row): left for B11, as decision 21 says.

**Verification:**
- **`npm run verify:board` green:** 964 tests, check OK. An earlier full run lost `tests/originLive.test.ts` at file
  level (its Vite boot timed out at load 20, the known item); it passes alone (52) and in the final run.
- **Fixture e2e (5182):** 109 of 110 pass; the failure is `one-rule.spec.ts` R-101, the known viewer pixel-box flake
  (B05). An earlier run had `board-mapped` "clicking a lane name" fail once; it passed 6 of 6 on repeat and in the
  final run.
- **Real catalogue:** `npm run check` output byte-identical before and after; no file under `requirements/` changed.
- **Manual (5482, scratch copy):** the Leave and Stay outage runs (IMPLEMENTATION.md), Reload asking nothing, the
  panel wording.
- **Migration:** none. Session storage key `requirements-board:unsaved-moves` is new.

**Review outcomes (convention 15):** two Sonnet reviewers (about 1,300 changed lines outside tests). No blocking
findings.
- **Confirmed and fixed, each with a regression test shown failing without the fix:**
  - a changed screenshot folder with no version change (a nested image, a file swapped for an outside link) kept the
    old issues (now the check always reruns for a changed folder; random bursts gained nested images, symlink swaps
    and an outside artifact file);
  - a re-sync that threw lost its paths (now the next one reads everything, at once after a failed incremental one,
    never in a loop);
  - a Mapped move queued behind another was not kept for a reload;
  - a layout or config echo ran the whole check (now read before deciding anything changed).
- **Also fixed:** the README's "retried on reconnect"; "card moves are saved" shown while they still failed; the
  resend wording; screenshot versions compared in listing order; `NO_JOURNAL`'s process-wide memory (now per
  server); `changesOf` moved to a test helper and `isEmpty` renamed; a doubled doc comment; import order; comments on
  `connected` and the Reload timer; added tests for the outside artifact file, folder walking and failure recovery.
- **Recorded, not changed** (Discovered): a stale echo after a later save's answer (brief, self-correcting); the
  cross-socket save echo (B06); the shared artifact cache in the twins; `logged` bounded by the load; the outside
  artifact watch never removed.

**Doc facts (convention 12):**
- **`requirements-board/README.md`:** shared map (`delivery.ts`), server map (`historyJournal.ts`,
  `cataloguePlugin.ts`, new `watchBatch.ts`), src map (`store.ts`, `useCatalogueRefresh.ts`); "How it works": the
  watcher and delivery bullet, new screenshot-version and kept-moves bullets; the Freeform line (one save at a time,
  when failed moves are resent).
- **`requirements-board/DESIGN.md`:** the masthead paragraph (what offline keeps, "Server is back", Reload).
- **About page:** the pill sentence in "Outline and checks".
- **Headers:** `server/catalogueApi.ts` (snapshot, ping, deliveries), `server/cataloguePlugin.ts`,
  `server/historyJournal.ts`, `server/watchBatch.ts`, `shared/delivery.ts`, `src/useCatalogueRefresh.ts`,
  `src/components/ProblemPill.tsx`, the store's `layoutError` comment.
- **`CHANGELOG.md`** 1.19.0.
- **Checked, nothing changed:** SCHEMA, ADOPTING and the SKILL.md files say nothing about live updates or card moves.

**What later phases need:**
- **B06:** the delivery shape and ordering above (sheets apply records from deliveries; write answers carry no `seq`,
  see Discovered); `hasUnsavedMoves()` into `src/nav.ts`'s guard; keep the pill's Reload exception for moves only.
- **B09:** D-10 above for R-96 (the `assets` slice; hashes equal the journal's); `currentLife` untouched.
- **B10:** D-10 above for R-104 (`assetUrl(src, assets[src])` in the gallery and lightbox).
- **B11:** keep `buildNodes`' `prev` reuse and `BoardView`'s `lastCards` / `lastComputed`; `setLanes` should send
  `layout.lanesRev`.
- **B14:** README lines above in the whole-file pass.
- **B15:** rerun `tests/{resync,storeSync,watchBatch,graph}.test.ts`, the D-10 test in `tests/originLive.test.ts`, the
  R-57 test in `tests/writeModel.test.ts`, and the outage check (IMPLEMENTATION.md) if a browser is at hand.

### B05 · Server write model · COMPLETE · 2026-11-19

Board 1.17.0 to **1.18.0**. Plan and evidence: `phases/B05-server-write-model/IMPLEMENTATION.md` (its "As
built" section lists what changed from the plan). Decisions: accepted decision 20 (D-04, B05-Q5, B05-Q6,
R-54's mentions and history rule), asked in this session. D-05 was not reopened (decision 19). The SPEC
marks them answered. No master merge was needed. Every owned finding was checked at HEAD `429b35ce`
before the build: line drift only, plus B01 to B08's changes.

**Dispositions**

Each proof failed on the pre-B05 board (a `git archive` of `429b35ce` in the scratchpad) and passes after,
except where marked as a preservation check.

| Finding | Disposition | Proof |
|---|---|---|
| R-26 | **Fixed**: a per-request notifier holds record events. The issues are checked once and sent once at the end of a write request, after its record events, even after a refusal (adopted records are still news). `guard` brings issues up to date first when the request adopted a disk version | `tests/writeCost.test.ts`: batch of 1 and 12 (2 checks, 1 issues event), lane rename over 1 and 12 (3: one folder load), delete with 11 rewrites (3). The 12-record cases fail before; the batch of 1 is a preservation check |
| R-37 | **Fixed**: the artifact PUT edits the sidecar in place (`shared/inPlace.ts`). Untouched keys, comments, `cited_as` in any shape, unknown keys, unreadable values and the whole `## Source` section stay byte for byte. A lossy change is a 422 and nothing is written | `tests/writeModel.test.ts` R-37 block: the FINDINGS sidecar, a title-only save is one line, every detail at once, a lossy flow-mapping sidecar refused, and every real sidecar saved in a scratch copy through the API changes only its author line. `tests/inPlace.test.ts`, and `tests/inPlaceReal.test.ts` over every real story, question and sidecar (each editable field alone; LF and CRLF; on a canonical file the result equals `serialise(next)`) |
| R-54 | **Fixed** (decisions 19 and 20): `currentLife` (`shared/history.ts`) starts a timeline at the newer of two marks. One is a committed deletion whose two sides differ (a restore continues). The other is the journal's newest `created` entry, whose record differs from the newest git version before it. A board create sets a leftover journal aside, and `created` entries carry the record. A card that reappears in a sync as a different record (a missing file, not an unreadable one) starts a new life; its old lines stay in the file. The artifact timeline cuts at its sidecar's and file's deletion bounds | `tests/reuse.test.ts`: unit cases (bound, restore, uncommitted reissue, same-second commit, legacy entries, screenshots, artifacts). End to end with a journal and real git: commit, board delete, create the reused ID, commit (shows only the new card; the SPEC's FID-18 case, fails before). Also: hand delete then commit then create; an agent re-creating the ID; a board delete undone by `git checkout`; a committed deletion reverted; a file unreadable for one sync then repaired. `tests/writeModel.test.ts`: a create sets the old journal aside |
| R-55 | **Fixed**: a positions-only layout write is never judged on lanes. A lane write is refused only for a problem it adds (`laneListProblems`, `addedProblems`). The check reports every lane rule, and entries `readLayout` drops; SCHEMA states 40 characters | `tests/writeModel.test.ts` lane-list block: 46-character, case-duplicate and `Unassigned` clash cases (drag saves, check reports, no-worse write saves, worsening write refused, fix clears); dropped entries reported |
| R-56 | **Fixed** (whole): `POST /api/lanes` renames or removes a lane, its stories and the list in one all-or-nothing write. It needs every story's rev and `lanesRev`, and puts back on a failure part way. The store's `renameLane` and `deleteLane` use it (`changeLane`); a refusal changes nothing and is shown in `moveError` | server: good rename and removal; unreadable layout, refused name, stale story, stale `lanesRev`, each with no file changed; an injected failure part way puts back (lanes, batch, delete); a stale story named with its current copy. Store (`tests/store.test.ts`): one request, refusal leaves stories and lanes, newer copy adopted, removal, `lanesRev` follows events and saves |
| R-64 | **Fixed**: `createAtomic` falls back to an exclusive `wx` claim and a rename where links fail (EPERM, ENOTSUP, EOPNOTSUPP, EXDEV, ENOSYS); no temp file is left behind. The gap (an empty file visible for a moment, or left by a crash; the check reports it) is recorded in IMPLEMENTATION.md | `tests/writeModel.test.ts` with link forced to fail per code (the old code has no injection point, so its before-proof is the manual check). **Manual, real exFAT image** (`hdiutil create -fs ExFAT`): pre-B05 create fails `ENOTSUP`; B05 creates, refuses a second create (`FileExistsError`), leaves no temp file |
| R-67 | **Fixed**: `artifact:new` claims the next `AR-nn` with `claimNext` (the API's rule) before touching any file. It copies exclusively or moves without overwriting and without staging (B05-Q6). A drawing name already taken in `files/` moves it to the next ID. A failed file step gives the claim back and leaves no copy behind | `tests/newArtifact.test.ts` (real script, scratch repository): stale snapshot (an `--import` preload hides AR-02) ends on AR-03 with its own file; tracked document moved with nothing staged; failed file step (read-only `files/`) leaves no sidecar, nothing staged, original in place; a stray `AR-02.svg` makes it take AR-03; a taken document name refused before claiming; two concurrent runs give two IDs, each with its own file |
| R-45 (server half) | **Delivered; B06 closes**: `config.revs` per section in the snapshot and config events; `PUT /api/config` with `bases` answers 409 for a stale section (`section`, `current: { data, rev }`, `blocked`); B02's guards run after | `tests/writeModel.test.ts` Settings block (second write from one base refused, file unchanged; another section saves; an agent's added status survives; B02's 422) |
| R-111 (server half) | **Delivered; B06 closes**: an unchanged patch, an empty patch, an identical whole record and a no-op batch write nothing, journal nothing and emit nothing | `tests/writeModel.test.ts` "write nothing, journal nothing and send nothing" |

**Write protocol (the contract for B07 and B06; also at the top of `server/catalogueApi.ts`):**
1. **Request shapes.**
   - Records: `PUT /api/items/:id`, `/api/questions/:id` and `/api/artifacts/:id` take
     `{ patch, baseRev, base? }`. `patch` names only changed fields: for items, `PATCH_FIELDS.item` in
     `shared/patch.ts`, with `extra` merged key by key; `id`, and an item's `type`, may be sent only
     unchanged.
   - Batch: `POST /api/items/batch` takes `{ changes: [{ id, baseRev, patch, base? }] }`.
   - Lanes: `POST /api/lanes` takes `{ op: 'rename' | 'remove', from, to?, lanesRev, stories: { id: rev } }`,
     where `stories` is every story the client holds in that lane.
   - Layout: `PUT /api/layout` may add `lanesRev` when it sends `lanes` or `firstLane`.
   - Config: `PUT /api/config` may add `bases: { section: rev }`.
   - Transport in `src/api.ts`: `patchItem`, `patchQuestion`, `patchArtifact`, `changeLane`, and
     `putConfig` / `putLayout` with the new fields. The old functions stay.
2. **Stale writes.**
   - Disk at `baseRev`: the patch applies onto the file as it is.
   - Disk moved on, with `base`: the patch merges when every patched field's disk value equals its base
     value (tidied by the same reader, so `3` and `"3"` match). Otherwise it is a 409 naming the fields.
   - Without `base`: any disk change is a 409, with no `collisions`. "Keep mine" resends the same patch on
     `current.rev`.
   - Example: an agent adds `artifacts:` while a sheet edits the description. With
     `base: { description: <as opened> }` the save goes through and keeps the artifacts.
3. **Conflict body.** A 409 carries:
   - `{ error, current }`, where `current` is the record as it is now, with its rev;
   - `collisions?: string[]`;
   - `blocked: [{ id, current, collisions? }]` for a batch, a lane change (a story the client did not know
     about is a blocker too) or config sections; `current` is then the first blocker;
   - for config, `section` and `current: { data, rev }`;
   - for lanes, `current: { data: { firstLane, lanes }, rev }` when the list moved on.
   - Status meanings are unchanged: 400 malformed (unknown patch field, missing `baseRev`, a patched field
     with no base value), 404, 409, 422 (including a lossy in-place edit), 503.
4. **Success body.** `Rev<T>` with the new rev (batch `{ records }`, lanes `{ records, layout }`). A no-op
   returns the record as it is, rev unchanged: nothing written, journalled or emitted.
5. **Config bases.** `config.revs` holds `project`, `components`, `statuses` and `questionStatuses`, each
   the rev of that section's raw JSON on disk (`null` when absent). It arrives in the snapshot, in config
   events, and in the config PUT's answer. **B07 keeps it** through its event rework.
6. **Layout.**
   - Position patches are idempotent, carry no precondition, and are never refused for lanes. The server
     does not order client batches (B07 does).
   - `layout.lanesRev` is derived (`lanesRevOf`) and never written; the store carries it through load,
     events, `setLanes` and lane changes.
   - The lane rules are refused only when a write adds a problem.
7. **Legacy shapes.**
   - `{ record, baseRev }` stays: strict on any disk change, written as the fields that differ from the
     file. So do a base-less config write and a base-less `lanes` write.
   - Each is retired by the phase that removes its last caller: B06 for the record shape (sheets) and the
     base-less config (Settings); B07 or B11 for `setLanes`, which today adds and reorders lanes without
     `lanesRev`. That phase records it.
8. **IDs and history (D-05, decision 19).**
   - Reuse stays: the top freed ID is reissued by the API and `artifact:new` alike, through `claimNext`.
   - The journal is cut on read only (B05-Q2), except that a board delete still sets it aside, and so
     does a board create at an ID with a leftover journal.
   - `currentLife` is the cut. **B09 keeps it** in `buildTimeline` and `buildArtifactTimeline`; **B07
     keeps** the `syncFromDisk` journal step: `reappeared` only when the file was missing (not unreadable)
     in the previous load.
   - Commit times are compared to the second.
9. **Store lane actions.** `renameLane` (named lanes) and `deleteLane` call `changeLane`: one request,
   no optimistic change, newer copies of blocking stories adopted. The first-lane rename stays a layout
   write (with `lanesRev`). Lane changes are outside undo. **B11** extends `/api/lanes` for R-119's
   merge, keeping all-or-nothing; a rename onto an existing lane is a 422 today.

**ID rule for B14's SCHEMA wording:** item, question and artifact IDs are reissued when the highest under a
prefix is deleted. The next record created there takes it, and its History starts with it; a record
restored as it was keeps its history. Plain-text mentions of a deleted ID stay as written and name
whichever record later takes the ID (the check warns while none does). SCHEMA lines 73, 274 ("Never
reused") and 469 to 470 ("No deletes") need this.

**What shipped:**
- **New:** `shared/inPlace.ts`, `shared/patch.ts`.
- **Changed:**
  - `server/catalogueApi.ts`: patch routes, legacy reduction, conflicts, no-op, notifier, `writeAll` with
    preflight and put-back, the lane route, the layout lane rule, config bases, the guard backstop,
    `claimNext` creates, the route comment.
  - `server/catalogueFs.ts`: in-place writers, `createAtomic` fallback, `claimNext`, `readLayout`
    `lanesRev` and `droppedLanes`, `firstLane` into the check.
  - `shared/files.ts`: exported frontmatter builders and `YAML_OPTIONS`, lint wording, header.
  - Also: `src/api.ts`, `scripts/new-artifact.ts`, and the touch-rights files below.
- **Tests:**
  - new: `tests/inPlace.test.ts` (17), `tests/inPlaceReal.test.ts` (4), `tests/writeModel.test.ts` (37),
    `tests/writeCost.test.ts` (5), `tests/newArtifact.test.ts` (6), `tests/reuse.test.ts` (14);
  - additions to `tests/store.test.ts` (5).

**Tests changed on purpose (REQ-21):**
- `tests/loadResilience.test.ts`: two whole-layout equality checks now include the derived `lanesRev`.
- `tests/oneRule.test.ts`: four `cited_as` lint messages now say a save keeps what it cannot read.
- `tests/store.test.ts`: "keeps lane renames out of card-move history" mocks `changeLane` instead of the
  batch plus `putLayout`.
- No other existing test changed. `tests/historyJournal.test.ts:173` (a new card at a reused ID starts
  clean) is kept and passes.

**Touch-rights edits (convention 11):**
- `src/store.ts` (B07/B06's):
  - `renameLane`, `deleteLane` and the new `changeLane`;
  - `lanesRev` carried in the start-up load, the layout event, `setLanes` and the first-lane rename.
- `server/catalogueApi.ts` `syncFromDisk` (B07's): events through the notifier when a request calls it;
  `reappeared` passed to the journal.
- `server/historyJournal.ts`: `created` entries carry the record; the `reappeared` option.
- `shared/history.ts` (B09's): `currentLife`, `assetLife`; `item?` on `JournalEntry`; `start` to the second.
- `shared/check.ts`: the lane-list report and the `firstLane` input.
- `shared/config.ts`: `revs`, `CONFIG_SECTIONS`, `configRevs`, the `ConfigPatch.bases` type.
- `shared/move.ts`: `laneListProblems`, `addedProblems`, `lanesRevOf`.
- `shared/types.ts`: `Layout.lanesRev`.
- `scripts/new-artifact.ts` (B14 sweeps paths later).
- `scripts/capture.ts` (B12/B14's): "changed" judged by the writer's rev.
- `agent/skills/add-artifact/SKILL.md`: the move line.
- `requirements/SCHEMA.md`: catalogue doc lines only, no requirement.
- `docs/board-fixes/index.html`: B05 status.

**Deviations:**
1. **The lane route re-reads the folder before planning**, as delete does.
   - Measured on 400 synthetic cards, a 40-story rename: before (batch then layout) 58 ms and 82 events;
     B05's lane route 117 ms and 42 events (the extra is that one folder load); the batch path alone is
     now 46 ms and 43 events.
   - REQ-14's bound holds: one load and constant checks, not records times catalogue size.
2. **A drawing name already taken in `files/` moves `artifact:new` to the next ID** rather than failing
   (review). A taken document name still fails before claiming.
3. **The canonical fallback** (a file the splice cannot handle, such as anchors or a flow mapping) is
   allowed to add keys the board always writes (an empty `components`) but never to change or drop one.
4. **Timeline times are compared to the second** (git's resolution), including `buildTimeline`'s
   journal-start divider rule (review).
5. **IMPLEMENTATION.md** is the approved plan file plus "As built", "Recovery" and "Handoff" sections.

**Verification:**
- **`npm run verify:board` green:** 891 tests, check OK.
- **Real catalogue:** `npm run check` output byte-identical to the pre-B05 board's on the same folder; no
  file under `requirements/` changed but SCHEMA.md.
- **Agent tool suites:** 29 pass (SKILL.md touched).
- **Fixture e2e (5182):** 109 of 110 pass.
  - The failure is `one-rule.spec.ts` R-101 (a viewer pixel box), which fails 2 runs in 3 on the
    pre-B05 board too (Discovered).
  - `board-mapped.spec.ts` (lane rename through `/api/lanes`), `item-delete`, `settings`, `artifacts`,
    `status-picker` and `question-answer` pass (65).
  - Under a load average of 16, one run saw `board-mapped` "clicking a lane name renames it" fail once in
    three, and one full run saw its undo test fail once. Neither reproduced in 6 single runs, 4 whole-spec
    runs (52 of 52) and a full-suite rerun.
- **Before-proofs** (scratchpad `git archive 429b35ce`):
  - `writeModel` 30 of 31 fail (R-64's block left out: the old code has no link injection; the one that
    passes is a preservation check);
  - `reuse` 8 of 12 (the 4 that pass are restore and preservation cases);
  - `newArtifact` 4 of 5;
  - `writeCost` 4 of 5;
  - the store's lane tests 6 of 6.
  - `inPlace*.test.ts` fail on import there; their behaviour is shown failing through the API in
    `writeModel`'s R-37 block.
  - The review regression tests were each shown failing with the fix taken out (parse gap, preflight) or
    before the fix (same second, repeated heading, empty-value comment, stray drawing, unreadable-layout
    422).
- **Manual:** exFAT image (R-64, above). **Migration:** none.

**Review outcomes (convention 15):** two Sonnet reviewers (diff about 2,000 changed lines outside tests).
- **Confirmed and fixed, each with a regression test:**
  - a card whose file was unreadable for one sync, then repaired with a change, started a new life and hid
    its history (both reviewers);
  - a repeated or out-of-order body heading was reordered on a title edit (the yardstick now takes the body
    as `next` holds it, and the read-back requires the result to parse as intended);
  - a key with an empty value lost its trailing comment when given a value;
  - the canonical fallback refused harmless added default keys (anchors, flow-mapping files);
  - a commit in the same second as a board create was dropped as the old card's;
  - a write of several files could write and put back before refusing a lossy edit (a preflight dry run
    now runs first);
  - `writeAll` read any error as "no file" and could delete on put-back, and missed a step that wrote and
    then failed;
  - `artifact:new` left a copy behind after a late failure, and dead-ended on a stray `AR-nn` drawing;
  - a lane change on an unreadable layout with no `lanesRev` answered 400, not 422;
  - three copies of the JSON equality helper (now `sameValue` in `shared/patch.ts`);
  - the README `artifact:new` sentence;
  - the `writeRecordFile` comment;
  - the CHANGELOG exFAT wording.
- **Not reproducible:** the reviewer's "no exFAT manual check" (done; recorded above).
- **Recorded, not changed** (Discovered):
  - an artifact ID reissued before its deletion is committed (artifacts have no journal, so there is no
    mark);
  - a hand delete and re-create inside one watcher debounce reads as an edit;
  - `writeAll` reads a file's bytes a moment before the writer's own read, so an agent write in that
    window would be put back over on a later failure;
  - the empty-file moment in `createAtomic`'s fallback (documented);
  - `useEditableRecord.ts` and `shared/steps.ts` keep their own JSON equality.

**Doc facts (convention 12):**
- **`requirements-board/README.md`:**
  - the shared map (`inPlace.ts`, `patch.ts`) and the server map (`catalogueFs.ts`, `catalogueApi.ts`);
  - "How it works": the save and conflict bullet (patch, base, collisions, blocked, no-op, legacy,
    Settings revs); the write bullet (in place, 422 on loss, creates without hard links, put-back, one
    check);
  - the Mapped lanes text (`POST /api/lanes`, `lanesRev`, 40 characters, rules reported, moves never
    refused);
  - the Delete bullet (ID reuse, restore, plain-text mentions);
  - the `artifact:new` paragraph (never staged, claimed first, stray drawing).
- **`requirements/SCHEMA.md`:** the `lanes` paragraph (40 characters, the check, same change) and the
  `cited_as` row (a save keeps unread keys).
- **`agent/skills/add-artifact/SKILL.md`:** the move line.
- **Headers:** `server/catalogueApi.ts` (routes and the write protocol), `shared/files.ts`,
  `shared/inPlace.ts`, `shared/patch.ts`, `scripts/new-artifact.ts`.
- **`CHANGELOG.md`** 1.18.0.
- **Checked, nothing changed:** the About page says only "Rename and add them from the board's lane
  headers". ADOPTING says none of this.
- **For B14:** the ID rule above for SCHEMA lines 73, 274 and 469 to 470.

**What later phases need:**
- **B07:**
  - the contract above (items 5, 6, 8 and 9);
  - keep `config.revs` and `layout.lanesRev` through the event rework;
  - keep the notifier (`pending`, `notify`, `issuesChanged`, `flush`) or replace it with its own
    batching (R-159), still sending one issues event per request;
  - keep the `syncFromDisk` journal step;
  - `setLanes` still sends no `lanesRev` (legacy, D-04e);
  - the lane route's folder re-read is a candidate for B07's incremental re-sync.
- **B06:**
  - switch sheets to `patchItem` / `patchQuestion` / `patchArtifact` with `base` (R-02, R-41: rebase on
    the returned rev; read `collisions` for Keep mine / Load theirs);
  - switch Settings to `bases` from `config.revs`, closing R-45 (the 409 carries `section` and `current`);
  - gate saves on a real change, closing R-111 (the server already writes nothing);
  - then retire the legacy record and base-less config shapes (D-04e) and record it.
- **B09:** keep `currentLife` in both timeline builders; per-file screenshot bounds (`screenshotsEnded`)
  within one card's life are not cut, and B09 may draw them. `start` and the cut compare to the second.
- **B11:** extend `/api/lanes` for R-119's merge (a rename onto an existing lane), keeping all-or-nothing
  and the `lanesRev` check.
- **B12/B14:** `capture.ts` judges "changed" by `writeItem`'s rev. `artifact:new` paths are B14's
  (`filesDir`, `REPO_ROOT`).
- **B14:** the ID-rule wording above; the README lines above in the whole-file pass.
- **B15:** rerun `tests/{inPlace,inPlaceReal,writeModel,writeCost,newArtifact,reuse}.test.ts`, the store's
  lane tests and `e2e/board-mapped.spec.ts`; repeat the exFAT check if a machine allows.

### B08 · Git history reader · COMPLETE · 2026-11-19

Board 1.16.0 to **1.17.0**. Plan and evidence: `phases/B08-git-history-reader/IMPLEMENTATION.md`.
Decisions: accepted decision 19. The user answered D-05, B05-Q2, B05-Q3 and D-07(d) in this session:
D-05 was asked here as the planning-only gate of accepted decision 8, so B05 does not ask it again.
The other parts of D-07 and B08-Q1, Q2, Q3, Q5 and Q6 were settled from evidence and shown in the
approved plan. Both SPECs mark them answered. No master merge was needed. All ten findings were checked
at HEAD `f3c7d9f8` before the build: the territory files were unchanged since `d4341735`, and B01 had
moved the history-blob route.

**Dispositions**

Each proof is in `tests/gitReader.test.ts` and runs in SHA-1 and SHA-256 fixture repositories. Each
failed on the pre-B08 board and passes after.

| Finding | Disposition | Proof |
|---|---|---|
| R-23 | **Fixed**: every reader walks HEAD's first parents, each commit against its first parent; a `--no-ff` merge is one entry (the merge) | (a) to (d) as the SPEC table; (e) each reader against a `rev-list --first-parent` + `diff-tree` truth. Fast-forward lists the lane commits (preservation) |
| R-24 | **Fixed**: `-z` output, `core.quotePath=false`, literal pathspecs, token-wise parsing, any byte but NUL in a name. The FINDINGS claim "empties every card history" holds only for a moved non-ASCII folder; a never-moved card already worked (SPEC correction) | `Transcript – 12 Nov.md`, `café.png`, quote, backslash and tab names under quotePath default and false; a moved non-ASCII folder; a newline and a `\x1e` in a name |
| R-69 | **Fixed** (D-07(d), user): an unchanged plain `mv` is followed; staged renames cached by the index identity, so no stale read after staging, unstaging or committing | main checkout and linked worktree: before staging, after `add -A`, after `reset` |
| R-70 | **Fixed**: an earlier path counts only up to the commit that moved the file; a rename-away ends the history at that path | `pricing.svg` archive scenario both ways; an A to B to C chain plus a new card at A |
| R-71 | **Fixed**: screenshots followed per file through their own renames; an earlier folder counts only when the move emptied it | `b.png` from US-1 to US-2 (US-2 lists only b's rewrites, US-1 only a's); a whole catalogue moved |
| R-72 | **Fixed**: working files named as `git add` would (index name when unchanged, else `hash-object --stdin-paths`); route serves with filters and accepts either name on disk | autocrlf, `* text eol=crlf`, a clean-filter driver: `working == head`, sidecar-only edit no file change, uncommitted working name served; working name follows an autocrlf change. Real LFS not installed: manual check left open |
| R-73 | **Fixed**: object names of either width everywhere; journal hashes in the repository's width (B08-Q3: re-hash, no change logged) | SHA-256 matrix; journal change fetched through the route; a SHA-1 hash kept in a SHA-256 journal re-hashed silently |
| R-74 | **Fixed**: `withToday` applies today's artifacts on every response; the git work stays cached | watched reader, AR-01 retitled, `touched()`: context equals a fresh reader's, no `diff`/`log`/`ls-tree`/`cat-file` run (shim count) |
| R-161 | **Fixed**: whole move context shared in flight, rename log memoised per HEAD, staged renames keyed by the index found through git | Diff count runs the rename log once (was 3); linked worktree second read runs no staged diff, after `add` runs one; failed read retried (preservation) |
| R-162 | **Fixed**: every territory cache is an `Lru` with HEAD in its key (bounds below) | `historyCacheSizes()` sizes within bounds over many HEADs; `Lru` eviction order and bound over 200 keys |
| R-54 support | **Delivered; B05 closes** | delete then re-add (card, asset, screenshot): `deleted` marker at the delete, both sides readable; revert keeps both readable; branch switch and stash make no bound; rename-away and deletion at one path each bounded |

**B08-Q6 result:** confirmed. A plain `git status` rewrote `.git/index` (it takes `index.lock` to
refresh stat data); with `GIT_OPTIONAL_LOCKS=0` the index stays untouched. Proof: the index's inode and
mtime are unchanged after `gitDirty`, `gitFileHistory` and `gitAssetHistory` on a stat-dirty fixture.
Real lane A: three Diff counts and two card histories left its index untouched.

**Contract for B05** (deletion bound, D-07(e) option 1):
- **Shape.** `GitFileHistory.versions` is the full list, newest first. A version with
  `deleted: true` (and `item: null`) is the commit that deleted the file, a committed deletion on HEAD's
  first parents. Every version after it in the list is the path's earlier life.
- **Other readers.** `AssetCommit.deleted` marks the same for an artifact file. For screenshots,
  `GitFileHistory.screenshotsEnded: { src, commit }[]` (from `gitScreenshots().ended`, newest first) is
  passed into the item history route's timeline input; rewrites in `screenshots` older than a file's
  `commit` belong to that file's earlier life.
- **Restore against reuse (B05-Q3, decision 19).** Compare the version just before the `deleted` one
  (the deleted record's last state) with the version just after it (the re-added record's first): a
  restore continues, anything else starts fresh.
- **When there is no bound.**
  - A rename-away is not a bound: the history simply stops there.
  - A reuse with no committed deletion (deleted and re-created in one commit, which git sees as an
    edit) gets no bound; B05-REQ-20 cuts that case itself.
  - Nor does a deleted card that git's `-M` pairs with a similar new card in one commit (Discovered).
- **Journal (B05-Q2).** Cut it when reading, at the newest `deleted` version's commit; never on a file
  merely missing. `buildTimeline` is unchanged, so B05 applies the cut there.

**Contract for B09:**
- **Order and merges.** Lists are newest first in graph order along HEAD's first parents, and adjacent
  entries are true first-parent before-and-after pairs. Dates may be out of order after a rebase or
  cherry-pick. A merge carries its own subject, author and date, and lane commits are not listed
  (B08-Q1).
- **Deletions and moves.** A deletion version has `deleted: true`. Pure moves are absent; a move that
  also edited the file is one entry.
- **Screenshots and blobs.** Screenshot entries name files `assets/<ID>/<today's name>`. Blob names are
  in the repository's width and fetchable at `/history-blob/<sha>?src=` or `?artifact=`, served as
  checked out (an LFS version as its pointer). `AssetHistory.working` is the clean-form name, equal to
  `head` when unchanged.
- **Freshness.** A read after any change to the index or working tree reflects it, so the client never
  needs to bust a cache. No new marker for unstaged moves: they are followed (D-07(d)).

**Cache keys and bounds (D-07 a, b):**

| Cache | Key | Bound |
|---|---|---|
| file versions | top, HEAD, parser, the chain of paths | 256 |
| asset commits | top, HEAD, the chain of paths | 128 |
| screenshot commits | top, HEAD, card, files, starts, paths | 128 |
| rename log | top, HEAD | 4 |
| staged renames | top, HEAD, index identity (`--git-path index`: size, mtime, inode) | 8 |
| working-name hashes | path, size, mtime, inode, repository config, `info/attributes`, the top and the file's own `.gitattributes` | 512 |
| history-blob checks | sha, path (true answers only) | 2000 |
| tops, formats, index and config paths, empty trees | folder or top | 64 each |

Unstaged moves are read afresh on every read (`ls-files --deleted`; `--others` and hashing only when a
tracked file is missing). The move context is shared while in flight.

**What shipped:**
- **New:** `server/gitCore.ts`; `server/gitRenames.ts` and `server/gitHistory.ts` rewritten (one
  first-parent `walk`).
- **Changed:** `server/catalogueDiff.ts` (shared `Lru`/`memo`, `workingNames`, `withToday`, `kept`);
  `server/historyJournal.ts` (`gitBlobSha(buf, format)`, width-aware scan); `shared/history.ts` (optional
  `deleted`, `screenshotsEnded`).
- **Tests:** `tests/gitReader.test.ts` (60), `tests/gitFixture.ts`.

**Touch-rights edits (convention 11):**
- `server/cataloguePlugin.ts` (B01/B07's; history-blob route only): the `?src=` gate, filtered serving,
  the `onDiskIs` disk fallback, and `seenAt` as an `Lru`.
- `server/catalogueApi.ts` (item history route): passes `screenshotsEnded`.
- `docs/board-fixes/phases/B05-server-write-model/SPEC.md`: D-05, B05-Q2 and B05-Q3 marked answered.
- `docs/board-fixes/index.html`: B08 status.

**Deviations:**
1. D-05 was asked in this session, not a separate B05 planning session, with the user's answers;
   recorded as decision 19.
2. IMPLEMENTATION.md was saved after the first build rather than before; the approved plan file held
   the plan.
3. **B08-Q2 as built.** The decision says the stored blob when the filter cannot run. The review
   showed LFS smudging could fetch from the network inside a request, so `GIT_LFS_SKIP_SMUDGE=1`
   serves LFS versions as their pointer. Other filters still smudge.
4. The three existing git test files (B08 territory) gained a 60 s test timeout (see Verification).
5. Beyond the SPEC, from the review:
   - inherited `GIT_DIR`-style variables are dropped, and `status.showUntrackedFiles` and other output
     settings are pinned;
   - long path lists are sent to git in slices.

**Verification:**
- **`npm run verify:board` green:** 803 tests, check OK. An earlier run under load averages of 20 to 27
  timed out at 5 s in `gitHistory`, `historyJournal` and `catalogueDiff` tests, which all pass alone.
  The readers run one more git process per read than before, so those files now set 60 s.
- **Before-proofs:** `tests/gitReader.test.ts` was run against an archive of `f3c7d9f8` in the
  scratchpad: 49 of 59 fail. The 10 that pass are preservation checks (fast-forward, branch switch and
  stash, retry, no repository) or old-code-compatible configurations (non-ASCII folder with quotePath
  false, SHA-1 whole-catalogue screenshot move, SHA-1 R-73). The 60th test (`Lru`) fails there on
  import.
- **Real repository (read-only):**
  - card `US-01.4.6`: history 5.5 s cold before, 2.6 s now; warm 0.12 s, 0.11 s. Diff count 0.29 s,
    0.33 s.
  - the wave merge now appears as the merge carrying the same `images` change, where the lane commit
    stood. No other entry moved.
  - lane A worktree: three concurrent Diff counts ran one rename log; the second card read ran no
    staged diff; the index was untouched.
- **Not run:**
  - Playwright: no spec touched.
  - Real LFS: git-lfs is not installed, so this stays an open manual check; a filter-driver fixture
    stands in.
- **Migration:** none.

**Review outcomes (convention 15):** two Sonnet reviewers (about 1,200 changed lines outside tests).
- **Confirmed and fixed, each with a regression test that fails on the pre-B08 board:**
  - untracked files read as clean under `status.showUntrackedFiles=no`;
  - an inherited `GIT_DIR` redirected every read;
  - a `\x1e` in a path split the log parse;
  - the working-name cache ignored conversion config.
- **Also fixed:**
  - `"`-leading paths in `hash-object --stdin-paths`;
  - command-line overflow on a mass move;
  - LFS network smudge;
  - a duplicated object-format helper, an unused helper, a dead alias, a doubled flag;
  - the R-162 test could not fail (now an eviction proof).
- **Recorded, not changed** (IMPLEMENTATION.md):
  - clean filters run when naming a changed file (git-lfs writes under `.git/lfs/objects`, never the
    index or refs);
  - per-read costs (Discovered);
  - global config and other folders' `.gitattributes` not in the hash key;
  - an unstaged move that also changes the basename under line-ending conversion is not paired;
  - `-M` pairing a deleted card with a new one (Discovered, B05).
- **Not reproducible:** none.

**Doc facts (convention 12):**
- **`requirements-board/README.md`:**
  - the server map (`historyJournal.ts`, new `gitCore.ts`, `gitHistory.ts`, `gitRenames.ts`);
  - the History bullet: first parents, bounded renames, plain `mv`, `deleted`, any name, both widths,
    no lock;
  - the screenshots paragraph: width, re-hash, per-file;
  - the `/history-blob/` line: `?src=` gate, served as checked out, LFS pointer, clean-form names.
- **`CHANGELOG.md`** 1.17.0, naming the visible merge-history change and the journal width behaviour.
- **Headers** of `gitCore.ts`, `gitHistory.ts`, `gitRenames.ts` and `historyJournal.ts`.
- **Checked, nothing changed:** the About page ("Git keeps the history"), SCHEMA, ADOPTING and SKILL.md
  state none of this.

**What later phases need:**
- **B05:** the contract above. Apply the bound in the journal step and `buildTimeline`. A restore is
  recognised by comparing the versions either side of `deleted`. Reuse with no committed deletion, and
  `-M`-paired cards, get no bound (B05-REQ-20). D-05, B05-Q2 and B05-Q3 are recorded; do not ask again.
- **B07:** keep the `cataloguePlugin.ts` history-blob changes when reworking the watcher. The readers
  need no watcher signal.
- **B09:** the contract above; `catalogueDiff.ts` now imports `Lru`, `memo` and `workingNames` from
  `gitCore.ts`. Its `:135` mixed-path item (Discovered) is untouched.
- **B10:** an LFS version is served as its pointer (Discovered).
- **B14:** README and CHANGELOG lines above in the whole-file pass; SCHEMA's ID-reuse text now follows
  D-05 "reuse stays".
- **B15:** rerun `tests/gitReader.test.ts` (both widths) and the three git test files.

### B04 · One rule, one helper · COMPLETE · 2026-11-19

Board 1.15.0 to **1.16.0**. Plan and evidence: `phases/B04-one-rule-one-helper/IMPLEMENTATION.md`
(its "As built" section lists what changed from the plan). Decisions: accepted decision 18 (D-03,
B04-Q1 to Q3), asked in this session; the SPEC marks them answered. Master merged first (`b45ab027`:
wave-2 catalogue and plan files, no board code). All 18 findings reproduced at HEAD `85af0de0` before
the build (line drift only).

**Dispositions**

| Finding | Disposition | Proof (each failed on the pre-B04 code, passes after) |
|---|---|---|
| R-27 | **Fixed**: `mermaidNodeIds` reads statements as mermaid does (node, link, node; `&`; shapes skipped by bracket matching; labels, `@{}`, `:::` removed first); no `o`/`x` head becomes a node | `tests/oneRule.test.ts` mermaid block (R-27's cases, every shape and link form, `node=B` on `A --> B[Label]` passes the check); `tests/oneRuleBrowser.test.ts` equals mermaid's own `getVertices` over the corpus |
| R-28 | **Fixed**: MarkdownReader gives each heading the slug of the source heading on its line (`data-ls` = `heading.line`); `heading=` found by source text then line | jsdom reader test (ID heading drawn as its title, slug kept); `e2e/one-rule.spec.ts` (every heading's slug, each opens, Sections click); real catalogue `e2e/artifacts-real.spec.ts` on port 5481: every Markdown artifact's DOM slugs equal the server's (pre-B04: AR-31, 33, 40, 41, 43, 58 wrong), AR-58 `9.1 Catalogue, EP-04 Contracts` opens from its link and the Sections list |
| R-38 | **Fixed**: `lintArtifact` lints `cited_as` (not a list, odd entry, unknown key with did-you-mean), each "dropped on the next board save" | lint tests |
| R-60 | **Fixed**: one code rule (`shared/markdownCode.ts`); `unlink` finds links in the code-masked text, as `mentions` does, and keeps the words as written; images are links for neither (B04-Q1) | corpus agreement; property test over every delete plan (every surviving record); API delete of the FINDINGS body succeeds with no link left; link whose words hold code (review) |
| R-61 | **Fixed**: spans pair equal runs, never across a blank line; a lone backtick is text | corpus; renderer parity (links drawn as `<a>` outside code equal `mentions`) |
| R-62 | **Fixed**: `mentionsOf` reads fields one at a time (joined order kept: explicit, then bare); used by `check.ts linksIn` and `artifactIndex.ts` | check finds the hidden broken link; index finds `AR-03#step-2` past a backtick and an unclosed fence |
| R-75 | **Fixed**: `spotExists` (`shared/sources.ts`), the one spot rule; `cited_as` `spot` may be a page or line range | `spot: p27`, `spot: L1-10` pass; `p99` still errors |
| R-76 | **Fixed**: page on a non-PDF, lines on a non-Markdown file, `L0`, `L33-27`, points on a file with none each warn naming artifact and spot | source tests |
| R-77 | **Fixed**: `ARTIFACT_REF` (`AR-nn#<spot>`, any slug) in the check and `pastedTarget`; existence by the spot rule | `AR-05#te-reo-māori` passes and pastes |
| R-78 | **Fixed**: `OQ-01 · answered by Sam` is OQ-01; a mistyped `OQ-01.5` still warns | grammar tests |
| R-79 | **Fixed**: hand-on first, then spots and problems on the replacement; a spot it lacks opens the whole replacement | `Old spec p.40` opens AR-02 p40 with no problem |
| R-80 | **Fixed** (B04-Q2): `#2 #3`, `#2#3`, `#2, #3` all check every point; never NaN | grammar tests |
| R-81 | **Fixed**: one words/spot split (`noteWords`); "no note ..." or "names the note ..., but "<tail>" ... is not a spot" | grammar tests |
| R-82 | **Fixed** (B04-Q3, warnings): two sidecars on one `file` warn naming each other; a prefix listed twice by one artifact is a repeat warning, not a clash with itself | check test |
| R-83 | **Fixed**: one inline reader (`inlinePlain` / `readable`) for heading and quote text: intraword `_` kept, entities, `# C#`, `~~`, reference links by the document's definitions, autolinks, escapes, code content; a stray `<` no longer swallows text | heading corpus (node, and equal to react-markdown's rendered words); check accepts `heading=fee_schedule rules`, `Q&amp;A` slug `qa` |
| R-84 | **Fixed** (B04-Q3, warning): `matchSimpleSelector` returns `'invalid'` for an empty part; the check warns the board draws nothing | selector tests |
| R-85 | **Fixed**: block scalars skipped, list-item key stripped, each hit confirmed against what YAML kept; a whole-line comment not flagged (review) | lint tests; `- as: Board pack #2` still warns |
| R-101 | **Fixed**: `looseChars` (NFC per character with source offsets) used by `looseText` and `quoteRange`; a bare ID drawn as a title is matched by its source text (`data-source-text`) | jsdom `quoteRange` (range is exactly the NFD passage); e2e box over the NFD passage within a pixel |

**D-03 contract for B13 (and B12):** an agent tool imports, from the catalogue path `req` it already
takes, `shared/sources.ts` (`resolveNoteCite`) and `server/sourceIndex.ts` (`loadSourceIndex`):
`resolveNoteCite(loadSourceIndex(req), cite)` returns `{ id, file }` for the note (under `notes/`) the
board's `resolveSource` opens for that cite, or null (a cite whose words match no note is null, never
"the first note of that date"). Proven by `agent/shared-rules.test.mjs` (plain `node --test`) over every
note, every `Notes ...` source in the catalogue and the R-141 shapes (apostrophe titles, no points), on
Node 24.22 and on the official Node 22.18.0 (checksum verified; no warnings), and from a copy outside
the board located through `REQUIREMENTS_DIR` (the copied install mode). A kit export ships the board
beside the catalogue, so the same import works. Not supported: the workflow runtime and generated
browser pages (ref-kit's inline matcher) cannot import; B13 resolves in Node and embeds results.
`shared/` stays erasable TypeScript with `.ts` extensions and `import type` (checked by review).

**Real catalogue, before and after:** `npm run check` output byte-identical (no errors, no warnings).
Heading slugs: 602 headings in 45 Markdown artifacts, identical (texts, slugs, depths, lines); the 15
headings holding a record ID (the SPEC counted 14; the master merge added one) keep their server slugs,
and no `within`, `spot`, `artifacts:`, text link or `heading=` anchor references any of them. Point
titles: 12 in AR-33 and AR-41 now keep intraword underscores (`RVG_GROUP`, `is_billable_party`), as the
page shows them; 73 source rows differ only in that label, and every source opens the same artifact and
spot. Quote text: AR-34 and AR-58 gained text the old tag stripper deleted between a stray `<` and a
later `>` (66 lines of AR-34's tables). No hidden link surfaced. Timing: whole check runs are dominated
by machine load today (0.8 to 3 s either side); measured in process, Markdown facts over every note cost
about 1.5 times the old reader (all of it the new inline reader; facts are cached per file version).

**What shipped:** new `shared/markdownCode.ts`, `server/sourceIndex.ts`; changed `shared/links.ts`
(`mentions` on the shared code rule, images not links, `mentionsOf`, `LINK_SOURCE`, `ARTIFACT_REF`,
`pastedTarget`), `shared/remove.ts` (`unlink`), `shared/artifacts.ts` (`normText` NFC, `looseChars`,
`inlinePlain`/`readable`, `linkDefinitions`, `atxHeading`, `markdownReadable`, fences via `fenceMask`,
`mermaidNodeIds`, `matchSimpleSelector`), `shared/sources.ts` (`spotExists`, `noteWords`, `parseRest`,
hand-on, `resolveNoteCite`, `repeats`, citation spots), `shared/check.ts` (per-field links, spot rule,
selector warning, repeats and shared-file warnings, entry shape), `shared/files.ts` (lint),
`src/artifactIndex.ts` (per field; `spotName` through `spotExists`), `src/artifacts/MarkdownReader.tsx`,
`src/artifacts/regionsDom.ts`. Tests: `tests/oneRule.test.ts`, `tests/oneRuleBrowser.test.ts`,
`tests/oneRuleCorpus.ts`, `agent/shared-rules.test.mjs`, `e2e/one-rule.spec.ts`, a test in
`e2e/artifacts-real.spec.ts`; `tests/sources.test.ts` one message's wording.

**Touch-rights edits (convention 11):** `src/components/Prose.tsx` (B06/B07's: `data-source-text` on the
bare-ID link and a wrapper span in `recordLinkComponents` only; no rendering change);
`playwright.config.ts` (`one-rule.spec.ts` in the fixture project; `BOARD_E2E_REAL_PORT`);
`e2e/artifacts-real.spec.ts` (one test); `requirements/SCHEMA.md` (catalogue doc; rules lines only, no
requirement); `agent/skills/add-artifact/SKILL.md` (spot lines); `docs/board-fixes/index.html` (B04 status).

**Deviations:** (1) A loader, `server/sourceIndex.ts`, was added so B13 need not rebuild the index itself
(review). (2) `resolveNoteCite` answers for notes only. (3) `BOARD_E2E_REAL_PORT` added so the R-28 proof
could run on the real catalogue off 5181. (4) `spotName` in `src/artifactIndex.ts` moved onto the spot
rule (a second copy the acceptance search found). (5) The mermaid corpus is checked against mermaid's
own parser, beyond the SPEC's "ideally". (6) Mid-phase I marked the new files intent-to-add (`git add -N`) to
count the diff, against convention 9, and undid it at once (index clean; no commit affected).

**Verification:** `npm run verify:board`: typecheck clean and the catalogue check OK; in the full Vitest run (load
averages 20 to 34 all afternoon, not from this session) 737 of 743 passed and 6 timed out at 5 s, all in
git-history, Diff, live-origin and skill-install tests B04 does not touch. Each of those files passes
alone (36 and 68 tests), and the same git files time out on the pre-B04 board under the same load (the
Discovered item from B01 and B02). Fixture e2e on 5182: 107 passed (105 plus 2 that failed while my edits
reloaded Vite mid-run under load, rerun green; 37 of 37 in their specs). `e2e/one-rule.spec.ts` 3 of 3,
and 3 of 3 fail on the pre-B04 board; real-catalogue slug test passes on 5481 and fails on the pre-B04
board. Before-proofs: the final `tests/oneRule.test.ts` and `tests/oneRuleBrowser.test.ts` (41 tests)
against `git archive` of `b45ab027` in the scratchpad: 39 fail, the 2 that pass are preservation checks
(the check-side NFD quote, a non-flowchart not read); the agent proof fails there (no resolver). Agent
tool suites: 29 plus 2 pass. Node 22.18.0: agent proof and `scripts/check.ts` pass. **Migration:** none;
no file under `requirements/` changed but SCHEMA.md.

**Review outcomes (convention 15):** two Sonnet reviewers (about 900 changed lines outside tests).
Confirmed and fixed: a link whose own words hold code was counted by `mentions` but not rewritten by
`unlink` (the R-60 422 again; now one masked-offset rule); `heading=`, `text=` and slugs compared without
NFC (REQ-03.4); `resolveNoteCite` could return a non-note, and agents had no shared way to build the
index; malformed `OQ-` sources went silent; whole-line YAML comments warned; emphasis across a code span
kept its marks; raw private-use and BOM characters in two regexes; Prose restructured more than needed
(cut to a wrapper); README snippet not runnable; `BOARD_E2E_REAL_PORT` under the wrong CHANGELOG bullet;
`:is()` selector; one `byFile` key; `ARTIFACT_REF` comment; R-62 unclosed-fence and Prose wiring tests
missing; the agent proof's project-specific cases (now derived from the notes). Also found by my timing
check: `looseChars` made Markdown facts ten times slower (fast path added). Not reproducible / not taken:
mermaid statements starting `end-1`, `style-x` (mermaid itself refuses them); exporting the global
`LINK` regex (each module keeps its own instance on purpose; global regexes carry state); dropping the
`export` of `noteWords`, `linkLabel`, `linkDefinitions` (kept for B13 and tests); the parity proof being
"tautological" (it proves the agent import path and index building, which is the D-03 question; the
rule itself is shared by construction). Recorded below: named entities beyond six, the lint's
string-pool false negative, unspaced edge labels, the agent proof outside `verify:board` (B12).

**Doc facts (convention 12):** `requirements-board/README.md` shared and server maps (`markdownCode.ts`,
`links.ts`, `sources.ts`, `sourceIndex.ts`, the `artifacts.ts` line) and a new section "One rule, one
implementation (agent tools too)" with the import recipe and the erasable-TypeScript rule;
`requirements/SCHEMA.md` Links (what counts as code, images), Sources "Which spot" (point lists, hand-on)
and "Check" (which spots warn, `OQ-nn` with words), the `cited_as` row (`spot` kinds, new warnings);
`agent/skills/add-artifact/SKILL.md` `--cited-as` lines (pages PDFs only, lines Markdown only, point-list
forms, `spot:` kinds); `playwright.config.ts` header (`BOARD_E2E_REAL_PORT`); `CHANGELOG.md` 1.16.0;
headers of the new modules. About page checked: it states none of these rules.

**What later phases need:**
- **B05:** the `cited_as` lint says keys are "dropped on the next board save"; when R-37 stops that, change
  the wording in `lintArtifact`. `files.ts` lint and `check.ts` are in their B04 shape.
- **B06:** `check.ts` in its B04 shape; Prose's `recordLinkComponents` wraps a bare ID in
  `<span data-source-text>` (keep it, or carry the attribute another way, for `quoteRange`).
- **B10:** MarkdownReader assigns `data-slug` by source line and finds `heading=` by source text then line
  (keep both through R-100's effect keys); `quoteRange` reads `SOURCE_TEXT_ATTR`; viewers use
  `normText` and `looseChars` from `shared/artifacts.ts`.
- **B12:** add `agent/shared-rules.test.mjs` to `verify:board` with the other agent tests (accepted
  decision 6); the same import mechanism is open to the plan tools.
- **B13:** the D-03 contract above for R-141; `scripts/linkProposals.ts` and `scripts/link-index.ts`
  should drop any private code rule for `mentions`/`maskCode`.
- **B14:** README section above in the whole-file pass; `BOARD_E2E_REAL_PORT` in the env-path sweep.
- **B15:** rerun `tests/oneRule*.test.ts`, `agent/shared-rules.test.mjs`, `e2e/one-rule.spec.ts` and,
  with `BOARD_E2E_REAL=1`, the real slug test.

### B03 · Load resilience · COMPLETE · 2026-11-19

Board 1.14.0 to **1.15.0**. Plan and evidence: `phases/B03-load-resilience/IMPLEMENTATION.md`.
Decisions: accepted decision 17 (D-06, B03-Q2, B03-Q3), asked in this session; the SPEC marks them
answered. No master merge was needed (master had nothing `board-fixes` lacked). All 14 findings
reproduced at HEAD `277e8381` before the build (line drift only).

**Dispositions**

| Finding | Disposition | Proof (each failed on the pre-B03 code, passes after) |
|---|---|---|
| R-10 | **Fixed** at the root: store `descendantsOf` seeded with the start; Freeform places every card no epic reaches below the map, cycle members once each; the check names each cycle on every member. The boundary is only the backstop | `tests/loadResilience.test.ts` "parent cycles"; `e2e/bad-data.spec.ts` self-parent on the board in both modes and on reload; manual on 5480 |
| R-11 | **Fixed**: `canParent` via `parentTypesOf`; `typeLabel`/`typeRank` (`shared/types.ts`) at every type lookup (ItemModal delete question, CardNode, bits, itemSearch, BoardMinimap, csv, DiffFields, `scripts/link-index.ts`) | unit tests (canParent, mappedLayout, CSV); e2e unknown type: Mapped board, sheet, "Delete this user-story?", tooltip |
| R-47 | **Fixed**: `artifactInfo` never throws; a read or contents failure is the artifact's error and is not cached; `withMeta`'s load primes PDFs safely; the check is backstopped (`issuesFor`: one "the check could not finish" error) | unreadable SVG then readable in one process; check backstop test |
| R-48 | **Fixed**: only code points 0 to U+10FFFF decode | entity tests; sidecar SVG with `&#99999999;` loads |
| R-49 | **Fixed**: scan never throws; unstat-able entries skipped; an unreadable image keeps its last record; a torn or wrong-shape `shots.json` read as none and rewritten | `tests/loadResilienceApi.test.ts` (dangling link, mode-000 image, torn record; start, sync and DELETE succeed) |
| R-50 | **Fixed** (B03-Q2: next save drops): `readLayout` returns `{ layout, error?, damaged? }`; damaged entries named in an error on `layout`; layout PUT drops them and clears the issue; delete's tidy cannot fail the delete; a non-object top level says so and still blocks; `__proto__` keys never set | readLayout tests; API layout PUT and DELETE over junk; `null` top level 422, file unchanged |
| R-51 | **Fixed**: `src/storage.ts` (`readJson` + `fields`, `writeJson`) used by the Viewed store, view prefs (types only; B02's R-46 pruning untouched), Artifacts prefs, board viewport and Outline folds; a repair is mentioned once per store (Saved preferences) | `tests/browserResilience.test.ts` (five bad Viewed values, each store wrong top level and wrong field); jsdom before-proof on the pre-B03 modules |
| R-52 | **Fixed**: one `at` entry per lowered code unit, by code point; `normQuery` and `normText` lower per character; word-final sigma folds to sigma | find tests ("İ", Greek); the pre-B03 find threw |
| R-53 | **Fixed**: `shared/remove.ts` seeds the walk with the root; `deleteItemFile` tolerates an already-missing file (`rmSync force`) | planDelete tests; DELETE over a self-parent and a two-card cycle (files gone, layout cleaned, 200) |
| R-65 | **Fixed**: `listMd` skips names starting with `.` (so `takenIds` too) | `._EP-01.md` and `.#US-01.1.1.md`: no issue, no ID |
| R-66 | **Fixed** (B03-Q3: tolerate everywhere, keep the mark): `shared/bom.ts`; records, layout, config, recodes (and the config PUT, `statuses:recode`, VOICE.md) read past it; revisions taken without it; `writeAtomic` keeps a file's mark, never adds one | parse equality live and via `parseItem` (the Diff's path); JSON reads; mark kept on rewrite; API save then save again (no false 409) |
| R-121 | **Fixed**: `questionGroups` (configured, then unconfigured statuses as stored, always shown); walk and page use it | questionWalk test; e2e (listed, count 1, sheet opens, no "Nothing matches.") |
| R-122 | **Fixed**: Outline's last group "Not under an epic" (`unplacedRoots`: no parent, missing parent, then each cycle rooted at its lowest member), reasons shown, each card once, searchable, keyboard reachable | unplacedRoots tests (incl. a tail off a cycle); e2e |
| R-160 | **Fixed**: `server/pdfFactsStore.ts` (`.pdf-facts/`, `PDF_FACTS_DIR`); key SHA-256 of content plus extractor identity; atomic writes; shape-checked reads; facts kept only when the extractor's own read matches the key; passing failures never stored, retried after 60 s; misses read in one `pdfFacts.ts --batch` run, retried one by one if the run fails | `tests/pdfFactsStore.test.ts` (new process: 0 runs; one changed PDF: 1 run; damaged entry rebuilt; two processes at once; failed run not kept; mid-read change not kept); facts identical to the pre-B03 extractor for all 7 catalogue PDFs |

**Issue-surface contract (D-06 as built, for B06, B10, B11):** client-side problems go to
`src/clientProblems.ts` (`crashed`/`recovered`/`retry`, `pageError`, `repaired`), shown by the one
problem pill in groups Connection, Card moves, **This page**, **Saved preferences**, Checks; no other
masthead mark, toast or banner. Wrap a region in `RegionBoundary` (`region`, `label`, `frame`
page/sheet/docked, `closes`, `toBoard`, `resetKey`); it resets only when something changed since it
failed (Try again, the open card, the view, the catalogue), never loops, and clears its entry on
unmount. Mounts today: the routed view (keyed by path) and both modal sheets in `App.tsx`, the docked
sheet in `BoardView.tsx`. Page-wide capture: `watchPageErrors` in `main.tsx`; a crash a boundary
caught is matched by message within 2 s (React's development replay throws a fresh error object), and
connection failures and aborts are the Offline entry's. Tests drive a region's crash with
`window.__BOARD_CRASH_TEST__` (development only).

**What shipped:** new `shared/bom.ts`, `server/pdfFactsStore.ts`, `src/storage.ts`,
`src/clientProblems.ts`, `src/components/RegionBoundary.tsx`; changed `server/catalogueFs.ts`
(readRecord, listMd, readLayout, layoutDamageIssue, issuesFor backstop, writeAtomic, deleteItemFile,
withMeta), `server/artifactFiles.ts`, `server/pdfFacts.ts` (`--batch`, `sha`), `server/historyJournal.ts`,
`shared/artifacts.ts`, `shared/remove.ts`, `shared/check.ts` (cycles), `shared/files.ts`, `shared/move.ts`,
`shared/types.ts`, `src/store.ts`, `src/board/autoLayout.ts`, `src/artifacts/find.ts`,
`src/diff/viewedStore.ts`, `src/questionWalk.ts`, `src/views/QuestionsView.tsx`,
`src/views/OutlineView.tsx`, `src/components/ProblemPill.tsx`, `src/styles.css`, `.gitignore`
(`/.pdf-facts/`). Tests: `tests/loadResilience.test.ts`, `tests/loadResilienceApi.test.ts`,
`tests/pdfFactsStore.test.ts`, `tests/browserResilience.test.ts`, `e2e/bad-data.spec.ts`.

**Touch-rights edits (convention 11):** `src/App.tsx`, `src/main.tsx`, `src/views/BoardView.tsx`
(boundary mounts, storage reader, exported `readViewport`); `src/components/ItemModal.tsx`,
`CardNode.tsx`, `bits.tsx`, `BoardMinimap.tsx`, `src/itemSearch.ts`, `src/diff/DiffFields.tsx`,
`shared/csv.ts`, `scripts/link-index.ts` (type labels); `src/artifactIndex.ts` (storage reader);
`server/catalogueApi.ts` (layout PUT and delete tidy, config PUT and VOICE.md reads past a BOM;
B05's: `deleteItemFile` now tolerates a missing file); `shared/config.ts`, `shared/statuses.ts`,
`scripts/recode-statuses.ts` (BOM); `vite.config.ts`, `playwright.config.ts` (`PDF_FACTS_DIR`, the new
spec); `tsconfig.node.json` (`jsx` and `vite/client` types so tests import `.tsx`; commented);
`src/views/AboutView.tsx` (doc line); `docs/board-fixes/index.html` (B03 status).

**Deviations:** (1) The bad-data e2e reuses the 5182 fixture board (specs reset it themselves) rather
than a second server on 5183. (2) Matching a caught crash to page errors is by message within 2 s,
not by error object: React's development replay throws a fresh object (found by e2e). (3) Find also
folds word-final sigma (found by a test; same rule, one line). (4) The PDF extractor reports the hash
of what it read, and the store keeps facts only when it matches (review). (5) `requirements/SCHEMA.md`
is a catalogue doc; only its check-rules sentence changed, no requirement.

**Verification:** `npm run verify:board` green (702 tests, check OK). Earlier runs under a load
average of 30 to 43 timed out in the known git tests (Discovered), which pass alone. Fixture e2e on
5182: 107 passed (100 before plus 7). Before-proofs against `git archive 277e8381` in the scratchpad:
23 of 25 new node tests fail there (the 2 that pass are preservation checks), the browser and PDF
files fail on import (new modules) so their behaviour was shown failing with an existing-module
variant (3 of 3 fail, pass after), and all 7 e2e tests fail there. Real catalogue: `npm run check`
output byte-identical to the baseline, cold and warm; no file under `requirements/` changed but
SCHEMA.md. **Timings** (same load, back to back): pre-B03 2.3 s every run; now 1.5 s cold (one
extractor start), 0.55 s with facts kept. **Manual** on 5480 with a scratch copy of the real catalogue
plus a self-parented card and an unknown-type card: pre-B03 white screen on opening either; after,
board, reload, Outline and both sheets render with no recovery panel needed. **Migration:** none.

**Review outcomes (convention 15):** two Sonnet reviewers (diff about 2,300 added lines with tests).
Confirmed and fixed: a passing PDF failure was cached per file version; one bad PDF failed a whole
batch, and a lasting failure reran on every sync; facts could be stored under bytes the extractor did
not read; the Outline rooted a cycle at a tail card; `__proto__` layout key; unbounded message maps;
connection failures listed twice; duplicated `nodeBinary`; the check backstop had no test; VOICE.md
revision with a BOM; `link-index` type label; tsconfig comment; JSX indentation. Regression tests
added for each behaviour change, the PDF mismatch and backstop tests shown failing first. Not
reproducible: a repair notice raised during render warns (zustand's store sync handles it; the
notice is deferred anyway, and the test does not claim to prove it); a hidden parent's reason in the
Outline (`shownIndex` hides everything under a retired card). Not taken: one element for problem
rows (cosmetic), sweeping stale `.tmp` files (harmless, documented).

**Doc facts (convention 12):** `requirements-board/README.md` server map (`pdfFacts.ts`,
`pdfFactsStore.ts`), src map (`storage.ts`, `clientProblems.ts`, `ProblemPill`, `RegionBoundary`),
"How it works" (new bullets: one file never stops the load; a crash stays in its part of the page);
`DESIGN.md` masthead paragraph (This page, Saved preferences, recovery panel);
`requirements/SCHEMA.md` "Rules the tools enforce" (no parent cycle); About page "Outline and checks";
`CHANGELOG.md` 1.15.0; headers of the new modules. SKILL.md and ADOPTING lines checked: none
describes this behaviour.

**What later phases need:**
- **B04:** keep `decodeEntities`' range rule, `splitFrontmatter`'s BOM strip, `shared/remove.ts`'s seeded
  walk and the check's cycle block (`shared/check.ts`, after the duplicate-ID loop).
- **B05:** build on `readLayout`'s `{ layout, error?, damaged? }` and `layoutRewritten()` in the layout
  PUT; keep `writeAtomic`'s mark-keeping, `readRecord`'s BOM-free revisions and the tolerant
  `deleteItemFile`. `guard()` still runs the check unguarded on writes (Discovered).
- **B06, B10, B11:** the issue-surface contract above; put viewers and the canvas in a `RegionBoundary`
  or report through `clientProblems.ts`. B06: a crashed sheet's draft survives in
  `useEditableRecord`'s map and comes back when the sheet remounts.
- **B07:** keep the boundary mounts in `App.tsx` and `BoardView.tsx`; the problem pill's structure.
- **B08:** the screenshot scan's per-entry `quietly` and `readShots`.
- **B09:** the Viewed store reads through `readJson`.
- **B10:** read the filter preferences through `fields`/`readJson`; `find.ts` is correct for long lower cases.
- **B11:** `canParent` never throws; `unplacedRoots` and the Outline's last group.
- **B14:** `/.pdf-facts/` in the board's `.gitignore` (kit export must not ship the folder);
  `PDF_FACTS_DIR` with the other env paths. Also the B01-found escaping base folder (Discovered), moved here from B03.
- **B15:** rerun the four new test files and `e2e/bad-data.spec.ts`.

### B02 · Status identity · COMPLETE · 2026-11-19

Board 1.13.0 to **1.14.0**. Plan and evidence: `phases/B02-status-identity/IMPLEMENTATION.md`.
Decisions: accepted decision 16 (D-02, B02-Q3 to Q6, A-2's fix, the R-07 rule for B12), asked in this
session. Master merged first (`60bd04c6`, master's pointer-page commit; on `index.html` this branch's
version kept, convention 16).

**Dispositions**

| Finding | Disposition | Proof (each failed on the pre-B02 code, passes after) |
|---|---|---|
| R-01 (board and server half) | **Delivered; B06 closes** (lock-out UI). Lists never swapped for the defaults: degraded (bad tone, non-text field) keeps every code, label and role; damaged reads the readable part; the check reports the list once; the server refuses status saves on a damaged on-disk list (file byte-identical) and judges in-use against the disk; `config.statusState` in snapshot and event | `tests/config.test.ts` "status identity (R-01)"; `tests/api.test.ts` "status identity on the server" (FINDINGS scenario; damaged saves incl. unparseable, `null` and `[]` files; disk in-use guard; state in snapshot and event); `tests/catalogue.test.ts` check once, no flood |
| R-06 | **Fixed.** An unmapped live code is refused while the map renumbers live codes; explicit merges (`3=4,4=4`) accepted and listed as merges; a status holding a role is never merged away | `tests/recodeStatuses.test.ts` (FINDINGS map refused naming 4 and its file; merge; role merge refused; names-to-codes rerun still succeeds) |
| R-07 (board half) | **Delivered; B12 closes** (plan tools). No-overlap rule in `recodeProblems`; chain-following unchanged and correct for every version; `catalogueDiff.ts` untouched | script refuses `4=5,5=6` and a target an earlier recode moved away; after `5=7,6=8` every post-recode code reads as stored; `catalogueDiff.test.ts` later real move reported (a guard, passes before too); the 2026-10-20 entry reads as today |
| R-30 | **Fixed.** Both CSVs show `statusLabel` from the project's list; unknown as stored; columns unchanged; no code column (B02-Q6) | `tests/catalogue.test.ts` "the CSV export (R-30)" |
| R-44 | **Fixed.** Recode recorded first; files, journal and config written whole (temp then rename); unreadable journal lines kept byte for byte and counted; failures name file and step and exit 1; the same command resumes once; an unreadable `status-recodes.json` refuses the run | script tests: truncated line; read-only folder then rerun (one entry, finished); truncated recodes file refused byte-identical, earlier entries kept as written |
| R-46 | **Fixed.** Saved filter not pruned or rewritten while either list is damaged or the file is unreadable; pruned on a real removal | `tests/store.test.ts` "the saved status filter (R-46)" |
| R-68 | **Fixed.** `nextStatusCode(...groups)` past live, removed, recoded and record codes; server refuses reuse; removal recorded in `removedStatuses` with last label; a removed code reads "label (removed)"; the check reports a removed or recoded-away code in use; an old name never maps to a spent code | config registry tests; api "records a removed status", "skips codes used only in a recode or only in a record"; check removed-status test; script "never maps an old name to a spent code" |
| A-2 | **Confirmed and Fixed.** Reproduced on the pre-B02 code (scratch catalogue, a watching catalogue API with a scratch journal, the old file step then its journal rewrite): map `3=7` left a `status 7 to 7` entry; overlapping `3=4,4=5` left `4 to 5`, a move that never happened. Fix: the board holds `board-<pid>.lock` in its journal folder; the recode refuses beside a live one (a stale one ignored) | script test (refused, nothing written; dry run allowed; stale lock ignored); `tests/originLive.test.ts` (the real Vite board holds the lock in the folder the script checks, and drops it on exit); manual on 5480 |

**Registry format (for B06, B12, B14):** `board.config.json` may hold
`"removedStatuses": { "statuses": [{ "code": 7, "label": "On hold" }], "questionStatuses": [] }`,
written by the server when Settings drops a status (entries already there kept as written).
`status-recodes.json` unchanged: an array of `{ date, note?, items, questions }`. Derived, never
written: `config.statusState[field] = { state: 'healthy' | 'degraded' | 'damaged', problems, highWater }`.

**Damage-state contract for B06:** render the lock-out from `config.statusState[field]` (its problems
name the file, field and entry); the server already refuses damaged-list saves (422) and accepts
degraded ones (the repair). Settings allocation: `nextStatusCode(list codes, [String(highWater)],
record codes)` (done at `SettingsView.tsx` `add`).

**R-07 rule for B12:** as decision 16: keep `scope.mjs` `normaliseStatus` (follow every recode in
order); prove an overlapping recode is refused by `statuses:recode` and the 2026-10-20 entry reads as
today. Checked here: `config.mjs` `statusListsOf` ignores `removedStatuses`; `scope.mjs`
`loadRecodes` reads the file; the plan tools' `node --test` suites pass (27).

**What shipped:** `shared/statuses.ts` (health classes, `readablePart`, `parseRemoved`,
`highestCode`, `nextStatusCode(...groups)`, `recodedCodes`, `recodeProblems`,
`recodeHistoryProblems`, removed labels, safe `defaultStatus`); `shared/config.ts`
(`removedStatuses`, `statusState`, `parseConfig(text, recodes)`, an unreadable file as damaged lists);
`shared/check.ts`; `shared/csv.ts`; `server/catalogueApi.ts` (config PUT, `guardStatus` on create,
PUT and batch, non-object config 422); `server/catalogueFs.ts` (`readConfig` passes the recodes);
`server/historyDir.ts` (new: `historyDirFor` moved here, `holdBoardLock`, `boardsRunning`);
`scripts/recode-statuses.ts` (rewritten main: strict recodes read, validation, lock, order, resume,
journal and config passes); `scripts/export-csv.ts`; `src/store.ts`.

**Touch-rights edits (convention 11):** `shared/check.ts` (status judged against the project's list;
removed-status message); `src/views/SettingsView.tsx` (`add` only); `server/cataloguePlugin.ts`
(B07's: `historyDirFor` moved out, lock held and released); `tests/originLive.test.ts` (B01's: lock
assertions); `docs/board-fixes/index.html` (B02 status).

**Deviations:** (1) The lock is `board-<pid>.lock` (not `board.lock`), so two boards on one journal
never drop each other's; decision 16's wording corrected. (2) The recode's journal pass now uses the
board's own journal-folder rule (`historyDirFor`), so it also rewrites a fixture board's temp journal;
before, it skipped the journal whenever `REQUIREMENTS_DIR` was set. (3) Old names (from before
statuses were codes) may still merge into one live code (`Proposed=1,Future=1`, as the 2026-10-20
recode did) but never target a spent code. (4) A reused removed code, or a live code a recode moved
away, makes the list degraded (reported, Settings can still save), not damaged. (5)
`requirements/SCHEMA.md` is a catalogue doc; only its statuses paragraph changed, no requirement.

**Verification:** `npm run verify:board` green (652 tests; check OK). Earlier runs under a load average
of 20 to 26 (antivirus scanning) timed out in unrelated git tests that pass alone (Discovered). Fixture
e2e on 5182: full suite 100 passed; Settings, status picker and question answer 13 passed after the
review fixes. Before-proofs: the new tests were run against `git archive 60bd04c6` of the board in the
scratchpad: 26 of the first set and all 6 review regression tests fail there (the 8 that pass are
preservation checks); `server/historyDir.ts` was copied in only because a test writes a lock with it.
Real catalogue: `npm run check` output byte-identical before and after; derived registry healthy,
high-water items 6 and questions 4, nothing removed; no file under `requirements/` changed but
SCHEMA.md. **Migration:** none. The derivation report was the dry run; nothing was written to
`board.config.json`, `status-recodes.json` or `.history/`. Manual on 5480 (a scratch copy of the real
catalogue): status 4's tone set to `teal` by hand: the board reports the tone problem and keeps 5
Confirmed and 6 Retired (52 retired cards, no card errors), and a reworded save writes codes 1 to 6
unchanged (repairing the tone). A doubled code 5: state damaged, save refused 422 naming the cause,
file unchanged by checksum, retired role still on 6. A recode with that board running: refused,
nothing written.

**Review outcomes (convention 15):** two Sonnet reviewers (diff about 720 lines outside tests).
Confirmed and fixed: a recode replaced an unreadable `status-recodes.json`, losing its history
(reproduced; now refused, entries appended as written); an old name could target a spent code; a
`null` config gave 500 on save; non-text label, help or heading went unreported; a live code a recode
moved away went unreported; the plugin's lock wiring was untested; the exit hook piled up across
restarts; the refusal line misled for non-mapping refusals; the lock message did not name the file;
hand-written removed entries were rewritten; a recode into a config without a list said nothing.
Regression tests added for each behaviour change. Not taken: optional chaining on `statusState`
(kept as a defensive read); `formatJson` reflow (house layout); unreadable `removedStatuses` not
locking the list (by design: a removal is refused while it is unreadable).

**Doc facts (convention 12):** `requirements-board/README.md` config section (`removedStatuses` line;
the paragraph after the list: status lists never swapped, degraded and damaged, `statusState`);
`requirements-board/requirements/SCHEMA.md` statuses paragraph (removed statuses, never reissued,
damaged lists, recode rules, stop the board); `requirements-board/ADOPTING.md` statuses bullet (recode
guidance); headers of `shared/statuses.ts`, `shared/config.ts` (`parseConfig`), `shared/csv.ts`,
`scripts/recode-statuses.ts`, `server/historyDir.ts`; `CHANGELOG.md` 1.14.0. About and SKILL.md lines
checked: nothing they say changed. The starter config needs no change.

**What later phases need:**
- **B03:** while a list is damaged, cards can hold codes the readable list lacks; R-121's listing
  covers them. `defaultStatus` may now return `''`.
- **B05:** keep in the config write route the damaged-list refusal, the on-disk in-use guard, the
  reuse refusal, the `removedStatuses` append and the non-object 422, and `guardStatus` on item and
  question writes; keep `api.test.ts` "status identity on the server" green.
- **B06:** the contract above; closes R-01 with the lock-out rendering.
- **B12:** the R-07 rule above; closes R-07. Lane worktrees need no migration.
- **B14:** registry format and doc facts above; R-149's pins untouched.
- **B15:** confirm A-2 with `tests/recodeStatuses.test.ts` and `tests/originLive.test.ts`.

### B01 · Origin security · COMPLETE · 2026-11-19

Board 1.12.3 to **1.13.0**. Plan and evidence: `phases/B01-origin-security/IMPLEMENTATION.md`.
Decisions applied as accepted (decision 13); nothing new asked.

**Dispositions**

| Finding | Disposition | Proof (each failed at HEAD, passes after) |
|---|---|---|
| R-03 | **Fixed.** Sanitiser judges attributes by local name in any namespace; URL attributes keep only `#id` (not `#/`) or a raster data URL; CSS read as a browser reads it; non-SVG elements dropped. Its "also" (network reach) fixed too | `tests/sanitise.test.ts` (61); `e2e/origin.spec.ts` script link |
| R-04 | **Fixed.** Plugin adds `server.fs.deny` globs (served folder and in-tree folder, written and real, glob characters escaped, Vite defaults kept) and answers 404 for any path into a catalogue folder by folder identity; its own `/requirements/` route reads every spelling; every SVG carries the CSP and every file `nosniff` | `tests/originLive.test.ts` (live Vite on a free port, 50); deny rule via `resolveConfig` in `tests/originRules.test.ts` |
| R-22 | **Fixed.** `/artifact-file/` and `/history-blob/` answer 404 (GET and HEAD) on every miss; the history promise has a `.catch`. At HEAD a failing lookup's unhandled rejection **stopped the dev server** (worse than the finding said) | live probe misses; e2e "the file is missing" |
| R-35 | **Won't fix (warned instead), user's choice** (decision 13, B01-Q1). Escaping links are served; the server log warns once per message and the check warns for an item image and an artifact file | rules tests: served with type and `nosniff`, warning names the target; check warnings; no warning for links inside, plain files, or `assets/../` spellings |
| R-36 | **Fixed.** `server.cors: false`; fetch-metadata refusal (GET/HEAD, `cross-site` or `same-site`, except a top-level visit) on every route; CORP `same-origin` on board routes; writes keep 415/403 | live probe headers; e2e from the other loopback name: fetch and `<img>` refused |
| R-63 | **Fixed.** `idFromPath` (`server/catalogueApi.ts`) on all seven ID routes and `/artifact-file/`: bad escape 400 with JSON; `/`, `\`, `.`, `..`, control characters 400 before any read; any other path with a bad escape 400 | rules tests (7 routes, unsafe IDs, every catalogue ID routes); live probe |
| R-102 | **Fixed.** Every drawing link is prevented unless it is a record link opened with Cmd, Ctrl, Shift or a non-primary button; a `#id` link brings its spot into view (B01-Q2); `auxclick` and clicks through `<use>` copies prevented | `e2e/origin.spec.ts` (plain, modified, Alt, middle, Enter; reveal; record link new tab, Enter, artifact link) |
| R-47 REPO_ROOT "also" (decision 11) | **Fixed.** `meta.path` from real repository root to the real folder of the file (`repoRelative`); watcher inside/outside by `inside()` | rules tests both ways on `/var` temp folders: resolves, served, right `meta.path`, outside file classified outside |

**What shipped:** `server/realPaths.ts` (new: `realPath`, `realEntry`, `under`, `inside`, `linkOut`);
`server/cataloguePlugin.ts` (deny hook, `routeTarget`, `crossSiteRead`, `namesFolder`, `denyGlobs`,
404s, `sendFile`, warnings); `server/artifactFiles.ts` (`artifactBase`, `repoRelative`,
`facts.linkOut`); `server/catalogueApi.ts` (`idFromPath`, `hasOwn` on history routes);
`src/artifacts/sanitise.ts` (rewritten rules); `src/artifacts/CanvasViewer.tsx` (click interception,
`spotOf`); `vite.config.ts` (`cors: false`). Tests: `tests/sanitise.test.ts`,
`tests/originRules.test.ts`, `tests/originLive.test.ts`, `e2e/origin.spec.ts`.

**Touch-rights edits (convention 11):** `shared/check.ts` (`linkOut` input and two warnings,
`ArtifactFacts.linkOut`); `server/catalogueFs.ts` (one `linkOut` line in `issuesFor`);
`src/artifacts/svgLinks.ts` (`anchorFromEvent`, `isRecordLink`, `fromUseCopy`; `linkFromEvent` now
needs `data-record`); the watcher's two inside/outside comparisons in `cataloguePlugin.ts` (B07's
territory) now use `inside()`; `playwright.config.ts` (the new spec in the fixture project);
`.gitignore` (`/.origin-fixture/`); `docs/board-fixes/index.html` (B01 status).

**Deviations:** (1) A second layer beyond the deny rule: the live probe showed the deny rule alone
leaves Vite's page fallback (200 `index.html`, never the file) for a catalogue inside Vite's root and
for `/@id/`, and the security review found `requirementſ` passing both string guards; the plugin's
identity-based 404 closes both. Within D-01a ("both"). (2) The refusal applies to every route, not
only the board's, to stop another site triggering `/__open-in-editor`. (3) `.` refused as an ID with
`..` (both dot segments; within B01-Q3's intent). (4) `#/...` hrefs dropped by the sanitiser: they
are routes, never spots. (5) `serveAsset` serves image types only (an `.html` or `.md` under
`assets/` is a 404). (6) Review ran four reviewers (the kick-off prompt) before convention 15 was
recorded. (7) IMPLEMENTATION.md was saved after the first build rather than before; the plan
followed the accepted decisions directly.

**Verification:** `npm run verify:board` green (617 tests; one earlier run of four hit 5 s timeouts
in `gitHistory.test.ts` under load, see Discovered). Full fixture e2e on 5182: 100 passed.
`npm run check`: byte-identical to HEAD (P-08). Real catalogue on scratch port 5393: all 15 SVG
artifacts and three region or step views rendered, PNGs byte-identical before and after
(gradients, markers, highlights intact), repeated after the review fixes. Before-runs stashed the
sources and set `realPaths.ts` aside; `originRules.test.ts` fails on import at HEAD and its
behaviour was shown failing with a self-contained copy (IMPLEMENTATION.md).

**Review outcomes:** four reviewers (quality, completeness, correctness, security). Confirmed and
fixed: `ſ` and NFD spellings past both guards; three CSS-reading gaps that let seven payloads fetch
in Chromium; a quadratic `<style>` cleaner (120 KB font, 19 s) and CSS it corrupted; text attributes
read as CSS; Alt+click on record links; link walk past the shadow root; `<use>` copies; Vite routes
open cross-site; `__proto__` 500s; `.` IDs; `assets/../` called a link; XHTML root; Windows `/@fs/`;
live-test robustness and missing proofs. Not taken (reasons in IMPLEMENTATION.md): `IN_TREE`
duplication, moving `spotOf`, decoded-path handler signatures. Five items recorded under
Discovered for later. During review the security reviewer's probe requested
`/__open-in-editor?file=requirements/README.md` on its scratch server, which may have opened that
file in the user's editor; nothing was changed.

**Doc facts (convention 12):** `requirements-board/README.md` serving paragraph (about lines 194
to 207: routes, image-only assets, CSP and `nosniff`, 404s and 400s, deny rule and identity 404,
CORS off and the cross-site refusal, symbolic-link warnings, sanitiser and link behaviour) and the
`server/` map (`cataloguePlugin.ts` line, new `realPaths.ts` line); `CHANGELOG.md` 1.13.0. No About,
SCHEMA, ADOPTING or SKILL.md line describes this behaviour.

**What later phases need:**
- **B10:** no page CSP (D-01c). A non-record link in a drawing never navigates; a `#id` link calls
  the viewer's existing reveal (`revealRef`) on its target; a missing target does nothing (B01-Q2).
  `CanvasViewer.tsx` click handling is in the layout effect (`onClick`, `onAux`, `spotOf`); the
  sanitiser strips `data-record`, so `isRecordLink` can trust it. Keep `fromUseCopy`.
- **B02, B05:** every ID taken from a URL goes through `idFromPath` (`server/catalogueApi.ts`); use
  `Object.hasOwn` on state lookups by ID.
- **B03:** reuse `server/realPaths.ts` (`under`, `inside`, `linkOut`, `realEntry`) and
  `artifactBase`/`repoRelative` in `artifactFiles.ts`; `artifactPath` stays lexical (a `..` is
  refused, a link followed and named in `facts.linkOut`).
- **B07:** middleware order is: cross-site refusal, malformed-escape 400, route by normalised
  lower-cased prefix (`/api/` by the raw URL), else the identity 404 then `next()`; every file route
  ends in a 4xx. The watcher's inside/outside test is `inside()`. Asset URLs keep their query string,
  so D-10's token passes (`?v=` proved).
- **B08:** `/history-blob/` ends 404 on every miss and failure; disk reads go through `isFile` and
  warn on escaping links. See Discovered for the `?src=` blob gate.
- **B15:** rerun `tests/originLive.test.ts`, `tests/originRules.test.ts`, `tests/sanitise.test.ts`
  and `e2e/origin.spec.ts`; the live test boots Vite on a free port with a fixture in
  `requirements-board/.origin-fixture/`.
