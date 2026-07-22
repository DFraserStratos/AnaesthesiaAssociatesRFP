# AA Prototype — High-level Roadmap

Thirteen phases, each sized for **one focused Claude Code session with one coherent deliverable**.
Each phase has a detailed plan in `phases/`, a kick-off prompt in `index.html`, and ends by
updating `PROGRESS.md` so the next session starts with full context.

```
Foundations   00 scaffold & shell ─▶ 01 domain & calculator ─▶ 02 seed & store
Apps          03 mobile: schedule & cards ─▶ 04 mobile: BTM capture & submit
              ─▶ 05 anaesthetist web app ─▶ 06 admin: day dashboard ─▶ 07 admin: authorisation & masters
Money         08 billing: run & invoices ─▶ 09 billing: exceptions & monitor ─▶ 10 Xero & payments
Edges         11 integrations (any time after 07)
Wrap          12 demo polish & guided script
```

| # | Phase | Delivers | Depends on |
|---|-------|----------|------------|
| 00 | Scaffold & app shell | Vite/React/TS app, app-switcher dropdown, phone frame, design tokens, routing, demo control panel stub | — |
| 01 | Domain model & billing calculator | Typed entities, demo clock, NHI validators (both formats), pure unit-tested BTM calculator (tiered time, modifiers, contracts, overrides, split billing, validation) | 00 |
| 02 | Seed data & store | Deterministic seed (canvas, masters, RVG/modifiers, contracts, ready-made demo states), Zustand store, lifecycle guards, append-only audit, persistence + reset, data inspector | 01 |
| 03 | Mobile: schedule & cards | Forward Lists → Cards → Card navigation, card editing, copy, ad-hoc + photo-OCR mock, both availability screens | 02 |
| 04 | Mobile: BTM capture & submission | Outcome/BTM block (ASA/RVG/modifiers/times/steppers/fee), validation, additional procedures, list "Completed" submit flow | 03 |
| 05 | Anaesthetist web app | Shared-component extraction, dashboard (calendar/financial/locum), Lists, Availability, Overdue, GST shell | 04 |
| 06 | Admin: day dashboard & changes | One-day grid, conflict flags, manual changes, phone-advice bookings, list reassignment | 05 |
| 07 | Admin: authorisation & masters | SUBMITTED→AUTHORISED queue + sanity check + phone notes, master data screens, audit viewer, RBAC demo | 06 |
| 08 | Billing: run & invoices | Route resolution, contracts 1/2/3, three charge bases, split billing, counterparty grouping, invoice documents, billedAt trigger | 07 |
| 09 | Billing: exceptions & monitor | Pre-payment, post-op addendum, billing monitor, failure isolation + retry | 08 |
| 10 | Xero & payments simulation | Xero sim screen, ACCREC/ACCPAY pairs, contact lifecycle & archiving, webhook + poll, payables run, two-state money, live balance/GST views | 09 |
| 11 | Integrations simulation | HL7 v2 → FHIR replay, FHIR-native feed, PDF ingestion, integration monitor + failure/retry, NHI dual-format validator | 03 + 07 |
| 12 | Demo polish & guided script | Seeded scenarios S1–S5, finished control panel, QA sweep, DEMO-SCRIPT.md, README | all |

**Sequencing rules:** 00 → 01 → 02 strictly first. 03 → 04 → 05 → 06 → 07 in order (each reuses
the previous phase's components). 08 → 09 → 10 in order. 11 any time after 07 (independent of
08–10). 12 last.

**Milestone demos** (what you can show at each point):
- After 04: the anaesthetist's day — lists, cards, BTM capture, validated submit.
- After 07: the full booking-to-authorised office workflow, including illness-cover reassignment.
- After 10: the complete money story — authorise → invoice → Xero pair → payment → disbursement.
- After 12: the scripted end-to-end "day in the life" demo across all three apps.
