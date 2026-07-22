# Phase 00 — Scaffold & three-app shell

**Requirements covered:** P1, P2, P3, P4, P7 (stub), N1, N2 (tokens)
**Depends on:** nothing — start here.
**Estimated:** 1 session.

## Goal

A running Vite + React + TypeScript app with the demo harness in place: the persistent app-switcher
dropdown, three empty-but-navigable app shells, the phone frame for the mobile app, the design-token
layer, and the demo control panel stub. No domain logic — that's Phase 01.

## Work items

1. **Scaffold** `aa-prototype/` with Vite (react-ts template). Add: React Router, Zustand, Tailwind CSS, lucide-react, date-fns, Vitest. TypeScript `strict: true`. Scripts: `dev`, `build`, `test` (vitest run), `preview`.
2. **Folder shape** per PROGRESS convention 3 (`src/domain`, `src/store`, `src/apps/{mobile,web,admin,demo}`, `src/shared`, `src/shell`, `src/theme`) — create with placeholder index files so later phases land in the right homes.
3. **Design tokens** (`src/theme/`): transcribe **`Design/Design Language.dc.html`** (repo root) verbatim — it is the token source of truth (PROGRESS convention 17). Concretely: the 8 neutrals (ink #172320 → surface #FFFFFF), brand crimson #A91E3E/-deep/-tint (identity only — masthead, active nav, avatars; never buttons, never status), accent teal #0D6E63/hover/pressed/tint + the rgba(13,110,99,0.30) focus ring, semantic success/warning/error with tints, the type scale (Schibsted Grotesk UI, Spline Sans Mono data with `tabular-nums`; display 32/38 → micro 11/14), 4pt spacing, radii (ctl 10, card 14, panel 20, sheet 24 top-only, pill 999), elevations e-0…e-3, scrim, and the four motion patterns as named constants (sheet-in 320/260ms cubic-bezier(0.32,0.72,0,1); card-advance 260/240ms cubic-bezier(0.2,0.8,0.2,1), −24% parallax + 8% dim; complete-tick draw 360ms/delay 60ms/pulse 420ms; value-tick 160ms/step + 240ms tint decay; reduced-motion → 80ms fades). `statusColours.ts` maps the six statuses with the design's solid/tint/on-tint triples — Private #2E66E5/#E8EEFC/#1F44A3, Public #6E56CF/#EEEBFA/#4C3D96, Pre-op #C26A0E/#FBEFDF/#8A4B09, Holiday #D25C74/#FAE9ED/#A03A52, Unavailable #64716C/#ECEFEE/#4A5551 (+ hatched fill treatment), Free #1FA463/#E3F6EC/#157A49 (+ dashed-border treatment). Load Schibsted Grotesk + Spline Sans Mono from Google Fonts. Export `<StatusChip>` (dot + label pill) and `<StatusLegend>` in `src/shared/`, matching the design's chip anatomy.
4. **App shell** (`src/shell/`):
   - Top bar present in all modes: product name ("AA Booking & Billing — Prototype"), current persona display, and the **app switcher dropdown** in the top-right corner with entries: *Anaesthetist Mobile App*, *Anaesthetist Web App*, *Admin Web App*, divider, *Demo: Billing Monitor & Xero*, *Demo: Integrations*, *Demo: Control Panel*.
   - Switching sets the route (`/mobile`, `/web`, `/admin`, `/demo/...`) and the active persona (Dr demo-anaesthetist for mobile/web; Office Admin for admin). Persona is store state (a tiny shell-store slice is fine this phase).
   - Selection persists in `localStorage` (survives refresh).
5. **Phone frame** (`src/shell/PhoneFrame.tsx`): adapt **`Design/ios-frame.jsx`** (the `IOSDevice` component — bezel, status bar, home indicator, dependency-free) into typed React rather than building from scratch. 390×844 logical px content area, floating centred on a full-viewport `#E4E8E6` grey backdrop (the design's backdrop). Status-bar time shows the demo clock. The mobile app renders inside via a scrollable content region. Must look right on a 1440p+ demo screen without browser tricks.
6. **App shells**: each of the three apps gets its own router outlet, nav skeleton and a placeholder home screen, with nav chrome matching the design pages — mobile: bottom tab bar (Lists · Availability · Balances · More) per `Mobile App.dc.html`; web: white top nav with serif crimson wordmark, crimson-underline active item (Dashboard · Lists · Availability · Accounts) per `Web Dashboard.dc.html`; admin: dark ink (#172320) side nav with crimson active marker and count-badge pattern (Day view · Review queue · Billing monitor · Master data · Audit) per `Admin Day.dc.html`. Placeholders clearly say which phase fills them.
7. **Demo control panel stub** (`/demo/control`): panel chrome with the "demo simulation" badge, listing the controls coming later (reset, clock, events) as disabled placeholders. Include the pinned demo date display (`DEMO_TODAY = 2026-07-21`, matching the design mockups' content date) read from a constants module.
8. **Docs on rails**: verify PROGRESS.md status table matches reality; add the Phase 00 entry.

## Out of scope

Domain types, seed data, any real screen content, tests beyond a smoke test (one Vitest test asserting the theme/status map has all six statuses — proves the test rig runs).

## Manual test checklist

- [ ] `npm run dev` serves; `npm run build` and `npm run test` pass clean.
- [ ] The switcher swaps between all three apps + demo surfaces; the persona label changes accordingly; a refresh returns to the same app.
- [ ] Mobile mode: phone frame floats centred on a grey backdrop at desktop resolution; content scrolls inside the frame; web/admin modes render full-width.
- [ ] Status legend renders all six statuses with the exact Design Language hexes (spot-check Private #2E66E5 and Free #1FA463), including the hatched Unavailable and dashed Free treatments.
- [ ] Side-by-side eyeball against `Design/Design Language.dc.html` in a browser: fonts, chip anatomy and neutrals match.
- [ ] No console errors or TypeScript errors.

## PROGRESS.md updates

Status row → DONE with date; Phase 00 entry using the template; record any stack/token decisions in the Decisions log.
