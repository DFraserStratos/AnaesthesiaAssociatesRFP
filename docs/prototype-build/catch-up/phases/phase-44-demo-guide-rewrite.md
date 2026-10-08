# Phase 44 · Demo guide rewrite and final sweep

**Requirements covered:**
[RV-17](../analysis/reverse-check.md#rv-17-stale-open-question-assumption-and-old-vocabulary-copy-for-readings-the-catalogue-has-since-settled) Stale
"open question", "assumption" and old-vocabulary copy for readings the catalogue has since settled
(re-graded at `60e2d1e`, status Updated: it now also names the Xero NHI callout, because OQ-30 is
answered, and the Master data nav's "Permanent lists", the old term for recurring bookings; its
`analysis/reverse-check.md` text is current). No DM items and no gap items: every gap, DM and RV item
except this one closes in Phases 14 to 43a, and nothing is parked (see [ROADMAP](../ROADMAP.md#parked)).
Read alongside, because RV-17 cites them as the readings the copy must now state (statuses at `60e2d1e`):
[US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md) (tiered time units, **Confirmed**: a part interval always rounds up under the RVG tiers, held as data) ·
[OQ-50](../../../../requirements-board/requirements/questions/OQ-50.md) and [OQ-75](../../../../requirements-board/requirements/questions/OQ-75.md) (**Answered**, D25: time units come only from the RVG rules and a part interval always rounds up; **no time-rule caveat survives**) ·
[OQ-08](../../../../requirements-board/requirements/questions/OQ-08.md) (List reassignment mechanism, Answered) ·
[FT-13.3](../../../../requirements-board/requirements/stories/FT-13.3.md) (billing flow monitoring in the Admin App, **Confirmed**; stated plainly, no "proposed") ·
[OQ-74](../../../../requirements-board/requirements/questions/OQ-74.md) (**Answered**, D24: the unpaid-balance threshold counts from the invoice date; a credit balance is mild) ·
[US-07.3.2](../../../../requirements-board/requirements/stories/US-07.3.2.md) (immutable after AUTHORISED; Proposed: the design, never "the RFP immutability answer") ·
[FT-08.2](../../../../requirements-board/requirements/stories/FT-08.2.md) (invoice grouping; **Proposed**, so it keeps a "proposed" label, never "discovery question") ·
[US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md) (GST; **Confirmed since `3d3a18c`**: every price held excluding GST, GST worked out only at the foot of the invoice; stated as the rule, the old "proposed" label goes) ·
[OQ-84](../../../../requirements-board/requirements/questions/OQ-84.md) (Open: the status a session takes after its List is moved away; built by 32 as its recommendation and **keeps its label**) ·
[US-06.4.1](../../../../requirements-board/requirements/stories/US-06.4.1.md) (**Confirmed since `3d3a18c`**, retitled "No automatic invoice or credit after a prepaid procedure"; [OQ-61](../../../../requirements-board/requirements/questions/OQ-61.md) and [OQ-76](../../../../requirements-board/requirements/questions/OQ-76.md) Answered: nothing is invoiced or credited automatically after a prepaid procedure, either way; extras and credits are raised by hand. The old "balance always invoiced, provisional" label goes).
Also read, for the S5 beats:
[OQ-30](../../../../requirements-board/requirements/questions/OQ-30.md) and [US-09.3.1](../../../../requirements-board/requirements/stories/US-09.3.1.md) (**Answered** and **Confirmed**: no PII in Xero, only a unique ID that links transactions back to our invoices; S5 states it as the rule) and
[US-11.1.2](../../../../requirements-board/requirements/stories/US-11.1.2.md) (Proposed, still says "modulus 24"; the mod-11 label stays flagged).
For the beats the guide scripts (not closed here; statuses at `60e2d1e`):
- **Warnings and moves:** [FT-13.7](../../../../requirements-board/requirements/stories/FT-13.7.md) (Verify) and [US-13.7.3](../../../../requirements-board/requirements/stories/US-13.7.3.md) (**Confirmed**: visible on opening the Booking, no confirm step at submit, no tap-to-read; 15a) ·
  [US-01.4.3](../../../../requirements-board/requirements/stories/US-01.4.3.md) (Confirmed) and [US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md) (Confirmed: return to the office or assign to a colleague; 32) ·
  [US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md) (**Confirmed**: no preference warning when an anaesthetist moves their own List; 32, 32a) ·
  [FT-13.8](../../../../requirements-board/requirements/stories/FT-13.8.md), [US-13.8.1](../../../../requirements-board/requirements/stories/US-13.8.1.md) (Confirmed) and [US-13.8.2](../../../../requirements-board/requirements/stories/US-13.8.2.md) (Verify) (the shared notification pool, 32) ·
  [US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md) and [US-01.4.6](../../../../requirements-board/requirements/stories/US-01.4.6.md) (a single Booking moved; the doer rule; Verify, 32a) ·
  [US-02.3.4](../../../../requirements-board/requirements/stories/US-02.3.4.md) (update email templates, Confirmed, 35; manual only, OQ-82 answered).
- **Lists and preferences:** [EP-07](../../../../requirements-board/requirements/stories/EP-07.md) (Confirmed) and [FT-07.1](../../../../requirements-board/requirements/stories/FT-07.1.md) (Proposed: a List's states are DRAFT, a Draft List with no anaesthetist, then ACTIVE, SUBMITTED and AUTHORISED; 15b, 31) ·
  [US-01.3.2](../../../../requirements-board/requirements/stories/US-01.3.2.md) (a recurring booking on an unavailable session becomes a Draft List; Verify while OQ-81 part 3 is open; 30, 31) ·
  [US-13.6.3](../../../../requirements-board/requirements/stories/US-13.6.3.md) (Confirmed), [US-13.6.4](../../../../requirements-board/requirements/stories/US-13.6.4.md) and [US-01.3.6](../../../../requirements-board/requirements/stories/US-01.3.6.md) (Verify) (private not-preferred and preferred pairings, priority tiers, admin only; 17, 28, 31) ·
  [US-07.4.1](../../../../requirements-board/requirements/stories/US-07.4.1.md) and [US-07.4.2](../../../../requirements-board/requirements/stories/US-07.4.2.md) (Verify; OQ-31 answered: a List leaves the main view once finalised and sent to invoicing), [US-03.1.6](../../../../requirements-board/requirements/stories/US-03.1.6.md) and [US-03.1.7](../../../../requirements-board/requirements/stories/US-03.1.7.md) (Proposed: archive and search; 38a).
- **Intake, procedures and Contracts:** [FT-02.1](../../../../requirements-board/requirements/stories/FT-02.1.md) (Verify) and [US-02.1.3](../../../../requirements-board/requirements/stories/US-02.1.3.md) (Confirmed: downloads land in the matching screen, no automated decisions; 33, 34) ·
  [US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md), [US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) and [US-03.1.2](../../../../requirements-board/requirements/stories/US-03.1.2.md) (Confirmed: the wording as received, never overwritten, and the three-part stack; 20a) ·
  [US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md) and [US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md) (Confirmed: RVG groups and the curated procedures, the two-tab picker; 19) ·
  [US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) (Verify: contract holders), [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) (Confirmed: dated versions) and [US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) (Confirmed: the anaesthetist's own fixed-price Contracts, kept by the office) (18, 19a) ·
  [FT-04.3](../../../../requirements-board/requirements/stories/FT-04.3.md), [US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) and [US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (Confirmed: No contract (RVG) first, holder-fit Contracts with one search; 20) ·
  [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) (Verify: optional modifiers, each with a short explanation), [US-03.3.8](../../../../requirements-board/requirements/stories/US-03.3.8.md) and [US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md) (Confirmed: age and the included P1, locked) (19b) ·
  [US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) and [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) (Confirmed: the payer on the Booking; office review of Contracts, references and the insurance indication; 21) ·
  [US-08.2.3](../../../../requirements-board/requirements/stories/US-08.2.3.md) (Verify: the Split button; 22) ·
  [US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md), [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) and [US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md) (Confirmed: fixed price, fixed rate, locked fixed discount, in one precedence; 24).
- **Prepayment:** [US-06.1.1](../../../../requirements-board/requirements/stories/US-06.1.1.md), [US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md), [US-03.1.8](../../../../requirements-board/requirements/stories/US-03.1.8.md) and [US-08.2.2](../../../../requirements-board/requirements/stories/US-08.2.2.md) (Confirmed: procedures or whole RVG groups ticked; the amount is the anaesthetist's own fixed price, in full, shown to them; the prepayment deducted so nothing is left to bill; 26, 27) ·
  [US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md), [US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md) and [US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md) (Verify: the invoice generated with its draft pair; a re-check on a change of Procedures, Contract or payer, never on a move; the honour system on a move; 27, 41).
- **Money after setup:** [US-10.3.3](../../../../requirements-board/requirements/stories/US-10.3.3.md) (AA fee settings, Verify, 16) ·
  [FT-03.7](../../../../requirements-board/requirements/stories/FT-03.7.md) and [US-03.7.3](../../../../requirements-board/requirements/stories/US-03.7.3.md) (events and the events list, Verify, 38b, 39b) ·
  [US-08.6.1](../../../../requirements-board/requirements/stories/US-08.6.1.md), [US-08.6.3](../../../../requirements-board/requirements/stories/US-08.6.3.md) (the anaesthetist raises one too), [US-08.6.5](../../../../requirements-board/requirements/stories/US-08.6.5.md) and [US-08.6.4](../../../../requirements-board/requirements/stories/US-08.6.4.md) (Verify) and [US-08.6.6](../../../../requirements-board/requirements/stories/US-08.6.6.md) (Proposed) (38b, 39) ·
  [US-10.2.5](../../../../requirements-board/requirements/stories/US-10.2.5.md) (Confirmed: negatives netted), [US-10.2.6](../../../../requirements-board/requirements/stories/US-10.2.6.md) (Verify: period BCTI approval) and [US-10.2.7](../../../../requirements-board/requirements/stories/US-10.2.7.md) (**Proposed**: the weekly ISO-week cycle; OQ-47 Proposed) (39a).
- **Identity and ease of use:** [US-14.4.1](../../../../requirements-board/requirements/stories/US-14.4.1.md) (NHI lookup, Proposed, 40a) ·
  [US-13.5.3](../../../../requirements-board/requirements/stories/US-13.5.3.md) (anaesthetist sign-in, Verify, 43a) and [US-15.0.1](../../../../requirements-board/requirements/stories/US-15.0.1.md) (ease of use and point-of-need help, Proposed, 43a).

**Left the script** (each beat is dropped, or moved to "What to narrate rather than click" as Future
scope). Since the 2026-10-03 update: [US-02.4.3](../../../../requirements-board/requirements/stories/US-02.4.3.md)
Copy a Booking (Retired; 15b), [US-05.2.3](../../../../requirements-board/requirements/stories/US-05.2.3.md)
the conditional positioning modifier (Retired; its idea now lives as the locked included P1, 19b),
and the Future Work items [US-02.4.4](../../../../requirements-board/requirements/stories/US-02.4.4.md)
booking from a photo, [US-02.2.1](../../../../requirements-board/requirements/stories/US-02.2.1.md)
surgeon PDF upload, US-02.5.1 to US-02.5.4 automated change application, US-02.5.6 concurrent edits
and US-13.7.4 warning settings. **Since the 2026-10-08 update:** Retired
[US-06.2.3](../../../../requirements-board/requirements/stories/US-06.2.3.md),
[US-06.2.4](../../../../requirements-board/requirements/stories/US-06.2.4.md) and
[US-06.2.5](../../../../requirements-board/requirements/stories/US-06.2.5.md) (the prepayment
estimate, its calculation and the estimated duration),
[US-06.4.2](../../../../requirements-board/requirements/stories/US-06.4.2.md) (an overpaid
prepayment's "no automatic credit": there is no overpaid case, the prepaid Procedure is priced at the
prepaid amount), [FT-04.4](../../../../requirements-board/requirements/stories/FT-04.4.md),
[US-04.4.1](../../../../requirements-board/requirements/stories/US-04.4.1.md) and
[US-04.4.2](../../../../requirements-board/requirements/stories/US-04.4.2.md) (hospital, insurer and
procedure default Contracts, default RVG Contracts),
[US-04.2.5](../../../../requirements-board/requirements/stories/US-04.2.5.md) and
[US-05.3.4](../../../../requirements-board/requirements/stories/US-05.3.4.md) (per-Contract
multi-procedure rules), [US-04.2.7](../../../../requirements-board/requirements/stories/US-04.2.7.md)
(required booking inputs) and [US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md)
(the Contract's payment setting, full or split); Future Work
[US-04.3.7](../../../../requirements-board/requirements/stories/US-04.3.7.md) (a procedure not on the
Contract's schedule), [US-02.3.5](../../../../requirements-board/requirements/stories/US-02.3.5.md)
(change emails sent automatically) and [US-04.2.13](../../../../requirements-board/requirements/stories/US-04.2.13.md)
(a Contract schedule upload). And, as before, the carry-forward of a negative invoice with no later
payment (D21, OQ-71: handled outside the system, so 39a built nothing).

**Owner decisions** ([ROADMAP.md](../ROADMAP.md#owner-decisions) table D1 to D46, re-read on
2026-10-08 against catalogue `60e2d1e`). This phase gates on none: it scripts and labels what the
phases built. It must tell the audience each decision exactly as it now stands: answered rows as the
rule, superseded rows in their **new** reading (never the struck one), and open rows (D11, D26 to D41)
as the built default, labelled provisional with the OQ id in the UI's own words. D9 is now answered
(OQ-31), so its "provisional" label goes everywhere. Drift-check step 3 lists every row.

**Depends on:** every catch-up phase, 14 to 43a (including 15a, 15b, 19a, 19b, 20a, 32a, 38a, 38b,
39a, 39b, 40a and 43a), DONE. This phase runs last. It changes no domain behaviour; it re-walks and
re-scripts what 14 to 43a built.
**Estimated:** 2 sessions (one is not realistic for four new Vitest files, two Playwright specs, a
copy sweep of about thirty sites, five rewritten guide files, a regenerated 1,400-line master guide,
two full walks of S1 to S5 plus a handset pass, and a four-reviewer adversarial pass; the 2026-10-01,
2026-10-03 and 2026-10-08 updates add about thirty beats, absorbed by moving material into asides and
lengthening S1, S2 and S4 rather than a third session).
- **Session 1 (code and baseline):** drift check, items 1 to 7. It ends green with a draft Phase 44
  PROGRESS entry (status IN PROGRESS) holding what Session 2 needs, because scratchpad notes do not
  survive the session: the drift-check result, the OQ list at HEAD, the D1 to D46 table, the beat and
  registry inventory (item 1) and the re-baselined figures (item 7).
- **Session 2 (documents, QA, close-out):** items 8 to 13, starting from that draft entry.
Regressions the QA pass finds are fixed only if small (item 12); anything larger is logged, never a
third session.

## Goal

Forty-odd phases each patched only the beats they broke. The presenter now needs one coherent script
that matches the finished app, told in the catalogue's vocabulary, and one self-contained master guide
generated from it. The vocabulary: Booking, List, Draft List, session, Procedure (the booked item) and
procedure (a procedure-list entry), RVG group, Contract, contract holder, No contract (RVG), payer,
who is invoiced, prepaid amount, warning, event, notification, recurring booking, move or
reassignment; a List's states DRAFT (a Draft List), ACTIVE, SUBMITTED and AUTHORISED; "Not preferred"
and "Preferred" pairings and priority tiers. Never "Permanent List", "swap", "timesheet", "Card" (for
a Booking), "blacklist", "Type 1/2/3", "billing route", "default hospital Contract", "estimate" or
"deposit" for a prepayment, "DRAFT" or "Open" for an assigned List, or, in anything the audience sees,
"slot" (Slot stays a code and planning word, per OQ-64).

This phase:

- **rewrites the S1 to S5 run sheet** (`docs/demo-guide/03-demo-script.md`) around the 2026-10-08
  model, folding in every lettered beat and optional aside the earlier phases left, renumbering them,
  and scripting the beats the catch-up added:
  - **S1:** sign-in on the handset; **sync then match** with each row's **wording as received**, no
    automated decision, and the office setting the Contract (**No contract (RVG) first**, then
    holder-fit Contracts); the **three-part stack** on every booking screen; capture with the
    **two-tab picker** (Procedures, RVG codes), starting units from the line, procedure or group,
    **optional itemised modifiers with a short explanation and the locked age and P1**; finding past
    work through the **main view, archive and search**;
  - **S2:** **warnings on the to-do list** (visible on opening a Booking, no confirm step at submit),
    the **ACTIVE and DRAFT List states**, **a recurring clash becoming a Draft List**, **Draft List
    assign with the waiting flag** and the office's picker ordered by **priority tier** with
    **not-preferred pairings** apart and a soft warning, the **conflict dashboard** and the
    **on-demand update email**, **an anaesthetist moving their own List** (no confirmation, no
    preference warning) and **return-or-assign** on marking a booked session unavailable, **an
    anaesthetist moving a single Booking**, the office's **shared notification pool** with the
    cover-change email, and Review showing each Procedure's stack, the **payer on the Booking** and
    the warnings;
  - **S3:** the run writing each Procedure's **pricing snapshot** and sending invoices, who is invoiced
    decided by the Contract's holder or the payer, GST at the invoice foot; the **weekly payment run**
    with BCTI approval and the remittance advice; the **monthly AA fee run**; asides for the **Split
    button**, the **price precedence** (a fixed price, a fixed rate, a locked fixed discount and the
    anaesthetist's own price on No contract (RVG)) and the multi-procedure rule;
  - **S4:** **prepayment at the anaesthetist's own fixed price**, in full and shown to them, generated
    with its draft pair and sent on approval; the prepaid Procedure billed at the prepaid amount with
    **nothing raised automatically afterwards**, and any extra or credit **raised by hand**; **events
    on a Procedure** (additional invoices and credits by the office **and** the anaesthetist, pre-op
    and post-op); **credit-and-rebill** with components equal to the credit, and the negative
    **netted on the weekly run's remittance advice**;
  - **S5:** NHI lookup and the **missing-NHI list**, dated Contract versions (the procedure date picks
    the price), and **authorise then edit the unit value with the invoice unchanged**;
  - point-of-need help pointed at where it sits (S1 capture, S2 Day and Review);
- **re-baselines every figure** the guide quotes from the running app after a reset, never by hand;
- **rebuilds the Control Panel scenario jumps** as a pure, tested module whose jumps stage only what
  their scenario needs and then offer one deep link per beat;
- **regenerates `master-demo-guide.html` in full** from the rewritten Markdown, and brings the
  personas, workflows, cheat sheet and demo-guide README into line;
- **sweeps stale "open RFP question / discovery item / assumption" copy** from the app (RV-17),
  stating the catalogue's reading where it is settled and citing the OQ where it is still open. The
  time-rule caveats go (D25), as do the balance-invoice caveat (OQ-61, OQ-76 answered) and the GST
  "proposed" label (US-05.2.7 Confirmed); a caveat stays only where a question is still open, for
  example OQ-90 on the multi-procedure rule, OQ-89 on a Contract line's time band, OQ-84 on the status
  a vacated session takes, OQ-95 on the age bands, and the **BCTI granularity, labelled provisional**
  (one BCTI per receivable invoice built; "one per procedure" unresolved, beside OQ-29 and OQ-60). The
  sweep also removes superseded vocabulary from app copy: "slot" (OQ-64), "Copy booking" (15b),
  "addendum" (38b), "blacklist" (D44, D36), "DRAFT" or "Open" for an assigned List (15b), "estimate" or
  "deposit" for a prepayment (27), "Type 1/2/3", "billing route" and any default hospital Contract
  (18, 20), "Permanent lists" (30) and "Funder allocation" (22). A source-scan test stops stale copy
  coming back and keeps the live caveats in place;
- **audits every registered demo trigger**: it shows only on its own screen, the Control Panel is
  only the index, nothing anaesthetist-facing exposes pairing preferences or tiers (17's privacy
  boundary), and every beat with a mobile side can be run on a handset through the PWA sheet, signed
  in through 43a's screen;
- **gathers every phase's "For the owner's review" list into one review list**, runs a **full QA
  pass** on the framed build and on a handset, and **records the catch-up** in PROGRESS.md.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot, commit `60e2d1e` (rename-aware; never a
   plain `git diff` of the catalogue folder, which moved). This phase scripts the whole app, so read
   the whole diff, not only RV-17's references:

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-05.2.2,FT-13.3,OQ-08,OQ-50,OQ-75,OQ-74,OQ-30,US-09.3.1,US-07.3.2,FT-08.2,US-05.2.7,OQ-84,US-06.4.1,OQ-61,OQ-76,US-11.1.2,FT-13.7,US-13.7.3,US-10.3.3,US-01.4.3,US-01.4.5,US-01.5.5,FT-13.8,US-13.8.1,US-13.8.2,US-01.4.7,US-01.4.6,US-01.3.2,US-01.3.6,US-13.6.3,US-13.6.4,US-02.3.4,EP-07,FT-07.1,US-07.4.1,US-07.4.2,US-03.1.6,US-03.1.7,FT-02.1,US-02.1.3,US-02.5.7,US-03.1.9,US-03.1.2,US-05.1.1,US-05.1.6,US-04.1.5,US-04.2.10,US-04.2.14,FT-04.3,US-04.3.2,US-04.3.3,US-03.3.4,US-03.3.8,US-05.1.4,US-11.2.2,US-07.2.2,US-08.2.3,US-05.2.5,US-05.2.6,US-05.4.3,US-06.1.1,US-06.2.2,US-03.1.8,US-08.2.2,US-06.3.1,US-06.3.5,US-06.5.4,FT-03.7,US-03.7.3,US-08.6.1,US-08.6.3,US-08.6.4,US-08.6.5,US-08.6.6,US-10.2.5,US-10.2.6,US-10.2.7,US-14.4.1,US-13.5.3,US-15.0.1,OQ-12,OQ-13,OQ-29,OQ-31,OQ-47,OQ-49,OQ-60,OQ-77,OQ-79,OQ-80,OQ-81,OQ-83,OQ-85,OQ-88,OQ-89,OQ-90,OQ-92,OQ-93,OQ-95,OQ-96,OQ-97,OQ-98,OQ-99,OQ-100,OQ-101,OQ-102,OQ-103,OQ-87,OQ-15,OQ-38,OQ-43,OQ-48,OQ-78,OQ-82,OQ-86,OQ-91,OQ-94
   ```

   (The last ten are OQ-87, open and Future, and the questions answered on 2026-10-05 to 08 that the
   guide now tells as the rule: a reopened one puts its caveat back.)

   At plan time (2026-10-08) the baseline is `60e2d1e`, so the diff was empty. What moved from
   `3d3a18c` to `60e2d1e` (change logs `requirements-board/requirements/changes/2026-10-07-requirements-update.md`,
   `2026-10-07-list-lifecycle-states.md` and `2026-10-08-procedure-picker-and-source-text.md`) is
   already in this doc: the Contract and pricing model rewrite (contract holders, dated versions, one
   No contract (RVG), no default Contracts, Contract lines, one price precedence, the anaesthetist's
   own fixed-price Contracts), the two-tab picker over RVG groups and curated procedures, the source
   wording and the three-part stack, modifiers as optional records with the locked age and P1, the
   payer on the Booking, prepayment at the anaesthetist's own fixed price with nothing automatic
   afterwards, the four List states, private pairing preferences and tiers, the weekly payment cycle,
   and the answers to OQ-15, OQ-31, OQ-38, OQ-43, OQ-48, OQ-61, OQ-76, OQ-78, OQ-82, OQ-86, OQ-91 and
   OQ-94. For each item changed **since `60e2d1e`**:
   - if it is one RV-17 cites (US-05.2.2, OQ-50, OQ-75, OQ-08, FT-13.3, OQ-74, OQ-30, US-09.3.1,
     US-07.3.2, FT-08.2, US-05.2.7, OQ-84, US-06.4.1), re-read it and adjust work item 6's wording;
   - if it changes a behaviour a scripted beat relies on, check the owning phase's PROGRESS entry for
     whether the build followed it. If the build did not, **do not change the build here**: script the
     app as built, label the beat provisional, and list the item for the owner in the PROGRESS entry;
   - if an item is now Retired or Future, drop its beat (or move it to "What to narrate rather than
     click" as Future scope) and record that in the PROGRESS entry.
2. **Every open question the guide will name.** Re-read the status of each OQ at HEAD
   (`requirements-board/requirements/questions/OQ-*.md`). The guide's "Open questions" list and every
   discovery point are built from HEAD statuses, not from this doc. At `60e2d1e` the open ones are
   OQ-12 (ACC pre-op codes), OQ-13 (download format), OQ-29 (GST agency), OQ-49 (D11), OQ-60 (what the
   fee counts), OQ-77 (part 3 only, D41), OQ-79 (what posts to the pool, expiry), OQ-80 (D38), OQ-81
   (part 3, short-notice sickness), OQ-83 (sign-in experience), OQ-84 (vacated session status), OQ-85
   (how a single Booking moves), OQ-87 (automated reschedule rules, Future), OQ-88 (the system code,
   D39), OQ-89 (the time band, D40), OQ-90 (D26), OQ-92 (D27), OQ-93 (D28), OQ-95 (D29), OQ-96 (D30),
   OQ-97 (D31), OQ-98 (D32), OQ-99 (D33), OQ-100 (D34), OQ-101 (D35), OQ-102 (D36) and OQ-103 (D37);
   OQ-47 (payment day and cycle) is **Proposed**, so it is "proposed", not "open". Answered since
   `3d3a18c` and now told as the rule, with no caveat: OQ-15, OQ-31 (D9), OQ-38, OQ-43 (D44), OQ-48
   (D45), OQ-61, OQ-76, OQ-78, OQ-82, OQ-86 (D46), OQ-91 (D42) and OQ-94 (D43), plus OQ-30, OQ-50 and
   OQ-62 to OQ-75. Each open question was built as its default by its phase; the guide names it
   provisional only where that phase's UI does, in the UI's words.
   **Requirement statuses matter too** (catalogue `README.md`, "Status"): a **Confirmed** item is
   AA's rule and is stated plainly (US-05.2.2, US-05.2.7, US-06.4.1, US-09.3.1, FT-13.3, US-13.7.3,
   US-01.4.3, US-01.4.5, US-01.5.5, FT-13.8, US-13.8.1, US-02.3.4, US-02.5.7, US-03.1.9, US-03.1.2,
   US-04.3.3, US-05.1.4, US-03.3.8, US-11.2.2, US-05.2.6, US-05.4.3, US-06.2.2, US-03.1.8, US-08.2.2 and
   US-10.2.5 among them); a **Proposed** item (FT-08.2, US-07.3.2, FT-07.1, US-08.6.6, US-03.1.6,
   US-03.1.7, US-10.2.7, US-14.4.1, US-15.0.1 among them) is the system's design pending AA sign-off,
   so the app and guide may describe it as how the system works but never as "AA confirmed"; an
   **Open** or **Verify** item is provisional and says so. "Settled" in this doc means an Answered OQ
   or a Confirmed item; a Proposed item is "the design". Several scripted items are Verify only because
   a sub-question is open (FT-13.7, US-10.3.3, US-01.4.6, US-01.4.7, US-13.8.2, US-03.3.4, US-08.2.3,
   US-06.3.1, US-06.5.4, FT-03.7, US-03.7.3, US-08.6.1, US-08.6.5, US-10.2.6, US-13.5.3): tell the part
   an answered decision or OQ settled as the rule, and label only the open sub-question, with its OQ
   id, as the owning phase's UI does.
   - **OQ-50 and OQ-75 are answered** (D25): time units come only from the RVG rules and a part
     interval always rounds up under the tiers. Check that the RVG time tiers 19a holds as data, read
     through `src/domain/billing/timeUnits.ts` or whatever 19a's entry names, are the only source of
     time units, and that they feed **recorded time only** (there is no prepayment estimate since 27:
     D25 is superseded in that part). If another source survives, stop and raise it with the owner (a
     billing change is not this phase's to make). No time-rule caveat survives in the app or the guide.
   - **OQ-30 is answered and US-09.3.1 Confirmed** (no PII in Xero; a unique ID links back). S5's "no
     NHI in Xero" beat states it as the rule, and the Xero NHI callout carries no "contradiction" or
     "to confirm" text.
   - **BCTI granularity** is not an OQ but an open point the plan keeps in one place (ROADMAP,
     "Sequencing rules"): one BCTI per receivable invoice is built, "one per procedure" is unresolved
     beside OQ-29 and OQ-60. Every app and guide mention of the count stays labelled provisional.
3. **Owner decisions D1 to D46** (ROADMAP "Owner decisions"). Write the table into the PROGRESS entry
   from the ROADMAP rows and each owning phase's entry, with the exact label the UI shows:
   - **Answered and built as answered, no provisional label:** D1 the monthly AA fee invoice from
     settings (16; only OQ-60 under it keeps a label); D5 no prepayment gate, a warning in both apps
     (15a, 27); D7 the anaesthetist moves their own List with no confirmation (32, 32a; OQ-85 on the
     single-Booking move keeps its label); D8 the flat outstanding list (38); **D9, answered by OQ-31**:
     a List leaves the anaesthetist's main view once finalised and sent to invoicing, found by archive
     or search (38a; the old "billed Lists stay, provisional" default and its label are gone); D10 the
     free-form additional invoice, also raised by the anaesthetist (38b); D13 "event" as one element
     with one review step (38b, 39b); D14 Slots as stored status containers, user-maintained statuses,
     no "slot" in the UI, return-or-assign, and the List states DRAFT, ACTIVE, SUBMITTED, AUTHORISED
     (15b, 28 to 32; OQ-81 part 3 keeps its label); D15 the shared notification pool (32, 35; OQ-79
     keeps its label); D19 the on-demand update email, manual only (35; OQ-82 answered, no label);
     D21 a negative with no later payment handled outside the system (39a); D22 additional invoices to
     any party and the credit note option, the rebuilt components equal to the credit and the credit
     reversing the payable (38b, 39; OQ-77 parts 1 and 2 answered, part 3 is D41); D23 prepayment only
     for a person paying (27); D24 the balance threshold from the invoice date, a credit balance mild
     (40).
   - **Superseded on 2026-10-08 (D18 on 2026-10-05): tell the new reading only, never the struck one:**
     D2 an insurance indication on the Booking while the Contract decides who is billed (20, 21; the
     indication itself is D28); D3 any base units accepted with an office warning, the starting units
     from the Contract line, then the procedure, then its RVG group (19, 19a); D4 the child is the payer
     on the Booking, a mild warning (21); D6 the prepaid amount is the anaesthetist's own fixed price
     in full, generated with its ledger pair and draft Xero pair, sent on approval, and nothing raised
     automatically afterwards (27, 41); D12 RVG groups hold the base units, a curated procedure list
     with a general procedure per group, two tabs, no default RVG Contracts (19, 19a); D16 No contract
     (RVG) first, holder-fit Contracts under holder headings, composite search, active and holder
     filters, no hospital default (18, 20); D17 the Contract bills its holder or the payer on the
     Booking, a payer on every Booking (18, 21); D18 the split is a Split button on the Booking (22);
     D20 the honour system, no move detection and no re-check (32, 32a, 41); D25 the time rule on
     recorded time only (19a).
   - **Still open, built as the default and labelled provisional with the OQ id:** D11 (OQ-49: a
     Booking without an NHI is provisional, on the problem list, authorise blocked; Vanessa leans to a
     mandatory NHI, refuse or hold undecided; 40); D26 (OQ-90, the RVG multi-procedure rule, 23); D27
     (OQ-92, warn and hold the invoice, 27); D28 (OQ-93, the insurance indication with a review warning,
     21); D29 (OQ-95, age on the procedure date, no ASA pre-fill, 19b); D30 (OQ-96, the prepaid price
     locked, 27); D31 (OQ-97, a part credit of a prepayment, 41); D32 (OQ-98, a holder's plain RVG
     Contract with no lines offered for every procedure, 18, 19a, 20); D33 (OQ-99, a blank procedure at
     setup, required at completion, 20, 21, 33); D34 (OQ-100, no Contract schedule upload, 42); D35
     (OQ-101, a starting figure plus the range, 19, 19a); D36 (OQ-102, "Not preferred", "Preferred",
     Tier 1 to Tier 4, 17); D37 (OQ-103, the general procedure's plain name and a review flag, 19, 20,
     20a, 21); D38 (OQ-80, the pair at generation, only the payee repointed on a move, 27, 32a, 41);
     D39 (OQ-88, a system code on every group and procedure, 19); D40 (OQ-89, no time band on Contract
     lines and no anaesthetist adjustment on a fixed discount, 19a, 24); D41 (OQ-77 part 3, one
     credit-and-rebill flow, 39).
   - **Answered and recorded:** D42 (OQ-91, the office keeps first-party Contracts, 19a, 26, 27); D43
     (OQ-94, P1 locked on every Neurosurgery and Spine code, 19b); D44 (OQ-43, private two-way
     preferences, an admin warning only, none on an anaesthetist's own hand-on, 17, 31, 32, 32a); D45
     (OQ-48, the procedure date decides the price, 18); D46 (OQ-86, anaesthetists never pull Draft
     Lists, 31).
   If an open row has been answered since its phase ran and the build still carries the default, script
   the build as it stands, label it provisional, and raise it with the owner; do not rework the feature
   here. If an answered or superseded row's phase still shows a provisional label for it (D9 above all),
   or shows its struck reading, that is a regression for item 12.
4. **Prerequisites.** Confirm Phases 14 to 43a (with 15a, 15b, 19a, 19b, 20a, 32a, 38a, 38b, 39a, 39b,
   40a and 43a) are DONE in the PROGRESS status table. If any is not, stop and tell the owner: 44 runs
   last. Read every catch-up phase entry's handoff notes "For 44" (at least 15a, 15b, 16, 19b, 20a, 21,
   23, 25, 27, 32, 32a, 33, 34, 35, 36, 37, 38, 38a, 38b, 39, 39a, 39b, 41 and 43a leave one), and the
   name maps each entry records (routes, registry ids, store actions, seed constants). This doc names
   things as they were planned; the entries record what was built. Where they differ, the entry wins.
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
  The List states (DRAFT for a Draft List, ACTIVE, SUBMITTED, AUTHORISED) and the warning triangle's
  mild and strong treatments (15a) join the legend.
- `docs/design/Mobile App.dc.html`: the header, dock and tab-bar positions the PWA "Demo" chip must
  clear during the handset audit (and 43a's sign-in screen, which has no dock or tab bar).
- The six layout pages (Mobile App, Mobile Availability, Web Dashboard, Web Availability, Admin Day,
  Admin Review): only as the yardstick for spotting visual regressions during the QA pass.

**Catalogue:** the items above and every OQ file the guide names (step 2). The change logs explain the
vocabulary and the answers: `requirements-board/requirements/changes/2026-10-01-requirements-update.md`,
`2026-10-02-requirements-update.md`, `2026-10-02-aa-requirements-review-with-greg.md`,
`2026-10-02-aa-booking-and-pricing-review-with-greg.md`, and for this update
`2026-10-07-requirements-update.md` (read in full: section 9 for the 2026-10-05 decision and the
2026-10-06 directors' run, section 10 for the 2026-10-08 follow-ups), `2026-10-07-list-lifecycle-states.md`
and `2026-10-08-procedure-picker-and-source-text.md`.

**Pricing model, in plain words.** The cheat sheet's Contracts and pricing section, the Learn tab and
the evaluator answers draw their plain wording from
[AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) (the plain-language guide,
true as written): regions `rvg-groups-and-procedures`, `contracts-two-kinds`, `no-contract-rvg`,
`who-gets-the-invoice`, `booking-to-invoice`, `what-the-anaesthetist-can-change`,
`prepaid-already-agreed`, `worked-examples` and `keeping-prices-up-to-date`. Its `modifiers` region
predates the locked age (US-03.3.8) and the included P1 (US-05.1.4, OQ-94): the guide tells the
catalogue's rule, which wins. [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md)
(the draft technical design v4, regions `price-precedence`, `pricing-snapshot` and `prepayment`) and
[AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) (its ERD) are context for the
presenter's "how it works" answers only; the guide never presents the draft design as AA's decision,
and quotes the app as built where they differ.

**Analysis:**
- `../analysis/reverse-check.md`: RV-17. (RV-22, the PWA's "Play the office" scaffold, is not in
  that file: it is kept but not planned, see `../ROADMAP.md` "Parked" and "PWA parity"; Phase 14
  badged it and defaulted it to OFF.)
- `../GAP-ANALYSIS.md`: everything before "## By epic", especially "Demo impact", "Demo-trigger
  buttons", "Remove or rework" and "Uncertainty".
- `../ROADMAP.md`: "Owner decisions" (D1 to D46), "Sequencing rules" (the BCTI granularity rule, the
  pricing model in one place, and the Vocabulary paragraph), "Demo triggers", "PWA parity", "Demo
  guide" (its list of beats the 2026-10-08 changes break, which earlier phases patched and this phase
  rewrites), "Catalogue screenshots" (its "Stale captions after the 2026-10-08 update"), "Confirm
  before building", "Milestone demos" (the "After 44" line is this phase's acceptance), "Parked"
  (nothing, and the items out of the plan since the 2026-10-03 and 2026-10-08 updates).
- `../analysis/prototype-map-shell-demo-pwa.md`: sections 5 (the demo-trigger registry pattern), 6
  (Demo surfaces: the Control Panel, `SCENARIOS` and its scenario jumps), 7 (PWA) and 9 (stubbed and
  visual-only). The code has moved a long way since the map; use it for orientation only.
- Every catch-up phase doc's "Demo triggers" and "Demo guide updates" sections (`phases/phase-14` to
  `phase-43a`, including 15b, 19a, 19b, 20a, 32a, 38a and 38b): the inventory of what each phase
  registered and which beats it patched.

**Code entry points** (paths and lines at plan time, re-checked on 2026-10-08 with Phases 14, 15 and
15a's session 1 built; every later phase renames or moves some, and each phase's PROGRESS name map is
what was actually built):
- `aa-prototype/src/apps/demo/DemoControlPanel.tsx`: `SCENARIOS` (`:250`, with
  `Scenario`/`ScenarioResult` types just above and a `nav` link list per jump), `ScenarioJumps`
  (`:351`), the "Demo actions by screen" index (`DemoActionsIndex`, `:448`, Phase 14), the
  billing-assumption callout (`:226`, "Billing assumption: partial time intervals round up ... to
  confirm with AA in discovery"; 19a deletes it), and the S2 scenario text (`:277`) that still says
  "vacated slot".
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
  `src/store/officeStandIn.ts` (Phase 14), `src/store/warningSamples.ts` (15a, extended by 19, 21, 27
  and 40), `src/store/demoStaging.ts` (25), `clockActions.ts` (`resetDemo`),
  `src/domain/seed` (`SEED_LIST_IDS` in `index.ts`, `SEED_MARKERS`, `listIdForSlot` in `canvas.ts`,
  `ANAE` in `cast.ts`, and the AR-35 wording 20a seeded).
- `aa-prototype/src/domain/billing/` (the one place 18 to 27 keep the pricing structures, the resolver,
  the price precedence and the snapshot builder) and `timeUnits.ts` (`timeUnitsFromMinutes`,
  `PARTIAL_INTERVAL_ROUNDING` with its "ASSUMPTION ... discovery item" comment at `:7-11`), or wherever
  19a moved the tiers as data: the one time-unit source the OQ-50 check confirms. Read only; no change.
- The one-place copy and label maps earlier phases created, which the sweep reads rather than
  duplicates: 15b's List-state labels (ACTIVE, DRAFT for a Draft List), 17's preference and tier labels
  (D36), 19b's modifier copy, 20a's stack labels, 38b's `src/shared/procedureEventCopy.ts` (the word
  "event" lives there only), and the provisional-label constants each open default was built with.
- RV-17's copy sites at plan time (confirm each by grep; 15b, 16, 19a, 21, 22, 27, 28, 30, 32, 37 and
  38b rewrite several): `shared/capture/UnitsCard.tsx:68` ("part intervals round up (assumption)"),
  `apps/demo/DemoControlPanel.tsx:226` (the callout), `apps/admin/flows/ReassignListFlow.tsx:31,112`
  ("PROPOSED reading of the RFP's open question", "free slot"), `apps/admin/screens/BillingMonitorScreen.tsx:107-111,203`
  ("Where the RFP leaves open", "held as a discovery question"; 37 and 40 should remove both),
  `shared/booking/BookingDetailBody.tsx:486-489,680` (the post-op addendum banner and "the RFP
  immutability answer"; 38b withdraws the addendum), `apps/demo/DemoXero.tsx:56-61` (the NHI callout,
  "an unresolved contradiction needing an AA ruling"; 16's to reword), `apps/admin/screens/MasterData.tsx:44,241,253`
  ("Permanent lists", 30's to rename). Further hits: `apps/admin/screens/InvoicesScreen.tsx:89` ("RFP
  split billing wording is held as a discovery question"), `apps/admin/screens/InvoiceDocument.tsx:216`
  (GST "a demo assumption ... A discovery item for AA") and `:510-513` ("the agreed deposit", "the full
  estimated fee", "the balance is invoiced after the procedure", "a discovery point"; 27 and 41 should
  rewrite them), `apps/admin/screens/IntegrationMonitorScreen.tsx:424-425` (the NHI validator note),
  `apps/demo/DemoXero.tsx:65` (duplicate-number setting "an open item to confirm in discovery") and
  `:499` ("% prototype assumption. The RFP does not specify", 16's to remove),
  `shared/booking/BookingDetailBody.tsx:650` ("Copy booking", 15b's to remove), and comments in
  `domain/billing/timeUnits.ts:7-11`, `store/prepaymentActions.ts:17-18`, `domain/billing/agencyFee.ts:4`,
  `domain/billing/invoiceBuild.ts:34`, `apps/admin/reviewFlags.ts:5-9`, `domain/types.ts:388,564`,
  `domain/seed/rvgCodes.ts:8`, `domain/billing/modifierCodes.ts:6`, `store/paymentActions.ts:20-22`,
  `store/bookingActions.ts:181,278`, `shared/surface/context.ts:92`, `domain/nhi.ts:4`,
  `apps/admin/flows/ReassignListFlow.tsx:31-32` (several of these files are replaced by 18 to 27).
- `aa-prototype/src/shared/audit/auditNarrative.test.ts`: the "label coverage" source scan
  (`import.meta.glob('../../store/**/*.ts', { query: '?raw', ... })`) to copy for the copy guard (work
  item 6d); `src/pwa/pwaPurity.test.ts` and `src/domain/domainPurity.test.ts` use the same pattern.
- Playwright: `aa-prototype/visual/demo-actions.spec.ts` (Phase 14), `visual/demoActions.ts` (its
  helpers), `visual/pwa-device.spec.ts` (the PWA project), `visual/phase12.spec.ts` (scenario jumps),
  `playwright.config.ts` (the `pwa-device` project has `testMatch: /pwa-device\.spec\.ts$/` and
  `prototype` the matching `testIgnore`, so a new PWA spec needs both regexes widened).
- Docs: all of `docs/demo-guide/`; `aa-prototype/README.md` (Control Panel, Demo actions, Office
  simulation sections); `requirements-board/capture/ATLAS.md` ("Scenario jumps" table, the
  `scenario-s1` to `scenario-s5` and `scenario-confirm` hooks) and the capture recipes whose setup is
  `{ "scenario": "Sn" }` (28 uses in 20 recipes at the 2026-10-08 count: 25 `S3`, 3 `S5`; for example
  `US-08.1.1.json`; recount, since later phases add recipes).

## Work items

Session 1: the inventory (1), the code (items 2 to 6, small, test-backed) and the figures (7).
Session 2: the documents (8 to 11), the QA pass (12) and the record (13). No domain or billing
behaviour changes. The seed does not change unless a scenario jump truly cannot be staged through
existing guarded actions; if it does, bump `PERSIST_VERSION` by one, extend the migrate test, and say
why.

### Session 1: code and baseline (items 1 to 7)

1. **Inventory (working notes in the scratchpad while you work; the tables Session 2 needs are
   copied into the draft PROGRESS entry at the end of Session 1, not into a separate report file).**
   - Every beat, lettered beat (1b, 3a, 3b and so on) and optional aside in the current
     `03-demo-script.md`, with its screens, the Demo actions entries it presses, whether it has a
     mobile side, and its source phase. Flag every beat still built on a superseded reading for
     removal. From the earlier updates: the swap request with office confirmation, the prepayment
     gate, the confirm step at submit and tap-to-read on the triangle (US-13.7.3), the 5% fee, the
     addendum Booking (38b), Copy a Booking (15b), "Permanent List", unavailability turning Lists into
     Draft Lists without the anaesthetist's choice (US-01.5.5), the update email prompted after a save
     or a cover change (D19), surgeon PDF upload, photo capture or automated change application shown
     as in scope (Future Work), two people editing one Booking (US-02.5.6), and the carried-forward
     negative invoice (D21). **From the 2026-10-08 update:** the prepayment **estimate**, its
     contingency units and estimated duration, the **deposit**, the **balance invoice** raised after
     authorise and the **overpaid prepayment** "excess accepted" beat (US-06.2.3 to US-06.2.5 and
     US-06.4.2 Retired; a prepaid Procedure is priced at the prepaid amount and nothing is raised
     automatically); a prepayment re-check on a move (D20); the **ASA card**, ASA seeding,
     procedure-default modifier pre-fill, "untickable default modifiers" and absorbed-modifier refusals
     (19b); the **default hospital or insurer Contract**, the protected default Type 1, **Type 1/2/3**,
     the **billing route**, default RVG Contracts and the picker "filtered by procedure then hospital"
     (18, 19a, 20); required booking inputs (US-04.2.7 Retired); the Contract's payment setting and
     **"Funder allocation"** (22's Split button); the guardian override record (21's payer on the
     Booking); per-Contract multi-procedure rules and ordinal second-procedure prices; the hourly
     rate x time line and Method 3 (24); the **blacklist** and any preference prompt on an
     anaesthetist's own move (17, D44); **"DRAFT" or "Open" for an assigned List** (15b); a List
     disappearing at invoice generation (38a: it leaves the main view once finalised and sent to
     invoicing, and is found by archive or search); and "Stage child billed directly" (21 seeds the
     child-payer case instead).
   - Every registry entry: dump `DEMO_TRIGGERS` (id, label, `screen`, `routes`, `surfaces`, `badge`,
     `indexPath` on the pristine seed) with a throwaway script or `vitest` snippet in the scratchpad.
   - Every scenario jump's current staging and message.
   - The D1 to D46 table from drift-check step 3, and the open OQ list from step 2.
   - Every phase's "For the owner's review" list, from its PROGRESS entry, for item 13's one list.
   This inventory drives items 2 to 13.
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
     - **S1, S2, S4:** reset only. S1's sync and match, S2's recurring clash, colleague moves and pool
       rows, and S4's prepaid Booking, events and payout staging are done live from each beat's Demo
       actions or product buttons, so the presenter sees them happen.
     - **S3:** reset, then check both Souter Mon 20 Lists are SUBMITTED (the existing precondition).
       The fee-run and payment-run beats stage live from their Demo actions ("Seed a month of BCTIs",
       "Stage a payment week"), so the jump does not pre-run them.
     - **S5:** reset; stage the audit trail on David Chen's Booking with Phase 35's admin save path
       (`saveBookingPatch` as planned) for the office edit (so History shows a grouped change set) and
       the anaesthetist's own edit path for 19b's staged modifier edit (an ASA III modifier claimed
       with its explanation, then removed; whatever 19b's entry records); then authorise Dr Whitaker's
       Fri 17 List so each Procedure's pricing snapshot is written (25) and its invoices exist.
   - `beats[].path` resolves a deep link from state (seed constants, `listIdForSlot`, or a selector
     such as "the first S3 invoice after authorise"), returning `null` with the reason in the label
     when the target does not exist yet (for example an invoice before the List is authorised, or a
     remittance advice before the weekly run).
   - Messages are rewritten to the new beats: short, each beat named by its screen and its Demo
     actions entry, no en or em dashes, no "Control Panel" instructions except the index, and the
     catalogue's vocabulary ("move", never "swap"; "session", never "slot"; "prepaid amount", never
     "estimate" or "deposit"; "Not preferred", never "blacklist"). The S2 text no longer says "vacated
     slot".
   - Vitest `demoScenarios.test.ts`: on a fresh store each `stage` returns `ok: true`; S3's Lists are
     SUBMITTED; S5 leaves a change set on Chen's History and a pricing snapshot on each of Whitaker's
     Procedures; staging twice from reset gives deep-equal domain state (determinism); every non-null
     beat path matches one of the app's route patterns and names ids that exist in state; every
     title, blurb, message and label is dash-free and free of `swap`, `Permanent List`, `Card`,
     `slot`, `Copy booking`, `blacklist`, `estimate`, `deposit`, `Type 1|2|3` and `billing route`.
3. **Control Panel page reads the module** (`DemoControlPanel.tsx`): `ScenarioJumps` renders from
   `DEMO_SCENARIOS`. After a jump it shows the message and a numbered list of beat links ("Beat 1 ·
   Admin Intake"), each navigating to `path(state)` evaluated at click time (disabled with its reason
   when `null`). Keep the `scenario-<id>` and `scenario-confirm` `data-shot` hooks exactly. Keep
   "Clock & reset" and Phase 14's "Demo actions by screen" index; no trigger buttons on the page.
   Update the page subtitle. If the billing-assumption callout survived 19a, rework it per item 6a.
4. **Trigger audit, in tests.**
   - Vitest `src/shared/demoTriggers/demoTriggerAudit.test.ts` (extends, does not duplicate, 14's
     `demoTriggers.test.ts`):
     - every entry with `badge: 'office-stand-in'` has `surfaces` exactly `['pwa']` and only
       `/mobile/...` routes (this covers the colleague stand-ins too: 32's "Colleague moves a List
       into my free session" and 32a's "Colleague moves a Booking to me", whatever badge their
       entries record);
     - every entry whose `surfaces` is exactly `['pwa']` has only `/mobile/...` routes (the PWA has
       nothing else; 43a's "Sign out" included); an entry on both surfaces may route elsewhere too
       (40a's `nhi-hub-mode`, 23's `load-multi-procedure-booking` and `feed-changes-primary`, 39b's
       `stage-post-op`, 43a's "Show first-run hints again"), but it must have at least one `/mobile`
       route;
     - no entry declares a `/demo/control` route (the Control Panel is the index, never a trigger host);
     - no two entries visible on the same route **and the same surface** share a label (a bar entry
       and a PWA entry may share one, as Phase 27's "Move to 2 days before procedure" does);
     - every entry's `indexPath`, on the pristine seed **and** on each scenario's staged state, is
       `null` or matches one of its own `routes`;
     - no label from a withdrawn flow or superseded reading survives: no label or description matches
       `/swap|cover request|offer cover|tap to ask/i` and no id matches `/swap/` (32, D7);
       `/copy (a )?booking/i` (15b); `/addendum/i` (38b re-pointed `stage-post-op`, which keeps its
       id); `/\bslots?\b/i` (OQ-64); `/blacklist|whitelist/i` (17, D44); `/estimate|deposit|balance
       invoice|overpaid|excess/i` (27, 41: there is no estimate and no overpaid case; if 41 kept an
       entry for its by-hand settlement beat, its label says what it stages in the new words);
       `/Type [123]\b|billing route|default (hospital |insurer )?Contract/i` (18, 20); and
       `/child billed directly/i` (21). 33's PWA stand-in `matching-office-matches-row` **keeps its
       id** (34 re-pointed it): assert it carries 34's label ("Hospital sync delivers my booking", or
       whatever 34's entry records) and that 33's "Hospital row arrives and the office matches it"
       label is gone;
     - 15a's shared "Raise sample warnings" stages at least one sample per registered warning rule:
       every id in `WARNING_RULES` (`src/domain/warnings/rules/index.ts`) has an entry in
       `WARNING_SAMPLES` (`src/store/warningSamples.ts`), and staging them all on a fresh store raises
       one open warning per rule. At plan time the rules are 15a's prepayment rule (re-pointed by 20
       and 27), 19's out-of-range base units (D3, D35), 21's child payer (D4) and insurer indicated with
       no insurer Contract (D28), 27's prepaid price missing (D27, OQ-92) and 40's patient balance (with
       D24's mild credit-balance case, whether 40 built it as its own rule or a level of the same one);
       take the real ids from their entries; a rule without a sample fails;
     - every entry carrying `badge: 'future-scope'` is one of an explicit expected list kept in the
       test, with its expected surfaces: at plan time 15b's "Photo capture (Future scope)" (Mobile ·
       List, bar and pwa, US-02.4.4), Phase 34's `fire-hospital-message` and `replay-hospital-message`
       (as 34 left them after 20a's Booking-route re-point: check both entries and record which routes
       survived), `auto-match` (`/admin/intake/matching`) and "Ingest PDF row" (Surgeon PDFs,
       US-02.2.1), all bar only unless an entry records otherwise. A new future-scope entry must be
       added to the list deliberately;
     - **the privacy boundary holds** (17, D44, US-13.6.3): no entry with a `/mobile` or `/web` route,
       and no PWA entry, mentions a preference, a pairing or a tier in its label, description or
       message (`/prefer|pairing|tier/i`).
   - Playwright `aa-prototype/visual/demo-actions-audit.spec.ts` (framed build): for every row of the
     Control Panel index that has an "Open screen" link, click it and assert the harness bar's
     `[data-shot=demo-actions]` pill lists `[data-shot=demo-action-<id>]`; then open one screen that
     registers nothing (for example the web past-work calendar from 38a, which needs no trigger) and
     assert the pill is absent. An entry gated by a `when` that the screen alone does not satisfy
     (an `indexHint` step, or a published context key such as 40a's `nhi-hub-mode`, which shows only
     while an Add booking or NHI surface is open, 23's `feed-changes-primary` on a Booking with two or
     more Procedures, or 39's entries on an invoice that must exist first) is either driven to that
     state by the spec or listed in an explicit, reasoned skip list in the spec; never skipped
     silently.
   - Playwright, PWA project (`visual/pwa-device.spec.ts`, or a new spec with the `pwa-device`
     `testMatch` and the `prototype` `testIgnore` widened to match it): sign in through 43a's screen
     first (or use 43a's test helper), then for each mobile screen (Lists and its archive and search, a
     List, a Booking with its stack and events list, Availability and its calendar, Balances, More and
     the profile and prepaid list under it), assert the "Demo" chip is present or absent as the
     inventory (item 1) expects (item 12's parity matrix corrects the table in Session 2 if the
     handset pass disagrees), and that each expected entry's label is in the sheet. Keep the expected
     table in the spec, one row per screen. Assert too that no mobile screen renders a preference or
     tier label (17's privacy boundary, end to end).
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
   a. **RV-17's sites** (grep each first; several were rewritten by 15b, 16, 19a, 21, 22, 27, 28, 30,
      32, 37 or 38b, and a site that no longer exists is recorded as "already fixed by Phase NN"):
      - **Control Panel callout** (`DemoControlPanel.tsx:226` at plan time; 19a should have deleted
        it): if it survives, both time-rule caveats go (D25, US-05.2.2 Confirmed). Relabel "Billing
        assumption" as "Billing rule" and state, with no caveat and no "to confirm": "Time units come
        only from the RVG rule: 1 unit per 15 minutes for the first two hours, then 1 per 10 minutes,
        and a part interval always rounds up." If 19a exposes the tiers as data with a label or
        formatter, word the sentence from that, so the callout cannot drift from the tiers.
      - **T stepper caption** (`UnitsCard.tsx:68`, wherever it still renders): no "(assumption)":
        "From start and finish · RVG rule: 1 unit per 15 min or part, then per 10 min after 2 h".
      - **Reassign List flow** (`ReassignListFlow.tsx:31,112`, reworked by 17, 28, 30 and 32): no
        "Proposed reading", "the RFP leaves ... open" or "replaceable" copy, and no "free slot". OQ-08
        is answered; the move between sessions is the mechanism. The picker orders by priority tier,
        shuffled within a tier, with not-preferred pairings apart and a soft warning (17, D44; the
        names are D36, provisional only if 17's UI labels them so). The status the vacated session
        takes is OQ-84, still open: keep the label 32 (or 28) gave it, citing OQ-84 and naming its
        default, and never present it as settled.
      - **Billing monitor** (`BillingMonitorScreen.tsx:107-111,203`): FT-13.3 is **Confirmed**, so
        the placement is stated plainly ("The office's billing monitor, in the Admin App"), with no
        "proposed" and no "the RFP leaves open". Phase 37 rewrites this subtitle and Phase 40 owns
        the "Prior balance" sentences and the `:203` tooltip (RV-21); a survivor is a 37 or 40
        regression for item 12 (fix only if small). The unpaid balance counts from the invoice date
        (OQ-74, D24), stated as the rule. 39a's weekly payment cycle controls sit near here too: their
        copy states US-10.2.6's approval step plainly and the weekly ISO-week cycle as the design
        (US-10.2.7 and OQ-47 are Proposed: "proposed", not "open").
      - **Booking detail post-op and immutability copy** (`BookingDetailBody.tsx:486-489,680` at plan
        time): 38b withdrew the addendum Booking, so the "Post-op addendum" banner and "the RFP
        immutability answer" should be gone. Anywhere an AUTHORISED Booking is described as locked,
        state it as the design (US-07.3.2, Proposed: "locked once authorised; later work is an event on
        the Procedure"). A survivor is a 38b regression.
      - **Xero NHI callout** (`DemoXero.tsx:56-61`): OQ-30 is answered and US-09.3.1 Confirmed: "No
        personal information is held in Xero; a unique ID links each transaction back to our invoice",
        with no "contradiction" or "AA ruling". Phase 16 rewords it; a survivor is a 16 regression.
      - **Master data "Permanent lists"** (`MasterData.tsx:44,241,253`): Phase 30 renames the view to
        recurring bookings (DM-53); a survivor is a 30 regression.
   b. **Further hits, same treatment:**
      - **Invoices screen subtitle** (`InvoicesScreen.tsx:89`): FT-08.2 is Proposed, so the label
        stays fair but its wording changes: "one invoice per party billed within a Booking; each
        Procedure's Contract decides who is billed: its holder, or the payer on the Booking (proposed)"
        (D17 superseded), with no "discovery question", "RFP split billing wording", "funder" or
        "Card". (Phase 21 or 22 may already have done this.)
      - **Invoice document GST footer** (`InvoiceDocument.tsx:216`): **US-05.2.7 is now Confirmed**:
        prices are held excluding GST and GST is worked out only at the foot of the invoice. State it
        as the rule, with no "proposed", "demo assumption" or "discovery item"; word it to what 22's
        entry says the invoice now shows. Keep Phase 22's provisional agency wording (OQ-29) and the
        provisional BCTI wording where they sit.
      - **Invoice document prepayment text** (`:510-513`): drop "the agreed deposit", "the full
        estimated fee", "payment is required before the procedure proceeds", "this invoice covers the
        balance" and "a discovery point" (27 and 41 should already have rewritten them). State the rule
        as built: the system generates the prepayment invoice when a Procedure is on the anaesthetist's
        prepaid set and a person pays for the patient (D23); the amount is the anaesthetist's own fixed
        price, in full (US-06.2.2, D6); it is held until the office approves and sends it; after the
        procedure the prepaid amount is the price, the prepayment is deducted and nothing is invoiced
        or credited automatically (US-08.2.2, US-06.4.1 Confirmed; OQ-61 and OQ-76 answered). Only the
        open defaults keep a label, in the owning phase's words: OQ-80 (D38), OQ-92 (D27), OQ-96 (D30),
        OQ-97 (D31). 41's letter wording ("the prepaid amount as the price") must agree.
      - **Xero pair fee line** (`DemoXero.tsx:499`, "% prototype assumption"): Phase 16 took the fee
        off the payable and should have removed this line. D1 is answered, so any surviving fee note on
        the AA fee pair states the rule (fixed charges plus a charge per BCTI, from the AA fee
        settings) and labels as provisional only what is open: what the per-BCTI charge counts (OQ-60)
        and the BCTI granularity. Never "prototype assumption" or "the RFP does not specify".
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
      `prototype's proposal`, `immutability answer`, and for the superseded model and vocabulary:
      `Type 1|Type 2|Type 3|billing route|default (hospital|insurer)? ?Contract|protected default|funder|Funder allocation|addendum|5%|service fee|deposit|estimate|balance invoice|overpaid|contingency|ASA (seed|pre-?fill)|absorb|required inputs|hourly|Method 3`,
      `swap|Permanent List|timesheet|cover request|Card\b|Copy booking|\bslots?\b|blacklist|whitelist`,
      and List-state copy (`'DRAFT'` or `"Open"` rendered for an assigned List). Each is a regression
      of the phase that owned it (15, 15b, 17, 18, 19a, 19b, 20, 21, 22, 24, 27, 28 to 32, 38b, 41; fix
      if small). **"slot" in rendered copy** (OQ-64, D14) is the biggest of these: Slot stays an
      identifier, type and planning word, but no label, heading, button, tooltip, toast, empty state,
      demo trigger label or scenario message says it; use "session", "AM" or "PM" (and the status
      master's labels for statuses). Separate identifiers (`slotFor`, `selectedSlotId`, `data-shot`
      values, route params) from copy before counting a hit; likewise "estimate" in an unrelated
      sense and "DRAFT" on a Draft List are not hits. Also check that the submit path has no confirm
      step for a warning and the triangle no tap-to-read (US-13.7.3, 15a). Classify every rendered
      hit:
      - **settled in the catalogue** (an Answered OQ, an answered or superseded owner decision in its
        new reading, D42 to D46, or a Confirmed item): state the rule plainly, with no provisional
        label;
      - **still open** (an Open OQ at HEAD, D11, D26 to D41, or the BCTI granularity point): keep it,
        labelled "provisional" or "to confirm with AA", citing the catalogue OQ id (or "BCTI
        granularity, with OQ-29 and OQ-60"), not "the RFP". At plan time this includes OQ-90 on the
        multi-procedure rule (23), OQ-89 on a Contract line's time band and the adjustment on a fixed
        discount (19a, 24), OQ-95 on the age bands (19b), OQ-93 on the insurance indication (21),
        OQ-92, OQ-96 and OQ-80 on prepayment (27), OQ-97 on a part credit (41), OQ-98 on plain RVG
        Contracts (18, 20), OQ-99 and OQ-103 on a blank or general procedure (19, 20, 21, 33), OQ-101
        on a group's range (19), OQ-88 on the system code (19), OQ-102 on the preference and tier names
        (17), OQ-84 on the vacated session's status (32), OQ-79 on the notification pool (32), OQ-85
        on the single-Booking move (32a), OQ-81 part 3 on short-notice sickness (30), OQ-83 on sign-in
        (43a), OQ-77 part 3 on a split before sending (39), OQ-60 on the fee count (16), OQ-29 on GST
        agency (22), OQ-13 on the download format (34), OQ-12 on ACC pre-op codes (39b), OQ-100 on a
        schedule upload (42) and D11 (40). A phase may have chosen to show no label for a default
        that needs none on screen (its entry says); the guide follows the UI;
      - **Proposed** catalogue item: the design ("proposed"), never "AA confirmed", never "open
        question" (OQ-47's payment day included);
      - **Future**: the "Future scope" badge (Phase 14's `DemoBadge` tone), never "open question".
      Never describe as settled anything still open, the BCTI count included. Update code comments that
      cite a superseded ruling (`timeUnits.ts:7-11` now cites OQ-50 and OQ-75 answered and US-05.2.2
      Confirmed, and the other comment sites in the Reference list, each wherever it now lives, if the
      owning phase did not) to cite the catalogue item or OQ; no behaviour change.
   d. **Copy guard test** (`aa-prototype/src/appCopy.test.ts`, modelled on the label-coverage scan in
      `auditNarrative.test.ts`, via `import.meta.glob(..., { query: '?raw' })`): read every
      `src/**/*.ts(x)` and `pwa/**/*.ts(x)` except `*.test.*`, strip `//`, `/* */` and JSX `{/* */}`
      comments, and fail on:
      - `–` or `—` anywhere in what remains (string literals and JSX text);
      - `/RFP (open question|leaves|labels|is silent|does not (state|specify)|defines the tiers)/i`,
        `/open RFP question/i`, `/RFP('s)? immutability answer/i`, `/discovery (item|question|point)/i`,
        `/\(assumption\)/i`, `/(demo|prototype) assumption/i`, `/proposed reading/i`,
        `/to confirm (with AA )?in discovery/i`;
      - the retired words in rendered copy: `/\bswap(s|ped)?\b/i`, `/Permanent lists?/i`,
        `/timesheet/i`, `/cover request/i`, `/Copy (a )?booking/i`, `/addendum/i`,
        `/blacklist|whitelist/i`, `/Type [123]\b/`, `/billing route/i`,
        `/(protected )?default (hospital|insurer) Contract/i`, `/Funder allocation/i`,
        `/(pre-?payment|prepaid) (estimate|deposit)|estimated fee|agreed deposit/i`,
        `/balance (is )?invoiced/i`;
      - `/\bslots?\b/i` in **rendered copy only**: JSX text, and string literals that contain a space
        (sentence-like copy, labels, messages), so identifiers, `data-shot` values, kebab ids and
        context keys do not trip it. Keep the narrowing rule in a tested helper with fixtures for
        both sides ("Reassign to a free slot" fails; `'adminDay.selectedSlotId'` and `'slot-am'`
        pass).
      - **List-state copy:** assert through 15b's (and 31's) one List-state label function, not a
        regex: an assigned List renders ACTIVE (or its label), never "DRAFT" or "Open"; DRAFT renders
        only for a List with no anaesthetist.
      Seed each pattern from a real plan-time hit (the grep in the Reference list: "part intervals
      round up (assumption)", "The RFP defines the tiers but not the rounding", "a demo assumption",
      "% prototype assumption", "The RFP labels", "an open item to confirm in discovery", "the RFP
      immutability answer", "Copy booking", "vacated slot", "the agreed deposit", "the full estimated
      fee", "Permanent lists") so a unit test proves the guard would have caught it.
      An allowlist keyed by file and phrase holds the kept caveats, each with a one-line reason and
      its OQ id or catalogue item (the NHI mod-11 flag, US-11.1.2; a "Terms not to use" style help
      string, if any). An entry whose OQ is Answered at HEAD is deleted, not kept: there is no OQ-30,
      OQ-31, OQ-43, OQ-50, OQ-61, OQ-75, OQ-76 or OQ-78 entry.
      **Must-keep list** in the same test: assert the live caveats are still present, so a sweep
      cannot remove them by accident: the provisional BCTI granularity label wherever 16 and 22 put
      it (the AA fee settings or run, and the ACCPAY), the OQ-90 label on the multi-procedure rule
      (23), the OQ-89 label on a Contract line's time band or the fixed discount (19a, 24), the OQ-95
      label on the age bands (19b), the OQ-84 label on the vacated session's status (32), the D11 label
      (40) and the NHI mod-11 flag, plus every other open default whose phase put a label on screen
      (take the list and the exact strings from the built screens and the entries). Assert too that,
      if the Control Panel callout exists, it states the rounding rule and carries no "confirm"
      wording, and that no string still labels D9 provisional.
7. **Re-baseline the figures (no code).** From **Reset → Confirm reset** (and from each scenario jump),
   walk every beat on the framed build and write down every figure and identifier the guide will
   quote, read from the screen: invoice numbers and totals, GST at the foot, the payable, each
   Procedure's price and price source (office override, the anaesthetist's price, fixed price, fixed
   rate, fixed discount) and the layer its base units came from (Contract line, procedure or RVG
   group), the Split shares, the AA-FEE invoice total and its line items (the $500 + $5 x 40 = $700
   example for Dr Rutherford after "Seed a month of BCTIs", and Dr Souter's own month), the BCTI
   counts, ledger tiles and the imbalance amount, the weekly payment run's approved total and the
   remittance advice lines (positives, the netted negative, the net paid), the credit note and rebill
   numbers (components equal to the credit), the additional invoice and the event invoice lines, the
   prepaid amount (Dr Souter's own fixed price for Riley's rhinoplasty, $1,200.00 ex GST at plan time)
   and the part-paid amount, the prepaid Procedure's price after authorise (the prepaid amount, with
   nothing left to bill), the payable after a single-Booking move, the 3/2/2 split, warning counts on
   the to-do list, notification pool rows, conflict and Draft List counts, waiting times, sync times.
   Never compute a figure by hand; where two surfaces show the same figure, they must agree, and a
   disagreement is a bug for item 12. The table goes into the PROGRESS entry, with the BCTI-dependent
   figures marked so a granularity flip re-baselines them in one place.
**End of Session 1:** build, build:pwa and Vitest green (the item 5 file-level assertions still
skipped); the draft Phase 44 PROGRESS entry holds the drift-check result, OQ list, D1 to D46 table,
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
   - Answered and superseded owner decisions are told as the rule, in their current reading, with no
     caveat; answered OQs likewise. Every provisional reading (D11, D26 to D41, an open OQ, the BCTI
     granularity) is named as provisional with its OQ or D number, in the UI's words.
   - Catalogue vocabulary in everything the audience hears (the Goal's list): "session", "AM" or
     "PM", never "slot" (Slot stays the planning word in the mental-model explanation only); "move",
     never "swap"; "event" in the label 38b chose; "No contract (RVG)"; "the payer on the Booking";
     "who is invoiced"; "the prepaid amount", never an estimate or deposit; "Not preferred" and
     "Preferred", never blacklist; ACTIVE for an assigned List and DRAFT only for a Draft List; and
     "procedure" (a list entry) kept distinct from "Procedure" (the booked item).
   - Where a Say line explains pricing, use AR-28's plain wording (Reference), never the draft
     design's field names; any AR-35 wording on screen is called illustrative demo data, never AA's.
   - Discovery points list only questions open at HEAD, by OQ id and title.
   - Then un-skip `demoGuideSync.test.ts` (item 5) and make it pass.

   The target shape (confirm each beat and its order against the inventory and the phases' "Demo
   guide updates"; merge, trim or move to an aside if a scenario would run over its time):

   | Scenario (time) | Core beats | Optional asides |
   |---|---|---|
   | **S1 · Booking to theatre** (9 to 10 min) | 1 **Sign-in** on the handset: Dr Souter signs in, PWA first (43a, US-13.5.3; the sign-in experience beyond that is OQ-83, provisional in 43a's words); the framed phone is already signed in. 2 **Sync, then match**: Mobile Tue 28 Jul AM (three booked, two showing the rooms' wording as received); Admin Intake, Demo actions → Simulate sync (34; the download format per hospital is OQ-13), Sarah Mitchell's row showing the hospital's wording as received ("lap appy ?conv to open"), the patient reused by NHI, Create Booking; nothing applied without the office (FT-02.1, US-02.1.3). Her unpaid balance raises the mild or strong warning at booking, counted from the invoice date (40, D24): script it, do not hide it. 3 **The office sets the Contract**: the Booking sits on the Admin Day "Needs a Contract" card (20); the office confirms the procedure on the two-tab picker and picks the Contract: **No contract (RVG) first**, then the Contracts whose holder fits this Booking under holder headings, with one search across AA code and holder codes (18, 20, D16); who is invoiced follows the Contract's holder or the **payer on the Booking**, prefilled from the patient (21, D17). Back to Mobile for the fourth Booking. 4 **The three-part stack** (20a, US-03.1.9): each Procedure shows the wording as received, then the procedure and RVG code, then the Contract (name and holder, who is invoiced, the pricing basis with its figure), on every booking screen in both apps. 5 The day arrives (clock; the catch-up sync applies nothing silently). 6 **Capture on mobile**: the procedure confirmed on the two tabs (Procedures, RVG codes) under body-area headings (19); the starting base units from the Contract line, the procedure or its RVG group, any value accepted with an office warning when out of range (19a, D3, D35); **modifiers**: the age modifier from date of birth and P1 on a Neurosurgery or Spine code applied and locked, anything else claimed from the RVG table each with a short explanation, ASA included (19b, D43; the age bands are OQ-95, provisional); the one primary Procedure (23); time units by the RVG rule, a part interval always rounded up (D25, the rule); a hospital's price shown read-only (24); Mark complete checks the procedure, Contract, times, explanations, references and the payer's email (21); submit straight through with no confirm step (15a, US-13.7.3); **Worth pointing at:** the point-of-need help on capture and the first-run hint (43a). 7 **Find past work** (38a, D9): the main view starts today, earlier un-invoiced Lists by scrolling back; the archive jumps to a past day and drills to List, Booking and Procedure, invoiced work included; search "Mitchell" or her NHI. | A failed sync loses nothing (34). The other providers' sheets and the Future-scope auto-match (34). The two-source Booking: Dr Souter's Tue 4 Aug AM "RTK" with the hospital's later "right total knee" kept beside it (20a; AR-35's illustrative wording). The RVG codes tab: pick a code, the Contract lines across its group, and No contract (RVG) setting the group's general procedure (19, 20; its invoice wording is OQ-103, provisional). "As given" on a manually added Booking (20a). Any base units accepted, with the office warning (19). A pre-op event at capture, such as the ACC pre-op assessment as a fixed fee, in the Procedure's events list (39b; the ACC pre-op codes are OQ-12). |
   | **S2 · Office day** (12 to 14 min) | 1 **Read the day**: sessions and Lists (an assigned List is ACTIVE; Draft Lists in their own band), the session statuses from the user-maintained status master (29, D14), booking counts; **Worth pointing at:** the help on Admin Day (43a). 2 **Warnings on the to-do list**: Demo actions → Raise sample warnings (out-of-range base units, a child payer, an insurer indicated with no insurer Contract, a prepaid procedure with no price on the anaesthetist's own Contract, a paying patient with a balance), mild and strong, the triangle on a Booking in each app, the warning visible on opening it (no tap-to-read, no confirm step at submit), Clear; never a block (15a, with 19, 21, 27 and 40's rules; the insurance indication is OQ-93 and the missing price OQ-92, each provisional in its phase's words). 3 **A recurring clash becomes a Draft List**: Demo actions → Stage recurring clash on Master data · Recurring bookings (30, 31, US-01.3.2, D14); the DRAFT List waits with its waiting flag; **the office assigns it**: the picker orders the free anaesthetists by priority tier, shuffled within a tier, with not-preferred pairings in their own group and a soft warning on picking one (17, 31, D44; the names are OQ-102, provisional), and the List becomes ACTIVE. Anaesthetists never browse Draft Lists (D46). 4 Illness cover from the **conflict dashboard** (30; short-notice sickness is OQ-81 part 3, provisional), then the **on-demand update email**: the Booking's button, changes picked from the change history, the template for that kind of change, to the rooms or the hospital, sent by hand (35, D19, US-02.3.4; OQ-82 answered: manual only). 5 **An anaesthetist moves their own List** (32, D7): on the phone Dr Souter returns a List to the office and it lands on the Day band as a Draft List, at once, no confirmation and no preference warning (US-01.4.5, D44); marking a booked session unavailable offers **return to the office or assign to a colleague** (US-01.5.5); each move posts to the **shared notification pool** (D15; what else posts, and expiry, is OQ-79), and from the notification the office sends the cover-change email (35); nothing about a prepayment is re-checked on a move (D20); the vacated session's status is OQ-84, provisional; Demo actions → Colleague moves a List to the office for the office view in the framed build. 6 **An anaesthetist moves a single Booking** (32a, US-01.4.7): Move to a colleague, found by search, only onto an available session, landing on the colleague's List (created if needed), the payable following the doer (US-01.4.6) and a pool notice (how a single Booking moves is OQ-85, provisional). 7 **Authorise a submitted List** on Review: each Procedure's stack, the payer (changeable here), the insurance indication and any warnings, the anaesthetist's Contract change flagged and approved (20, 21), the price source with the anaesthetist's price and an office override side by side (24), and the help on Review (43a). | A phone-advice Booking into a free session, with "as given", the two-tab picker and No contract (RVG) first (28, 20a, 20). Find available in tier order (28). Availability weeks ahead from the phone's calendar (29). Simulate sickness, and move a holiday (30). Simulate incoming request (31). A colleague moves a List into Dr Souter's free session (Demo sheet → Colleague moves a List into my free session, 32) or a Booking to her (Demo sheet → Colleague moves a Booking to me, 32a). The payer review List: a child as the payer (a mild warning, D4) and a guardian named as payer with no warning (21). |
   | **S3 · Money end to end** (10 to 12 min) | 1 **Authorise**: the run writes each Procedure's pricing snapshot (the procedure, the Contract version, the resolved values and the layer each came from, BTM, rate and discount, the price and its source, who is invoiced, the payee) and raises and sends every invoice in Dr Souter's name with AA as agent, to email or portal (22, 25); each Procedure's Contract decides who is invoiced, its holder or the payer on the Booking (21); prices held ex GST with GST at the foot (US-05.2.7, the rule). 2 **The Xero pair**: the payable equals the receivable; one BCTI per receivable invoice, labelled provisional (BCTI granularity, with OQ-29 and OQ-60); buyer-created wording provisional (OQ-29); no patient name in Xero, only the hidden ID (16, 22, OQ-30). 3 Payment, ledger and disbursement detected from Xero; the processing monitor grouped by anaesthetist with sorting and filters (37, US-13.3.1); the web financial position and the flat outstanding list (D8) move (36, 38). 4 **The weekly payment run** (39a): the ISO week, Friday close, Monday checks, Tuesday schedule; Demo actions → Stage a payment week, approve the period's BCTIs, run payables, the remittance advice in Admin and web Accounts (US-10.2.7 and OQ-47 Proposed: "proposed"). 5 **AA's monthly fee run** (D1): the fee settings, Demo actions → Seed a month of BCTIs, run the monthly fee invoices, Dr Rutherford's $500 + $5 x 40 = $700 (figures as re-baselined), shown in web Accounts; what the per-BCTI charge counts is provisional (OQ-60) (16). 6 The ledger balances: an unmatched receipt, then allocate (36). | **The price precedence** (24, D40): on Dr Souter's Mon 27 Jul List, a fixed-rate Contract (BTM x the Contract's rate, read-only, US-05.2.6), a locked 10% fixed discount (US-05.4.3), a third-party fixed price read-only (US-05.2.5), and her own typed price or % discount with a reason on No contract (RVG); the office override on top at Review (the time band is OQ-89, provisional). The **Split** button on a Procedure's Contract line, each share a typed $ or % (22, D18). The 3-procedure Booking: Make primary and the 3/2/2 modifier split under the RVG default multi-procedure rule (23; whether the RVG rule still applies is OQ-90, provisional), and a combination Contract (23). A new Contract version from a date: the procedure date picks the price (18, D45). The cash-basis GST schedule (38). Record fee payment on the AA fee pair (16). |
   | **S4 · Exceptions** (12 to 14 min) | 1 **Prepayment from the prepaid list** (26, 27; D5, D6, D23, D42): Annette Riley's rhinoplasty is on Dr Souter's prepaid list and she pays for herself; the office sets her Contract, Dr Souter's own price list (kept by the office); the amount is Dr Souter's own fixed price, in full, never an estimate or a deposit (US-06.2.2); the invoice is generated with its ledger pair and draft Xero pair, "Awaiting approval"; Approve and send; Payment received · half: part paid; on Mobile the triangle, the warning on opening and the prepaid amount shown to her (US-03.1.8); complete and submit, no gate and no confirm step (when the pair is created is OQ-80, a missing price OQ-92, each provisional). 2 **The prepaid Procedure billed**: authorise; the prepaid Procedure is priced at the prepaid amount, locked (OQ-96, provisional), and the prepayment deducted leaves nothing to bill (US-08.2.2); nothing is invoiced or credited automatically, either way (US-06.4.1; Demo actions → Stage longer prepaid procedure on Review first, 41, so the longer recorded time visibly changes nothing); any extra is an additional invoice and any credit a credit note, raised by hand, a part credit of a prepayment allowed (41; OQ-97, provisional). 3 **Events on a Procedure** (38b, 39b, D13): the **events list** on the Procedure in each app (US-03.7.3); a **post-op event** from the phone, one standard review step, travelling with the Procedure's invoice before approval or invoiced in the next run (Demo actions → Run the next billing run). 4 **An additional invoice to any party**, free-form lines, recorded as an event: by the office, and by Dr Souter on her own Procedure through the same review step (38b, D10, D22, US-08.6.3). 5 Billing failure on a missing holder reference, and retry (25). 6 **The credit note option and credit-and-rebill** (39, 39a, D22): a credit note to any party, by the office or by Dr Souter on her own Procedure (US-08.6.5); after the anaesthetist was paid, Demo actions → Stage refund after payout, Credit in full and rebill from a copy of the original's lines (a product button, US-08.6.6), the rebuilt invoices equal to the credited invoice and the credit reversing the payable (OQ-77 parts 1 and 2 answered), the negative invoice; then Demo actions → Stage a payment week (its credit-after-payout choice), approve, and the negative **netted on the remittance advice** (US-10.2.5). 7 The date approaches: the warning strengthens (27; last, because it moves the clock). | The unmatched queue (33). A partial payment releases exactly what was received (16, 36, 37). Split a combined Procedure by a credit, then one invoice per component, equal to the credit (39, US-08.6.4); a split asked for before sending uses the same flow (OQ-77 part 3, provisional). Xero outage, a void made in Xero, bulk hospital remittance (37). Prepayment letter (the prepaid amount as the price) and reminder, the trust account, refund on cancellation, a moved prepaid Booking on the honour system (nothing re-checked, only the payee repointed; D20, D38), and a rebooking with a fresh prepayment at the new anaesthetist's own price (41). |
   | **S5 · Compliance tour** (7 to 9 min) | 1 The audit trail: change sets and View as at (35), including a claimed modifier with its explanation (19b). 2 NHI at entry: **NHI lookup** with validation and the Hub states (Demo actions or Demo sheet → Hub: Unavailable, then the manual fallback) (40a); the new-format NHI validates on the synced row; the **missing-NHI problem list** with attach and merge, and the authorise guard (40; D11 provisional, with Vanessa's lean to a mandatory NHI named as a discovery point). 3 No NHI in Xero, stated as the rule (OQ-30, US-09.3.1: only a unique ID links back), and the NHI leak scan (16, 43). 4 **Contract versions and the lock**: on the Health NZ agreed rate Contract (its holder Christchurch Public), New version from 1 Aug 2026; the Versions list shows the current version with Whitaker's invoices and the upcoming one with none; the procedure date decides the price (18, D45); Regenerate from locked data says identical (25). 5 **Authorise, then edit the unit value: the invoice is unchanged** (25, 26). | Sign out and back in on the handset, audited (43a). Simulate sign-in attempts (14). Restricted raw-row view and the synthetic-data badge (43). A controlled go-live load, with no Contract schedule upload in the first release (42; OQ-100, provisional). The patient view and its follow-up actions (40). HPI CPN shown the same everywhere and refresh from the NHI register (40a). |

   Also rewrite: **Pre-demo setup** (the Control Panel is the index; demo actions live in the bar on
   each screen and in the Demo sheet on a handset; "Play the office" off by default), **Direct URLs**
   (regenerate every table from the routes as built: the sign-in screen, Booking routes with the stack
   and the events list, Intake and Matching, the "Needs a Contract" list, Draft Lists, Recurring
   bookings, Conflicts, the notification pool, the to-do list, Contracts and contract holders, RVG
   groups and procedures, modifiers, AA fee settings and runs, the weekly payment run and remittance
   advice, Ledger and the trust account, the profile and prepaid list, the archive and search, Accounts
   sub-tabs, the Future-scope surface; drop dead ones such as `/web/accounts/overdue` and any swap
   queue, except as a redirect note), **How to read the readiness** (every catch-up phase built; the
   provisional readings listed: D11, D26 to D41 where a beat touches them, the open OQs, the BCTI
   granularity), **Recommended run orders** with the new times, **What to narrate rather than click**
   (Future scope: HL7 v2, FHIR R4 and near real time, warning settings (US-13.7.4), booking from a photo
   (US-02.4.4), surgeon PDF upload (US-02.2.1), automated change application and reschedule rules
   (US-02.5.x, OQ-87), two people editing one Booking (US-02.5.6), change emails sent automatically
   (US-02.3.5), a Contract schedule upload (US-04.2.13), a procedure not on the Contract's schedule
   (US-04.3.7); a negative invoice with no later payment, handled outside the system (D21); real Xero,
   email and OCR; the full-scale point now has 43's load), and **Recovery from demo accidents** (the
   Control Panel's beat links and "Open screen" links; stuck draft: Discard; imported twice: nothing
   new added; samples raised twice: Clear sample warnings; a List moved by mistake: move it back from
   the same sheet, the pool keeps both notices; a wrong Contract picked: Change on the Contract part,
   flagged at Review).
9. **Bring the other guide files into line** (one consistency pass each; subagents can draft 01, 02
   and 04 in parallel from the rewritten 03 while you check them):
   - `04-presenter-cheat-sheet.md`: the five nouns and "Terms not to use" in catalogue vocabulary
     ("slot" (say session, AM or PM), "swap", "Permanent List", "timesheet", "Card", "Copy booking",
     "addendum", "blacklist", "Type 1/2/3", "billing route", "default hospital Contract", "estimate" and
     "deposit" for a prepayment, "DRAFT" or "Open" for an assigned List, "Funder allocation" among
     them); lifecycle and permissions (the four List states); **Contracts and pricing**, in AR-28's
     plain words: RVG groups and curated procedures with a general procedure per group, the two tabs;
     contract holders (third party and first party) and dated versions; No contract (RVG) first, then
     holder-fit Contracts, the office setting the Contract and the anaesthetist able to change it until
     submit; who is invoiced (the holder or the payer on the Booking); the starting units from line,
     procedure or group; modifiers (locked age and P1, optional ones with an explanation); the price
     precedence (override, the anaesthetist's price on No contract (RVG) and their own Contracts only,
     fixed price, BTM x fixed rate or their unit value less a locked fixed discount); the Split button;
     the multi-procedure rule; the pricing snapshot at authorise; the three-part stack; warnings, never
     blocks, seen on opening the Booking; the shared notification pool beside the to-do list;
     preferences and tiers, admin only; the money model on the ledger with the payable equal to the
     receivable, the AA fee as its own monthly invoice, the weekly payment run with netting;
     prepayment at the anaesthetist's own fixed price, only for a person paying, nothing automatic
     afterwards; events (additional invoices, credits, pre-op and post-op) with one review step, raised
     by the office or the anaesthetist; "Present but honestly demo-only" (Demo actions menu, Demo
     sheet, office stand-ins, "Play the office" off by default, Future-scope surfaces, AR-35's
     illustrative wording, the synthetic-data badge); the "RFP ambiguities" section becomes **"Open
     questions to raise"**, one entry per OQ open at HEAD that a beat touches, with the default built,
     plus the BCTI granularity point for AA's accountant; likely evaluator questions re-answered,
     including "what if the office never confirms?" (it doesn't need to, D7), "who finds out when an
     anaesthetist moves a List?" (the shared notification pool, D15), "can I move just one Booking?"
     (yes, 32a), "can a warning stop me?" (no), "can I copy a Booking?" (no: retired, US-02.4.3), "who
     decides which Contract applies?" (the office at setup, No contract (RVG) first; the anaesthetist
     may change it until submit, flagged at review), "can the anaesthetist change the price?" (only on
     No contract (RVG) or their own Contracts; a third-party price is read-only), "what if the
     procedure turns out bigger than the prepaid one?" (nothing automatic; an additional invoice by
     hand), "does the system notice when a prepaid Booking moves?" (no, the honour system, D20) and
     "can an anaesthetist see who they are not preferred with?" (no, admin only, D44).
   - `02-workflows-and-handoffs.md`: every workflow re-read end to end against the app (schedule
     canvas with sessions painted from availability first, then recurring bookings, a recurring clash
     becoming a Draft List; intake by sync and matching, with the wording as received and the office
     setting the Contract; Draft Lists assigned by the office with tiers and preferences; cover by
     conflict or the anaesthetist's own move of a List or a single Booking, with return-or-assign and
     the notification pool; the on-demand update email; capture with the two tabs, modifiers and
     explanations, events, warnings and the to-do list, submit and review, billing run and the pricing
     snapshot, ledger and Xero, the weekly payment run and netting, the AA fee run, prepayment and
     by-hand settlement, exceptions, the main view, archive and search), and the readiness table
     (every row built, with its phase).
   - `01-personas-and-responsibilities.md`: duties and permissions as built (the anaesthetist's
     profile, unit value and prepaid list, sign-in, the stack, changing the procedure or Contract
     until submit, claiming modifiers with explanations, the payer, their own price on No contract
     (RVG) and their own Contracts, moving their own List or a single Booking, events, their own
     additional invoices and credit notes, past work; the office's matching, setting Contracts, the
     anaesthetists' own price lists, Draft Lists, preferences and tiers, conflicts, the to-do list and
     the notification pool, the update email, approvals, the Split, the weekly payment run, the fee
     run, ledger, additional invoices, credit notes and rebill; the intake operator; Tama R. as the
     demo-only second office user).
   - `docs/demo-guide/README.md`: the product description and mental model (Slot, List, Booking,
     Procedure, procedure and RVG group, Contract and contract holder, No contract (RVG), event; a Slot
     is a status container a List goes into, shown on screen as a session), **Source priority** (the
     catalogue first, then the PROGRESS Decisions log, then the code; the RFP is historical input; AR-28
     the plain-language pricing guide), the readiness snapshot with its real snapshot date, and the
     best demo shape.
   - Grep all five files for stale vocabulary and remove it unless it is deliberate (a "Terms not to
     use" row, a Future-scope note): `Card` (except "the physical booking card"), `billing route`,
     `Type 1|2|3`, `protected default`, `default (hospital|insurer)? ?Contract`, `default RVG Contract`,
     `required inputs`, `addendum`, `5%`, `net payable`, `service fee`, `Overdue`, `mirror`, `gate`,
     `deposit`, `estimate`, `contingency`, `balance invoice`, `excess`, `overpaid`, `ASA` as seeded or
     pre-filled, `absorb`, `swap`, `cover request`, `Permanent List`, `timesheet`, `slot` outside the
     mental-model explanation, `blacklist`, `DRAFT` for an assigned List, `Copy booking`, `photo` or
     `PDF upload` as in scope, `prompt` for the update email, `Resolve & retry` (if renamed), `MSG-`,
     `PID-2`, `HL7` or `FHIR` outside Future-scope notes, `Surgeon TBC`, `Funder allocation`,
     `two-funder`, `billable-party override`, `guardian override`, `hourly`, `Method 3`, `carry
     forward`, `stay visible` for billed Lists, and any answered OQ called open (`OQ-30`, `OQ-31`,
     `OQ-38`, `OQ-43`, `OQ-48`, `OQ-50`, `OQ-61`, OQ-62 to OQ-76, `OQ-78`, `OQ-82`, `OQ-86`, `OQ-91`,
     `OQ-94`), `OQ-37`, `OQ-51`.
10. **Regenerate `docs/demo-guide/master-demo-guide.html` in full** from the rewritten Markdown. Keep
    the shell: the tab bar (Learn, Overview, Personas, Workflows, Script, Cheat sheet, and the
    discovery tab relabelled **Open questions**; keep its `data-panel="discovery"` id, or rename it
    together with every script and link that targets it), the tokens in `:root` (transcribed from
    Design Language), the "Print S1 to S5" handout (every scenario on a fresh page), the collapse
    details, and the rule that it is self-contained (no network, opens from the file system). Rewrite
    every tab's content:
    - **Learn it, gently**: the one-breath summary, the shape of it (Slot, List, Booking, Procedure),
      the five nouns, the life of a List (DRAFT, ACTIVE, SUBMITTED, AUTHORISED), the quiz (new
      questions on the Booking, No contract (RVG), who is invoiced, the stack, the prepaid amount,
      warnings, the ledger and the AA fee; every answer true of the built app), and **Now drive it**
      re-written to the new S1 click path. The "shape of it" explains Slot once as the planning word
      and then says session, as the app does.
    - **Overview, Personas, Workflows, Script, Cheat sheet**: the rewritten Markdown, word for word
      where the Markdown is prose, the same figures and labels everywhere.
    - **Open questions**: the OQs open at HEAD that a beat touches, id, title, the default built and
      the recommendation, plus the BCTI granularity point; no question that is answered (OQ-30, OQ-31,
      OQ-38, OQ-43, OQ-48, OQ-50, OQ-61, OQ-62 to OQ-76, OQ-78, OQ-82, OQ-86, OQ-91 and OQ-94 are gone
      from it).
    - Check it in a browser: every tab, the print preview, the wizard, and the status-colour legend
      (the status master as seeded, with the `statusColours.ts` tokens, the List states, and the
      warning triangle's mild and strong treatments).
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
    - **Handset** (`npm run build:pwa`, then `npm run preview:pwa -- --host` (the PWA config sets no
      host) opened on a real phone on the local network, or `npm run dev:pwa` at the `pwa-device`
      viewport of 393x660 if no phone is available; say which in the PROGRESS entry): with "Play the
      office" OFF, run every beat that has a mobile side using only the handset and its Demo sheet.
      Fill the **parity matrix**: one row per beat, columns mobile side (yes or no), handset path (the
      sheet entry or "self-contained"), result. Expected PWA entries (planned labels; the inventory and
      each entry's name map win): Sign out on every mobile route, and Show first-run hints again on
      both surfaces (43a); Office authorises this List (14, re-worded by 38); Payment received · full /
      half on Balances (14, 36); Raise sample warnings and Clear sample warnings on a Booking, and
      Office clears this warning (15a); Photo capture (Future scope) on a List, badged (15b); Office
      approves this Contract change (21); Load 3-procedure Booking and Hospital feed changes the
      primary (23, both surfaces); Office approves and sends the prepayment invoice, Patient pays half
      / full of the pre-payment, Move to 2 days before procedure (27); Office assigns a List to my next
      free session (28); Office assigns a Draft List to me (31); Colleague moves a List into my free
      session (32); Colleague moves a Booking to me (32a); Hospital sync delivers my booking (34,
      re-pointed from 33's row-match stand-in); Office edits this Booking (35); Office runs this week's
      payment cycle (36's stand-in, re-worded by 38, re-pointed by 39a); Office reviews this event (38b's
      entry, widened and relabelled by 39b) and Office reviews this credit (39); Stage post-op scenario
      (39b, on the mobile routes); Office attaches the NHI (40); Hub: Available / Slow / Unavailable
      (40a, both surfaces); Office sends a prepayment reminder, Office refunds this prepayment from
      the trust account (41). Self-contained on the handset: signing in (43a), the stack (20a), the
      two-tab picker (19), modifiers with explanations and the locked age and P1 (19b), changing the
      payer (21), the Split (22), her own price or discount on No contract (RVG) (24), the profile and
      prepaid list (26), the prepaid amount on the Booking (27), the anaesthetist's own List move,
      return to the office and return-or-assign on marking a booked session unavailable (32), Move to a
      colleague for a single Booking (32a), the main view, archive and search (38a), the events list
      (38b), raising her own additional invoice or credit note (38b, 39; its review waits on the
      office, so it needs the review stand-in), and the point-of-need help (43a). Phases 16, 17, 18,
      19, 19a, 19b, 20, 20a, 24, 25, 26, 29, 30 (its "Office reassigns this List" stand-in was
      dropped), 37, 39a's own entries, 42 and 43 planned no PWA entry (no mobile beat, or none that
      waits on anyone); record each as "no PWA stand-in required" in the matrix. There is no swap
      confirm or decline stand-in (D7), no Copy entry (15b), and nothing on the PWA about pairing
      preferences or tiers (17).
    - **A beat with a mobile side and no handset path is a gap.** If an existing store action covers it,
      register a PWA-only office stand-in following Phase 14's contract (body in `src/shared` or
      `src/store`, `badge: 'office-stand-in'`, disabled state, dash-free copy) and add it to the audit
      tests. Otherwise log it for the owner. Do not add scenario jumps to the PWA; its reset on More is
      the stage step.
    - **Regressions:** fix small ones here, with a test. Log anything larger in the PROGRESS open-items
      handoff for the owner rather than growing this phase.
    - `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.
13. **Close-out:** the adversarial review, the Catalogue screenshots final sweep (below), then
    PROGRESS.md, including the one owner review list.

## Demo triggers

This phase **adds no harness-bar trigger** and nothing to the Control Panel page. It audits the
registry that Phases 14 to 43a filled, beat by beat:

| Check | Where | How |
|---|---|---|
| Every entry shows only on its own screen | Harness bar, framed build | `demo-actions-audit.spec.ts` (item 4): each index row's "Open screen" lands on a screen whose pill lists it; an unregistered screen shows no pill |
| The Control Panel is only the index | `/demo/control` | No entry routes there (Vitest, item 4); the page holds Clock & reset, Scenario jumps with beat links, and "Demo actions by screen" |
| Office and colleague stand-ins are PWA only | PWA sheet | Vitest (item 4): `office-stand-in` and PWA-only entries mean `surfaces: ['pwa']` and `/mobile` routes only; a both-surface entry (40a's Hub, 23's two entries, 39b's `stage-post-op`) has at least one `/mobile` route |
| Withdrawn flows and superseded readings left no entry | Registry | Vitest (item 4): no swap, cover-request, Copy, addendum, blacklist, estimate, deposit, balance-invoice, overpaid, Type 1/2/3, billing-route, default-Contract or "child billed directly" label, and no label or description says "slot"; 33's row-match stand-in keeps its id with 34's label |
| Preferences and tiers stay admin only | Registry, PWA | Vitest and the PWA spec (item 4): nothing anaesthetist-facing mentions a preference, a pairing or a tier |
| Future-scope entries are deliberate | Registry | Vitest (item 4): every `future-scope` entry is on the test's expected list (15b's photo entry, 34's Future-scope intake entries as 34 left them after 20a's re-point) |
| Every warning rule has a sample | "Raise sample warnings" | Vitest (item 4): one sample per registered rule (15a, 19, 21's two, 27, 40) |
| Every scripted press exists | Run sheet and master guide | `demoGuideSync.test.ts` (item 5) |
| Every beat with a mobile side runs on a handset | PWA, real phone | The parity matrix (item 12) and the PWA spec's per-screen table (item 4) |

**PWA equivalents:** none new by plan. If the parity matrix finds a mobile beat with no handset path,
item 12 says when to add a PWA-only stand-in and when to log it.

**Scenario jumps (not triggers):** S1 to S5 on the Control Panel, rebuilt in items 2 and 3, each
followed by one deep link per beat.

## Out of scope

- Any new product behaviour, and any change to billing maths, the pricing structures, resolver, price
  precedence or snapshot in `src/domain/billing`, lifecycle guards, the ledger, the BCTI count
  function, or the seed's content (beyond a scenario-staging need, which bumps `PERSIST_VERSION`).
- Reworking a feature whose open decision (D11, D26 to D41) or OQ was answered after its phase ran:
  script it as built, label it provisional, raise it with the owner.
- Re-grading the gap analysis or moving the `60e2d1e` snapshot (the ROADMAP's "When the catalogue
  changes" procedure owns that).
- Settling the BCTI granularity: it stays provisional, and a flip is re-baselined in one place by the
  owning phases' count function, not here.
- Editing the catalogue's artifacts (AR-28, AR-29, AR-30, AR-35): the guide quotes them, never edits
  them.
- Future-scope and Retired items (HL7 v2, FHIR R4, near real time, warning settings US-13.7.4,
  booking from a photo US-02.4.4, surgeon PDF upload US-02.2.1, automated change application
  US-02.5.x, concurrent edits US-02.5.6, automatic change emails US-02.3.5, a Contract schedule upload
  US-04.2.13, a procedure off the Contract's schedule US-04.3.7; and the Retired items in "Left the
  script") beyond keeping their badges, absences and narration honest.
- Anything for a negative invoice with no later payment (D21, OQ-71: handled outside the system).
- Catalogue screenshot work beyond the final sweep in the "Catalogue screenshots" section below (no
  new stories to cover; the sweep is a check and a correction of what exists).
- Scenario jumps or a scenario picker on the PWA.
- Editing `CLAUDE.md` without the owner's approval.
- Fixing large regressions found in the QA pass (logged, not fixed).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Drift check run against `60e2d1e` (in both sessions); the OQ list and the D1 to D46 table are
      recorded; nothing the guide or the app calls settled is an Open or Proposed OQ at HEAD, and no
      Proposed, Open or Verify requirement is described as AA confirmed; answered and superseded
      decisions (D1 to D10, D12 to D25, D42 to D46) and answered OQs (OQ-15, OQ-30, OQ-31, OQ-38,
      OQ-43, OQ-48, OQ-50, OQ-61, OQ-62 to OQ-76, OQ-78, OQ-82, OQ-86, OQ-91, OQ-94) carry no
      provisional label, and no superseded reading (a default Contract, an estimate, a balance
      invoice, ASA seeding, a blacklist) is told anywhere.
- [ ] Control Panel: each of S1 to S5 jumps after "Confirm jump", shows its message and one link per
      core beat; every link lands on the right screen (a `null` link is disabled with its reason); no
      trigger buttons on the page; "Demo actions by screen" still lists every entry.
- [ ] S1 to S5 run end to end on the framed build **from Reset**, exactly as written, with every
      Expected line and figure matching.
- [ ] The new beats run as written: sign-in on the handset; sync then match with the wording as
      received and the office setting the Contract (No contract (RVG) first, holder-fit Contracts with
      one search); the three-part stack on a Booking in both apps; capture with the two tabs, starting
      units from line, procedure or group, the locked age and P1, and an optional modifier refusing to
      save without its explanation; the to-do list (raise samples, the triangle in all three apps, the
      warning visible on opening, submit with no confirm step, Clear); a recurring clash becoming a
      DRAFT Draft List, assigned by the office in tier order with a not-preferred pairing apart and
      soft-warned, becoming ACTIVE; the on-demand update email picked from the change history; Dr
      Souter returning a List to the office with no confirmation and no preference warning, and
      return-or-assign when she marks a booked session unavailable, each posting to the notification
      pool; a single Booking moved to a colleague, the payable following the doer; Review showing the
      stack, the payer and the warnings; the weekly payment run with its remittance advice; the
      monthly fee run ($700 for Dr Rutherford, or the re-baselined figure); the Split; the price
      precedence asides (fixed rate, locked discount, read-only third-party price, the anaesthetist's
      own price, an office override); prepayment at Dr Souter's own fixed price, generated with its
      draft pair, approved and sent, part paid, shown on her Booking; the prepaid Procedure authorised
      at the prepaid amount with nothing left to bill and nothing raised automatically; the events
      list in each app; a post-op event reviewed and invoiced; an additional invoice and a credit note
      raised by Dr Souter on her own Procedure as well as by the office; credit-and-rebill from copied
      lines, the components equal to the credit, with the negative netted on the remittance advice;
      the main view, archive and search; NHI lookup with the Hub states; the help on capture, Day and
      Review.
- [ ] S5 run from its jump: Chen's History shows the staged change set (the modifier claimed with its
      explanation); Whitaker's Procedures carry their pricing snapshots; the new version's Versions
      list shows the invoices; Regenerate from locked data says identical after the unit-value edit.
- [ ] Every "Demo actions → Label" in the script is on that beat's screen; opening three unrelated
      screens shows no stray entries.
- [ ] Handset, "Play the office" OFF: every beat with a mobile side completes using only the phone and
      its Demo sheet; the chip clears the header avatar, the dock and the tab bar; no mobile screen
      shows a preference or tier; the parity matrix is complete with no unexplained gap.
- [ ] App copy: no "open RFP question", "discovery item", "discovery question", "(assumption)",
      "proposed reading", "swap", "Permanent List", "timesheet", "slot", "Copy booking", "addendum",
      "blacklist", "Type 1/2/3", "billing route", "default hospital Contract", "Funder allocation",
      "estimate" or "deposit" for a prepayment, "balance invoiced", or "DRAFT" or "Open" for an
      assigned List remains in rendered text (screens, sheets, toasts, demo trigger labels, scenario
      messages); no time-rule caveat survives; the GST footer states the rule; the Xero NHI callout
      states the settled rule; the NHI mod-11 flag, the provisional BCTI granularity label and the
      live OQ labels the phases built (OQ-84, OQ-85, OQ-89, OQ-90, OQ-95 among them) are still shown;
      nothing labels D9 provisional.
- [ ] `master-demo-guide.html` opens from the file system with the network off; every tab reads the
      same as the Markdown; "Print S1 to S5" puts each scenario on a fresh page; the Learn wizard's
      "Now drive it" steps work on the app; the Open questions tab lists only open questions.
- [ ] The five guide files have no stale vocabulary from the item 9 list (except deliberate "Terms not
      to use" rows and Future-scope notes).
- [ ] No en or em dash in any app copy changed by this phase (the copy guard test passes).
- [ ] `demoGuideSync.test.ts` runs against the rewritten run sheet and master guide with nothing
      skipped.
- [ ] Catalogue screenshots, final sweep: a full `npm run capture` ends with no failed recipe and no
      story without a recipe; every remaining `partial` or `absent` reason is true of the built app and
      names no later phase; every Retired or Future item's recipe is `absent` ("Retired" / "Future")
      where the prototype no longer shows it; no caption describes superseded behaviour (the stale
      captions list below); ATLAS.md is read end to end against the app; and `npm run verify:board`
      is green.
- [ ] `npm run verify:board` green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.

## Demo guide updates

This phase **is** the demo guide update. Every file changes:

- `docs/demo-guide/03-demo-script.md`: rewritten in full (item 8): S1 to S5 renumbered with the new
  beats, handset lines, answered and superseded decisions told in their current reading, provisional
  labels only where still open, discovery points from HEAD, Direct URLs, run orders, narration list,
  recovery. It replaces, among others, the beats the 2026-10-08 changes broke and the earlier phases
  patched (ROADMAP "Demo guide"): S4 Beat 1's gate, estimate and deposit (15a, 27: now the
  anaesthetist's own fixed price, generated with its draft pair, approved and sent); the Copy lines and
  "DRAFT" for an assigned List (15b); S2 Beat 3's reassign (17: tiers, preferences apart); the cheat
  sheet's Type 1/2/3 and protected default Type 1 and S5 Beat 4's "Health NZ agreed rate (Type 2)"
  (18); S1 Beat 3's capture with ASA seeding and the workflows and personas "records ASA" lines (19,
  19b); S1 Beat 1's and S2 Beat 2's default Contract (20: No contract (RVG) first, the office sets it);
  S1 Beat 2's stack (20a); S3 Beat 1's payer and "Funder allocation" (21, 22); S4 Beat 3 and S5 Beat 4
  (25); S1 (34); S4 Beat 2's addendum (38b); credit-and-rebill (39); S4 Beat 5's weekly run (39a); and
  any balance-invoice narration (41: nothing automatic, by hand). Each earlier patch is re-walked, not
  trusted.
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
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 44` first: it lists no covered stories
(none at plan time, 2026-10-08), so this section has no per-item rows.

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
- **no caption describes superseded behaviour.** The ROADMAP's "Stale captions after the 2026-10-08
  update" names the owners; confirm each owning phase replaced its captions and that each shot now
  shows the new rule, and fix any survivor here (caption and, if needed, the recipe's steps, keeping
  shot `name`s):
  - US-04.3.3 (20): No contract (RVG) first in the picker, then holder-fit Contracts; no default
    hospital Contract;
  - US-03.3.4 (19b): optional itemised modifiers, the explanation asked for on claiming, the locked age
    and P1; no ASA seeding;
  - US-06.2.2 and US-06.3.1 (27): the prepaid amount as the fixed price from the anaesthetist's own
    Contract, the invoice generated with its draft Xero pair; no estimated fee;
  - US-08.2.2 (27): the prepayment deducted, leaving nothing to bill; no balance invoice;
  - US-06.4.1 (41): nothing raised automatically, and the by-hand routes (additional invoice, credit
    note);
  - US-04.2.2 (24): Contract line terms and the price precedence; no Contract types 1 to 3;
  - the US-05.1.x captions (19, 19a, 19b): RVG groups and curated procedures, the two tabs, starting
    units from line, procedure or group, the included P1 locked;
  - US-03.1.2 (20a): the three-part stack;
  - the US-11.2.x captions (21): the payer on the Booking, prefilled and editable to a guardian; no
    guardian override record;
  - US-07.4.1 (38a): the main view and the archive; no "List gone on invoice generation";
  - US-14.4.1 (40a): re-taken on an ACTIVE List with the 2026-10-08 add-booking form.
  Then grep every recipe's captions for the stale words (`estimate`, `deposit`, `balance invoice`,
  `ASA` seeded or pre-filled, `default (hospital|insurer)? ?Contract`, `Type [123]`, `billing route`,
  `blacklist`, `DRAFT` for an assigned List, `Card`, `slot`, `Copy`) and correct each hit;
- every Retired or Future item's recipe is set to `absent` ("Retired" or "Future") where the
  prototype no longer shows it, with the Retired item's removing phase named in the reason; none keeps
  shots of a screen that is gone. At `60e2d1e` that includes US-02.4.3 Copy a Booking (Retired, 15b),
  US-05.2.3 the conditional positioning modifier (Retired; 19b replaced the absorbed-modifier refusal
  with the locked P1), US-06.2.3, US-06.2.4 and US-06.2.5 (the estimate, Retired, 27), US-06.4.2
  (Retired, 27 and 41), FT-04.4, US-04.4.1 and US-04.4.2 (default Contracts, Retired, 18, 19a and 20),
  US-04.2.5 and US-05.3.4 (per-Contract multi-procedure rules, Retired, 19a and 23), US-04.2.7
  (required booking inputs, Retired, 21), US-04.2.12 (the payment setting, Retired, 22), and the Future
  items US-13.7.4 (warning settings), US-02.4.4 (booking from a photo; 15b's badged demo at most),
  US-02.2.1 (surgeon PDF upload; 34's badged tab), US-02.5.x (automated change application,
  reschedule rules, concurrent edits), US-02.3.5 (automatic change emails), US-04.2.13 (a Contract
  schedule upload) and US-04.3.7 (a procedure off the schedule). A badged Future-scope demo may keep
  `partial` with a reason saying it is Future scope, never `captured`;
- `capture/REPORT.md` ends with no failed recipe and no story without a recipe;
- `capture/ATLAS.md` is read end to end against the app: Routes, Personas and IDs, Seed data, Overlays,
  Existing hooks, Demo control panel (the index plus Demo actions by screen, and the rebuilt "Scenario
  jumps" table from work item 11) and Gotchas, each corrected where a catch-up phase left it stale;
- `npm run verify:board` is green, and the REPORT.md counts before and after go in the PROGRESS entry
  and the catch-up closing summary.

**Recipes this phase breaks.** The recipes that run `{ "scenario": "Sn" }` in their setup (20 recipes,
25 `S3` and 3 `S5` uses at the 2026-10-08 count, for example `US-08.1.1.json`; recount, since later
phases add recipes). Work items 2 and 3 rebuild the jumps in `demoScenarios.ts` and keep the ids S1 to
S5 and the `scenario-s1` to `scenario-s5` and `scenario-confirm` hooks, but each jump's staged state
may change (S5 now stages 19b's modifier edit and writes pricing snapshots); the `--dry` run and the
full capture are the check, and any shot whose expectation moved is re-pointed keeping its `name`.

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
  interim phase ($144.76, $7.62, 5%, "two-funder", a fee netted off the payable, an estimate with two
  contingency units, a deposit or balance figure, fees that moved when 19b replaced the ASA seed,
  AA-2026 numbers that moved) and for an AA-FEE total, a prepaid amount or a remittance net that
  disagrees between Admin, web Accounts and mobile.
- **Answered is answered, open stays open.** No copy, in the app or the guide, calls an Open or
  Proposed OQ settled, or the BCTI granularity settled; no answered OQ or decision keeps a stale caveat
  (the Goal's lists; D9 and OQ-61 in particular); no superseded decision is told in its struck
  reading. The provisional BCTI count, the live OQ labels the phases built and the NHI "modulus 24"
  flag are still shown. D11 and every open default D26 to D41 are labelled in the guide exactly as the
  UI labels them. A Verify item's settled part is told as the rule and only its open sub-question is
  labelled.
- **Retired beats and superseded words are gone.** No swap request, office confirmation of a move,
  prepayment gate or override, prepayment estimate, deposit, contingency units or balance invoice,
  overpaid-prepayment beat, prepayment re-check on a move, default hospital or insurer Contract,
  Type 1/2/3, billing route, required booking inputs, Contract payment setting, "Funder allocation",
  guardian override record, ASA seeding or untickable default modifiers, absorbed-modifier refusal,
  hourly rate line, submit confirm step or tap-to-read on a warning, addendum Card, Copy a Booking, 5%
  fee, update email prompted after a save, carried-forward negative invoice, "Permanent List",
  "blacklist", "DRAFT" for an assigned List or "slot" survives in the script, the master guide, a
  scenario message or a registry label; photo capture, surgeon PDF upload, automated change
  application and automatic change emails appear only as Future scope.
- **Pricing told plainly and truly.** Every pricing sentence matches the app as built and AR-28's
  plain reading (No contract (RVG) first; who is invoiced; what the anaesthetist can change); the
  guide never presents the draft technical design (AR-29, AR-30) as AA's decision; AR-35's wording is
  called illustrative.
- **Trigger placement.** No entry shows on a screen it does not belong to; office stand-ins never
  appear in the framed build's bar; nothing is registered on `/demo/control`; bodies live in
  `src/shared` or `src/store`, so `pwaPurity.test.ts` holds; nothing anaesthetist-facing shows a
  preference or tier; any stand-in added in item 12 follows Phase 14's contract and is audited.
- **PWA parity.** Every beat with a mobile side has a working handset path with "Play the office" OFF;
  the parity matrix has no row marked "self-contained" that actually waits on the office (the post-op
  event's review, the anaesthetist's own additional invoice or credit note, the Contract change's
  approval and the warning's Clear each need their stand-in).
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
  - the drift-check result (catalogue changes since `60e2d1e` and what each did to the script; the OQ
    list at HEAD; the D1 to D46 table: answered, superseded (new reading), open default or recorded,
    and the label each shows);
  - the re-baselined figures table (item 7), with the BCTI-dependent figures marked;
  - the parity matrix (item 12) and how the handset was tested (real phone or emulated viewport);
  - the trigger audit result: entries per screen, any stand-in added, any gap logged;
  - the copy sweep: each RV-17 site as reworded, already fixed (by which phase) or kept (with the OQ);
  - what was built: `demoScenarios.ts`, the beat links, `demoTriggerAudit.test.ts`,
    `demoGuideSync.test.ts`, `appCopy.test.ts`, the audit spec;
  - `PERSIST_VERSION` (unchanged, or from and to, with why);
  - the before and after Vitest and Playwright counts;
  - the review pass.
- **Catalogue screenshots (final sweep):** the full-run `capture/REPORT.md` counts before and after
  (captured, partial, absent, failed, no recipe), the `absentReason`s rewritten, the stale captions
  corrected, the Retired or Future recipes set to `absent`, the recipes re-pointed for the rebuilt
  scenario jumps, and the ATLAS.md sections corrected; repeat the final counts in the catch-up closing
  summary.
- **Decisions log:**
  1. **Superseded:** 2026-07-22 "Time-unit partial-interval rounding = round UP per started
     interval, a named ASSUMPTION". It is now AA's rule, not an assumption: time units come only from
     the RVG rule (OQ-50) and a part interval always rounds up under the tiers (OQ-75, D25; US-05.2.2
     Confirmed), held as data since 19a and applied to recorded time only. No caveat remains in the app
     or the guide (if 19a already recorded this, point to its entry).
  2. **Superseded:** the Phase 12 scenario-jump design (jumps defined inline in `DemoControlPanel.tsx`,
     reset-only S1, S2, S4, navigation to app roots). Jumps now live in `demoScenarios.ts`, stage
     through guarded actions only, and offer one deep link per beat.
  3. **New:** the demo guide's source priority is the requirements catalogue, then this Decisions log,
     then the code; the RFP is historical input; AR-28 is the plain-language source for pricing
     narration. Discovery points and the "Open questions" tab are built from catalogue OQ statuses at
     the time of writing.
  4. **New:** app copy never calls an Open or Proposed item settled, nor the BCTI granularity; kept
     caveats cite the OQ id or catalogue item; `appCopy.test.ts` enforces the stale phrases, the
     retired and superseded vocabulary, the must-keep caveats and the no-dash rule.
  5. **Audit of the superseded rulings:** check that every ruling the catch-up superseded has its
     Decisions-log entry from its owning phase (the route model, 5% fee netting, Copy as an additional
     procedure and then Phase 15's skeleton Copy, binding convention 6's DRAFT for an assigned List,
     absorbed P1 modifiers, the 2026-07-22 ASA seeding values, the protected default Type 1 per
     hospital and insurer, the Method 3 hourly rate line, the guardian override record, the 2026-09-28
     fee hidden from the anaesthetist where the catalogue now shows a price, the addendum Card, the
     prepayment completion gate, the prepayment estimate and deposit, the overpaid prepayment's
     negativeTotal failure, the silent BTM fallback, availability reconciliation's conflict flag,
     office write-through per tap, the cover-request flow, hospital auto-apply, Surgeon PDFs kept in
     scope by Phase 14). Write any missing one here, citing the phase that superseded it.
- **Catch-up closing summary** (a short section after the entry): every phase 14 to 44, with 15a,
  15b, 19a, 19b, 20a, 32a, 38a, 38b, 39a, 39b, 40a and 43a, DONE; the gaps, DM and RV items closed
  (the ROADMAP total at `60e2d1e` is 220 gaps, 46 DM and 34 RV, with FT-13.5, US-03.1.3, DM-01 and
  RV-12 matching or closed on built 14 and 15; take the final figures from `gaps.json` and the ROADMAP
  table at close); nothing parked; the Retired and Future items left out (the "Left the script" list);
  the provisional readings still shown in the app, each with its OQ or D number (D11, D26 to D41, the
  open OQs, the BCTI granularity); the snapshot commits the plan was built and re-graded against
  (`3d3a18c`, then `60e2d1e`) and the HEAD commit this phase checked; a pointer to the ROADMAP's "When
  the catalogue changes" procedure for the next round; and the note that the pricing structures,
  resolver, precedence and snapshot sit in one place in `src/domain/billing` behind the types the UI
  reads, against the draft technical design v4 (AR-29, AR-30), so a v5 is a contained edit.
- **Owner review list** (a section after the closing summary): the owner reviews the app once, now
  that every catch-up phase is done (ROADMAP.md "Owner review: agents test themselves"). Gather every
  phase's "For the owner's review" list into one list, grouped by app and screen, each line with its
  phase, what to look at (route and persona), the default or reading built, and the OQ or D number;
  drop lines a later phase or a later answer already settled (D9 by OQ-31, the default-Contract,
  estimate and ASA lines by the 2026-10-08 model). Open it with a suggested review order (S1 to S5
  from Reset, then the remaining screens), and a short "Open defaults" block listing D11 and D26 to
  D41 with where each shows in the app.
- **Open-items handoff:** any regression logged in item 12, any parity gap not fixed, the catalogue
  correction for US-11.1.2's "modulus 24", the BCTI granularity point for AA's accountant (beside
  OQ-29 and OQ-60), and the stale `CLAUDE.md` lines for the owner.
