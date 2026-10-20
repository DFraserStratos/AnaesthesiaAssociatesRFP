## This repo

The only repo-specific facts this skill uses. When the board moves to another repo, rewrite this
block (the board's `ADOPTING.md` says how) and leave the rest alone.

- `BOARD` = `requirements-board`; `REQ` = `requirements-board/requirements`; `T` =
  `requirements-board/agent/skills/update-build-plan/tools` (the tools below). Paths are relative to
  the repo root.
- `PLAN` = `docs/build-plan`. There is no plan yet: the first run takes "Fresh plan" and creates the
  folder, its `plan.config.json` and its `README.md`. Once it exists it is the repo's only
  `plan.config.json`, so the tools find it without `--plan`. Phases are numbered from 01.
- The app: `<TODO: your app folder>` (set `app` and `appCode` in `PLAN/plan.config.json`). No progress file
  yet: until there is one, `PLAN/status.json` (`done`, `in_progress`) says which phases are built.
- Node: 22.18 or newer on PATH (the board's `source` command needs it).
- Standing rules live in `PLAN/ROADMAP.md`: "Owner review: agents test themselves".
- Screenshot capture: off (`"capture": false` in `PLAN/plan.config.json`). Turn it on once the board
  captures screenshots of the app (its `ADOPTING.md`, step 6).
- After an update, no records beyond `PLAN/README.md`'s "Update history".
