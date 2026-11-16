# Donald's decision: a payer on each Procedure, 2026-11-17

- **Who:** Donald Fraser (Stratos, product owner), in a question-and-answer session with Claude while
  reviewing the prototype's Booking screens. Greg and AA have not seen it yet.
- **Covered:** where the payer is held (each Procedure rather than the Booking), how a change to one
  Procedure's payer reaches the others, what a newly added Procedure starts with, how invoices and
  prepayments group by payer, a second person in a split, where the payer shows on a Booking, and the
  question for AA.
- **Standing:** Donald's decisions, made for the build. They are not yet confirmed by AA or Greg, so
  the items they change go to Verify, not Agreed, and point 11 asks AA to confirm.
- **Inputs gathered here:** Donald's answers, typed in the session, to options Claude put to him.
  Nothing was recorded or transcribed; the wording below is Donald's where quoted and a paraphrase of
  the option he chose otherwise.

Cite a point as `"Notes 2026-11-17 · Donald payer per procedure #n"`. Points are numbered once across
the whole note.

## Donald's decisions

1. **The payer is held on each Procedure.** Each Procedure holds its own payer, filled in from the
   patient; a "different payer" tick names someone else who pays, such as a parent, a guardian, a
   benefactor or a family trust. The payer is billed whenever that Procedure's Contract does not bill
   its holder. This replaces "Every Booking names a payer": two Procedures on one Booking can bill two
   different people. Donald: "as we've been designing the system, we've been trying to keep it open
   and flexible. And so actually, I don't hate your idea about having following Greg's design and
   having a single payer per procedure." Bears on FT-11.2, US-11.2.1, US-11.2.2, US-04.1.5 and every
   item that names the payer on the Booking.
2. **Changing one Procedure's payer offers to change the others.** When the payer on one Procedure is
   changed, the system offers to make the same change on the Booking's other Procedures that bill the
   same payer, each ticked by default; the user can untick any, and is never made to. Donald: "if
   they're both set to a patient payer and you edit one, it would be nice that the system would ask
   you if you wanted to edit the other, but you don't have to." Bears on US-11.2.2.
3. **A Procedure added later copies the payer.** A Procedure added to a Booking later (an extra
   procedure, or a post-op addendum) takes the payer of the Booking's Procedures that bill the payer
   when they all share one; otherwise it starts from the patient. Bears on US-11.2.2 and
   US-03.2.3.
4. **One invoice per payer.** Procedures on one Booking that bill the same payer (the patient, or a
   payer copied to them through point 2) share one invoice. A payer typed in separately is a different
   payer and has its own invoice; payers are never matched on name or email. Bears on US-08.1.1 and
   US-08.4.2.
5. **One prepayment invoice per payer.** Where prepaid Procedures on one Booking name different
   payers, each payer receives their own prepayment invoice, and each payer is locked once their own
   prepayment invoice is raised. Bears on FT-06.2, US-06.2.1, US-06.3.1 and US-06.5.1.
6. **A split can name another person.** Splitting one Procedure's fee can name another person as a
   party, with their own name, email or postal address, and the under-18 check (for example two
   separated parents sharing a fee), as well as the Procedure's payer, the Contract's holder and other
   parties. Age is known only for the patient ("Notes 2026-10-28 · AA meeting with Greg #35"), so
   the under-18 check applies to a share billed to the patient. Bears on US-08.2.3.
7. **The payer shows in the Procedure's "Paid by".** The payer is shown and changed in the "Paid by"
   line of a Procedure's billing details, and only where that Procedure's Contract bills the payer:
   the payer's name, their relationship and the two warnings ("Email or postal address needed",
   "Under 18"). The email and postal address are shown where the payer is changed. One place answers
   who pays and splits the fee. There is no separate payer section for the Booking as a whole: "the
   payer can still sit somewhere in the background on this booking, and it's only ever displayed
   should a procedure's billing card say that ... a payer is being billed rather than an
   organisation." Bears on US-11.2.2 and US-08.2.3.
8. **Before a Contract is chosen, the payer is "not billed yet".** A Procedure with no Contract yet
   shows its payer as not billed yet, since nothing decides yet whether the payer or a holder is
   billed. Bears on US-11.2.2.
9. **The contact rule and the child warning apply per Procedure.** The payer's email or postal
   address is required for each Procedure billed to a payer, and a patient under 18 left as the payer
   is warned on each such Procedure. Showing the warning on each Procedure is fine ("repeating the
   warnings is fine"); the dashboard to-do list holds one warning per Booking. Bears on US-11.2.3,
   US-11.2.4, US-13.7.1 and US-07.2.2.
10. **The insurer or funder stays on the Booking.** The insurer or funder and the approval number
    stay on the Booking and are not part of "Paid by": they never decide who is invoiced, so showing
    them beside who pays would suggest they do. Unchanged; recorded because the decision was checked
    against it. Bears on US-11.4.3.
11. **Ask AA to confirm.** Greg's technical design v6 held the patient's and an alternate payer's
    contact details on each booking procedure ("Notes 2026-10-16 · Pricing model documents v6 #29");
    the catalogue later held one payer on the Booking (OQ-54; "Notes 2026-10-28 · AA meeting with
    Greg #29 #30 #33"). Greg also said an event "is attached to the procedure, not to the booking...
    so it should use the procedure's details" ("Notes 2026-10-28 · AA meeting with Greg #31"). AA is
    to confirm a payer on each Procedure: whether two Procedures on one Booking ever need different
    payers, and whether offering the change to the other Procedures is right. Raised as a new open
    question.
