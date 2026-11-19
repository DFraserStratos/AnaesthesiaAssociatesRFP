# B06 implementation plan: Edit sheets and Settings

Session 2026-11-19, board 1.19.0 at `adbb3687` (master merged first: catalogue and plan files only, no
board code). Decisions: accepted decision 22 (B06-Q2 to Q5 and the D-04e retirement). Inherited: D-02
and B02-Q4 (decision 16), D-04 (decision 20), D-05 (decision 19), D-06 (decision 17), B07's delivery shape
and `hasUnsavedMoves()` (decision 21).

## Starting point (reverified at HEAD)

All 16 findings still reproduce; line drift only, plus what B02, B03, B05 and B07 delivered:
- R-01: B02's `config.statusState` exists; `StatusSection` still renders and saves a damaged list's
  readable part with no lock-out (the server refuses the save, 422).
- R-02: `keepMine` keeps the whole draft; `saveItem` sends the legacy `{ record }`, which the server reduces
  to every field that differs from disk, so untouched fields revert.
- R-12, R-41, R-42, R-43, R-107 to R-112: unchanged code paths (`useEditableRecord.ts`, `EditChrome.tsx`,
  `Sheet.tsx`, `ItemModal.tsx`, `QuestionModal.tsx`, `ArtifactPage.tsx`, `NewCardButton.tsx`, `nav.ts`).
- R-45: Settings sends no `bases` though B05 serves `config.revs` and answers 409 with `section`.
- R-111: server half done (B05: no-op writes nothing); the client still sends.
- R-123, R-124, R-125: unchanged in `SettingsView.tsx`.

## Technical choices

1. **Drafts in one module** `src/drafts.ts` (module map, `hasUnsavedDrafts`, `forgetDrafts(keys)`), so the
   store's create and delete can clear drafts for the IDs they make or remove (REQ-05) without the store
   importing a component.
2. **Field changes** `shared/patch.ts` gains `changedFields(kind, from, to)` and `patchBetween(kind, from, to)`
   (`{ patch, base }` over `PATCH_FIELDS`; `extra` key by key) and `overlay(kind, onto, from, fields)`.
   Pure, unit-tested, used by the hook.
3. **The hook** (`useEditableRecord`) takes `kind` and `save(change: RecordPatch<T>)`:
   - Save sends only the fields the user changed (`normalise(draft)` against `base.data`), with `baseRev`
     and the base values. No change: no request (R-111); a dirty draft that normalises to no change leaves
     edit without writing.
   - A disk change while dirty: fields changed on disk (`base.data` to `rec.data`) and by the user (`base.data`
     to `draft`); disjoint, the draft is rebased silently (Q2); overlapping, the conflict choice with the
     clashing fields. Keep mine rebases (disk copy plus the user's fields) and Save then sends only the
     user's fields; Load theirs as today.
   - A 409 adopts `current` and raises the conflict with `collisions`; the draft is untouched.
   - Edits during a save (R-41): the sent draft is kept in a ref; on success the fields typed since are laid
     over the saved copy and the sheet stays in edit; otherwise it leaves edit as today. Failure and 409
     never touch the draft.
   - A record that appears after the sheet opened is adopted (R-112); a stored draft resumes and Q2 applies.
   - Confirming a discard resets the hook (the draft is gone for good); `cancelPending` drops a waiting way
     out.
4. **Sheets:** the orphaned-draft sheet asks before any way out (`confirm` veil, `leave` on every exit, the
   docked guard included: R-42, R-107) and lists every changed field in readable form (R-43:
   `changedFields`, labels and values supplied per kind). The not-found sheet allows "renamed, removed or
   failing to parse" and names the check's error for that ID when there is one (R-112). The question
   stepper's anchor is set when the record first appears.
5. **`Sheet.tsx` focus (R-109, R-110):** the opener is captured at first render (before `autoFocus`); the
   frame takes focus only if focus is not already inside; a swap inherits the first sheet's opener; on
   the last close focus goes to the opener if still in the document, else to `main` (stable fallback). The
   veil focuses its safe answer only when it appears (keyed on the question's title), and inert is
   reapplied on every commit so content added under the veil is unreachable too.
6. **`nav.ts`:** `guarded` runs the action at once while a modal scrim is open (the docked draft is kept, as
   any navigation keeps drafts: R-108). The docked item drops a waiting ask when a question opens over it.
   `hasUnsavedWork(movesKept)` (drafts and B07's moves) moves here; App's beforeunload calls it. New card
   runs its guarded create from the form as it is when confirmed, and not at all if the form has gone.
7. **Artifact page (R-12):** with the artifact gone, a stored `artifact:<id>` draft shows an orphan panel
   (same changed-field list, the veil, Discard); otherwise the gone message. Full screen is left whenever
   the artifact is gone. The panel's veil also makes the panel content inert.
8. **Store and API:** `saveItem(id, change)`, `saveQuestion(id, change)`, `saveArtifact(id, change)` over
   `patchItem` / `patchQuestion` / `patchArtifact`; status menu, Retire and the answer flip send `{ status }`
   with its base. `saveConfig(patch)` requires `bases`. `putItem`, `putQuestion`, `putArtifact` are removed;
   the server's `{ record }` branches and base-less config sections become 400 (D-04e). Tests that used the
   old shapes move to patches (intent kept).
9. **Settings:**
   - Each section remembers the list and rev its edits started from; Save sends `bases`. While dirty, a disk
     change to that section shows the conflict banner at once (Voice's look: Load theirs, Keep mine; Save
     off until answered); a 409 shows it too.
   - Keep mine merges by row (`shared/settingsMerge.ts`): statuses by code, components by name, project by
     field; each field the user changed is kept, every other comes from disk; rows added on disk are kept,
     removed on disk are dropped; a field both changed keeps the user's value and is named. A fresh status
     row whose code a disk-added row now holds is renumbered with B02's `nextStatusCode` past the disk
     list, its high-water mark and every code in use, so two statuses never share a code.
   - Dirty means "saving would change the file": rows compared in stored form both sides; component codes
     upper-cased only where the user changed them; project name trimmed (R-125, R-124 merged case).
   - Lock-out (R-01, Q4): a damaged status list (B02's `statusState`), or a `project` or `components`
     section read with problems (`config.sectionState`, new), shows a banner naming the problems and that
     `board.config.json` must be fixed, no rows, no Add, no Save. Degraded status lists stay editable with
     their problems shown (B02-Q4). Returns live when repaired.
   - Components (R-123, R-124, Q3): "Used by" counts cards and artifacts; rename lock only on rows that came
     from the saved list; a non-empty list leaving in-use components unlisted lists them with counts and an
     "Add them" button, and Save stays off. Server: a components save is refused only for in-use components it
     newly leaves unlisted against the disk list; `project` and `components` saves refused while that section
     is damaged on disk.

## Execution bites

1. `src/drafts.ts`, `shared/patch.ts` helpers, hook rewrite; store and API; item, question and artifact sheet
   call sites; one-click writes; server legacy retirement; tests moved. Check: typecheck, Vitest.
2. Sheets: orphan sheet, not-found sheet, stepper anchor, `Sheet.tsx` focus and veil, `nav.ts`, New card,
   artifact page. Check: jsdom tests, typecheck.
3. Settings: `sectionState`, `shared/settingsMerge.ts`, sections, server config rules. Check: unit and API
   tests.
4. e2e on the fixture board (5182): new `e2e/edit-sheets.spec.ts`; `e2e/settings.spec.ts` additions.
5. Docs (DESIGN, README, About), version 1.20.0, CHANGELOG; `npm run verify:board`; fixture e2e; review.

## Concrete checks

- **Unit (node):** `changedFields` / `patchBetween` / `overlay`; settings merge (status code clash renumbered,
  disk-added kept, disk-removed dropped, both-changed named); `sectionState` from `parseConfig`.
- **API (node):** `{ record }` refused 400; base-less config section 400; components rules (adds unlisted
  refused, no worse accepted, artifact-only use counted, damaged section refused, file unchanged).
- **Hook and components (jsdom):** R-02 (Keep mine then Save sends only the user's fields; Q2 silent rebase
  of a parent change), R-41 (typing during a held save stays unsaved; held failure and 409 keep it), R-111
  (Cmd S unchanged sends nothing, still prevents default), R-112 (record appears), R-42 / R-107 (orphan
  exits ask; discard is final; create clears a leftover draft), R-43 (every changed field readable), R-109
  (title keeps focus; opener restored; swap keeps the opener; fallback is `main`), R-110 (a re-render under
  the veil does not move focus), R-108 (guarded with a scrim runs at once; New card uses the form as
  confirmed), R-12 (artifact orphan panel, full screen left, discard clears).
- **e2e (5182):** R-02 end to end through files (description edit, parent and `artifacts:` changed on disk,
  Keep mine, Save); R-45 status 7 added on disk while rewording (banner, Keep mine keeps 7, Load theirs);
  R-01 duplicate code lock-out and live repair; Q4 components lock-out live; R-123 and R-124; R-125; R-12.
- **Before-proofs:** every new test is run against `git archive adbb3687` in the scratchpad (node_modules
  linked); e2e before-proofs on a fixture board started from that archive.
- **Manual keyboard and focus** (5480, scratch copy of the fixture): open, edit, Esc, Cmd S, navigate away,
  conflict, Keep mine, Load theirs for the item sheet (modal and docked), the question sheet and the
  artifact details form; the veil with board search focused while a file changes.

## Recovery

No persisted data changes: drafts are tab memory; `board.config.json` gains no key (`sectionState` is
derived). A bad build is reverted by reverting this phase's commit. No test writes the real catalogue
(fixture board and temp folders only).

## As built (what changed from the plan)

1. **The New card guard** keeps the form in a ref and an `alive` flag set on mount (review: a flag set at
   creation was cleared by StrictMode's double mount, so New card created nothing in development).
2. **Focus, beyond the plan** (review and the manual check): answering a sheet's or the artifact panel's
   question puts focus back where it was (the panel keeps the place in a ref, as StrictMode mounts its veil
   twice); a modal sheet takes focus back whenever what had it goes (leaving Edit removes the field); a sheet
   opened with nothing focused gives focus to `main` on close, never `body`; the veil names its body
   (`aria-describedby`); save errors are `role="alert"`; a locked Settings section is `role="status"`.
3. **Settings keeps typing during a save** (review): the form at send is compared with the form when the
   answer comes, and later typing stays an unsaved change; the follow-the-file effect reruns when a save ends.
4. **Keep mine in Settings** leaves a quiet note naming anything it decided (a field both sides changed, a row
   the file removed, a new status renumbered).
5. **A degraded status list** can be saved with nothing changed (the repair), as B02-Q4 allows.
6. **B06-Q3's server rule** lives in the config route only; `shared/check.ts` already reports a component not
   in a non-empty list, so it needed no change.
7. **R-41** keeps the typing (the form is not made read-only).
8. **R-108**: a way out runs at once while a modal scrim is open (the docked draft is kept), and the docked
   panel drops a waiting question when a question sheet opens over it.

## Manual keyboard and focus check (2026-11-19)

Driven by a Playwright script (`scratchpad/manual/keysAll.mjs`, not committed) on a scratch copy of the e2e
fixture: after on port 5483, before (`git archive adbb3687`) on 5484. One line per step, as observed.

| Sheet | Step | Before B06 | After B06 |
|---|---|---|---|
| Item (modal, from Outline) | open | sheet focused | sheet focused |
| | Edit | title | title |
| | Cmd S, nothing changed | request sent, sheet left Edit (file unchanged: B05's server no-op) | nothing sent, stays in Edit |
| | Esc with an edit | (stopped: the form was gone) | veil, Keep editing focused |
| | Esc on the veil | | veil gone, edit kept |
| | Cmd S | | saved |
| | disk change to the same field | | banner names Description |
| | Keep mine, Cmd S | | mine saved, the agent's other key kept |
| | Load theirs | | field shows theirs |
| | Next with an edit | | veil, Keep editing focused; Keep editing keeps the edit |
| | close | | focus back on the Outline row that opened it |
| Item (docked) | open | no focus taken (body) | no focus taken (body) |
| | Edit, Cmd S, Esc, veil, conflict, Keep mine, Load theirs, board click | as above (stopped) | as for the modal |
| | veil up, typing in the board search while a file changes | focus yanked to Keep editing | focus stays in the search |
| Question (modal) | open, Edit, Cmd S, Esc, veil, conflict, Keep mine, Load theirs | as above (stopped) | as for the item |
| | Esc leaving Edit, then Esc | | the sheet keeps focus; close puts it on the page (`main`), never `body` |
| Artifact details | open | | no focus taken |
| | Edit, Cmd S, Esc, veil, conflict (Author), Keep mine, Load theirs, Artifacts crumb | as above (stopped) | as for the item; Keep editing keeps the edit |

## Recovery

No persisted data changes: drafts are tab memory; `board.config.json` gains no key (`sectionState` is
derived). A bad build is reverted by reverting this phase's commit. No test writes the real catalogue
(fixture board and temp folders only). The server now refuses the whole-record and base-less config shapes:
a client older than B06 (another open tab not reloaded) gets a 400 on save and must reload.

## Handoff

See the PROGRESS entry ("What later phases need").
