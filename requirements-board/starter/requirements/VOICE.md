# How requirements are written

The voice of this catalogue: change it to suit your project (on the board's Settings page, or here). Every skill that writes or rewords a requirement, question or note
follows it, and so should anyone editing by hand. The file format (frontmatter, section headings,
links) is in `SCHEMA.md`; this file is about the words.

## Titles

- A short name in sentence case: "Record a cancellation", "Two Pick Lists per warehouse per day".
- Name the thing or the action, not the screen or the ticket: no "As a...", no "Feature:", no IDs.

## Which cards hold requirements

- **Stories are the only cards that hold requirements.** Every rule, behaviour and acceptance
  criterion lives in a story.
- **Epics and features give the broad theme** of what sits under them, and why it matters: a short
  paragraph or two. They do not list or summarise their stories one by one, and they carry no
  rules, detail or acceptance criteria. A reader opens the stories for the detail.

## The description

The description says what the system does, as if it had always worked this way. A new developer,
or someone at the client, should understand it without knowing any of the history behind it.

- **Open with who or what acts, and what happens**, in the present tense: "The customer can see which Price list applies to each Order line...", "The Order Engine records a cancellation...". A person by their role, the system by its component's name. One to three sentences.
- **Then why, in its own paragraph**, usually one sentence starting "This is so...".
- **Then only the rules that are requirements**: edge cases and exceptions in short paragraphs or bullets.
- Not the "As a ..., I ..., so that ..." template.
- Plain language. One idea per paragraph, a blank line between paragraphs, and bullets instead of
  long comma chains.
- Say what is true, not what "should" or "will" happen: "The cancelled Order is never removed", not "The system should not remove...".

What never goes in a description:

- **History**: what the story replaces, what an earlier model did, what was retired or reversed.
- **Who said or decided what**: names, dates, meetings, quotes, decision numbers.
- **Provenance markers**: "(our reading)", "(Notes 2026-05-04 #3)". The sources list says where a
  requirement came from. When part of a story is our reading rather than a decision, say so in one
  line in Notes.
- **Update paragraphs**: when a decision changes a story, rewrite the description so it reads as
  current. Never add an "Update" paragraph or layer new text over old.

### The model to follow

> A dispatcher can add an evening Pick List: one after the day's last wave, created on the day if
> need be. Like any Pick List it has a picker, a zone and a day, and its own start time. The picker
> sees it after their day's other Pick Lists, and its Order lines are picked and shipped as on any
> other Pick List.
>
> This is so urgent late orders are picked and shipped through Pick Lists like everything else.

Its Notes hold the rest: who asked for it and when, their words, and which part is our reading.
Its Technical discussion holds what is still to design.

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
  they matter. Keep the speaker's wording; fix spelling and drop filler. This is also where the
  history goes, briefly, and the one line of "our readings". Keep it short: Notes explain the
  story, they are not a log of every discussion.

## Questions

- The title is the question's subject in a few words; the body asks it plainly and says what
  hangs on the answer.
- An answer says what was decided, by whom and when, in the decider's words where possible.
