## This repo

The only repo-specific facts this skill uses; rewrite them when the board moves (see its `ADOPTING.md`).

- `BOARD` = `requirements-board` (the board's folder); `REQ` = `requirements-board/requirements`.
  Paths below are relative to the repo root.
- Check: `npm --prefix requirements-board run check`.
- The board's dev server: `http://localhost:5180`, or `BOARD_PORT` when set (a worktree's git-ignored `.lane.env` sets it) (`npm --prefix requirements-board run dev`).
- The board's scripts need Node 22.18 or newer: if an agent shell defaults to an older one, put a
  newer one first on `PATH`.
- Reference diagrams: `REQ/artifacts/files/AR-01.svg` (The requirements loop, from the starter
  catalogue), generator `examples/the-requirements-loop.py`; its sidecar `REQ/artifacts/AR-01.md`
  shows what regions and steps look like (it is a stepped diagram). Add this project's own
  diagrams here as they are drawn.
