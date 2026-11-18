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

## Phase ownership and sequencing gates

See [PLAN.md](PLAN.md) for territories, the shared-files order and the build order.

Serial (app): B01, B02, B03, B04, B08, B05, B07, B06, B09, B10, B11, B14, B15.
Agent tools in parallel: B12 (after B02), B13 (REQ-07b after B04); both before B14.

## Phase status

| Phase | Outcome | Status | Planning/build gate | Notes |
|---|---|---|---|---|
| B01 | Origin security | PLANNED | D-01 and B01-Q1 to Q3 recorded (accepted decision 13) | first; ready to plan and build |
| B02 | Status identity | PLANNED | after B01; D-02 before build; migration shown to user | can plan now |
| B03 | Load resilience | PLANNED | after B01; D-06 before build | |
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
| D-02 | Status registry format, recode versioning, migration; plan-tool readability | B02 | B06, B12, B14 | B02 build | Settings UI, plan-tool status rule, SCHEMA and starter docs; whether B02 touches `catalogueDiff.ts` | Open |
| D-03 | How agent `.mjs` tools share `shared/*.ts` rules, including the note-cite resolution rule | B04 | B12, B13 | B04 build (and before B12 builds if needed) | B13-REQ-07b (R-141) shape; parity tests | Open |
| D-04 | Write protocol (patch + base rev vs three-way merge; conflict reply; in-place YAML scope; config writes) | B05 | B06, B07 | B05 build | All client save flows; one-line-diff convention if items are edited in place | Open |
| D-05 | ID reuse rule: SCHEMA "never reused" vs deliberate documented reuse (A-1, R-54); with B05-Q2/Q3 | B05 (user) | B08, B14 | B08 build (planning-only gate in a B05 planning conversation) | SCHEMA text; journal and history handling; possible deleted-ID list (data migration) | Open |
| D-06 | Bad-data issue surface and error-boundary recovery | B03 | B06, B10, B11 | B03 build | How later phases report bad data | Open |
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

## Phase entries

None yet.
