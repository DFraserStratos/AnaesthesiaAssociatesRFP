# Phase B05: Server write model

**Status:** COMPLETE (2026-11-19; see PROGRESS B05 entry and IMPLEMENTATION.md)

**Requirements:** R-26, R-37, R-54, R-55, R-56, R-64, R-67 ([FINDINGS.md](../../FINDINGS.md), "Findings in
detail", `#### R-nn`); systemic issue 1 (writes rebuilt from a stale or lossy model) and the R-54 part
of systemic issue 3; refuted appendix item A-1 (ID reuse is deliberate). Programme outcome 1 and the
B05 row and split-delivery note in [PLAN.md](../../PLAN.md). Split deliveries (PROGRESS accepted
decisions 4 and 7): B05 builds the server halves of **R-45** and **R-111**, and **B06 closes** them;
B05 delivers **R-56 whole**, store included; B05 closes **R-54**, consuming B08's deletion bound.

**Owns:**
- The write protocol for every catalogue write route in `server/catalogueApi.ts` (items, questions,
  artifacts, config including statuses and components, layout and lanes): what a write carries, what a
  stale write does, what a conflict response contains, and what a write leaves untouched. Decision
  **D-04**.
- The client API transport in `src/api.ts` for these routes (accepted decision 5).
- In-place editing of record files, so a save changes only what it was asked to change
  (`shared/files.ts` write side, `server/catalogueFs.ts` write helpers), and the `cited_as` lint
  wording once R-37 is fixed (PLAN B05 territory).
- The artifact-details PUT (R-37).
- All-or-nothing multi-file writes: item batch, item delete, and lane rename and lane removal as one
  write, including switching the store's `renameLane` and `deleteLane` to that write (R-56, whole).
- One integrity check and one issues broadcast per write request (R-26).
- The Freeform lane-list rule: what a layout write validates, and the check reporting every lane rule
  the write path enforces (R-55).
- Atomic create on any filesystem (R-64) and `artifact:new` ID claiming (R-67).
- ID allocation and the ID-reuse rule, decision **D-05** (the user decides), its journal handling, and
  applying B08's deletion bound so a reused ID's history starts clean (R-54).
- The server halves of R-45 (config conflict checks) and R-111 (no-op saves); B06 closes both.
- Recording the protocol in `PROGRESS.md` so B07 and B06 build on it.

**Excludes:**
- Client save flows: sheets, drafts, "Keep mine", Settings saves, Cmd/Ctrl+S gating, the store's save
  actions (B06: R-02, R-12, R-41, and the client halves of R-45 and R-111, which B06 closes).
- The store's live-update path, layout save queue, pending-position and undo clean-up, load/event
  ordering, `syncFromDisk` and event sending, and the `catalogue:changed` event shape (B07: R-57, R-58,
  R-59, R-158, R-159). B05's minimal edits in `syncFromDisk` (R-54 journal step) and event emission
  (R-26) are made under touch rights (convention 11) and B07 keeps them.
- The status registry, recodes, the status in-use guard and the damaged-list refusal of status saves
  (B02: R-01, R-68, D-02). B05's conflict check for config wraps B02's guard; it does not redefine it.
- Per-file load isolation, BOM, dotfiles and layout entry parsing in `server/catalogueFs.ts` and
  `shared/files.ts` (B03).
- Sidecar lint rules, code masking, shared text rules (B04: R-38, R-60 and others); B05 only rewords the
  `cited_as` lint once saves keep `cited_as`.
- The shared git log reader, its cache and the deletion bound itself (B08, D-07); timeline drawing (B09).
- Lane merge, renaming a lane onto an existing one (B11: R-119), which extends B05's lane route under
  touch rights and keeps its all-or-nothing guarantee. B05's lane write need not offer a merge form.
- Request-origin guard, ID path decoding, write token (B01, D-01).
- `new-artifact.ts` relative path handling (B14: R-31); the whole-file docs truth pass (B14).

**Depends on:** B02, B03, B04, B08 (PLAN "Depends on" column), in the serial order B01, B02, B03, B04,
B08, **B05**, B07, B06, B09, B10, B11, B14, B15.
- **B02** (hard): the config route's status guard, registry and damaged-list state, which the config
  conflict check sits on top of.
- **B03** (hard): per-file load isolation in `loadCatalogue`, BOM and layout parsing, which the in-place
  writer must read through.
- **B04** (hard): shared rules and lint in `shared/files.ts` and `shared/check.ts`, which B05 extends for
  the lane-list report and the `cited_as` wording.
- **B08** (hard): the deletion bound in its git reader output and the D-07 contract; B05-REQ-20 applies it.
- **B01** (file order): ID decoding and origin guard in `server/catalogueApi.ts` come first.
- **Gates:** D-05 with B05-Q2 and B05-Q3 settled in a B05 planning conversation **before B08 builds**
  (planning-only gate, accepted decision 8); D-04 recorded before B05 builds; D-07 recorded by B08.

**Unblocks:**
- **B07**: builds on the write and layout contract (R-59 overlapping layout saves, R-57, R-58) and keeps
  B05's config section base tokens and R-54 journal step when it reworks events and `syncFromDisk`.
- **B06**: closes R-45 and R-111 on B05's server halves, and builds R-02 and R-41 on the protocol
  (field-level saves, conflict responses, config conflict detection, no-op saves).
- **B11**: extends the lane route for R-119's merge.
- **B14**: writes SCHEMA's ID-reuse wording and does the whole-file pass from B05's Doc facts.
- **B13** (`scripts/apply-links.ts`) and **B12/B14** (`scripts/capture.ts`) inherit whatever `writeItem`
  becomes. B13 may merge before B05 from its worktree; B05 keeps B13's merged `apply-links` tests green.

**Binding constraints:**
- PLAN.md "Binding constraints (every phase)" and PROGRESS.md conventions 1 to 14: existing stack (the
  `yaml` package is already a dependency; any new dependency needs a recorded reason), board code stays
  project-generic, version bump plus CHANGELOG entry, `npm run verify:board` green, touched Playwright
  specs pass on a free port, no change to requirement content, live lanes stay compatible, never stage
  mid-phase, commit and merge but never push, one app phase at a time in the serial order, touch rights
  (11), doc lines with Doc facts (12), every proof fails before the fix and passes after (13).
- Agents and scripts edit catalogue files directly and concurrently with the board (root `CLAUDE.md`,
  README "How it works"). The server must never assume it is the only writer.
- Live build lanes (`-laneA`, `-laneB`, `-U2`, `-U3`) merge master and run this board and
  `artifact:new`. CLI arguments and output that agents rely on stay compatible.
- Any catalogue data migration (for example seeding a deleted-ID list under D-05) is shown to the user
  before it runs and leaves `npm run check` green (PLAN binding constraint "Catalogue data", convention 7).

## Objective and outcomes

The board server is the one place where browser edits reach the catalogue files, alongside agents
who write the same files by hand. Today some writes rebuild a whole file from a parsed model, so
anything the model does not hold is lost; some multi-record changes land half done; and every record
in a batch re-runs the whole catalogue check. When B05 is delivered:

1. **A write changes only what it was asked to change.** Fields, keys, comments, formatting and body
   sections the request did not touch survive byte for byte, including content the board does not
   understand. A write that changes nothing writes nothing.
2. **A write is checked against the file on disk.** A stale write never silently overwrites a change
   made on disk since the client's base; the conflict response gives the client what it needs to
   adopt, show and retry.
3. **A change that spans files lands whole or not at all**, including renaming or removing a lane.
4. **A write request costs one integrity check and one issues broadcast**, whatever its size.
5. **A Freeform drag is never refused for a lane problem it did not cause**, and every lane rule the
   server enforces is visible in Checks.
6. **Creating a record works on any filesystem** and two concurrent creators (board or `artifact:new`)
   never collide, overwrite each other or leave a half-registered artifact.
7. **ID allocation matches the documented rule** (D-05), and a card's history never shows a deleted
   card's past as its own.
8. **B06 and B07 have a recorded, tested protocol** to build their client fixes on.

## Sources and current-state evidence

Code verified at HEAD `d4341735` (board 1.12.3), which is the commit the review ran against. Every
owned finding still reproduces; line numbers are unchanged except where noted.

| Finding | Location at HEAD | Verified |
|---|---|---|
| R-26 | `server/catalogueApi.ts:219-227` (`commitItem`: write, journal, `refreshIssues()`, item event, issues event, per record); batch `:398-417` (one `guard`, then `commitItem` per record at `:416`); delete `:375-376` (`commitItem`/`commitQuestion` per rewrite) and `:393-394` (a further refresh). `commitQuestion` `:228-235` has the same shape. | Reproduces by inspection. |
| R-37 | Artifact PUT `server/catalogueApi.ts:305-323`; `shared/files.ts` `mermaidOf` `:417-420`, `toArtifact` `:425-445` (non-list `cited_as` read as `[]` at `:436`), `parseArtifact` `:447-451`, `serialiseArtifact` `:453-499`, `withArtifactDetails` `:514-529`, `artifactRoundTripProblems` `:532-536` (description only). | **Reproduced in scratch:** a title-only change dropped a mapping `cited_as`, an unknown region key and its comment, the `## Source` legend prose, and wrote `pad: wide` as `pad: .nan`. |
| R-54 | Create route `server/catalogueApi.ts:419-452` (`nextItemId` over file names plus state); `shared/ids.ts:26-46` (max + 1 per prefix, so a deleted top ID is reissued; `nextArtifactId` behaves the same); `server/gitHistory.ts:155-156` (finding cited `:151`; versions keep the deletion as `item: null`); `shared/history.ts:259-268` (`buildTimeline` diffs across a null version without resetting); `syncFromDisk` `:605-638` never calls `journal.forget`; `requirements/SCHEMA.md:73`, `:267` ("Never reused") and `:451-452` ("No deletes"). Reuse itself is deliberate and tested: `tests/historyJournal.test.ts:173` ("a new card given the same ID starts with a clean history"), README "Delete" bullet; SCHEMA `:458` documents OQ reuse. | Reproduces by inspection. |
| R-55 | `server/catalogueApi.ts:567-599`, lane validation `:578-586` runs `laneListProblem` over the disk list even for a positions-only body; `server/catalogueFs.ts:90-106` (`readLayout` drops blank and non-string lanes silently and reports nothing); `shared/move.ts:139-154` (`MAX_LANE_NAME` 40, case-insensitive duplicates); SCHEMA `:369-372` omits the 40-character limit. | Reproduces by inspection. |
| R-56 | `src/store.ts:313-314` (`renameLane`: `moveItems` with `record: false`, then `setLanes`), `:271-281` (`setLanes` restores the old lanes on failure but the stories stay renamed). **Also at HEAD:** `deleteLane` `:317-319` has the same two-write shape. | Reproduces by inspection. |
| R-64 | `server/catalogueFs.ts:235-247` (`createAtomic` uses `linkSync`, translates only `EEXIST`); callers `:251`, `:257`, `scripts/new-artifact.ts:123`. | Reproduces by inspection (no exFAT volume tested in authoring). |
| R-67 | `scripts/new-artifact.ts:59-60` (ID picked from a snapshot), `:76-101` (file copied with `copyFileSync` without exclusive flag, or moved with `git mv`, before the claim), `:123` (`createAtomic` claim, no retry). | Reproduces by inspection. |

Related evidence that shapes the protocol:

- **The batch route already merges field patches** (`catalogueApi.ts:398-417`): each change is
  `{ id, baseRev, patch }`; the server reads the file, checks `baseRev` strictly (409 with `current` on
  any difference, `:214-217`), lays the patch over the record as on disk, normalises, checks every
  record and the whole once, then writes. It still rewrites each file in canonical form.
- **Every other record write sends a whole record.** `PUT /api/items/:id` and `/api/questions/:id`
  replace the record (`:343-353`, `:454-462`); this is the mechanism behind R-02. The artifact PUT
  takes only editable fields but re-serialises the whole sidecar (R-37).
- **Config and layout have no base.** `PUT /api/config` patches the sent fields onto the file on disk
  but replaces each sent list whole, with no conflict check (`:505-565`; R-45). `PUT /api/layout`
  patches positions per ID onto the file on disk and replaces `lanes` whole (`:567-599`).
  `PUT /api/voice` has a base rev and a 409 (`:494-503`), the pattern R-45 asks Settings to reuse.
- **Saves rewrite hand-formatted files.** In scratch, `serialiseItem(parseItem(text))` for an
  agent-written story with a flow list, a quoted title and a comment returned different text, so any
  board save (and an unchanged Cmd/Ctrl+S save, R-111) produces a spurious diff on such a file.
- **Error shape** (`server/cataloguePlugin.ts:151`): `{ error, ...body }`; a 409 body carries
  `current`. The client reads `error` and `current` (`src/api.ts:29-38`). Status meanings in use:
  400 malformed, 404 missing, 409 changed on disk ("Keep mine" can answer), 422 cannot be answered by
  "Keep mine" (unreadable file, id mismatch, a rule the result would break), 503 no free ID.
- **Other writers of the same helpers:** `scripts/apply-links.ts:49` and `scripts/capture.ts:486-487`
  call `writeItem`; capture skips the write when `serialiseItem(next) === before`.
- **Consumer findings read for the protocol:** R-02 (Keep mine resends the stale whole draft), R-41
  (edits typed during an in-flight save), R-45 (Settings saves with no conflict check), R-111 (an
  unchanged save rewrites the file), R-57 (orphan positions), R-58 (snapshot overwrites a newer event),
  R-59 (overlapping failed layout saves).

Assumptions (not verified facts): the server handles writes synchronously on one thread, so writes
from the board do not interleave with each other; agents' direct edits can still land between the
server's read and its write, in a window of milliseconds.

## Detailed requirements

### Write protocol (D-04)

**B05-REQ-01 · A record write carries the change, not the record** (systemic 1; enables R-02, R-41,
R-111 in B06). After B05 the item, question and artifact write routes accept a change expressed as the
fields the client changed, together with the base the client edited. The server applies those fields
to the record as it is on disk now. Fields the request does not name are left exactly as on disk,
whatever the client's copy of them says. Observable: a card whose `parent`, `order`, `swimlane`,
`images`, `artifacts` or unknown keys changed on disk after the sheet opened keeps those changes when
the sheet saves a description edit, with or without an intervening conflict. Whether the base is a
file rev, per-field expected values, or a base record is D-04.

**B05-REQ-02 · A stale write never silently overwrites a change on disk** (systemic 1; R-02, R-45).
When the file on disk is no longer at the client's base, the server either applies the change because
none of the fields it names were changed on disk since the base, or refuses it with a conflict. It
never writes a value over a field that changed on disk since the base unless the client explicitly
retries against the newer version. Which of the two the server does for non-overlapping changes is
D-04; both must be specified and tested for the chosen option.

**B05-REQ-03 · A conflict response lets the client recover** (R-02, R-41, R-45, R-56). A conflict
(409) carries enough for the client, without another request, to: adopt the record as it is on disk
now (its content and the base to retry against); tell the user which of its changes collide with
changes on disk, if any; retry only its own changes against the newer base ("Keep mine"); or discard
them ("Load theirs"). For a multi-record write, the response identifies every record that blocked it,
with each one's current copy, so a client can refresh all of them. Refusals that "Keep mine" cannot
answer stay 422; malformed requests stay 400; a missing record stays 404. The exact field names of the
conflict body are D-04.

**B05-REQ-04 · The success response supports rebasing** (R-41). A successful write returns each written
record as it now is on disk, with its new base. A client that kept typing while the save was in flight
can compare what it sent with its live draft and send the remainder as a further change against the new
base, without losing either.

**B05-REQ-05 · A write that changes nothing writes nothing** (R-111, server half). A change whose fields
all equal the values on disk, an empty change, or a whole record identical in content to the file on
disk, leaves the file byte-identical: no write, no journal entry, no item event, and the response
returns the record as it is with its unchanged base. This is the server half of R-111 (accepted
decision 7); B06 gates the client's save on a real change and closes R-111.

**B05-REQ-06 · Settings writes are conflict-checked** (R-45, server half). Each config section the
Settings page writes (project, components, item statuses, question statuses) is checked against the
version of that section the client last saw. A write to a section that changed on disk since is a
conflict with that section's current value, in the shape of B05-REQ-03, so B06 can reuse the Load
theirs / Keep mine banner already used for VOICE.md. Sections not sent are kept as on disk (today's
behaviour). The client must be able to read the base token for each section from the catalogue
snapshot and from config events (B07 keeps them when it reworks event delivery). B02's status rules
(in-use guard, damaged-list refusal, registry) run on the merged result and keep their 422 answers.
This is the server half of R-45 (accepted decision 7); B06 wires Settings to it and closes R-45.

**B05-REQ-07 · Layout writes keep patch semantics and are safe to retry** (R-59, R-57, R-58 in B07).
Position writes stay per-ID patches applied to the layout file as it is on disk (`null` restores the
story-map place). Applying the same patch twice gives the same file. A position write carries no
precondition that would make a retried batch fail for good. The response returns the layout as
written. B05 does not order overlapping client batches; B07 does (by serialising flushes or another
means it chooses) and the server must not prevent that.

**B05-REQ-08 · Transition: existing clients keep working** (preserved behaviour). Until B06 and B07
switch their save flows, the request shapes the client sends today keep working with at least today's
guarantees: `PUT /api/items/:id` and `/api/questions/:id` with `{ record, baseRev }`,
`PUT /api/artifacts/:id`, `POST /api/items/batch`, `PUT /api/config` without a base, and
`PUT /api/layout` with `lanes` or `firstLane`. A whole-record write whose base matches the disk must
also obey B05-REQ-09 and B05-REQ-05 (only the fields that differ from disk are written). Whether the
legacy shapes are retired after B06/B07, and when a config base becomes mandatory, is part of D-04 and
is recorded in PROGRESS.md.

### Untouched content survives

**B05-REQ-09 · A save edits files in place** (R-37; programme outcome 1; enables R-111). Writing a
change to an existing record alters only the parts of the file that hold the changed fields. Everything
else in the file stays byte-identical: other frontmatter keys and their order, quoting, flow or block
style, comments, unknown keys and values the board cannot read, and body sections the change did not
touch. A changed body section replaces only that section's text. New records (create) are still
written in the canonical form so new files stay consistent. Scope: unconditional for artifact sidecars
(R-37). For items and questions it is the programme outcome; narrowing it there (for example keeping
canonical rewrites for items) needs the user's acceptance through D-04 and is recorded.

**B05-REQ-10 · The artifact-details save keeps everything it does not edit** (R-37). `PUT
/api/artifacts/:id` changes only the editable details (title, kind, status, superseded_by, date,
author, components, sources, description) that the request changes. It keeps byte for byte: `cited_as`
in any shape (including a mapping or a mistyped key), `file`, `regions`, `steps`, `step_view`, region,
step, move and citation keys it does not know, non-mapping rows, values it cannot read (a `pad: wide`
stays `pad: wide`), comments, and the whole `## Source` section, prose and every fenced block. If a
requested change cannot be written without losing data, the route refuses it with 422 naming what
would be lost; it never writes a lossy file. `superseded_by` still only stays on a Retired artifact
(current rule in `withArtifactDetails`), and the board still never edits the file, regions, steps or
diagram source.

**B05-REQ-11 · Hand-written files load and save as before** (preserved behaviour). Any file an agent
writes that loads today still loads. A board save to such a file leaves the agent's formatting of
untouched fields alone (B05-REQ-09). Integrity guard, round-trip refusals (a section heading inside
the description, 422), the rule that `extra` never overrides a validated key, and the rule that an
item's type cannot change all still apply to the merged result.

### Multi-file writes

**B05-REQ-12 · Multi-record writes are all or nothing** (R-56; preserved for batch and delete). The
item batch, item delete and lane changes (B05-REQ-13) check every precondition (each record's base, the
shown-IDs set for delete, lane rules, integrity rules over the whole result) before writing any file.
If a file write then fails part way, the files that request already wrote are put back to their
previous content and the response says the write failed; if putting back fails too, the response names
exactly which files changed. Delete keeps its safety order: no failure part way can lose a record that
was meant to stay (references are rewritten before files are removed). After a process crash part way,
the state left is one `npm run check` reports (for example a story in an unlisted lane), never silent.

**B05-REQ-13 · Renaming or removing a lane is one write, from the board too** (R-56, whole;
`deleteLane` at `src/store.ts:317-319` has the same mechanism). The server offers one request that, for a lane
rename, changes the lane list in `board-layout.json` and the `swimlane` of every story in that lane,
and for a lane removal, clears those stories' `swimlane` and removes the lane, all or nothing under
B05-REQ-12. It is refused, changing nothing, if: a story it would change is not at the client's base;
the lane to rename or remove is no longer on disk (unless it is the story-only lane case the client
handles today, where a name used only by stories becomes a lane); the new name breaks a lane rule; or
the layout file cannot be read. The response returns every rewritten story and the new layout. Renaming
the first lane stays a layout-only write that changes no story.

B05 also switches the store's `renameLane` and `deleteLane` (`src/store.ts:284-320`) to this one request,
a minimal edit under touch rights (convention 11; PLAN `src/store.ts` row "B05 (lane rename)"). Observable
from the board: a refused rename or removal leaves both the stories and the lane list unchanged, in the
store and on disk, with the refusal shown as today (`moveError`); a successful one updates the stories
and lanes from the response. The client-side name check before sending stays. Lane changes stay outside
undo as today unless the B05 planner decides otherwise and records it. B11 later extends this route for
R-119's merge (rename onto an existing lane) under touch rights and keeps its all-or-nothing guarantee;
B05's request refuses a rename onto an existing lane, as a lane-rule breach.

### Cost per write

**B05-REQ-14 · One check and one issues broadcast per request** (R-26). Any write request, however
many records it writes (batch, delete, lane change, single save), runs the full integrity check over
the result at most once after writing (in addition to the pre-write guard) and emits exactly one
`issues` event. Per-record item/question/artifact events may stay one per record unless B07 batches
them (R-159); B05 must not block that. Observable: a 40-story lane rename emits 40 item events and one
issues event (today 80 events), and its time grows with the records written, not with records times
catalogue size.

### Lanes rule

**B05-REQ-15 · A positions-only write is never refused for lane problems** (R-55). A layout write that
does not change `lanes` or `firstLane` is accepted whatever the lane list on disk looks like (an
unreadable layout file is still refused, 422, as today). A write that changes the lane list is refused
only if it would add a lane problem not already present, the principle the integrity guard already uses
(`guard`, `catalogueApi.ts:148-154`).

**B05-REQ-16 · Every lane rule the server enforces is visible in Checks** (R-55). Each rule
`laneListProblem` enforces (a name over 40 characters, spaces around a name, a blank name, a duplicate
regardless of case, a clash with the first lane's name, `Unassigned` included) is reported by `npm run
check` and the board's Checks when the file on disk breaks it, through the same rule implementation
the write path uses. Lanes `readLayout` currently drops silently (blank or non-string entries) are
reported too. SCHEMA's `lanes` paragraph states the 40-character limit.

### Creating records

**B05-REQ-17 · Create works without hard links** (R-64). Creating an item, question or artifact
sidecar succeeds on filesystems that refuse hard links (exFAT, some network mounts: `EPERM`,
`ENOTSUP`, `EXDEV` or similar) with the same guarantees as today: it never replaces an existing file,
of two concurrent creators of one ID exactly one wins and the other moves to the next ID, a reader or
the watcher does not see a half-written record (if a fallback cannot guarantee this, the gap and its
recovery are recorded in IMPLEMENTATION.md and accepted in review), and no temporary file is left
behind. Other filesystem errors still surface as errors.

**B05-REQ-18 · `artifact:new` claims its ID before touching any file** (R-67). The script claims the
next free `AR-nn` exclusively before it copies or moves the artifact's file; if another writer took
that ID, it moves to the next one, with a bounded number of attempts as the API does. Bringing the file
in never overwrites an existing file (a drawing copy included). If bringing the file in fails after the
claim, the claimed sidecar is removed and the original file is where it was, with nothing left moved or
staged. Two concurrent runs end with two distinct IDs, each sidecar pointing at its own file. Its
arguments, defaults and printed output stay compatible (live lanes and the `add-artifact` skill use it).

### IDs and history (D-05)

**B05-REQ-19 · ID allocation follows the decided rule** (D-05; PLAN B05 row "ID allocation matches
SCHEMA"). Every allocator (the create routes and `artifact:new`) follows one rule, the D-05 answer, for
items, questions and artifacts. Whatever the answer, these hold: a new record never lands on an
existing file, even one that fails to parse (`tests/api.test.ts:57`); IDs follow the parent's numbering
at creation and never change; the board and `artifact:new` agree. Conditional on D-05:
- *If reuse stays allowed:* the freed IDs that can be reissued are exactly the ones SCHEMA says
  (B14 writes the text), and B05-REQ-20 holds.
- *If IDs are never reused:* a deleted ID (by the board or by hand, as far as the decided mechanism can
  know) is never issued again by any allocator, and the record of deleted IDs survives restarts,
  merges and other worktrees as the decision specifies.

**B05-REQ-20 · A card's history never shows a deleted card as its past** (R-54). When an ID is used
again after its card was deleted, the new card's History starts at its creation: none of the deleted
card's journal entries or git versions appear as its edits. This holds for a delete through the board
(today's journal `forget`) and for a file removed by hand or by a script. The same holds for an
artifact's history if artifact IDs can be reissued. B05 applies B08's deletion bound (from B08's reader
output under D-07) in two places: the journal step for a card that disappears (a minimal edit in
`syncFromDisk` and `historyJournal.ts` under touch rights, which B07 keeps) and the timeline cut in
`buildTimeline` (`shared/history.ts`, which B09 keeps). B05 does not build the bound itself; B05 closes
R-54. A file deleted and then restored as the same record is not a reuse; how the two are told apart,
and how a branch switch that removes and restores files is treated, are B05-Q2 and B05-Q3, settled with
D-05 before B08 builds so B08's bound fits the rule. Bare-ID mentions of a deleted ID in other records do not silently come to
mean the new card: under reuse they are stripped, flagged by the check or documented as the decided
behaviour; under no reuse they keep naming nothing (today's check warning).

*Reissue before the deletion is committed* (FID-18; conditional on D-05 choosing "reuse allowed"). The
common path is: a committed card is deleted on the board, a new card created at once receives the same
ID, and the next commit records the path as modified, not deleted. B08's bound marks only committed
deletions, so it never fires here, and B05's own handling must cut the history: the new card's History
shows only the new card, both before and after that commit, and none of the old card's git versions or
journal entries appear under it. The means is B05's planning choice (for example a reissue marker kept
with the deleted record's last version, at or before which the timeline cuts git versions). If D-05
chooses "never reused", the case cannot arise, because no allocator reissues the deleted ID; the
phase entry then records it as not applicable.

### Preserved behaviour (must not regress)

**B05-REQ-21 · Existing guarantees stay.** Every record write re-reads the file from disk first, and
adopts and broadcasts a newer disk version the watcher has not caught yet; a record write without a base
is 400; the integrity guard runs on exactly what will be written and refuses only errors not already
present (422); delete keeps its shown-IDs check (409 when what sits under the card changed), removes
layout positions and `assets/<ID>/` (unless an image is still used), and sets the journal aside; config
writes keep every part of `board.config.json` they were not sent; the VOICE.md route keeps its conflict
semantics; layout writes keep refusing an unreadable layout file; card changes and Freeform moves are
journalled once each with source `board`; event kinds stay `item`, `question`, `artifact`, `layout`,
`config`, `issues` unless B07 changes them; creates retry past a taken ID and answer 503 after the bound;
`scripts/apply-links.ts` and `scripts/capture.ts` keep working, and capture still skips a card it did not
change; B13's `apply-links` tests, merged from its worktree before or after B05, stay green. Existing tests in `tests/api.test.ts`, `tests/historyJournal.test.ts` and `tests/catalogue.test.ts`
keep passing, or change only where the behaviour is meant to change, each such change named in the
phase's PROGRESS entry.

## Dependencies and handoffs

**Inputs consumed:**
- B01's ID path decoding and origin guard in `catalogueApi.ts`.
- B02's config status guard, registry and damaged-list state (snapshot and config event).
- B03's per-file load isolation, BOM and layout entry parsing.
- B04's shared helpers and lint in `shared/files.ts` and `shared/check.ts`.
- B08's deletion bound in its reader output and the D-07 contract (how a deletion, and a different
  record re-added at the path, are marked), used by B05-REQ-20. B08 builds before B05 and does not edit
  B05's code; if the bound does not fit the D-05 answer, B05 stops and raises it rather than rebuilding
  the reader.
B05 builds on these shapes and must not undo them.

**Outputs owned (the contract B07 and B06 consume):** recorded in PROGRESS.md as part of B05's entry,
and in the route comment at the top of `catalogueApi.ts` and the README "How it works" bullets:
1. Request shape of every write route (change plus base), including the lane change request, and the
   matching transport functions in `src/api.ts`.
2. What a stale write does (merge or refuse, per D-04), with examples.
3. Conflict body: current copy, base to retry against, colliding fields, every blocking record.
4. Success body: written records with new bases; no-op answer (R-111 server half).
5. Config section base tokens: where the client reads them (snapshot, events) and how it sends them
   (R-45 server half). B07 carries them through its event rework.
6. Layout write semantics (idempotent patches, no ordering by the server).
7. Which legacy request shapes remain and until when.
8. The ID rule (D-05), its journal handling and how B08's bound is applied (R-54). B07 keeps the
   `syncFromDisk` journal step; B09 keeps the `buildTimeline` cut.
9. The store's `renameLane` and `deleteLane` on the one-write request, which B07 and B11 build on.

**Files B05 edits in other phases' territory** (touch rights, convention 11; PLAN shared-files rows):
`src/store.ts` (`renameLane`, `deleteLane` only), `server/historyJournal.ts` and `syncFromDisk` (R-54
journal step), `shared/history.ts` (`buildTimeline` cut), `shared/check.ts` (lane-list report),
`scripts/new-artifact.ts` (ID claiming; B14 later sweeps paths). Each is named in B05's PROGRESS entry.

**Doc lines** (convention 12): B05 updates the lines that describe behaviour it changes: the route
comment in `catalogueApi.ts`, README "How it works" bullets on saves, conflicts, creates, artifact
details, lanes and delete, SCHEMA's `lanes` paragraph (40-character limit), SCHEMA's `cited_as` "the
board keeps it" line if its meaning changes, and the About page if it describes any of these. SCHEMA's
ID-reuse wording is B14's (PLAN B14 territory); B05 records the decided rule under Doc facts for it.

**Integration proof owner:** B05 proves the server side of the contract with API-level tests and the
store's lane path with store tests. B07 and B06 prove their client flows on it. B15 owns end-to-end proof.

## Acceptance and evidence

Every proof below must fail on the code before the fix and pass after it (convention 13); a recorded
manual check stands in only where a test is not practical, and says so.

| Finding / REQ | Proof obligation |
|---|---|
| R-37 · REQ-09, REQ-10 | A details save on a sidecar with a mapping `cited_as`, a mistyped citation key, an unknown region/step/move key, a non-mapping row, an unreadable number, comments and prose plus several fences in `## Source` leaves every byte outside the changed field unchanged. A live test saves a details change to every sidecar in the real catalogue in a scratch copy and shows only the changed lines differ. A change that cannot be written losslessly is refused with 422 and the file is untouched. |
| R-26 · REQ-14 | A batch of k records and a delete with rewrites each emit exactly one `issues` event and run the post-write check once, shown by an event count and a call count independent of k; timing of a 40-story rename recorded before and after. |
| R-55 · REQ-15, REQ-16 | With a 46-character lane (and separately a case duplicate and an `Unassigned` clash) on disk: a positions-only write succeeds; `npm run check` reports the problem; a lane write that fixes or does not worsen it succeeds; one that adds a problem is refused. SCHEMA states the limit. |
| R-56 · REQ-12, REQ-13 | Server: a lane rename and a lane removal against an unreadable layout file, a refused name, and one stale story each change no file (stories and layout byte-identical); a good rename changes the lane list and every story in one request; a simulated write failure part way restores the files already written. Store: `renameLane` and `deleteLane` send one request; a refused rename or removal (unreadable layout, stale story) leaves the store's stories and lanes as they were and the files on disk unchanged, with the refusal in `moveError`; a good one updates both from the response. |
| R-64 · REQ-17 | With hard-link creation forced to fail (`EPERM`, `ENOTSUP`, `EXDEV`), create succeeds, refuses an existing target, and leaves no temp file; two creators of one ID end with two IDs. Plus a recorded manual create on an exFAT disk image. |
| R-67 · REQ-18 | Two runs started from the same snapshot end with distinct IDs and their own files; a run whose file step fails leaves no sidecar, no moved or staged file, and the original in place; a drawing copy never overwrites. |
| R-54 · REQ-19, REQ-20 | After a board delete and after a hand delete (file removed, watcher sync) of the top card, a new card given the ID, if the rule allows one, shows only its own creation in History, from both the journal and git (git through B08's bound). A record deleted and restored keeps the history B05-Q3's answer gives it. Under "reuse allowed": commit a card, delete it on the board, create a new card that receives the ID, commit; the new card's History shows only the new card (fails today: the old card's commits show beneath it as its past, with no deletion in git for B08's bound to mark). Under "never reused" this case is recorded as not applicable. Under the chosen D-05 rule, allocators agree (API and `artifact:new`). The existing reuse test (`tests/historyJournal.test.ts:173`) is kept or replaced as D-05 dictates. |
| R-111 (server half) · REQ-05 | An unchanged save, an empty change and an identical whole record leave the file, journal and events untouched. B06 closes R-111 on its client proof. |
| R-45 (server half) · REQ-06 | Two config writes to one section from the same base: the second is a conflict with the section's current value; a write to another section succeeds; B02's guards still refuse with 422. B06 closes R-45 on its client proof. |
| Protocol · REQ-01 to REQ-04 | API tests: a description change after a concurrent `parent`/`order`/`swimlane`/`artifacts`/unknown-key change on disk keeps both; a stale overlapping change is a conflict carrying the current copy, the base and the colliding fields; Keep mine (retry of only the client's fields on the new base) keeps the concurrent change; a multi-record conflict names every blocker; a write's response lets a second change on the new base succeed. |
| REQ-07 | Repeating a position patch gives a byte-identical layout; a failed patch can be retried and succeed. |
| REQ-08, REQ-11, REQ-21 | The current client passes the existing Vitest suite and the touched board Playwright specs on a free port; hand-formatted fixture files keep their formatting through a save; `apply-links` (including B13's merged tests) and `capture` tests pass. These are regression guards on preserved behaviour, so they pass before and after. |

Prohibited regressions: any loss of a field, key, comment or section on save; a refused Freeform drag
caused by a lane problem the drag did not create; a half-applied lane change from the server or the
board; a create that overwrites; a new record on an unparseable file's ID; any change to requirement
content in the real catalogue.

Criteria awaiting a named decision: the merge-or-refuse behaviour for non-overlapping stale changes
(D-04), conflict body field names (D-04), item/question in-place scope (D-04), legacy-shape retirement
(D-04), and the ID rule with its allocator and history obligations (D-05, B05-Q2, B05-Q3).

## Deferred decisions for execution planning

Shared register: [PROGRESS.md](../../PROGRESS.md) "Deferred decisions". Answers are recorded as Accepted
decisions before the gate named for each. B07 and B06 are blocked on D-04; B08 is blocked on D-05 with
B05-Q2 and B05-Q3; B14's SCHEMA ID wording is blocked on D-05.

**D-04 · Write protocol.** **Answered (accepted decision 20, 2026-11-19): patch + base rev + optional base values, merged when nothing overlaps; `collisions` and `blocked` in the 409; in place for every record kind; config bases per section; a lane route with a lane-list base.** Owner B05. Waits on it: B07, B06. Gate: before B05 builds. Affects REQ-01 to
REQ-09, REQ-13. Sub-questions and options:
- *Change shape.* (a) Field patch plus a base rev, merged on the server onto the file as on disk (the
  batch route's model, extended to every route). (b) Field patch plus the expected prior value of each
  patched field, so the server refuses only when a patched field changed. (c) Full record plus base
  record, three-way merged on the server. Consequences: (a) is the smallest step and already proven by
  the batch route, but refuses every stale write even when changes do not overlap, so "Keep mine" stays
  a user step; (b) merges non-overlapping changes silently and reports exact colliding fields, at the cost
  of a larger request and value comparison rules for lists and body text; (c) keeps clients simple but
  sends whole records, needs the base content from the client (the server keeps no old versions apart
  from the per-machine journal) and moves merge rules for lists and prose onto the server.
- *Conflict body.* Keep `{ error, current }` and add colliding fields and a list of blocking records, or
  a new uniform body for all routes. Consumers: `src/api.ts` `ApiError`, `useEditableRecord`, the store's
  move rollback, Settings.
- *In-place editing approach and scope.* Candidate: yaml's Document API (`parseDocument`), setting only
  changed keys, with body sections spliced by heading. Alternatives: a line-level splice of frontmatter
  keys, or canonical serialisation with a 422 whenever a round trip would lose data (FINDINGS R-37's
  fallback). Scope question: in place for items and questions too (programme outcome 1), or artifacts
  only; consequences for the "one-line diff" convention, capture's change detection
  (`scripts/capture.ts:486`) and status written as a bare number.
- *Config writes and base tokens.* One rev for the whole file, or one per section; where the snapshot and
  config events carry them (a snapshot shape B07 carries).
- *Transition.* How long legacy whole-record and base-less config shapes stay accepted, and whether a
  config base becomes mandatory once B06 lands.
- *Lane change request.* A dedicated lane route, or a lane change inside the batch request; either must
  leave room for B11's merge extension.

**D-05 · ID reuse.** **Answered (accepted decision 19, 2026-11-19): reuse stays.** Owner B05; the user decides. Waits on it: B08 (deletion bound), B14 (SCHEMA text).
Gate: **planning-only, settled in a B05 planning conversation before B08 builds**, together with B05-Q2 and
B05-Q3 (accepted decision 8). Affects REQ-19, REQ-20 and the reuse test. Source gap: SCHEMA says IDs are
"never reused" and "no deletes" for items and artifacts, while the board deletes items and reissues the
top freed ID on purpose (A-1, README, `tests/historyJournal.test.ts:173`), and SCHEMA itself says a deleted
top `OQ-nn` is freed. Options:
- *Reuse stays (today's behaviour).* SCHEMA is corrected (B14). History must reset at a deletion (journal
  set aside for every delete path, git timeline cut at B08's bound), which needs a way to tell reuse from
  a restore (B05-Q3), and bare mentions need a rule. Smallest code change; IDs stay dense.
- *Never reuse.* Deleted IDs are reserved: a list of deleted IDs (or a high-water mark per prefix) that
  every allocator reads. Consequences: SCHEMA stays true; R-54 cannot arise through the board; a reserved
  list must be stored somewhere that survives merges between worktrees and lanes (compare D-02's status
  registry, which may share the mechanism); hand deletes are only known if the mechanism also reads git
  or the list is updated by hand; seeding it from git history is a data migration the user reviews; the
  reuse test is replaced; B08's bound may then be needed only for hand reuse.
- *Per kind.* For example items and artifacts never reused, questions reusable as SCHEMA documents today.
  Consequences: two rules to document and test.

Phase questions:

- **B05-Q1 · Where the R-54 history fix lives.** Answered (accepted decisions 4 and 10, 2026-11-18): B08
  builds the deletion bound in its reader before B05; B05 applies it (journal step and `buildTimeline`
  cut) and closes R-54.
- **B05-Q2 · Files that disappear outside the board.** **Answered (decision 19): the journal is cut only at a committed deletion** (B08's bound), never on a file merely missing. Owner B05 (with the user). Gate: with D-05,
  before B08 builds. Setting the journal aside whenever the watcher sees a card vanish would also discard
  the journal when a branch switch or `git stash` removes and then restores files. Options: set aside only
  after a delay or a commit that deletes the file; keep the journal and cut at the deletion when reading;
  leave hand deletes to the D-05 rule. Affects REQ-20 and what B08's bound must mark.
- **B05-Q3 · Restore versus reuse in git history.** **Answered (decision 19): a restore continues** its history when the re-added record is the same record (same type, reads as the deleted version); otherwise it starts fresh. Owner B05 (with the user). Gate: with D-05,
  before B08 builds. Cutting git versions at a deletion would hide the true past of a record deleted and
  then restored (a revert). Options: cut only when the re-added record differs in type or creation; cut
  always; moot under "never reuse". Affects REQ-20 and B08's bound.
- **B05-Q4 · Unlisted shared files.** Answered (accepted decision 10, 2026-11-18): the rows are in PLAN's
  shared-files table, and `src/api.ts` transport is B05's (accepted decision 5).
- **B05-Q5 · Lane list writes have no conflict check.** **Answered (decision 20): yes, lane-list writes carry a base (`layout.lanesRev`).** Owner B05; the user decides. Gate: before
  B05 builds. Adding, removing or reordering lanes replaces the whole list, so two tabs can each undo the
  other's change. No finding covers it. Options: give lane-list writes a base like config sections
  (REQ-06), or leave as is. Affects REQ-13's request and B11's merge extension.
- **B05-Q6 · `artifact:new` stages files.** **Answered (decision 20): it never stages (a plain, non-overwriting move).** Owner B05; then B14 if unresolved (PROGRESS "Discovered
  for later"). Gate: before B05 builds. It moves a tracked file with `git mv`, which stages the move,
  against convention 9 (agents run `artifact:new` inside phases). Options: move without staging (git sees
  a delete and an add until commit), or keep `git mv` and document it. Affects REQ-18.

## Risks and recovery requirements

- **In-place editing changes bytes it should not.** A YAML document editor can still re-quote, re-indent
  or reflow a key it touches, or mishandle a file with CRLF line endings or a BOM (B03). Required: the
  live round-trip test over every real record file (scratch copy) shows only changed lines differ, for
  items, questions and sidecars in scope; any lossy case is refused with 422, never written.
- **Old clients against the new server.** Between B05 and B07/B06 the client, unchanged apart from the
  lane path, must behave at least as well as today (REQ-08). Required: the existing client test suites
  and touched Playwright specs pass against B05's server before B05 closes.
- **B08's bound does not fit the D-05 answer.** Avoided by settling D-05, B05-Q2 and B05-Q3 before B08
  builds. If it still does not fit, B05 records the gap and raises it before building REQ-20.
- **Live lanes.** Lane worktrees merge master and run this board and `artifact:new`. Required: no change to
  file formats agents write, `artifact:new` CLI compatible, and no catalogue data change without the user's
  review.
- **D-05 migration.** If IDs become reserved, any seeded list is a catalogue data change: shown to the user
  before it runs, `npm run check` green after.
- **Partial writes.** Filesystems give no multi-file transaction. Required: preconditions checked before any
  write; put-back on failure; a crash leaves a state `check` reports (REQ-12).
- **Journal loss.** Any automatic journal set-aside must not fire on transient disappearance (B05-Q2); the
  set-aside folder keeps what it moved, so a wrong set-aside can be recovered by hand.
- **Recovery.** All changes are board code and docs; reverting B05's commits restores the old behaviour
  without touching catalogue files (except a D-05 seeded list, which is removable).

## Execution and handoff obligations

1. Read PROGRESS.md (conventions 1 to 14, accepted decisions), PLAN.md, this SPEC and the owned and
   consumer findings in full. Confirm B02, B03, B04 and B08 are recorded done (B01 for file order), and
   re-verify the evidence table at the new HEAD.
2. Before B08 builds, in a B05 planning conversation: settle D-05 with B05-Q2 and B05-Q3 with the user and
   record them in PROGRESS.md "Accepted decisions". Before B05 builds: resolve D-04, B05-Q5 and B05-Q6 and
   record them likewise.
3. Write `docs/board-fixes/phases/B05-server-write-model/IMPLEMENTATION.md` before building: chosen
   protocol, file plan within B05's territory and its touch-rights edits, test plan per proof obligation,
   transition plan, and recovery.
4. Build in bites; keep the current client working after each bite. Write each proof so it fails on the
   code before the fix and passes after (convention 13).
5. Finish green: `npm run verify:board` from the repo root; touched Playwright specs on a free port (never
   5173, 5174, 5180, 5181).
6. Bump the board version (`requirements-board/package.json` and its lock file; minor, since API and agent
   behaviour change) and add a `CHANGELOG.md` entry describing the protocol, the artifact save fix, lane
   writes, create fallback, `artifact:new` and the ID rule. Update the doc lines listed under Dependencies
   (convention 12).
7. Run the three review lenses (quality and maintainability, completeness against this SPEC, bugs and
   correctness) with independent reviewers; verify and fix confirmed findings; rerun checks.
8. Record the phase entry in PROGRESS.md **last**: what was delivered, the protocol contract B07 and B06
   consume (Dependencies, "Outputs owned" 1 to 9), the D-04, D-05, B05-Q2, B05-Q3, B05-Q5 and B05-Q6
   answers, the touch-rights edits in other phases' files, intentionally changed tests, the doc lines
   changed under **Doc facts** (plus the ID rule for B14's SCHEMA wording), and one disposition per owned
   finding (R-26, R-37, R-54, R-55, R-56, R-64, R-67): **Fixed** (with its test), **Not reproducible at
   HEAD** (evidence), **Won't fix** (user accepted, reason) or **Moved** (named owner, recorded in both
   SPECs). Note that the R-45 and R-111 server halves are delivered, for B06 to close.
9. Commit only B05's files, staged by path at commit time; never push.
