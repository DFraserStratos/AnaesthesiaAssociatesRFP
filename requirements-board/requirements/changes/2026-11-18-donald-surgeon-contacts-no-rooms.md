# Requirements update, 2026-11-18: surgeon contacts on the surgeon, no surgeons' room record

Donald decided, working through OQ-127 and OQ-128, that the system keeps no record of surgeons' rooms
for now. Rooms were never needed for the app to work: Lists arrive with their sender known, and a
surgeon is identified by their HPI CPN, not their practice. The decision is Donald's, for the build,
and not yet confirmed by AA, so the changed stories sit at Verify.

The main changes:

- **No surgeons' room record.** [US-13.6.1](../stories/US-13.6.1.md) (Surgeons' rooms master record) is
  Retired, and [FT-13.6](../stories/FT-13.6.md) is retitled "Surgeons".
- **Contacts on the surgeon** ([US-13.6.5](../stories/US-13.6.5.md), retitled "Surgeon contacts"): one
  personal contact and one or more office contacts, each with a name, email and phone. The form always
  shows one set of office contact fields; a plus button adds a set, a minus button on an extra set
  removes it. The practice name is plain text on the [surgeon profile](../stories/US-13.6.2.md).
- **A List keeps where it came from** ([US-02.2.4](../stories/US-02.2.4.md), new): a surgeon's rooms'
  PDF with the address it arrived from, the hospital's list, or entry by hand.
- **The office's emails go back to the sender** ([US-02.3.3](../stories/US-02.3.3.md),
  [US-11.1.5](../stories/US-11.1.5.md)): the update email and the missing NHI request go to the List's
  sender address, otherwise to the surgeon's first office contact with others offered, never to every
  contact.

In all, 7 items changed, 1 was added and 1 retired. Two questions were answered or superseded (OQ-127,
OQ-128). The domain model was updated, and the note was registered as AR-67.

## 1. Inputs

- Note: [Donald surgeon contacts no rooms](../notes/2026-11-18-donald-surgeon-contacts-no-rooms.md),
  artifact [AR-67](../artifacts/AR-67.md), 11 points. Cited as "Notes 2026-11-18 · Donald surgeon
  contacts no rooms #n".
- Donald's answers to OQ-127 typed on the board, and his replies in a question-and-answer session with
  Claude; nothing recorded or transcribed.
- Board answers: the repo still has uncommitted rewrites of 14 other questions (OQ-12, OQ-13, OQ-29,
  OQ-47, OQ-60, OQ-73, OQ-83, OQ-95, OQ-97, OQ-102, OQ-109, OQ-114, OQ-125, OQ-126) from another
  session. They are not part of this update and were left untouched.

## 2. Questions answered

| Question | Answer | Points |
| --- | --- | --- |
| [OQ-127](../questions/OQ-127.md) PA contacts by room or by surgeon | On the surgeon: one personal and one or more office contacts, entered by AA's admins; the surgeon's own email is the personal contact; emails go to the List's sender address, else the first office contact; part 5 no longer arises. Set to Answered (4). | #1 to #5 |
| [OQ-128](../questions/OQ-128.md) A surgeon at more than one room | Already Answered (4 November); superseded: surgeons are not attached to rooms. | #5, #6 |

## 3. Items changed, added, retired or moved

| Item | Title | What changed | Sources |
| --- | --- | --- | --- |
| [FT-13.6](../stories/FT-13.6.md) | Surgeons (was "Surgeons and surgeons' rooms") | Theme rewritten without rooms. | #6, #7 |
| [US-13.6.1](../stories/US-13.6.1.md) | Surgeons' rooms master record | Retired (3 to 6), with a Notes line saying where its parts went. | #6 |
| [US-13.6.2](../stories/US-13.6.2.md) | Surgeon profile | Rooms replaced by the practice name as plain text and the surgeon's contacts; two acceptance criteria added. | #6, #7, #8 |
| [US-13.6.5](../stories/US-13.6.5.md) | Surgeon contacts (was "Practice manager and PA contacts") | Rewritten: personal and office contacts, the plus and minus form; Open (2) to Verify (3). | #1, #3, #4, #7 |
| [US-02.2.4](../stories/US-02.2.4.md) | A List keeps where it came from | New, under FT-02.2, at Verify (3). | #6, #9, #10 |
| [US-02.3.3](../stories/US-02.3.3.md) | Draft a booking update email | To address: the List's sender address, otherwise the surgeon's first office contact, never more than one; one criterion rewritten, one added. | #10, #11 |
| [US-11.1.5](../stories/US-11.1.5.md) | Intake rows waiting for an NHI | Who to chase and the request's address follow the same rule; one criterion rewritten, one added. | #10, #11 |
| [US-13.4.1](../stories/US-13.4.1.md) | Maintain reference tables | Surgeons' rooms dropped from the list. | #6 |
| [US-13.4.3](../stories/US-13.4.3.md) | Reference data loaded at cutover | "Surgeons and surgeons' rooms" becomes "surgeons, with their practice names". | #6, #8 |
| [domain-model.md](../domain-model.md) | Surgeon section, List section, ER diagram, the surgeon and update-email summary rows, reference data, glossary | No room record; SURGEON_CONTACT and LIST_ORIGIN in the diagram; a List's origin; the email rule. | #6 to #11 |

## 4. New questions

None. Two smaller choices are left open in the stories' Technical discussion: whether a contact needs
at least one field filled or a practice label (US-13.6.5), and which address a List keeps when a later
PDF arrives from a different one, and whether a List made from a recurring booking records an origin
(US-02.2.4). Whether the cutover load fills office contacts from the practice emails in Ben's list,
and whether a surgeon at two practices has a PA at each, are noted on US-13.6.5.

## 5. Points with no requirement change

- #1 to #5 record the board answers; their requirement changes are under points 6 to 11.
- [OQ-126](../questions/OQ-126.md) (address book) still says the room master data holds each surgeon's
  room. It is one of the 14 questions with uncommitted edits from another session, so it was left alone;
  its wording should be updated when that session's work is recorded.

## 6. For the next update

- The prototype built surgeons' rooms, more than one room per surgeon and room contacts in Phases 17
  and 17a. `/update-build-plan` should plan unwinding them: contacts on the surgeon with the plus and
  minus form, the practice name as text, the List's origin and sender address, and the email To rule.
- Still worth asking Vanessa: whether a surgeon at two practices has a PA at each, or one for both.
- Screenshot captions on US-13.6.2, US-13.6.5 and US-13.4.1 still describe rooms. The capture recipes
  write them, so they change when the prototype's rooms are removed and the screens are captured again.
