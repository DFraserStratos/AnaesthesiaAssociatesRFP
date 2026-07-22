# Review-loop kick-off prompt

**Purpose:** the user is running Codex as an external, independent reviewer of this build plan.
This prompt starts a fresh chat whose job is to receive Codex's findings, **independently verify
each one against the actual source documents and the actual current state of the plan**, and only
then fix the planning docs. Multiple rounds of this loop have already happened (see the Decisions
log); this prompt gets a new session caught up so it doesn't redo settled work or blindly defer
to a paraphrase.

**How to use:** paste the prompt below verbatim into a new chat. Then paste Codex's findings as
your next message. **Also give Codex the "Settled rulings" block at the bottom of this file** when
you start its fresh-context review — it stops the reviewer re-raising closed issues.

---

## The prompt

```
You're joining a project that already has a detailed, review-hardened build plan. Get oriented
before I give you anything to act on.

## What this project is

Anaesthesia Associates (AA), a Christchurch NZ company that handles booking and billing for ~85
independent anaesthetists, issued an RFP (July 2026) for a new booking & billing system. We are
not building the real system — we are building a demo PROTOTYPE: a fully interactive, true-to-life
React front end over a fake in-browser backend, meant to demonstrate every major feature in the
RFP's "Candidate Architecture" during vendor presentation workshops. The prototype has three apps
behind one switcher (Anaesthetist Mobile App, Anaesthetist Web App, Admin Web App) plus demo-only
simulators (Xero, HL7/FHIR integrations, a billing/control panel). No real backend, no real APIs.

## Where everything lives

Repo root: `/Users/d.fraser/Local Dev/Anaesthesia Associates RFP/`

Source-of-truth documents (read these before touching anything):
- `RFP.md` — full text of the RFP (also available as the original PDF, same folder)
- `Data-Model-and-Flow.html` — our own reading of the RFP's candidate data model, List/Card
  lifecycle, and end-to-end booking→billing→payment flow, including a section on RFP internal
  contradictions/open questions
- `Design/` — a completed Claude Design run: `Design Language.dc.html` (the token source of truth:
  palette, six status colours, type, spacing, motion patterns) plus six interactive sample pages
  (Mobile App, Mobile Availability, Web Dashboard, Web Availability, Admin Day, Admin Review) and
  a reusable iOS device-frame component (`ios-frame.jsx`). These are the AUTHORITATIVE visual
  reference for the build — see PROGRESS.md conventions 16–17.

The plan itself, in `docs/prototype-build/`:
- `REQUIREMENTS.md` — the full requirements catalogue, numbered by category (P=prototype harness,
  D=domain model, M=mobile app, W=web app, A=admin app, B=billing, X=Xero, I=integrations,
  N=non-functional). This is the thing that should never contradict the RFP.
- `ROADMAP.md` — the 13-phase sequence at a glance, with dependencies and milestone demos.
- `PROGRESS.md` — **the living record.** Contains: a phase status table, 17 binding conventions
  every phase must follow, and a chronological **Decisions log** recording every deviation,
  resolved ambiguity, and reviewed-and-rejected finding, each with a one-line why. THIS LOG IS
  YOUR MEMORY OF PRIOR REVIEW ROUNDS — read it in full before evaluating anything new, so you
  don't re-litigate something already settled or silently contradict a recorded ruling.
- `phases/phase-00-*.md` through `phase-12-*.md` — one detailed plan per build phase (13 total:
  scaffold, domain/calculator, seed/store, mobile×2, web app, admin×2, billing×2, Xero, 
  integrations, polish). Each has a goal, work items, an out-of-scope fence, and a manual test
  checklist.
- `index.html` — a styled build-process page: one card per phase with an explainer and a
  copy-paste kick-off prompt for a fresh Claude Code session to build that phase. Every fact
  stated in a phase doc is echoed into that phase's kick-off prompt here — **if you fix a phase
  doc, you almost always need to fix the matching prompt in index.html too**, or the two will
  drift apart and a build session reading only index.html will miss the correction.
  Note: this is `file://` HTML with animated demo bits — if you preview it in a browser, treat
  what you see as illustrative, not authoritative; the markdown files are the source of truth.
- `DESIGN-PROMPT.md` — the (already-run) prompt that produced `Design/`. Reference only.

No code exists yet — this is 100% planning. Nothing in `aa-prototype/` (the eventual app folder)
exists until Phase 00 runs.

## How the plan works

13 phases, each sized for one focused Claude Code session with one coherent deliverable (this was
itself a deliberate redesign — an early draft had 9 chunkier phases that got split down for focus).
Every phase doc names the REQUIREMENTS IDs it covers, its dependencies, and ends with a manual test
checklist. A build session for any phase is expected to read PROGRESS.md → REQUIREMENTS.md → its
phase doc → the relevant Design/ mockup(s) → the relevant RFP section, in that order, before
writing code.

## The review loop you're joining

The user has been running Codex as an independent, adversarial reviewer against this plan, in
rounds. Each round: Codex reads the plan and the RFP and reports a numbered list of findings, each
citing a plan-doc location and an RFP.md location. Multiple rounds have already happened (see
PROGRESS.md's Decisions log — one dated entry per round) — most findings were real and got fixed;
some were misreadings that got clarified rather than "fixed"; several rulings (pre-payment,
billedAt, post-op addendum) were re-raised across rounds and are now CLOSED — see the "Settled
rulings" list at the bottom of this file and treat a re-raise without new RFP evidence as a
reject-with-citation, not a fresh question.

**Your job when I paste a new batch of findings:**

1. **Read PROGRESS.md's full Decisions log first.** If a finding restates something already
   settled there, say so and move on — don't redo it. If a finding is genuinely new or points at
   something that regressed, proceed.
2. **Verify every citation yourself — don't trust Codex's paraphrase.** Open the actual RFP.md
   line(s) cited (and the PDF/Data-Model-and-Flow.html where relevant) and read the real text.
   Open the actual current plan-doc file and read the real current wording — line numbers drift
   as files are edited, so confirm you're looking at the right passage, not just the right number.
   A finding is only as good as its citations; check them before you agree with it.
3. **Form your own verdict per finding: real / partially real (needs a nuanced fix, not a
   wholesale rewrite) / not real (misreading — explain why).** Do not assume Codex is right just
   because it's specific and cites line numbers, and do not dismiss it just because you'd prefer
   not to touch a file — judge each one on the actual RFP text. Precedent for the "partially real"
   middle ground: a finding about pre-payment once landed as "make it a real gate with an audited
   override," not the reviewer's literal ask nor a flat rejection.
4. **Explain your reasoning before editing anything.** For each finding, state your verdict and
   why, citing the specific RFP line/section and the specific plan-doc line you checked. Do this
   for the whole batch before you start editing files.
5. **Fix consistently across every touched surface.** This plan is cross-referential: a domain
   rule usually lives in REQUIREMENTS.md AND the relevant phase doc(s) AND that phase's kick-off
   prompt in index.html AND sometimes needs a manual-test-checklist line added. A fix that touches
   only one of these will drift from the others. When you're done, grep for the old (wrong)
   phrasing across all of `docs/prototype-build/` to make sure nothing stale survives.
6. **Record what you did in PROGRESS.md's Decisions log** — a new dated entry, following the exact
   style of the existing entries (one line per finding: what changed and why; or, for rejected
   findings, why they're a misreading). If a new ruling supersedes an earlier logged one, say so
   explicitly rather than silently overwriting the old entry.

Don't assume every finding is real. Don't feel obliged to make changes just to look responsive.
Think about each one before you touch a file.

Confirm you've read PROGRESS.md, REQUIREMENTS.md, and skimmed the phase docs and Data-Model-and-
Flow.html, then tell me you're ready for the findings.
```

---

## Settled rulings — give this block to Codex with each fresh review

Copy-paste the block below into Codex's review prompt. These issues have been litigated (some
repeatedly) and are closed; the full reasoning lives in PROGRESS.md's Decisions log.

```
The following design rulings are SETTLED for this plan. Do not report them as findings unless you
can cite RFP text that the plan's Decisions log has not already considered — a re-raise without
new evidence will be rejected.

1. PRE-PAYMENT GATE (raised and closed 4 times). The gate is a hard block on marking the Card's
   Outcome complete while the pre-invoice is unpaid, lifted only by an audited office-only
   override with a required reason; a "pre-payment outstanding" flag surfaces the unpaid state
   pre-procedure (mobile card, admin day view, review). The pre-invoice covers only the
   patient-funded (BillableParty-route) portion of a mixed card. A browser prototype cannot gate
   a theatre list, and gating "Start Now" would block recording a clinical fact — both considered
   and rejected.
2. billedAt / LIST DISAPPEARANCE (raised and closed 3 times). billedAt = completion of the List's
   billing run (the RFP itself calls the trigger "a build detail to confirm"). A per-card failure
   or a Xero handoff failure does NOT restore anaesthetist visibility — the billing monitor owns
   both.
3. POST-OP CHARGES ON LOCKED CARDS. Handled as a linked addendum Card running its own
   capture→submit→authorise→bill cycle; the original stays immutable. A labelled §11 reading —
   writing to the locked Procedure record would collide with the RFP's own immutability rule.
4. CARD MOVES INTO SUBMITTED LISTS. reassignCard may target a SUBMITTED List, including with a
   not-yet-completed Card: the all-Cards-completed rule gates the DRAFT→SUBMITTED transition, not
   later office rebooking; the authorisation review flags not-completed Cards. Surgeon/hospital
   pairing mismatches are advisory, not guarded.
5. INVOICE GROUPING vs SPLIT BILLING. Same-counterparty procedures share one invoice; the RFP's
   "two separate invoices" split-billing rule is read as the different-funder case (the RFP's own
   cross-reference) — a labelled §11 reading and discovery question.
6. NHI IN XERO. Appendix 2's never-in-Xero reading is implemented and test-enforced; the
   contradiction with the cross-reference-field passage is surfaced in the Xero-sim UI as a
   discovery item, not silently resolved.
7. NO RETURNED STATE; OFFICE CHECK IS NOT A SYSTEM GATE. Both are explicit RFP statements.
8. LABELLED ASSUMPTIONS / DISCOVERY ITEMS (not defects): round-up partial-interval time rounding;
   demo-plausible modifier unit values (not an NZSA schedule); rvgBaseCode standing in for
   "procedure type" in price-list keys; the free-target/absorb/regenerate List-reassignment
   mechanics; billing-monitor placement in the Admin app; advisory (not hard) availability/holiday
   conflict reconciliation; the ACC-route check as a review advisory, not an engine guard (the
   RFP: ACC is "invisible to the billing engine").
9. DEMO SCALE. The 14-anaesthetist seed is a deliberate design-fidelity decision; production
   scale is proven by a Vitest canvas-generator test at 85 anaesthetists (~20k Lists) and the
   Xero-side volume story is narrated via seeded aggregate counters, not bulk records.
```
