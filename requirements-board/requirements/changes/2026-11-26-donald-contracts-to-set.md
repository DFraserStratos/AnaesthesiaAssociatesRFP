# Requirements update: Bookings with no Contract, and the Contracts tab, 2026-11-26

## Inputs

- [Notes 2026-11-26 · Donald contracts to set](../notes/2026-11-26-donald-contracts-to-set.md) (AR-73):
  Donald's typed decisions in the session, reviewing the Admin Day rail's To-do list.

## Questions answered

None.

## Items changed, added, retired or moved

| Item | Title | What changed | Sources |
| --- | --- | --- | --- |
| [US-04.3.4](../stories/US-04.3.4.md) | Admin sets Contracts at booking setup | Rewritten: the office sets what it knows at setup or intake, above all the prepaid Procedures; it may stop part way or leave the Contract to the anaesthetist; a Procedure with no Contract puts its List on the Contracts tab, and the Booking cannot be completed without one. No longer mandatory at setup, no longer on the to-do list. New criteria: Left for the anaesthetist, Part way, Not completed without one. Related US-04.3.12. Status stays Verify (3). | Notes 2026-11-26 · Donald contracts to set #1 #2 #3 #4 |
| [US-04.3.12](../stories/US-04.3.12.md) | Lists waiting for Contracts | **New.** The Admin dashboard's Contracts tab, beside To-do and Notifications: one row per List with Procedures still needing a Contract ("3 of 5 set"), each Procedure's progress (nothing chosen, or invoice destination only), past Lists first and marked strongly, then soonest first; RVG detail never puts a List there. Verify (3). | #4 #5 |
| [US-03.4.1](../stories/US-03.4.1.md) | Anaesthetist can change the Contract | The anaesthetist can also choose a Contract where the office left none, and settles the ones the office could not. New criterion: None set yet. | #1 |
| [US-13.7.2](../stories/US-13.7.2.md) | Warnings on the dashboard to-do list | The to-do list holds warnings only; Procedures needing a Contract wait on the Contracts tab. New criterion: Warnings only. Status Agreed (4) to Verify (3), as AA has not seen the change. | #5 |
| [FT-13.7](../stories/FT-13.7.md) | Warnings and the to-do list | Notes line: Contracts to set are routine work, on the Contracts tab, not warnings. | #5 |
| [US-03.1.9](../stories/US-03.1.9.md) | Booking descriptions and Contract shown together | "Not matched yet" criterion: the List waits on the Contracts tab, not "the admin list". | #5 |
| [US-04.3.8](../stories/US-04.3.8.md) | Where the invoice goes, then the Contract | "The office's list" is now the Contracts tab, in the rule and the criterion. | #5 |
| [domain-model.md](../domain-model.md) | Booking setup row, the Procedure's contract field, Selection | Setting the Contract is no longer mandatory at setup; the anaesthetist settles the rest; the Contracts tab, never the to-do list. | #1 #5 |

## New questions

- [OQ-150](../questions/OQ-150.md) Where the office marks prepaid Procedures at intake (owner: Donald, while
  testing intake). Affects US-04.3.4, US-04.3.12, US-02.1.2.

## Points with no requirement change

- #6 (built small, expected to change): how the work is done, plus OQ-150.
- #7 (a combined Lists page): an idea for later, not decided; mentioned in US-04.3.12's Notes only.
