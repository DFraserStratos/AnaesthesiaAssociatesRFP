# Screenshot and demo-guide sweeps

App changes don't update the catalogue screenshots, capture recipes or demo guide. The owner runs
`/sweep` (`.claude/skills/sweep/`) to bring them in step with everything committed since the last
row here. The sweep reads the commit on the last row as its base and adds a row when it lands.

| Date | Swept to | Captured | Notes |
|---|---|---|---|
| 2026-11-24 | c849deab | all after Phase 44 (b88386b7), then the changes since | Baseline. Recipes FT-01.6 and US-03.6.1 (mobile) fail; see BACKLOG. Work after c849deab is not swept. |
