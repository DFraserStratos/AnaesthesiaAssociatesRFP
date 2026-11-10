# Phase 42 · Reference data and controlled loads

**Requirements covered:**
[US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md) Maintain reference tables (status 3, back to Verify 5 November; closes the rows Phases 17, 18, 18a, 19, 19b, 29 and 30 did not: hospital retire, the master public-holiday calendar, and one consistent pattern across every master. The list now names Parties (insurers and funders among them; Greg 2026-10-28: insurers are "just an instance of contract holders", so no insurer master), specialties and funding tags (18a), and Contracts with their price ranges (18, 19a). Its "recurring bookings" row is Phase 30's rename and editor, refitted here. A Contract change is an audited edit and a fixed price changes through a price range, never a new version. Greg would call these master data, not reference tables (2026-10-02 #39): the app says "Master data" only) ·
[US-13.4.2](../../../../requirements-board/requirements/stories/US-13.4.2.md) Clean-cut start, not a full migration (status 4; unchanged in substance) ·
[US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md) Reference data loaded at cutover (status 1; changed 5 November: a developer loads the starting data once, repeatably, and it is then changed by hand on screen. It is expected to cover hospitals, surgeons with their specialties and rooms, RVG groups with base units, modifiers, Parties, specialties and funding tags, Contracts one per priced item with their price ranges, and anaesthetists; exactly what is loaded, and from what source, is not yet clear; **no procedure list**; the Contract export and re-import is Future Work. **Ben's specialist list arrived 3 November** and "may contain some inaccuracies": it has no HPI CPNs or registration numbers and some rows have no title or surname, so the surgeons and rooms sheets take its shape, OQ-129) ·
[DM-38](../analysis/domain-model-delta.md#dm-38) Reference data: a master public-holiday calendar and spreadsheet-loaded masters, the Contract upload and export Future Work (the statutory calendar and the seed loads; Phase 30 built the hospital-calendar half and the recurring-booking rename, Phase 31 the recurring clash that becomes a Draft List).
Also touches, without closing:
[FT-13.4](../../../../requirements-board/requirements/stories/FT-13.4.md) (the feature; its RFP-response ETL migration is narrowed to the clean cut),
[US-13.4.4](../../../../requirements-board/requirements/stories/US-13.4.4.md) (specialties) and [US-13.4.5](../../../../requirements-board/requirements/stories/US-13.4.5.md) (funding tags): 18a built their masters and editors; they are refitted to the one pattern and loaded here,
[US-13.6.6](../../../../requirements-board/requirements/stories/US-13.6.6.md) (a surgeon's specialties, required; 18a),
[US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md) (RVG groups, the one master list with a hidden key and no procedure list; a load target, Phase 19 built them),
[US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md) (Verify; "Admins load the modifier list as master data": the RVG table from AR-34's files plus AA's own, Phase 19b built it; AA's rows become loadable, editable and retirable here),
[US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) (Parties, insurers and funders among them, each with a delivery setting; 18 built them), [US-04.2.15](../../../../requirements-board/requirements/stories/US-04.2.15.md) (price ranges), [US-04.2.16](../../../../requirements-board/requirements/stories/US-04.2.16.md) and [US-04.2.17](../../../../requirements-board/requirements/stories/US-04.2.17.md) (a Contract's specialties and funding tag), [US-04.2.18](../../../../requirements-board/requirements/stories/US-04.2.18.md) (holder reference code, invoice description, default RVG code) and [US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) (an anaesthetist's price list, one prepaid Contract per item): all load targets, built by 18 and 19a,
[US-04.2.13](../../../../requirements-board/requirements/stories/US-04.2.13.md) (Future Work: the Contract upload and export is **not** built; the seed load is separate from it, D34),
[US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md) (Confirmed; the RVG time tiers, held as data by 19a, become editable here; a part interval always rounds up),
[US-01.5.1](../../../../requirements-board/requirements/stories/US-01.5.1.md) (Confirmed; each hospital keeps its own calendar, and public holidays move out of it),
[US-01.3.2](../../../../requirements-board/requirements/stories/US-01.3.2.md) (Verify; recurring bookings, refitted to the one pattern and counted in retire blockers).
**Left this phase on 2026-10-08:** [US-04.4.2](../../../../requirements-board/requirements/stories/US-04.4.2.md) and
[FT-04.4](../../../../requirements-board/requirements/stories/FT-04.4.md) (Retired: there are no default RVG Contracts) and
[US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md) (Retired: the Contract has no payment setting;
the split is a Booking action). **Left by 2026-10-20:** [US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md) (Retired: there is no procedure list). **Left on 2026-10-28:** [US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) (Retired: no insurer master; insurers are Parties). **Left on 2026-11-10:** [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) (Contract lines, Retired: each priced item is its own Contract) and [US-04.1.6](../../../../requirements-board/requirements/stories/US-04.1.6.md) (staged Contract changes, Retired: Contracts are edited in place and audited, so there is no review dashboard to go through and no dependency on 25). **Joined:** none. No RV finding is closed here.

**Decisions and questions** (ROADMAP.md owner decisions table, as re-read on 2026-11-10; Donald's 5 November decisions D1 to D11 are made for the build, not yet confirmed by AA or Greg):
- **D34** ([OQ-100](../../../../requirements-board/requirements/questions/OQ-100.md), **answered 2026-11-05**, Donald's D10): built as answered. The
  first release is a **developer-run cutover load plus office screens**; there is **no in-app Contract
  upload or export** (US-04.2.13 is Future Work) and **no staged review** (US-04.1.6 Retired). Contracts
  are edited in place and audited (18), a fixed price changes by adding a price range (19a). This phase
  builds the loader as a demo stand-in for the developer's one-off load (work items 4 to 10 and 13) and
  the office maintains every master by hand. Ben and Vanessa's wish for a safe copy outside the system
  is met by the system itself being the source of truth, backed up by its hosting (Donald): nothing to
  build.
- **D55** ([OQ-114](../../../../requirements-board/requirements/questions/OQ-114.md), open; **provisional**): delivery is held on the **Party** (18; 22 reads
  it): email or post, no portal value until OQ-114 names one, so the Parties sheet loads those two; a blank
  is not set, and 18's guard asks for it once a Contract bills the Party. Logged on the owner's review list.
- **D75** ([OQ-128](../../../../requirements-board/requirements/questions/OQ-128.md), answered 2026-11-04, Donald for the build):
  a surgeon belongs to one or more rooms, built as answered (17a made `Surgeon.roomIds` a list, the first
  the main room). The surgeons sheet loads a surgeon at **each room listed**.
- **D76** ([OQ-129](../../../../requirements-board/requirements/questions/OQ-129.md), open; **provisional**; the list carries no HPI CPNs and some rows lack a title
  or surname): built as its default, the catalogue as written. A surgeon's HPI CPN stays required
  (US-13.6.2), so the surgeons sheet rejects a row with no HPI CPN, or with a first name only, and
  lists it with its reason. One validator (17's), so "load now, require it before the first Booking"
  stays a small change. Logged on the owner's review list.
- **D74** (contacts, provisional, 17a): practice manager and PA contacts are entered by hand; **no
  contacts sheet**.
- **Answered, built as answered (no label):**
  - **Donald's D1 and the plan's D77, flat Contracts** ([OQ-131](../../../../requirements-board/requirements/questions/OQ-131.md)): one Contract per priced item, no lines, versions or staged
    changes. So the Contracts sheet is one row per item and the price ranges sheet adds ranges to it;
    the model is [AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md) with its ERD [AR-61](../../../../requirements-board/requirements/artifacts/AR-61.md) (AR-28, AR-29 and AR-30 are Retired: never cited).
  - **D2, Party**: a Party holds the billing name, delivery and (for a hospital) its hospital; each
    Contract says whether it bills its holder or the payer. The Parties sheet loads the first; the
    Contracts sheet the second. Insurers and funders are Parties.
  - **D3, specialties**: AA's broad specialty list and each surgeon's one or more specialties,
    **required**; a surgeon row with none is rejected and listed. A Contract carries none or more.
  - **D4, settings and funding tag**: a Contract's settings include one optional funding tag from AA's list.
    ACC is a tag, never a kind of Contract.
  - **D6, price ranges**: a fixed-price Contract has one or more ranges, each a start date (which may be
    in the past) and a price ex GST; the procedure date picks the range in force. A blank price is not
    set and 0 is a value, decided by 18's and 19a's validators.
  - **D12 superseded, and the AA code**: base units live on the RVG group alone; a Contract states
    none, only a default RVG code. A Contract's AA code is its unique key (US-04.1.4): the sheet may
    carry it, and a blank takes 18's next code.
  - **D23, D30 and D64, prepaid**: a prepaid Contract always bills the payer, is a fixed price (or
    open-price fallback) with ranges above zero and never carries the override. 18's guards refuse
    the rest, so the sheet shows their words.
  - **D42 and D48, price lists**: an anaesthetist's price list is one prepaid Contract per item
    (linked to its anaesthetist) and a surgeon's arrangement one Contract per item linked to its
    surgeons; both load through the same Contracts sheet as any other.
  - **D45 superseded** (OQ-48): no versions; a loaded range's start is the sheet's.
  - **Open-price fallbacks** (18a): the system makes them (18a's `ensureFallbacks`); they are never
    loaded and a sheet row of pricing kind Open price is rejected.
  - **D25 superseded**: the time rule applies to recorded time only; a part interval always rounds
    up, so the time-rule editor edits tiers only.
  - **D14**: "slot" never reaches app copy.
  - **US-13.4.3's re-load question is answered by its text**: loaded once by a developer, then
    changed by hand, repeatable so a test system can be wiped and reloaded. So there is **no office
    "Load from spreadsheet" action**; the loader lives only in a demo-badged **Seed load** view.
- **Answered, followed as their owning phases built them (no label here):** D35 (OQ-101: an RVG
  group row carries a starting figure and an optional published range; 19) and D11 (OQ-49, NHI: not a
  master). "Whether calendar schedules join the list" is still unclear: the calendars (public and
  hospital holidays) load, and recurring bookings stay hand-made, logged for the owner. What the
  one-off load covers and from what source (US-13.4.3) is open: the loader follows its expected list
  and AR-58 section 8. OQ-51 (Solutions Plus identifiers) was deleted unanswered.

**Depends on:** Phase 17a (a surgeons' room may hold no email or phone, so the rooms sheet accepts a row without them; the room's email helper; `Surgeon.roomIds`, the ordered list the surgeons sheet fills, with `mainRoomOf`), Phase 17 (surgeon profile with its one HPI CPN rule (`normaliseHpiCpn`,
`isPlausibleHpiCpn`, the duplicate check across surgeons and anaesthetists), surgeons' rooms, surgeon
groups, hospital contact email, `editHospital`, `isPlausibleEmail`, the `apps/admin/screens/masters/`
split and the `?view=` search param), Phase 18 (the Party master with its create, edit and save guards in one place and the delivery setting; the flat Contract
with its AA code, holder reference code, bills holder or payer, links, prepaid, five pricing kinds,
override setting, Active or Disabled, in-place audited edits and no delete; No contract · RVG held by AA;
`createHospital` minting no Contract; the Admin Contracts screen), Phase 18a (the specialties list and funding tags masters and editors; `Surgeon` specialties, required, and the
directory seed mapped to them; each Contract's specialties and tag; `ensureFallbacks`, the system-made
open-price fallbacks kept in step), Phase 19 (`RvgGroup` with its hidden id, `createRvgGroup` and its refusal sentences, retire and restore, the "RVG groups" tab, `RvgGroupSheet` and the RVG code type-ahead; there is no procedure list), Phase 19a (price ranges: `validatePriceRanges`,
`addPriceRange`, `editPriceRange`, `deletePriceRange` and `rangeInForce`; the Contract's holder reference code, invoice description and default RVG code; the anaesthetists' price lists as prepaid Contracts; `masters.rvgTimeRule` with `validateRvgTimeRule`, `describeTimeRule` and
`timeUnitsFromMinutes`, and the read-only `masters-rvg-time-rule` panel it handed here), Phase 19b
(the `Modifier` master generated from AR-34's files, `addAaModifier`, the band table, the locked age
and included rules), Phase 29 (the availability status master, nav "Availability statuses",
`validateSlotStatusDraft`) and Phase 30 (derived conflicts reconciled in `mutate()`,
`conflictFactsFor`, `describeConflict`, `HolidaySheet`, `addHospitalHoliday`,
`editHospitalHoliday`, `deleteHospitalHoliday`, the hospital month calendar, and recurring bookings
with their projection). Also relies on 14 (the demo-trigger registry, `useDemoTriggerContext`,
`store/demoActors.ts`), 20 (the step rail, which hides Disabled Contracts), 21 (the payer on the Booking and the Booking's insurer or funder Party), 22 (the layout and delivery read from the Party), 23, 26 and 28 (`addAnaesthetist` with
its start date, HPI CPN and profile fields, and 28's one generation path), 31 (the Draft List holiday
warning, the recurring clash that becomes a Draft List, and **AA rooms as a location row in the
hospitals master**, `Hospital.locationType: 'hospital' | 'aaRooms'` with `HOSP.aaRooms`, never a
Party or a feed; its handoff asks 42's Hospitals editor to keep it non-deletable and out of
the Party and feed pickers), 33 (the matching screen's create actions), 34 (the hospitals it appended
and `INTEGRATED_HOSPITALS`) and, by build order rather than as a formal dependency, **39b** (the
Contract event fee, `ContractEventFee` in `masters.contractEventFees`, a fixed fee per event type on a
Contract; its handoff asks 42's loader to accept it beside Contracts). Confirm 39b is
DONE; if it is not, drop the event-fee sheet (work item 8) and log it for Phase 44. There is no
dependency on 25: with no versions or staging, 25 only snapshots a Procedure at AUTHORISED.
**Estimated:** 2 sessions. Session 1 is the model, seed, pure rules and store (work items 1 to 10) and
stops green with every existing screen still rendering. Session 2 is the screens, the Seed load and
Go-live views, the triggers, the shots and the demo guide (items 11 to 19).
**Size warning:** this is a roll-up and sits at the top of two sessions; session 1 in particular is
heavy (fourteen loader specs, the planner refactor and the holiday migration). If session 1 runs long,
end it green after item 7 and start session 2 with items 8 to 10; do not drop a covered target.
Within session 2, trim in this order if needed, and log each trim for Phase 44: the RVG time rule
editor (19a's read-only panel stays), the
collapsible `LoadResultBanner` (keep it static), then the public-holiday "Lists affected" column.

## Goal

Master data has grown one phase at a time. Surgeons, rooms and groups came in 17, Parties and flat
Contracts in 18, specialties and funding tags in 18a, RVG groups in 19, price ranges and the anaesthetists' own
price lists in 19a, modifiers in 19b, availability statuses in 29, holiday
editing and recurring bookings in 30. What is left is the part US-13.4.1 names and nobody owns yet,
a single pattern that makes the whole area feel like one tool, the one-off developer-run load
US-13.4.3 describes, and the clean cut:

- **Hospitals** can be edited (17) and now **retired and reinstated**. A rename also renames the
  hospital's Party while the Party's short name still equals the old hospital name, so
  "change once, reflected everywhere" holds. There is no hospital default Contract to rename (18
  removed them; OQ-78).
- **Insurers and funders are Parties** (US-11.4.1 Retired 2026-10-28). There is no Insurers
  view, flag or master list here, and nothing pre-fills "bills its holder". An insurer is kept in 18's Party
  editor and loaded by the Parties sheet.
- A **master public-holiday calendar**. One row per statutory or regional holiday, applying to every
  hospital unless a hospital is listed as open that day. The seeded per-hospital Labour Day and
  Canterbury Anniversary rows migrate into it, so each hospital's own calendar holds only its own
  closures (US-13.4.1, US-01.5.1). Public holidays raise conflicts through 30's derived rule.
- **Retire, never delete, anything referenced by identity.** Hospitals, surgeons, rooms and groups
  retire with a stated reason when nothing upcoming depends on them
  (18 already disables Contracts, 19 retires RVG groups, 29 statuses, 30 recurring bookings, and 18 and
  18a keep their own rules for Parties, specialties and funding tags). AA's own modifiers become
  editable and retirable here (19b's handoff); the RVG table's rows stay as printed. Pickers stop
  offering retired records, and every existing reference keeps resolving.
- **One consistent pattern across every view:** grouped sub-nav, the same header, "Show retired", edit
  sheet, retire and reinstate. It is driven by one registry of views, with a test that maps every
  US-13.4.1 row to a view that can add and edit, **Parties, specialties, funding tags and Contracts
  with their price ranges included** (18's, 18a's and 19a's screens are refitted, never rebuilt). The 19a time rule joins it as an editable panel
  (tiers only; a part interval always rounds up). There is **no "Load from spreadsheet" on the
  office's views**: the office keeps master data by hand (US-13.4.3). A view whose master the load
  covers says so once in its subtitle ("Loaded once at go-live from AA's controlled spreadsheet, then
  kept here by hand.").
- **A seed load, standing in for the developer's one-off import** (US-13.4.3, DM-38,
  [AR-58 section 8](../../../../requirements-board/requirements/artifacts/AR-58.md) seed mapping). One
  loader with a spec per master: hospitals; hospital holidays and public holidays (the calendars, so a
  test system loads the same way again); surgeons' rooms; surgeons **with their specialties**;
  anaesthetists; **specialties and funding tags**; **RVG groups with their base units** (no procedure
  list, so no general procedures); AA's own modifiers; **Parties** (kind, billing name, delivery, a
  hospital Party's hospital); **Contracts, one per priced item** (AA code, name, holder, holder
  reference code, invoice description, default RVG code, bills holder or payer, Payment type, pricing
  kind, rate or discount, the override setting, funding tag, specialties, linked surgeons or
  anaesthetist, and a fixed price's first range) with **price ranges** added beyond the first (a blank
  cell is not set and 0 is a value, as 18's and 19a's validators decide); and the Contract event fees 39b
  added. A load is checked first: every row is validated with the same rules as the manual add, and a
  result panel lists valid rows and rejected rows with reasons. Then it is loaded: one audited
  `mutate()` loads exactly the valid rows, and rejected rows never touch master data (US-13.4.3 AC1).
  The same sheets loaded after a Reset give identical records (AC2). It lives in a **Seed load** view,
  demo-badged as the developer's step, never in an office screen. There is **no Contract upload or
  export** (D34, US-04.2.13 Future Work), and the system-made open-price fallbacks (18a) follow the load
  automatically: they are never a sheet.
- **Contract edits after the load are in place and audited** (D34 answered, 18). There is no staging, no
  review dashboard and no "New version": the Contracts view saves an edit straight away, a fixed price
  changes by adding a price range (19a), and 25 keeps each Contract's history. This phase builds no check of its own.
- **A clean-cut go-live demo** (US-13.4.2). A Solutions Plus operation list, names only, sits beside
  AA's decisions and the controlled spreadsheets. US-13.4.3 no longer says the names seed a master
  and there is no procedure list, so the demo matches each name to a Contract's invoice description
  (a built default, logged for the owner). Junk such as "10% discount" is excluded, names AA has not
  approved are not loaded and nor are their Contracts, and Solutions Plus unit values are shown struck
  through and never used. "Load approved data" loads only approved, valid rows from the controlled
  spreadsheets (US-13.4.2 AC1 and AC2), figures landing on RVG groups and each Contract's price ranges.

**The pricing model stays in one place.** This phase builds no pricing structure of its own: it
loads into the RVG group, Party, Contract, price-range and modifier shapes that 18, 18a, 19, 19a
and 19b keep in `aa-prototype/src/domain/billing` (plus the seed), through their validators and
create actions, behind the types the UI reads. A loader spec maps spreadsheet columns onto those types
and never declares a second shape or a second rule, so when the design moves the change
stays a contained edit in that module and the specs follow it. The reference shape is the flat Contract model
proposal [AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md), cited by section: 2.1 (Party), 2.2
(Contract), 2.3 (pricing kinds), 2.4 and 5.6 (price ranges), 2.5 and 2.6 (specialty, funding tag), 5.5 (built-ins and
open-price fallbacks), 5.10 (validation) and 8 (seed mapping, AA codes and links), with its ERD
[AR-61](../../../../requirements-board/requirements/artifacts/AR-61.md). AR-28, AR-29 and AR-30 are Retired: never cite them.
**Modifiers** come from the catalogue's files (artifact
[AR-34](../../../../requirements-board/requirements/artifacts/AR-34.md): `NZSA RVG 2021 modifiers.md` and
`NZSA RVG 2021 included modifiers.csv`) through 19b's generated table, never re-transcribed.

Two harness-bar triggers make the loads demoable without files on the presenter's laptop: "Load
sample spreadsheet" and "Go-live data load (demo)". Nothing
here is mobile, so there is no PWA stand-in.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `efe123c` (rename-aware;
   never a plain `git diff` of the catalogue folder):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-13.4.1,US-13.4.2,US-13.4.3,US-13.4.4,US-13.4.5,US-13.6.6,FT-13.4,US-05.1.1,US-05.1.5,US-04.1.5,US-04.2.15,US-04.2.16,US-04.2.17,US-04.2.18,US-04.2.14,US-04.2.13,US-05.2.2,US-01.5.1,US-01.3.2,OQ-100,OQ-114,OQ-101,OQ-128,OQ-129,OQ-131,DM-38
   ```

   At the 2026-11-10 update (`a68f09b..efe123c`, Donald's 5 November decisions) US-13.4.1 and
   US-13.4.3 changed: contract holders became Parties, specialties and funding tags and Contract price
   ranges joined the list and the load, the staged review and the dependency on 25 went (OQ-100
   answered, D34) and a Contract change became an audited edit; the plan reflects all of it. US-04.2.4 and
   US-04.1.6 went Retired. Earlier updates, which the plan already reflects: OQ-128 answered (D75, 2026-11-04);
   US-13.4.3's 3 November specialist list note (OQ-129, D76); US-11.4.1 Retired (2026-10-28); US-13.4.3
   retitled and US-05.1.6 Retired (2026-10-20); US-13.4.3 rewritten as a one-off developer seed, then by hand
   (2026-10-07). Never read the real `Christchurch_Specialists.xlsx`: the fictional copy
   in `docs/discovery-reference/Other docs/` (behind `seed/specialistDirectory.ts`) is the only
   fixture source. Diff only for anything after `efe123c`. If a covered item is now Retired or Future, drop it from this phase and
   say so in the PROGRESS entry. Watch in particular for:
   - **OQ-100 (D34), answered.** If a later answer brings the Contract upload into the first release, it is
     still not this phase's: record it for the owner and Phase 44 (it needs its own phase: format, delta or
     full overwrite, preview), and keep this phase's seed load separate.
   - **Calendar schedules** (US-13.4.3's note: "Whether calendar schedules join the list above was
     left unclear"). If the list gains them explicitly and names recurring bookings, add a
     recurring-bookings sheet through 30's create planner (nothing is painted until the view's "Apply
     to canvas now"; a clash becomes 31's Draft List). If it rules calendars out, keep the calendar
     sheets and say so on the owner's review list.
   - **The spreadsheet list** in US-13.4.3, AR-58 section 8 and the domain model's "Reference
     data and go-live" section. A new target joins the loader only if its master already exists;
     otherwise note it for Phase 44.
   - **The master calendar's scope** (national vs regional, or per-hospital opt-in rather than
     opt-out). This phase builds "applies to every hospital unless listed as open".
   - **OQ-114 (D55).** Open: delivery is a Party setting, email or post. If the other outputs get named,
     extend the Parties sheet's Delivery column only.
   - **OQ-129 (D76).** If HPI CPNs are answered as loadable blank, change the surgeons sheet's one
     rule only (the sheet and sample follow it); the rejection reason is built as the default until
     then. OQ-128 is answered (D75): nothing to watch.
   - **OQ-131 and the flat model.** If AA or Greg change a Contract field, re-shape the matching sheet's
     columns to what 18 and 19a built before building.
2. **Where loaded base units land (D12 superseded, answered).** Base units live on the RVG group
   (above 0, with an optional published range, D35); there is no procedure list and a Contract states none
   (only a default RVG code). So the RVG groups sheet writes the group's base
   units, range and modifier units, and no other sheet carries a unit. A loaded value obeys exactly the
   manual rule of its target (19's `createRvgGroup`). AA's own figures are never refused for differing
   from the NZSA guide, and loading raises no warning: the after-procedure warning is about a value
   recorded on a Procedure, not master data. Nothing loads No contract · RVG or an open-price fallback:
   18 and 18a make them. No Solutions Plus identifier
   is carried: the candidate list holds operation names plus the scan-row number ("Scan row 14").
3. **Baseline.**
   - Confirm Phases 17, 17a, 18, 18a, 19, 19a, 19b, 29 and 30 are DONE in PROGRESS.md, and note whether 20 to
     28, 31, 33, 34 and 39b are DONE.
   - From their entries and Decisions-log rows, note the names actually chosen:
     - the view ids in `?view=` and the `NAV` shape (17, 18's Parties and Contracts, 18a's specialties and funding tags, 19's "RVG groups", 19b's modifiers view, 29, 30);
     - the `SurgeonRoom`, `SurgeonGroup` and `Surgeon` fields (`roomIds`, the specialties field) and the HPI CPN normaliser, shape check
       and duplicate check (17, 17a, 18a);
     - `Party` (`kind`, `name`, `billingName`, `email`, `postalAddress`, `deliveryMethod`, `hospitalId`), its save guard and create action (18); `Contract`
       (`aaCode`, `name`, `holderId`, `billsTo`, `fundingTagId`, `specialtyIds`, `linkedSurgeonIds`,
       `linkedAnaesthetistId`, `prepaid`, `anaesthetistMayOverridePrice`, `pricing`, `holderReference`, `invoiceDescription`,
       `defaultRvgCode`, `status`, `systemRole`), the Contract create and save guards (AR-58 5.10), the AA code generator (`nextAaCode` or
       whatever 18 named it) and No contract · RVG (18);
     - `Specialty` and `FundingTag` with their create actions and validators, `ensureFallbacks` (18a);
     - `RvgGroup` (hidden id, code, description, anatomy, base and modifier units, starting figure and
       range), `createRvgGroup` and its refusal sentences, `RvgGroupSheet` and the type-ahead (19);
     - the price range type, `validatePriceRanges`, `addPriceRange`, `rangeInForce`, `masters.rvgTimeRule`, `validateRvgTimeRule`,
       `describeTimeRule` and `data-shot="masters-rvg-time-rule"` (19a);
     - `Modifier`, the generated AR-34 table and its generator, `addAaModifier` and its refusals, the
       band table (19b);
     - `Booking.insurerOrFunder` (whatever 21 named it); what 22 reads from the Party; what 25's snapshot records;
     - `NewAnaesthetistFields` and `addAnaesthetist` with its start date (26, 28);
     - `masters.slotStatuses` and the "Availability statuses" view id (29);
     - `ListConflict.cause`, `conflictFactsFor`, `holidaysByDateHospital`, `reconcileAllConflicts`,
       the reconcile trigger list in `store/conflictReconcile.ts`, `HolidaySheet`, the hospital month
       calendar, and the recurring-booking names (`RecurringBooking`, `masters.recurringBookings`,
       the projection, `applyRecurringBookingsToCanvas`, the view id) (30); 31's Draft List assignment
       warning, `Hospital.locationType`, `HOSP.aaRooms` and `locationName`;
     - `ContractEventFee`, `masters.contractEventFees`, its validator, create action and id kind
       (`CEF`) (39b);
     - the hospitals 34 appended, their `HOSPITAL_HOLIDAYS` rows, and `INTEGRATED_HOSPITALS` (34's
       `domain/intake/syncDeliveries.ts`);
     - `validateSlotStatusDraft` (29), the precedent for item 4's pure validators.
     Use those names throughout. This doc's code references are as at `60e2d1e` (the prototype was
     last mapped at that commit), or as those phases planned them.
   - Record the seed's flagged-List set today (List ids with a `holiday` conflict, by cause), so the
     public-holiday migration can prove the set does not move (work item 3).
   - Grep every picker that offers hospitals, surgeons, rooms or groups
     (`grep -rn "masters.hospitals\|masters.surgeons\|surgeonRooms\|surgeonGroups\|masters.parties" src --include=*.tsx`)
     and list them, including 18's Party picker, 20's step rail (which hides Disabled Contracts)
     and 21's insurer or funder picker. Work item 16 routes each one
     through the active-only selectors.
   - Grep every reader of hospital holidays
     (`grep -rn "masters.holidays\|holidaysByDateHospital\|HospitalHoliday" src --include=*.ts --include=*.tsx`).
     At `60e2d1e`: the canvas generator (`domain/seed/canvas.ts:90-93`), the horizon advance
     (`store/clockActions.ts:45`), the new-anaesthetist canvas generation in `addAnaesthetist`
     (`store/mastersActions.ts:241`) and the Hospitals view (`MasterData.tsx:275`); 28, 30 and 31 add
     the generation path, `conflictFactsFor`, the recurring-booking projection, the conflict preview
     and the Draft List assignment warning. List them; work item 2 routes each through
     `closuresIndex`, so no reader silently loses Labour Day when the per-hospital rows go.
   - Grep for stored copies of a master's name (a Party named after its hospital, a `hospitalName` on a record). List them; work item 5 handles the linked Party, and
     anything else is noted for the reviewers.
   - Note the current `PERSIST_VERSION` in `src/store/appStore.ts` (18 to 41 will have bumped it) and bump it by one from whatever it is now.
   - Check `docs/discovery-reference/Data files/` (`git log` on it) for Vanessa's base units sheet,
     fuller modifier list, contract schedules and surgeons' rooms list (US-13.4.3's note). If any has
     landed, model the matching sample's columns on its headers (still saved as CSV), but keep every
     fixture row demo-plausible: no real figure is loaded into the seed.
4. **Owner decisions.** D34 and D75 are answered; D55, D76 and D74 are open and built as their
   defaults (above). The rest shape it and are answered: Donald's D1 to D6 of 5 November, D12, D23, D30,
   D64, D42, D48, D25 and D14.

## Reference

**Design files (convention 17).** No mockup covers Master data, a loader or a go-live screen. Extend
the admin's own patterns, and do not invent new chrome:
- `docs/design/Design Language.dc.html`: the tokens (teal the only action colour, crimson identity
  only), the semantic success, warning and error trios for row outcomes, neutral pills, tables, radii,
  the sheet rules, and "colour is never the only signal" (every outcome pill carries its word).
- `docs/design/Admin Review.dc.html`: the Admin table, header (title, subtitle, count, filter chips),
  the four-tile summary row and row actions. The load result panel, the Seed load view and the
  go-live summary follow it.
- `docs/design/Admin Day.dc.html`: the dark-ink side nav and the admin page chrome the Master data
  sub-nav sits in.
- `docs/design/Web Availability.dc.html`: the month cell anatomy that 30's hospital calendar reused.
  Public holidays show in it as closures.

**Catalogue:** the covered items above; `requirements-board/requirements/domain-model.md` sections
"1. What changed since the RFP" (the clean-cut row: a one-off load, then by hand; the Contract upload
separate and Future Work), the Party and Contract sections, "RVG groups,
procedure list and modifier master", "Surgeon, surgeons' room, preferences and priority tiers" and
"Reference data and go-live". Evidence: `npm --prefix requirements-board run source -- --item US-13.4.3 --text`
(the 2026-09-29 points 27, 28, 30 and 31; the 2026-10-02 review points 10, 40 and 77; the 2026-10-07
meeting points 42 and 62, Greg: "They can just type it in by hand. It's such a rare event"; the
5 November decisions points 3, 4, 10 and 16), and the same for US-13.4.1 (the 2026-10-28 note, points 3 and 40; the 5 November decisions points 2, 3, 4, 6 and 16) and OQ-100.
Change log `requirements-board/requirements/changes/2026-11-05-flat-contract-model-and-ben-vanessa-meeting.md` (the US-13.4.1 and
US-13.4.3 rows).

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: the master data theme, the "Oversight/NFR"
  demo-trigger line, and the EP-13 table.
- `docs/prototype-build/catch-up/epics/EP-13.md` (US-13.4.1, 13.4.2, 13.4.3).
- `analysis/domain-model-delta.md` DM-38 (and DM-48 Parties, DM-13 RVG groups, DM-07 and DM-09 Contracts and ranges, DM-44 modifiers, DM-63 and DM-64 specialties and funding tags for the
  load targets).
- `analysis/prototype-map-admin.md` section 9 (Master data), `prototype-map-store-seed.md`
  (`mutate`, `allocateId`, masters actions, seed), `prototype-map-shell-demo-pwa.md` (the trigger
  registry and the PWA closure).

**Code entry points (as at `60e2d1e`; use the names 17 to 34 chose where they differ):**
- `aa-prototype/src/domain/types.ts`: `Hospital` (:155), `Surgeon` (:160),   `PermanentList` (:585, 30's `RecurringBooking`), `HospitalHoliday` (:612), and the types 17, 18,
  18a, 19, 19a and 19b added (rooms, groups, Parties, Contracts, specialties, funding tags, RVG groups, price ranges, modifiers).
- `aa-prototype/src/domain/seed/cast.ts`: `HOSP`, `HOSPITALS`;
  `domain/seed/availabilityAndHolidays.ts`: `HOSPITAL_HOLIDAYS` (:58, a `flatMap` over `HOSPITALS`
  that writes Labour Day Mon 26 Oct and Canterbury Anniversary Day Fri 13 Nov per hospital, plus 30's
  `HH900` closure); `domain/seed/index.ts`: `SeedMasters` and `buildSeed` (holidays at :363 and
  :445); `domain/seed/canvas.ts`: `ADHOC_HOSPITALS` (:61) and the holiday map (:90-93).
- `aa-prototype/src/domain/billing/`: the pricing-model module 18, 18a, 19, 19a and 19b built (Parties,
  Contracts, RVG groups, price ranges, modifiers, the price function and their validators). The loader
  imports from it and never re-implements a rule.
- `aa-prototype/src/domain/conflicts.ts` (30): `conflictFactsFor`, `expectedConflicts`,
  `describeConflict`, `reconcileAllConflicts`; `src/store/conflictReconcile.ts` (30), called only
  from `mutate.ts`.
- `aa-prototype/src/store/mastersActions.ts`: `createHospital` (:45), `addAnaesthetist` (:241), `addHospitalHoliday` (:320), 17's
  `editHospital`, and 30's `editHospitalHoliday` and `deleteHospitalHoliday`.
  `src/store/surgeonActions.ts` (17, 17a, 18a), `contractActions.ts` and the Party actions (18, 19a),
  18a's specialty, funding tag and fallback actions, `rvgMasterActions.ts` (19), 19b's modifier actions.
- `aa-prototype/src/store/mutate.ts`: `ID_FORMATS` (:61), `allocateId` (:100), `MutationMeta`
  (:116). `src/store/appStore.ts`: `AppState`, `PERSIST_VERSION` (:136).
- `aa-prototype/src/apps/admin/screens/MasterData.tsx` and 17's `apps/admin/screens/masters/`
  (`NAV` at :41, `HospitalsView` at :275, `PermanentListsView` at :244,
  `ListStatusesView` at :453 at `60e2d1e`); sheets in `apps/admin/flows/` (`HolidaySheet`,
  `EditHospitalSheet`, `SurgeonEditSheet`, `SurgeonRoomSheet`, `SurgeonGroupSheet`,
  the Party and Contract editors, `RvgGroupSheet`, 19b's modifier
  sheet); `apps/admin/tableChrome.ts`.
- `aa-prototype/src/shared/demoTriggers/` (14): `types.ts` (`surfaces`, `indexPath`), `registry.ts`,
  `context.ts` (`DemoContextValues`); `src/store/demoActors.ts` (`OFFICE_ACTOR`,
  `OFFICE_SIMULATION_ACTOR`); `src/shared/DemoBadge.tsx`.
- `aa-prototype/src/shared/audit/actionLabels.ts`, `auditNarrative.ts`.
- Tests to extend: `store/mastersActions.test.ts`, 17's `store/surgeonActions.test.ts`, 18's
  `store/contractActions.test.ts`, 19's `store/rvgMasterActions.test.ts`, 19b's
  `store/modifierActions.test.ts`, `domain/conflicts.test.ts`, `domain/seed/seed.test.ts`, 28's
  `domain/seed/canvasGolden.test.ts`, `store/persistMigrate.test.ts`,
  `shared/audit/auditNarrative.test.ts`, `shared/demoTriggers/demoTriggers.test.ts`,
  `src/pwa/pwaPurity.test.ts`; Playwright `visual/admin-phase07.spec.ts` (the master-data shot).

## Work items

Build in this order: types, pure rules, seed, store, then screens. **Session 1 ends after item 10,
green.**

1. **Types** (`src/domain/types.ts`; DM-38, US-13.4.1):
   - `Hospital`, `Surgeon`, `SurgeonRoom` and `SurgeonGroup` gain
     `retiredAtISO?: IsoDate` and `retiredReason?: string`. Anaesthetists keep their existing
     `active` flag ("Inactive"); say so in the Decisions log rather than migrating it. Parties and
     Contracts (Active or Disabled), specialties and funding tags keep the lifecycle 18 and 18a gave
     them; the old organisation records are Parties (18), so there is no organisation retire. AA's own
     `Modifier` rows gain the two fields only if 19b gave modifiers no retire field.
   - New `PublicHoliday { id: PublicHolidayId; dateISO: IsoDate; name: string; kind: 'national' | 'regional'; region?: string; openHospitalIds: HospitalId[] }`.
     `openHospitalIds` lists hospitals that run as normal that day; every other hospital is closed.
     The `region` is a label ("Canterbury"), not a filter, because every AA hospital is in
     Christchurch.
   - `SeedMasters` / `AppState['masters']` gain `publicHolidays: Record<PublicHolidayId, PublicHoliday>`.
   - New top-level slice `AppState.masterLoads: { loads: Record<MasterLoadId, MasterLoad>; goLive: GoLiveBatch | null }`,
     not persisted inside `masters` because a load is a work item, not master data. The types come
     from item 4 (`src/domain/masterLoad/types.ts`), re-exported here.
   - `ListConflict` (30) gains `publicHolidayId?: PublicHolidayId`. The cause key for a public
     holiday is `publicHoliday:<id>`, alongside 30's `holiday:<holidayId>`.
   - `allocateId` kinds in `ID_FORMATS`: `publicHoliday` (`PHN`, pad 3; the seed uses `PH001`),
     `masterLoad` (`ML`, pad 3) and `goLiveBatch` (`GL`, pad 2). Room,
     surgeon, surgeon group, Party, Contract, price range, specialty, funding tag, RVG group and
     modifier kinds exist from 17 to 19b; add one only where a phase did not.
   - `store/demoActors.ts` gains `SEED_LOAD_ACTOR` (`{ who: 'Developer seed load (simulated)', role: 'office', source: 'office' }`,
     office-shaped so it passes the same guards, named so nobody reads it as a person), with a doc
     comment in the file's existing style.
2. **Pure rules** (new files, no React, each with a Vitest file beside it):
   - `src/domain/masterLifecycle.ts`: `isRetired(record)`; `activeOnly(records, keepId?)`, which
     keeps a retired record only when it is the current value, so an edit form never silently drops
     a stored hospital; `retireBlockers(kind, id, facts)` returns readable blocker sentences with
     counts. The caller fills `facts` from the store (the domain does not import the store):
     - **hospital:** upcoming non-AUTHORISED Lists and Draft Lists on or after the demo clock's
       today; active recurring bookings; membership of the generator's ad hoc set
       (`ADHOC_HOSPITALS`), worded as "New days are still scheduled here"; its hospital Party (18) while it
       holds an Active Contract ("Disable its Contracts first: St George's Hospital, 1 Active Contract");
       membership of 34's `INTEGRATED_HOSPITALS`, worded as "Hospital sync is set up here".
     - **surgeon:** upcoming Lists and Draft Lists; active recurring bookings; an Active Contract
       whose only link is the surgeon (a Contract held by a surgeon needs one, AR-58 A39).
     - **room:** active surgeons linked to it (any surgeon whose `roomIds`, 17a, lists it).
     - **group:** surgeons still in it, if 17 gave groups members (a Party never links to the group
       master, AR-58 2.1).
     - **AA rooms** (31's `locationType: 'aaRooms'` row): never retired ("AA rooms is built in and
       cannot be retired."), as 31's handoff asks.
     - **AA modifier:** none; a retired modifier stays on Procedures that claimed it and leaves the
       picker (19b's picker reads `activeOnly`).
     No contract · RVG is held by AA and is never disabled (18); Parties, Contracts, specialties and
     funding tags keep their own lifecycle rules (18, 18a).
   - `src/domain/holidays.ts`: `closuresFor(dateISO, hospitalId, { hospitalHolidays, publicHolidays })`
     returns `Closure[]`, where `Closure` is `{ source: 'hospital'; holidayId; name } | { source: 'public'; publicHolidayId; name }`.
     `closuresIndex(masters)` builds the date-and-hospital map 30's `conflictFactsFor` reads, with a
     public holiday applied to every hospital not in `openHospitalIds`. Retired hospitals are still
     indexed, because a past List there still reads its closure. Tests: a public holiday closes every
     hospital; an open hospital is excluded; a hospital holiday and a public holiday on the same day
     give two closures; the index is stable for equal input.
   - Extend 30's `conflictFactsFor` and `expectedConflicts` to read `closuresIndex`. A public closure
     yields `{ kind: 'holiday', cause: 'publicHoliday:<id>', publicHolidayId }`. `describeConflict`
     reads "St George's is closed: Labour Day (public holiday)." **AA rooms** is a location row since
     31 (every List has one; "it may take a holiday like any location"), so a public holiday closes
     it too unless it is listed as open; the migration lists it in `openHospitalIds` only where the
     old per-hospital rows did not cover it, so its flags do not move either (seed, work item 3).
     Record the reading. Extend `conflicts.test.ts`.
   - **Every other holiday reader moves too.** Route each reader from the drift-check grep (28's
     generation path, the horizon advance, `addAnaesthetist`'s generation, 30's recurring-booking
     projection and conflict preview, 31's Draft List assignment warning and its recurring clash, and
     any other) through `closuresFor` / `closuresIndex` instead of `masters.holidays` alone. 31's
     warning reads "St George's is closed that day (Labour Day, public holiday)." for a public
     closure. A test per reader: with the per-hospital Labour Day rows gone, Labour Day still closes
     the hospital for that reader.
3. **Seed** (`domain/seed/availabilityAndHolidays.ts`, `domain/seed/index.ts`; DM-38):
   - New `PUBLIC_HOLIDAYS`: `PH001` Labour Day Mon 26 Oct 2026 (national); `PH002` Canterbury
     Anniversary Day Fri 13 Nov 2026 (regional, "Canterbury"); `PH003` Christmas Day Fri 25 Dec 2026;
     `PH004` Boxing Day (observed) Mon 28 Dec 2026; `PH005` New Year's Day Fri 1 Jan 2027; `PH006`
     Day after New Year's Day (observed) Mon 4 Jan 2027; `PH007` Waitangi Day (observed) Mon 8 Feb
     2027. Every row has `openHospitalIds: []`, except that `HOSP.aaRooms` (31) is listed open on
     `PH001` and `PH002` if the old `HOSPITAL_HOLIDAYS` `flatMap` did not give it Labour Day and
     Canterbury Anniversary rows (check at the drift check; the set must not move). Only the first two fall inside today's canvas horizon
     (28's configurable horizon, four months in current practice, may reach further: count what it
     covers); the rest make the calendar look real and flag Lists if the presenter rolls the clock
     forward.
   - `HOSPITAL_HOLIDAYS` drops its per-hospital Labour Day and Canterbury Anniversary rows (for the
     original hospitals and 34's appended ones). It keeps only hospital-specific closures (30's
     `HH900`). Keep the `HH` id range for those.
   - `buildSeed` passes `publicHolidays` to `reconcileAllConflicts`. **The flagged-List set must not
     move:** every List flagged by a per-hospital Labour Day or Canterbury row before is flagged by the
     public holiday after. Only the cause key changes (`holiday:HH001` to `publicHoliday:PH001`).
     Regenerate the golden canvas fixture's conflicts column only, and assert that the flagged-id set
     equals the baseline from the drift check.
   - Insurers and funders: 18 seeds them as Parties; this phase adds none.
   - Seed tests: the public holidays are present and sorted; no hospital holiday is named Labour Day
     or Canterbury Anniversary Day; the flagged set is unchanged; two builds deep-equal.
   - Bump `PERSIST_VERSION` by one, with a comment line ("Phase 42: master public-holiday calendar
     replaces per-hospital statutory rows; retire fields on masters; masterLoads
     slice"), and extend `persistMigrate.test.ts`.
4. **Loader engine, pure** (`src/domain/masterLoad/`; US-13.4.3 AC1):
   - `csv.ts`: `parseCsv(text)` returns `{ header: string[]; rows: { rowNumber; cells: string[] }[] }`.
     It handles quoted cells, embedded commas and quotes, CRLF, a leading BOM, and blank trailing
     lines. `rowNumber` is the spreadsheet row, with the header as row 1. Tests for each case.
   - `types.ts`:
     - `LoadEntity` = `'specialties' | 'fundingTags' | 'hospitals' | 'hospitalHolidays' | 'publicHolidays' | 'surgeonRooms' | 'surgeons' | 'anaesthetists' | 'rvgGroups' | 'modifiers' | 'parties' | 'contracts' | 'priceRanges' | 'contractEventFees'`:
       US-13.4.3's list (hospitals; surgeons with their specialties, and rooms; RVG groups with base
       units; modifiers; Parties; specialties and funding tags; Contracts one per priced item with their
       price ranges, and 39b's event fees; anaesthetists) and the two calendars.
     - `RowResult` = `{ rowNumber; cells; status: 'valid' | 'rejected'; reasons: string[]; key: string; fields? }`.
     - `MasterLoad` = `{ id; entity; source: { kind: 'sample'; sampleId } | { kind: 'file'; fileName }; header; headerErrors: string[]; rows: RowResult[]; status: 'staged' | 'loaded' | 'discarded'; stagedAtISO; stagedBy; loadedAtISO?; loadedRecordIds?: string[]; goLiveBatchId? }`.
     - `LoaderSpec<F>` = `{ entity; label; columns: { key; header; required; hint }[]; parseRow(cells, ctx): { fields: F } | { reasons: string[] }; keyOf(fields): string; existing(fields, masters): string | null; references?(fields, ctx): string[] }`.
       One Contract is one row and one price range is one row: there are no lines, versions or row groups.
   - `validate.ts`: `validateSheet(spec, parsed, masters, ctx)`:
     - A missing required column rejects the whole sheet ("Missing column: Contact email"), and no
       row is valid.
     - A row with the wrong cell count is rejected ("Row has 3 cells; the sheet has 2 columns").
     - Otherwise each row goes through `parseRow`, and then:
       - a duplicate key within the sheet is rejected ("Duplicate of row 4");
       - a key already in master data is rejected ("Already in master data: edit it there"), because
         a load adds and never overwrites;
       - an unresolved reference is rejected (for example "No surgeons' room named Riverside Rooms",
         "No RVG group with code H3X", "No Contract with AA code SUR-0099", "No specialty named Cardiac").
       `ctx.pendingKeys` lets a row reference a record loaded earlier in the same go-live batch (a
       surgeon naming a room or a specialty, a Contract naming its Party, a price range naming a
       Contract on the same batch's Contracts sheet).
     - Every reason for a row is collected, not only the first.
   - **Blank and zero** (a row is the complete record, not a patch): in an optional numeric cell (a
     Contract's unit rate or discount) a blank means "not set" and `0` means zero, which 18's validator then
     accepts or refuses (a unit rate must be above 0; a fixed price may be 0 unless the Contract is
     prepaid). `parseOptionalNumber(cell)` is the one helper every spec uses; a test pins "", " ", "0",
     "0.0" and "-1".
   - **One set of rules.** Each spec's `parseRow` calls the same pure field validator the entity's
     manual create action uses. Extract those validators into `src/domain/masterValidation.ts` where
     they are not already pure (hospital name and email; hospital holiday; public holiday; room;
     surgeon with its specialties (18a); anaesthetist (26 and 28's fields)); for the pricing masters, **call the module's own
     validators** (19's RVG group rules, 19a's `validatePriceRanges`, 18's
     Party guard and Contract create guard (AR-58 5.10), 18a's specialty and funding tag rules, 19b's AA-modifier rules), never copy them. The
     store actions call them too, so a rejected row's reason is word for word the refusal the Add sheet
     shows. A parity test drives both paths for each refusal.
5. **Store: hospitals and retirement** (`src/store/mastersActions.ts`, 17's
   `surgeonActions.ts`; US-13.4.1). Every action is office only, goes through `mutate()`
   with before and after metas, and takes its timestamps from the demo clock.
   - **Renames follow through.** `editHospital` (17) and 17's surgeon, room and group
     edits also rename the linked Party (a hospital's or a surgeon's) when its short name still equals the old name, in the same
     commit, audited as 18's Party update. A Party the office has renamed by hand is left alone.
     Raised invoices and 25's snapshots keep their names.
   - `retireMaster(api, actor, kind, id, reason)` and `reinstateMaster(api, actor, kind, id)` for
     `hospital | surgeon | surgeonRoom | surgeonGroup | aaModifier`:
     - retire refuses `notFound`, `alreadyRetired`, `reasonRequired`, `inUse` with
       `retireBlockers`' sentences joined, and (for `aaModifier`) an RVG-table row ("RVG modifiers
       are as printed and cannot be retired.");
     - reinstate refuses `notFound` and `notRetired`;
     - they audit `<kind>.retire` and `<kind>.reinstate`.
     No delete action is added for these masters.
   - `editAaModifier(api, actor, id, { factor, units, unitsAsPrinted? })` (19b's handoff): office
     only, 19b's AA-modifier rules, refuses an RVG-table row; audited `modifier.update`. The code is
     not editable (claims keep it). Claimed modifiers on Procedures keep their units until 25's
     snapshot locks them; an ACTIVE Procedure's M total follows the edit, as a group edit re-prices in
     19.
   - Every create and edit action for these masters, the List, Draft List and Booking write paths
     that take a hospital or surgeon, and 18's links (a hospital Party's hospital, a Contract's linked
     surgeons) refuse a retired id ("St George's is retired"). The exception is when the value is unchanged, so editing
     an old List at a retired hospital still saves.
   - Tests (extend `mastersActions.test.ts`, `surgeonActions.test.ts` and 19b's modifier tests): the
     anaesthetist actor is refused everywhere; each refusal; the rename follow-through with a generated and a hand-edited
     Party name; each kind's retire blockers and reinstate (a hospital whose Party holds an Active Contract is
     refused); a retired hospital
     refused by the List and Booking write paths but tolerated when unchanged; an RVG modifier refused
     by edit and retire.
6. **Store: the public-holiday calendar and the RVG time rule** (`src/store/mastersActions.ts`, 19's
   `rvgMasterActions.ts`; DM-38, US-13.4.1, US-05.2.2):
   - `addPublicHoliday(api, actor, { dateISO, name, kind, region?, openHospitalIds })` refuses
     `nameRequired`, `dateRequired`, `duplicatePublicHoliday` (same date) and `unknownHospital`.
     `editPublicHoliday(api, actor, id, patch)` has the same refusals plus `notFound`.
     `deletePublicHoliday(api, actor, id)` removes the row; the audit keeps the full before. They
     audit `publicHoliday.create`, `publicHoliday.update` and `publicHoliday.delete`.
   - Add `masters.publicHolidays` to 30's reconcile trigger list in `store/conflictReconcile.ts`. When
     a public holiday changes, reconcile the Lists on its old and new dates at every hospital. A
     change to `openHospitalIds` therefore raises or clears exactly the right flags. The actions return
     `{ flagged, resolved }` from the mutation result, in 30's `HolidaySheet` result-line shape.
   - `editRvgTimeRule(api, actor, rule)` (19a handed it here): office only, refused by 19a's
     `validateRvgTimeRule` with its sentences; the part interval always rounds up and a patch that
     changes it is refused ("A part interval always rounds up."). Audits `rvgTimeRule.update` with
     before and after. It re-prices Procedures with no 25 snapshot, on ACTIVE and SUBMITTED Lists;
     AUTHORISED Procedures and raised invoices keep their figures. The rule applies to recorded time
     only (there is no estimate).
   - Tests: with the clock rolled into range, the seeded Christmas Day (`PH003`) flags that day's
     Lists, and adding a second public holiday on the same date is refused
     (`duplicatePublicHoliday`); add a public holiday on a canvas weekday, and it flags the Lists; mark
     one hospital open, and its flags clear while the others stay; move the date, and the old flags
     clear and the new ones raise; delete, and everything clears; an office clear (30) on a
     public-holiday conflict holds only while the cause stands. The time rule: a valid edit changes an
     ACTIVE Booking's T units and not an AUTHORISED one; a malformed rule and a part-interval change are
     refused.
   **6a. Contract edits after the load** (D34 answered; no new store work). The loader's planners create
   Parties, Contracts, price ranges and event fees directly (the developer's one-off load). Every later edit
   from Master data goes through 18's in-place audited Contract actions and 19a's range actions: no
   staging, no "New version", no review dashboard, no check state, check action or second actor.
   - Tests: editing a loaded Contract's setting from the view saves at once and is audited; a fixed
     price changes by adding a price range and the old range ends the day before; a load never creates
     anything but Active Contracts; No contract · RVG and the fallbacks are untouched by any load.
7. **Store: loads** (`src/store/masterLoadActions.ts`, exported from `src/store/index.ts`;
   US-13.4.3 AC1 and AC2):
   - `stageMasterLoad(api, actor, { entity, csvText, source })`:
     - it parses and validates against current masters and writes a `staged` `MasterLoad`;
     - it audits `masterLoad.stage` with `after: { entity, rows, valid, rejected, source }`;
     - it never writes `masters` or `contracts` (a test deep-equals them before and after);
     - it refuses `officeOnly`, an unknown entity and an empty sheet. A price range naming a missing
       Contract is a rejected row, not a refused sheet;
     - staging a new load for an entity discards any earlier staged load for that entity
       (`masterLoad.discard`), so the Seed load view shows one live result per sheet.
   - `commitMasterLoad(api, actor, loadId)`:
     - it refuses `notFound`, `notStaged`, and `nothingToLoad` (zero valid rows);
     - it **re-validates** against current masters first. A row that has gone stale since staging
       (for example the same hospital added by hand in between) turns rejected with its new reason
       and is not loaded;
     - it then runs **one** `mutate()` whose recipe folds each valid row through the entity's create
       planner (item 9), in row order;
     - it writes one meta per created record, using the same action name as a manual create
       (`hospital.create`, `rvgGroup.create`, `party.create`, `specialty.create`,
       `contract.create`, the price-range action and so on, as 18, 18a and 19a named them) with `after` carrying `{ loadId, rowNumber }`,
       plus one `masterLoad.commit` summary meta;
     - calendar loads reconcile conflicts through 30's `mutate()` hook once, and the summary returns
       `{ flagged, resolved }`; loads of hospitals, funding tags or Parties let 18a's `ensureFallbacks`
       make the open-price fallbacks in the same commit, and the summary counts them;
     - it marks the load `loaded` with `loadedRecordIds`;
     - if any planner refuses mid-fold (a bug, since the rows were just re-validated), the whole
       commit aborts and returns the refusal. It never partially loads.
   - `discardMasterLoad(api, actor, loadId)` audits `masterLoad.discard`.
   - The Seed load view and the triggers call these as `SEED_LOAD_ACTOR` (the developer's step), so
     the audit never shows Kirsty loading master data .
   - Tests: office-shaped actor only; stage never touches masters; commit loads exactly the valid rows
     and no rejected row; one commit, with the expected meta count; stale re-validation;
     `nothingToLoad`; a second commit is refused; ids are deterministic (two runs deep-equal, and the
     same sample after a Reset gives identical records, so a test load repeats); each loaded record's
     History shows "Loaded from spreadsheet, row N".
8. **Loader specs and sample spreadsheets** (`src/domain/masterLoad/specs/*.ts`,
   `src/domain/masterLoad/samples.ts`; US-13.4.3):
   - One spec per `LoadEntity`, each small. The columns are:
     - hospitals: Hospital name, Contact email; every loaded row is `locationType: 'hospital'` (AA
       rooms is 31's one built-in location row and is never loaded);
     - hospital holidays: Hospital, Date, Name (30's `addHospitalHoliday` rules: the hospital exists
       and is not retired, one closure per hospital and date), keyed on hospital and date;
     - public holidays: Date, Name, Kind (National or Regional), Region, Open hospitals (hospital
       names separated by ";"), with item 6's rules, keyed on the date;
     - surgeons' rooms, in the shape of AA's specialist list of 3 November (the fictional copy
       `seed/specialistDirectory.ts` comes from): Room name, Contact email, Phone. Email and phone
       are optional, so a room with neither loads and shows as having none (17a, D74);
     - **specialties** (US-13.4.4; AR-58 2.5): Name, keyed on the name, through 18a's specialty rules (a name,
       no duplicate; broad only). The load adds to 18a's seeded list and never overwrites it;
     - surgeons, in the shape of AA's specialist list: Name, Specialty, Rooms, HPI CPN, NZ registration number (for
       information), keyed on the HPI CPN, with 17's HPI CPN normaliser, shape check and duplicate
       check across surgeons and anaesthetists. **A row with no HPI CPN, or a first name only, is
       rejected with its reason** (D76, 17's required-HPI-CPN refusal word for word; one validator).
       The **Specialty** cell names one or more of the specialties list separated by ";" and is
       **required**: a row with none is rejected with 18a's required-specialties refusal word for word
       (D3), and a name not on the list is rejected ("No specialty named Cardiac"). The sample uses the
       broad names 18a's directory mapping gave. The **Rooms** cell names one or more rooms separated
       by ";" (the first the main room), so a surgeon listed at two practices loads at **both** (D75,
       17a's `roomIds`); each must resolve ("No surgeons' room named Riverside Rooms") and a repeated
       room is dropped as in 17's action. There is **no contacts sheet** (D74: practice manager and PA
       contacts are entered by hand);
     - anaesthetists: Name, HPI CPN, Unit value, Priority tier, Start date (the fields
       `NewAnaesthetistFields` takes as 26 and 28 left it, plus 17's admin-only priority tier; no GST
       period; keyed on the HPI CPN; 28's start-date rule; each loaded anaesthetist gets 28's Slots
       through the one generation path);
     - **RVG groups** (US-05.1.1):
       Code, Description, Anatomy heading, Base units, Range from, Range to, Modifier units, Starting
       figure (19's fields; the hidden id is allocated at load, never read from the sheet). The same
       code may sit on several rows (the guide prints two T2s), so a row is keyed on code and
       description. 19's `createRvgGroup` rules: a description, an anatomy heading, base units a whole
       number above 0, a range (both cells or neither) holding the figure (D35), modifier units blank
       (0) or a whole number of 0 or more. There is no procedure sheet and no general procedure;
       the RVG groups are the one master list. No figure is checked against the NZSA guide and none
       raises a warning (drift step 2);
     - **modifiers** (US-05.1.5): Code, Factor, Units, Units as printed. **AA's own rows only**, through
       19b's `addAaModifier` rules (a code that does not clash with another AA row; units a whole
       number of 0 or more). The RVG table is not a sheet in the prototype: it is already built from
       AR-34's files by 19b's generator, which is what the developer's seed would load. A test proves
       it: 19b's generated table, fed through the same `Modifier` shape into an empty masters state,
       deep-equals the seeded RVG rows, so nothing is ever re-transcribed;
     - **Parties** (US-04.1.5; AR-58 2.1): Name (the short name, keyed), Kind (Hospital, Insurer, Funder,
       Surgeon, Surgeon group or Anaesthetist; the one AA Party is built in and never loaded), Hospital
       (required for a hospital Party: the hospital by name, one loaded earlier or on the same batch; AA
       rooms is never a Party's hospital, 31), Billing name, Delivery (Email or Post, D55; blank is not
       set), Email, Postal address. 18's Party guard decides: billing details are required only once a
       Contract bills the Party, so a Party loads without them and a Contract row that bills such a
       Party is rejected with 18's refusal. Insurers and funders are rows like any other;
     - **funding tags** (US-13.4.5; AR-58 2.6): Code (keyed), Funder (optional: a Party's name, the
       funder whose work arrives under the tag; it must resolve, so the Parties sheet loads first). 18a's
       rules; a row's position is its place in the order the step rail shows, after the existing tags;
     - **Contracts**, one per priced item ([US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md), US-04.2.18, AR-58 2.2 and 2.3):
       AA code (the unique key, US-04.1.4; blank takes 18's next code), Name, Party (the holder, by short
       name, an existing Party or one on the same batch), Holder reference code, Invoice description,
       Default RVG code (an unresolved code is rejected), Bills (Holder or Payer), Payment type (Standard
       or Prepaid), Pricing kind (RVG at the anaesthetist's rate, RVG at the Contract's rate, RVG less a
       discount, or Fixed price), Unit rate, Discount (%), Fixed price and Price from (a fixed price's
       first range, both cells), Anaesthetist may override (Yes or No), Funding tag, Specialties (names
       separated by ";"; none means every specialty), Surgeons (HPI CPNs separated by ";") and Anaesthetist (one
       HPI CPN). In the optional numeric cells **a blank is not set and 0 means zero**. 18's Contract create
       guard (AR-58 5.10) decides everything else, so each refusal is its own sentence: a repeated AA code,
       a fixed price with no range, a rate or discount out of bounds, a rate or discount or range on the
       wrong kind, a prepaid Contract that bills its holder, is not a fixed price or has a price of 0
       (D23, D64), an override on a fixed-price or prepaid Contract (D65), a billed Party with no
       billing details, linked surgeons on a hospital Contract, and a Contract held by a surgeon, surgeon
       group or anaesthetist with no link. **An anaesthetist's price list** loads as prepaid Contracts, one
       per item, held by that anaesthetist's Party and linked to them (US-04.2.14, D42); a surgeon's
       arrangement as one Contract per item linked to its surgeons (D48). A row of pricing kind **Open
       price** is rejected ("Open-price Contracts are made by the system"); No contract · RVG and the
       fallbacks are never loaded. Every loaded Contract is Active;
     - **price ranges** (US-04.2.15, AR-58 2.4 and 5.6): AA code (an existing Contract or one on the same
       batch), Start date, Price (ex GST), keyed on both. 19a's `validatePriceRanges` and `addPriceRange`
       decide: only a fixed price has ranges, starts are unique, the price is 0 or more (a blank is
       rejected as not set; above 0 when prepaid) and **a start may be in the past** (D6, a backdated
       range). A range adds to its Contract and never replaces one;
     - **Contract event fees** (39b's handoff): Contract (AA code), Event type (39b's preset types), Holder
       code, Fixed price (ex GST), with 39b's event-fee validator and create action, keyed on Contract and
       event type. Built only if 39b is DONE.
     Surgeon groups, recurring bookings, availability statuses, preferences and priority
     tiers, body sections, the open-price fallbacks (18a makes them) and the RVG modifier table have no sheet
     (not on US-13.4.3's or AR-58 section 8's lists, or built from AR-34's files); they are maintained by hand or as printed. Dates are ISO `YYYY-MM-DD` or
     `d/m/yyyy` (both parsed, and anything else rejected with "Date must be a real date, for example
     2026-12-25").
   - `samples.ts`: `SAMPLE_SHEETS`, one bundled CSV string per entity, each
     `{ id, entity, fileName, label, csv }`. Each sample has two to six valid rows and three to five
     invalid ones, and every invalid row exercises a different refusal from that entity's validator.
     For example, the hospitals sample:
     - valid: "Rangiora Day Surgery, bookings@rangioraday.example" and "Ashburton Hospital,
       theatre@ashburton.example";
     - rejected, already in master data: "St George's";
     - rejected, name required: a blank name;
     - rejected, implausible email: "Timaru Surgical, not-an-email";
     - rejected, duplicate: a second Rangiora row.
     Use `.example` domains only. The others:
     - `public-holidays-2027.csv`: valid Good Friday Fri 26 Mar 2027, Easter Monday Mon 29 Mar 2027,
       ANZAC Day (observed) Mon 26 Apr 2027 and King's Birthday Mon 7 Jun 2027; rejected, the seeded
       Christmas Day's date, "31/02/2027", an unknown open hospital, a blank name;
     - `hospital-holidays.csv`: two valid hospital closures; rejected, an unknown hospital, a second
       closure on 30's `HH900` hospital and date, a bad date;
     - `specialties.csv`: two valid rows (for example Vascular surgery and Maxillofacial surgery); rejected,
       a name already held, a blank name, a repeated row;
     - `surgeons-rooms.csv` and `surgeons.csv` (fictional, taken from `Christchurch_Specialists_fictional.xlsx`,
       never the real file): valid rooms include one with no email or phone; valid surgeons carry
       invented CPNs and one or more specialties, and one surgeon listed at two practices loads at both
       rooms; rejected, a surgeon with no specialty, a specialty not on the list, a row with no HPI CPN,
       a first name only, a malformed HPI CPN, a duplicate HPI CPN and an unknown room;
     - `anaesthetists.csv`: two valid rows; rejected, a duplicate HPI CPN, a start date in the past,
       a non-numeric unit value;
     - `rvg-groups.csv`: valid, two AA groups (one with a range "8 to 10" as Range from 8, Range to
       10, figure 8) and a row sharing an existing code under a new description (a repeated code is
       allowed); rejected, a zero base figure, a range not holding the figure, a blank description,
       a code and description already held;
     - `modifiers.csv`: two AA rows (for example a weekend loading and a sitting position loading, as
       Vanessa's list will hold, with demo units); rejected, a code clashing with an AA row, a
       non-numeric unit, a blank factor;
     - `parties.csv`: valid, a hospital Party for the hospitals sample's new hospital (delivery Email), an
       insurer Party with delivery Post, a surgeon group Party and an anaesthetist Party (a seeded
       anaesthetist with no price list yet); rejected, a hospital Party naming no hospital or naming AA rooms,
       the AA kind, an unknown delivery value, Email delivery with no email, a name already held;
     - `funding-tags.csv`: valid, a tag naming a seeded funder Party and one naming none; rejected, a code
       already held (SXAP), a blank code, an unknown funder Party;
     - `contracts.csv`: valid, a fixed-price Contract for the new hospital Party under a funding tag with its
       first range, an RVG-at-the-Contract's-rate Contract, an RVG-less-a-discount Contract and an
       anaesthetist's prepaid fixed-price Contract (bills the Payer, linked to the anaesthetist, price above
       zero); rejected, **a prepaid Contract with an RVG pricing kind**, a prepaid Contract that bills its
       holder, a fixed price with no first range, a rate of 0, an Open price row, an unknown Party, an AA
       code already held, an unknown specialty or funding tag, an override on a fixed price, linked
       surgeons on a hospital Contract, and a Contract billing a Party with no billing details;
     - `price-ranges.csv`: valid, a later range and a backdated range on the batch's fixed-price Contract;
       rejected, a repeated start, a range on a rate Contract, an impossible date, an unknown AA code, a
       blank price, a prepaid range of 0;
     - `contract-event-fees.csv` (if 39b is DONE): one valid fee into the batch's fixed-price
       Contract; rejected, an unknown event type, a second fee for the same type on that Contract.
     Write the fixture rows against the masters as 17 to 39b left them, and pin each sample's valid
     and rejected counts in a test.
   - The samples live in `src/domain` so the trigger registry (inside the PWA import closure) can
     import them. They are demo fixtures, not seed: nothing loads them at build time.
9. **Create planners, one path** (store; the refactor that keeps loads inside the guards):
   - Extract the body of each create action the loader targets into a pure planner:
     `planHospitalCreate(state, fields)`, `planHospitalHolidayCreate`, `planPublicHolidayCreate`,
     `planSurgeonRoomCreate`, `planSpecialtyCreate`, `planSurgeonCreate` (with its specialties),
     `planAnaesthetistCreate` (with 28's Slot generation), `planRvgGroupCreate`, `planAaModifierCreate`,
     `planPartyCreate`, `planFundingTagCreate`, `planContractCreate` (with 18's AA code and a fixed
     price's first range), `planPriceRangeCreate` and `planContractEventFeeCreate` (39b's create).
   - Each returns `{ state: nextSlices, metas }` or a refusal, and includes the id allocation. Where a
     phase already extracted a planner, reuse it.
   - The single-record actions become `validate, plan, mutate`, with behaviour and audit unchanged
     (their existing tests prove it). `commitMasterLoad` folds the same planners.
   - A Contract loaded with later ranges in the same batch is created first, with its first range, and
     its further ranges fold after it, in the same commit; a Party before the Contracts it holds.
   - No planner touches the price function or the fee path: loading changes masters only, and 19's,
     19a's and 24's pricing reads them as for a hand-made record.
10. **Go-live batch, pure and store** (`src/domain/masterLoad/solutionsPlus.ts`,
    `src/domain/masterLoad/goLive.ts`, `src/store/goLiveActions.ts`; US-13.4.2, US-13.4.3 AC3):
    - `solutionsPlus.ts`:
      - `SOLUTIONS_PLUS_OPERATIONS`, the fixture: about 14 rows of `{ scanRow, name, spUnits }`
        transcribed from a printed list. `spUnits` is kept only to be shown struck through.
      - The rows include junk:
        - "10% discount" (the catalogue's example);
        - "DO NOT USE - old code";
        - "Test op";
        - "Misc";
        - an upper-case, trailing-space duplicate of "Laparoscopic cholecystectomy";
        - one name already matching a seeded Contract's invoice description.
      - `junkReason(name)` returns "Looks like a pricing note, not an operation" for a percent sign or
        the word discount, and "Marked not for use" or "Not an operation" for the other patterns.
      - `normaliseOperationName(name)` folds case, whitespace and punctuation. A candidate whose
        normalised name repeats an earlier scan row is junk with the reason "Duplicate of scan row N".
      - Fixture counts, pinned in a test and quoted by the trigger message and the checklist: 14
        rows, 5 junk ("10% discount", "DO NOT USE - old code", "Test op", "Misc", the duplicate), 2
        not approved, 1 already matching a seeded Contract, and the rest approved.
      - Tests for each pattern and for the duplicate.
    - `goLive.ts`:
      - `GO_LIVE_PACK` = the Solutions Plus list plus seven controlled sheets, in load order:
        surgeons' rooms, surgeons (referencing those rooms and the seeded specialties), RVG groups (one
        AA group), Parties (one surgeon-group Party), Contracts (one fixed-price Contract per approved
        name, each with its first range and its invoice description an operation name, and one
        RVG-priced Contract), price ranges (a later, backdated range on one of them) and public
        holidays for 2027 (the calendar, Greg's point 40).
        A read-only card lists the RVG modifier table as "NZSA RVG 2021 modifier table · from AR-34's
        files · already seeded", so the pack names every master US-13.4.3 lists without
        re-transcribing one.
      - `GoLiveCandidate` = `{ scanRow; name; spUnits; decision: 'approved' | 'notApproved' | 'junk'; reason? }`.
        The fixture carries AA's recorded decisions: most approved, two not approved ("No longer
        performed by AA members", "Replaced by a newer operation name"), and junk set by `junkReason`
        and by the duplicate rule.
      - `evaluateGoLive(batch, masters)` joins each candidate to the Contracts sheet by normalised
        invoice description (US-13.4.3 no longer says what the names seed and there is no procedure
        list: the built default). One outcome per candidate: `loads`, `notApproved`, `junk`,
        `noControlledRow` ("No Contract in the controlled spreadsheet"), `alreadyInMaster`, or
        `controlledRowRejected` (with the sheet's reasons).
      - A Contracts-sheet row with no Solutions Plus candidate loads as an AA addition, because names can
        come from AA as well. A row whose candidate is not approved or junk is rejected ("Not
        approved for go-live").
      - **Solutions Plus units are never read** into anything that loads. A test gives the fixture
        units that differ from the controlled sheet and asserts each loaded Contract's range prices equal
        the sheet's.
    - `goLiveActions.ts`:
      - `stageGoLiveLoad(api, actor)` creates the `GoLiveBatch` (`{ id, candidates, loadIds, status, stagedAtISO, stagedBy, loadedAtISO? }`),
        stages each controlled sheet as a `MasterLoad` with `goLiveBatchId`, validating in pack order
        with `pendingKeys`, and audits `goLive.stage`. It refuses while a batch is already staged.
      - `setGoLiveApproval(api, actor, scanRow, approved, reason?)` refuses a junk row ("Junk is
        excluded and cannot be approved") and audits `goLive.approve` or `goLive.unapprove`. It
        re-runs the Contracts sheet's validation, so the join outcomes follow at once.
      - `commitGoLiveLoad(api, actor)` runs one `mutate()` that folds every sheet's valid rows in
        pack order through the item 9 planners. A Contract row, and any price range naming it, is included
        only when `evaluateGoLive` says `loads`. It marks every load and the batch `loaded`, and audits `goLive.commit` with the
        counts (loaded by sheet, Solutions Plus entries not loaded).
      - `discardGoLiveLoad(api, actor)`.
      - All four act as `SEED_LOAD_ACTOR`, except approvals, which are AA's decision: they act as the
        Admin app's actor (Kirsty).
    - Tests (`goLive.test.ts`, `goLiveActions.test.ts`):
      - each outcome;
      - an unapproved candidate's Contract never loads (US-13.4.2 AC1);
      - loaded fields come only from the controlled sheets (US-13.4.2 AC2): none from Solutions
        Plus, and no Contract created other than the sheet's;
      - "10% discount" is excluded and cannot be approved;
      - un-approving a row before commit removes its Contract and its price ranges from the load;
      - rooms load before the surgeons that reference them, the Party before its Contracts and a
        Contract before its further price ranges;
      - one commit, and nothing partial on a planner refusal;
      - Reset then stage and commit again gives identical records (US-13.4.3 AC2, the repeatable
        test load).

    **Session 1 ends here, green:** `npm run build`, `npm run build:pwa` and `npx vitest run`, with
    every existing Master data view still rendering, and the flagged-List set unchanged.

11. **One pattern for every view** (`apps/admin/screens/masters/`; US-13.4.1 "in one place"):
    - `masterViews.ts`, a registry the sub-nav renders from:
      `{ view; label; group: 'People and places' | 'Schedule' | 'Billing' | 'Settings' | 'Go-live'; catalogueRows: string[]; add: boolean; edit: boolean; retire: boolean; remove: boolean; seeded?: LoadEntity[] }`.
      `seeded` lists the sheets that load this master at go-live; it drives the subtitle line and the
      sample trigger's choices, never a button.
    - The groups:
      - People and places: Anaesthetists (seeded: anaesthetists), Hospitals & holidays (seeded:
        hospitals, hospital holidays), Surgeons (seeded: surgeons), Surgeons' rooms (seeded: rooms),
        Specialties (18a; seeded: specialties) and Surgeon groups;
      - Schedule: Recurring bookings (30's view and id), Availability statuses (29's), Public
        holidays (seeded: public holidays);
      - Billing: Parties (18, insurers and funders among them; seeded: Parties), Funding tags (18a;
        seeded: funding tags), Contracts (18, with 19a's price ranges; seeded: Contracts, price ranges,
        Contract event fees; edited in place), RVG groups (19, with 19a's time rule
        panel; seeded: RVG groups), Modifiers (19b; seeded: modifiers);
      - Settings: Xero & archiving;
      - Go-live: Seed load, Go-live load (both demo-badged).
    - The `?view=` param and the existing view ids are kept.
    - **One label.** The area is "Master data" in every heading, subtitle and caption. App copy never
      says "reference tables" or "reference data" (Greg, 2026-10-02 #39).
    - `MasterViewChrome.tsx` holds the shared pieces:
      - `MasterHeader`: title, one-line subtitle, count and the primary teal "Add ..." action; where
        `seeded` is set, the subtitle ends "Loaded once at go-live from AA's controlled spreadsheet,
        then kept here by hand.";
      - `ShowRetiredToggle`: off by default; retired rows render in mist with a neutral "Retired" pill
        and the reason in its title;
      - `RetireSection`, for the foot of an edit sheet: "Retire" with a required reason, showing
        `retireBlockers` as a warning list when refused, or "Reinstate";
      - `LoadResultBanner`: on a seeded view, a one-line banner while a seed load for that entity is
        staged ("A seed load for this list is waiting: Open Seed load").
    - Refit every view to it, including 17's, 18's, 18a's, 19's, 19a's, 19b's, 29's and 30's.
      - Drop any remaining "view only" or "read only" subtitle.
      - Views with retire use `RetireSection` in their existing sheet (18's Disable, 18a's, 19, 29 and
        30 keep their own actions, restyled to the same section).
      - Rows referenced by nothing keep their delete: hospital holidays and public holidays.
    - Test (`masterViews.test.ts`): each row of US-13.4.1's list maps to a view with `add` and
      `edit`:
      - hospitals with contact email;
      - surgeons, with their specialties;
      - surgeon groups;
      - surgeons' rooms;
      - Parties, insurers and funders among them;
      - specialties;
      - funding tags;
      - anaesthetists;
      - availability statuses (the catalogue's "Slot availability statuses");
      - recurring bookings;
      - the master public-holiday calendar;
      - hospital calendars;
      - RVG codes and groups (the RVG groups view);
      - modifier codes;
      - Contracts, with their price ranges.
      Every masters view that retires declares `retire`. Every `LoadEntity` is named by at least one
      view's `seeded`. No office view renders a load action (asserted).
    - MasterData publishes the current view with `useDemoTriggerContext('masters.view', view)`; add the
      key to `DemoContextValues`.
12. **Hospitals & holidays, Public holidays, Modifiers, the time rule and Contract edits**
    (US-13.4.1, DM-38, US-05.1.5, US-05.2.2):
    - **Hospitals & holidays:**
      - 17's `EditHospitalSheet` gains `RetireSection`, and a rename shows "Its Party is
        renamed too" when item 5's rule applies;
      - each hospital card gains a "Public holidays" line: "Closed on all public holidays", or "Open
        on Labour Day" when listed;
      - 30's month calendar shows public holidays as closures in the `status/holiday` tint, labelled
        with the name and "Public holiday". They are read-only there, with a link to the Public
        holidays view;
      - the hospital's own pills and `HolidaySheet` are unchanged;
      - the header subtitle names both calendars.
    - **Public holidays** (new view, group Schedule):
      - a table with columns Date (mono, with weekday), Name, Kind (National / Regional ·
        Canterbury), Applies to ("All hospitals", or "All except Christchurch Public"), and Lists
        affected (a count of Lists currently flagged by it);
      - "Add public holiday" and a row "Edit" open `PublicHolidaySheet`, modelled on 30's
        `HolidaySheet` (date, name, kind, region, "Open that day" hospital chips). Delete sits behind
        a confirmation that states the flag count;
      - result lines use 30's shape: "Public holiday added. 10 Lists flagged." and "Christchurch
        Public marked open. 2 flags cleared.";
      - hook: `data-shot="masters-public-holidays"`.
    - **Modifiers** (19b's view): AA rows gain "Edit" (`editAaModifier`) and `RetireSection`; RVG rows
      show a neutral "NZSA RVG 2021" pill and no edit ("As printed in the RVG").
    - **RVG time rule** (19a's read-only panel, `masters-rvg-time-rule`): an "Edit" action opens
      `RvgTimeRuleSheet`: one row per tier (from minute, interval minutes; add and remove a tier),
      "A part interval always rounds up." as a read-only line, a live preview of `describeTimeRule`
      and worked examples (95 and 125 minutes), and Save calling `editRvgTimeRule` with its refusal
      sentences inline. `data-shot="rvg-time-rule-sheet"`. First in the trim order.
    - **Contract edits** (18's Contract screen and 19a's price ranges): refit to the one header and
      pattern, nothing rebuilt. "Edit" saves in place and is audited; a fixed price changes by "Add price
      range". There is no "New version", staged-changes pill or check line: no versions, no staging (D34).
13. **Seed load view** (`apps/admin/screens/masters/SeedLoadView.tsx`, group Go-live,
    `apps/admin/screens/masters/LoadResultPanel.tsx`; US-13.4.3 AC1 and AC2):
    - Header: "Seed load". Subtitle: "AA's controlled spreadsheets, checked and loaded once before
      go-live. Every row is checked with the same rules as adding it by hand." A `DemoBadge` reads
      "Demo stand-in: in the real system a developer runs this load; the office never sees this
      screen." One more line states D34: "There is no Contract upload or export in the first release;
      Contracts are kept by hand after the load."
    - A list of the fourteen sheets in load order (rooms, specialties, surgeons, anaesthetists,
      hospitals, hospital holidays, public holidays, RVG groups, modifiers, Parties, funding tags,
      Contracts, price ranges, Contract event fees; thirteen if 39b's sheet was dropped), each row with its columns (required
      ones marked), "Download template" (a header-only CSV built client-side as a Blob, no fetch), a
      `.csv` file input (FileReader text passed to `stageMasterLoad` as `SEED_LOAD_ACTOR`, source
      `file`) and its last result. The Contracts and price ranges rows carry the hint "A blank cell is not set; 0 means
      zero."; the surgeons row "A surgeon needs at least one specialty."; the RVG groups row "A code may appear on more than one row."
    - `LoadResultPanel`, shared with the go-live view:
      - a summary line (hospitals.csv: "6 rows · 2 valid · 4 rejected");
      - an Admin Review style table with columns Row (mono), the spec's key columns, Result (a
        success-tint "Valid" or error-tint "Rejected" pill, always with its word), and Reasons (one
        per line); a Contract row shows its pricing kind as a neutral pill (a fixed price adds "1 range");
      - "Only rejected" filter chips;
      - a teal "Load 2 valid rows" and a secondary "Discard".
      After a load, the summary reads "Loaded 2 rows on 21 Jul 2026 · 4 rejected rows were not
      loaded" (a calendar load adds "· 6 Lists flagged"; all counts are computed), and each row links
      to its record in its office view (the surgeon profile, the Party editor, the Contract screen).
    - "Repeatable for a test system" footnote: "Reset the demo and load the same sheets again: the
      records come back identical."
    - Hooks: `data-shot="seed-load"`, `data-shot="master-load-result"`.
14. **Go-live load view** (`apps/admin/screens/masters/GoLiveLoadView.tsx`, group Go-live; US-13.4.2,
    US-13.4.3 AC3):
    - Header: "Go-live load". Subtitle: "A clean cut from Solutions Plus. Only data AA has approved is
      loaded, and it comes from AA's controlled spreadsheets. Nothing comes across because it exists
      in Solutions Plus." A `DemoBadge` reads "Demo: loads into today's master data; at go-live the
      masters start empty."
    - Empty state (no batch): one paragraph on the clean cut and a pointer to the Demo actions menu.
    - **Summary tiles** (Admin Review four-tile row): Will load (by sheet), Solutions Plus entries not
      loaded, Spreadsheet rows rejected, Approved names.
    - **Solutions Plus operation list (names only):**
      - a table with columns Scan row (mono), Operation name, Solutions Plus units (struck through in
        mist, with the column caption "Not used"), AA decision, Controlled spreadsheet, and Result;
      - AA decision is a pill: Approved, Not approved with reason, or Excluded with the junk reason;
        Controlled spreadsheet shows the matching Contract, its Party and default RVG code (mono)
        with its fixed price, or "No row";
      - Result is "Loads" or "Not loaded" with the reason;
      - non-junk rows have an Approve / Unapprove toggle (`setGoLiveApproval`). On junk rows the toggle
        is disabled, with the reason as its tooltip;
      - hook: `data-shot="go-live-candidates"`.
    - **Controlled spreadsheets:** one collapsible card per sheet in pack order, each with its counts
      and a `LoadResultPanel` without its own Load button, plus the read-only RVG modifier table card.
    - Actions: a teal "Load approved data" (`commitGoLiveLoad`) and a secondary "Discard". The result
      line reads, for example, "Loaded 3 rooms, 5 surgeons, 1 RVG group, 1 Party,
      5 Contracts with 6 price ranges and 4 public holidays. 9 Solutions Plus entries were not
      loaded.", with links to each view. The counts are computed, never typed in; the fixture's are
      pinned in `goLive.test.ts` (item 10).
    - A caption under the candidate table states the clean-cut rule (US-13.4.3): "Solutions Plus
      identifiers and unit values are not carried over. Only operation names are used."
    - Hook: `data-shot="masters-go-live"`.
15. **Audit labels and narrative** (`shared/audit/actionLabels.ts`, `auditNarrative.ts`, and
    `fieldLabels.ts` where fields are new):
    - Hospitals:
      - `hospital.retire` "Hospital retired";
      - `hospital.reinstate` "Hospital reinstated";
      - the same pair for surgeon, surgeon room, surgeon group and AA modifier;
      - `modifier.update` "Modifier changed".
    - Public holidays:
      - `publicHoliday.create` "Public holiday added";
      - `publicHoliday.update` "Public holiday changed";
      - `publicHoliday.delete` "Public holiday deleted".
    - Time rule: `rvgTimeRule.update` "RVG time rule changed", narrated through `describeTimeRule`
      before and after.
    - Loads:
      - `masterLoad.stage` "Spreadsheet checked";
      - `masterLoad.commit` "Spreadsheet loaded";
      - `masterLoad.discard` "Spreadsheet discarded".
    - Go-live:
      - `goLive.stage` "Go-live load prepared";
      - `goLive.approve` and `goLive.unapprove` "Go-live name approved" and "Go-live name not
        approved";
      - `goLive.commit` "Go-live data loaded".
    - The narrative renders `{ loadId, rowNumber }` on a create meta as "Loaded from spreadsheet,
      row 3", and a public-holiday conflict as 30's describeConflict text.
    - Extend `auditNarrative.test.ts`.
16. **Pickers offer active masters only** (US-13.4.1 "referenced by identity"):
    - Add `activeHospitals`, `activeSurgeons`, `activeRooms`, `activeGroups` and
      `activeAaModifiers` selectors in `store/selectors.ts`, built on `activeOnly(records, keepId)`.
    - Route every picker from the drift-check grep through them: `EditListSheet`, `PhoneAdviceBooking`,
      30's recurring-booking sheet, the Draft List and assignment flows (31), 18's Party-hospital and Contract surgeon-link pickers,
      17's surgeon room select and `SurgeonSelect`, 21's insurer or funder picker, the
      matching-screen create actions (33), and 35's admin Booking editor if it picks a hospital or
      surgeon. `activeHospitals` filters retirement only; the pickers that 31 made exclude AA rooms
      (18's Party hospital, the feed and sync pickers) keep that filter on top.
    - Confirm 20's step rail hides a Disabled Contract and one whose linked surgeon is retired (keeping it, labelled,
      when it is the Procedure's current Contract); add it here only if 20 did not. No contract · RVG
      is always pinned first.
    - A retired current value shows as "St George's (retired)".
    - Display paths (grid, drawer, invoices, history, profile, 25's snapshots) keep resolving retired
      names unchanged.
    - Tests: a retired hospital is absent from a fresh picker and present, labelled, when it is the
      current value; a retired
      AA modifier is absent from 19b's picker and still listed on a Procedure that claimed it.
17. **Demo triggers** (`src/shared/demoTriggers/registry.ts`; bodies call the item 7 and 10
    actions; see the table below). Update the registry tests that assert entries per route. Add
    nothing to the Control Panel page; its index lists the entries under "Admin · Master data"
    automatically.
18. **Shots and hooks** (`visual/admin-phase07.spec.ts`, or a new `visual/admin-masters-loads.spec.ts`):
    - Public holidays;
    - the hospital calendar with Labour Day;
    - the Seed load view, a staged hospitals load with its result panel, and the loaded state;
    - a staged RVG groups load (a repeated code), a staged surgeons load (a row with no specialty) and
      a staged Contracts load with its price ranges (a prepaid RVG Contract rejected);
    - the time rule sheet;
    - the go-live view before and after "Load approved data".
    Keep the existing master-data shot green; move its hooks if 17 to 19b moved them.
19. **Copy sweep and demo guide.**
    - Grep the app for copy these masters make stale:
      - "view only" and "read only" on Master data;
      - any "full set loads at go-live" or similar (19's RVG groups subtitle) becomes "At go-live, the
        RVG groups load once from AA's controlled spreadsheet.";
      - any "default RVG Contract", "protected default" or "default Type 1" in Master data copy (18 and
        19a should have removed them; anything left is a bug to fix here);
      - "reference tables" or "reference data" anywhere in app copy (one label: "Master data");
      - "Load from spreadsheet" on any office view;
      - "contract holder", "Contract lines", "New version", "Needs a Contract" or "staged" in Master data
        copy (the Party, one Contract per item and an in-place edit replace them);
      - "slot" in any new or touched Master data string (D14);
      - any "Phase 42" string in rendered copy.
    - No en or em dash in any new string.
    - Then the demo guide updates below.

## Demo triggers

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `load-sample-spreadsheet` | Load sample spreadsheet | Admin · Master data (`/admin/masters`) | bar | `when`: the published `'masters.view'` is Seed load, or a view whose `seeded` is set in `masterViews.ts`. `choices`: on Seed load, every `SAMPLE_SHEETS` entry; on another view, that view's sheets, labelled by file name (Hospitals & holidays offers "hospitals.csv" and "hospital-holidays.csv"; Contracts offers "contracts.csv", "price-ranges.csv" and "contract-event-fees.csv"; RVG groups "rvg-groups.csv"; Parties "parties.csv"; Funding tags "funding-tags.csv"; Specialties "specialties.csv"; Public holidays "public-holidays-2027.csv"; Surgeons and rooms "surgeons-rooms.csv" and "surgeons.csv"). The samples carry invalid rows, among them a prepaid Contract with an RVG pricing kind and a surgeon with no specialty. `run`: `stageMasterLoad` as `SEED_LOAD_ACTOR` (the developer's step), with source `{ kind: 'sample', sampleId }`. It stages and does not load, so the presenter shows the rejected rows on Seed load and then presses the product's own "Load N valid rows". Message: "hospitals.csv checked: 2 rows valid, 4 rejected. Open Master data, Seed load, and press Load." | a staged load for this sheet already exists ("A load is already waiting for this sheet; load or discard it first") |
| `go-live-data-load` | Go-live data load (demo) | Admin · Master data (`/admin/masters`, any view) | bar | `run`: `stageGoLiveLoad` as `SEED_LOAD_ACTOR`. The Master data sub-nav's Go-live load item gains a warn dot while a batch is staged, and every view shows a one-line banner, "A go-live load is ready to review", with an "Open" link that sets `?view=goLive`. The presenter approves or un-approves names and presses the product's "Load approved data". Message: "Go-live load prepared: 14 Solutions Plus names (5 excluded as junk, 2 not approved) and 7 controlled spreadsheets. Open Master data, Go-live load." | a batch is already staged ("A go-live load is already waiting; load or discard it first") |

`indexPath`: `/admin/masters?view=seedLoad` for the sample loader and `/admin/masters?view=goLive` for
go-live (use the real view ids). Both are bar only. Their bodies and fixtures live in `src/shared`
and `src/domain`, so `pwaPurity.test.ts` still passes. There is **no staged-review or lines-check
trigger**: Contracts are edited in place and audited (D34).

**Normal use, no button:** adding, editing, retiring and reinstating every master; the public-holiday
calendar; editing AA's modifiers; editing the RVG time rule; editing a Contract and adding a price range (18, 19a); loading a real CSV on Seed load; approving go-live names; "Load N valid rows"; and "Load
approved data".

**PWA:** none. Master data and loads are Admin-only, the PWA has no Admin, and no mobile beat waits on
master data. A retired hospital, surgeon or AA modifier simply stops appearing in the anaesthetist's
pickers through item 16.

## Out of scope

- **A Contract upload or export** (US-04.2.13, Future Work; OQ-100 answered, D34): no in-app upload of a
  holder's schedule, no export and re-import, no delta or full overwrite, no preview, no control
  totals. The seed load is separate from it (US-13.4.3). If a later answer brings it into the first
  release, it needs its own phase.
- **Any office "Load from spreadsheet" action.** The seed is a developer's one-off step (US-13.4.3);
  the office edits by hand. The Seed load view is a demo stand-in, badged as such.
- **Excel (`.xlsx`) parsing.** Controlled spreadsheets are saved as CSV; record the reading.
  Mapping arbitrary column names is out too: the template's headers are the contract.
- **Updating existing records from a load, or deleting by load.** A load only adds; a price review is
  a new price range (19a), by hand.
- **Loads for surgeon groups, recurring bookings, availability statuses, preferences and
  priority tiers, body sections, the open-price fallbacks (18a makes them) and 31's request sources.** They are on neither US-13.4.3's nor
  AR-58 section 8's list, and each is maintained by hand in its view (body sections stay as the guide prints
  them; 31's request sources stay code-held, a candidate master noted for Phase 44). Recurring
  bookings are the "calendar schedules" the room left unclear: hand-made here, logged for the owner.
- **Loading the RVG modifier table from a sheet, or transcribing the full NZSA RVG.** The modifier
  table is built from AR-34's files (19b); the RVG groups sheet's go-live rows are AA additions and a
  handful of demo rows, and the full NZSA group set is narrated ("the full set loads the same way"),
  not transcribed here. Note it for the owner.
- **No contract · RVG and default Contracts.** No contract · RVG is the one built-in Contract (18),
  held by AA, and is never loaded; there are no hospital default Contracts to load (OQ-78).
- **Loading patients, Bookings, invoices, balances or anything transactional from Solutions Plus.**
  The clean cut excludes them; the go-live view says so in its subtitle.
- **Any Solutions Plus identifier** (US-13.4.3 takes names only; OQ-51 was deleted unanswered).
- **An insurer master, a direct-claims flag or any pre-fill from one** (FT-11.4 and US-11.4.1 Retired;
  D55). Insurers and funders are Parties. The split is a Booking action (Phase 22); a special rate is a
  Contract of its own (18).
- **Contract lines, versions, staged changes or a review dashboard** (US-04.2.4 and US-04.1.6 Retired; D1,
  D34): one Contract per priced item, edited in place and audited.
- **Changing the time rule's rounding.** A part interval always rounds up; the editor changes tiers
  only.
- **Any second-person check of its own.** Staged review is gone (D34 answered); this phase adds none.
- **Editing the hospital sync set-up** (34's `INTEGRATED_HOSPITALS` and its fixture). It is
  integration configuration, not a US-13.4.1 table. It stays code-held; a hospital in it cannot be
  retired (item 2).
- **Public holidays on the anaesthetist's mobile or web availability calendar** (29). Note it for
  Phase 44 if the demo wants it.
- **Scale:** timing a full-size load and the full-scale dataset are Phase 43's. The loader's pure
  validator is the seam 43 can time.
- **The S1 to S5 rewrite** (Phase 44). This phase adds an optional beat only.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin, Master data: the sub-nav is grouped (People and places, Schedule, Billing, Settings,
      Go-live), every view has the same header, no office view offers "Load from spreadsheet", seeded
      views say "Loaded once at go-live from AA's controlled spreadsheet, then kept here by hand.",
      and no Master data copy says "view only", "reference tables", "reference data", "default RVG
      Contract", "protected default", "contract holder", "New version" or "slot".
- [ ] Parties: Master data has no Insurers view and no "Accepts direct claims" anywhere. Add
      an insurer and a funder by hand as Parties (delivery Post for the insurer): each appears on Parties
      and nowhere else, and no Contract is created. A Party that bills nobody saves without billing
      details; add a Contract that bills this Party and it is refused until the Party has a
      billing name and a delivery method. Specialties and Funding tags show in the same pattern (18a's
      editors, refitted), a surgeon cannot be saved with no specialty, and no view says "contract holder".
- [ ] Hospitals & holidays: rename a hospital, and the Day grid, List drawer, Booking detail and the
      Party's name show the new name, while an already-raised invoice keeps the old addressee. Try to
      retire St George's: refused, with upcoming List, recurring booking and Active Contract counts.
      Retire a hospital with no upcoming work and no Active Contract on its Party (add a hospital
      by hand first: every seeded hospital's Party holds Contracts): accepted, gone from Edit list and phone advice, and any
      List placed there before retiring still shows its name. Reinstate it. AA rooms refuses Retire
      ("AA rooms is built in and cannot be retired.").
- [ ] Public holidays: seven rows from Labour Day to Waitangi Day (observed). Labour Day shows "Lists
      affected" equal to the count flagged before the phase. The hospital calendar for October shows
      Labour Day as a public-holiday closure. No hospital's own pills list Labour Day any more.
- [ ] Labour Day still reaches every holiday reader: the Day grid on Mon 26 Oct shows the same
      flagged Lists as before, and assigning a Draft List (31) at St George's that day warns "St
      George's is closed that day (Labour Day, public holiday)." Advancing the horizon (clock) raises
      no flag on a hospital marked open.
- [ ] Edit Labour Day and mark Christchurch Public open: the result line clears its flags, and the
      Conflicts screen (30) drops those rows only. Undo it. Add a public holiday on a canvas weekday:
      the Lists that day flag, and describeConflict reads "... is closed: <name> (public holiday)".
      Delete it: the flags clear.
- [ ] Modifiers: an AA modifier added by hand can be edited and retired; an RVG row shows "NZSA RVG
      2021" and no edit; a retired AA modifier leaves the capture picker and stays on a Procedure that
      claimed it.
- [ ] RVG groups, time rule: Edit shows the two tiers and "A part interval always rounds up." read-only;
      the preview gives 7 units for 95 minutes and 9 for 125. A tier with a zero interval is refused
      with 19a's sentence. Save a changed tier, and an ACTIVE Booking's T units follow while an
      AUTHORISED one does not. Put it back.
- [ ] Contract edits after the load: edit a loaded Contract's setting from Master data, Contracts: it saves
      at once and the audit viewer shows the edit. Add a price range from a past date: the old range
      ends the day before and a Procedure on an earlier date keeps its price. There is no "New
      version", staged-changes pill, "Checked by" mark or review dashboard anywhere.
- [ ] Seed load: the DemoBadge and the D34 line show; fourteen sheets in load order (thirteen without 39b's event fees), each with Download
      template. Demo actions, "Load sample spreadsheet", hospitals.csv: the result panel shows each
      rejected row with its reason (already in master data, name required, email, duplicate) and the
      valid rows. Nothing is added yet. Press "Load 2 valid rows": they appear in Hospitals &
      holidays, and each one's History reads "Loaded from spreadsheet, row N" by "Developer seed load
      (simulated)". Then hospital-holidays.csv: the valid closures load and their result line counts
      the Lists flagged.
- [ ] public-holidays-2027.csv: the four 2027 holidays load; the seeded Christmas Day's date, the
      impossible date, the unknown hospital and the blank name are rejected with reasons.
- [ ] rvg-groups.csv: the ranged group and a second row sharing an existing code load; the zero
      figure, the range not holding its figure, the blank description and the held code and
      description are rejected with 19's wording. No procedure or Contract is created.
- [ ] specialties.csv, parties.csv, funding-tags.csv, contracts.csv, price-ranges.csv in that order: the
      new specialties appear in Specialties, the Parties on Parties (the insurer with delivery Post, the
      anaesthetist's own Party), the tag in Funding tags in the step rail's order, and open-price fallbacks
      for the new hospital and tag appear without being a sheet. The loaded Contracts each got an AA
      code (or kept the sheet's), their settings and one first range; the rate of 0 is refused (0 is a
      value, not blank), the Open price row is refused ("made by the system"), and **the prepaid RVG
      Contract is refused with 18's wording**. The anaesthetist's prepaid Contract is linked to them
      with a price above zero. The backdated range on the fixed-price Contract ends the earlier one
      the day before it starts and shows in 19a's range list; the repeated start, the range on a rate
      Contract and the blank price are refused with 19a's wording. A Booking at the new hospital offers the
      new Contracts on 20's step rail by typing.
- [ ] Repeat on Surgeons' rooms (a room with no email or phone loads and shows none) and Surgeons
      (a row with no specialty, a row naming a specialty not on the list, a row with no HPI CPN and a
      first-name-only row are each rejected with their reason; a loaded surgeon shows their specialties; a surgeon
      at two practices loads at both rooms (open the profile: a card per room); an unknown room, a malformed HPI CPN and a
      duplicate HPI CPN are each rejected with 17's wording; no contacts sheet is offered), Anaesthetists (a loaded anaesthetist has Slots from
      the start date on the Day grid) and Modifiers (AA rows only).
- [ ] Seed load with a real file: download the hospitals template, add two rows (one bad) in a text
      editor, save as CSV and choose it. The same result panel appears. A file missing a required
      column is rejected as a whole, with "Missing column: ...".
- [ ] Stale protection: stage the hospitals sample, then add "Rangiora Day Surgery" by hand, then
      press Load. That row turns rejected ("Already in master data") and only the others load.
- [ ] Demo actions, "Go-live data load (demo)": the banner appears on every view. On Go-live load,
      "10% discount", "DO NOT USE", "Test op", "Misc" and the upper-case duplicate are Excluded with
      reasons, and their toggles are disabled. Solutions Plus units are struck through and marked Not
      used. Two names show Not approved. Seven controlled spreadsheets are listed in pack order, with
      the RVG modifier table card read-only.
- [ ] Un-approve one approved name: its Result turns "Not loaded: not approved for go-live", its Contract
      leaves the Contracts sheet's valid rows, and the tiles update. Press "Load approved data": the
      result line counts rooms, surgeons, the group, the Party, the Contracts with their
      price ranges, and public holidays. The Contracts show the sheet's prices (not Solutions Plus's), and the
      un-approved and junk names are absent.
- [ ] Repeatable: Reset, then run the go-live load again and load it: the same records with the same
      ids and AA codes.
- [ ] Audit viewer: filter to masterLoad, goLive and contract. Stage, commit, approvals,
      Contract edits and each created record are present, with who, role and before and after.
- [ ] The harness bar shows "Load sample spreadsheet" only on Seed load and seeded Master data views,
      "Go-live data load (demo)" only on Master data, . None shows on Day view or in the installed PWA. The Control Panel index lists both
      under Admin · Master data.
- [ ] Reset: loads, the go-live batch and the loaded records are gone. The public holidays and the time
      rule are back as seeded.
- [ ] No en or em dash in any new copy, no crimson on any new control, teal the only action colour, and
      every outcome pill carries its word.
- [ ] Catalogue screenshots: the recipes for the covered items (US-13.4.1, US-13.4.2 and
      US-13.4.3) are created or updated as the table below says, every stale caption it names is
      replaced, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no
      failed recipe and no story without a recipe, the covered items' new shots are checked by eye,
      and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

In the same session (each phase patches the beats it touches). No scripted beat is broken by this
phase; it adds one optional beat and refreshes the master-data lines:
- `docs/demo-guide/03-demo-script.md`:
  - **S5, a new optional Beat 5 "Controlled master data and a clean-cut go-live"** (about 2
    minutes):
    - Click: Admin, Master data, Seed load. Demo actions, Load sample spreadsheet,
      contracts.csv. Point at the rejected rows (the prepaid RVG Contract, the Open price row) and the
      blank cells (not set, never zero), then Load. Then Demo actions, Go-live data load (demo), and Master data, Go-live load. Point at "10%
      discount" excluded, the struck-through Solutions Plus units and the matching Contract
      beside each approved name. Un-approve one name, then Load approved data, then open Contracts and
      the loaded Contract: any later edit saves in place and is audited, and a new price is a new price range.
    - Say: "AA starts clean. A developer seeds the empty system once from AA's own controlled
      spreadsheets: hospitals, surgeons with their specialties and rooms, anaesthetists, RVG groups with their base units,
      modifiers, Parties, Contracts one per priced item with their price ranges, and the calendars. Every row is checked
      with the same rules as adding it by hand, and anything that fails is listed and left out. After
      that, the office keeps it all by hand on these screens, and every change is audited. Solutions Plus gives us names, not numbers. And because it is a
      spreadsheet, the same load runs again into a test system."
    - Expected: as in the manual checklist.
  - **S5 Discovery points:** add "whether surgeons can load without an HPI CPN or a full name (OQ-129)"
    and "whether recurring bookings join the seed spreadsheets (US-13.4.3's calendar schedules)".
    Remove any "whether a Contract schedule upload is needed in the first release (OQ-100)" point
    (answered 5 November: Future Work, so say so if asked) and any "whether admins can re-load master
    data after go-live" point (answered by US-13.4.3: loaded once, then by hand).
  - **Direct URLs:** add `/admin/masters?view=publicHolidays`, `/admin/masters?view=seedLoad` and
    `/admin/masters?view=goLive` (use the real view ids).
  - **S2** only if it names a hospital holiday by its old per-hospital row. Labour Day is now a
    public holiday; check the wording.
- `docs/demo-guide/04-presenter-cheat-sheet.md`:
  - the Admin Web list: "Master data and audit" becomes "Master data (every master in one place,
    kept by hand after a one-off load from AA's controlled spreadsheets, every change audited,
    go-live load) and audit";
  - one line under availability and holiday conflicts: public holidays come from one master calendar;
  - one "strong phrase": "Nothing comes across because it exists in Solutions Plus."
- `docs/demo-guide/01-personas-and-responsibilities.md`: Kirsty's duty 9 ("Maintain schedule-related
  master data ...") becomes "Maintain all master data (hospitals, surgeons and rooms,
  recurring bookings, public holidays and hospital calendars, RVG groups and modifiers,
  specialties and funding tags, Parties (insurers and funders among them), Contracts and their price ranges), by
  hand after the one-off go-live load".
- `docs/demo-guide/02-workflows-and-handoffs.md`: in the canvas workflow's triggers, "A recurring
  booking or hospital holiday changes" (Phase 30's wording) becomes "A recurring booking, hospital
  holiday or public holiday changes". Add a short "Master data and go-live" note beside the Source
  list naming the clean cut, the one-off developer seed (repeatable into a test system) and no
  Contract upload or export in the first release (Future Work).
- `docs/demo-guide/master-demo-guide.html`: mirror the same S5 beat, discovery points, Direct URLs,
  cheat-sheet, persona and workflow lines, word for word.
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, the S5 blurb): add "Optional:
  Master data, Demo actions, Go-live data load." No trigger is added to the page.
- Not a milestone phase, so no full consistency read. Check that the patched sections match the run
  sheet.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 42` first: earlier phases may have
changed these recipes. The catalogue has already refreshed US-13.4.1's captions (priority tier,
recurring bookings, contact email, availability statuses); its caption still calls insurers, RVG codes and modifier codes view only and says there is no master
calendar, no RVG groups, no Parties, specialties or funding tags. Rows are for the three covered items only: US-13.4.4 and US-13.4.5 are 18a's, and US-11.4.1 is Retired.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md) | partial · `admin-master-data` [anaesthetists, contracts, permanent-lists, hospitals-holidays, surgeons, surgeon-rooms, surgeon-groups, rvg-codes, modifier-codes, availability-statuses]; the caption names insurers, organisations, RVG codes and modifier codes as view only, no RVG groups and no master calendar | `captured`. Re-shoot at `/admin/masters`, one state per view in the grouped sub-nav, keeping the slugs and re-pointing clicks to the current button names; add `parties` (insurers and funders among the Parties; no Insurers view), `specialties`, `funding-tags` (18a's editors in the one pattern), `contracts` (one per item, with a fixed price's price ranges; no lines or versions), `public-holidays` (`masters-public-holidays`), `hospitals-holidays` with Labour Day as a public-holiday closure plus a retire refusal, and `retired` (under "Show retired"); the `anaesthetists` state shows no GST period. Captions say "Master data", no state shows a load button or an insurer master. Drop the partial reason |
| [US-13.4.2](../../../../requirements-board/requirements/stories/US-13.4.2.md) | absent | `captured`. Admin shot `go-live-load` at `/admin/masters?view=goLive`: `staged` (after the `go-live-data-load` entry: "14 Solutions Plus names (5 excluded as junk, 2 not approved)", struck-through units, 7 controlled spreadsheets; highlight `go-live-candidates`) and `loaded` (one name un-approved, "Load approved data" pressed; result line). Caption: "Clean-cut start: only AA-approved data is loaded" |
| [US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md) | absent | `captured`. Admin shot `seed-load` at `/admin/masters?view=seedLoad`: `sheets` (DemoBadge, the D34 line, fourteen sheets, no contacts sheet; highlight `seed-load`), `result` (hospitals.csv staged: "6 rows · 2 valid · 4 rejected" with reasons; `master-load-result`), `loaded`, `rvg-groups` (a repeated code valid; caption "RVG groups load with their base units; there is no procedure list"), `contracts` (contracts.csv and price-ranges.csv staged: one Contract per item with its first range, a prepaid Contract with an RVG pricing kind rejected, an Open price row rejected; caption "Contracts load one per priced item with their price ranges; a blank is not set and 0 is a value") and `surgeons` (surgeons.csv staged from the fictional specialist list: a room with no email loads, a no-specialty row, a no-HPI-CPN row and a first-name-only row rejected with reasons, a two-practice surgeon valid with both rooms shown; highlight `master-load-result`; caption "Surgeons load from the specialist list with their specialties; rows without an HPI CPN or a specialty are rejected"). Caption: "A one-off data load from AA's controlled spreadsheets, rejected rows listed with reasons". No office "Load from spreadsheet", no Contract upload or export |

**Recipes this phase breaks.**

- About 28 recipes open `/admin/masters` and click a sub-nav button by name; 42 regroups the sub-nav
  (item 11), so each needs its button names and highlights checked with `--dry`. Found by
  `grep -l 'admin/masters'` at the 2026-10-03 plan: `FT-04.1`, `FT-05.1`, `FT-13.4`, `US-01.1.2`,
  `US-01.1.3`, `US-01.2.2`, `US-01.3.2`, `US-01.5.1`, `US-01.5.2`, `US-04.1.1`, `US-04.1.2`,
  `US-04.2.1`, `US-04.2.2`, `US-05.1.1`, `US-05.1.3`, `US-05.1.4`, `US-05.1.5`,
  `US-05.2.1`, `US-09.3.3`, `US-12.1.1`, `US-12.1.2` and `US-12.1.4` (the Retired `US-04.2.4`, `US-04.2.5`,
  `US-04.2.9`, `US-04.4.1` recipes were set `absent` by 18 to 20), plus those 17 to 41 added
  (re-grep: at least 18's `US-04.1.4` and `US-04.1.5` on Parties and the catalogue, 18a's specialties and funding tags, 19a's `US-04.2.14`, price ranges and the `US-05.2.2` time-rule panel, 19b's
  `US-05.1.4` `rvg-included`, 29's and 30's views). The buttons they use include Contracts, Parties,
  Specialties, Funding tags, Hospitals & holidays, Recurring bookings, Availability statuses, RVG
  groups and Modifiers.
- `US-01.5.1.json` and `US-01.5.2.json` (hospital holiday calendar and its conflicts): the seeded
  per-hospital Labour Day and Canterbury Anniversary rows migrate to the master public-holiday
  calendar, so re-point any hospital-holiday highlight to the new "Public holidays" line or view.
- Any recipe on a Contract screen (18's `US-04.1.2`; 19a's `US-04.2.15` price ranges): there is no
  staged-change bar, lines grid or version history; re-check highlights with `--dry`.
- Any recipe that lists hospitals or surgeons in a picker: retired masters leave the
  pickers (item 16); the seed has none retired, so no change expected.
- Work item 18 lists the Playwright specs; the `--dry` run is the check for anything else.

**ATLAS.md.** Update "Routes" (the `?view=` Master data views, `seedLoad` and `goLive`), "Overlays that
need clicks" (PublicHolidaySheet, RvgTimeRuleSheet, the retire dialogs), "Existing hooks"
(`masters-public-holidays`, `seed-load`, `master-load-result`,
`go-live-candidates`, `masters-go-live`, `rvg-time-rule-sheet` and the sub-nav
group hooks) and the line that says Master data tabs include "Hospitals & holidays".

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
- **Loads stay inside the guards.** No load path writes `masters` or `contracts` except through the
  item 9 planners inside one `mutate()`. Stage never writes masters. Commit re-validates, loads nothing
  partial, and writes one meta per record plus a summary. A rejected row can never reach master data,
  including after an approval toggle, a stale row or a planner refusal. Hunt for a second create path
  that bypasses a planner, such as a spec building a record itself.
- **One pricing model, one set of rules.** Every rejected-row reason equals the manual action's
  refusal text for the same input, and the parity test covers every refusal of every spec. No loader
  file declares its own group, Party, Contract, price range, specialty, funding tag or modifier type or re-implements a rule from
  `src/domain/billing` (18's Party guard, the Contract create guard of AR-58 5.10, 18a's rules, 19's RVG group rules,
  `validatePriceRanges`, 19b's AA-modifier rules); the specs only map columns. Surgeon and
  anaesthetist rows use 17's one HPI CPN rule.
- **Figures land where the catalogue puts them.** Group figures on `RvgGroup` (a repeated code is
  allowed; the hidden id is allocated, never read), a fixed price only in price ranges (the first
  with its Contract, later ones from the price ranges sheet; a blank is not set, 0 is a value). A Contract
  states no units. There is no procedure list or general procedure, no Contract line and no version.
  Nothing creates a default RVG Contract, a hospital default, an Open price Contract, or a second No contract · RVG.
  No load refuses a value for differing from the NZSA guide or raises a warning for it.
- **No office upload.** No office view offers a load; the Seed load view is badged as a stand-in and
  acts as `SEED_LOAD_ACTOR`; there is no Contract upload or export anywhere (D34, US-04.2.13 Future).
  Loaded Contracts and price ranges are maintained afterwards only through 18's and 19a's screens.
- **Contract edits after the load.** The load creates Parties, Contracts and ranges through the
  planners; nothing here edits a Contract directly. Any later edit is 18's in place audited edit or 19a's
  price range: no staging, no review dashboard, no "New version" and no "checked" state exists.
- **Clean cut is honest.** Solutions Plus units never reach a loaded record. Junk cannot be approved.
  A Contract whose name is not approved never loads, even when the controlled sheet has a row for it. The go-live view's wording does not claim the masters were emptied. A Reset and re-run gives
  identical records.
- **Specialist list loads (D75, D76, D3).** One HPI CPN validator shared with 17's manual add. A room
  with no email or phone loads; a surgeon with no HPI CPN, a first name only or no specialty is
  rejected with the reason (18a's required-specialties refusal, word for word); a two-practice surgeon
  loads at every room listed, the first the main room; no contacts sheet exists; no fixture
  derives from the real `Christchurch_Specialists.xlsx`.
- **Insurers and funders are Parties.** There is no insurer master, no direct-claims flag and no
  pre-fill from one; an insurer is edited and loaded as a Party. The Parties sheet carries the
  delivery setting (email or post) and billing details through 18's Party guard, and a Contract's
  practitioner links sit on the Contract, never on the Party, never a second rule.
- **The flat model holds.** One Contract per priced item with no lines, versions or staged changes;
  every Contract row passes 18's guard (a prepaid RVG Contract, an Open price row, a rate of 0, an
  override on a fixed price are each refused with its sentence); a fixed price is never loaded
  without a range; the open-price fallbacks are made by 18a's `ensureFallbacks` after a load and are
  never a sheet, so a load leaves exactly one per destination; the AA code is unique.
- **Retire, never break a reference.** A retired hospital, surgeon, room, group
  or AA modifier still resolves everywhere it is displayed (grid, drawer, invoices, history,
  profile, snapshots). It disappears from every picker (check the drift-check grep list, including
  18's Party and Contract links, 20's step rail, 21's insurer or funder picker, 31's and 33's flows).
  Blockers are correct and counted from the demo clock's today. No contract (RVG) is never retired.
- **Public holidays through the one conflict rule.** The flagged-List set did not move in the
  migration. Every public-holiday change, including a calendar load, reconciles through 30's
  `mutate()` hook with no stamping. `openHospitalIds` raises and clears exactly the right flags. An
  office clear on a public-holiday cause behaves like 30's. AA rooms (31's location row) is closed or
  listed open like any location, and its flags did not move either. No reader of
  hospital holidays still reads `masters.holidays` alone.
- **The time rule.** Only tiers change; a part interval always rounds up. One function prices time
  everywhere (19a's `timeUnitsFromMinutes` with `masters.rvgTimeRule`); AUTHORISED Procedures and
  raised invoices keep their figures.
- **Change once, reflected everywhere.** A hospital, surgeon, room or group rename shows in
  every live surface and follows into the linked Party's generated name; a hand-edited Party name
  does not; raised invoices and snapshots keep theirs. List any other stored copy of a master name the
  grep found.
- **Determinism and state.** Ids come from `allocateId`, AA codes from `nextAaCode`, timestamps from
  the demo clock, and `FileReader` is the only browser API used for input. `masterLoads` resets with
  the seed. `PERSIST_VERSION` is bumped and `persistMigrate.test.ts` extended.
- **Trigger scope, copy and design.** Both triggers are bar only, show only where the table says,
  are disabled with a reason, and never load by themselves beyond their one action. The
  sample fixtures are imported from `src/domain`, and `pwaPurity.test.ts` holds. The app says "Master
  data", never "reference tables", and never "slot". Teal is the only action colour, outcome pills
  carry words, the result panel follows Admin Review's table, and there are no en or em dashes.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): D75 (OQ-128, answered: a surgeon loads at each room listed) as built, and D76 (OQ-129, provisional: a surgeon with no HPI CPN or a first name only is rejected and listed) as built, with the validator shared with 17; a surgeon with no specialty rejected (D3, Donald's decisions, not yet confirmed by AA); D34 (OQ-100, answered) as built (a developer-run load, shown as a demo stand-in; no Contract upload or export;
  Contracts edited in place and audited, no staged review); D55 (OQ-114, open, provisional: delivery is a Party setting, email or post, no portal);
  US-13.4.3 still does not say what is loaded or from where (the loader follows its expected list and
  AR-58 section 8); the Contracts sheet carrying a fixed price's first range with a separate price ranges
  sheet for the rest, and the AA code optional on it (built defaults); Solutions Plus names, which US-13.4.3 no longer mentions, matched to a Contract's
  invoice description in the go-live demo (US-13.4.2 still says only approved data loads); calendar
  schedules (public and hospital holidays loaded, recurring bookings hand-made); the sheets' column
  sets (including the anaesthetists and Parties sheets); the RVG modifier
  table left to AR-34's files and the full NZSA group set narrated, not transcribed; the time rule
  editable by tier; anything logged rather than fixed; and the screens worth a look, each with its
  route and persona (Kirsty: Master data, Parties, Contracts with their price ranges, Public holidays,
  Seed load, Go-live load).
- **Status row** for catch-up Phase 42, and a phase entry with:
  - the drift-check result (items changed since `efe123c` or not; OQ-100, OQ-114, OQ-101 and
    OQ-129 as found; the calendar-schedule question; whether Vanessa's files landed; and the 17 to
    34 names used);
  - what was built, per work item;
  - the flagged-List set before and after the public-holiday migration;
  - the stored-name copies the grep found and what was done;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added (including the rule-parity, blank-and-zero, US-13.4.1 coverage, AR-34 table and
    repeatable-load tests);
  - the review pass.
- **Catalogue screenshots:** the recipes created or changed (by ID), the `requirements-board/requirements/capture/REPORT.md` counts
  before and after (captured, partial, absent, failed), the stale captions replaced, the recipes this
  phase broke and how they were re-pointed, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Public holidays are one master calendar.** A row applies to every hospital except those
     listed as open that day. Hospital calendars hold only hospital-specific closures. The seeded
     per-hospital Labour Day and Canterbury Anniversary rows migrated with the flagged set unchanged.
     AA rooms (31's location row) is closed by a public holiday like any location unless listed
     open. This amends Phase 30's decision 10 ("Hospital
     holidays can be edited and deleted") and the original seed reading of `HOSPITAL_HOLIDAYS`
     (statutory days as per-hospital rows).
  2. **Masters referenced by identity retire, never delete.** Retire needs a reason, refuses while
     upcoming work or an Active Contract depends on the record, hides the record from pickers,
     and keeps every reference resolving. Delete stays only for rows nothing references (hospital and
     public holidays). Anaesthetists keep their Active flag. AA's own modifiers are editable and
     retirable; RVG-table modifiers are as printed. This supersedes Phase 17's "no delete or
     deactivate; Phase 42 owns it" and the Phase 07 "view only" master readings.
  3. **A rename follows through to the linked Party's name** while it is still the old
     name. Raised invoices and pricing snapshots keep theirs. (Supersedes this plan's 2026-10-03
     reading, which renamed a protected default Contract; there are none, OQ-78.)
  4. **Insurers and funders are Parties; there is no insurer master** (FT-11.4 and US-11.4.1 Retired
     2026-10-28; Greg: "just an instance of contract holders"; Donald's D2). No Insurers view, no accepts-direct-claims
     flag, no pre-fill of "bills its holder". An insurer is a Party of kind Insurer, edited in 18's Party
     editor and loaded by the Parties sheet with the rest. The split is a Booking action (22) and a
     special rate is a Contract of its own (18).
  5. **The seed is checked, then loaded.** Stage validates and reports without touching masters.
     Commit re-validates and loads exactly the valid rows in one audited `mutate()`, through the same
     planners and validators as a manual add. Each loaded record's audit carries its load and row and
     the simulated developer actor. Rejected rows are never loaded (US-13.4.3 AC1). The same sheets
     after a Reset give identical records (AC2).
  6. **A one-off developer seed, then by hand; CSV; add only** (US-13.4.3 as changed 2026-10-07).
     The loader is shown only in a demo-badged Seed load view; no office view offers a load, and an
     existing key is rejected with "Already in master data: edit it there". Supersedes this plan's
     2026-10-03 reading ("loads allowed at any time while AA decides on re-loading", with a per-view
     "Load from spreadsheet").
  7. **Solutions Plus supplies operation names only.** Its units are never read, junk is excluded and
     cannot be approved, AA's approval gates each name, and no identifier is carried. With no
     procedure list (and US-13.4.3 no longer naming Solutions Plus), a name is matched to a Contract's
     invoice description, the built default. The go-live demo loads into today's masters and says so.
  8. **The RVG modifier table comes from AR-34's files, not a sheet.** 19b's generated table is what
     the seed would load; AA's own modifiers load from a sheet. The band table stays code-held.
  9. **Contracts load one per priced item** (US-13.4.3 "Contracts one per priced item with their price
     ranges"; AR-58 section 8). A Parties sheet carries 18's fields (kind, hospital, billing name, delivery
     method, email, postal address); a Contracts sheet 18's Contract fields (AA code, name, Party, holder
     reference code, invoice description, default RVG code, bills holder or payer, Payment type, pricing
     kind, rate or discount, override, funding tag, specialties, linked surgeons or anaesthetist) with a
     fixed price's first range and a blank cell not set, 0 a value; a price ranges sheet adds later ones.
     A Contract's AA code is the sheet's or 18's next code. No Contract lines or versions exist (D1). No
     contract · RVG, open-price fallbacks (18a makes them) and default Contracts are never loaded. The
     hospital sync set-up (34) stays code-held, and an integrated hospital cannot be retired.
  10. **Loaded base units land on RVG groups only** (OQ-62; there is no procedure
     list and a Contract states none). Group figures above 0 with an optional range. No NZSA guide range
     check and no warning (the after-procedure warning stays with a value recorded on a Procedure).
  11. **The load covers US-13.4.3's expected list and the calendars** (specialties, funding tags,
     hospitals, hospital holidays, public holidays, surgeons' rooms, surgeons with their specialties,
     anaesthetists, RVG groups, AA modifiers, Parties, Contracts, price ranges and 39b's Contract event
     fees; insurers and funders are Parties among them). Surgeon groups, recurring bookings,
     availability statuses, preferences and tiers, body sections and the open-price fallbacks are
     maintained by hand or system-made. Recurring bookings are the unclear "calendar schedules": left
     hand-made, for the owner.
  12. **Contract edits after the load are in place and audited** (OQ-100 answered, D34): no staged
     review, no "New version", no Contract upload or export (US-04.2.13 Future Work). A price changes by a
     price range (19a). This phase builds no check of its own.
  13. **The RVG time rule is editable by tier** (19a's handoff, US-05.2.2 "defined as data"). A part
     interval always rounds up and is not editable.
  14. **One label: "Master data".** Greg would call these master data, not reference tables
     (2026-10-02 #39); the app uses "Master data" throughout. The catalogue story's title is the
     owner's to change.
- **Handoff notes:**
  - For **43**: `validateSheet` and `commitMasterLoad` are the seams to time on a full-scale sheet
    (thousands of Contracts and lines); 43's generator builds through the same pricing-model module
    and planners, never a second shape. `SAMPLE_SHEETS` shows the fixture pattern.
  - For **44**: S5's optional Beat 5; OQ-100 and the calendar-schedule question in the discovery
    points; public holidays on the anaesthetist calendars if wanted; the full NZSA group set if the
    demo wants it; 31's request sources as a candidate master; the event-fee sheet if 39b was not
    DONE; any trim logged in this phase.
