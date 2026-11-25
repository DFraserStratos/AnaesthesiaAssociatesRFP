Please continue Lane A of the build plan of the Anaesthesia Associates prototype (the Finances section: Phase 58 in Wave 4; 60 and 61 in Wave 5).

You are Lane A: worktree /Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneA, branch lane/a, ports 5273 (prototype), 5274 (PWA) and 5280 (board). The ports come from that worktree's .lane.env, which the dev servers, Playwright and phase-check read themselves.

First, if that worktree does not exist yet (`git worktree list`), you set the lanes up: from the main checkout (/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP), read docs/build-plan/LANES.md and follow its "Setting up the lanes" section, then carry on below.

Then get into your worktree. If this session's working directory is not that folder, switch into it with the EnterWorktree tool, passing that folder as `path` (load the tool with ToolSearch "select:EnterWorktree" if it is deferred). Never pass EnterWorktree a `name` (that makes a new worktree), and never edit, build or run anything in the main checkout beyond the setup. If you cannot switch, stop and tell me to start the session in that folder.

Then read docs/build-plan/LANES.md in your worktree, whole, and follow "How a lane session runs". It says which wave you are in and whether it has started, which phase is next in your lane, when you sync with the other lanes, when you join, and which of its rules override the phase's kick-off prompt, the run-build-phase skill and CLAUDE.md. Above all: use subagents as much as possible, finish each phase on the quick checks only (no full gate, review, screen-proof or checklist run), and leave the one full test to Wave 5's join. Commit on lane/a as it says; never push.
