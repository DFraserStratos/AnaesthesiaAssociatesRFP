---
name: update-requirements
description: Record new evidence (meeting transcripts, notes, emails, typed decisions or features) as a catalogue note, fill in question answers the evidence settles, and update the requirements catalogue from the note and from question answers changed in the repo. Use after a client meeting, after answering questions on the Requirements Board, or when the user gives decisions or new features to record. Requirements only; the build plan is updated afterwards by update-build-plan.
argument-hint: "[attach or paste transcripts and notes] [optional: since <git ref>, default HEAD]"
---

# Update requirements from new notes and answered questions

Turns new evidence and board answers into catalogue changes, every one of them traceable to a
numbered point in a note or to a question's answer.

Outputs:
- the raw sources filed in the repo, and one reconciled note per session in `catalogue/notes/`;
- questions answered or completed in `catalogue/questions/`;
- requirement items edited, added, retired or moved in `catalogue/requirements/` (plus `domain-model.md`
  where the model changed);
- new questions for anything left unresolved;
- a change log in `docs/discovery-reference/Updated Requirements/changes/`, which `update-build-plan`
  reads next.

Paths below are relative to the repo root. `CAT` = `docs/discovery-reference/Updated Requirements/catalogue`.

## Ground rules

- Read `CAT/SCHEMA.md` and `CAT/notes/README.md` first: they are binding (item format, sources,
  statuses, the answering convention, IDs, no deletes). Then read the newest meeting note in `CAT/notes/`
  (for example `2026-09-29-aa-client-meeting.md`): it is the shape precedent for the note this skill writes.
- The catalogue is the source of truth. This is requirements work only: do not read or change
  `aa-prototype/` or `docs/prototype-build/`.
- Never invent a requirement. Every change traces to a note point (`"Notes <date> · <slug> #n"`) or a
  question answer. Anything the evidence leaves unresolved becomes a new question (OQ), not a guess.
- Notes are append only: never edit an existing note, except the one this run creates.
- Keep the user's own wording when quoting their answers and notes (fix spelling, drop filler).
- Do not commit or push.
- You are the orchestrator: keep your own context for plumbing and decisions, and give the reading,
  drafting and checking to subagents with fresh context. This skill authorises the Workflow tool (load
  the `workflow-authoring` skill before writing the script). Opus for writing and editing, Sonnet for
  extraction, an independent reviewer after every edit. For a small input (one short note, about five
  questions or fewer) skip the workflow: do it inline, with one reviewer subagent.

## Stage 0: inputs (do this yourself)

1. **Evidence the user gave:** attached or pasted transcripts, meeting notes, emails, documents, and
   typed context (decisions, text, new features). If the user gave nothing and the repo shows no
   question changes, ask what to record.
2. **Repo changes:** `git diff <ref> --name-status -- "docs/discovery-reference/Updated Requirements"`
   and `git status --porcelain -- "docs/discovery-reference/Updated Requirements"` (for untracked files).
   `<ref>` is HEAD unless the user names one. Board answers live in `CAT/questions/*.md`. The board may
   also have changed the statuses of affected items: keep those changes.
3. **Inventory the questions** changed in that diff: ID, title, status, answer. Flag every answer that
   defers to the evidence ("in the transcript", "see notes", "as discussed"), is partial, or is empty
   while marked Answered.

## Stage 1: file the evidence (yourself)

- Raw transcripts go to `docs/discovery-reference/Meeting Recordings/<meeting name>.md`, with the raw
  wording, beside any audio of the same name. Other raw material (emails, documents) goes in the same
  folder, unless it is short enough to sit inside the note.
- The note is `CAT/notes/YYYY-MM-DD-<slug>.md`: one per session, dated when the input happened, not
  when it was filed. If that session's note already exists, append new points at its end, continuing the
  numbering.
- Register each new transcript and each new note as an artifact, so the board can show it and items
  can link to a spot in it (a heading, or a line range such as `#L27-33`): follow the `add-artifact`
  skill (kind `transcript` or `note`; the file stays where it is). Diagrams supplied as evidence are
  artifacts too.

## Stage 2: extract (parallel, Sonnet)

- Use one agent per transcript or large source, and one for the user's typed notes.
- Each returns structured points: summary, short quote, location in the source, and kind (decision,
  rule, correction, new feature, number, doubt, or question answer). It also returns the OQ-nn and item
  IDs each point touches, mapped by reading the catalogue.

## Stage 3: the note and the answers

- **Writer (Opus):** reconciles the extracts into the note, in the precedent's shape:
  - a heading block (who, what was covered, the inputs gathered, with relative links to the raw files);
  - "Questions answered" (the board answer quoted first, then what the evidence adds);
  - "<user>'s notes", in their wording;
  - "Other points".
  Points are numbered once across the whole note. Where sources disagree, keep both and flag it.
- **Answers:** for each flagged question, draft the answer from the note and cite the points (`See Notes
  <date> · <slug> #n`). Add the note to the question's `sources`, and set `status: Answered` per
  SCHEMA.md. Do not rewrite an answer the user gave in full; add a "The meeting adds:" line only when the
  evidence materially extends it.
- **Verifier (fresh):** checks every drafted answer and every note point against the raw source, and
  flags anything inferred rather than said.
- **CHECKPOINT:** show the user a table (question ID, title, answer, source points, verifier concerns)
  and the number of note points. Wait for their OK before touching requirements, unless they said to run
  straight through.

## Stage 4: change the requirements

1. **Change list (one Opus agent):** from every answered question (this run's and the repo diff's) and
   every note point, list the changes. Each change has: the item (or "new under <parent>"), the action
   (edit, create, retire, move or status), what changes, and the sources. Every question and every point
   either produces a change or is listed as "no requirement change", with the reason. Keep it as JSON in
   the scratchpad.
2. **Editors (one per epic touched, in parallel):** no two agents edit the same file. Each agent creates
   new IDs only under its own epic. Moves between epics are done afterwards, one at a time. Each editor:
   - puts the decision in the requirement itself (description, acceptance criteria, technical discussion,
     notes), in plain language and the SCHEMA house style;
   - adds the note or question to `sources` in date order, quoted only when it contains `#` or `: `
     (`- "Notes 2026-10-01 · AA meeting with Greg #31"`, but `- OQ-73` bare: SCHEMA's quoting rule);
   - moves status per the answering convention (Confirmed where settled, Verify where it still needs
     checking with AA);
   - sets `components`;
   - creates stories or features with the next free ID under the right parent;
   - retires superseded items rather than deleting them;
   - lists each relation on one side only.
3. **Reviewer per epic (fresh, adversarial):**
   - Does every edit match its source?
   - Is anything invented?
   - Is anything on the change list missing?
   - Is the shape and wording right per SCHEMA?
   - Do the existing acceptance criteria still hold?
   - Are there links to Retired items?
4. **`domain-model.md`:** one agent plus a reviewer, if the model changed.
5. **New questions:** add an OQ for each genuinely unresolved matter, with `affects` set to existing items.

## Stage 5: finish

1. Run `npm run check` from the repo root until there are no errors, and no new warnings from this run.
2. Links: run `npm --prefix requirements-board run links:index`, then the `link-requirements` workflow,
   with `batches` set to the touched epics. Then run `npm --prefix requirements-board run links:apply --
   --dry-run`, check the output, and apply it without `--dry-run`. Run `npm run check` again.
3. **Completeness critic (fresh):** read the note and the change list against the final catalogue. Is
   every point reflected or justified?
4. **Change log:** write `docs/discovery-reference/Updated Requirements/changes/YYYY-MM-DD-<slug>.md`.
   Create the folder if it is new, with a one-paragraph `README.md` explaining that it holds one change
   log per requirements update, which the build-plan update reads. Sections:
   - Inputs (links to the note and the raw files);
   - Questions answered;
   - Items changed, added, retired or moved (ID link, title, what changed, sources);
   - New questions;
   - Points with no requirement change, and why.
5. Report briefly: questions answered, items changed, added and retired, new questions, and anything
   left for the user to decide. Remind them to commit and push, then run `/update-build-plan <commit>`.
