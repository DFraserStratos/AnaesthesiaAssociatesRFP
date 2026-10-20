# Phase 40a · NHI lookup and identity standards

**Requirements covered:**
[FT-14.4](../../../../requirements-board/requirements/stories/FT-14.4.md) NZ identity standards (Proposed, Partial; the NHI and HPI CPN parts, with "HPI number" now **HPI CPN**; unchanged by the 2026-10-08 update) ·
[US-14.4.1](../../../../requirements-board/requirements/stories/US-14.4.1.md) NHI lookup via Digital Services Hub (Proposed, Partial; the HPI CPN wording, and the note that the NHI can be refreshed from the central register, with hospitals getting updates twice a day; unchanged by the 2026-10-08 update).
**Re-planned for catalogue `d4db277`.** Neither covered item changed. The add-booking form it works
in did: an assigned List is ACTIVE, the sheet opens on the manual form, the RVG code is picked by
**type-ahead** (19), hand-entered procedure text is kept as **source text** (20a, no "As given"
field), 21's payer on the Booking is prefilled from the patient, and the **NHI is required** (D11
answered: no Booking without one, no provisional patient, no "NHI pending", 40). Treated here without
closing it: [DM-30](../analysis/domain-model-delta.md#dm-30) (its sentence "The NHI can be refreshed
from the central register" only; the rest is Phase 40's).
Read alongside (not closed here):
[US-11.1.2](../../../../requirements-board/requirements/stories/US-11.1.2.md) (dual-format NHI validation; its testing note puts "NHI lookups via the Hub" in the dual-format regression set; the validators screen stays where Phase 34 put it),
[US-11.1.1](../../../../requirements-board/requirements/stories/US-11.1.1.md) (ethnicity coded to NZHIS Level 4: Phase 40's; its NHI-mandatory note is settled by OQ-49),
[US-11.1.5](../../../../requirements-board/requirements/stories/US-11.1.5.md) (intake rows waiting for an NHI: Phase 40's view; a typed or looked-up NHI is how a row gets one),
[US-12.1.4](../../../../requirements-board/requirements/stories/US-12.1.4.md) (the anaesthetist's HPI CPN, Phase 26),
[US-13.6.2](../../../../requirements-board/requirements/stories/US-13.6.2.md) (the surgeon's HPI CPN, Phase 17; its pairing-preferences change is 17's and does not touch the HPI CPN),
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) (the payer on the Booking, prefilled from the patient and editable to a parent or guardian: Phase 21's; the lookup fills the patient the payer is prefilled from),
[US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md) (Add a Booking manually, with hand-entered procedure text kept as source text: 20a's form, which this phase extends),
[FT-07.1](../../../../requirements-board/requirements/stories/FT-07.1.md) (the List states DRAFT, ACTIVE, SUBMITTED, AUTHORISED: an assigned List is ACTIVE, 15b; a Draft List has no anaesthetist, 31),
[OQ-52](../../../../requirements-board/requirements/questions/OQ-52.md) (Answered 2026-10-01: one identifier, called the HPI CPN),
[OQ-30](../../../../requirements-board/requirements/questions/OQ-30.md) (Answered: no PII and no NHI in Xero, only a unique ID),
[OQ-49](../../../../requirements-board/requirements/questions/OQ-49.md) (Answered 2026-10-16 and 2026-10-19, owner decision **D11**: the NHI is mandatory. A Booking cannot be saved without one, and an incoming row without one waits on the matching screen's unmatched queue; 33 parks such rows and 40 makes the NHI required on every form. The lookup is how the NHI is filled on the add-booking forms; when the Hub is down the form falls back to manual entry, and the typed NHI must still be valid before Save),
and points 23 and 26 of
[the 2026-10-01 meeting note](../../../../requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md)
(the register refresh and the twice-daily hospital cadence; the HPI CPN naming).
No open question is linked to either covered item.
**Depends on:** 26 (the anaesthetist profile: `hpiId` labelled "HPI CPN", office-edited with 17's
checks, shown on the mobile and web Profile) and 40 (the patient record at `/admin/patients/:patientId`,
`detailDifferences` in `src/domain/patients/patientDetails.ts`, `store/patientActions.ts`,
`buildNhiIndex`, `store/patientSelectors.ts`, the NHI required on every form with no provisional
patient, and the office's view of intake rows waiting for an NHI with its add-the-NHI entry). By the roadmap
order 14 (the trigger registry, `useDemoTriggerContext`, `OFFICE_ACTOR`, the PWA demo-actions sheet),
15 (`ManualBookingForm`, `AddBookingFlow`, `createBooking`), 15b (the Add a booking sheet opens
straight on the manual form, with no chooser and no "Enter manually"; the photo flow kept at most as a
badged Future-scope demo; an assigned List's state renamed DRAFT to **ACTIVE**), 17 (`normaliseHpiCpn`,
`isPlausibleHpiCpn` in `src/domain/surgeons.ts`, the "HPI CPN" field label, the surgeon profile), 19
(the optional RVG code picked by type-ahead in the form, reworked `CodePickerSheet`), 20a (the form's
**"Procedure description"** field, `data-shot="procedure-description"`: hand-entered text kept as
source text, verbatim),
21 (`Booking.payer`, a `BookingPayer` prefilled from the chosen patient with "Someone else"
inline in `ManualBookingForm` and `PhoneAdviceBooking`, `PayerSheet`, `setBookingPayer`; the old
billing route select and billable-party fields are gone), 33 (rows without an NHI wait in the
unmatched queue), 28 (seeded List ids keep the
`L-<reg>-<date>-<AM|PM>` form through `projectedListId`, so the routes below hold; it adds no "Open"
label), 31 (Draft Lists, state DRAFT, which have no anaesthetist), 34 (the Future-scope HL7/FHIR
surface and surgeon PDF ingest, the reworded Integrations callout, and `DemoSettings.autoMatchDemo` with
`setAutoMatchDemo`, audited `demo.autoMatch`: with Phase 10's `failNextHandoff` and `armHandoffFault` in
`store/demoSettingsActions.ts`, the precedent for demo switches) and 38a (the search field on the mobile Lists tab and the web Lists page)
have also run.
**Estimated:** 1 session. If it runs long, stop after work item 7 (pure modules, the Hub stub,
the store action, tests green with the UI edited only to compile) and do items 8 to 16 in a short
second sitting; record the split in the PROGRESS entry if the mapping shows it will not fit (no
plan-approval stop).

## Goal

The NHI lookup on Add booking is the prototype's oldest stand-in. `lookupNhi` in
`src/domain/nzhis.ts` knows six canned patients. Any other valid NHI reads "Not found in this demo's
records", and an NHI with a wrong check digit or an I or O also reads "Not found", because nothing
validates the NHI until Save. The lookup never fails, never waits, and never says what the NHI is for.
There is no way to refresh a patient from the register. The HPI CPN, which Phases 17 and 26 named on
the surgeon and anaesthetist records, appears nowhere in the booking or lookup flow.

This phase:

- **validates the NHI as it is typed** on every add-booking flow (mobile List, web List and Admin phone
  advice, which all use `ManualBookingForm`; the Future-scope photo demo's review form, where 15b kept
  it, reuses the same form and inherits the change with no extra work). An I or O is flagged at
  once, and a wrong check digit or check letter as soon as the seventh character lands, with
  `validateNhi`'s own reason. Look up stays disabled until the NHI is valid, so **an invalid NHI is never
  sent to the Hub**;
- replaces the six canned patients with a **deterministic synthetic NHI register**: every seeded
  patient with an NHI, a few named register-only people for the script (one in the new format), and a
  generated pool of people who are not AA patients yet. A valid NHI that is not on the register gets a
  proper "not on the register" answer;
- adds **Hub states**: checking, slow (with "Stop waiting and enter by hand"), and unavailable (with
  Retry and the manual-entry fallback, and Save still works). A demo trigger sets the simulated Hub to
  Available, Slow or Unavailable;
- states the **purpose** wherever the NHI is looked up: "Looked up on behalf of Dr Melanie Souter (HPI
  CPN 10SOUM), only to identify this patient. Health Information Privacy Code 2020.";
- lets the office **refresh a patient from the register** on Phase 40's patient record. Missing fields
  are filled, differences are offered as a Keep or Use register choice (Phase 40's rule: nothing is
  written over the record without a choice), and the record is stamped **"Last refreshed"** from the
  demo clock;
- makes **HPI CPN** the one label and one format wherever a practitioner identifier shows, including
  the new lookup purpose line and the Future-scope FHIR pane.

**The form it works in** is the `d4db277` one, already built by earlier phases: Add a booking on an
**ACTIVE** List (15b; no "Open" label, no DRAFT state on an assigned List) opens straight on the
manual form; the RVG code is an optional **type-ahead** (19), beside 20a's **Procedure description**
(typed text kept as source text); 21's **payer on the Booking** sits in the same form, prefilled from
the patient; and the **NHI is required** (D11, 40): Save is refused without a valid one. The lookup
fills the patient (and the NHI field itself in S2's empty-NHI prefill), so the payer follows it while
the payer is "The patient", and a payer already changed to someone else (a guardian) is never
overwritten. The lookup touches nothing else: not the RVG code, the procedure text or the Contract.
On a Draft List (31, no anaesthetist), where the office adds Bookings, the purpose note names "the AA
office". Tests, the checklist, the recipes and the PWA parity check all run on an ACTIVE List.

New stored state is small: `DemoSettings.nhiHubMode` (optional; absent reads as Available) and
`Patient.registerRefreshedAtISO` (optional, unseeded). The register is not app state. It stands for an
external system, so it is built from the seed by a pure function and never persisted.

## Before you start: drift check

1. Diff the covered and read-alongside items against the plan's snapshot (catalogue commit `d4db277`;
   the tool is rename-aware, so never a plain git diff of the catalogue folder):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff FT-14.4,US-14.4.1,US-11.1.2,US-11.1.1,US-11.1.5,US-12.1.4,US-13.6.2,US-11.2.2,US-02.4.1,FT-07.1,OQ-52,OQ-30,OQ-49
   ```

   Read the hunks, and the domain-model lines on the NHI, the register refresh, the payer on the
   Booking and the HPI CPN glossary row. (This doc is current at `d4db277`: neither covered item
   changed and both are still **Proposed** with no OQ linked; OQ-49 is answered, so D11 is built, not
   a default; the add-booking form is as the Goal describes.)
2. If an item changed after `d4db277`, re-read it in full and adjust the work items. Specifically:
   - **NHI rule.** If the NHI stops being mandatory, or a blank or pending NHI becomes allowed again,
     stop and tell the owner: the form's validation and Save gate follow 40's required NHI.
   - **Refresh cadence.** If US-14.4.1 now asks for an automatic refresh on a schedule (the
     "twice a day" note becoming a rule), keep work item 6's action. Add a "Run register refresh"
     demo trigger on Admin · Patients that runs it over every patient with an NHI, not a timer, and
     record the reading.
   - **HPI CPN validation or lookup.** If FT-14.4 or US-14.4.1 now asks the system to validate an HPI
     CPN's check character or look practitioners up on the HPI, stop and tell the owner. The check
     algorithm is not in the catalogue or the RFP. Guessing one would misstate a Health NZ standard in
     front of the client, and it would rewrite every seeded identifier.
   - **Purpose wording.** If the catalogue now gives the purpose statement's text, use it verbatim in
     work item 4's single constant.
   - **Lookup on other surfaces.** If the catalogue now asks for the lookup on the Admin Intake
     matching screen, add it to work item 9's list of surfaces that use the shared hook. Do not add a
     second lookup implementation.
3. If a covered item is now Retired or Future, drop its work items and say so in the PROGRESS entry.
   If US-14.4.1 alone went Future, keep work items 1 and 11 (validation as typed and HPI CPN
   consistency, which FT-14.4 and US-11.1.2 still need) and drop the rest.
4. **Open questions: none block this phase.** One build default stands (not an answered question),
   recorded in PROGRESS, listed under "For the owner's review" and shown once in the UI with the small
   neutral "Provisional" pill (tooltip naming the point). The register refresh is **on demand, per
   patient, by the office**, with no scheduled job. The twice-daily cadence is a note about hospitals,
   not an acceptance criterion. The pill sits beside the refresh button: "On demand, to confirm with
   AA".
5. **Prerequisite names.** Confirm Phases 26 and 40 are DONE in PROGRESS.md, then read their handoff
   notes and name maps and the entries for 14, 15, 15b, 17, 19, 20a, 21, 28, 31, 33, 34 and 38a. Wherever
   this doc names a planned symbol, use the real one:
   - **15b, 19, 20a, 21:** how `AddBookingFlow` opens now (no chooser, no "Enter manually"; the
     `initialMode` prop and whether the Future-scope photo demo survived), the RVG type-ahead row, the
     "Procedure description" field and its `data-shot`, and the payer block in `ManualBookingForm` and
     `PhoneAdviceBooking` (`Booking.payer`, `BookingPayer`, the "The patient" / "Someone else" choice,
     `setBookingPayer`, and how the form keeps the payer in step with the chosen patient). Note the
     form's section order now, so the lookup's status line and purpose note stay in the patient
     section's caption slot;
   - **28, 31:** that Dr Souter's Tue 21 Jul PM List (`L-34821-2026-07-21-PM`) is ACTIVE after reset,
     how a Draft List is reached in Admin and whether Add booking opens on it (31's surface), and that
     no "Open" label exists for an assigned List;
   - **40 (and 33):** the patient record route and screen, the Details card and `EditPatientSheet`
     additions, how the form requires the NHI and what Save says without one, the office's view of
     rows waiting for an NHI and its add-the-NHI entry (the surface item 9 puts the register read on),
     `detailDifferences` (its field union and comparison rules), `patientActions.ts`,
     `patientSelectors.ts` (`patientRecordView`), `mergedPatientTarget`, the `ACTION_LABELS` entries it
     added, whether it widened the ethnicity set beyond `ETHNICITY_DEMO_SUBSET`, and which NHIs its and
     33's intake fixtures use (item 2 reserves them);
   - **26:** the Profile screens on mobile and web, how they show the HPI CPN, the Admin anaesthetist
     editor header line ("Registration 34821 · HPI CPN 10SOUM"), and whether `hpiId` may be blank;
   - **17:** `normaliseHpiCpn`, `isPlausibleHpiCpn`, the `hpiId` field label, and the surgeon
     profile's HPI CPN chip and caption;
   - **15:** `ManualBookingForm`, `AddBookingFlow` (with its `manualEmptyLookupPrefill` prop for S2),
     `PhotoCaptureFlow`'s review form if 15b kept it behind the Future-scope demo (if 15b deleted it,
     drop it from this doc's surface list), and `createBooking`;
   - **14:** the `DemoTrigger` contract, `DemoContextValues`, `useDemoTriggerContext`, the PWA sheet's
     reachability while a bottom sheet is open, and `src/store/demoActors.ts`;
   - **34:** where `autoMatchDemo` and `setAutoMatchDemo` live (with Phase 10's `failNextHandoff` and
     `armHandoffFault` in `store/demoSettingsActions.ts`, the precedent for `nhiHubMode`), the reworded
     Keycloak and Hub callout, and the Future-scope surface's path (`src/apps/demo/futureScope/`);
   - **38a:** the search field components on mobile and web and `parseBookingQuery`;
   - the current `PERSIST_VERSION`.
6. Record the result (changed items against `d4db277`, the provisional reading, the real names) in
   the PROGRESS entry.

## Reference

**Design files** (convention 17: authoritative):
- [Design Language.dc.html](../../../design/Design%20Language.dc.html): tokens, the semantic
  `error` tint for a failed check, `warning` for the Hub unavailable and slow states, `success` for a
  found person, the field caption type, Spline Sans Mono with tabular numbers for the NHI and the HPI
  CPN, the amber demo badge, and teal `#0D6E63` as the only action colour (Look up, Retry, Refresh from
  NHI register, Apply). No crimson on any new surface.
- [Mobile App.dc.html](../../../design/Mobile%20App.dc.html): the Add booking bottom sheet and the
  field anatomy. The status line sits under the NHI field in the caption slot, never in a modal.
- [Admin Day.dc.html](../../../design/Admin%20Day.dc.html): the List drawer the phone-advice booking
  opens from.
- [Admin Review.dc.html](../../../design/Admin%20Review.dc.html): the table anatomy the refresh
  differences table extends (it is Phase 40's Details differ table, reused).
- No mockup draws the Hub states or the refresh. Extend the field caption pattern, the existing
  `Callout`, and Phase 40's Details differ table. Do not invent a new visual language.

**Catalogue items:** the two covered above, plus the read-alongside list. The catalogue images for
US-14.4.1 (`web-nhi-lookup.png`, `mobile-nhi-lookup.png`) are screenshots of the **old** prototype
(an "Enter manually" chooser step, the billing route select and a six-patient stub, no required NHI). They show where
the lookup sat, not what the story requires; this phase's capture step replaces them.

**Analysis files:**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Summary theme 9 (it lists US-14.4.1 and FT-14.4), the
  "Demo-trigger buttons" list (Hub Available, Slow, Unavailable), "Remove or rework" (the stale
  "HPI id" copy), and the EP-14 table; per-gap detail in [epics/EP-14.md](../epics/EP-14.md#us-14.4.1)
  (US-14.4.1, FT-14.4).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-30.
- [analysis/prototype-map-shared.md](../analysis/prototype-map-shared.md) (the add-booking flows),
  [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md) (the patient seed,
  `slotRng`, persistence), [analysis/prototype-map-admin.md](../analysis/prototype-map-admin.md) (the
  List drawer and phone advice, the anaesthetist editor) and
  [analysis/prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) (the PWA
  closure and `pwaPurity.test.ts`).

**Code entry points** (names and lines at the plan update; Phases 15b to 40 move many of
them, so use the real ones from their PROGRESS entries):
- The canned lookup: `aa-prototype/src/domain/nzhis.ts:81-119` (`NhiLookupHit`, `CANNED_PATIENTS`,
  `lookupNhi`). The ethnicity half of the file (`ETHNICITY_DEMO_SUBSET`, `validateEthnicityCode`)
  stays.
- The validator: `aa-prototype/src/domain/nhi.ts` (`validateNhi` :54 with its verbatim reasons,
  `generateNhi` :133, `NHI_ALPHABET`). It is the one validator; nothing here adds a second regex.
- The form: `aa-prototype/src/shared/flows/ManualBookingForm.tsx`: `runLookup` :78 (with the S2
  empty-NHI prefill branch), the NHI field :149, the Look up button :151 and the `DemoBadge` "NHI FHIR
  lookup · Digital Services Hub" :155, and `save` (`createBooking` :111, which still refuses an invalid
  NHI through `upsertPatient`, `store/intake.ts:52`, the `validateNhi` refusal at :61). At the plan
  update the form still has the billing route select and `billablePartyId` (:44, :69, :124, :235);
  21 replaces them with the payer block, 19 the "Procedure code" select with the type-ahead, 20a
  adds the source-text Procedure description and 40 requires the NHI, so read the form as those
  phases left it.
- Its hosts: `shared/flows/AddBookingFlow.tsx` (the chooser at :105 goes in 15b);
  `shared/flows/PhotoCaptureFlow.tsx` (the review form, Future scope after 15b if kept; its 900 ms
  "processing" `setTimeout` at :29 is the UI-timer precedent, and if 15b deleted the file,
  `officeSimulation`'s delay is the one left); `shared/flows/sampleExtractions.ts` (a comment that names
  the canned lookup, if it survives 15b); `apps/web/screens/ListDetailView.tsx:257`;
  `apps/mobile/routes.tsx:137`; `apps/admin/flows/PhoneAdviceBooking.tsx` (`PHONE_ADVICE_LOOKUP_PREFILL`
  with `DEM1239` :28, passed at :101), opened from `apps/admin/components/ListDrawer.tsx`.
- Seed: `domain/seed/patients.ts` (`PINNED`, the comment naming "the five canned lookupNhi patients"
  :72, `FIRST_NAMES`, `SURNAMES`, `GENERIC_COUNT`, `buildPatients(seed)` with
  `slotRng(seed, 'patients')`); `domain/seed/index.ts` (`SEED = 20260721` :85, `buildPatients(SEED)`
  :393); `domain/seed/slotHash.ts` (`slotRng`).
- Types: `domain/types.ts` (`Patient` :103, `Anaesthetist.hpiId` :149, `DemoSettings` :896).
- HPI display sites: `shared/audit/fieldLabels.ts:125` (17 relabels it); `apps/admin/flows/
  AddAnaesthetistFlow.tsx:72` and `EditAnaesthetistSheet.tsx:61` ("HPI {id} or 'not set'"; 26 reworked
  both); `apps/demo/DemoIntegrations.tsx:54` and the callout at :315-322 ("provider identity carries
  the HPI"); `domain/integrations/messages.ts:47, :256` (a message description naming "the
  anaesthetist HPI"); `domain/integrations/fhir.ts:20, :151, :203-237` (`HPI_SYSTEM`, the Practitioner
  identifier, `practitionerHpi`; the system URL is a standard and stays).
- Clock and persistence: `store/mutate.ts` (`clockISO`), `store/appStore.ts:136` (`PERSIST_VERSION`; later phases bump it), `store/persistMigrate.test.ts`.
- PWA boundary: `src/pwa/pwaPurity.test.ts` (`FORBIDDEN`: `apps/web`, `apps/admin`, `apps/demo`, the
  harness shell); `src/pwa/officeSimulation.ts:46` (its note on a UI-layer `window.setTimeout`).

## Work items

1. **Validation as typed** (`src/domain/nhi.ts`; pure, Vitest beside it).
   - `nhiEntryFeedback(input)` returns `{ state: 'empty' | 'incomplete' | 'invalid' | 'valid';
     normalised; format?: NhiFormat; reason?: string }`, built on `validateNhi` only:
     - empty or whitespace: `empty`;
     - an I or O anywhere, at any length: `invalid` with `validateNhi`'s I and O reason, at once.
       `validateNhi` checks length first, so for a short input it returns the length reason instead:
       export its reason strings from `nhi.ts` as one `NHI_REASONS` constant that both functions use
       (no copied text, no second regex);
     - fewer than 7 characters otherwise: `incomplete` (no message; the field caption shows the shape
       hint "7 characters, AAA1234 or AAA12AB");
     - 7 characters: `validateNhi`'s verdict (the check digit, the check letter, remainder 0, the
       shape), with its reason verbatim;
     - more than 7: `invalid`, "An NHI is exactly 7 characters.".
   - Tests (the dual-format regression set US-11.1.2 names, for this path): `ZAA0067` valid current;
     `ZAA0068` "The check digit does not match."; `ZBX41AL` valid new; `ZBX41AM` "The check letter does
     not match."; `ABI` invalid at three characters; `zaa0067 ` normalises; `ZAA006` incomplete;
     `ZAA00671` invalid; every reason equals `validateNhi`'s for the same 7-character input.

2. **The synthetic NHI register** (pure builder in `src/domain/nhiRegister/`, fixtures and accessor in
   `src/domain/seed/nhiRegister.ts`; no store import; covered by `domainPurity.test.ts`).
   - `NhiRegisterPerson { nhi; name; dobISO; phone?; address?; ethnicityCode; format: NhiFormat }`.
     This is what the simulated Hub returns, a subset of a FHIR Patient. It never holds an AA id.
   - `buildNhiRegister({ seed, seededPatients, registerOnly, updates, poolCount }):
     ReadonlyMap<string, NhiRegisterPerson>`, in this order:
     - **mirror** every seeded patient that has an NHI, with exactly its name, DOB, phone, address and
       ethnicity (so a lookup or refresh of an untouched patient shows no change). This includes
       any earlier record 40 appended (Noah Prescott, `ZAP3016`, if it survives), so item 9's
       waiting-row check finds him;
     - **apply `updates`** (the register knows something AA does not yet):
       `NHI_REGISTER_UPDATES = { ZAM1098: { name: 'Fiona Tamihana', address: '5 Kowhai Lane, Halswell,
       Christchurch' } }`. Fiona Gray (`PAT.gray`, PT0018) took her married name, which is the
       duplicate risk Greg raised (note point 23). Her record has no address, so the address is an
       enrichment and the name is the one real difference;
     - **add `registerOnly`**, the named people the script uses, who are not AA patients:
       - `ZBR4417` Mereana Tipene, 1981-03-09, ethnicity 21111;
       - `ZBT2253` Lucas Brennan, 1994-08-15, 11111;
       - `ZBX41AL` Ana Fifita, 1977-12-02, 33111 (new format);
       - `DEM1239` Demo Patient, 1990-01-01, phone "021 555 0190", 11111. This is S2's phone-advice
         person, kept exactly as the canned entry had it.
       All four were checked valid with `validateNhi`, and absent from `buildPatients(SEED)`, at plan
       time. The seed test re-asserts both;
     - **generate the pool**: `NHI_REGISTER_POOL_COUNT = 240` people from a **new** RNG stream,
       `slotRng(seed, 'nhi-register')`, reusing `FIRST_NAMES`, `SURNAMES` and the ethnicity set
       (export the two name arrays from `patients.ts` without reordering them; exporting moves no draw).
       Roughly one in nine is new format. NHIs are regenerated on collision with anything already in
       the map. Also exclude a reserved set: `ZBW6638`, the script's "valid but not on the register"
       example, plus any NHI in Phase 33, 34 or 40's intake fixtures (the rows waiting for an NHI and their arrivals), so those keep
       the outcomes their phases scripted.
   - `nhiRegister()` in `src/domain/seed/nhiRegister.ts`: memoised once from `SEED` and
     `buildPatients(SEED)`. This is the only accessor. The register is never put in the store, never
     persisted, and never touched by reset.
   - Tests: two builds deep-equal; size is mirrored + 4 + 240; every NHI is valid and unique; every
     seeded patient with an NHI resolves to its own details except Fiona Gray; Fiona resolves to the
     update; the four register-only NHIs are present and held by no seeded patient; `ZBW6638` and the
     reserved NHIs are absent; building it does not change `buildPatients(SEED)` (deep-equal before and
     after, so no existing draw moved).

3. **Lookup and refresh rules** (`src/domain/nhiRegister/lookup.ts`, `refresh.ts`; pure, tested).
   - `lookupOnRegister(register, input)` returns `{ kind: 'invalid'; reason } | { kind: 'found';
     person } | { kind: 'notFound'; nhi }`. It validates first with `validateNhi`, and an invalid input
     never reads the map.
   - `registerDifferences(patient, person)` returns `{ differences; enrichments }`. Differences come
     from Phase 40's `detailDifferences` (name, DOB, phone, address; email is not on the register),
     plus `ethnicityCode` compared exactly. Enrichments are fields the record lacks and the register
     has, following 40's rule that filling an empty field is enrichment, not a difference.
   - **Remove** `lookupNhi`, `NhiLookupHit`, `NhiLookupMiss`, `NhiLookupResult` and `CANNED_PATIENTS`
     from `nzhis.ts`, and rewrite its header so it covers ethnicity only. Grep gate:
     `lookupNhi|CANNED_PATIENTS|Not found in this demo's records` returns nothing in `aa-prototype/src`
     or `aa-prototype/visual`. That includes the tests: `domain/nzhis.test.ts`'s `lookupNhi` block and
     `domain/seed/seed.test.ts`'s `lookupNhi` import move to `lookupOnRegister` over `nhiRegister()`,
     keeping what they asserted (CQY9304, MYY54SL and DEM1239 found with the same details; normalised
     input; `ABC1234`, which fails the check digit, now `invalid` with that reason rather than a miss).
   - Tests: found in both formats; not found for `ZBW6638`; invalid for `ZAA0068` with the reason;
     Fiona Gray gives one difference (name) and one enrichment (address); Sarah Mitchell gives neither;
     an ethnicity mismatch is a difference.

4. **The simulated Hub** (`src/shared/nhiHub/`; no import from `src/apps/*` or `src/shell/*`, so
   `pwaPurity` holds; its own `index.ts`, not re-exported from the `src/shared/index.ts` component
   barrel, the same rule as 14's registry).
   - `types.ts`: `NhiHubMode = 'available' | 'slow' | 'unavailable'` (re-exported from
     `domain/types.ts` for `DemoSettings`).
   - `hub.ts`: `askHub(mode, register, input): HubAnswer` is pure. It is `invalid` (never sent),
     `unavailable` (in that mode, for a valid NHI), or `lookupOnRegister`'s `found` or `notFound`. The
     `slow` mode answers like `available`; only the presentation differs.
   - `timing.ts`: `HUB_TIMING = { answerMs: 600, slowAnswerMs: 6000, slowNoticeMs: 1500 }`.
   - `useNhiHubLookup({ timing? })`: a hook with the states `idle | checking | slow | found | notFound
     | unavailable | invalid`. `lookup(input)` reads `settings.nhiHubMode` from the store at call
     time, computes the answer at once with `askHub`, and reveals it after the mode's delay. `slow`
     passes through after `slowNoticeMs`. It also has `cancel()` ("Stop waiting and enter by hand"),
     `retry()` and `reset()`. Every lookup carries a request token. A new `lookup`, a `reset`, an NHI
     edit or an unmount discards a pending answer, so a stale result never fills the form.
   - **Reading of the plan's "delays on the demo clock" risk.** The Hub's answer and everything stored
     come from pure functions and the demo clock. The only wall-time element is the visible wait: a
     UI-layer timer of the same kind as `PhotoCaptureFlow`'s 900 ms step and `officeSimulation`'s
     delay. Domain code never reads it, and Vitest passes `timing` with zeros (or uses fake timers). If
     the owner wants Slow tied to the demo clock instead (answering only on a clock advance), that is a
     one-place change in the hook. Record the reading.
   - `NhiLookupStatus.tsx`: one caption-slot status line for every state, used by every surface in
     items 8 and 9:
     - checking: "Checking the NHI register";
     - slow: "The Hub is slow to answer. Keep waiting, or stop and enter the details by hand." with a
       "Stop waiting" link;
     - found: "Found Mereana Tipene on the NHI register. Details pre-filled, still editable." plus "New
       format NHI" when the format is new;
     - notFound: "No one with NHI ZBW6638 is on the NHI register. Check the number, or enter the details
       by hand.";
     - unavailable (warning tint): "The Digital Services Hub is not answering. Enter the details by
       hand, or try again." with a teal Retry;
     - invalid (error tint): the reason, verbatim.
   - `NhiPurposeNote.tsx` and the constant `NHI_PURPOSE_TEXT`: "Looked up on behalf of {practitioner},
     only to identify this patient. Health Information Privacy Code 2020." The practitioner reads "Dr
     Melanie Souter (HPI CPN 10SOUM)" through item 11's formatter. With no anaesthetist (a 31 Draft
     List) or a blank HPI CPN it reads "the AA office" or the name alone. Small shield icon, caption
     type, neutral slate.
   - Tests (`hub.test.ts`, `useNhiHubLookup.test.ts` with `renderHook`): each mode and answer; an
     invalid NHI returns `invalid` in every mode; the stale-answer race (lookup A, then lookup B, then A's
     timer fires, and only B shows); cancel and retry; unmount clears timers.

5. **Model, demo switch and persistence.**
   - `DemoSettings.nhiHubMode?: NhiHubMode`, where absent reads as `available` (the precedent of
     Phase 10's `failNextHandoff` and 34's `autoMatchDemo`). It is demo scaffolding, not AA configuration, so it does not go in Phase 40's
     `appSettings`. Reset clears it.
   - `setNhiHubMode(api, actor, mode)` in `store/demoSettingsActions.ts` beside `armHandoffFault` (or
     beside 34's `setAutoMatchDemo` if 34 put it elsewhere; real file from 34's entry), through
     `mutate()`, audited the same way 34 audits its switch (`demo.nhiHubMode`, before and after). It refuses an unknown mode.
   - `Patient.registerRefreshedAtISO?: string` (unseeded), with a doc comment saying it is stamped by
     the office's refresh from the demo clock.
   - `Patient`'s doc comment gains one line: "Identity is looked up and refreshed against the NHI
     register through the Digital Services Hub (simulated: `src/shared/nhiHub`)."
   - Neither field is seeded, so the seed's content does not change. Check whether anything else in
     this phase changes it. If it does, bump `PERSIST_VERSION` by one and extend
     `persistMigrate.test.ts`. Either way, add a migrate test that persisted state without
     `nhiHubMode` loads as Available.

6. **Refresh from the register** (the store action in 40's `store/patientActions.ts`, the selector in
   40's `store/patientSelectors.ts`; US-14.4.1 note, DM-30).
   - `registerRefreshPreview(state, patientId)`: `{ kind: 'noNhi' } | { kind: 'notOnRegister'; nhi } |
     { kind: 'ready'; person; differences; enrichments; lastRefreshedAtISO? }`. The patient is resolved
     through `mergedPatientTarget`.
   - `refreshPatientFromRegister(api, actor, patientId, choices: Record<field, 'keep' | 'useRegister'>)`:
     - Office only: 14's `OFFICE_ACTOR` role. It refuses an anaesthetist ("The office refreshes patient
       details from the NHI register."), Hub mode `unavailable` ("The Digital Services Hub is not
       answering. Try again later."), no NHI ("Attach an NHI first."), an NHI not on the register
       ("No one with this NHI is on the NHI register."), and a choice for a field that is not a current difference.
     - The store re-reads the register itself through `nhiRegister()`, so the UI cannot inject data.
     - One `mutate`: apply every enrichment, apply each difference whose choice is `useRegister`
       (missing choices default to `keep`, Phase 40's default), and stamp `registerRefreshedAtISO` with
       `clockISO`. Audit `patient.registerRefreshed` with before and after for each changed field and
       `after.registerRefreshedAtISO`, `source: 'register'`. With nothing to change it still stamps and
       audits, with "no changes" in the after.
     - It never touches Xero, the ledger or any Booking (OQ-30: no PII in Xero). Bookings show the new
       name because they reference the patient id.
     - It does not touch Phase 40's `pendingDetails`. Those came from a hospital or surgeon and keep
       their own review.
   - Tests (`patientActions.test.ts`): Fiona Gray with `name: 'useRegister'` becomes Fiona Tamihana with
       the Halswell address and the stamp at `2026-07-21T08:00:00` (`clockISO`'s form); with `keep` only the address is added; a
       second refresh is "no changes" with a new stamp after a clock advance; an anaesthetist, an
       unavailable Hub, a patient with no NHI, `ZBW6638` and a stray choice are each refused and leave
       state deep-equal; no Xero, ledger or Booking slice changes; the audit shape.

7. **Session checkpoint.** Build, PWA build and Vitest green, with the form edited only to compile
   (it now calls the hook in place of `lookupNhi`). Record the counts.

8. **The add-booking flow** (`ManualBookingForm`, shared by mobile and web Add a booking, Admin phone
   advice and, if 15b kept it, the Future-scope photo demo's review; surgeon PDF ingest is Future scope
   after 34 and gets nothing new). The form is the `d4db277` one: Add a booking opens straight on it
   (15b), on an ACTIVE List or, for the office, a Draft List (31), with 19's RVG type-ahead, 20a's
   Procedure description (source text), 21's payer block and 40's required NHI. This item changes only
   the patient section.
   - The NHI field gets `mono`, `autoCapitalize="characters"`, `spellCheck={false}` and
     `autoComplete="off"`. Its caption slot shows the shape hint, `nhiEntryFeedback`'s reason (error
     tint) or "Valid NHI" with the format (success tint, small) as the user types. Editing the NHI
     resets the hook.
   - Look up (teal secondary, as today) is enabled only when the feedback is `valid`, or for S2's empty
     NHI with `manualEmptyLookupPrefill` (kept). The S2 branch does not bypass the Hub: it looks up the
     prefill's NHI (`DEM1239`, valid and on the register) through the same hook, so its Hub states
     apply, and on `found` fills the rest of the prefill as today; when the Hub is Unavailable it shows
     the fallback like any lookup. While checking or slow it shows a small spinner and
     "Checking". `NhiLookupStatus` sits under it.
   - **Found** fills name, DOB, phone if present, and ethnicity, as today, then the S2 prefill branch
     unchanged. Phase 40's "matched existing record" and "details differ" lines and its balance warning
     for the patient paying still appear where 40 put them.
   - **The payer follows the patient, never the other way.** 21's payer block is prefilled from the
     patient. While it is "The patient", a found person becomes the payer's name, with the email from
     the matched AA record if there is one (the register holds no email), through the form's existing
     prefill, not a second path. If the user has already chosen "Someone else" (a guardian), a lookup,
     a second lookup or a Retry never changes it. A found patient under 18 on the List date shows 21's
     mild "Under 18" note on the payer choice, as 21 built it; nothing new is added. The lookup never
     writes the RVG code, the Procedure description or the Contract.
   - **Not found, unavailable, cancelled:** every field stays editable and Save works on the typed
     details, provided the NHI typed is valid (it is required, D11: Save without one, or with an
     invalid one, is refused by 40's gate and `createBooking`, so there is still one gate). A lookup
     never makes the NHI optional, and a found person leaves the typed NHI in the field.
   - `NhiPurposeNote` under the status line, naming the List's anaesthetist (read through
     `listId`), or "the AA office" for a Draft List (31: state DRAFT, no anaesthetist).
   - The `DemoBadge` keeps "NHI FHIR lookup · Digital Services Hub". When `nhiHubMode` is not
     available, a second amber badge reads "Hub simulated as Slow" or "Hub simulated as Unavailable",
     so a presenter is never surprised by a mode left on.
   - `AddBookingFlow` calls `useDemoTriggerContext('nhiHub.inUse', true)` while open (add the key to
     `DemoContextValues`).
   - `data-shot` hooks: `nhi-lookup` (the block), `nhi-lookup-status`, `nhi-purpose`.
   - Component tests: `ZAA0068` shows the check-digit reason and disables Look up; `ABI` shows the I
     and O reason at once; `ZBR4417` finds Mereana Tipene (zero timing); Unavailable shows Retry and Save
     with a typed valid NHI still creates the Booking, while an empty NHI is refused; Slow shows the notice and Stop waiting cancels; the purpose note names
     "Dr Melanie Souter (HPI CPN 10SOUM)" on her ACTIVE Tue 21 PM List and "the AA office" on a Draft
     List; an NHI edit during checking discards the answer; with the payer left as "The patient",
     `ZBR4417` makes Mereana Tipene the payer, and with the payer already set to "Someone else" (a typed
     guardian), `ZBR4417` fills the patient and leaves the guardian payer exactly as typed; a picked
     RVG code and a typed Procedure description survive a lookup unchanged.

9. **The other places the NHI is entered.**
   - **Patient record** (40's `/admin/patients/:patientId`, the Details card): an **NHI register**
     row reading "Last refreshed 21 Jul 2026, 08:00" or "Not refreshed yet", with a teal secondary
     **Refresh from NHI register** button and the Provisional pill ("On demand, to confirm with AA").
     It is hidden if a record has no NHI (the required NHI makes that rare; 40's view of rows waiting for an NHI covers the rest). A click runs the hook's
     timing and states against `registerRefreshPreview`:
     - "On the register and on this record, nothing to change." with Apply ("Mark refreshed");
     - or Phase 40's Details differ table, extended: columns Field, On this record, On the register,
       and Keep / Use register (default Keep). Enrichment rows read "Will be added", with no choice;
     - Apply calls `refreshPatientFromRegister` and shows the refusal message inline;
     - Unavailable shows the warning line with Retry, and nothing is stamped.
     The panel publishes `nhiHub.inUse` while open. Hook: `data-shot="patient-register-refresh"`.
   - **Rows waiting for an NHI** (40's office view; the add-the-NHI entry, real name from 40's
     entry): under its live validation, the same hook looks the typed NHI up and shows "On the NHI
     register: {name}, {DOB}". If the register's name or DOB differs from the row's, it shows a mild
     warning line: "The register has a different name or date of birth for this NHI. Check before
     adding." It never blocks the add, and the purpose note shows "the AA office". The surface
     publishes `nhiHub.inUse` while open. Adding the NHI stays Phase 40's action, with `buildNhiIndex`
     as the uniqueness check: this phase adds only the register read, never a second add or merge
     path.
   - **38a's search fields** (mobile Lists tab, web Lists page; 38a's handoff): when the query is 7
     characters with no space and `nhiEntryFeedback` says `invalid`, a caption shows the reason
     ("The check digit does not match."). Matching stays exact and nothing calls the Hub (the search is
     over AA's own Bookings).

10. **Register-aware copy around the lookup.**
    - The Keycloak and Hub callout as 34 reworded it, on the Integrations surface and on
      `DemoIntegrations.tsx:315-322`: the NHI lookup is in scope and simulated against a synthetic
      register on every Add booking flow, with its Hub states set from Demo actions. Authenticating to
      the Hub with Keycloak and the FHIR feeds stay Future. "provider identity carries the HPI" becomes
      "carries the HPI CPN".
    - `patients.ts` header and the :72 comment ("the five canned lookupNhi patients") and
      `sampleExtractions.ts`'s comment now name the register.
    - No en or em dashes in any string added or changed.

11. **HPI CPN shown consistently** (FT-14.4; OQ-52).
    - `shared/format.ts`: `HPI_CPN_LABEL = 'HPI CPN'` and `formatHpiCpn(value?)`, which returns
      "HPI CPN 10SOUM" (17's `normaliseHpiCpn` applied) or `null` when blank. Person-identifier
      formatting has one home, next to `drSurname`.
    - Every rendered site uses them. Check 17's and 26's sites (field labels, the Admin anaesthetist
      editor header, Add anaesthetist, the surgeon profile chip, the mobile and web Profile) and change
      only what still differs. Then fix the rest: the Future-scope FHIR pane's Practitioner identifier
      label, the `messages.ts:256` description, and `DemoIntegrations`. `HPI_SYSTEM` and the FHIR
      identifier URL stay: they are the standard's own names.
    - **Check characters.** Phases 17 and 26 deferred "check-character validation and register lookup"
      for the HPI CPN to this phase. This phase **does not build them** and says so in PROGRESS. FT-14.4
      and US-14.4.1 ask that practitioners are *referenced* by HPI CPN, and only patients are looked up
      and validated. The algorithm is in neither the catalogue nor the RFP, and the seeded identifiers
      would all need regenerating. 17's shape check (`isPlausibleHpiCpn`) remains the only check.
    - Grep gate (a Vitest test over `src/**/*.{ts,tsx}` string literals, ignoring `HPI_SYSTEM`, URLs,
      identifiers and comments): no user-visible `HPI id`, `HPI number`, `HPI identifier` or a bare `HPI`
      not followed by ` CPN`.

12. **Demo trigger** (the registry, `src/shared/demoTriggers/registry.ts`; see the next section). The
    body calls `setNhiHubMode` from `src/store`. Add `nhiHub.inUse` to `DemoContextValues`. Nothing is
    added to the Control Panel page; its index lists the entry under its screens.

13. **PWA parity check.** On the PWA, open Dr Souter's ACTIVE Tue 21 Jul PM List
    (`/mobile/lists/L-34821-2026-07-21-PM`), then Add a booking, which opens straight on the manual
    form (15b): the demo chip offers the Hub entry. Run Unavailable, then Look up, and the fallback shows. If 14's chip
    cannot be reached while the Add booking sheet is open (the scrim), make the PWA chip stack above
    the sheet, as 14's sheet does for other entries, rather than widening the entry's visibility, and
    record which was done. Pin visibility in a Vitest test over `demoTriggersFor` (`pwa` surface, with
    and without `nhiHub.inUse` published).

14. **Tests and shots.**
    - Vitest as listed in each item, plus: `pwaPurity` holds (the closure includes `src/shared/nhiHub`
      and `src/domain/seed/nhiRegister.ts` and nothing forbidden); the trigger shows only with
      `nhiHub.inUse` on its routes; `demoScenarios.test.ts` S2's phone-advice path still fills the
      DEM1239 Booking.
    - Existing Playwright specs that drive Look up: `visual/admin-phase06.spec.ts` (the S2 phone-advice
      lookup filling DEM1239, and "generic manual-booking lookup still requires an NHI") still pass with
      the Hub's visible wait, by waiting on values and `data-shot` selectors, never a fixed sleep; re-point
      only what this phase changed (earlier phases own their "Enter manually" and field changes).
    - Playwright: a new `visual/nhi-lookup.spec.ts`, on Dr Souter's ACTIVE Tue 21 Jul PM List. On web
      Add a booking: `ZAA0068` reason, `ZBR4417` found with the payer reading Mereana Tipene, then
      "Someone else" typed as a guardian and a second lookup leaving it, Unavailable through Demo
      actions with Retry, then Available. On the Admin patient record:
      Fiona Gray refresh, Use register for the name, Apply, Last refreshed. Plus a mobile shot of the
      lookup with the purpose note. The PWA device spec runs the Hub entry from the sheet. Wait on
      `data-shot` selectors, never on fixed sleeps.

15. **Demo guide** (see "Demo guide updates"), in the same session.

16. **Finish green:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`.

## Demo triggers

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Hub: Available / Slow / Unavailable (id `nhi-hub-mode`) | Add booking wherever it opens: Mobile · List (`/mobile/lists/:listId`), Web · List (`/web/lists/:listId`), Admin · Day (`/admin/day/:dateISO`, phone advice from the List drawer, and 31's Draft List surface, `/admin/draft-lists`, where the office adds a Booking to a Draft List; real route from 31's entry), plus Admin · Patient record (`/admin/patients/:patientId`, while the refresh panel is open) and 40's rows-waiting-for-an-NHI view while its add-the-NHI entry is open. `when`: `ctx.published['nhiHub.inUse'] === true`, so it shows only while a Hub surface is open | bar and pwa | `choices`: Available, Slow, Unavailable; `setNhiHubMode(api, OFFICE_ACTOR, choice)` (14's `demoActors.ts`, as `arm-handoff-fault` does; there is no exported `DEMO_ACTOR`). `disabledReason` "Already set" for the current mode. Message: "The simulated Hub now answers as Unavailable. The next lookup shows the manual fallback." It stays set until changed or Reset, and the form's badge shows it |
| (product, no trigger) Refresh from NHI register | Admin · Patient record | none | A product button over the Hub stub. Fiona Gray's register record already carries her married name and address (`NHI_REGISTER_UPDATES`), so the refresh is demoable through normal use. Every other seeded patient refreshes with "nothing to change" |

PWA parity: the mobile beat is the lookup itself, its validation and its Hub states. All of that runs
on the handset, and the Hub entry is in the PWA sheet. Nothing waits on the office, so no office
stand-in is needed. The refresh is office-only (an Admin App action) and has no PWA equivalent, which
is expected.

## Out of scope

- A real Hub call, FHIR Patient read, Keycloak authentication or any network request. The Hub stays
  a badged simulation (convention 4).
- A scheduled refresh (the twice-daily note), and bulk refresh. One office click per patient here,
  provisional.
- Dormant and live NHIs (the register's own merges), NHI changes pushed from the register, and
  merging AA records found to share a person (Phase 40's attach and merge is the only merge).
- Marking an NHI typed while the Hub was down as "unverified". AA has not asked, and the refresh
  covers checking later. Raise it as a discovery point.
- A stored log of every lookup. Lookups are reads and are not stored. Whether HIPC 2020 calls for an
  access log is a discovery point for 43's privacy work.
- HPI CPN check-character validation, an HPI register lookup, and storing the inbound FHIR
  Practitioner HPI (Future, with the FHIR feeds).
- The full NZHIS ethnicity set (Phase 40, US-11.1.1) and the dual-format validators screen (Phase 34,
  US-11.1.2).
- A lookup on the Admin Intake matching screen or in the patient search. Search stays exact over AA's
  own records.
- A full-scale register and timings (Phase 43).
- The rest of the add-booking form: the RVG type-ahead (19), the Procedure description (20a), the payer block and its
  under-18 note (21), and the required NHI itself (D11, Phase 40's guard and waiting-for-NHI view).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Web, Dr Souter, her ACTIVE Tue 21 Jul PM List (`/web/lists/L-34821-2026-07-21-PM`; the
      header shows ACTIVE, never "Open" or "DRAFT"), then Add a booking: it opens straight on the
      manual form. Under the NHI field: the shape hint, the Hub badge, and "Looked up on behalf of Dr
      Melanie Souter (HPI CPN 10SOUM), only to identify this patient. Health Information Privacy Code
      2020." The form's other sections (19's RVG type-ahead, 20a's Procedure description, 21's payer) are as
      those phases left them.
- [ ] Type `ABI`: "The letters I and O are never used in an NHI." shows at once. Type `ZAA0068`:
      "The check digit does not match." shows on the seventh character, and Look up stays disabled.
      Type `ZAA0067`: "Valid NHI".
- [ ] `ZBR4417`, then Look up: "Checking the NHI register" briefly, then "Found Mereana Tipene", with
      name, DOB and ethnicity filled and editable, and the payer block (still "The patient") reading
      Mereana Tipene. `ZBX41AL` finds Ana Fifita with "New format NHI". `ZBW6638` says no one with that
      NHI is on the register, and the details can be typed by hand.
- [ ] Payer, NHI required and the rest of the form: pick an RVG code by type-ahead and type a
      Procedure description, then change the payer to "Someone else" and type a guardian. Look up
      `ZBT2253`: Lucas Brennan fills the patient, and the guardian payer, the RVG code and the typed
      description are unchanged. Save: the Booking has Lucas Brennan as patient and the guardian as
      payer. With the NHI cleared, Save is refused (the NHI is required).
- [ ] With Add booking closed, Demo actions has no Hub entry. With it open: "Hub: Available / Slow /
      Unavailable". Choose Unavailable, then Look up: the warning line with Retry, and the amber "Hub
      simulated as Unavailable" badge. Type the details with a valid NHI and Save: the Booking is created. Choose Slow:
      the slow notice appears, then the answer; Stop waiting cancels it. Choose Available: the badge
      goes.
- [ ] Admin, Day, Tue 21 Jul, Dr Sharma's PM, Book (phone advice), Continue to add booking (the form opens straight
      on manual entry, 15b), then Look up with the NHI empty. The DEM1239 Booking fills as before, the
      payer reads the patient, and the purpose note names "Dr Priya Sharma (HPI CPN 12SHAP)". The saved
      Booking's List is ACTIVE.
- [ ] Admin, a Draft List (31; state DRAFT, no anaesthetist), add a Booking: the lookup works the same
      and the purpose note reads "Looked up on behalf of the AA office".
- [ ] Mobile, Dr Souter's ACTIVE Tue 21 Jul PM List, Add a booking: the same validation, states,
      payer prefill and purpose note in the bottom sheet. Nothing opens as a centred modal.
- [ ] Admin, Patients, Fiona Gray (`/admin/patients/PT0018`): "Not refreshed yet" with the Provisional
      pill. Refresh from NHI register: Name differs (Fiona Gray, Fiona Tamihana) and Address "Will be
      added". Choose Use register, then Apply. The record and her Bookings read Fiona Tamihana, the row
      reads "Last refreshed 21 Jul 2026, 08:00", and the Audit viewer shows "Refreshed from the NHI
      register" with before and after. Refresh again: "nothing to change". After a clock advance the
      stamp moves.
- [ ] Set the Hub to Unavailable on the record (the entry shows while the panel is open), then
      Refresh: the warning line with Retry, and nothing stamped. Set it back to Available.
- [ ] Admin, 40's view of rows waiting for an NHI: the add-the-NHI entry for the waiting row looks
      `ZAP3016` up ("On the NHI register: Noah Prescott, 17 May 1983", purpose note "the AA office"),
      and adding it works as Phase 40 built it. No provisional patient or "NHI pending" shows.
- [ ] Mobile Lists search: `ZAA0068` shows the check-digit reason; `CQY9304` still finds Sarah
      Mitchell's Booking.
- [ ] HPI CPN reads the same everywhere it shows: the Admin anaesthetist editor, the surgeon profile,
      the mobile and web Profile, the purpose note and the Future-scope FHIR pane. Nothing reads "HPI
      id".
- [ ] PWA (`npm run build:pwa`, then preview): Add a booking on Dr Souter's ACTIVE Tue 21 Jul PM List;
      the demo chip offers the Hub entry over the sheet; Unavailable shows the fallback, and Save with
      a typed valid NHI still creates the Booking.
- [ ] Reset restores Available and Fiona Gray's name and empty address.
- [ ] Catalogue screenshots: the recipes for US-14.4.1 are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are green.

## Demo guide updates

Patch these in the same session, and the same sections of `master-demo-guide.html`. The beats are
read as 15b, 19, 20a, 21, 28 and 40 left them: Add a booking opens straight on the manual form (no
"Enter manually"), the List is ACTIVE (never "Open" or "DRAFT"), and the form already has the RVG
type-ahead, the Procedure description, the payer on the Booking and the required NHI. This phase adds only the lookup lines below; it does
not re-narrate the payer or the type-ahead.

- `03-demo-script.md`:
  - **S2 Beat 2** (phone advice, as earlier phases left it): the **Expected** line adds that the lookup
    answers from the NHI register, the payer is prefilled from the patient it finds (21's line, kept),
    and the purpose note names Dr Sharma's HPI CPN. Add an optional
    step: "Demo actions, Hub: Unavailable, then Look up: the office can still book by hand. Set it back
    to Available." One **Say** line: "The NHI is checked as it is typed and looked up through the
    Digital Services Hub, and only ever used to identify the patient."
  - **S5 Beat 2** (NHI validation): add the Add a booking path, on Dr Souter's ACTIVE Tue 21 Jul PM
    List. `ZAA0068` is rejected as it is typed,
    and `ZBX41AL` (new format) looks up Ana Fifita, so the dual-format check covers the lookup path
    too.
  - **S5, a new optional beat, "refresh from the NHI register"**: Patients, Fiona Gray, Refresh from
    NHI register, Use register for her married name, Apply, Last refreshed. Discovery points: should
    the refresh run on a schedule (hospitals get updates twice a day), and should an NHI entered while
    the Hub is down be marked unverified?
  - "Direct URLs": `/admin/patients/PT0018` (Fiona Gray). Add the script's NHIs to the setup notes:
    `ZBR4417`, `ZBT2253`, `ZBX41AL` (on the register), `ZBW6638` (valid, not on the register),
    `ZAA0068` (bad check digit).
  - "Recovery from demo accidents": a Hub left Slow or Unavailable (badge visible) is set back from
    Demo actions or by Reset; a refresh cannot be undone except by Reset.
- `04-presenter-cheat-sheet.md`: under "Present but honestly demo-only", add that the Digital Services
  Hub is simulated over a synthetic register with three demo states. Add an identity standards line:
  the NHI is validated in both formats before any lookup, practitioners are referenced by their HPI
  CPN, and NHI use is purpose-limited (HIPC 2020). Add the two discovery points above under the
  discovery decisions.
- `02-workflows-and-handoffs.md`: in booking intake, the NHI (required) is validated as typed and looked up, with
  manual entry when the Hub is down (the NHI is still typed and valid). In patient upkeep, the office refreshes a patient from the
  register.
- `01-personas-and-responsibilities.md`: the office refreshes patient identity from the NHI register.
  The anaesthetist's NHI lookup checks the number as they type.
- The Control Panel's S2 and S5 scenario text (`DemoControlPanel.tsx`): one line each for the Hub
  states and the optional refresh beat.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 40a` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/requirements/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-14.4.1](../../../../requirements-board/requirements/stories/US-14.4.1.md) NHI lookup via Digital Services Hub | partial · `nhi-lookup` web and mobile (Add a booking, Enter manually, CQY9304, Look up; fixed 400 ms wait; stale caption and reason) | `captured` as a simulation (keep the real-Hub gap in the story, not the recipe). Re-take `nhi-lookup` on web and mobile on Dr Souter's ACTIVE Tue 21 Jul PM List with no "Enter manually" click, showing the `d4db277` form (RVG type-ahead, Procedure description, payer block, the NHI as a required field). States: `invalid` (ZAA0068: reason shown, Look up disabled), `found` (ZBR4417, highlight `[data-shot=nhi-lookup-status]` and the purpose note "Looked up on behalf of Dr Melanie Souter (HPI CPN 10SOUM)...", payer prefilled), `not-on-register` (ZBW6638), `hub-unavailable` (`nhi-hub-mode` trigger, warning line with Retry, amber badge). After Look up, wait on `[data-shot=nhi-lookup-status]` showing the answer, not 400 ms. Add admin shot `register-refresh` on `/admin/patients/PT0018` (Name differs, Address "Will be added", then "Last refreshed 21 Jul 2026, 08:00"). Captions in the catalogue's words ("HPI CPN", "NHI register"); drop the "small set of demo records" partial reason |

**Recipes this phase breaks.**

- `US-11.1.3.json` (`dedupe-nhi`, web and mobile, four states) fills the NHI placeholder `ABC1234` and clicks "Look up" with CQY9304 (Sarah Mitchell); the register mirrors every seeded patient, so the answer should still be found, but Look up is now disabled until the NHI is valid and the dialog gains the status line and purpose note. Earlier phases (15b, 19, 20a) re-point its "Enter manually" click and procedure fill; check it still runs on an ACTIVE List. Its fixed `{ "wait": 400 }` after Look up is shorter than the Hub's 600 ms answer: replace it with a selector wait on `[data-shot=nhi-lookup-status]`, so the `lookup` state shows the found patient, not "Checking the NHI register". Re-run with `--dry` and re-check its highlights.
- `US-02.4.1.json` (Add a Booking manually, re-taken by 15b, 19 and 20a on the `d4db277` form) opens Add a booking; confirm its selectors still resolve with the status line and purpose note under the NHI field. (`US-02.4.2` is Retired; its recipe is 15b's, not this phase's.)
- `US-12.1.4.json` (`anaesthetist-record`, `/admin/masters`) shows the HPI field, now labelled "HPI CPN" everywhere: check its highlight.
- Work item 14 already lists the Playwright specs; the `--dry` run is the check for the rest.

**ATLAS.md.** Update "Existing hooks" (the Hub status line, purpose note, refresh panel and `nhi-hub-mode` trigger hooks), "Personas and IDs" (the register-only NHIs ZBR4417, ZBT2253, ZBX41AL, ZBW6638 and Fiona Gray PT0018 with her register update) and "Gotchas" (the Look up button is disabled until the NHI validates; the visible wait is a short real timer).

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**: three independent Opus review subagents, one each for
**quality**, **bugs/correctness** and **plan adherence**, each given the covered catalogue files, this
doc and the diff. This session verifies every finding against the catalogue, this doc and the code,
fixes the confirmed ones (with a test wherever a bug had none), re-greens and records the pass. Do not
re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **Validate before lookup.** No path sends an invalid NHI to `askHub` or reads the register with it;
  `validateNhi` is the only validator (no second regex), and its reasons appear verbatim; Save's gate
  through `upsertPatient` is unchanged.
- **Hub states.** Every state is reachable on every surface (mobile, web, phone advice, review form,
  the rows-waiting-for-an-NHI entry, refresh). Manual entry and Save always work when the Hub is down. Retry and Stop waiting
  behave. A stale answer never fills the form after an NHI edit, a second lookup or an unmount. No
  timer outlives its component.
- **Determinism.** The register deep-equals across builds, sits on its own RNG stream, moves no
  existing draw (patient ids, NHIs and every seeded figure unchanged), and is never persisted. No
  `Date.now()`, `new Date()` or `Math.random()`. The refresh stamp comes from `clockISO`. The visible
  wait is the only wall-time element, and domain code never reads it.
- **Refresh.** Office only. It runs in one `mutate`. Differences are never written without a choice,
  defaulting to Keep, while enrichments apply. A refusal leaves state deep-equal. It never touches
  Xero, the ledger, Bookings or 40's `pendingDetails`. It resolves merged ids. The audit has before
  and after.
- **The `d4db277` form.** The lookup changes only the patient section of `ManualBookingForm`. The
  payer follows a found patient only while it is "The patient"; a "Someone else" payer is never
  overwritten by a lookup, a second lookup or a Retry, and there is no second payer-writing path
  beside 21's. The RVG type-ahead, the Procedure description (source text) and the Contract are untouched, and the NHI stays required: no path saves without a valid one, whatever the Hub does. Tests, shots and the
  checklist run on an ACTIVE List; no "Open" label, no "DRAFT" for an assigned List and no "Enter
  manually" step appear anywhere this phase adds or changes.
- **Purpose and privacy.** The purpose note is on every lookup surface and names the right
  practitioner (the List's anaesthetist, or "the AA office" for a Draft List or the Attach sheet). No
  register data, NHI or name reaches Xero or any email (`xeroNhi.test.ts` still passes). Anaesthetist
  surfaces gain no patient money.
- **HPI CPN.** One label and one formatter. The grep gate is real (not trivially passing) and allows
  only the standard's own names. No check-character rule was invented.
- **Triggers and PWA.** The Hub entry shows only while `nhiHub.inUse` is published, on its routes, on
  both surfaces, disabled for the current mode. Its body lives in `src/store`, and the hub module in
  `src/shared/nhiHub` (`pwaPurity` holds). Nothing is added to the Control Panel page. The form's
  badge shows a non-Available mode.
- **Design and copy.** Caption-slot status lines, never modals on mobile. Error, warning and success
  tints only, never a status hue. Teal-only actions, no crimson, mono NHI and HPI CPN, the Provisional
  pill once, no en or em dashes.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- **Status row** for catch-up Phase 40a, and a phase entry with:
  - the drift-check result against `d4db277` (items changed or not; the refresh cadence, HPI CPN and
    NHI-rule checks; the provisional reading built; the real form names from 15b, 19, 20a, 21 and 40);
  - what was built, with the name map for later phases: `nhiEntryFeedback`; `src/domain/nhiRegister/`
    (`NhiRegisterPerson`, `buildNhiRegister`, `lookupOnRegister`, `registerDifferences`);
    `src/domain/seed/nhiRegister.ts` (`nhiRegister()`, `NHI_REGISTER_UPDATES`, the register-only people,
    `NHI_REGISTER_POOL_COUNT`, the reserved NHIs); `src/shared/nhiHub/` (`NhiHubMode`, `askHub`,
    `HUB_TIMING`, `useNhiHubLookup`, `NhiLookupStatus`, `NhiPurposeNote`, `NHI_PURPOSE_TEXT`);
    `DemoSettings.nhiHubMode` and `setNhiHubMode`; `Patient.registerRefreshedAtISO`,
    `registerRefreshPreview` and `refreshPatientFromRegister`; `HPI_CPN_LABEL` and `formatHpiCpn`; the
    `nhi-hub-mode` trigger and the `nhiHub.inUse` context key;
  - removed: `lookupNhi`, `CANNED_PATIENTS` and the "Not found in this demo's records" copy;
  - the reading of the "delays on the demo clock" risk, and the PWA chip outcome from item 13;
  - `PERSIST_VERSION` (bumped or not, and why);
  - tests added, the before and after Vitest and Playwright counts, and the review pass.
- **Catalogue screenshots:** the recipes created or changed (by ID), the `requirements-board/requirements/capture/REPORT.md` counts before and after (captured, partial, absent, failed), the recipes this phase broke and how they were re-pointed, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Superseded:** the Phase 01 simulated NHI lookup (2nd review #7: six canned patients, "Not found
     in this demo's records", validation only at Save). The lookup validates as the NHI is typed, never
     sends an invalid NHI, and answers from a deterministic synthetic register through a simulated Hub
     with checking, slow and unavailable states and a manual fallback.
  2. **New:** the Hub's mode is demo scaffolding in `DemoSettings`, not `appSettings`. The visible wait
     is a UI-layer timer, and every stored time comes from the demo clock.
  3. **New (provisional build default, owner to confirm):** a refresh from the register is on demand, per patient, by the office.
     Enrichments apply, differences need a choice (default Keep), and it never reaches Xero (OQ-30).
  4. **New:** HPI CPN has one label and one formatter. It is shape-checked only (17); no check
     character or practitioner lookup is built, because the catalogue does not ask for one. The lookup's
     purpose note names the practitioner's HPI CPN.
- **Handoff notes:**
  - For **42**: the register is external data. Patient loads never write it, and register-only
    people are not AA patients.
  - For **43**: scale the register with the full dataset. The NHI leak scan covers the lookup status
    lines, the purpose note and the `patient.registerRefreshed` audit entries. The synthetic-data
    badge applies to the register. A lookup access log under HIPC 2020 is an open point.
  - For **44**: S2 Beat 2's lookup line, its optional Hub step, S5 Beat 2's lookup path and the new
    refresh beat were added here, on an ACTIVE List and the `d4db277` form; re-read them in the
    rewrite. Walk the Hub entry in the PWA-parity audit.
  - For **40 and 43**: OQ-49 is answered (the NHI is required). The lookup and its fallback need no
    change; the required NHI is 40's guard, and "the NHI as the patient identifier" is 43's privacy scan.
