# AA Prototype · Build plan progress

The record of this plan's phases (45 on), written by phases only: routine fixes and polish (the
`app-change` skill) never touch it. The plan's tools parse the status rows, the phase entry headings
and the Decisions-log lines, so keep their formats exact. The build record of phases 00 to 44 and U1 to
U7 is archived in `docs/archive/prototype-build/PROGRESS.md` (large: grep it, never read it whole).

## Status

| # | Phase | Status | Session date | Notes |
|---|-------|--------|--------------|-------|
| 45 | The Contracts section and the Contract page | DONE | 2026-11-25 | Contracts is its own Admin section with the list moved there, every Contract has a page at its id with cards saved one at a time, a newest-first price ranges table, an "On this Contract" rail and a confirmed Disable, and old Master data links redirect. |
| 46 | The New contract page | DONE | 2026-11-25 | New contract is its own page at `/admin/contracts/new`, filled in rule order with numbered steps, a live "Where it will show" and the holder's similarly named Contracts as a hint, landing on the new Contract's page; the side-panel editor and its Replaces picker are gone. |
| 47 | The grouped Contract catalogue | DONE | 2026-11-25 | The Contract list is a grouped catalogue: six groupings from a pure `groupContracts`, an index of groups with counts beside it, search, Active, Disabled or All, the grouping and group in the URL, the grouping remembered per office user, and the holder filter folded into the holder grouping. |

Rows: `| <id> | <title> | DONE | <YYYY-MM-DD> | <one-sentence summary> |`, or `IN PROGRESS` at a
checkpoint, in run order.

## Binding conventions (all phases)

Copied from the archived PROGRESS with their numbers kept, the dated amendments folded in. Conventions
marked *Process* are now carried by the `run-build-phase` skill and this plan's ROADMAP standing rules.

1. **App location.** The app lives in `aa-prototype/` at the repo root. This plan lives in `docs/build-plan/`; the earlier build record in `docs/archive/prototype-build/`. Never create a second app folder.
2. **Stack is fixed.** Vite + React 18 + TypeScript (strict, no `any`), React Router, Zustand for the store, Tailwind CSS + a design-token layer (`src/theme/`), lucide-react icons, date-fns, Vitest for unit tests. No additional UI framework without a `docs/DECISIONS.md` entry.
3. **Folder shape.** `src/domain/` (types, seed, billing maths, validators: pure, no React), `src/store/` (Zustand slices, lifecycle guards, audit writer), `src/apps/mobile/`, `src/apps/web/`, `src/apps/admin/`, `src/apps/demo/` (demo-only surfaces: control panel, Xero sim, integrations, billing monitor), `src/shared/` (cross-app components), `src/shell/` (app switcher, phone frame, layout).
4. **Mock backend only.** Components never own domain state; they read/write through typed store hooks. No `fetch`, no real endpoints. Simulated external systems (Xero, the HL7 and FHIR simulator on the Future-scope surface `/demo/integrations`, the rooms' PDF sample upload with its simulated reading) are store actions, registered in `src/shared/demoTriggers` and shown on their screen (harness bar "Demo actions" menu or the PWA's Demo sheet); the demo control panel is their index, and demo screens may also host them.
5. **Deterministic seed.** All seed data generated from a seeded RNG + pinned demo date (`DEMO_TODAY`, 2026-07-21, the design mockups' content date). Same seed, identical data. Reset restores the pristine seed. Never call `Date.now()`/`new Date()` for domain logic: use the demo clock.
6. **Lifecycle rules live in the store.** ACTIVE, SUBMITTED, AUTHORISED transitions are guarded functions; SUBMITTED strips anaesthetist edit rights; AUTHORISED locks Bookings immutable; there is **no Returned state**. DRAFT means a Draft List with no anaesthetist. UI can never bypass a guard.
7. **Audit is append-only.** Every Booking/Procedure mutation (and List reassignment/state change) writes an audit entry `{who, role, source, action, before→after, at}`. No mutation without one. A save (and a create, cancel, move, List reassignment or applied hospital row) groups its audit entries under one change-set id (`AuditEntry.changeSetId`, `CS` ids, the kind on the first entry) through `mutate`'s `changeSet` option or `withChangeSet`.
8. **NHI never crosses to Xero.** Xero-sim screens and data show only the hidden internal ID (ContactNumber) and ContactID, checked by tests.
9. **Billing maths is pure and tested.** All fee/unit/route/split logic lives in `src/domain/billing/` as pure functions with Vitest tests. UI only formats results.
10. **Catalogue vocabulary, one palette.** Domain terms follow the requirements catalogue, which supersedes the RFP: Booking (not Card) in identifiers and copy, Lists reassigned or moved (never swapped), no "timesheet". The six status colours are the palette (`STATUS_PALETTE`, six Design Language tokens, defined once in `src/theme/statusColours.ts`); the availability statuses are a user-maintained master (`masters.slotStatuses`) that picks a token and treatment, and the List types map to their own tokens. The legend is built from the List types plus the active statuses, in all three apps.
11. **Ease of use wins arguments.** When choosing between fidelity to the legacy screenshot and a simpler modern pattern, choose simpler, but keep the information architecture recognisable.
12. **Two mobile hosts, one layout.** The mobile app renders under `PhoneFrame` (the prototype's only emulation: the fixed phone frame on a grey backdrop) and `MobileViewport` (`src/pwa/`, the installed PWA on a real handset). Neither the screens nor the shared surfaces read the viewport or `env()` directly: they read the four `--aa-inset-*` custom properties the mounting host supplies (`src/theme/global.css`, the `host` prop on `MobileApp`, `aa-prototype/README.md`). The framed pixels are locked by `visual/mobile-insets.spec.ts`. Web and admin are desktop layouts.
13. **Demo-only surfaces are visibly demo-only.** Xero sim, integration simulator, billing monitor internals, the control panel, the harness bar's "Demo actions" menu and the PWA's Demo chip and sheet carry a demo badge ("demo simulation" / "Demo trigger") so audiences don't mistake them for proposed product UI. (The billing monitor itself IS proposed product UI: badge only its simulation triggers.) Tooling the catalogue marks Future is badged "Future scope" (`DemoBadge tone="future"`).
14. *Process.* **Every phase ends the same way:** the full gate green (`npm run build`, `npm run build:pwa`, `npx vitest run`, the board check, and `npm run shots` for UI work), the manual test checklist run, the adversarial review-and-fix pass (18), the recipes and demo guide in step, this file updated (status row, phase entry, any Decisions-log lines), a commit when green (never a push), and the app runnable with `npm run dev`. The `run-build-phase` skill, Stages 4 to 7.
15. **Don't gold-plate ahead.** Build only what the current phase's doc lists; later phases depend on the seams described in their docs, not on speculative extras.
16. **Mobile is mobile-first, not a web app in a phone shell.** Bottom sheets and slide-in cards, never centred desktop modals; bottom tab bar; thumb-reachable and sticky contextual actions; steppers, chips and segmented controls over dropdowns and free text. Micro-delight lives in action feedback and never delays a task. The two web apps are proper desktop layouts (hover states, keyboard-friendly tables).
17. **The `docs/design/` mockups are the authoritative visual reference.** `Design Language.dc.html` is the token source of truth: palette, neutrals, the six status colours (with tint/on-tint values and the hatched Unavailable / dashed Free treatments), type (Schibsted Grotesk UI + Spline Sans Mono data with tabular-nums), 4pt spacing, radii (ctl 10 / card 14 / panel 20 / sheet 24-top / pill 999), elevations e-0 to e-3, scrim rgba(23,35,32,0.32), and the six named motion patterns (control-press, selection-slide, sheet-in 320/260ms, card-advance 260/240ms with −24% parallax, complete-tick, value-tick; reduced-motion gives 80ms fades). The six sample pages are the layout reference for their screens; each phase doc names its pages. Two hard rules: (a) AA crimson #A91E3E is identity only (masthead, active nav, avatars), never buttons, never status; deep teal #0D6E63 is the only action colour. (b) **Where a mockup simplified a business rule for demo purposes, the catalogue's rule wins** (`docs/DECISIONS.md`). Extend the design's patterns to screens it doesn't cover; don't invent a second visual language.
18. *Process.* **Adversarial review-and-fix pass after every phase.** About three independent Opus reviewers in parallel, one per lens: quality (conventions, design tokens, one component per job, no gold-plating), bugs and correctness (guards, lifecycle, determinism, purity, audit, maths) and plan adherence (every work item, checklist item and covered item delivered; scope fences; `docs/DECISIONS.md` rulings honoured), plus the lenses the phase doc steers. The phase's session verifies each finding against the code and the catalogue before touching anything (never fix on a paraphrase, never re-raise a settled ruling), fixes the confirmed ones with a test where a bug had none, re-greens, and records the pass in the phase entry. The `run-build-phase` skill, Stage 5.
19. **Catalogue screenshots match the app, captured on approval.** A phase creates or updates the capture recipes (`requirements-board/requirements/capture/recipes/`) for every item it covers and every recipe its changes broke, keeps `capture/ATLAS.md` current, and hands over with the recipe IDs. The capture (even `--dry`) runs only after the owner has tested and approved the phase: then `phase-check.mjs --capture <IDs>` (or `--capture all` for a broad change), the shots checked by eye, `npm run verify:board` green, and the capture committed. ROADMAP.md "Catalogue screenshots" spells it out; record the recipe IDs and, after capture, the REPORT.md counts in the phase entry.
20. **A check that should alert, not stop, is a warning rule.** It is a rule in `src/domain/warnings/rules/` (registered in `WARNING_RULES`, its id in `WarningRuleId`, its facts from `store/warnings.ts`'s `warningFactsFor`, its parameters in `appSettings`) with a sample in `src/store/warningSamples.ts`. It never becomes a blocker in `lifecycle.ts`, a confirm step at submit or a tap-to-read popover: the shared triangle, the Booking's warnings panel, the Day view outline and the To-do card show it with no UI change.
21. **One component per job.** UI is built from `src/shared/{ui,surface,table,calendar}`; a shared component that cannot do the job gets a variant or prop that defaults to today's look, never a copy in a screen file; shared components keep their `shot` and `data-*` hooks; the `/demo/catalogue/*` rows change with them. `src/apps/oneComponentPerJob.test.ts` enforces it (CLAUDE.md "One component per job").
22. **The demo guide matches the app.** Each phase brings `docs/demo-guide/` and the hand-maintained `master-demo-guide.html` in step for exactly what it changed, with figures read from the running app (ROADMAP.md "Demo guide").

## Decisions log

Settled prototype rulings live in `docs/DECISIONS.md`: read it before "fixing" anything that looks
wrong, and never re-litigate a ruling there. The archived catch-up Decisions log
(`docs/archive/prototype-build/PROGRESS.md`, `## Decisions log`) is history only.

This section holds the rulings this plan's phases make, one line each, in this format (the tools parse
it): `- **<YYYY-MM-DD> · Phase <id> (<n>): <title>** (<ids>; supersedes ...). <body>`. A phase also adds
each lasting ruling to `docs/DECISIONS.md`.

- **2026-11-25 · Phase 45 (1): The Contracts section and the Contract page** (D92, D93; US-04.1.7). Contracts is its own Admin section between Ledger and Master data; a Contract's page is `/admin/contracts/:contractId`, keyed by the id; every in-app link goes through `apps/admin/contractsPaths.ts`; `/admin/masters?view=contracts` (with `&contract=` or `&holder=`) redirects from `mastersRedirect` and stays after 49. See the Phase 45 entry.
- **2026-11-25 · Phase 45 (2): One card, one change; Disable confirmed** (D96's 45 half; US-04.1.3, US-04.1.2, DM-04; OQ-144 at D90's default). Each Overview card saves only its own fields as one audited `contract.update` in one change set, refused on the card; Disable asks first over `stillOnContract` from `disableFromISO` (today), moves nothing, and Make active undoes it. DECISIONS "Buttons" amended: the confirm's primary is the second `danger` use.
- **2026-11-25 · Phase 46 (1): New contract is a page in rule order** (D96's 46 part; US-04.1.2 New contract order and Similar name; supersedes catch-up D79's warning-only "Replaces" on create, 25a). `/admin/contracts/new` replaces the create panel; the form's rules are `contractDraft` over `billsPayerOnly`, `takesLinks`, `isRvgKind` and `CHOOSABLE_PRICING_KINDS`; "Already held" is `similarContracts`, a hint only; Create lands on the Contract's page by its id. `ContractEditSheet` and its Replaces picker are deleted; a dated change is a new Contract by hand until 49. See the Phase 46 entry.
- **2026-11-25 · Phase 46 (2): D23's caption has one home** (OQ-73, D23). "A prepaid Contract always bills the payer, awaiting AA's confirmation." lives in `screens/contracts/new/NewContractPage.tsx` (`PREPAID_BILLS_PAYER_HELPER`), the one `MUST_KEEP` pin; the Contract page's "Who it bills" card imports it.
- **2026-11-25 · Phase 47 (1): The grouped Contract catalogue** (D96's 47 part, finishing US-04.1.2; D91 at its default). The Contract list groups six ways through `groupContracts` (`domain/billing/contractGroups.ts`), the one place that says where a Contract sits; "Invoice goes to" reads only `destinationOf`, so a hospital's untagged Contract is under Special until OQ-145 is answered. A two-surgeon Contract is under both; "All Contracts" counts distinct Contracts. `?group=` and `?in=` (ids) carry the view; `?holder=` becomes `?group=holder&in=<PartyId>`. See the Phase 47 entry.
- **2026-11-25 · Phase 47 (2): System Contracts and the remembered grouping** (US-04.1.2). System Contracts group by their own settings, with no separate "No contract" group: AA's head Kind and Holder, Patient heads "Invoice goes to", they are "Not linked to a surgeon" and open-priced. Each office user's last grouping is `shell.contractGrouping` (persisted shell slice, unaudited, optional so no `PERSIST_VERSION` bump), cleared by Reset; the URL wins over it.

## Discovered for later

Known open work lives in `docs/BACKLOG.md`: a phase adds there what it discovers and leaves undone,
and deletes the line of anything it finishes. Items here are only those a later phase of this plan must
pick up by name.

## Phase entries

Each entry is headed `### Phase <id> · <title> (<YYYY-MM-DD>)`, after the last one.

### Phase 45 · The Contracts section and the Contract page (2026-11-25)

**Drift check against 5f87781.** Nothing changed in substance (US-04.1.7, US-04.2.15, US-04.1.2, US-04.1.3, OQ-144; domain model unchanged). OQ-144 still open: built to D90's default (Disable acts at once after its confirm; no date on a Contract). Built in one session, through the checkpoint.

**Built.**
- Section and routes (D92): `apps/admin/contractsPaths.ts` (`contractsPath`, `contractPath`, `newContractPath`, `partyPath`, `ContractTab`, `parseContractTab`); router `contracts` block (list and `new` share `AdminContractsRoute`, `:contractId` under `RequireEntity`); side nav "Contracts" between Ledger and Master data. `mastersRedirect` (D93) in `AdminMastersRoute`.
- List moved to `screens/contracts/` (`ContractsSection` on `AdminPage fit` with `ContractsTabs`: Parties and Funding tags link to Master data until 48; `ContractsView`, rows open the page). New contract still opens `ContractPanel`, now create only, over the list.
- `ContractPage` on `ProfilePage` (new `tabs` prop): header with AA code, status, System pills and `ContractDisable`; tabs Overview, Bookings, Event fees, History (`?tab=`, counts); system and disabled notices; rail "On this Contract" (`onContract`: not-yet-authorised Procedures, then authorised Bookings at `LockedAgainst.lockedPrice`).
- Overview cards (`ContractCards.tsx`): price (`PriceRangesTable`, or rate, discount or override), where it is offered, who it bills (holder Party's billing name and delivery read-only, "Open the Party"), invoice and codes (`DefaultRvgCodeField`), fixed when created. Each saves its own fields through `editContract`, which now groups a `contract.update` in one change set (`changeSet: 'save'`). System Contracts edit only `SYSTEM_CONTRACT_EDITABLE_FIELDS` (`systemPatch`).
- Price ranges table: newest first, From, To, Price, Change (`rangeChange`, `rangeChangeText`), Procedures (`proceduresPerRange`, store `pricedPerRange`), In force and Future pills, ended ranges fold after three, add and correct as rows, kept-price notice kept. `ContractPriceRanges.tsx` deleted.
- Disable: `ConfirmSheet` `confirmVariant` and `size`, `disableFromISO` (today), `StillOnNotice` moved to `screens/contracts/`. Shared `Card` `footer` and `editing` (token `accent.editingRing`).
- Triggers: `demo-backdated-range` on `/admin/contracts` and the Face lift's page (screen "Admin · Contracts", label unchanged); sample sheets read `adminContracts.tab` first. S5 Beat 4 opens the Health NZ agreed rate. No seed change: PERSIST_VERSION unchanged.

**Tests.** New `ContractPage.test.tsx` (replaces `ContractEditSheet.test.tsx`), `PriceRangesTable.test.tsx`; extended `priceRanges.test.ts`, `contractChangeSelectors.test.ts`; updated `specialtiesTags`, `demoTriggers`, `loadTriggers`, `demoScenarios`, `appCopy` (D23 `MUST_KEEP` row for `ContractCards.tsx`), `anaesthetistSimplicity`. Eight Playwright specs moved to the page (one checks the redirect); two stale seed counts fixed in them. Gate: typecheck, build, build-pwa, Vitest (420 files, 4,636 tests) and verify-board pass; shots 386 passed, 48 failed, all pre-existing on master and none in the Contract specs (listed in `docs/BACKLOG.md`; two specs this phase broke by adding the side-nav "Contracts" were fixed). verify-board needed `images: []` in `US-04.1.7.md` and `US-04.1.8.md` (format only).

**Checked.** Checklist 12 of 12 pass (`.build-phase/45-checklist/`). Design pairs at 1440 and 1280 against `contracts-section.html` #record and #updating (`.build-phase/45-design/`): cards restacked full width with label-left rows as #record draws them; Disable confirm widened for its list.

**Review.** Bugs, quality and plan lenses. Fixed: prepayment-held and no-lock Procedures counted in the Procedures column; two `?view=contracts` link builders left (Go-live, loaded rows); New contract reset the list's filters; Bookings count mixed Procedures and Bookings; a corrected row could fold away; the default RVG code field duplicated; a private rail row link; `toFixed` in the table; weak tests strengthened. Declined: the D23 caption in both files (the doc asks for it).

**Catalogue screenshots.** None run (prompt override: the owner's sweep). Recipes reaching the panel or `?view=contracts`: US-04.1.1, US-04.1.2, US-04.1.3, US-04.1.4, US-04.2.1, US-04.2.2, US-04.2.8, US-04.2.11, US-04.2.14, US-04.2.15, US-04.2.16, US-04.2.17, US-04.2.18, US-05.2.8, US-05.5.1, US-03.7.1, US-13.4.1, FT-04.1; new US-04.1.7.

**Demo guide.** Not touched (sweep): S5 Beat 4's "Master data, Contracts" wording and the trigger's screen label "Admin · Contracts".

**Handoffs.**
- 46: replace `ContractPanel` (create only, `flows/ContractEditSheet.tsx`) at `/admin/contracts/new` (`newContractPath`, `AdminContractsRoute`'s `creating`); reuse `Card` `footer`/`editing`, `ProfilePage` `tabs`, `DefaultRvgCodeField`, `PREPAID_BILLS_PAYER_HELPER` (pinned in both files until the panel goes).
- 47: the list is `screens/contracts/ContractsView.tsx` under `ContractsSection`; `?holder=` is still a filter.
- 48: `ContractsTabs` in `ContractsSection.tsx`, `mastersRedirect` (add the `parties` and `fundingTags` cases), `partyPath`, the `adminContracts.tab` demo context key (`'contracts' | 'parties' | 'fundingTags'`).
- 49: the header action slot (`ContractPage` `action`, `ContractDisable`), `disableFromISO` in `store/contractChangeSelectors.ts`, `StillOnNotice` in `screens/contracts/`, `onContract`, the fixed card's FieldHint for the Replace pointer.

**Deviations.** Committed with the shots check red on 48 pre-existing failures (above), so the lanes can start. Cards stack full width beside the rail (#record) rather than on `PROFILE_GRID`. `ConfirmSheet` also gained `size`. The list's header copy and its Edit column changed with the move. The trigger's index path is a literal in `registry.ts` (the PWA closure cannot import `contractsPaths.ts`). `US-04.1.7.md`'s `images:` set to `images: []` (format only) so verify-board round-trips it.

**For the owner's review.** The 48 pre-existing Playwright failures on master (BACKLOG). Built defaults: "Procedures priced" (not yet authorised: no typed or prepaid price; authorised: locked at this range, not typed or prepaid); "On this Contract" counts every not-yet-authorised Procedure, past Lists awaiting review included; tab in `?tab=`; Change as % on the range before ("First" on the oldest); "Open the Party" and the Parties and Funding tags tabs go to Master data until 48; the confirm's primary is danger; several cards may be in edit at once; no unsaved-changes prompt. "Edit in panel" never shipped; create stays in the panel until 46. `accent.editingRing` comes from the exploration page, not the Design Language. Worth a look at the end-of-lanes test (TEST-45-49.md): the Face lift (`/admin/contracts/CT-MER-FACELIFT`), No contract · RVG, and Disable on Christchurch Eye Surgery RVG.

### Phase 46 · The New contract page (2026-11-25)

Run in Lane A (`docs/build-plan/LANES.md`): the lighter gate, no review, no full Playwright, no plan page; the join reviews and gates 46 to 49 together.

**Drift check against 5f87781.** Nothing changed in substance (US-04.1.2, US-04.2.1, US-04.2.2, US-04.2.16 to US-04.2.18, US-04.3.8, OQ-73, OQ-145; domain model unchanged). OQ-73 built as answered (D23's caption). OQ-145 still open: built to D91's default (an untagged hospital Contract reads "Offered under Special").

**Built.**
- `domain/billing/contractSimilarity.ts`: `similarContracts(name, held, holderId?)`, `namesSimilar`, `nameWords` (lowercase, no punctuation, trailing "s" off, filler words dropped; similar on the first word or half the shorter name's words; under three letters nothing; system Contracts never; Disabled kept with its status). Exported from the billing barrel.
- `apps/admin/flows/contractDraft.ts`: `useContractDraft(initial)`, pure `changeDraft` (re-checks: no links on a hospital, forced payer, prepaid moves an RVG kind to Fixed price, no override off RVG, a kind change clears the rate, discount and first range), `draftRules`, `draftInput`, `draftPricing`, `holderGroups`, `EMPTY_CONTRACT_DRAFT`.
- `screens/contracts/new/`: `NewContractPage` (`AdminPage fluid`, `PageBody rail`; four `Card step` cards; Cancel and Create contract; one `FormError` in the store's words, scrolled into view), `WhereItWillShow` (`destinationHint(destinationOf(...))` in `data-shot="contract-placement"`, then one sentence), `AlreadyHeld` (similar first with a "Similar name" pill, then Active by name, five rows, See all in a new tab). Route `contracts/new` → `AdminNewContractRoute` (a `?holder=` that is not a Party is ignored); the list's New contract button already went there.
- Shared: `Card` `step` (numbered chip, `data-card-step`), `TextAction` `newTab`; both default off, README rows updated.
- Deleted: `flows/ContractEditSheet.tsx` (create panel, Replaces picker, its catalogue row and `ContractPanelExample`); `ContractsSection` lost its panel and its `actor` prop. `ContractChangeNotice`, `stillOnContract`, `proceduresStillOnContract` stay. No seed change: PERSIST_VERSION unchanged.

**Tests.** New `contractSimilarity.test.ts`, `contractDraft.test.ts`, `NewContractPage.test.tsx` (the criterion with "Abdominoplasty, simple" created in the test), a `Card` step case in `pageChrome.test.tsx`; rewritten `ContractPage.test.tsx` (New contract opens the page), `specialtiesTags.test.tsx` (no open kind among the RadioCards), `appCopy` (D23 pin moved), `anaesthetistSimplicity` (office-only names). Playwright: `admin-phase07` (the missing-name refusal on the page), `contract-warnings-phase25a` (Replaces test deleted), `overlays-u2` (picker Escape on the page); those three specs pass (9 tests). Lane gate green: typecheck, build, build-pwa, Vitest 423 files and 4,662 tests, lint.

**Checked.** Checklist 10 of 10 pass (`.build-phase/46-checklist/`, item 8 re-read after the client redirect). Design pair at 1440 against `contracts-section.html` #new (`.build-phase/46-design/`): the four pricing cards put in one row, "Not on a fixed price" drawn as a read-only field. The fields keep the shared field look (eyebrow labels, 48px wells), not the exploration's lighter sketch.

**Review.** Skipped in the lane (LANES.md): the join reviews 46 to 49 together.

**Catalogue screenshots.** None run (lane and prompt override: the owner's sweep). For the sweep: a shot of the page and of Already held with a similar match (US-04.1.2); recipes that click `contract-replaces` or the old `contract-detail` panel on create (`admin-dated-change.png`, `admin-edit-contract.png`) need re-pointing.

**Demo guide.** Not touched (sweep). No demo trigger added or renamed.

**Handoffs.**
- 47: New contract stays at `newContractPath({ holder })` from the list's button; "See all" in Already held opens `contractsPath({ holder })` (47 maps `?holder=` to the grouping). `ContractsSection` now takes no props.
- 48: link "New contract for this party" to `newContractPath({ holder: partyId })`; the page reads `?holder=` through `AdminNewContractRoute`.
- 49: `useContractDraft(initial)` and `changeDraft`/`draftRules`/`draftInput` (`apps/admin/flows/contractDraft.ts`); the step cards (`Card step`); `HolderStep`-style sections are private to `NewContractPage.tsx` (export them if the Replace sheet reuses them); `similarContracts` for the replacement's name; `PREPAID_BILLS_PAYER_HELPER` now lives in `screens/contracts/new/NewContractPage.tsx`.

**Deviations.** The page shows no section tabs (the exploration's #new draws none). Already held rows open the Contract's own page in a new tab; See all opens the list. The Bills hint for a holder that may bill either reads "Its holder, or the payer on the Procedure." `similarContracts` takes an optional `holderId` so another holder's Contracts are ignored even when passed.

**For the owner's review.** The similar-name rule (first word, or half the shorter name's words; Disabled matches shown and marked). Prepaid "Yes" moves the kind to Fixed price, with the `prepaidNotRvg` sentence on the RVG cards. See all and the rows open in a new tab; no unsaved-changes prompt on Cancel. "Where it will show" is the path plus one sentence. D91's default (an untagged hospital Contract under Special) is still open. From now until Phase 49 a dated change has no in-app helper: a new Contract by hand, no warning list.

### Phase 47 · The grouped Contract catalogue (2026-11-25)

Lane B (LANES.md): committed on `lane/b`; the lighter lane gate; no review, capture or plan page (the join does them).

**Drift check against 5f87781.** Nothing changed (US-04.1.2, OQ-145, OQ-144; domain model unchanged). OQ-145 still open: built to D91's default. 45 DONE; it shipped `screens/contracts/ContractsView.tsx` under `ContractsSection`, `contractsPaths.ts` and `mastersRedirect`.

**Built.**
- `domain/billing/contractGroups.ts`: `ContractGrouping`, `CONTRACT_GROUPINGS` (labels, default `kind`), `parseContractGrouping`, `groupContracts(list, by, { parties, fundingTags, surgeons }, words)`, `groupCount`, `NO_GROUP_KEY`, `PARTY_KIND_ORDER`, `PRICING_KIND_ORDER`. Pure; the words come in as `CONTRACT_GROUP_WORDS` (`shared/contracts/labels.ts`, beside the new `PARTY_KIND_PLURAL`), so the domain holds no copy of a label or of `surnameOf`.
- `GroupRow` `level="sub"` (small size, indented `space[4]`, `sunken` rule; `data-group-level="sub"`); the default is unchanged.
- `apps/admin/components/GroupIndex.tsx` (generic: `label`, `items`, `value`, `allLabel`, `allCount`, `onSelect`, `note`, `shot`, `data-*`), built on a new shared `OptionRow` `variant="nav"` (borderless, teal on the accent tint, `aria-current`, mono count) so no raw styled button is added.
- The catalogue (`ContractsView.tsx`): toolbar of search (260), status pills, a compact "Group by" `SelectField` (`contract-group-by`; six pills did not fit one row at 1280) and the count line ("N Contracts active in X matching "q". Grouped by kind."); `PageBody nav` holds the index (`contract-group-index`); `MasterTable` (new `footer` prop) pages at `FULL_SCALE.pageSizes.contracts` (50) with `contract-pager`. All groups under `GroupRow` headings, or a picked group under `level="sub"` sub-headings; headings repeat at a page break with their full counts. Rows keep every hook (`data-contract`, `data-system`, `data-contract-holder` on holder headings, the pills); new `data-contract-group`, `data-contract-sub`.
- URL: `?group=`, `?in=` (ids), `?page=`; `?holder=` on the list route is rewritten to `?group=holder&in=<PartyId>` (unknown Party: dropped). `contractsPath({ holder })` now writes the holder grouping, so `mastersRedirect` and the Parties view's link go there directly; `contractsPath({ group, in })` added. A group holding only Disabled Contracts opens on All.
- Back: rows navigate with router state `{ from }` (the list URL plus `?q=` for the search); `ContractPage`'s back link reads `catalogueReturnPath(location.state)`. The search stays list state (it survives New contract's panel, as 45 fixed) and is seeded from `?q=` once.
- Memory: `shell.contractGrouping` (per `kirsty`/`sam`), `setContractGrouping`, written on Group by, read on a bare URL, cleared in `resetDomainStateOnly`. PERSIST_VERSION 78 unchanged. `ContractsSection` renders the view directly (it owns its toolbar and body) and takes New contract's holder from `?group=holder&in=` too.

**Tests.** New `contractGroups.test.ts` (16), `GroupIndex.test.tsx` (2), `contractGrouping.test.ts` (2), `ContractCatalogue.test.tsx` (9), a `GroupRow level` case in `tableKit.test.tsx`; `ContractPage.test.tsx` (holder URLs) and `specialtiesTags.test.tsx` (tag grouping replaces the tag filter; rows found by search under paging) updated. Playwright: new `visual/contract-catalogue-p47.spec.ts` (5), `contracts-phase19a.spec.ts` on `?group=holder&in=PY-SOUTER`; both green (11). Lane gate green: typecheck, build, build-pwa, Vitest (424 files, 4,666 tests) and lint. `contractGroups.test.ts` uses `buildSeed()` and its own words so `domainPurity.test.ts` holds.

**Checked.** Checklist 13 of 13 pass (`.build-phase/47-checklist/`; the harness Sam switch by the store and screen tests). Design pairs at 1440 and 1280 against `contracts-section.html` #catalogue (`.build-phase/47-design/`): matches; fixed a clipped search placeholder (240 to 260) and set tag codes in mono in headings. The index sits in `PageBody nav` beside the card rather than inside it, and the count line sits in the toolbar, as the phase doc says.

**Review.** Skipped in the lane (LANES.md); the join reviews 46 to 49 together.

**Catalogue screenshots.** None run. For the sweep: recipes and ATLAS entries using `contract-holder-filter`, `contract-tag-filter` or `?view=contracts&holder=` (US-04.1.2 and others); US-04.1.2 has grouped states worth a shot (Funding tag › SXAP; Surgeon with Aria under both).

**Demo guide.** Not touched (sweep).

**Handoffs.**
- 48: `groupContracts`, `CONTRACT_GROUP_WORDS`, `GroupIndex` (`apps/admin/components/GroupIndex.tsx`) and `OptionRow variant="nav"`; a Party's per-tag counts link with `contractsPath({ group: 'holder', in: partyId })` (or `{ holder: partyId }`) and `contractsPath({ group: 'tag', in: tagId })`; the tag tab's hospital grouping can call `groupContracts(list, 'holder', ...)`.
- 46 and 49 (join): `ContractsSection` now renders `<ContractsView />` without a `PageBody`; New contract's holder comes from `?holder=` or `?group=holder&in=`. `ContractPage`'s back link line reads `catalogueReturnPath(location.state)` (one line and a `useLocation`).

**Deviations.** Group by is a select, not pills (one row at 1280). The search is not in the URL except as the back link's `?q=`. Back after switching tabs on a Contract page falls back to the bare list (tab links drop router state). The BACKLOG clause "the Contracts toolbar wraps to two rows at 1280" was not in `docs/BACKLOG.md` (already gone); nothing deleted. 45's header sub-line no longer mentions dated changes; left to 49 (LANES.md).

**For the owner's review.** Kind as the default grouping; system Contracts in AA's group (no "No contract" group); a hospital's untagged Contracts under Special (OQ-145); the memory in `shell.contractGrouping`, cleared by Reset; status not in the URL; page size 50; Group by as a select; the Holder and Funding tag selects removed; Back returning to the same grouping, group, search and page (not after a tab switch). Worth a look: `/admin/contracts?group=tag&in=TAG-SXAP`, `?group=surgeon`, `?group=destination`.
