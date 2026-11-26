# Backlog

The open work on the prototype, the Requirements Board and their tooling, one line per item. Agents
pick from it when asked. Whoever finishes an item deletes its line in the same change; anything
knowingly left unfinished gets a line. No other upkeep: no dates, owners or status columns.

Size: **S** under half a day, **M** one or two days, **L** more. **(owner)** means it waits on a
decision from the owner (or AA through the owner): ask before building. Paths are relative to
`aa-prototype/src/` unless they start with `aa-prototype/`, `requirements-board/` or `docs/`. Check
`docs/DECISIONS.md` before "fixing" anything that looks wrong: several look like bugs and are rulings.

The readings built while AA's answer is awaited (Open defaults, Parked, the per-screen readings to walk)
are on the owner review list at the end of `docs/archive/prototype-build/PROGRESS.md`; only the ones
that need work are repeated here.

## Prototype: billing, invoices and money

- A rejected lock (split no longer fits, holder Party gone, prepaid payer changed) holds the Booking back for good. Decided: a rejected lock becomes an authorise blocker beside "Needs a price" (`authoriseBlockersFor`), so the office fixes the Contract and then authorises; no relock. `domain/billing/lock.ts`, `domain/billing/reviewFlags.ts`. M
- Remove the T stepper's manual time-units override ("Adjusted manually", seeded on Chen BK0008): time units come only from recorded time and the tiers. Reseed Chen (bump `PERSIST_VERSION`) and rewrite S5 Beat 1 and the master guide. `shared/capture/UnitsCard.tsx`, `domain/billing/fee.ts`, `domain/seed/bookings.ts`. M
- INVOICED PRICE counts an unreviewed additional invoice ($237.00); Sarah Mitchell after credit and rebill reads Events $7.00 and Invoiced $214.00 (verify first). `domain/billing/bookingTotal.ts`. S
- A credit still waiting for review already shows the Booking total as $0.00. `domain/billing/bookingTotal.ts`. S
- The AA Holding card's rows do not sum to its balance (Refunded positive beside negative Credited and Transferred), and a credited row is dated at the credit while a later payment grows it. `apps/admin/components/HoldingAccountPanel.tsx`. S
- The remittance advice lists the transfer PXT0001 under "BCTIs paid (1 BCTI)". S
- Two events for one party approved together raise two invoices in one run; the rule says the same party's invoice where it can. `store/procedureEventActions.ts`. M
- Data inspector totals disagree (54 invoices, 56 ledger pairs, 55 in Xero; "4 sessions" beside "894 lists"), and `entityCounts` has no credit-note count. `store/selectors.ts`, `apps/demo/DemoData.tsx`. S
- During a Xero outage the system-actor `xero.queued` entry joins the office's change set: `mutate()` scopes change sets by store, not actor. `store/mutate.ts`. S
- `paymentDisabledReason` and `openAccRecs` read the whole ledger once per render rather than once per screen. S
- At reset the Reconciliation card reads "Books square" while the Ledger shows a pair not yet in Xero (AA-2026-S2401). Decided: the card counts pairs pending to Xero as not square ("1 pair not yet in Xero"); also count Xero-only items once polled. Admin Day. S
- Web Remittances' paid-on dates differ from Admin Payment runs for seeded weeks 12 and 13. S
- nib's AA-2026-0005 Locked record reads "Billed to Alan Prentice". S
- After S3/S4's payment run the saved state is about 4.8 MB and the next save fails with QuotaExceededError ("persistence paused"), so a reload loses later beats; the guide tells the presenter not to reload. `store/persistStorage.ts`, `store/persistDelta.ts`. M
- Run payables in Xero still takes about 2 s at practice scale (1,597 bills; was 12 to 35 s: Phase 66 made the webhook recordings one commit instead of 1,598, measured 19.5 s to 2.0 s with saving). What is left is per-recording work in `store/disbursementDetection.ts`: `legFor` scans the ledger (could use `pairsByAccPayIndex`) and `completeRunsIn` re-checks every line on each recording. Capture recipes give the click 45 s and `admin-phase39a` 90 s; both could come down. S
- The payment-run toast and schedule print "1617 BCTIs" with no thousands separator. Payment-run message in `store/`. S
- Ledger tab: `LedgerTab.tsx` builds the next URL from the last render's params (the bug 60 closed for Billing), so two quick filter edits at practice scale can drop the first. `apps/admin/screens/finances/LedgerTab.tsx`. S
- The same "Out by $X" pill is red on the Ledger list (`LedgerLists.tsx`) and amber on the anaesthetist's account page (`AnaesthetistAccountPage.tsx`); pick one. S
- The Finances anaesthetist selects name people two ways: Dr Surname on Invoices, the full name on Billing and Xero. S

## Prototype: prepayments and patients

- "Pre-payment" and "Prepayment" both render (rail card, Ledger kind, Review flags, the Booking's prepayment statuses, Xero sim); the catalogue's word is "prepayment". Sweep the copy with the guide, the specs and the recipe captions that quote it. `apps/admin/components/PrepaymentsRailCard.tsx`, `apps/admin/screens/LedgerScreen.tsx`, `domain/billing/reviewFlags.ts`. M
- 41's patient contacts (prepayment reminders, `Booking.patientNotices`) never reach 40's follow-up log or send history. Decided: merge on read, so the patient record's history shows one timeline from both sources (no seed change); drop the duplicate Resend beside 41's reminder. `store/prepaymentActions.ts`, `apps/admin/screens/patients/`. M
- Phase 41 leftovers: settlement audit rows show `by: System` only in the summary row; releasing a prepaid Procedure's Contract settles nothing until a non-prepaid Contract is picked; "Split requested" is still offered as a credit reason on a prepayment invoice (`shared/procedureEventCopy.ts`). M
- Rebooked Riley shows a "Surgeon's rooms PDF" source line and "5 units" on a fixed price; the rebook dialog defaults to Dr Ngata (no price) and allows an unpriced not-prepaid rebook; no To-do row for the rebooked prepayment until the date jump. M
- Raise sample warnings overwrites Riley's prepaid Rhinoplasty code to H4. `store/warningSamples.ts`. S
- Nair's Booking shows two identical "Create additional invoice" and "Credit note" pairs. Decided: the actions live only in the events list; the prepayment block shows status and settlement. Update the guide's Open note. `shared/booking/PrepaidSettlementBlock.tsx`. S
- Add NHI with the Hub Unavailable shows "Matches Losa Tuilagi ..." from AA's own record. Decided: keep the match but say where it is from ("In AA's records; the NHI register is unavailable"). `apps/admin/screens/patients/AddNhiSheet.tsx`. S

## Prototype: Admin Day, Review, Bookings and intake

- US-13.4.1's People section (anaesthetists, surgeons, specialties and patients, each with a page; surgeon groups dropped) is not built: Master data still holds them. Being planned as Phases 50 onward (Lane C); run `/update-build-plan` if that plan is not committed. L
- Catalogue wording for the new Admin Day rail (work card, readings): US-13.8.1 says the pool is a panel "beside the to-do list" (now a tab alongside it); drop US-01.6.2's "space reserved beside the day view" example (Draft Lists live in the grid band and their page). Run `/update-requirements`. S (owner)
- Rename Notifications to Notices across the rail tab, side nav and page, as the rail ideas page proposed (`docs/explorations/admin-day-rail-ideas.html`). `apps/admin/components/RailWorkCard.tsx`, `SideNav.tsx`, `screens/NotificationsScreen.tsx`. S (owner)
- Build what S5 promises: a missing-NHI list with attach or merge. The guide already scripts it. M
- Mount `shared/flows/EditInvoiceDescriptionSheet.tsx`: an Edit action beside the invoice description on the admin Booking, so the office can edit it (D73's admin layer is otherwise reachable only through "Use it"). S
- Review shows both the "Not complete" pill and the "Not marked completed" flag for one fact. Decided: keep the pill, drop the flag. `domain/billing/reviewFlags.ts`. S
- Review counts disagree: the badge says 10 while the queue says "9 in the queue"; Chen Fri 17 shows "1 flag open" beside two triangles; Fri 24 PM still reads "FLAGS 1" after authorise. S
- Review's authorised stamp shows the List date, not the authorise date ("FRI 24 JUL, 08:00"). S
- History: grouped-save rows carry no clock time, it reopens on the last as-at view, and seeded rows (14:20, 14:22, Chen's 16:00) sit after the 08:00 clock. `shared/audit/`, `domain/seed/`. S
- The Mon 10 Aug PM drawer shows "4 bookings" after the Lattimer move (verify first). S
- The Mon 27 Jul price-rule List cannot be authorised: its date is in the future (demo-data staging). S (owner)
- Draft update email after S1's St George's file names the RVG name, not the text received. `domain/updateEmail.ts`. S
- The Split sheet's Apply is enabled while the new person has no email or address. S
- Lattimer's moved Booking reads "Agreed fee" without the Contract name. S
- A loaded 3-procedure Booking sits at 16:30 on an AM List. `store/demoMultiProcedure.ts`. S
- Day after S4's cancel reads "Awaiting review: Souter · Forte Health AM · 0 bookings · submitted". S
- The Reassign sheet after an anaesthetist's hand-on names the wrong session ("Souter, Melanie's session after the move"). S
- Phone-advice Booking: Continue creates the List at once, so abandoning leaves an empty ACTIVE List; Look up is allowed with an empty NHI. S
- A new List made by a moved Booking reads "Origin From a recurring booking". S
- S2 seed: Souter's "Public hospital, Thursday AM" series sits over a Private List with 8 Bookings on Thu 23 and Thu 30 Jul (a Public session holds none, D86). `domain/seed/`; bump `PERSIST_VERSION`. S
- Demo stand-ins: "A hospital update for this Booking" writes the RVG group's description as the hospital's wording (Wiremu Tane), and "A new hospital booking" on Tue 28 Jul PM adds a patient at 10:30, before the session. `shared/demoTriggers/registry.ts`. S
- Stage recurring clash for Dr Souter's Mon AM booking picks Mon 29 Mar 2027 (Easter Monday), where recurring Lists skip, so no Draft List appears though the result promises one; the guide stages Tue AM instead. Skip holidays and shutdowns when staging. `shared/demoTriggers/registry.ts` (`stage-recurring-clash`). S
- Stale Control Panel beat labels: S5 "Beat 2 · Admin Patients, Waiting for NHI", "Beat 4 · Master data, Contracts", Beat 5's "rate per unit on Master data", S1 Beat 3's "Open her Booking from Needs an invoice destination". `apps/demo/demoScenarios.ts`. S
- Stale demo-action copy from before the date move: `hospital-description-arrives` hint says "Tue 21 PM"; the injected unmatched receipt's reference says "SOUTER JULY". `shared/demoTriggers/registry.ts`, `store/ledgerDemo.ts`. S
- The Contracts tab badge reads 79 while the list says "147 Contracts active" (may count office Contracts only; check). `apps/admin/screens/contracts/`. S
- Master data, Modifiers: the "AA's own" table is squeezed to its header at 1440x900 and a sticky `th` blocks clicks on its rows. `apps/admin/screens/masters/ModifiersView.tsx`. S
- David Chen's history Booking `HBK03` falls on Mon 26 Oct 2026, Labour Day, after the date move. `domain/seed/history.ts`. S

## Prototype: anaesthetist apps (mobile, PWA, web)

- Mobile has no list of her prepaid Contracts under the profile (PWA parity gap). `apps/mobile/screens/MoreScreen.tsx`. M
- On Dr Souter's history Booking HBK03, mobile Paid by shows the raw id "H-STG". S
- PWA, S1: "Office authorises this List" authorises while her Contract change still awaits office approval. `store/officeStandIn.ts`. S
- The PWA Hub card pre-ticks Slow in a fresh session while the Hub answers Available. S
- Framed phone BK0025 after Raise sample warnings: the Paid by line shows the split warning text in place of the payer. S
- Demo sheet "Colleague moves a Booking to me" after S2 Beat 5 offers two rows, and the Dr Ropata row hands Souter her own former Booking back. `store/listMoveDemo.ts`. S
- Parked stories never built: US-01.1.5 (the A and B split of a session, DM-65) and US-03.7.4 (pre-op consults in AA's room, OQ-138). L (owner)

## Prototype: at AA's size (85 anaesthetists, now the everyday data)

Found walking the three apps with all 85 loaded; nothing errors, these are screens at size. Counts are from
the full-scale data; the everyday data shows the same screens with its own (smaller) billing history.

- The Ledger tab's Invoice pairs (11 columns, 1,080 px) and AA Holding account (8 columns, 880 px) tables scroll sideways inside their cards at 1280 and 1440, so Amount to Xero (pairs) and Amount (Holding) start out of view; the page itself no longer scrolls (Phase 64). Narrow the columns or drop one. `apps/admin/screens/finances/LedgerLists.tsx`, `apps/admin/components/HoldingAccountPanel.tsx`. S
- Patients has no Timings row. S
- Long admin lists with no paging or search: Draft Lists (150), Review queue (130), Recurring bookings (393). M
- Anaesthetist names sort three ways: by first name (the Conflicts filter, Recurring bookings, web Availability and Who's free, mobile Availability), in roster order (the Recurring booking sheet, the Ledger select), by surname (Day view, Billing monitor, the move pickers). One rule, surname, everywhere. S
- Make active (`store/anaesthetistStatusActions.ts`, `makeAnaesthetistActive`) writes the anaesthetist active and their sessions before the offered-back `enableContract`s; a refused enable would leave a partial change (the ids are checked first, so not reachable today). Check every enable before writing. S
- The mobile sign-out gate for an anaesthetist past their last day (`apps/mobile/MobileApp.tsx`) writes two "Signed out · No longer active" audit rows in dev, where StrictMode runs the effect twice; guard it with a ref. S
- New Draft List's surgeon select has 166 options sorted by display string ("A. Kingsley" before "Dr A. Dacre"); the pairing and recurring sheets' 166-option selects have no type-ahead. `apps/admin/flows/DraftListSheet.tsx`. S
- Admin Move booking lists every List that day (about 88) with no search, each with the same advisory line. S
- Audit dates show no year though they span 12 months. S
- Web Dashboard "Who's free · next 5 days" lists every free colleague with no cap. `apps/web/screens/DashboardScreen.tsx`. S
- Web Availability draws all 85 rows: Dr Souter's own row is not pinned and reads "Dr Melanie Soute…", and the AM/PM header does not stick. `apps/web/screens/AvailabilityGrid.tsx`. S
- Mobile Availability: 82 colleague cards with no search; a tile's subtitle repeats the hospital ("St George's · St George's · Mr D. Gri…"). `apps/mobile/screens/AvailabilityScreen.tsx`. S
- Move a Booking to a colleague: a search mixes busy colleagues among the free in surname order, "Dr" matches everyone, the search box scrolls away, each free row repeats "Free this session. A new List is created for them", and the List picker shows phone numbers instead. `shared/flows/MoveBookingToColleagueSheet.tsx`. S
- On a 4x-slowed CPU the mobile app freezes 0.6 to 1.7 s (Availability, opening a List or Booking, the Booking move sheet): `bookingMoveEntries` (`store/notifications.ts`) filters the whole audit on every store change (ships to the PWA), and the demo-actions menu re-checks every action against the whole dataset each render (`shell/DemoActionsMenu.tsx`). M
- The scale banner's Timings cover admin screens only. `shared/scale/useScreenTiming.ts`. S
- 11 directory surgeons have no title ("N. Darnell", "T. Underhill"), and the directory's "Dr E. Fitzgerald" sits beside anaesthetist Dr Emma Fitzgerald. `domain/seed/specialistDirectory.ts`. S
- The demo's 14 keep only their demo history at full scale (Dr Souter 9 unpaid invoices against colleagues' ~330 a year). (owner) M
- Shortening the horizon keeps recurring-clash Draft Lists past the new edge (at 85, 17 when going from four months to three). `store/slotActions.ts` (`setHorizonMonths`). S
- Record the owner's rule "recurring Lists skip public holidays" (24 Nov 2026, `docs/DECISIONS.md`) in the catalogue (US-01.3.2, US-01.5.2) with `/update-requirements`. S
- Start-up builds the whole practice on every load: about 1 s on a laptop, about 3 s on a 4x-slowed CPU (dev server). Cache the built start, or build the 71's billing lazily. `store/appStore.ts` (`practiceAppState`). M
- A long demo-clock jump at practice scale overflows browser storage: moving the clock four months (e.g. "Demo: pass the last day" on Dr Beaumont, whose Lists run to the horizon's end, so her last day must be its last) grows the saved `aa-demo` delta to about 5.2 MB, the write fails and saving latches off, so the session works until a reload brings back the state before the jump. Found in build plan Phase 52. `store/persistStorage.ts`, `store/persistDelta.ts`. M
- Make active's Contract offer-back can't be demoed or shot: every anaesthetist with an own Contract has Lists to the horizon's end, and Dr Reeves has none disabled. Seed a leaver-to-be with an own Contract and few Lists. `domain/seed/fullScale/`, `store/anaesthetistStatusActions.ts`. S
- Dr Sharma and Dr Tahana show the same masked bank account (99-0101-•••••67-00), likely a seed clash. `domain/seed/fullScale/`. S
- People → Patients → Needs follow-up is empty on a fresh seed until S1's Create Booking; worth a seeded row if it is opened cold. S (owner)

## Prototype: provisional captions

- Captions tied to open questions, each removed or reworded when its question is answered (`appCopy.test.ts` `MUST_KEEP` pins them): D23 prepaid Bills caption (`apps/admin/screens/contracts/new/NewContractPage.tsx`, shown too on the who-it-bills card in `ContractCards.tsx`), D68 (`shared/booking/PrepaymentMovedCard.tsx`), D70 (`InvoiceDocument.tsx`), D72 (`HoldingAccountPanel.tsx`), D78 (`UnitsCard.tsx`), and the Xero MJ "How this posts in Xero is still to be confirmed" (twice). S each (owner)

## UI consistency debt

- Admin page frame follow-ups (`apps/admin/components/AdminPage.tsx`, `docs/admin-layout-audit.md`): the Day view keeps its own frame (its rail stays 412 at 1280, so the grid is 580 there). M
- Older layout bugs seen in the frame work: on Review detail at 1920 the table stops short of its card (the totals row has one cell too many). S
- Shared components still to build: `TextAction` 13px and quiet sizes, an `OptionChip` small size, `IconButton` ARIA passthrough and 22 and 48 sizes, a pill-outline `Button`, a `TotalsBlock` (AA fees `FeeInvoiceDetail`). `shared/ui/`. M
- The one-component guardrail's allow-list still holds 58 files and 90 styled raw buttons; each component above retires entries. `apps/oneComponentPerJob.test.ts`. M
- Token drift: 65 inline `=== 1 ?` plurals not using `plural`, 13 `'EEE d MMM'` literals, off-scale font sizes (12.5 x307, 11.5 x79, 13.5 x48), no token for the white-alpha on-ink ladder (41 sites). M
- Left by U7 for the owner: PickRow heights 56 and 60, DockSpacer's hard-coded 74/82/86, the stamps in DraftListDrawer, UpdateEmailComposer and `auditNarrative`, no `data-progress` on the phone ListRow. S to M (owner)
- oxlint's 144 warnings: 122 `only-export-components` (helpers beside components) and 21 `exhaustive-deps` (`ModifierPickerSheet.tsx:74`, missing `claimFor` and `modifiers`, is worth a look). S to M
- Tailwind supplies only Preflight and the `@theme` variables (no utility class is used): drop it for a small reset and a `:root` block, with a visual check. `theme/global.css`. M
- Remove the Gradient Lab (the gradient is signed off): delete `shell/gradientLab/`, `GRADIENT_LAB_ENABLED` and `theme/gradientLabGate.ts`, and `visual/mobile-phase13.spec.ts`; the shipped look stays `AA_DEFAULT_GRADIENT`. Update CLAUDE.md's Design section. S
- Contract page back link (build plan Phase 47): it returns to the catalogue as the row was opened (grouping, group, search, page) through router state, but switching the page's tab drops that state, so Back then opens the bare list. Carry `location.state` through `ContractPage`'s tab links if the owner wants it.
- The app switcher says "Demo: Billing Monitor & Xero" while the page says "Xero simulation". `shell/appConfig.ts`. S

## Requirements Board

- Plan tools fall back to built-in status lists when `board.config.json` or `status-recodes.json` is unreadable (SY-1), and an unreadable recodes file raises no board issue (SY-4). S to M
- No page-level error boundary over the masthead and problem pill (SY-2). S
- Mermaid fence extraction and the Diff splitter (`shared/proseDiff.ts`) don't use `markdownCode.ts` yet (SY-3, SY-5). S
- Hardening: two git spawns run without `gitEnv` (SY-6), `capture --only` has no cycle guard (SY-7), `/API` spellings fall through to the SPA instead of a 404 (SY-8), cross-site navigations to Vite's `/__open-in-editor` are not refused. S
- Write-model nits: layout PUT accepts unsafe card IDs (CO-2), screenshot removal sits outside the atomic delete (CO-3), unbounded rename detection (CO-4), no softer 409 when the value already equals disk (CO-1), CO-5 to CO-8. M
- The kit ships this project's RFP citation examples in `SCHEMA.md` (UP-6). S
- B14 code rows: no warning for an escaping base folder, unguarded facts in `resolve-source` and `new-artifact`, no tests-only tsconfig, the dead `steps.ts ?? []`, a third note rule in `phase-context.mjs`. S each
- Settings accessibility: focus lost after Remove and Move, row buttons all named alike, swatch radios without arrow keys; unsaved Settings edits escape the leave prompt. S to M
- `kit:export` has no upgrade mode for an adopted board. M

## Tests and tooling

- The PWA has never been checked on a real handset, only the emulated iPhone 14 Pro: walk S1 T7, the Lattimer move end to end and the PWA-only paths (`aa-prototype/README.md`, "Testing on a real device"). M
- Flaky under load: `mastersPages.test.tsx` (Vitest timeouts) and `visual/booking-detail-layout.spec.ts`; board e2e `one-rule` R-101, `board-mapped` lane rename, `artifacts` reduced motion, `diff` live edits. Watch. S
- Catalogue asset files still carry old shot names (`copy-card`, `add-card`, ...), and US-03.1.3 has no Admin List drawer image. S
- `affected-shots` reads a comment or dead-code edit in `router.tsx` or `appStore.ts` as a route or store change, so the report goes broad: skip comment-only and deleted-declaration hunks. `aa-prototype/scripts/affected-shots.mjs`. S
- `store/appStore.ts` carries about 320 lines of per-version `PERSIST_VERSION` notes (v1 to v75); git holds them, trim to the last few. S
- Housekeeping: 37 Playwright specs and a dozen Vitest files are named by phase (`phase11.spec.ts`, `phase43Copy.test.ts`); `phase12`, `demo-actions` and `demo-actions-audit` specs overlap; the parity fixtures (`store/__parity__/`, `domain/seed/__fixtures__/`, 2.5 MB) could become one money golden. Rename or merge only when touching them. M
- Root `package.json` `test:plan-state` is misnamed (it runs `req-changes.test.mjs`) and redundant with `verify:board`. S
- Christmas shutdown follow-ups: the Add holiday sheet can't mark a closure as a shutdown (`HospitalHoliday.shutdown`, seed only); Hospitals & holidays lists one chip per shutdown day (group into a range); the Day view and anaesthetist calendars don't say a hospital is closed, its Lists are just absent. S
- After the move to Tue 24 Nov: code comments still name the July design dates, and S2's optional availability opening includes Dr Souter's Fri 1 Jan PM (New Year's Day). S
- A no-change Save on the patient page's Details card still writes a `patient.update` with equal before and after (`editPatient` in `store/intake.ts` always mutates, as the old sheet did); the other People cards write nothing when nothing changed. Found at the Wave 3 join review.
- `visual/unavailability-phase32b.spec.ts` test 6 compares the notification tick with the To-do Clear button only if `[data-shot="admin-todo"]` exists; that hook is gone, so the check is silently skipped. Switch to the To-do tab first. S
- Under heavy machine load some Playwright `page.goto` calls still time out at random; the full run is green on a quiet machine. S
- Intake Sources (Phase 71): no quiet-source alert or switch for a source, and hospital connection state beyond the seed (which hospitals are connected, OQ-109 part 1) is seed content only; retry and alerting stay US-14.5.1 Future Work.
- Intake's Update bench (Phase 69) cannot correct a row on an Update (its surgeon, a mistyped field) as the old matching panel's row corrections did; a wrong surgeon or field is left out and fixed on the Booking. `screens/intake/workbench/UpdateBench.tsx`, `correctArrivalRow` (70) could serve it. M (owner)
- Intake: 68's `workbench/ArrivalRowsTable.tsx` is now used only by `Workbench.test.tsx`'s mocks of the filled benches (every bench replaced it), so that frame test's read-only assertions hold for the mocks, not the real benches; delete the table and test the frame with plain stand-ins. S
- Intake: the handset's office stand-ins (`matching-office-matches-row`, `pwa-office-adds-nhi`) on a List at a hospital with no feed (Forte) send the List's whole held set as a rooms PDF and decide only their own row, leaving an Update of unchanged rows in To decide (and a removal offered for a held Booking with no valid NHI). `store/intakeIngest.ts` `receiveRowsForList`: send only the stand-in's row, or decide the unchanged rows with it. S
- Known failures on `master` from 2c2223e9 (Admin Day's Contracts tab) and the Finances build, seen at the Intake Wave 7 join and not caused by it: Playwright `warnings.spec.ts` 31 and 89 (`admin-warnings-todo` Show all), `admin-phase06.spec.ts` 164 (`admin-work-tab-contracts`), `billing-monitor.spec.ts` 211 (the search no longer writes `q=`); verify-board's round-trip of `US-04.3.12.md` (the serialiser adds `images: []`). S
