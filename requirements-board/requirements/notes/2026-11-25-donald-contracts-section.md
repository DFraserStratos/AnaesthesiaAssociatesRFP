# Donald's decisions: the Contracts section of the Admin app, 2026-11-25

- **Who:** Donald Fraser (Stratos, product owner), designing with Claude how the office finds,
  reads and changes Contracts. Greg and AA have not seen it yet.
- **Covered:** Contracts as their own section of the Admin app; a page for each Contract; grouping
  the Contract list; price ranges as a table; replacing a Contract from a date; confirming a
  disable; the New contract page; the Parties and Funding tags tabs; what was considered and left
  out; and three questions to raise.
- **Standing:** Donald's decisions, made for the build. They change how the office works with
  Contracts, not what a Contract is: the flat Contract model, Parties and funding tags stand as
  modelled. Items they change go to Verify, not Agreed.
- **Inputs gathered here:** Donald's typed answers in the session, on a design worked through in
  three passes (the design pages are `docs/explorations/contracts-section.html` and, for the first
  pass, `docs/explorations/contracts-ideas.html`). The wording below is Donald's where quoted and a
  summary of the design he approved otherwise.

Cite a point as `"Notes 2026-11-25 · Donald contracts section #n"`. Points are numbered once across
the whole note.

## Donald's decisions

1. **Contracts is its own section of the Admin app.** A side-nav entry with three tabs: Contracts,
   Parties and Funding tags. They leave Master data, which keeps everything else (specialties, RVG
   groups, modifiers and the rest). Donald: Contracts are "a very important part of the system. Lots
   of what happens in the system hangs off of that function", and it "needs to become a bit more of
   a first-class citizen, be in the left-hand menu, and be something that the admin staff can
   update." Bears on US-13.4.1 and FT-04.1.
2. **Every Contract has its own page.** Its cards show the price, where it is offered, who it bills
   (the holder Party's billing name and delivery, shown read-only and changed on the Party), the
   invoice wording and codes, and what was fixed when it was created (holder, pricing kind,
   prepaid). Each card is edited and saved on its own, and each save is its own audited change. The
   page lists the Procedures on the Contract (upcoming and unbilled, and authorised ones at their
   locked price), its event fees and its history. Bears on US-04.1.2 and US-04.1.3.
3. **The Contract list can be grouped.** By holder, kind of holder, funding tag, surgeon (a Contract
   linked to two surgeons shows under both), where the invoice goes, or pricing kind, with an index
   of the groups and their counts beside the list. Search and the Active, Disabled or All filter
   stay; the holder filter becomes the holder grouping. A row opens the Contract's page. Donald: "the
   some sort of grouping view like number 2 has, where you can group by different organizations or
   funders or surgeons groups, is really quite good." Bears on US-04.1.2.
4. **Price ranges show as a table.** Newest first: from, to (the day before the next range starts),
   price, the change on the range before, and how many Procedures the range priced. The current and
   future ranges always show; ended ranges fold away after three. A range is added or corrected as a
   row of the table. Donald: "I would expect to see something that's a bit more like a table with
   date ranges and prices attached to them... we need something that might need to be able to scale
   for 10 years where you can see all the prices." Bears on US-04.2.15.
5. **Replace from a date is one action.** It creates a new Contract copied from the old one, with
   any setting changed, the settings fixed at creation included; lists the Procedures dated from
   that date still on the old Contract; and moves the ones the office ticks. Moving is the office's
   own act: nothing moves by itself. The office then either leaves the old Contract active, with a
   to-do on that date reminding it to disable it, or disables it at once. A replacement that is not
   a fixed price is offered from the day it is saved, because only price ranges carry dates, and the
   action says so. Bears on US-04.1.2.
6. **Disabling asks first.** The office confirms a disable, and is shown the Procedures dated from
   today still on the Contract. Bears on US-04.1.2.
7. **New contract is a page, filled in order.** Holder and who it bills; then pricing (kind, rate or
   first price range, prepaid, the anaesthetist's override); then where it is offered; then name,
   codes and invoice wording. The page shows where the Contract will appear on the step rail, and the
   holder's existing Contracts with a similar name, as a hint, never a block. Donald: "the new
   contracts page you've made, it looks quite nice." Bears on US-04.1.2.
8. **The Parties tab is AA's address book.** Parties are grouped by kind, including those that hold
   no Contracts, since insurers and funders are also chosen as a Booking's funder. Each Party has a
   page with its details, edited in place, and its Contracts counted by funding tag, each count
   opening the Contract list. The model is unchanged: a Contract names one Party as its holder, and
   the Party is the billing record. Donald asked whether the earlier "little address book" idea
   still holds; it does, and Donald chose to keep the name Parties ("Happy to keep things labeled as
   parties for now"). Bears on US-04.1.5.
9. **The Funding tags tab.** AA's ordered list of tags with each tag's funder, set in the order the
   step rail shows them, and the Contracts under each tag grouped by hospital. Funding tags stay as
   modelled: they are the SXAP, HNZ and ACC step under a hospital that AA accepted in the contract
   picker workshop. Donald: "these are actually all contracts that sit under Christchurch Eye
   Surgery in this example. It's just who's actually funding it is different", and "There's value in
   having a tab to see funding tags and understanding which contracts are under them". Step 2 keeps
   the label "Funding tag". Bears on US-13.4.5 and US-04.2.17.
10. **Considered and not built.** A desk page of Contract work ("It just feels like a lot of
    information that's not actually needed"); adding one price range to many Contracts at once ("I
    don't expect that we would be able to or should add price ranges to multiple procedures at
    once"); and a screen for testing what the step rail offers on a List ("we don't need this cute
    rail test screen"). Bears on US-04.1.2's Notes only.

## Questions to raise

11. **Scheduled disable (for AA).** Replacing a rate from 1 January makes the new Contract available
    on the day it is saved, and the old one stays offered until the office disables it. Should a
    Contract be able to be disabled from a future date, so the old rate stops being offered on the
    day it is replaced? Bears on US-04.1.2.
12. **Untagged hospital Contracts (for Ben).** A hospital's Contract with no funding tag, such as
    St George's plain RVG Contract, sits under Special on the step rail, not under the hospital. Is
    that where the office would look for it? Bears on US-04.2.17 and US-04.3.8.
13. **Backstops.** US-04.3.9 gives each hospital and funding tag an RVG backstop as well as the
    Fixed price one, while the domain model lists only the Fixed price one. Which is right? Bears on
    US-04.3.9.
