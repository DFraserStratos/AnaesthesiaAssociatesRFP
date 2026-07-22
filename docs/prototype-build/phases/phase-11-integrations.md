# Phase 11 — Integrations simulation

**Requirements covered:** I1–I5, D8 visibly demoed
**Depends on:** Phases 03 (cards to create/update) and 07 (admin surfaces). Can run any time after 07 — it does not depend on 08–10.
**Estimated:** 1 session.

## Goal

The integration story: hospital HL7 v2 messages translate to FHIR and update the schedule in near
real time; a FHIR-native feed shows the target state; surgeon PDFs are read/edited/ingested; the
integration monitor demonstrates reliability handling; NHI dual-format compliance is explicit.

## Work items

1. **Message library** (`src/domain/integrations/`): 7–9 canned HL7 v2.3.1 SIU messages styled on
   the RFP sample (MSH/SCH/PID/AIS/AIP segments): S12 new booking, **two S13 reschedules — one
   time-change within the same List, one moving the appointment to a different day/session** (the
   cross-List case calls the store's `reassignCard` with source=integration — the RFP requires the
   system to "interpret, and act on those updates automatically", and reschedules routinely cross
   sessions), S14 modification, S15 cancellation (calls the store's audited `cancelCard`,
   source=integration — the same soft-cancel mechanism as the manual action), one **transient
   failure** (for the auto-retry demo, item 5), one malformed (for the dead-letter demo), one with
   a new-format NHI.
   Each carries a unique message control ID (MSH-10) **and an SCH-2 filler appointment ID** (the
   RFP sample's `1661243` — it sits in SCH-2; SCH-1 is empty) — two different keys doing two
   different jobs: MSH-10 dedupes *messages*
   (item 5), while the appointment ID correlates *appointments* — an integration-created Card
   stores `{sourceFeedId, externalAppointmentId}` (Phase 01's correlation ref), and S13/S14/S15
   locate the Card they modify by that key, never by patient guesswork. **Translation is
   mapping-driven, not per-message canned:** a minimal field extractor walks each feed's mapping
   config (segment/field position → FHIR path, item 1a) to build the FHIR R4 output
   (Appointment + Patient + Practitioner bundle, NZ-profile touches: NHI identifier system, an
   **NZHIS ethnicity extension actually run through Phase 01's `validateEthnicityCode`** (not just
   displayed — one canned message carries an out-of-range code to prove the validator is
   load-bearing: the Card is still created but the bad code is **quarantined, never stored** — the
   ethnicity field is held "pending correction" with a monitor data-quality item whose manual-fix
   flow supplies a valid code; the RFP mandates the NZHIS Level 4 set, so a non-NZHIS value must
   not persist as data), and the **anaesthetist's HPI identifier on the
   Practitioner resource** — from the Phase 02 `hpiId` seed, per the RFP's "reference HPI where
   possible") and a store effect (create/update/cancel a Card on the matching hospital's List —
   patient creation goes through the store's shared `upsertPatient`, so a repeat patient reuses
   their record). This extractor is demo-grade and scoped to the canned set — not a
   general-purpose HL7 parser (the §10 fence stands) — but it makes the mapping config genuinely
   load-bearing: editing the mapping changes what reprocessing produces, which is exactly what the
   failure-fix flow (item 5) relies on. **Integration writes obey the lifecycle** (Phase 02's
   source guard): they apply only while the target List is DRAFT — a message addressing a Card on
   a SUBMITTED or AUTHORISED List is not applied; it parks in the monitor as a
   **manual-intervention item** ("target List locked/office-only" — nothing lost, office decides),
   reconciling the RFP's Card-immutability rule with its inbound-update requirement.
1a. **Per-hospital mapping config** (the RFP explicitly requires configurable field mapping per
   hospital partner): a "Feed configuration" view on the integration monitor showing each hospital
   feed's segment/field → FHIR-path mapping table (e.g. Hospital A's webPAS puts the NHI in
   PID-2, Hospital B's in PID-3 — make the canned messages actually differ this way so the config
   is load-bearing, not decorative). Lightly editable: the malformed-message fix flow (item 5)
   edits this mapping to resolve the failure, proving configurability.
2. **Integration simulator** (`/demo/integrations`, demo-badged): pick a feed (Hospital A: HL7 v2
   via translation; Hospital B: FHIR-native) and replay messages — or "start live feed" which drips
   them on a timer. Three-pane view per message: raw HL7 (monospace, segment-highlighted) → FHIR
   JSON → resulting schedule change (link to the Card). FHIR-native messages skip pane 1, showing
   the target architecture; UI copy references the HNZ FHIR-first mandate / Digital Services Hub /
   Keycloak (referenced, not implemented).
3. **Near-real-time effect**: replaying a message updates the Card immediately — demoable by
   keeping the mobile app open on that List after switching apps (late-booking support per the
   RFP). Integration changes write audit entries with source=integration and show in
   `lastModifiedBy`.
4. **PDF ingestion pathway**: admin-side "Surgeon lists inbox" — 2 canned "emailed PDFs" (render a
   facsimile: letterhead + patient table). Flow: open → extraction review screen with parsed rows
   alongside the PDF view (read/edit per RFP — include a deliberately-wrong row to correct) →
   ingest → Cards created on the chosen List (patients via the shared `upsertPatient`). The review
   screen **matches rows against existing Cards** (by NHI + target List): a row already on the
   List is flagged "already booked — will update, not duplicate" and ingesting it updates the
   existing Card instead of creating a second one — a re-sent PDF is the manual pathway's routine
   duplicate case (manual reschedules/cancellations themselves are office edits via the admin app,
   A2/`cancelCard`). Simulated parsing, demo-badged.
5. **Integration monitor** (admin nav): message log (time, source hospital, type, message control
   ID, patient ref, status processed/duplicate/failed/retried/manual), a failure alert indicator
   in the admin header, and the RFP's reliability story made visible:
   - **Idempotency/dedupe**: processing is keyed by message control ID — a demo trigger replays an
     already-processed message and the monitor shows it deduplicated as a no-op (no double Card).
   - **Automatic retry** (the RFP explicitly asks for retry logic, not only manual recovery): the
     canned transient-failure message fails on first processing, auto-retries on a short timer with
     a visible attempt count (attempt 1 failed → attempt 2 processed), and succeeds — while the
     malformed message **exhausts its retry budget** and only then dead-letters. The monitor's
     "retried" status is thereby produced by a real mechanism, not hand-set.
   - **Dead-letter & manual intervention**: the malformed message lands in a failed/dead-letter
     state after retries (nothing lost, alert raised) → open it → see the error (e.g. unparseable
     segment / NHI check-digit failure) → fix via the feed mapping or an edit form → reprocess.
     Locked-target messages (item 1) park here too, as manual-intervention items.
   - UI copy notes the acknowledgement/guaranteed-delivery posture this simulates (per-message
     ack, store-then-process, retry with dead-letter) — the demo answer to the RFP's
     "message delivery guarantees" requirement.
6. **NHI dual-format + ethnicity validator demo**: a widget on the integration monitor (or control
   panel) with two fields: NHI → live verdict naming the format and check-digit algorithm (mod-24
   vs mod-23); ethnicity code → live three-way verdict (Phase 01): valid-with-group-name,
   **"outside this demo's curated subset — may be a valid NZHIS L4 code"** (honest labelling, not
   "invalid"), or malformed. Both use the Phase 01 validators directly. The new-format-NHI message
   processes correctly end-to-end; UI copy notes the 1 July 2027 mandate and labels the ethnicity
   table as a demo subset.

## Out of scope

Real endpoints, SFTP, general-purpose parsing (canned messages only), Keycloak/OAuth.

## Manual test checklist

- [ ] Replay S12 → new Card appears on the correct hospital/anaesthetist List (visible live in the mobile app view of that List); audit shows source=integration; a repeat patient's NHI reuses the existing Patient record (upsert, no duplicate).
- [ ] S14 modification updates an existing Card, located by its stored `{sourceFeedId, externalAppointmentId}` correlation ref; S15 cancels it via the audited soft-cancel (card retained, visibly cancelled); the same-List S13 reschedules (time change visible) and the **cross-List S13 moves the Card to its new day/session via `reassignCard`** (audited, source=integration — both Lists' other cards untouched). The monitor shows both keys (message control ID and appointment ID) per message.
- [ ] A message targeting a Card on a SUBMITTED or AUTHORISED List is NOT applied: it parks in the monitor as a manual-intervention item and the Card is unchanged.
- [ ] FHIR-native message shows no HL7 pane and produces the same class of schedule effect.
- [ ] The transient-failure message auto-retries with a visible attempt count and succeeds without manual help; the malformed message exhausts its retries into dead-letter (alert raised), and fixing the feed mapping + reprocess recovers it — the reprocessed output visibly reflects the mapping edit (translation is mapping-driven); the feed-configuration view shows the differing per-hospital mappings.
- [ ] PDF re-ingest: re-opening an already-ingested PDF flags its rows "already booked — will update, not duplicate", and ingesting updates rather than duplicates.
- [ ] Replaying an already-processed message shows as a deduplicated no-op (same message control ID, no duplicate Card).
- [ ] The Practitioner resource in a FHIR pane carries the anaesthetist's HPI identifier.
- [ ] PDF flow: open canned PDF → correct the wrong row in review → ingest → Cards created.
- [ ] New-format NHI (mod-23) message validates and processes; the validator widget gives correct verdicts for NHI (valid old, valid new, bad check digit each way) and the three-way ethnicity verdicts (valid demo code; outside-demo-subset honestly labelled; malformed rejected). The out-of-range-ethnicity message creates its Card with the ethnicity field "pending correction" (bad code never stored) plus a monitor data-quality item, and the manual fix supplies a valid code.
- [ ] `npm run build` + `npx vitest run` green.

## PROGRESS.md updates

Status row + entry; any message-shape notes. (Cancellation behaviour is already decided — S15 uses the store's audited soft-cancel, Decisions log 2026-07-22 seventh review — don't re-decide it.)
