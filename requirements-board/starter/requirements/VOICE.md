# How requirements are written

The voice of this catalogue: change it to suit your project (on the board's Settings page, or here). Every skill that writes or rewords a requirement, question or note
follows it, and so should anyone editing by hand. The file format (frontmatter, section headings,
links) is in `SCHEMA.md`; this file is about the words.

## Titles

- A short name in sentence case: "Record a cancellation", "Two Pick Lists per warehouse per day".
- Name the thing or the action, not the screen or the ticket: no "As a...", no "Feature:", no IDs.

## The description

- **Open with who or what acts, and what happens**, in the present tense: "The customer can see which Price list applies to each Order line...", "The Order Engine records a cancellation...".
  A person by their role, the system by its component's name.
- **Then why, in its own paragraph**, usually starting "This is so...".
- Not the "As a ..., I ..., so that ..." template.
- Plain language. One idea per paragraph, a blank line between paragraphs, and bullets instead of
  long comma chains.
- Say what is true, not what "should" or "will" happen: "The cancelled Order is never removed", not "The system should not remove...".
- Edge cases and exceptions get their own short paragraph after the main behaviour.

## Words

- Use the catalogue's own terms, capitalised as the domain model has them (Order, Order line, Price list, Pick List); `domain-model.md` has the glossary. Never an older or retired term.
- Link the words that name another item (`[refund a payment on cancellation](US-03.2.1)`), not a
  whole sentence, and never reword a sentence to fit a link. A bare `OQ-nn` in brackets points at
  the open question a sentence depends on.

## Acceptance criteria

- One criterion per bullet, opening with a short bold label: "**Automated cancellation.** Given a cancellation arrives from the web shop, when it is applied, then the Order is marked cancelled and stays visible in the day's list."
- Given/When/Then where it helps; a plain sentence where it doesn't.
- Each one testable: something a person could check on a screen or in a record.

## Technical discussion and notes

- **Technical discussion:** how it might be built, and choices still open, not what the user sees.
- **Notes:** who said what and when ("Sam, 16 October: ..."), quoting people's own words where
  they matter. Keep the speaker's wording; fix spelling and drop filler.

## Questions

- The title is the question's subject in a few words; the body asks it plainly and says what
  hangs on the answer.
- An answer says what was decided, by whom and when, in the decider's words where possible.
