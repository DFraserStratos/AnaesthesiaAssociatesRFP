# Phase 29 · Availability calendar and status master

**Requirements covered:**
[US-01.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.1.md) Anaesthetist sets half-day availability ·
[US-01.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.2.md) Slot status master data ·
[US-01.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.3.md) Anaesthetist availability calendar (Open) ·
[US-03.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.4.md) Web app parity ·
[US-15.0.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.2.md) Mobile-first for anaesthetists.
Also touches, without closing:
[FT-01.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.2.md) (the feature; Phase 28 closed its "independent of bookings" rule),
[US-01.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.3.md) (closed in 28; this phase must not regress it),
[US-01.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.4.md) (conflict dashboard and clearing; Phase 30),
[DM-04](../analysis/domain-model-delta.md#dm-04) (Slot availability status: this phase delivers its "model the status set as editable master data rather than a union type" clause on top of 28's Slot),
[RV-14](../analysis/reverse-check.md#rv-14-list-status-mixes-availability-with-booking-type-empty-slot-modelled-as-a-list) (28 reworks the model; this phase keeps the vocabulary a labelled simplification).
**Open questions:** [OQ-17](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-17.md) (status vocabulary and colours),
[OQ-27](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-27.md) (is the availability calendar the Slot status, or a separate calendar).
**Depends on:** Phase 28 (the Slot record holds availability and default times, a List has its own id and sits in a Slot, and status no longer derives from bookings). Also Phase 14 (the demo-trigger registry; this phase registers nothing, but its new routes must fit the route matcher) and Phase 17 (the Master data `?view=` param, the `apps/admin/screens/masters/` split and the editable-master sheet pattern). 17 is not a hard dependency in the outline: if it is not DONE, build the editor inside `MasterData.tsx` and add the `?view=` search param the way 17's plan describes (read from and written to the query), so 17 can adopt it.
**Estimated:** 2 sessions. Session 1 is work items 1 to 8 (model, palette, shared status UI, store actions, seed and the Admin status editor) and stops green. Session 2 is items 9 to 15 (the shared availability pieces, the mobile and web calendars, the finders, shots and the demo guide).

## Goal

Today an anaesthetist can mark a session Free or Block, on mobile only, for the next six days only.
There is no "available for emergency", no leave button, no range, and no control at all on the web
app. Pressing Free on a session that already holds a List raises a false conflict ("Marked
available, but this List carries booking context"). The six statuses are a TypeScript union
(`ListStatusKey`, kept identical to the theme's `StatusKey` by a parity test), so adding or renaming
one needs a code change, and the Admin "List statuses" master is view only with no colour.

This phase:

- gives the anaesthetist a **month calendar of their own half-day Slots**, weeks ahead to the
  canvas horizon (four months), on mobile and on web. From it they set a single Slot, both Slots of a
  day, or a date range to **available**, **available for emergency**, **unavailable** or **on
  leave**, with an optional note. The office sees the change on its Day grid at once;
- builds it on the Slot availability Phase 28 introduced (the OQ-27 interim reading, labelled
  provisional): the calendar sets each Slot's availability status, which is independent of any List.
  Where a non-bookable status lands on a Slot that holds a List, the List is flagged for the office,
  never changed. A bookable status over a List raises no conflict, which fixes the false conflict;
- brings the web app to parity: everything the mobile availability screen does, the web app now does
  too, through the same shared form and the same store action (US-03.1.4, US-15.0.2);
- turns the status set into **editable master data**. Admins add, rename, recolour and retire
  statuses without code. Each status has a description and a colour chosen from the design's six
  status colour tokens (never a free hex), plus a fill treatment. The six design statuses are the
  seeded defaults, and "Available for emergency" is seeded as a seventh. Every app's chips, blocks,
  legends and grids read the records, so a rename or recolour shows everywhere immediately.

The design language survives intact: the six palette tokens, the hatched and dashed treatments, and
"colour is never the only signal" all stay in `src/theme/`. What moves is the list of statuses, not
the palette.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.2.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.2.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-03.1.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-15.0.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.2.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.4.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-17.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-27.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   If an item changed, re-read it and adjust the work items before planning. If a covered item is now
   Retired or Future, drop it from this phase and say so in the PROGRESS entry. A new item on the
   same surfaces (for example recurring weekly availability, or leave approval) comes in only if it is
   small and on these screens; otherwise note it for the owner.
2. **OQ-27 (calendar vs Slot status).**
   - **Still open (expected):** build the calendar over Slot availability, as this doc describes.
     Label it provisional in two places: a one-line caption under both calendars ("Provisional: your
     calendar sets the availability of each of your Slots, pending AA's confirmation") and the Admin
     Slot statuses header. No other copy mentions it.
   - **Answered Model A (availability is the Slot status):** same build, drop the provisional caption.
   - **Answered Model B (a separate calendar reconciled against Lists):** stop at the drift check and
     raise it with the owner before planning. It reverses part of Phase 28 (availability moves off the
     Slot into its own calendar) and splits the status master into two tables (availability states,
     and List statuses such as private, public, pre-op, free). The calendar UI, the range action and
     the shared form in this doc survive; the storage and the master do not.
3. **OQ-17 (vocabulary and colours).**
   - **Still open (expected):** seed the six design statuses plus "Available for emergency" as
     described in work item 3, and show a provisional hint in the Admin Slot statuses header
     ("Vocabulary and colours to be confirmed with AA"). Because the set is now master data, a later
     answer is a seed change and a `PERSIST_VERSION` bump, not a code change.
   - **Answered:** seed AA's vocabulary and colour mapping instead, still choosing colours from the
     six design tokens. If AA's list needs a colour the design does not have, do not invent a hex:
     reuse a token (the label always disambiguates) and raise it with the owner for a Design Language
     change.
4. **Baseline.**
   - Confirm Phase 28 is DONE in PROGRESS.md.
   - Read its entry and Decisions-log rows for the names it chose. Phase 28's plan expects, and this
     doc assumes where it says "28's":
     - `Slot` in `schedule.slots` (id `S-<reg>-<date>-<AM|PM>`), with `availability: SlotAvailability`
       (`'available' | 'unavailable' | 'holiday'`) and `note?`;
     - `List.kind: ListKind` (`'private' | 'public' | 'preop'`, `LIST_KINDS`) replacing
       `List.statusKey`, and `PermanentList.kind`;
     - the six-key union renamed `DisplayStatusKey` / `DISPLAY_STATUS_KEYS`, derived by
       `displayStatusKey(slot, list)` in `domain/slots.ts` (an `available` Slot with no List maps to
       `free`), and `isOpenSlot(slot, list)` in the same module;
     - `ListStatus` master rows keyed by `DisplayStatusKey`, with 28's provisional line on the view;
     - `masters.availability` removed, `AVAILABILITY` renamed `SEED_LEAVE` (generator input only);
     - `setAvailability`, `assignListToSlot` (`invalidKind`, `slotNotAvailable`), `moveListToSlot` /
       `reassignList` (`targetNotAvailable`, `vacatedAvailability = 'available'`) and `requestCover`
       (`notFree`) in `store/slotActions.ts`; `slotViewsForDate` and `slotViewsForAnaesthetist` in
       `store/selectors.ts`;
     - the golden canvas fixture test in `seed.test.ts`.
     Use 28's actual names wherever they differ; this doc's code references are as at the snapshot.
   - Check whether 28 already stopped a bookable status from flagging a conflict on a Slot that holds a
     List (its plan says it does, but leaves an earlier availability conflict in place). If it did,
     keep its test; work item 6 still adds the clearing.
   - Note the current `PERSIST_VERSION` in `src/store/appStore.ts` (13 at the snapshot; 14 to 28 will
     have bumped it) and bump it by one from whatever it is now.

## Reference

**Design files (convention 17):**
- `docs/design/Design Language.dc.html` §02, **the six status colours**: `status/private`,
  `status/public`, `status/preop`, `status/holiday`, `status/unavailable` (hatched) and `status/free`
  (dashed), each with solid, tint and on-tint, and "colour is never the only signal". These six are
  the whole palette a status record may use. Also §01 (teal is the only action colour, crimson is
  identity only) and the pill, chip, radius and sheet rules.
- `docs/design/Mobile Availability.dc.html`: the Find cover screen (date strip, Everyone / Free only
  segmented control, colleague cards, the request-cover bottom sheet). No mockup shows a calendar or
  the set-availability sheet, so extend this screen's date-strip cells, chips and sheet anatomy.
- `docs/design/Web Availability.dc.html`: the locum-finder grid (day nav, filter chips, inline legend,
  220px name column, AM and PM cells with a status bar and two lines). The web "My availability"
  calendar reuses these cells, chips and panel surfaces in a desktop layout.
- `docs/design/Web Dashboard.dc.html`: the week strip's AM/PM block pair per day, the nearest existing
  pattern for a calendar day cell.
- `docs/design/Admin Day.dc.html`: the Admin chrome, the day grid legend and blocks (where an
  emergency Slot and a renamed status must read correctly).

**Catalogue:** the covered items above; `docs/discovery-reference/Updated Requirements/domain-model.md`,
"Slot, List and Draft List" (availability status per half-day Slot, independent of bookings; approval
state is separate) and the "Availability conflicts" row of the changes table (soft warning, flagged
and coloured).

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 4 (Slot, List and Draft List) and theme 12
  (small parity items), the Uncertainty bullet on OQ-17 and OQ-27, the DM-04 row, and the EP-01, EP-03
  and EP-15 tables.
- `docs/prototype-build/catch-up/epics/EP-01.md` (US-01.2.1, US-01.2.2, US-01.5.3, and the EP-01
  structural note on the six-key union), `epics/EP-03.md` (US-03.1.4), `epics/EP-15.md` (US-15.0.2).
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (DM-02, DM-04) and
  `analysis/reverse-check.md` (RV-14).
- `analysis/prototype-map-apps-mobile-web.md` (Availability sections), `prototype-map-admin.md`
  (Master data, Day grid), `prototype-map-domain.md`, `prototype-map-store-seed.md`,
  `prototype-map-shared.md` and `prototype-map-shell-demo-pwa.md` (router and the PWA entry).

**Code entry points (as at the snapshot; use Phase 28's names where they differ):**
- `aa-prototype/src/domain/types.ts`: `LIST_STATUS_KEYS` and `ListStatusKey` (:53-61),
  `ListConflict` (:265), `List.statusKey` (:307), the Permanent List template's `statusKey` (:583),
  `AnaesthetistAvailability` (:593, kinds `available | unavailable | holiday`), `ListStatus` (:610).
- `aa-prototype/src/theme/statusColours.ts`: the `StatusKey` union, `STATUS_ORDER`, `statusColours`,
  `unavailableHatchTint`, `unavailableHatchSolid`, `freeDashedBorder`, `getStatus`. Tests:
  `theme/statusColours.test.ts` and `domain/statusKeyParity.test.ts`. `theme/global.css` mirrors the
  six hexes as `--color-status-*` (unused by components; leave it).
- `aa-prototype/src/shared/StatusChip.tsx`, `StatusBlock.tsx`, `StatusLegend.tsx` (with its `SAMPLE`
  text keyed by the six keys) and `shared/schedule/ListRow.tsx`.
- Every other reader of the union or the colour map: `apps/admin/components/DayGrid.tsx`,
  `ListDrawer.tsx`, `apps/admin/flows/PermanentListSheet.tsx`, `ReassignListFlow.tsx`,
  `apps/admin/screens/AdminCardDetail.tsx`, `ReviewScreen.tsx`, `IntegrationMonitorScreen.tsx`,
  `apps/admin/util.ts`, `apps/demo/DemoData.tsx`, `DemoXero.tsx`,
  `apps/mobile/screens/AvailabilityScreen.tsx`, `BalancesScreen.tsx`, `CardDetailScreen.tsx`,
  `ListDetailScreen.tsx`, `apps/web/components/WeekStrip.tsx`, `apps/web/screens/AvailabilityGrid.tsx`,
  `CardDetailView.tsx`, `DashboardScreen.tsx`, `ListDetailView.tsx`, `ListsScreen.tsx`,
  `shared/flows/RequestCoverSheet.tsx`, `store/lifecycle.ts`, `store/mastersActions.ts`,
  `domain/seed/cast.ts`, `domain/seed/index.ts`. Literal-key comparisons with no union import also
  sit in `apps/admin/AdminApp.tsx` (:152-155, the day free count), `apps/mobile/screens/ForwardListsScreen.tsx`
  (:97-129), `store/cardActions.ts` (:295) and `domain/seed/cards.ts` (:1168, seed, may stay).
  After 28, add its `domain/slots.ts` (`displayStatusKey`, `isOpenSlot`), `store/slotActions.ts` and
  the `slotView*` selectors. About 55 literal comparisons exist at the snapshot
  (`grep -rnE "=== '(free|holiday|unavailable|private|public|preop)'" src`); 28 will have changed
  some.
- `aa-prototype/src/store/lifecycle.ts`: `setAvailability` (:703-830): the reconciliation, the false
  conflict for `kind: 'available'` on a List with booking context (:797-815), the per-slot audit
  metas. Phase 28 moves it to `store/slotActions.ts` (writing `slot.availability`) and removes the
  false conflict; `store/mastersActions.ts` (:277, `masters.availability`) and
  `domain/seed/canvas.ts` also reference availability.
- `aa-prototype/src/store/mastersActions.ts`: `createHospital`, `editAnaesthetist`,
  `addPermanentList`, `editPermanentList` (the office-only, `mutate()`-with-metas pattern to copy).
- `aa-prototype/src/domain/seed/cast.ts`: `LIST_STATUSES` (:142); `domain/seed/availabilityAndHolidays.ts`:
  `AVAILABILITY` windows (Souter on leave Fri 24 to Sun 26 Jul, Beaumont, Ngatai, Ngata, Delaney,
  Ropata, Sharma); `domain/seed/canvas.ts` (availability rows take their Slot cleanly; the RNG fill is
  hashed per slot by `slotRng`, so a new row changes only its own Slot); `domain/seed/index.ts`
  (`SeedMasters.listStatuses` :97, the masters assembly :412).
- `aa-prototype/src/domain/clock.ts`: `horizonFor` (14 days back, 4 months forward), `enumerateDatesISO`.
- `aa-prototype/src/apps/admin/screens/MasterData.tsx`: the `NAV` entry `listStatuses` (:51) and
  `ListStatusesView` (:453, view only). Phase 17 splits this file into `apps/admin/screens/masters/`
  and adds the `?view=` param; build the editor in 17's structure.
- `aa-prototype/src/apps/mobile/screens/AvailabilityScreen.tsx` (six-day strip :47-55, the My
  availability card :182-202 with Free and Block, `setMine` :101-116);
  `apps/mobile/routes.tsx` (`MobileAvailabilityRoute` :163, and `MobileListsRoute` as the SlideStack
  pattern); `apps/mobile/navigation.ts` (`mobileTabForPath`, `listsStackLocation`);
  `apps/mobile/MobileApp.tsx` (`showTabBar`, :132).
- `aa-prototype/src/apps/web/screens/AvailabilityGrid.tsx` (no set-own control; own Free cell only
  offers cover), `apps/web/routes.tsx` (`WebAvailabilityRoute` :117), `apps/web/WebApp.tsx` (tab
  matching :16-22, min-width 1240), `apps/web/screens/DashboardScreen.tsx` ("Who's free", :90).
- `aa-prototype/src/router.tsx` (`availability` leaf routes for web and mobile) and
  `aa-prototype/pwa/main.tsx` (:78, the PWA's own `availability` route).
- `aa-prototype/src/shared/surface/` (`useSurface().Overlay`: a bottom sheet on mobile, a dialog on
  web), `shared/ui/SlidingSegmentedControl.tsx`, `shared/ui/Button.tsx`, `shared/ui/Field.tsx`.
- `aa-prototype/src/shared/audit/actionLabels.ts` and `fieldLabels.ts`; `auditNarrative.test.ts`
  fails if an emitted action code has no label.
- Tests to extend: `store/lifecycle.test.ts` and 28's `store/slotActions.test.ts` (wherever the
  setAvailability tests live), 28's `domain/slots.test.ts` (the `displayStatusKey` table),
  `store/mastersActions.test.ts`, `domain/seed/seed.test.ts` (28's golden fixture),
  `store/persistMigrate.test.ts`, `domain/domainPurity.test.ts`, `apps/admin/components/DayGrid.test.tsx`,
  `apps/admin/flows/ReassignListFlow.test.tsx`, `src/pwa/pwaPurity.test.ts`; Playwright
  `visual/routing.spec.ts` (expects `/web/availability$` from the dashboard link; keep Find cover
  there), `visual/mobile-phase03.spec.ts` (`m-05-availability`),
  `visual/web-phase05.spec.ts` (`w-06-availability`), `visual/mobile-insets.spec.ts` (finds the "My
  availability" text), `visual/mobile-interactions.spec.ts` (the "Availability view" segmented group
  and its "Free only" button), `visual/pwa-device.spec.ts` (expects `/mobile/availability$`, so Find
  cover stays at the bare path),
  `visual/admin-phase07.spec.ts` (the master-data shot).

## Work items

Build in item order: model and pure rules, seed, palette, shared status UI, store, the Admin editor,
then the availability screens. Session 1 ends green after item 8 (the app builds and every existing
screen renders from the records); session 2 is items 9 to 15.

1. **Domain types** (`src/domain/types.ts`) (US-01.2.2 "statuses can be added or renamed without any
   code changes"; DM-04):
   - `StatusColourToken`: the union of the design's six token names (`'private' | 'public' | 'preop'
     | 'holiday' | 'unavailable' | 'free'`, the `status/<name>` tokens of Design Language §02) and a
     `STATUS_COLOUR_TOKENS` const. This is the only closed set left, and it is the palette, not the
     vocabulary. Its doc comment says so.
   - `StatusTreatment`: `'solid' | 'hatched' | 'dashed'` (moved from the theme so the domain can
     store it; the theme re-exports it).
   - `SlotStatusKey = string` replaces every closed status union: 28's `DisplayStatusKey` /
     `DISPLAY_STATUS_KEYS`, `SlotAvailability` and `ListKind` / `LIST_KINDS` (at the snapshot,
     `ListStatusKey` / `LIST_STATUS_KEYS`). Let the compiler list every use.
   - **One key space, no remap.** A status record's key is exactly the value stored: availability-scope
     keys are the values `Slot.availability` holds (28's `available`, `unavailable`, `holiday`, plus
     `emergency`), and booking-scope keys are the values `List.kind` holds (`private`, `public`,
     `preop`). 28's `displayStatusKey(slot, list)` then returns `list.kind` or `slot.availability`
     unchanged, typed `SlotStatusKey`; its `available` to `free` mapping goes. Update 28's
     `slots.test.ts` table to match. No spec or `data-shot` hook depends on the string `free` (checked
     at plan time), so this costs nothing visible.
   - `SlotStatus` replaces `ListStatus`:
     - `key: SlotStatusKey`: a lowercase slug, immutable once created (Slots, Lists and templates
       store it);
     - `label: string`: the chip label, at most 16 characters;
     - `longLabel: string`: headers and pickers, at most 32 characters;
     - `description: string` (US-01.2.2 "each status with its own description");
     - `colour: StatusColourToken` and `treatment: StatusTreatment` (US-01.2.2 "and colour");
     - `scope: 'availability' | 'booking'`: availability statuses are set on a Slot (by the
       anaesthetist or the office); booking statuses are the List types the office uses (private,
       public, pre-op). This is how the one RFP "ListStatus" table holds both until OQ-17 and OQ-27
       settle;
     - `bookable?: 'yes' | 'emergency' | 'no'`: availability scope only; drives the finders and the
       conflict rule, so no code compares literal keys;
     - `anaesthetistCanSet: boolean`;
     - `isDefault?: true`: the status a newly generated Slot and a vacated Slot take (exactly one,
       availability scope, bookable `yes`);
     - `order: number`;
     - `retiredAtISO?: IsoDateTime`.
   - `Slot.availability` (28's name) is typed `SlotStatusKey`, plus `Slot.note` (28 adds it; add it
     here only if 28 did not). `List.kind` and `PermanentList.kind` are `SlotStatusKey` too, validated
     against active booking-scope records by the store (work item 12), not by the type.
   - If 28 kept `AnaesthetistAvailability` as a parallel master (its plan removes it), fold it into
     Slot availability here so there is one store for availability (the calendar reads Slots). If 28's
     Decisions log keeps it on purpose, leave it and type its `kind` as `SlotStatusKey`.
2. **Pure status rules** (`src/domain/slotStatus.ts`, new, no React; Vitest `slotStatus.test.ts`):
   - `SEED_STATUS`: the seven seeded keys as constants (`available`, `emergency`, `unavailable`,
     `holiday`, `private`, `public`, `preop`; use 28's stored values if they differ). Literal keys may
     appear only here and in the seed.
   - Lookups: `statusFor(statuses, key)` (undefined-safe), `activeStatuses(statuses, scope?)` (ordered,
     retired excluded), `anaesthetistChoices(statuses)` (active, availability scope,
     `anaesthetistCanSet`, ordered), `defaultSlotStatus(statuses)`.
   - Behaviour: `isOpenForBooking(status)` (bookable `yes`), `isEmergencyOnly(status)`,
     `isClosed(status)` (bookable `no`). Every finder, filter and conflict rule in the app goes
     through these.
   - `validateSlotStatusDraft(draft, existing, ctx)` returns a list of plain-language issues:
     - key: slug `^[a-z][a-z0-9-]{1,23}$`, unique, unchangeable on edit;
     - label 1 to 16 characters, longLabel 1 to 32, description 1 to 160; no en or em dash in any of
       them (the copy rule applies to admin-entered labels too, since they render in every app);
     - colour in `STATUS_COLOUR_TOKENS`; treatment one of three;
     - `bookable` required for availability scope and absent for booking scope;
     - exactly one active default; the default cannot be retired or made non-bookable;
     - a status used by an active Permanent List template cannot be retired (the issue names the
       count); `ctx` carries those counts so the function stays pure.
   - `validateAvailabilityRange({ fromISO, toISO, sessions, todayISO, horizonEndISO })`: refuses
     `to` before `from`, any date before today, and any date past the horizon end. `slotsInRange`
     enumerates `{dateISO, session}` pairs with `enumerateDatesISO`.
   - Tests cover every rule above, plus: the seed has exactly one default; every seeded status's colour
     is a palette token; `anaesthetistChoices` of the seed is exactly Available, Available for
     emergency, Unavailable, On leave, in that order.
3. **Seed** (`domain/seed/cast.ts`, `domain/seed/index.ts`, `domain/seed/availabilityAndHolidays.ts`;
   US-01.2.2, US-01.2.1):
   - `LIST_STATUSES` becomes `SLOT_STATUSES`, seven records. The six keep the values 28 stores on
     Slots, Lists and templates, and today's colours, so every seeded Slot, List, template and test
     keeps working with no data rewrite:

     | key | label | longLabel | colour | treatment | scope | bookable | anaesthetist sets |
     |---|---|---|---|---|---|---|---|
     | `available` (default) | Free | Available | free | dashed | availability | yes | yes |
     | `emergency` | Emergency | Available for emergency | free | solid | availability | emergency | yes |
     | `unavailable` | Unavailable | Unavailable | unavailable | hatched | availability | no | yes |
     | `holiday` | On leave | On leave | holiday | solid | availability | no | yes |
     | `private` | Private | Private | private | solid | booking | | no |
     | `public` | Public | Public | public | solid | booking | | no |
     | `preop` | Pre-op | Pre-op Assessment | preop | solid | booking | | no |

     Descriptions come from the Design Language §02 captions and the catalogue wording.
   - Two readings to record in the Decisions log: "Available for emergency" reuses the green `free`
     token with the **solid** treatment (green because it is availability, solid so it never reads as
     the inviting dashed Free), and the `holiday` chip label becomes "On leave", the catalogue's
     word (the mobile Lists screen already says "On leave"). Both are one-field master-data edits if
     the owner prefers otherwise; neither adds a hex.
   - `masters.listStatuses` becomes `masters.slotStatuses`, keyed by `key`.
   - Seed one emergency pair so the new status is visible in the demo: two Slots that are empty and
     `available` in 28's golden canvas fixture and that no seed fixup touches, for example Dr Rawiri
     Hughes, **Tue 28 Jul** AM and PM (Hughes is "mostly free by design"; avoid Mondays, where his
     Permanent List projects a public List on the AM). Confirm both are empty in the fixture before
     choosing. Do not touch Tue 21 (asserted pristine; Hughes Tue 21 and Thu 23 are pinned Free),
     Wed 22 (S2 Beat 3's Sharma AM target must stay Free), Thu 23 (the Web Availability mockup day) or
     any Souter Slot.
   - Apply it as a post-generation `setSlot` fixup in `domain/seed/index.ts` (28's helper), **not** as
     a `SEED_LEAVE` window: a window pre-empts templates and the RNG in the generator, so it could
     remove a List. It sets the Slot's status only. Assert the choice in `seed.test.ts`.
   - Everything else in the generated canvas is unchanged. Prove it with 28's golden canvas fixture:
     regenerate it and show the diff is exactly the two emergency Slots (plus the key and type renames
     of work item 1, if the fixture stores them), and say so in the PROGRESS entry.
   - Bump `PERSIST_VERSION` by one; extend `persistMigrate.test.ts`.
4. **Theme reads records, not a union** (`src/theme/statusColours.ts`; convention 10 amended):
   - Replace the `StatusKey`-keyed `statusColours` with `STATUS_PALETTE: Record<StatusColourToken,
     { solid, tint, onTint }>`, same hexes, same Design Language comment. `STATUS_ORDER` goes (order
     lives on the records).
   - `resolveStatusVisual({ colour, treatment })` returns everything a chip, block or cell needs:
     solid, tint, onTint, block background, border and left bar. It generalises today's two special
     cases with tokens only:
     - hatched is the token's tint striped with `neutral.line`, which is exactly today's Unavailable
       hatch (`#ECEFEE` / `#E2E7E5`); the grey token keeps its own hatched solid header;
     - dashed is a 1.5px dashed border in the token's solid, which is exactly today's Free border.
     No new hex anywhere. Keep `unavailableHatchTint` and `freeDashedBorder` only as aliases if
     removing them makes the diff noisy.
   - Replace `domain/statusKeyParity.test.ts` with a token parity test (`domain/statusTokenParity.test.ts`):
     `StatusColourToken` (domain) and the `STATUS_PALETTE` keys (theme) are mutually assignable and
     equal as sets. The domain still never imports the theme outside that one test: update
     `domain/domainPurity.test.ts`'s `RELATIVE_BRIDGE_FILES` (and its comment) to the new filename.
     Update `theme/statusColours.test.ts` (six tokens, exact hexes, the two treatments resolve to
     today's exact strings). `shell/gradientLab/gradientLabPurity.test.ts` asserts the gradient files
     never use `statusColours`; keep the name it greps for accurate (grep `STATUS_PALETTE` too).
5. **Shared status UI** (`src/shared/`; US-01.2.2):
   - `src/shared/status/useSlotStatuses.ts`: `useSlotStatuses()` and `useSlotStatus(key)` over
     `masters.slotStatuses` (memoised). PWA-safe: store and theme only.
   - `StatusChip`, `StatusBlock` and `StatusLegend` take `status: SlotStatusKey`, resolve the record
     and `resolveStatusVisual`, and render the record's label. An unknown key renders a neutral chip
     with the key as text (never a crash); a retired status still renders on the Slots that carry it.
   - `StatusLegend` lists active statuses in `order`, with an optional `scope` filter. Its `SAMPLE`
     text stays for the six seeded keys (the Design Language samples; re-key `free` to `available`); any other status uses its
     longLabel and description.
   - Migrate every call site in the reference list. Replace literal key comparisons with the
     `slotStatus.ts` helpers, so no app file compares a status to a literal string.
   - RTL test `StatusChip.test.tsx`: renders a renamed label, a recoloured token, and the unknown-key
     fallback.
6. **Store: availability over a range** (28's `src/store/slotActions.ts`, beside `setAvailability`;
   `store/lifecycle.ts` at the snapshot; US-01.2.1, US-01.5.3):
   - New `setAvailabilityRange(api, actor, { anaesthetistId, fromISO, toISO, sessions: 'AM' | 'PM' |
     'both', statusKey, note? })`. `setAvailability` stays as a one-Slot wrapper, so existing callers
     and tests keep working.
   - Refusals, before any write (all or nothing): `notFound`, `integrationForbidden`,
     `notOwnAvailability` (an anaesthetist sets only their own; the office may set anyone's, as
     today), `statusNotFound`, `statusRetired`, `statusNotSettable` (a booking-scope status, or one
     with `anaesthetistCanSet: false` when the actor is an anaesthetist), and the range issues from
     `validateAvailabilityRange`.
   - One `mutate()` for the whole range. For each Slot:
     - it holds no List: set the status and note. No conflict;
     - it holds a List and the new status is bookable (`yes` or `emergency`): set the status. **No
       conflict** (this fixes the false conflict), and remove that List's `availability` conflict,
       because its cause is gone. This is the one clearing path this phase needs so the fix is not
       half done; Phase 30 generalises clearing to every path;
     - it holds a List and the new status is closed: set the status and flag an `availability`
       conflict on the List ("Dr Souter set On leave for this session; the List still stands. Review
       and reassign or clear."), replacing any earlier one, never stacking;
     - in every case the List's surgeon, hospital, Bookings, times and booking type are untouched.
       Availability is reconciled against the List, never merged into it (US-01.5.3; the snapshot's
       restatus-and-delete-times branch must be gone after 28; check).
   - Audit: one `availability.setRange` entry on the anaesthetist (from, to, sessions, before and
     after status counts, note), plus one `list.conflict` or `list.conflictCleared` entry per List
     affected. Add the labels to `actionLabels.ts` and `fieldLabels.ts`.
   - Returns `{ set, unchanged, flagged: ListId[], cleared: ListId[] }` for the UI's result line.
   - Tests: a two-week leave range writes 28 Slots in one audit entry; a range over a booked Slot flags
     exactly that List and leaves it byte-identical otherwise; Free over a booked Slot flags nothing and
     clears an earlier Block conflict; each refusal; past and beyond-horizon dates; an anaesthetist
     cannot set a colleague or a booking status; same inputs give the same state (determinism, clock
     timestamps only).
7. **Store: status master actions** (`src/store/mastersActions.ts`; US-01.2.2):
   - `addSlotStatus`, `editSlotStatus`, `retireSlotStatus` and `restoreSlotStatus`: office only, each
     through `mutate()` with before and after metas and a clock timestamp, validated by
     `validateSlotStatusDraft` (the store computes the Permanent List usage counts for `ctx`).
   - No delete: retiring keeps history, and existing Slots keep the key.
   - Audit labels ("Slot status added", "Slot status updated", "Slot status retired", "Slot status
     restored").
   - Tests: office-only refusal, each validator refusal surfaces its message, the edit round-trips
     every field, and retire then restore.
8. **Admin: Slot statuses editor** (17's `apps/admin/screens/masters/` split, `MasterData.tsx` at the
   snapshot; US-01.2.2). It replaces 28's view-only "List statuses" view and its provisional line:
   - The nav entry becomes "Slot statuses" (view param `slot-statuses`, via 17's `?view=`).
   - Header copy: "Statuses anaesthetists set on their Slots, and the List types the office uses. This
     is availability, not the Draft, Submitted and Authorised approval state." Add the OQ-17 provisional
     hint while it is open (and the OQ-27 one if item 2 of the drift check says so).
   - Table: preview chip (live `StatusChip`) · Key (mono) · Long label · Scope · Bookable · Anaesthetist
     sets · Description · state (Active, or Retired with date). Retired rows sit below the active ones,
     in mist.
   - "Add status" and a row "Edit" open `SlotStatusSheet` through `useSurface().Overlay`:
     - fields for key (create only), label, long label and description;
     - scope and bookable as segmented controls;
     - an "Anaesthetists can set this" toggle;
     - colour as six swatches, one per design token, each carrying its token name;
     - treatment as a segmented control;
     - a live preview of the chip and a sample block;
     - validator messages inline.
   - "Retire" and "Restore" row actions. Retiring asks for confirmation and says how many future Slots
     carry the status ("They keep it until changed").
   - The Day grid's legend and status filter (`DayGrid.tsx`) read the active records, so an emergency
     Slot and a renamed status show correctly. The emergency Slot draws as a solid green block labelled
     "Emergency".
   - Teal actions only. No crimson on any swatch, preview or control.
9. **Shared availability pieces** (`src/shared/availability/`, PWA-safe; US-03.1.4 "the same
   capability, not a cut-down version"):
   - `availabilityMonthFor(state, anaesthetistId, monthISO)`, a pure selector in `store/selectors.ts`:
     each date of the month with its AM and PM Slot status key, note, whether a List sits there, and
     any availability conflict. It powers both calendars.
   - `AvailabilityForm`, one component for both apps:
     - status choices as chips from `anaesthetistChoices`, each rendered as its `StatusChip` with its
       long label;
     - sessions as a segmented control: AM · PM · Both days' sessions (label it "Both");
     - From and To dates, with quick chips "Just this day", "1 week" and "2 weeks" (From is prefilled
       from the tapped day or selection);
     - an optional note;
     - one teal "Save availability" action.
     It calls `setAvailabilityRange` and shows the result in one line, for example "10 sessions set to
     On leave. 1 List flagged for the office." Refusals show the store's message.
   - `describeAvailabilityOutcome(outcome, statusLabel)`, a pure helper that writes that line (tested).
     No en or em dashes; ranges read "24 Jul to 7 Aug".
10. **Mobile: My calendar** (`apps/mobile/`; US-01.2.1, US-01.5.3, US-15.0.2):
    - **Routing:**
      - the Availability tab becomes a splat route `availability/*` hosting a two-layer `SlideStack`
        (Find cover, then My calendar at `/mobile/availability/calendar`), on the `MobileListsRoute`
        pattern;
      - add `availabilityStackLocation` to `navigation.ts`;
      - change the route in both `src/router.tsx` and `pwa/main.tsx`;
      - `showTabBar` also hides the tab bar on the calendar layer (full bleed, like List detail).
    - **Find cover screen** (`AvailabilityScreen.tsx`):
      - the "My availability" card keeps its title (`mobile-insets.spec.ts` looks for it), and the
        "Availability view" segmented group keeps its "Free only" button (`mobile-interactions.spec.ts`);
      - it shows the selected day's AM and PM as status chips, with a "Change" button that opens the
        set-availability bottom sheet (`AvailabilityForm` for that day) and a "My calendar" row that
        pushes the calendar layer;
      - remove the Free and Block buttons and the `setMine` branch that produced the false-conflict
        message;
      - colleague cells and the date-strip dot read records through the helpers. Only `isOpenForBooking`
        Slots are tappable for cover and counted as free. An emergency Slot shows its label and is not
        a cover target (cover is reworked in Phase 32).
    - **My calendar screen** (`screens/MyAvailabilityCalendarScreen.tsx`, new):
      - a back row "Availability", then a month title with previous and next controls, bounded by the
        current month and the horizon's last month;
      - a Monday-first seven-column grid. Each day is a cell with its date numeral (mono) and two
        stacked half-blocks, AM over PM, in the status visual. Today is marked the way the web week
        strip marks it. Past days are dimmed and inert, and a Slot with an availability conflict
        carries the amber "!" used on the Admin grid;
      - under the grid, a legend of the anaesthetist-settable statuses and the provisional OQ-27
        caption;
      - tapping a day opens the bottom sheet (`AvailabilityForm`) for that day;
      - a sticky, thumb-reachable teal "Add leave" action opens the same sheet preset to On leave, both
        sessions, with the "1 week" chip ready.
    - Mobile-first throughout: a bottom sheet, chips and segmented controls, no centred modal, and no
      dropdown for the status.
11. **Web: My availability** (`apps/web/`; US-03.1.4, US-15.0.2):
    - **Routing:** a nested route `/web/availability/mine` (`WebMyAvailabilityRoute` in
      `apps/web/routes.tsx`). `WebApp`'s tab matching already covers the prefix.
    - **Page header:** both availability pages get a two-option segmented control, "Find cover" and
      "My availability", under the page title. The locum-finder grid is otherwise as today.
    - **The grid's own row:** the "(you)" row's cells get a small "Change" link that opens My
      availability on that date (`?date=`).
    - **`screens/MyAvailabilityCalendar.tsx`, a desktop layout inside the 1320px content width:**
      - a month grid (Monday first) in a `Panel`, each day showing AM and PM as the Web Availability
        cell anatomy (status bar and label, with the note as the second line where it fits);
      - previous and next month controls, with the same horizon bounds as mobile;
      - clicking a day selects it, and shift-clicking extends the selection to a range;
      - a 340px right rail holds `AvailabilityForm` (panel variant) for the selection, plus the legend
        and the provisional caption.
      The web app stays desktop-width (min-width 1240); no responsive work.
    - **Dashboard:** "Who's free" and the week strip read records through the helpers. The seeded
      Leave panel is untouched; Phase 38 removes it.
12. **Finders and other consumers read the helpers**:
    - Mobile and web "Free only" filters and free counts, the mobile Forward Lists rows, the web
      Dashboard "Who's free", the Admin Day free count (`AdminApp.tsx`) and the Admin
      `ReassignListFlow` free-target list use `isOpenForBooking`. Emergency Slots are shown with their
      label and not offered as free.
    - 28's `isOpenSlot(slot, list)` takes the status records (or a resolved status) and means "no List
      and `isOpenForBooking`"; `requestCover`'s `notFree` refusal reads it.
    - 28's store refusals read the helpers, not keys: `assignListToSlot`'s `slotNotAvailable` and
      `moveListToSlot`'s `targetNotAvailable` refuse only `isClosed` Slots (so the office may still
      assign or move a List onto an emergency Slot, which is what "available for emergency" means);
      `invalidKind` refuses a kind that is not an active booking-scope status. Record the emergency
      reading in the Decisions log. (Phase 30 turns `slotNotAvailable` into accept-and-flag.)
    - Phase 28's reassign default for a vacated Slot (`vacatedAvailability`) uses `defaultSlotStatus`,
      and its Unavailable or Holiday picker lists the active closed availability statuses.
    - Permanent List templates (`PermanentListSheet.tsx`) pick their `kind` from the active
      booking-scope statuses, through `activeStatuses(statuses, 'booking')`.
    - Check `grep -rnE "'(free|available|holiday|unavailable|private|public|preop|emergency)'" src`
      outside `domain/slotStatus.ts`, `domain/seed/` and tests: the only matches left should be
      unrelated strings (for example cover or audit copy).
13. **Remove the superseded behaviour**:
    - the false conflict on a bookable status (item 6);
    - the view-only "A fixed enumerated set" master (item 8);
    - the closed status unions (28's `DisplayStatusKey`, `SlotAvailability` and `ListKind`; the
      theme's `StatusKey`), 28's `available` to `free` remap in `displayStatusKey`, and
      `statusKeyParity.test.ts` (items 1 and 4);
    - the fixed six-day limit on setting one's own availability (the Find cover date strip may stay
      six days, because it is the corridor finder; setting availability now happens in the calendar).
14. **Playwright** (`npm run shots`):
    - Update `m-05-availability`, `w-06-availability` and the Admin master-data shot.
    - Add `visual/availability-phase29.spec.ts` with `data-shot` hooks for:
      - the mobile calendar (July, showing Souter's seeded leave 24 to 26 Jul);
      - the mobile set-availability sheet with On leave and "1 week" selected;
      - the web My availability page with a range selected and the rail showing;
      - the Admin Slot statuses table and `SlotStatusSheet` with the live preview;
      - a Day grid showing the Hughes emergency Slots on Tue 28 Jul (or the pair item 3 chose).
    - Keep `mobile-insets.spec.ts`, `mobile-interactions.spec.ts` and `pwa-device.spec.ts` passing (the
      calendar layer must respect the PWA insets and the `DockSpacer` rule).
15. **Finish green:**
    - `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    - `pwaPurity.test.ts` still passes (`src/shared/availability/` and `src/shared/status/` import
      nothing from `apps/admin`, `apps/demo` or `shell`);
    - `persistMigrate.test.ts` covers the bumped version.

## Demo triggers

**None.** Setting availability, adding leave and editing a status are all ordinary user actions: the
anaesthetist on mobile or web, the office in Admin master data. Nothing here is automatic, scheduled
or external, so there is no harness-bar button. Register nothing in Phase 14's registry and add
nothing to the Control Panel.

**PWA:** nothing on the handset waits on the office or on a backend event. The office sees the change
on its Day grid, and in a framed demo the presenter switches to Admin to show it. The new mobile route
(`/mobile/availability/calendar`) is URL-addressable, so a later phase (32's swap request from the
availability view) can scope a PWA entry to it if it needs one.

## Out of scope

- **Conflicts beyond this phase's two cases:** the List colour change, clearing on every path,
  hospital-holiday edits and the cross-date conflict dashboard are Phase 30's (US-01.5.4). This phase
  only raises a conflict when a closed status lands on a List, and clears it when a bookable status
  replaces it.
- **Swap requests** and any rework of cover offers and requests: Phase 32. The existing cover flow
  keeps working on `isOpenForBooking` Slots.
- **Draft Lists** and assigning them to a free Slot: Phase 31 (it will use `isOpenForBooking`).
- **Leave approval, recurring weekly availability, or a leave balance.** The catalogue asks for none
  of them. Permanent Lists remain the office's weekly template.
- **The web Dashboard's seeded Leave and Productivity panels:** Phase 38 removes them (RV-18). Do not
  link them to the calendar.
- **Office-side bulk availability** (an admin setting a colleague's leave from the Day grid). The store
  action allows the office, but no Admin UI is added.
- **Hospitals, insurers and public holidays as editable masters, and spreadsheet loads:** Phase 42.
  The Slot statuses editor built here is its pattern.
- **A responsive or tablet web layout** (noted in US-15.0.2's gap; not required).
- **The Model B split** of the status master (see the drift check).

## Manual test checklist

- [ ] Mobile, Availability: the "My availability" card shows today's AM and PM as chips. "Change" opens
  a bottom sheet with exactly four choices: Available, Available for emergency, Unavailable, On leave.
- [ ] From the card, "My calendar" slides in the calendar with no tab bar. July shows Souter's seeded
  leave on Fri 24 to Sun 26 as On leave half-blocks. Paging forward stops at the horizon month, and
  back stops at the current month.
- [ ] In the calendar, "Add leave" then 1 week from Mon 10 Aug: the result line counts the sessions set
  and names any flagged List. The Admin Day grid for those days shows On leave at once, and any
  booked List there carries the amber conflict with its surgeon, hospital and Bookings unchanged.
- [ ] Set a booked session of Souter's (for example Tue 21 AM) to Available: no conflict is raised and
  the result line says so. Set it to Unavailable: one conflict. Set it back to Available: the conflict
  is gone. Audit shows each change once. Reset before the S2 checks below.
- [ ] Set an empty Slot to Available for emergency: it draws as a solid green "Emergency" block on
  mobile, web and the Admin grid. It is not counted in "Free only" and is not tappable for cover.
- [ ] A range ending before it starts, or a past date, is refused with a plain message and nothing
  changes.
- [ ] Web, Availability: the "Find cover" and "My availability" switch works. On My availability,
  click then shift-click selects a range, the rail's form sets it, and the mobile calendar shows the
  same result (same store). The "(you)" row's "Change" link on Find cover opens that date.
- [ ] Admin, Master data, Slot statuses: seven rows, each with a live chip, and the OQ-17 provisional
  hint.
  - Rename Unavailable to "Blocked": the chip, the legends, the Day grid, the mobile colleague cells
    and the web grid all read "Blocked" without a reload.
  - Change its colour to another token and back: every surface follows.
- [ ] Add a status "Sick leave" (availability, not bookable, holiday token, solid, anaesthetists can
  set): it appears in the mobile and web choices and in the legends. Retire it: it leaves the choices
  and the legends, a Slot already carrying it still renders it, and restoring it brings it back.
- [ ] Trying to retire Free (the default), or a status used by a Permanent List, is refused with the
  reason. Trying a label with an em dash is refused.
- [ ] S2 runs unchanged: Beat 1's Tue 21 grid is identical apart from the "On leave" label; Beat 2's
  phone-advice booking on Sharma Tue 21 PM; Beat 3's reassignment of Rutherford Wed 22 AM to Sharma.
- [ ] PWA build (`npm run build:pwa`, then preview on a phone-sized viewport): the calendar route, the
  sheet and "Add leave" work and clear the insets and tab bar.
- [ ] No en or em dash in any new copy, no crimson on any new control, and teal is the only action
  colour.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are all green.

## Demo guide updates

In the same session (the ROADMAP rule: each phase patches the beats it touches). S2 is re-scripted
after Phase 32, so keep these edits small:
- `docs/demo-guide/03-demo-script.md`:
  - **S2 Beat 1:** the legend now has seven statuses; "Holiday" reads "On leave". Update the Expected
    line.
  - **S2, an optional opening moment** before Beat 1: on mobile, My calendar, "Add leave" for a week
    in August, then switch to Admin and show it on the Day grid. Add Click, Say ("Availability is set
    weeks ahead from the phone or the web, and the office sees it straight away. A booked List is
    flagged, never silently changed.") and Expected lines.
  - **S2 Discovery points:** add OQ-17 (the final status vocabulary and colours, now editable master
    data) and OQ-27 (is the calendar the Slot status or a separate calendar), and name the calendar as
    the provisional reading.
  - **Direct URLs:** add `/mobile/availability/calendar`, `/web/availability/mine` and
    `/admin/masters?view=slot-statuses`.
- `docs/demo-guide/04-presenter-cheat-sheet.md`:
  - section 6 (availability and holiday conflicts): a bookable status never conflicts, and a closed
    one flags the List, which stays unchanged;
  - one line on the editable status master ("rename or add a status and every app follows");
  - add "set availability weeks ahead" to the mobile and web feature lists.
- `docs/demo-guide/02-workflows-and-handoffs.md`:
  - the cover workflow's steps 1 and 2 (maintain availability in the calendar, reconciled as a
    conflict flag);
  - line 78's status list (seven statuses, from master data).
- `docs/demo-guide/01-personas-and-responsibilities.md`:
  - Dr Souter's mobile duty ("use Availability to set availability weeks ahead, including leave, or to
    request cover");
  - replace "submitting leave requests is outside this prototype" with the calendar, noting the
    seeded Leave panel stays until Phase 38.
- `docs/demo-guide/master-demo-guide.html`: mirror the same S2 edits, discovery points, Direct URLs
  table and cheat-sheet lines, word for word.
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, the S2 blurb): mention the
  optional leave moment only if the blurb lists beat content. No trigger is added.
- This is not a milestone phase, so no full consistency read. Check the patched sections match the run
  sheet.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:
- fan out three independent Opus review subagents, one each for **quality**, **bugs/correctness** and
  **plan adherence**, with the catalogue files, this doc and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code, fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the
  pass in the phase entry;
- do not re-raise anything already settled in the Decisions log.

**Steer this phase's reviewers at:**
- **No closed vocabulary left.** No app, shared or store file compares a status to a literal key. Every
  finder, filter, count and conflict rule goes through `domain/slotStatus.ts`. Adding a status in
  Admin, with no code change, makes it selectable, rendered and correctly bookable or closed
  everywhere.
- **The design language holds.** The palette is exactly the six Design Language tokens, and no new hex
  appears. The seeded statuses render exactly as before (hatch and dashed strings identical) apart
  from the two recorded label readings. Every chip and block carries its label. Crimson and teal are
  never a status colour.
- **Availability never merges into the List.** `setAvailabilityRange` never edits a List's surgeon,
  hospital, Bookings, times or booking type. A bookable status on a List raises nothing and clears its
  availability conflict. A closed status flags once and replaces rather than stacks.
- **Range integrity.** The action is all or nothing on refusal, with one `mutate()` and one range
  audit entry plus one entry per List affected. Past and beyond-horizon dates are refused. Timestamps
  come from the clock. Determinism holds.
- **Master-data safety.** Keys are immutable; there is exactly one default; the default and in-use
  template statuses cannot be retired; retire keeps history and existing Slots still render; the
  validator also rejects en and em dashes in admin-entered labels.
- **Parity.** The web app can do everything the mobile availability screen can (single Slot, both
  sessions, range, leave, emergency, note) through the same `AvailabilityForm` and store action, in a
  real desktop layout. The mobile calendar is mobile-first (slide-in layer, bottom sheet, chips), and
  the PWA route, insets and import closure are intact.
- **Honest labelling.** The OQ-27 caption and the OQ-17 hint are present while those questions are
  open, and nothing claims the vocabulary is final. S2 is unchanged, and the seed test proves the
  canvas moved only at the two emergency Slots.

## PROGRESS.md updates

- **Status row** for catch-up Phase 29, and a phase entry with:
  - the drift-check result (items changed or not; OQ-17 and OQ-27 status, and which branch was built);
  - what was built, per work item;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added;
  - the review pass.
- **Decisions log:**
  1. **The status set is master data** (`masters.slotStatuses`, `SlotStatus`). This amends convention
     10 and supersedes the 2026-07-21 "Status colour mapping" as a closed six-key set: the palette
     stays in `src/theme/statusColours.ts` as the six Design Language tokens, and statuses reference a
     token.
  2. **A bookable status over a List raises no conflict and clears the availability conflict.** This
     supersedes the 2026-07-23 "Availability reconciliation, both directions" ruling for the
     un-block direction. The restatus half was already superseded by Phase 28.
  3. **"Available for emergency" is seeded as a seventh status** (green `free` token, solid treatment),
     provisional pending OQ-17. It is not a free target in the finders, but the office may still
     assign or move a List onto it (store refusals read `isClosed` only).
  4. **The `holiday` chip label reads "On leave"**, the catalogue's word. The key is unchanged.
  5. **The calendar is built over Slot availability**, the OQ-27 interim, labelled provisional.
  6. **Statuses are retired, never deleted.** Keys are immutable, and one default is required.
  7. **One key space:** a status key is the value stored on `Slot.availability` or `List.kind`, and
     `displayStatusKey` returns it unchanged (the Free record's key is 28's `available`).
  8. **One availability store:** record what happened to `masters.availability` (folded into Slots,
     or kept per Phase 28).
- **Handoff notes:**
  - For **30**: use `isClosed` and `isOpenForBooking` for conflict raising, the List colour change
    and clearing. This phase clears only on a bookable status replacing a closed one.
  - For **31**: Draft List assignment targets `isOpenForBooking` Slots in the picker; the store
    accepts an emergency Slot. Decide with the owner whether the picker offers emergency Slots.
  - For **32**: swap requests start from the availability view; the mobile calendar route and the web
    `/web/availability/mine` exist. Cover still runs on `isOpenForBooking` Slots.
  - For **38**: the calendar holds real leave, so the seeded Leave panel can go without loss.
  - For **42**: the Slot statuses editor and `validateSlotStatusDraft` are the pattern for the other
    masters, and a loader target.
  - For **44**: S2's optional leave moment, and the seven-status legend.
