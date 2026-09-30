Please run catch-up Phase 24 (Contract-gated anaesthetist adjustment) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md. Read these parts:
   - the phase list;
   - the sequencing rules (the Contracts track runs 17 to 25 strictly in order, and 25 locks what 18 to 24 built, including this adjustment);
   - the demo-trigger, PWA-parity and demo-guide rules;
   - the "Confirm before building" row for 24 (US-03.5.1 and US-04.2.2 Proposed, OQ-06).
2. docs/prototype-build/catch-up/phases/phase-24-anaesthetist-adjustment.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md:
   - everything before "## By epic", especially theme 6 and the DM-12 and RV-11 rows;
   - then the EP-03, EP-04 and EP-05 tables.
   Then read these entries in docs/prototype-build/catch-up/:
   - epics/EP-03.md (FT-03.5, US-03.5.1), epics/EP-04.md (US-04.2.2) and epics/EP-05.md (FT-05.4, US-05.4.1);
   - DM-12 in analysis/domain-model-delta.md and RV-11 in analysis/reverse-check.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/FT-03.5.md, US-03.5.1.md, FT-05.4.md, US-05.4.1.md and US-04.2.2.md;
   - for context, requirements/US-03.5.2.md, US-05.4.2.md, US-04.3.5.md and FT-07.2.md;
   - questions/OQ-06.md and OQ-16.md.
   Also read these parts of docs/discovery-reference/Updated Requirements/domain-model.md:
   - the Contract table's allowsAnaesthetistAdjustment row;
   - the "Procedure billing context" rows anaesthetistAdjustment and officeOverride;
   - section 3, "Calculation rules".
5. docs/prototype-build/catch-up/analysis/prototype-map-domain.md, prototype-map-shared.md and prototype-map-admin.md: the code index for the files you will change.
6. The AUTHORITATIVE visual reference (convention 17). No mockup draws the adjustment, so extend these patterns:
   - docs/design/Mobile App.dc.html: capture sections, segmented controls, fields and captions;
   - docs/design/Admin Review.dc.html: row anatomy, flag pills and the mono Fee cell;
   - docs/design/Design Language.dc.html: tokens, the neutral and warning pills, and teal as the only action colour.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 7, 15 to 18);
   - these Decisions-log entries:
     - the 2026-07-22 seventh review A6/B5 price-override entry, which this phase supersedes for the anaesthetist side;
     - the 2026-09-28 "Anaesthetist Card shows no calculation" ruling, which this phase keeps;
     - the Phase 08 invoice-line readings;
   - the Phase 18 to 23 entries, for the real names of the reshaped Contract, the Contract detail panel, setProcedureContract and the Contract picker, the covered-amount split and the Booking-level engine.

Then do the drift check in the phase doc:
- run git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md" and read it for the covered IDs, US-03.5.2, US-05.4.2, OQ-06 and OQ-16;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- ask me whether the anaesthetist should see the fee before and after the adjustment. The default is no, which keeps the 2026-09-28 ruling;
- note that domain-model.md lists an AMOUNT kind that the stories do not have. Build the stories' reading;
- note that the US-03.5.1 and US-05.4.1 catalogue screenshots show today's retired dollar field and a Booking total. Do not edit the catalogue; tell me they need re-shooting;
- confirm Phase 23 is DONE and name its Booking-level engine (planned as bookingFeeFor in src/domain/billing/bookingFee.ts, with bookingFee in shared/capture/feeContext.ts) and how it marks the primary (isPrimary);
- confirm Phase 18 seeded CT-RVG-POSTPAID (RVG Default Post-paid), which does not exist at the snapshot;
- grep for any anaesthetist-written dollar or fixed priceOverride a later phase seeded;
- note the current PERSIST_VERSION.
Then enter plan mode, turn the work items into work-sized steps, and wait for my approval. The phase is planned as one tight session; if it runs over, stop green after work item 6 and do items 7 to 12 in a second session.

While working:
- Mock backend only. Every write goes through a store action and the audited mutate(), with before and after metas and demo-clock timestamps. Components never own domain state.
- Keep the two layers separate:
  - rename priceOverride to officeOverride (same union, plus by and atISO);
  - add a separate anaesthetistAdjustment: percentDiscount (more than 0, up to 100, decimals allowed) or fixedFinal (0 or more). There is no dollar kind, and a reason is always required;
  - add Contract.allowsAnaesthetistAdjustment as an explicit boolean on every Contract.
- Billing maths stays pure. applyAdjustmentLayers in src/domain/billing/adjustments.ts runs the order: base from Phase 23's Booking-level engine, then the adjustment, then the office override, per Procedure, rounding to cents. Write the worked-example Vitest tests A to H and G2 from the plan, including adjustment then override over a fixed-fee Contract, and the 100% discount that keeps B, T and M recorded.
- Enforce the gate in the store, not just the UI:
  - setAnaesthetistAdjustment refuses when the Contract does not allow it, when B, T and M are not recorded in full, or when the reason is blank;
  - the office cannot write it, except to clear a disallowed one;
  - the anaesthetist cannot write officeOverride;
  - editProcedure cannot write either layer.
- One rule, one place. btmRecordedInFull shares the validator's base and time predicate. Extract it, do not copy it. Since Phase 23, B and M (the ASA class) live on the Booking's primary, so an additional Procedure reads them from the primary and only its own times.
- Where the Contract does not allow it, the field is not offered at all: no disabled control and no empty card. A stored adjustment the Contract no longer allows is never applied to money and is always flagged. A Contract change clears it after a warning.
- The office override stays available on every Contract, including over a fixed fee. The anaesthetist still sees no fee on mobile or web.
- Determinism: seed changes are explicit scenario Bookings and Contract flags only (Dr Morrison's Mon 20 Jul List has no Post-paid Booking at the snapshot, so the Review beat likely needs one added; see work item 10). Do not touch the generator or any RNG input. Keep the S3 figures unchanged. Bump PERSIST_VERSION by one.
- No demo triggers in this phase: it is all normal use. Add nothing to the Control Panel, and no PWA stand-in is needed.
- Design: teal is the only action colour; neutral pills for recorded layers; the warning tint only for "not allowed"; mono for figures; crimson never. No en or em dashes in any app copy.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go.
- Do not commit or push.

When done:
- run the manual test checklist and report each item;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green;
- run the adversarial review-and-fix pass (convention 18):
  - fan out three Opus review subagents, for quality, bugs and money correctness, and plan and catalogue adherence, steered by the phase doc's bullets;
  - independently verify each finding;
  - fix the confirmed ones and re-green;
- update PROGRESS.md:
  - the status row and a phase entry, including the drift-check result, the PERSIST_VERSION from and to, the real symbol names, the tests added and the review pass;
  - the Decisions-log entries listed in work item 12;
  - the handoff notes for 25, 27, 36, 39 and 44;
- patch the demo guide in the same session, and the same sections of master-demo-guide.html:
  - in 03-demo-script.md, the S1 Beat 3 aside and the S2 Beat 4 note;
  - capture step 10 in 02-workflows-and-handoffs.md;
  - the office review responsibilities in 01-personas-and-responsibilities.md;
  - the Contract rules line in 04-presenter-cheat-sheet.md;
- give me short, clear notes on what changed and anything left open. Include:
  - the domain-model AMOUNT wording;
  - whether reasons should print on customer invoices;
  - the before and after display question.

Phase goal: the anaesthetist can discount a fee by a percentage or set a final price, with a reason, only where the Procedure's Contract allows it and only after B, T and M are recorded. It is applied before the office override, which stays available on every Contract, and both layers show in Review and on the invoice.
