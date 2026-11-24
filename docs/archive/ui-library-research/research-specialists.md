# Research: specialist libraries and Emil Kowalski's skills

Captured 11 Nov 2026 via `npm view`, the GitHub API and the libraries' docs. **Re-verify before acting.**

## Headlines

1. **Vaul is officially unmaintained.** README: "This repo is unmaintained. I might come back to it at some
   point, but not in the near future." (committed 3 Oct 2025). Last release v1.1.2, Dec 2024; 162 open issues.
2. shadcn's default base became Base UI (2 Jul 2026), React Aria added (17 Jul 2026). In those bases `Drawer`
   is built on **Base UI Drawer** (`@base-ui/react/drawer`, since Base UI 1.2.0, Feb 2026). Only the Radix
   base still uses Vaul (shadcn issue #8455 "switch drawer to maintained dependency").
3. Emil's `pick-ui-library` skill does not list Vaul; his `gestures` skill still says "default to Vaul".
4. Sonner, cmdk and NumberFlow are maintained and support React 18 and 19. cmdk is slow but stable.

## Sonner (toasts)

MIT, Emil Kowalski, **v2.0.8** (9 Aug 2026), 13.2k stars. Peer React `^18 || ^19`, no other deps.
- API: mount `<Toaster />` once; `toast()`, `.success/.error/.warning/.info/.loading`,
  `toast.promise(p, {loading, success, error})`, `toast.custom(jsx)`, `toast.dismiss(id)`; `action`, `cancel`,
  `description`, `duration`.
- Toaster props: `position` (bottom-right), `richColors`, `expand`, `visibleToasts` (3), `closeButton`,
  `offset` (32px), `mobileOffset` (16px under 600px), `swipeDirections`, `theme`, `dir`, `hotkey` (alt+T),
  `invert`, `gap`, `icons`, `toastOptions` (`unstyled`, `classNames`), `id` for multiple toasters.
- shadcn: thin themed wrapper in all three bases (lucide icons; reads theme from `next-themes`, swap for our
  own in Vite). shadcn also has a Base UI-native Toast (Jul 2026).
- A11y: `<section aria-live="polite" aria-relevant="additions text" aria-label="Notifications alt+T">`;
  swipe-dismiss; configurable close label. Use for confirmations only; blocking errors stay inline. Emil's
  `ask-sonner` skill covers pitfalls (toasts behind modals, Tailwind classes ignored, double toasters).

Sources: https://sonner.emilkowal.ski · https://sonner.emilkowal.ski/toaster · https://github.com/emilkowalski/sonner

## Vaul (drawer)

MIT, Emil Kowalski, **v1.1.2** (Dec 2024), built on `@radix-ui/react-dialog`. **Unmaintained.** React 18/19.
- API: `Drawer.Root/Trigger/Portal/Overlay/Content/Handle/Title/Description/Close`, `NestedRoot`; props
  `open/onOpenChange`, `modal`, `direction`, `dismissible`, `handleOnly`, `repositionInputs`, `snapPoints` /
  `activeSnapPoint` / `fadeFromIndex` / `snapToSequentialPoint`, `shouldScaleBackground`, `noBodyStyles`,
  `container`. iOS curve `cubic-bezier(0.32,0.72,0,1)` 500ms; `data-vaul-no-drag`.
- Known issues: focus trapped in always-open drawer even with `modal={false}`; iOS keyboard/input bugs;
  clashes with Base UI floating elements.
- **Use Base UI Drawer instead** (`@base-ui/react` 1.9.0): swipe-dismiss any direction, `Drawer.SwipeArea`,
  snap points, nested drawers, indent/scale background, `VirtualKeyboardProvider`, `createHandle`, modal by
  default (trap, scroll lock, `initialFocus`, `finalFocus`).

Sources: https://vaul.emilkowal.ski · https://github.com/emilkowalski/vaul ·
https://base-ui.com/react/components/drawer · https://github.com/shadcn-ui/ui/issues/8455

## cmdk (command menu)

MIT, Paco Coursey (now `dip/cmdk`), **v1.1.1**, last push Oct 2025, 13.1k stars, 80 open issues. Peer React
`^18 || ^19`.
- API: `<Command value onValueChange filter shouldFilter loop>` with `Command.Input`, `.List`, `.Group
  heading`, `.Item value keywords onSelect`, `.Empty`, `.Loading`, `.Separator`; `Command.Dialog`;
  `useCommandState`. Auto filter/sort; wire ⌘K yourself.
- shadcn: `command.tsx` uses cmdk in Radix and Base UI bases (React Aria in the Aria base). shadcn **Combobox**
  is Base UI Combobox, the better fit for form-field type-aheads.
- Caveats: no virtualisation (fine to about 2,000 to 3,000 items; beyond that `shouldFilter={false}` + own
  filtering and virtualisation); unique `value`s; "maybe" concurrent-mode safe. VoiceOver-tested.
- For the RVG code list: Base UI Combobox, or cmdk with `shouldFilter={false}` and a ranked filter (code
  prefix, then description).

Sources: https://cmdk.paco.me · https://github.com/pacocoursey/cmdk

## NumberFlow (animated numbers)

MIT, Max Barvian, `@number-flow/react` **v0.6.2** (18 Jul 2026), still 0.x, maintained. Peer React 18/19.
Dependency-free custom element styled via `::part`.
- API: `<NumberFlow value locales="en-NZ" format={{style:'currency',currency:'NZD'}} prefix suffix trend
  animated respectMotionPreference willChange transformTiming spinTiming opacityTiming isolate
  plugins={[continuous]} />`; `<NumberFlowGroup>`; `useCanAnimate()`.
- Not in shadcn; drop in alongside, use `tabular-nums`.
- Respects reduced motion by default. Screen-reader behaviour undocumented (test). No scientific notation,
  non-Latin digits or RTL.
- **Fit:** only figures that already animate (the booking fee/units tween). Emil's `remove-animations` warns
  against motion on functional data.

Sources: https://number-flow.barvian.me · https://github.com/barvian/number-flow

## Emil Kowalski's skills repo

https://github.com/emilkowalski/skills: MIT, 55.8k stars, last push 9 Nov 2026.
Install: `npx skills@latest add emilkowalski/skills` (all), or
`npx skills add emilkowalski/skills --skill pick-ui-library -a claude-code` (one, Claude Code only); per
project by default, `-g` global; or copy `skills/<name>/` into `.claude/skills/`. Read a skill's files before
installing.

### pick-ui-library (invoked by name only: `disable-model-invocation: true`)

Rules: identify the task, not the library named; check `package.json` first and flag (don't churn) an
existing competitor; recommend one library; say when a task is outside the list.

| Task | Library |
|---|---|
| Unstyled accessible primitives (dialogs, popovers, menus, selects) | base-ui |
| Command menus (⌘K) | cmdk |
| Toasts | Sonner |
| OTP inputs | input-otp |
| Control panels / GUIs | Leva (dialkit alternative) |
| General animation (springs, layout, enter/exit) | motion |
| Animating numbers | NumberFlow |
| Animated text | torph |
| 3D globes | Cobe |
| Dynamic OG images | Satori |
| Syntax highlighting | shiki |
| Real-time charts | Liveline |
| General charts | recharts |
| Drag and drop | dnd kit |
| Virtualisation | react-virtuoso (not TanStack Virtual) |
| State | zustand |
| Conditional classNames | clsx |
| Tailwind variants | cva |
| Theme switching | next-themes |

Motion only for springs, layout, exit or gesture values; plain CSS for a hover or fade. Mismatches it catches:
hand-built toasts → Sonner; div dropdown/dialog with manual focus → base-ui; number animated by re-rendering
text → NumberFlow; 1,000+ rows rendered directly → Virtuoso; prop-drilled shared state → zustand; nested
className ternaries → clsx/cva. **Not covered:** drawers, tables, forms, date pickers, positioning, gestures.

### Other skills in the repo
emil-design-eng (philosophy), animate, animate-expo, review-animations, improve-animations,
find-animation-opportunities, **remove-animations** (strips needless motion on keyboard actions,
high-frequency surfaces and functional data), choreograph, animation-performance, animation-vocabulary,
apple-design, **gestures** (1:1 drag, velocity release; says default to Vaul), **mobile-native** (PWA feel:
sticky hover, tap highlight, dvh, input zoom, overscroll, safe areas, touch-action), **break-ui** (worst-case
data stress test), prototype, **ask-sonner**, write-swift. Most relevant here: gestures, mobile-native,
ask-sonner, break-ui, remove-animations, pick-ui-library.

## Other libraries we will likely need

| Library | Version / licence | Status | Notes |
|---|---|---|---|
| TanStack Table | 9.3.1, MIT | v9 stable 4 Aug 2026 | Rewrite on TanStack Store; required `tableFeatures({})`; v8 tutorials need adapting |
| TanStack Virtual | 3.14.26, MIT | Active | Pairs with TanStack Table and a custom grid |
| react-virtuoso | 4.18.21, MIT | Active | Emil's pick; higher level. Pick one of the two. |
| react-day-picker | 10.0.2, MIT | v10 8 May 2026 | shadcn Calendar; `@daypicker/react` preferred name |
| React Aria DatePicker / DateRangePicker | Apache-2.0 | Active | Best for keyboard-editable date and time *fields*; neither Base UI nor Radix has a date picker |
| React Hook Form + Zod | RHF 7.91.0, Zod 4.6.7, resolvers 7.0.5, MIT | Active | shadcn Field uses RHF |
| Motion | 14.12.0, MIT | Very active | `motion/react`; AnimatePresence, layout, drag with velocity |
| dnd-kit | core 6.3.1 / sortable 10.0.0 (frozen); `@dnd-kit/react` 0.5.3 | Repo active | New packages still 0.x; keyboard sensors and announcements |
| Floating UI | 0.27.20, MIT | Active, 0.x | Used inside Base UI and Radix; rarely needed directly |
| react-aria-components | 1.22.1, Apache-2.0 | Very active | Strongest a11y/i18n (date, number, ComboBox, Table, GridList); a shadcn base |
| Recharts | 3.10.1, MIT | Active | shadcn Chart |
| input-otp | 1.5.0, MIT | Maintained | Only if 2FA / verification codes |
| @use-gesture/react | 10.3.1, MIT | **Dormant** (Mar 2024) | Avoid; use Motion drag or Base UI Drawer swipe |
| web-haptics | 0.0.6, MIT | Early | iOS Safari has no Vibration API: always pair with a visual cue |
| clsx + cva | MIT | Stable | Already inside shadcn's `cn()` |

Sources: https://tanstack.com/blog/announcing-tanstack-table-v9 · https://tanstack.com/virtual ·
https://daypicker.dev · https://react-hook-form.com · https://zod.dev · https://motion.dev ·
https://dndkit.com · https://floating-ui.com · https://react-spectrum.adobe.com/react-aria/ ·
https://recharts.org · https://input-otp.rodz.dev · https://github.com/pmndrs/use-gesture ·
https://virtuoso.dev · https://github.com/lochie/web-haptics
