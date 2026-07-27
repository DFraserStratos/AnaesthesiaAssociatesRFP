# Review 01 - Introduction, NFRs, Data Volumes and the Appendix 3 to 5 screen expectations

**RFP source:** `docs/rfp-reference/RFP.md` lines 180-376 and 2002-2041 (plus lines 378-456, marked
N-A below)
**Reviewed:** 2026-07-27
**Lens:** demo-readiness (see `00-SUMMARY.md` for method)
**Note:** MISSING / PARTIAL claims in this file are unverified. `00-SUMMARY.md` carries the
adjudicated verdicts after the adversarial pass.

## What this slice actually asks for

Appendices 3 to 5 are captioned screenshots in the RFP PDF, not text, so the extracted `RFP.md`
carries only their captions. I pulled the eight embedded appendix images out of
`docs/rfp-reference/Anaesthesia Associates Request for Proposal[Final].pdf` and read them, so the
comparisons below are against the actual legacy screens, not the captions:

- **Appendix 3** (one 4-panel image): `Forward Lists` (day-grouped list rows: anaesthetist,
  hospital, times, chevron; Week / Prev / Month / To Do / Done tabs; filter control) to `Cards for
  one list` (patient + operation rows, `+ Add`) to `Single Card (scrolls)`: List, Surgeon, Patient
  (Name, Email, NHI, DOB, Address, Ph:P / Ph:B / Ph:M), Operation, Int Comment, Contract, Insurance,
  `Delete Card`, `Copy this card`, then `Outcome`: ASA, RVG Code, Contract Procedure, Start + Start
  Now, Finish + Finish Now, Minutes, B / T / M steppers, Total Units, Adj $, Charge $, Int Notes, Op
  Notes, Completed toggle.
- **Appendix 4**: the one-day dashboard. Anaesthetist rows (A to Z, some names red) x hour columns
  7 to 18, two coloured session blocks per row carrying surgeon/hospital/annotation text
  ("Kuruvilla Forte cancelled PM only - per email 20.04"), the six-status legend, a mini calendar,
  Today / 1 Week / 4 Weeks / Unknown navigation, a scratch box, an `Internal notes` box, and a
  "1 of 3" pager.
- **Appendix 5** (four images): `Dashboard` (Welcome + holiday Notes line, legend, week grid of
  time rows x 7 date columns, `Receivables` Current / 1 mth / 2 mths / 3 mths, `Productivity`
  30 Days / 60 Days / 6 Months x Amount / Last year / 2 years ago, `Leave Bookings` From/To,
  `Unassigned Anaesthetists (next 5 days)` with Date / Time / Anaesthetist / **Mobile**); `Lists`
  (From/To date range, Date / From / To / Description + status colour, legend); `Availability`
  (per-anaesthetist AM and PM rows with times + annotation, legend); `Overdue List` (Patient,
  Contract, Surgeon, First Acct, Final, V.O'due, O'due, Current, ACC Status, ordered by date).

## Coverage table

| # | RFP feature or rule | Req ID | Status | Where in the app | Evidence |
|---|---|---|---|---|---|
| 1 | Background, who should respond, the 5-step approach, timeline, confidentiality/NDA, RFP contact, "bring a Solution Architect" | - | N-A | not a system feature | `docs/rfp-reference/RFP.md` lines 180-278 (process and commercial content) |
| 2 | RFP response asks: Service Provider Information, Solution Overview, Client References, Innovation / Value Add, Approach & Methodology & Timeline, Scoping/Design Phase, Commercial Approach & Indicative Costs | - | N-A | belongs in the written proposal, not the prototype | `docs/rfp-reference/RFP.md` lines 378-456 |
| 3 | "Approach to Requirements" - Candidate Architecture framing | - | N-A | framing for the whole build | `docs/rfp-reference/RFP.md` lines 371-376 |
| 4 | "A scheduling application that then extends into timesheet capture and billing" | P2 · D1 · M4 · B1 | BUILT | all three apps behind one switcher | `m-02-list.png` (schedule/cards), `m4-01-fee-panel.png` (timesheet + fee), `a7-02-review.png` (billing review) |
| 5 | Rolling 4-month forward window of availability/engagements | D1 | BUILT | canvas generator + demo clock | `src/domain/clock.ts:87` (`HORIZON_FUTURE_MONTHS = 4`), `src/store/canvasRoll.test.ts` (roll-forward deep-equal) |
| 6 | Booking iteration between surgeons' rooms, hospitals and anaesthetists via AA, with changes right up to the day | D3 · A2 · I1 | BUILT | admin day view edits + HL7/FHIR feeds | `a-01-day.png` (office day + internal notes), `demo-integrations.png` (S12/S13 replay onto the schedule) |
| 7 | "Cards" as the industry vocabulary | P9 | BUILT | everywhere | `m-02-list.png` ("Add a card"), `a7-07-audit.png` (`card.complete`, `list.submit`) |
| 8 | Modern integrations as a key goal to cut manual workload | I1 to I3 | BUILT | integration simulator + monitor | `demo-integrations.png` (per-feed mapping chips, replay, auto-retry message) |
| 9 | Invoices generated from Card information once capture is done and the office has checked, then sent to Xero | B1 · B6 · X2 | BUILT | billing run on AUTHORISED | `src/store/billingRun.test.ts:143` ("audits the whole run source=system and never stamps a locked card"), `a7-02-review.png` (the office check) |
| 10 | Anaesthetists operate primarily on mobile, with a similar web app | P2 · P4 · W2 | BUILT | phone frame + desktop web app | `m-01-home.png`, `w-02-lists.png`, `w-03-list-detail.png` |
| 11 | Mobile app displays the calendar, the Cards and procedure details | M1 to M3 | BUILT | Forward Lists to List to Card slide stack | `m-01-home.png` (Week/Month/To-Do/Done), `m-02-list.png`, `m-03-card.png` |
| 12 | Time-sheeting function capturing time and charge details for each Procedure | M4 · B3 | BUILT | shared BTM capture suite | `m4-01-fee-panel.png` (modifier chips, total units, fee at $26.50/unit, Adjustment/Charge), `src/shared/capture/BtmCaptureBlock.tsx` |
| 13 | Displays the availability of other anaesthetists where swaps are needed | M8 · W3 | BUILT | mobile Availability + web grid | `m-05-availability.png`, `w-06-availability.png` |
| 14 | "Provision should be made to allow attachments to the schedule records" | M3 | BUILT | Card-level attachments (photo/PDF, rendered inline) | `m-03-card.png` (ATTACHMENTS + Add photo), `src/shared/card/CardDetailBody.tsx:385-400`. Card-level only; no List-level attachment slot |
| 15 | Admin web app: views and permissions for oversight, handling manual changes from hospitals and surgeons' rooms | A1 · A2 | BUILT | one-day dashboard, drill-down, office edits | `a-01-day.png`, `a-04-card.png` (office card detail with Edit affordances) |
| 16 | Admin web app: validating Card entries for billing | A4 | BUILT | Review queue + sanity-check screen | `a7-02-review.png` (Route / Contract / Code / Times / B·T·M / Units / Fee / FLAGS, "No billing reference" flag) |
| 17 | Reporting: Outstanding Balances lists | M11 · W4 | BUILT | mobile Balances + web Accounts | `w-09-overdue.png` (flat, one row per ACCPAY, no rollup), `src/store/selectors.ts:658` (`outstandingAccpayInvoicesFor`) |
| 18 | Reporting: monthly activity summaries | M11 | BUILT | Accounts to GST activity, Monthly / Bi-monthly / Six-monthly | `w-10-gst.png` (per-receipt rows with GST component + period total) |
| 19 | NFR: intuitive UX, ease of use for users not comfortable with modern IT | N1 · P8 | BUILT | whole prototype; mobile-first patterns per convention 16 | `m-01-home.png` (large tap targets, chips, bottom tabs), `w-01-dashboard.png` |
| 20 | NFR: robust, flexible interfaces so data is entered once and stays current everywhere | I1 to I3 · D8 | BUILT | mapping-driven HL7 to FHIR, shared patient upsert, Xero handoff | `demo-integrations.png` ("Her NHI matches an existing record, so intake reuses it, no duplicate"), `src/store/intake.ts:52` (`upsertPatient`) |
| 21 | NFR: controls around view, access and edit rights | A8 | BUILT | persona-scoped apps + roles panel | `src/apps/admin/RolesInfo.tsx:20-40` (view + edit per role), mounted at `src/apps/admin/components/SideNav.tsx:84` |
| 22 | NFR: access rights managed by role, not per individual user | A8 | BUILT | `Actor.role` drives every guard; four roles enumerated (anaesthetist, office, integration, system) | `src/apps/admin/RolesInfo.tsx:20-40`; the role/source matrix is guard-tested in `src/store/lifecycle.test.ts:257` ("office may cancel on SUBMITTED, integration only on DRAFT, nobody on AUTHORISED") |
| 23 | User/role administration screens (assigning users to roles) | §10 | OUT-OF-SCOPE | none | `REQUIREMENTS.md` §10 excludes real authentication/accounts (persona switcher instead) |
| 24 | NFR: audit trails of manual **and automated** actions | N3 · A7 | PARTIAL | append-only audit + admin Audit viewer | `a7-07-audit.png`; automated trail pinned by `src/store/billingRun.test.ts:143`. Viewer lists in reverse insertion order, not chronological order (finding 01.3) |
| 25 | Data volumes: ~85 anaesthetists | P10 · N4 | BUILT | 14-person demo cast, generator proven at 85 | `src/store/canvasRoll.test.ts:198` (85 x full horizon, invariants intact, under 2s); `a-01-day.png` footer ("At production scale (~85) this view pages and virtualises") |
| 26 | Data volumes: 28,000 invoices p.a., Xero challenges, one-time customers archived in Xero, major contract holders persistent | N4 · X3 | BUILT | narrated counters + archive job | `src/domain/seed/index.ts:417` (`invoicesPerYear: 28000`, `activeContacts: 9820`, `softLimit: 10000`), `src/apps/demo/DemoXero.tsx:152-158`. The RFP's "~50% of invoices go to major contract holders" figure is not narrated; Appendix 2's "~99% one-time" is used instead |
| 27 | Appendix 3: mobile navigation schedule to list details to card details, incl. the Outcome/BTM block | M1 to M4 | BUILT | mobile slide stack | `m-01-home.png`, `m-02-list.png`, `m-03-card.png`, `m4-01-fee-panel.png`. Three legacy card fields are not shown on the modern card (note 01.4) |
| 28 | Appendix 4: admin one-day dashboard with drill-downs to detailed screens/forms | A1 | BUILT | Day view + list drawer + office card detail | `a-01-day.png` (rows x hour columns, annotations, legend, mini calendar, internal notes, -4w/-1w/Today/+1w/+4w), `a-04-card.png` (drill-down) |
| 29 | Appendix 5 Dashboard: summary of calendar, financial and locum availability data | W1 | PARTIAL | web Dashboard | `w-01-dashboard.png` (week strip, receivables aging, productivity, leave, who's free). Productivity has one period, not 30/60 days x 2 prior years; locum rows carry no visible mobile number (finding 01.2) |
| 30 | Appendix 5 Lists: upcoming lists, 2-per-day repeating structure, drill down | W2 | BUILT | web Lists | `w-02-lists.png` (Date / Session / From / To / Description / Status, actual times, legend, date range) to `w-03-list-detail.png` |
| 31 | Appendix 5 Availability: find a replacement locum at short notice | W3 | BUILT | web Availability grid | `w-06-availability.png` (all anaesthetists x AM/PM, annotations, All / Free-only, name search, Free cells offer "Book") |
| 32 | Appendix 5 Overdue: classic accounts-outstanding view, ordered by date | W4 | PARTIAL | Accounts to Overdue | `w-09-overdue.png` has Invoice / Patient / Payer / Raised / aging / ACC and is date-ordered, but no Surgeon column and no governing-contract column (finding 01.1) |
| 33 | NFR: colour-coded status language consistent across all three apps | N2 | BUILT | one token source, six statuses | `src/domain/statusKeyParity.test.ts` (domain keys vs theme keys, compile-time + runtime); legends visible in `m-01-home.png`, `w-02-lists.png`, `a-01-day.png` |

## Findings

### 01.1 - Overdue view drops the Surgeon and Contract columns  [PARTIAL]

- **RFP says:** Appendix 5 `Overdue` (RFP.md line 2038, "A view of unpaid accounts ... a classic
  accounts outstanding view, ordered by date") and the underlying legacy screen, whose columns are
  Patient · **Contract** · **Surgeon** · First Acct · Final · V.O'due · O'due · Current · ACC
  Status. `REQUIREMENTS.md` W4 restates it: "(patient, contract, surgeon, first account date, aging
  buckets, ACC flag)", and `phases/phase-05-anaesthetist-web-app.md:58` asks for exactly those
  columns.
- **Built:** the Overdue tab renders Invoice · Patient · Payer · Raised · Current · 31 to 60 ·
  61 to 90 · 90+ · ACC, flat, oldest first, with a totals footer
  (`aa-prototype/src/apps/web/screens/AccountsScreen.tsx:89-96` for the header row, rows from
  `src/store/selectors.ts:588-604` `AccpayInvoiceRow`).
- **Gap:** `AccpayInvoiceRow` carries no surgeon and no contract identity, so neither column can be
  rendered. `grep -ni surgeon src/apps/web/screens/AccountsScreen.tsx` returns nothing. "Payer"
  (`counterpartyLabel`) is the resolved billing counterparty, e.g. "St George's" or "Canterbury
  Orthopaedic Surgeons", not the governing contract the legacy column shows ("STG Cochlear
  Implant", "SX ACC"). The data is available: the admin review screen already prints a Contract
  column for the same procedures (`a7-02-review.png`), and the surgeon sits on the Card's List
  (`list.surgeonId`, used at `src/store/selectors.ts:766`). No decisions-log entry records dropping
  them, and the PROGRESS Phase 05 entry (line 359) reports the Overdue table as delivered.
- **Would a workshop audience notice:** yes, if anyone puts Appendix 5 next to the screen, and it
  is a plausible question ("how do I see whose list this account came off?"). Surgeon is how
  anaesthetists identify an account. Two of nine legacy columns are absent.
- **Severity:** notable

### 01.2 - Dashboard productivity and locum panels differ from Appendix 5  [PARTIAL]

- **RFP says:** Appendix 5 `Dashboard` (RFP.md lines 2019-2022) shows `Productivity` as a
  3 x 3 table: 30 Days / 60 Days / 6 Months x Amount / Last year / 2 years ago, and
  `Unassigned Anaesthetists (next 5 days)` as Date / Time / Anaesthetist / **Mobile**.
  `REQUIREMENTS.md` W1 restates it: "productivity summary (30/60 days, 6 months vs prior years)".
- **Built:** four stat tiles for a single period ("July so far": UNITS 274 +8%, LISTS 21, AVG UNITS
  / LIST 13.0, FEES INVOICED $7,261) plus a footer line "6 months: 1,542 units +6% vs last year"
  (`src/apps/web/screens/DashboardScreen.tsx:220-252`, figures from
  `src/domain/seed/anaesthetistDashboard.ts:46-57`). "Who's free · next 5 days" lists date + name
  chips with an "Ask to cover" action; the phone number is only in the chip's `title` tooltip
  (`src/apps/web/screens/DashboardScreen.tsx:317`).
- **Gap:** no 30-day / 60-day rows and no "2 years ago" column, so W1's "prior years" (plural)
  reduces to one prior year; and the locum's mobile number is not visible without hovering. This is
  a faithful copy of the design mockup, which shows the same four tiles and the same chip pattern
  (`docs/design/Web Dashboard.dc.html`, extracted: `UNITS 274 +8% | LISTS 21 | AVG UNITS / LIST
  13.0 | FEES INVOICED $7,261`), so convention 17 arguably governs. The figures are seed constants
  either way, so extending the table is presentational.
- **Would a workshop audience notice:** the productivity delta, probably not unless comparing to
  Appendix 5 (the panel reads complete and is more legible than the legacy table). The missing
  mobile number would only surface if someone asks "so how do I ring them?".
- **Severity:** cosmetic

### 01.3 - Audit viewer lists entries in insertion order, not chronological order  [PARTIAL]

- **RFP says:** "Audit trails of manual and automated actions are required." (line 356)
- **Built:** an append-only audit written by the store's mutation wrapper for manual and automated
  (`source: 'system'`) actions, with an admin Audit viewer filtered by entity type, source and date
  range (`src/apps/admin/screens/AuditViewer.tsx`, `src/store/billingRun.test.ts:143`). The
  requirement itself is met.
- **Gap:** the viewer sorts by nothing: `return rows.slice().reverse() // newest first`
  (`src/apps/admin/screens/AuditViewer.tsx:41`) assumes insertion order equals chronological order,
  which the seeded audit does not satisfy (it is written per staged card, per the 2026-07-23
  "Seed audit is minimal" decision). The result is visible in `a7-07-audit.png`, where the AT
  column reads 2026-07-17, 07-16, 07-16, 07-16, 07-14, 07-09, 07-16, 07-15, 07-14, 07-20, 07-20,
  07-20. Runtime entries appended after a demo action still land at the top, so the "watch the
  audit entry appear" demo beat works.
- **Would a workshop audience notice:** only if they read the timestamp column of the full audit
  screen, which is a plausible thing for a client to do on an "audit everything" claim. The per-card
  History sheet is unaffected in the demo script.
- **Severity:** cosmetic

### 01.4 - Appendix 3 card fields the modern card does not show  [NOTE, not claimed as a gap]

Recorded so the summary can rule on it rather than have it surface live. The legacy card (Appendix
3, panel 3) carries three things the prototype's card detail does not: **Surgeon** (the modern card
header shows operation, status chip and hospital only), the **List date and time** context line
("List: 22 Jun 2026 08:00 - 12:00"), and patient **Email + Address**. All three are one level away
or already modelled: surgeon and the actual From/To sit on the List header the user just came from
(`w-03-list-detail.png`, `m-02-list.png`), and `Patient` already has optional `email` / `address`
(`src/domain/types.ts:103-112`). The card header matches the design mockup field for field
(`docs/design/Mobile App.dc.html`: `Margaret Ellison | NHI ZAA0067 · DOB 14 MAR 1954 (72Y) | Left
total hip replacement | Private | Southern Cross`), so convention 17 plus P8 ("recognisably the
modernised version, not pixel-cloned") covers it. Severity: none.

## Deliberate exclusions in this section

- **Real authentication, accounts and user/role administration** - `REQUIREMENTS.md` §10 ("Real
  authentication/accounts (persona switcher instead)"). The RFP's "access rights managed by role
  rather than by individual user" is therefore demonstrated, not administered: role behaviour is
  enforced by the store guards on `Actor.role`, and the roles matrix is stated in
  `src/apps/admin/RolesInfo.tsx` and provable live via the persona switch.
- **Bulk volume simulation (28k invoices, 10k contacts as records)** - excluded by the 5th external
  plan review, item #11 (PROGRESS 2026-07-22), and restated in N4: "Billing/contact volume is
  narrated, not simulated". The Xero sim shows seeded aggregate counters that the archive job
  visibly decrements (`src/apps/demo/DemoXero.tsx:152-158`).
- **A production-scale 85-row day grid** - rejected as a UI re-raise (6th review #9, 7th review
  B21, PROGRESS 2026-07-22); the demo keeps the 14-person design-day cast, the generator is
  scale-tested at 85 (`src/store/canvasRoll.test.ts:198`) and the day view carries the paging
  footnote seen in `a-01-day.png`.
- **Pixel fidelity to Appendices 3 to 5** - P8: "Screens should be recognisably the modernised
  versions of the legacy screens in RFP Appendices 3 to 5 (same information architecture, better
  UX)", with `docs/design/` authoritative per convention 17. Layout differences from the legacy
  screenshots are the point, not a defect; only dropped information is treated as a gap above.

## RFP tensions in this section, and the choice made

| Tension | RFP lines | Resolution in the prototype | Decision ref |
|---|---|---|---|
| Reporting asks for "Monthly activity summaries" (a summary), while the RFP's balance-view section specifies a date-ranged list of amounts received with GST components | 344-347 (vs the balances section) | Built as a transaction list (one row per receipt, GST per row, period total as a footer) with a Monthly / Bi-monthly / Six-monthly selector, which satisfies both readings | PROGRESS 2026-07-22, seventh external plan review, item A17 ("GST report is a transaction list ... our 'summary' wording under-promised") |
| "Access rights should be managed by role rather than on an individual user basis" vs the prototype having no authentication at all | 353-355 | Roles are real in the domain (`Actor.role` guards) and enumerated in a roles panel; user-to-role administration is out of scope | `REQUIREMENTS.md` §10 + A8; roles panel `src/apps/admin/RolesInfo.tsx` |
| Data Volumes states ~85 anaesthetists, while the seed follows the design mockups' 14-person cast | 365-367 | Scale is narrated and generator-tested at 85, not seeded at 85 | PROGRESS 2026-07-22, sixth review #9 and seventh review B21; N4 |
| "The mobile app displays the calendar" vs Appendix 3, whose mobile screens are a chronological list with Week / Month filters, not a calendar grid | 332-336 and Appendix 3 | Reading picked: M1's forward-Lists view with Week / Month / To-Do / Done windows (the legacy app's own pattern); calendar grids appear in the web week strip and the admin mini calendar | No decisions-log entry; the reading is only implicit in M1 and `src/apps/mobile/screens/ForwardListsScreen.tsx:12-15`. NONE RECORDED |
| Data Volumes says "~50% of invoices are for a small number of major contract holders", while Appendix 2 says "~99% one-time" | 361-364 vs 1906-1907 | Not contradictory (invoice share vs contact share), and the prototype narrates Appendix 2's pair of figures only; the structural answer to the 50% half is that organisational contacts are never archived | `REQUIREMENTS.md` X3; no decision needed. NONE RECORDED |

## Beyond the RFP

Things this slice's screens carry that Appendices 3 to 5 and the intro do not ask for, all of which
read as improvements rather than noise:

- **Roster-order / A to Z toggle plus -4w / -1w / Today / +1w / +4w navigation** on the admin day
  view, and a live day summary ("14 anaesthetists · 17 sessions · 5 free · 0 submitted")
  (`a-01-day.png`); the legacy screen had only a mini calendar plus Today / 1 Week / 4 Weeks.
- **An "Awaiting review" rail and a Review-queue count badge** on the admin day view, tying the
  day view to the authorisation queue (`a-01-day.png`).
- **Per-card History affordance** on every card surface, mobile included (`m-03-card.png`,
  `a-04-card.png`), so the audit trail is reachable without going to the admin Audit screen.
- **Honest-empty and honest-label copy** the legacy screens had no equivalent of: "Modifier values
  are demo-plausible within the RFP's stated ranges, not an authoritative NZSA schedule"
  (`m4-01-fee-panel.png`), "One row per outstanding ACCPAY invoice, ordered by date raised. No
  rollup (per the RFP)." (`w-09-overdue.png`), "Scale is narrated with counters, not simulated as
  records." (`src/apps/demo/DemoXero.tsx:158`).
- **Completion progress on the list header** ("3 of 4 complete" with a progress bar) and a blocked
  submit button that explains itself ("Mark list completed · 1 to finish · Tap to see what is
  left") (`m-02-list.png`), where the legacy app had a bare Completed toggle per card.
- **A pinned demo clock, reset control and scenario jumps** (the demo control panel), which is
  prototype harness rather than product, per P6/P7 and convention 13.
