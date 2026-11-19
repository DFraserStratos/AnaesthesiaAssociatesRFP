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
| B04 | One rule, one helper | COMPLETE | D-03 and B04-Q1 to Q3 recorded (accepted decision 18) | 2026-11-19, board 1.16.0; all 18 findings fixed; D-03 contract for B13 in the entry |
| B08 | Git history reader | COMPLETE | D-07, D-05 with B05-Q2/Q3, B08-Q1 to Q3, Q5, Q6 recorded (accepted decision 19) | 2026-11-19, board 1.17.0; all 10 findings fixed; deletion bound and contracts for B05 and B09 in the entry |
| B05 | Server write model | PLANNED | after B02, B03, B04, B08; D-04 before build (D-05 recorded, decision 19) | D-05, B05-Q2, B05-Q3 answered in the B08 session |
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
| D-03 | How agent `.mjs` tools share `shared/*.ts` rules, including the note-cite resolution rule | B04 | B12, B13 | B04 build (and before B12 builds if needed) | B13-REQ-07b (R-141) shape; parity tests | **Accepted 2026-11-19** (accepted decision 18): direct import of `shared/*.ts` from the catalogue path; not in the workflow runtime or generated pages |
| D-04 | Write protocol (patch + base rev vs three-way merge; conflict reply; in-place YAML scope; config writes) | B05 | B06, B07 | B05 build | All client save flows; one-line-diff convention if items are edited in place | Open |
| D-05 | ID reuse rule: SCHEMA "never reused" vs deliberate documented reuse (A-1, R-54); with B05-Q2/Q3 | B05 (user) | B08, B14 | B08 build (planning-only gate in a B05 planning conversation) | SCHEMA text; journal and history handling; possible deleted-ID list (data migration) | **Accepted 2026-11-19** (accepted decision 19): reuse stays; a restore continues its history; journal cut only at a committed deletion |
| D-06 | Bad-data issue surface and error-boundary recovery | B03 | B06, B10, B11 | B03 build | How later phases report bad data | **Accepted 2026-11-19** (accepted decision 17): panel in place and a "This page" group in the pill; auto-retry on catalogue change; copyable details; page-wide error capture; repaired storage mentioned |
| D-07 | Git reader contract (cache key/bounds, SHA-256, unstaged moves, deletion and rename bounds) | B08 | B05, B09 | B08 build | Timeline and diff inputs; R-54 history cut | **Accepted 2026-11-19** (accepted decision 19): HEAD + index identity keys, bounded LRUs, hybrid clean-form names, unchanged unstaged moves followed, full lists with `deleted` markers |
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
| `artifact:new` uses `git mv`, which stages mid-phase | B05 author (B05-Q6) | B05, then B14 | conflicts with convention 9 |
| Fixture e2e port 5182 is fixed, so two lanes collide | B14 author (B14-Q3) | B14 | |
| `/history-blob/<sha>?src=assets/x.png` serves any blob in the repository by full sha, typed by `src`'s extension (same-origin only; needs the hash) | B01 security review | B08 | **Done in B08**: the `src` case is gated by `blobWasAt` |
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
| `shared/proseDiff.ts` keeps its own fence and backtick heuristics (`FENCE`, `closed`) for the Diff review's block splitting | B04 | B09 | not a "what is code for links" rule; could adopt `markdownCode.ts` |
| `scripts/linkProposals.ts` has its own code-masking copy | B04 review | B13 | B13 adopts B04's helpers there |
| `decodeEntities` knows six named entities, so `# &copy; 2026` reads "&copy; 2026" where the page shows "©" (slug differs); a footnote `[^1]` in a heading reads "^1" | B04 review | none | no catalogue heading uses either |
| `lintFrontmatter` keeps a `#` warning quiet when any other frontmatter string holds the same text after the `#` | B04 review | none | contrived false negative |
| A mermaid edge label written without spaces (`A--text-->B`) is read as a node `text`; unverified whether mermaid accepts that form | B04 review | none | |
| A retired artifact's `page_offset` is applied to its replacement's pages (from before B04) | B04 review | B14 (docs) | replacement with a different offset cites the wrong page |
| The 5 s Vitest timeouts in git and live-server tests recurred in B04 (load 20 to 34); the same files time out on the pre-B04 board too | B04 | B12 or B14 | same item as B01's and B02's |
| git's own rename detection (`-M`) can pair a deleted card with a similar new card added in the same commit, so the new card inherits the old one's history with no deletion bound | B08 review | B05 | the same case as REQ-11.4 (reuse with no committed deletion); B05-REQ-20's own cut covers it |
| An LFS version is served as its pointer (`GIT_LFS_SKIP_SMUDGE`, so a request never fetches); viewers show the pointer text | B08 review | B10 | a viewer could say "stored in LFS" instead |
| The history readers' per-read costs: one `ls-files --deleted` per read, the whole-history rename log re-run per HEAD (as before B08), negative history-blob checks not cached | B08 review | none | measured acceptable here (card history 2.6 s cold, was 5.5 s); revisit on a much larger repository |
| The B08-territory git test files now set a 60 s test timeout (the readers run one more git process per read); other live-server and Diff tests keep 5 s | B08 | B12 or B14 | same item as the 5 s timeout rows above |

## Phase entries

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
