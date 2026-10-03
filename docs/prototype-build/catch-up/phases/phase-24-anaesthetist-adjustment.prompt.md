Please run catch-up Phase 24 (Contract defined rate and anaesthetist adjustment) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md. Read these parts:
   - the owner-decisions table (D3, D12 base units in the default RVG Contracts, D25 time rounding) and the phase list;
   - the sequencing rules (the Contracts track runs 17, 18, 19, 19a, 20 to 25 strictly in order; 24 prices whole Procedures at the Contract defined unit rate through one rate function and builds no billing line, because 39b's UNIT x RATE line calls that function; 25 locks what 18 to 24 built, including the defined rate and this adjustment);
   - the demo-trigger, PWA-parity and demo-guide rules;
   - the "Catalogue screenshots" and "Front-end design" rules;
   - the "Confirm before building" row for 24 (US-04.2.2 Verify, US-03.5.1 Proposed, OQ-89).
2. docs/prototype-build/catch-up/phases/phase-24-anaesthetist-adjustment.md: your detailed plan, in two sessions.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md:
   - everything before "## By epic", especially theme 4 (pricing rule changes), the DM-14 and DM-46 rows (Structural changes) and the RV-11 and RV-24 rows (Prototype behaviour to remove or rework);
   - then the EP-03, EP-04 and EP-05 tables.
   Then read these entries in docs/prototype-build/catch-up/:
   - epics/EP-03.md (FT-03.5, US-03.5.1), epics/EP-04.md (US-04.2.2) and epics/EP-05.md (FT-05.2, US-05.2.6, FT-05.4, US-05.4.1);
   - DM-14 and DM-46 in analysis/domain-model-delta.md, and RV-11 and RV-24 in analysis/reverse-check.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-04.2.2.md (rewritten 2026-10-02, now Verify), US-05.2.6.md (renamed "Contract defined rate"), FT-05.2.md, FT-03.5.md, US-03.5.1.md, FT-05.4.md and US-05.4.1.md;
   - for context, requirements/US-05.2.1.md, US-05.2.5.md, US-03.3.6.md (the UNIT x RATE line, Phase 39b's), US-04.4.2.md, US-03.5.2.md, US-05.4.2.md, US-04.3.5.md and FT-07.2.md;
   - questions/OQ-89.md (open: is the Contract defined rate the agreed contract rate, and does it price the whole Procedure), OQ-62.md (answered: base units in each procedure's default RVG Contracts) and OQ-16.md;
   - notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md points #17, #19, #20 and #55.
   Also read these parts of docs/discovery-reference/Updated Requirements/domain-model.md:
   - the Contract table's pricingBasis (it still lists RATE_TIME), baseUnits / baseUnitOverrides and allowsAnaesthetistAdjustment rows;
   - the "Procedure billing context" rows anaesthetistAdjustment and officeOverride;
   - section 3, "Calculation rules".
5. docs/prototype-build/catch-up/analysis/prototype-map-domain.md, prototype-map-shared.md, prototype-map-admin.md and prototype-map-store-seed.md: the code index for the files you will change.
6. The AUTHORITATIVE visual reference (convention 17). No mockup draws the adjustment or the Contract editor, so extend these patterns:
   - docs/design/Mobile App.dc.html: capture sections, segmented controls, fields and captions;
   - docs/design/Admin Review.dc.html: row anatomy, flag pills and the mono Fee cell;
   - docs/design/Design Language.dc.html: tokens, the neutral and warning pills, and teal as the only action colour.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 7, 15 to 19);
   - these Decisions-log entries:
     - the 5th review #1 "Method 3 gate" and the 2026-07-23 entry that kept Fitzgerald's hourly Booking as the billing exemplar, both superseded by session 1;
     - the 2026-07-22 seventh review A6/B5 price-override entry, which session 2 supersedes for the anaesthetist side;
     - the 2026-09-28 "anaesthetist Booking shows no calculation" ruling, which this phase keeps;
     - the Phase 08 invoice-line readings;
   - the Phase 18 to 23 entries (with 19a), for the real names of the reshaped Contract, PricingBasis with its rateTime interim, rateInForce and permitsRateTime, the Contract detail panel, 19a's base-unit resolver and default RVG Contracts, setProcedureContract and the Contract picker, 22's payment setting (FULL or SPLIT) and the Booking-level engine.
8. requirements-board/capture/ATLAS.md: the recipe format, routes, ids and hooks the catalogue's screenshot recipes depend on.

Then do the drift check in the phase doc:
- run git diff 3d3a18c -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md" and read it for the covered IDs, US-05.2.1, US-03.3.6, US-03.5.2, US-05.4.2, OQ-89, OQ-62 and OQ-16;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- OQ-89: if still open, build its recommendation (the Contract defined rate is the agreed contract rate per unit, one pricing basis that prices the whole Procedure) with the provisional label in one place; if answered, follow the doc's branch for the answer and drop the label;
- OQ-62 is answered (D12): base units come from 19a's default RVG Contracts through its resolver; build no base-unit work here;
- US-04.2.2 is Verify: build it as written and put it on the "For the owner's review" list;
- do not ask me whether the anaesthetist should see the fee before and after the adjustment: build the default (no, which keeps the 2026-09-28 ruling) and put the question on the "For the owner's review" list;
- note that domain-model.md still lists an AMOUNT adjustment kind and a RATE_TIME (hourly) basis that the stories do not have. Build the stories' reading;
- note that the US-03.5.1, US-05.4.1 and US-05.2.6 catalogue screenshots show retired behaviour (the dollar field, a Booking total, the hourly line); this phase re-shoots them in its catalogue screenshot step (it never edits the catalogue's text or status);
- confirm Phase 23 is DONE and name its Booking-level engine (planned as bookingFeeFor in src/domain/billing/bookingFee.ts) and how it marks the primary (isPrimary); name 18's PricingBasis kinds, rateInForce, permitsRateTime and PRICING_BASIS_LABEL, what 18 left on the Aria Contract, and 19a's base-unit resolver (planned as resolveBaseUnits in src/domain/billing/baseUnits.ts);
- confirm Phase 18 seeded CT-RVG-POSTPAID (RVG Default Post-paid);
- grep for any anaesthetist-written dollar or fixed priceOverride a later phase seeded;
- note the current PERSIST_VERSION (16 at 3d3a18c).
Then write a plan that turns the work items into work-sized steps, then start building without waiting for my approval (ROADMAP.md "Owner review: agents test themselves"). The phase is 2 sessions: session 1 is work items 1 to 5 (the Contract defined rate) and ends green with the hourly line gone and the Aria seed re-expressed; session 2 is work items 6 to 17 (the adjustment).

While working:
- Invoke the /frontend-design:frontend-design skill before building or reshaping any UI (screens, sheets, dialogs, panels, rows, banners, pills, empty and error states), and apply it inside this repo's design system: the docs/design files and src/theme tokens stay authoritative (convention 17, ROADMAP.md "Front-end design"), so use the skill for layout, hierarchy, spacing, states and finish, never for a new palette, typeface or visual language. Store, seed and pure-domain steps do not need it.
- Mock backend only. Every write goes through a store action and the audited mutate(), with before and after metas and demo-clock timestamps. Components never own domain state.
- Session 1, the Contract defined rate:
  - one pure rate function, unitRateFor(contract, anaesthetist, pricingDateISO) in src/domain/billing/unitRate.ts, returns the unit rate and its source (the anaesthetist's unit value, the Contract defined rate, or a Contract discount rounded to cents there), or null for a fee schedule. Every unit rate the engine charges goes through it, and 39b's UNIT x RATE line will call it. Write tests R1 to R7 from the plan;
  - a defined-rate Contract prices the whole Procedure: all its billable units after 23's rule at the Contract's rate, in place of the anaesthetist's unit value. Build no billing line for it;
  - remove the hourly line everywhere: the rateTime charge and pricing basis, BillingLine.hours, permitsRateTime and permitsIndividualArrangement, INDIVIDUAL_ARRANGEMENT_MESSAGE and its gate, 18's "needs a rate x time line" rule, and the "Rate × time (hourly)" option in Add billing line. No "Method 3", "hourly" or "individually arranged" in any rendered string;
  - the Contract editor's basis selector has three options (the anaesthetist's unit value, Contract defined rate as $ per unit or % discount, fee schedule), with the one OQ-89 provisional note;
  - re-express the seed: the Aria Contract (keep the system id CT-ARIA-HOURLY, rename its key and name) gets a $26.50 per unit defined rate; Fitzgerald's Wed 15 Jul Booking gets the abdominoplasty procedure, 3 hours and an ASA class and prices at (B + T + M) x $26.50 in place of $1,440; Souter's Mon 27 Jul Aria Booking stays uncaptured; the rateTime seed markers are renamed. Pin the new figure in the seed and billing-run tests. Every other figure, including S3's, must not move;
  - bump PERSIST_VERSION by one.
- Session 2, keep the two layers separate:
  - rename priceOverride to officeOverride (same union, plus by and atISO);
  - add a separate anaesthetistAdjustment: percentDiscount (more than 0, up to 100, decimals allowed) or fixedFinal (0 or more). There is no dollar kind, and a reason is always required;
  - add Contract.allowsAnaesthetistAdjustment as an explicit boolean on every Contract.
- Billing maths stays pure. applyAdjustmentLayers in src/domain/billing/adjustments.ts runs the order: base from Phase 23's Booking-level engine at unitRateFor's rate, then the adjustment, then the office override, per Procedure, rounding to cents. Write the worked-example Vitest tests A to I and G2 from the plan, including adjustment then override over a fixed-fee Contract and over a defined-rate Contract, and the 100% discount that keeps B, T and M recorded.
- Enforce the gate in the store, not just the UI:
  - setAnaesthetistAdjustment refuses when the Contract does not allow it, when B, T and M are not recorded in full, or when the reason is blank;
  - clearing (null) is never gated, so the anaesthetist can always remove their own adjustment on a DRAFT List, even one the Contract no longer allows;
  - the office cannot write it, except to clear a disallowed one;
  - the anaesthetist cannot write officeOverride;
  - editProcedure cannot write either layer.
- One rule, one place. btmRecordedInFull shares the validator's base and time predicate. Extract it, do not copy it. B is recorded when 19a's resolver returns a base for the primary; under D3 any entered value counts, including one outside a ranged code's range. Since Phase 23, B and M (the ASA class) live on the Booking's primary, so an additional Procedure reads them from the primary and only its own times.
- The adjustment changes the price, never base units. Add no rule, report or warning for a consistently overridden base unit (AA fixes the procedure's default RVG Contract, US-04.2.2 note), and register no 15a warning rule: a stored adjustment the Contract does not allow is a completion check.
- Where the Contract does not allow it, the field is not offered at all: no disabled control and no empty card. A stored adjustment the Contract no longer allows is never applied to money and is always flagged. A Contract change clears it after a warning.
- The office override stays available on every Contract, including over a fixed fee and a defined rate. The anaesthetist still sees no fee and no unit rate on mobile or web.
- Determinism: seed changes are explicit scenario Bookings and Contract fields only (Dr Morrison's Mon 20 Jul List has no Post-paid Booking at 3d3a18c, so the Review beat likely needs one added; see work item 15). Build any new Booking after every existing seeded Booking, with pinned patients and no takePatient(), so no existing id moves (recipes start on fixed BK ids). Do not touch the generator or any RNG input. Keep the S3 figures unchanged. Bump PERSIST_VERSION by one in each session that changes the seed.
- No demo triggers in this phase: it is all normal use, and the defined rate is shown by the seeded Aria Contract and its Bookings. Add nothing to the Control Panel, and no PWA stand-in is needed.
- Design: teal is the only action colour; neutral pills for recorded layers and the rate source; the warning tint only for "not allowed"; mono for figures and rates; crimson never. No en or em dashes in any app copy.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go.
- Do not commit or push.

When done (at the end of each session, for what that session built):
- run the manual test checklist yourself in the running app (Playwright or the /run skill, screenshots checked by eye; never hand it to me) and report each item pass or fail with its evidence;
- confirm npm run build, npm run build:pwa, npx vitest run, npm run shots and npm run verify:board are green;
- run the adversarial review-and-fix pass (convention 18):
  - fan out three Opus review subagents, for quality, bugs and money correctness, and plan and catalogue adherence, steered by the phase doc's bullets;
  - independently verify each finding;
  - fix the confirmed ones and re-green;
- run the catalogue screenshot step (ROADMAP.md "Catalogue screenshots", PROGRESS convention 19): re-run node docs/prototype-build/catch-up/tools/recipe-status.mjs 24; create or update the capture recipes for US-03.5.1, US-03.5.2, US-05.2.1, US-05.2.6, US-05.4.1, US-05.4.2 and US-04.2.2, check US-05.2.2, US-05.2.5 and US-05.2.7 still pass, and fix every recipe this phase broke. Retired recipes still run and their images still show on the merged story, so: set US-03.3.7 absent and drop its two hourly images from US-03.3.6's images list, re-point US-03.5.3's adjustment-reason shots (shown on US-03.5.1) to the adjustment capture Booking keeping their names, and add the rate caption to US-05.2.4's shot (shown on US-05.2.1); also fix US-03.3.5, US-03.3.6, US-07.2.3 and the BK0009 starts; in requirements-board/ run node scripts/capture.ts --dry, fix what fails, then a full npm run capture (start root npm run dev in the background if 5173 or 5174 is down) with no failed recipe; look at the covered items' new shots; update capture/ATLAS.md where routes, ids or hooks changed; npm run verify:board green;
- update PROGRESS.md:
  - the status row and a phase entry, including the drift-check result against 3d3a18c (with OQ-89's status), the PERSIST_VERSION from and to, the real symbol names, the Aria figures before and after, the tests added, the review pass and the catalogue screenshot result (REPORT.md counts before and after);
  - the Decisions-log entries listed in work item 17;
  - the handoff notes for 25, 27, 36, 38b, 39b, 43a and 44;
- patch the demo guide in the same session, and the same sections of master-demo-guide.html:
  - session 1: the Contracts section of 04-presenter-cheat-sheet.md (the Contract defined rate line, no rate x time) and capture step 10 in 02-workflows-and-handoffs.md;
  - session 2: in 03-demo-script.md, the S1 Beat 3 aside and the S2 Beat 4 note; capture step 10 again; the office review responsibilities in 01-personas-and-responsibilities.md; the adjustment line in 04-presenter-cheat-sheet.md;
- give me short, clear notes on what changed and anything left open, ending with the "For the owner's review" list (also in the PROGRESS entry). Include:
  - OQ-89's reading as built, and US-04.2.2 still to be walked through;
  - the domain-model AMOUNT and RATE_TIME wording;
  - whether reasons should print on customer invoices;
  - the before and after display question;
  - Fitzgerald's new Aria figure.

Phase goal: a Contract can define its own unit rate, which prices the whole Procedure through one rate function in place of the hourly rate x time line; and the anaesthetist can discount a fee by a percentage or set a final price, with a reason, only where the Procedure's Contract allows it and only after B, T and M are recorded. The adjustment is applied before the office override, which stays available on every Contract, and both layers show in Review and on the invoice.
