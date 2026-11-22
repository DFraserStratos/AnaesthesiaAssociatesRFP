# Phase B02: Status identity

**Status:** PLANNED
**Requirements:** R-01 (board and server half), R-06, R-07 (board half), R-30, R-44, R-46, R-68
([FINDINGS.md](../../FINDINGS.md), "Findings in detail": `#### R-01`, `#### R-06`, `#### R-07`,
`#### R-30`, `#### R-44`, `#### R-46`, `#### R-68`); systemic issue 2 ("Status codes have no stable
identity or history"); refuted finding A-2 (FINDINGS appendix), which B02 adjudicates and fixes if
confirmed (PROGRESS accepted decision 3). Related, not owned: R-149 (B14), R-45 (B06), R-121 (B03),
A-10 (B12).
**Owns:** the status model in `shared/statuses.ts` (list parsing, damage classification, the
code-allocation rule, recode application) and status-list parsing in `shared/config.ts`;
`scripts/recode-statuses.ts`; the status registry format in `board.config.json` and its migration;
CSV status output (`shared/csv.ts`, `scripts/export-csv.ts`); the store's saved status-filter pruning
(`src/store.ts`); the server's status in-use guard and status-write refusal while a list is damaged in
`PUT /api/config` (`server/catalogueApi.ts`); the per-list damage state the client receives (the
input to B06's lock-out); the minimal Settings call-site edit for the allocation rule
(`src/views/SettingsView.tsx`); keeping `tests/starter.test.ts` green if the config format changes;
the SCHEMA lines that state the status rules B02 changes (convention 12); the A-2 adjudication;
deferred decision D-02.
**Excludes:** the lock-out UI and the rest of the Settings editing UI and conflict banner (B06, which
closes R-01; R-45 is B06's); the save transport and write protocol (B05, D-04); R-149's project
status numbers pinned in the kit's SCHEMA, the starter config and starter docs, and the whole-file
docs pass (B14); R-07's plan-tool half (`scope.mjs` and its callers) and A-10 (B12, which closes
R-07); listing cards with unknown statuses in Questions and Outline (B03, R-121); the git reader
(B08); a per-field damage signal for `components` and `project` (B06 may add it, accepted decision 10).
**Depends on:** B01 (serial order; `catalogueApi.ts` as B01 leaves it). D-02 resolved with the user
before B02 builds. The migration dry run shown to the user before it runs on the real catalogue.
**Unblocks:** B03 (next in the serial order); B12 (applies B02's status rule in the plan tools;
"B12 (after B02)"); B05 (keeps the status guard under its write protocol); B06 (renders the lock-out
from B02's damage state and uses the allocation rule); B08 (serial after B02; inherits any edit B02
makes to `catalogueDiff.ts`); B14 (whole-file pass, R-149, starter).
**Binding constraints:** PLAN.md "Binding constraints (every phase)" and PROGRESS.md conventions 1 to
14, in particular: existing stack only (3); board code stays project-generic (4); version bump and
CHANGELOG (5); `npm run verify:board` green, and the agent tools' `node --test` suites if B02 touches
`agent/` (6); fixes do not change requirement content, and any catalogue data migration is shown to
the user before it runs and leaves `npm run check` green (7); agent-tool changes stay backward
compatible with the live catch-up plan in lane worktrees (8); never stage mid-phase (9); touch rights
with minimal edits named in the entry (11); doc lines updated and listed under "Doc facts" (12);
every proof fails before the fix and passes after (13). Never take ports 5173, 5174, 5180 or 5181.

## Objective and outcomes

A status code stored in a file is a bare number whose meaning lives only in `board.config.json`. Today
that number has no stable identity: one bad entry swaps the whole list for built-in defaults that
number things differently, a renumber can silently merge two statuses or be re-applied to files saved
after it, a freed number is handed out again with a new meaning, and the CSV shows numbers no reader
can interpret. When B02 is delivered:

1. **A number means what the project's own list says, or nothing.** The board, the check, the server
   and the CSV never read a stored code through a list other than the project's own. A damaged list is
   an error state with a named cause, never a silent swap to defaults.
2. **A damaged list cannot be saved over.** While the project's status list is damaged, the server
   refuses status saves, and the client receives the damage state that B06 renders as the lock-out.
3. **A code is never reissued.** Once a code has been used (in a list, a recode or a record), no new
   status receives it, so old versions never read as a later status.
4. **Recodes are total and never change a later version's meaning.** A recode refuses a map that would
   silently merge statuses, and no version saved after a recode is re-mapped by it, in the board's
   diff and history; B12 applies the same rule in the plan tools.
5. **A recode is crash-safe and safe beside a running board.** A malformed journal line never aborts a
   recode part way, no failure leaves rewritten files without the recode recorded, and A-2 is
   adjudicated and, if confirmed, fixed.
6. **People-facing outputs show labels.** The CSV's Status column shows the project's label.
7. **A transient config problem costs the user nothing.** A saved status filter survives a config that
   is broken for a moment, and is pruned only for a genuine removal.

## Sources and current-state evidence

All evidence verified at HEAD d4341735 (board 1.12.3). Paths relative to `requirements-board/`.

| Finding | Still reproduces? | Current locations | Verification |
|---|---|---|---|
| R-01 | Yes | `shared/statuses.ts:96-116` (`readStatusList`), `:118-126` (`parseStatusList`); `shared/config.ts:136-189` (`parseConfig`; invalid JSON returns `DEFAULT_CONFIG` at :142); `src/views/SettingsView.tsx:371` (`StatusSection`); `server/catalogueApi.ts:505-565` (`PUT /api/config`; in-use guard :523-529, `was` test :528) | Scratch run against the real config with `statuses[3].tone = "teal"`: list becomes defaults 1 to 5, `isRetired(config, {status: '5'})` is true (Confirmed hidden), problems "tone must be one of..." and "using the defaults". The `was` test consults `state.config`, so code 6 (absent from the defaults) is not counted as in use. The guard's lines moved slightly from FINDINGS (524-531 to 523-529). |
| R-06 | Yes | `scripts/recode-statuses.ts:58-72` (`planFolder`; target exemption :69) | Scratch catalogue of stories 1 to 6, map `1=1,2=2,3=4,5=6,6=7`: plan changes 3>4, 5>6, 6>7, `unknown` empty. Old 3 and old 4 both end as 4 with no refusal. |
| R-07 (board half) | Yes (mechanism); no wrong reading in this repo's data today | `shared/statuses.ts:194-202` (`normaliseStatus`); board consumers `server/catalogueDiff.ts:567`, `:653`; `server/catalogueApi.ts:335-338` (history route). The plan tools' copy (`agent/skills/update-build-plan/tools/scope.mjs:41-48` and callers) is B12's half. | `normaliseStatus([{items:{4:'5',5:'6'}}], 'item', '5')` returns `6`. The repo's only recode (`requirements/status-recodes.json`, 2026-10-20) maps names to codes, so no overlap exists in this catalogue's history yet; the defect bites the first numeric renumber. |
| R-30 | Yes | `shared/csv.ts:44-66` (item Status at :57), `:68-86` (question Status at :80); `scripts/export-csv.ts:15-24` | Both writers emit `it.status` / `q.status` (the bare code); neither takes a config. `loadCatalogue()` already returns `config` to the script. |
| R-44 | Yes (by inspection) | `scripts/recode-statuses.ts:90-101` (`rewriteJournal`, unguarded `JSON.parse` at :95 and :97), file writes :142, journal pass :144-146, recodes write :148-152 | Files are rewritten at :142 before the journal pass; a throw at :95 skips :148-152. `historyJournal.read` tolerates bad lines (`server/historyJournal.ts:157-158`), so such lines are legitimate. Not reproduced live: the journal pass runs only when `REQUIREMENTS_DIR` is unset (:145), i.e. against the real `.history/`. Today's `.history/` has 4473 lines, none unparseable. |
| R-46 | Yes | `src/store.ts:115`, `:150`, `:164` (callers), `:678-683` (`dropUnknownStatuses`), `:662-673` (`useView.set` persists to localStorage) | Pruning runs against whatever config arrived, including the defaults substituted for a damaged list or an unparseable file, and persists immediately. |
| R-68 | Yes | `shared/statuses.ts:67-68` (`nextStatusCode`); `src/views/SettingsView.tsx:414-415` (`add`) | `nextStatusCode([{code:'1'},{code:'6'}])` returns `7` after a removed 7. Settings guards only within one page visit (comment at :414). |
| A-2 | Unproven (held by FINDINGS as 1/2) | `scripts/recode-statuses.ts:142` (files written), `:144-146` (journal walk afterwards); `server/cataloguePlugin.ts:30-35`, `:71` (a running board journals disk changes into `.history/`) | Mechanism holds by reading: the recode writes the files first, so a watching board can journal `from: 3, to: 4` entries that the later journal pass rewrites. With a non-overlapping map these become `4 to 4`; with an overlapping map (`3=4,4=5`) they become `4 to 5`. Not reproduced: the journal pass is skipped whenever `REQUIREMENTS_DIR` is set, which a safe scratch run needs. |

Further verified facts that shape the requirements:

- `.history/` (the board's change journal) is git-ignored and local. A recode rewrites it in place
  (item map only; there are no question journals), so journal values are already in post-recode codes.
  Git versions are never rewritten. Any version-scoped recode rule must treat these two differently.
- The existing recode entry, the 356 rewritten story files, the config change and
  `recode-statuses.ts` all landed in one commit (d4db2772, 2026-10-20). The config's status lists have
  never lost a code since (every commit of `board.config.json` from d4db2772 to HEAD holds items 1 to 6,
  questions 1 to 4). Catalogue today: codes 1 to 6 in use, none unknown.
- `status-recodes.json` is read by the live plan tools as a JSON array of `{ items, questions }`
  entries (`scope.mjs:31-38`; anything else reads as no recodes). The plan tools read
  `board.config.json` status lists through `config.mjs:123-126` (`statusListsOf`), which takes any
  array as the live list and falls back to its own defaults when the file is unreadable. Every entry in
  a `statuses` array is shown to agents as a live status (`config.mjs:133-144`).
- While the list falls back, `shared/check.ts:99` and `:382` report every card holding a code the
  defaults lack (all 52 retired cards here) as an error, burying the one real cause.
- `PUT /api/config` already refuses (422) when the config file is not valid JSON (`catalogueApi.ts:511`),
  and already patches the file on disk field by field. A missing config file is not a problem: the
  built-in lists apply (`server/catalogueFs.ts:109-116`). An absent `statuses` key also means the
  built-in list by design (`shared/statuses.ts:121`); that is not damage.
- SCHEMA states rules B02 changes at `requirements/SCHEMA.md:403-418` (the statuses paragraph: Settings
  edits, "a new status takes the next free number", the recode command and what it records). ADOPTING.md
  `:50-59` gives recode guidance including numeric renumbering.
- Existing tests: `tests/config.test.ts:47-77` and `:164-179` assert today's fall-back-to-defaults
  behaviour and will need to change; `tests/recodeStatuses.test.ts`, `tests/api.test.ts:460-505`
  (status PUTs), `tests/catalogueDiff.test.ts:377,418` (recodes in diffs), `tests/starter.test.ts`,
  `e2e/settings.spec.ts` (Settings statuses, port 5182).

Assumption (not verified): no adopting repo of the kit has yet run a numeric renumber. Migration must
still detect an overlapping recode history rather than assume one away.

## Detailed requirements

### B02-REQ-01 · The project's list is never replaced by the defaults (R-01)

- A status list is classified, per list (items, questions), as **healthy**, **degraded** (only
  per-field problems: tone, label, help, heading) or **damaged** (structural problems: not a list, an
  entry without a valid code, a duplicated code, or a breach of the role and settle rules; also the
  whole config file unparseable). The exact boundary for role and settle breaches is B02-Q4.
- In every state the board, the server and the check read stored codes only through the project's own
  list as far as it can be read (or a last-known-good copy of the project's own list, per B02-Q3). The
  built-in default lists are used only when the project defines no list (absent key or absent file).
- A degraded list keeps every entry's code, label and role; a bad field falls back for that field
  alone, and the problem is reported.
- Under a damaged list: no card is hidden or struck through on the strength of a role the board
  cannot resolve unambiguously from the project's own list; a card whose code the readable list does
  not define shows its stored code (as unknown codes already do); no write stores a status chosen from
  a list other than the project's own (see B02-Q3 for card creation and status changes).
- The check reports the list problem once, naming the field and entry. Card-level "status is not one
  of" errors are judged against the project's readable codes, never the defaults, so a damaged list does
  not flood the issues list with every card.

### B02-REQ-02 · A damaged list cannot be saved over; in-use is judged against disk (R-01)

- While the on-disk list for a field is damaged, the server refuses a status save for that field with
  a message naming the problem and the file to fix, and the config file stays byte for byte unchanged.
  Whether a degraded list also locks, or may be repaired through Settings, is B02-Q4; either way no save
  replaces the project's list with the defaults or changes what an existing code means.
- The in-use guard counts a code as in use when records on disk hold it and the project's list as it
  is on disk now defines it, independent of the server's in-memory config. Dropping such a code is
  refused. A record holding a code the on-disk list never defined does not block unrelated saves
  (preserved behaviour).
- The client receives, in the snapshot and in the config event, each list's state (healthy, degraded,
  damaged) and the reasons. This is the contract B06 renders as the lock-out (banner naming the
  problem, editing and Save disabled for that list, nothing shown as the project's list that is not);
  B06 builds the UI and closes R-01.

### B02-REQ-03 · Codes are never reissued (R-68)

- A new status (from Settings or by any server path) receives a code greater than every code ever used
  for that list: the registry's recorded high-water mark, every code in the current list, every code
  appearing as a key or value of any recorded recode, and every code found in the records on disk.
- The server refuses a status save that introduces an entry whose code was used before and is not live
  in the current list (a reused code), and the check reports a reused code found on disk as an error.
- Removing a status records that its code is spent (where and how is D-02a). Old versions storing a
  removed code never read as a different status; whether they show the removed status's last label is
  D-02a.
- The allocation rule is one shared helper used by the server and by Settings. B02 makes the minimal
  call-site edit in `SettingsView.tsx` (`add`, currently :415) so a new row takes the helper's code
  (accepted decision 7); the rest of Settings stays B06's.

### B02-REQ-04 · Recodes are total (R-06)

- A recode refuses, and writes nothing, when any status value found in the files would end on the same
  code as a different value without both values being named in the map. Deliberate merges stay possible
  when every merged value is named explicitly; a dry run lists each merge as a merge.
- The exemption for values "already at a target" applies only where the value cannot be a live code
  with a different meaning (for example a rerun of a names-to-codes recode); a value that is a code in
  the current list and is not named in the map is unmapped, and the run refuses naming it and its
  files.
- A recode's targets respect B02-REQ-03: a target is either a new code past the high-water mark or a
  live code the map merges into explicitly; never a spent code. A recode advances the high-water mark.

### B02-REQ-05 · A recode never changes how a later version reads, in the board (R-07 board half)

- In the shared rule and in the board's consumers that read a stored status across time (the diff
  review in `catalogueDiff.ts` and the card history route in `catalogueApi.ts`), a version saved after a
  recode reads with its stored code unchanged by that recode, and a version saved before it reads as
  the code the recode gave it. A real status move made after a recode is reported as a move.
- Journal values already rewritten by a recode are never re-mapped by that recode.
- How this is achieved is D-02b: either each recode records the versions it applies to and consumers
  apply it only to older versions, or recodes are refused whenever a target is a source in this map or
  any earlier recode (with B02-REQ-03 this makes the existing chain-following rule correct for every
  version).
- The existing 2026-10-20 names-to-codes entry keeps reading exactly as today.
- The plan tools' half is B12's (accepted decision 4). B02 states the accepted rule in PROGRESS.md as
  B12's input (see "To B12").

### B02-REQ-06 · A recode is crash-safe and restartable (R-44)

- A journal line that does not parse is kept byte for byte, counted and reported; it never aborts the
  run.
- No failure after the first catalogue file is rewritten leaves rewritten files with the recode
  unrecorded. Either the recode is recorded no later than the file rewrites complete, or a rerun of
  the same command detects and completes the interrupted recode without applying it twice.
- A file in the journal or catalogue that cannot be rewritten is named in the output with the step
  that failed; the run's exit status says whether it completed.
- The journal (untracked, so not recoverable from git) is never left with a file half written.
- The journal pass can be exercised against a scratch catalogue and a scratch history folder (today it
  is skipped whenever `REQUIREMENTS_DIR` is set), so R-44 and A-2 can be proven without touching the
  real `.history/`.

### B02-REQ-07 · A recode beside a running board leaves a true journal (A-2)

- B02 adjudicates A-2 against its final recode ordering: whether a recode run while a journal-writing
  board watches the catalogue leaves status changes whose `from` equals `to`, re-maps entries the board
  journalled during the run (for example `4 to 5` under an overlapping map), loses journal lines
  appended concurrently, or leaves the recode unrecorded; and whether any reader surfaces the result
  (the card timeline, given `collapse`; the diff; CSV; the registry). The reproduction uses a scratch
  catalogue and scratch history folder and actually exercises the journal pass.
- If confirmed, the fix makes the outcome observable as: after a recode run with the board watching,
  every journal entry records a status change that really happened, with codes in the post-recode
  numbering, and none is lost. Refusing to run while a board is watching the same catalogue, with a
  message saying so, is an acceptable outcome. Candidates: detect a running board; write the journal
  in a way the watcher cannot interleave; mark the board's own journal entries made during the run.
- If refuted, the evidence is recorded with the disposition.

### B02-REQ-08 · The CSV shows status labels (R-30)

- The requirements CSV and the questions CSV show the project's label for each status, from the
  project's own list. A code the list does not define is written as stored.
- Column names, order, quoting and row order are unchanged. Whether to append a code column at the end
  is B02-Q6 (default: no).
- `export:csv` keeps refusing while the check has errors (a damaged list is an error), and under
  `--allow-errors` still never labels through the defaults.

### B02-REQ-09 · A transient config problem never prunes the saved filter (R-46)

- While either status list is damaged, or the config file is unreadable, the saved status filter is
  neither pruned nor rewritten in storage. Cards are filtered against the saved codes as stored.
- When the list is healthy (or degraded with all codes readable) and a saved code is genuinely absent
  (removed, spent), the filter drops it and the change persists (preserved behaviour: a filter naming
  a removed status must not hide every card).
- The same rule holds on initial load, on a config change event and after a Settings save.

### B02-REQ-10 · Status registry, migration and doc lines (D-02, convention 12)

- The registry holds, per list, what B02-REQ-03 and B02-REQ-05 need: the high-water mark, the spent
  codes (with or without their last labels) and, if D-02b chooses version scoping, each recode's
  version marker. Its location and shape are D-02.
- A `board.config.json` and `status-recodes.json` without registry fields stay valid: the board derives
  the registry from the current list, the recodes and the records, reports nothing as damaged on that
  account, and keeps working for the starter kit (`tests/starter.test.ts` stays green) and for adopting
  repos on older kits.
- Migration of this repo's catalogue (writing any registry fields, re-shaping any file) is proposed as
  a dry run showing the exact before and after of each file, is shown to the user, and runs only on
  their go-ahead. After it, `npm run check` is green and no record file changes.
- `status-recodes.json` stays readable by the live plan tools in lane worktrees: a JSON array whose
  entries keep `items` and `questions` maps (new fields may be added). Spent codes must not appear to
  the plan tools as live statuses (`config.mjs` treats every entry of a `statuses` array as live).
  Anything else needs a migration the plan's owner accepts (convention 8).
- B02 updates the doc lines that state the rules it changes: `requirements/SCHEMA.md:403-418` (next
  code allocation, the recode's rules and what it records, the registry, the damaged-list behaviour) and
  ADOPTING.md `:50-59` (recode guidance), plus its own code comments (`shared/statuses.ts` header,
  `recode-statuses.ts` header). R-149's project-number pins elsewhere in SCHEMA, the starter config and
  starter docs stay B14's.

### Preserved behaviour (must not regress)

- Renaming, recolouring, rewording or reordering a status touches no record file; Settings and the
  server patch only the fields sent and keep every other config setting as written.
- A status in use, or holding a required role, cannot be removed.
- An absent `statuses` or `questionStatuses` key, or an absent config file, means the built-in lists.
- A config file that is not valid JSON makes status saves fail with 422, as now.
- `normaliseStatus` passes unknown values through; names-to-codes recodes read as no change in the diff
  and history.
- `statuses:recode` rewrites only the frontmatter `status:` line, supports `--dry-run` (writes nothing),
  `--note`, and refuses on unmapped values; its journal rewrite still changes only status fields.
- The CSV's shape for existing Miro imports; the About page's live status list; the Settings table
  layout in DESIGN.md ("No." gutter, next free number fixed once saved).

## Dependencies and handoffs

- **Inputs:** `catalogueApi.ts` as left by B01 (serial order). D-02 resolved with the user and recorded
  in PROGRESS.md before build.
- **Outputs owned:** the damage classification and its client-visible state; the allocation helper and
  its Settings call site; the recode rules; the registry format and derivation; the in-use guard and
  status-save refusal in `PUT /api/config`; the A-2 verdict.
- **To B12:** the exact rule the plan tools must apply for R-07's plan-tool half, recorded in PROGRESS.md
  when D-02 is accepted. Under the no-overlap answer: follow every recorded recode in order from the
  stored value (today's chain rule, unchanged), which is correct for every version because B02 refuses
  any recode whose target is a source in that map or an earlier one; B12's proof is that an attempted
  overlap is refused upstream and that the plan tools still read the 2026-10-20 entry as today. Under
  the version-scoped answer: apply a recode to a stored value only when the version being read is
  older than that recode by B02's recorded marker (and never to values from the rewritten journal),
  following the remaining recodes in order; B12 proves a version saved after an overlapping renumber
  reads as stored in each plan tool. Either way `status-recodes.json` stays an array of entries with
  `items` and `questions`, and spent codes never appear as live statuses. B12 closes R-07 with B02's
  proof of the board half. A-10 is B12's.
- **To B06:** the per-list damage state and reasons (B02-REQ-02) and the allocation helper
  (B02-REQ-03). B06 renders the lock-out, proves the rendering and closes R-01; its conflict handling
  (R-45) keeps the registry intact when it saves whole lists. B06 may add a per-field signal for
  `components` and `project` itself (accepted decision 10).
- **To B05:** the status guard and refusal live inside the config write route B05 later reworks; B05
  preserves their behaviour and B02's tests under its write protocol (D-04).
- **To B08:** if D-02b chooses version scoping, B02 edits the normalisation sites in
  `server/catalogueDiff.ts` (`:567`, `:653`) per the shared-files table; B08 builds later in the serial
  order on that shape.
- **To B14:** the registry format and the doc lines B02 changed, listed under "Doc facts" in B02's
  PROGRESS entry; B14 owns R-149, the starter config and docs, and the whole-file pass.
- **To B03:** while a list is damaged more cards may hold codes the readable list lacks; B03's R-121
  listing of unknown-status cards covers them.
- **Integration proof owner:** B02 for R-06, R-30, R-44, R-46, R-68, A-2 and the board halves of R-01
  and R-07; B06 closes R-01; B12 closes R-07; B15 for the programme.

## Acceptance and evidence

Every proof below must fail on the code before the fix and pass after it (convention 13). Each is a
regression test unless marked manual.

- **R-01 (a) per-field fallback:** a list with one invalid tone keeps every project code, label and role;
  the bad tone falls back for that entry; the problem is reported.
- **R-01 (b) no defaults:** for each damaged case (bad code, duplicate code, not a list, whole file
  unparseable, plus the role cases B02-Q4 classifies as damaged), the effective reading never equals the
  defaults: on this repo's six-status list, code 5 is never treated as retired and code 6 never reads
  through a default entry.
- **R-01 (c) saves:** against `createCatalogueApi` on a scratch catalogue, for the FINDINGS scenario (a
  bad tone, then a reworded list saved), either the save is refused or it writes the project's own list
  with codes 5 and 6 keeping their meanings (per B02-Q4); for every damaged case the save is refused and
  the config file is byte for byte unchanged.
- **R-01 (d) in-use guard:** a PUT dropping a code that records hold and the on-disk list defines is
  refused even when the server's in-memory config lacks that code; a record holding a never-defined
  code does not block an unrelated status save.
- **R-01 (e) damage state:** the snapshot and config event carry each list's state and reasons, for
  healthy, degraded and damaged lists (B06 proves the rendering).
- **R-01 (f) check:** under a damaged list the check reports the list problem once and no card-level
  status errors judged against defaults.
- **R-06:** the FINDINGS map (`1=1,2=2,3=4,5=6,6=7`, `4=5` forgotten) is refused naming value 4 and its
  files, writing nothing; an explicit merge is accepted and reported as a merge; a names-to-codes rerun
  over partly recoded files still succeeds.
- **R-07 (board half):** per D-02b, either (version scoping) after an overlapping renumber such as
  `4=5,5=6`, a version saved after it reads as stored in the shared rule, the diff and the history
  route, and a later real move is reported; or (no overlap) the recode refuses any target that is a
  source in the map or an earlier recode, and a test shows chain-following is then idempotent on
  post-recode values in the shared rule, the diff and the history route. In both cases the existing
  2026-10-20 entry reads as today.
- **R-44:** a scratch journal with a truncated line and a well-formed line: the run completes, the
  truncated line is preserved byte for byte, the well-formed one is recoded, and the recode is
  recorded. A run forced to fail after the file rewrites leaves the recode recorded, or a rerun completes
  it without a second application. The test exercises the journal pass.
- **A-2:** the reproduction of B02-REQ-07 runs (scratch catalogue and history folder, journal pass
  exercised, a watching board or the same journal writer) and its verdict is recorded with evidence.
  If confirmed, a test that fails before the fix shows that after a recode with the board watching no
  journal entry has `from` equal to `to`, none is re-mapped, none is lost and the recode is recorded (or
  the recode refuses while the board watches, with its message).
- **R-30:** both CSVs show labels (for example "Confirmed", "Answered") from a project list whose
  numbering differs from the defaults; an unknown code is written as stored; columns are unchanged.
- **R-46:** with a saved filter naming a code, a damaged or unparseable config leaves the filter intact
  in memory and in storage; a healthy config that genuinely lacks the code prunes it.
- **R-68:** after removing the highest status, a new status receives a code past it, from the server
  and from the Settings Add row; codes used only in recodes or only in records are also skipped; the
  server refuses a list that reuses a spent code and the check reports one found on disk.
- **Registry and migration:** a config and recodes file with no registry fields load with no new
  problems and derive the correct high-water marks (items 6, questions 4 for this repo); the starter
  test passes; the migration dry run was shown to the user (recorded in PROGRESS.md), and after it
  `npm run check` is green and no record file changed; the current plan tools still read
  `status-recodes.json` and `board.config.json` (manual check from a scratch copy, or the tools'
  `node --test` suites if B02 touched `agent/`).
- **Doc lines (manual):** the SCHEMA and ADOPTING lines listed in B02-REQ-10 state the delivered rules
  and appear under "Doc facts" in the entry.
- **Preserved behaviour:** existing Settings e2e specs pass on a free port; rename touches no record file;
  `npm run verify:board` green.

Criteria awaiting a decision: the damaged/degraded boundary and degraded repair (B02-Q4, affects R-01
(b) and (c)), the damaged-state reading (B02-Q3), whether spent codes show labels (D-02a), and which
R-07 proof applies (D-02b).

## Deferred decisions for execution planning

Shared register: [PROGRESS.md](../../PROGRESS.md) "Deferred decisions".

**Answered 2026-11-19 (PROGRESS accepted decision 16):** D-02a removed statuses under
`removedStatuses` in `board.config.json`, with their last labels; D-02b no overlap allowed (the
chain rule stands, `catalogueDiff.ts` untouched); D-02c no migration; B02-Q3 the readable part of
the project's own list, creation refused while the default role is unresolved; B02-Q4 role and settle
breaches are damage, a cosmetic-only list may be saved through Settings; B02-Q5 yes, the recode
updates the config; B02-Q6 no code column. Delivery: see IMPLEMENTATION.md and the B02 entry in
PROGRESS.md.

### D-02 · Status registry (owner B02; waits: B06, B12, B14; resolve before B02 build)

Source: systemic issue 2; R-07 and R-68 proposed fixes. Affects B02-REQ-03, -04, -05, -10 and B12's
R-07 half.

- **D-02a · Where the high-water mark and spent codes live.**
  - *In `board.config.json`, beside each list* (the systemic issue's candidate): travels with the list
    and is visible in review. Consequences: Settings whole-list saves (B05/B06) must preserve it; if
    spent codes are entries inside the `statuses` array, the live plan tools and any older kit will
    read them as live statuses, so they need a separate key or a flag the tools already ignore (they do
    not ignore any today); hand edits can break it, so it needs validation.
  - *In `status-recodes.json` (or a renamed status history file):* keeps the config simple and puts all
    status history in one place agents rarely edit. Consequences: must stay an array readable by the plan
    tools (B02-REQ-10); Settings removals must write to it.
  - *Derived, nothing stored:* high-water mark computed from the current list, recodes, records and the
    git history of the config. Consequences: no migration, but depends on git and history depth, costs
    time on every allocation, and cannot know codes removed before the history began.
  - Sub-question: whether a spent code keeps its last label, so old versions show "On hold (removed)"
    rather than "7".
- **D-02b · How a recode records the versions it applies to.**
  - *Commit marker:* the recode commit is not known when the script runs, so it needs a later step or an
    inference ("versions whose commit's recodes file lacks this entry are older"). That inference works
    only if files and the recodes file are committed together (true for d4db2772), and each consumer
    must know each version's commit: B02 edits `catalogueDiff.ts` and the history route, and B12
    changes every plan tool.
  - *Timestamp:* simple, but commit dates can be out of order (merges from lane worktrees, rebases,
    clock skew), the existing entry holds only a date, and the rewritten journal must be exempt.
  - *No overlap allowed:* refuse any target that is a source in this map or an earlier recode, and
    allocate targets past the high-water mark. Chain-following then reads every version correctly with
    no per-version marker; B02 does not touch `catalogueDiff.ts`, the plan tools need no rule change,
    and D-03 is not needed for B12 (accepted decision 8). Consequence: a project cannot swap numbers in
    place (`4=5,5=4`); it renumbers to fresh codes, which SCHEMA already says carry no meaning.
    Existing overlapping histories in adopting repos must be detected and reported.
- **D-02c · Migration of this repo's config, recodes file and journal.** The current data needs the
  least: one names-to-codes recode (no overlap), no code ever removed, journal already in codes.
  Options: write registry fields now (shown to the user, B02-REQ-10), or rely on derivation until the
  first removal or recode writes them. Either way the starter kit and adopting repos must work without a
  migration step.

### Phase questions

| ID | Question | Affects | Owner | Dependants | Resolve before |
|---|---|---|---|---|---|
| B02-Q1 | Who builds the lock-out UI and the R-68 allocation call site in `SettingsView.tsx`? **Answered (accepted decisions 7 and 10, 2026-11-18):** the lock-out UI is B06's and B06 closes R-01; B02 delivers the board and server half and the damage state B06 renders. R-68's allocation rule and the minimal Settings call-site edit are B02's. | B02-REQ-02, -03 | | | |
| B02-Q2 | Who delivers R-07's plan-tool half? **Answered (accepted decision 4, 2026-11-18):** B12, which applies B02's rule and closes R-07; B02 delivers the board half and states the rule for B12. | B02-REQ-05 | | | |
| B02-Q3 | What a damaged list reads as: the readable part of the project's own list, or a last-known-good copy of it (from the last healthy load, or the committed file)? And are card creation and status changes refused while the default or settle role cannot be resolved? | B02-REQ-01 | B02 planning (user if needed) | B06, B03 | B02 build |
| B02-Q4 | Is a role or settle breach (missing required role, duplicate role, unknown role value, no settle) damage or a degraded list? And may a degraded (cosmetic-only) list be repaired through Settings, showing the fallback value, rather than locked until hand-fixed? | B02-REQ-01, -02 | B02 planning, with B06 | B06 | B02 build |
| B02-Q5 | Should `statuses:recode` also update the config's codes and registry in the same run, so files and config never disagree between the recode and a manual config edit? | B02-REQ-04, -06, -07 | B02 planning | none | B02 build |
| B02-Q6 | Should the CSV append a status code column at the end (existing columns keep their positions)? Default: no. | B02-REQ-08 | B02 planning | none | B02 build |

## Risks and recovery requirements

- **Real catalogue migration.** Any write to `board.config.json` or `status-recodes.json` is shown to
  the user as a dry run first, lands in its own reviewable change, changes no record file, and leaves
  `npm run check` green. Both files are git-tracked, so recovery is a revert.
- **Untracked journal.** `.history/` cannot be recovered from git. A recode's journal rewrite must
  never leave a file truncated or half written, must preserve lines it cannot read, and the A-2 and
  R-44 reproductions must never run against the real `.history/`.
- **Live lanes.** Lane worktrees run the plan tools from merges of master. A format change that the
  current `scope.mjs` or `config.mjs` misreads would silently stop normalising statuses or list spent
  codes as live, so the format stays backward compatible (B02-REQ-10) or ships with a migration the plan
  owner accepts.
- **Recode ordering.** The R-44 ordering change and the A-2 fix pull on the same steps (when the files,
  the recodes file and the journal are written). They are planned together so neither reopens the
  other, and an overlapping map is part of the A-2 reproduction.
- **Tests that pin old behaviour.** `tests/config.test.ts` asserts the fallback to defaults; changing
  those assertions is expected and must be called out in the review, not mistaken for a regression.
- **Lock-out friction.** Locking Settings on a cosmetic problem forces a hand edit; the message must
  name the file, field and entry so the fix is obvious (B02-Q4).

## Execution and handoff obligations

1. Read PROGRESS.md, PLAN.md, this SPEC and the owned findings (and A-2) in full. Reconfirm the evidence
   above at the current HEAD and note any drift.
2. Resolve D-02 and B02-Q3 to Q6 with the user as needed; record accepted answers in PROGRESS.md
   "Accepted decisions" before building, including the exact R-07 rule B12 must apply.
3. Write `docs/board-fixes/phases/B02-status-identity/IMPLEMENTATION.md` (approach, bites, checks,
   recovery) before any code. Inherit accepted shared decisions; choose no new dependency without a
   recorded reason.
4. Build in bites; write each regression proof so it fails on the code before the fix and passes after
   (convention 13). Show the migration dry run to the user before running it on the real catalogue.
5. Finish green: `npm run verify:board` from the repo root; touched Playwright specs (at least
   `e2e/settings.spec.ts`) pass on a free port; the agent tools' `node --test` suites if B02 touched
   `agent/`.
6. Bump the board version (minor: behaviour users and agents can see) in `requirements-board/package.json`
   and its lock file, and add a CHANGELOG.md entry describing the new status rules in plain words.
7. Run the three review lenses (quality and maintainability; completeness against this SPEC; bugs and
   correctness) as independent subagents; verify and fix confirmed findings; rerun verification.
8. Give every owned finding one disposition: **Fixed** (with its proof), **Not reproducible at HEAD**
   (with evidence), **Won't fix** (user accepted, with reason) or **Moved** (named owner, recorded in
   PROGRESS.md and both SPECs). For R-01 and R-07, record B02's half as delivered with its proof; B06
   and B12 record the closing disposition. A-2 gets a verdict (Confirmed and Fixed, or Refuted with
   evidence) for B15 to confirm.
9. Record in PROGRESS.md, last: the delivered behaviour, the registry format, the R-07 rule for B12,
   the damage-state contract for B06, the minimal edits made in other phases' files (convention 11),
   anything discovered for later, and the commit. List every doc line changed (SCHEMA, ADOPTING, code
   headers) under "Doc facts" in the entry (convention 12). Commit only this phase's files, staged by
   path at commit time; never push.
