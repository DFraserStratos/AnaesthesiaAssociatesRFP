# ui-library-preview: running plan

Throwaway preview workspace: each catalogue row shows the **current live prototype component** (left)
beside its **proposed library replacement, also live** (right). Brief: `docs/ui-library-research/preview-build-prompt.md`
(same text as the kick-off). **Never modify `aa-prototype/`.** Do not commit.

## Phases

| Phase | What | Status |
|---|---|---|
| 0 | Scaffold, install pinned libs, spike (proto source under React 19), brand theme, two-column kit, row plumbing | DONE |
| 1 | DONE ( slices `admin/pilot-a`, `admin/pilot-b`, `mobile/pilot`) Pilot ~8 rows (Button, Badge status, ToggleGroup, Dialog, Drawer mobile, Combobox RVG, TanStack table, Calendar, Sonner). Screenshots. Options added per user. | DONE |
| 2 | Fan-out workflow: slices build + verify | DONE (10 slices, 161 rows; all verified) |
| 3 | DONE (design-review fixes applied) Verification: typecheck/build, Playwright 3840px screenshots + row-name parity, design review, `git status -- aa-prototype` clean | todo |
| 4 | Docs: preview README, research README update, root CLAUDE.md line | DONE |

## Architecture decisions (Phase 0)

- **D1 Workspace**: `ui-library-preview/` at repo root, Vite + React 19 + TS + Tailwind v4, port 5182. Root scripts
  `dev:preview` + added to `setup`.
- **D2 Proto source import**: Vite alias `@proto` → `../aa-prototype/src`. Bare imports from proto files
  (react, react-dom, react-router-dom, zustand, lucide-react, date-fns) are forced to the preview's own
  `node_modules` (`resolve.dedupe` + aliases) so there is exactly one React (19).
- **D3 Row plumbing = kit swap**: a small Vite plugin redirects every import of the proto
  `apps/demo/catalogue/CatalogueKit(.tsx)` *made from inside aa-prototype* to the preview's own kit
  (`src/kit/ProtoKitShim.tsx`), which exports the same names (`LIBRARY_GROUPS`, `CataloguePage`,
  `LibraryGroup`, `CatalogueRow`, `WebStage`, `MobileStage`, `StageHint`). The proto's own
  `AdminCatalogue`/`WebCatalogue`/`MobileCatalogue` render unchanged; our `CatalogueRow` puts its
  `children` (the real current example) in column 1 and looks up the replacement by `(app, name)` in the
  registry `src/rows/registry.ts` for column 2. The left stage uses the ORIGINAL `WebStage`/`MobileStage`
  (imported from the proto kit by the preview directly, which the plugin does not redirect).
- **D4 Typecheck**: TS never sees proto source. `@proto/*` is declared in `src/proto.d.ts` (loose types);
  only Vite resolves it. Preview `tsc` covers preview code only.
- **D5 Styling scope**: proto `global.css` is imported as-is (its own Tailwind root, `aa-*` classes, fonts,
  keyframes, its `@theme` with `--color-accent` etc.). The preview's Tailwind uses **`prefix(tw)`**
  (utilities `tw:bg-primary`, theme vars `--tw-*`) so it cannot collide with proto's `--color-*` vars, and
  shadcn components are generated with the `tw` prefix. shadcn's semantic vars (`--primary`, ...) and its base
  rules are defined only under **`.lib-scope`** (the replacement column, portal roots, mobile replacement stage).
- **D6 Portals**: a `PortalContainerContext` (`src/kit/portal.tsx`) supplies the container; every
  `components/ui` portal (Dialog, Sheet, Drawer, Popover, Select, Combobox, Tooltip, Menu, Toaster) reads it.
  Desktop default = a body-level `.lib-scope` portal root; mobile replacement stage provides its own div.
- **D7 Fonts / proto public assets**: preview `publicDir` serves proto's `public/` (fonts at `/fonts/...`) or copies them.
- **D8 Store**: proto store module creates its singleton with `freshAppState()`; replacement side never writes to it.
- **D9 Verdicts**: localStorage key `uilp:verdicts:v1`, `{[app]: {[rowName]: {verdict, note}}}`, try/catch on all access.

## Kit files (orchestrator-owned; slices must not edit)
- `src/theme.css`: brand layer (tokens → shadcn vars under `.lib-scope`, status tokens, radius/elevation, motion classes `aa-motion-fade`, `aa-motion-sheet`).
- `src/kit/Kit.tsx`: CataloguePage / LibraryGroup / CatalogueRow (5 columns), verdict control + summary + export.
- `src/kit/stages.tsx`: `WebReplacementStage`, `MobileReplacementStage` (portal container = the phone stage).
- `src/kit/verdicts.ts`: localStorage verdicts, export.
- `src/rows/registry.ts`: merges `src/rows/<app>/<slice>/index.ts` → `export const replacements: SliceReplacements` keyed by exact row name.
- `src/components/ui/*`: shadcn generated + brand edits.
- `rows.json` / `ROWS.md`: row inventory (names verbatim from the prototype catalogue).

## Slices (Phase 2)
| Slice folder | Title | Rows | Status |
|---|---|---|---|
| `src/rows/admin/a-controls/` | Admin · buttons, toggles, chips, pills and navigation | 16 | done |
| `src/rows/admin/a-overlays/` | Admin · sheets, drawers, pickers and callouts | 16 | done |
| `src/rows/admin/a-data/` | Admin · TanStack tables, forms and dates | 13 | done |
| `src/rows/admin/a-custom/` | Admin · motion and stays-custom | 10 | done |
| `src/rows/web/w-controls/` | Web · navigation, buttons, toggles, chips and progress | 21 | done |
| `src/rows/web/w-overlays/` | Web · dialogs, sheets, fields, capture cards, toast and forms | 15 | done |
| `src/rows/web/w-data/` | Web · tables, dates, chart, numbers, motion and stays-custom | 17 | done |
| `src/rows/mobile/m-sheets/` | Mobile · sheets, buttons, segmented, chips, switch and press | 14 | done |
| `src/rows/mobile/m-cards/` | Mobile · pills, avatar, cards, lists, toast and forms | 19 | done |
| `src/rows/mobile/m-motion/` | Mobile · dates, numbers, motion and stays-custom | 20 | done |
| `src/rows/admin/pilot-a/`, `admin/pilot-b/`, `mobile/pilot/` | Pilot (9 rows) | 9 | done, with options |

Row lists: `slices.json`.

## Open questions
- (none yet)

## Log
- 2026-11-11: plan written, Phase 0 started.
- 2026-11-11: Phase 0 foundations: exact-pinned deps (React 19.3.1, Vite 8.3.7, TW 4.3.5, TS 6.0.3, shadcn 4.23.0 base-nova, Base UI 1.9.0, TanStack Table 9.3.1 stable, recharts 3.8.0 per shadcn Chart); `shadcn add` of 47 ui files with prefix `tw` (works; `form` is empty for Base UI, no number-field/autocomplete).
- Plumbing per D2 to D7: force-deps resolve plugin (exports-aware, plus dedupe), kit-swap and virtual: stubs in vite.config.ts; preview Tailwind imports theme+utilities only (no second preflight); shadcn vars/base in styles/shadcn-base.css under .lib-scope; portals read usePortalContainer().
- Spike green: row counts match (admin 63, web 53, mobile 54), left column pixel-identical, no scoping leaks, fonts load; one React 19 issue: SlideStack `inert: ''` is now false (warning, parked layers not inert). tsc -b and build pass. Shots in shots/spike/.
- 2026-11-11: Phase 0 done. Spike: 63/53/54 rows match, left column pixel-identical, React 19 OK except SlideStack `inert: ''` (parked layers not inert under React 19; prototype needs `inert: true` at migration). Components branded (`/theme` sink). Builder brief in `BRIEF.md`.
- Branding deviations (followed the prototype): avatars crimson-tint / white-elevated (not solid crimson); line tabs ink underline; segmented `teal` variant = prototype default.
- Pilot: 9 rows built. Kit fixes after pilot: Badge status = flat tints (treatments on blocks only), fields 48px on bg with line border, FieldLabel = prototype eyebrow. Open: calendar today/selected crimson (kept, as the prototype), RVG dialog without corner X.
- User decisions (2026-11-11): calendar crimson today/selected KEPT. Open design tweaks (corner X etc.) must be shown as live OPTIONS in the replacement column (kit: `Replacement.options`, pills above the stage, chosen option exported). BRIEF.md has the rule. Pilot rows being updated with options before Phase 2.
- Phase 2 done: 170/170 rows registered (125 built, 16 partial, 29 stays custom; 90 with options). Phase 3: tsc + build pass; Playwright 63/53/54 rows, name parity exact with the original catalogue, overlays tagged / inside the phone stage; no console errors except the known `inert` warning.
- Design review: 18 row findings + 5 kit findings. Kit fixed by orchestrator (drawer easing/brightness, context-menu shadow, unused command.tsx removed, sheet right side now fades: no new slide motion, `.lib-scope` line-height 1.5, ButtonGroupText prefix). Kept on purpose: StatusChip hatched option (user wants to see options), MonthGrid teal-ring option (prototype's own), ink segmented variant (prototype's own). Row fixes delegated.
- Registry now loads each slice in isolation (a prototype API change broke ALL pages once: `routeLabel` removed by the concurrent Phase 20 session).
- 2026-11-12: Added ★ recommended option + why per option row (`src/rows/recommendations.ts`, 88 rows) and a 1 to 5 "shadcn fit" rating per row (`src/rows/fit/*.ts`, scale in `fit/index.ts`, kit drift per component in `fit/KIT.md`), with a page-average in the header and an end-of-page scorecard per app. Export includes both. Synced `rows.json` with the Phase 20a catalogue: attachments rows retired (web x2, mobile x1), ProcedureStack added in all three apps (registered as stays custom, not rebuilt). w-overlays sample attachments copied locally (prototype file removed in 20a).
- Fit results: admin 2.8, web 2.7, mobile 2.6 (all 2.7); no row scores 5; shadcn 3.0, TanStack 3.4, forms 3.2, day-picker 2.6, Motion/NumberFlow/custom ~1.3 to 1.5.
