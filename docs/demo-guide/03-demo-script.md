# Demo Script — S1 to S5

The canonical presenter run-sheet. Each scenario has a **stage it** step, then beats with **Click**
(presenter choreography only), **Say** (the story to tell between actions), and **Expected** (what you
should see). The Click lists deliberately contain only navigation, selections, button presses, and
useful pauses. Every scenario resets first, so you can start cold and recover from a mistake.

The whole flow is clickable. Nothing below is narrate-only.

## The one continuous object

Where a scenario needs a worked example, use one recognisable business object:

> Dr Melanie Souter's operating Lists, at Southern Cross, St George's and Forte Health.

The seed keeps her design-day tableau (Tue 21 Jul), the split-billing and two-funder Lists (Mon 20
Jul), a submitted review-queue List, forward Lists for the integration bookings (Tue 28 Jul), and the
unfinished Margaret Ellison Booking designed for live capture.

## Pre-demo setup

1. Open the prototype at a desktop resolution wide enough for the web and admin layouts.
2. From the app switcher, open **Demo: Control Panel**.
3. Under **Clock & reset**, select **Reset demo data**, then **Confirm reset**.
4. Confirm the demo clock reads Tuesday 21 July 2026, 8:00.
5. Keep this document (or the master HTML) open in a second tab. Do not present from the Data Inspector.

The control panel is the **index**, grouped: **Clock & reset**, **Scenario jumps (S1 to S5)** and
**Demo actions by screen**. Each scenario jump confirms first, resets the data, applies any extra
preparation needed, and prints where to go next with one-click navigation. S1 to S4 can instead begin
from the ordinary Reset control. Use the live clock immediately to the right of the app switcher to
advance time without leaving the screen you are presenting.

**Demo actions live on their screen.** A simulated event (a hospital message, a payment webhook, a
billing failure, a job run) is fired from the screen it belongs to: open **Demo actions** in the top
bar, beside the app switcher, and select **Run** on the entry. The pill only appears on screens that
have demo actions, and the menu stays open after a run so you can read the result. On a handset (the
installed PWA) the same actions are in a small amber **Demo** chip that opens a sheet. The control
panel's **Demo actions by screen** lists every one with an **Open screen** link.

## Direct URLs

Every screen inside the three apps has its own address, so you can jump straight to a beat instead of
clicking in, and a refresh or the browser back button keeps your place. The three app roots still
work as entry points: `/mobile`, `/web` and `/admin` open the Lists tab, the dashboard and today's day
view respectively.

| Anaesthetist Mobile App | URL |
|---|---|
| Lists, main view (from today) | `/mobile/lists` |
| Lists, one day | `/mobile/lists?day=2026-03-13` (Fri 13 Mar 2026, the pinned history List) |
| Lists, search | `/mobile/lists?q=Mitchell` |
| List detail | `/mobile/lists/<listId>` |
| Booking detail | `/mobile/lists/<listId>/bookings/<bookingId>` |
| Availability (Find cover) | `/mobile/availability` |
| My calendar | `/mobile/availability/calendar` |
| Balances | `/mobile/balances` |
| More | `/mobile/more` |

| Anaesthetist Web App | URL |
|---|---|
| Dashboard | `/web` (another week: `/web?week=2026-07-27`) |
| Lists table (main view from today) | `/web/lists` |
| Lists, one day | `/web/lists?day=2026-03-13` |
| Lists, search | `/web/lists?q=Mitchell` |
| List detail | `/web/lists/<listId>` |
| Booking detail | `/web/lists/<listId>/bookings/<bookingId>` |
| Availability grid (Find cover) | `/web/availability` |
| My availability | `/web/availability/mine` (one day: `?date=2026-08-14`) |
| Accounts, outstanding | `/web/accounts/overdue` |
| Accounts, GST activity | `/web/accounts/gst` |

| Admin Web App | URL |
|---|---|
| Day view | `/admin/day/2026-07-21` (A to Z order: add `?sort=az`) |
| Booking detail | `/admin/day/2026-07-21/bookings/<bookingId>` |
| Conflicts | `/admin/conflicts` (hospital closures only; filters in the URL, e.g. `?hospital=`, `?cleared=1`) |
| Review queue | `/admin/review` |
| One List under review | `/admin/review/<listId>` |
| Invoices | `/admin/invoices` |
| One invoice document | `/admin/invoices/<invoiceId>` |
| Billing monitor | `/admin/billing` |
| Integration monitor | `/admin/integrations` |
| Master data | `/admin/masters` (one view: `?view=surgeons`, `?view=surgeonRooms`, `?view=anaesthetists`) |
| Availability statuses | `/admin/masters?view=availability-statuses` |
| Contracts | `/admin/masters?view=contracts` (one holder: `&holder=PY-COS`) |
| Specialties | `/admin/masters?view=specialties` |
| Funding tags | `/admin/masters?view=fundingTags` |
| Recurring bookings | `/admin/masters?view=recurringBookings` |
| Hospitals & holidays | `/admin/masters?view=hospitals` (List or Calendar) |
| Surgeon profile | `/admin/masters/surgeons/<surgeonId>` (Ms A. Reid: `S-REID`) |
| Anaesthetist record | `/admin/masters/anaesthetists/<anaesthetistId>` (Dr Priya Sharma: `41267`) |
| Audit | `/admin/audit` |

The demo surfaces are `/demo/control`, `/demo/xero`, `/demo/integrations` and `/demo/data`. The
Xero invoice-pair list is `/demo/xero/invoices`; one pair is
`/demo/xero/invoices/<accRecId>`.

Two things worth knowing. The seed is deterministic, so the ids in a URL you copied stay valid across
a **Reset demo data** — you can bookmark a beat and re-open it after every reset. And a URL that has
gone stale (an id the current data no longer holds) falls back to its parent screen rather than
showing a blank page.

Sheets and drawers are deliberately **not** in the URL: the capture sheets, the move sheet, the
phone's date sheet and the admin List drawer are overlays, so the back button closes a screen rather
than a sheet. A picked day (`?day=`) and a search (`?q=`) are in the URL, so back from a List or a
Booking returns to the same day or results.

## How to read the readiness

Everything in S1 to S5 is built (Phases 00 to 12). The only remaining phase, Phase 13, is a subtle
mobile background and changes nothing here.

---

## S1 · Booking to theatre

**Serves:** the RFP's near-real-time hospital integration, the Booking as the billing anchor, and BTM
capture. **Time:** 5 to 6 minutes.

> **Caveat: HL7 v2 and FHIR are Future scope; present Beat 1 as an illustration of intake.** The
> in-scope path, a hospital download matched by the office, arrives in a later build. The Integrations
> simulator and the Admin Integrations Messages and Feed config tabs are badged **Future scope**.

**Stage it:** use **Reset → Confirm reset**, then open the Anaesthetist Mobile App. The Tue 28 Jul
St George's AM List holds three booked, not-yet-captured cases, so the hospital booking arrives into a
working List rather than an empty one.

### Beat 1: the booking arrives from the hospital

- **Click:**
  - In Mobile Lists, open the Tue 28 Jul St George's AM session and read its three booked cases
    (07:45 knee arthroscopy, 09:45 shoulder arthroscopy, 11:15 wrist ORIF).
  - Back on Mobile Lists, open **Demo actions** in the top bar → **Fire hospital message** → choose
    **S12 · New booking · MSG-STG-1001** → **Run**. (Alternative: **Demo: Integrations → S12 · New
    booking → Replay**, which shows the raw HL7 and FHIR panes.)
  - Pause on the result line.
  - Reopen the Tue 28 Jul AM List.
- **Say:** "Existing hospitals may still send HL7 v2, but the target is FHIR-native. Messages are
  mapped per hospital, processed near real time, and audited. This booking created a patient Booking
  without anyone re-keying it."
- **Expected:** the message shows as processed; the List now carries a fourth Booking for Sarah Mitchell,
  slotted into her 08:30 place between the first two cases. Her NHI matched an existing record, so
  intake reused it, no duplicate.

### Beat 2: the Booking fills over the days before theatre

- **Click:**
  - Open the live clock beside the app switcher.
  - Select **Procedure day · 28 Jul → +1 hour** so live capture starts at 09:00.
- **Say:** "Between booking and theatre, patient and booking data can change right up to the day. The
  canvas rolls forward deterministically as the clock advances."
- **Expected:** the clock reads Tuesday 28 July 2026, 9:00.
- **Optional aside:** open the List (Mobile or Web) and point at **List attachments**: the seeded
  theatre-list PDF from St George's sits on the List as a whole. **Add attachment** opens the simulated
  file picker (badged), and a photo or file can go on a single Booking the same way.

### Beat 3: capture BTM on mobile

- **Click:**
  - Go to **Anaesthetist Mobile App → Tue 28 Jul St George's List → Sarah Mitchell**.
  - Her Booking arrives with no RVG code (the hospital sends the operation text only). On the **RVG code**
    card select **Choose**, type **appendicectomy** in the type-ahead and pick **A3 · Appendicectomy,
    laparoscopic · B 5**, then **Start now**.
  - Without leaving Sarah, select **live clock → +1 hour**, close the popup, then select
    **Finish now**.
  - Select **Mark complete**.
  - Optional, to show the completion gate: back on the List, select
    **Mark list completed · 3 to finish**.
- **Say:** "The anaesthetist captures the billing inputs, not just a dollar figure. The fee is Base plus
  tiered Time plus Modifiers at her own value per unit. The List only goes to the office once every
  active Booking is complete, so one captured Booking out of four submits nothing yet. That gate is the
  reason the List is the unit of approval, not the Booking."
- **Expected:** the RVG code card reads **A3 · Appendicectomy, laparoscopic · Base 5 units · from the RVG
  group**, and B reads 5. Sarah changes the List from **0 of 4 complete** to **1 of 4 complete**. The List action then reads **Mark list completed · 3 to finish**; tapping it opens the
  **Bookings still to finish** sheet, which names each remaining Booking by time and patient with what it
  needs. The List stays `ACTIVE`. S2 Beat 4 carries the submitted-to-authorised half of the handoff from
  the seeded Review queue.
- **Worth pointing at:** only **Mark complete** is pinned to the bottom of the phone; the anaesthetist
  captures inputs and sees no running fee, which the office sees on the Admin Booking in S2. Scroll down
  once and the masthead folds to a nav row to make room. If Mark complete finds missing data, the Booking
  moves directly to the first incomplete control and focuses it. Optionally, in the type-ahead type
  **H1** (every H1 row, each with its description and base units) or **T2** (three rows share the code,
  told apart by description and units).

**Discovery point:** settled: a part time interval always rounds up under the RVG tiers (confirmed with
AA, OQ-75); the tiers are held as data, shown read only under **Admin → Master data → RVG groups**, and
the T row reads **From start and finish stamps · RVG time tiers**.

---

## S2 · Office day

**Serves:** the office as the operational control tower, exception handling, and the no-Returned-state
authorisation model. **Time:** 7 to 9 minutes.

**Stage it:** use **Reset → Confirm reset**, then go directly to the Admin app. The day's data is
already seeded.

### Optional opening: days off, repeating days off and the status list

- **Click:**
  - On the **Anaesthetist Mobile App**, open **Availability → My calendar**. Page to **August**.
  - Select **Add days off**: keep **On holiday** and **Both**, set **From** to **Fri 14 Aug** and **To**
    to **Sun 16 Aug**, then **Save** and **Done**.
  - Select **Add days off** again: choose **Unavailable**, **PM**, **Every 2 weeks**, set **Starts** to
    **Fri 14 Aug** (Friday is already chosen), then **Save** and **Done**.
  - Tap **Fri 28 Aug** and select **Delete this one**.
  - Switch to the **Admin Web App → Day view → Fri 14 Aug**, then **Fri 11 Sep**.
  - Open **Master data → Availability statuses**. Either rename **Unavailable** to **Blocked**, or select
    **Add status** and add **Public hospital** (not open for bookings, the grey colour, hatched). Then
    show the phone's **Add days off** choices.
- **Say:** "Availability belongs to each session. Anaesthetists mark days off weeks ahead from the phone
  or the web, set repeating days off, and change or delete one occurrence. The office sees it straight
  away. The statuses themselves are a list the office maintains: rename, recolour or add one, and every
  app follows, because the rules read the status, not its name."
- **Expected:** the first save reads "6 sessions set to On holiday, 14 Aug to 16 Aug." The series saves
  with "1 already set left as it is" (Fri 14 Aug, already on holiday), and "Your series" lists
  "Unavailable, Friday PM, every 2 weeks, no end date". Fri 28 Aug returns to Free. The Day view shows
  Dr Souter on holiday on Fri 14 Aug and Unavailable on Fri 11 Sep PM. The renamed or added status shows
  in the table with its fixed ID (`unavailable`, or `ST0001`) and reaches the phone's choices at once.
- **Presenter note:** Dr Souter has recurring Lists Monday to Thursday, so keep this opening's days
  off to Fridays and weekends. A day off over a session that holds a List asks where each List goes
  first (return to the office or hand on to a colleague, one List at a time); Beat 3c shows it.
- **Reset** before Beat 1 (**Reset → Confirm reset**).

### Beat 1: read the day

- **Click:**
  - Go to **Admin Web App → Day view → Tuesday 21 July**.
  - Pause on the day grid.
- **Say:** "Every active anaesthetist has two sessions a day, AM and PM, four months ahead, from
  their start date, whether or not anything is booked. A session is free until the anaesthetist marks
  it otherwise, and when the office puts a List in it, the List shows instead. Requests that arrive
  before an anaesthetist is found wait here as Draft Lists, flagged unassigned and soonest first, right
  beside the day, so nothing sits on a pile of paper. When a surgeon's recurring booking lands on a day
  the anaesthetist has already blocked out, the system makes it a Draft List too, rather than leaving
  it on someone who will not be there."
- **Expected:** a legible status-coloured grid; every block carries its label, never colour alone. The
  dashed Free blocks are empty sessions; the coloured blocks are Lists. The legend reads the three List
  types, then the availability statuses from master data (the same six labels as before). A Draft Lists
  card in the right rail and a Draft Lists band above the grid hold Dr Ngata's acute AM (he is
  unavailable) and St George's PM, Mr S. Tan, waiting 16 h; every List block shows its booking count;
  the nav shows Draft Lists 15.

### Beat 1b: a List with no anaesthetist yet

- **Click:**
  - Open the band's **St George's** block, point at **Available that session** and the tier pills, then
    select **Assign → Dr Emma Fitzgerald** (Free) **→ Assign Draft List**.
  - Optional, if time allows: **Draft Lists** in the side nav. Show the date order and Dr Beaumont's
    Wednesday Lists waiting while she is on leave, then open **Forte Health · Mr V. Nand** (2 bookings)
    to show Bookings already on a Draft List. Or, in Demo actions, **Simulate incoming request**
    (Christchurch Eye Surgery, Ms A. Reid, Thu 23 Jul PM) **→ Assign**, point at Dr Sharma in **Not
    preferred with Ms Reid**, and pick a Free anaesthetist instead.
- **Say:** "A Draft List has its hospital, surgeon, day and session, and can already hold Bookings, but
  has no anaesthetist and changes nobody's schedule. Only the office assigns it, by picking the
  anaesthetist; the session is already set. Everyone who could take it is shown, ordered by the
  office's priority tiers, with any not-preferred pairing set apart. Those warn, and never block, and
  anaesthetists never see them. Once assigned, it is an active List in that anaesthetist's day. A
  cancelled request is removed, or its date changed."
- **Expected:** the band keeps only Dr Ngata's acute AM; Fitzgerald's PM shows St George's, Mr S. Tan;
  the drawer shows ACTIVE and its History shows the Draft List created and assigned on the same List.

### Beat 2: a phone-advice booking

- **Click:**
  - Open **Dr Priya Sharma's Tue 21 PM Free session → Book (phone advice)**.
  - Choose **St George's Hospital** and **Mr T. Hale**; keep the default times (13:00 to 17:30).
  - Select **Continue to add booking → Look up**.
  - Pause on the populated booking.
  - Select **Review → Save booking → Done**.
- **Say:** "Phone and PDF remain first-class booking channels. The design improves those fallbacks
  rather than pretending they disappear."
- **Expected:** the lookup fills the complete booking and leaves every field editable. The session now
  holds a Private List with the new Booking, and the anaesthetist's web and mobile views and the
  availability finders show it as booked.
- **Optional one-liner:** "Assign List does the same without a patient, for a session booked ahead."
- **Optional pointer:** on the surgeon picker, show the separate **Not preferred with Dr Sharma** group.
  If time allows, select **Ms A. Reid** to show the soft amber warning and **Continue anyway**, then
  return to **Mr T. Hale**. The scripted path is unchanged.

### Beat 3: illness cover, a sick anaesthetist's List handed on

- **Click:**
  - Stay on **Admin Web App → Day view → Wed 22 Jul**. Dr James Rutherford's **AM** reads
    **Unavailable** ("Unwell, short notice"), with no List and no flag: he phoned in sick at 07:40, the
    office recorded it, and his Christchurch Eye Surgery List went straight back to the office.
  - In the **Draft Lists** band, open Rutherford's **Christchurch Eye Surgery · Mr J. Whitford** block.
    The drawer reads "Returned: anaesthetist unavailable".
  - Select **See everyone** (or **Assign**). The candidates are in tier order, and within a tier a
    **Preferred** pairing comes first. Pick **Dr Priya Sharma by name** (Tier 2, Preferred with Mr
    Whitford), since the order within a tier varies each time the picker opens. Colleagues whose AM is
    closed show under **Not available**, read only: the office never assigns onto an unavailable
    session.
  - Select **Assign Draft List**.
- **Say:** "Sickness is never left as a flag. The List comes straight back to the office and is
  handed on from one screen."
- **Say:** "The List moves with its Bookings and history to Dr Sharma; nothing is re-keyed, and nothing
  about billing is recalculated. It is different from moving one patient Booking, which Beat 3d
  shows."
- **Say:** "The office's private knowledge is now data: who works well with whom, either way round, and
  the directors' priority tiers. It orders the suggestions, tier first, then preferred pairing, shuffled
  within that so no one is always on top. Only the office ever sees it."
- **Expected:** a brief **Draft List assigned** moment; the List on Sharma's AM row, ACTIVE; Rutherford's
  AM still Unavailable; no conflict. **Conflicts** shows only the Southern Cross closure rows (Wed 22,
  Mon 26 Oct and Fri 13 Nov). (Rutherford's List carries no Bookings in the seed; Beat 3a shows a
  sickness on a List with Bookings.)
- **Optional pointer:** to show the office recording a sickness itself, open any booked session on the
  Day view, **Change status → Unavailable → Continue**: the sheet asks **Where does this List go?**
  (Return to the office, or a colleague in tier order), then what the session becomes. Or open **Dr
  Alistair Chen's Tue 21 PM Christchurch Eye Surgery List → Reassign list** to show Dr Sharma apart
  under **Not preferred with Ms Reid**. Open that picker only; never confirm it, because it uses
  Sharma's Tue 21 PM Free session, which Beat 2 books.

### Optional Beat 3a: a sickness phoned in, and a closure that moves

- **Click:**
  - On the Day view for Wed 22 Jul, open **Demo actions → Simulate sickness**, choose **Dr Sharma · PM ·
    Southern Cross, to the office** (it has Bookings) or **..., to Dr X**, and **Run**.
  - The result line says where the List went ("The List went back to the Draft Lists with its Bookings.
    No conflict."). Sharma's PM reads Unavailable; nothing new appears on **Conflicts**.
  - Go to **Master data → Hospitals & holidays**, select the **Theatre maintenance closure** pill on
    Southern Cross and move it to Thu 23 Jul (or **Delete holiday**).
- **Say:** "A sickness never leaves a List with someone who will not be there. A closure is different:
  the List can still run elsewhere, so it is a flag that follows the facts. Move or delete the closure
  and its flags clear; the office can also clear one with a note and flag it again later."
- **Expected:** the holiday result line counts the flags raised and cleared, and the Wed 22 Southern
  Cross rows leave Conflicts.

### Optional Beat 3b: a recurring booking reaches the canvas at once

- **Click:**
  - **Master data → Recurring bookings**, then **Edit** on Dr James Rutherford's Monday AM.
  - Change the usual surgeon; read the preview line ("Applying updates 16 and keeps 1 (with
    Bookings).").
  - Select **Apply to canvas now**, then **Show on day grid**.
  - Optionally **Retire** it with a last date next month.
- **Say:** "A recurring booking creates its Lists across the schedule ahead before any Bookings exist; a
  change reaches every future empty List at once and never touches booked work."
- **Expected:** the result line counts the Lists added, updated and kept, and the Day grid opens on the
  first changed Monday (Mon 3 Aug) with the new surgeon; Mon 27 Jul, which has Bookings, is unchanged.
  A retired row sits muted at the foot of the table with its last date.

### Beat 3c: an anaesthetist moves her own List

- **Click:**
  - Switch to the **Anaesthetist Web App** (Dr Souter) and open **Availability** on **Mon 27 Jul**
    (`/web/availability?date=2026-07-27`). Her St George's PM List (Ms G. Lim) shows **Move**.
  - Select **Move → Hand on to a colleague**. The colleagues free that session are one plain list
    in surname order. Choose **Dr Hannah Ropata**: the confirm step says she gets the List and its
    Booking straight away, with no warning of any kind. Keep **Free** for your own session and select
    **Move List**.
  - Switch to the **Admin Web App → Day view → Mon 27 Jul**: the List sits on Dr Ropata's row, and
    the rail's **Notifications** card (under Draft Lists) reads "Dr Souter moved Mon 27 Jul PM (St
    George's, Ms G. Lim) to Dr Ropata". Open it: the drawer says "Moved here by Dr Souter".
  - Optional: on **mobile Availability**, pick **Thu 23**, select **Change Thu 23 Jul**, then the
    PM session's **Change → Unavailable → Save**. The app asks where its List goes: **Return to the
    office** or **Hand on to a colleague**, then what her session becomes (**Unavailable**, already
    chosen, or **Free**). Return it, and Admin Day shows a new Draft List with its Bookings, "Returned:
    anaesthetist unavailable".
  - Optional: on a Booking (web or mobile), **Alert the office**, add a note and **Send to the office**.
    In Admin **Notifications** the alert shows with the note and the active count; **Resolve** ticks it,
    and **Show resolved** brings it back with who resolved it and when.
  - Optional: on **Admin Day**, **Demo actions → Colleague moves a List to the office**, then **A busy
    morning (8 moves)**, and open **Notifications** to page through the shared pool.
- **Say:** "Anaesthetists usually find their own cover, often at 6am. Here she moves her List
  herself, to a colleague who is free or back to the office, and it happens at once: AA runs a
  high-trust system. She sees who is available, nothing else: the office's private pairing
  preferences are never shown to anaesthetists and never warn them, because a covered List beats an
  uncovered one and they will talk anyway. The List moves with its Bookings and history, exactly
  like the office's own reassignment, and nothing about the patient's prepayment is recalculated.
  If she marks a booked session off, the app asks where its List goes, so no List is left with
  someone who will not be there. Every move lands in the office's shared notifications, which are
  not to-dos: nothing needs approving. A notice stays until someone in the office ticks it."
- **Expected:** the done state ("Moved to Dr Ropata. Dr Ropata and the office can see it now."), the
  List on Dr Ropata's row, the notification on the rail and on **Notifications**, nothing new on the
  To-do card, and no preference, tier or warning anywhere on the anaesthetist's side. (Dr Ropata has
  a not-preferred pairing with Ms Lim in the office's private data: that is the point. The office's
  own Reassign of the same List would still warn.)

### Beat 3d: she hands one Booking to a colleague

- **Click:**
  - Still on the **Anaesthetist Web App** (Dr Souter), open her **Wed 22 Jul AM** Christchurch Eye
    Surgery List (Mr J. Whitford) and its first Booking, **Lachlan Robinson**
    (`/web/lists/L-34821-2026-07-22-AM/bookings/BK0046`). Select **Move to a colleague**.
  - The sheet opens on **Free this session**: Dr Delaney, Dr Morrison, Dr Ngata, Dr Ropata, Dr Sharma
    and Dr Whitaker, in name order. Type **ch**: **Dr Alistair Chen** shows, greyed, "Not available
    this session. They can set it available in their app, then you can move it.", and cannot be
    picked. (Type **fitz** for Dr Fitzgerald: "Already has a List this session".)
  - Clear the box, type **whi** and pick **Dr Ben Whitaker**. The confirm step reads "A new List is
    created in Dr Whitaker's Wed 22 Jul AM session at Christchurch Eye Surgery." and "Dr Whitaker is
    paid for it." Tick **Tell the office**, then **Move Booking**, then **Back to your List**.
  - Switch to the **Admin Web App → Day view → Wed 22 Jul**: a new List on Dr Whitaker's AM row,
    same hospital and surgeon, holding the one Booking; its drawer reads "Booking moved here by Dr
    Souter". The rail's **Notifications** card reads "Dr Souter moved a Booking (Robinson, L., Wed 22
    Jul AM, Christchurch Eye Surgery) to Dr Whitaker. A new List was created."
  - Optional: on **Admin Day**, **Demo actions → Colleague hands a Booking to Dr Souter**: Dr Hughes
    hands his Wed 22 Jul PM Booking into her free session, and a new List appears on her row.
- **Say:** "Sometimes it is one case, not the whole List. She finds a colleague who is free that
  session, by name or from the list, and hands it on straight away, with no pop-ups: who works with
  whom is the office's business, not hers. It becomes a List for them; it never goes into someone
  else's List. Someone on leave is not offered until they mark themselves available, which is how
  they say yes. Telling the office is her choice. Whoever does a Booking is the one paid for it; if it
  was prepaid, the amount sits with the AA Holding account, the new anaesthetist claims it and nothing
  is recalculated."
- **Expected:** the done state ("Moved to Dr Whitaker." and "The office has been told."), her List
  one Booking shorter and still there, a new List on Dr Whitaker's row, and the pool row (only because
  the box was ticked; without it there is no pool row, and Dr Whitaker still sees the move on his
  side). No warning, preference or tier anywhere on her side. The submit sheet on any of her Lists
  carries one sentence: "Submitting says you did every procedure on this List. If a colleague is doing
  one, move it to them first."
- **Presenter note:** in this build the AA Holding account and its transfer at authorisation are not
  built yet (later phases); say the prepaid line, do not open the ledger. A prepaid Booking (Fri 24
  PM, Mr Nair) shows "This Booking is prepaid. The prepaid amount stays as agreed, and Dr ... claims
  it." on the confirm step; Reset after moving one.

### Beat 3e (optional): an emergency case after hours

- **Click:**
  - **Admin Web App → Day view → Tue 21 Jul**. Hover **Dr Souter**'s name on her row (or Tab to it): a
    small teal **Open out-of-hours session** control appears. Select it.
  - The sheet offers **18:00 to 21:00** (the default; the office can change it). Select **Open
    out-of-hours session**: the ruler now runs past 18:00, a Free evening block sits after her PM List,
    and its drawer opens.
  - In the drawer, **Assign List**: Southern Cross, Ms K. Patel. The evening block now shows the List.
    (Alternatively, log the request first as a Draft List with the session **Out-of-hours** on the
    Draft Lists page; the evening session's drawer then lists it under **Draft Lists for this session**
    with **Assign here**.)
  - Switch to the **Anaesthetist Mobile App** (Dr Souter): her Lists show a third row today after PM,
    a moon and **18:00**, "Out-of-hours · Ms K. Patel". It is a List like any other.
  - On a handset (the PWA), the Demo sheet's **The office adds an out-of-hours List for me tonight**
    (Office stand-in) does the same.
- **Say:** "Late and emergency cases go through a List like everything else. The office opens an
  out-of-hours session after PM, even the same evening, and puts a List in it, a new one or a request
  that was waiting. From then on it is a session like AM and PM: it has its own times, the
  anaesthetist can mark it available or not, and the finders offer it while it is free."
- **Expected:** the evening block on Admin Day only on a day that has one (every other day looks as
  before); the row control gone from Dr Souter's row once her evening is open (one a day); her row after
  PM on mobile and web; **Find available → Out-of-hours** offers a free evening session; an empty one can
  be closed from its drawer. Reset afterwards.

### Optional: find who is free

- **Click:**
  - On the Day view, select **Find available**, choose **PM**, then choose **Ms A. Reid** as the
    surgeon for the List.
  - Pick any row to open that session's drawer on **Assign List** with Ms Reid already chosen; cancel.
- **Say:** "When the office has a List to fill, it sees who is free that session, best-placed tier
  first and shuffled within a tier so the same person is not always on top, and any pairing a surgeon
  or anaesthetist has asked to avoid sits apart. Only the office sees this; the anaesthetists' own
  finders are plain."
- **Expected:** the free anaesthetists in tier order with tier pills and the tier filter; once Ms Reid
  is chosen, Dr Sharma (free on Tue 21 PM unless Beat 2 has booked her) sits in a separate **Not
  preferred with Ms Reid** group, still clickable. On Tue 21 run this before Beat 2.

### Optional: the schedule is a setting

- **Click:** **Master data → Schedule settings**.
- **Say:** "The horizon is a setting, four months as today; default session times are one setting too.
  Sessions with their own times keep them."

### Beat 4: authorise a submitted List

- **Click:**
  - Go to **Review queue → Dr Kate Morrison, Mon 20 Jul → Review**.
  - Pause on the submitted List, then select **Authorise for billing → Confirm**.
- **Say:** "The office reviews the Bookings as a set, a human sanity check, not an automatic gate. If
  something needs clarification the office phones and corrects it here. The List is never returned.
  Authorisation locks every Booking and hands the whole List to the Billing Engine."
- **Expected:** the authorisation banner appears, rows lock, and the Review queue count falls. Until
  this moment the List stayed on Dr Morrison's main view, less prominent, and she could still change
  it; if she had, Review would show **Changed since submitted** with the count. Now it leaves her main
  view and her search finds it.

**Discovery points:** settled: soft warning (OQ-09), and the Draft List questions (OQ-44, OQ-64 and OQ-86 are answered); settled: the anaesthetist's calendar is painted
before recurring bookings, a recurring booking on an unavailable session becomes a Draft List (Phase
31), and an anaesthetist who marks a booked session unavailable returns the List to the office or hands
it to a colleague (OQ-64, OQ-81); settled: an anaesthetist moves her own List at once, with no
acceptance and no office confirmation (OQ-39), every move posts to one shared notification pool for
the whole office (OQ-65), and her own move shows no preference warning (OQ-43); settled: she moves a
single Booking to a colleague free in that session, found by name or from the free list, always as a
new List in their session, with telling the office her option (OQ-85), colleagues by availability
alone, never by tier or pairing (OQ-113), and a prepaid Booking's payable stays the AA Holding
account with nothing recalculated (OQ-80); a move into an existing List is not allowed for now and
may change if it does not work in practice (OQ-85); settled: short-notice sickness never leaves a List
in place, the office returns it or hands it on there and then, and the conflict flag covers hospital
closures only (OQ-81 part 3); settled context rather than a question: availability is a status on
each session, kept from the anaesthetist's own calendar (one mechanism; OQ-17, OQ-27 and OQ-64
answered), and the status values are a list AA maintains, starting from Free, On holiday and
Unavailable, with the final values to be agreed with AA's users and kept apart from a List's state
(Active, Submitted, Authorised; Draft for Draft Lists from Phase 31; US-01.2.2); settled: whoever moves
a List is asked what the vacated session becomes, Free or Unavailable (OQ-84); settled: notices are
active until an admin ticks them resolved, nothing expires, and alerts to the office join List moves in
the pool (OQ-79); open: the panel's place and layout are our design for AA to check (US-13.8.1), and
whether an alerted Booking may still be submitted (the prototype allows it); whether monitoring belongs
in Admin Web or a separate surface (the prototype places it in Admin Web); the names for the pairing
preferences and the priority tiers (OQ-102: the prototype shows Not preferred, Preferred and Tier 1 to
Tier 4 as placeholders; still open); and the pre-op and acute pairing reading (AA rooms as a location; a named surgeon on pre-op and acute Lists).
Settled (US-01.1.6, D84): an out-of-hours session after PM is a third kind of session the office opens for an
anaesthetist on a day, one a day; any List goes in it, new or a Draft List for the evening; it is a full
session for availability. Open: who opens one when the office is closed. Its Bookings are billed as on any
List (our reading; no after-hours pricing).

---

## S3 · Money end-to-end

**Serves:** the Billing Engine at the centre, split billing, the Xero pair, the two separate money
states, and AA's own monthly fee. **Time:** 8 to 10 minutes. This is the money story's payoff, so authorise live.

**Stage it:** use **Reset → Confirm reset**, then go directly to Admin. Both of Dr Souter's Mon 20 Jul
Lists are already in the Review queue: AM (Forte Health, the split-billing Booking) and PM
(St George's, the two-funder Booking). Their invoices do not exist until you authorise the Lists live.

### Beat 1: authorise and generate invoices

- **Click:**
  - Go to **Admin → Review queue**.
  - Process the two Melanie Lists: authorise Forte AM, then use **Next in queue** to authorise
    St George's PM.
  - Select **View invoices → AA-2026-0002 · Brian Holt → View**.
  - Pause on the invoice, then select **Email invoice → All invoices**.
  - Locate the fixed comparison rows and pause:
    - **AA-2026-0002 · Brian Holt · Forte Health · $396.18** is the one-invoice,
      same-funder split Booking.
    - **AA-2026-0005 · Alan Prentice · nib · $152.38** and
      **AA-2026-0006 · Alan Prentice · St George's · $91.43** are the two invoices from the same
      Booking at 14:00.
- **Say:** "The Billing Engine, not Xero, produces the invoice. It resolves the explicit payer per
  Procedure, applies the governing Contract, and groups by counterparty. Xero follows as the
  receivables and banking service."
- **Expected:** invoice rows appear for both Lists, derived from the same captured data; one invoice
  for the split-billing Booking, two for the two-funder Booking. Dr Souter's Mon 20 Jul Lists leave
  her main view (phone and web) as soon as the office authorises them, and their invoices show in her
  Balances at once, with no Next morning needed.
- **Optional aside:** to also show the patient invoice layout, reallocate part of the two-funder Booking's
  fee to the patient via **Funder allocation** before authorising the PM List.

### Beat 2: the Xero collection and payable pair

- **Click:**
  - Go to **Demo: Billing Monitor & Xero → Invoices**.
  - Open **AA-2026-0005** (payer nib).
  - Pause on the two money-flow cards, then the ACCREC and ACCPAY pair beneath them.
- **Say:** "Read the flow from left to right. The ACCREC tracks money coming from nib into AA. The
  ACCPAY tracks the full amount going from AA to Dr Souter: AA passes on everything it receives, and
  invoices its own fee separately. Both records carry the invoice number and the case reference. No
  NHI or other personal information ever crosses into Xero."
- **Expected:** a matched ACCREC plus draft ACCPAY pair per invoice, each showing its InvoiceNumber
  and Reference (the ACCPAY's number ends `-P`). The patient, Alan Prentice, is named only in the
  "Linked Billing Engine case" panel, which reads the billing system; read his name from there. On
  this pair, nib owes $152.38 and the payable to Dr Souter is $152.38.

### Beat 3: payment, balances and disbursement

- **Click:**
  - On the open **AA-2026-0005** pair, select **Simulate payment and payout**.
  - Pause on the updated ACCREC and ACCPAY states.
  - Select **View in Dr Souter's account**.
  - Pause on the highlighted **AA-2026-0005** row under **Accounts → Payments**.
- **Say:** "One demo action is standing in for two real money events: nib pays $152.38 into AA, then
  AA pays the same $152.38 to Dr Souter. In a real operation those outgoing payments are grouped into
  a payables run. We keep the paid-in and
  paid-out states separate underneath, even though this guided path advances both together. The
  anaesthetist app reads the Billing Engine's mirror; it never queries Xero directly."
- **Expected:** ACCREC shows paid, ACCPAY shows disbursed, and the Web Payments row remains visible
  with $152.38 received by AA, $152.38 released to you, $152.38 paid to you and **Paid to you**. It does not
  remain under Overdue because it is no longer outstanding.

### Beat 4: AA's monthly fee

- **Click:**
  - Go to **Admin → Billing monitor → Open AA fee invoices → Fee settings**. Pause on the two fixed
    items ($350.00 and $150.00, labelled **Sample schedule**), the **$5.00** charge per BCTI and the worked
    example: "$500.00 + $5.00 x 40 = $700.00, plus GST at the foot of the invoice".
  - Select **Fee invoices**. July 2026 is in the month picker; Dr Souter's May invoice
    (**AA-FEE-2026-H01**) is Paid and June's (**AA-FEE-2026-H02**) Unpaid.
  - Open **Demo actions → Seed a month of BCTIs → Run**: Dr Rutherford's row shows 40 BCTIs paid and
    **$700.00**.
  - Select **Run monthly fee invoices**. Every active anaesthetist gets a July fee invoice. Expand Dr
    Rutherford's: **$700.00 + GST $105.00 = $805.00**, with his 40 counted BCTIs. Dr Souter's July invoice
    counts four BCTIs, including **AA-2026-0005**, because Beat 3 paid it: **$520.00 + GST $78.00 =
    $598.00**.
  - Go to **Demo: Billing Monitor & Xero → Invoices → AA-FEE-2026-H02** (the AA fee chip). Pause on the
    money flow to **Anaesthesia Associates (AA's own account)** and the **No payable** note, then
    select **Record fee payment** and **View in Dr Souter's account**.
- **Say:** "AA's fee is AA invoicing the anaesthetist once a month, from settings the office maintains:
  fixed charges plus a charge per buyer-created tax invoice. It is always a separate invoice, paid into
  AA's own account, and never deducted from a payment to the anaesthetist, because trust law forbids
  it. Only invoices that have been paid are counted, so a Booking moved between anaesthetists is never
  charged twice. The real fixed schedule, and confirmation of the paid-only count and of one BCTI per
  invoice, are with AA's accountant."
- **Expected:** Web **Accounts → AA fees** highlights **AA-FEE-2026-H02** as Paid, with May Paid and July
  Unpaid. Payables, GST activity and Overdue do not change when a fee invoice is raised or paid. Read
  Dr Souter's July figures from the app if Beat 3 was skipped (then three BCTIs, $515.00 before GST).

### Optional closing moment: finding past work

- **Click:**
  - Switch to the **Anaesthetist Mobile App**. The Lists tab starts at today; scroll up (or tap the
    teal hint under Today) for anything not yet authorised.
  - Type **Prentice** in the search field. Open Monday's Booking, authorised a minute ago: it opens
    read only with what was entered. Back to its List: the **Invoices** section shows the S3 invoice
    numbers.
  - Optionally tap the calendar button and pick **Fri 13 Mar** to show a day from the history.
- **Say:** "Until the office authorises a List the anaesthetist can still change it; after that it
  leaves the main view, but nothing is lost: search finds it by patient name, NHI or date. Their own
  work only."
- **Expected:** Prentice's Mon 20 Jul Booking and his June ACC Booking, both marked **Invoiced**.

**Discovery points:** whether date of birth joins name and NHI (the three-way match) and whether the
office needs this search too; the split-billing invoice count (the prototype groups by counterparty, two invoices when funders
differ); and AA's fee schedule, the paid-only BCTI count and one BCTI per invoice or per procedure
(all with AA's accountant).

---

## S4 · Exceptions

**Serves:** resilience, the RFP's hard cases, and the audit trail that keeps them honest.
**Time:** 8 to 10 minutes. Use this for a technical audience; every sub-trigger is under **Demo
actions** on the screen named in its beat.

**Stage it:** use **Reset → Confirm reset**. Work top to bottom through the beats below.

### Beat 1: prepayment warning

- **Click:**
  - Go to **Anaesthetist Mobile App → Dr Souter's Fri 24 Jul AM List**. Point at the small warning
    triangle on **Annette Riley**'s row (it is a marker; tapping it does nothing of its own).
  - Open her Booking: the warning is at the top, **Prepayment required**, Before procedure, Strong,
    on screen with no scroll and no tap.
  - Select **Mark complete**: it completes. Then **Mark list completed → Submit to office**: the
    usual submit sheet, with no warning step; it goes straight through.
  - Go to **Admin Day view → Fri 24 Jul**: the Souter AM block has the red outline and the triangle.
    Open it: Annette Riley's row in the drawer carries the same outline.
  - In the right rail, the **To-do** card under the calendar lists her warning. Select **Clear**: it
    leaves the list, the outline drops, and her Booking shows who cleared it and when.
- **Say:** "A warning, never a block, and no pop-up in the way. The anaesthetist sees it when they
  open the Booking, the night before, while the surgeon can still be told; the office sees it on its
  to-do list as a second check. AA decided not to block (OQ-57)."
- **Expected:** completion and submit go through with no extra step; the warning shows in both apps
  and leaves the to-do list when cleared. There is no override any more.
- **Optional:** on **Admin Day view → Tue 21 Jul**, **Demo actions → Raise sample warnings** fills
  the To-do card with sample warnings on Dr Rutherford's Lists; **Clear sample warnings** removes them.

### Beat 2: post-op addendum

- **Click:**
  - Go to **Admin Day view → Tue 14 Jul → Dr Priya Sharma's AM List → Sarah Mitchell**.
  - Open **Demo actions → Stage post-op scenario → Run** (it shows only for this List).
  - Select **Add post-op event**.
  - Pause on the new addendum Booking.
- **Say:** "A later pain consult or ward review can create another charge. The original authorised Booking
  stays immutable; the addendum is a new linked Booking with its own submit, authorise and bill cycle."
- **Expected:** a new addendum Booking; the original stays locked. The addendum sits on a List created
  in Dr Sharma's free Tue 21 PM session (interim until additional invoices replace the addendum).

### Beat 3: billing failure and retry

- **Click:**
  - Go to **Admin billing monitor → Demo actions → Trigger billing failure → Run**.
  - On the same screen, **Losa Tuilagi → Resolve & retry**, choose **COS-001 · ACC orthopaedic
    services, Canterbury Orthopaedic Surgeons**, then **Choose and retry**.
- **Say:** "A Booking can fail after the List is authorised, here because the Booking was pointed at a
  fixed-price COS Contract whose price only starts on 1 August, after this List. The prototype isolates that Booking, still
  invoices its clean sibling, then lets the office choose the right Contract and retry. No Contract is
  edited."
- **Expected:** the failed Booking shows "Needs a price: no price range in force on 16 Jul 2026 under
  COS ACC fixed fees" while its sibling is billed; choosing the Contract and retrying bills COS.

### Beat 4: integration dead-letter and manual fix

- **Click:**
  - Go to **Admin Integrations → Demo actions → Fire hospital message → MSG-CPH-2001 → Run**.
  - Go to **Feed config → Christchurch Public**. Say that the tab is badged **Future scope**: HL7
    feeds and their mappings are not in today's scope.
  - Change **patientNhi** from **PID-2** to **PID-3**, then select **Save**.
  - Go to **Message log → MSG-CPH-2001 → Reprocess**.
- **Say:** "Christchurch Public sends the NHI in PID-3, but the feed was onboarded reading PID-2. The
  bad NHI fails validation and the message dead-letters after its retries. Fixing the mapping and
  reprocessing recovers it, without creating a duplicate."
- **Expected:** the message dead-letters, then reprocesses cleanly after the mapping fix.

### Beat 5: partial payment

- **Click:**
  - Go to **Admin Invoices → Hemi Walker · St George's** (the clean-sibling invoice from Beat 3).
  - Open **Demo actions → Payment received · half → Run**.
  - Go to **Billing monitor** and select its own **Run payables** button.
  - Back on the invoice, **Demo actions → Payment received · full → Run**, then **Run payables** again.
- **Say:** "A partial payment authorises a payable for exactly the amount received, to the cent; the
  rest stays outstanding on the invoice. Two payables runs across a part-then-balance payment prove
  there is no double payment."
- **Expected:** the payable authorises exactly the amount received; each run pays exactly what arrived,
  and the total paid out equals the invoice total, never more.

**Discovery points:** billing-failure isolation (a prototype choice; the RFP leaves it open); which
conditions warn, and how strongly; where the to-do list sits on the dashboard; and how inbound messages targeting a submitted or authorised List
are parked for manual intervention.

---

## S5 · Compliance tour

**Serves:** audit, identity, data minimisation and audited Contract edits, the governance the
evaluators will probe. **Time:** 5 to 6 minutes.

**Stage it:** control panel, Scenario jumps, **S5 · Compliance tour → Jump → Confirm jump**. This
resets to rich booking-to-clinical histories on every Booking, adds three live edits to David Chen's
trail, and authorises Dr Whitaker's Fri 17 Jul List to raise its Health NZ agreed rate
invoices. Use **Go to Admin app** and **Go to Xero sim**.

### Beat 1: the audit trail of a much-edited Booking

- **Click:**
  - Go to **Admin Day view → Tue 21 Jul → Dr Souter PM**.
  - Open **David Chen → History**.
  - Pause on the audit trail.
- **Say:** "Every Booking and Procedure change, including automated ones, writes an append-only audit entry
  with who, role, source and before/after. The captured inputs stay reproducible, not just the final
  total."
- **Expected:** a multi-entry trail from booking and Procedure setup through capture and completion,
  followed by the staged anaesthetist and office edits. Every row shows who, role, source and
  before/after, and the manual time-unit adjustment retains overridden provenance. Any other Booking
  can also be opened to demonstrate its seeded history without staging first.

### Beat 2: NHI dual-format validator

- **Click:**
  - Go to **Admin Integrations → Demo actions → Fire hospital message → MSG-STG-1002 (new-format
    NHI) → Run**.
  - Optional: add a Booking manually and try both NHI formats.
- **Say:** "The prototype validates both NHI formats using the official check-digit algorithms. A
  new-format NHI with a mod-23 check letter validates and processes end to end."
- **Expected:** the new-format NHI validates; an invalid one is rejected with a reason.

### Beat 3: no personal information in Xero

- **Click:**
  - Open **Demo: Billing Monitor & Xero**.
  - Pause on the **No personal information in Xero** callout, then the **Contacts** tab: patient and
    guardian contacts are named only by their hidden ID ("Patient PT0017", "Billable party BP0001").
- **Say:** "No personal information goes into Xero: no NHI and no patient name, only a hidden
  internal ID that links each transaction back to the billing system. AA confirmed this rule."
- **Expected:** the callout states the confirmed rule (no RFP-contradiction callout), and no patient
  or guardian name shows on any Xero contact or record; hospitals, insurers and the anaesthetist
  payees keep their names.

### Beat 4: Contract edits are audited

- **Click:**
  - Go to **Admin → Master data → Contracts**, type **Unisports** in the search, and open
    **UNI-001 · Unisports Ortho**.
  - Change its rate from **$93.47** to **$95.00**, then **Save contract**.
  - Open **Admin → Audit**, set **Entity type** to **contract**, and pause on the entry.
  - Back in **Contracts**, search **Face lift** and open **MER-001 · Face lift** (Merivale Plastic
    Surgery, $3,100.00 from 1 Jun 2026, **In force today**). Under **Price ranges**, enter a start of
    **1 Jul 2026** (already past) and **3200**, then **Add price range**. Open the seeded Booking it prices (**Admin
    Day view → Mon 10 Aug → Dr Souter's PM List → Sophie Matthews**).
- **Say:** "A Contract is edited in place, and every change is recorded with before and after. A fixed
  price changes from a date by adding a price range, and the start can be in the past: the Booking
  re-prices, while invoices already raised stay as they are. Any other change that must start on a
  date is a new Contract, and the old one is disabled, never deleted."
- **Expected:** the audit entry shows the pricing before and after; no invoice changes. The Face lift's
  first range now reads **1 Jun 2026 to 30 Jun 2026**, the new one **From 1 Jul 2026** (In force today), and Sophie
  Matthews' Booking total reads **$3200.00**; the audit shows **Price range added**.

**Worth pointing at (optional):** **Admin → Master data → Contracts**: Merivale's three combination
Contracts (search **H3**: Face lift, Facelift plus 1 add on, Facelift plus 2 add ons, each its own
Contract; fee extras are events, not Contracts), and Dr Souter's own prepaid price list (holder **Dr
Melanie Souter**: one Contract per item, every price above zero; a zero price is refused). Search
**CAT** to find the cataract items by name and the holder's code HNZCATall.
**Admin → Master data → RVG groups**: the NZSA RVG 2021 groups as
published under their anatomy headings, with AA's own beside them and unmarked; both T2s and both P6s
are separate rows; H4 reads **10 · range 10 to 12**. Add a group, then edit, retire and restore it:
each change is in **Admin → Audit** (entity type **rvgGroup**).

**Discovery points:** the RVG groups are seeded as published with AA's own rows beside them (demo-sized;
the full set loads at go-live), and the same code can sit on several rows, told apart by description and
base units; the RVG code on a Procedure is optional, picked by type-ahead; a ranged group holds its
published range, shown to the anaesthetist, and starts at its lower figure (OQ-101); the demo-plausible
modifier values (not an
authoritative NZSA schedule); and the concurrency model (single-user by design, audited
last-write-wins, with the multi-source reality shown via the audit trail and live integration updates).

---

## Recommended run orders

| Audience | Order | Time |
|---|---|---:|
| General evaluation | S1, S2, S3 | 15 to 18 min |
| Finance-led | S3, S4 (money beats), S5 | 15 min |
| Integration-led | S1, S4 (integration beat), S2 | 15 min |
| Full deep-dive | S1 through S5 | 30 to 35 min |

## What to narrate rather than click

- The full four-month scale and the production population of about 85 anaesthetists.
- The roughly 28,000 annual invoices and Xero active-contact volume (the archive job reduces a seeded
  aggregate counter to make the point).
- Health NZ's FHIR-first policy and real OAuth/Keycloak setup.
- Real email, OCR, Xero and hospital integrations: the prototype simulates them in-browser.

The most persuasive clicks are the state changes: a message or manual booking creates a Booking; Finish
now changes Time units and fee; Booking completion enables submission; submission changes who may edit;
authorisation locks the List; the billing run generates invoices; the invoice-detail shortcut records
payment and payout; the Web Payments history keeps the settled invoice visible.

## Recovery from demo accidents

- S1 to S4 start from the common reset seed, so the fastest recovery is **Reset → Confirm reset**.
  S5 still has scenario-specific preparation, so recover it through its **Jump → Confirm jump**.
- Or use **Reset → Confirm reset** in the shared top bar from any app. The same control remains under
  **Clock & reset** in the control panel. Reset returns the clock to Tuesday 21 July 2026, 8:00 and
  restarts deterministic identifiers, so invoice numbers begin at the same point every time.
- The Integration simulator also has **Reset demo data → Confirm reset** beside Start live feed. It
  performs the same whole-demo reset without making you return to the control panel.
- Lost the screen a demo action lives on? The control panel's **Demo actions by screen** has an
  **Open screen** link for every entry (with a hint where a tab is needed, such as Surgeon PDFs).
- If **Finish now** was stamped too early, reset and advance the clock before reopening the Booking.
- A stray refresh is no longer a problem: it returns you to the same screen. If you have clicked
  somewhere unexpected, the browser back button retraces your steps, or paste the beat's address from
  **Direct URLs** above.
- Reset leaves the integration auto-retry timers scheduled, but a guard makes any stale timer a safe
  no-op; it will not disturb the fresh state.
- Keep this document or the master HTML in a second tab, not the Data Inspector.
