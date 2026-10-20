# Phase 19b · Modifiers: the RVG table, pre-applied age and included modifiers, explanations

**Requirements covered:**
[FT-03.3](../../../../requirements-board/requirements/stories/FT-03.3.md) Record clinical billing data per Procedure (status 1; graded Contradicts; this phase closes its modifier half: the RVG code only where the Contract prices from RVG, start and finish times, BTM optional, received text never edited) ·
[US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) Choose optional modifiers, each with a short explanation (status 3; graded Contradicts) ·
[US-03.3.8](../../../../requirements-board/requirements/stories/US-03.3.8.md) Age modifier from the patient's age (status 3; graded Partial) ·
[US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md) Modifiers already included in base units (status 3; graded Contradicts) ·
[US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md) Modifier code master (status 3; graded Contradicts) ·
[DM-44](../analysis/domain-model-delta.md#dm-44) modifiers become per-Procedure records with explanations; age and included modifiers are pre-applied but not locked; ASA is just a modifier ·
[RV-09](../analysis/reverse-check.md#rv-09-p1-absorbed-by-the-wrong-codes-and-struck-through-instead-of-shown-selected-at-0-units) P1 'absorbed' by the wrong codes and struck through instead of shown selected at 0 units ·
[RV-22](../analysis/reverse-check.md#rv-22-asa-class-auto-seeds-modifier-units) the ASA class auto-seeds modifier units ·
[RV-38](../analysis/reverse-check.md#rv-38-modifier-master-values-and-codes-are-demo-inventions-now-that-the-real-rvg-table-is-in-the-catalogue) the modifier master's values and codes are demo inventions.
(RV-23 and RV-35 of the earlier numbering left this list: the catalogue's renumbering made RV-09 and RV-22 these same findings, and their work is item 3 onward below.)
Answered, built as answered: owner decision D43
([OQ-94](../../../../requirements-board/requirements/questions/OQ-94.md): P1 is included in every
Neurosurgery code H7A to H9b, 'a' and 'b' alike, and every Spine code S1 to S10; superseded in part
on 20 October: it is pre-applied, not locked).
Open but narrowed, built as its default with pre-application one switchable rule: D29
([OQ-95](../../../../requirements-board/requirements/questions/OQ-95.md): age bands and stacking; no
modifier is locked (Donald, 20 October); whether anything is pre-applied at all is Ben's open doubt).
Backstop only, finished by Phase 21: the "short explanation for any modifier claimed" bullet of
[US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md) (Mark a Booking
complete).
**Not this phase's:** the RVG code type-ahead and the RVG groups (Phase 19); the starting
base and modifier units from the Contract line, procedure and RVG group, and the time tiers (Phase
19a); the Contract (Phase 20); the multi-procedure modifier split (Phase 23); the pricing snapshot
(Phase 25); other billing lines and events, which take no modifiers (Phase 39b); loading and editing
the masters from spreadsheets (Phase 42).
**Depends on:** Phase 19a (the line, procedure, RVG group resolver with each value's layer, including
the starting modifier units; Contract lines). Through 19a: Phase 19 (RVG groups under body sections
with base and modifier units, the RVG code type-ahead, the Procedure's optional RVG code), Phase 18 (the fee parity harness,
`feeParity.test.ts` and its `__parity__/` fixtures), 15a (the warning routine, the Booking warning
surfaces, "Mark complete" with no submit confirm step), 15b (ACTIVE for an assigned List), 15 (Booking
vocabulary) and 14 (the trigger registry).
**Estimated:** 2 sessions. Session 1: work items 1 to 8 (baseline, the generated RVG modifier table,
model, the one modifier rule module, the pricing switch, store actions, the completion backstop, the
seed migration and tests), ending green with every moved figure explained. Session 2: work items 9 to
14 (the capture section on mobile, web and Admin, the modifier picker with the inline explanation,
the units caption, the Admin Modifiers and RVG groups views, the S5 staging and copy sweep,
Playwright, demo guide) and the review pass. If session 2 runs long, cut the Admin "Add AA modifier"
sheet (item 12b) before any capture work; the model and store action stay.

**Confirm before building.** D43 is answered and OQ-95 is narrowed by Donald's 20 October decision: no
modifier is locked. Build it as decided, with no provisional label on the lock reading. What stays open
is Ben's doubt whether anything should be pre-applied at all, plus the age band boundaries and stacking.
Build D29's default, keep the age, included, band and stacking rules and the one on/off switch for
pre-application in **one rule module** (item 4), and label the open part provisional in **one place**
only: the header of the Admin Modifiers tab (item 12a).

## Goal

Rebuild modifiers to the catalogue (DM-44, FT-03.3, US-03.3.4, US-05.1.5), before Phase 20's Contract
pick, 23's multi-procedure split and 25's snapshot read them.

- **The modifier master is the NZSA RVG 2021 modifier table plus AA's own** (US-05.1.5). It is
  **seeded from the catalogue's files**, never re-transcribed from the RVG:
  `requirements-board/requirements/artifacts/files/NZSA RVG 2021 modifiers.md` (its section "2a. The
  modifying factors table (pages 12 to 13)": 30 codes) and `NZSA RVG 2021 included modifiers.csv`
  (20 Neurosurgery and Spine codes whose base units include P1), together artifact
  [AR-34](../../../../requirements-board/requirements/artifacts/AR-34.md). Values are held as
  printed: some are not plain numbers ("2 + Time", "4-6", "1 [Per Call]", "As Per T1/T2", "2 [Max]"),
  and codes are not keys (A1, A2 and P1 are also base codes), so every modifier has a hidden id. The
  invented demo values and codes go (RV-38: AS3 at 3, PA3 to PA5's values, the shifted BMI bands, AS2,
  PO1 and PO2); VM1, TTE1, TTE2, PACU1, EAA1, POC 1, POC2a to POC2c, POC3a, POC3b, NC1 and NC2 arrive.
  The model also holds AA's own modifiers (Vanessa's list has not landed: none are seeded, and the
  office can add one).
- **A Procedure's modifiers become itemised records** (DM-44): each holds the modifier, an origin
  (chosen, age or included), its units where the printed value is not a plain number, and a short
  explanation (chosen ones only). Chosen ones are stored. The pre-applied ones are derived from the
  patient's age and the RVG group, plus one stored list of the pre-applied modifiers the anaesthetist
  removed (`removedModifierIds`), so a removal sticks and a change of group or date of birth still
  re-derives. One pure function returns the Procedure's full itemised list (pre-applied and chosen,
  each with its origin and units) and is the only place the M total comes from.
- **The system pre-applies only two kinds of modifier, none locked** (US-03.3.4, US-03.3.8, US-05.1.4;
  Donald, 20 October). Both show already selected, and the anaesthetist can remove either:
  - **age**: A1 or A2 from the patient's date of birth on the procedure date (the List's date; the
    date basis is D29's default), by D29's default: age in completed years on the procedure date,
    lower bounds inclusive as printed (under 1: A2; 1: A1; 2 to 69: none; 70 to 79: A1; 80 and over:
    A2), and none on the age-split base codes H6b and P2;
  - **included**: P1 on every Neurosurgery code H7A to H9b and every Spine code S1 to S10 (with their
    sub-codes), read from the CSV, shown selected **at 0 units**, so it cannot be added a second time
    (D43). The included modifier belongs to the **RVG group** (US-05.1.4, US-05.1.1), not to the
    procedure.
  Pre-application is **one switchable rule** (Ben doubts it; D29): a single constant in the rule module
  turns off both, leaving every modifier optional.
- **Every other modifier, ASA included, is optional** and needs a short explanation when claimed.
  US-03.3.4's criterion is "Given a modifier the anaesthetist claims, when they save, then it needs a
  short explanation", so claiming one opens its explanation field **inline, in the same sheet**, and
  the claim is not saved until it has one. A pre-applied modifier needs none unless the anaesthetist
  removes it and claims it again by hand. "Mark complete" also refuses a claimed optional modifier
  with no explanation, as the backstop for US-03.6.1 (finished in Phase 21).
- **FT-03.3's modifier half**: the RVG code is recorded only where the Contract prices from RVG; times
  are start and finish; BTM is optional; the received procedure text is never edited. The pricing and
  procedure parts belong to Phases 19, 19a and 20: this phase checks the capture block shows no RVG code
  or BTM entry where the Contract does not use them, and adds nothing the other phases own.
- **What goes:** the ASA card and its seeding of modifier units (RV-22, superseding the 2026-07-22
  "ASA seeding values" ruling); the absorbed-modifier refusal and strike-through on hip and shoulder
  codes (RV-09, superseding the absorbed-P1 ruling); the "locked" reading of age and included
  modifiers (US-03.3.8 and US-05.1.4 as first built, D43 in part); and there is **no
  procedure-default pre-fill and no "untickable default modifiers"** (the 2026-10-02 reading and the
  2026-10-03 plan's version of Phase 19, both superseded by US-05.1.4 on 8 October).
- **Starting modifier units still come from Phase 19a's resolver** (Contract line, then procedure,
  then RVG group; 0 in every seeded row). The M total is that starting value plus the itemised list.
  The existing manual M adjustment (`modifierUnitsCaptured` overridden) is kept unchanged: gaps.json
  lists it against US-03.3.4 ("Combined M total can still be overridden by stepper"), but it is an
  adjustment on top of the itemised list, never a way to claim a modifier, and Phase 23 relies on it.
  Logged on the owner's review list.
- **One place for the pricing model.** The modifier types, the age and included rules and their on/off
  switch, the band and stacking rules and the M total live in `aa-prototype/src/domain/billing` (plus the generated seed
  table), behind types the UI reads, so a v5 of the draft design, or OQ-95's answer, stays a contained
  edit. The reference shape is the draft technical design v4: its Booking procedure fields
  ([AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md), region
  `booking-procedure-fields`: one `modifier_note`, required when modifier units are claimed) and its
  ERD ([AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md), region
  `booking-procedure`). The catalogue goes beyond the draft with a record per modifier (the
  domain model's BOOKING_MODIFIER, MODIFIER and the RVG group's "included" link, labelled "our
  addition, not in draft ERD AR-30"); build the catalogue's shape. The plain-language guide
  ([AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md), region `modifiers`) is
  true as written except where the directors overtook it: modifiers are no longer "never added
  automatically" (age and included ones are), and its page-12 "typical and maximum values for each
  body area" guidance does not exist in the 2021 RVG, whose table is flat (change log 2026-10-07,
  section 8b). Build no body-area guidance.

Seeded figures move: the ASA seed goes (AS2 seeded 1 unit, now an ASA I or II claim worth 0; AS3
seeded 3, now 2), and age modifiers now apply to every seeded patient in a band (removable). Every moved figure is
explained by a test and re-baselined in one place (item 1), and the run sheet is patched (Demo guide
updates). Ellison's pinned $344.50 does not move: her A1 is now the pre-applied age modifier (72 on 21 Jul
2026).

## Before you start: drift check

1. Run `node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-03.3,US-03.3.4,US-03.3.8,US-05.1.4,US-05.1.5,US-05.1.1,US-03.6.1,US-03.3.6,OQ-94,OQ-95`
   (the baseline is `d4db277`; the tool is rename-aware, so never a plain `git diff` of the catalogue
   folder) and read the hunks, plus the "Procedure" (Modifiers bullet) and "RVG groups, procedure
   list and modifier master" sections of `requirements-board/requirements/domain-model.md`. If an item
   changed, re-read it whole and adjust the work items. If one is now Retired or Future, drop its work
   and say so in the PROGRESS entry.
2. Check the AR-34 files have not changed since `d4db277` (`git log -- "requirements-board/requirements/artifacts/files/NZSA RVG 2021 modifiers.md" "requirements-board/requirements/artifacts/files/NZSA RVG 2021 included modifiers.csv"`).
   If they did, the generator (item 2) picks the change up; read the diff for new rows, new value
   shapes or a changed P1 list. US-05.1.5 asks for a spot-check against the PDF: compare five rows
   (PA3, A1, OB4, POC2a, NC2) with `NZSA RVG 2021.pdf` pages 12 and 13 (artifact AR-16) and record the
   result in PROGRESS. A disagreement is reported, never fixed by hand in the generated table.
   Also check whether the draft pricing design has moved to a v5 since `d4db277` (`git log` on
   `requirements-board/requirements/artifacts/AR-29.md`, `AR-30.md` and their files); if it has,
   re-read regions `booking-procedure-fields` (AR-29) and `booking-procedure` and `rvg-group` (AR-30)
   and adjust item 3's types in the one place.
3. Check `docs/discovery-reference/Data files/` (`git log` on it) for Vanessa's list of AA's own
   modifiers. If it has landed, seed those rows as `source: 'aa'` through the same generator path (a
   second source file), with values as given; if not, seed none.
4. Confirm the gates.

| Gate | Build | If answered differently |
|---|---|---|
| **D43 / OQ-94** (answered; superseded in part 20 Oct) | P1 pre-applied at 0 on every CSV code (Neurosurgery H7A to H9b, Spine S1 to S10 and sub-codes), read from the CSV, on the RVG group; selected, removable, never addable twice. No label | Not expected. A changed CSV is picked up by the generator |
| **D29 / OQ-95** (open, narrowed 20 Oct: nothing locked) | Age in completed years on the procedure date; lower bounds inclusive as printed (0: A2, 1: A1, 2 to 69: none, 70 to 79: A1, 80+: A2); none on H6b and P2 (a data flag on the group); pre-applied and removable; bands: ASA (AS1, AS3, AS4) one at a time, BMI (OB1 to OB4) one, the highest applicable, pre-assessment PA1 to PA4 one with PA5 stacking (the 2026-07-27 reading carried forward), ASE stacks with an ASA code, everything else stacks; no ASA and no procedure-default pre-fill; one constant (`PRE_APPLY_MODIFIERS`) switches all pre-application off. One note on the Admin Modifiers tab: "Provisional · whether any modifier is pre-applied, the age bands, and which modifiers stack are still to confirm with AA (OQ-95)." | A different boundary, stacking or exclusion is a change to `AGE_BANDS`, `MODIFIER_BANDS`, the group flag or the switch in the one rule module (item 4) and its tests. If AA wants the ASA grade pre-filled after all, build it as a default of its own only on the owner's word: it reverses US-03.3.4's "Nothing else pre-filled" criterion; log it on the review list |
| **D39 / OQ-88** (open on the system code; two levels per the catalogue, built by 19) | The included modifier sits on the RVG group (US-05.1.4: "now belongs to the RVG group"), never on the procedure | Where the system code sits does not touch this phase. If the two levels were ever merged, `includedModifierIds` moves with the group record: one field |
| **US-03.3.4, US-03.3.8, US-05.1.4, US-05.1.5** (status 3, OQ-95 still open on pre-application) | Build as written, pre-applied and removable | Adjust to the answer |
| **US-03.6.1** (Phase 21 finishes it) | Add only the explanation rule to completion | Phase 21 owns the procedure, Contract and holder-reference rules |

5. Read what Phases 15a, 15b and 17 to 19a actually built (their PROGRESS entries), and follow their
   shapes, not the file names below, which are as at `60e2d1e`. Confirm in particular:
   - from 19: the RVG group type and its fields (19's plan replaces `RvgCode` with `RvgGroup`, and
     `seed/rvgCodes.ts` with `seed/rvgGroups.ts`; there is no procedure master at `d4db277`, so no
     `ProcedureType` or general procedure); where today's absorbed P1 went (any interim
     `includesModifierCodes` or `absorbsModifierCodes` 19 left on a group or code, "deleted by 19b");
     which RVG group codes the seed holds (the real NZSA codes, AA's own `AA-` groups, or both); that
     every Neurosurgery (H7A to H9b) and Spine (S1 to S10 with sub-codes) group exists (19's plan seeds
     all 20 from the CSV), and whether H6b and P2 are seeded; and how a Procedure links to its group
     (the optional RVG code chosen by 19's type-ahead, resolved to the group via `groupOf`;
     `rvgBaseCode` and any `procedureTypeId` gone);
   - from 19a: the resolver's entry point (19's `resolveStartingUnits` in `startingUnits.ts`, which
     19a extends with a `line?` input), the layer names, and where the starting modifier units come
     out (the line's `modifierUnits`, the procedure's, the group's); `FeeContext` and both fee-context
     assemblers (`feeContextFor` in `validateBookingForBilling.ts`, `procedureFee` in
     `shared/capture/feeContext.ts`) as 19a left them;
   - from 18: the parity harness and its fixture naming;
   - from 15a: how completion failures anchor to a control (the `BillingValidationFailure.field` the
     capture block scrolls to);
   - from 20 to 21 nothing: they run after this phase.
6. Record the current `PERSIST_VERSION` (16 at `60e2d1e`; 15a session 2, 15b and 16 to 19a may have
   bumped it).

## Reference

**Design (convention 17).** Capture stays on `docs/design/Mobile App.dc.html` screen 3 (the modifier
area of the BTM block) and its web twin in `Web Dashboard.dc.html`'s card anatomy. The ASA card and
the segmented bands go; the new Modifiers section is a short itemised list (pre-applied rows first, then
claimed rows, then an "Add a modifier" action) and a picker that is a bottom sheet on mobile and a
Dialog on web and Admin (`useSurface`), extending the code picker sheet's search-and-list anatomy.
Pre-applied rows use a neutral selected pill with a small "Applied" tag (no lock glyph: nothing is locked) and a Remove text action, never crimson and never a status
colour; claimed rows use the teal tint the selected chips use today; the warn tint marks only a
missing explanation. The Admin Modifiers tab extends the Admin Review table anatomy
(`docs/design/Admin Review.dc.html`). Tokens and the provisional badge style come from `Design
Language.dc.html`. Teal is the only action colour.

**Catalogue.** The files linked above, plus:
[US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md) (RVG groups: where the
included modifier lives; the group's modifier units, 0 by default),
[US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md) (the procedure has no
modifiers column),
[US-05.2.3](../../../../requirements-board/requirements/stories/US-05.2.3.md) (Retired: conditional
positioning, reversed by US-05.1.4),
[US-03.3.5](../../../../requirements-board/requirements/stories/US-03.3.5.md) (Retired: itemise
modifiers, merged into US-03.3.4),
[US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md) (completion),
[US-03.3.6](../../../../requirements-board/requirements/stories/US-03.3.6.md) (other billing lines,
Phase 39b) and
[FT-05.3](../../../../requirements-board/requirements/stories/FT-05.3.md) (the multi-procedure
modifier split, Phase 23). Artifacts:
[AR-34](../../../../requirements-board/requirements/artifacts/AR-34.md) (the modifiers file, its
sections "2a. The modifying factors table (pages 12 to 13)", "4. Codes whose base units include a
modifier" and "Uncertainties and gaps to confirm"; the CSV),
[AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) region `modifiers`,
[AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) region
`booking-procedure-fields` (and `resolver-layers`, `null-handling` for the starting modifier units),
[AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) region `booking-procedure`
(and `rvg-group`). Evidence: `requirements-board/requirements/notes/2026-10-06-aa-directors-meeting.md`
items 3 and 8 (only modifiers that cannot be removed are applied; age; included modifiers; "All else
are optional"); `2026-10-07-pricing-model-documents.md` items 12, 16, 30, 40, 43 and 45 (a short
explanation per claimed modifier; the 30 codes; values not plain numbers; codes not keys; the findings
to confirm); `2026-10-02-aa-booking-and-pricing-review-with-greg.md` item 45 (the superseded default
modifiers reading). Run `npm --prefix requirements-board run source -- --item US-03.3.4 --text` (and
for US-05.1.4, US-05.1.5, US-03.3.8) to read the cited passages. Change log
`requirements-board/requirements/changes/2026-10-07-requirements-update.md` (the rows for these items,
section 8b on the missing body-area table, section 10's OQ-94 answer).

**Analysis.** `../GAP-ANALYSIS.md` theme 2 and the FT-03.3, US-03.3.4, US-03.3.8, US-05.1.4 and
US-05.1.5 rows; the DM-44 row and the RV-09, RV-22 and RV-38 rows. `../epics/EP-03.md` (FT-03.3,
US-03.3.4, US-03.3.8) and `../epics/EP-05.md` (US-05.1.4, US-05.1.5). `../analysis/domain-model-delta.md#dm-44`
(and `#dm-13`, `#dm-15` for what reads the total next), `../analysis/reverse-check.md` (RV-09, RV-22,
RV-38). `../analysis/prototype-map-domain.md` (billing maths), `prototype-map-shared.md` (the capture
suite), `prototype-map-admin.md` section 9 (Master data), `prototype-map-store-seed.md` (masters,
seed).

**Code entry points (at `60e2d1e`; 18 to 19a will have moved some).**

- Types: `src/domain/types.ts`. `AsaClass` (440); `Procedure` (453) with `asaClass` (497),
  `selectedModifierCodes` (499) and `modifierUnitsCaptured`; `RvgCode` (550) with
  `absorbsModifierCodes` (556); `ModifierGroup` (559, with `'POSTOP'`) and `ModifierCode` (566).
  `Patient.dobISO` (107).
- Modifier master and maths: `src/domain/billing/modifierCodes.ts` (`MODIFIER_CODES`, the static
  `BY_CODE`, `getModifierCode`, `EXCLUSIVE_MODIFIER_GROUPS`, `STACKS_WITHIN_GROUP`, `modifierBandOf`,
  `modifierBandLabel`, `toggleModifierCode`, `ASA_SEED_UNITS`) and `modifierUnits.ts` (the band
  backstop and the absorbed refusal at 58 to 62). `fixtures.ts` (`BASE_ABSORBS_P1`, 100).
  `domain/billing/index.ts` re-exports both.
- Pricing: `src/domain/billing/fee.ts` `resolveBtm` (58; the ASA seed at 79 to 84) and `FeeContext`;
  `validateBookingForBilling.ts` (`BookingBillingContext`, `feeContextFor` at 77, the failure shape);
  `invoiceBuild.ts` (289, 484); `store/billingLineActions.ts` (175);
  `src/shared/capture/feeContext.ts` `procedureFee` (36); `apps/admin/reviewFlags.ts` (`naturalBtm`,
  which strips `modifierUnitsCaptured` at 57).
- Store: `store/lifecycle.ts` `editProcedure` (438, the rights rule `editRefusal`);
  `store/bookingActions.ts` (`selectedModifierCodes: []` at 139, 237, 365 and 451);
  `store/appStore.ts` (`PERSIST_VERSION`, 136); `store/selectors.ts` (861, 881: the master counts).
- Seed: `domain/seed/index.ts` (`modifierCodes: byId(MODIFIER_CODES, ...)` at 441, `SEED_MARKERS` at
  745); `domain/seed/bookings.ts` (`ProcedureSpec.asaClass` and `selectedModifierCodes` at 254 to 255;
  pinned `asaClass` values from 325 to 1015; Ellison's `['A1']` at 430; the generator's `asaDraw` at
  1155 to 1160, which consumes the RNG); `domain/seed/history.ts` (230) and `domain/seed/audit.ts` (98,
  106: seeded audit snapshots carry `selectedModifierCodes` and `asaClass`); `domain/seed/rvgCodes.ts`
  (the seven absorbing rows; Phase 19 replaces it with `seed/rvgGroups.ts`, with no procedure
  master at `d4db277`; check whether 19 left the absorbed P1 as an interim `includesModifierCodes`); `domain/seed/patients.ts` (pinned DOBs; generated DOBs from 1938 to
  2007, so many generated patients fall in an age band).
- Capture (shared by the mobile Booking, the web Booking and the Admin Booking detail):
  `src/shared/capture/BtmCaptureBlock.tsx` (the `Pair` of `AsaCard` and `ProcedureCodeCard`, the
  `anchored` field set), `AsaCard.tsx`, `ModifierChips.tsx` (static `BANDS` and `STACKING_CODES`, the
  absorbed strike-through, the demo-plausible caption at 177), `UnitsCard.tsx` (`modifierBreakdown`,
  102 to 110), `ProcedureCodeCard.tsx` (the "Includes positioning" caption, 60 to 64),
  `modifierLabels.ts`, `src/shared/surface/` (`BottomSheet`, `Dialog`).
- Admin: `src/apps/admin/screens/MasterData.tsx` (`NAV` 50 "Modifier codes", `ModifierCodesView`
  432, the RVG view's Absorbs column 417).
- Control Panel: `src/apps/demo/DemoControlPanel.tsx` S5 (329 to 331: Souter's staged `asaClass`
  regrade on David Chen).
- Audit: `shared/audit/fieldLabels.ts` (55, 56), `shared/audit/auditNarrative.ts`.
- Tests to rewrite or extend: `domain/billing/modifierUnits.test.ts` (ASA seed, band and absorbed-P1
  cases), `fee.test.ts` (the AS3 spot check at 16 to 19 and 56), `validateBookingForBilling.test.ts`,
  `seed.test.ts`, `store/btmCapture.test.ts`, `bookingActions.test.ts`, `postOpAddendum.test.ts`,
  `demoScenarios.test.ts`, `apps/admin/reviewFlags.test.ts`, `shared/audit/auditNarrative.test.ts`,
  `src/pwa/pwaPurity.test.ts` (must stay green). Playwright: `visual/mobile-phase04.spec.ts`
  (`m4-01-modifiers`), `visual/mobile-interactions.spec.ts` (69 to 99: the ASA and pre-assessment
  band slide), `admin-phase07.spec.ts` (the masters shot).

## Work items

Generator and pure rules first, then model, store and seed, then UI. Every new write goes through
`mutate()` with an audit meta. Every rule is a pure function in `src/domain/billing/` with a Vitest
test.

1. **Baseline and explain every moved figure.** Before any edit, add a `phase-19b-baseline.json`
   fixture beside the parity fixtures Phases 18 to 19a left (`src/domain/billing/__parity__/`),
   generated from the untouched code: every seeded Procedure's `feeFor` total and units (B, T, M),
   and every seeded invoice total from `buildSeed()`. Unlike earlier phases, figures are expected to
   move, but only for two reasons, and a test proves it:
   - **the ASA seed goes:** a seeded `asaClass` of AS2 contributed 1 unit and becomes an "ASA I or
     II" claim worth 0 (or no claim, item 8); AS3 contributed 3 and becomes an AS3 claim worth 2; AS1
     contributed 0 and still does;
   - **age is applied:** a patient in an age band on the procedure date gains A1 (1) or A2 (2) unless
     the Procedure already claimed that code (Ellison).
   `feeParity.test.ts` gains a `phase 19b` case that, for every seeded Procedure, computes the
   expected modifier-unit delta from those two rules alone and asserts the new M equals the baseline M
   plus that delta, and that B and T are byte-identical. Every invoice whose total moved must contain
   a moved Procedure. Never regenerate the fixture with `-u`; a failure is a figure to explain. List
   the scripted figures that moved, before and after, in the PROGRESS entry (S3 Beat 1's
   AA-2026-0002 Forte $396.18 and Prentice $152.38 and $91.43, S3 Holt, S5 Beat 4's Hemi Walker Health
   NZ invoice on Dr Whitaker's Fri 17 Jul List, any S4 figure; Ellison's $344.50 and 13 units, and
   the Tue 21 PM List's 41 units and $1,086.50 in `btmCapture.test.ts`, must not move: every
   Procedure on that List is seeded AS1, and its only patient in an age band is Ellison, whose A1 was
   already claimed; Tane, Marsh and Chen are 46, 65 and 37 on 21 Jul 2026), and
   patch the run sheet (Demo guide updates). The original build's pre-payment invoice is still in the
   code at this point (`invoiceBuild.ts` `buildPrePaymentInvoiceForBooking`, the "full estimated fee"
   through `feeFor`; Phase 20 removes the payment category and Phase 27 rebuilds prepayment at the
   anaesthetist's own fixed price, with no estimate and no contingency units): if a seeded pre-payment
   figure moves with the modifier units, record it as a moved figure, and build nothing on it.

2. **Generate the RVG modifier table from the catalogue's files** (US-05.1.5, RV-38, D43). No hand
   transcription anywhere.
   - New `aa-prototype/scripts/generate-rvg-modifiers.mjs` (npm script `rvg:modifiers`) reads
     `../requirements-board/requirements/artifacts/files/NZSA RVG 2021 modifiers.md`, takes the table
     under the heading "2a. The modifying factors table (pages 12 to 13)" (columns Code, Block,
     Modifying factor, Units, Trigger, Source, Page), and reads `NZSA RVG 2021 included modifiers.csv`
     (rvg_code, group_name, base_units, included_modifier, included_units, note, page). It writes
     `src/domain/seed/rvgModifiers.generated.ts`: a `RVG_MODIFIER_ROWS` array (code as printed, "POC 1"
     included, block, factor, units as printed, trigger, automatic when Source says Automatic, page)
     and an `RVG_INCLUDED_MODIFIERS` array (one row per CSV line). Markdown emphasis (`*`, `**`) is
     stripped; en and em dashes in printed wording are replaced with a plain hyphen, because the text
     reaches app copy (CLAUDE.md copy rule); nothing else is changed. The file carries a header naming
     its sources and "generated, do not edit".
   - A Vitest drift guard, `src/domain/seed/rvgModifiers.test.ts`, reads both source files with
     `node:fs` (paths relative to the repo), runs the same parse (export the parser from a small
     `scripts/rvgModifiersParse.mjs` the script and the test share), and asserts the generated file
     equals it: 30 rows in the printed order, 20 CSV rows, every CSV `included_modifier` is a code in
     the table (P1). A changed source file then fails the test until the generator is re-run.
   - The PWA build imports only the generated `.ts`, never the markdown (`pwaPurity` stays green).

3. **Model** (`src/domain/types.ts`), serving DM-44, US-03.3.4, US-03.3.8, US-05.1.4 and US-05.1.5.
   - `ModifierCode` and `ModifierGroup` are replaced by `Modifier { id: ModifierId; code: string;
     block: string; factor: string; unitsAsPrinted: string; units: number | null; trigger?: string;
     appliedFrom?: 'age'; source: 'rvg' | 'aa'; page?: number }`. `id` is the hidden key (codes repeat
     across tables: A1, A2 and P1 are also base codes). `units` is the integer when the printed value
     is a plain whole number, else `null` (the anaesthetist enters the units when claiming). The seed
     ids are stable and readable (`MOD-RVG-PA1`, `MOD-RVG-POC1`); `allocateId` gains a `modifier` kind
     for AA additions.
   - `ModifierClaim { modifierId: ModifierId; units?: number; explanation: string }` is the stored
     record of an optional modifier claimed on a Procedure. `units` is set only for a modifier whose
     `units` is `null`.
   - `ProcedureModifier` is the derived itemised row the UI and pricing read: `{ modifierId; code;
     label; units; explanation?; origin: 'chosen' | 'age' | 'included'; detail?: string;
     refused?: string }`. It is never stored.
   - `Procedure` loses `asaClass` and `selectedModifierCodes` and gains `modifierClaims:
     ModifierClaim[]` and `removedModifierIds: ModifierId[]` (the pre-applied modifiers the anaesthetist
     took off). `AsaClass` goes. `modifierUnitsCaptured` stays (the manual M adjustment).
   - The RVG group type Phase 19 built gains `includedModifierIds: ModifierId[]` (P1 on the CSV
     groups; US-05.1.4 puts it on the group) and `noAgeModifier?: boolean` (D29: H6b and P2), and loses
     `absorbsModifierCodes` if 19 carried it (RV-09). **Any interim
     `includesModifierCodes` Phase 19 left is deleted** ("deleted by 19b"), with every
     reader of it (`modifierUnits`' refusal, the capture strike-through, its `seed.test.ts` check).
     There is no procedure master (US-05.1.6 Retired): a group's optional modifier-units figure and a
     Contract line's are starting values on the Procedure (19a, DM-43), never a pre-selection.
   - `SeedMasters` and `AppState['masters']`: `modifierCodes` becomes `modifiers` keyed by id.
   - Keep these types in `types.ts` beside 19a's Contract line and resolver types, so 25's snapshot
     and 42's loader read one shape.

4. **One modifier rule module**, `src/domain/billing/modifiers.ts`, replacing `modifierCodes.ts` and
   `modifierUnits.ts` (delete both; move what survives). This is the only place modifier units,
   pre-application and bands are decided, and the one place OQ-95's answer changes.
   - `PRE_APPLY_MODIFIERS = true` (D29, Ben's doubt): when false, `preAppliedModifiersFor` returns
     nothing and every modifier is optional. The only switch; no setting UI.
   - `AGE_BANDS` (D29): completed years on the procedure date, `{ from: 0, to: 0, code: 'A2' }, { from:
     1, to: 1, code: 'A1' }, { from: 70, to: 79, code: 'A1' }, { from: 80, code: 'A2' }`, with a comment
     quoting the printed rows and OQ-95. `ageInCompletedYears(dobISO, onISO)` is pure and string
     based (no `new Date()`; the demo clock rule), tested on birthdays, 29 February and the day before
     each boundary.
   - `preAppliedModifiersFor({ patientDobISO, procedureDateISO, group, modifiers, removedModifierIds })`
     returns the pre-applied rows (origin `age` or `included`), minus any the anaesthetist removed: the
     age modifier (none when the group has `noAgeModifier`, or when the DOB or date is missing), and
     each of the group's `includedModifierIds` at **0 units** with the detail "Included in the base
     units of {group code}". The age row carries its modifier's printed units and the detail "From the
     patient's age ({n}) on the procedure date". Both stay removable.
   - `MODIFIER_BANDS` (D29, one table): ASA {AS1, AS3, AS4}, BMI {OB1 to OB4}, pre-assessment {PA1 to
     PA4} (PA5 stacks, the 2026-07-27 reading), age {A1, A2}. ASE and every other code stack. Keyed by
     printed code within the RVG source, so AA's own rows stack unless added to a band.
   - `claimRefusal(claim, ctx)`: unknown modifier; one already present, pre-applied or chosen ("P1 is
     already on this Procedure" or "A1 is already applied from the patient's age"; a modifier is never
     added twice); an explanation blank after trimming ("Add a short explanation for {code}.") or over
     200 characters ("Keep the explanation under 200 characters."); `units` missing, or not a whole
     number of 1 or more, for a modifier whose printed value is not a plain number ("Enter the units
     for {code} (RVG: {unitsAsPrinted})."); `units` given for a plain-number modifier. An age modifier
     the anaesthetist removed, or an included one, can be put back through `restoreModifier` (below)
     with no explanation; claiming it by hand while it is present is refused.
   - `applyClaim(claims, claim, modifiers)`: adds or replaces the claim for that modifier, and removes a
     band sibling (the band rule, as the old `toggleModifierCode` did), returning the claims and the
     sibling it replaced (for the audit and the sheet's "Replaces OB2" line).
   - `resolveModifiers({ claims, preApplied, start, modifiers })` returns `{ items: ProcedureModifier[],
     units }`: pre-applied rows first, then claims in claim order. A claim duplicating a pre-applied
     modifier, or colliding with a band already taken (first wins), or unknown, is kept in `items` with
     `refused` set and adds nothing (the backstop for data that bypassed `applyClaim`: P1 is never
     counted twice). `units` is `start.units` (19a's starting modifier units) plus every unrefused
     item's units.
   - `reconcileClaims(claims, preApplied)`: drops claims that duplicate a pre-applied modifier, and
     `removedModifierIds` entries that no longer apply. Every write path that changes the Procedure's
     procedure or RVG group (19's pick action, `editProcedure`) calls it in the same commit.
   - Tests (`modifiers.test.ts`), rewriting the old band and absorbed-P1 cases, never deleting their
     intent: age on each boundary (0, 1, 2, 69, 70, 79, 80) and none on a `noAgeModifier` group; P1
     pre-applied at 0 on a Spine group and on both an 'a' and a 'b' Neurosurgery group; none on a hip
     group; P1 claimable (2 units) on a hip group; a removed A1 or P1 stays off, adds nothing and
     comes back through restore; `PRE_APPLY_MODIFIERS` false leaves nothing pre-applied; band swap; PA5
     stacks with PA2; ASE stacks with AS3; a duplicate of a pre-applied P1 adds nothing (never twice);
     the M total adds 19a's starting value; an unknown code is refused with its reason; a non-numeric
     modifier priced from its claim's units.

5. **Pricing reads the one module.** `resolveBtm`'s modifier branch calls `resolveModifiers` with
   `preAppliedModifiersFor(...)` and 19a's starting modifier units; the ASA seed (fee.ts 79 to 84) and the
   absorbed refusal go. `BtmBreakdown` carries `modifierItems: ProcedureModifier[]` in place of
   `refusedModifiers`, so the UI, 23's split and 25's snapshot read one answer. `FeeContext` and
   `BookingBillingContext` gain `patientDobISO`, `procedureDateISO` and `modifiers`; every assembler
   passes them the same way: `feeContextFor`, `procedureFee`, `invoiceBuild`, `billingLineActions`,
   `reviewFlags.naturalBtm` and `seed/billing.ts`. `splitBillingUnits` is unchanged (an additional
   Procedure still bills time only until Phase 23). The manual M adjustment (`modifierUnitsCaptured`
   overridden) still wins over the computed total, as today. Grep `selectedModifierCodes`, `asaClass`,
   `ASA_SEED_UNITS`, `getModifierCode`, `MODIFIER_CODES`, `absorbsModifierCodes`,
   `includesModifierCodes`, `lockedModifiersFor` and `BASE_ABSORBS_P1` afterwards: none remain outside the seed migration
   and its tests.

6. **Store actions**, in a new `src/store/modifierActions.ts`, exported from `store/index.ts`, with
   `editProcedure`'s rights (`editRefusal`: the anaesthetist on their own ACTIVE List, the office per
   its edit rules, nobody on AUTHORISED). Each returns `Outcome` and writes one audited commit.
   - `claimModifier(api, actor, procedureId, { modifierId, explanation, units? })`: refuses with
     `claimRefusal`; on success writes `modifierClaims` through `applyClaim`, audited as
     `procedure.modifierClaim` with before and after claims (and the sibling it replaced).
   - `editModifierExplanation(api, actor, procedureId, modifierId, explanation, units?)`: the same
     checks; a blank explanation is refused ("Add a short explanation, or remove the modifier.").
   - `removeModifier(api, actor, procedureId, modifierId)`: removes a chosen claim, audited
     `procedure.modifierUnclaim`; or, for a pre-applied modifier (age or included), adds it to
     `removedModifierIds`, audited `procedure.modifierRemove` with its origin. Nothing is locked.
   - `restoreModifier(api, actor, procedureId, modifierId)`: takes a removed pre-applied modifier off
     `removedModifierIds`, audited `procedure.modifierRestore`; refused when it no longer applies.
   - `addAaModifier(api, actor, { code, factor, units, unitsAsPrinted? })`: office only, audited
     `modifier.create`; the code must not clash with another AA row (RVG codes may repeat, ids differ);
     `units` a whole number of 0 or more. No edit or delete of RVG rows (they are as printed; Phase 42
     loads and edits masters).
   - `editProcedure` refuses a patch carrying `modifierClaims` or `removedModifierIds` (they change only through the actions
     above, so no claim is saved without its explanation) and calls `reconcileClaims` when a patch
     changes the code or group.
   - Tests (`store/modifierActions.test.ts`): each refusal; a band swap replaces the sibling in one
     audit entry; a claim on an AUTHORISED List is refused; the anaesthetist cannot claim on another
     anaesthetist's List; removing a claim lowers M on the Admin Booking; removing the pre-applied A1 or P1 is audited and
     lowers M by the age units (P1 by 0), restoring it puts it back, and a claim of P1 while it is
     present is refused (never twice); an AA modifier added by the
     office is claimable at once; `editProcedure` with `modifierClaims` is refused; a code change to a
     Spine procedure drops a P1 claim in the same commit, and a code change to a hip procedure drops
     the removal of P1.

7. **Completion backstop** (US-03.6.1, finished by 21). `validateBookingForBilling` fails a Procedure
   for each claim whose explanation is blank, field `modifierClaims` with the modifier id, message
   "Add a short explanation for {code}, or remove it." It also fails a claim needing units with none.
   A refused duplicate of a pre-applied modifier is not a failure (it adds nothing and the capture section
   shows it with Remove). Pre-applied modifiers never need an explanation, and a removed one is no failure. Tests: a seeded claim with a
   blank explanation blocks "Mark complete" and submit; adding the explanation clears it; the pristine
   seed has no such failure anywhere (so no seeded List stops submitting).

8. **Seed migration.** One `PERSIST_VERSION` bump for the phase (from its post-19a value). Draw nothing
   new from the seeded RNG and keep every existing draw, so every generated Booking stays identical.
   - `modifiers`: `byId` over the generated `RVG_MODIFIER_ROWS` mapped to `Modifier` (plain whole-number
     units parsed, everything else `null`; `appliedFrom: 'age'` on the Automatic rows), plus Vanessa's
     rows if drift step 3 found them.
   - RVG groups: set `includedModifierIds` (P1) on every group whose code is in the CSV. If Phase 19's
     seed lacks a CSV group, add it from the CSV row (code, name as the CSV's `group_name` body section,
     base units from `base_units`), in 19's group shape, so all 20 exist; draw
     nothing from the RNG. Set `noAgeModifier` on H6b and P2 if 19 seeded them. Drop any interim
     `includesModifierCodes: ['P1']` 19 left for the seven legacy absorbing codes
     (hip 47516, 47519, 47522, shoulder 48900, 48939, lumbar 51011, 51020), and `absorbsModifierCodes`
     from any row that still carries it. Hip and shoulder groups are not CSV groups, so they
     pre-apply nothing; if a seeded Procedure's RVG code now resolves to a CSV Spine group (rather than an AA lumbar group),
     P1 is now pre-applied there at 0, which is right (US-05.1.4) and moves no figure. At `60e2d1e` no seeded Procedure selects P1 on
     an absorbing code, so removing absorption moves nothing; if 15b to 19a added one, keep it as a P1
     claim with an explanation and record its figure.
   - Procedures: `ProcedureSpec.asaClass` and `selectedModifierCodes` become `modifierClaims`
     (`{ code, explanation }` resolved to ids in the helper). Map every pinned and generated `asaClass`:
     AS1 and AS2 claim nothing (ASA I or II is AS1 at 0 units: claiming it adds nothing and would only
     ask for an explanation), AS3 claims AS3 (2 units) with a seeded explanation, AS4 claims AS4. The
     generator keeps its `asaDraw` call and maps the drawn class the same way. Ellison's `['A1']` claim
     goes: her A1 is now pre-applied from her age (removable). Any other pinned claim keeps its code with a seeded
     explanation. Explanations come from one small table in the seed keyed by code (for example AS3
     "ASA III, severe systemic disease on pre-op review"), so every seeded claim has one and S1 to S5
     stay green.
   - **One seeded Spine Procedure** for the P1 beat (US-05.1.4): in a post-generation pass, re-code one
     generated, uncaptured future Booking on a Dr Souter List that no run-sheet beat counts, to a Spine
     group's RVG code (S3a, for example), keeping its procedure text as received; register a `SEED_MARKERS` entry
     (`includedModifierBooking`) so tests, recipes and ATLAS find it. It is uncaptured and unbilled, so
     no figure moves, and no Booking id shifts.
   - Every seeded Procedure starts with `removedModifierIds: []`.
   - Seeded audit history (`seed/history.ts`, `seed/audit.ts`): snapshots carry `modifierClaims` and `removedModifierIds`, and
     the seeded capture entries for a claim are `procedure.modifierClaim` entries with the explanation.
   - `seed.test.ts`: every claim resolves to a modifier and has a non-blank explanation; no claim
     duplicates a pre-applied modifier; all 20 CSV groups exist with P1 included; the master has the 30 RVG
     rows and no AS2, PO1 or PO2; the marker resolves to a Procedure on a Spine group; the patient
     count in each age band is reported (for the PROGRESS entry).

   **Session 1 ends here, green:** `npm run build`, `npm run build:pwa`, `npx vitest run`, with the
   19b parity case explaining every moved figure. The old capture UI is removed in session 2; in
   session 1 keep it compiling by pointing `ModifierChips` at the new claims read-only if needed.

9. **The Modifiers section in capture, mobile, web and Admin (shared)**, for US-03.3.4, US-03.3.8 and
   US-05.1.4. `BtmCaptureBlock` is shared by the mobile Booking, the web Booking and the Admin Booking
   detail, so this is one change for all three.
   - `AsaCard.tsx` and `ModifierChips.tsx` are deleted; `ProcedureCodeCard` sits alone (or pairs with
     whatever 19 and 20 put beside it). A new `ModifiersSection.tsx` sits under the units, keeping the
     `capture-modifiers` hook.
   - **Pre-applied rows first:** each a neutral selected pill (no lock glyph), the mono code, the factor and
     the units ("P1 · Non-supine positioning · 0"), then a mist caption with the reason ("Included in
     the base units of S3a. Cannot be added twice." / "From the patient's age (72) on the procedure
     date.") and a teal Remove text action. Removing writes at once (`removeModifier`); the row moves to
     a mist "Removed: {code}. Put back" line (`restoreModifier`) so a mis-tap is recoverable. Hooks
     `capture-modifier-applied` (replaces the earlier `capture-modifier-locked`).
   - **Claimed rows:** the mono code, the factor and "+2", the explanation in slate beneath, and Edit
     and Remove as teal text actions. A refused row (a duplicate of a pre-applied modifier or a band clash
     that bypassed the picker) shows its reason in the warn tint with Remove. A claim missing its
     explanation (seed or persisted data) shows the warn tint and "Add a short explanation" and is the
     control "Mark complete" scrolls to. Hooks `capture-modifier-claim`.
   - **"Add a modifier"** (teal text action) opens the picker. Nothing is shown pre-selected beyond the
     pre-applied rows (US-03.3.4 "Nothing else pre-filled"). With `PRE_APPLY_MODIFIERS` off the
     section shows claims only.
   - Empty state with no pre-applied rows and no claims: "No modifiers. Add any that apply, each with a
     short reason."
   - The section caption: "Values from the NZSA RVG 2021 modifier table. Age, and any modifier the
     base units include, are applied for you and can be removed." The old "demo-plausible" caption goes.
   - Disabled (an additional Procedure or a List the rights rule locks): rows visible, actions hidden, as today.
   - `BtmCaptureBlock`'s `anchored` set gains `modifierClaims`; the old ASA write-through note in its
     comment is replaced.

10. **The modifier picker with the inline explanation** (new `ModifierPickerSheet.tsx` in
    `src/shared/capture/`; bottom sheet on mobile, Dialog on web and Admin, via `useSurface`).
    - Title "Add a modifier"; a search box ("Search code or modifier") over code and factor; rows grouped
      under the printed blocks in table order (Pre-assessment, Age, ASA, BMI, Airway / position,
      Monitoring, Echo, Recovery, Post-op / cover, Nerve catheter), then "AA's own". Each row: mono code, the
      factor, the printed units in mono ("2 + Time"). Age rows and the Procedure's included modifiers
      show "Applied" with their reason ("From the patient's age", "Included in the base units"), or,
      when removed, a "Put back" action; they cannot be claimed a second time. Claimed rows show
      "Claimed".
    - **Tapping a row expands it inline** in the same sheet: an "Explanation" field (one or two lines,
      placeholder "A short reason, as an insurer would ask", 200 characters), a "Units" stepper with
      "RVG: 2 + Time" beside it when the printed value is not a plain number, a "Replaces OB2" line
      when the band holds a sibling, and "Claim" (teal, disabled until the explanation has text) and
      "Cancel". Only "Claim" writes (`claimModifier`); the sheet then closes, or stays open for
      another on web. Nothing is lost on mobile: the pending claim lives in the sheet's local state
      until Claim or Cancel, so the per-tap write rule is kept for everything else.
    - Edit on a claimed row opens the same inline form pre-filled (`editModifierExplanation`). Remove
      writes at once (`removeModifierClaim`).
    - Hooks: `modifier-picker`, `modifier-explanation`.

11. **Units caption.** `UnitsCard`'s M row caption is built from `btm.modifierItems`: "A1 age +1
    · P1 included 0 · AS3 +2", "Starting value {n} from the {layer}" prepended when 19a's
    starting modifier units are not 0, and "None applied" when empty. `modifierLabels.ts` goes (labels
    are the printed factor). `ProcedureCodeCard`'s "Includes positioning" caption goes (RV-09).
    `shared/audit/fieldLabels.ts`: `modifierClaims: 'Modifiers'`; `asaClass` and
    `selectedModifierCodes` go. `auditNarrative.ts` narrates "Claimed AS3 (ASA III): '{explanation}'",
    "Removed AS3", "Removed the age modifier A1", "Put back P1" and "AS3 explanation changed", and AA modifier creation.

12. **Admin, Master data.**
    - a. The "Modifier codes" tab becomes **"Modifiers"** (`masters-modifiers` hook). Columns: Code
      (mono), Block, Modifying factor, Units (mono, as printed), Priced as ("2" or "Entered at
      capture"), Applied ("From age" for A1 and A2, "Optional" otherwise; P1 reads "Optional, or included by the RVG group"), Bands (neutral pill: "One
      per ASA band"), Page. A second table, "AA's own", lists the AA rows (empty state: "None yet.
      Vanessa's list loads here; the office can add one now."). The tab header carries the phase's one
      provisional note as a `DemoBadge`: "Provisional · whether any modifier is pre-applied, the age bands, and
      which modifiers stack are still to confirm with AA (OQ-95)." The subheading: "The
      NZSA RVG 2021 modifier table, as printed, plus AA's own."
    - b. **"Add AA modifier"** (teal) opens `AddAaModifierSheet` (code, factor, units) in
      `src/apps/admin/flows/`, a new member of the `Sheet` union, calling `addAaModifier`.
    - c. The RVG groups view (19's): an **"Included modifiers"** column (mono neutral pill "P1 · 0") on
      the 20 CSV groups, with the hook `masters-rvg-included`; the Absorbs column goes if 19 left it.
    - `store/selectors.ts`' master count reads `modifiers`.

13. **S5 staging and the copy sweep.**
    - `DemoControlPanel.tsx` S5 re-points its first and third staged edits (it may only edit that
      existing scenario, never add to the page). They are `editProcedure(... { asaClass })` calls today,
      which item 6 refuses, so they become `claimModifier` and `removeModifier`: Souter claims AS3
      on David Chen's Procedure with the
      explanation "Pre-op review: ASA III", the office note stays, then Souter removes the claim, so
      the trail shows a claim with its explanation and its removal and the fee ends where it started.
      Its message keeps "three live edits". Update `demoScenarios.test.ts`.
    - Grep `src/` for "ASA status", "seeds", "ASA I", "Also applies", "Positioning", "Includes
      positioning", "already includes", "Absorbs", "demo-plausible", "Modifier codes", "PO1", "AS2" and
      "very old" / "very young" (the old A1 and A2 labels), and update or remove each. Every new string
      follows the no en or em dash rule (the generator already replaced the printed dashes). The only
      provisional label is the OQ-95 note (item 12a).

14. **Playwright and green.**
    - Rewrite `m4-01-modifiers` (the Modifiers section on Ellison's Booking: A1 pre-applied) and the
      `mobile-interactions` slide spec (the ASA and pre-assessment indicator slide goes with the
      segmented bands; keep a test on whatever segmented control remains, or delete the ASA half and say
      so).
    - Add specs: on mobile and web, Ellison shows A1 pre-applied with no other modifier, and Remove takes it off, with
      the "Put back" line restoring it; claiming ASA III
      opens the inline explanation, Claim stays disabled until text is typed, the claimed row shows the
      explanation and M rises by 2 on the Admin Booking; the Spine Booking (marker) shows P1 selected at 0, removable, with P1 showing "Applied" in the picker and a second claim refused; a claim swapped OB2 to OB3 shows "Replaces OB2"; Mark complete with a
      seeded blank-explanation claim (a test-only store setup) scrolls to the claim; the Admin
      Modifiers tab lists 30 RVG rows and the provisional note.
    - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, all green.

## Demo triggers

- **No new button.** Every beat is normal use, on mobile, web and Admin capture:
  - a seeded Booking on a Spine group (the `includedModifierBooking` marker, on a Dr Souter List)
    shows P1 selected at 0 units, removable, and cannot be added a second time;
  - a seeded patient of 70 or over (Margaret Ellison, 72, `BK0009` on Dr Souter's Tue 21 Jul PM List)
    shows A1 pre-applied and removable;
  - claiming ASA III, or any other optional modifier, asks for its short explanation before the claim
    saves.
- The PWA reaches all three through the shared capture components, so no PWA trigger is needed, and no
  mobile beat waits on the office or a colleague, so no PWA stand-in. 15a's "Raise sample warnings" is
  unchanged (this phase adds no warning rule).
- The Control Panel changes only inside its existing S5 scenario staging (item 13). Nothing is added
  to the page.

## Out of scope

- The RVG code type-ahead, RVG groups and their base and modifier units (Phase 19); the
  resolver and the Contract line's modifier units, including whether a line that sets modifier units
  replaces or adds to the itemised claims (19a and 24; this phase adds 19a's starting value to the
  itemised total and logs the reading).
- The multi-procedure rule's modifier split (Phase 23, D26), and modifiers on an additional Procedure,
  which still bills time only until then.
- Snapshotting the itemised modifiers at AUTHORISED (Phase 25).
- Modifiers as a "top-up" on a fixed-price Contract (the RVG's page 4 note): a fixed price ignores BTM
  under 24's precedence; modifiers stay recorded for reference.
- Pre-op and post-op events, which take no modifiers (Phase 39b); post-op cover codes (POC) are
  ordinary optional modifiers here.
- Loading Vanessa's list or the RVG table from spreadsheets, and editing or deleting RVG rows (Phase
  42). Frailty (named by the RVG with no code or units), the Upper Limb "add 2 units if sitting
  position" note (an addition, whose scope is unclear; P1 covers it as an optional claim), any
  after-hours loading (not in the RVG) and the worked example's BMI 37 discrepancy (the table wins).
- Removing the manual M adjustment, any modifier warning rule, and body-area modifier guidance (the
  2021 RVG has none).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin → Master data → Modifiers: 30 RVG rows in the printed order with units as printed (PA3
      "2 + Time", POC2a "4-6", PACU1 "As Per T1/T2"); no AS2, PO1 or PO2; AS3 is 2; A1 and A2 read
      "From age"; the OQ-95 note (whether anything is pre-applied, the bands) shows here and nowhere else. No en or em dash in any row.
- [ ] Add AA modifier (code AAX1, "Demo AA modifier", 1 unit): it appears under "AA's own" with an
      audit entry, and is claimable on a mobile Booking at once.
- [ ] RVG groups: the 20 Neurosurgery and Spine groups show "P1 · 0" under Included modifiers; no
      Absorbs column.
- [ ] FT-03.3: a Contract that does not price from RVG shows no RVG code entry; times read start and finish; the procedure text is not editable.
- [ ] Mobile (Dr Souter) → Tue 21 Jul PM → Margaret Ellison: A1 is pre-applied with "From the patient's
      age (72) on the procedure date" and a Remove action; nothing else is selected; there is no ASA
      card. Remove takes A1 off (M drops by 1, audited) and "Put back" restores it. After "Finish
      now" her Admin Booking still reads $344.50 and 13 units (the `btmCapture.test.ts` pin).
- [ ] Claim ASA III on Ellison: the inline explanation opens, Claim is disabled until text is typed,
      the claim saves with its explanation, and M on the Admin Booking rises by 2. Cancel discards a
      half-made claim. Claim OB2 then OB3: "Replaces OB2" shows and only OB3 remains. Remove works at
      once.
- [ ] Try to claim A1 on Ellison while it is applied: the picker shows "Applied", no second A1. A patient
      outside the bands shows no age modifier; A1 or A2 can be claimed by hand there, with an explanation.
- [ ] The Spine Booking (marker): P1 selected at 0 with "Included in the base units of S3a" and Remove; P1
      shows "Applied" in the picker, never added twice; removing it works and "Put back" restores it. A hip Booking (Hemi Walker, 47516): P1 is an ordinary optional claim worth 2, with no
      strike-through.
- [ ] A claim on a modifier printed as "2 + Time" (PA3) asks for units, and M rises by the entered
      units.
- [ ] Web and the Admin Booking detail behave the same (Dialog, not a bottom sheet).
- [ ] Completion backstop: with a store-staged blank explanation (test setup), Mark complete refuses
      and scrolls to the claim; adding the explanation lets it complete. No seeded List fails
      submission for this rule.
- [ ] S1 Beat 3 (Sarah Mitchell) completes with no modifier and no ASA step. S5 jump: David Chen's
      History shows the AS3 claim with its explanation, the office note and the removal; Chen's fee is
      unchanged.
- [ ] Every scripted figure the parity case moved matches the patched run sheet (S3 Beat 1, S5 Beat
      4); Ellison's $344.50 is unchanged.
- [ ] Audit viewer: procedure.modifierClaim, procedure.modifierUnclaim and modifier.create entries
      with before and after values.
- [ ] PWA (5174): Ellison's pre-applied A1 and an ASA III claim with its explanation work the same.
- [ ] No en or em dash in any new app copy (grep the diff). Actions teal, pre-applied pills neutral, no crimson, no lock glyph.
- [ ] Catalogue screenshots: the recipes for US-03.3.4, US-03.3.8, US-05.1.4 and US-05.1.5 are created
      or updated, every recipe this phase broke is re-pointed or set absent, a full `npm run capture`
      ends with no failed recipe and no story without a recipe, the covered items' new shots are
      checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      green.

## Demo guide updates

Patch these beats and lines, and the same sections of `master-demo-guide.html`, in the same session:

- `03-demo-script.md`:
  - **S1 Beat 3** (capture on mobile): no ASA step; add a "Worth pointing at": "Modifiers: only age and
    a modifier the base units include are pre-applied, and can be removed; anything else the anaesthetist claims, ASA
    included, asks for a short reason (open Margaret Ellison on Dr Souter's Tue 21 Jul PM List for the
    pre-applied A1)". Check Expected still reads true after 19's and 20's changes.
  - **S3 Beat 1** and any S3 figure: the re-baselined invoice figures from item 1 (Forte, Prentice,
    Holt), with one sentence on why they moved (the RVG's real ASA values and the age modifier).
  - **S5 Beat 1**: Expected names the staged anaesthetist edits as "an ASA III modifier claimed with
    its explanation, then removed". **S5 Beat 4**: the Hemi Walker Health NZ figure if it moved.
  - **S5 discovery points**: "the demo-plausible modifier values" becomes "the RVG modifier table as
    printed (values that are not plain numbers are entered at capture); whether anything is pre-applied, the age bands and stacking are still to confirm (OQ-95); no
    ASA pre-fill; AA's own modifiers (Vanessa's list) not yet loaded".
- `02-workflows-and-handoffs.md`, Workflow 4 ("capture BTM and complete a Booking") steps 6 to 8: step 6 "She records ASA and any other
  applicable modifiers" becomes "The age modifier, and any modifier the procedure's base units
  include (P1 on Neurosurgery and Spine codes), are pre-applied and removable; she claims any other modifier
  that applies, ASA included, each with a short explanation"; step 7 ("prevents a positioning modifier
  if the base code already includes it") becomes "An included modifier shows at 0 units and cannot be
  added twice"; step 8 (the segmented bands and "Also applies" chips) becomes the one-per-band rule
  (ASA, BMI, pre-assessment) stated as provisional (OQ-95), with the picker's "Replaces" line.
- `01-personas-and-responsibilities.md`, Dr Souter's core action 4: "Record ASA, RVG code, ..."
  becomes "Record the procedure, start and handover times, any modifiers claimed with a short reason,
  notes and any allowed additional billing line".
- `04-presenter-cheat-sheet.md`: the "RFP ambiguities" item 10, as Phase 19a left it (retitled
  "Modifier values", its time-rounding line already dropped): "The RFP names example modifier
  ranges..." and "The prototype values are demo-plausible..." become the RVG table as printed, values
  not plain numbers entered at capture, and the pre-applied, removable age and included modifiers; the same-band
  bullet becomes the band rule stated as provisional (OQ-95), with ASE stacking. In "Fee
  calculation", "Positioning cannot be charged again if the base code already includes it" becomes
  "P1 (non-supine positioning) is included, pre-applied at 0 (removable), on every Neurosurgery and Spine code, so it
  cannot be added twice; the age modifier is pre-applied from the date of birth, removable", and any
  ASA-seeding sentence goes.
- `master-demo-guide.html`: the same sections, including the workflow card "4 · Capture BTM and
  complete a Booking" ("plus ASA and modifiers ... A positioning modifier is blocked if the base code
  already absorbs it"), the Workflow 4 band bullet ("Modifier codes in the same band ... 'Also
  applies'"), the cheat-sheet "Positioning cannot be charged again" bullet, the cheat-sheet item 10
  card and the S5 discovery callout ("demo-plausible modifier values").
- Control Panel: the S5 scenario's staging (item 13) and its message; grep `src/apps/demo` for "ASA",
  "modifier" and "absorb" to confirm nothing else.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 19b` first: earlier phases may have
changed these recipes since this plan was written. Stale captions describing the ASA seed, absorbed
positioning or the demo modifier set are replaced here, by the phase that rebuilds the screen.

**Covered items.** When the phase is done, each recipe in `requirements-board/requirements/capture/recipes/`
matches what was built:

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) optional modifiers with an explanation | captured · web-asa, mobile-asa (retired ASA-seeding captions); `images` also carry three merged US-03.3.5 entries | `captured`. Replace `asa` with `modifiers` on web and mobile at `BK0009`: states `applied` (highlight `capture-modifier-applied`; "Age is pre-applied and can be removed"), `claiming` (picker open, tap AS3; highlight `modifier-explanation`; "Claiming a modifier asks for a short explanation"), `claimed` (highlight `capture-modifier-claim`; "Each claimed modifier is itemised with its explanation"). No ASA-seeding caption survives. Remove the three US-03.3.5 entries from `images` only, and record it |
| [US-03.3.8](../../../../requirements-board/requirements/stories/US-03.3.8.md) age modifier | none (create it) | Create, `captured`. `age-applied` on web and mobile at `BK0009` (Ellison, 72), highlight the A1 row (`capture-modifier-applied`); caption "A1 is applied from the patient's age and can be removed"; a second state `age-removed` (Remove tapped, "Put back" showing) |
| [US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md) included modifiers | captured · admin-rvg-absorbs, web-/mobile-absorbed-positioning (hip and shoulder struck through: retired) | `captured`, re-pointed. Drop both old shots. Admin `rvg-included` (highlight `masters-rvg-included`; "P1 is included in every Neurosurgery and Spine group's base units"); web and mobile `included-applied` at the `includedModifierBooking` Booking, states `selected` (P1 at 0 units, removable; highlight the P1 row) and `not-addable` (picker open, P1 "Applied"; "An included modifier cannot be added twice") |
| [US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md) modifier code master | partial · admin-modifier-codes (stale caption; VM1, TTE, PACU1, EAA1, POC, NC missing) | `captured`. Re-shoot `modifier-codes` on the Modifiers tab (`masters-modifiers`; click re-pointed to "Modifiers"): the 30 RVG rows as printed, the Applied column, "AA's own"; caption "The RVG modifier table as printed, plus AA's own"; add state `add-aa` (sheet open). Drop the partial reason; keep `partial` ("Vanessa's list not supplied; the office adds AA modifiers one by one") only if the review judges it material |
| [FT-03.3](../../../../requirements-board/requirements/stories/FT-03.3.md) clinical billing data | no recipe row | No change here: shown through its stories (US-03.3.1 and US-03.3.3 below, US-03.3.4) |
| [US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) | captured · web-rvg-picker, mobile-rvg-picker | No change here (Phases 19 and 20 own it); `--dry` after `AsaCard` leaves the `Pair`, re-point only selectors this phase moved |
| [US-03.3.3](../../../../requirements-board/requirements/stories/US-03.3.3.md) | captured · web-times, mobile-times | No change here (not this phase's); `--dry` confirms `capture-times` is still found |

**Recipes this phase breaks.**
- `US-03.3.5` (Retired, merged into US-03.3.4, still `captured`): it highlights the segmented bands
  (`[data-sliding-segmented-control]`) and clicks `button:has-text("Emergency")` under "Also applies",
  both gone. Set it `absent` with "Retired: merged into US-03.3.4; itemised modifiers are shot there
  (Phase 19b)", no shots.
- `US-05.2.3` (Retired, still `captured` unless Phase 19 already set it absent): its
  `absorbed-positioning` shots look for `/already includes P1/`, which no longer renders. Set it
  `absent` with "Retired: a modifier the base units include is now shown selected at 0 and removable (US-05.1.4,
  Phase 19b)".
- `US-13.4.1` (Phase 42's): its `modifier-codes` state clicks the "Modifier codes" tab, now
  "Modifiers", and is captioned "(view only)"; re-point it to "Modifiers" and caption it "Master data,
  modifiers (the RVG table as printed, plus AA's own)", and trim "modifier codes" from its
  `absentReason`'s view-only list (AA's own can be added; the RVG rows stay as printed).
- `US-05.1.1` (Phase 19's): if its `admin-rvg-codes` caption still says "absorbed modifiers", re-caption
  it ("... and the modifiers their base units include").
- Any recipe using `capture-asa-status` (only US-03.3.4 at plan time) or the "Positioning" chip text
  (US-05.1.4, US-05.2.3, US-03.3.5); and `US-03.2.1` and `US-03.5.2`, whose captions mention modifier
  units on `BK0009`-like Bookings: run `--dry` and fix what fails.

**ATLAS.md.** Overlays that need clicks (the modifier picker and its inline explanation; the
AddAaModifier sheet), Existing hooks (`capture-modifiers` kept; `capture-modifier-applied`,
`capture-modifier-claim`, `modifier-picker`, `modifier-explanation`, `masters-modifiers`,
`masters-rvg-included` added; `capture-asa-status` removed), Seed data worth shooting (Ellison's
pre-applied A1 in place of "A1 modifier"; the `includedModifierBooking` Spine Booking with its list and
Booking id; the seeded AS3 claims with explanations; no ASA seed), and the Master data tab name.
Routes are unchanged.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS entry,
run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**. Fan out about three
independent Opus review subagents, one each for **quality**, **bugs/correctness** and **plan adherence**,
and a fourth on **billing maths and the seed figures**, because the M total sits under every fee and
the seed's figures moved. This session then independently verifies every finding against the
catalogue files, this doc and the code, fixes the confirmed ones (with a test for each bug), re-greens,
and records the pass. Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **Every moved figure is explained.** The 19b parity case attributes every M change to the ASA
  values or the age rule and nothing else; B and T are identical; Ellison's $344.50 holds; the run
  sheet's figures match the app; no new RNG draw and the `asaDraw` kept.
- **One modifier answer.** Only `modifiers.ts` decides pre-application, bands, refusals and the M total; every
  fee-context assembler passes the same DOB, procedure date, group and master; `BtmBreakdown`'s
  `modifierItems` is what the UI, the caption and the audit read. No runtime path reads the generated
  rows except through the store master.
- **Pre-applied, removable, never twice.** Age and included modifiers are derived, shown selected and
  removable (removal stored in `removedModifierIds`, audited, restorable); nothing is locked and no
  lock glyph exists; none is ever counted twice (a duplicate claim adds nothing); a code or group
  change reconciles in the same commit; the age uses the List's date and the demo clock, never
  `new Date()`; the D29 boundaries are tested on each edge; H6b and P2 suppress the age modifier;
  `PRE_APPLY_MODIFIERS` off leaves everything optional and is the only switch.
- **The table is the catalogue's.** The generated file equals the parse of AR-34's files (the drift
  test), values as printed, ids hidden, dashes normalised, and no hand-typed modifier row anywhere in
  `src/`. P1 is pre-applied on exactly the 20 CSV codes and on no hip or shoulder code.
- **No claim without an explanation.** The picker's Claim is disabled until text is typed; the store
  refuses a blank explanation on claim and edit; `editProcedure` cannot write claims; the completion
  backstop catches anything else; the pristine seed passes it.
- **Nothing pre-filled.** No ASA seed, no procedure default, no "untickable default"; `asaClass`,
  `AsaCard`, `ASA_SEED_UNITS`, `absorbsModifierCodes`, 19's interim `includesModifierCodes`, the
  strike-through and the "Includes positioning" caption are gone from code, tests and copy (RV-09, RV-22). The PA5 and ASE stacking
  and the band swaps match D29's table.
- **One provisional label** (OQ-95, the Admin Modifiers tab), none elsewhere. Plus the usual: teal-only
  actions, no dashes in copy, mobile sheets not modals, `pwaPurity` green, every write audited and
  through `mutate()`, `PERSIST_VERSION` bumped once.
- **No gold-plating.** No modifier loader, no RVG row editing, no warning rule, no body-area guidance,
  no multi-procedure split, no snapshot, no change to the manual M adjustment.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): D29 built as OQ-95's default (completed years on the procedure date, lower bounds
  inclusive, none on H6b and P2, the band and stacking table, ASE stacking, no ASA pre-fill), labelled
  provisional on the Admin Modifiers tab; pre-application as one switch (`PRE_APPLY_MODIFIERS`, on);
  removal of a pre-applied modifier stored as `removedModifierIds` with a "Put back" action, and no
  explanation asked for a pre-applied one; A1 and A2 claimable by hand outside their bands, with an explanation; the explanation's 200
  character limit; seeded AS1 and AS2 classes claiming nothing; the seeded explanation wording; the
  starting modifier units added to (not replaced by) the itemised claims; the manual M adjustment kept;
  AA's own list not loaded (one AA row can be added by the office); the PDF spot-check result; the
  moved figures with before and after; and the screens worth a look, each with its route and persona
  (Ellison's capture, the Spine Booking, the picker, the Admin Modifiers tab).
- **Catalogue screenshots result:** the recipe created (US-03.3.8), re-pointed (US-05.1.4), changed
  (US-03.3.4, US-05.1.5) and the broken ones fixed (US-03.3.5, US-05.2.3, US-13.4.1, and any US-05.1.1
  caption), the `requirements-board/requirements/capture/REPORT.md` counts (captured, partial, absent, failed)
  before and after, and any partial reason handed on.
- Status row for catch-up Phase 19b, and a phase entry: what was built, the parity result with the
  moved figures, the review pass (findings confirmed and fixed, anything not treated as a defect and
  why), tests added, and the `PERSIST_VERSION` bump.
- **Decisions log:**
  1. The modifier master is the NZSA RVG 2021 table as printed, generated from AR-34's files, plus AA's
     own; codes are not keys. Supersedes the 2026-07-22 "table lives in `modifierCodes.ts`, values
     demo-plausible" entry and its PO1 and PO2 list.
  2. The 2026-07-22 "ASA seeding values" ruling is superseded (RV-22): the ASA grade is one optional
     modifier with an explanation, nothing pre-filled (US-03.3.4; OQ-95 open).
  3. The absorbed-P1 ruling is superseded (RV-09, US-05.1.4, D43): P1 is included, pre-applied at 0 and removable, on the
     20 Neurosurgery and Spine codes from the CSV, on the RVG group; hip and shoulder codes include
     nothing. The 2026-10-02 "default modifiers, pre-filled and untickable" reading is superseded too.
  4. The 2026-07-23 A1 relabel for Ellison now stands as the pre-applied, removable age modifier from her date of
     birth; her fee is unchanged.
  5. The 2026-07-27 band reading is carried forward as D29's default (ASA, BMI, pre-assessment with
     PA5 stacking), in one rule module; the age band is now pre-applied (removable).
  6. The 2026-07-28 modifier picker shape (segmented bands plus "Also applies" chips) is superseded by
     the itemised Modifiers section and the picker with the inline explanation.
  7. Modifiers are itemised records, pre-applied ones derived with removals stored (DM-44); no modifier is locked (D43 superseded in part, D29 narrowed, 20 October); the M total is 19a's starting value
     plus the itemised list; a claimed modifier needs a short explanation at claim time, with a
     completion backstop.
- **Handoff list:**
  - 20: the Contract pick and code changes call `reconcileClaims`; the anaesthetist's procedure change
    keeps claims that still apply.
  - 21: finishes US-03.6.1 around the explanation rule this phase added; the review screen shows the
    itemised modifiers with their explanations.
  - 23: reads `resolveModifiers(...).units` (pre-applied and claimed) for the 3/2/2 split, from the primary.
  - 24: decides whether a Contract line's modifier units replace the itemised total ("some Contracts
    zero modifiers"); a fixed price ignores modifiers for price.
  - 25: snapshots `modifierItems` (codes, units, explanations, origins) and the starting value's
    layer.
  - 42: loads Vanessa's list and the RVG table from spreadsheets through the same `Modifier` shape and
    the band table; edits AA rows.
  - 43: the generator builds claims through `applyClaim`, with explanations, never a second shape.
  - OQ-95's answer: a change to `AGE_BANDS`, `MODIFIER_BANDS`, the `noAgeModifier` flag or `PRE_APPLY_MODIFIERS`, and the
    provisional note.
