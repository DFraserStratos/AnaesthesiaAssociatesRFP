# Review 04 - Key design principles and open questions

**RFP source:** `docs/rfp-reference/RFP.md` lines 751-822
**Reviewed:** 2026-07-27
**Lens:** demo-readiness (see `00-SUMMARY.md` for method)
**Note:** MISSING / PARTIAL claims in this file are unverified. `00-SUMMARY.md` carries the
adjudicated verdicts after the adversarial pass.

This section is unusual: it is ten architectural *assertions* plus six *questions*, not a feature
list. For the ten principles the test applied here was behavioural - does the store/reducer code
actually enforce the rule, is there a green test on it, and can a workshop audience see it. For the
six open questions the test was: does the prototype take a position, is that position recorded in
`PROGRESS.md` / `REQUIREMENTS.md` §11, and is it visible to the audience (in-app copy or the
presenter material).

## Coverage table

| # | RFP feature or rule | Req ID | Status | Where in the app | Evidence |
|---|---|---|---|---|---|
| 1 | Fixed canvas `Schedule → Day → Anaesthetist → List`, 2 Lists (AM, PM) per anaesthetist per Day, rolling 4-month horizon, regardless of use | D1, P10 | BUILT | `aa-prototype/src/domain/seed/canvas.ts` (the one generator); horizon in `aa-prototype/src/domain/clock.ts` | `canvas.ts:78` builds exactly one List per (anaesthetist × date × session); `clock.ts:85-87` horizon = today -14d to +4 months; test `seed.test.ts:60` "holds exactly 2 Lists per anaesthetist per day across the whole horizon"; visible as "3,877 lists" and "Canvas invariant holds: exactly 2 Lists per anaesthetist today" in `visual/shots/demo-data.png` |
| 1a | Canvas rolls forward as the horizon advances (not seeded once) | D1 | BUILT | `aa-prototype/src/store/clockActions.ts` | `canvasRoll.test.ts:62` the rolled far edge deep-equals a fresh generation, one `canvas.rollForward` audit row per rolled day |
| 1b | "~85 anaesthetists × ~120 days × 2 ≈ 20,000 List records" is a lightweight dataset | P10, N4 | BUILT | generator scale test + a narrated footer on the admin day grid | `canvasRoll.test.ts:198` generates 85 × full horizon (~23,000 Lists) inside a 2-second budget with invariants intact; footer copy in `visual/shots/a-01-day.png` ("At production scale (~85) this view pages and virtualises... scale is narrated here, not simulated") |
| 1c | "every **active** Anaesthetist" | D1 | PARTIAL | `Anaesthetist.active` is stored and editable but has no consumer | `clockActions.ts:42` passes `Object.keys(state.masters.anaesthetists)` (all, not active only); `active` is read only for display at `MasterData.tsx:184` and in `EditAnaesthetistSheet.tsx:23` |
| 2 | Adding an Anaesthetist populates their forward schedule so the canvas is ready to accept bookings | D1, A6 | BUILT | `addAnaesthetist` in `aa-prototype/src/store/mastersActions.ts` | `mastersActions.ts:241` generates `today..horizon.end` for the new registration number; test `mastersActions.test.ts:86` deep-matches a fresh generation and asserts 2 per day; the master-data screen says "Adding one extends the canvas forward" (`visual/shots/a7-04-masters.png`) |
| 3 | Status / Hospital / Surgeon / Cards are painted onto the canvas, not part of its shape | D1, D2 | BUILT | `List` type; `canvas.ts` fill order | `types.ts:301` List carries `statusKey`, optional `hospitalId`/`surgeonId`; Cards are a separate `schedule.cards` record keyed by `listId` (`types.ts:370`); `canvas.ts:116-148` paints status from availability, then template, then slot RNG |
| 3a | A List's status is meaningful with no Cards attached; status is not derived from Card activity | D1, N2 | BUILT | store never derives status from Cards | `visual/shots/a-01-day.png` shows Ngata Unavailable, Beaumont Holiday, five Free sessions, all card-less; `visual/shots/demo-data.png` shows Chen PM Private with 0 cards; `setAvailability` restatuses only a truly-Free List and conflict-flags an empty-but-reserved one (`lifecycle.ts:729-742`, test `lifecycle.test.ts:424`) |
| 3b | Presence or absence of Cards never changes the canvas structure | D1 | BUILT | no card action adds or removes a List | `cardActions.ts` only writes `schedule.cards`/`procedures`; the only List creation/removal paths are the generator, `addAnaesthetist` and `reassignList`'s absorb/regenerate pair (`lifecycle.ts:600-622`) |
| 3c | Status is repaintable onto a canvas slot by the office | D1, A2 | PARTIAL | no runtime action sets `statusKey` to private/public/preop; the admin grid derives a booked *display* instead | `editList`'s patch deliberately excludes status (`lifecycle.ts` ListPatch; PROGRESS Phase 06 decision 5); `DayGrid.tsx:110-111` renders a card-bearing Free List as a Private block; `ForwardListsScreen.tsx:104` and `ListsScreen.tsx:72` do not, so the same List reads "Free session" to the anaesthetist |
| 4 | The List is the unit of availability: AM/PM granularity across all anaesthetists for a given day | W3, A1, M8 | BUILT | web Availability, admin Day view, mobile Availability | `visual/shots/w-06-availability.png` (anaesthetist × AM/PM grid, "Find cover fast. Free sessions are clickable.", "Free only · 5" filter); `visual/shots/a-01-day.png` (14 anaesthetists × time-of-day, "17 sessions · 5 free" header) |
| 5 | Master/reference data decoupled from the schedule tree, referenced by ID | D5, A6 | BUILT | `masters` slice vs `schedule` slice | `seed/index.ts:389-405` fifteen flat id-keyed master records (anaesthetists, surgeons, hospitals, insurers, organisations, contracts, contractPrices, rvgCodes, modifierCodes, listStatuses, permanentLists, availability, holidays, patients, billableParties) separate from `schedule` at `:406-411`; master-data screens in `visual/shots/a7-04-masters.png` |
| 6 | Permanent List master (Hospital, Day of Week, Anaesthetist, AM/PM) populates the rolling canvas as the horizon advances; template vs generated instance | D1, D5 | BUILT | `canvas.ts` template step; `permanentLists` master | `canvas.ts:114` and `:119-123` fill the slot from the weekday template; `seed.test.ts:81` "derives roughly 80% of surgeon-assigned Lists from Permanent Lists (0.7 to 0.9)"; new far-edge days use the same generator (`canvasRoll.test.ts:62`) |
| 7 | Anaesthetist Availability and Hospital Holiday are independent inputs, reconciled against the canvas, never merged into the List record | D5, M9, A1 | BUILT | `setAvailability` / `addHospitalHoliday` write the master, then reconcile | `lifecycle.ts:696` writes the `AnaesthetistAvailability` master row then reconciles the slot's List (restatus only when truly Free, else `ListConflict`); `mastersActions.ts:313` stamps a `holiday`-kind conflict onto already-booked Lists; tests `lifecycle.test.ts:400/414/424/437/446/457` and `mastersActions.test.ts:140`; two amber "!" conflict badges visible in `visual/shots/a-06-wed.png` |
| 8 | Lists support reassignment between Anaesthetists at short notice, with Cards, status history and audit trail undisturbed | D7, A3 | BUILT | `reassignList` in `aa-prototype/src/store/lifecycle.ts`; `ReassignListFlow` in admin | `lifecycle.ts:611` reassigns by rewriting only `anaesthetistId` on the same List id, so `cards.listId`, `statusKey` and the audit entries keyed to that id all survive; three audit rows (`list.reassign`, `list.absorb`, `list.regenerate`); test `lifecycle.test.ts:296` asserts card ids identical, both anaesthetists still hold exactly 2 Lists, vacated slot regenerated; screenshots `visual/shots/a-07-reassign-pick.png`, `a-08-reassign-confirm.png`, `a-09-reassigned.png` |
| 9 | Cards remain dynamic until the day of the procedure: added, amended, reassigned right up to the procedure date | D3, D6 | BUILT | lifecycle-state gating rather than a date gate (the RFP's own state table) | `lifecycle.ts` `editRefusal` matrix: anaesthetist edits own DRAFT, office edits DRAFT and SUBMITTED, nobody edits AUTHORISED; tests `lifecycle.test.ts:183-237`; no date guard anywhere, so a today-dated or past DRAFT List stays editable |
| 9a | ...from multiple sources (surgeon integration, hospital integration, anaesthetist mobile app) | I1, I2, I3, M7, A2 | BUILT | HL7/FHIR feeds, PDF ingestion, mobile/web ad-hoc + photo, office phone advice | `integrationActions.test.ts:48/68/99/109/118/128/244` create, retime, cancel, cross-List move and PDF-ingest Cards with `source:'integration'`; `AddCardFlow` on mobile (`MobileApp.tsx:180`) and web (`ListDetailView.tsx:167`); office via `PhoneAdviceBooking.tsx` |
| 9b | Office can add a Card to an already-booked List (the routine "surgeon's rooms ring" case) | A2 | PARTIAL | admin drawer offers "Book (phone advice)" only on a Free *and empty* List | `ListDrawer.tsx:39` `isFreeEmpty` and `:98` gate the only office add-card entry point; no other admin surface mounts `AddCardFlow` (grep for `AddCardFlow` returns mobile, web and `PhoneAdviceBooking` only) |
| 9c | Reinforces the last Modified By / last Modified At requirement at Card level | D3 | PARTIAL | stored and stamped, never rendered | `mutate.ts:190-202` stamps `lastModifiedBy`/`lastModifiedAtISO` in the same commit as the audit entry (procedure and billing-line edits stamp the parent Card); tests `mutate.test.ts:30-75`; no screen renders either field (grep `lastModified` across `src` returns only seed, store and fixtures) - see `visual/shots/a-04-card.png` |
| 10 | Full audit trail is structural: complete who/what/when history on Card and Procedure, not just audit columns | D3, D4, N3, A7 | BUILT | `mutate()` wrapper; `audit` slice; audit viewer + per-record History | `mutate.ts:150-209` every mutation writes `{who, role, source, action, before, after, atISO}` and throws if a caller passes no meta; `audit: [...state.audit, ...entries]` is the only write, so the log is structurally append-only; `mutate.test.ts:77` append-only + sequential ids, `:91` refuses a meta-less write; `storeDiscipline` (`mutate.test.ts:122`) mechanically proves `mutate.ts` is the only `setState` caller for domain slices; surfaces: `AuditViewer.tsx:51` ("Append-only (convention 7)") in `visual/shots/a7-07-audit.png` and the per-record `HistorySheet` in `visual/shots/a7-08-history.png` |
| 10a | Billing route, governing Contract and price override are covered by that history | D4, A7 | BUILT | procedure-level audit merged into the Card's History | `HistorySheet.tsx:9-19` takes the Card id **plus** its Procedure and BillingLine ids, so route/contract/override edits (audited as `procedure`/`billingLine` entities) appear on the Card's History |
| 10b | An invoice raised today must be reproducible against what was true then, even if Contract terms change later | D4, B6 | BUILT | captured BTM inputs persist as data; invoice lines snapshot the rate into the description | `invoiceBuild.ts:244-258` (InvoiceLine carries no rate/hours fields; nothing recomputed after commit); test `billingRun.test.ts:367` "snapshot immunity: mutating the contract or its price list after billing leaves the invoice unchanged"; `Procedure` persists asaClass, selected modifiers, `baseUnitsSelected` and `timeUnitsCaptured` with provenance (`types.ts` Procedure; seed example `cards.ts:388-391`) |
| 10c | "Points toward an append-only change log rather than mutable records with audit columns - a choice to be made deliberately" | D3, N3 | BUILT | the prototype implements both, deliberately | Append-only `audit` array (`mutate.ts:208`) **and** `lastModifiedBy/At` columns (`types.ts:395-397`), reconciled by 7th review A8; convention 7 in `PROGRESS.md` records the ruling |
| OQ1 | How is a Card/Procedure modified concurrently by multiple sources handled? | §11, D3 | OUT-OF-SCOPE | multi-user concurrency is an explicit §10 exclusion; the stance is audited last-write-wins | `REQUIREMENTS.md` §10 ("multi-user concurrency") and §11 pure discovery items (stance stated: single-user by design, audited last-write-wins, multi-source reality demonstrated via audit trail + `lastModifiedBy` + Phase 11 live integration updates); presenter line in `docs/demo-guide/04-presenter-cheat-sheet.md` §9. No in-app callout (grep `concurren` in `src` returns one seed procedure description only) |
| OQ2 | Precise mechanism for reassigning a List at short notice, preserving Card/status/audit history | D7, §11 | BUILT | position taken, implemented, guard-tested and labelled in-app as a proposal | `lifecycle.ts:543-548` docstring; `ReassignListFlow.tsx:102` renders "Proposed reading: the RFP leaves the precise reassignment mechanism open... This mechanism is replaceable."; §11 registers it; cheat sheet §5 |
| OQ3 | Availability and Hospital Holiday reconciled as hard constraints, soft warnings or something else | D5 | BUILT | position taken: advisory conflict flags, never a hard block | PROGRESS Phase 06 decision 1; `lifecycle.ts:793-801` writes a `ListConflict` message instead of changing state; amber badge + border + tooltip in `visual/shots/a-06-wed.png`; cheat sheet §6 |
| OQ4 | Should the Insurer route eventually get its own rate table distinct from the Hospital Contract model? | B2 | PARTIAL | registered as a pure discovery item; no position, and not flagged anywhere the audience can see | `REQUIREMENTS.md` §11 pure discovery items lists it; grep of `src` for `rate table` / `own rate` returns nothing; absent from `docs/demo-guide/04-presenter-cheat-sheet.md`'s ten discovery items |
| OQ5 | Hospital accepts the route then disputes or fails to pay: fallback to Billable Party, or is Hospital final? | B2, B6 | PARTIAL | registered as a pure discovery item; no position, and not flagged anywhere the audience can see | `REQUIREMENTS.md` §11 pure discovery items lists it; grep of `src` for `disput` / `non-payment` / `fails to pay` returns nothing; absent from the cheat sheet's ten discovery items |
| OQ6 | How are Patient and Billable Party records deduplicated and archived at scale? | D8, X3 | BUILT | position taken and demonstrated (the RFP defers this to its own later section) | Shared `upsertPatient` NHI dedupe (`intake.ts`, tests `intake.test.ts`); Xero contact resolution + archive job over patients *and* billable parties with a configurable inactivity window (`archiveActions.ts`, `archiveActions.test.ts`); narrated scale counters and the archiving callout visible in `visual/shots/demo-xero.png` |

## Findings

### 04.1 - A Free List that receives a booking is never repainted, so its Cards are invisible in both anaesthetist apps  [PARTIAL]

- **RFP says:** "Status, Hospital, Surgeon, and Cards are painted onto the canvas, not part of its
  shape." (line 764)
- **Built:** `statusKey` is written only by the generator, by availability reconciliation and by
  `reassignList`'s vacated slot. `editList` deliberately never touches it
  (`aa-prototype/src/store/lifecycle.ts`, ListPatch; PROGRESS Phase 06 decision 5), so a
  phone-advice booking leaves the List at `statusKey: 'free'` while setting its hospital, times and
  Card. The admin day grid compensates with a derived display: `DayGrid.tsx:110-111` renders a
  card-bearing or hospital-bearing Free List as a Private block.
- **Gap:** two things. (a) There is no path at all by which the office paints private / public /
  pre-op status onto a slot, so the "painted status" half of principle 3 is demonstrated only for
  the generator and for leave. (b) The compensating derivation exists in the admin grid only. The
  anaesthetist's mobile Forward Lists (`ForwardListsScreen.tsx:104-118`) renders any
  `statusKey === 'free'` List as "Free session · Open for bookings or cover" with an offer-cover tap
  and no card count, and the web Lists table marks it non-clickable and describes it as "Free / open
  for cover" (`ListsScreen.tsx:50` and `:72`). The Card the office just booked is therefore
  unreachable from both anaesthetist surfaces.
- **Would a workshop audience notice:** possibly. The demo script's S2 Beat 2 states the expected
  result as "the new Card appears on that List, immediately visible in the anaesthetist's app while
  the List is `DRAFT`" (`docs/demo-guide/03-demo-script.md`). If the presenter phone-books onto Dr
  Souter's Free session and then switches to the Mobile app to prove it, the row reads "Free
  session". In practice Souter has no Free session on the design day (Tue 21), so the mismatch
  surfaces only if the presenter books on Souter's own free slot on another date or is asked to.
- **Severity:** notable

### 04.2 - The office cannot add a Card to an already-booked List  [PARTIAL]

- **RFP says:** "Patient Cards within a List are not finalised once created - they can be added,
  amended, or reassigned right up to the procedure date, from multiple sources" (lines 787-789)
- **Built:** `createCard` itself is source-agnostic and audited, and integrations do add Cards to
  already-booked DRAFT Lists (the seeded S12 feeds route onto Souter's templated St George's Tue 28
  AM List, `aa-prototype/src/domain/integrations/messages.ts:125`). The anaesthetist apps carry
  "Add a card" on their own DRAFT Lists (`ListDetailView.tsx:130`, `MobileApp.tsx:180`).
- **Gap:** the only office entry point is "Book (phone advice)", and the admin List drawer gates it
  on `isFreeEmpty` (`ListDrawer.tsx:39` and `:98`) - Free status *and* zero active Cards. So the same
  Free List accepts exactly one phone booking, and an already-booked private List accepts none from
  the office. No other admin surface mounts `AddCardFlow`.
- **Would a workshop audience notice:** likely if asked. "A surgeon's rooms ring to add a patient to
  tomorrow's St George's list, show me" is an obvious evaluator probe for an office-centric system,
  and the answer would have to be "from the anaesthetist's app" or "via the hospital feed".
- **Severity:** notable

### 04.3 - The seeded audit trail is too thin to demonstrate principle 10, and S5 Beat 1 over-promises  [PARTIAL]

- **RFP says:** "A full audit trail is a structural requirement... must support a complete history of
  changes (who, what, when), not just a single last Modified By / last Modified At summary." (lines
  794-802)
- **Built:** the mechanism is genuinely complete and provable (see coverage row 10). The seed,
  however, deliberately writes audit rows only for staged lifecycle facts (PROGRESS decision
  2026-07-23, "Seed audit is minimal"): 37 audit entries against 170 Cards and 173 Procedures, as
  the Data inspector shows (`visual/shots/demo-data.png`).
- **Gap:** David Chen's Card - the one the guided script points at - is seeded with a single
  `card.complete` entry (`aa-prototype/src/domain/seed/cards.ts:373-391`, whose only audit write is
  the `auditComplete` flag at `:195-208`). Its "T adjusted +1 manually" story is seeded as state
  (`timeUnitsCaptured {units: 4, source: 'overridden'}`), not as an audit row. Yet
  `DemoControlPanel.tsx:457` (S5) says "open David Chen's much-edited Card History for the full audit
  trail" and `docs/demo-guide/03-demo-script.md` S5 Beat 1 promises "a full audit trail, including the
  manual time-unit adjustment provenance". From a pristine reset the History sheet shows one line.
- **Would a workshop audience notice:** yes, on the exact beat scripted to showcase the RFP's
  audit requirement. The fix is either a richer seeded trail on one exemplar Card or a script change
  telling the presenter to make two or three live edits first (which does produce a rich trail).
- **Severity:** notable

### 04.4 - `Anaesthetist.active` is an editable flag with no behaviour behind it  [PARTIAL]

- **RFP says:** "every **active** Anaesthetist has exactly two Lists (AM, PM) projected forward for
  every Day in the horizon" (lines 752-753)
- **Built:** the canvas generator projects two Lists per day for every anaesthetist in the masters
  record. `clockActions.ts:42` passes `Object.keys(state.masters.anaesthetists)`;
  `mastersActions.ts:273-280` does the same for a newly added anaesthetist.
- **Gap:** `active` is never read by the generator, the day grid, the availability grid or any
  selector. It is displayed in the masters table (`MasterData.tsx:184`) and editable in
  `EditAnaesthetistSheet.tsx:23`, so setting an anaesthetist inactive is a visible no-op: their two
  Lists keep generating and their row keeps appearing on the day view and availability grid.
- **Would a workshop audience notice:** only if someone toggles the flag during the master-data tour
  and then checks the day view. Nothing in the demo script does so.
- **Severity:** cosmetic

### 04.5 - `lastModifiedBy` / `lastModifiedAtISO` are stamped but never shown  [PARTIAL]

- **RFP says:** principle 9 "reinforces the last Modified By / last Modified At requirement at the
  Card level" (lines 790-791)
- **Built:** the mutation wrapper stamps both fields on the touched Card in the same commit as the
  audit entry, including for Procedure and BillingLine edits
  (`aa-prototype/src/store/mutate.ts:190-202`, tests `mutate.test.ts:30-75`).
- **Gap:** no screen renders either value. A grep for `lastModified` across `aa-prototype/src`
  returns only the seed builders, the store writers and a test fixture. The Card detail body offers a
  "History" affordance instead (`visual/shots/a-04-card.png`), which answers the underlying need more
  fully but is not the named field.
- **Would a workshop audience notice:** an evaluator ticking off the RFP's Card field list would find
  the field absent from the screen. The History sheet is the mitigation and is one tap away.
- **Severity:** cosmetic

### 04.6 - Two of the six open questions have no position and no talking-point surface  [PARTIAL]

- **RFP says:** "Should the Insurer billing route eventually support its own rate table structure...?"
  (lines 812-814) and "What happens if a hospital accepts billing for a Procedure... but subsequently
  disputes or fails to pay - is there a defined fallback to the Billable Party, or is the Hospital
  route final once resolved?" (lines 818-820)
- **Built:** `REQUIREMENTS.md` §11 registers both as "pure discovery items (RFP open questions the
  prototype flags as talking points but needs no reading for)". Four of the six questions are
  genuinely surfaced somewhere the audience sees them: OQ2 in the reassign dialog
  (`ReassignListFlow.tsx:102`), OQ3 as advisory conflict badges plus cheat-sheet §6, OQ1 as
  cheat-sheet §9, OQ6 as the Xero archiving callout (`visual/shots/demo-xero.png`).
- **Gap:** OQ4 and OQ5 are flagged nowhere the audience can see. No in-app callout (grep of
  `aa-prototype/src` for `rate table`, `own rate`, `disput`, `non-payment`, `fails to pay` returns
  nothing) and neither appears among the ten "RFP ambiguities: present as discovery decisions" items
  in `docs/demo-guide/04-presenter-cheat-sheet.md`. §11's own claim that the prototype "flags" them is
  therefore unfulfilled for these two.
- **Would a workshop audience notice:** these are the RFP author's own questions, so they are among
  the likeliest to be asked back. The presenter currently has no prepared line for either.
- **Severity:** notable (presenter-material gap, not an app-code gap)

## Deliberate exclusions in this section

| Excluded | Why it is not a gap |
|---|---|
| Concurrency control (locking, optimistic versioning, merge) for OQ1 | `REQUIREMENTS.md` §10 excludes multi-user concurrency outright; §11 states the prototype's stance (single-user by design, audited last-write-wins) and demonstrates the multi-source reality via the audit trail, `lastModifiedBy` and Phase 11's live integration writes. Adopted as 4th external review #8. |
| Seeding the production roster (85 anaesthetists, ~20,000 Lists, ~28k invoices/yr) | Logged decision: the 14-strong design-day cast is a user decision for mockup fidelity; scale is *narrated* (day-grid footer, Xero volume counters) and *proved by test* (`canvasRoll.test.ts:198`, 85 × horizon within 2s), not simulated. 6th review #9 and 5th review #11; `REQUIREMENTS.md` N4 and §10. |
| A "Returned" List state, which would be one obvious answer to reassignment/correction | Binding convention 6 and D6: no Returned state; the office fixes issues by phone (`logListNote`), structurally asserted by `lifecycle.test.ts:573`. |
| Availability windows creating conflicts at *generation* time | PROGRESS decision 2026-07-23 ("Availability reconciliation, both directions"): approved leave is already-actioned office knowledge, so a templated booking under a leave window generates a clean Holiday List; conflicts at generation come only from hospital holidays over booked Lists. Runtime `setAvailability` is where conflicts arise. |

## RFP tensions in this section, and the choice made

| Tension | RFP lines | Resolution the prototype chose | Decision ref |
|---|---|---|---|
| Principle 8 requires reassignment but the RFP leaves the mechanism open (restated as OQ2) | 782-786, 808-810 | Free-target only, absorb the target's empty List, regenerate the vacated slot, keeping exactly 2 Lists per anaesthetist per day. Guard-tested and labelled a replaceable proposal in the confirm dialog. | `REQUIREMENTS.md` §11; PROGRESS 1st external review #3, relabelled by 4th review #6; Phase 06 decision 8 |
| Principle 7 says availability/holiday data is "expected to be reconciled... (e.g. flagged conflicts, surfaced as constraints)" without saying hard or soft (restated as OQ3) | 777-781, 810-812 | Advisory only: an amber conflict flag with a message, never a block; free slots restatus, booked slots conflict-flag. | PROGRESS Phase 06 decision 1 |
| Principle 3 says status "is not derived from Card activity", yet the office needs a booked-looking block after a phone booking onto a Free slot | 764-767 | Stored `statusKey` is never derived from Cards; the admin day grid derives a *display* status instead (`DayGrid.tsx:110`). See finding 04.1 for the surfaces where the derivation is missing. | PROGRESS Phase 06 decision 5 |
| Principle 10 says the append-only-log vs audit-columns choice "should be made deliberately as part of the technical design" | 799-802 | Both: an append-only `audit` array as the history of record, plus `lastModifiedBy/At` columns stamped in the same commit for the RFP's named Card field. | Binding convention 7; 7th external review A8 |
| Principle 1 ("canvas does not grow or shrink with activity") vs principle 2 ("if an Anaesthetist is added, their forward schedule needs to be populated") | 752-760, 761-762 | The canvas grows with the *roster* and with the *horizon*, never with activity: `addAnaesthetist` extends forward, `advanceClockDays` generates the far edge, reassignment absorbs and regenerates so the 2-per-day count is invariant. | `REQUIREMENTS.md` D1, D7; PROGRESS 3rd external review #3 |

## Beyond the RFP

- **Slot-hashed deterministic generation.** Each slot derives its own RNG from
  `hash(SEED, anaesthetistId, dateISO, session)` (`aa-prototype/src/domain/seed/slotHash.ts`), so
  generation is order-independent and a rolled far edge is byte-identical to a fresh full-horizon
  seed. That is what makes the canvas-roll guarantee *provable* rather than asserted
  (`canvasRoll.test.ts:62`). The RFP asks for a rolling canvas, not for this property.
- **Vacated-slot status is the office's choice** (Unavailable, Free or Holiday) in the reassign
  confirm step (`ReassignListFlow.tsx:17-21`), with `list.absorb` and `list.regenerate` as first-class
  audit actions so the mechanics are inspectable in the trail.
- **Cover request flow on Free sessions** (mobile bottom sheet, web "Ask to cover"), an addition from
  the design run rather than the RFP (`requestCover` in `lifecycle.ts`; PROGRESS decision
  2026-07-21).
- **Roster-order / A-to-Z toggle, day notes and needs-attention badges** on the admin day view
  (`visual/shots/a-01-day.png`) - operational affordances the RFP's principles do not name.
- **The Data inspector** (`/demo/data`) exposes the canvas invariant and live entity counts as a
  demo-only surface (`visual/shots/demo-data.png`), which is how principle 1 can be *shown* rather
  than described.
- **A mechanical store-discipline test** (`mutate.test.ts:115-140`) proves by source scan that only
  `mutate.ts` writes domain state, making principle 10's "no mutation without an audit entry" a
  build-time guarantee rather than a code-review convention.
