# Phase B06: Edit sheets and Settings never drop, revert or resurrect an edit

**Status:** PLANNED

**Requirements:** R-01, R-02, R-12, R-41, R-42, R-43, R-45, R-107, R-108, R-109, R-110, R-111,
R-112, R-123, R-124, R-125 (16 findings closed by B06). Each is detailed in
[FINDINGS.md](../../FINDINGS.md) under its `#### R-nn` heading; systemic issue 1 ("Writes rebuild
whole records from a stale or lossy model") is the root of R-02, R-41, R-45 and R-111. Split
deliveries (PROGRESS accepted decision 7): R-01's board and server half is B02's and B06 closes R-01
by rendering B02's damaged-list lock-out; R-45's and R-111's server halves are B05's (B05-REQ-06,
B05-REQ-05) and B06 closes both.

**Owns:** the edit / save / conflict / draft behaviour of `src/components/useEditableRecord.ts`;
the edit sheets and their chrome (`ItemModal`, `QuestionModal`, `EditChrome`, `Sheet`,
`NewCardButton`); draft and save flows on the artifact page (`src/views/ArtifactPage.tsx`) and the
artifact details form in `src/artifacts/ArtifactPanel.tsx`; the leave guard in `src/nav.ts`
(`guarded`, `setLeaveGuard`); the editing, save and lock-out rendering of
`src/views/SettingsView.tsx`; the store save actions the sheets and Settings consume (`saveItem`,
`saveQuestion`, `saveArtifact`, `saveConfig` in `src/store.ts`) and their call sites in `src/api.ts`
on top of B05's transport; the lines of `requirements-board/DESIGN.md` (and any README, About or
SCHEMA lines) that describe behaviour B06 changes (convention 12); if B06-Q4 is accepted, a
per-field damage signal for `components` and `project` in `shared/config.ts` (touch rights,
convention 11); the regression proof and disposition for every finding above.

**Excludes:**
- Server write semantics: field patch, base-rev check, merge, conflict reply, unchanged-write
  no-op, config section conflicts, YAML in place, the artifact-details PUT (R-37) and the client
  transport in `src/api.ts`: **B05** (decision D-04).
- The status model, status registry, code allocation (including the minimal R-68 call-site edit in
  Settings), the healthy / degraded / damaged classification and its client signal, the server's
  refusal of status writes while damaged and its status in-use guard: **B02** (decision D-02).
- The error boundary around the sheets, per-record load isolation and the issue surface
  (`ProblemPill`, D-06): **B03**.
- The store's live-update path, event shape and batching, initial-load buffering, layout save
  queue, `hasUnsavedMoves` and the `beforeunload` wiring for card moves (R-40, R-57 to R-59): **B07**.
- The artifact viewers and the rest of `src/artifacts/*`: **B10**. Board canvas callers of
  `guarded` (`BoardView`, `LaneNode`): **B11**.
- The whole-file docs truth pass (README, SCHEMA, About) and R-156: **B14**.

**Depends on:** B05, B07, B02, B03 (PLAN.md phase table), all delivered, with these decisions
recorded under PROGRESS "Accepted decisions":
- **B05** with **D-04**: how a client sends only the fields it changed with a base, the conflict
  reply (B05-REQ-03), the unchanged-write rule (B05-REQ-05), config section conflicts (B05-REQ-06;
  D-04 covers config writes), and the transition rule for old client shapes (B05-REQ-08). Gate for
  REQ-01, REQ-02, REQ-03 and REQ-11.
- **B07** (hard dependency; serial order puts it first): the final live-update path and event
  shape, carrying B05's config section bases and B02's per-list damage state. Gate for REQ-01,
  REQ-04, REQ-10, REQ-11 and REQ-12.
- **B02** with **D-02**: the healthy / degraded / damaged signal (B02-REQ-02) and the allocation
  helper (B02-REQ-03). Gate for REQ-11 and REQ-12.
- **B03** with **D-06**: the error boundary around the sheets and how a record that fails to parse
  is reported. Gate for the wording in REQ-04, REQ-05, REQ-07 and REQ-12.
- **D-05** (B05 with the user, settled before B08 builds) narrows REQ-05's reused-ID case.

**Unblocks:** B14 (whole-file docs pass reads B06's "Doc facts"); B15 (closing audit of these 16
findings).

**Binding constraints:** PLAN.md "Binding constraints (every phase)" and PROGRESS.md conventions
1 to 14, in particular: existing stack only (React 18, zustand, Vitest with jsdom, Playwright), no
new dependency without a recorded reason (3); visual changes follow `requirements-board/DESIGN.md`
("Item sheet", "Settings", "the artifact page") (4); version bump and CHANGELOG (5); `npm run
verify:board` green and Playwright on a free port, never 5173, 5174, 5180, 5181 (6); no requirement
content changes (7); commit, never push, no staging mid-phase (9); app phases one at a time in the
serial order B01, B02, B03, B04, B08, B05, B07, B06, B09, B10, B11, B14, B15 (10); touch rights
(11); doc lines (12); every proof fails before the fix and passes after it (13). The board never
raises a browser dialog other than the existing `beforeunload` prompt (DESIGN.md line 162). New
copy follows the board's existing plain voice.

## Objective and outcomes

The edit sheets and Settings are where a person's typing meets files that agents also write. When
B06 is delivered:

1. **No save reverts what the user did not touch.** Resolving a conflict keeps the user's own
   changes and takes everything else from the file as it is now, including fields the form never
   shows (parent, order, swimlane, images, artifacts, unknown keys).
2. **No keystroke is lost** to a save in flight, and no save happens without a change.
3. **No draft is lost silently, and none comes back where it does not belong.** A record that
   vanishes with unsaved edits shows every unsaved change, on item, question and artifact alike;
   every way out asks in a frame the user can see; a dismissed draft never reattaches to a new card.
4. **Focus is where the user expects**: in the title of a sheet opened for editing, back on the
   opener when it closes, and never yanked by a background file change.
5. **Settings saves only real, current changes**: a list changed on disk meanwhile is caught, a
   damaged status list cannot be edited or saved over (closing R-01 with B02's half), "Used by" counts match what the server
   enforces, and a section at rest is never dirty.

## Sources and current-state evidence

All findings re-verified by code trace at HEAD `d4341735` (board 1.12.3) on 2026-11-18. Every
finding still reproduces; none is marked "not reproducible". Line ranges below are current.

| Finding | Current evidence at HEAD |
|---|---|
| R-01 (Settings half) | `StatusSection` seeds its rows from `statusesOf(config, kind)` (`SettingsView.tsx:375-376`); when `parseStatusList` substitutes the defaults (`shared/statuses.ts:119-126`) Settings shows them as the project's list with nothing marking them, and Save (`:417-427`) sends them as `{ [field]: list }`. The server half (in-use guard against `state.config`, `catalogueApi.ts:524-531`) is B02's. |
| R-02 | `useEditableRecord.ts:150-153` `keepMine` sets `base` to `rec` and keeps the whole draft; `commit` (`:123-148`) sends `normalise(draft)` whole; server item PUT (`server/catalogueApi.ts:343-352`) replaces the record after `checkBase`. The batch route (`:398-417`) already merges a `patch` onto the file on disk: the precedent systemic issue 1 names. |
| R-12 | `ArtifactPage.tsx:32-40` returns "There is no artifact" when `rec` is missing, unmounting `ArtifactPanel` (whose draft lives in the hook's module map under `artifact:<id>`, `ArtifactPanel.tsx:53`). The drafts effect (`useEditableRecord.ts:54-57`) has no unmount cleanup, so `hasUnsavedDrafts()` (`App.tsx:62-69`) stays true. `useFullScreen()` is called before the early return (`:30`), so full screen stays on. |
| R-41 | `commit` (`:123-137`) replaces the draft with the saved copy and leaves edit mode unconditionally; no form field reads `saving`; only the Save button is disabled (`EditChrome.tsx:49`). |
| R-42 | `OrphanedDraft` passes plain `onClose` to `Sheet` (`EditChrome.tsx:91`); Esc and scrim click (`Sheet.tsx:77-79`, `:101-103`, `:154-158`) never call `ed.discard()`. Only the "Discard edits" button (`:107-115`) does. |
| R-43 | `ItemModal.tsx:126-133` and `QuestionModal.tsx:85-90` pass only text fields; `OrphanedDraft` drops empty ones (`EditChrome.tsx:89`). |
| R-45 | `StatusSection` saves `{ [field]: list }` with no base (`SettingsView.tsx:417-427`), `ComponentSection` likewise (`:347`), and both keep stale rows while dirty (`:288-290`, `:383-385`). Server config PUT (`catalogueApi.ts:505-565`) patches fields on disk but has no base-rev check. `ProjectSection` (`:127-174`) has the same gap (same root; no separate finding). `VoiceSection` (`:182-277`) already has a base-rev conflict banner. |
| R-107 | Docked `ItemModal` registers the leave guard (`:60-67`) before the orphan branch (`:117`); `leave()` (`useEditableRecord.ts:76-85`) sets `pending`, but `OrphanedDraft`'s `Sheet` gets no `confirm`, so nothing shows. |
| R-108 | `guarded` (`src/nav.ts:10-14`) always routes to the docked item's guard. Callers inside a modal question sheet: `ArtifactRows.tsx:50`, `:63`, `Prose.tsx:162`, `:195`; also `NewCardButton.tsx:131-136` holds a closure over the draft at click time. The veil renders in the docked sheet behind the scrim, where the dock is inert. |
| R-109 | `Sheet.tsx:86-87` captures `previous = document.activeElement` and focuses the container in a passive effect that runs after `autoFocus` (`ItemModal.tsx:584`, `QuestionModal.tsx:337`) has focused the title, so the title loses focus and `previous` is the in-sheet input, detached on close (`:112`). |
| R-110 | `Sheet.tsx:118-123` depends on `[confirm]`; `discardConfirm` (`EditChrome.tsx:57-67`) builds a new object every render, so any re-render (a catalogue event) refocuses "Keep editing". `ArtifactPanel`'s `PanelVeil` focuses once and is not affected. |
| R-111 | `onKey` (`useEditableRecord.ts:163-168`) calls `commit` whenever `editing`, with no `dirty` check; `commit` has none either. A save marks a fresh card as saved (`ItemModal.tsx:47`), so a blank new card is no longer dropped on leave. |
| R-112 | `base` and `draft` are seeded only in `useState` initialisers (`:45-46`); the disk-change effect bails on `!base` (`:61`); `startEdit` needs `rec`. `QuestionModal.tsx:41` fixes `anchorStatus` once. The not-found sheets: `ItemModal.tsx:139-148`, `QuestionModal.tsx:95-103`. |
| R-123 | Intro says "Leave the list empty to accept any component" (`SettingsView.tsx:304`); with an empty saved list `was` is always undefined (`:316-317`), so no row shows usage and nothing warns. Merged case: a new row typed to the name of a saved, in-use component becomes `disabled` mid-typing (`:316-324`). Server guard counts a dropped name only if `state.config.components` knew it (`catalogueApi.ts:551-552`), so an empty list never blocks. |
| R-124 | `usage` counts `index.items` only (`SettingsView.tsx:291-295`); the server counts items and artifacts (`catalogueApi.ts:549-550`). Merged case: `list` upper-cases codes (`:286`) while `saved` keeps the file's case, so a lower-case code on disk makes the section dirty at rest (`:287`). |
| R-125 | `dirty` compares the untrimmed form (`:132`); Save sends `name.trim()` (`:170`); after saving the form still differs from `saved`, and the sync effect (`:133-135`) skips while dirty. |

Other facts used:
- Drafts live only in a module-level `Map` in tab memory (`useEditableRecord.ts:19`); nothing is
  persisted, so changing their shape needs no data migration.
- The store's save actions (`src/store.ts:156-180`) and the API client (`src/api.ts:45-76`) send
  whole records today (`putItem`, `putQuestion`, `putArtifact`) and whole config fields (`putConfig`).
- Tests: there are no component or hook tests for the sheets today; jsdom is already a dev dependency
  and used by four test files. E2E coverage on the fixture board (port 5182): `e2e/settings.spec.ts`
  (statuses, components, project, voice conflict), `e2e/artifacts.spec.ts:295-315` (artifact details
  edit, discard veil, Cmd S), `e2e/item-links.spec.ts:74-85`, question specs.
- DESIGN.md: "Unsaved edits are never lost silently: every way out of a sheet asks, and drafts
  survive navigation" (line 160); the veil puts the safe answer in the filled teal button that holds
  focus; Escape withdraws the question (lines 162-166); artifact details behave as on a card
  (lines 259-263).

Assumptions (to confirm in implementation planning, not settled here): the conflict granularity is
the record field (whole `related` list, whole `sources` list), not the list element, unless D-04
says otherwise.

## Detailed requirements

### B06-REQ-01 · A conflict never reverts what the user did not change (R-02; systemic issue 1)

- Every write the sheets originate (item, question and artifact-details Save, Keep mine then Save,
  the status menu, Retire) carries only the fields the user changed relative to the version the edit
  started from (or, for one-click writes, the one field set). How the change is expressed and merged
  is D-04's; the observable rule is fixed here.
- After a disk change during an edit and **Keep mine** then **Save**, the record on disk holds the
  user's value for every field the user changed and the on-disk value for every other field,
  including those the form does not show (parent, order, swimlane, images, artifacts, unknown keys).
  SCHEMA's promise that the board keeps `artifacts` "on every save" holds through a conflict.
- A user's own Mapped drag of the card being edited in the docked sheet survives a later Save.
- **Load theirs** replaces the draft with the record as it is now (unchanged behaviour).
- If D-04 makes the server merge non-overlapping changes, a Save whose base is stale but whose
  changed fields were not touched on disk succeeds without a conflict. Whether the conflict banner
  is still raised in the sheet for a disk change that touches only fields the user has not edited is
  B06-Q2; until decided, raising it is acceptable provided the rule above holds.
- A conflict on a field the user changed is reported per D-04's conflict reply (B05-REQ-03: the
  current copy, the base and the colliding fields); the banner names the record as today and may
  name the colliding fields.
- Candidate (FINDINGS): field patch with base rev merged on the server, as `/api/items/batch` does;
  or a client three-way merge per field. The choice is D-04's, not B06's.

### B06-REQ-02 · Edits typed while a save is in flight are kept (R-41)

- No change made in a sheet while its save is in flight is lost, whether the save succeeds, fails or
  meets a conflict.
- On success, if the form changed after the save was sent, the sheet stays in edit with those later
  changes shown as unsaved against the saved copy; if it did not, the sheet leaves edit as today.
- Alternatively the form is visibly read-only while saving and accepts no input; either way no input
  is silently discarded. The choice is the implementation plan's.
- The same holds for the artifact details form (it uses the same hook).

### B06-REQ-03 · A save happens only when something changed (R-111)

- Cmd/Ctrl+S in an edit form with no unsaved change writes nothing: no file rewrite, no journal or
  history entry, no Diff change, no event. It still suppresses the browser's own save dialog.
- A fresh card left blank and never changed is still dropped when the user leaves it, even after a
  Cmd/Ctrl+S with no change.
- Applies equally to item, question and artifact-details forms. The Save button's existing dirty
  gate is unchanged.

### B06-REQ-04 · A sheet picks up its record when it appears (R-112)

- A sheet opened while its record is missing (a file failing to parse, a record not yet loaded, an
  ID about to be created by an agent) shows the record as soon as it appears, with no reopen.
- With no stored draft, the record is adopted read-only (or in edit if the sheet was opened for
  edit). With a stored draft, the draft resumes; if the record differs from the draft's base, the
  conflict choice appears (REQ-01 rules apply).
- A question opened before its record appeared steps through Outstanding items from the place the
  record has when it first appears.
- The not-found sheet's wording does not claim a cause it cannot know: it allows "renamed, removed
  or failing to parse", and when D-06 gives a record-level issue for that ID, it points to it.

### B06-REQ-05 · An orphaned draft never vanishes silently and never comes back on another record (R-42, R-107)

- An orphaned draft is a record gone from disk with unsaved edits. Every way out of the
  orphaned-draft sheet (Esc, scrim click, close button, a docked board click, arrow walk, search,
  lineage, a guarded link, New card) either asks in that sheet's own frame, with the safe answer
  focused and Escape withdrawing the question, or proceeds while keeping the draft intact. No way out
  is a silent no-op (R-107), and none drops the draft without the user's say.
- When the user confirms discarding, the draft is gone for good: the tab no longer prompts on reload
  because of it, and reopening that ID shows no restored edits.
- A card created through the board (New card) never opens with a draft left over from an earlier
  record under the same ID. A record deleted through the board takes any stored draft for its ID and
  its doomed descendants with it.
- A draft left behind by browser Back still survives navigation and is restored on return (preserved
  behaviour, DESIGN.md line 160).
- Conditional on D-05: if IDs are never reused, the board-creation case cannot arise through New
  card but the guard stays for files recreated outside the board. Whether to detect a different
  record arriving under the ID of a stored draft from outside the board is B06-Q5.

### B06-REQ-06 · The orphaned-draft sheet shows every unsaved change (R-43)

- The sheet lists every field whose draft value differs from the draft's base, for items (title,
  description, acceptance, technical, notes, sources, parent, status, swimlane, components, related,
  images) and questions (title, question, answer, sources, owner, kind, status, affects), and for
  artifacts (REQ-07).
- Non-text values are shown in readable form: record IDs with their titles where known, status
  labels not codes, component names. A field cleared by the user shows as cleared, not omitted.
- Unchanged fields are not presented as unsaved. If nothing differs, the sheet does not show (the
  draft is not orphaned).
- Values are selectable for copying, as the text fields are today.

### B06-REQ-07 · The artifact page keeps an orphaned details draft and releases full screen (R-12)

- When the open artifact disappears (renamed, deleted, sidecar failing to parse) while its details
  form has unsaved edits, the page shows the orphaned-draft state for it, with every changed detail
  (name, kind, status, replaced by, date, author, area, sources, description) and the REQ-05 exit
  rules.
- With no unsaved edits, the page shows that the artifact is gone (existing message, wording per
  REQ-04), and no draft remains to keep the reload prompt on.
- When the artifact is gone, full screen is left and the masthead returns, in both cases.
- If the artifact reappears (the sidecar is fixed), the page picks it up as REQ-04 describes.

### B06-REQ-08 · A guarded way out raised over a modal is visible and current (R-108)

- When a link or action inside a modal sheet (a question over the board's docked item) would take
  the user away while the docked item has unsaved edits, the user either sees the discard question
  where they can answer it, or the navigation proceeds and the docked draft is kept (drafts survive
  navigation). A veil that cannot be seen or reached never appears.
- A waiting way out is dropped when the frame that asked is closed or the user does something else;
  a later "Discard changes" never runs a navigation or creation the user has forgotten.
- A guarded New card creation uses what the New card form held when the user confirmed, or does not
  run if the form has gone.
- Candidate (FINDINGS): run the action at once when a modal scrim is open, or guard question
  creation too.

### B06-REQ-09 · Modal sheets focus the right field and give focus back (R-109)

- A modal sheet opened in edit mode (a new card from New card, Edit from a modal) puts focus in the
  field that sheet means to start in (the title; the answer when answering a question), and typing
  goes there straight away.
- A modal sheet opened read-only still takes focus on its frame, as today.
- On close, focus returns to the element that had it before the sheet opened, if that element is
  still in the document; otherwise to a stable place in the page, never to a detached node or
  `body` by default. Stepping between sibling sheets does not lose the original opener.
- A docked sheet still takes no focus on open, so arrow keys keep walking the board (preserved).

### B06-REQ-10 · The veil moves focus once, when it appears (R-110)

- The safe answer takes focus when a sheet's question appears, and only then. A re-render while the
  question is up (a catalogue event, an agent write) never moves focus.
- With the docked sheet veiled, the user can work in the board's search or other controls and keeps
  focus there while files change.
- The veiled content is unreachable (inert) exactly while the question is up.

### B06-REQ-11 · Settings catches a list changed on disk before saving over it (R-45)

- Saving the item statuses, question statuses, components or project fields is checked against the
  version on disk that the section's edits started from. If that field changed on disk since, the
  save is refused and the section shows a conflict banner like the Writing voice section's, offering
  Load theirs and Keep mine.
- **Keep mine** never removes or reverts a row (a status by its code, a component by its name) or a
  project field the user did not remove or change. Rows added on disk are kept; rows the user edited
  keep the user's values; rows both changed are shown as clashing per D-04's conflict shape.
- A new status the user added never takes a code that a status added on disk now holds; two statuses
  never merge into one code. How the next free code is chosen is D-02's (B02).
- Server in-use guards still apply after Keep mine (a 422 shows as today).
- The server side of this check (a base per config section, a conflict reply carrying the
  section's current value) is B05's (B05-REQ-06; D-04 covers config writes). B06 sends the section's
  base, reads the reply and renders the banner.

### B06-REQ-12 · A damaged status list cannot be edited or saved over (closes R-01 with B02; D-02)

- While B02 reports a status list as damaged (B02-REQ-02), its Settings section shows a banner naming
  the problem and that the list must be fixed in `board.config.json`, shows no default list as if it
  were the project's, and offers no editing, Add status or Save for that list. The other sections
  still work.
- A list B02 classes as degraded (per-field problems such as a bad tone) shows the problem; whether
  it may be repaired through Settings follows B02-Q4. Either way no save ever writes the built-in
  defaults over the project's list.
- When the list is repaired on disk, the section returns to normal without a reload.
- The banner follows DESIGN.md (pills and banners, no crimson, teal only for actions) and D-06's
  issue surface where the problem is also listed (Checks section, masthead pill).
- The signal's shape and the server's refusal are B02's; B06 must not infer damage on its own.
- **Added scope, only if B06-Q4 is accepted by the user** (no finding owns it; FID-14): the same
  lock-out for `components` and `project` when their field on disk was read with problems, from a
  per-field damage signal B06 adds in `shared/config.ts` under touch rights. The signal is computed
  on the server from the file as read and reaches the client beside B02's per-list status damage
  state: in the catalogue snapshot and in the config event delivered through B07's live-update path.
  If B07's snapshot or event shape has no room for it, B06 adds the field there as a minimal
  touch-rights edit (convention 11) and names the files in its entry (for example
  `server/catalogueApi.ts` snapshot and config event, `shared/types.ts` or wherever B07 defines the
  event shape, `src/store.ts`). The client never infers this damage from the normalised config.

### B06-REQ-13 · Components show what is in use and count what the server counts (R-123, R-124)

- "Used by" for a component counts every card and artifact naming it, matching the server's guard;
  a component shown as unused can be removed without a 422.
- Components named on cards or artifacts but absent from the list are visible in Settings whenever a
  saved list would leave them unlisted, with their counts, before the user saves. Saving a first
  component, or any list that would turn in-use components into check errors, never happens without
  the user seeing which ones and how many. Whether that is a block, a confirm or an offer to add them
  is B06-Q3.
- A row the user is typing is never locked because its text matches a saved, in-use component; the
  duplicate-name problem is shown instead.

### B06-REQ-14 · A Settings section at rest is never dirty (R-125, R-124 merged case)

- Right after loading, after Discard and after a successful save, every section reports no unsaved
  changes and Save is disabled, whatever form the values take on disk (outer spaces, lower-case
  component codes, field order).
- A section is dirty only when saving it would change the file; Save stays disabled otherwise.
- After a successful save the section shows the saved values and resyncs with later disk changes.

### B06-REQ-15 · Preserved behaviour (must not regress)

- Drafts survive in-app navigation and browser Back; reopening restores them with "Restored the
  unsaved edits you left here", shown once.
- Every in-app way out of a dirty sheet asks in the sheet's own frame ("Discard your changes?",
  Keep editing focused, Escape withdraws); no browser dialog except `beforeunload` for unsaved
  drafts.
- A 409 adopts the server's copy and raises the conflict choice; any other refusal shows as an
  error banner; a refused delete or status change adopts the current copy and shows the error.
- Docked sheet rules: no focus on open; Esc from board controls does not close it; a modal over the
  panel owns the keyboard; masthead and main are inert under a modal; switching item to question
  keeps the page behind modal.
- A fresh blank card left without a save is dropped; the status menu saves without Edit; Retired
  asks first; answering a question offers to settle its items whatever the save path.
- Artifact details: Save, Cancel, Cmd S, Esc, restored draft, conflict and veil work as on a card;
  full screen keeps the panel's tab and any edit.
- Settings: a status in use or holding a required role cannot be removed; a new status takes the
  next free number with a teal-tinted row until saved; a component in use cannot be removed or
  renamed; disk changes show at once in a clean section; the Writing voice conflict flow; Checks.
- Existing e2e specs pass unchanged in intent: `settings.spec.ts`, `artifacts.spec.ts`,
  `item-links.spec.ts`, the question specs, `item-delete.spec.ts`.

## Dependencies and handoffs

| Input | From | Used by |
|---|---|---|
| D-04 write protocol: changed-fields write with a base, server merge, conflict reply (B05-REQ-03), unchanged-write no-op (B05-REQ-05), config section bases and conflicts (B05-REQ-06), transition for old client shapes (B05-REQ-08); client transport in `src/api.ts` | B05 | REQ-01, REQ-02, REQ-03, REQ-11 |
| Healthy / degraded / damaged signal per status list (B02-REQ-02); allocation helper (B02-REQ-03); server refusal while damaged | B02 (D-02) | REQ-11, REQ-12 |
| Error boundary around sheets; record-level parse issue; issue surface | B03 (D-06) | REQ-04, REQ-05, REQ-07, REQ-12 |
| Ordered, complete live updates (record changes reach an open sheet once, in order, after the initial load); the event shape carrying config section bases and the per-list damage state | B07 | REQ-01, REQ-04, REQ-10, REQ-11, REQ-12 |
| ID reuse rule | B05 with user (D-05) | REQ-05 |

Outputs: the behaviours above; the doc lines B06 changes (DESIGN.md "Item sheet", "the artifact
page" and "Settings"; README "How it works" lines on conflicts, Keep mine and unsaved edits),
updated in this phase and listed under "Doc facts" in its PROGRESS entry (convention 12); the shape
of the store save actions after B06, recorded in the entry for later phases that edit `src/store.ts`
(B11).

Files and order (PLAN.md shared-files table; touch rights, convention 11): B06 edits `src/store.ts`
and `src/api.ts` after B05 and B07; `src/views/SettingsView.tsx` after B02 (and B02's minimal R-68
call-site edit); `src/components/ItemModal.tsx` after B03; `src/artifacts/ArtifactPanel.tsx` before
B10; `shared/check.ts` for components (R-123) after B03, B04 and B05; `shared/config.ts` after B02 and
only if B06-Q4 is accepted, together with the minimal snapshot and config-event edits after B07 that
carry its signal (REQ-12). Minimal edits in any other phase's file are named in the entry.

Integration proof owner: B06 for its own flows; B15 for the programme.

## Acceptance and evidence

Every proof must fail on the code before the fix and pass after it (convention 13). Each is an
automated test where practical, at the hook, component or e2e level as the implementation plan
chooses; otherwise a recorded manual check with steps, observed result before the fix and after it.

| Finding | Must be shown |
|---|---|
| R-02 | Edit a card's description; change its parent/order (a Mapped drag or a disk write) and add an `artifacts:` entry on disk; Keep mine, Save. File holds the new description, the new parent/order and the added artifact. Same for a question and for artifact details with an unknown key on disk. |
| R-41 | Start a save that is held in flight; type more; release. Either the extra text remains as an unsaved change, or input was visibly refused during the save. Repeat with a failing save and a 409. |
| R-111 | Open a card in edit, press Cmd/Ctrl+S with no change: file bytes, journal and Diff unchanged, browser save dialog suppressed. Create a blank card, Cmd/Ctrl+S, leave: the card is dropped. |
| R-112 | Open `?item=ID` for a file that fails to parse; fix the file on disk; the sheet shows the card without a reopen. Same for a question, checking its stepper position. |
| R-42 | (a) The FINDINGS failure: orphan a draft on a card with the highest ID under its parent; leave the orphaned sheet by Esc with the draft kept (whichever REQ-05 path keeps it); create a New card that receives the same ID: it opens with no restored draft and no conflict banner, and Keep mine plus Save cannot write the dead content. (b) Esc and scrim click on the orphaned sheet each ask first or keep the draft; none drops it unasked. (c) After confirming Discard, reload does not prompt and reopening the ID shows no restored edits. |
| R-107 | Docked orphan on the board: clicking another card, empty board, arrow walk and search each produce a visible result (question or navigation); none is a no-op. |
| R-43 | Orphan a draft with changed parent, status, related, components, images and a cleared text field: each shows, in readable form; unchanged fields do not. Question: owner, kind, affects. |
| R-12 | On the artifact page, edit details, enter full screen, delete or rename the sidecar: the orphaned state shows the changed details, full screen is left, masthead visible; after Discard, reload does not prompt. Without edits: gone message, full screen left, no prompt. |
| R-108 | Open a question over a dirty docked item; click a Sources row, an artifact link and a record link in its prose: each gives a visible question or proceeds keeping the docked draft. Close the question sheet with an ask pending; a later Discard on the item does not navigate. |
| R-109 | Manual keyboard check (and automated where practical): from Outline, New card creates a story and opens it in edit; typing lands in the title. Close with Esc: focus returns to the opener (or the stable fallback), not `body`. Answering a question puts focus in Answer. |
| R-110 | Manual check: docked item dirty, veil up; click the board search box; write a catalogue file from a terminal; focus stays in search. Veil still answers Esc. |
| R-45 | Fixture board: begin rewording a status help text; add status 7 on disk; Save: refused with the conflict banner. Keep mine: status 7 kept, rewording saved. Load theirs: rows show status 7. Same for components and project fields. A fresh row and a disk-added row never share a code. |
| R-01 (B06 closes; B02's server-side proofs are its own) | With a status list B02 reports damaged (for example a duplicate code), the section shows the banner, no rows offered as the project's, no Add or Save; other sections save. Repair on disk: the section returns without reload. For the FINDINGS scenario (a bad tone, then a reworded help text), Settings never sends the built-in defaults: either the save is unavailable or the file keeps the project's codes with their meanings (per B02-Q4). |
| R-123 | Empty component list with cards naming "Mobile" and "Admin": adding "Billing" shows those two names and counts before saving, per B06-Q3's chosen rule. Typing a new row named as an in-use component does not lock the input. |
| R-124 | A component used only by an artifact shows "Used by" 1 and cannot be removed; a lower-case code on disk leaves the section clean at rest. |
| R-125 | Save a project name with outer spaces: after saving, Save is disabled and the field shows the trimmed name. |

Prohibited regressions: every item in REQ-15; `npm run verify:board` green; touched Playwright specs
green on a free port; no write to the real catalogue during testing (fixture board only).

Criteria awaiting a decision: the exact conflict reply and which fields it names (D-04); whether
non-overlapping disk changes raise the banner (B06-Q2); block versus confirm for R-123 (B06-Q3);
whether degraded status lists are editable (B02-Q4); detection of an outside record under a draft's
ID (B06-Q5). If B06-Q4 is accepted: the components and project lock-out, proved like R-01 and
recorded as added scope (no finding), including a live case: with Settings open on a healthy
config, damage a `components` entry on disk; the section shows as locked through the live config
event, without a reload, and returns to normal when the entry is repaired. A first-load check alone
does not satisfy it.

## Deferred decisions for execution planning

Consumed (programme register in [PROGRESS.md](../../PROGRESS.md)): **D-04** (B05; gate for REQ-01,
REQ-02, REQ-03, REQ-11), **D-02** (B02; gate for REQ-11, REQ-12), **D-06** (B03; gate for wording in
REQ-04, REQ-05, REQ-07, REQ-12), **D-05** (B05 with the user; narrows REQ-05), **B02-Q4** (degraded
lists in Settings; affects REQ-12). B06 owns none of D-01 to D-10.

B06 questions:

| ID | Question / gap | Affects | Owner | Dependent | Resolve before | Boundary / acceptance impact |
|---|---|---|---|---|---|---|
| B06-Q1 | **Answered (accepted decision 10, 2026-11-18):** D-04 covers config writes; B05 delivers the config section base and conflict reply (B05-REQ-06); B06 builds the client half. | REQ-11 | | | | |
| B06-Q2 | When a disk change touches only fields the user has not edited, should the sheet merge it silently (perhaps with a quiet notice) or still raise Keep mine / Load theirs? | REQ-01 | B06 (user) | none | B06 build (in B06 planning) | REQ-01 acceptance wording |
| B06-Q3 | R-123: when a component list would leave in-use components unlisted, block the save, ask to confirm, or offer to add them? Is the rule also enforced by the server (a minimal edit to B05's config route and `shared/check.ts` under touch rights)? | REQ-13 | B06 (user) | none | B06 build (in B06 planning) | R-123 proof; server edit named in the entry if chosen |
| B06-Q4 | **Partly answered (accepted decision 10, 2026-11-18):** if accepted, B06 adds the per-field damage signal for `components` and `project` in `shared/config.ts` itself under touch rights. **Open product choice:** should the lock-out extend to those fields when their value on disk was read with problems (`parseConfig` drops bad component entries or reads a non-list as empty, so Settings shows a partial list and a save writes it)? No finding owns this (FID-14); if accepted, it is added scope recorded with the user's acceptance. Recommendation: yes. | REQ-12, REQ-14 | B06 (user) | none | B06 build (in B06 planning) | Adds scope and a `shared/config.ts` edit |
| B06-Q5 | Should a stored draft detect that a different record now holds its ID when the file was recreated outside the board (needs a record identity beyond the content rev)? | REQ-05 | B06 | none | B06 build, after D-05 is recorded | REQ-05 acceptance |
| B06-Q6 | **Answered (accepted decisions 5 and 10, 2026-11-18):** `src/nav.ts`, the artifact details form in `ArtifactPanel.tsx` and the store save actions are B06's; `src/api.ts` transport is B05's and B06 adapts its call sites; PLAN's shared-files table lists the order. | | | | | |

## Risks and recovery requirements

- **Live agents write the same files.** The new save rule must never write more than before; a
  fault must fail closed (refuse and show the conflict or error) rather than write a whole record.
  Proof runs on the fixture board only.
- **Protocol drift between client and server.** B06's client must match D-04 exactly; a mismatch
  must surface as a visible error, never a silent partial write. Old client shapes are retired only
  as B05-REQ-08 and D-04 allow.
- **Settings writes the real config.** Keep mine and lock-out logic must not write a list derived
  from defaults or a partial read; manual checks use the fixture board.
- **Focus changes are global.** Sheet focus fixes must keep the docked panel's no-focus rule and the
  e2e flows that rely on "Keep editing" focus and Cmd S.
- **No persisted state to migrate.** Drafts are tab memory only; a reload already discards them after
  the prompt. Recovery from a bad build is a revert of this phase's commit.
- **DESIGN.md rule tension.** R-42's candidate ("every exit discards") would drop text without
  asking; REQ-05 keeps DESIGN.md's "never lost silently" rule instead.

## Execution and handoff obligations

1. Read PROGRESS.md in full (conventions 1 to 14 and accepted decisions), this SPEC, the owned
   findings in FINDINGS.md, B05's and B02's phase entries (the protocol and damage-signal contracts)
   and the recorded D-02, D-04, D-05 and D-06 answers. Stop if any gate above is unmet.
2. Resolve the open questions (B06-Q2, Q3, Q4, Q5) with the user as needed; record answers in
   PROGRESS.md before building. If B06-Q4 is accepted, record it as added scope with the user's
   acceptance.
3. Write `docs/board-fixes/phases/B06-edit-sheets-and-settings/IMPLEMENTATION.md` before building:
   approach per requirement, resolved questions, test approach, bites, checks and recovery.
4. Build in bites. Every proof fails before the fix and passes after it (convention 13); manual
   keyboard and focus checks are recorded with steps and the before and after result.
5. Update the doc lines that describe behaviour B06 changes (DESIGN.md "Item sheet", "the artifact
   page", "Settings"; README "How it works"; any About or SCHEMA line) and list every changed doc
   line under "Doc facts" in the PROGRESS entry (convention 12).
6. Bump the board version (minor: user-visible behaviour) in `requirements-board/package.json` and
   its lock file, and add a `CHANGELOG.md` entry (convention 5).
7. `npm run verify:board` green from the repo root; touched Playwright specs green on a free port
   (convention 6).
8. Run the three Buildbook review lenses (quality and maintainability; completeness against this
   SPEC; bugs and correctness), fix confirmed findings, rerun checks.
9. Give every owned finding (the 16 above) one disposition: **Fixed** (with its test or manual
   record), **Not reproducible at HEAD** (evidence), **Won't fix** (user accepted, reason) or
   **Moved** (named owner, recorded in PROGRESS.md and both SPECs). Name every minimal edit made in
   another phase's file (convention 11).
10. Commit this phase's files only, staged by path at commit time; never push. Write the PROGRESS.md
    phase entry last, with dispositions, decisions taken, Doc facts and facts later phases need.
