# Build plan · Gap analysis

Catalogue snapshot `5f87781` · generated 2026-11-25 · 12 in-scope items (76 retired or Future Work excluded)

The plan was seeded empty at `64b3dff`, with no gap analysis: the prototype was taken as matching the catalogue then. Only items changed since are graded here; 301 in-scope items not graded since are left out.

**Method.** Per-epic Sonnet reviewers against six prototype maps, each review re-checked by an adversarial Sonnet verifier; plus a verified data-model delta. Supporting analysis: [prototype maps](analysis/), [data-model delta](analysis/domain-model-delta.md). Machine-readable data: [gaps.json](gaps.json). The development plan built from this is in [ROADMAP.md](ROADMAP.md) and [index.html](index.html).

**Verdicts.** Matches: the prototype demonstrates the requirement as now written. Partial: present but missing rules or acceptance criteria. Contradicts: implemented, but some behaviour now differs from the requirement. Missing: nothing represents it. OutOfScope: cannot be shown in a front-end demo, even with a demo button. Grouping: an epic or feature with no rules of its own. Sizes are for a Claude Code session: S under an hour, M a few hours, L about a session, XL more.

## At a glance

| Epic | Contradicts | Partial | Missing | OutOfScope | Matches | Grouping | Items |
|---|---:|---:|---:|---:|---:|---:|---:|
| [EP-01 · Schedule canvas, Slots and Lists](#ep-01) |  |  |  |  |  |  | 0 |
| [EP-02 · Booking intake and change handling](#ep-02) |  |  |  |  |  |  | 0 |
| [EP-03 · Booking and Procedure capture (anaesthetist)](#ep-03) |  |  |  |  |  |  | 0 |
| [EP-04 · Contracts](#ep-04) |  | 6 |  |  | 3 | 1 | 10 |
| [EP-05 · RVG master data and fee calculation rules](#ep-05) |  |  |  |  |  |  | 0 |
| [EP-06 · Prepayment](#ep-06) |  |  |  |  |  |  | 0 |
| [EP-07 · List approval workflow](#ep-07) |  |  |  |  |  |  | 0 |
| [EP-08 · Billing/Invoice Engine and internal ledger](#ep-08) |  |  |  |  |  |  | 0 |
| [EP-09 · Xero integration](#ep-09) |  |  |  |  |  |  | 0 |
| [EP-10 · Payments, disbursement and AA fees](#ep-10) |  |  |  |  |  |  | 0 |
| [EP-11 · Patients and billable parties](#ep-11) |  |  |  |  |  |  | 0 |
| [EP-12 · Anaesthetist profile and reporting](#ep-12) |  |  |  |  |  |  | 0 |
| [EP-13 · Admin oversight and master data](#ep-13) | 1 | 1 |  |  |  |  | 2 |
| [EP-14 · Health systems integration](#ep-14) |  |  |  |  |  |  | 0 |
| [EP-15 · Non-functional requirements](#ep-15) |  |  |  |  |  |  | 0 |
| **Total** | **1** | **7** | **0** | **0** | **3** | **1** | **12** |

Verification: 1 of 12 gradings were corrected by the adversarial verifier (see [Verification log](#verification-log)).

## Not represented in the prototype

Every in-scope requirement graded Missing, by epic.

## Structural changes (data model)

All four deltas survived; none dropped and none added. I updated /Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP/docs/build-plan/analysis/domain-model-delta.md to match.

DM-01 is corrected. The relationship and the need are real. The home needed fixing, because the change date is chosen by the office. The existing `disabledDaysByContract` reads the audit entry's timestamp, which is the save time, so the replacement's audit entry needs an explicit `replaces {contractId, fromISO}` field. A `fromISO` field on the Contract would be a date on the Contract. That sits against US-04.1.2 "No dates" and the open OQ-144. So the audit route is recommended, with no persist bump and no seed change needed. `domain-model.md` does not describe the link, so US-04.1.8 is its only authority.

DM-02 is corrected. I added three points the author missed:
- `setProcedureContract` has no planner. It calls `mutate()` itself and has side effects: it clears the typed price and rail answers, can re-open a completed Booking, and can settle a prepayment. "One action" is therefore a run of per-Procedure commits, or a refactor into a planner.
- The still-on list does not exclude removed Draft Lists, but those Procedures cannot be moved.
- Event fees are separate records (`masters.contractEventFees`) that the create planner does not copy. The stories leave open whether the copy carries them.

I also corrected two line refs and noted that the old Contract must be moved from first, then disabled.

DM-03 and DM-04 are upheld, with notes added. For DM-03, the rail's work card opens rows only as Bookings and needs a way to open a Contract. Whether a re-enabled old Contract brings the to-do back is unstated. For DM-04, the late-disable list and the review flag differ on purpose, as the criterion expects, and the list is shared with DM-02.

I also re-checked the author's "no delta" list. The Contract page, grouped list, Parties and Funding tags tabs, and price-range table are screens over data that already exists. The holder-fixed rule is already enforced in the prototype.

| ID | Kind | Change | Size | Catalogue |
|---|---|---|---|---|
| DM-01 | NewRelationship | A Contract remembers which Contract it replaces, and from when | M | requirements-board/requirements/stories/US-04.1.8.md, requirements-board/requirements/stories/US-04.1.2.md, requirements-board/requirements/stories/US-04.1.3.md, requirements-board/requirements/questions/OQ-144.md |
| DM-02 | NewLifecycle | Replace a Contract from a date, as one action | L | requirements-board/requirements/stories/US-04.1.8.md, requirements-board/requirements/stories/US-04.1.2.md, requirements-board/requirements/stories/US-04.1.3.md, requirements-board/requirements/stories/US-04.2.15.md, requirements-board/requirements/stories/US-07.3.1.md, requirements-board/requirements/stories/US-04.1.7.md |
| DM-03 | NewEntity | A Contract still Active after its replacement date is a to-do item | M | requirements-board/requirements/stories/US-04.1.8.md, requirements-board/requirements/stories/FT-13.7.md, requirements-board/requirements/stories/US-13.7.2.md, requirements-board/requirements/questions/OQ-144.md |
| DM-04 | ChangedLifecycle | Disabling is confirmed and lists the Procedures first | S | requirements-board/requirements/stories/US-04.1.2.md, requirements-board/requirements/stories/US-04.1.8.md, requirements-board/requirements/stories/US-07.2.2.md |

Detail and impact: [analysis/domain-model-delta.md](analysis/domain-model-delta.md).

## Prototype behaviour to remove or rework

## By epic

<a id="ep-01"></a>

### EP-01 · Schedule canvas, Slots and Lists

[EP-01](../../requirements-board/requirements/stories/EP-01.md) · epic status Agreed (4) · 

<a id="ep-02"></a>

### EP-02 · Booking intake and change handling

[EP-02](../../requirements-board/requirements/stories/EP-02.md) · epic status Verify (3) · 

<a id="ep-03"></a>

### EP-03 · Booking and Procedure capture (anaesthetist)

[EP-03](../../requirements-board/requirements/stories/EP-03.md) · epic status Agreed (4) · 

<a id="ep-04"></a>

### EP-04 · Contracts

[EP-04](../../requirements-board/requirements/stories/EP-04.md) · epic status Verify (3) · 6 Partial, 3 Matches, 1 Grouping

> Structural: EP-04's shell is the main gap. Contracts, Parties and Funding tags are three Billing views inside Master data (masterViews.ts, ?view=contracts\|parties\|fundingTags) opening side panels. The catalogue now wants a Contracts section of the Admin app with its own nav entry, a page per Contract with separately saved cards, a New contract page, a grouped catalogue with an index, Parties and Funding tags as tabs, a Party page, and a Replace-from-a-date action (phases 45 to 49). The step rail (US-04.3.8), backstops (US-04.3.9) and funding-tag placement (US-04.2.17) already match, and their open questions (OQ-145, OQ-146) are consistent with current behaviour. Verification changed one detail: the price range table already shows each range's end inside its 'In force' cell (rangeSpanText), so only a To column, Change column, Procedures-priced count, newest-first order and the fold after three are missing. Domain support is largely in place: partyRefusal, billingDetailsRefusal, fundingTagRefusal, contractRefusal (incl. holderBillingDetails), nextAaCode, rangeInForce, rangeSpanText, proceduresStillOnContract (skips authorised Lists), contractDisabledOn, destinationOf, the contractDisabled review flag, and audit actions for Party, Contract, price range, specialty, funding tag and RVG group. New work: a stored replace link and date (Contract has no date field, so likely an audited entry or a new field with a PERSIST_VERSION bump), a replaceContract store action that copies the Contract, moves ticked Procedures with audit, and either leaves the old Contract active or disables it; a to-do or warning rule on the change date (nothing under domain/warnings/rules; WarningsToDo is the Day view surface); a late-disable listing from the stored change date (reuse proceduresStillOnContract); a disable-confirm step that lists Procedures from today; a similar-name hint; per-card save with one audit entry each (editContract today writes one whole-Contract contract.update); a Procedures-on-the-Contract list (upcoming and authorised at locked price; lockedAgainstContract covers only the authorised half); a read-only Party billing block; per-range Procedures-priced counts and the fold; Party counts by funding tag; grouping facets (holder, kind of holder, tag, surgeon incl. two-surgeon Contracts under both, destination, pricing kind) with an index. Demo triggers: the existing advanceClockToDate store action (clockActions.ts, used by the prepayment trigger) makes the 'reach the change date' button cheap; the demo-backdated-range trigger's `when` (registry.ts:1894, reads adminMasters.view and adminContracts.openContractId) must follow the new section, and the old ?view=contracts\|parties\|fundingTags URLs need redirects (parseMastersView in screens/masters/view.ts). Demo guide: S1 to S5 do not use the Contracts master (S1 Beat 3 and the phone beat use the unchanged shared rail), but docs/demo-guide/03-demo-script.md:113 links ?view=contracts&holder=PY-COS and demoGuideSync.test.ts must stay green; the catalogue screenshots show the retired dated model and are left to the owner's /sweep. All ten items are status Verify (3) and the late-disable rule, the to-do on the date and future-dated disable (OQ-144) are not yet discussed with AA.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-04.1.2](../../requirements-board/requirements/stories/US-04.1.2.md) [Create, edit and disable Contracts](epics/EP-04.md#us-04.1.2) | Verify (3), [OQ-144](../../requirements-board/requirements/questions/OQ-144.md) | Partial | Create, edit in place, Active/Disabled, search, status filter, fixed holder/prepaid/pricing kind, no dates and the late disabled-Procedure flag all exist, but the list cannot be grouped or indexed, a new Contract is a side panel rather than an ordered page with a similar-name hint, and Disable has no confirm step listing Procedures from today. | L |
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

[EP-06](../../requirements-board/requirements/stories/EP-06.md) · epic status Verify (3) · 

<a id="ep-07"></a>

### EP-07 · List approval workflow

[EP-07](../../requirements-board/requirements/stories/EP-07.md) · epic status Agreed (4) · 

<a id="ep-08"></a>

### EP-08 · Billing/Invoice Engine and internal ledger

[EP-08](../../requirements-board/requirements/stories/EP-08.md) · epic status Agreed (4) · 

<a id="ep-09"></a>

### EP-09 · Xero integration

[EP-09](../../requirements-board/requirements/stories/EP-09.md) · epic status Proposed (1) · 

<a id="ep-10"></a>

### EP-10 · Payments, disbursement and AA fees

[EP-10](../../requirements-board/requirements/stories/EP-10.md) · epic status Agreed (4) · 

<a id="ep-11"></a>

### EP-11 · Patients and billable parties

[EP-11](../../requirements-board/requirements/stories/EP-11.md) · epic status Verify (3) · 

<a id="ep-12"></a>

### EP-12 · Anaesthetist profile and reporting

[EP-12](../../requirements-board/requirements/stories/EP-12.md) · epic status Proposed (1) · 

<a id="ep-13"></a>

### EP-13 · Admin oversight and master data

[EP-13](../../requirements-board/requirements/stories/EP-13.md) · epic status Agreed (4) · 1 Contradicts, 1 Partial

> Both items are the Master data side of Donald's 25 Nov Contracts-section decision. Closing them is mostly moving the Contracts, Parties and Funding tags views out of Master data into a new Contracts section (phases 45 and 48 of the brief), plus a Contracts-under-a-tag panel on the Funding tags tab, grouped by hospital with counts. Dependencies: US-04.1.7, US-04.1.8 and US-04.1.2 own the new section, Contract page, New contract page, grouped catalogue and Replace from a date. Structural touch points: the masterViews.ts registry and masterViews.test.ts catalogue-row mapping, redirects for old ?view=contracts, ?view=parties and ?view=fundingTags links, the Party 'active' link (?view=contracts&holder=), the demo-trigger contexts adminMasters.view and adminContracts.openContractId, the Seed load and Go-live entity sheets (contracts, priceRanges, parties, fundingTags), and the Admin SideNav and AdminApp sectionForPath. Funding tag behaviour (order, funder, audited changes, Suggested path via the rail) works today and must be preserved. No new demo trigger is needed; the existing demo-backdated-range trigger on Contracts should follow the move. The demo guide and screenshots (US-13.4.1 images admin-master-data-contracts*, -parties and -funding-tags; US-13.4.5 images) change path with the move, but they are left to the owner's /sweep and not edited per phase. I did not read the demo script, so I do not name the beats.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-13.4.1](../../requirements-board/requirements/stories/US-13.4.1.md) [Maintain reference tables](epics/EP-13.md#us-13.4.1) | Verify (3) | Contradicts | Every master is maintained and audited as listed, but Contracts, Parties and Funding tags are still Master data views (group Billing), where the story now puts them on their own tabs of a separate Contracts section. | M |
| [US-13.4.5](../../requirements-board/requirements/stories/US-13.4.5.md) [Funding tags](epics/EP-13.md#us-13.4.5) | Verify (3) | Partial | The funding tag list (code, funder Party, step-rail order, audited add, edit and remove, Suggested path from the funder) works as required, but it lives in Master data rather than a Contracts-section tab, and picking a tag shows no Contracts grouped by hospital with counts (only one total per tag). | S |

Details for every gap: [epics/EP-13.md](epics/EP-13.md).

<a id="ep-14"></a>

### EP-14 · Health systems integration

[EP-14](../../requirements-board/requirements/stories/EP-14.md) · epic status Proposed (1) · 

<a id="ep-15"></a>

### EP-15 · Non-functional requirements

[EP-15](../../requirements-board/requirements/stories/EP-15.md) · epic status Proposed (1) · 

## Excluded from this analysis

Retired items, stories in the Future Work lane and features whose live stories are all there were not graded.

[FT-04.4](../../requirements-board/requirements/stories/FT-04.4.md) Default Contracts for hospitals, insurers and procedures (Retired (6)) · [FT-06.1](../../requirements-board/requirements/stories/FT-06.1.md) Prepaid procedure settings on the anaesthetist profile (Retired (6)) · [FT-06.4](../../requirements-board/requirements/stories/FT-06.4.md) Settlement after the procedure (Retired (6)) · [FT-11.4](../../requirements-board/requirements/stories/FT-11.4.md) Insurers (Retired (6)) · [FT-14.1](../../requirements-board/requirements/stories/FT-14.1.md) HL7 v2 inbound (Proposed (1)) · [FT-14.2](../../requirements-board/requirements/stories/FT-14.2.md) FHIR R4 (Proposed (1)) · [FT-14.3](../../requirements-board/requirements/stories/FT-14.3.md) Near real time (Proposed (1)) · [FT-14.5](../../requirements-board/requirements/stories/FT-14.5.md) Reliability and monitoring (Proposed (1)) · [FT-14.6](../../requirements-board/requirements/stories/FT-14.6.md) Further hospital feeds and automatic matching (Proposed (1)) · [US-01.3.4](../../requirements-board/requirements/stories/US-01.3.4.md) AM and PM can differ (Retired (6)) · [US-02.1.5](../../requirements-board/requirements/stories/US-02.1.5.md) Automatic sync from St George's and Southern Cross (Proposed (1), Future Work) · [US-02.2.2](../../requirements-board/requirements/stories/US-02.2.2.md) Edit then ingest (Retired (6)) · [US-02.2.3](../../requirements-board/requirements/stories/US-02.2.3.md) Detect Bookings removed from a re-sent List (Verify (3), Future Work) · [US-02.3.5](../../requirements-board/requirements/stories/US-02.3.5.md) Send booking change emails automatically (Proposed (1), Future Work) · [US-02.4.2](../../requirements-board/requirements/stories/US-02.4.2.md) Photo capture of the physical card (Retired (6)) · [US-02.4.3](../../requirements-board/requirements/stories/US-02.4.3.md) Copy a Booking (Retired (6)) · [US-02.4.4](../../requirements-board/requirements/stories/US-02.4.4.md) Add a Booking from a photo of the booking card (Proposed (1), Future Work) · [US-02.5.1](../../requirements-board/requirements/stories/US-02.5.1.md) Apply a modification (Agreed (4), Future Work) · [US-02.5.2](../../requirements-board/requirements/stories/US-02.5.2.md) Reschedule to another day arrives as cancel and new Booking (Agreed (4), Future Work) · [US-02.5.3](../../requirements-board/requirements/stories/US-02.5.3.md) Record a cancellation (Agreed (4), Future Work) · [US-02.5.4](../../requirements-board/requirements/stories/US-02.5.4.md) Inbound changes accepted until the List is authorised (Agreed (4), Future Work) · [US-02.5.6](../../requirements-board/requirements/stories/US-02.5.6.md) Concurrent edits (Proposed (1), Future Work) · [US-03.1.3](../../requirements-board/requirements/stories/US-03.1.3.md) Attachments (Retired (6)) · [US-03.3.2](../../requirements-board/requirements/stories/US-03.3.2.md) Override a ranged base code (Retired (6)) · [US-03.3.5](../../requirements-board/requirements/stories/US-03.3.5.md) Itemise modifiers (Retired (6)) · [US-03.3.6](../../requirements-board/requirements/stories/US-03.3.6.md) Other billing lines (Retired (6)) · [US-03.3.7](../../requirements-board/requirements/stories/US-03.3.7.md) Rate x time capture (Retired (6)) · [US-03.5.3](../../requirements-board/requirements/stories/US-03.5.3.md) Adjustment reason (Retired (6)) · [US-04.1.6](../../requirements-board/requirements/stories/US-04.1.6.md) Stage Contract changes for review, then submit (Retired (6)) · [US-04.2.10](../../requirements-board/requirements/stories/US-04.2.10.md) Contract prices effective from a date (Retired (6)) · [US-04.2.12](../../requirements-board/requirements/stories/US-04.2.12.md) Payment setting: full payment or split (Retired (6)) · [US-04.2.13](../../requirements-board/requirements/stories/US-04.2.13.md) Export and re-import Contracts (Verify (3), Future Work) · [US-04.2.3](../../requirements-board/requirements/stories/US-04.2.3.md) Base unit override (Retired (6)) · [US-04.2.4](../../requirements-board/requirements/stories/US-04.2.4.md) Contract lines (Retired (6)) · [US-04.2.5](../../requirements-board/requirements/stories/US-04.2.5.md) Multi-procedure rule per Contract (Retired (6)) · [US-04.2.6](../../requirements-board/requirements/stories/US-04.2.6.md) Adjustment and override permissions (Retired (6)) · [US-04.2.7](../../requirements-board/requirements/stories/US-04.2.7.md) Required booking inputs (Retired (6)) · [US-04.2.9](../../requirements-board/requirements/stories/US-04.2.9.md) Organisational and individual Contracts (Retired (6)) · [US-04.3.6](../../requirements-board/requirements/stories/US-04.3.6.md) Hospital data sets the Contract (Proposed (1), Future Work) · [US-04.3.7](../../requirements-board/requirements/stories/US-04.3.7.md) Confirm a price with the hospital (Verify (3), Future Work) · [US-04.4.1](../../requirements-board/requirements/stories/US-04.4.1.md) Mandatory default Contract (Retired (6)) · [US-04.4.2](../../requirements-board/requirements/stories/US-04.4.2.md) Default RVG Contract for every procedure (Retired (6)) · [US-05.1.2](../../requirements-board/requirements/stories/US-05.1.2.md) Add AA codes (Retired (6)) · [US-05.1.6](../../requirements-board/requirements/stories/US-05.1.6.md) Procedure master mapped to RVG codes (Retired (6)) · [US-05.2.3](../../requirements-board/requirements/stories/US-05.2.3.md) Conditional positioning modifier (Retired (6)) · [US-05.2.4](../../requirements-board/requirements/stories/US-05.2.4.md) Contract rate or discount (Retired (6)) · [US-05.3.2](../../requirements-board/requirements/stories/US-05.3.2.md) Time units on every Procedure (Retired (6)) · [US-05.3.3](../../requirements-board/requirements/stories/US-05.3.3.md) Modifier split above four units (Retired (6)) · [US-05.3.4](../../requirements-board/requirements/stories/US-05.3.4.md) Contract-specific second-procedure rules (Retired (6)) · [US-06.1.1](../../requirements-board/requirements/stories/US-06.1.1.md) Tick procedures or groups (Retired (6)) · [US-06.1.2](../../requirements-board/requirements/stories/US-06.1.2.md) Admin can maintain on behalf (Retired (6)) · [US-06.2.3](../../requirements-board/requirements/stories/US-06.2.3.md) Prepayment is an estimate (Retired (6)) · [US-06.2.4](../../requirements-board/requirements/stories/US-06.2.4.md) Calculate the prepayment estimate (Retired (6)) · [US-06.2.5](../../requirements-board/requirements/stories/US-06.2.5.md) Estimated duration from the surgeon's rooms (Retired (6)) · [US-06.3.3](../../requirements-board/requirements/stories/US-06.3.3.md) Alert on unpaid prepayment (Retired (6)) · [US-06.4.2](../../requirements-board/requirements/stories/US-06.4.2.md) No automatic credit when prepaid exceeds final (Retired (6)) · [US-07.1.2](../../requirements-board/requirements/stories/US-07.1.2.md) Cannot submit an incomplete List (Retired (6)) · [US-08.1.2](../../requirements-board/requirements/stories/US-08.1.2.md) Contract already resolved (Retired (6)) · [US-09.1.2](../../requirements-board/requirements/stories/US-09.1.2.md) InvoiceNumber and Reference (Retired (6)) · [US-09.3.2](../../requirements-board/requirements/stories/US-09.3.2.md) NHI never sent to Xero (Retired (6)) · [US-10.2.2](../../requirements-board/requirements/stories/US-10.2.2.md) Partial payment releases exactly that amount (Retired (6)) · [US-11.1.3](../../requirements-board/requirements/stories/US-11.1.3.md) Deduplicate on NHI (Retired (6)) · [US-11.4.1](../../requirements-board/requirements/stories/US-11.4.1.md) Insurer master data (Retired (6)) · [US-11.4.2](../../requirements-board/requirements/stories/US-11.4.2.md) Insured patient who forwards the invoice (Retired (6)) · [US-12.1.2](../../requirements-board/requirements/stories/US-12.1.2.md) GST period (Retired (6)) · [US-12.1.3](../../requirements-board/requirements/stories/US-12.1.3.md) Prepaid procedures (Retired (6)) · [US-12.1.5](../../requirements-board/requirements/stories/US-12.1.5.md) Bank details for disbursement (Retired (6)) · [US-13.2.3](../../requirements-board/requirements/stories/US-13.2.3.md) Per-anaesthetist balance (Retired (6)) · [US-13.6.1](../../requirements-board/requirements/stories/US-13.6.1.md) Surgeons' rooms master record (Retired (6)) · [US-13.7.4](../../requirements-board/requirements/stories/US-13.7.4.md) Warning and check-step settings (Proposed (1), Future Work) · [US-14.1.1](../../requirements-board/requirements/stories/US-14.1.1.md) Parse SIU messages (Proposed (1), Future Work) · [US-14.2.1](../../requirements-board/requirements/stories/US-14.2.1.md) Internal booking model (Proposed (1), Future Work) · [US-14.3.1](../../requirements-board/requirements/stories/US-14.3.1.md) Real-time processing (Proposed (1), Future Work) · [US-14.5.1](../../requirements-board/requirements/stories/US-14.5.1.md) Integration failure visibility (Proposed (1), Future Work) · [US-14.6.1](../../requirements-board/requirements/stories/US-14.6.1.md) Feeds from the other Christchurch providers (Proposed (1), Future Work) · [US-14.6.2](../../requirements-board/requirements/stories/US-14.6.2.md) Automatic matching and updates (Proposed (1), Future Work)

<a id="verification-log"></a>

## Verification log

Each epic's gradings were re-checked from scratch by a separate verifier told to refute them. 1 corrections:

| Item | From | To | Why |
|---|---|---|---|
| [US-04.2.15](../../requirements-board/requirements/stories/US-04.2.15.md) | Partial | Partial | Corrected one point: the reviewer said the end is not shown, but ContractPriceRanges.tsx:174 renders rangeSpanText in the In force column, so the implied end is visible (only a distinct To column is missing). Verdict stays Partial: the other columns, newest-first order and folding are missing. Not Contradicts, since nothing implemented is wrong. |
