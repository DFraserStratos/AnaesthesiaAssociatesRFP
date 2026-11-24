# Decisions

Settled rulings about how the prototype (`aa-prototype/`) is built. Check here before you "fix" something
that looks wrong: these were chosen on purpose. What the system does (Bookings, Contracts, prices, the
ledger, moves, warnings as rules) is in the requirements catalogue, `requirements-board/requirements/`;
this file holds only the prototype's own readings and build rules. CLAUDE.md's rules still apply and are
not repeated. To overturn a ruling, change it here in the same commit as the code.

Paths are relative to `aa-prototype/src/` unless they start with `docs/` or `aa-prototype/`.

## Store, audit and persistence

- **Only `mutate.ts` writes domain state.** One commit appends the audit entries and stamps `lastModifiedBy/At`. Why: the audit trail is the product's answer on traceability. The `storeDiscipline` test in `store/mutate.test.ts` fails on `.setState(` anywhere but `mutate.ts` and `clockActions.ts` (clock only).
- **Audit is append-only; a save is one change set.** A save, create, cancel, move, reassignment or applied hospital row groups its entries under one `CS` id (`mutate`'s `changeSet` option or `withChangeSet`). History screens read change sets above view-only coalescing. `store/mutate.ts`, `domain/changeSets.ts`, `shared/audit/`.
- **Every audit action code has a label.** A source-scanning test fails if a new code is emitted unlabelled. `shared/audit/actionLabels.ts`, `fieldLabels.ts`.
- **IDs are deterministic, never UUIDs.** Seed ids are structured (`L-<reg>-<date>-<session>`, `S-<reg>-<date>-<session>` for sessions); runtime ids come from per-entity counters through `allocateId`; runtime Lists are `LG####`. A List id is never parsed for its date or owner. `store/mutate.ts`.
- **Denormalised List fields.** A List's `anaesthetistId`, `dateISO` and `session` copy its Slot's and are written only by the actions that set `slotId`; the seed invariant test checks them.
- **Persistence: one store, key `aa-demo`, version mismatch reseeds.** Same-version loads go through `backfillMerge`, which overlays persisted onto fresh exactly one level deep, so a new sub-key never crashes an old store and a deleted record is never resurrected. Deeper shape changes still need a `PERSIST_VERSION` bump. `store/appStore.ts`, `store/persistMigrate.test.ts`.
- **Tests use isolated, non-persisted stores** from `createAppStore()`; only the app uses the persisted singleton.
- **Single-user by design.** Saves apply in order onto real state, no row versions, merge rules or clash sheet; another actor's save shows a notice. Concurrency is Future Work.
- **The anaesthetist writes through; the office drafts and saves.** Anaesthetist capture taps (steppers, chips, time stamps) are each one audited write that drives the value-tick, never debounced; free text commits on blur. Office Booking edits go to a draft store and land on Save as one change set; commands (Mark complete, Cancel, moves, update email) act on saved state and are disabled while the draft is dirty. `store/bookingSaveActions.ts`, `store/draftMode.ts`.
- **Lifecycle has no Returned state.** Nothing exports a return, unsubmit, reject or revert action; a structural test in `store/lifecycle.test.ts` asserts it. UI can never bypass a guard.
- **Authorise has one blocker seam.** `authoriseBlockersFor` returns only "Needs a price"; warnings never block authorise or submit. `domain/billing/reviewFlags.ts`, `store/lifecycle.ts`.
- **Conflicts are derived, reconciled inside `mutate()`.** A `ListConflict` stores a cause and references, never a message; `describeConflict` words it from current records, so a rename updates every line. Never stamp conflicts from an action. `store/conflictReconcile.ts`, `domain/conflicts.ts`.
- **Warnings are derived by one pure routine; only clearances are stored.** A clearance lives outside the Booking (`schedule.warningClearances`), so clearing never touches a locked Booking. `domain/warnings/routine.ts`.
- **One diagnostics log.** `reportDiagnostic` is the only console writer, NHIs redacted. Don't add `console.*` calls. `store/diagnostics.ts`.

## Seed and determinism

- **Generation draws nothing.** Canvas generation writes Slots free, paints the calendar, then recurring bookings. The seeded RNG survives only for the seed's recorded window (`seedRecordedWindow`) and filler Bookings, so the RNG sequence and every seeded Booking stay fixed. `domain/recurringBookingProjection.ts`, `domain/seed/recordedWindow.ts`.
- **The golden tests pin the seed.** `canvasGolden.test.ts` and `canvasFingerprint.test.ts` reproduce the demo window and `SEED_LIST_IDS` exactly. A failure means the seed moved: re-pin only when the move is intended, and bump `PERSIST_VERSION`.
- **Seeded conflicts are real facts.** Wed 22 Jul: Dr Rutherford's AM is Unavailable, and Southern Cross is closed (`HH900`), which flags its four Lists. Tue 21 stays clean.
- **The `L-HIST` backdrop is Dr Souter's browsable history** (January to June 2026, all paid and disbursed). Search and the date lookup reach it; office surfaces and the main view exclude it. Its locks are "Migrated history", frozen from the invoices as loaded. `domain/seed/history.ts`.
- **Seed NHI ZAE0310, not the mockup's ZAE0311.** The mockup value fails the check digit; the rule beats the mockup.
- **NHI check digits use the official Health NZ algorithms**: old format mod 11, new format mod 23. The RFP's "Modulus 24" label is wrong; both RFP examples are pinned as tests. `domain/nhi.ts`.
- **The RVG modifier table is generated, not hand-edited.** `npm run rvg:modifiers` writes `domain/seed/rvgModifiers.generated.ts` from the catalogue's AR-34 files; a drift test re-parses them. Codes are not keys (`MOD-RVG-<code>` ids).
- **Personas are fixed:** Dr Melanie Souter (anaesthetist) and Kirsty W. (office), with Sam T. as the second office user; the 14-strong cast comes from the mockups. `domain/seed/cast.ts`, `store/demoActors.ts`.

## Demo harness and simulations

- **Demo triggers live on their screen.** Every simulated event is a `DemoTrigger` in `shared/demoTriggers/registry.ts`, shown only on its route in the harness bar's "Demo actions" pill and, for PWA entries, the handset's Demo sheet. The Control Panel is an index (clock, reset, S1 to S5 jumps, "Open screen" links) and never gets trigger buttons. Product actions stay in product UI.
- **Demo-only surfaces are badged.** Simulators, the control panel, Demo actions and the PWA Demo chip carry `DemoBadge`; things the catalogue marks Future carry `DemoBadge tone="future"`. The Billing monitor itself is product UI; badge only its simulation triggers. `apps/demo/` is exempt from UI unification and the one-component guardrail.
- **Stand-ins play a colleague, never the office** (except the explicit office stand-ins). "Play the office" defaults OFF (only a stored `'on'` reads ON), is badged while on, and the framed build never auto-authorises. `store/officeStandIn.ts`.
- **A PWA stand-in never dead-ends**: if nothing fits, it creates what it needs (e.g. a request for the persona's next open session) rather than doing nothing.
- **Trigger candidates skip the scripted beats** (`SCRIPTED_BEAT_SCHEDULE`), the persona's own Lists and conflicted Lists, so a trigger never breaks a run-sheet beat.
- **Sample warnings are staged only by demo actions** and unstaged only while still theirs (the demo made the last audited change). A real edit is never reverted. `store/warningSamples.ts`.
- **The demo clock sits in the harness bar** next to the app switcher; both clock UIs read one shortcut registry, all arithmetic in `store/clockActions.ts`. It never navigates or reloads. `shared/demoClockShortcuts.ts`.
- **The next billing run for events is an explicit run** (`EVENT_RULES.nextRun: 'explicitRun'`); authorising a List never sweeps events, so S3 and S5 figures never move. `domain/billing/procedureEvent.ts`.
- **Demo settings vs product settings.** Rule parameters live in `appSettings` (product); demo modes such as `nhiHubMode` live in `DemoSettings` and Reset clears them. Simulated waits (`HUB_TIMING`) are UI timers; stored times always come from the demo clock.
- **Named office users are a harness switch** (`shell.officeUser`, Day view and Booking detail only). Accounts and sign-in are simulated audit rows (`account` entity); the PWA has a simulated account login, the framed build is signed in by default, and no IDaaS, MFA screen or social buttons are built. `shared/session/`.
- **Full-scale data is an in-memory demonstration.** Loading it pauses saving (`pausableStorage`) and drops the saved key, so Reset, a jump or a reload returns the demo data; its invoice numbers use the reserved `AA-S-` series. `store/persistStorage.ts`, `domain/seed/fullScale/`.
- **First-run hints are per-viewer browser storage**, not domain state, not audited, no persist bump. Playwright and the capture runner preset them dismissed and the PWA signed in.
- **Invoices print through the browser** (`window.print()` on the on-screen document). No PDF library.
- **No phase numbers or build scaffolding in app copy**, and no placeholder control posing as a real action. Honest simulation boundaries ("referenced, not implemented") may stay. `appCopy.test.ts` enforces this along with the dash rule and the retired words.

## Words and formatting

- **Catalogue vocabulary in identifiers as well as copy**: Booking (never Card), Lists reassigned or moved (never swapped), recurring booking (not Permanent List), no "timesheet". "Card" survives only in visual component and token names (`radius.card`, `ControlCard`). `appCopy.test.ts` refuses the retired words in rendered copy.
- **"Slot" never reaches the UI**, nor "blacklist" or "whitelist"; the UI says session. Audit codes for sessions are `session.*` and `availability.*`, because the Audit viewer prints raw codes. The master validator refuses "slot" and dashes in admin-entered labels.
- **Schedule words have one home**, `shared/scheduleTerms.ts` (Draft List, Unassigned, DRAFT, origin labels), test-checked for stray literals. List state labels come from `LIST_STATE_LABELS`, progress labels from `LIST_PROGRESS_LABEL`, and "left the main view" from the one predicate `hasLeftMainView` (`domain/listProgress.ts`).
- **One short name form, "Dr <Surname>"** (`drSurname`): both dashboard greetings and cover chips. Full name where there is room; `initialsOf` for avatars.
- **HPI CPN has one label and one formatter** (`HPI_CPN_LABEL`, `formatHpiCpn`), shape-checked only; a source-scan test refuses other wording.
- **Money prints one way, "$3,100.00"**, negatives "$-5.00", via `formatMoney` (`domain/billing/money.ts`, re-exported as `formatCurrency`). `parseAmount` is the one input parser.
- **Date text has one home**, `domain/dateText.ts` (re-exported from `shared/format.ts`): "Tue 21 Jul to Fri 24 Jul" in the apps, "1 Oct 2026 to 1 Nov 2026" for money and contracts, stamps "Tue 21 Jul, 08:00".
- **The internal patient id is never shown**; the NHI is the identifier in routes, search and copy.

## Navigation and app structure

- **Real routing in all three apps**; the URL map lives in `router.tsx`, so a refresh keeps your place. Lists homes carry `?day=` and `?q=` (written with replace); drill-ins pass `state.from` so Back returns to the same day or results. Keep the legacy `cards/:cardId` redirects.
- **One body, two surfaces.** Shared sheets and Booking bodies render through `useSurface()` (`shared/surface/`): mobile gets bottom sheets and a slide stack, web gets dialogs and a desktop grid layout (named slots, `Pair`). Never branch on platform inside a shared body.
- **The phone frame is the only mobile emulation.** Mobile screens never read the viewport or `env()`; they read the four `--aa-inset-*` properties that `PhoneFrame` or the PWA's `MobileViewport` supplies. Locked by `visual/mobile-insets.spec.ts`. The frame is adapted from `docs/design/ios-frame.jsx`.
- **Mobile tab bar: Lists · Availability · Balances · More.**
- **What the anaesthetist sees is one predicate**, `viewerOf` (`shared/viewer.ts`), checked both ways by `apps/anaesthetistSimplicity.test.tsx`: Contract internals, Change price, billing set-up, preferences and tiers are office only.
- **Mockups are a UI baseline, not a feature spec.** A mockup flourish with no requirement behind it (e.g. Admin Review's "Duration above median" flag) is not built.

## Mobile details that are deliberate

- **Dock clearance is an in-flow `DockSpacer`, never trailing padding.** WebKit gives trailing padding no scroll extent, so the last item hides under the dock. `shared/ui/DockSpacer.tsx`.
- **The installed PWA uses `black-translucent`** so the atmosphere runs under the status bar and the real top inset is reported. `aa-prototype/pwa/index.html`.
- **The phone pins the Booking total** (`BookingTotalStrip`) and the masthead folds to pay for it, so the value-tick plays where the tap happened; History sits in the masthead status row.
- **The validation latch.** Failures show only after a refused Mark complete, then update live; the refusal focuses the first incomplete control.
- **The scheduled time is a row in the Patient section**, not a card: it is the plan, while Start and Handover are what happened. "Start now" works before the scheduled time on purpose.
- **No NHI format pill** on patient cards; dual-format validation stays in `domain/nhi.ts`.

## Design system readings

These settle questions the design files left open; `docs/archive/ui-unification/README.md` has the history.

- **Touch target floor is 44px**, though the Design Language says 48.
- **Mockup sizes are type tokens as drawn** (`type.small` 12.5, `captionSm` 11.5, `labelLg` 13.5, page titles 24 and 28), not rounded to the scale.
- **Fields**: a grey well inside a white sheet, card or dialog; white on the page or phone canvas. 48px in sheets and forms, one 36px compact size for toolbars and tables. One focus ring for fields (`.aa-field`) and one for controls (`.aa-ctl`); the admin calendar keeps crimson, the admin side nav keeps the browser ring.
- **Overlays**: one modal stack (one Escape closes one layer); web dialogs show the corner X, phone sheets show none (the handle closes); titles are `OverlayHeader` at 18/700; `SheetActions` stacks primary over secondary on the phone, one row on web with the primary last.
- **Buttons**: `Button` defaults to the touch size (54px primaries in sheet footers); `desktop` 44 and `compact` 36 elsewhere. `variant="danger"` is used once, for Cancel booking; "Remove" is a teal `TextAction`; Disable is a neutral secondary. `IconButton` requires a label.
- **Controls stay buttons** (`aria-pressed` or `aria-current`); only page switches are links, drawn as underline `LineTabs`. Breadcrumbs only on Review and Invoices; every other back is `BackLink`.
- **Result lines that report success are success green; info notes are neutral** (no teal on labels). The Preferred pill is the success tint.
- **Pill sizes**: `lg` for table pills, `md` inline, `sm` compact.
- **Admin tables** take the Admin Review header (11/600 caps on `bg`) with `compact` or `dense` density. Mobile cards are radius 14. One `Eyebrow` caps label at 11/600.
- **The one-component guardrail only shrinks.** `apps/oneComponentPerJob.test.ts` has an allow-list with ceilings; never add to it, extend the shared component instead. The live catalogue (`/demo/catalogue/*`) is grouped by family.
- **Fonts are self-hosted** woff2 in `aa-prototype/public/fonts/`, preloaded from both HTML entries; latin-ext is required for macrons. Not Google Fonts (blocks render, can't be precached). `theme/global.css`.
- **TS tokens are the runtime source**; `global.css`'s Tailwind `@theme` mirrors them. Most components style inline from the tokens.

## Invariants enforced by tests

- **No NHI or personal details in the Xero slice.** `store/xeroNhi.test.ts` serialises the whole slice against the seeded NHIs; the Xero sim shows only the hidden internal id and ContactID. Don't weaken it.
- **Domain code is pure** (no React, no store): `domain/domainPurity.test.ts`.
- **The status palette is defined once** (`STATUS_PALETTE`, `theme/statusColours.ts`); `domain/statusTokenParity.test.ts` keeps it in step with the tokens. Availability statuses are a master that picks a token; statuses retire, never delete, and their ids (`free`, `holiday`, `unavailable`, `ST####`) never change. One display key, `displayStatusKey(slot, list)` (`domain/slots.ts`).
- **The shared type-ahead is one component and one matcher** (`NameSearchBox`, `matchesNameQuery`): finders filter after ranking, never reorder.
- **Draft Lists sort by one comparator**, `compareDraftLists` (date, AM before PM, longer wait, id).

The full history behind these (478 entries, most since superseded) is the Decisions log in
`docs/archive/prototype-build/PROGRESS.md`. Read it only when a ruling here needs its back story.
