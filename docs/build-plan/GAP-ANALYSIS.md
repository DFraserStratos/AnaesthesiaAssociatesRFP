# Build plan · Gap analysis

Catalogue snapshot `8637b65` · generated 2026-11-26 · 59 in-scope items (74 retired or Future Work excluded)

The plan was seeded empty at `64b3dff`, with no gap analysis: the prototype was taken as matching the catalogue then. Only items changed since are graded here; 262 in-scope items not graded since are left out.

**Method.** Per-epic Sonnet reviewers against six prototype maps, each review re-checked by an adversarial Sonnet verifier; plus a verified data-model delta and a verified reverse check. Supporting analysis: [prototype maps](analysis/), [data-model delta](analysis/domain-model-delta.md), [reverse check](analysis/reverse-check.md). Machine-readable data: [gaps.json](gaps.json). The development plan built from this is in [ROADMAP.md](ROADMAP.md) and [index.html](index.html).

**Verdicts.** Matches: the prototype demonstrates the requirement as now written. Partial: present but missing rules or acceptance criteria. Contradicts: implemented, but some behaviour now differs from the requirement. Missing: nothing represents it. OutOfScope: cannot be shown in a front-end demo, even with a demo button. Grouping: an epic or feature with no rules of its own. Sizes are for a Claude Code session: S under an hour, M a few hours, L about a session, XL more.

## At a glance

| Epic | Contradicts | Partial | Missing | OutOfScope | Matches | Grouping | Items |
|---|---:|---:|---:|---:|---:|---:|---:|
| [EP-01 · Schedule canvas, Slots and Lists](#ep-01) | 1 | 2 |  |  | 3 |  | 6 |
| [EP-02 · Booking intake and change handling](#ep-02) | 6 | 6 | 2 |  | 2 |  | 16 |
| [EP-03 · Booking and Procedure capture (anaesthetist)](#ep-03) |  |  |  |  |  |  | 0 |
| [EP-04 · Contracts](#ep-04) |  | 6 |  |  | 3 | 1 | 10 |
| [EP-05 · RVG master data and fee calculation rules](#ep-05) |  |  |  |  |  |  | 0 |
| [EP-06 · Prepayment](#ep-06) |  | 1 |  |  |  |  | 1 |
| [EP-07 · List approval workflow](#ep-07) |  |  |  |  |  |  | 0 |
| [EP-08 · Billing/Invoice Engine and internal ledger](#ep-08) | 1 |  |  |  |  |  | 1 |
| [EP-09 · Xero integration](#ep-09) |  |  |  |  |  |  | 0 |
| [EP-10 · Payments, disbursement and AA fees](#ep-10) |  | 3 |  |  | 1 |  | 4 |
| [EP-11 · Patients and billable parties](#ep-11) | 4 | 1 |  |  |  | 1 | 6 |
| [EP-12 · Anaesthetist profile and reporting](#ep-12) | 2 |  |  |  |  | 1 | 3 |
| [EP-13 · Admin oversight and master data](#ep-13) | 4 | 6 | 1 |  |  |  | 11 |
| [EP-14 · Health systems integration](#ep-14) | 1 |  |  |  |  |  | 1 |
| [EP-15 · Non-functional requirements](#ep-15) |  |  |  |  |  |  | 0 |
| **Total** | **19** | **25** | **3** | **0** | **9** | **3** | **59** |

Verification: 6 of 59 gradings were corrected by the adversarial verifier (see [Verification log](#verification-log)); 1 items could not be verified: EP-14 unverified.

## Not represented in the prototype

Every in-scope requirement graded Missing, by epic.

**EP-02 · Booking intake and change handling**

- [US-02.1.7](../../requirements-board/requirements/stories/US-02.1.7.md) See each source's state · Verify (3) · M. No second Sources view on the matching screen; the only source and message state is the Future-scope HL7 simulator under /demo.
- [US-02.2.3](../../requirements-board/requirements/stories/US-02.2.3.md) Detect Bookings removed from a re-sent List · Verify (3) · M. A re-sent PDF is only compared for changed or new rows; Bookings missing from it are never offered as removals.

**EP-13 · Admin oversight and master data**

- [US-13.3.3](../../requirements-board/requirements/stories/US-13.3.3.md) The Finances section · Verify (3) · L. There is no Finances section: the side nav has separate Invoices, Billing monitor and Ledger items, with no tabbed container, tab counts or single warning badge.

## Structural changes (data model)

Verification is done and docs/build-plan/analysis/domain-model-delta.md is updated to match. No delta was refuted. Every catalogue claim holds against the stories and note points, and none rests on a retired story or the Future Work lane. Every prototype claim was re-read in code. I corrected 7 deltas, upheld 3 unchanged (DM-12, DM-17, DM-19) and added 1 (DM-21). The file now has 11 open deltas, DM-11 to DM-21, with a Verified line under each.

**Corrected**
- **DM-11:**
  - Leave-out does not strictly need a new union member. `reject` already decides a row and changes nothing, so a reject with a fixed reason is the cheapest shape; a member of its own is clearer.
  - The surgeon is a per-row correction today. It has to become a List-level choice for a List-level place action.
  - The unchanged-List display depends on DM-21.
- **DM-13:** No new stored field is needed to say which Bookings the rooms brought. `Booking.source` already holds `surgeonPdf`, and decided rows carry their source.
- **DM-14:** US-14.5.1 is Future Work, so it is context only. The simulator's feed-message path (`integrationActions.ts:246`) already records what each message became and why it failed, which is a model for the derived measures.
- **DM-15:**
  - Arrival-shaped demo triggers already exist (`receiveTheatreList`, `receiveResentPdfList`), but they run as the office actor. The change there is the actor and the label.
  - `manualSheet` is also used by the PWA office stand-in.
  - Folding the PDF row corrections into `ImportRowCorrections` would lose the ethnicity correction, which the PDF path allows and `ImportRowCorrections` does not.
- **DM-16:** The PDF is not a text string. It is a generated SVG image already shown beside the values, but on the PDF lists tab before send, not on the matching screen. The real gaps are per-value confidence and location, placement on the matching screen, and the unreadable-PDF case.
- **DM-18:** The shared `SubmitListSheet` lists blockers per incomplete Booking only. It needs a List-level reason line, or it shows an empty list for a stub-only List.
- **DM-20:** The choice the author called open is already decided as D116 in `docs/build-plan/ROADMAP.md` and owned by Phase 60. The raised-but-unsent invoice alternative is closed.

**Added**
- **DM-21:** `stageImportRows` skips rows identical to ones already seen and makes no batch when every row is skipped. An identical re-sent List therefore never reaches the feed as an unchanged List, so US-02.1.6 has nothing to show or confirm. The author's DM-11 assumed unchanged rows already arrive.

I also added DM-21 to the order of work (with DM-11) and to DM-14's needs.

| ID | Kind | Change | Size | Catalogue |
|---|---|---|---|---|
| DM-11 | NewEntity | The arriving List is what the office decides | L | [US-02.1.2](../../requirements-board/requirements/stories/US-02.1.2.md), [US-02.1.4](../../requirements-board/requirements/stories/US-02.1.4.md), [US-02.1.6](../../requirements-board/requirements/stories/US-02.1.6.md), [US-01.6.1](../../requirements-board/requirements/stories/US-01.6.1.md), [US-01.3.3](../../requirements-board/requirements/stories/US-01.3.3.md), [US-11.1.5](../../requirements-board/requirements/stories/US-11.1.5.md) |
| DM-12 | ChangedRelationship | A List keeps its versions, and a match shows its keys | M | [US-02.1.3](../../requirements-board/requirements/stories/US-02.1.3.md), [US-02.2.1](../../requirements-board/requirements/stories/US-02.2.1.md), [US-02.2.4](../../requirements-board/requirements/stories/US-02.2.4.md) |
| DM-13 | NewLifecycle | Bookings missing from a re-sent List are offered as removals | M | [US-02.2.3](../../requirements-board/requirements/stories/US-02.2.3.md), [US-02.2.1](../../requirements-board/requirements/stories/US-02.2.1.md), [US-02.5.3](../../requirements-board/requirements/stories/US-02.5.3.md), [US-02.5.5](../../requirements-board/requirements/stories/US-02.5.5.md) |
| DM-14 | NewEntity | A source is an entity with a state | M | [US-02.1.7](../../requirements-board/requirements/stories/US-02.1.7.md), [FT-02.1](../../requirements-board/requirements/stories/FT-02.1.md), [US-02.1.5](../../requirements-board/requirements/stories/US-02.1.5.md) |
| DM-15 | ChangedLifecycle | Rows arrive by source, not by an office import | L | [US-02.1.1](../../requirements-board/requirements/stories/US-02.1.1.md), [US-02.1.5](../../requirements-board/requirements/stories/US-02.1.5.md), [US-02.2.1](../../requirements-board/requirements/stories/US-02.2.1.md), [US-02.2.4](../../requirements-board/requirements/stories/US-02.2.4.md) |
| DM-16 | ChangedEntity | A PDF is read with a confidence for each value, and one that cannot be read is held | M | [US-02.2.1](../../requirements-board/requirements/stories/US-02.2.1.md), [US-02.1.4](../../requirements-board/requirements/stories/US-02.1.4.md), [US-02.5.7](../../requirements-board/requirements/stories/US-02.5.7.md) |
| DM-17 | ChangedRelationship | A stub is resolved by a later arrival that carries the NHI | M | [US-02.6.3](../../requirements-board/requirements/stories/US-02.6.3.md), [US-11.1.5](../../requirements-board/requirements/stories/US-11.1.5.md), [US-02.1.3](../../requirements-board/requirements/stories/US-02.1.3.md) |
| DM-18 | RuleChange | A List holding only a stub cannot be completed or authorised | S | [US-02.6.4](../../requirements-board/requirements/stories/US-02.6.4.md), [FT-02.6](../../requirements-board/requirements/stories/FT-02.6.md), [US-07.1.1](../../requirements-board/requirements/stories/US-07.1.1.md), [US-07.3.1](../../requirements-board/requirements/stories/US-07.3.1.md) |
| DM-19 | ChangedEntity | An arrival names the anaesthetist it was meant for, and a new List is placed with that Slot suggested | S | [US-02.1.2](../../requirements-board/requirements/stories/US-02.1.2.md), [US-01.3.3](../../requirements-board/requirements/stories/US-01.3.3.md) |
| DM-20 | RuleChange | A payer with no billing address fails the Booking, with its reason and fix | S | [US-13.3.1](../../requirements-board/requirements/stories/US-13.3.1.md), [US-13.3.2](../../requirements-board/requirements/stories/US-13.3.2.md), [US-08.5.2](../../requirements-board/requirements/stories/US-08.5.2.md) |
| DM-21 | RuleChange | Identical re-arrivals are shown as unchanged Lists, not skipped | S | [US-02.1.6](../../requirements-board/requirements/stories/US-02.1.6.md), [US-02.1.4](../../requirements-board/requirements/stories/US-02.1.4.md), [US-02.1.7](../../requirements-board/requirements/stories/US-02.1.7.md) |

Detail and impact: [analysis/domain-model-delta.md](analysis/domain-model-delta.md).

## Prototype behaviour to remove or rework

## By epic

<a id="ep-01"></a>

### EP-01 · Schedule canvas, Slots and Lists

[EP-01](../../requirements-board/requirements/stories/EP-01.md) · epic status Agreed (4) · 1 Contradicts, 2 Partial, 3 Matches

> Four items checked. FT-01.3 and US-01.6.3 (both Agreed) are Matches and I found nothing wrong in the code. The one real gap is the 26 Nov 'Intake as the front door' decisions (AR-72 points 9 and 10, cited by US-01.3.3, US-01.6.1 and US-02.1.2). The matching screen decides one hospital row at a time; there is no arriving-List unit. As a result, 'Create a Draft List' from Intake saves a Draft List holding only that row's Booking, whereas US-01.6.1's new AC says it holds its Bookings. That is why US-01.6.1 is corrected from Matches to Partial (M standalone, but it should be built with US-02.1.2's whole-List decision). The named-anaesthetist Slot suggestion (US-02.1.2 AC) is also absent: PdfListSample.target.anaesthetistId is only displayed in the PDF lists tab and the createList picker starts with no one chosen. US-01.3.3 stays Matches because its own text does not state the suggestion, but with medium confidence: if the owner reads 'placing an arriving List' as whole-List placement, it moves to Partial with US-02.1.2. Dependencies: US-02.1.2, US-02.1.4, US-01.4.2 and US-01.3.5 (both already built), FT-07.1 and US-13.5.2. Demo guide: the Intake script step (Okafor PDF, 'Create a List in a session', pick Rutherford) and the Draft List beats would change only if the rebuild preselects the named anaesthetist or builds the Draft List from the whole PDF. No seed or PERSIST_VERSION change is forced by these four items.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-01.3.6](../../requirements-board/requirements/stories/US-01.3.6.md) [Anaesthetist priority tiers for assignment](epics/EP-01.md#us-01.3.6) | Verify (3) | Contradicts | Tiers 1 to 4 (default 4), office-only privacy, tier then seeded-shuffle ordering and a 'Filter by tier' control on the finder and Draft List pickers are built. But the tier saves on a single click on its own card, which the story now forbids, and the Anaesthetists list in People has no tier filter. | M |
| [US-01.1.1](../../requirements-board/requirements/stories/US-01.1.1.md) [Two Slots per anaesthetist per day](epics/EP-01.md#us-01.1.1) | Agreed (4) | Partial | The AM and PM Slot per active anaesthetist per day, starting Free, with calendar and recurring bookings painted on top and no generated OOH Slot, is built; Donald's 25 Nov note (no Slots after a last day, Slots again from the day made active) is only approximated by an immediate trim or regenerate from today. | M |
| [US-01.6.1](../../requirements-board/requirements/stories/US-01.6.1.md) [Create a Draft List](epics/EP-01.md#us-01.6.1) | Verify (3) | Partial | Creating a Draft List by hand (New Draft List form) is fully built, but the new acceptance criterion 'from the matching screen ... a Draft List holding its Bookings' is only met per row: Intake makes the Draft List with one row's Booking and the arriving List's other Bookings must be added row by row. | M |

Details for every gap: [epics/EP-01.md](epics/EP-01.md).

**Matches (3):** [FT-01.3](../../requirements-board/requirements/stories/FT-01.3.md) List assignment · [US-01.3.3](../../requirements-board/requirements/stories/US-01.3.3.md) Manual List assignment · [US-01.6.3](../../requirements-board/requirements/stories/US-01.6.3.md) Assign a Draft List to an anaesthetist

<a id="ep-02"></a>

### EP-02 · Booking intake and change handling

[EP-02](../../requirements-board/requirements/stories/EP-02.md) · epic status Verify (3) · 6 Contradicts, 6 Partial, 2 Missing, 2 Matches

> All 16 gradings upheld after re-reading the code; no verdict changed. The prototype is at the pre-26-Nov intake reading (phases 33, 34, 40): intake is row-level and button-driven. Import hospital file, Upload PDF list and Send to matching are in-app actions, PDF lists and Waiting for NHI are separate tabs, the feed is a flat row table with no List or file grouping and no source filter, and every decision is per row (IncomingBookingFields cannot even name an anaesthetist). The catalogue now wants a List-level front door: arrivals appear on their own, grouped by List, decided as a whole List with the named anaesthetist's Slot suggested, with per-key match display and List versions, unchanged Lists confirmed in one click, removals offered from a re-sent PDF, and a Sources view. US-02.1.2, 02.1.3, 02.1.4, 02.1.6, 02.2.1 and 02.2.3 share one new List-level arrival and version model and should be one phase; US-02.1.1 and 02.1.5 (remove the import button, relabel the existing trigger) are a small independent S change that could land first; US-02.1.7 (Sources view) and US-02.6.3 (later NHI resolves a stub) build on that model. US-02.6.4 (stub guard in submitList and authoriseList plus a shown reason) is standalone and S. Already matching: FT-02.3 (admin entry), US-02.2.4 (List origin, incl. later-address rule), the stub placement and Add NHI resolution, procedure text as received, Draft List from intake, Reject, nothing applied until decided, and inbound-only behaviour (not stated in the UI). Size is per item, not additive. Dependencies: EP-11 (US-11.1.4/11.1.5 NHI waiting rows move from a tab into the feed filter), FT-02.5 (change types, procedure text US-02.5.7, cancellations from removals US-02.5.3), EP-14 (US-14.5.1 failure visibility feeds the Sources view; US-14.6.x future feeds), EP-01 (Draft List creation US-01.6.1), EP-07 (submit/authorise guard), US-02.3.3 and US-13.6.5 (reply to the List's sender), OQ-13 and OQ-124 (open, no grade impact). Demo-guide impact: S1 Beat 2 ('Import, then match', the PDF lists tab, Send to matching, the Open/Unmatched/Decided strip, the Waiting for NHI tab reading 1), the optional rooms re-send aside, the Diane Foster update beat, the handset stand-ins ('Hospital file imported and my booking matched', 'Office adds the NHI', which call importHospitalDownload/decideImportRow) and the /admin/intake/waiting and /admin/intake/pdfs routes all change; demoGuideSync.test.ts must stay green when trigger labels change.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [FT-02.1](../../requirements-board/requirements/stories/FT-02.1.md) [Matching screen for incoming Lists](epics/EP-02.md#ft-02.1) | Verify (3) | Contradicts | A matching screen exists and holds every outside row with nothing applied until decided, but it is built on the superseded reading: import button, row-by-row decisions, Waiting for NHI as its own tab, no source view. | XL |
| [US-02.1.2](../../requirements-board/requirements/stories/US-02.1.2.md) [Decide an arriving List](epics/EP-02.md#us-02.1.2) | Verify (3) | Contradicts | The office decides each row separately; the catalogue now has it decide a whole List at a time, with the named anaesthetist's Slot suggested for a new List. | L |
| [US-02.1.4](../../requirements-board/requirements/stories/US-02.1.4.md) [One feed of everything waiting](epics/EP-02.md#us-02.1.4) | Verify (3) | Contradicts | The feed is a flat row table with Open/Unmatched/Decided filters and Waiting for NHI in its own tab; the catalogue wants one feed grouped by List with source and Needs NHI filters. | L |
| [US-02.2.1](../../requirements-board/requirements/stories/US-02.2.1.md) [Read, correct and ingest a surgeon PDF list](epics/EP-02.md#us-02.2.1) | Verify (3) | Contradicts | PDFs are uploaded one at a time on a separate tab with a manual Send to matching, not read from the office mailbox into the feed; no per-value confidence. Manual add with sender, side-by-side review, correction before ingest and re-sent comparison exist. | L |
| [US-02.1.1](../../requirements-board/requirements/stories/US-02.1.1.md) [Hospital bookings reach the matching screen](epics/EP-02.md#us-02.1.1) | Verify (3), [OQ-13](../../requirements-board/requirements/questions/OQ-13.md) | Contradicts | Hospital rows land on the matching screen only after an admin presses Import hospital file and picks a sample; the catalogue now says nobody imports a file. OQ-13 (format) open. | S |
| [US-02.1.5](../../requirements-board/requirements/stories/US-02.1.5.md) [Hospital rows arrive on their own](epics/EP-02.md#us-02.1.5) | Verify (3), [OQ-13](../../requirements-board/requirements/questions/OQ-13.md) | Contradicts | Hospital rows only appear after an admin presses Import hospital file; the catalogue now says rows arrive by themselves with no import or sync button. OQ-13 open. | S |
| [EP-02](../../requirements-board/requirements/stories/EP-02.md) [Booking intake and change handling](epics/EP-02.md#ep-02) | Verify (3) | Partial | All four booking sources exist and every List and Booking records its source, but the 'one front door' the epic now states is not built: hospital rows arrive by an Import button, rooms' PDFs sit on a separate tab behind a manual Send to matching, and decisions are per row. | XL |
| [FT-02.2](../../requirements-board/requirements/stories/FT-02.2.md) [Surgeon PDF list ingest](epics/EP-02.md#ft-02.2) | Verify (3), [OQ-124](../../requirements-board/requirements/questions/OQ-124.md) | Partial | Rooms' PDF read (simulated), side-by-side review, correction and re-send comparison exist, and PDF rows do reach the same matching screen, but only after a manual upload and Send to matching from a separate tab; OQ-124 is open and does not change the grade. | L |
| [US-02.1.3](../../requirements-board/requirements/stories/US-02.1.3.md) [Show why a List matched and what it changes](epics/EP-02.md#us-02.1.3) | Verify (3) | Partial | Field-level differences with current and new values are shown before applying and the match basis is named, but not per-key agreement, earlier versions, the Slot, or the hospital-updates-rooms-List framing. | L |
| [US-02.1.6](../../requirements-board/requirements/stories/US-02.1.6.md) [Confirm unchanged Lists together](epics/EP-02.md#us-02.1.6) | Verify (3) | Partial | Rows with no difference are classed 'No change' and can be marked matched with nothing to change, but one row at a time; no unchanged-Lists grouping or one-click confirm. | M |
| [US-02.6.3](../../requirements-board/requirements/stories/US-02.6.3.md) [Office resolves a stub from intake](epics/EP-02.md#us-02.6.3) | Verify (3) | Partial | Add NHI at intake turns the stub into the Booking in its place, but a later arrival (the hospital's List) carrying the NHI does not resolve a waiting stub. | M |
| [US-02.6.4](../../requirements-board/requirements/stories/US-02.6.4.md) [A List holding only a stub cannot be submitted or authorised](epics/EP-02.md#us-02.6.4) | Verify (3) | Partial | A List with a stub shows a held progress tone and a 'waiting at intake' note, but nothing stops a stub-only List from being submitted or authorised, and no reason is shown. | S |
| [US-02.1.7](../../requirements-board/requirements/stories/US-02.1.7.md) [See each source's state](epics/EP-02.md#us-02.1.7) | Verify (3) | Missing | No second Sources view on the matching screen; the only source and message state is the Future-scope HL7 simulator under /demo. | M |
| [US-02.2.3](../../requirements-board/requirements/stories/US-02.2.3.md) [Detect Bookings removed from a re-sent List](epics/EP-02.md#us-02.2.3) | Verify (3) | Missing | A re-sent PDF is only compared for changed or new rows; Bookings missing from it are never offered as removals. | M |

Details for every gap: [epics/EP-02.md](epics/EP-02.md).

**Matches (2):** [FT-02.3](../../requirements-board/requirements/stories/FT-02.3.md) Manual booking entry by admin · [US-02.2.4](../../requirements-board/requirements/stories/US-02.2.4.md) A List keeps where it came from

<a id="ep-03"></a>

### EP-03 · Booking and Procedure capture (anaesthetist)

[EP-03](../../requirements-board/requirements/stories/EP-03.md) · epic status Agreed (4) · 

<a id="ep-04"></a>

### EP-04 · Contracts

[EP-04](../../requirements-board/requirements/stories/EP-04.md) · epic status Verify (3) · 6 Partial, 3 Matches, 1 Grouping

> US-04.1.2 is split across phases: 45 (Disable confirmed, built), 46 (New contract page, order, similar-name hint, deletes the Replaces section), 47 (grouping, index, facets; closes the story). The remaining gap, the inactive anaesthetist Contract cascade and offer-back, is covered by none of 46 to 49. It depends on US-12.1.6 (anaesthetist last day and inactive state) and so belongs with the People work (Lane C domain and store half). It reuses disableContract and enableContract with a system actor, and adds a Contract-restore sheet on the anaesthetist record. The sheet can wait until Contracts files settle. OQ-144 (future-dated disable) is unresolved; the story says a Contract has no dates, so disableFromISO stays 'today', and any answer allowing a future-dated disable would contradict the No dates criterion. Shared files (ContractsView, ContractEditSheet, screens/contracts) are Lane A/B territory. The recipes using contract-holder-filter and contract-tag-filter change in Phase 47 and are left to the owner's sweep.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-04.1.2](../../requirements-board/requirements/stories/US-04.1.2.md) [Create, edit and disable Contracts](epics/EP-04.md#us-04.1.2) | Verify (3), [OQ-144](../../requirements-board/requirements/questions/OQ-144.md) | Partial | Active/Disabled lifecycle, confirmed Disable, no dates, Disabled review flag and fixed-after-creation rules match; the grouped list with index, the New contract page (order and similar-name hint) and the inactive-anaesthetist Contract cascade are missing. | L |
| [US-04.1.7](../../requirements-board/requirements/stories/US-04.1.7.md) [A page for each Contract](epics/EP-04.md#us-04.1.7) | Verify (3) | Partial | All the content of a Contract (price ranges, where offered, who it bills, names and codes, fixed settings, event fees, history, system-Contract limits) exists, but in one side panel with a single Save, with no page or route, no separately saved cards, no read-only Party billing block and no list of the Procedures on the Contract. | L |
| [US-04.1.8](../../requirements-board/requirements/stories/US-04.1.8.md) [Replace a Contract from a date](epics/EP-04.md#us-04.1.8) | Verify (3), [OQ-144](../../requirements-board/requirements/questions/OQ-144.md) | Partial | Only a warning-only 'Replaces' picker exists on create (it lists Procedures dated on or after a From date; nothing is stored, copied or moved); the one-action replace with ticking, leave-active-with-to-do or disable-now, late-disable listing from the change date and the not-a-fixed-price message is not built. | L |
| [US-04.1.5](../../requirements-board/requirements/stories/US-04.1.5.md) [Parties](epics/EP-04.md#us-04.1.5) | Verify (3), [OQ-114](../../requirements-board/requirements/questions/OQ-114.md) | Partial | The Party master, its rules (billing name and delivery once billed, email or post contact, hospital link, one AA) and a list including Contract-less Parties exist, but Parties are a Master data view with a side panel, rows are sorted not grouped by kind, and there is no per-funding-tag Contract count or link into the Contract list. | M |
| [US-04.2.15](../../requirements-board/requirements/stories/US-04.2.15.md) [Price ranges on a fixed price](epics/EP-04.md#us-04.2.15) | Verify (3) | Partial | Range semantics are right (unique starts, past starts allowed, implied end, never the last, range in force prices, backdated re-pricing, kept-price warning with list), but the table is the old layout: oldest first, no separate To or Change column, no count of Procedures priced, no folding of ended ranges after three. | M |
| [US-04.1.3](../../requirements-board/requirements/stories/US-04.1.3.md) [Contract audit](epics/EP-04.md#us-04.1.3) | Verify (3) | Partial | Audit with before and after already covers Party, Contract (create, update, disable, enable), price ranges, specialties, funding tags and RVG groups, never deleted, with a per-Contract history and locked Procedures; missing are card-by-card audited saves and the audit of a Replace from a date, both tied to US-04.1.7 and US-04.1.8. | S |

Details for every gap: [epics/EP-04.md](epics/EP-04.md).

**Matches (3):** [US-04.2.17](../../requirements-board/requirements/stories/US-04.2.17.md) Funding tag on a Contract · [US-04.3.8](../../requirements-board/requirements/stories/US-04.3.8.md) Where the invoice goes, then the Contract · [US-04.3.9](../../requirements-board/requirements/stories/US-04.3.9.md) The No contract backstops, RVG and Fixed price

**Grouping only (1):** [FT-04.1](../../requirements-board/requirements/stories/FT-04.1.md)

<a id="ep-05"></a>

### EP-05 · RVG master data and fee calculation rules

[EP-05](../../requirements-board/requirements/stories/EP-05.md) · epic status Agreed (4) · 

<a id="ep-06"></a>

### EP-06 · Prepayment

[EP-06](../../requirements-board/requirements/stories/EP-06.md) · epic status Verify (3) · 1 Partial

> Only US-06.3.1 was graded. Its behaviour is complete in the code (catch-up Phases 22, 27, 27a and 41). The remaining difference is structural and comes from the 26 Nov Finances-section requirements: Admin Invoices becomes the Invoices tab of a Finances section, and Awaiting approval becomes one of its filters (US-13.3.3, US-08.4.7). That should be built under those stories. This story then needs only entry links re-pointed (routes.tsx:178 and :228, notification and demo-trigger routes) and demo-guide wording. OQ-120 (naming the anaesthetist) and OQ-73 are open but state no requirement the prototype breaks: PREPAYMENT_NAMES_ANAESTHETIST = true is one constant, flagged provisional in the demo guide. OQ-140 (payer per Procedure) is already followed. Demo guide S4 Beat 1 (Invoices, Awaiting approval, switch) and the Day-view rail text 'awaiting approval on Invoices' will change when the section lands. The six US-06.3.1 screenshots will go stale, which is a sweep matter, not per-change work.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-06.3.1](../../requirements-board/requirements/stories/US-06.3.1.md) [Raise the prepayment invoice](epics/EP-06.md#us-06.3.1) | Verify (3), [OQ-120](../../requirements-board/requirements/questions/OQ-120.md), [OQ-73](../../requirements-board/requirements/questions/OQ-73.md) | Partial | All eight acceptance criteria are built and demonstrable; the only real gap is placement, since the story now puts approval under Awaiting approval on the Finances section's Invoices tab and the prototype has no Finances section. | S |

Details for every gap: [epics/EP-06.md](epics/EP-06.md).

<a id="ep-07"></a>

### EP-07 · List approval workflow

[EP-07](../../requirements-board/requirements/stories/EP-07.md) · epic status Agreed (4) · 

<a id="ep-08"></a>

### EP-08 · Billing/Invoice Engine and internal ledger

[EP-08](../../requirements-board/requirements/stories/EP-08.md) · epic status Agreed (4) · 1 Contradicts

> US-08.4.7 depends on the Finances section (US-13.3.3), which exists only as requirements and an exploration. The Invoices screen is still a standalone nav section with its own /admin/invoices routes, so moving it into a Finances tab and renaming routes is a structural change shared with the other Finances stories (Payments, AA fees, Billing, Ledger tabs). Amount received and still owed already live in the ledger (receivables, receipts, receivableOutstanding); the list needs a selector joining them to each invoice and credit note, an age from the demo clock (DEMO_TODAY 2026-11-24), a state filter (Unpaid default) and a broader search (payable number, case reference, patient, anaesthetist). Changing the default to Unpaid affects any demo beat that lands on Invoices to find a paid invoice, and InvoicesSearch.test.tsx and demoGuideSync may need updating. AA fee invoices are already excluded, matching the story. Awaiting approval is currently a tab and the story wants it as a filter beside the state filters. Status is Verify (3) and the notes say the change has not yet been seen by AA, so the grading is against the text as written.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-08.4.7](../../requirements-board/requirements/stories/US-08.4.7.md) [Find any invoice](epics/EP-08.md#us-08.4.7) | Verify (3) | Contradicts | The Invoices screen is a standalone side-nav section that opens on All invoices and searches only invoice or credit-note number and addressee; it has no still-owed, Unpaid/Part paid/Paid state, age, state filter, or search by payable number, case reference, patient or anaesthetist. | M |

Details for every gap: [epics/EP-08.md](epics/EP-08.md).

<a id="ep-09"></a>

### EP-09 · Xero integration

[EP-09](../../requirements-board/requirements/stories/EP-09.md) · epic status Proposed (1) · 

<a id="ep-10"></a>

### EP-10 · Payments, disbursement and AA fees

[EP-10](../../requirements-board/requirements/stories/EP-10.md) · epic status Agreed (4) · 3 Partial, 1 Matches

> All four gradings upheld after re-opening the catalogue files and code. The substance of EP-10's four in-scope stories is built: US-10.2.4 as the Xero simulator's bank reconciliation (fully matches), US-10.2.7 as the Payment cycle panel plus run and remittance pages, US-10.3.1 and US-10.3.3 as the AA fees screen with a Fee settings sub-tab. The gaps since the 64b3dff7 baseline are structural, driven by the 26 Nov Finances section (US-13.3.3): grep finds no Finances anywhere in aa-prototype/src, no /admin/finances route, and SideNav.tsx:81-85 still has separate Invoices, Billing monitor and Ledger entries. So 10.2.7 (Payments tab, run pages under it, back link), 10.3.1 (AA fees tab) and 10.3.3 (settings beside invoices and run) all depend on building the Finances shell first, with old /admin/billing/* addresses still opening. The one content-level gap is US-10.3.1's 'opens on unpaid' criterion: selectors.ts:1639-1654 sorts newest-first with no unpaid-first ordering. The 'no number when nothing is due' rule for Payments and AA fees belongs to US-13.3.3, not these stories. Open questions OQ-149 (where an unplaceable receipt is parked; not graded as a gap), OQ-60, OQ-112 and OQ-47 mean the prototype's provisional readings (fee at month end, BCTI counted once when paid, separate invoice, weekly Friday/Monday/Tuesday days) are only as settled as those questions. Demo-guide impact: docs/demo-guide/03-demo-script.md routes and the S3 beats that say 'Admin > Billing monitor', 'Payment cycle panel', 'Open AA fee invoices > Fee settings' (and the S4 hold-out beat) would change navigation wording and screenshots only; no scripted values (week names, totals, remittance content) change. Demo triggers keyed to the /admin/billing and /admin/billing/aa-fees routes in registry.ts would need their route lists updated when the tabs move. Existing triggers (stage-payment-week, stage-bank-mismatch, run-scheduled-fee-run, seed-month-of-bctis, record-fee-payment, xero-bulk-remittance) already cover every automatic or external behaviour in this epic's in-scope stories.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-10.2.7](../../requirements-board/requirements/stories/US-10.2.7.md) [Weekly payment cycle](epics/EP-10.md#us-10.2.7) | Proposed (1) | Partial | The weekly ISO-week cycle, Friday close and bank reconciliation, Monday anomalies held out and rolled to the next week, Tuesday payment schedule, week on payments, per-run pages with remittance advices and an earlier-runs list are all built, but on the Billing monitor and /admin/billing/payment-runs, not on a Payments tab of a Finances section (none exists). | M |
| [US-10.3.1](../../requirements-board/requirements/stories/US-10.3.1.md) [Generate AA fee invoices](epics/EP-10.md#us-10.3.1) | Verify (3), [OQ-112](../../requirements-board/requirements/questions/OQ-112.md), [OQ-60](../../requirements-board/requirements/questions/OQ-60.md) | Partial | The monthly run, preview and fee total ($500 fixed + $5 x 40 = $700) are built, and fee invoices are kept off the Invoices screen and tracked as aaFee ledger pairs; but there is no AA fees tab of a Finances section and the fee invoice list is newest-first, not unpaid-first. | S |
| [US-10.3.3](../../requirements-board/requirements/stories/US-10.3.3.md) [AA fee settings](epics/EP-10.md#us-10.3.3) | Verify (3), [OQ-60](../../requirements-board/requirements/questions/OQ-60.md) | Partial | Fee settings (several fixed items plus a per-BCTI charge, stored in appSettings, applied from the next run) are built and meet both acceptance criteria, but sit on a separate 'Fee settings' sub-tab under Billing, not on the AA fees tab of a Finances section beside the invoices and the run. | S |

Details for every gap: [epics/EP-10.md](epics/EP-10.md).

**Matches (1):** [US-10.2.4](../../requirements-board/requirements/stories/US-10.2.4.md) Bulk remittance stays in Xero

<a id="ep-11"></a>

### EP-11 · Patients and billable parties

[EP-11](../../requirements-board/requirements/stories/EP-11.md) · epic status Verify (3) · 4 Contradicts, 1 Partial, 1 Grouping

> Both stories were reworked on 26 Nov (intake front door). The prototype built the 25 Nov tab reading (Waiting for NHI tab, /admin/intake/waiting), and the catalogue now wants a Needs NHI filter in the one matching feed (US-02.1.4). The gap is mostly structural: fold the waiting rows into MatchingScreen as a Needs NHI filter with its count, remove the tab and route, and redirect /admin/patients/waiting to Matching with the filter set. Intake's attention count already counts each waiting row once. The real new behaviour is later-arrival NHI resolution (a proposed update showing the NHI, applied to turn the waiting row into a Booking and remove the stub). It depends on the EP-02 front-door rework (US-02.1.4, US-02.2.4, stubs FT-02.6) and on how hospital updates and PDF resends are staged. Decide whether the Matching RowPanel Add NHI stays (one hand route rule). Chase-address logic (US-02.2.4, US-13.6.5) already matches. Demo guide: docs/demo-guide/03-demo-script.md names the Waiting for NHI tab (S1 optional check, Intake section, the Losa Tuilagi beat) and needs rewording, plus a beat for the later-arrival update. Trigger screen strings are read by demoGuideSync.test.ts, so renaming them must keep it green. Capture recipes and screenshots (admin-waiting-for-nhi-*.png) are left to the owner's sweep.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-11.1.5](../../requirements-board/requirements/stories/US-11.1.5.md) [Intake rows waiting for an NHI](epics/EP-11.md#us-11.1.5) | Verify (3) | Contradicts | Chase address, single-address rule, urgent marking, stub, no duplicate patient and the Intake count all exist, but the rows sit on their own tab (the story now says no view of their own, a Needs NHI filter in the one feed), and an NHI carried by a later arrival never resolves the waiting row. | M |
| [US-11.3.1](../../requirements-board/requirements/stories/US-11.3.1.md) [Patient outstanding bills view](epics/EP-11.md#us-11.3.1) | Verify (3) | Contradicts | Name, NHI and DOB search and per-patient invoices across every anaesthetist (paid, part paid, unpaid, balance) work, but the list is the older Search view, whose empty default mixes upcoming and needing-follow-up patients and which caps at 50 with no paging. There is no Coming up, Needs follow-up or All filter, and it is a top-level section, not a tab of People. | M |
| [US-11.3.3](../../requirements-board/requirements/stories/US-11.3.3.md) [Follow-up tools](epics/EP-11.md#us-11.3.3) | Verify (3) | Contradicts | The follow-up log (call, note, reminder with due date, audited resends with invoice number) and the shared note on a List or Booking are built, but Needs follow-up is three separate sections where a patient can appear more than once, actions are taken on the list rows, and the nav count is not the number of patients on the list. | M |
| [US-11.1.4](../../requirements-board/requirements/stories/US-11.1.4.md) [Patient without NHI](epics/EP-11.md#us-11.1.4) | Verify (3) | Contradicts | The core rule is built (no Booking or patient without an NHI; no-NHI rows wait and a stub stands on the List), but the waiting rows live on their own Waiting for NHI tab, where the story (26 Nov) now puts them under a Needs NHI filter in the one matching feed. | S |
| [US-11.1.1](../../requirements-board/requirements/stories/US-11.1.1.md) [Patient record keyed on NHI](epics/EP-11.md#us-11.1.1) | Verify (3) | Partial | Dedupe on NHI, NHI beside the name with no internal id, Details side panel with own audited Edit, and held differing details all work; the page is reached from the separate Patients section, not a Patients tab of People, and the shared record-page pattern it should follow does not exist yet. | S |

Details for every gap: [epics/EP-11.md](epics/EP-11.md).

**Grouping only (1):** [FT-11.1](../../requirements-board/requirements/stories/FT-11.1.md)

<a id="ep-12"></a>

### EP-12 · Anaesthetist profile and reporting

[EP-12](../../requirements-board/requirements/stories/EP-12.md) · epic status Proposed (1) · 2 Contradicts, 1 Grouping

> All three gradings are upheld after re-opening the code. FT-12.1 is a pure Grouping. US-12.1.4 and US-12.1.6 both Contradict, because two older readings are implemented: the tier saves on click, and active is an immediate boolean that trims Slots from today. Each is large (size L) on its own. Lane placement. The domain, store and sign-in half of US-12.1.6 fits Lane C in Wave 1, because it touches none of the Contracts-owned files. That half covers: - a last-day date and reason on the Anaesthetist type; - audited make-inactive, clear and make-active actions; - Slots trimmed only after the last day; - sign-in checked against the master record; - own-Party Contracts disabled and offered back. The new Anaesthetist fields need a PERSIST_VERSION bump and a seed review. Moving the tier into a card with the rate is also Lane C-safe as store and domain work. The per-card Edit/Save, the side panel and the People move itself need the record pattern lifted out of ContractCards.tsx and ProfileChrome.tsx, plus router/SideNav/masters redirect changes, so they wait for Wave 1 to join. Interactions to coordinate: - Disabling and re-enabling an anaesthetist's Contracts uses disableContract and enableContract from Phase 45. Phase 49 (Replace a Contract from a date) also changes Contract status, and the Contract identity there is linkedAnaesthetistId plus the holder Party. - The shared anaesthetistSession.ts is in the PWA closure and must stay pure (pwaPurity.test.ts). Reading active from the master record therefore needs a small injected check or a store-side hook, not an import from the store. - OQ-147 and OQ-83 are open, so departed-anaesthetist remittance access stays narrated. - The Anaesthetists list also needs search, tier filter and paging, which are absent today. Demo guide: S1 to S5 do not use make-inactive or the tier control, so the impact is additive (a new beat on the demo clock). The Dr Sharma record path in the guide changes with the People move, which is for the sweep.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-12.1.4](../../requirements-board/requirements/stories/US-12.1.4.md) [Anaesthetist identity, contact and bank details](epics/EP-12.md#us-12.1.4) | Verify (3) | Contradicts | Identity, contact and bank details exist, and HPI CPN and bank details are mandatory. The tier saves on click on its own card, one editor sheet covers every field, and there is no side panel, no People section and no list search, filter or paging. These contradict the per-card Edit/Save, rate-and-tier-together and side-panel requirements. | L |
| [US-12.1.6](../../requirements-board/requirements/stories/US-12.1.6.md) [Make an anaesthetist inactive](epics/EP-12.md#us-12.1.6) | Verify (3), [OQ-147](../../requirements-board/requirements/questions/OQ-147.md) | Contradicts | Active/Inactive is an immediate boolean in the edit sheet that trims Slots from today. There is no last day, reason, dedicated action, clear-in-time, sign-in effect, Contract disabling or make-active offer. The refusal is also keyed to Lists from today, not after a chosen last day. | L |

Details for every gap: [epics/EP-12.md](epics/EP-12.md).

**Grouping only (1):** [FT-12.1](../../requirements-board/requirements/stories/FT-12.1.md)

<a id="ep-13"></a>

### EP-13 · Admin oversight and master data

[EP-13](../../requirements-board/requirements/stories/EP-13.md) · epic status Agreed (4) · 4 Contradicts, 6 Partial, 1 Missing

> All six items graded on code re-read. The prototype has every underlying screen (Billing monitor, Invoices, Ledger, payment cycle, AA fees, Xero queue and divergence panels, reconciliation status) but no Finances container: grep for 'finances' in aa-prototype/src finds nothing, and the side nav has Invoices, Billing monitor and Ledger as three items. The work is structural. First, a Finances section with six routed tabs (Billing, Invoices, Payments, Ledger, Xero, AA fees), tab counts and one warning badge, keeping the old /admin/invoices, /admin/billing and /admin/ledger addresses resolving. Second, the monolithic BillingMonitorScreen must be split: the Xero queue and divergence panels go to Xero, PaymentCyclePanel and the payment-run pages to Payments, AaFeePanel and AaFeesScreen to AA fees, and HoldingAccountPanel to the Ledger list. Third, the Billing tab gets rebuilt as the Problems-first option C table (List heading with Bookings as rows) with Problems/In progress/Done/All filters, search and a fix-the-payer action, which needs a new failure path (payer with no billing email) in the domain, store and seed. Fourth, the Ledger loses the Whole ledger / One anaesthetist switch and gains the four-figure header, a three-way list and per-anaesthetist rows that open account pages. Two items are Contradicts (US-13.2.1 and, corrected from Partial, US-13.3.1) because the prototype implements designs the catalogue now says were considered and not kept. OQ-149 (where an unplaceable receipt is placed) is open and touches the Ledger place/refund actions, the receipts-to-place figure and the reconciliation unresolved items, so build those provisionally. US-13.2.4 is Proposed and waits on the posting design (clearing account, sub-ledger against control account), which the code header says is deliberately not modelled. Demo triggers: billing-failure and arm-handoff-fault (screen BILLING_MONITOR_SCREEN), xero-outage and inject-unmatched-receipt (screen 'Admin · Ledger') are keyed by screen and must be re-pointed at the new tab routes; add 'Payer loses billing email' for the fix-the-payer beat, and optionally 'Leave money in clearing account' on the Day screen if the extra reconciliation checks are built. Demo-guide impact (docs/demo-guide/03-demo-script.md): S3 Money end to end (Billing monitor, AA fee invoices and Ledger beats, plus the direct-URL table) and S4 Exceptions (Holding account card, billing failure, Xero outage, changed-in-Xero, refund after payout, payment week) change navigation and wording; the Ledger beat changes most. The demoGuideSync test, capture recipes and ATLAS belong to the owner's sweep, not this work. Read-only; no files modified.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-13.4.1](../../requirements-board/requirements/stories/US-13.4.1.md) [Maintain reference tables](epics/EP-13.md#us-13.4.1) | Verify (3), [OQ-148](../../requirements-board/requirements/questions/OQ-148.md) | Contradicts | Master data, the Contracts section and per-card editing on the Contract page exist, but the prototype still keeps a Surgeon groups list that the story now says must not exist, plus no People section and no search, filter or paging on the people lists. | XL |
| [US-13.2.1](../../requirements-board/requirements/stories/US-13.2.1.md) [Ledger balance views](epics/EP-13.md#us-13.2.1) | Verify (3), [OQ-149](../../requirements-board/requirements/questions/OQ-149.md) | Contradicts | A rich Ledger screen exists, but it keeps the Whole ledger / One anaesthetist switch that the catalogue explicitly considered and did not keep, and lacks the four-figure set, the three-way list and the per-anaesthetist account row columns. | L |
| [US-13.3.1](../../requirements-board/requirements/stories/US-13.3.1.md) [Billing status of each List and Booking](epics/EP-13.md#us-13.3.1) | Verify (3) | Contradicts | The prototype's per-anaesthetist Billing monitor implements the 'Lists that unfold into their Bookings' layout the catalogue considered and did not build, and opens on All lists rather than Problems; it also lacks the filter set, search and fix-the-payer action. | L |
| [US-13.6.2](../../requirements-board/requirements/stories/US-13.6.2.md) [Surgeon profile](epics/EP-13.md#us-13.6.2) | Verify (3), [OQ-143](../../requirements-board/requirements/questions/OQ-143.md), [OQ-148](../../requirements-board/requirements/questions/OQ-148.md) | Contradicts | A surgeon page and list exist with unique optional HPI CPN, practice text and contacts, but the profile still has a Groups card (a surgeon now belongs to no group), saves all fields in one sheet instead of card by card, has no side panel of Contracts and next Lists, and the list has no search, filter or paging. | L |
| [US-13.2.4](../../requirements-board/requirements/stories/US-13.2.4.md) [Reconciliation status at a glance](epics/EP-13.md#us-13.2.4) | Proposed (1), [OQ-149](../../requirements-board/requirements/questions/OQ-149.md) | Partial | A derived 'Books square / Out of balance' status with unresolved items (amount, age) exists on the Admin Day dashboard, but it checks only the ledger, ledger against Xero and Xero bank lines; the clearing-account (should read zero) and sub-ledger against control-account checks are deliberately not modelled. Story is Proposed (1); OQ-149 open. | M |
| [US-13.3.2](../../requirements-board/requirements/stories/US-13.3.2.md) [Manual intervention](epics/EP-13.md#us-13.3.2) | Verify (3) | Partial | The Xero sync queue (attempts, next try, last error, Retry now), the changed-in-Xero panel with per-item resolve, and Booking-level retry exist, and a stuck hand-off shows in both the queue and the List's Booking row, but on one Billing monitor page rather than separate Xero and Billing tabs, and there is no fix-the-payer or mark-resolved action. | M |
| [US-13.4.4](../../requirements-board/requirements/stories/US-13.4.4.md) [Specialties](epics/EP-13.md#us-13.4.4) | Verify (3) | Partial | The list behaviour (broad names, audited add/rename/remove, remove refused while held, a rename reaching holders by id) is right, but it lives in Master data and there is no per-specialty page listing its surgeons and Contracts. | M |
| [US-13.5.3](../../requirements-board/requirements/stories/US-13.5.3.md) [Sign in to the anaesthetist app](epics/EP-13.md#us-13.5.3) | Verify (3), [OQ-147](../../requirements-board/requirements/questions/OQ-147.md), [OQ-83](../../requirements-board/requirements/questions/OQ-83.md) | Partial | The simulated account sign-in exists and is audited, but the inactive rule (refused after the last day, allowed on it, restored on reactivation) is not implemented and there is no last day or demo path. | M |
| [FT-13.3](../../requirements-board/requirements/stories/FT-13.3.md) [Billing flow monitoring](epics/EP-13.md#ft-13.3) | Agreed (4) | Partial | The billing-flow monitoring content exists (List-to-Xero stages, per-Booking failures, Xero queue) but lives on a stand-alone Billing monitor screen, not in a Finances section; the relocation itself is carried by US-13.3.3. | S |
| [US-13.4.5](../../requirements-board/requirements/stories/US-13.4.5.md) [Funding tags](epics/EP-13.md#us-13.4.5) | Verify (3) | Partial | The funding tag list (code, funder Party, step-rail order, audited add, edit and remove, Suggested path from the funder) works as required, but it lives in Master data rather than a Contracts-section tab, and picking a tag shows no Contracts grouped by hospital with counts (only one total per tag). | S |
| [US-13.3.3](../../requirements-board/requirements/stories/US-13.3.3.md) [The Finances section](epics/EP-13.md#us-13.3.3) | Verify (3) | Missing | There is no Finances section: the side nav has separate Invoices, Billing monitor and Ledger items, with no tabbed container, tab counts or single warning badge. | L |

Details for every gap: [epics/EP-13.md](epics/EP-13.md).

<a id="ep-14"></a>

### EP-14 · Health systems integration

[EP-14](../../requirements-board/requirements/stories/EP-14.md) · epic status Proposed (1) · 1 Contradicts

> x

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [EP-14](../../requirements-board/requirements/stories/EP-14.md) [Health systems integration](epics/EP-14.md#ep-14) | Proposed (1) | Contradicts | Inbound-only and NHI lookup are right, but the Matching screen still has an office-facing 'Import hospital file' button and dialog, which the epic's rule (rows arrive on their own, no import button) now forbids; Proposed status, rule changed 26 Nov. | S |

Details for every gap: [epics/EP-14.md](epics/EP-14.md).

<a id="ep-15"></a>

### EP-15 · Non-functional requirements

[EP-15](../../requirements-board/requirements/stories/EP-15.md) · epic status Proposed (1) · 

## Excluded from this analysis

Retired items, stories in the Future Work lane and features whose live stories are all there were not graded. The reverse check above covers retired behaviour the prototype still has.

[FT-04.4](../../requirements-board/requirements/stories/FT-04.4.md) Default Contracts for hospitals, insurers and procedures (Retired (6)) · [FT-06.1](../../requirements-board/requirements/stories/FT-06.1.md) Prepaid procedure settings on the anaesthetist profile (Retired (6)) · [FT-06.4](../../requirements-board/requirements/stories/FT-06.4.md) Settlement after the procedure (Retired (6)) · [FT-11.4](../../requirements-board/requirements/stories/FT-11.4.md) Insurers (Retired (6)) · [FT-14.1](../../requirements-board/requirements/stories/FT-14.1.md) HL7 v2 inbound (Proposed (1)) · [FT-14.2](../../requirements-board/requirements/stories/FT-14.2.md) FHIR R4 (Proposed (1)) · [FT-14.3](../../requirements-board/requirements/stories/FT-14.3.md) Near real time (Proposed (1)) · [FT-14.5](../../requirements-board/requirements/stories/FT-14.5.md) Reliability and monitoring (Proposed (1)) · [FT-14.6](../../requirements-board/requirements/stories/FT-14.6.md) Further hospital feeds and automatic matching (Proposed (1)) · [US-01.3.4](../../requirements-board/requirements/stories/US-01.3.4.md) AM and PM can differ (Retired (6)) · [US-02.2.2](../../requirements-board/requirements/stories/US-02.2.2.md) Edit then ingest (Retired (6)) · [US-02.3.5](../../requirements-board/requirements/stories/US-02.3.5.md) Send booking change emails automatically (Proposed (1), Future Work) · [US-02.4.2](../../requirements-board/requirements/stories/US-02.4.2.md) Photo capture of the physical card (Retired (6)) · [US-02.4.3](../../requirements-board/requirements/stories/US-02.4.3.md) Copy a Booking (Retired (6)) · [US-02.4.4](../../requirements-board/requirements/stories/US-02.4.4.md) Add a Booking from a photo of the booking card (Proposed (1), Future Work) · [US-02.5.1](../../requirements-board/requirements/stories/US-02.5.1.md) Apply a modification (Agreed (4), Future Work) · [US-02.5.2](../../requirements-board/requirements/stories/US-02.5.2.md) Reschedule to another day arrives as cancel and new Booking (Agreed (4), Future Work) · [US-02.5.3](../../requirements-board/requirements/stories/US-02.5.3.md) Record a cancellation (Agreed (4), Future Work) · [US-02.5.4](../../requirements-board/requirements/stories/US-02.5.4.md) Inbound changes accepted until the List is authorised (Agreed (4), Future Work) · [US-02.5.6](../../requirements-board/requirements/stories/US-02.5.6.md) Concurrent edits (Proposed (1), Future Work) · [US-03.1.3](../../requirements-board/requirements/stories/US-03.1.3.md) Attachments (Retired (6)) · [US-03.3.2](../../requirements-board/requirements/stories/US-03.3.2.md) Override a ranged base code (Retired (6)) · [US-03.3.5](../../requirements-board/requirements/stories/US-03.3.5.md) Itemise modifiers (Retired (6)) · [US-03.3.6](../../requirements-board/requirements/stories/US-03.3.6.md) Other billing lines (Retired (6)) · [US-03.3.7](../../requirements-board/requirements/stories/US-03.3.7.md) Rate x time capture (Retired (6)) · [US-03.5.3](../../requirements-board/requirements/stories/US-03.5.3.md) Adjustment reason (Retired (6)) · [US-04.1.6](../../requirements-board/requirements/stories/US-04.1.6.md) Stage Contract changes for review, then submit (Retired (6)) · [US-04.2.10](../../requirements-board/requirements/stories/US-04.2.10.md) Contract prices effective from a date (Retired (6)) · [US-04.2.12](../../requirements-board/requirements/stories/US-04.2.12.md) Payment setting: full payment or split (Retired (6)) · [US-04.2.13](../../requirements-board/requirements/stories/US-04.2.13.md) Export and re-import Contracts (Verify (3), Future Work) · [US-04.2.3](../../requirements-board/requirements/stories/US-04.2.3.md) Base unit override (Retired (6)) · [US-04.2.4](../../requirements-board/requirements/stories/US-04.2.4.md) Contract lines (Retired (6)) · [US-04.2.5](../../requirements-board/requirements/stories/US-04.2.5.md) Multi-procedure rule per Contract (Retired (6)) · [US-04.2.6](../../requirements-board/requirements/stories/US-04.2.6.md) Adjustment and override permissions (Retired (6)) · [US-04.2.7](../../requirements-board/requirements/stories/US-04.2.7.md) Required booking inputs (Retired (6)) · [US-04.2.9](../../requirements-board/requirements/stories/US-04.2.9.md) Organisational and individual Contracts (Retired (6)) · [US-04.3.6](../../requirements-board/requirements/stories/US-04.3.6.md) Hospital data sets the Contract (Proposed (1), Future Work) · [US-04.3.7](../../requirements-board/requirements/stories/US-04.3.7.md) Confirm a price with the hospital (Verify (3), Future Work) · [US-04.4.1](../../requirements-board/requirements/stories/US-04.4.1.md) Mandatory default Contract (Retired (6)) · [US-04.4.2](../../requirements-board/requirements/stories/US-04.4.2.md) Default RVG Contract for every procedure (Retired (6)) · [US-05.1.2](../../requirements-board/requirements/stories/US-05.1.2.md) Add AA codes (Retired (6)) · [US-05.1.6](../../requirements-board/requirements/stories/US-05.1.6.md) Procedure master mapped to RVG codes (Retired (6)) · [US-05.2.3](../../requirements-board/requirements/stories/US-05.2.3.md) Conditional positioning modifier (Retired (6)) · [US-05.2.4](../../requirements-board/requirements/stories/US-05.2.4.md) Contract rate or discount (Retired (6)) · [US-05.3.2](../../requirements-board/requirements/stories/US-05.3.2.md) Time units on every Procedure (Retired (6)) · [US-05.3.3](../../requirements-board/requirements/stories/US-05.3.3.md) Modifier split above four units (Retired (6)) · [US-05.3.4](../../requirements-board/requirements/stories/US-05.3.4.md) Contract-specific second-procedure rules (Retired (6)) · [US-06.1.1](../../requirements-board/requirements/stories/US-06.1.1.md) Tick procedures or groups (Retired (6)) · [US-06.1.2](../../requirements-board/requirements/stories/US-06.1.2.md) Admin can maintain on behalf (Retired (6)) · [US-06.2.3](../../requirements-board/requirements/stories/US-06.2.3.md) Prepayment is an estimate (Retired (6)) · [US-06.2.4](../../requirements-board/requirements/stories/US-06.2.4.md) Calculate the prepayment estimate (Retired (6)) · [US-06.2.5](../../requirements-board/requirements/stories/US-06.2.5.md) Estimated duration from the surgeon's rooms (Retired (6)) · [US-06.3.3](../../requirements-board/requirements/stories/US-06.3.3.md) Alert on unpaid prepayment (Retired (6)) · [US-06.4.2](../../requirements-board/requirements/stories/US-06.4.2.md) No automatic credit when prepaid exceeds final (Retired (6)) · [US-07.1.2](../../requirements-board/requirements/stories/US-07.1.2.md) Cannot submit an incomplete List (Retired (6)) · [US-08.1.2](../../requirements-board/requirements/stories/US-08.1.2.md) Contract already resolved (Retired (6)) · [US-09.1.2](../../requirements-board/requirements/stories/US-09.1.2.md) InvoiceNumber and Reference (Retired (6)) · [US-09.3.2](../../requirements-board/requirements/stories/US-09.3.2.md) NHI never sent to Xero (Retired (6)) · [US-10.2.2](../../requirements-board/requirements/stories/US-10.2.2.md) Partial payment releases exactly that amount (Retired (6)) · [US-11.1.3](../../requirements-board/requirements/stories/US-11.1.3.md) Deduplicate on NHI (Retired (6)) · [US-11.4.1](../../requirements-board/requirements/stories/US-11.4.1.md) Insurer master data (Retired (6)) · [US-11.4.2](../../requirements-board/requirements/stories/US-11.4.2.md) Insured patient who forwards the invoice (Retired (6)) · [US-12.1.2](../../requirements-board/requirements/stories/US-12.1.2.md) GST period (Retired (6)) · [US-12.1.3](../../requirements-board/requirements/stories/US-12.1.3.md) Prepaid procedures (Retired (6)) · [US-12.1.5](../../requirements-board/requirements/stories/US-12.1.5.md) Bank details for disbursement (Retired (6)) · [US-13.2.3](../../requirements-board/requirements/stories/US-13.2.3.md) Per-anaesthetist balance (Retired (6)) · [US-13.6.1](../../requirements-board/requirements/stories/US-13.6.1.md) Surgeons' rooms master record (Retired (6)) · [US-13.7.4](../../requirements-board/requirements/stories/US-13.7.4.md) Warning and check-step settings (Proposed (1), Future Work) · [US-14.1.1](../../requirements-board/requirements/stories/US-14.1.1.md) Parse SIU messages (Proposed (1), Future Work) · [US-14.2.1](../../requirements-board/requirements/stories/US-14.2.1.md) Internal booking model (Proposed (1), Future Work) · [US-14.3.1](../../requirements-board/requirements/stories/US-14.3.1.md) Real-time processing (Proposed (1), Future Work) · [US-14.5.1](../../requirements-board/requirements/stories/US-14.5.1.md) Integration failure visibility (Proposed (1), Future Work) · [US-14.6.1](../../requirements-board/requirements/stories/US-14.6.1.md) Feeds from the other Christchurch providers (Proposed (1), Future Work) · [US-14.6.2](../../requirements-board/requirements/stories/US-14.6.2.md) Automatic matching and updates (Proposed (1), Future Work)

<a id="verification-log"></a>

## Verification log

Each epic's gradings were re-checked from scratch by a separate verifier told to refute them. 6 corrections:

| Item | From | To | Why |
|---|---|---|---|
| [US-01.3.6](../../requirements-board/requirements/stories/US-01.3.6.md) | Contradicts | Contradicts | Re-opened AnaesthetistRecord.tsx, AnaesthetistsView.tsx and EditAnaesthetistSheet.tsx and upheld the Contradicts verdict and all four gaps. Only the size changed, from S to M. The requirement puts the tier and the rate per unit on one card changed by Edit, choose, Save, so the Profile card's rate editing (now in a sheet) also has to move into that card, with the tier and rate saved as separate audited changes. This is more than a one-hour tweak, and it overlaps the People record pattern. It stays in admin screen files that Contracts phases 45 to 49 do not touch, so it is still a Lane C candidate. |
| [US-01.6.1](../../requirements-board/requirements/stories/US-01.6.1.md) | Matches | Partial | The reviewer graded Matches while admitting the gap. The rubric for Matches is ALL acceptance criteria; the last AC is new (26 Nov) and says the Draft List holds 'its Bookings' from the matching-screen act. Confirmed in code that the act saves one row's Booking and that the sample PDFs carry three rows, so the AC is not demonstrated as written. The manual-creation parts (required fields, no Slot, Bookings addable, audit) all check out. Corrected to Partial; fix largely rides on the US-02.1.2 whole-List rebuild, standalone M (loop the arriving List's rows, with stub and wrong-NHI rows still handled). |
| [US-04.2.15](../../requirements-board/requirements/stories/US-04.2.15.md) | Partial | Partial | Corrected one point: the reviewer said the end is not shown, but ContractPriceRanges.tsx:174 renders rangeSpanText in the In force column, so the implied end is visible (only a distinct To column is missing). Verdict stays Partial: the other columns, newest-first order and folding are missing. Not Contradicts, since nothing implemented is wrong. |
| [US-11.3.3](../../requirements-board/requirements/stories/US-11.3.3.md) | Contradicts | Contradicts | Verdict and gaps upheld after re-reading FollowUpView and patientAttentionCount. Corrected the evidence: the reviewer cited logListNote (lifecycle.ts:438), which is office-only. The 'anyone can write a shared note' rule is actually met by addSharedNote / SharedNotes (shared/notes), so the shared-note criterion holds. Also added that the badge counts items, not distinct patients. |
| [US-13.3.1](../../requirements-board/requirements/stories/US-13.3.1.md) | Partial | Contradicts | Regraded Partial to Contradicts. The implemented screen opens on All lists (the story says Problems) and unfolds each List into its Bookings, which the story's Notes list under 'Considered and not built'; by the rubric any wrong implemented behaviour outranks Partial. All the reviewer's missing points re-checked and kept (no search, no fix-payer, no In progress/Done); demo_trigger filled in since the reviewer left it blank but proposed one for US-13.3.2. Size L kept. |
| [US-13.4.1](../../requirements-board/requirements/stories/US-13.4.1.md) | Partial | Contradicts | Re-opened masterViews.ts, SurgeonsView.tsx, SurgeonProfile.tsx, SurgeonEditSheet.tsx, AnaesthetistRecord.tsx and SpecialtiesView.tsx; all the reviewer's evidence holds. Changed Partial to Contradicts: the 'No surgeon group record' acceptance criterion now says no such list exists, and the prototype implements exactly that list (and a Groups card), which is wrong behaviour rather than merely absent behaviour. Added that the anaesthetist record also edits through one sheet, so one-card-one-change holds only on the Contract page. |
