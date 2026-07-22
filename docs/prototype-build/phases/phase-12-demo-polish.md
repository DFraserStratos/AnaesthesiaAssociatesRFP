# Phase 12 — Demo polish & guided script

**Requirements covered:** P6/P7 finished, N1 sweep, everything demo-ready
**Depends on:** all previous phases.
**Estimated:** 1 session.

## Goal

Turn a feature-complete prototype into a confident demo: the control panel is finished, seeded
scenarios support a scripted end-to-end story, rough edges are swept, and `DEMO-SCRIPT.md` gives
the presenter a step-by-step walkthrough keyed to the RFP's evaluation interests.

## Work items

1. **Demo control panel, finished** (`/demo/control`): reset (with confirm); clock display +
   *advance 1 day* / *advance to next morning* / *jump to procedure day* / *advance minutes/hours*
   (the time-of-day behind Start/Finish Now); event triggers grouped
   (hospital HL7 message, FHIR message, PDF arrival, Xero payment full/partial, webhook-missed
   payment, integration failure, billing failure, archive job, payables run); scenario jump
   buttons (below). Every trigger states what it will do before firing.
2. **Seeded scenarios** — verify (and repair via seed tweaks) that these five stories run clean
   from a fresh reset; wire jump buttons that stage each one:
   - **S1 Booking to theatre**: HL7 booking lands → card fills over days (clock) → procedure-day BTM capture on mobile → submit.
   - **S2 Office day**: day dashboard review → phone-advice manual booking → illness → reassign list → authorise a submitted list.
   - **S3 Money end-to-end**: authorise → invoices (split-billing card included) → Xero pair → payment webhook → next-day balances → payables run → disbursed.
   - **S4 Exceptions**: pre-payment patient; post-op addendum; billing failure + retry; integration failure + manual fix; partial payment.
   - **S5 Compliance tour**: audit trail of a much-edited card; NHI dual-format validator; no-NHI-in-Xero callout; contract effective-dating (change a contract, show the old invoice unchanged).
3. **Cross-app QA sweep** (fix-as-found, log anything big): every nav destination has real content
   or an honest label; consistent status colours/chips everywhere; empty states everywhere data can
   be empty; number/currency/date formatting consistent (NZ formats, dd MMM yyyy); phone-frame
   scroll/keyboard quirks; persona-guard spot checks; console clean; `npm run build` + full Vitest
   green; fresh-profile smoke test (clear localStorage → seed → S1–S5).
4. **DEMO-SCRIPT.md** (in `docs/prototype-build/`): presenter-facing script — setup (browser,
   reset), then S1–S5 with per-step: where to click, what to say (one line tying the moment to the
   RFP requirement it demonstrates — including the open-question readings worth flagging as
   discovery talking points), and expected result. Include a "recovering from demo accidents" note
   (reset + scenario jumps).
5. **README** for `aa-prototype/`: run instructions, stack, folder map, pointer to the docs and
   demo script.

## Out of scope

New features. Anything discovered that's bigger than a polish fix gets logged to PROGRESS
"Discovered for later" instead of built.

## Manual test checklist

- [ ] From a hard reset, S1–S5 each run start-to-finish exactly as DEMO-SCRIPT.md describes.
- [ ] Every switcher destination, nav item, tab and drill-down leads somewhere real; no lorem/dead ends.
- [ ] Reset always returns to the identical pristine state (spot-check invoice numbers restart).
- [ ] Full suite + build green; console clean across the entire click-through.
- [ ] A colleague (or you, cold) can run the demo from DEMO-SCRIPT.md alone without asking questions.

## Adversarial review (after build)

After the manual test checklist and `npm run build` / `npx vitest run` are green — and before closing out the PROGRESS file — run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**. For this final phase it is a **whole-prototype QA sweep** across all three apps and the demo surfaces, not just this phase's diff: fan out a few independent Opus review subagents (quality · bugs/correctness · plan adherence), then this session independently verifies every finding against the source docs and the code, fixes the confirmed ones, re-greens build + tests, and records the pass in the phase entry. Do not re-raise anything already settled in the Decisions log.

**Steer this phase's reviewers at:**
- S1–S5 each run clean from a hard reset exactly as `DEMO-SCRIPT.md` describes; reset returns to identical pristine state (invoice numbers restart).
- Every switcher/nav destination is real or honestly labelled (no dead ends, no lorem); status colours/chips, NZ number/currency/date formats and empty states are consistent app-wide; the console is clean across the whole click-through.
- No en/em dashes appear in any app-facing copy (CLAUDE.md); demo-only surfaces stay badged (convention 13).
- Cross-app consistency and persona/view-scoping hold end-to-end (the review reads the whole prototype, not one phase's code).
- Anything bigger than a polish fix is logged to "Discovered for later", not built (the scope fence).

## PROGRESS.md updates

Status row + entry; close out the file: mark all phases final, sweep "Discovered for later" into a tidy handoff list, and note anything a future real-build team should read first.
