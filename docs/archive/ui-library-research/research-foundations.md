# Research: foundation libraries (shadcn/ui, Base UI, Radix)

Captured 11 Nov 2026 from npm, GitHub and the libraries' docs and changelogs. Items marked *(unconfirmed)*
were not verified directly. **Re-verify before acting.**

## Base UI

| | |
|---|---|
| What | Unstyled, accessible React primitives, no bundled CSS, WAI-ARIA patterns |
| Maintainer | "From the creators of Radix, Material UI and Floating UI" (Colm Tuite, who started Radix, plus MUI people) |
| Licence / version | MIT · `@base-ui/react` **1.9.0** (9 Oct 2026). 1.0 stable 11 Dec 2025 (35 components); roughly monthly minors. Drawer stable in 1.3 (Mar 2026), OTP Field in 1.6 (Jun 2026). The old `@base-ui-components/react` name stopped at an RC. |
| Distribution | One tree-shakable npm package |
| React | Peer `^17 \|\| ^18 \|\| ^19`; also peers `date-fns ^4` and `@date-fns/tz` |
| Setup notes | Any styling approach; state via data attributes; Vite fine. Put `isolation: isolate` on the app root for portalled popups. On iOS 26+ Safari, backdrops want `position:absolute` and `body` `position:relative`. Handbook publishes `llms.txt`. |

**Components (37):** Accordion, Alert Dialog, Autocomplete, Avatar, Button, Checkbox, Checkbox Group,
Collapsible, Combobox, Context Menu, Dialog, Drawer (swipe, snap points, virtual keyboard), Field, Fieldset,
Form, Input, Menu, Menubar, Meter, Navigation Menu, Number Field, OTP Field, Popover, Preview Card (hover
card), Progress, Radio Group, Scroll Area, Select, Separator, Slider, Switch, Tabs, Toast, Toggle, Toggle
Group, Toolbar, Tooltip. Utilities: CSPProvider, DirectionProvider, mergeProps, useRender.
**Not included:** Calendar / DatePicker, Table, Command, Chart, Resizable, Sidebar, Skeleton (shadcn fills
these).

Sources: https://base-ui.com/react/overview/releases · https://base-ui.com/react/overview/quick-start ·
https://base-ui.com/react/overview/about

## Radix

**Primitives:** MIT, maintained by WorkOS (many original maintainers left; Colm Tuite now leads Base UI).
`radix-ui` **1.8.1** (12 Oct 2026), the unified package (since Jan 2025; per-primitive imports such as
`radix-ui/accordion` since Jul 2026); `@radix-ui/react-*` packages still ship. React 16.8 to 19. Very mature;
releases slowed Aug 2025 to Jun 2026 then picked up. No deprecation notice.
Primitives: Accordion, Alert Dialog, Aspect Ratio, Avatar, Checkbox, Collapsible, Context Menu, Dialog,
Dropdown Menu, Form (preview), Hover Card, Label, Menubar, Navigation Menu, OTP Field (unstable), Password
Toggle Field (unstable), Popover, Progress, Radio Group, Scroll Area, Select, Separator, Slider, Switch, Tabs,
Toast, Toggle, Toggle Group, Toolbar, Tooltip; utilities Accessible Icon, Direction Provider, Portal, Slot,
Visually Hidden *(list partly from memory)*. **No Combobox, Drawer or Number Field.**

**Themes:** `@radix-ui/themes` 3.3.0 (31 Jan 2026), styled with its own CSS and `<Theme>` config. Poor fit:
own visual language, not Tailwind-native, sparse releases, no shadcn tooling.

Sources: https://www.radix-ui.com/primitives/docs/overview/releases ·
https://www.radix-ui.com/themes/docs/overview/releases ·
https://dev.to/mashuktamim/is-your-shadcn-ui-project-at-risk-a-deep-dive-into-radixs-future-45ei

## shadcn/ui

| | |
|---|---|
| What | Component **source code** copied into the repo (`components/ui/*.tsx`), Tailwind-styled, on a headless base. Not an upgradable dependency. |
| Maintainer / licence | shadcn (Vercel) · MIT |
| Version | `shadcn` CLI **4.23.0** (27 Oct 2026); CLI v4 Mar 2026 |
| CLI | `init` / `add` / `diff` / `info` / `search` / `view` / `build` / `apply` / `preset` / `eject`. Small runtime `shadcn/tailwind.css` (removable via `shadcn eject`, May 2026) and a `cn` package (Sep 2026; `shadcn migrate cn`). |
| Bases | **Base UI default since Jul 2026**; Radix fully supported (`init -b radix`, "not being deprecated"); **React Aria** a third base since Jul 2026 (`--base aria`). Fixed per project in `components.json`. |
| Styles | Eight: Vega, Nova, Maia, Lyra, Mira, Luma, Rhea, Sera (e.g. `"style": "base-nova"`). Presets bundle colours, radius, font, icons. |
| Tailwind v4 | Supported since Feb 2025. Tokens as CSS variables in `:root` / `.dark` (OKLCH) via `@theme inline`; `tw-animate-css`; every part has `data-slot`. |
| React | New components drop `forwardRef` and use `React.ComponentProps`; React 19 is the target. |
| Vite | `tailwindcss` + `@tailwindcss/vite`, `@import "tailwindcss"`, `@/*` alias in both tsconfigs and `vite.config.ts`, then `shadcn init`. |

**Components (66):** Accordion, Alert, Alert Dialog, Aspect Ratio, Attachment, Avatar, Badge, Breadcrumb,
Bubble, Button, Button Group, Calendar, Card, Carousel, Chart, Checkbox, Code Block, Collapsible, Combobox,
Command, Context Menu, Data Table, Date Picker, Dialog, Direction, Drawer, Dropdown Menu, Empty, Field, Hover
Card, Input, Input Group, Input OTP, Item, Kbd, Label, Marker, Menubar, Message, Message Scroller, Native
Select, Navigation Menu, Pagination, Popover, Progress, Questionnaire, Radio Group, Resizable, Scroll Area,
Select, Separator, Sheet, Sidebar, Skeleton, Slider, Spinner, Switch, Table, Tabs, Textarea, Toast, Toggle,
Toggle Group, Tooltip, Trace, Typography.

Notes that matter here:
- **Sheet** = side panel; **Drawer** = bottom sheet. On the Base UI base, Drawer uses Base UI Drawer (not
  Vaul). Docs pattern: Dialog on desktop, Drawer on mobile.
- **Command** uses cmdk. **Combobox** uses Base UI Combobox.
- **Calendar / Date Picker** use React DayPicker (v10.0.2); `mode="range"`, `timeZone`.
- **Data Table** is a guide, not a component: Table + **TanStack Table v9** (`tableFeatures()`); sorting,
  filtering, pagination, selection, visibility. No virtualisation (add TanStack Virtual).
- **Field** pairs with react-hook-form or TanStack Form + Zod.
- **Toast** (Jul 2026) on Base UI Toast; Sonner still offered *(deprecation unconfirmed)*.
- **Sidebar**: icon collapse, mobile Sheet, `cmd/ctrl+b`, `--sidebar-*` tokens.
- **Resizable** (historically react-resizable-panels) and **Chart** (historically Recharts, `--chart-1..5`)
  *(backing libraries unconfirmed)*.
- No scheduling grid in any of the three libraries.

### Theming to our brand
- Tokens: `--background/--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`,
  `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-1..5`, `--sidebar-*`, `--radius`
  (drives `radius-sm` to `radius-4xl`). Add our own under `:root` and expose via `@theme inline`.
- `--primary` and `--ring` = teal `#0D6E63`. Crimson only in identity tokens (`--sidebar-primary` for active
  nav). shadcn's `--accent` is a hover background, not a brand accent.
- Add six `--status-*` tokens (with tint and on-tint) and Badge variants.
- `--font-sans: "Schibsted Grotesk"`, `--font-mono: "Spline Sans Mono"`; `--spacing: 0.25rem` (4pt, the
  default); `--radius` from our tokens.
- Avoid the default look by choosing a style and preset deliberately, editing source freely, tabular-nums and
  mono in data cells, denser rows, our motion patterns, deleting disallowed variants, and publishing a
  private registry (`registry:style` / `registry:theme`, `@aa/...` namespace).

Sources: https://ui.shadcn.com/docs/theming · https://ui.shadcn.com/docs/tailwind-v4

### Agent tooling
- MCP: `pnpm dlx shadcn@latest mcp init --client claude` or `.mcp.json` with `npx shadcn@latest mcp`; browses,
  searches and installs from shadcn, third-party and private registries (namespaced in `components.json`,
  auth headers from env).
- Skill: `pnpm dlx skills add shadcn/ui`; runs `shadcn info --json`; enforces FieldGroup, ToggleGroup,
  semantic colours.
- A Radix → Base UI migration skill commits per component (conflicts with this repo's no-commit rule).
- Private GitHub registries (Aug 2026), Registry Directory, `shadcn build`.

Sources: https://ui.shadcn.com/docs/mcp · /docs/skills · /docs/registry · /docs/changelog ·
/docs/changelog/2026-07-base-ui-default · /docs/changelog/2026-07-react-aria · /docs/changelog/2026-05-shadcn-eject
· /docs/changelog/2026-07-toast · /docs/components/base/data-table · /docs/components/base/drawer ·
/docs/installation/vite · /docs/react-19

## How they relate

Radix was shadcn's original base (maintained, slower). Base UI is effectively its successor (Radix's creator +
MUI team), 1.0 in Dec 2025, adding Combobox, Autocomplete, Drawer, Number Field, Field/Form. shadcn offers
each component on Base UI (default), Radix or React Aria with near-identical APIs and class names. Radix
Themes is a separate styled product.

## Risks

1. **React 18:** shadcn components pass `ref` as a prop; on 18 refs are not forwarded through function
   components (our analysis). Upgrade to React 19 first.
2. Copy-in code has no upgrade path; churn is high. Pin a snapshot.
3. Docs drift between bases; community blocks still lean Radix.
4. We build ourselves: scheduling grids, virtualised tables, complex date-time entry (React Aria strongest
   there).
5. Agent defaults produce the "shadcn look": mitigate with our preset/registry and CLAUDE.md rules.
6. Small runtime deps (`shadcn/tailwind.css`, `cn`); Base UI peers on date-fns.
7. Radix Themes slowing.

## Recommendation

**shadcn/ui on Base UI, Tailwind v4, React 19**, brand published as a private `@aa` registry. Most
recognisable to developers; Base UI is the active default and covers Combobox, Drawer, Number Field,
Field/Form and Toast. Radix is the safe fallback. Not Radix Themes (fights the brand); not raw Base UI alone
(we would rebuild shadcn's wrappers plus Calendar, Command, Data Table, Sidebar, Chart). Prototype React Aria
DatePicker/TimeField only if clinical date-time entry becomes central.
