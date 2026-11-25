# Requirements update, 2026-11-26: the Finances section of the Admin app

Donald decided how the office does its money work in the Admin app. Invoices, the Billing monitor and
the Ledger become one Finances section with six tabs: Billing, Invoices, Payments, Ledger, Xero and AA
fees. The billing engine, the ledger, the payment cycle, Xero and AA fees work as already modelled; what
changes is where the office sees and does each piece. The decisions are Donald's, for the build, and not
yet seen by AA or Greg, so every story whose requirements changed is at Verify; Proposed stories stay
Proposed, and Notes-only and theme edits keep their status.

The main changes:

- **Finances is one section** ([US-13.3.3](../stories/US-13.3.3.md), new). One nav entry, six tabs each
  with its own address, opening on Billing with no summary page. A tab's number counts what needs
  doing (Finances' own rule; Contracts and People keep counting what they list), and one warning badge
  on the nav entry counts billing problems and ledger checks together.
- **The Billing tab** ([US-13.3.1](../stories/US-13.3.1.md), retitled "Billing status of each List and
  Booking"). Bookings under a heading for each List, grouped by anaesthetist, opening on Problems with
  each Booking's reason and fix. Lists are approved in the Review queue only; Billing links to it.
- **Fixing a failure** ([US-13.3.2](../stories/US-13.3.2.md)) is done beside the Booking on Billing; Xero
  hand-offs and invoices changed directly in Xero sit on the Xero tab.
- **The Ledger tab** ([US-13.2.1](../stories/US-13.2.1.md)): one sentence on whether the books are square,
  four figures, a list of anaesthetists, invoice pairs or the AA Holding account, receipts to place, and
  an account page for each anaesthetist in place of the whole/one-anaesthetist switch.
- **The Invoices tab** ([US-08.4.7](../stories/US-08.4.7.md), new "Find any invoice"): searched by every
  key the catalogue names, with each invoice's state (Unpaid, Part paid, Paid), what is owed and its
  kind; Awaiting approval is one of its filters ([US-06.3.1](../stories/US-06.3.1.md),
  [US-13.7.4](../stories/US-13.7.4.md)).
- **Payments and AA fees** ([US-10.2.7](../stories/US-10.2.7.md), [US-10.3.1](../stories/US-10.3.1.md),
  [US-10.3.3](../stories/US-10.3.3.md)): the weekly cycle and its runs, each run with its page and
  remittances; AA's fee invoices, the monthly run and fee settings on their own tab.

In all, 10 items changed and 2 were added. One question is new. The domain model is unchanged. The note
is registered as AR-71.

## 1. Inputs

- [Notes 2026-11-26 · Donald finances section](../notes/2026-11-26-donald-finances-section.md) (AR-71):
  Donald's answers on a decisions page, on a design worked through in four passes. The design pages are
  `docs/explorations/finances-section.html` and `docs/explorations/finances-decisions.html` (commit
  25ba036f). They are not catalogue artifacts.
- A review of the three screens in the prototype and of the stories under EP-06, EP-08, EP-09, EP-10,
  FT-11.3, FT-13.2 and FT-13.3.

## 2. Questions answered

None.

## 3. Items changed or added

| Item | Title | What changed | Sources (#n) |
| --- | --- | --- | --- |
| [US-13.3.3](../stories/US-13.3.3.md) | The Finances section | New, under FT-13.3: one nav entry, six tabs, opens on Billing, no summary page; tab numbers count what needs doing; one warning badge; records on their own pages under their tab; what stays elsewhere | #1 #2 #6 #7 #13 #14 #15 |
| [US-13.3.1](../stories/US-13.3.1.md) | Billing status of each List and Booking | Retitled from "Processing monitor" and rewritten: Bookings under each List, opens on Problems with reason and fix, filters and search; Lists awaiting approval open the Review queue and are never approved here. 4 to 3 | #3 #4 #15 |
| [US-13.3.2](../stories/US-13.3.2.md) | Manual intervention | Fixes beside the Booking on Billing; hand-offs and invoices changed in Xero on the Xero tab; Xero Integration added to components. 4 to 3 | #1 #4 #11 |
| [US-13.2.1](../stories/US-13.2.1.md) | Ledger balance views | Rewritten as the Ledger tab with an account page per anaesthetist; the whole/one-anaesthetist criterion goes. 4 to 3 | #5 #10 #15 |
| [US-08.4.7](../stories/US-08.4.7.md) | Find any invoice | New, under FT-08.4: the Invoices tab | #8 #12 #13 |
| [US-06.3.1](../stories/US-06.3.1.md) | Raise the prepayment invoice | Approved under Awaiting approval on the Invoices tab, the switch beside it. Status kept (3) | #8 |
| [US-13.7.4](../stories/US-13.7.4.md) | Warning and check-step settings | The prepayment approval switch sits beside the Invoices list; other check steps unchanged. Status kept (1) | #8 |
| [US-10.2.7](../stories/US-10.2.7.md) | Weekly payment cycle | The Payments tab, a page for each run with its remittances; one criterion; OQ-47 untouched. Status kept (1) | #9 #13 |
| [US-10.3.1](../stories/US-10.3.1.md) | Generate AA fee invoices | Run from the AA fees tab, which opens on unpaid; not on the Invoices tab; two criteria; Admin App added. Status kept (3) | #12 |
| [US-10.3.3](../stories/US-10.3.3.md) | AA fee settings | On the AA fees tab. Status kept (3) | #12 |
| [US-13.2.4](../stories/US-13.2.4.md) | Reconciliation status at a glance | Notes only: no summary page, the status stays on the dashboard. Status kept (1) | #2 #14 |
| [FT-13.3](../stories/FT-13.3.md) | Billing flow monitoring | Theme: monitoring lives in the Finances section; the RFP note moved to Notes. Status kept | #1 |

## 4. New questions

- [OQ-149](../questions/OQ-149.md) Where a receipt nobody can place is placed: the Ledger tab places a
  receipt or marks it refunded, while US-10.2.4 has unmatched items handled in Xero's bank
  reconciliation (#10).

## 5. Points with no requirement change

- #15, the options considered and not built: kept in the note, and named in the Notes of US-13.3.3, US-13.3.1 (approving Lists from Billing, the two other Billing layouts) and US-13.2.1 (the whole-ledger and one-anaesthetist switch).
- The side nav's order: a design detail of the Admin app; no story holds it.
- Stories read and still accurate: US-08.5.1, US-08.5.2, US-08.3.1, US-08.3.4, US-08.3.5, US-06.5.1,
  US-06.5.2, US-06.3.2, US-09.1.1, US-09.2.2, US-08.4.3, US-10.2.5, US-10.2.6, US-10.3.2, US-08.6.3,
  US-08.6.5, US-13.2.2, US-07.3.1; features FT-08.4, FT-09.2, FT-10.2, FT-10.3, FT-13.2 and EP-13; the
  domain model.
- Screenshot captions that still name the Billing monitor (FT-08.5, FT-13.3, US-08.5.1, US-15.0.4):
  left for the owner's sweep, which recaptures them.

## 6. Links

The link pass over EP-13, EP-08, EP-06 and EP-10 applied 5 text links across 5 files: "audited" to
US-13.5.2 in US-13.4.4 and US-13.4.5, "No contract · RVG" to US-04.3.3 in US-08.4.6, "additional
invoice" to US-08.6.3 in US-06.2.6, and "moves to another anaesthetist" to US-01.4.7 in US-06.5.4. The
batches rejected 15 other proposals: a feature linking its own child, an open question as a defining
target, items already at their link cap, and pairs already linked from the other side.
