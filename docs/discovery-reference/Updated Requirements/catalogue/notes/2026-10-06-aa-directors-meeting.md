# AA directors meeting, 2026-10-06

- **Who:** Ben (AA principal), Nick and Rob (AA), Greg (RFP author, Peritia) and Donald Fraser
  (Stratos).
- **Covered so far:** what happens to the balance after a prepaid Procedure when the final fee
  differs from the prepayment (OQ-61, which the 2026-10-02 meeting left for Ben); and the directors'
  answers to the other questions in section 10 of the pricing guide *How procedures are priced and
  who pays* (modifiers, the prepaid amount, seeing the prepaid amount, contract terms, group
  prices), with Donald's expansion of each and of the prepaid-balance answer (points 3 to 11). More
  points from this meeting are to come and will be appended here.
- **Inputs gathered here:** the question and Ben's answer as Donald pasted them from a separate
  document on 2026-10-07, with Donald's clarification typed the same day; the short answers Donald
  recorded under section 10 of the guide's Word version,
  [How procedures are priced and who pays.docx](<../../../Pricing model/How procedures are priced and who pays.docx>)
  (the 5 October PDF, [AR-28](../artifacts/AR-28.md), has the questions without the answers); and
  Donald's typed message of 2026-10-07, which repeats each question and answer and expands them.
  The guide itself is recorded in Notes 2026-10-07 · Pricing model documents.

Cite a point as `"Notes 2026-10-06 · AA directors meeting #n"`. Points are numbered once across the
whole note. Ben's and Donald's wording is kept (spelling fixed).

## Questions answered

1. **After a prepaid Procedure, no automatic invoice or credit (answers OQ-61).** The question put to
   Ben: "After a prepaid procedure. Is it right that by default nothing more is billed, that the
   anaesthetist can raise the price and have the difference invoiced, and that nothing is refunded if
   the work was less?" Ben: "By default, if the outcome of the procedure is that the pre-paid amount
   is too low or too high, then the system will not automatically invoice. Anaesthetists can / must
   create any ad-hoc invoices or credit notes as needed." No threshold is involved: the system raises
   nothing in either direction.
3. **Modifiers: only the ones that cannot be removed are applied; all else optional.** Guide §10
   question 1: "Modifiers. Should the system ever add modifier units automatically, or only show the
   RVG guidance and let the anaesthetist choose? Would the page 12 guidance be useful in the app?"
   The answer in the .docx: "Some RVGs will include modifiers which can't be removed (Age)" and "All
   else are optional". So the system applies a modifier only where it cannot be removed: age, which
   comes from the patient, and (Donald's expansion, point 8) a modifier already included in an RVG
   code's base units. Every other modifier is the anaesthetist's choice. This settles the guide's §7
   proposal (Ben: "The system never adds modifiers on its own"), with those two exceptions. The
   answer does not mention the ASA grade: the guide says the earlier pre-filling "from the patient's
   ASA grade and from defaults on each procedure" would be dropped "if the directors agree with Ben";
   whether ASA pre-fill is now dropped is not stated (to confirm). The "page 12 guidance" half is not
   answered in the .docx; Donald's request for a file of every RVG modifier (point 8) is the nearest.
   No open question asks this; OQ-38 (two modifier units in the prepayment estimate) is a different
   matter, made moot by point 4.
4. **Prepaid amount: the anaesthetist's own fixed-price contract (replaces OQ-04's answer).** Guide
   §10 question 2: "Prepaid amount. Should each anaesthetist keep their own price list for prepaid
   procedures, or should the system estimate the fee from units at their own rate?" The answer in the
   .docx: "Anaesthetist will create and manage their own fixed price contracts." This is option (a)
   of the guide's §6 "Not yet decided" and of the technical design's §10. OQ-04's board answer, "Base
   + time + 2 mod * anaesthetist's unit value", is option (b), the estimate, and is replaced. OQ-38
   (two modifier units always added to the prepayment estimate) loses its subject now the amount is
   not an estimate. OQ-25's answer (no Pre-paid Contract category) stands alongside: each anaesthetist
   still chooses which procedures or RVG groups are prepaid (guide §6 "Already agreed"); the amount
   now comes from their own contract. Not said: what amount applies when a procedure the anaesthetist
   has marked prepaid has no price in their own contract. Donald's expansion is point 9.
5. **The anaesthetist sees the prepaid amount.** Guide §10 question 4: "Seeing the prepaid amount.
   Should the anaesthetist see the prepaid amount on the card when recording their units?" The answer
   in the .docx: "Anaesthetists want to view the amount that has been pre-paid." Donald's typed
   version adds where: "Anaesthetists want to view the amount that has been pre-paid on a booking."
   This settles the guide's §6 "Not yet decided" point in favour of showing it, over Greg's view
   there that "clinical work should be kept apart from billing work". The technical design lists it
   open (§14). No open question asks this.
6. **Contract terms: some contracts have a fixed rate, some a fixed discount (bears on OQ-89 and
   OQ-20).** Guide §10 question 5: "Contract terms. Do all current contracts work on either RVG units
   or a fixed price per procedure? Is there any contract with a special unit rate or a percentage
   discount?" The answers in the .docx: "Some contracts DO have a fixed rate contract." and "Some
   contracts do have a fixed discount contract. (Price override)". This overturns the technical
   design's premise that "AA uses only RVG pricing and fixed prices today" (design §13, which keeps
   the contract rate and contract discount "dormant"); the guide's §2 and §5 tables likewise know
   only RVG pricing and fixed prices. It agrees with OQ-20's answer
   ("If nib wants special rates, there will be nib contracts"). Donald's expansion (point 11) answers
   OQ-89 questions 1 and 2 in effect; OQ-89 question 3 (time bands, add-ons and quantity rules on
   fixed-fee schedule lines) is not addressed, so OQ-89 stays partly open.
7. **No group prices.** Guide §10 question 6: "Group prices. Does any contract set one price for a
   whole RVG group rather than per procedure?" The answer in the .docx: "NO". Every contract price is
   per procedure. This matches the technical design, where a contract line for a whole RVG group is
   allowed by the structure but "None are known today" (§3, §13 dormant). No open question asks this.

## Donald's notes

2. **Manual invoices and credit notes, never automatic.** Donald, clarifying point 1: "There is no
   automatic credit or additional invoice. The system will allow users to manually create them if
   needed." This replaces the earlier reading that a prepayment above the final fee is never refunded:
   a credit note can now be raised by hand.
8. **Locked modifiers: age, and those the base units already include.** Donald, expanding question 1
   (typed 2026-10-07): "Some RVGs will include modifiers which can't be removed. E.g. age based on the
   patient. Some RVG codes from the RVG guide note when there are modifiers pre-included in the base
   units. For example, Neurosurgery. '*These Base Units include Loading for Prone Positioning if
   needed*' (+2). In the codes under the neurosurgery RVG codes, so for example H7A or H7B, the base
   units are 10, but they will include a prone positioning, which means that the prone positioning
   modifiers from the modifiers section of the RVG should show up for the anaesthetist on their
   booking already selected with a value of 0 in a way that means it can't be turned off. This is to
   communicate to the user that you couldn't accidentally re-add in a prone positioning modifier
   because those modifiers have already been pre-applied via the base units." Then: "All else are
   optional." And: "Now might be a good time to read the RVG guide and build a file with all of the
   modifications" (the file is recorded in Notes 2026-10-07 · Pricing model documents #42 to #45).
   - **Sources disagree on the base units.** The RVG prints H7A at 10 and H7b at 12 base units (the
     prone, park bench or sitting variant is 2 above, which is where the +2 shows), so "the base
     units are 10" holds for H7A only; the rule (the prone modifier P1 shown at 0 and locked) applies
     to both, and to the Spine codes, whose base units the RVG also says include prone loading (the
     modifiers file).
   - **This reverses the 2026-10-02 reading.** On 2 October Donald said "The modifiers are never
     included in the base. They are separate things, and this 'absorbing modifiers' is wrong", and a
     procedure's default modifiers were to be pre-filled so the anaesthetist "can untick it if they
     wanted to" (Notes 2026-10-02 · AA booking and pricing review with Greg #45). Now a modifier the
     RVG says is in the base units is shown selected, at 0, and cannot be turned off; the 2 October
     untickable pre-fill is not mentioned.
9. **The prepaid amount comes from first-party contracts.** Donald, expanding question 2: "Anaesthetist
   will create and manage their own fixed price contracts. These are understood as first party
   contracts. Artifact AR-02 gives some examples of this." AR-02's first-party panel
   ([AR-02#first-party](../artifacts/AR-02.md)) reads "First party · Anaesthetist", "Their own
   bookings only", "An anaesthetist's own price list, for example for prepaid cosmetic work", with the
   example "Dr B. Smith · Face lift", a fixed price of $3,200, price change "Yes, with reason", billed
   to the patient. New here: the anaesthetist, not only the office, creates and maintains these
   contracts.
10. **No calculation on prepaid or fixed-cost contracts, an honour system on reassignment, and the
    by-hand exception (7 October expansion of question 3; bears on OQ-61, OQ-03, OQ-70, OQ-76).** The
    .docx's short answer to question 3: "Anaesthetists can create any ad-hoc invoices or credit notes
    as needed." Donald, typed 2026-10-07:
    - "By default, when a prepaid procedure is paid for, the system will not automatically try to
      issue a credit or raise another invoice if some subsequent BTM calculation might create a number
      that is higher or lower than what was prepaid. This is to say the system should not try and
      calculate anything additional on a prepaid or on a fixed cost contract." This extends points 1
      and 2 from prepaid procedures to every fixed-cost contract.
    - "If a procedure is prepaid, and that procedure moves to another anaesthetist, there is
      essentially an honour system where the new anaesthetist also does not try and claim any more
      for the procedure than what was already prepaid. So that there is stability for the patient. So
      once again, the system should not try and have any logic to detect any of these flows that
      would re-trigger any sort of calculations for invoices. It is simply not something the system
      supports." This agrees with OQ-03's and OQ-70's answers (the new anaesthetist keeps the agreed
      amount). **In tension:** OQ-70's answer also has "the draft payable pair is updated to the new
      anaesthetist" (Greg: the pair must be amended "because the trust account in Xero always has to
      balance"), which is system action on the move; whether that update survives "no logic to detect
      any of these flows" is not said.
    - "Because of the messy nature of the health system, the exception to everything I've just said
      is that there are times when a prepaid procedure is expected to go for an hour and for whatever
      reason only half of the work is done, or for whatever reason the procedure takes an incredibly
      longer amount of time. In these situations the anaesthetist can optionally choose to generate
      any ad hoc invoices or credit notes as they need to. This is hooking into the already
      established and defined ability to create additional invoices on a procedure." As in Ben's
      answer (point 1), the anaesthetist raises them, not only the office. This answers the "Another invoice?" half of
      OQ-76 (by hand, never automatic).
    - Floated and not adopted: the guide's §6 proposal that "the anaesthetist can raise the price. The
      difference is invoiced to the patient as an extra invoice", and the technical design's §10
      settlement proposal (an increase billed as an additional invoice, no refund if lower). The
      guide's "If the work turns out to be less than expected, nothing is refunded" is also overtaken:
      a credit note can be raised by hand.
11. **Fixed rate and fixed discount contracts.** Donald, expanding question 5: "Both of these types of
    contracts are an alternative fixed rate or a fixed discount. These are both new. The fixed rate
    will obviously still use the RVG BTM units, but it would be multiplying it by a fixed rate as
    opposed to the anaesthetist rate. And the contracts with a fixed discount, similarly, this would
    be a pre-applied price override that the anaesthetist could not edit. So the example would be
    it's the standard BTM unit calculation for the anaesthetist multiplied by their rate, but then in
    the part of the application where you see the price override it would be visible, but you would
    see that there would already be an applied price override for the procedure. And it might be a
    discount of 10%."
    - The fixed rate reads as the answer to OQ-89 questions 1 and 2: a unit rate in place of the
      anaesthetist's own, applied to the procedure's BTM units (one basis, for the whole procedure,
      not a separate billing line).
    - The fixed discount is calculated on the anaesthetist's own rate and shown, locked, where the
      price override is.
    - Not said: whether the anaesthetist can add a discount or price of their own on top of a fixed
      discount, and whether the office can still override (the technical design §4 lets the office
      override any price at review).
