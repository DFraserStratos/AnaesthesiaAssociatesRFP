## This repo

The only repo-specific facts this skill uses. When the board moves to another repo, rewrite this
block (the board's `ADOPTING.md` says how) and leave the rest alone.

- `BOARD` = `requirements-board`; `REQ` = `requirements-board/requirements`. Paths are relative to the
  repo root. `K` = `requirements-board/agent/skills/consistency-review/scripts` (the scripts below).
- Workflows: `consistency-rulings` (stage 1) and `consistency-changes` (stage 2), in
  `requirements-board/agent/workflows/`, linked from `.claude/workflows/`.
- Checks: `npm --prefix requirements-board run check` (catalogue) and
  `npm --prefix requirements-board run verify` (typecheck, Vitest, catalogue).
- Run folder: `<TODO: a persistent folder outside the repo>/<YYYY-MM-DD>/` (not `/tmp`).
  Pass `--storage-key <TODO: project>-consistency-review` to `build-review.mjs`.
- People: `<TODO: product owner>` decides. `<TODO: the client's people, and who wrote which
  documents>`. Unanswered points for the client become open questions with
  `owner: <the product owner> to ask <name>`.
- Source ranking: the product owner's typed statements and explicit instructions > what was agreed
  in meetings > the client's written documents > older catalogue readings > the original brief or
  RFP. Within a level, newer beats older. Confirm this with the product owner.
- Settled rulings that must be in the rulings list so agents never "fix" them back: none yet.
- Follow-on skill: `update-build-plan <commit>`, once the user has committed the applied changes.
- Workflow arguments for this repo (merge with the `index.json` fields named in each stage):

```json
{
  "rulings": {
    "project": "<TODO: one line on the system these requirements describe>",
    "owner": "<TODO: product owner>",
    "levels": [
      { "id": "owner", "desc": "the product owner's typed decisions, or explicit instructions to change the requirements." },
      { "id": "meeting", "desc": "what was said and agreed in a meeting and not contested there." },
      { "id": "client-doc", "desc": "the client's written documents and proposals where not separately agreed in a meeting." },
      { "id": "catalogue", "desc": "an editorial reading the catalogue recorded in a change log, with no meeting or owner source behind it." },
      { "id": "brief", "desc": "the original brief or RFP." }
    ],
    "fixedRulings": [],
    "topics": []
  },
  "review": {
    "owner": "<TODO: product owner>",
    "houseRules": [],
    "protectedArtifacts": [],
    "diagramNote": "",
    "groups": [{ "name": "Everything", "topics": null }]
  }
}
```

`groups` names the rulings' own topic headings, so check them against `index.json` `topics` after
stage 1 and adjust (a group with `topics: null` takes every topic no other group lists).
