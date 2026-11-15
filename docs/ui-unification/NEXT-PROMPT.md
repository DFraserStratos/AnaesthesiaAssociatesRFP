# Write the UI unification phase docs and kick-off prompts (U1 to U7), and register them

You are starting fresh. Read this whole brief before doing anything. **This session writes planning documents
only.** Do not change code in `aa-prototype/`. Do not commit or push (root `CLAUDE.md`: I handle all commits).
Never publish pages online; any HTML is saved locally and opened with `open <path>`.

## Where we are

- The prototype (`aa-prototype/`; root `CLAUDE.md` is binding) has many UI components built more than once.
  We decided NOT to adopt shadcn or any component library. Instead we consolidate to one hand-built component
  per job, keeping our own design. No redesign, no new flourish.
- A full audit and plan were finished on 12 November 2026 and live in `docs/ui-unification/`:
  - `README.md`: the audit. 36 ranked groups (U01 to U36), nine confirmed bugs, intended differences we keep,
    token gaps, guardrails (section 8), and **27 questions, all answered: I chose the recommended answer for
    every one** (section 6). Treat each "Recommended" there as a settled decision.
  - `PLAN.md`: the approved plan. Seven phases U1 to U7 (about 12 sessions), their order against the catch-up
    phases, per-phase contents, what folds into which catch-up phase (section 3), done criteria (section 4),
    how to register the phases (section 5), risks (section 6).
  - `detail/A` to `G`: verified per-family findings (members with file and line, intended vs drift, target API,
    behaviour contract, migration risks, upcoming phases, catalogue rows).
  - `detail/H-tokens.md` (token gaps), `detail/I-context.md` (remaining catch-up phases, decisions with
    PROGRESS.md line numbers, what must not break, **the phase doc and prompt house style, and how phases are
    numbered and registered**), `detail/J-completeness.md` (ten families the sweeps missed, token spot-check).
  - `index.html`: the visual companion. `shots/`: screenshots of all 170 live catalogue rows from 12 November
    (the "before" baseline) with `shots/shoot.mjs` to retake them.
- Already applied: the "not adopting a library" status note at the top of `docs/ui-library-research/README.md`,
  and `CLAUDE.md` now says six named motion patterns.
- Not yet done: `ui-library-preview/` is still in place. It is retired at the start of U1 (archive `rows.json`,
  `ROWS.md`, `PLAN.md`, `src/rows/fit/`, `src/rows/recommendations.ts` to
  `docs/ui-library-research/preview-archive/`, delete the workspace, remove `dev:preview` and its `setup` step
  from the root `package.json` and its paragraph from `CLAUDE.md`). That is a U1 work item, not this session's.
- Catch-up Phase 21 was being built in another session while the audit ran. Check `git status`, `git log` and
  `docs/prototype-build/catch-up/status.json` for where the catch-up plan is now, and adjust "runs after"
  wording if 21 or later phases have landed.

## Your job

Turn the approved plan into phase docs and kick-off prompts in the style of
`docs/prototype-build/catch-up/phases/`, and register them so the plan tooling keeps them.

1. **Read first** (delegate big reads to subagents; **use Opus for every subagent**):
   - `docs/ui-unification/README.md` and `PLAN.md` in full.
   - `docs/ui-unification/detail/I-context.md`, sections "Phase doc and kick-off prompt house style" and
     "Numbering and registration".
   - Two or three existing phase docs and their `.prompt.md` files as style models (for example
     `phase-21-billable-party-and-required-inputs`, `phase-17a-rooms-and-practice-contacts`), plus
     `docs/prototype-build/catch-up/README.md`, `ROADMAP.md`, `plan.json`, `status.json`, `plan.config.json`.
   - The `update-build-plan` skill (`requirements-board/agent/skills/update-build-plan/`), especially its
     "Small updates" path and the tools `build-index.mjs`, `recipe-status.mjs`, `plan-state.mjs`.
2. **Write seven phase docs and seven prompts** in `docs/prototype-build/catch-up/phases/`:
   `phase-U1-tokens-money-date-text.md` (+ `.prompt.md`), `phase-U2-overlays`, `phase-U3-pills-badges-feedback`,
   `phase-U4-fields-and-search`, `phase-U5-buttons-tabs-toggles`, `phase-U6-tables-cards-page-chrome`,
   `phase-U7-close-out`. For each:
   - Same sections and order as a catch-up phase doc. "Requirements covered" becomes "Groups covered" (the
     U-numbers, linking to `docs/ui-unification/`). "Reference" names the detail file and group, the mockups in
     `docs/design/` cited there, and the README question number that settled each look.
   - Work items grouped by session, each naming the shared component to build (name, home, props from the
     detail file), the call sites to migrate, and the members NOT to touch because a catch-up phase rebuilds
     them (`PLAN.md` section 2 "Not migrated here" and section 3).
   - The behaviour contract from the detail file as the manual test checklist (keyboard, focus, Escape, ARIA),
     run by the agent in the live app with evidence.
   - Every hook that must survive: `shot` props and `data-shot`, `data-testid`, `data-validation-*`, row
     `data-*` attributes, the Playwright specs and capture recipes named in the detail files.
   - Done criteria from `PLAN.md` section 4, including the before and after catalogue screenshot comparison
     against `docs/ui-unification/shots/`, "no hook lost", catalogue rows in step, demo guide checked, no
     `PERSIST_VERSION` change, copies deleted.
   - **Tooling requirements:** keep the exact heading `## Catalogue screenshots` (state the phase owns no
     stories; list "Recipes this phase breaks"), and the prompt must contain `npm run capture`, or
     `recipe-status.mjs --check` fails.
   - "While working" in each prompt adds: default props keep today's look; never drop a hook; no redesign; a
     visible change must cite the README question that approved it; invoke the frontend-design skill only
     inside the existing design system.
   - U1 also: retire `ui-library-preview/` as above, write `src/shared/ui/README.md` ("how to add a variant",
     README section 8). U2 also: the extra done criterion for the Escape bug (`PLAN.md` U2). U7 also: regroup
     the live catalogue by family, the guardrail source-scan test, and the "One component per job" section for
     `CLAUDE.md` (README section 8).
3. **Add the fold-in work items** to the affected catch-up phase docs by hand (`PLAN.md` section 3): one added
   work item ("build on the shared components; migrate these copies") and one added adversarial-review line
   ("a new private copy of a shared component is a finding") per phase listed. Use the "Small updates" path so
   the planner is not re-run. Do not edit phase docs for phases already DONE.
4. **Register the phases** (`PLAN.md` section 5): add U1 to U7 to `plan.json` as a new track "UI unification"
   with empty `covers`, `depends_on`, `est_sessions`, and a `sequencing_rules` line for each "must land before"
   in `PLAN.md` section 1; add them to `ROADMAP.md` (Tracks, Phases table, Sequencing rules, with a rule saying
   the U phases are owner-added, outside the gap analysis, and must be kept by `/update-build-plan`); add the
   one-component rule to `plan.config.json` standing rules; update `status.json` guidance for the new order
   (U1, U2, U3 before 21a; U4, U5 after 22 and before 23; U6 after 25; U7 before 44); regenerate
   `docs/prototype-build/catch-up/index.html` with `build-index.mjs`.
5. **Verify:** `recipe-status.mjs --check`, `plan-state.mjs --coverage` and `npm run verify:board` pass;
   `build-index.mjs` gives no warnings about the U phases; `git status -- aa-prototype` shows no change from
   this session. Have an Opus subagent that did not write the docs check each phase doc against
   `docs/ui-unification/` for wrong counts, names, file paths, phase numbers and missing groups (every U01 to
   U36 must appear in exactly one phase, except U09 and U35 which appear in two as `PLAN.md` says).
6. **Report back:** the files written and changed, anything in the plan you had to adjust because catch-up
   phases moved, and the kick-off prompt for U1 ready to paste into a new session. Open the regenerated
   `docs/prototype-build/catch-up/index.html` in my browser and give me its absolute path.

## Rules that apply throughout

- Root `CLAUDE.md` conventions: mock backend only, demo clock, no en or em dashes in app copy, design files
  authoritative, teal is the only action colour and crimson is identity only.
- Do not re-litigate the 27 answers or the intended differences in README section 5.
- If a detail file and the README disagree, the README (fact-checked against the detail files) wins; say so.
- Stop and ask me only if registering the phases would require re-running the plan generator, or if a
  catch-up phase has landed in a way that breaks the approved order.
