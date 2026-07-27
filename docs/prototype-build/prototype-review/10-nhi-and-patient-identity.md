# Review 10 - NHI validation and patient identity (Appendix 1 and Appendix 2)

**RFP source:** `docs/rfp-reference/RFP.md` lines 1802-1999
**Reviewed:** 2026-07-27
**Lens:** demo-readiness (see `00-SUMMARY.md` for method)
**Note:** MISSING / PARTIAL claims in this file are unverified. `00-SUMMARY.md` carries the
adjudicated verdicts after the adversarial pass.

## Coverage table

| # | RFP feature or rule | Req ID | Status | Where in the app | Evidence |
|---|---|---|---|---|---|
| 1 | Current NHI format `AAANNNC` (3 letters, 3 digits, numeric check digit) parsed and check-digit validated (line 1826, 1835) | D8, I5, N5 | BUILT | `aa-prototype/src/domain/nhi.ts:74-95` | Test `validateNhi - current format (AAANNNC, mod 11)` passes; hand-verified below (ZAA0067, weighted sum 191) |
| 2 | New NHI format `AAANNAX` (3 letters, 2 digits, 1 letter, alphabetic check letter), mod 23 (line 1830, 1835) | D8, I5, N5 | BUILT | `aa-prototype/src/domain/nhi.ts:97-118` | Test `validateNhi - new format (AAANNAX, mod 23)` passes; hand-verified below (ACA31FM, sum 57) |
| 3 | Correctly parse and store the new alphanumeric structure; both formats live everywhere NHI is handled (line 1853-1857, 1861-1865) | D8, I5 | BUILT | `store/intake.ts:59-95`, `domain/integrations/hl7.ts:167`, `domain/integrations/fhir.ts:202-212`, `store/integrationActions.ts:443` | `intake.test.ts` "reuses by new-format NHI too"; `seed.test.ts` "every seeded NHI validates; both formats are present"; canned HL7 message `MSG-STG-1002` is a new-format booking (`domain/integrations/messages.ts:178`) |
| 4 | Field validation logic exposed for demo (both check-digit algorithms live) (line 1861-1865) | I5 | BUILT | Admin Web App to Integrations to Validators tab, `apps/admin/screens/IntegrationMonitorScreen.tsx:400-430` | Screenshot `phase11-monitor.png` shows the NHI validator with `ZAA0067` returning "Valid NHI, Format: current (AAANNNC, mod-11)" |
| 5 | Dual-format regression testing (line 1861) | N5 | BUILT | `aa-prototype/src/domain/nhi.test.ts` | 41 tests green across `nhi/nzhis/xeroNhi/intake/xeroHandoff` (`npx vitest run` on those five files); `generateNhi` round-trips 200 NHIs per format |
| 6 | No part of the system assumes a purely numeric or sequential NHI (line 1856) | D8 | BUILT | `domain/types.ts` Patient keys on `hiddenInternalId`; `nhi` is an optional string | `xeroHandoff.ts:53-65` keys contacts on `hiddenInternalId`; `grep -rni "sequential" aa-prototype/src` finds no NHI-ordering assumption; `generateNhi` draws random letters/digits for both formats (`domain/nhi.ts:133-154`) |
| 7 | Randomised (non-sequential) issuance and the range-exhaustion rationale narrated to the audience (line 1815-1818, 1838, 1840-1844) | I5 | PARTIAL | Validator copy `IntegrationMonitorScreen.tsx:414-418` | The copy covers both algorithms and the 1 Jul 2027 mandate but not the sequential-to-randomised change or why the pool is exhausting; `grep -rni "sequential|randomis|exhaust|33 million" aa-prototype/src` returns nothing NHI-related |
| 8 | Compliance roadmap: engagement with Health NZ specs, completion of compliance testing before 1 Jul 2027 (line 1861-1868) | - | N-A | - | A proposal/process commitment, not a system feature. The deadline is stated in the validator copy (`IntegrationMonitorScreen.tsx:417`) |
| 9 | Design policy: NHI must not be the primary identifier in the billing application; billing records keyed on Xero ContactID (line 1871-1873) | D9, X3 | BUILT | `store/xeroHandoff.ts:53-65`, `domain/types.ts` XeroContact | `xeroNhi.test.ts` "the serialised Xero slice contains no seeded NHI (either format)"; `apps/admin/screens/InvoiceDocument.tsx:26` "NHI never appears here (D9)" |
| 10 | NHI retained as a searchable cross-reference custom field on the Xero contact (line 1873-1885) | §11 tension | OUT-OF-SCOPE | Deliberately not built; contradiction surfaced in UI | PROGRESS convention 8 ("NHI never crosses to Xero"); REQUIREMENTS §11 "NHI-in-Xero contradiction (follow Appendix 2: never in Xero)"; callout rendered in `apps/demo/DemoXero.tsx:59-64`, visible in screenshot `demo-xero.png` |
| 11 | Xero soft limit (~10,000 contacts) vs ~28,000 invoices/yr, ~99% one-time, as the reason for archiving (line 1905-1911, 1995-1997) | N4, X3 | BUILT | `apps/demo/DemoXero.tsx:152-160` archiving callout | Screenshot `demo-xero.png` (callout present below the tables); figures come from `settings.volumeStory`, decremented by each archive run (`store/archiveActions.ts:83`) |
| 12 | Three identity layers: NHI in PMS only, hidden internal ID in Xero `ContactNumber`, Xero `ContactID` cached in PMS (line 1917-1937) | D8, D9, X1, X3 | BUILT | `domain/types.ts` Patient.hiddenInternalId; `store/appStore.ts:46-53` `billing.contactIdCache`; `store/xeroHandoff.ts:55-65` | `xeroHandoff.test.ts` "keys the patient contact on the hidden internal id, never the NHI (convention 8)"; screenshot `demo-xero.png` shows the ContactID / ContactNumber columns with `PT0008`, `BP0001`, and "No NHI column exists" |
| 13 | Intake: validate against NHI, confirm identity, deduplicate against prior episodes regardless of name or address changes (line 1956-1957) | D8 | BUILT | `store/intake.ts:52-128` (the single upsert path used by every creation flow) | `intake.test.ts` "reuses the existing patient for a known current-format NHI and enriches missing fields" (address enrichment on a name-identical match), "creates a provisional record when no NHI is supplied", "refuses an invalid NHI outright"; user-visible in `shared/flows/AddCardFlow.tsx:56-58` "Linked to an existing patient record by NHI. No duplicate was created." |
| 14 | Intake: check for outstanding credit issues, surfacing unpaid or overdue invoices for staff attention at check-in (line 1957, 1975-1979) | X3 | PARTIAL | `store/selectors.ts:274-292` `patientHasOutstandingPriorEpisode`, rendered as a "Prior balance" chip in `apps/admin/screens/BillingMonitorScreen.tsx:199-201` | Screenshot `p9-02-monitor.png` shows the chip on Hemi Walker. It appears only on the billing-monitor row (post-authorisation), not at intake / check-in, and no unit test covers the selector (`grep -rn "outstandingPrior" --include=*.test.ts` returns nothing) |
| 15 | Open vs genuinely overdue distinction flagged as a decision to make (line 1978-1979) | - | MISSING | Not present | `grep -rni "genuinely overdue\|open vs overdue" docs/prototype-build aa-prototype/src` returns nothing; the chip tooltip reads only "This patient has an unpaid prior episode (intake check)" |
| 16 | Contact resolution step 1: use the cached ContactID directly, no Xero query (line 1961-1963) | X3 | BUILT | `store/xeroHandoff.ts:89-92`, cache slice `store/appStore.ts:46-53`, seeded in `domain/seed/billing.ts:194-198` | `xeroHandoff.test.ts` "dedupes the payer + payee contacts across every episode on the list"; the path taken is audited as `via: 'cache'` (`xeroHandoff.ts:128-140`) and renders in the Admin Audit viewer's "Before to after" column (`apps/admin/screens/AuditViewer.tsx:95-104`) |
| 17 | Contact resolution step 2: query Xero by `ContactNumber`, cache the ContactID if found (line 1966-1968) | X3 | BUILT | `store/xeroHandoff.ts:93-99, 124` | Audited `via: 'contactNumber'`; the demo stands in an in-memory scan for `GET /Contacts?where=...` per the mock-backend rule (PROGRESS convention 4) |
| 18 | Contact resolution step 3: create with `ContactNumber = {hidden_id}` and cache the returned ContactID (line 1967-1968) | X1, X3 | BUILT | `store/xeroHandoff.ts:102-113` | Screenshot `demo-xero.png` contacts table shows ContactNumber values `PT0008`, `BP0001`, `H-CPH`; `xeroHandoff.test.ts:91` asserts the ContactNumber is the hidden id |
| 19 | Archived contact handling: invoice against it; unarchive-step-TBC noted (line 1970-1973) | X3 | BUILT | `store/xeroHandoff.ts:115-122`, note text `xeroHandoff.ts:41-42` | `archiveActions.test.ts` "does not archive a not-fully-paid individual contact (and unarchives a returning one)" - the seed ships Riley's patient contact already archived, and raising her pre-invoice unarchives it; the Xero sim's Archived column shows the state (`DemoXero.tsx:99`) |
| 20 | Invoicing: create and raise the invoice in Xero against the resolved ContactID (line 1981-1983) | X2, X3 | BUILT | `store/xeroHandoff.ts:152-280` | `xeroHandoff.test.ts` "creates one ACCREC + one DRAFT ACCPAY per invoice, linked via the case"; screenshot `demo-xero.png` Invoices tab (14 pairs) |
| 21 | Scheduled (nightly or weekly) job archives contacts once fully paid and past an inactivity window (e.g. 90 days), via the cached ContactID (line 1985-1989) | X3, N4 | BUILT | `store/archiveActions.ts` (`eligibleArchiveContactIds`, `runArchiveJob`, `wireArchiveJob` on `dayAdvanced`); UI home Admin to Master data to "Xero & archiving" (`apps/admin/screens/MasterData.tsx:479-545`); demo trigger `apps/demo/DemoControlPanel.tsx:786-827` | Four green tests in `archiveActions.test.ts`, including "changing the window changes next-run eligibility (not hardcoded)" (90 to 150 to 50 days) |
| 22 | Outcome: one Xero contact per real patient for life, NHI-driven matching, no name-matching fragility (line 1993-1994) | D8, X3 | BUILT | Dedupe at intake (`store/intake.ts:69-95`) plus hidden-id contact keying (`store/xeroHandoff.ts:55-58`) | `intake.test.ts` reuse tests (both formats); `xeroHandoff.test.ts:78` cross-episode contact dedupe; no code path matches contacts by name (`payerContactSpec` keys on ids only) |
| 23 | Archived contacts retain full transaction history and can be transacted against or restored (line 1997-1999) | X1, X3 | BUILT | Archiving flips a flag only; ACCRECs/ACCPAYs and payments are untouched (`store/archiveActions.ts:77-88`) | `archiveActions.test.ts` unarchive-on-return case; `demo-xero.png` Invoices tab retains rows for archived contacts' pairs |
| 24 | NHI never resides in Xero, satisfying data minimisation (line 1999, 1937-1939) | D9 | BUILT | Enforced by construction in `store/xeroHandoff.ts`; asserted globally | `store/xeroNhi.test.ts` serialises the whole `xero` slice after the full money chain and asserts none of 100+ seeded NHIs (both formats) appears |

## Hand verification of the two checksums

Alphabet used by the implementation (`domain/nhi.ts:18`): `ABCDEFGHJKLMNPQRSTUVWXYZ` (A to Z minus I and O,
24 letters, values 1 to 24). Positional weights across characters 1 to 6: `7 6 5 4 3 2`.

**Old format, `ZAA0067`.** Z=24, A=1, A=1, 0, 0, 6.
`24x7 + 1x6 + 1x5 + 0x4 + 0x3 + 6x2 = 168 + 6 + 5 + 0 + 0 + 12 = 191`.
`191 mod 11 = 4`; `11 - 4 = 7`; check digit `7`. Matches the RFP's own example. Under a literal
modulus 24 the same sum gives `191 mod 24 = 23`, `24 - 23 = 1`, i.e. `ZAA0061` - so the RFP's
"Modulus 24" label (line 1835) cannot reproduce the RFP's own example on line 1832. The prototype
uses mod 11 (the official Health NZ old-format algorithm) and says so on screen.

**New format, `ACA31FM`.** A=1, C=3, A=1, 3, 1, F=6.
`1x7 + 3x6 + 1x5 + 3x4 + 1x3 + 6x2 = 7 + 18 + 5 + 12 + 3 + 12 = 57`.
`57 mod 23 = 11`; `23 - 11 = 12`; the 12th letter of the alphabet (1-based) is `M`. Matches the
RFP's example `ACA31FM` and the RFP's mod-23 label. Implementation: `nhi.ts:107`
(`NHI_ALPHABET.charAt(23 - remainder - 1)` is the same index).

Both examples are pinned as unit tests (`domain/nhi.test.ts:6, 26`) and both pass.

## Findings

### 10.1 - Outstanding-balance check is surfaced at billing time, not at check-in  [PARTIAL]
- **RFP says:** "Before billing a new episode, call `GET /Invoices?ContactIDs={id}&Statuses=AUTHORISED`
  to surface any unpaid or overdue invoices for staff attention at check-in." (lines 1977-1978); and at
  intake the PMS "checks for outstanding credit issues" (line 1957).
- **Built:** `patientHasOutstandingPriorEpisode` (`aa-prototype/src/store/selectors.ts:280-292`) scans the
  billing mirror for a different, non-cancelled Card of the same patient with money outstanding, and
  `billingMonitor` sets `outstandingPriorBalance` on the card row (`selectors.ts:487`). It renders as an
  amber "Prior balance" chip in the Admin billing monitor (`BillingMonitorScreen.tsx:199-201`) - visible
  in `aa-prototype/visual/shots/p9-02-monitor.png` next to Hemi Walker.
- **Gap:** (a) The flag exists on exactly one surface, and that surface is the office's post-authorisation
  billing pipeline. Nothing shows it at intake (`shared/flows/ManualCardForm.tsx` / `AddCardFlow.tsx`), on
  the Card detail body shared by all three apps (`shared/card/CardDetailBody.tsx`), on the Admin day view,
  or in the authorisation Review screen - so the "staff attention at check-in" moment the RFP names is not
  covered. Phase 10's plan wrote it as a "banner on the card / monitor row" (`docs/prototype-build/phases/phase-10-xero-and-payments.md:41`)
  and PROGRESS records the either-or choice: "The WI2a intake banner sits on the billing-monitor row"
  (`PROGRESS.md:519`, deviation 3) - so the narrowing is recorded, not accidental. (b) There is no unit
  test on the selector. (c) The check reads the billing mirror rather than the simulated Xero, which is the
  Phase 10 plan's own rule ("the apps read the billing engine's own mirror, never the `xero` slice",
  phase-10 doc line 111) and is correct for the prototype.
- **Would a workshop audience notice:** only if someone asks "where does the front desk see that this
  patient still owes us money?" The chip is genuinely on screen, so the capability demos; the placement
  is the soft spot, and it is a recorded decision.
- **Severity:** cosmetic

### 10.2 - The "open vs genuinely overdue" decision is not raised as a discovery item  [MISSING]
- **RFP says:** "Decide whether to separately distinguish 'open' vs 'genuinely overdue' in this filter."
  (lines 1978-1979)
- **Built:** A single boolean. Anything with money outstanding on a prior episode raises the same chip,
  with the tooltip "This patient has an unpaid prior episode (intake check)"
  (`aa-prototype/src/apps/admin/screens/BillingMonitorScreen.tsx:200`). The prototype does have aging
  machinery elsewhere (`receivablesAgingFor`, the anaesthetist Overdue view, W4) but it is not wired to
  this check.
- **Gap:** The RFP explicitly names this as an open decision, and the prototype neither picks a reading
  nor flags it. Every other Appendix-1/2 open item is surfaced as a UI callout (the NHI-in-Xero
  contradiction in `apps/demo/DemoXero.tsx:59-64`, the unarchive-step TBC in `store/xeroHandoff.ts:41-42`,
  the duplicate-invoice-number org setting in `DemoXero.tsx:65-70`), so this one is an inconsistency in
  the prototype's own discovery-flagging habit rather than a functional hole. It is not listed in
  REQUIREMENTS §11 or in the "Pure discovery items" paragraph either.
- **Would a workshop audience notice:** no, unless AA's own finance person raises it - in which case the
  answer is "we have the aging data, we just have not chosen the threshold", which is a good answer.
- **Severity:** cosmetic

### 10.3 - The sequential-to-randomised issuance change is not narrated  [PARTIAL]
- **RFP says:** "Issuance order: Sequential / Randomised (non-sequential)" (line 1838), and the reason -
  the combination range is approaching exhaustion, the new format adds "over 33 million additional unique
  identifiers", and randomisation is "a deliberate change to improve security and privacy, including
  reducing the risk of identifying multiple births from sequential NHI allocation" (lines 1815-1818,
  1840-1844).
- **Built:** The validator's explanatory copy covers the two shapes, the two check-digit algorithms, the
  mod-24 label discrepancy and the 1 July 2027 mandate
  (`aa-prototype/src/apps/admin/screens/IntegrationMonitorScreen.tsx:414-418`). Structurally the prototype
  already honours the rule: `generateNhi` draws random letters and digits for both formats
  (`domain/nhi.ts:133-154`), seeded NHIs are non-sequential and mixed-format (`domain/seed/patients.ts:130-135`,
  roughly one in nine new-format), and nothing keys, sorts or increments on the NHI - the invariant key is
  `hiddenInternalId`.
- **Gap:** UI copy only. `grep -rni "sequential|randomis|randomiz|exhaust|33 million"` over
  `aa-prototype/src` finds no NHI-related hit, so the "no component may assume sequential issuance"
  compliance point is demonstrated by construction but never stated to the audience.
- **Would a workshop audience notice:** no. This is presenter-script material, and the demo guide can
  carry it.
- **Severity:** cosmetic

## Deliberate exclusions in this section

- **NHI as a searchable cross-reference custom field on the Xero contact** (Appendix 1, lines 1873-1885)
  is deliberately not implemented. PROGRESS convention 8 is binding: "NHI never crosses to Xero.
  Xero-sim screens and data show only the hidden internal ID (ContactNumber) and ContactID. This is
  checked in Phase 10's tests." REQUIREMENTS §11 records the reading ("NHI-in-Xero contradiction (follow
  Appendix 2: never in Xero)"), the `Data-Model-and-Flow.md:292` note calls for an AA ruling, and the Xero
  simulator states the contradiction on screen. Enforced by `store/xeroNhi.test.ts`.
- **Real Health NZ Digital Services Hub / NHI FHIR API integration and Keycloak OAuth** are out of scope
  (REQUIREMENTS §10). The in-scope substitute is the canned `lookupNhi` (`domain/nzhis.ts:97-135`, five
  fictional patients across both formats), badged "NHI FHIR lookup · Digital Services Hub" in the intake
  form - see `aa-prototype/visual/shots/m-06-manual.png`.
- **Bulk contact-volume simulation** is out of scope (REQUIREMENTS §10 and N4): the 28,000 invoices /
  10,000-contact soft-limit story is narrated with counters in the Xero sim, decremented by real archive
  runs, not simulated as 10,000 records.
- **Real Xero API semantics** for the archived-contact question. The prototype unarchives on invoice and
  labels the ambiguity rather than attempting an invoice-against-archived first and falling back
  (`store/xeroHandoff.ts:41-42, 115-122`).

## RFP tensions in this section, and the choice made

| Tension | RFP lines | What the prototype chose | Decision reference |
|---|---|---|---|
| Appendix 1's "Modulus 24" check-digit label cannot validate the RFP's own example `ZAA0067`; the real Health NZ old-format algorithm is a weighted sum mod 11 | 1832, 1835 | Implement mod 11, pin `ZAA0067` and `ACA31FM` as tests, and state the discrepancy on screen in the validator | `PROGRESS.md:88` "2026-07-22 · NHI check digits use the official Health NZ algorithms" (user-approved at planning); REQUIREMENTS D8 repeats the RFP label and carries the note; UI copy `IntegrationMonitorScreen.tsx:415-417` |
| Appendix 1 wants the NHI stored as a searchable cross-reference on the Xero contact; Appendix 2 says the NHI never leaves the PMS | 1873-1885 vs 1924, 1937-1939, 1999 | Follow Appendix 2 (stricter data minimisation); surface the contradiction as an unresolved item needing an AA ruling | PROGRESS convention 8; REQUIREMENTS §11; `Data-Model-and-Flow.md:292, 392`; on-screen callout `DemoXero.tsx:59-64` (`demo-xero.png`) |
| Archived-contact handling is itself flagged TBC in the RFP ("whether this requires an unarchive step first") | 1972-1973 | Unarchive on invoice, and carry the TBC wording into the audit entry for the action | `store/xeroHandoff.ts:41-42`; `REQUIREMENTS.md` X3 "archived-contact handling (invoice against it; unarchive-step-TBC noted)". The note reaches the user only as JSON in the Audit viewer's "Before to after" cell, not as a dedicated callout |
| "Open" vs "genuinely overdue" in the balance-check filter is an explicit RFP decision point | 1978-1979 | No reading picked, and not flagged | NONE RECORDED - see finding 10.2 |
| Appendix 2 puts identity dedupe at intake on the NHI, while the schedule section elsewhere treats the NHI as the patient's unique identifier and the integration section says "linked to an NHI where available" | 1956-1957 (with RFP body sections) | `hiddenInternalId` is the invariant key; `nhi` is optional and validated when present; one seeded provisional patient demonstrates "NHI pending" | REQUIREMENTS D8 and §11 (patient-without-NHI); `store/intake.ts:97-128`; `domain/seed/index.ts:613` marker "Provisional patient (NHI pending)"; `shared/format.ts:100-107` renders "NHI pending" |
| Appendix 2's balance check is a Xero API call; the prototype's rule is that apps read the billing mirror, never the `xero` slice | 1977 | Implement the check over the billing mirror | `docs/prototype-build/phases/phase-10-xero-and-payments.md:111` |

## Beyond the RFP

- **Dual-format validation without a patient-facing badge.** Both formats remain supported by
  `domain/nhi.ts` and visible in the integration validator. The earlier "Current format" / "New
  format" patient-block badge was removed on 27 July 2026 after user review because it was beyond the
  RFP, operationally redundant, and wrapped poorly in the card detail layout.
- **Deterministic valid-NHI generator.** `generateNhi` (`domain/nhi.ts:133-154`) produces checksum-valid
  fictional NHIs in either format from a seeded RNG, regenerating on the never-assigned remainder-0 case,
  so all ~150 seeded patients carry real-shaped NHIs (`seed.test.ts:148`) and the seed is reproducible.
- **Deliberately wrong NHI in the demo data.** The surgeon-PDF pathway ships a mistyped check digit
  (`ZAA0068`, `domain/integrations/pdfSamples.ts:111-120`) so the extraction-review screen can demo
  catching a bad NHI before ingest; the Integration monitor validates each row's NHI inline
  (`IntegrationMonitorScreen.tsx:298`) and `integrationActions.ts:443-445` refuses ingest. PROGRESS also
  records correcting the design mockup's own invalid `ZAE0311` to `ZAE0310` (`PROGRESS.md`, 2026-07-23).
- **Guardian / billable-party identity gets its own hidden ID and its own Xero contact**, distinct from
  the patient's, and archives on the same rules - the RFP's Appendix 2 only discusses patients
  (`store/xeroHandoff.ts:59-60`; `archiveActions.test.ts` "archives a fully-paid, inactive billableParty
  contact (not only patients)"). Guardians hold no NHI, so they dedupe by hidden ID only - noted as a
  demo reading in REQUIREMENTS X3.
- **Organisational contacts are archive-exempt by type**, so hospitals, insurers, surgeon groups and the
  anaesthetist payees never fall into the one-time-client archive sweep (`archiveActions.ts:39`,
  test-asserted).
- **The archive window is real master data, not a constant.** Admin to Master data to "Xero & archiving"
  shows the window, a live eligibility count, and a manual "run the nightly job now" action
  (`apps/admin/screens/MasterData.tsx:479-545`), audited `source:'system'`.
- **A patient contact ships already archived in the seed** (Riley), so the archived-contact-returns path
  demos from a pristine reset with no setup (`archiveActions.test.ts:73-88`).
- **NZHIS Level 4 ethnicity validation** rides alongside the NHI validator with honest verdicts
  (malformed vs valid-shaped-but-outside-the-curated-subset) and quarantines bad inbound codes rather
  than storing them (`domain/nzhis.ts`, `store/intake.ts:32-50`). Visible in `phase11-monitor.png`. This
  belongs to the integration requirements (I5) rather than Appendix 1/2, but it is the same identity
  surface.
