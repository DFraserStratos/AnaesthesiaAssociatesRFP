# AA Booking & Billing — prototype

A demo prototype of the Booking & Billing system described in the Anaesthesia Associates (AA) RFP
(Peritia Ltd, July 2026). AA is a Christchurch, NZ company that handles booking and billing for about
85 independent anaesthetists.

This is a fully interactive, true-to-life React front end over a **mock in-browser backend** — no real
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

The second build target — the Anaesthetist Mobile App on its own, as an installable PWA — has its
own three scripts plus the icon generator. See [the PWA section](#second-build-target--the-installable-pwa).

```bash
npm run dev:pwa      # PWA dev server (http://localhost:5174)
npm run build:pwa    # type-check and production build into dist-pwa/
npm run preview:pwa  # preview that build (also 5174)
npm run icons        # re-rasterise the app icons into public/ (run by hand, output committed)
```

Requires **Node 20.19 or newer** — `engines` in `package.json` carries the exact range,
`^20.19.0 || ^22.13.0 || >=24.0.0`: Vite 8 and oxlint set the 20.19 floor, and jsdom rules out 22.12
and the odd-numbered majors.

Once running, use the app-switcher (top right) to move between the three apps and the demo surfaces.
The demo control panel (`Demo: Control Panel`) is the presenter's cockpit: reset, advance the clock,
jump to a scenario (S1 to S5), and fire simulated integration and money events.

## Stack

- **React 18.3** + **TypeScript 6** (strict, `noUncheckedIndexedAccess`, no `any`)
- **Vite 8** (`@vitejs/plugin-react`)
- **Zustand 5** — the single store over the mock backend
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
- **`apps/mobile/`**, **`apps/web/`**, **`apps/admin/`** — the three user-facing apps. Each has the same
  three top-level files: `<App>.tsx` is the app's **layout** route (nav, persona actor, shared
  derivations, transient overlays) and hands them down through `<Outlet context>`; `outlet.ts` types
  that context; `routes.tsx` holds one thin wrapper per screen, mapping URL params to props and the
  screens' `onBack` / `onOpen…` callbacks to `navigate()`. Screens themselves know nothing about
  routing. Mobile adds `navigation.ts` (the Lists slide-stack depth derived from the URL).
- **`apps/demo/`** — demo-only surfaces: the control panel, the Xero + billing-monitor simulator, the
  integration simulator, and the seed-data inspector.
- **`shared/`** — cross-app components (the capture suite, `card/CardDetailBody`, schedule rows,
  flows, status chips, `format.ts` for NZ number/currency/date output).
- **`shell/`** — the app switcher, harness bar, phone frame, app registry, and the routing guards
  (`RequireEntity.tsx` for stale entity ids, `routeParams.ts` for untrusted date params).
- **`theme/`** — the design tokens (`tokens.ts`, `statusColours.ts`, `motion.ts`) transcribed from the
  design mockups, mirrored into `global.css`'s `@theme`.
- **`pwa/`** — the eight modules that exist only for the second build target: the `MobileViewport`
  host, the update pill and its registration handle, the More-tab presenter panel, the install coach
  and the entry-time `beforeinstallprompt` capture it replays, the office simulation and boot metrics
  — plus their tests, one of which (`pwaPurity.test.ts`) is
  what keeps the target's bundle honest. Nothing here reaches the prototype bundle. See
  [the PWA section](#second-build-target--the-installable-pwa).
- **`assets/`**, **`test/`**, `App.tsx`, `main.tsx`, `router.tsx` — `router.tsx` is the whole URL map:
  every screen in the three apps has a shareable address that survives a refresh.

## Second build target — the installable PWA

The Anaesthetist Mobile App also builds on its own as an installable PWA: full screen on a real
handset, no simulated phone frame, no app-switcher, no harness bar, its own home-screen icon, and it
runs with no connection. It is a **second Vite config over the same `src/`, not a fork**.
`vite.pwa.config.ts` differs from `vite.config.ts` in three things only — its `root` (`pwa/`), its
entry (`pwa/main.tsx`), and the `vite-plugin-pwa` plugin. `root: 'pwa'` brings four gotchas: the
`publicDir` and `cacheDir` redirects back out of the root, the `emptyOutDir` that is mandatory for an
`outDir` outside it, and the `server.fs.allow` that deliberately needs no change. Each is commented
where it sits in that file.

Of the 162 modules `pwa/main.tsx` pulls in, **139 are shared** with the prototype — the whole store,
the whole domain, the BTM capture suite, `CardDetailBody`, the sheets, the theme — **14 are the
mobile app itself** (`src/apps/mobile/`), and **9 exist only for this target** (`pwa/main.tsx` plus
the eight files in `src/pwa/`). One omission carries the entire difference: the PWA entry never
renders `AppShell`, and with it go the app switcher, the two web apps, the admin app, the four demo
surfaces, `PhoneFrame` and the Gradient Lab.

| Target | Build | Output | Entry chunk |
| --- | --- | --- | --- |
| All three apps, framed | `npm run build` | `dist/` | 889.18 kB raw · 235.63 kB gzip |
| Mobile app only, installable | `npm run build:pwa` | `dist-pwa/` | 552.11 kB raw · 158.64 kB gzip |

Those are `vite build`'s own figures for the single entry chunk on the tree as it stands — measure
again rather than trusting them, they drift. The 17.22 kB stylesheet is byte-identical in both; the
PWA adds a 5.65 kB Workbox shim and a service worker precaching **17 distinct URLs (729.7 KiB)**,
which is what makes it work offline.

`dist-pwa/sw.js` lists 22 entries rather than 17, and that is not a miscount: `includeManifestIcons`
and `globPatterns` both match the four icons and `manifest.webmanifest`, so those five appear twice
(757.6 KiB across the 22 as listed). The duplicates are inert — Workbox throws only when two entries
for one URL carry *conflicting* revisions, and each of these pairs carries the identical revision.

The saving is invisible and easy to lose: nothing about adding `import { x } from '../../shared'` to
a mobile screen warns you that a barrel just dragged the admin app back in. **`src/pwa/pwaPurity.test.ts`
is what stops it eroding** — it walks the real import graph from `pwa/main.tsx` and fails if the
closure ever reaches `apps/web`, `apps/admin`, `apps/demo`, `AppShell`, `router.tsx`, `PhoneFrame` or
the Gradient Lab. It runs with `npm run test`.

### Ports and shared assets

The PWA dev server is on **5174** with `strictPort`, because Playwright's `webServer` owns 5173 and a
silent fallback port would leave `npm run shots` pointing at the wrong app. It also sets `host: true`,
because a phone on the same wifi is the only way to judge half of what this target adds; Vite's
`preview` inherits `server.host`, so `preview:pwa` is reachable from the LAN as well.

`publicDir` points back at the shared `public/`, so one copy of the self-hosted fonts (see
[Fonts](#fonts)) and one copy of the icon set serve both targets.

`npm run icons` rasterises `src/assets/pwa/icon.svg` and `icon-maskable.svg` into the six PNGs and the
`favicon.svg` copy that `public/` ships. It uses the Chromium that Playwright already installs rather
than adding a dependency for a job that runs approximately never; the outputs are committed, so no
build depends on it.

### Why the URLs stay `/mobile/*`

They are not cosmetic leftovers. `MOBILE_TAB_PATH`, `listsStackLocation`'s
`matchPath('/mobile/lists/:listId/cards/:cardId', …)` and every `navigate('/mobile/…')` call hard-code
the prefix — and `BrowserRouter basename="/mobile"` does **not** fix that: under a basename,
`navigate('/mobile/lists')` resolves to `/mobile/mobile/lists`. Rebasing would mean parameterising a
shared pure module for cosmetic gain on URLs nobody sees in an installed app. So the manifest ships
`start_url: '/mobile/lists'` and `scope: '/'`, and `pwa/main.tsx` redirects `/` (and anything
unrecognised) to the Lists tab.

### The inset contract

The mobile app runs under two hosts and one layout serves both. `PhoneFrame` sets
`.aa-inset-simulated` (the frame's fake 54px status bar and 34px home indicator); `MobileViewport`
sets `.aa-inset-device` (the real `env(safe-area-inset-*)`, with a 12px floor on the top). Every
mobile element that used to hardcode a pixel inset now reads the four `--aa-inset-*` custom
properties through a `calc()`. The framed values are chosen so each expression resolves to exactly
the integer it used before, which is how the desktop prototype provably did not move. The full
reasoning — why a class rather than `:root`, why CSS rather than inline style, why only the top
carries a floor — is in the `── The inset contract ──` block in `src/theme/global.css`.

**`viewport-fit=cover` in `pwa/index.html` is mandatory, not cosmetic.** Without it every `env()`
resolves to 0 and the whole contract silently collapses to its floors.

`visual/mobile-insets.spec.ts` is the lock. It reads `getComputedStyle` on every anchor in the
framed prototype and asserts the resolved pixels are exactly what they were before the contract
existed: 64 / 116 / 26 / 60 / 130 / 32 / 60 / 32 / 36 / 40, plus `--aa-inset-top: 54px` and
`--aa-inset-bottom: 34px` on the host itself. Playwright resolves `calc()` and `max()` in computed
styles, so this is a true pixel lock rather than a string comparison, and it is what makes the
refactor safe to repeat.

### Testing on a real device

Service workers require a **secure context**. `localhost`, `127.0.0.1` and `*.localhost` qualify;
`http://192.168.x.x:5174` does **not**, so on a LAN IP `navigator.serviceWorker` is undefined and
nothing registers. That single fact shapes the whole loop, and the More tab's `Offline ready` row
tells you which side of it you are on.

| What you are testing | How |
| --- | --- |
| Layout, safe areas, tab bar, gestures, press response, icon, standalone chrome | LAN IP over plain http. `npm run dev:pwa` binds every interface (`server.host: true`), so `http://<your-ip>:5174` reaches it from a phone on the same wifi with no extra flag. **iOS installs without a service worker** — it keys standalone off `display: standalone` and fetches the manifest over http — so this covers most of the fiddly work. |
| Service worker, offline, precache, update prompt (Android) | Chrome `chrome://inspect` → Port forwarding, mapping `localhost:5174` *on the phone* to your machine. The phone genuinely sees `localhost`, which **is** a secure context, so you get a full service worker against a live dev server with HMR. |
| Service worker, install and update (iOS) | Needs real HTTPS: a hosted preview, or `cloudflared tunnel` / `ngrok` pointed at the dev server. |

The service worker is off in dev by default (`devOptions.enabled: false` in `vite.pwa.config.ts`) —
a worker in dev caches aggressively and makes HMR confusing. Flip it to `true` to exercise the update
flow against the dev server.

### The origin trap

localStorage, service-worker registration and installed-PWA identity are **all keyed by origin**, and
every hostname you serve from is a different origin — therefore its own everything: its own worker,
its own precache, its own separate copy of the demo data. That covers more hostnames than it sounds
like: a `cloudflared` or `ngrok` URL, a LAN IP, a port-forwarded `localhost`, and every per-branch or
per-commit preview a host mints for you. Install to a home screen from any of them and that icon
points at **that** origin forever; it will never see the one you actually deploy to.

**Install only from the single stable URL you intend to demo from.** Everything else is for browser
smoke-testing. This bites hardest with a tunnel whose URL changes per session, which re-creates the
trap on every run — use a named tunnel, or accept that the installed icon is disposable.

Related, and the reason the More tab's Reset control has to exist at all: on iOS the home-screen app's
storage may be separate from Safari's for the same origin (the behaviour has changed across versions),
so "clear it in the browser" is not a reliable way to start a clean run on the phone.

### Updates, and why pull-to-refresh will not save you

This is the main operational risk the target carries. **Once a service worker is installed,
pull-to-refresh does not get you the new build** — the old worker answers every navigation from its
own precache, so a phone can sit two deploys behind with no outward sign. Three layers guard against
it:

1. **The update pill** (`src/pwa/UpdatePrompt.tsx`) — `registerType: 'prompt'`, never `'autoUpdate'`,
   because auto-update reloads the page by itself and mid-demo that drops the slide-stack position and
   any open sheet. It polls every 60 seconds (only while visible and online) and re-checks the moment
   the app returns to the foreground, then offers a tap to reload.
2. **A visible build id** in the More tab — `__BUILD_ID__`, derived from git at build time by
   `vite.pwa.config.ts`: a short sha on a clean tree, `<sha>-dirty-<MMDD-HHmm>` on a dirty one,
   `unknown` where there is no git, and whatever you set if you pass `AA_BUILD_ID`. Without it you
   cannot tell whether the phone actually picked up a deploy, and that burns workshop-prep time. Git
   rather than a host's own commit variable on purpose: the value has to stay honest wherever this is
   served from, and reading one vendor's variable means silently reporting nothing everywhere else.
3. **A manual "Check for updates" row**, next to it, which forces a `registration.update()`.

The kill switch, if a worker ever needs to be removed from a device you cannot physically reach: ship
one deploy with `selfDestroying: true` in the `VitePWA` options. That build unregisters the worker,
clears its caches and re-navigates every client.

### Deployment

**Neither target is hosted, and no host configuration ships in this repo.** The framed prototype is
local-only — `npm run dev`, or `npm run preview` against a build. The PWA is the only one worth
hosting, because installing to a home screen needs real HTTPS. If that ever happens it will be
Cloudflare Pages. This section is documentation, deliberately: a config file for a host you do not use
is the thing it replaced.

**What any static host needs**, in order of how badly it fails without it:

1. **An SPA fallback to `index.html`.** `src/router.tsx` is a `BrowserRouter`, so `/mobile/lists` and
   `/admin/day/2026-07-21/cards/x` are not files on disk — a refresh or a pasted deep link 404s
   without it. The PWA needs it for a second reason that bites earlier: the manifest's
   `start_url: '/mobile/lists'` is not a file either, so the **first** load, before any worker exists,
   would 404 and nothing would install. It must be a **fallback**, evaluated after the filesystem
   check, so `sw.js`, `manifest.webmanifest`, `/fonts/*` and `/assets/*` still serve as themselves. A
   blanket rewrite that wins over real files would swallow the service worker.
2. **`Cache-Control: max-age=0, must-revalidate` on `sw.js`.** A CDN holding the worker for its default
   TTL means phones never learn a new precache manifest exists. This is the one that can strand an
   installed device.
3. **`Content-Type: application/manifest+json` on `manifest.webmanifest`.** Hosts that do not know the
   extension serve it as `octet-stream` or `text/plain`, and Chrome then refuses the install with a
   manifest syntax error. On the install critical path, and it fails in a way that looks like an app
   bug rather than a host one.
4. **Optional: `immutable`, one year, on `/assets/*` and `/fonts/*.woff2`.** Pure repeat-visit
   optimisation, and moot once installed, because the worker answers from Cache Storage. Note the
   asymmetry: `/assets/*` is genuinely content-hashed by Vite, so immutable is always safe there;
   the four woff2 files are **not** hashed (the `v7`/`v13` segments below are prose, not filenames), so
   immutable on them is a promise you keep by hand. **Refresh a face under a new filename** and update
   the `@font-face` `src` in `src/theme/global.css` and the two preloads in `pwa/index.html` to match.
   The installed PWA is unaffected either way: Workbox precaches fonts with a revision and appends
   `__WB_REVISION__`, so the worker's own invalidation beats the HTTP header.

Both output directories contain an `index.html`, so the same fallback rule works for either target.
And the two targets **must not share an origin** if both are to be installed and used independently —
see [the origin trap](#the-origin-trap).

#### On Cloudflare Pages specifically

Most of the list above is already the Pages default, which is why nothing ships. Verified against
Cloudflare's docs on 2026-07-31; re-check if you are reading this much later, since Pages is being
folded into Workers Static Assets.

- **Requirements 1 and 2 come free.** Pages adds `Cache-Control: public, max-age=0, must-revalidate`
  plus an `ETag` to static-asset responses by default — the same value the old config had to ask for.
  And with no top-level `404.html` in the output, Pages treats the project as a single-page app and
  serves unmatched paths from `/` at **200**, which is exactly what `navigateFallback` wants.
- **Do not write a `Cache-Control` rule for `sw.js`.** It is already correct, and whether a `_headers`
  rule *replaces* or *comma-joins* a Pages-injected default is undocumented — a joined
  `max-age=0, …, max-age=31536000` reads as `max-age=0` to every client. Restating a value you already
  have cannot help and might hurt, on the one file where being wrong is unrecoverable. The worker is
  double-protected anyway: `updateViaCache` defaults to `'imports'`, and `vite-plugin-pwa` does not
  override it, so every `registration.update()` the update pill fires bypasses the HTTP cache for the
  worker script outright.
- **Do not write `/* /index.html 200` in `_redirects`.** Redirects are followed even when a real asset
  matches, so `/*` can swallow `sw.js` and every hashed chunk. Reports also disagree on whether that
  rule is honoured, ignored as a self-referential loop, or converted to a 308. The built-in SPA
  behaviour has none of that ambiguity.
- **Never let a `404.html` reach `dist-pwa/`.** It silently takes Pages out of SPA mode and every deep
  link starts 404ing. Nothing generates one today; this is a tripwire, not a task.
- **Pin the Node version.** See `engines` in `package.json` — `^20.19.0 || ^22.12.0 || >=24.0.0`, which
  is the intersection of what Vite and oxlint need (`^20.19.0 || >=22.12.0`) with Vitest's exclusion of
  Node 23. Meanwhile
  the Pages build images default variously to Node 22.16.0, 18.17.1 or 12.18.0 depending on which one
  the project lands on. Set `NODE_VERSION` explicitly.
- **Set preview branch builds to "None"**, and pass `--branch=main` explicitly on a direct upload
  (Wrangler auto-detects your git branch, so deploying from a feature branch silently mints a preview
  origin). If no preview origin exists, nobody can install from one — the origin trap enforced rather
  than remembered.
- **Prefer `<project>.pages.dev` over a custom domain.** A custom domain sits in a Cloudflare zone, and
  the zone's **Browser Cache TTL** overrides `Cache-Control` upward whenever the origin value is lower
  than the setting — which `max-age=0` always is. That is the one documented way to get a stale `sw.js`
  on Pages. If you must use one: Browser Cache TTL = **Respect Existing Headers**, no `Cache Everything`
  page rule, and Rocket Loader / Polish / Mirage off.
- **Only two `_headers` rules are ever worth adding**, and only for requirement 4. If you add them,
  keep the file **out of `public/`** — that directory is the shared `publicDir`, so a copy there also
  lands in the desktop target's `dist/`, where every comment about a service worker is a lie. Put it
  somewhere target-specific and copy it into `dist-pwa/` at deploy time:

  ```
  /assets/*
    Cache-Control: public, max-age=31536000, immutable

  /fonts/*.woff2
    Cache-Control: public, max-age=31536000, immutable
  ```

**Verify against the first real deploy rather than trusting the above.** Four of these behaviours are
documented and two are inferred, so check them once:

```sh
P=https://<project>.pages.dev
curl -sI $P/sw.js                | grep -i 'cache-control\|etag'  # want max-age=0, must-revalidate
curl -sI $P/manifest.webmanifest | grep -i 'content-type'         # want application/manifest+json
curl -sI $P/mobile/lists         | head -1                        # want 200, not 30x and not 404
```

Then, on the handset and from the production URL only: install, confirm the More tab's build id matches
`git rev-parse --short=7 HEAD`, and confirm the worker registered. **Do not deploy during a workshop** —
a deploy that lands while a phone is mid-precache fails invisibly, leaving the old worker active and no
update pill.

### Office simulation

The installed PWA has no Admin app, so **nobody plays the office**. In the framed prototype the
presenter submits a List on the phone, switches to the Admin Web App, authorises it and watches the
billing run; on a real phone a submitted List would sit in Done forever and Balances would never move.

`src/pwa/officeSimulation.ts` closes that loop. It is **on by default** and PWA-only (`src/main.tsx`
never wires it — auto-authorising would sabotage the scripted S3 review beat). A few seconds after a
List goes DRAFT → SUBMITTED it authorises and bills that List through the ordinary audited store
actions, with an actor named `AA office (simulated)`, so the invoices, the Balances movement and the
Xero mirror all follow.

**It is explicitly a simulation and explicitly not the RFP flow.** Nothing in the RFP authorises a List
off the back of the anaesthetist's own submit; a real submission goes to the office review queue and a
person authorises it deliberately, which is the entire point of the SUBMITTED state. It is toggleable
from the More tab precisely so a presenter can show the honest behaviour (a submitted List that simply
waits) whenever the question comes up. Switching it back on hands that same waiting List over a few
seconds later, rather than orphaning it, so the story can carry on from where the question left it.

### What it deliberately does not do

- **No shared state between devices.** Two installs and the desktop prototype are three independent
  demo worlds, each with its own localStorage. Closing that needs a real backend.
- **No real camera.** `PhotoCaptureFlow` picks between two bundled SVG "paper cards"
  (`src/assets/samplePaperCards.ts`); there is no `<input type="file">`, no `FileReader` and no
  `getUserMedia` anywhere in `src/`.
- **No push notifications.** iOS 16.4+ supports them for installed PWAs, so "a new list was assigned
  to you" is a strong future demo beat, but it needs a real push service.
- **It is not pixel-identical to the frame at the top edge, and that is correct.** The frame's 54px is
  a stylisation; an iPhone 14 Pro really reserves 59px and an iPhone 13 really reserves 47px. Expect
  ±5 to 7px of difference in the header band and do not chase it.

### One open decision: the iOS status bar

`pwa/index.html` ships `apple-mobile-web-app-status-bar-style: default`, which keeps the status bar
outside the web view with reliably dark glyphs. The alternative, `black-translucent`, starts the web
view at y=0 so the atmosphere flows under the status bar exactly as it does under the frame's fake
one. That is nicer, but the glyph colour is genuinely uncertain across iOS versions, which is why it
is not already shipped. Try it on the actual device and keep whichever reads better. The inset
contract's 12px top floor means the layout is correct either way, so this stays a one-line cosmetic
change.

## Fonts

The two design fonts are **self-hosted** from `public/fonts/` — nothing is fetched from
`fonts.googleapis.com` or `fonts.gstatic.com` at runtime. The `@font-face` declarations live in
`src/theme/global.css`; `public/` is shared by both build targets, so `/fonts/*` resolves for the
prototype and the PWA alike.

| Family | Role | Faces shipped | Licence |
| --- | --- | --- | --- |
| Schibsted Grotesk | UI (`--font-ui`) | Roman variable, `font-weight: 400 900` | OFL 1.1 — [`public/fonts/Schibsted-Grotesk-OFL.txt`](public/fonts/Schibsted-Grotesk-OFL.txt) |
| Spline Sans Mono | Data (`--font-mono`) | Roman variable, `font-weight: 400 700` | OFL 1.1 — [`public/fonts/Spline-Sans-Mono-OFL.txt`](public/fonts/Spline-Sans-Mono-OFL.txt) |

### Provenance

Fetched from Google Fonts' gstatic CDN on **2026-07-30**. Both licence files are the canonical
upstream `OFL.txt` from [google/fonts](https://github.com/google/fonts). Four subset files, about
122 KiB in total:

- **Schibsted Grotesk** — gstatic version segment **`v7`**
  - `schibsted-grotesk-latin.woff2` (46,864 B) —
    `https://fonts.gstatic.com/s/schibstedgrotesk/v7/Jqz55SSPQuCQF3t8uOwiUL-taUTtap9GayojdSFO.woff2`
  - `schibsted-grotesk-latin-ext.woff2` (20,844 B) —
    `https://fonts.gstatic.com/s/schibstedgrotesk/v7/Jqz55SSPQuCQF3t8uOwiUL-taUTtap9IayojdSFOd1I.woff2`
- **Spline Sans Mono** — gstatic version segment **`v13`**
  - `spline-sans-mono-latin.woff2` (36,528 B) —
    `https://fonts.gstatic.com/s/splinesansmono/v13/R70BjzAei_CDNLfgZxrW6wrZOF2WX5KZmE-Z-lw.woff2`
  - `spline-sans-mono-latin-ext.woff2` (20,748 B) —
    `https://fonts.gstatic.com/s/splinesansmono/v13/R70BjzAei_CDNLfgZxrW6wrZOF2WX5yZmE-Z-lxguQ.woff2`

The `unicode-range` values in `global.css` are copied verbatim from the Google CSS for the same
version segments. To refresh a family, re-fetch that CSS with a modern desktop browser UA (gstatic
serves woff2 only to modern UAs), re-download the files it names, and update the version segment and
fetch date above.

**Only the roman faces are shipped — the italic is deliberately omitted.** Its one use in the app is
a desktop-only caption on the admin invoice document
(`src/apps/admin/screens/InvoiceDocument.tsx`), where the browser's synthetic oblique is acceptable
and not worth roughly doubling the font payload.

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
