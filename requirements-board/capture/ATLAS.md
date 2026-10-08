# Screen atlas for capture recipes

Shared knowledge for writing `capture/recipes/<ID>.json`, so each agent does not work out the
prototype again. The prototype is `aa-prototype/` (React over a seeded in-browser fake backend).
The demo clock starts at **Tue 21 Jul 2026, 08:00**. It never ticks by itself.

## Contents

- [Recipe format](#recipe-format)
- [How the runner takes a shot](#how-the-runner-takes-a-shot)
- [Rules for agents](#rules-for-agents)
- [`data-shot` naming](#data-shot-naming)
- [Selector tips](#selector-tips-learned-the-hard-way)
- [Personas and IDs](#personas-and-ids)
- [Routes](#routes)
- [Seed data worth shooting](#seed-data-worth-shooting)
- [Overlays that need clicks](#overlays-that-need-clicks)
- [Existing hooks](#existing-hooks)
- [Demo control panel (`/demo/control`) and Demo actions](#demo-control-panel-democontrol-and-demo-actions)
- [Gotchas](#gotchas)
- [Worked examples](#worked-examples)

## Recipe format

Write one file per catalogue item, at `requirements-board/capture/recipes/<ID>.json`.

```json
{
  "id": "US-03.2.4",
  "status": "captured",
  "absentReason": "",
  "shots": [
    {
      "name": "procedure-picker",
      "app": "mobile",
      "caption": "Select a procedure",
      "start": "/mobile/lists/L-34821-2026-07-21-PM/bookings/BK0009",
      "setup": [],
      "states": [
        { "state": "closed", "steps": [], "highlight": ["[data-testid=procedure-header]"] },
        { "state": "open", "caption": "Procedure picker, searching by code or name",
          "steps": [{ "click": "text=\"Change\" >> nth=0" }, { "wait": 500 }],
          "highlight": ["[role=dialog]"] }
      ]
    }
  ]
}
```

**Top-level fields**

- `status` is one of three values:
  - `captured`: the story is in the prototype and shown.
  - `partial`: some of the story is in the prototype. `absentReason` must say what is missing.
  - `absent`: the story is not in the prototype. It has no shots, and `absentReason` must say why.
- Absent and partial items are recorded here and in `REPORT.md` only. Never edit the catalogue
  item's text or status for them.

**Shot fields**

- `name` is a kebab-case slug.
- `app` is `admin`, `web`, `mobile` or `simulator`. Use `simulator` for `/demo/*` pages: Xero,
  integrations, data inspector and control panel.
- `caption` names the thing in plain words.
- `start` is the route to open.
- `setup` is optional. It is a list of steps run before `start` (see below).
- `states`: one or more. Each state produces one image.
  - `state` is a slug. It is required when a shot has several states.
  - `caption` is optional and overrides the default caption, which is the shot caption plus the
    state name.
  - `steps` run after `start` loads.
  - `highlight` is a list of selectors. The red box goes around all of their matches combined.
    An empty list means no box.

**Files**

- Images are written to `requirements/assets/<ID>/<app>-<name>[-<state>].png`.
- The item's `images` frontmatter is rewritten with them, in recipe order.
- Images added to the item by hand are kept.

**Steps.** Selectors are Playwright locator strings, so `text=`, `role=`, CSS and `>> nth=0` all
work.

| Step | Effect |
|---|---|
| `{ "click": sel }` | Click. Add `"force": true` only if an overlay intercepts it. |
| `{ "dblclick": sel }` | Double-click. |
| `{ "fill": sel, "value": "..." }` | Type into an input. |
| `{ "press": "Enter", "on": sel }` | Key press. Omit `on` to send it to the page. |
| `{ "hover": sel }` | Hover. |
| `{ "select": sel, "value": "..." }` | Choose a `<select>` option. |
| `{ "wait": 500 }` / `{ "wait": sel }` | Wait a number of ms, or until a selector is visible. |
| `{ "scroll": sel }` / `{ "scroll": sel, "by": 400 }` | Scroll an element into view, or scroll inside it by a number of pixels. |
| `{ "goto": "/path" }` | Full navigation. This reloads the page, and the store is rehydrated from localStorage. |
| `{ "scenario": "S3" }` | Reset, then jump to scenario S1 to S5 on `/demo/control`. Works only on :5173, so never for mobile shots. |
| `{ "trigger": "<id>", "choice": "...", "open": true }` | Run a demo action from the current screen's harness-bar "Demo actions" menu (see [Demo actions](#demo-control-panel-democontrol-and-demo-actions)). It lifts the bar's hide, opens `[data-shot=demo-actions]`, sets the row's select to `choice` if given, clicks Run in `[data-shot=demo-action-<id>]`, waits for its result line, closes the menu and hides the bar again. Fails if the row is missing or disabled. `"open": true` leaves the bar and the menu showing, so a state can shoot the result line. On a mobile (:5174) shot it opens the PWA's Demo sheet instead, picks `choice` by its label, runs the entry and taps the scrim to close. |

**Setup vs steps**

- With `setup`, the runner opens the app, runs the setup steps, then moves to `start` **inside the
  running app** (no reload). State created in setup, such as a replayed HL7 message, an
  authorised list or an advanced clock, is still there at `start`.
- Without `setup`, the runner simply opens `start`.

## How the runner takes a shot

The runner is `requirements-board/scripts/capture.ts`:

```
node scripts/capture.ts --only US-03.2.4        # one item (an epic/feature ID takes its descendants)
node scripts/capture.ts --only US-03.2.4 --dry  # run steps and selectors, write nothing
npm run capture                                 # everything, and writes capture/REPORT.md
```

Run these from `requirements-board/`.

- **Fresh context.** Each state gets a fresh browser context, so it starts from the pristine seed
  and the demo clock at 08:00. States do not share state; repeat the steps each state needs.
- **Web, admin, simulator.** Shot on `http://localhost:5173` at 1440x900 and device pixel ratio
  (DPR) 2. The 48px demo harness bar is hidden with CSS, so the app fills the window as it would
  in production and fixed overlays (such as the admin list drawer) show their full header.
- **Mobile.** Shot on the PWA dev server `http://localhost:5174` at 390x844, DPR 3, with no phone
  frame. It is the same `src/apps/mobile` code as the framed app. Mobile shots can't use
  `/demo/control`, because it is a different origin.
- **Motion and settling.** `prefers-reduced-motion` is on, so motion becomes a short fade. After
  navigation and after the steps, the runner waits for fonts, network idle and 500ms.
- **Only what's visible is captured.** Shots show the viewport only. Content below the fold must
  be scrolled into view with a `scroll` step. The runner also scrolls the first highlight target
  into view.
- **Loud failures.** A step or highlight selector that matches nothing visible fails the whole
  recipe. So does a page error. Nothing is written for a failed recipe, and its old images stay.
- **Check your own output.** After a run, open each PNG with the Read tool. Check it shows the
  right screen, the right state, and a box tight around the right area.

## Rules for agents

These rules are for agents that only write recipes. A catch-up build phase also owns the recipes for
the items it covers and for any recipe it breaks, and ends with a full capture run: see "Catalogue
screenshots" in `docs/prototype-build/catch-up/ROADMAP.md`. In a build phase the app changes are the
phase's own, and the session may start root `npm run dev` itself if the servers are down; every other
rule below still applies.

- **Never commit.** No git commits, pushes, rebases or PRs.
- **Prototype changes are `data-shot` attributes only.** No visual or behaviour change.
  - Add a `data-shot` to an existing element.
  - Where a small internal component has no way to take an attribute, add an optional `shot?: string`
    prop that only sets `data-shot` (see `Pane` in `DemoIntegrations.tsx`). Nothing else.
  - Never add wrapper elements.
- **Captions.** No en dashes or em dashes. Use a middot `·`, a comma or "to". Name the thing plainly,
  for example "Procedure picker, searching by code", not "Screenshot of the UI".
- **Only your own files.** Write only your own items' recipe files. The runner writes their
  catalogue files and assets. Never hand-edit another item.
- **Leave the dev servers alone.** Don't start, restart or stop them. If the runner says one is
  down, stop and report it.
- **Both anaesthetist apps.** When a story is in the anaesthetist app, shoot **both** `web` and
  `mobile` if both have it. If only one does, say so in a `partial` reason, unless the story is
  inherently one-platform (for example, photo capture on the phone).
- **One story, one area.** When the screen shows several features, the highlight marks this
  story's area. When the whole screen *is* the story, use no highlight.
- **Show the states.** Add states where the story is about a change: before and after, closed
  and open, error and valid, and so on.

## `data-shot` naming

- Form: `data-shot="<area>-<thing>"`, in kebab case.
- The value must be unique on its screen, for example `availability-mine`, `integrations-raw-hl7`
  or `review-authorise`.
- For per-row or per-item values, add a stable suffix, for example `availability-block-am`, or
  set the attribute only on the row that matters:
  `data-shot={isMine ? 'availability-row-mine' : undefined}`.
- Before adding one, grep for an existing `data-shot` or `data-testid` you can reuse.

Hooks already added:

| Hook | Where |
|---|---|
| `integrations-raw-hl7`, `integrations-fhir`, `integrations-schedule-change`, `integrations-replay` | `/demo/integrations` |
| `availability-row-mine` | `/web/availability` |
| `availability-mine`, `availability-block-am`, `availability-block-pm` | `/mobile/availability` |
| `scenario-s1` to `scenario-s5`, `scenario-confirm` | `/demo/control`, used by the `scenario` step |
| `demo-actions` | The harness bar's "Demo actions" pill (only on screens with entries), used by the `trigger` step |
| `demo-action-<id>` | One row of that menu, with its Run button and `role=status` result line |
| `control-demo-index`, `index-<id>` | `/demo/control`: the "Demo actions by screen" index and each entry's row ("Open screen") |
| `pwa-demo-actions` | The PWA's amber "Demo" chip (mobile shots on :5174), shown only on screens with PWA entries; hidden in shots except while a `trigger` step runs |
| `pwa-demo-action-<id>` | One row of the PWA's Demo sheet, with its Run button and `role=status` result line, e.g. `office-authorises-list` on a submitted List |

## Selector tips (learned the hard way)

- **`text=Foo` is a case-insensitive *substring* match.** It happily hits a paragraph that
  mentions "foo". Use one of these instead:
  - `text="Foo"`, the exact form: note the inner quotes, escaped in JSON as `"text=\"Foo\""`.
  - `role=button[name="Foo"]`.
  - A `data-shot` hook.
- Tabs and segmented controls are usually plain `<button>`s, not `role=tab`.
- Many labels repeat, such as "Reset demo data" (harness and inspector), "Lists" (tab and back
  button) and "Replay". Scope them, for example `[data-testid=integration-inspector] >> text="Reset demo data"`,
  or use `>> nth=0`.
- **Highlighting a row or card with no hook: add a `data-shot`.** Don't write a long xpath.
- A **dialog or sheet** is `[role=dialog]`. On mobile, scope it as `[data-aa-mobile-product] [role=dialog]`.

## Personas and IDs

**Personas**

- **Anaesthetist, web and mobile:** Dr Melanie Souter, initials MS, anaesthetist ID `34821`.
- **Admin, and every `/demo/*` page:** Kirsty W., office staff.
- **Other registration numbers:** Rutherford 29104, Ropata 39560, Delaney 27731, Morrison 25490,
  Whitaker 36208.

**IDs**

| Kind | Format | Notes |
|---|---|---|
| List | `L-<anaesthetistId>-<YYYY-MM-DD>-<AM\|PM>` | From `listIdForSlot`. For example `L-34821-2026-07-21-PM`. |
| Booking | `BK0001`… | Seed order. `BK0001`..`BK0005` are Souter Tue 21 AM (BK0001 Hemi Walker). `BK0006` Wiremu Tane, `BK0007` Susan Marsh, `BK0008` David Chen, `BK0009` **Margaret Ellison** (pending). Verify with one run. |
| History Booking | `HBK01`… | The billed history backdrop (Lists `L-HIST-NN`, Procedures `HP`, cases `HBC`). Before catch-up Phase 15 these were `HC01`…. |
| Attachment | `AT0001`… | Store-allocated. `AT0001` is the seeded theatre-list PDF on Souter Tue 28 AM. |
| Invoice | `INV0001` / `AA-2026-0001` | `INV0001` is the seeded paid pre-payment. Runtime invoices start at `INV0002` once a list is authorised. |
| Xero pair | `XRB0` | The seeded pre-payment. History pairs are `XRH01`… and runtime pairs `XR0001`…. |

**Named lists** (`SEED_LIST_IDS`)

| List | ID | What it is |
|---|---|---|
| Souter Tue 21 AM | `L-34821-2026-07-21-AM` | St George's, Mr T. Hale. 5 complete bookings, DRAFT. |
| Souter Tue 21 PM | `L-34821-2026-07-21-PM` | Southern Cross, Ms K. Patel. 4 bookings, Ellison pending, DRAFT. |
| Morrison Mon 20 | `L-25490-2026-07-20-AM` | SUBMITTED. 6 complete and 1 cancelled. |
| Whitaker Fri 17 | `L-36208-2026-07-17-AM` | SUBMITTED. |
| Souter Mon 20 AM | `L-34821-2026-07-20-AM` | SUBMITTED. Split billing, Brian Holt. |
| Souter Mon 20 PM | `L-34821-2026-07-20-PM` | SUBMITTED. Two funders: Alan Prentice, nib plus St George's. |
| Souter Fri 24 AM | `L-34821-2026-07-24-AM` | Pre-payment **unpaid** (Annette Riley). |
| Souter Fri 24 PM | `L-34821-2026-07-24-PM` | Pre-payment **paid** (Priya Nair, `INV0001`). |
| Ropata Thu 16 | `L-39560-2026-07-16-AM` | SUBMITTED. The billing-failure target. |
| Delaney Fri 17 | `L-27731-2026-07-17-AM` | SUBMITTED. Integration-locked target. |
| Souter Tue 28 AM | `L-34821-2026-07-28-AM` | The S1 destination: MSG-STG-1001 adds Sarah Mitchell. Carries the seeded List attachment "Theatre list · St George's" (PDF). |
| Souter Tue 4 Aug AM | `L-34821-2026-08-04-AM` | Targets for S13, S14 and S15. |
| Souter Mon 3 Aug PM | `L-34821-2026-08-03-PM` | Source list for the S13 move. |

## Routes

Everything on :5173 sits under the harness bar, which the runner hides in every shot.

Booking routes use `/bookings/:bookingId` (catch-up Phase 15). An old `…/cards/C0009` URL still
redirects, with replace, to `…/bookings/BK0009`, but recipes should use the new form.

**Web app** (`src/apps/web/`)

| Route | Shows |
|---|---|
| `/web` | Dashboard: "Kia ora, Dr Souter", week strip, receivables aging, productivity, leave, "Offer cover". Add `?week=YYYY-MM-DD` (a Monday) to show another week. |
| `/web/lists` | Table of Souter's lists. |
| `/web/lists/:listId` | List detail: header, bookings table, "Add a booking", submit action. |
| `/web/lists/:listId/bookings/:bookingId` | Booking detail with capture: ASA, procedure code, times, booking total, "Mark complete". |
| `/web/availability` | Practice availability grid. Free cells read "Free · Open for booking" and can be clicked for cover. |
| `/web/accounts/overdue`, `/web/accounts/payments`, `/web/accounts/gst` | Accounts tabs. Add `?invoice=AA-2026-0005` to focus a payment, which exists only after S3 billing. |

**Admin app** (`src/apps/admin/`)

| Route | Shows |
|---|---|
| `/admin` | Redirects to `/admin/day/2026-07-21`. |
| `/admin/day/:date` | Day grid of anaesthetists by time. The right rail has the mini calendar, "Internal notes" and "Awaiting review". Add `?sort=az` for A to Z order. |
| `/admin/day/:date/bookings/:bookingId` | Admin booking detail with "Office billing setup". |
| `/admin/review` | Review queue, plus "Recently billed". |
| `/admin/review/:listId` | Sanity check: total units, B · T · M, "Log phone note", "Authorise for billing". |
| `/admin/invoices` | Invoice list. |
| `/admin/invoices/:invoiceId` | Tax invoice document (`.aa-invoice-doc`) with an info rail. |
| `/admin/billing` | Billing monitor. |
| `/admin/integrations` | Tabs: Messages, Feed config, Surgeon PDFs, Data quality, Validators. The message log is empty until a message is replayed. |
| `/admin/masters` | Master data. Tabs include Contracts and "Hospitals & holidays". |
| `/admin/audit` | Audit viewer. |

The side nav has: Day view, Review queue, Invoices, Billing monitor, Integrations, Master data,
Audit.

**Mobile app** (`src/apps/mobile/`; on :5174 for shots)

| Route | Shows |
|---|---|
| `/mobile/lists` | Forward lists. Segments Week, Month, To-Do, Done. Free rows read "Open for bookings or cover". |
| `/mobile/lists/:listId` | List detail, with an "Add a booking" and "Mark list completed" footer. The tab bar is hidden. |
| `/mobile/lists/:listId/bookings/:bookingId` | Booking detail. The tab bar is hidden. |
| `/mobile/availability` | "My availability" (Free and Block per session), the everyone / free-only grid, and "Tap to ask" for cover. |
| `/mobile/balances` | "Your account": Outstanding and GST this month. |
| `/mobile/more` | Settings. The PWA adds a demo panel with a non-deterministic build ID. Avoid shooting that panel. |

- The tab bar is `[data-testid=mobile-tab-bar]`, with buttons Lists, Availability, Balances and
  More.
- The slide layers are `[data-testid=slide-home|slide-list|slide-booking]`. All stay mounted, so
  scope selectors to the top layer, for example `[data-testid=slide-booking] >> text="ASA status"`.

**Simulators** (`src/apps/demo/`)

| Route | Shows |
|---|---|
| `/demo/control` | The presenter's index: clock and reset, scenario jumps, and every demo action listed under its screen with an "Open screen" link. No trigger buttons. |
| `/demo/xero` | Xero simulation, Contacts tab. |
| `/demo/xero/invoices` | Invoices tab. |
| `/demo/xero/invoices/:accRecId` | Pair detail: ACCREC and ACCPAY, money flow, illustrative AA service fee. `XRB0` exists in the seed. |
| `/demo/integrations` | Integration simulator: feeds, message library, raw HL7 to FHIR to schedule change. |
| `/demo/data` | Data inspector: today's lists, seeded scenario finder, audit trail, lifecycle states, guard console. |

## Seed data worth shooting

**Souter, Tue 21 PM** (`L-34821-2026-07-21-PM`, "Southern Cross" on the mobile lists home)

- Wiremu Tane: complete, lap chole 20941.
- Susan Marsh: complete, nib insurer route.
- David Chen: complete, self-funded. His time units were overridden manually, so the booking is
  read-only and shows "adjusted manually".
- **Margaret Ellison** (`BK0009`): **pending**. Left total hip replacement 47516, A1 modifier,
  start 16:05.
  - "Finish now" stamps the end time.
  - The list can't be submitted until she is complete.

**Booking source** (catch-up Phase 15): every scenario Booking shows one quiet "SOURCE · …" line on
its detail (`[data-shot=booking-source]`): St George's, Southern Cross and Christchurch Public read
"Hospital download", Forte Health and Christchurch Eye Surgery "Surgeon PDF". History Bookings show
none. A Copy reads "Copy of another Booking".

**List attachments:** Souter Tue 28 AM (`L-34821-2026-07-28-AM`) carries the seeded theatre-list PDF,
shown under "List attachments" on mobile and web and read-only in the Admin List drawer.

**Admin day, Tue 21**

- Rutherford at Forte Health all day.
- Free sessions: Sharma PM, Hughes AM and PM, Strand PM.
- Delaney PM is free with a note.
- Fitzgerald PM is at St George's with the surgeon TBC and a needs-attention flag.

**Wed 22**

- Souter PM is free.
- There are advisory conflicts.
- Rutherford AM "is now marked unavailable": the S2 reassign target.

**Fri 24:** the prepayment warning (a warning, never a block, since catch-up Phase 15a; no gate, no
override). AM is unpaid: Annette Riley's Booking (`BK0034`) carries a small warning triangle on its
row in all three apps, and opening it shows the warnings panel at the top (`[data-shot=booking-warnings]`,
"Prepayment required", Before procedure, Strong; the prepayment row is `[data-shot=booking-prepayment]`
with the office's "Raise pre-procedure invoice"). It still completes and submits through the usual
sheet. On Admin Day Fri 24 the Souter AM block has the red outline and a triangle with "1"
(`[data-shot=daygrid-block-warnings]`, the block button itself), her drawer row carries the same
outline (`[data-shot=drawer-booking-warning]`), and the To-do card under the calendar
(`[data-shot=admin-warnings-todo]`) lists the warning with Open and Clear. PM is paid (Priya Nair:
the success note keeps `booking-prepayment`).

**Review queue (pristine):** Morrison, Whitaker, Souter Mon 20 AM and PM, Ropata, Delaney.
Authorising Morrison raises 6 invoices.

**Web accounts (backdrop history)**

- Overdue: Tane, Marsh, Chen, Prentice (ACC), Holt, Foster, Mitchell, Walker.
- Paid: Bennett, Webb, Mills, Riley, Park.

**Also seeded:**

- A cancelled booking on Morrison's list.
- Guardian of a minor: Grace Park.
- An insured-reimbursement booking: Rutherford, Thu 16 AM.
- A provisional patient with no NHI.
- Repeat patients: Mitchell and Walker.
- Procedures missing a billing reference.

**NHIs:** Ellison ZAA0067, Tane ZBC1123, Chen ZAE0310, Prentice ZAC3326, Holt ZAF4434.

## Overlays that need clicks

**Anaesthetist app** (web and mobile: a sheet on mobile, a dialog on web)

- **Add booking:** `text="Add a booking" >> nth=0` on list detail. The sheet offers "Enter manually"
  and "Photo of paper list". The manual form has "Look up", which is disabled without an NHI,
  "Save booking" and "Done".
- **Procedure picker:** `text="Change" >> nth=0` on a booking. The search placeholder is "Search code
  or name".
- **Add billing line:** `role=button[name="Add billing line"]`.
- **Add attachment** (catch-up Phase 15): `role=button[name="Add attachment"]` inside
  `[data-shot=booking-attachments]` or `[data-shot=list-attachments]` opens
  `[data-shot=add-attachment-sheet]`, badged "Simulated file picker", with two groups:
  `role=group[name="Take a photo"]` and `role=group[name="Choose a file"]`. Clicking a sample attaches
  it and closes the sheet. Remove buttons are named `Remove <name>` and show on hover or focus.
- **Copy booking:** `role=button[name="Copy booking"]` opens the new Booking (a new `BK` id) at once.
- **History:** `role=button[name="History"]` opens a dialog titled "Booking history". On mobile it is
  inside `[data-testid=mobile-booking-header-actions]`.
- **Cancel booking:** "Cancel booking", then fill `role=textbox[name="Reason"]`, then confirm.
- **Edit:** "Edit" in the Patient section, or inside `[data-testid=procedure-header]`.
- **Submit list:** "Mark list completed".
  - If blocked, the sheet "Bookings still to finish" opens.
  - If ready, a confirm sheet opens. Then "Submit to office" shows
    `[data-testid=list-submission-overlay]`, which auto-dismisses.
- **Complete booking:** "Finish now", then "Mark complete".
  - `[data-testid=completion-overlay]` appears for about 1s. Shoot it with `{ "wait": 350 }`.
  - Pressing "Mark complete" on an incomplete booking marks `[data-validation-focus=true]`.
- **Cover:**
  - Mobile availability: `text="Tap to ask" >> nth=0`.
  - Web availability: `button:has-text("Open for booking") >> nth=0`.
  - Web dashboard: "Offer cover".
  - The sheet then shows "Send cover request", then "Request sent".

**Admin**

- **List drawer:** click a block on the day grid, for example `text="St George's" >> nth=0`. The
  drawer is `[data-testid=admin-list-drawer]`, with buttons "Edit list", "Reassign list",
  "History", "Book (phone advice)" (free slots only), "Open" (a booking) and "Move".
- **Reassign:** "Reassign list", pick a target like "Sharma, Priya · Free AM", then "Confirm
  reassignment". `[data-testid=list-reassignment-overlay]` appears.
- **Admin booking:** "Edit billing setup", "Price override" (placeholders `-10` and "Why the price
  differs") and "Funder allocation".
- **Review:**
  - "Log phone note" opens a textarea, then "Log note".
  - `role=button[name="Authorise for billing"] >> nth=0` opens the confirm.
  - `>> nth=-1` confirms. The banner then reads "List authorised · locked for billing".
- **Day notes:** "+ Add note", placeholder "Add an internal note for this day", then "Save note".
- **Date navigation:**
  - Buttons ‹, ›, Today, -4w, -1w, +1w, +4w.
  - `input[type=date]` accepts a fill.
  - Mini calendar days are named like "Wednesday 22 July 2026".
- **Invoice:** "Email invoice" shows "Simulated send"; "Print".
- **Master data:** "Edit", "Save changes", and "Add hospital" (field "Hospital name").

**Shell** (these controls sit in the harness bar, which is hidden in shots, so they can't be
clicked; use the matching `/demo/control` buttons in `setup` instead. The "Demo actions" menu is
the exception: use the `trigger` step)

- **Demo clock:** `role=button[name=/Demo clock/]`. It offers "+15 min", "+1 hour", "Next day",
  "Next morning", "+7 days" and "Procedure day · 28 Jul".

## Existing hooks

These are the `data-testid` values in `src/`. Use them as `[data-testid=...]`.

**Admin**

- `admin-list-drawer`, `admin-list-actions`, `admin-right-rail`
- `invoice-list-screen`, `invoice-list-table-shell`, `invoice-detail-screen`,
  `invoice-detail-workspace`, `invoice-info-rail`, `invoice-action-row`
- `xero-handoff-status`, `xero-accrec-reference`, `xero-accpay-reference`
- `review-queue-screen`, `review-queue-table-shell`, `review-queue-recently-billed`
- `review-detail-screen`, `review-queue-navigation`, `review-detail-table-shell`, `review-btm-value`
- `list-reassignment-overlay`

**Simulators**

- `integration-workspace`, `integration-inspector`, `integration-library`
- `xero-invoice-table`, `xero-invoice-table-shell`, `xero-invoice-row-<accRecId>`, `xero-pair-detail`,
  `xero-money-flow-grid`, `aa-service-fee`

**Mobile**

- `mobile-tab-bar`, `slide-home`, `slide-list`, `slide-booking`
- `mobile-lists-header`, `mobile-lists-scroll`
- `mobile-list-header`, `mobile-list-scroll`, `mobile-list-footer`, `list-submission-overlay`
- `mobile-booking-header`, `mobile-booking-header-actions`, `mobile-booking-scroll`, `mobile-booking-commit`

**`data-shot` hooks for warnings** (catch-up Phase 15a; use as `[data-shot=...]`)

- `booking-warning` (the small triangle on a Booking row or header; not interactive),
  `booking-warnings` (the warnings panel at the top of the Booking detail), `booking-prepayment`
  (the prepayment warning's row in that panel, or the paid note), `admin-warnings-todo` (the To-do
  card in the Admin Day rail), `daygrid-block-warnings` (a day-grid block button whose List has an
  open warning; click it to open the drawer), `drawer-booking-warning` (an outlined Booking row in
  the List drawer). `daygrid-block-prepayment` and the "Pre-payment flagged" filter are gone: the
  filter is "Has warnings".

**`data-shot` hooks for attachments and source** (use as `[data-shot=...]`)

- `booking-attachments` (the Booking's Attachments section), `list-attachments` (mobile and web List
  detail), `admin-list-attachments` (Admin List drawer, read-only), `add-attachment-sheet` (the
  simulated file picker), `booking-source` (the source line)

**Web**

- `web-booking-header`, `web-booking-commit`, `payment-history-row-<invoiceNumber>`

**Shared capture** (web and mobile booking)

- `procedure-header`, `booking-calculation`, `time-capture-track`, `time-action-slider`,
  `completion-overlay`, `dock-spacer`

**Other hooks**

- `[data-aa-mobile-product]`
- `.aa-invoice-doc`
- `[data-sliding-segmented-control]`
- `[data-validation-focus=true]`

## Demo control panel (`/demo/control`) and Demo actions

Since catch-up Phase 14 every demo action lives **on its own screen**, in the harness bar's
"Demo actions" menu (`[data-shot=demo-actions]`, shown only where the screen registers entries),
and in the installed PWA's "Demo" sheet. The registry is
`aa-prototype/src/shared/demoTriggers/registry.ts`. Stage them with the `trigger` step after a
`goto` to their screen; never click the Control Panel for one.

**The Control Panel is the index.** It keeps:

- Clock buttons: "+15 min", "+1 hour", "Next day", "Next morning", "+7 days" and "Procedure day
  · 28 Jul".
- "Reset demo data", then "Confirm reset".
- Scenario jumps (the `scenario` step).
- "Demo actions by screen" (`[data-shot=control-demo-index]`): each entry's row
  (`[data-shot=index-<id>]`) with an "Open screen" button.

**Scenario jumps.** Use the `{ "scenario": "Sn" }` step. Every jump resets first.

| Scenario | What the jump does | Story |
|---|---|---|
| S1 · Booking to theatre | Reset only. | On Mobile Lists, run `fire-hospital-message` (MSG-STG-1001), then Sarah Mitchell appears on Souter Tue 28 Jul AM. |
| S2 · Office day | Reset only. | Admin work. |
| S3 · Money end to end | Reset, then checks both Souter Mon 20 lists are SUBMITTED. | Authorise them in `/admin/review/...`. Billing then gives AA-2026-0005 in Xero (nib, $152.38). |
| S4 · Exceptions | Reset only. | Mobile, then the Admin screens below. |
| S5 · Compliance tour | Reset, three audited edits on David Chen's booking, then authorises Whitaker Fri 17, which raises invoices. | Admin audit and Xero. |

**Demo actions by screen** (`trigger` ids)

| Screen (`goto`) | ids | Notes |
|---|---|---|
| `/admin/billing` | `billing-failure`, `arm-handoff-fault`, `run-reconciliation-poll`, `run-archive-job` | Billing failure dates out the COS ACC contract and authorises Ropata Thu 16. "Run payables" is the screen's own product button, `[data-shot=billing-payables-run]`, not a demo action |
| `/demo/xero`, `/demo/xero/invoices[/<accRecId>]` | `run-reconciliation-poll`, `run-archive-job` | |
| `/admin/review/L-41267-2026-07-14-AM` or that List's Booking detail | `stage-post-op` | Shown only for Dr Sharma's Tue 14 AM List |
| `/admin/integrations`, Surgeon PDFs tab | `ingest-pdf-row` | Click the "Surgeon PDFs" tab first; the entry shows only there |
| `/admin/invoices/<invoiceId>`, `/demo/xero/invoices/<accRecId>` | `payment-full`, `payment-half`, `payment-replay` | Acts on the invoice in the URL. After the S3 AM authorise, AA-2026-0002 is the first open invoice; a raised pre-procedure invoice is `XR0001` |
| `/mobile/lists[...]`, `/admin/integrations`, `/demo/integrations` | `fire-hospital-message` (choice: a message id), `replay-hospital-message` | Badged Future scope |
| `/admin/audit` | `simulate-sign-in` | Five simulated sign-in audit rows |
| `/admin/day/<date>`, `/admin/day/<date>/bookings/<bookingId>`, `/mobile/lists/<listId>/bookings/<bookingId>` | `raise-sample-warnings`, `clear-sample-warnings` | On the Day view they stage (or undo) every rule's sample on Dr Rutherford's Tue 21 Jul Bookings (`BK0119`, `BK0121`); on a Booking, on that Booking (seeded Bookings only). One rule today, so each shows one warning. Also in the PWA Demo sheet on a mobile Booking |

The PWA-only entries (`office-authorises-list` on a mobile List, `office-clears-warning` on a
mobile Booking with an open warning, badged as the office stand-in, `pwa-payment-full` and
`pwa-payment-half` on Balances) are in the handset's Demo sheet, not the bar. On a mobile shot,
use the same `trigger` step (mobile shots hide the Demo chip, as desktop shots hide the bar; the
step shows it while it runs). "Play the office" is off on a fresh profile, so a submitted List waits
until `{ "trigger": "office-authorises-list" }` runs (US-07.4.1 and US-08.6.1 show the pattern).

**Integration simulator** (`/demo/integrations`)

- **Feeds:** St George's (HL7 v2), Christchurch Public (HL7 v2) and Southern Cross (FHIR-native).
- **Messages:**
  - MSG-STG-1001: S12 new booking. Selected by default.
  - MSG-STG-1002: new-format NHI.
  - MSG-STG-1003: out-of-range ethnicity. It raises a data-quality item.
  - MSG-STG-1004: transient failure, then auto-retry.
  - MSG-CPH-2001: dead letter.
  - FHIR-SX-2001: FHIR-native booking.
  - MSG-STG-1010 and 1011: S13 reschedules.
  - MSG-STG-1012: S14 modification.
  - MSG-STG-1013: S15 cancellation.
  - MSG-STG-1014: locked target.
- **Selecting a message:** click its title in `[data-testid=integration-library]`, for example
  `[data-testid=integration-library] >> text="S15 · Cancellation"`.
- **Replaying:** `[data-shot=integrations-replay]` replays the selected message. Each library row
  also has its own Replay button.
- **After a replay,** `/admin/integrations` shows the message log. Use a `setup` that replays,
  then set `start` to `/admin/integrations`.

**Data inspector** (`/demo/data`)

- Seeded scenario finder, audit trail ("Choose a booking"), lifecycle states.
- Guard console: pick a persona and an action, then "Attempt".

## Gotchas

- **State lives in localStorage** (`aa-demo`, with a write coalesced over about 250ms).
  - A `goto` step inside `setup` reloads the page. Add `{ "wait": 400 }` before it if you just
    mutated state.
  - The move to `start` after setup does not reload, so no wait is needed there.
- **PWA office simulation.** On :5174, a list submitted on mobile is auto-authorised and billed
  4s later. Shoot the submitted state within that window, or shoot it on web.
- **Numbers created at runtime vary.** Runtime invoice and Xero numbers depend on the order
  things are authorised. Reach them by clicking rows rather than hard-coding IDs, except
  `INV0001` and `XRB0`, which are seeded.
- **Overlays auto-dismiss** after about 1s: the completion overlay, the submission overlay and
  success overlays. Wait about 350ms, then shoot.
- **The mobile booking's header actions fold away** when `mobile-booking-scroll` is scrolled.
- **Avoid the PWA More tab's build panel** (build ID, cold-launch ms). It changes on every run
  and breaks determinism.
- **Stale IDs redirect** instead of showing a blank page. If a shot shows a list page when you
  expected a booking, the ID is wrong.

## Worked examples

- `recipes/US-14.1.1.json`: a simulator shot with two states (received, then applied), plus an
  admin shot whose `setup` replays a message on the simulator first.
- `recipes/US-01.2.1.json`: mobile and web shots, with a before and after state, and `partial`
  with a reason.
- `recipes/US-02.1.1.json`: an admin shot with two states (inbox, then review), and `partial` as
  the nearest analogue.
