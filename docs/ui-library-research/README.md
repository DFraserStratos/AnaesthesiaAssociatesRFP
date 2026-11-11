# UI library research: start here

**Status:** research only, parked. Nothing has been changed in `aa-prototype/`. The plan is to pick this up
towards the end of the prototype build (after the catch-up phases).

**Snapshot:** gathered 11 November 2026, at commit `48fa38d4` (with uncommitted catch-up work in progress
at the time). The inventories describe the app at that point; library versions and status are as reported
by npm and GitHub on that date. **Recheck both before starting.**

## The goal

Replace much of the prototype's hand-built UI with standard, widely known component libraries. The point
is **unification and recognisability, not polish**:

- The real system will be built by real developers, probably on different frameworks. A prototype made of
  familiar building blocks (dialog, sheet, combobox, data table, toast, tabs) is much easier for them to read
  and rebuild than ~211 bespoke components with ~2,870 inline style objects.
- One component per job across all three apps (Admin, Anaesthetist Web, Anaesthetist Mobile), instead of
  today's near-duplicates (four avatars, three icon buttons, three hand-written popovers, `Th`/`Td` in four
  files, three search inputs).
- Behaviour and accessibility come from the library (focus trap, Escape, keyboard models, ARIA), so the
  prototype demonstrates the *expected* interaction contract for each pattern.

## Guiding principles (read before doing anything)

1. **No new flourishes.** Do not add animation, glow, effects or "standout moments" that the app does not
   already have. The video that started this ("designed components" tier: Magic UI, Aceternity, RareUI,
   21st.dev) is mostly out of scope for that reason. Existing motion (sheet in/out, card advance, the
   completion tick, the value tick) is kept and re-expressed, not expanded.
2. **Unify, don't redesign.** The look stays as defined in `docs/design/` (Design Language tokens, teal as
   the only action colour, crimson identity only, Schibsted Grotesk + Spline Sans Mono). The library is
   re-skinned to our tokens; we don't adopt its default look.
3. **Prefer the most standard choice.** When two libraries fit, pick the one a typical React developer
   already knows, so the prototype maps cleanly onto whatever framework the real build uses.
4. **One pattern per job.** Every overlay, picker, table, toast and form field uses the same component in all
   three apps. Where a domain need forces something custom (see "Stays custom"), build it *from* the library
   primitives.
5. **Library-agnostic naming in the seams.** Keep our own thin seams (for example `useSurface().Overlay`) so
   the underlying library could be swapped again, and so the real build can see the pattern, not the vendor.
6. **Prototype conventions still apply:** mock backend only, demo clock (no `new Date()` in pickers: pass
   `DEMO_TODAY` and the horizon), `PERSIST_VERSION` bumps if seed shape changes, no en/em dashes in UI copy,
   `npm run build`, `npm run build:pwa` and `npx vitest run` green, and the `data-shot` /
   `data-validation-*` / demo-trigger attributes kept on the nodes Playwright and capture target.

## Provisional decisions (to confirm at pick-up)

| Topic | Leaning | Why |
|---|---|---|
| Foundation | **shadcn/ui on the Base UI base**, Tailwind v4 | The most recognised React kit; Base UI is shadcn's default since Jul 2026 and has Combobox, Drawer, NumberField, Field/Form that Radix lacks. Radix is the fallback. |
| React | **Upgrade 18.3 → 19 first** | Current shadcn code passes `ref` as a plain prop; refs silently break on 18. |
| Mobile sheets | **Base UI Drawer** (shadcn Drawer) | Vaul is officially unmaintained (README, Oct 2025). |
| Toasts | **Sonner** | Standard; replaces inline success banners and the PWA update snackbar. Errors stay inline. |
| Type-aheads | **Base UI Combobox** | RVG code, surgeon, specialties, contract pickers. |
| Command palette | cmdk, **only if wanted** | It is a new feature, not a unification; decide at pick-up. |
| Tables | **TanStack Table v9** + shadcn Table, TanStack Virtual for long lists | 17 Admin tables + ~8 web tables share one model. |
| Forms | **React Hook Form + Zod** + shadcn Field | One label, error and validation pattern across ~30 sheets. |
| Calendars / dates | **react-day-picker** (shadcn Calendar / Date Picker) | Replaces 21 native date/time inputs and three custom month grids (keep custom day content). |
| Motion | Keep existing patterns; Motion library only where the current behaviour needs it (SlideStack, exit animations) | No new motion. |
| Animated numbers | Keep the existing booking fee/units tween (`useTickingValue`); NumberFlow is an optional like-for-like swap | Do not animate any figure that is static today. |
| Charts | Recharts (shadcn Chart) for the receivables aging bars | Replaces a hand-built span chart; adds an accessible fallback. |
| Designed-component libraries | **Not used** | Against principle 1. Beautiful UI noted only for a possible future AI assistant. |

## Stays custom (built on library primitives)

Admin DayGrid scheduling canvas; mobile SlideStack with edge-swipe-back; collapsing mobile masthead;
status-colour cell rendering (hatched / dashed / half-day bars); billing review and authorise flow and
pipeline stepper; invoice print document; PhoneFrame / MobileViewport hosts and the `--aa-inset-*` contract;
candidate-ranking pickers (domain ordering rules). Details in the inventories.

## Known risks at pick-up

- **Portals inside the scaled PhoneFrame:** library popovers/drawers/toasts portal to `body` by default and
  position with Floating UI; point them at the phone frame container. Base UI wants `isolation: isolate` on
  the app root.
- **Copy-in code has no upgrade path:** shadcn churns (styles, `cn` package, Vaul → Base UI Drawer, TanStack
  Table v8 → v9). Pin and record the snapshot used.
- **The "default shadcn look":** avoid it by mapping our tokens, not by adding effects.
- **Library health:** Vaul unmaintained; @use-gesture dormant; Tremor stale; cmdk slow; NumberFlow and
  dnd-kit/react still 0.x.
- **Scale:** Admin alone is 117 files / ~17.9k lines. Plan phases; the overlay seam is the highest-leverage
  first swap (~57 sheets at once).

## Open questions for pick-up

1. Confirm shadcn + Base UI vs Radix vs React Aria (React Aria if accessible date/time *entry* becomes
   central).
2. Do we know the real build's framework yet? If so, re-weight choices towards its equivalents.
3. Command palette and dark mode: in or out? (Both are new features, not unification.)
4. Migrate inline styles to Tailwind utilities wholesale, or only inside library components?
5. Does this become catch-up-style phases with phase docs and kick-off prompts?
6. Do the demo guide (`docs/demo-guide/`) beats change? Mirror any behaviour change there.

## Files in this folder

| File | What it holds |
|---|---|
| `README.md` | This page: goal, principles, provisional decisions, risks, open questions. |
| `index.html` | The visual report: recommended stack, every library rated, the full component-to-library map, missing pieces, a11y gains, migration order, sources. Open it in a browser. |
| `inventory-shared-shell.md` | Inventory of `src/shared`, `src/shell`, `src/theme`, `src/pwa`, `src/apps/demo`. |
| `inventory-admin.md` | Inventory of `src/apps/admin`: screens, components, tables, forms, gaps. |
| `inventory-web-mobile.md` | Inventory of `src/apps/web` and `src/apps/mobile`. |
| `research-foundations.md` | shadcn/ui, Base UI, Radix: versions, components, theming, agent tooling. |
| `research-specialists.md` | Sonner, Vaul, cmdk, NumberFlow, Emil Kowalski's skills (pick-ui-library), plus TanStack, forms, dates, Motion, dnd-kit and others. |
| `research-designed.md` | Beautiful UI, RareUI, Magic UI, Aceternity, 21st.dev, and business-block sources (Tremor, ReUI, Kibo, coss). |
| `source-video.md` | The video that prompted this: summary, transcript notes and its library links. |

**Live component catalogue (in the prototype):** `/demo/catalogue/admin`, `/demo/catalogue/web` and
`/demo/catalogue/mobile` (URL only, not in the app switcher; code in
`aa-prototype/src/apps/demo/catalogue/`). Every hand-built component, live and interactive, one per row
(name, source, what it does, replacement), grouped by replacement library: about 63 Admin, 53 Web and 54
Mobile rows. Most rows mount the real component; rows marked "Recreated" copy a component that is private to
its screen file. Some rows open real flows that change the demo data (each says so; Demo reset restores).
Built 11 Nov 2026, after the Phase 19b modifier rework (ModifierChips and AsaCard no longer exist).

## How to resume (suggested kick-off prompt)

> Read `docs/ui-library-research/README.md` and the files it lists. Re-verify the library versions and
> status (they were captured on 11 Nov 2026), re-run the inventories against the current code to find what
> changed since commit `48fa38d4`, then propose a phased migration plan that follows the README's guiding
> principles (unification, no new flourishes). Use the live catalogue (`/demo/catalogue/*`) to check each
> component's current look and behaviour. Ask me the open questions before writing phase docs.
