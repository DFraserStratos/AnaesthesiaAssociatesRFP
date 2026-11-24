# Requirements Board review: verified findings

Source of truth for the board-fixes Buildbook. Produced on 2026-11-18 by a whole-codebase review workflow (39 finders, severity-scaled adversarial verification, 347 agents) against master at d4341735 (board 1.12.3). Paths are relative to `requirements-board/` unless they start with `docs/` or `.claude/`. Finding IDs (R-nn) are stable; phase specifications cite them.


Scope: `requirements-board/` (server, shared, src, scripts, agent skills and workflows, docs). Review date 2026-11-18.

182 findings survived adversarial verification. After merging duplicates they make **164 findings**: **33 medium** and **131 low**. Severities are the verifiers' corrected ones (`final_severity`). Most findings first proposed as "high" were marked down to medium or low, because the board is a local dev tool and many failures need bad data or unusual timing. No finding is rated high after verification. 10 findings were refuted and are listed in the appendix.

All paths are relative to `requirements-board/` unless they start with `docs/` or `.claude/`.

## The five systemic issues

Fixing these at the root would clear about 70 of the 164 findings.

1. **Writes rebuild whole records from a stale or lossy model, with no check against the copy on disk.** The artifact PUT re-serialises the sidecar from the parsed model. "Keep mine" sends the whole stale draft. Settings sends whole status and component lists without a base rev, and it can send a built-in fallback list as if it were the project's own. Layout flushes overlap, and a lane rename is two separate writes. *Root fix:* send field-level patches with a base rev and let the server merge them onto the file as it is on disk (`/api/items/batch` already works this way). Edit YAML in place with yaml's Document API. Refuse to save anything derived from a fallback. Clears R-01, R-02, R-37, R-38, R-41, R-45, R-56, R-59, R-111.
2. **Status codes have no stable identity or history.** They are bare numbers. If one entry in a status list is bad, the whole list falls back to defaults whose numbers mean different things. Recodes run over every version whatever its date, a renumber can merge two statuses, and a freed number is handed out again. *Root fix:* a status registry in board.config.json with a high-water mark and tombstones. Record the commit of each recode and apply it only to older versions. Refuse overlapping or partial numeric maps. Treat an unparseable list as an error state, never as the defaults. Clears R-01, R-06, R-07, R-30, R-44, R-46, R-68, R-149.
3. **The card, sidecar, screenshot and asset history readers skip the careful git handling that catalogueDiff uses.** They log without `--first-parent`, without `-z` and without time bounds on renames. They miss renames made with plain `mv`, assume SHA-1, and hash raw bytes rather than git's clean form. Their caches have no bound and no shared promise. *Root fix:* one shared log reader in server/ with `--first-parent --diff-merges=first-parent -z`, rename segments bounded by commit, `git hash-object --stdin-paths` for the working tree, both hash widths, and a promise-cached LRU keyed on HEAD plus index. Clears R-23, R-24, R-54, R-69 to R-74, R-161, R-162.
4. **The same rule is coded twice and the copies disagree.** Pairs that differ: check versus viewer, `unlink` versus `mentions`, server slugs versus slugs from the rendered DOM, ref-kit versus the board's `slugify`, and spot validation in `sources.ts` versus `check.ts regionExists`. *Root fix:* one exported helper per concept, used by both sides. That means code masking, heading slugs and heading text taken from the source, spot existence, and NFC on both sides of a comparison. Clears R-27, R-28, R-60, R-61, R-62, R-75, R-76, R-77, R-83, R-101, R-141.
5. **Bad data or a missing file crashes or misleads, where it should become an issue.** Tree walks lack cycle guards. Lookups by type have no default. Whole-catalogue loads throw because of one file. Requests fall through to Vite's SPA fallback. React has no error boundary. *Root fix:* add an ErrorBoundary around the board and the sheets, a visited set in every tree walk, and a try/catch per record in loadCatalogue and artifactInfo. Validate on read and report problems as issues. Answer misses with 404 rather than `next()`. Clears R-10, R-11, R-22, R-29, R-47 to R-53, R-63, R-65, R-66, R-113, R-121, R-122.

## Other themes

- **Security (local origin):** R-03, R-04, R-22, R-34, R-35, R-36. The dev server is also the read/write file API, so any script that runs in its origin can delete catalogue files.
- **Kit export and portability:** R-05, R-31, R-149 to R-157. The export can wipe a live board, relative paths resolve against the wrong folder, and project facts and stale paths ship in the "generic" kit.
- **Build-plan and phase-runner tools:** R-14 to R-19, R-135 to R-139.
- **Consistency review and linking:** R-08, R-09, R-20, R-21, R-133, R-140 to R-147.
- **Performance:** R-13, R-25, R-26, R-158 to R-164.
- **Sheet, board and diff UI state:** R-12, R-32, R-33, R-40 to R-43, R-87 to R-128.

## Ranked summary

| ID | Sev | Title | Location |
|---|---|---|---|
| R-01 | Medium | One bad status entry swaps in default statuses with different meanings, and a Settings save then overwrites the real list | shared/statuses.ts:124 |
| R-02 | Medium | "Keep mine" writes back the whole stale draft, undoing concurrent moves and agent-added fields | src/components/useEditableRecord.ts:150 |
| R-03 | Medium | SVG sanitiser keeps a javascript: link whose XLink prefix is not literally `xlink` | src/artifacts/sanitise.ts:33 |
| R-04 | Medium | Percent-encoded or upper-case `/requirements/` path skips the guard, so Vite serves raw SVG with no CSP | server/cataloguePlugin.ts:122 |
| R-05 | Medium | `kit:export` wipes a live board when the target is this repo or an adopting repo | scripts/export-kit.ts:118 |
| R-06 | Medium | `statuses:recode` silently merges two statuses when a numeric renumber omits one pair | scripts/recode-statuses.ts:69 |
| R-07 | Medium | Recodes are applied to versions saved after them, so renumbering misreads current statuses | shared/statuses.ts:195 |
| R-08 | Medium | `links:apply` re-applies every old verified proposal, restoring links the user removed | scripts/apply-links.ts:21 |
| R-09 | Medium | Review page reloads stale decisions onto renumbered change ids for the same baseline | agent/skills/consistency-review/scripts/build-review.mjs:257 |
| R-10 | Medium | `descendantsOf` has no cycle guard, so opening a self-parented card white-screens the board | src/store.ts:607 |
| R-11 | Medium | `canParent` throws on an unknown item type and crashes the Mapped board | shared/move.ts:52 |
| R-12 | Medium | Artifact page drops an unsaved panel edit when the artifact vanishes, and the stuck draft keeps the leave prompt on | src/views/ArtifactPage.tsx:32 |
| R-13 | Medium | pdf.js documents are never destroyed: one leaked Web Worker per PDF view or thumbnail | src/artifacts/PdfReader.tsx:39 |
| R-14 | Medium | An IN PROGRESS phase with its session-1 entry counts as built, so plan updates freeze it | agent/skills/update-build-plan/tools/config.mjs:178 |
| R-15 | Medium | `phase-check --failed` forgets the full gate's failures after any `--changed` or `--only` run | agent/skills/run-build-phase/tools/phase-check.mjs:395 |
| R-16 | Medium | A story moved out of an out-of-scope lane counts as cosmetic and drops out of the plan | agent/skills/update-build-plan/tools/req-changes.mjs:83 |
| R-17 | Medium | With build lanes, plan updates on master treat lane-built phases as unbuilt | agent/skills/update-build-plan/SKILL.md:310 |
| R-18 | Medium | Fresh-plan remake maps a reused phase number to the old plan's doc path | agent/skills/update-build-plan/tools/apply-plan-update.mjs:49 |
| R-19 | Medium | `parseRunOrder` expands `U1 to U6` over catch-up phases, pulling 25a into U6's step | agent/skills/run-build-phase/tools/phase-context.mjs:372 |
| R-20 | Medium | Verifier-raised questions are lost (`proposedQuestions` is never used) | agent/skills/consistency-review/scripts/build-review.mjs:42 |
| R-21 | Medium | Every edit-less change is labelled "needs redrawing", including protected-artifact flags | agent/skills/consistency-review/scripts/build-review.mjs:113 |
| R-22 | Medium | A missing artifact file or history blob is served as the SPA's index.html with status 200 | server/cataloguePlugin.ts:131 |
| R-23 | Medium | Card and artifact history diffs neighbouring log entries (not first-parent), so merges show false reverts | server/gitHistory.ts:138 |
| R-24 | Medium | History readers parse git output without `-z`, so non-ASCII paths get no history | server/gitHistory.ts:246 |
| R-25 | Medium | LCS caps without prefix/suffix trimming: long documents show every block edited, and long paragraphs show as rewritten | shared/proseDiff.ts:174 |
| R-26 | Medium | Batch and delete writes run a full catalogue check and broadcast issues once per record | server/catalogueApi.ts:416 |
| R-27 | Medium | `mermaidNodeIds` loses `B` in `A --> B[Label]`, so the check falsely errors on node= anchors | shared/artifacts.ts:168 |
| R-28 | Medium | Markdown heading slugs are recomputed from rendered text, where record IDs show as titles | src/artifacts/MarkdownReader.tsx:80 |
| R-29 | Medium | Mapped drops every child of an orphaned feature, from the board and from search | src/board/mappedLayout.ts:129 |
| R-30 | Medium | CSV export writes the bare status code, not the label | shared/csv.ts:57 |
| R-31 | Medium | Relative path arguments resolve against the board folder under `npm --prefix` | scripts/new-artifact.ts:70 |
| R-32 | Medium | `land()` leaves scrollend listeners and rAF loops alive and uncancelled, which yank the reader back | src/diff/scroll.ts:25 |
| R-33 | Medium | Card find re-scrolls to the current match on every DOM change in the card | src/components/CardFind.tsx:67 |
| R-34 | Low | Consistency-review `apply.mjs` writes LLM-proposed edits to any path | agent/skills/consistency-review/scripts/apply.mjs:22 |
| R-35 | Low | Asset and artifact routes follow symlinks out of the repository | server/cataloguePlugin.ts:287 |
| R-36 | Low | Vite's default CORS lets any localhost page read the whole catalogue | vite.config.ts:20 |
| R-37 | Low | Saving an artifact's details deletes Source prose, unknown keys and unreadable numbers | server/catalogueApi.ts:313 |
| R-38 | Low | `cited_as` is never linted; mistyped keys or a non-list value are dropped silently | shared/files.ts:436 |
| R-39 | Low | `capture` prunes generated screenshots that another item still points to | scripts/capture.ts:492 |
| R-40 | Low | Unsaved card moves are lost on reload; the reconnect handler never runs and beforeunload ignores them | src/App.tsx:50 |
| R-41 | Low | Edits typed while a save is in flight are silently discarded | src/components/useEditableRecord.ts:132 |
| R-42 | Low | Closing the orphaned-draft sheet with Esc keeps the dead draft, which returns on a reused ID | src/components/EditChrome.tsx:91 |
| R-43 | Low | The orphaned-draft sheet shows only text fields, so other unsaved edits are lost unseen | src/components/ItemModal.tsx:126 |
| R-44 | Low | A bad journal line crashes `statuses:recode` after the files are rewritten but before the recode is recorded | scripts/recode-statuses.ts:95 |
| R-45 | Low | Settings saves statuses and components with no conflict check | src/views/SettingsView.tsx:421 |
| R-46 | Low | A momentarily invalid board.config.json permanently wipes the saved status filter | src/store.ts:682 |
| R-47 | Low | An unreadable artifact file throws out of loadCatalogue (check crashes, server cannot start) | server/artifactFiles.ts:113 |
| R-48 | Low | `decodeEntities` throws RangeError on an out-of-range numeric entity | shared/artifacts.ts:49 |
| R-49 | Low | An unstat-able entry in assets/ breaks API start-up, every sync and every delete | server/historyJournal.ts:94 |
| R-50 | Low | A malformed position entry in board-layout.json makes every layout save fail with 500 | server/catalogueFs.ts:100 |
| R-51 | Low | Viewed store crashes the Diff tab when the stored value is valid non-object JSON | src/diff/viewedStore.ts:23 |
| R-52 | Low | Find misplaces matches, and can crash, after U+0130 (lower case is two code units) | src/artifacts/find.ts:57 |
| R-53 | Low | `remove.ts descendantsOf` returns the root on a cycle; DELETE fails part way with ENOENT | shared/remove.ts:28 |
| R-54 | Low | A reused item ID inherits the deleted card's git history and bare mentions; SCHEMA says IDs are never reused | server/catalogueApi.ts:427 |
| R-55 | Low | Every Freeform save is refused when the lane list on disk breaks a rule the check never reports | server/catalogueApi.ts:585 |
| R-56 | Low | Lane rename is two writes: stories are renamed even when the lane-list save fails | src/store.ts:313 |
| R-57 | Low | Deleting a card leaves its position in pending saves and undo, which can write an orphan position | src/store.ts:194 |
| R-58 | Low | The initial-load snapshot can overwrite a newer change event | src/store.ts:114 |
| R-59 | Low | Two overlapping failed layout saves restore the older batch over the newer one | src/store.ts:358 |
| R-60 | Low | `unlink` and `mentions` strip code differently and disagree on images, so a delete is refused with 422 | shared/remove.ts:38 |
| R-61 | Low | Backtick code spans match across blank lines, hiding real links | shared/links.ts:31 |
| R-62 | Low | Artifact index joins an item's fields before stripping code | src/artifactIndex.ts:48 |
| R-63 | Low | A malformed percent-escape in an ID path returns 500 | server/catalogueApi.ts:345 |
| R-64 | Low | `createAtomic` relies on hard links, so creates fail on exFAT and some network mounts | server/catalogueFs.ts:240 |
| R-65 | Low | `listMd` loads dotfiles (AppleDouble, Emacs locks) as records | server/catalogueFs.ts:80 |
| R-66 | Low | A UTF-8 BOM makes a record fail with a misleading fence error | shared/files.ts:29 |
| R-67 | Low | `artifact:new` moves the file before claiming the ID and does not retry | scripts/new-artifact.ts:123 |
| R-68 | Low | `nextStatusCode` reuses a removed status's number | shared/statuses.ts:68 |
| R-69 | Low | A folder moved with plain `mv` (unstaged) reads as all records added, with no history | server/gitRenames.ts:51 |
| R-70 | Low | `priorPaths` has no time bound; a file absorbs a later file at its old path | server/gitRenames.ts:63 |
| R-71 | Low | Moving one screenshot merges the source card's whole screenshot history into the target | server/gitRenames.ts:76 |
| R-72 | Low | Diff flags an unchanged artifact file as changed under autocrlf, eol or LFS | server/catalogueDiff.ts:322 |
| R-73 | Low | SHA-256 repositories: asset and screenshot history is always empty | server/gitHistory.ts:189 |
| R-74 | Low | Cached commit-to-commit comparisons keep artifact context from the first read | server/catalogueDiff.ts:629 |
| R-75 | Low | A `cited_as` spot naming a page or line range is an error | shared/sources.ts:230 |
| R-76 | Low | Page, line and point spots go unchecked on files without that dimension; reversed ranges pass | shared/sources.ts:131 |
| R-77 | Low | An item's `artifacts:` entry is refused for heading slugs containing `_` or non-ASCII letters | shared/check.ts:321 |
| R-78 | Low | Any source starting `OQ-` is taken whole as a question ID | shared/sources.ts:190 |
| R-79 | Low | Hand-on to a replacement artifact keeps problems worked out against the retired one | shared/sources.ts:178 |
| R-80 | Low | Point lists misparse: `#2#3` gives NaN, and `#2, #3` drops #3 | shared/sources.ts:109 |
| R-81 | Low | The unresolved-note warning names the wrong file | shared/sources.ts:212 |
| R-82 | Low | A note registered by two sidecars resolves silently to one of them | shared/sources.ts:83 |
| R-83 | Low | Server heading and quote text differ from what the reader matches | shared/artifacts.ts:217 |
| R-84 | Low | `matchSimpleSelector` treats an empty comma part as matching every element | shared/artifacts.ts:131 |
| R-85 | Low | `lintFrontmatter` flags `#` inside YAML block scalars the board itself writes | shared/files.ts:202 |
| R-86 | Low | `planMove` puts a card at the top when dropped at the foot of a stack holding a low-order retired card | shared/move.ts:76 |
| R-87 | Low | Card timeline duplicates a change when the first journal entry is offline | shared/history.ts:255 |
| R-88 | Low | `isMinorChange` counts joined paragraphs or merged bullets as spacing-only | shared/history.ts:143 |
| R-89 | Low | Inserting one numbered list item makes every later item an unmarked "edited" row | shared/proseDiff.ts:107 |
| R-90 | Low | A change ending inside a multi-line code span marks the rest of the block as changed | src/diff/diffMarks.ts:53 |
| R-91 | Low | An edited mermaid diagram shows no drawings, and Whole card calls it "File, unchanged" | src/diff/DiffCard.tsx:322 |
| R-92 | Low | A file that changes between Markdown and another format shows a broken image | src/diff/DiffFile.tsx:69 |
| R-93 | Low | A Viewed tick in one tab overwrites ticks made in another | src/diff/viewedStore.ts:55 |
| R-94 | Low | While a new comparison loads, old empty-state or error messages stay up under the new refs | src/diff/DiffView.tsx:164 |
| R-95 | Low | History timeline keys entries by index, so a refresh moves open state to another entry | src/components/HistoryView.tsx:97 |
| R-96 | Low | History does not refresh when a screenshot is re-captured | src/components/HistoryView.tsx:35 |
| R-97 | Low | Line diff always shows the first and last lines as context | src/components/HistoryView.tsx:351 |
| R-98 | Low | "Highlight could not be found" flag is wiped on a spot change in an already-loaded viewer | src/artifacts/ArtifactViewer.tsx:55 |
| R-99 | Low | Region requests snap rather than ease: placement key split on a `|` that focusKey contains | src/artifacts/CanvasViewer.tsx:316 |
| R-100 | Low | Markdown and PDF readers keep the old red box when a region changes on disk | src/artifacts/MarkdownReader.tsx:133 |
| R-101 | Low | quote= is NFC-normalised in the check but not in the viewer | src/artifacts/regionsDom.ts:99 |
| R-102 | Low | An in-drawing `href="#..."` link navigates the HashRouter away | src/artifacts/CanvasViewer.tsx:188 |
| R-103 | Low | History compare labels every load failure "Not kept: never committed" | src/artifacts/VisualCompare.tsx:88 |
| R-104 | Low | Gallery and lightbox URLs carry no version, so re-captured shots show stale images | src/components/Screenshots.tsx:66 |
| R-105 | Low | The lightbox opened from the docked card sits under the New card button and the divider | src/components/Screenshots.tsx:97 |
| R-106 | Low | A saved Kind or Area filter on the Artifacts tab can hide everything with no control to clear it | src/views/ArtifactsView.tsx:28 |
| R-107 | Low | A docked orphaned draft swallows every guarded navigation with no prompt | src/components/ItemModal.tsx:117 |
| R-108 | Low | Guarded links in a question sheet over a dirty docked item raise an invisible veil | src/components/NewCardButton.tsx:134 |
| R-109 | Low | Modal sheets opened in edit mode lose title autofocus and restore focus to a detached node | src/components/Sheet.tsx:87 |
| R-110 | Low | The veil focus effect re-runs on every render and snaps focus back | src/components/Sheet.tsx:118 |
| R-111 | Low | Cmd/Ctrl+S saves an unchanged record, bypassing the dirty gate | src/components/useEditableRecord.ts:167 |
| R-112 | Low | A sheet opened while its record is missing never picks it up | src/components/useEditableRecord.ts:61 |
| R-113 | Low | Mapped never draws the open card when a retired ancestor is hidden | src/board/mappedLayout.ts:111 |
| R-114 | Low | Mapped hides the open card inside a collapsed lane | src/board/graph.ts:66 |
| R-115 | Low | Enter is swallowed on buttons inside the canvas while a card is open | src/views/BoardView.tsx:401 |
| R-116 | Low | Arrow walk and search zoom to 0.9 only sometimes | src/views/BoardView.tsx:355 |
| R-117 | Low | `centreOn` centres wide epics on their midpoint, hiding the title | src/views/BoardView.tsx:320 |
| R-118 | Low | Arrow keys mix an epic's features and direct stories | src/views/BoardView.tsx:410 |
| R-119 | Low | A "not a lane" band that differs only in case, or names the first lane, cannot be fixed on the board | src/board/mappedLayout.ts:136 |
| R-120 | Low | Renaming a collapsed lane reopens it and leaves a stale collapsed key | src/board/LaneHeaders.tsx:83 |
| R-121 | Low | A question whose status is not configured is counted but never listed | src/questionWalk.ts:39 |
| R-122 | Low | Outline drops cards with a missing or wrong-type parent, even from search | src/views/OutlineView.tsx:58 |
| R-123 | Low | Adding the first component turns every other used component into an error, with no warning | src/views/SettingsView.tsx:316 |
| R-124 | Low | Component "Used by" ignores artifacts, so a remove looks allowed and then fails | src/views/SettingsView.tsx:293 |
| R-125 | Low | A project name with outer spaces stays dirty after saving | src/views/SettingsView.tsx:132 |
| R-126 | Low | A twisty click during search silently collapses the row for later | src/views/OutlineView.tsx:191 |
| R-127 | Low | About TOC link to the current section does not scroll | src/views/AboutView.tsx:20 |
| R-128 | Low | An owner filter for a vanished owner shows "All owners" while still filtering | src/views/QuestionsView.tsx:107 |
| R-129 | Low | A skill or workflow removed or renamed in the board stays installed and becomes disowned | server/skillInstall.ts:79 |
| R-130 | Low | A stray .DS_Store in a linked skill folder disowns it permanently | server/skillInstall.ts:38 |
| R-131 | Low | Install links or copies the gitignored `__pycache__`; the committed link is dangling | server/skillInstall.ts:56 |
| R-132 | Low | `installStatus` reports "current" with unlinked new files and is unused | server/skillInstall.ts:119 |
| R-133 | Low | `links:apply` counts occurrences in already-linked text, so links land on the wrong word | scripts/linkProposals.ts:96 |
| R-134 | Low | `capture --only` with a missing value runs a full capture | scripts/capture.ts:160 |
| R-135 | Low | Runner told to use `plan-state --diff`, which diffs from plan.json's commit, not the pack's baseline | agent/skills/run-build-phase/SKILL.md:173 |
| R-136 | Low | phase-check accepts aliases in needs/after but schedules on raw names | agent/skills/run-build-phase/tools/phase-check.mjs:357 |
| R-137 | Low | A dependency cycle in runner.checks overflows `--list` and spins forever holding the lock | agent/skills/run-build-phase/tools/phase-check.mjs:385 |
| R-138 | Low | `regrade-ids` reads affects and scope from the working tree, not the target commit | agent/skills/update-build-plan/tools/regrade-ids.mjs:49 |
| R-139 | Low | The fix for a failed final capture never rewrites REPORT.md | agent/skills/run-build-phase/SKILL.md:268 |
| R-140 | Low | Edits inside one change are never checked against each other, and same-old/different-new edits are dropped | agent/skills/consistency-review/scripts/build-review.mjs:121 |
| R-141 | Low | Note cites by title words do not resolve (slug mismatch), and a cite without points opens the wrong note | agent/skills/consistency-review/scripts/ref-kit.mjs:179 |
| R-142 | Low | The cite-shorthand parser swallows the next entry when a key is mixed-case | agent/skills/consistency-review/scripts/ref-kit.mjs:59 |
| R-143 | Low | Retired diagrams are packed and reviewed for drift | agent/skills/consistency-review/scripts/build-packs.mjs:175 |
| R-144 | Low | Change ids past 99 collide with ruling codes | agent/skills/consistency-review/scripts/ref-kit.mjs:22 |
| R-145 | Low | Default owner gives the heading "Conflicts for the" | agent/workflows/consistency-rulings.js:149 |
| R-146 | Low | link-requirements crashes on a flat `batches` list, as the skills word it | agent/workflows/link-requirements.js:64 |
| R-147 | Low | Consolidation group topics that match no rulings topic are accepted silently (11 of 13 here) | agent/workflows/consistency-changes.js:240 |
| R-148 | Low | `artifact:steps` screenshots port 5180 even inside a lane worktree | agent/skills/svg-diagram/SKILL.md:218 |
| R-149 | Low | Kit SCHEMA.md ships this project's status numbers, which contradict the starter config | requirements/SCHEMA.md:462 |
| R-150 | Low | run-build-phase's generic body hard-codes prototype conventions | agent/skills/run-build-phase/SKILL.md:185 |
| R-151 | Low | `phase-context.mjs` bakes in project vocabulary and PROGRESS.md headings | agent/skills/run-build-phase/tools/phase-context.mjs:68 |
| R-152 | Low | notes/README.md ships project artifacts and a broken path as "neutral" | requirements/notes/README.md:47 |
| R-153 | Low | Kit docs and skills point at files the export strips | agent/skills/add-artifact/SKILL.md:115 |
| R-154 | Low | Kit is built from the working tree, so untracked files ship | scripts/export-kit.ts:44 |
| R-155 | Low | The About page's install-skills command replaces the tracked symlinks with copies | src/views/AboutView.tsx:432 |
| R-156 | Low | README's Settings description and skill list are out of date | README.md:264 |
| R-157 | Low | The real-catalogue e2e run uses port 5181, which contract-picker-mock also takes | playwright.config.ts:27 |
| R-158 | Low | Every file event re-reads and re-parses the whole catalogue synchronously | server/cataloguePlugin.ts:105 |
| R-159 | Low | The client applies events one at a time and rebuilds every node, so N files mean N renders | src/store.ts:121 |
| R-160 | Low | PDF facts are re-extracted in one child process per PDF on every start | server/artifactFiles.ts:131 |
| R-161 | Low | Rename history is fetched several times at once per HEAD and never cached in a worktree | server/gitRenames.ts:34 |
| R-162 | Low | Per-HEAD git history caches grow without bound | server/gitHistory.ts:111 |
| R-163 | Low | Blob URLs for mermaid drawings are never revoked | src/artifacts/content.ts:44 |
| R-164 | Low | `changedInSubstance` spawns up to three `git show` per entry | agent/skills/update-build-plan/tools/req-changes.mjs:176 |

## Findings in detail

Each finding gives its locations, what is wrong, a concrete failure, the fix (with any better fix the verifiers offered), and the verification evidence in brief. Votes are confirmed/total.

### Medium

#### R-01 · Medium · One bad status entry swaps in default statuses with different meanings, and a Settings save then overwrites the real list
- **Where:** shared/statuses.ts:119-126 (`parseStatusList`), src/views/SettingsView.tsx:375 (`StatusSection`), server/catalogueApi.ts:524-531 (in-use guard). Merged from 2 findings plus a contract-drift lens.
- **What:** `readStatusList` already falls back per field for a bad tone, but any problem it reports, even a cosmetic one, makes `parseStatusList` return `DEFAULT_ITEM_STATUSES`. The default codes mean different things from this project's: defaults have 5 = Retired, while the project has 5 = Confirmed and 6 = Retired. While the fallback is in force, `isRetired` hides and strikes through every Confirmed card, and every status-6 card becomes unknown. Settings shows the defaults as if they were the project's list. The PUT guard counts a code as in use only if `state.config` (the fallback) knows it, so saving writes the default list over the real one.
- **Failure:** Set `statuses[3].tone` to `"teal"` by hand. Confirmed cards vanish from the board. A user opens Settings to fix the error, rewords one help text and saves. board.config.json is now 1 to 5 defaults: Agreed (4) items read Confirmed, Confirmed (5) items read Retired, and status 6 is unknown. No record file changed, so nothing in the Diff review points at the cause.
- **Fix:** Reject a list only for structural problems (missing or duplicate codes, missing required roles), and let tone and label fall back per field. Base the in-use guard on the codes on disk and in the records, not on `state.config`. While a `statuses:` config issue exists, show a banner in StatusSection and disable editing and Save, and have the server refuse status PUTs.
- **Evidence:** 3/3 and 2/2 confirmed. Reproduced end to end against `createCatalogueApi` with node. Verifiers lowered the severity from high to medium (a hand edit is needed).

#### R-02 · Medium · "Keep mine" writes back the whole stale draft, undoing concurrent moves and agent-added fields
- **Where:** src/components/useEditableRecord.ts:150-153; server/catalogueApi.ts:343-352 (PUT replaces the whole record).
- **What:** On a conflict, `keepMine` only swaps `base` to the new rec and keeps the draft. That draft is the whole Item from when editing started, including parent, order, swimlane, images, artifacts and extra, none of which the form shows. The next save PUTs all of it against the new rev, reverting every concurrent change. This breaks SCHEMA's promise for `artifacts` ("the board keeps them on every save") and also catches the user's own Mapped drags, which are allowed while the docked sheet is in Edit.
- **Failure:** Edit US-01.1.3's description, then drag the same card to another feature. Choose Keep mine, then Save. The move is undone for this card only, its old siblings keep the new order numbers, and the undo history drifts. An agent's `artifacts:` addition or a capture's `images` rewrite made during the edit is removed the same way.
- **Fix:** Do a three-way merge per field: send `rec.data` with only the fields where draft differs from `base.data` laid over it. Better, send a field patch with baseRev and let the server merge, as `/api/items/batch` does. At minimum, carry parent, order, swimlane, images, artifacts and extra over from the new rec.
- **Evidence:** 3/3 confirmed by tracing keepMine, then commit, then saveItem, then the PUT route. Nothing merges the untouched fields.

#### R-03 · Medium · SVG sanitiser keeps a javascript: link whose XLink prefix is not literally `xlink`
- **Where:** src/artifacts/sanitise.ts:30-33. The "also" entry adds network reach through HTML-namespaced src, url() in presentation attributes and image-set().
- **What:** The sanitiser compares the qualified name (`attr.name`) with `href` and `xlink:href`. Browsers resolve XLink href by namespace URI plus local name, so `<a x:href="javascript:...">` with `xmlns:x` bound to the XLink namespace survives as a working link inside the shadow root. CanvasViewer only calls preventDefault for `.record-id` links, so the click runs script in the board's origin, which is also the read/write file API. The raw-SVG route sends a CSP, but the inline path skips it.
- **Failure:** An imported diagram contains `<a x:href="javascript:fetch('/api/items/US-01.1.1',{method:'DELETE'})"><text>Click to expand</text></a>`. A reader clicks the label, and requirement files are deleted on disk.
- **Fix:** Match by `attr.localName === 'href'` with a null or XLink namespace. Better, use an allowlist that keeps only `#` hrefs and safe data:image URLs, and drops every href, src, srcset, action, formaction or data attribute in any namespace. As defence in depth, preventDefault every non-record `<a>` in CanvasViewer.
- **Evidence:** 3/3 confirmed. A jsdom run of the real `sanitiseSvg` shows `getAttributeNS(XLINK,'href')` still returns `javascript:alert(1)`, while the literal `xlink:` control is stripped.

#### R-04 · Medium · Percent-encoded or upper-case `/requirements/` path skips the guard, so Vite serves raw SVG with no CSP
- **Where:** server/cataloguePlugin.ts:121-123.
- **What:** The guard tests the undecoded, case-sensitive `url.pathname.startsWith('/requirements/')`. Vite's static middleware decodes the path, and APFS is case-insensitive by default, so `/%72equirements/...` and `/REQUIREMENTS/...` reach Vite's sirv and are served raw as image/svg+xml with no `SVG_CSP`.
- **Failure:** A card links to `/%72equirements/artifacts/files/AR-99.svg`. Prose renders it as a target=_blank link. Clicking it opens the SVG as a top-level document on localhost:5180, and its `<script>` can PUT and DELETE through `/api/*`, because refuseCrossSite sees a matching Origin.
- **Fix:** Normalise before matching (`decodeURI(url.pathname).toLowerCase()`), or better add `server.fs.deny: ['requirements/**']` in vite.config.ts so Vite's static and `/@fs/` routes refuse the folder whatever the spelling. Also send `SVG_CSP` on every image/svg+xml response.
- **Evidence:** 2/3 confirmed. The issue was reproduced on a scratch Vite server with the board's plugin: the guarded path gives 404 and both bypasses give 200 with the script intact. The refuting verifier accepted the mechanism but noted that Vite's `/@fs/` route already gets past the guard, which argues for the `fs.deny` fix.

#### R-05 · Medium · `kit:export` wipes a live board when the target is this repo or an adopting repo
- **Where:** scripts/export-kit.ts:118-123. Merged with the portability and docs-vs-code lenses.
- **What:** Step 5 refuses a target only when it has other files and no `requirements-board/`. Any folder holding a board passes, and the script then rmSync's everything in `<target>/requirements-board` except node_modules: the live catalogue, `.history/`, `.links/`, `shots/`. Under `npm --prefix`, a relative `--to` resolves against the board folder (see R-31), so `--to ..` typed at the repo root targets the repo root itself.
- **Failure:** `npm --prefix requirements-board run kit:export -- --to ..` deletes the live board's catalogue, uncommitted edits, journal and link proposals, and replaces them with the starter kit.
- **Fix:** Refuse when `resolve(target, BOARD)` equals or contains `boardDir` (in either direction). Refuse when the target board has a non-starter `requirements/` (mark exports with a `.kit-export.json`), `.history/` or `.links/`. Resolve `--to` against `INIT_CWD`.
- **Evidence:** 3/3 confirmed, reproduced on a copy. A scratch npm package confirmed that npm sets cwd to the package and the caller's folder only reaches `INIT_CWD`.

#### R-06 · Medium · `statuses:recode` silently merges two statuses when a numeric renumber omits one pair
- **Where:** scripts/recode-statuses.ts:58-72 (`planFolder`).
- **What:** An unmapped value that equals some map target is treated as "already recoded". That exemption suits moving from labels to codes, but in the numeric renumbering that ADOPTING.md documents, every old code is likely to be a target, so a forgotten pair is never caught. The merge is then recorded in status-recodes.json as a pure relabel.
- **Failure:** `--items 1=1,2=2,3=4,5=6,6=7` (with `4=5` forgotten) reports "3 files". Old-3 and old-4 stories both end up as `status: 4`, and diffs call it no change.
- **Fix:** When every map key is a numeric code, require every value found in the files to be mapped. Keep the target exemption only for values that are not codes in the current config.
- **Evidence:** 3/3 confirmed by a dry run on a scratch catalogue (exit 0, no refusal).

#### R-07 · Medium · Recodes are applied to versions saved after them, so renumbering misreads current statuses
- **Where:** shared/statuses.ts:195 (`normaliseStatus`), scripts/recode-statuses.ts:151, agent/skills/update-build-plan/tools/scope.mjs:41. Callers: catalogueDiff.ts:567 and 653, catalogueApi.ts:337, build-args.mjs, assemble-gaps.mjs, req-changes.mjs, phase-context.mjs. Merged from 2 findings.
- **What:** Every recorded recode runs over any value, whenever it was written. Names-to-codes recodes are safe, but a renumber's targets are its own or earlier sources, so files saved after the recode get mapped again.
- **Failure:** After `--items 4=5,5=6`, a stored 5 (Confirmed) reads as 6 (Retired), and the new 4 reads as 5. Diffs and the item timeline show Confirmed items as Retired. A real move from 3 to 4 after `1=2,2=3,3=4` normalises to 4 on both sides and is missed. The build-plan tools treat Confirmed items as retired and drop them from grading.
- **Fix:** Record the commit or time of each recode and apply it only to older versions. Failing that, have recode-statuses refuse any target that is a source in this map or in an earlier recode, and say so in ADOPTING.md and SCHEMA.md. Add an overlapping-map test.
- **Evidence:** 3/3 and 3/3 confirmed with node experiments on the real recode file plus overlapping maps.

#### R-08 · Medium · `links:apply` re-applies every old verified proposal, restoring links the user removed
- **Where:** scripts/apply-links.ts:21-24, agent/workflows/link-requirements.js:27, 89, 109; scripts/link-index.ts never clears the folder. Merged from 2 findings plus a docs lens.
- **What:** apply-links reads every `*.verified.json` in `.links/`, and the workflow names files by batch grouping, which changes between runs. The live folder already holds 14 verified files from 10, 17 and 18 November with overlapping groupings. Re-checking skips only proposals that are already applied or no longer fit, so a link the user deliberately removed comes back.
- **Failure:** A link is accepted and applied on 10 November, then removed on the board. On 18 November, update-requirements Stage 5 links EP-01 only and runs `links:apply`. The stale EP-06 file re-adds the link, with nothing in links-report.md to show it came from an old run.
- **Fix:** Give each run its own folder (`.links/run-<ts>/`) and pass it to `links:apply`. Alternatively, delete or archive the batch files before proposing, or move each applied file into `.links/applied/`.
- **Evidence:** 2/2 and 2/2 confirmed. A dry run on a copy showed all 39 old proposals are skipped only because they are already in the text.

#### R-09 · Medium · Review page reloads stale decisions onto renumbered change ids for the same baseline
- **Where:** agent/skills/consistency-review/scripts/build-review.mjs:257 (storage key), :100-108 (ids by position).
- **What:** Decisions are stored in localStorage under `${storage-key}-${baseline}`, keyed by ids that come from sort position. Re-running stage 2 on the same baseline, which SKILL Stage 3.3 calls for, gives new ids for different changes, and the old Accepted marks are painted onto them. `decisions.mjs` warns only about ids that are missing.
- **Failure:** L-01 was accepted. After a re-run, L-01 is a different change (say, a retirement), it shows as Accepted, and `apply.mjs` applies an edit the user never approved.
- **Fix:** Include a hash of changes.json (or the journal path) in the storage key. Store a fingerprint per decision and drop or flag mismatches, both on the page and in decisions.mjs.
- **Evidence:** 3/3 confirmed. One verifier noted that SKILL.md claims ids are stable only while the journal is unchanged, a condition nothing enforces.

#### R-10 · Medium · `descendantsOf` has no cycle guard, so opening a self-parented card white-screens the board
- **Where:** src/store.ts:605-615; callers in src/views/BoardView.tsx:91/187 (lineage memo), :237 (drag start), :442 (movedInEpic). Merged from 2 findings.
- **What:** Unlike `ancestorsOf`, `isRetiredOrUnder`, graph.ts and shared/remove.ts, store.ts's `descendantsOf` recurses with no visited set. `buildIndex` files any item under its parent, so a self-parent or a two-item cycle loops. The app has no error boundary, and `?item=` survives a reload, so the board crashes again on every load. In Freeform, cycle members are silently missing instead (autoLayout.ts:43).
- **Failure:** An agent writes `parent: US-01.0.1` on US-01.0.1. The user clicks the card in the orphan column, or clicks the Problem pill entry meant to help fix it. React throws "Maximum call stack size exceeded" and the page goes blank.
- **Fix:** Add a seen set (`const seen = new Set([id])`). Add a store test for a self-parent and a two-item cycle. Add an ErrorBoundary round the board. Place unreached items in Freeform's orphan stack.
- **Evidence:** 3/3 and 2/2 confirmed by a node run of buildIndex plus descendantsOf. Lowered to medium because the board cannot create the cycle itself.

#### R-11 · Medium · `canParent` throws on an unknown item type and crashes the Mapped board
- **Where:** shared/move.ts:52; reached from src/board/mappedLayout.ts:94 and src/store.ts:395.
- **What:** `PARENT_TYPES[it.type].includes(...)` has no guard, and toItem accepts any string as the type. mappedLayout promises that bad data is still drawn in a column of its own, but it calls canParent for every parented non-epic, and with no error boundary the whole app unmounts, taking the Issues list with it.
- **Failure:** An item file with `type: Story`, `type: user-story` or no type, and `parent: EP-01`, blanks the app whenever Mapped is the view.
- **Fix:** `(PARENT_TYPES[it.type as ItemType] ?? []).includes(parent.type)`. Add a mappedLayout test for an unknown type.
- **Evidence:** 2/2 confirmed, with the TypeError reproduced in node.

#### R-12 · Medium · Artifact page drops an unsaved panel edit when the artifact vanishes, and the stuck draft keeps the leave prompt on
- **Where:** src/views/ArtifactPage.tsx:32-40; src/components/useEditableRecord.ts:54-57, 188; src/App.tsx:65.
- **What:** When `rec` disappears (the sidecar is renamed, deleted or no longer parses), ArtifactPage returns "There is no artifact" and unmounts the panel. The orphaned-draft view that items and questions get is never shown, and the module-level draft is never deleted, so `hasUnsavedDrafts()` stays true for the tab's life. Full-screen mode also stays on, hiding the masthead.
- **Failure:** An agent renumbers AR-07 while its description is being edited. The text vanishes with no way to copy it, and every reload then asks "Leave site?".
- **Fix:** When `rec` is missing but `artifact:${id}` is in drafts, render the orphaned-draft panel (copy, plus Discard). At least delete the draft and leave full screen when the artifact is gone.
- **Evidence:** 2/2 confirmed by tracing the store's delete, the early return and the effect with no cleanup.

#### R-13 · Medium · pdf.js documents are never destroyed: one leaked Web Worker per PDF view or thumbnail
- **Where:** src/artifacts/PdfReader.tsx:37-46 (`loadPdf`), Thumb.tsx:58, VisualCompare.tsx:33. Merged with an artifact-viewers duplicate.
- **What:** Only `workerSrc` is set and no `worker` is passed, so in pdfjs-dist 5.7.284 every `getDocument` makes a new PDFWorker thread. Nothing calls `destroy()`. Each worker keeps its parsed document (the catalogue has 10 MB and 3 MB PDFs) until the tab closes, and the WeakMap caches keyed by LoadedPdf never hit.
- **Failure:** Visiting the Artifacts tab ten times leaves 50 live workers. History compare across the 10 MB RFP response adds a parsed copy per open, and memory grows by hundreds of MB.
- **Fix:** Memoise loadPdf by URL in a small LRU and destroy evicted documents. Destroy after one-shot renders (thumbnails, compare). Optionally share one `new PDFWorker()`.
- **Evidence:** 3/3 confirmed against pdf.mjs:14817-14822 and 15727, and a grep that finds no destroy call in src/.

#### R-14 · Medium · An IN PROGRESS phase with its session-1 entry counts as built, so plan updates freeze it
- **Where:** agent/skills/update-build-plan/tools/config.mjs:155-185 (`phaseStatus`).
- **What:** `built` and `builtByEntry` include every `### ... Phase NN` entry heading, whatever the row status. run-build-phase tells the runner to write the IN PROGRESS row and the entry at the session-1 checkpoint, so a partly built phase ends up in built and in inProgress at once. That contradicts plan-state.mjs ("A phase IN PROGRESS is not built") and the SKILL's partlyBuilt handling.
- **Failure:** phase-briefs gets 27 in `--built`, writes no brief, and never adds "Requirements changed since". The outline calls 27 both frozen and partly built, and recipe-status `--check` skips it.
- **Fix:** Filter IN PROGRESS rows (and status.json in_progress) out of `built` and `builtByEntry`. Add a test with an IN PROGRESS row plus its entry.
- **Evidence:** 3/3 confirmed with a scratch progress file: built=['26','27'] and inProgress=['27'].

#### R-15 · Medium · `phase-check --failed` forgets the full gate's failures after any `--changed` or `--only` run
- **Where:** agent/skills/run-build-phase/tools/phase-check.mjs:395 (always writes last.json), :293-301.
- **What:** Partial runs overwrite last.json. `--changed` marks checks with no changed form as OMIT, and `--failed` treats OMIT as passed. The stored `changed` flag is never read. The skill's own loop (Stage 3 steps 4 and 5) hits this case.
- **Failure:** The full gate fails the build. The agent then runs `--changed` (GREEN PARTIAL) and then `--failed`, which prints "nothing failed last run" and exits 0, so the build is never re-run.
- **Fix:** Keep last.json for full runs only (write partial runs to last-partial.json), or merge results by check name, or have `--failed` fall back to the last full run when the last record is partial.
- **Evidence:** 2/2 confirmed, reproduced in a scratch repo.

#### R-16 · Medium · A story moved out of an out-of-scope lane counts as cosmetic and drops out of the plan
- **Where:** agent/skills/update-build-plan/tools/req-changes.mjs:83 (`COSMETIC_FIELDS` includes swimlane); regrade-ids.mjs.
- **What:** Scope is decided by lane (`outOfScopeLanes: ['Future Work']`), yet a lane-only change goes under cosmeticOnly and is never re-graded. assemble-gaps then finds an in-scope item with no grade and drops it.
- **Failure:** Dragging US-02.4.4 out of Future Work leaves it ungraded, absent from gaps.json and units.json, and covered by no phase.
- **Fix:** Count a lane change as substance when either the old or the new lane is out of scope, or re-grade any item whose `outOfScope()` result differs between from and to. Update the SKILL wording to match.
- **Evidence:** 2/2 confirmed: substance() returns identical text with and without the lane.

#### R-17 · Medium · With build lanes, plan updates on master treat lane-built phases as unbuilt
- **Where:** agent/skills/update-build-plan/SKILL.md:310-312; config.mjs `phaseStatus` reads only master's working tree.
- **What:** A lane's IN PROGRESS row, session entry and checkpoint commits live only on `lane/a` or `lane/b`, so partlyBuilt protection is never applied. LANES.md expects plan updates on master during a wave.
- **Failure:** After a "26 checkpoint:" commit on lane/a, a master plan update rewrites phase-26's doc as unbuilt and moves its baseline. The lane then merges master and gets a doc that ignores its frozen work, or a merge conflict.
- **Fix:** When `guidance.lanes` is set, read each lane branch's progress file (`git show lane/a:<progress>`) and the lane status files under the git common dir, and pass checkpointed phases as partlyBuilt or built. Alternatively, restrict plan updates to the gaps between waves.
- **Evidence:** 2/2 confirmed by reading the tools: nothing reads other branches or worktrees.

#### R-18 · Medium · Fresh-plan remake maps a reused phase number to the old plan's doc path
- **Where:** agent/skills/update-build-plan/tools/apply-plan-update.mjs:45-50.
- **What:** `file = o?.file || phases/phase-${num}-${slug}.md` prefers the old plan.json entry. A remake numbers from firstPhase, overlaps the old unbuilt numbers, and workflow-dev-plan writes new slugs, so the new docs are orphaned.
- **Failure:** A remake writes phase-29-ledger-core.md, but plan.json keeps phase-29-availability-calendar.md, and every tool reads the abandoned doc with no warning.
- **Fix:** Use the old file only when `o.slug === p.slug`, or always use the dev-plan path on an architect (non-update) run. Warn when both files exist.
- **Evidence:** 2/2 confirmed by tracing the Fresh plan steps; nothing removes the old plan.json first.

#### R-19 · Medium · `parseRunOrder` expands `U1 to U6` over catch-up phases, pulling 25a into U6's step
- **Where:** agent/skills/run-build-phase/tools/phase-context.mjs:369-372.
- **What:** For a track-to-track range, `numbered` is false and the filter keeps every phase between the ends in plan order. The doc comment intends track phases only.
- **Failure:** On the live ROADMAP, the steps come out as `['U6','25a']`, so the context pack tells 26 that "the phase before this one is 25a", when 25a actually runs after 27a. Stage 7's safe-to-start logic is fed the wrong order. ("18 November" is also read as phase 18.)
- **Fix:** `.filter(n => numbered ? /^\d/.test(n) : /^[A-Z]/.test(n))`, and add the `U6 (U1 to U6 built)` test case.
- **Evidence:** 2/2 confirmed by running the real module on ROADMAP.md and plan.json.

#### R-20 · Medium · Verifier-raised questions are lost (`proposedQuestions` is never used)
- **Where:** agent/skills/consistency-review/scripts/build-review.mjs:36, 42, 89; agent/workflows/consistency-changes.js:139, 273, 291.
- **What:** EDIT_RULES send undecidable points to newQuestions, which are gathered into `proposedQuestions` and never written out. Groups with no findings are not consolidated, and consolidators keep only questions tied to their findings.
- **Failure:** A verifier returns `verified: []` plus one question. The page shows 0 new questions and the open matter never becomes an OQ.
- **Fix:** Add any proposedQuestions no consolidator kept (matched by lower-cased title), marked "not reviewed by the final pass". Alternatively, always run the catch-all consolidator when questions exist.
- **Evidence:** 2/2 confirmed: grep shows the variable is never read.

#### R-21 · Medium · Every edit-less change is labelled "needs redrawing", including protected-artifact flags
- **Where:** agent/skills/consistency-review/scripts/build-review.mjs:113, 170, 282.
- **What:** `needsRedraw = edits.length === 0`. Protected-artifact flags (the prompt itself tells verifiers to send "no edits, flag to owner") and decision-blocked findings get the pill, and Stage 4.6 then says to redraw them.
- **Failure:** A flag on retired AR-30 is accepted as an acknowledgement, and the agent redraws a protected, retired record.
- **Fix:** Set needsRedraw only for diagram-sourced changes on unprotected artifacts, and show others as "flag only". Better, add an `action: edit|redraw|flag` field to the schemas.
- **Evidence:** 2/2 confirmed against consistency-changes.js:157 protectedText.

#### R-22 · Medium · A missing artifact file or history blob is served as the SPA's index.html with status 200
- **Where:** server/cataloguePlugin.ts:130-136; client src/artifacts/VisualCompare.tsx:29, ArtifactViewer.tsx:42-44, content.ts:47. Merged from a server finding (low) and a viewer finding (medium).
- **What:** When `serveArtifactFile` or `serveHistoryBlob` misses, the middleware calls `next()`. Vite 8's htmlFallbackMiddleware rewrites the fetch (Accept `*/*`) to /index.html and returns 200. Every client 404 branch ("file is missing", "Not kept") is therefore dead code. The `/requirements/` branch above already ends with a 404, but these two do not.
- **Failure:** A sidecar names a moved .md file and the viewer renders `<!doctype html>...<script src=/@vite/client>` as the document. A never-committed history blob shows index.html as the "before" source. An SVG reads as "not a readable SVG" and a PDF as "Invalid PDF structure".
- **Fix:** End both branches with `res.statusCode = 404; res.end()`, and add a `.catch` to the history-blob promise.
- **Evidence:** 2/2 and 2/2 confirmed by tracing the Vite 8.3.0 middleware order and htmlFallbackMiddleware (node.js:16550-16588).

#### R-23 · Medium · Card and artifact history diffs neighbouring log entries (not first-parent), so merges show false reverts
- **Where:** server/gitHistory.ts:138 (`gitFileHistory`); shared/history.ts:259-271 (`buildTimeline`). Merged from 2 findings, plus an "also" about the HEAD-only cache missing staged moves.
- **What:** The plain `git log` interleaves both sides of a merge by date, and buildTimeline diffs each version against the previous list entry. catalogueDiff already uses `--first-parent --diff-merges=first-parent`. The two-lane worktree workflow produces exactly this history.
- **Failure:** Lane A sets the title, lane B sets the description, and the merge is clean. History says lane B's commit reverted the title, and the merge re-applied it. With images, a master commit appears to delete the lane's screenshot.
- **Fix:** Log with `--first-parent --diff-merges=first-parent`, or diff each version against its own parent's blob.
- **Evidence:** 2/2 and 2/2 confirmed, reproduced in scratch repos with the real functions.

#### R-24 · Medium · History readers parse git output without `-z`, so non-ASCII paths get no history
- **Where:** server/gitHistory.ts:138, 183, 236 (filters at :147, :189-191, :246-247); server/gitRenames.ts:22-26, 38, 51. Merged with a test-gaps lens.
- **What:** With the default core.quotePath, non-ASCII paths come back C-quoted, so the `paths.includes` filters never match, and the screenshot regex captures stray quotes. catalogueDiff uses `-z` and has an accents test, but these readers have neither.
- **Failure:** A committed and edited `Transcript – 12 Nov.md` gets 0 asset commits. `café.png` yields `caf\303\251.png"`. A non-ASCII requirements folder path empties every card history.
- **Fix:** Use `-z` with NUL parsing (as readCommits does). Add accents tests for gitAssetHistory, gitScreenshots and priorPaths.
- **Evidence:** 2/2 confirmed, reproduced; core.quotePath is unset in this environment.

#### R-25 · Medium · LCS caps without prefix/suffix trimming: long documents show every block edited, and long paragraphs show as rewritten
- **Where:** shared/proseDiff.ts:174 (`pairBlocks`, 1M-cell cap), :212 (`wordDiff`, 400k-cell cap); shared/textCompare.ts:12 (`lcsPairs`). Merged from 2 findings with the same root cause.
- **What:** (a) Above about 1000 blocks a side, `lcsPairs` returns null. pairBlocks treats that as "nothing in common" and runs pairRun over the whole document, so identical blocks become "edited" and nothing folds. This contradicts lcsPairs' own doc comment. The largest transcript is already 798 blocks. pairRun is also O(dels×adds) on the main thread (about 1.2 s for 900 replaced blocks). (b) wordDiff counts spaces and punctuation as tokens, so a paragraph of about 300 words passes the cap, and markPair marks it `rewritten`. 28 transcript blocks and OQ-78 are already over.
- **Failure:** Two joined transcripts (1538 blocks) with one word changed give 1538 edited rows and 3000+ Markdown parses. A one-word change in a 2211-token paragraph tints the whole wall of text.
- **Fix:** Trim the common prefix and suffix inside `lcsPairs` (fixing every caller), and apply the cap only to the middle. Past the cap, fall back to the documented all-removed-then-all-added, or emit 'same' when keys match.
- **Evidence:** 3/3 and 2/2 confirmed, reproduced with node on real transcripts.

#### R-26 · Medium · Batch and delete writes run a full catalogue check and broadcast issues once per record
- **Where:** server/catalogueApi.ts:416 (batch), :375-383 (delete), :219-227 (`commitItem`). Merged with a server-api duplicate.
- **What:** After one whole-catalogue `guard()`, each record runs `refreshIssues()` (a full check including existsSync calls) and emits its own item and issues events. That is k full checks and 2k WebSocket messages per batch.
- **Failure:** A 40-story lane rename took 602 ms and sent 80 events (one PUT takes 31 ms). At about 1500 items, a 150-story rename blocks the server for seconds and pushes 150 issues arrays to every tab.
- **Fix:** Split commitItem into write and notify steps. Write everything, call refreshIssues once, then emit the item events plus one issues event (or one batched event, see R-159).
- **Evidence:** 3/3 confirmed. One verifier measured 11 ms per check today and argued for low; the majority kept medium.

#### R-27 · Medium · `mermaidNodeIds` loses `B` in `A --> B[Label]`, so the check falsely errors on node= anchors
- **Where:** shared/artifacts.ts:168-169. Merged with the "also" about the Mermaid 11 `id@{...}` shape syntax.
- **What:** The shape-strip loop runs before the arrows are removed, and its `>[^\]]*\]` alternative (meant for the flag shape) eats `>B[Label]`. Square-bracket targets are the most common form. The `--o` and `--x` edge heads also leave stray `o` and `x` node IDs.
- **Failure:** `flowchart LR; A --> B[Label]; C[x] --> D[y]; E --o F` gives {A, C, E, o, F}. A region `around: [node=B]` fails `npm run check` while the board highlights it correctly.
- **Fix:** Strip arrows first, or anchor the flag shape to an ID character. Strip edge heads. Add `A --> B[Label]` and the `@{}` form to the test.
- **Evidence:** 2/2 confirmed by running the real function.

#### R-28 · Medium · Markdown heading slugs are recomputed from rendered text, where record IDs show as titles
- **Where:** src/artifacts/MarkdownReader.tsx:77-85 (slugs), :108 (heading= match); src/components/Prose.tsx:83-90, 167-172.
- **What:** The comment says headings take the server's slugs, but the code re-slugs `h.textContent`, where remarkRecordIds has rendered a bare `EP-04` as its title. The server slugs (meta.headings, Sections list, check) keep the ID. Rendered and source text differ the same way for heading= and quote= anchors that span IDs.
- **Failure:** AR-58's `### 9.1 Catalogue, EP-04 Contracts` has the server slug `91-catalogue-ep-04-contracts`, but the DOM slug is `91-catalogue-contracts-contracts`. Clicking the section in the panel, or following a link the check accepts, says "The highlight could not be found".
- **Fix:** Assign data-slug from `rec.meta.headings` in document order, or slug in a rehype pass before IDs are swapped. Match heading and quote anchors on source-derived text.
- **Evidence:** 2/2 confirmed on the real AR-58 file with the shared slugify.

#### R-29 · Medium · Mapped drops every child of an orphaned feature, from the board and from search
- **Where:** src/board/mappedLayout.ts:92-98, 129-130.
- **What:** Children of an orphan are filed under `kids.get(orphanId)`, but nothing reads that list, because the orphan column returns only `orphans`. The stories get no placement, so no node, and they drop out of `hits`. Freeform handles the same data.
- **Failure:** An epic file is deleted while its features remain, or a feature's parent has a typo. The feature shows in the orphan column, but its valid stories vanish, and searching for them says "Nothing on the board matches".
- **Fix:** Stack each orphan followed by its descendants (recursing as autoLayout does), or give an orphan feature its own column.
- **Evidence:** 2/2 confirmed. A scratch run placed 4 of 6 items in Mapped and all 6 in Freeform.

#### R-30 · Medium · CSV export writes the bare status code, not the label
- **Where:** shared/csv.ts:57, :80; scripts/export-csv.ts:23-24.
- **What:** Since statuses became codes, the Miro and spreadsheet CSV has a Status column of 1 to 6. SCHEMA says never to infer a status from its number. csv.ts predates the change and never receives the config.
- **Failure:** A Miro import shows "5" where it showed "Confirmed", and the questions CSV shows "4" for Answered.
- **Fix:** Pass BoardConfig in and write `statusLabel(config, kind, code)`.
- **Evidence:** 2/2 confirmed. git log shows csv.ts was untouched by d4db2772.

#### R-31 · Medium · Relative path arguments resolve against the board folder under `npm --prefix`
- **Where:** scripts/new-artifact.ts:66-70, scripts/export-kit.ts:23, export-csv.ts:14, shoot-steps.ts:34, apply-links.ts:18. Merged with the docs lens on add-artifact and the "relative kit:export --to nests" finding.
- **What:** The skills and CLAUDE.md run scripts from the repo root with `npm --prefix requirements-board run ...`. npm sets cwd to the package, so every `resolve(arg)` misreads relative paths, and nothing reads `INIT_CWD`. For kit:export, an empty `requirements-board/<folder>` passes the guard. Because that folder is not skipped, the next export copies the previous kit into the new one, nesting deeper each time.
- **Failure:** `artifact:new -- requirements-board/requirements/notes/x.md` fails with "does not exist". `kit:export -- --to kit-out` writes inside the board, and the next export ships a kit inside a kit. `--to ..` triggers R-05.
- **Fix:** Add a shared `userPath = p => resolve(process.env.INIT_CWD ?? process.cwd(), p)`. Refuse export targets inside boardDir.
- **Evidence:** 2/2 and 1/1 confirmed with a scratch npm package (npm 11.19.1).

#### R-32 · Medium · `land()` leaves scrollend listeners and rAF loops alive and uncancelled, which yank the reader back
- **Where:** src/diff/scroll.ts:23-26 (glide branch), :28-37 (jump loop); callers useDiffKeys.ts:67-72, DiffView.tsx:114. Merged from 2 findings with the same root cause (no landing token).
- **What:** (a) The glide adds a `{once:true}` scrollend listener even when scrollTo changes nothing (an unreachable target at the page bottom, or one already in place). Browsers fire no scrollend then, so the listener waits indefinitely and acts on the reader's next scroll. (b) The jump loop (always under reduced motion, or when the target is far) only stops after 6 calm frames or 61 frames, so against an unreachable target it writes scrollTop every frame for about 1 s. Overlapping calls are never cancelled, and loops and listeners stack.
- **Failure:** Press k until the bottom, then press j or scroll up. The page glides back to the bottom. Under reduced motion, a trackpad scroll after reaching the last change snaps back on every frame for a second. This breaks the 1.5.0 "keys step through the changes" promise.
- **Fix:** Keep one landing token per page: each land() cancels the previous listener and loop, and wheel, touch or mousedown also cancel. Add the listener only when the clamped destination differs by more than 1 px, with a timeout fallback. End the loop when a write does not move the page.
- **Evidence:** 3/3 and 1/1 confirmed by code reading against the CSSOM View spec. Not run in a browser, per the rules.

#### R-33 · Medium · Card find re-scrolls to the current match on every DOM change in the card
- **Where:** src/components/CardFind.tsx:48-51 (MutationObserver), :67-80 (scroll effect on `[current, ranges]`).
- **What:** Any mutation (the "Link copied" label, a history disclosure, a live refetch) builds a new ranges array, and the effect scrolls the match back into view. `active` is an index, so mutations above the match quietly change which match is current.
- **Failure:** With find open, scroll to the foot and click the item ID. The card jumps back to the match, and does it again 1.6 s later when the label reverts.
- **Fix:** Scroll only on an explicit step or a query change, using a "scroll requested" ref. Optionally keep the current match by position rather than index.
- **Evidence:** 2/2 confirmed by tracing the effect dependencies and findRanges.

### Low

#### R-34 · Low · Consistency-review `apply.mjs` writes LLM-proposed edits to any path
- **Where:** agent/skills/consistency-review/scripts/apply.mjs:22-32; build-review.mjs:65 (`norm`), :97, :160 (label shows only the basename). Merged with "apply.mjs crashes when a file is missing".
- **What:** Edits from agents that read untrusted transcripts are applied with `path.join(repo, e.file)`, with no check that the path stays inside REQ, or even inside the repo. Protected artifacts are enforced only in the prompt. The page labels an edit "settings" or "SKILL", so the reader cannot see where it lands.
- **Failure:** A prompt-injected transcript leads a verifier to propose an edit to `.claude/settings.json` or `../../.zshrc`. The user accepts the batch, and a file outside the catalogue is rewritten.
- **Fix:** Refuse paths outside `<repo>/<REQ_REL>/` and protected artifacts in apply.mjs (print FAIL). Flag such edits in build-review and show the full relative path.
- **Evidence:** 2/2 confirmed. A path outside the repo even validates as "applies".

#### R-35 · Low · Asset and artifact routes follow symlinks out of the repository
- **Where:** server/cataloguePlugin.ts:285-299 (`serveAsset`), server/artifactFiles.ts:63-68 (`artifactPath`).
- **What:** Containment is a string test on the resolved path. statSync and createReadStream then follow symlinks, which git can store.
- **Failure:** A pulled commit adds `assets/US-1.1.1/shot.png -> ../../../../../../.ssh/id_ed25519`, and GET streams the private key, readable cross-origin per R-36.
- **Fix:** Compare `realpathSync(abs)` against `realpathSync(base) + sep`, or reject symlinks via lstat.
- **Evidence:** 1/1 confirmed, leak reproduced.

#### R-36 · Low · Vite's default CORS lets any localhost page read the whole catalogue
- **Where:** vite.config.ts:20.
- **What:** Vite's default `cors` allows any `localhost` or `*.localhost` origin. It runs before the board's routes, so `/api/catalogue`, `/artifact-file/` (including repo-rooted PDFs) and `/api/diff` are readable cross-origin. Writes stay protected by refuseCrossSite.
- **Failure:** A dependency's demo server on :6006 fetches the catalogue and AR-36 (the proposal PDF).
- **Fix:** `server: { cors: false }`.
- **Evidence:** 1/1 confirmed in Vite 8.3.0 source (node.js:24622, 781).

#### R-37 · Low · Saving an artifact's details deletes Source prose, unknown keys and unreadable numbers
- **Where:** server/catalogueApi.ts:305-322 (PUT), shared/files.ts:417 (`mermaidOf`), :436, :447-451, :514-528 (`serialiseArtifact`, `withArtifactDetails`). Merged from 3 findings plus a test-gaps lens.
- **What:** The route re-serialises the whole sidecar from the parsed model. What gets lost: everything in `## Source` except the first mermaid fence, a non-list `cited_as`, unknown region, step, move and citation keys, non-mapping rows, and NaN numbers (written as `.nan`). `artifactRoundTripProblems` checks only the description, so nothing is refused. This contradicts the route comment, SCHEMA ("the board keeps cited_as") and the CHANGELOG. No live sidecar triggers it today.
- **Failure:** Renaming an artifact deletes its `cited_as` mapping (every "RFP p.N" source stops resolving), turns `pad: wide` into `.nan`, and drops the legend prose.
- **Fix:** Edit the YAML in place with `parseDocument`, setting only the editable keys, and replace only the description, leaving `## Source` byte-identical. Otherwise return 422 when a round trip loses data. Add a live "round-trips every sidecar" test.
- **Evidence:** 3/3, 2/2 and 2/2 confirmed, reproduced in scratch.

#### R-38 · Low · `cited_as` is never linted; mistyped keys or a non-list value are dropped silently
- **Where:** shared/files.ts:348 (`CITATION_KEYS` is unused), :409-414, :436; lintArtifact (:539-587).
- **What:** `pageOffset` (the TS field name) is an easy typo for `page_offset` and vanishes. A mapping in place of a list claims no prefix, so citing sources become plain text with no warning. Both are dropped on the next save (R-37).
- **Failure:** "Board pack p.12" opens page 12 instead of 13, and check stays silent.
- **Fix:** Lint a non-list cited_as and unknown keys ("pageOffset: did you mean page_offset?"), and say they are dropped on save.
- **Evidence:** 2/2 confirmed; a grep shows CITATION_KEYS is never used.

#### R-39 · Low · `capture` prunes generated screenshots that another item still points to
- **Where:** scripts/capture.ts:492-495; scripts/captureFiles.ts:28-39.
- **What:** pruneAssets deletes files in `assets/<recipe.id>/` that the recipe no longer produces, without checking other items' `images`. The delete route guards exactly this case (catalogueApi.ts:377-380).
- **Failure:** After a recipe renames a shot that FT-03.5 also lists, FT-03.5 fails the check with "image file is missing".
- **Fix:** Load the catalogue and skip files referenced by other items, reporting them.
- **Evidence:** 1/1 confirmed; the real data has shared references.

#### R-40 · Low · Unsaved card moves are lost on reload; the reconnect handler never runs and beforeunload ignores them
- **Where:** src/App.tsx:46-50 (`vite:ws:connect` handler), :62-69 (beforeunload); src/store.ts:40 comment, :87 (`pendingLayout`), :339-361. Merged from 2 findings.
- **What:** Vite 8 never reopens the socket in place. After an outage it polls and calls `location.reload()`, so `onUp` is dead code. pendingLayout, moves still inside the 400 ms debounce and Mapped moves in flight live only in memory, and beforeunload checks only `hasUnsavedDrafts()`. The "Card moves not saved yet" banner even invites a reload. If the user picks "Stay" with a draft open, the HMR client stays Offline for good.
- **Failure:** The server restarts. Three Freeform drags fail, and the reload on reconnect puts all three cards back with no warning.
- **Fix:** Export `hasUnsavedMoves()` and check it in beforeunload. Keep unsent positions in sessionStorage and replay them after `load()`. Fix the store.ts:40 comment and the Offline text.
- **Evidence:** 2/2 and 1/1 confirmed against vite/dist/client/client.mjs:1028-1037.

#### R-41 · Low · Edits typed while a save is in flight are silently discarded
- **Where:** src/components/useEditableRecord.ts:123-137 (`commit`), EditChrome.tsx:49.
- **What:** The form stays editable while saving. On success, commit replaces the draft with the saved copy and leaves edit mode unconditionally, and the drafts map entry is deleted.
- **Failure:** Pressing Cmd+S and typing on loses the extra sentence.
- **Fix:** Compare the live draft (held in a ref) with the one sent. If it changed, set base to the saved copy and stay dirty. Or make the form read-only while saving.
- **Evidence:** 2/2 confirmed; no field reads `saving`.

#### R-42 · Low · Closing the orphaned-draft sheet with Esc keeps the dead draft, which returns on a reused ID
- **Where:** src/components/EditChrome.tsx:91; Sheet.tsx:77-79, :101-103; useEditableRecord.ts:54-57.
- **What:** Esc and a scrim click call plain `open.close`, never `ed.discard()`. The draft stays in the module map, so every reload prompts. When a new card reuses the ID (IDs are max+1), it opens with the dead card's draft and base.
- **Failure:** + New card gets US-01.1.5 again and shows the deleted card's content under a conflict banner. Keep mine plus Save writes it.
- **Fix:** Make every exit discard (`onClose={() => { ed.discard(); onClose() }}`). Ignore a stored draft whose base rev belongs to another record.
- **Evidence:** 2/2 confirmed.

#### R-43 · Low · The orphaned-draft sheet shows only text fields, so other unsaved edits are lost unseen
- **Where:** src/components/ItemModal.tsx:126-133, QuestionModal.tsx:85; EditChrome.tsx:89.
- **What:** Parent, status, swimlane, components, related, images, owner, kind and affects edits are never shown. Empty fields are filtered, so the sheet may list only unchanged text.
- **Failure:** A new parent and three related picks vanish when the user presses Discard.
- **Fix:** Show every field that differs from `ed.base.data`, with names for related, affects and parent.
- **Evidence:** 1/1 confirmed.

#### R-44 · Low · A bad journal line crashes `statuses:recode` after the files are rewritten but before the recode is recorded
- **Where:** scripts/recode-statuses.ts:95 (JSON.parse unguarded), :142, :145, :148-152.
- **What:** The journal can legitimately hold a line cut short by a crash (historyJournal.read skips them). The recode rewrites the catalogue, then throws in the journals, so status-recodes.json is never written. A second run plans zero changes and crashes again.
- **Failure:** 300 files are renumbered, the recode is unrecorded, and every diff reads them as real status changes.
- **Fix:** Keep unparseable lines as they are, and write status-recodes.json right after the catalogue files.
- **Evidence:** 2/2 confirmed, reproduced on a scratch copy.

#### R-45 · Low · Settings saves statuses and components with no conflict check
- **Where:** src/views/SettingsView.tsx:288-290, :383-385, :421; server/catalogueApi.ts:530, :553. Merged with "a removed status's number is handed out again" (see R-68).
- **What:** While dirty, the section keeps stale rows, and Save replaces the whole field. Only the removal of in-use codes is blocked. VoiceSection has a base-rev conflict banner, but the config sections do not.
- **Failure:** An agent adds status 7 while the user rewords a help text, and Save deletes status 7.
- **Fix:** Send a per-field base rev, have the server answer 409, and reuse the Load theirs / Keep mine banner.
- **Evidence:** 1/1 confirmed.

#### R-46 · Low · A momentarily invalid board.config.json permanently wipes the saved status filter
- **Where:** src/store.ts:148-150, :679-683 (`dropUnknownStatuses`).
- **What:** Pruning against the fallback default list (R-01) persists to localStorage straight away. A config that is broken for a moment cannot be told apart from a deliberate removal.
- **Failure:** A trailing comma for a second clears the user's "status 6" filter for good.
- **Fix:** Skip pruning while a config issue exists, or prune only the in-memory filter.
- **Evidence:** 1/1 confirmed.

#### R-47 · Low · An unreadable artifact file throws out of loadCatalogue (check crashes, server cannot start)
- **Where:** server/artifactFiles.ts:113; catalogueFs.ts:66-68, :218; catalogueApi.ts:125, :610. Merged with an "also" on REPO_ROOT symlink paths.
- **What:** Every other file problem becomes `fail()`, but `readFileSync` (EACCES, or a race after stat) is unguarded. One file takes down the whole load: `npm run check` stack-traces, configureServer throws, and a running board's sync logs the error and freezes state.
- **Failure:** A chmod 000 SVG makes loadCatalogue throw EACCES.
- **Fix:** try/catch, then `fail(format, "could not be read (code)")`, left uncached.
- **Evidence:** 2/2 confirmed, reproduced.

#### R-48 · Low · `decodeEntities` throws RangeError on an out-of-range numeric entity
- **Where:** shared/artifacts.ts:45-53; callers :74, :99, :334.
- **What:** `Number.isFinite` does not guard `fromCodePoint` above 0x10FFFF. It runs in svgFacts and markdownFacts with no try, so one typo fails the whole catalogue load.
- **Failure:** `&#99999999;` in a transcript breaks `npm run check` and the board load.
- **Fix:** Decode only when `Number.isInteger(code) && code >= 0 && code <= 0x10ffff`.
- **Evidence:** 2/2 confirmed.

#### R-49 · Low · An unstat-able entry in assets/ breaks API start-up, every sync and every delete
- **Where:** server/historyJournal.ts:94 (statSync outside `quietly`); catalogueApi.ts:132, :358, :608. Merged with "a torn shots.json stays broken".
- **What:** A dangling symlink, or a folder removed mid-scan, throws out of `journal.screenshots()`.
- **Failure:** The dev server fails to start, external edits stop appearing, and DELETE returns 500.
- **Fix:** Move the stat into `quietly`, or use withFileTypes and lstat and skip the entry.
- **Evidence:** 1/1 confirmed, reproduced.

#### R-50 · Low · A malformed position entry in board-layout.json makes every layout save fail with 500
- **Where:** server/catalogueFs.ts:90-106 (`readLayout`), :285-302 (`serialiseLayout`); catalogueApi.ts:385-391. Merged from 3 findings across lenses.
- **What:** The entries of `positions` are never validated. A `null` throws in serialise, and a string or array is spread into junk keys. A delete also returns 500 after it has completed.
- **Failure:** `{"positions":{"US-01.1.1":null}}` turns every drag into a 500.
- **Fix:** Keep only entries with finite x and y, report the dropped ones as a layout issue, and return 422 while it stands.
- **Evidence:** 1/1 confirmed, reproduced.

#### R-51 · Low · Viewed store crashes the Diff tab when the stored value is valid non-object JSON
- **Where:** src/diff/viewedStore.ts:15-23.
- **What:** readStore catches only parse errors. A stored `null` makes `readViewed` throw during render, and the write path's catch means the bad value is never repaired. The existing test covers only unparseable text.
- **Failure:** `localStorage[...diff-viewed] = 'null'` breaks /diff permanently in that browser.
- **Fix:** Return the parsed value only if it is a plain object.
- **Evidence:** 1/1 confirmed.

#### R-52 · Low · Find misplaces matches, and can crash, after U+0130 (lower case is two code units)
- **Where:** src/artifacts/find.ts:52-65.
- **What:** `text` gains two code units for "İ" while `at` gains one. Later matches shift, and one near the end reads past `at`, throwing a TypeError in a layout effect.
- **Failure:** In "İzmir ... fee", typing "fee" crashes the artifact page.
- **Fix:** Push one `at` entry per lowered code unit.
- **Evidence:** 1/1 confirmed in a jsdom vitest.

#### R-53 · Low · `remove.ts descendantsOf` returns the root on a cycle; DELETE fails part way with ENOENT
- **Where:** shared/remove.ts:26-33; server/catalogueApi.ts:355-394.
- **What:** The guard skips only cards already in `out`, and the root is never in it. So doomed = [root, ..., root], and the second unlink throws after the reference rewrites and first removal have run.
- **Failure:** A self-parented story produces a 500 mid-delete: other doomed items remain and layout cleanup is skipped.
- **Fix:** Seed the visited set with the root. Make deleteItemFile tolerate ENOENT, or de-duplicate.
- **Evidence:** 1/1 confirmed.

#### R-54 · Low · A reused item ID inherits the deleted card's git history and bare mentions; SCHEMA says IDs are never reused
- **Where:** server/catalogueApi.ts:425-431, shared/ids.ts:26-38, server/gitHistory.ts:151, shared/history.ts:259-269, requirements/SCHEMA.md:73, :451. Merged from 3 findings plus 2 "also" entries.
- **What:** ID reuse after deleting the highest card is deliberate and tested (historyJournal `forget`), but history is not: gitFileHistory returns the path's whole log, including the deletion as a null version, and buildTimeline does not reset at it. A hand delete never calls `forget`. Bare mentions kept "as history" silently point at the new card. SCHEMA, shipped in every kit, still says "no deletes" and "never reused".
- **Failure:** A new US-01.1.6 shows as an edit of the deleted "Old mistaken card", with its commits underneath.
- **Fix:** Cut git versions at or before the last null (deletion) version, and call `journal.forget` when syncFromDisk sees an item disappear. Bring SCHEMA in line with the board, or reserve deleted IDs with a tombstone list.
- **Evidence:** 2/2, 1/1 and 2/2 confirmed. Note the refuted appendix item A-1: reuse itself is deliberate.

#### R-55 · Low · Every Freeform save is refused when the lane list on disk breaks a rule the check never reports
- **Where:** server/catalogueApi.ts:575-586; catalogueFs.ts:90-105; shared/move.ts:142-154.
- **What:** PUT /api/layout validates the disk lane list even for a positions-only body, but readLayout and the check never flag a lane over 40 characters, a case duplicate or an "Unassigned" clash. SCHEMA omits the 40-character limit.
- **Failure:** A 46-character lane name turns every drag into "Card moves not saved yet", retried for ever, while Checks stay clean.
- **Fix:** Validate only when `lanes` or `firstLane` change (or treat an existing problem as pre-existing). Report lane-list problems in check, and document the limit.
- **Evidence:** 2/2 confirmed, reproduced.

#### R-56 · Low · Lane rename is two writes: stories are renamed even when the lane-list save fails
- **Where:** src/store.ts:313-314, :271-281.
- **What:** The batch renames the stories first (`record: false`), then setLanes runs. Its failure (for example 422 on an unreadable layout) leaves the stories orphaned, outside undo.
- **Failure:** A merge-conflict marker in board-layout.json turns a rename into stories in an unlisted lane "Now", with nothing to undo.
- **Fix:** Save the lane list first, or send the inverse batch on failure.
- **Evidence:** 1/1 confirmed.

#### R-57 · Low · Deleting a card leaves its position in pending saves and undo, which can write an orphan position
- **Where:** src/store.ts:194-206 (`deleteItem`), :382-387 (`step`).
- **What:** pendingLayout and the past/future position entries keep the deleted ID. Undoing an earlier drag writes it back, and a reused ID then starts at that spot.
- **Failure:** Drag, delete, Cmd+Z leaves board-layout.json holding a position for a missing file.
- **Fix:** Strip the deleted IDs from pendingLayout and history. Have the server ignore positions for unknown IDs.
- **Evidence:** 1/1 confirmed; the verifier notes the case is narrower than first stated.

#### R-58 · Low · The initial-load snapshot can overwrite a newer change event
- **Where:** src/store.ts:105-114; src/App.tsx:37-60.
- **What:** Events on the WebSocket can arrive while the 2.5 MB snapshot is still parsing, then `load()` overwrites them with older data.
- **Failure:** An agent's delete during start-up leaves a ghost card that returns 404 on save.
- **Fix:** Buffer events while loading and replay them after the snapshot.
- **Evidence:** 1/1 confirmed.

#### R-59 · Low · Two overlapping failed layout saves restore the older batch over the newer one
- **Where:** src/store.ts:349-361 (`flushLayout`).
- **What:** "Newer moves win" holds only for unsent moves. If flush A is in flight while B sends p2, both fail, and A's p1 is spread over B.
- **Failure:** The next retry writes p1, and the card jumps back.
- **Fix:** Serialise flushes (as moveQueue does), or merge with sequence numbers.
- **Evidence:** 1/1 confirmed in a scratch vitest.

#### R-60 · Low · `unlink` and `mentions` strip code differently and disagree on images, so a delete is refused with 422
- **Where:** shared/remove.ts:38, :45; shared/links.ts:27, :30-32; server/catalogueApi.ts:369. Merged from 2 findings.
- **What:** remove.ts uses one left-to-right alternation, so a stray backtick pairs with a later fence's backtick. links.ts strips fences first. unlink skips `![x](ID)`, but mentions counts it. A surviving link to the doomed item is a check error, and `guard()` refuses the delete. The delete dialog has just said such links become plain text.
- **Failure:** "Press the ` key, then see [the other story](US-01.1.2)." plus a fenced block returns 422 when deleting US-01.1.2.
- **Fix:** Export one code-masking helper from links.ts and use it in both places. Unlink image links with ID hrefs too. Add a property test: after unlink, no explicit link into the gone set.
- **Evidence:** 2/2 and 1/1 confirmed, reproduced with createCatalogueApi.

#### R-61 · Low · Backtick code spans match across blank lines, hiding real links
- **Where:** shared/links.ts:31; shared/remove.ts:38; check.ts:339 joins fields.
- **What:** In CommonMark a code span cannot cross a blank line. Here a stray backtick swallows paragraphs, so the check, backlinks and unlink all miss the links while the board renders them.
- **Failure:** A stray backtick hides `[the rule](US-01.1.1)`. Deleting US-01.1.1 leaves a live link to nothing, and the check stays green.
- **Fix:** Confine spans to a paragraph (`(?:(?!\n[ \t]*\n)[\s\S])*?`) in the shared helper (R-60).
- **Evidence:** 1/1 confirmed.

#### R-62 · Low · Artifact index joins an item's fields before stripping code
- **Where:** src/artifactIndex.ts:48.
- **What:** `mentions(itemTexts(it).join('\n\n'))` lets a backtick in one field pair with one in another. itemLinkTargets works per field.
- **Failure:** The AR-03 page omits a story whose acceptance links to AR-03#step-2.
- **Fix:** Extract mentions per field.
- **Evidence:** 1/1 confirmed.

#### R-63 · Low · A malformed percent-escape in an ID path returns 500
- **Where:** server/catalogueApi.ts:295, 308, 327, 345, 356, 456, 464; cataloguePlugin.ts:167, :286.
- **What:** A bare `decodeURIComponent` throws URIError, which becomes a 500 or reaches Vite's error middleware.
- **Failure:** `PUT /api/items/%E0%A4%A` returns 500.
- **Fix:** Wrap decoding in a helper that maps the error to HttpError(400), and return false or 404 in the serve functions.
- **Evidence:** 1/1 confirmed (minor impact).

#### R-64 · Low · `createAtomic` relies on hard links, so creates fail on exFAT and some network mounts
- **Where:** server/catalogueFs.ts:235-247; callers :251, :257, scripts/new-artifact.ts:123.
- **What:** `linkSync` returns EPERM or ENOTSUP there. Only EEXIST is translated, and edits work only because they use rename.
- **Failure:** "New story" fails with EPERM on an exFAT drive.
- **Fix:** On EPERM, ENOTSUP or EXDEV, fall back to `writeFileSync(file, text, {flag:'wx'})`.
- **Evidence:** 1/1 confirmed on an ExFAT disk image.

#### R-65 · Low · `listMd` loads dotfiles (AppleDouble, Emacs locks) as records
- **Where:** server/catalogueFs.ts:72-83.
- **What:** `._US-01.1.1.md` and `.#US-01.1.1.md` become "not named after an ID" warnings and "could not be read" errors.
- **Failure:** A Mac tarball unpacked on Linux makes `npm run check` exit 1 on a healthy catalogue.
- **Fix:** Filter names starting with ".".
- **Evidence:** 1/1 confirmed, reproduced.

#### R-66 · Low · A UTF-8 BOM makes a record fail with a misleading fence error
- **Where:** shared/files.ts:28-29.
- **What:** U+FEFF is kept by readFileSync, so the fence check fails, and the record and its children's parent vanish.
- **Failure:** EP-01 saved "UTF-8 with BOM" gives "file must start with a --- frontmatter fence".
- **Fix:** Strip a leading BOM.
- **Evidence:** 1/1 confirmed.

#### R-67 · Low · `artifact:new` moves the file before claiming the ID and does not retry
- **Where:** scripts/new-artifact.ts:60, :82-100, :123.
- **What:** Two runs can pick the same AR-nn. The loser has already moved its file with `git mv` (staged) and then crashes on FileExistsError. Drawing copies use copyFileSync without COPYFILE_EXCL and overwrite each other.
- **Failure:** Two sessions leave a transcript moved and staged with no sidecar, and links attach to the other artifact.
- **Fix:** Claim the ID with createAtomic in a loop (as the API does), then bring the file in, and remove the sidecar if that fails.
- **Evidence:** 1/1 confirmed.

#### R-68 · Low · `nextStatusCode` reuses a removed status's number
- **Where:** shared/statuses.ts:68; SettingsView.tsx:415.
- **What:** The next code is max+1 over the current list. A removed top code is freed, though history and recodes still store it with its old meaning.
- **Failure:** "On hold" (7) is removed and "Deferred" later gets 7, so old versions read as Deferred.
- **Fix:** Allocate past every code ever used (a high-water mark in config, plus the recode keys and values), or keep tombstones.
- **Evidence:** 1/1 confirmed.

#### R-69 · Low · A folder moved with plain `mv` (unstaged) reads as all records added, with no history
- **Where:** server/gitRenames.ts:51; cache keys at gitHistory.ts:133, 157, 231, 254.
- **What:** `git diff -M HEAD` never sees untracked new paths. The header promises renames "made in the working tree", and agents use mv mid-phase. Histories read before staging stay cached as empty until the next commit.
- **Failure:** After `mv docs/requirements board/requirements`, every record shows as added.
- **Fix:** Pair deleted HEAD files with untracked files of the same blob (ls-files `--deleted`/`--others` plus hash-object). Include the rename set in the cache keys.
- **Evidence:** 2/2 confirmed. Lowered to low because the state lasts only until the next commit.

#### R-70 · Low · `priorPaths` has no time bound; a file absorbs a later file at its old path
- **Where:** server/gitRenames.ts:58-67; gitHistory.ts:137-138, :235-236; cataloguePlugin.ts:246.
- **What:** Old paths are logged over all of history.
- **Failure:** After pricing.svg is archived to pricing-v1.svg and a new pricing.svg added, the archive's history shows the new diagram.
- **Fix:** Return each prior path with its boundary commit, and accept only commits at or before it.
- **Evidence:** 2/2 confirmed, reproduced.

#### R-71 · Low · Moving one screenshot merges the source card's whole screenshot history into the target
- **Where:** server/gitRenames.ts:70-81 (`priorDirs`); gitHistory.ts:182-192.
- **What:** One file renamed into a folder makes its source folder a prior location of the whole folder, and every M line there is rewritten as this card's.
- **Failure:** After b.png moves from US-1 to US-2, every recapture of US-1's a.png shows in US-2's history.
- **Fix:** Follow screenshot history per file via priorPaths, with bounds.
- **Evidence:** 2/2 confirmed, reproduced.

#### R-72 · Low · Diff flags an unchanged artifact file as changed under autocrlf, eol or LFS
- **Where:** server/catalogueDiff.ts:313-325 (worktree `blobShas`), gitHistory.ts:87.
- **What:** Raw bytes are hashed without git's clean filters.
- **Failure:** With autocrlf=true, a description-only edit shows a phantom file change, and an LFS "before" renders the pointer text.
- **Fix:** Use `git hash-object --stdin-paths`, or reuse the index blob when the file is clean. Apply the same to gitAssetHistory's `working`.
- **Evidence:** 2/2 confirmed, reproduced.

#### R-73 · Low · SHA-256 repositories: asset and screenshot history is always empty
- **Where:** server/gitHistory.ts:189, :246 (40-hex regexes), :221; historyJournal.ts:41, :107.
- **What:** The kit supports SHA-256 elsewhere and has a test for it, but these regexes and the SHA-1 working and journal hashes do not.
- **Failure:** In `git init --object-format=sha256`, gitAssetHistory and gitScreenshots return 0 commits.
- **Fix:** Use `[0-9a-f]{40}|[0-9a-f]{64}`, and hash with the repository's algorithm.
- **Evidence:** 1/1 confirmed, reproduced.

#### R-74 · Low · Cached commit-to-commit comparisons keep artifact context from the first read
- **Where:** server/catalogueDiff.ts:626-632, :716, :765.
- **What:** Context is filtered against "today" once, and the result is cached under a key with no generation, so touched() never invalidates it.
- **Failure:** After AR-01 is renamed on disk, the A..B comparison labels AR-01 with the new name.
- **Fix:** Cache the raw indexes and apply `then()` per response, or add the generation to the key.
- **Evidence:** 1/1 confirmed, reproduced.

#### R-75 · Low · A `cited_as` spot naming a page or line range is an error
- **Where:** shared/sources.ts:230; contrast check.ts:168-176 (`regionExists`).
- **What:** citationProblems accepts only regions, steps and heading slugs, yet the add-artifact skill and every resolver treat `p27` and `L1-10` as spots.
- **Failure:** `spot: p27` fails `npm run check` with "is not a region".
- **Fix:** Validate through a shared regionExists.
- **Evidence:** 2/2 confirmed.

#### R-76 · Low · Page, line and point spots go unchecked on files without that dimension; reversed ranges pass
- **Where:** shared/sources.ts:131, :137, :145-148, :166 (`hasRegion`); shared/types.ts:343. Merged from 2 findings.
- **What:** Problems are raised only when the fact is non-null, and the check sets null exactly when a format lacks the dimension. A line range checks only `to`. `L33-27` and `L0` pass, yet linesOfRegionId rejects them. SCHEMA promises a warning for a missing point, page or line.
- **Failure:** "Transcript A p.3", "Diagram X p.2" and "Transcript A L33-27" all pass, and the sheet links to nothing.
- **Fix:** Warn by format, and when linesOfRegionId returns null. Use linesOfRegionId in hasRegion.
- **Evidence:** 2/2 and 2/2 confirmed.

#### R-77 · Low · An item's `artifacts:` entry is refused for heading slugs containing `_` or non-ASCII letters
- **Where:** shared/check.ts:321; links.ts:79 (`pastedTarget`).
- **What:** The shape regex `[A-Za-z0-9-]+` is narrower than slugify (`\p{L}\p{N}_-`). The text-link form passes.
- **Failure:** `artifacts: [AR-05#te-reo-māori]` errors, and the board refuses later saves.
- **Fix:** Loosen to `[^\s#]+` (u flag) and let artifactRefProblem decide.
- **Evidence:** 1/1 confirmed (latent today).

#### R-78 · Low · Any source starting `OQ-` is taken whole as a question ID
- **Where:** shared/sources.ts:190; links.ts:21.
- **What:** "OQ-01 · answered by Sam" becomes the ID.
- **Failure:** The check warns "names a question that does not exist", and the row links nowhere.
- **Fix:** Match `^(OQ-\d+)` and return the captured ID.
- **Evidence:** 1/1 confirmed.

#### R-79 · Low · Hand-on to a replacement artifact keeps problems worked out against the retired one
- **Where:** shared/sources.ts:171-182, :222.
- **What:** Spots and problems are computed on the retired artifact, then kept wholesale by `latest()`.
- **Failure:** "Old spec p.40" opens AR-02 p40 but warns "AR-01 has no page 40".
- **Fix:** Resolve supersededBy first, then compute spots against the final artifact.
- **Evidence:** 1/1 confirmed.

#### R-80 · Low · Point lists misparse: `#2#3` gives NaN, and `#2, #3` drops #3
- **Where:** shared/sources.ts:102-113.
- **What:** The whitespace split and the comma tail both slip past.
- **Failure:** A non-existent #9 after a comma is never checked.
- **Fix:** Extract points with `/#(\d+)/g`, and allow or reject `, #n` explicitly.
- **Evidence:** 1/1 confirmed.

#### R-81 · Low · The unresolved-note warning names the wrong file
- **Where:** shared/sources.ts:195-212.
- **What:** When the note exists but the tail is malformed, the reason still says "no note", and its re-split lacks `p\.\d`, slugging "p.3" into the name.
- **Failure:** Warns "no note notes/2026-10-09-gone-meeting-p3.md".
- **Fix:** Reuse `words`, and give a tail-specific reason.
- **Evidence:** 1/1 confirmed.

#### R-82 · Low · A note registered by two sidecars resolves silently to one of them
- **Where:** shared/sources.ts:83; check.ts:241-248, :392. Merged with "an artifact listing a prefix twice clashes with itself".
- **What:** `notes.set` overwrites, and no check compares `file` across artifacts.
- **Failure:** Running `artifact:new` twice on one note leaves AR-66 showing no citations, with a green check.
- **Fix:** Report a note clash, or error on any two artifacts sharing a file. De-duplicate an artifact's own prefixes.
- **Evidence:** 1/1 confirmed.

#### R-83 · Low · Server heading and quote text differ from what the reader matches
- **Where:** shared/artifacts.ts:217-224 (`inlinePlain`), :262 (ATX regex), markdownReadable; check.ts:216-218.
- **What:** `_` and `*` are stripped even within words, entities stay encoded, a trailing `#` is eaten, `~~` is kept, `[text][ref]` is kept and autolinks are deleted.
- **Failure:** `heading=fee_schedule rules` fails the check but highlights on the board. `Q&amp;A` is listed as slug `qampa`, which never resolves.
- **Fix:** Derive both sides from the same remark parse, or fix each rule.
- **Evidence:** 1/1 confirmed.

#### R-84 · Low · `matchSimpleSelector` treats an empty comma part as matching every element
- **Where:** shared/artifacts.ts:113, :131.
- **What:** A trailing comma parses as an unconstrained compound, while the browser throws SyntaxError.
- **Failure:** `rect.panel,` only warns about a box spanning 3 elements, and the region never draws.
- **Fix:** Return null or 0 for an empty part.
- **Evidence:** 1/1 confirmed.

#### R-85 · Low · `lintFrontmatter` flags `#` inside YAML block scalars the board itself writes
- **Where:** shared/files.ts:193-215. Merged with "warns on quoted first keys of list mappings".
- **What:** The lint is line by line with no block-scalar awareness, and the advice to quote would corrupt the caption.
- **Failure:** The step caption "Pays invoice #3 in full" (written as `|-`) is a false warning.
- **Fix:** Skip block-scalar continuation lines, or confirm the hit against the parsed value.
- **Evidence:** 1/1 confirmed.

#### R-86 · Low · `planMove` puts a card at the top when dropped at the foot of a stack holding a low-order retired card
- **Where:** shared/move.ts:72-81; src/board/mappedLayout.ts:204.
- **What:** lo and hi come from order-sorted `siblings`, while index comes from live-first `peers`. A drop back in place also rewrites the siblings.
- **Failure:** With Show retired on, dropping at the foot puts the card above both live stories and rewrites 3 files.
- **Fix:** Count slots among live peers only. Add tests.
- **Evidence:** 2/2 confirmed, reproduced.

#### R-87 · Low · Card timeline duplicates a change when the first journal entry is offline
- **Where:** shared/history.ts:255, :260-291; server/historyJournal.ts:84, :128-136. Merged with "a card first seen silently loses its Created entry".
- **What:** `start` is taken from the first journal entry, but baseline() began watching earlier without one. The offline entry is stamped at start-up, after the commit.
- **Failure:** A retitle appears twice, once from git and once as "changed while the board was off".
- **Fix:** Record a baseline timestamp and use it as `start`. Add a test.
- **Evidence:** 2/2 confirmed.

#### R-88 · Low · `isMinorChange` counts joined paragraphs or merged bullets as spacing-only
- **Where:** shared/history.ts:143; textCompare.ts:30.
- **What:** squashSpace collapses newlines, which carry Markdown structure. Such records are hidden and left out of the count.
- **Failure:** Merging two acceptance bullets into one is hidden by default.
- **Fix:** Compare block structure (splitBlocks) as well as the squashed text.
- **Evidence:** 1/1 confirmed.

#### R-89 · Low · Inserting one numbered list item makes every later item an unmarked "edited" row
- **Where:** shared/proseDiff.ts:107 (`keyOf`), :326-336.
- **What:** Keys include the list marker, but markPair strips it, so renumbered items become marked-nothing edits that never fold. Bullet changes do the same.
- **Failure:** An inserted point 2 shows 5 unchanged points as edited, and none fold.
- **Fix:** Normalise markers in keyOf, or treat lead-only differences as 'same'.
- **Evidence:** 2/2 confirmed.

#### R-90 · Low · A change ending inside a multi-line code span marks the rest of the block as changed
- **Where:** src/diff/diffMarks.ts:34-53; shared/proseDiff.ts:199, :285-299.
- **What:** Leaf nodes strip sentinels without updating `on`, so a lost MARK_CLOSE marks everything after it.
- **Failure:** The unchanged rest of a paragraph shows struck and green.
- **Fix:** Walk the leaf's sentinels to set `on` before stripping. Add a test.
- **Evidence:** 1/1 confirmed.

#### R-91 · Low · An edited mermaid diagram shows no drawings, and Whole card calls it "File, unchanged"
- **Where:** src/diff/DiffCard.tsx:322; DiffFile.tsx:66, :72; server/catalogueDiff.ts:583, :605-610. Merged with "the Open button assumes After is now".
- **What:** Mermaid has no file, so `fileChanged` is always false.
- **Failure:** An added node shows only a source line diff, and Whole card tags the two different pictures "unchanged".
- **Fix:** Treat a `source` change as a drawing change for mermaid.
- **Evidence:** 2/2 confirmed.

#### R-92 · Low · A file that changes between Markdown and another format shows a broken image
- **Where:** src/diff/DiffFile.tsx:67-77, :35-51.
- **What:** Only both-Markdown goes to documents. A single Markdown side falls to `<img>`.
- **Failure:** AR-07 moving from .md to .svg shows a broken image for Before.
- **Fix:** Render the Markdown side with OneDocument.
- **Evidence:** 1/1 confirmed.

#### R-93 · Low · A Viewed tick in one tab overwrites ticks made in another
- **Where:** src/diff/viewedStore.ts:25-36, :47-62.
- **What:** The whole comparison entry is replaced from this tab's memory, and there is no storage listener.
- **Failure:** Tab B's tick erases tab A's.
- **Fix:** Merge only the changed key, and optionally listen for storage events.
- **Evidence:** 1/1 confirmed.

#### R-94 · Low · While a new comparison loads, old empty-state or error messages stay up under the new refs
- **Where:** src/diff/DiffView.tsx:126-127, :164-179; useDiffData.ts:116.
- **What:** `stale` is checked only in the card-stream branch, and `error` is cleared only on success. This breaks the CHANGELOG "Reading git" promise.
- **Failure:** "No card differs" shows for the newly named versions for several seconds.
- **Fix:** Check stale first, and clear error on a key change.
- **Evidence:** 1/1 confirmed.

#### R-95 · Low · History timeline keys entries by index, so a refresh moves open state to another entry
- **Where:** src/components/HistoryView.tsx:97, :109; also ArtifactHistory.
- **What:** A new entry at index 0 shifts each entry's open and "gone" state down by one.
- **Failure:** An expanded diff folds and moves, and "Not kept" shows for an existing version.
- **Fix:** Key by type, time and sha.
- **Evidence:** 2/2 confirmed.

#### R-96 · Low · History does not refresh when a screenshot is re-captured
- **Where:** src/components/HistoryView.tsx:20-35; catalogueApi.ts:604-640.
- **What:** The effect depends on rev and position, and screenshot journalling emits no event.
- **Failure:** The "Screenshot updated" entry is missing until the user reopens the card.
- **Fix:** Emit an assets event or fingerprint, shared with R-104.
- **Evidence:** 1/1 confirmed.

#### R-97 · Low · Line diff always shows the first and last lines as context
- **Where:** src/components/HistoryView.tsx:348-362.
- **What:** `undefined !== 'same'` is true at the edges.
- **Failure:** A one-line change in 60 lines shows stray lines 1 and 60.
- **Fix:** Treat a missing neighbour as unchanged.
- **Evidence:** 1/1 confirmed.

#### R-98 · Low · "Highlight could not be found" flag is wiped on a spot change in an already-loaded viewer
- **Where:** src/artifacts/ArtifactViewer.tsx:54-55; viewers' layout effects (CanvasViewer.tsx:282, MarkdownReader.tsx:117, PdfReader.tsx).
- **What:** The child's layout effect sets false, then the parent's passive reset sets null in the same commit.
- **Failure:** Clicking a stale region shows no box and no warning.
- **Fix:** Key `found` by spot, or reset during render.
- **Evidence:** 2/2 confirmed, reproduced in React 18.3.1 jsdom.

#### R-99 · Low · Region requests snap rather than ease: placement key split on a `|` that focusKey contains
- **Where:** src/artifacts/CanvasViewer.tsx:305, :316; ArtifactPage.tsx:53.
- **What:** focusKey is `spot|asks`, so `prev[2]` is the region, `first` is always true, and every request jumps.
- **Failure:** Clicking region B teleports instead of easing over 420 ms.
- **Fix:** Store the previous placement as an object, or keep separate refs.
- **Evidence:** 2/2 confirmed.

#### R-100 · Low · Markdown and PDF readers keep the old red box when a region changes on disk
- **Where:** src/artifacts/MarkdownReader.tsx:87, :133; PdfReader.tsx:388, :435.
- **What:** The effect keys use region.id only, and observers close over the old spot.
- **Failure:** A fixed quote leaves the flag cleared but no box drawn.
- **Fix:** Add the region's content to the keys, and read the spot via a ref.
- **Evidence:** 2/2 confirmed.

#### R-101 · Low · quote= is NFC-normalised in the check but not in the viewer
- **Where:** src/artifacts/regionsDom.ts:94-105; shared/artifacts.ts:42; check.ts:218; artifactFiles.ts:135.
- **What:** The check normalises both sides to NFC. The viewer normalises only the quote, not the DOM text.
- **Failure:** NFD "Māori health" passes `npm run check`, but no box is drawn.
- **Fix:** Build `loose` from NFC text with an index map back to the source.
- **Evidence:** 1/1 confirmed.

#### R-102 · Low · An in-drawing `href="#..."` link navigates the HashRouter away
- **Where:** src/artifacts/CanvasViewer.tsx:188; sanitise.ts:33; svgLinks.ts:62; main.tsx (HashRouter).
- **What:** Fragment links are kept on purpose, but the click is not prevented, so `location.hash` becomes a route.
- **Failure:** A diagram's table of contents link sends the reader to the board instead.
- **Fix:** Prevent default on every non-record `<a>`, and pan to the target instead.
- **Evidence:** 1/1 confirmed. The verifier notes it falls back to the board rather than an unknown route.

#### R-103 · Low · History compare labels every load failure "Not kept: never committed"
- **Where:** src/artifacts/VisualCompare.tsx:24, :88; ArtifactHistory.tsx:75.
- **What:** Mermaid parse errors, empty sources and pdf.js errors all get the "never committed" text.
- **Failure:** An invalid but committed source reads as never committed.
- **Fix:** Show "Could not be drawn: <error>" for sources, keep "Not kept" for a 404 blob (after R-22), and treat empty as "Not there yet".
- **Evidence:** 1/1 confirmed.

#### R-104 · Low · Gallery and lightbox URLs carry no version, so re-captured shots show stale images
- **Where:** src/components/Screenshots.tsx:66, :99; src/api.ts:91 (`assetUrl`); scripts/capture.ts:623-629.
- **What:** Capture overwrites files in place, and no event fires. Artifact files use `?v=fileRev`, but assets do not.
- **Failure:** The open card shows the old picture after `npm run capture`.
- **Fix:** Expose a per-asset version (the journal already fingerprints screenshots) and append `?v=`.
- **Evidence:** 2/2 confirmed.

#### R-105 · Low · The lightbox opened from the docked card sits under the New card button and the divider
- **Where:** src/components/Screenshots.tsx:73-111; styles.css:622-635 (`.dock` z-index 5).
- **What:** `.dock` creates a stacking context, so the lightbox's z-index 70 ranks below `.new-card` (8) and `.dock-resizer` (6).
- **Failure:** The + button stays clickable over the lightbox, and the divider still drags.
- **Fix:** Portal the lightbox to document.body.
- **Evidence:** 2/2 confirmed by stacking analysis (no browser run).

#### R-106 · Low · A saved Kind or Area filter on the Artifacts tab can hide everything with no control to clear it
- **Where:** src/views/ArtifactsView.tsx:28-32, :58; artifactIndex.ts:129-139, :163-168.
- **What:** Statuses keep picked-but-absent options visible, but kinds and components do not. The filter persists in localStorage.
- **Failure:** "Nothing matches." with no visible control, and it survives reloads.
- **Fix:** Include picked values in kindsPresent and componentsPresent, as statuses do.
- **Evidence:** 2/2 confirmed.

#### R-107 · Low · A docked orphaned draft swallows every guarded navigation with no prompt
- **Where:** src/components/ItemModal.tsx:60-67, :117; EditChrome.tsx:91; useEditableRecord.ts:76-80.
- **What:** The guard is still registered, `leave()` stores pending, but OrphanedDraft's Sheet has no `confirm` veil.
- **Failure:** Clicking other cards or the empty board does nothing.
- **Fix:** Pass the discard confirm to OrphanedDraft, or run `go()` directly while orphaned.
- **Evidence:** 2/2 confirmed.

#### R-108 · Low · Guarded links in a question sheet over a dirty docked item raise an invisible veil
- **Where:** src/components/NewCardButton.tsx:132-136; nav.ts; ArtifactRows.tsx:50, :63; Prose.tsx:162, :195. Merged with "guarded creation runs a stale closure".
- **What:** The docked guard fires while a modal makes the dock inert. The veil appears behind the scrim and waits until the sheet is closed.
- **Failure:** A Sources click does nothing, and later "Discard changes" jumps to a forgotten artifact.
- **Fix:** Run `go()` straight away when a modal scrim is open, or guard question creation too.
- **Evidence:** 1/1 confirmed (code trace only).

#### R-109 · Low · Modal sheets opened in edit mode lose title autofocus and restore focus to a detached node
- **Where:** src/components/Sheet.tsx:85-87; ItemModal.tsx:584; QuestionModal.tsx:337.
- **What:** The passive effect focuses the container after autoFocus has run, and it captures `previous` as the in-sheet input.
- **Failure:** Typing in a newly created card goes nowhere, and focus falls to body on close.
- **Fix:** Capture `previous` at render, and focus the container only if focus is not already inside.
- **Evidence:** 1/1 confirmed in jsdom.

#### R-110 · Low · The veil focus effect re-runs on every render and snaps focus back
- **Where:** src/components/Sheet.tsx:118-123; EditChrome.tsx:57-67.
- **What:** `confirm` is a new object each render, and any catalogue event re-renders.
- **Failure:** Focus is yanked from the board search box to "Keep editing" when an agent writes a file.
- **Fix:** Depend on `!!confirm` (or the title).
- **Evidence:** 1/1 confirmed.

#### R-111 · Low · Cmd/Ctrl+S saves an unchanged record, bypassing the dirty gate
- **Where:** src/components/useEditableRecord.ts:123-148, :163-168; EditChrome.tsx:49.
- **What:** The save rewrites the file in canonical form, journals it and keeps a blank new card.
- **Failure:** A spurious git and Diff change on an agent-written card. An "Untitled" card can no longer be dropped.
- **Fix:** Save only when dirty, still calling preventDefault.
- **Evidence:** 1/1 confirmed.

#### R-112 · Low · A sheet opened while its record is missing never picks it up
- **Where:** src/components/useEditableRecord.ts:45-46, :61; ItemModal.tsx:140; QuestionModal.tsx:41, :96.
- **What:** base and draft are seeded only in useState initialisers, and the effect bails out on `!base`.
- **Failure:** After a broken file is fixed, the open sheet still says "not in the catalogue".
- **Fix:** Adopt the record when `rec && !base`, and set the anchor lazily.
- **Evidence:** 1/1 confirmed.

#### R-113 · Low · Mapped never draws the open card when a retired ancestor is hidden
- **Where:** src/board/mappedLayout.ts:111-113; graph.ts:31; BoardView.tsx:179. Merged with "dropping an epic's only direct story back moves it".
- **What:** isShown exempts the selected card, not its ancestors, so it gets no column.
- **Failure:** "Show on board" for a live story under a retired feature centres on nothing.
- **Fix:** Keep the selected card's lineage visible.
- **Evidence:** 2/2 confirmed.

#### R-114 · Low · Mapped hides the open card inside a collapsed lane
- **Where:** src/board/graph.ts:66; mappedLayout.ts:142-175; BoardView.tsx:345-350.
- **What:** The collapsed test has no exemption for the selected card, so focus pans to an empty strip.
- **Failure:** "Show on board" for an MVP story with MVP collapsed shows nothing.
- **Fix:** Exempt the selected card, or expand its lane on select or focus.
- **Evidence:** 1/1 confirmed.

#### R-115 · Low · Enter is swallowed on buttons inside the canvas while a card is open
- **Where:** src/views/BoardView.tsx:399-413.
- **What:** `onCanvas` includes any element inside `.react-flow`: lane headers, the menu, add slots, minimap.
- **Failure:** Enter on "Add lane" does nothing and focus jumps to the panel.
- **Fix:** Exclude buttons, links and menu items.
- **Evidence:** 2/2 confirmed.

#### R-116 · Low · Arrow walk and search zoom to 0.9 only sometimes
- **Where:** src/views/BoardView.tsx:307-320, :351-358, :408, :514-518.
- **What:** The selection effect, 80 ms later, retargets the 450 ms ease at the old zoom when the card is still off screen.
- **Failure:** Search Enter at zoom 0.3 stays at 0.3.
- **Fix:** Skip the effect while a board-initiated ease is in flight, or pass its target zoom.
- **Evidence:** 1/1 confirmed.

#### R-117 · Low · `centreOn` centres wide epics on their midpoint, hiding the title
- **Where:** src/views/BoardView.tsx:320; mappedLayout.ts:117.
- **What:** An 8-feature epic is about 1920 screen px wide, and inView already allows CARD_PEEK for this.
- **Failure:** ArrowUp to an epic leaves its title under the panel.
- **Fix:** Centre on `min(w, CARD_PEEK)` from the left edge.
- **Evidence:** 1/1 confirmed.

#### R-118 · Low · Arrow keys mix an epic's features and direct stories
- **Where:** src/views/BoardView.tsx:410-418; store.ts:446-457. Merged with "ArrowUp/Down step through stories in file order".
- **What:** One sibling list across types, unlike how the layouts draw them.
- **Failure:** ArrowDown from a direct story opens a feature in another column.
- **Fix:** Filter siblings by kind (and lane, in drawing order).
- **Evidence:** 1/1 confirmed.

#### R-119 · Low · A "not a lane" band that differs only in case, or names the first lane, cannot be fixed on the board
- **Where:** src/board/mappedLayout.ts:135-137; LaneHeaders.tsx:123; shared/move.ts:142-154.
- **What:** The band test is case-sensitive, while laneListProblem is case-insensitive. Both fixes offered append a duplicate.
- **Failure:** `swimlane: mvp` with lane MVP: "Add as a lane" and rename are both refused.
- **Fix:** Fold case matches and the first-lane name, and let a rename onto an existing lane merge.
- **Evidence:** 1/1 confirmed.

#### R-120 · Low · Renaming a collapsed lane reopens it and leaves a stale collapsed key
- **Where:** src/board/LaneHeaders.tsx:83; store.ts:630-672.
- **What:** collapsedLanes is keyed by name and never updated on rename or delete.
- **Failure:** A later new lane "MVP" starts collapsed.
- **Fix:** Rewrite or drop the key on rename and delete.
- **Evidence:** 1/1 confirmed.

#### R-121 · Low · A question whose status is not configured is counted but never listed
- **Where:** src/questionWalk.ts:39, :46-49; src/views/QuestionsView.tsx:21-24, :117; App.tsx:128. Merged from 2 findings.
- **What:** Groups come only from configured codes, but the masthead count uses `!isAnswered`.
- **Failure:** `status: Open` on OQ-42 gives a count of 12 with 11 listed, "Nothing matches" when it is alone, and no stepper.
- **Fix:** Add a trailing "Unknown status" group to the list and the walk.
- **Evidence:** 1/1 and 1/1 confirmed.

#### R-122 · Low · Outline drops cards with a missing or wrong-type parent, even from search
- **Where:** src/views/OutlineView.tsx:50-58, :108; store.ts:443-458.
- **What:** The walk starts only from parentless epics, while the header counts include the orphans.
- **Failure:** Searching "US-04.2.7" (parent typo) says "Nothing matches".
- **Fix:** Add a final "Without a parent" group, subject to search.
- **Evidence:** 1/1 confirmed.

#### R-123 · Low · Adding the first component turns every other used component into an error, with no warning
- **Where:** src/views/SettingsView.tsx:304, :316-317; shared/check.ts:82, :101, :230; catalogueApi.ts:552. Merged with "a name matching an in-use component locks the row".
- **What:** An empty list accepts anything, and nothing shows the components in use.
- **Failure:** Saving "Billing" turns every "Mobile" and "Admin" tag red.
- **Fix:** List in-use components as suggestions, or warn or block.
- **Evidence:** 1/1 confirmed.

#### R-124 · Low · Component "Used by" ignores artifacts, so a remove looks allowed and then fails
- **Where:** src/views/SettingsView.tsx:293-297, :315; catalogueApi.ts:545-551. Merged with "a lower-case code makes the section always dirty".
- **What:** The count covers items only, while the server guard counts artifacts too.
- **Failure:** "Used by: None", then a 422 on Save.
- **Fix:** Count artifacts.
- **Evidence:** 1/1 confirmed.

#### R-125 · Low · A project name with outer spaces stays dirty after saving
- **Where:** src/views/SettingsView.tsx:129-135, :170.
- **What:** Save trims, but the dirty check compares the untrimmed form.
- **Failure:** Save stays enabled after a successful save.
- **Fix:** Compare trimmed values.
- **Evidence:** 1/1 confirmed.

#### R-126 · Low · A twisty click during search silently collapses the row for later
- **Where:** src/views/OutlineView.tsx:60-65, :139, :191-194.
- **What:** The click toggles a hidden, persisted state.
- **Failure:** After clearing the search, an epic is unexpectedly collapsed.
- **Fix:** Ignore the click, or hide the twisty, while searching.
- **Evidence:** 1/1 confirmed.

#### R-127 · Low · About TOC link to the current section does not scroll
- **Where:** src/views/AboutView.tsx:18-22, :36-41.
- **What:** The effect is keyed on the unchanged `s` param.
- **Failure:** Clicking "Skills" again after scrolling away does nothing.
- **Fix:** scrollIntoView on click (as `jump` does), or key the effect on location.key.
- **Evidence:** 1/1 confirmed.

#### R-128 · Low · An owner filter for a vanished owner shows "All owners" while still filtering
- **Where:** src/views/QuestionsView.tsx:20, :107; questionWalk.ts:21-31.
- **What:** React selects the first option when the value has no match, and choosing it fires no change.
- **Failure:** "Nothing matches" under "All owners".
- **Fix:** Keep the current owner as an option, or reset it.
- **Evidence:** 1/1 confirmed.

#### R-129 · Low · A skill or workflow removed or renamed in the board stays installed and becomes disowned
- **Where:** server/skillInstall.ts:49, :66, :79-80. Merged with a scripts duplicate.
- **What:** The manifest is rewritten from this run's sources only, and old copies are never removed. ADOPTING.md promises a safe re-run.
- **Failure:** The renamed link-requirements.js stays loadable, and later it is "skipped (not the board's)".
- **Fix:** Remove manifest entries with no source, and dangling links into the board's agent/ folder.
- **Evidence:** 2/2 confirmed, reproduced.

#### R-130 · Low · A stray .DS_Store in a linked skill folder disowns it permanently
- **Where:** server/skillInstall.ts:35-38, :56, :80, :119.
- **What:** Ownership requires every entry, dotfiles included, to be a board link. Link mode never links dotfiles and deletes the manifest.
- **Failure:** After Finder writes .DS_Store, every run skips add-artifact.
- **Fix:** Ignore dotfiles and junk in the ownership test.
- **Evidence:** 2/2 confirmed, reproduced.

#### R-131 · Low · Install links or copies the gitignored `__pycache__`; the committed link is dangling
- **Where:** server/skillInstall.ts:56, :58; export-kit.ts:52.
- **What:** export-kit skips `__pycache__`, but install does not. Commit 46128939 tracks a dangling `.claude/skills/svg-diagram/__pycache__` link.
- **Failure:** The link is broken in every fresh clone and worktree.
- **Fix:** Share one skip filter, and remove the tracked link.
- **Evidence:** 1/1 confirmed.

#### R-132 · Low · `installStatus` reports "current" with unlinked new files and is unused
- **Where:** server/skillInstall.ts:7-8, :119-131.
- **What:** No check that every source file is linked. Its only caller is its own test.
- **Failure:** A new reference.md is reported current but missing.
- **Fix:** Compare against the source file list, or delete the function.
- **Evidence:** 1/1 confirmed.

#### R-133 · Low · `links:apply` counts occurrences in already-linked text, so links land on the wrong word
- **Where:** scripts/linkProposals.ts:93-104, :25-27; link-requirements.js:40, :100. Merged with a data-integrity duplicate.
- **What:** Agents count occurrences in the original text, but apply counts in text that earlier proposals have already changed.
- **Failure:** "price" occurrence 2 lands on the third mention, or is skipped, and the report says "applied".
- **Fix:** Resolve all positions against the original text, drop overlaps, and splice from the end.
- **Evidence:** 2/2 confirmed, reproduced.

#### R-134 · Low · `capture --only` with a missing value runs a full capture
- **Where:** scripts/capture.ts:153-164.
- **What:** A missing value, or the `--only=ID` form, gives undefined, which means a full run.
- **Failure:** An empty variable rewrites every item and REPORT.md, colliding with the other lane.
- **Fix:** Fail when `--only` yields no IDs, and accept `--only=`.
- **Evidence:** 1/1 confirmed.

#### R-135 · Low · Runner told to use `plan-state --diff`, which diffs from plan.json's commit, not the pack's baseline
- **Where:** agent/skills/run-build-phase/SKILL.md:173; update-build-plan/tools/plan-state.mjs:54-58; phase-context.mjs:593-601.
- **What:** The pack diffs from the doc's own baseline and trims under budget, but the recovery command uses a different range.
- **Failure:** A resumed phase builds against stale text, and sees "none of the covered items changed".
- **Fix:** Add `--from` to plan-state, and print the exact command in the pack.
- **Evidence:** 2/2 confirmed.

#### R-136 · Low · phase-check accepts aliases in needs/after but schedules on raw names
- **Where:** agent/skills/run-build-phase/tools/phase-check.mjs:114-119, :310-316, :345, :357-358.
- **What:** An alias dependency counts as "not in run", which means met.
- **Failure:** `needs: ["tsc"]` lets build race typecheck on the shared tsbuildinfo.
- **Fix:** Canonicalise needs and after after loading.
- **Evidence:** 1/1 confirmed, reproduced.

#### R-137 · Low · A dependency cycle in runner.checks overflows `--list` and spins forever holding the lock
- **Where:** agent/skills/run-build-phase/tools/phase-check.mjs:119, :310-322, :362-386.
- **What:** There is no acyclicity check.
- **Failure:** `--list` raises RangeError, and a run busy-loops at 100% CPU while holding the lock.
- **Fix:** Detect cycles at load, and SKIP stuck WAITs.
- **Evidence:** 1/1 confirmed, reproduced.

#### R-138 · Low · `regrade-ids` reads affects and scope from the working tree, not the target commit
- **Where:** agent/skills/update-build-plan/tools/regrade-ids.mjs:30-37, :49.
- **What:** The SKILL accepts any commit, yet scope reflects today's files.
- **Failure:** An item retired after `<sha>` escapes re-grade, while the baseline moves to `<sha>`.
- **Fix:** Read via `git show <to>:<path>`.
- **Evidence:** 1/1 confirmed.

#### R-139 · Low · The fix for a failed final capture never rewrites REPORT.md
- **Where:** agent/skills/run-build-phase/SKILL.md:268; scripts/capture.ts:164, :646-648.
- **What:** `--capture <ids>` never writes the report, so the committed report keeps the failure.
- **Failure:** The phase ends with a stale "Failed recipe 1".
- **Fix:** Re-run `--capture all` until it is clean, or have `--only` update its own row.
- **Evidence:** 1/1 confirmed.

#### R-140 · Low · Edits inside one change are never checked against each other, and same-old/different-new edits are dropped
- **Where:** agent/skills/consistency-review/scripts/build-review.mjs:73, :79, :104-126.
- **What:** Clash checks run only between changes, and dedupe on file+old drops a second fix.
- **Failure:** M-03 shows no warning, then applies only half its edits.
- **Fix:** Apply each change's edits together, and flag conflicting `new` texts.
- **Evidence:** 2/2 confirmed. One verifier rated it lower because apply.mjs reports FAIL.

#### R-141 · Low · Note cites by title words do not resolve (slug mismatch), and a cite without points opens the wrong note
- **Where:** agent/skills/consistency-review/scripts/ref-kit.mjs:10-24, :51, :140, :179; agent/workflows/consistency-rulings.js:64, :139; build-packs.mjs:75; update-requirements SKILL.md:49; add-artifact SKILL.md:44. Merged from 2 findings.
- **What:** The prompts and skills say "title words", but resolution uses the file-name slug, which differs for 6 of 26 notes (apostrophes, "AA's"). ref-kit's own slug turns `'` into `-`. A cite without points falls back to the first note of that date.
- **Failure:** "Notes 2026-11-05 · Donald's contract model decisions #9" is UNRESOLVED and copied into items. "Notes 2026-11-05 · Donald contract model decisions" shows the Ben and Vanessa note.
- **Fix:** Say "slug words" with a real example, and give agents the valid prefixes. Use the board's slugify in ref-kit and build-packs. Return unresolved rather than `same[0]`.
- **Evidence:** 2/2 and 2/2 confirmed against the live catalogue.

#### R-142 · Low · The cite-shorthand parser swallows the next entry when a key is mixed-case
- **Where:** agent/skills/consistency-review/scripts/ref-kit.mjs:57-59.
- **What:** The key pattern is `[A-Z][A-Za-z]*\d+`, but the terminator expects `[A-Z]+`.
- **Failure:** `Bv1105` gets no entry, and G1016's words run on into it.
- **Fix:** Use the same key pattern in the lookahead.
- **Evidence:** 2/2 confirmed.

#### R-143 · Low · Retired diagrams are packed and reviewed for drift
- **Where:** agent/skills/consistency-review/scripts/build-packs.mjs:175. Merged with "a `/`-rooted artifact file resolves against the catalogue folder".
- **What:** Status and superseded_by are ignored. Live AR-52 (retired) is packed.
- **Failure:** Edits or a redraw are proposed for a historical record.
- **Fix:** Filter retired diagrams out, or tell verifiers about them.
- **Evidence:** 2/2 confirmed. The index lists AR-52 and AR-30.

#### R-144 · Low · Change ids past 99 collide with ruling codes
- **Where:** agent/skills/consistency-review/scripts/ref-kit.mjs:22, :203, :249; build-review.mjs:103.
- **What:** S-104 matches the `S-\d{3}` ruling pattern.
- **Failure:** "clashes with an edit in S-104" opens ruling S-104.
- **Fix:** Use 3-digit ids with a distinct pattern, or check the DOM ids first.
- **Evidence:** 1/1 confirmed.

#### R-145 · Low · Default owner gives the heading "Conflicts for the"
- **Where:** agent/workflows/consistency-rulings.js:33, :149.
- **What:** `'the product owner'.split(' ')[0]` is "the".
- **Failure:** An exported kit run with no owner gets "## Conflicts for the".
- **Fix:** Use a separate short-name default.
- **Evidence:** 1/1 confirmed.

#### R-146 · Low · link-requirements crashes on a flat `batches` list, as the skills word it
- **Where:** agent/workflows/link-requirements.js:5, :28, :64-71, :121; update-requirements SKILL.md:181.
- **What:** The workflow expects an array of arrays, and the wording invites `["EP-04","EP-06"]`.
- **Failure:** `TypeError: epics.join is not a function` before any agent runs.
- **Fix:** Normalise each element to an array, and fix the wording.
- **Evidence:** 1/1 confirmed.

#### R-147 · Low · Consolidation group topics that match no rulings topic are accepted silently (11 of 13 here)
- **Where:** agent/workflows/consistency-changes.js:38, :239-240; consistency-review SKILL.md:71, :86-87.
- **What:** Exact-string topic matching with no validation, and the This repo groups disagree with the suggested topics.
- **Failure:** The catch-all consolidator gets most findings in one oversized prompt.
- **Fix:** Log or error on unknown group topics, and align the This repo strings.
- **Evidence:** 1/1 confirmed by parsing the SKILL JSON.

#### R-148 · Low · `artifact:steps` screenshots port 5180 even inside a lane worktree
- **Where:** agent/skills/svg-diagram/SKILL.md:26, :218; add-artifact SKILL.md:22, :116; scripts/shoot-steps.ts:33.
- **What:** The steps come from the worktree, but pages come from whatever board serves 5180. Lane boards use 5280 and 5380.
- **Failure:** A lane agent "verifies" a stepped diagram against the master board's old or missing AR-64.
- **Fix:** Default to BOARD_PORT after loading `.lane.env`, and update the skills.
- **Evidence:** 1/1 confirmed. Appendix A-3 refuted a narrower duplicate on a vote split.

#### R-149 · Low · Kit SCHEMA.md ships this project's status numbers, which contradict the starter config
- **Where:** requirements/SCHEMA.md:451, :462-464; scripts/export-kit.ts:34-35, :57-60.
- **What:** "(6 here)", "Agreed 4 here" and "never Confirmed 5 here" ship verbatim, while the starter's 4 is Confirmed (final sign-off) and 5 is Retired.
- **Failure:** An adopting agent sets 4, the client sign-off, on an answer.
- **Fix:** Refer to roles only, and add an export check for `\d here`.
- **Evidence:** 2/2 confirmed.

#### R-150 · Low · run-build-phase's generic body hard-codes prototype conventions
- **Where:** agent/skills/run-build-phase/SKILL.md:114, :151, :170, :185, :197, :222, :256-257, :283.
- **What:** PERSIST_VERSION, the demo clock, "the RFP rule", master-demo-guide.html and the Control Panel all sit outside the "This repo" block, and none is in deny.txt.
- **Failure:** An adopter's runner records a PERSIST_VERSION that does not exist and hunts for the demo guide.
- **Fix:** Move these into This repo (a state version line, a demo guide line), word the body generically, and add the terms to deny.txt.
- **Evidence:** 2/2 confirmed.

#### R-151 · Low · `phase-context.mjs` bakes in project vocabulary and PROGRESS.md headings
- **Where:** agent/skills/run-build-phase/tools/phase-context.mjs:66, :68, :744, :798, :807.
- **What:** Count nouns (Bookings, Procedures), PERSIST_VERSION and BK0, and fixed "Decisions log" and "Discovered for later" section names.
- **Failure:** "22 tickets" pulls unrelated entries into Phase 22's pack, and a differently named handoff section is ignored.
- **Fix:** Make the extra nouns and section names `runner.context` keys.
- **Evidence:** 1/1 confirmed.

#### R-152 · Low · notes/README.md ships project artifacts and a broken path as "neutral"
- **Where:** requirements/notes/README.md:47-55; scripts/export-kit.ts:34-35.
- **What:** AR-09, AR-16 and AR-17 to AR-24, and `docs/reference/Data files/`, which exists in neither repo (here it is docs/discovery-reference).
- **Failure:** Adopters read a legacy table for artifacts they do not have.
- **Fix:** Keep starter copies of notes/README.md and changes/README.md and drop them from SHARED_REQ. Fix the live path.
- **Evidence:** 1/1 confirmed.

#### R-153 · Low · Kit docs and skills point at files the export strips
- **Where:** agent/skills/add-artifact/SKILL.md:114-115; ADOPTING.md:159-160; README.md:44, :348-361; playwright.config.ts:21; START-HERE.html; export-kit.ts:26-33, :65.
- **What:** artifacts-real.spec.ts, the kit:export script, starter/ and tests/starter.test.ts are removed but still referenced. The generic region-sweep test is lost with them. START-HERE omits run-build-phase.
- **Failure:** add-artifact's check step runs nothing, and `npm run kit:export` says "Missing script".
- **Fix:** Split the spec into a generic part and a project part, trim the README in the kit, and list run-build-phase.
- **Evidence:** 1/1 confirmed.

#### R-154 · Low · Kit is built from the working tree, so untracked files ship
- **Where:** scripts/export-kit.ts:44-55; starter/deny.txt.
- **What:** Anything untracked and not skipped ships. deny.txt does not list the other people named in the voice patterns.
- **Failure:** An agent's scratch note quoting a client meeting ships as kit X.Y.Z.
- **Fix:** Build from `git ls-files -co --exclude-standard`, warn on a dirty tree, and generate deny entries from the config.
- **Evidence:** 1/1 confirmed. One untracked file would ship today.

#### R-155 · Low · The About page's install-skills command replaces the tracked symlinks with copies
- **Where:** src/views/AboutView.tsx:432, :465; scripts/install-skills.ts; server/skillInstall.ts. Merged with the "About claims never commits" note.
- **What:** No `-- --link` is shown, while this repo tracks symlinks.
- **Failure:** A large unintended git diff, and edits in agent/ stop reaching Claude Code.
- **Fix:** Show the mode in use (via installStatus), or keep the current mode by default.
- **Evidence:** 2/2 confirmed.

#### R-156 · Low · README's Settings description and skill list are out of date
- **Where:** README.md:15-17, :264-265; shared/config.ts:98; catalogueApi.ts:538-543.
- **What:** `board` is not editable and is deleted on save, and run-build-phase is not listed.
- **Failure:** A hand-added `board` key silently disappears.
- **Fix:** Update both passages.
- **Evidence:** 1/1 confirmed.

#### R-157 · Low · The real-catalogue e2e run uses port 5181, which contract-picker-mock also takes
- **Where:** playwright.config.ts:21, :27; contract-picker-mock/vite.config.ts.
- **What:** Both use strictPort, with no server reuse.
- **Failure:** With the picker running, `BOARD_E2E_REAL=1 npx playwright test` fails to start.
- **Fix:** Use another port or make it configurable, and update README and add-artifact.
- **Evidence:** 1/1 confirmed (config reading only).

#### R-158 · Low · Every file event re-reads and re-parses the whole catalogue synchronously
- **Where:** server/cataloguePlugin.ts:40-41, :105-118; catalogueApi.ts:604-638; historyJournal.ts:92-118.
- **What:** Fires for notes/, changes/, reference/ and assets/, and for the board's own writes. Nothing is reused for unchanged files.
- **Failure:** Capture or a 50-file agent edit blocks the server for most of the run (each reload measured 0.45 to 1.8 s).
- **Fix:** Re-read only the changed paths, skip unrelated folders, and skip the board's own revs.
- **Evidence:** 3/3 confirmed. All verifiers lowered the severity to low (costs are overstated at today's size).

#### R-159 · Low · The client applies events one at a time and rebuilds every node, so N files mean N renders
- **Where:** src/store.ts:121-139; board/graph.ts:54; Prose.tsx memo; server/cataloguePlugin.ts:71.
- **What:** One WebSocket frame per record, a fresh `data` object per node defeating memo, and artifact events skip the rev check.
- **Failure:** A 300-record `git pull` freezes the board for seconds at scale.
- **Fix:** Batch events on both ends, reuse unchanged node objects, and add a rev check for artifacts.
- **Evidence:** 2/2 confirmed. The scale is overstated.

#### R-160 · Low · PDF facts are re-extracted in one child process per PDF on every start
- **Where:** server/artifactFiles.ts:73, :80-88, :131.
- **What:** An in-process cache only, and 450 to 630 ms per PDF. About 2.7 s of the 3.3 s `npm run check`.
- **Failure:** With 30 PDFs, each check spends about 15 s, and the dev server hangs at start.
- **Fix:** A disk cache keyed by blob sha, and one pdfFacts process for many paths.
- **Evidence:** 2/2 confirmed.

#### R-161 · Low · Rename history is fetched several times at once per HEAD and never cached in a worktree
- **Where:** server/gitRenames.ts:30-41; catalogueDiff.ts:183. Merged with a server-git duplicate.
- **What:** Resolved values are cached rather than promises, so 3 to 6 parallel full-history logs run. `.git/index` is a file in a worktree, so the working diff is never cached.
- **Failure:** The lane worktrees run three uncached `-l0` whole-repo diffs on every count refresh.
- **Fix:** Cache the promise and keep the newest entries. Use `git rev-parse --git-path index`, and limit the pathspec.
- **Evidence:** 2/2 confirmed.

#### R-162 · Low · Per-HEAD git history caches grow without bound
- **Where:** server/gitHistory.ts:110-111, :165, :214.
- **What:** Plain Maps keyed `@head`, never evicted, unlike the other capped caches.
- **Failure:** Memory grows across a wave of commits until restart.
- **Fix:** Keep the current HEAD only, or use the Lru class.
- **Evidence:** 1/1 confirmed.

#### R-163 · Low · Blob URLs for mermaid drawings are never revoked
- **Where:** src/artifacts/content.ts:44, :53-67; VisualCompare.tsx:25. Merged with a perf-lens duplicate.
- **What:** A new object URL per load, with no revokeObjectURL anywhere.
- **Failure:** Unbounded memory over long editing sessions.
- **Fix:** A dispose hook in useLoaded, or one cached URL per (seed, source).
- **Evidence:** 1/1 confirmed.

#### R-164 · Low · `changedInSubstance` spawns up to three `git show` per entry
- **Where:** agent/skills/update-build-plan/tools/req-changes.mjs:105-112, :176-189.
- **What:** The recodes file is re-read per entry. Callers repeat the work in regrade-ids, phase-briefs and phase-context.
- **Failure:** A 300-card change costs about 900 spawns (about 20 s).
- **Fix:** Read recodes once, and use `git cat-file --batch`.
- **Evidence:** 1/1 confirmed (seconds, not a defect).

## Appendix: refuted findings (10)

- **A-1** `shared/ids.ts:26`, freed item and question IDs are reused (0/3). Refuted because reuse is deliberate, documented and tested (historyJournal `forget`, README). The history side effect is kept as R-54.
- **A-2** `scripts/recode-statuses.ts:142`, a recode with the board running leaves "status X to X" entries (1/2). The confirming verifier traced the mechanism (files are written before the journal walk), but the second verifier refuted it. The refuting note is not in the input, so the finding is held as unproven.
- **A-3** `scripts/shoot-steps.ts:33`, artifact:steps ignores BOARD_PORT (1/2). Narrower duplicate; refuted on a vote split, but the same defect survives as R-148 through the skill docs.
- **A-4** `agent/skills/update-build-plan/tools/build-index.mjs:280`, the plan page hides lanes when no phase is safe (1/2). The confirming verifier traced the lanes block inside the `safeNow` ternary, but the second verifier refuted it. The refuting note is not in the input. Worth a quick look by hand.
- **A-5** `src/components/HistoryView.tsx:58`, the timeline re-runs every lineDiff on any card move (0/1). The verifier accepted the over-subscription (the whole `s.layout` is selected and lineDiff is not memoised) but did not count it as a defect.
- **A-6** `src/components/ArtifactRows.tsx:86`, a multi-spot row opens a broken first spot (0/1). Only point lists give several spots, and they cannot carry the broken-page case described.
- **A-7** `src/artifacts/PdfReader.tsx:586`, PdfPage cleanup cannot cancel a late render (0/1). loadPdf fetches every page before PdfPage mounts, so getPage is never pending at cleanup.
- **A-8** `scripts/capture.ts:500`, the report lists retired stories under "No recipe" (0/1). The report states its scope as every story, and that is deliberate.
- **A-9** `agent/skills/run-build-phase/tools/phase-context.mjs:409`, the pack's plan excerpt ignores `guidance.lanes` (0/1). The verifier accepted the code gap (array-valued guidance is skipped) but found that the harm described cannot happen.
- **A-10** `agent/skills/update-build-plan/tools/build-index.mjs:159`, the "re-plan first" flag ignores recodes (0/1). The verifier confirmed that the raw statuses are compared without normaliseStatus, but refuted the failure as described. The rest of the note was cut off in the input.
