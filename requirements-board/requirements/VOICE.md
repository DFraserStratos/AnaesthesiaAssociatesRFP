# How requirements are written

The voice of this catalogue. Every skill that writes or rewords a requirement, question or note
follows it, and so should anyone editing by hand. The file format (frontmatter, section headings,
links) is in `SCHEMA.md`; this file is about the words.

## Titles

- A short name in sentence case: "Record a cancellation", "Two Slots per anaesthetist per day".
- Name the thing or the action, not the screen or the ticket: no "As a...", no "Feature:", no IDs.

## Which cards hold requirements

- **Stories are the only cards that hold requirements.** Every rule, behaviour and acceptance
  criterion lives in a story.
- **Epics and features give the broad theme** of what sits under them, and why it matters: a short
  paragraph or two. They do not list or summarise their stories one by one, and they carry no
  rules, detail or acceptance criteria. A reader opens the stories for the detail.

## The description

The description says what the system does, as if it had always worked this way. A new developer,
or someone at AA, should understand it without knowing any of the history behind it.

- **Open with who or what acts, and what happens**, in the present tense: "The anaesthetist can see
  which Contract applies to each Procedure...", "The Scheduling Engine records a cancellation...".
  A person by their role, the system by its component's name. One to three sentences.
- **Then why, in its own paragraph**, usually one sentence starting "This is so...".
- **Then only the rules that are requirements**: edge cases and exceptions in short paragraphs or
  bullets.
- Not the "As a ..., I ..., so that ..." template.
- Plain language. One idea per paragraph, a blank line between paragraphs, and bullets instead of
  long comma chains.
- Say what is true, not what "should" or "will" happen: "The cancelled Booking is never removed",
  not "The system should not remove...".

What never goes in a description:

- **History**: what the story replaces, what an earlier model did, what was retired or reversed.
- **Who said or decided what**: names, dates, meetings, quotes, decision numbers ("D4").
- **Provenance markers**: "(our reading)", "(AR-58 A14)", "(Notes 2026-11-05 #3)". The sources list
  says where a requirement came from. When part of a story is our reading rather than a decision,
  say so in one line in Notes, e.g. "Our readings (contract model proposal): a Procedure keeps a
  Disabled Contract (A14)."
- **Update paragraphs**: when a decision changes a story, rewrite the description so it reads as
  current. Never add an "Update" paragraph or layer new text over old.

### The model to follow

US-01.1.6, Out-of-hours Lists:

> An admin can create an out-of-hours List: a List after the PM session, for any specialty,
> created on the day if need be. Like any List it has an anaesthetist, surgeon, hospital and day,
> and it has its own start time. The anaesthetist sees it on their day after their AM and PM
> Lists, and its Bookings are recorded and billed as on any other List.
>
> This is so emergency and late cases are booked and billed through Lists like everything else.

Its Notes hold the rest: that AA accepted it and when, Vanessa's and Ben's words in the meeting, and
which part is our reading. Its Technical discussion holds what is still to design.

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
  they matter. Keep the speaker's wording; fix spelling and drop filler. This is also where the
  history goes, briefly, and the one line of "our readings". Keep it short: Notes explain the
  story, they are not a log of every discussion.

## Questions

- The title is the question's subject in a few words; the body asks it plainly and says what
  hangs on the answer.
- An answer says what was decided, by whom and when, in the decider's words where possible.
