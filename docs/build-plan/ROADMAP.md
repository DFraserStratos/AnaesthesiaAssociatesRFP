# AA Prototype · Build plan roadmap

The requirements catch-up (phases 14 to 44 and the UI unification track U1 to U7, archived in
`docs/archive/prototype-build/`) left the prototype matching the requirements catalogue at commit
`64b3dff7` (24 November 2026). This plan started empty there. Phases come only from requirement changes
committed after it: `/update-requirements` records a change, the owner commits it, and
`/update-build-plan` grades only the changed items and appends phases here, numbered upward from 45.
Most are expected to be UI and UX improvements. Routine fixes and polish are not phases: they use the
`app-change` skill. Neither phases nor routine changes touch the screenshots or the demo guide: the
owner brings both in step with one sweep (`/sweep`, last run in `docs/SWEEP.md`).

The plan is now planned against catalogue commit `f885f67` (26 November 2026). It holds **twenty-three
phases, 45 to 67**, from three changes: two of 25 November, now built, and one of 26 November. Every
changed story is at Verify (US-10.2.7 and US-13.2.4 stay Proposed), not yet seen by AA.

- **The Contracts section (45 to 49).** Donald's decisions that give Contracts their own section of
  the Admin app, with a page for each Contract, a grouped catalogue, Parties and Funding tags as tabs,
  and Replace a Contract from a date (change log
  `requirements-board/requirements/changes/2026-11-25-donald-contracts-section.md`, note AR-69). The
  Contract model is unchanged; how the office finds, reads and changes Contracts changes. 12 units,
  with the data-model deltas DM-01 to DM-04. **Built:** 45 on `master`, 46 to 49 in Wave 1.
- **The People section (50 to 57).** Anaesthetists, surgeons, specialties and patients become one
  People section of the Admin app where Patients was. Every record gets a page in the Contract page's
  pattern, surgeon groups are cut, the priority tier is edited in a card with the rate, Waiting for
  NHI moves to Intake, and an anaesthetist can be made inactive from a chosen last day (change log
  `requirements-board/requirements/changes/2026-11-25-donald-people-section.md`, note AR-70). The gap
  analysis graded its 17 items (8 Contradicts, 7 Partial, 2 Grouping) and found six data-model deltas
  (DM-05 to DM-10). **Built** in Waves 2 and 3.
- **The Finances section (58 to 67).** Invoices, the Billing monitor and the Ledger become one Finances
  section of the Admin app with six routed tabs (Billing, Invoices, Payments, Ledger, Xero, AA fees),
  each record on its own page under its tab, tab numbers that count only what needs doing, and one
  amber badge (change log `requirements-board/requirements/changes/2026-11-26-donald-finances-section.md`,
  note AR-71). The billing engine, the ledger, the payment cycle, Xero and AA fees work as modelled;
  what changes is where the office sees and does each piece. The gap analysis graded its 12 items
  (US-13.3.3 Missing; US-13.3.1, US-13.2.1 and US-08.4.7 Contradicts; seven Partial; US-10.2.4 Matches)
  and found no data-model delta. Built in two waves of lanes, and tested once, at the very end (D113).

In all, **42 units: 37 planned in phases, 5 parked** (DM-01 to DM-04, which Phase 49 built, and
US-13.2.4; see Parked). The layout references are design pages, not catalogue artifacts (cite the
paths): `docs/explorations/contracts-section.html` (sections `#map`, `#catalogue`, `#record`,
`#updating`, `#new`, `#parties`, `#tagstab`; the first pass is `contracts-ideas.html`) for the Contracts
phases, `docs/explorations/people-section.html` (sections `#map`, `#nav`, `#groups`, `#patients`,
`#tier`, `#inactive`, `#changes`; the first pass is `people-ideas.html`) for the People phases, and
`docs/explorations/finances-section.html` (the approved mock: `#p-billing`, `#p-invoices`,
`#p-payments`, `#p-ledger`, `#p-xero`, `#p-aafees`, `#billing-table` version C only (A and B were
rejected), `#records`, `#kit`, `#moves`, `#open`, `#cost`; Donald's answers in
`finances-decisions.html`) for the Finances phases.

Settled prototype rulings are in `docs/DECISIONS.md`; known open work is in `docs/BACKLOG.md`. The
archived catch-up ROADMAP, PROGRESS and phase docs are history: read them as leads, never as rules.

## Owner decisions

These readings shape what a phase delivers. Rows are numbered from D90, above the archived catch-up's
D1 to D89, which code comments, tests and `docs/BACKLOG.md` still cite. The 2026-11-25 update
(catalogue `5f87781`) adds **D90 and D91**, the two new open questions that gate an unbuilt phase,
each with the default its phases build (none is answered: build without them), and **D92 to D96**, the
owner's directives for the Contracts section. OQ-146 gates no phase (see Open questions). The second
2026-11-25 update (catalogue `67cba2c`, the People section) adds **D97 and D98**, its two new open
questions, each with the default its phases build, and **D99 to D105**, the owner's directives for the
People section and its lanes. It rewrites D96 (US-04.1.2's unit moves from 47 to 52) and adds 52 to
D90's gates. The 2026-11-26 update (catalogue `f885f67`, the Finances section) adds **D106**, its one
new open question (OQ-149), with the default 64 builds, **D107 to D115**, the owner's directives for
the Finances section, its lanes and its single test, and **D116**, the reading 59 and 60 build for a
payer with no billing email or postal address (the stories and the approved mock; it replaces catch-up
Phase 22's "raised with no address, never a failure" for the billing run). No question is answered and
no earlier row is superseded.

| ID | Decision | Gates | Source |
|---|---|---|---|
| D90 | **Disabling a Contract from a future date (OQ-144). Open** (new 2026-11-25; Donald to ask AA; no recommendation). Default, the catalogue's own fallback: no future-dated disable and no date on a Contract. Disable acts at once, after 45's confirm; a Contract replaced from a date and left active gets a to-do on the change date that stands in for a scheduled disable (49). Until the office disables it, both Contracts are offered, and 49's message for a replacement not priced as a fixed price says so. 52 is untouched by it: an inactive anaesthetist's last day is the anaesthetist's, never a date on a Contract. | 45, 49, 52 | OQ-144; US-04.1.8 Technical discussion; US-04.1.2 |
| D91 | **A hospital's untagged Contracts on the step rail (OQ-145). Open** (new 2026-11-25; Donald to ask Ben; no recommendation). Default: as built. A hospital-held Contract with no funding tag sits under Special (`destinationOf`, US-04.2.17, which still Matches). 46's "Where it will show" and 47's "where the invoice goes" grouping both read `destinationOf` and never place a Contract themselves, so an answer changes one function. | 46, 47 | OQ-145 |
| D92 | **The Contracts section's shape. Decided** (owner, 2026-11-25 plan update). One Admin side-nav entry, Contracts, between Ledger and Master data, with routed tabs Contracts (`/admin/contracts`), Parties (`/admin/contracts/parties`) and Funding tags (`/admin/contracts/tags`). A Contract's page is `/admin/contracts/:contractId`, keyed by the Contract's id, never its AA code, because the AA code is editable. This overrides `contracts-section.html` `#record`, "a page at its AA code"; `#map` already says the id. New contract is `/admin/contracts/new` (with `?holder=`). All of it sits on the AdminPage frame: fit for the lists, ProfilePage fluid with the 412px rail for a Contract or a Party. The section opens on the catalogue. | 45 to 49 | Owner directive; US-13.4.1, FT-04.1, US-04.1.7; `docs/explorations/contracts-section.html` `#map` |
| D93 | **Old Master data links redirect until the owner's sweep. Decided** (owner). `/admin/masters?view=contracts`, with `&contract=<id>` or `&holder=<PartyId>`, goes to `/admin/contracts` or the Contract's page (45). The holder link maps to the holder grouping once 47 lands. `?view=parties` and `?view=fundingTags` go to the new tabs (48). The redirects keep the capture recipes, the demo guide (S5's `?view=contracts` links) and Playwright loading. In-app links go to the new routes directly. No phase edits the recipes, ATLAS or the guide: the sweep re-points them. The redirects stay after 49. | 45, 47, 48 | Owner directive; standing rule "Demo guide and catalogue screenshots" |
| D94 | **The to-do on the change date, and the late disable. Decided** (owner). The reminder is a warning rule in `src/domain/warnings/rules/`, a To-do and never a blocker in `lifecycle.ts`: "a replaced Contract is still active on or after its replacement's date". It shows in the Day view To-do and on the old Contract's page, and goes once the old Contract is disabled. Disabling a replaced Contract after its change date lists the Procedures from that date, not from today. Default for DM-01's home (the delta's recommendation): the link and date ride the new Contract's `contract.create` audit entry (`replaces: { contractId, fromISO }`), with no field on the Contract, which keeps "No dates" (US-04.1.2) and leaves OQ-144 open. So there is no `PERSIST_VERSION` bump unless the seed gains a replacement. | 49 | Owner directive; US-04.1.8 (Old one left active, Late disable); DM-01, DM-03, DM-04 |
| D95 | **Considered and not built. Decided** (catalogue). No desk page of Contract work, no adding one price range to many Contracts at once (every change is made on one Contract, from its page), and no "Try a List" screen for testing what the step rail offers. The label stays "Funding tag" and the tab stays "Parties". | 45 to 49 | US-04.1.2, US-04.2.15, US-04.1.5 and US-13.4.5 Notes; change log 2026-11-25 |
| D96 | **Contracts stories split across phases. Decided** (owner; updated by the People plan update). US-04.1.2 is built across four phases, with its unit on 52, which finishes it: 45 builds Disable confirmed; 46 builds New contract order and Similar name, and removes the warning-only "Replaces" picker on create; 47 builds Grouped, Two surgeons, the search and the Active, Disabled or all filter, where the holder filter becomes the holder grouping (47's doc, written before the People change, says it finishes the story: it closes the criteria it builds); 52 builds the new Inactive anaesthetist criterion from new files that call `disableContract` and `enableContract`, and walks the whole story at its close. US-04.1.3 spans 45 (one audited change per card) and 49 (what a replacement audits), with its unit on 49. DM-04's confirm (list from today) is built in 45; its replaced case, listing from the change date, is US-04.1.8's Late disable in 49. DM-01 to DM-04 are parked in the plan (Parked), because only 49 builds what remains of them. | 45, 46, 47, 49, 52 | Owner directive |
| D97 | **How an anaesthetist who has left sees later remittances (OQ-147). Open** (new 2026-11-25; Donald to ask AA; no recommendation). Default, the reading DM-07 builds: sign-in stops entirely after the last day, and comes back when the anaesthetist is made active again; no read-only sign-in is kept. Nothing is built for remittances that arrive later: the office sends them by email, and 52 puts that on its owner's review list. | 52 | OQ-147; US-12.1.6 Technical discussion; US-13.5.3 |
| D98 | **Any record of surgeons who practise together (OQ-148). Open** (new 2026-11-25; Donald to ask AA and Greg; no recommendation). Default, as the catalogue says: no surgeon group record. A group that holds Contracts is a Party of kind surgeon group, its surgeons are the ones linked on its Contracts, and each surgeon's practice name says who practises together. 53 removes the Surgeon groups list and 55 the record behind it. An answer that brings a list back is a new phase, not a reprieve. | 53, 55 | OQ-148; US-13.4.1, US-13.6.2; domain model |
| D99 | **The People section's shape. Decided** (owner, People plan update; Notes 2026-11-25 · Donald people section #1, #2). One Admin side-nav entry, People, where Patients was, taking Patients' attention count. Routed tabs Anaesthetists (`/admin/people/anaesthetists`, where the section opens), Surgeons (`/admin/people/surgeons`), Specialties (`/admin/people/specialties`) and Patients (`/admin/people/patients`), each an AdminPage fit list, searched, filtered and paged. A page per record, keyed by an id that never changes: `/admin/people/anaesthetists/:anaesthetistId` (the registration number, which is the anaesthetist's id), `/admin/people/surgeons/:surgeonId`, `/admin/people/specialties/:specialtyId` and `/admin/people/patients/:nhi`, on ProfilePage fluid with the 412px rail as the side panel. Master data keeps hospitals and their holidays ("People and places" becomes "Places") and the rest, with a pointer line. Waiting for NHI goes to Intake (51). Considered and not built: tabs on a record listing every List and Contract, Patients as a section of their own, and a grouped Surgeons list. | 50 to 57 | Owner directive; US-13.4.1, US-12.1.4, US-11.1.1; `docs/explorations/people-section.html` `#map`, `#nav` |
| D100 | **Old People links redirect until the owner's sweep. Decided** (owner, as D93). `/admin/masters?view=anaesthetists`, `surgeons` and `specialties` go to their People tabs, and `?view=surgeonGroups` to Surgeons. `/admin/masters/anaesthetists/:id` and `/admin/masters/surgeons/:id` go to the record pages. `/admin/patients`, `/admin/patients/follow-up` and `/admin/patients/:nhi` go to the Patients tab, its Needs follow-up filter (once 57 builds it) and the patient's page (53). `/admin/patients/waiting` goes to `/admin/intake/waiting` (51). In-app links go to the new routes directly. No phase edits the recipes, ATLAS or the guide. The redirects stay. | 51, 53, 57 | Owner directive; standing rule "Demo guide and catalogue screenshots" |
| D101 | **Wave 2's split. Decided** (owner, 25 Nov 2026, revised the same day). The Contracts phases (46 to 49) join onto `master` first, as Wave 1 with Lanes A and B only. Wave 2 then runs Lane A: 50, then 52, then 53, with Lane B's 51 beside it; 53 merges 51's `complete:` commit at its start. Wave 3 is as before. The earlier Lane C boundary (a list of Contracts files 50 to 52 must not touch, and one router exception for 51) is withdrawn, because no Contracts lane runs beside the People phases. 50's card stays self-contained on today's anaesthetist record, and 52 still disables and re-enables Contracts through the existing store actions from new files, as design choices: 54 reuses the card, and the Contracts code stays untouched. | 50 to 53 | Owner directive |
| D102 | **The rate and tier card's save (DM-09). Decided** (owner; the delta's recommendation). No new data: the tier stays in the office-private slice and the rate on the anaesthetist. Save writes only what changed. When both changed, the two writes (`editAnaesthetist`'s `unitValue` and `setPriorityTier`) run in one change set (`withChangeSet`), so one save is one audited change. Cancel writes nothing, and a click on a tier never saves. | 50, 54 | Owner directive; US-01.3.6, US-12.1.4; DM-09 |
| D103 | **Making an anaesthetist inactive: the built defaults (DM-05 to DM-07). Decided** (owner; the deltas' recommendations). The last day and the reason are stored on the anaesthetist; activity is derived through one pure `isActiveOn(anaesthetist, dateISO)`, so no clock hook keeps a flag in step. The last day is today or later. Slots after it go when it is set (the refusal means none holds a List) and come back if it is cleared; made active again, the anaesthetist has Slots from that day (today on the demo clock). "Own Party" is derived, with no stored link: a Contract whose holder is an anaesthetist-kind Party and whose `linkedAnaesthetistId` is the person. When the demo clock passes the last day (the `dayAdvanced` event), the system disables those Contracts, one audited change each; only the Contracts that rule disabled are offered back. Sign-in is refused after the last day, at the attempt and at the stored-session gate, with its own audited reason. The shape change bumps `PERSIST_VERSION`. | 52, 54 | Owner directive; US-12.1.6, US-01.1.1, US-04.1.2, US-13.5.3; DM-05, DM-06, DM-07 |
| D104 | **One record pattern, lifted once. Decided** (owner). 53 lifts the Contract page's cards, edited and saved one at a time (`EditableCard` and `useCardEdit` in `ContractCards.tsx`), and a side panel of short sections with See all into shared components with `/demo/catalogue` rows, and re-points the Contract page onto them with no change in behaviour. 54 to 57 build every People page on them and none copies them; a phase that needs more extends them with a prop. A side panel shows a few rows of each kind with See all, never a tab listing everything. | 53 to 57 | Owner directive; US-13.4.1, US-12.1.4, US-13.6.2, US-13.4.4, US-11.1.1; `people-section.html` `#map` |
| D105 | **People stories split across phases. Decided** (owner). US-13.4.1's unit is on 53, which builds Three places, No surgeon group record (the list) and Find a person. The Surgeons list's search, specialty filter and Active or Retired filter are built there rather than in 55, because Find a person is that unit's own criterion. Its One card, one change is US-13.6.2's One card at a time, built and verified in 55, which also removes the surgeon group record (DM-08). US-12.1.4's unit is on 54, which finishes it: 50 builds Rate and tier together, 52 the make-inactive action, 53 the Anaesthetists list's search, filters and pager. US-01.3.6 is finished in 50, and 53 keeps its list filter when the list moves. DM-10 spans 51 (waiting rows leave the patient count) and 57 (one row per patient), with its unit on 57. US-11.1.1 and US-11.3.1 move with the section in 53 and are finished in 57. | 50 to 57 | Owner directive |
| D106 | **Where a receipt nobody can place is placed (OQ-149). Open** (new 2026-11-26; Donald to ask AA (Greg); no recommendation). Default, the owner's: as built. The Ledger tab keeps today's Allocate (place it against an invoice) and Mark refunded, in the system only, in its right column under receipts to place; a held receipt is one of the failed ledger checks, so it counts in the Ledger tab's number and the Finances badge, and in the receipts-to-place figure. Nothing is pushed to Xero, and US-10.2.4's bulk remittance (which Matches) is untouched. The Day view's reconciliation status (US-13.2.4, parked) keeps its unplaced-receipt item. | 64 | OQ-149; US-13.2.1 (Receipt to place); US-10.2.4; US-13.2.4 |
| D107 | **The Finances section's shape. Decided** (owner, 2026-11-26 plan update; Notes 2026-11-26 · Donald finances section). One Admin side-nav entry, Finances, replacing Invoices, Billing monitor and Ledger, where the mock draws it (after Review queue, before People). Six routed tabs: Billing (`/admin/finances/billing`, where it opens; `/admin/finances` goes there), Invoices (`/invoices`), Payments (`/payments`), Ledger (`/ledger`), Xero (`/xero`) and AA fees (`/aa-fees`, its settings at `/aa-fees/settings`). No summary page: whether the books are square stays on the Day view (US-13.2.4). Records open under their tab: an invoice `/admin/finances/invoices/:invoiceId`, a credit note `/admin/finances/invoices/credit-notes/:creditNoteId`, a payment run `/admin/finances/payments/:runId` and its remittance `/admin/finances/payments/:runId/remittance/:anaesthetistId`, an anaesthetist's account `/admin/finances/ledger/anaesthetists/:anaesthetistId`. Every tab sits on the AdminPage frame: the title, LineTabs, one PageToolbar, the body and the PageBody rail, and nothing else above the list. Every record follows the record pattern of the Contract and People pages (back link to its tab, name with an ID chip and status, a summary line, cards, a rail of RailSections, History last); the invoice and credit note paper stays custom (AdminPage document). Every in-app link goes through `financePaths.ts`. Considered and not built (catalogue): four tabs, an Overview tab, tab numbers that count what the tab lists, a badge for billing problems only, the name "Billing", approving Lists on Billing, Lists that unfold into their Bookings, a List cell spanning its Bookings, and the whole-ledger and one-anaesthetist switch. | 58 to 67 | Owner directive; US-13.3.3, FT-13.3, US-13.3.1, US-13.2.1; `docs/explorations/finances-section.html` `#decide`, `#url`, `#records` |
| D108 | **Old finance links redirect, with replace, until the owner's sweep. Decided** (owner, as D93 and D100). `/admin/invoices` (with `?view=approval`) and `/admin/invoices/:invoiceId`, `/admin/credit-notes/:creditNoteId`, `/admin/billing` (with its query), `/admin/billing/aa-fees` and `/admin/billing/aa-fees/settings`, `/admin/billing/payment-runs/:runId` and `.../remittance/:anaesthetistId`, `/admin/ledger` and `/admin/ledger/anaesthetists/:anaesthetistId` go to their Finances homes with replace, so Back does not loop (58). In-app links go to the new routes directly. The redirects keep about 76 capture recipes, ATLAS's routes, the guide (48 "Billing monitor" mentions; S3 Beats 6 and 7) and Playwright loading. No phase edits the recipes, ATLAS or the guide: the sweep re-points them. The redirects stay. | 58 | Owner directive; US-13.3.3 Technical discussion; standing rule "Demo guide and catalogue screenshots"; `finances-section.html` `#cost` |
| D109 | **Tab numbers count what needs doing; one amber badge. Decided** (owner; US-13.3.3). Finances' own rule: Billing counts Lists with a billing problem; Invoices, prepayment invoices awaiting approval; Ledger, failed ledger checks, a receipt to place among them; Xero, hand-offs that raised an alert and invoices changed directly in Xero; Payments and AA fees show no number, ever (owner rule, 26 November: nothing there is a problem to clear; no count function, no `CountBadge`). Contracts' and People's tabs keep counting what they list: do not "fix" either. One badge on the Finances entry, billing problems (the Billing and Xero tabs) plus failed ledger checks, in the warning semantic (amber), never crimson. **The badge's unit** (default): the Billing tab's number (Lists with a billing problem; a List with a Booking failed or stuck at Xero is among them), plus the Xero items that sit under no problem List (invoices changed directly in Xero, and alerts not tied to a Booking on a List), plus the Ledger tab's number (failed ledger checks). So a Booking stuck at Xero shows on both tabs but counts once, and US-13.3.3's example reads 1 + 2 = 3, then 2 once the problem is resolved. 58 builds every count in `financeCounts.ts`, the badge as one function over them: until 60, its billing part is today's `billingAttentionCount` (open billing exceptions, alerted hand-offs and divergences, one each; a Booking stuck at Xero is a hand-off, never an exception, so it already counts once) and the Billing tab's number comes from today's monitor logic. 60 re-bases the Billing count on 59's problem Lists, and the badge's billing part moves to the unit above with it, in `financeCounts.ts`, with tests for 1 + 2 = 3 (then 2) and for a stuck List counted once. | 58, 60 | Owner directive; US-13.3.3 (Counts what needs doing, One badge); `finances-section.html` `#decide` |
| D110 | **Today's panels move first, unchanged. Decided** (owner; the mock's `#moves`). 58 moves every panel, view and action of the three screens to its home, keeping its store calls and its `data-shot` hooks (about 60): the Billing monitor's pipeline stays as the Billing tab; its payment cycle, runs table and events awaiting the run go to Payments; its Xero sync queue and Changed directly in Xero to Xero; its AA Holding account to Ledger (the third list); its AA fee strip and four tiles are dropped (the AA fees tab hosts `AaFeesScreen`, settings included); the Invoices screen and its Awaiting approval view go to Invoices; the Ledger to Ledger. Each tab and record renders from its own file (LANES.md "The file contract 58 sets up"). Wave 5 then rebuilds each tab in place. What stays elsewhere: Lists are approved in the Review queue only; credit notes and additional invoices start from the Procedure or the invoice; a patient's balance and follow-up stay in People. | 58 to 67 | Owner directive; US-13.3.3 (What stays elsewhere); `finances-section.html` `#moves`, `#kit` |
| D111 | **Demo triggers re-homed once, by 58. Decided** (owner). 58 re-homes every trigger bound to the three screens (10 on `BILLING_MONITOR_SCREEN`, the ones naming invoice, AA fee or ledger routes, and those offered on both the monitor and the Ledger) to exactly one Finances tab or record screen each, keeping each label so `demoGuideSync.test.ts` stays green. No Wave 5 phase edits the registry. A phase that needs a new or changed trigger builds its body in its own files and notes the entry for the final join, which registers it: 60's "Payer loses billing email" on the Billing tab (clears the billing email and postal address of an authorised, unbilled Booking's payer and runs its List's billing, which fails the Booking under D116, for the fix-the-payer path), with a `NOT_SCRIPTED` reason until the sweep scripts it. | 58, 60 | Owner directive; US-13.3.1, US-13.3.2 (Fix beside the Booking); standing rule "Demo triggers" |
| D112 | **Waves 4 and 5. Decided** (owner, 26 Nov 2026). Wave 4, once this plan is on `master`: Lane A builds 58, Lane B 59. Wave 5, once 58 and 59 are on `master`: Lane A 60 then 61; Lane B 62, then 63, then 67; Lane C 64, then 65, then 66. 58 owns every shared shell file and gives each tab and record its own file; no Wave 5 phase edits `router.tsx`, `SideNav.tsx`, `AdminApp.tsx`, `apps/admin/routes.tsx`, the redirects, `financePaths.ts` or `shared/demoTriggers/registry.ts`, and only 60 edits `financeCounts.ts` (the Billing count). A route, link, trigger or count change a Wave 5 phase needs goes in `notes.md` and under "For the merge", and the final join makes it. **Subagents, as much as possible:** each phase session sends parallel subagents to read code and requirements, to build independent pieces (one per panel or file, each told which files are its own) and for any review, and keeps its own context for decisions and joins. [LANES.md](LANES.md) holds the lanes, the ownership tables, the sync, the joins and the conflict rules. | 58 to 67 | Owner directive |
| D113 | **Test once, at the very end. Decided** (owner, 26 Nov 2026: speed first; this is a prototype). For 58 to 67 only, this overrides this file's standing rules on gates and the owner's test, LANES.md's gate steps, the `run-build-phase` skill's gate, adversarial review, screen-proof and manual checklist steps, and CLAUDE.md's "full gate before merging". Each phase finishes on the quick checks only (`node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --changed`, plus `npm run lint` in `aa-prototype/`, about a minute) and skips the adversarial review, the screen-proof and the manual checklist run; its checklist stays in its doc as the final join's material. Wave 4's join merges, runs the quick checks on the merged code and moves on: no full gate, no review. Wave 5's join (the final one) runs the full gate once (`phase-check.mjs` without `--changed`: both builds, all of Vitest, verify-board, all of Playwright, plus lint), one review of all ten phases, fixes what it finds, merges to `master` and writes one owner test sheet, `docs/build-plan/TEST-58-67.md`. | 58 to 67 | Owner directive |
| D114 | **Finances stories split across phases. Decided** (owner). US-13.3.3's unit, with FT-13.3's, is on 58, which builds the section, its own addresses, the tab numbers, the badge, the redirects and the record routes; 60 re-bases the Billing count, and 63, 65 and 66 rebuild the records 58 moved on the record pattern. 59 holds no unit: it is groundwork for 60 and 62. US-13.3.1's unit is on 60. US-13.3.2 is built across 60 (retry, fix the payer and mark resolved beside the Booking on Billing) and 61 (the Xero tab), with its unit on 61, which finishes it. US-08.4.7 and US-06.3.1 are on 62; 63 builds the invoice and credit note pages, the record half of US-13.3.3's "Records on their own pages", with no unit. US-13.2.1 is built across 64 (the sentence, the four figures, the three-way list, the Holding account entries, receipts to place) and 65 (the anaesthetist's account page), with its unit on 65, which finishes it. US-10.2.7 is on 66, built as written (OQ-47 untouched). US-10.3.1 and US-10.3.3 are on 67. US-13.2.4 is parked (Parked); US-13.7.4 is in the Future Work lane and out of scope (the approval switch beside the Invoices list is US-06.3.1's, built in 62). | 58 to 67 | Owner directive |
| D115 | **Built from the shared kit. Decided** (owner; the mock's `#kit`). Shared components first: `src/shared/ui`, `src/shared/table` and the AdminPage frame. Every part of the mock is a component that exists today (AdminPage, PageToolbar, PageBody rail, LineTabs with CountBadge, NameSearchBox, FilterPills, SelectField, SlidingSegmentedControl, TableShell, Th, Td, GroupRow, the admin Pager, ClickableRow, DisclosureButton, Pill, StepRail, Card, RailSection, RailRow, DefList, TextAction, Notice, StatTile, Switch, Button), so no new shared component or variant is built unless it has a design source. The one new arrangement is GroupRow `level="sub"` carrying a List's date, hospital, status, counts and "Show all" (60, additive, its `/demo/catalogue` row updated); StatTiles two by two in a rail Card is only a grid change (64). | 58 to 67 | Owner directive; `finances-section.html` `#kit` |
| D116 | **A payer with no billing email or postal address fails the Booking; a failure resolved by hand is stored on its exception. Decided** (plan default, read from the stories and the approved mock; on 60's "For the owner's review" list). Today's billing run never fails on this: it raises the invoice with `delivery.status: 'noAddress'` (catch-up Phase 22's reading). The stories and the mock treat it as a billing failure (US-13.3.1's Reason and fix beside the Booking; US-13.3.2's Fix beside the Booking, "fixes the payer ... and retries, then the Booking bills"; the mock's BK0051, "Not invoiced: the payer has no billing email or postal address", Billing failed, 0 invoices), so from 60, when the run or a retry finds that an invoice of a Booking has nowhere to go (`invoiceDeliveryFor` returns `none`: a person payer with neither an email nor a valid postal address, or a holder Party with neither for its delivery method), the Booking fails whole as a `BillingException` with a new code, and no invoice, pair or Xero hand-off is raised for it. 59 names the code (for example `payerNoAddress`) in its reason-and-fix vocabulary, with the reason and the fix "fix the payer", and its tests build the exception directly; 60 raises it from the run (`store/billingRun.ts`, `store/invoiceMaterialise.ts`) importing the code from 59. Fix the payer, then Retry (`retryBillingException`, reading the payer's details again), raises and sends the invoice, and the Booking leaves Problems. Invoices already stamped `noAddress` (the seeded history, and credit notes that follow their original's delivery) keep reading as today: 60 re-checks every `noAddress` reader (`deliveryCountsText`, the Review queue's delivery banner, the monitor rows' counts in `store/selectors.ts`, `PatientRecord`, `InvoiceDocument`'s Delivery card, `creditActions`, Resend) and `billingRun.test.ts`'s no-address cases, and removes none it still needs. Mark resolved: 59 adds optional `resolvedBy` and `resolvedNote` to `BillingException` in `domain/types.ts` (58 does not touch it; optional fields need no seed change or `PERSIST_VERSION` bump), and a failure resolved by hand is one with `resolvedAtISO` and no `resolvedPairIds` (a successful retry sets them); 60's Mark resolved writes them through `mutate()`, audited. Prepayment invoices are outside the billing run and unchanged. | 59, 60 | US-13.3.1, US-13.3.2 (acceptance criteria); US-08.5.2; `finances-section.html` `#billing-table` (version C), `#p-billing` |

## Track

```
Contracts   45 the section & the Contract page                                        (DONE)

Wave 1      Lane A  46 New contract page ─▶ 49 Replace a Contract from a date          (DONE)
            Lane B  47 the grouped catalogue ─▶ 48 Parties & Funding tags tabs
            ── join: owner tests 45 to 49 (TEST-45-49.md) ──
Wave 2      Lane A  50 rate & tier card ─▶ 52 make an anaesthetist inactive            (DONE)
                    ─▶ 53 the People section & the shared record pattern (merges 51 first)
            Lane B  51 Waiting for NHI on Intake
            ── join (Lane A, last to finish): takes in 50 to 53; no owner test ──
Wave 3      Lane A  54 the anaesthetist's page                                          (DONE)
            Lane B  55 the surgeon's page, surgeon groups cut ─▶ 56 the specialty's page
            Lane C  57 the Patients tab & the patient's page
            ── join: owner tests 50 to 57 (TEST-50-57.md) ──

Finances
Wave 4      Lane A  58 the Finances section shell (nav & badge, six tabs, record routes,
                       redirects, links, counts, triggers, today's panels moved)
            Lane B  59 the Finances read models (pure domain, no UI)
            ── join: quick checks only; no review, no owner test ──
Wave 5      Lane A  60 the Billing tab ─▶ 61 the Xero tab
            Lane B  62 the Invoices tab ─▶ 63 the invoice & credit note pages ─▶ 67 the AA fees tab
            Lane C  64 the Ledger tab ─▶ 65 the anaesthetist's account page
                    ─▶ 66 the Payments tab & the payment run pages
            ── join: the full gate & one review, once; owner tests 58 to 67 (TEST-58-67.md) ──
```

45 ran alone. Everything after it runs in build lanes, wave by wave ([LANES.md](LANES.md)): the
Contracts phases in two lanes, then the first People phases (50, 52 and 53 in Lane A, 51 in Lane B),
then the four People pages in three lanes. The Finances phases run as Waves 4 and 5: the section shell
and the read models in two lanes, then the six tabs and the record pages in three, tested once at the
end (D112, D113).

## Phases

| Phase | Title | Track | Depends on | Sessions | Delivers |
|---|---|---|---|---|---|
| 45 | [The Contracts section and the Contract page](phases/phase-45-contracts-section-and-contract-page.md) | Contracts | none | 2 sessions | A Contracts entry in the Admin side nav between Ledger and Master data, with the Contract list moved there on AdminPage fit with a tab strip; the old Master data links redirected (D93). A page per Contract at its id (D92), on ProfilePage fluid with a rail: cards edited and saved one at a time, each one audited change, refused in place; the holder Party's billing details read-only; the price ranges as a newest-first table with To, Change and Procedures priced, ended ranges folded after three; the Procedures on it, its event fees and its history; Disable confirmed, listing the Procedures from today; system Contracts limited. The side panel's edit path retired (create keeps it until 46). Covers US-04.1.7, US-04.2.15 (plus US-04.1.2's Disable confirmed and US-04.1.3's per-card audit, D96, and DM-04's confirm; the delta is parked) |
| 46 | [The New contract page](phases/phase-46-new-contract-page.md) | Lane A | 45 | 1 session | New contract as a full page (`/admin/contracts/new`, `?holder=`), filled in the order its rules depend on (holder and who it bills, pricing, where it is offered, name and codes), with a live "Where it will show" and the holder's similarly named Contracts as a hint, never a block. Saving lands on the new Contract's page. `ContractEditSheet` deleted, with its warning-only "Replaces" picker. No unit of its own: US-04.1.2's New contract order and Similar name (D96) |
| 47 | [The grouped Contract catalogue](phases/phase-47-grouped-contract-catalogue.md) | Lane B | 45 | 1 session | The catalogue grouped by holder, kind of holder, funding tag (No tag included), surgeon (a two-surgeon Contract under both), where the invoice goes or pricing kind, by a pure tested `groupContracts`. An index pane of groups with counts sits beside the list, with a GroupRow sub-heading variant. `?group=` and `?in=` live in the URL, and the last grouping is remembered per office user. The holder filter becomes the holder grouping. No unit of its own now: US-04.1.2's Grouped, Two surgeons, search and filter, with the story's unit moved to 52 (D96) |
| 48 | [The Parties and Funding tags tabs](phases/phase-48-parties-and-funding-tags-tabs.md) | Lane B | 45, 47 | 1 session | Parties and Funding tags as tabs of the Contracts section. Parties are grouped by kind, Contract-less ones included, and each Party has a page with its Contracts counted by funding tag, each count opening the catalogue. Picking a tag shows its Contracts grouped by hospital with counts. The three views leave Master data, with redirects and a pointer line. Covers US-04.1.5, US-13.4.5 (plus US-13.4.1's Contracts-section half; the story's unit moved to 53, D105) |
| 49 | [Replace a Contract from a date](phases/phase-49-replace-contract-from-a-date.md) | Lane A | 45, 46 | 1 to 2 sessions | Replace from a date as one action, from a SidePanel record sheet: a copy with any setting changed and a new AA code; the Procedures from the date listed, locked ones left out, only the ticked ones moved; the old Contract left active with a to-do on the date, or disabled now. Every step is audited, in one change set (`replaceContract`). The to-do is a warning rule, never a blocker (D94). A late disable lists the Procedures from the change date. A "Demo: reach the change date" button. Covers US-04.1.8, US-04.1.3 (it builds DM-01 to DM-03 and DM-04's replaced case as its doc says; the deltas are parked) |
| 50 | The rate and priority tier card | Lane A | 45 | 1 session | The rate per unit and the priority tier on one self-contained card on today's anaesthetist record: Edit, choose, Save (Cancel leaves it), one audited change per save (D102), never a single click. The rate leaves the edit sheet, and the Anaesthetists list filters by tier. Covers US-01.3.6, DM-09 |
| 51 | Waiting for an NHI as a tab on Intake | Lane B | none | 1 session | A Waiting for NHI tab on Intake beside Matching, with the view moved from Patients unchanged and `/admin/patients/waiting` redirected. The rows count once, in Intake's attention count, which drops when the NHI is added; the Patients count stops counting them. The counts change in the selectors, not in AdminApp or SideNav. Covers US-11.1.5, US-11.1.4, US-02.1.4 |
| 52 | Make an anaesthetist inactive from a last day | Lane A | 49, 50 | 2 sessions | A last day and a reason, refused while the anaesthetist holds a List after it (those Lists shown), cleared before the day, each step audited (D103). After the day: no Slots, not offered or picked, no sign-in in the mobile app, the PWA or the web app, and their own Contracts disabled by the system. Made active again: Slots and sign-in back from that day, and the disabled Contracts offered back, ticked with prices. A status card and two sheets on today's anaesthetist record; the edit sheet's Active toggle goes. "Demo: pass the last day". Covers US-12.1.6, US-13.5.3, US-01.1.1, US-04.1.2 (its Inactive anaesthetist criterion, finishing the story, D96), DM-05, DM-06, DM-07 |
| 53 | The People section and the shared record pattern | Lane A | 46 to 52 | 2 sessions | A People entry where Patients was, with its attention count, and four routed tabs (Anaesthetists, Surgeons, Specialties, Patients), each list searched, filtered and paged (D99). Every record route moves under People, and the old Master data, profile and Patients links redirect (D100). Master data keeps Places with a pointer across, and the Surgeon groups list goes (D98). The Contract page's cards and a side panel are lifted into shared components with catalogue rows, the Contract page unchanged (D104). Covers US-13.4.1 (D105) |
| 54 | The anaesthetist's page | Lane A | 50, 52, 53 | 1 session | A page per anaesthetist keyed by registration number: identity, contact, bank, rate and tier (50's card) and status (52's card) cards, each saved on its own as one audited change; a side panel of pairings, linked Contracts and next Lists with See all; Make inactive on the page. The all-fields edit sheet goes. Covers US-12.1.4 |
| 55 | The surgeon's page, and surgeon groups cut | Lane B | 53 | 1 to 2 sessions | A page per surgeon: name and practice, registration, HPI CPN, specialties and contacts cards, each saved on its own as one audited change; a side panel of pairings both ways, linked Contracts and next Lists with See all; no Groups card. The surgeon group record, its actions, seed and screens removed, with a `PERSIST_VERSION` bump; the surgeon-group Party stays (D98). Covers US-13.6.2, DM-08 |
| 56 | The specialty's page | Lane B | 53, 55 | 1 session | A page per specialty listing its surgeons and its Contracts with counts, where it is renamed (one audited change, reaching every holder) or removed (refused while held). Covers US-13.4.4 |
| 57 | The Patients tab and the patient's page | Lane C | 51, 53 | 1 to 2 sessions | The Patients tab with Coming up (default), Needs follow-up (one row per patient with its reasons, from a pure `patientsNeedingOffice`) and All, searched and paged; its count is People's attention count. Follow-up actions move from the rows to the patient's page, which follows the shared record pattern with the details in the side panel. Covers US-11.3.1, US-11.3.3, US-11.1.1, DM-10 |
| 58 | [The Finances section shell](phases/phase-58-finances-section-shell.md) | Lane A | none | 1 to 2 sessions | One Finances entry in the Admin side nav where Invoices, Billing monitor and Ledger were, with one amber badge, never crimson (D109). The section frame: AdminPage title, LineTabs with "needs doing" CountBadges from `financeCounts.ts`, six routed tabs opening on Billing, and the four record routes under them (D107). Every old URL redirected with replace (D108) and every in-app link re-pointed through `financePaths.ts`. Today's panels moved unchanged to their homes, each tab and record in its own file (D110): the Billing monitor split (pipeline as Billing; cycle, runs and events awaiting the run to Payments; Xero queue and changed in Xero to Xero; Holding account to Ledger; the AA fee strip and four tiles dropped), `AaFeesScreen` as AA fees. Every trigger on the three screens re-homed to one screen (D111); about 60 `data-shot` hooks carried. Covers US-13.3.3, FT-13.3 (D114) |
| 59 | [The Finances read models](phases/phase-59-finances-read-models.md) | Lane B | none | 1 session | Pure, tested read models in new files under `src/domain/billing/`, no UI: each Booking's and List's billing status (stage; sent, in Xero, paid in, disbursed; problem reason and its fix; Problems, In progress or Done; a List's counts; grouped by anaesthetist), each invoice's state (Unpaid, Part paid or Paid, with an unpaid one's age), what is still owed, its kind and its search keys (invoice number, payable number, case reference, patient, payer, anaesthetist), and the count of problem Lists. The reason-and-fix vocabulary names the new code for a payer with no billing email or postal address (D116), and `BillingException` gains optional `resolvedBy` and `resolvedNote` for Mark resolved. Touches no screen, store, router or registry file. No unit of its own: groundwork for 60 and 62 (D114) |
| 60 | [The Billing tab](phases/phase-60-billing-tab.md) | Lane A | 58, 59 | 1 to 2 sessions | The Billing tab as the mock's version C over 59's model: one table grouped by anaesthetist, each List a GroupRow `level="sub"` heading (date, session, hospital, status, counts sent, in Xero and paid in, billing run, Show all) over its Bookings (status, invoices, sent, in Xero, paid in, disbursed). Opens on Problems; Problems, In progress, Done and All, a search and an anaesthetist filter, paged. A failed Booking's reason under the patient's name, with Retry, Fix the payer and Mark resolved beside it, each audited; a payer with no billing email or postal address now fails the Booking in the run, so Fix the payer then Retry bills it (D116). The rail's short Awaiting approval list opens the Review queue and never approves. The Billing count, and the badge's billing part with it, re-based on 59's problem Lists (D109). Covers US-13.3.1 (and US-13.3.2's fix beside the Booking, D114) |
| 61 | [The Xero tab](phases/phase-61-xero-tab.md) | Lane A | 58, 60 | 1 session | The Xero tab, opening on what needs action: hand-offs to Xero waiting or failing, each with attempts, next try, last error and Retry now; invoices changed directly in Xero, from the daily poll, each resolved in the Resolve side panel; the connection line. A Booking stuck at Xero shows here and as a problem under its List on Billing. Covers US-13.3.2 (finishing it, D114) |
| 62 | [The Invoices tab](phases/phase-62-invoices-tab.md) | Lane B | 58, 59 | 1 session | The Invoices tab over 59's model: every invoice, prepayment invoice and credit note AA raises on a payer, found by invoice number, payable number, case reference, patient, payer or anaesthetist; Kind, State (with an unpaid one's age) and Owing columns; Unpaid (where it opens), Part paid, Paid, Awaiting approval and All. Prepayment invoices are approved and sent under Awaiting approval, with the approval switch beside the list in the right column. AA fee invoices stay off the tab. Covers US-08.4.7, US-06.3.1 |
| 63 | [The invoice and credit note pages](phases/phase-63-invoice-and-credit-note-pages.md) | Lane B | 58, 62 | 1 session | The invoice page and the credit note page under Invoices on the record pattern (D107): back link to Invoices, the number with its payable's ID chip and its state, a summary line, and the rail's seven private cards become shared Cards and RailSections with History last; the paper stays custom. The credit note page shows its negative invoice and what replaced the original. No unit of its own: the record half of US-13.3.3 (D114) |
| 64 | [The Ledger tab](phases/phase-64-ledger-tab.md) | Lane C | 58 | 1 session | The Ledger tab: one Notice sentence saying whether the books are square and naming what is wrong, and four StatTiles two by two in the rail (owed to AA, owed to the anaesthetists, the AA Holding account, receipts to place); a segmented Anaesthetists, Invoice pairs or AA Holding account list (the provisional pill kept, OQ-125), each anaesthetist's row showing billed, paid into AA, disbursed, AA owes them and they owe AA; receipts to place in the rail with Allocate and Mark refunded (D106). The whole/one switch and the ten tiles leave the tab. No unit of its own: US-13.2.1's tab half (D114) |
| 65 | [The anaesthetist's account page](phases/phase-65-anaesthetist-account-page.md) | Lane C | 58, 64 | 1 session | The anaesthetist's account page under Ledger on the record pattern: what AA owes them and what they owe AA, their invoice pairs (billed, paid in, disbursed), their payment runs with See all and their credit trails, a way back to the Ledger and a link to their People page. It replaces the whole/one-anaesthetist switch. Covers US-13.2.1 (finishing it, D114) |
| 66 | [The Payments tab and the payment run pages](phases/phase-66-payments-tab-and-run-pages.md) | Lane C | 58 | 1 session | The Payments tab: the week's cycle (StepRail, Close the week, the Monday checks, approve BCTIs, send the schedule, Run payables), what waits for the run, every earlier payment run (paged), and the events awaiting the run in the rail. Each run's page under Payments, with its week number and each anaesthetist's remittance advice on its own page under it, on the record pattern. As written; OQ-47 untouched. Covers US-10.2.7 |
| 67 | [The AA fees tab](phases/phase-67-aa-fees-tab.md) | Lane B | 58 | 1 session | The AA fees tab: AA's fee invoices to the anaesthetists, opening on the unpaid ones, with the month's run and its preview beside them and the fee settings on the same tab (`/aa-fees/settings` opens it with them in view). Not on the Invoices tab. Covers US-10.3.1, US-10.3.3 |

## Open questions

Five questions were added on 2026-11-25, three with the Contracts section and two with the People
section, and one on 2026-11-26 with the Finances section; all are open and none is answered, so the
phases build without them. Older open questions touch planned phases too: for the Finances phases they
change a label or a step only, and are built as written with the defaults below.

| Question | Owner | Gates | Built meanwhile |
|---|---|---|---|
| OQ-144 Disabling a Contract from a future date | Donald to ask AA | 45, 49 (D90); 52 (no effect) | No scheduled disable; the to-do on the change date stands in. An inactive anaesthetist's last day is never a date on a Contract |
| OQ-145 A hospital's untagged Contracts on the step rail | Donald to ask Ben | 46, 47 (D91) | As built: under Special, read through `destinationOf` |
| OQ-146 Which backstops each hospital and funding tag gets | Donald | none | As built (US-04.3.9 Matches): an RVG and a Fixed price backstop per place. 45's system-Contract pages and 47's groupings show whatever system Contracts the seed makes. Nothing is built for it |
| OQ-147 How an anaesthetist who has left sees later remittances | Donald to ask AA | 52 (D97) | Sign-in stops entirely after the last day; later remittances go by email from the office, and nothing is built for them |
| OQ-148 Whether AA needs any record of surgeons who practise together | Donald to ask AA (Greg) | 53, 55 (D98) | No surgeon group record: a group that holds Contracts is a Party, its surgeons the ones linked on its Contracts |
| OQ-149 Where a receipt nobody can place is placed | Donald to ask AA (Greg) | 64 (D106); US-13.2.4 (parked) | As built: Allocate and Mark refunded kept on the Ledger tab, in the system only; a held receipt is a failed ledger check and counts among the receipts to place; nothing is pushed to Xero |
| OQ-114 How each Party's invoices are delivered (older) | Donald to ask Ben and Vanessa | 48 (no new work); 62, 63 | As built: email or post, shown on the Party page, the Invoices tab's Delivery column and the invoice page's Delivery card |
| OQ-122 Posted invoices for payers without email (older) | Donald to ask Vanessa | 62, 63 | As built: the Delivery column and card read as today; no portal delivery is added |
| OQ-120 Does a prepayment invoice name the anaesthetist (older) | Donald to ask Vanessa or Ben | 62 | As built (`PREPAYMENT_NAMES_ANAESTHETIST`, provisional): a watch item, not a gap |
| OQ-47 Does the accountant agree to the weekly payment cycle (older) | AA accountant | 66 | US-10.2.7 as written: Friday close, Monday checks, Tuesday payment, anomalies held out and rolled to the next week; the StepRail's steps and days unchanged |
| OQ-29 GST agency treatment of the receivable and payable invoices (older) | AA accountant | 66 | "BCTI" as today: "Approve BCTIs" and the BCTIs column keep the name |
| OQ-60 and OQ-112 What the AA fee counts, and month end or the 20th (older) | AA accountant | 67 | As built: one practice-wide schedule, run at month end; the preview and "Next run" read as today |
| OQ-125 What triggers the release of a prepayment from the holding account (older) | Donald and Greg | 64 | The Ledger's AA Holding account list keeps today's provisional pill |
| OQ-83 The anaesthetist's sign-in experience (older) | Donald | 52 | As built: the simulated account sign-in for the demo account (Dr Souter), provisional. 52 adds only the inactive refusal |
| OQ-143 Surgeons without an HPI CPN or a full name (older) | Donald to ask Vanessa | 55 | As built: a blank HPI CPN saves ("No HPI CPN yet") and a duplicate is refused |

## Sequencing rules

- **Every phase after 45 runs in a build lane** (owner, 2026-11-25 and 2026-11-26), in its own git
  worktree, wave by wave; [LANES.md](LANES.md) holds the lanes, the ownership tables, the sync, the
  joins and the conflict rules, and overrides a phase's kick-off prompt, the run-build-phase skill and
  CLAUDE.md for a lane session. A phase starts only when every phase in its `depends_on` is DONE and
  committed on its branch. A session on `master` never runs a lane phase from its own prompt.
- **Every phase 58 to 67 tests once, at the very end (D113).** Each finishes on the quick checks only:
  `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --changed` plus
  `npm run lint` in `aa-prototype/`. It skips the adversarial review, the screen-proof against the
  design and the manual checklist run, keeping the checklist in its doc for the final join. It updates
  the Playwright specs it knows it breaks without running them. Wave 4's join runs the quick checks on
  the merged code and moves on. Wave 5's join is the only full gate: `phase-check.mjs` without
  `--changed` plus lint, one review of all ten phases, the fixes, the merge to `master` and
  `TEST-58-67.md`. This overrides the run-build-phase skill, LANES.md's gate steps and CLAUDE.md's
  "full gate before merging" for these phases only.
- **Every phase 58 to 67 uses subagents as much as possible (D112):** parallel subagents to read code
  and requirements, one per independent panel or file of the build (each told which files are its
  own), and for any review; the session keeps its own context for decisions and joins.
- **Wave 1: two lanes, once 45 is DONE on `master`.** **Lane A** builds 46 then 49 and **Lane B** 47
  then 48. Whichever finishes second joins them onto `master` as soon as the full gate is green and
  writes `TEST-45-49.md`. Lane C does not run in Wave 1. (Done.)
- **Wave 2: once 46 to 49 are on `master`.** **Lane A** builds 50, then 52, then 53. **Lane B** builds
  51 beside it. 53 starts only once 51 is complete: at 53's start Lane A merges Lane B's `51 complete:`
  commit. The join, by Lane A (the last to finish), takes in 50 to 53 once the full gate is green;
  there is no owner test after it. (Done.)
- **Wave 3: three lanes, once 53 is on `master`.** **Lane A** builds 54, **Lane B** 55 then 56, and
  **Lane C** 57. The last to finish joins them and writes `TEST-50-57.md`. (Done.)
- **Wave 4: two lanes, once this plan is on `master` (D112).** **Lane A** builds 58 (Lane A's session
  sets the lanes up again first, LANES.md "Setting up the lanes"), **Lane B** builds 59, and Lane C is
  idle. The second to finish joins them on `wave/4` with the quick checks only (LANES.md "Checking Wave
  4's join") and fast-forwards `master`: no full gate, no review, no owner test.
- **Wave 5: three lanes, once 58 and 59 are on `master` (D112).** **Lane A** builds 60 then 61, **Lane
  B** 62, then 63, then 67, and **Lane C** 64, then 65, then 66. The last to finish joins them on
  `wave/5`, makes the route, link, trigger and count changes the lanes noted, runs the full gate once
  and one review of 58 to 67 (LANES.md "Checking Wave 5's join"), fixes what it finds, fast-forwards
  `master` and writes `TEST-58-67.md`; then the lanes are torn down.
- **The owner tests three times, never between phases or waves.** 45 to 49 once after Wave 1's join,
  from `TEST-45-49.md`. 50 to 57 once after Wave 3's join, from `TEST-50-57.md`. 58 to 67 once after
  Wave 5's join, from `TEST-58-67.md` (Wave 4's join is not tested on its own). Wave 4 does not wait for
  the owner's test of 50 to 57: a fix from it lands on `master` and reaches the lanes through their
  `git merge master` at each phase start.
- **Run order.** 45; Wave 1 (46 and 47 side by side; then 49 and 48); join; Wave 2 (50 and 51 side by
  side; then 52; then 53); join; Wave 3 (54, 55 and 57 side by side; then 56); join; Wave 4 (58 and 59
  side by side); join (quick checks); Wave 5 (60, 62 and 64 side by side; then 61, 63 and 65; then 67
  and 66); join (the full gate, once).
- **45 first.** It makes the section, its routes, the redirects (D93) and the Contract page. It also
  adds the shared pieces the later phases reuse: the Card editing and footer variant (46's and 48's
  pages, 49's sheet, 50's card) and the ConfirmSheet danger variant over `stillOnContract` (49's late
  disable). From 45 to 46, New contract still opens the old `ContractEditSheet` in create mode; its
  edit path is gone.
- **46 after 45.** The new page lands on 45's Contract page. 46 deletes `ContractEditSheet` and its
  warning-only "Replaces" picker. From then until 49, a dated change is a new Contract made by hand,
  with no warning list, and Replace from a date waits for 49 (on 46's owner review list).
  `stillOnContract` and `proceduresStillOnContract` stay: 45 and 49 read them.
- **47 after 45.** It groups 45's moved list. 47 maps `?holder=` (and D93's redirected `&holder=`) to
  the holder grouping. Its doc still says it finishes US-04.1.2; 52 now does (D96).
- **48 after 47.** Each Party's per-tag counts open the catalogue through 47's `?group=` and `?in=`
  URL, and the tags tab's hospital grouping reuses `groupContracts`. 48 removes the last three Master
  data views. It builds as its doc says, US-13.4.1's Contracts-section half and its "two places" test
  wording included; the story's unit is 53's, which moves `masterViews.test.ts` to three places.
- **49 after 45 and 46, last in Lane A's Wave 1 queue.** Replace sits in 45's Contract page header and
  shares 45's still-on-Contract list (the late disable reads it from the change date). Its sheet
  reuses 46's rule-order form sections. 49 also has the only new Contract store action.
- **Wave 2 (D101).** 50 and 51 need nothing from each other. **50 first, in Lane A:** its card is
  self-contained on today's anaesthetist record, on 45's Card editing and footer props. **51 in Lane B,
  beside it:** it adds its Intake route, turns the Patients `waiting` route into a redirect and adds its
  route component, and writes in its notes what it changed in `router.tsx`, `routes.tsx` and the
  selectors. **52 next in Lane A, after 50:** 49 is on `master` already, so there is nothing to merge;
  it builds on 50's card in the same file and calls `disableContract` and `enableContract` from new
  files, which leaves the Contracts code untouched.
- **53 last in Lane A's Wave 2 queue, after 50 and 52 and after Lane B's 51.** At its start it merges
  Lane B's `51 complete:` commit (stopping as blocked if 51 is not complete). It owns every shared shell
  file (router, side nav, AdminApp, routes, the Master data registry, the redirects) and lifts the
  record pattern, so nothing else runs while it does except Lane B's 51 if not yet finished, which 53
  merges first. The Contract page's behaviour must not change. It moves the record routes with
  today's screens, which Wave 3 rebuilds.
- **Wave 3 after 53.** 54 reuses 50's and 52's cards and 53's pattern. 55 cuts surgeon groups and
  rebuilds the surgeon's page. 56 follows 55 in Lane B: its rows open the surgeon's page. 57 rebuilds
  the Patients tab and the patient's page on 51's counts and 53's tab. Each adds or swaps only its own
  routes in the People block and never reorders it, and extends 53's shared components with a prop,
  never rewriting them.
- **58 first, the only Finances phase that touches the shell (D107 to D111).** It owns `router.tsx`
  (the Finances block and every old-URL redirect), `SideNav.tsx` (the entry and its amber badge),
  `AdminApp.tsx` (`sectionForPath`, the badge sum), `apps/admin/routes.tsx`, the new `screens/finances/`
  folder with `financePaths.ts` and `financeCounts.ts`, every in-app link to the old URLs (the Day
  view's rail and to-do, the dashboard's reconciliation links, the Review queue, the Booking and patient
  pages, the Xero simulator) and `shared/demoTriggers/registry.ts`. It moves today's panels unchanged:
  no tab is redesigned in 58. Every tab and record renders from its own file outside `routes.tsx` (the
  credit note page, the remittance page and the anaesthetist's ledger view included), so Wave 5 never
  edits it. `financePaths.ts` fixes each link's query shape once (the Invoices tab's Awaiting approval
  link, the Billing tab's problems link, the account page), and the Wave 5 tab maps that shape to its
  own filter rather than changing the helper. `financeCounts.ts` exports each tab's count and the badge
  as one function over them (D109), so 60's re-base of the Billing count carries the badge with it. It
  adds nothing under `domain/billing/`: a pure helper the counts need lives in `screens/finances/` or
  `store/`. It writes the file contract as shipped in `notes.md` and its PROGRESS entry.
- **59 beside 58, in new files and two optional fields.** Pure functions with Vitest tests in `src/domain/billing/`, split
  so each Wave 5 lane owns one: the Booking and List billing status (Lane A's in Wave 5) and the
  invoice state, owing, kind and search keys (Lane B's). It defines the problem reasons and their fixes
  (retry, fix the payer, mark resolved), including the new code for a payer with no billing email or
  postal address that 60's run raises (D116), and adds optional `resolvedBy` and `resolvedNote` to
  `BillingException` in `domain/types.ts`, a failure resolved by hand being one with no
  `resolvedPairIds`. It says which open Xero hand-offs belong to a Booking on a List, so 60's badge
  counts a stuck List once (D109). It reads state slices and indexes passed in, never the store, and
  holds at practice scale (about 18,000 Lists). It adds lines to `domain/billing/index.ts` only if it
  exports through the barrel; 58 has no reason to touch that file or `domain/types.ts`, so the two
  share no file.
- **60 after 58 and 59, first in Lane A's Wave 5 queue.** It rebuilds `BillingMonitorScreen.tsx`'s
  remainder as the Billing tab, adds the List counts to GroupRow `level="sub"` in
  `shared/table/cells.tsx` (additive; `68229e4e` already gave `Td` a `rowSpan` there) with its
  catalogue row, builds the fix-the-payer and mark-resolved store actions in new files, makes the run
  fail a Booking whose payer has no billing email or postal address (`store/billingRun.ts`,
  `store/invoiceMaterialise.ts`, re-checking every `noAddress` reader, D116), writes the "Payer loses
  billing email" trigger body for the final join to register (D111), and re-points the Billing count
  and the badge's billing part in `financeCounts.ts` to 59's problem Lists (D109). Its Awaiting
  approval list only opens the Review queue. No other Wave 5 phase edits the billing run.
- **61 after 60.** The Xero tab is `XeroPanels.tsx` behind 58's `XeroTab.tsx`; a Booking stuck at Xero
  must show under its List on 60's Billing tab, which 61 walks to finish US-13.3.2.
- **62 after 58 and 59, first in Lane B.** `InvoicesScreen.tsx` and `PrepaymentApprovalStrip.tsx` over
  59's invoice model; Awaiting approval becomes a filter that accepts 58's link shape. **63 after 62:**
  `InvoiceDocument.tsx`'s rail and the credit note page, the paper untouched. **67 last in Lane B:**
  `AaFeesScreen.tsx` behind 58's `AaFeesTab.tsx`, settings on the same tab while 58's
  `/aa-fees/settings` route still opens it.
- **64 after 58, first in Lane C.** `LedgerScreen.tsx`, `HoldingAccountPanel.tsx` and the Ledger's use
  of `ReconciliationCard.tsx` (the Day view's card stays as built). It takes the whole/one switch off
  the tab; the account route keeps today's one-anaesthetist view until 65. **65 after 64:** the account
  page and `LedgerPaymentRuns.tsx`. **66 last in Lane C:** `PaymentCyclePanel.tsx`, 58's
  `PaymentsTab.tsx` and `PaymentRunScreen.tsx`; it keeps `PaymentCyclePanel`'s exports, which
  `XeroPanels.tsx` and `LedgerPaymentRuns.tsx` import.
- **No Wave 5 phase edits the shell (D112).** Not `router.tsx`, `SideNav.tsx`, `AdminApp.tsx`,
  `routes.tsx`, the redirects, `financePaths.ts` or the registry; only 60 edits `financeCounts.ts`. A
  change a phase needs there goes in `notes.md` and under "For the merge", and the final join makes it.
  Every lane keeps each panel's export name and existing props, so `/demo/catalogue/admin` compiles
  unchanged; a catalogue row that must change is edited in its own block only.
- **The BACKLOG lines the split should help.** 60 checks the Billing monitor's 15,600px page (gone with
  the grouped, paged table) and the monitor's URL-update and "18014 lists" lines; 64 measures the
  Ledger's 3 to 4 s open and its 1440 overflow; 66 measures Run payables' 12 to 35 s freeze at practice
  scale and makes it asynchronous or faster if the split did not. Each deletes a line it closes and
  notes what changed; the final join re-checks all three.
- **`PERSIST_VERSION`.** 45 to 51 expect no bump (49 only if DM-01 takes a stored field or the seed
  gains a replacement). 52 bumps it (the anaesthetist's last day) and 55 bumps it (the surgeon group
  slice removed). 58 to 67 expect no bump: no seed change (62 only if no seeded invoice serves the
  40-day unpaid example; 60 only if the payer with no billing email is seeded rather than staged by
  its trigger). A join that meets two bumps sets one past the higher. Any phase that seeds an
  acceptance criterion's example bumps it.
- **The screenshots and the guide wait for the sweep.** The redirects (D93, D100, D108) keep the
  recipes, ATLAS routes and the guide's links loading. Recipes that click into a retired panel, view or
  sheet break until the owner's sweep re-points them, and each phase lists those under "For the sweep"
  (for 58 to 67: about 76 recipes, 32 on the Billing monitor, 38 on Invoices and 6 on the Ledger; the
  guide's 48 "Billing monitor" mentions and S3 Beats 6 and 7). Phases update the Playwright specs in
  `aa-prototype/visual/` that they break (58 to 67 without running them: the final join runs them).

## Milestones

- **After 45:** Contracts as its own Admin section. Open any Contract on its own linkable page and
  change it one card at a time, one audit entry each. Read ten years of price ranges as a table with
  the Procedures each priced. See who a Contract touches before changing it, and disable it only
  after confirming the Procedures still on it.
- **After 47:** The catalogue grouped six ways with an index of groups and counts: every SXAP
  Contract across hospitals, or what one surgeon's Lists can be priced at. New Contracts are entered
  on their own page in rule order, with a live step-rail preview and a similar-name hint.
- **After 48:** The whole Contracts section: the Contracts, Parties and Funding tags tabs, a page per
  Party with its Contracts counted by tag, and each tag's Contracts by hospital. Master data keeps
  the rest of the reference data and points across.
- **After 49:** Replace a Contract from a date in one action: copied at the new rate, the ticked
  Procedures moved, the old one left active with a to-do on the date or disabled now, and a late
  disable listing from the change date. S5's "a new Contract supersedes the old one" now works as the
  guide scripts it; the owner's sweep brings the guide's wording in step.
- **After 52:** The tier edited with the rate in one card (Edit, choose, Save), and the Anaesthetists
  list filtered by tier. Waiting for NHI as its own tab on Intake, counted once. Make Dr Beaumont
  inactive from a last day: refused while she holds a List after it; after the day she has no Slots,
  is not offered, cannot sign in, and her Rhinoplasty Contract is disabled; made active again, it is
  offered back ticked at $1,350.00.
- **After 53:** One People section where Patients was: anaesthetists, surgeons, specialties and
  patients as tabs, each list searched, filtered and paged, and every old link still lands. The
  Surgeon groups list is gone, and Master data keeps the places.
- **After 57 (Wave 3 joined):** A page for every anaesthetist, surgeon, specialty and patient, its
  cards saved one at a time, with a side panel of pairings, Contracts and next Lists. Surgeon groups
  are gone from the model. The Patients tab shows Coming up, Needs follow-up (one row per patient,
  the reason on it) and All, and the action is taken on the patient's page.
- **After 58 (Wave 4 joined, with 59):** One Finances entry in place of Invoices, Billing monitor and
  Ledger, with one amber badge. Six tabs, each with its own address and a number only where something
  needs doing, opening on Billing; every old link and bookmark still lands; today's panels sit on
  their new tabs and every demo button on its one screen.
- **After 61:** The Billing tab opens on Problems: each anaesthetist's Lists as headings with their
  counts and only the Bookings that need something, each with its reason and its fix (retry, fix the
  payer, mark resolved) beside it; a List awaiting approval opens the Review queue. The Xero tab lists
  the hand-offs waiting or failing and the invoices changed in Xero, each with its own fix.
- **After 63:** Find any invoice by number, payable number, case reference, patient, payer or
  anaesthetist, opening on Unpaid with what is still owed and the age of each; approve prepayment
  invoices under Awaiting approval with the switch beside them; open an invoice or a credit note on
  its own page under Invoices.
- **After 66:** The Ledger in one sentence and four figures, with the anaesthetists, the invoice pairs
  or the AA Holding account a click apart and the receipts to place beside them; each anaesthetist's
  account on its own page; the weekly payment cycle and every run on the Payments tab, each run with
  its page and remittances.
- **After 67 (Wave 5 joined, tested once):** The whole Finances section: the AA fees tab opening on the
  unpaid fee invoices with the month's run and the fee settings beside them, and 58 to 67 through the
  full gate and one review, ready for the owner's test from `TEST-58-67.md`.

## Parked

Five units are parked: four data-model deltas Phase 49 built, and US-13.2.4, which no phase builds.

| Unit | Why parked |
|---|---|
| DM-01 | A Contract remembers which Contract it replaces, and from when. Built by Phase 49 (DONE, joined onto `master` in Wave 1): the link and date ride the new Contract's `contract.create` audit entry (D94). The delta was not re-graded at `f885f67` (unchanged), so it stays parked rather than on a built phase; re-grade it as Matches when a later update touches it, and drop it here. |
| DM-02 | Replace a Contract from a date, as one action (`replaceContract`). Built by Phase 49 (DONE); not re-graded at `f885f67`. Re-grade as Matches at a later update. |
| DM-03 | A Contract still Active after its replacement's date is a To-do. Built by Phase 49 (DONE) as the Contract-subject rule `replacedContractStillActive`; not re-graded at `f885f67`. Re-grade as Matches at a later update. |
| DM-04 | Disabling is confirmed and lists the Procedures first. The confirm was built in 45 and the replaced case (listing from the change date) in 49, both DONE; not re-graded at `f885f67`. Re-grade as Matches at a later update. |
| US-13.2.4 | Reconciliation status at a glance (Proposed). Partial: the clearing-account (should read zero) and sub-ledger against control-account checks are deliberately not modelled, pending the posting design Greg and Sam are drawing. This change touched only its Notes (no summary page: the status stays on the Day view, and the Ledger tab says the same in one sentence). The Day view's `ReconciliationCard` stays as built; 58 re-points its links (`/admin/ledger`, `/admin/billing?problems=1`) to the Finances tabs and the old addresses redirect; its unplaced-receipt item follows OQ-149 (D106). No phase builds the extra checks. |

## Standing rules

The rules every phase follows. The `run-build-phase` context pack quotes these sections to each phase.

### Running a phase

Every kick-off prompt is short: it names the phase, tells the agent to load the `run-build-phase`
skill (`requirements-board/agent/skills/run-build-phase/`), and adds only what the phase doc does not
already say. Every prompt carries the same Override block: commit when green (stage by path, never
push); skip the screenshot recipes, the demo guide and the capture (the owner's sweep does them). The
skill holds the rest, the same for every phase: a context pack (`phase-context.mjs`); the drift check;
plan and build; quick partial checks while building and the full green set at gates
(`phase-check.mjs`); the design-fidelity check and the manual checklist; the review; a short PROGRESS entry with a Handoffs block; and updating `status.json` and the plan page
so it names the next phase. A prompt line wins over the skill; the phase doc wins over the skill for
what to build. For 58 to 67 the gate is the quick checks only, and the design-fidelity check, the
manual checklist run and the review are skipped: Wave 5's join does them once for all ten (D113).

### Owner review: agents test themselves

- **No plan-approval stop.** After the drift check, the agent writes its step plan and starts building
  straight away. It never enters plan mode itself. When the owner starts a session in plan mode, the
  agent does all its reading and the drift check first and presents the plan once; after approval it
  builds to the end without further stops.
- **The agent is the tester.** It runs the phase's manual test checklist itself, in the running app
  (start root `npm run dev` in the background if 5173 or 5174 is down), driving it with Playwright or
  the `/run` skill and checking screenshots by eye. "Handset" checks use the emulated mobile viewport
  unless a real phone is attached. Each item is reported pass or fail with its evidence. For 58 to 67
  the phase skips this run; Wave 5's join walks the ten checklists for the owner's test sheet (D113).
- **Defaults over questions.** Where a phase doc says "ask the owner" about a product choice, the agent
  builds the stated default, labels it provisional where the doc says so, and logs it on the phase's
  "For the owner's review" list instead of asking.
- **Stop and ask only when it is very needed:** a drift-check stop the phase doc names, a blocker no
  documented default resolves, or an action that is destructive or hard to undo.
- **Then the owner tests.** The phase commits when green and hands over: what changed, where to try
  it and the "For the owner's review" list. For the lane phases the owner tests three times
  ([LANES.md](LANES.md)): 45 to 49 once, after Wave 1's join, from `TEST-45-49.md`; 50 to 57 once,
  after Wave 3's join, from `TEST-50-57.md`; and 58 to 67 once, after Wave 5's join, from
  `TEST-58-67.md`.

### Front-end design

Before building or reshaping any screen, sheet, dialog, panel, row, banner or state, the agent loads
the `frontend-design` skill (the `run-build-phase` skill holds this step). It works inside the design
system, not over it: the `docs/design` files and `src/theme` tokens stay authoritative (PROGRESS
binding convention 17, CLAUDE.md "Design"), so it shapes layout, hierarchy, spacing, states and finish,
never a new palette, typeface or visual language, and the two hard rules (crimson identity only, teal
the only action colour) hold. Each changed screen is screenshotted beside its mockup at the same
viewport and compared before the phase is called done (for 58 to 67, once, at Wave 5's join: D113). A
phase that touches UI names, in its doc, the design page and screen for each screen it changes. Store,
seed and pure-domain steps do not need it.

### One component per job

- UI in a phase is built from the shared components: `src/shared/ui/` (controls and feedback),
  `src/shared/surface/` (sheets, dialogs, modal behaviour), `src/shared/table/` (tables) and
  `src/shared/calendar/`. `src/shared/ui/README.md` lists what exists and how to add a variant.
- If a shared component cannot do what a phase needs, the phase extends it with a variant or prop that
  defaults to today's look and matches a pattern in `docs/design/`; it never copies the component into
  a screen file. A new private copy of a shared component is a review finding, and
  `src/apps/oneComponentPerJob.test.ts` enforces it (its allow-list only shrinks).
- A phase that rebuilds a screen also migrates any remaining copies on that screen.
- A shared component keeps its hooks: it takes `shot`, emits `data-shot` on the element recipes
  target, and passes `data-*` attributes through.
- The catalogue rows (`/demo/catalogue/*`) change in the same session as the component.
- A phase that touches UI carries the "Build on the shared components" work item and the review line.

### Demo triggers

The mechanism exists (`src/shared/demoTriggers`). A phase registers new entries or re-points existing
ones; none adds a trigger to the Control Panel page. Each entry declares:

- the route patterns it belongs to;
- the surfaces it shows on: harness bar, PWA sheet, or both;
- a `run(api, ctx)` that acts on the entity in the URL (`listId`, `bookingId`, `invoiceId`,
  `dateISO`) or on screen state published through `useDemoTriggerContext`, not a hardcoded seed id
  wherever possible;
- a disabled state.

The harness bar shows a trigger only on its screen. The Control Panel keeps the scenario jumps, the
clock and reset, and lists every trigger under its screen. Trigger bodies, the context hook and the
shared actor constants live in `src/shared` or `src/store`, so the PWA purity test holds. Product
actions stay in the product UI, not the bar. A trigger added or renamed keeps
`src/shared/demoTriggers/demoGuideSync.test.ts` green.

### PWA parity

The PWA has no harness bar and no Admin app, so a handset demo cannot switch to the office. A phase
whose beat has a mobile side that waits on the office, a colleague or a backend event registers a
PWA-surface entry for the mobile screen concerned (an office stand-in, run as
`OFFICE_SIMULATION_ACTOR`). These stand-ins show on the PWA only: in the framed build the presenter
plays the office in Admin.

### Demo guide and catalogue screenshots

A version of the demo guide (`docs/demo-guide/`, with `master-demo-guide.html`) and the catalogue
screenshots goes to Anaesthesia Associates for testing and approvals. They are brought in step with
the app in one **sweep the owner triggers** (`/sweep`, the project skill `.claude/skills/sweep/`),
which takes everything changed since the last sweep (`docs/SWEEP.md`), updates the recipes, ATLAS and
the guide, runs the full gate and the capture, and commits.

- **Phases do not touch** the capture recipes, `ATLAS.md` or the demo guide, and never run the
  capture, not even `--dry`. A phase doc may note, under "For the sweep", anything new worth a
  screenshot or a guide beat.
- A phase keeps tests that read the guide green: `src/shared/demoTriggers/demoGuideSync.test.ts`
  (a renamed or new demo trigger fixes the guide line the test names, nothing more).
- Recipes and images are never touched while updating the plan.

### Confirm before building

Phases that carry unresolved open questions (OQ) or Verify, Open or Proposed items are listed here.
Each checks them at its drift check, and if they are still open builds the owner-decision default or
the recommended reading and labels it provisional in the UI.

| Phase | Items | Open questions |
|---|---|---|
| 45 | US-04.1.7, US-04.2.15 and DM-04, plus US-04.1.2's Disable confirmed and US-04.1.3's per-card audit (all Verify: Donald's 25 November decisions, not yet seen by AA): the page per Contract and its cards, the price ranges table, the confirmed disable | OQ-144 (D90) |
| 46 | US-04.1.2's New contract order and Similar name (Verify): the New contract page in rule order and the similar-name hint | OQ-145 (D91) |
| 47 | US-04.1.2 (Verify): the six groupings, the index and the search; the holder filter folded into the holder grouping | OQ-145 (D91) |
| 48 | US-04.1.5 and US-13.4.5 (Verify), and US-13.4.1's Contracts-section half: Parties and Funding tags as tabs, the Party page, each tag's Contracts by hospital | OQ-114 (as built) |
| 49 | US-04.1.8 and US-04.1.3 (Verify), DM-01 to DM-03: Replace from a date, the to-do on the date, the late disable from the change date | OQ-144 (D90) |
| 50 | US-01.3.6 (Verify) and DM-09: the rate and tier card, Edit then Save; the Anaesthetists list's tier filter | none |
| 51 | US-11.1.5, US-11.1.4 and US-02.1.4 (Verify): Waiting for NHI as a tab on Intake, counted once | none |
| 52 | US-12.1.6, US-13.5.3 and US-04.1.2's Inactive anaesthetist (Verify), US-01.1.1 (Agreed; its "active" now links to US-12.1.6), DM-05 to DM-07: the last day and its refusal, the Slots, sign-in, the Contracts disabled and offered back | OQ-147 (D97), OQ-83 (as built), OQ-144 (D90, no effect) |
| 53 | US-13.4.1 (Verify): the People section, its lists, the redirects, the Surgeon groups list gone, the record pattern lifted | OQ-148 (D98) |
| 54 | US-12.1.4 (Verify): the anaesthetist's page, its cards and side panel | none |
| 55 | US-13.6.2 (Verify) and DM-08: the surgeon's page, surgeon groups cut from the model | OQ-148 (D98), OQ-143 (as built) |
| 56 | US-13.4.4 (Verify): the specialty's page | none |
| 57 | US-11.3.1, US-11.3.3 and US-11.1.1 (Verify), DM-10: the Patients tab's filters, Needs follow-up one row per patient, the patient's page | none |
| 58 | US-13.3.3 (Verify: Donald's 26 November decisions, not yet seen by AA or Greg) and FT-13.3: the section, its tabs and addresses, the counts and the badge, the redirects, the panels moved | none |
| 59 | US-13.3.1, US-13.3.2 and US-08.4.7 (Verify), read for the models only: the billing status and its buckets, the reason for a payer with no billing email (D116), the invoice state, owing and search keys | none |
| 60 | US-13.3.1 and US-13.3.2's Fix beside the Booking (Verify): the Billing tab, version C, Problems first, a payer with no billing email failing the Booking and the fixes beside it (D116), approval only in Review, the badge's unit (D109) | none |
| 61 | US-13.3.2 (Verify): the Xero tab, Retry now, changed in Xero, stuck at Xero shows twice | none |
| 62 | US-08.4.7 (Verify) and US-06.3.1 (Verify): find any invoice, the states and owing, Awaiting approval as a filter with the switch beside it | OQ-114, OQ-122, OQ-120 (as built) |
| 63 | US-13.3.3's Record page (Verify): the invoice and credit note pages under Invoices | OQ-114, OQ-122 (as built) |
| 64 | US-13.2.1 (Verify), its tab half: the sentence, the four figures, the three-way list, receipts to place | OQ-149 (D106), OQ-125 (provisional pill kept) |
| 65 | US-13.2.1 (Verify): the anaesthetist's account page | none |
| 66 | US-10.2.7 (Proposed): the Payments tab and the run pages, as written | OQ-47, OQ-29 (as written) |
| 67 | US-10.3.1 and US-10.3.3 (Verify): the AA fees tab opening on unpaid, the run and the settings beside it | OQ-60, OQ-112 (as built) |
