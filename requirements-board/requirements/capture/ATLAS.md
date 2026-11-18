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
| `scenario-s1` to `scenario-s5`, `scenario-confirm` | `/demo/control`, used by the `scenario` step |
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

## Personas and IDs

**Personas**

- **Anaesthetist, web and mobile:** Dr Melanie Souter, initials MS, anaesthetist ID `34821`.
- **Admin, and every `/demo/*` page:** Kirsty W., office staff.
- **Other registration numbers:** Rutherford 29104, Ropata 39560, Delaney 27731, Morrison 25490,
  Whitaker 36208, Sharma 41267, Chen 45178, Hughes 46822, Strand 47733, Ngata 38455.
- **Surgeons** (catch-up Phase 17): `S-HALE` Mr T. Hale, `S-REID` Ms A. Reid, `S-WHITFORD` Mr J. Whitford
  (see the seed for the rest). HPI CPNs `40HALT` to `49CAMH` (Reid `47REIA`); Dr Sharma's own HPI CPN is
  `12SHAP`. Rooms `RM-RICC` (Hale), `RM-MERI` Merivale Eye Rooms (Whitford, Reid), `RM-AVON`,
  `RM-FEND`, `RM-PAPA`. Groups `SG-COS` Canterbury Orthopaedic Surgeons (Hale), `SG-EYE` Christchurch
  Eye Surgeons (Whitford, Reid). Runtime ids: surgeons `SN001`, rooms `RMN001`, groups `SGN001`,
  pairing entries `PPN001`.

**IDs**

| Kind | Format | Notes |
|---|---|---|
| Session (Slot) | `S-<anaesthetistId>-<YYYY-MM-DD>-<AM\|PM>` | Catch-up Phase 28: every active anaesthetist's AM and PM session, stored, free by default. Grid blocks, mobile rows, web Lists rows and web availability cells carry `data-slot-id`. The UI never says "slot". |
| List (seeded or projected) | `L-<anaesthetistId>-<YYYY-MM-DD>-<AM\|PM>` | From `projectedListId`: names the session the List was born in (a reassigned List keeps it), never parsed. For example `L-34821-2026-07-21-PM`. Only sessions holding a List have one: a Free session has no `L-` id. |
| List (runtime) | `LG0001`… | Created by Assign List, Book (phone advice), the post-op addendum and the PWA stand-in, and by New Draft List (the Draft List keeps its id when assigned). |
| Draft List | `LD-001`… (request), `LD-<RCBnnn>-<date>-<session>` (recurring clash) | Seeded Draft Lists (catch-up Phase 31). Unassigned until the office assigns an anaesthetist; runtime ones are `LG####`. |
| Booking | `BK0001`… | Seed order. `BK0001`..`BK0005` are Souter Tue 21 AM (BK0001 Hemi Walker). `BK0006` Wiremu Tane, `BK0007` Susan Marsh, `BK0008` David Chen, `BK0009` **Margaret Ellison** (pending). Verify with one run. |
| History Booking | `HBK01`… | The billed history backdrop (Lists `L-HIST-NN`, Procedures `HP`, cases `HBC`). Before catch-up Phase 15 these were `HC01`…. Catch-up Phase 38a appended `HBK14` to `HBK42` on twelve Lists keyed by date and session, `L-HIST-2026-01-12-PM` to `L-HIST-2026-03-27-AM`, all paid before April. |
| Pinned history List | `L-HIST-2026-03-13-AM` | `SEED_LOOKBACK`: Fri 13 Mar 2026 AM, St George's, Mr P. Doyle, three Bookings (Sarah Mitchell `HBK36`), invoices `AA-2026-H36` to `H38`, paid. |
| Invoice | `INV0001` / `AA-2026-0001` | `INV0001` is Priya Nair's seeded paid pre-payment: $1,200.00 plus GST = $1,380.00, approved by Kirsty W. Riley's, once approved on the Invoices strip, is the next runtime invoice. Runtime invoices otherwise start at `INV0002` once a list is authorised. |
| Xero pair | `XRB0` | The seeded pre-payment: its ACCPAY (`XPB0`) credits the "AA Holding account" (contact `XCHOLD`), not the anaesthetist, and is held, never disbursed itself; authorising Nair's List transfers it to Dr Souter (catch-up Phase 27a: transfer `PXT0001`, journal `MJ-0001`). History pairs are `XRH01`… and runtime pairs `XR0001`…. |

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
| Ropata Thu 16 | `L-39560-2026-07-16-AM` | SUBMITTED. The billing-failure target (Losa Tuilagi BK0039 held at the Xero hand-off, Hemi Walker BK0040 bills). |
| Delaney Fri 17 | `L-27731-2026-07-17-AM` | SUBMITTED. Integration-locked target. |
| Souter Tue 28 AM | `L-34821-2026-07-28-AM` | The S1 destination: creating `SAMPLE_STG` R1 on Matching (or applying MSG-STG-1001's row) adds Sarah Mitchell. Its 07:45 and 11:15 cases read as the rooms sent them (AR-35 rows 6 and 8); Sarah Mitchell arrives with "lap appy ?conv to open" (Hospital feed). |
| Souter Tue 4 Aug AM | `L-34821-2026-08-04-AM` | Targets for S13, S14 and S15. |
| Souter Mon 3 Aug PM | `L-34821-2026-08-03-PM` | Source list for the S13 move. |
| Souter Mon 10 Aug PM | `L-34821-2026-08-10-PM` | St George's, Ms G. Lim, ACTIVE. Merivale's Face lift BK0163, and catch-up Phase 21a's BK0176 (fixed price, no times), BK0177 (Needs a price) and BK0182 (the movable Booking). |
| Souter Mon 10 Aug AM | `L-34821-2026-08-10-AM` | Mr C. Okafor, ACTIVE. The Move target for BK0182 (US-04.3.11). |
| Chen Tue 14 Jul (`reviewFlags`) | `L-45178-2026-07-14-AM` | Christchurch Eye Surgery, Mr Whitford, SUBMITTED. The review-flags List (catch-up Phase 21a): BK0178 to BK0181. |

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

**Web app** (`src/apps/web/`)

| Route | Shows |
|---|---|
| `/web` | Dashboard: "Kia ora, Dr Souter", week strip, receivables aging, productivity, leave, "Offer cover". Add `?week=YYYY-MM-DD` (a Monday) to show another week. |
| `/web/lists` | The web main view (catch-up Phase 38a): "Earlier, not yet authorised" first (`web-main-view-earlier`, Mon 13 Jul AM, then Mon 20 Jul AM and PM; catch-up Phase 23 added Mon 13, so pick a row by `tr[data-list-id=...]`, never `>> nth=0`), then "From today"; a Progress column (`[data-progress=submitted]` etc.); no From input, only To. Title row: the search pill (`[data-testid=web-lists-search]` on the `<input>`, `role=searchbox[name="Search your Bookings"]`; its X is "Clear the search field") and "Go to date" (`[data-testid=web-lists-go-to-date]` on the date input, inside a `<label>` "Go to date"). `?q=` shows the results table (`web-lookback-search`, rows `tr[data-booking-id]`, "Clear search"); `?day=YYYY-MM-DD` the day table (`web-lookback-day`, rows `tr[data-list-id]`). Back from List and Booking detail returns to the same `?q=` or `?day=` (location state). |
| `/web/lists/:listId` | List detail: header, bookings table, "Add a booking", submit action. A SUBMITTED List stays editable (catch-up Phase 38a). An AUTHORISED List shows "Invoiced · read only" (`list-authorised-status`), an Invoiced column in place of Units and Fee, and the Invoices panel (`list-invoices`). |
| `/web/lists/:listId/bookings/:bookingId` | Booking detail with capture: RVG code, times, units and the itemised modifiers, booking total, "Mark complete". On her own ACTIVE List dated today or later, "Move to a colleague" (`move-booking-action`) sits above Cancel booking and opens the single-Booking move as a dialog (catch-up Phase 32a). A Booking a colleague handed her shows "Moved to you by" (`booking-moved-to-you`). |
| `/web/availability` | Find cover: the practice availability grid. `?date=YYYY-MM-DD` opens a day (catch-up Phase 32). Free cells read "Free · Open for booking". Dr Souter's own movable List cells show "Move" (`availability-move-mine-am`/`-pm`), and a colleague's free cell in a session where she has a movable List shows "Move here" (`availability-move-to-<registration>-am`/`-pm`); every other cell is inert. A "Moved to you" panel (`moved-to-you`) shows above the filters when a colleague moved a List to her this week. The "Find cover · My availability" switch (UI unification U5) is a navigation of links, `role=navigation[name="Availability page"]` holding `role=link[name="Find cover"]` and `role=link[name="My availability"]` (the current one has `aria-current=page`), on both pages; it is no longer a group of buttons. The day steps stay `role=button[name="Previous day"]`/`"Next day"`; the filter pills are `role=group[name="Anaesthetists shown"]` with buttons "All anaesthetists" and "Free only · N" (match "Free only" by `button:has-text("Free only")`). The "(you)" row's "Change" link opens My availability on that date. |
| `/web/availability/mine` | My availability (catch-up Phase 29): Dr Souter's month (AM and PM per day), click a day and shift-click to a range; the right rail holds the session panel and the form, then "Your series" and the legend. `?date=YYYY-MM-DD` opens a day in the rail (the capture runner has no shift-click: open `?date=`, click "Change both sessions" and fill the To date for a range). |
| `/web/accounts/overdue`, `/web/accounts/payments`, `/web/accounts/gst`, `/web/accounts/fees` | Accounts tabs. Add `?invoice=AA-2026-0005` to focus a payment, which exists only after S3 billing. AA fees (catch-up Phase 16) lists Dr Souter's AA fee invoices; `?invoice=AA-FEE-2026-H02` focuses one. |
| `/web/accounts/gst` (catch-up Phase 26) | The GST tab has no period switch (the GST period is retired): a calendar month, caption `gst-month` "Month (1 Jul to 21 Jul 2026) ...", footer "Month total". Never click a Segmented here. |
| `/web/accounts/*` (catch-up Phase 36) | Every Accounts tab has the "Your position" strip `web-accounts-position` above the sub-tabs: AA owes you (with "Due now ..., which AA holds for you; awaiting collection ..."), Collected for you, Paid out to you, You owe AA (its link "Your AA fee invoices" opens the AA fees tab). The Overdue caption reads "One row per outstanding invoice, ordered by date raised. No rollup (per the RFP)." (no ACCPAY). Overdue also lists the seed's AA-2026-S2401 ($3,565.00, Thu 16 Jul PM) now. |
| `/web/profile` | Your profile (catch-up Phase 26; `web-profile`), reached from the nav persona button `[data-shot=web-profile-link]` (aria-label "Your profile, Dr Melanie Souter"); the four nav tabs are unchanged. Panels: Billing `web-billing-panel` (field "Rate per unit ($)", "Save changes" `web-rate-save`, enabled only once the rate differs), Contact `web-contact-panel`, Identity `web-identity-panel` (Registration, HPI CPN), Bank account `web-bank-panel` (name, number masked `99-0101-•••••21-00`). Only the rate is editable; the rest carries lock glyphs. |

**Admin app** (`src/apps/admin/`)

| Route | Shows |
|---|---|
| `/admin` | Redirects to `/admin/day/2026-07-21`. |
| `/admin/day/:date` | Day grid of anaesthetists by time. The right rail has the mini calendar, "Internal notes" and "Awaiting review". Add `?sort=az` for A to Z order. The toolbar is `[data-testid=admin-day-nav]` (see "Date navigation" under "Overlays that need clicks"); its row order is a segmented control, `role=group[name="Row order"]` with buttons "Roster order" and "A to Z" (`aria-pressed`). The header's date input is named "Go to date" (`[aria-label="Go to date"]`). |
| `/admin/day/:date/bookings/:bookingId` | Admin booking detail with "Office billing setup". A Booking created or changed from a hospital row links back to it (`booking-from-hospital-row`, opens Matching on that row); a newer hospital text waiting on Matching shows the cue `booking-newer-hospital-text` (catch-up Phase 33). |
| `/admin/matching` | Matching (catch-up Phase 33; Kirsty W.): hospital rows waiting for the office. At reset it holds one seeded waiting row (Mere Tipene, no NHI, catch-up Phase 33a; see Stubs on a List below), so `matching-empty` no longer shows; stage rows with "Import hospital file" (`matching-import-open`, see Overlays) or the Demo actions below. Stat tiles `matching-stats` (`[data-stat=open|new|modification|cancellation|unmatched]`), the filter `[aria-label="Show rows"]` (options whose text starts "Open", "Unmatched", "Decided"), the table `matching-table` with rows `matching-row-<n>` (1-based, ready rows first, then import order). A row click opens its panel `matching-panel` (a right-docked SidePanel with a scrim: press Escape before clicking a row or the header). After an import the batch's first row's panel opens by itself. A row decided stays in place, dimmed, until the panel closes. |
| `/admin/notifications` | The shared notification pool (catch-up Phase 32; US-13.8.1): newest first, six a page, `?page=N`; the table `admin-notifications-table`, rows `[data-notification-row=NT0001]` with "Open List", "Open Draft List" or "Open Booking", the pager `admin-notifications-pager` (Newer / Older). Catch-up Phase 32b: notices are active or resolved; the page shows active ones by default, the count `admin-notifications-page-count`, each active row's tick `notification-tick` ("Resolve"), and the "Show resolved" checkbox `admin-notifications-show-resolved` (`?resolved=1`, kept with `?page=`); resolved rows carry `data-notification-resolved=true` and the line `notification-resolved-line` ("Resolved by Kirsty W., Tue 21 Jul 08:00"). An alert's note is `notification-alert-note`. The provisional caption is gone. Seeds empty: stage it with the `colleague-moves-list-to-office` trigger, or send an alert from a web Booking (same origin) and `goto` here. |
| `/admin/draft-lists` | Draft Lists (catch-up Phase 31): Unassigned tab (default) and History (`?tab=history`). Since UI unification U5 the two tabs are links inside `role=navigation[name="Draft Lists"]`, not `role=tab`: `a[data-draft-tab=unassigned]` and `a[data-draft-tab=history]`, each with its count inside the link text (so match by the hook, not the name); the current one has `aria-current=page`. `?open=<listId>` opens the Draft List drawer (`admin-draft-list-drawer`); `?assigned=<listId>` shows the assigned confirmation with "Open List". The drawer's "Available that session" Assign opens step 2; the row's Assign opens step 1 (Everyone / Free only, tier filter, groups). "New Draft List" opens `admin-new-draft-list`. |
| `/admin/conflicts` | Conflicts (catch-up Phase 30): every live conflict, grouped by date (`section[data-conflict-date=<date>]`), one table each (`[data-shot=conflicts-table]` wraps them). Rows are `tr[data-conflict-row=<listId>]` (cleared ones add `data-conflict-cleared=true`). Row actions have accessible names with context (`Reassign, Dr Rutherford Wed 22 Jul AM`, `Clear conflict, ...`, `Open the List, ...`, `Open the day, ...`): match them by regex (`role=button[name=/^Clear conflict/]`). Hospital closures only since catch-up Phase 32b (no reason filter, no Availability column). Filters in the URL: `?when=twoWeeks|canvas|past`, `?hospital=<id>`, `?anaesthetist=<reg>`, `?cleared=1`. After a reassign or clear, `[data-shot=conflicts-confirmation]`. |
| `/admin/review` | Review queue, plus "Recently billed". |
| `/admin/review/:listId` | Sanity check: total units, B · T · M, "Log phone note", "Authorise for billing". A Procedure that needs a price blocks it (`review-needs-price-blocker`, catch-up Phase 25); once authorised, the lock glyph in each Procedure stack, "(locked)" rate and "Paid to" line. |
| `/admin/invoices` | Invoice list (office pipeline only; the seeded history invoices are left out), newest id first. Columns: Number, Patient / booking (a link to the Booking), Anaesthetist, List (a link to the day), List date, Raised, Counterparty (a split share adds the "Split" chip `invoice-list-split`), Layout (Patient or Holder), Total, Delivery (`invoice-list-delivery`, `data-delivery` sent, toPost, noAddress), and "View →" (named "View invoice AA-2026-0005" since UI unification U6). Open an invoice with `[data-testid=invoice-list-table-shell] tr:has-text("AA-2026-0005") >> role=button[name=/^View invoice /]`: a bare row click can land on a row link. |
| `/admin/invoices/:invoiceId` | Tax invoice document (`.aa-invoice-doc`) with an info rail (catch-up Phase 22): Delivery (`invoice-delivery`), Related invoices on a split share (`invoice-related`), Xero handoff, and the Locked record (`invoice-locked-record`, catch-up Phase 25; migrated words on a history invoice) with the `regenerate-invoice` demo action. Any invoice id opens, the history ones too (`HINV13`). |
| `/admin/billing` | Billing monitor. Its AA fee invoices panel is `[data-shot=billing-aa-fee-invoices]`. The pipeline stage after Invoices generated reads "Sent or to post" (catch-up Phase 22); a List with an invoice that has no invoice address shows `monitor-no-address` ("1 invoice needs an invoice address." with the link "Add an address and send"). |
| `/admin/billing/aa-fees` | AA fee invoices: month picker, the run preview (`aa-fee-preview-<anaesthetistId>` rows), the teal "Run monthly fee invoices" button and every fee invoice (`aa-fee-row-<number>`, expand for `aa-fee-detail-<number>`). |
| `/admin/billing/aa-fees/settings` | AA fee settings: fixed items, the charge per BCTI and the worked example (`aa-fee-example`). |
| `/admin/ledger` | Ledger (catch-up Phase 36; US-13.2.1, US-08.3.4): the Billing Engine's own ledger, AA's system of record. Header `ledger-system-of-record`; the "Scope" segmented control (`role=group[name="Scope"]`, buttons "Whole ledger" and "One anaesthetist"); the balance indicator `ledger-balance` (`data-in-balance=true|false`; "In balance · receipts held equal payables due" or "Out of balance by $120.00", its equation line, and one `li[data-check=<code>]` per failed check); the tiles `ledger-tiles` (Receivables outstanding, Receipts held, Payables due, Disbursed; then Awaiting collection, AA Holding account, AA fees outstanding, Not yet in Xero); "Anaesthetists out of balance" `ledger-anaesthetists-out-of-balance` (empty state "Every anaesthetist's ledger is in balance."; else a table, rows `tr[data-anaesthetist-id=<reg>]` with Open); "Receipts with no matching invoice" `ledger-unmatched` (only once an unmatched receipt exists; rows `tr[data-unmatched-id=UR0001]`, pill Held, "Allocated to ..." or "Refunded", actions `ledger-allocate` and `ledger-refund`); "Pairs" `ledger-pairs` with the filter `role=group[name="Which pairs"]` (buttons "Open", the default, and "All"); rows `tr[data-pair-id=<id>][data-pair-kind=procedure|prePayment|transfer|aaFee]`, columns Receivable, Payable, Kind, Patient, Payer, Payee, Amount, Received, Released, Paid out, Xero ("Mirrored", or the pill "Not yet in Xero", plus "Contact archived in Xero" under an archived payer); a row click opens its invoice (an AA fee row opens `/admin/billing/aa-fees`); `?pair=<id>` tints that row; then `ledger-footnotes`. |
| `/admin/ledger/anaesthetists/:anaesthetistId` | One anaesthetist's ledger (catch-up Phase 36; US-08.3.5): the same screen scoped, with the select `ledger-anaesthetist-select`; `ledger-balance` reads "Dr Souter's ledger is in balance" (or "... is out of balance by $120.00"); `ledger-tiles` (`data-shot-scope=anaesthetist`) holds `ledger-aa-owes` ("AA owes Dr Souter": Due now, Awaiting collection, Total), `ledger-owes-aa` ("Dr Souter owes AA": Unpaid AA fees) and the Collected for them and Paid out to them tiles; "Dr Souter's pairs" (no Payee column). No out-of-balance list or unmatched card at this scope. Dr Souter is `34821`; an unknown id redirects to `/admin/ledger`. |
| `/admin/invoices/:invoiceId` (catch-up Phase 36) | The rail's "Xero handoff" card is now the "Ledger" card `invoice-ledger-card` (no `h2` "Xero handoff" any more): `xero-handoff-status` reads "Mirrored in Xero", "Not yet in Xero" or "Xero handoff failed" (then "The invoice and its ledger pair stand. Resolve and retry in Billing monitor."), then `ledger-receivable-number`, `xero-accrec-reference` (now the Xero ID, `XR...`), `ledger-payable-number`, `xero-accpay-reference` (`XP...`), on a prepayment `xero-accpay-payee` and `xero-transfer-journal-reference`, and the link "Open in the ledger" `invoice-open-ledger` (`/admin/ledger?pair=<id>`). The Xero ID rows show only once the pair is in Xero. |
| `/admin/billing` (catch-up Phase 36) | The intro adds "Money in and out is recorded in the ledger first; Xero mirrors it." The payables panel `billing-payables-run` reads "N payable(s) due · $X to pay out to anaesthetists. A payable is released for exactly what its invoice has received." (or "No payables due. ...") with the link "Open the ledger" `billing-open-ledger`; the "Run payables" button is unchanged. |
| `/admin/integrations` | Tabs: Messages, Feed config, Surgeon PDFs, Data quality, Validators. The message log is empty until a message is replayed. A message stages a row on `/admin/matching` and applies nothing (catch-up Phase 33); the attention callout `integrations-attention` shows dead-letter only. |
| `/admin/masters` | Master data. The view is the `?view=` param: `anaesthetists` (default), `contracts`, `recurringBookings` (catch-up Phase 30; was `permanentLists`), `hospitals` (List or Calendar), `surgeons`, `surgeonRooms`, `surgeonGroups`, `parties` (catch-up Phase 18; the old `insurers` and `organisations` values open it), `specialties` and `fundingTags` (catch-up Phase 18a), `rvgGroups` (catch-up Phase 19, "RVG groups"; the old `rvgCodes` value opens it), `modifiers` (catch-up Phase 19b, "Modifiers"; the old `modifierCodes` value opens it), `availability-statuses` (catch-up Phase 29; the old `listStatuses` value still opens it), `xeroArchiving`. Each sub-nav button carries `data-masters-view=<view>` (click that, not the name: "Surgeons" also matches "Surgeons' rooms"). `?view=contracts&holder=<PartyId>` opens Contracts filtered to a holder (the Parties "N active" link). A Contract's panel has Details and History tabs (catch-up Phase 25). |
| `/admin/masters/surgeons/:surgeonId` | Surgeon profile (catch-up Phase 17): HPI CPN chip, Identifiers, Surgeons' room and Groups cards, Pairing preferences. "History" and "Edit details" top right. An unknown id falls back to `/admin/masters`. Catch-up Phase 17a: Specialties, Identifiers and Groups in the first row, then one row per room (main room first), its Surgeons' room card beside a "Practice manager and PAs" card, then Pairing preferences. |
| `/admin/masters/anaesthetists/:anaesthetistId` | Admin anaesthetist record: Priority tier card, Profile, Pairing preferences. Office only. The Profile card (catch-up Phase 26; was "Details", hook `anaesthetist-details` kept) shows Unit value, Status, Phone, Email, HPI CPN and Bank account (masked, row `anaesthetist-bank-account`); it has no action of its own. The page header's secondary button "Edit details" (beside "History") opens the Edit sheet: click `button:text-is("Edit details")` at page level, not inside `anaesthetist-details`. |
| `/admin/audit` | Audit viewer. |

The side nav has: Day view, Matching (amber badge `[data-shot=nav-badge-matching]`, the open rows,
catch-up Phase 33), Conflicts (amber badge `[data-shot=nav-badge-conflicts]`, catch-up
Phase 30), Review queue, Invoices, Billing monitor, Integrations, Master data, Audit. Every side-nav
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
| `/mobile/balances` | "Your account": Outstanding and GST this month. |
| `/mobile/balances` (catch-up Phase 36) | The header card adds the line `balances-collected-paid-out` "Collected $X · Paid out $Y" under the unpaid count, and `balances-you-owe-aa` "You owe AA $Z" only when Dr Souter has an unpaid AA fee invoice (she does at reset: AA-FEE-2026-H02). The PWA Demo sheet adds `pwa-office-runs-payables` here. |
| `/mobile/more` | Settings. The PWA adds a demo panel with a non-deterministic build ID. Avoid shooting that panel. |
| `/mobile/more` (catch-up Phase 26) | The "Profile" card `mobile-profile` sits between the persona card and the Demo card: rows `mobile-profile-rate` (Rate per unit $26.50, with the "Change" text action `mobile-profile-rate-change`), Phone, Email, Registration, HPI CPN (`mobile-profile-hpi`) and Bank account (`mobile-profile-bank`, masked), the office-held rows with lock glyphs and captions. Its lower rows sit near the fold: `scroll` to `mobile-profile-bank` first. "Change" opens the bottom sheet `mobile-rate-sheet` (field "Rate per unit ($)", "Save rate" `mobile-rate-save`). |

- The tab bar is `[data-testid=mobile-tab-bar]`, with buttons Lists, Availability, Balances and
  More.
- The slide layers are `[data-testid=slide-home|slide-list|slide-booking]` on Lists and `[data-testid=slide-availability|slide-calendar]` on Availability. All stay mounted, so
  scope selectors to the top layer, for example `[data-testid=slide-booking] >> text="RVG code"`.

**Simulators** (`src/apps/demo/`)

| Route | Shows |
|---|---|
| `/demo/control` | The presenter's index: clock and reset, scenario jumps, and every demo action listed under its screen with an "Open screen" link. No trigger buttons. |
| `/demo/xero` | Xero simulation, Contacts tab. |
| `/demo/xero/invoices` | Invoices tab. |
| `/demo/xero/invoices/:accRecId` | Pair detail: ACCREC and ACCPAY, money flow, both records' InvoiceNumber and Reference (`xero-invoice-identifiers`); the payable equals the receivable. `XRB0` exists in the seed. An AA fee pair (`XRFH01`, `XRFH02`) shows the fee ACCREC and a "No payable" note (`xero-aa-fee-pair`). |
| `/demo/xero/invoices/:accRecId` (catch-up Phase 36) | The callout `xero-engine-link` is now titled "Ledger pair (the system of record)"; inside it `xero-ledger-pair` (the patient, then Ledger pair, Receivable and Payable numbers and the ledger's received, released and paid out) and the chip `xero-ledger-match` ("Matches the ledger" or "Differs from the ledger"). The page subtitle says Xero mirrors the Billing Engine's ledger. |
| `/demo/integrations` | Integration simulator: feeds, message library, raw HL7 to FHIR, then pane 3 "Sent to matching" (a message stages a row on `/admin/matching`, never applies). |
| `/demo/data` | Data inspector: today's lists, seeded scenario finder, audit trail, lifecycle states, guard console. |

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

**Surgeons' rooms, surgeons at two rooms, practice manager and PA contacts** (catch-up Phase 17a; Admin, Master data)

- Rooms with no email (the row's email cell and the profile's room card read "No email held"; shoot
  `[data-shot=masters-surgeon-rooms] tr[data-room=RM-GENERALSUR]`): `RM-GENERALSUR` General Surgery
  Partners (Mr B. Yeoman `S-YEOMAN`), `RM-BURNSIDEEN` Burnside ENT Surgeons, `RM-EYEPARTNER` Eye
  Partners, `RM-BRYNDWRNEU` Bryndwr Neurosurgery Specialists, `RM-RICHMONDFE`, `RM-IMOGENVAUG` and
  12 more. `RM-ELODIEBRAM` and `RM-WIGRAMORTH` hold no phone either. The five cast rooms keep their emails.
- Two-room surgeons (main room first): `S-WAINWRIGHT` Mr N. Wainwright and `S-MORLAND` Mr K. Morland
  (`RM-UPPERGIPAR` Upper GI Partners, then `RM-HILLSBOROU` Hillsborough Colorectal Specialists),
  `S-WINSLOW` Dr J. Winslow (`RM-RICHMONDFE`, then `RM-LINWOODWOM`), `S-VAUGHAN` Dr I. Vaughan
  (`RM-IMOGENVAUG`, then `RM-EDGEWAREOR`). Use `S-WAINWRIGHT` for a two-rooms shot.
- Contacts (rows `li[data-contact=RC-nnn]`; runtime ids `RCN001`): Avonhead ENT `RM-AVONHEADEN` Bev,
  PA for Dr H. Dalgety (`/admin/masters/surgeons/S-DALGETY`); Burnside ENT `RM-BURNSIDEEN` Maree (for
  Mr I. Forsythe `S-FORSYTHE`), Dianne (for `S-MALLORY`), Nicola Holloway (whole room), Leanne (two
  rows, for `S-CALDER` and `S-WOODVILLE`), so Forsythe's profile shows Maree and Nicola Holloway;
  Redwood Eye Group `RM-REDWOODEYE` Jodie Yamada (for `S-VASQUEZ`); Bryndwr Neurosurgery
  `RM-BRYNDWRNEU` Wendy (for `S-MATHIESON`); General Surgery Partners `RM-GENERALSUR` Rosalind
  Pemberton, Practice manager, whole room (invented). The rooms view's Contacts column reads "5
  contacts" on Burnside ENT.


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
  Its procedure text is still the generated "Knee, total replacement". S2 Beat 3c moves this List to
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

**Public is a Slot status (catch-up Phase 32d).** Id `publicHospital`, label "Public", long label "Public hospital", the purple public colour, solid; not open for bookings or cover, so it works like Unavailable. Four statuses in Master data, Availability statuses (rows `tr[data-status-row=publicHospital]`; the footnote `[data-shot=availability-statuses-list-types]` reads "Private and Pre-op are kinds of List, shown on the List, not availability."). The `public` List kind is gone: List kinds are Private and Pre-op, and the seeded public Lists holding Bookings are private Lists with the same ids (Dr Sharma Tue 14 Jul AM `L-41267-2026-07-14-AM`, Dr Souter Thu 23 Jul AM `L-34821-2026-07-23-AM` with 8 Bookings, Dr Ropata Tue 21 Jul PM, Dr Whitaker Tue 21 Jul AM and Fri 17 Jul AM, Ropata Thu 16 Jul AM and others). Bookless public sessions are Public with the note "CPH". Seven weekly Public series, `AS0001` to `AS0007`: Souter Thu AM, Sharma Tue AM, Ngata Tue AM, Ropata Tue and Thu both sessions, Delaney Mon PM, Hughes Mon AM, Whitaker Tue, Thu and Fri AM. On the phone, My calendar (`/mobile/availability/calendar`) status chips include Public hospital, "Your series" lists "Public hospital, Thursday AM, every week, no end date" for Dr Souter, and Add days off (`mobile-add-days-off`) offers four status choices (`[data-status-choice=publicHospital]`, note placeholder "For example, CPH").

**Draft Lists** (catch-up Phase 31, `/admin/draft-lists`). 10 in the pristine seed since catch-up Phase 32d (was 15, then 16), ascending by date. Three request Draft Lists: `LD-001` St George's / Mr S. Tan Tue 21 PM (phone), `LD-002` Forte Health / Mr V. Nand Wed 22 PM (email, 2 Bookings), `LD-003` Christchurch Eye Surgery / Ms A. Reid Mon 27 AM (PDF). The rest are recurring-clash Draft Lists, ids `LD-<RCBnnn>-<date>-<session>` (e.g. Beaumont Southern Cross Wed 22 AM and PM and Fri 24 AM `LD-RCB022-2026-07-24-AM`; Ngatai Wed 22 AM and Mon 27 PM). Phase 32d removed `LD-RCB013`, `LD-RCB016`, `LD-RCB027`, `LD-RCB028`, `LD-RCB029` and `LD-RCB030` (Ngata's Tue 21 AM and the others fell on Public sessions); use `LD-RCB022-2026-07-24-AM` for an "unavailable colleague" clash. A List's state is DRAFT, ACTIVE, SUBMITTED or AUTHORISED; assigning a Draft List makes it ACTIVE. The Unassigned table is `[data-shot=draft-lists-table]` with rows `[data-draft-list-row=<id>]` (Origin is the 7th column; the Day cell is blank on all but the first row of a day). Demo actions: `simulate-incoming-request` (Draft Lists page; adds a Reid Thu 23 PM request by default), `add-draft-list-for-day` (Day view), `stage-recurring-clash` (Recurring bookings view). Adding Dr Beaumont (`31902`) on Thursday AM with hospital and surgeon on the recurring sheet creates a Draft List. Dr Sharma (`41267`) is not preferred with Ms Reid.

**Wed 22**

- Souter PM is free.
- Rutherford AM (catch-up Phase 32b): his session `S-29104-2026-07-22-AM` is Unavailable, note
  "Unwell, short notice", recorded by the office (Kirsty W., 07:40), with no List and no conflict: the
  office returned his Christchurch Eye Surgery List, now a Draft List with the same id
  (`L-29104-2026-07-22-AM`, origin "Returned: anaesthetist unavailable", block
  `[data-draft-block=L-29104-2026-07-22-AM]` in the Wed 22 band). The S2 Beat 3 target: assign it to
  Dr Sharma (Wed 22 AM Free). Unavailability is never a conflict.
- Real conflicts (catch-up Phase 30), four Lists, each block `button[data-conflict=true]` in the amber
  conflict colour:
  - The Southern Cross closure `HH900` "Theatre maintenance closure" flags Morrison PM
    (`L-25490-2026-07-22-PM`), Ngata PM (1 Booking), Sharma PM (`L-41267-2026-07-22-PM`, 2 Bookings)
    and Hughes AM.
- Other seeded conflicts: Labour Day Mon 26 Oct (8 Lists) and Canterbury Anniversary Fri 13 Nov
  (5 Lists), every hospital closed. open conflicts count 16 since catch-up Phase 32d (the nav badge reads 16, was 19); Tue 21 has none.

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

**Review queue (pristine):** Morrison, Whitaker, Souter Mon 20 AM and PM, Ropata, Delaney, and since catch-up
Phase 23 Souter Mon 13 AM (the three-procedure Booking; a second "Souter · Forte Health" row, so open a List by its
route, never by row text).
Authorising Morrison raises 6 invoices.

**Web accounts (backdrop history)**

- Overdue: Tane, Marsh, Chen, Prentice (ACC), Holt, Foster, Mitchell, Walker.
- Paid: Bennett, Webb, Mills, Riley, Park, and the 29 January to March 2026 accounts (catch-up Phase 38a).
- Search examples (catch-up Phase 38a): "Mitchell" or `CQY9304` (three: Mon 27 Jul, Tue 14 Apr, Fri 13
  Mar; never her Booking on Dr Sharma's List), "Prentice" (Mon 20 Jul PM and the June ACC Booking),
  "Prescott" (Noah Prescott, NHI pending), "tane".

**Also seeded:**

- A cancelled booking on Morrison's list.
- A parent paying for a minor: Grace Park (BK0033, Chen Fri 24 AM), Hana Park (Mother) the payer on
  each of her two Procedures (catch-up Phase 22a: P0035 and P0186, both `BP0001`, Different payer ticked), no
  child warning.
- An insured-reimbursement booking: Rutherford, Thu 16 AM (BK0030, Marcus Webb): No contract · RVG,
  invoiced to the patient, AIA Health named as insurer with number `AIA-2026-30418`, no warning.
- A provisional patient with no NHI.
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
`domain/seed/bookingMoveSeed.test.ts`). S2 Beat 3d: Dr Souter's Wed 22 Jul AM Christchurch Eye Surgery
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
  `[data-shot=out-of-hours-open-sheet] >> role=button[name="Open out-of-hours session"]`. It opens Slot
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
  bills the payer on the Booking. Doyle's bariatric Booking (BK0028) is one invoice to the patient,
  Gareth Mills ($2,861 + GST).
- **The payer on the Booking (catch-up Phase 21):** every seeded patient has an `@example.net` email and
  an NZ Post postal address, except Kevin Doherty (none on purpose); every Booking's payer is the patient
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
- "Needs an invoice destination" at reset (no Contract): BK0035 (Souter Mon 27 AM, the NHI-pending PDF
  Booking) and the six pre-ops BK0060 to BK0065 (Souter Thu 23 PM, AA rooms). BK0060 carries the
  answers so far Patient › Standard, for the anaesthetist's pick-up. Sarah Mitchell's Booking created on Matching (S1) arrives
  with none, unless the office chose one.
- Good rail Bookings: BK0046 (Souter Wed 22 AM, Christchurch Eye Surgery, Mr Whitford: Patient, the
  hospital under SXAP, HNZ and ACC, Special); BK0009 (Southern Cross, one tag, SXAP fills itself in;
  Other price is Southern Cross · SXAP · Fixed price); BK0034 (Ms Lim: Merivale's items under
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
  "Rate × time" option in Add billing line (fixed amount only), no Method 3 setting.
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
- **A unit-value edit re-prices unlocked Bookings only.** Edit Dr Souter on `/admin/masters` (`[data-shot=masters-anaesthetists]
  tr:has-text("Souter") >> text="Edit"`, fill `[role=dialog] >> role=textbox[name="Unit value"]`, "Save changes"): after
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
- Master data, Anaesthetists (`/admin/masters?view=anaesthetists`, `masters-anaesthetists`): columns Name, Reg, Unit $
  (the third column, so `table th:nth-child(3)` is the unit value), Tier, HPI CPN, Bank account (masked, cell
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
  transfer or refund.", a warning pill "Moves to the anaesthetist when the List is authorised · to confirm with AA",
  and entry rows `[data-shot=holding-entry]` (`data-entry-kind` received|transferred, `data-booking-id`); empty
  state "Nothing held". A journal fault shows on the List's pipeline Booking row as
  `[data-shot=monitor-journal-fault]` with "Resolve & retry".
- **The transfer at authorise.** Authorising Nair's List (complete, submit, authorise: the steps under
  Staging above; US-06.5.1 and US-09.1.3 carry them) writes the transfer `PXT0001` and its Xero manual journal
  `MJ-0001` automatically, with no office step. Then: the card shows a Transferred row naming "Dr Melanie Souter",
  balance $0.00; the Payables run reads "1 payable authorised · $1,380.00 ..."; clicking "Run payables"
  (`[data-shot=billing-payables-run] >> role=button[name="Run payables"]`) shows "Run PR0001: disbursed $1,380.00
  across 1 payable."
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
  `[data-shot=payment-held]` "Held until the List is authorised"; after authorise and Run payables, "Paid to you"
  (no `payment-held` then). Units row `[data-shot=capture-prepaid]` "Prepaid $1,200.00 · paid · held by AA until
  the List is authorised" (inner `[data-shot=capture-prepaid-holding]`); the Pre-payment panel line
  `[data-shot=prepayment-holding]` (`data-holding-state` held|transferred|paidOut): "Held by AA until the List is
  authorised" for the anaesthetist; Admin reads "Transferred to Dr Melanie Souter", then "Paid to Dr Melanie
  Souter". Mobile Balances' `[data-shot=balances-payment-held]` shows only on a part-paid held prepayment (not Nair).
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
- MSG-STG-1014 (fired from `/admin/integrations` or `/demo/integrations`) stages "Alan Prentice", a change
  to a SUBMITTED List, still appliable.

### Stubs on a List (catch-up Phase 33a)

- Matching is no longer empty at reset: the seed holds one waiting row with no NHI, `IRS001` (batch `IBS001`,
  "Southern Cross theatre list, Tue 4 Aug"): Mere Tipene, Southern Cross, Ms K. Patel, "Lap chole", 14:00, Tue 4 Aug
  PM. It sorts after the ready rows (Unmatched), so after an import `matching-row-1` and `matching-received` are still
  the file's first ready row; the Open and Unmatched counts and `nav-badge-matching` are one higher than in Phase 33.
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

## Overlays that need clicks

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
- **Surgeon sheet, rooms** (catch-up Phase 17a): the same sheet holds `[data-shot=surgeon-rooms-field]`
  ("Surgeons' rooms", below the specialties): a chip per room in order, the first with a "Main room" pill
  (`[data-main-chip]`), each other with a "Make main" action named "Make main: <room name>", chips named
  "Remove <room name>", and a select ("Add another room"). Open it on `S-WAINWRIGHT` for two chips.
- **Room sheet** (catch-up Phase 17a): "Edit <room name>" on the rooms view opens
  `[data-shot=surgeon-room-sheet]` with "Contact email (optional)" (hint "Leave blank where the practice
  gives no shared inbox") and "Phone (optional)"; reach a field as
  `[data-shot=surgeon-room-sheet] label:has(input[type=email])` (or `type=tel`). Editing an existing room
  adds `[data-shot=room-sheet-contacts]` ("Practice manager and PAs", its rows and Add contact; the
  contact form swaps in place inside the sheet, no second dialog).
- **Contacts on a surgeon profile** (catch-up Phase 17a): each `[data-shot=surgeon-contacts]` card's
  "Add contact" (`[data-shot=room-contact-add]`, named "Add contact to <room name>") opens
  `[data-shot=room-contact-sheet]` in a `[role=dialog]`: Name, Email, Role (segmented Practice manager,
  PA), For (the whole room or one of the room's surgeons, defaulting to the profile's surgeon), then
  "Add contact". A row's Edit (named "Edit <contact name>") opens the same sheet as "Edit contact";
  its Remove (named "Remove <contact name>") shows the in-card confirm `[data-shot=room-contact-remove]`
  ("Remove contact", "Keep it"). On a two-room surgeon, scope by `[data-room=<roomId>]`.

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
- **Add billing line:** `role=button[name="Add billing line"]`.
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
  profile "Edit details" (`surgeon-edit-sheet`), "Add room" / "Edit <room name>"
  (`surgeon-room-sheet`), "Add group" / "Edit <group name>" (`surgeon-group-sheet`), a hospital's
  "Edit <hospital name>" (`edit-hospital-sheet`), "Add pairing" (`pairing-add-sheet`), a pairing
  row's "End" (`pairing-end-sheet`, confirm "End pairing"). The anaesthetist Edit sheet has an
  "Open record" link. A table row (anaesthetist or surgeon) opens its page; the "Edit" link in it
  does not.

**Shell** (these controls sit in the harness bar, which is hidden in shots, so they can't be
clicked; use the matching `/demo/control` buttons in `setup` instead. The "Demo actions" menu is
the exception: use the `trigger` step)

- **Demo clock:** `role=button[name=/Demo clock/]`. It offers "+15 min", "+1 hour", "Next day",
  "Next morning", "+7 days" and "Procedure day · 28 Jul".

## Existing hooks

- Matching (catch-up Phase 33, `/admin/matching`): `admin-matching` (the screen), `matching-empty`,
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
  `booking-from-hospital-row` and `booking-newer-hospital-text`. Side nav `nav-badge-matching`.
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
- Public status (catch-up Phase 32d, no new hook names): `[data-status-choice=publicHospital]` in the mobile and web availability forms and the Day drawer's Change status sheet; `tr[data-status-row=publicHospital]` in Availability statuses; `[data-shot=drawer-change-status]` opens the sheet; the Day block for a Public session is `button[data-slot-id=<id>]` showing "Public" and its note; the legend and the "Status filters" group gain a "Public status" chip (a Slot status, no longer a List kind).
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
  `anaesthetist-details`, `surgeon-specialties`, `surgeon-identifiers`, `surgeon-groups`, `surgeon-room-card` and
  `surgeon-contacts` (`data-room` kept). The web panels are the same `Card`, so their titles ("Bookings", "Invoices",
  "Leave", "Receivables aging") are `h2`, no longer a `div`. The invoice rail's own `section` and `h2` cards
  (`invoice-info-rail`) are unchanged. Label and value rows are the shared `shared/ui/DefRow` in a `dl`: each row is
  `div > dt + dd` (was `div > span + span`) in the Admin drawers, the Booking detail (Paid by, funder details), Office billing
  setup, the Assign Draft List sheet, the invoice's Locked record and the profile facts. Page titles are the shared `PageHeader` (the `h1` text unchanged);
  eyebrows are the shared `Eyebrow` (CSS caps, so `text=` still matches the DOM's mixed case). The phone's day chip
  is the shared `DayChip`, test id `mobile-lists-day-chip` kept.
- Catch-up Phase 27a (AA Holding account): `data-shot` `billing-prepay-holding` (the Billing monitor card), `holding-entry`
  (its rows, `data-entry-kind`, `data-booking-id`), `monitor-journal-fault` (a pipeline Booking row's journal fault),
  `xero-holding-held` (the Xero pair's "Held in the AA Holding account" callout), `payment-held` (web Accounts payments
  pill), `balances-payment-held` (mobile Balances pill, part-paid held prepayment only), `prepayment-holding` (the
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
  beside its "Retry" button: "Retry rebuilds from the locked record. ..."). A hand-off fault row keeps "Resolve & retry",
  its "Handoff failed" pill and the fault message, and retries in place (no sheet). GONE: `choose-contract-sheet`. See
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
  `reassign-conflict-warning`, `reassign-not-available` (the collapsed group), `move-booking-conflict-warning`,
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
  There is no `masters-rvg` hook. The read-only RVG time rule panel above the table is
  `masters-rvg-time-rule` (catch-up Phase 19a). The T row's caption reads "From start and finish
  stamps · RVG time tiers"; money surfaces show "Needs a price" (`booking-needs-price` on the Booking
  total) where a fixed price has no range in force.
- Specialties, funding tags and fallbacks (catch-up Phase 18a): `masters-specialties`,
  `masters-funding-tags`, `specialty-sheet`, `funding-tag-sheet`, `surgeon-specialties` (the profile's
  Specialties card), `surgeon-specialties-field` (the surgeon sheet's field), `contract-specialties`,
  `contract-funding-tag`, `contract-placement`, `contract-tag-filter` (the Contracts view's funding tag
  field's wrapper `div`; its select is `[data-shot=contract-tag-filter] select`), `contract-system-notice`, `contract-system-pill` (the "System" pill), and the row marker
  `tr[data-system=openPriceFallback|noContractRvg]`.
- Master data tables: `masters-anaesthetists` (rows `tr[data-anaesthetist=<id>]`, tier pills
  `[data-tier=1..4]`), `masters-surgeons` (rows `tr[data-surgeon=<id>]`), `masters-surgeon-rooms`
  (`tr[data-room=<id>]`), `masters-surgeon-groups` (`tr[data-group=<id>]`), `masters-hospitals`
  (cards `[data-hospital=<id>]`).
- Pages: `surgeon-profile`, `surgeon-hpi-chip`, `surgeon-identifiers`, `surgeon-room-card`,
  `surgeon-groups`; `anaesthetist-record`, `anaesthetist-hpi-chip`, `anaesthetist-details`,
  `tier-card`.
  (`anaesthetist-details` is the Profile card since catch-up Phase 26.)
- Rooms and contacts (catch-up Phase 17a): `surgeon-room-card` is now one per room, each with
  `data-room=<roomId>`, the main room first (with a neutral "Main room" pill when there are several), so
  pick one as `[data-shot=surgeon-room-card][data-room=RM-HILLSBOROU]`; beside each,
  `surgeon-contacts` ("Practice manager and PAs", also with `data-room`; the first carries the one
  provisional mist line), rows `li[data-contact=<id>]`; `room-contact-add`, `room-contact-sheet`,
  `room-contact-remove` (the in-card confirm); on the surgeon sheet `surgeon-rooms-field`; on the room
  sheet `room-sheet-contacts`. Surgeons table: the Rooms cell is `td[data-rooms=<surgeonId>]` (a room
  per line, main first). Rooms table: the email cell `td[data-room-email]`, the Contacts cell
  `td[data-room-contacts-count=<n>]`.
- Pairing section: `pairing-section`, groups `[data-pairing-group=NOT_PREFERRED|PREFERRED]`, rows
  `[data-pairing=<entryId>]`, `pairing-ended` (a `<details>`: click `[data-shot=pairing-ended] >
  summary` to open), `pairing-add-sheet`, `pairing-counterpart` (the select; a taken counterpart's
  option is disabled with `data-taken`), `pairing-preview`, `pairing-end-sheet`.
- Pickers (session 1): `surgeon-picker`, `candidate-picker`, `tier-filter`, `candidates-clear`,
  `candidates-not-preferred` (rows `[data-candidate=<id>]`), and the warnings
  `edit-list-pairing-warning`, `phone-advice-pairing-warning`, `reassign-pairing-warning`,
  `recurring-booking-pairing-warning` (renamed in catch-up Phase 30).
- Day grid: every block button carries `data-list-id=<listId>`, so a recipe opens an exact List's
  drawer with `[data-list-id="L-..."]`. The drawer's surgeon is a link (`drawer-surgeon-link`) to the
  profile.

- Draft Lists (catch-up Phase 31): `admin-draft-lists` (page), `admin-draft-list-drawer`, `admin-draft-lists-rail` (Day rail card, with `admin-draft-lists-see-all`), `admin-assign-draft-list` (sheet; becomes `admin-assign-draft-list-not-preferred` when a not-preferred pick is shown; `draft-list-reach`, `draft-list-candidates`, `assign-draft-list-pairing-warning`, `assign-draft-list-closed-warning`, `assign-draft-list-confirm`), `admin-new-draft-list` (`draft-list-hospital`, `draft-list-surgeon`, `draft-list-date`), `admin-redate-draft-list`, `admin-remove-draft-list`, `draft-lists-table`, `draft-lists-history`, `draft-lists-assigned`, `draft-list-available`, `draft-list-add-booking`, `daygrid-draft-band`, `daygrid-block-count`; nav badge `nav-badge-draftLists`. The List drawer's ACTIVE state is plain text in its subtitle, so highlight `[data-testid=admin-list-drawer] > header`.

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

**Other hooks**

- `[data-aa-mobile-product]`
- `.aa-invoice-doc`
- `[data-sliding-segmented-control]`
- `[data-validation-focus=true]`

## Demo control panel (`/demo/control`) and Demo actions

- Catch-up Phase 36: "Inject unmatched receipt" (`inject-unmatched-receipt`, bar only) on the Ledger, with
  choices `souter` ("Names Dr Souter", the default) and `none` ("Names no one"); pass one with the `trigger`
  step's `"choice"`. Disabled "Resolve the held receipt first" while one is held. `payment-full`,
  `payment-half`, `payment-replay`, `arm-handoff-fault` and `run-archive-job` are also on the Ledger routes; there
  the payment entries' choices are the open receivables with a Xero ACCREC ("AA-2026-0002 · payer · $x"),
  defaulting to the first, and are disabled "No open invoice in Xero" when none is open. `arm-handoff-fault` now
  means the next authorise still makes every pair, marked "Not yet in Xero"; "Trigger billing failure"
  (`billing-failure`) shows the same on Losa Tuilagi's invoice deterministically. The PWA-only
  `pwa-office-runs-payables` ("Office runs payables", office stand-in) on Mobile Balances pays out what is due to
  Dr Souter (disabled "Nothing due to pay out", as it is at reset). There is still no "Run payables" demo action:
  it is the Billing monitor's own button.

- Catch-up Phase 27a: no new demo action. The Payables run has nothing due at reset (Nair's seeded prepayment is
  held in the AA Holding account, never in the run); it is due only once her List is authorised and the transfer
  is written. `payment-full` and `payment-half` are unchanged.
- Catch-up Phase 20: the PWA-only "Office sets this Booking's Contract"
  (`[data-shot=pwa-demo-action-office-sets-booking-contract]`) on a mobile Booking with a Procedure that
  needs an invoice destination sets the List's hospital's first Contract on offer, else No contract ·
  RVG, as the office. "Fire hospital message" now notes the new Booking arrives with no Contract.

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
| S1 · Booking to theatre | Reset only. | On Admin, Matching, import `SAMPLE_STG` and create Sarah Mitchell's Booking (R1, "Create Booking"); she then appears on Souter Tue 28 Jul AM. On the PWA, `matching-office-matches-row` (S1 choice) plays it. |
| S2 · Office day | Reset only. | Admin work. |
| S3 · Money end to end | Reset, then checks both Souter Mon 20 lists are SUBMITTED. | Authorise them in `/admin/review/...`. Billing then gives AA-2026-0005 in Xero (nib, $152.38, its share of the fee-split Booking) and emails every invoice. |
| S4 · Exceptions | Reset only. | Admin Day, then Invoices and Mobile. Beat 1 is the prepayment: Riley's $1,200.00 (Dr Souter's Fri 24 Jul AM, prepaid Rhinoplasty) awaits approval; the office approves and sends it on `/admin/invoices` (Approve and send), the patient pays (`payment-full` / `payment-half`), and Nair is the paid, mixed case whose rhinoplasty is left off the final invoice. |
| S5 · Compliance tour | Reset, three audited edits on David Chen's booking, then authorises Whitaker Fri 17, which raises invoices. | Admin audit and Xero. |

**Demo actions by screen** (`trigger` ids)

| Screen (`goto`) | ids | Notes |
|---|---|---|
| `/admin/billing` | `billing-failure`, `arm-handoff-fault`, `run-reconciliation-poll`, `run-archive-job` | "Trigger billing failure" (re-based in catch-up Phase 25) arms a Xero hand-off fault for Losa Tuilagi's Booking (BK0039) alone and authorises Dr Ropata's Thu 16 Jul AM List (`L-39560-2026-07-16-AM`). Each Booking bills from its locked record: her row (`[data-shot=billing-pipeline-L-39560-2026-07-16-AM] tr:has-text("Losa Tuilagi")`) shows the "Handoff failed" pill, "Xero handoff failed (simulated fault). No ACCREC/ACCPAY pair was created; the invoice stands. ..." and the button "Resolve & retry", which hands her off once, in place (no sheet); Hemi Walker's (BK0040) bills; the List is not failed. No Contract changes; `choose-contract-sheet` is gone. Disabled "Already triggered" once the List is AUTHORISED. A run failure (none staged by this trigger) shows "Retry" and `monitor-retry-note`. "Run payables" is the screen's own product button, `[data-shot=billing-payables-run]`, not a demo action |
| `/admin/invoices/<invoiceId>` | `regenerate-invoice` | Catch-up Phase 25, "Regenerate from locked data". Rebuilds the invoice on screen from its Booking's lock and compares it with the invoice as stored, read-only: the result shows under the Locked record card as `[data-shot=invoice-regenerated]`, `data-identical="true"` with "Regenerated from locked data: identical (n lines, total $x)", or the differences. Disabled on prepayment and AA fee invoices and on an invoice with no lock. Stage an edit first (a Contract edit, a backdated range, a unit-value edit) to show it holds; US-08.4.4 shows the pattern (S3 AM authorise, a unit-value edit, open AA-2026-0002, trigger) |
| `/demo/xero`, `/demo/xero/invoices[/<accRecId>]` | `run-reconciliation-poll`, `run-archive-job` | |
| `/demo/xero/invoices/<accRecId>` of an AA fee pair | `record-fee-payment` | Only on a fee pair; the payment triggers below are hidden there |
| `/admin/billing/aa-fees` | `run-scheduled-fee-run`, `seed-month-of-bctis` | The scheduled run raises the month in the picker as the system actor; "Run monthly fee invoices" is the screen's own product button |
| `/admin/review/L-41267-2026-07-14-AM` or that List's Booking detail | `stage-post-op` | Shown only for Dr Sharma's Tue 14 AM List |
| `/admin/integrations`, Surgeon PDFs tab | `ingest-pdf-row` | Click the "Surgeon PDFs" tab first; the entry shows only there |
| `/admin/invoices/<invoiceId>`, `/demo/xero/invoices/<accRecId>`, `/admin/day/<date>/bookings/<bookingId>` | `payment-full`, `payment-half`, `payment-replay` | Acts on the invoice in the URL; the payable authorises for exactly the amount received. On a Booking detail the choices are that Booking's sent prepayment ACCRECs, disabled "Not approved yet" before approval. After the S3 AM authorise, AA-2026-0002 is the first open invoice; Riley's prepayment invoice once approved on the strip is `XR0001` |
| `/admin/day/<date>` (choice = booking id), `/admin/day/<date>/bookings/<bookingId>` (acts on that Booking), `/mobile/lists/<listId>/bookings/<bookingId>` (PWA) | `prepayment-two-days-before` | Catch-up Phase 27: moves the demo clock to 2 days before the procedure, so the prepayment warning turns strong. On Admin Day use `"choice": "BK0034"`. Forward only; disabled "No outstanding pre-payments" or "Already 2 days or less before" |
| `/admin/day/<date>`, `/admin/day/<date>/bookings/<bookingId>` | `add-prepaid-booking` (choices `one-payer`, `two-payers`) | Catch-up Phase 27: as the office stand-in, adds Fiona Gray on Dr Souter's next ACTIVE List where her prepaid Contracts are offered. `two-payers`: Rhinoplasty $1,200.00 to the patient and Blepharoplasty, upper lids $900.00 to Ian Gray, so two strip rows. With approval off each is sent at once. Disabled "No ACTIVE List for Dr Souter" or "Already added (Reset to repeat)" |
| `/mobile/lists/<listId>/bookings/<bookingId>` (PWA Demo sheet only) | `pwa-office-approves-prepayment`, `pwa-payment-full`, `pwa-payment-half` | Catch-up Phase 27: the office approves and sends this Booking's first ready payer group; the patient pays half or all of its sent prepayment. Not in the framed build's bar |
| `/mobile/lists[...]`, `/web/lists/<listId>/bookings/<id>`, `/admin/day/<date>/bookings/<id>`, `/admin/integrations`, `/demo/integrations` | `fire-hospital-message` (choice: a message id), `replay-hospital-message` | Badged Future scope, **bar only** since catch-up Phase 33 (not in the PWA Demo sheet). It never applies anything: a message stages a row on `/admin/matching` ("Sent ... to matching"), and the Booking changes only once the office decides the row there. On a Booking it defaults to the message addressed to it (MSG-STG-1012 on Foster's `BK0043`). Replay dedupes: no second row |
| `/admin/matching` | `matching-receive-theatre-list` (choice `stg` or `sx`), `matching-send-update` | Catch-up Phase 33, bar only. "Import hospital file" stages `SAMPLE_STG` or `SAMPLE_SX`'s rows as the hospital sending its theatre list (refused once staged). "Send update for a matched Booking" stages a later row for the Booking matched by the selected row, else Diane Foster's `BK0043` (a later time and the hospital's fuller wording), waiting for approval. Recipes usually stage rows through the product's own Import hospital file dialog instead (see Overlays) |
| `/mobile/lists[...]` (PWA Demo sheet) | `matching-office-matches-row` (choice by label: "Sarah Mitchell, Tue 28 Jul AM (S1)", "A new hospital booking on this List", "A hospital update for this Booking, approved by the office") | Catch-up Phase 33, badged Office stand-in, PWA only. The hospital's row arrives and the office decides it with the suggestion, every difference ticked, no Contract picked. On Foster's `BK0043` the hospital's fuller wording replaces WLE MM (US-02.5.7's mobile shot). In the framed build use Admin, Matching |
| `/mobile/lists/<listId>` (PWA Demo sheet only) | `stub-office-adds-nhi` ("Office adds the NHI to this stub") | Catch-up Phase 33a, badged Office stand-in, PWA only. On a List holding a stub, the office adds the NHI its waiting row needs (Mere Tipene `ZQA1024` on `L-34821-2026-08-04-PM`; after the Southern Cross import, Tama Henare `ZQA1008` on `L-34821-2026-07-28-PM`) through the one resolve path, and the Booking takes the stub's place. Disabled on a List with no stub. No choice. |
| `/admin/day/<date>/bookings/<id>` | `hospital-description-arrives` (choice `ar35-row-2`, `-12`, `-20`, `-25`) | Catch-up Phase 20a, bar only, no badge. AR-35's illustrative hospital wording replaces the procedure text through `replaceProcedureText`; defaults to the row paired with the rooms' text (row 12 on Tane's `BK0006`). Disabled when the Booking already holds that text |
| `/mobile/lists/<listId>` | `photo-capture-future` | Badged Future scope. Opens the Add a booking sheet on the simulated photo of a paper card (sample cards) for the List in the URL; disabled unless the List is ACTIVE. Also in the PWA Demo sheet. A saved Booking reads "Added by anaesthetist" |
| `/admin/audit` | `simulate-sign-in` | Five simulated sign-in audit rows |
| `/admin/day/<date>`, `/admin/notifications` | `colleague-moves-list-to-office` (choice `one` or `busy`) | Catch-up Phase 32. A colleague returns one of their Lists to the office as themselves (the date in the URL, or the next with a candidate; vacated Unavailable): a Draft List and `NT0001`. `busy` stages eight moves from today, alternating returns and hand-ons, so the Notifications page has two pages (`NT0008` is a hand-on naming both). Bar only |
| `/admin/day/<date>` | `colleague-hands-booking-to-souter` | Catch-up Phase 32a. A colleague hands one of their Bookings into Dr Souter's free, empty session as a new List, with the office notice ticked (from a reset: Dr Hughes's `BK0140` into her Wed 22 PM; the date in the URL or the next with a candidate). Nothing sets anyone available. Bar only |
| `/mobile/lists`, `/mobile/lists/<listId>`, `/mobile/lists/<listId>/bookings/<bookingId>` (PWA Demo sheet) | `colleague-moves-booking-to-me` (choice by its label, e.g. "Dr Hughes · Wed 22 Jul PM · Christchurch Eye Surgery") | Catch-up Phase 32a, badged "Colleague stand-in". A colleague hands her one Booking as a new List in a session she is free in; a session she is not available in (Fri 31 Jul AM, `BK0162`) is offered once she sets it available. PWA only |
| `/mobile/availability/calendar` (PWA Demo sheet, after a day has been opened and closed in My calendar: it acts on the last day opened) | `availability-office-sets-public` ("Office sets this session to Public", `[data-shot=pwa-demo-action-availability-office-sets-public]`) | Catch-up Phase 32d, PWA only (port 5374). Acts on the AM or PM of the open day: the office sets that session to Public. |
| `/mobile/availability` (PWA Demo sheet) | `colleague-moves-list-to-me` | Catch-up Phase 32, badged "Colleague stand-in". A colleague hands a List into Dr Souter's free session (from the pristine seed, Morrison's Wed 22 PM Southern Cross into her Wed 22 PM); the Moved to you panel and Forward Lists' "New" follow. PWA only |
| `/admin/day/<date>`, `/admin/conflicts` | `simulate-sickness` (choice: `<listId>|office` or `<listId>|colleague`) | Catch-up Phase 30, re-pointed in 32b. The office records a phoned-in sickness on the chosen List's session (Unavailable, note "Unwell, short notice (phoned in, simulated)") and, in the same step, the List goes back to the Draft Lists or to the first open colleague in the office's order; never a conflict. Choices are the day in the URL (on Conflicts, today), Lists with Bookings first. Disabled "Already unavailable" on a closed session. Bar only |
| `/admin/day/<date>`, `/admin/draft-lists`, `/admin/conflicts` (only while an Assign or Reassign picker is open) | `ask-colleague-make-available` (choice: a closed session id) | Catch-up Phase 32b, badged Colleague stand-in. Plays the anaesthetist freeing their own closed, empty session (Free, as themselves), so the picker row becomes assignable. Shots use the inline copy on the row, `[data-candidate-closed=<reg>] [data-shot=demo-action-ask-colleague-make-available-inline]`, since the dialog's scrim covers the bar. |
| `/mobile/lists` (PWA Demo sheet) | `office-adds-out-of-hours-list` | Catch-up Phase 32c, badged Office stand-in, PWA only. Opens Dr Souter's out-of-hours session for tonight (18:00 to 21:00) and assigns a List at the hospital and with the surgeon of her latest List; disabled while one is open tonight. In the framed build use Open out-of-hours session on Admin Day instead. |
| `/mobile/lists/<listId>/bookings/<bookingId>` (PWA) | `office-approves-contract-change` | Catch-up Phase 21a, badged Office stand-in, PWA only ("Office approves this Contract change"). Approves the Contract the anaesthetist changed on the Booking, as Approve on Review would, so `contract-approval-status` turns from "Awaiting office approval" to "Approved by the office <time>". Disabled when the Booking has no pending change (true of every Souter Booking at reset: change a Contract on the Billing sheet first). In the framed build use Approve on Admin Review. |
| `/mobile/lists/<listId>`, `/mobile/lists/<listId>/bookings/<bookingId>` (PWA) | `office-resolves-alert` | Catch-up Phase 32b, badged Office stand-in, PWA only. Ticks the viewed List's or Booking's open alert resolved as the simulated office, so the handset shows "The office has dealt with this". Disabled with no open alert. |
| `/web/lists/<listId>`, `/web/lists/<listId>/bookings/<id>`, `/admin/day/<date>/bookings/<id>`, `/mobile/lists/<listId>[/bookings/<id>]` (bar and PWA) | `load-multi-procedure-booking` | Catch-up Phase 23, "Load 3-procedure Booking (7 modifier units)". Adds the three-procedure worked example (the same spec as the seeded BK0184) to Dr Souter's next open List, Wed 22 Jul AM (`L-34821-2026-07-22-AM`) on a fresh seed, as `BK0191` (BK0190 is the Phase 25a seeded `disabledContractBooking`; catch-up Phase 24's five seeded Bookings took BK0185 to BK0189; BK0185 is now the seeded `discountBooking`), not marked complete; result "Loaded on Dr Souter's ... List: 3 procedures, 7 modifier units, split 3 · 2 · 2." Disabled "Already loaded" on a second run. Open it at `/web/lists/L-34821-2026-07-22-AM/bookings/BK0191` or `/admin/day/2026-07-22/bookings/BK0191` |
| `/web/lists/<listId>/bookings/<id>`, `/admin/day/<date>/bookings/<id>`, `/mobile/lists/<listId>/bookings/<id>` (bar and PWA) | `feed-changes-primary` | Catch-up Phase 23, "Hospital feed changes the primary". Shown only on a Booking with two or more Procedures: the List's hospital feed makes the next Procedure the primary, audited as an integration; it moves to the top with the Primary pill and base units come from it ("... made ... the primary. Base units now come from it."). Disabled on a SUBMITTED List ("A hospital feed cannot change a submitted List"), so not on BK0184 or Holt: run it on Ellison after "Add another procedure", or on BK0191 after `load-multi-procedure-booking` |
| `/admin/masters?view=contracts` (or with Merivale's Face lift open in its detail) | `demo-backdated-range` | Catch-up Phase 24, "Demo: add a backdated price range" (`[data-shot=demo-action-demo-backdated-range]`). Shown on the Contracts view, disabled "Already added" once run; run it from the list (the Contract detail panel is modal, so the bar cannot be clicked while it is open). Adds a range from 1 Jul 2026 at $3,300.00 as the office: the unedited Face lift BK0163 then prices at $3,300.00; BK0187 (typed $2,950.00), BK0188 (AUTHORISED, $3,100.00) stays; the prepaid BK0038 is on another Contract and so never moves. Disabled "Already added" on a second run. Stage it with the `trigger` step, then `goto` the Booking (US-05.2.8 shows the pattern) |
| `/admin/day/<date>`, `/admin/day/<date>/bookings/<bookingId>`, `/mobile/lists/<listId>/bookings/<bookingId>` | `raise-sample-warnings`, `clear-sample-warnings` | On the Day view they stage (or undo) every rule's sample on Dr Rutherford's Tue 21 Jul Bookings (`BK0119`, `BK0121`: the prepayment and base-units samples); on a Booking, on that Booking (seeded Bookings only). Four rules since catch-up Phase 21: the child payer sample stages on the Booking on screen when its patient is under 18, otherwise on Grace Park's (BK0033: Hana Park out, the patient in); the approval number sample on the Booking on screen when it names an insurer, otherwise BK0074 (its number cleared). Catch-up Phase 22 adds a fifth, `splitDoesNotFit`: on the Booking on screen when its seed carries a split, otherwise the fee-split Booking BK0025, nib's share raised to $250.00 so the rest has nothing left. A Booking whose fee is split cannot take the prepayment sample. Clear restores them. Also in the PWA Demo sheet on a mobile Booking |
| `/admin/ledger`, `/admin/ledger/anaesthetists/<id>` | `inject-unmatched-receipt` (choice `souter` or `none`), `payment-full`, `payment-half`, `payment-replay` (choice: an open receivable's ACCREC id), `arm-handoff-fault`, `run-archive-job` | Catch-up Phase 36, bar only. The $120.00 unmatched receipt puts the ledger out of balance (see "Internal ledger" under Seed data); US-13.2.1 and US-08.3.4 show the pattern (`goto` `/admin/ledger`, then the trigger in `setup`). The payment entries land the receipt in the ledger first, then Xero, and the ledger stays in balance |
| `/mobile/balances` (PWA Demo sheet only) | `pwa-office-runs-payables` | Catch-up Phase 36, badged Office stand-in. Runs the payables for Dr Souter; Balances' "Paid out" rises by what was due. Disabled "Nothing due to pay out" until a payment has been received |

The PWA-only entries (`office-authorises-list` on a mobile List, `office-clears-warning` on a
mobile Booking with an open warning, `office-assigns-next-free` on the mobile Lists home (catch-up
Phase 28: assigns St George's · Mr T. Hale to Dr Souter's next free session, Wed 22 PM on a fresh
profile), all badged as the office stand-in, `pwa-payment-full` and
`pwa-payment-half` on Balances) are in the handset's Demo sheet, not the bar. On a mobile shot,
use the same `trigger` step (mobile shots hide the Demo chip, as desktop shots hide the bar; the
step shows it while it runs). "Play the office" is off on a fresh profile, so a submitted List waits
until `{ "trigger": "office-authorises-list" }` runs (US-07.4.1 and US-08.6.1 show the pattern).

**Integration simulator** (`/demo/integrations`)

- **Feeds:** St George's (HL7 v2), Christchurch Public (HL7 v2) and Southern Cross (FHIR-native).
- **Messages never apply anything (catch-up Phase 33).** A message that parses stages a row on
  `/admin/matching`, and the Booking changes only when the office decides that row. Pane 3
  (`[data-shot=integrations-schedule-change]`) reads "Sent to matching". There is no manual-intervention
  status or park code anywhere; the Integrations monitor's attention callout (`integrations-attention`)
  shows dead-letter only.
- **Messages:**
  - MSG-STG-1001: "S12 · New booking" (Sarah Mitchell). Selected by default.
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
- **After a replay,** `/admin/integrations` shows the message log. Use a `setup` that replays,
  then set `start` to `/admin/integrations`. To show a message's row, set `start` to `/admin/matching`
  instead (US-02.5.4 fires MSG-STG-1014 from `/admin/integrations` in `setup`, then opens Matching).

**Data inspector** (`/demo/data`)

- Seeded scenario finder, audit trail ("Choose a booking"), lifecycle states.
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
- **PWA office simulation.** On :5174, a list submitted on mobile is auto-authorised and billed
  4s later. Shoot the submitted state within that window, or shoot it on web.
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

## Worked examples

- `recipes/US-14.1.1.json`: a simulator shot with two states (received, then applied), plus an
  admin shot whose `setup` replays a message on the simulator first.
- `recipes/US-01.2.1.json`: mobile and web shots, with a before and after state, and `partial`
  with a reason.
- `recipes/US-02.1.1.json`: an admin shot with two states (inbox, then review), and `partial` as
  the nearest analogue.
