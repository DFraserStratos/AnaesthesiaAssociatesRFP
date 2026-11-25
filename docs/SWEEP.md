# Screenshot and demo-guide sweeps

App changes don't update the catalogue screenshots, capture recipes or demo guide. The owner runs
`/sweep` (`.claude/skills/sweep/`) to bring them in step with everything committed since the last
row here. The sweep reads the commit on the last row as its base and adds a row when it lands.

| Date | Swept to | Captured | Notes |
|---|---|---|---|
| 2026-11-24 | c849deab | all after Phase 44 (b88386b7), then the changes since | Baseline. Recipes FT-01.6 and US-03.6.1 (mobile) fail; see BACKLOG. Work after c849deab is not swept. |
| 2026-11-26 | 06e9a4c5 | all (258 recipes, 1,080 screenshots; 0 failed) | Phases 45 to 57, Admin frame, Day rail, whole-practice data, demo day 24 Nov. 228 recipes changed, 3 new (US-04.1.7, US-04.1.8, US-12.1.6); demo guide re-read in the app with a new make-inactive aside; Playwright back to green (453 passed); capture click steps take a `timeout` (board 1.29.1). App gaps found are in BACKLOG. |
