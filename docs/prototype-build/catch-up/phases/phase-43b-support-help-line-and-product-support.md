# Phase 43b · Support: the help line for app users and product support for AA

**Requirements covered:**
[US-15.0.8](../../../../requirements-board/requirements/stories/US-15.0.8.md) Help line for app users (status 3 Verify, graded **Missing**, size M; retitled and rewritten on 18 November from "Help desk by phone and email" and moved here from 43a: a request form and a phone line in the apps, every request a logged and tracked ticket, hours and P1 to P4 response times, after hours only a security breach or the platform offline answered),
[US-15.0.9](../../../../requirements-board/requirements/stories/US-15.0.9.md) Product support for AA (new on 18 November, status 3 Verify, graded **Missing**, size S: incident, fix, change and new-feature tickets for AA's office with its own response table, best effort after hours, a public-holiday call-out with AA's approval, limited Christmas cover).
No DM or RV row covers it: the ticket record is a prototype-side addition (a new `support` slice), not a change to the catalogue's domain model.
**Answered, built as answered** (Donald's for the build, not yet confirmed by AA): [OQ-137](../../../../requirements-board/requirements/questions/OQ-137.md) (D83: 8:30am to 5:00pm NZT, Monday to Friday, excluding New Zealand public holidays; two channels).
**Open, built to its default:** [OQ-141](../../../../requirements-board/requirements/questions/OQ-141.md) (D87: whether AA needs cover from 8:00am, and on which channel).

**Depends on:** Phase 42 (the master public-holiday calendar, `masters.publicHolidays`, which the support hours read), 43a (the More tab's and the nav's last edits, so the Help entries land on a settled layout; use the names it shipped) and U6 (`Card`, `Eyebrow`, `DefRow`, the table kit). Built: 14 (the demo-trigger registry, PWA Demo sheet, `useDemoTriggerContext`), U2 (`SidePanel`, `BottomSheet`, `OverlayHeader`, `SheetActions`), U3 (`Pill`, `Notice`, `EmptyState`), U5 (`Button`, `LineTabs`, `TextAction`).
**Estimated:** 1 session: items 1 to 5 (rules, model, store, seed), green checkpoint, then 6 to 10 (panel, three entries, triggers, guide, shots).

## Goal

Anyone using an app can get help from Stratos' support line, and AA's office has a route for product work, both simulated and badged, and both read from the demo clock.

A **Help** entry in each app (mobile More tab and the PWA, web top nav, Admin side nav) opens one **support panel**: the phone line, the hours (8:30am to 5:00pm NZT, Monday to Friday, excluding New Zealand public holidays, from one config value), the P1 to P4 response times, whether the line is open at the demo clock's moment, a request form, and the requester's tickets. A request logs an audited ticket tracked Logged, Responded, Closed. In hours it shows its respond-by time; out of hours only a security breach or the platform being offline or unavailable is answered, and anything else is logged and waits for the next opening.

Admin's panel has a second tab, **Product support**, for incident, fix, change and new-feature tickets on the same record, with its own response table (P3 3 business days), best effort after hours, a public-holiday call-out that waits for AA's approval, and limited cover over Christmas and New Year. A new-feature ticket says it goes to the product owner or the development team to plan. Nothing claims a real ticketing system, SLA engine or incident process.

## Before you start

1. **Drift check** against the plan baseline `63a4490`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-15.0.8,US-15.0.9,OQ-137,OQ-141
   ```

   Re-read anything changed after `63a4490`. If either story is Retired or Future, drop it and record it; if a third channel or a different priority scheme appears, stop and tell the user. A changed hours answer is not a stop: OQ-141 is a one-line change in item 1's config.
2. **Confirm 42, 43a and U6 are DONE** and read their PROGRESS entries. From 42 note `PublicHoliday` (`kind: 'national' | 'regional'`), `masters.publicHolidays`, the seed rows (`PH001` Labour Day Mon 26 Oct 2026 national, `PH002` Canterbury Anniversary Fri 13 Nov regional, `PH003` Christmas Day Fri 25 Dec) and `PERSIST_VERSION`. From 43a note what it shipped on the More tab and in the web and Admin navs, and confirm it built no `HelpPanel`, `helpTickets` or `SUPPORT_HOURS` (its old help-desk plan moved here; if any exist, build on them, never beside them). Stop if 42 is not DONE (no calendar to read) and say so.
3. **Built as answered, no label** (the code says "Stratos' standard support terms"; one caption in the panel, "Simulated: how Stratos' support works is the real service's, not this prototype's"): the hours, the two channels, both response tables, after-hours and public-holiday rules, limited Christmas cover.
4. **Open, built to default** (one `SUPPORT_READINGS` block in `domain/support.ts`, one mist caption in the panel, "Our reading, to confirm with AA", and the owner's review list):
   - OQ-141: the hours stand at 8:30am to 5:00pm on both channels, held as two per-channel values both reading one constant, so an 8:00am start on either channel is a one-line change. No extra-cover pricing shown.
   - "NZ public holidays" means the national ones in 42's calendar (`kind === 'national'`); a regional anniversary day is a working day for support.
   - Response clocks run on business time: P1 one business hour, P2 by the close of that business day, help line P3 four business hours, product-support P3 three business days (same time of day, skipping weekends and public holidays), P4 none ("a mutually agreed time"). A security breach or platform outage out of hours counts as P1 and is due within the hour on the plain clock.
   - Out of hours, anything else is logged with "Not answered out of hours; picked up at the next opening" and no respond-by time.
   - Christmas and New Year cover is the window 24 December to 6 January, on product support only; a business hour inside it reads "Limited, best-effort cover".
5. **The demo clock starts at 8:00am**, before the 8:30am opening: after Reset the panel correctly reads "Closed, opens 8:30am". Do not move the clock's seed. The demo guide and cheat sheet say to use the clock menu's +1 hour first.

### Reads beyond the run-build-phase standard list

- **Design** (convention 17): [Design Language](../../../design/Design%20Language.dc.html) (pill tones, the warning tint for the "out of hours" notice, mono data, the sheet-in motion); [Mobile App](../../../design/Mobile%20App.dc.html) (the More tab, the bottom sheet), [Web Dashboard](../../../design/Web%20Dashboard.dc.html) (the white top nav), [Admin Day](../../../design/Admin%20Day.dc.html) (the dark side nav, the drawer chrome). No mockup draws a support panel: extend the List drawer's chrome.
- **ROADMAP.md:** D83 (hours and channels, answered, supersedes 43a's old "5:30pm in one string" default) and D87 (cover from 8:00am, open); the sequencing rules naming 43b (after 42 for the calendar; U6 first; the panel on `SidePanel`); "Owner review: agents test themselves".
- **GAP-ANALYSIS.md:** the EP-15 table rows for US-15.0.8 and US-15.0.9 and their entries in `gaps.json` (the missing list, the demo trigger text).
- **Catalogue:** the two stories in full; OQ-137's Answer and OQ-141; the 5 November Notes (`npm --prefix requirements-board run source -- --item US-15.0.8 --text`); RFP response p.32 and p.33 (artifact AR-36) for the old terms the stories replace; US-02.5.4 names the support-hours constraint but is not built here.
- **PROGRESS.md:** conventions 5 (demo clock) and 14 (demo triggers); the Decisions-log entries on the forward-only clock and `DEMO_TODAY` at 08:00; Phase 14's entry (registry fields, `badge`, PWA Demo sheet, `OFFICE_SIMULATION_ACTOR`), U2's (`SidePanel` location and props, `BottomSheet`) and 42's (the holiday names above).
- **Superseded:** 43a's old help-desk plan (`SUPPORT_HOURS` 8:30 to 5:30, `helpTickets`, `HelpPanel`, "Help desk resolves this request", Provisional pill), never built.

## Reference

- **Code:** `src/domain/clock.ts` (`now`, `INITIAL_CLOCK`, `advanceMinutes`), `domain/availabilitySeries.ts` (`weekdayOf`), 42's `domain/holidays.ts`; `src/store/mutate.ts` (`ID_FORMATS`, `clockISO`), `demoActors.ts`, `clockActions.ts` (`advanceClockToDate`, `advanceClockMinutes`), `appStore.ts` (slices, persist, reset), `authDemoActions.ts` (the pattern for a small audited action file); `src/shared/demoTriggers/` (`registry.ts`, `types.ts`, `context.ts`, `DemoContextValues`); `src/shared/audit/actionLabels.ts`; `src/apps/admin/components/SidePanel.tsx`, `SideNav.tsx`; `src/apps/web/components/WebNav.tsx`; `src/apps/mobile/screens/MoreScreen.tsx`; `src/pwa/PwaDemoActions.tsx`, `pwaPurity.test.ts`; `src/shared/ui/` (`Pill`, `Notice`, `LineTabs`, `Card`, `Eyebrow`, `DefRow`, `Field`, `Button`, `TextAction`, `EmptyState`), `src/shared/table/`; `src/apps/demo/catalogue/`.

## Work items

1. **Pure rules** (new `src/domain/support.ts`, PWA-safe, with `support.test.ts`; no React, store, `Date.now()` or `new Date()`).
   - `SUPPORT_CONFIG`, the one place for the hours, phone number (a fictional 0800 number), holiday kinds, Christmas window and both response tables: `hours: { helpLine, productSupport }` each `{ days: [1..5], open: '08:30', close: '17:00' }` built from one `STRATOS_HOURS` constant; `RESPONSE: Record<SupportChannel, Record<Priority, ResponseRule>>` with the story wording ("1 hour", "Same business day", "4 hours", "3 business days", "Scheduled at a mutually agreed time"). The panel, the table, the form and the triggers read it; no hour is typed anywhere else.
   - `coverAt(channel, dateISO, minutes, publicHolidays)` returns `{ kind: 'inHours' | 'afterHours' | 'publicHoliday' | 'christmas'; answered: boolean }`; `nextOpening(...)` for "opens 8:30am Wednesday"; `respondBy(channel, priority, raisedAtISO, publicHolidays)` (business-time arithmetic, null where none); `isOverdue(ticket, clockISO)` (Logged past its respond-by; derived, never stored).
   - `SUPPORT_READINGS` (Before you start item 4). Tests: the three acceptance criteria (a P1 at 10:00 on a weekday is due 11:00; a 7:00pm weekday ticket is after hours, no guaranteed time; a ticket on a national public holiday needs a call-out); 4:30pm P1 rolls to 9:00am next business day; Friday P3 product-support lands the next Wednesday, over a holiday Monday one day later; Canterbury Anniversary is not a holiday here; 8:00am reads closed; the Christmas window and its edges; an 8:00am config change flips 8:00 to open on that channel only.
2. **Model** (`src/domain/types.ts`). `SupportTicketId` (`TK0001`, `ID_FORMATS` kind `supportTicket`, prefix `TK` pad 4, distinct from every seeded id). `SupportTicket { id, channel: 'helpLine' | 'productSupport'; kind: 'request' | 'incident' | 'fix' | 'change' | 'newFeature'; priority: 'P1' | 'P2' | 'P3' | 'P4'; subject; description; reason?: 'securityBreach' | 'platformOffline'; raisedBy: { who; app: 'mobile' | 'web' | 'admin' | 'pwa' }; raisedAtISO; cover: 'inHours' | 'afterHours' | 'publicHoliday' | 'christmas'; respondByISO?; status: 'logged' | 'responded' | 'closed'; respondedAtISO?; closedAtISO?; callOut?: 'awaitingApproval' | 'approved' }`. A help-line ticket is kind `request`; the four others are product support's. New `AppState.support: { tickets: Record<SupportTicketId, SupportTicket> }`, persisted and reset with the rest.
3. **Store** (new `src/store/supportActions.ts`, with tests). Every call through `mutate()`; stamps from `clockISO`.
   - `raiseSupportTicket(api, actor, input)`: validates subject and priority, computes `cover`, `respondByISO` and (product support on a public holiday) `callOut: 'awaitingApproval'` from the clock and 42's calendar; a help-line ticket out of hours with a `reason` is P1 and answered. Audit `support.raise`.
   - `advanceSupportTicket(api, actor, id)`: Logged to Responded to Closed, one step, by `STRATOS_SUPPORT_ACTOR` (`demoActors.ts`: "Stratos support (simulated)", `role: 'system'`, `source: 'demo'`). Audit `support.respond`, `support.close`. A ticket awaiting a call-out approval refuses to respond.
   - `approveCallOut(api, actor, id)`: AA's approval, as `OFFICE_SIMULATION_ACTOR`; audit `support.callOutApprove`. Refuses a ticket not awaiting one.
   - Selectors: `ticketsFor(state, { channel, requester? })`, `newestOpenTicket(state, scope)`. `actionLabels.ts`: "Support request logged", "Support request responded to", "Support request closed", "Call-out approved by AA".
4. **Seed and `PERSIST_VERSION`** (new `src/domain/seed/support.ts`, no `rng()` draw, so no other seeded value moves). Five tickets before `DEMO_TODAY`, in hours: a closed help-line P3 (password, Dr Souter, mobile), a responded help-line P3 (sign-in problem, Kirsty W., Admin), a logged help-line P4 (a cosmetic wording on the web app), a logged product-support new-feature P4 (marked for the product owner) and a responded product-support fix P3. Bump `PERSIST_VERSION` by one. **Green checkpoint:** build, build:pwa, vitest.
5. **Panel body** (new `src/shared/support/`, PWA-safe: `SupportPanel`, `SupportHours`, `ResponseTable`, `SupportRequestForm`, `TicketList`). Top to bottom: a status line from `coverAt` ("Open now" or "Closed, opens 8:30am Wednesday") with the phone line in mono and the hours, the response table for the channel, a `Notice` warning tone out of hours ("Out of hours: only a security breach or the platform being offline is answered"), the request form, "Your requests" (Admin: every request), the one "Simulated" `DemoBadge` and the readings caption. Form: subject, priority, description; help line out of hours adds "What is happening?" (Security breach, Platform offline or unavailable, Something else); product support adds a kind and, for new feature, the line "Goes to the product owner or the development team, to plan". Ticket rows: id, subject, `Pill` status (Logged, Responded, Closed), respond-by in mono, a derived "Response overdue" `Pill`, a "Best effort" or "Awaiting AA's approval" `Pill` where `cover` says so. After Send, the form clears and the ticket shows at the top. Hooks: `support-panel`, `support-status`, `support-phone`, `support-hours`, `support-response-table`, `support-request-form`, `support-ticket-list`, `support-tab-helpLine`, `support-tab-productSupport`, `support-cover-note`.
6. **The three hosts.** Mobile and PWA: a "Help" `DefRow` card on `MoreScreen` opening the panel in a `BottomSheet` under `OverlayHeader`, Send on `SheetActions`. Web: "Help" `TextAction` in `WebNav` before the persona, opening the panel in `SidePanel` (move `SidePanel` to `src/shared/surface/` first: it imports one admin layout constant, inline it; re-point `SlotDrawer`, `DraftListDrawer`, `MasterPanel` and the catalogue's `basicExamples.tsx`; one component, no second panel shell). Admin: "Help" at the foot of `SideNav` (an action, not a section), the same `SidePanel` `record` width with `LineTabs` Help line and Product support. Hook `nav-help` on all three entries. The panel publishes `'support.tab'` through `useDemoTriggerContext` (add the key to `DemoContextValues`).
7. **Triggers** (below), registered in `registry.ts` and the PWA Demo sheet.
8. **Guide, shots, review pass, PROGRESS.**
9. **Build on the shared components; migrate these copies (UI unification).**
   - UI in this phase is built from the shared components: `SidePanel` and `BottomSheet`, `OverlayHeader`, `SheetActions` (U2) for the hosts; `Pill`, `Notice`, `EmptyState` (U3) for status, the out-of-hours notice and an empty list; `Button`, `TextAction`, `LineTabs` (U5) for Send, the web Help entry and the tabs; `Card`, `Eyebrow`, `DefRow` (U6) for the More row and section labels; `TextField`, `TextArea`, `SelectField`, `Segmented` for the form; the table kit if the Admin list is a table.
   - This phase also migrates these existing copies on the screens it edits: the Admin `SidePanel` moved to the shared surface (item 6); nothing else.
   - Default props keep today's look; keep every `shot`, `data-shot`, `data-testid` and row `data-*` hook on the element recipes and specs target; update the catalogue rows (`/demo/catalogue/*`) for `SidePanel`'s move and add rows for the new `shared/support` parts.
   - If a U phase that builds a component named here has not landed, stop and say so; never build a private copy. See [`docs/ui-unification/PLAN.md`](../../../ui-unification/PLAN.md) section 3 and [`README.md`](../../../ui-unification/README.md) section 8.
10. **Purity and copy.** `shared/support/` and `domain/support.ts` import nothing from `apps/admin` or `apps/web` (the `pwaPurity` test passes unchanged); no en or em dashes, no "slot", no "help desk" (the catalogue's word is "help line"); crimson nowhere, teal the only action colour.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| (product) | Help, Raise a request | every route of the three apps | none | opens the panel; the form is product UI, badged simulated | |
| `support-advance-ticket` | Advance ticket | any route while the panel is open (`'support.tab'` set) | bar | `advanceSupportTicket` on the newest open ticket of the open tab: Logged, Responded, Closed; message names the ticket and its new status | "No open request" |
| `support-raise-out-of-hours` | Raise out of hours | the same | bar | choices: Ordinary request, Security breach, Platform offline; moves the clock forward to the next weekday 7:00pm (never back; today's if it is before 7:00pm) and raises a sample help-line ticket, so the after-hours rule shows | the panel's tab is Product support (`when` hides it) |
| `support-raise-public-holiday` | Raise ticket on a public holiday | the same, Product support tab | bar | moves the clock forward to 10:00am on the next national public holiday in 42's calendar (the clock menu's own forward jump, canvas rolling) and raises a sample P2 incident awaiting AA's approval | no later national holiday in the calendar |
| `support-approve-call-out` | AA approves call-out | the same, Product support tab | bar | `approveCallOut` as `OFFICE_SIMULATION_ACTOR` on the newest ticket awaiting one; badge `office-stand-in` (the approval is given to Stratos outside the app) | "No call-out awaiting approval" |
| `support-help-line-responds` | Help line responds to this request | the PWA's Demo sheet, any screen | pwa | `advanceSupportTicket` on the persona's newest open help-line ticket | "No open request" |

The clock only moves forward, so Reset restores it; the cheat sheet says so.

## Out of scope

- A ticketing integration, a support portal, an SLA engine or response timers beyond the derived "overdue" pill, outage handling or Stratos' incident response process (to be discussed later, per the story), a Stratos-side queue, email or phone channels in the app, anaesthetists choosing a priority beyond the form, ticket comments or attachments.
- US-02.5.4's mention of the support hours: no inbound change is gated by them.
- Extra-cover pricing (OQ-141's second question) and any 8:00am start until AA answers.

## Manual test checklist

Run these yourself in the running app and report pass or fail with evidence.

- [ ] Reset: the panel on mobile, web and Admin reads "Closed, opens 8:30am" at 8:00am; +1 hour reads "Open now"; phone, hours, response table and the seeded tickets show; the Simulated badge and readings caption show once.
- [ ] Raise a help-line request in hours: the ticket logs at the top with Logged and a respond-by (P1 one hour, P3 four business hours); the audit shows `support.raise`; reload keeps it; it shows in Admin's Help line tab with its requester.
- [ ] Advance ticket three times: Logged, Responded, Closed, each audited; then "No open request".
- [ ] Raise out of hours (Ordinary request): clock at 7:00pm, logged with "Not answered out of hours", no respond-by. Security breach and Platform offline: P1, answered, due within the hour.
- [ ] Admin, Product support: raise each kind in hours (P3 respond-by three business days, a Friday spanning the weekend); a new-feature ticket shows the product-owner line; a ticket at 7:00pm reads "Best effort".
- [ ] Raise ticket on a public holiday: the clock jumps to Labour Day 10:00am, the ticket is Awaiting AA's approval and cannot be advanced; AA approves call-out; then it advances. Canterbury Anniversary stays a working day.
- [ ] A Logged ticket whose respond-by has passed (advance the clock) shows "Response overdue".
- [ ] PWA: Help from More opens the bottom sheet; "Help line responds to this request" advances the persona's ticket; reload keeps state; Reset restores the seed; the PWA bundle gains no admin or web import.
- [ ] The three Help entries open and close with Escape, scrim and X; focus returns; `build`, `build:pwa` and `vitest` green.
- [ ] Catalogue screenshots: recipes below, a full `npm run capture` with no failed recipe, shots checked by eye, `npm run verify:board` green.

## Demo guide updates

Locate by text in `docs/demo-guide/`. `04-presenter-cheat-sheet.md`: the help desk lines become "What if something is not working?" (Help in any app: the phone line, the hours, the request form), the product-support route for AA ("a feature we do not have yet goes to the product owner"), the hours as the standard terms with 8:00am cover as an open question for Vanessa, and "after Reset the clock is 8:00am, so the line reads closed until +1 hour". `03-demo-script.md`: a short beat in the NFR close (Help in the mobile More tab, then Admin's two tabs; raise out of hours; the public-holiday call-out). `02-workflows-and-handoffs.md`: a support line under the office's and anaesthetist's workflows. `master-demo-guide.html`: the same passages; the Control Panel lists the five entries under their screens.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), after the review pass. Run `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 43b` first.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-15.0.8](../../../../requirements-board/requirements/stories/US-15.0.8.md) | none (create it) | Create, `captured`. Admin `/admin/day/2026-07-21`, runner `trigger` step "+1 hour" first (the clock starts at 8:00am), tap `[data-shot=nav-help]`: states `support` (highlight `[data-shot=support-phone]`, `support-hours`, `support-response-table`) and `request-raised` (form filled and sent, highlight `[data-shot=support-ticket-list]`); a mobile `help-line` shot (:5174, More, Help) and a web one, same highlights; state `out-of-hours` after `support-raise-out-of-hours` (highlight `support-cover-note`). Caption "Anyone using the apps can reach Stratos' support line: phone, hours, response times and a request form that logs a tracked ticket (simulated)". |
| [US-15.0.9](../../../../requirements-board/requirements/stories/US-15.0.9.md) | none (create it) | Create, `captured`. Admin, Help, tab `[data-shot=support-tab-productSupport]`: states `product-support` (its response table and the ticket kinds) and `public-holiday` (after `support-raise-public-holiday`: the ticket Awaiting AA's approval, highlight `support-cover-note`). Caption "AA's office raises incident, fix, change and new-feature tickets with their own response times; a public-holiday call-out waits for AA's approval (simulated)". |

**Recipes this phase breaks.** Recipes that shoot the More tab, the web top nav or the Admin side nav (a Help entry joins each; keep shot `name`s and any clip regions), and any that hold a `SidePanel` open (its move to `shared/surface` keeps its hooks). Mobile recipes on :5174 are unaffected by the clock.

**ATLAS.md.** Seed data (the five tickets, the clock reading closed at 8:00am); Existing hooks (item 5's and `nav-help`); Overlays that need clicks (the panel on each app); Demo control panel and Demo actions (the five entries).

## Adversarial review (after build)

Standard pass (convention 18), steered at:

- **One place.** The hours, both response tables, the phone line, the holiday kinds and the Christmas window live in `SUPPORT_CONFIG`; grep finds no retyped "8:30", "5:00pm" or "4 hours" outside the config, the tests and the guide; an 8:00am change on one channel moves only that channel.
- **The clock only.** No `Date.now()` or `new Date()`; every stamp from `clockISO`; open or closed, respond-by and overdue all derive from the demo clock and 42's calendar; the triggers move the clock forward only and say so.
- **Rules as the stories say.** After hours only a security breach or platform outage is answered; a public-holiday product ticket waits for AA's approval and cannot be responded to before; Christmas cover is limited and product support's only; help-line P3 is 4 hours, product support's 3 business days; the two tables are never crossed.
- **Honest.** Simulated badge and readings caption once each; nothing claims a ticketing integration, an SLA engine or Stratos' incident process; no provisional label on answered items.
- **Tickets.** Every change through `mutate()` with an audit label; `PERSIST_VERSION` bumped once; the seed draws no `rng()`; a ticket is visible to its requester and to the office.
- **Shared and PWA-safe.** One panel body, one `SidePanel`; `pwaPurity` unchanged; teal the only action colour; no en or em dashes, no "help desk", no "slot".
- **Private copies.** A new private copy of a shared component (`docs/ui-unification/README.md` section 8), or a copy this phase was to migrate and left, is a finding.

## PROGRESS.md updates

- **For the owner's review:** the readings in Before you start item 4 (labelled once each); the OQ-141 default (8:30am on both channels, one-line change); the fictional phone number; the clock reading "closed" at 8:00am after Reset; the call-out approval being a trigger (AA tells Stratos outside the app).
- Status row and phase entry: drift check against `63a4490`, OQ-137 as built and OQ-141 at its default, names 42, 43a and U2 shipped, tests added, `PERSIST_VERSION` old to new, review pass, catalogue screenshot result (REPORT.md counts before and after). Handoffs: U7 (`SidePanel` now in `shared/surface`, the new `shared/support` rows), 43 (tickets are a small fixed seed, no scale need), 44 (the beat, the cheat-sheet lines and the five Control Panel entries).
- Decisions log: D83 built (two channels, one config); D87 at its default; superseded: 43a's old "5:30pm in one string, Admin-only help desk" default.
