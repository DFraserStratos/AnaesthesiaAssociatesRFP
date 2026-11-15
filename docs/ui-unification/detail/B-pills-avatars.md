> Detail file for `docs/ui-unification/README.md` (audit of 12 November 2026): pills, badges, avatars, counts, warning markers.
> Group numbers here (G1, N1 ...) are local to this file; the README's U-numbers point to them. Paths are relative to `aa-prototype/src/` unless they start with `docs/`.

# V-B · Verified: chips, pills, badges, avatars, person displays, markers, counts

Paths are relative to `aa-prototype/src/` unless they start with `docs/` or `ui-library-preview/`.
Mockups checked: every `docs/design/*.dc.html` was scanned for `border-radius:999/99px` spans with padding and for initials discs.
The single biggest correction is that many "drifting" pill sizes are copied from the mockups, so they are INTENDED.

## Verification summary

| group | verdict | what I corrected |
|---|---|---|
| G1 Tone label pill | CONFIRMED WITH CORRECTIONS | The ~30 copies share one anatomy but do four jobs: record status, kind or tag, attention flag, and small metric. One component with tones covers all four. Several paddings are mockup values, not drift. Shared `Pill` has 20 call sites in 11 files, not 24 in 12: the sweep counted ListRow's private `Pill` (4 lines). About half the members sit in screens that phases 21a, 22, 34, 37, 38 and 40 rebuild or delete (`AgeChip`, "Prior balance", leave pills, StatTile "+n%"). Status-colour pills (ListRow `CountPill`/`ChipPill`, the mobile "Free" tag) are excluded. Proposed sizes are re-based on the mockups. |
| G2 Outlined warning marker | CONFIRMED | Both members with 66 alpha are the "Changed" feature and agree with each other. Fold into G1 as `variant="outline"`. The Review row site is rebuilt in 21a. |
| G3 Teal-tint labels | CONFIRMED WITH CORRECTIONS | Dropped the ModifiersSection code pill: a claimed modifier wears the selected-chip tint (PROGRESS Phase 19b review: "claimed rows keep the teal tint (the doc asks for the selected-chip tint)"). Added two later rulings against teal on labels (Phase 18 review: "pills neutral (no teal tint, no amber)"; Phase 11 review: "`SEGMENT_TONES` no longer uses the teal action colour for decoration"). |
| G4 Count bubble | CONFIRMED WITH CORRECTIONS | Canonical should be the 18px heading count: three identical copies in the same Admin Day right rail. `ActiveCount` is the 22px outlier. It also shows "0" while the others hide at zero. The SideNav badge matches the Admin Day and Admin Review mockups exactly, so it is INTENDED and stays local. Dropped DemoIntegrations "n messages" (a caption pill, and it moves in Phase 34). |
| G5 Avatar | CONFIRMED WITH CORRECTIONS | The font steps come from the mockups: 11 at 28 to 30, 12 at 34, 13 at 36, 15 at 44, weight 700. `Initials` is the off one (12 at 36, 14 at 44). `Avatar`'s size x 0.34 is right at 34 and 44 but gives 10 at 30 and 12 at 36. The crimson-tint persona avatars on web, admin and shell are drawn in the mockups (Web Dashboard 36px "MS", Admin Day and Review 30px "KW"), so they are INTENDED, not "by omission". |
| G6 Person display | CONFIRMED WITH CORRECTIONS | `AppShell` is the demo harness bar, not product chrome. SideNav's literals equal `PERSONAS.kirsty` and the mockup's "KW", so nothing is visibly wrong. Phases 40, 43 and 43a all edit SideNav, and 43a adds `shared/viewer.ts`. Fold the fix in there or make it a two-line fix now. Value lowered. |
| G7 "!" disc and warning markers | CONFIRMED WITH CORRECTIONS | DayGrid's 13px disc with a 9px "!" is the Admin Day mockup verbatim, so it is the canonical size. The a11y gap is overstated: the grid block's reasons are in the button's `title`. The real defect is narrower: the "!" glyph is not `aria-hidden`, so it is read into the button name. The calendar markers sit inside cells that carry the status. |
| G8 Day chip | CONFIRMED | No change. |
| G9 Toggle/filter chips | CROSS-REFERENCE (owned by E G2) | Added evidence: the solid vs tint split is INTENDED by the mockups. Web Availability "All / Free" and Mobile App "Week / Month / To-Do / Done" use solid teal; Mobile App modifier chips use teal tint with a teal border. |
| G10 ChipMultiSelect vs SurgeonPicker | CROSS-REFERENCE (owned by C G6) | Counts verified: ChipMultiSelect has 2 sites (multi-line JSX); `SurgeonPicker` is at ContractEditSheet.tsx:480. |
| G11 Progress pill vs ListRow | CONFIRMED WITH CORRECTIONS | ListRow's `5px 10px` 11/600 pill is the Mobile App mockup verbatim ("1 to finish", "6 cards"), so it is INTENDED. Share only the label and tone logic, not the anatomy. |
| G12 Capture cue | CONFIRMED WITH CORRECTIONS (narrowed) | The mobile cue (`9px 16px` 13/600, #E1F0ED / #0A5A51) is the mockup verbatim. Dropped BillingLinesCard: Phase 39b deletes it, and Phase 22 removes its "Billed to" chip. Only the two Capture cues remain. Value low. |
| G13 Status-tinted label without dot | DROPPED | The mobile "Free" tag is the Mobile Availability mockup verbatim (dotless, `3px 9px` 11/600, open tint). The who's-free chips are the Web Dashboard mockup verbatim (`5px 11px` 12/600). ListRow `CountPill`/`ChipPill` are the Mobile App mockup ("6 cards", white "Holiday"). The six status colours copy AA's Solutions Plus legend (RFP AR-15 p.46), so their treatments are not drift. |
| G14 Small dots | DROPPED | Different jobs. The literal `#8FE3B4` belongs to the tokens sweep (H). |

---

### G1 · Tone label pill (status, kind, attention flag, metric)
- **Job:** a short, passive word on a semantic tint (neutral, success, warning, error) on `r-pill`. There are four semantic jobs, but the anatomy is the same: record status (Invoices, AA fees, Billing monitor, Xero sim), kind or tag (tier, surgeon group, contact type, ethnicity code), attention flag (Unassigned, Not complete, Review flags, "New"), and small metric ("+8%", "12d"). Anything in one of the six status colours is NOT a member; that is `StatusChip`'s job.
- **Members:** about 30 definitions. Representative members:

| name | file:line | apps | call sites |
|---|---|---|---|
| `Pill` (shared) | shared/ui/Pill.tsx:30 | A W M | 20 in 11 files |
| `TierPill` (+ local `PILL`) | apps/admin/components/pairing/Pills.tsx:25 | A | 5 |
| `UnassignedPill`, `DraftStateChip` | apps/admin/components/draftLists/DraftListParts.tsx:31,41 | A | 6 + 1 |
| `StatusPill` | apps/admin/screens/InvoicesScreen.tsx:238 | A | 3 |
| `StageChip`, `BookingStatusPill` | apps/admin/screens/BillingMonitorScreen.tsx:347,382 | A | 1 + 1 |
| `FlagPill`, inline "Submitted", "Not complete" | apps/admin/screens/ReviewScreen.tsx:437,236,307 | A | 3 |
| ListRow "New" badge | shared/schedule/ListRow.tsx:219 | M (ForwardListsScreen.tsx:274) | 1 |
| `OutOfHoursPill` | shared/schedule/OutOfHoursMark.tsx:22 | none | **0** (catalogue only) |

- **Differences:**
  - Sizes. Several are INTENDED, from the mockups:
    - Admin Review mockup: "Submitted today" `6px 12px` 12/600; flag pill `4px 10px` 11/600.
    - Web Dashboard mockup: Approved and Pending `4px 10px` 11/600; "+8%" `2px 7px` 11/600.
    - Mobile mockups: `5px 10px` 11 and `3px 9px` 11.
    - The rest (`1px 8px`, `2px 8px`, `2px 9px`, `3px 9px`, `4px 8px`, `4px 9px`, `5px 12px`) are DRIFT among table and inline pills that no mockup covers.
    - App vs mockup: app `FlagPill` is `2px 8px` against the mockup's `4px 10px`, and app "Submitted" is `4px 10px` against `6px 12px`. Both DRIFT, but against the mockup, so the mockup wins (PROGRESS convention 17).
  - Weight 500 on the SurgeonProfile group pill and 700 in DemoXero `RecordStatus` and DemoIntegrations `StatusPill`: DRIFT.
  - Warning and error tones exist only in private copies, because shared `Pill` has only neutral and success. DRIFT: this gap caused the copies.
  - "New" badge and `OutOfHoursPill` use ink at 700. UNSURE whether the emphasis is meant (question 5). `OutOfHoursPill` was born unused in Phase 32c (commit 8768fbb6): rows put "Out-of-hours" in the subtitle (ListRow.tsx:226).
  - ✓/○ glyph on `StateChip` and the dot on `UnassignedPill`: INTENDED (colour is never the only signal; comments at InvoiceDocument.tsx:412 and DraftListParts.tsx:30).
- **Target:** extend `shared/ui/Pill.tsx`:
  - API: `<Pill tone="neutral|success|warning|error" size="sm|md|lg" variant="tint|outline" leading mono title shot {...data-*}>`.
  - `sm` = today's `small` (`0 7px` 11/16). `md` = today's default (`1px 8px` 11.5/18), for inline beside text. `lg` = `4px 10px` 11/600, the mockup table and flag pill, for table cells.
  - Header pills like "Submitted" stay at the mockup's `6px 12px` through `size="xl"`, or as a one-off.
  - Tokens: `semantic.*.tint/onTint/solid`, `neutral.sunken/slate/surface`, `radius.pill`.
  - Keep `TierPill`, `UnassignedPill` and `DraftStateChip` as one-line named wrappers, because they own `data-tier`, `data-unassigned` and `data-list-state`. Delete `OutOfHoursPill`, or keep it and render the ListRow badge through it.
- **Behaviour contract:** passive `span`. Pass `title` when the word is abbreviated (as `StageChip` and Prior balance do). Per-domain tone maps stay with their screens.
- **Migration:**
  - Stable sites now: `pairing/Pills.tsx`, `DraftListParts.tsx`, `AaFeesScreen.tsx`, `SurgeonProfile.tsx:95`, `InvoiceDocument` `StateChip`, ListRow badge, `ProgressPill`. About 12 sites.
  - Leave the screens being rebuilt to their phases, which should build on the new `Pill`: Review (21a), Invoices and InvoiceDocument (22), Billing monitor (37 full restyle; 40 removes "Prior balance"), IntegrationMonitor (34 demotes it), DemoXero (27, 27a, 36), web Accounts (36, 38), web Dashboard leave and StatTile pills and mobile `AgeChip` (deleted in 38).
  - Risks: `data-tier` (6 Vitest + 11 Playwright lines), `data-unassigned`, `data-list-state`, `data-progress` (ListsScreen.test), `list-row-badge` (visual/pwa-device.spec.ts:328,365). `npm run shots` pixel diffs.
  - No seed or PERSIST_VERSION effect. Size M.
- **Upcoming phases:** 17a, 21, 21a, 22, 23, 24, 25, 27, 27a, 33, 33a, 34, 36, 37, 38b, 39, 39a, 40, 40a, 41, 42, 43, 43a each add pills. Land this standalone **before Phase 21 finishes**, so new pills use it rather than adding more copies.
- **Value:** high. It removes about 25 copies, and every later phase reuses it. Demo visibility medium: table pills differ between Review, Invoices and the Billing monitor.
- **Confidence:** high on the shared anatomy and the API; medium on the size scale.
- **Catalogue rows:** admin `Pill`; admin `MasterPills`; admin `TierPill / PreferredPill / NotPreferredPill`; admin `DraftListParts`; admin `InvoiceDocument`; admin `Billing pipeline stepper (PipelineCard)`; admin `Review summary tiles (ReviewScreen)`; web `StatTile`; web `ProgressPill`; mobile `ProgressPill`; mobile `OutOfHoursPill`; mobile `AgeChip`; mobile `ListRow`.

### G2 · Outlined warning marker pill
- **Job:** a white pill with a warning or error outline that marks attention, not a state.
- **Members:**

| name | file:line | apps | call sites |
|---|---|---|---|
| `NotPreferredPill` | apps/admin/components/pairing/Pills.tsx:42 | A | 3 |
| `StrengthPill` | shared/warnings/WarningsPanel.tsx:37 | A W M | 1 (per warning) |
| inline "Changed" | apps/admin/screens/ReviewScreen.tsx:301 | A | 1 |
| `ChangedSinceSubmittedPill` | apps/admin/components/ChangedSinceSubmitted.tsx:26 | A | 3 |

- **Differences:**
  - Border alpha: full on pairing and strength, `66` on both "Changed" pills. DRIFT. Pills.tsx:4 says it copies "the outline style of 15a's strength pill", which is full alpha.
  - The header size `3px 10px` 12 vs row size `1px 8px` 11 follows G1's size scale.
- **Target:** G1 `Pill variant="outline"` (`border 1px solid tone.solid`, `background neutral.surface`, `color tone.onTint`) with a `leading` icon slot for PenLine.
- **Behaviour contract:** passive. Keep the explanatory `title`.
- **Migration:** 4 definitions. Risks: `review-changed-since-submitted` and `review-changed-booking` (ReviewChangedSinceSubmitted.test.tsx). ReviewScreen's site is reworked by 21a, so do Pills.tsx, WarningsPanel and ChangedSinceSubmitted now. Size S.
- **Upcoming phases:** 21a (Review), 27 (WarningsPanel).
- **Value:** medium for consistency. Demo visibility low to medium.
- **Confidence:** high.
- **Catalogue rows:** admin `TierPill / PreferredPill / NotPreferredPill`; admin `ChangedSinceSubmittedPill`.

### G3 · Teal-tint labels (open ruling)
- **Job:** a passive label drawn in the teal action tint.
- **Members:**

| name | file:line | apps | call sites |
|---|---|---|---|
| `PreferredPill` | apps/admin/components/pairing/Pills.tsx:38 | A | 4 |
| HistoryTimeline "n changes" | shared/booking/HistoryTimeline.tsx:184 | A W M | 1 |

- **Differences:**
  - Phase 17 built "a teal-tint Preferred pill" on purpose (PROGRESS line ~1484; Pills.tsx:3 "information, not an action").
  - Later rulings go against teal on labels: shared Pill.tsx:4 "never the teal action tint"; Phase 18 review "pills neutral (no teal tint, no amber)"; Phase 11 review "no longer uses the teal action colour for decoration".
  - UNSURE: a real conflict between rulings. The history pill sits beside a teal action label (HistoryTimeline.tsx:180), so it reads as part of that line.
- **Target:** if the later rule wins, Preferred becomes `Pill tone="success"` and the history count becomes `tone="neutral"`. Note that the success tint is close to the Free status tint on the same candidate pickers.
- **Behaviour contract:** passive.
- **Migration:** 2 definitions, 5 sites. No test queries their colour. AssignDraftListSheet.test checks the Preferred pill by text. Size S.
- **Upcoming phases:** 33 and 35 (HistoryTimeline).
- **Value:** low in lines, medium for the hard colour rule.
- **Confidence:** high on the facts; the ruling is the user's.
- **Catalogue rows:** admin `TierPill / PreferredPill / NotPreferredPill`; web `HistoryTimeline`.

### G4 · Count bubble beside a heading
- **Job:** a small numeric count beside a card or page heading.
- **Members:**

| name | file:line | apps | call sites |
|---|---|---|---|
| To-do count | apps/admin/components/WarningsToDo.tsx:50 | A | 1 |
| Needs-destination count | apps/admin/components/NeedsInvoiceDestinationCard.tsx:33 | A | 1 |
| Draft Lists count (warning tint, mono) | apps/admin/components/draftLists/DraftListsCard.tsx:39 | A | 1 |
| `ActiveCount` | apps/admin/components/NotificationsCard.tsx:61 | A | 2 (card, NotificationsScreen.tsx:51) |
| Demo actions count | shell/DemoActionsMenu.tsx:100 | shell | 1 |

- **Differences:**
  - The three rail cards use an identical `0 7px` 11.5/18 700 bubble. `ActiveCount` (`h22`, mono 12/700) is the outlier on the same rail (RightRail.tsx:52 to 58): DRIFT.
  - `ActiveCount` also renders at 0 while the others hide: DRIFT in behaviour. Only `ActiveCount` gives screen readers a noun.
  - Warning tint on the Draft Lists count: INTENDED (waiting Draft Lists are attention; DraftListParts.tsx:1 to 6).
  - The SideNav badge (SideNav.tsx:87: crimson or warning solid, `2px 8px` 11/700) is the Admin Day and Review mockup badge verbatim. INTENDED, and it stays local.
- **Target:** `shared/ui/CountBadge.tsx`: `<CountBadge count tone="neutral|warning" srNoun mono hideAtZero shot>`.
  - Canonical look: the three-copy 18px rail bubble, with tabular numbers.
  - Behaviour from `ActiveCount`: the visually hidden noun. Move its clip style to a shared `visuallyHidden`.
- **Behaviour contract:** visible number plus hidden noun ("3 to do", "2 active").
- **Migration:** 5 sites. Risks: `admin-notifications-count`, `admin-notifications-page-count` (NotificationsScreen.test.tsx, visual/unavailability-phase32b.spec). `ActiveCount` shrinks from 22 to 18, a pixel diff. Size S.
- **Upcoming phases:** 27 (Pre-payments rail card), 37 (ReconciliationCard), 38b (count on tab and nav). They should use it.
- **Value:** medium. Visible on the Admin Day right rail.
- **Confidence:** high.
- **Catalogue rows:** admin `WarningsToDo`; admin `NotificationsCard`; admin `SideNav (with RolesInfo)` (badge reference only).

### G5 · Avatar / initials disc
- **Job:** a person's initials in a disc, decorative beside a printed name.
- **Members:**

| name | file:line | apps | call sites |
|---|---|---|---|
| `Avatar` (elevated white) | shared/Avatar.tsx:20 | M | 3 |
| `Initials` (neutral) | shared/flows/moveSheetParts.tsx:22 | A W M | 5 |
| colleague disc | apps/mobile/screens/AvailabilityScreen.tsx:230 | M | 1 (map) |
| colleague disc | apps/web/screens/AvailabilityGrid.tsx:173 | W | 1 (map) |
| WebNav persona | apps/web/components/WebNav.tsx:63 | W | 1 |
| AppShell persona | shell/AppShell.tsx:103 | shell | 1 |
| SideNav persona | apps/admin/components/SideNav.tsx:97 | A | 1 |

- **Differences:**
  - Elevated white for the mobile persona vs crimson tint elsewhere: INTENDED (PROGRESS Decisions 2026-07-24; line ~911).
  - Crimson tint on web, admin and shell persona and colleague discs: INTENDED by the mockups (Web Dashboard and Web Availability 36/13 "MS", 30/11 colleagues; Admin Day and Review 30/11 "KW"; Mobile Availability 34/12 colleagues).
  - Font steps: every inline copy matches the mockups. `Initials` (12 at 36, 14 at 44) and `Avatar`'s x 0.34 rule (wrong at 30 and 36) are DRIFT.
  - Neutral `Initials` for colleagues in move sheets vs tint colleagues on availability screens: UNSURE. The Initials comment explains it ("no tint that could read as a mark"). Question 4.
- **Target:** one `shared/Avatar.tsx`: `<Avatar name? initials? size variant="elevated|tint|neutral" muted />`.
  - Font from a size table: 28 to 30 → 11, 34 → 12, 36 → 13, 44 → 15. Weight 700.
  - Initials come from `initialsOf(name)`. Fold `Initials` in as `variant="neutral"`.
- **Behaviour contract:** `aria-hidden`, and a name is always printed beside it. Phase 26 makes the WebNav name and avatar a button, so the accessible name comes from the visible name.
- **Migration:** 7 definitions, about 13 sites. No test selectors. Pixel diffs on the move sheets (12 → 13 and 14 → 15). Size S.
- **Upcoming phases:** 26 (WebNav button), 36 (out-of-balance list avatars), 43 (SideNav, WebNav, More, AppShell badges). Land it standalone first.
- **Value:** medium.
- **Confidence:** high.
- **Catalogue rows:** mobile `Avatar`; mobile `MobileHeader`; web `WebNav`; admin `SideNav (with RolesInfo)`; web `AvailabilityGrid`; web `MovedToYouPanel` / mobile `MovedToYouPanel` (move sheets nearby; no `Initials` row).

### G6 · Persona chip on the dark bars
- **Job:** the signed-in persona as avatar, name and role on an ink surface.
- **Members:**

| name | file:line | apps | call sites |
|---|---|---|---|
| SideNav footer | apps/admin/components/SideNav.tsx:96 | A | 1 |
| AppShell persona chip (demo harness bar) | shell/AppShell.tsx:101 | shell | 1 |

- **Differences:**
  - Avatar 30 vs 28: SideNav follows the Admin mockup; AppShell has no mockup.
  - SideNav types "KW / Kirsty W. / Office". The values equal `PERSONAS.kirsty` (shell/appConfig.ts:28), so this is DRIFT in source only, with no visible error.
  - The light-surface persona displays (More card, WebNav name-left-of-avatar, which matches the Web Dashboard mockup header) are a different layout. Keep them, with G5 reuse only.
- **Target:** `shared/PersonaChip.tsx` `<PersonaChip persona size>` on ink, using on-ink text tokens (see H). SideNav reads `PERSONAS.kirsty`, or the viewer helper from 43a.
- **Behaviour contract:** text name, avatar `aria-hidden`.
- **Migration:** 2 sites, S. No test selectors.
- **Upcoming phases:** 40 (SideNav Patients badge), 43 (`SyntheticDataBadge` in the harness bar and SideNav), 43a (`shared/viewer.ts`, Help in the SideNav footer). Fold into 43a, or do the persona read now as a tiny fix.
- **Value:** low to medium. The harness bar is demo chrome.
- **Confidence:** high.
- **Catalogue rows:** admin `SideNav (with RolesInfo)` (no AppShell row).

### G7 · "!" attention disc and warning markers
- **Job:** a small solid warning disc with "!" (conflict or List attention) or a triangle (booking warnings).
- **Members:**

| name | file:line | apps | call sites |
|---|---|---|---|
| `ConflictDot` | apps/admin/components/conflicts/ConflictDot.tsx:8 | A | 3 |
| DayGrid legend and block "!" | apps/admin/components/DayGrid.tsx:355,362,478 | A | 3 |
| mobile calendar "!" | apps/mobile/screens/MyAvailabilityCalendarScreen.tsx:192 | M | 1 |
| web calendar "!" | apps/web/screens/MyAvailabilityCalendar.tsx:190 | W | 1 |
| `WarningTriangle` | shared/warnings/WarningTriangle.tsx:16 | A W M | 11 |
| DayGrid block warnings badge | apps/admin/components/DayGrid.tsx:483 | A | 1 |

- **Differences:**
  - 13px disc with a 9px "!": INTENDED, the Admin Day mockup verbatim.
  - The 9px disc in the legend swatch: INTENDED (host size).
  - Calendar sizes 11 and 14: DRIFT. `ConflictDot` 14 with x 0.64 gives a 9px glyph, so it is close.
  - Grid count inside the badge vs `WarningTriangle` count beside: UNSURE (question 6).
  - A11y: the block "!" (DayGrid.tsx:478) is not `aria-hidden`, so "!" is read into the block button's name. The reasons do reach AT through the button `title`. A minor gap, not "no label at all".
- **Target:** `shared/warnings/AttentionDot.tsx` (moved from `ConflictDot`): `<AttentionDot size glyph="!"|"triangle" tone="warning|error|muted" label?>`. It renders `role="img"` with `aria-label` when labelled, else `aria-hidden`. `WarningTriangle` composes it.
- **Behaviour contract:** `WarningTriangle`'s `role="img"` with `aria-label` and `title`. Never interactive (US-13.7.3).
- **Migration:** about 8 inline sites in 4 files. Risks: `booking-warning`, `data-strength` (warnings.test, visual/warnings.spec, admin-phase09), `daygrid-block-warnings`. Size S to M.
- **Upcoming phases:** 33a (`StubMarker` beside grid and row counts, reusing 15a's triangle anatomy), 43 and 43a (DayGrid). Land first, so 33a reuses it.
- **Value:** medium. Visible in the conflict demo beat.
- **Confidence:** high.
- **Catalogue rows:** admin `ConflictDot`; admin/web/mobile `WarningTriangle`; admin `DayGrid`; web `My availability month grid (DayCell)`; mobile `My calendar month grid`.

### G8 · Day chip (picked date with a close X)
- **Job:** the chosen day as a teal chip button that closes the day view.
- **Members:**

| name | file:line | apps | call sites |
|---|---|---|---|
| `WebDayChip` | apps/web/screens/ListsLookback.tsx:81 | W | 1 |
| `DayChip` | apps/mobile/screens/ListsLookback.tsx:166 | M | 1 |

- **Differences:** h32 vs h44 and X 14 vs 16. INTENDED (mobile touch targets, CLAUDE.md).
- **Target:** `shared/schedule/DayChip.tsx` with `size` from `useSurface()`. One aria-label.
- **Behaviour contract:** button with a full-sentence `aria-label` (both have it today).
- **Migration:** 2 sites. Risk: `mobile-lists-day-chip` (ForwardListsScreen.test, visual/routing, visual/lookback). Size S.
- **Upcoming phases:** none found.
- **Value:** low to medium.
- **Confidence:** high.
- **Catalogue rows:** web `WebDayChip`; mobile `DayChip`.

### G11 · Progress label: ProgressPill vs ListRow's right cluster
- **Job:** a List's progress word and tone (to finish, ready, submitted, authorised, invoiced).
- **Members:**

| name | file:line | apps | call sites |
|---|---|---|---|
| `ProgressPill` | shared/schedule/ProgressPill.tsx:21 | W M | 4 |
| ListRow `RightCluster` | shared/schedule/ListRow.tsx:73 | M | inside ListRow |

- **Differences:**
  - ListRow repeats the label and tone mapping: DRIFT in logic.
  - ListRow's `5px 10px` 11/600 pill and stacked tick: INTENDED (Mobile App mockup verbatim; ProgressPill.tsx:24).
  - ProgressPill's `3px 9px` 12 has no mockup. UNSURE: it could take `lg` from G1.
- **Target:** one `progressTone(progress)` and label source in ProgressPill.tsx, read by both. ListRow keeps its mockup anatomy.
- **Behaviour contract:** passive.
- **Migration:** 1 file. Risk: `data-progress` (ListsScreen.test). Size S.
- **Upcoming phases:** 33a (`StubMarker` on rows), 40 (`BalanceAlertChip` on List rows), 43a (ForwardListsScreen).
- **Value:** medium (Forward Lists is the most demoed screen).
- **Confidence:** medium to high.
- **Catalogue rows:** web `ProgressPill`; mobile `ProgressPill`; mobile `ListRow`.

### G12 · "Capture" cue inside a row button (narrowed)
- **Job:** a teal-tint cue saying what tapping the whole row does.
- **Members:**

| name | file:line | apps | call sites |
|---|---|---|---|
| mobile cue | apps/mobile/screens/ListDetailScreen.tsx:310 | M | 1 |
| web cue | apps/web/screens/ListDetailView.tsx:282 | W | 1 |

- **Differences:**
  - Mobile `9px 16px` matches the Mobile App mockup verbatim.
  - Web `7px 14px`: UNSURE (desktop density, no mockup).
  - BillingLinesCard is out: Phase 39b deletes it.
- **Target:** export `buttonPillLook` from Button.tsx and use it for both spans, with padding by surface.
- **Behaviour contract:** decorative. The row button carries the name.
- **Migration:** 2 sites, S.
- **Upcoming phases:** 21a, 23 and 24 touch ListDetailView rows; 43a sweeps the anaesthetist screens.
- **Value:** low.
- **Confidence:** medium.
- **Catalogue rows:** mobile `Booking card (Capture pill)`.

---

## Dropped or rejected
- **G13:** every member matches its mockup, and status tints are the Solutions Plus legend colours (memory note; RFP AR-15 p.46).
- **G14:** different jobs, tiny. Literal colours go to H.
- **G9 and G10:** owned by E G2 and C G6. Evidence for E is in the summary row above.
- **`AgeChip`, "Prior balance", web leave pills, StatTile "+n%", BillingLinesCard add button:** deleted by phases 38, 40, 38, 38 and 39b. Do not migrate.
- **DemoIntegrations "n messages":** a caption pill on a demo surface that Phase 34 moves.
- **The sweep's rejections stand:** StatusBlock, DemoBadge, TickBadge vs the authorised disc, IdChip, the holiday chip, switches and bars.

## Intended differences to keep
- **Pill sizes taken from the mockups:**
  - Admin Review: "Submitted" `6px 12px` 12; flag `4px 10px` 11.
  - Web Dashboard: Approved and Pending `4px 10px` 11; "+8%" `2px 7px` 11; who's-free chips `5px 11px` 12.
  - Mobile App: List row pills `5px 10px` 11; Capture cue `9px 16px` 13.
  - Mobile Availability: "Free" tag `3px 9px` 11, no dot.
  - Authority: `docs/design/*.dc.html`, PROGRESS convention 17.
- **SideNav count badge** in crimson or warning solid, `2px 8px` 11/700: Admin Day and Admin Review mockups; PROGRESS "crimson-as-identity ... count badge".
- **Avatars:** crimson-tint persona and colleague avatars on web and admin at the mockup sizes. Elevated white on mobile: PROGRESS 2026-07-24.
- **DayGrid "!" disc** at 13/9: Admin Day mockup.
- **Selected chips:** solid teal on single-choice filters vs teal tint on option chips (Web Availability and Mobile App mockups). Teal tint on claimed modifier codes (Phase 19b review).
- **Warning tint** on the Draft Lists count and `UnassignedPill`: DraftListParts.tsx:1 to 6.
- **The six status colours** and their tints on ListRow pills and the Free tag: Solutions Plus legend.

## Questions for the user
1. **Table pill size:** adopt the Admin Review mockup's `4px 10px` 11/600 as the one table size (`lg`), and `1px 8px` as the inline size? *Recommended: yes.*
2. **Preferred pill:** keep Phase 17's teal tint, or follow the later "no teal on labels" rule (success tint)? *Recommended: success tint, unless Preferred is meant to read as a selection.*
3. **HistoryTimeline "n changes" pill:** teal (it sits on a teal action line) or neutral? *Recommended: neutral.*
4. **Move sheets:** keep neutral grey `Initials` for colleagues, or use the crimson tint as the availability screens do? *Recommended: keep neutral (its comment gives the reason).*
5. **ListRow "New" badge in ink at 700:** intentional extra emphasis? *Recommended: yes, keep it; delete the unused `OutOfHoursPill`.*
6. **Grid warnings badge vs `WarningTriangle`:** keep count-inside on the grid block (too tight for count-beside)? *Recommended: yes.*
7. The sweep's ACC chip question is moot: Phase 38 deletes `AgeChip`.

## Bugs found
- **DayGrid "!" read aloud** (DayGrid.tsx:478): the glyph is not `aria-hidden`, so "!" enters the block button's accessible name. Sure (code read); low severity.
- **`nameWithoutTitle` strips only "Dr"** (shared/format.ts:133), while `domain/names.ts` `TITLE_PREFIX` strips Dr, Mr, Ms, Mrs, Miss and Prof. So `initialsOf("Ms A. Reid")` gives "MA", and `surnameFirst` (apps/admin/util.ts:85) would misfile a non-Dr name. Confirmed, but latent: every current caller passes an anaesthetist name. Fix by reusing `TITLE_PREFIX`.
- **`ActiveCount` shows "0"** while sibling rail counts hide at zero. This is a consistency defect, not a functional bug.
- **SideNav persona literals** (SideNav.tsx:97 to 100): not a visible bug, since the values match `PERSONAS.kirsty`.
- **Count corrections:**
  - Shared `<Pill` has 20 sites in 11 files (24 includes ListRow's private `Pill`).
  - Radius spellings: `borderRadius: 999` 86, `99` 33, `radius.pill` 36 (non-catalogue `.ts`/`.tsx`).
