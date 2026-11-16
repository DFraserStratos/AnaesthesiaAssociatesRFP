## This repo

The only repo-specific facts this skill uses. When the board moves to another repo, rewrite this
block (the board's `ADOPTING.md` says how) and leave the rest alone. Paths are relative to the repo
root.

- `PLAN` = `docs/build-plan` (made by `update-build-plan`); its config is `PLAN/plan.config.json`,
  key `runner` (see "The tools"). `T` = `requirements-board/agent/skills/run-build-phase/tools`;
  `P` = `requirements-board/agent/skills/update-build-plan/tools`. `REQ` = `requirements-board/requirements`.
- **Rules:** `<TODO: the file holding the project's coding rules, e.g. CLAUDE.md>`. Standing rules:
  `PLAN/ROADMAP.md` "Owner review: agents test themselves".
- **The app:** `<TODO: your app folder>`; its tests and builds are the `runner.checks`.
- **House rules:** `<TODO: the project's rules for state, determinism, tests and copy, in brief>`.
- **Design:** `<TODO: the design references and the viewports to compare at, or "none">`. The skill
  is `frontend-design`.
- **Catalogue:** read evidence with `npm --prefix requirements-board run source -- --item <ID> --text`
  (Node 22.18 or newer). A phase never edits a requirement's text or status or any artifact: it names
  the change for `/update-requirements` in its progress entry.
- **Screenshots:** `<TODO: on or off; with capture, recipes in REQ/capture/recipes/ and ATLAS.md>`.
- **Demo guide:** `<TODO: the demo or user guide a phase patches, or "none">`.
- **Progress file:** `<TODO: the progress file, or none (then PLAN/status.json says what is built)>`.
  Status rows `| <id> | <title> | DONE | <YYYY-MM-DD> | <summary> |` (or `IN PROGRESS`); entries
  `### Phase <id> · <title> (<YYYY-MM-DD>)`.
- **Plan page:** `PLAN/status.json` (`in_progress`, `next`, `guidance`) rendered into
  `PLAN/index.html` by `node P/build-index.mjs`. Run order: `PLAN/ROADMAP.md` "Sequencing rules".
- **Tracks:** one, the plan's numbered phases.
