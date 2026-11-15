# UI library preview

A throwaway, demo-only workspace for judging the planned UI library migration
(`docs/ui-library-research/`) **before** touching the prototype. Every row of the prototype's component
catalogue (`/demo/catalogue/*`) is shown twice, side by side and both live:

1. **Current**: the prototype's real component, imported read-only from `aa-prototype/src`.
2. **Proposed**: the same component rebuilt on the standard libraries (shadcn/ui on Base UI, Sonner,
   TanStack Table, React Hook Form + Zod, react-day-picker, Recharts, NumberFlow, Motion), fed the same
   sample data, local state only.

Then name / source / apps, what it does, and the library plus what the replacement gains or loses. Where
a design choice is still open (corner X or not, toast or inline, ToggleGroup or Tabs...), the proposed
column offers **options** as pills: each option is live, and the one on screen is exported as your
preferred option. Each row has an **Adopt · Adjust · Reject** verdict and a note (kept in this browser's
localStorage); **Export** downloads every verdict as Markdown and JSON to hand back to an agent.

It is a deliberate exception to "one prototype folder" (like `contract-picker-mock/`). It never changes
`aa-prototype/` and is never deployed.

## Judging aids

- **★ Recommended option**: on rows with options, the preview's pick is starred, with a "Why" note
  (`src/rows/recommendations.ts`; one ruling per kind of choice, applied across all three apps).
- **shadcn fit, 1 to 5**: how much of the replacement came out of the box versus how much we bent shadcn
  to match the prototype (5 out of the box, 4 light touch, 3 restyled, 2 bent, 1 custom). Theming by CSS
  variables doesn't count as bending; re-skinned kit components do (`src/rows/fit/KIT.md` rates each
  `components/ui` file against stock). Page average in the header, overall scorecard at the foot of each page.
- Export includes both, beside your verdict and preferred option.

## Run it

```sh
npm run setup          # once, from the repo root (installs this folder too)
npm run dev:preview    # http://localhost:5182
```

Pages: `http://localhost:5182/admin`, `/web`, `/mobile`; `/theme` shows every branded library component.
Built for a wide screen (max width 3200px). No prototype dev server is needed: the preview compiles the
prototype's source itself.

## How it works

- **Stack**: Vite 8 + React 19 + TypeScript 6 + Tailwind v4, port 5182 (`vite.config.ts`).
- **The prototype runs inside it, unmodified.** `@proto` aliases `../aa-prototype/src`. Bare imports made
  by prototype files (react, react-dom, react-router-dom, zustand, lucide-react, date-fns) are re-resolved
  to this folder's `node_modules`, so there is one React (19). `virtual:pwa-register/react` is stubbed. The
  prototype's `public/` fonts are served. Its background jobs are not wired.
- **Kit swap.** A small Vite plugin points the prototype catalogue pages' `./CatalogueKit` import at
  `src/kit/ProtoKitShim.tsx`. So `AdminCatalogue`, `WebCatalogue` and `MobileCatalogue` render exactly as
  in the prototype, but each `CatalogueRow` becomes the five-column row in `src/kit/Kit.tsx`, with the real
  example in the prototype's own `WebStage`/`MobileStage` on the left and the replacement registered for the
  same (app, row name) on the right.
- **Replacements** live in `src/rows/<app>/<slice>/`, each slice exporting `replacements` from its
  `index.ts(x)`; `src/rows/registry.ts` loads them one by one before the first render, so a slice that breaks (say, because a prototype export it uses changed) shows its error on its own rows and the rest still render. `rows.json` / `ROWS.md` list every row;
  `BRIEF.md` is the builder brief every row followed; `PLAN.md` is the build record.
- **TypeScript never sees prototype source**: `@proto/*` is declared loosely in `src/proto.d.ts`, so
  `tsc` checks only the preview.

## Style scoping

- The prototype's `global.css` is imported as-is (its own Tailwind root, fonts, `aa-*` classes, keyframes).
- The preview's Tailwind uses **`prefix(tw)`** (`tw:flex`, theme vars `--tw-*`) and imports only Tailwind's
  theme and utilities, not a second preflight, so nothing collides with the prototype's `--color-*` tokens.
- shadcn's semantic variables and base rules, and our brand layer (`src/theme.css`), apply **only under
  `.lib-scope`**: the replacement stages, the body-level portal root, and the mobile replacement stage.
- Portals: every `components/ui` overlay reads `usePortalContainer()` (`src/kit/portal.tsx`). Desktop
  overlays go to a body-level `.lib-scope` root and are tagged "Opened from the proposed replacement";
  mobile ones portal into their own 390px phone stage.
- Verified in the Phase 0 spike: computed styles of the left column match the original catalogue page
  (0 differences across 9 rows) and its screenshots are pixel-identical.

## The brand layer

`src/theme.css` maps `aa-prototype/src/theme/tokens.ts`, `statusColours.ts` and `motion.ts` onto shadcn's
variables: `--primary`/`--ring` teal (the only action colour); crimson only as `--sidebar-primary`/`--brand`
(identity; the admin calendar's crimson today is kept by decision); `--accent` is a quiet hover
background; six status tokens with tint/on-tint and the hatched/dashed treatments; Schibsted Grotesk and
Spline Sans Mono; radii ctl 10 / card 14 / panel 20 / sheet 24 / pill; elevations e1 to e3; motion
classes for the named patterns (fade for desktop overlays, sheet-in for drawers). `src/components/ui/` is
the shadcn CLI output (style `base-nova`, prefix `tw`) re-skinned to the prototype's own sizes; variants
that broke the rules were removed (no filled destructive button, no filled teal badge).

## Pinned versions (exact)

| Package | Version | Note |
|---|---|---|
| react / react-dom | 19.3.1 | |
| @base-ui/react | 1.9.0 | formerly `@base-ui-components/react` (deprecated name) |
| shadcn (CLI) | 4.23.0 | init `-b base -p nova`; components import `cn` from the `cn` package |
| tailwindcss / @tailwindcss/vite | 4.3.5 | |
| vite / @vitejs/plugin-react | 8.3.7 / 6.3.0 | |
| typescript | 6.0.3 | 7.0.2 is out (native port); kept 6.x to match the prototype |
| sonner | 2.0.8 | |
| cmdk | 1.1.1 | installed, but no row needed a command palette; the shadcn Command file was removed |
| @tanstack/react-table | 9.3.1 | **v9 is stable** (9.0.0, Aug 2026) |
| @tanstack/react-virtual | 3.14.26 | |
| react-hook-form / @hookform/resolvers / zod | 7.91.0 / 7.0.5 / 4.6.7 | |
| react-day-picker | 10.0.2 | also published as `@daypicker/react` |
| recharts | 3.8.0 | the version shadcn Chart installs (3.10.1 is latest) |
| @number-flow/react | 0.6.2 | still 0.x |
| motion | 14.12.0 | |
| lucide-react / date-fns | 1.71.0 / 4.4.0 | |
| react-router-dom / zustand | 6.30.6 / 5.1.0 | to run the prototype's own code |

## Known gaps

- **Live prototype source.** The preview compiles `aa-prototype/src` as it is on disk. While another
  session has half-finished edits there, a page can fail to load; it recovers when the prototype compiles
  again.
- **React 19 finding:** `aa-prototype/src/apps/mobile/components/SlideStack.tsx` sets `inert: ''` (the
  React 18 idiom). React 19 reads it as false, so parked slide layers are not inert here (console warning
  on `/mobile`). The migration needs `inert: true`.
- **Partial rows** rebuild the representative part only and say what was left out in their "what
  changed" list (whole screens, nested sheets that write to the demo data, page headers and controls).
- Some rows show **local sample data** where the seed has none (MovedToYouPanel, SeriesList, sample
  notices), and say so on the row.
- Not installed (the stack didn't call for them, or shadcn has no Base UI version): shadcn Sidebar (nav
  rows use Base UI NavigationMenu), React Aria TimeField (SessionTimesFields keeps the native time input as
  option 1), NumberField and Autocomplete (Base UI primitives used directly).
- A few prototype literals have no token yet and are approximated: DayGrid gridline `#F1F4F2`, the admin
  eyebrow pink `#D89AA9`, the light free dot `#8FE3B4`, the holiday row edge `#F2D5DC`, the segmented
  highlight shadow.
- Screenshots (`shots/`) are regenerable and git-ignored.
