## This repo

The only repo-specific facts this skill uses. When the board moves to another repo, rewrite this
block (the board's `ADOPTING.md` says how) and leave the rest alone.

- `BOARD` = `requirements-board` (the board's folder); `REQ` = `requirements-board/requirements` (the
  requirements folder: the catalogue, its notes, artifacts and change logs all live there). Paths
  below are relative to the repo root.
- Check: `npm --prefix requirements-board run check`.
- Who signs requirements off: `<TODO: your client>`. Files store status numbers
  (`status: 4`), which mean only what `REQ/board.config.json` says (`statuses`, `questionStatuses`):
  look them up there, never infer one from its number. Starter items: 1 Proposed (default), 2 Open
  (waiting), 3 Verify (settle), 4 Confirmed (settle; signed off by the client, never set without the
  client's explicit sign-off), 5 Retired. Questions: 1 Open (default), 2 Confirm, 3 Proposed, 4 Answered.
- Out of bounds for this skill: the app and its build plan, `<TODO: the app's folder and the build plan's folder>`.
- Follow-on skill: `update-build-plan`, which reads the change log once the user has committed it.
- Shape precedent for a note: none yet. The first note this skill writes sets it; then name it here.
