# Changelog

Bump `version` in `package.json` and add an entry here before each kit export.

## 1.2.0 · 2026-11-04

- The build plan page (`update-build-plan`'s `build-index.mjs`) is cut to the essentials: a headline saying what to start, a map of every phase by track and wave (done, safe to start, safe once its dependencies land, wait, later), "Start now" cards with the kick-off prompt one click away, and an "Unblocked, but wait" list. Every phase, the sequencing rules, how a phase runs, milestones, parked items and the gap analysis sit behind collapsed sections.
- Phases in the same wave do not depend on each other, so the map shows what can run side by side. A phase whose blocking questions were answered after the plan's baseline is marked "re-plan first".
- The owner's safe and wait calls live in the plan's `status.json` `guidance`; the skill reviews them after each update.

## 1.1.0 · 2026-11-03

- Tables in Markdown text now render (GitHub-flavoured Markdown); a single tilde, as in "~85", stays literal rather than striking text through.
- Find in the open card: Ctrl F (Cmd F on a Mac) opens a find bar for the card, tints the matches and steps through them; the board's own search takes Ctrl F once the card is closed.
- Search finds items by ID the way people type them: `4.1.1`, `us 4.1.1` and `US-04.1.1` all find US-04.1.1, and `4.1` lists what sits under it first.

## 1.0.0 · 2026-10-21

- First shared release of the board as a kit.
- Settings: name the board and the project, set the locale, and edit the components.
- About page: the requirements loop, every skill, what is on the board, files and commands.
- A starter catalogue that explains the board, and the `update-build-plan` skill in the kit.
- Writing voice: `requirements/VOICE.md` says how requirements are written; the skills follow it, and Settings shows and edits it.
- `START-HERE.html`: a static setup guide with one prompt that has Claude Code set the board up.
- `install-skills` copies the skills into the repo's `.claude/` (or links them with `-- --link`), next to any skills the repo already has.
