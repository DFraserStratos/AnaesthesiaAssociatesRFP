# Screen atlas for capture recipes

Shared knowledge for writing `requirements-board/requirements/capture/recipes/<ID>.json`, so each agent does not work out the
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

Write one file per catalogue item, at `requirements-board/requirements/capture/recipes/<ID>.json`.

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
        { "state": "open", "caption": "RVG code type-ahead, searching by code or description",
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
npm run capture                                 # everything, and writes requirements-board/requirements/capture/REPORT.md
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

These rules are for agents that only write recipes. A build-plan phase (or an `app-change` session)
also owns the recipes for the items it covers and for any recipe it breaks, and captures them once the
owner has approved the change: see "Catalogue screenshots" in `docs/build-plan/ROADMAP.md`. In a build
phase the app changes are the phase's own, and the session may start root `npm run dev` itself if the
servers are down; every other rule below still applies.

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
- For per-row or per-item values, add a stable suffix, for example `availability-mine-am`, or
  set the attribute only on the row that matters:
  `data-shot={isMine ? 'availability-row-mine' : undefined}`.
- Before adding one, grep for an existing `data-shot` or `data-testid` you can reuse.

Hooks already added:

| Hook | Where |
|---|---|
| `integrations-raw-hl7`, `integrations-fhir`, `integrations-schedule-change`, `integrations-replay` | `/demo/integrations` |
| `availability-row-mine`, `availability-change-mine` (its "Change" link) | `/web/availability` |
| `availability-mine`, `availability-mine-am`, `availability-mine-pm`, `availability-change`, `availability-open-calendar` | `/mobile/availability` (Find cover's My availability card; the Free and Block buttons and `availability-block-*` were removed in catch-up Phase 29) |
| `mobile-availability-calendar`, `mobile-availability-grid` (the month), `mobile-add-days-off`, `mobile-availability-series`; day cells `button[data-date=YYYY-MM-DD]`, half-blocks `[data-slot-id]` with `title="AM Holiday"` | `/mobile/availability/calendar` (catch-up Phase 29) |
| `mobile-availability-sheet` (the bottom sheet), inside it `availability-session-panel`, `availability-series-line`, `availability-series-confirm`, `availability-form`, `availability-result`, status chips `[data-status-choice=<id>]`, weekday chips `[data-weekday=1..7]` | The availability sheet (mobile) |
| `web-availability-mine`, `web-availability-rail`, `web-availability-rail-empty`, `web-availability-series`; day cells `button[data-date=…]` | `/web/availability/mine` (catch-up Phase 29) |
| `admin-availability-statuses` (table, rows `tr[data-status-row=<id>]`), `availability-statuses-list-types`, `admin-availability-status-sheet` (`status-sheet-id`, `status-sheet-preview`, swatches `[data-swatch=<token>]`), `admin-availability-status-retire` | `/admin/masters?view=availability-statuses` (catch-up Phase 29) |
| `scenario-s1` to `scenario-s5`, `scenario-confirm` | `/demo/control`, used by the `scenario` step; after a jump `scenario-result`, `scenario-beats`, `scenario-beat-<n>`, `scenario-beat-<n>-steps`; each block `[data-scenario=Sn]` (see [Scenario jumps](#demo-control-panel-democontrol-and-demo-actions)) |
| `demo-actions` | The harness bar's "Demo actions" pill (only on screens with entries), used by the `trigger` step |
| `demo-action-<id>` | One row of that menu, with its Run button and `role=status` result line |
| `control-demo-index`, `index-<id>` | `/demo/control`: the "Demo actions by screen" index and each entry's row ("Open screen") |
| `pwa-demo-actions` | The PWA's amber "Demo" chip (mobile shots on :5174), shown only on screens with PWA entries; hidden in shots except while a `trigger` step runs |
| `pwa-demo-action-<id>` | One row of the PWA's Demo sheet, with its Run button and `role=status` result line, e.g. `office-authorises-list` on a submitted List |

## Selector tips (learned the hard way)

- `ResultLine` keeps an always-mounted `role="status"` (empty and visually hidden until its text arrives), so scope `[role=status]` by `data-shot`.
- **`text=Foo` is a case-insensitive *substring* match.** It happily hits a paragraph that
  mentions "foo". Use one of these instead:
  - `text="Foo"`, the exact form: note the inner quotes, escaped in JSON as `"text=\"Foo\""`.
  - `role=button[name="Foo"]`.
  - A `data-shot` hook.
- Tabs and segmented controls are usually plain `<button>`s, not `role=tab`.
- **Page switches are links (UI unification U5).** The web "Availability page" switch (Find cover, My availability),
  the Admin Draft Lists tabs (Unassigned, History) and the AA fees tabs are links in a named navigation:
  `role=navigation[name="Availability page"] >> role=link[name="My availability"]`, `[data-draft-tab=history]`,
  `role=navigation[name="AA fees"] >> role=link[...]`. The current one carries `aria-current=page`, not `aria-selected`. Segmented controls (Admin Day's "Row order", the web "Anaesthetists
  shown" pills, the phone's "Show Lists" and "Balance section") stay `role=group` holding buttons with `aria-pressed`.
- **Navs (U5):** the Admin side nav is `nav[aria-label="Admin"]`, the web nav `nav[aria-label="Main"]`, the phone tab bar
  `nav[aria-label="Main"][data-testid=mobile-tab-bar]`; their items are still buttons, the active one with `aria-current=page`.
- Many labels repeat, such as "Reset demo data" (harness and inspector), "Lists" (tab and back
  button) and "Replay". Scope them, for example `[data-testid=integration-inspector] >> text="Reset demo data"`,
  or use `>> nth=0`.
- **Highlighting a row or card with no hook: add a `data-shot`.** Don't write a long xpath.
- A **dialog or sheet** is `[role=dialog]`. On mobile, scope it as `[data-aa-mobile-product] [role=dialog]`.
- **UI unification Phase U2:** `[role=dialog]` now also matches the Admin drawers (they are `<aside role="dialog">`
  named by their title). When a drawer is open and a sheet opens from it, scope the sheet: prefer the sheet's
  own `data-shot`, else `[role=dialog]:not([data-testid=admin-list-drawer])`. The capture highlight unions every
  visible match, so a bare `[role=dialog]` highlight taken while a drawer is open grows to cover the drawer too.
- **"Close" is no longer unique.** `[data-testid=admin-list-drawer] >> role=button[name="Close"]` stays unique, but a bare
  `role=button[name="Close"]` can now also match a web dialog's corner X. Scope it.
- **UI unification Phase U4 (fields):** selects stay native `<select>`s, so the `select` step (`selectOption`)
  works as before, and positional `select >> nth=N` inside a sheet keeps its order. A field's `shot` sits on
  the `<select>` itself (`[data-shot=assign-hospital]`, `select[data-shot=surgeon-picker]`); SelectField's
  `labelShot` (`contract-holder-filter`, `contract-tag-filter`) sits on its wrapper `div` (it was a `label`),
  so reach the control as `[data-shot=X] select`. Date and time inputs stay native, one input per date,
  in the order they stand (From before To, Starts before Until), so `input[type=date] >> nth=N` holds.
  Ticks are the shared Checkbox (a real `input type=checkbox` inside its own `<label>`); hooks such as
  `admin-notifications-show-resolved`, `move-booking-tell-office`, `payer-different-tick` and
  `payer-offer-row` sit on a wrapper `div` around it, so `[data-shot=X] input` still finds the box.
- **UI unification Phase U6 (tables, cards, label rows):** table shells are `shared/table/TableShell` and cards
  `shared/ui/Card`. A shell's hook is on the scroller `div`, so `[data-testid=X] thead th:nth-child(N)` and
  `[data-testid=X] tbody tr` still reach in; a hook passed as `tableData` is on the `<table>` itself
  (`[data-shot=web-lookback-day] tr[data-list-id]`). Column headers are `th[scope=col]`; a group row is
  `tr:has(th[scope=colgroup])`, so `tbody tr:has(td:nth-child(N))` skips it. A card is a `section` named by its title,
  so `section:has(h2:text-is("Title"))` finds one (the web panel titles were `div`s before U6). A label and value row
  is `dl > div > dt + dd`: highlight a row by its label as `div:has(> dt:text-is("Label"))`, never
  `div:has(> span:text-is(...))` or `span + span` (the invoice totals, `div:has(> span:text-is("Subtotal"))`, are not
  `DefRow` and keep their spans). A clickable row's keyboard handle is one named button inside it, such as Draft
  Lists' "Open Draft List ..."; a bare `role=button[name="Open"]` is a substring match and can now hit it, so scope
  it or use `name=/^Open$/`.

- **Admin Booking detail is a draft (catch-up Phase 35).** Every sheet opened from the Admin Booking detail
  (Edit patient, insurer or funder, Change price, Paid by, the Contract rail and the rest) applies to the page's
  draft: its primary reads **Apply** there (`role=button[name="Apply"]`, scoped to the sheet), not "Save details"
  or "Save". Hooks such as `pricing-sheet-save` and `paid-by-save` keep their names but now apply. Nothing is saved
  until **Save changes** in the bar, `[data-shot=booking-save]`; wait for `[data-shot=booking-saved-strip]` after it.
  A recipe that needs the saved state (History, the Audit viewer, Invoices, another app, a `goto`) presses it
  first: a `goto` with unsaved changes meets the browser's leave prompt, and an in-app link the
  `leave-without-saving` dialog. The web and mobile Booking screens, and the Admin List drawers, still save at once.
- **History rows are grouped (catch-up Phase 35).** A save, a create, a cancel, a move, a List's change of
  anaesthetist and a hospital row applied each show as one row `[data-shot=history-change-set]`
  (`data-change-set-id=CS0001`; titles "Saved by Kirsty W.", "Updated from the hospital's list", "New anaesthetist on
  the List"), the field changes beneath it. Pick one by its title, for example
  `[data-shot=history-change-set]:has-text("Updated from the hospital")`. Open the Booking's History with
  `[data-shot=booking-history-button]` rather than `role=button[name="History"]` (a substring match).
- **"Close the week" is in the payment cycle twice (catch-up Phase 39a).** The Billing monitor's step rail labels its
  first step "Close the week" (`[data-shot=payment-cycle-step-1]`), and the button that closes it says the same, so
  `role=button[name="Close the week"]` or `text="Close the week"` can hit the rail. Use the hooks:
  `[data-shot=payment-cycle-close]`, then `[data-shot=payment-cycle-approve]` ("Approve week 30's BCTIs", its name
  carries the week), `[data-shot=payment-cycle-send]` and `[data-shot=billing-run-payables-in-xero]`. Each button
  appears only once the step before it is done, so `wait` for the next hook between clicks.

## Personas and IDs

**Personas**

- **Anaesthetist, web and mobile:** Dr Melanie Souter, initials MS, anaesthetist ID `34821`.
- **Admin, and every `/demo/*` page:** Kirsty W., office staff. Catch-up Phase 35 adds a second named office user,
  Sam T.: the `switch-office-user` trigger (Day view and Booking detail) switches the Admin app between them, so two
  users' saves show named in one Booking's History.
- **Patients keyed on NHI** (catch-up Phase 40; `/admin/patients/<NHI>`): Sarah Mitchell `CQY9304` (the strong
  balance case: Dr Sharma's AA-2026-HS01, $610.00 raised 14 Apr, 98 days, billed to her, unpaid; also HS02 $540 paid),
  Losa Tuilagi `JKL1188` (Sharma $380 unpaid, a returning patient: the Add NHI match), Heather Sinclair `ZAN2219`
  (the credit case: Sharma AA-2026-HS05 $260.00 paid, then credited; reads "In credit $260.00", a mild yellow
  warning), Noah Prescott `ZAP3016`. Fixture NHIs the triggers add: Aroha Ngata `ZQA3019` (a new patient),
  Tomasz Nowak `ZQE4017`, Priya Raman `ZQE4025`, Ana Fifita `ZQE4033`. Valid unused NHI for a recipe that
  types one: `ZZZ9005` (the seed never makes `ZZZ` NHIs; every Add a booking recipe that saves must type one).
- **The NHI register** (catch-up Phase 40a; the simulated Digital Services Hub answers from it). It mirrors every
  seeded patient (Sarah Mitchell `CQY9304` is found), plus register-only NHIs that no record holds: Mereana Tipene
  `ZBR4417` (born 9 Mar 1981), Lucas Brennan `ZBT2253`, Ana Fifita `ZBX41AL` (a new format NHI: the found line adds
  "New format NHI") and Demo Patient `DEM1239` (with a phone and ethnicity, the Admin Day phone-advice example).
  `ZBW6638` is a valid NHI that is not on the register ("No one with NHI ZBW6638 is on the NHI register ...");
  `ZAA0068` fails its check digit ("The check digit does not match.", Look up disabled). Fiona Gray (internal
  `PT0018`, never in a URL; record `/admin/patients/ZAM1098`) is on the register as Fiona Tamihana at 5 Kowhai Lane,
  Halswell, Christchurch 8025: Refresh from NHI register on her record shows her name and address as differences
  (Keep or Use register each). Every other seeded patient refreshes with "On the register and on this record,
  nothing to change."
- **Other registration numbers:** Rutherford 29104, Ropata 39560, Delaney 27731, Morrison 25490,
  Whitaker 36208, Sharma 41267, Chen 45178, Hughes 46822, Strand 47733, Ngata 38455.
- **Surgeons** (catch-up Phase 17): `S-HALE` Mr T. Hale, `S-REID` Ms A. Reid, `S-WHITFORD` Mr J. Whitford
  (see the seed for the rest). HPI CPNs `40HALT` to `49CAMH` (Reid `47REIA`); Dr Sharma's own HPI CPN is
  `12SHAP`. No rooms since catch-up Phase 17b: a surgeon holds a practice name and office contacts
  (`S-REID`: practice Merivale Eye Rooms, office contact bookings@merivaleeye.example, personal contact
  a.reid@surgeons.example). Groups `SG-COS` Canterbury Orthopaedic Surgeons (Hale), `SG-EYE` Christchurch
  Eye Surgeons (Whitford, Reid). Runtime ids: surgeons `SN001`, groups `SGN001`,
  pairing entries `PPN001`.

**IDs**

| Kind | Format | Notes |
|---|---|---|
| Session | `S-<anaesthetistId>-<YYYY-MM-DD>-<AM\|PM>` | Catch-up Phase 28: every active anaesthetist's AM and PM session, stored, free by default. Grid blocks, mobile rows, web Lists rows and web availability cells carry `data-slot-id`. The UI never says "slot". |
| List (seeded or projected) | `L-<anaesthetistId>-<YYYY-MM-DD>-<AM\|PM>` | From `projectedListId`: names the session the List was born in (a reassigned List keeps it), never parsed. For example `L-34821-2026-07-21-PM`. Only sessions holding a List have one: a Free session has no `L-` id. |
| List (runtime) | `LG0001`… | Created by Assign List, Book (phone advice) and the PWA stand-in, and by New Draft List (the Draft List keeps its id when assigned). |
| Draft List | `LD-001`… (request), `LD-<RCBnnn>-<date>-<session>` (recurring clash) | Seeded Draft Lists (catch-up Phase 31). Unassigned until the office assigns an anaesthetist; runtime ones are `LG####`. |
| Booking | `BK0001`… | Seed order. `BK0001`..`BK0005` are Souter Tue 21 AM (BK0001 Hemi Walker). `BK0006` Wiremu Tane, `BK0007` Susan Marsh, `BK0008` David Chen, `BK0009` **Margaret Ellison** (pending). Verify with one run. |
| History Booking | `HBK01`… | The billed history backdrop (Lists `L-HIST-NN`, Procedures `HP`, cases `HBC`). Before catch-up Phase 15 these were `HC01`…. Catch-up Phase 38a appended `HBK14` to `HBK42` on twelve Lists keyed by date and session, `L-HIST-2026-01-12-PM` to `L-HIST-2026-03-27-AM`, all paid before April. |
| Pinned history List | `L-HIST-2026-03-13-AM` | `SEED_LOOKBACK`: Fri 13 Mar 2026 AM, St George's, Mr P. Doyle, three Bookings (Sarah Mitchell `HBK36`), invoices `AA-2026-H36` to `H38`, paid. |
| Invoice | `INV0001` / `AA-2026-0001` | `INV0001` is Priya Nair's seeded paid pre-payment: $1,200.00 plus GST = $1,380.00, approved by Kirsty W. Riley's, once approved on the Invoices strip, is the next runtime invoice. Runtime invoices otherwise start at `INV0002` once a list is authorised. |
| Xero pair | `XRB0` | The seeded pre-payment: its ACCPAY (`XPB0`) credits the "AA Holding account" (contact `XCHOLD`), not the anaesthetist, and is held, never disbursed itself; authorising Nair's List transfers it to Dr Souter (catch-up Phase 27a: transfer `PXT0001`, journal `MJ-0001`). History pairs are `XRH01`… and runtime pairs `XR0001`…. |
| Credit note (catch-up Phase 39) | `CRN0001` / `CN-2026-0001` | None at reset. The first one issued (Approve, then `run-next-billing-run`) is record `CRN0001`, number `CN-2026-0001`, page `/admin/credit-notes/CRN0001`; its negative invoice to the anaesthetist is `CN-2026-0001-P`. The rebill and split components are ordinary runtime invoices (`AA-2026-....`). |
| Staged combination (catch-up Phase 39) | `BK0191` / `P0198` / AA-2026-0002 | `stage-combined-procedure` right after a reset: Lorraine Petrie (`PT0173`) on Dr Delaney's Fri 10 Jul PM List `L-27731-2026-07-10-PM` at Forte, $3,700.00 plus GST = $4,255.00, billed to the patient. Another runtime Booking or invoice first shifts these numbers: pick the row by patient. |
| Anaesthetist credit target (catch-up Phase 39) | `HBK03` on `L-HIST-03` | Dr Souter, David Chen, Mon 22 Jun 2026, invoice AA-2026-H03: web `/web/lists/L-HIST-03/bookings/HBK03`, mobile `/mobile/lists/L-HIST-03/bookings/HBK03`. |
| Prepayment letter template (catch-up Phase 41) | `LT001` to `LT003` (a new template takes the next `LT` number) | Seeded, one default per kind: `LT001` "Standard prepayment letter" (request), `LT002` "Prepayment reminder" (reminder), `LT003` "Anaesthetist changed" (the optional patient email). Rows `tr[data-letter-template=<id>]` on `/admin/masters?view=prepaymentLetters`. `INV0001` (Nair) was sent with `LT001`. |
| Prepayment refund (catch-up Phase 41) | `RF0001`…; Xero refund `XRF0001`… | None at reset. Raised by the system on cancelling a paid prepaid Booking, on a payment that arrives after its credit note, and on a Contract change off prepaid after sending. The cancellation's credit note is the first `CN-2026-0001` after a reset (issued at once, no review). |
| The two prepaid Bookings (catch-up Phase 41) | Riley `BK0034`, Nair `BK0038` | No separate "refund Booking" is seeded: Nair (`INV0001`, paid $1,380.00, held) is the paid cancel and the paid Contract change; Riley, once Approve and send is done on `/admin/invoices`, is the sent-but-unpaid cancel, the reminder and the moved prepaid Booking. |
| Rebook target (catch-up Phase 41) | Dr Sarah Beaumont `31902`, `CT-BEAUMONT-RHINO`, `L-31902-2026-08-04-PM` | Her prepaid Rhinoplasty Contract ($1,350.00 ex GST) on her ACTIVE Tue 4 Aug PM List at Forte Health with Mr V. Nand (ENT). Her Mon 27 Jul AM List `L-31902-2026-07-27-AM` (St George's, orthopaedics) offers no price of hers for it. |

**Named lists** (`SEED_LIST_IDS`)

| List | ID | What it is |
|---|---|---|
| Souter Tue 21 AM | `L-34821-2026-07-21-AM` | St George's, Mr T. Hale. 5 complete bookings, ACTIVE. |
| Souter Tue 21 PM | `L-34821-2026-07-21-PM` | Southern Cross, Ms K. Patel. 4 bookings, Ellison pending, ACTIVE. |
| Morrison Mon 20 | `L-25490-2026-07-20-AM` | SUBMITTED. 6 complete and 1 cancelled. |
| Whitaker Fri 17 | `L-36208-2026-07-17-AM` | SUBMITTED. |
| Souter Mon 13 AM | `L-34821-2026-07-13-AM` | SUBMITTED (catch-up Phase 23). Forte Health, Mr C. Okafor. One Booking: the three-procedure `BK0184` (Graeme Tullett), in the Review queue. |
| Souter Mon 20 AM | `L-34821-2026-07-20-AM` | SUBMITTED. Forte Health, Brian Holt's two Procedures on one invoice (`BK0022`: the inguinal hernia repair the primary, the umbilical hernia repair additional). Authorised first, it raises AA-2026-0002 to 0004. |
| Souter Mon 20 PM | `L-34821-2026-07-20-PM` | SUBMITTED. The fee-split Booking: Alan Prentice (`BK0025`), one Procedure's fee split between nib ($132.50) and Alan Prentice (the rest); see [Invoice presentation, delivery and the split](#invoice-presentation-delivery-and-the-split-catch-up-phase-22). Dr Souter can still change it (catch-up Phase 38a): "Amend" on a Booking makes Review show "Changed since submitted" and disables Authorise until it is completed again. |
| Souter Fri 24 AM | `L-34821-2026-07-24-AM` | Pre-payment **awaiting approval** (Annette Riley, `BK0034`, no invoice yet). |
| Souter Fri 24 PM | `L-34821-2026-07-24-PM` | Pre-payment **paid** (Priya Nair, `BK0038`, `INV0001`); mixed Booking. |
| Ropata Thu 16 | `L-39560-2026-07-16-AM` | SUBMITTED. The billing-failure target (Losa Tuilagi BK0039 waits for Xero in the sync queue, Hemi Walker BK0040 bills). |
| Delaney Fri 17 | `L-27731-2026-07-17-AM` | SUBMITTED. Integration-locked target. |
| Souter Tue 28 AM | `L-34821-2026-07-28-AM` | The S1 destination: creating `SAMPLE_STG` R1 on Matching (Import hospital file, then the decision; catch-up Phase 34 dropped the MSG-STG-1001 path) adds Sarah Mitchell; her Contract is answered on the rail, No contract · RVG. Its 07:45 and 11:15 cases read as the rooms sent them (AR-35 rows 6 and 8); Sarah Mitchell arrives with "lap appy ?conv to open" (Hospital feed). |
| Souter Tue 4 Aug AM | `L-34821-2026-08-04-AM` | Targets for S13, S14 and S15. |
| Souter Mon 3 Aug PM | `L-34821-2026-08-03-PM` | Source list for the S13 move. |
| Souter Mon 10 Aug PM | `L-34821-2026-08-10-PM` | St George's, Ms G. Lim, ACTIVE. Merivale's Face lift BK0163, and catch-up Phase 21a's BK0176 (fixed price, no times), BK0177 (Needs a price) and BK0182 (the movable Booking). |
| Souter Mon 10 Aug AM | `L-34821-2026-08-10-AM` | Mr C. Okafor, ACTIVE. The Move target for BK0182 (US-04.3.11). |
| Chen Tue 14 Jul (`reviewFlags`) | `L-45178-2026-07-14-AM` | Christchurch Eye Surgery, Mr Whitford, SUBMITTED. The review-flags List (catch-up Phase 21a): BK0178 to BK0181. |
| Delaney Fri 10 Jul PM | `L-27731-2026-07-10-PM` | Forte, ACTIVE at reset. Catch-up Phase 39: `stage-combined-procedure` books, completes, authorises and bills the Merivale combination (Lorraine Petrie) here; the trigger is disabled once the List is no longer open. |
| Sharma Tue 14 Jul AM | `L-41267-2026-07-14-AM` | Catch-up Phase 38b's `stage-post-op` List (Sarah Mitchell `BK0032`); since catch-up Phase 39 her invoice is the office's credit and rebill target (see [Credit notes](#credit-notes-credit-and-rebill-and-the-combined-split-catch-up-phase-39)). |
| Souter Wed 15 Jul PM (staged) | runtime (`L000n`) | Catch-up Phase 39b: not in the seed. `stage-post-op` assigns it (St George's, Mr T. Hale, session `S-34821-2026-07-15-PM`) and adds Coral Bennett's ACL reconstruction on St George's ACC (`CT-STG-ACC`), completed and SUBMITTED. Its List and Booking ids are runtime: reach it by search (see [Pre-op, post-op and billing events](#pre-op-post-op-and-billing-events-catch-up-phase-39b)). |

**Seed markers** (`SEED_MARKERS.<key>.entityId`, `aa-prototype/src/domain/seed/index.ts`), catch-up Phase 21a:
`fixedPriceNoTimes` BK0176, `needsPriceBooking` BK0177, `contractChangeBooking` BK0178, `typedPriceBooking`
BK0179, `reviewNeedsPrice` BK0180, `otherSurgeonContract` BK0181, `movableFixedBooking` BK0182. The List is
`SEED_LIST_IDS.reviewFlags` (`L-45178-2026-07-14-AM`). Catch-up Phase 22: `feeSplitBooking` BK0025 ("One
procedure's fee split between nib and the patient"; it replaces `twoFunderBooking`). Catch-up Phase 23:
`multiProcedureBooking` BK0184 ("Three procedures, 7 modifier units, split 3 · 2 · 2"; see
[The primary Procedure and the multi-procedure rule](#the-primary-procedure-and-the-multi-procedure-rule-catch-up-phase-23)).
Catch-up Phase 24 (see [Change price and the price line](#change-price-and-the-price-line-catch-up-phase-24)):
`contractRateBooking` BK0029, `contractRateCaptureBooking` BK0037, `contractRateContract` `CT-ARIA-HOURLY`,
`discountContract` `CT-FORTE-DISC`, `discountBooking` BK0185, `priceCaptureBooking` BK0186, `ownListFixedBooking` BK0034,
`openPriceBooking` BK0177 (the same Booking as `needsPriceBooking`), `rangeTypedBooking` BK0187, `rangeAuthorisedBooking`
BK0188, `rangePrepaidBooking` BK0038, `noChargeBooking` BK0189. GONE: `rateTimeBooking`, `rateTimeCaptureBooking` and
`individualArrangementContract` (renamed to the `contractRate*` markers).

## Routes

Everything on :5173 sits under the harness bar, which the runner hides in every shot.

Booking routes use `/bookings/:bookingId` (catch-up Phase 15). An old `…/cards/C0009` URL still
redirects, with replace, to `…/bookings/BK0009`, but recipes should use the new form.

Catch-up Phase 35 moved the framed app to a data router (`createBrowserRouter` in `src/router.tsx`, so the
unsaved-changes guard can block a navigation). No URL changed; the Admin Booking route is still
`/admin/day/:dateISO/bookings/:bookingId`. The PWA keeps its own router.

**Web app** (`src/apps/web/`)

| Route | Shows |
|---|---|
| `/web` | Dashboard: "Kia ora, Dr Souter", week strip, then "Financial position" (`web-financial-position`, catch-up Phase 38: tiles Owed to you, Collected, Paid out to you; footer "N unpaid invoices · $X awaiting collection · $Y due to you now · View outstanding invoices · View payments") beside "Who's free · next 5 days". The receivables ageing, Productivity and Leave panels are gone (Phase 38). The bar's `web-payment-full` and `web-payment-half` run here. Add `?week=YYYY-MM-DD` (a Monday) to show another week. |
| `/web/lists` | The web main view (catch-up Phase 38a): "Earlier, not yet authorised" first (`web-main-view-earlier`, Mon 13 Jul AM, then Mon 20 Jul AM and PM; catch-up Phase 23 added Mon 13, so pick a row by `tr[data-list-id=...]`, never `>> nth=0`), then "From today"; a Progress column (`[data-progress=submitted]` etc.); no From input, only To. Title row: the search pill (`[data-testid=web-lists-search]` on the `<input>`, `role=searchbox[name="Search your Bookings"]`; its X is "Clear the search field") and "Go to date" (`[data-testid=web-lists-go-to-date]` on the date input, inside a `<label>` "Go to date"). `?q=` shows the results table (`web-lookback-search`, rows `tr[data-booking-id]`, "Clear search"); `?day=YYYY-MM-DD` the day table (`web-lookback-day`, rows `tr[data-list-id]`). Back from List and Booking detail returns to the same `?q=` or `?day=` (location state). |
| `/web/lists/:listId` | List detail: header, bookings table, "Add a booking", submit action. A SUBMITTED List stays editable (catch-up Phase 38a). An AUTHORISED List shows "Invoiced · read only" (`list-authorised-status`), an Invoiced column in place of Units and Fee, and the Invoices panel (`list-invoices`). |
| `/web/lists/:listId/bookings/:bookingId` | Booking detail with capture: RVG code, times, units and the itemised modifiers, booking total, "Mark complete". On her own ACTIVE List dated today or later, "Move to a colleague" (`move-booking-action`) sits above Cancel booking and opens the single-Booking move as a dialog (catch-up Phase 32a). A Booking a colleague handed her shows "Moved to you by" (`booking-moved-to-you`). |
| `/web/availability` | Find cover: the practice availability grid. `?date=YYYY-MM-DD` opens a day (catch-up Phase 32). Free cells read "Free · Open for booking". Dr Souter's own movable List cells show "Move" (`availability-move-mine-am`/`-pm`), and a colleague's free cell in a session where she has a movable List shows "Move here" (`availability-move-to-<registration>-am`/`-pm`); every other cell is inert. A "Moved to you" panel (`moved-to-you`) shows above the filters when a colleague moved a List to her this week. The "Find cover · My availability" switch (UI unification U5) is a navigation of links, `role=navigation[name="Availability page"]` holding `role=link[name="Find cover"]` and `role=link[name="My availability"]` (the current one has `aria-current=page`), on both pages; it is no longer a group of buttons. The day steps stay `role=button[name="Previous day"]`/`"Next day"`; the filter pills are `role=group[name="Anaesthetists shown"]` with buttons "All anaesthetists" and "Free only · N" (match "Free only" by `button:has-text("Free only")`). The "(you)" row's "Change" link opens My availability on that date. |
| `/web/availability/mine` | My availability (catch-up Phase 29): Dr Souter's month (AM and PM per day), click a day and shift-click to a range; the right rail holds the session panel and the form, then "Your series" and the legend. `?date=YYYY-MM-DD` opens a day in the rail (the capture runner has no shift-click: open `?date=`, click "Change both sessions" and fill the To date for a range). |
| `/web/accounts/outstanding`, `/web/accounts/payments`, `/web/accounts/gst`, `/web/accounts/fees` | Accounts tabs (catch-up Phase 38: Outstanding, Payments, GST report, AA fees, links in `role=navigation[name="Accounts"]`). `/web/accounts` and the retired `/web/accounts/overdue` redirect to `/web/accounts/outstanding`, keeping the query; there is no Overdue tab, ageing column or bar. Outstanding is `web-accounts-outstanding`: columns Invoice date, Invoice, Patient, Billable party, Stage, ACC, Outstanding to you, oldest first; rows `tr[data-testid=outstanding-row-<invoiceNumber>]` with `data-booking-id`; Stage reads "Awaiting payment", "Part paid in" or "Paid in, due to you" (a paid-in row stays until AA pays out); clicking a row (or its invoice number button, "Open the Booking for ...") opens `/web/lists/<listId>/bookings/<bookingId>`; footer "Total outstanding" `[data-testid=outstanding-total]`. After the S3 AM authorise, `web-payment-full` (no choice: it defaults to the first open invoice, AA-2026-0002) turns `outstanding-row-AA-2026-0002` "Paid in, due to you". Add `?invoice=AA-2026-0005` to focus a payment, which exists only after S3 billing. AA fees (catch-up Phase 16) lists Dr Souter's AA fee invoices; `?invoice=AA-FEE-2026-H02` focuses one. |
| `/web/accounts/gst` (catch-up Phase 26) | The GST tab has no period switch (the GST period is retired): a calendar month, caption `gst-month` "Month (1 Jul to 21 Jul 2026) ...", footer "Month total". Never click a Segmented here. |
| `/web/accounts/gst` (catch-up Phase 38) | The tab is the GST report (the "GST activity" view is gone): the payments AA passed to the anaesthetist in a calendar month, dated by disbursement, never by receipt. Month picker `select[data-shot=web-gst-month-picker]` (label "Month", values `2026-07` down to `2026-01`, text "July 2026" etc., default July 2026; June 2026 has seeded payouts; pick with the `select` step); actions `web-gst-actions` (Download, Print, Email to me; Email to me shows `web-gst-email-sent` "Sent to ...: the GST report for July 2026."); caption `gst-month` ("July 2026 · GST on a cash basis: ..."); `web-gst-not-yet-paid` ("$X collected by AA is not yet paid to you ...") only while a receipt waits for the payout; table scroller `web-gst-report`, rows `tr[data-testid=gst-report-row-<invoiceNumber>]`, columns Date paid, Invoice, Billable party, Paid to you (incl GST), GST component, Paid ex GST, footer "Month total". A payment alone adds no row; the payout does. |
| `/web/accounts/*` (catch-up Phase 36) | Every Accounts tab has the "Your position" strip `web-accounts-position` above the sub-tabs: AA owes you (with "Due now ..., which AA holds for you; awaiting collection ..."), Collected for you, Paid out to you, You owe AA (its link "Your AA fee invoices" opens the AA fees tab). Since catch-up Phase 38 the strip's labels read Owed to you, Collected, Paid out to you, You owe AA, and the Outstanding caption reads "One row per invoice not yet paid to you, oldest first. A row stays until AA pays you. For a question about a line, contact the office." Outstanding also lists the seed's AA-2026-S2401 ($3,565.00, Thu 16 Jul PM). |
| `/web/accounts/remittances` (catch-up Phase 39a) | Accounts' Remittances tab (between Payments and GST report): Dr Souter's remittance advices, one per weekly payment run, newest first, in the card `web-remittances` (rows `tr[data-run-id]`, columns Week, Paid on, BCTIs, Netted, Paid to you, Status; on a fresh seed the first row is Week 29). Clicking a row opens the sheet `web-remittance-sheet` (title "Remittance advice · Week 29", the advice inside as `web-remittance-advice`). `?run=<runId>` marks that run's row. The panel `web-still-to-net` shows above the card only while she has a negative invoice still to net (never on a fresh seed). The anaesthetist apps are Dr Souter only, so Dr Sharma's staged advice is shot in Admin. |
| `/web/accounts/payments` (catch-up Phase 39a) | Under "Paid to you" each paid row shows the week it went out in, `web-payment-week` (for example "Week 29"), and a line held out of a run shows `web-payment-held-out` ("Held out of Week 30, paid in a later run."). |
| `/web/profile` | Your profile (catch-up Phase 26; `web-profile`), reached from the nav persona button `[data-shot=web-profile-link]` (aria-label "Your profile, Dr Melanie Souter"); the four nav tabs are unchanged. Panels: Billing `web-billing-panel` (field "Rate per unit ($)", "Save changes" `web-rate-save`, enabled only once the rate differs), Contact `web-contact-panel`, Identity `web-identity-panel` (Registration, HPI CPN), Bank account `web-bank-panel` (name, number masked `99-0101-•••••21-00`). Only the rate is editable; the rest carries lock glyphs. |

**Admin app** (`src/apps/admin/`)

| Route | Shows |
|---|---|
| `/admin` | Redirects to `/admin/day/2026-07-21`. |
| `/admin/day/:date` | Day grid of anaesthetists by time. The right rail has the mini calendar, "Internal notes" and "Awaiting review", and since catch-up Phase 37 the "Reconciliation" card `dashboard-reconciliation` (US-13.2.4; `data-status=square` at reset, "Books square"; "Out of balance" once something fails, with one `li[data-check-id]` per failing check, "off by $X", then the unresolved items `reconciliation-item`, each with its amount and age in days, oldest first; the caption `dashboard-reconciliation-proposed` "Proposed · ..."). Stage it with `goto /admin` then the `inject-unmatched-receipt` trigger. Add `?sort=az` for A to Z order. The toolbar is `[data-testid=admin-day-nav]` (see "Date navigation" under "Overlays that need clicks"); its row order is a segmented control, `role=group[name="Row order"]` with buttons "Roster order" and "A to Z" (`aria-pressed`). The header's date input is named "Go to date" (`[aria-label="Go to date"]`). |
| `/admin/day/:date/bookings/:bookingId` | Admin booking detail with "Office billing setup". A Booking created or changed from a hospital row links back to it (`booking-from-hospital-row`, opens Matching on that row); a newer hospital text waiting on Matching shows the cue `booking-newer-hospital-text` (catch-up Phase 33). Catch-up Phase 35: the page edits a **draft**. Every edit (sheets, the time steppers and the draft-only time input `booking-time-input`, notes, the Contract rail) waits as an unsaved change in the sticky bar `booking-save-bar` ("3 unsaved changes", the changed fields, Discard and Save changes) until `[data-shot=booking-save]` saves them as one change set; then the strip `booking-saved-strip` ("Saved · 3 changes · 08:00 · Kirsty W. CS0001"). The header's "Draft update email" `booking-update-email` is disabled with its reason `booking-update-email-reason` while there are unsaved changes or nothing saved yet. Leaving with unsaved changes opens `leave-without-saving` (see Overlays). Warnings and the prepayment panel read the saved Booking, so they change on Save, not while drafting. |
| `/admin/intake` | Admin Intake (catch-up Phase 34; `admin-intake`): redirects to `/admin/intake/matching`. The page header "Intake" sits over the tab strip `intake-tabs` (links, URL-routed: Matching, PDF lists, Data quality, Validators; the current one has `aria-current=page`), so never click a tab: open its route. The old `/admin/matching` and `/admin/integrations` redirect (replace, router state kept) to `/admin/intake/matching`. |
| `/admin/intake/pdfs` | PDF lists (catch-up Phase 34; product, unbadged): the rooms' PDF lists. "Upload PDF list" `pdf-upload-open` opens the dialog `pdf-upload`; the inbox table `pdf-inbox` (rows `tr[data-pdf-list-id=PDL0001][data-status=received|sent]`; columns Sent from, Surgeon, Hospital, Received, Suggested List, Rows, Status with a "Re-sent" pill on a re-sent list). A row click opens its review in place (`pdf-list-header`, rows `pdf-row-<n>`; "Back to PDF lists" returns). See "Rooms' PDF lists" under Seed data and the hooks under Existing hooks. Demo action `pdf-list-resend`. |
| `/admin/intake/quality` | Data quality (catch-up Phase 34): the data-quality items; at reset the empty card `data-quality-empty`. |
| `/admin/intake/validators` | Validators (catch-up Phase 34; was the Integrations Validators tab): the NHI validator `integrations-nhi-validator` (fill its `input`). No tab click. |
| `/admin/patients` | Patients (catch-up Phase 40; `admin-patients`): the search box `patient-search-box` and table `patient-search-table` (name, NHI or date of birth; empty state `patient-search-empty`); the other two views are routes, so open them directly: `/admin/patients/waiting` (Waiting for NHI, `admin-waiting-nhi`) and `/admin/patients/follow-up` (`admin-patient-follow-up`: `patient-threshold-line`, `patient-follow-up-warnings`, `patient-follow-ups-due`, `patient-details-review`). Side nav Patients carries its own count badge. |
| `/admin/patients/waiting` | Waiting for NHI (US-11.1.5): table `waiting-nhi-table`, one `waiting-nhi-row` per intake row (`data-row-id`, `data-urgent=true|false`) with the stub chip `waiting-nhi-stub`, the one address to chase `waiting-nhi-chase`, the pill `waiting-nhi-urgent`, `waiting-nhi-email` ("Email for the NHI", a mailto link), `waiting-nhi-add` ("Add NHI") and "Open on matching". Empty state `waiting-nhi-empty`. At reset it holds the seeded Mere Tipene (33a's `IRS001`); the bar's `receive-no-nhi-list` adds Aroha Ngata (urgent) and Losa Tuilagi. |
| `/admin/patients/:nhi` | Patient record (US-11.1.1, US-11.3.1, US-11.3.3, US-13.2.2; `admin-patient-record`, `data-patient-nhi`; keyed by NHI, no internal id): header NHI pill `patient-record-nhi`; cards `patient-details` ("Edit" opens the sheet, `patient-nhi-field`, with the Ethnicity code field and no required marker; rows show "Not supplied"), `patient-details-differ` (only when a returning patient's details differ; `patient-details-apply`), `patient-balance` (tiles, `patient-balance-strength`, and the By payer line `patient-by-payer`; "In credit $260.00" on Sinclair), `patient-warnings` (clear with `patient-clear-note`), `patient-invoices` (table across every anaesthetist, `patient-invoice-patient-tag` on those billed to the patient; row actions "Resend <number>" and "Log follow-up", then `patient-invoice-sends` rows listing each send), `patient-bookings` and `patient-follow-up-log` (the composer: Call, Note and Reminder buttons, textarea, `patient-follow-up-date`, `patient-follow-up-save`; entries below with who, when, invoice number). `ZAN2219` is the credit record. |
| `/admin/patients/:nhi` (catch-up Phase 40a) | The Details card gains the row `patient-register-row` ("NHI register"): the stamp `patient-register-stamp` ("Not refreshed yet", then "Last refreshed 21 Jul 2026, 08:00"), the button `patient-register-refresh-button` ("Refresh from NHI register") and the pill `patient-register-provisional` ("Provisional", title "On demand, to confirm with AA"). The button opens the panel `patient-register-refresh` inside the card: after the Hub's wait, its `nhi-lookup-status` reads "On the NHI register: <name>, <date of birth>.", then the table `patient-register-differences` (rows `[data-field=name]`, `[data-field=address]` and so on, each with a select, `[data-field=name] select`, options `keep` and `use` "Use register") or the line `patient-register-nothing`, the purpose note `nhi-purpose` ("the AA office"), `patient-register-apply` ("Apply", or "Mark refreshed" with nothing to change) and Cancel. Applied: `patient-register-done` "Refreshed from the NHI register." under the card. Fiona Gray, `ZAM1098`, is the record with differences (see Personas). |
| `/admin/masters?view=patientBalance` | Patient balance warning (`master-patient-balance-threshold`): the one field "Patient balance warning after N days" (default 90; 1 to 730), `patient-balance-threshold-field`. |
| `/admin/intake/matching` (was `/admin/matching`) | Matching (catch-up Phase 33; Kirsty W.): hospital rows waiting for the office. At reset it holds one seeded waiting row (Mere Tipene, no NHI, catch-up Phase 33a; see Stubs on a List below), so `matching-empty` no longer shows; stage rows with "Import hospital file" (`matching-import-open`, see Overlays) or the Demo actions below. Stat tiles `matching-stats` (`[data-stat=open|new|modification|cancellation|unmatched]`), the filter `[aria-label="Show rows"]` (options whose text starts "Open", "Unmatched", "Decided"), the table `matching-table` with rows `matching-row-<n>` (1-based, ready rows first, then import order). A row click opens its panel `matching-panel` (a right-docked SidePanel with a scrim: press Escape before clicking a row or the header). After an import the batch's first row's panel opens by itself. A row decided stays in place, dimmed, until the panel closes. |
| `/admin/notifications` | The shared notification pool (catch-up Phase 32; US-13.8.1): newest first, six a page, `?page=N`; the table `admin-notifications-table`, rows `[data-notification-row=NT0001]` with "Open List", "Open Draft List" or "Open Booking", the pager `admin-notifications-pager` (Newer / Older). Catch-up Phase 32b: notices are active or resolved; the page shows active ones by default, the count `admin-notifications-page-count`, each active row's tick `notification-tick` ("Resolve"), and the "Show resolved" checkbox `admin-notifications-show-resolved` (`?resolved=1`, kept with `?page=`); resolved rows carry `data-notification-resolved=true` and the line `notification-resolved-line` ("Resolved by Kirsty W., Tue 21 Jul 08:00"). An alert's note is `notification-alert-note`. The provisional caption is gone. Seeds empty: stage it with the `colleague-moves-list-to-office` trigger, or send an alert from a web Booking (same origin) and `goto` here. Catch-up Phase 35: a List handed on to a colleague carries "Draft cover-change email" `pool-cover-email` (the composer, To the hospital, the move ticked); a single Booking moved carries "Draft update email" `pool-booking-email`; a List returned to the office carries the hint `pool-returned-hint` ("Assign this Draft List first ..."). The `busy` choice of `colleague-moves-list-to-office` stages hand-ons, so `[data-shot=pool-cover-email] >> nth=0` finds one. Not on the Day rail card. |
| `/admin/draft-lists` | Draft Lists (catch-up Phase 31): Unassigned tab (default) and History (`?tab=history`). Since UI unification U5 the two tabs are links inside `role=navigation[name="Draft Lists"]`, not `role=tab`: `a[data-draft-tab=unassigned]` and `a[data-draft-tab=history]`, each with its count inside the link text (so match by the hook, not the name); the current one has `aria-current=page`. `?open=<listId>` opens the Draft List drawer (`admin-draft-list-drawer`); `?assigned=<listId>` shows the assigned confirmation with "Open List". The drawer's "Available that session" Assign opens step 2; the row's Assign opens step 1 (Everyone / Free only, tier filter, groups). "New Draft List" opens `admin-new-draft-list`. |
| `/admin/conflicts` | Conflicts (catch-up Phase 30): every live conflict, grouped by date (`section[data-conflict-date=<date>]`), one table each (`[data-shot=conflicts-table]` wraps them). Rows are `tr[data-conflict-row=<listId>]` (cleared ones add `data-conflict-cleared=true`). Row actions have accessible names with context (`Reassign, Dr Rutherford Wed 22 Jul AM`, `Clear conflict, ...`, `Open the List, ...`, `Open the day, ...`): match them by regex (`role=button[name=/^Clear conflict/]`). Hospital closures only since catch-up Phase 32b (no reason filter, no Availability column). Filters in the URL: `?when=twoWeeks|canvas|past`, `?hospital=<id>`, `?anaesthetist=<reg>`, `?cleared=1`. After a reassign or clear, `[data-shot=conflicts-confirmation]`. |
| `/admin/review` | Review queue, plus "Recently billed". Catch-up Phase 38b adds two tabs (links carrying `data-review-tab="lists"` and `"events"`): Lists is this queue. |
| `/admin/review?tab=events` (catch-up Phase 38b) | The Events tab: the events table body `admin-events-queue` (rows `tr[data-event-id=EV0001]`, status pill, party, amount, "Review" button). A row opens the `event-review-sheet` (`event-review-approve` "Approve for billing", `event-review-decline` with its reason). Catch-up Phase 39b: every kind is reviewed here, rows carry `data-kind` (`additional`, `preOp`, `postOp`, `billing`, credits), so pick one as `tr[data-kind=postOp]:has-text("Coral Bennett")`; a timed event's row reads the office's calculation ("30 min · 2 time units x $25.00 Contract rate = $50.00"), a Contract fee "Contract fee STGACC-PAIN · $120.00 replaces 30 min", an unpriced one `review-needs-price` ("Set a price"). The sheet adds `event-review-kind`, `event-review-price`, `event-review-set-price`, `event-review-office-price` and `event-review-needs-price`; after Approve it reads "Approved. Invoiced in the next billing run." (press Escape to close). The Review queue's row button is named `Review <anaesthetist> List, <source>, <Wed 15 Jul>`, so a runtime List opens by `role=button[name=/^Review .*Souter.*Wed 15 Jul$/]`. |
| `/admin/review/:listId` | Sanity check: total units, B · T · M, "Log phone note", "Authorise for billing". A Procedure that needs a price blocks it (`review-needs-price-blocker`, catch-up Phase 25); once authorised, the lock glyph in each Procedure stack, "(locked)" rate and "Paid to" line. |
| `/admin/invoices` | Invoice list (office pipeline only; the seeded history invoices are left out), newest id first. Columns: Number, Patient / booking (a link to the Booking), Anaesthetist, List (a link to the day), List date, Raised, Counterparty (a split share adds the "Split" chip `invoice-list-split`), Layout (Patient or Holder), Total, Delivery (`invoice-list-delivery`, `data-delivery` sent, toPost, noAddress), and "View →" (named "View invoice AA-2026-0005" since UI unification U6). Open an invoice with `[data-testid=invoice-list-table-shell] tr:has-text("AA-2026-0005") >> role=button[name=/^View invoice /]`: a bare row click can land on a row link. |
| `/admin/invoices/:invoiceId` | Tax invoice document (`.aa-invoice-doc`) with an info rail (catch-up Phase 22): Delivery (`invoice-delivery`), Related invoices on a split share (`invoice-related`), Xero handoff, and the Locked record (`invoice-locked-record`, catch-up Phase 25; migrated words on a history invoice) with the `regenerate-invoice` demo action. Any invoice id opens, the history ones too (`HINV13`). |
| `/admin/billing` | Billing monitor. Its AA fee invoices panel is `[data-shot=billing-aa-fee-invoices]`. The pipeline stage after Invoices generated reads "Sent or to post" (catch-up Phase 22); a List with an invoice that has no invoice address shows `monitor-no-address` ("1 invoice needs an invoice address." with the link "Add an address and send"). Restyled in catch-up Phase 37: see the next rows. |
| `/admin/billing` (catch-up Phase 37) | The processing monitor (US-13.3.1), top to bottom: the header (intro with no RFP placement caveat), the Xero line `billing-xero-connection` ("Connected", or "Xero unavailable since HH:mm · N waiting"), the four tiles `billing-monitor-tiles` (`billing-tile-awaiting`, `billing-tile-authorised`, `billing-tile-problems` (toggles Problems only), `billing-tile-payables`), the filter bar `billing-monitor-filters` (Anaesthetist and Hospital selects, From and To dates, the "All lists · Problems only" pills, the count `billing-monitor-count`, "Clear filters"), then the Xero panels (`billing-xero-queue`, `billing-xero-divergence` only when the poll has flagged something, `billing-payables-run`), the AA fee and AA Holding account panels, and last the groups: one `section` `billing-group-<anaesthetistId>` per anaesthetist by surname (Morrison `25490`, Ropata `39560`, Souter `34821`, ...), each with its "Awaiting approval" rows `billing-awaiting-<listId>` (button "Open in Review" `billing-open-in-review-<listId>`) above its authorised Lists. Each authorised List is a `tbody` `billing-pipeline-<listId>` holding its summary row (Date · session, Hospital, Status, Invoices, Sent, Xero, Paid in, Disbursed, Run) and, when expanded, a detail row with the stage strip and a nested Bookings table, rows `tr[data-booking-id]`; so `[data-shot=billing-pipeline-X] tr:has-text("Losa")` also matches the outer detail row: write `[data-shot=billing-pipeline-X] tr[data-booking-id=BK0039]` (or `tr[data-booking-id]:has-text(...)`). **Every authorised List opens expanded at seed scale** (12 or fewer authorised Lists in view), and a List with a problem always does. Search params (nothing is stored): `anaesthetist=<registration number>`, `hospital=<id>`, `from`, `to` (YYYY-MM-DD), `problems=1`, `sort=<date|hospital|status|invoices|run>-<asc|desc>`, `list=<listId>` (opens that List and scrolls to it, with a teal ring for 2s: add a `{ "wait": 2200 }` step so the ring is gone), and the view params `open`, `shut`, `fold`. Opening a List in Review from here gives Review the back link `review-back-to-billing`, which returns with the filters kept. The groups sit well below the fold (the Xero, AA fee and AA Holding panels come first), so a highlight that unions the tiles or filter bar with a group is taller than the viewport: highlight one or the other per state. |
| `/admin/billing/aa-fees` | AA fee invoices: month picker, the run preview (`aa-fee-preview-<anaesthetistId>` rows), the teal "Run monthly fee invoices" button and every fee invoice (`aa-fee-row-<number>`, expand for `aa-fee-detail-<number>`). |
| `/admin/billing/aa-fees/settings` | AA fee settings: fixed items, the charge per BCTI and the worked example (`aa-fee-example`). |
| `/admin/ledger` | Ledger (catch-up Phase 36; US-13.2.1, US-08.3.4): the Billing Engine's own ledger, AA's system of record. Header `ledger-system-of-record`; the "Scope" segmented control (`role=group[name="Scope"]`, buttons "Whole ledger" and "One anaesthetist"); the balance indicator `ledger-balance` (`data-in-balance=true|false`; "In balance · receipts held equal payables due" or "Out of balance by $120.00", its equation line, and one `li[data-check=<code>]` per failed check); the tiles `ledger-tiles` (Receivables outstanding, Receipts held, Payables due, Disbursed; then Awaiting collection, AA Holding account, AA fees outstanding, Not yet in Xero); "Anaesthetists out of balance" `ledger-anaesthetists-out-of-balance` (empty state "Every anaesthetist's ledger is in balance."; else a table, rows `tr[data-anaesthetist-id=<reg>]` with Open); "Receipts with no matching invoice" `ledger-unmatched` (only once an unmatched receipt exists; rows `tr[data-unmatched-id=UR0001]`, pill Held, "Allocated to ..." or "Refunded", actions `ledger-allocate` and `ledger-refund`); "Pairs" `ledger-pairs` with the filter `role=group[name="Which pairs"]` (buttons "Open", the default, and "All"); rows `tr[data-pair-id=<id>][data-pair-kind=procedure|prePayment|transfer|aaFee]`, columns Receivable, Payable, Kind, Patient, Payer, Payee, Amount, Received, Released, Paid out, Xero ("Mirrored", or the pill "Not yet in Xero", plus "Contact archived in Xero" under an archived payer); a row click opens its invoice (an AA fee row opens `/admin/billing/aa-fees`); `?pair=<id>` tints that row; then `ledger-footnotes`. |
| `/admin/ledger/anaesthetists/:anaesthetistId` | One anaesthetist's ledger (catch-up Phase 36; US-08.3.5): the same screen scoped, with the select `ledger-anaesthetist-select`; `ledger-balance` reads "Dr Souter's ledger is in balance" (or "... is out of balance by $120.00"); `ledger-tiles` (`data-shot-scope=anaesthetist`) holds `ledger-aa-owes` ("AA owes Dr Souter": Due now, Awaiting collection, Total), `ledger-owes-aa` ("Dr Souter owes AA": Unpaid AA fees) and the Collected for them and Paid out to them tiles; "Dr Souter's pairs" (no Payee column). No out-of-balance list or unmatched card at this scope. Dr Souter is `34821`; an unknown id redirects to `/admin/ledger`. |
| `/admin/invoices/:invoiceId` (catch-up Phase 36) | The rail's "Xero handoff" card is now the "Ledger" card `invoice-ledger-card` (no `h2` "Xero handoff" any more): `xero-handoff-status` reads "Mirrored in Xero", "Not yet in Xero", "Waiting for Xero" (catch-up Phase 37; then `invoice-waiting-for-xero` "The invoice and its ledger pair stand. Attempt N · next try HH:mm; the Xero sync queue retries it.") or "Voided in Xero · flagged" / "Amended in Xero · flagged" (then `invoice-xero-flag` with "Resolve in the Billing monitor" `invoice-open-billing-monitor`, to `/admin/billing?list=<listId>`); "Xero handoff failed" is gone. Then `ledger-receivable-number`, `xero-accrec-reference` (now the Xero ID, `XR...`), `ledger-payable-number`, `xero-accpay-reference` (`XP...`), on a prepayment `xero-accpay-payee` and `xero-transfer-journal-reference`, and the link "Open in the ledger" `invoice-open-ledger` (`/admin/ledger?pair=<id>`). The Xero ID rows show only once the pair is in Xero. |
| `/admin/billing` (catch-up Phase 36) | The intro added "Money in and out is recorded in the ledger first; Xero mirrors it." (catch-up Phase 37 rewrites the intro: "Every list awaiting approval or authorised, grouped by anaesthetist: ..."). The payables panel `billing-payables-run` reads "N payable(s) due · $X to pay out to anaesthetists. A payable is released for exactly what its invoice has received." (or "No payables due. ...") with the link "Open the ledger" `billing-open-ledger`. Catch-up Phase 37 replaces it: the panel is titled "Authorised, awaiting Xero's payables run" (read-only list, `billing-payables-due` "N payable(s) due · $X", rows `tr[data-payable-id]`; empty "No payables are awaiting the payables run."), and its button is "Run payables in Xero" `billing-run-payables-in-xero` with a Simulated Xero badge: Xero pays the bills and the engine records each disbursement from the bill-paid webhook; the result line is `billing-payables-result` ("Xero paid 1 bill ($x); the Billing Engine recorded 1 disbursement from the bill-paid webhooks."). The engine-side "Run payables" and its "Run PR0001" line are gone. |
| `/admin/integrations` | Redirects to `/admin/intake/matching` (catch-up Phase 34). Its tabs are gone: Surgeon PDFs, Data quality and Validators are Intake routes; the Messages log and Feed config moved to the Future-scope pages `/demo/integrations/log` and `/demo/integrations/mapping`. |
| `/admin/masters/surgeons/:surgeonId` | Surgeon profile (`surgeon-profile`, catch-up Phase 17b): cards `surgeon-specialties`, `surgeon-identifiers`, `surgeon-groups`, then the full-width `surgeon-contacts` ("Practice and contacts": Practice `[data-practice]`, `surgeon-personal-contact-card`, `surgeon-office-contacts-card`). "Edit details" opens `surgeon-edit-sheet`. |
| `/admin/masters` | Master data. The view is the `?view=` param: `anaesthetists` (default), `contracts`, `recurringBookings` (catch-up Phase 30; was `permanentLists`), `hospitals` (List or Calendar), `surgeons` (the old `surgeonRooms` value opens it, catch-up Phase 17b), `surgeonGroups`, `parties` (catch-up Phase 18; the old `insurers` and `organisations` values open it), `specialties` and `fundingTags` (catch-up Phase 18a), `rvgGroups` (catch-up Phase 19, "RVG groups"; the old `rvgCodes` value opens it), `modifiers` (catch-up Phase 19b, "Modifiers"; the old `modifierCodes` value opens it), `availability-statuses` (catch-up Phase 29; the old `listStatuses` value still opens it), `emailTemplates` (catch-up Phase 35, "Email templates": the table `email-templates`, rows `tr[data-email-template=ET001..ET004]` (Change of anaesthetist, Cancellation, Correction of an error, Booking change), each with History, Edit and Retire named "Edit <name>" etc.; "Add template" in the header), `xeroArchiving`, `scheduleSettings`, and since catch-up Phase 42 `publicHolidays` ("Public holidays", the master public-holiday calendar), `seedLoad` ("Seed load") and `goLive` ("Go-live load"), the last two demo-badged. Catch-up Phase 42 groups the sub-nav (`nav[aria-label="Master data"]`) into five `role=group` blocks `[data-masters-group="People and places"|"Schedule"|"Billing"|"Settings"|"Go-live"]`: People and places (Anaesthetists, Hospitals & holidays, Surgeons, Specialties, Surgeon groups), Schedule (Recurring bookings, Availability statuses, Public holidays, Schedule settings), Billing (Parties, Funding tags, Contracts, RVG groups, Modifiers), Settings (Email templates, Xero & archiving), Go-live (Seed load, Go-live load). Labels are unchanged; the current button has `aria-current=page`. Each sub-nav button carries `data-masters-view=<view>` (click that, not the name). `?view=contracts&holder=<PartyId>` opens Contracts filtered to a holder (the Parties "N active" link). A Contract's panel has Details and History tabs (catch-up Phase 25). |
| `/admin/masters/surgeons/:surgeonId` | Surgeon profile (catch-up Phase 17): HPI CPN chip ("No HPI CPN yet" when blank), "History" and "Edit details" top right. An unknown id falls back to `/admin/masters`. Catch-up Phase 17b: Specialties, Identifiers and Groups in the first row, then one full-width "Practice and contacts" card (`surgeon-contacts`), then Pairing preferences. No room cards. |
| `/admin/masters/anaesthetists/:anaesthetistId` | Admin anaesthetist record: Priority tier card, Profile, Pairing preferences. Office only. The Profile card (catch-up Phase 26; was "Details", hook `anaesthetist-details` kept) shows Rate per unit, Status, Phone, Email, HPI CPN and Bank account (masked, row `anaesthetist-bank-account`); it has no action of its own. The page header's secondary button "Edit details" (beside "History") opens the Edit sheet: click `button:text-is("Edit details")` at page level, not inside `anaesthetist-details`. |
| `/admin/audit` | Audit viewer. Catch-up Phase 35 adds a Change set column: each grouped entry's id is a link `audit-change-set` that filters the viewer to that change set (the filter line `audit-change-set-filter`). |
| `/admin/credit-notes/:creditNoteId` (catch-up Phase 39) | A credit note (`CRN0001` the first): the document `credit-note-document` ("CREDIT NOTE", "Total credited") with its rail, the negative invoice card `negative-invoice-card` ("Negative invoice CN-2026-0001-P", "offset against the unpaid payable" or "... nets in the next payment run"), `credit-note-credits`, `credit-note-new-invoices`, `credit-note-xero`. Reached from the original's `invoice-credited-banner` link `CN-2026-...`, a credit note row on `/admin/invoices` (`tr[data-credit-note-id]`) or the Procedure's `procedure-event-credit-note`. An unknown id is handled as an unknown invoice is (`RequireEntity`). |
| `/admin/invoices/:invoiceId` (catch-up Phase 39) | The rail adds the "Correct this invoice" card `invoice-correct` (Credit note, Credit in full and rebill, Split into additional invoices). A credited original shows the standing pill `invoice-standing` ("Credit waiting for review", then "Credited") and `invoice-credited-banner` ("Credited in full by CN-2026-... · rebilled as AA-2026-..." or "replaced by ..."); a rebill shows `invoice-rebill-of`, a split component `invoice-split-part`. The bar adds `stage-refund-after-payout` here. |
| `/admin/invoices` (catch-up Phase 39) | Credit note rows (`tr[data-credit-note-id]`, kind "Credit note", `invoice-list-credits` "Credits AA-...") sit above the invoice they credit; invoice rows add `invoice-list-standing` and `invoice-list-rebills`. The bar adds `stage-combined-procedure`. |
| `/admin/audit` (catch-up Phase 39) | The viewer hides payments, receipts and disbursements (`AUDIT_VIEWER_EXCLUDED`: they are recorded in Xero). The Entity type filter (the first `select`) lists only entity types present, so `creditNote` appears once a credit is submitted (rows "Credit submitted for review", "Credit approved for billing", "Credit note raised", "Credit issued", "Credit note emailed" or "... marked to post"); the negative invoice is its own entity type `negativeInvoice`, the credited original `invoice` ("invoice.credited"); `account` still appears after `simulate-sign-in`. |
| `/admin/day/:date` (catch-up Phase 43) | With more than 30 rows (full-scale data only) the grid pages: the footer `day-grid-footer` holds the pager `day-grid-pager` ("Anaesthetists 1 to 30 of 85", buttons "First page", "Previous page", "Next page", "Last page"; `data-page`, `data-pages`). `?page=2` is a replaceable view param. At demo scale there is no pager and the footer reads as before. |
| `/admin/invoices` (catch-up Phase 43) | The search field "Find by invoice number or payer" (`invoices-search`, on the `<input>`) filters before paging and returns to page 1; the pager `invoices-pager` ("Showing 1 to 50 of 28,226" style) shows only above 50 matches, so only at full scale. Generated invoice numbers use the series `AA-S-000001`. |
| `/admin/audit` (catch-up Phase 43) | The 500-row cap note is gone: the count `audit-count` ("N entries") sits in the filter row and the viewer pages by 100 with `audit-pager` under the table (shown only above 100 entries). A change-set link or a filter returns to page 1. At full scale the newest entry is "Full-scale data loaded" (`demo.fullScaleLoaded`). |
| `/admin/billing` (catch-up Phase 43) | New view param `page=<n>` for the groups pager `billing-monitor-pager` ("Anaesthetists 1 to 20 of 77" at full scale: 77 groups, as six cast anaesthetists hold no monitored Lists), shown only above 20 groups; per group, "Show all N" `billing-group-show-all-<anaesthetistId>` and the nested pager `billing-group-pager-<anaesthetistId>` when a group holds more than 25 Lists. At demo scale neither shows, so the screen is unchanged. Problems only: the "Problems only" pill in `billing-monitor-filters` (`role=button[name="Problems only"]`) or the tile `billing-tile-problems`. |
| `/admin/ledger` (catch-up Phase 43) | The pager `ledger-pager` shows only when there are more rows than a page (full scale). |
| `/admin/intake/matching` (catch-up Phase 43) | The row panel shows only the fields needed to match, with the line `matching-restricted` ("Only the fields needed to match are shown. The rest of what the hospital sent is held under restricted access."). On a row that needs resolving (open, and unmatched, waiting for its NHI or blocked by a flag; the seeded `IRS001` Mere Tipene is one) the line adds the link `matching-raw-row` ("View raw row"), which opens the raw-row sheet (see Overlays); after a view, `matching-raw-row-views` ("Raw row viewed once · last Kirsty W. 08:00"). Demo action `matching-raw-row-other-role`. |
| `/admin/masters?view=xeroArchiving` (catch-up Phase 43) | The archive volume line `archive-scale-line`. |
| `/admin/billing` (catch-up Phase 39a) | The payables panel is replaced by the payment cycle card `payment-cycle` ("Payment cycle · Week 30 · 20 Jul to 26 Jul 2026" at reset; its status pill `payment-cycle-status` once closed) with a compact step rail, steps `payment-cycle-step-1` to `-4` (Close the week, Monday checks, Approve BCTIs, Send payment schedule; each "Planned Friday 24 Jul" and so on until done, then its stamp). Before the close: `payables-run-draft` ("Waiting for this week's run", per-anaesthetist table, rows `tr[data-anaesthetist-id]`; "Nothing is waiting for this week's run." at reset) with the button `payment-cycle-close` "Close the week" (disabled with nothing waiting). After it: `payment-cycle-anomalies` ("Checks before payment", anomaly rows `li[data-anomaly-id][data-anomaly-kind]` with `payment-cycle-hold-anomaly` "Hold out of this run" and `payment-cycle-mark-fixed` "Mark fixed"; per line `payment-cycle-hold-open`, `payment-cycle-hold-reason`, `payment-cycle-hold-line`), the held lines `payment-cycle-held` ("Rolls into Week 31", rows `[data-held-pair-id]`, `payment-cycle-release` "Return to run"), then `payment-cycle-approve` ("Approve week 30's BCTIs", disabled while an anomaly is open). Approved: `payables-run-approved` (the frozen table) and `payment-cycle-send` "Send payment schedule". Always: `billing-payables-run` (now only the Simulated Xero badge and `billing-run-payables-in-xero` "Run payables in Xero", disabled "Nothing scheduled to pay" until a schedule is sent), the runs table `payables-runs` (rows `tr[data-run-id][data-run-status]`, Week, Run (a link to the run), Closed, Approved, Scheduled, Net, Status pill Closed, Approved, Scheduled, Paying, Paid or Superseded, plus Seeded or Staged), `billing-open-ledger`, and the result line `billing-payables-result` ("Week 30 paid in Xero: 19 BCTIs, 1 negative invoice netted, $10,472.16 paid to 1 anaesthetist."). After the run is paid the card moves on to Week 31. `billing-payables-due` and the per-payable rows are gone. `payment-cycle-stale` and `payment-cycle-reclose` show when the ledger changed after the close. |
| `/admin/billing/payment-runs/:runId` (catch-up Phase 39a) | One payment run ("Payment run · Week 30"): the run card `payables-run-detail` (Run, Closed, Approved, Schedule sent, Sent to Xero, Paid stamps; status pill), "Ledger at close" `payables-run-snapshot`, "Totals by anaesthetist" (no hook: `role=region[name="Totals by anaesthetist"]`) with the link `payables-run-remittance-link` "Remittance advice" per row once approved, "Checks before payment" (held lines `payables-run-held`), and once approved the "Payment schedule" card `payment-schedule` ("PAYMENT SCHEDULE · Week 30", Total row, "Sent to the accountant ..." once sent; `payment-schedule-print`). The first live run after a reset is `PR0001`; the seeded runs are `PRH01` to `PRH13`. |
| `/admin/billing/payment-runs/:runId/remittance/:anaesthetistId` (catch-up Phase 39a) | One anaesthetist's remittance advice for the run (Dr Sharma is `41267`): the document `remittance-advice` ("REMITTANCE ADVICE", `remittance-week` "Week 30, 2026", one row per BCTI, netted rows `remittance-netted` "Negative invoice CN-2026-0001-P · credit of AA-2026-PP20" with "-$365.70", the "Paid to you" total `remittance-net`, `remittance-still-to-net` only when a negative is left over), with the rail cards `remittance-print` and `remittance-xero` (batch payment). |
| `/admin/invoices/:invoiceId` (catch-up Phase 39a) | The Ledger card adds `payment-week` once the invoice is paid out: "Paid out in Week 30 · $54.30 · netted $365.70" on `PPINV01` after the netting run (one span per run, `[data-run-id]`). |
| `/admin/ledger/anaesthetists/:anaesthetistId` (catch-up Phase 39a) | Adds the "Payment runs" card `ledger-payment-runs` (the runs that paid this anaesthetist, "Not paid in a payment run yet." when none) and `ledger-still-to-net` ("Dr Sharma has negative invoices to net: ...") only while a negative is open. |
| `/admin/masters?view=prepaymentLetters` (catch-up Phase 41) | Master data, Prepayment letters (Settings group; sub-nav `[data-masters-view=prepaymentLetters]`): the view `letter-templates` ("Prepayment letters", table rows `tr[data-letter-template=LT001..LT003]` with Name and a Default pill, Kind, Active, Updated, and Make default, Edit, Deactivate, each named "<action> <template name>"), "New template" `letter-template-new` in the header. Edit or New template opens `letter-template-editor` (see Overlays). |
| `/admin/day/:date/bookings/:bookingId` (catch-up Phase 41) | Above the Booking body, `PrepaymentFollowupCards`: the moved card `prepayment-moved` (only when the List's anaesthetist differs from the one the prepayment invoice named), the office's `rebook-open` ("Rebook with another anaesthetist", only on a cancelled Booking that had a prepayment and was not rebooked yet) and `prepayment-history` (two or more prepayments along a rebook). In the prepayment panel `booking-prepayment`: `prepayment-reminder` (office, sent and unpaid or part paid, List not authorised), `prepayment-reminder-sent`, and once settled `prepayment-settled`. Under a prepaid Procedure once the List is AUTHORISED: `prepaid-settlement` (all three apps). |
| `/admin/invoices/:invoiceId` (catch-up Phase 41) | A prepayment invoice sent with a letter shows it as its cover `prepayment-letter` above the masthead (`INV0001` from reset); the Delivery card adds `invoice-letter-line` ("Letter: Standard prepayment letter · sent with this invoice") and one `invoice-reminder-line` per reminder ("Reminder · 21 Jul 08:00 · $1,380.00 outstanding"). |

The side nav has: Day view, Intake (amber badge `[data-shot=nav-badge-intake]`, the open Matching rows;
catch-up Phase 34, was Matching with `nav-badge-matching`), Conflicts (amber badge `[data-shot=nav-badge-conflicts]`, catch-up
Phase 30), Review queue, Invoices, Billing monitor, Master data, Audit (Integrations removed in catch-up Phase 34). Every side-nav
badge carries `data-shot=nav-badge-<section>`.

Catch-up Phase 36 adds "Ledger" after Billing monitor, with an amber badge `[data-shot=nav-badge-ledger]` counting
the ledger's failed checks (none at reset, so no badge; 1 after "Inject unmatched receipt").

**Mobile app** (`src/apps/mobile/`; on :5174 for shots)

| Route | Shows |
|---|---|
| `/mobile/lists` | The main view (catch-up Phase 38a): it opens scrolled so the Today heading (`mobile-lists-today`) sits at the top of `mobile-lists-scroll`; above it, "Earlier, not yet authorised" (`mobile-main-view-earlier-group`, Mon 13 Jul AM, Mon 20 Jul AM and PM, rows `[data-quiet=true]`, "Done · unbilled"), reached by scrolling up or the teal hint under Today (`mobile-main-view-earlier`, "3 earlier Lists not yet authorised" since catch-up Phase 23). Pick a row by `[data-testid=slide-home] [data-list-id="L-..."]`: a `button:has-text(...) >> nth=0` can land on an earlier List. Chips Week, Month, To-Do, Done (Done = submitted only; an authorised List is under no chip). In the fixed header: the search field (`[data-testid=mobile-lists-search]` on the `<input>`, `role=searchbox[name="Search your Bookings"]`, placeholder "Search patient name or NHI") and the calendar button (`[aria-label="Go to a date"]`) that opens the date sheet (`mobile-lookback-calendar`, days `[data-date=YYYY-MM-DD]`, labelled "Friday 13 March 2026, 1 List"; the title button opens month chips, e.g. `role=button[name="March 2026"]`). `?day=YYYY-MM-DD` shows that date's Lists (`mobile-lookback-day`) under a teal day chip (`mobile-lists-day-chip`); `?q=` shows results (`mobile-lookback-search`, rows `button[data-booking-id]`, Upcoming then Past) with the count line (`mobile-lists-search-count`). Free rows read "Open for bookings". |
| `/mobile/lists?day=2026-03-13` | The pinned history day (`SEED_LOOKBACK`): one invoiced List, `L-HIST-2026-03-13-AM`. Back from its List returns here. |
| `/mobile/lists/:listId` | List detail, with an "Add a booking" and "Mark list completed" footer. The tab bar is hidden. |
| `/mobile/lists/:listId/bookings/:bookingId` | Booking detail. The tab bar is hidden. "Move to a colleague" (`move-booking-action`, scroll to it, above Cancel booking) opens the single-Booking move as a bottom sheet (catch-up Phase 32a). |
| `/mobile/availability` | Find cover: "My availability" (the day's AM and PM chips, a "Move" button on a movable List, `availability-move-am`/`-pm`; "Change" opens the day's bottom sheet, "My calendar" slides the calendar in), and the everyone / free-only grid. The six-day strip's days are `button[data-date=YYYY-MM-DD]` (Tue 21 to Sun 26). A colleague's free cell is tappable only where Dr Souter has a movable List that session (`availability-move-to-<registration>-am`/`-pm`, "Tap to move your List here"). "Moved to you" (`moved-to-you`) tops the screen when a colleague moved a List to her (catch-up Phase 32; the cover request and "Tap to ask" are retired). |
| `/mobile/availability/calendar` | My calendar (catch-up Phase 29): a month of Dr Souter's sessions, AM over PM, July to the horizon month; the tab bar is hidden; the sticky teal "Add days off" opens the sheet on the form. |
| `/mobile/balances` | "Your account": Outstanding and GST this month. Since catch-up Phase 38: the total card `balances-total`; the list `balances-outstanding` of cards `[data-testid=balances-outstanding-<invoiceNumber>]`, each a button opening its Booking, second line "<invoice> · <billable party> · Invoice date 14 Jul", no age chips; the segment "GST this month" (click `text="GST this month"`) shows `balances-gst-month`, headed `balances-gst-month-header` "July 2026 · paid to you" (what AA passed to her this month, with its GST). |
| `/mobile/balances` (catch-up Phase 36) | The header card adds the line `balances-collected-paid-out` "Collected $X · Paid out $Y" under the unpaid count, and `balances-you-owe-aa` "You owe AA $Z" only when Dr Souter has an unpaid AA fee invoice (she does at reset: AA-FEE-2026-H02). The PWA Demo sheet adds `pwa-office-runs-payables` here (labelled "Office runs payables in Xero" since catch-up Phase 37). |
| `/mobile/more` | Settings. The PWA adds a demo panel with a non-deterministic build ID. Avoid shooting that panel. |
| `/mobile/more` (catch-up Phase 26) | The "Profile" card `mobile-profile` sits between the persona card and the Demo card: rows `mobile-profile-rate` (Rate per unit $26.50, with the "Change" text action `mobile-profile-rate-change`), Phone, Email, Registration, HPI CPN (`mobile-profile-hpi`) and Bank account (`mobile-profile-bank`, masked), the office-held rows with lock glyphs and captions. Its lower rows sit near the fold: `scroll` to `mobile-profile-bank` first. "Change" opens the bottom sheet `mobile-rate-sheet` (field "Rate per unit ($)", "Save rate" `mobile-rate-save`). |
| `/mobile/more` (catch-up Phase 43) | On the PWA the build panel sits below the Demo card ("Demo prototype"): keep it out of frame. |
| `/mobile/more` (catch-up Phase 43a) | The account card `more-account` ("Signed in as m.souter@aa-associates.example") sits under 26's Profile card, so everything below the Profile card moves down by one card. Its Sign out text action `more-sign-out` signs out and shows the sign-in screen `sign-in-screen` on the same route; Sign in (`sign-in-submit`) returns to it. `scroll` to `more-account` and keep the PWA build panel out of frame. |

- The tab bar is `[data-testid=mobile-tab-bar]`, with buttons Lists, Availability, Balances and
  More.
- The slide layers are `[data-testid=slide-home|slide-list|slide-booking]` on Lists and `[data-testid=slide-availability|slide-calendar]` on Availability. All stay mounted, so
  scope selectors to the top layer, for example `[data-testid=slide-booking] >> text="RVG code"`.

**Simulators** (`src/apps/demo/`)

| Route | Shows |
|---|---|
| `/demo/control` | The presenter's index: clock and reset, scenario jumps, and every demo action listed under its screen with an "Open screen" link. No trigger buttons. |
| `/demo/xero` | Xero simulation, Contacts tab. Three tabs since catch-up Phase 37: Contacts, Invoices, Bank reconciliation. While a Xero outage is on (the `xero-outage-start` trigger), every tab shows the warning banner `xero-outage-banner` ("Xero API unavailable to the Billing Engine (simulated)." with "Unavailable since ...") above the callouts. The duplicate-number callout `xero-duplicate-number-policy` links to the Bank reconciliation tab. |
| `/demo/xero/invoices` | Invoices tab. |
| `/demo/xero/invoices/:accRecId` | Pair detail: ACCREC and ACCPAY, money flow, both records' InvoiceNumber and Reference (`xero-invoice-identifiers`); the payable equals the receivable. `XRB0` exists in the seed. An AA fee pair (`XRFH01`, `XRFH02`) shows the fee ACCREC and a "No payable" note (`xero-aa-fee-pair`). |
| `/demo/xero/invoices/:accRecId` (catch-up Phase 36) | The callout `xero-engine-link` is now titled "Ledger pair (the system of record)"; inside it `xero-ledger-pair` (the patient, then Ledger pair, Receivable and Payable numbers and the ledger's received, released and paid out) and the chip `xero-ledger-match` ("Matches the ledger" or "Differs from the ledger"). The page subtitle says Xero mirrors the Billing Engine's ledger. |
| `/demo/xero/invoices/:accRecId` (catch-up Phase 37) | The ACCPAY card `xero-accpay-card` separates what Xero paid from what the engine knows: `xero-accpay-paid-in-xero` ("Paid in Xero": each bill payment's id, time and amount, or "No bill payment yet. Xero's payables run pays the bill once it is authorised.") and, once a bill payment exists, `xero-accpay-engine-detection` (one line per bill payment, `data-engine-state=recorded|notDetected|queued`: "Billing Engine: disbursement recorded HH:mm by webhook", "... by the poll", "Billing Engine: not yet detected; the next poll picks it up", or the queued wording). The ACCREC card shows `xero-accrec-voided` (pill "Voided in Xero") after a void and `xero-accrec-amended` ("Amended in Xero HH:mm", "Total in Xero") after an edit. The "Simulate payment and payout" button stays (payment, Xero's payables run and the bill-paid webhook in one click); the staged way is the `xero-pay-bill` trigger. |
| `/demo/xero/invoices/:accRecId` (catch-up Phase 41) | On a credited prepayment's pair (Nair's `XRB0` after her Booking is cancelled), the credit note card `xero-credit-note` adds `xero-prepayment-refund` with one row `xero-prepayment-refund-row` (`data-refund-id`) per refund: "Refund paid from <bank account> · $1,380.00 · Paid 21 Jul" and its reference. Scroll to `xero-credit-note` first. |
| `/demo/xero/bank` | Bank reconciliation tab (catch-up Phase 37; US-10.2.4), labelled "Bank reconciliation (N unmatched)": `xero-bank-reconciliation` holds the scope callout `xero-bank-scope` ("Matched in Xero, not by the Billing Engine": "The Billing Engine does not match bulk remittances. Xero's bank reconciliation and remittance add-on do, keyed on the unique InvoiceNumber; the engine learns each matched payment through the normal payment webhook (US-10.2.4)."), then `xero-bank-empty` at reset ("No remittance yet"). After the `xero-bulk-remittance` trigger: the remittance card `xero-remittance-rmt0001` (lower-case id; "St George's remittance 21 Jul") with lines `xero-bank-line-bkl0001`, `-bkl0002` (`data-line-status=matchedByAddOn`) and `-bkl0003` (`unmatched`, $980.00 quoting AA-2026-H40), and the section `xero-bank-unmatched` ("Unmatched items · for office staff, handled in Xero") with one row `xero-bank-unmatched-bkl0003`, its invoice select `xero-bank-pick-BKL0003` and "Match in Xero" `xero-bank-match-BKL0003` (upper-case ids on these two); the right invoice is AA-2026-H04 (Xero id `XRH04`), and the result line is `xero-bank-match-result`. |
| `/demo/integrations` | Future scope: HL7 and FHIR (catch-up Phase 34), the integration simulator: feeds, message library, raw HL7 to FHIR, then pane 3 "Sent to matching" (a message stages a row on `/admin/intake/matching`, never applies). Header line `demo-surface-future-scope`, page strip `future-scope-pages` (Simulator, Message log, Feed mapping). App `simulator`. |
| `/demo/integrations/log` | Future scope: the HL7 message log (catch-up Phase 34; was Admin Integrations' Messages tab): `future-scope-log` (its table is `[data-shot=future-scope-log] table`), the dead-letter callout `integrations-attention`. Empty until a message is replayed or fired. |
| `/demo/integrations/mapping` | Future scope: feed mapping (catch-up Phase 34; was Admin Integrations' Feed config tab): `future-scope-mapping`, one card per feed `[data-feed-id=<id>]`. |
| `/demo/data` | Data inspector: the demo clock and entity counts, Privacy checks (`nhi-scan-panel`), Today's sessions, Seeded scenario finder, Audit trail, Lifecycle states, Guard console. |
| `/demo/data` (catch-up Phase 43) | A "Privacy checks" panel `nhi-scan-panel` sits above Today's canvas; its report `nhi-scan-report` reads "No scan yet" (`data-scanned="false"`) until the `scan-nhi-leaks` demo action runs, then a table (`data-scanned="true"`) with one row per area, `tr[data-scan-area=<key>]` with `data-hits` (`xero` with "NHIs or personal details", `diagnostics`, `failures`, `planted` only with the planted choice, and core rows marked "Held by design"). At full scale the line `data-saving-paused` shows. Selectors already scoped to `data-guard-console` are unaffected; it now sits lower, so a highlight scrolls to it. |
| `/demo/xero` (catch-up Phase 43) | The callout `xero-volume-callout` ("Contact archiving & volume"); at full scale each table caps at 200 rows with `xero-table-cap` ("Showing 200 of N"). |

## Seed data worth shooting

**Parties and Contracts** (catch-up Phase 18; Admin, Master data, Parties and Contracts)

- Parties (`PY-<NAME>`; runtime `PYN001`): `PY-AA` Anaesthesia Associates (read-only); hospitals
  `PY-STG`, `PY-SX`, `PY-FORTE`, `PY-CES`, `PY-CPH`; insurers `PY-NIB` (billed, email), `PY-SCHS`,
  `PY-AIA`; funders `PY-ACC`, `PY-HNZ`, `PY-NZDF`, `PY-VA`; surgeon groups `PY-COS`, `PY-ARIA`,
  `PY-UNI` (delivery post), `PY-MER`; surgeon `PY-DOYLE`; anaesthetist `PY-SOUTER`. Rows are
  `[data-shot=parties] tr[data-party=<id>]`.
- Contracts by AA code (rows `[data-shot=contract-catalogue] tr[data-contract=<id>]`, under holder
  heading rows `tr[data-contract-holder]`): `AA-RVG` No contract · RVG (`CT-NO-CONTRACT`, first,
  no Disable); `STG-001` St George's RVG, `STG-002` ACC elective services via St George's ($25);
  `SX-001` Southern Cross RVG, `SX-002` Southern Cross Affiliated Provider ($26.50); `FORTE-001`;
  `CES-001`; `CPH-001`, `CPH-002` Health NZ agreed rate ($23); `NIB-001`; `DOYLE-001` Gastric bypass
  (`CT-DOYLE-BAR`, fixed: $2,800 from 1 Jan 2025, $2,950 from 28 Jul 2026, bills the payer);
  `COS-001` ACC orthopaedic services ($24), `COS-002` COS ACC fixed fees (fixed, one range from
  1 Aug 2026; the billing-failure demo no longer uses it since catch-up Phase 25); `ARIA-001` Aria Skin and Laser Clinic (`CT-ARIA-HOURLY`, RVG at the Contract's rate, $26.50, price fixed for the
  anaesthetist; catch-up Phase 24, was rate and time); `UNI-001` Unisports
  Ortho ($93.47); and, seeded last, Forte Health RVG less 10% (`CT-FORTE-DISC`, catch-up Phase 24). All Active.
- Priced items (catch-up Phase 19a, `seed/pricedItems.ts`; every fixed price a Contract with price
  ranges): `DOYLE-002` Sleeve gastrectomy ($2,400); CES `CES-002` Cataract IOL (LA by Anaesthetist,
  holder code 8268, SXAP), `CES-003` Blepharoplasty (AP0126, SXAP), `CES-004` Ant Vitrectmy addn to
  Catrct, `CES-005` to `CES-007` Vitrectomy · 0 to 60 / 61 to 90 / 91 to 120 mins (AP0163, SXAP),
  `CES-008` Cataract (HNZCATall, HNZ), `CES-009` Cataract Extraction Simple (OPT101, ACC); Merivale
  Plastic Surgery `MER-001` Face lift ($3,100), `MER-002` Facelift plus 1 add on ($3,400), `MER-003`
  Facelift plus 2 add ons ($3,700), all from 1 Jun 2026, default RVG code H3, linked Ms G. Lim and Mr
  M. Wolfenden, billing the payer (ids `CT-MER-FACELIFT`, `-1`, `-2`); Dr Souter's prepaid list
  `SOUTER-001` Rhinoplasty ($1,200, then $1,300 from 1 Sep 2026, `CT-SOUTER-RHINO`), `SOUTER-002`
  Blepharoplasty, upper lids, `SOUTER-003` Breast augmentation (holder filter `?holder=PY-SOUTER`).
  Searches: "CAT" (the cataract items), "H3" (Merivale's three and Rhinoplasty), "AP0126".
- The one Booking on a priced item: BK0163, Sophie Matthews, Face lift on Dr Souter's Mon 10 Aug PM
  List (St George's, Ms Lim), `/admin/day/2026-08-10/bookings/BK0163`, unedited at $3,100; a range
  added from a date before 10 Aug re-prices it. The bariatric hernia (P0030 on BK0028) is on No
  contract · RVG at $61, billed to the patient: the additional procedure beside the fixed-price gastric bypass
  primary (the mixed Booking, catch-up Phase 23).
- The row's Edit button's accessible name is "Edit <name>": click `button:text-is("Edit")` inside the
  row, not `role=button[name="Edit"]`. The search input is `[data-shot=contract-search] input`.

**Specialties, funding tags and the Fixed price Contracts** (catch-up Phase 18a; Admin, Master data)

- Specialties (`SPC-<NAME>`; runtime `SPN001`), twelve, rows
  `[data-shot=masters-specialties] tr[data-specialty=<id>]`: Ophthalmology `SPC-OPHTH` (20 surgeons),
  General surgery `SPC-GENSURG` (29 surgeons, 1 Contract), Plastic surgery `SPC-PLASTIC`, ENT
  `SPC-ENT`, Gynaecology `SPC-GYNAE`, Orthopaedics `SPC-ORTHO`, Urology `SPC-UROLOGY`,
  Gastroenterology `SPC-GASTRO` and Cardiothoracic surgery `SPC-CARDIO` (none held), Neurosurgery
  `SPC-NEURO`, Vascular surgery `SPC-VASCULAR`, Oral and maxillofacial surgery `SPC-OMFS`. Removing a
  held one (Ophthalmology) shows the refusal as `[role=alert]` above the table.
- The directory's free text is mapped: a Fertility surgeon (`S-BANCROFT`, `S-CARMODY`, `S-HUXLEY`,
  `S-JESSOP`) reads Gynaecology, an Upper GI one (`S-MORLAND`, `S-WAINWRIGHT`) General surgery; Ms G.
  Lim reads Plastic surgery (the day grid line is "Ms G. Lim · Plastic surgery").
- **RVG groups** (catch-up Phase 19; `?view=rvgGroups`, table `[data-shot=masters-rvg-groups]`): the NZSA
  RVG 2021 rows as published plus AA's own beside them, unmarked, under anatomy heading rows
  `tr[data-rvg-anatomy=<heading>]` (Supervision, Head, Neurosurgery, Neck, Upper limb, Thorax, Spine,
  Abdomen, Perineum, Pelvic, Vascular, Lower limb, Anaesthesia in remote locations, Pain consultations
  and procedures). Rows `tr[data-rvg-group-code=<code>]` (the printed code is not unique: three T2 rows,
  the guide's 4 and 5 and AA's Breast reduction 6; two P6 rows, 10 and 4; three H2 rows). H4 reads
  "10 · range 10 to 12". The hidden id (seeded `RG001`…, runtime `RGN001`…) is never shown. Row
  actions are named "History|Edit|Retire|Restore <code> <description>"; a retired row is
  `tr[data-retired=true]` with a neutral "Retired" pill (Show: Active by default, All). AA rows carry
  the nearest printed code with AA's own figure, for example A3 "Appendicectomy, laparoscopic" 5 (the
  guide's A3 is 6), LL4 "Hip, total replacement, primary" 7 (includes P1 until Phase 19b).
- Funding tags in step-rail order, rows `[data-shot=masters-funding-tags] tr[data-tag=<id>]`:
  `TAG-SXAP` SXAP (Southern Cross Health Society), `TAG-HNZ` HNZ (Health NZ), `TAG-ACC` ACC (ACC).
  Row actions are named "Move SXAP up", "Edit SXAP", "Remove SXAP"; removing SXAP is refused (2
  Contracts).
- Tagged Contracts: `SX-002` SXAP, `CPH-002` HNZ, `STG-002`, `COS-001` and `COS-002` ACC, and since
  Phase 19a the CES items (`CES-002` to `CES-007` SXAP, `CES-008` HNZ, `CES-009` ACC), so CES's
  three tag fallbacks exist from the start (tag Forte to show a fallback being made). Specialties:
  Doyle's two General surgery, the CES items Ophthalmology, Merivale's and Dr Souter's Plastic
  surgery; every other Contract holds none (every specialty). Removing SXAP is refused (9 Contracts).
- System Contracts, rows `tr[data-system=openPriceFallback]` with a "System" pill (No contract · RVG is
  `tr[data-system=noContractRvg]`), ids `CT-FIX-<destination key>`: `AA-FIX` No contract · Fixed price,
  `AA-PRE` Prepaid · Fixed price, `STG-ACC-FIX`, `SX-SXAP-FIX`, `CPH-HNZ-FIX` (hospital and tag), and
  one `<PREFIX>-FIX` per Special holder (`STG-FIX`, `SX-FIX`, `FORTE-FIX`, `CES-FIX`, `CPH-FIX`,
  `NIB-FIX`, `COS-FIX`, `ARIA-FIX`, `UNI-FIX`). Search "Fixed price" lists them. Tagging `CES-001`
  SXAP and saving makes `CES-SXAP-FIX` at once.

**Surgeon practice and office contacts** (catch-up Phase 17b; Admin, Master data; replaces 17a's rooms)

- No HPI CPN (the row's cell and the profile chip read "No HPI CPN yet"; `tr[data-surgeon=...][data-hpi=""]`):
  `S-WHAANGA` Dr P. Whaanga, `S-OSEI` Dr B. Osei, `S-SELWYN`.
- Two-practice surgeons (practice name joins both, one office contact per practice): `S-WAINWRIGHT`
  Mr N. Wainwright (Upper GI Partners and Hillsborough Colorectal Specialists; office contacts Upper GI
  Partners info@uppergi.example, then Hillsborough Colorectal Specialists), `S-WINSLOW`, `S-MORLAND`,
  `S-VAUGHAN`. Use `S-WAINWRIGHT` for a two-practices shot.
- Bev first: `S-DALGETY` Dr H. Dalgety, office contacts Bev (bev@avonheadent.example), then the Avonhead
  ENT inbox. Burnside ENT surgeons (e.g. `S-FORSYTHE`): Maree, then Nicola Holloway, then the Burnside
  ENT Surgeons phone. The first office contact with an email carries the pill "Office emails go here first"
  (`office-first-pill`).

**Sessions and Lists** (catch-up Phase 28)

- The dashed **Free** blocks ("open for cover" and the like) are empty sessions, not Lists: their note
  is the session's own. Clicking one opens the empty-session drawer (`[data-shot=admin-slot-drawer]`,
  still `[data-testid=admin-list-drawer]`) with Assign List, Book (phone advice), Edit times, History.
- Tue 21 open PM sessions: Sharma (`S-41267-2026-07-21-PM`), Delaney, Hughes, Strand
  (`S-47733-2026-07-21-PM`); open AM: Hughes. Souter's next free session is Wed 22 PM
  (`S-34821-2026-07-22-PM`), what the PWA stand-in assigns.
- The seed records ad hoc Lists and unavailability only inside **2026-07-07 to 2026-08-16**; beyond it
  every session is Free unless leave or a recurring booking painted it (for example
  `/admin/day/2026-09-07`).
- Schedule settings: four months (to Sat 21 Nov 2026), AM 07:30 to 12:30, PM 13:00 to 17:30.

**Availability** (catch-up Phase 29)

- The availability statuses are a master list (`/admin/masters?view=availability-statuses`), seeded
  with three fixed IDs: `free` (Free, the default, dashed), `holiday` (Holiday, long label "On
  holiday") and `unavailable` (Unavailable, hatched). An added status gets `ST0001`, `ST0002` and so
  on. No series is seeded.
- Dr Souter's seeded leave is **Sat 25 and Sun 26 Jul** (Holiday, "Annual leave / back Monday"); her
  Fri 24 holds Lists (Phase 28 freed it). She has recurring Lists Monday to Thursday every week, so a
  week of days off flags those Lists on the office's Day view (the interim until Phase 32): for a
  clean days-off shot use a Friday to Sunday, or her Fridays (free beyond the recorded window).
- Mobile and web shots are on different origins: stage availability for an admin shot with web
  steps in `setup` (`/web/availability/mine?date=…`), never mobile ones.

**Pairing preferences and tiers** (catch-up Phase 17; office only, never on mobile, web or the PWA)

- `PP-001`: Ms A. Reid prefers not to work with Dr Priya Sharma (not preferred, surgeon's side,
  "Surgeon's preference", added 10 Mar 2026).
- `PP-002`: Dr Rawiri Hughes prefers not to work with Ms A. Reid (anaesthetist's side), ended 12 May
  2026 ("Resolved with the surgeon's rooms"): under "Ended entries" on Reid's profile.
- `PP-003`: Mr J. Whitford prefers to work with Dr Priya Sharma (preferred, surgeon's side).
- `PP-004`: Dr Tom Ngata prefers to work with Ms H. Cameron (preferred, anaesthetist's side).
- Tiers: Tier 1 Souter, Rutherford, Morrison, Delaney, Strand; Tier 2 Sharma, Chen, Fitzgerald; Tier 3
  Ngata, Beaumont, Hughes; no entry (Tier 4) Ropata, Whitaker, Ngatai.
- Pickers: Reassign list from Dr Chen's Tue 21 PM (`L-45178-2026-07-21-PM`, Ms Reid) puts Sharma under
  "Not preferred with Ms Reid" (open only; never confirm in a recipe, it uses Sharma's S2 Free PM);
  Dr Souter's Wed 22 AM (`L-34821-2026-07-22-AM`, Mr Whitford) Reassign, or Dr Rutherford's returned
  Draft List (`L-29104-2026-07-22-AM`, block `[data-draft-block=...]`, See everyone), shows six
  candidates in tier order, then Preferred first within a tier (catch-up Phase 32b): Sharma with a
  Preferred pill heads Tier 2. Colleagues whose session is closed are read-only rows
  `[data-candidate-closed=<reg>]` (Assign: in `candidates-not-available`; Reassign: in the collapsed
  `reassign-not-available`), each with the badged stand-in `demo-action-ask-colleague-make-available-inline`. Edit list on Sharma's Tue 21 AM (`L-41267-2026-07-21-AM`) with
  `S-REID` selected shows the warning. Within a tier the order is shuffled per opening (seeded), so
  pick a candidate by `[data-candidate=<id>]` or name, never by position.

**Souter, Tue 21 PM** (`L-34821-2026-07-21-PM`, "Southern Cross" on the mobile lists home)

- Wiremu Tane: complete, lap chole 20941.
- Susan Marsh: complete, on nib's Contract (nib RVG), billed to nib.
- David Chen: complete, self-funded. His time units were overridden manually, so the booking is
  read-only and shows "adjusted manually".
- **Margaret Ellison** (`BK0009`): **pending**. Left total hip replacement, RVG code LL4 "Hip, total
  replacement, primary" (AA's row, B 7; includes no modifier), 72 on 21 Jul so A1 is **pre-applied
  from her age** (`capture-modifier-applied`, removable, "Put back"), no claims, start 16:05. Her
  M is 1; after Finish now at 17:20 the Admin Booking reads 13 units, $344.50.
  - "Finish now" stamps the end time.
  - The list can't be submitted until she is complete.
- **The Spine Booking** (catch-up Phase 19b, marker `includedModifierBooking`): `BK0158`, Callum
  Graham, Dr Souter's Mon 27 Jul PM List (`L-34821-2026-07-27-PM`), uncaptured, RVG code S3a (B 10),
  so **P1 shows pre-applied at 0** ("Included in the base units of S3a. Cannot be added twice.").
  Its procedure text is still the generated "Knee, total replacement". S2 Beat 5 moves this List to
  Dr Ropata, so shoot it from a fresh store.
- **Seeded modifier claims:** every Procedure the old seed graded ASA III claims AS3 with "ASA III,
  severe systemic disease on pre-op review"; there is no ASA seed and no other claim. Patients 70 and
  over get A1 (80 and over A2) pre-applied on their procedure date.

**Booking source** (catch-up Phase 15): every scenario Booking shows one quiet "SOURCE · …" line on
its detail (`[data-shot=booking-source]`): St George's, Southern Cross and Christchurch Public read
"Hospital download", Forte Health and Christchurch Eye Surgery "Surgeon PDF". History Bookings show
none. A Booking added on the List reads "Added by anaesthetist", one from phone advice "Office entry".

**Procedure text and invoice description** (catch-up Phase 20a; US-02.5.7, US-03.1.9, US-08.4.6). Every
Procedure holds one `procedureText` (the latest received) and an `invoiceDescription` (printed on the
invoice only); the Booking's Procedure card shows the text. The wording below is **AI-made, illustrative demo data from AR-35, not AA's**.
- `BK0164` (Sione Davies, Souter Tue 4 Aug AM, 09:30, LL4, St George's RVG): "right total knee"
  (Hospital download, from St George's); its History holds "Procedure text replaced" naming "RTK"
  (Surgeon's rooms PDF). Seed marker `procedureTextReplaced`.
- `BK0043` (Diane Foster, Souter Tue 4 Aug AM, 11:00, No contract · RVG, no RVG code): "WLE MM"
  (rooms) until the office applies her hospital row on Matching (`SAMPLE_STG` R3, MSG-STG-1012's row, or
  `matching-send-update`), which replaces it with "WLE MM, left shoulder + flap repair + SNB + excision SCC
  and flap, left sternum + BCC"; her time moves. A message alone never changes it (catch-up Phase 33).
- The expert rows: Souter Tue 28 Jul PM (`L-34821-2026-07-28-PM`) `BK0165` "gastro/colon" and `BK0166`
  "blephs"; Thu 30 Jul AM (`L-34821-2026-07-30-AM`) `BK0167` "hystero D&C" (P1), `BK0168` "L3-5
  decomp + fusion" (S9b, email) and `BK0169` "EUA +/- cysto +/- biopsy". All on No contract · RVG.
- `BK0006` Wiremu Tane (Tue 21 PM, SXAP): the rooms' "lap chole +/- IOC", the demo Booking for
  `hospital-description-arrives`. `BK0003` reads "L TKJR", `BK0008` Chen "R inguinal hernia mesh",
  Morrison's TURPs "TURP" (hospital).
- `BK0028` Doyle (Fitzgerald Tue 14 Jul AM): its Contract's invoice description "Gastric bypass, laparoscopic"
  is what its invoice will print.
- No attachments anywhere (US-03.1.3 Retired; removed in Phase 20a).

**Admin day, Tue 21**

- Rutherford at Forte Health all day.
- Free sessions: Sharma PM, Hughes AM and PM, Strand PM, and Fitzgerald PM (id `43015`, `button[data-slot-id="S-43015-2026-07-21-PM"]`; catch-up Phase 31 made it free, no longer "surgeon TBC").
- Delaney PM is free with a note.
- Draft Lists band (`daygrid-draft-band`) on Tue 21 (catch-up Phase 32d): only St George's PM (request `LD-001`). Header reads "1 Draft List"; Ngata's acute AM clash `LD-RCB016-2026-07-21-AM` is gone. Every block carries a booking count pill (`daygrid-block-count`).
- Public (catch-up Phase 32d): Dr Ropata's Tue 21 AM (`button[data-slot-id="S-39560-2026-07-21-AM"]`) is a Public session with the note "CPH" and no List; its block reads "Public" then "CPH". Its drawer Status row reads "Public hospital · CPH", and `[data-shot=drawer-change-status]` opens the Change status sheet, where the office can pick Public and type a note. Dr Hughes Tue 21 AM (`S-46822-2026-07-21-AM`) is Free, a handy session to set to Public.

**Public is a session status (catch-up Phase 32d).** Id `publicHospital`, label "Public", long label "Public hospital", the purple public colour, solid; not open for bookings or cover, so it works like Unavailable. Four statuses in Master data, Availability statuses (rows `tr[data-status-row=publicHospital]`; the footnote `[data-shot=availability-statuses-list-types]` reads "Private and Pre-op are kinds of List, shown on the List, not availability."). The `public` List kind is gone: List kinds are Private and Pre-op, and the seeded public Lists holding Bookings are private Lists with the same ids (Dr Sharma Tue 14 Jul AM `L-41267-2026-07-14-AM`, Dr Souter Thu 23 Jul AM `L-34821-2026-07-23-AM` with 8 Bookings, Dr Ropata Tue 21 Jul PM, Dr Whitaker Tue 21 Jul AM and Fri 17 Jul AM, Ropata Thu 16 Jul AM and others). Bookless public sessions are Public with the note "CPH". Seven weekly Public series, `AS0001` to `AS0007`: Souter Thu AM, Sharma Tue AM, Ngata Tue AM, Ropata Tue and Thu both sessions, Delaney Mon PM, Hughes Mon AM, Whitaker Tue, Thu and Fri AM. On the phone, My calendar (`/mobile/availability/calendar`) status chips include Public hospital, "Your series" lists "Public hospital, Thursday AM, every week, no end date" for Dr Souter, and Add days off (`mobile-add-days-off`) offers four status choices (`[data-status-choice=publicHospital]`, note placeholder "For example, CPH").

**Draft Lists** (catch-up Phase 31, `/admin/draft-lists`). 10 in the pristine seed since catch-up Phase 32d (was 15, then 16), ascending by date. Three request Draft Lists: `LD-001` St George's / Mr S. Tan Tue 21 PM (phone), `LD-002` Forte Health / Mr V. Nand Wed 22 PM (email, 2 Bookings), `LD-003` Christchurch Eye Surgery / Ms A. Reid Mon 27 AM (PDF). Dr Rutherford's Wed 22 AM List returned to the office (`L-29104-2026-07-22-AM`, catch-up Phase 32b, below) is one too. The other six are recurring-clash Draft Lists, ids `LD-<RCBnnn>-<date>-<session>` (e.g. Dr Beaumont's Southern Cross Wed 22 AM and PM, `LD-RCB020-2026-07-22-AM` and `LD-RCB021-2026-07-22-PM`, and her Christchurch Eye Surgery Fri 24 AM `LD-RCB022-2026-07-24-AM`; Ngatai Wed 22 AM and Mon 27 PM). Phase 32d removed `LD-RCB013`, `LD-RCB016`, `LD-RCB027`, `LD-RCB028`, `LD-RCB029` and `LD-RCB030` (Ngata's Tue 21 AM and the others fell on Public sessions); use `LD-RCB022-2026-07-24-AM` for an "unavailable colleague" clash. A List's state is DRAFT, ACTIVE, SUBMITTED or AUTHORISED; assigning a Draft List makes it ACTIVE. The Unassigned table is `[data-shot=draft-lists-table]` with rows `[data-draft-list-row=<id>]` (Origin is the 7th column; the Day cell is blank on all but the first row of a day). Demo actions: `simulate-incoming-request` (Draft Lists page; adds a Reid Thu 23 PM request by default), `add-draft-list-for-day` (Day view), `stage-recurring-clash` (Recurring bookings view). Adding Dr Beaumont (`31902`) on Thursday AM with hospital and surgeon on the recurring sheet creates a Draft List. Dr Sharma (`41267`) is not preferred with Ms Reid.

**Wed 22**

- Souter PM is free.
- Rutherford AM (catch-up Phase 32b): his session `S-29104-2026-07-22-AM` is Unavailable, note
  "Unwell, short notice", recorded by the office (Kirsty W., 07:40), with no List and no conflict: the
  office returned his Christchurch Eye Surgery List, now a Draft List with the same id
  (`L-29104-2026-07-22-AM`, origin "Returned: anaesthetist unavailable", block
  `[data-draft-block=L-29104-2026-07-22-AM]` in the Wed 22 band). The S2 Beat 4 target: assign it to
  Dr Sharma (Wed 22 AM Free). Unavailability is never a conflict.
- Real conflicts (catch-up Phase 30), four Lists, each block `button[data-conflict=true]` in the amber
  conflict colour:
  - The Southern Cross closure `HH900` "Theatre maintenance closure" flags Morrison PM
    (`L-25490-2026-07-22-PM`), Ngata PM (1 Booking), Sharma PM (`L-41267-2026-07-22-PM`, 2 Bookings)
    and Hughes AM.
- Other seeded conflicts: Labour Day Mon 26 Oct (8 Lists) and Canterbury Anniversary Fri 13 Nov
  (5 Lists), every hospital closed. Since catch-up Phase 42 both are **master public holidays** (`PH001`,
  `PH002`; AA's rooms listed open), not per-hospital holiday rows: on the hospital calendar they show as a
  read-only block `[data-public-holiday=PH001]` inside `button[data-calendar-day="2026-10-26"]`, and they are
  kept on `/admin/masters?view=publicHolidays`. `HH900` is the only seeded hospital holiday. open conflicts count 16 since catch-up Phase 32d (the nav badge reads 16, was 19); Tue 21 has none.

**Fri 24:** the prepayment warning (a warning, never a block, since catch-up Phase 15a; no gate, no
override). AM awaits approval (catch-up Phase 27, see [Prepayment lifecycle](#prepayment-lifecycle-catch-up-phase-27)): Annette Riley's Booking (`BK0034`) carries a small warning triangle on its
row in all three apps, and opening it shows the warnings panel at the top (`[data-shot=booking-warnings]`,
"Prepayment of $1,200.00 from Annette Riley is awaiting approval on Invoices and has not been sent.",
Before procedure, Mild on Tue 21 Jul, Strong from Wed 22; under it the prepayment panel `[data-shot=booking-prepayment]`
with the office's "Approve on Invoices" link; there is no "Raise pre-procedure invoice" button since catch-up Phase 27). It still completes and submits through the usual
sheet. On Admin Day Fri 24 the Souter AM block has the amber outline and a triangle with "1"
(`[data-shot=daygrid-block-warnings]`, the block button itself), her drawer row carries the same
outline (`[data-shot=drawer-booking-warning]`), and the To-do card under the calendar
(`[data-shot=admin-warnings-todo]`) lists the warning with Open and Clear. PM is paid (Priya Nair:
the panel `booking-prepayment` reads "Pre-payment received").

**Review queue (pristine):** nine SUBMITTED Lists: Morrison, Whitaker, Souter Mon 20 AM and PM, Ropata, Delaney,
Dr Chen's Tue 14 Jul AM (the review-flags List, catch-up Phase 21a) and Fri 17 Jul AM (the payer review List, catch-up
Phase 21), and since catch-up Phase 23 Souter Mon 13 AM (the three-procedure Booking; a second "Souter · Forte Health"
row, so open a List by its route, never by row text).
Authorising Morrison raises 6 invoices.

**Web accounts (backdrop history)**

- Outstanding (was Overdue before catch-up Phase 38): Tane, Marsh, Chen, Prentice (ACC), Holt, Foster, Mitchell, Walker.
- Catch-up Phase 38: the seeded dashboards slice (`seed/anaesthetistDashboard.ts`) is gone, and with it the web
  dashboard's Productivity and Leave panels and the receivables ageing panel; the dashboard's Financial position and
  every money view read the ledger. June 2026 has seeded payouts for the GST report's `previous-month` shots.
- Paid: Bennett, Webb, Mills, Riley, Park, and the 29 January to March 2026 accounts (catch-up Phase 38a).
- Search examples (catch-up Phase 38a): "Mitchell" or `CQY9304` (three: Mon 27 Jul, Tue 14 Apr, Fri 13
  Mar; never her Booking on Dr Sharma's List), "Prentice" (Mon 20 Jul PM and the June ACC Booking),
  "Prescott" (Noah Prescott, NHI `ZAP3016`), "tane".

**Also seeded:**

- A cancelled booking on Morrison's list.
- A parent paying for a minor: Grace Park (BK0033, Chen Fri 24 AM), Hana Park (Mother) the payer on
  each of her two Procedures (catch-up Phase 22a: P0035 and P0186, both `BP0001`, Different payer ticked), no
  child warning.
- An insured-reimbursement booking: Rutherford, Thu 16 AM (BK0030, Marcus Webb): No contract · RVG,
  invoiced to the patient, AIA Health named as insurer with number `AIA-2026-30418`, no warning.
- Patient-billed history (catch-up Phase 40; Dr Sharma's backdrop, off the office Invoices list and monitor):
  Sarah Mitchell AA-2026-HS01 $610.00 raised 14 Apr (98 days, unpaid, billed to her: the strong warning) and
  HS02 $540.00 paid 10 Feb; Losa Tuilagi $380.00 unpaid; Mere Walsh $290.00 unpaid; Heather Sinclair AA-2026-HS05
  $260.00 paid, then credited (credit note CN-2026-HS05, "Credited" pill, "In credit $260.00", never paid out). Dr
  Souter's own Mitchell invoice is hospital-billed (Other payers). The `NO_NHI_LIST` rows arrive only through
  `receive-no-nhi-list`; the seed's own waiting row is `IRS001`.
- Patients and the NHI (catch-up Phase 40): every Booking has a patient with an NHI; the NHI is mandatory and a row without one waits (below). Noah Prescott is `ZAP3016`.
- Repeat patients: Mitchell and Walker.
- Two hospital-billed Procedures on Mon 20 Jul, markers `mon20HolderBilled1` and `mon20HolderBilled2` (once the missing billing references; the reference is gone since catch-up Phase 25a).

**AA fee (catch-up Phase 16):** Dr Souter's AA-FEE-2026-H01 (May, paid) and H02 (June, unpaid), ACCRECs
`XRFH01` / `XRFH02`. Sample settings: $350.00 + $150.00 fixed, $5.00 per BCTI, ex GST. "Seed a month of BCTIs"
gives Dr Rutherford 40 paid July BCTIs (`L-RB-…` Lists on 1 to 6 July, invoices `AA-2026-RB01…RB40`), so
the next run raises his $700.00 before GST ($805.00 with GST).

**Xero contacts:** no personal information. Patient and billable-party contacts are named "Patient PT…" /
"Billable party BP…" (for example `xero-contact-pt0017` is "Patient PT0017", archived; `xero-contact-bp0001`
"Billable party BP0001"). Find a Xero contact, row or card by invoice number or hidden ID, never a patient name.

**NHIs:** Ellison ZAA0067, Tane ZBC1123, Chen ZAE0310, Prentice ZAC3326, Holt ZAF4434.

**Anaesthetist's own List move** (catch-up Phase 32; `LIST_MOVE_DEMO` in the seed, pinned by
`domain/seed/listMoveSeed.test.ts`). Dr Souter's St George's Mon 27 Jul PM List `L-34821-2026-07-27-PM`
(Ms G. Lim, 1 Booking) is the movable one: on `/web/availability?date=2026-07-27` her PM cell's Move lists
seven free colleagues, among them Dr Hannah Ropata (`39560`), who has a not-preferred pairing with Ms Lim
(PP-005) and is offered like anyone else (the privacy case). Her Thu 23 Jul AM List
`L-34821-2026-07-23-AM` is the one to return to the office from List detail; her Thu 23 Jul PM session
`S-34821-2026-07-23-PM` (AA rooms, Ms K. Patel, 6 Bookings) is the unavailable prompt's (inside mobile's
six-day strip). Colleagues' triggers never pick a List or session in `SCRIPTED_BEAT_SCHEDULE` or a List
with a conflict. The notification pool seeds empty; ids are `NT0001` on.

**Single-Booking move** (catch-up Phase 32a; `BOOKING_MOVE_DEMO` in the seed, pinned by
`domain/seed/bookingMoveSeed.test.ts`). S2 Beat 6: Dr Souter's Wed 22 Jul AM Christchurch Eye Surgery
List `L-34821-2026-07-22-AM` (Mr J. Whitford, 6 Bookings), Booking `BK0046` (Lachlan Robinson). Free that
session, in name order: Delaney, Morrison, Ngata, Ropata, Sharma, Whitaker (tiers mixed); Dr Whitaker
(`36208`) is the scripted receiver, Dr Ropata (`39560`) the second (`BK0047`, office tick off). Dr Chen
(`45178`) is not available (type "ch"), Dr Fitzgerald (`43015`) already holds a List (type "fitz").
The not-preferred receiver: Mrs Riley's `BK0034` (Fri 24 AM, Ms Lim) to Dr Ropata (PP-005), Reset after.
The prepaid honour line: the paid Nair Booking `BK0038` (Fri 24 PM). The stand-in's candidate, from a
reset and before the other stand-ins that fill her Wed 22 PM: Dr Hughes's `BK0140` (Wed 22 PM,
Christchurch Eye Surgery, Ms Reid). The acceptance beat: the appended `BK0162` on Dr Beaumont's Fri 31 Jul
AM List, offered only after Souter sets her Fri 31 AM (`S-34821-2026-07-31-AM`, Unavailable) available.
A moved Booking lands on a new List `LG0001` on.

**Out-of-hours sessions** (catch-up Phase 32c, US-01.1.6): none is seeded, so every existing day and shot
is unchanged; the Admin Day ruler runs 07:00 to 18:00 unless the day has an out-of-hours session (or an
evening Draft List). The schedule settings hold its default times, 18:00 to 21:00. Stage one live:
- **Admin (product control):** on `/admin/day/2026-07-21`, `hover` the row's right gutter `[data-day-grid-row="34821"] .aa-row-gutter`,
  click `[data-day-grid-row="34821"] [data-shot=out-of-hours-open]`, then
  `[data-shot=out-of-hours-open-sheet] >> role=button[name="Open out-of-hours session"]`. It opens session
  `S-34821-2026-07-21-OOH` (Free) and lands on its drawer: `role=button[name="Assign List"]` (the usual
  `[data-shot=admin-assign-list]`, `H-SX` and the second `select` `S-PATEL`), or a waiting evening Draft List
  under `[data-shot=drawer-session-draft-lists]` (`role=button[name="Assign here"]`). The block is
  `[data-shot=daygrid-evening-block]` on her row; the ruler then runs to 21:00.
- **An evening Draft List:** `/admin/draft-lists`, New Draft List, hospital and surgeon, then click the
  session choice `text="Out-of-hours"`.
- **Mobile (PWA Demo sheet):** `{ "trigger": "office-adds-out-of-hours-list" }` on `/mobile/lists`: opens
  tonight's session and assigns a List at the hospital and with the surgeon of Dr Souter's latest List
  (Southern Cross, Ms K. Patel on a fresh seed). Her row is `[data-shot=out-of-hours-row]`, after the PM List.
- **Web:** stage it through the Admin steps in `setup`, then `start` at `/web/lists` (the row is
  `tr[data-shot=out-of-hours-row]`), `/web` (the week strip block `[data-slot-id="S-34821-2026-07-21-OOH"]`) or
  `/web/availability` (an Out-of-hours column on a day that has one).

### One Contract per Procedure (catch-up Phase 20) and who is billed (catch-up Phase 21)

- Every seeded Procedure carries one Contract; there is no billing route, payment category or
  Procedure insurer. Who is billed follows the Contract (`billablePartyForProcedure`): one that bills
  its holder bills the holder Party (a hospital, nib, COS, the Aria clinic's `BP0002` record); any other
  (No contract · RVG `CT-NO-CONTRACT`, the surgeon and anaesthetist price lists, every prepaid one)
  bills the Procedure's payer. Doyle's bariatric Booking (BK0028) is one invoice to the patient,
  Gareth Mills ($2,861 + GST).
- **Payers (catch-up Phase 21; on each Procedure since 22a):** every seeded patient has an `@example.net` email and
  an NZ Post postal address, except Kevin Doherty (none on purpose); every Procedure's payer is its patient
  except Grace Park's (Hana Park, `BP0001`) and the family trust below (`BP0003`). New payers are `BP0004`
  on.
- **The payer review List (catch-up Phase 21):** `SEED_LIST_IDS.payerReview` = `L-45178-2026-07-17-AM`
  (Dr Chen, Fri 17 Jul, Christchurch Eye Surgery, Ms Reid), SUBMITTED, in the Review queue, off every
  beat. BK0170 Ella Moana, 15 (`childPayer`: child payer warning); BK0171 Kevin Doherty
  (`payerContactMissing`: "Email or postal address needed" chip and Review flag `review-payer-contact`);
  BK0172 Robert Whitcombe, payer the Whitcombe Family Trust by post (`familyTrustPayer`, no flag);
  BK0173 Janet Ormsby, NIB on `CT-NIB-D1` with no approval number (`approvalMissing`: the approval
  warning; the rail suggests Special › NIB); BK0174 Peter Tawhiri, Health NZ with no number
  (`funderNoWarning`, no warning). Patients `PT0152` to `PT0156`.
- **Insurer or funder (catch-up Phase 21):** every Booking on nib's Contract names NIB with number
  `NIB-AP-<booking number>` (for example BK0074 `NIB-AP-0074`, the approval sample's default target),
  except BK0173. BK0175 Lucy Fairhall (`suggestedTag`, `PT0157`): Dr Fitzgerald's Thu 23 Jul AM List at
  Southern Cross, Southern Cross Health Society with `SCHS-2026-55120`, no Contract yet, so the Billing
  card opens on step 1 with Southern Cross marked Suggested.
- Prepaid Contracts: Dr Souter's price list (`CT-SOUTER-RHINO` $1,200, `-BLEPH`, `-BREAST`, and
  `CT-SOUTER-RHINO-COS` retired in Phase 27, plastic surgery and ENT). Riley (BK0034, P0036) and Nair's cosmetic
  component (BK0038, P0041) are both on the Rhinoplasty Contract at $1,200.00 ex GST.
- "Needs an invoice destination" at reset (no Contract): BK0035 (Souter Mon 27 AM, the PDF
  Booking) and the six pre-ops BK0060 to BK0065 (Souter Thu 23 PM, AA rooms). BK0060 carries the
  answers so far Patient › Standard, for the anaesthetist's pick-up. Sarah Mitchell's Booking created on Matching (S1) arrives
  with none, unless the office chose one.
- Good rail Bookings: BK0046 (Souter Wed 22 AM, Christchurch Eye Surgery, Mr Whitford: Patient, the
  hospital under SXAP, HNZ and ACC, Special); BK0009 (Southern Cross, one tag, SXAP fills itself in;
  its Contract combo starts with the No contract backstops, No contract · Fixed price reading "Type the amount", a
  typed one "Price typed $X" or "No price typed yet" in the procedure stack); BK0034 (Ms Lim: Merivale's items under
  Patient › Standard, Souter's list under Prepaid for the office); BK0023 (Mon 20 AM, SUBMITTED).

### A payer on each Procedure (catch-up Phase 22a)

- **No Booking-level Payer card** in any app: the payer is on each Procedure, in its Billing card's Paid by line
  (`procedure-split-row`, the payer's name `paid-by-payer` with `data-procedure-id`), the same on the phone. Two actions:
  `paid-by-change` ("Change", beside the payer's name, only where the Contract bills the payer) opens the one Paid by
  sheet with who pays and the offer only; `procedure-split-button` ("Split", on the right, whenever the Booking is
  editable and has a Contract) opens it with the split alone (title "Split the fee"). No Contract: no actions and `payer-not-billed` ("Payer:
  not billed yet").
- **Grace Park (BK0033, `/admin/day/2026-07-24/bookings/BK0033`)** now has two Procedures, P0035 and P0186, both paid by
  Hana Park (Mother, `BP0001`). "Raise sample warnings" puts "Under 18" on both Paid by lines (`payer-under-18`, one per
  Procedure) with one to-do row (`todo-child-warning`) on the Admin dashboard.
- **The two-payer Booking** (`SEED_MARKERS.twoPayerBooking`): BK0183 Joyce Halvorsen on the payer review List
  `L-45178-2026-07-17-AM` (`/admin/day/2026-07-17/bookings/BK0183`), Procedures P0187 and P0188 both paid by Erik
  Halvorsen (Son) typed twice, so two payers, `BP0004` and `BP0005`, same name and email. Authorising that List raises two
  invoices for BK0183 (payers are never matched on name or email). BK0171 Kevin Doherty (contact missing) is on the same List.
- **Other routes:** a No-Contract Procedure with no payer yet: P0037 on BK0035 (`/admin/day/2026-07-27/bookings/BK0035`);
  a nib holder-billed unsplit Procedure: BK0007; the split Booking BK0025 (nib $132.50, Alan Prentice the rest).

### RVG detail, completion and review flags (catch-up Phase 21a)

- **What the form asks follows the pricing kind.** On an RVG Contract the capture form shows
  `capture-rvg-detail` (times, units and the modifiers step); on a fixed or open price the times, units and
  modifiers are hidden and the RVG code is for reference only. The live S1 RVG case is Margaret Ellison
  BK0009 (`L-34821-2026-07-21-PM`): her blockers at reset are "Add any modifiers that apply, or tap None
  apply." and "Add the finish time.", so a recipe that completes her taps "Finish now" and
  `[data-shot=capture-modifiers-none]` before Mark complete. Every seeded completed Booking already
  answers the modifiers step.
- **Fixed price, no times** (`SEED_MARKERS.fixedPriceNoTimes`): BK0176 Miriam Holloway, "Face lift and
  upper blepharoplasty" on Merivale's Facelift plus 1 add on, Souter Mon 10 Aug PM 14:45, ACTIVE, no times,
  code or modifiers. Mark complete passes as it is. Its code row shows only after "Add an RVG code for
  reference" (`rvg-code-add-reference`; on the phone inside the Billing sheet).
  `/web/lists/L-34821-2026-08-10-PM/bookings/BK0176`, `/admin/day/2026-08-10/bookings/BK0176`.
- **Needs a price** (`SEED_MARKERS.needsPriceBooking`): BK0177 Graham Pulley, "Excision of skin lesion,
  cheek" on No contract · Fixed price with no amount, same List 16:00. The form shows the warning
  `capture-price-status` ("Needs a price"); Mark complete refuses on the price alone.
- **The review-flags List** (`SEED_LIST_IDS.reviewFlags` = `L-45178-2026-07-14-AM`, Dr Chen, Tue 14 Jul AM,
  Christchurch Eye Surgery, Mr Whitford, SUBMITTED, in the Review queue, off every beat):
  `/admin/review/L-45178-2026-07-14-AM`. BK0178 Diane Fairweather (`contractChangeBooking`: "Changed by Dr
  Chen: was Cataract IOL (LA by Anaesthetist)" with Approve and Correct); BK0179 Owen Prendergast
  (`typedPriceBooking`: "Price typed: $1,200.00 (computed ...)"); BK0180 Hemi Walker (`reviewNeedsPrice`:
  "Needs a price" and "Not marked completed"); BK0181 Rosalind Kerr (`otherSurgeonContract`: "Contract not
  offered on this List"). S2's Morrison Mon 20 List raises no flag.
  Since catch-up Phase 25a the List has a fifth Booking, BK0190 Margaret Ellery (P0197, `disabledContractBooking`), on the seeded Disabled Contract
  "Christchurch Eye Surgery 2025 rate" (`CT-CES-2025`, disabled Fri 10 Jul by Kirsty W.): its flag is `review-flag` with `data-rule=contractDisabled`,
  "Contract disabled on Fri 10 Jul". The List now shows 5 Bookings. The disabled Contract shows in the Contracts master only under Disabled or All.
  Disable Merivale's Face lift (`CT-MER-FACELIFT`, Contracts master, `contract-disable`) and `/admin/review/L-34821-2026-08-10-PM` flags each Face lift
  "Contract disabled on Tue 21 Jul"; the panel's warning lists Sophie Matthews, Paula Westerman, Fiona Lattimer and others. The seed marker formerly
  `missingBillingRef1/2` is now `mon20HolderBilled1/2`.
- **The movable Booking** (`SEED_MARKERS.movableFixedBooking`): BK0182 Fiona Lattimer, Face lift (Merivale,
  linked to Ms Lim), Souter Mon 10 Aug PM 17:00, ACTIVE. On `/admin/day/2026-08-10` open her PM List
  (`button[data-list-id="L-34821-2026-08-10-PM"]`), click the row's Move, and pick her AM List with Mr Okafor
  (`L-34821-2026-08-10-AM`). Her Contract is unchanged; `/admin/review/L-34821-2026-08-10-AM` (Review
  renders any List but a Draft one, ACTIVE included) shows `review-flag` with `data-rule=contractNoLongerFits`.

### Invoice presentation, delivery and the split (catch-up Phase 22)

- **The fee-split Booking** (`SEED_MARKERS.feeSplitBooking`, `scenario.feeSplit`): BK0025 Alan Prentice, Knee arthroscopy
  (P0026) on No contract · RVG, Souter Mon 20 PM (`L-34821-2026-07-20-PM`, SUBMITTED), fee $212.00 before GST. The office
  split it on the Booking (a seeded audit row by Kirsty W.): nib $132.50, Alan Prentice the rest ($79.50). Its Billing card's
  Paid by line on `/admin/day/2026-07-20/bookings/BK0025` reads "nib $132.50, Alan Prentice $79.50 (the rest)"
  (`procedure-split-summary`; owner review 2026-11-17, idea 6). There is no Funder allocation and no billing-line allocation any more.
- **S3 invoice numbers** (authorise AM, then PM, through `/admin/review/<listId>`): AM raises AA-2026-0002 Brian Holt to
  Forte Health ($365.70, holder layout), 0003 and 0004; PM raises AA-2026-0005 nib ($152.38, holder layout, emailed to
  claims@nib.example, with the split note), AA-2026-0006 Alan Prentice ($91.43, patient layout, emailed to
  alan.prentice11@example.net), and 0007 and 0008 to St George's (holder layout, "Your reference SGANAES01"). PM's banner
  reads "4 invoices raised. 4 emailed, 0 to post." Authorise only PM and the numbering starts at AA-2026-0002. Invoice ids
  are runtime, so find an invoice by its number in the list.
- **Supplier and agent:** every invoice is issued in the anaesthetist's name with their GST number (`invoice-supplier`);
  seeded GST numbers are `104<registration>1` (Dr Souter 104-348-211) on every anaesthetist but Dr Strand (47733), whose
  record reads "Not held" and whose invoices would read "GST number not held". AA as agent has the synthetic GST number
  102-345-678. To shoot "GST number not held" on a live invoice, edit Dr Souter on `/admin/masters?view=anaesthetists`,
  clear "GST number (optional)", save, then authorise the Mon 20 AM List: AA-2026-0002's supplier reads "GST number not
  held".
- **Holder reference codes** (printed as "Your reference" on the holder's layout only): St George's RVG (`CT-STG-D1`)
  `SGANAES01`, nib RVG (`CT-NIB-D1`) `NIBAN2026`; no other Contract holds one. nib's split share is on No contract · RVG,
  so it prints none: shoot "Your reference" on AA-2026-0007 or 0008.
- **Layout follows the Contract:** the holder's layout when it bills its holder (Aria's `BP0002` record included), the
  patient's when it bills the payer. `INV0001` (the paid prepayment) is the seeded patient-layout invoice.
- **Delivery:** every hospital, nib, COS and Aria Party delivers by email; Unisports (`PY-UNI`) by post. A payer's
  invoice goes to the payer's email, else their postal address. On the payer review List (`L-45178-2026-07-17-AM`),
  authorising raised "5 invoices raised. 3 emailed, 1 to post. 1 needs an invoice address." before 22a; BK0183 adds two
  invoices to Erik Halvorsen (7 raised, 5 emailed by that arithmetic; confirm at capture): BK0172 Robert Whitcombe
  (payer the Whitcombe Family Trust, PO Box, no email) is "To post" with "Simulated posting" and "Provisional (OQ-122)";
  BK0171 Kevin Doherty's reads "No invoice address" with an email field and Send, and the Billing monitor shows
  `monitor-no-address`.
- **The guardian's invoice:** no live List bills Grace Park, but the history invoice AA-2026-H13 (`/admin/invoices/HINV13`,
  Paediatric strabismus, May 2026) is billed to Hana Park and reads "Emailed to hana.park@example.net".
- **History invoices** carry the supplier, agent and delivery stamped at raising; every seeded ACCPAY carries the
  buyer-created tax invoice (`xero-accpay-buyer-created` on `/demo/xero/invoices/XRH01`).

### The primary Procedure and the multi-procedure rule (catch-up Phase 23)

- **Every Booking has one primary Procedure, listed first** everywhere (capture, the procedure stack, the Booking
  total, Review, invoice lines). With one Procedure nothing changes on screen. With two or more, the primary's heading
  row (`[data-testid=procedure-header] >> nth=0`) carries the neutral pill `procedure-primary-pill` ("Primary"), and
  each additional Procedure's heading row has the teal text action `make-primary` ("Make primary", beside Remove).
  It opens `make-primary-sheet` ("Make this the primary procedure?", confirm `make-primary-confirm` "Make primary",
  cancel "Keep <old>"); after confirming, the new primary moves to the top with the pill. Anyone with edit rights:
  the office on ACTIVE and SUBMITTED Lists, the anaesthetist on her own ACTIVE List (a completed Booking needs Amend
  first).
- **An additional Procedure** shows the note `procedure-additional-note` ("Additional procedure. Base units are
  charged on the primary procedure only. It earns its own time units, and an equal share of the Booking's modifiers
  once they total more than 4."), its Units card's B row `units-row-b` reads 0 with "Base units are on the primary
  procedure", and the caption row `modifiers-on-primary` ("Modifiers are recorded once for the Booking, on the
  primary procedure.") replaces the Modifiers section. A ranged RVG group shows `rvg-range-additional` ("Base not
  charged on an additional procedure"). Reach the additional's rows as `[data-shot=capture-units] >> nth=1 >>
  [data-shot=units-row-b]`.
- **Ellison** (`BK0009`, Souter Tue 21 PM): one Procedure until "Add another procedure"
  (`role=button[name="Add another procedure"]`) is clicked; then two, the added one additional, starting on the primary's
  Contract. The anaesthetist demo of Make primary: `/web/lists/L-34821-2026-07-21-PM/bookings/BK0009`,
  `/mobile/lists/L-34821-2026-07-21-PM/bookings/BK0009`.
- **The three-procedure Booking** (`SEED_MARKERS.multiProcedureBooking`): `BK0184`, Graeme Tullett (`PT0166`, 74, so
  A1 pre-applied), on Dr Souter's Mon 13 Jul AM List `L-34821-2026-07-13-AM` (Forte Health, Mr C. Okafor),
  SUBMITTED, completed. Procedures `P0189` laparoscopic cholecystectomy (primary; AS3, OB3 and ASE claimed), `P0190`
  umbilical hernia repair and `P0191` inguinal hernia repair, all on No contract · RVG. Admin
  `/admin/day/2026-07-13/bookings/BK0184`: the Booking total `[data-testid=booking-calculation]` holds
  `booking-total-split` with rows noted "Primary · B + T + M 3 of 7", "Additional · T + M 2 of 7" (twice) and the
  caption "Modifiers 7, split 3 · 2 · 2"; total $636.00. Make primary on the umbilical repair gives $583.00. Review
  `/admin/review/L-34821-2026-07-13-AM`: `review-modifier-split` ("M 7 · split 3 · 2 · 2") and
  `review-procedure-share` per Procedure ("Primary · B + T + M 3 of 7" first).
- **Holt** (`BK0022`, Souter Mon 20 AM, `/admin/day/2026-07-20/bookings/BK0022`): `booking-total-split` rows
  "Primary · B + T" and "Additional · T" (modifiers of 4 or fewer stay on the primary).
- **The mixed Booking** (`BK0028`, Doyle bariatric, Fitzgerald Tue 14 Jul AM, `/admin/day/2026-07-14/bookings/BK0028`):
  `booking-total-split` rows "Primary · fixed price" and "Additional · T", caption "No base units billed
  (provisional, OQ-132)". A fixed or open price keeps its price and takes no modifier share.
- **Office billing setup** headings read "Office billing setup · primary procedure" or "· additional procedure";
  `office-billing-setup-<n>` is numbered in display order, so `-1` is always the primary.
- Two-procedure Bookings also in the seed (primary first): `BK0033` Grace Park, `BK0038` Priya Nair, `BK0183` Joyce
  Halvorsen.

### Change price and the price line (catch-up Phase 24)

- **Pricing kinds.** Five: RVG at the anaesthetist's rate, RVG at the Contract's rate, RVG less the Contract's
  discount, fixed price, open price. The Contract panel's Pricing section (`contract-settings`) holds the kind, the
  "Rate ($ per unit)" or "Discount (%)" field, and on RVG kinds the "Anaesthetist may override the price" Yes/No. The
  Contracts list shows `contract-override-pill` on RVG kinds only: "Anaesthetist can override the price" (No contract ·
  RVG `CT-NO-CONTRACT`, Forte Health RVG `CT-FORTE-D1`) or "Price fixed for the anaesthetist" (Aria `CT-ARIA-HOURLY`,
  `CT-FORTE-DISC`, every other RVG Contract); none on a fixed or open price. Rate x time is gone everywhere: no
  Method 3 setting, and (catch-up Phase 39b) no Add billing line at all: other charges are billing events.
- **Aria at the Contract's rate:** `CT-ARIA-HOURLY` "Aria Skin and Laser Clinic" (id kept), RVG at $26.50, override
  off. Fitzgerald's Booking BK0029 (`contractRateBooking`, Wed 15 Jul AM `L-43015-2026-07-15-AM`, Forte, Ms Lim,
  completed but the List is ACTIVE, so it cannot be authorised in the UI) is the abdominoplasty A5, 08:30 to 11:30,
  no modifiers: 22 units x $26.50 = $583.00 (was 3.0 hours at $480, $1,440). `/admin/day/2026-07-15/bookings/BK0029`.
  Dr Souter's uncaptured Aria Booking BK0037 (`contractRateCaptureBooking`, Mon 27 Jul AM) reads 0 units x $26.50,
  read-only.
- **The discount Contract** (`discountContract`): `CT-FORTE-DISC` "Forte Health RVG less 10%", holder Forte, bills the
  holder, override off, seeded last so no AA code moved.
- **Dr Souter's Mon 27 Jul AM List** `L-34821-2026-07-27-AM` (Forte, ACTIVE) holds one Booking per price-line state:
  BK0185 (`discountBooking`, breast reduction on `CT-FORTE-DISC`: 6 units x $26.50 = $159.00, Discount 10% · minus
  $15.90, $143.10, read-only), BK0186 (`priceCaptureBooking`, skin flap repair on No contract · RVG: 4 units x $26.50
  = $106.00, state `override`) and BK0037 (Aria, read-only). Routes `/mobile/lists/L-34821-2026-07-27-AM/bookings/<id>`,
  `/web/lists/L-34821-2026-07-27-AM/bookings/<id>`, `/admin/day/2026-07-27/bookings/<id>`.
- **Her own price list** (`ownListFixedBooking`): BK0034 Riley, Fri 24 Jul AM `L-34821-2026-07-24-AM`, Rhinoplasty on
  her prepaid price list: "Fixed price $1,200.00", read-only ("... alert the office.").
- **Open price** (`openPriceBooking`, the same Booking as `needsPriceBooking`): BK0177, Mon 10 Aug PM
  `L-34821-2026-08-10-PM`, No contract · Fixed price, state `amount`, "Needs a price" until a price is typed.
- **The range beat** (Merivale's Face lift `CT-MER-FACELIFT`, one range $3,100 from 1 Jun 2026): BK0163 (19a's unedited
  Face lift, Mon 10 Aug PM, $3,100), BK0182 (the movable one, also unedited), BK0187 (`rangeTypedBooking`, Mon 10 Aug PM
  17:45, the office typed $2,950.00), BK0188 (`rangeAuthorisedBooking`, Dr Souter's Thu 16 Jul PM List
  `L-34821-2026-07-16-PM` at AA's rooms, seeded AUTHORISED and invoiced at $3,100.00) and BK0038
  (`rangePrepaidBooking`, the paid prepayment; its prepaid Procedure is the additional one, `office-billing-setup-2`).
  Run `demo-backdated-range` (see Demo actions) and only BK0163 and BK0182 move, to $3,300.00.
- **No charge** (`noChargeBooking`): BK0189 Ihaia Paewai, scar revision on No contract · RVG, completed with a typed
  $0.00 by Dr Souter, on the SUBMITTED Mon 13 Jul AM List `L-34821-2026-07-13-AM` (beside BK0184). Review
  `/admin/review/L-34821-2026-07-13-AM` shows `review-no-charge` ("No charge") in its Fee cell. Authorise ("Authorise
  for billing", click `>> nth=0` then `>> nth=-1`): BK0184 raises AA-2026-0002 and BK0189 AA-2026-0003, whose page
  shows `invoice-no-charge` ("No charge").
- **The typed-price Booking** (`typedPriceBooking`): BK0179 Owen Prendergast on Dr Chen's SUBMITTED Tue 14 Jul AM
  review-flags List `L-45178-2026-07-14-AM`, an office-typed $1,200.00 (computed $265.50), no reason.
  `/admin/day/2026-07-14/bookings/BK0179` shows `office-billing-price` "Typed $1,200.00" and the Booking total "Price
  typed · computed $265.50". Review's Fee cell `review-fee` holds `review-fee-computed` ("Computed $265.50") beside the
  `review-flag` with `data-rule=typedPrice`.
- **The price line** on every Booking's capture (mobile, web and Admin), after the RVG detail: `[data-shot=price-card]`
  with `data-state` = `override` | `amount` | `read-only` | `needs-price` | `no-charge` | `locked`. Inside:
  `price-card-figures` (mono lines "4 units x $26.50 = $106.00", "Discount 10% · minus $15.90", "Fixed price $1,200.00"),
  `price-card-price` (the price), `price-card-needs-price` (in place of the price), the input `price-card-input` (label
  "Price $"), `price-card-save` ("Save price") and `price-card-clear` ("Use the computed price", once a price is typed on
  an override Contract). Type a price with `fill` on `[data-shot=price-card-input]` then `click`
  `[data-shot=price-card-save]`: the card shows a "Price typed" pill and "Computed $106.00". At $0.00 the caption reads
  "The RVG detail stays recorded. This gives a no-charge invoice." and `data-state=no-charge`. Read-only cards read
  "Set by {Contract}. To use a different price, change the Contract or alert the office." (her prepaid price list:
  "... alert the office."). The office (Admin) sees the card read-only, with no reason line; it changes the price with
  Change price. On mobile scope it `[data-testid=slide-booking] [data-shot=price-card]` and scroll
  `[data-testid=mobile-booking-scroll]` by 200 after scrolling to it, so the dock does not cover it.
- **What the price comes to:** the phone's dock strip `[data-shot=booking-total-strip]` (also
  `data-testid=booking-calculation`), always above Mark complete, units and the price ticking as modifiers are claimed;
  the web and Admin rail panel `[data-testid=booking-calculation]`, which holds `[data-shot=booking-total-lines]` when a
  single Procedure has more than one fee line (the discount: the gross fee, then "Discount 10%").
- **The office's Change price** replaces Price override on the Admin Booking (see "Admin booking" under Overlays):
  any price, no reason, the computed price beside it, until the List is AUTHORISED. Shoot it on an ACTIVE or SUBMITTED
  List, for example `/admin/day/2026-08-10/bookings/BK0176` (fixed price), `/admin/day/2026-07-21/bookings/BK0009`
  or `/admin/day/2026-07-20/bookings/BK0010`. On BK0038 (`/admin/day/2026-07-24/bookings/BK0038`,
  `office-billing-setup-2`) the sheet shows the price read-only with `pricing-sheet-refusal`.
- **GONE:** the anaesthetist's "Adjustment and charge" card (`capture-adjustment-and-charge`, its "Adjustment $" /
  "Charge $" control, reason field and "Save override").

### The lock at authorise and Contract history (catch-up Phase 25)

- **Authorise writes a lock per Booking.** "Authorise for billing" on Review (click `>> nth=0`, then the confirm's
  `>> nth=-1`) copies each Procedure's Contract settings, the range in force, units, rate, price, who is billed, the split
  and the payee onto the Booking, in the same step as the List flip. The confirm's text names the lock ("... locks each
  Procedure's Contract onto it: its settings, the price range in force, the rate, the price, who is billed and who is
  paid ..."). After it, Review shows the lock glyph `procedure-contract-locked` in each Procedure's compact stack, the
  totals row's `review-list-rate` reads "@ $26.50/unit (locked)", each patient cell `review-locked-payee` ("Paid to Dr
  Melanie Souter"), and the banner "List authorised · locked for billing".
- **Seeded AUTHORISED Lists carry locks** (written at seed time, e.g. BK0188 on `L-34821-2026-07-16-PM`), so their
  Bookings show the badge at reset. The seeded history backdrop (the `HINV<nn>` invoices) carries **migrated** locks:
  their stamp, the invoice's Locked record and the Contract History's locked rows read "Migrated history" ("Migrated
  history: locked from the invoice as loaded") instead of "Locked <when> by <who>".
- **The Booking after authorise** (S3 AM, `/admin/day/2026-07-20/bookings/BK0023`, Ruth Kim; Holt is BK0022):
  `office-billing-setup-1` carries `data-locked="true"` and is read-only (Contract with its settings, Billed to, Price
  with "N units @ $26.50/unit (locked)", Split when not Full, Paid to, `office-billing-locked-stamp`), with
  `booking-lock-badge` ("Contract locked at authorise") in its heading. The Billing card shows the badge too, with
  `booking-lock-stamp` ("Locked Tue 21 Jul, 08:00 by Kirsty W."), and the price line's `price-card` has
  `data-state=locked`. Before authorise: no badge, the editable setup. Scope the badge as
  `[data-shot=office-billing-setup-1] [data-shot=booking-lock-badge]` (it also shows on the Billing card).
- **"Needs a price" blocks authorise** (the only blocker): Dr Chen's SUBMITTED Tue 14 Jul AM List
  `/admin/review/L-45178-2026-07-14-AM` shows `review-needs-price-blocker` ("<patient>: Needs a price: No contract ·
  Fixed price has no price of its own." with an Open link) and "Authorise for billing" disabled. No seeded scripted List
  is blocked.
- **A rate-per-unit edit re-prices unlocked Bookings only.** Edit Dr Souter on `/admin/masters` (`[data-shot=masters-anaesthetists]
  tr:has-text("Souter") >> text="Edit"`, fill `[role=dialog] >> role=textbox[name="Rate per unit ($)"]`, "Save changes"): after
  the S3 AM authorise, BK0023 keeps "@ $26.50/unit (locked)" while her ACTIVE BK0186 (Mon 27 Jul AM, No contract · RVG)
  reads "4 units x $28.00 = $112.00". Forte Health RVG (`CT-FORTE-D1`) is RVG at the anaesthetist's rate; Health NZ
  (`CT-HNZ`) is RVG at its own $23 rate and has no price ranges (only fixed-price Contracts have ranges).
- **Invoice Locked record**: `/admin/invoices/<id>` (after the S3 AM authorise, open AA-2026-0002 from `/admin/invoices`)
  shows the rail card `invoice-locked-record`: Contract with its AA code and settings, Billed to, Price with units and the
  "(locked)" rate, Split, Paid to, Priced on, and the stamp. The demo action `regenerate-invoice` writes
  `invoice-regenerated` under it: `data-identical="true"` and "Regenerated from locked data: identical (n lines, total
  $x)", or `data-identical="false"` with the differences. No card on prepayment or AA fee invoices.
- **Contract History** (`/admin/masters?view=contracts`, open a Contract by clicking its row's first cell,
  `tr[data-contract="CT-FORTE-D1"] >> td >> nth=0`): tabs `contract-tab-details` and `contract-tab-history`. History
  holds `contract-history` (the shared History timeline, newest first, who, when, before and after; empty:
  `contract-history-empty`, "No changes yet") and `contract-locked-against` ("Procedures locked against this Contract",
  rows `contract-locked-row` with the patient, Booking id, "Locked <when>" or "Migrated history", and invoice links).
  **Seeded Contracts have no create audit**, so stage an edit first (Details tab, change a field such as "Invoice
  description", "Save contract", which closes the panel; reopen and click History). The History tab's footer is a single
  Close.
- **Parties** (`/admin/masters?view=parties`): every row has a "History" action (`role=button[name="History of <party>"]`)
  opening the shared History sheet ("History · <party>"); empty until the Party is edited.
- **Billing failure, re-based**: see `billing-failure` under Demo actions. No Contract is changed and
  `choose-contract-sheet` is gone.

### Anaesthetist profile, HPI CPN and bank account (catch-up Phase 26)

- Every seeded anaesthetist has a mandatory `hpiId` (Souter `10SOUM`, Rutherford `11RUTJ`, Sharma `12SHAP`; prefixes 10
  to 23 are anaesthetists, 40 to 99 surgeons, so a new one in a recipe can take `30KERN`) and a mandatory bank account on
  bank 99, `99-0101-<registration, 7 digits>-00`: Dr Souter's is `99-0101-0034821-00`, shown masked
  `99-0101-•••••21-00` everywhere but the office's Edit field. There is no GST period anywhere (retired; the web GST tab
  is a calendar month); the GST number (Phase 22) stays office-held and off the anaesthetist's profile.
- Master data, Anaesthetists (`/admin/masters?view=anaesthetists`, `masters-anaesthetists`): columns Name, Reg, Rate per unit
  (the third column, so `table th:nth-child(3)` is the rate per unit), Tier, HPI CPN, Bank account (masked, cell
  `anaesthetist-bank`), GST number, Phone, Email, Start date, Active, Edit.
- The Edit sheet (`edit-anaesthetist-sheet`) and the Add sheet (`add-anaesthetist-sheet`) both hold "HPI CPN (required)"
  and the bank block `anaesthetist-bank-fields` ("Bank account name (required)", "Bank account number (required)");
  "Save changes" and "Add anaesthetist" stay disabled, with a printed reason, until all three are filled. Fill them by
  `input[data-validation-field=hpiId|accountName|accountNumber]` scoped to the sheet's hook.
- Dr Souter's rate per unit is $26.50 on `/mobile/more` (Profile card) and `/web/profile` (Billing panel); the
  anaesthetist changes only that, and the change re-prices her unlocked Bookings as the office's edit does.

### Prepayment lifecycle (catch-up Phase 27)

- **Seed.** Prepayment approval is on. Riley (Annette Riley, `BK0034`, Souter Fri 24 Jul AM
  `L-34821-2026-07-24-AM`) awaits approval: $1,200.00 ex GST on Dr Souter's prepaid Rhinoplasty Contract, no
  invoice. Nair (Priya Nair, `BK0038`, Fri 24 Jul PM `L-34821-2026-07-24-PM`) has `INV0001` = `AA-2026-0001`,
  $1,200.00 plus GST = $1,380.00, approved by Kirsty W., paid; its ACCPAY (`XRB0` pair) credits the "AA Holding
  account" (contact `XCHOLD`), not disbursed. Her septoplasty stays on Forte's Contract (the final invoice's only
  line once authorised: `INV0002`). Demo date Tue 21 Jul 2026.
- **GONE:** the "Raise pre-procedure invoice" button, any deposit or estimated-fee invoice, "Less pre-payment
  deposit", balance invoices, `CT-SOUTER-RHINO-COS` and the $238.50 and $274.28 amounts.
- **Admin Booking detail** `/admin/day/:dateISO/bookings/:bookingId`: the panel `[data-shot=booking-prepayment]`
  ("Pre-payment awaiting approval", "Pre-payment received", "Part paid"), one block per payer
  `[data-shot=prepayment-group]` (`data-payer-key`), the office link `[data-shot=prepayment-approve-link]`
  ("Approve on Invoices"), the invoice link `[data-shot=prepayment-invoice-link]`. After the List is authorised,
  `[data-shot=booking-prepaid-left-off]` reads "Prepaid, left off the final invoice (AA-2026-0001)" or "Prepaid in
  full, no final invoice (...)". The Contract rail's re-check line is `[data-shot=prepayment-recheck]` ("Pre-payment
  no longer needed"; the Paid by row shows the same hook after a save).
- **Units row** `[data-shot=capture-prepaid]`: "Prepaid $1,200.00 · paid", read-only, inside the procedure block on
  mobile and web. The price card `[data-shot=price-card]` reads "Prepaid amount" for a prepaid Procedure.
- **Admin Invoices** `/admin/invoices`: the strip `[data-shot=invoices-awaiting-approval]` (card "Awaiting approval",
  `data-rows` count), rows `[data-shot=awaiting-approval-row]` (`data-booking-id`, `data-payer-key`), the button
  `[data-shot=approve-and-send]` "Approve and send" (disabled, reason "Type an amount above zero first", when not
  ready), the switch `[data-shot=prepayment-approval-switch]` (role switch, "Prepayment approval"; switching off
  opens a confirm whose primary is `[data-shot=prepayment-approval-off-confirm]` "Switch off"), and the result line
  `[data-shot=approve-and-send-result]`. Approve Riley with
  `[data-shot=awaiting-approval-row][data-booking-id=BK0034] [data-shot=approve-and-send]`.
  Since catch-up Phase 41 that click opens the letter dialog: wait for `[data-shot=prepayment-letter-picker]`, then
  click `[data-shot=prepayment-letter-send]` (see Overlays).
- **Admin Day** `/admin/day/2026-07-21`: the rail card `[data-shot=rail-prepayments]` ("Pre-payments"), rows
  `[data-shot=rail-prepayment-row]` (`data-booking-id`, `data-status`). 15a's triangle and To-do card are unchanged.
- **Billing monitor** `/admin/billing`: `[data-shot=monitor-prepaid-left-off]`. **Review:** the chip
  `[data-shot=review-flag-prepayment]` ("Prepaid, left off", "Pre-payment sent, no longer needed", "Pre-payment sent
  before a change").
- **Xero sim** `/demo/xero/invoices/XRB0` (and Riley's pair `XR0001` once sent): the ACCPAY "to" reads "AA Holding
  account", "Simulated payable crediting the AA Holding account, not the anaesthetist".
- **Staging.** Approve and send, the switch, the typed amount (rail Patient › Prepaid › `CT-FIX-PATIENT-PREPAID` Prepaid · Fixed
  price under the "No contract" heading, then `[data-shot=contract-rail-amount]`) and a second payer are product
  controls (real clicks); never a trigger. A payment, the clock jump and the two-payer Booking use the `trigger` step
  (see Demo actions). Nair's final invoice needs the PM List completed, submitted and authorised (`/web/lists/...-PM`,
  "Mark complete", "Mark list completed", "Submit to office", then `/admin/review/L-34821-2026-07-24-PM`).

### AA Holding account (catch-up Phase 27a)

- **Seed.** Nair's prepayment `INV0001` = `AA-2026-0001` ($1,380.00, paid 14 Jul) is **held**: its pair `XRB0`
  (ACCREC) and `XPB0` (ACCPAY) credits the AA Holding account (Xero contact `XCHOLD`, contact number `AA-HOLDING`),
  authorised $1,380.00, disbursed $0.00. Case `BC0001` is the collect leg. **No transfer at reset**, and the
  Payables run panel (`[data-shot=billing-payables-run]`) shows nothing due: a held payable is never in the run.
- **Billing monitor** `/admin/billing`: the card `[data-shot=billing-prepay-holding]` "AA Holding account": the
  balance (mono, `data-holding-balance`, $1,380.00 at reset), "Held for 1 prepaid Booking. Leaves only by a system
  transfer or refund.", a warning pill "Moves to the anaesthetist when the List is authorised · to confirm with AA (OQ-125)",
  and entry rows `[data-shot=holding-entry]` (`data-entry-kind` received|transferred, `data-booking-id`); empty
  state "Nothing held". A journal fault shows on the List's pipeline Booking row as
  `[data-shot=monitor-journal-fault]` ("Transfer journal waiting for Xero · attempt N · next try HH:mm ...", catch-up
  Phase 37), retried by the Xero sync queue ("Retry now" on its queue row), not by a row button.
- **The transfer at authorise.** Authorising Nair's List (complete, submit, authorise: the steps under
  Staging above; US-06.5.1 and US-09.1.3 carry them) writes the transfer `PXT0001` and its Xero manual journal
  `MJ-0001` automatically, with no office step. Then: the card shows a Transferred row naming "Dr Melanie Souter",
  balance $0.00; the payables panel ("Authorised, awaiting Xero's payables run" since catch-up Phase 37) lists
  1 payable due, $1,380.00; clicking "Run payables in Xero" (`[data-shot=billing-run-payables-in-xero]`) shows
  `[data-shot=billing-payables-result]` "Xero paid 1 bill ($1,380.00); the Billing Engine recorded 1 disbursement
  from the bill-paid webhooks." (wait for that hook; the old "Run PR0001" line is gone).
  Since catch-up Phase 39a the transfer waits in the payment cycle's `payables-run-draft` instead, and "Run payables in
  Xero" stays disabled until `payment-cycle-close`, `payment-cycle-approve` and `payment-cycle-send` have been clicked;
  the result line then reads "Week 30 paid in Xero: ...". US-06.5.1 and US-09.2.4 carry the clicks.
- **Xero sim** `/demo/xero/invoices/XRB0`: the ACCPAY card's flow text "Held until the List is authorised, then
  moved by a transfer to the anaesthetist who did the List. Leaves only by a system transfer or refund."; before
  the transfer the callout `[data-shot=xero-holding-held]` "Held in the AA Holding account"; after it
  `[data-testid=xero-transfer-journal]` (Manual journal MJ-0001, "Transfer, not a payment", two lines, "How this
  posts in Xero is still to be confirmed"). The settle button reads "Pay out of the AA Holding account" and is
  refused ("The customer payment is recorded. Money leaves the AA Holding account only by a transfer or refund the
  system raises.").
- **Admin invoice** `/admin/invoices/INV0001`: the rail's `[data-testid=xero-accpay-payee]` "AA Holding account";
  after authorise `[data-testid=xero-transfer-journal-reference]` "MJ-0001".
- **Anaesthetist.** Web `/web/accounts/payments`: row `[data-testid=payment-history-row-AA-2026-0001]`, its pill
  `[data-shot=payment-held]` "Held until the List is authorised"; after authorise and Run payables in Xero, "Paid to you"
  (no `payment-held` then). Units row `[data-shot=capture-prepaid]` "Prepaid $1,200.00 · paid · held by AA until
  the List is authorised" (inner `[data-shot=capture-prepaid-holding]`); the Pre-payment panel line
  `[data-shot=prepayment-holding]` (`data-holding-state` held|transferred|paidOut): "Held by AA until the List is
  authorised" for the anaesthetist; Admin reads "Transferred to Dr Melanie Souter", then "Paid to Dr Melanie
  Souter". Mobile Balances no longer lists a held prepayment (catch-up Phase 38: Outstanding is the unpaid payables in
  the anaesthetist's position), so `balances-payment-held` is gone; the web Payments tab's `payment-held` pill stays.
- **AA fees** `/admin/billing/aa-fees`: a prepayment payable is not a BCTI, so Dr Souter's July preview is 2 BCTIs,
  $510.00 at reset (was 3, $515.00).
- **Words.** "AA Holding account" and "transfer"; never "prepay holding account" or "second pair".

### Hospital sample files and their rows (catch-up Phase 33)

At reset the intake slice holds only the seeded waiting row and its stub (Phase 33a, below); Matching's Import hospital file dialog offers four sample files
(`domain/intake/hospitalDownloads.ts`, every patient synthetic, the wording from AR-35). Each import
lands its rows in file order (R1 first); a second import of the same file adds nothing ("All 5 rows
were already imported. Nothing new.").

- `SAMPLE_STG` (St George's theatre list, Tue 28 Jul to Tue 4 Aug): R1 Sarah Mitchell, New, suggested
  "Create Booking on Dr Souter, Tue 28 Jul AM", text `lap appy ?conv to open` (AR-35 row 14); R2 Dylan
  Kereama, No change; R3 Diane Foster (`BK0043`, Tue 4 Aug AM), Modification: a new time, the hospital's
  fuller wording replacing `WLE MM` (AR-35 row 27) and the note "Bumped 15 min at surgeon request"
  (three ticks, "Apply 3 changes"); R4 Marcus Webb (`BK0042`, Souter Mon 3 Aug PM), Cancellation
  ("Cancel Booking"); R5 Marcus Webb Tue 4 Aug AM, New. R4 and R5 together are the day move (no
  "Reschedule" anywhere).
- `SAMPLE_STG_UPDATE` (a day later): Sarah Mitchell's update (09:00, a note, "Laparoscopic
  appendicectomy, may convert to open"). Once R1's Booking exists it is a Modification of it, "Matched by
  date, surgeon, hospital and session, then NHI", "Apply 3 changes"; before that it is a New row.
- `SAMPLE_SX` (Southern Cross, Tue 28 Jul to Thu 6 Aug; surgeon Ms K. Patel): R1 Priya Nair, New; R2
  "Olivia Ratima" (`BK0166`: the corrected name and date of birth, the insurer "nib · Approval 4471203",
  a note); R3 Hemi Walker on the AUTHORISED Wed 18 Mar List (`HBK08`): the "List authorised" flag and the
  footer disabled with "This List is authorised and locked"; R4 Tama Henare with no NHI (Unmatched,
  "Waiting for an NHI"; its stub stands on Dr Souter's Tue 28 Jul PM List; type `ZQA1008` in `matching-nhi`
  and press Add NHI, `stub-add-nhi`, and the Booking takes the stub's place, Phase 33a); R5 Grace Whitu Thu 6 Aug PM (Unmatched, "No List at Southern Cross for Ms Patel on Thu 6 Aug
  PM"). Two Unmatched rows from the file after import, three with the seeded row.
- `SAMPLE_FORTE_SHEET` (Forte Health daily sheet keyed by the office): R1 Peter Langley New onto Mr
  Okafor's Tue 28 Jul AM; R2 Rosa Mendes with a mistyped NHI check digit (flagged, corrected inline);
  R3 Hugh Barnett Fri 31 Jul PM, no Forte List (create a Draft List).
- A Booking created from a row has no Contract unless the office chose one, so it lands on Admin Day's
  Needs an invoice destination card (the banner's "Needs an invoice destination" pill).
- MSG-STG-1014 (fired from a `/demo/integrations` route since catch-up Phase 34) stages "Alan Prentice", a change
  to a SUBMITTED List, still appliable.

### Stubs on a List (catch-up Phase 33a)

- Matching is no longer empty at reset: the seed holds one waiting row with no NHI, `IRS001` (batch `IBS001`,
  "Southern Cross theatre list, Tue 4 Aug"): Mere Tipene, Southern Cross, Ms K. Patel, "Lap chole", 14:00, Tue 4 Aug
  PM. It sorts after the ready rows (Unmatched), so after an import `matching-row-1` and `matching-received` are still
  the file's first ready row; the Open and Unmatched counts and `nav-badge-intake` (was `nav-badge-matching`) are one higher than in Phase 33.
  Select it with `[data-shot^='matching-row-'][data-import-row-id=IRS001]` (or router state `{ selectRowId: 'IRS001' }`).
- Its stub `STB0001` stands on Dr Souter's Tue 4 Aug PM List `L-34821-2026-08-04-PM` (Southern Cross, Ms K. Patel),
  which has no Bookings, only the stub. The NHI to type on Matching is `ZQA1024`: fill `[data-shot=matching-nhi] >>
  role=textbox`, then click `[data-shot=stub-add-nhi]` (typing alone no longer releases a row whose stub stands) and
  wait for `[data-shot=matching-banner]`; the Booking takes the stub's place on that List.
- Importing `SAMPLE_SX` places a second stub for R4 Tama Henare on Dr Souter's Tue 28 Jul PM List
  `L-34821-2026-07-28-PM` (2 Bookings, 13:00 and 14:00; the stub at 15:30 sorts after them). Add NHI with `ZQA1008`
  resolves it the same way.
- Admin Day: open the drawer with `button[data-list-id="L-34821-2026-08-04-PM"]` on `/admin/day/2026-08-04`.
  `/admin/review/L-34821-2026-08-04-PM` renders the ACTIVE List with the stub row.

### Rooms' PDF lists and where a List came from (catch-up Phase 34)

- **The seeded PDF list `PDL0001`** (`domain/seed/intakeSeed.ts`; the `pdfList` counter starts at 2, so the next upload
  or re-send is `PDL0002`): Mr C. Okafor, Forte Health, "Operating list · Wednesday 5 August (AM)", suggested List
  Dr Rutherford Wed 5 Aug AM (a session with no List, so the first decision creates it), sent from
  `leanne.pa@avonsidesurgical.example`, received 07:10, status `received`. Rows: R1 Brian Holt, R2 Margaret Ellison
  with NHI printed `ZAA0068` (fails its check digit; red border, Send refused until corrected to `ZAA0067`), R3 Hemi Parata.
  Open it with `[data-shot=pdf-inbox] tr[data-pdf-list-id=PDL0001]`; correct with `[data-shot=pdf-row-2] input >> nth=0`
  (the NHI field) then `[data-shot=pdf-row-2-apply]` ("Save correction"); the line "NHI ZAA0068 corrected to ZAA0067 ·
  <who>, <when>" shows in `pdf-correction`. `pdf-send` stages the 3 rows on Matching (micro-cap "Rooms PDF"), and the
  result line's `pdf-open-matching` link opens `/admin/intake/matching`.
- **Upload samples** (`domain/intake/pdfLists.ts`, the dialog `pdf-upload` badged "Sample files"; cards
  `[data-sample-id=...]`, "Sent from" `pdf-upload-sender`, prefilled and required, confirm `pdf-upload-confirm`):
  `PDF-OKAFOR-0805` (already received at reset, so not offered) and `PDF-WHITFORD-0812` (Mr J. Whitford, Christchurch
  Eye Surgery, Dr Strand's existing Wed 12 Aug PM List, sent from `bookings@merivaleeye.example`; R3 Joan Pickering has
  no NHI, so she waits at intake with a stub). After Upload the review opens on the new list.
- **The re-sent list** (`pdf-list-resend`, choice `PDF-OKAFOR-0805`): enabled once Okafor's list has been sent. It
  arrives from `admin@avonsidesurgical.example`, marked Re-sent, status received (`tr[data-status=received]` is then
  the only received row): Margaret Ellison moved to 09:45 and Ruth Calder added. Send skips the unchanged rows. To show
  the changed time as a difference, decide Margaret Ellison's first row first (her panel: `role=radio[name=/Create a
  List in a session/]`, then `role=button[name=/Rutherford/] >> nth=0`, then `matching-apply`), as US-02.2.1's `resent`
  state does. In `visual/intake-pdf-lists.spec.ts` the first decision (Brian Holt) creates `BK0191` on
  `/admin/day/2026-08-05/bookings/BK0191`, whose `booking-list-origin` reads the PDF origin and its sender.
- **List origins.** Every List has an `origin`: Lists a recurring booking projects read "From a recurring booking",
  every other seeded List "Entered by hand". Two pinned Lists (`domain/seed/listOrigins.ts`, `SEED_ORIGIN_LISTS`), both
  with no Bookings:
  - `pdf`: Dr Hughes Tue 11 Aug AM `L-46822-2026-08-11-AM` (Forte Health, Mr Nand), "From a rooms' PDF · sent from
    anna.pa@fendaltonspecialists.example" with "Replies go to" that address (the sender wins over Mr Nand's first office
    contact). Open on `/admin/day/2026-08-11` with `button[data-list-id="L-46822-2026-08-11-AM"]`.
  - `hospital`: Dr Sharma Mon 3 Aug PM `L-41267-2026-08-03-PM` (Southern Cross, Mr Hale), "From the hospital's list ·
    Southern Cross". Open on `/admin/day/2026-08-03`.
  - A by-hand List with a Booking: Dr Souter Fri 24 Jul AM `L-34821-2026-07-24-AM` (`BK0034`); open its drawer on
    `/admin/day/2026-07-24`, its Booking at `/admin/day/2026-07-24/bookings/BK0034`.

### Internal ledger (catch-up Phase 36)

- **At reset the ledger is in balance and no anaesthetist is out of balance**: `/admin/ledger` shows
  `[data-shot=ledger-balance][data-in-balance=true]`, the empty out-of-balance list, no unmatched receipts card and
  no `nav-badge-ledger`. Every invoice is a pair (ids `BC…`; history pairs `HBC…`, AA fee pairs `HBCF01` paid and
  `HBCF02` unpaid); the old billing cases are gone.
- **Pairs worth shooting.** Nair's prepayment `BC0001` (AA-2026-0001, $1,380.00) is the one `prePayment` row
  (`[data-shot=ledger-pairs] tr[data-pair-kind="prePayment"]`), Payee "AA Holding account", held and so on the
  Open filter. The seed's AA-2026-S2401 (pair `BC-S24-01`, Souter Thu 16 Jul PM, $3,565.00) is the one pair "Not yet
  in Xero" (the tile reads 1; the Billing monitor's fault badge does not count it), and it now shows in Dr Souter's
  outstanding rows on web and mobile. After Nair's List (`L-34821-2026-07-24-PM`) is completed, submitted and
  authorised (the steps under Staging and in US-09.1.3), the transfer row `[data-pair-kind="transfer"]` appears:
  Receivable "None", Kind "Transfer" with "From AA-2026-0001", Payee Dr Souter; the prepayment row then leaves
  the Open filter (click "All" to see it). The Billing monitor's payables panel then reads "1 payable due ·
  $1,380.00 to pay out to anaesthetists." (the 27a section's "authorised" wording is older).
- **The unmatched receipt** (`inject-unmatched-receipt` on the Ledger): $120.00, id `UR0001`, key
  `UNMATCHED-DEMO-1`. Choice `souter` ("Names Dr Souter", the default) gives the reference "Bank deposit · SOUTER
  JULY", attributed to Dr Souter: the indicator reads "Out of balance by $120.00" with one
  `li[data-check=unmatchedReceiptHeld]`, `nav-badge-ledger` shows 1, Dr Souter is the one row
  `tr[data-anaesthetist-id="34821"]` of `ledger-anaesthetists-out-of-balance` ("Receipt with no matching invoice,
  $120.00"), and her scope reads "Dr Souter's ledger is out of balance by $120.00". Choice `none` ("Names no one")
  gives "Bank deposit · JULY": the whole ledger is out by $120.00 but the list stays empty. Clear it with
  `[data-shot=ledger-allocate]` ("Allocate to invoice": the dialog `ledger-allocate-dialog` lists invoices whose
  balance covers it, Dr Souter's first, each `[data-allocate-pair=<id>]`; click `>> nth=0`) or
  `[data-shot=ledger-refund]` ("Mark refunded": `ledger-refund-dialog`, a Note, `ledger-refund-confirm`). Either
  puts the ledger back in balance; the row stays with "Allocated to AA-..." or "Refunded".
- **Archived contacts.** After `run-archive-job` (from the Ledger, the Billing monitor or the Xero sim), an archived
  payer's pairs keep their rows and money, with "Contact archived in Xero" under the Xero column (Annette Riley's;
  click "All" first, since a settled pair leaves the Open filter).
- **Words.** "Ledger", "pair", "receivable", "payable", "released", "paid out"; anaesthetist screens never say ACCREC,
  ACCPAY or "mirror". Xero mirrors the ledger, never the other way round.

### Events and the additional invoice (catch-up Phase 38b)

- **Seeded event `EV0001`**: Dr Souter's additional invoice on David Chen's Procedure HP03, Booking `HBK03` on List
  `L-HIST-03` (Mon 22 Jun 2026, St George's), $85.00 ex GST, "Post-op ward review, Tue 23 Jun, 20 min", awaiting review.
  Admin `/admin/day/2026-06-22/bookings/HBK03`; web `/web/lists/L-HIST-03/bookings/HBK03`; mobile
  `/mobile/lists/L-HIST-03/bookings/HBK03` (persona Dr Souter). The anaesthetist apps are Dr Souter only, so an
  anaesthetist shot of creating an additional invoice uses Dr Souter's own Procedure on `HBK03`, never Dr Sharma's.
  The Events tab `/admin/review?tab=events` lists `EV0001`.
- **Sarah Mitchell after `stage-post-op`**: Booking `BK0032` on Dr Sharma's Tue 14 Jul AM List
  `L-41267-2026-07-14-AM` (Admin `/admin/day/2026-07-14/bookings/BK0032`). The trigger authorises and bills the
  List (no addendum Booking, no free session needed; since catch-up Phase 39b it also stages Dr Souter's Coral Bennett
  Booking, see [Pre-op, post-op and billing events](#pre-op-post-op-and-billing-events-catch-up-phase-39b)), so BK0032 is locked and invoiced and offers
  `additional-invoice-button`. After "Create additional invoice", Approve in the Events tab and the
  `run-next-billing-run` trigger, her original invoice's rail card `invoice-additional-links` lists the additional
  invoice and its own document shows `invoice-additional-of`.
- **Invoices list**: each row's `invoice-list-kind` (`data-kind=standard|prePayment|additional`) and, on an additional
  invoice, `invoice-list-additional-to`.
- **Booking total** (Admin Booking detail, David Chen's Booking): `booking-total` with an "Events" row and
  `booking-total-gst` ("ex GST · GST $x").

### Credit notes, credit and rebill, and the combined split (catch-up Phase 39)

- **Nothing is credited at reset.** A credit is raised by hand (Credit note, Credit in full and rebill, or Split into
  additional invoices), waits in Review's Events tab as an event (`review-credit-row`), and is issued only by Approve
  then the `run-next-billing-run` trigger (or the PWA's `office-reviews-credit`). The first credit note issued after a
  reset is record `CRN0001`, number `CN-2026-0001`, its negative invoice to the anaesthetist `CN-2026-0001-P`; open it at
  `/admin/credit-notes/CRN0001` or by the `CN-2026-` link in the original's `invoice-credited-banner`.
- **Sarah Mitchell after `stage-post-op`** (see the 38b notes): her invoice on `BK0032` is the office's credit target.
  Reach it on `/admin/invoices` by patient, `tr[data-invoice-id]:has-text("Sarah Mitchell") >> nth=0 >> td >> nth=0`
  (the first cell; the Patient cell is a link to the Booking), never by number: its number depends on what was billed
  first (AA-2026-0003, $238.05 billed to CPH, when the combination was staged first). After the credit and the run, the
  credited original is `tr[data-invoice-id]:has([data-shot=invoice-list-standing][data-standing=credited])`; the
  rebill is the newest row. US-08.6.2 shows the whole flow.
- **The staged combination** (`stage-combined-procedure`, on `/admin/invoices`): Dr Delaney's Fri 10 Jul PM List
  `L-27731-2026-07-10-PM` at Forte, patient Lorraine Petrie `PT0173`, Merivale's combination Contract ("Facelift,
  upper blepharoplasty and fat grafting", 13:30), billed to the patient. Right after a reset it is Booking `BK0191`,
  Procedure `P0198`, invoice AA-2026-0002 ($3,700.00 plus GST = $4,255.00). Open it from the list by patient
  (`:has-text("Lorraine Petrie")`) or the result's link "Open AA-2026-0002". The split sheet opens with two blank
  components (never fewer); typed $2,000 and $1,000, Left to allocate is not $0.00 and Save is disabled; "Put the
  rest on this invoice" on the second makes it $0.00. US-08.6.4 shows the pattern.
- **Paid out first** (`stage-refund-after-payout`, Billing monitor or `/admin/invoices/<id>`): pays the invoice in full
  and pays the anaesthetist out, so the credit sheet's `credit-money-state` reads "Dr Sharma was paid ...: a negative
  invoice for ... nets in their next payment run." On the Billing monitor it targets Sarah Mitchell's invoice (disabled
  "Stage post-op scenario first" before `stage-post-op`).
- **The anaesthetist's credit**: Dr Souter on David Chen's Mon 22 Jun Booking `HBK03` (`L-HIST-03`, invoice
  AA-2026-H03): web `/web/lists/L-HIST-03/bookings/HBK03`, mobile `/mobile/lists/L-HIST-03/bookings/HBK03` (in the app,
  reached by searching "Chen"). `anaesthetist-credit-note-button` opens `credit-form` (`data-variant=anaesthetist`: no
  money state, trail, copy or split; the chips "Less work than expected", "Wrong billable party", "Paid twice"). After
  Save the row `procedure-credit-event` reads "Credits AA-2026-H03 in full", "Raised by you", Awaiting review. The
  seeded `EV0001` (an additional invoice awaiting review) sits on the same Procedure and does not block it.
- **Office chips**: "Wrong billable party", "Wrong amount", "Less work than expected", "Split requested", "Paid twice".
  A reason is required; pick a chip with `[data-shot=credit-reason-chip]:has-text("Wrong amount")`. There is never an
  amount field: a credit is always for the whole invoice.
- **Prepaid Procedures** (catch-up Phase 41): `credit-note-unavailable` is gone. The credit note on a prepaid
  Procedure credits the whole prepayment invoice; once the List is authorised its button sits in the
  `prepaid-settlement` block, and the form shows `prepayment-credit` in place of the new-invoice cards (see
  [Prepayment letter, cancellation and differences by hand](#prepayment-letter-cancellation-and-differences-by-hand-catch-up-phase-41)).

### Pre-op, post-op and billing events (catch-up Phase 39b)

- **The staged Bennett Booking.** `stage-post-op` (see Demo actions) also gives Dr Souter a SUBMITTED ACL
  reconstruction for Coral Bennett on **Wed 15 Jul PM** at St George's, Mr T. Hale (session
  `S-34821-2026-07-15-PM`, 13:00), Contract St George's ACC `CT-STG-ACC`, completed with no modifiers. (The phase doc
  named Thu 16 Jul AM, which is a public-hospital session.) Nothing of it is in the seed and its List and Booking ids
  are runtime, so reach it by search: web `/web/lists?q=Bennett`, then
  `[data-shot=web-lookback-search] tr[data-booking-id]:has-text("15 Jul") >> nth=0`; mobile `/mobile/lists?q=Bennett`, then
  `[data-shot=mobile-lookback-search] button[data-booking-id]:has-text("15 Jul") >> nth=0`; wait for `[data-shot=procedure-events]`.
  Admin: `/admin/day/2026-07-15`, click `button[data-slot-id="S-34821-2026-07-15-PM"]`, then in the drawer
  `[data-testid=admin-list-drawer] >> role=button[name=/^Open$/]`; or the Procedure link in `event-review-sheet`. Its
  List sits in Admin Review's Lists queue: open it by `role=button[name=/^Review .*Souter.*Wed 15 Jul$/]`, then
  "Authorise for billing" twice (`>> nth=0`, then `>> nth=-1`) and wait for `text="List authorised · locked for billing"`.
  The staging runs on the web or mobile Lists (`setup`: `goto` `/web/lists`, the trigger, then `start`
  `/web/lists?q=Bennett`), so Admin shots stage it from `/web/lists` too. US-03.7.1 and US-03.7.2 show the patterns.
- **What the anaesthetist adds** (their own Procedure only): a post-op ward review defaults to 30 minutes, dated the day
  after the List (Thu 16 Jul), a pre-op event to the List's date. The anaesthetist never sees a calculation ("The office
  prices the time at review."). On CT-STG-ACC a ward review prices at the Contract's rate, 30 min = 2 time units x
  $25.00 = $50.00.
- **The Contract event fee:** `CEF001` on `CT-STG-ACC`, Pain consult, holder code `STGACC-PAIN`, "Acute pain review, fixed
  fee", $120.00. In the add sheet, Pain consult then "Fixed fee" shows it read-only (`event-contract-fee`); a timed pain
  consult is priced from it at review ("Contract fee STGACC-PAIN · $120.00 replaces 30 min"). Contract editor:
  `/admin/masters?view=contracts`, fill `[data-shot=contract-search] input` with "ACC elective", click
  `tr[data-contract="CT-STG-ACC"] >> button:text-is("Edit")`, then `[data-shot=contract-detail] [data-shot=contract-event-fees]`.
- **Billing.** Approved events are invoiced only when billing runs: authorising the List bills events approved before
  it as their own dated lines on the Procedure's invoice (`tr[data-shot=invoice-event-lines]`, e.g. "Post-op event ·
  Post-op ward review · 16 Jul 2026 · 30 min", "Billing event · Nerve catheter · 15 Jul 2026"; a credit a negative
  line); the Invoices list marks that invoice `invoice-list-event-lines` ("+2 event lines"), and clicking it opens the
  invoice. An event approved after the invoice waits for `run-next-billing-run` (`/admin/billing`) and is an invoice of
  its own: `invoice-list-kind[data-kind=additional]`, its document's `invoice-additional-of` reads "Post-op event ·
  relates to AA-2026-...". The Billing monitor counts them in `monitor-event-invoices`.
- **ACC pre-op presets** (US-05.5.2): Pre-op, then type "ACC pre-op assessment", shows three presets CS250, CS260 and
  CS70 (`acc-preop-preset`, `data-code`) and the caption `acc-codes-caption` ("Codes to confirm with AA's accountant
  (OQ-12)."). No price is held for them. The text "ACC pre-op assessment" is on the type row and on every preset, so
  click by hook, `[data-shot=event-type-row][data-type=accPreOpAssessment]`.
- **Gone:** the BillingLine entity, the Add billing line sheet and the billing-lines card (no `capture-billing-lines`,
  "Add billing line" or "What this line charges"). The seeded billing lines are billing events with their old figures.
  US-03.3.6 is Retired and has no recipe shots.

### Public holidays, retire and the controlled loads (catch-up Phase 42)

- **Public holidays** (`/admin/masters?view=publicHolidays`, `masters-public-holidays`, rows
  `tr[data-public-holiday=<id>]`): `PH001` Labour Day 2026-10-26 and `PH002` Canterbury Anniversary Day
  2026-11-13 (regional), both with AA's rooms (`H-AAROOMS`) open; `PH003` Christmas Day 2026-12-25, `PH004` Boxing
  Day (observed) 2026-12-28, `PH005` New Year's Day 2027-01-01, `PH006` Day after New Year's Day (observed)
  2027-01-04, `PH007` Waitangi Day (observed) 2027-02-08. Labour Day is a public holiday now, not a hospital row.
  Each hospital card's line `[data-public-holiday-line]` reads "Closed on all public holidays" or "Open on ..."
  (AA's rooms: "Open on Labour Day and Canterbury Anniversary Day"). `HH900` (Southern Cross, 22 Jul) is the only
  seeded hospital holiday.
- **Retire** (hospitals, surgeons, surgeon groups, AA's own modifiers): nothing is retired at reset, so "Show retired"
  reads "None retired". St George's (`H-STG`, `role=button[name="Edit St George's"]`) cannot be retired: fill
  `[data-shot=retire-section] textarea`, click "Retire hospital", and `retire-blockers` lists its upcoming Lists.
  AA's rooms has no retire section.
- **No AA modifier is seeded**: add one first ("Add AA modifier", code `input[placeholder="e.g. AAX1"]`, units
  `input[placeholder="e.g. 1"]`, factor `input[placeholder="What the modifier is for"]`, "Add modifier"), then
  `role=button[name="Edit <code>"]` opens `edit-aa-modifier` with its retire section.
- **Sample sheets** (`SAMPLE_SHEETS`, `domain/masterLoad/samples.ts`; the `load-sample-spreadsheet` choice is the id,
  labelled by file name): `sample-specialties` specialties.csv, `sample-surgeons` surgeons.csv (10 rows · 5 valid ·
  5 rejected: Mr Peter Lawry, no specialty, rejected; Dr Matthew Corrigan, no HPI CPN, and "Dr Aroha", no surname,
  valid with notes; Jane Mercer "No title"), `sample-anaesthetists` anaesthetists.csv, `sample-hospitals`
  hospitals.csv (6 rows · 2 valid · 4 rejected; loads Rangiora Day Surgery and Ashburton Hospital),
  `sample-hospital-holidays` hospital-holidays.csv, `sample-public-holidays-2027` public-holidays-2027.csv,
  `sample-rvg-groups` rvg-groups.csv (7 rows · 3 valid · 4 rejected; a repeated code is valid), `sample-modifiers`
  modifiers.csv, `sample-parties` parties.csv, `sample-funding-tags` funding-tags.csv, `sample-contracts`
  contracts.csv (9 rows · 4 valid · 5 rejected; the prepaid RVG "Septoplasty" row rejected, "Hip arthroscopy fixed
  fee" with "1 range"), `sample-price-ranges` price-ranges.csv. Seed load shows 12 sheet cards
  `[data-seed-sheet=<entity>]` in load order.
- **The go-live pack** (`GO_LIVE_PACK`, `domain/masterLoad/goLive.ts`, staged by `go-live-data-load`):
  go-live-surgeons.csv, go-live-rvg-groups.csv, go-live-parties.csv, go-live-contracts.csv (the Halswell Surgical
  Group Contracts `HSG-GL01` to `HSG-GL07`), go-live-price-ranges.csv and go-live-public-holidays-2027.csv, beside 14
  Solutions Plus operation names (5 excluded as junk, 2 not approved). Rows `tr[data-scan-row=<n>]` carry
  `data-decision=approved|notApproved|junk`; each staged row's one button is "Approve" or "Unapprove <name>".

### Scale and privacy (catch-up Phase 43)

- **Load full-scale data** (`load-full-scale`, bar only, on `/admin/day/:date`, `/admin/invoices` and
  `/admin/invoices/:invoiceId`; it has a confirm step, which the `trigger` step clicks). It replaces the demo data with
  the whole practice, built in the browser from the same seed: 85 anaesthetists, their sessions over the scheduling
  horizon and about 28,000 invoices from the last 12 months. The trigger returns at once; generation takes about 2 to 3
  seconds, during which the banner `scale-banner` reads "Generating full-scale data from the seed. This takes a few
  seconds." Once loaded the banner (under the harness bar, so it shows in shots) reads "Full-scale data · 85
  anaesthetists · N sessions over the scheduling horizon (M months) · N invoices in the last 12 months · generated in
  X s · saving paused ..." with the Timings toggle `scale-timings-toggle`, which opens `scale-timings` (one row per
  timed screen, `tr[data-timing=<key>]`: Demo data, Full scale, Full scale painted). Wait for the toggle, not the
  banner: the banner also shows while generating. The generation time and the timings differ on every run.
- **In memory only.** The full-scale data is never saved: any `goto`, reload or Reset returns to the demo data. In a
  recipe, load it in the state's steps (or in `setup`, since the move to `start` does not reload) and move between
  Admin screens by clicking the side nav, `nav[aria-label="Admin"] >> role=button[name="Audit"]` (names carrying a
  count badge still match, as the name match is a substring: `role=button[name="Billing monitor"]`). Each state is a
  fresh context, so every state loads it again. Worked example: `recipes/US-15.0.4.json`.
- **Paged screens at full scale:** Day view (30 anaesthetists a page, `day-grid-pager`), Invoices (50 a page,
  `invoices-pager`), Audit (100 a page, `audit-pager`), Ledger (`ledger-pager`), Billing monitor (20 anaesthetists a
  page, `billing-monitor-pager`, "Anaesthetists 1 to 20 of 77"; per group "Show all N" and a nested pager). Every pager
  is the one `Pager` (`nav[aria-label="Pages"]`, the range `[data-pager-range]`, "1 of 3" `[data-pager-page]`, buttons
  "First page", "Previous page", "Next page", "Last page"). At demo scale none shows.
- **Raw hospital row** (`/admin/intake/matching`): the seeded row waiting for its NHI, `IRS001` Mere Tipene, is the
  one to shoot (`[data-shot^='matching-row-'][data-import-row-id=IRS001]`). A rooms' PDF row reaches Matching only after
  `PDL0001` is corrected and sent (the steps in [Rooms' PDF lists](#rooms-pdf-lists-and-where-a-list-came-from-catch-up-phase-34));
  its panel also shows `matching-restricted`. `matching-raw-row-other-role` (bar, choices `souter` "As Dr Melanie Souter
  (anaesthetist)" and `feed` "As the hospital feed (integration)") acts on the selected row or, with none selected,
  the oldest row needing resolving, and is refused: "Refused: only office staff can view a raw hospital row (Mere
  Tipene's row). The attempt is in the audit trail." Run it with no row panel open (the panel covers the harness bar).
- **NHI leak scan** (`scan-nhi-leaks`, bar, `/demo/data`, choices `now` "Scan now" and `planted` "Scan with a planted
  test leak (proves the scan finds one)"): fills `nhi-scan-report`. Scan now finds none (the `xero` row also checks
  personal details; core rows read "Held by design"); planted adds the row `tr[data-scan-area=planted]` with one masked
  hit.
- **Synthetic data only** badge `synthetic-data-badge`: in the harness bar only (hidden in shots), so no shot can show
  it. It is not repeated inside the apps.
- **Changes show without signing out** (US-15.0.7): an Admin save on `BK0009` (Margaret Ellison, Dr Souter Tue 21 PM,
  16:00; six "5 minutes later" clicks then `booking-save` make it 16:30) shows on the web List after a `setup` (same
  origin). The PWA (:5174) cannot see an Admin save, so its shot uses the `office-edits-booking` stand-in (the time 30
  minutes later, also 16:30), then the header's "List" back button.

### Weekly payment runs and remittance (catch-up Phase 39a)

- **Backdrop runs.** Every seeded payout belongs to a paid weekly run, one per ISO week of its payment dates: `PRH01`
  to `PRH13`, Week 29 (13 Jul to 19 Jul) the newest, each tagged Seeded, closed, approved and scheduled by "Office
  (seeded)", with Xero batch payments `XBPH..`. None nets a negative invoice. So at reset the Billing monitor's card
  reads "Payment cycle · Week 30 · 20 Jul to 26 Jul 2026" with nothing waiting (`payment-cycle-close` disabled), the
  runs table's first row is Week 29, Paid, Seeded, and Dr Souter's web Remittances list starts at Week 29.
- **Bank lines.** `billing.bankLines` is the bank download the close reconciles against: one line per seeded payment
  (`BNKH001`..., reference the invoice number; AA fee payments are left out, as they go to AA's own account). Every
  live payment (the Xero simulator's payment entries, `web-payment-full`, the staging below) writes its own line, so
  closing the week after an ordinary payment raises no anomaly.
- **Stage a payment week** (`stage-payment-week` on `/admin/billing`): nineteen of Dr Sharma's invoices on her 29 and
  30 Jun Lists (`PPINV01`..., numbers `AA-2026-PP01`...), each paid by the ordinary payment webhook, released into
  Week 30. Choice `bctis`: message "19 payables released for Dr Sharma into Week 30. Close the week to start the run."
  Choice `withCredit` also credits `AA-2026-PP20`, already paid out to her, so a negative invoice (the first credit
  note, `CN-2026-0001-P`) waits to net: "... A negative invoice of -$365.70 is waiting to be netted." Disabled
  "Already staged for this week" once run.
- **The netting run.** `withCredit`, then Close, Approve, Send and Run payables in Xero: run `PR0001` (the first live
  run), Dr Sharma 19 BCTIs, positives $10,837.86, netted -$365.70, net $10,472.16; result "Week 30 paid in Xero: 19
  BCTIs, 1 negative invoice netted, $10,472.16 paid to 1 anaesthetist."; `/admin/invoices/PPINV01` then reads "Paid out
  in Week 30 · $54.30 · netted $365.70", and her advice is `/admin/billing/payment-runs/PR0001/remittance/41267`.
- **The anomaly and the hold.** `bctis`, then `stage-bank-mismatch`, then Close: one anomaly "Receipt not on the bank
  download" and Approve disabled. "Hold out of this run" on it moves its line (`AA-2026-PP19-P`) under "Rolls into
  Week 31"; Approve, Send and Run then pay 18 BCTIs, the card moves to Week 31 and the held line comes back there
  tagged `payment-cycle-rolled` "Rolled from Week 30".
- **No back door.** `stage-refund-after-payout` and the PWA's `pwa-office-runs-payables` pay out through a run too
  (a one-line run tagged Staged, or the week's own run), so they appear in `payables-runs`.

### Prepayment letter, cancellation and differences by hand (catch-up Phase 41)

- **Seed.** Letter templates `LT001` to `LT003`, one default per kind. Riley (`BK0034`, Souter Fri 24 Jul AM) still awaits
  approval; "Approve and send" on `/admin/invoices` now opens the letter dialog, and the invoice goes only on its own
  send (`prepayment-letter-send`). Right after a reset Riley's invoice is the next number, AA-2026-0002 (the examples
  below assume it). Nair (`BK0038`, `INV0001` = AA-2026-0001, $1,380.00 paid and held, Souter Fri 24 Jul
  PM `L-34821-2026-07-24-PM`, `SEED_LIST_IDS.prepaymentPaidList`) was sent with `LT001`, so `/admin/invoices/INV0001`
  shows the letter at reset. No separate refund Booking is seeded: Nair is the paid case, Riley (approved first) the
  unpaid one.
- **The letter and the reminder.** Riley approved and sent, then her Admin Booking
  `/admin/day/2026-07-24/bookings/BK0034` offers `prepayment-reminder`; its dialog previews the reminder with the
  amount still to pay and sends to the payer's invoice email; then `prepayment-reminder-sent` on the panel,
  `rail-prepayment-reminded` on Admin Day's Pre-payments card, and `invoice-reminder-line` on the invoice. On the
  phone (`/mobile/lists/L-34821-2026-07-24-AM/bookings/BK0034`) the anaesthetist reads `prepayment-letter-by-office`;
  the PWA stand-ins `pwa-office-approves-prepayment` then `pwa-office-sends-prepayment-reminder` stage it there.
- **Nothing automatic after the procedure.** Authorise Nair's List (complete, submit and authorise: US-06.5.1's
  steps) and the prepaid Rhinoplasty gets `prepaid-settlement`: "Prepaid · $1,200.00 · the price", the recorded BTM
  `prepaid-settlement-btm` "for reference", the move from the AA Holding account `prepaid-settlement-transfer` (Dr
  Souter on Admin, "you" on web and mobile), `prepaid-settlement-nothing-automatic` "Nothing is invoiced or credited
  automatically." and `prepaid-settlement-actions` (Create additional invoice, Credit note). Before Authorise,
  on Review with the List SUBMITTED, `stage-longer-prepaid-procedure` lengthens it to 240 minutes; Authorise still
  bills nothing more. Before Authorise the office's Change price on the prepaid Procedure
  (`[data-shot=office-billing-setup-2] >> role=button[name="Change price"]`) shows the price read-only with
  `pricing-sheet-refusal`.
- **By hand.** The settlement block's Credit note (`[data-shot=prepaid-settlement] [data-shot=procedure-credit-note-button]`,
  web and mobile `anaesthetist-credit-note-button`) credits the whole prepayment invoice: the form shows
  `prepayment-credit` ("This credits the whole prepayment invoice. Create an additional invoice for anything still
  owed.") and no new-invoice cards. It waits in Review's Events tab like any credit (`tr[data-kind=credit]`); once
  approved and issued by `run-next-billing-run`, the block lists `prepaid-settlement-credit` and hides its Credit
  note. A fresh additional invoice (`[data-shot=prepaid-settlement] [data-shot=additional-invoice-button]`, reviewed
  as `tr[data-kind=additionalInvoice]`, then the run) shows as `prepaid-settlement-additional`.
- **Cancel.** Cancel booking on a prepaid Booking (all three apps) shows `cancel-prepayment` in the sheet, one notice
  per live prepayment invoice (`data-received=yes|no`): paid, "Prepayment received · $1,380.00 on AA-2026-0001.
  Cancelling refunds it in full to the payer from the AA Holding account and credits the invoice."; unpaid,
  "Prepayment invoice AA-2026-0002 is unpaid. Cancelling credits it in full, so the patient is not chased." The sheet's
  reason is `[role=dialog] textarea`, its primary `[role=dialog] >> role=button[name="Cancel booking"]`. After it the
  panel reads `prepayment-settled`: "Credited · CN-2026-0001" with a Refunded or Credited pill, and per refund
  `prepayment-settled-refund` (`data-refund-cause`) "Refunded to the payer from the AA Holding account · $1,380.00 on
  21 Jul" or "Late payment of $1,380.00 refunded on 21 Jul". The Billing monitor's `billing-prepay-holding` gains
  `holding-entry` rows `data-entry-kind=credited` and `refunded` (Credit note and Cause columns); Xero shows the
  refund on `/demo/xero/invoices/XRB0` (`xero-prepayment-refund`). Riley cancelled unpaid, then
  `prepayment-late-payment` on her Booking, adds the late payment's refund.
- **Contract change.** `prepayment-contract-changed` on Nair's Admin Booking credits and refunds as a cancellation:
  the panel's `prepayment-settled` reads "Credited · CN-2026-0001 · Contract changed off prepaid". Moving a sent
  Procedure off prepaid on the Contract rail (step 2, Standard, then `[data-contract-id=CT-NO-CONTRACT]`, as US-06.3.5's
  recheck recipe does before sending; US-06.3.7 does it after sending) shows the line `prepaid-contract-change` under the rail: "Prepayment invoice
  AA-2026-0002 was sent. Changing the Contract credits it (and refunds what was paid), then bills this procedure after
  it under the new Contract."
- **Moves change nothing.** The honour line `move-booking-honour` shows on every move of a sent prepaid Booking:
  32a's sheet on web and mobile (`data-audience=anaesthetist`), Admin Day's Move dialog (Nair's row in the Fri 24 PM
  drawer) and the List drawer's Reassign (`reassign-list-honour`) (`data-audience=office`: "The prepayment keeps its
  agreed amount. Whoever the office assigns claims it."). Riley approved, then moved with 32a's sheet on web (the
  first receiver), shows `prepayment-moved` on her Admin Booking: "Prepayment kept at the agreed amount · now with Dr
  <surname>", `prepayment-moved-invoice` "Invoice AA-2026-0002 unchanged", and the office's `patient-email-open`.
- **Rebook.** Cancel Nair on Admin, then `rebook-open`: the dialog `rebook-dialog`, the anaesthetist select
  `select[data-shot=rebook-anaesthetist]` (value `31902` for Dr Beaumont), her List cards
  `[data-shot=rebook-list][data-list-id="L-31902-2026-08-04-PM"]`, and `rebook-price` (`data-kind=prepaid`) "New
  prepayment at Dr Beaumont's own price: $1,350.00". `rebook-submit` creates the new Booking on that List and opens
  it (`/admin/day/2026-08-04/bookings/<new id>`): awaiting approval at $1,350.00, with `prepayment-history` "Earlier
  prepayment · Dr Souter · $1,200.00 · refunded" and "This prepayment · Dr Beaumont · $1,350.00".

### Support tickets (catch-up Phase 43b)

- **Five seeded tickets** (newest first in the panel's list `support-ticket-list`, rows `li[data-ticket-id]`):
  `TK0001` help line, P3, Closed, "Forgot my password" (Dr Melanie Souter, mobile); `TK0002` help line, P3, Responded,
  "Cannot sign in to the Admin app" (Kirsty W., Admin); `TK0003` help line, P4, Logged, "Wording on the Accounts page"
  (Dr Souter, web); `TK0004` product support, New feature, P4, Logged, "Export the Day view to a spreadsheet" (Kirsty
  W.); `TK0005` product support, Fix, P3, Responded, "Remittance advice shows the wrong week". Admin sees every request
  on the open tab; web and the phone show Dr Souter's own (`TK0001`, `TK0003`). A new ticket is `TK0006` in each fresh
  context (the PWA has its own store, so it is `TK0006` there too).
- **The line reads closed at the seed's 8:00am.** Both channels open 8:30am to 5:00pm, Monday to Friday, so after Reset
  `support-status` (`data-open=false`) reads "Closed, opens 8:30am" and the out-of-hours `support-cover-note` and the
  help line's "What is happening?" choice (`support-reason`) show. Move the clock "+1 hour" first to shoot "Open now"
  (`data-open=true`) with no cover note (see Gotchas).

## Overlays that need clicks

- **Help, the support panel (catch-up Phase 43b).** Click `[data-shot=nav-help]` on any app: the Admin side nav's foot
  button "Help", the web top nav's "Help" (before the persona), or the phone More tab's Help card (`more-help`), whose
  "Get help" text action carries the hook. Web and Admin open the shared SidePanel (`role=dialog`,
  `data-testid=support-side-panel`, title "Help", 600px wide); the phone opens a bottom sheet. Wait for
  `[data-shot=support-panel]` (its `data-tab` is `helpLine` or `productSupport`). Admin only: the tabs
  `[data-shot=support-tab-helpLine]` and `[data-shot=support-tab-productSupport]`; after the click wait for
  `[data-shot=support-panel][data-tab=productSupport]`. Raise a request by filling `[data-shot=support-subject]` (the
  hook is on the input itself) and clicking `[data-shot=support-send]`, then wait for
  `[data-shot=support-ticket-list] li[data-ticket-id=TK0006]`. See `recipes/US-15.0.8.json` and `US-15.0.9.json`.
- **Info tips (catch-up Phase 43a).** A small "About ..." button `[data-shot=info-tip-<topic>]` (the topic with dots as
  dashes, e.g. `info-tip-capture-price`, `info-tip-day-statuses`, `info-tip-review-contracts`) sits in a section's label
  row. On mobile a tap opens a bottom sheet whose content is `[data-shot=info-tip-<topic>-sheet]`; a tip inside another
  sheet (for example `info-tip-capture-rvg` in the RVG code picker) opens an inline note `[data-shot=info-tip-<topic>-note]`
  instead; on web and Admin it opens an anchored, fixed-positioned popover `[data-shot=info-tip-<topic>-popover]`
  (`role=dialog`). Click the button, wait for the `-sheet`, `-note` or `-popover` hook, then shoot. See
  `recipes/US-15.0.1.json`.
- **Load full-scale data's confirm (catch-up Phase 43).** The `load-full-scale` row asks for a second click: Run turns
  into "Confirm" (the button carries `data-shot=demo-action-confirm` while confirming), with the line "Replaces the
  current demo data. Reset returns to it." The `trigger` step clicks Confirm itself. Then wait for
  `[data-shot=scale-timings-toggle]` (add a `{ "wait": 3000 }` first: generation takes 2 to 3 seconds and a selector
  wait times out at 6 seconds).
- **Raw hospital row (catch-up Phase 43).** On Matching, the row panel's link `matching-raw-row` ("View raw row") opens
  a second right-docked panel `matching-raw-row-sheet` ("Raw hospital row", "Restricted. Viewing is recorded with your
  reason.") over the row panel. Its reason step `matching-raw-row-reason` offers three quick reasons as pressed buttons
  (`role=button[name="Find why this row did not match"]`, "Check what the hospital sent", "Hospital asked us to confirm
  a value") and the free text `matching-raw-row-reason-text`; the teal `matching-raw-row-view` ("View raw row") is
  disabled until a reason is given. Then `matching-raw-row-columns` shows the masked row (`tr[data-raw-column=<name>]`)
  under the notice `matching-raw-row-policy` ("Masking policy is for AA to agree. ..."). The footer then has one
  "Close"; the header also has a "Close" X, so scope it `[data-shot=matching-raw-row-sheet] >> role=button[name="Close"] >> nth=-1`.
  Opening it again asks for a reason again (each view is a fresh, audited request).
- **Additional invoice (catch-up Phase 38b).** Admin: `[data-shot=additional-invoice-button]` ("Create additional
  invoice") opens `[data-shot=additional-invoice-sheet]` (a dialog); web the same button, same words
  (dialog); mobile it is a bottom sheet, scope it `[data-aa-mobile-product] [data-shot=additional-invoice-sheet]`. Fill
  `input[data-shot=line-description]` and `input[data-shot=line-amount]` (quantity `line-quantity`), leave
  `event-same-as` ticked or clear it and pick a party in `event-party-picker`, then `additional-invoice-save`. Review: the
  Events tab link `[data-review-tab=events]`, a row `tr[data-event-id]`, then Approve `event-review-approve` in
  `event-review-sheet`. Invoicing happens only at the `run-next-billing-run` trigger.
- **Pre-op, post-op and billing events (catch-up Phase 39b).** Under each Procedure's `procedure-events` (shown on the
  anaesthetist's own Procedure, and always on Admin) the row `procedure-event-add` holds two buttons:
  `[data-shot=add-pre-post-op-event]` ("Add pre-op or post-op event") and `[data-shot=add-billing-event]` ("Add billing
  event"); use `>> nth=0`. Each opens a dialog on web and Admin, a bottom sheet on mobile (scope
  `[data-aa-mobile-product] [data-shot=...]`). `[data-shot=add-event-sheet]`: the Pre-op / Post-op segmented (buttons,
  `button:text-is("Pre-op")`; Post-op is the default), type rows `[data-shot=event-type-row][data-type=postOpWardReview|hduReview|painConsult|otherPostOp|accPreOpAssessment|otherPreOp]`,
  on the ACC type the presets `acc-preop-presets` (`[data-shot=acc-preop-preset][data-code=CS250]`) and
  `acc-codes-caption`; `event-date`, `event-start`; the "Record a time" / "Fixed fee" segmented; on a time the stepper
  `event-minutes` (default 30) with `event-pricing-caption`; on a fixed fee either the Contract's fee read-only
  `event-contract-fee` or a typed `input[data-shot=event-fee-amount]`; the invoice tick `[data-shot=event-invoice-tick] input`
  (its hint "Cleared: kept on the record, never invoiced."); the "same as" party (`event-same-as-row`, then
  `event-party-picker`), `event-routing-caption` and save `add-event-save` ("Add event").
  `[data-shot=add-billing-event-sheet]`: Charge / Credit segmented (before the invoice only; after it,
  `billing-credit-after-invoice`), `input[data-shot=billing-event-description]`, `input[data-shot=billing-event-amount]`,
  `event-date`, on a credit `billing-credit-caption` ("Reduces what is owed."), the same tick and party, save
  `add-billing-event-save`. Saved rows are `[data-shot=procedure-event-row][data-kind=preOp|postOp|billing]`, the
  recorded part `procedure-event-recorded` ("30 min", "Fixed fee", "Charge"); the anaesthetist sees no calculation on a
  timed event.
- **Credit sheets (catch-up Phase 39).** One form, `[data-shot=credit-form]`, in three wrappers. Admin `CreditSheet`: a
  right-docked side sheet `[data-shot=credit-sheet]` (`data-mode=credit|rebill|edit`), title in its header and Save
  (`credit-submit`, "Save for review") in its footer; opened by the invoice rail's `credit-note-button` (no new
  invoice yet; "Add an invoice" `credit-add-invoice`, then `credit-copy-lines`) or `credit-rebill-button` (one card
  `credit-replacement` already holding a copy of the original's lines), and by `procedure-credit-note-button` on the
  Admin Booking detail. Admin `SplitCombinedSheet`: the same side sheet in split mode, `[data-shot=split-combined-sheet]`,
  from `split-combined-rail-button` or the Procedure's `split-combined-button`; Left to allocate
  (`split-allocation`, `split-left-to-allocate`) sits in its footer beside Save ("Save 2 invoices for review",
  disabled until $0.00). Scope inner hooks by the sheet, e.g. `[data-shot=credit-sheet] [data-shot=credit-submit]`.
  The anaesthetist's `anaesthetist-credit-note-button` opens the same form in a web dialog (`[role=dialog]`) or a
  mobile bottom sheet (scope `[data-aa-mobile-product] [data-shot=credit-form]`). Who gets the credit: untick
  `[data-shot=credit-party] [data-shot=event-same-as-row]`, open `[data-shot=credit-party] [data-testid=party-picker-toggle]`
  and pick a `[data-shot=party-option]` (or "Another person", `split-another-person`); `credit-invoice-email` then
  shows. A submitted credit closes the sheet and scrolls the new `procedure-credit-event` into view. Review it as
  any event: Events tab row `tr:has([data-shot=review-credit-row])`, `event-review-approve`, then `run-next-billing-run`.
- **Drawers and dialogs after Phase U2.** The three Admin drawers (List, empty-session, Draft List) are `SidePanel`:
  `<aside role="dialog" aria-modal="true">` named by its h2 title, with a header "Close" X, and Escape closes it.
  Contract and Party panels are the same component at 600px. A sheet opened from a drawer is a second
  `[role=dialog]`, the drawer behind it is `inert`, and Escape closes only the top layer. Every web/Admin
  Dialog with a title has a "Close" button, and every Dialog and BottomSheet is named by its h2 title. On web the
  cancel button now comes first in a footer row and the primary last (phone: stacked); labels unchanged.
  Done steps (`move-booking-done`, `alert-office-done`, `move-done`, `office-status-done`) have `role="status"`.

- **Party and Contract panels** (Master data, catch-up Phase 18): a row click or its Edit opens a
  600px right-docked panel (`[data-shot=party-panel]`, `[data-shot=contract-detail]`), not a centred
  Dialog. "New contract" and "Add Party" open it empty; the Contract panel shows "Assigned on save"
  for the AA code and its refusals as `[data-shot=contract-detail] [role=alert]` (scroll it into view).
  Catch-up Phase 18a: its "Where it is offered" section holds `[data-shot=contract-specialties]` (chips
  and an "Add a specialty" select) and `[data-shot=contract-funding-tag]` (a select labelled "Funding
  tag"), then `[data-shot=contract-placement]`, the live "Offered under ..." line (scroll to it). A
  system Contract shows `[data-shot=contract-system-notice]`, both fields read-only, and no Disable.
- **Specialty and funding tag sheets** (Master data, catch-up Phase 18a): "Add specialty" or a row's
  "Rename <name>" opens `[data-shot=specialty-sheet]` (one Name field); "Add funding tag" or "Edit
  <code>" opens `[data-shot=funding-tag-sheet]` (Code, Funder select). Both are `[role=dialog]`.
- **Surgeon sheet, specialties** (catch-up Phase 18a): "Edit details" on a profile opens
  `[data-shot=surgeon-edit-sheet]` with `[data-shot=surgeon-specialties-field]` (chips named
  "Remove <specialty>", and a select labelled "Specialties", value an id such as `SPC-PLASTIC`).
  Removing every chip and saving shows "Choose at least one specialty." as the sheet's `role=alert`.
- **Surgeon sheet, practice and contacts** (catch-up Phase 17b): the same sheet holds Practice (optional,
  `[data-shot=surgeon-practice-field]`), HPI CPN (optional, `[data-shot=surgeon-hpi-field]`), the section
  `[data-shot=surgeon-personal-contact]` and the section `[data-shot=surgeon-office-contacts]` holding
  fieldsets `[data-office-contact=1]`, `2`, ...; the plus button is inside `[data-shot=office-contact-add]`
  ("Add office contact": click `[data-shot=office-contact-add] >> role=button`), and each set from the
  second has a minus `[data-shot=office-contact-remove]` named "Remove office contact N". There are no
  room or contact sheets any more.

- **Change status** (Admin Day, catch-up Phase 32b): open a session, `[data-shot="drawer-change-status"]`,
  pick `[data-shot="office-status-choices"] [data-status-choice="unavailable"]`; on a session holding a
  List, `role=button[name="Continue"]` opens "Where does this List go?" (`office-status-choice-office` or
  `office-status-choice-colleague` then a `[data-candidate]`), then the confirm step with
  `office-status-vacated` and `office-status-confirm-button`. An empty session saves at once
  (`office-status-save`).
- **Open out-of-hours session** (Admin Day, catch-up Phase 32c): the row control
  `[data-day-grid-row="<reg>"] [data-shot=out-of-hours-open]` is in the DOM, in the row's right gutter
  `.aa-row-gutter` (40px; the ruler and the Draft Lists band end with the same gutter), but transparent
  until the pointer is over that gutter (not while a drawer or sheet is open) or the control has keyboard
  focus; it is absent for a row that already
  has one and on a past day. It opens `[data-shot=out-of-hours-open-sheet]` (the session-times fields, Start
  and End, 18:00 and 21:00), then the session's drawer. On an empty evening session the drawer adds
  `[data-shot=drawer-session-draft-lists]` (Draft Lists for that day and session, `Assign here`) and
  `[data-shot=drawer-close-out-of-hours]` (Close out-of-hours session, disabled while it holds a List).
- **Alert the office** (catch-up Phase 32b; a bottom sheet on mobile, a dialog on web): on a Booking
  scroll to `[data-shot="alert-office-action"]`, click its button, fill
  `[data-shot="alert-office-sheet"] textarea`, then `[data-shot="alert-office-send"] button` and
  `role=button[name="Done"]`; on a web List the entry is `[data-shot="alert-office-list"]`; on a mobile
  List click `[data-shot="list-options"]` (the ⋯ in the nav bar), then `[data-shot="list-alert-office"]`.

- **Move to a colleague** (catch-up Phase 32a; one sheet: a bottom sheet on mobile, a dialog on web):
  on a Booking, `[data-shot="move-booking-action"] button` (scroll to it first), then the free list
  (`move-booking-receivers`); type into `[data-shot="move-booking-search"] input` to narrow every
  colleague; pick `[data-shot="move-booking-receiver"][data-anaesthetist-id="<registration>"]` (blocked
  rows are `move-booking-blocked`, not buttons); on the confirm step tick
  `[data-shot="move-booking-tell-office"] input`, then `[data-shot="move-booking-submit"] button`; the
  done state `move-booking-done` with "Back to your List".

**Anaesthetist app** (web and mobile: a sheet on mobile, a dialog on web)

- **Add booking:** `text="Add a booking" >> nth=0` on list detail. Since catch-up Phase 15b the sheet
  opens straight on the manual form, titled "Add a booking" (`role=heading[name="Add a booking"]`);
  there is no chooser. The manual form has "Look up", which is disabled without an NHI,
  "Save booking" and "Done". Photo capture is Future Work: only the `photo-capture-future` demo
  action opens it (see Demo actions by screen).
- **RVG code type-ahead** (catch-up Phase 19; replaces the grouped procedure picker): the
  `[data-shot=capture-procedure-code]` field inside the Billing card (no card of its own since the
  2026-11-12 owner review). On the web and Admin the code is typed straight in:
  `[data-shot=capture-procedure-code] input[role=combobox]` ("Type a code, e.g. H6a") drops down
  `[data-shot=rvg-type-ahead]`: every code under sticky anatomy headings (`[data-shot=rvg-section]`,
  `[data-shot=rvg-section-heading]`; rows `button[data-rvg-code=<code>]`); a chosen code shows in the field
  itself, `[data-shot=rvg-code-chosen]` (`button[aria-label$=". Change"]`, reopens the field), with a cross
  `[data-shot=rvg-code-clear]`. On the phone the same field sits in the Billing sheet (list in the flow). On a fixed or prepaid price it shows
  only after `[data-shot=rvg-code-add-reference]` "Add an RVG code for reference"; "Clear" `[data-shot=rvg-code-clear]` empties it). The sheet `[data-shot=rvg-type-ahead]` is
  `[role=dialog]` (mobile `[data-aa-mobile-product] [role=dialog]`), search placeholder "Search RVG code
  or description" (focused on open). Rows are `button[data-rvg-code=<code>]` with
  `[data-shot=rvg-base-units]` inside, grouped under the same sticky anatomy headings. Type "H1", "T2" (three rows) or
  "H4". A ranged row shows `[data-shot=rvg-range-units]` ("Guide 10 to 12 · starts at 10"), its
  stepper buttons "Fewer base units" and "More base units" (UI unification U4; were "One fewer base unit"
  and "One more base unit"); its value button "Base units 10. Type a value" (`button[aria-label^="Base units"]`) opens an input (`[data-shot=rvg-range-units] input`, Enter to
  save); outside the guide `[data-shot=rvg-outside-guide]` appears. The manual add form's chooser is
  `[data-shot=manual-rvg-code]` ("Choose an RVG code").
- **RVG group sheet** (Master data, catch-up Phase 19): "Add group" or a row's "Edit <code>
  <description>" opens `[data-shot=rvg-group-sheet]` (RVG code, Anatomy heading, Description, Base
  units, Modifier units, a range checkbox with Range from and Range to); Retire opens
  `[data-shot=rvg-group-retire]`.
- **Modifier picker** (catch-up Phase 19b): `[data-shot=capture-modifiers] [data-shot=modifier-add]`
  ("Add a modifier") opens `[data-shot=modifier-picker]` (a bottom sheet on mobile, a dialog on web
  and Admin; on mobile scope with `[data-aa-mobile-product] [role=dialog]`). Rows are buttons with
  `data-modifier-code` (for example `[data-modifier-code=AS3]`), under the printed blocks; applied
  rows read "Applied" and are `aria-disabled`. Clicking a row opens `[data-shot=modifier-explanation]`
  inline: a textarea with placeholder "A short reason, as an insurer would ask", for a modifier printed
  as other than a plain number `[data-shot=modifier-units]` ("Fewer units", "More units"), Cancel and
  `role=button[name="Claim"]` (disabled until there is text). On mobile Claim closes the sheet; on web
  it stays open with "AS3 claimed." (press Escape to close). The mobile sheet has no Escape: its handle
  is `role=button[name="Close sheet"]`.
- **Add AA modifier** (Master data, Modifiers, catch-up Phase 19b): `role=button[name="Add AA modifier"]`
  opens `[data-shot=add-aa-modifier]` (Code, Units, Modifying factor; "Add modifier").
- **Add an event:** `[data-shot=add-pre-post-op-event] >> nth=0` or `[data-shot=add-billing-event] >> nth=0` (catch-up
  Phase 39b; see Overlays). There is no Add billing line any more.
- **History, replaced text:** the History sheet lists "Procedure text replaced" with the old and new text
  and their sources (`role=button[name="History"]`).
- **Procedure description** (the manual form, catch-up Phase 20a): `[data-shot=procedure-description] input`
  replaces the old "Operation description" field; the office also sees "Told by" Phone or Email.
- **History:** `role=button[name="History"]` opens a dialog titled "Booking history". On mobile it is
  inside `[data-testid=mobile-booking-header-actions]`.
- **Cancel booking:** "Cancel booking", then fill `role=textbox[name="Reason"]`, then confirm.
- **Edit:** "Edit" in the Patient section (`[data-shot=booking-patient] >> role=button[name="Edit"]`; the patient sheet's address is NZ Post fields, `patient-postal-address`). The Procedure card has no Edit (catch-up Phase 20a). The Payer and Insurer or funder sections follow the Patient section (catch-up Phase 21).
- **Submit list:** "Mark list completed".
  - If blocked, the sheet "Bookings still to finish" opens.
  - If ready, a confirm sheet opens. Then "Submit to office" shows
    `[data-testid=list-submission-overlay]`, which auto-dismisses.
- **Complete booking:** "Finish now", then "Mark complete".
  - `[data-testid=completion-overlay]` appears for about 1s. Shoot it with `{ "wait": 350 }`.
  - Pressing "Mark complete" on an incomplete booking marks `[data-validation-focus=true]`.
- **Availability sheet** (catch-up Phase 29): on `/mobile/availability`, `[data-shot=availability-change]`
  opens the selected day's sheet; on `/mobile/availability/calendar`, a day `button[data-date=…]` opens
  it on the session panel ("Change", "Remove"; on a series instance "Change this one", "Delete this
  one", "Delete the series"), and `[data-shot=mobile-add-days-off]` opens it on the form (On holiday,
  both sessions, "1 week" ready). Status chips `[data-status-choice=<id>]`; Sessions and Repeat are
  `[role=group][aria-label="Sessions"|"Repeat"]`; the first date input is From (or Starts). After
  "Save", "Done" closes it.
- **Move a List** (catch-up Phase 32; the cover request is retired):
  - Web availability: `/web/availability?date=2026-07-27`, then `[data-shot="availability-move-mine-pm"]`.
  - Mobile availability: `button[data-date="2026-07-23"]`, then `[data-shot="availability-move-am"]`.
  - List detail: web `[data-shot="list-move"]`; mobile `[data-shot="list-options"]` (the ⋯ in the nav
    bar) first, then `[data-shot="list-move"]` in the List options sheet. Web dashboard: "Move a List".
  - Then `[data-shot="move-choice-office"]` or `[data-shot="move-choice-colleague"]` and a
    `[data-shot="move-colleague-<registration>"]`, then `button:has-text("Move List")`, then the done
    state `[data-shot="move-done"]` with "Done".
  - The unavailable prompt: open a session holding her List in the availability sheet (or web rail),
    `Change`, `[data-status-choice="unavailable"]`, Save: the move sheet opens in its unavailable mode
    (`move-unavailable-line`); after the move and Done, the form saves (`availability-result`).

**Admin**

- **Import hospital file** (Matching, catch-up Phase 33): `[data-shot=matching-import-open]` opens the dialog
  `[data-shot=matching-import]` (titled "Import hospital file", badged "Sample file", one radio card per sample); click `[data-sample-id=SAMPLE_STG]` (or
  another sample), then `[data-shot=matching-import-confirm]`. The dialog closes, `matching-import-result` reads
  "5 rows imported from St George's", and the batch's first row's panel opens by itself: wait for
  `[data-shot=matching-panel]`, then `{ "press": "Escape" }` before clicking a row, the filter or the header
  (the panel's scrim covers them). Decide a row with `[data-decision=<kind>]` then `[data-shot=matching-apply]`;
  wait for `[data-shot=matching-banner]`. Escape after a decision drops the dimmed row from Open. This is the
  product's own control, so recipes stage rows with it rather than the bar's `matching-receive-theatre-list`.
- **Contract and RVG code pickers from a row** (Matching): in the panel's `matching-stack`,
  `[data-shot=matching-choose-contract]` opens the shared step rail (`[data-shot=contract-picker]`, "Choose the
  Contract": answer `[data-rail-option=...]` tiles, pick a `[data-contract-id]` row, then
  `role=button[name="Use this Contract"]`); `[data-shot=matching-choose-rvg]` opens the RVG code sheet. Both
  are optional; the pick shows in the stack ("Contract to set: ..." on a matched row) and is applied with
  the decision.
- **Session drawer:** click a block on the day grid, for example `text="St George's" >> nth=0` or
  `button[data-slot-id="S-41267-2026-07-21-PM"]`. The drawer is `[data-testid=admin-list-drawer]`
  (with `data-slot-id`, and `data-list-id` when a List is in it). A List: "Edit list", "Reassign
  list", "History", "Open" (a booking) and "Move". An empty session (`[data-shot=admin-slot-drawer]`):
  "Assign List", "Book (phone advice)" (free sessions only), "Edit times", "History". After an assign,
  close it with `[data-testid=admin-list-drawer] >> role=button[name="Close"]` before clicking the grid.
- **Assign List** (`[data-shot=admin-assign-list]`): select `[data-shot=assign-hospital]` (value
  `H-STG`) and `select[data-shot=surgeon-picker]` (value `S-HALE`), then "Assign List" (or "Assign
  anyway" for a not-preferred surgeon).
- **Find available** (`[data-shot=admin-availability-finder-open]` in the Day header): the sheet
  `[data-shot=admin-availability-finder]`, session buttons "AM"/"PM", surgeon
  `[data-shot=finder-surgeon]`, then 17's candidates (`[data-shot=candidates-clear]`,
  `[data-shot=candidates-not-preferred]`, `[data-candidate=<id>]`). Picking opens Assign List.
- **Schedule settings:** `/admin/masters?view=scheduleSettings` (`[data-shot=admin-schedule-settings]`):
  "Edit horizon" (`[data-shot=admin-horizon-months]`, "Months ahead", preview
  `[data-shot=horizon-preview]`, shortening asks "Confirm and remove N days") and "Edit session times"
  (`[data-shot=admin-session-times-edit]`).
- **Availability statuses** (catch-up Phase 29): `/admin/masters?view=availability-statuses`. "Add
  status" or a row's `role=button[name="Edit <label>"]` opens `[data-shot=admin-availability-status-sheet]`
  (the first input is Label, then Long label and Description; swatches `[data-swatch=<token>]`; Fill is
  `[role=group][aria-label="Fill"]`; "Save changes" or "Add status", disabled while the draft has an
  issue, the issues listed inline). "Retire <label>" opens `[data-shot=admin-availability-status-retire]`
  ("Retire status", "Cancel"); a retired row offers "Restore <label>".
- **Master data, catch-up Phase 42:** every view's header is `MasterHeader` (an `h2` title, the subtitle, the teal
  "Add ..." button on the right; a seeded view's subtitle ends `[data-seeded-line]` "Loaded once at go-live from AA's
  controlled spreadsheet, then kept here by hand."). "Add public holiday" or a row's "Edit <name>" opens
  `public-holiday-add-sheet` / `public-holiday-edit-sheet` (Date, Name `placeholder="e.g. Labour Day"`, Kind, Region,
  the open hospitals `public-holiday-open-hospitals`); "Delete <name>" asks `public-holiday-delete-confirm`. On the
  hospital calendar a public-holiday block opens the Public holidays view (`hospital-calendar-public-link` is "Open
  Public holidays"). On RVG groups, `[data-shot=rvg-time-rule-edit]` opens `rvg-time-rule-sheet` ("Edit the RVG time
  rule": tiers `[data-rvg-tier=1..]`, "Add tier", `rvg-time-rule-part-interval`, `rvg-time-rule-preview` with
  `[data-rvg-example=<minutes>]`, "Save rule"). The edit sheets of hospitals (`edit-hospital-sheet`), surgeons,
  surgeon groups and AA's own modifiers end with `retire-section` (a reason textarea, "Retire <noun>"; refused with
  `retire-blockers`; a retired record shows "Reinstate <noun>").
- **Edit times** on an empty session: `[data-shot=admin-edit-session-times]`; times in either sheet
  sit in `[data-shot=session-times]` with "Use default".
- **Reassign:** "Reassign list", pick a target like "Sharma, Priya · Free AM", then (the vacated
  session `select[data-shot=reassign-vacated]` defaults to Free and lists the availability statuses in use) "Confirm reassignment".
  `[data-testid=list-reassignment-overlay]` appears.
- **Admin booking:** The Office billing setup card has only Price and Prepayment rows (catch-up Phase 25a removed "Edit billing setup", its
  "Contract and reference" sheet and the Procedure's billing reference; the Contract is chosen on the Billing card's step rail, the payer on the Paid by line),
  and "Change price" (`[data-shot=office-billing-setup-<n>] >> role=button[name="Change price"]`, hook `change-price`;
  catch-up Phase 24, was "Price override"). It opens `[data-shot=pricing-sheet]` ("Change price"): the row
  `pricing-sheet-computed` ("Computed from the Contract" and the figure), one input `pricing-sheet-price` (label "Price $",
  hint "No reason needed. The office sees every change in History."), the teal `pricing-sheet-save` ("Save price") and,
  once a price is typed, `pricing-sheet-clear` ("Use the computed price"). No reason field, no fixed, $ or % modes. A
  prepaid price whose prepayment invoice is raised shows the price read-only with the warning `pricing-sheet-refusal`.
  After saving, the setup's Price row `office-billing-price` reads "Typed $450.00" (or "From the Contract"), and the
  Booking total `[data-testid=booking-calculation]` shows "Price typed · computed $X". "Funder allocation" is gone (catch-up Phase 22):
  a fee is split with the Split button on the Procedure instead.
- **Admin Day's Move (one Booking to another List):** in the List drawer, the Booking row's "Move" (scope it
  to the row: `[data-testid=admin-list-drawer] >> text="<patient>" >> xpath=ancestor::div[.//button[normalize-space()='Move']][1] >> role=button[name="Move"]`)
  opens the dialog "Move booking to another list" (Target day input, defaulting to the List's date; one
  button per candidate List, "<surname> · <session> · <state>" over "<hospital> · <surgeon>", with an
  "Advisory: different surgeon" line; no hooks). Pick one with
  `[role=dialog]:has-text("Move booking to another list") >> button:has-text("Souter"):has-text("Okafor")`;
  the move is immediate and the dialog closes. The Booking keeps its Contract (catch-up Phase 21a).
- **The modifiers step's "None apply"** (catch-up Phase 21a, every app): on an RVG Contract with the step
  unanswered, `[data-shot=capture-modifiers-none]` (teal) sits beside `modifier-add` with the `capture-required`
  caption; once tapped, `capture-modifiers-none-done` reads "No modifiers claimed · Change". On mobile scope
  it `[data-testid=slide-booking] [data-shot=capture-modifiers-none]`. It does not cover `modifier-add`.
- **Approve on Review** (catch-up Phase 21a): on a `contractChanged` flag, `[data-shot=review-contract-approve]`
  ("Approve", aria "Approve this Contract change") stamps "Approved <time>" (`review-contract-approved`);
  `[data-shot=review-contract-correct]` opens the Admin Booking. The action bar's
  `[data-shot=review-contract-approve-all]` approves every pending change on the List. Only on a List not
  yet authorised.
- **The Paid by sheet and the insurer or funder (catch-up Phase 22a, every app):** the Booking-level Payer card,
  `booking-payer-row`, `payer-sheet` and the "Change the payer" button are GONE. Each Procedure's Paid by line
  (`procedure-split-row` on web and Admin; the phone's `[data-testid=slide-booking] [data-shot=procedure-split-button]`)
  has `paid-by-change` ("Change", beside the payer's name, where the Contract bills the payer) and
  `procedure-split-button` ("Split", on the right; none with no Contract), each opening the one `paid-by-sheet` (a Dialog
  on web and Admin, a bottom sheet on the phone): Change with who pays and the offer only (title "Who pays"), Split with
  the split alone (title "Split the fee"). Its Save is `paid-by-save` ("Save"; "Save payer" and "Save split" are gone).
  Its who pays part keeps the payer hooks: `payer-different-tick` (its `input` checkbox), `payer-patient-details`,
  `payer-child-hint`, `payer-other-fields` (Name, relationship chips, "Other relationship", Email,
  `payer-postal-address` with Address, "Unit, building or RD (optional)", "Suburb (optional)", "Town or
  city", Postcode, "Phone (optional)"), `payer-contact-ask`. When the payer changes to another person (fill "Name" with a different name) the offer
  `payer-offer` appears with rows `payer-offer-row` (`data-procedure-id`) (no pill since catch-up Phase 25a)
  then the split section `split-sheet` (see Split below). The Insurer or funder section
  `booking-funder-row` with "Add" (aria "Add insurer or funder") or "Change" (aria "Change the insurer or
  funder") opening `funder-sheet`: chips `funder-none` ("None"), one per insurer and
  funder by name (for example "nib"), "Approval number", "Save". Row hooks `funder-approval-number`,
  `funder-approval-missing`. On the Paid by line: `paid-by-payer`, `payer-contact-missing`, `payer-under-18` (each with
  `data-procedure-id`) and `payer-not-billed`.
- **The step rail (catch-up Phase 20), Admin and web:** inline on the Booking, the "Billing" card
  `[data-shot=capture-billing]` (one per Procedure; `>> nth=0` for the first), no click to open, no
  "Needs an invoice destination" bar (that shows on List rows and Admin Day's card only). Steps
  `[data-shot=contract-rail-step-1..3]` (click an answered one to change it; the later ones clear),
  tiles `[data-rail-option=patient|hospital|special|standard|prepaid|<tag id>|<holder Party id>]`, then
  the field `[data-shot=contract-combo]`, which drops down `[data-shot=contract-combo-list]` (its
  search input, rows `[data-contract-id=<id>]`, the first two always the "No contract" heading's
  (`[data-shot=no-contract-group]`) No contract · RVG and No contract · Fixed price backstops
  (`[role=option] >> nth=0|1`); choosing one sets it at once). Since UI unification U4 the steps, tiles,
  "Suggested" pill, "Only option" line and amount input render from one set of parts (same hooks); the
  tiles are a radio group (one Tab stop, arrows move focus, a click or Space picks). The combo shows on every path but Patient › Standard with No contract · RVG alone,
  which offers "Use it" (`contract-rail-only-contract`) on a Booking loaded with no Contract and then
  "RVG code | Fixed price" (`[data-shot=contract-rail-other-price] [data-sliding-segmented-control]`);
  there is no "Other price" switch. The price block under the Contract `[data-shot=contract-rail-outcome]`
  (the RVG code field, or the "Fixed price" amount `[data-shot=contract-rail-amount]`; no line repeating
  the price); a lone Contract is picked on the answer and named
  in `[data-shot=contract-rail-lone]`; with no Contract yet the RVG code block is
  `[data-shot=billing-rvg-code]`; the rail's third step is "Price", its answer the price ("RVG H6a",
  "Agreed fee $357.39"); "Start again" `contract-rail-start-again`. The office setup,
  "Contract and payer" and "Edit operation" show the Contract read-only.
- **The step rail on mobile:** the Billing card is a summary, one button `[data-shot=capture-billing]`
  (rows `billing-row-invoice-to`, `billing-row-contract`, `billing-row-price`; "Edit"); a tap opens the
  Billing sheet `[data-shot=billing-sheet]` holding the same flow as the web card (`[data-shot=contract-picker]`,
  the rail across the top, "Price by", the RVG code field), saved as each answer is given, closed with "Done". "Add another procedure" adds the
  Procedure at once; its own Billing card picks its Contract.
- **Creation forms:** the manual and phone-advice forms have a Contract row
  `[data-shot=manual-contract]` ("Choose"); saving without one is allowed. "Choose" opens the step
  rail sheet `[data-shot=contract-picker]` ("Choose the Contract"): steps `contract-rail-step-1..3`
  (the Billing card's markers), answers `[data-rail-option=<value>]` (a radio group), the search
  `[data-shot=contract-rail-search] input`, then the Contract list (rows `[data-contract-id=<id>]`,
  radios with one Tab stop) that starts with the "No contract" heading `[data-shot=no-contract-group]`
  holding No contract · RVG and No contract · Fixed price. There is no "Other price" switch and no
  "Always first" pill (`contract-rail-pinned` is retired); choosing No contract · Fixed price shows
  "Amount, ex GST" (`[data-shot=contract-rail-amount]`, the input) under the list where the amount
  may be typed there. Then `contract-rail-outcome` and, for the office on an RVG Contract,
  `contract-rail-enter-rvg`.
- **Review:**
  - "Log phone note" opens a textarea, then "Log note".
  - `role=button[name="Authorise for billing"] >> nth=0` opens the confirm.
  - `>> nth=-1` confirms. The banner then reads "List authorised · locked for billing".
- **Day notes:** "+ Add note", placeholder "Add an internal note for this day", then "Save note".
- **Date navigation:**
  - Admin Day's toolbar is `[data-testid=admin-day-nav]`. Its buttons are "Previous day", "Next day", Today, -4w, -1w,
    +1w, +4w (since UI unification U5 the day steps are named; they were the glyphs ‹ and ›). Scope them by the toolbar,
    `[data-testid=admin-day-nav] >> role=button[name="Next day"]`, because the harness clock menu and `/demo/control`
    also have a "Next day" (the clock one rolls the demo date). "Find available" is `[data-shot=admin-availability-finder-open]`.
  - `input[type=date]` accepts a fill; since UI unification U4 it is named "Go to date"
    (`[aria-label="Go to date"]`), and only a full date moves the day.
  - Mini calendar days are named like "Wednesday 22 July 2026".
- **Invoice** (catch-up Phase 22): there is no "Email invoice" button; the billing run sends. The rail's Delivery card
  (`invoice-delivery`) holds, when emailed, "Emailed to <address> at <time>", the "Simulated send" badge, "Resend"
  (`[data-shot=invoice-delivery] >> role=button[name="Resend"]`, which adds the send history
  `[data-testid=invoice-send-history]`) and "Print"; when To post, the address, "Simulated posting", "Provisional (OQ-122)",
  an "Or email it to" field (`[data-testid=invoice-send-email]`) with "Send" and "Print"; with no invoice address, the
  warning "No invoice address", an "Email address" field and "Send".
- **Split section of the Paid by sheet** (catch-up Phase 22, moved into the Paid by sheet by 22a: there is no separate
  split sheet, so use `paid-by-sheet` as the overlay root and `split-sheet` for the section; the "Split the fee" dialog and
  "Save split" are gone, `paid-by-save` saves; `split-start`, "Split" or "Keep split", shows the section when no split is
  showing; the party picker's open list ends with `split-another-person` ("Another person"), which turns that row into
  `split-person` fields; the former `split-save` is gone): on a
  Booking, scroll to `[data-shot=procedure-split-row]` (the Paid by line at the foot of the Billing card on web and Admin)
  and click `[data-shot=procedure-split-button]` ("Split"; the sheet then holds the split alone). On mobile Paid by is the Billing
  summary's last row, `[data-testid=slide-booking] [data-shot=procedure-split-row]`, with the same Change and Split
  actions (no longer one tap target; the rest of the summary is `capture-billing`).
  Paid by reads the payer or the party the Contract bills (both surfaces) or the split's parties and amounts; on the
  phone with the relationship or "Split 2 ways" under it. Inside `[data-shot=split-sheet]`: the fee `split-fee`, one `[data-shot=split-row][data-row=<n>]` per party
  (party picker `[data-testid=party-picker-toggle]`, options `[data-shot=party-option]`, search `party-picker-search`),
  `[data-shot=split-share-input] >> input` ($ or %, a TextField; for example `>> nth=0 >> input` filled "62.5%"), the switch
  `[data-shot=split-rest-toggle]` ("Takes the rest"), the amount `split-amount`, "Add a party" (`split-add-party`), the
  total `split-total` ("$212.00 of $212.00"), then, on a split Procedure, "Remove split" (`split-remove`). On BK0025 row 0 is nib ($132.50) and row 1 Alan Prentice (the rest). A share that no longer fits
  raises the `splitDoesNotFit` warning. The office and the anaesthetist on her own Booking can split until the List is
  AUTHORISED; Dr Souter's ACTIVE `/mobile/lists/L-34821-2026-07-21-AM/bookings/BK0002` (and the web route) shows it.
- **GST number** (Master data, Anaesthetists, catch-up Phase 22): a row's Edit
  (`[data-shot=masters-anaesthetists] tr[data-anaesthetist="34821"] >> button:text-is("Edit")`) opens the Edit sheet with
  `[data-shot=anaesthetist-gst-number-field]` ("GST number (optional)", blank prints "GST number not held"); save with
  `[role=dialog] >> role=button[name="Save changes"]`. The Add sheet has the same field.
- **Master data:** "Edit", "Save changes", and "Add hospital" (field "Hospital name", then the
  optional "Contact email"). Catch-up Phase 17 sheets: "Add surgeon" / a surgeon row's "Edit" /
  profile "Edit details" (`surgeon-edit-sheet`), "Add group" / "Edit <group name>" (`surgeon-group-sheet`), a hospital's
  "Edit <hospital name>" (`edit-hospital-sheet`), "Add pairing" (`pairing-add-sheet`), a pairing
  row's "End" (`pairing-end-sheet`, confirm "End pairing"). The anaesthetist Edit sheet has an
  "Open record" link. A table row (anaesthetist or surgeon) opens its page; the "Edit" link in it
  does not.

- **Leave without saving** (Admin Booking detail, catch-up Phase 35): with unsaved changes, any in-app
  navigation that changes the path (the side nav `nav[aria-label="Admin"] >> text="Day view"`, the back link, the
  Demo actions menu, Control Panel links) opens the dialog `[data-shot=leave-without-saving]` ("Leave without
  saving?", "You have 3 unsaved changes to this Booking.") with "Keep editing" (stays) and "Discard and leave". A
  `goto` or reload gets the browser's own prompt instead, so save or discard before a `goto`.
- **Update email composer** (catch-up Phase 35): opened by `booking-update-email` on the Admin Booking detail,
  `drawer-update-email` in the List and Draft List drawers (only after an emailable change of anaesthetist), and
  `pool-cover-email` or `pool-booking-email` on `/admin/notifications`. A wide dialog,
  `[data-shot=update-email-composer]`, titled "Draft update email" (a Booking) or "Draft cover-change email" (a List).
  Left: "Pick changes", `update-email-picker`, one `li[data-pick-row=<key>]` per saved change, newest first, its
  tick `input[data-pick-key=<key>]` (keys `cs:CS0001` or `a:<auditId>`; tick by position,
  `[data-shot=update-email-picker] li >> nth=1 >> input[type=checkbox]`); the newest emailable change is ticked
  on open; a change with nothing emailable is disabled with its reason; `update-email-earlier-draft` marks one
  already drafted, `update-email-cancelled-out` a change that nets out. A typed colleague message shows as
  `update-email-context-message`. Right: Template `update-email-template` (`[data-shot=update-email-template]
  select`), "Send to" (Surgeon's office, Hospital, Both), `update-email-to` (To, other office contacts with "Use
  this instead", or the line "... To will be left empty."), then the preview `update-email-preview` (badged Demo
  preview: To, Subject, body `update-email-body`, length `update-email-length`, `update-email-shortened`, and
  "Opens in your mail client. The system does not send it."). Footer "Open in mail client" `update-email-open`
  (a `mailto:` link: never click it in a recipe) and Close. To stage two saved changes on BK0009: "5 minutes
  later" then Save changes, then Edit patient, change the name, Apply, Save changes.
- **Email template editor** (Master data, Email templates, catch-up Phase 35): a row's "Edit <name>"
  (`tr[data-email-template=ET004] >> role=button[name=/^Edit /]`) or "Add template" opens a wide dialog
  `[data-shot=email-template-editor]`: Name, Kind of change (Add only), Sends to, Subject, Body, the placeholder
  buttons `email-template-placeholders` (named "Insert {patient}: ..."), and the live preview
  `email-template-preview` (badged Sample). Primary "Save changes" or "Add template", disabled while a rule fails.
- **Booking as at** (Admin Booking History, catch-up Phase 35): each History row has "View as at"
  `[data-shot=history-view-as-at]` (Admin only); it opens the panel `[data-shot=booking-as-at]` above the timeline,
  inside the History dialog ("As at ..., after Kirsty W.'s save", the Booking's fields then, no prices),
  with its own "Close". `[data-shot=booking-history] [data-shot=history-view-as-at] >> nth=1` picks the row before
  the newest.
- **Approve and send's letter dialog** (catch-up Phase 41): the strip's `approve-and-send` no longer sends. It opens
  `[data-shot=prepayment-letter-picker]` ("Approve and send", `data-booking-id`, `data-payer-key`): the Letter row
  `prepayment-letter-template` (the default named, a select when several are active), the To row
  `prepayment-letter-recipient` (the payer and its email or postal line), the text action
  `prepayment-letter-preview-toggle` ("Preview letter" / "Hide letter") showing `prepayment-letter-preview`, the
  refusal `prepayment-letter-refusal`, and the teal `prepayment-letter-send` ("Approve and send"). **Every recipe that
  clicks `approve-and-send` then waits for the picker and clicks `prepayment-letter-send`**; only then does
  `approve-and-send-result` appear.
- **Send prepayment reminder** (Admin Booking, catch-up Phase 41): `prepayment-reminder` opens
  `[data-shot=prepayment-reminder-dialog]` (`data-invoice-id`; "Invoice AA-2026-0002 · $1,380.00 still to pay"):
  `prepayment-reminder-template`, `prepayment-reminder-recipient` (or `prepayment-reminder-no-address`),
  `prepayment-reminder-preview-toggle` / `prepayment-reminder-preview`, `prepayment-reminder-refusal` and the teal
  `prepayment-reminder-send` ("Send reminder"). It acts on the saved Booking at once.
- **Letter template editor** (Master data, Prepayment letters, catch-up Phase 41): a row's Edit
  (`tr[data-letter-template=LT001] >> text="Edit"`, named "Edit Standard prepayment letter") or "New template"
  (`letter-template-new`) opens a wide dialog `[data-shot=letter-template-editor]`: Name, Kind (new only), the Letter
  body, the merge-field buttons `letter-merge-chips` (named "Insert <field>") and the live preview
  `letter-template-preview` ("Preview with a sample booking").
- **Credit sheet on a prepaid Procedure** (catch-up Phase 41): the same `credit-sheet` / `credit-form`, with the
  notice `prepayment-credit` in place of the new-invoice step (no amount, no new invoice cards). Open it from the
  settlement block once the List is authorised (see the Phase 41 seed notes).
- **Cancel sheet on a prepaid Booking** (catch-up Phase 41): `role=button[name="Cancel booking"] >> nth=0` opens the
  confirm sheet (`[role=dialog]`; on the phone a bottom sheet, scope `[data-aa-mobile-product]`); above the Reason
  box sits `cancel-prepayment`. Fill `[role=dialog] textarea` and press `[role=dialog] >> role=button[name="Cancel booking"]`.
  A Booking with no live prepayment invoice shows no note.
- **Email patient: anaesthetist changed** (catch-up Phase 41, office only): on a moved prepaid Booking's card,
  `patient-email-open` opens `[data-shot=patient-email]`: `patient-email-template`, `patient-email-recipient` (or
  `patient-email-no-address`), the always-open preview `patient-email-preview`, the caption `patient-email-provisional`
  "Provisional (OQ-120)", `patient-email-refusal`, and the teal `patient-email-send` ("Send email"), which closes it;
  the card then shows `patient-emailed`.
- **Rebook with another anaesthetist** (catch-up Phase 41, office only): `rebook-open` on a cancelled prepaid Booking
  opens `[data-shot=rebook-dialog]`: `select[data-shot=rebook-anaesthetist]` (every active colleague but the original,
  roster order), the List cards `[data-shot=rebook-list][data-list-id=<id>]` (or `rebook-no-lists`), the inline
  `rebook-not-preferred`, the price line `rebook-price` (`data-kind=prepaid|notPrepaid|noPrice`), `rebook-refusal` and
  the teal `rebook-submit` ("Rebook"), which opens the new Booking.

**Shell** (these controls sit in the harness bar, which is hidden in shots, so they can't be
clicked; use the matching `/demo/control` buttons in `setup` instead. The "Demo actions" menu is
the exception: use the `trigger` step)

- **Demo clock:** `role=button[name=/Demo clock/]`. It offers "+15 min", "+1 hour", "Next day",
  "Next morning", "+7 days" and "Procedure day · 28 Jul".

## Existing hooks

**Support, the help line and product support (catch-up Phase 43b).** Entry `nav-help` on all three apps (Admin side nav
foot, web top nav, phone More card `more-help`). The panel body `support-panel` (`data-tab=helpLine|productSupport`),
in it `support-status` (`data-open=true|false`; "Closed, opens 8:30am" or "Open now"), `support-phone` (0800 787 286,
fictional), `support-hours`, `support-response-table` (rows `[data-priority=P1..P4]`), `support-cover-note` (a warning
Notice shown only out of hours, `data-cover=afterHours|publicHoliday|christmas`), the form `support-request-form`
holding `support-subject` (on the input), the Priority segmented control (P1 to P4), `support-description` (on the
textarea), out of hours on the help line the radiogroup `support-reason` (chips `[data-reason=other|securityBreach|
platformOffline]`), on product support the Kind segmented control (Incident, Fix, Change, New feature) and
`support-new-feature-line`, and the teal `support-send` ("Send request", or "Send ticket" on product support); the list
`support-ticket-list` (rows `li[data-ticket-id]`, the status pill `[data-ticket-status=logged|responded|closed]`, pills
`[data-ticket-overdue]` and `[data-ticket-cover]`, the latter "Awaiting AA's approval" on a public-holiday call-out) and
the readings caption `support-readings`. Admin only: `support-tab-helpLine`, `support-tab-productSupport`. The web and
Admin panel is `[data-testid=support-side-panel]`. Demo rows `demo-action-support-advance-ticket`,
`demo-action-support-raise-out-of-hours`, `demo-action-support-raise-public-holiday`,
`demo-action-support-approve-call-out`; PWA `pwa-demo-action-support-help-line-responds`.

**Sign-in and info tips (catch-up Phase 43a).** PWA sign-in (mobile, :5174): the screen
`sign-in-screen` (the logo, then a card holding `sign-in-email` (pre-filled with the demo account), `sign-in-password`
and the teal `sign-in-submit` "Sign in", then the `sign-in-provisional` pill with its caption and the demo badges);
More tab: the account card `more-account` ("Signed in as ...") with its Sign out text action `more-sign-out`; PWA Demo
sheet row `pwa-demo-action-pwa-sign-out`. Info tips: the button `info-tip-<topic>` (dots as dashes: `capture-stack`,
`capture-rvg`, `capture-contract`, `capture-price`, `capture-modifiers`, `capture-payer`, `capture-times`,
`capture-warnings`, `day-statuses` (beside the Admin Day legend), `day-draft-lists`, `day-needs-destination`,
`day-todo`, `review-flags`, `review-contracts` (Review table's Procedures heading), `review-price` (Fee heading),
`review-authorise`) and what it opens: `info-tip-<topic>-sheet` (mobile bottom sheet), `info-tip-<topic>-note` (inline,
inside another sheet) or `info-tip-<topic>-popover` (web and Admin). Their accessible names are "About <title>"
(aria-labels, not text).

**Patients, the NHI and the balance warning (catch-up Phase 40).** Admin: `admin-patients`, `admin-waiting-nhi`,
`admin-patient-follow-up`, `admin-patient-record` and the record's cards (listed under Routes, `/admin/patients/:nhi`);
`waiting-nhi-row` / `waiting-nhi-add` / `waiting-nhi-email` / `waiting-nhi-urgent`; the Add NHI sheet
`add-nhi-sheet` (the field `add-nhi-field`, the preview `add-nhi-preview` "Matches Losa Tuilagi, born ... The row uses
this record; no second one is made.", `add-nhi-differences`, the teal `add-nhi-save`, then `add-nhi-done` "Added. The
Booking is on ..."); `master-patient-balance-threshold`. Add a booking form (every app): `manual-nhi` (required, with
the live check), `manual-save` (disabled with the NHI reason while blank), `manual-matched-record`,
`manual-details-differ` and, Admin only, `manual-balance-preview`. Matching: `matching-nhi`,
`matching-balance-preview` (before Create Booking), `matching-balance-result` (after, `data-strength`),
`matching-patient-record-link`, `matching-waiting-link`. Booking detail: `booking-patient-ethnicity`,
`booking-patient-record-link` (Admin). The anaesthetist's chip `balance-alert-chip` (`data-strength`, no amount) on a
List row and a Booking, in Web and Mobile; the shared note box `shared-notes` (`shared-note-input`,
`shared-note-add`, notes `li[data-note-id]`) on a List in Mobile, Web and the Admin drawer, and on a Booking. Billing
monitor: `billing-patient-balance`. `billing-prior-balance` is gone.

**NHI lookup through the Digital Services Hub (catch-up Phase 40a).** Add a booking form (web dialog, phone sheet,
Admin): the block `nhi-lookup` holds the NHI input `manual-nhi` (label "NHI", placeholder `ABC1234`; its hint shows the
validator's reason as typed, such as "The check digit does not match.", or "Valid NHI"), the button
`nhi-lookup-button` ("Look up", disabled until the NHI validates; "Checking" while the Hub answers), the amber badge
`nhi-hub-mode-badge` ("Hub simulated as Unavailable" or "Slow", only while the Hub is not Available), the status line
`nhi-lookup-status` (`role=status`, `data-status=checking|slow|found|notFound|unavailable|invalid|cancelled`; found
"Found Mereana Tipene on the NHI register. Details pre-filled, still editable."; not found "No one with NHI ZBW6638 is
on the NHI register. Check the number, or enter the details by hand."; slow "The Hub is slow to answer ..." with
`nhi-lookup-stop` "Stop waiting"; unavailable, a warning notice "The Digital Services Hub is not answering. Enter the
details by hand, or try again." with `nhi-lookup-retry` "Retry") and the purpose note `nhi-purpose` ("Looked up on
behalf of Dr Melanie Souter (HPI CPN 10SOUM), only to identify this patient. Health Information Privacy Code 2020.").
The old "Not found in this demo's records" line is gone. The payer block `add-booking-payer` reads the found
patient's name while the payer is the patient. The same `nhi-lookup-status` and `nhi-purpose` ("the AA office") sit
in the Admin patient record's refresh panel (`patient-register-*`, see Routes, `/admin/patients/:nhi`) and in the
Waiting for NHI Add NHI sheet, which looks up a valid NHI typed in `add-nhi-field` on its own, with no button ("On the
NHI register: Noah Prescott, ..."). Demo action rows `demo-action-nhi-hub-mode` and `pwa-demo-action-nhi-hub-mode`.
"HPI CPN" is the one label for the practitioner number in every app.

- Events and the additional invoice (catch-up Phase 38b). `procedure-events` (the section under each Procedure, all
  three apps; Admin always, the anaesthetist on their own Procedure since catch-up Phase 39b, otherwise only when it has events), rows `procedure-event-row`
  (`data-event-id`, `data-status`) with `procedure-event-status`, `procedure-event-review`, `procedure-event-edit`,
  `procedure-event-remove` and `procedure-event-invoice`. `additional-invoice-button` (on the Procedure's Paid by row
  beside Split: "Create additional invoice" in all three apps).
  `additional-invoice-sheet` (the form: a dialog on web and Admin, a bottom sheet on mobile) with inputs
  `input[data-shot=line-description]`, `input[data-shot=line-amount]`, `input[data-shot=line-quantity]`, the tick
  `event-same-as`, the picker `event-party-picker`, `additional-invoice-totals` and `additional-invoice-save`. Review:
  `admin-events-queue`, `event-review-sheet`, `event-review-approve`, `event-review-decline`; tab links
  `[data-review-tab=lists|events]`. Billing monitor: `events-awaiting-run` (only while an approved event waits).
  Invoices: `invoice-list-kind`, `invoice-list-additional-to`, `invoice-additional-of` (the line under the number on an
  additional invoice), `invoice-additional-links` (rail card on the original and the additional invoice),
  `invoice-create-additional`. Admin Booking detail: `booking-total`, `booking-total-gst`. The addendum hooks and the
  "Add post-op event" block and banner are gone.
- Pre-op, post-op and billing events (catch-up Phase 39b). Under `procedure-events`: `procedure-event-add` holding
  `add-pre-post-op-event` and `add-billing-event`; rows `procedure-event-row` gain `data-kind` (`preOp`, `postOp`,
  `billing`, beside 38b's kinds) and `procedure-event-recorded`. Sheets: `add-event-sheet` (`event-types`,
  `event-type-row` with `data-type`, `acc-preop-presets`, `acc-preop-preset` with `data-code`, `acc-codes-caption`,
  `event-date`, `event-start`, `event-minutes`, `event-pricing-caption`, `event-contract-fee`, `event-fee-amount`,
  `event-invoice-tick`, `event-same-as-row`, `event-party-picker`, `event-routing-caption`, `add-event-save`) and
  `add-billing-event-sheet` (`billing-event-description`, `billing-event-amount`, `billing-credit-caption`,
  `billing-credit-after-invoice`, the same date, tick, party and routing hooks, `add-billing-event-save`). Review:
  `admin-events-queue` rows `tr[data-kind]`, `review-needs-price`; `event-review-sheet` adds `event-review-kind`,
  `event-review-price`, `event-review-set-price`, `event-review-office-price`, `event-review-needs-price`. Invoices:
  `tr[data-shot=invoice-event-lines]` (an event's line on an invoice, with `data-event-id`), `invoice-list-event-lines`
  ("+2 event lines" on the Invoices list). Billing monitor: `monitor-event-invoices`. Contract editor:
  `contract-event-fees` (inside `contract-detail`). The billing-lines card, `capture-billing-lines` and the Add billing
  line sheet are gone.
- Credit notes, credit and rebill, and the combined split (catch-up Phase 39). Admin invoice rail: the card
  `invoice-correct` ("Correct this invoice", caption or refusal `invoice-correct-refusal`) holds `credit-note-button`
  ("Credit note"), `credit-rebill-button` ("Credit in full and rebill") and `split-combined-rail-button` ("Split into
  additional invoices"; refusal `split-combined-refusal`); all three disabled while a credit waits or once credited.
  Procedure button row (beside Create additional invoice and 22's Split): Admin `procedure-credit-note-button` and
  `split-combined-button`, web and mobile `anaesthetist-credit-note-button` (both "Credit note", `data-invoice-id`;
  hidden on a colleague's Procedure and before the invoice; on a prepaid Procedure it credits the whole prepayment
  invoice, from the `prepaid-settlement` block once the List is authorised: catch-up Phase 41 removed
  `credit-note-unavailable`). Sheets: Admin `credit-sheet` (`data-mode=credit|rebill|edit`) and `split-combined-sheet`, both wrapping
  the form `credit-form` (`data-variant=office|anaesthetist`, `data-mode`), which every wrapper (web dialog, mobile
  bottom sheet) carries. Inside the form: `credit-original` (`credit-original-total`), `credit-party` (38b's
  `event-same-as-row` tick and `event-party-picker`, then `credit-invoice-email`), `credit-reason` with chips
  `credit-reason-chip` and `credit-reason-text`, office only `credit-money-state` and `credit-trail` (rows
  `li[data-trail-kind]`: Debit, Credit, Contra), anaesthetist only `credit-payment-reversed`, always `credit-not-refund`;
  new invoice cards `credit-replacement` (`credit-replacement-party`, `credit-copy-lines` "Start from a copy of the
  original's lines", `credit-replacement-totals`, `credit-replacement-remove`), `credit-add-invoice`, `credit-error`,
  `credit-submit`. Split only: cards `split-component` (`data-index`, each with `split-put-rest` "Put the rest on this
  invoice"), `split-must-add-up`, and in the sheet footer `split-allocation` with `split-left-to-allocate`
  (`data-done=true|false`). Documents: the original's standing pill `invoice-standing` (`data-standing=creditPending|credited`,
  "Credit waiting for review" or "Credited"), `invoice-credited-banner` (links `CN-2026-...` and `AA-2026-...`),
  `invoice-rebill-of` ("Rebills AA-..."), `invoice-split-part` ("Additional invoice · part 1 of 2 · replaces ...");
  the credit note page `credit-note-document` with `negative-invoice-card` (`data-status`), `credit-note-credits`,
  `credit-note-addressee`, `credit-note-reason`, `credit-note-new-invoices`, `credit-note-xero`,
  `credit-note-open-billing-monitor`. Invoices table: credit note rows `tr[data-credit-note-id]` with
  `invoice-list-kind[data-kind=creditNote]` and `invoice-list-credits`; `invoice-list-standing` (`data-standing`) and
  `invoice-list-rebills` on invoice rows. Events: `procedure-credit-event` (`data-event-id`; with
  `procedure-event-status`, `procedure-event-edit`, `procedure-event-remove`, `procedure-event-credit-note`,
  `procedure-event-rebill-of`). Review: `review-credit-row`, `review-credit-replacement` in `admin-events-queue`;
  `event-review-credit` and `event-review-replacement` in `event-review-sheet`. Ledger: `ledger-credit-tiles`
  ("Credits held for payers", "Negative invoices to net"), `ledger-credit-trail`, `ledger-pair-credited`. Billing monitor:
  `monitor-correction-failed`. Xero sim pair: `xero-credit-note` (`data-credit-note`), records
  `xero-credit-note-record` (`data-type` ACCRECCREDIT or ACCPAYCREDIT), `xero-credit-accpay-voided`,
  `xero-credit-new-pairs`.
- Explicit save and the update email (catch-up Phase 35). Admin Booking detail: `booking-save-bar` (the sticky
  unsaved bar; the count `[data-testid=unsaved-count]`), `booking-discard`, `booking-save` ("Save changes"),
  `booking-save-refused` (a refused save's reason, in the bar), `booking-saved-strip`, `booking-draft-reset` (a demo
  Reset discarded a dirty draft), `booking-time-input` (draft only), `leave-without-saving` (the dialog),
  `booking-update-email` ("Draft update email") and `booking-update-email-reason`, `booking-history-button` (the
  History button), `booking-history` (the Booking's History sheet body), `history-change-set` (a grouped row,
  `data-change-set-id`), `history-view-as-at`, `booking-as-at` (the as-at panel), `booking-office-saved` (another
  office user's save landed while the page was open; on web and mobile too), `patient-nhi-field` (Edit patient's NHI,
  office draft only). Section hooks are `booking-<label>` from the section title, for example `booking-patient` and
  `booking-notes-for-the-office` (its `textarea`). Composer: `update-email-composer`, `update-email-picker` (rows
  `li[data-pick-row]`, ticks `input[data-pick-key]`), `update-email-template`, `update-email-to`,
  `update-email-preview`, `update-email-body`, `update-email-length`, `update-email-shortened`,
  `update-email-earlier-draft`, `update-email-cancelled-out`, `update-email-context-message`,
  `update-email-nothing-picked`, `update-email-open`. List drawers: `drawer-update-email`, `list-add-booking` (Add
  Booking on any List not AUTHORISED, booked or not; it opens the shared add form, whose `procedure-description`
  (20a's field) holds the description as told, with the "Told by" Phone or Email choice, office only; the Draft List
  drawer's twin is `draft-list-add-booking`). Notifications: `pool-cover-email`, `pool-booking-email`,
  `pool-returned-hint`. Audit viewer: `audit-change-set` (the column's link), `audit-change-set-filter`. Master data:
  `email-templates` (rows `tr[data-email-template]`), `email-template-editor`, `email-template-placeholders`,
  `email-template-preview`.
- Intake (catch-up Phase 34): `admin-intake` (the Intake page), `intake-tabs` (its link strip); side nav
  `nav-badge-intake` (replaces `nav-badge-matching`). Matching: `row-new` (the first "New" chip in the table). PDF lists
  (`/admin/intake/pdfs`): `pdf-upload-open`, `pdf-inbox` (rows `data-pdf-list-id`, `data-status`), `pdf-upload` (the
  upload dialog body; `pdf-upload-sender`, `pdf-upload-confirm`, cards `[data-sample-id=...]`), `pdf-list-header`,
  `pdf-row-<n>` (1-based; `data-row-id`), `pdf-row-<n>-apply` ("Save correction", shown once a field changes),
  `pdf-correction` (the correction lines under a row), `pdf-send` ("Send to matching", disabled while an NHI is invalid),
  `pdf-open-matching` (the result line's link). List origin: `list-origin` (the "Origin" row in the Admin session drawer
  and the Draft List drawer: the origin in words, its note "Replies go to <address>" or "No address held for replies";
  `data-origin=pdf|hospital|manual|recurring`), `booking-list-origin` (the Admin Booking header line "List origin · ...",
  same `data-origin`). Validators: `integrations-nhi-validator` (now on `/admin/intake/validators`); Data quality:
  `data-quality-empty`. Future scope: `demo-surface-future-scope`, `future-scope-pages`, `future-scope-log`,
  `future-scope-mapping` (cards `data-feed-id`), `integrations-cph-not-integrated`.
- Matching (catch-up Phase 33, `/admin/intake/matching` since catch-up Phase 34): `admin-matching` (the screen), `matching-empty`,
  `matching-import-open` (header button), `matching-import` (the dialog body; sample cards
  `[data-sample-id=SAMPLE_STG|SAMPLE_STG_UPDATE|SAMPLE_SX|SAMPLE_FORTE_SHEET]`), `matching-import-confirm`,
  `matching-import-result` (its ResultLine), `matching-interim` (the sample-file note), `matching-stats`
  (tiles `[data-stat=open|new|modification|cancellation|unmatched]`), `matching-table` (the shell's scroller),
  rows `matching-row-<n>` (1-based; pick one by name: `[data-shot^='matching-row-']:has-text('Diane Foster')`),
  `matching-received` (the first row's procedure cell; every procedure cell carries `data-received`),
  `matching-unmatched` (wraps the table while Unmatched is on). The row panel `matching-panel` (`data-import-row-id`)
  holds `matching-nhi` (the NHI field on a no-NHI or invalid-NHI row), `matching-diff` (the match line and the
  differences table, a checkbox per change named by its field, e.g. `role=checkbox[name=/Note/]`), `matching-stack`
  (each Procedure's stack, then `matching-choose-contract` and `matching-choose-rvg`, and the insurer line),
  `matching-decision` (radio cards, each `[data-decision=match|createBooking|createList|createDraft|reject]`),
  `matching-pairing-warning`, the footer primary `matching-apply` ("Create Booking", "Apply 3 changes", "Cancel
  Booking", "Mark as matched", "Create List and Booking", "Create Draft List and Booking", "Reject row"; disabled
  with its reason) and, after a decision, `matching-banner` (`role=status`). On the Admin Booking detail:
  `booking-from-hospital-row` and `booking-newer-hospital-text`. Side nav `nav-badge-intake` (was `nav-badge-matching`).
- Stubs (catch-up Phase 33a): `list-stub` (the stub row; also `data-stub-id`, `data-import-row-id`; a button on
  mobile and in tables, a `role=group` in the Admin drawer), `list-stub-row` (its `<tr>` on web List detail and Admin
  Review; click `[data-shot=list-stub-row] [data-shot=list-stub]` to show the inline details), `stub-sheet` (the
  mobile bottom sheet, or the inline details panel on web and Review), `stub-readings` (the readings caption inside
  it), `list-stub-note` ("1 waiting at intake" beside the progress bar on mobile and web List detail), `list-row-stub`
  (the triangle marker on mobile and web Lists rows), `daygrid-block-stub` (the marker on the Admin Day block beside
  `daygrid-block-count`), `stub-resolve-link` ("Resolve on Matching" on Admin drawer and Review stub rows). On
  Matching: `matching-stub` (the panel notice "A stub stands on Dr Souter's Tue 4 Aug PM List"), `stub-add-nhi` (Add
  NHI beside the NHI field; the field's input carries `data-row-nhi`) and `matching-stub-resolved` (the banner line
  "The Booking takes the stub's place on the List." after Add NHI).
- Public status (catch-up Phase 32d, no new hook names): `[data-status-choice=publicHospital]` in the mobile and web availability forms and the Day drawer's Change status sheet; `tr[data-status-row=publicHospital]` in Availability statuses; `[data-shot=drawer-change-status]` opens the sheet; the Day block for a Public session is `button[data-slot-id=<id>]` showing "Public" and its note; the legend and the "Status filters" group gain a "Public status" chip (a session status, no longer a List kind).
- UI unification Phase U6 (every earlier hook kept, none moved off its element): table shells are the shared
  `shared/table/TableShell`. Its `shot`, `testId` and `data-*` sit on the scroller `div` (as before:
  `invoice-list-table-shell`, `review-queue-table-shell`, `review-detail-table-shell`, `draft-lists-table`,
  `draft-lists-history`, `admin-notifications-table`, the masters tables' `masters-*` and `recurring-bookings-table`);
  its `tableData` sits on the `<table>` itself (`web-lookback-search`, `web-lookback-day` as `data-shot`;
  `aa-fee-preview`, `aa-fee-invoices` as `data-testid`). Headers are `thead th[scope=col]`; group rows are
  `tr > th[scope=colgroup]` (web Lists "Earlier, not yet authorised", the lookback search's "Upcoming" and "Past"). Clickable rows are the shared
  `ClickableRow`, a `tr` with the same row attributes (`data-draft-list-row`, `data-list-id`, `data-slot-id`,
  `data-quiet`, `out-of-hours-row`); the row never takes focus, and its keyboard handle is one button inside it. On
  Draft Lists that is the Session cell's button, named "Open Draft List Tue 21 Jul AM, Mercy Hospital"
  (`[data-draft-list-row=<id>] >> role=button[name=/^Open Draft List/]`); its Assign, Change date and Remove keep their
  names. Cards are the shared `shared/ui/Card`: a `section` named by its `h2` title (`h3` where a page sets it), with
  `data-shot` and `data-*` on the `section`: the Day rail's `admin-notifications-rail`, `admin-warnings-todo`,
  `admin-draft-lists-rail`, `admin-needs-invoice-destination` (heading ids kept), the profile cards `tier-card`,
  `anaesthetist-details`, `surgeon-specialties`, `surgeon-identifiers`, `surgeon-groups` and
  `surgeon-contacts`. The web panels are the same `Card`, so their titles ("Bookings", "Invoices",
  "Financial position"; "Leave" and "Receivables aging" were removed in catch-up Phase 38) are `h2`, no longer a `div`. The invoice rail's own `section` and `h2` cards
  (`invoice-info-rail`) are unchanged. Label and value rows are the shared `shared/ui/DefRow` in a `dl`: each row is
  `div > dt + dd` (was `div > span + span`) in the Admin drawers, the Booking detail (Paid by, funder details), Office billing
  setup, the Assign Draft List sheet, the invoice's Locked record and the profile facts. Page titles are the shared `PageHeader` (the `h1` text unchanged);
  eyebrows are the shared `Eyebrow` (CSS caps, so `text=` still matches the DOM's mixed case). The phone's day chip
  is the shared `DayChip`, test id `mobile-lists-day-chip` kept.
- Catch-up Phase 27a (AA Holding account): `data-shot` `billing-prepay-holding` (the Billing monitor card), `holding-entry`
  (its rows, `data-entry-kind`, `data-booking-id`), `monitor-journal-fault` (a pipeline Booking row's journal fault),
  `xero-holding-held` (the Xero pair's "Held in the AA Holding account" callout), `payment-held` (web Accounts payments
  pill), `prepayment-holding` (the
  Pre-payment panel line, `data-holding-state`), `capture-prepaid-holding` (inside `capture-prepaid`); `data-testid`
  `xero-transfer-journal` (the Xero manual journal), `xero-accpay-payee` and `xero-transfer-journal-reference` (the
  Admin invoice rail). See [AA Holding account](#aa-holding-account-catch-up-phase-27a).
- Catch-up Phase 26 (`data-shot`): mobile `/mobile/more` `mobile-profile` (the Profile card), `mobile-profile-rate`,
  `mobile-profile-rate-change` (its "Change"), `mobile-profile-hpi`, `mobile-profile-bank` (masked), the bottom sheet
  `mobile-rate-sheet` with `mobile-rate-save` ("Save rate"); web `web-profile` (`/web/profile`), `web-profile-link` (the
  nav persona button), `web-billing-panel`, `web-contact-panel`, `web-identity-panel`, `web-bank-panel`, `web-rate-save`;
  web GST tab `gst-month` (the month caption, no period switch); Admin `anaesthetist-bank` (Anaesthetists table cell,
  masked), `anaesthetist-bank-account` (the bank row of the record's Profile card), `anaesthetist-bank-fields` (the bank
  block in both sheets), `edit-anaesthetist-sheet`, `add-anaesthetist-sheet`. `anaesthetist-details` is now the record's
  Profile card (was "Details"). See [Anaesthetist profile, HPI CPN and bank account](#anaesthetist-profile-hpi-cpn-and-bank-account-catch-up-phase-26).
- Catch-up Phase 25 (`data-shot`): `booking-lock-badge` (the neutral "Contract locked at authorise" pill, in the
  heading of a locked `office-billing-setup-<n>` and on the Billing card in all three apps; nothing before authorise),
  `booking-lock-stamp` (its detail line on the web and Admin Billing card, "Locked Tue 21 Jul, 08:00 by Kirsty W." or the
  migrated words), `office-billing-setup-<n>` now carries `data-locked="true"` when read-only from the lock, with
  `office-billing-locked-stamp` inside; `procedure-contract-locked` (the lock glyph in a compact Procedure stack, Review's
  Procedures column); Review `review-list-rate` (the totals row's rate, "@ $26.50/unit (locked)" once authorised, else
  "(list rate)"), `review-locked-payee` ("Paid to ..." under the patient once authorised), `review-needs-price-blocker`
  (also test id `review-authorise-blocker`: one per Procedure that needs a price, with an Open link; Authorise disabled);
  Invoice `invoice-locked-record` (the "Locked record" rail card), `invoice-locked-outside-range` (its "Outside the
  range" pill), `invoice-regenerated` (the Regenerate result, `data-identical` true or false); Contract panel
  `contract-tabs`, `contract-tab-details`, `contract-tab-history`, `contract-history`, `contract-history-empty`,
  `contract-locked-against`, `contract-locked-row`; Billing monitor `monitor-retry-note` (under a run failure's reason,
  beside its "Retry" button `billing-retry-<bookingId>`: "Retry rebuilds from the locked record. ..."; only a billing-run
  exception has it). Since catch-up Phase 37 a hand-off fault is not a failed row: the Booking reads "Waiting for Xero"
  (`monitor-waiting-for-xero`) and is retried by the Xero sync queue ("Retry now" on its queue row); "Resolve & retry" and
  the "Handoff failed" pill are gone. GONE: `choose-contract-sheet`. See
  [The lock at authorise and Contract history](#the-lock-at-authorise-and-contract-history-catch-up-phase-25).
- Catch-up Phase 24 (`data-shot`): `change-price` (the office's "Change price" button in `office-billing-setup-<n>`,
  was "Price override"), `pricing-sheet` (the Change price dialog), `pricing-sheet-computed` ("Computed from the
  Contract" and the figure), `pricing-sheet-price` (the "Price $" input itself), `pricing-sheet-save` ("Save price"),
  `pricing-sheet-clear` ("Use the computed price", only once a price is typed), `pricing-sheet-refusal` (warning notice
  on a prepaid price whose prepayment invoice is raised: "This price is on a raised prepayment invoice. Use a credit or
  an additional invoice."), `office-billing-price` (the Price row's value in Office billing setup: "Typed $450.00" or
  "From the Contract"). The price line on every Booking's capture: `price-card` (`data-state` `override` | `amount` |
  `read-only` | `needs-price` | `no-charge` | `locked`), inside it `price-card-figures`, `price-card-price`,
  `price-card-needs-price`, `price-card-input` (the "Price $" input itself), `price-card-save` ("Save price"),
  `price-card-clear` ("Use the computed price"). `booking-total-strip` (the phone's dock above Mark complete, also test id
  `booking-calculation`), `booking-total-lines` (inside the rail's `booking-calculation` when one Procedure has more than
  one fee line). Review: `review-fee` (the Fee cell), `review-fee-computed` ("Computed $265.50" under a typed price),
  `review-no-charge` (a $0.00 Booking's "No charge" pill). Invoice: `invoice-no-charge` (the "No charge" pill under the
  number). Contracts list: `contract-override-pill` (RVG kinds only). Demo action `demo-action-demo-backdated-range`.
- Catch-up Phase 25a (`data-shot`): Contracts master create panel `contract-replaces` (the "Replaces" select, option values are Contract ids, and the "From" date input);
  `contract-still-on-warning` ("N Procedures dated on or after ... are still on ...", with rows `contract-still-on-row`, each with an Open link) and
  `contract-still-on-none` (the neutral note when nothing is on it), shown in the create panel with Replaces and From set and in a Contract's panel after Disable;
  `contract-created` (the ResultLine after "Create contract", the panel staying open when rows are listed); `contract-disabled-note` ("Disabled on ...: hidden from the
  Contract list unless asked for ...", in the Disabled Contract's panel). Under `contract-price-ranges`: `price-range-kept` ("1 authorised Procedure kept its old
  price") with rows `price-range-kept-row`. Admin Review: `review-flag` with `data-rule=contractDisabled` ("Contract disabled on Fri 10 Jul").
  GONE in 25a: `payer-offer-provisional`, `masters-modifiers-provisional`, `contract-and-reference` (the sheet) and its "Edit billing setup" button,
  the Billing reference field on Add Booking and phone advice, and the "Hospital reference" cross-match field (`invoice-cross-match` is Procedure date and Surgeon).
  See [Change price and the price line](#change-price-and-the-price-line-catch-up-phase-24). GONE:
  `capture-adjustment-and-charge` (the anaesthetist's "Adjustment and charge" card).
- Catch-up Phase 23 (`data-shot`): `procedure-primary-pill` (the "Primary" pill in the primary's
  `procedure-header`, only with two or more Procedures), `make-primary` (the teal text action on an additional
  Procedure's heading row), `make-primary-sheet` and `make-primary-confirm`, `procedure-additional-note` (new wording),
  `modifiers-on-primary` (the caption row on an additional Procedure's Units card, in place of `capture-modifiers`),
  `rvg-range-additional`, `units-row-b` / `units-row-t` / `units-row-m` (the Units card's stepper rows),
  `booking-total-split` (inside `booking-calculation` on a Booking with two or more Procedures: the per-Procedure rows
  "Primary · ..." and "Additional · ..." and the split caption), Review `review-modifier-split` and
  `review-procedure-share`. `office-billing-setup-<n>` is numbered in display order (the primary is 1).
- UI unification Phase U5 (every earlier hook kept): `admin-day-nav` (test id, Admin Day's toolbar of day and week steps,
  Today, the date input, Find available and the Row order group); `data-draft-tab=unassigned|history` (attribute on the
  Draft Lists tab links). GONE: Review's "Back to queue" link and the invoice detail's "All invoices" link. The breadcrumb
  is the only way back: `role=button[name="Review queue"]` on `/admin/review/:listId`, and
  `[data-testid=invoice-detail-screen] >> role=button[name="Invoices"]` on `/admin/invoices/:invoiceId`.
- Catch-up Phase 22a: `paid-by-sheet` (the one Paid by sheet), `paid-by-save`, `paid-by-change` (Change beside the payer), `paid-by-payer` (the payer's name on a
  Paid by line, `data-procedure-id`), `payer-not-billed`, `payer-offer`, `payer-offer-row`,
  `split-start`, `split-another-person`, `split-person`; Review: `review-payer` (per Procedure under its stack, `data-procedure-id`),
  `review-payer-contact` per Procedure, `review-payer-under-18`, `review-insurance` (Billed to column). The phone's Paid by row is
  no longer one tap target: `procedure-split-button` is its Split action. `payer-contact-missing` and `payer-under-18`
  now sit on each Paid by line. GONE: `booking-payer-row`, `payer-sheet`, the "Change the payer" button, `split-save`,
  "Save payer", "Save split".
- Catch-up Phase 22 (`data-shot` unless marked): the invoice document's `invoice-supplier` (the anaesthetist's name and
  GST number), `invoice-holder-reference` ("Your reference", holder layout only), `invoice-agent-block` (AA's logo, the
  sentence "Issued by Anaesthesia Associates Limited as agent for <supplier>" and the "Provisional (OQ-29)" pill;
  `invoice-agency-line` is now only that sentence, inside the block), `invoice-split-note` (a split share's note with
  "Open <number>" links), `invoice-lines` (rows carry `data-line-kind`), `invoice-btm-breakdown` (holder layout),
  `invoice-cross-match` (holder layout), `invoice-gst-caption` ("Prices are held GST exclusive. GST is added at the foot
  of the invoice."), `invoice-money-states`; the rail's `invoice-delivery` (`data-delivery` sent | toPost | noAddress),
  test ids `invoice-send-email` and `invoice-send-history`, `invoice-related` (Related invoices on a split share). The
  "Email invoice" button is gone. Invoices list: `invoice-list-delivery` (`data-delivery`), `invoice-list-split`. Review:
  `review-delivery-summary` inside `review-authorised-banner` ("4 invoices raised. 4 emailed, 0 to post."). Billing
  monitor: `monitor-no-address`. Master data: `contract-layout` and `contract-delivery` (Contracts table cells; nib reads
  Holder's layout and Email, `tr[data-system=noContractRvg]` Patient's layout and "Payer's email or post"),
  `anaesthetist-gst-number` (Anaesthetists table cell), `anaesthetist-gst-number-field` (Edit sheet). Xero:
  `xero-accpay-buyer-created` inside `xero-accpay-card`. Split (Paid by in the Billing card): `procedure-split-row` (web
  and Admin line, `data-split` none | fits | doesNotFit), `procedure-split-summary` (the value), `procedure-split-button`
  (web Split or Change; the whole Paid by row on mobile, `data-split`), the compact stack line `procedure-split`, `split-sheet`,
  `split-fee`, `split-row` (`data-row`), `split-share-input`, `split-rest-toggle`, `split-amount`, `split-total`,
  `split-add-party`, `split-remove`, `party-picker`, `party-option`, `party-picker-search`, test id
  `party-picker-toggle`.
- Catch-up Phase U3: `aa-fee-run-result` and `aa-fee-settings-result` (AA fees screen: the run result line and the settings save line, both the shared `ResultLine`; refusals there are `FormError`, `role=alert`).
- Catch-up Phase 20: `contract-picker`, `contract-rail-step-<n>`, `contract-rail-search`,
  `contract-rail-other-price` (the Billing card's "Price by" wrapper), `contract-rail-amount` (the
  input), `contract-rail-outcome`, `contract-rail-enter-rvg`, `contract-rail-only-option`,
  `no-contract-group` (the "No contract" heading and its two backstops, in the Billing card's combo and
  the creation-form sheet; `contract-rail-pinned` is retired, UI unification U4; the sheets' Contract row `procedure-contract-row` went with the "Contract and reference"
  sheet in catch-up Phase 25a); the mobile Billing rows
  `billing-contract-rows`,
  `needs-invoice-destination`, `contract-set-by-office`, `contract-price-cleared`; the RVG cues
  `rvg-code-optional`, `list-row-contract-cue`; the Admin Day card
  `admin-needs-invoice-destination` and its rows `needs-destination-row`;
  `manual-contract`; the Suggested pill `rail-suggested` on the step tile the Booking's funder suggests
  (catch-up Phase 21; tiles carry `data-rail-option="<value>"`); the add form's payer block
  `add-booking-payer`.
- Out-of-hours sessions (catch-up Phase 32c): `out-of-hours-open` (the row control), `out-of-hours-open-sheet`,
  `daygrid-evening-block` (any block in the out-of-hours session, with `data-out-of-hours`; the after-hours zone
  behind it is `[data-after-hours]`), `drawer-session-draft-lists`, `drawer-close-out-of-hours`; the
  anaesthetist's `out-of-hours-row` (the mobile `ListRow` button and the web Lists `tr`, each with
  `data-list-id`); mobile availability `availability-mine-ooh`. Session `OOH` reads "Out-of-hours" everywhere.

- Single-Booking move (catch-up Phase 32a): `move-booking-action` (the entry point and its line),
  `move-booking-sheet`, `move-booking-header`, `move-booking-search` (the shared type-ahead box; the
  office's finders use `candidate-search`, web availability `availability-search`, the List move sheet
  `move-search`), `move-booking-receivers`, `move-booking-receiver` and `move-booking-blocked` (each with
  `data-anaesthetist-id`), `move-booking-confirm`, `move-booking-landing`, `move-booking-payable`,
  `move-booking-honour` (prepaid only), `move-booking-tell-office`, `move-booking-submit`,
  `move-booking-done`, `move-booking-office-told`. Notices: `moved-to-you-booking-row`,
  `booking-moved-to-you`, the drawer's `drawer-booking-moved-here`. The submit sheet's doer sentence:
  `submit-doer-note`.

- Move sheet (catch-up Phase 32; one sheet: a bottom sheet on mobile, a dialog on web):
  `move-sheet`, `move-list-header` (with "1 of 2" in a range), `move-unavailable-line` (its unavailable
  mode), `move-where`, `move-choice-office`, `move-choice-colleague`, `move-colleagues` (rows
  `move-colleague-<registration>`), `move-confirm`, `move-vacated` (the shared vacated-session control, catch-up Phase 32b: chips
  `move-vacated-free`, `move-vacated-unavailable` or the status being set, `aria-checked`; asked on the
  unavailable prompt too, with no provisional text), `move-submit` (the "Move List" button), `move-done`;
  `move-lists-intro` before a range or series over several Lists ("Choose where they go"). Entry points:
  `list-move` (List detail "Move this List": a button on web, a row of the mobile List options sheet), `availability-panel-move` (My calendar
  panel), `dashboard-move-list` and `dashboard-move-picker` (web dashboard "Move a List"),
  `dashboard-move-to-<registration>` (Who's free chips). Notices: `moved-to-you`, `moved-to-you-row`,
  `list-moved-to-you`, `list-row-badge` ("New" on Forward Lists). Admin: `admin-notifications-rail`
  (Day rail card, under Draft Lists; scroll it into view), `admin-notifications-see-all`,
  `drawer-moved-here` (List drawer), `draft-list-returned-by` (Draft List drawer).
- Catch-up Phase 32b: `notification-tick` (the shared `TickButton`, "Resolve", on the rail card and the
  page), `admin-notifications-count` (rail) and `admin-notifications-page-count` (page),
  `admin-notifications-show-resolved`, `notification-resolved-line`, `notification-alert-note`;
  `drawer-change-status` (Admin Day drawer: an action on a List's drawer, an inline link on an empty
  session's Status row); the office's status sheet `office-status-sheet`, `office-status-choices`
  (`[data-status-choice=<key>]`), `office-status-holds-list`, `office-status-save`,
  `office-status-where`, `office-status-choice-office`, `office-status-choice-colleague`,
  `office-status-not-available`, `office-status-confirm`, `office-status-vacated` (chips
  `office-status-vacated-<key>`), `office-status-pairing-warning`, `office-status-confirm-button`,
  `office-status-done`; `reassign-vacated` (chips `reassign-vacated-<key>`; was a select);
  `drawer-closed-session` (now "Dr X has marked this session ... make it available"); Alert the office:
  `alert-office-list` / `alert-office-booking` (the entry), `alert-office-action` (the button),
  `alert-office-sheet`, `alert-office-note`, `alert-office-send`, `alert-office-done`,
  `alert-office-sent`, `alert-office-resolved`; Admin `office-alert-line` with `office-alert-tick`;
  `nav-badge-notifications` (active notices). Mobile List detail: `list-options` (the ⋯ in the nav bar),
  `list-options-sheet`, its rows `list-move` and `list-alert-office`.

These are the `data-testid` values in `src/`. Use them as `[data-testid=...]`.

**Admin**

- `admin-list-drawer` (the session drawer, kept for recipes), `admin-list-actions`, `admin-right-rail`
- Review (catch-up Phase 38a): `review-changed-since-submitted` (the pill, on the List review and the
  queue row, and on Booking detail for a changed Booking), `review-changed-booking` (the "Changed" tag
  on a row, opens its History), test id `review-authorise-blocked` (why Authorise is disabled)
- Review (catch-up Phase 21a; the inline pills are now the shared `Pill`, same text):
  `review-procedure-stack` (one per Procedure inside the `review-procedures` cell), `review-flag` (each flag
  pill, under its Procedure or in the Flags column, with `data-rule` = `contractChanged` |
  `contractNoLongerFits` | `needsInvoiceDestination` | `needsPrice` | `typedPrice` | `notCompleted` |
  `btmOverride`; the payer contact flag keeps `review-payer-contact`), `review-contract-approve` and
  `review-contract-correct` (teal text actions on a `contractChanged` flag), `review-contract-approved`
  ("Approved <time>" or "Approved at authorise <time>"), `review-contract-approve-all` (action bar button),
  `review-payer` and `review-insurance` (the Billed to cell: payer with Change, insurer or funder with its
  number or "No approval number"; insurance only when the Booking names one, none on Morrison Mon 20),
  `review-alert` (32b's open alert with Resolve; none at reset), `review-warning-clear` (an open warning with
  Clear), `review-late-edit` (wraps the `review-changed-booking` pill), and the existing
  `review-open-booking` ("Open"). Test id `review-authorise-approves` (the confirm's count of approvals).
  There is no separate `capture-rvg-reference` hook: use `[data-shot=capture-procedure-code][data-rvg-role=reference]`.
- `data-shot` (catch-up Phase 28): `admin-slot-drawer`, `admin-assign-list`, `assign-hospital`,
  `admin-availability-finder-open`, `admin-availability-finder`, `finder-surgeon`, `finder-count`,
  `admin-schedule-settings`, `admin-session-times`, `admin-session-times-edit`, `admin-horizon-months`,
  `horizon-preview`, `admin-add-anaesthetist-start`, `admin-day-beyond-horizon`,
  `admin-edit-session-times`, `session-times`, `reassign-vacated`, `assign-list-pairing-warning`,
  `admin-phone-advice`. Sessions carry `data-slot-id`; rows and blocks holding a List also carry
  `data-list-id`. The phase doc's `mobile-lists-assigned` hook is these two attributes on the mobile
  Lists row.
- `invoice-list-screen`, `invoice-list-table-shell`, `invoice-detail-screen`,
  `invoice-detail-workspace`, `invoice-info-rail`, `invoice-action-row`
- `xero-handoff-status`, `xero-accrec-reference`, `xero-accpay-reference`
- `review-queue-screen`, `review-queue-table-shell`, `review-queue-recently-billed`
- `review-detail-screen`, `review-queue-navigation`, `review-detail-table-shell`, `review-btm-value`
- `list-reassignment-overlay`
- Conflicts and holidays (`data-shot`, catch-up Phase 30): `daygrid-block-conflict` (a conflicted
  block; also `data-conflict=true`), `daygrid-legend-conflict` (the "Conflict" legend chip's swatch;
  the chip is the button named "Conflict"), `drawer-attention` (the drawer's conflict box),
  `drawer-conflict-cleared`, `drawer-closed-session` (an empty closed session's note),
  `conflict-clear-sheet`, `conflicts-table`, `conflicts-filters`, `conflicts-count`,
  `conflicts-confirmation`, `conflicts-empty`, `admin-todo-conflicts` (the To-do card's line),
  `assign-list-conflict-warning`, `phone-advice-conflict-warning`, `edit-list-conflict-warning`,
  `reassign-not-available` (the collapsed group), `reassign-pairing-warning`, `reassign-vacated` (GONE in 32b:
  `reassign-conflict-warning`), `move-booking-conflict-warning`,
  `hospitals-mode`, `hospital-calendar` (cells `button[data-calendar-day=<date>]`), holiday pills
  `button[data-holiday=<id>]`, `holiday-add-sheet`, `holiday-edit-sheet`, `holiday-delete-confirm`.
- Recurring bookings (`data-shot`, catch-up Phase 30): `recurring-bookings-table` (rows
  `tr[data-recurring-booking=<id>]`, retired ones `data-retired=true`, at the foot),
  `recurring-bookings-apply-result`, `recurring-booking-sheet`, `recurring-booking-preview`,
  `recurring-booking-result`, `recurring-booking-retire`, `recurring-booking-pairing-warning` (was
  `permanent-list-pairing-warning`). In the sheet the selects are Anaesthetist, Day of week, Hospital
  (usual) and Usual surgeon, in that order.

**Simulators**

- `integration-workspace`, `integration-inspector`, `integration-library`
- `xero-invoice-table`, `xero-invoice-table-shell`, `xero-invoice-row-<accRecId>`, `xero-pair-detail`,
  `xero-money-flow-grid`, `xero-invoice-identifiers`, `xero-aa-fee-pair`, `xero-accrec-card`, `xero-accpay-card` (with
  the buyer-created block `[data-shot=xero-accpay-buyer-created]` inside it since catch-up Phase 22)
- AA fee: `admin-aa-fee-invoices`, `admin-aa-fee-settings`, `billing-aa-fee-invoices`, `web-accounts-aa-fees`

**Mobile**

- `mobile-tab-bar`, `slide-home`, `slide-list`, `slide-booking`
- `mobile-lists-header`, `mobile-lists-scroll`, `mobile-lists-today`
- Main view and look-back (catch-up Phase 38a): `mobile-main-view-earlier` (the hint),
  `mobile-main-view-earlier-group`, `mobile-lookback-calendar`, `mobile-lookback-day`,
  `mobile-lookback-search`; test ids `mobile-lists-search`, `mobile-lists-day-chip`,
  `mobile-lists-search-count`; `list-invoices` and `list-authorised-status` on an authorised List
- `mobile-list-header`, `mobile-list-scroll`, `mobile-list-footer`, `list-submission-overlay`
- `mobile-booking-header`, `mobile-booking-header-actions`, `mobile-booking-scroll`, `mobile-booking-commit`
  (`mobile-list-footer`, `mobile-booking-commit` and My calendar's dock are the shared `StickyDock` since U7,
  `[data-sticky-dock]`; each publishes `--aa-dock-height`)

**`data-shot` hooks for warnings** (catch-up Phase 15a; use as `[data-shot=...]`)

- `booking-warning` (the small triangle on a Booking row or header; not interactive),
  `booking-warnings` (the warnings panel at the top of the Booking detail), `booking-prepayment`
  (the prepayment warning's row in that panel, and the Booking's prepayment panel under it), `admin-warnings-todo` (the To-do
  card in the Admin Day rail), `daygrid-block-warnings` (a day-grid block button whose List has an
  open warning; click it to open the drawer), `drawer-booking-warning` (an outlined Booking row in
  the List drawer). `daygrid-block-prepayment` and the "Pre-payment flagged" filter are gone: the
  filter is "Has warnings". Catch-up Phase 21: the warnings panel row `booking-child-warning` (a child
  as the payer) and `booking-approval-warning` (an insurer with no approval number); the To-do rows
  `todo-child-warning` and `todo-approval-warning` (each with "Clear (optional) warning for <patient>").
  At reset the To-do card holds Riley's prepayment and the payer review List's two (Ella Moana, Janet
  Ormsby), all dates.

**`data-shot` hooks for the procedure stack and source** (use as `[data-shot=...]`; catch-up Phase 20a)

- `procedure-stack` (on every Booking screen, the small Procedure card at the top of the capture column:
  the latest text only, as received, with when and where it came from, its text `procedure-text`; the
  Contract and the RVG code `capture-procedure-code` are both in the Billing card `capture-billing`). Compact,
  in Admin Review's `review-procedures` cell and the List drawer's `drawer-procedure-stack`, it also has
  `procedure-contract` (Contract and pricing basis) and `procedure-rvg-code`. `procedure-description` (the
  manual form); the anaesthetist's billing reference field is gone (catch-up Phase 21: the approval number on `booking-funder-row` takes its place); `invoice-billed-to` (the payer's email or postal address under "Invoice to"); the invoice description prints on
  each line of `invoice-lines` (catch-up Phase 22; `invoice-procedure-heading` is gone);
  `review-open-booking`. `data-testid=procedure-header` is the card's heading row: on a Booking with two or more Procedures the
  primary's (always `>> nth=0`) carries `procedure-primary-pill`, and each additional one has Make primary
  (`make-primary`) and Remove (catch-up Phase 23).
  The attachment hooks are gone. `booking-source` (the source line)

**Web**

- `web-booking-header`, `web-booking-commit`, `payment-history-row-<invoiceNumber>`
- Main view and look-back (catch-up Phase 38a): `web-main-view-earlier` (the earlier group's
  `tbody`), `web-lookback-search`, `web-lookback-day`; test ids `web-lists-search`,
  `web-lists-go-to-date`; `[data-progress=submitted]` on a Progress cell and on a submitted week-strip
  block (its name ends "Done · unbilled")

**Shared capture** (web and mobile booking)

- `procedure-header`, `booking-calculation`, `time-capture-track`, `time-action-slider`,
  `completion-overlay`, `dock-spacer`
- RVG detail and completion (catch-up Phase 21a; mobile, web and Admin): `capture-rvg-detail` (wraps
  `capture-times` and the Units card with `capture-modifiers`; present only on an RVG pricing kind),
  `capture-required` (the "Required" caption on times and the modifiers step), `capture-modifiers-none` (the
  teal "None apply"), `capture-modifiers-none-done` ("No modifiers claimed · Change"), `capture-price-status`
  (warning notice "Needs a price" on a price with no amount), `completion-alert-office` (neutral notice pointing to Alert the office for an office-fixable
  failure). `capture-procedure-code` carries `data-rvg-role` = `required` (an RVG kind with no code yet) |
  `reference` (a fixed or open price), absent otherwise (a chosen RVG-kind code, no Contract); on a fixed price its caption `rvg-code-optional` reads "RVG code
  (for reference). Optional: ...", shown after `rvg-code-add-reference` when no code is set.
- `contract-approval-status` (mobile and web, under the anaesthetist's Billing card): "Awaiting office
  approval" or "Approved by the office <time>", `data-status` = `pending` | `approved`; only after the
  anaesthetist changed the Contract herself (none on Dr Souter's Bookings at reset).

**`data-shot` hooks for surgeons, pairings and tiers** (catch-up Phase 17; Admin only)

- Parties and Contracts (catch-up Phase 18): `parties` (table), `party-panel` (the wide side panel,
  `role=dialog`; close with Escape or Cancel), `contract-catalogue` (the Contracts table, or its empty
  state), `contract-search` (search field and result count), `contract-result-count`,
  `contract-status-filter` (Active, Disabled, All buttons), `contract-holder-filter` (the Holder field's wrapper `div`; the select is `[data-shot=contract-holder-filter] select`),
  `contract-detail` (the Contract side panel), `contract-settings` (Pricing section: prepaid, pricing
  kind, rate or discount, override), `contract-links` (Holder and who it bills: holder, Bills, linked
  surgeons and anaesthetist), `contract-disable` (Disable, error treatment), `contract-codes` (Invoice and
  codes: holder reference code, invoice description, default RVG code `contract-default-rvg` with
  Choose or Change and Clear), `contract-price-ranges` (a fixed price's ranges, rows `price-range-row`
  with `data-range-start` and `data-in-force="today"`, the add row `price-range-add` with inputs
  labelled "New range start" and "New range price (ex GST)" and the "Add price range" button; refusals
  in `[data-shot=contract-detail] [role=alert]`; the only range's Delete is disabled, named "Delete (a
  Contract keeps at least one price range)"); `choose-contract-sheet` is gone (catch-up Phase 25). The office billing setup's Contract select lists `<AA code> · <name>`, No contract · RVG first,
  and never a Fixed price fallback.
- Modifiers (catch-up Phase 19b): `capture-modifiers` (the ledger inside the Units card; also the
  completion anchor for `modifierClaims`), `capture-modifier-applied` (a pre-applied row, with
  `data-modifier-code`), `capture-modifier-claim` (a claimed row), `capture-modifier-removed` (the
  "Removed: A1. Put back" line), `modifier-add`, `modifier-picker`, `modifier-explanation`,
  `modifier-units`; Admin `masters-modifiers`, `masters-modifiers-rvg` (the 30-row table, rows
  `tr[data-modifier-code=…]`), `masters-modifiers-aa`,
  `add-aa-modifier`, and on the RVG groups table `masters-rvg-included` (the "P1 · 0" cell on
  the 20 Neurosurgery and Spine rows). `capture-asa-status` is gone (no ASA card), as are the
  segmented modifier bands and "Also applies" chips.
- RVG groups (catch-up Phase 19): `masters-rvg-groups`, `rvg-group-sheet`, `rvg-group-retire`,
  `rvg-group-search`, `rvg-type-ahead`, `rvg-section`, `rvg-section-heading`, `rvg-code-chosen`, `rvg-base-units`, `rvg-range-units`,
  `rvg-outside-guide`, `rvg-code-clear`, `manual-rvg-code`; the RVG code field keeps
  `capture-procedure-code` (inside the Billing card's price; there is no `procedure-code-card`).
  There is no `masters-rvg` hook. The RVG time rule panel above the table is
  `masters-rvg-time-rule` (catch-up Phase 19a); since catch-up Phase 42 its "Edit"
  (`rvg-time-rule-edit`) opens `rvg-time-rule-sheet`. The T row's caption reads "From start and finish
  stamps · RVG time tiers"; money surfaces show "Needs a price" (`booking-needs-price` on the Booking
  total) where a fixed price has no range in force.
- Specialties, funding tags and fallbacks (catch-up Phase 18a): `masters-specialties`,
  `masters-funding-tags`, `specialty-sheet`, `funding-tag-sheet`, `surgeon-specialties` (the profile's
  Specialties card), `surgeon-specialties-field` (the surgeon sheet's field), `contract-specialties`,
  `contract-funding-tag`, `contract-placement`, `contract-tag-filter` (the Contracts view's funding tag
  field's wrapper `div`; its select is `[data-shot=contract-tag-filter] select`), `contract-system-notice`, `contract-system-pill` (the "System" pill), and the row marker
  `tr[data-system=openPriceFallback|noContractRvg]`.
- Master data tables: `masters-anaesthetists` (rows `tr[data-anaesthetist=<id>]`, tier pills
  `[data-tier=1..4]`), `masters-surgeons` (rows `tr[data-surgeon=<id>]`), `masters-surgeon-groups` (`tr[data-group=<id>]`), `masters-hospitals`
  (cards `[data-hospital=<id>]`). Since catch-up Phase 42 the masters tables are the shared table kit
  (`MasterTable` over `TableShell`, the hook on the scroller `div`), retired rows carry `data-retired=true` and hide
  until `show-retired` (the "Show retired" switch) is on, with a neutral `[data-retired-pill]`.
- Master data, catch-up Phase 42: the sub-nav groups `[data-masters-group=<group>]` (buttons
  `[data-masters-view=<view>]`); `masters-public-holidays` (rows `tr[data-public-holiday=<id>]`),
  `public-holiday-result`, `public-holiday-add-sheet`, `public-holiday-edit-sheet`, `public-holiday-open-hospitals`,
  `public-holiday-delete-confirm`; on Hospitals & holidays each card's `[data-public-holiday-line]`, the calendar's
  read-only public-holiday block `[data-public-holiday=<id>]` inside `button[data-calendar-day=<date>]`,
  `hospital-calendar-public-link`, `holiday-result`; `edit-hospital-sheet`, `retire-section` (`data-retired`),
  `retire-blockers`, `show-retired`; `edit-aa-modifier`; `rvg-time-rule-edit`, `rvg-time-rule-sheet`,
  `rvg-time-rule-part-interval`, `rvg-time-rule-preview`; `load-banner` (`[data-load-banner=seed|goLive]`, the
  waiting-load notice under a view's header). Seed load: `seed-load`, cards `[data-seed-sheet=<entity>]`, file inputs
  `input[data-seed-file=<entity>]`, `master-load-result` (`data-load-id`, `data-load-status=staged|loaded|discarded`;
  rows `tr[data-load-row=<n>][data-row-status=valid|rejected]`; "All rows" and "Only rejected" pills),
  `master-load-commit` ("Load N valid rows"), `master-load-loaded` (the loaded line). Go-live load:
  `masters-go-live` (`data-go-live-status=staged|loaded`), `go-live-tile-load`, `go-live-candidates` (rows
  `tr[data-scan-row]`, `data-decision`; the Solutions Plus units struck through), `[data-go-live-sheet=<entity>]`,
  `go-live-commit` ("Load approved data"), `go-live-result`.
- Pages: `surgeon-profile`, `surgeon-hpi-chip`, `surgeon-identifiers`,
  `surgeon-contacts`, `surgeon-groups`; `anaesthetist-record`, `anaesthetist-hpi-chip`, `anaesthetist-details`,
  `tier-card`.
  (`anaesthetist-details` is the Profile card since catch-up Phase 26.)
- Practice and contacts (catch-up Phase 17b): the Surgeons table has columns Name, Specialties, Practice,
  Office contact, HPI CPN, Pairings; rows `tr[data-surgeon=<id>]` carry `data-practice` and `data-hpi`
  ('' when blank), the office cell is `td[data-office-to]`. On the profile, `surgeon-contacts` holds
  `[data-practice]`, `surgeon-personal-contact-card` and `surgeon-office-contacts-card`; each office
  contact is `[data-office-contact="1"]`, `"2"`, ...; `office-first-pill`. On the surgeon sheet:
  `surgeon-practice-field`, `surgeon-hpi-field`, `surgeon-personal-contact`, `surgeon-office-contacts`,
  `office-contact-add`, `office-contact-remove`. GONE in 17b: `masters-surgeon-rooms`, `surgeon-room-card`,
  `surgeon-rooms-field`, `room-contact-add`, `room-contact-sheet`, `room-contact-remove`,
  `room-sheet-contacts`, `surgeon-room-sheet`, the "Surgeons' rooms" sub-nav button.
- Pairing section: `pairing-section`, groups `[data-pairing-group=NOT_PREFERRED|PREFERRED]`, rows
  `[data-pairing=<entryId>]`, `pairing-ended` (the shared `Disclosure` since UI unification U7: click
  `[data-shot=pairing-ended] > button` to open; it carries `aria-expanded`), `pairing-add-sheet`, `pairing-counterpart` (the select; a taken counterpart's
  option is disabled with `data-taken`), `pairing-preview`, `pairing-end-sheet`.
- Pickers (session 1): `surgeon-picker`, `candidate-picker`, `tier-filter`, `candidates-clear`,
  `candidates-not-preferred` (rows `[data-candidate=<id>]`), and the warnings
  `edit-list-pairing-warning`, `phone-advice-pairing-warning`, `reassign-pairing-warning`,
  `recurring-booking-pairing-warning` (renamed in catch-up Phase 30).
- Day grid: every block button carries `data-list-id=<listId>`, so a recipe opens an exact List's
  drawer with `[data-list-id="L-..."]`. The drawer's surgeon is a link (`drawer-surgeon-link`) to the
  profile.

- Draft Lists (catch-up Phase 31): `admin-draft-lists` (page), `admin-draft-list-drawer`, `admin-draft-lists-rail` (Day rail card, with `admin-draft-lists-see-all`), `admin-assign-draft-list` (sheet; becomes `admin-assign-draft-list-not-preferred` when a not-preferred pick is shown; `draft-list-reach`, `draft-list-candidates`, `assign-draft-list-pairing-warning`, `assign-draft-list-holiday-warning`, `assign-draft-list-confirm`; `assign-draft-list-closed-warning` is GONE since catch-up Phase 32b), `admin-new-draft-list` (`draft-list-hospital`, `draft-list-surgeon`, `draft-list-date`), `admin-redate-draft-list`, `admin-remove-draft-list`, `draft-lists-table`, `draft-lists-history`, `draft-lists-assigned`, `draft-list-available`, `draft-list-add-booking`, `daygrid-draft-band`, `daygrid-block-count`; nav badge `nav-badge-draftLists`. The List drawer's ACTIVE state is plain text in its subtitle, so highlight `[data-testid=admin-list-drawer] > header`.

- Ledger (catch-up Phase 36, `/admin/ledger` and `/admin/ledger/anaesthetists/:anaesthetistId`): `ledger-system-of-record`
  (the page header), `ledger-anaesthetist-select` (one-anaesthetist scope), `ledger-balance` (the balance indicator,
  `data-in-balance=true|false`, checks `li[data-check=<code>]`), `ledger-tiles` (whole: the tile rows; one
  anaesthetist: the grid holding `ledger-aa-owes`, `ledger-owes-aa` and the Collected and Paid out tiles),
  `ledger-anaesthetists-out-of-balance` (the empty state or the table, rows `tr[data-anaesthetist-id=<reg>]`),
  `ledger-unmatched` (rows `tr[data-unmatched-id=<id>]`), `ledger-allocate`, `ledger-refund`,
  `ledger-allocate-dialog` (options `[data-allocate-pair=<pairId>]`), `ledger-refund-dialog`, `ledger-refund-confirm`,
  `ledger-pairs` (the empty state or the table, rows `tr[data-pair-id=<id>]` with `data-pair-kind=procedure|prePayment|transfer|aaFee`),
  `ledger-footnotes`; side nav `nav-badge-ledger`.
- Ledger reads elsewhere (catch-up Phase 36): the invoice rail's `invoice-ledger-card` (replaces the
  `section:has(h2:text-is("Xero handoff"))` selector; inside it `xero-handoff-status`, `ledger-receivable-number`,
  `xero-accrec-reference`, `ledger-payable-number`, `xero-accpay-reference`, `xero-accpay-payee`,
  `xero-transfer-journal-reference`, `invoice-open-ledger`); the Billing monitor's `billing-open-ledger`; web
  Accounts' `web-accounts-position`; mobile Balances' `balances-collected-paid-out` and `balances-you-owe-aa`; the Xero
  sim pair's `xero-ledger-pair` and `xero-ledger-match`, inside `xero-engine-link`.
- Billing monitor restyle and Xero panels (catch-up Phase 37, `/admin/billing`; see its Routes row for the search params):
  `billing-xero-connection` (the Xero line), `billing-monitor-tiles` with `billing-tile-awaiting`, `billing-tile-authorised`,
  `billing-tile-problems`, `billing-tile-payables`; `billing-monitor-filters` (inside it `billing-filter-anaesthetist`,
  `billing-filter-hospital`, `billing-filter-from`, `billing-filter-to`, `billing-filter-clear`), `billing-monitor-count`,
  `billing-monitor-empty`; one `section` `billing-group-<anaesthetistId>` per anaesthetist (`billing-group-34821` Souter,
  `billing-group-39560` Ropata, `billing-group-25490` Morrison; its expand-all `billing-group-expand-<anaesthetistId>`);
  `billing-awaiting-<listId>` (an "Awaiting approval" row) with `billing-open-in-review-<listId>`; `billing-pipeline-<listId>`
  (now a `tbody`: the summary row plus, expanded, the detail row; Booking rows are `tr[data-booking-id]` in a nested
  table); `billing-patient-balance` (Phase 40, replaces `billing-prior-balance`: the balance triangle on the patient cell, open patient-balance warnings only), `monitor-waiting-for-xero` and `monitor-journal-fault`
  (the Booking's detail while its hand-off or journal waits), `monitor-xero-flag` (voided or amended in Xero),
  `monitor-retry-note` and `billing-retry-<bookingId>` (billing-run exceptions only). The Xero panels:
  `billing-xero-queue` ("Xero sync queue": rows `tr[data-queue-item=<id>][data-queue-kind=...]` with What ("Hand off
  AA-2026-...", "Sync payment on ...", "Record disbursement on ...", "Reconciliation poll"), Attempts, Next try, Last
  error, Status pill (Waiting, Retrying, Alert raised) and "Retry now" `billing-xero-retry-<queue item id>`; empty
  "Nothing is waiting for Xero."; `billing-xero-alert` after repeated failures; `billing-xero-sent-toggle` "Sent after
  waiting (N)" opens the sent table), `billing-xero-divergence` ("Changed directly in Xero", only when the poll flagged
  something: rows `tr[data-divergence-id][data-divergence-kind=voidedInXero|amendedInXero]`, "Xero shows" pill against
  "Receivable open, $X", "Resolve" `billing-xero-resolve-<id>`), its side panel `billing-xero-resolve-panel` (outcomes
  `[data-outcome]`, `billing-xero-resolve-note`, `billing-xero-resolve-save`, `billing-xero-resolve-provisional`);
  `billing-payables-run` ("Authorised, awaiting Xero's payables run"; since catch-up Phase 39a the payment cycle's draft
  section, and `billing-payables-due` is gone),
  `billing-run-payables-in-xero` (button "Run payables in Xero", Simulated Xero badge), `billing-payables-result`,
  `billing-open-ledger`. Review, opened from the monitor: `review-back-to-billing`. The invoice rail:
  `invoice-waiting-for-xero`, `invoice-xero-flag`, `invoice-open-billing-monitor`.
- Admin Day reconciliation (catch-up Phase 37, `/admin/day/:date` right rail; US-13.2.4): `dashboard-reconciliation`
  (`data-status=square|outOfBalance`; "Books square" or "Out of balance"), failing checks
  `li[data-check-id]` ("off by $X"), items `reconciliation-item` (`data-source=unmatchedReceipt|xeroQueue|xeroDivergence|bankLine`,
  amount and age in days), `dashboard-reconciliation-proposed` (the "Proposed" caption).
- Xero simulation (catch-up Phase 37): `xero-outage-banner` (every tab, during an outage); on a pair
  `xero-accpay-paid-in-xero`, `xero-accpay-engine-detection` (lines `[data-engine-state=recorded|notDetected|queued]`),
  `xero-accrec-voided`, `xero-accrec-amended`; on `/demo/xero/bank` `xero-bank-reconciliation`, `xero-bank-scope`,
  `xero-bank-empty`, `xero-remittance-<id>` (lower case, `xero-remittance-rmt0001`), `xero-bank-line-<id>` (lower case,
  `data-line-status=matchedByAddOn|matchedByOffice|unmatched`), `xero-bank-unmatched` (the section),
  `xero-bank-unmatched-<id>` (lower case), `xero-bank-pick-<lineId>` and `xero-bank-match-<lineId>` (upper case,
  `BKL0003`), `xero-bank-match-result`.
- Demo action rows (catch-up Phase 37): `demo-action-xero-outage-start`, `demo-action-xero-outage-restore`,
  `demo-action-xero-void-invoice`, `demo-action-xero-amend-invoice`, `demo-action-xero-pay-bill`,
  `demo-action-xero-bulk-remittance`.
- Web and mobile money views (catch-up Phase 38; US-12.2.1 to US-12.2.3): web dashboard `web-financial-position`
  (the Financial position card); web Accounts `web-accounts-outstanding` (the Outstanding card; rows
  `tr[data-testid=outstanding-row-<invoiceNumber>]` with `data-booking-id`, total `[data-testid=outstanding-total]`),
  GST report `web-gst-month-picker` (on the `<select>`), `web-gst-actions`, `web-gst-report` (the table scroller; rows
  `tr[data-testid=gst-report-row-<invoiceNumber>]`), `web-gst-not-yet-paid`, `web-gst-email-sent`, with `gst-month`
  kept as the caption; mobile Balances `balances-total`, `balances-outstanding` (cards
  `[data-testid=balances-outstanding-<invoiceNumber>]`), `balances-gst-month`, `balances-gst-month-header`. Demo action
  rows `demo-action-web-payment-full` and `demo-action-web-payment-half`. Removed: the Overdue tab and its ageing
  columns and bars, "GST activity", the Productivity, Leave and "Receivables aging" panels.
- Scale and privacy (catch-up Phase 43). Harness chrome: `scale-banner` (generating, loaded or failed), inside it
  `scale-timings-toggle` (only once loaded) and `scale-timings` (rows `tr[data-timing=<key>]`); `demo-action-confirm`
  (a Run button while it asks to confirm). Pagers (the one `Pager`, `nav[aria-label="Pages"]` with `data-page` and
  `data-pages`, `[data-pager-range]`, `[data-pager-page]`): `day-grid-pager` (inside `day-grid-footer`),
  `invoices-pager`, `audit-pager`, `ledger-pager`, `billing-monitor-pager`, per group `billing-group-pager-<anaesthetistId>`
  and `billing-group-show-all-<anaesthetistId>`. Invoices `invoices-search` (on the `<input>`); Audit `audit-count`.
  Matching: `matching-restricted`, `matching-raw-row` (the link), `matching-raw-row-views`, `matching-raw-row-sheet`,
  `matching-raw-row-reason`, `matching-raw-row-reason-text`, `matching-raw-row-view`, `matching-raw-row-columns` (rows
  `tr[data-raw-column=<name>]`), `matching-raw-row-policy`. Data inspector: `nhi-scan-panel`, `nhi-scan-report`
  (`data-scanned`), rows `tr[data-scan-area=<key>]` with `data-hits`, `data-saving-paused` (full scale only),
  `data-lifecycle-cap`. Xero simulation: `xero-volume-callout`, `xero-table-cap` (full scale only). Master data, Xero
  & archiving: `archive-scale-line`. Harness bar only: `synthetic-data-badge`. Demo action rows `demo-action-load-full-scale`, `demo-action-scan-nhi-leaks`,
  `demo-action-matching-raw-row-other-role`.
- Weekly payment cycle and remittance (catch-up Phase 39a; US-10.2.5 to US-10.2.7). Billing monitor: `payment-cycle`
  (the card), `payment-cycle-status`, `payment-cycle-step-1` to `-4` (the rail), `payables-run-draft`,
  `payment-cycle-close`, `payment-cycle-anomalies` (anomaly rows `li[data-anomaly-id]`), `payment-cycle-hold-anomaly`,
  `payment-cycle-mark-fixed`, `payment-cycle-hold-open`, `payment-cycle-hold-reason`, `payment-cycle-hold-line`,
  `payment-cycle-held` (rows `[data-held-pair-id]`), `payment-cycle-release`, `payment-cycle-approve`,
  `payables-run-approved`, `payment-cycle-send`, `payment-cycle-stale`, `payment-cycle-reclose`,
  `payment-cycle-rolled`, `payment-cycle-no-bank`, `payables-runs` (rows `tr[data-run-id][data-run-status]`); kept:
  `billing-payables-run` (the Run payables in Xero row only), `billing-run-payables-in-xero`, `billing-payables-result`,
  `billing-open-ledger`; gone: `billing-payables-due`. Run detail: `payables-run-detail`, `payables-run-snapshot`,
  `payables-run-remittance-link`, `payables-run-held`, `payment-schedule`, `payment-schedule-print`. Remittance advice:
  `remittance-advice`, `remittance-week`, `remittance-netted` (`data-negative-invoice`), `remittance-net`,
  `remittance-still-to-net`, `remittance-print`, `remittance-xero`. Admin invoice: `payment-week` (spans
  `[data-run-id]`). Anaesthetist ledger: `ledger-payment-runs`, `ledger-still-to-net`. Web Accounts:
  `web-remittances` (rows `tr[data-run-id]`, `data-testid=remittance-row-<runId>`), `web-remittance-sheet`,
  `web-remittance-advice`, `web-still-to-net`, `web-payment-week`, `web-payment-held-out`. Demo action rows
  `demo-action-stage-payment-week`, `demo-action-stage-bank-mismatch`.
- Prepayment letter, cancellation and differences by hand (catch-up Phase 41; US-06.3.6, US-06.3.7, US-06.4.1,
  US-06.5.2 to US-06.5.4). Master data: `letter-templates` (rows `tr[data-letter-template]`), `letter-template-new`,
  `letter-template-editor`, `letter-merge-chips`, `letter-template-preview`. Invoices strip: `prepayment-letter-picker`
  with `prepayment-letter-template`, `prepayment-letter-recipient`, `prepayment-letter-preview-toggle`,
  `prepayment-letter-preview`, `prepayment-letter-refusal`, `prepayment-letter-send`. Invoice document:
  `prepayment-letter` (the cover section), rail `invoice-letter-line`, `invoice-reminder-line`. Prepayment panel (all
  three apps): `prepayment-reminder` (office), `prepayment-reminder-sent`, `prepayment-letter-by-office`
  (anaesthetist), `prepayment-settled` with `prepayment-settled-invoice` (`data-credit-note`, `data-cause`),
  `prepayment-settled-credit-link` (Admin) and `prepayment-settled-refund` (`data-refund-cause`); reminder dialog
  `prepayment-reminder-dialog` (`prepayment-reminder-template`, `-recipient`, `-no-address`, `-preview-toggle`,
  `-preview`, `-refusal`, `-send`). Admin Day rail: `rail-prepayment-reminded`. Settlement block under a prepaid
  Procedure: `prepaid-settlement` (`data-prepayment-status`), `prepaid-settlement-amount`, `prepaid-settlement-invoice`,
  `prepaid-settlement-btm`, `prepaid-settlement-transfer`, `prepaid-settlement-credit`
  (`prepaid-settlement-credit-number`), `prepaid-settlement-additional` (`prepaid-settlement-additional-number`),
  `prepaid-settlement-nothing-automatic`, `prepaid-settlement-actions` (`data-variant=office|anaesthetist`). Credit
  form: `prepayment-credit`. Cancel sheet: `cancel-prepayment` (notices `data-invoice-id`, `data-received`). Contract
  rail: `prepaid-contract-change`. Billing monitor: `holding-entry` gains `data-entry-kind=credited|refunded`. Xero
  sim: `xero-prepayment-refund`, `xero-prepayment-refund-row`. Moves: `move-booking-honour` (`data-audience`, now
  also in Admin Day's Move dialog), `reassign-list-honour`. Admin Booking: `prepayment-moved`,
  `prepayment-moved-invoice`, `patient-emailed`, `patient-email-open`, the dialog `patient-email` (`-template`,
  `-recipient`, `-no-address`, `-preview`, `-provisional`, `-refusal`, `-send`), `rebook-open-row`, `rebook-open`,
  the dialog `rebook-dialog` (`rebook-anaesthetist`, `rebook-lists`, `rebook-list`, `rebook-no-lists`,
  `rebook-not-preferred`, `rebook-price`, `rebook-refusal`, `rebook-submit`), `prepayment-history` (rows
  `prepayment-history-row`, `data-booking-id`, `data-state=refunded|credited|current`). Demo action rows
  `demo-action-stage-longer-prepaid-procedure`, `demo-action-prepayment-late-payment`,
  `demo-action-prepayment-contract-changed`; PWA `pwa-demo-action-pwa-office-sends-prepayment-reminder`.
  `credit-note-unavailable` is gone.

**Other hooks**

- `[data-aa-mobile-product]`
- `.aa-invoice-doc`
- `[data-sliding-segmented-control]`
- `[data-validation-focus=true]`

## Demo control panel (`/demo/control`) and Demo actions

- Catch-up Phase 43b (support). Four bar entries and one PWA entry, screen heading "All apps · Help", on every
  `/admin`, `/web` and `/mobile` route but **shown only while the support panel is open**, so the `trigger` step comes
  after the click on `nav-help` (the harness bar sits above the SidePanel's scrim, so it works over the open panel).
  `support-advance-ticket` ("Advance ticket", either tab) moves the newest open request on the open tab one step,
  Logged to Responded to Closed: "<id> <subject>: now Responded." (or Closed); disabled "No open request" or
  "<id> waits for AA's approval of the call-out". `support-raise-out-of-hours` ("Raise out of hours", Help line tab;
  choices `other` "Ordinary request" (default), `securityBreach`, `platformOffline`) moves the clock forward to 7:00pm
  on the next weekday and raises a sample P3 help-line request as `TK0006`; its result line says whether it is answered
  out of hours (a breach or outage is logged as P1 with a respond-by within the hour) or picked up at the next opening.
  `support-raise-public-holiday` ("Raise ticket on a public holiday", Product support tab) jumps the clock to 10:00am on
  the next national public holiday (Labour Day, Mon 26 Oct 2026, from Reset) and raises a P2 incident that waits for
  AA's approval: "Clock now 10:00am, Labour Day. TK0006 logged: the call-out waits for AA's approval."; the cover note
  reads `data-cover=publicHoliday`. `support-approve-call-out` ("AA approves call-out", Product support tab, office
  stand-in badge) approves the newest waiting call-out; disabled "No call-out awaiting approval". The PWA-only
  `support-help-line-responds` ("Help line responds to this request") shows on the Demo sheet only while the Help sheet
  is open on More; it advances Dr Souter's newest open help-line request. Index path `/admin` ("Open Help first ...").
- Catch-up Phase 41 (prepayment settled automatically, differences by hand). Three bar entries and one PWA entry, none
  with a choice to pass. `stage-longer-prepaid-procedure` ("Stage longer prepaid procedure", screen "Admin · Review",
  only on `/admin/review/:listId`, the List SUBMITTED; its choices are the List's Bookings with a sent prepayment, the
  first by default) lengthens the prepaid Procedure to 240 minutes as the office: "Recorded BTM now N units, for
  reference only. Authorise bills nothing more ..."; disabled "Submit this List first", "No sent prepayment on this
  List" or "Already staged". Index path `/admin/review/L-34821-2026-07-24-PM` ("Submit Dr Souter's Fri 24 Jul PM List
  first."). `prepayment-late-payment` ("Payment arrives after the credit note", Admin Booking detail) pays the total of
  a prepayment invoice the cancellation credited unpaid through the simulated bank feed, and the system refunds it at
  once: "Late payment of $1,380.00 refunded to the payer."; disabled "Only on a cancelled booking with a credited,
  unpaid prepayment" (approve and send Riley, cancel her, then run it on `/admin/day/2026-07-24/bookings/BK0034`).
  `prepayment-contract-changed` ("Change Contract after prepayment sent", Admin Booking detail) moves the Booking's
  first prepaid Procedure onto the first Contract that is not prepaid (insurers' first) as the office: "The office
  moved the procedure to <Contract>. Prepayment invoice credited as CN-2026-0001, and anything paid refunded from the
  AA Holding account."; disabled "No sent prepayment on this booking" or "This List is authorised"; runs once per
  Booking (Nair's `BK0038` works from reset). The PWA-only `pwa-office-sends-prepayment-reminder` ("Office sends a
  prepayment reminder", office stand-in badge, a mobile Booking) sends the reminder as the office: "Reminder sent by
  the AA office"; disabled "No unpaid prepayment on this booking" (so run `pwa-office-approves-prepayment` on Riley
  first) or "No invoice email for the payer". `pwa-office-approves-prepayment` now sends the default letter. The
  letter, the reminder, cancelling, the Contract rail, the patient email and the rebook are product controls (real
  clicks), never triggers.

- Catch-up Phase 39a (the weekly payment cycle). Two bar entries on `/admin/billing`, screen "Admin · Billing monitor":
  `stage-payment-week` ("Stage a payment week", choices `bctis` "19 BCTIs", the default, and `withCredit` "19 BCTIs
  and a credit after payout") releases nineteen of Dr Sharma's invoices into this week's run, and with `withCredit`
  leaves a negative invoice to net (messages and figures under
  [Weekly payment runs](#weekly-payment-runs-and-remittance-catch-up-phase-39a)); disabled "Already staged for this
  week" once run, or "Xero is unavailable: restore it first". `stage-bank-mismatch` ("Stage a bank mismatch", no
  choice) removes the newest receipt of this week's draft from the bank download, so Close raises "Receipt not on the
  bank download": message "The bank download is missing the receipt for AA-2026-.... Close the week to see the
  anomaly."; disabled "Nothing received this week" until something is waiting, and "This week is already closed" after Close. Neither
  closes, approves, sends or pays: the recipe clicks `payment-cycle-close`, `payment-cycle-approve`,
  `payment-cycle-send` and `billing-run-payables-in-xero` itself, waiting for each. The PWA stand-in
  `pwa-office-runs-payables` is relabelled "Office runs this week's payment cycle": it closes, approves, sends and pays
  Week 30 for what was released to Dr Souter ("The office ran Week 30's payment cycle and the accountant paid it in
  Xero: $X to Dr Souter ..."); still disabled "Nothing due to pay out" at reset.

- Catch-up Phase 42 (Master data loads), both bar only on `/admin/masters`, run as the developer's seed-load actor:
  `load-sample-spreadsheet` ("Load sample spreadsheet") shows on Seed load (every sample sheet) and on a seeded view
  (that view's sheets: Hospitals & holidays offers hospitals.csv and hospital-holidays.csv, Contracts contracts.csv
  and price-ranges.csv, and so on). Its `choice` is the sample id (`sample-hospitals`, `sample-surgeons`,
  `sample-rvg-groups`, `sample-contracts`, ...; see [the Phase 42 seed notes](#public-holidays-retire-and-the-controlled-loads-catch-up-phase-42)),
  labelled by file name; with no choice it takes the first on offer. It stages and does not load: the sheet's
  `master-load-result` waits on Seed load with `data-load-status=staged`; press `master-load-commit` to load.
  Message "hospitals.csv checked: 2 rows valid, 4 rejected. Open Master data, Seed load, and press Load."; disabled
  "A load is already waiting for this sheet; load or discard it first". `go-live-data-load` ("Go-live data load
  (demo)", any Master data view) stages the go-live batch: message "Go-live load prepared: 14 Solutions Plus names
  (5 excluded as junk, 2 not approved) and 6 controlled spreadsheets. Open Master data, Go-live load."; the Go-live
  load sub-nav item gains a warn dot and every view the `load-banner`; disabled "A go-live load is already waiting;
  load or discard it first". Index paths `/admin/masters?view=seedLoad` and `/admin/masters?view=goLive`. No PWA
  entry.

- Catch-up Phase 39 (credit notes and the combined split). Two bar entries and one PWA entry. `stage-combined-procedure`
  ("Stage combined procedure", screen "Admin · Invoices", only on `/admin/invoices`, no choice) books, completes,
  authorises and bills the Merivale combination on Dr Delaney's Fri 10 Jul PM List; message "Staged: a billed Merivale
  combination. Open its invoice and use Split into additional invoices." with a link "Open AA-2026-0002" (right after a
  reset); disabled "Already staged" once run. `stage-refund-after-payout` ("Stage refund after payout", on
  `/admin/billing` and `/admin/invoices/<invoiceId>`, no choice) pays the invoice in full and pays the anaesthetist out
  through Xero's payables run; message "Paid in full and paid out to Dr Sharma in Xero. Credit it to see the negative invoice."
  (on the Billing monitor with a link "Open AA-..."); on the Billing monitor it targets Sarah Mitchell's invoice and is
  disabled "Stage post-op scenario first" before `stage-post-op`; elsewhere disabled "Already paid out", "Invoice
  credited", "Credit waiting for review", "Not handed off to Xero" or "AA fee and prepayment invoices are not credited
  here". The Billing monitor has ten entries: `billing-failure`, `arm-handoff-fault`, `xero-outage-start`,
  `xero-outage-restore`, `run-reconciliation-poll`, `run-archive-job`, `run-next-billing-run`, `stage-payment-week`,
  `stage-bank-mismatch` and `stage-refund-after-payout`. `run-next-billing-run` also issues approved credits: its message counts credit notes and
  invoices, numbers in brackets. The PWA-only `office-reviews-credit` ("Office reviews this credit", badged Office
  stand-in, a mobile Booking) approves the oldest credit awaiting review on the Booking with its new invoices and issues
  it in a run narrowed to it: "Approved by the office and issued in the next billing run (CN-2026-0001)."; disabled "No
  credit on this Booking is awaiting review".

- Catch-up Phase 37 (the Xero sync queue and the Xero-side payables run). Every call to Xero goes through the Xero
  sync queue (`billing-xero-queue` on the Billing monitor): a failed or outage-blocked call waits there, with its
  attempts and next try, and retries with increasing gaps on every clock change, or at once with "Retry now" on its
  row. `arm-handoff-fault` ("Arm handoff failure") makes the next Xero call fail once; it waits in the queue and lands
  on the next retry. "Trigger billing failure" (`billing-failure`) leaves Losa Tuilagi's hand-off **Waiting for Xero**
  in the queue (a queued failed attempt, `monitor-waiting-for-xero` on her Booking row) while Hemi Walker's bills; the
  fix is "Retry now" on its queue row (`[data-shot=billing-xero-queue] [data-queue-item] >> role=button[name="Retry now"]`,
  or `billing-xero-retry-<queue item id>`) or moving the clock on. There is no "Resolve & retry" any more, and the
  per-Booking "Retry" (`billing-retry-<bookingId>`) is only for billing-run exceptions, which no trigger stages.
  New entries, all bar only: `xero-outage-start` ("Simulate Xero outage") and `xero-outage-restore` ("Restore Xero",
  drains the queue in order with no duplicate pair, contact, receipt or disbursement) on `/admin/billing` and every
  Xero tab; on a Xero pair `xero-void-invoice` ("Void this invoice in Xero"), `xero-amend-invoice` ("Edit this
  invoice's total in Xero", $20.00 lower) and `xero-pay-bill` ("Pay anaesthetist in Xero (payables run)", choices
  `deliver` "Bill-paid webhook delivers" and `missed` "Webhook missed (the poll catches it)"; disabled "Nothing
  authorised to pay yet" until the receivable is paid in); `xero-bulk-remittance` ("Simulate bulk hospital
  remittance") on `/demo/xero/invoices` and `/demo/xero/bank`. `run-reconciliation-poll`'s message now reports what
  it found: "Reconciliation poll applied N missed payment(s), recorded N missed bill payment(s), flagged N invoice(s)
  changed directly in Xero." or "Reconciliation poll ran: nothing missed and nothing changed in Xero." (during an
  outage it waits in the queue). Payables are paid in Xero: the Billing monitor's "Run payables in Xero"
  (`billing-run-payables-in-xero`, Simulated Xero badge) is a product button, not a demo action, and the engine
  records each disbursement from the bill-paid webhook or the poll. The PWA stand-in `pwa-office-runs-payables` reads
  "Office runs this week's payment cycle" (since catch-up Phase 39a). `inject-unmatched-receipt` also runs on Admin Day (it puts the
  Reconciliation card out of balance).

- Catch-up Phase 36: "Inject unmatched receipt" (`inject-unmatched-receipt`, bar only) on the Ledger, with
  choices `souter` ("Names Dr Souter", the default) and `none` ("Names no one"); pass one with the `trigger`
  step's `"choice"`. Disabled "Resolve the held receipt first" while one is held. `payment-full`,
  `payment-half`, `payment-replay`, `arm-handoff-fault` and `run-archive-job` are also on the Ledger routes; there
  the payment entries' choices are the open receivables with a Xero ACCREC ("AA-2026-0002 · payer · $x"),
  defaulting to the first, and are disabled "No open invoice in Xero" when none is open. `arm-handoff-fault`
  means the next authorise still makes every pair; since catch-up Phase 37 the failed hand-off waits in the Xero
  sync queue (see above). The PWA-only `pwa-office-runs-payables` ("Office runs this week's payment cycle" since Phase 39a,
  office stand-in) on Mobile Balances pays out what is due to Dr Souter (disabled "Nothing due to pay out", as it is
  at reset). There is no "Run payables" demo action: "Run payables in Xero" is the Billing monitor's own button.

- Catch-up Phase 27a: no new demo action. The Payables run has nothing due at reset (Nair's seeded prepayment is
  held in the AA Holding account, never in the run); it is due only once her List is authorised and the transfer
  is written. `payment-full` and `payment-half` are unchanged.
- Catch-up Phase 20: the PWA-only "Office sets this Booking's Contract"
  (`[data-shot=pwa-demo-action-office-sets-booking-contract]`) on a mobile Booking with a Procedure that
  needs an invoice destination sets the List's hospital's first Contract on offer, else No contract ·
  RVG, as the office. A Booking created from a hospital row arrives with no Contract.

Since catch-up Phase 14 every demo action lives **on its own screen**, in the harness bar's
"Demo actions" menu (`[data-shot=demo-actions]`, shown only where the screen registers entries),
and in the installed PWA's "Demo" sheet. The registry is
`aa-prototype/src/shared/demoTriggers/registry.ts`. Stage them with the `trigger` step after a
`goto` to their screen; never click the Control Panel for one.

**The Control Panel is the index.** It keeps:

- Clock buttons: "+15 min", "+1 hour", "Next day", "Next morning", "+7 days" and "Procedure day
  · 28 Jul".
- "Reset demo data", then "Confirm reset".
- "Scenario jumps · S1 to S5" (the `scenario` step), each followed after its jump by its beats, one link per beat.
- "Demo actions by screen" (`[data-shot=control-demo-index]`): each entry's row
  (`[data-shot=index-<id>]`) with an "Open screen" button.

**Scenario jumps** (`aa-prototype/src/apps/demo/demoScenarios.ts`, `DEMO_SCENARIOS`). Use the `{ "scenario": "Sn" }`
step: it opens `/demo/control`, clicks `scenario-sn`, then `scenario-confirm`. Every jump resets to the pristine seed
first (the framed reset: the sign-in session forgotten), then stages only what its
scenario cannot reach from there, through the product's own guarded store actions. The same jump always gives the
same data.

Hooks on `/demo/control`: each scenario's block `[data-scenario=S1]` to `[data-scenario=S5]`; its Jump button
`scenario-s1` to `scenario-s5`; the confirm button `scenario-confirm` ("Confirm jump", beside Cancel); after the jump
the result notice `scenario-result` (the staging message, `role=status`); inside it, on a successful jump, the beats
list `scenario-beats`, one link button per beat `scenario-beat-<n>` (1-based, run-sheet order, labelled "Beat n ·
<screen>"; disabled while its target does not exist yet, and the label says what it waits for) and beside it the
beat's steps `scenario-beat-<n>-steps`. A beat link reads its path from the store when clicked, so after a live
action (an import, an authorise) it lands on what that action made.

| Scenario | What the jump stages | Story (its beats) |
|---|---|---|
| S1 · Booking to theatre | Reset only: "Reset to the pristine seed; nothing staged." | Seven beats: Mobile sign-in (`/mobile/more`); Admin Intake, Matching (`/admin/intake/matching`): Import hospital file (St George's, `SAMPLE_STG`), then Create Booking on Sarah Mitchell's row (R1, her text `lap appy ?conv to open`); Admin Day: open her Booking from Needs an invoice destination and set its Contract on the step rail (it arrives with none; No contract · RVG is the usual answer); her Admin Booking (the wording as received and each description); the Mobile List Tue 28 Jul AM (`L-34821-2026-07-28-AM`) after "Procedure day · 28 Jul"; her Mobile Booking (capture, Mark complete, submit); Mobile search `/mobile/lists?q=Mitchell`. Beats 4 and 6 are disabled until her Booking exists. No hospital message: S1 never fires `fire-hospital-message`, which since catch-up Phase 34 is only on the Future scope pages. On the PWA, `matching-office-matches-row` (choice "St George's file, Tue 28 Jul AM (S1)") plays the import and match. |
| S2 · Office day | Reset only. | Eight beats, mostly Admin: Admin Day; its to-do list (`raise-sample-warnings`); Recurring bookings (`stage-recurring-clash`, then assign the Draft List); Conflicts (`simulate-sickness`); Mobile Lists (return a List to the office; on Admin Day `colleague-moves-list-to-office`); Lachlan Robinson's Mobile Booking on Souter Wed 22 Jul AM (Move to a colleague); Admin Notifications; Admin Review of Dr Morrison's Mon 20 Jul List (`/admin/review/L-25490-2026-07-20-AM`, Authorise for billing). |
| S3 · Money end to end | Reset, then checks that Dr Souter's Mon 20 Jul AM and PM Lists (`L-34821-2026-07-20-AM`, `-PM`) are both SUBMITTED in the Review queue; the jump fails with a warning if not. Nothing else is staged. | Seven beats: authorise the AM List, then the PM List, on `/admin/review/...` (AM first keeps AA-2026-0002 to 0004 on Holt's; see the Phase 22 seed notes); the $0 no-charge Booking's Review (Mon 13 Jul); the Xero pair of AA-2026-0005 (nib's $152.38 share of the fee-split Booking; disabled until authorised); the Billing monitor (payment in, payout); the weekly payment run (`stage-payment-week`); AA fee invoices (`seed-month-of-bctis`, Run monthly fee invoices); the Ledger (`inject-unmatched-receipt`). Billing emails every invoice. |
| S4 · Exceptions | Reset only. | Eight beats: Riley's prepayment on her Admin Booking (`BK0034`, Dr Souter's Fri 24 Jul AM, prepaid Rhinoplasty $1,200.00: Approve, Approve and send, `payment-half`); the Fri 24 Jul PM List's Review once Dr Souter submits it (Nair's transfer; disabled until submitted); Nair's Admin Booking (`BK0038`, Cancel booking); Dr Sharma's Tue 14 Jul AM Review (`stage-post-op`); Sarah Mitchell's Admin Booking there once authorised (Create additional invoice, `run-next-billing-run`); the Billing monitor (`billing-failure`, Retry now); her invoice (`stage-refund-after-payout`, Credit in full and rebill); Admin Day (`prepayment-two-days-before`). |
| S5 · Compliance tour | Reset, then on David Chen's Booking (`overriddenTimeUnitsBooking`, `BK0008`): Dr Souter claims the RVG modifier AS3 (ASA III, with its explanation), Kirsty W. saves his note and a time 15 minutes later as one change set, and Dr Souter removes AS3, so his fee ends where it started; then authorises Dr Whitaker's Fri 17 Jul List (`L-36208-2026-07-17-AM`), which locks each Procedure's pricing and raises its invoices, so `INV0002` is AA-2026-0002 (Hemi Walker's). | Five beats: David Chen's Admin Booking History (View as at on Kirsty W.'s save); Patients, Waiting for NHI (`receive-no-nhi-list`, `nhi-hub-mode`); the Data inspector (`scan-nhi-leaks`); Master data, Contracts (Health NZ agreed rate, its History); Hemi Walker's invoice `/admin/invoices/INV0002` (`regenerate-invoice` after a unit-value edit). |

**Demo actions by screen** (generated from `aa-prototype/src/shared/demoTriggers/registry.ts`, 88 entries: 55 bar
only, 24 PWA only, 9 both; badges Future scope 3, Office stand-in 19, Colleague stand-in 3). Grouped and ordered as
the Control Panel index (`groupTriggersByScreen`): an entry with `alsoScreens` is listed under each of its headings.
"Bar" entries run with the `trigger` step on :5173 after a `goto` to a matching route; "PWA" entries are in the
handset's Demo sheet only, so a `trigger` step for them works only in a mobile shot (:5174). An entry with a `when`
gate shows on a matching route only when its condition holds (see the notes below).

| Screen (index heading) | id | Label | Shows in | Badge | Routes (`matchPath`) |
|---|---|---|---|---|---|
| Admin · Billing monitor | `billing-failure` | Trigger billing failure | Bar |  | `/admin/billing` |
|  | `arm-handoff-fault` | Arm handoff failure | Bar |  | `/admin/billing`, `/admin/ledger`, `/admin/ledger/anaesthetists/:anaesthetistId` |
|  | `xero-outage-start` | Simulate Xero outage | Bar |  | `/admin/billing`, `/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId`, `/demo/xero/bank` |
|  | `xero-outage-restore` | Restore Xero | Bar |  | `/admin/billing`, `/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId`, `/demo/xero/bank` |
|  | `run-reconciliation-poll` | Run reconciliation poll | Bar |  | `/admin/billing`, `/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId`, `/demo/xero/bank` |
|  | `run-archive-job` | Run archive job | Bar |  | `/admin/billing`, `/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId`, `/demo/xero/bank`, `/admin/ledger`, `/admin/ledger/anaesthetists/:anaesthetistId` |
|  | `run-next-billing-run` | Run the next billing run | Bar |  | `/admin/billing`, `/admin/review` |
|  | `stage-payment-week` | Stage a payment week | Bar |  | `/admin/billing` |
|  | `stage-bank-mismatch` | Stage a bank mismatch | Bar |  | `/admin/billing` |
|  | `stage-refund-after-payout` | Stage refund after payout (also listed under Admin · Invoice) | Bar |  | `/admin/billing`, `/admin/invoices/:invoiceId` |
| Admin · Ledger | `inject-unmatched-receipt` | Inject unmatched receipt | Bar |  | `/admin/ledger`, `/admin/ledger/anaesthetists/:anaesthetistId`, `/admin/day/:dateISO` |
| Admin · Audit | `simulate-sign-in` | Simulate sign-in attempts | Bar |  | `/admin/audit` |
| Admin · Booking detail | `hospital-description-arrives` | Hospital description arrives | Bar |  | `/admin/day/:dateISO/bookings/:bookingId` |
|  | `prepayment-late-payment` | Payment arrives after the credit note | Bar |  | `/admin/day/:dateISO/bookings/:bookingId` |
|  | `prepayment-contract-changed` | Change Contract after prepayment sent | Bar |  | `/admin/day/:dateISO/bookings/:bookingId` |
| Admin · Review and Booking detail; Mobile and Web · Lists and Booking | `stage-post-op` | Stage post-op scenario | Bar and PWA |  | `/admin/review/:listId`, `/admin/day/:dateISO/bookings/:bookingId`, `/mobile/lists`, `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId`, `/web/lists`, `/web/lists/:listId`, `/web/lists/:listId/bookings/:bookingId` |
| Admin · Invoices | `stage-combined-procedure` | Stage combined procedure | Bar |  | `/admin/invoices` |
| Admin · Intake | `pdf-list-resend` | Receive updated PDF from rooms | Bar |  | `/admin/intake/pdfs` |
|  | `matching-receive-theatre-list` | Import hospital file | Bar |  | `/admin/intake/matching` |
|  | `matching-send-update` | Send update for a matched Booking | Bar |  | `/admin/intake/matching` |
| Admin · Invoice | `regenerate-invoice` | Regenerate from locked data | Bar |  | `/admin/invoices/:invoiceId` |
|  | `stage-refund-after-payout` | Stage refund after payout | Bar |  | see Admin · Billing monitor |
| Admin · Invoice and Booking detail | `payment-full` | Payment received · full | Bar |  | `/admin/invoices/:invoiceId`, `/demo/xero/invoices/:accRecId`, `/admin/day/:dateISO/bookings/:bookingId`, `/admin/ledger`, `/admin/ledger/anaesthetists/:anaesthetistId` |
|  | `payment-half` | Payment received · half | Bar |  | `/admin/invoices/:invoiceId`, `/demo/xero/invoices/:accRecId`, `/admin/day/:dateISO/bookings/:bookingId`, `/admin/ledger`, `/admin/ledger/anaesthetists/:anaesthetistId` |
|  | `payment-replay` | Replay last payment event | Bar |  | `/admin/invoices/:invoiceId`, `/demo/xero/invoices/:accRecId`, `/admin/day/:dateISO/bookings/:bookingId`, `/admin/ledger`, `/admin/ledger/anaesthetists/:anaesthetistId` |
| Admin · AA fee invoices | `run-scheduled-fee-run` | Run scheduled month-end fee run | Bar |  | `/admin/billing/aa-fees` |
|  | `seed-month-of-bctis` | Seed a month of BCTIs | Bar |  | `/admin/billing/aa-fees` |
| Xero simulation · AA fee pair | `record-fee-payment` | Record fee payment | Bar |  | `/demo/xero/invoices/:accRecId` |
| Xero simulation · pair | `xero-amend-invoice` | Edit this invoice's total in Xero | Bar |  | `/demo/xero/invoices/:accRecId` |
|  | `xero-void-invoice` | Void this invoice in Xero | Bar |  | `/demo/xero/invoices/:accRecId` |
|  | `xero-pay-bill` | Pay anaesthetist in Xero (payables run) | Bar |  | `/demo/xero/invoices/:accRecId` |
| Xero simulation · invoices | `xero-bulk-remittance` | Simulate bulk hospital remittance | Bar |  | `/demo/xero/invoices`, `/demo/xero/bank` |
| Mobile · List | `office-authorises-list` | Office authorises this List | PWA | Office stand-in | `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId` |
|  | `photo-capture-future` | Photo capture (Future scope) | Bar and PWA | Future scope | `/mobile/lists/:listId` |
|  | `pwa-office-adds-nhi` | Office adds the NHI (also listed under Mobile · Booking) | PWA | Office stand-in | `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId` |
| Mobile · Booking | `office-reviews-additional-invoice` | Office reviews this event | PWA | Office stand-in | `/mobile/lists/:listId/bookings/:bookingId` |
|  | `office-reviews-credit` | Office reviews this credit | PWA | Office stand-in | `/mobile/lists/:listId/bookings/:bookingId` |
|  | `office-approves-contract-change` | Office approves this Contract change | PWA | Office stand-in | `/mobile/lists/:listId/bookings/:bookingId` |
|  | `pwa-office-approves-prepayment` | Office approves and sends the prepayment invoice | PWA | Office stand-in | `/mobile/lists/:listId/bookings/:bookingId` |
|  | `pwa-office-sends-prepayment-reminder` | Office sends a prepayment reminder | PWA | Office stand-in | `/mobile/lists/:listId/bookings/:bookingId` |
|  | `office-clears-warning` | Office clears this warning | PWA | Office stand-in | `/mobile/lists/:listId/bookings/:bookingId` |
|  | `office-sets-booking-contract` | Office sets this Booking's Contract | PWA | Office stand-in | `/mobile/lists/:listId/bookings/:bookingId` |
|  | `pwa-office-adds-nhi` | Office adds the NHI | PWA | Office stand-in | see Mobile · List |
| Mobile · Lists | `office-assigns-next-free` | Office assigns a List to my next free session | PWA | Office stand-in | `/mobile/lists` |
|  | `office-adds-out-of-hours-list` | The office adds an out-of-hours List for me tonight | PWA | Office stand-in | `/mobile/lists` |
|  | `office-assigns-draft-list` | Office assigns a Draft List to me | PWA | Office stand-in | `/mobile/lists` |
|  | `colleague-moves-booking-to-me` | Colleague moves a Booking to me | PWA | Colleague stand-in | `/mobile/lists`, `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId` |
| Mobile · My calendar, the day last opened | `availability-office-sets-public` | Office sets this session to Public | PWA | Office stand-in | `/mobile/availability/calendar` |
| Admin · Day view and Conflicts | `simulate-sickness` | Simulate sickness | Bar |  | `/admin/day/:dateISO`, `/admin/conflicts` |
| Admin · Assign Draft List and Reassign pickers | `ask-colleague-make-available` | Ask a colleague to make their session available | Bar | Colleague stand-in | `/admin/day/:dateISO`, `/admin/draft-lists`, `/admin/conflicts` |
| Mobile · List and Booking | `office-resolves-alert` | Office resolves this alert | PWA | Office stand-in | `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId` |
| Admin · Day view and Notifications | `colleague-moves-list-to-office` | Colleague moves a List to the office | Bar |  | `/admin/day/:dateISO`, `/admin/notifications` |
| Mobile · Availability | `colleague-moves-list-to-me` | Colleague moves a List into my free session | PWA | Colleague stand-in | `/mobile/availability` |
| Admin · Day view | `colleague-hands-booking-to-souter` | Colleague hands a Booking to Dr Souter | Bar |  | `/admin/day/:dateISO` |
|  | `add-draft-list-for-day` | Add Draft List for this day | Bar |  | `/admin/day/:dateISO` |
| Admin · Draft Lists | `simulate-incoming-request` | Simulate incoming request | Bar |  | `/admin/draft-lists` |
| Admin · Master data, Contracts | `demo-backdated-range` | Demo: add a backdated price range | Bar |  | `/admin/masters` |
| Admin · Master data, Recurring bookings | `stage-recurring-clash` | Stage recurring clash | Bar |  | `/admin/masters` |
| Admin · Master data | `load-sample-spreadsheet` | Load sample spreadsheet | Bar |  | `/admin/masters` |
|  | `go-live-data-load` | Go-live data load (demo) | Bar |  | `/admin/masters` |
| Admin · Review | `stage-longer-prepaid-procedure` | Stage longer prepaid procedure | Bar |  | `/admin/review/:listId` |
| Admin · Day and Booking detail, Mobile · Booking | `prepayment-two-days-before` | Move to 2 days before procedure | Bar and PWA |  | `/admin/day/:dateISO`, `/admin/day/:dateISO/bookings/:bookingId`, `/mobile/lists/:listId/bookings/:bookingId` |
|  | `raise-sample-warnings` | Raise sample warnings | Bar and PWA |  | `/admin/day/:dateISO`, `/admin/day/:dateISO/bookings/:bookingId`, `/mobile/lists/:listId/bookings/:bookingId` |
|  | `clear-sample-warnings` | Clear sample warnings | Bar and PWA |  | `/admin/day/:dateISO`, `/admin/day/:dateISO/bookings/:bookingId`, `/mobile/lists/:listId/bookings/:bookingId` |
| Admin · Day and Booking detail | `add-prepaid-booking` | Add prepaid Booking | Bar |  | `/admin/day/:dateISO`, `/admin/day/:dateISO/bookings/:bookingId` |
| Mobile · Lists and the Booking screen | `matching-office-matches-row` | Hospital file imported and my booking matched | PWA | Office stand-in | `/mobile/lists`, `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId` |
| Mobile · List detail | `stub-office-adds-nhi` | Office adds the NHI to this stub | PWA | Office stand-in | `/mobile/lists/:listId` |
| Admin · Patients · Waiting for NHI | `receive-no-nhi-list` | Receive list with a missing NHI | Bar |  | `/admin/patients/waiting` |
| Future scope: HL7 and FHIR | `fire-hospital-message` | Fire hospital message | Bar | Future scope | `/demo/integrations`, `/demo/integrations/log`, `/demo/integrations/mapping` |
|  | `replay-hospital-message` | Replay last message (dedupe) | Bar | Future scope | `/demo/integrations`, `/demo/integrations/log`, `/demo/integrations/mapping` |
| Mobile · Balances | `pwa-office-runs-payables` | Office runs this week's payment cycle | PWA | Office stand-in | `/mobile/balances` |
| Mobile · Balances and Booking | `pwa-payment-full` | Payment received · full | PWA |  | `/mobile/balances`, `/mobile/lists/:listId/bookings/:bookingId` |
|  | `pwa-payment-half` | Payment received · half | PWA |  | `/mobile/balances`, `/mobile/lists/:listId/bookings/:bookingId` |
| Web · Dashboard and Accounts | `web-payment-full` | Payment received · full | Bar |  | `/web`, `/web/accounts/:subTab` |
|  | `web-payment-half` | Payment received · half | Bar |  | `/web`, `/web/accounts/:subTab` |
| List and Booking detail | `load-multi-procedure-booking` | Load 3-procedure Booking (7 modifier units) | Bar and PWA |  | `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId`, `/web/lists/:listId`, `/web/lists/:listId/bookings/:bookingId`, `/admin/day/:dateISO/bookings/:bookingId` |
| Booking detail | `feed-changes-primary` | Hospital feed changes the primary | Bar and PWA |  | `/mobile/lists/:listId/bookings/:bookingId`, `/web/lists/:listId/bookings/:bookingId`, `/admin/day/:dateISO/bookings/:bookingId` |
| Admin · Day view and Booking detail | `switch-office-user` | Switch office user | Bar |  | `/admin/day/:dateISO`, `/admin/day/:dateISO/bookings/:bookingId` |
| Mobile · Booking detail | `office-edits-booking` | Office edits this Booking | PWA | Office stand-in | `/mobile/lists/:listId/bookings/:bookingId` |
| Admin · Day view and Invoices | `load-full-scale` | Load full-scale data | Bar |  | `/admin/day/:dateISO`, `/admin/invoices`, `/admin/invoices/:invoiceId` |
| Demo · Data inspector | `scan-nhi-leaks` | Scan for NHI leaks | Bar |  | `/demo/data` |
| Admin · Intake, Matching | `matching-raw-row-other-role` | View raw row as another role | Bar |  | `/admin/intake/matching` |
| Add booking, and Admin · Patients | `nhi-hub-mode` | Hub: Available / Slow / Unavailable | Bar and PWA |  | `/mobile/lists`, `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId`, `/web/lists/:listId`, `/admin/day/:dateISO`, `/admin/draft-lists`, `/admin/patients`, `/admin/patients/waiting`, `/admin/patients/:nhi` |
| Mobile · any screen | `pwa-sign-out` | Sign out | PWA |  | `/mobile`, `/mobile/*` |
|  | `support-help-line-responds` | Help line responds to this request | PWA |  | `/mobile`, `/mobile/*` |
| All apps · Help | `support-advance-ticket` | Advance ticket | Bar |  | `/mobile`, `/mobile/*`, `/web`, `/web/*`, `/admin`, `/admin/*` |
|  | `support-raise-out-of-hours` | Raise out of hours | Bar |  | `/mobile`, `/mobile/*`, `/web`, `/web/*`, `/admin`, `/admin/*` |
|  | `support-raise-public-holiday` | Raise ticket on a public holiday | Bar |  | `/mobile`, `/mobile/*`, `/web`, `/web/*`, `/admin`, `/admin/*` |
|  | `support-approve-call-out` | AA approves call-out | Bar | Office stand-in | `/mobile`, `/mobile/*`, `/web`, `/web/*`, `/admin`, `/admin/*` |

**Recipe notes by trigger** (what each does, its choices, disabled reasons and the pattern a recipe follows)

| Screen (`goto`) | ids | Notes |
|---|---|---|
| `/admin/billing` (search params allowed, e.g. `?list=` or `?problems=1`) | `billing-failure`, `arm-handoff-fault`, `xero-outage-start`, `xero-outage-restore`, `run-reconciliation-poll`, `run-archive-job` | "Trigger billing failure" (re-based in catch-up Phase 25, re-pointed in 37) arms a Xero hand-off fault for Losa Tuilagi's Booking (BK0039) alone and authorises Dr Ropata's Thu 16 Jul AM List (`L-39560-2026-07-16-AM`). Each Booking bills from its locked record: her row (`[data-shot=billing-pipeline-L-39560-2026-07-16-AM] tr[data-booking-id=BK0039]`) shows the "Waiting for Xero" pill and `monitor-waiting-for-xero` ("Waiting for Xero · attempt 1 · next try HH:mm. The invoice and its ledger pair stand; the Xero sync queue retries it."), and the Xero sync queue `billing-xero-queue` holds its row with "Retry now", which hands her off once; Hemi Walker's (BK0040) bills; the List is not failed (it shows under Problems only). No Contract changes. Disabled "Already triggered" once the List is AUTHORISED. A run failure (none staged by this trigger) shows "Retry" (`billing-retry-<bookingId>`) and `monitor-retry-note`. The outage pair: "Simulate Xero outage" makes every new hand-off, payment sync, disbursement sync and the poll wait in the queue (the Xero line reads "Xero unavailable since ..."); "Restore Xero" drains it in order. "Run payables in Xero" is the screen's own product button, `[data-shot=billing-run-payables-in-xero]` in `billing-payables-run`, not a demo action |
| `/admin/billing` (catch-up Phase 39a) | `stage-payment-week` (choice `bctis` or `withCredit`), `stage-bank-mismatch` | Bar only. Stage the week, then (for the anomaly) the mismatch, then click the cycle's buttons by hook: `payment-cycle-close`, `payment-cycle-approve`, `payment-cycle-send`, `billing-run-payables-in-xero`. US-10.2.5 to US-10.2.7 show the pattern; a recipe that pays out something released another way (FT-10.2, US-09.2.4, US-10.1.2) clicks the same four |
| `/admin/invoices/<invoiceId>` | `regenerate-invoice` | Catch-up Phase 25, "Regenerate from locked data". Rebuilds the invoice on screen from its Booking's lock and compares it with the invoice as stored, read-only: the result shows under the Locked record card as `[data-shot=invoice-regenerated]`, `data-identical="true"` with "Regenerated from locked data: identical (n lines, total $x)", or the differences. Disabled on prepayment and AA fee invoices and on an invoice with no lock. Stage an edit first (a Contract edit, a backdated range, a unit-value edit) to show it holds; US-08.4.4 shows the pattern (S3 AM authorise, a unit-value edit, open AA-2026-0002, trigger) |
| `/demo/xero`, `/demo/xero/invoices[/<accRecId>]`, `/demo/xero/bank` | `xero-outage-start`, `xero-outage-restore`, `run-reconciliation-poll`, `run-archive-job` | Catch-up Phase 37 adds the outage pair and `/demo/xero/bank`. While the outage is on, every tab shows `xero-outage-banner`. The poll's result line reports missed payments, missed bill payments and invoices changed directly in Xero |
| `/demo/xero/invoices/<accRecId>` (a procedure pair) | `xero-void-invoice`, `xero-amend-invoice`, `xero-pay-bill` (choice `deliver` or `missed`) | Catch-up Phase 37, bar only, acting as AA staff or Xero on the pair in the URL. Void: disabled once a payment is applied; the engine learns at the next poll, which flags it on the Billing monitor (`billing-xero-divergence`, "Voided in Xero" against "Receivable open"). Amend: the total $20.00 lower in Xero; the poll flags "Amended in Xero". Pay bill: Xero's payables run pays this pair's bill; `deliver` records the disbursement at once ("disbursement recorded HH:mm by webhook"), `missed` leaves the engine "not yet detected" until `run-reconciliation-poll` records it "by the poll", dated at the bill payment; disabled "Nothing authorised to pay yet" until the receivable is paid in (so not on the seeded history pairs `XRH..`, whose payments the demo cannot send: use AA-2026-0002 after the S3 AM authorise and `payment-full`, as US-09.2.4 does). Hidden on an AA fee pair |
| `/demo/xero/invoices`, `/demo/xero/bank` | `xero-bulk-remittance` | Catch-up Phase 37, bar only. St George's pays Dr Souter's aged `XRH01` and `XRH03` with one bank payment, matched by the add-on and learned by the engine by webhook, and a $980.00 line quoting AA-2026-H40 (meant for AA-2026-H04, `XRH04`) left unmatched on `/demo/xero/bank`. Disabled once run (those invoices are paid) |
| `/demo/xero/invoices/<accRecId>` of an AA fee pair | `record-fee-payment` | Only on a fee pair; the payment triggers below are hidden there |
| `/admin/billing/aa-fees` | `run-scheduled-fee-run`, `seed-month-of-bctis` | The scheduled run raises the month in the picker as the system actor; "Run monthly fee invoices" is the screen's own product button |
| `/admin/review/L-41267-2026-07-14-AM` or that List's Booking detail; `/web/lists`, `/web/lists/<listId>`, `/web/lists/<listId>/bookings/<id>`; `/mobile/lists[...]` (bar and the PWA Demo sheet) | `stage-post-op` ("Stage post-op scenario") | On Admin shown only for Dr Sharma's Tue 14 AM List; on the anaesthetist's Lists and Booking screens always. Two halves, each idempotent: 38b's authorises and bills Dr Sharma's List (no addendum Booking), leaving Sarah Mitchell's BK0032 invoiced and offering the additional invoice button; catch-up Phase 39b's stages Dr Souter's SUBMITTED ACL reconstruction for Coral Bennett on Wed 15 Jul PM at St George's (Mr T. Hale, `CT-STG-ACC`), a new runtime List and Booking, so it also adds a List to Admin Review's queue and a Booking to Dr Souter's Lists and search. Message: "Staged. Search Bennett, open Wednesday's Booking and use Add pre-op or post-op event. Sarah Mitchell's Tue 14 Jul List is authorised and billed for Create additional invoice." Disabled "Already staged: search Bennett and open Wednesday's Booking" once both are done. US-03.7.1 shows the pattern (`setup` on `/web/lists` or `/mobile/lists`, `start` `?q=Bennett`) |
| `/admin/billing`, `/admin/review` | `run-next-billing-run` | Catch-up Phase 38b: the explicit next billing run. It invoices every approved event once (each additional invoice on its own), after which `events-awaiting-run` on the Billing monitor disappears. The List run never sweeps events. Catch-up Phase 39b: authorising a List bills events approved before it as lines on the Procedure's invoice; this trigger then takes the rest, each a line on the same party's invoice in the run or an invoice of its own (`monitor-event-invoices`) |
| `/admin/billing`, `/admin/review` | `run-next-billing-run` (catch-up Phase 39) | Also issues every approved credit: the credit note, its negative invoice and the credit's new invoices together ("Billing run done: ... (CN-2026-0001, AA-2026-....)"). US-08.6.2 shows the pattern (Approve on `tr:has([data-shot=review-credit-row])` in the Events tab, then this trigger on `/admin/billing`) |
| `/admin/invoices` | `stage-combined-procedure` | Catch-up Phase 39, bar only, screen "Admin · Invoices". Stages the billed Merivale combination (Lorraine Petrie, Dr Delaney's Fri 10 Jul PM List); its result links "Open AA-2026-0002" after a reset. Disabled "Already staged". US-08.6.4 shows the pattern (trigger, then the row by patient) |
| `/admin/billing`, `/admin/invoices/<invoiceId>` | `stage-refund-after-payout` | Catch-up Phase 39, bar only, screen "Admin · Billing monitor". Pays the invoice in the URL (on the Billing monitor, Sarah Mitchell's after `stage-post-op`) in full and pays its anaesthetist out, so a following credit's negative invoice nets in the next payment run. US-08.6.2's `refund-after-payout` shows the pattern |
| `/mobile/lists/<listId>/bookings/<bookingId>` (PWA Demo sheet only) | `office-reviews-credit` | Catch-up Phase 39, badged Office stand-in, PWA only ("Office reviews this credit"). Approves the Booking's oldest credit awaiting review and issues it; on `HBK03` after Dr Souter's credit. US-08.6.5's mobile `issued` state shows the pattern. In the framed build use Approve in the Events tab and `run-next-billing-run` |
| `/admin/intake/pdfs` | `pdf-list-resend` ("Receive updated PDF from rooms", choice the sample id, `PDF-OKAFOR-0805`) | Catch-up Phase 34, bar only, no badge (screen "Admin · Intake"). The rooms re-send a PDF list already sent to matching: it lands in the inbox as received, marked Re-sent, from its new address. Disabled until that list has been sent. `ingest-pdf-row` is gone (no direct ingest: PDF rows go through Matching) |
| `/admin/invoices/<invoiceId>`, `/demo/xero/invoices/<accRecId>`, `/admin/day/<date>/bookings/<bookingId>` | `payment-full`, `payment-half`, `payment-replay` | Acts on the invoice in the URL; the payable authorises for exactly the amount received. On a Booking detail the choices are that Booking's sent prepayment ACCRECs, disabled "Not approved yet" before approval. After the S3 AM authorise, AA-2026-0002 is the first open invoice; Riley's prepayment invoice once approved on the strip is `XR0001` |
| `/admin/day/<date>` (choice = booking id), `/admin/day/<date>/bookings/<bookingId>` (acts on that Booking), `/mobile/lists/<listId>/bookings/<bookingId>` (PWA) | `prepayment-two-days-before` | Catch-up Phase 27: moves the demo clock to 2 days before the procedure, so the prepayment warning turns strong. On Admin Day use `"choice": "BK0034"`. Forward only; disabled "No outstanding pre-payments" or "Already 2 days or less before" |
| `/admin/day/<date>`, `/admin/day/<date>/bookings/<bookingId>` | `add-prepaid-booking` (choices `one-payer`, `two-payers`) | Catch-up Phase 27: as the office stand-in, adds Fiona Gray on Dr Souter's next ACTIVE List where her prepaid Contracts are offered. `two-payers`: Rhinoplasty $1,200.00 to the patient and Blepharoplasty, upper lids $900.00 to Ian Gray, so two strip rows. With approval off each is sent at once. Disabled "No ACTIVE List for Dr Souter" or "Already added (Reset to repeat)" |
| `/mobile/lists/<listId>/bookings/<bookingId>` (PWA Demo sheet only) | `pwa-office-approves-prepayment`, `pwa-payment-full`, `pwa-payment-half` | Catch-up Phase 27: the office approves and sends this Booking's first ready payer group; the patient pays half or all of its sent prepayment. Not in the framed build's bar |
| `/demo/integrations`, `/demo/integrations/log`, `/demo/integrations/mapping` | `fire-hospital-message` (choice: a message id), `replay-hospital-message` | Badged Future scope, **bar only**, screen "Future scope: HL7 and FHIR". Since catch-up Phase 34 only on these three routes (no longer on mobile, web or Admin Booking routes, nor Admin Integrations), and with no per-Booking default. It never applies anything: a message stages a row on `/admin/intake/matching` ("Sent ... to matching"), and the Booking changes only once the office decides the row there. To stage a row for an Admin shot, fire it in `setup` from `/demo/integrations`, then `start` on Matching (US-02.5.4). Replay dedupes: no second row |
| `/admin/patients/waiting` | `receive-no-nhi-list` ("Receive list with a missing NHI") | Catch-up Phase 40, bar only. Imports a Forte Health sheet with two rows and no NHI: Aroha Ngata (Thu 23 Jul PM, urgent, a new patient; type `ZQA3019`) and Losa Tuilagi (Mon 27 Jul, a returning patient; type `JKL1188`). Both wait here and on Matching; nothing is created until the NHI is added. Disabled "Already received". |
| `/web/lists/<listId>`, `/mobile/lists/<listId>`, `/admin/day/<date>`, `/admin/draft-lists`, `/admin/patients/<nhi>`, `/admin/patients/waiting` | `nhi-hub-mode` ("Hub: Available / Slow / Unavailable", choices `available`, `slow`, `unavailable`) | Catch-up Phase 40a, bar and PWA. Shown only while a lookup surface is open: Add a booking, the patient record's refresh panel or the Add NHI sheet, so open it first, then run `{ "trigger": "nhi-hub-mode", "choice": "unavailable" }` (on :5174 the choice is picked by its label, and "unavailable" matches "Unavailable"). Sets how the simulated Hub answers: Unavailable gives the warning with Retry, Slow a long wait with Stop waiting; the form shows `nhi-hub-mode-badge`. Disabled "Already set" for the current mode. It stays set until changed or Reset. Index path `/web/lists/L-34821-2026-07-21-PM` |
| `/mobile/lists/<listId>`, a Booking (PWA Demo sheet only) | `pwa-office-adds-nhi` ("Office adds the NHI") | Catch-up Phase 40, badged Office stand-in, PWA only. The hospital sends a booking with no NHI for this List (a stub), then the office adds the NHI and the Booking takes the stub's place. |
| `/admin/intake/matching` (was `/admin/matching`) | `matching-receive-theatre-list` (choice `stg` or `sx`), `matching-send-update` | Catch-up Phase 33, bar only. "Import hospital file" stages `SAMPLE_STG` or `SAMPLE_SX`'s rows as the hospital sending its theatre list (refused once staged). "Send update for a matched Booking" stages a later row for the Booking matched by the selected row, else Diane Foster's `BK0043` (a later time and the hospital's fuller wording), waiting for approval. Recipes usually stage rows through the product's own Import hospital file dialog instead (see Overlays) |
| `/mobile/lists[...]` (PWA Demo sheet) | `matching-office-matches-row` ("Hospital file imported and my booking matched" since catch-up Phase 34; choice by label: "St George's file, Tue 28 Jul AM (S1)", "A new hospital booking on this List", "A hospital update for this Booking, approved by the office") | Catch-up Phase 33, badged Office stand-in, PWA only. The S1 choice imports the St George's file and decides the confident rows for Tue 28 Jul AM (Sarah Mitchell created, No contract · RVG on her Procedures); refused "Nothing new from the hospital for your Lists" once done. The other choices: the hospital's row arrives and the office decides it with the suggestion, every difference ticked, no Contract picked. On Foster's `BK0043` the hospital's fuller wording replaces WLE MM (US-02.5.7's mobile shot). In the framed build use Admin, Matching |
| `/mobile/lists/<listId>` (PWA Demo sheet only) | `stub-office-adds-nhi` ("Office adds the NHI to this stub") | Catch-up Phase 33a, badged Office stand-in, PWA only. On a List holding a stub, the office adds the NHI its waiting row needs (Mere Tipene `ZQA1024` on `L-34821-2026-08-04-PM`; after the Southern Cross import, Tama Henare `ZQA1008` on `L-34821-2026-07-28-PM`) through the one resolve path, and the Booking takes the stub's place. Disabled on a List with no stub. No choice. |
| `/admin/day/<date>/bookings/<id>` | `hospital-description-arrives` (choice `ar35-row-2`, `-12`, `-20`, `-25`) | Catch-up Phase 20a, bar only, no badge. AR-35's illustrative hospital wording replaces the procedure text through `replaceProcedureText`; defaults to the row paired with the rooms' text (row 12 on Tane's `BK0006`). Disabled when the Booking already holds that text |
| `/mobile/lists/<listId>` | `photo-capture-future` | Badged Future scope. Opens the Add a booking sheet on the simulated photo of a paper card (sample cards) for the List in the URL; disabled unless the List is ACTIVE. Also in the PWA Demo sheet. A saved Booking reads "Added by anaesthetist" |
| `/admin/audit` | `simulate-sign-in` | Five simulated sign-in audit rows |
| `/admin/day/<date>`, `/admin/notifications` | `colleague-moves-list-to-office` (choice `one` or `busy`) | Catch-up Phase 32. A colleague returns one of their Lists to the office as themselves (the date in the URL, or the next with a candidate; vacated Unavailable): a Draft List and `NT0001`. `busy` stages eight moves from today, alternating returns and hand-ons, so the Notifications page has two pages (`NT0008` is a hand-on naming both). Bar only |
| `/admin/day/<date>` | `colleague-hands-booking-to-souter` | Catch-up Phase 32a. A colleague hands one of their Bookings into Dr Souter's free, empty session as a new List, with the office notice ticked (from a reset: Dr Hughes's `BK0140` into her Wed 22 PM; the date in the URL or the next with a candidate). Nothing sets anyone available. Bar only |
| `/admin/day/<date>`, `/admin/day/<date>/bookings/<bookingId>` | `switch-office-user` | Catch-up Phase 35, bar only, no choice. Swaps the Admin app's office user between Kirsty W. and Sam T. ("The office is now Sam T."), so two users' saves show named in one Booking's History (US-02.5.8 stages it after a first save). Disabled "Save or discard this Booking's changes first" while the Booking draft has unsaved changes. Not on other Admin screens |
| `/mobile/lists/<listId>/bookings/<bookingId>` (PWA Demo sheet only) | `office-edits-booking` | Catch-up Phase 35, badged Office stand-in, PWA only. Kirsty W. saves one change set on this Booking, its time 30 minutes later; the phone shows the office's save and History the grouped row. In the framed build make the change in Admin and save it |
| `/mobile/lists`, `/mobile/lists/<listId>`, `/mobile/lists/<listId>/bookings/<bookingId>` (PWA Demo sheet) | `colleague-moves-booking-to-me` (choice by its label, e.g. "Dr Hughes · Wed 22 Jul PM · Christchurch Eye Surgery") | Catch-up Phase 32a, badged "Colleague stand-in". A colleague hands her one Booking as a new List in a session she is free in; a session she is not available in (Fri 31 Jul AM, `BK0162`) is offered once she sets it available. PWA only |
| `/mobile/availability/calendar` (PWA Demo sheet, after a day has been opened and closed in My calendar: it acts on the last day opened) | `availability-office-sets-public` ("Office sets this session to Public", `[data-shot=pwa-demo-action-availability-office-sets-public]`) | Catch-up Phase 32d, PWA only (:5174). Acts on the AM or PM of the open day: the office sets that session to Public. |
| `/mobile/availability` (PWA Demo sheet) | `colleague-moves-list-to-me` | Catch-up Phase 32, badged "Colleague stand-in". A colleague hands a List into Dr Souter's free session (from the pristine seed, Morrison's Wed 22 PM Southern Cross into her Wed 22 PM); the Moved to you panel and Forward Lists' "New" follow. PWA only |
| `/admin/day/<date>`, `/admin/conflicts` | `simulate-sickness` (choice: `<listId>|office` or `<listId>|colleague`) | Catch-up Phase 30, re-pointed in 32b. The office records a phoned-in sickness on the chosen List's session (Unavailable, note "Unwell, short notice (phoned in, simulated)") and, in the same step, the List goes back to the Draft Lists or to the first open colleague in the office's order; never a conflict. Choices are the day in the URL (on Conflicts, today), Lists with Bookings first. Disabled "Already unavailable" on a closed session. Bar only |
| `/admin/day/<date>`, `/admin/draft-lists`, `/admin/conflicts` (only while an Assign or Reassign picker is open) | `ask-colleague-make-available` (choice: a closed session id) | Catch-up Phase 32b, badged Colleague stand-in. Plays the anaesthetist freeing their own closed, empty session (Free, as themselves), so the picker row becomes assignable. Shots use the inline copy on the row, `[data-candidate-closed=<reg>] [data-shot=demo-action-ask-colleague-make-available-inline]`, since the dialog's scrim covers the bar. |
| `/mobile/lists` (PWA Demo sheet) | `office-adds-out-of-hours-list` | Catch-up Phase 32c, badged Office stand-in, PWA only. Opens Dr Souter's out-of-hours session for tonight (18:00 to 21:00) and assigns a List at the hospital and with the surgeon of her latest List; disabled while one is open tonight. In the framed build use Open out-of-hours session on Admin Day instead. |
| `/mobile/lists/<listId>/bookings/<bookingId>` (PWA) | `office-approves-contract-change` | Catch-up Phase 21a, badged Office stand-in, PWA only ("Office approves this Contract change"). Approves the Contract the anaesthetist changed on the Booking, as Approve on Review would, so `contract-approval-status` turns from "Awaiting office approval" to "Approved by the office <time>". Disabled when the Booking has no pending change (true of every Souter Booking at reset: change a Contract on the Billing sheet first). In the framed build use Approve on Admin Review. |
| `/mobile/lists/<listId>`, `/mobile/lists/<listId>/bookings/<bookingId>` (PWA) | `office-resolves-alert` | Catch-up Phase 32b, badged Office stand-in, PWA only. Ticks the viewed List's or Booking's open alert resolved as the simulated office, so the handset shows "The office has dealt with this". Disabled with no open alert. |
| `/web/lists/<listId>`, `/web/lists/<listId>/bookings/<id>`, `/admin/day/<date>/bookings/<id>`, `/mobile/lists/<listId>[/bookings/<id>]` (bar and PWA) | `load-multi-procedure-booking` | Catch-up Phase 23, "Load 3-procedure Booking (7 modifier units)". Adds the three-procedure worked example (the same spec as the seeded BK0184) to Dr Souter's next open List, Wed 22 Jul AM (`L-34821-2026-07-22-AM`) on a fresh seed, as `BK0191` (BK0190 is the Phase 25a seeded `disabledContractBooking`; catch-up Phase 24's five seeded Bookings took BK0185 to BK0189; BK0185 is now the seeded `discountBooking`), not marked complete; result "Loaded on Dr Souter's ... List: 3 procedures, 7 modifier units, split 3 · 2 · 2." Disabled "Already loaded" on a second run. Open it at `/web/lists/L-34821-2026-07-22-AM/bookings/BK0191` or `/admin/day/2026-07-22/bookings/BK0191` |
| `/web/lists/<listId>/bookings/<id>`, `/admin/day/<date>/bookings/<id>`, `/mobile/lists/<listId>/bookings/<id>` (bar and PWA) | `feed-changes-primary` | Catch-up Phase 23, "Hospital feed changes the primary". Shown only on a Booking with two or more Procedures: the List's hospital feed makes the next Procedure the primary, audited as an integration; it moves to the top with the Primary pill and base units come from it ("... made ... the primary. Base units now come from it."). Disabled on a SUBMITTED List ("A hospital feed cannot change a submitted List"), so not on BK0184 or Holt: run it on Ellison after "Add another procedure", or on BK0191 after `load-multi-procedure-booking` |
| `/admin/masters?view=contracts` (or with Merivale's Face lift open in its detail) | `demo-backdated-range` | Catch-up Phase 24, "Demo: add a backdated price range" (`[data-shot=demo-action-demo-backdated-range]`). Shown on the Contracts view, disabled "Already added" once run; run it from the list (the Contract detail panel is modal, so the bar cannot be clicked while it is open). Adds a range from 1 Jul 2026 at $3,300.00 as the office: the unedited Face lift BK0163 then prices at $3,300.00; BK0187 (typed $2,950.00), BK0188 (AUTHORISED, $3,100.00) stays; the prepaid BK0038 is on another Contract and so never moves. Disabled "Already added" on a second run. Stage it with the `trigger` step, then `goto` the Booking (US-05.2.8 shows the pattern) |
| `/admin/masters?view=seedLoad` (or a seeded Master data view) | `load-sample-spreadsheet` (choice: a sample id such as `sample-hospitals`) | Catch-up Phase 42, bar only. Stages the sample sheet; its result waits on Seed load for `master-load-commit`. US-13.4.3 shows the pattern |
| `/admin/masters` (any view) | `go-live-data-load` | Catch-up Phase 42, bar only. Stages the go-live batch on `?view=goLive`; "Load approved data" (`go-live-commit`) loads it. US-13.4.2 shows the pattern |
| `/admin/day/<date>`, `/admin/day/<date>/bookings/<bookingId>`, `/mobile/lists/<listId>/bookings/<bookingId>` | `raise-sample-warnings`, `clear-sample-warnings` | On the Day view they stage (or undo) every rule's sample on Dr Rutherford's Tue 21 Jul Bookings (`BK0119`, `BK0121`: the prepayment and base-units samples); on a Booking, on that Booking (seeded Bookings only). Four rules since catch-up Phase 21: the child payer sample stages on the Booking on screen when its patient is under 18, otherwise on Grace Park's (BK0033: Hana Park out, the patient in); the approval number sample on the Booking on screen when it names an insurer, otherwise BK0074 (its number cleared). Catch-up Phase 22 adds a fifth, `splitDoesNotFit`: on the Booking on screen when its seed carries a split, otherwise the fee-split Booking BK0025, nib's share raised to $250.00 so the rest has nothing left. A Booking whose fee is split cannot take the prepayment sample. Clear restores them. Also in the PWA Demo sheet on a mobile Booking |
| `/admin/ledger`, `/admin/ledger/anaesthetists/<id>` | `inject-unmatched-receipt` (choice `souter` or `none`), `payment-full`, `payment-half`, `payment-replay` (choice: an open receivable's ACCREC id), `arm-handoff-fault`, `run-archive-job` | Catch-up Phase 36, bar only. The $120.00 unmatched receipt puts the ledger out of balance (see "Internal ledger" under Seed data); US-13.2.1 and US-08.3.4 show the pattern (`goto` `/admin/ledger`, then the trigger in `setup`). The payment entries land the receipt in the ledger first, then Xero, and the ledger stays in balance |
| `/admin/day/<date>` (and `/admin`, which redirects there) | `inject-unmatched-receipt` (choice `souter` or `none`) | Catch-up Phase 37, bar only: the same entry as on the Ledger; it puts the right rail's Reconciliation card (`dashboard-reconciliation`) out of balance with one unresolved item. US-13.2.4 shows the pattern (`start` `/admin`, then the trigger as a step) |
| `/web`, `/web/accounts/<subTab>` | `web-payment-full`, `web-payment-half` | Catch-up Phase 38, bar only, "Payment received · full" or "· half": a Xero payment webhook on one of Dr Souter's open invoices, chosen in the row's select (option values are runtime ACCREC ids, so omit `choice`: it defaults to the first open invoice by number, AA-2026-0002 after the S3 AM authorise). Disabled "No open invoices yet" on a fresh seed (the history invoices take no payment): authorise a List first. Collected rises at once and the Outstanding row reads "Paid in, due to you"; the GST report gains its row only when AA pays out (`/admin/billing`, `billing-run-payables-in-xero`). US-12.2.1 and US-12.2.3 show the pattern |
| `/mobile/balances` (PWA Demo sheet only) | `pwa-office-runs-payables` | Catch-up Phase 36, badged Office stand-in, labelled "Office runs this week's payment cycle" since catch-up Phase 39a. Runs the payables for Dr Souter; Balances' "Paid out" rises by what was due. Disabled "Nothing due to pay out" until a payment has been received |
| `/admin/day/<date>`, `/admin/invoices`, `/admin/invoices/<invoiceId>` | `load-full-scale` ("Load full-scale data") | Catch-up Phase 43, bar only, with a confirm step (the `trigger` step clicks Confirm). Message "Generating full-scale data. Timings appear in the banner."; the data is ready only when `scale-timings-toggle` shows (2 to 3 seconds). Disabled while generating or once loaded. Lost on any `goto` or reload. Index path the Day view |
| `/demo/data` | `scan-nhi-leaks` ("Scan for NHI leaks", choice `now` or `planted`) | Catch-up Phase 43, bar only. Fills the Privacy checks report `nhi-scan-report`; the result line summarises what was found |
| `/admin/intake/matching` | `matching-raw-row-other-role` ("View raw row as another role", choice `souter` or `feed`) | Catch-up Phase 43, bar only. Acts on the selected row or, with none selected, the oldest row needing resolving; refused, "Refused: only office staff can view a raw hospital row (Mere Tipene's row). The attempt is in the audit trail." Close the row panel first: it covers the harness bar's right side |

The PWA-only entries (`office-reviews-additional-invoice`, labelled "Office reviews this event" since catch-up Phase 39b (id kept), on a mobile Booking with an event of any kind awaiting review (catch-up Phase 38b, widened in 39b: the office approves the Booking's oldest event awaiting review, else takes the oldest approved one, and invoices it in the next run; "Reviewed by the office (simulated). Invoice AA-... raised in the next run."), `office-authorises-list` on a mobile List, `office-clears-warning` on a
mobile Booking with an open warning, `office-assigns-next-free` on the mobile Lists home (catch-up
Phase 28: assigns St George's · Mr T. Hale to Dr Souter's next free session, Wed 22 PM on a fresh
profile), all badged as the office stand-in, `pwa-payment-full` and
`pwa-payment-half` on Balances) are in the handset's Demo sheet, not the bar. On a mobile shot,
use the same `trigger` step (mobile shots hide the Demo chip, as desktop shots hide the bar; the
step shows it while it runs). "Play the office" is off on a fresh profile, so a submitted List waits
until `{ "trigger": "office-authorises-list" }` runs (US-07.4.1 and US-08.6.1 show the pattern).

**Integration simulator** (`/demo/integrations`)

- **No Xero outage banner here.** The Xero outage (catch-up Phase 37) shows only on the Xero simulation's tabs and
  the Billing monitor's Xero line; the integration feeds are unaffected by it.
- **Future scope (catch-up Phase 34).** The simulator, the message log (`/demo/integrations/log`) and feed mapping
  (`/demo/integrations/mapping`) sit under the header "Future scope: HL7 and FHIR" (`demo-surface-future-scope`,
  page strip `future-scope-pages`). Shots use app `simulator`; no caption may call the simulator, a sync or
  Christchurch Public in scope.
- **Feeds:** St George's (HL7 v2), Christchurch Public (HL7 v2) and Southern Cross (FHIR-native). St George's is
  selected by default. Christchurch Public is **not integrated today**: its card reads "Not integrated today ·
  example of a further feed (Future Work)" (`integrations-cph-not-integrated`), it has no live feed ("Start live feed"
  is disabled on it), and its messages replay one at a time. Only St George's and Southern Cross stream.
- **Messages never apply anything (catch-up Phase 33).** A message that parses stages a row on
  `/admin/intake/matching`, and the Booking changes only when the office decides that row. Pane 3
  (`[data-shot=integrations-schedule-change]`) reads "Sent to matching". There is no manual-intervention
  status or park code anywhere; the message log's attention callout (`integrations-attention`, on
  `/demo/integrations/log`) shows dead-letter only.
- **Messages:**
  - MSG-STG-1001: "S12 · New booking" (Sarah Mitchell). Selected by default. Not part of S1 since catch-up Phase 34 (S1 imports the St George's file on Matching).
  - MSG-STG-1002: new-format NHI.
  - MSG-STG-1003: out-of-range ethnicity. It raises a data-quality item.
  - MSG-STG-1004: transient failure, then auto-retry.
  - MSG-CPH-2001: dead letter (still dead-letters; no row).
  - FHIR-SX-2001: FHIR-native booking.
  - MSG-STG-1010: "S13 · New time, same List"; MSG-STG-1011: "S13 · Booking on another day (arrives as a new row)".
  - MSG-STG-1012: "S14 · Modification" (Diane Foster). Its hospital wording reaches `BK0043` only through its row, once the office applies it.
  - MSG-STG-1013: "S15 · Cancellation".
  - MSG-STG-1014: "S14 · Change to a submitted List" (Alan Prentice, Mr P. Doyle's AM List): its row stays appliable on Matching until the List is authorised.
- **Selecting a message:** click its title in `[data-testid=integration-library]`, for example
  `[data-testid=integration-library] >> text="S15 · Cancellation"`.
- **Replaying:** `[data-shot=integrations-replay]` replays the selected message. Each library row
  also has its own Replay button.
- **After a replay,** `/demo/integrations/log` shows the message log. Use a `setup` that replays,
  then set `start` to `/demo/integrations/log` (US-14.1.1's `message-log`). To show a message's row, set `start` to
  `/admin/intake/matching` instead (US-02.5.4 fires MSG-STG-1014 from `/demo/integrations` in `setup`, then opens
  Matching). A dead letter: fire MSG-CPH-2001 from `/demo/integrations/log` in `setup` (US-14.5.1).

**Xero simulation** (`/demo/xero`; catch-up Phase 37)

- **Outage banner.** While a Xero outage is on (`xero-outage-start`, from `/admin/billing` or any Xero tab), every
  Xero tab shows `xero-outage-banner` ("Xero API unavailable to the Billing Engine (simulated)."): payments and bill
  payments still land in Xero, and the engine's calls wait in its Xero sync queue (`billing-xero-queue` on the
  Billing monitor, "Sync payment on ...", "Record disbursement on ...", "Hand off ..."). "Restore Xero" drains the
  queue; the queue's "Sent after waiting (N)" toggle (`billing-xero-sent-toggle`) lists what went. Stage a payment
  during the outage with `payment-full` on the pair: its result line says it "landed in Xero ... nothing is received
  in the ledger yet".
- **Changed directly in Xero.** Void or amend on a pair, then `run-reconciliation-poll` (or "Next day"), then
  `/admin/billing`: the `billing-xero-divergence` panel, the List's "Voided in Xero" status and the invoice rail's
  `invoice-xero-flag`. US-09.2.2 (`poll-flags-void`, `poll-flags-amended`) shows the pattern on AA-2026-0002.
- **Bank reconciliation** is Xero's, not the engine's: `/demo/xero/bank` after `xero-bulk-remittance` (US-10.2.4).

**Data inspector** (`/demo/data`)

- Privacy checks (`nhi-scan-panel`, filled by `scan-nhi-leaks`), Today's sessions, Seeded scenario finder, Audit trail
  ("Choose a booking"), Lifecycle states.
- Guard console: pick a persona and an action, then "Attempt".

## Gotchas

- **Escape closes the top layer only** (Phase U2). A recipe that presses Escape with an Admin drawer open
  now closes the drawer, unless a sheet is on top, in which case only the sheet closes. Close a drawer with
  `[data-testid=admin-list-drawer] >> role=button[name="Close"]`, and do not press Escape to dismiss a
  sheet if the drawer must stay open.
- **State lives in localStorage** (`aa-demo`, with a write coalesced over about 250ms).
  - A `goto` step inside `setup` reloads the page. Add `{ "wait": 400 }` before it if you just
    mutated state.
  - The move to `start` after setup does not reload, so no wait is needed there.
- **PWA office simulation is off.** "Play the office" (More tab, Office simulation card) is off by default and in every
  fresh context, so a List submitted on :5174 stays SUBMITTED; move it on with `{ "trigger": "office-authorises-list" }`.
  Only if a recipe switched it on would the List be authorised and billed about 4s after submit.
- **Numbers created at runtime vary.** Runtime invoice and Xero numbers depend on the order
  things are authorised. Reach them by clicking rows rather than hard-coding IDs, except
  `INV0001`, `XRB0` and the history ids (`HINV<nn>`, `XRH<nn>`), which are seeded. The S3 invoice numbers are stable
  when AM is authorised before PM (see the Phase 22 seed notes), so a row can be picked by its number.
- **Overlays auto-dismiss** after about 1s: the completion overlay, the submission overlay and
  success overlays. Wait about 350ms, then shoot.
- **The mobile booking's header actions fold away** when `mobile-booking-scroll` is scrolled.
- **Avoid the PWA More tab's build panel** (build ID, cold-launch ms). It changes on every run
  and breaks determinism.
- **A Free session has no List id.** Recipes that used a free session's `L-` id (for example
  `L-41267-2026-07-21-PM`) must use its `data-slot-id` instead. The UI says session, never "slot".
- **Find available shuffles within a tier** (per opening, from `suggestionSeq`): assert tier order and
  pick by `[data-candidate=<id>]`, never by position, and start from a fresh Reset.
- **Past the horizon** (for example `/admin/day/2026-11-24`) the Day view shows
  `[data-shot=admin-day-beyond-horizon]` instead of a grid.
- **Stale IDs redirect** instead of showing a blank page. If a shot shows a list page when you
  expected a booking, the ID is wrong.
- **The Synthetic data only badge sits in the harness bar only** (catch-up Phase 43, moved out of the Admin side nav,
  the web top nav, the phone's More card and sign-in screen in November 2026). The harness bar is hidden in shots.
- **Full-scale generation takes a few seconds** (catch-up Phase 43). After the `load-full-scale` trigger add
  `{ "wait": 3000 }`, then wait for `[data-shot=scale-timings-toggle]` (it shows only once loaded; the banner itself
  also shows while generating). The banner's generation time and the Timings differ on every run, so those images
  change on every capture.
- **Full-scale data is lost on any `goto`** or reload (catch-up Phase 43): it lives in memory only and saving is
  paused. Move between Admin screens by clicking the side nav, or load it in `setup` and let the runner's move to
  `start` (no reload) open the screen.
- **The Matching row panel covers the harness bar's right side** (catch-up Phase 43), where the Demo actions pill
  sits. Close the panel (Escape) before a `trigger` step on Matching.
- **The PWA cannot see an Admin save.** :5174 and :5173 are different origins with separate stores, so a change made in
  Admin never reaches a mobile shot; stage it on the phone with an Office stand-in entry (for example
  `office-edits-booking`), or show it on web after a `setup` in Admin (see `recipes/US-15.0.7.json`).
- **NHI Look up is disabled until the NHI validates** (catch-up Phase 40a). Fill `[data-shot=manual-nhi]` with a
  valid NHI before clicking `[data-shot=nhi-lookup-button]`; an invalid one (`ZAA0068`) shows its reason in the hint
  and the button stays disabled, so a click step on it fails. The one exception is Admin Day's phone advice, where
  Look up with an empty NHI finds Demo Patient `DEM1239`.
- **The Hub's answer is a short real timer** (catch-up Phase 40a): 600 ms when Available, with "Slow" showing after
  1.5 s and the answer at 6 s when the Hub is Slow. A fixed `{ "wait": 400 }` after Look up shoots "Checking the NHI
  register". Wait on the answer instead: `{ "wait": "[role=dialog] [data-shot=nhi-lookup-status][data-status=found]" }`
  (or `notFound`, `unavailable`, `slow`). The same wait applies to the refresh panel and the Add NHI sheet.
- **The Hub mode persists** (catch-up Phase 40a): `nhi-hub-mode` is saved in the store until it is changed or the
  demo is Reset. Each state starts from a fresh context, so it only carries over within one state's steps.
- **The PWA has a sign-in screen** (catch-up Phase 43a). With no session the PWA shows `sign-in-screen` on every route.
  The runner presets the `aa-anaesthetist-session` key signed in for every mobile context (`localStorage` in
  `board.config.json`), so mobile shots start signed in. To shoot the sign-in screen, sign out first: `/mobile/more`,
  click `more-sign-out` (or the PWA trigger `pwa-sign-out`). Signing out writes the session key (signed out), so the
  preset (set only when the key is absent) does not undo it on a later `goto`. Sign in returns to the same route.
- **The support line reads closed until 8:30am** (catch-up Phase 43b). Every state starts at the seed's 8:00am, so to
  shoot "Open now" with no cover note move the clock first: on :5173 a `setup` that does `{ "goto": "/demo/control" }`,
  then clicks `role=button[name="+1 hour"] >> nth=0` (the harness clock menu is hidden in shots); on :5174 click the
  same button in the PWA More tab's Demo clock card before `nav-help`. The support Demo actions appear only after
  `nav-help` is clicked (and the public-holiday and call-out ones only on the Product support tab).

## Worked examples

- `recipes/US-14.1.1.json`: a simulator shot with two states (received, then applied), plus an
  admin shot whose `setup` replays a message on the simulator first.
- `recipes/US-01.2.1.json`: mobile and web shots, with a before and after state, and `partial`
  with a reason.
- `recipes/US-02.1.1.json`: an admin shot with two states (inbox, then review), and `partial` as
  the nearest analogue.
