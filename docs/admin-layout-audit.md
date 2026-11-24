# Admin page layout audit

An investigation (25 November 2026) ahead of the work that brings every Admin Web App page into one
layout. No code changed. Target: desktop only. It must work on a 1080p laptop (a CSS width of 1280 to
1536 after OS scaling) and use the room on bigger screens, the way the Day view does.

Method: read the shell (`apps/admin/AdminApp.tsx`, `layout.ts`, `SideNav.tsx`, `routes.tsx`) and the
outer container of every screen, then screenshotted and measured every side-nav page in the dev server
at 1920x1080, 1536x864, 1440x900 and 1280x720 (root width, widest table, horizontal overflow, page
height). Paths are relative to `aa-prototype/src/`.

## How the shell lays pages out today

- `AdminShell` (`apps/admin/AdminApp.tsx`) is a flex row: a 216px `SideNav`, then one content
  column with 24px/28px padding (`ADMIN_PAGE_HORIZONTAL_PADDING`) and a 16px gap. **The shell sets no
  width rule.** Each screen picks its own on its outer `<div>`.
- Only the Day view uses the window height (`fitsWindow`, the `useMatch('/admin/day/:dateISO')`
  check): the page stops scrolling, the grid scrolls its rows inside the card, and the rail scrolls
  on its own. Every other page scrolls the whole page.
- The shell has `minWidth: 1320`. The two mockups are fixed frames (Admin Day 1320px, Admin Review
  1280px) with a 216px nav. That leaves about 1008 to 1048px of content, which is where the 1048
  and 1080 caps came from. The mockups never showed a wider screen, so nothing set a rule for one.

## Finding 1: five width modes, chosen screen by screen

| Mode | Pages | Where it is set |
|---|---|---|
| **Full width** | Day view, Intake (all four tabs), Draft Lists, Conflicts, Review queue, Review detail, Invoices list, Ledger, Booking detail | `width: '100%'` or no cap |
| **Capped at 1080, left** | Notifications, Billing monitor, AA fees (both tabs), Audit, Payment run, Anaesthetist and Surgeon records | `maxWidth: 1080` in each screen; `ProfileChrome.tsx:15` for the records |
| **Capped at 1180, left** | Patients (Search, Waiting for NHI, Follow-up), Master data | `PatientsScreen.tsx:91`, `MasterData.tsx:55` |
| **Capped at 1280, left** | Patient record | `PatientRecord.tsx:62` |
| **Centred at 1048** | Invoice, Credit note, Remittance advice | `InvoiceDocument.tsx:151,985`, `routes.tsx:309`, `PaymentRunScreen.tsx:235-238` |

At 1920 the content column is 1648px wide. A capped page therefore leaves 470 to 570px of empty
space on its right. Moving between neighbouring nav items makes the right edge jump: Conflicts fills
the width, Notifications stops at 1080, Review queue fills, Invoices fills, Patients stops at 1180,
Billing monitor stops at 1080, Ledger fills, Master data stops at 1180, Audit stops at 1080. The
invoice is the only page centred in the column. Billing monitor, Ledger and AA fees are one family
of pages, but they use two different widths.

Some caps sit inside pages, on top of the page's own width: Validators 720 (`ValidatorsTab.tsx:20`),
AA fee settings 680, the Patient balance threshold card 560, the Reference views cards 560, and the
Data quality intro 820.

## Finding 2: capped pages squeeze wide tables even on big screens

- **Master data at 1920:** the anaesthetists table needs more room than its 1180 cap minus the
  190px sub-nav. Names and emails wrap onto two or three lines, and the right-hand column is cut
  off behind a horizontal scroll, while 470px of the screen sits empty. This is the worst case.
- **Audit at 1920:** the table is held to 1080. Names and the "role · source" column wrap onto two
  lines.
- **Invoices at 1440:** the table is wider than the column (1460px). Layout, Total, Delivery and View
  hide behind the table's horizontal scroll (`TableShell` `overflowX: auto`).
- **Matching at 1440:** the table is 1180px in a 1168px column, so it is just too wide.

## Finding 3: only the Day view fits the window; long pages scroll away their controls

Measured page heights at 1920: Billing monitor 15,600px (23 tables), Audit 5,600, Master data 5,000,
Invoices 3,750, Draft Lists 4,200, Ledger 2,800. The title, filters and pager scroll off the top.
Table headers are not sticky. The Day view's pattern (header and pager fixed, rows scrolling inside
the card) is the obvious one to reuse for these list pages.

## Finding 4: the shell itself, on a laptop and on long pages

- **1280px wide (a 1080p laptop at 150% scaling):** `minWidth: 1320` makes the whole app scroll 40px
  sideways, and the Day view's rail is cut off at the right edge. At 1536 (125% scaling) everything
  fits, but the Day view grid shrinks to about 620px of timeline.
- **The side nav scrolls with the page.** Its column grows to the page's height, so on any long page
  Help, Roles and the persona chip end up thousands of pixels down. In the Patients screenshot at
  1920 they are off screen. The nav should stay fixed to the viewport.

## Finding 5: the same job built in different ways from page to page

- **Sub-view switches:** routed sub-pages use `LineTabs` in Intake, Review queue, Draft Lists and AA
  fees. Patients' three routed views use a `SlidingSegmentedControl` instead. Ledger's scope uses a
  segmented control, Matching's Open/Unmatched/Decided filter uses a segmented control, and the
  Billing monitor and Ledger pairs use `FilterPills`. Matching's segmented labels wrap ("Unmatched ·
  1" on two lines) at 1920.
- **Going back:** some pages show a breadcrumb trail (Invoices / AA-S-002568, Patients / Abena Nkosi,
  the credit note). Others use a `BackLink` (‹ Anaesthetists, ‹ Invoice AA-S-002568 on a Booking).
- **Filter bars:** Conflicts uses unlabelled selects with no count. Billing monitor and Audit use
  eyebrow-labelled fields with a mono count after them. Invoices puts a labelled search on the left
  and the count and pager on the far right. The Day view's pager sits in the card footer instead.
- **Intro sub-line width:** each screen sets its own `subStyle` maxWidth (720, 760, 780 or 820). The
  Billing monitor sets none, so its intro runs about 1070px wide.
- **Header actions:** "New Draft List" is a large primary button in the title row. Matching's
  "Import hospital file" sits beside a second-level heading. Master data actions sit in a
  section-size header.
- **Record pages:** Booking detail is a fluid main column plus a rail of about 540px. Patient record
  is a 3/4 + 1/4 grid capped at 1280. Anaesthetist and Surgeon records are a two-card grid capped at
  1080. Review detail is fluid. Invoice is a 760 + 264 document centred in the column. The right-hand
  panels come in four widths: the Day rail (`ADMIN_RIGHT_RAIL_WIDTH`), Booking's rail, Patient's
  details card and Invoice's 264 side panel.

## Finding 6: what is already shared and can carry the fix

- `PageHeader` (`shared/ui/PageHeader.tsx`, size `admin`) is already used by every page. It is the
  natural place for a default width on the intro sub-line.
- `TableShell` (`shared/table/TableShell.tsx`) is used by every table, so a sticky header or a
  scroll-inside mode can be added once there.
- `layout.ts` already holds the page padding and the rail width as named constants. It is the
  natural home for page-width modes.
- The Day view's fit-window plumbing (`fitsWindow` in `AdminApp.tsx`, the `flex: 1` /
  `minHeight: 360` body in `routes.tsx`, the DayGrid footer pager) proves the pattern works in this
  shell.
- `docs/DECISIONS.md` and `docs/BACKLOG.md` contain no ruling on page width, so nothing settled
  stands in the way.

## Suggested direction (not yet decided)

1. **One page frame for Admin** (an `AdminPage`, owned by `apps/admin/` or `shared/ui/`). It holds
   the header, the optional tabs row, a toolbar row (filters on the left, count and pager on the
   right) and the body. It has three modes, and screens stop setting their own maxWidth:
   - `fit`: the Day view's behaviour. The page is one window high, the header and toolbar stay in
     place, and the table body scrolls inside its card with the pager in the footer. Use it for the
     list pages: Draft Lists, Conflicts, Notifications, Review queue, Invoices, Patients lists,
     Audit, Master data tables, Ledger pairs, Matching.
   - `fluid`: full width with the page scrolling. Use it for dashboards and records: Billing
     monitor, Ledger summary, AA fees, Booking, Review, Patient, Anaesthetist and Surgeon records,
     each as a main column plus one standard right rail width.
   - `document`: the paper and side panel, centred. Keep it for Invoice, Credit note and Remittance,
     where a printed-page shape is the point.
2. **Prose keeps a readable measure. Containers do not.** `PageHeader` caps the intro sub-line at one
   default width (about 760), and the per-screen `subStyle` widths go away. Forms and settings cards
   that should stay narrow (Validators, AA fee settings, Schedule settings) keep a named form width
   inside the fluid page, so the narrowness is a deliberate choice and not an accident of the page
   width.
3. **Shell:** make the side nav sticky, at the viewport's height. Lower `minWidth` so a 1280-wide
   laptop does not scroll sideways (for example by letting the Day rail narrow or collapse below
   about 1360).
4. **Pick one idiom per job:** `LineTabs` for routed sub-pages (Patients moves to tabs), and
   `FilterPills` or the segmented control only for filtering the list on the page. Choose either a
   breadcrumb or a `BackLink` for detail pages, and use one filter-bar layout everywhere.
5. **Check at 1280x720, 1536x864, 1920x1080 and 2560x1440.** A Playwright pass that measures each nav
   page's root width and horizontal overflow, as this investigation did, would catch any regression.

Questions for the owner when the work starts: should records go fluid or keep a comfortable cap
(about 1400) on very wide screens? Should every list page go to `fit`, or only the long ones? Should
`document` stay centred or align left like everything else?

