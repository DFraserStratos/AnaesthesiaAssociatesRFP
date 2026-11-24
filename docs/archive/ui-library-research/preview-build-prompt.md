# Kick-off prompt: build the side-by-side library preview

Written 11 Nov 2026. Paste everything below the line into a new Claude Code session at the repo root.

---

## Task: build a side-by-side UI library preview (current component vs. proposed library replacement)

I want to judge, ahead of time, what the prototype's hand-built UI components would look like rebuilt on the
standard libraries we've picked. This is **preparation only**: the real app must not change. You'll build a
preview where every row shows **the current live component on the left and its proposed library
replacement, also live, on the right**, so I can compare them on a 4K monitor.

### Read first
1. `CLAUDE.md` (repo root). Its conventions are binding, with the overrides stated below.
2. `docs/ui-library-research/README.md`: the goal, the **guiding principles** (unify, don't decorate; no new
   flourishes; prefer the most standard choice) and the provisional stack.
3. `docs/ui-library-research/index.html`: the component map. Also the three `inventory-*.md` files and the
   `research-*.md` files, as needed.
4. The existing live catalogue: `aa-prototype/src/apps/demo/catalogue/`. `CatalogueKit.tsx` is the
   layout. `AdminCatalogue.tsx`, `WebCatalogue.tsx` and `MobileCatalogue.tsx` hold the rows, each with
   `name`, `source`, `usedIn`, `what`, `replaceWith` and `note`, and a live example built from the helpers in
   `admin/`, `web/` and `mobile/`. There are about 63 Admin, 53 Web and 54 Mobile rows. With the prototype's
   dev server running, view them at `http://localhost:5173/demo/catalogue/admin|web|mobile`.

### Hard constraint: do not touch the real app
- **Do not modify anything in `aa-prototype/`.** That covers its `package.json` and lockfile, its source,
  and the existing catalogue. Treat it as read-only source.
- The libraries can't safely live in `aa-prototype`:
  - current shadcn/ui expects React 19, and the prototype is on React 18.3;
  - shadcn's base CSS layer would restyle the existing screens;
  - the packages would enter the app's bundle.
- So build a **separate preview workspace at the repo root: `ui-library-preview/`**. It is a deliberate,
  throwaway exception to "never create a second prototype folder", in the same spirit as
  `contract-picker-mock/`.
  - Stack: Vite + React 19 + TypeScript + Tailwind v4, dev server on **port 5182** (5180 is the board, 5181
    the picker).
  - Add a root script `"dev:preview": "npm --prefix ui-library-preview run dev"`, and add its install to the
    root `setup` script.
  - Those two root `package.json` edits are the only changes allowed outside the new folder, apart from the
    docs listed under "Docs" below.
- **The left column must still be the real current component.** Import the existing catalogue example
  components from `aa-prototype/src` (read-only, via a Vite alias such as `@proto`). Reuse the row data and
  example helpers rather than re-implementing them.
- Work out the details, and **prove them early in a spike**:
  - running the prototype source under React 19;
  - importing its `src/theme/global.css` (fonts, `aa-*` classes, keyframes) alongside the preview's own
    Tailwind;
  - giving the prototype's Zustand store a seeded state (`freshAppState()`);
  - the prototype's router-dependent pieces;
  - `virtual:` imports.

  If any part of the prototype can't run there, say so in that row rather than changing the prototype.
- **Scope the library styling.** shadcn's tokens and base layer must not leak onto the left-hand components.
  Wrap the replacement column in a scoping container, or use a CSS layer. Choose the approach and verify it
  by comparing the left column against the original catalogue page.

### Libraries
Install the provisional stack from the README into `ui-library-preview/` only, with exact versions pinned.
**Check current versions and status before installing**: the research was captured on 11 Nov 2026. If
anything has changed since (deprecations, a new major), note it and pick the sensible current equivalent.

| Library | Use |
|---|---|
| shadcn/ui on the **Base UI** base (`shadcn init`, Base UI) | the foundation components |
| Sonner | toasts |
| Base UI Drawer (via shadcn Drawer) | mobile sheets, not Vaul (unmaintained) |
| Base UI Combobox and Autocomplete | type-aheads |
| cmdk (shadcn Command) | only if a row calls for it |
| TanStack Table v9 + TanStack Virtual | tables |
| React Hook Form + Zod 4 + shadcn Field | forms |
| react-day-picker (shadcn Calendar and Date Picker) | calendars and date inputs |
| Recharts (shadcn Chart) | charts |
| NumberFlow | the figures that already animate |
| Motion | where a "custom on Motion" row needs it |
| lucide-react, date-fns | keep both |

### Theme first: one shared brand layer, done before any fan-out
Map `aa-prototype/src/theme/tokens.ts` and `statusColours.ts` onto shadcn's CSS variables, inside the
preview's scoped layer:
- **Colours:**
  - `--primary` and `--ring` are teal `#0D6E63`, the only action colour.
  - Crimson `#A91E3E` is identity only: `--sidebar-primary`, avatars and similar, never buttons or status.
  - shadcn's `--accent` is a hover background, not a brand accent.
- **Status:** six `--status-*` tokens, each with tint and on-tint values, plus the hatched (Unavailable) and
  dashed (Free) treatments. Add Badge variants for them.
- **Type:** Schibsted Grotesk for UI; Spline Sans Mono with tabular-nums for data.
- **Spacing and shape:** a 4pt spacing scale; our radius scale (ctl 10, card 14, panel 20, sheet 24, pill);
  our elevations.
- **Variants:** delete any variant that breaks the rules, such as a filled non-teal button.
- **Motion:** use our named motion patterns (in `src/theme/motion.ts`) rather than stock tw-animate fades.
  No new animation, glow or effects.

The goal is that the right-hand column looks like *our* product built from standard parts, not default
shadcn and not a redesign. Put this in one place: a `theme.css` plus the `components/ui/` folder that the
shadcn CLI generates. Every subagent uses that and nothing else.

### Layout: wide, for a 4K screen
- Same pages and grouping as the existing catalogue: Admin, Web and Mobile, each grouped by replacement
  library, one component per row. Routes are `/admin`, `/web` and `/mobile` in the preview app.
- Use the full width (max-width about 3200px).
- **Columns:**
  1. Current, live (the real prototype component)
  2. Proposed replacement, live, at the same size, side by side
  3. Component: name, source and which apps use it
  4. What it does
  5. Library and what changed: the library component, plus a short list of what the replacement fixes or
     loses (for example "adds focus trap and Escape", "loses the sliding indicator").
- Keep each row's height aligned, so both live examples sit level.
- **Mobile rows:** both sides render in identical 390px phone stages. The replacement Drawer, Toaster and
  Popovers must portal into their own stage, not `document.body`.
- **Desktop overlays:** a desktop Dialog or Sheet may open over the page. Make it obvious which side opened
  it.

### What a "replacement" is
- A **live, interactive rebuild of the same component** using the library, fed with the same sample data.
- It does not need to be wired to the prototype store. Prefer local state, and never write to the store from
  the replacement side.
- Match the current component's content, states and behaviour where the library allows. Where the library
  changes behaviour, keep the library's behaviour and note it in column 5. Examples: a Drawer that can be
  dragged; Tabs with arrow keys; a ToggleGroup with radio semantics.
- **"Stays custom" rows:** show the custom component rebuilt on library primitives where that is the plan.
  For example, DayGrid blocks with a Tooltip or HoverCard and roving focus; the bottom tab bar as a `<nav>`
  of links with `aria-current`. Otherwise mark the row "No library replacement · stays custom" with a
  one-line reason.
- **Rows that mount a whole screen or a big composite** (BookingDetailBody, ReviewScreen, ListsScreen and so
  on): rebuild the representative part the row is about. For example, the table with TanStack, or the
  capture cards with Field and ToggleGroup. Say what was left out.
- **Recreated rows** (the current side is a copy of a component private to its screen file): the replacement
  is built the same way as for any other row.

### Judging aid
Add a small **verdict control** to each row: Adopt · Adjust · Reject, plus a free-text note.
- Store verdicts in `localStorage`, keyed by app and row name, and wrap every read and write in try/catch.
- Show a running summary per page.
- Add an **Export** button that downloads all verdicts and notes as Markdown and JSON, so I can hand them back
  to an agent.

### Working method: use workflows and subagents, and protect your own context
This is large (about 170 rows). **You are the orchestrator, and your context window is the scarcest resource
in this job.** Delegate as much as you possibly can, so you still have room to integrate, judge and report
at the end.

- **You have my explicit go-ahead to use the Workflow tool** (multi-agent orchestration) as well as the Agent
  tool. Prefer a Workflow for any fan-out or pipeline, such as building the slices in parallel and then
  verifying each one, or screenshot-and-review passes. Use single subagents for one-off jobs.
- **Delegate the reading as well as the building.** Don't read the big catalogue files, inventories or
  library docs into your own context. Send a subagent to read them and return a compact summary: the row
  lists, the props each example needs, the API facts you need.
- **Hand work to subagents as briefs and file paths, not pasted content.** Ask them to return short,
  structured results: the files written, rows built, rows they couldn't do, open questions. Ask for no file
  dumps, no full diffs and no long logs.
- **Delegate checks too:** typechecks, builds, test runs, Playwright passes and design reviews. Subagents
  report pass or fail plus the specific failures, not raw output.
- **Do directly only what needs the whole picture:** the Phase 0 decisions, the shared theme and kit, fixing
  conflicts between slices, and talking to me.
- **Keep a running plan file in the preview folder** (`ui-library-preview/PLAN.md`): phases, slice
  ownership, status per slice, decisions and open questions. Then you, any resumed session or a fresh
  subagent can pick up state from the file instead of from conversation history.

Work in phases:

1. **Phase 0 (you lead it; delegate the research reads and the spike checks): foundations.**
   - Scaffold `ui-library-preview/` and install the libraries.
   - Run the spike: the prototype source runs inside it, the left column matches the original, and the
     styling is scoped.
   - Build the brand theme and the two-column catalogue kit (stages, row and verdict control), and the
     plumbing that pulls each existing row's data and current example from `aa-prototype`.
2. **Phase 1: pilot, then stop.**
   - Build about 8 representative rows across the libraries: Button, Badge (status), ToggleGroup, Dialog,
     Drawer (mobile), Combobox (RVG code picker), one TanStack table, one Calendar, one Sonner toast.
   - Screenshot them, show me the paths, and **wait for my go-ahead** on the theming and layout before
     fanning out.
3. **Phase 2: fan-out, ideally as one Workflow** (build each slice, then verify it, as a pipeline). Use
   about 8 to 12 parallel agents, each owning a disjoint slice:
   - Slice by library group within an app; for example, "Admin · shadcn overlays and navigation" or
     "Mobile · Drawer, Badge and Button rows".
   - Each subagent writes only its own files under `ui-library-preview/src/rows/<app>/<slice>/`.
   - Each uses only the shared theme and `components/ui/`. If a needed shadcn component is missing, the
     subagent asks you rather than running `shadcn add` itself, to avoid concurrent writes; or you add the
     full set in Phase 0.
   - Brief every subagent with:
     - the principles (no flourish, teal only, crimson identity only, our tokens);
     - the copy rules (no en or em dashes, no "slot", Draft List wording from
       `aa-prototype/src/shared/scheduleTerms.ts`);
     - determinism (calendars use the demo clock's today, `DEMO_TODAY` = 2026-07-21, with the horizon as
       min/max; no `new Date()`, `Date.now()` or `Math.random()` in rendered data);
     - a "do not touch `aa-prototype/`" line.

     Ask each one to return the list of rows it built, what each replacement changes, and any row it
     couldn't do.
4. **Phase 3: verification, delegated** (subagents or a Workflow report back pass or fail with specifics).
   - Run the preview's typecheck and build.
   - Have a subagent load all three pages with Playwright from the prototype's `node_modules`, or install it
     in the preview. It should screenshot each page in sections at 3840px wide, check for console errors,
     and confirm that every row from the original catalogue appears (compare names).
   - Run an independent review subagent against `docs/design/Design Language.dc.html` and the README
     principles. Fix what it finds.
   - Confirm `aa-prototype` is unchanged: `git status -- aa-prototype` shows nothing from you.

### Docs
- `ui-library-preview/README.md`: what it is, how to run it, the pinned versions, the scoping approach, and
  known gaps.
- Update `docs/ui-library-research/README.md`:
  - add the preview to the file list;
  - record the final pinned versions;
  - record anything learnt that changes the provisional decisions, for example a library that didn't fit.
- Add one line for the preview workspace to the root `CLAUDE.md` "Where things live" section.

### Finish
- **Do not commit.** I'll commit.
- Give me:
  - how to run it (`npm run dev:preview` on 5182, with the prototype's tsconfig and paths as needed);
  - the three URLs, and screenshot paths for a quick look;
  - a table of rows per app and library with counts of built, partial and stays-custom;
  - any rows you couldn't do, and why;
  - anything in the research that turned out wrong.

**If you hit a blocker** that would require changing `aa-prototype` (for example, the prototype source can't
run under React 19 without edits), stop and tell me before working around it.
