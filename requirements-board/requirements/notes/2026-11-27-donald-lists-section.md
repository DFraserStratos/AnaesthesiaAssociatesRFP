# Donald's decisions: a Lists section in the Admin app, 2026-11-27

- **Who:** Donald Fraser (Stratos, product owner), with Claude. Greg and AA have not seen it yet.
- **Covered:** one Lists section in the Admin app holding Draft Lists, Conflicts, Lists waiting for
  Contracts and Lists waiting to be authorised; where procedure events awaiting approval go; what
  the tab counts and the nav badge count; what "conflict" means; and how the badge question goes to
  AA.
- **Standing:** Donald's decisions, made for the build. Items they change go to Verify, not Agreed.
- **Inputs gathered here:** Donald's typed messages in the session; the research Claude gathered on
  the People, Contracts and Finances sections and on the List requirements; and the exploration page
  Claude drew from it, `docs/explorations/lists-ideas.html` (five shapes, A to E, and a Decide page).
  Donald chose shape A and accepted the defaults Claude set out for the remaining questions ("Go
  ahead and update the requirements now"), adding the badge toggle. The wording below is Donald's
  where quoted and a summary of the proposal he accepted otherwise.

Cite a point as `"Notes 2026-11-27 · Donald lists section #n"`. Points are numbered once across the
whole note.

## Donald's decisions

1. **One Lists section, one tab per job.** Donald, opening the idea: "I'm thinking there might be
   some value in creating a single list page that holds draft lists, conflicts, and maybe even the
   review queue together." Choosing between the five shapes: "I'm fairly happy with the idea of
   doing your A idea, which is just 4 different tabs." The Admin app's nav has one entry, Lists, in
   place of Draft Lists, Conflicts and Review queue. Its four tabs are Draft Lists, Conflicts,
   Contracts to set and To authorise, each with its own table, filters and one-line sub, in the same
   pattern as the People, Contracts and Finances sections. Old links to the three pages keep working.
   Follows Notes 2026-11-26 · Donald finances section #3 and Notes 2026-11-26 · Donald contracts to
   set #7, where the idea was first raised. Bears on FT-13.1, FT-01.6, FT-01.5 and FT-07.2.
2. **To authorise is where Lists are approved.** It lists the submitted Lists, oldest submitted
   first, with search, a date filter and a "Needs a look" filter (review flags, changes since
   submission, Procedures needing a price). Each row opens the List's review page, which sits under
   the tab and goes back to it. Lists are still approved in one place only: the Billing tab's "Lists
   awaiting approval" opens To authorise, and Billing never approves. Bears on US-07.2.2, US-07.3.1,
   US-13.3.1 and US-13.3.3.
3. **Procedure events awaiting approval move to Finances › Payments.** Credits, pre-op and post-op
   events are billing work, not Lists. The office approves them on the Payments tab, beside the
   events waiting for the billing run, not in the Lists section. Bears on US-13.3.3 and the
   procedure-event stories that name the Review queue.
4. **Contracts to set gets a tab in Lists, and the Day rail keeps its tab.** The Lists tab covers
   every date: one row per List with how many of its Procedures are set, Lists whose date has passed
   first (they hold up submission), then the rest soonest first. The Day rail's Contracts tab still
   shows the day's own. Bears on US-04.3.12.
5. **Draft Lists: the tab is the all-dates page; the Day view keeps the band.** The Draft Lists tab
   lists every Draft List soonest first, one group row per day, with search, filters (date,
   hospital, why it has no anaesthetist) and paging. The Day view's band still shows the day's own.
   Bears on US-01.6.2.
6. **Tab counts count what needs doing.** As in Finances, each tab's number counts only what needs
   doing and is hidden at zero. In the nav badge a List is counted once, even when it needs several
   things (a Draft List at a closed hospital shows on Draft Lists and Conflicts, and counts once).
   Bears on US-13.3.3's counting rule and the new Lists section story.
7. **"Conflict" means a hospital closure only.** The Conflicts tab holds Lists at a hospital that is
   closed that day. When assigning, an anaesthetist who is not preferred with the surgeon is called
   "not preferred", never a conflict. Bears on US-01.5.2, US-01.5.4 and US-01.3.5.
8. **What the nav badge counts is AA's call; the prototype shows both.** Claude set out two
   choices: everything that needs doing (74 on the demo day), or only the next 7 days plus anything
   overdue. Donald: "for the sake of this prototype, when you're on the list page, the little
   prototype navigation at the very top of the screen should gain a new toggle that changes that
   setting, just to have it be urgent or all. And then we can talk to the customer about what they
   want. At least we can see both of them there. My gut is leaning towards it being all." The toggle
   is a prototype control, not a requirement; it opens on "all". A new question for AA.
9. **Built without a phased plan.** Donald asked whether this could be built "without doing the huge
   build plan thing". It is to be built after Intake's rebuild lands, as a smaller change on main.
   No requirement change.
10. **Payments counts the events awaiting approval, and so does the Finances badge.** Asked whether
   Finances › Payments should show a number for the procedure events awaiting approval and add them
   to the Finances badge, Donald answered "Yes". Bears on US-13.3.3.
11. **A conflict can still be cleared with an optional note.** Asked whether to keep clearing a
   conflict from the Conflicts tab with an optional note, Donald left it to Claude ("Whatever you
   think is best"); it is kept, as the app already does it. No requirement change (US-01.5.4 already
   says so).
