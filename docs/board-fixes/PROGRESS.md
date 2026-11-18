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
    - **B12 and B13** each work in their own worktree on a branch made from `board-fixes`
      (`board-fixes-b12`, `board-fixes-b13`; ports 5573/5574/5580 and 5673/5674/5680 in their own
      `.lane.env`), and merge back into `board-fixes`, from the programme worktree, when no serial
      phase has uncommitted work there. In convention 14 and PLAN.md, "master's version" means
      `board-fixes`' version.
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
| B04 | One rule, one helper | PLANNED | after B03; D-03 before build | D-03 also settled before B12 builds if B12 needs it |
| B08 | Git history reader | PLANNED | after B03; D-07 before build; D-05 with B05-Q2/Q3 recorded (planning-only gate) | |
| B05 | Server write model | PLANNED | after B02, B03, B04, B08; D-04 and D-05 before build | D-05 is the user's call |
| B07 | Store sync and layout | PLANNED | after B05 (D-04 recorded); D-10 before build | |
| B06 | Edit sheets and Settings | PLANNED | after B05, B07, B02, B03 | |
| B09 | Diff and history UI | PLANNED | after B08, B07 (D-10) | |
| B10 | Artifact viewers | PLANNED | after B01, B03, B04, B07; D-01c, B01-Q2 and D-10 recorded | |
| B11 | Board canvas and views | PLANNED | after B03, B05, B07; D-06 recorded | |
| B12 | Build-plan tools | PLANNED | after B02; D-08 before build; D-03 if needed; live-plan compatibility | parallel worktree |
| B13 | Consistency and linking tools | PLANNED | REQ-07b after B04 (D-03) | parallel worktree |
| B14 | Scripts, kit and docs | PLANNED | after B02, B05, B11, B12, B13; D-09 before build | |
| B15 | Closing audit | PLANNED | after all | |

All phases are ready for implementation planning. None is ready to build until its gate's
decisions are recorded under "Accepted decisions".

## Deferred decisions

Programme-level decisions. Each SPEC's own questions (`Bnn-Qn`) are listed in its "Deferred
decisions" section and resolved in that phase's planning.

| ID | Question / source gap | Owner phase | Depends on this | Resolve before | Boundary / acceptance impact | Status / answer |
|---|---|---|---|---|---|---|
| D-01 | Origin security model (fs.deny vs normalisation, CORS, SVG CSP, write token) | B01 | B10 | B01 build | B10's link handling; whether B01-REQ-10 applies | **Accepted 2026-11-19** (accepted decision 13): deny rule and normalisation; CORS off plus cross-site refusal; no page CSP; no write token |
| D-02 | Status registry format, recode versioning, migration; plan-tool readability | B02 | B06, B12, B14 | B02 build | Settings UI, plan-tool status rule, SCHEMA and starter docs; whether B02 touches `catalogueDiff.ts` | **Accepted 2026-11-19** (accepted decision 16): no-overlap recodes; removed statuses under `removedStatuses` in `board.config.json`; no migration; `catalogueDiff.ts` untouched |
| D-03 | How agent `.mjs` tools share `shared/*.ts` rules, including the note-cite resolution rule | B04 | B12, B13 | B04 build (and before B12 builds if needed) | B13-REQ-07b (R-141) shape; parity tests | Open |
| D-04 | Write protocol (patch + base rev vs three-way merge; conflict reply; in-place YAML scope; config writes) | B05 | B06, B07 | B05 build | All client save flows; one-line-diff convention if items are edited in place | Open |
| D-05 | ID reuse rule: SCHEMA "never reused" vs deliberate documented reuse (A-1, R-54); with B05-Q2/Q3 | B05 (user) | B08, B14 | B08 build (planning-only gate in a B05 planning conversation) | SCHEMA text; journal and history handling; possible deleted-ID list (data migration) | Open |
| D-06 | Bad-data issue surface and error-boundary recovery | B03 | B06, B10, B11 | B03 build | How later phases report bad data | **Accepted 2026-11-19** (accepted decision 17): panel in place and a "This page" group in the pill; auto-retry on catalogue change; copyable details; page-wide error capture; repaired storage mentioned |
| D-07 | Git reader contract (cache key/bounds, SHA-256, unstaged moves, deletion and rename bounds) | B08 | B05, B09 | B08 build | Timeline and diff inputs; R-54 history cut | Open |
| D-08 | Lane-aware plan state on master | B12 | catch-up lanes | B12 build | update-build-plan behaviour while lanes run | Open |
| D-09 | Kit export source and target refusal rules | B14 | none | B14 build | Export behaviour and docs | Open |
| D-10 | Asset version and change signal (event and URL token) | B07 | B09, B10 | B07 build | R-96 and R-104 consumers | Open |

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
| `git status` may take the index lock in lane worktrees and break an agent's commit | B08 author (B08-Q6) | B08 | unverified; investigate in planning |
| HistoryView's screenshot `Shot` labels every load failure "never committed" (same flaw as R-103) | B09 author | B10 | taken into B10 scope |
| Two layout saves that both succeed can land out of order; StrictMode double start-up load | B07 author | B07 | taken into scope |
| `artifact:new` uses `git mv`, which stages mid-phase | B05 author (B05-Q6) | B05, then B14 | conflicts with convention 9 |
| Fixture e2e port 5182 is fixed, so two lanes collide | B14 author (B14-Q3) | B14 | |
| `/history-blob/<sha>?src=assets/x.png` serves any blob in the repository by full sha, typed by `src`'s extension (same-origin only; needs the hash) | B01 security review | B08 | gate the `src` case with `blobWasAt` as the `file` case is |
| `catalogueDiff.ts:135` compares git's real top with `REPO_ROOT` as given (the E7a mixed-path defect) | B01 completeness review | B09 | use `realPaths.ts` (`realPath` both sides) |
| A base folder that is itself an escaping link (`assets/` linked out of the requirements folder) is not warned: `linkOut` compares against the base's real path | B01 completeness review | B14 (moved by B03) | not built in B03 (outside its 14 findings; R-47's isolation does not depend on it); a check warning would suffice |
| A top-level visit from another site can still open Vite's `/__open-in-editor` (navigations are allowed so links to the board work); Vite still serves the board's own source, `node_modules` and any `.html` outside the catalogue as same-origin pages (SPEC residual) | B01 | B15 | Vite's dev model; consider refusing cross-site navigations to `/__open-in-editor` |
| A screenshot whose file name holds a backslash cannot be served (`\` is read as `/`, as the file system on Windows would) | B01 correctness review | B14 (docs) | rare; document, or keep `%5C` apart |
| `verify:board` saw 5 s Vitest timeouts in `gitHistory.test.ts` under full parallel load (once in four runs; passes alone) | B01 | B12 or B14 | the live origin test adds a Vite boot to the load; consider raising git-test timeouts |
| The 5 s timeouts recurred in B02 across `gitHistory`, `catalogueDiff`, `api` and `catalogue` tests while the machine's load average was 20 to 26 (antivirus scanning); all pass alone, and the suite passed once the load fell | B02 | B12 or B14 | same item as above; B02's script tests that spawn node carry a 60 s timeout |
| The Settings Add row's use of the high-water mark has no browser test (the helper and the server refusal are unit-tested) | B02 review | B06 | B06 owns the Settings UI and can prove it with the lock-out |
| A lock left by a crashed board whose process ID is later reused makes `statuses:recode` refuse until the file is deleted (the message names the file) | B02 review | B14 (docs) | rare; a start-time marker would settle it |
| `statuses:recode` writes `board.config.json` through `formatJson`, so a hand layout it would lay out differently is reflowed (data unchanged; Settings does the same) | B02 review | none | accepted: `formatJson` is the file's house layout |
| The write routes' `guard()` runs `checkCatalogue` unguarded, so a check that throws on unexpected data turns a save into a 500 (the load is backstopped, writes are not) | B03 | B05 | backstop it as `issuesFor` does |
| `scripts/resolve-source.ts` runs `pdfFacts.ts` with no timeout and no try; `scripts/new-artifact.ts` derives SVG and Markdown facts unguarded | B03 | B14 | the board's load is safe; the scripts are not |
| `.pdf-facts/` is never pruned (an old version's entry stays) and a killed write leaves a `.tmp` | B03 review | none | documented in README; delete the folder any time |
| `tsconfig.node.json` now carries `jsx` and `vite/client` types so tests can import `.tsx`; a tests-only tsconfig would keep them out of server code | B03 review | B14 | |

## Phase entries

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
