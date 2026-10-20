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
  `--storage-key aa-consistency-review` to `build-review.mjs`.
- People: **Donald** (Donald Fraser, Stratos) is the product owner and decides; **Greg** (Greg Smith,
  Peritia, the RFP author) wrote the pricing model documents (v4, v6, executive summary); **Ben** is
  the AA principal; **Vanessa** is the AA office administrator. Unanswered points for Ben or Vanessa
  become open questions with `owner: Donald to ask <name>`.
- Source ranking (confirmed by Donald): Donald's typed statements and explicit instructions >
  what Donald and Greg (or AA staff) agreed in meetings > Greg's v6 documents > older catalogue
  readings > the RFP. Within a level, newer beats older.
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
      "The Contract currently on a Procedure sets how it is priced; a pricing change is a change to a new Contract (or Contract version). The layered \"which price wins\" step order (RVG calculation, then contract price, then anaesthetist entry, then admin override) is not adopted. Requirement bodies (descriptions, acceptance criteria) never state a precedence or override order; at most a Technical discussion line says the step order is not adopted. Never criticise Greg's model.",
      "Donald's direct statements outrank the catalogue, which outranks the RFP. RFP-derived concepts are stale unless the catalogue or Donald confirms them.",
      "Splitting a fee between parties, or adding an extra invoice, is a UI action against a Procedure's Contract, not a Contract setting."
    ],
    "topics": ["Pricing and price calculation", "Contracts (structure, versions, flags, lines)", "Prepayment", "RVG codes, units and modifiers", "Billable parties and who pays", "Invoices and the invoice engine", "Payments, disbursement and AA fees", "Xero", "Bookings and procedure capture", "Booking intake and change handling", "Lists and List lifecycle states", "List approval", "Schedule canvas and slots", "Patients and NHI", "Health systems integration and hospital data", "Anaesthetist profile and reporting", "Admin oversight and master data", "Non-functional", "Terminology and naming"]
  },
  "review": {
    "owner": "Donald",
    "houseRules": [
      "F-1: never write a price step order or precedence into a description or acceptance criteria; never criticise Greg's model. A Technical discussion line saying the price step order is not adopted is required by F-1: never flag it."
    ],
    "protectedArtifacts": [{ "id": "AR-30", "reason": "Greg Smith's own ERD (his v6 document)" }],
    "diagramNote": "A diagram dated before 2026-10-16 likely predates the pricing changes.",
    "groups": [
      { "name": "Pricing, Contracts and prepayment", "topics": ["RVG, units and modifiers", "Multi-procedure Bookings", "Contracts: what they are, flags, holders, lines", "Contract selection", "Billable party and payer", "Pricing and who may change it", "Prepayment"] },
      { "name": "Schedule, Lists and Bookings", "topics": ["Schedule, Slots and availability", "Lists and the List lifecycle", "Draft Lists", "Moving Lists and Bookings; preferences; tiers", "Booking intake and change handling", "Bookings, Procedures and descriptions"] },
      { "name": "Billing, money and everything else", "topics": null }
    ]
  }
}
```

`groups` names the rulings' own topic headings, so check them against `index.json` `topics` after
stage 1 and adjust (a group with `topics: null` takes every topic no other group lists).

## Ground rules

- Read `REQ/SCHEMA.md` first (item format, sources, statuses, question shape). Do not commit or push.
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
   descendants), `artifact-packs/` (one per diagram: sidecar, text drawn in the SVG, linking items)
   and `index.json` (units, diagrams, notes, changes, answeredQuestions, and topics once rulings exist).
   Check the largest pack sizes it prints; a pack over about 250k characters should be split.

## Stage 1: current rulings, then STOP

1. Run the `consistency-rulings` workflow with `out` = the run folder, `baseline`, `notes`,
   `changes`, `answered` (= `index.json` `answeredQuestions`) and the "This repo" `rulings` arguments.
   Sonnet extracts every decision per source (with level, date, verbatim quote, what it replaces);
   Opus merges them into `<run>/rulings.md`: F- fixed rulings, R- rulings by topic, S- "No longer
   true" entries (stale understandings and retired terms, each pointing at its replacement),
   Terminology, and C- conflicts, each with a recommendation.
2. Check the file: it ends in the Conflicts section, each line opens `- **R-nnn**` (the review pages
   parse that), and the "Cite shorthand" line maps every shorthand it uses.
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
     Diagram fixes too big for a same-length text swap become "needs redrawing" changes.
   - **Consolidate** (Opus, per topic group): re-checks large and medium findings against the
     sources, makes wording consistent across items, adds the same fix to items that were missed,
     merges overlapping edits, titles and sizes each change, and keeps only genuinely open questions.
2. The run journal is `subagents/workflows/<run id>/journal.jsonl` under this session's project
   folder in `~/.claude/projects/`. Note its path in the run folder (for example `<run>/JOURNAL`).

## Stage 3: the review page

1. `node K/build-review.mjs --journal <journal.jsonl> --rulings <run>/rulings.md --out <run>
   --baseline <commit>` (plus `--storage-key` from "This repo"). It writes `<run>/changes.json` and
   `<run>/review.html`, and prints the counts (changes by size, questions, edits that will not apply,
   diagrams to redraw, findings the final pass missed).
   - Changes are sorted large, medium, small and given ids `L-nn`, `M-nn`, `S-nn`; questions `Q-nn`.
     Ids are stable while the journal and fixups stay the same, so decisions saved on the page survive
     a rebuild.
   - Every edit is checked against the live catalogue: applies exactly once, and no two changes clash
     on a file in either order. A failing edit shows a red warning on its card.
   - Each card has before/after word diffs, the items touched, evidence quotes and the rulings it
     rests on; every code (R-, S-, C-, EP/FT/US, OQ, AR, note cites and shorthands, CL/TD, other
     change ids) opens a popover. Accept, Reject, or "Change it..." with a note; decisions persist in
     the browser's localStorage. "Copy decisions" and "Save decisions file" (JSON) export them.
     Questions: Accept adds an open question; it never changes a requirement.
2. Fix anything wrong before handing the page over, by hand corrections that survive rebuilds:
   - `<run>/fixups.json`: a list of `{ "file", "old", "newContains", "edit": { "old", "new" } }`; an
     edit matching `file`, `old` and containing `newContains` in its `new` is replaced by `edit`
     (use it for an edit that will not apply or that two changes share).
   - `<run>/question-fixups.json`: `{ "remove": { "Q-06": "why" }, "merge": { "Q-07": "Q-01" },
     "rewrite": { "Q-01": { "title", "body", "affects" } } }`, by the original `Q-nn`. Remove
     questions the catalogue or the user already answers; merge duplicates.
   Rebuild after each change. Never move the review files into `/tmp`.
3. Give the user the page path (`file://...`), the counts, and how to use it: work through the
   review page; when a change surprises them, open its ruling; if a ruling itself is wrong, name it,
   and every change resting on it is dropped or redone, not just that card. Then wait.

## Stage 4: apply what the user decided

1. Read their decisions: the saved JSON (`node K/decisions.mjs <decisions.json> <run>/changes.json
   --write <run>`, which prints accept, reject, change (with notes) and undecided, and writes
   `<run>/accepted-ids.txt`) or the pasted "Copy decisions" text.
2. Check the catalogue has not moved since the baseline (`git log <baseline>..HEAD -- REQ`,
   `git status -- REQ`). If it has, rebuild the page first: edits that no longer apply are flagged.
3. `node K/apply.mjs <run>/changes.json . --ids-file <run>/accepted-ids.txt --dry-run`, check every
   line is `ok`, then run it without `--dry-run`. Settle each `FAIL` by hand (read the file, make the
   intended edit).
4. "Change it..." items: rewrite each edit by hand from the user's note, in the item's voice and the
   SCHEMA house style, adding the ruling's source where the fix rests on one.
5. Accepted questions: add each as the next free `REQ/questions/OQ-nn.md` (the default question status, `affects`,
   `sources`, `owner` per "This repo"), written the catalogue's way: `**Already settled:** ...`
   (when something is), `**Still to answer:**` (with the person to ask) and numbered bold questions,
   then `Recommendation: ...`. Link the affected items' text to it where it says the point is pending.
6. Changes marked "needs redrawing" that the user accepted: redraw with the `svg-diagram` skill,
   keeping each diagram's regions and the links into them.
7. `npm run check` until there are no errors and no new warnings; then `npm run verify:board`.
8. Hand back uncommitted: a short summary (changes applied by size, rewritten by hand, rejected,
   new questions with their OQ ids, diagrams redrawn, anything left undecided) and `git diff --stat
   -- REQ`. Remind the user to commit, then suggest the "This repo" follow-on skill with that commit.
