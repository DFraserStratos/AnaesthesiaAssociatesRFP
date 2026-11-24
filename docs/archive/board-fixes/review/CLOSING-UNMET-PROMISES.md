# Closing review: unmet promises (lens: promised but absent, partial or misplaced)

Reviewer: fresh closing reviewer, read-only. Branch `board-fixes`, HEAD `d5499c70` (board 1.26.0, with
one uncommitted change in `requirements-board/tests/originLive.test.ts` by another session). Method:
checked CHANGELOG 1.13.0 to 1.26.0, the seven outcomes, PROGRESS dispositions and SPEC acceptance
items against the code, scripts and docs. Targeted runs only: `node --test "agent/**/*.test.mjs"`
(73 of 73 pass) and `node scripts/export-kit.ts --to <scratch> --dry-run` (passes, 347 files). No
server was started and no Playwright run was made.

Overall: the programme is in better shape than most claims audits turn up. I found no outcome that is
clearly absent. The findings below are small: one SPEC "must still pass" item that was never run and
fails, three over-statements or doc gaps, and some loose ends that B15 owns.

## Findings (most severe first)

### UP-1 · important · `e2e/board-edges.spec.ts` (real-catalogue project) fails and no phase made it pass; it also ships in the kit

- **Promise.** B11 SPEC "Prohibited regressions" (`docs/board-fixes/phases/B11-board-canvas-and-views/SPEC.md:325-327`):
  "`e2e/board-mapped.spec.ts`, `board-search.spec.ts`, `board-edges.spec.ts`, `question-step.spec.ts`
  still pass". PLAN "Finish green": "Playwright specs touched by a phase pass". B15-REQ-20: the real
  project passes with `BOARD_E2E_REAL=1`.
- **Evidence.** B11's PROGRESS entry (`PROGRESS.md:1082-1185`) lists only fixture specs (board-canvas,
  board-mapped, board-search, question-step, bad-data, edit-sheets) and never mentions `board-edges`.
  B14 found it failing all three tests ("edges missing", 322 missing) and recorded it as Discovered
  (`PROGRESS.md:758`, `:825`) with owner B15. Cause is visible in the code, not in B11's work:
  `src/store.ts:897` sets `boardMode: 'mapped'` as default, and `src/views/BoardView.tsx:329` returns
  `[]` edges in Mapped unless a lineage is shown. The spec (`e2e/board-edges.spec.ts:32-45`, `freshLoad`)
  never switches to Freeform. The same two lines exist at the baseline (`git show d4341735:` both files),
  so the spec was already stale at 1.12.3; it is a stale test, not a regression, but it is an unmet
  SPEC promise and a never-run check. `playwright.config.ts:31` lists it in the `real` project, and
  `scripts/export-kit.ts:49` excludes only `artifacts-real.spec.ts`, so `board-edges.spec.ts` ships in
  every kit and fails on a fresh adopter's board.
- **Failure scenario.** B15-REQ-20 cannot honestly record "real project passes". An adopter runs
  `BOARD_E2E_REAL=1 npm run test:e2e` on the kit and gets three red tests that are test bugs. Worse,
  the spec's real purpose (the 2-in-3 "edges vanish" race, `cardHandles`) is unprotected in Freeform
  because the only guard fails for an unrelated reason.
- **Outcome / phase.** Outcome 7 (kit "runs"); B11 (SPEC item), B14 (kit), B15 (REQ-17 small fix:
  set `boardMode` to freeform via localStorage in `freshLoad`, or drive the Freeform toggle).

### UP-2 · minor · CHANGELOG 1.13.0 over-claims on `/__open-in-editor`

- **Promise.** CHANGELOG 1.13.0, "Other origins cannot read the board": "... refused 403 on every route,
  Vite's own included (so another page can no longer trigger `/__open-in-editor`)".
- **Evidence.** `server/cataloguePlugin.ts:105-115` (`crossSiteRead`) deliberately lets a top-level
  navigation (`sec-fetch-mode: navigate`, `dest: document`) through. PROGRESS "Discovered for later"
  records the residual: "A top-level visit from another site can still open Vite's `/__open-in-editor`"
  (owner B15). `tests/originLive.test.ts:298` only checks the non-navigation case.
- **Failure scenario.** A page in another tab sets `location = "http://localhost:5180/__open-in-editor?file=..."`
  and the editor opens a file. Someone reading the CHANGELOG would believe this is closed.
- **Outcome / phase.** Outcome 6; B01. Either reword the CHANGELOG line ("a fetch, image or frame from
  another page can no longer ...; a top-level visit still can, see README") or have B15 refuse
  navigations to `/__open-in-editor` as the row suggests.

### UP-3 · minor · README "Layout" omits the new rule modules the programme added

- **Promise.** README Layout is the developer map of `shared/` and `server/` (PLAN "Doc lines": a phase
  updates lines that describe behaviour it changes; B14 does the whole-file truth pass).
- **Evidence.** `grep -c` of README for `statuses.ts`, `bom.ts`, `historyDir.ts` returns 0 each.
  `shared/statuses.ts` is the status-identity rule (outcome 2, B02) and its header says "`statusState`
  carries that per list to the client"; `shared/bom.ts` (B03) and `server/historyDir.ts` have no entry
  either. Every other file in `shared/` and `server/` is named.
- **Failure scenario.** A developer or agent looking for "where is the one status rule" finds no map
  entry, the exact problem outcome 4 ("each rule has one implementation") is meant to prevent.
- **Outcome / phase.** Outcome 4 and 7; B02, B03, B14 (truth pass).

### UP-4 · minor · live plan cannot be updated until `plan.config.json` gains `lanes` (known, but nobody owns the write)

- **Promise.** PLAN "Live agents": tool changes "stay backward compatible with the in-flight catch-up
  plan ... or ship with a migration the plan's owner accepts". B15-REQ-23: "any tool change that needed
  a migration has the plan owner's recorded acceptance".
- **Evidence.** Running `node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs`
  on the live plan prints: "status.json declares build lanes (Lane A, Lane B) but
  docs/prototype-build/catch-up/plan.config.json names no branch for them ... Do not update the plan
  until they are: add the key, or wait for the join." `grep '"lanes"'` in that config finds nothing.
  PROGRESS decision 28 says "migration at the master merge" but the exact additive config edit and its
  owner's acceptance are not recorded as an action anywhere in B15's list.
- **Failure scenario.** After `board-fixes` merges to master, the next `/update-build-plan` is refused
  (by design) until someone writes the key; `apply-plan-update` also refuses. The guard works, so
  nothing is lost, but the hand-off step is implicit.
- **Outcome / phase.** Outcome 7; B12 (D-08), B15 (REQ-23 records it).

### UP-5 · nit · START-HERE says `.claude/skills/` "holds copies"; the install can also link

- **Promise.** About page and README (1.26.0): `install-skills` "keeps the mode in use (copies, or links
  with -- --link)".
- **Evidence.** `starter/START-HERE.html:163`: "`.claude/skills/` holds copies". True for a fresh kit
  (fresh repo gets copies, `scripts/install-skills.ts:5`), false once an adopter passes `-- --link`.
  README:19-20 and AboutView:468 describe both.
- **Outcome / phase.** Outcome 7; B14. One-word fix ("copies by default").

### UP-6 · nit · generic code still carries a few project-flavoured words

- **Promise.** PLAN: "board code, scripts and skills stay project-generic (project facts only in
  `board.config.json`, `capture/` and each skill's "This repo" block)".
- **Evidence.** Outside "This repo" blocks and the kit-omitted `svg-diagram/examples/*.py`, the only
  hits for the project's vocabulary are the word "RFP" as a sample source in comments:
  `shared/types.ts:294,299` (`"RFP p.27 · ..."`, `/docs/rfp-reference/RFP.pdf`), `shared/sources.ts:3`,
  `scripts/new-artifact.ts:14`, `agent/workflows/consistency-rulings.js:48` ("the original brief or
  RFP"), and `requirements/SCHEMA.md` Sources examples (recorded in PROGRESS as moved to B15).
  `src/board/BoardMinimap.tsx:35` adds a literal `#8a8f98` fallback colour for unknown types (DESIGN
  fixes type colours; no token). None leaks people, numbers or product names, and `starter/deny.txt`
  does not match them.
- **Outcome / phase.** Outcome 7; B14/B15 judgement call. Neutral examples ("Spec p.27") would be cleaner.

## Checked and true (main claims verified against code)

- **Dispositions:** every R-01 to R-164 and each of A-1..A-10 appears in PROGRESS (script over IDs; A-3,
  A-6 to A-9 appear only as refuted premises, which matches B15-REQ-13's re-check job). 160 of 164 IDs
  are cited in tests; the other six (R-102, R-132, R-150, R-152, R-156, R-157) each have a recorded
  non-test proof that checks out (R-102 in `e2e/origin.spec.ts`, R-132 `installStatus` gone, R-150 grep).
- **SPEC-named test files all exist** (every `tests/*.test.ts`, `e2e/*.spec.ts`, `*.test.mjs` named in
  any SPEC or PROGRESS is present).
- **Versions:** `package.json` and `package-lock.json` both 1.26.0; CHANGELOG has an entry for each of
  1.13.0 to 1.26.0.
- **1.26.0 kit export:** `--uncommitted`, `.kit-export.json` marker with hashes, refusals for
  inside/contains/foreign targets, no override flag, `<!-- kit:omit -->` handling, junk rule shared with
  `install-skills` (`server/junk.ts`), "N here" and people deny terms in `starter/deny.txt`. A scratch
  `--dry-run` export from HEAD succeeds (347 files) and its doc script/path checks pass.
- **1.26.0 other:** `install-skills --link|--copy` (and refusal of both); `parseOnly` handles
  `--only=ID`, empty and missing values (`scripts/captureFiles.ts:59-69`); `callerDir`/`userPath`
  used by artifact:new, export:csv, artifact:steps, links:index/apply, kit:export, capture,
  recode-statuses; Playwright ports `BOARD_PORT`+2/+3 with `BOARD_E2E_PORT`/`BOARD_E2E_REAL_PORT`;
  `e2e/artifact-regions.spec.ts` is generic (no AR ids) and ships; the fixture project lists every
  fixture spec.
- **Docs vs scripts:** every `npm run` script named in README, ADOPTING, About, SCHEMA, skills exists in
  `package.json` (or is a root-only script inside kit-omit); every `--flag` named in README, ADOPTING,
  SKILL.md files and About is defined in some script or tool; every file name the docs cite exists
  (except project files inside "This repo" blocks).
- **Genericity:** `run-build-phase` body names no project convention outside its "This repo" block
  (lines 21-96); starter has State version / Source rule / progress placeholders; `transcript-reconciler`
  rightly has no block; 6 starter "This repo" files for the 6 skills that have one.
- **About vs skills:** About's install command, skill list, role/step wording and the "only
  run-build-phase commits" line agree with SKILL.md files and README; skills listed in README:15-17
  match `agent/skills/` and `agent/workflows/` (7 skills, 3 workflows); installed `.claude/skills` and
  `.claude/workflows` match `agent/` (links, no extras).
- **Agent tools:** 73 of 73 `node --test` pass; `npm run verify` includes `node --test "agent/**/*.test.mjs"`
  (1.25.0 claim); `plan-state.mjs` lane guard message matches CHANGELOG 1.25.0.
- **Origin/security (1.13.0):** deny rule, cross-site refusal and CORP header exist in
  `server/cataloguePlugin.ts`; `/api/*` PUT routes all carry bases (`requirePatch`, `staleness`,
  `baseRev`; VOICE.md uses `baseRev`).
- **Visual conventions:** no new hex or rgb colours in `src/styles.css` or `src/**` diffs apart from the
  minimap fallback (UP-6); no en or em dashes added in `src/`; DESIGN.md gained lines for the connection
  pill, issue panel, sheets, lanes, filters, diff and Settings that the CHANGELOG describes.
- **Moved rows:** every "Discovered for later" row has an owner or an explicit "none" with a reason;
  those moved to B15 (e2e flakes, `.origin-fixture` cleanup, `/__open-in-editor`, SCHEMA example row,
  `board-edges`) are exactly what decision 30 / B15-Q2 says B15 will judge. B15 itself is still IN
  PROGRESS, so `CLOSING-REVIEW.md` and the final ledger do not exist yet (expected, not a finding).
