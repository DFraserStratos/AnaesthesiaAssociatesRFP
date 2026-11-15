# Builder brief: library replacement rows

You are building **live library replacements** for rows of the prototype's component catalogue. Each row
in the preview shows the prototype's real component on the left (already wired, do not touch) and your
replacement on the right. Read this whole file, then `PLAN.md`, then the rows you own in `rows.json` /
`ROWS.md`.

## Hard rules
- **Never modify anything under `aa-prototype/`.** Read it freely (it is the source of truth for content and
  behaviour). Do not run `npm install` there. Do not commit.
- **Write only inside your own slice folder** `ui-library-preview/src/rows/<app>/<slice>/` (given in your
  task). Do not edit `src/kit/`, `src/theme.css`, `src/components/ui/`, `src/rows/registry.ts`, `App.tsx`,
  `vite.config.ts` or package files. **Do not run `shadcn add` or `npm install`.** If you need a component
  or package that is missing, stop and report it as an open question (name the row and what you need).
- Use only `@/components/ui/*` (shadcn on Base UI, already branded), `@base-ui/react/*` primitives for what
  shadcn lacks (NumberField, Autocomplete), and the installed libraries: sonner, @tanstack/react-table v9,
  @tanstack/react-virtual, react-hook-form + zod 4 + @hookform/resolvers, react-day-picker (via
  `@/components/ui/calendar`), recharts (via `@/components/ui/chart`), @number-flow/react, motion,
  lucide-react, date-fns. Check the installed package's types in `node_modules` before using an API; the
  versions are newer than your training data (TanStack Table is **v9**, Base UI is `@base-ui/react` 1.9).
- Tailwind classes are **prefixed**: `tw:flex tw:gap-2 tw:bg-primary`. Unprefixed classes do nothing.
- Theme utilities available (see `src/theme.css`): colours `primary` (teal), `brand` (crimson, identity
  only), `teal-tint`, `ink/slate/mist/line/line-strong/sunken/surface`, `success|warning|error` + `-tint`
  / `-on-tint`, `status-{private,public,preop,holiday,unavailable,free}` + `-tint` / `-on-tint`; radii
  `rounded-ctl` (10) `rounded-card` (14) `rounded-panel` (20) `rounded-sheet` (24) `rounded-pill`; shadows
  `shadow-e1/e2/e3`; font `font-mono` (Spline Sans Mono, add `tw:tabular-nums` for figures); classes
  `aa-status-hatched`, `aa-status-dashed`, motion classes `aa-motion-fade|sheet|card`. Badge has status
  variants (`private`, `public`, `preop`, `holiday`, `unavailable`, `free`, `success`, `warning`, `error`).
  Don't hand-roll inline colour hexes; if a token is missing, report it.
- Branded variants worth knowing (read the component file for the full list): Button `default` (teal),
  `outline`, `secondary` (teal tint), `ghost`, `link`, `destructive` (not filled), `pill`; sizes `xs` `sm`
  `default` `lg` `cta`. ToggleGroup/Tabs: `variant="teal"` is the prototype's usual segmented look (teal
  pill, white text); `default` is white pill on sunken; Tabs `line` is the ink underline. Avatar `tint`
  (web) / `elevated` (mobile). Table cells: `data-numeric` for right-aligned tabular figures. Drawer shows
  the prototype handle. The `/theme` route renders every branded component.
- `cn()` does not see our named radii as conflicting: when overriding a radius use the important modifier
  (`tw:rounded-pill!`).

## Design principles (from `docs/ui-library-research/README.md`)
- **Unify, don't redesign; no new flourish.** No new animation, glow, gradients, shadows or effects. Match the
  current component's look and content as closely as the library allows.
- **Teal `#0D6E63` is the only action colour.** Crimson is identity only (avatars, active nav marker,
  masthead), never buttons or status.
- Keep the library's behaviour where it differs (Drawer drag, Tabs arrow keys, ToggleGroup radio semantics,
  focus trap, Escape) and say so in `changes`.

## Copy rules (any visible text)
- No en dashes or em dashes. Use `·`, a comma, or "to" for ranges.
- Never the word "slot" in UI copy. Use the Draft List wording from
  `aa-prototype/src/shared/scheduleTerms.ts` (`DRAFT_LIST`, `DRAFT_LISTS`, `UNASSIGNED`); import those
  constants via `@proto/shared/scheduleTerms` rather than retyping them.

## Determinism
- No `new Date()` (without arguments), `Date.now()` or `Math.random()` in rendered data. Today is the demo
  clock's `DEMO_TODAY` = 2026-07-21 (import from `@proto/domain/clock` if useful, or build
  `new Date(2026, 6, 21)` literals). Calendars: today = DEMO_TODAY, min/max = the prototype's horizon for
  that picker (find it in the prototype component).

## Data
- **Reuse the same sample data** the current example uses: import fixtures and helpers from the prototype
  catalogue (`@proto/apps/demo/catalogue/admin/adminData`, `.../web/fixtures`, `.../mobile/persona`, etc.)
  or prototype domain modules. `@proto/*` imports are typed `any` (TS does not check the prototype); add
  local types for what you use.
- You may **read** the prototype store (`@proto/store`) for seed data if the current example does, but
  **never write to it** from the replacement side. Keep all state local (`useState`, RHF).
- Do not use `react-router` navigation in replacements; render links as `<a href="#">` with
  `aria-current` where needed, and prevent default.

## Stages and overlays
- Your component renders inside the replacement stage (`.lib-scope`): a white card for web rows, a 390px
  phone stage for mobile rows, same height as the left side. Do not add your own outer card.
- Mobile rows: Drawer, Popover, Select, Combobox, Tooltip all portal into the phone stage automatically
  (`PortalContainerContext`). **Sonner:** mount `<Toaster />` from `@/components/ui/sonner` *inside your
  component* (for mobile use `position="bottom-center"` and the prototype's offset above the dock if
  relevant). Give each row's Toaster a unique `id`/`toasterId` and call `toast(..., { toasterId })` so
  rows don't share toasts (check sonner's types for the exact prop name).
- Desktop overlays portal to a body-level root that tags them "Proposed replacement"; nothing to do.

## What to build per row
- A **live, interactive rebuild of the same component**, same content, states and sample data.
- Composite rows (whole screens): rebuild the representative part the row is about (e.g. the table with
  TanStack, the capture cards with Field + ToggleGroup); list what was left out in `changes`.
- "Stays custom" rows: rebuild the custom component **on library primitives** where that's the plan
  (e.g. blocks with Tooltip/HoverCard and roving focus; a bottom tab bar as `<nav>` of links with
  `aria-current`), status `custom`. If nothing library-shaped applies, status `custom` with no Component
  and a one-line `customReason`.

## Options: show every open tweak live
Wherever a replacement involves a design choice that is still open, **build each alternative as its own
live option** rather than picking one. The user switches between them in place (pills above the stage) and
the one on screen is exported as their preferred option. Typical open choices:
- library default vs today's behaviour (corner X close or not; Escape clears the search first or closes;
  tap-the-handle closes or drag only; arrows move the selection or only the view);
- a choice the research left open ("ToggleGroup or Tabs", "Sheet or Dialog", "Combobox or Autocomplete",
  "NumberFlow or keep the tween", "toast or keep inline");
- a visual variant the brand allows either way (teal pill vs white pill segmented; neutral vs tinted toast).
Rules: option 1 is the one closest to today's prototype; label each in a few plain words ("No corner X
(as today)", "Corner X (shadcn default)"); add a one-line `note` on what differs; share code between
options (one component with a prop, wrapped per option), not copies. Don't invent options for their own
sake: only where a real reviewer could reasonably choose either. Rows with no open choice use `Component`.

```ts
Dialog: {
  options: [
    { label: 'No corner X (as today)', Component: () => <DialogRow closeX={false} /> },
    { label: 'Corner X (shadcn default)', Component: () => <DialogRow closeX />, note: 'Adds a second close target' },
  ],
  library: 'shadcn Dialog (Base UI Dialog)', changes: [...], status: 'built',
},
```

## Files and registration
- One file per row (or a small group of related rows), plus `index.ts` (or `index.tsx` if you want JSX in it; never both):

```ts
import type { SliceReplacements } from '../../registry'
import { ButtonReplacement } from './Button'
export const replacements: SliceReplacements = {
  // key = the row's EXACT `name` from rows.json (case, punctuation, parentheses and middots included)
  Button: {
    Component: ButtonReplacement,
    library: 'shadcn Button (Base UI)',
    changes: ['Adds visible teal focus ring', 'Loses the hand-written hover style objects'],
    status: 'built', // 'built' | 'partial' | 'custom'
  },
}
```
- `changes`: 2 to 5 short items, each starting with a verb: "Adds ...", "Loses ...", "Keeps ...",
  "Changes ...". Be honest about losses.

## Check before you hand back
- `npx tsc -b` passes in `ui-library-preview/` (fix only your own files; if an error is elsewhere, report it).
- If a dev server on 5182 is running, load your rows and check there are no console errors from them.
  Don't start a long-lived server unless your task says to.

## Return (short; no file dumps, diffs or logs)
- Rows built: `name · status · library · one-line what changed`.
- Rows you couldn't do, with the reason.
- Open questions (missing components, tokens, packages).
