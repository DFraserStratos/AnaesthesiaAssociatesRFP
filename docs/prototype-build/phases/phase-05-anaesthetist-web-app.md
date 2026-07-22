# Phase 05 — Anaesthetist Web App

**Requirements covered:** W1–W4, M11 shell (live data lands in Phase 10)
**Depends on:** Phases 03–04 (reuses the mobile card/list components).
**Estimated:** 1 session.

## Goal

The desktop twin of the mobile app for the same persona, modelled on RFP Appendix 5: dashboard
(calendar + financial + locum availability), Lists, Availability, and Overdue — plus the GST-period
activity summary shell. The RFP says mobile-app functional statements apply equally here, so
List/Card editing (including BTM capture) reuses Phases 03–04's flows re-laid-out for desktop.

## Reference

**Authoritative visuals (convention 17):** `Design/Web Dashboard.dc.html` and
`Design/Web Availability.dc.html`. Match their anatomy: white top-nav with the serif crimson
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
   rhythm visible; status legend; drill into List detail (shared components, desktop layout).
4. **Availability page**: pick a date → grid of ALL anaesthetists × AM/PM with status colours and
   annotation text — the locum-finder view. Search/filter by name; free sessions visually prominent.
5. **Overdue page**: accounts-outstanding table ordered by date (Patient, Contract, Surgeon, First
   Acct date, aging columns, ACC flag) per Appendix 5. Reads the billing slice; honest empty/seeded
   state until Phase 10. Flat list, no rollup (RFP explicit).
6. **BTM/GST page shell**: GST-period activity summary layout (period selector monthly /
   bi-monthly / six-monthly, date-ranged received amounts + GST component) with honest empty state;
   Phase 10 wires real payment data.
7. **Persona parity checks**: same lifecycle rules as mobile (can't edit SUBMITTED, no authorise
   controls anywhere in this app).

## Out of scope

Admin functions, live billing numbers (Phases 08–10), contract management.

## Manual test checklist

- [ ] Dashboard shows all five panels with seeded data; the week strip matches the same persona's mobile Forward Lists for the same dates.
- [ ] Lists page shows the 2-lists-per-day structure across a month range; drill-down opens the shared List/Card detail and a BTM edit behaves exactly like mobile (validation, guards).
- [ ] A free AM slot for tomorrow is findable in the Availability grid in under 10 seconds (the locum use case).
- [ ] Overdue table renders ordered by date with aging buckets and ACC flags (or its honest empty state).
- [ ] Mobile app is visually unchanged after the shared-component extraction.
- [ ] `npm run build` + `npx vitest run` green.

## PROGRESS.md updates

Status row + entry; note exactly which components moved to `src/shared/` so Phases 06–07 reuse instead of re-extracting.
