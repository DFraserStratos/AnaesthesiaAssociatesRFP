# B15 implementation plan: closing audit

Session 2026-11-20, programme worktree `AnaesthesiaAssociatesRFP-board`, branch `board-fixes`.
Decisions: accepted decision 30 (B15-Q2 to Q5, Q7). B15-Q1 and Q6 were answered by decision 10.

## Audit baseline (B15-REQ-01)

- **Audit commit:** `d5499c70` (B14 complete, board 1.26.0) on `board-fixes`. Master had no commits that
  `board-fixes` lacked, so no merge. Deviation from the SPEC's wording ("on master"): convention 16 puts
  the programme on `board-fixes` until after B15, so the audit commit is that branch's head.
- **Programme range:** `d4341735..d5499c70`. Programme commits are the ones whose subjects start
  `Board fixes` or `B12`/`B13`/`B14` (30 non-merge commits); the rest of the range is catch-up lane work
  and wave joins merged from master (`Merge branch 'master' into board-fixes`, `60bd04c6`, `b45ab027`,
  `adbb3687`, and B12's and B13's master merges `58e0b6ba`, `2698a8c1`), kept out of attribution.
- Phase commits and their pre-phase parents (used for the fail-first re-runs):

  | Phase | Commit(s) | Pre-phase parent |
  |---|---|---|
  | B01 | `d1e033a6` | `e3e7bf54` |
  | B02 | `277e8381` | `60bd04c6` |
  | B03 | `85af0de0` | `277e8381` |
  | B04 | `f3c7d9f8` | `b45ab027` |
  | B08 | `429b35ce` | `f3c7d9f8` |
  | B05 | `418bd3bd` | `429b35ce` |
  | B07 | `0797c99f` | `418bd3bd` |
  | B06 | `f7edee77` | `adbb3687` |
  | B09 | `40d59025` | `851631c5` |
  | B10 | `30e2155f` | `40d59025` |
  | B11 | `5469db10` | `30e2155f` |
  | B13 | `e404a6d3` | `2698a8c1` |
  | B12 | `23c122c3`, `0047a169` (merge) | `58e0b6ba` |
  | B14 | `ca214463` to `d5499c70` | `0047a169` |

- If B15 changes code after the audit commit, the integration proof reruns at the final commit.

## Coverage method (B15-REQ-02 to 09)

1. **Mechanical cross-check** (`scratchpad/coverage.mjs`): every `R-nn` headed in FINDINGS.md against the
   disposition rows of every phase entry in PROGRESS.md and the owners in PLAN.md's phase table. A split
   delivery counts once, by its closing phase; the producing halves (`Delivered; Bnn closes`) are checked
   for a proof of their own.
2. **Entry completeness** (`scratchpad/entries.mjs` plus reading): COMPLETE, implementation plan path,
   review recorded, touch rights, Doc facts, deviations, verification, version and CHANGELOG, later-phase
   handoff, for B01 to B14; PLAN deliverables without an R-number traced to an entry.
3. **Fail-first re-run** (B15-Q3 sample): two delegated auditors (Sonnet) re-run the phase's own proof
   tests (taken from the phase's commit) on a `git archive` of the pre-phase parent in the scratchpad,
   with `node_modules` linked, and confirm that the named tests fail on the old code for the stated reason
   (not merely on a missing import), then pass at the audit commit. Sample: all Medium (R-01 to R-33),
   security (R-03, R-04, R-22, R-34, R-35, R-36, R-63, R-102), write-loss (R-01, R-02, R-37, R-38, R-41,
   R-45, R-56, R-59, R-111), and one Low per phase: R-44 (B02), R-49 (B03), R-80 (B04), R-70 (B08), R-64
   (B05), R-158 (B07), R-109 (B06), R-89 (B09), R-98 (B10), R-120 (B11), R-136 (B12), R-142 (B13), R-130
   (B14). B01's Lows are all in the security set. Where a proof is e2e-only or manual, the auditor
   reports the ledger's evidence and reruns it where cheap.
4. **Not reproducible / Won't fix / Moved:** none Not reproducible; one Won't fix (R-35, decision 13);
   no finding Moved. Every "Discovered for later" row with owner B15 is judged (decision 30, Q2).
5. **Decision register:** D-01 to D-10 each "Accepted" with a numbered decision; each phase's Bnn-Qn
   answered in decisions 10 to 30.

## Refuted findings (B15-REQ-10 to 13)

- A-2: read B02's entry and `tests/recodeStatuses.test.ts`; confirm the lock refusal exists in
  `scripts/recode-statuses.ts`, the reproduction used a scratch catalogue with the journal path live,
  and later journal changes (B08, B05, B07, B09) did not reopen it.
- A-4, A-10: run `build-index.test.mjs`; read the A-4 case's plan state (no phase safe, lanes present)
  and the A-10 case; generate nothing into `docs/prototype-build/catch-up/`.
- A-1, A-3, A-5 to A-9: re-check each premise in code at the audit commit.

## Closing review (B15-REQ-14 to 17)

Three fresh Sonnet reviewers in parallel, given sources and code but not the audit's conclusions; each
writes its findings to `docs/board-fixes/review/`:
- `CLOSING-UNMET-PROMISES.md`: outcomes, SPEC acceptance items, CHANGELOG from 1.12.3, docs claims;
  also the quality and conventions lens (genericity, DESIGN.md, About in step with skills).
- `CLOSING-SYSTEMIC.md`: bypasses of the five root fixes across the whole board; also the
  origin-security lens (outcome 6).
- `CLOSING-CORRECTNESS.md`: bugs, races, data loss, weak tests across the programme diff; also the
  agent-tools-truth lens (outcome 7, live-plan compatibility).
The session triages every finding itself (regression, pre-existing, doc drift, refuted). Fixes only
within B15-REQ-17 with a fail-first test.

## Integration proof (B15-REQ-18 to 24)

- `npm run verify:board` (root) at the audit commit and again at the final commit.
- Agent-test glob: `node --test "agent/**/*.test.mjs"` in `verify`; compare its file list with
  `find agent -name '*.test.mjs'`.
- Playwright: fixture project on 5482 (`BOARD_E2E_PORT`, = `BOARD_PORT` 5480 + 2) and real project on 5483
  (`BOARD_E2E_REAL=1`), this worktree's own `.lane.env` ports; never 5173, 5174, 5180, 5181 or another
  worktree's 52xx to 56xx. The real project writes only its own history folder.
- `npm run check` (real catalogue); REQ-22 content check: programme commits touch only
  `requirements/SCHEMA.md`, `README.md`, `notes/README.md` in the catalogue folder, no record files; no
  migration ran (decision 16, D-02c).
- REQ-23: run-build-phase and update-build-plan read-only tools against the live plan
  (`phase-context.mjs`, `plan-state.mjs`, `phase-check.mjs --list`, `recipe-status.mjs --check`, `config.mjs
  --json`), output to the scratchpad; compare `.claude/skills/` and `.claude/workflows/` with `agent/`.
- REQ-24: programme commits touch none of `aa-prototype/`, `contract-picker-mock/`,
  `docs/prototype-build/catch-up/`; root `CLAUDE.md` once (B12's `verify:board` line, recorded).

## Kit export (B15-REQ-21, decision 30 Q4)

Order: version bump and CHANGELOG, commit, then `kit:export -- --to <scratch>/kit` (HEAD source, D-09)
into `/private/tmp/claude-501/.../scratchpad/kit` (outside any git repository; confirm with `git -C
<dir> rev-parse` failing). Then in the kit: leak check result (zero matches), `.kit-export.json` version
and commit, START-HERE version, CHANGELOG top entry; no untracked or ignored files; "This repo" blocks
equal `starter/this-repo/`; `npm ci`; `npm run check`; `npm run verify`; fixture e2e with `BOARD_PORT=5790`
(ports 5792, 5793); ADOPTING in a scratch `git init` repo through installing the skills.

## Docs truth pass (B15-REQ-25)

Starting from every phase's Doc facts and B14's whole-file pass: README scripts against `package.json`,
About install command and skill text against SKILL.md, SCHEMA statuses and ID rule, starter config,
CHANGELOG order. Text-only corrections; root `CLAUDE.md` drift listed for the user (decision 30, Q7).

## Version and records (B15-REQ-26 to 29)

1.26.0 to 1.26.1 (patch) unless a user-visible regression fix lands (then 1.27.0). CHANGELOG entry names
only B15's changes. Commit order: B15 files and version, then kit export, then CLOSING-REVIEW.md,
PROGRESS entry, PLAN.md and index.html closing status, committed by path. Never push.

## Recovery

Each step's state is noted in the B15 PROGRESS entry as it completes. A resumed session reads this file
and the entry, re-runs `coverage.mjs` and continues from the first step without recorded evidence.
Scratch folders (archives, kit) live in the session scratchpad and can be recreated.
