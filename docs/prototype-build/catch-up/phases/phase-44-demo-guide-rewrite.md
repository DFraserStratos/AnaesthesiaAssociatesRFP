# Phase 44 · Demo guide rewrite and final sweep

**Requirements covered:**
[RV-17](../analysis/reverse-check.md#rv-17-stale-open-rfp-question-and-assumption-copy-for-readings-the-catalogue-has-since-settled) Stale
"open RFP question" and "assumption" copy for readings the catalogue has since settled (re-graded at
`3d3a18c`; its `gaps.json` entry and `analysis/reverse-check.md` text are current). No DM items and
no gap items: every gap, DM and RV item except this one closed in Phases 14 to 43a, and nothing is
parked (see [ROADMAP](../ROADMAP.md#parked)).
Read alongside, because RV-17 cites them as the readings the copy must now state (statuses at `3d3a18c`):
[US-05.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.2.md) (tiered time units, "or part thereof"; **Confirmed** on 2026-10-02: a part interval is always rounded up, always under the RVG tiers, and the tiers are data) ·
[OQ-50](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-50.md) (**Answered** 2026-10-01: time units come only from the RVG rules, never from office tables) ·
[OQ-75](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-75.md) (**Answered** 2026-10-02, D25: time is always rounded up and always uses the RVG tiered rules; **the last time-rule caveat goes**) ·
[OQ-08](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-08.md) (List reassignment mechanism, Answered) ·
[FT-13.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.3.md) (billing flow monitoring in the Admin App, **Confirmed** on 2026-10-02; stated plainly, no "proposed") ·
[OQ-74](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-74.md) (**Answered** 2026-10-02, D24: the unpaid-balance threshold counts from the invoice date; a credit balance is a mild warning) ·
[US-07.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.3.2.md) (immutable after AUTHORISED; Proposed: the design, never "the RFP immutability answer") ·
[FT-08.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.2.md) (one invoice per billable party within a Booking; **Proposed**, so it keeps a "proposed" label, never "discovery question") ·
[US-05.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.7.md) (prices held GST exclusive; Proposed: the GST wording is the design, labelled proposed, never "demo assumption") ·
[OQ-84](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-84.md) (Open, new: the status a session takes after its List is moved away; built by 32 as its recommendation and **keeps its label**) ·
[US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md) (balance invoiced after AUTHORISED; Verify, because whether every positive balance is invoiced is [OQ-61](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-61.md), Open, built as its recommendation: always).
Also read, for the S5 beats:
[OQ-30](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-30.md) (**Answered**: no PII in Xero, only a unique ID that links transactions back to our invoices; S5 states it as the rule, no caveat) and
[US-11.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.2.md) (Proposed, unchanged, still says "modulus 24"; the mod-11 label stays flagged).
For the new beats (scripted, not closed here; statuses at `3d3a18c`):
[FT-13.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.7.md) (warnings and the to-do list, Verify) and [US-13.7.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.3.md) (warning flag, **Confirmed**: visible on opening the Booking, **no confirm step at submit**, no tap-to-read; 15a) ·
[US-10.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.3.md) (AA fee settings and the monthly run, Verify, 16) ·
[US-01.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.3.md) (an anaesthetist moves their own List, **Confirmed**, 32) and [US-01.5.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.5.md) (mark unavailable while holding a List: return to the office or assign to a colleague, Confirmed, 32) ·
[FT-13.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.8.md), [US-13.8.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.8.1.md) (Confirmed) and [US-13.8.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.8.2.md) (Verify) (the shared notification pool, 32) ·
[US-01.4.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.7.md) and [US-01.4.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.6.md) (an anaesthetist moves a single Booking; the doer rule; Verify, 32a) ·
[US-01.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.2.md) (a recurring booking on an unavailable session becomes a Draft List, OQ-81 part 2 settled; Verify while OQ-81 part 3 is open; 31) ·
[US-02.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.4.md) (update email templates per kind of change, Confirmed, 35) ·
[US-06.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.3.md) (prepayment is an estimate, Confirmed; the prepaid excess billed cleanly, 27) and [US-06.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.4.md) (a moved prepaid Booking, Verify, 41) ·
[FT-03.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.7.md) and [US-03.7.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.3.md) (events on a Procedure and the events list, Verify, 38b and 39b) ·
[US-08.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.1.md) (additional invoice, Verify, 38b), [US-08.6.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.5.md) (credit note option, Verify) and [US-08.6.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.6.md) (rebill from a copy of the original lines, Proposed) (39) ·
[US-03.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.6.md) and [US-03.1.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.7.md) (find past work, Proposed, 38a) ·
[US-10.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.5.md) (negative invoices netted, Confirmed) and [US-10.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.6.md) (period BCTI approval, Verify) (39a) ·
[US-14.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-14.4.1.md) (NHI lookup, Proposed, 40a) ·
[US-13.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.3.md) (anaesthetist sign-in, PWA first, Verify, new; 43a) and [US-15.0.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.1.md) (ease of use and point-of-need help, Proposed, 43a).
**Left the script at `3d3a18c`** (each beat is dropped, or moved to "What to narrate rather than
click" as Future scope): [US-02.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.3.md)
Copy a Booking (Retired; removed by 15b), [US-02.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.4.md)
booking from a photo and [US-02.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.2.1.md)
surgeon PDF upload (Future Work; badged by 15b and 34), US-02.5.1 to US-02.5.4 automated change
application and reschedule rules and US-02.5.6 concurrent edits (Future Work), US-13.7.4 warning
settings (Future), US-05.2.3 the conditional positioning modifier (Retired; removed by 19), and the
carry-forward of a negative invoice with no later payment (D21, OQ-71: handled outside the system,
so 39a built nothing).
**Depends on:** every catch-up phase, 14 to 43a (including 15a, 15b, 19a, 32a, 38a, 38b, 39a, 39b,
40a and 43a), DONE. This phase runs last. It changes no domain behaviour; it re-walks and re-scripts
what 14 to 43a built.
**Estimated:** 2 sessions (one is not realistic for four new Vitest files, two
Playwright specs, a copy sweep of about twenty-five sites, five rewritten guide files, a regenerated
1,400-line master guide, two full walks of S1 to S5 plus a handset pass, and a four-reviewer
adversarial pass; the 2026-10-01 and 2026-10-03 updates add about seventeen beats, absorbed by
moving material into asides and lengthening S2 and S4 rather than a third session).
- **Session 1 (code and baseline):** drift check, items 1 to 7. It ends green with a draft Phase 44
  PROGRESS entry (status IN PROGRESS) holding what Session 2 needs, because scratchpad notes do not
  survive the session: the drift-check result, the OQ list at HEAD, the D1 to D25 table, the beat and
  registry inventory (item 1) and the re-baselined figures (item 7).
- **Session 2 (documents, QA, close-out):** items 8 to 13, starting from that draft entry.
Regressions the QA pass finds are fixed only if small (item 12); anything larger is logged, never a
third session.

## Goal

Forty phases each patched only the beats they broke. The presenter now needs one coherent script
that matches the finished app, told in the catalogue's vocabulary (Booking, List, Draft List,
session, Contract, billable party, ledger, warning, event, notification; "recurring booking", "move"
and "reassignment", never "Permanent List", "swap", "timesheet" or, in anything the audience sees,
"slot": Slot stays a code and planning word, per OQ-64), and one self-contained master guide
generated from it.

This phase:

- **rewrites the S1 to S5 run sheet** (`docs/demo-guide/03-demo-script.md`) around the new model,
  folding in every lettered beat and optional aside the earlier phases left, renumbering them, and
  adding the new beats: **sign-in** on the handset, **sync then match** and **finding past work**
  (S1); **warnings on the to-do list** (visible on opening a Booking, no confirm step at submit),
  **a recurring clash becoming a Draft List**, **Draft List assign with the waiting flag**, the
  **blacklist warning**, the **conflict dashboard** with the **on-demand update email**, **an
  anaesthetist moving their own List** to the office or a colleague (D7) and **return-or-assign**
  when they mark a booked session unavailable (D14), **an anaesthetist moving a single Booking**
  (32a), and the office's **shared notification pool** with the cover-change email from a
  notification (D15, D19) (S2; the old "swap with office confirmation" beat is gone); the **monthly AA
  fee run** and the **payment run** with BCTI approval and the remittance advice (S3); the
  **overpaid prepayment billed cleanly**, the **events list** on a Procedure, **pre-op and post-op
  events**, the admin **additional invoice to any party**, the **credit note option** and
  **credit-and-rebill from a copy of the original's lines with the negative netted on the remittance
  advice** (S4); **NHI lookup**, the **missing-NHI list** and **authorise, then edit the unit value,
  with the invoice unchanged** (S5); and **point-of-need help** pointed at where it sits (S1 capture,
  S2 Day and Review);
- **re-baselines every figure** the guide quotes from the running app after a reset, never by hand;
- **rebuilds the Control Panel scenario jumps** as a pure, tested module whose jumps stage only what
  their scenario needs and then offer one deep link per beat;
- **regenerates `master-demo-guide.html` in full** from the rewritten Markdown, and brings the
  personas, workflows, cheat sheet and demo-guide README into line;
- **sweeps stale "open RFP question / discovery item / assumption" copy** from the app (RV-17),
  stating the catalogue's reading where it is settled and citing the OQ where it is still open. The
  time-rule caveats go (OQ-50 and OQ-75 answered: a part interval always rounds up under the RVG
  tiers); a caveat stays only where a question is still open, for example OQ-89 on the Contract
  defined rate, OQ-84 on the status a vacated session takes, and the **BCTI granularity, labelled
  provisional** (one BCTI per receivable invoice built; "one per procedure" unresolved, beside OQ-29
  and OQ-60). The sweep also removes any surviving **"slot"** in app copy (OQ-64), any **"Copy
  booking"** (US-02.4.3 Retired, 15b) and any **addendum** wording (38b). A source-scan test stops
  stale copy coming back and keeps the live caveats in place;
- **audits every registered demo trigger**: it shows only on its own screen, the Control Panel is
  only the index, and every beat with a mobile side can be run on a handset through the PWA sheet,
  signed in through 43a's screen;
- runs a **full QA pass** on the framed build and on a handset, and **records the catch-up** in
  PROGRESS.md.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot. This phase scripts the whole app, so
   read the whole diff, not only RV-17's references:

   ```
   git diff 3d3a18c -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   At plan time (2026-10-03, after the three 2026-10-02 meetings with Greg) there was no diff. The
   plan already reflects those meetings: OQ-62 to OQ-75 answered (D12 to D25), US-05.2.2, FT-13.3,
   US-01.4.3 and US-13.7.3 Confirmed, the new stories scripted above, Copy a Booking Retired, photo
   capture, surgeon PDF upload, the automated change stories and concurrent edits moved to Future
   Work, and the vocabulary rule that "slot" never reaches the UI. For each item changed since:
   - if it is one RV-17 cites (US-05.2.2, OQ-50, OQ-75, OQ-08, FT-13.3, OQ-74, US-07.3.2, FT-08.2,
     US-05.2.7, OQ-84), re-read it and adjust work item 6's wording for it;
   - if it changes a behaviour a scripted beat relies on, check the owning phase's PROGRESS entry for
     whether the build followed it. If the build did not, **do not change the build here**: script the
     app as built, label the beat provisional, and list the item for the owner in the PROGRESS entry;
   - if an item is now Retired or Future, drop its beat (or move it to "What to narrate rather than
     click" as Future scope) and record that in the PROGRESS entry.
2. **Every open question the guide will name.** Re-read the status of each OQ at HEAD
   (`catalogue/questions/OQ-*.md`). The guide's "Open questions" list and every discovery point are
   built from HEAD statuses, not from this doc. At `3d3a18c` the Open ones were OQ-12, 13, 15, 29,
   31, 38, 43, 47, 48, 49, 60, 61 and 76 to 89; OQ-62 to OQ-75 are Answered; none was Confirm or
   Proposed, and OQ-11, OQ-37 and OQ-51 do not exist. Anything Answered is stated as the rule, with
   no caveat; anything still open keeps "provisional" in the same words the UI uses. The ones a beat
   touches at plan time: OQ-13 (download format), OQ-12 (ACC pre-op codes), OQ-15 (uneven modifier
   split), OQ-29 (GST agency), OQ-31 (D9), OQ-38 (contingency units), OQ-43 (blacklist wording),
   OQ-47 (payment day), OQ-48 (price in force), OQ-49 (D11), OQ-60 (what the fee counts), OQ-61
   (balance always invoiced), OQ-76 (prepaid procedures), OQ-77 (rebill total and the payable
   reversal), OQ-78 (default Contracts), OQ-79 (what posts to the pool, and expiry), OQ-80 (when the
   prepayment pair is created), OQ-81 part 3 (short-notice sickness), OQ-82 (automating change
   emails), OQ-83 (the sign-in experience), OQ-84 (vacated session status), OQ-85 (how a single
   Booking moves), OQ-86 (anaesthetists pulling Draft Lists), OQ-88 (one master or two) and OQ-89
   (the Contract defined rate). Each was built as its recommendation by its phase; the guide names it
   provisional only where that phase's UI does.
   **Requirement statuses matter too** (catalogue `README.md`, "Status"): a **Confirmed** item is
   AA's rule and is stated plainly (US-05.2.2, FT-13.3, US-01.4.3, US-01.5.5, US-13.7.3, FT-13.8,
   US-13.8.1, US-02.3.4, US-06.2.3 and US-10.2.5 among them); a **Proposed** item (FT-08.2, US-05.2.7,
   US-07.3.2, US-08.6.6, US-03.1.6, US-03.1.7, US-14.4.1, US-15.0.1 among them) is the system's design
   pending AA sign-off, so the app and guide may describe it as how the system works but never as "AA
   confirmed"; an **Open** or **Verify** item is provisional and says so. "Settled" in this doc means
   an Answered OQ or a Confirmed item; a Proposed item is "the design". Several new-beat items are
   Verify only because a sub-question is still open (FT-13.7, US-10.3.3, US-01.4.6, US-01.4.7,
   US-13.8.2, FT-03.7, US-03.7.3, US-08.6.1, US-08.6.5, US-10.2.6, US-06.5.4, US-13.5.3): tell the
   part an answered decision or OQ settled as the rule, and label only the open sub-question, with
   its OQ id (from the item's Notes), as the owning phase's UI does.
   - **OQ-50 and OQ-75 are answered** (D25: time units come only from the RVG rules, and a part
     interval always rounds up under the tiers). Check that the RVG time tiers 19a holds as data, read
     through `src/domain/billing/timeUnits.ts` or whatever 19a's entry names, are the only source of
     time units in the app (Phase 27's estimator reads them; no office table or per-anaesthetist
     lookup survives). If another source exists, stop and raise it with the owner (a billing change
     is not this phase's to make). No time-rule caveat survives anywhere, in the app or the guide.
   - **OQ-30 is answered** (no PII in Xero; a unique ID links back). S5's "no NHI in Xero" beat
     states it as the rule, and the Xero NHI callout (US-09.3.1, reworded by Phase 16) carries no
     "contradiction" or "to confirm" text.
   - **BCTI granularity** is not an OQ but an open point the plan keeps in one place (ROADMAP,
     "Sequencing rules"): one BCTI per receivable invoice is built, "one per procedure" is unresolved
     beside OQ-29 and OQ-60. Every app and guide mention of the count stays labelled provisional.
3. **Owner decisions D1 to D25** (ROADMAP "Owner decisions"). D1 to D8 and D10 were answered at the
   2026-10-01 meeting and D12 to D25 at the 2026-10-02 meetings, and their phases built the answer:
   D1 monthly AA fee invoice from settings (16), D2 insurer and funding source on neither Booking nor
   Patient (20), D3 any base units with an after-procedure office warning (19), D4 child billable
   party a mild warning (21), D5 no prepayment gate, a warning in both apps (15a, 27), D6 prepayment
   invoice generated at setup and sent on admin approval (27), D7 the anaesthetist moves their own
   List with no confirmation (32, 32a), D8 a flat outstanding list (38), D10 a free-form additional
   invoice (38b), D12 base units on each procedure's default RVG Contracts (19, 19a), D13 "event" as
   one element with one review step (38b, 39b), D14 Slots as stored status containers with
   user-maintained statuses, no "slot" in the UI, and return-or-assign (28 to 32), D15 the shared
   notification pool (32, 35), D16 a short AA code and a picker filtered by procedure then hospital
   (18, 19a, 20), D17 the Contract always defines the billable party (21), D18 typed $ or % split
   shares set on the Booking (22), D19 an on-demand update email picked from the change history (35),
   D20 a moved prepaid Booking keeps the agreed amount and only the payable half moves (27, 32a, 41),
   D21 a negative invoice with no later payment handled outside the system (39a), D22 additional
   invoices to any party with a credit note option (38b, 39), D23 prepayment only for a person paying
   for the patient (27), D24 the balance threshold from the invoice date with a credit balance mild
   (40), D25 part intervals always round up (19a, 27). These are stated as the rule, with no
   provisional label (only their own open sub-questions keep one: OQ-60 under D1, OQ-79 under D15,
   OQ-80 under D6, OQ-77 under D22, OQ-78 under D17, OQ-81 part 3 under D14, OQ-82 under D19, OQ-85
   under D7's single-Booking move, OQ-88 under D12). **D9 (OQ-31, billed Lists, 38) and D11 (OQ-49,
   Booking without NHI, 40) are still open:** from those phases' PROGRESS entries write down the branch
   built and the exact provisional label shown. If the owner has answered D9 or D11 since its phase
   ran and the build still carries the default, script the build as it stands, label it provisional,
   and raise it with the owner; do not rework the feature here. Likewise, if an answered decision's
   phase still shows a provisional label for it, that is a regression for item 12.
4. **Prerequisites.** Confirm Phases 14 to 43a (with 15a, 15b, 19a, 32a, 38a, 38b, 39a, 39b, 40a and
   43a) are DONE in the PROGRESS status table. If any is not, stop and tell the owner: 44 runs last.
   Read every catch-up phase entry's handoff notes "For 44" (at least 15a, 15b, 16, 25, 27, 32, 32a,
   33, 34, 35, 36, 37, 38, 38b, 39, 39a, 39b and 43a leave one), and the name maps each entry records
   (routes, registry ids, store actions, seed constants). This doc names things as they were planned;
   the entries record what was built. Where they differ, the entry wins.
5. Note the current `PERSIST_VERSION` (16 after 15a's session 1; later phases bump it) and the Vitest
   and Playwright counts before you start.
6. Record the drift-check result in the PROGRESS entry.

## Reference

**Design files (convention 17):**
- `docs/design/Design Language.dc.html`: the master guide's own tokens (`:root` in
  `master-demo-guide.html`) are transcribed from it. Keep them in step: neutrals, status colours, crimson
  `#A91E3E` for identity only, teal `#0D6E63` the only action colour (the guide's buttons), mono
  tabular numbers for figures. The status legend follows Phase 29's session status master (a
  user-maintained list with fixed ids and editable labels and colours, D14; seeded from free, on
  holiday and unavailable) with the colour tokens in `src/theme/statusColours.ts`; take the count,
  labels and colours from the seed as built, and call them session statuses, never "slot" statuses.
  The warning triangle's mild and strong treatments (15a) join the legend.
- `docs/design/Mobile App.dc.html`: the header, dock and tab-bar positions the PWA "Demo" chip must
  clear during the handset audit (and 43a's sign-in screen, which has no dock or tab bar).
- The six layout pages (Mobile App, Mobile Availability, Web Dashboard, Web Availability, Admin Day,
  Admin Review): only as the yardstick for spotting visual regressions during the QA pass.

**Catalogue:** the RV-17 references above, OQ-30, OQ-61 and US-11.1.2, the new-beat items listed
under Requirements covered, and every OQ file the guide names (step 2). The change logs explain the
vocabulary and the 2026-10-02 answers:
`docs/discovery-reference/Updated Requirements/changes/2026-10-01-requirements-update.md`,
`2026-10-02-requirements-update.md`, `2026-10-02-aa-requirements-review-with-greg.md` and
`2026-10-02-aa-booking-and-pricing-review-with-greg.md`.

**Analysis:**
- `../analysis/reverse-check.md`: RV-17 (and RV-22 for the "Play the office" scaffold wording).
- `../GAP-ANALYSIS.md`: everything before "## By epic", especially "Demo impact", "Demo-trigger
  buttons", "Remove or rework" and "Uncertainty".
- `../ROADMAP.md`: "Owner decisions" (D1 to D25), "Sequencing rules" (the BCTI granularity rule and
  the vocabulary rule), "Demo triggers", "PWA parity", "Demo guide", "Confirm before building",
  "Milestone demos" (the "After 44" line is this phase's acceptance), "Parked" (nothing, and the
  list of items out of the plan since the 2026-10-03 update).
- `../analysis/prototype-map-shell-demo-pwa.md`: sections 5.1 (Control Panel, `SCENARIOS`), 7 (PWA) and
  9 (the registry pattern). The code has moved a long way since the map; use it for orientation only.
- Every catch-up phase doc's "Demo triggers" and "Demo guide updates" sections (`phases/phase-14` to
  `phase-43a`, including 15b, 19a, 32a and 38b): the inventory of what each phase registered and
  which beats it patched.

**Code entry points** (paths and lines at plan time, 2026-10-03, with Phases 14, 15 and 15a's session
1 built; every later phase renames or moves some, and each phase's PROGRESS name map is what was
actually built):
- `aa-prototype/src/apps/demo/DemoControlPanel.tsx`: `SCENARIOS` (`:250`, with
  `Scenario`/`ScenarioResult` types at `:236-242` and a `nav` link list per jump), `ScenarioJumps`
  (`:351`), the "Demo actions by screen" index (`DemoActionsIndex`, `:448`, Phase 14), the
  billing-assumption callout (`:226-229`, "Billing assumption: partial time intervals round up ...
  The RFP defines the tiers but not the rounding; to confirm with AA in discovery"), and the S2
  scenario text that still says "vacated slot".
- `aa-prototype/src/shared/demoTriggers/` (Phase 14): `types.ts`, `match.ts` (`demoTriggersFor`),
  `registry.ts` (`DEMO_TRIGGERS`), `context.ts` (`useDemoTriggerContext`), `memory.ts`,
  `useDemoTriggers.ts`, `DemoTriggerBadge.tsx`, `demoTriggers.test.ts`.
- `aa-prototype/src/shell/DemoActionsMenu.tsx` (Phase 14; `data-shot="demo-actions"` and
  `demo-action-<id>`), `AppShell.tsx`, `appConfig.ts`, `src/router.tsx` and each app's `routes.tsx`
  (`src/apps/{admin,mobile,web}/routes.tsx`).
- `aa-prototype/src/pwa/PwaDemoActions.tsx` (Phase 14), `PwaDemoPanel.tsx`, `officeSimulation.ts`,
  `MobileViewport.tsx`, `pwaPurity.test.ts`; `aa-prototype/pwa/main.tsx`; 43a's sign-in screen and
  its "Sign out" entry (names from 43a's entry).
- `aa-prototype/src/store/demoActors.ts` (Phase 14: `OFFICE_ACTOR`, `SOUTER_ACTOR`,
  `OFFICE_SIMULATION_ACTOR`; Phase 32 adds `anaesthetistActor(state, id)` for colleague moves),
  `src/store/officeStandIn.ts` (Phase 14), `clockActions.ts` (`resetDemo`, `:110`),
  `src/domain/seed` (`SEED_LIST_IDS` in `index.ts`, `SEED_MARKERS`, `listIdForSlot` in `canvas.ts`,
  `ANAE` in `cast.ts`).
- `aa-prototype/src/domain/billing/timeUnits.ts` (`timeUnitsFromMinutes`, `PARTIAL_INTERVAL_ROUNDING`
  with its "ASSUMPTION ... discovery item, not a settled rule" comment at `:7-11`), or wherever 19a
  moved the tiers as data: the one time-unit source the OQ-50 check confirms.
- RV-17's copy sites at plan time (confirm each by grep; 15b, 16, 21, 22, 27, 28, 32, 37 and 38b
  rewrite several): `shared/capture/UnitsCard.tsx:68` ("part intervals round up (assumption)"),
  `apps/demo/DemoControlPanel.tsx:226-229` (the callout), `apps/admin/flows/ReassignListFlow.tsx:31,112`
  ("PROPOSED reading of the RFP's open question", "Proposed reading: the RFP leaves the precise
  reassignment mechanism open", and "free slot"), `apps/admin/screens/BillingMonitorScreen.tsx:107-111,203`
  ("Where the RFP leaves open", "held as a discovery question"; 37 and 40 should remove both),
  `shared/booking/BookingDetailBody.tsx:486,680` (the post-op addendum banner and "the RFP
  immutability answer"; 38b withdraws the addendum). Further hits:
  `apps/admin/screens/InvoicesScreen.tsx:89` ("RFP split billing wording is held as a discovery
  question"), `apps/admin/screens/InvoiceDocument.tsx:216` ("a demo assumption ... A discovery item
  for AA") and `:510-511` ("the agreed deposit", "Payment is required before the procedure
  proceeds", "a discovery point"), `apps/admin/screens/IntegrationMonitorScreen.tsx:424-425` (the NHI
  validator note), `apps/demo/DemoXero.tsx:60` (the NHI callout, Phase 16's to reword), `:65`
  (duplicate-number setting "an open item to confirm in discovery") and `:499` ("% prototype
  assumption. The RFP does not specify", Phase 16's to remove), `shared/booking/BookingDetailBody.tsx:650`
  ("Copy booking", 15b's to remove), and comments in `domain/billing/timeUnits.ts:7-11`,
  `store/prepaymentActions.ts:17-18`, `domain/billing/agencyFee.ts:4`, `domain/billing/invoiceBuild.ts:34`,
  `apps/admin/reviewFlags.ts:5-9`, `domain/types.ts:388,564`, `domain/seed/rvgCodes.ts:8`,
  `domain/billing/modifierCodes.ts:6`, `store/paymentActions.ts:20-22`, `store/bookingActions.ts:181,278`,
  `shared/surface/context.ts:92`, `domain/nhi.ts:4`, `apps/admin/flows/ReassignListFlow.tsx:31-32`.
- `aa-prototype/src/shared/audit/auditNarrative.test.ts`: the "label coverage" source scan
  (`import.meta.glob('../../store/**/*.ts', { query: '?raw', ... })`, `:225`) to copy for the copy
  guard (work item 6d); `src/pwa/pwaPurity.test.ts` and `src/domain/domainPurity.test.ts` use the same
  pattern.
- Playwright: `aa-prototype/visual/demo-actions.spec.ts` (Phase 14), `visual/demoActions.ts` (its
  helpers), `visual/pwa-device.spec.ts` (the PWA project), `visual/phase12.spec.ts` (scenario jumps),
  `playwright.config.ts` (the `pwa-device` project has `testMatch: /pwa-device\.spec\.ts$/` and
  `prototype` the matching `testIgnore`, so a new PWA spec needs both regexes widened).
- Docs: all of `docs/demo-guide/`; `aa-prototype/README.md` (Control Panel, Demo actions, Office
  simulation sections); `requirements-board/capture/ATLAS.md` ("Scenario jumps" table, the
  `scenario-s1` to `scenario-s5` and `scenario-confirm` hooks) and the capture recipes whose setup is
  `{ "scenario": "Sn" }` (29 uses in 21 recipes at plan time: 26 `S3`, 3 `S5`; for example `US-08.1.1.json`).

## Work items

Session 1: the inventory (1), the code (items 2 to 6, small, test-backed) and the figures (7).
Session 2: the documents (8 to 11), the QA pass (12) and the record (13). No domain or billing behaviour changes. The seed does not change unless a
scenario jump truly cannot be staged through existing guarded actions; if it does, bump
`PERSIST_VERSION` by one, extend the migrate test, and say why.

### Session 1: code and baseline (items 1 to 7)

1. **Inventory (working notes in the scratchpad while you work; the tables Session 2 needs are
   copied into the draft PROGRESS entry at the end of Session 1, not into a separate report file).**
   - Every beat, lettered beat (1b, 3a, 3b and so on) and optional aside in the current
     `03-demo-script.md`, with its screens, the Demo actions entries it presses, whether it has a
     mobile side, and its source phase. Flag every beat still built on a superseded reading for
     removal: the swap request with office confirmation, the prepayment gate, the confirm step at
     submit and tap-to-read on the triangle (US-13.7.3), the 5% fee, the addendum Booking (38b),
     Copy a Booking (15b), "Permanent List", unavailability turning Lists into Draft Lists (the
     anaesthetist now chooses, US-01.5.5), the update email prompted after a save or a cover change
     (D19), the per-Booking billable-party override (D17), surgeon PDF upload, photo capture or
     automated change application shown as in scope (Future Work), two people editing one Booking
     (US-02.5.6, Future Work), and the carried-forward negative invoice (D21).
   - Every registry entry: dump `DEMO_TRIGGERS` (id, label, `screen`, `routes`, `surfaces`, `badge`,
     `indexPath` on the pristine seed) with a throwaway script or `vitest` snippet in the scratchpad.
   - Every scenario jump's current staging and message.
   - The D1 to D25 branch table from drift-check step 3, and the open OQ list from step 2.
   This inventory drives items 2 to 12.
2. **Scenario jumps become a pure, tested module** (`aa-prototype/src/apps/demo/demoScenarios.ts`).
   Move `SCENARIOS` out of `DemoControlPanel.tsx`:

   ```ts
   interface ScenarioBeatLink { beat: string; label: string; path: (state: AppState) => string | null }
   interface DemoScenario {
     id: 'S1' | 'S2' | 'S3' | 'S4' | 'S5'   // stable: capture recipes use { "scenario": "Sn" }
     title: string
     blurb: string
     stage: (api: AppStoreApi) => { ok: boolean; message: string }
     beats: readonly ScenarioBeatLink[]     // one per core beat, in script order
   }
   ```

   - Every `stage` starts with `resetDemo(api)` and then applies only what its scenario cannot reach
     from the pristine seed, through the real guarded store actions as `OFFICE_ACTOR` or
     `SOUTER_ACTOR` (never a direct state write). Expected at plan time, confirm against the
     inventory:
     - **S1, S2, S4:** reset only. S2's recurring clash, colleague moves and pool rows and S4's
       overpaid prepayment, post-op and payout staging are done live from each beat's Demo actions,
       so the presenter sees them happen.
     - **S3:** reset, then check both Souter Mon 20 Lists are SUBMITTED (the existing precondition).
       The fee-run and payment-run beats stage live from their Demo actions ("Seed a month of
       BCTIs", "Stage a payment period"), so the jump does not pre-run them.
     - **S5:** reset; stage the audit trail on David Chen's Booking with Phase 35's admin save path
       (`saveBookingPatch` as planned) for the office edit (so History shows a grouped change set) and the
       anaesthetist's own edit path for the ASA edits; then authorise Dr Whitaker's Fri 17 List so a
       Contract version is locked (Phase 25) and its invoices exist.
   - `beats[].path` resolves a deep link from state (seed constants, `listIdForSlot`, or a selector
     such as "the first S3 invoice after authorise"), returning `null` with the reason in the label
     when the target does not exist yet (for example an invoice before the List is authorised, or a
     remittance advice before the payment run).
   - Messages are rewritten to the new beats: short, each beat named by its screen and its Demo
     actions entry, no en or em dashes, no "Control Panel" instructions except the index, and the
     catalogue's vocabulary ("move", never "swap"; "session", never "slot"). The S2 text no longer
     says "vacated slot".
   - Vitest `demoScenarios.test.ts`: on a fresh store each `stage` returns `ok: true`; S3's Lists are
     SUBMITTED; S5 leaves a change set on Chen's History and a locked Contract version on Whitaker's
     Bookings; staging twice from reset gives deep-equal domain state (determinism); every non-null
     beat path matches one of the app's route patterns and names ids that exist in state; every
     title, blurb, message and label is dash-free and free of `swap`, `Permanent List`, `Card`,
     `slot` and `Copy booking`.
3. **Control Panel page reads the module** (`DemoControlPanel.tsx`): `ScenarioJumps` renders from
   `DEMO_SCENARIOS`. After a jump it shows the message and a numbered list of beat links ("Beat 1 ·
   Admin Intake"), each navigating to `path(state)` evaluated at click time (disabled with its reason
   when `null`). Keep the `scenario-<id>` and `scenario-confirm` `data-shot` hooks exactly. Keep
   "Clock & reset" and Phase 14's "Demo actions by screen" index; no trigger buttons on the page.
   Update the page subtitle. Rework the billing-assumption callout per item 6a.
4. **Trigger audit, in tests.**
   - Vitest `src/shared/demoTriggers/demoTriggerAudit.test.ts` (extends, does not duplicate, 14's
     `demoTriggers.test.ts`):
     - every entry with `badge: 'office-stand-in'` has `surfaces` exactly `['pwa']` and only
       `/mobile/...` routes (this covers the colleague stand-ins too: 32's "Colleague moves a List
       into my free session" and 32a's "Colleague moves a Booking to me", whatever badge their
       entries record);
     - every entry whose `surfaces` is exactly `['pwa']` has only `/mobile/...` routes (the PWA has
       nothing else; 43a's "Sign out" included); an entry on both surfaces may route elsewhere too
       (40a's `nhi-hub-mode` shows on mobile, web and Admin Add booking, 43a's "Show first-run hints
       again" on every app route), but it must have at least one `/mobile` route;
     - no entry declares a `/demo/control` route (the Control Panel is the index, never a trigger host);
     - no two entries visible on the same route **and the same surface** share a label (a bar entry
       and a PWA entry may share one, as Phase 27's "Move to 2 days before procedure" does);
     - every entry's `indexPath`, on the pristine seed **and** on each scenario's staged state, is
       `null` or matches one of its own `routes`;
     - no label from a withdrawn flow survives: 32 removed the cover-request flow (RV-15) and
       registers no swap or confirm entry (D7), so no label or description matches
       `/swap|cover request|offer cover|tap to ask/i`, and no id matches `/swap/` (the earlier
       plan's `swap-office-confirms` / `swap-office-declines` were never built under this plan); 15b
       removed Copy, so nothing matches `/copy (a )?booking/i`; 38b withdrew the addendum Booking, so
       nothing matches `/addendum/i` (38b re-pointed `stage-post-op`, which keeps its id); and no
       label or description says "slot" (`/\bslots?\b/i`, OQ-64). 33's PWA stand-in
       `matching-office-matches-row` **keeps its id** (34 re-pointed it): assert it carries 34's
       label ("Hospital sync delivers my booking", or whatever 34's entry records) and that 33's
       "Hospital row arrives and the office matches it" label is gone;
     - 15a's shared "Raise sample warnings" stages at least one sample per registered warning rule:
       every id in `WARNING_RULES` (`src/domain/warnings/rules/index.ts`) has an entry in
       `WARNING_SAMPLES` (15a's session 2 name, planned `src/store/warningSamples.ts`), and staging
       them all on a fresh store raises one open warning per rule. At plan time the rules are 15a's
       and 27's `prepaymentUnpaid`, 19's `baseUnitsOutsideGuide`, 21's `childBillableParty` and 40's
       `patientBalance` (with D24's mild credit-balance case, whether 40 built it as its own rule or
       a level of the same one); take the real ids from their entries; a rule without a sample fails;
     - every entry carrying `badge: 'future-scope'` is one of an explicit expected list kept in the
       test, with its expected surfaces: at plan time 15b's "Photo capture (Future scope)" (Mobile ·
       List, bar and pwa, US-02.4.4) and Phase 34's `fire-hospital-message` and
       `replay-hospital-message` (Future-scope surface routes only, `/demo/integrations...`),
       `auto-match` (`/admin/intake/matching`) and "Ingest PDF row" (Surgeon PDFs, US-02.2.1), all
       bar only; confirm ids and routes against 15b's and 34's entries. A new future-scope entry
       must be added to the list deliberately.
   - Playwright `aa-prototype/visual/demo-actions-audit.spec.ts` (framed build): for every row of the
     Control Panel index that has an "Open screen" link, click it and assert the harness bar's
     `[data-shot=demo-actions]` pill lists `[data-shot=demo-action-<id>]`; then open one screen that
     registers nothing (for example the web past-work calendar from 38a, which needs no trigger) and
     assert the pill is absent. An entry gated by a `when` that the screen alone does not satisfy
     (an `indexHint` step, or a published context key such as 40a's `nhi-hub-mode`, which shows only
     while an Add booking or NHI surface is open, or 39's entries on an invoice that must exist
     first) is either driven to that state by the spec or listed in an explicit, reasoned skip list
     in the spec; never skipped silently.
   - Playwright, PWA project (`visual/pwa-device.spec.ts`, or a new spec with the `pwa-device`
     `testMatch` and the `prototype` `testIgnore` widened to match it): sign in through 43a's screen
     first (or use 43a's test helper), then for each mobile screen (Lists and its past-work calendar
     and search, a List, a Booking and its events list, Availability and its calendar, Balances, More
     and the profile under it), assert the "Demo" chip is present or absent as the inventory (item 1)
     expects (item 12's parity matrix corrects the table in Session 2 if the handset pass disagrees),
     and that each expected entry's label is in the sheet. Keep the expected table in the spec, one
     row per screen.
5. **Guide-to-registry sync check** (Vitest, node `fs`):
   `src/shared/demoTriggers/demoGuideSync.test.ts` reads `../docs/demo-guide/03-demo-script.md` and
   `master-demo-guide.html` (tags stripped), resolved from the test file's own path, and skips with a
   clear message if the docs folder is absent. Convention for the rewrite (item 8): a harness-bar
   press is written **Demo actions → Label**, a handset press **Demo sheet → Label**. The test
   extracts every such label and asserts it is a registered label on an entry with the matching
   surface, and that every registered entry appears in the run sheet or in an explicit
   `NOT_SCRIPTED` list with a one-line reason (for example a diagnostic entry, or "Clear sample
   warnings", which only undoes a staging). This is the guard
   that keeps the guide honest as the catalogue keeps moving. **Timing:** the current run sheet does
   not use the convention, so write the test in Session 1 with its extraction unit-tested on a small
   inline fixture and the two assertions against the real files marked `it.skip` with a comment
   "enabled after the item 8 rewrite"; Session 2 un-skips them as soon as item 8 lands, and the
   phase does not close with them skipped.
6. **Stale copy sweep (RV-17).**
   a. **RV-17's sites** (grep each first; several were rewritten by 15b, 16, 21, 22, 27, 28, 32, 37
      or 38b, and a site that no longer exists is recorded as "already fixed by Phase NN"):
      - **Control Panel callout** (`DemoControlPanel.tsx:226-229` at plan time): both time-rule
        caveats go (OQ-50 and OQ-75 answered, US-05.2.2 Confirmed, D25). Relabel "Billing
        assumption" as "Billing rule" and state, with no caveat and no "to confirm": "Time units
        come only from the RVG rule: 1 unit per 15 minutes for the first two hours, then 1 per 10
        minutes, and a part interval always rounds up." If 19a exposes the tiers as data with a
        label or formatter, word the sentence from that, so the callout cannot drift from the tiers.
      - **T stepper caption** (`UnitsCard.tsx:68`, wherever it still renders): drop "(assumption)":
        "From start and finish · RVG rule: 1 unit per 15 min or part, then per 10 min after 2 h".
        It carries no caveat.
      - **Reassign List flow** (`ReassignListFlow.tsx:31,112`, reworked by 28, 30 and 32): no
        "Proposed reading", "the RFP leaves ... open" or "replaceable" copy, and no "free slot".
        OQ-08 is answered; the move between sessions is the mechanism. The status the vacated
        session takes is OQ-84, still open: keep the label 32 (or 28) gave it, citing OQ-84 and
        naming its default ("free" when the office reassigns), and never present it as settled.
      - **Billing monitor** (`BillingMonitorScreen.tsx:107-111,203`): FT-13.3 is **Confirmed**, so
        the placement is stated plainly ("The office's billing monitor, in the Admin App"), with no
        "proposed" and no "the RFP leaves open". Phase 37 rewrites this subtitle and Phase 40 owns
        the "Prior balance" sentences and the `:203` tooltip (RV-21); if any survive, that is a
        Phase 37 or 40 regression for item 12 (fix only if small), not new work here. The unpaid
        balance counts from the invoice date (OQ-74, D24), stated as the rule wherever the threshold
        is described. 39a's payment-run controls sit near here too: check their copy states
        US-10.2.6's approval step plainly and names the payment day as provisional only while OQ-47
        is open.
      - **Booking detail post-op and immutability copy** (`BookingDetailBody.tsx:486,680` at plan
        time): 38b withdrew the addendum Booking, so the "Post-op addendum" banner and "the RFP
        immutability answer" should be gone. Anywhere an AUTHORISED Booking is described as locked,
        state it as the design (US-07.3.2, Proposed: "locked once authorised; later work is an event
        on the Procedure"), never "the RFP immutability answer". A survivor is a 38b regression.
   b. **Further hits, same treatment:**
      - **Invoices screen subtitle** (`InvoicesScreen.tsx:89`): FT-08.2 is Proposed, so the label
        stays fair but its wording changes: state it as the design, "one invoice per billable party
        within a Booking, the billable party set by each Procedure's Contract (proposed)" (D17), with
        no "discovery question", "RFP split billing wording", "funder" or "Card". (Phase 21 or 22 may
        already have done this.)
      - **Invoice document GST footer** (`InvoiceDocument.tsx:216`): prices are held GST exclusive
        and GST is added at the NZ standard rate (US-05.2.7, Proposed): the design, so "proposed"
        may stay but "demo assumption" and "discovery item" go. Phase 22 made layout and GST
        Contract-driven (and Phase 18 added GST incl/excl on fee lines), so word the footer to what
        22's entry says the invoice now shows. Keep Phase 22's provisional agency wording (OQ-29) and
        the provisional BCTI wording where they sit.
      - **Invoice document prepayment text** (`:510-511`): drop "the agreed deposit", "payment is
        required before the procedure proceeds" and "a discovery point" (D5, D6 answered; 27 and 41
        should already have rewritten it). State the answered rule: the system generates the
        prepayment invoice when a Procedure matches the anaesthetist's prepaid list and a person pays
        for the patient (D23), holds it until the office approves and sends it, and it is an
        estimate (US-06.2.3); the balance is invoiced after authorise, always, per OQ-61's
        recommendation (still open, so labelled provisional, in 27's words); a prepaid amount above
        the final is accepted with no credit (OQ-03, 27 and 41).
      - **Xero pair fee line** (`DemoXero.tsx:499`, "% prototype assumption"): Phase 16 took the fee
        off the payable and should have removed this line. D1 is answered, so any surviving fee note
        on the AA fee pair states the rule (fixed charges plus a charge per BCTI, from the AA fee
        settings) and labels as provisional only what is open: what the per-BCTI charge counts
        (OQ-60) and the BCTI granularity (one per receivable invoice built, "one per procedure"
        unresolved). Never "prototype assumption" or "the RFP does not specify".
      - **Xero NHI callout** (`DemoXero.tsx:60`, "an unresolved contradiction needing an AA ruling"):
        Phase 16 rewords it for US-09.3.1. Confirm it states the settled rule (OQ-30: no PII in Xero,
        only a unique ID that links transactions back to our invoices) with no caveat; if not, that
        is a Phase 16 regression for item 12.
      - **Xero duplicate-number callout** (`DemoXero.tsx:65`, "an open item to confirm in
        discovery"): no OQ covers it, so state the requirement plainly (the Xero organisation setting
        that prevents duplicate invoice numbers) and drop "discovery".
      - **NHI validator note** (`IntegrationMonitorScreen.tsx:424-425`, or wherever Phase 34 moved the
        Validators tab, and 40a's lookup validation if it repeats it): **keep** the mod-11 flag,
        because US-11.1.2 still says "modulus 24". Reword "The RFP labels" to "The requirement
        labels" and "a discovery item" to "flagged for AA to confirm". Tell the owner the catalogue
        text still needs correcting.
   c. **Wider sweep.** Grep `aa-prototype/src` and `aa-prototype/pwa` (excluding tests) for `RFP`,
      `open question`, `discovery`, `assumption`, `proposed reading`, `to confirm with AA`,
      `prototype's proposal`, `immutability answer` and `Type 1|Type 2|Type 3|billing route|addendum|5%|service fee|deposit`,
      and for the retired vocabulary `swap|Permanent List|timesheet|cover request|Card\b|Copy booking|\bslots?\b`
      (each a regression of the phase that owned it: 15, 15b, 28 to 32, 38b; fix if small).
      **"slot" in rendered copy** (OQ-64, D14) is the biggest of these: Slot stays an identifier,
      type and planning word, but no label, heading, button, tooltip, toast, empty state, demo
      trigger label or scenario message says it; use "session", "AM" or "PM" (and the Slot status
      master's labels for statuses). Separate identifiers (`slotFor`, `selectedSlotId`, `data-shot`
      values, route params) from copy before counting a hit. Also check that the submit path has no
      confirm step for a warning and the triangle no tap-to-read (US-13.7.3, 15a; a survivor is a 15a
      regression). Classify every rendered hit:
      - **settled in the catalogue** (an Answered OQ, an answered owner decision D1 to D8, D10 or
        D12 to D25, or a Confirmed item): state the rule plainly, with no provisional label;
      - **still open** (an Open OQ at HEAD, D9, D11, or the BCTI granularity point): keep it,
        labelled "provisional" or "to confirm with AA", citing the catalogue OQ id (or "BCTI
        granularity, with OQ-29 and OQ-60"), not "the RFP". At plan time this includes OQ-89 on the
        Contract defined rate (24's label), OQ-84 on the vacated session's status (32), OQ-79 on what
        posts to the notification pool (32), OQ-85 on how a single Booking moves (32a), OQ-83 on the
        sign-in experience (43a), OQ-77 on the rebill total (39), OQ-60 on the fee count (16), OQ-61
        on the balance invoice (27), OQ-43 on the blacklist wording (17, 31), D9 (38) and D11 (40);
      - **Proposed** catalogue item: the design ("proposed"), never "AA confirmed", never "open
        question";
      - **Future**: the "Future scope" badge (Phase 14's `DemoBadge` tone), never "open question".
      Never describe as settled anything still open, the BCTI count included. Update code comments that
      cite a superseded ruling (`timeUnits.ts:7-11` now cites OQ-50 and OQ-75 answered and US-05.2.2
      Confirmed, `prepaymentActions.ts:17-18`, `agencyFee.ts:4`, `invoiceBuild.ts:34`,
      `reviewFlags.ts:5-9`, `types.ts:388,564`, `rvgCodes.ts:8`, `modifierCodes.ts:6`,
      `paymentActions.ts:20-22`, `bookingActions.ts:181,278`, `surface/context.ts:92`, `nhi.ts:4`,
      `ReassignListFlow.tsx:31-32`, each wherever it now lives, if the owning phase did not) to cite
      the catalogue item or OQ; no behaviour change.
   d. **Copy guard test** (`aa-prototype/src/appCopy.test.ts`, modelled on the label-coverage scan in
      `auditNarrative.test.ts`, via `import.meta.glob(..., { query: '?raw' })`): read every
      `src/**/*.ts(x)` and `pwa/**/*.ts(x)` except `*.test.*`, strip `//`, `/* */` and JSX `{/* */}`
      comments, and fail on:
      - `–` or `—` anywhere in what remains (string literals and JSX text);
      - `/RFP (open question|leaves|labels|is silent|does not (state|specify)|defines the tiers)/i`,
        `/open RFP question/i`, `/RFP('s)? immutability answer/i`, `/discovery (item|question|point)/i`,
        `/\(assumption\)/i`, `/(demo|prototype) assumption/i`, `/proposed reading/i`,
        `/to confirm (with AA )?in discovery/i`;
      - the retired words in rendered copy: `/\bswap(s|ped)?\b/i`, `/Permanent List/i`,
        `/timesheet/i`, `/cover request/i`, `/Copy (a )?booking/i`, `/addendum/i`;
      - `/\bslots?\b/i` in **rendered copy only**: JSX text, and string literals that contain a space
        (sentence-like copy, labels, messages), so identifiers, `data-shot` values, kebab ids and
        context keys do not trip it. Keep the narrowing rule in a tested helper with fixtures for
        both sides ("Reassign to a free slot" fails; `'adminDay.selectedSlotId'` and `'slot-am'`
        pass).
      Seed each pattern from a real plan-time hit (the grep in the Reference list: "part intervals
      round up (assumption)", "The RFP defines the tiers but not the rounding", "a demo assumption",
      "% prototype assumption", "The RFP labels", "an open item to confirm in discovery", "the RFP
      immutability answer", "Copy booking", "vacated slot") so a unit test proves the guard would
      have caught it.
      An allowlist keyed by file and phrase holds the kept caveats, each with a one-line reason and
      its OQ id or catalogue item (the NHI mod-11 flag, US-11.1.2). An entry whose OQ is Answered at
      HEAD is deleted, not kept: there is no OQ-50, OQ-75 or OQ-30 entry.
      **Must-keep list** in the same test: assert the live caveats are still present, so a sweep
      cannot remove them by accident: the provisional BCTI granularity label wherever 16 and 22 put
      it (the AA fee settings or run, and the ACCPAY), the OQ-89 label on the Contract defined rate
      (24), the OQ-84 label on the vacated session's status (32), the D9 and D11 labels (38, 40) and
      the NHI mod-11 flag. Take the exact strings from the built screens. Assert too that the
      Control Panel callout states the rounding rule and carries no "confirm" wording.
7. **Re-baseline the figures (no code).** From **Reset → Confirm reset** (and from each scenario jump),
   walk every beat on the framed build and write down every figure and identifier the guide will
   quote, read from the screen: invoice numbers and totals, GST, the payable, the AA-FEE invoice total
   and its line items (the $500 + $5 x 40 = $700 example for Dr Rutherford after "Seed a month of
   BCTIs", and Dr Souter's own month), the BCTI counts, ledger tiles and the imbalance amount, the
   payment run's approved total and the remittance advice lines (positives, the netted negative, the
   net paid), the credit note and rebill numbers, the additional invoice and the event invoice lines,
   the prepayment estimate (with its contingency units) and part-paid amounts, the overpaid
   prepayment's recorded excess, the payable after a single-Booking move, the 3/2/2 split and base
   units (and which default RVG Contract they came from), warning counts on the to-do list,
   notification pool rows, conflict and Draft List counts, waiting times, sync times. Never compute a figure by hand; where two surfaces
   show the same figure, they must agree, and a disagreement is a bug for item 12. The table goes
   into the PROGRESS entry, with the BCTI-dependent figures marked so a granularity flip re-baselines
   them in one place.
**End of Session 1:** build, build:pwa and Vitest green (the item 5 file-level assertions still
skipped); the draft Phase 44 PROGRESS entry holds the drift-check result, OQ list, D1 to D25 table,
inventory and figures table; hand back with a note that Session 2 starts at item 8.

### Session 2: documents, QA and close-out (items 8 to 13)

Start by reading the draft Phase 44 PROGRESS entry and re-running the drift check (the catalogue may
have moved between sessions).

8. **Rewrite `docs/demo-guide/03-demo-script.md`.** Keep the house structure: the one continuous
   object, Pre-demo setup, Direct URLs, then each scenario's **Serves**, **Time**, **Stage it**, beats
   with **Click / Say / Expected** (and **Worth pointing at** where useful), and **Discovery points**;
   then Recommended run orders, What to narrate rather than click, Recovery from demo accidents.
   New rules for this rewrite:
   - Beats are numbered 1, 2, 3 with no letters; optional material is a clearly marked
     **Optional aside** after the beat it belongs to, with its own Click / Say / Expected.
   - Every beat with a mobile side carries a **Handset:** line naming the PWA path (Demo sheet →
     Label, or "self-contained").
   - Demo presses use the item 5 convention (**Demo actions → Label**, **Demo sheet → Label**).
   - Answered owner decisions (D1 to D8, D10, D12 to D25) and answered OQs (OQ-62 to OQ-75 among
     them) are told as the rule, with no caveat. Every provisional reading (D9, D11, an open OQ, the
     BCTI granularity) is named as provisional with its OQ or D number, in the UI's words.
   - Catalogue vocabulary in everything the audience hears: "session", "AM" or "PM", never "slot"
     (Slot stays the planning word in the mental-model explanation only, OQ-64); "move", never
     "swap"; "event" for everything recorded against a Procedure after setup, in the label 38b chose.
   - Discovery points list only questions open at HEAD, by OQ id and title.
   - Then un-skip `demoGuideSync.test.ts` (item 5) and make it pass.

   The target shape (confirm each beat and its order against the inventory; merge, trim or move to
   an aside if a scenario would run over its time):

   | Scenario (time) | Core beats | Optional asides |
   |---|---|---|
   | **S1 · Booking to theatre** (8 to 9 min) | 1 **Sign-in** on the handset: Dr Souter signs in with her account, PWA first (43a, US-13.5.3; the sign-in experience beyond that is OQ-83, provisional in 43a's words); the framed phone is already signed in. 2 The booking arrives by **sync, then match**: Mobile Tue 28 Jul AM (three booked); Admin Intake, Demo actions → Simulate sync (34; the download format per hospital is OQ-13), Sarah Mitchell's row, patient reused by NHI, Create Booking with the Contract picked from the list filtered by procedure then hospital, the default RVG Contract always offered (20, D16); her unpaid balance raises the mild or strong warning at booking, counted from the invoice date (40, D24), waved through: script it, do not hide it; back to Mobile for the fourth Booking. 3 The day arrives (clock; the catch-up sync applies nothing silently). 4 Capture on mobile: the procedure-first pick from the master procedure list, base units from the procedure's default RVG Contract (19, 19a, D12; one list or two is OQ-88, provisional), default modifiers pre-filled, the one primary Procedure, no Contract complexity and no fee on the anaesthetist's screen, time units by the RVG rule with a part interval always rounded up (D25, stated as the rule), the Contract's required inputs checked at Mark complete (21), and submit straight through with no confirm step (15a, US-13.7.3); **Worth pointing at:** the point-of-need help on capture and the first-run hint (43a). 5 **Find past work**: the calendar jumps to a past month and drills to List, Booking and Procedure; search "Mitchell" or her NHI (38a). | A failed sync loses nothing (34). The other providers' sheets and the Future-scope auto-match (34). Any base units accepted, with the after-procedure office warning (19, D3). A pre-op event at capture, such as the ACC pre-op assessment as a fixed fee, shown in the Procedure's events list (39b; the ACC pre-op codes are OQ-12). |
   | **S2 · Office day** (11 to 13 min) | 1 Read the day: sessions and Lists (the List shown in place of the status), the session statuses from the user-maintained status master with their own labels and colours (29, D14), booking counts, the Draft Lists band; **Worth pointing at:** the help on Admin Day (43a). 2 **Warnings on the to-do list**: Demo actions → Raise sample warnings, mild and strong, the triangle on a Booking in each app, the warning visible on opening the Booking (no tap-to-read, no confirm step at submit), Clear; never a block (15a, with 19, 21, 27 and 40's rules). 3 **A recurring clash becomes a Draft List**: Demo actions → Stage recurring clash on Master data · Recurring bookings (31, US-01.3.2, D14); then **Draft List assign with the waiting flag**, with the **blacklist warning** on the picker (31, 17; its wording provisional, OQ-43). 4 Illness cover from the **conflict dashboard** (30; short-notice sickness is OQ-81 part 3, provisional), then the **on-demand update email**: the Booking's button, one or more changes picked from the change history, the template for that kind of change, to the rooms or the hospital (35, D19, US-02.3.4; automating it is OQ-82). 5 **An anaesthetist moves their own List** (32, D7): on the phone Dr Souter returns a List to the office and it lands on the Day band as a Draft List, no confirmation; marking a booked session unavailable offers **return to the office or assign to a colleague**, with the blacklist prompt (US-01.5.5, D14); each move posts to the **shared notification pool** (D15; what else posts, and expiry, is OQ-79), and from the notification the office sends the cover-change email (35); the vacated session's status is OQ-84, provisional; Demo actions → Colleague moves a List to the office for the office view in the framed build. 6 **An anaesthetist moves a single Booking** (32a, US-01.4.7): Move to a colleague, found by search, only onto an available session, landing on the colleague's List (created if needed), the payable following the doer (US-01.4.6) and a pool notice (how a single Booking moves is OQ-85, provisional). 7 Authorise a submitted List: every Contract shown and approved, the adjustment and override layers, the help on Review (21, 24, 43a). | A phone-advice booking into a free session (28). Availability weeks ahead from the phone's calendar (29). Simulate sickness, and move a holiday (30). Simulate incoming request (31). A colleague moves a List into Dr Souter's free session (Demo sheet → Colleague moves a List into my free session, 32) or a Booking to her (Demo sheet → Colleague moves a Booking to me, 32a). Stage child billed directly: a mild warning only (21, D4). |
   | **S3 · Money end to end** (9 to 11 min) | 1 Authorise; the run locks each Procedure's Contract version, base-unit source, rate, adjustment and payee, and raises and sends every invoice in Dr Souter's name with AA as agent (22, 25). 2 The Xero pair: the payable equals the receivable; one BCTI per receivable invoice, labelled provisional (BCTI granularity, with OQ-29 and OQ-60); buyer-created wording provisional (OQ-29); no patient name in Xero, only the hidden ID (16, 22, OQ-30). 3 Payment, ledger and disbursement detected from Xero; the processing monitor grouped by anaesthetist with sorting and filters (37, US-13.3.1); the web financial position and the flat outstanding list (D8) move (36, 38). 4 **The payment run**: approve the period's BCTIs, run payables, the remittance advice in Admin and web Accounts (39a; the payment day is OQ-47). 5 **AA's monthly fee run** (D1): the fee settings, Demo actions → Seed a month of BCTIs, run the monthly fee invoices, Dr Rutherford's $500 + $5 x 40 = $700 (figures as re-baselined), shown in web Accounts; what the per-BCTI charge counts is provisional (OQ-60) (16). 6 The ledger balances: an unmatched receipt, then allocate (36). | The 3-procedure Booking, 3/2/2 (an uneven split is OQ-15), Make primary and a combination Contract (23). The Contract payment setting, full or split, with each share a typed $ or % set on the Booking (22, D18). A Contract defined rate pricing the whole Procedure (24; OQ-89, provisional). Billed Lists stay visible (38, D9 provisional). The cash-basis GST schedule (38). Record fee payment on the AA fee pair (16). |
   | **S4 · Exceptions** (12 to 14 min) | 1 Prepayment from the prepaid list (D5, D6, D23): the system generates the invoice at setup only where a person pays for the patient, worded as an estimate (US-06.2.3), the office approves and sends it, part paid, the warning in both apps, visible on opening, no gate and no confirm step (26, 27; contingency units OQ-38, when the pair is created OQ-80, the balance always invoiced per OQ-61's recommendation, each provisional). 2 **An overpaid prepayment billed cleanly**: Demo actions → Stage overpaid prepayment on Admin · Review, authorise: no invoice, no failure, the excess recorded and shown as accepted with no credit (27, 41). 3 **Events on a Procedure** (38b, 39b, D13): the **events list** on the Procedure in each app (US-03.7.3); a **post-op event** from the phone, one standard review step, travelling with the Procedure's invoice before approval or invoiced in the next run (Demo actions → Run the next billing run). 4 An **additional invoice to any billable party**, free-form lines, recorded as an event (38b, D10, D22). 5 Billing failure on a missing required input, and retry (25). 6 **The credit note option and credit-and-rebill** (39, 39a, D22): credit the original to any party; after the anaesthetist was paid, Demo actions → Stage refund after payout, Credit in full and rebill from a copy of the original's lines (a product button, US-08.6.6), the negative invoice, then Demo actions → Stage a payment period, approve, and the negative **netted on the remittance advice** (the rebill total and the payable reversal are OQ-77). 7 The date approaches: the warning strengthens (27; last, because it moves the clock). | The unmatched queue (33). A partial payment releases exactly what was received (16, 36, 37). Split a combined Procedure by a credit then one invoice per component (39). Xero outage, a void made in Xero, bulk hospital remittance (37). Prepayment letter and reminder, the trust account, refund on cancellation, and a moved prepaid Booking keeping its agreed amount with only the payable half moved (41, D20). |
   | **S5 · Compliance tour** (7 to 9 min) | 1 The audit trail: change sets and View as at (35). 2 NHI at entry: **NHI lookup** with validation and the Hub states (Demo actions or Demo sheet → Hub: Unavailable, then the manual fallback) (40a); the new-format NHI validates on the synced row; the **missing-NHI problem list** with attach and merge, and the authorise guard (40, D11 provisional). 3 No NHI in Xero, stated as the rule (OQ-30: only a unique ID links back), and the NHI leak scan (16, 43). 4 Contract versions and the lock: end-date Health NZ, Regenerate from locked data (25; which date decides the price in force is OQ-48). 5 **Authorise, then edit the unit value: the invoice is unchanged** (25, 26). | Sign out and back in on the handset, audited (43a). Simulate sign-in attempts (14). Restricted raw-row view and the synthetic-data badge (43). A controlled go-live load (42). The patient view and its follow-up actions (40). HPI CPN shown the same everywhere and refresh from the NHI register (40a). |

   Also rewrite: **Pre-demo setup** (the Control Panel is the index; demo actions live in the bar on
   each screen and in the Demo sheet on a handset; "Play the office" off by default), **Direct URLs**
   (regenerate every table from the routes as built: the sign-in screen, Booking routes and the
   events list, Intake, Draft Lists, Recurring bookings, Conflicts, the notification pool, the to-do
   list, AA fee settings and runs, the payment run and remittance advice, Ledger and the trust
   account, profile, past-work calendar and search, Accounts sub-tabs, the Future-scope surface; drop
   dead ones such as `/web/accounts/overdue` and any swap queue, except as a redirect note), **How
   to read the readiness** (every catch-up phase built; the provisional readings listed: D9, D11, the
   open OQs a beat touches, the BCTI granularity), **Recommended run orders** with the new times,
   **What to narrate rather than click** (Future scope: HL7 v2, FHIR R4 and near real time, warning
   settings (US-13.7.4), booking from a photo (US-02.4.4), surgeon PDF upload (US-02.2.1), automated
   change application and reschedule rules (US-02.5.x), two people editing one Booking (US-02.5.6);
   a negative invoice with no later payment, handled outside the system (D21); real Xero, email and
   OCR; the full-scale point now has 43's load), and **Recovery from demo accidents** (the Control
   Panel's beat links and "Open screen" links; stuck draft: Discard; imported twice: nothing new
   added; samples raised twice: Clear sample warnings; a List moved by mistake: move it back from the
   same sheet, the pool keeps both notices).
9. **Bring the other guide files into line** (one consistency pass each; subagents can draft 01, 02
   and 04 in parallel from the rewritten 03 while you check them):
   - `04-presenter-cheat-sheet.md`: the five nouns and "Terms not to use" in catalogue vocabulary
     ("slot" (say session, AM or PM), "swap", "Permanent List", "timesheet", "Card", "Copy booking",
     "addendum", "deposit" among them); lifecycle and permissions; one Contract per Procedure, found
     by procedure then hospital or by its AA code, and the Contract as the definer of the billable
     party, base units on the procedure's default RVG Contract, required inputs, the multi-procedure
     rule, the defined rate, adjustment and override, the lock; warnings, never blocks, seen on
     opening the Booking; the shared notification pool beside the to-do list; the money model on the
     ledger with the payable equal to the receivable, the AA fee as its own monthly invoice, payment
     runs with netting; prepayment from the prepaid list, only for a person paying for the patient;
     events (additional invoices, credits, pre-op and post-op) with one review step;
     "Present but honestly demo-only" (Demo actions menu, Demo sheet, office stand-ins, "Play the
     office" off by default, Future-scope surfaces, the synthetic-data badge); the "RFP ambiguities"
     section becomes **"Open questions to raise"**, one entry per OQ open at HEAD that a beat
     touches, with its recommendation, plus the BCTI granularity point for AA's accountant; likely
     evaluator questions re-answered, including "what if the office never confirms?" (it doesn't
     need to, D7), "who finds out when an anaesthetist moves a List?" (the shared notification
     pool, D15), "can I move just one Booking?" (yes, 32a), "can a warning stop me?" (no) and "can I
     copy a Booking?" (no: retired, US-02.4.3).
   - `02-workflows-and-handoffs.md`: every workflow re-read end to end against the app (schedule
     canvas with sessions painted from availability first, then recurring bookings, a recurring clash
     becoming a Draft List; intake by sync and matching; Draft Lists; cover by conflict or the
     anaesthetist's own move of a List or a single Booking, with return-or-assign and the notification
     pool; the on-demand update email; capture with events, warnings and the to-do list, submit and review,
     billing run and lock, ledger and Xero, payment runs and netting, the AA fee run, exceptions,
     finding past work), and the readiness table (every row built, with its phase).
   - `01-personas-and-responsibilities.md`: duties and permissions as built (profile, prepaid list,
     sign-in, moving their own List or a single Booking, events, past work; the office's matching,
     Draft Lists, conflicts, the to-do list and the notification pool, the update email, approvals,
     payment runs, the fee run, ledger, additional invoices, credit notes and rebill; the intake
     operator; Tama R. as the demo-only second office user).
   - `docs/demo-guide/README.md`: the product description and mental model (Slot, List, Booking,
     Procedure, Contract, event; a Slot is a status container a List goes into, shown on screen as a
     session), **Source priority** (the catalogue first, then the PROGRESS Decisions log,
     then the code; the RFP is historical input), the readiness snapshot with its real snapshot date, and the best demo shape.
   - Grep all five files for stale vocabulary and remove it unless it is deliberate (a "Terms not to
     use" row, a Future-scope note): `Card` (except "the physical booking card"), `billing route`,
     `Type 1|2|3`, `addendum`, `5%`, `net payable`, `service fee`, `Overdue`, `mirror`, `gate`,
     `deposit`, `swap`, `cover request`, `Permanent List`, `timesheet`, `slot` outside the
     mental-model explanation, `Copy booking`, `photo` or `PDF upload` as in scope, `prompt` for the
     update email, `Resolve & retry` (if renamed), `MSG-`, `PID-2`, `HL7` or `FHIR` outside
     Future-scope notes, `Surgeon TBC`, `Funder allocation`, `two-funder`, `billable-party override`,
     `carry forward`, and any answered OQ called open (`OQ-30`, `OQ-50`, OQ-62 to OQ-75), `OQ-37`,
     `OQ-51`.
10. **Regenerate `docs/demo-guide/master-demo-guide.html` in full** from the rewritten Markdown. Keep
    the shell: the tab bar (Learn, Overview, Personas, Workflows, Script, Cheat sheet, and the
    discovery tab relabelled **Open questions**; keep its `data-panel="discovery"` id, or rename it
    together with every script and link that targets it), the tokens in `:root` (transcribed from Design Language), the
    "Print S1 to S5" handout (every scenario on a fresh page), the collapse details, and the rule that
    it is self-contained (no network, opens from the file system). Rewrite every tab's content:
    - **Learn it, gently**: the one-breath summary, the shape of it (Slot, List, Booking), the five
      nouns, the life of a List, the quiz (new questions on Booking, Contract, warnings, ledger and
      the AA fee; every answer true of the built app), and **Now drive it** re-written to the new S1
      Beat 1 to 5 click path. The "shape of it" explains Slot once as the planning word and then says
      session, as the app does.
    - **Overview, Personas, Workflows, Script, Cheat sheet**: the rewritten Markdown, word for word
      where the Markdown is prose, the same figures and labels everywhere.
    - **Open questions**: the OQs open at HEAD that a beat touches, id, title, the prototype's
      provisional reading and the recommendation, plus the BCTI granularity point; no question that
      is answered (OQ-30, OQ-50 and OQ-62 to OQ-75 are gone from it).
    - Check it in a browser: every tab, the print preview, the wizard, and the status-colour legend
      (the Slot status master as seeded, with the `statusColours.ts` tokens, and the warning
      triangle's mild and strong treatments).
11. **Docs beside the guide.**
    - `aa-prototype/README.md`: the Control Panel paragraph (index plus scenario jumps with beat links),
      the Demo actions and PWA sheet sections as finally built, and the Office simulation section.
    - `requirements-board/capture/ATLAS.md`: the "Scenario jumps" table (what each jump stages and its
      story; at plan time it still says S1 fires `fire-hospital-message` on Mobile Lists, which 34
      moved to the Future-scope surface) and the "Demo actions by screen" table (Phase 14's name; it
      lists only Phase 14's entries at plan time). Capture recipes whose `{ "scenario": "Sn" }`
      expectations changed are checked and re-pointed in the Catalogue screenshots final sweep
      (below). Run `npm run verify:board` if any board file changed.
    - Tell the owner (do not edit without their say-so) that `CLAUDE.md`'s "Current state" paragraph
      and its `PERSIST_VERSION` number are stale after the catch-up, with the suggested wording.
12. **Full QA pass.**
    - **Framed build** (`npm run dev`, desktop width): run S1 to S5 exactly as written, once from
      **Reset** and once from each scenario jump, pressing only what the script says. Every Expected
      line holds; every figure matches item 7; every Demo actions entry the script names is on that
      screen and nowhere it should not be.
    - **Handset** (`npm run build:pwa`, then `npm run preview:pwa -- --host` (the PWA config sets no host) opened on a real phone on the local
      network, or `npm run dev:pwa` at the `pwa-device` viewport of 393x660 if no phone is available;
      say which in the PROGRESS entry): with "Play the office" OFF, run every beat that has a mobile
      side using only the handset and its Demo sheet. Fill the **parity matrix**: one row per beat,
      columns mobile side (yes or no), handset path (the sheet entry or "self-contained"), result.
      Expected PWA entries (planned labels; the inventory and each entry's name map win): Sign out
      on every mobile route, and Show first-run hints again on both surfaces (43a); Office authorises
      this List (14, re-worded by 38); Payment received · full / half on Balances (14, 36); Raise
      sample warnings and Clear sample warnings on a Booking, and Office clears this warning (15a);
      Photo capture (Future scope) on a List, badged (15b); Office approves this Contract change (20,
      21); Office approves and sends the prepayment invoice, Patient pays half / full of the
      pre-payment, Move to 2 days before procedure (27); Office assigns a List to my next free session
      (28); Office assigns a Draft List to me (31); Colleague moves a List into my free session (32);
      Colleague moves a Booking to me (32a); Hospital sync delivers my booking (34, re-pointed from
      33's row-match stand-in); Office edits this Booking (35); Office runs payables (36, re-worded by
      38, re-pointed by 39a); Stage post-op scenario and Office reviews this event (39b); Office
      attaches the NHI (40); Hub: Available / Slow / Unavailable (40a, on both surfaces); Office sends
      a pre-payment reminder, Office refunds this pre-payment from the trust account (41).
      Self-contained on the handset: signing in (43a), the anaesthetist's own List move, return to
      the office and return-or-assign on marking a booked session unavailable (32), Move to a
      colleague for a single Booking (32a), the events list (38b), finding past work (38a) and the
      point-of-need help (43a). Phases 16, 19, 19a, 26, 29, 30 (its "Office reassigns this List"
      stand-in was dropped), 37, 38b, 39, 39a's own entries, 42 and 43 planned no PWA entry (no
      mobile beat, or none that waits on anyone); record each as "no PWA stand-in required" in the
      matrix. There is no swap confirm or decline stand-in any more (D7), and no Copy entry (15b).
    - **A beat with a mobile side and no handset path is a gap.** If an existing store action covers it,
      register a PWA-only office stand-in following Phase 14's contract (body in `src/shared` or
      `src/store`, `badge: 'office-stand-in'`, disabled state, dash-free copy) and add it to the audit
      tests. Otherwise log it for the owner. Do not add scenario jumps to the PWA; its reset on More is
      the stage step.
    - **Regressions:** fix small ones here, with a test. Log anything larger in the PROGRESS open-items
      handoff for the owner rather than growing this phase.
    - `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.
13. **Close-out:** the adversarial review, the Catalogue screenshots final sweep (below), then PROGRESS.md.

## Demo triggers

This phase **adds no harness-bar trigger** and nothing to the Control Panel page. It audits the
registry that Phases 14 to 43a filled, beat by beat:

| Check | Where | How |
|---|---|---|
| Every entry shows only on its own screen | Harness bar, framed build | `demo-actions-audit.spec.ts` (item 4): each index row's "Open screen" lands on a screen whose pill lists it; an unregistered screen shows no pill |
| The Control Panel is only the index | `/demo/control` | No entry routes there (Vitest, item 4); the page holds Clock & reset, Scenario jumps with beat links, and "Demo actions by screen" |
| Office and colleague stand-ins are PWA only | PWA sheet | Vitest (item 4): `office-stand-in` and PWA-only entries mean `surfaces: ['pwa']` and `/mobile` routes only; a both-surface entry (40a's Hub) has at least one `/mobile` route |
| Withdrawn flows left no entry | Registry | Vitest (item 4): no swap, cover-request, Copy or addendum entry or label, and no label or description says "slot"; 33's row-match stand-in keeps its id with 34's label |
| Future-scope entries are deliberate | Registry | Vitest (item 4): every `future-scope` entry is on the test's expected list (15b's photo entry, 34's Future-scope intake entries) |
| Every warning rule has a sample | "Raise sample warnings" | Vitest (item 4): one sample per registered rule |
| Every scripted press exists | Run sheet and master guide | `demoGuideSync.test.ts` (item 5) |
| Every beat with a mobile side runs on a handset | PWA, real phone | The parity matrix (item 12) and the PWA spec's per-screen table (item 4) |

**PWA equivalents:** none new by plan. If the parity matrix finds a mobile beat with no handset path,
item 12 says when to add a PWA-only stand-in and when to log it.

**Scenario jumps (not triggers):** S1 to S5 on the Control Panel, rebuilt in items 2 and 3, each
followed by one deep link per beat.

## Out of scope

- Any new product behaviour, and any change to billing maths, lifecycle guards, the ledger, the BCTI
  count function, or the seed's content (beyond a scenario-staging need, which bumps `PERSIST_VERSION`).
- Reworking a feature whose open decision (D9, D11) or OQ was answered after its phase ran: script it
  as built, label it provisional, raise it with the owner.
- Re-grading the gap analysis or moving the `3d3a18c` snapshot (the ROADMAP's "When the catalogue
  changes" procedure owns that).
- Settling the BCTI granularity: it stays provisional, and a flip is re-baselined in one place by the
  owning phases' count function, not here.
- Future-scope and Retired items (HL7 v2, FHIR R4, near real time, warning settings US-13.7.4,
  booking from a photo US-02.4.4, surgeon PDF upload US-02.2.1, automated change application
  US-02.5.x, concurrent edits US-02.5.6; Copy a Booking US-02.4.3 and the conditional positioning
  modifier US-05.2.3, both Retired) beyond keeping their badges, absences and narration honest.
- Anything for a negative invoice with no later payment (D21, OQ-71: handled outside the system).
- Catalogue screenshot work beyond the final sweep in the "Catalogue screenshots" section below (no
  new stories to cover; the sweep is a check and a correction of what exists).
- Scenario jumps or a scenario picker on the PWA.
- Editing `CLAUDE.md` without the owner's approval.
- Fixing large regressions found in the QA pass (logged, not fixed).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Drift check run against `3d3a18c` (in both sessions); the OQ list and the D1 to D25 branch
      table are recorded; nothing the guide or the app calls settled is an Open, Confirm or Proposed
      OQ at HEAD, and no Proposed, Open or Verify requirement is described as AA confirmed; answered
      decisions (D1 to D8, D10, D12 to D25) and answered OQs (OQ-30, OQ-50, OQ-62 to OQ-75 among
      them) carry no provisional label.
- [ ] Control Panel: each of S1 to S5 jumps after "Confirm jump", shows its message and one link per
      core beat; every link lands on the right screen (a `null` link is disabled with its reason); no
      trigger buttons on the page; "Demo actions by screen" still lists every entry.
- [ ] S1 to S5 run end to end on the framed build **from Reset**, exactly as written, with every
      Expected line and figure matching.
- [ ] The new beats run as written: sign-in on the handset; the to-do list (raise samples, the
      triangle in all three apps, the warning visible on opening the Booking, submit with no confirm
      step, Clear); a recurring clash becoming a Draft List; Draft List assign with the waiting flag
      and the blacklist warning; the on-demand update email picked from the change history; Dr
      Souter returning a List to the office with no confirmation, and return-or-assign when she
      marks a booked session unavailable, each posting to the notification pool; a single Booking
      moved to a colleague, landing on their List with the payable following the doer; the monthly
      fee run ($700 for Dr Rutherford, or the re-baselined figure); an overpaid prepayment billed
      with no invoice and no failure, the excess recorded; the events list on a Procedure in each
      app; a post-op event reviewed and invoiced; an additional invoice to another party; the credit
      note option; credit-and-rebill from copied lines with the negative netted on the remittance
      advice; the past-work calendar and search; NHI lookup with the Hub states; the help on capture,
      Day and Review.
- [ ] S5 run from its jump: Chen's History shows the staged change set; Whitaker's Bookings show the
      locked Contract version; Regenerate from locked data says identical after the unit-value edit.
- [ ] Every "Demo actions → Label" in the script is on that beat's screen; opening three unrelated
      screens shows no stray entries.
- [ ] Handset, "Play the office" OFF: every beat with a mobile side completes using only the phone and
      its Demo sheet; the chip clears the header avatar, the dock and the tab bar; the parity matrix is
      complete with no unexplained gap.
- [ ] App copy: no "open RFP question", "discovery item", "discovery question", "(assumption)",
      "proposed reading", "swap", "Permanent List", "timesheet", "slot", "Copy booking" or
      "addendum" remains in rendered text (screens, sheets, toasts, demo trigger labels, scenario
      messages); no time-rule caveat survives and the Control Panel callout states the RVG rule (a
      part interval always rounds up, D25); the Xero NHI callout states the settled rule; the NHI
      mod-11 flag, the provisional BCTI granularity label and the live OQ labels (OQ-84, OQ-85,
      OQ-89 among them) are still shown.
- [ ] `master-demo-guide.html` opens from the file system with the network off; every tab reads the
      same as the Markdown; "Print S1 to S5" puts each scenario on a fresh page; the Learn wizard's
      "Now drive it" steps work on the app; the Open questions tab lists only open questions.
- [ ] The five guide files have no stale vocabulary from the item 9 list (except deliberate "Terms not
      to use" rows and Future-scope notes).
- [ ] No en or em dash in any app copy changed by this phase (the copy guard test passes).
- [ ] `demoGuideSync.test.ts` runs against the rewritten run sheet and master guide with nothing
      skipped.
- [ ] Catalogue screenshots, final sweep: a full `npm run capture` ends with no failed recipe and no story without a recipe; every remaining `partial` or `absent` reason is true of the built app and names no later phase; every Retired or Future item's recipe is `absent` ("Retired" / "Future") where the prototype no longer shows it; ATLAS.md is read end to end against the app; and `npm run verify:board` is green.
- [ ] `npm run verify:board` green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.

## Demo guide updates

This phase **is** the demo guide update. Every file changes:

- `docs/demo-guide/03-demo-script.md`: rewritten in full (item 8): S1 to S5 renumbered with the new
  beats, handset lines, answered decisions told as rules, provisional labels only where still open,
  discovery points from HEAD, Direct URLs, run orders, narration list, recovery.
- `docs/demo-guide/04-presenter-cheat-sheet.md`, `02-workflows-and-handoffs.md`,
  `01-personas-and-responsibilities.md`, `README.md`: brought into line (item 9).
- `docs/demo-guide/master-demo-guide.html`: regenerated in full (item 10).
- The Control Panel scenario text: now in `demoScenarios.ts` (items 2 and 3).
- Beside the guide: `aa-prototype/README.md`, `requirements-board/capture/ATLAS.md` (item 11).

End with the final consistency read: the master guide against the Markdown, and both against the
running app.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 44` first: it lists no covered stories.

**Final sweep.** This phase covers no stories of its own, so the step is the closing sweep over the
whole catalogue, run in Session 2 after the guide, ATLAS.md and the QA pass have settled the app:

- a full `npm run capture` (in `requirements-board/`, after `node scripts/capture.ts --dry`), with
  root `npm run dev` running;
- every remaining `partial` or `absent` recipe's `absentReason` is re-read against the built app and
  made true: no reason may still name a later phase, since none remains, and none may repeat a
  plan-time claim (for example "no patient view" or "scale is only narrated") that Phases 14 to 43a
  have made false. A story that is now fully in the prototype becomes `captured` with shots; a
  genuine gap (a real Hub, usability testing, a Future item) keeps `partial` or `absent` with a reason
  that says what is missing and why;
- every Retired or Future item's recipe is set to `absent` ("Retired" or "Future") where the
  prototype no longer shows it, with the Retired item's removing phase named in the reason; none keeps
  shots of a screen that is gone. At `3d3a18c` that includes US-02.4.3 Copy a Booking (Retired,
  removed by 15b), US-05.2.3 the conditional positioning modifier (Retired, 19), and the Future items
  US-13.7.4 (warning settings), US-02.4.4 (booking from a photo; 15b's badged demo at most),
  US-02.2.1 (surgeon PDF upload; 34's badged tab) and US-02.5.x (automated change application,
  reschedule rules, concurrent edits). A badged Future-scope demo may keep `partial` with a reason
  saying it is Future scope, never `captured`;
- `capture/REPORT.md` ends with no failed recipe and no story without a recipe;
- `capture/ATLAS.md` is read end to end against the app: Routes, Personas and IDs, Seed data, Overlays,
  Existing hooks, Demo control panel (the index plus Demo actions by screen, and the rebuilt "Scenario
  jumps" table from work item 11) and Gotchas, each corrected where a catch-up phase left it stale;
- `npm run verify:board` is green, and the REPORT.md counts before and after go in the PROGRESS entry
  and the catch-up closing summary.

**Recipes this phase breaks.** Twenty-one recipes run `{ "scenario": "Sn" }` in their setup (26
`S3` and 3 `S5` uses at plan time, for example `US-08.1.1.json`). Work items 2 and 3 rebuild the
jumps in `demoScenarios.ts` and keep the ids S1 to S5 and the `scenario-s1` to `scenario-s5` and
`scenario-confirm` hooks, but each jump's staged state may change; the `--dry` run and the full
capture are the check, and any shot whose expectation moved is re-pointed keeping its `name`.

**ATLAS.md.** Read end to end and corrected as above (work item 11 already rewrites the "Scenario
jumps" and "Demo actions by screen" sections); record in the PROGRESS entry which sections changed.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:

- fan out three independent Opus review subagents, one each for **quality**, **bugs/correctness** and
  **plan adherence**, each given this doc, the rewritten guide files, the diff and the running app's
  URLs; add a fourth, **presenter**, who reads only `master-demo-guide.html` and follows S1 to S5 in
  the app cold, reporting every place the guide and the app disagree;
- this session then independently verifies every finding against the catalogue at HEAD, this doc and
  the running app, fixes the confirmed ones (with a test wherever a code bug had none), re-greens, and
  records the pass in the phase entry;
- do not re-raise anything already settled in the Decisions log.

**Steer this phase's reviewers at:**

- **Guide truth.** Every Click step exists as written (button labels, screen names, Demo actions and
  Demo sheet labels), every Expected line and figure is what the app shows after a Reset, and the
  master guide says the same as the Markdown. Hunt for figures carried over from July or from an
  interim phase ($144.76, $7.62, 5%, "two-funder", a fee netted off the payable, AA-2026 numbers that
  moved) and for an AA-FEE total or remittance net that disagrees between Admin and web Accounts.
- **Answered is answered, open stays open.** No copy, in the app or the guide, calls an Open, Confirm
  or Proposed OQ settled, or the BCTI granularity settled; no answered OQ or decision keeps a stale
  caveat (OQ-30, OQ-50, OQ-62 to OQ-75, D1 to D8, D10, D12 to D25; in particular no time-rule
  caveat survives, D25). The provisional BCTI count, the live OQ labels the phases built (OQ-79,
  OQ-83, OQ-84, OQ-85, OQ-88, OQ-89 among them) and the NHI "modulus 24" flag are still shown. D9 and
  D11 are labelled in the guide exactly as the UI labels them. A Verify item's settled part is told
  as the rule and only its open sub-question is labelled.
- **Retired beats are gone.** No swap request, office confirmation of a move, prepayment gate or
  override, submit confirm step or tap-to-read on a warning, addendum Card, Copy a Booking, 5% fee,
  per-Booking billable-party override, update email prompted after a save or a cover change,
  unavailability turning Lists into Draft Lists without the anaesthetist's choice, carried-forward
  negative invoice, "Permanent List" or "slot" survives in the script, the master guide, a scenario
  message or a registry label; photo capture, surgeon PDF upload and automated change application
  appear only as Future scope.
- **Trigger placement.** No entry shows on a screen it does not belong to; office stand-ins never
  appear in the framed build's bar; nothing is registered on `/demo/control`; bodies live in
  `src/shared` or `src/store`, so `pwaPurity.test.ts` holds; any stand-in added in item 12 follows
  Phase 14's contract and is audited.
- **PWA parity.** Every beat with a mobile side has a working handset path with "Play the office" OFF;
  the parity matrix has no row marked "self-contained" that actually waits on the office (the post-op
  event's approval and the warning's Clear each need their stand-in).
- **Scenario jumps.** Staging uses guarded store actions only (no direct state writes), is
  deterministic, keeps the `scenario-*` hooks and the S1 to S5 ids the capture recipes rely on, and
  beat links never point at a stale id.
- **The tests are real guards.** The copy guard strips comments correctly (no false passes from
  JSX text split across lines, no false failures from comments), its allowlist is minimal and each
  entry names a live OQ or catalogue item, and its must-keep list fails if a live caveat is removed;
  the guide-sync test fails when a scripted label is renamed, and none of its assertions is still
  skipped.
- **No scope creep.** No behaviour change beyond copy, the scenario module and any audited stand-in;
  `PERSIST_VERSION` bumped only if the seed changed.

## PROGRESS.md updates

- **Status row** for catch-up Phase 44, and a phase entry with:
  - the drift-check result (catalogue changes since `3d3a18c` and what each did to the script; the OQ
    list at HEAD; the D1 to D25 table: answered or default, and the label each shows);
  - the re-baselined figures table (item 7), with the BCTI-dependent figures marked;
  - the parity matrix (item 12) and how the handset was tested (real phone or emulated viewport);
  - the trigger audit result: entries per screen, any stand-in added, any gap logged;
  - the copy sweep: each RV-17 site as reworded, already fixed (by which phase) or kept (with the OQ);
  - what was built: `demoScenarios.ts`, the beat links, `demoTriggerAudit.test.ts`,
    `demoGuideSync.test.ts`, `appCopy.test.ts`, the audit spec;
  - `PERSIST_VERSION` (unchanged, or from and to, with why);
  - the before and after Vitest and Playwright counts;
  - the review pass.
- **Catalogue screenshots (final sweep):** the full-run `capture/REPORT.md` counts before and after (captured, partial, absent, failed, no recipe), the `absentReason`s rewritten and the Retired or Future recipes set to `absent`, the recipes re-pointed for the rebuilt scenario jumps, and the ATLAS.md sections corrected; repeat the final counts in the catch-up closing summary.
- **Decisions log:**
  1. **Superseded:** 2026-07-22 "Time-unit partial-interval rounding = round UP per started
     interval, a named ASSUMPTION". It is now AA's rule, not an assumption: time units come only from
     the RVG rule (OQ-50, answered 2026-10-01) and a part interval always rounds up under the tiers
     (OQ-75, answered 2026-10-02, D25; US-05.2.2 Confirmed), held as data since 19a. No caveat
     remains in the app or the guide (if 19a or 27 already recorded this, point to their entry).
  2. **Superseded:** the Phase 12 scenario-jump design (jumps defined inline in `DemoControlPanel.tsx`,
     reset-only S1, S2, S4, navigation to app roots). Jumps now live in `demoScenarios.ts`, stage
     through guarded actions only, and offer one deep link per beat.
  3. **New:** the demo guide's source priority is the requirements catalogue, then this Decisions log,
     then the code; the RFP is historical input. Discovery points and the "Open questions" tab are
     built from catalogue OQ statuses at the time of writing.
  4. **New:** app copy never calls an Open, Confirm or Proposed item settled, nor the BCTI
     granularity; kept caveats cite the OQ id or catalogue item; `appCopy.test.ts` enforces the stale
     phrases, the retired vocabulary, the must-keep caveats and the no-dash rule.
- **Catch-up closing summary** (a short section after the entry): every phase 14 to 44, with 15a,
  15b, 19a, 32a, 38a, 38b, 39a, 39b, 40a and 43a, DONE; 208 gaps, 46 DM and 29 RV closed (the
  ROADMAP total; take the final figures from `gaps.json` and the ROADMAP table at close), with FT-13.5,
  US-03.1.3 and RV-12 matching on built 14 and 15; nothing parked; the Retired and Future items
  left out (Copy a Booking, the conditional positioning modifier, warning settings, booking from a
  photo, surgeon PDF upload, automated change application, concurrent edits); the provisional
  readings still shown in the app, each with its OQ or D number (D9, D11, the open OQs, the BCTI
  granularity); the snapshot commits the plan was built and re-graded against (`3d3a18c`, then
  `3d3a18c`) and the HEAD commit this phase checked; a pointer to the ROADMAP's "When the catalogue
  changes" procedure for the next round.
- **Owner review list** (a section after the closing summary): the owner reviews the app once, now
  that every catch-up phase is done (ROADMAP.md "Owner review: agents test themselves"). Gather every
  phase's "For the owner's review" list into one list, grouped by app and screen, each line with its
  phase, what to look at (route and persona), the default or reading built, and the OQ or D number;
  drop lines a later phase already settled. Open it with a suggested review order (S1 to S5 from
  Reset, then the remaining screens).
- **Open-items handoff:** any regression logged in item 12, any parity gap not fixed, the catalogue
  correction for US-11.1.2's "modulus 24", the BCTI granularity point for AA's accountant (beside
  OQ-29 and OQ-60), and the stale `CLAUDE.md` lines for the owner.
