# Status recode, 2026-10-20: statuses become codes, Confirmed becomes Agreed, Future goes

A relabel only. **No requirement changed**: no title, text, acceptance criterion, parent, lane or link
moved. Every story and question file changed only in its `status:` line, which now holds a status
code (a whole number) instead of a name. The run went name, then readable code (`agreed`, `retired`...), then
number, all the same day; `status-recodes.json` records it as one step, old name to number. The build plan's change check (`req-changes.mjs` `substance()`)
and the board's history read a status through `status-recodes.json`, so this recode counts as no
change; a later real move (for example Proposed 1 to Agreed 4) still counts.

**Why.** Donald had been using Confirmed to mean "agreed with Greg", and Future is no longer needed
now that swim lanes (the Future Work lane) carry scope. Statuses are now defined in
`board.config.json` (`statuses`, `questionStatuses`: label, help, colour, order and role) and edited
on the board's Settings page, so a later rename touches only the config. A number means only what that
config says; never infer a status from it.

**Counts.** 356 item files and 113 question files rewritten by
`npm --prefix requirements-board run statuses:recode` (recorded in `status-recodes.json`).

| Old | New code (number) | Items | Meaning now |
| --- | --- | --- | --- |
| Proposed | 1 | 79 | Needs agreement with AA (the default) |
| Future | 1 | 10 | As above; scope is the swim lane |
| Open | 2 | 3 | Waiting on an open question |
| Verify | 3 | 45 | Question answered, the whole item still to check |
| Confirmed | 4 (Agreed) | 175 | Agreed with Greg, not yet signed off by AA |
| (new) | 5 (Confirmed) | 0 | Signed off by AA: the final requirements |
| Retired | 6 | 44 | No longer wanted, kept for traceability |

Questions: Open to 1 (25), Proposed to 3 (1), Answered to 4 (87); 2 (Confirm) is unused.

**Scope for the build plan.** Future no longer excludes an item. The catch-up tools
(`docs/prototype-build/catch-up/tools/scope.mjs`) now leave out a retired item, one under a retired
epic, a story in the Future Work lane, and a feature whose live stories are all in that lane. Against
the old rule this keeps FT-14.1, FT-14.2, FT-14.3 and FT-14.5 out (they were Future) and newly leaves
out FT-02.2 (Surgeon PDF list ingest) and FT-14.6 (Further hospital feeds and automatic matching),
whose live stories are all in Future Work. Nothing that was out of scope comes into scope.
`recipe-status.mjs` now uses the same rule, so it also stops asking a phase to name US-02.2.3 (in the
Future Work lane).

**Left as written.** Prose in stories, questions, notes and older change logs that names an old
status ("stays Confirmed", "now Retired") is history and was not rewritten.
