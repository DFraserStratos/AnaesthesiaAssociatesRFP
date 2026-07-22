# Phase 11 — Integrations simulation

**Requirements covered:** I1–I5, D8 visibly demoed
**Depends on:** Phases 03 (cards to create/update) and 07 (admin surfaces). Can run any time after 07 — it does not depend on 08–10.
**Estimated:** 1 session.

## Goal

The integration story: hospital HL7 v2 messages translate to FHIR and update the schedule in near
real time; a FHIR-native feed shows the target state; surgeon PDFs are read/edited/ingested; the
integration monitor demonstrates reliability handling; NHI dual-format compliance is explicit.

## Work items

1. **Message library** (`src/domain/integrations/`): 6–8 canned HL7 v2.3.1 SIU messages styled on
   the RFP sample (MSH/SCH/PID/AIS/AIP segments): S12 new booking, S13 reschedule, S14
   modification, S15 cancellation, one malformed (for the failure demo), one with a new-format NHI.
   Each carries a unique message control ID (MSH-10) and maps to a canned FHIR R4 translation
   (Appointment + Patient + Practitioner bundle, NZ-profile touches: NHI identifier system, an
   **NZHIS ethnicity extension actually run through Phase 01's `validateEthnicityCode`** (not just
   displayed — one canned message should carry an out-of-range code to prove the validator is
   load-bearing, surfacing as a monitor warning), and the **anaesthetist's HPI identifier on the
   Practitioner resource** — from the Phase 02 `hpiId` seed, per the RFP's "reference HPI where
   possible") and a store effect (create/update/cancel a Card on the matching hospital's List).
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
   ingest → Cards created on the chosen List. Simulated parsing, demo-badged.
5. **Integration monitor** (admin nav): message log (time, source hospital, type, message control
   ID, patient ref, status processed/duplicate/failed/retried/manual), a failure alert indicator
   in the admin header, and the RFP's reliability story made visible:
   - **Idempotency/dedupe**: processing is keyed by message control ID — a demo trigger replays an
     already-processed message and the monitor shows it deduplicated as a no-op (no double Card).
   - **Dead-letter & manual intervention**: the malformed message lands in a failed/dead-letter
     state (nothing lost, alert raised) → open it → see the error (e.g. unparseable segment / NHI
     check-digit failure) → fix via the feed mapping or an edit form → reprocess.
   - UI copy notes the acknowledgement/guaranteed-delivery posture this simulates (per-message
     ack, store-then-process, retry with dead-letter) — the demo answer to the RFP's
     "message delivery guarantees" requirement.
6. **NHI dual-format + ethnicity validator demo**: a widget on the integration monitor (or control
   panel) with two fields: NHI → live verdict naming the format and check-digit algorithm (mod-24
   vs mod-23); ethnicity code → live verdict + group name, or a clear rejection for a code outside
   the demo subset. Both use the Phase 01 validators directly. The new-format-NHI message
   processes correctly end-to-end; UI copy notes the 1 July 2027 mandate and labels the ethnicity
   table as a demo subset.

## Out of scope

Real endpoints, SFTP, general-purpose parsing (canned messages only), Keycloak/OAuth.

## Manual test checklist

- [ ] Replay S12 → new Card appears on the correct hospital/anaesthetist List (visible live in the mobile app view of that List); audit shows source=integration.
- [ ] S14 modification updates an existing Card; S15 cancels it (per the recorded cancellation-behaviour decision); S13 reschedules (time change visible).
- [ ] FHIR-native message shows no HL7 pane and produces the same class of schedule effect.
- [ ] The malformed message lands in the monitor as failed (dead-letter, alert raised), and fixing the feed mapping + reprocess recovers it; the feed-configuration view shows the differing per-hospital mappings.
- [ ] Replaying an already-processed message shows as a deduplicated no-op (same message control ID, no duplicate Card).
- [ ] The Practitioner resource in a FHIR pane carries the anaesthetist's HPI identifier.
- [ ] PDF flow: open canned PDF → correct the wrong row in review → ingest → Cards created.
- [ ] New-format NHI (mod-23) message validates and processes; the validator widget gives correct verdicts for NHI (valid old, valid new, bad check digit each way) and for ethnicity code (valid demo code, out-of-range code rejected). The seeded out-of-range-ethnicity message shows as a monitor warning.
- [ ] `npm run build` + `npx vitest run` green.

## PROGRESS.md updates

Status row + entry; log the cancellation-behaviour decision (delete vs status-marked) and any message-shape notes.
