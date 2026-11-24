# Board fixes: closing review (B15)

2026-11-20. Programme branch `board-fixes`, worktree `AnaesthesiaAssociatesRFP-board`.

- **Audit commit:** `d5499c70` (B14 complete, board 1.26.0). Programme range `d4341735..d5499c70`.
- **Final commit:** the `B15 complete` commit on top of `f1f83eff` (B15 checkpoint, board **1.26.1**); the kit was
  exported from `f1f83eff`, which holds every code and doc change B15 made (the complete commit adds only
  ledger files: this report, PROGRESS.md, PLAN.md, index.html).
- **Closing status: COMPLETE** (accepted decision 30, B15-Q5: complete with the owed list below).

## 1. Coverage (B15-REQ-02 to 09)

Mechanical cross-check of the 164 headed findings in FINDINGS.md against every disposition row in PROGRESS.md
and the owners in PLAN.md's phase table (script `coverage.mjs`, kept in the B15 session scratchpad; rerunnable
from the method in IMPLEMENTATION.md).

| Disposition | Count |
|---|---|
| Fixed | 163 |
| Not reproducible at HEAD | 0 |
| Won't fix (user accepted) | 1: R-35, warned instead (accepted decision 13, 2026-11-19, the user's choice) |
| Moved | 0 |
| Missing, duplicated or conflicting | 0 |

| Phase | Final dispositions | | Phase | Final dispositions |
|---|---|---|---|---|
| B01 | 7 (6 Fixed, R-35 Won't fix) | | B09 | 13 |
| B02 | 5 (+ halves of R-01, R-07) | | B10 | 10 (+ the timeline label) |
| B03 | 14 (R-47 with B01's REPO_ROOT case, decision 11) | | B11 | 13 |
| B04 | 18 | | B12 | 15 (closes R-07) |
| B08 | 10 (+ R-54's deletion bound) | | B13 | 14 |
| B05 | 7 (+ server halves of R-45, R-111) | | B14 | 16 |
| B07 | 6 | | **Total** | **164** |
| B06 | 16 (closes R-01, R-45, R-111) | | | |

**Split deliveries:** R-01 (B02 board and server half, B06 lock-out UI; B06 closes), R-07 (B02, B12; B12 closes),
R-45 and R-111 (B05 server halves, B06 closes), R-54 (B08 deletion bound, B05 closes), R-56 (wholly B05), R-68
(B02), R-119 (B11 on B05's route), R-47 (B01 REPO_ROOT case, B03 closes): every half has its own row and proof.

**Fixed means proven (REQ-03, B15-Q3 sample).** B15 re-ran, independently, each sampled proof on the code before
its phase (`git archive` of the pre-phase parent, the phase's own test files copied in) and at HEAD:
- every Medium (R-01 to R-33), every security finding (R-03, R-04, R-22, R-34, R-35's warning, R-36, R-63,
  R-102), every write-loss finding (R-01, R-02, R-37, R-38, R-41, R-45, R-56, R-59, R-111) and one Low per phase
  (R-44, R-49, R-80, R-70, R-64, R-158, R-109, R-89, R-98, R-120, R-136, R-142, R-130), plus A-2, A-4, A-10: **69
  findings, every one fails on the old code for its defect and passes at HEAD**, except R-07's plan-tool half,
  which is the guard B12 recorded (its fail-first proof is B02's).
- Evidence: [CLOSING-FAILFIRST-APP.md](CLOSING-FAILFIRST-APP.md) (B01 to B11, 47 by the auditor) and
  [CLOSING-FAILFIRST-TOOLS.md](CLOSING-FAILFIRST-TOOLS.md) (B12 to B14, 18 by the auditor). The auditors left four
  gaps, which B15 then closed itself:
  - R-08: the old `links:apply`, run on a scratch catalogue, put back a link that had been removed by hand
    (it re-read the first run's leftover file); `tests/linkRuns.test.ts` covers the same case at HEAD.
  - R-102, R-12 and R-98: each phase's own e2e spec, run on the pre-phase code on ports 5791 to 5793, failed
    for the defect itself. R-102: a plain click on a drawing's `#settings` link moved the board to Settings.
    R-12: the orphaned draft panel was gone. R-98: there was no "could not be found" flag.
- Weak spots recorded, not gaps: R-56 and R-02 fail mostly on the new call shape (one R-02 test shows the clash
  behaviourally); some R-40, R-58 and R-59 tests are import-only beside behavioural ones; R-64 needed a stand-in
  for its old `createAtomic`; R-130's copy-mode half passed on the old code, as the B14 entry says.
- Every other Low: each entry records a failing run (convention 13), and every proof file runs in
  `verify:board` or the Playwright suite, both green at the final commit.

**Phase records (REQ-08).** B01 to B14 each record COMPLETE, an implementation plan, the convention-15 review
with dispositions, touch-rights edits, Doc facts, deviations, verification, version and CHANGELOG (1.13.0 to
1.26.0 in merge order; B13 1.24.0 and B12 1.25.0 taken at merge), and a handoff. PLAN deliverables without an
R-number are each delivered in their owner's entry: the issue surface and boundary (B03, D-06), the event shape
and asset signal (B07, D-10), the transport in `src/api.ts` (B05), the leave guard and artifact details form
(B06), `deleteLane` as one write (B05), layout saves in order (B07), the HistoryView label (B10), agent tests in
`verify:board` (B12), index-lock contention (B08, fixed). Manual acceptance owed is listed in section 7.

**Decision register (REQ-09).** D-01 to D-10 each Accepted (decisions 13, 16 to 21, 28, 29); every phase question
answered in decisions 10 to 30; no row open. The code agrees with each answer as far as the reviews and the
fail-first runs exercised it.

## 2. Refuted findings (REQ-10 to 13)

| ID | Owner verdict | B15 at the audit commit |
|---|---|---|
| A-1 | refuted (reuse deliberate) | **Holds.** SCHEMA "IDs after a delete", README and `shared/ids.ts` agree with D-05; R-54 Fixed by B05 |
| A-2 | B02: **Confirmed and Fixed** | **Holds.** Reproduced by B02 on a scratch catalogue with a watching API and its own journal; `recode-statuses.ts` refuses beside a live `board-<pid>.lock` (`server/historyDir.ts`, shared by the plugin and the script); `originLive` proves the real board holds and drops the lock; fail-first re-run by B15 |
| A-3 | refuted (duplicate of R-148) | **Holds.** `scripts/shoot-steps.ts` takes `BOARD_PORT` via `loadLaneEnv`; skills say so |
| A-4 | B12: **Confirmed and Fixed** | **Holds.** `build-index.test.mjs` builds a plan with lanes and no safe phase in a temp folder and finds lane rows and copy buttons; fails on the pre-B12 tool (B15 re-run) |
| A-5 | refuted (harmless) | **Holds.** `Timeline` still selects the whole layout and `lineDiff` is not memoised; a re-render, no defect |
| A-6 | refuted | **Holds.** Only point lists yield several spots (`spotsFor`); a failed point has `problem` and no region, so the name button opens the whole artifact |
| A-7 | refuted | **Holds.** Page sizes are read before `PdfPage` mounts (`pdfDocs.ts`); a late render after cleanup draws into a detached canvas and returns at `if (cancelled)` |
| A-8 | refuted (deliberate) | **Holds.** The report states its scope ("every story plus ...", `capture.ts:512`) |
| A-9 | refuted (harmless) | **Holds.** `statusEntriesNaming` still skips array guidance; the pack reads its own branch only (decision 28) and the lane prompt comes from LANES.md |
| A-10 | B12: **Confirmed and Fixed** | **Holds.** The A-10 test records a names-to-codes recode between baseline and working tree; fails on the pre-B12 tool (B15 re-run) |

## 3. Systemic issues (REQ-07)

| Issue | Root fix in place, one mechanism | Findings cleared (owner) | Verdict |
|---|---|---|---|
| 1 Writes | Patch + `baseRev` + `base` through `src/api.ts`; server merge or 409; in-place YAML (`shared/inPlace.ts`); config `bases` per section; lane route with `lanesRev`. No bypass found (systemic reviewer) | R-01 (B06), R-02, R-41, R-45, R-111 (B06), R-37, R-56 (B05), R-38 (B04), R-59 (B07) | **Met** |
| 2 Status identity | Registry (`removedStatuses`, high-water), no-overlap recodes, damaged lists locked, never defaults, in the board | R-01, R-06, R-07, R-30, R-44, R-46, R-68 (B02/B06/B12), R-149 (B14) | **Met with deviations:** the build-plan tools keep their own reader and fall back to built-in lists on an unreadable config (SY-1); an unreadable `status-recodes.json` reads as none (SY-4). Both predate the programme, and decision 16 kept the tools' reader. Deferred |
| 3 Git history | `server/gitCore.ts` (`-z`, first-parent, `GIT_OPTIONAL_LOCKS=0`, either hash width, bounded LRUs) for every history read | R-23, R-24, R-69 to R-74, R-161, R-162 (B08), R-54 (B05) | **Met** (two non-history spawns skip `gitEnv`, SY-6, nit) |
| 4 One rule | One helper per concept in `shared/`; agent tools import it (D-03) | R-27, R-28, R-60, R-61, R-62, R-75, R-76, R-77, R-83, R-101 (B04), R-141 (B13) | **Met** (two fence tests outside the rules the findings named, SY-3 and SY-5; deferred) |
| 5 Bad data | Region boundaries round views and sheets, cycle guards, per-file load isolation, 404 for misses | R-10, R-11, R-47 to R-53, R-65, R-66, R-121, R-122 (B03), R-22, R-63 (B01), R-29, R-113 (B11) | **Met** (masthead outside the boundaries, SY-2; a capture `--only` walk without a guard, SY-7; `/API` spellings fall to the SPA, SY-8; all deferred) |

## 4. Closing reviewers (REQ-14 to 17)

Three fresh Sonnet reviewers, given sources and code but not the audit's conclusions:
[unmet promises](CLOSING-UNMET-PROMISES.md) (with quality and conventions), [systemic regression](CLOSING-SYSTEMIC.md)
(with origin security) and [correctness](CLOSING-CORRECTNESS.md) (with agent-tools truth). B15 verified each finding
against the code. **No regression introduced by the programme was found.**

| Finding | Class | Disposition |
|---|---|---|
| UP-1 `board-edges` real e2e fails | pre-existing stale test (Mapped default since 1.12; the spec never chose Freeform), blocking REQ-20 | **Fixed in B15:** the spec pins Freeform; failed 3 of 3 before, passes 3 of 3 |
| UP-2 CHANGELOG 1.13.0 over-claims `/__open-in-editor` | doc drift | **Fixed** (text) |
| UP-3 README map omits `statuses.ts`, `bom.ts`, `historyDir.ts` | doc drift | **Fixed** (text) |
| UP-4, CO-9 live `plan.config.json` needs `lanes` | accepted (decision 28) | **Manual acceptance owed** (section 7) |
| UP-5 START-HERE "holds copies" | doc drift | **Fixed** (text) |
| UP-6 project words in generic code ("RFP" examples, a fallback colour) | pre-existing | Deferred (the SCHEMA row below) |
| SY-1 plan tools' default status lists | pre-existing, by decision 16 | Deferred |
| SY-2 no page-level boundary over the masthead | pre-existing gap beside D-06 | Deferred |
| SY-3, SY-5 second fence rules (mermaid extraction, Diff splitter) | pre-existing | Deferred (SY-5 is B04's existing row) |
| SY-4 unreadable recodes read as none | gap in decision 16's scope | Deferred |
| SY-6 two `git` spawns without `gitEnv` | pre-existing, not history reads | Deferred |
| SY-7 `capture --only` recursion without a cycle guard | pre-existing (B03 guarded the check) | Deferred |
| SY-8 `/API` spellings reach the SPA page | pre-existing, no security effect | Deferred |
| CO-1 a 409 when the patched value already equals disk | as decision 20 (D-04a) states it | Not a defect; a softer rule is deferred |
| CO-2 layout save records a path-like card id | pre-existing, same-origin data only | Deferred |
| CO-3 item delete removes screenshots after the atomic step | pre-existing | Deferred |
| CO-4 unbounded rename detection on a huge repository | plausible, unmeasured | Deferred |
| CO-5 to CO-8 nits | pre-existing or cosmetic | Deferred |

## 5. Integration proof (REQ-18 to 24)

| Check | Command | Result |
|---|---|---|
| verify:board, audit commit | `npm run verify:board` (load 10 to 16) | 1,191 tests passed; `originLive`'s `afterAll` hook timed out (10 s): red |
| verify:board, final | same, after B15's fixes (load 16 to 19) | **green**: 77 files, 1,191 Vitest tests, catalogue check OK, 73 agent tests |
| Agent-test glob | `node --test "agent/**/*.test.mjs"` vs `find agent -name '*.test.mjs'` | same 13 files; B12's and B13's suites included |
| Playwright | `BOARD_E2E_REAL=1 npx playwright test`, fixture **5482**, real **5483** (`BOARD_PORT` 5480 + 2 and + 3) | **144 of 144** (the real project wrote only its temp history folder) |
| Catalogue | `npm run check` | OK: 15 epics, 70 features, 302 stories, 140 questions, 65 artifacts |
| Content | catalogue-folder files touched by programme commits | only `SCHEMA.md`, `README.md`, `notes/README.md` (docs); no record changed; no migration ran (D-02c) |
| Untouched territory | programme commits vs `aa-prototype/`, `contract-picker-mock/`, `docs/prototype-build/catch-up/`, root `CLAUDE.md` | none, except B12's one-line `verify:board` line in root `CLAUDE.md` (recorded in B12's entry, true) |
| Live agents | `config.mjs --json`, `plan-state.mjs` (and `--coverage`), `recipe-status.mjs --check`, `phase-check.mjs --list`, `phase-context.mjs 39a --stdout` against the live plan | all exit 0, nothing written; plan-state warns about the missing `lanes` key (expected) |
| Installed skills | `.claude/skills/`, `.claude/workflows/` vs `agent/` | exact (50 skill files, 3 workflows; test files are not installed as workflows, by design) |
| Kit export | `kit:export -- --to <scratchpad>/kit` from HEAD `f1f83eff` (outside any repository) | 347 files; leak and reference checks clean; `.kit-export.json`, START-HERE and CHANGELOG all 1.26.1 at `f1f83eff`; no ignored or project-only file; every "This repo" block is the starter's |
| Kit acceptance (B15-Q4) | in the kit: `npm ci` (network), `npm run check`, `npm run verify`, fixture e2e with `BOARD_PORT=5790` (port **5792**) | install OK (327 packages); check OK; Vitest 1,142 passed, 12 skipped (project-only); agent tests 72 passed, 1 skipped; **e2e 137 of 137** |
| ADOPTING | scratch `git init` repo, kit copied in, `install-skills` | 7 skills and 3 workflows copied; check OK |

## 6. Documentation truth pass (REQ-25)

Starting from every phase's Doc facts and B14's whole-file pass, with the unmet-promises reviewer checking every
`npm run` script and flag in README, ADOPTING, About, SKILL.md and START-HERE against `package.json` and the
scripts. Corrected: README's folder map, START-HERE's `.claude/skills/` line, CHANGELOG 1.13.0's
`/__open-in-editor` claim, plus the 1.26.1 entry. Root `CLAUDE.md`: true, but its kit sentence does not say an export
is built from HEAD and refuses a used target; wording proposed to the user (decision 30, Q7), not edited.

## 7. Lists

**Completed.** 163 findings Fixed and proven; A-2, A-4, A-10 confirmed and fixed by their owners; A-1, A-3, A-5 to
A-9 still hold; every PLAN deliverable; D-01 to D-10; the integration proof above; board 1.26.1.

**Accepted deviations.**
- R-35 Won't fix, warned instead (decision 13).
- Symlinks warned, not blocked; no page CSP; no write token (decision 13).
- Status rules: plan tools keep `normaliseStatus` and their own reader (decision 16; SY-1).
- D-04a's strict collision rule (CO-1).
- R-07's plan-tool half proven by a guard (B12's entry).
- The audit commit is `board-fixes`' head, not master (convention 16).

**Exclusions.** No requirement content changed; `aa-prototype/`, `contract-picker-mock/` and the catch-up plan not
touched; FINDINGS.md unchanged; no upgrade mode for adopted boards (B14-Q2).

**Deferred follow-up** (owner: the board's owner, as later board work, unless named).

| Item | Source | Owner |
|---|---|---|
| Plan tools: an unreadable `board.config.json` or `status-recodes.json` should be an error, not built-in lists (SY-1) | systemic review | board owner (agent tools) |
| An unreadable `status-recodes.json` should raise an issue on the board (SY-4) | systemic review | board owner |
| A page-level boundary over the masthead and problem pill (SY-2) | systemic review | board owner |
| Mermaid fence extraction and the Diff splitter to adopt `markdownCode.ts` (SY-3, SY-5) | systemic review, B04 row | board owner |
| `gitEnv` on the two remaining spawns (SY-6); a cycle guard in `capture --only` (SY-7); 404 for `/API` spellings (SY-8) | systemic review | board owner |
| Layout PUT to refuse unsafe card IDs (CO-2); screenshot removal inside the atomic delete (CO-3); measure or bound rename detection (CO-4); CO-1's softer collision rule; CO-5 to CO-8 nits | correctness review | board owner |
| Refuse cross-site navigations to `/__open-in-editor` | B01 row | board owner |
| Neutral `SCHEMA.md` examples for the kit (this project's RFP citations ship; SCHEMA serves both) (UP-6) | B14 row | board owner (kit) |
| B14's code rows (decision 29): escaping base-folder warning; `resolve-source` and `new-artifact` unguarded facts; a tests-only tsconfig; `steps.ts ?? []`; `phase-context.mjs`'s note rule; `plan-state --to` reads current statuses | B01 to B13 rows | board owner |
| Settings accessibility (row focus after Remove and Move, button names, swatch arrow keys); Settings edits not counted by the leave prompt | B06 review | board owner |
| An artifact ID reissued before its deletion is committed shows the old sidecar's history | B05 review | none (accepted under D-05) |
| e2e load flakes (`one-rule` R-101, `board-mapped` lane rename and drag, `artifacts` reduced motion, `diff` live edits): none failed in B15's two full runs (144 and 137) | B05 to B11 rows | board owner (watch) |

Done in B15 (from rows moved to B15): `originLive` cleanup in a `finally` and the 10 s hook timeouts
(`hookTimeout` 60 s); the `board-edges` failure.

**Manual acceptance owed** (the user).
1. **At the `board-fixes` to master merge** (convention 16): add to `docs/prototype-build/catch-up/plan.config.json`
   `"lanes": { "branches": ["lane/a", "lane/b"] }` and, under `runner.context`, `"countNouns": [...]` and
   `"notPhaseBefore": ["BK0*"]` exactly as B12's entry records. Until then `plan-state` warns and `apply-plan-update`
   refuses while `status.json` declares lanes. Take this branch's `docs/board-fixes/index.html` at that merge.
2. **Root `CLAUDE.md` kit sentence** (decision 30, Q7): approve or decline the proposed wording.
3. **UI walk-through** of the visible changes on the running board, if wanted: Settings lock-out and merges
   (B02, B06), the problem pill and recovery panels (B03), the Diff review (B09), artifact viewers (B10), Mapped
   canvas and lanes (B11). Each is covered by e2e; no phase recorded a hand walk as owed beyond these.

## 8. Outcomes (REQ-15)

| # | Outcome | Verdict | Evidence |
|---|---|---|---|
| 1 | No write loses data it did not mean to change | **Met** | systemic issue 1; 2,550 in-place patches over the real catalogue with no loss (correctness reviewer); write-loss fail-first set |
| 2 | A status means the same in every version | **Met with accepted deviations** | B02 registry; R-07 closed; SY-1 and SY-4 deferred |
| 3 | Bad data is an issue, never a crash or omission | **Met** (minor gaps deferred) | B03; `bad-data.spec.ts`; SY-2, SY-7, SY-8 deferred |
| 4 | One rule, one implementation | **Met** (two fence copies deferred) | B04, B13 (D-03 import) |
| 5 | History is right | **Met** | B08 `gitCore.ts`; R-23, R-24, R-70 re-proven |
| 6 | The local origin is closed | **Met with accepted deviations** | B01 (decision 13: symlinks warned, no page CSP); `/__open-in-editor` by top-level visit deferred; origin reviewer found no bypass |
| 7 | Agent tools and docs tell the truth; the kit is generic, safe and runs | **Met with accepted deviations** | B12 to B14; kit export and acceptance above; live plan needs the owed `lanes` key |

## 9. Known limitations

The board stays a local dev tool on Vite's dev server: Vite still serves its own source and `node_modules` to the same
origin, and a top-level visit can open `/__open-in-editor`. Full-suite timings depend on machine load (hooks now
allow 60 s; individual tests keep their own limits). The SCHEMA shipped in the kit still carries this project's RFP
citation examples.

**Closing status: COMPLETE**, with the deferred follow-up and manual acceptance owed above.
