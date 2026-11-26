# Donald's decisions: Bookings with no Contract, and a Contracts tab, 2026-11-26

- **Who:** Donald Fraser (Stratos, product owner), reviewing the Admin Day rail's To-do list with
  Claude. Greg and AA have not seen it yet.
- **Covered:** why Bookings with no Contract should not sit on the To-do list; who settles a
  Contract the office cannot; the difference between no Contract information and some; prepaid and
  intake; a third tab on the Day rail's work card for Contracts; and a combined Lists page as a
  later idea.
- **Standing:** Donald's decisions, made for the build. Items they change go to Verify, not Agreed.
- **Inputs gathered here:** Donald's typed messages in the session, looking at the prototype's
  To-do tab (11 rows, four of them "No Contract" Bookings for Thursday 26 November), and the Contracts
  tab Claude proposed in reply, which Donald accepted ("Happy for you to update the requirements").
  The wording below is Donald's where quoted and a summary of the proposal he accepted otherwise.

Cite a point as `"Notes 2026-11-26 · Donald contracts to set #n"`. Points are numbered once across
the whole note.

## Donald's decisions

1. **A Booking with no Contract is common, and often the anaesthetist's to settle.** Donald:
   "across the thousands of shifts that will be in the system, I suspect that that will be a really
   common problem, especially given my current understanding, which is that many times the admin
   staff can't decide on the final details of the contract, and it will need to be the anaesthetist
   to figure that out." And: "often it is hard for AA admin staff to know exactly what RVG code to
   be used and things like that. So it's, I understand, quite common." Bears on US-04.3.4 and
   US-03.4.1.
2. **What makes a missing Contract matter is submission.** Donald: "The only point where it really,
   really matters is, I guess, the fact that lists can't be submitted for approval until they have
   one." A Booking with no Contract cannot be completed, so its List cannot be submitted. Bears on
   US-04.3.4.
3. **The office reads the Procedures at intake and looks for prepaid ones.** Donald: "as a part of
   the matching system that is coming, the intake stuff, I expect that AA staff need to read and
   understand the procedures, and especially should be trying to identify which ones need to be
   prepaid." And: "Prepaid bookings are also fairly common, but the office staff should be able to
   identify those based on a set of heuristics. But that's the sort of stuff that they would
   probably be setting up as a part of the intake flow." Bears on US-04.3.4.
4. **Some Contract information is not the same as none.** Donald: "there'll be cases where many
   will have some information filled in, but not all information filled in. And so I guess there's
   also a little bit of a difference between absolutely zero contract information and some contract
   information." Bears on US-04.3.12.
5. **The Day rail's work card gains a Contracts tab, and the To-do list keeps warnings only.**
   Donald: "maybe this to-do widget on the day view needs a third tab just for contracts." The
   proposal Donald accepted:
   - Bookings with no Contract leave the To-do list, which holds warnings that need action.
   - The Contracts tab sits beside To-do and Notifications and lists the Lists whose Procedures
     still need a Contract, one row per List, with how many of its Procedures are set ("3 of 5
     set").
   - Each Procedure still to set shows how far it has got: nothing chosen yet, or where the invoice
     goes chosen but no Contract yet.
   - Lists whose date has passed come first and are marked strongly, as they hold up submission;
     the rest follow, soonest first.
   - The RVG code, times and modifiers the anaesthetist fills in on an RVG-priced Contract are not
     the office's and never appear there.
   Bears on US-04.3.12, US-13.7.2 and FT-13.7.
6. **Built small, and expected to change.** Donald: "I would ideally like to avoid doing a big
   phased build plan thing. I would like you to do this as a smaller change just here on main.
   Another thing is that I can make changes to this in the future and probably expect to as a part
   of testing the intake flow." Where the office marks prepaid in the intake flow is left as built
   for now. Bears on OQ-150.
7. **A combined Lists page is a later idea, not decided.** Donald: "I will likely in the future make
   a more combined list page that shows draft lists and conflicts, a review queue, as well as ...
   maybe ... a page that shows a list without contracts. So there's some thinking to be had about
   that too." No requirement change.
