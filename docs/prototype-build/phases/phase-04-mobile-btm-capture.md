# Phase 04 — Mobile app: BTM capture & submission

**Requirements covered:** M4, M5, M10, B5 (capture side), D6 (submit side)
**Depends on:** Phase 03.
**Estimated:** 1 session.

## Goal

The clinical-billing heart of the mobile app, built with undivided focus: the per-Procedure
Outcome/BTM block on the Card screen, validation, and the list submission flow. This is the
highest-stakes UI in the demo — the fee maths the audience will check by hand happens here.

## Reference

**Authoritative visuals (convention 17):** `Design/Mobile App.dc.html` screen 3 — the Card
detail/BTM capture — plus its list-screen submit-bar states. Tap through it first; its choreography
is the spec: ASA segmented control card → procedure card opening the **bottom-sheet code picker**
(search field, mono code + name + base units rows, selected-row teal tint) → Times card (big mono
stamps, −5/+5 nudge buttons, full-height teal **Finish now** button that becomes the Finish stamp,
duration→time-units readout line) → B/T/M stepper rows (44px round-square −/+ buttons, mono
values, per-row source captions) → modifier chips → the **dark ink summary panel** (#172320:
TOTAL UNITS + FEE @ rate/UNIT, tabular-nums, green flash tint on fee change via motion/value-tick)
→ notes card → sticky **Mark complete** bar → the **completion overlay** (white blur, circle-pop,
tick-draw, "N units · $fee") → back on the list: tick-pop on the card row, progress bar advances,
submit bar flips disabled→enabled→"Submitted to office" success state.

**Do NOT inherit the mockup's simplified maths** (Decisions log, 2026-07-21): flat 15-min time
units → use the real tiered T1/T2 rule (with the rounding assumption labelled per Phase 01); the
3-chip demo modifier set → render all the RFP-named modifier groups in the same chip pattern
(demo-plausible values per Phase 02's labelling, not an authoritative NZSA schedule); "ASA ≥ 3
adds +1" → real AS1–AS4 unit values seeding M. The Phase 01 calculator is the maths; the mockup is
the skin.

RFP page 44 (Appendix 3, fourth screenshot — the Outcome panel) remains the functional reference:
ASA, RVG Code, Contract/Procedure, Start/Finish, Minutes, B/T/M, Total Units, Adj $, Charge $,
Int Notes, Op Notes, Completed. Re-read the RFP's "The Big Picture" BTM section — the rules live
there.

## Work items

1. **Outcome/BTM block** (replaces the Phase 03 placeholder), per Procedure on the Card screen:
   - **ASA selector** (AS1–AS4) seeding the M stepper with its unit value — overridable (RFP: all seeded values overridable).
   - **RVG base-code picker:** searchable curated dropdown grouped by anatomical site; range codes prompt for a value within the range; codes that absorb positioning show a note and P1 is disabled with an explanation.
   - **Modifier chips** (PA, A, ASE, OB, AI1, P1, post-op) adding to M; visually distinct from the ASA seed.
   - **Start / Finish:** Start Now / Finish Now buttons stamping demo-clock time + editable time fields; elapsed-minutes display.
   - **B / T / M steppers:** B and T auto-computed from code/times but overridable; total units + computed fee at the anaesthetist's own unit value, live.
   - **Adjustment ($) and Charge ($)** fields, internal notes, op notes.
   - **Completed toggle:** runs `validateCardForBilling`; failures render inline against their fields (use the structured failures from Phase 01 verbatim).
2. **Additional procedures:** "add procedure" creates an `isAdditional` procedure whose base and
   modifier steppers are **structurally disabled** (split-billing rule) with a one-line explanation;
   time capture only. The same restriction applies to **every procedure on a copied Card** —
   Phase 03's copy flow marks them `isAdditional` (the RFP's card-copy-as-additional-procedure
   mechanism), so the copied card's BTM block renders in the same time-only state.
3. **Contract/insurance context line** on the block (which route/contract the office expects —
   read-only informational, per the legacy screen's Contract field; the RFP assigns route-setting
   to hospital advice or AA staff, so the office sets/corrects billing setup in the admin app —
   Phase 06 — while the anaesthetist's ad-hoc creation path captures initial route per Phase 03).
4. **List submission** (activates Phase 03's reserved footer): the **"Completed"** button on the
   Cards screen — disabled until **every Card is marked Complete** (the store's rule: completion
   is validation-gated, submission is completion-gated); the explanatory sheet names the
   not-yet-complete cards and their outstanding validation failures. Confirmation dialog explains
   what SUBMITTED means (office review; no further edits); on confirm, the store's `submitList`
   runs and the list flips to read-only with the completed-unbilled badge.
5. **Post-submit behaviour verification:** SUBMITTED lists keep rendering per Phase 03's read-only
   rules; leave the `billedAt`-keyed disappearance selector in place for Phase 08 (lists vanish at
   invoice generation, not at AUTHORISED).

## Out of scope

Any billing-engine execution (Phase 08). Pre-payment and post-op flows (Phase 09). Balances (10).

## Manual test checklist

- [ ] Full BTM capture on a seeded today-card: ASA seeds M; picking a range code prompts within range; Start/Finish Now stamp demo-clock times; a 2h+ case's T units match the tiered rule; fee = units × that anaesthetist's own unit value (check against another anaesthetist to prove per-person rates).
- [ ] P1 is disabled with an explanation when the base code absorbs positioning; enabled otherwise.
- [ ] An additional procedure only allows time capture (B/M structurally disabled with the explanation) — and a copied Card's procedure renders the same way (time-only, with the copy explanation).
- [ ] Completed toggle blocks with named field failures on an incomplete card, passes when fixed.
- [ ] "Completed" on the List is blocked while any card is not yet marked Complete — including a card that would pass validation but hasn't been completed (sheet names the offenders) — then succeeds; the list becomes read-only for the anaesthetist persona.
- [ ] All BTM mutations show in the card's audit trail.
- [ ] Choreography matches the mockup: code picker arrives as a bottom sheet; the fee flashes green and rolls (value-tick) when units change; Mark complete plays the completion overlay; the list's submit bar walks disabled → enabled → submitted exactly like `Mobile App.dc.html`.
- [ ] Margaret Ellison's seeded card (ZAA0067, 47516 THR) is capturable end-to-end as the mockup's demo script describes — but with real tiered time units and the RFP's modifier groups (demo-plausible values, labelled as such — see Phase 01/02 discovery-item notes).
- [ ] `npm run build` + `npx vitest run` green.

## PROGRESS.md updates

Status row + entry; log any capture-UX decisions (stepper behaviour, time editing, validation presentation) that the web app (Phase 05) must mirror.
