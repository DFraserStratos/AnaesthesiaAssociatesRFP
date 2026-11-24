# Requirements update, 2026-11-25: the Contracts section of the Admin app

Donald decided how the office finds, reads and changes Contracts: Contracts become their own section of
the Admin app, with Contracts, Parties and Funding tags tabs, and every Contract gets a page of its own.
The Contract model is unchanged: one priced item held by a Party, Active or Disabled, a fixed price
through price ranges, and funding tags as modelled. What changes is how the office works with it. The
decisions are Donald's, for the build, and not yet seen by AA or Greg, so every item stays at Verify.

The main changes:

- **Contracts is its own section** ([US-13.4.1](../stories/US-13.4.1.md), [FT-04.1](../stories/FT-04.1.md)).
  Contracts, Parties and funding tags leave Master data, which keeps the rest of the reference data.
- **A page for each Contract** ([US-04.1.7](../stories/US-04.1.7.md), new). It shows the Contract's price,
  where it is offered, who it bills, its codes and wording, and what was fixed at creation, each as a
  card edited and saved on its own as one audited change. It also lists the Procedures on the Contract,
  its event fees and its history.
- **The Contract list can be grouped** ([US-04.1.2](../stories/US-04.1.2.md)) by holder, kind of holder,
  funding tag, surgeon, where the invoice goes or pricing kind, with an index of the groups. The holder
  filter becomes the holder grouping.
- **Replace a Contract from a date** ([US-04.1.8](../stories/US-04.1.8.md), new) is one action. It
  copies the Contract with any setting changed, lists the Procedures still on the old one from that
  date, and moves only the ones the office ticks. The old Contract is left active, with a to-do on the
  date, or disabled at once. It replaces US-04.1.2's earlier warn-and-list on creating a new Contract.
- **Disabling asks first** and lists the Procedures from today still on the Contract; **New contract is a
  page** filled in the order its rules depend on ([US-04.1.2](../stories/US-04.1.2.md)).
- **Price ranges as a table**, newest first, ended ranges folded after three
  ([US-04.2.15](../stories/US-04.2.15.md)).
- **The Parties tab** ([US-04.1.5](../stories/US-04.1.5.md)) and **the Funding tags tab**
  ([US-13.4.5](../stories/US-13.4.5.md)).
- **Not built:** a desk of Contract work, adding one price range to many Contracts at once, and a
  screen for testing what the step rail offers on a List.

In all, 9 items changed and 2 were added; none were retired or moved, and no status changed. Three
questions were added (OQ-144, OQ-145, OQ-146). The domain model gained one clause. The note was
registered as AR-69.

## 1. Inputs

- Note: [Donald contracts section](../notes/2026-11-25-donald-contracts-section.md), artifact
  [AR-69](../artifacts/AR-69.md), 13 points. Cited as "Notes 2026-11-25 · Donald contracts section #n".
- Donald's typed answers in a design session with Claude, on design pages kept in
  `docs/explorations/contracts-section.html` and `docs/explorations/contracts-ideas.html` (not
  catalogue artifacts, at Donald's request). Nothing was recorded or transcribed.
- Board answers: none. The repo's uncommitted edits to artifacts AR-01, AR-02, AR-44, AR-62 and AR-63
  are from another session and are not part of this update.

## 2. Questions answered

None.

## 3. Items changed or added

| Item | Title | What changed | Sources |
|---|---|---|---|
| [US-04.1.2](../stories/US-04.1.2.md) | Create, edit and disable Contracts | Rewritten: the list's search and grouping with an index; a dated change is a replacement (US-04.1.8); the New contract page and its order; a confirmed disable that lists the Procedures from today; the holder joins prepaid and pricing kind as fixed at creation. Holder filter, dated change and warn-on-disable criteria replaced by Grouped, Two surgeons, New contract order, Similar name and Disable confirmed. Notes record what was considered and not built. | #1 #3 #5 #6 #7 #10 |
| [US-04.1.7](../stories/US-04.1.7.md) | A page for each Contract | New: the page, its cards, one audited change per card, the Procedures on it, system Contracts. | #2 #4 |
| [US-04.1.8](../stories/US-04.1.8.md) | Replace a Contract from a date | New: the one action, ticked moves only, locked Procedures left out, old Contract left active with a to-do or disabled now, a late disable lists from the change date, a non-fixed replacement offered from the day it is saved. | OQ-133, #5 |
| [US-04.2.15](../stories/US-04.2.15.md) | Price ranges on a fixed price | Added the table: newest first, to worked out, change and Procedures columns, ended ranges folded after three; criteria Table and To worked out. | #4 |
| [US-04.1.5](../stories/US-04.1.5.md) | Parties | Added the Parties tab, grouped by kind, Parties with no Contracts included, and each Party's page with its Contracts counted by funding tag; two criteria. | #8 |
| [US-13.4.5](../stories/US-13.4.5.md) | Funding tags | Added the tab, with each tag's Contracts grouped by hospital; criterion Contracts under a tag. | #9 |
| [US-04.2.17](../stories/US-04.2.17.md) | Funding tag on a Contract | Source and Notes only: funding tags confirmed as modelled, against the contract picker mock AA accepted. | #9 |
| [US-04.1.3](../stories/US-04.1.3.md) | Contract audit | One audited change per card; what a replacement audits. | #2 #5 |
| [US-13.4.1](../stories/US-13.4.1.md) | Maintain reference tables | Reference data in two places: Master data, and the Contracts section for Contracts, Parties and funding tags. | #1 |
| [FT-04.1](../stories/FT-04.1.md) | Contract catalogue | Theme line: the catalogue has its own section, and each Contract its own page. | #1 |
| [domain-model.md](../domain-model.md) | Contract | The holder is fixed once the Contract is created (already a rule of US-04.1.7 and the build). | #2 |

## 4. New questions

- [OQ-144](../questions/OQ-144.md) Disabling a Contract from a future date (Donald to ask AA). #11
- [OQ-145](../questions/OQ-145.md) A hospital's untagged Contracts on the step rail (Donald to ask Ben). #12
- [OQ-146](../questions/OQ-146.md) Which backstops each hospital and funding tag gets (Donald). #13

## 5. Points with no requirement change

- #8, the address book: the Party model is unchanged; only where Parties are kept and shown changed.
- #9, the label "Funding tag" stays: no wording change.
- #10, the items not built: recorded in US-04.1.2's Notes only.
- US-04.2.1 and US-04.2.18: the page shows who a Contract bills and its codes, but their rules are
  unchanged, so they were not edited.

## 6. Links

The link pass over EP-04 and EP-13 added four text links and one related link (US-04.1.8 to
US-07.3.1, US-04.2.1 to US-04.3.3, US-04.3.4 to US-03.3.9, US-13.2.4 to US-08.3.2; US-04.3.11 related
to US-01.4.7). It also found that US-04.3.9's "No contract · RVG" pointed at US-04.3.1 instead of
US-04.3.3, which was corrected.
