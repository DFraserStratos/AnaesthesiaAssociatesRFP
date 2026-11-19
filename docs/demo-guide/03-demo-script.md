# Demo Script — S1 to S5

The canonical presenter run-sheet. Each scenario has a **stage it** step, then beats with **Click**
(presenter choreography only), **Say** (the story to tell between actions), and **Expected** (what you
should see). The Click lists deliberately contain only navigation, selections, button presses, and
useful pauses. Every scenario resets first, so you can start cold and recover from a mistake.

The whole flow is clickable. Nothing below is narrate-only.

## The one continuous object

Where a scenario needs a worked example, use one recognisable business object:

> Dr Melanie Souter's operating Lists, at Southern Cross, St George's and Forte Health.

The seed keeps her design-day tableau (Tue 21 Jul), the multi-procedure and fee-split Lists (Mon 20
Jul), a submitted review-queue List (Mon 13 Jul AM, the three-procedure Booking), forward Lists for
the integration bookings (Tue 28 Jul), and the unfinished Margaret Ellison Booking designed for live
capture.

## Pre-demo setup

1. Open the prototype at a desktop resolution wide enough for the web and admin layouts.
2. From the app switcher, open **Demo: Control Panel**.
3. Under **Clock & reset**, select **Reset demo data**, then **Confirm reset**.
4. Confirm the demo clock reads Tuesday 21 July 2026, 8:00.
5. Keep this document (or the master HTML) open in a second tab. Do not present from the Data Inspector.
6. Optional check: **Admin → Intake** opens on Matching with one seeded row waiting (Mere Tipene, no
   NHI), and its **PDF lists** tab holds Mr Okafor's list, not yet sent. Hospital files are imported by
   the office; nothing syncs.

The control panel is the **index**, grouped: **Clock & reset**, **Scenario jumps (S1 to S5)** and
**Demo actions by screen**. Each scenario jump confirms first, resets the data, applies any extra
preparation needed, and prints where to go next with one-click navigation. S1 to S4 can instead begin
from the ordinary Reset control. Use the live clock immediately to the right of the app switcher to
advance time without leaving the screen you are presenting.

**Demo actions live on their screen.** A simulated event (a hospital file import, a payment webhook, a
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
| Intake, Matching | `/admin/intake/matching` (`/admin/intake`, and the old `/admin/matching` and `/admin/integrations`, open it) |
| Intake, PDF lists | `/admin/intake/pdfs` |
| Intake, Data quality | `/admin/intake/quality` |
| Intake, Validators | `/admin/intake/validators` |
| Booking detail | `/admin/day/2026-07-21/bookings/<bookingId>` |
| Conflicts | `/admin/conflicts` (hospital closures only; filters in the URL, e.g. `?hospital=`, `?cleared=1`) |
| Review queue | `/admin/review` |
| One List under review | `/admin/review/<listId>` |
| Invoices | `/admin/invoices` |
| One invoice document | `/admin/invoices/<invoiceId>` |
| Billing monitor | `/admin/billing` |
| Ledger (the whole ledger) | `/admin/ledger` |
| Ledger, one anaesthetist | `/admin/ledger/anaesthetists/<anaesthetistId>` (Dr Souter: `34821`) |
| Master data | `/admin/masters` (one view: `?view=surgeons`, `?view=anaesthetists`) |
| Availability statuses | `/admin/masters?view=availability-statuses` |
| Contracts | `/admin/masters?view=contracts` (one holder: `&holder=PY-COS`) |
| Specialties | `/admin/masters?view=specialties` |
| Funding tags | `/admin/masters?view=fundingTags` |
| Recurring bookings | `/admin/masters?view=recurringBookings` |
| Hospitals & holidays | `/admin/masters?view=hospitals` (List or Calendar) |
| Surgeon profile | `/admin/masters/surgeons/<surgeonId>` (Ms A. Reid: `S-REID`) |
| Surgeon with a PA | `/admin/masters/surgeons/S-DALGETY` (Dr H. Dalgety, Avonhead ENT: Bev, PA) |
| Anaesthetist record | `/admin/masters/anaesthetists/<anaesthetistId>` (Dr Priya Sharma: `41267`) |
| Audit | `/admin/audit` |

The demo surfaces are `/demo/control`, `/demo/xero`, `/demo/integrations` and `/demo/data`.
`/demo/integrations` is **Demo: Future scope, HL7 and FHIR** in the app switcher: the simulator, with
its message log (retry and dead-letter) at `/demo/integrations/log` and its feed mapping at
`/demo/integrations/mapping`. The
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

**Serves:** the hospital's file imported onto the matching screen, the wording kept as received, the
office's Contract choice, a booking with no NHI waiting as a stub, the rooms' PDF list and where a List
came from, and BTM capture. **Time:** 6 to 8 minutes (5 without the optional Beat 1b).

**Stage it:** use **Reset → Confirm reset** (or control panel, **S1 · Booking to theatre → Jump**),
then open the Anaesthetist Mobile App. The Tue 28 Jul St George's AM List holds three booked,
not-yet-captured cases, so the hospital's booking arrives into a working List rather than an empty one.

### Beat 1: the hospital's file arrives

- **Click:**
  - In Mobile Lists, open Dr Souter's Tue 28 Jul St George's AM List and read its three booked cases
    (07:45 knee arthroscopy, 09:45 shoulder arthroscopy, 11:15 wrist ORIF). Two of them read as the
    surgeon's rooms sent them: "L knee scope + partial menisectomy" and "ORIF # R dist radius"
    (illustrative demo wording, AI-made, not AA's).
  - Go to **Admin → Intake** (under Day view; the amber badge counts open rows). It opens on the
    **Matching** tab. Select **Import hospital file** (or **Demo actions → Import hospital file**) →
    **St George's theatre list, Tue 28 Jul to Tue 4 Aug**. Five rows are imported and the stats strip
    fills: OPEN, NEW, MODIFICATIONS, CANCELLATIONS, UNMATCHED.
  - Open **Sarah Mitchell**'s row (R1, New). Read the wording as the hospital sent it,
    `lap appy ?conv to open`, and the suggestion, **Create Booking on Dr Souter, Tue 28 Jul AM**.
  - Select **Create Booking** in the footer.
  - Back in Mobile, reopen the Tue 28 Jul AM List.
- **Say:** "The office imports each hospital's file through the integration, one theatre list a day.
  Every row lands here, and nothing reaches the schedule until the office decides, even an update to a
  Booking already matched. The hospital's text is kept exactly as sent; on a Booking the rooms sent
  first it replaces the rooms' text, and the original stays in its change history. Automatic sync is
  later work."
- **Expected:** the row moves under **Decided**; the List now carries a fourth Booking for Sarah
  Mitchell at 08:30, between the first two cases, source **Hospital download**, with no RVG code and no
  Contract. Her NHI matched an existing record, so her patient record is reused, no duplicate. The List
  reads **0 of 4 complete** and stays `ACTIVE`.
- **Optional aside:** on Matching open **R3 (Diane Foster)**, a Modification: the field differences
  with their tick boxes (time 11:00 to 12:15, the note "Bumped 15 min at surgeon request"), and the
  hospital's long text replacing "WLE MM" (the old text kept in the history, with a line saying it also
  becomes the invoice description). Untick a field and the footer count drops. Or import **St George's
  theatre list, a day later** to show Sarah Mitchell's update (09:00, a note, "Laparoscopic
  appendicectomy, may convert to open") waiting for approval, matched by date, surgeon, hospital and
  session.
- **Handset variant (PWA):** Mobile Lists (or the List or Booking) → **Demo** → **Hospital file
  imported and my booking matched** → **St George's file, Tue 28 Jul AM (S1)**. It stands in for the
  office: it imports the file, decides the rows for that List and sets **No contract · RVG** on Sarah's
  new Booking (Beats 1 and 1a in one). Run again, it reads **Nothing new from the hospital for your
  Lists**.

### Beat 1a: the office answers who pays

- **Click:**
  - Go to **Admin Day view**. Sarah Mitchell's Booking is on the **Needs an invoice destination** card;
    open it.
  - The step rail asks **Where does the invoice go?** Choose Payment type **Patient**, then
    **Standard: No contract · RVG** (pinned first).
  - Leave the RVG code empty.
- **Say:** "The hospital does not choose the Contract; the office does. The payment type is always
  asked, and for a patient paying on the RVG the code is the anaesthetist's to pick when she captures."
- **Expected:** her Procedure reads **No contract · RVG** with the RVG code still to choose, and she
  leaves the Needs an invoice destination card. Her invoice description starts as the hospital's text
  (the Contract's invoice description replaces it where filled in).

### Beat 1b (optional): a booking with no NHI

- **Click:**
  - On **Admin → Intake → Matching**, **Import hospital file** → **Southern Cross theatre list, Tue 28
    Jul to Thu 6 Aug**.
  - Filter **Unmatched** and open **Tama Henare** (no NHI). Optionally open Dr Souter's Tue 28 Jul PM
    List to show the stub in her place.
  - Optionally type the NHI **ZQA1008** and press **Add NHI**.
- **Say:** "A row with no NHI never becomes a Booking until the office adds the NHI, but the
  anaesthetist still sees the case coming: a stub stands on the List in its place."
- **Expected:** the row waits under Unmatched; the stub stands on Dr Souter's Tue 28 Jul PM List,
  "Waiting at intake: no NHI · The office is resolving this". Add NHI makes the Booking take the stub's
  place. S4 Beat 4 tells this in full.

### Beat 1c: the rooms' PDF list

- **Click:**
  - On **Admin → Intake**, open the **PDF lists** tab. Open **Mr Okafor's** list (Forte Health, Wed 5 Aug
    AM, a session in Dr Rutherford's schedule with no List yet), sent from
    **leanne.pa@avonsidesurgical.example**.
  - Row 2, **Margaret Ellison**: the NHI printed **ZAA0068** is flagged invalid. Correct it to
    **ZAA0067**; the correction shows under the row.
  - Select **Send to matching**. Three rows land on Matching, marked **Rooms PDF**, with the rooms'
    wording.
  - On **Matching**, open **Brian Holt**'s row → **Create a List in a session** → Dr Rutherford →
    confirm. Then open **Margaret Ellison**'s and **Hemi Parata**'s rows and **Create Booking** on the
    new List (their suggestion). The re-send below shows a difference only for a row already decided.
  - Open the new List (or one of its Bookings): it reads **From a rooms' PDF · sent from
    leanne.pa@avonsidesurgical.example** and **Replies go to** that address.
  - Back on **PDF lists**, **Demo actions → Receive updated PDF from rooms** → **Run**. The re-sent list
    arrives from **admin@avonsidesurgical.example**, marked **Re-sent**. Open it and **Send to
    matching**.
- **Say:** "Both sources land on one screen. The List keeps who sent it, so updates and NHI requests go
  back to whoever sent it, not just the surgeon's first office contact. The rooms send the whole List
  again whenever it changes: a re-sent List is matched to the earlier one by surgeon, hospital, date and
  session, which is our reading. A patient dropped from a re-sent List is not yet detected; that is
  Future Work."
- **Expected:** after the re-send, unchanged rows are skipped; Margaret Ellison's changed time (09:15
  to 09:45) waits as a difference for approval, and a new patient, **Ruth Calder**, arrives as a new
  row. Applying a re-sent row makes the List's sender the newer address, the earlier one kept in
  History.

### Beat 2: the Booking fills over the days before theatre

- **Click:**
  - Open the live clock beside the app switcher.
  - Select **Procedure day · 28 Jul → +1 hour** so live capture starts at 09:00.
- **Say:** "Between booking and theatre, patient and booking data can change right up to the day. The
  canvas rolls forward deterministically as the clock advances."
- **Expected:** the clock reads Tuesday 28 July 2026, 9:00.
- **Optional aside:** open Dr Souter's **Tue 4 Aug AM** List → the **09:30 "right total knee"** Booking
  (Sione Davies). Say: "The rooms sent 'RTK'; when the hospital's list arrived it replaced that with
  'right total knee', and the original is in the Booking's history. The Booking shows only the latest
  text; the Contract and its RVG code sit together in the Billing card below it." Open **History** to show "Procedure text replaced" naming 'RTK' (Surgeon's rooms PDF). The
  wording is illustrative demo data, not AA's.
- **Optional, live:** on the same List open **Diane Foster** (11:00, "WLE MM", RVG code to choose).
  Then on **Admin → Intake → Matching**, **Demo actions → Send update for a matched Booking** (it defaults to
  Diane Foster; or use R3 of the St George's import) → open the row → **Apply 3 changes**. The
  hospital's fuller text replaces "WLE MM", which stays in the Booking's change history, and it also
  becomes her invoice description unless the Contract's invoice description is filled in or an admin
  edited it; her time moves to 12:15 with the note. Handset: the stand-in's **A hospital update for
  this Booking, approved by the office**.

### Beat 3: capture BTM on mobile

- **Click:**
  - Go to **Anaesthetist Mobile App → Tue 28 Jul St George's List → Sarah Mitchell**.
  - She reads the procedure text first: `lap appy ?conv to open`, what the hospital wrote. Her Booking
    arrives with no RVG code (the hospital sends the text only). Tap the **Billing** card to open
    its sheet, type **appendicectomy** in the RVG code field and pick **A3 · Appendicectomy,
    laparoscopic · B 5**, tap **Done**, then **Start now**.
  - Without leaving Sarah, select **live clock → +1 hour**, close the popup (Escape, or a click outside it), then select
    **Finish now**.
  - In the modifiers step, tap the teal **None apply** (it then reads **No modifiers claimed · Change**).
  - Select **Mark complete**.
  - Optional, to show the completion gate: back on the List, select
    **Mark list completed · 3 to finish**.
- **Say:** "She sees what the hospital wrote, picks the RVG code, and the Billing card shows the
  Contract; a quiet Price card shows what it comes to as she records. The anaesthetist captures the billing inputs, not just a dollar figure. The fee is Base plus
  tiered Time plus Modifiers at her own value per unit. The List only goes to the office once every
  active Booking is complete, so one captured Booking out of four submits nothing yet. That gate is the
  reason the List is the unit of approval, not the Booking."
- **Expected:** the RVG code in the Billing card reads **A3 Appendicectomy, laparoscopic · Base 5 units · from the RVG
  group**, and B reads 5. The **Price** card reads **5 units x $26.50 = $132.50** once A3 is picked and
  rises as the time units come in at Finish now; the dock strip above Mark complete shows the same
  total. Sarah changes the List from **0 of 4 complete** to **1 of 4 complete**. The List action then reads **Mark list completed · 3 to finish**; tapping it opens the
  **Bookings still to finish** sheet, which names each remaining Booking by time and patient with what it
  needs. The List stays `ACTIVE`. S2 Beat 4 carries the submitted-to-authorised half of the handoff from
  the seeded Review queue.
- **Worth pointing at:** the price ticks up as she claims a modifier or adds time, with no prompt: claim
  a modifier instead of **None apply** and the Price card and the Booking total above **Mark complete**
  rise by its units. On No contract · RVG she may type a different price (no reason asked; the RVG detail
  stays recorded); the office sees the full billing view on the Admin Booking in S2. Scroll down
  once and the masthead folds to a nav row to make room. If Mark complete finds missing data, the Booking
  moves directly to the first incomplete control and focuses it. Optionally, in the type-ahead type
  **H1** (every H1 row, each with its description and base units) or **T2** (three rows share the code,
  told apart by description and units). Modifiers: there is no ASA step; only the age modifier and a
  modifier the base units include are pre-applied, and either can be removed; anything else the
  anaesthetist claims, ASA included, asks for a short reason when it is claimed (open Margaret Ellison on
  Dr Souter's Tue 21 Jul PM List for the pre-applied A1, from her age of 72). For an included
  modifier, open Callum Graham on her Mon 27 Jul PM List (RVG code S3a): P1 shows selected at 0 and
  cannot be added twice. S2 Beat 3c moves that List to Dr Ropata, so show it before then or after a
  Reset.
- **Worth pointing at (what a Procedure asks for):** the form follows the Contract's pricing kind. On
  an RVG price (No contract · RVG and the RVG rate and discount kinds) the RVG code, the start and finish
  times and the modifiers step are required, each with a **Required** caption; the modifiers step is
  answered by **None apply** or by claiming a modifier. On a fixed or open price there are no times,
  units or modifiers, and the RVG code is optional, "for reference". Mark complete checks exactly three
  things: a Contract, the RVG detail on an RVG price, and a price (not **Needs a price**). It does not
  check the RVG code on a fixed price, the payer's contact, the approval number or out-of-range base
  units. Something only the office can fix shows a pointer to **Alert the office**; submit still needs
  every Booking complete.
- **Optional aside (fixed price, no times):** on Dr Souter's Mon 10 Aug PM List
  (`/mobile/lists/L-34821-2026-08-10-PM/bookings/BK0176`), Miriam Holloway's Merivale "Facelift plus 1
  add on" asks for no times or modifiers and completes as she is. Graham Pulley on the same List
  (No contract · Fixed price) shows **Needs a price** and refuses Mark complete until an amount is typed.
- **Optional aside (who may type a price):** Dr Souter's Mon 27 Jul AM List at Forte
  (`/mobile/lists/L-34821-2026-07-27-AM/bookings/BK0186`). Tama Rewiri (No contract · RVG) reads
  **4 units x $26.50 = $106.00** with a **Price $** field: she may type a price, no reason asked, and at
  $0.00 the card says "The RVG detail stays recorded. This gives a no-charge invoice." Natalie Brennan
  (Forte Health RVG less 10%) reads **6 units x $26.50 = $159.00**, **Discount 10% · minus $15.90**,
  Price **$143.10**, read-only: "Set by Forte Health RVG less 10%. To use a different price, change the
  Contract or alert the office." Heather Sinclair (Aria Skin and Laser Clinic, RVG at the Contract's
  rate, $26.50 a unit) is read-only the same way. Her own prepaid price list (Annette Riley, Fri 24 Jul
  AM) is read-only too.

**Discovery point:** settled: a part time interval always rounds up under the RVG tiers (confirmed with
AA, OQ-75); the tiers are held as data, shown read only under **Admin → Master data → RVG groups**, and
the T row reads **From start and finish stamps · RVG time tiers**.

**Discovery points (intake):** OQ-13, the shape of each hospital's file: the fields and cadence, and
whether it carries the insurer, the procedure wording and an appointment id. Two build choices to
confirm: when a re-sent PDF comes from a later address, applying its row makes that address the List's
sender (the earlier one kept in History); and a List made by a recurring booking records its own
origin, "From a recurring booking", with no sender. Removals from a re-sent list (US-02.2.3) are Future Work, as are
bulk apply and AI-assisted matching. If Greg's "why is this a manual task" comes up: the first release
keeps the import gate with no automated decisions, and automatic sync, matching and updates are Future
Work (US-14.6.2).

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
    **Add status** and add **Teaching** (not open for bookings). Point at the four rows (Free, On holiday,
    Unavailable, Public). Then show the phone's **Add days off** choices, Public among them with its
    optional note.
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
  dashed Free blocks are empty sessions; the coloured blocks are Lists. The legend reads Private, Pre-op,
  then the availability statuses from master data: Holiday, Unavailable, Public, Free. Dr Ropata's AM
  reads Public with its note, CPH (a Public session shows its note and no List detail; it is a status, never a
  List). Dr Ngata's AM is Unavailable (his leave) with no Draft List. A Draft Lists card in the right
  rail and a Draft Lists band above the grid hold only St George's PM, Mr S. Tan, waiting 16 h; every
  List block shows its booking count; the nav shows Draft Lists 10 and Conflicts 16.

### Beat 1b: a List with no anaesthetist yet

- **Click:**
  - Open the band's **St George's** block, point at **Available that session** and the tier pills, then
    select **Assign → Dr Emma Fitzgerald** (Free) **→ Assign Draft List**.
  - Optional, if time allows: **Draft Lists** in the side nav. Show the date order and Dr Beaumont's
    Wednesday 22 Jul Lists at Southern Cross (LD-RCB020, LD-RCB021) or the Fri 24 Jul AM one (LD-RCB022)
    waiting, recurring bookings that landed on days Dr Beaumont is away, then open **Forte Health · Mr V. Nand** (2 bookings)
    to show Bookings already on a Draft List. Or, in Demo actions, **Simulate incoming request**
    (Christchurch Eye Surgery, Ms A. Reid, Thu 23 Jul PM) **→ Assign**, point at Dr Sharma in **Not
    preferred with Ms Reid**, and pick a Free anaesthetist instead.
- **Say:** "A Draft List has its hospital, surgeon, day and session, and can already hold Bookings, but
  has no anaesthetist and changes nobody's schedule. Only the office assigns it, by picking the
  anaesthetist; the session is already set. Everyone who could take it is shown, ordered by the
  office's priority tiers, with any not-preferred pairing set apart. Those warn, and never block, and
  anaesthetists never see them. Once assigned, it is an active List in that anaesthetist's day. A
  cancelled request is removed, or its date changed."
- **Expected:** the band empties; Fitzgerald's PM shows St George's, Mr S. Tan;
  the drawer shows ACTIVE and its History shows the Draft List created and assigned on the same List.

### Beat 2: a phone-advice booking

- **Click:**
  - Open **Dr Priya Sharma's Tue 21 PM Free session → Book (phone advice)**.
  - Choose **St George's Hospital** and **Mr T. Hale**; keep the default times (13:00 to 17:30).
  - Select **Continue to add booking → Look up**.
  - Pause on the populated booking.
  - Under **Contract**, select **Choose**: **St George's** (the List's hospital) → its funding tag
    (ACC, the only one, fills itself in) → the Contract → **Use this Contract**. Point out that an
    RVG-priced Contract leaves the RVG code to the anaesthetist. Once saved, the same steps show on the
    Booking's **Billing** card.
  - Select **Review → Save booking → Done**.
- **Say:** "Phone and PDF remain first-class booking channels. The design improves those fallbacks
  rather than pretending they disappear."
- **Expected:** the lookup fills the complete booking and leaves every field editable, including the
  **Procedure description** (what the caller said, kept exactly as typed, **Told by: Phone**). The saved
  Booking's Procedure card shows that wording with "Phone". The session now
  holds a Private List with the new Booking, and the anaesthetist's web and mobile views and the
  availability finders show it as booked.
- **Worth pointing at:** "Where does the invoice go, then the Contract. Each step only offers Contracts
  that fit this List, and typing finds one among hundreds. No contract · RVG and No contract · Fixed price,
  first in every list, cover anything no price list has yet. The anaesthetist sees the same steps and can finish or change it until the list is authorised."
- **Optional one-liner:** "Assign List does the same without a patient, for a session booked ahead."
- **Optional office aside, "the hospital's wording arrives":** **Admin Day → Tue 21** → Dr Souter's PM
  List → **Wiremu Tane** (the rooms' "lap chole +/- IOC", illustrative) → **Demo actions → Hospital
  description arrives** (defaults to "lap chole") → **Run**. The Procedure card now shows the hospital's
  wording, the rooms' is in the History. Say: "The invoice prints a description of its own: the latest
  text, or a Contract's own invoice wording where it has one; never the RVG code."
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
  was prepaid, the amount sits in the AA Holding account and is transferred to whoever did the List
  when the office authorises it; nothing is recalculated."
- **Expected:** the done state ("Moved to Dr Whitaker." and "The office has been told."), her List
  one Booking shorter and still there, a new List on Dr Whitaker's row, and the pool row (only because
  the box was ticked; without it there is no pool row, and Dr Whitaker still sees the move on his
  side). No warning, preference or tier anywhere on her side. The submit sheet on any of her Lists
  carries one sentence: "Submitting says you did every procedure on this List. If a colleague is doing
  one, move it to them first."
- **Presenter note:** say the prepaid line here; the AA Holding account and its transfer at
  authorisation are shown in S4 Beat 7. A moved prepaid Booking needs no change: the transfer pays
  whoever did the List. A prepaid Booking (Fri 24 PM, Priya Nair) shows "This Booking is prepaid. The prepaid amount stays as agreed, and moves to Dr ...
  once the List is authorised." on the confirm step; Reset after moving one.

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
  - Pause on the submitted List, then select **Authorise for billing**, then **Authorise for billing**
    again in the confirm.
- **Say:** "The office reviews the Bookings as a set, a human sanity check, not an automatic gate. If
  something needs clarification the office phones and corrects it here. The List is never returned.
  Authorisation locks every Booking and hands the whole List to the Billing Engine. Each row shows what
  the office checks: every Procedure's text, Contract with who is invoiced, and RVG code, the payer, the
  insurer or funder with its approval number, any alert from the anaesthetist and any edit since
  submit. Flags point at what needs a look, a Contract she changed, a typed price beside the computed
  one, a Contract that no longer fits the List, but no flag blocks. The one thing that stops
  authorise is a Procedure that still needs a price, because authorising locks each Procedure's
  Contract and price onto it. The office approves or corrects each Contract change, and authorising
  approves the rest."
- **Expected:** Dr Morrison's Mon 20 Jul AM (`/admin/review/L-25490-2026-07-20-AM`) raises no flags.
  Each row shows its Procedure stack (procedure text, Contract with who is invoiced, RVG code) and who
  pays: here **Paid by St George's** on every row; where a patient or insurer pays, a teal **Change**
  beside the payer opens the Admin Booking. The authorisation
  banner appears, rows lock, and the Review queue count falls. Until
  this moment the List stayed on Dr Morrison's main view, less prominent, and she could still change
  it; if she had, Review would show **Changed since submitted** with the count. Now it leaves her main
  view and her search finds it.
- **Optional aside (the review-flags List):** open **Review queue → Dr Alistair Chen, Tue 14 Jul AM
  (Christchurch Eye Surgery, Dr Whitford)** (`/admin/review/L-45178-2026-07-14-AM`, five Bookings). Diane Fairweather
  (08:00) reads **Changed by Dr Chen: was Cataract IOL (LA by Anaesthetist)**, now Christchurch Eye
  Surgery RVG: select **Approve** (it reads **Approved** with the time) or **Correct**, which opens the
  Booking's rail. Owen Prendergast (09:00, No contract · RVG) reads **Price typed: $1,200.00 (computed
  $265.50)**. Hemi Walker (10:15, No contract · Fixed price, no amount) reads **Needs a price** and **Not
  marked completed**, and **Authorise for billing** stays disabled, naming her ("Hemi Walker: Needs a
  price: No contract · Fixed price has no price of its own.", with an **Open** link): the office types
  a price and completes her Booking before authorising. Rosalind Kerr (11:00)
  carries a Merivale fixed price linked to Ms Lim, so it reads **Contract not offered on this List**.
  While any change waits, the action bar offers **Approve all N Contract changes**; authorising
  approves any still waiting, and the confirm says how many. A Disabled Contract raises a flag, never a block: a Procedure not yet authorised and dated on or after the day its Contract was disabled reads **Contract disabled on <day>**; earlier-dated ones are not flagged, and **Make active** clears it. In this List Margaret Ellery's cataract, on Christchurch Eye Surgery 2025 rate (disabled Fri 10 Jul by Kirsty W.), reads **Contract disabled on Fri 10 Jul**. On the
  phone the anaesthetist sees **Awaiting office approval** under the Billing card, then **Approved by the
  office** with the time.
- **Optional aside (a moved Booking keeps its Contract):** on **Admin Day → Mon 10 Aug**
  (`/admin/day/2026-08-10`), Move Fiona Lattimer (Merivale Face lift, Dr Souter's PM List at St George's
  with Ms Lim) to her Mon 10 Aug AM List (Forte, Mr Okafor). The Booking keeps its Contract, and review
  flags it **Contract not offered on this List**; move it back and the flag clears. No
  move ever resets a Procedure's Contract or typed price.
- **Optional aside (the payer review List):** open **Review queue → Dr Alistair Chen, Fri 17 Jul
  (Christchurch Eye Surgery)**. Point at the warning triangles: Ella Moana, 15, is the payer (a mild
  child payer warning) and Janet Ormsby's insurer, NIB, has no approval number (the only insurance
  warning). Kevin Doherty's row carries **Email or postal address needed**; the Whitcombe Family Trust
  pays by post with no flag; Peter Tawhiri is funded by Health NZ, a funder, so nothing warns. Clear one
  warning from the Day view's To-do card, then authorise the List anyway: nothing blocks. Its invoices
  show the two other delivery cases: the Whitcombe Family Trust's is **To post** (a **Simulated
  posting** badge and a **Provisional (OQ-122)** pill), and Kevin Doherty's raises **No invoice
  address**, where the office types an address on the Delivery card and selects **Send**. The payer
  now sits on each Procedure, on its **Paid by** line (Review's rows show it too: "Patient pays",
  "Payer: Whitcombe Family Trust (Family trust)", "Paid by nib"). Joyce Halvorsen's 13:30 Booking has
  two Procedures with Erik Halvorsen (Son) typed in separately on each, so authorising raises two
  invoices, one per payer: "payers are never matched on name or email". The child warning ("Under 18")
  shows on each of her Procedures, with one to-do row per Booking. Kevin Doherty's **Email or postal
  address needed** clears once a postal address is typed on his Paid by. On Admin Day,
  **Demo actions → Raise sample warnings** brings a child payer warning back on Grace Park's Booking
  (Fri 24: two Procedures, both paid by Hana Park, Mother), and **Clear sample warnings** puts Hana
  Park back as the payer.

**Discovery points:** open (OQ-139): what the office needs to know about public sessions. The prototype keeps Public as a status with an optional note (such as CPH), set by the anaesthetist or the office, never a List and never billed; reopen if Vanessa says the office uses more. Settled: soft warning (OQ-09), and the Draft List questions (OQ-44, OQ-64 and OQ-86 are answered); settled: the anaesthetist's calendar is painted
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
answered), and the status values are a list AA maintains, starting from Free, On holiday,
Unavailable and Public, with the final values to be agreed with AA's users and kept apart from a List's state
(Active, Submitted, Authorised; Draft for Draft Lists from Phase 31; US-01.2.2); settled: whoever moves
a List is asked what the vacated session becomes, Free or Unavailable (OQ-84); settled: notices are
active until an admin ticks them resolved, nothing expires, and alerts to the office join List moves in
the pool (OQ-79); open: the panel's place and layout are our design for AA to check (US-13.8.1), and
whether an alerted Booking may still be submitted (the prototype allows it); whether monitoring belongs
in Admin Web or a separate surface (the prototype places it in Admin Web); and the pre-op and acute pairing reading (AA rooms as a location; a named surgeon on pre-op and acute Lists).
Settled (US-01.1.6, D84): an out-of-hours session after PM is a third kind of session the office opens for an
anaesthetist on a day, one a day; any List goes in it, new or a Draft List for the evening; it is a full
session for availability. Open: who opens one when the office is closed. Its Bookings are billed as on any
List (our reading; no after-hours pricing).

---

## S3 · Money end-to-end

**Serves:** the Billing Engine at the centre, the multi-procedure rule, the Xero pair, the two
separate money states, AA's own monthly fee, and the internal ledger that balances. **Time:** 8 to 10 minutes. This is the money story's payoff, so authorise live.

**Stage it:** use **Reset → Confirm reset**, then go directly to Admin. Both of Dr Souter's Mon 20 Jul
Lists are already in the Review queue: AM (Forte Health, the multi-procedure Booking) and PM
(St George's, the fee-split Booking: nib $132.50, Alan Prentice the rest). Her Mon 13 Jul AM List
(also Forte Health, the three-procedure Booking) waits there too; leave it for the optional point after
Beat 1. The Mon 20 Jul invoices do not exist until you authorise the Lists live; the run then sends
them.

### Beat 1: authorise and generate invoices

- **Click:**
  - Go to **Admin → Review queue**.
  - Process the two Mon 20 Jul Melanie Lists: authorise Mon 20 Forte AM (the confirm says authorising
    locks each Procedure's Contract onto it; the banner reads "3 invoices raised. 3 emailed, 0 to
    post."), then use **Next in queue** to authorise St George's PM ("4 invoices raised. 4 emailed, 0
    to post.").
  - On the authorised List, pause on the lock glyph beside each Contract in the Contract column, the
    rate in the totals row, **@ $26.50/unit (locked)**, and **Paid to Dr Melanie Souter** on each row.
  - Optional: open Ruth Kim's Booking (`/admin/day/2026-07-20/bookings/BK0023`): the Billing card
    carries **Contract locked at authorise**, and the Office billing setup is read only, from the
    locked record: Contract Forte Health RVG · FORTE-001, Billed to Forte Health, Price $344.50 (13
    units @ $26.50/unit (locked)), Paid to Dr Melanie Souter, "Locked Tue 21 Jul, 08:00 by Kirsty W."
  - Select **View invoices → AA-2026-0002 · Brian Holt → View**.
  - Pause on the **Delivery** card on the invoice rail: the run already emailed it ("Emailed to ... at
    08:00", a **Simulated send** badge, **Resend** and **Print**), and the **Locked record** card the
    invoice was raised from (the Contract and its settings, who is billed, the price, the split, who is
    paid). Then pause on the invoice's head: Dr
    Melanie Souter as supplier with "GST number 104-348-211", the agent block ("Issued by Anaesthesia
    Associates Limited as agent for Dr Melanie Souter. AA GST number 102-345-678.") with its
    **Provisional (OQ-29)** pill, and GST (15%) at the foot.
  - Select the **Invoices** breadcrumb at the top, locate the fixed comparison rows and pause:
    - **AA-2026-0002 · Brian Holt · Forte Health · $365.70** is the one-invoice multi-procedure
      Booking (additional procedure on its own time units; modifiers stay on the primary at 4 or
      fewer): its additional line's BTM breakdown reads "Additional procedure: Time 2 units at
      $26.50". (It read $396.18 before catch-up Phase 19b: his ASA II no longer seeds a modifier
      unit, because the RVG table prices ASA I or II at 0.)
    - **AA-2026-0005 · Alan Prentice · nib · $152.38** and **AA-2026-0006 · Alan Prentice · $91.43**
      (billed to Alan himself) are the two invoices from the same fee-split Booking at 14:00.
  - Open **AA-2026-0005** ("Emailed to claims@nib.example"): the holder's layout. Point at the line's
    invoice description, the BTM breakdown ("Base 4 + Time 4 + Modifiers 0 = 8 units at $26.50"), the
    cross-match strip (procedure date and surgeon; no hospital reference) and the split note naming
    AA-2026-0006. It carries no **Your reference**: Alan's Procedure is on No contract · RVG and split,
    so nib's share has no holder reference code. The PM List's St George's invoices (its other two
    Bookings, on St George's RVG) print **Your reference SGANAES01**.
  - Back through the **Invoices** breadcrumb, open **AA-2026-0006** ("Emailed to alan.prentice11@example.net"): the
    patient's layout, the same lines without the BTM breakdown or the strip.
- **Say:** "The Billing Engine, not Xero, produces and sends every invoice as part of the run, in Dr
  Souter's name with her GST number and AA as agent. Authorising locked each Procedure's Contract onto
  it: the Contract's settings, the range in force, the rate and discount, the price, who is billed and
  who is paid. The run prices from that record alone, so a Contract edit after authorise changes
  nothing here. Each Procedure's Contract decides who is billed:
  its holder when the Contract bills its holder, otherwise the Procedure's payer, and Procedures that
  share a payer share one invoice. The layout
  follows the Contract (the holder's when it bills its holder) and GST is always added at the foot;
  the Party decides whether its invoice goes by email or post, and a payer with only a postal address
  gets 'To post'. Brian Holt had two procedures in one episode: base units and modifiers sit on the
  primary, the additional procedure bills its own time, and with one payer it is one invoice. Alan's knee arthroscopy was split on the Booking: nib pays $132.50 and Alan the rest,
  so nib is invoiced its share and Alan the gap, each on its own invoice. Xero follows as the
  receivables and banking service." Name the agent wording as provisional: it waits on AA's
  accountant (OQ-29).
- **Expected:** each authorised Booking carries **Contract locked at authorise**, and the run prices
  from that record: the Contract's settings, the range in force, the rate and discount, the price, who
  is billed and who is paid (Dr Souter), and the Prentice split. Invoice rows appear for both Lists
  with the figures unchanged: Forte AM, Brian Holt $365.70, Ruth Kim $396.18 and Esther Patel $274.28;
  St George's PM, nib $152.38 and Alan Prentice $91.43 (the split), then $365.70 and $304.75. One
  invoice for the multi-procedure Booking, two for the fee-split Booking, and AA-2026-0006 goes to
  Alan Prentice (the gap), not St George's. Review shows the lock glyph in the Contract column and
  "@ $26.50/unit (locked)". Each invoice shows its delivery stamp. Dr Souter's Mon 20 Jul Lists leave her main view (phone and web) as
  soon as the office authorises them, and their invoices show in her Balances at once, with no Next
  morning needed.
- **Optional aside (before authorising the PM List):** open Alan's Booking (**Admin → Day → Mon 20
  Jul → Alan Prentice**). The Billing card's Paid by line reads "nib $132.50, Alan Prentice $79.50 (the rest)"; press **Split** on its right (the phone has the same Split): the Paid by sheet opens with the split alone
  (**Change**, beside the payer's name, opens it with who pays). The split section shows the fee, $212.00, and each party
  with a $ or % share or **Takes the rest**, every amount live, and "$212.00 of $212.00". Type nib's
  share as **62.5%** instead of $132.50: the same split. Any user can split, including the anaesthetist
  on her own Booking (phone and web) until the List is authorised, and there is no split setting on
  the Contract. A share can also go to **Another person** (a name and an email or postal address).
  (Saving nib at 60% instead gives $127.20 and $84.80, $146.28 and $97.52 after GST, so
  the fixed figures above change; **Remove split** is on the same sheet.)
- **Optional aside:** the GST number is a field on the Admin anaesthetist record (**Master data →
  Anaesthetists**, the GST number column; Dr Oliver Strand reads "Not held"), not on the anaesthetist's
  own profile; blank prints "GST number not held". **Master data → Contracts** shows the read-only
  Layout and Delivery columns. The agency wording waits on AA's accountant (OQ-29).

**Worth pointing at (optional, the multi-procedure rule):** open Dr Souter's Mon 13 Jul AM List in the
Review queue (`/admin/review/L-34821-2026-07-13-AM`, Forte Health, Mr Okafor): Graeme Tullett's row
reads "M 7 · split 3 · 2 · 2". Open his Admin Booking (`/admin/day/2026-07-13/bookings/BK0184`): a
laparoscopic cholecystectomy as the primary (listed first, with the **Primary** pill), then umbilical
and inguinal hernia repairs. AS3, OB3 and emergency are claimed with their explanations and A1 is
pre-applied from his age (74): 7 modifier units, recorded once on the primary and split 3 · 2 · 2, the
remainder to the primary. The Booking total is **$636.00** (15, 4 and 5 units at $26.50). Select **Make
primary** on the umbilical hernia and confirm ("Make this the primary procedure?"): it moves to the
top, takes base 4 from its own RVG group and the 3 modifier units, and the total reads **$583.00**.
Make the cholecystectomy primary again and **$636.00** returns. Authorising the List gives one invoice,
to the patient. For the mixed Booking, open Mr Doyle's bariatric Booking
(`/admin/day/2026-07-14/bookings/BK0028`): a **$2,800** fixed-price primary ("Primary · fixed
price"), its hernia repair billed on its own time units ($61), and the note "No base units billed
(provisional, OQ-132)". Two demo actions (harness bar, and the PWA Demo sheet) go further: **Load
3-procedure Booking (7 modifier units)** adds the same Booking, not complete, to Dr Souter's next open
List (Wed 22 Jul AM; then disabled, "Already loaded on ..."), and **Hospital feed changes the primary**,
on any Booking with two or more Procedures, makes the next one primary, audited as the feed (refused on
a submitted List: "A hospital feed cannot change a submitted List").

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
  **Ledger pair (the system of record)** panel, which reads the Billing Engine's own ledger; read his
  name from there. The panel shows the pair's receivable and payable numbers (AA-2026-0005 and
  AA-2026-0005-P) and a **Matches the ledger** chip. On
  this pair, nib owes $152.38 and the payable to Dr Souter is $152.38: the payee is read from the
  Booking's locked record (who is paid was fixed at authorise), as is nib's share of the split. Each
  ACCPAY carries a
  **Buyer-created tax invoice** block, with provisional wording (**Provisional (OQ-29)**) naming Dr
  Souter as supplier (GST 104-348-211) and AA as agent (GST 102-345-678): one per invoice and the same
  value, so Alan's split gives two.

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
  anaesthetist app reads the Billing Engine's own ledger, AA's system of record. Xero mirrors it for
  receivables and banking."
- **Expected:** ACCREC shows paid, ACCPAY shows disbursed, and the Web Payments row remains visible
  with $152.38 received by AA, $152.38 released to you, $152.38 paid to you and **Paid to you**. It does not
  remain under Overdue because it is no longer outstanding. The Ledger pair panel reads "Ledger:
  received $152.38 · released $152.38 · paid out $152.38" beside Xero's same three figures, still
  **Matches the ledger**.

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
    counts three BCTIs, including **AA-2026-0005**, because Beat 3 paid it: **$515.00 + GST $77.25 =
    $592.25**. Priya Nair's prepayment (AA-2026-0001) is not one of them: a prepayment's payable is not
    counted as a BCTI.
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
  Dr Souter's July figures from the app if Beat 3 was skipped (then two BCTIs, $510.00 before GST,
  $586.50 with GST). The fee invoice is an AA fee pair on the Ledger, with no payable ("None"), outside
  the balance.

### Beat 5: the ledger balances

- **Click:**
  - Go to **Admin → Ledger** (`/admin/ledger`). Point at **In balance · receipts held equal payables
    due**, the equation beneath it, the four tiles and the empty **Anaesthetists out of balance** list
    ("Every anaesthetist's ledger is in balance.").
  - Switch the scope to **One anaesthetist → Dr Souter** (`/admin/ledger/anaesthetists/34821`): **AA
    owes Dr Souter** (Due now and Awaiting collection), **Dr Souter owes AA** (her unpaid AA fees),
    **Collected for them** and **Paid out to them**.
  - Back on **Whole ledger**, open **Demo actions → Inject unmatched receipt**, keep **Names Dr
    Souter**, then **Run**: the indicator turns **Out of balance by $120.00**, the nav's Ledger badge
    reads 1, and Dr Souter is on the out-of-balance list. Its **Open** shows her scope out of balance
    by the same $120.00.
  - In **Receipts with no matching invoice**, select **Allocate to invoice** and pick one of Dr
    Souter's receivables (her invoices are listed first; **AA-2026-0002 · Brian Holt** is at the top):
    back in balance, and the list is empty again.
- **Say:** "Every invoice is a pair in AA's own ledger: a receivable from whoever pays and a payable
  to the anaesthetist, created the moment the invoice is raised. Money in and money out are
  recorded here first, so the office can see at a glance that every dollar held is owed to
  someone. A receipt nobody can match shows up as an imbalance, not a mystery in Xero, and any
  anaesthetist whose ledger is out of balance is simply on a list."
- **Expected:** after Beats 1 to 4 as scripted, the whole ledger reads "Receipts held $1,380.00 less
  payables due $0.00 and the AA Holding account $1,380.00 = $0.00" (the $1,380.00 is Priya Nair's
  prepayment, held until her List is authorised), with Receivables outstanding $13,148.54, Receipts
  held $1,380.00, Payables due $0.00 and Disbursed $52,655.13 (Beat 4's seeded month of BCTIs
  included). Dr Souter's scope: AA owes Dr Souter $13,148.54 (Due now $0.00, Awaiting collection
  $13,148.54), Dr Souter owes AA $592.25 (her July fee invoice from Beat 4), Collected for them and
  Paid out to them both $27,372.38, and "Dr Souter's ledger is in balance". After the injected
  receipt: "Out of balance by $120.00" with the check line "Receipt with no matching invoice: Bank
  deposit · SOUTER JULY, $120.00"; Dr Souter listed at $120.00 ("Receipt with no matching invoice,
  $120.00"), and her scope reads "Dr Souter's ledger is out of balance by $120.00". After allocation:
  in balance, the list reads "Every anaesthetist's ledger is in balance.", the receipt's row reads
  **Allocated to AA-2026-0002**, and Payables due shows $120.00 (now due to Dr Souter, with the link
  "Run payables in the Billing monitor"). From a fresh reset with no S3 beats run, the tiles read
  Receivables outstanding $11,350.50, Receipts held $1,380.00, Payables due $0.00 and Disbursed
  $27,220.00; read the figures from the app if you skipped any beat.
- **Optional:** run the trigger again with **Names no one**: the whole ledger is out by $120.00 but
  the out-of-balance list stays empty. **Mark refunded** with a note returns it to balance, and the
  row reads Refunded with the note. The Billing monitor's payables panel has an **Open the ledger**
  link, and each invoice's rail has a **Ledger** card (receivable and payable numbers, their Xero ids,
  **Open in the ledger**).
- **Optional (the anaesthetist's side):** web **Accounts** opens on a **Your position** strip (AA owes
  you, with due now and awaiting collection; Collected for you; Paid out to you; You owe AA), and
  mobile **Balances** adds one line under Outstanding to you, "Collected $27,220.00 · Paid out
  $27,220.00" and "You owe AA $580.75" on a fresh reset. On a handset (the PWA), **Demo → Payment
  received · half**, then **Office runs payables** (office stand-in): Collected moves, then Paid out.
  The stand-in is disabled with "Nothing due to pay out" when nothing is due.

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
office needs this search too; the invoice count (one invoice per billable party per Booking; a Split
on the Booking gives one invoice per share); the split's open details (whether typed % shares must
total 100, and what the split lines say); the agency wording on the invoice and the buyer-created tax
invoice, and IRD's new name for that document (OQ-29); BCTI granularity (the prototype builds one per
invoice; per procedure, per payment or per run is open, OQ-29), and whether a prepayment's payable
counts as a BCTI (the prototype leaves it out, provisional, OQ-29); what other outputs a Party can have,
nib's portal among them (OQ-114); posting invoices to a payer with no email (OQ-122); and AA's fee
schedule and the paid-only BCTI count (with AA's accountant).
For the ledger (Beat 5): how AA wants unmatched receipts handled (allocate, refund, or hold for
investigation); whether the two scopes and the out-of-balance list are what the office needs
(US-13.2.1's acceptance criterion is to come from this prototype); and whether a buyer-created tax
invoice is one per invoice, as built, or one per procedure (OQ-29, with AA's accountant).

---

## S4 · Exceptions

**Serves:** resilience, the RFP's hard cases, and the audit trail that keeps them honest.
**Time:** 8 to 10 minutes. Use this for a technical audience; every sub-trigger is under **Demo
actions** on the screen named in its beat.

**Stage it:** use **Reset → Confirm reset**. Work top to bottom through the beats below.

### Beat 1: Pre-payment from a prepaid Contract

- **Click:**
  - Go to **Admin Day view → Tue 21 Jul**. In the right rail, the **Pre-payments** card under the
    **To-do** card lists **Annette Riley** (Awaiting approval, $1,200.00, In 3 days) and **Priya Nair**
    (Paid). The To-do card carries Riley's warning: "Prepayment of $1,200.00 from Annette Riley is
    awaiting approval on Invoices and has not been sent." Selecting her row in the card opens Invoices.
  - Open Riley's Booking (Dr Souter's Fri 24 Jul AM List): Rhinoplasty on Dr Souter's own prepaid
    Contract, $1,200.00 plus GST ($1,380.00), the patient as the Procedure's payer. The panel reads
    **Pre-payment awaiting approval**; there is no amount field and no raise button.
  - Go to **Admin Invoices**: the **Awaiting approval** card above the table, and its **Prepayment
    approval** switch. Select **Approve and send**. Optionally open the **Xero sim**: the pair is a
    receivable from the patient and a payable crediting the AA Holding account.
  - Back on Riley's Booking, **Demo actions → Payment received · half → Run**: it reads "Pre-payment
    part paid · $690.00 of $1,380.00 received".
  - Go to **Admin → Billing monitor**: the **AA Holding account** card under the AA fee invoices panel.
    On a fresh reset it held $1,380.00 for Priya Nair (AA-2026-0001, one Received entry); Riley's
    $690.00 now shows as a second Received entry and the balance rises by it. The card reads "Leaves only
    by a system transfer or refund" and carries the pill "Moves to the anaesthetist when the List is
    authorised · to confirm with AA". The payables run shows nothing due: nothing is paid to the
    anaesthetist yet.
  - Optional, in the **Xero sim → Invoices → XRB0** (Nair's pair): "Held in the AA Holding account", its
    ACCPAY card reading "Held until the List is authorised". The settle button, **Pay out of the AA
    Holding account**, is refused: "The customer payment is recorded. Money leaves the AA Holding account
    only by a transfer or refund the system raises."
  - Go to **Anaesthetist Mobile App → Dr Souter's Fri 24 Jul AM List → Annette Riley**: the triangle,
    the warning on opening, the read-only prepayment panel ("To you: Held by AA until the List is
    authorised"), and "Prepaid $1,200.00 · part paid · held by AA until the List is authorised" in the
    units block, with the price card reading **Prepaid amount** and no price field. Complete and
    submit: no confirm step, nothing blocks, no second invoice.
  - Optional, the mixed case: **Priya Nair** (Souter Fri 24 Jul PM) has her rhinoplasty prepaid
    (invoice AA-2026-0001, $1,200.00 plus GST, approved by Kirsty W., paid, its payable to the AA
    Holding account and held there) and her septoplasty on Forte's Contract, billed as usual. On
    **Authorise** the prepaid Procedure reads "Prepaid, left off the final invoice (AA-2026-0001)",
    with nothing deducted. Beat 7 authorises her List and follows the money.
  - Optional asides: on a Booking with no prepaid Contract, **Patient › Prepaid**, the **No contract**
    heading at the top of the list, **No contract · Fixed price**, type $2,000 ("just make it two
    grand"): it awaits approval at $2,000.00 plus GST ($2,300.00). **Demo actions → Add prepaid
    Booking → Two payers** (Admin Day or Booking detail) adds Fiona Gray with Rhinoplasty $1,200.00 to
    the patient and Blepharoplasty, upper lids $900.00 to Ian Gray: two rows on the strip, one invoice
    per payer, and approving one locks only that payer. Switching **Prepayment approval** off asks to
    confirm, then prepayment invoices are generated and sent at once.
  - Finally clear Riley's mild warning from the To-do card (it leaves the list, and her Booking shows
    who cleared it and when); Beat 6 re-opens it.
- **Say:** "The office picked Dr Souter's own prepaid Contract for this procedure, so it needs
  prepayment: the price, in full, not an estimate, and fixed once the invoice is raised. Whoever pays
  for this procedure is invoiced; if two procedures have different payers, each gets their own
  prepayment invoice. By default we approve it here, and AA can switch that step off. Approving sends
  it and credits the AA Holding account, not Dr Souter. The money is held there: nothing is paid to
  the anaesthetist yet, and it leaves only by a transfer or refund the system raises. Nothing blocks:
  the warning strengthens as the day approaches. After the procedure it is left off the final invoice,
  nothing deducted. A move to a colleague changes nothing in the books."
- **Expected:** awaiting approval, then the sent invoice with its pair to the AA Holding account, part
  paid on all three surfaces, the AA Holding account card holding both prepayments with nothing due in
  the payables run, and a submit that goes through. The Ledger (`/admin/ledger`) shows Riley's
  Pre-payment pair (AA-2026-0002, Payee "AA Holding account") beside Nair's; its AA Holding account
  tile rises from $1,380.00 to $2,070.00 with her half while Payables due stays $0.00, and the ledger
  stays in balance. Authorising the List (Beat 7) adds the transfer, two payable legs and no
  receivable, to whoever did it.

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
  - Go to **Admin Billing monitor → Demo actions → Trigger billing failure → Run**. It authorises Dr
    Ropata's Thu 16 Jul List with the Xero hand-off set to fail for one Booking.
  - Pause on the monitor's intro ("Each booking prices from its locked record, taken when the list was
    authorised. A failed booking is held back on its own while the rest of the list bills.") and on
    Dr Hannah Ropata's St George's AM List.
  - On the same screen, **Losa Tuilagi → Resolve & retry**.
- **Say:** "The engine prices only from what was locked at authorise, so a Contract edit can no longer
  break a run, and nothing is ever swapped for a default. What can still fail is outside the lock,
  here the hand-off to Xero. A List never fails as a whole: the failed Booking is held back and the
  rest of the List bills. The office retries once, without touching the Contract."
- **Expected:** Losa Tuilagi's Booking reads **Handoff failed** with its reason on the row ("Xero
  handoff failed (simulated fault). The invoice and its ledger pair stand, not yet in Xero. Resolve
  and retry from the billing monitor."; it read "No ACCREC/ACCPAY pair was created" before catch-up
  Phase 36, which creates the pair with the invoice); the Ledger's **Not yet in Xero** tile counts her
  pair until the retry; Hemi Walker's Booking reads **Handed off**, and the List is not
  failed. **Resolve & retry** hands hers off once: her row reads **Handed off** and her Xero pair
  appears, with no duplicate invoice. Her invoice (AA-2026-0003, Canterbury Orthopaedic Surgeons,
  $303.60) and Hemi Walker's (AA-2026-0004, St George's, $221.38) are unchanged. No Contract changes.
  (The numbers follow Riley's prepayment invoice, AA-2026-0002, raised in Beat 1; skip that approve and
  they are AA-2026-0002 and AA-2026-0003.)

### Beat 4: the unmatched queue

- **Click:**
  - Go to **Admin → Intake → Matching → Demo actions → Import hospital file** → choose **Southern
    Cross** → **Run**.
  - Filter **Unmatched**. Open **Tama Henare** (R4, no NHI): the panel says a stub stands on Dr Souter's
    Tue 28 Jul PM List. Optionally open that List first (Mobile Lists, or Admin Day, Tue 28 Jul) to show
    the stub: a dashed amber row at 15:30, after the 13:00 and 14:00 Bookings, reading "Waiting at
    intake: no NHI · The office is resolving this".
  - Back on Matching, type the NHI **ZQA1008** and press **Add NHI**.
  - Open **Grace Whitu** (R5, Thu 6 Aug PM, no List) → **Create a List in a session** → confirm.
- **Say:** "Nothing from a hospital is ever dropped. A row with no NHI waits here until the office adds
  it, and no patient or Booking is made. So the anaesthetist still sees the case coming, a stub stands
  on the List in its place: the time, name and wording as received, but it is not a Booking, it is never
  counted and it never blocks submit or authorise. When the office adds the NHI, the Booking takes the
  stub's place. A row that matches nothing waits until someone decides: create
  the List, put the Booking on a Draft List for the office to fill, or reject it with a reason."
- **Expected:** both rows sit under Unmatched; Tama Henare's stub stands on Dr Souter's Tue 28 Jul PM
  List (a triangle marker on the Lists row and the Admin Day block; progress reads "... · 1 waiting at
  intake" and the bar stays amber). Add NHI creates her Booking on that List with no Contract ("Needs an
  invoice destination") and the banner reads "The Booking takes the stub's place on the List."; the
  stub is gone and the audit reads **Stub replaced by Booking**. Then
  the new List and Grace Whitu's Booking show on the Day view for Thu 6 Aug and the row moves under
  **Decided**.
- **Optional:** R3 (Hemi Walker, on the authorised Wed 18 Mar List) reads **List authorised** with
  Apply disabled.
- **Optional (seeded stub):** without importing, Matching already holds **Mere Tipene** (Southern Cross,
  "Lap chole", 14:00, no NHI, from "Southern Cross theatre list, Tue 4 Aug"). Her stub stands on Dr
  Souter's Tue 4 Aug PM List (Ms K. Patel; `/mobile/lists/L-34821-2026-08-04-PM`), which reads "0 of 0
  complete · 1 waiting at intake". In Admin, the List drawer, Draft List drawer and Review show the stub
  with a teal **Resolve on Matching** link that opens her row; type **ZQA1024** and **Add NHI**, or
  **Reject** with a reason (footer), which removes the stub with the row (audited **Stub removed**).
- **Optional (handset):** on the PWA, open Dr Souter's List holding a stub, tap the stub (a read-only
  sheet: what was received and its source), then **Demo → Office adds the NHI to this stub** (office
  stand-in): "The office added the NHI. The Booking now stands in the stub's place."
- **Future-scope aside (label it as such):** Christchurch Public is not integrated today; there is no
  live feed. If asked how a mis-mapped feed would be handled, open **Demo: Future scope, HL7 and FHIR**
  (`/demo/integrations`) and its **Feed mapping** page (`/demo/integrations/mapping`): a message that
  reads the NHI from the wrong field dead-letters on the **Message log** until the mapping is fixed and it
  is reprocessed. A fired message only lands on Admin Intake as a row for the office to decide. Say:
  "That is later work; today the office imports each hospital's file."

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
  and the total paid out equals the invoice total, never more. The Ledger's Payables due rises with
  each part payment and returns to $0.00 after each run: $110.69 after the half (Hemi Walker's
  AA-2026-0004, $221.38), $0.00 after the first run, $110.69 after the rest, $0.00 after the second.

### Beat 6: The date approaches

Late on purpose, so Beats 2 to 5 run on the seeded date (Tue 21 Jul); only Beat 7 follows it. If a
jump leaves Beat 2 without its ACTIVE today List, keep the jump late and say so in Stage it.

- **Click:**
  - Go to **Admin Day view → Tue 21 Jul** (Riley's mild warning cleared in Beat 1).
  - Open **Demo actions → Move to 2 days before procedure**, choose Annette Riley's Booking, **Run**.
  - The clock jumps to Wed 22 Jul. Look at the **To-do** card and the Booking's triangle.
- **Say:** "Two days out and still not paid in full, so the same warning is now strong. It re-opens even though
  the office cleared the mild one. Still never a block: the office chases the payment, and the
  anaesthetist sees it on opening the Booking."
- **Expected:** the warning turns strong and the cleared mild one re-opens; the jump is forward only and
  **Reset** restores the seeded date.

### Beat 7: Held, then transferred

Runs on the seeded date or after Beat 6's jump. It follows Priya Nair's prepayment (AA-2026-0001,
$1,380.00 held since Beat 1) to Dr Souter.

- **Click:**
  - Switch to the **Anaesthetist Mobile App** as Dr Souter. Open her **Fri 24 Jul PM List**, select
    **Mark complete** on each Booking, then **Mark list completed** and **Submit to office**. On Nair's
    Booking the units row reads "Prepaid $1,200.00 · paid · held by AA until the List is authorised".
  - Go to **Admin → Review queue → Dr Melanie Souter, Fri 24 Jul PM → Review** and select **Authorise
    for billing**, then confirm. Nothing else: there is no transfer button. (On a handset, the PWA's
    **Office authorises this List** does the same.)
  - Go to **Admin → Billing monitor**. The **AA Holding account** card shows a **Transferred** entry
    naming Dr Melanie Souter, and the balance falls by $1,380.00 (to $0.00 from a fresh reset; Riley's
    $690.00 stays held if Beat 1 paid half of hers).
  - Open the **Xero sim → Invoices → XRB0**: a **Manual journal MJ-0001** with two lines, debit AA
    Holding account $1,380.00 and credit Dr Melanie Souter $1,380.00, marked "Transfer, not a payment"
    and "How this posts in Xero is still to be confirmed".
  - Optional: **Admin Invoices → INV0001** shows Payee "AA Holding account" and "Transfer journal
    MJ-0001".
  - Back on the **Billing monitor**, select **Run payables**: it pays the transferred $1,380.00 (1
    payable) to Dr Souter, never the AA Holding account's own payable.
  - Optional: **Anaesthetist Web App → Accounts → Payments** (`/web/accounts/payments`): Nair's
    prepayment read "Held until the List is authorised" before, and now reads **Paid to you**.
- **Say:** "The patient paid before the procedure, but the money was held, not paid to Dr Souter. When the office
  authorised her List the system moved it from the AA Holding account to her, with no office step.
  That is a transfer, not a payment: no new invoice, no GST, nothing more from the patient. The next
  payables run pays her. If the Booking had moved to a colleague, the transfer would pay whoever did
  the List, with nothing changed in between. Whether authorisation is the right moment is still to
  confirm with AA."
- **Expected:** one Transferred entry naming Dr Souter, the card's balance down by $1,380.00, MJ-0001 on
  XRB0, and a payables run of exactly $1,380.00 to Dr Souter. The transfer itself adds no invoice,
  ACCREC or payment, and GST does not move (her septoplasty bills on its own invoice as usual). On the
  Ledger the transfer is its own row (Kind Transfer, Receivable "None", "From AA-2026-0001", Payee Dr
  Souter); the AA Holding account tile falls and Payables due rises by the same amount until Run
  payables, and the ledger stays in balance.

**Discovery points:** settled: billing failure is per Booking, and a List never fails as a whole
(OQ-05); still to confirm with AA: exactly which fields are frozen at authorise (US-15.0.3: AR-58 2.8
names them, Donald's proposal); which conditions warn, and how strongly; where the to-do list sits on the dashboard; a hospital row for a submitted List can still be applied by
the office until the List is authorised (US-02.5.4), and one for an authorised List cannot (what happens
then is not yet decided); a Booking moved to another day arrives as a cancellation plus a new Booking;
applying hospital changes automatically is Future Work.
For the stub on a List (Beat 4), our readings, to confirm with AA: the Booking takes the stub's place
when the office adds the NHI; what a stub shows (time, name and wording as received, marked waiting at
intake); and how a List holding one reads (counted apart, no prompt or block on submit or authorise).
For the prepayment beats: still to confirm whether the prepayment
invoice names the anaesthetist (OQ-120); still to confirm when the AA Holding account releases the
money (OQ-125: the prototype transfers it when the office authorises the List; Greg said "confirmed and
submitted"); payments, the transferred prepayment's included, are made in Xero, and Run payables
stands in for that here (OQ-111); and whether a prepayment's payable counts as a BCTI (the prototype
leaves it out, provisional, beside the BCTI granularity point in S3, OQ-29). Stated as facts: the prepaid price is never editable by the
anaesthetist and is kept (OQ-96, OQ-104), the prepaid Procedure is left off the final invoice (OQ-116),
and a Contract changed after sending is handled as a cancellation, built in Phase 41 (OQ-119). One
prepayment invoice per payer, each payer locked once theirs is raised, is built from Donald's answer and
not yet discussed with AA (OQ-140); a prepaid Contract always billing the Procedure's payer is a working
reading awaiting AA's confirmation (OQ-73).

---

## S5 · Compliance tour

**Serves:** audit, identity, data minimisation, Contract history and the invoice recipe, the
governance the evaluators will probe. **Time:** 5 to 6 minutes.

**Stage it:** control panel, Scenario jumps, **S5 · Compliance tour → Jump → Confirm jump**. This
resets to rich booking-to-clinical histories on every Booking, adds three live edits to David Chen's
trail, and authorises Dr Whitaker's Fri 17 Jul List, which locks the Health NZ agreed rate and the
price in force on 17 Jul onto each Procedure and raises its five invoices from that record
(AA-2026-0002 to AA-2026-0006, Hemi Walker's first at $264.50). Use **Go to Admin app** and **Go to
Xero sim**.

### Beat 1: the audit trail of a much-edited Booking

- **Click:**
  - Go to **Admin Day view → Tue 21 Jul → Dr Souter PM**.
  - Open **David Chen → History**.
  - Pause on the audit trail.
- **Say:** "Every Booking and Procedure change, including automated ones, writes an append-only audit entry
  with who, role, source and before/after. The captured inputs stay reproducible, not just the final
  total."
- **Expected:** a multi-entry trail from booking and Procedure setup through capture and completion,
  followed by the staged anaesthetist and office edits: an ASA III modifier claimed with its explanation,
  the office note, then the claim removed, so Chen's fee ends where it started. Every row shows who, role,
  source and before/after, and the manual time-unit adjustment retains overridden provenance. Any other Booking
  can also be opened to demonstrate its seeded history without staging first.
- **Worth pointing at:** a price change reads **Price changed**, with the price before and after and no
  reason, because none is ever asked. Paula Westerman's Face lift on Dr Souter's Mon 10 Aug PM List
  (`/admin/day/2026-08-10/bookings/BK0187`) shows **Price changed · Kirsty W. · office · Price not set
  → $2,950.00**; clearing a typed price reads **cleared, computed again**.

### Beat 2: NHI dual-format validator

- **Click:**
  - Go to **Admin → Intake → Validators** (`/admin/intake/validators`) and try an old-format and a
    new-format NHI, then an invalid one.
  - Optional: on **Intake → PDF lists**, Mr Okafor's row 2 shows a printed NHI (ZAA0068) flagged invalid
    beside the facsimile (S1 Beat 1c corrects it).
  - Optional, a labelled Future-scope aside: on **Demo: Future scope, HL7 and FHIR**
    (`/demo/integrations`), **Demo actions → Fire hospital message → MSG-STG-1002 (new-format NHI) →
    Run**; then on **Admin → Intake → Matching** open the new row.
- **Say:** "The prototype validates both NHI formats using the official check-digit algorithms. A
  new-format NHI with a mod-23 check letter validates; the row still waits for the office to decide."
- **Expected:** both formats validate on the Validators tab and an invalid NHI is rejected with a reason.
  In the aside, the fired message lands as a row on Admin, Intake, Matching showing the validated
  new-format NHI; nothing is applied until the office decides.

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

### Beat 4: Contract history and the invoice recipe

- **Click:**
  - Go to **Admin → Master data → Contracts** and open **CPH-002 · Health NZ agreed rate**
    (Christchurch Public, RVG at the Contract's own rate, $23.00 a unit). Optionally open its
    **History** tab first: "No changes yet", with Dr Whitaker's Procedures already listed under
    **Procedures locked against this Contract**.
  - On **Details**, change **Rate ($ per unit)** from 23 to 24, then **Save contract**.
  - Open the Contract again and select its **History** tab. Pause on the new row, then on **Procedures
    locked against this Contract**.
  - Follow Hemi Walker's invoice link (**AA-2026-0002**), or go to **Admin → Invoices** and open it.
    Pause on the **Locked record** card, then **Demo actions → Regenerate from locked data → Run**.
- **Say:** "Every change to a Contract is audited with its values before and after, who made it and
  when, and nothing is deleted: a Contract is edited in place or disabled, never versioned or staged.
  A Booking's price follows its Contract until the List is authorised. From then on the invoice keeps
  the recipe it was raised from: the Contract's settings, the range in force, the price, who was
  billed, the patient details and who is paid. So it can be produced again exactly, whatever has
  changed since. It is not a replay of the data as at a date."
- **Expected:** the History row reads **Contract updated · Kirsty W. · office**, with today's date and
  time and **Pricing: RVG at $23.00 per unit → RVG at $24.00 per unit**. Under it, Dr Whitaker's five
  Fri 17 Jul Procedures (Hemi Walker, Chris Liu, Laura Collins, Olive Patel, Gemma Kaur), each "Locked
  Tue 21 Jul, 08:00" and linked to its invoice (AA-2026-0002 to AA-2026-0006). His invoices are
  unchanged: Hemi Walker's still reads $264.50, and its Locked record card still reads 10 units @
  $23.00/unit (Contract rate, locked), paid to Dr Ben Whitaker, priced on Fri 17 Jul 2026. Regenerate
  reads **Regenerated from locked data: identical (1 line, total $264.50)**.
- **Worth pointing at (optional, a backdated price range):** a price range belongs only to a
  fixed-price Contract, so Health NZ agreed rate, an RVG rate, has none. On the Contracts view,
  **Demo actions → Demo: add a backdated price range → Run** adds a range from 1 Jul 2026 at
  $3,300.00 to Merivale's Face lift (MER-001). An ACTIVE Booking follows the change: Sophie Matthews'
  Face lift (`/admin/day/2026-08-10/bookings/BK0163`) now reads $3,300.00. A Booking with a typed
  price, and the authorised, invoiced one, stay as they were: a locked Booking never follows a change. The Run reports **1 authorised Procedure kept its old price: Judith Calloway, $3,100.00.**, and the Contract's price ranges show the same warning with her row; re-priced Procedures (Sophie Matthews at $3,300.00) are never listed.
- **Worth pointing at (optional, Disable a Contract):** on the Face lift (MER-001), select **Disable**. The panel reads "Disabled on Tue 21 Jul: hidden from the Contract list unless asked for. Procedures already on it keep it; one not yet authorised and dated on or after Tue 21 Jul is flagged at review." A warning lists the not-yet-authorised Face lifts still on it (Sophie Matthews, Paula Westerman and Fiona Lattimer, Dr Souter's Mon 10 Aug PM List), each with **Open**. Nothing moves; Review of that List then flags each, and **Make active** undoes it. A new Contract with **Replaces** and **From** warns the same way ("N Procedures dated on or after Sat 1 Aug are still on Face lift. Nothing moves by itself: open each to move it."), and stores nothing.

### Optional beat: rate per unit after authorise

- **Click:**
  - In the Review queue, authorise Dr Souter's Mon 20 Jul AM List (`/admin/review/L-34821-2026-07-20-AM`)
    if it is still waiting: the rate reads **@ $26.50/unit (locked)**, total $901.00.
  - Go to **Admin → Master data → Anaesthetists → Dr Melanie Souter → Edit**, change **Unit value ($)**
    from 26.50 to 28.00, then **Save changes**.
  - Back on the authorised List in Review; then Brian Holt's invoice (**AA-2026-0007** after the S5
    jump) → **Demo actions → Regenerate from locked data → Run**; then an ACTIVE Booking of hers,
    Hemi Walker on her Tue 21 Jul AM List (`/admin/day/2026-07-21/bookings/BK0001`).
- **Say:** "The rate per unit is read when the List is authorised and kept in the lock. Changing it later
  re-prices only work not yet authorised."
- **Expected:** Review still reads **@ $26.50/unit (locked)** and $901.00; Regenerate reads
  **identical (2 lines, total $365.70)**; Hemi Walker's ACTIVE Booking reads **13 units x $28.00 =
  $364.00** (it was $344.50). **Reset → Confirm reset** afterwards (or jump S5 again).

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
published range, shown to the anaesthetist, and starts at its lower figure (OQ-101); the RVG modifier
table as printed (values that are not plain numbers are entered at capture); only the age and included
modifiers are pre-applied and nothing else is pre-filled (settled, Ben, 27 October); the age bands are
settled (OQ-95 answered, D29); modifiers stack with no limit; AA's own modifiers (Vanessa's list) are not yet
loaded; which Procedure is primary (Vanessa: the most expensive; Greg: the first in the list; the
build keeps the first until someone changes it); base units when the primary is on a fixed price (OQ-132:
the build bills none); and the concurrency model (single-user by design, audited
last-write-wins, with the multi-source reality shown via the audit trail and live integration updates).

---

## Recommended run orders

| Audience | Order | Time |
|---|---|---:|
| General evaluation | S1, S2, S3 | 15 to 18 min |
| Finance-led | S3, S4 (money beats), S5 | 15 min |
| Integration-led | S1 (Beats 1 to 1c), S4 (unmatched queue beat), S2 | 15 to 18 min |
| Full deep-dive | S1 through S5 | 30 to 35 min |

## What to narrate rather than click

- The full four-month scale and the production population of about 85 anaesthetists.
- The roughly 28,000 annual invoices and Xero active-contact volume (the archive job reduces a seeded
  aggregate counter to make the point).
- Health NZ's FHIR-first policy and real OAuth/Keycloak setup.
- Real email, Xero and hospital integrations: the prototype simulates them in-browser. A PDF list's
  reading is simulated from sample files (no OCR is built, and nothing reads the mailbox); the office
  uploads it with the address it came from. The hospital files are samples and their wording
  illustrative.
- Not built or later work: automatic hospital sync, automatic matching, HL7 v2 and FHIR messaging,
  further hospital feeds (Christchurch Public is not integrated today), OCR and the mailbox read.
- Future scope (HL7 v2), only as a labelled aside: a feed-mapping dead-letter. In the simulator a
  Christchurch Public message sends the NHI in PID-3 but the feed reads PID-2, so it dead-letters until
  the mapping is fixed and it is reprocessed (**Demo: Future scope, HL7 and FHIR**, MSG-CPH-2001,
  `/demo/integrations/log` and `/demo/integrations/mapping`).

The most persuasive clicks are the state changes: a matched hospital row or a manual booking creates a Booking; Finish
now changes Time units and fee; Booking completion enables submission; submission changes who may edit;
authorisation locks the List; the billing run generates invoices; the invoice-detail shortcut records
payment and payout; the Web Payments history keeps the settled invoice visible.

## Recovery from demo accidents

- S1 to S4 start from the common reset seed, so the fastest recovery is **Reset → Confirm reset**.
  S5 still has scenario-specific preparation, so recover it through its **Jump → Confirm jump**.
- Or use **Reset → Confirm reset** in the shared top bar from any app. The same control remains under
  **Clock & reset** in the control panel. Reset returns the clock to Tuesday 21 July 2026, 8:00 and
  restarts deterministic identifiers, so invoice numbers begin at the same point every time.
- The Future-scope simulator (`/demo/integrations`) also has **Reset demo data → Confirm reset** beside
  Start live feed. It performs the same whole-demo reset without making you return to the control panel.
- **Receive updated PDF from rooms** works once per list (and only after its first version is sent to
  matching): once used it reads "The updated list has already arrived.", so a second run of S1 Beat 1c
  needs **Reset → Confirm reset** (or the S1 jump) first.
- Lost the screen a demo action lives on? The control panel's **Demo actions by screen** has an
  **Open screen** link for every entry (Intake's PDF lists entry opens `/admin/intake/pdfs`).
- Imported the same sample twice: nothing new is added. Applied the wrong row: fix the Booking by
  hand; the row's decision and any wording it added stay in the history.
- If **Finish now** was stamped too early, reset and advance the clock before reopening the Booking.
- A stray refresh is no longer a problem: it returns you to the same screen. If you have clicked
  somewhere unexpected, the browser back button retraces your steps, or paste the beat's address from
  **Direct URLs** above.
- Reset leaves the integration auto-retry timers scheduled, but a guard makes any stale timer a safe
  no-op; it will not disturb the fresh state.
- Keep this document or the master HTML in a second tab, not the Data Inspector.
