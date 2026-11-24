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

## Layout decisions

The owner asked for the open questions to be answered on design grounds. The palette, type and
components are fixed by `docs/design/` and `src/theme/`. These rules cover only the free axis: how a
page uses the screen.

### Who it is for, and the stance this leads to

The users are AA's office staff. They spend the whole working day in this app on a desktop, moving
between queues: triage a row, act on it, move to the next. Most pages are lists to work through, not
documents to read. That leads to one stance:

**The Admin app is an instrument panel, not a document.** Every page is shaped like the Day view, the
page the office already lives in. The title and controls stay where they are, the work fills the rest
of the window, and the page itself never scrolls. That shape is the one memorable choice. Everything
around it stays quiet: one left edge, one right edge, one rail width, one place for each kind of
control.

### Q1. Records fill the width. Text keeps a measure, containers don't.

The owner wants pages to use the space, so records get no page cap. Width is still a problem for
**reading**: a label and its value 1,200px apart, or a paragraph 1,000px wide, is hard to read. So
the limit goes on the content, not on the page:

- **Prose** (intros, captions, explanations) stops at about 75 characters (`maxWidth: '75ch'`), within
  the under-80 rule.
- **Label and value lists** (`DefList`) flow into columns of at least 320px (`repeat(auto-fill,
  minmax(320px, 1fr))`). A wider screen shows more columns side by side, never longer rows.
- **Stat tiles** sit in an auto-fill grid with a 200px minimum, as the Patient record already does.
- **Tables** span their card.
- **Forms** keep one named form width (`ADMIN_FORM_WIDTH`, about 560) wherever they appear
  (Validators, AA fee settings, Schedule settings, the threshold card), so a narrow form is a choice,
  not an accident of the page.

A record is a main column plus the standard rail (below), both filling the width.

```
| nav | ‹ Back to Invoice AA-S-002568                                       |
|     | Dean Wells   NHI YRA9301                      [Draft update email] |
|     | ┌──────────── main (fluid) ───────────────┐  ┌── rail 412 ──┐      |
|     | │ Procedure  …                             │  │ Booking total│      |
|     | │ Billing    …   (label/value in columns)  │  │ Patient      │      |
|     | │ Times · Units · Procedures (tables span) │  │ Notes        │      |
|     | └──────────────────────────────────────────┘  └──────────────┘      |
```

### Q2. Every list page fits the window. The card hugs short lists.

Fitting the window keeps the title, toolbar, column headers and pager in the same place on every list,
which is what the office reaches for. Only doing it for long lists would make the same controls move
from page to page. The worry with short lists (Conflicts has 6 rows, Notifications is often empty) is
a tall empty card. The answer is that **the card's height is "up to the window", not "the window"**
(`maxHeight`, with the body scrolling once it reaches it). A six-row list looks as it does today, and
a 2,570-row list gets a fixed header and toolbar, a sticky column header and the pager in the card
footer. The Day view keeps its full-height canvas, because its grid is a timeline and not a list.

Three rules follow from "the table owns the page's height":

1. **Above the card go only the title row, the tabs (if any) and one toolbar row.** Anything else
   moves into the page's rail. On Invoices, "Awaiting approval" becomes rail cards, the same way the
   Day rail already shows "2 pre-payments". "Recently billed" leaves Invoices, where it repeats the top
   rows of the table, and sits in the Review queue's rail.
2. **A list table fits 1,008px with no sideways scroll** (the content width on a 1280 laptop). Each
   table names one or two flexible text columns (patient, procedure, reason, note) that take up any
   spare width. Every other column is sized to its content and doesn't wrap. Where 1,008px is too
   narrow, columns are merged; for example, Invoices' "Kind" becomes a pill on the number for credit
   notes.
3. **The rows area is never shorter than 360px.** At 1280x720 that holds with a single toolbar row,
   which is another reason for rule 1.

Billing monitor is not a list. It is a dashboard of about 23 grouped tables, and its 15,600px length is
a content problem. It uses the fluid mode, with its anaesthetist groups collapsed by default. That is a
separate change.

### Q3. Documents align left, at their paper width.

A centred invoice moves the page's left edge 300px to the right of every other page at 1920 (look at
where the "Invoices" crumb lands), and that jump is the inconsistency the owner noticed. The invoice
keeps its fixed paper width (760; it prints at that width) and starts at the common left edge. The
side panel sits beside it at the standard rail width (412 instead of 264; at 264 the delivery email
breaks over three lines). On a wide screen the space to the right of the panel stays empty: it is the
desk the paper lies on. This is the one mode where empty space is right. The same rule applies to the
credit note and the remittance advice.

### The page frame (one component, three modes)

```
| nav | Title  count                                         [Primary action] |  title row
|     | One-sentence intro, at most 75ch                                       |
|     | Tab  Tab  Tab                                                          |  routed views only
|     | [All hospitals ▾] [From today ▾] [Search…]                2,570 items |  toolbar
|     | ┌───────────────── card (fit) ──────────────────┐  ┌── rail 412 ──┐   |
|     | │ COLUMN  COLUMN  FLEX COLUMN ………… COLUMN       │  │ context cards│   |
|     | │ rows scroll here                               │  │ (optional)   │   |
|     | │ …                                              │  │              │   |
|     | │ legend / notes            « ‹  1 of 52  › »    │  └──────────────┘   |
|     | └────────────────────────────────────────────────┘                     |
```

- **Modes:** `fit` for list pages, `fluid` for records and dashboards, and `document` for the invoice,
  credit note and remittance. A screen picks a mode and never sets its own `maxWidth` again.
- **Edges:** one left edge (the content inset) for the back link, title, toolbar and card on every
  page. One right edge (the inset from the window's right) for every mode except `document`.
- **Rail:** one width, `ADMIN_RIGHT_RAIL_WIDTH` (412), on every page that has one: the Day view,
  Review queue, Invoices, Booking, Patient and Anaesthetist records, and documents. Below 1440 wide the
  rail narrows to 320, so the 1280 laptop keeps a usable grid.
- **Title row:** `PageHeader` size `admin`. The page's single primary action sits on the right at
  `Button` `desktop` size (44), never the touch size. "New Draft List" shrinks to it. A count sits
  beside the title (Notifications already does this).
- **Intro:** one sentence, at most two lines, capped at 75ch by `PageHeader` itself. The per-screen
  `subStyle` widths go. The longer explanations (Billing monitor, Ledger, Matching's sample-file note)
  move to the info popover the Day view uses, or into the rail.
- **Tabs:** `LineTabs` for routed sub-pages only. Patients' three views move from the segmented control
  to tabs. Filtering the rows on the page is `FilterPills` (Matching's Open, Unmatched and Decided move
  to pills, which also fixes the wrapped labels). The segmented control stays for a mode switch inside
  one view (the Day view's roster order, the Ledger's scope).
- **Toolbar:** a single row of compact (36) controls. Each select names itself through its value ("All
  hospitals", "From today") with a visually hidden label, so there are no eyebrow labels above fields:
  those cost a row of height in `fit` and add a label the value already gives. Date ranges carry a short
  inline label ("From", "To"). The result count sits at the toolbar's right edge. The pager lives in the
  card footer, as on the Day view.
- **Going back:** one `BackLink` above the title on every detail page, named for where the user came
  from ("‹ Invoice AA-S-002568", "‹ Anaesthetists"). A breadcrumb would claim a hierarchy that
  cross-links (a Booking reached from an Invoice) don't have. The hand-built crumbs on Invoice, Credit
  note, Review and Patient record go, and the Breadcrumb in the backlog's shared-components item falls away when this lands.
- **Shell:** the side nav is sticky, one window high, so Help and the persona chip are always visible.
  The minimum width drops from 1320 to 1280, the width of a 1080p laptop at 150%.

### Check

Add a Playwright pass that, for every side-nav page at 1280x720, 1536x864, 1920x1080 and 2560x1440,
asserts:

- the page root reaches the right edge (except `document`)
- `main` has no sideways overflow
- no list table scrolls sideways at 1280
- the page itself doesn't scroll in `fit` mode
