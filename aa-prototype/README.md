# AA Booking & Billing — prototype

A demo prototype of the Booking & Billing system described in the Anaesthesia Associates (AA) RFP
(Peritia Ltd, July 2026). AA is a Christchurch, NZ company that handles booking and billing for about
85 independent anaesthetists.

This is a fully interactive, true-to-life React front end over a **fake in-browser backend** — no real
servers, APIs, or data. It exists to demonstrate every major feature of the RFP's candidate
architecture during vendor presentation workshops. **It is a prototype, not production software:** all
data is fictional and every external system (Xero, HL7/FHIR, PDF/OCR, email, payments) is simulated.

It presents three apps behind one app-switcher — **Anaesthetist Mobile App**, **Anaesthetist Web
App**, **Admin Web App** — plus demo-only simulators (Xero, HL7/FHIR integrations, and a demo control
panel), each carrying a "demo simulation" badge.

## Run it

```bash
npm install       # first time
npm run dev       # start the dev server (http://localhost:5173)
npm run build     # type-check and production build (tsc -b && vite build)
npm run test      # unit + component tests (Vitest)
npm run shots     # Playwright specs / screenshots (visual aid, boots the dev server)
npm run lint      # oxlint
npm run preview   # preview the production build
```

Requires Node 20. Once running, use the app-switcher (top right) to move between the three apps and
the demo surfaces. The demo control panel (`Demo: Control Panel`) is the presenter's cockpit: reset,
advance the clock, jump to a scenario (S1 to S5), and fire simulated integration and money events.

## Stack

- **React 18.3** + **TypeScript 6** (strict, `noUncheckedIndexedAccess`, no `any`)
- **Vite 8** (`@vitejs/plugin-react`)
- **Zustand 5** — the single store over the fake backend
- **React Router 6**
- **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-first `@theme`) over a TS design-token layer
- **date-fns 4** for dates, **lucide-react** for icons
- **Vitest 4** (+ Testing Library, jsdom) for tests; **Playwright** as a visual-testing aid
- **oxlint** for linting

## Folder map (`src/`)

- **`domain/`** — pure, no React: `types.ts`, the deterministic `seed/`, billing maths (`billing/`),
  the advanceable `clock.ts`, NHI/NZHIS validators, and the integration message/PDF fixtures
  (`integrations/`). Fully unit-tested.
- **`store/`** — the one Zustand store: the audit-writing `mutate()` wrapper, lifecycle guards,
  patient intake, master-data invariants, the billing run, Xero/payment/payables/archive actions, the
  integration processor, and the live demo clock. Components read and write only through here.
- **`apps/mobile/`**, **`apps/web/`**, **`apps/admin/`** — the three user-facing apps.
- **`apps/demo/`** — demo-only surfaces: the control panel, the Xero + billing-monitor simulator, the
  integration simulator, and the seed-data inspector.
- **`shared/`** — cross-app components (the capture suite, `card/CardDetailBody`, schedule rows,
  flows, status chips, `format.ts` for NZ number/currency/date output).
- **`shell/`** — the app switcher, harness bar, phone frame, and app registry.
- **`theme/`** — the design tokens (`tokens.ts`, `statusColours.ts`, `motion.ts`) transcribed from the
  design mockups, mirrored into `global.css`'s `@theme`.
- **`assets/`**, **`test/`**, `App.tsx`, `main.tsx`, `router.tsx`.

## Docs

The build plan and requirements live in **[`../docs/prototype-build/`](../docs/prototype-build/)**:

- `PROGRESS.md` — the living record: binding conventions, phase status, decisions log, per-phase
  entries. Read it first.
- `REQUIREMENTS.md` — the numbered requirements catalogue.
- `ROADMAP.md` — the 14-phase sequence and milestone demos.

To learn, present or reason about the prototype, the hub is
**[`../docs/demo-guide/`](../docs/demo-guide/)** — start with `master-demo-guide.html` (a single
self-contained page) or the S1 to S5 run-sheet in `03-demo-script.md`.

The RFP itself and our reading of the data model live in
[`../docs/rfp-reference/`](../docs/rfp-reference/).
