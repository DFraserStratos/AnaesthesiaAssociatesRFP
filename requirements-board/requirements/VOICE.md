# How requirements are written

The voice of this catalogue. Every skill that writes or rewords a requirement, question or note
follows it, and so should anyone editing by hand. The file format (frontmatter, section headings,
links) is in `SCHEMA.md`; this file is about the words.

## Titles

- A short name in sentence case: "Record a cancellation", "Two Slots per anaesthetist per day".
- Name the thing or the action, not the screen or the ticket: no "As a...", no "Feature:", no IDs.

## The description

- **Open with who or what acts, and what happens**, in the present tense: "The anaesthetist can see
  which Contract applies to each Procedure...", "The Scheduling Engine records a cancellation...".
  A person by their role, the system by its component's name.
- **Then why, in its own paragraph**, usually starting "This is so...".
- Not the "As a ..., I ..., so that ..." template.
- Plain language. One idea per paragraph, a blank line between paragraphs, and bullets instead of
  long comma chains.
- Say what is true, not what "should" or "will" happen: "The cancelled Booking is never removed",
  not "The system should not remove...".
- Edge cases and exceptions get their own short paragraph after the main behaviour.

## Words

- Use the catalogue's own terms, capitalised as the domain model has them (Booking, List, Contract,
  Procedure, Slot); `domain-model.md` has the glossary. Never an older or retired term.
- Link the words that name another item (`[refund a prepayment on cancellation](US-06.5.2)`), not a
  whole sentence, and never reword a sentence to fit a link. A bare `OQ-nn` in brackets points at
  the open question a sentence depends on.

## Acceptance criteria

- One criterion per bullet, opening with a short bold label: "**Automated cancellation.** Given a
  cancellation arrives from an integration, when it is applied, then the Booking is marked
  cancelled and stays visible on its List."
- Given/When/Then where it helps; a plain sentence where it doesn't.
- Each one testable: something a person could check on a screen or in a record.

## Technical discussion and notes

- **Technical discussion:** how it might be built, and choices still open, not what the user sees.
- **Notes:** who said what and when ("Greg, 16 October: ..."), quoting people's own words where
  they matter. Keep the speaker's wording; fix spelling and drop filler.

## Questions

- The title is the question's subject in a few words; the body asks it plainly and says what
  hangs on the answer.
- An answer says what was decided, by whom and when, in the decider's words where possible.
