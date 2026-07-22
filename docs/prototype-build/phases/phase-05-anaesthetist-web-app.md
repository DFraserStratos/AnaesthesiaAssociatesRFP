# Phase 05 — Anaesthetist Web App

**Requirements covered:** W1–W4, M6/M7 web parity, M11 shell (live data lands in Phase 10)
**Depends on:** Phases 03–04 (reuses the mobile card/list components).
**Estimated:** 1 session.

## Goal

The desktop twin of the mobile app for the same persona, modelled on RFP Appendix 5: dashboard
(calendar + financial + locum availability), Lists, Availability, and Overdue — plus the GST-period
activity summary shell. The RFP says mobile-app functional statements apply equally here, so
List/Card editing (including BTM capture) reuses Phases 03–04's flows re-laid-out for desktop.

## Reference

**Authoritative visuals (convention 17):** `docs/design/Web Dashboard.dc.html` and
`docs/design/Web Availability.dc.html`. Match their anatomy: white top-nav with the serif crimson
wordmark + "SPECIALIST ANAESTHETISTS" micro-caps, crimson underline on the active item, persona
name + crimson-tint avatar right; nav = **Dashboard · Lists · Availability · Accounts** (Accounts
houses Overdue + the GST summary — Decisions log). Dashboard: "Kia ora, Dr Souter" header with the
day-summary line and an "Offer cover" teal button; the week strip (7 columns of AM/PM tinted
blocks with left status bars, today outlined in crimson, dashed Free block, merged holiday block);
receivables aging as horizontal bars (Current teal / 31–60 faded / 61–90 amber / 90+ red) with an
"N accounts over 60 days" footer link; productivity as four stat tiles (mono numbers, +% pill);
leave rows with Approved/Pending pills and a "Request leave" outline button (visual stub is fine);
"Who's free — next 5 days" rows (mono slot label, green name chips, "Ask to cover" links).
Availability: day header with ‹ date › + Today controls, All/Free-only filter chips (Free shows
the count), inline colour legend, and the grid — 220px name column + AM/PM cell buttons (status
bar + two text lines; Free cells dashed with a "Book" affordance that flips to a solid green
"Cover requested ✓" state on click).

RFP pages 46–49 (Appendix 5) remain the functional reference for what each page must contain.

## Work items

1. **Shared extraction first:** pull the pieces Phases 03–04 built that this app needs (status
   chips, card detail form, BTM block, validation surfaces, list rows) into `src/shared/` —
   refactor, don't fork. Mobile must remain visually unchanged afterwards (eyeball against
   before-screenshots).
2. **Dashboard (Home):**
   - Welcome header with persona name + notes line (upcoming holiday etc. from seed).
   - **Week calendar strip**: 7 columns × AM/PM rows of the anaesthetist's Lists, colour-coded, surgeon/hospital labels, click-through to List detail; prev/next week.
   - **Receivables panel**: aging buckets (current / 1 / 2 / 3+ months) — reads the billing slice; until Phase 10 populates it, show an honest empty state ("no billed work yet") or seeded placeholders per the plan — never numbers hardcoded in components.
   - **Productivity panel**: 30/60-day and 6-month totals vs last year (seeded history numbers live in seed, not components).
   - **Leave bookings** list and **Unassigned anaesthetists (next 5 days)** locum panel (name, session, mobile).
3. **Lists page**: date-range picker (default: today +4 weeks) → table of the anaesthetist's Lists
   (Date, From, To, Description = surgeon/hospital or status text, colour-coded row), the 2-per-day
   rhythm visible; **From/To read the List's actual start/end times** — including any office
   override (D2), never hardcoded session defaults — and the dashboard week strip labels its
   blocks with the same actual times; status legend; drill into List detail (shared components,
   desktop layout).
   **Card actions carry over too**: card copy and ad-hoc/photo creation (M6/M7, incl. the NHI
   lookup) are available from the web List detail via the shared components — the RFP: mobile-app
   statements "apply equally to the anaesthetists' web app view" — re-laid-out for desktop
   (dialog/panel, not bottom sheet, per convention 16).
4. **Availability page**: pick a date → grid of ALL anaesthetists × AM/PM with status colours and
   annotation text — the locum-finder view. Search/filter by name; free sessions visually prominent.
5. **Overdue page**: accounts-outstanding table ordered by date (Patient, Contract, Surgeon, First
   Acct date, aging columns, ACC flag) per Appendix 5. Reads the billing slice; honest empty/seeded
   state until Phase 10. Flat list, no rollup (RFP explicit).
6. **BTM/GST page shell**: GST-period activity report layout — per the RFP, a **date-ranged list
   of amounts received, one row per receipt, each with its GST component**, with period totals as
   a footer (a transaction list, not a totals-only summary; period selector monthly / bi-monthly /
   six-monthly) — with honest empty state; Phase 10 wires real payment data.
7. **Persona parity checks**: same lifecycle rules as mobile (can't edit SUBMITTED, no authorise
   controls anywhere in this app).

## Out of scope

Admin functions, live billing numbers (Phases 08–10), contract management.

## Manual test checklist

- [ ] Dashboard shows all five panels with seeded data; the week strip matches the same persona's mobile Forward Lists for the same dates.
- [ ] Lists page shows the 2-lists-per-day structure across a month range; drill-down opens the shared List/Card detail and a BTM edit behaves exactly like mobile (validation, guards).
- [ ] Card copy and ad-hoc creation (incl. NHI lookup and the photo path) work from the web List detail exactly as on mobile, in desktop layout.
- [ ] A free AM slot for tomorrow is findable in the Availability grid in under 10 seconds (the locum use case).
- [ ] Overdue table renders ordered by date with aging buckets and ACC flags (or its honest empty state).
- [ ] Mobile app is visually unchanged after the shared-component extraction.
- [ ] `npm run build` + `npx vitest run` green.

## Adversarial review (after build)

After the manual test checklist and `npm run build` / `npx vitest run` are green — and before writing the PROGRESS entry — run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**: fan out a few independent Opus review subagents (one each for **quality**, **bugs/correctness** and **plan adherence**), then this session independently verifies every finding against the source docs and the code, fixes the confirmed ones, re-greens build + tests, and records the pass in the phase entry. Do not re-raise anything already settled in the Decisions log.

**Steer this phase's reviewers at:**
- The `src/shared/` extraction is a refactor, not a fork: mobile must be visually and behaviourally unchanged afterwards, and no guard/validation logic is duplicated between the mobile and web copies.
- The desktop re-layout honours convention 16 (dialogs / side panels, not bottom sheets) while reusing the same guarded actions and BTM capture as mobile.
- Lists and the dashboard week strip show each List's ACTUAL start/end times including office overrides (D2) — never hardcoded session defaults — and agree with the same persona's mobile Forward Lists for the same dates.
- Receivables / Overdue / GST render honest empty (or seeded-history) states until Phase 10; no numbers are hardcoded in components.
- No authorise controls exist anywhere in this app; SUBMITTED is read-only to the persona; every read is view-scoped to the persona's own data (A8).

## PROGRESS.md updates

Status row + entry; note exactly which components moved to `src/shared/` so Phases 06–07 reuse instead of re-extracting.
