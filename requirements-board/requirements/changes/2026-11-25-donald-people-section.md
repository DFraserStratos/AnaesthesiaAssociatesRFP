# Requirements update, 2026-11-25: the People section of the Admin app

Donald decided how the office keeps and reads its records about people. Anaesthetists, surgeons,
specialties and patients become one People section of the Admin app, which takes the place of the
Patients section. Every record gets a page of its own. Surgeon groups are cut, and an anaesthetist can
now be made inactive from a chosen last day. The Contract model, Parties (the surgeon group kind
included) and pairings are unchanged. The decisions are Donald's, for the build, and not yet seen by
AA or Greg, so every story whose requirements changed is at Verify; link-only edits and the two feature themes keep their status.

The main changes:

- **People is its own section** ([US-13.4.1](../stories/US-13.4.1.md)). It has Anaesthetists, Surgeons,
  Specialties and Patients tabs. Reference data now sits in three places: Master data, the Contracts
  section and People. Each People list is searched, filtered and paged.
- **A page for each record.** The anaesthetist's page is
  [US-12.1.4](../stories/US-12.1.4.md), the surgeon's [US-13.6.2](../stories/US-13.6.2.md), the
  specialty's [US-13.4.4](../stories/US-13.4.4.md) and the patient's
  [US-11.1.1](../stories/US-11.1.1.md). Each page's cards are edited and saved one at a time, each save
  one audited change. A side panel shows pairings, the Contracts linked to the person and their next
  Lists.
- **Surgeon groups are cut** as a record. A group that holds Contracts is a Party, and its surgeons are
  the ones linked on its Contracts ([US-13.4.1](../stories/US-13.4.1.md),
  [US-13.6.2](../stories/US-13.6.2.md), the domain model).
- **The priority tier is edited in a card** with the rate per unit, never by a single click
  ([US-01.3.6](../stories/US-01.3.6.md)).
- **Patients are a tab of People.** It has Coming up, Needs follow-up and All filters; Needs follow-up
  is one list with a reason on each row ([US-11.3.1](../stories/US-11.3.1.md),
  [US-11.3.3](../stories/US-11.3.3.md)).
- **Rows waiting for an NHI are shown on Intake** ([US-11.1.5](../stories/US-11.1.5.md),
  [US-11.1.4](../stories/US-11.1.4.md), [US-02.1.4](../stories/US-02.1.4.md)).
- **Make an anaesthetist inactive** ([US-12.1.6](../stories/US-12.1.6.md), new). The office sets a last
  day and a reason. After that day the anaesthetist has no Slots and no sign-in, and their own
  Contracts are disabled. Making them active again offers those Contracts back
  ([US-04.1.2](../stories/US-04.1.2.md), [US-13.5.3](../stories/US-13.5.3.md),
  [US-01.1.1](../stories/US-01.1.1.md)).

In all, 16 items changed and 1 was added. Two questions are new. The domain model gained an active and
inactive anaesthetist and lost the surgeon group record. The note is registered as AR-70.

## 1. Inputs

- [Notes 2026-11-25 · Donald people section](../notes/2026-11-25-donald-people-section.md) (AR-70):
  Donald's typed decisions, on a design worked through in three passes. The design pages are
  `docs/explorations/people-section.html` and, for the first pass, `docs/explorations/people-ideas.html`.
  They are not catalogue artifacts.
- A check of the prototype and the catalogue for everything that reads a surgeon group (note #6).

## 2. Questions answered

None.

## 3. Items changed or added

| Item | Title | What changed | Sources (#n) |
| --- | --- | --- | --- |
| [US-13.4.1](../stories/US-13.4.1.md) | Maintain reference tables | Rewritten: three places (Master data, Contracts section, People); surgeon groups no longer kept; People lists searched, filtered, paged; a page per record, card by card | #1 #2 #5 #6 |
| [US-13.6.2](../stories/US-13.6.2.md) | Surgeon profile | Rewritten: a page per surgeon in People, cards edited one at a time, side panel (pairings, Contracts, next Lists); Surgeons list search and specialty filter; no groups | #1 #2 #3 #5 #6 |
| [US-13.4.4](../stories/US-13.4.4.md) | Specialties | On People's Specialties tab; a page per specialty with its surgeons and Contracts | #1 #4 |
| [US-13.5.3](../stories/US-13.5.3.md) | Sign in to the anaesthetist app | No sign-in after an inactive anaesthetist's last day; back if made active again | #10 #11 |
| [US-12.1.4](../stories/US-12.1.4.md) | Anaesthetist identity, contact and bank details | Rewritten: a page per anaesthetist keyed by registration number; cards one at a time; rate and tier in one card; side panel | #1 #2 #3 #7 |
| [US-12.1.6](../stories/US-12.1.6.md) | Make an anaesthetist inactive | New, under FT-12.1 | #10 #11 |
| [FT-12.1](../stories/FT-12.1.md) | Profile settings | Theme: kept on the anaesthetist's page from joining to leaving; Admin App added | #2 #10 |
| [US-04.1.2](../stories/US-04.1.2.md) | Create, edit and disable Contracts | An inactive anaesthetist's own Contracts are disabled once the last day has passed and offered back on return; one criterion | #10 #11 |
| [US-01.3.6](../stories/US-01.3.6.md) | Anaesthetist priority tiers for assignment | Tier edited in a card with the rate, Edit then Save; the Anaesthetists list filters by tier | #7 |
| [US-01.1.1](../stories/US-01.1.1.md) | Two Slots per anaesthetist per day | "Active" links to US-12.1.6; status kept | #10 |
| [US-11.1.1](../stories/US-11.1.1.md) | Patient record keyed on NHI | A page per patient in People keyed by NHI, details in the side panel; details that differ held for review (our reading of the existing build) | #1 #2 #8 |
| [US-11.3.1](../stories/US-11.3.1.md) | Patient outstanding bills view | The Patients tab: Coming up, Needs follow-up, All; searched and paged | #1 #2 #8 |
| [US-11.3.3](../stories/US-11.3.3.md) | Follow-up tools | Needs follow-up as one list with a reason per row; its count is People's attention count | #1 #8 |
| [US-11.1.5](../stories/US-11.1.5.md) | Intake rows waiting for an NHI | Shown on their own Intake tab beside the unmatched rows; counted in Intake's attention count | #9 |
| [US-11.1.4](../stories/US-11.1.4.md) | Patient without NHI | Waiting at intake, shown with the rows waiting for an NHI; history moved to Notes | #9 |
| [US-02.1.4](../stories/US-02.1.4.md) | Unmatched queue | A row with no NHI waits at intake, shown beside the unmatched rows | #9 |
| [FT-11.1](../stories/FT-11.1.md) | Patient record | Theme: each patient record has a page; status kept | #1 #2 |
| Domain model | | A surgeon group exists only as a Party; active and inactive anaesthetists with a last day | #6 #10 #11 |

## 4. New questions

- [OQ-147](../questions/OQ-147.md) How an anaesthetist who has left sees later remittances (#13).
- [OQ-148](../questions/OQ-148.md) Whether AA needs any record of surgeons who practise together (#14).

## 5. Points with no requirement change

- #1, the side nav position (where Patients was): a design detail of the Admin app; no story holds the
  side nav's order.
- #12, the items considered and not built: kept in the note; the stories' Notes mention the ones that
  touch them (record tabs in US-12.1.4, Patients as their own section in US-11.1.1).
- Removing a specialty that is still held by a surgeon or Contract: the catalogue has never said what
  happens, and this run adds no rule; the prototype refuses it.
- FT-13.4 and FT-13.6: read, and still accurate as themes.
- Screenshot captions that now describe the old screens (US-13.4.1's surgeon group and Master data
  captions, US-13.6.2, US-13.4.4, US-11.1.1, US-11.1.5, US-02.1.4, and US-12.1.1's "Anaesthetists in
  Master data"): left for the owner's sweep, which recaptures them.

## 6. Links

The link pass over EP-01, EP-11, EP-12 and EP-13 applied 12 links across 10 files. Seven were text
links: "rate per unit" to US-12.1.1, "anaesthetist's page" to US-12.1.4, "People section" to US-13.4.1,
"update email" to US-02.3.3, "availability finder" to US-01.4.2, "Disabled" to US-04.1.2 and "weekly
payment run" to US-10.2.7. Five were related links: to US-01.1.1, US-01.2.1, US-01.6.2, US-06.3.5 and
US-11.2.1. The batches rejected 22 other proposals as repeats or as over the link cap.
