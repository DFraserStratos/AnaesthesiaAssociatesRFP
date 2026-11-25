# Donald's decisions: the People section of the Admin app, 2026-11-25

- **Who:** Donald Fraser (Stratos, product owner), designing with Claude how the office finds,
  reads and changes the records it keeps about people: anaesthetists, surgeons, specialties and
  patients. Greg and AA have not seen it yet.
- **Covered:** a People section of the Admin app and its four tabs; a page for each record, its
  cards edited one at a time, with a side panel of what the person is on; specialties; finding a
  surgeon; cutting surgeon groups; the priority tier; Patients inside People and where the rows
  waiting for an NHI go; making an anaesthetist inactive; what was considered and left out; and two
  questions to raise.
- **Standing:** Donald's decisions, made for the build. They change where the office keeps and
  reads these records, and add an inactive anaesthetist and the removal of surgeon groups; the
  Contract model, Parties (the surgeon group kind included) and pairings stand as modelled. Items
  they change go to Verify, not Agreed.
- **Inputs gathered here:** Donald's typed answers in the session, on a design worked through in
  three passes (the design pages are `docs/explorations/people-section.html` and, for the first
  pass, `docs/explorations/people-ideas.html`), and a check of the prototype and the catalogue for
  everything that reads a surgeon group. The wording below is Donald's where quoted and a summary of
  the design he approved otherwise.

Cite a point as `"Notes 2026-11-25 · Donald people section #n"`. Points are numbered once across
the whole note.

## Donald's decisions

1. **People is its own section of the Admin app.** A side-nav entry in the place Patients held,
   among the daily work, with four tabs: Anaesthetists, Surgeons, Specialties and Patients. It takes
   over the Patients entry and its attention count (patients needing the office). Anaesthetists,
   surgeons and specialties leave Master data, which keeps hospitals and their holidays and
   everything else; patients leave their own section. Donald: "I think patient should be folded in
   to your mockups" and "I think specialties should be moved into the people tab." Hospitals "will
   stay in the master data." Bears on US-13.4.1, US-13.4.4 and FT-11.1.
2. **Every record has its own page.** An anaesthetist's, a surgeon's, a specialty's and a patient's
   page, each reached from its tab's list and keyed by an identifier that never changes (the
   anaesthetist's registration number, the patient's NHI). The page's details sit on cards, each
   edited and saved on its own, and each save is its own audited change. A side panel shows what the
   person is on: for an anaesthetist and a surgeon, their pairings, the Contracts linked to them and
   their next Lists, a few of each with a way to see all. Each tab's list can be searched, filtered
   and paged. The same page pattern as a Contract's. Bears on US-12.1.4, US-13.6.2, US-11.1.1 and
   US-13.4.1.
3. **The side panel first, not tabs.** An anaesthetist's or surgeon's page starts with the side
   panel; separate tabs listing every List and every Contract are not built for now. Donald chose "A
   side panel to start". Bears on US-12.1.4 and US-13.6.2.
4. **A specialty has a page.** It shows the surgeons who practise it and the Contracts for it, and
   the specialty is renamed or removed there. Bears on US-13.4.4.
5. **Surgeons are found with a filter.** The Surgeons list is searched by name, practice or HPI CPN
   and filtered by specialty and by Active or Retired; there is no list grouped by specialty. Donald:
   "No, a filter is enough." Bears on US-13.6.2 and US-13.4.1.
6. **Surgeon groups are cut.** The surgeon group record (a name, a description and member surgeons,
   kept in Master data) goes entirely, with its screens and the groups shown on a surgeon's page.
   Nothing else reads it: the step rail offers a Contract because a surgeon is linked on that
   Contract, pricing and billing use the Party, pairings name one surgeon and one anaesthetist, and
   no load, picker or rule uses the group. The RFP's master tables hold no surgeon groups. The Party
   of kind surgeon group (a group that holds Contracts and is billed for them) stays, and who works
   for it is recorded where it decides anything: the surgeons linked on each of its Contracts.
   Donald: "I have a feeling that the surgeon groups is this weird hangover of an idea... I don't
   think it's needed", then, on the evidence, "Yes, cut it." Bears on US-13.4.1, US-13.6.2 and the
   domain model.
7. **The priority tier is edited in a card.** It sits with the rate per unit on the anaesthetist's
   page and is changed with Edit and Save, like every other card, never saved by a single click. The
   Anaesthetists list can be filtered by tier. Donald chose "Edit in a card". Bears on US-01.3.6 and
   US-12.1.4.
8. **Patients is a tab of People.** Its list has three filters: Coming up (the default), Needs
   follow-up and All. Needs follow-up is one list of every patient needing the office (a balance
   warning, a follow-up due, details that differ), with the reason on each row; the row opens the
   patient's page, where the action is taken. The patient's page has the same pattern as the others:
   the NHI beside the name, and the patient's details in the side panel with their own Edit. Donald
   chose "One list with a reason". Bears on US-11.1.1, US-11.3.1 and US-11.3.3.
9. **Rows waiting for an NHI are shown on Intake.** A booking received without an NHI has no patient
   record yet; its row waits on Intake beside the unmatched rows, and Intake's attention count
   includes it. Donald chose "A tab on Intake". Bears on US-11.1.5.
10. **An anaesthetist can be made inactive from a chosen last day.** The office makes an anaesthetist
    inactive from their page, choosing their last day and giving a reason, when they leave the
    practice or stop taking Lists for a long time. It is refused while they hold a List after that
    day, and the office is shown those Lists to reassign. Until the last day nothing changes. After
    it they have no Slots, are not offered or picked for any List, can no longer sign in, and the
    Contracts held by their own Party and linked to them are disabled. Everything already recorded
    stays readable from their page. Donald chose "From a chosen date", "This may need a story
    attached", sign-in "No", and "Disable them with her". Bears on US-01.1.1, US-12.1.4, US-13.5.3
    and US-04.1.2.
11. **Making an anaesthetist active again offers their Contracts back.** The office can clear a last
    day before it comes. After it, making the anaesthetist active again gives them Slots from that
    day and sign-in back, and offers their disabled Contracts, each ticked and showing its price, to
    make active again. Donald: "Yes, restore." Bears on the inactive story and US-04.1.2.
12. **Considered and not built.** Patients as their own section beside People; a surgeon list
    grouped by specialty in an index pane; tabs of Lists and Contracts on a person's page for now;
    keeping surgeon groups as a label; Contracts offered to whoever is in a group; and making a
    surgeon group the same record as its Party. Bears on Notes only.

## Questions to raise

13. **Remittances after leaving (for AA).** An anaesthetist who has left can no longer sign in, yet
    payments for work done before their last day may arrive afterwards. How do they see those
    remittances and invoices? Bears on the inactive story and US-13.5.3.
14. **Surgeon groups (for AA and Greg).** Surgeon groups are removed as a record: a group that holds
    Contracts is a Party, and its surgeons are those linked on its Contracts. Does AA keep any list of
    who practises together that the office needs, beyond each surgeon's practice name? Bears on
    US-13.4.1 and US-13.6.2.
