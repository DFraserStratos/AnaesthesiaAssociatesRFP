# Phase 43a · Sign-in and ease of use: simple anaesthetist screens and point-of-need help

**Requirements covered:**
[US-15.0.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.1.md)
Ease of use (Proposed, unchanged at 3d3a18c: intuitive for people who are not comfortable with
modern systems, most of all on the operational screens; guidance embedded at the point of need so
standalone documentation stays short; and, from the 2026-10-01 Notes, "anaesthetists see none of the
Contract complexity, which the office handles, and the new system should not add it") ·
[US-13.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.3.md)
Sign in to the anaesthetist app (Verify, new 2026-10-02, one acceptance criterion: "Given an
anaesthetist with an account, when they open the PWA, then they sign in with their account login";
graded **Missing**: the PWA and mobile app open straight into the persona's data, and the only
sign-in anywhere is Phase 14's "Simulate sign-in attempts", which writes audit rows).
US-15.0.1's two catalogue images are the layout targets for the help:
[mobile Booking capture](../../../discovery-reference/Updated%20Requirements/catalogue/assets/US-15.0.1/mobile-card-capture.png)
and [the Admin Day view](../../../discovery-reference/Updated%20Requirements/catalogue/assets/US-15.0.1/admin-day-view.png).
US-13.5.3 has no image.
Read alongside (not closed here, must stay green):
[FT-13.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.5.md) (Proposed, Matches: roles and audit; its Technical discussion is the RFP response's identity proposal, Auth0 or Entra, MFA for admins, self-service reset, logged sign-ins, social login on mobile, none confirmed; Phase 14's "Simulate sign-in attempts" on `/admin/audit` stays as it is),
[US-15.0.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.2.md) (mobile-first; web a full alternative),
[FT-03.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.4.md) and
[US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md) (the anaesthetist can change the Contract; Phase 20's plain Contract row and "Change" are the one Contract control they keep),
[US-11.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.2.md) (Verify, retitled "Guardian or other payer set through the Contract": the Contract always defines the billable party, D17 and OQ-67, and the admin or anaesthetist enters the payer's name and email when a default Contract is picked; Phase 21 built it and removed the per-Booking override),
[US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md) (Contract pricing and adjustment rules; Phase 24's defined rate and Contract-gated adjustment),
[FT-13.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.7.md) (the to-do list is for warnings that need action; notices go to the notification pool),
[US-13.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.2.md) and
[US-13.7.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.3.md) (both Confirmed 2026-10-02: the to-do list, and the triangle with the warning visually clear on opening the Booking and **no confirm step at submit**; Phase 15a),
[FT-13.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.8.md) and
[US-13.8.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.8.1.md) (the shared notification pool, Phase 32's Notifications card on the Admin Day rail),
[US-13.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.1.1.md) (the one-day dashboard, Phase 31's Draft Lists band and rail card),
[FT-01.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.6.md) (Draft Lists, reworded at 3d3a18c) and
[US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md) (office review of Contracts, Phase 21's Review column and approval).
Evidence: points 51 ("keep the anaesthetist's world simple") and 52 (the working rule that an
unanswered question is built as its recommendation) of
[the 2026-10-01 meeting note](../../../discovery-reference/Updated%20Requirements/catalogue/notes/2026-10-01-aa-meeting-with-greg.md),
and points 2, 41, 68 and 84 of
[the 2026-10-02 requirements review](../../../discovery-reference/Updated%20Requirements/catalogue/notes/2026-10-02-aa-requirements-review-with-greg.md)
(Greg: "what's the experience going to be when the anaesthetist brings up the app on the phone?";
only an account login for the PWA is assumed).
No DM or RV item is owned here. The phase builds on
[DM-37](../analysis/domain-model-delta.md#dm-37) (the anaesthetist Contract change flagged for office
approval, Phase 20); no [reverse-check](../analysis/reverse-check.md) finding is closed here.
**Open question:** [OQ-83](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-83.md)
(the anaesthetist's sign-in experience: platforms, biometrics, MFA, single sign-on, identity
provider; Open, and its recommendation is a process step, "define the deployable platforms first,
then the experience"). The phase builds the one thing assumed, an account login on the PWA, as a
simulated screen, and labels it provisional in one place (the meeting's working rule). The owner
decisions this phase's help copy now states as settled are D3, D12, D14, D15, D16, D17 and D25 (work
item 11); none gates the phase.
**Depends on:** 21 (the Booking's Billing block with Invoice to, the payer captured at the Contract
pick, required inputs, the schedule-miss flag and Review's Contract column and approval), 24 (the
Contract defined rate, the Contract-gated `AdjustmentCard` and the two price layers on Review), 31
(the Draft Lists band on the Day grid and the Draft Lists rail card) and 39b (pre-op and post-op
events, the preset billing-line types and the Contract add-on lines on the capture screen).
By the roadmap order 14 (the trigger registry, the PWA demo sheet and "Simulate sign-in attempts"),
15 (Booking vocabulary), 15a (the warning triangle, the warnings section on the Booking and the Admin
To-do rail card), 19 and 19a (the procedure-first picker; base units from the default RVG Contract),
20 (the anaesthetist's Contract row and `ContractPickerSheet`, filtered by procedure then hospital),
22 (Contract payment setting, office only), 23 (the per-Contract multi-procedure rule), 29 (the
user-maintained status list) and 32 (the Notifications card) have also run. The capture and review
screens are settled by now, which is why this phase sits late.
**Estimated:** 1 session, in three parts: the sign-in (items 1 to 4), the sweep (items 5 to 9) and the
help (items 10 to 16). If it runs long, stop green after work item 9 (sign-in, the sweep and its guard
test) and do the help and its trigger (items 10 to 16) in a second session.

## Goal

US-13.5.3 is graded **Missing** and US-15.0.1 **Contradicts** in the gap analysis. This phase closes
both gaps (US-15.0.1's has two halves: the Contract complexity and the missing help).

- **The anaesthetist signs in to the PWA** (US-13.5.3, PWA first). On launch the installed PWA shows a
  **simulated sign-in screen**: the AA logo, an email and a password field with Dr Souter's demo
  account pre-filled, and one teal "Sign in". It is deterministic, has no real identity provider and
  sends nothing anywhere. The session is kept across reloads (per-device browser storage), so a
  handset signs in once; a **Sign out** row on the mobile More tab returns to the sign-in screen with
  the account still pre-filled. The framed all-apps prototype opens **signed in**, so no workshop
  ever starts on a login. A successful sign-in, a refused one and a sign-out each append one audited
  `account` row, reusing Phase 14's pattern, so the Audit viewer shows the logged attempts the
  proposal describes. Auth0, MFA, single sign-on, biometrics and password reset are **narrated, not
  built** (OQ-83); one small provisional caption on the sign-in screen says the experience is still
  to be decided.
- **The anaesthetist's world stays simple** (US-15.0.1 Notes). At plan time the shared capture block
  drew a route chip, the Contract name, the insurer and the billable party on the anaesthetist's own
  Booking, and the add-billing-line sheet talked about "Method 3" and "the individually arranged
  hourly rate". Phases 18 to 39b have since reshaped every one of those surfaces; Phase 20 built the
  anaesthetist's Contract row to the rule (plain name, teal "Change"), Phase 21 made the Contract
  define who is invoiced, and later phases each kept their own office detail office-only. This phase
  **sweeps every anaesthetist-facing screen on mobile, web and the PWA** for what is left: no pricing
  basis, no rate, defined-rate or "FIXED CONTRACT PRICE" label, no holder or "Bills ..." line, no
  category, no payment setting or split share, no multi-procedure rule wording, no route words. The
  anaesthetist sees the Contract by its plain name with Phase 20's "Change", and the office keeps the
  full detail. (The gap analysis's WRONG bullet lists the Contract name too; FT-03.4 and US-03.4.1
  make the Contract visible to the anaesthetist and changeable by them, so the name stays and only
  the complexity goes.) One viewer-aware display helper decides what each viewer sees, and one
  render-scan test makes the rule hold for every later change.
- **Help at the point of need.** There is no help affordance anywhere today (only a few native `title`
  tooltips). This phase adds **one shared `InfoTip`** in the design's own patterns: a small info glyph
  beside a section label that opens a short explanation, as a bottom sheet on the phone and an
  anchored popover on desktop. All copy lives in **one topic file**, written to the answers given on
  2026-10-02 (base units from the Contract, Slot statuses as a user-maintained list, Draft Lists from
  a return to the office, the Contract defining who is invoiced, warnings that never block or ask for
  confirmation, notices kept apart from the to-do list). Tips sit on the three operational screens
  US-15.0.1 names through its images and its "used every day" sentence: **mobile Booking capture**
  (so the anaesthetist web app's shared capture gets them too), **the Admin Day view** and **Admin
  Review**. Each app also gets **one first-run hint**: a calm inline card, not a modal, that says
  where to start and that the info glyph explains a heading. A dismissal is kept per browser, like the
  PWA's install coaching, and Reset or the "Show first-run hints again" demo action brings the hints
  back.

No domain state changes: the sign-in session and the dismissed hints are per-viewer browser state,
the sweep is presentation and the help is copy and UI. The sign-in rows are audit-only (`mutate()`
with an empty patch on the existing `account` entity type, as Phase 14 does), so no slice and no
seed changes and `PERSIST_VERSION` does not move. Training per user group, short standalone
documentation and a web-app sign-in stay presenter-narrated.

## Before you start: drift check

1. Run the catalogue diff since the plan's baseline:

   ```
   git diff 3d3a18c -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the hunks for US-15.0.1, US-13.5.3, FT-13.5, OQ-83, US-15.0.2, FT-03.4, US-03.4.1, US-11.2.2,
   US-04.2.2, FT-13.7, US-13.7.1 to US-13.7.3, FT-13.8, US-13.8.1, US-13.1.1, FT-01.6, US-07.2.2,
   EP-13 and EP-15, any new note that cites US-15.0.1 or US-13.5.3, and the domain-model lines on
   what the anaesthetist sees of a Contract. At 3d3a18c US-15.0.1 is **Proposed** with no acceptance
   criteria and no linked OQ; US-13.5.3 is **Verify** with one criterion and OQ-83 **Open**;
   US-13.7.2 and US-13.7.3 are **Confirmed** (no confirm step); US-11.2.2 is **Verify** (payer set
   through the Contract).
2. If an item changed, re-read it in full and adjust the work items. Specifically:
   - **OQ-83 answered.** Build the answer inside the simulated screen where it fits one session (for
     example a simulated MFA code step, or a "Sign in with Google" button that signs in the same demo
     account), drop the provisional caption and record it. If the answer needs a real identity
     provider, a native app or real biometrics, keep the simulated screen, narrate the rest and tell
     the owner in the PROGRESS entry rather than growing the phase.
   - **US-13.5.3 adds the web app** (or the admin app) as a sign-in surface: the session module (work
     item 1) is app-agnostic, so add the same screen to that app only if it fits; otherwise log it.
   - **US-15.0.1 gains acceptance criteria** (a named screen list, a help centre, a searchable manual,
     guided tours, or a training mode): build only what fits one session inside the three screens and
     the first-run hint, and tell the owner what is left, rather than growing the phase.
   - **The anaesthetist may see more of the Contract** (for example the catalogue now says they see the
     price basis or the holder): keep the helper (work item 6) and the scan (work item 9), and move the
     newly allowed fields from the office list to the anaesthetist list in one place. Record it.
   - **US-03.4.1 now takes the Contract change away from the anaesthetist:** stop and tell the owner.
     Removing Phase 20's "Change" is that phase's rule, not a display sweep.
   - **US-11.2.2 changes who enters the payer** (for example the office only): the payer step in
     Phase 21's Contract picker becomes office only for the anaesthetist. Hide it here through the
     store's existing refusal (one line) and record it.
3. If US-15.0.1 or US-13.5.3 is now Retired or Future, drop that half of the phase (the help and sweep,
   or the sign-in) and tell the owner. If only a context item is Retired or Future, drop the tip that
   explains it.
4. **Open questions.** OQ-83 is the only one this phase builds against: the sign-in is simulated and
   carries the provisional caption (work item 3). The help copy is the other risk: a tip never states
   as settled anything still open. At 3d3a18c the copy in work item 11 is written to the answers
   (D3, D12, D14 to D17, D25, US-13.7.3) and avoids what is still open:
   - a Booking without an NHI (D11, OQ-49, Open; no tip mentions it);
   - the BCTI count (OQ-60 and the ROADMAP's BCTI granularity);
   - whether default Contracts ask for the payer or the hospital holds every Contract (OQ-78, Open;
     the Contract tip says the Contract "sets who is invoiced", which holds either way, and does not
     describe the payer step);
   - what else posts to the notification pool (OQ-79; the to-do tip names a moved List only, as the
     example US-13.8.1 gives);
   - whether anaesthetists pull Draft Lists themselves (OQ-86; the Draft Lists tip describes the
     office assigning, which is the catalogue and the recommendation);
   - the sign-in experience (OQ-83; no tip mentions sign-in).

   Re-read OQ-49, OQ-60, OQ-78, OQ-79, OQ-83 and OQ-86 in the diff. If one is answered, the copy may
   say more; if a topic must touch an open point, it carries `provisional` (work item 10) and shows
   the small neutral "Provisional" pill with the OQ in its tooltip, as earlier phases do. At
   3d3a18c no topic needs it.
5. **Prerequisite names.** Confirm 21, 24, 31 and 39b are DONE in PROGRESS.md and read their entries,
   name maps and handoff notes, and the entries for 14, 15, 15a, 19, 19a, 20, 22, 23, 29, 32 and 43. Note
   in particular:
   - **14:** the registry entry shape (`DemoTrigger` in `src/shared/demoTriggers/types.ts`), route
     matching, `PwaDemoActions` (mounted by `MobileViewport`, so its Demo chip can show over the
     sign-in screen), and `simulateSignInAttempts` in `src/store/authDemoActions.ts` (the `account`
     audit rows, `PROVIDER`, `SOUTER_ACTOR`);
   - **15:** the Booking detail body and route names and the
     `/mobile/lists/:listId/bookings/:bookingId` route;
   - **15a:** the triangle component (`data-shot="booking-warning"`, a marker, not a button), the
     Booking's warnings section (`data-shot="booking-warnings"`), the To-do rail card (`WarningsToDo`,
     `data-shot="admin-warnings-todo"`), and that `SubmitListSheet` has no warnings step;
   - **19 and 19a:** the procedure-first picker, how the base units show on capture now that they
     come from the procedure's default RVG Contract, and the after-procedure out-of-range warning;
   - **20:** the anaesthetist's Contract row in `BtmCaptureBlock`, the `ContractPickerSheet` row
     variants by viewer and its procedure-then-hospital filter, the "Changed by you · office to check"
     pill, the List row Contract caption, and any viewer-aware helper it already built (extend it in
     work item 6, do not add a second);
   - **21:** the Billing block rows ("Invoice to", the payer's email, required inputs), the payer step
     in the Contract picker, the schedule-miss flag ("To confirm with the hospital", read only for the
     anaesthetist), and Review's Contract column and approval;
   - **22:** that the payment setting and split share are office only, and where they render;
   - **23:** the wording of the per-Contract multi-procedure rule on the capture block (its handoff:
     "43a keeps the Contract rule wording off the anaesthetist screens if it simplifies them");
   - **24:** the defined-rate wording, `AdjustmentCard` and its captions, the office override, and
     Review's two price layers;
   - **29:** the status master (labels and colours editable), so the Day tip names no status colour;
   - **31:** `DraftListBand.tsx` (`data-shot="daygrid-draft-band"`), the Draft Lists rail card
     (`data-shot="admin-draft-lists-rail"`) and its handoff ("point-of-need help on Admin Day should
     explain the Draft Lists card and band");
   - **32:** the Notifications card on the Admin Day rail, below the To-do card;
   - **39b:** the event sheet, the preset line types, and how Contract add-on lines are offered to the
     anaesthetist;
   - **43:** `SyntheticDataBadge` (`src/shared/SyntheticDataBadge.tsx`) and its tone on the PWA's More
     card, and the handoff asking for it on the sign-in screen;
   - **26, 27, 32, 32a and 38a** (for the inventory only): the profile and prepaid tick list, the
     prepayment warning on the Booking, the move-List and move-Booking sheets, and the calendar and
     search result rows.
6. Note the current `PERSIST_VERSION` (16 after 15a, higher after the seed phases). This phase must
   not change it.

## Reference

**Design files (convention 17):**

- `docs/design/Design Language.dc.html`: tokens. Teal `#0D6E63` is the only action colour (Sign in,
  the tip glyph when focused or open, "Got it"); crimson stays identity only (the logo on the sign-in
  screen, the avatar on More) and never appears in a tip, hint or button. The micro-caps section
  label (11px, 600, 0.06em, mist) is where a tip sits. Radius `card` (14) and elevation e-2 for the
  desktop popover; e-1 and `accent.tint` for the inline first-run card; `sheet-in` motion for the
  mobile sheet; 80ms fades under reduced motion.
- `docs/design/Mobile App.dc.html`: screen 3 (Booking capture: the white capture cards and their
  micro-caps labels, the stepper rows, the docked Mark complete), the Forward Lists header, where the
  mobile first-run card sits under the greeting, and the form fields and full-width primary button
  the sign-in screen reuses. No mockup draws a sign-in screen: build it from the mobile canvas (the
  host's atmosphere shows through), the shared `Logo`, one white card and the existing field and
  button anatomy.
- `docs/design/Admin Day.dc.html`: the day header, the status legend chips over the grid and the right
  rail cards. The Admin first-run card sits between the day header and the grid.
- `docs/design/Admin Review.dc.html`: the summary tiles, the table header row and the action bar.
- `docs/design/Web Dashboard.dc.html`: the greeting block, where the web first-run card sits.
- No mockup draws a tip, popover or onboarding card. Extend the section-label row, the rail card and
  the bottom sheet; do not invent new chrome (no coach marks, no spotlight scrim, no tour).

**Catalogue items:** the covered and context files above, OQ-83, and US-15.0.1's two images.

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: the EP-13 section's US-13.5.3 row (Missing) and
  FT-13.5 row (Matches), the EP-15 section's US-15.0.1 row (Contradicts, corrected from Partial) and
  Summary theme 11's mention of it.
- `docs/prototype-build/catch-up/epics/EP-13.md` (the US-13.5.3 entry: no sign-in or sign-out, the
  suggested PWA "Sign out" trigger with the demo account pre-filled) and `epics/EP-15.md` (the
  US-15.0.1 entry: the "WRONG" and "MISSING" bullets and the evidence lines).
- `analysis/prototype-map-apps-mobile-web.md` (Booking detail, capture block, List rows, More),
  `analysis/prototype-map-shared.md` (the capture components, the surface seam and the flows),
  `analysis/prototype-map-admin.md` (Day view, Review) and `analysis/prototype-map-shell-demo-pwa.md`
  (the harness bar, Reset, the PWA entry, panel and install coaching).

**Code entry points** (paths under `aa-prototype/src/` unless they start `aa-prototype/`; line numbers
from 3d3a18c; phases 15a to 39b will have moved them):

- Sign-in:
  - `aa-prototype/pwa/main.tsx` (76: `<MobileApp host={MobileViewport} moreExtra={<PwaDemoPanel />} />`,
    the PWA entry) and `router.tsx` (115: `<MobileApp host={PhoneFrame} />`, the framed build).
  - `apps/mobile/MobileApp.tsx` (the layout: `APP_CONFIG.mobile.persona`, the `actor`, the outlet
    context, `showTabBar`, `SurfaceProvider` and `Host`); the sign-in gate goes here, in place of the
    `Outlet` and tab bar, so the URL and the router are untouched.
  - `apps/mobile/screens/MoreScreen.tsx` (19: the persona card, the demo note and the host's `extra`)
    and `apps/mobile/routes.tsx` (`MobileMoreRoute`, 176).
  - `shell/appConfig.ts` (`PERSONAS.souter`, 27) and `domain/seed/cast.ts` (45: Dr Souter's
    `m.souter@aa-associates.example`, the account the screen pre-fills).
  - `store/authDemoActions.ts` (`simulateSignInAttempts`, 24 to 83: the `account` audit rows through
    `mutate()` with an empty patch), `store/demoActors.ts` (`SOUTER_ACTOR`) and the
    `simulate-sign-in` registry entry (290).
  - `store/persistStorage.ts` (`resilientLocalStorage`, 187: the try/catch storage wrapper to reuse).
  - `pwa/MobileViewport.tsx` (171: `<PwaDemoActions />`) and `pwa/PwaDemoPanel.tsx`.
- Contract display on anaesthetist screens:
  - `shared/capture/BtmCaptureBlock.tsx`: at 3d3a18c `ROUTE_LABEL`, `CONTEXT_FIELDS`, the context
    parts (contract, insurer, billable party, reference) and the read-only context line
    (`data-shot="procedure-contract"`); 20 and 21 rebuilt this block, and 23 added its
    multi-procedure rule wording.
  - The Booking detail body (`shared/booking/BookingDetailBody.tsx` after 15): `showBookingTotal` (office only), the rate
    labels "FIXED CONTRACT PRICE" and "FEE @ $x/UNIT" (computed for every viewer, shown only through
    the office's total, and 24's defined-rate label beside them), `OfficeBillingSetup` (office only).
    `shared/capture/BookingTotalPanel.tsx` (`rateLabel`) and `shared/surface/context.ts`.
  - `shared/capture/AddBillingLineSheet.tsx`: "Hours × the individually arranged hourly rate (Method 3)."
    and "Enter the hours and the agreed hourly rate." at 3d3a18c; 24 and 39b have reworked this sheet.
  - `shared/flows/EditProcedureSheet.tsx` and the manual Booking form: Phase 20 removed the route
    and insurer controls; confirm nothing is left.
  - `shared/flows/EditBillingSetupSheet.tsx` and the split-share control (22): office only; check
    neither is reachable with an anaesthetist actor.
  - Mobile `apps/mobile/screens/ListDetailScreen.tsx`, `BookingDetailScreen.tsx`, `BalancesScreen.tsx`;
    web `apps/web/screens/ListDetailView.tsx`, the Booking detail view, `AccountsScreen.tsx`,
    `DashboardScreen.tsx`.
  - Guards to copy the style of: `apps/moneyViewPurity.test.ts` (a source scan over
    `src/apps/mobile` and `src/apps/web`) and `pwa/pwaPurity.test.ts`.
- Help anchors:
  - `shared/capture/ui.tsx`: `CaptureSection` (the micro-caps label row is where a capture tip goes)
    and `Caption`. `TimesCard.tsx` (`label="Times"`), `UnitsCard.tsx` (`label="Units"`), 19's
    procedure card, 20's Contract row, 15a's warnings section, 24's `AdjustmentCard` and 39b's events
    card wherever they now sit.
  - Admin Day: `apps/admin/routes.tsx` (`AdminDayRoute`, which renders `DayNav`, `DayGrid` and
    `RightRail`), `apps/admin/components/DayNav.tsx` (the day header), `DayGrid.tsx` (the
    `StatusLegend variant="chips"`; the conflict `title` tooltip), `RightRail.tsx` (`MiniCalendar`,
    then 15a's To-do, 31's Draft Lists and 32's Notifications cards), 31's `DraftListBand.tsx`;
    `shared/StatusLegend.tsx` (its native `title`s).
  - Admin Review: `apps/admin/screens/ReviewScreen.tsx` (the header, the summary `Tile`s, the table
    headings, which 20, 21 and 24 reshaped, the action bar and its "Authorise for billing", the
    authorise confirm copy).
  - First-run hint seats: `apps/mobile/screens/ForwardListsScreen.tsx` (`MobileHeader`),
    `apps/web/screens/DashboardScreen.tsx` (the greeting `h1`), `AdminDayRoute` (between `DayNav`
    and the grid).
- Per-viewer storage, the pattern to copy: `pwa/installPrompt.ts` (`COACH_DISMISS_KEY` 145,
  `wasCoachDismissed` 147, `rememberCoachDismissed` 155, `clearInstallCoachDismissal` 168, all wrapped
  in try/catch), `pwa/InstallCoach.tsx`, and the two Reset paths: `pwa/PwaDemoPanel.tsx` (`ResetCard`,
  220; `clearInstallCoachDismissal()` at 288) and `shell/DemoResetButton.tsx` (`confirmReset`, 41).
- Surface: `shared/surface/context.ts` (`Surface.variant`, `Overlay`) and `SurfaceProvider.tsx`
  (mobile `Overlay` is `BottomSheet`, web is the centred `Dialog`); `shared/ui/index.ts` and
  `shared/index.ts` (the component barrels); `shared/Logo.tsx`; `shared/DemoBadge.tsx`.
- Demo triggers: `shared/demoTriggers/registry.ts`, `types.ts`, `match.ts`, `memory.ts` (14),
  `shell/DemoActionsMenu.tsx`, `pwa/PwaDemoActions.tsx`.
- Tests and shots: `pwa/pwaPurity.test.ts`, `domain/domainPurity.test.ts`,
  `aa-prototype/playwright.config.ts` (two projects: `pwa-device` on 5174, which runs only
  `pwa-device.spec.ts`, and `prototype` on 5173), `visual/mobile-interactions.spec.ts`,
  `visual/mobile-insets.spec.ts`, `visual/pwa-device.spec.ts`, `visual/screens.spec.ts`,
  `visual/demo-actions.spec.ts`, and 15a's `visual/warnings.spec.ts`.

## Work items

Sign-in first, then the sweep guarded by its test, then the help. Keep `npm run build`,
`npm run build:pwa` and `npx vitest run` green after each group.

### Sign-in (US-13.5.3)

1. **The session** (`src/shared/session/anaesthetistSession.ts`, no React, PWA-safe, imports nothing
   from apps, shell or store):
   - One storage key, `aa-anaesthetist-session`, beside the existing `aa-*` keys, holding
     `{ signedIn: boolean; account: string }`; every read and write wrapped in try/catch (reuse
     `resilientLocalStorage` or copy `installPrompt.ts`'s pattern), so blocked storage falls back to
     the host's default and never throws.
   - A tiny non-persisted zustand store (like Phase 14's `memory.ts`) mirroring it:
     `useAnaesthetistSession()`, `signInSession(account)`, `signOutSession()`,
     `clearAnaesthetistSession()` and `isSignedIn(defaultSignedIn)`.
   - The default when nothing is stored is the host's: **signed in** in the framed build, **signed
     out** in the PWA (work item 2). So the framed demo opens signed in, a fresh handset opens on the
     sign-in screen, and a signed-in handset stays signed in across reloads and relaunches.
   - `SIGN_IN_PROVISIONAL = { oq: 'OQ-83', note: 'How anaesthetists sign in (two-step codes, single
     sign-on, Face ID) is still to be decided. This screen stands in for it.' }`: the one place the
     provisional reading lives.
   - `SIGN_IN_RULE = { platform: 'pwa', provider: 'simulated', preFilled: true }`: the one constant
     an OQ-83 answer changes.
   - Vitest (`anaesthetistSession.test.ts`): the default by host; sign in, sign out and clear persist
     across a fresh store over the same storage; a throwing `localStorage` gives the default and no
     exception.
2. **The gate** in `MobileApp`:
   - New prop `sessionDefault: 'signed-in' | 'signed-out'` (required, like `host`, so neither entry
     can forget it): `router.tsx` passes `'signed-in'`, `aa-prototype/pwa/main.tsx` passes
     `'signed-out'`.
   - When not signed in, `MobileApp` renders `SignInScreen` inside the same `SurfaceProvider` and
     `Host`, in place of the `Outlet` and the tab bar. The URL is not changed, so after sign-in the
     presenter lands where the URL already points (a deep link to a Booking still works).
   - The actor stays the persona actor; the session decides only whether the app shows. No store
     guard or view scope changes.
3. **`SignInScreen`** (`src/apps/mobile/screens/SignInScreen.tsx`, invoke the frontend-design skill
   first):
   - The mobile canvas with the host's atmosphere showing through, the shared `Logo` at the top,
     then one white card (radius `card`, e-1): title "Sign in", then "Email" pre-filled with Dr
     Souter's address from the store (the anaesthetist record, never retyped), "Password" pre-filled
     with a fixed masked demo value, and a full-width teal "Sign in" (52px, `data-shot="sign-in-submit"`).
     Inputs at 16px so iOS does not zoom; `autocomplete="username"` and `"current-password"`.
   - Under the card, one small neutral "Provisional" pill with `SIGN_IN_PROVISIONAL.note` (OQ-83 in its
     tooltip), the `DemoBadge` "Demo prototype", and Phase 43's `SyntheticDataBadge` ("Synthetic data
     only", the tone the More card uses; Phase 43's handoff asks for it here), in the More tab's style.
     Nothing else: no "Forgot password", no social buttons, no Face ID (narrated, OQ-83).
   - Behaviour, all deterministic: an empty field shows an inline message under it ("Enter your
     email", "Enter your password"); an email other than the demo account's (case-insensitive,
     trimmed) shows "No account with that email. Use the demo account." under the email field; the
     demo account with any non-empty password signs in at once, with no spinner or delay.
   - Respects the four `--aa-inset-*` properties; the card stays clear of the home indicator and the
     on-screen keyboard (it scrolls); `data-shot="sign-in-screen"` on the root.
   - No en or em dashes.
4. **Audit and sign-out.**
   - Extend `src/store/authDemoActions.ts` with `recordAnaesthetistSignIn(api, outcome)`, where
     `outcome` is `'signedIn' | 'refused' | 'signedOut'`: one `mutate()` row with an empty patch as
     `SOUTER_ACTOR`, entity `account` and id Dr Souter's registration number, actions `auth.signIn`,
     `auth.signInFailed` (`reason: 'Unknown account'`) and `auth.signOut`, each `after` leading with
     `app: 'Mobile (PWA)'` and `provider: PROVIDER`. Time from the demo clock. Vitest: each outcome
     writes exactly one row and touches no domain slice.
   - `SignInScreen` calls it on each attempt; the framed build's default signed-in state writes no
     row.
   - **More tab:** under the persona card, an account row "Signed in as {email}" with a teal text
     button "Sign out" (`data-shot="more-sign-out"`, 44px target). It records `signedOut` and calls
     `signOutSession()`; the sign-in screen shows at once with the account pre-filled. No confirm
     step (one tap brings the presenter back). Shown in both builds.
   - **Reset:** the framed `DemoResetButton`'s `confirmReset` calls `clearAnaesthetistSession()`, so a
     framed Reset (and every scenario jump, which goes through it) always lands signed in. The PWA's
     `ResetCard` leaves the session as it is, so Reset on a handset never signs the presenter out.
   - `pwaPurity.test.ts` holds: `src/shared/session/` imports nothing from apps or shell.

### Simple anaesthetist screens

5. **Inventory.** Before changing anything, list every component an anaesthetist actor can render on
   mobile, web and the PWA: the sign-in screen and the More tab (work items 3 and 4), the Booking
   detail body and its capture block, every sheet reachable from it (procedure picker, Contract
   picker and its payer step, add billing line, events, adjustment, submit, cancel, attachments), the
   warnings section, the List detail and List rows, the add-Booking form, 32's move-List sheet and
   32a's move-Booking sheet, 38a's calendar and search result rows, 26's profile and prepaid tick list,
   27's prepayment estimate and warning on the Booking, the PWA's demo sheet results (21's "Office
   approves this Contract change"), Dashboard, Lists, Accounts and Balances. For each, note any text
   or control that shows Contract complexity. Record the list in the PROGRESS entry; it is the
   reviewers' checklist.

   **Allowed on anaesthetist screens:** the Contract's plain name; its AA code in the picker rows (the
   key Phase 20 built the search on, US-04.1.4, D16) and 20's holder-code match caption ("HNZCATall ·
   Cataract, all"); Phase 20's "Change" and its "Changed by you · office to check" pill, and 21's
   "Approved by the office"; who the invoice goes to, by name, and the payer's name and email where
   the Contract asks for them (21's Billing block and payer step; US-11.2.2 lets the anaesthetist
   enter them); a required input asked for in plain words ("{Contract} needs a claim reference.");
   the read-only "To confirm with the hospital" flag; 24's "Price adjustment" where the Contract
   allows it, without saying why it is or is not offered; amounts the anaesthetist types themselves
   (24's fixed final price, a typed fixed-fee event or amount line in 39b) and 27's prepayment
   estimate worded as an estimate, never a computed fee.

   **Not allowed:** pricing basis words ("RVG units at your rate", "Agreed rate", "Defined rate",
   "Fixed price list", "Hourly rate") and any rate or unit-price label ("FIXED CONTRACT PRICE", "FEE @
   $x/UNIT", "per unit"); the Contract's category; "Contract holder", "Bills {holder}", "Billed to
   {payer}" as a Contract attribute, and any holder-kind word beside Invoice to; the payment setting
   (FULL or SPLIT) and any split share; the multi-procedure rule (3/2/2, "second procedure at 50%" and
   similar); "allows adjustment"; fee-schedule lines, time bands and add-on prices; route words
   ("Route", "direct claim", "Insurer (direct claim)"); "Method 3" or "individually arranged".

6. **One viewer-aware display helper** (`src/shared/contractDisplay.ts`, pure TypeScript, no React, no
   store import, PWA-safe; or extend the helper Phase 20 built if it has one):
   - `contractLineFor(viewer: 'anaesthetist' | 'office', contract, extras)` returns the parts to draw:
     for the anaesthetist `{ name }` only; for the office `{ name, aaCode, basisLabel, holderLabel,
     categoryLabel }` from the label maps 18, 20, 22 and 24 own (import them, never retype them).
   - `contractPickerRowFor(viewer, contract, match)` returns 20's row parts the same way (anaesthetist:
     name, AA code and a holder-code match caption; office: those plus category pill, basis and holder).
   - `rateLabelFor(fee)` moves the "FIXED CONTRACT PRICE", "FEE @ $x/UNIT" and defined-rate label
     builder out of the Booking detail body, so it is called only on the office's total (work item 7).
   - The viewer comes from `actor.role` (`'office'` is office; everything else, `'system'` included,
     is the anaesthetist view, so an unexpected actor fails closed). The Booking detail body's
     `showBookingTotal` (today `actor.role !== 'anaesthetist'`) moves to the same rule. No other place in
     mobile, web or shared capture code branches on role to decide Contract detail.
   - Vitest (`contractDisplay.test.ts`): every Contract kind the seed and the fixtures hold gives the
     anaesthetist exactly `{ name }`; the office gets the full set; deterministic.
7. **Apply it** (fix what the inventory found; at plan time these were the known spots, and 20 to 39b
   will have fixed some):
   - `BtmCaptureBlock`: the anaesthetist's line is the Contract chip, 20's "Change" on a DRAFT List,
     the pending-change pill and the billing reference; nothing else. Delete `ROUTE_LABEL` and any
     insurer or billable-party part still in the line (21 moved who is invoiced to the Billing
     block). The office's line comes from the helper.
   - The Booking detail body: compute the rate label only inside the office branch (`showBookingTotal`),
     through `rateLabelFor`. At plan time the label was already drawn only on the office's total, so
     the anaesthetist never saw it; this makes it office-only by construction, so a later change
     cannot leak it.
   - The capture block's multi-procedure wording (23): the anaesthetist sees one neutral line, "Second
     procedure. Record its times; the office works out the fee." (or "Third", by ordinal). The office
     keeps 23's rule wording.
   - `AddBillingLineSheet` and 39b's events sheet: for the anaesthetist, line types by plain name only
     ("Post-op review", "Nerve catheter", "Pain consult", "Transport", and any Contract add-on by its
     line name), with no rate basis, no Contract name and no "Method" wording. If an amount is entered
     by the anaesthetist, the field is "Amount $" with no Contract context. The UNIT x RATE line 39b
     built through 24's rate function shows the anaesthetist only the units they enter, never the
     rate or the computed amount; any hours line 39b kept reads "Hours" with no rate wording, and
     says nothing about why it is or is not offered. The office keeps the detail.
   - 21's Billing block and payer step: on anaesthetist views Invoice to shows the party's name (and
     the payer's email where captured), with no "Contract holder", holder kind or "defined by the
     Contract" caption; the payer step asks "Who pays?" with name and email only. The office keeps
     its wording.
   - 24's `AdjustmentCard`: no caption names the Contract's rule; when the Contract does not allow an
     adjustment the card renders nothing (as 24 built). A refusal message shown to an anaesthetist that
     names the rule ("{Contract} does not allow an anaesthetist adjustment") cannot occur from the UI;
     leave the store message as it is.
   - `EditProcedureSheet`, the add-Booking form, `ListDetailScreen`, `ListDetailView`, the List row
     caption (20), Dashboard, Lists, Accounts and Balances: fix any item the inventory found.
   - `EditBillingSetupSheet`, `OfficeBillingSetup` and the split-share control (22): confirm each is
     mounted only for an office actor.
8. **No copy with a dash** in anything touched; keep "·", commas or "to".
9. **The guard test** (`src/apps/anaesthetistSimplicity.test.tsx`), the rule's one enforcement point:
   - **Render scan.** For an anaesthetist actor (Dr Souter), inside the mobile and then the web
     `SurfaceProvider`, render the Booking detail for a set of Bookings that between them cover every
     Contract kind: an RVG Default Hospital Contract, a default RVG Contract with a captured payer
     (21), a fixed-schedule Contract, a defined-rate Contract (24), ACC, an insurer Contract, a
     combination Contract (23), a SPLIT payment setting (22), an adjustment-allowed Contract with an
     adjustment stored (24), a schedule miss (21), and a Booking with a pre-op and a post-op event
     (39b). Use seeded Bookings where they exist and build the rest in the test with the billing
     fixtures (`domain/billing/fixtures.ts`: `mkContract`, `mkProcedure`, `mkBooking`) over a
     test-local store state, never in the seed. Render each on a DRAFT and on a SUBMITTED List. Also
     open the Contract picker and its payer step, the add-billing-line sheet and the events sheet,
     and render List detail and the List rows for those Lists.
   - **Forbidden text** is built from the office label constants themselves (pricing-basis labels,
     category labels, payment-setting labels, `rateLabelFor` over a fixed fee, a unit-rate fee and a
     defined-rate fee, the holder line builder), plus a short literal list: "FIXED CONTRACT PRICE",
     "/UNIT", "per unit", "Contract holder", "Bills ", "Method 3", "individually arranged", "direct
     claim", "Route". The scan reads `textContent` and every `aria-label` and `title`.
   - **Positive control.** The same renders for the office actor contain the pricing basis and the
     holder for at least one Booking, so the scan cannot pass by rendering nothing.
   - **Source scan** (in the style of `moneyViewPurity.test.ts`): no file under `src/apps/mobile` or
     `src/apps/web` imports `OfficeBillingSetup`, `EditBillingSetupSheet`, the split-share control or
     the office label maps.

### Point-of-need help

10. **One topic file** (`src/shared/help/helpTopics.ts`, pure TypeScript, PWA-safe):
    - `type HelpTopicId` is a string union; `HELP_TOPICS: Record<HelpTopicId, HelpTopic>` where
      `HelpTopic = { title: string; body: readonly string[]; provisional?: { oq: string; note: string } }`.
      The body is one to three short sentences per paragraph and at most 60 words in all.
    - All help copy in the app lives here, so a later screen change keeps its tip by keeping the topic
      id, and an answered OQ changes one entry. At 3d3a18c no topic is provisional; the field stays
      for a later open point.
    - Vitest (`helpTopics.test.ts`): no en or em dash in any title or body; every body at most 60 words;
      no body contains "slot" (OQ-64: the word never reaches app copy); every `provisional.oq` matches
      `OQ-\d+`; every id used by a component exists (a typed union makes this a compile error; the test
      checks the reverse, that no topic is unused).
11. **The topics** (copy verbatim unless the drift check changed a rule; each must match what phases 15a
    to 39b actually built, so re-read the screen before keeping a sentence):

    | id | Where | Title | Body |
    |---|---|---|---|
    | `capture.procedure` | Booking capture, the procedure card (19) | Procedure | "Pick the procedure first. Its base units come from its Contract. If they look wrong, change them: any value is accepted, and one outside the usual range gives the office a warning to check after the procedure." (D3, D12) |
    | `capture.contract` | Booking capture, 20's Contract row | Contract | "The Contract sets who is invoiced and how the fee is worked out. The office sets it up, so it is usually right already. Change it only if this patient is covered differently: you see the Contracts for this procedure and hospital. The office checks every change." (D16, D17) |
    | `capture.times` | `TimesCard` | Times | "Tap Start now when the anaesthetic starts and Finish now at handover. You can nudge either time afterwards. Time units come from these two times, and a part interval always counts as a whole one." (D25) |
    | `capture.units` | `UnitsCard` | Units | "Record the base, time and modifier units here. The office works out the fee from them and the Contract, so this screen does not show it." (the same on the web anaesthetist app; neither shows a computed fee) |
    | `capture.warnings` | Booking capture, 15a's warnings section | Warnings | "A warning is a reminder, never a block. It shows here when you open the Booking. You can still complete and submit as usual. The office sees the same warning on its to-do list." (US-13.7.3: no confirm step) |
    | `day.statuses` | Admin Day, beside the status legend | Reading the day | "Each row is one anaesthetist's day: a morning and an afternoon session. A session shows its List, or its availability when it has none. The legend names each kind of List, then each availability status from the office's own list. Select one in the legend to hide or show it." (D14; names no colour, because 29 makes the availability statuses editable, and keeps the List types apart from the availability statuses, as 29's legend does) |
    | `day.draftLists` | Admin Day, 31's band and the Draft Lists rail card | Draft Lists | "A Draft List has a hospital, surgeon, day and session, but no anaesthetist yet. Assign it by picking an anaesthetist with a free session. A List lands here when its anaesthetist returns it to the office, or when a surgeon's regular booking falls on a session marked unavailable." (D14, OQ-81 part settled; not provisional) |
    | `day.todo` | Admin Day, 15a's To-do rail card | To-do | "Warnings that need action land here. None of them blocks anything. Open one to see the Booking, and Clear it once it is dealt with. Notices that need no action, such as a List an anaesthetist moved, go to Notifications instead." (FT-13.7 note, D15) |
    | `review.flags` | Admin Review, the Flags tile | Flags | "Flags are things to check before you authorise. Fix them here, or phone the anaesthetist. A List is never sent back." |
    | `review.contracts` | Admin Review, 21's Contract column heading | Contracts | "Every procedure needs a Contract you have approved. A Contract the anaesthetist changed is marked so you can check it. Authorising approves any still open." |
    | `review.price` | Admin Review, 24's price layers (the Fee heading) | How the fee is worked out | "The fee starts from the Contract: units at a rate, the Contract's own rate, or a fixed price. An anaesthetist adjustment comes next, only where the Contract allows one. Your override comes last and always wins." |
    | `review.authorise` | Admin Review, the action bar beside "Authorise for billing" | Authorising | "Authorising locks the List, its Bookings and the Contract terms they use, and passes it to billing for its invoices. Anything added afterwards is invoiced in the next run, and a correction can be a credit and a new invoice." (US-07.3.1, 25, 38b, 39; "can be" because an additional invoice alone also corrects, and the rebill total is OQ-77; avoids the word "event", whose label 38b keeps in one place) |

    Keep the list at about a dozen. Do not add tips to other screens in this phase. If a sentence
    depends on an open point after the drift check, give the topic `provisional` and show the pill.
12. **`InfoTip`** (`src/shared/help/InfoTip.tsx`, exported from `src/shared/index.ts`; PWA-safe):
    - Props: `topic: HelpTopicId`, optional `placement` hint for the popover. It reads `useSurface()`.
    - **Trigger:** a `button` with lucide `Info` at 16px in `neutral.mist`, teal (`accent.base`) on
      hover, focus and while open; `aria-label="About {title}"`, `aria-expanded`, `aria-controls`;
      `data-shot="info-tip-{topic id with dots as dashes}"`. On mobile the hit area is 44 by 44 with
      the glyph centred, made with padding and a balancing negative margin so the label row does not
      grow; it must never overlap another control (tested in work item 15). On desktop the hit area is
      28 by 28.
    - **Mobile:** opens through `useSurface().Overlay` (the `BottomSheet`, `sheet-in`): the title (18px,
      700), the body paragraphs (14px, slate), the Provisional pill when set, and one secondary "Got it"
      button. Never a centred modal (convention 16).
    - **Desktop (web and admin):** an anchored popover, not the centred `Dialog`: about 320px wide,
      radius `card`, e-2, `neutral.surface`, `role="dialog"` labelled by its title, rendered through a
      portal with fixed positioning from the trigger's rect (flipping above or left when it would leave
      the viewport), so Review's horizontally scrolling table and the List drawer never clip it. Esc,
      an outside click or the trigger closes it, and focus returns to the trigger. One popover open at a
      time.
    - Reduced motion: 80ms fades.
    - The existing native `title` tooltips (`StatusLegend`, `DayGrid` conflicts, segmented controls)
      stay as hover extras; they are not the help mechanism and are not replaced.
    - Component test (`InfoTip.test.tsx`): mobile renders the sheet with the topic's copy; web renders
      the popover with `role="dialog"`; Esc closes and refocuses the trigger; opening a second tip
      closes the first; the accessible name is "About {title}".
13. **Place the tips** (work item 11's table):
    - `CaptureSection` gains an optional `help?: HelpTopicId`, drawn at the right end of its micro-caps
      label row. Times, Units and the procedure card pass theirs; 20's Contract row, 15a's warnings
      section and any other capture element that is not a `CaptureSection` places `InfoTip` beside its
      own label. Because the capture block is shared, the anaesthetist web app gets the same tips; the
      office's view of the same block gets them too, which is fine.
    - Admin Day: beside the `StatusLegend` chips in `DayGrid`, in 31's band label and the Draft Lists
      rail card heading (one topic, two places), and in 15a's To-do card heading.
    - Admin Review: in the Flags tile label, the Contract column heading, the Fee column heading (or
      wherever 24 shows the two price layers) and beside "Authorise for billing" in the action bar.
    - Nothing else on these screens moves; tips add no rows and no new cards.
14. **First-run hints** (`src/shared/help/firstRunHints.ts` and `src/shared/help/FirstRunHint.tsx`):
    - `firstRunHints.ts` (no React; PWA-safe): `type HintApp = 'mobile' | 'web' | 'admin'`; keys
      `aa-first-run-hint-mobile`, `-web` and `-admin`; a tiny non-persisted zustand store (like work
      item 1's) mirroring `{ dismissed: Record<HintApp, boolean> }`, read from `localStorage` once and
      written through on change, every access wrapped in try/catch so a blocked storage shows the hint
      and never throws; `dismissHint(app)`, `clearFirstRunHintDismissals()` and `anyHintDismissed()`.
      It is per-viewer browser state, never in `AppState`, never audited, and `PERSIST_VERSION` does
      not move.
    - `FirstRunHint({ app })`: an inline card in page flow (never a modal, never a scrim, nothing
      positioned over other content), radius `card`, `accent.tint` fill, e-1, a 20px `Info` glyph in
      teal, a title, one or two lines, and a teal text button "Got it" that calls `dismissHint`.
      `data-shot="first-run-hint-{app}"`. Copy:
      - **Mobile** (under the `MobileHeader` greeting on Lists, after sign-in; the PWA shows the same):
        title "Welcome to your Lists"; body "Tap a List to see its Bookings, then a Booking to capture
        it. Tap the info sign beside a heading for a short explanation."
      - **Web** (under the Dashboard greeting): title "Welcome"; body "Your week is here, and Lists
        holds every List and Booking. Select the info sign beside a heading for a short explanation."
      - **Admin** (between `DayNav` and the grid on the Day view): title "The day at a glance"; body
        "Every anaesthetist's morning and afternoon, Draft Lists waiting for one, and your to-do list
        and notifications on the right. Select the info sign beside a heading for a short
        explanation."
    - Both Reset paths clear the dismissals, beside `clearInstallCoachDismissal` and work item 4's
      session clear: `DemoResetButton`'s `confirmReset` and `PwaDemoPanel`'s `ResetCard`. The scenario
      jumps go through the same reset and so clear them too.
    - On mobile the card respects the insets and `DockSpacer`; it never pushes the tab bar.
    - Vitest (`firstRunHints.test.ts`): dismiss persists across a fresh store over the same storage;
      clear restores all three; a throwing `localStorage` leaves every hint showing and no exception.
15. **Tests and shots.**
    - **Keep existing specs as they were.** In `playwright.config.ts`, give both projects a
      `storageState` file (`visual/storage/demo-ready.json`): the three hint keys set for the 5173 and
      5174 origins, and `aa-anaesthetist-session` signed in for 5174, so no existing spec sees a
      first-run card or the PWA sign-in screen and no flow or screenshot moves. The new specs opt out
      with `test.use({ storageState: { cookies: [], origins: [] } })`.
    - New `visual/ease-of-use.spec.ts` (prototype project):
      - fresh storage: the Admin Day, web Dashboard and mobile Lists show their hint; "Got it" hides
        it and it stays hidden after a reload;
      - "Show first-run hints again" in Demo actions brings them back;
      - the framed phone opens signed in; More → Sign out shows the sign-in screen with the account
        pre-filled; Sign in returns to the same route; Reset leaves it signed in;
      - mobile Booking capture: tap `info-tip-capture-units`, the sheet opens with the Units copy, "Got
        it" closes it (`data-shot` captures for the guide);
      - Admin Day: the `day-statuses` popover opens beside the legend; Esc closes it and focus returns;
      - Admin Review: the `review-contracts` popover renders whole inside the viewport although the
        table scrolls horizontally;
      - **touch targets:** on mobile capture, for every `[data-shot^="info-tip-"]`, the four corners of
        its 44px box resolve through `document.elementFromPoint` to the tip itself, and the tip's box
        does not intersect any other `button`, `a`, `input` or `[role="button"]`.
    - `visual/pwa-device.spec.ts`, in a fresh-storage block: the PWA opens on the sign-in screen at
      `/mobile/lists` and at a deep Booking URL; an empty password and a wrong email show their inline
      messages; Sign in lands on the URL it opened; a reload stays signed in; the PWA Reset stays
      signed in; the Demo chip's "Sign out" returns to the sign-in screen; the sign-in card and the
      mobile hint on Lists clear the insets and the dock floor; the Demo chip on Lists offers "Show
      first-run hints again".
    - Admin Audit (prototype project): after a sign-in, a refused attempt and a sign-out on the
      framed phone, the Audit viewer filtered to `account` shows the three rows.
    - Component tests: `SignInScreen` (pre-fill from the store, the three messages, sign-in calls the
      session and the audit action); the gate in `MobileApp` for each `sessionDefault`; `CaptureSection`
      with and without `help`; `FirstRunHint` dismiss; the Review and Day placements render their
      tips.
    - `pwaPurity.test.ts` holds (`src/shared/help/` and `src/shared/session/` sit in the PWA closure and
      import nothing from apps or shell).

### Demo triggers

16. Register both in `src/shared/demoTriggers/registry.ts`; their bodies live in `src/shared/session`,
    `src/shared/help` and `src/store`, PWA-safe:
    - **"Sign out"** (`id: 'pwa-sign-out'`; the PWA stand-in ROADMAP.md's PWA parity list names for
      43a): description "Signs Dr Souter out, as at the end of a shift. The sign-in screen shows with
      the account filled in.", screen "Mobile · any screen", routes `/mobile/*`, surfaces `['pwa']`.
      `run` records `signedOut` and calls `signOutSession()`, returning `{ ok: true, message: 'Signed
      out. Tap Sign in to come back.' }`. `disabledReason` is "Already signed out" while signed out.
      `indexPath: () => '/mobile/more'`, `indexHint: 'On a handset, from the Demo sheet; in the framed
      phone, use Sign out on More.'`
    - **"Show first-run hints again"** (`id: 'show-first-run-hints'`): description "Brings back the
      welcome card on Mobile, Web and Admin, as for a first visit.", screen "All apps", routes
      `/mobile/*`, `/web/*` and `/admin/*`, surfaces `['bar', 'pwa']`. `run` calls
      `clearFirstRunHintDismissals()` and returns `{ ok: true, message: 'The welcome cards will show
      again.' }`; it touches no domain state. `disabledReason` is "No welcome card has been dismissed"
      while `anyHintDismissed()` is false. `indexPath: () => '/admin'`.
    - The session and hint stores are not `AppState`, so the harness bar's Demo actions menu and
      `PwaDemoActions` must re-evaluate `disabledReason` when either changes (subscribe to both, or
      compute on open); otherwise "Got it" or Sign in leaves an entry in the wrong state until the next
      route change.
    - Vitest in the registry's tests: "Sign out" visible only on the PWA surface on a mobile route,
      disabled while signed out, and running it signs out and writes one audit row; "Show first-run
      hints again" visible on a mobile, web and admin route and on the PWA surface, disabled until a
      hint is dismissed, and running it clears all three.

## Demo triggers

| Trigger | Screen | Surfaces | What it does |
|---|---|---|---|
| Sign out | Every Mobile route | PWA demo sheet only | Signs Dr Souter out (one audited row) so the PWA shows the sign-in screen with the account pre-filled. Disabled with "Already signed out". The framed phone uses the product's own Sign out on More. |
| Show first-run hints again | Every Mobile, Web and Admin route | Harness bar and PWA demo sheet | Clears the three per-browser dismissals so each app's welcome card shows again. Disabled with "No welcome card has been dismissed". |

Everything else is demoable through normal use: the sign-in screen shows on any fresh handset and
after Sign out on More, the tips are product UI on the screens they explain, and the hints show on
any fresh browser and after Reset. Nothing waits on the office, a colleague or a backend event, so
"Sign out" is the only PWA stand-in. The Control Panel page gains nothing; Phase 14's index lists both
triggers under their screens.

## Out of scope

- A real identity provider (Auth0 or Entra), password storage or checking, MFA, single sign-on or
  social login, biometrics, self-service password reset, session expiry and a native app (OQ-83;
  narrated, and Phase 14's "Simulate sign-in attempts" audit rows stay the account-service story on
  `/admin/audit`).
- A sign-in on the anaesthetist web app or the Admin app (US-13.5.3 says PWA first; narrated), and
  any persona switch on the sign-in screen (one demo account).
- Training per user group and short standalone documentation (presenter-narrated, as US-15.0.1's
  technical discussion describes them).
- A help centre, a searchable manual, a per-app Help page, guided tours, coach marks or a spotlight
  overlay, and any AI assistant.
- Tips on any screen other than Booking capture, Admin Day and Admin Review (Lists, Availability,
  Accounts, Invoices, Billing monitor, Masters, Intake, Notifications). A later phase adds a topic
  and a `help` prop if AA asks.
- Rewording the office's own Contract detail, the Contract editor, or Review's columns beyond placing
  tips.
- Removing the anaesthetist's Contract "Change" (US-03.4.1, Phase 20's rule) or the payer step
  (US-11.2.2, Phase 21's).
- Any computed fee on the anaesthetist's Booking screens (Phase 24's and 39b's ruling: the only
  amounts are the ones the anaesthetist types, such as a fixed final price or a typed fixed fee, plus
  27's prepayment estimate; this phase keeps it that way) and any change to web Accounts beyond the
  sweep.
- Localisation, te reo Māori copy beyond the existing greeting, and accessibility work beyond the new
  components (a full audit is not in scope).
- The S1 to S5 rewrite (Phase 44).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] PWA (`npm run dev:pwa`, fresh storage): `/mobile/lists` opens on the sign-in screen with Dr
      Souter's email and a masked password filled in, the AA logo, a teal Sign in, the Provisional
      caption naming OQ-83 and the Synthetic data only badge. Clear the password: "Enter your
      password". Type another email: "No account with that email. Use the demo account." Restore and tap Sign in: Lists shows at once.
- [ ] PWA: reload and relaunch stay signed in. Open a deep Booking URL while signed out: after Sign
      in it lands on that Booking. PWA Reset leaves the handset signed in.
- [ ] PWA: More shows "Signed in as m.souter@aa-associates.example" and Sign out; Sign out returns to
      the sign-in screen with the account pre-filled. The Demo chip's "Sign out" does the same and is
      disabled with "Already signed out" on the sign-in screen.
- [ ] Framed prototype: Reset, then Mobile opens signed in with no sign-in screen. More → Sign out
      shows the sign-in screen inside the phone frame; Sign in returns. Admin → Audit, entity type
      account: the sign-in, refused and sign-out rows are there, as Dr Souter, at demo-clock time.
- [ ] Reset. Mobile → Lists: the "Welcome to your Lists" card sits under the greeting; "Got it" hides
      it; a reload keeps it hidden. Web Dashboard and Admin Day show their own card the same way.
- [ ] Demo actions → "Show first-run hints again": all three cards come back. With none dismissed, the
      entry is disabled with its reason.
- [ ] Mobile → Souter Tue 21 Jul PM → Margaret Ellison (BK0009, the capture recipe's Booking), and
      Sarah Mitchell on Tue 28 Jul AM once S1's St George's sync (34) has created her Booking: the
      Contract line shows the plain name (for Sarah Mitchell "St George's RVG Default Hospital", 18's
      naming) and "Change", nothing else; no route, insurer, holder, basis or rate anywhere on the
      Booking, its sheets or the List. Invoice to shows the party by name only.
- [ ] Open the Contract picker as the anaesthetist: each row is a name and its AA code, filtered to the
      procedure then the hospital, with the default RVG Contract offered; type a holder code and the
      match caption shows. Pick a default RVG Contract: the payer step asks "Who pays?" with name and
      email only. Open the same picker in Admin: category pill, basis and "Bills ..." are there.
- [ ] Add a second procedure on mobile: the note reads "Second procedure. Record its times; the office
      works out the fee." Admin's view of the same Booking shows 23's rule wording.
- [ ] Add a billing line and a post-op event on mobile: line types by plain name, no "Method", rate or
      computed amount. A Booking on a defined-rate Contract shows no rate wording.
- [ ] On capture, tap the info sign on Procedure, Contract, Times, Units and Warnings: each opens a
      bottom sheet with its copy and "Got it"; none is a centred modal; each tip is easy to hit without
      touching a stepper or chip. The Warnings copy mentions no confirm step, and submitting a Booking
      with a warning goes straight through.
- [ ] Web → the same Booking: the same tips open as popovers; Esc closes and returns focus.
- [ ] Admin Day Tue 21 Jul: the tips beside the legend, on the Draft Lists band and rail card, and on
      the To-do card open popovers that stay on screen at 1280px and 1440px. No tip carries a
      Provisional pill; no tip text says "slot"; the To-do tip points to Notifications.
- [ ] Admin Review (Dr Morrison, Mon 20 Jul): the Flags, Contract, Fee and Authorise tips open, and the
      Contract popover is not clipped by the table.
- [ ] PWA (fresh storage, after sign-in): the mobile card clears the insets, the tips open as sheets,
      and the Demo chip offers "Show first-run hints again" and "Sign out".
- [ ] Keyboard: every tip is reachable by Tab and opens on Enter or Space; screen-reader names read
      "About {title}"; the sign-in fields are labelled and Enter submits.
- [ ] No en or em dashes in any new string; teal the only action colour; crimson only in the logo and
      avatar; the Provisional pill shows only on the sign-in screen.
- [ ] Catalogue screenshots: the recipes for US-15.0.1 are updated and the one for US-13.5.3 created,
      any recipe this phase broke is re-pointed, the capture runner presets the three first-run
      dismissals and the PWA session, a full `npm run capture` ends with no failed recipe and no story
      without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is
      green.
- [ ] `PERSIST_VERSION` unchanged; `npm run build`, `npm run build:pwa`, `npx vitest run`,
      `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch in the same session (`docs/demo-guide/`, the same sections of `master-demo-guide.html`):

- `03-demo-script.md`:
  - **Pre-demo setup:** after Reset the welcome cards show on all three apps. Dismiss them before the
    audience arrives, or leave the mobile one to open S1 with. "Show first-run hints again" in Demo
    actions brings them back. On a handset, the installed PWA opens on the sign-in screen the first
    time: tap Sign in (the account is filled in) before the audience arrives, or use it as the opener.
    The framed phone always opens signed in.
  - **S1 Beat 3, Worth pointing at:** add "The anaesthetist sees the Contract by name only, with
    Change; the office handles the rest. Tap the info sign on Units for the point-of-need
    explanation." Say: "Help sits on the screen, where it is needed, so the manual stays short."
    On a handset, optionally open with the sign-in: "An anaesthetist signs in once with their
    account; how, exactly, is still being decided."
  - **S2 Beat 1:** after the grid pause, open the tip beside the status legend and, if the band is on
    screen, the Draft Lists tip. Expected: a small popover, closed with Esc.
  - **S2 Beat 4:** optionally open the Contracts tip before authorising. Add a discovery point: "which
    screens AA wants help on next, and whether training per user group is enough".
  - **S5 Beat 1 (optional aside):** with entity type account, the sign-in and sign-out rows from the
    handset sit beside Phase 14's simulated rows.
  - **What to narrate rather than click:** add training per user group before go-live, the short
    standalone guides, and the identity service (Auth0 proposed, MFA, single sign-on, Face ID on a
    native app, self-service password reset; OQ-83).
- `04-presenter-cheat-sheet.md`: under "Likely evaluator questions" add "How will people who are not
  comfortable with new systems cope?" (answer: large controls and one clear action, the Contract kept
  off the anaesthetist's screens, help beside each heading on the daily screens, a welcome card, and
  training per group) and "How do anaesthetists sign in?" (answer: an account login on the PWA, shown
  simulated; the identity provider, MFA, single sign-on and biometrics are still to be decided, and the
  audit logs every attempt); "Built and clickable" lists the sign-in, the tips and the welcome cards;
  the handset section names the Demo chip's "Sign out"; "What each app is for" (Anaesthetist Mobile and
  Web) gains "sees the Contract by name only".
- `02-workflows-and-handoffs.md`: one line in the capture workflow that the office, not the
  anaesthetist, deals with Contract pricing, and one that the anaesthetist signs in to the PWA once.
- `01-personas-and-responsibilities.md`: Dr Souter's entry gains her demo sign-in account.
- `master-demo-guide.html`: the same passages.
- Control Panel scenario text: no change.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 43a` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-15.0.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.1.md) Ease of use | partial · mobile-card-capture and admin-day-view (reason: "Ease of use is a quality that screenshots can only suggest ... needs usability testing, which the prototype has not had") | partial, with a rewritten reason: the shots show the calm, plain screens, the Contract by name only and the point-of-need help, but whether people not comfortable with modern systems find it intuitive needs usability testing, which the prototype has not had (no later phase builds it). Keep both shot names (`card-capture`, app mobile, and `day-view`, app admin; their images are `mobile-card-capture.png` and `admin-day-view.png`) and re-shoot: `card-capture` (mobile on :5174, signed in by the runner's preset, keep the recipe's start `/mobile/lists/L-34821-2026-07-21-PM/bookings/BK0009`, Margaret Ellison) with states `plain-contract` (the Contract line shows only its plain name and "Change", highlight it; no route, insurer, holder or rate) and `tip-open` (tap `[data-shot=info-tip-capture-units]`: the bottom sheet with the Units copy and "Got it"); `day-view` (admin, `/admin/day/2026-07-21`) with states `day` (highlight the grid and the to-do list) and `tip-open` (open `info-tip-day-statuses`: the popover beside the legend). Add shots `first-run-hint` for mobile Lists, web Dashboard and Admin Day (`first-run-hint-mobile`, `-web`, `-admin`: the welcome card, reached with the "Show first-run hints again" entry because the capture preset hides it) and `review-tip` (admin `/admin/review/:listId`, the Contract popover whole inside the viewport, `info-tip-review-contracts`). Add a web Booking shot with the same tip as a popover. Captions: "Plain Booking capture", "Help at the point of need", "Welcome card shown on first visit" |
| [US-13.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.3.md) Sign in to the anaesthetist app | none (create it) | create, status captured. Mobile on :5174. Shot `pwa-sign-in`: open `/mobile/more`, tap `[data-shot=more-sign-out]` (the runner's preset starts signed in), state `sign-in` highlighting `[data-shot=sign-in-screen]`'s card (the pre-filled account, Sign in and the OQ-83 Provisional caption); then tap `[data-shot=sign-in-submit]`, state `signed-in` on `/mobile/lists`. Shot `more-account`: `/mobile/more`, highlight the "Signed in as" row and Sign out only (crop above the PWA build panel, which changes every run). Caption: "The anaesthetist signs in to the PWA with their account (simulated sign-in; the identity service is still to be decided)" |

**Recipes this phase breaks.**

- **The PWA opens on the sign-in screen with fresh storage.** Every mobile shot runs on :5174, and each
  capture state starts from empty browser storage, so without a preset every mobile recipe would shoot
  the sign-in screen. Make `requirements-board/scripts/capture.ts` start each :5174 context with
  `aa-anaesthetist-session` signed in (set as in `visual/storage/demo-ready.json`), and have the
  US-13.5.3 states reach the sign-in screen through More → Sign out. Check several mobile images by
  eye.
- **First-run welcome cards appear in every fresh context.** The new welcome card shows on mobile Lists
  (`/mobile/lists`), the web Dashboard and the Admin Day view in the shots of every recipe that opens
  them. Do what the Playwright specs do: make `capture.ts` start each context with the three dismissal
  keys (`aa-first-run-hint-mobile`, `-web`, `-admin`) on both origins, and have the `first-run-hint`
  states above bring the card back with the "Show first-run hints again" entry. Check one image per
  app by eye. Roughly seven recipes start on a bare app root or Lists page, and the many
  `/admin/day/` recipes (about fifty) start on the Day view.
- **The More tab gains the account row.** No recipe starts on `/mobile/more` at 3d3a18c; any that a
  later phase added shifts down by one row, so re-check it.
- The Contract row on the anaesthetist's capture block shows the plain name only: recipes that
  highlight a Contract line or picker on mobile or web (`US-03.4.1` and the Contract recipes under
  FT-03.4, `US-04.3.x`, `US-11.2.x`, if present) must still resolve; the office view in Admin keeps
  category, basis and "Bills ...".
- `CaptureSection` gains an info tip in its label row, so recipes selecting by a section label's exact
  text (for example `text="Times"`) may now match the tip's accessible name too; re-run with `--dry`.
- Work item 15 keeps the existing Playwright specs green with a storage preset; the capture runner
  needs the same, which is the one non-doc change this step makes outside `aa-prototype/`.

**ATLAS.md.** Update "Gotchas" (the PWA sign-in screen and the session preset, the first-run welcome
card and the dismissal preset the runner now applies), "Existing hooks" (`sign-in-screen`,
`sign-in-submit`, `more-sign-out`, `pwa-demo-action-pwa-sign-out`, `info-tip-*`, `first-run-hint-*`),
the `/mobile/more` route note (the account row) and "Overlays that need clicks" (the info tip as a
bottom sheet on mobile and an anchored popover on web and admin).

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**: three independent Opus review subagents, one each for
**quality**, **bugs/correctness** and **plan adherence**, each given US-13.5.3, US-15.0.1, OQ-83, the
context items, this doc, the work item 5 inventory and the diff. This session verifies every finding
against the catalogue, this doc and the code, fixes the confirmed ones (with a test wherever a bug had
none), re-greens and records the pass. Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **Sign-in never blocks a workshop.** The framed build opens signed in after Reset and every scenario
  jump; the PWA keeps its session across reloads and its own Reset; the account is pre-filled from the
  store and the demo account always works; blocked storage falls back to the host default and never
  throws; a deep link survives sign-in; existing specs and capture recipes are unaffected (the
  presets).
- **Sign-in is honest.** Nothing claims a real identity provider, MFA, single sign-on or biometrics;
  the OQ-83 caption lives in one constant and shows only on the sign-in screen; the audit rows are
  audit-only (no domain slice, no `PERSIST_VERSION` change) and deterministic (demo clock); no password
  value is stored or logged.
- **Leaks.** Hunt for any anaesthetist path that still shows Contract complexity: a sheet the inventory
  missed, the payer step, an `aria-label` or `title`, a refusal message surfaced in the UI, a List row
  caption, web Accounts, the PWA, a SUBMITTED or read-only Booking, a Booking moved from a colleague
  (32, 32a), a defined-rate Contract (24). Check the scan covers each and is not vacuous (the office
  positive control).
- **Office unchanged.** The office still sees every detail it saw before: basis, holder, category,
  payment setting and share, rule wording, rate label.
- **One helper.** No mobile, web or shared capture file decides Contract detail by role outside the
  helper; no label is retyped instead of imported.
- **Help copy is true.** Each topic matches what the screen actually does after 15a to 39b and states
  the 2026-10-02 answers (D3, D12, D14 to D17, D25, US-13.7.3's no confirm step) plainly; none states as
  settled a point still open (OQ-49, OQ-60, OQ-78, OQ-79, OQ-83, OQ-86, BCTI granularity); no topic says
  "slot" or "event"; every string is dash-free and within 60 words.
- **Touch and focus.** Mobile tip hit areas are 44px and overlap nothing; the desktop popover is not
  clipped, flips at the edges, closes on Esc and outside click, returns focus, and only one is open; the
  sheet is a bottom sheet; no nested interactive elements (a tip inside a clickable row or `th` button).
- **Hints and session are per-viewer, not domain.** Nothing in `AppState` or the persisted payload;
  storage failures are swallowed; Reset and the triggers do what the doc says; the PWA closure is clean.
- **Design.** Teal only for action, crimson only in the logo and avatar, the design's label row, rail
  card, field and sheet anatomy, no new chrome, reduced motion respected.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the simulated sign-in built for OQ-83 (account login on the PWA only, pre-filled,
  framed build signed in, PWA Reset keeps the session) with its provisional caption; any other default
  built for an open question; anything logged rather than fixed; and the screens worth a look, each
  with its route and persona (the PWA sign-in on a fresh handset, More, mobile capture with a tip
  open, Admin Day and Review with a popover).
- **Status row** for catch-up Phase 43a, and a phase entry with:
  - the drift-check result (US-15.0.1 and US-13.5.3 changed or not; OQ-83 still open or answered; any
    OQ answered that changed a tip);
  - the work item 5 inventory and what was fixed in each place;
  - the name map: `anaesthetistSession.ts` (`useAnaesthetistSession`, `signInSession`,
    `signOutSession`, `clearAnaesthetistSession`, `SIGN_IN_PROVISIONAL`, `SIGN_IN_RULE`, the
    `aa-anaesthetist-session` key); `MobileApp`'s `sessionDefault`; `SignInScreen`;
    `recordAnaesthetistSignIn`; `contractLineFor`, `contractPickerRowFor` and `rateLabelFor` in
    `src/shared/contractDisplay.ts` (or the 20 helper it extends); `HELP_TOPICS` and `HelpTopicId` in
    `src/shared/help/helpTopics.ts`; `InfoTip`; `CaptureSection`'s `help` prop; `firstRunHints.ts`
    (`dismissHint`, `clearFirstRunHintDismissals`, `anyHintDismissed`, the three storage keys);
    `FirstRunHint`; the `pwa-sign-out` and `show-first-run-hints` triggers;
    `anaesthetistSimplicity.test.tsx`;
  - `PERSIST_VERSION` unchanged (state it);
  - tests added and the before and after Vitest and Playwright counts, and the `demo-ready.json`
    storage preset;
  - the review pass.
- **Catalogue screenshots:** the recipes created or changed (by ID), the `capture/REPORT.md` counts
  before and after (captured, partial, absent, failed), the recipes this phase broke and how they were
  re-pointed, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **New:** anaesthetists sign in to the PWA with a simulated account login (US-13.5.3, PWA first):
     the demo account pre-filled, the session kept per device, the framed build signed in by default,
     sign-in, refusal and sign-out audited as `account` rows; the identity service is narrated
     (OQ-83, provisional, one constant).
  2. **New:** anaesthetist screens show a Contract by its plain name (and its AA code in the picker),
     with Phase 20's "Change"; pricing basis, defined rate, category, holder, payment setting, split
     share, rule wording and rate labels are office only. One helper decides it and
     `anaesthetistSimplicity.test.tsx` enforces it (US-15.0.1 Notes, note point 51).
  3. **New:** point-of-need help is one `InfoTip` and one topic file, placed beside section labels on
     Booking capture, Admin Day and Admin Review; a bottom sheet on the phone and an anchored popover on
     desktop. Native `title` tooltips stay as hover extras and are not the help mechanism.
  4. **New:** first-run hints are per-viewer browser storage, like the PWA install coaching: not domain
     state, not audited, no `PERSIST_VERSION` change; Reset and "Show first-run hints again" clear them;
     Playwright and the capture runner preset them dismissed (and the PWA signed in) for existing specs
     and recipes.
  5. **Closed:** the Phase 06 reading that "route-setting is office knowledge" with the route chip still
     drawn on the anaesthetist's capture line (superseded by Phase 20's route removal); the line is now
     the Contract name only.
- **Handoff notes:**
  - For **44**: S1 Beat 3 and S2 Beats 1 and 4 now carry optional tip moments, the pre-demo note covers
    the welcome cards and the handset sign-in, and S5 Beat 1 has an optional account aside; keep them
    in the rewrite and audit both triggers on all three apps and the PWA (PWA parity: "Sign out").
  - For **44**: `visual/storage/demo-ready.json` (signed in on 5174, the three hints dismissed) is the
    test helper its PWA parity spec can reuse instead of signing in through the screen.
  - For any later phase that adds an operational screen section: give it a topic and pass `help`, and
    add any new anaesthetist-reachable sheet to the simplicity scan.
  - When OQ-83 is answered, change `SIGN_IN_RULE` and the sign-in screen, and drop
    `SIGN_IN_PROVISIONAL`. When an OQ named in a tip is answered, update its `HELP_TOPICS` entry.
