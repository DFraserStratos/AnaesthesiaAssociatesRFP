# Requirements update, 2026-11-03: Ben's specialist list email

A small update from one email. Ben shared AA's list of Christchurch surgical specialists with
Vanessa. He asked for an electronic address book, and for the names and emails of practice managers
and PAs, which he does not hold. The list is the master list of surgeons and surgeons' rooms that
FT-13.6 was waiting for.

The main changes:

- **Practice manager and PA contacts:** a new story, US-13.6.5, waiting on whether a contact belongs
  to the room or to the surgeon (OQ-127).
- **Address book:** FT-13.6 names Ben's wish for an electronic address book, "perhaps" in
  the new system (OQ-126).
- **Specialty** is a recommendation in the surgeon profile's notes, not an agreed field.
- **Four new questions:** OQ-126 to OQ-129.

## 1. Inputs

- Note: [Ben's specialist list email](../notes/2026-11-03-ben-specialist-list-email.md), artifact
  [AR-53](../artifacts/AR-53.md). The email is quoted in full in the note.
- The spreadsheet is not filed in the catalogue because it names real people. A fictional copy with
  the same shape is kept for reference at
  `docs/discovery-reference/Other docs/Christchurch_Specialists_fictional.xlsx`. It is not an artifact.

## 2. Questions

None answered. No question files changed in the repo before this run.

## 3. Items changed, added, retired and moved

| Item | Title | Change | Sources |
| --- | --- | --- | --- |
| [FT-13.6](../stories/FT-13.6.md) | Surgeons and surgeons' rooms | Names the address book wish (OQ-126) and says where PA contacts belong is open (OQ-127). Ben shared the master list with Vanessa on 3 November. | Notes 2026-11-03 · Ben specialist list email #1 #2 #4 |
| [US-13.6.1](../stories/US-13.6.1.md) | Surgeons' rooms master record | Notes: 4 surgeons at two practices (OQ-128). Most practices give one shared inbox, 16 give none, and one has a PA per surgeon (OQ-127). A room may load with no email or phone. No AC change. | #6 #7 #8 |
| [US-13.6.2](../stories/US-13.6.2.md) | Surgeon profile | Notes: the list has no HPI CPNs (OQ-129); recommendation to hold specialty; a surgeon's own email (OQ-127). | #5 #9 |
| [US-13.4.3](../stories/US-13.4.3.md) | Reference data loaded at cutover | Notes: the list arrived and Ben expects inaccuracies. Whether rows without an HPI CPN or a full name can be loaded is OQ-129. | #1 #3 #9 #10 |
| [US-13.6.5](../stories/US-13.6.5.md) **new** | Practice manager and PA contacts | Admin staff record practice managers and PAs with a name and an email. Open (2), waiting on OQ-127; from Ben's wish, nothing agreed. | #4 #6 #7 |

Nothing was retired or moved. `domain-model.md` is unchanged, because nothing in the model is
settled yet: one room per surgeon stays the recommendation until OQ-128 is answered.

## 4. New questions

| Question | Title | Owner | Affects |
| --- | --- | --- | --- |
| [OQ-126](../questions/OQ-126.md) | An address book of surgeons in the system | Donald to ask Ben | FT-13.6, US-13.6.1, US-13.6.2 |
| [OQ-127](../questions/OQ-127.md) | PA contacts by room or by surgeon | Donald to ask Vanessa | US-13.6.5, US-13.6.1, US-02.3.3, US-11.1.5, US-13.6.2 |
| [OQ-128](../questions/OQ-128.md) | A surgeon at more than one room | Donald to ask Vanessa | US-13.6.1, US-13.6.2 |
| [OQ-129](../questions/OQ-129.md) | HPI CPNs for the starting surgeon list | Donald to ask Vanessa | US-13.6.2, US-13.4.3 |

## 5. Points with no requirement change

None. Each of points 1 to 10 shaped an item or a question.

## 6. Left for Donald

- An independent reviewer checked the edits. Its fixes were applied: FT-13.6 and US-13.6.5 no longer state the wish as decided, specialty moved to notes, and OQ-127 gained a surgeon's own email.

- The `link-requirements` workflow was not run for this small update. The new story links its
  neighbours by hand.
