# Board fixes: high-level plan and build order

A remediation programme for the Requirements Board (`requirements-board/`), built with the
Buildbook method (`docs/BUILD-BOOK.md`). It fixes the 164 verified findings of the 18 November 2026
whole-codebase review, recorded in [FINDINGS.md](FINDINGS.md), and fixes five systemic causes at
the root rather than finding by finding.

## Purpose and outcome

The board is the single place where the requirements catalogue is read, edited and arranged, by a
person and by coding agents writing to the same files. The review found that it is broadly sound
but loses or misreads data in edge cases, can be crashed by bad data, has a handful of local-origin
security gaps, and has agent tools whose results drift from their documentation.

When the programme is complete:

1. **No write loses data it did not mean to change.** Saves carry only what the user changed,
   are checked against the file on disk, and edit YAML in place.
2. **A status means the same thing in every version of every file.** Status codes have a stable
   identity, recodes apply only to the versions before them, and a damaged list is an error, not a
   silent swap to defaults.
3. **Bad data becomes a visible issue, never a crash or a silent omission.**
4. **Each catalogue rule has one implementation**, used by the checker, the server and the viewer.
5. **History is right**: first-parent, rename-aware within bounds, safe for any filename and
   either hash width, and cached with limits.
6. **The local origin is closed**: nothing rendered from catalogue content can run script, and no
   other page or path spelling can reach the file API or raw files.
7. **Agent tools and docs tell the truth**, and the exported kit is generic, safe to export and
   runs.

Every finding ends with one recorded disposition: **Fixed** (with a regression test where one is
practical), **Not reproducible at HEAD** (with evidence), **Won't fix** (user accepted, with a
reason), or **Moved** (to a named owner).

## Sources

- [FINDINGS.md](FINDINGS.md): the 164 findings (R-01 to R-164), the five systemic issues, and the
  10 refuted findings (A-1 to A-10). Each finding gives locations, mechanism, a failure scenario, a
  proposed fix and verifier evidence. Proposed fixes are evidence and options, not mandates.
- `requirements-board/`: the code at d4341735 (board 1.12.3); `DESIGN.md`, `CHANGELOG.md`,
  `README.md`, `ADOPTING.md`, `requirements/SCHEMA.md`, the About page (`src/views/AboutView.tsx`).
- Root `CLAUDE.md`: the board's place in the repo, the kit and export rules, finish green, git rules.
- `docs/prototype-build/catch-up/` (`plan.config.json`, `LANES.md`): the live build plan that
  depends on the agent tools in B12.

## Binding constraints (every phase)

- **Existing stack.** Vite + React 18 + zustand + @xyflow/react, TypeScript, Node >= 22.18 running
  `.ts` scripts directly, Vitest and Playwright. No new framework; new dependencies only with a
  recorded reason.
- **Board conventions.** Visual changes follow `requirements-board/DESIGN.md`. The board code,
  scripts and skills stay project-generic (project facts only in `requirements/board.config.json`,
  `requirements/capture/` and each skill's "This repo" block). The About page stays in step with
  the skills. Each phase bumps the board version in `package.json` (and the lock file) and adds a
  `CHANGELOG.md` entry.
- **Finish green.** `npm run verify:board` from the repo root (typecheck, Vitest, catalogue check)
  passes at the end of every phase. Playwright specs touched by a phase pass; run them on a free port.
- **Catalogue data.** Fixes do not change requirement content. A data migration (for example a
  status registry) must leave `npm run check` green and must be reviewed by the user before it runs
  on the real catalogue.
- **Live agents.** Build lanes run in other worktrees (`-laneA`, `-laneB`, `-U2`, `-U3`) and use the
  B12 tools through merges from master, so B12's fixes reach them only when `board-fixes` merges
  into master (convention 16). Tool changes stay backward compatible with the in-flight
  catch-up plan and its phase docs, or ship with a migration the plan's owner accepts.
- **Git.** All programme work goes on the local branch `board-fixes`, in its own worktree
  (`AnaesthesiaAssociatesRFP-board`), never on master; it merges into master after B15 or when the
  owner asks (PROGRESS convention 16). Commit and merge, never push. Stage by
  path at commit time only; never stage mid-phase (use `mv`/`rm`, not `git mv`/`git rm`), because
  other sessions' commits sweep in staged changes.
- **Ports.** Do not take 5180 (board), 5173/5174 (prototype) or 5181 (contract picker) for tests;
  lanes take ports from `.lane.env`.
- **Touch rights.** The phase that owns a finding delivers its whole fix. Where that fix needs a
  minimal edit in a file another phase owns, the owner phase makes it, keeps it to what the fix
  needs, and names it in its PROGRESS entry; the file's owner builds on it later. The shared-files
  table lists the overlaps known at planning time; it is a guide, not a fence.
- **Doc lines.** A phase updates the lines of `README.md`, `requirements/SCHEMA.md`, the About page,
  `DESIGN.md` and any SKILL.md that describe behaviour it changes, and lists them in its PROGRESS
  entry under "Doc facts". B14 then does the whole-file truth pass.
- **Agent-tool tests.** Until B12 adds them to `verify:board`, phases that touch `agent/` also run the
  tools' `node --test` suites.

## Phases

| Phase | Outcome | Owns findings | Depends on |
|---|---|---|---|
| **B01** Origin security | Catalogue content cannot run script or reach other hosts from the board's origin; no other page, path spelling or symlink reaches the file API or raw files | R-03, R-04, R-22, R-35, R-36, R-63, R-102 (7) | none |
| **B02** Status identity | Status codes have stable identity and history; recodes are dated, total and safe; a damaged list is an error | R-01 (board and server half; B06 closes), R-06, R-07 (board half; B12 closes), R-30, R-44, R-46, R-68 (7); adjudicates A-2 | none |
| **B03** Load resilience | Bad data or a missing file becomes an issue, never a crash or silent omission; an error boundary protects the app; owns the issue surface (ProblemPill) | R-10, R-11, R-47, R-48, R-49, R-50, R-51, R-52, R-53, R-65, R-66, R-121, R-122, R-160 (14) | B01 (`artifactFiles.ts` real-path rule) |
| **B04** One rule, one helper | Code masking, heading slugs and text, mermaid ids, spot parsing and validation, NFC, selectors and lint each have one shared implementation | R-27, R-28, R-38, R-60, R-61, R-62, R-75 to R-85, R-101 (18) | B03 (`shared/artifacts.ts`) |
| **B08** Git history reader | One shared git reader gives correct history for any filename, merge shape, rename or deletion pattern and hash width, with bounded caches; owns cutting history at a deletion | R-23, R-24, R-69 to R-74, R-161, R-162 (10) | B03 (`historyJournal.ts`) |
| **B05** Server write model | Writes are field-level, checked against disk, and edit YAML in place; multi-file writes are all-or-nothing; ID allocation matches the rule chosen in D-05; owns the client API transport (`src/api.ts`) | R-26, R-37, R-54, R-55, R-56, R-64, R-67 (7); plus the server halves of R-45 and R-111 (B06 closes) | B02, B03, B04, B08 |
| **B07** Store sync and layout | Live updates and layout saves stay ordered and complete; bursts of file events cost one re-sync, one delivery and one render; owns the `catalogue:changed` event shape and the asset version and change signal (D-10) | R-40, R-57, R-58, R-59, R-158, R-159 (6) | B05 |
| **B06** Edit sheets and Settings | Sheets, drafts, the artifact details form and Settings never drop or resurrect edits, never save unchanged or fallback data, keep focus correct, and render B02's damaged-list lock-out; owns the leave guard (`src/nav.ts`) | R-02, R-12, R-41, R-42, R-43, R-45, R-107 to R-112, R-123, R-124, R-125 (15); closes R-01 (lock-out UI; B02 owns the board half) | B05, B07, B02, B03 |
| **B09** Diff and history UI | Diffs and timelines show what really changed, with stable keys and clean scroll behaviour | R-25, R-32, R-87 to R-97 (13) | B08, B07 (D-10) |
| **B10** Artifact viewers | Viewers release what they open, show current regions and images, and report failures truthfully | R-13, R-33, R-98, R-99, R-100, R-103 to R-106, R-163 (10), plus the HistoryView screenshot failure label (found while authoring B09) | B01, B03, B04, B07 (D-10) |
| **B11** Board canvas and views | The canvas, Outline, Questions and About always show the open card and every live card, and keyboard paths behave | R-29, R-86, R-113 to R-120, R-126, R-127, R-128 (13) | B03, B05, B07 |
| **B12** Build-plan tools | run-build-phase and update-build-plan tools match their skills, see lane-built work, follow B02's status rule, carry no project vocabulary in generic code, and are tested by `verify:board` | R-14 to R-19, R-07 (plan-tool half), R-135 to R-139, R-150, R-151, R-164 (15, R-07 shared with B02); adjudicates and fixes A-4, A-10 | B02 (status rule); keep compatible with the live plan |
| **B13** Consistency and linking tools | Review, apply and link tools are path-safe, keep decisions and questions, and agree with the board's rules | R-08, R-09, R-20, R-21, R-34, R-133, R-140 to R-147 (14) | B04 for B13-REQ-07b only (D-03) |
| **B14** Scripts, kit and docs | Scripts guard destructive steps and resolve paths correctly everywhere; skill install is exact; the kit is generic, built from a source that cannot pick up stray uncommitted files (D-09), and documented truthfully | R-05, R-31 (sweep across all scripts), R-39, R-129 to R-132, R-134, R-148, R-149, R-152 to R-157 (16) | B02, B05, B11, B12, B13 |
| **B15** Closing audit | Every finding has a verified disposition; a fresh review finds no regressions; docs, version and kit are true | programme coverage; confirms A-1 to A-10 | all |

All 164 findings have exactly one owner (checked mechanically). R-07 and R-54 have one owner each
with a delivery split stated here: R-07's board half is B02 and its plan-tool half is B12 (B12
closes R-07); R-54's ID rule and journal handling are B05, and the history cut it needs is B08's
deletion bound (B05 closes R-54). Other split deliveries: R-01's board and server half is B02 and
its lock-out UI is B06 (B06 closes R-01); R-45's and R-111's server halves are B05 (B06 closes
both); R-56 is wholly B05, including switching the store's `renameLane` and `deleteLane` to the
one-write request; R-68's allocation rule is B02, including the minimal Settings call-site edit;
R-119's lane merge is B11, which extends B05's lane route under touch rights and keeps its
all-or-nothing guarantee.

## Territory and exclusions

- **B01** owns the request guard, static-file, `fs.deny` and symlink rules in
  `server/cataloguePlugin.ts` and `server/artifactFiles.ts` (path resolution only), the Vite server
  options in `vite.config.ts`, ID path decoding in `server/catalogueApi.ts`, and
  `src/artifacts/sanitise.ts` plus link interception in `CanvasViewer`. Excludes `apply.mjs` path
  safety (B13), the watcher (B07), artifact load isolation in `artifactFiles.ts` (B03, which reuses
  B01's real-path rule).
- **B02** owns the status model in `shared/statuses.ts` (including the code-allocation rule), the
  recode script, CSV status output, the store's status filter persistence, the server's status
  in-use guard and status-write refusal while the list is damaged, the registry format in
  `board.config.json` and its migration, and keeping `tests/starter.test.ts` green if the config
  format changes. B06 renders the lock-out UI from B02's damaged state. B12 applies B02's rule in
  the plan tools. B02 updates the SCHEMA lines that state the rules it changes (convention 12); B14
  owns R-149 (the project's status numbers pinned in the kit's SCHEMA), the starter config and docs,
  and the whole-file pass.
- **B03** owns the shared error boundary, the issue surface (`ProblemPill` and D-06), cycle-safe
  tree walks everywhere they occur (store, `shared/remove.ts`, Outline, Freeform placement of cycle
  members), safe type lookups (`canParent`, labels, `ItemModal`'s type use), per-file load isolation
  (`catalogueFs.ts`, `artifactFiles.ts`, `historyJournal.ts`), parse robustness (BOM, dotfiles,
  entities, U+0130 find, viewed-store JSON, layout entries, and shape validation in the shared
  browser-storage reader so every store rejects valid JSON of the wrong shape), cached PDF facts, listing cards with
  unknown statuses or broken parents in Questions and Outline, and naming parent cycles in the check.
  Excludes Mapped-layout visibility (B11).
- **B04** owns shared text rules in `shared/links.ts`, `shared/remove.ts` (unlink and mentions),
  `shared/sources.ts`, `shared/artifacts.ts` (rules), `shared/check.ts` (rules) and the lint in
  `shared/files.ts`, the client consumers (`src/artifactIndex.ts` text joins, heading slugs in
  `MarkdownReader`, NFC in `regionsDom`), and the helper agent tools use (D-03). Excludes
  `ref-kit.mjs` (B13) and `linkProposals.ts` (B13, which adopts B04's helper).
- **B08** owns `server/gitHistory.ts`, `server/gitRenames.ts`, the git-reading side of
  `server/catalogueDiff.ts`, history hashing in `historyJournal.ts`, the reader contract (D-07),
  and cutting history at a rename or deletion bound. It may add optional fields to
  `shared/history.ts` for B09. It investigates index-lock contention in lane worktrees
  (`git status`), recorded under "Discovered for later".
- **B05** owns the write routes and their semantics in `server/catalogueApi.ts` (items, questions,
  artifacts, config including statuses and components, lanes, layout), atomic create, in-place YAML
  edits, ID allocation and its journal handling (D-05), one-write lane rename and lane delete, the
  Freeform lane-list rule, one check per batch, `artifact:new` ID claiming, and the client
  transport in `src/api.ts` (D-04). It updates the `cited_as` lint wording once R-37 is fixed.
  Excludes client save flows (B06, B07) and the event shape (B07).
- **B07** owns the store's live-update path and layout save queue (`src/store.ts`, `src/App.tsx`,
  `src/useCatalogueRefresh.ts`), `syncFromDisk` and event sending in `catalogueApi.ts`, watcher
  batching in `cataloguePlugin.ts`, the `catalogue:changed` event shape, node reuse in `graph.ts`
  and `BoardView` where its render bound needs it, and the asset version and change signal (D-10)
  that B09 (R-96) and B10 (R-104) consume.
- **B06** owns `useEditableRecord`, the edit sheets (`ItemModal`, `QuestionModal`, `EditChrome`,
  `Sheet`, `NewCardButton`), draft and save flows in `ArtifactPage` and the artifact details form in
  `ArtifactPanel`, the leave guard in `src/nav.ts`, `SettingsView`, and the store's save actions it
  consumes. If B06-Q4 extends the lock-out to components and project, B06 adds the per-field damage
  signal in `shared/config.ts` itself under touch rights.
- **B09** owns `shared/proseDiff.ts`, `shared/history.ts`, `shared/textCompare.ts`,
  `shared/diffModel.ts`, `src/diff/*`, `HistoryView`, and first-sight journal records for R-87.
- **B10** owns `src/artifacts/*` (except `sanitise.ts` and the B04 helper adoption), `Screenshots`,
  `CardFind`, `ArtifactsView`, filter prefs in `src/artifactIndex.ts`, its own `.lightbox` styles,
  and the screenshot failure label in `HistoryView`.
- **B11** owns `src/board/*`, `BoardView`, `planMove` in `shared/move.ts`, lane merge and collapse
  state in the store, `OutlineView` twisty and search behaviour, `AboutView` scrolling and
  `QuestionsView` owner filter.
- **B12** owns `agent/skills/run-build-phase/` and `agent/skills/update-build-plan/` (tools and
  SKILL.md text), adding the agent-tool test suites to `verify:board`, the R-139 fix in
  `scripts/capture.ts`, and the deny terms and starter "This repo" placeholders R-150 needs. Keys
  for the live `plan.config.json` are proposed to the plan's owner, not written by B12.
- **B13** owns `agent/skills/consistency-review/`, `agent/workflows/*.js`, `scripts/apply-links.ts`,
  `scripts/linkProposals.ts`, `scripts/link-index.ts`, and the sentences of other SKILL.md files
  that describe these tools.
- **B14** owns the other `scripts/` and the R-31 path sweep across every script (including
  `link-index.ts` after B13) and the server's environment paths, `server/skillInstall.ts`, kit docs (R-149's status numbers and the ID-reuse wording in SCHEMA,
  `requirements/notes/README.md`, `README.md`, `ADOPTING.md`, About install text, skill docs that
  point at stripped files), `starter/`, `.gitignore`, `playwright.config.ts` ports, the svg-diagram
  port note, and the whole-file docs truth pass.
- **B15** owns the closing audit and the final truth pass; it builds no new behaviour beyond small
  confirmed regressions. It may mark the programme closed in `PLAN.md`, `index.html` and
  `PROGRESS.md`.
- **Shared by all:** `shared/types.ts` (additive changes), `src/styles.css` (each phase edits only
  its own selectors), `CHANGELOG.md` and `package.json` version (one entry and bump per phase).

## Shared files and sequencing

App phases run one at a time, in the serial order below. Where two phases edit one file, the
earlier phase's shape is the later phase's input.

| File | Phases, in serial order |
|---|---|
| `server/catalogueApi.ts` | B01 (ID decoding), B02 (status guard), B03 (load isolation), B08 (history routes, if signatures change), B05 (write routes), B07 (sync, events), B11 (lane merge) |
| `server/cataloguePlugin.ts` | B01 (guards), B08 (if needed), B07 (watcher) |
| `server/artifactFiles.ts` | B01 (real paths), B03 (load isolation, PDF facts) |
| `server/catalogueFs.ts` | B03 (load isolation, dotfiles, layout), B05 (atomic create), B07 (read helpers for incremental re-sync) |
| `shared/config.ts` | B02 (status list parsing and damage state), B06 (per-field signal, only if B06-Q4 says so) |
| `src/components/ProblemPill.tsx` | B03 (issue surface), B07 (message text) |
| `src/components/HistoryView.tsx` | B09, B10 (screenshot failure label) |
| `server/historyJournal.ts` | B03 (unstat-able entries), B08 (hashing), B05 (ID reuse), B07 (sync), B09 (first sight) |
| `server/catalogueDiff.ts` | B02 (only if D-02 scopes recodes by commit), B08 (git reading), B09 (R-91 data) |
| `shared/files.ts` | B03 (BOM), B04 (lint), B05 (in-place YAML, lint wording) |
| `shared/artifacts.ts` | B03 (entities), B04 (rules) |
| `shared/check.ts` | B03 (cycles), B04 (rules), B05 (lane list), B06 (components) |
| `shared/history.ts` | B08 (optional fields), B05 (ID reuse), B09 |
| `shared/move.ts` | B03 (`canParent`), B11 (`planMove`) |
| `shared/remove.ts` | B03 (`descendantsOf`), B04 (`unlink`/`mentions`) |
| `src/store.ts` | B02 (status filter), B03 (`descendantsOf`, shared browser-storage reader; keeps B02's no-prune rule for the status filter), B05 (lane rename), B07 (sync, layout), B06 (save actions), B11 (lanes) |
| `src/api.ts` | B05 (transport), B07, B06 |
| `src/App.tsx` | B03 (error boundary), B07 |
| `src/views/BoardView.tsx`, `src/board/graph.ts`, `src/board/autoLayout.ts` | B03 (boundary, cycles), B07 (node reuse), B11 |
| `src/components/ItemModal.tsx` | B03 (unknown type), B06 |
| `src/views/SettingsView.tsx` | B02 (state it reads), B06 (UI and saves) |
| `src/views/OutlineView.tsx`, `src/views/QuestionsView.tsx`, `src/questionWalk.ts` | B03 (list everything), B11 |
| `src/views/AboutView.tsx` | B11 (scrolling), B14 (install text, truth pass) |
| `src/artifactIndex.ts` | B03 (shared browser-storage reader), B04 (text joins), B10 (filter prefs, built on B03's reader) |
| `src/artifacts/MarkdownReader.tsx` | B04 (slugs), B10 (region refresh) |
| `src/artifacts/CanvasViewer.tsx` | B01 (link interception), B10 (placement key) |
| `src/artifacts/ArtifactPanel.tsx` | B06 (details form), B10 |
| `src/artifacts/find.ts` | B03 (U+0130), B10 |
| `src/diff/viewedStore.ts` | B03 (bad JSON), B09 (cross-tab) |
| `scripts/new-artifact.ts` | B05 (ID claiming), B14 (paths) |
| `scripts/capture.ts` | B12 (R-139), B14 (R-39, R-134) |
| `scripts/apply-links.ts`, `scripts/link-index.ts` | B13 (R-08), B14 (paths) |
| `starter/`, `starter/deny.txt` | B02 (keep starter tests green), B12 (deny terms), B14 |
| `.gitignore` | B03 (PDF facts cache), B14 |

## Build order

```text
Serial (app):  B01 → B02 → B03 → B04 → B08 → B05 → B07 → B06 → B09 → B10 → B11 → B14 → B15
Agent tools:   B12 (after B02)   B13 (REQ-07b after B04)   in parallel worktrees, before B14
```

B08 moves ahead of B05 so that B05's ID-reuse fix can use B08's deletion bound. B07 goes before B06
so that sheet conflict handling is built on the final live-update path and event shape. B14 comes
after B11, B12 and B13 so that its docs truth pass covers their changes.

**Safe in parallel:** B12 and B13 with any app phase, each in its own worktree and with its own
ports, except that B12 waits for B02 (status rule) and B13-REQ-07b waits for B04 (D-03). No two app
phases run at once.

**Planning-only gates.** Two decisions are needed before the phase that owns them builds, so they
are settled in a short planning conversation of the owning phase ahead of time:
- **D-05** (with B05-Q2 and B05-Q3) is settled in a B05 planning conversation **before B08 builds**,
  because B08's deletion bound must fit the ID rule.
- **D-03** is settled in a B04 planning conversation **before B12 builds**, if B12 needs to share
  `shared/statuses.ts` (it does not if D-02 chooses the no-overlap rule), and before B13-REQ-07b.

**Version numbers in worktree phases.** B12 and B13 pick their board version at merge time:
`board-fixes`' current version plus their bump, with their CHANGELOG entry placed above the newest one.
They resolve the lock file by re-running `npm install` in the board folder, and B12's `verify`
script edit is merged by hand.

## Deferred decisions

Owned decisions are resolved in the owner's implementation-planning conversation, with the user
where needed, and recorded in [PROGRESS.md](PROGRESS.md) before dependent work builds. Each phase
SPEC also records its own questions (`Bnn-Qn`); the ledger links to them.

| ID | Question | Owner | Waits on it | Resolve before |
|---|---|---|---|---|
| D-01 | Origin security model: Vite `fs.deny` versus path normalisation; CORS policy; CSP on inline and raw SVG; whether write routes need a per-session token | B01 | B10 (link handling) | B01 build |
| D-02 | Status registry: where the high-water mark and removed codes live, how a recode records the versions it applies to, and how the existing config and journal migrate; must stay readable by the plan tools (`status-recodes.json` array, live `statuses` entries) | B02 | B06, B12, B14 | B02 build |
| D-03 | Shared helpers for agent `.mjs` tools: import `shared/*.ts` directly (shown on Node 24, untested on the 22.18 minimum) or mirrored copies with parity tests; covers the note-cite resolution rule, not only the slug | B04 | B13 (REQ-07b), B12 | B04 build, and before B12 builds if B12 needs it |
| D-04 | Write protocol: field patch plus base rev merged on the server, or full record with a three-way merge; conflict reply shape; whether in-place YAML applies to items as well as artifacts; covers config writes | B05 | B06, B07 | B05 build |
| D-05 | ID reuse: SCHEMA says IDs are never reused, but reuse is deliberate, documented and tested (A-1, R-54). Which is the rule? Settled with B05-Q2 and B05-Q3 (restore versus reuse) | B05 (user decides) | B08 (deletion bound), B14 (SCHEMA text) | **B08 build** (planning-only gate) |
| D-06 | Issue surface for bad data: recovery panel, problem pill or both; how a crash caught by the error boundary is reported and recovered | B03 | B06, B10, B11 | B03 build |
| D-07 | Git reader contract: cache key and bounds, SHA-256, unstaged moves, deletion and rename bounds | B08 | B05, B09 | B08 build |
| D-08 | Lane-aware plan state: how update-build-plan on master learns which phases lanes have built | B12 (with the plan's owner) | catch-up lanes | B12 build |
| D-09 | Kit export source and guards: committed tree, index or filtered working tree; what makes a target refusable | B14 | none | B14 build |
| D-10 | Asset version and change signal: what tells the client a screenshot or asset changed, and the version token in its URL | B07 | B09 (R-96), B10 (R-104) | B07 build |

## Proof and integration

- Each phase proves its own findings: a failing-then-passing test for every fixable finding where a
  unit or e2e test is practical, otherwise a recorded manual check.
- Each phase runs the three Buildbook review lenses (quality, completeness against its SPEC,
  correctness), fixes confirmed findings and records the result.
- **B15** owns integration proof: a fresh review of the board against FINDINGS.md, `verify:board`
  (now including agent-tool tests), the board e2e suite on a free port, a kit export to a scratch
  folder outside any repo that passes its own check, and a docs truth check.

## Folder

```text
docs/board-fixes/
  FINDINGS.md   PLAN.md   PROGRESS.md   index.html
  phases/B01-origin-security/SPEC.md  ...  phases/B15-closing-audit/SPEC.md
  review/INTEGRATION.md   review/REQUIREMENTS.md
```
