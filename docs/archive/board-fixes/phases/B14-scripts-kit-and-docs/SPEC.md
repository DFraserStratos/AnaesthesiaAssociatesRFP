# Phase B14: Scripts guard what they delete, the skill install is exact, and the kit is generic and true

**Status:** PLANNED

**Requirements:** R-05, R-31, R-39, R-129, R-130, R-131, R-132, R-134, R-148, R-149, R-152, R-153,
R-154, R-155, R-156, R-157 (16 findings; full detail under "#### R-nn" in
[FINDINGS.md](../../FINDINGS.md), theme "Kit export and portability"). Appendix items A-1 (ID reuse is
deliberate, feeds D-05) and A-3 (narrower duplicate of R-148) are context. Programme outcome 7 in
[PLAN.md](../../PLAN.md): "Agent tools and docs tell the truth, and the exported kit is generic, safe to
export and runs."

**Owns:**
- `scripts/export-kit.ts`: target guards, export source, skip rules, leak check.
- The R-31 path sweep across every board script and the server's environment paths (accepted decision 5):
  `scripts/new-artifact.ts` path handling, `export-kit.ts`, `export-csv.ts`, `shoot-steps.ts`, the path
  handling of `scripts/link-index.ts` and `scripts/apply-links.ts` (B13's files, edited after B13 under
  touch rights), and the folder-naming environment values read in `server/catalogueFs.ts`,
  `server/artifactFiles.ts`, `server/cataloguePlugin.ts` and `scripts/recode-statuses.ts` (B14 owns
  whichever outcome B14-Q1 picks).
- `scripts/capture.ts` and `scripts/captureFiles.ts` for pruning (R-39) and `--only` (R-134), after B12's
  R-139 change to the same file.
- `scripts/install-skills.ts`, `server/skillInstall.ts`, and the tracked links in `.claude/skills/` and
  `.claude/workflows/` that the install produces in this repo; `.gitignore` lines this phase needs.
- Kit docs: R-149's project status-number pins in `requirements/SCHEMA.md` and SCHEMA's ID-reuse wording
  (per D-05); `requirements/notes/README.md`, `requirements/changes/README.md`, `README.md`, `ADOPTING.md`,
  the About page's install and skills text (`src/views/AboutView.tsx`), skill docs that name files the
  export strips or the board's port, `starter/` (`START-HERE.html`, `this-repo/`, the starter config and
  docs), and `playwright.config.ts` ports.
- Verifying `starter/deny.txt` after B12 adds the R-150 terms and placeholders; any further deny terms
  this phase's findings need (R-154 people, R-149 pins).
- The whole-file docs truth pass over README, ADOPTING, SCHEMA, START-HERE and About text, starting from
  the "Doc facts" in earlier phases' PROGRESS entries.
- The B05-Q6 handoff: if B05 did not remove `git mv` from `artifact:new`, B14 does, or records why not.
- Acceptance for all 16 findings, and the decision D-09.

**Excludes:**
- run-build-phase and update-build-plan tool and SKILL text portability, R-150 and R-151, including the
  R-150 deny terms and starter "This repo" placeholders: **B12** (B14 verifies them).
- R-139 (capture report staleness) in `scripts/capture.ts`: **B12**.
- Consistency-review and linking tools (`agent/skills/consistency-review/`, `agent/workflows/*.js`, the
  behaviour of `scripts/apply-links.ts`, `scripts/linkProposals.ts` and `scripts/link-index.ts`): **B13**.
- `artifact:new` ID claiming and atomic create (R-67, R-64): **B05**. B14 changes how that script resolves
  and prints paths, and takes the B05-Q6 handoff above.
- The status registry itself, `scripts/recode-statuses.ts` behaviour and its journal handling: **B02**. B02
  updates the SCHEMA lines that state the rules it changes (convention 12) and keeps
  `tests/starter.test.ts` green if the config format changes.
- ID allocation and history reset on reuse (R-54): **B05** (with B08's deletion bound). B05 records the
  D-05 answer; B14 writes SCHEMA's ID-reuse wording.
- SCHEMA, README, About and SKILL.md lines describing rules other phases change: those phases (convention
  12). B14 checks them in its whole-file pass.
- About page scrolling (R-127, **B11**). B14 touches only About copy.
- The closing audit and final integration export: **B15**.

**Depends on:** B02, B05, B11, B12, B13 (PLAN "Depends on"). Serial order: B01, B02, B03, B04, B08, B05,
B07, B06, B09, B10, B11, **B14**, B15; B12 and B13 run in parallel worktrees and are merged before B14.
- **B02** COMPLETE with D-02 recorded: the registry the starter config and status docs must match.
- **B05** COMPLETE with D-05 recorded (settled before B08 builds): the ID rule SCHEMA states. B05's
  version of `scripts/new-artifact.ts` (R-67, and B05-Q6 on `git mv`) is B14's input.
- **B11** COMPLETE: its About page scrolling change (R-127) is the input for B14's About copy edits.
- **B12** COMPLETE and merged: its generic SKILL bodies, deny terms and starter placeholders, and its
  `capture.ts` change (R-139).
- **B13** COMPLETE and merged: its `apply-links.ts`, `link-index.ts` and SKILL text.
- The "Doc facts" lists in every earlier phase's PROGRESS entry (and "Discovered for later" for anything
  not done).
- D-09 (owned) resolved in B14's implementation planning, before building the export changes.

**Unblocks:** B15: its kit export proof (B15-REQ-21) uses B14's guards and source rule; its Playwright
proof (B15-REQ-20) uses B14's port mechanism; its docs truth audit starts from B14's pass.

**Binding constraints:**
- PROGRESS conventions 1 to 14 apply, in particular: 2 (one disposition per finding), 3 (existing stack:
  Vite, React 18, TypeScript, Node >= 22.18 running `.ts` directly, Vitest, Playwright; no new dependency
  without a recorded reason), 4 (generic board code, scripts and skills; About in step with the skills;
  DESIGN.md for visual changes), 5 (version bump and CHANGELOG), 6 (`verify:board` green; touched
  Playwright specs on a free port), 7 (no requirement content changes), 8 (backward compatible with the
  live catch-up plan), 9 (never stage mid-phase; `rm`, not `git rm`, for the tracked link that goes), 11
  (touch rights, with every edit in another phase's file named in the entry), 12 (doc lines and "Doc
  facts"), 13 (every proof fails before the fix and passes after).
- Project facts live only in `requirements/board.config.json`, `requirements/capture/` and each skill's
  "This repo" block. The kit export's leak check (`starter/deny.txt`) must pass.
- `.claude/skills/` and `.claude/workflows/` hold tracked symlinks into `requirements-board/agent/`. This
  repo uses link mode (root `CLAUDE.md`). Live build lanes in other worktrees get those links through
  merges from master.
- Ports: never 5173, 5174, 5180 or 5181 for tests; lanes take ports from `.lane.env` (PLAN, Ports).
- Never export into this repo or a real adopting repo during work or proof; scratch folders only.
- `requirements/notes/README.md` and `changes/README.md` are folder guides, not requirements; editing them
  is in scope.

## Objective and outcomes

The board's scripts and kit are the parts other people and other repos meet first, and the parts that can
destroy the most with one mistyped argument. When B14 is delivered:

1. **No export can wipe a live board.** `kit:export` refuses any target that is, contains or sits inside a
   live board, or that holds catalogue data rather than an earlier kit, and it decides this before it
   changes anything.
2. **A path means what the user typed.** Every script argument that names a file or folder resolves
   against the folder the user ran the command from, including under `npm --prefix`, and the rule for
   folder-naming environment values is chosen and documented.
3. **The kit holds exactly the intended files**: built from the source D-09 names (PLAN's outcome
   summary reads "built from committed files"; D-09 settles the exact rule), never from untracked
   scratch files, with a leak check that covers the project's people and status numbers.
4. **Kit docs are generic and true**: they describe roles, not this project's numbers; every file, script
   and test they name ships in the kit, or they say where it lives instead.
5. **The skill install is exact and safe to re-run**: `.claude/` ends holding the board's current skills
   and nothing stale, junk files do not disown a skill, and the command the board shows keeps this repo's
   tracked links.
6. **Capture never deletes a screenshot another item uses, and never runs a full capture by accident.**
7. **Ports follow the worktree**: `artifact:steps` shoots the worktree's own board, and the real-catalogue
   e2e run does not collide with the contract picker.
8. **The docs match the board** after B01 to B13, including status (D-02) and ID (D-05) rules.

## Sources and current-state evidence

All evidence below was re-verified at HEAD `d4341735` (board 1.12.3) on 2026-11-18. Lines are current.
Paths are relative to `requirements-board/` unless they start with `.claude/`, `docs/` or a repo-root
folder.

**Baseline export.** `node scripts/export-kit.ts --to <scratch>` at HEAD passes its leak check (261 files).
The staged kit, with `node_modules` linked in, passes its own `check` ("OK, no errors"), `tsc -b` and
Vitest (37 files, 466 tests). The kit runs today; the findings are about safety, contents and truth.

| Finding | Location at HEAD | Status at HEAD |
|---|---|---|
| R-05 | `scripts/export-kit.ts:117-123`: refuses only when the target has other files and no `requirements-board/` (`:118-119`), then removes everything in `<target>/requirements-board` except `node_modules` (`:123`). | **Reproduced** on a scratch copy of the board: from the copy's repo root, `npm --prefix requirements-board run kit:export -- --to ..` replaced the 387 stories with the 13 starter stories and removed `.links/`, `starter/` and `scripts/export-kit.ts` (the copy can no longer export). In a real repo, uncommitted edits, `.history/`, `.links/` and `shots/` (all git-ignored) would be unrecoverable. |
| R-31 | `scripts/new-artifact.ts:66` (`--mermaid` path checked unresolved), `:70` (`resolve(given)`); `export-kit.ts:23`; `export-csv.ts:14`; `shoot-steps.ts:34`; `apply-links.ts:18`. Not in the finding but the same defect: `link-index.ts:55-59` (output path). Printed paths use `relative(process.cwd(), …)` (`new-artifact.ts:84-124`, `capture.ts:69-72`, `recode-statuses.ts:146,153`, `link-index.ts:37`), so they read relative to the board folder. Env values `REQUIREMENTS_DIR`, `HISTORY_DIR`, `REPO_ROOT` (`server/catalogueFs.ts:18`, `server/artifactFiles.ts:21,27`, `server/cataloguePlugin.ts:34`, `scripts/recode-statuses.ts:144`) resolve the same way (B14-Q1). | **Reproduced**: from a scratch repo root, `npm --prefix requirements-board run artifact:new -- notes/x.md --title X --kind note` fails "notes/x.md does not exist" although the file exists there. Two runs of `kit:export -- --to kit-out` wrote `requirements-board/kit-out/requirements-board/`, and the second nested `kit-out/` inside the kit. npm 11.19.1 sets cwd to the package; the caller's folder is only in `INIT_CWD`. A nested call (a root script that runs `npm --prefix …`) gets the root script's folder as `INIT_CWD`. |
| R-39 | `scripts/capture.ts:491-495` (`pruneAssets`), `scripts/captureFiles.ts:28-39` (`pruneGenerated`). The item delete route already guards this case (`server/catalogueApi.ts:377-380`, `keptImages`). README `:290` says "stale generated files are deleted". | **Holds by inspection.** Shared references are real: at least 10 stories list a screenshot in another item's folder (for example US-01.3.1 uses `assets/US-01.3.4/`, US-02.2.1 uses `assets/US-02.2.2/`). |
| R-129 | `server/skillInstall.ts:49-64` and `:66-76` loop over current sources only; `:78-80` rewrite the manifest from this run, or delete it in link mode. | **Holds by inspection.** A removed or renamed skill or workflow is never cleared: its copies drop out of the manifest and later read as "not the board's"; its links stay, dangling. |
| R-130 | `server/skillInstall.ts:35-38` (`ours`: a folder is the board's only if every entry, dotfiles included, is a board link), same test in `installStatus` `:119`; link mode never links dotfiles (`:56`). | **Holds by inspection.** One `.DS_Store` in a linked folder makes every later run skip that skill. |
| R-131 | `server/skillInstall.ts:56` (links every non-dot entry, `__pycache__` included), `:58` (copy filter skips only `.DS_Store`); `export-kit.ts:51-52` skips `__pycache__`. `.claude/skills/svg-diagram/__pycache__` is tracked (`git ls-files .claude`) and `requirements-board/.gitignore` ignores `__pycache__/`. | **Holds.** The link resolves on this machine only because a local `.pyc` exists; it dangles in every fresh clone and worktree. |
| R-132 | `server/skillInstall.ts:105-153`: a linked skill is "current" without checking that every source file is linked (`:119-123`). Only caller: `tests/skillInstall.test.ts`. | **Holds by inspection.** |
| R-134 | `scripts/capture.ts:155-164`: `--only` read as the next argument; `--only=ID` or a trailing `--only` give undefined, which means a full run (`fullRun = !only`), which also rewrites `REPORT.md` (`:646-649`). | **Holds by inspection.** `--only --dry` takes `--dry` as the ID list (fails on lookup, but also sets dry). |
| R-148 | `scripts/shoot-steps.ts:33` defaults to `http://localhost:5180` and does not read `.lane.env`, while the board's dev server does (`vite.config.ts:6-12`) and so does capture (`capture.ts:46-57`). Docs: `agent/skills/svg-diagram/SKILL.md:26` ("This repo"), `:216-218`; `agent/skills/add-artifact/SKILL.md:22` ("This repo"), `:113-118`; `starter/this-repo/add-artifact.md:7`, `starter/this-repo/svg-diagram.md:8`. Lane boards: 5280 and 5380 (`docs/prototype-build/catch-up/LANES.md:21`). | **Holds by inspection.** |
| R-149 | `requirements/SCHEMA.md:451` ("6 here"), `:462-464` ("4 here", "Agreed 4 here", "Verify (3 here)", "Confirmed 5 here"); also `requirements/notes/README.md:61` ("4 here"). Shipped as-is by `export-kit.ts:35,57-60`. Starter config: 4 is Confirmed (client sign-off), 5 is Retired. | **Confirmed in the scratch export**: the kit's SCHEMA carries all four. |
| R-152 | `requirements/notes/README.md:47-55`: a legacy citation table naming AR-09, AR-16, AR-17 to AR-24 and `../../../docs/reference/Data files/`, which does not exist (the data lives under `docs/discovery-reference/`). `changes/README.md` (8 lines) is neutral today but ships from the live catalogue the same way. | **Confirmed in the scratch export.** |
| R-153 | Kit strips `e2e/artifacts-real.spec.ts`, `scripts/export-kit.ts`, `tests/starter.test.ts`, `starter/` (`export-kit.ts:26-33`) and the `kit:export` script (`:62-66`). Still named in the kit: `README.md:44,346-361`; `ADOPTING.md:10-11,159-161,165`; `playwright.config.ts:21`; `agent/skills/add-artifact/SKILL.md:114-115`. `starter/START-HERE.html:148-156` lists every skill except run-build-phase; README `:15-17` does the same. | **Confirmed in the scratch export.** The kit loses the only region sweep over a real catalogue. |
| R-154 | `export-kit.ts:41-55` copies the working tree minus a skip list. `starter/deny.txt` lacks Ben, Vanessa, Michael and Shane, named in this project's voice patterns (`requirements/board.config.json`, `voice.descriptionWarnings`). | **Mechanism holds; no file would leak today.** `git ls-files -o --exclude-standard requirements-board` is empty now (the review's one untracked file is gone). The only ignored file outside skipped folders is a `__pycache__/*.pyc`, which the export already skips. |
| R-155 | `src/views/AboutView.tsx:432` shows `npm --prefix requirements-board run install-skills` with no `-- --link`; `:465` says `.claude/skills/` "holds installed copies"; `:273` says each skill "never commits", while run-build-phase commits when its prompt allows (`agent/skills/run-build-phase/SKILL.md:16,104`). | **Holds.** Running the shown command here replaces the tracked links with copies. |
| R-156 | `README.md:15-17` omits run-build-phase; `README.md:264` says Settings edits `board`, but `ConfigPatch` excludes it (`shared/config.ts:98`) and a project save deletes it (`server/catalogueApi.ts:541-543`); `README.md:48` "Settings names the board"; `starter/START-HERE.html:139` "name the board". | **Holds.** The last two are the same stale fact, found while verifying. |
| R-157 | `playwright.config.ts:9,21,27`: real-catalogue board on 5181, `strictPort`, `reuseExistingServer: false`; `contract-picker-mock/vite.config.ts:7-8` takes 5181 strictly; `README.md:31` names 5181. | **Holds by config reading.** The fixture board's 5182 is fixed too, so two lanes running board e2e at once would collide (B14-Q3). |

**B05-Q6 handoff (not a finding).** `scripts/new-artifact.ts:90-97` moves a tracked file with `git mv`,
which stages the move mid-phase, against convention 9 (PROGRESS "Discovered for later", owner "B05, then
B14").

Assumptions, stated as such: the kit's intended use is to export into a staging folder for sharing, and to
re-export into the same staging folder; it is not an upgrade path for a repo that already adopted the board
and filled its catalogue (B14-Q2). `npm` sets `INIT_CWD` for every `npm run`, which held for npm 11.19.1.

## Detailed requirements

Each requirement states observable behaviour. "Candidate" approaches come from FINDINGS.md and are options,
not mandates, except where marked as a safety rule.

### B14-REQ-01 · The export never removes a live board (R-05, R-31)

1. **Safety rule.** `kit:export` refuses, and changes nothing anywhere, when the resolved
   `<target>/requirements-board` is the running board's folder, contains it, or lies inside it. Compare
   real paths, so a symlink or `..` spelling cannot slip past.
2. **Safety rule.** It refuses when the target's `requirements-board/` holds anything that marks a live
   board rather than an earlier export: a catalogue that is not the starter as exported, or a `.history/`,
   `.links/` or `shots/` folder. The exact test that tells "an earlier kit" from "a live board" is D-09.
   (Candidate: the export writes a marker file naming its version and source; a target without a matching
   marker is refused.)
3. All refusals happen before the target is touched. The message names the target, the reason, and what
   to do (an empty folder, or the folder an earlier export wrote).
4. Preserved: a re-export into a folder that holds an untouched earlier kit still works, replaces only
   `requirements-board/` in it, keeps that folder's `node_modules`, and leaves every other file in the
   target alone. `--dry-run` still stages and checks without writing to the target.
5. A refused or failed export leaves no half-written target. The staged kit may be kept for inspection,
   outside the target, as today.

### B14-REQ-02 · The kit is built from the agreed source only (R-154; D-09)

1. The kit is built from the source D-09 chooses (for example the committed tree, the index, or the
   working tree filtered by git). Whatever the choice: untracked files and git-ignored files never ship;
   the skip list (generated folders, project data, export tooling) still applies.
2. If D-09 allows building from a tree with uncommitted changes, the export says so plainly, naming the
   changed files under the board; if D-09 requires a clean tree or a commit, the export refuses otherwise.
3. The starter catalogue, the "This repo" blocks and the kit's shared format files come from the same
   source as the code, so a kit is one consistent snapshot.
4. The kit records the version it was exported at (as today, in START-HERE and package.json) and, if D-09
   exports from a commit, that commit.
5. One skip rule for junk (dotfiles such as `.DS_Store`, `__pycache__`) is shared by the export and the
   skill install (see REQ-10), so the two cannot drift again (R-131).

### B14-REQ-03 · The leak check covers the project's people and numbers (R-154, R-149)

1. The leak check fails the export if any shipped text file names a person this project's config names
   (today: the people in `voice.descriptionWarnings`), or any other `starter/deny.txt` term. Candidate:
   generate deny entries from `requirements/board.config.json`, or list them by hand; either way every
   person named in the project's voice patterns is covered and the generic board code reads no project
   name.
2. The export fails if a shipped doc pins a status to this project's number (the "N here" pattern of
   R-149, or any status number that disagrees with the starter config). Candidate: an export check for
   `\d here`.
3. The check runs over every shipped text file, START-HERE and package.json included, after every
   substitution.
4. Verification of B12's deliverable: the deny terms and starter "This repo" placeholders that B12 adds
   for R-150 and R-151 (`PERSIST_VERSION`, the demo clock, count nouns such as Bookings) are present in
   `starter/deny.txt` and the starter blocks, and a planted term fails the export. If any is missing, B14
   adds it under touch rights and names it in its entry. The kit at the end of B14 passes with them in
   place.

### B14-REQ-04 · Kit docs are neutral and name only what ships (R-149, R-152, R-153)

1. The kit's SCHEMA names statuses by role (default, waiting, settle, the final sign-off, retired,
   answered) and never by this project's numbers. Where it gives an example number, it matches the starter
   config. The live repo's SCHEMA is corrected the same way, since SCHEMA is shared (R-149).
2. The kit's `notes/README.md` and `changes/README.md` hold no project artifact IDs, legacy tables or
   paths into this repo (R-152). Candidate: starter copies of both, dropped from the shared list. The live
   `requirements/notes/README.md` points at a path that exists (`docs/discovery-reference/…`, or wherever
   the files are), and its "4 here" becomes a role.
3. Every file path, npm script and test that a shipped doc or skill names exists in the kit, or the text
   says that it lives only in the full board the kit was exported from (R-153). This covers at least the
   kit's README (`kit:export`, `starter/`, `tests/starter.test.ts`), ADOPTING (`kit:export`,
   `e2e/artifacts-real.spec.ts`, `starter/deny.txt`), `playwright.config.ts` (`artifacts-real.spec.ts`),
   and add-artifact's check step. Candidate: an export-time check that every `npm run <script>` and repo
   path in shipped Markdown resolves in the staged kit.
4. The kit keeps a generic way to open every named region of the adopting project's own artifacts (the
   sweep `e2e/artifacts-real.spec.ts` does today), with the project-specific assertions (this project's
   RFP page and note point) left in the source repo only. Candidate: split the spec into a generic part
   that ships and a project part that the export skips. The add-artifact skill points at whichever ships.
5. START-HERE, README and the About page list every skill the kit ships, run-build-phase included.

### B14-REQ-05 · Status docs describe the registry B02 delivered (consumes D-02)

1. B02 updates SCHEMA's lines for the status rules it changes (convention 12). B14 removes R-149's
   project number pins (REQ-04.1) and, in its whole-file pass, confirms SCHEMA's "Board config file"
   statuses passage and Conventions describe the status model as B02 built it: how codes are allocated and
   whether they are reissued, what marks a removed code and where it lives, what a damaged list does, and
   how `statuses:recode` records the versions it applies to. Gaps B02 left are fixed and named.
2. `starter/requirements/board.config.json` is in the registry format B02 chose and passes the check;
   `tests/starter.test.ts` stays green. `starter/requirements/README.md` and
   `starter/this-repo/update-requirements.md` (which lists starter codes) agree with it.
3. README's config section agrees with SCHEMA.
4. If B02 had to change the starter config to keep `verify:board` green during its own phase, B14 checks
   that change rather than redoing it.

### B14-REQ-06 · ID wording follows D-05 (consumes D-05)

SCHEMA's ID statements (`requirements/SCHEMA.md:73` items, `:267` artifacts, `:451` "No deletes for items",
`:456-458` freed `OQ-nn`), `starter/requirements/README.md:28-31` and README's Delete bullet (`:151-155`)
state one rule: the D-05 answer as recorded in PROGRESS.md. None says "never reused" if reuse stays, and none
says "no deletes" while the board deletes items.

### B14-REQ-07 · Paths resolve against the folder the user ran from (R-31)

1. Every user-typed path argument of the board's scripts resolves against the folder the command was run
   from: `INIT_CWD` when npm ran the script, else the process's working folder. Absolute paths are used as
   given. Running a script directly with `node scripts/x.ts` from the board folder behaves as today.
2. In scope: `artifact:new` (the file and `--mermaid`), `kit:export --to`, `export:csv --out`,
   `artifact:steps --out`, `links:index` output and the `links:apply` run folder (B13's files; item 8),
   and any other script argument the sweep finds. Candidate: one shared helper all scripts use, so a new script inherits it.
3. Checks that depend on the resolved path (artifact:new's "inside the requirements folder" and `--keep`
   "inside the repository") use the resolved path, so `requirements-board/requirements/notes/x.md` typed at
   the repo root is recognised as already inside the catalogue.
4. Paths a script prints are meaningful where the user typed: relative to that folder when beneath it,
   absolute otherwise.
5. `kit:export` never writes into the board folder (covered by REQ-01.1); a relative `--to` names a folder
   relative to where the user ran it.
6. Preserved: every documented command form in the skills, README, ADOPTING, CLAUDE.md and the live plan's
   `plan.config.json` keeps working (they mostly run from the repo root with paths relative to it, which
   this change makes correct).
7. Environment values that name folders (`REQUIREMENTS_DIR`, `HISTORY_DIR`, `REPO_ROOT`, read in
   `server/catalogueFs.ts`, `server/artifactFiles.ts`, `server/cataloguePlugin.ts` and
   `scripts/recode-statuses.ts`) follow the B14-Q1 answer: either they resolve against the caller's folder
   as arguments do, or the docs (README and the scripts' headers) say a relative value is relative to the
   board folder. B14 delivers either outcome, editing the server files under touch rights if needed.
8. `link-index.ts` and `apply-links.ts` are B13's files; B14 edits only their path resolution and
   printing, after B13 is merged, and names the edit in its entry.

### B14-REQ-08 · Capture never deletes a screenshot another item uses (R-39)

1. When a recipe stops producing a file, capture deletes it only if no other item's `images` lists it. A
   file still referenced is kept and named in the run's summary as kept, with the items that use it.
2. The check stays green after a recipe renames a shot that another item also lists.
3. Preserved: hand-added images (names that do not start with a screenshot app key and a dash) are never
   touched; unreferenced stale generated files are still removed; `--dry` writes and deletes nothing.
4. README's capture "Output" bullet says what is pruned and what is kept.

### B14-REQ-09 · `capture --only` is strict (R-134)

1. `--only ID[,ID]` and `--only=ID[,ID]` select the same items.
2. `--only` with no value, an empty value, a value that is another flag, or a list that yields no IDs fails
   with a message and changes nothing: no shots, no item writes, no report.
3. A full capture (and the report rewrite) happens only when `--only` is absent.
4. Preserved: an epic or feature ID takes its descendants; an unknown ID fails as today; `--dry` behaves
   as today. The live plan's `runner.capture` (`onlyFlag`, `dryFlag`) keeps working unchanged.

### B14-REQ-10 · The skill install leaves exactly the board's current skills (R-129, R-130, R-131, R-132)

1. After an install in either mode, `.claude/skills/` and `.claude/workflows/` hold, for the board, exactly
   its current skills and workflows. An entry the board installed earlier for a skill or workflow it no
   longer has (a manifest-listed copy, or a link or folder of links into the board's `agent/`, dangling or
   not) is removed and reported as removed (R-129).
2. Junk files (dotfiles such as `.DS_Store`, `__pycache__`) are never installed in either mode and never
   count against ownership: a board-linked or board-copied skill folder that gains a `.DS_Store` is still
   the board's (R-130, R-131).
3. Install and export share one junk rule (REQ-02.5).
4. The tracked `.claude/skills/svg-diagram/__pycache__` link is removed from the repo, and nothing the
   install produces in this repo is an untracked or dangling link (R-131).
5. **Safety rule (preserved).** A skill or workflow the board did not install (not in the manifest, not a
   link into the board) is never removed or replaced, and is reported as skipped.
6. Re-running the same install changes nothing and reports nothing removed. Switching mode (copy to link
   and back) leaves no entries of the other mode behind.
7. `installStatus` either reports a link-mode skill as current only when every installable source file is
   linked (and copy mode as today), or is removed with its test if nothing needs it (R-132; B14-Q4). If it
   stays, its notion of installable files is the same junk rule.
8. In this repo, running the install in the mode this repo uses leaves `git status -- .claude` clean.

### B14-REQ-11 · The install command the board shows keeps this repo's links (R-155)

1. Running the install command the About page shows, in this repo, leaves the tracked symlinks in place
   (no switch to copies, no git diff under `.claude/`). Candidate approaches: the install keeps the mode
   already in use unless told otherwise; or the About page shows the mode in use. A fresh repo with
   nothing installed still gets copies by default, as the kit's START-HERE and ADOPTING promise.
2. The About page, README, ADOPTING, `scripts/install-skills.ts`'s header and START-HERE agree on what the
   default does and how to choose a mode. ADOPTING's "a symlink per file" matches what link mode makes (it
   links each top-level entry of a skill folder, folders included).
3. The About page's "each skill … never commits" claim is corrected to what the skills do (run-build-phase
   commits when its kick-off prompt allows).
4. Preserved: `npm --prefix requirements-board run install-skills -- --link`, the command root `CLAUDE.md`
   documents, keeps working and keeps meaning link mode.

### B14-REQ-12 · Ports follow the worktree (R-148, R-157)

1. `artifact:steps` with no `--url` shoots the board of the worktree it runs in: it takes `BOARD_PORT`, filled
   from the worktree's `.lane.env` the same way the board's dev server fills it, defaulting to 5180. An
   explicit `--url` still wins (R-148).
2. The svg-diagram and add-artifact skills (body and "This repo"), and their starter "This repo" blocks,
   say the board's URL follows `BOARD_PORT` and `.lane.env`, without naming this project's lane ports in
   generic text.
3. The real-catalogue e2e board never uses 5181 or any of 5173, 5174, 5180; its port can be set from the
   environment, so a lane can move it (R-157). README, ADOPTING and add-artifact name the mechanism and the
   default, not a port that collides.
4. Preserved: the real-catalogue project stays opt-in and read-only, with its own history folder; the
   fixture project still runs on its own port with one worker.
5. Whether the fixture board's port also follows the environment is B14-Q3.

### B14-REQ-13 · README, START-HERE and About tell the truth after B01 to B13 (R-156, docs truth pass)

1. README's skill list names every shipped skill (run-build-phase included) and workflow.
2. README's Settings passage says what Settings edits (project name and accent, components, the status
   lists, voice) and that a hand-added `board` key is dropped on save, matching `server/catalogueApi.ts`.
   README `:48` and START-HERE `:139` stop saying Settings names the board.
3. The whole-file pass starts from the "Doc facts" list in each earlier phase's PROGRESS entry (and
   "Discovered for later" for anything a phase did not do). Each listed line is confirmed true against the
   code at B14's start; any doc line that describes changed behaviour but was not listed (for example
   README `:190-196` on serving and CSP after B01, the lane and route bullets after B05, sheet, conflict and
   Settings behaviour after B06) is corrected, or recorded as already true, with the file and line.
4. About page text stays in step with the skills (convention 4): each skill's description matches its
   SKILL.md after B12 and B13.
5. Visual changes to the About page, if any, follow `requirements-board/DESIGN.md`. This requirement
   expects copy changes only.

### B14-REQ-14 · `artifact:new` leaves the git index alone (B05-Q6 handoff)

If B05 did not already change it, `artifact:new` brings a tracked file into the catalogue without staging
anything (no `git mv`), so a run mid-phase never puts a change in the index that another session's commit
could sweep in (convention 9). The output still says the file moved and that links to its old place need
fixing. If B14 decides to keep `git mv`, it records why in its entry and the user accepts it.

### B14-REQ-15 · Preserved behaviour (all requirements)

- `kit:export` still swaps each skill's "This repo" block for its starter block and fails if one is
  missing; still fills START-HERE's version and loop diagram; still warns when CHANGELOG lacks the version.
- A scratch export passes its own leak check, and the staged kit passes its own catalogue check,
  typecheck and Vitest suite, as it does at HEAD.
- `tests/starter.test.ts`, `tests/skillInstall.test.ts` and `tests/captureFiles.test.ts` keep their current
  guarantees (they may grow).
- No catalogue content changes; `npm run check` stays green.
- Lanes keep working: the commands the live catch-up plan runs (capture with `--only` and `--dry`,
  `artifact:new`, `install-skills -- --link`, the board dev server on `BOARD_PORT`) behave as before or
  better.

## Dependencies and handoffs

**Inputs consumed** (files in PLAN's shared-files table, in serial order)
- **B02:** the D-02 answer, the delivered registry, the SCHEMA status lines B02 updated, and any minimal
  starter config change B02 made to keep `tests/starter.test.ts` green (`starter/` row: B02, B12, B14).
  B14 owns the final starter config and docs (REQ-05).
- **B05:** the D-05 answer (REQ-06) and its version of `scripts/new-artifact.ts` (R-67; B05-Q6 outcome)
  (`scripts/new-artifact.ts` row: B05, B14).
- **B11:** its version of `src/views/AboutView.tsx` (R-127 scrolling) (`AboutView.tsx` row: B11, B14).
- **B12:** its `scripts/capture.ts` change for R-139 (`capture.ts` row: B12, B14), its deny terms and
  starter placeholders (REQ-03.4 verifies them), and its SKILL.md text.
- **B13:** its versions of `scripts/apply-links.ts` and `scripts/link-index.ts` (row: B13, B14); B14 edits
  only their path handling (REQ-07.8).
- **B03:** its `.gitignore` lines (row: B03, B14); B14 adds only what R-131 needs, if anything.
- **All earlier phases:** the "Doc facts" in their PROGRESS entries, plus "Discovered for later" for
  anything not done (REQ-13.3). Server files touched under B14-Q1 (`catalogueFs.ts`, `artifactFiles.ts`,
  `cataloguePlugin.ts`) are taken as B01, B03, B05 and B07 left them.

**Outputs owned**
- Export guards and source rule, documented in README "Sharing the board" and ADOPTING.
- A path-resolution behaviour every board script shares.
- The port mechanism for `artifact:steps` and the real-catalogue e2e run, documented in README.
- An exact skill install and its docs.
- The final kit docs, starter and deny list.

**Integration proof owner:** B15 re-runs the kit export, the e2e suite on free ports and the docs truth
audit using B14's mechanisms (B15-REQ-20, -21). B14 proves its own findings below.

## Acceptance and evidence

Unconditional checks. Every proof must fail on the code before the fix and pass after it (convention 13):
an automated test where practical, otherwise a recorded manual check with commands and output, run once
before and once after, in IMPLEMENTATION.md or the PROGRESS entry. Doc read-throughs record the false line
found before and the corrected line after. Scratch folders only; never export into this repo or a real
adopting repo.

| Finding · REQ | Proof obligation |
|---|---|
| R-05 · REQ-01 | On scratch copies: export targets equal to the board, its parent (`--to ..` under `npm --prefix`), a folder inside the board, a folder holding a live board (catalogue not the starter, or `.history/`, `.links/` or `shots/` present), and a path spelled through a symlink are each refused, with the target byte-for-byte unchanged afterwards. A re-export into an untouched earlier kit succeeds and keeps its `node_modules` and other files. |
| R-31 · REQ-07, REQ-01 | From a scratch repo root under `npm --prefix`: `artifact:new` with a root-relative file path succeeds and registers it; `--mermaid` the same; `export:csv --out x` writes to `<root>/x`; `artifact:steps --out x` and `links:index x` write under the root; `links:apply <dir>` reads the root-relative folder; `kit:export --to kit-out` writes `<root>/kit-out`, never inside the board, and a second export does not nest. Direct `node scripts/…` runs from the board folder behave as before. Printed paths read correctly from the root. |
| R-39 · REQ-08 | A capture run (unit-level against the prune logic, or a dry fixture) where a recipe drops a shot that another item lists: the file stays, the summary names it as kept, and `check` passes. An unreferenced stale shot is still removed. |
| R-129 · REQ-10 | In a scratch repo: install, then remove or rename a skill and a workflow in the board's `agent/`, install again (copy mode, then link mode): the old entries are gone and reported; foreign skills are untouched. |
| R-130 · REQ-10 | A `.DS_Store` added to a linked and to a copied skill folder: the next install still treats the folder as the board's and refreshes it. |
| R-131 · REQ-10, REQ-02 | Neither install mode installs `__pycache__`; install and export use one junk rule (a test fails if they differ); `git ls-files .claude` no longer lists `svg-diagram/__pycache__`; in a fresh clone or worktree, `find .claude -xtype l` (or equivalent) finds no dangling link. |
| R-132 · REQ-10 | Either a test where a new source file is added to a linked skill and `installStatus` reports it not current; or `installStatus` and its test are gone, with no remaining caller. |
| R-134 · REQ-09 | `capture --only=ID` selects ID; `--only` last, `--only ""`, `--only --dry` and `--only ,` each exit non-zero before any shot, write or report. |
| R-148 · REQ-12 | With a scratch `.lane.env` setting `BOARD_PORT`, `artifact:steps` with no `--url` targets that port (observable in its output or a test of its URL choice); with none, 5180; `--url` overrides. Skill text and starter blocks updated; leak check passes. |
| R-149 · REQ-03, REQ-04 | The scratch kit's SCHEMA and notes README contain no "N here" status pins; the export fails when one is planted in a shipped doc (test or recorded manual run). |
| R-152 · REQ-04 | The scratch kit's `notes/README.md` and `changes/README.md` name no `AR-` IDs or repo paths outside the kit; the live notes README's data path exists. |
| R-153 · REQ-04 | Every `npm run` script and repo path named in the scratch kit's Markdown, HTML and `playwright.config.ts` exists in the kit, or the text says it lives only in the source board; a generic region sweep ships and runs against the kit's own starter catalogue; START-HERE lists run-build-phase. |
| R-154 · REQ-02, REQ-03 | An untracked file, and an ignored file, planted under the scratch board copy do not ship; the dirty-tree behaviour matches D-09; a deny term for each person in the project's voice patterns makes a planted mention fail the export. |
| R-155 · REQ-11 | In this repo (or a scratch copy with tracked links), running the command the About page shows leaves `git status -- .claude` clean; a fresh scratch repo gets copies by default; `-- --link` still links. About, README, ADOPTING, START-HERE and the install script header agree (recorded read-through). |
| R-156 · REQ-13 | Recorded read-through: README lists run-build-phase; the Settings passage, README `:48` and START-HERE `:139` match the code; each earlier phase's "Doc facts" line is confirmed, and each unlisted stale line found is corrected, with file and line. |
| B05-Q6 · REQ-14 | Unless B05 already did it: from a scratch git repo, `artifact:new` on a tracked file leaves `git diff --cached` empty (before the fix it shows a staged rename); otherwise the recorded, user-accepted reason. |
| B14-Q1 · REQ-07.7 | Per the answer: a relative `REQUIREMENTS_DIR` set when running `check` from a scratch repo root under `npm --prefix` reads the root-relative folder; or the docs state the board-folder rule and a recorded run matches them. |
| R-157 · REQ-12 | With the contract picker (or any listener) on 5181, `BOARD_E2E_REAL=1 npx playwright test` starts its real-catalogue board on a free, non-reserved port and runs; the port can be moved by environment. |

**Phase-level checks**
- A scratch kit export at the end of B14 passes its leak check, and the exported kit, with dependencies
  installed (or `node_modules` linked, recorded as such), passes its own `check`, typecheck and Vitest.
- `npm run verify:board` green; the touched Playwright specs pass on a free port.
- `git status -- .claude` clean after the install in this repo's mode.

**Criteria awaiting a decision**
- The exact refusal test for "earlier kit versus live board" and the dirty-tree behaviour: D-09.
- SCHEMA status text and starter config shape: D-02. SCHEMA ID text: D-05.
- Env-variable resolution: B14-Q1. Fixture port: B14-Q3. `installStatus` kept or removed: B14-Q4.
- Whether `artifact:new` still needs changing: B05's B05-Q6 outcome.

**Prohibited regressions**
- Any export that writes into or deletes from a folder holding a live board.
- Any change that makes the install remove or replace a skill the board did not install.
- Any change to catalogue content, or a red `npm run check`.
- Any lane command in the live plan that stops working.

## Deferred decisions for execution planning

Register: [PROGRESS.md](../../PROGRESS.md), "Deferred decisions".

**D-09 · Kit export source and refusal rules.** Owner: B14. Waits on it: none outside B14 (B15 tests the
answer). Resolve before: B14 builds REQ-01 and REQ-02. Affects: REQ-01.2, REQ-02, the R-05 and R-154 proofs,
README "Sharing the board", ADOPTING.
- *Source options.*
  - **Committed tree (HEAD).** Reproducible: a kit equals a commit, and the commit can be recorded in the
    kit. Nothing uncommitted can leak. The version bump and CHANGELOG entry must be committed before export,
    which matches the git rule that agents commit and the user pushes. A quick trial export of uncommitted
    work needs a flag or a throwaway commit.
  - **Index (tracked files, staged content).** No untracked files; but staged-but-uncommitted content ships,
    and the repo's rule is never to stage mid-phase, so the index is rarely a meaningful snapshot here.
  - **Working tree filtered by git (tracked plus untracked-not-ignored, or tracked only).** Closest to
    today; easy for trial exports. Tracked-only drops scratch files; "tracked plus untracked" still ships an
    untracked scratch note (the R-154 failure). Uncommitted edits to tracked files ship, so a warning or
    refusal on a dirty board folder is needed.
- *Refusal options.*
  - **Marker file.** Every export writes a marker (version, source, file list or hash) into the target
    board; a target whose board lacks a matching marker, or whose files differ from the marker's list, is
    refused. Precise; a hand-copied kit without a marker is refused until emptied.
  - **Content heuristic.** Refuse when the target board's catalogue differs from the starter, or
    `.history/`, `.links/` or `shots/` exist. No new file; may refuse a kit someone opened once (the board
    writes `.history/` when it runs).
  - **Git state of the target.** Refuse when the target is inside a git repository at all, or one with
    uncommitted changes. Simple; would refuse a staging folder that the user keeps under git.
  - Any choice keeps REQ-01.1 (never the running board, never inside or containing it) as a fixed safety
    rule, and should say whether a `--force` exists (consequence: a force flag reopens R-05 by typing).

**D-02 · Status registry (consumed).** Owner B02; resolved before B02 builds. B02 updates the SCHEMA
status lines it changes; B14 removes R-149's pins, owns the starter config and docs, and checks the rest in
its whole-file pass (REQ-05). Blocks: REQ-05 only.

**D-05 · ID reuse rule (consumed).** Owner B05, the user decides; resolved before B08 builds (accepted
decision 8). B14 writes SCHEMA's ID-reuse wording, the starter README and README Delete wording to match
(REQ-06). Blocks: REQ-06 only.

**B14-Q1 · Do folder-naming environment values resolve against the caller's folder?** Answered in part
(accepted decisions 5 and 10, 2026-11-18): the server environment-path sweep is B14's under touch rights,
whichever way it goes; only the choice remains. Source: the R-31 sweep found `REQUIREMENTS_DIR`,
`HISTORY_DIR` and `REPO_ROOT` resolved with `resolve()` in `server/catalogueFs.ts:18`,
`server/artifactFiles.ts:21,27`, `server/cataloguePlugin.ts:34` and `scripts/recode-statuses.ts:144`, so a
relative value means the board folder under `npm --prefix`. R-31's text covers arguments only. Affects
REQ-07.7. Owner: B14, with the user. Gate: B14 implementation planning, before REQ-07 builds. Options: leave
env values as they are and document that a relative value is relative to the board folder (no server code
change; the Playwright config already passes absolute paths); or resolve them against `INIT_CWD` as
arguments do (consistent; small edits in server files that B01, B03, B05 and B07 have finished with, named
in B14's entry). Does not block the argument fixes.

**B14-Q2 · Is there an upgrade path for an adopting repo?** Source: REQ-01 makes the export refuse a target
holding a live catalogue, which is also how an adopter might try to update their board's code. Affects
README and ADOPTING wording only. Owner: B14 with the user. Gate: B14 implementation planning, before the README and ADOPTING
edits. Options: document that adopters upgrade by
re-exporting to a staging folder and copying everything except `requirements/` (no new behaviour); or plan
an upgrade mode as later work in "Discovered for later". B14 does not build an upgrade mode.

**B14-Q3 · Should the fixture e2e board's port also follow the environment?** Source: verifying R-157,
`playwright.config.ts:29-31` fixes the fixture board at 5182, so two lanes running board e2e at once collide.
Not a finding (PROGRESS "Discovered for later", owner B14). Affects REQ-12.5. Owner: B14. Gate: B14
implementation planning, before REQ-12 builds. Options: make both e2e ports environment-settable now (small,
consistent with REQ-12.3); or leave 5182 fixed and record it for later.

**B14-Q4 · Keep and fix `installStatus`, or delete it?** Source: R-132. It has no caller except its test.
Affects REQ-10.7 and REQ-11.1 (one candidate for R-155 shows the mode in use on the About page, which would
need it, plus a server route the About page can read). Owner: B14. Gate: B14 implementation planning,
before REQ-10 and REQ-11 build. Options: fix it to check every
installable file and use it for mode detection; or delete it and its test and detect the mode inside the
install itself.

**B14-Q5 · Where do kit-neutral copies of shared format docs live?** Source: R-152, R-149. Affects REQ-04.
Owner: B14. Gate: B14 implementation planning, before REQ-04 builds. Options: starter copies of `notes/README.md` and `changes/README.md` (and possibly SCHEMA)
maintained beside the live ones (two copies to keep in step; a test could compare their shared parts); or
keep one shared copy each and make the live ones neutral (one copy; the live notes README loses its legacy
citation table, which this project's notes rely on, so that table would move to `requirements/README.md` or
a project note).

## Risks and recovery requirements

- **Destroying data while testing the export.** Every export proof uses scratch copies outside this repo
  and outside any real adopting repo. The real board is never a target, even to prove a refusal; prove
  refusals on a copy that mirrors it.
- **Breaking live lanes.** Lanes run `install-skills -- --link`, capture with `--only` and `--dry`,
  `artifact:new` and the board dev server through merges from master. All keep their meaning (REQ-07.6,
  REQ-09.4, REQ-11.4, REQ-15). Removing the tracked `__pycache__` link merges harmlessly into lanes.
- **Path change surprises.** A user who relied on paths being relative to the board folder (for example
  `node scripts/x.ts` run from the board folder) sees no change, because there `INIT_CWD` is unset or is the
  board folder. A nested npm call takes the outer script's folder as `INIT_CWD` (verified with npm
  11.19.1); docs say commands run from the repo root.
- **Install removes something it should not.** The ownership test (manifest or a link into the board's
  `agent/`) stays the only licence to remove; removing a stale entry needs the same proof of ownership as
  replacing one. A test covers a same-named foreign skill beside a removed board skill.
- **Capture keeps files forever.** Kept shared shots are reported each run, so a stale shared file is
  visible and can be removed by hand or by fixing the other item.
- **Leak check grows noisy.** New deny terms can match generic words; each term is anchored (word
  boundaries or case-sensitive entries) and the end-of-phase export must pass without exceptions.
- **Docs drift again.** Any export-time reference check (REQ-04.3 candidate) is the recovery net; if not
  built, the read-through is recorded with the files and lines checked.
- **Rollback.** Each requirement is separable; a faulty change is reverted by its own commit, and the kit
  is re-exported to scratch to confirm.

## Execution and handoff obligations

1. Read PROGRESS.md in full (conventions 1 to 14, accepted decisions, the "Doc facts" in every phase entry
   and "Discovered for later"), this SPEC, and FINDINGS.md for every owned finding. Confirm B02, B05, B11,
   B12 and B13 are COMPLETE (B12 and B13 merged to master) and that D-02 and D-05 are recorded.
2. Reconfirm the evidence at the then-current HEAD (lines will have moved after the earlier phases);
   record any finding that no longer reproduces, with evidence, and check B05's B05-Q6 outcome.
3. Resolve D-09 (with the user where the choice is theirs) and B14-Q1 to Q5, and record the answers in
   PROGRESS.md "Accepted decisions" before building the affected requirements.
4. Write `IMPLEMENTATION.md` in this folder before building: the approach for each requirement, the
   resolved decisions, execution bites, the checks per bite (each proof shown failing before its fix,
   convention 13) and the recovery plan.
5. Build in bites; keep `npm run verify:board` green; run touched Playwright specs on a free port (never
   5173, 5174, 5180 or 5181). Never stage mid-phase. Name every edit made in another phase's file under
   touch rights (convention 11).
6. Bump the board version in `requirements-board/package.json` and its lock file (minor: users and agents see
   new export refusals, install behaviour and capture rules) and add a CHANGELOG entry, before the final
   scratch export, so the kit carries the new version.
7. Run the three review lenses (quality and maintainability, completeness against this SPEC, bugs and
   correctness) with independent reviewers; verify their findings, fix confirmed ones and re-run the
   checks.
8. Give every owned finding one disposition: **Fixed** (with its test or recorded check), **Not reproducible
   at HEAD** (with evidence), **Won't fix** (user accepted, with the reason) or **Moved** (named owner,
   recorded in PROGRESS and in both SPECs).
9. Record the verified result last in PROGRESS.md: dispositions, decisions taken, the doc lines changed
   (listed under "Doc facts", convention 12), the edits made in other phases' files, the end-of-phase
   scratch export result, the port mechanism and export rules B15 must use, and anything discovered for
   later. Commit this phase's files by path on master (or a local branch merged back); never push.
