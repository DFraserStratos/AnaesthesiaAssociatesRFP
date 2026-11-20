---
name: consistency-review
description: Whole-catalogue consistency review of the requirements - build a newest-wins "current rulings" list from every note, change log and answered question (the user settles its conflicts), then have cheap per-feature finders, per-epic verifiers, diagram and domain-model passes and per-topic consolidators propose exact edits and new questions, shown on a local HTML review page where the user accepts, rejects or asks for changes; only then are accepted edits applied. Use when requirements updates may have left drift (stale wording, retired terms, items contradicting newer decisions, out-of-date diagrams), or when the user asks for a consistency, drift or "super" review of the catalogue.
argument-hint: "[baseline commit, default HEAD] [optional: resume <run folder> at stage N]"
---

# Consistency review of the requirements catalogue

Finds the places where the catalogue no longer says what was most recently decided, and proposes
exact fixes that the user decides on one by one. Nothing reaches the catalogue until the user has
decided; open questions never drive an edit.

Outputs, all in one run folder (never in `/tmp`, which a reboot wipes):
- `rulings.md` and `rulings.html`: the yardstick (what is decided now, newest wins within a level);
- `changes.json` and `review.html`: the proposed changes (large, medium, small), each with its
  before/after diff, evidence and rulings, plus new questions; decisions are made on the page;
- after the user decides: accepted edits applied to `REQ`, new open questions, redrawn diagrams,
  and an uncommitted diff to hand back.

## This repo

The only repo-specific facts this skill uses. When the board moves to another repo, rewrite this
block (the board's `ADOPTING.md` says how) and leave the rest alone.

- `BOARD` = `requirements-board`; `REQ` = `requirements-board/requirements`. Paths are relative to the
  repo root. `K` = `requirements-board/agent/skills/consistency-review/scripts` (the scripts below).
- Workflows: `consistency-rulings` (stage 1) and `consistency-changes` (stage 2), in
  `requirements-board/agent/workflows/`, linked from `.claude/workflows/`.
- Checks: `npm run check` (catalogue) and `npm run verify:board` (typecheck, Vitest, catalogue) from
  the repo root.
- Run folder: `/Users/d.fraser/Local Dev/AA consistency review/<YYYY-MM-DD>/` (outside the repo,
  persistent). The first run (baseline `1d8a065`, 2026-10-19) is in that folder's `run/`: a worked
  example of every output, including `fixups.json` and `question-fixups.json`. Pass
  `--storage-key aa-consistency-review` and `--protected` (below) to `build-review.mjs`.
- People: **Donald** (Donald Fraser, Stratos) is the product owner and decides; **Greg** (Greg Smith,
  Peritia, the RFP author) wrote the pricing model documents (v4, v6, executive summary), retired on
  5 November 2026 (AR-28, AR-29, AR-30) when Donald's flat Contract model replaced them; **Ben** is
  the AA principal; **Vanessa** is the AA office administrator. Unanswered points for Ben or Vanessa
  become open questions with `owner: Donald to ask <name>`.
- Source ranking (confirmed by Donald): Donald's typed statements and explicit instructions >
  what Donald and Greg (or AA staff) agreed in meetings > Greg's v6 documents > older catalogue
  readings > the RFP. Within a level, newer beats older. Since 5 November 2026 Greg's v6 documents
  are retired: they still count for facts about the business (who pays, prepayment, the ledger), never
  for the Contract structure, which is Donald's decisions D1 to D11 (Notes 2026-11-05 · Donald
  contract model decisions). The contract model proposal's assumptions (A2 to A49, artifact AR-58)
  are catalogue-level readings, not decisions.
- Settled rulings that must be in the rulings list so agents never "fix" them back (memory:
  no-layered-price-precedence, user-statements-outrank-catalogue).
- Follow-on skill: `update-build-plan <commit>`, once the user has committed the applied changes.
- Workflow arguments for this repo (merge with the `index.json` fields named in each stage):

```json
{
  "rulings": {
    "project": "the Anaesthesia Associates (AA) booking and billing system",
    "owner": "Donald",
    "levels": [
      { "id": "donald", "desc": "Donald (product owner) typed decisions, or his explicit instructions to change the requirements (for example \"Claude, update X\" in a meeting)." },
      { "id": "meeting", "desc": "what was said and agreed in a meeting by Donald, Greg or other AA staff and not contested there (includes AA staff stating how they work)." },
      { "id": "greg-doc", "desc": "Greg's written documents and proposals (pricing model documents v4/v6, executive summary, technical design) where not separately agreed in a meeting." },
      { "id": "catalogue", "desc": "an editorial reading the catalogue recorded in a change log, with no meeting or Donald source behind it." },
      { "id": "rfp", "desc": "the original RFP." }
    ],
    "fixedRulings": [
      "The Contract currently on a Procedure sets how it is priced. Contracts are flat (Donald, 5 November 2026, D1 to D11): one Contract per priced item, held by a Party, with its own undated settings; there is no Contract header, no contract lines, no Contract versions, no line keys and no relinking. A fixed price changes through dated price ranges, which may be backdated; any other setting that must change from a date means a new Contract, and the old one is disabled. Contracts are Active or Disabled, never deleted. The layered \"which price wins\" step order (RVG calculation, then contract price, then anaesthetist entry, then admin override) is not adopted. Requirement bodies (descriptions, acceptance criteria) never state a precedence or override order; at most a Technical discussion line says the step order is not adopted. Never criticise Greg's model.",
      "Donald's direct statements outrank the catalogue, which outranks the RFP. RFP-derived concepts are stale unless the catalogue or Donald confirms them.",
      "Splitting a fee between parties, or adding an extra invoice, is a UI action against a Procedure's Contract, not a Contract setting.",
      "Greg's v6 documents (AR-28, AR-29, AR-30) are retired: no live item links to them, and nothing is changed to agree with them. Where an item follows the v6 structure (lines, versions, line keys, staged schedule changes, upload in the first release), the flat model wins.",
      "Voice (REQ/VOICE.md): stories are the only cards that hold requirements; epics and features give the broad theme only and never list their stories. A description reads as current, with history, names, dates, decision numbers and \"our reading\" markers in Notes."
    ],
    "topics": ["Pricing and price calculation", "Contracts (Parties, settings, pricing kinds, price ranges, specialties, funding tags, fallbacks)", "Contract selection and the step rail", "Prepayment", "RVG codes, units and modifiers", "Billable parties and who pays", "Invoices and the invoice engine", "Payments, disbursement and AA fees", "Xero", "Bookings and procedure capture", "Booking intake and change handling", "Lists and List lifecycle states", "List approval", "Schedule canvas and slots", "Patients and NHI", "Health systems integration and hospital data", "Anaesthetist profile and reporting", "Admin oversight and master data", "Non-functional", "Terminology and naming"]
  },
  "review": {
    "owner": "Donald",
    "houseRules": [
      "F-1: never write a price step order or precedence into a description or acceptance criteria; never criticise Greg's model. A Technical discussion line saying the price step order is not adopted is required by F-1: never flag it.",
      "Voice (REQ/VOICE.md): descriptions read as current, with no history, names, dates, decision numbers or provenance markers (those go in Notes); epics and features give the broad theme only and never list their stories. Flag a description that breaks this; never fix drift by adding history to a description."
    ],
    "protectedArtifacts": [
      { "id": "AR-28", "reason": "Greg Smith's v6 executive summary: retired 2026-11-05, kept as a record; never edit or link it" },
      { "id": "AR-29", "reason": "Greg Smith's v6 technical design: retired 2026-11-05, kept as a record; never edit or link it" },
      { "id": "AR-30", "reason": "Greg Smith's v6 ERD: retired 2026-11-05, kept as a record; never edit or link it" }
    ],
    "diagramNote": "A diagram dated before 2026-11-05 likely predates the flat Contract model (Parties, one Contract per priced item, price ranges, the step rail); AR-61 is its ERD.",
    "groups": [
      { "name": "Pricing, Contracts and prepayment", "topics": ["Pricing and price calculation", "Contracts (Parties, settings, pricing kinds, price ranges, specialties, funding tags, fallbacks)", "Contract selection and the step rail", "Prepayment", "RVG codes, units and modifiers", "Billable parties and who pays"] },
      { "name": "Schedule, Lists and Bookings", "topics": ["Bookings and procedure capture", "Booking intake and change handling", "Lists and List lifecycle states", "List approval", "Schedule canvas and slots"] },
      { "name": "Billing, money and everything else", "topics": null }
    ]
  }
}
```

`groups` names the rulings' own topic headings; here they are the suggested `topics` above. Stage 1
may rename or add headings, so check the groups against `index.json` `topics` after stage 1 and
adjust (a group with `topics: null` takes every topic no other group lists). Stage 2 warns, in its
log and its result's `groupCheck`, about any group topic that matches no rulings topic, and says how
many findings went to the catch-all group.
- `--protected` for `build-review.mjs`: `AR-28,AR-29,AR-30` (the `protectedArtifacts` ids above).

## Ground rules

- Read `REQ/SCHEMA.md` first (item format, sources, statuses, question shape). Do not commit or push.
- Every edit this skill proposes follows `REQ/VOICE.md`: a story's description says what the system
  does, for whom, and why, as if it had always worked this way, with history, names, dates and
  provenance in Notes; epics and features give only the broad theme of what sits under them. A
  proposed fix never adds history or an "Update" paragraph to a description. Pass this to the
  workflows in `houseRules`.
- Ranking: the "This repo" source ranking; within a level newer beats older. A newer statement at a
  lower level does not override an older higher one: it is a conflict for the user.
- **Open questions never drive edits; answered ones can.** Anything unclear becomes a new question,
  not an edit.
- Settled rulings (the "This repo" fixed rulings) go into the rulings list as F- entries so no agent
  "fixes" them back.
- Review pages are local HTML files in the run folder: never an online artifact, never in `/tmp`.
- Cost: this is a large fan-out. Before each workflow, tell the user the rough size (stage 1: one
  Sonnet agent per note, about one per three change logs and per 30 answered questions, plus one Opus
  merge; stage 2: one Haiku agent per epic and feature, about one Sonnet per epic plus one per five
  diagrams and one for the domain model, and one Opus per topic group). Never resume a failed
  pipeline blindly: resume replays only the longest unchanged prefix. Re-run single agents instead.
- You orchestrate; the reading is done by the workflows. Load the `workflow-authoring` skill before
  calling the Workflow tool (this skill authorises it). Pass the workflow script by its
  `.claude/workflows/` name and the JSON arguments described below.

## Stage 0: baseline

1. `git status --porcelain -- REQ` must be empty: the catalogue is committed. If another session is
   still updating requirements, wait until its work is committed. Note the baseline:
   `git rev-parse --short HEAD`.
2. Make the run folder ("This repo") and build the reading packs from the committed state:
   `node K/build-packs.mjs --out <run>` (with `--req` if REQ differs from the default). It writes
   `packs/` (one per live epic with its direct stories, one per live feature with all its
   descendants), `artifact-packs/` (one per live diagram: sidecar, text drawn in the SVG, linking
   items; a Retired or replaced diagram is a record and is left out, listed under `skippedDiagrams`)
   and `index.json` (units, diagrams, skippedDiagrams, notes, changes, answeredQuestions, and topics
   once rulings exist). Cited note points are found as the board finds the note.
   Check the largest pack sizes it prints; a pack over about 250k characters should be split.

## Stage 1: current rulings, then STOP

1. Run the `consistency-rulings` workflow with `out` = the run folder, `baseline`, `notes`,
   `changes`, `answered` (= `index.json` `answeredQuestions`) and the "This repo" `rulings` arguments.
   Sonnet extracts every decision per source (with level, date, verbatim quote, what it replaces);
   Opus merges them into `<run>/rulings.md`: F- fixed rulings, R- rulings by topic, S- "No longer
   true" entries (stale understandings and retired terms, each pointing at its replacement),
   Terminology, and C- conflicts, each with a recommendation.
2. Check the file: it ends in the Conflicts section, each line opens `- **R-nnn**` (the review pages
   parse that), and the "Cite shorthand" line maps every shorthand it uses; note cites use the
   note file's slug words (the file name after its date, hyphens as spaces), never its title.
3. `node K/render-rulings.mjs --rulings <run>/rulings.md --req REQ` writes `<run>/rulings.html`
   (searchable, every code a click-to-explain popover). Its `ref stats` line on stderr lists codes
   that resolve to nothing: fix those in `rulings.md` and re-render.
4. **STOP.** Give the user the page and the conflict titles, and ask them to decide each conflict
   (accept the recommendation, pick a position, or mark it pending an OQ). Say how to read it: the
   rulings are the yardstick; the later review page is the measurement and the only page they
   decide on.
5. Record the decisions in `rulings.md`: rename the section `## Conflicts decided by <owner>
   (<date>)`, add a bold line saying which recommendations were accepted (now rulings at the owner's
   level) and which settle as pending an OQ, and edit any ruling the user corrects. Re-render.
   Re-run `build-packs.mjs` so `index.json` picks up the topics.

## Stage 2: find, verify, consolidate

1. Run the `consistency-changes` workflow with `run` = the run folder, `units`, `diagrams` and
   `topics` from `index.json`, and the "This repo" `review` arguments. It is read-only:
   - **Find** (Haiku, one per epic and feature pack): high recall, verbatim quotes required, against
     the rulings; kinds include contradicts-ruling, stale-understanding, retired-term,
     open-stated-as-decided, contradicts-other-item, answer-not-reflected, status-wrong.
   - **Verify** (Sonnet, per epic in chunks of 30 findings): opens each file, drops false positives
     and anything resting on an open question, merges duplicates, drafts exact `old`/`new` edits and
     sizes them; Sonnet passes also check the diagrams (artifact packs) and `domain-model.md`.
     In a stepped diagram that covers its steps too: names, captions and running balances, and
     the order of the steps. Diagram fixes too big for a same-length text swap, and any change
     to what a step reveals or moves, become redraws (action `redraw`, "needs redrawing").
     Every verified finding says its action: `edit`, `redraw`, or `flag` (no edits: a protected
     artifact, or a fix that waits on a decision).
   - **Consolidate** (Opus, per topic group): re-checks large and medium findings against the
     sources, makes wording consistent across items, adds the same fix to items that were missed,
     merges overlapping edits, titles and sizes each change, and keeps, merges or dismisses (with a
     reason) each proposed question. A question no consolidator kept or dismissed still reaches
     the page, marked "not reviewed by the final pass".
2. The run journal is `subagents/workflows/<run id>/journal.jsonl` under this session's project
   folder in `~/.claude/projects/`. Note its path in the run folder (for example `<run>/JOURNAL`).

## Stage 3: the review page

1. `node K/build-review.mjs --journal <journal.jsonl> --rulings <run>/rulings.md --out <run>
   --baseline <commit> --protected <protected artifact ids>` (plus `--storage-key` from "This repo").
   It writes `<run>/changes.json` and `<run>/review.html`, and prints the counts (changes by size,
   questions and how many the final pass did not review, edits that will not apply, redraws, flags,
   findings the final pass missed).
   - Changes are sorted large, medium, small and given ids `L-01`, `M-01`, `S-01`; questions `Q-01`
     (four digits, `S-0104`, once a series passes 99, so an id never reads as a three-digit ruling
     code). Ids can change on any rebuild, so decisions are not kept by id: each change and question
     carries a fingerprint (`fp`) of what it proposes (its edits; for a change without edits, its
     title, items and action). The page keeps decisions by fingerprint: a change keeps its decision
     under a new id, a change that now proposes something else starts undecided, and decisions from
     an earlier build that no longer match are listed at the top to decide again.
   - Every change has an action: **edit** (edits to apply), **redraw** ("needs redrawing": a diagram
     change too big for a text swap, on a diagram that is neither protected nor retired) or **flag**
     ("flag only": no edits and no redraw, such as a protected-artifact flag or a fix that waits on a
     decision; accepting it acknowledges it).
   - Every edit shows its full repo-relative path and is checked against the live catalogue: inside
     the catalogue folder, never `notes/`, `changes/`, `reference/`, a question's `## Answer`, a
     retired item or artifact, or a protected artifact (those are refused); applies exactly once; still
     applies after the change's earlier edits; no other edit of the change replaces the same text
     differently; and no two changes clash on a file in either order. A failing edit shows a red
     warning on its card, and the card says the change will be held back whole.
   - Each card has before/after word diffs, the items touched, evidence quotes and the rulings it
     rests on; every code (R-, S-, C-, EP/FT/US, OQ, AR, note cites and shorthands, CL/TD, other
     change ids) opens a popover. Accept, Reject, or "Change it..." with a note; decisions persist in
     the browser's localStorage. "Copy decisions" and "Save decisions file" (JSON) export them, each
     as `<id>@<fingerprint>`. Questions: Accept adds an open question; it never changes a requirement.
2. Fix anything wrong before handing the page over, by hand corrections that survive rebuilds:
   - `<run>/fixups.json`: a list of `{ "file", "old", "newContains", "edit": { "old", "new" } }`; an
     edit matching `file`, `old` and containing `newContains` in its `new` is replaced by `edit`
     (use it for an edit that will not apply or that two changes share). A fixed edit changes its
     change's fingerprint, so a decision made before the fix is asked again.
   - `<run>/question-fixups.json`: `{ "remove": { "Q-06@<srcFp>": "why" }, "merge": { "Q-07@<srcFp>":
     "Q-01@<srcFp>" }, "rewrite": { "Q-01@<srcFp>": { "title", "body", "affects" } } }`, keyed by the
     question as `changes.json` lists it (`id@srcFp`, its fingerprint before any fixup), which binds
     each entry to that question. A plain `Q-nn` still works: it is pinned to the question it first
     acts on and skipped, with a warning, once that id names another question. Remove questions the
     catalogue or the user already answers; merge duplicates.
   Rebuild after each change. Never move the review files into `/tmp`.
3. Give the user the page path (`file://...`), the counts, and how to use it: work through the
   review page; when a change surprises them, open its ruling; if a ruling itself is wrong, name it,
   and every change resting on it is dropped or redone, not just that card. Then wait.

## Stage 4: apply what the user decided

1. Read their decisions: `node K/decisions.mjs <decisions> <run>/changes.json --write <run>`, where
   `<decisions>` is the saved JSON or a file holding the pasted "Copy decisions" text. It matches each
   decision to its change by fingerprint and prints accept, reject, change (with notes) and
   undecided; a change that now has another id is listed under the new one; a decision whose change
   has changed or gone is named "decided on an earlier build" and one with no fingerprint (saved
   before fingerprints) "unverified": neither is counted, so ask the user to decide those again. It
   writes `<run>/accepted-ids.txt` (`id@fingerprint` per line).
2. Check the catalogue has not moved since the baseline (`git log <baseline>..HEAD -- REQ`,
   `git status -- REQ`). If it has, rebuild the page first: edits that no longer apply are flagged,
   and decisions carry over by fingerprint.
3. `node K/apply.mjs <run>/changes.json . --ids-file <run>/accepted-ids.txt --dry-run`, check every
   line is `ok`, then run it without `--dry-run`. An id whose fingerprint no longer matches its
   change is refused; a bare id (no fingerprint) is applied only with `--unverified`, after the user
   has confirmed it. A change applies whole or not at all: any `FAIL` (text not found or found twice,
   broken by an earlier edit of the change, or refused) prints `HELD <id>` and writes none of that
   change's edits. Settle each held change by hand (read the file, make the intended edit), never by
   editing a refused file.
4. "Change it..." items: rewrite each edit by hand from the user's note, in the catalogue's voice (`REQ/VOICE.md`) and SCHEMA's format, adding the ruling's source where the fix rests on one.
5. Accepted questions: add each as the next free `REQ/questions/OQ-nn.md` (the default question status, `affects`,
   `sources`, `owner` per "This repo"), written the catalogue's way: `**Already settled:** ...`
   (when something is), `**Still to answer:**` (with the person to ask) and numbered bold questions,
   then `Recommendation: ...`. Link the affected items' text to it where it says the point is pending.
6. Accepted redraws (action `redraw`, "needs redrawing"), and only those: redraw with the
   `svg-diagram` skill, keeping each diagram's regions and the links into them. A stepped diagram
   keeps its steps as well: the step ids that items link to, each step's `show`, `highlight` and
   `moves` anchors pointing at marks that still exist, and captions and balances brought into line
   with the redrawn picture; then look at every step (`artifact:steps`, in the `svg-diagram` skill).
   An accepted flag ("flag only") is an acknowledgement: nothing is redrawn or edited for it; any
   follow-up is done by hand or becomes a question, as the user says.
7. `npm run check` until there are no errors and no new warnings; then `npm run verify:board`.
8. Hand back uncommitted: a short summary (changes applied by size, rewritten by hand, rejected,
   new questions with their OQ ids, diagrams redrawn, anything left undecided) and `git diff --stat
   -- REQ`. Remind the user to commit, then suggest the "This repo" follow-on skill with that commit.
