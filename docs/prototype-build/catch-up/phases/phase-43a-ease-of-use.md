# Phase 43a · Ease of use: simple anaesthetist screens and point-of-need help

**Requirements covered:**
[US-15.0.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.1.md)
Ease of use (Proposed: intuitive for people who are not comfortable with modern systems, most of all
on the operational screens; guidance embedded at the point of need so standalone documentation stays
short; and, from the 2026-10-01 Notes, "anaesthetists see none of the Contract complexity, which the
office handles, and the new system should not add it").
Its two catalogue images are the layout targets for the help:
[mobile Booking capture](../../../discovery-reference/Updated%20Requirements/catalogue/assets/US-15.0.1/mobile-card-capture.png)
and [the Admin Day view](../../../discovery-reference/Updated%20Requirements/catalogue/assets/US-15.0.1/admin-day-view.png).
Read alongside (not closed here, must stay green):
[US-15.0.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.2.md) (mobile-first; web a full alternative),
[FT-03.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.4.md) and
[US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md) (the anaesthetist can change the Contract; Phase 20's plain Contract row and "Change" are the one Contract control they keep),
[US-11.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.2.md) (Open: the billable-party override, which both the anaesthetist and the office may set; Phase 21's Billing block),
[US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md) (Contract pricing and adjustment rules; Phase 24's Contract-gated adjustment),
[FT-13.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.7.md),
[US-13.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.2.md) and
[US-13.7.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.3.md) (Verify: warnings, the to-do list and the triangle, Phase 15a),
[US-13.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.1.1.md) (the one-day dashboard, Phase 31's Draft Lists band and rail card),
[FT-01.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.6.md) (Verify: Draft Lists) and
[US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md) (office review of Contracts, Phase 21's Review column and approval).
Evidence: points 51 ("keep the anaesthetist's world simple") and 52 (the working rule that an
unanswered question is built as its recommendation) of
[the 2026-10-01 meeting note](../../../discovery-reference/Updated%20Requirements/catalogue/notes/2026-10-01-aa-meeting-with-greg.md).
No DM or RV item is owned here. The phase builds on
[DM-37](../analysis/domain-model-delta.md#dm-37) (the anaesthetist Contract change flagged for office
approval, Phase 20); no [reverse-check](../analysis/reverse-check.md) finding is closed here.
No open question is linked to US-15.0.1, and no owner decision (D1 to D11) gates this phase.
**Depends on:** 21 (the Booking's Billing block, required inputs, the schedule-miss flag and Review's
Contract column and approval), 24 (the Contract-gated `AdjustmentCard` and the two price layers on
Review), 31 (the Draft Lists band on the Day grid and the Draft Lists rail card) and 39b (pre-op and
post-op events, the preset billing-line types and the Contract add-on lines on the capture screen).
By the roadmap order 14 (the trigger registry and the PWA demo sheet), 15 (Booking vocabulary), 15a
(the warning triangle and the Admin To-do rail card), 19 (the procedure-first picker), 20 (the
anaesthetist's Contract row and `ContractPickerSheet`), 22 (Contract payment setting, office only) and
23 (the per-Contract multi-procedure rule) have also run. The capture and review screens are settled
by now, which is why this phase sits late.
**Estimated:** 1 session. Two halves of similar size. If it runs long, stop green after work item 5
(the sweep and its guard test) and do the help (items 6 to 11) in a second session.

## Goal

US-15.0.1 is graded **Contradicts** in the gap analysis for two reasons, and this phase closes both.

- **The anaesthetist's world stays simple.** At plan time the shared capture block drew a route chip
  ("Hospital / contract holder", "Insurer (direct claim)"), the Contract name, the insurer and the
  billable party on the anaesthetist's own Booking, and the add-billing-line sheet talked about
  "Method 3" and "the individually arranged hourly rate". Phases 18 to 39b have since reshaped every
  one of those surfaces; Phase 20 built the anaesthetist's Contract row to the rule (plain name, teal
  "Change"), and later phases each kept their own office detail office-only. This phase **sweeps every
  anaesthetist-facing screen on mobile, web and the PWA** for what is left: no pricing basis, no rate
  or "FIXED CONTRACT PRICE" label, no holder or "Bills ..." line, no category, no payment setting or
  split share, no multi-procedure rule wording, no route words. The anaesthetist sees the Contract by
  its plain name with Phase 20's "Change", and the office keeps the full detail. (The gap analysis's
  WRONG bullet lists the Contract name too; FT-03.4 and US-03.4.1 make the Contract visible to the
  anaesthetist and changeable by them, so the name stays and only the complexity goes.) One viewer-aware
  display helper decides what each viewer sees, and one render-scan test makes the rule hold for every
  later change.
- **Help at the point of need.** There is no help affordance anywhere today (only a few native `title`
  tooltips). This phase adds **one shared `InfoTip`** in the design's own patterns: a small info glyph
  beside a section label that opens a short explanation, as a bottom sheet on the phone and an
  anchored popover on desktop. All copy lives in **one topic file**. Tips sit on the three operational
  screens US-15.0.1 names through its images and its "used every day" sentence: **mobile Booking
  capture** (so the anaesthetist web app's shared capture gets them too), **the Admin Day view** and
  **Admin Review**. Each app also gets **one first-run hint**: a calm inline card, not a modal, that
  says where to start and that the info glyph explains a heading. A dismissal is kept per browser, like
  the PWA's install coaching, and Reset or the "Show first-run hints again" demo action brings the hints
  back.

No domain state changes: the sweep is presentation, the help is copy and UI, and a dismissed hint is a
per-viewer browser convenience. `PERSIST_VERSION` does not move. Training per user group and short
standalone documentation stay presenter-narrated.

## Before you start: drift check

1. Run the catalogue diff since the plan's baseline:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the hunks for US-15.0.1, US-15.0.2, FT-03.4, US-03.4.1, US-11.2.2, US-04.2.2, FT-13.7,
   US-13.7.1 to US-13.7.3, US-13.1.1, FT-01.6, US-07.2.2 and EP-15, any new note that cites
   US-15.0.1, and the domain-model lines on what the anaesthetist sees of a Contract. At plan time
   US-15.0.1 was **Proposed** with no acceptance criteria and no linked OQ; FT-13.7 and FT-01.6 were
   **Verify**; US-11.2.2 was **Open**.
2. If an item changed, re-read it in full and adjust the work items. Specifically:
   - **US-15.0.1 gains acceptance criteria** (a named screen list, a help centre, a searchable manual,
     guided tours, or a training mode): build only what fits one session inside the three screens and
     the first-run hint, and tell the owner what is left, rather than growing the phase.
   - **The anaesthetist may see more of the Contract** (for example the catalogue now says they see the
     price basis or the holder): keep the helper (work item 2) and the scan (work item 5), and move the
     newly allowed fields from the office list to the anaesthetist list in one place. Record it.
   - **US-03.4.1 now takes the Contract change away from the anaesthetist:** stop and tell the owner.
     Removing Phase 20's "Change" is that phase's rule, not a display sweep.
   - **US-11.2.2 answered** so that only the office sets the billable party: the anaesthetist's Billing
     block becomes read only. Hide its edit link for the anaesthetist here (one line, through the
     store's existing refusal) and record it.
3. If US-15.0.1 is now Retired or Future, stop and tell the owner; the phase has nothing else to do.
   If only a context item is Retired or Future, drop the tip that explains it.
4. **Open questions: none block this phase.** The help copy is the risk. A tip never states as settled
   anything still open. At plan time the copy in work item 7 avoids:
   - the names of the Slot status values (OQ-64 part 4; the tips say "unavailable" and "free", the
     words the design already draws). OQ-17 and OQ-27 are answered (a Slot holds an availability
     status or a List; an unavailable anaesthetist's Lists become Draft Lists), but OQ-64 still asks
     whether they become Draft Lists or stay theirs with a conflict (part 3) and what "Draft List" is
     called (part 5). Phase 31 built the recommendation (note point 52), so `day.draftLists` says it
     and carries `provisional` with OQ-64;
   - a Booking without an NHI (D11, OQ-49, Open; no tip mentions it);
   - who a Contract belongs to (OQ-67) and the BCTI count (OQ-60 and the ROADMAP's BCTI granularity);
   - where base units come from (OQ-62, disputed; the tip says "come with the procedure", which holds
     either way);
   - who sets the billable party (OQ-67 asks whether the per-Booking override stays; the Contract tip
     says the Contract sets who is invoiced "by default", which holds either way).

   Re-read OQ-17, OQ-27, OQ-62, OQ-64, OQ-67 and OQ-49 in the diff. If one is answered, the copy may
   say more; if a topic must touch an open point, it carries `provisional` (work item 6) and shows the
   small neutral "Provisional" pill with the OQ in its tooltip, as earlier phases do.
5. **Prerequisite names.** Confirm 21, 24, 31 and 39b are DONE in PROGRESS.md and read their entries,
   name maps and handoff notes, and the entries for 15, 15a, 19, 20, 22 and 23. Note in particular:
   - **15:** the Booking detail body and route names (`CardDetailBody`, `CardDetailScreen`,
     `CardDetailView` before it) and the `/mobile/lists/:listId/bookings/:bookingId` route;
   - **15a:** the triangle component, the Booking's warnings section if it has one, the To-do rail
     card (`WarningsToDo`, `data-shot="admin-warnings-todo"`) and the "Submit anyway" confirm;
   - **19:** the procedure-first picker and how the base units show on capture;
   - **20:** the anaesthetist's Contract row in `BtmCaptureBlock`, the `ContractPickerSheet` row
     variants by viewer, the "Changed by you · office to check" pill, the List row Contract caption,
     and any viewer-aware helper it already built (extend it in work item 2, do not add a second);
   - **21:** the Billing block rows ("Invoice to", "Invoice email", required inputs), its "Default:
     Contract holder" wording, `BillablePartySheet`, the schedule-miss flag ("To confirm with the
     hospital", read only for the anaesthetist), and Review's Contract column and approval;
   - **22:** that the payment setting and split share are office only, and where they render;
   - **23:** the wording of the per-Contract multi-procedure rule on the capture block (its handoff:
     "43a keeps the Contract rule wording off the anaesthetist screens if it simplifies them");
   - **24:** `AdjustmentCard` and its captions, the office override, and Review's two price layers;
   - **31:** `DraftListBand.tsx` (`data-shot="daygrid-draft-band"`), the Draft Lists rail card
     (`data-shot="admin-draft-lists-rail"`) and its handoff ("point-of-need help on Admin Day should
     explain the Draft Lists card and band");
   - **39b:** the event sheet, the preset line types, and how Contract add-on lines are offered to the
     anaesthetist;
   - **14:** the registry entry shape (`DemoTrigger` in `src/shared/demoTriggers/types.ts`), route
     matching, and `PwaDemoActions`.
   - **26, 27, 32 and 38a** (for the inventory only): the profile and prepaid tick list, the
     prepayment warning on the Booking, the move-List sheet, and the calendar and search result rows.
6. Note the current `PERSIST_VERSION`. This phase must not change it.

## Reference

**Design files (convention 17):**

- `docs/design/Design Language.dc.html`: tokens. Teal `#0D6E63` is the only action colour (the tip
  glyph when focused or open, "Got it"); crimson never appears in a tip or hint. The micro-caps section
  label (11px, 600, 0.06em, mist) is where a tip sits. Radius `card` (14) and elevation e-2 for the
  desktop popover; e-1 and `accent.tint` for the inline first-run card; `sheet-in` motion for the
  mobile sheet; 80ms fades under reduced motion.
- `docs/design/Mobile App.dc.html`: screen 3 (Booking capture: the white capture cards and their
  micro-caps labels, the stepper rows, the docked Mark complete) and the Forward Lists header, where the
  mobile first-run card sits under the greeting.
- `docs/design/Admin Day.dc.html`: the day header, the status legend chips over the grid and the right
  rail cards. The Admin first-run card sits between the day header and the grid.
- `docs/design/Admin Review.dc.html`: the summary tiles, the table header row and the action bar.
- `docs/design/Web Dashboard.dc.html`: the greeting block, where the web first-run card sits.
- No mockup draws a tip, popover or onboarding card. Extend the section-label row, the rail card and
  the bottom sheet; do not invent new chrome (no coach marks, no spotlight scrim, no tour).

**Catalogue items:** the covered and context files above, and US-15.0.1's two images.

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: the EP-15 section's US-15.0.1 row (Contradicts,
  corrected from Partial) and Summary theme 11's mention of it.
- `docs/prototype-build/catch-up/epics/EP-15.md`: the US-15.0.1 entry (the "WRONG" and "MISSING"
  bullets and the evidence lines).
- `analysis/prototype-map-apps-mobile-web.md` (Booking detail, capture block, List rows),
  `analysis/prototype-map-shared.md` (the capture components, the surface seam and the flows),
  `analysis/prototype-map-admin.md` (Day view, Review) and `analysis/prototype-map-shell-demo-pwa.md`
  (the harness bar, Reset, the PWA panel and install coaching).

**Code entry points** (paths under `aa-prototype/src/`; line numbers from 501b0b8, pre-15 names in
brackets; phases 14 to 39b will have moved them):

- Contract display on anaesthetist screens:
  - `shared/capture/BtmCaptureBlock.tsx`: `ROUTE_LABEL` (17), `CONTEXT_FIELDS` (24), the context parts
    (contract, insurer, billable party, reference, 111 to 117), the read-only context line
    (`data-shot="procedure-contract"`, 186 to 206), and the additional-procedure note (209), which 23
    replaced with its multi-procedure rule wording.
  - `shared/card/CardDetailBody.tsx` (`BookingDetailBody`): `showCardTotal` (134, office only), the
    rate labels "FIXED CONTRACT PRICE" and "FEE @ $x/UNIT" (218 to 221, computed for every viewer, shown
    only through the office's `CardTotal`), `OfficeBillingSetup` (683, office only).
    `shared/capture/CardTotalPanel.tsx` (`rateLabel` 89 to 101) and `shared/surface/context.ts`
    (`CardTotalProps.rateLabel`).
  - `shared/capture/AddBillingLineSheet.tsx`: "Hours × the individually arranged hourly rate (Method 3)."
    (93) and "Enter the hours and the agreed hourly rate." (125); 39b has reworked this sheet.
  - `shared/flows/EditProcedureSheet.tsx` (route and insurer options, 18 and 70 to 82) and
    `shared/flows/ManualCardForm.tsx` (`ManualBookingForm`; 43, 208 to 220): Phase 20 removed the route
    and insurer controls; confirm nothing is left.
  - `shared/flows/EditBillingSetupSheet.tsx` and `shared/flows/FunderAllocationSheet.tsx`: office only
    (22 removed the funder allocation); check neither is reachable with an anaesthetist actor.
  - Mobile `apps/mobile/screens/ListDetailScreen.tsx`, `CardDetailScreen.tsx`
    (`BookingDetailScreen`), `BalancesScreen.tsx`; web `apps/web/screens/ListDetailView.tsx`,
    `CardDetailView.tsx` (`BookingDetailView`), `AccountsScreen.tsx`, `DashboardScreen.tsx`.
  - Guards to copy the style of: `apps/moneyViewPurity.test.ts` (a source scan over
    `src/apps/mobile` and `src/apps/web`) and `pwa/pwaPurity.test.ts`.
- Help anchors:
  - `shared/capture/ui.tsx`: `CaptureSection` (17; the micro-caps label row is where a capture tip
    goes) and `Caption` (156). `TimesCard.tsx` (`label="Times"`, 75), `UnitsCard.tsx`
    (`label="Units"`, 54), `ProcedureCodeCard.tsx`, and 20's Contract row, 24's `AdjustmentCard` and
    39b's events card wherever they now sit.
  - Admin Day: `apps/admin/routes.tsx` (`AdminDayRoute`, which renders `DayNav`, `DayGrid` and
    `RightRail`), `apps/admin/components/DayNav.tsx` (the day header), `DayGrid.tsx` (the
    `StatusLegend variant="chips"` at 213; the conflict `title` tooltip at 321), `RightRail.tsx`
    (`RightRail` 26, `MiniCalendar` 48, then 15a's To-do and 31's Draft Lists cards), 31's
    `DraftListBand.tsx`; `shared/StatusLegend.tsx` (its native `title`s at 51 and 85).
  - Admin Review: `apps/admin/screens/ReviewScreen.tsx` (header 164, the summary `Tile`s 229 to 232,
    the table headings 244, which 20 and 21 reshaped, the action bar and its "Authorise for billing",
    the authorise confirm copy 330).
  - First-run hint seats: `apps/mobile/screens/ForwardListsScreen.tsx` (`MobileHeader` 176),
    `apps/web/screens/DashboardScreen.tsx` (the greeting `h1`, 146), `AdminDayRoute` (between `DayNav`
    and the grid).
- Per-viewer dismissal, the pattern to copy: `pwa/installPrompt.ts` (`COACH_DISMISS_KEY` 145,
  `wasCoachDismissed`, `rememberCoachDismissed`, `clearInstallCoachDismissal` 168, all wrapped in
  try/catch), `pwa/InstallCoach.tsx`, and the two Reset paths that clear it or should:
  `pwa/PwaDemoPanel.tsx` (`ResetCard`, 282) and `shell/DemoResetButton.tsx` (`confirmReset`, 41).
- Surface: `shared/surface/context.ts` (`Surface.variant`, `Overlay`) and `SurfaceProvider.tsx`
  (mobile `Overlay` is `BottomSheet`, web is the centred `Dialog`); `shared/ui/index.ts` and
  `shared/index.ts` (the component barrels).
- Demo triggers: `shared/demoTriggers/registry.ts`, `types.ts`, `match.ts` (14), `shell/DemoActionsMenu.tsx`,
  `pwa/PwaDemoActions.tsx`.
- Tests and shots: `pwa/pwaPurity.test.ts`, `domain/domainPurity.test.ts`, `playwright.config.ts`
  (two projects, `prototype` on 5173 and `pwa-device` on 5174), `visual/mobile-interactions.spec.ts`,
  `visual/mobile-insets.spec.ts`, `visual/pwa-device.spec.ts`, `visual/screens.spec.ts`, and 15a's
  `visual/warnings.spec.ts`.

## Work items

The sweep first, guarded by its test, then the help. Keep `npm run build`, `npm run build:pwa` and
`npx vitest run` green after each group.

### Simple anaesthetist screens

1. **Inventory.** Before changing anything, list every component an anaesthetist actor can render on
   mobile, web and the PWA: the Booking detail body and its capture block, every sheet reachable from
   it (procedure picker, Contract picker, billable party, add billing line, events, adjustment, submit,
   cancel, photo), the List detail and List rows, the add-Booking form, 32's move-List sheet, 38a's
   calendar and search result rows, 26's profile and prepaid tick list, 27's prepayment warning on the
   Booking, the PWA's demo sheet results (21's "Office approves this Contract change"), Dashboard,
   Lists, Accounts and Balances. For each, note any text or control that shows Contract complexity. Record the list in the
   PROGRESS entry; it is the reviewers' checklist.

   **Allowed on anaesthetist screens:** the Contract's plain name; its AA code in the picker rows (the
   key Phase 20 built the search on, US-04.1.4) and 20's holder-code match caption ("HNZCATall ·
   Cataract, all"); Phase 20's "Change" and its "Changed by you · office to check" pill, and 21's
   "Approved by the office"; who the invoice goes to and its email (21's Billing block, which US-11.2.2 lets the
   anaesthetist set); a required input asked for in plain words ("{Contract} needs a claim reference.");
   the read-only "To confirm with the hospital" flag; 24's "Price adjustment" where the Contract allows
   it, without saying why it is or is not offered; amounts the anaesthetist types themselves (24's
   fixed final price, a typed fixed-fee event or amount line in 39b), never a computed one.

   **Not allowed:** pricing basis words ("RVG units at your rate", "Agreed rate", "Fixed price list",
   "Hourly rate") and any rate or unit-price label ("FIXED CONTRACT PRICE", "FEE @ $x/UNIT", "per
   unit"); the Contract's category; "Contract holder", "Bills {holder}", "Billed to {payer}" as a
   Contract attribute; the payment setting (FULL or SPLIT) and any split share; the multi-procedure
   rule (3/2/2, "second procedure at 50%" and similar); "allows adjustment"; fee-schedule lines, time
   bands and add-on prices; route words ("Route", "direct claim", "Insurer (direct claim)"); "Method 3"
   or "individually arranged".

2. **One viewer-aware display helper** (`src/shared/contractDisplay.ts`, pure TypeScript, no React, no
   store import, PWA-safe; or extend the helper Phase 20 built if it has one):
   - `contractLineFor(viewer: 'anaesthetist' | 'office', contract, extras)` returns the parts to draw:
     for the anaesthetist `{ name }` only; for the office `{ name, aaCode, basisLabel, holderLabel,
     categoryLabel }` from the label maps 18, 20 and 22 own (import them, never retype them).
   - `contractPickerRowFor(viewer, contract, match)` returns 20's row parts the same way (anaesthetist:
     name, AA code and a holder-code match caption; office: those plus category pill, basis and holder).
   - `rateLabelFor(fee)` moves the "FIXED CONTRACT PRICE" and "FEE @ $x/UNIT" builder out of the Booking
     detail body, so it is called only on the office's total (work item 3).
   - The viewer comes from `actor.role` (`'office'` is office; everything else, `'system'` included,
     is the anaesthetist view, so an unexpected actor fails closed). The Booking detail body's
     `showCardTotal` (today `actor.role !== 'anaesthetist'`) moves to the same rule. No other place in mobile, web or shared capture code branches on role to decide Contract
     detail.
   - Vitest (`contractDisplay.test.ts`): every Contract kind the seed and the fixtures hold gives the
     anaesthetist exactly `{ name }`; the office gets the full set; deterministic.
3. **Apply it** (fix what the inventory found; at plan time these were the known spots, and 20 to 39b
   will have fixed some):
   - `BtmCaptureBlock`: the anaesthetist's line is the Contract chip, 20's "Change" on a DRAFT List,
     the pending-change pill and the billing reference; nothing else. Delete `ROUTE_LABEL` and any
     insurer or billable-party part still in the line (21 moved the party to the Billing block). The
     office's line comes from the helper.
   - The Booking detail body: compute the rate label only inside the office branch (`showCardTotal`),
     through `rateLabelFor`. At plan time the label was already drawn only on the office's
     `CardTotal`, so the anaesthetist never saw it; this makes it office-only by construction, so a later
     change cannot leak it.
   - The capture block's multi-procedure wording (23): the anaesthetist sees one neutral line, "Second
     procedure. Record its times; the office works out the fee." (or "Third", by ordinal). The office
     keeps 23's rule wording.
   - `AddBillingLineSheet` and 39b's events sheet: for the anaesthetist, line types by plain name only
     ("Post-op review", "Nerve catheter", "Pain consult", "Transport", and any Contract add-on by its
     line name), with no rate basis, no Contract name and no "Method" wording. If an amount is entered
     by the anaesthetist, the field is "Amount $" with no Contract context. The rate x time line 39b
     kept (offered only where the Contract permits it) reads "Hours × rate" with fields "Hours" and
     "Rate $ per hour", and says nothing about why it is or is not offered (the gate message and its
     "individually arranged" wording stay office-facing). The office keeps the detail.
   - 21's Billing block: on anaesthetist views "Default: Contract holder" reads "Default"; "Set by
     {who}" stays. The office keeps "Default: Contract holder".
   - 24's `AdjustmentCard`: no caption names the Contract's rule; when the Contract does not allow an
     adjustment the card renders nothing (as 24 built). A refusal message shown to an anaesthetist that
     names the rule ("{Contract} does not allow an anaesthetist adjustment") cannot occur from the UI;
     leave the store message as it is.
   - `EditProcedureSheet`, the add-Booking form, `ListDetailScreen`, `ListDetailView`, the List row
     caption (20), Dashboard, Lists, Accounts and Balances: fix any item the inventory found.
   - `EditBillingSetupSheet`, `OfficeBillingSetup` and the split-share control (22): confirm each is
     mounted only for an office actor.
4. **No copy with a dash** in anything touched; keep "·", commas or "to".
5. **The guard test** (`src/apps/anaesthetistSimplicity.test.tsx`), the rule's one enforcement point:
   - **Render scan.** For an anaesthetist actor (Dr Souter), inside the mobile and then the web
     `SurfaceProvider`, render the Booking detail for a set of Bookings that between them cover every
     Contract kind: an RVG Default Hospital Contract, a fixed-schedule Contract, an hourly or individual
     arrangement, ACC, an insurer Contract, a combination Contract (23), a SPLIT payment setting (22), an
     adjustment-allowed Contract with an adjustment stored (24), a schedule miss (21), and a Booking with
     a pre-op and a post-op event (39b). Use seeded Bookings where they exist and build the rest in the
     test with the billing fixtures (`domain/billing/fixtures.ts`: `mkContract`, `mkProcedure`,
     `mkBooking` after 15) over a test-local store state, never in the seed. Render each on a DRAFT and on a SUBMITTED
     List. Also open the Contract picker, the billable-party sheet, the add-billing-line sheet and the
     events sheet, and render List detail and the List rows for those Lists.
   - **Forbidden text** is built from the office label constants themselves (pricing-basis labels,
     category labels, payment-setting labels, `rateLabelFor` over a fixed fee and a unit-rate fee, the
     holder line builder), plus a short literal list: "FIXED CONTRACT PRICE", "/UNIT", "per unit",
     "Contract holder", "Bills ", "Method 3", "individually arranged", "direct claim", "Route". The scan
     reads `textContent` and every `aria-label` and `title`.
   - **Positive control.** The same renders for the office actor contain the pricing basis and the
     holder for at least one Booking, so the scan cannot pass by rendering nothing.
   - **Source scan** (in the style of `moneyViewPurity.test.ts`): no file under `src/apps/mobile` or
     `src/apps/web` imports `OfficeBillingSetup`, `EditBillingSetupSheet`, the split-share control or
     the office label maps.

### Point-of-need help

6. **One topic file** (`src/shared/help/helpTopics.ts`, pure TypeScript, PWA-safe):
   - `type HelpTopicId` is a string union; `HELP_TOPICS: Record<HelpTopicId, HelpTopic>` where
     `HelpTopic = { title: string; body: readonly string[]; provisional?: { oq: string; note: string } }`.
     The body is one to three short sentences per paragraph and at most 60 words in all.
   - All help copy in the app lives here, so a later screen change keeps its tip by keeping the topic
     id, and an answered OQ changes one entry.
   - Vitest (`helpTopics.test.ts`): no en or em dash in any title or body; every body at most 60 words;
     every `provisional.oq` matches `OQ-\d+`; every id used by a component exists (a typed union makes
     this a compile error; the test checks the reverse, that no topic is unused).
7. **The topics** (copy verbatim unless the drift check changed a rule; each must match what phases 15a
   to 39b actually built, so re-read the screen before keeping a sentence):

   | id | Where | Title | Body |
   |---|---|---|---|
   | `capture.procedure` | Booking capture, the procedure card (19) | Procedure | "Pick the procedure first. Its code and base units come with it. If the base units look wrong, change them. A value outside the code's range gives the office a warning to check after the procedure." |
   | `capture.contract` | Booking capture, 20's Contract row | Contract | "The Contract sets who is invoiced by default and how the fee is worked out. The office sets it up, so it is usually right already. Change it only if this patient is covered differently. The office checks every change." |
   | `capture.times` | `TimesCard` | Times | "Tap Start now when the anaesthetic starts and Finish now at handover. You can nudge either time afterwards. Time units come from these two times." |
   | `capture.units` | `UnitsCard` | Units | "Record the base, time and modifier units here. The office works out the fee from them and the Contract, so this screen does not show it." (the same on the web anaesthetist app; neither shows a computed fee) |
   | `capture.warnings` | Booking capture, 15a's triangle or warnings section | Warnings | "A warning is a reminder, never a block. You can still complete and submit; a Booking with a warning asks you to confirm once. The office sees its warnings on its to-do list." |
   | `day.statuses` | Admin Day, beside the status legend | Reading the day | "Each row is one anaesthetist's day: a morning and an afternoon session. A session shows its List, or its availability when it has none. The colour shows the status and the label says it too. Hatched means unavailable; a dashed outline means free. Select a status above the grid to hide or show it." |
   | `day.draftLists` | Admin Day, 31's band and the Draft Lists rail card | Draft Lists | "A Draft List has a hospital, surgeon, day and session, but no anaesthetist yet. Assign it to a free session. A List comes back here when its anaesthetist hands it back or becomes unavailable." `provisional`: OQ-64, "Whether an unavailable anaesthetist's Lists become Draft Lists, and what they are called, is still to confirm." |
   | `day.todo` | Admin Day, 15a's To-do rail card | To-do | "Every open warning lands here. None of them blocks anything. Open one to see the Booking, and Clear it once it is dealt with. Clearing a mild warning is optional." |
   | `review.flags` | Admin Review, the Flags tile | Flags | "Flags are things to check before you authorise. Fix them here, or phone the anaesthetist. A List is never sent back." |
   | `review.contracts` | Admin Review, 21's Contract column heading | Contracts | "Every procedure needs a Contract you have approved. A Contract the anaesthetist changed is marked so you can check it. Authorising approves any still open." |
   | `review.price` | Admin Review, 24's price layers (the Fee heading) | How the fee is worked out | "The fee starts from the Contract: units at a rate, or a fixed price. An anaesthetist adjustment comes next, only where the Contract allows one. Your override comes last and always wins." |
   | `review.authorise` | Admin Review, the action bar beside "Authorise for billing" | Authorising | "Authorising locks the List and its Bookings and raises the invoices. After that, a correction is a credit and a new invoice." |

   Keep the list at about a dozen. Do not add tips to other screens in this phase. If a sentence
   depends on an open point after the drift check, give the topic `provisional` and show the pill.
8. **`InfoTip`** (`src/shared/help/InfoTip.tsx`, exported from `src/shared/index.ts`; PWA-safe):
   - Props: `topic: HelpTopicId`, optional `placement` hint for the popover. It reads `useSurface()`.
   - **Trigger:** a `button` with lucide `Info` at 16px in `neutral.mist`, teal (`accent.base`) on
     hover, focus and while open; `aria-label="About {title}"`, `aria-expanded`, `aria-controls`;
     `data-shot="info-tip-{topic id with dots as dashes}"`. On mobile the hit area is 44 by 44 with
     the glyph centred, made with padding and a balancing negative margin so the label row does not
     grow; it must never overlap another control (tested in work item 11). On desktop the hit area is
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
9. **Place the tips** (work item 7's table):
   - `CaptureSection` gains an optional `help?: HelpTopicId`, drawn at the right end of its micro-caps
     label row. Times, Units and the procedure card pass theirs; 20's Contract row, 15a's warnings and
     any other capture element that is not a `CaptureSection` places `InfoTip` beside its own label.
     Because the capture block is shared, the anaesthetist web app gets the same tips; the office's
     view of the same block gets them too, which is fine.
   - Admin Day: beside the `StatusLegend` chips in `DayGrid`, in 31's band label and the Draft Lists
     rail card heading (one topic, two places), and in 15a's To-do card heading.
   - Admin Review: in the Flags tile label, the Contract column heading, the Fee column heading (or
     wherever 24 shows the two price layers) and beside "Authorise for billing" in the action bar.
   - Nothing else on these screens moves; tips add no rows and no new cards.
10. **First-run hints** (`src/shared/help/firstRunHints.ts` and `src/shared/help/FirstRunHint.tsx`):
    - `firstRunHints.ts` (no React; PWA-safe): `type HintApp = 'mobile' | 'web' | 'admin'`; keys
      `aa-first-run-hint-mobile`, `-web` and `-admin` beside the existing `aa-*` keys; a tiny
      non-persisted zustand store (like Phase 14's `memory.ts`) mirroring `{ dismissed: Record<HintApp,
      boolean> }`, read from `localStorage` once and written through on change, every access wrapped in
      try/catch so a blocked storage shows the hint and never throws; `dismissHint(app)`,
      `clearFirstRunHintDismissals()` and `anyHintDismissed()`. It is per-viewer browser state, never
      in `AppState`, never audited, and `PERSIST_VERSION` does not move.
    - `FirstRunHint({ app })`: an inline card in page flow (never a modal, never a scrim, nothing
      positioned over other content), radius `card`, `accent.tint` fill, e-1, a 20px `Info` glyph in
      teal, a title, one or two lines, and a teal text button "Got it" that calls `dismissHint`.
      `data-shot="first-run-hint-{app}"`. Copy:
      - **Mobile** (under the `MobileHeader` greeting on Lists; the PWA shows the same): title
        "Welcome to your Lists"; body "Tap a List to see its Bookings, then a Booking to capture it.
        Tap the info sign beside a heading for a short explanation."
      - **Web** (under the Dashboard greeting): title "Welcome"; body "Your week is here, and Lists
        holds every List and Booking. Select the info sign beside a heading for a short explanation."
      - **Admin** (between `DayNav` and the grid on the Day view): title "The day at a glance"; body
        "Every anaesthetist's two sessions, Draft Lists waiting for one, and your to-do list on the
        right. Select the info sign beside a heading for a short explanation."
    - Both Reset paths clear the dismissals, beside `clearInstallCoachDismissal`:
      `DemoResetButton`'s `confirmReset` and `PwaDemoPanel`'s `ResetCard`. The scenario jumps go
      through the same reset and so clear them too.
    - On mobile the card respects the insets and `DockSpacer`; it never pushes the tab bar.
    - Vitest (`firstRunHints.test.ts`): dismiss persists across a fresh store over the same storage;
      clear restores all three; a throwing `localStorage` leaves every hint showing and no exception.
11. **Tests and shots.**
    - **Keep existing specs as they were.** In `playwright.config.ts`, give both projects a
      `storageState` file (`visual/storage/hints-dismissed.json`, with the three keys set for the 5173
      and 5174 origins), so no existing spec sees a first-run card and no flow or screenshot moves. The
      new spec opts out with `test.use({ storageState: { cookies: [], origins: [] } })`.
    - New `visual/ease-of-use.spec.ts` (prototype project):
      - fresh storage: the Admin Day, web Dashboard and mobile Lists show their hint; "Got it" hides
        it and it stays hidden after a reload;
      - "Show first-run hints again" in Demo actions brings them back;
      - mobile Booking capture: tap `info-tip-capture-units`, the sheet opens with the Units copy, "Got
        it" closes it (`data-shot` captures for the guide);
      - Admin Day: the `day-statuses` popover opens beside the legend; Esc closes it and focus returns;
      - Admin Review: the `review-contracts` popover renders whole inside the viewport although the
        table scrolls horizontally;
      - **touch targets:** on mobile capture, for every `[data-shot^="info-tip-"]`, the four corners of
        its 44px box resolve through `document.elementFromPoint` to the tip itself, and the tip's box
        does not intersect any other `button`, `a`, `input` or `[role="button"]`.
    - `visual/pwa-device.spec.ts`: with fresh storage, the mobile hint on Lists clears the insets and
      the dock floor; the Demo chip on Lists offers "Show first-run hints again".
    - Component tests: `CaptureSection` with and without `help`; `FirstRunHint` dismiss; the Review and
      Day placements render their tips.
    - `pwaPurity.test.ts` holds (`src/shared/help/` sits in the PWA closure and imports nothing from
      apps or shell).

### Demo trigger

12. **"Show first-run hints again"** (register in `src/shared/demoTriggers/registry.ts`):
    - `id: 'show-first-run-hints'`, label "Show first-run hints again", description "Brings back the
      welcome card on Mobile, Web and Admin, as for a first visit.", screen "All apps", routes
      `/mobile/*`, `/web/*` and `/admin/*`, surfaces `['bar', 'pwa']`.
    - `run` calls `clearFirstRunHintDismissals()` (the body is in `src/shared/help`, PWA-safe) and
      returns `{ ok: true, message: 'The welcome cards will show again.' }`; it touches no domain state.
    - `disabledReason` is "No welcome card has been dismissed" while `anyHintDismissed()` is false.
    - `indexPath: () => '/admin'` (14's shape is a function of state) so the Control Panel index can
      open a screen that shows a hint.
    - The hint store is not `AppState`, so the harness bar's Demo actions menu and `PwaDemoActions`
      must re-evaluate `disabledReason` when it changes (subscribe to the hint store, or compute on
      open); otherwise "Got it" leaves the entry disabled until the next route change.
    - Vitest in the registry's tests: visible on a mobile, web and admin route and on the PWA surface;
      disabled until a hint is dismissed; running it clears all three.

## Demo triggers

| Trigger | Screen | Surfaces | What it does |
|---|---|---|---|
| Show first-run hints again | Every Mobile, Web and Admin route | Harness bar and PWA demo sheet | Clears the three per-browser dismissals so each app's welcome card shows again. Disabled with "No welcome card has been dismissed". |

Everything else is demoable through normal use: the tips are product UI on the screens they explain,
and the hints show on any fresh browser and after Reset. Nothing waits on the office, a colleague or a
backend event, so there is no PWA stand-in beyond the trigger's PWA surface. The Control Panel page
gains nothing; Phase 14's index lists the trigger under its screen.

## Out of scope

- Training per user group and short standalone documentation (presenter-narrated, as US-15.0.1's
  technical discussion describes them).
- A help centre, a searchable manual, a per-app Help page, guided tours, coach marks or a spotlight
  overlay, and any AI assistant.
- Tips on any screen other than Booking capture, Admin Day and Admin Review (Lists, Availability,
  Accounts, Invoices, Billing monitor, Masters, Intake). A later phase adds a topic and a `help` prop if
  AA asks.
- Rewording the office's own Contract detail, the Contract editor, or Review's columns beyond placing
  tips.
- Removing the anaesthetist's Contract "Change" (US-03.4.1, Phase 20's rule) or the billable-party
  override (US-11.2.2, Phase 21's).
- Any computed fee on the anaesthetist's Booking screens (Phase 24's and 39b's ruling: the only
  amounts are the ones the anaesthetist types, such as a fixed final price or a typed fixed fee; this
  phase keeps it that way) and any change to web Accounts beyond the sweep.
- Localisation, te reo Māori copy beyond the existing greeting, and accessibility work beyond the new
  components (a full audit is not in scope).
- The S1 to S5 rewrite (Phase 44).

## Manual test checklist

- [ ] Reset. Mobile → Lists: the "Welcome to your Lists" card sits under the greeting; "Got it" hides
      it; a reload keeps it hidden. Web Dashboard and Admin Day show their own card the same way.
- [ ] Demo actions → "Show first-run hints again": all three cards come back. With none dismissed, the
      entry is disabled with its reason.
- [ ] Mobile → Souter Tue 28 Jul St George's AM → Sarah Mitchell: the Contract line shows "St George's
      RVG Default Hospital" (20's name) and "Change", nothing else; no route, insurer, holder, basis or rate anywhere on the
      Booking, its sheets or the List.
- [ ] Open the Contract picker as the anaesthetist: each row is a name and its AA code; type a holder
      code and the match caption shows. Open the same picker in Admin: category pill, basis and "Bills
      ..." are there.
- [ ] Add a second procedure on mobile: the note reads "Second procedure. Record its times; the office
      works out the fee." Admin's view of the same Booking shows 23's rule wording.
- [ ] Add a billing line and a post-op event on mobile: line types by plain name, no "Method" or rate
      wording. The Billing block reads "Default", not "Default: Contract holder".
- [ ] On capture, tap the info sign on Procedure, Contract, Times, Units and Warnings: each opens a
      bottom sheet with its copy and "Got it"; none is a centred modal; each tip is easy to hit without
      touching a stepper or chip.
- [ ] Web → the same Booking: the same tips open as popovers; Esc closes and returns focus.
- [ ] Admin Day Tue 21 Jul: the tips beside the legend, on the Draft Lists band and rail card, and on
      the To-do card open popovers that stay on screen at 1280px and 1440px. The Draft Lists tip
      carries the Provisional pill with OQ-64 in its tooltip; no other Day tip does.
- [ ] Admin Review (Dr Morrison, Mon 20 Jul): the Flags, Contract, Fee and Authorise tips open, and the
      Contract popover is not clipped by the table.
- [ ] PWA (`npm run dev:pwa`, fresh storage): the mobile card clears the insets, the tips open as
      sheets, and the Demo chip offers "Show first-run hints again".
- [ ] Keyboard: every tip is reachable by Tab and opens on Enter or Space; screen-reader names read
      "About {title}".
- [ ] No en or em dashes in any new string; teal the only action colour; no crimson in tips or cards;
      the Provisional pill shows only on a topic marked provisional.
- [ ] Catalogue screenshots: the recipes for US-15.0.1 are created or updated, any recipe this phase broke is re-pointed, the capture runner presets the three first-run dismissals, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `PERSIST_VERSION` unchanged; `npm run build`, `npm run build:pwa`, `npx vitest run`,
      `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch in the same session (`docs/demo-guide/`, the same sections of `master-demo-guide.html`):

- `03-demo-script.md`:
  - **Pre-demo setup:** after Reset the welcome cards show on all three apps. Dismiss them before the
    audience arrives, or leave the mobile one to open S1 with. "Show first-run hints again" in Demo
    actions brings them back.
  - **S1 Beat 3, Worth pointing at:** add "The anaesthetist sees the Contract by name only, with
    Change; the office handles the rest. Tap the info sign on Units for the point-of-need
    explanation." Say: "Help sits on the screen, where it is needed, so the manual stays short."
  - **S2 Beat 1:** after the grid pause, open the tip beside the status legend and, if the band is on
    screen, the Draft Lists tip. Expected: a small popover, closed with Esc.
  - **S2 Beat 4:** optionally open the Contracts tip before authorising. Add a discovery point: "which
    screens AA wants help on next, and whether training per user group is enough".
  - **What to narrate rather than click:** add training per user group before go-live and the short
    standalone guides.
- `04-presenter-cheat-sheet.md`: under "Likely evaluator questions" add "How will people who are not
  comfortable with new systems cope?" (answer: large controls and one clear action, the Contract kept
  off the anaesthetist's screens, help beside each heading on the daily screens, a welcome card, and
  training per group); "Built and clickable" lists the tips and welcome cards; "What each app is for"
  (Anaesthetist Mobile and Web) gains "sees the Contract by name only".
- `02-workflows-and-handoffs.md`: one line in the capture workflow that the office, not the
  anaesthetist, deals with Contract pricing.
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
| [US-15.0.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.1.md) Ease of use | partial · card-capture (mobile Booking capture, C0009) and day-view (admin Day, 21 Jul); both have an empty highlight | partial, with a rewritten reason: the shots show the calm, plain screens and the help, but whether people not comfortable with modern systems find it intuitive needs usability testing, which the prototype has not had (no later phase builds it). Keep both shot names and re-shoot: `card-capture` (mobile, `/mobile/lists/L-34821-2026-07-21-PM/bookings/:bookingId`, Sarah Mitchell or the C0009 Booking) with states `plain-contract` (the Contract line shows only its plain name and "Change", highlight it; no route, insurer, holder or rate) and `tip-open` (tap `[data-shot=info-tip-capture-units]`: the bottom sheet with the Units copy and "Got it"); `day-view` (admin, `/admin/day/2026-07-21`) with states `day` (highlight the grid and to-do list) and `tip-open` (open `info-tip-day-statuses`: the popover beside the legend). Add shots `first-run-hint` for mobile Lists, web Dashboard and Admin Day (`first-run-hint-mobile`, `-web`, `-admin`: the welcome card, reached with the "Show first-run hints again" entry because the capture preset hides it) and `review-tip` (admin `/admin/review/:listId`, the Contract popover whole inside the viewport, `info-tip-review-contracts`). Add a web Booking shot with the same tip as a popover. Captions: "Plain Booking capture", "Help at the point of need", "Welcome card shown on first visit" |

**Recipes this phase breaks.**

- **First-run welcome cards appear in every fresh context.** Each capture state starts from empty browser storage, so the new welcome card shows on mobile Lists (`/mobile/lists`), the web Dashboard and the Admin Day view in the shots of every recipe that opens them. Do what the Playwright specs do: make `requirements-board/scripts/capture.ts` start each context with the three dismissal keys (`aa-first-run-hint-mobile`, `-web`, `-admin`, set as in `visual/storage/hints-dismissed.json`) on both origins, and have the `first-run-hint` states above bring the card back with the "Show first-run hints again" entry. Check one image per app by eye. Roughly seven recipes start on a bare app root or Lists page, and the many `/admin/day/` recipes (about fifty) start on the Day view.
- The Contract row on the anaesthetist's capture block shows the plain name only: recipes that highlight a Contract line or picker on mobile or web (`US-03.4.1` and the Contract recipes under FT-03.4, `US-04.3.x`, `US-11.2.x`, if present) must still resolve; the office view in Admin keeps category, basis and "Bills ...".
- `CaptureSection` gains an info tip in its label row, so recipes selecting by a section label's exact text (for example `text="Times"`) may now match the tip's accessible name too; re-run with `--dry`.
- Work item 11 keeps the existing Playwright specs green with a storage preset; the capture runner needs the same, which is the one non-doc change this step makes outside `aa-prototype/`.

**ATLAS.md.** Update "Gotchas" (the first-run welcome card and the dismissal preset the runner now applies), "Existing hooks" (`info-tip-*`, `first-run-hint-*`) and "Overlays that need clicks" (the info tip as a bottom sheet on mobile and an anchored popover on web and admin).

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**: three independent Opus review subagents, one each for
**quality**, **bugs/correctness** and **plan adherence**, each given US-15.0.1, the context items, this
doc, the work item 1 inventory and the diff. This session verifies every finding against the catalogue,
this doc and the code, fixes the confirmed ones (with a test wherever a bug had none), re-greens and
records the pass. Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **Leaks.** Hunt for any anaesthetist path that still shows Contract complexity: a sheet the inventory
  missed, an `aria-label` or `title`, a refusal message surfaced in the UI, a List row caption, web
  Accounts, the PWA, a SUBMITTED or read-only Booking, a Booking moved from a colleague (32). Check the
  scan covers each and is not vacuous (the office positive control).
- **Office unchanged.** The office still sees every detail it saw before: basis, holder, category,
  payment setting and share, rule wording, rate label.
- **One helper.** No mobile, web or shared capture file decides Contract detail by role outside the
  helper; no label is retyped instead of imported.
- **Help copy is true and humble.** Each topic matches what the screen actually does after 15a to 39b;
  none states as settled an open point (OQ-49, OQ-60, OQ-62, OQ-64, OQ-65, OQ-67, BCTI granularity); provisional
  topics carry the pill; every string is dash-free and within 60 words.
- **Touch and focus.** Mobile tip hit areas are 44px and overlap nothing; the desktop popover is not
  clipped, flips at the edges, closes on Esc and outside click, returns focus, and only one is open; the
  sheet is a bottom sheet; no nested interactive elements (a tip inside a clickable row or `th` button).
- **Hints are per-viewer, not domain.** Nothing in `AppState`, the audit or the persisted payload;
  storage failures are swallowed; Reset and the trigger clear them; existing specs are unaffected
  (the `storageState` preset); the PWA closure is clean.
- **Design.** Teal only for action, no crimson, the design's label row, rail card and sheet anatomy,
  no new chrome, reduced motion respected.

## PROGRESS.md updates

- **Status row** for catch-up Phase 43a, and a phase entry with:
  - the drift-check result (US-15.0.1 changed or not; any OQ answered that changed a tip);
  - the work item 1 inventory and what was fixed in each place;
  - the name map: `contractLineFor`, `contractPickerRowFor` and `rateLabelFor` in
    `src/shared/contractDisplay.ts` (or the 20 helper it extends); `HELP_TOPICS` and `HelpTopicId` in
    `src/shared/help/helpTopics.ts`; `InfoTip`; `CaptureSection`'s `help` prop; `firstRunHints.ts`
    (`dismissHint`, `clearFirstRunHintDismissals`, `anyHintDismissed`, the three storage keys);
    `FirstRunHint`; the `show-first-run-hints` trigger; `anaesthetistSimplicity.test.tsx`;
  - `PERSIST_VERSION` unchanged (state it);
  - tests added and the before and after Vitest and Playwright counts, and the `storageState` preset;
  - the review pass.
- **Catalogue screenshots:** the recipes created or changed (by ID), the `capture/REPORT.md` counts before and after (captured, partial, absent, failed), the recipes this phase broke and how they were re-pointed, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **New:** anaesthetist screens show a Contract by its plain name (and its AA code in the picker),
     with Phase 20's "Change"; pricing basis, category, holder, payment setting, split share, rule
     wording and rate labels are office only. One helper decides it and `anaesthetistSimplicity.test.tsx`
     enforces it (US-15.0.1 Notes, note point 51).
  2. **New:** point-of-need help is one `InfoTip` and one topic file, placed beside section labels on
     Booking capture, Admin Day and Admin Review; a bottom sheet on the phone and an anchored popover on
     desktop. Native `title` tooltips stay as hover extras and are not the help mechanism.
  3. **New:** first-run hints are per-viewer browser storage, like the PWA install coaching: not domain
     state, not audited, no `PERSIST_VERSION` change; Reset and "Show first-run hints again" clear them;
     Playwright presets them dismissed for existing specs.
  4. **Closed:** the Phase 06 reading that "route-setting is office knowledge" with the route chip still
     drawn on the anaesthetist's capture line (superseded by Phase 20's route removal); the line is now
     the Contract name only.
- **Handoff notes:**
  - For **44**: S1 Beat 3 and S2 Beats 1 and 4 now carry optional tip moments and a pre-demo note on
    the welcome cards; keep them in the rewrite and audit the trigger on all three apps and the PWA.
  - For any later phase that adds an operational screen section: give it a topic and pass `help`, and
    add any new anaesthetist-reachable sheet to the simplicity scan.
  - When an OQ named in a tip is answered, update its `HELP_TOPICS` entry and drop `provisional`.
