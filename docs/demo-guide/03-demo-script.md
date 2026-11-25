# Demo Script · S1 to S5

The presenter's run sheet. Each scenario opens with a **Stage it** step, then its beats. Every beat has a **Click** list (navigation, selections, presses and pauses only), a **Say** line (what you tell the room between actions), an **Expected** line (what the screen shows, with its figures) and, where the phone plays a part, a **Handset** line. Every scenario starts from a Reset or its own jump, so you can start cold and recover from a mistake.

The whole flow is clickable. The few things the prototype does not do are listed under **What to narrate rather than click**, at the end.

## The one continuous object

Where a scenario needs a worked example, use one recognisable business object:

> Dr Melanie Souter's operating Lists, at Southern Cross, St George's and Forte Health.

The seed keeps:

- her design day (Tue 24 Nov), with Margaret Ellison's Booking left unfinished for live capture;
- her two Mon 23 Nov Lists, already submitted and waiting on Review. The AM one has Brian Holt's two procedures on one invoice, the PM one the split fee;
- her Mon 16 Nov AM List, with the three-procedure Booking and the $0 Booking;
- her Fri 27 Nov Lists at Forte Health: Annette Riley's prepaid rhinoplasty on the AM List, Priya Nair's prepaid Booking on the PM List;
- her Tue 1 Dec AM List at St George's, where S1's hospital file lands.

## Pre-demo setup

1. Open the prototype at `http://localhost:5173`, at a desktop width wide enough for the web and Admin layouts.
2. From the app switcher, open **Demo: Control Panel** (`/demo/control`). It is the presenter's index, in three parts: **Clock & reset**, **Scenario jumps · S1 to S5** and **Demo actions by screen**.
3. Under **Clock & reset**, select **Reset demo data**, then **Confirm reset**. The demo clock reads Tuesday 24 November 2026 · 8:00.
4. Keep this document, or the master HTML, open in a second tab. Do not present from the Data inspector.
5. Optional check: **Admin → Intake** opens on **Matching** with one row waiting (Mere Tipene, Southern Cross, "Waiting for an NHI"), its **Waiting for NHI** tab holds the same row, and its **PDF lists** tab holds Mr Okafor's list, received and not yet sent to Matching.
6. Point at the **Synthetic data only** badge in the top bar, above every app. The phone's More screen also says "All patients, NHIs, Lists and figures are synthetic." Nothing in the prototype is real patient or integration data.
7. NHIs for the lookup beats (S5 Beat 2): `ZBR4417` Mereana Tipene, `ZBT2253` Lucas Brennan and `ZBX41AL` Ana Fifita (new format) are on the NHI register; `ZBW6638` is valid but not on the register; `ZAA0068` fails its check digit.
8. Help: after a Reset the clock reads 8:00am, so every Help panel says "Closed, opens 8:30am". Press **+1 hour** on the clock before a support beat if you want it open.

Each scenario on the Control Panel has a **Jump** button. It asks first (**Confirm jump** or **Cancel**), resets to the pristine seed and stages only what that scenario cannot reach from there. S1, S2 and S4 stage nothing ("Reset to the pristine seed; nothing staged."). S3 checks that Dr Souter's two Mon 23 Nov Lists are waiting on Review. S5 stages David Chen's audit trail and authorises Dr Whitaker's Fri 20 Nov List. After a jump the scenario lists its beats, one link per beat ("Beat 2 · Admin Intake" and so on), each with a one-line note of what to do there. A beat whose screen does not exist yet says what it waits for ("Beat 4 · Admin Booking, after Create Booking") and stays greyed out until it does. The links stay on the Control Panel until the next reset, so come back to it between beats (a browser reload clears them). The same jump always gives the same data, so it doubles as recovery.

The live clock sits to the right of the app switcher. Select it for **+15 min**, **+1 hour**, **Next day**, **Next morning**, **+7 days** and **Procedure day · 1 Dec**, without leaving the screen you are presenting. **Reset**, beside it, asks "Reset all demo data?" and restores the seed on **Confirm reset**.

Demo actions sit on the screens they belong to. You fire a simulated event, such as a hospital file arriving, a payment from Xero, a billing failure or a scheduled run, from its own screen. In the framed prototype, open **Demo actions** in the harness bar (the pill beside the app switcher shows how many the screen has) and press **Run** on the entry. Some entries ask for a choice first, and a few ask **Confirm**. The menu stays open after a run so you can read the result. On a handset the same actions sit behind the amber **Demo** chip, which opens the **Demo sheet**; actions badged Office stand-in or Colleague stand-in play the people who are not on the phone. The Control Panel's **Demo actions by screen** lists every action with where it shows and an **Open screen** link.

On a handset, the installed app (`http://localhost:5174`) opens on a sign-in screen with Dr Souter's demo account (`m.souter@aa-associates.example`) and a masked password filled in. Tap **Sign in** before the audience arrives, or use it as S1's opener. The phone stays signed in across reloads and across its own **Reset demo data** (on More). The framed phone in the prototype always opens signed in. On the handset's More screen, **Play the office** is off by default. Leave it off: a submitted List then waits for the office, as it would in practice. To move one List on, use **Demo sheet → Office authorises this List** on that List.

## Direct URLs

Every screen has its own address, so you can jump straight to a beat, and a refresh or the browser's back button keeps your place. The ids below come from the seed, so they stay valid after every **Reset demo data**. An address whose id is not in the data opens its parent screen. Sheets, drawers and dialogs have no address of their own, so Back takes you to the previous screen. A picked day (`?day=`) and a search (`?q=`) are in the address, so Back from a List or a Booking returns to the same day or results.

The three app roots work as entry points: `/mobile` opens Lists, `/web` the Dashboard and `/admin` today's Day view.

| Anaesthetist Mobile App | URL |
|---|---|
| Sign-in (handset) | `http://localhost:5174/`. Any `/mobile/...` address opens behind it and shows after **Sign in**. **Sign out** is on More. |
| Lists, the main view from today | `/mobile/lists` |
| Lists, one day | `/mobile/lists?day=2026-03-13` (Fri 13 Mar 2026) |
| Lists, search | `/mobile/lists?q=Mitchell` |
| A List | `/mobile/lists/<listId>` (Dr Souter's Tue 24 Nov PM: `L-34821-2026-11-24-PM`) |
| A Booking, with its descriptions and events list | `/mobile/lists/<listId>/bookings/<bookingId>` (Margaret Ellison: `/mobile/lists/L-34821-2026-11-24-PM/bookings/BK0009`) |
| Availability (Find cover) | `/mobile/availability` |
| My calendar | `/mobile/availability/calendar` |
| Balances | `/mobile/balances` |
| More (profile, Help, Sign out; on the handset also the demo clock, **Play the office** and **Reset demo data**) | `/mobile/more` |

The handset uses the same `/mobile/...` paths on `http://localhost:5174`.

| Anaesthetist Web App | URL |
|---|---|
| Dashboard | `/web` (another week: `/web?week=2026-11-30`) |
| Lists, the main view from today | `/web/lists` |
| Lists, one day | `/web/lists?day=2026-03-13` |
| Lists, search | `/web/lists?q=Mitchell` |
| A List | `/web/lists/<listId>` |
| A Booking, with its descriptions and events list | `/web/lists/<listId>/bookings/<bookingId>` (David Chen's hip hemiarthroplasty, an additional invoice in its events list: `/web/lists/L-HIST-03/bookings/HBK03`) |
| Availability (Find cover) | `/web/availability` |
| My availability | `/web/availability/mine` (one day: `?date=2026-12-18`) |
| Accounts, Outstanding | `/web/accounts/outstanding` (`/web/accounts` opens it; so does `/web/accounts/overdue`) |
| Accounts, Payments | `/web/accounts/payments` |
| Accounts, Remittances | `/web/accounts/remittances` (one remittance advice per weekly payment run) |
| Accounts, GST report | `/web/accounts/gst` |
| Accounts, AA fees | `/web/accounts/fees` |
| Profile | `/web/profile` |

| Admin Web App | URL |
|---|---|
| Day view | `/admin/day/2026-11-24` (A to Z order: add `?sort=az`; one scrolling list instead of pages: `?rows=all`). The right rail holds the **Books square** and **Pre-payments** tiles, then one work card with two tabs: **To-do** (warnings, Conflicts and the Bookings that need an invoice destination) and **Notifications**. |
| A Booking | `/admin/day/2026-11-24/bookings/<bookingId>` (Margaret Ellison: `BK0009`; David Chen: `BK0008`) |
| Intake, Matching | `/admin/intake/matching` (`/admin/intake`, `/admin/matching` and `/admin/integrations` open it) |
| Intake, Waiting for NHI | `/admin/intake/waiting` (`/admin/patients/waiting` opens it) |
| Intake, PDF lists | `/admin/intake/pdfs` |
| Intake, Data quality | `/admin/intake/quality` |
| Intake, Validators | `/admin/intake/validators` |
| Draft Lists | `/admin/draft-lists` (History: `?tab=history`) |
| Conflicts | `/admin/conflicts` (hospital closures; filters in the address: `?hospital=`, `?anaesthetist=`, `?when=`, `?cleared=1`) |
| Notifications (the shared pool) | `/admin/notifications` (resolved notices: `?resolved=1`) |
| Review queue | `/admin/review` |
| Events awaiting review | `/admin/review?tab=events` |
| One List under review | `/admin/review/<listId>` (S3's AM List: `L-34821-2026-11-23-AM`) |
| Invoices | `/admin/invoices` |
| One invoice | `/admin/invoices/<invoiceId>` (AA-2026-H03: `HINV03`) |
| One credit note | `/admin/credit-notes/<creditNoteId>` (CN-2026-HS05: `HSCRN05`) |
| Billing monitor, with the AA Holding account panel | `/admin/billing` (filters: `?problems=1`, `?anaesthetist=34821`, `?hospital=`, `?from=`, `?to=`) |
| AA fee invoices | `/admin/billing/aa-fees` |
| AA fee settings | `/admin/billing/aa-fees/settings` |
| A weekly payment run | `/admin/billing/payment-runs/<runId>` (the seeded Week 47 run: `PRH13`) |
| A remittance advice | `/admin/billing/payment-runs/<runId>/remittance/<registration>` (Dr Souter's for Week 47: `PRH13/remittance/34821`) |
| Ledger, with the AA Holding account total | `/admin/ledger` |
| Ledger, one anaesthetist | `/admin/ledger/anaesthetists/<registration>` (Dr Souter: `34821`) |
| People, Anaesthetists | `/admin/people/anaesthetists` (`/admin/people` opens it; filters in the address: `?status=inactive`, `?tier=`) |
| An anaesthetist's page | `/admin/people/anaesthetists/<registration>` (Dr Souter: `34821`; Dr Priya Sharma: `41267`) |
| People, Surgeons | `/admin/people/surgeons` |
| A surgeon's page | `/admin/people/surgeons/<surgeonId>` (Ms A. Reid: `S-REID`; Dr H. Dalgety: `S-DALGETY`) |
| People, Specialties | `/admin/people/specialties` |
| A specialty's page | `/admin/people/specialties/<specialtyId>` (Ophthalmology: `SPC-OPHTH`) |
| People, Patients | `/admin/people/patients` (Needs follow-up: `?filter=follow-up`; `/admin/patients` opens it) |
| A patient's page | `/admin/people/patients/<nhi>` (Sarah Mitchell: `CQY9304`; Fiona Gray: `ZAM1098`) |
| Contracts | `/admin/contracts` (grouped: `?group=holder`, `tag`, `surgeon`, `destination` or `pricing`; one holder: `?group=holder&in=PY-COS`) |
| A Contract's page | `/admin/contracts/<contractId>` (Merivale's Face lift: `CT-MER-FACELIFT`; tabs: `?tab=bookings`, `eventFees`, `history`) |
| New contract | `/admin/contracts/new` (for one holder: `?holder=PY-COS`) |
| Parties | `/admin/contracts/parties` (one Party: `/admin/contracts/parties/PY-COS`) |
| Funding tags | `/admin/contracts/tags` |
| Master data | `/admin/masters` (one view: `?view=<view>`, below) |
| Audit | `/admin/audit` |

| Master data view | `?view=` |
|---|---|
| Hospitals & holidays | `hospitals` (the default view) |
| Recurring bookings · Availability statuses · Public holidays · Schedule settings | `recurringBookings` · `availability-statuses` · `publicHolidays` · `scheduleSettings` |
| RVG groups (and their procedures) · Modifiers | `rvgGroups` · `modifiers` |
| Email templates · Prepayment letters · Xero & archiving · Patient balance warning | `emailTemplates` · `prepaymentLetters` · `xeroArchiving` · `patientBalance` |
| Seed load · Go-live load (demo) | `seedLoad` · `goLive` |

Anaesthetists, surgeons, specialties and patients are in **People**; Contracts, Parties and Funding tags are in **Contracts**. Master data says so at its top. The old addresses (`/admin/masters?view=anaesthetists`, `?view=contracts&holder=PY-COS`, `/admin/masters/surgeons/S-REID`, `/admin/patients/CQY9304` and the rest) still open the new pages. There are no surgeon groups to keep: a group is a Party whose surgeons are linked on its Contracts.

| Demo surfaces | URL |
|---|---|
| Control Panel | `/demo/control` |
| Xero simulation | `/demo/xero` (invoice pairs: `/demo/xero/invoices`; one pair: `/demo/xero/invoices/XRH03`; bank reconciliation: `/demo/xero/bank`) |
| Future scope: HL7 and FHIR (badged **Future scope**) | `/demo/integrations` (message log: `/demo/integrations/log`; feed mapping: `/demo/integrations/mapping`) |
| Data inspector | `/demo/data` |

The component catalogue (`/demo/catalogue`) is a developer page reached by address only. It is not part of the demo.

## How to read the readiness

Every catch-up phase is built, and everything in S1 to S5 runs in the app. Where a rule is settled, the app shows it as the rule, with no label and no question number. A few readings are still open with AA. The app labels each one where it shows, and the run sheet uses the same words.

| Reading | Id | What the screen says |
|---|---|---|
| The prepayment invoice names the anaesthetist (D68) | OQ-120 | "Provisional (OQ-120)", on the patient email offered when a prepaid Booking moves |
| A payer with only a postal address is accepted and the invoice marked to post (D70) | OQ-122 | "Provisional (OQ-122)", the pill on a posted invoice |
| Emailed Lists and the on-demand update email stay alongside the app (D71) | OQ-124 | No label on screen |
| The prepaid amount moves to the anaesthetist when the List is authorised (D72) | OQ-125 | "Moves to the anaesthetist when the List is authorised · to confirm with AA (OQ-125)" on the AA Holding account panel; the Xero simulation adds "How this posts in Xero is still to be confirmed." |
| No base units bill when the primary Procedure has a fixed or open price (D78) | OQ-132 | Office screens: "No base units billed on a fixed price (provisional, OQ-132)". The anaesthetist sees "None on a fixed price", with no label. |
| Each Party's invoices go by email (the default) or post, with no portal (D55's open part) | OQ-114 | No label on screen |
| One BCTI per paid receivable invoice, and the buyer-created wording | OQ-29, OQ-60 | "Provisional (OQ-29)" on the BCTI agent block and in the Xero simulation; on AA fee invoices, "Provisional: being confirmed with AA's accountant (OQ-29, OQ-60)." and a **Sample schedule** pill |
| A prepaid Contract always bills the Procedure's payer (D23) | OQ-73 | Awaiting AA's confirmation: "A prepaid Contract always bills the payer, awaiting AA's confirmation." on the Contract form |
| The weekly payment cycle | OQ-47 | No label on screen. Say it is proposed. |
| ACC pre-op codes and their fixed fee | OQ-12 | "Codes to confirm with AA's accountant (OQ-12).", shown to the office on the event sheet |
| How each hospital provides its bookings | OQ-13 | No id: "Sample files stand in for each hospital's bookings while the integration team confirms how each hospital provides them." on Matching |
| How anaesthetists sign in | OQ-83 | A **Provisional** pill and "How anaesthetists sign in (two-step codes, single sign-on, Face ID) is still to be decided. This screen stands in for it." on the sign-in screen |
| Support cover from 8:00am | OQ-141 | "... whether AA needs cover from 8:00am is still to be agreed (OQ-141)." in Help |
| Surgeons saved without an HPI CPN | OQ-143 | "No HPI CPN yet", with no provisional label |

Three captions mark a reading of ours with no question number: a stub says "How a stub reads is our reading, to confirm with AA."; **Resolve** on a record changed directly in Xero says "Provisional: the policy for each mismatch is to be agreed with AA."; and the NHI register refresh carries a **Provisional** pill.

Open questions with nothing on screen, raised only where a beat touches them: OQ-112 (AA's fee invoice at month end or on the 20th), OQ-123 (billing practice reporting), OQ-138 (pre-op consults in AA's room), OQ-142 (the approval and ACC numbers on the holder's invoice), OQ-144 (disabling a Contract from a future date, where Replace from a date leaves the old one active with a to-do), OQ-145 (a hospital's untagged Contracts sit under Special on the step rail), OQ-146 (which No contract backstops each hospital and funding tag gets), OQ-147 (how an anaesthetist who has left sees later remittances) and OQ-148 (whether AA needs any record of surgeons who practise together; today a group is only a Party).

---

## S1 · Booking to theatre

**Serves:** sign-in on the phone; the hospital's file imported and matched, with the wording kept as received; a booking with no NHI standing as a stub; the rooms' PDF list and each List's sender; the office choosing the Contract on the step rail; the descriptions; capture on the phone; a submitted List changed until the office authorises it; finding past work. **Time:** 9 to 10 minutes.

**Stage it:** Reset → Confirm reset, or Control Panel **S1 · Booking to theatre → Jump → Confirm jump**. The jump resets to the pristine seed and stages nothing ("Reset to the pristine seed; nothing staged. Follow the beats below in order."). The clock reads Tuesday 24 November 2026 · 8:00. It shows seven beat links:

- Beat 1 · Mobile sign-in
- Beat 2 · Admin Intake
- Beat 3 · Admin Day
- Beat 4 · Admin Booking, after Create Booking (it waits until Beat 2's **Create Booking** makes Sarah Mitchell's Booking)
- Beat 5 · Mobile List, Tue 1 Dec AM
- Beat 6 · Mobile Booking, after Create Booking (it waits the same way)
- Beat 7 · Mobile search

Then open the **Anaesthetist Mobile App**.

### Beat 1: Sign-in

- **Click:**
  - On Mobile, open **More** and press **Sign out**.
  - On the sign-in screen, press **Sign in**.
- **Say:** "Dr Souter signs in once on her phone, and it remembers her. How anaesthetists sign in for real is still to be decided, and the screen says so."
- **Expected:** the sign-in screen reads "Sign in · Your Lists, Bookings and balances, on your phone.", with the email m.souter@aa-associates.example and a password filled in, and a "Provisional" pill: "How anaesthetists sign in (two-step codes, single sign-on, Face ID) is still to be decided. This screen stands in for it." (OQ-83). **Sign in** returns to More, which reads "Signed in as m.souter@aa-associates.example". A wrong email reads "No account with that email. Use the demo account."
- **Handset:** self-contained. A fresh handset opens on the same sign-in screen; **Sign in** lands on Lists. **Demo sheet → Sign out** signs her out again from any screen.

### Beat 2: Import, then match

- **Click:**
  - On Mobile **Lists**, open Dr Souter's Tue 1 Dec St George's AM List.
  - Switch to Admin and open **Intake**. It opens on **Matching**.
  - **Demo actions → Import hospital file**, choose St George's, then **Run**.
  - Open **Sarah Mitchell**'s row. Leave **Choose Contract** and **Choose RVG code** alone, then press **Create Booking**.
  - Close the panel and open **Mere Tipene**'s row, the one marked No NHI. Close it.
  - Open the **PDF lists** tab and press **Open** on Mr C. Okafor's list.
  - On Margaret Ellison's row, change the NHI from ZAA0068 to ZAA0067, press **Save correction**, then **Send to matching**, then **Open Matching**.
  - Open **People → Surgeons**, search "Okafor" and open **Mr C. Okafor**.
- **Say:**
  - (Mobile) "Dr Souter's Tuesday List at St George's has three cases. Two of them read the way the rooms typed them."
  - (Intake) "The office imports each hospital's file. Every row waits here, and nothing reaches the schedule until the office decides. Sarah's procedure reads exactly as the hospital sent it, and her NHI finds her existing patient record, so there's no duplicate."
  - (Balance) "Sarah owes AA for an earlier procedure, unpaid for more than 90 days from the invoice date, so the office gets a strong warning. It never stops the booking."
  - (Mere Tipene) "A row with no NHI never becomes a Booking. It waits here for the office, and a stub holds its place on the List so the anaesthetist still sees the case coming."
  - (PDF lists) "The rooms email their lists as PDFs. The office checks the rows as read, fixes the NHI the PDF got wrong, and sends them to the same matching screen."
  - (Surgeon) "Contacts sit on the surgeon: one personal contact, and an office contact for each practice. Each List keeps the address its PDF came from, and the update email and any request for a missing NHI go back to that sender. A List with no sender uses the surgeon's first office contact."
- **Expected:**
  - Mobile: "Mr T. Hale · Orthopaedics · Tue 1 Dec 2026 · 07:30 to 12:30", "0 of 3 complete": 07:45 Dylan Kereama "L knee scope + partial menisectomy", 09:45 Nathan Ioane "Shoulder arthroscopy", 11:15 Charlotte Turner "ORIF # R dist radius".
  - Intake before the import: Open · 1, Unmatched · 1 (Mere Tipene, Southern Cross, flagged "Waiting for NHI"), and the **Waiting for NHI** tab beside Matching reads 1. The page notes "Sample files stand in for each hospital's bookings while the integration team confirms how each hospital provides them." (OQ-13).
  - After **Run**: "St George's sent its theatre list: 5 rows are waiting on Matching. Nothing changes the schedule until the office decides." The strip reads Open · 6, Unmatched · 1, Decided · 0, and New 3 · Modifications 1 · Cancellations 1. Sarah's panel opens by itself.
  - Sarah's row: Tue 1 Dec AM · 08:30, "lap appy ?conv to open", Hospital's code A3, NHI CQY9304, born 1988-08-16, suggested "Create Booking on Dr Souter, Tue 1 Dec AM". The warning reads "Sarah Mitchell owes $610.00 on 1 invoice, unpaid 98 days (over the 90 day threshold). Follow up before the procedure.", with a "Strong" pill and "Staff can go ahead. The warning stays on the to-do list until cleared."
  - After **Create Booking**:
    - Intake: "Applied: Booking created on Dr Souter's Tue 1 Dec AM List · Kirsty W. 08:00" and "Booking created. Strong balance warning on the to-do list." The strip drops to Open · 5, Decided · 1.
    - Mobile: the List reads "0 of 4 complete" with Sarah at 08:30, an "Owes AA" tag and "Needs an invoice destination".
    - Admin Day: the rail's **To-do** tab goes from 11 to 13. Her balance warning has a plain **Clear** (the others read "Clear (optional)"), and her Booking adds a "No Contract" entry with **Set Contract**.
  - Mere Tipene's panel: "Missing from the hospital: NHI", "A stub stands on Dr Souter's Tue 8 Dec PM List", "Anaesthetists and the office see it on the List until this row is resolved." Every decision but **Reject** reads "Add the NHI first."
  - PDF list:
    - The list reads "Operating list · Wednesday 9 December (AM)", "Sent from leanne.pa@avonsidesurgical.example · received TUE 24 NOV · 07:10", with three rows as read.
    - Margaret Ellison's row: "NHI ZAA0068 is not valid: The check digit does not match. Correct it before sending." **Send to matching** stays disabled until the correction is saved. The saved correction reads "NHI ZAA0068 corrected to ZAA0067 · Kirsty W., TUE 24 NOV · 08:00".
    - After sending: "Sent to matching: 3 rows waiting for your decision." On Matching the three rows read "ROOMS PDF · MR C. OKAFOR", each "Unmatched: no List at Forte Health for Mr Okafor on Wed 9 Dec AM".
  - Mr C. Okafor's page: "General surgery · Avonside Surgical Rooms", HPI CPN 43OKAC, one card per part. The Contacts card reads Personal contact c.okafor@surgeons.example, 021 555 0434; Office contacts: Avonside Surgical Rooms, admin@avonsidesurgical.example, 03 555 0118, "Office emails go here first". **Edit** on the Contacts card opens the contact form with **Add office contact**. The side panel lists his Pairings (0), Contracts (1) and Next Lists (113).
- **Worth pointing at:**
  - The panel's **Open patient record** link.
  - The hospital's codes, and the panel's line "Only the fields needed to match are shown. The rest of what the hospital sent is held under restricted access."
  - **Upload PDF list** at the top of the PDF lists tab. It offers Mr J. Whitford's sample and a SENT FROM field ("The address the PDF arrived from. Replies about this List go back to it.").
  - Mere Tipene's stub on Dr Souter's Tue 8 Dec PM List on Mobile: "1 waiting at intake", "Waiting at intake: no NHI · The office is resolving this".
- **Handset:** on the Tue 1 Dec AM List, **Demo sheet → Hospital file imported and my booking matched**, choice "St George's file, Tue 1 Dec AM (S1)", **Run**. It reads "The office imported St George's file and matched it. Sarah Mitchell is now on your Tue 1 Dec AM List, the invoice going to the patient at the standard rate (No contract · RVG). The RVG code is yours to add." The List reads "0 of 4 complete", Sarah's row "RVG code to fill in". It covers Beat 3 too. After that its **Run** is greyed out, with the reason "Nothing new from the hospital for your Lists", and nothing runs. The stub on Tue 8 Dec PM shows the same on the handset. The PDF lists and surgeon records belong to the office and have no mobile side.

#### Optional aside: the patient's whole bill

- **Click:** from the warning, press **Open patient record** (or **People → Patients**, `/admin/people/patients/CQY9304`). Press **Resend** on the AA-2026-HS01 row, write a line and press **Log call**, then **Clear** the warning on the page's Warnings card (or on Admin Day's To-do).
- **Say:** "The whole bill sits on one screen: what Sarah owes under each anaesthetist, what other payers owe, and every call and resend. Dr Souter only sees that she owes AA."
- **Expected:**
  - Tiles: BALANCE $1,220.00 ("Every invoice, whoever pays"), BILLED TO THE PATIENT $610.00, "Strong", "1 unpaid invoice, oldest 98 days", OTHER PAYERS $610.00, "By payer: Sarah Mitchell $610.00 · St George's $610.00". Below them, **Needs the office**: "Balance over 90 days", "Strong", "$610.00 owing, oldest 98 days", with **Log a follow-up**; then **Warnings** "1 open" with her balance warning and **Clear**.
  - Invoices: AA-2026-H07 (Dr Souter, billed to St George's, $610.00 unpaid), AA-2026-HS01 (Dr Sharma, billed to Sarah Mitchell, $610.00 unpaid, 98 days), AA-2026-H36 ($1,240.00 paid) and AA-2026-HS02 ($540.00 paid).
  - The first **Resend** on the page is H07's, so use the HS01 row: "AA-2026-HS01 sent again to sarah.mitchell5@example.net.", and its Sends goes to 2. **Log call** stays disabled until text is written ("Write what happened first."); the call and the resend then head the Follow-up log. **Clear** takes the Needs the office and Warnings cards off the page and her entry off the To-do (13 to 12).
- **Handset:** no mobile side. Her Booking on the phone reads "This patient owes AA money. The office is following up."

#### Optional aside: a List made from the rooms' PDF, then re-sent

- **Click:** on **Matching**, open Brian Holt's Rooms PDF row, choose **Create a List in a session**, pick **Rutherford, James**, then **Create List and Booking**. Open Margaret Ellison's and Hemi Parata's rows and press **Create Booking** on each. On **Day view**, Wed 9 Dec, open the new Forte Health List. Back on **PDF lists**, **Demo actions → Receive updated PDF from rooms**, **Run**. Press **Open** on the Re-sent list, then **Send to matching**, then **Open Matching**.
- **Say:** "The new List remembers who sent it. When the rooms send the whole list again, it comes in from the practice inbox, and the office checks only what changed."
- **Expected:** the picker has a **Filter by tier** row (All, Tier 1 to Tier 4) and lists the practice's free anaesthetists in tier order, Tier 1 first: Delaney, Morrison, Rutherford and Strand, each "Free AM", their order shuffled within the tier each time the picker opens. The List drawer reads "Origin · From a rooms' PDF · sent from leanne.pa@avonsidesurgical.example" and "Replies go to leanne.pa@avonsidesurgical.example", with its three Bookings in a compact table ("BOOKINGS (3)"). The re-send reads "The updated list arrived from admin@avonsidesurgical.example, marked Re-sent." and sits above the first, 4 rows, "Re-sent". After it, **Run** is greyed out: "The updated list has already arrived." The re-sent list reads "Replaces the list received TUE 24 NOV · 07:10 from leanne.pa@avonsidesurgical.example." Sent, it reads "Sent to matching: 2 rows waiting for your decision, 2 unchanged since the earlier list." On Matching, Margaret Ellison's new time waits as a difference (Modification, Time 09:15 to 09:45, "Apply 1 change to Margaret Ellison's Booking") and Ruth Calder arrives as a new row (Wed 9 Dec AM · 11:30, "lap chole"). The three new Bookings each add a "No Contract" entry to the To-do, so Beat 3's To-do then reads 16, not 13.
- **Handset:** no mobile side.

#### Optional aside: a day move

- **Click:** on **Matching**, find Marcus Webb's two St George's rows.
- **Say:** "The hospital moved Marcus to another day. The office sees a cancellation and a new Booking, and decides each one."
- **Expected:** Mon 7 Dec PM · 13:30, Cancellation, "Cancel Marcus Webb's Booking"; Tue 8 Dec AM · 09:00, New, "Create Booking on Dr Souter, Tue 8 Dec AM".
- **Handset:** no mobile side.

#### Optional aside: an update to a matched Booking

- **Click:** on **Matching**, **Demo actions → Send update for a matched Booking**, then **Run**. Run opens the new row, flagged "Earlier row for this Booking still open": close it, open the first **Diane Foster** row and read the differences, then press **Apply 3 changes** there.
- **Say:** "Diane Foster already has a Booking. St George's sends a later time and fuller wording for it. The update waits here like any new row, and the office approves it field by field."
- **Expected:**
  - The result reads "St George's sent an update for Diane Foster: a new time and fuller wording. Check the differences and approve it." Beat 2's import already brought the same update, so two Diane Foster rows wait; open the first. The second is flagged "Earlier row for this Booking still open", and after **Apply 3 changes** it reads "No change".
  - The row reads Tue 8 Dec AM · 12:15, "WLE MM, left shoulder + flap repair + SNB + excision SCC and flap, left sternum + BCC", Modification, "Apply 3 changes to Diane Foster's Booking".
  - The panel reads "Matched to Diane Foster's Booking on Dr Souter's Tue 8 Dec AM List" and "Matched by date, surgeon, hospital and session, then NHI". It has a tick box for each field: Time 11:00 to 12:15; Procedure as received "WLE MM" to the hospital's wording ("Replaces the current text"); Note "Bumped 15 min at surgeon request" ("Added below the Booking's notes"). Under them: "The current text is kept in the change history. Also becomes the invoice description."
  - Until **Apply 3 changes**, the Booking keeps 11:00 and "WLE MM". After it, Diane Foster sits at 12:15 on Mobile with "WLE MM, left shoulder + flap repair + S…".
- **Handset:** on Diane Foster's Booking (Tue 8 Dec AM), **Demo sheet → Hospital file imported and my booking matched**, choice "A hospital update for this Booking, approved by the office", **Run**: "The hospital sent an update for Diane Foster and the office approved it." Her Booking then reads 12:15 and the hospital's full wording.

### Beat 3: The office sets the Contract

- **Click:**
  - On Admin **Day view**, the rail's **To-do** tab reads 13: the warnings, then a "No Contract" entry for each Booking that still needs an invoice destination. Press **Show all (13)**, then **Set Contract** on Sarah Mitchell's entry (last: "Tue 1 Dec AM · St George's").
  - In the Billing section, the step rail asks "Where does the invoice go?". Press **Patient**, then **Standard**.
  - Leave the RVG code empty and press **Save changes** in the save bar.
  - Press **Change** on the Paid by line, read the sheet, then close it.
  - Switch to Mobile and look at Sarah's row.
- **Say:**
  - "The office decides where the invoice goes, then the Contract. Sarah pays for herself, so she is billed on the RVG at the standard rate, with no special Contract. On screen that is No contract · RVG."
  - "The RVG code is Dr Souter's to pick when she captures."
  - "Who is invoiced comes from the Contract. Here that's the payer on the Procedure, Sarah, with her email and postal address. A postal address alone is enough, and the invoice is then marked to post."
    - **Open:** posting is provisional (OQ-122).
- **Expected:**
  - Step 1 tiles: **Patient** ("Suggested", "The patient, or whoever pays for them", 1 Contract), **St George's** ("This List's hospital, under ACC", 1 Contract), **Special** ("An insurer, a funder or a surgeon who is billed", 6 Contracts). Step 2 asks "Standard or prepaid?": **Standard** ("Suggested", "Invoiced after the procedure", 1 Contract) and **Prepaid** ("None for this List"). Step 3, Price: "No contract · RVG AA-RVG · the only Contract here", with **RVG code** and **Fixed price**, RVG code chosen.
  - The save bar reads "1 unsaved change · Procedure 1 Contract". Saved, the green strip reads "Saved · 1 change · 08:00 · Kirsty W. CS0002". The To-do drops to 12 and her No Contract entry leaves it.
  - Paid by: "Sarah Mitchell · Patient". The "Who pays" sheet shows her email sarah.mitchell5@example.net and 67 Hills Road, Papanui, Christchurch 8053, with a **Different payer** switch for a parent, guardian, benefactor or family trust. Turned on, it reads "Add an email or a postal address. A payer needs one to receive the invoice."
  - On Mobile her row reads "RVG code to fill in"; her Billing section reads Invoice to "Patient › Standard", Contract "No contract · RVG", Price "RVG code to fill in" with **Choose the RVG code**.
- **Worth pointing at:**
  - Before saving, press **Special** instead: "Which holder?" lists Canterbury Orthopaedic Surgeons, Kowhai Health Cover, nib, St George's, Tasman Medical Insurance and Unisports Ortho, 1 Contract each. Pick **nib** and the Contract field fills with nib RVG; press it and its list is headed "No contract" (No contract · RVG NIB-RVG, No contract · Fixed price NIB-FIX "Type the amount"), then nib's own "nib RVG NIB-001". Type "ortho" and the two No contract rows stay; the list reads "No Contract matches "ortho"." **Start again** goes back to step 1. **St George's** fills its funding tag (ACC) and its Contract, "ACC elective services via St George's", by itself.
  - The "Suggested" mark follows the insurer or funder on the Booking. Sarah has none, so it marks Patient and Standard. It never hides a path.
  - **Add insurer or funder**: "Who funds this Booking, and the insurer's approval number. It never changes who is invoiced." Insurers AIA Health, Kowhai Health Cover, nib, Southern Cross Health Society, Tasman Medical Insurance; funders ACC, Health NZ, NZDF, Veterans Affairs. Pick nib and an **APPROVAL NUMBER** field appears: "Without approval on the day, the patient is billed." Close without **Apply**. The to-do list already shows the warning for one with no number: "nib is named but there is no approval number. Without approval on the day, the patient is billed." (Janet Ormsby, Dr Chen, Fri 20 Nov AM).
- **Handset:** Beat 2's **Demo sheet → Hospital file imported and my booking matched** has already answered this as the office would (Patient, Standard, No contract · RVG). On the phone the same rail opens as a sheet from the Billing section (Beat 7 uses it), and her Booking has **Add insurer or funder** for the day itself.

#### Optional aside: one payer change, offered to the other Procedures

- **Click:** on Mobile, open Graeme Tullett on Dr Souter's Mon 16 Nov AM List at Forte Health (`/mobile/lists/L-34821-2026-11-16-AM/bookings/BK0184`). On Procedure 1, press **Change** on the **Paid by** line. Turn on **Different payer**, type "Tullett Family Trust" as the name, press **Family trust** and type any email. Read **Also change**, then press **Save**.
- **Say:** "Graeme has three Procedures, and he pays for all of them. When Dr Souter changes the payer on one, the sheet offers the same change on the other two, and she unticks any that should keep their payer."
- **Expected:**
  - The sheet reads "Who pays", "Procedure 1 · Laparoscopic cholecystectomy", with Graeme Tullett's email and address until **Different payer** is on.
  - Then it reads "Also change · These procedures have the same payer now. Untick any that should keep it.", with "Procedure 2 · Umbilical hernia repair, same anaesthet…" and "Procedure 3 · Inguinal hernia repair, same anaesthetic", each "Paid by Graeme Tullett now" and ticked.
  - After **Save** all three Procedures read Paid by "Tullett Family Trust", "Family trust". On Admin his Booking reads "Changed since submitted · 3".
  - His List is one S3 bills, so start S3 from its Jump afterwards.
- **Handset:** self-contained, with the same sheet and figures.

### Beat 4: The descriptions

- **Click:**
  - On Sarah's Admin Booking (Beat 4's link), read the Procedure section and the Billing section. Then open her Booking on Mobile, which has the same sections.
  - Open Sione Davies's Booking on Dr Souter's Tue 8 Dec AM List (`/admin/day/2026-12-08/bookings/BK0164`, or 09:30 on the List on Mobile).
  - Press **History**, then **View as at** on the Mon 23 Nov 16:00 entry.
- **Say:**
  - "Every Booking screen shows the procedure text as it arrived, with when and where it came from. The Contract and the RVG code sit in the Billing section below it."
  - "The rooms sent 'RTK', then the hospital's file said 'right total knee'. The hospital's text replaced the rooms', and the rooms' words stay in the history."
  - "The invoice description starts as the text received. Where a Contract has its own invoice description, the invoice prints that instead."
- **Expected:**
  - Sarah: "lap appy ?conv to open", "24 Nov, 08:00 · Hospital download, St George's"; Billing: Invoice to Patient › Standard, Contract No contract · RVG, Paid by Sarah Mitchell.
  - Sione Davies: "right total knee", "23 Nov, 16:00 · Hospital download, St George's"; Billing: Invoice to Special › St George's, Contract "St George's RVG" STG-001, RVG code LL4 "Major hip or knee joint procedures, e.g. hip replacement, knee replacement", B 8, Paid by St George's.
  - History: "Procedure text replaced · Hospital booking download · system · integration", "'RTK' (Surgeon's rooms PDF, 17 Nov 09:00)→'right total knee' (Hospital download)". View as at lists the parts one by one: As received "right total knee", Invoice description "right total knee", RVG code LL4, Contract "St George's RVG · St George's", Paid by St George's.
  - The RTK wording is illustrative demo data.
- **Handset:** self-contained. Sarah's Booking and Sione Davies's Booking (Tue 8 Dec AM) show the same Procedure and Billing sections, and **History** on the phone shows the same entry.

#### Optional aside: the hospital's description arrives later

- **Click:** open Wiremu Tane's Booking on Dr Souter's Tue 24 Nov PM List (`/admin/day/2026-11-24/bookings/BK0006`). **Demo actions → Hospital description arrives**, choose "lap chole", then **Run**. Press **History**, then **View as at** on the 08:00 "Procedure text replaced" entry.
- **Say:** "The rooms' PDF said 'lap chole +/- IOC', and the hospital's download says 'lap chole'. The hospital's text replaces the rooms', the rooms' words go to the history, and the invoice description follows."
- **Expected:**
  - Before the press, the Procedure section reads "lap chole +/- IOC", "17 Nov, 09:00 · Surgeon's rooms PDF".
  - The result reads "The procedure text is now the hospital's “lap chole”; the text it replaced is in the History. The invoice description follows it."
  - The Procedure section then reads "lap chole", "24 Nov, 08:00 · Hospital download, Southern Cross". The Contract (Southern Cross Affiliated Provider, RVG code A3) is unchanged.
  - History: "Procedure text replaced · Hospital booking download · system · integration", "'lap chole +/- IOC' (Surgeon's rooms PDF, 17 Nov 09:00)→'lap chole' (Hospital download)". View as at: As received "lap chole", Invoice description "lap chole".
  - The wording is illustrative demo data.
- **Handset:** no mobile side. The press stands in for the hospital's download.

### Beat 5: The day arrives

- **Click:**
  - Open the live clock beside the app switcher (it reads 8:00).
  - Press **Procedure day · 1 Dec**, then **+1 hour**. Close the clock.
  - On Mobile, back to the Tue 1 Dec AM List.
- **Say:** "Now it's the morning of surgery. Anything the hospital sent in between waited at Intake for the office. The import applied nothing by itself."
- **Expected:** the clock reads "Tuesday 1 December 2026 · 9:00". The List header reads "Mr T. Hale · Orthopaedics · Today · 07:30 to 12:30", "0 of 4 complete", Sarah "RVG code to fill in".
- **Handset:** on **More**, under DEMO CLOCK, press **Procedure day · 1 Dec**, then **+1 hour**: "9:00 · Tuesday 1 December 2026". **Play the office** stays off.

### Beat 6: Capture on mobile

- **Click:**
  - Open Sarah Mitchell. Optionally press **Mark complete** now, and the form jumps to the RVG code.
  - Press **Choose the RVG code**, type "appendicectomy", pick **A3 Appendicectomy, laparoscopic**, then **Done**.
  - Press **Start now**. Open the clock, press **+1 hour**, close it, then press **Finish now**.
  - In Modifiers, press **None apply**, then **Mark complete**.
  - Back on the List, open Dylan Kereama, Nathan Ioane and Charlotte Turner in turn: **Start now**, **Finish now**, **None apply**, **Mark complete** on each.
  - Press **Mark list completed**, then **Submit to office**.
- **Say:**
  - "She reads what the hospital wrote and finds the RVG code by typing, under its body-area heading."
  - "The Price section shows what the Contract comes to as she records. It adds base units from the RVG code, time units from her start and finish, and modifiers, at her own rate per unit."
  - "Modifiers are a step she answers, even when it's none. The age modifier comes in applied, and so does any modifier already counted in the base units. She can remove either. Anything else she claims needs a short reason, ASA included."
  - "The List goes to the office only once every Booking is complete. After she submits, she can still change it until the office authorises it."
- **Expected:**
  - Early **Mark complete**: "Add the RVG code for this procedure." under the Billing section.
  - The type-ahead shows one row under "ABDOMEN": "A3 · Appendicectomy, laparoscopic · B 5". After **Done** the Billing section reads Price "RVG A3 · Appendicectomy, laparoscopic"; B · Base "From the RVG group" 5; Price "5 units x $26.50 = $132.50".
  - Start 09:00, Finish 10:00, T · Time 4 ("From start and finish stamps · RVG time tiers"); "9 units x $26.50 = $238.50"; the dock reads 9 UNITS $238.50.
  - Modifiers read "Required" until answered, then "No modifiers claimed · Change".
  - After **Mark complete** the List reads "1 of 4 complete" and "Mark list completed · 3 to finish · Tap to see what is left". Tapping it opens "Bookings still to finish", which names each Booking with "Add the start time.", "Add the finish time.", "Add any modifiers that apply, or choose None apply."
  - On the other three, **Finish now** in the same minute stamps five minutes on (10:00 to 10:05). The List reaches "4 of 4 complete" and the button reads **Mark list completed**.
  - The submit sheet: "Submit this list to the office? Submitting tells the office this list is ready for review and billing. You can still change these bookings until the office authorises the list; the office sees any change at review. Submitting says you did every procedure on this List. If a colleague is doing one, move it to them first." with **Submit to office** and **Not yet**. The List then reads "Submitted to office"; Sarah's Booking reads "Booking complete" with **Amend**.
- **Worth pointing at:**
  - On No contract · RVG the Price section has a **PRICE $** field and **Save price**: she may type a different price there.
  - **Mark complete** checks three things: a Contract; on an RVG price, the RVG code, both times and the modifiers step, with a reason for each claimed modifier; and a price. A warning never stops it.
  - The info sign beside each heading opens a short explanation.
- **Handset:** self-contained, with the same figures. Between **Start now** and **Finish now**, back out to **Lists**, then **More**, and press **+1 hour** (the Booking and List screens have no tab bar). **Submit to office** shows the same sheet.

#### Optional aside: who may type a price

- **Click:** open Dr Souter's Mon 30 Nov AM List at Forte Health: Tama Rewiri (`/mobile/lists/L-34821-2026-11-30-AM/bookings/BK0186`), then Natalie Brennan (BK0185).
- **Say:** "On No contract · RVG she can type her own price. On a Contract that fixes the discount, the price is set by the Contract, and she can change the Contract or alert the office."
- **Expected:** Tama Rewiri: No contract · RVG, T1 "Skin flap repair, complex", "4 units x $26.50 = $106.00" and a **PRICE $** field. Natalie Brennan: "6 units x $26.50 = $159.00", "Discount 10% · minus $15.90", Price $143.10, read only: "Set by Forte Health RVG less 10%. To use a different price, change the Contract or alert the office."
- **Handset:** self-contained.

#### Optional aside: a fixed price asks for no times

- **Click:** open Dr Souter's Mon 14 Dec PM List: Miriam Holloway (`/mobile/lists/L-34821-2026-12-14-PM/bookings/BK0176`), then Graham Pulley (BK0177).
- **Say:** "A fixed price needs no times or modifiers, and the RVG code is optional. No contract · Fixed price has no price of its own, so someone types the amount."
- **Expected:** Miriam Holloway: "Facelift plus 1 add on (eg bleph)", "Agreed fee $3,400.00", "Fixed price $3,400.00", no Times or Modifiers. Graham Pulley: "No contract · Fixed price", "Needs a price: No contract · Fixed price has no price of its own.", and **Mark complete** refuses until an amount is saved.
- **Handset:** self-contained.

#### Optional aside: modifiers already applied, and a claim needs its reason

- **Click:**
  - Open Margaret Ellison on Dr Souter's Tue 24 Nov PM List (`/mobile/lists/L-34821-2026-11-24-PM/bookings/BK0009`).
  - Open Callum Graham on her Mon 30 Nov PM List at St George's (`/mobile/lists/L-34821-2026-11-30-PM/bookings/BK0158`). Press **Remove** on P1, then **Put back**.
  - Press **Add a modifier** and pick **AS3 · ASA III**. Leave the explanation empty and look at **Claim**, then type a reason (for example "ASA III, insulin-dependent diabetes") and press **Claim**.
- **Say:** "Margaret's age modifier comes in applied, and Dr Souter can remove it. Callum's RVG code, S3a, already counts the position modifier in its base units, so P1 comes in at no units and can't be added twice. Anything she claims herself needs a short reason before it saves."
- **Expected:**
  - Margaret Ellison: "A1 age +1", "From the patient's age (72) on the procedure date." with **Remove**; "8 units x $26.50 = $212.00".
  - Callum Graham: RVG S3a "Cervical, posterior procedures, 1 to 2 levels, e.g. foraminotomy"; M · Modifiers "P1 included 0"; the P1 row reads "Applied", 0, "Included in the base units of S3a. Cannot be added twice." with **Remove**; "10 units x $26.50 = $265.00". **Remove** leaves "Removed: P1. Put back", and **Put back** restores the row.
  - The add sheet reads "Add a modifier · Each modifier you claim needs a short reason." Picking AS3 opens an **Explanation** box (0/200), and **Claim** stays greyed until it has text.
  - Claimed: M · Modifiers "P1 included 0 · AS3 +2", the AS3 row shows the reason with **Edit** and **Remove**, and the price reads "12 units x $26.50 = $318.00".
- **Handset:** self-contained, with the same figures.

#### Optional aside: a pre-op event at capture

- **Click:** on Callum Graham's Booking, press **Add pre-op or post-op event**. Press **Pre-op**, **ACC pre-op assessment**, **CS250 · ACC pre-op assessment** and **Fixed fee**. Type a start time (12:30) and a fee (for example 150.00), then press **Add event**. On Admin, open his Booking (`/admin/day/2026-11-30/bookings/BK0158`) and press **Edit** on the event.
- **Say:** "A pre-op assessment is its own event on the Procedure, with its ACC code and a fixed fee. Dr Souter records it at capture, and the office reviews it before it's billed in the next run."
  - **Open:** the ACC codes are still to be confirmed (OQ-12); the office's sheet says so.
- **Expected:**
  - The sheet lists three codes: "CS250 · ACC pre-op assessment", "CS260 · ACC pre-op assessment", "CS70 · ACC pre-op assessment". The date starts at the List's date, Mon 30 Nov. **Fixed fee** replaces the minutes with "FEE, EX GST"; **Add event** with no fee reads "Type the fee in dollars and cents, above $0.00 and under $100,000.00."
  - BILL TO reads "Billed to the same party as the procedure (nib)", then "Reviewed by the office, then billed in the next run."
  - Added, the Events section reads "Pre-op · Mon 30 Nov 12:30 · $150.00 ex GST", "ACC pre-op assessment · CS250 · Fixed fee", "Awaiting review", "Raised by you · nib", with **Edit** and **Remove**. The Procedure's own price does not move.
  - On Admin the event reads "Raised by Dr Souter · nib" with **Review**, and its edit sheet adds "Codes to confirm with AA's accountant (OQ-12)." under the codes.
- **Handset:** self-contained, with the same figures. The phone's sheet has no OQ-12 line; it shows on the office's sheet only.

#### Optional aside: the approval number on the day

- **Click:** on Callum Graham's Booking, under INSURER OR FUNDER (nib, Approval number NIB-AP-0158), press **Change**. Replace the **APPROVAL NUMBER** with a new one (for example NIB-AP-2041) and press **Save**. On Admin, open his Booking and press **History**.
- **Say:** "If nib's approval number changes on the day, Dr Souter corrects it on the Booking herself. The office sees the change in the history."
- **Expected:** the sheet reads "Insurer or funder · Who funds this Booking, and the insurer's approval number. It never changes who is invoiced.", with nib among INSURERS and "Without approval on the day, the patient is billed." under the number. Saved, the Booking reads Approval number NIB-AP-2041. History reads "Insurer or funder changed · Dr Melanie Souter · anaesthetist", "APPROVAL NUMBER NIB-AP-0158→NIB-AP-2041".
- **Handset:** self-contained.

### Beat 7: Edit until authorised, then find past work

- **Click:**
  - On the submitted List, open Sarah Mitchell and press **Amend**.
  - Tap the Billing section. In the sheet press **Start again**, then **Special**, then **nib**, then **Done**.
  - Press **Mark complete**.
  - In Admin, open **Review queue**. Dr Souter's Tue 1 Dec St George's AM row reads "Changed since submitted". Press **Review →**.
  - On Sarah's row press **Approve**.
  - Back on Mobile **Lists**, type "Mitchell" in the search field, then her NHI, CQY9304.
- **Say:**
  - "Sarah turns out to be insured with nib. Dr Souter changes the Contract herself. Her List is submitted, but until the office authorises it, she can still change it."
  - "The office sees what changed and who changed it, and approves the Contract change at review."
  - "Her main view starts at today. Once the office authorises a List it leaves that view, and search finds it by patient name or NHI."
- **Expected:**
  - After **Done**: Invoice to "Special › nib", Contract "nib RVG", Paid by nib, "Awaiting office approval". The price becomes read only: "Set by nib RVG. To use a different price, change the Contract or alert the office." After **Mark complete** the List still reads "4 of 4 complete" and "Submitted to office".
  - The queue row reads "Changed since submitted · 5".
  - The Review reads "Submitted 10:00", "Changed since submitted · 5", 4 bookings, 25 units, $662.50, 1 flag "to check before authorising". Sarah's row carries a "Changed" pill, billed to nib, "Changed by Dr Souter: was No contract · RVG" with **Approve** and **Correct**. Her balance warning now reads "unpaid 105 days".
  - After **Approve**: "Approved Tue 1 Dec, 10:00", flags 0.
  - Search: "4 Bookings for Mitchell". Upcoming: Tue 1 Dec · AM · St George's · lap appy ?conv to open, "Done · unbilled". Past: Mon 30 Nov · Forte Health · Laparoscopic cholecystectomy, "To finish"; Tue 18 Aug · St George's · Appendicectomy, laparoscopic, "Invoiced"; Fri 13 Mar · St George's · Laparoscopic cholecystectomy, "Invoiced". Her NHI finds the same four.
- **Handset:** self-contained up to the review: **Amend**, the Billing sheet and search read the same. Her Contract change reads "Awaiting office approval" until the office approves it. For the office's approval, on her Booking, **Demo sheet → Office approves this Contract change**, **Run**: "The office approved your Contract change." Her Booking then reads "Approved by the office Tue 1 Dec, 10:00". For authorising, use the aside below.

#### Optional aside: the office authorises, and the List leaves the main view

- **Click:** on the Review, press **Authorise for billing**, then **Authorise for billing** in the dialog. Back on Mobile **Lists**, look at Tue 1 Dec, then search "Mitchell".
- **Say:** "Authorising locks the List and raises its invoices. It leaves Dr Souter's main view, and search still finds it."
- **Expected:** the dialog reads "Authorise this list for billing?" and explains the lock. Then "List authorised · locked for billing" and "4 invoices raised. 4 emailed, 0 to post." On Mobile, Tue 1 Dec shows only the PM List. Search shows Sarah's Tue 1 Dec Booking as "Invoiced". This raises invoice numbers, so start S3 from its Jump.
- **Handset:** on the List, **Demo sheet → Office authorises this List**, **Run**: "Done. The office authorised this List and the billing run raised its invoices. They are in Balances now, and search finds the List."

### Discovery points

- OQ-83 · The anaesthetist's sign-in experience: Beat 1's screen stands in for it, labelled "Provisional"; the demo account signs in with email and password.
- OQ-13 · Hospital download format and fields, per hospital: Beat 2 imports sample files per hospital, each by an action; the fields, cadence and whether a file carries the insurer and approval number are still to be confirmed with each hospital.
- OQ-122 · Posted invoices for payers without email: Beat 3's payer may have only a postal address, and the invoice is then marked to post; built as provisional.
- OQ-12 · ACC pre-op assessment codes and fixed fee: the pre-op aside records an ACC pre-op assessment under CS250, CS260 or CS70 with a fee typed in; the office's sheet reads "Codes to confirm with AA's accountant (OQ-12)."

---

## S2 · Office day

**Serves:** the office's day: reading the sessions and Lists, warnings, Draft Lists and who covers them, sickness, the anaesthetists' own moves, the shared notifications and authorisation. **Time:** 12 to 14 minutes.

**Stage it:** Reset → Confirm reset, or Control Panel **S2 · Office day → Jump → Confirm jump**. The jump stages nothing beyond the reset ("Reset to the pristine seed; nothing staged. Follow the beats below in order.") and shows eight beat links:

- Beat 1 · Admin Day
- Beat 2 · Admin Day to-do list
- Beat 3 · Recurring bookings
- Beat 4 · Admin Day, Wed 25 Nov
- Beat 5 · Mobile Lists
- Beat 6 · Mobile Booking, Lachlan Robinson
- Beat 7 · Admin Notifications
- Beat 8 · Admin Review

Run the beats in order, because Beats 3 and 4 fill the Wednesday 25 November sessions that Beat 6 reads. The clock stays at Tuesday 24 November 2026 · 8:00 until the optional clash aside and the help line aside. Both move it forward, so run them last: the clash aside first, then **Reset** before the help line aside. On a handset, sign in as Dr Souter on the sign-in screen and keep **Play the office** off (More).

### Beat 1: Read the day

- **Click:**
  - **Admin Web App → Day view** (Tuesday 24 November). Pause on the grid.
  - Switch to the **Anaesthetist Mobile App → Availability → My calendar**. Tap **›** for December, then **4**, then **Change** on the PM session. Choose **Public hospital**, type **CPH** in **Note (optional)**, and **Save**.
  - Back in Admin, **Day view → Fri 4 Dec**. Open Dr Souter's PM session.
  - On the phone, **Availability → My calendar**, December, tap **4** again, **Change** on PM, choose **Free**, **Save**.
- **Say:** "Every anaesthetist has an AM and a PM session, and each session shows its List or its availability. Draft Lists wait in their own band at the top until someone is found. Dr Ropata's morning is Public, with the note CPH, and Dr Souter has just set her own Friday afternoon the same way. Anaesthetists set that themselves from the phone, and nobody can book into a Public session or cover it until it goes back to Free."
- **Expected:**
  - On Day view the header reads "82 anaesthetists · 85 sessions · 44 free · 0 submitted · 1 Draft List", and the side nav shows Intake 1, Draft Lists 47, Conflicts 6, Review queue 10. The grid shows the roster a page at a time, Dr Souter first, with a pager in its footer ("1 of 6"); the two icons beside the pager switch between Pages and Scroll. The band holds one Draft List, St George's · Mr S. Tan, UNASSIGNED, 16 h. Each List block carries its booking count (Dr Souter's St George's AM 5, Southern Cross PM 4). The legend reads Private, Pre-op, Holiday, Unavailable, Public, Free. Dr Ropata's AM reads "Public / CPH" and Dr Ngata's AM reads "Unavailable / Not available / ICU on call". The right rail holds the month, two tiles (**Books square** "All checks agree"; **2 pre-payments** "1 to approve") and one work card with two tabs: **To-do** 11 and **Notifications** 0 active. To-do opens with a "6 open conflicts" line, then two mild warnings (Ella Moana, a child as the payer; Janet Ormsby, nib with no approval number), Annette Riley's prepayment awaiting approval and eight Procedures marked "No Contract" with **Set Contract**.
  - On the phone the save reads "1 session set to Public hospital on Fri 4 Dec."
  - On Fri 4 Dec Dr Souter's PM reads "Public / CPH". Its drawer says "This session is marked Public. It needs to be made available, with Dr Souter's agreement, before a List or Booking can go here.", with no **Assign List** or **Book (phone advice)**. **Find available** for that PM leaves her out.
  - The reopening save reads "1 session set to Free on Fri 4 Dec."
- **Worth pointing at:** the statuses come from the list the office keeps in **Master data**. A Public session shows no List detail. The info sign beside the legend ("Reading the day") and beside **To-do**, and **Help** in the side nav (the help aside below).
- **Handset:** self-contained. **Availability → My calendar**, **›** to December, tap **4**, **Change** on PM, **Public hospital**, note **CPH**, **Save** ("1 session set to Public hospital on Fri 4 Dec."). Help is **More → Get help** (the help line).

#### Optional aside: an out-of-hours List

- **Click:**
  - On **Day view**, Tue 24 Nov, hover **Souter, Melanie** and select **Open out-of-hours session**. Keep 18:00 to 21:00 and select **Open out-of-hours session**.
  - In the drawer, **Assign List**: hospital **Southern Cross**, surgeon **Ms K. Patel**, then **Assign List**.
  - Switch to the **Anaesthetist Mobile App → Lists**.
- **Say:** "Late and emergency cases still go on a List. The office opens an evening session after PM, one a day, and puts a List in it: a new one, or a Draft List waiting for that evening. From then on it is a session like AM and PM, and its Bookings are captured and billed like any other."
- **Expected:** the sheet reads "An evening session after PM, for an emergency or late case." with "Default Out-of-hours times (18:00 to 21:00)". The drawer reads "Tue 24 Nov · Out-of-hours · ACTIVE · 0 bookings", Southern Cross, Ms K. Patel. On the phone a third row sits after PM today: "18:00 / Southern Cross / Out-of-hours · Ms K. Patel · General surgery / 0 bookings". **Find available** has an **Out-of-hours** tab for free evening sessions.
- **Handset:** **Demo sheet → The office adds an out-of-hours List for me tonight** on Lists ("The office added an out-of-hours List for tonight at 18:00."), then the same 18:00 row.

#### Optional aside: The help line and product support

Run it at the end of S2, because two of its presses move the clock forward. If you ran the staged clash aside, **Reset** first. **Reset** after it.

- **Click:**
  - Side nav **Help**. On **Help line**, choose **Something else**, type a subject ("Day view will not load on my laptop"), keep **P3**, **Send request**.
  - **Demo actions → Advance ticket**, **Run**.
  - **Demo actions → Raise out of hours**, choose **Security breach**, **Run**.
  - Open the **Product support** tab. **Demo actions → Raise ticket on a public holiday**, **Run**. Then **Demo actions → AA approves call-out**, **Run**.
- **Say:** "Help sits in every app. The help line is Stratos' line for anything in the apps, such as a lost password, open 8:30am to 5:00pm on weekdays outside New Zealand public holidays. Out of hours, only a security breach or the platform being down is answered. Product support is AA's line to Stratos for incidents, fixes, changes and new features, and on a public holiday a call-out needs AA's approval first."
- **Expected:**
  - At 8:00 the panel reads "Closed, opens 8:30am", 0800 787 286. The new request TK0006 reads "Logged", "P3 · Kirsty W.", "Not answered out of hours; picked up at the next opening".
  - **Advance ticket** reads "TK0006 Day view will not load on my laptop: now Responded."
  - **Raise out of hours** with Security breach reads "Clock now Tue 24 Nov, 7:00pm. TK0007 logged as P1 and answered out of hours: respond by Tue 24 Nov, 8:00pm." Its **Ordinary request** choice reads "TK0007 logged: not answered out of hours, picked up at the next opening."
  - On Product support, P3 is 3 business days. The public holiday press reads "Clock now 10:00am, Christmas Day. TK0008 logged: the call-out waits for AA's approval." The panel reads "Closed for Christmas Day, opens 8:30am Tuesday" (Boxing Day is observed on Monday 28 December), and TK0008 reads "P2 · Incident", "Awaiting AA's approval".
  - The approval reads "Call-out approved for TK0008. Stratos can now respond." TK0008 then reads "Best effort, no guaranteed time" and "Call-out approved".
  - Both tabs say "Both channels open at 8:30am; whether AA needs cover from 8:00am is still to be agreed (OQ-141)." The clock ends at Friday 25 December 2026, 10:00.
- **Worth pointing at:** the response times by priority, P1 within an hour and P4 at a time agreed. An ordinary request out of hours waits for the next opening.
- **Handset:** **More → Get help** opens the help line (no Product support tab on the phone). Raise a request with the subject **Capture screen froze**, then open the Demo chip above the sheet: **Demo sheet → Help line responds to this request** ("TK0006 Capture screen froze: now Responded.").

### Beat 2: Warnings on the to-do list

- **Click:**
  - **Day view**, Tue 24 Nov. **Demo actions → Raise sample warnings**, **Run**.
  - On the **To-do** tab of the work card, open the row "Mere Walsh owes $290.00 on 1 invoice ..." with **Open**.
  - Switch to the **Anaesthetist Mobile App**, open Dr Souter's **Mon 23 Nov PM** List (St George's) and tap **Alan Prentice**.
  - Switch to the **Anaesthetist Web App → Lists**, open **Mon 23 Nov PM** (St George's · Ms G. Lim) and select **Alan Prentice**.
  - Back on **Day view**, select **Clear (optional)** on Alan Prentice's to-do row.
  - **Demo actions → Clear sample warnings**, **Run**.
- **Say:** "Warnings land on the office's to-do list: a child as the payer, an insurer with no approval number, base units outside the RVG guide, a patient who still owes AA. Strong ones need action before the procedure, mild ones can wait, and the office clears each one once it has dealt with it. The triangle and the warning show on the Booking in all three apps, and no warning stops anyone completing or submitting."
- **Expected:**
  - The result reads "Raised 8 sample warnings on Dr Rutherford's Tue 24 Nov Lists, Grace Park's Booking and a NIB Booking. ... 6 rules registered. Staged: prepayment, base units, child, approval number, split, patient balance." To-do goes from 11 to 19, with **Show all (19)**: three strong rows (**Clear**: Mere Walsh's balance and prepayment, Sophie Barrett's prepayment), the mild ones (**Clear (optional)**) and the eight No Contract rows.
  - Mere Walsh's Booking opens on "Warnings 3 open": the $500.00 prepayment awaiting approval (Strong), "Mere Walsh owes $290.00 on 1 invoice, unpaid 246 days (over the 90 day threshold)" (Strong) and "Base units 6 are outside the RVG guide for A2 (guide value 4)." (Mild). Below them sits "A warning, never a block: it never stops completion or submission."
  - On the phone the Mon 23 Nov PM List shows a triangle on Alan Prentice. His Booking opens on "Warnings 1 open": "The split no longer fits the fee of $212.00 ...", Mild.
  - In the web app the same List shows the triangle beside Alan Prentice (its tooltip "The split no longer fits the fee of $212.00: the typed shares come to $250.00, ..."), and his Booking opens on "Warnings 1 open" with the same warning, "After procedure", Mild, and "A warning, never a block: it never stops completion or submission."
  - Clearing one row takes To-do to 18. **Clear sample warnings** reads "Removed 8 sample warnings. The seeded values are back." and To-do returns to 11.
- **Handset:** open a Booking, such as Margaret Ellison on Tue 24 Nov PM, then **Demo sheet → Raise sample warnings** ("Raised 5 sample warnings: the triangle and the warning at the top of the Booking. ..."). The Booking reads "Warnings 2 open": the prepayment, Strong, and "Base units 9 are outside the RVG guide for LL4 (guide value 7).", Mild. The triangle shows on the List. A warning's Clear waits on the office: **Demo sheet → Office clears this warning** plays it. Then **Demo sheet → Clear sample warnings** ("Removed 5 sample warnings.").

### Beat 3: A recurring clash becomes a Draft List

- **Click:**
  - **Master data → Recurring bookings**. **Demo actions → Stage recurring clash**, choose **Dr Souter · Tue AM · St George's · Mr T. Hale** (the list is long and opens on another anaesthetist; Dr Souter's Monday booking would land on Easter Monday 2027, a public holiday, where a recurring booking makes no List), **Run**. Read the result line.
  - Side nav **Draft Lists**. On the row **Wed 25 Nov · AM · Christchurch Eye Surgery · Ms A. Reid** ("Recurring booking · Dr Ngatai unavailable") select **Assign**.
  - Pick **Sharma, Priya** in **Not preferred with Ms Reid** to show the warning, then **Back**.
  - Pick **Morrison, Kate** by name (Tier 1; the order inside a tier changes each time), then **Assign Draft List**.
  - Optionally, open **People → Anaesthetists → Kate Morrison**: her **Rate and tier** card reads "Priority tier · Tier 1 · office only", and her **Pairings** card is the office's private list of pairing preferences.
- **Say:** "Surgeons' standing bookings make their Lists months ahead. One that lands on a session the anaesthetist has marked unavailable becomes a Draft List, and only the office assigns it. The picker lists who is free by the office's priority tiers, then preferred pairings, and a pairing someone has asked to avoid sits apart with a warning, though the office can still go ahead. Anaesthetists never see Draft Lists, tiers or pairings."
- **Expected:**
  - The result reads "Dr Souter is marked unavailable for Tue 30 Mar AM. Press Next day 6 times: when the schedule reaches that day, St George's · Mr T. Hale becomes a Draft List."
  - Draft Lists shows "Unassigned 47", soonest first, with seeded recurring clashes such as Wed 25 Nov AM Southern Cross, Ms K. Patel ("Recurring booking · Dr Beaumont unavailable", noted "Hospital closed that day").
  - The picker lists **Free** in tier order: Morrison and Delaney at Tier 1, Robertson and McLeod at Tier 2, then eleven at Tier 3 (Ngata among them) and eleven at Tier 4 (Whitaker and Ropata among them). Under **Not preferred with Ms Reid** sits Sharma, Tier 2. The **Not available** and **Already has a List** groups sit below. Their buttons ask a colleague to free a session or open the List; leave them for this beat.
  - Picking Sharma reads "Ms A. Reid prefers not to work with Dr Priya Sharma. Reason: Surgeon's preference. You can still go ahead. Only the office sees this, and going ahead is noted in the history." with **Back** and **Assign anyway**.
  - Assigning Morrison reads "Draft List assigned / Now an active List in Morrison, Kate's AM session". Unassigned falls to 46 (the side nav's Draft Lists too), and on Wed 25 Nov her AM shows the Christchurch Eye Surgery List.
- **Handset:** no mobile side. Anaesthetists never browse Draft Lists.

#### Optional aside: a request comes in, and who is free

- **Click:**
  - On **Draft Lists**, **Demo actions → Simulate incoming request**, keep **Christchurch Eye Surgery · Ms A. Reid · Thu 26 Nov PM · Email**, **Run**.
  - On **Day view**, Tue 24 Nov, **Find available → PM**, surgeon **Ms A. Reid**.
- **Say:** "Requests by phone, email or the rooms' PDF wait here too, soonest first. Find available shows who could take a List in this session."
- **Expected:** "A request came in by email: Christchurch Eye Surgery · Ms A. Reid, Thu 26 Nov PM. It waits on Draft Lists, unassigned." Find available reads "30 anaesthetists free this PM" and lists them "In tier order": Strand and Delaney at Tier 1 (in either order), seven at Tier 2 (Fitzgerald among them), then Tier 3 (Hughes among them) and Tier 4, each "Free PM", then **Not preferred with Ms Reid**: Sharma, Tier 2.
- **Handset:** no mobile side.

#### Optional aside: a phone-advice Booking

- **Click:**
  - **Day view**, Tue 24 Nov, open Dr Sharma's PM **Free** session, **Book (phone advice)**.
  - Hospital **St George's**, surgeon **Mr T. Hale (Orthopaedics)**, keep 13:00 to 17:30, **Continue to add booking**.
  - Leave the NHI empty and select **Look up**.
  - Under **Contract**, **Choose → St George's**, then **Use this Contract**.
  - **Save booking → Done**.
- **Say:** "Phone calls stay a first-class way to book. The NHI lookup fills the patient, and the procedure stays exactly as the caller said it. Then the office picks where the invoice goes, and the Contracts on offer narrow to what fits this List."
- **Expected:**
  - The lookup reads "Found Demo Patient on the NHI register. Patient and booking details pre-filled, still editable." (DEM1239, RVG code A3, "Appendicectomy, laparoscopic", **Told by** Phone), with "Looked up on behalf of Dr Priya Sharma (HPI CPN 12SHAP), only to identify this patient. Health Information Privacy Code 2020."
  - The rail runs **Invoice to**, **Payment type**, **Contract**: Patient (Suggested), St George's ("This List's hospital, under ACC"), Special (6).
  - After St George's, the funding tag ACC and the Contract ACC elective services via St George's each read "Only option". The two backstops **No contract · RVG** and **No contract · Fixed price** sit under "No contract", with "Priced from RVG units: the anaesthetist fills in the RVG code."
  - The save reads "Booking added" and "A new patient record was created for this booking." The drawer reads "Tue 24 Nov · PM · ACTIVE · 1 booking". The Booking prices at "5 units x $25.00 = $125.00", ex GST, GST $18.75.
- **Handset:** no mobile side.

#### Optional aside: the staged clash lands (run it after Beat 8)

- **Click:**
  - Clock **Next day**, six times. Side nav **Draft Lists**.
- **Say:** "When the schedule rolls forward onto that Tuesday, four months out, the standing booking meets a closed session and becomes a Draft List."
- **Expected:** the clock reads Monday 30 November; a new row reads "Tue 30 Mar · AM · St George's · Mr T. Hale", "Recurring booking · Dr Souter unavailable". Its **Assign** picker lists Dr Souter under **Not available**. The clock only moves forward: **Reset** before another scenario.
- **Handset:** no mobile side.

### Beat 4: Illness cover and unavailability

- **Click:**
  - **Day view → Wed 25 Nov**. Point at Dr Rutherford's AM: Unavailable, "Unwell, short notice".
  - In the Draft Lists band, open **Christchurch Eye Surgery · Mr J. Whitford**. Select the footer **Assign** (the last one), pick **Sharma, Priya** (Preferred, Tier 2), **Assign Draft List**.
  - Open Dr Sharma's AM List and select **Draft update email**. Read the preview, then **Close**.
  - Still on Wed 25 Nov, **Demo actions → Simulate sickness**, choose **Dr Sharma · PM · Southern Cross, to the office** (well down a long list; not the first entry, which takes Dr Souter's List that Beats 6 and 7 need), **Run**.
  - Side nav **Conflicts**.
- **Say:** "Dr Rutherford phoned in sick at 7:40, so the office marked his morning unavailable and his List came straight back as a Draft List. Kirsty hands it on from one screen, and Dr Sharma comes first in her tier because Mr Whitford prefers her. The office tells the hospital by email. Kirsty picks the change, the template fills the wording, and it goes when she sends it."
  - **Open:** the emailed Lists and this update email stay alongside the app while AA decides whether the app replaces them (OQ-124). Nothing on screen labels it.
- **Expected:**
  - The header reads "82 anaesthetists · 82 sessions · 50 free · 0 submitted · 4 Draft Lists".
  - The drawer reads "Came from Returned: anaesthetist unavailable / Returned to the office by Dr Rutherford", and **Available that session** lists Delaney Tier 1, then Sharma "Preferred" Tier 2, with **See everyone (82)**. Assigning reads "Now an active List in Sharma, Priya's AM session", and the drawer reads "Wed 25 Nov · AM · ACTIVE · 0 bookings".
  - The email dialog, "Draft cover-change email", lists the change "Anaesthetist: was Dr James Rutherford, now Dr Priya Sharma". The earlier "Returned to the office" row reads "No new anaesthetist yet. Assign the Draft List first." The template is **Change of anaesthetist**, to bookings@chcheyesurgery.example, subject "Change of anaesthetist: Wed 25 Nov AM list at Christchurch Eye Surgery", with "Opens in your mail client. The system does not send it."
  - The sickness reads "Dr Sharma recorded as Unavailable for Wed 25 Nov PM. The List went back to the Draft Lists with its Bookings. No conflict." Her PM reads "Unavailable / Unwell, short notice (phoned in, simulated)".
  - Conflicts reads "6 open", all on Wed 25 Nov ("Southern Cross is closed: Theatre maintenance closure."), the same over the whole canvas. The sickness added none, and neither do the hospitals' Christmas shutdowns: a planned shutdown makes no Lists, so nothing there conflicts.
- **Worth pointing at:** **Conflicts** lists hospital closures only, so the sickness adds no row there.
- **Handset:** self-contained. **Availability → My calendar**, **›** to December, tap **2**, **Change** on AM, **Unavailable**, **Save**. The sheet reads "You are marking this session Unavailable. Its List needs someone else." with **Return to the office** or **Hand on to a colleague**. Choose **Return to the office** (Unavailable is already chosen), then **Move List**, which reads "Returned to the office".

#### Optional aside: the office marks a booked session unavailable

- **Click:**
  - **Day view → Wed 25 Nov**, open Dr Fitzgerald's AM List (Forte Health · Ms G. Lim), **Change status**, choose **Unavailable**, **Continue**. Close the sheet to leave the List where it is.
- **Say:** "The office gets the same question the anaesthetist does. A booked session cannot go unavailable until the List has somewhere to go."
- **Expected:** "Where does this List go?", "Dr Fitzgerald will be Unavailable for this session, so the List cannot stay with them.", **Return to the office** ("It waits in the Draft Lists with its Bookings, nearest day first.") or **Hand on to a colleague** ("27 colleagues are free on Wed 25 Nov · AM, by tier, then preferred pairing." from a Reset; fewer after Beats 3 and 4).
- **Handset:** no mobile side.

### Beat 5: An anaesthetist moves their own List

- **Click:**
  - Switch to the **Anaesthetist Mobile App → Lists**. Open **Tue 1 Dec PM** (Southern Cross, Ms K. Patel).
  - Tap **List options** at the top of the List, **Move this List**, **Return to the office**. Keep **Free**, then **Move List**.
  - Switch to **Admin Web App → Day view → Tue 1 Dec**.
  - Back on the phone, open **Mon 30 Nov PM** (St George's, Ms G. Lim): **List options → Move this List → Hand on to a colleague → Dr Hannah Ropata**. Keep **Free**, **Move List**.
- **Say:** "Anaesthetists find their own cover, often at six in the morning. Dr Souter gives a List back to the office or hands it to a colleague who is free that session, and it happens at once, with nobody to accept or approve it. The List takes its Bookings with it, and she chooses what her own session becomes. She sees who is free and their phone numbers, never the office's tiers or pairings."
- **Expected:**
  - The move sheet reads "Move your List / Southern Cross · Ms K. Patel / Tue 1 Dec · PM · 2 Bookings" with "Return to the office" ("The office will find someone for it. Its Bookings go with it. Use this to withdraw from the List.") and "Hand on to a colleague" ("18 colleagues are free on Tue 1 Dec · PM.").
  - The next step reads "Your Southern Cross PM List goes back to the office with its 2 Bookings, and the office finds someone for it." with **Your session after the move** Free or Unavailable. Done reads "Returned to the office / The office can see it in its notifications."
  - On Tue 1 Dec the band shows Southern Cross · Ms K. Patel, 2 bookings, waiting 0 min, and Dr Souter's PM reads Free. The work card's **Notifications** tab reads 1 active, "Dr Souter returned Tue 1 Dec PM (Southern Cross, Ms K. Patel) to the office", and the side nav's Notifications shows 1. To-do does not change.
  - The hand-on lists "Free on Mon 30 Nov · PM": 22 colleagues in surname order, from Chen to Whitaker (Hughes, Morrison, Ngata, Ropata and Sharma among them), each with a phone number. The confirm reads "Dr Ropata gets your St George's PM List and its 1 Booking straight away. There is no need for Dr Ropata or the office to accept." Done reads "Moved to Dr Ropata / Dr Ropata and the office can see it now."
- **Worth pointing at:** a move recalculates nothing about a prepayment.
- **Handset:** self-contained, the same **List options → Move this List** path on both Lists.

#### Optional aside: a colleague moves a List into Dr Souter's free session

- **Click:** on a handset, **Availability**, then **Demo sheet → Colleague moves a List into my free session**.
- **Say:** "Moves land the other way too. A colleague hands Dr Souter a List, and it is on her schedule at once."
- **Expected:** "Dr Hughes moved Wed 25 Nov PM (Christchurch Eye Surgery) into your free session." In the framed build, the same story is Dr Souter's own move, seen from Admin.
- **Handset:** **Demo sheet → Colleague moves a List into my free session**. It fills her Wed 25 Nov PM, the session Beat 6's colleague aside also uses: run one of the two.

### Beat 6: An anaesthetist moves a single Booking

- **Click:**
  - On the phone, open **Wed 25 Nov AM** (Christchurch Eye Surgery, Mr J. Whitford) and tap **Lachlan Robinson**. Select **Move to a colleague**.
  - Type **ch** to show Dr Chen, then clear it. Pick **Dr Ben Whitaker**.
  - Tick **Tell the office**, then **Move Booking**, then **Back to your List**.
  - Switch to **Admin Web App → Day view → Wed 25 Nov** and open Dr Whitaker's AM List.
- **Say:** "Sometimes only one patient needs to move. She picks a colleague who is free that session, by name or from the list, and the Booking becomes a new List in their session, never part of someone else's List. Its Contracts go with it, and whoever does the case is paid for it. Telling the office is her choice."
- **Expected:**
  - The sheet reads "Lachlan Robinson, Cataract extraction with IOL / Wed 25 Nov · AM · Christchurch Eye Surgery · Mr J. Whitford", then "Free this session · Wed 25 Nov AM": 25 colleagues in surname order, from Bryant to Wilson (Delaney, Ngata, Ropata and Whitaker among them), each "Free this session. A new List is created for them". Morrison and Sharma took Lists here in Beats 3 and 4.
  - Typing **ch** shows "Matching colleagues, in name order", among them "Dr Alistair Chen / Not available this session. They can set it available in their app, then you can move it."
  - The confirm reads "Your Christchurch Eye Surgery AM List · 5 Bookings stay", "A new List is created in Dr Whitaker's Wed 25 Nov AM session at Christchurch Eye Surgery." and "Dr Whitaker is paid for it." Done reads "Moved to Dr Whitaker. / It is on a new List in their Wed 25 Nov AM session. / The office has been told."
  - Dr Whitaker's drawer reads "Wed 25 Nov · AM · ACTIVE · 1 booking", "Booking moved here by Dr Souter, Tue 24 Nov, 08:00", and Lachlan Robinson keeps "Christchurch Eye Surgery RVG".
- **Handset:** self-contained, the same path. From a fresh reset Morrison and Sharma are in the free list too.

#### Optional aside: a moved Booking keeps its Contract

- **Click:**
  - **Day view → Mon 14 Dec**, open Dr Souter's PM List (St George's, Ms G. Lim, 5 bookings). Select **Move** on **Fiona Lattimer**, then **Souter · AM · ACTIVE** (Forte Health · Mr C. Okafor).
  - Open Fiona Lattimer from the AM List with **Open**.
  - Back on the AM List, move her back: **Move** on her row, then **Souter · PM · ACTIVE**.
- **Say:** "A move never resets a Contract or a typed price. If the Contract no longer fits the new List, the Booking keeps it and the office checks it at review."
- **Expected:** the dialog reads "Move booking to another list" with an advisory on each target ("Advisory: different hospital, different surgeon. Pairing is not enforced."). The PM List drops to 4 bookings and the AM List reads 1 booking. Her Booking keeps Face lift at "Agreed fee $3,100.00" and reads "This List does not offer Face lift. The Booking keeps it; the office checks it at review." On a submitted List, Review shows the same thing as the flag **Contract not offered on this List** (Rosalind Kerr in Beat 8's review-flags aside). Moved back, the line is gone and the Contract reads Face lift, MER-001.
- **Handset:** the phone shows the moved Booking on Dr Souter's List, but there is no stand-in for the office's move.

#### Optional aside: a colleague hands a Booking to Dr Souter

- **Click:** **Day view → Wed 25 Nov**, **Demo actions → Colleague hands a Booking to Dr Souter**, **Run**.
- **Say:** "Here a colleague hands Dr Souter one of their cases. It lands as a new List in her free afternoon."
- **Expected:** "Dr Hughes moved a Booking (Wed 25 Nov PM, Christchurch Eye Surgery) to Dr Souter. A new List was created." Her Wed 25 Nov PM shows Christchurch Eye Surgery, 1, Ms A. Reid. Its notice tops the Notifications pool, so Beat 7's counts read one higher.
- **Handset:** **Demo sheet → Colleague moves a Booking to me** on Lists. From a fresh reset its choice is "Dr Hughes · Wed 25 Nov PM · Christchurch Eye Surgery". After the Beat 5 hand-on it offers many rows, Dr Hughes's first: pick the Dr Ropata · Mon 30 Nov PM row ("Dr Ropata moved a Booking (Mon 30 Nov PM, St George's) to you. It is on a new List in your free session.").

### Beat 7: The notification pool

- **Click:**
  - On the phone, open **Wed 25 Nov AM**, **List options → Alert the office**, type a note ("Mr Whitford may add a sixth case. Please check with his rooms."), **Send to the office**.
  - **Admin Web App →** side nav **Notifications** (Day view's work card has the same pool on its **Notifications** tab, with **See all notifications**).
  - On Dr Ropata's row select **Draft cover-change email**, read it, **Close**.
  - **Resolve** the alert row, then tick **Show resolved**. Untick it.
  - **Demo actions → Colleague moves a List to the office**, **One move**, **Run**; then **A busy morning (8 moves)**, **Run**.
- **Say:** "When an anaesthetist moves a List, a notice lands in one pool the whole office shares. A single Booking she moves posts one only when she ticks Tell the office, and the office's own reassignments post none. Nothing in the pool needs approving, and resolving a notice clears it for everyone. Her alerts land here too, and the cover email goes from the notice."
- **Expected:**
  - The phone reads "The office has been alerted / It shows in the office's notifications with your note." and the List shows the note.
  - Notifications reads "4 active": the alert with its note (**Resolve**, **Open List**), the Booking move with **Draft update email** (**Open Booking**), the move to Dr Ropata with **Draft cover-change email**, and the return with "Assign this Draft List first. Its cover email is drafted from the List drawer after."
  - The email lists "Anaesthetist: was Dr Melanie Souter, now Dr Hannah Ropata", to bookings@stgeorges.example, subject "Change of anaesthetist: Mon 30 Nov PM list at St George's".
  - **Resolve** takes it to 3 active. **Show resolved** shows the alert with "Resolved by Kirsty W., Tue 24 Nov, 08:00".
  - One move reads "Dr Morrison returned Tue 24 Nov AM (St George's) to the office. It is now a Draft List." The busy morning reads "8 Lists moved by their anaesthetists: 4 returned to the office, 4 handed on. See them on the Notifications page." The pool reads 12 active, over more than one page of the footer pager.
- **Worth pointing at:** **Show resolved** brings a resolved notice back with who resolved it and when; nothing expires. The four active rows are all Dr Souter's: the office's assignments and sickness in Beats 3 and 4 posted none. An office **Reassign list** from a List's drawer (from a Reset, Dr Souter's Tue 1 Dec PM to Hughes) reads "List reassigned / Moved to Hughes, Rawiri", leaves the pool at "0 active" and shows in the List's **History** as "List reassigned".
- **Handset:** the alert is self-contained (**List options → Alert the office**). **Demo sheet → Office resolves this alert** on that List ("The office resolved your alert."), and the List reads "The office has dealt with this" with her note.

### Beat 8: Authorise a submitted List

- **Click:**
  - Side nav **Review queue → Dr Kate Morrison, Mon 23 Nov → Review →**.
  - Open the info sign on the **Procedures** heading. Pause on the rows.
  - **Authorise for billing**, then **Authorise for billing** in the confirm.
- **Say:** "On a submitted List, each row shows the procedure as received, its Contract and RVG code, who pays, and any flag. The office can change any price or payer here. Nothing goes back to the anaesthetist; if something needs clarifying, Kirsty phones and fixes it here. Authorising locks every Booking and raises the invoices in the same step."
- **Expected:**
  - The queue reads "9 in the queue" (the nav badge 10 counts 1 Event).
  - The List reads "St George's · AM list / Dr Kate Morrison · Mr S. Tan · Urology · MON 23 NOV", Submitted 13:35, BOOKINGS 6, TOTAL UNITS 50, TOTAL FEE $1,670.00, FLAGS 0. Each row carries its procedure text, Contract (St George's RVG · RVG at the anaesthetist's rate; Gavin Brown's ACC elective services via St George's · RVG at $25.00 per unit), RVG code and "Paid by St George's". The totals read "50 $1,670.00 @ $35.00/unit (list rate)".
  - The tip reads "Each procedure shows its wording as received, its Contract and the RVG code. ..." The confirm says "There is no return to the anaesthetist from here."
  - The banner reads "List authorised · locked for billing / MON 23 NOV, 08:00 · Kirsty W. / 6 invoices raised. 6 emailed, 0 to post." The queue falls to 8, and Recently billed adds "Morrison · St George's AM · MON 23 NOV · billed 08:00 · 6 invoices".
- **Worth pointing at:** the flags column, which points at what needs a look. The anaesthetist can edit the List until the office authorises it.
- **Handset:** on Dr Souter's submitted **Mon 23 Nov AM** List, **Demo sheet → Office authorises this List** ("Done. The office authorised this List and the billing run raised its invoices. They are in Balances now, and search finds the List."); the List shows its invoices. Reset before S3, which authorises that List itself.

#### Optional aside: the review-flags List

- **Click:**
  - **Review queue → Dr Alistair Chen, Tue 17 Nov (Christchurch Eye Surgery, Mr J. Whitford) → Review →**.
  - On Diane Fairweather select **Approve** (or **Correct**).
- **Say:** "Here every flag is up at once: a Contract the anaesthetist changed, a typed price beside the computed one, a Contract this List does not offer, one disabled before the procedure date. The office checks each one, and approves or corrects each Contract change. Flags never hold up authorising. A Procedure with no price does, and so does a Booking that is not completed, and Hemi Walker here is both."
- **Expected:** BOOKINGS 5, TOTAL UNITS 23, TOTAL FEE "Needs a price", FLAGS 6. Diane Fairweather reads "Changed by Dr Chen: was Cataract IOL (LA by Anaesthetist)" with **Approve** and **Correct**, $206.50. Owen Prendergast reads "Price typed: $1,200.00 (computed $265.50)". Hemi Walker reads "Needs a price" and "Not marked completed". Rosalind Kerr reads "Contract not offered on this List", $3,400.00. Margaret Ellery reads "Contract disabled on Fri 13 Nov", $175.00. The footer reads "Not complete: Hemi Walker. Complete it before authorising.", "6 flags open." and "Hemi Walker: Needs a price: No contract · Fixed price has no price of its own." with **Open**, and offers **Approve the Contract change**.
- **Handset:** no mobile side in this aside.

#### Optional aside: the payer review List

- **Click:**
  - **Review queue → Dr Alistair Chen, Fri 20 Nov (Christchurch Eye Surgery, Ms A. Reid) → Review →**. Point at the triangles.
  - **Authorise for billing → Authorise for billing**, then side nav **Invoices** and open the Whitcombe Family Trust invoice.
- **Say:** "The payer sits on each Procedure. A child paying gets a mild warning, and an insurer with no approval number is the one insurance warning. A family trust can pay by post. Payers are never matched on name or email, so Joyce Halvorsen's son is invoiced once for each Procedure he pays. Nothing here stops the office authorising."
- **Expected:**
  - BOOKINGS 6, TOTAL UNITS 46, TOTAL FEE $1,357.00, FLAGS 1. Ella Moana reads "Ella Moana is under 18 and is the payer. ..." and "Under 18". Kevin Doherty reads "Email or postal address needed". Robert Whitcombe reads "Payer: Whitcombe Family Trust (Family trust)" and "Post: PO Box 13245, Christchurch 8141". Janet Ormsby reads "nib is named but there is no approval number. ..." with "Insurer: nib / No approval number" and "Paid by nib". Peter Tawhiri reads "Funder: Health NZ", no warning. Joyce Halvorsen's two Procedures each read "Payer: Erik Halvorsen (Son)".
  - The banner reads "7 invoices raised. 5 emailed, 1 to post, 1 needs an invoice address."
  - The trust's invoice ($206.50, GST $30.98, total $237.48) shows **Delivery** "To post", "SIMULATED POSTING" and "Provisional (OQ-122)"; Kevin Doherty's reads "No invoice address".
- **Handset:** no mobile side.

#### Optional aside: Full scale

About 2 minutes, last, or when someone asks about volume. The full-scale data lives in memory only: move with the Admin side nav, never the address bar.

- **Click:**
  - **Day view**, **Demo actions → Load full-scale data**, **Run**, **Confirm**.
  - Page the Day view. Side nav **Invoices**, **Billing monitor**, **Audit**. Open the banner's **Timings**.
  - **Reset → Confirm reset**.
- **Say:** "The everyday demo already runs on the whole practice. This builds the full volume behind it in the browser, from the same seed: every session of all 85 anaesthetists over the four-month horizon and a year of invoices. Each screen shows its render time at demo size and at this size."
- **Expected:** the banner reads "Full-scale data · 85 anaesthetists · 20,092 sessions over the scheduling horizon (4 months) · 28,361 invoices in the last 12 months · generated in 3.4 s · saving paused. Reset or reload returns to the demo data." (the time varies run to run). Day view: the footer pager reads "1 of 7". Invoices: "Showing 1 to 50 of 28,314". Billing monitor: "Anaesthetists 1 to 20 of 75", Awaiting approval 141. Audit: "Showing 1 to 100 of 180,031". **Timings** says "Median of the last five samples on this laptop. Formal performance testing is a Testing-milestone task." Quote no milliseconds: they depend on the machine. After Reset the banner goes.
- **Handset:** no mobile side.

### Discovery points

- OQ-141 · Support cover from 8:00am: both support channels open at 8:30am, and the help panel says whether AA needs cover from 8:00am is still to be agreed.
- OQ-124 · The app as the anaesthetist's source of truth instead of emailed Lists: the emailed Lists and Beat 4's update email stay alongside the app; nothing on screen labels it.
- OQ-122 · Posted invoices for payers without email: a payer with only a postal address gets an invoice marked to post, labelled provisional on its Delivery block (payer review aside).

---

## S3 · Money end to end

**Serves:** the Billing Engine at the centre: authorise and the pricing snapshot, one invoice per payer, the five pricing kinds, a discount line and a $0 invoice, the Xero pair, the payment detected from Xero, the weekly payment run, AA's monthly fee and a ledger that balances. **Time:** 11 to 13 minutes.

**Stage it:** Reset → Confirm reset, or Control Panel **S3 · Money end to end → Jump → Confirm jump**. The jump resets to the pristine seed and checks that Dr Souter's Mon 23 Nov AM and PM Lists are both SUBMITTED in the Review queue (it reports a failure if they are not). It shows seven beat links:

- Beat 1 · Admin Review
- Beat 2 · Admin Review, Mon 16 Nov
- Beat 3 · Xero pair, after authorise (live once Beat 1 has raised the invoices)
- Beat 4 · Billing monitor
- Beat 5 · Billing monitor
- Beat 6 · AA fee invoices
- Beat 7 · Admin Ledger

Nothing is invoiced until you authorise live. Run the beats in order, because the invoice numbers below (AA-2026-0002 to 0010) assume it. Two asides must run before a later step: the Split before you authorise the PM List, and Make primary before Beat 2 authorises Mon 16 Nov. Beat 5's run pays the whole practice, and after it the demo data no longer fits the browser's storage, so from Beat 6 on nothing more is saved: move between screens with the side nav and the app switcher, never a reload or a typed address, or Beats 6 and 7 are lost (the Jump restores the start).

### Beat 1: Authorise

- **Click:**
  - **Admin → Review queue** ("9 in the queue"). Open Dr Melanie Souter's **Forte Health · AM**, MON 23 NOV, with **Review →**.
  - Pause on the three rows: Brian Holt $318.00 (12 units, a primary and an additional procedure), Ruth Kim $344.50 (13 units), Esther Patel $238.50 (9 units), each Contract "Forte Health RVG · RVG at the anaesthetist's rate", each Procedure's Paid by Forte Health. Totals: 34 units, $901.00, "@ $26.50/unit (list rate)".
  - **Authorise for billing**. Read the confirm aloud, then **Authorise for billing** in the dialog.
  - **Next in queue** opens **St George's · PM**: Alan Prentice $212.00 (billed to "Split"), Daniel Liu $318.00, Rangi Walsh $265.00. **Authorise for billing**, then confirm.
  - **View invoices**, then **View →** on **AA-2026-0002 · Brian Holt**.
  - On the invoice, pause on the head, the two lines, the foot, then the rail's **Delivery** and **Locked record** cards.
  - Back to **Invoices**, then **View →** on **AA-2026-0005** (nib), then **AA-2026-0006** from its **Related invoices** card.
- **Say:** "Authorising locks each Procedure's pricing, and the run raises and sends every invoice from that locked record in the same moment. Each invoice is in Dr Souter's name, with AA as her agent. Procedures with one payer share an invoice, so Brian Holt's two procedures make one. Alan Prentice's knee is split between nib and Alan, so it makes two."
  - **Open:** the agency wording is provisional (OQ-29). nib's invoice goes by email; how nib's portal takes claims is still open (OQ-114).
- **Expected:**
  - The confirm reads "Authorising locks every Booking on this List (no further edits by anyone) and locks each Procedure's Contract onto it: its settings, the price range in force, the rate, the price, who is billed and who is paid. The Billing Engine raises the invoices from that locked record and sends them now, one for each billable party; a later Contract edit never changes them."
  - The AM banner reads List authorised · locked for billing, "3 invoices raised. 3 emailed, 0 to post."; the PM banner "4 invoices raised. 4 emailed, 0 to post." Each row gains "Paid to Dr Melanie Souter", and the totals rate reads "@ $26.50/unit (locked)". The Review queue badge drops from 10 to 8.
  - AA-2026-0002 · Forte Health:
    - Lines: "Inguinal hernia repair · Base 5 + Time 5 + Modifiers 0 = 10 units at $26.50" $265.00 and "Umbilical hernia repair, same anaesthetic · Additional procedure: Time 2 units at $26.50" $53.00. Subtotal $318.00, GST (15%) $47.70, Total due $365.70.
    - Head: Dr Melanie Souter, "GST number 104-348-211"; "Issued by Anaesthesia Associates Limited as agent for Dr Melanie Souter. AA GST number 102-345-678." with the Provisional (OQ-29) pill.
    - **Delivery**: "Emailed to accounts@fortehealth.example at 08:00", SIMULATED SEND, **Resend**, **Print**.
    - **Locked record**: each line's Contract (Forte Health RVG, "FORTE-001 · RVG at the anaesthetist's rate · bills holder"), Billed to Forte Health, its price ("10 units @ $26.50/unit (locked)"), Split "Full", Paid to Dr Melanie Souter, "Priced on Mon 23 Nov 2026", "Locked Tue 24 Nov, 08:00 by Kirsty W."
  - The Invoices list: AA-2026-0002 Brian Holt $365.70, AA-2026-0003 Ruth Kim $396.18, AA-2026-0004 Esther Patel $274.28 (Forte Health); AA-2026-0005 Alan Prentice · nib $152.38, AA-2026-0006 Alan Prentice $91.43, AA-2026-0007 Daniel Liu $365.70, AA-2026-0008 Rangi Walsh $304.75 (St George's); each "Emailed 08:00".
  - AA-2026-0005 to nib: "This fee of $212.00 is split. The other share is invoiced separately to Alan Prentice, AA-2026-0006."; line "Knee arthroscopy: share of the fee of $212.00 ($132.50)", "Base 4 + Time 4 + Modifiers 0 = 8 units at $26.50"; $132.50 + GST $19.88 = $152.38; "Emailed to claims@nib.example at 08:00". Locked record: No contract · RVG, "AA-RVG · RVG at the anaesthetist's rate · bills payer", Split "Split: $132.50 to nib, the rest to Alan Prentice".
  - AA-2026-0006 to Alan Prentice: "Knee arthroscopy: share of the fee of $212.00 (the rest)" $79.50 + GST $11.93 = $91.43, "Payment is due on receipt of this invoice.", emailed to alan.prentice11@example.net.
- **Worth pointing at:**
  - The **Locked record** card holds what authorise locked: the Contract and its price range, the units and rate, the price and where it came from, who is invoiced and who is paid.
  - Each Procedure's Contract decides who is invoiced: its holder ("bills holder", Forte Health RVG) or the payer on that Procedure ("bills payer", No contract · RVG on Alan Prentice's knee).
  - Prices are held without GST, and GST goes on at the invoice foot. The head carries Dr Souter's GST number.
  - St George's invoices (AA-2026-0007) print "Your reference SGANAES01", the Contract's holder reference code.
  - Ruth Kim's Booking (**Open** on her Review row, `/admin/day/2026-11-23/bookings/BK0023`) shows Contract locked at authorise and the same locked record in its **Office billing setup**: "Price $344.50 · 13 units @ $26.50/unit (locked)", Booking total $344.50 ex GST, GST $51.68.
  - The five pricing kinds sit in the PRICING column of the **Contracts** list (search each code): "RVG at the anaesthetist's rate" (FORTE-001), "RVG at $26.50 per unit" (ARIA-001, the Contract's rate), "RVG less 10%" (FORTE-002), "$3,100.00 from 5 Oct 2026" (MER-001, a fixed price) and "Amount typed on the Procedure" (AA-FIX, the open price). Say: "One pricing rule prices all five. A price follows its Contract, the range in force or the rate or discount as it stands, until a typed price, a prepayment invoice or authorise holds it. If nothing gives a price, the Procedure reads Needs a price."
- **Handset:** **Demo sheet → Office authorises this List** on the Mon 23 Nov AM List, then on the PM List (both under "Earlier, not yet authorised" on Lists): "Done. The office authorised this List and the billing run raised its invoices. They are in Balances now, and search finds the List." Both Lists leave Lists; Balances reads Outstanding to you $13,300.92, 16 unpaid invoices.

#### Optional aside: the Split (before you authorise the PM List)

- **Click:**
  - On the PM List's Review, **Open** on Alan Prentice's row (`/admin/day/2026-11-23/bookings/BK0025`).
  - Pause on the Billing section: Paid by "nib $132.50, Alan Prentice $79.50 (the rest)", with **Change** and **Split**.
  - **Split**. Type nib's share as **62.5%**, then **60%**, then **62.5%** again.
  - **Add a party**. Open **Party 3** and pick **Another person**. Type a name (Margaret Prentice), pick **Mother**, type an email, then type her share as **$20**.
  - **Apply**, then **Discard** in the save bar.
- **Say:** "Anyone can split a Procedure's fee, the office here or Dr Souter on her phone, until the List is authorised. Each share is typed in dollars or per cent, and one party takes the rest. A share can go to someone who isn't a Party, like Alan's mother, typed in with her name and an email or a postal address. The Contract has no split setting."
- **Expected:**
  - The sheet **Split the fee** reads "Type each share in $ or %; one party can take the rest.", "Procedure fee, before GST $212.00", PARTY 1 nib (Insurer) $132.50, PARTY 2 Alan Prentice (Payer) "The rest of the fee", **Takes the rest**, $79.50, **Add a party**, "$212.00 of $212.00", **Remove split**, **Apply**.
  - 62.5% gives $132.50 and $79.50, the same split. 60% gives $127.20 and $84.80. Type the per cent sign: "62.5" alone reads as $62.50.
  - The Party 3 list ends with **Another person**, "Someone who is not listed: type their name and contact". It opens "Party 3: another person" with Name, Relationship (optional) (Mother, Father, Guardian, Benefactor, Family trust), Email, Address and Phone (optional). Until an email or an address is typed it reads "Add an email or a postal address for this person. They need one to receive the invoice."
  - With $20 typed, Alan Prentice's rest drops to $59.50, Party 3 reads $20.00, and the foot still reads "$212.00 of $212.00".
  - After **Apply**, Paid by reads "nib $132.50, Alan Prentice $59.50 (the rest), Margaret Prentice $20.00" and the save bar "1 unsaved change". **Discard** puts back "nib $132.50, Alan Prentice $79.50 (the rest)".
  - On the Admin Booking an applied change waits in the save bar until **Save changes**. If you save 60% and authorise, nib's invoice reads $146.28 and Alan's $97.52, and Beat 1's figures change.
- **Handset:** self-contained. On the phone, Alan Prentice's Booking on the Mon 23 Nov PM List shows Paid by "nib $132.50, Alan Prentice $79.50 (the rest)", "Split 2 ways", and the same **Split** button.

#### Optional aside: the 3-procedure Booking (before Beat 2)

- **Click:**
  - **Review queue →** Dr Souter's **Forte Health · AM**, MON 16 NOV (`/admin/review/L-34821-2026-11-16-AM`). Pause on Graeme Tullett's row: "M 7 · split 3 · 2 · 2", 24 units, $636.00.
  - **Open** on his row (`/admin/day/2026-11-16/bookings/BK0184`). **Make primary** on the umbilical hernia repair, then **Make primary** in the confirm.
  - **Discard** in the save bar.
  - Optional: **Demo actions → Load 3-procedure Booking (7 modifier units)**, open the loaded Booking on Wed 25 Nov AM (web `/web/lists/L-34821-2026-11-25-AM`, Graeme Tullett), then **Demo actions → Hospital feed changes the primary**.
- **Say:** "Three procedures under one anaesthetic. The RVG rule puts the base units and the modifiers on the primary, and each additional procedure earns its own time. Once the modifiers pass four they split, here 3, 2 and 2. Make a different procedure primary and the base units come from its RVG group; the rule always applies, with no switch to turn it off."
- **Expected:**
  - The laparoscopic cholecystectomy is primary, with A1 pre-applied from his age (74) and AS3, OB3 and emergency claimed: 7 modifier units. Booking total 24 units, $636.00 ex GST, GST $95.40.
  - The confirm reads "Make this the primary procedure? ... Laparoscopic cholecystectomy becomes an additional procedure and stops carrying base units." with **Keep Laparoscopic cholecystectomy** and **Make primary**. After it: 22 units, $583.00, GST $87.45, and the save bar "4 unsaved changes". **Discard** puts back $636.00.
  - The load reads "Loaded on Dr Souter's Wed 25 Nov AM List: 3 procedures, 7 modifier units, split 3 · 2 · 2." (then "Already loaded on Wed 25 Nov AM"). The feed press reads "Hospital feed made A2 · Umbilical hernia repair the primary. Base units now come from it." and the total moves from $636.00 to $583.00. On a submitted List the feed press is disabled: "A hospital feed cannot change a submitted List".
  - On a mixed Booking whose primary has a fixed price, no base units bill. Gareth Mills's gastric bypass (`/admin/day/2026-11-17/bookings/BK0028`) reads "Agreed fee $2,800.00" and "No base units billed on a fixed price (provisional, OQ-132)"; his hernia repair bills on its own time.
- **Handset:** **Demo sheet → Load 3-procedure Booking (7 modifier units)** on any of Dr Souter's open Lists, then **Demo sheet → Hospital feed changes the primary** on the loaded Booking. **Make primary** is on the phone's Booking too.

#### Optional aside: Parties and one Contract per priced item

- **Click:**
  - **Admin → Contracts**, then its **Parties** and **Funding tags** tabs, then **People → Specialties**.
  - Back on **Contracts**, search **AA-FIX** and open **No contract · Fixed price**.
- **Say:** "Everyone who holds a Contract is a Party: hospitals, insurers, funders, surgeon groups, surgeons, anaesthetists and AA, with insurers like any other. Every priced item is its own Contract. Funding tags say who funds a hospital's work, and specialties decide where a Contract is offered. Each change is audited, so every row has its History."
- **Expected:**
  - **Parties** (52) groups them: Anaesthesia Associates; Hospitals (Christchurch Eye Surgery, 9 active, then Christchurch Public, Forte Health, Southern Cross and St George's, 2 active each); Insurers (AIA Health, Kowhai Health Cover, nib with 1 active, Southern Cross Health Society, Tasman Medical Insurance); Funders (ACC, Health NZ, NZDF, Veterans Affairs); Surgeon groups (Aria Skin and Laser Clinic, Canterbury Orthopaedic Surgeons, Merivale Plastic Surgery, Unisports Ortho); Surgeons and anaesthetists (33, among them Dr Melanie Souter, 4 active, and Mr P. Doyle, 2 active). Each row has **History** and **Open** (the Party's page).
  - **Funding tags**: SXAP (Southern Cross Health Society, 7 active Contracts), HNZ (Health NZ, 2), ACC (ACC, 4), with **Up** and **Down** for their order. Below, "Contracts under SXAP · 7 active Contracts" lists its hospitals: Christchurch Eye Surgery 6 and Southern Cross 1, each with **View Contracts**.
  - **People → Specialties**: 12 specialties, each with its surgeons and Contracts, under "Every surgeon holds one or more. A Contract with none is offered for every specialty."
  - **Contracts**: "147 Contracts active. Grouped by kind." (Anaesthesia Associates 3, Hospitals 39, Insurers 9, Surgeon groups 13, Surgeons 72, Anaesthetists 11, 50 to a page). The system Contracts (No contract · RVG AA-RVG, No contract · Fixed price AA-FIX, Prepaid · Fixed price AA-PRE, and one RVG and one Fixed price per holder and tag, such as "Christchurch Eye Surgery · SXAP · Fixed price" CES-SXAP-FIX) carry the System tag. AA-FIX's page reads "Made by the system: one Fixed price Contract for each place an invoice can go, where a person types the amount on the Procedure. It is always available and never disabled. Only its name, AA code and invoice description can change."
- **Handset:** no mobile side.

### Beat 2: A discount line and a $0 invoice

- **Click:**
  - Open Natalie Brennan's Booking on Dr Souter's Mon 30 Nov AM List (`/admin/day/2026-11-30/bookings/BK0185`). Pause on the price card and the Booking total.
  - **Review queue →** Dr Souter's **Forte Health · AM**, MON 16 NOV (the beat link). Pause on Ihaia Paewai's row.
  - **Authorise for billing**, then confirm.
  - **View invoices**, then **View →** on **AA-2026-0010 · Ihaia Paewai**.
- **Say:** "Natalie Brennan's Contract is Forte Health RVG less 10%. The discount is its own line, so Forte sees the full RVG price and the discount beside it. Ihaia Paewai's scar revision costs nothing, because Dr Souter typed a price of zero. It still gets an invoice, sent like any other, with nothing to pay and nothing to pay out."
- **Expected:**
  - BK0185: Contract Forte Health RVG less 10% · FORTE-002; PRICE "6 units x $26.50 = $159.00", "Discount 10% · minus $15.90", Price $143.10; Booking total 6 units, $143.10 ex GST, GST $21.47.
  - Mon 16 Nov Review: 2 bookings, 31 units, $636.00, 1 flag. Ihaia Paewai: Contract "No contract · RVG · RVG at the anaesthetist's rate · Price typed $0.00", "Price typed: $0.00 (computed $185.50)", fee $0.00, "No charge". Banner "2 invoices raised. 2 emailed, 0 to post."
  - AA-2026-0010 to Ihaia Paewai with the No charge pill: "Scar revision, forearm" 7 units $0.00, Subtotal $0.00, GST $0.00, Total due $0.00, "No charge: nothing to pay or disburse". Delivery "Emailed to ihaia.paewai171@example.net at 08:00". Locked record Price "$0.00 · typed". **Credit note** reads "A no-charge invoice has nothing to credit." Ledger card: PAYABLE "None (no charge)".
  - AA-2026-0009 Graeme Tullett, to the patient, $636.00 + GST $95.40 = $731.40 (three lines: 15 units $397.50, 4 units $106.00, 5 units $132.50).
- **Handset:** the discount is on the phone's Booking (Mon 30 Nov AM, Natalie Brennan): "Discount 10% · minus $15.90", Price $143.10, "Set by Forte Health RVG less 10%. To use a different price, change the Contract or alert the office." For the $0 invoice, **Demo sheet → Office authorises this List** on the Mon 16 Nov AM List: Graeme Tullett's AA-2026-0009 joins Balances at $731.40; the $0 invoice has no row, because nothing is owed to her.

#### Optional aside: the discount on an invoice (instead of Beat 1's plain authorise)

- **Click:**
  - From a fresh jump, on the Mon 23 Nov AM Review, **Open** on Ruth Kim's row.
  - Select the Contract (**Forte Health RVG · FORTE-001**), pick **Forte Health RVG less 10%** ("FORTE-002 · RVG, discounted"), then **Save changes**.
  - Back on Review, **Authorise for billing**, then open **AA-2026-0003**.
- **Say:** "The office can change a Contract until the List is authorised. The discount then prints as its own line on the invoice."
- **Expected:**
  - The price card reads "13 units x $26.50 = $344.50", "Discount 10% · minus $34.45", Price $310.05; the save bar "1 unsaved change". Review shows her row at $310.05 and the List at $866.55.
  - AA-2026-0003: "Base 6 + Time 5 + Modifiers 2 = 13 units at $26.50" $344.50, a "Discount 10%" line of -$34.45, Subtotal $310.05, GST $46.51, Total due $356.56; Locked record "13 units @ $26.50/unit (locked), less 10%".
  - This replaces Ruth Kim's $396.18 in Beat 1, so every later total that includes it moves. Read those from the app.
- **Handset:** no mobile side.

#### Optional aside: the price rules

- **Click:**
  - **Anaesthetist Web App → Lists →** Dr Souter's Mon 30 Nov AM List at Forte Health (`/web/lists/L-34821-2026-11-30-AM`). Open Heather Sinclair, Natalie Brennan, then Tama Rewiri.
  - **Admin**: open Graham Pulley's Booking (`/admin/day/2026-12-14/bookings/BK0177`) and Gareth Mills's (`/admin/day/2026-11-17/bookings/BK0028`). Point at **Change price** under **Office billing setup**.
- **Say:** "Heather Sinclair's Contract prices RVG units at its own rate, $26.50 here, and Natalie Brennan's takes 10% off Dr Souter's rate. Neither lets her change the price. Tama Rewiri is on No contract · RVG, which does, and on No contract · Fixed price she types the amount, because that Contract has no price of its own. A fixed price comes from the Contract's price range. The office can change any price, with no reason needed, until the List is authorised or a prepayment invoice is raised."
- **Expected:**
  - The List reads "0 of 5 complete", 21 units, $540.60.
  - Heather Sinclair (Aria Skin and Laser Clinic, ARIA-001): "RVG code to fill in", "0 units x $26.50 = $0.00", "Set by Aria Skin and Laser Clinic. To use a different price, change the Contract or alert the office."
  - Natalie Brennan: "Discount 10% · minus $15.90", Price $143.10, "Set by Forte Health RVG less 10%...".
  - Tama Rewiri: "4 units x $26.50 = $106.00", a PRICE $ field and **Save price**.
  - Graham Pulley: No contract · Fixed price, AA-FIX, "Type the price for this procedure.", "Needs a price: No contract · Fixed price has no price of its own."
  - Gareth Mills: Contract Gastric bypass DOYLE-001, "Agreed fee $2,800.00", "Fixed price $2,800.00", Booking total 23 units $2,861.00 ex GST.
  - A hospital's own fixed prices are its Contracts in **Contracts** (Christchurch Eye Surgery's items, such as Cataract IOL (LA by Anaesthetist)).
- **Handset:** self-contained. The Mon 30 Nov AM List is on the phone with the same price lines and the same "Set by ..." wording.

#### Optional aside: a backdated price range

- **Click:**
  - **Contracts**, search **Face lift** and open **MER-001 · Face lift** (Merivale Plastic Surgery's combination). Pause on its **Price ranges** card.
  - **Demo actions → Demo: add a backdated price range**, **Run**.
- **Say:** "A fixed price changes by adding a price range from a date, and the date can be in the past. Every Procedure on the Contract that nothing holds re-prices at once. A typed price holds, and so does an authorised one. The office gets the list of authorised Procedures that kept their old price."
- **Expected:**
  - **Price ranges**: "The range in force on the procedure date gives the price.", one row, 5 Oct 2026, Onwards, $3,100.00, First, 5 Procedures, In force, with **Correct**, then **Add a price range** and "Newest first. A range runs to the day before the next one starts. A start may be in the past: every Procedure on this Contract that nothing holds re-prices at once, and invoices already raised stay as they are."
  - The press reads "Added a range from 4 Nov 2026 at $3,300.00 to the Face lift. Unedited Face lift Bookings now price at $3,300.00; the typed and the invoiced ones are held. 3 authorised Procedures kept their old price: Daniel Poutama, $3,100.00; Ella Tawhiri, $3,100.00; Judith Calloway, $3,100.00." The card then reads 4 Nov 2026, Onwards, $3,300.00, +6.5%, 2 Procedures, In force, above 5 Oct 2026 to 3 Nov 2026, $3,100.00.
- **Handset:** no mobile side.

### Beat 3: The Xero pair

- **Click:**
  - **Demo: Billing Monitor & Xero → Invoices** (or the beat link). Open **AA-2026-0005** (payer nib).
  - Pause on **Ledger pair (the system of record)**, then the ACCREC and the ACCPAY, then the **Buyer-created tax invoice** block.
- **Say:** "Every invoice becomes a pair in Xero. The receivable, Xero's ACCREC, is what nib owes AA, and the payable, the ACCPAY, is what AA owes Dr Souter, the same amount, because AA passes on everything and invoices its own fee separately. That ACCPAY is the buyer-created tax invoice. Xero never sees a patient's name or NHI, only a hidden ID, and the name stays in AA's own ledger."
  - **Open:** one BCTI per invoice; the BCTI count is provisional (OQ-29, OQ-60).
- **Expected:**
  - The list shows each of Beats 1 and 2's invoices with its `-P` payable, payee Dr Melanie Souter, except AA-2026-0010, which reads No charge and has no payable. Alan Prentice's own invoice (AA-2026-0006) shows its payer as "Patient PT0011".
  - On the pair: "Awaiting payment", **Simulate payment and payout**. The ledger panel reads "Patient: Alan Prentice", Matches the ledger, Receivable AA-2026-0005, Payable AA-2026-0005-P, Booking ID BK0025, "Ledger: received $0.00 · released $0.00 · paid out $0.00", "Pair link: XR2572 ↔ XP2572".
  - ACCREC: INVOICENUMBER AA-2026-0005, REFERENCE BC2573, PAYER nib nz limited (nib's billing name), Total $152.38, BALANCE $152.38.
  - ACCPAY: AA-2026-0005-P, Draft, PAYEE Dr Melanie Souter, PAYABLE $152.38, AUTHORISED $0.00; PAID IN XERO "No bill payment yet. Xero's payables run pays the bill once its payment run is scheduled."
  - The buyer-created block carries Provisional (OQ-29): supplier Dr Melanie Souter, GST 104-348-211, agent Anaesthesia Associates Limited, GST 102-345-678, "FOR INVOICE AA-2026-0005".
- **Handset:** no mobile side.

### Beat 4: Payment, ledger and disbursement

- **Click:**
  - On the open AA-2026-0005 pair, **Demo actions → Payment received · full**, **Run**.
  - **View in Dr Souter's account**.
  - **Admin → Billing monitor**. Pause on the tiles and the **Payment cycle** panel. Pick **Dr Melanie Souter** in the **ANAESTHETIST** filter: her group opens with a row per List (**Collapse all** folds it). Then **Clear filters**.
  - **Anaesthetist Web App → Dashboard**, then **Accounts → Outstanding**.
- **Say:** "nib pays into AA's bank account in Xero, and Xero tells the Billing Engine by webhook. The engine authorises Dr Souter's payable for exactly what came in, and the money sits with AA, due to her, until the weekly run pays her in Xero. The monitor shows every List by anaesthetist: invoiced, sent, in Xero, paid in, paid out. Dr Souter sees the same figures on the web, read from the same ledger."
  - **Open:** the BCTI count is provisional (OQ-29, OQ-60).
- **Expected:**
  - The press reads "Webhook for AA-2026-0005: $152.38 received, the paired ACCPAY is authorised for exactly $152.38." The pair reads "Paid · not disbursed"; "Ledger: received $152.38 · released $152.38 · paid out $0.00"; ACCREC Paid, BALANCE $0.00; ACCPAY Authorised, READY TO DISBURSE $152.38; PAID IN XERO "No bill payment yet. Xero's payables run pays the bill once its payment run is scheduled."
  - Web **Payments**: AA-2026-0005, received $152.38, released $152.38, paid to you $0.00, "Customer paid".
  - Billing monitor:
    - Tiles for the whole practice: AWAITING APPROVAL 6, AUTHORISED 694, WITH PROBLEMS 0, PAYABLES DUE $660,575.05, "700 lists", Xero "Connected". The groups below are paged, "Anaesthetists 1 to 20 of 75".
    - The Payment cycle panel, "Payment cycle · Week 48 · 23 Nov to 29 Nov 2026", lists the practice under **Waiting for this week's run**, Dr Souter first: 1 BCTI, $152.38, paid to 99-0101-•••••21-00, then Dr Thompson 22 BCTIs $9,142.18 and the rest. **Run payables in Xero** reads "Nothing scheduled to pay".
    - Filtered to Dr Souter: tiles 0, 4, 0 and PAYABLES DUE $152.38, "4 lists". Her group reads "0 awaiting approval · 4 authorised · 0 with problems", one row per List with SENT, XERO, PAID IN, DISBURSED and RUN columns and sortable headings. Mon 16 Nov's row shows Ihaia Paewai's invoice as Paid.
  - Web dashboard **Financial position**: Owed to you $14,032.32, Collected $27,372.38, Paid out to you $27,220.00; "17 unpaid invoices · $13,879.94 awaiting collection · $152.38 due to you now".
  - **Accounts → Outstanding**: **Your position** reads Owed to you $14,032.32 (Awaiting collection $13,879.94, "Due to you now $152.38, which AA holds for you"), Collected $27,372.38, Paid out to you $27,220.00, You owe AA $580.75. One flat list, oldest first: AA-2026-0005 stays, its stage Paid in, due to you; "Total outstanding 17 invoices $14,032.32".
- **Handset:** on **Balances**, **Demo sheet → Payment received · full**, tap **AA-2026-0005 · Alan Prentice · $152.38 due**, then **Run**: Collected rises to $27,372.38, Paid out to you stays $27,220.00, and the AA-2026-0005 row reads "Paid in, due to you".

### Beat 5: The weekly payment run

- **Click:**
  - On **Billing monitor**, **Demo actions → Stage a payment week**, keep **19 BCTIs**, **Run**.
  - **Close the week**. Pause on Checks before payment.
  - **Approve week 48's BCTIs**, then **Send payment schedule**.
  - **Run payables in Xero** (badged SIMULATED XERO).
  - Under **Payment runs**, open Week 48's run (**PR0001**), then Dr Souter's **Remittance advice**.
  - **Demo: Billing Monitor & Xero → Invoices → AA-2026-0005**. Pause on **Paid in Xero**.
  - **Anaesthetist Web App → Accounts → Remittances**. Open Week 48.
- **Say:** "Anaesthetists are paid weekly, each run named by its ISO week. The week closes on Friday and is checked against the bank download, and Monday is for sorting out anything odd. The office approves the week's BCTIs, and on Tuesday the schedule goes to the accountant, who pays it in Xero. The Billing Engine never pays anyone: it raises the payables, tracks them, and records each payment when Xero reports it."
  - **Open:** the weekly cycle is AA's proposed one (OQ-47); the BCTI count is provisional (OQ-29, OQ-60).
- **Expected:**
  - The press reads "19 payables released for Dr Sharma into Week 48. Close the week to start the run." The panel lists Dr Souter 1 BCTI $152.38 and Dr Sharma 19 BCTIs $10,837.86 at the top, above the rest of the practice's released payables.
  - Close stamps "Closed Tue 24 Nov · planned Fri 27 Nov" and Monday checks "No anomalies": "The week reconciled to the bank download with nothing to sort out." Approval stamps "Approved Tue 24 Nov" and the schedule "Sent Tue 24 Nov · planned Tue 1 Dec". The run row reads Week 48, PR0001, $671,412.91, Closed, then Approved, then Scheduled.
  - **Run payables in Xero** pays the whole practice, and the page is busy for about half a minute. The result reads "Week 48 paid in Xero: 1617 BCTIs, $671,412.91 paid to 71 anaesthetists." Week 48 reads Paid, and the panel moves on to "Payment cycle · Week 49 · 30 Nov to 6 Dec 2026".
  - The run page, **Payment run · Week 48**: Closed, Approved, Schedule sent, Sent to Xero and Paid, each "Tue 24 Nov, 08:00"; Ledger at close: Receipts held $673,052.91, Payables due $671,412.91, Imbalance $0.00; "No anomalies: the week reconciled to the bank download."; "Kept out of every run: AA-2026-0001 · $1,380.00 · Held in the AA Holding account (never paid by a run)"; PAYMENT SCHEDULE · Week 48, "PR0001 · 23 Nov to 29 Nov 2026 · 1617 BCTIs", Total $671,412.91, "Sent to the accountant Tue 24 Nov, 08:00".
  - Dr Souter's advice: REMITTANCE ADVICE, RA-2026-W48-34821, "Week 48, 2026 · PR0001", paid on Tue 24 Nov to 99-0101-•••••21-00; "AA-2026-0005-P · AA-2026-0005 · Mon 23 Nov · nib $152.38"; "BCTIs paid (1 BCTI) $152.38", "Paid to you $152.38", Paid; "Batch payment XBP0001 · $152.38".
  - The pair reads Disbursed, "Payment and payout complete"; "Ledger: received $152.38 · released $152.38 · paid out $152.38"; **Paid in Xero** "DSB1617 · TUE 24 NOV · 08:00 · Paid in batch XBP0001 · Week 48 · $152.38" and "Billing Engine: disbursement recorded 08:00 by webhook."
  - Web:
    - **Remittances**: "Week 48 · Tue 24 Nov · 1 · $0.00 · $152.38 · Paid" above Week 47's $690.00. The row opens the same advice.
    - **Your position**: Owed to you $13,879.94, Collected $27,372.38, Paid out to you $27,372.38.
    - **Outstanding**: 16 invoices, $13,879.94, AA-2026-0005 gone.
    - **Payments**: AA-2026-0005 paid to you $152.38, "Week 48", Paid to you.
- **Worth pointing at:** every run leaves a remittance advice for each anaesthetist it pays (Dr Souter's RA-2026-W48-34821).
- **Handset:** on **Balances**, after Beat 4's press, **Demo sheet → Office runs this week's payment cycle**: "The office ran Week 48's payment cycle and the accountant paid it in Xero: $152.38 to Dr Souter, recorded from Xero's bill-paid webhook. Paid out rises by it; it leaves Outstanding and shows under GST this month." Paid out to you reads $27,372.38. The press is disabled with "Nothing due to pay out" when nothing is due.

#### Optional aside: an anomaly held out (instead of the plain close)

- **Click:**
  - After **Stage a payment week**, **Demo actions → Stage a bank mismatch**, **Run**.
  - **Close the week**, then **Hold out of this run** on the anomaly.
  - **Approve week 48's BCTIs**, **Send payment schedule**, **Run payables in Xero**.
- **Say:** "A receipt that isn't on the bank download stops the approval until someone decides. If it can't be sorted out by Monday, that one payment is held out and rolls into next week. Everyone else is still paid."
- **Expected:**
  - The press reads "The bank download is missing the receipt for AA-2026-PP19. Close the week to see the anomaly."
  - Checks before payment shows "Receipt not on the bank download · Dr Sharma · AA-2026-PP19-P · The receipt of $420.00 for AA-2026-PP19 is not on the bank download." with **Hold out of this run** and **Mark fixed**. **Approve week 48's BCTIs** is disabled with "Hold out or mark fixed every anomaly first."
  - After holding out: "1 anomaly sorted", Dr Sharma 18 BCTIs $10,417.86, and Rolls into Week 49 lists AA-2026-PP19-P $420.00 (with **Return to run**).
  - The run reads "Week 48 paid in Xero: 1616 BCTIs, $670,992.91 paid to 71 anaesthetists."; Week 49's panel lists Dr Sharma "Rolled from Week 48", 1 BCTI, $420.00.
  - Read Beat 6 and 7's figures from the app on this path.
- **Handset:** no mobile side.

#### Optional aside: the cash-basis GST report

- **Click:**
  - **Anaesthetist Web App → Accounts → GST report**, November 2026.
  - Optional: **Download**, **Print**, **Email to me**.
- **Say:** "GST here is on a cash basis: what AA paid you in the month, with the GST from the invoice itself. A payment counts in the month AA pays it to you."
- **Expected:** "November 2026 · GST on a cash basis: each payment AA passed to you in the month, with its GST component. An invoice paid in part appears in each month it is paid." Rows 12 Nov AA-2026-H10 Southern Cross $1,150.00 / $150.00, 18 Nov AA-2026-H09 St George's $690.00 / $90.00, 24 Nov AA-2026-0005 nib $152.38 / $19.88 / $132.50; "Month total 3 payments $1,992.38 $259.88 $1,732.50". "AA's fee invoices to you are not income and are not on this report: see AA fees." Beat 4's payment alone adds no row.
- **Handset:** self-contained. **Balances → GST this month** reads "November 2026 · paid to you $1,992.38", the 24 Nov nib row $152.38 with GST $19.88, "GST total $259.88".

### Beat 6: AA's monthly fee run

- **Click:**
  - **Billing monitor → Open AA fee invoices → Fee settings**. Pause on the fixed items, the charge per BCTI and the worked example.
  - **Fee invoices** (November 2026 in the month picker).
  - **Demo actions → Seed a month of BCTIs**, **Run**.
  - **Run monthly fee invoices**.
  - Expand Dr Rutherford's November invoice (**AA-FEE-2026-0003**) with the chevron at the end of its row (the invoice number does not open it), then Dr Souter's (**AA-FEE-2026-0005**).
  - **Anaesthetist Web App → Accounts → AA fees**.
- **Say:** "AA invoices each anaesthetist for its fee once a month: fixed charges, plus a charge for each BCTI paid that month. It's always a separate invoice, paid into AA's own account, and never taken out of a payment to the anaesthetist. Only paid BCTIs count, so a Booking moved between anaesthetists is never charged twice."
  - **Open:** what the per-BCTI charge counts is provisional (OQ-29, OQ-60); the fixed schedule is a sample.
- **Expected:**
  - **Fee settings**: Sample schedule, "Practice management" $350.00, "Office and reception" $150.00, charge per BCTI 5.00, "With 40 BCTIs: $500.00 + $5.00 x 40 = $700.00, plus GST at the foot of the invoice.", **Save settings**.
  - **Fee invoices**: "The real run is made at month end; in the demo, running the current month invoices it to date." Before the seed: a row for each of the practice's 83 anaesthetists at $500.00 fixed plus their BCTIs paid this month (Beat 5's run paid most of them); Dr Souter 3 BCTIs, $515.00; Dr Sharma 19 BCTIs, $595.00; Dr Rutherford 0, $500.00; "Still to invoice for November 2026 (ex GST) $49,585.00". The note "Counts one BCTI per receivable invoice, once, against the anaesthetist who did the procedure, in the month its invoice is paid in full. Provisional: being confirmed with AA's accountant (OQ-29, OQ-60)." AA-FEE-2026-H02 Dr Souter, October 2026, $580.75, Unpaid; AA-FEE-2026-H01 September 2026, $586.50, "Paid 9 Oct 2026".
  - The seed reads "Added 40 paid BCTIs: Dr Rutherford now has 40 paid in November 2026. At the current settings his fee is $700.00 before GST. Run monthly fee invoices to raise it." His row: 40, $500.00, $200.00, $700.00; still to invoice $49,785.00.
  - The run reads "Raised 83 fee invoices for November 2026, $57,252.75 incl GST." (AA-FEE-2026-0001 to 0083).
  - Dr Rutherford: Practice management $350.00, Office and reception $150.00, "BCTIs paid in November 2026: 40 x $5.00" $200.00, GST $105.00, Total $805.00; COUNTED BCTIS (40), AA-2026-RB01-P to RB40-P.
  - Dr Souter: "BCTIs paid in November 2026: 3 x $5.00" $15.00, GST $77.25, Total $592.25; counted AA-2026-H10-P, AA-2026-H09-P and AA-2026-0005-P (Beat 5 paid it). Priya Nair's prepayment (AA-2026-0001) is not counted.
  - Web **AA fees**: AA-FEE-2026-0005 November 2026, 3 BCTIs, $500.00, $15.00, $515.00, $77.25, $592.25, Unpaid. October's AA-FEE-2026-H02 is still unpaid, so Unpaid AA fees and You owe AA read $1,173.00, and $592.25 once October is paid (next aside).
- **Handset:** the office runs this; the phone only reads the result, on **Balances** ("You owe AA"). No PWA stand-in by design.

#### Optional aside: record fee payment on the AA fee pair

- **Click:**
  - **Demo: Billing Monitor & Xero → Invoices → AA-FEE-2026-H02**.
  - **Record fee payment**, then **View in Dr Souter's account**.
- **Say:** "The fee pair has no payable. Dr Souter pays it into AA's own account, never the account client money passes through."
- **Expected:**
  - "SIMULATED XERO AA FEE INVOICE", "AA's fee for October 2026", Awaiting payment; ACCREC · AA FEE from Dr Melanie Souter to "Anaesthesia Associates (AA's own account)"; lines $350.00, $150.00, "BCTIs paid in October 2026: 1 x $5.00" $5.00, Subtotal $505.00, GST $75.75, Total $580.75; NO ACCPAY, "No payable".
  - After the press: Paid, "Fee paid", "AA-FEE-2026-H02 paid: $580.75 received into AA's own account."
  - Web **AA fees** (`/web/accounts/fees?invoice=AA-FEE-2026-H02`): H02 "Paid 24 Nov 2026", "Unpaid AA fees (incl GST) $592.25", You owe AA $592.25. Payments, the GST report and Outstanding do not change.
- **Handset:** the office runs this; the phone only reads the result, on **Balances** ("You owe AA"). No PWA stand-in by design.

### Beat 7: The ledger balances

- **Click:**
  - **Admin → Ledger** (Whole ledger). Pause on the status line, the equation and the tiles.
  - **One anaesthetist → Dr Souter**.
  - Back on **Whole ledger**, **Demo actions → Inject unmatched receipt**, keep **Names Dr Souter**, **Run**.
  - **Admin → Day view**: the **Books square** tile at the top of the right rail. Press it for the detail.
  - **Ledger**, then **Allocate to invoice** on the receipt and pick **AA-2026-0002 · Forte Health · Dr Souter**.
- **Say:** "Every invoice is a pair in AA's own ledger: a receivable from whoever pays and a payable to the anaesthetist. Money in and money out land here first, and every dollar AA holds is owed to someone, so receipts held equal payables due. A receipt nobody can match shows up as an imbalance with a name on it, and once the office allocates it, the books square again."
  - **Open:** Disbursed includes BCTI-based payouts; the BCTI count is provisional (OQ-29, OQ-60).
- **Expected:**
  - After Beats 1 to 6: "In balance · receipts held equal payables due", "Receipts held $1,640.00 less payables due $0.00, the AA Holding account $1,380.00 and credits held for payers $260.00, plus negative invoices to net $0.00 = $0.00". Tiles: Receivables outstanding $412,295.77, Receipts held $1,640.00, Payables due $0.00, Disbursed $724,455.66; AA Holding account $1,380.00, AA fees outstanding $57,833.50 ($57,252.75 after the record fee payment aside), Not yet in Xero 1, Credits held for payers $260.00, Negative invoices to net $0.00; "Every anaesthetist's ledger is in balance."
  - Dr Souter's scope: "Dr Souter's ledger is in balance", "Collected $27,372.38 and held receipts $0.00 less paid out $27,372.38 and due now $0.00 = $0.00"; AA owes Dr Souter: Due now $0.00, Awaiting collection $13,879.94, Total $13,879.94; Dr Souter owes AA: Unpaid AA fees $1,173.00 ($592.25 after the aside); Collected for them and Paid out to them $27,372.38; **Payment runs** with Week 48 PR0001 $152.38 and an **Open** per remittance advice.
  - The press reads "A $120.00 deposit naming Dr Souter matched no invoice. The ledger is out of balance by $120.00 and Dr Souter is on the out-of-balance list." The status turns Out of balance by $120.00 ("... = $120.00", Receipts held $1,760.00) with "Receipt with no matching invoice: Bank deposit · SOUTER JULY, $120.00"; the nav's Ledger badge reads 1; **Anaesthetists out of balance** lists Dr Souter, $120.00, "Receipt with no matching invoice, $120.00", **Open**; the receipt row reads "TUE 24 NOV · 08:00 · Bank deposit · SOUTER JULY · Dr Souter · $120.00 · Held".
  - The rail's tile turns from "Books square · All checks agree" to "Out of balance · 1 item to resolve"; its detail reads Ledger "off by $120.00", Unmatched receipt "Bank deposit · SOUTER JULY" $120.00, "Ledger · unmatched receipts", 0 days.
  - **Allocate to invoice**: "$120.00 received TUE 24 NOV · 08:00, reference Bank deposit · SOUTER JULY. Choose the invoice it pays; only invoices whose balance covers it are listed." Dr Souter's invoices come first, marked "Named".
  - After picking AA-2026-0002: back In balance, Payables due $120.00 ("Paid in this week's payment run on the Billing monitor"), Receivables outstanding $412,175.77, the receipt "Allocated to AA-2026-0002", the list "Every anaesthetist's ledger is in balance."; Dr Souter's Due now $120.00, Collected $27,492.38. The rail's tile reads "Books square · All checks agree" again, its detail "The ledger, its Xero mirror and Xero's bank lines all agree."
  - From a fresh reset the tiles read $409,766.33, $662,062.67, $660,422.67 and $27,760.00: the practice's released payables wait for Beat 5's run. Skip a beat and the figures move: read them from the app.
- **Worth pointing at:** run the press again with **Names no one**: the whole ledger is out by $120.00 and the out-of-balance list stays empty; **Mark refunded** with a note returns it to balance, the row reading "Refunded: <note>". Each invoice's **Ledger** card has **Open in the ledger**, and the Billing monitor's payment cycle panel has **Open the ledger**.
- **Handset:** no mobile side.

### Discovery points

- OQ-29 · GST agency treatment of the receivable and payable invoices: the agent wording on every invoice and BCTI, and one BCTI per receivable invoice (Beats 1, 3, 5), built as proposed and labelled Provisional (OQ-29).
- OQ-60 · What the AA per-invoice fee counts, and how the fee is paid: the fee run counts one paid BCTI per receivable invoice, in the month it is paid in full, against a sample fixed schedule (Beat 6).
- OQ-112 · Monthly AA fee invoice: month end or the 20th?: the demo raises it at month end (Beat 6).
- OQ-47 · Does the accountant agree to the weekly payment cycle?: the proposed cycle, Friday close, Monday checks, Tuesday schedule, paid in Xero (Beat 5).
- OQ-114 · How each Party's invoices are delivered: email or post only; nib's invoice is emailed while how nib's portal takes claims is open (Beat 1).
- OQ-132 · Base units on a mixed Booking whose primary has a fixed price: no base units bill on the fixed-price primary (the 3-procedure aside).

---

## S4 · Exceptions

**Serves:** the hard cases. Prepayment from invoice to transfer, a cancelled prepayment, events after the procedure, a billing failure, and a credit and rebill netted in the weekly run. **Time:** 12 to 14 minutes.

**Stage it:** Reset → Confirm reset, or Control Panel **S4 · Exceptions → Jump → Confirm jump**. The jump resets to the pristine seed and stages nothing. It shows eight beat links:

- Beat 1 · Admin Booking, Annette Riley
- Beat 2 · Admin Review, after Fri 27 Nov PM is submitted (it waits until Dr Souter submits)
- Beat 3 · Admin Booking, Annette Riley
- Beat 4 · Admin Review, Tue 17 Nov AM
- Beat 5 · Admin Booking, after Stage post-op scenario
- Beat 6 · Billing monitor
- Beat 7 · Admin invoice, after Stage post-op scenario
- Beat 8 · Admin Day

Beat 2 authorises Priya Nair's List, so Beat 3 cancels Annette Riley's Booking. Run the beats in order. The figures below were read from the app in that order with every aside skipped. An aside takes the next free invoice numbers, and each aside says what it moves. Beat 8 moves the clock, so it comes last.

### Beat 1: Prepayment from a prepaid Contract

- **Click:**
  - **Admin Day view**, Tue 24 Nov. Point at the **Pre-payments** tile at the top of the rail ("2 pre-payments · 1 to approve"): select it to open its list. Then the work card's **To-do** tab.
  - On the **To-do** tab press **Show all (11)**, then **Open** on Annette Riley's row. Her Booking is on Dr Souter's Fri 27 Nov AM List at Forte Health.
  - **Invoices**: the **Awaiting approval** tab ("1 to approve") and its **Prepayment approval** switch. On Riley's row select **Approve and send**, then **Preview letter**, then **Approve and send** in the dialog.
  - Back on Riley's Booking, **Demo actions → Payment received · half**, **Run**.
  - **Billing monitor**: the **AA Holding account** card.
  - **Anaesthetist Mobile App** as Dr Souter: **Lists → Fri 27 Nov AM** (Forte Health, Ms G. Lim) → Annette Riley. Then **Mark complete**, back to the List, **Mark list completed**, **Submit to office**.
- **Say:** "The office put this rhinoplasty on Dr Souter's own prepaid Contract, so Annette Riley pays Dr Souter's fixed price, the prepaid amount, in full before the procedure. Once an admin approves the invoice it goes out with a letter, and the money waits in the AA Holding account until the office authorises her List. On her phone Dr Souter sees the amount, which she can't change, and a warning that climbs as the day gets closer. She can still complete and submit."
- **Expected:**
  - Pre-payments tile: "2 pre-payments", "1 to approve"; opened, it lists Annette Riley $1,200.00, "Dr Souter · Fri 27 Nov · In 3 days", Awaiting approval, and Priya Nair $1,200.00, "Dr Souter · Fri 27 Nov · In 3 days", Paid. The To-do tab reads 11 (most of them the practice's Bookings still without a Contract); Riley's row, tenth, reads "Prepayment of $1,200.00 from Annette Riley is awaiting approval on Invoices and has not been sent."
  - Riley's Booking: **Pre-payment awaiting approval**, "Prepaid amount $1,200.00 plus GST", **Approve on Invoices**, Contract Rhinoplasty SOUTER-001, **Paid by** Annette Riley. There is no amount field and no raise button. Booking total "ex GST · GST $180.00".
  - Invoices: one row, Annette Riley, Dr Souter, FRI 27 NOV, $1,200.00; "Prepayment approval · On · each prepayment invoice waits here for approval". The dialog names the **Standard prepayment letter** and annette.riley17@example.net. The letter reads "Dear Annette Riley, thank you for booking your Rhinoplasty with Dr Melanie Souter on Friday 27 November 2026. The anaesthetic fee is $1,380.00, payable before your procedure. ... If your procedure turns out very different from what was planned, your anaesthetist may send a further invoice or a credit." Toast: "Invoice AA-2026-0002 emailed to Annette Riley, with its payable to the AA Holding account."
  - Half payment: "Webhook for AA-2026-0002: $690.00 received, the paired ACCPAY is authorised for exactly $690.00." The panel reads "Pre-payment part paid · $690.00 of $1,380.00 received" and "Held by AA until the List is authorised". The warning reads "Prepayment part paid by Annette Riley, $690.00 of $1,380.00 received. Check with the payer before surgery starts." (Mild).
  - AA Holding account card (below the payment runs): $2,070.00, "Held for 2 prepaid Bookings. Leaves only by a system transfer or refund.", Riley's $690.00 Received beside Nair's $1,380.00 (with two of the practice's prepayments, already transferred to Dr Campbell and Dr Thompson), and the pill "Moves to the anaesthetist when the List is authorised · to confirm with AA (OQ-125)". The **Payment cycle** panel ("Week 48 · 23 Nov to 29 Nov 2026") already lists the rest of the practice's payables waiting for this week's run; Dr Souter is not among them yet.
  - Ledger (`/admin/ledger`): AA HOLDING ACCOUNT $2,070.00, PAYABLES DUE $660,422.67 (the whole practice), "In balance · receipts held equal payables due".
  - Mobile: the triangle, the same part-paid warning on opening, "Pre-payment part paid · $690.00 of $1,380.00 received", "Held by AA until the List is authorised", "The AA office sends the prepayment letter.", Price "Prepaid $1,200.00 · Set by the office", and "Prepaid $1,200.00 · part paid · held by AA until the List is authorised" in the units block. Submit goes through: the List reads **Submitted to office**.
- **Worth pointing at:** the office keeps Dr Souter's price list, so the phone shows the price as "Set by the office". The invoice goes to whoever pays for this Procedure, here Annette herself on the **Paid by** line, and each payer gets their own prepayment invoice (the two-payer aside). AA can switch the approval step off with the **Prepayment approval** switch on the **Awaiting approval** tab of **Invoices**. The letter names Dr Souter. Whether a prepayment invoice names the anaesthetist is still open (OQ-120). In **Contracts**, search SOUTER-001 and open Rhinoplasty: its **Who it bills** card reads "A prepaid Contract always bills the payer, awaiting AA's confirmation." (OQ-73).
- **Handset:** on Riley's Booking, **Demo sheet → Office approves and sends the prepayment invoice** ("The office approved and sent prepayment invoice AA-2026-0002 for $1,380.00 including GST."), then **Demo sheet → Payment received · half**, choose AA-2026-0002 · Annette Riley, **Run**. Then Mark complete, Mark list completed, Submit to office.

#### Optional aside: the letter and the reminder

- **Click:**
  - **Master data → Prepayment letters** (`/admin/masters?view=prepaymentLetters`).
  - On Riley's Booking, **Send prepayment reminder**, then **Send reminder**.
- **Say:** "Three letters, one default of each kind. A reminder goes while the invoice is unpaid or part paid, and it asks for what's left."
- **Expected:** Standard prepayment letter, Prepayment reminder and Anaesthetist changed, each a default. The dialog reads "Invoice AA-2026-0002 · $690.00 still to pay", letter Prepayment reminder; the panel then reads "Reminder sent 24 Nov 08:00 to annette.riley17@example.net".
- **Handset:** **Demo sheet → Office sends a prepayment reminder** on Riley's Booking.

#### Optional aside: one prepayment invoice per payer

- **Click:**
  - **Admin Day view**, **Demo actions → Add prepaid Booking**, choose **Two payers**, **Run**.
  - **Invoices**: the **Awaiting approval** tab.
- **Say:** "Fiona Gray pays for her rhinoplasty. Her partner pays for the eyelids. Two payers, so two prepayment invoices, each approved and locked on its own."
- **Expected:** after Beat 1's submit, "Added Fiona Gray on Dr Souter's Mon 30 Nov PM List: 2 payers await approval on Invoices (Fiona Gray $1,200.00, Ian Gray $900.00)." Two rows: Fiona Gray invoiced to Fiona Gray, $1,200.00, and Fiona Gray invoiced to Ian Gray, "Procedure 2 · Blepharoplasty, upper lids", $900.00.
- **Handset:** no mobile side.

#### Optional aside: a balance warning beside the prepayment warning

- **Click:** **Admin Day view**, **Demo actions → Raise sample warnings**, **Run**. Read the **To-do** tab (**Show all**).
- **Say:** "A patient who already owes AA gets a second warning. The two sit side by side, so neither hides the other."
- **Expected:** two rows for Mere Walsh (Dr Rutherford, Tue 24 Nov AM), side by side: "Mere Walsh owes $290.00 on 1 invoice, unpaid 246 days (over the 90 day threshold). Follow up before the procedure." and "Prepayment of $500.00 from Mere Walsh is awaiting approval on Invoices and has not been sent." The To-do tab reads 19. The samples sit on other Bookings and change no invoice number; Beat 8's Pre-payments tile then lists their prepayments too.
- **Handset:** no mobile side.

### Beat 2: The prepaid Procedure billed

- **Click:**
  - **Anaesthetist Mobile App**: **Lists → Fri 27 Nov PM** (Forte Health, Mr V. Nand) → Priya Nair. On the septoplasty, **Modifiers** reads Required: select **None apply**, then **Mark complete**. Back on the List, **Mark list completed**, **Submit to office**.
  - **Review queue → Dr Melanie Souter · Forte Health PM**. **Demo actions → Stage longer prepaid procedure**, choose Priya Nair, **Run**.
  - **Authorise for billing**, then confirm.
  - Open Nair's Booking: the **Prepaid settlement** block under the rhinoplasty.
  - **Billing monitor**: the **AA Holding account** card. Then **Demo: Billing Monitor & Xero → Invoices → AA-2026-0001**.
- **Say:** "Priya Nair paid in full last week for her rhinoplasty, and her septoplasty is on Forte's Contract. When the office authorises the List, the system moves her prepaid amount out of the AA Holding account to whoever did the List, as a transfer, with no invoice and no GST. The prepaid amount is the price, so the rhinoplasty stays off the final invoice even though it ran four hours. If Dr Souter wants more she creates an additional invoice by hand, and to give some back she raises a credit note for the whole invoice."
  - **Open:** releasing the prepayment at authorisation is still to be confirmed with AA (OQ-125); the holding card's pill says so.
- **Expected:**
  - Mobile: "Prepaid $1,200.00 · paid · held by AA until the List is authorised" on Nair's rhinoplasty; the List reads **Submitted to office**.
  - Stage longer prepaid procedure: "Recorded BTM now 25 units, for reference only. Authorise bills nothing more for the prepaid procedure; create an additional invoice by hand if one is needed." The review row shows "Rhinoplasty · Prepaid amount $1,200.00 · paid", "Prepaid, left off", TOTAL UNITS 33, TOTAL FEE $1,412.00.
  - Authorise: "1 invoice raised. 1 emailed, 0 to post." On **Invoices**, AA-2026-0003 to Forte Health, $243.80, the septoplasty alone.
  - Prepaid settlement: "Prepaid $1,200.00 · the price for this procedure", AA-2026-0001, "Recorded BTM 25 units · for reference only", "Moved from the AA Holding account to Dr Souter on 24 Nov", "Nothing is invoiced or credited automatically.", with the second **Create additional invoice** and **Credit note** buttons on the page.
  - AA Holding account card: a **Transferred** row, Priya Nair, AA-2026-0001, Dr Melanie Souter, -$1,380.00; balance $690.00, "Held for 1 prepaid Booking."
  - Xero simulation: **MANUAL JOURNAL MJ-0003** (reference AA-2026-0001, transfer PXT0003), "Transfer, not a payment", debit AA Holding account $1,380.00, credit Dr Melanie Souter $1,380.00, "How this posts in Xero is still to be confirmed."
- **Worth pointing at:** the transfer goes to whoever did the List, so if the Booking had moved to a colleague, the colleague would get it. Nothing is deducted from the final invoice, and nothing is raised for the extra time. The 25 units are recorded for reference only.
- **Handset:** on Nair's List after submitting, **Demo sheet → Office authorises this List** ("Done. The office authorised this List and the billing run raised its invoices. They are in Balances now, and search finds the List."). Her Booking reads "Moved from the AA Holding account to you on 24 Nov" with **Create additional invoice** and **Credit note**.

#### Optional aside: crediting a prepayment by hand

- **Click:** on Nair's Admin Booking, the **Credit note** inside **Prepaid settlement** (the second one on the page). Read the sheet, then close it without saving.
- **Say:** "A credit on a prepayment covers the whole invoice. Anything still owed goes on a new additional invoice."
- **Expected:** "Credit note · Priya Nair · Rhinoplasty, cosmetic component, self f…", "Credits AA-2026-0001 in full. Nothing on it is edited.", TOTAL $1,380.00, "Paid $1,380.00: $1,380.00 will be held for Priya Nair.", "Dr Souter's payment is reversed: a negative invoice for $1,380.00, offset against the unpaid payable." and "This credits the whole prepayment invoice. Create an additional invoice for anything still owed." Closed unsaved, nothing changes.
- **Handset:** the **Credit note** on Nair's Booking opens Dr Souter's own version of the sheet, with TOTAL EX GST $1,200.00.

### Beat 3: Cancelling a prepaid Booking

- **Click:**
  - Annette Riley's Admin Booking (the Beat 3 link). **Cancel booking**, type a reason ("Patient cancelled"), **Cancel booking**.
  - **Billing monitor**: the **AA Holding account** card. Optionally **Invoices → CN-2026-0001**.
  - Back on Riley's Booking, **Rebook with another anaesthetist**. Choose **Dr Sarah Beaumont**, then **Tue 8 Dec · PM** (Forte Health · Mr V. Nand), then **Rebook**.
- **Say:** "Annette cancels after paying half. The system settles it on the spot. It credits the prepayment invoice and refunds what she paid from the AA Holding account. If she hadn't paid anything, it would only credit the invoice, so nobody chases her. The same happens if the office moves the procedure onto a Contract that isn't prepaid after the invoice went out. Then she rebooks with Dr Beaumont. That's a fresh prepayment at Dr Beaumont's own price, so Annette may see two amounts."
- **Expected:**
  - The cancel sheet reads "Prepayment received · $690.00 on AA-2026-0002. Cancelling refunds it in full to the payer from the AA Holding account and credits the invoice." **Cancel booking** stays off until a reason is typed.
  - The Booking reads "Booking cancelled. Patient cancelled", **Pre-payment refunded**, "Credited · CN-2026-0001", "Refunded to the payer from the AA Holding account · $690.00 on 24 Nov".
  - AA Holding account card: $0.00, with a Credited row (CN-2026-0001, Cancelled, -$690.00) and a Refunded row ($690.00).
  - CN-2026-0001: "Credits AA-2026-0002 in full", reason "Booking cancelled: prepayment settled", "Raised automatically", "Credit: Rhinoplasty" $1,200.00, GST $180.00, Total credited $1,380.00, "Emailed to annette.riley17@example.net".
  - Rebook: the dialog reads "New prepayment at Dr Beaumont's own price: $1,350.00 ex GST". **Rebook** opens the new Booking (Tue 8 Dec, Forte Health): **Pre-payment awaiting approval**, "Prepaid amount $1,350.00 plus GST", Contract BEAU-001, with "Earlier prepayment · Dr Souter · $1,200.00 ex GST · refunded" and "This prepayment · Dr Beaumont · $1,350.00 ex GST".
- **Handset:** Dr Souter cancels on the phone: Riley's Booking → **Cancel booking**, a reason, **Cancel booking**. The phone reads "Pre-payment refunded", "Refunded to the payer from the AA Holding account · $690.00 on 24 Nov". The rebook is the office's, on Admin only.

#### Optional aside: a Contract changed off prepaid after sending

Run it from a fresh Reset (or the S4 jump), so the main order's figures stay as quoted.

- **Click:** open Priya Nair's Admin Booking (Fri 27 Nov PM: on the **Admin Day view**, select the rail's **Pre-payments** tile, then her row), then **Demo actions → Change Contract after prepayment sent**, **Run**. Then **Billing monitor**, the **AA Holding account** card.
- **Say:** "Nair has paid her prepayment. Now the office moves her rhinoplasty onto a Contract that isn't prepaid. The system settles it as it would a cancellation. It credits the whole prepayment invoice and refunds what she paid. Her procedure then bills under the new Contract."
- **Expected:** "The office moved the procedure to nib · Fixed price. Prepayment invoice credited as CN-2026-0001, and anything paid refunded from the AA Holding account." The panel reads **Pre-payment refunded**, "Credited · CN-2026-0001 · Contract changed off prepaid", "Refunded to the payer from the AA Holding account · $1,380.00 on 24 Nov". The AA Holding account card reads $0.00, with a Credited row (CN-2026-0001, Contract changed, -$1,380.00) and a Refunded row (CN-2026-0001, Contract changed, $1,380.00) above Nair's $1,380.00 Received.
- **Handset:** no mobile side.

#### Optional aside: a payment that arrives after the credit note

Run it from a fresh Reset (or the S4 jump), so the main order's figures stay as quoted.

- **Click:** on **Invoices → Awaiting approval**, **Approve and send** Riley's prepayment, then **Approve and send** in the dialog, and record no payment. Open her Booking, **Cancel booking**, type a reason, **Cancel booking**. Then, on her Booking, **Demo actions → Payment arrives after the credit note**, **Run**, and the **AA Holding account** card on the **Billing monitor**.
- **Say:** "Annette cancels before paying, so the system credits her invoice and nobody chases her. Then her bank payment comes in anyway. The system refunds it straight away from the AA Holding account."
- **Expected:**
  - The cancel sheet reads "Prepayment invoice AA-2026-0002 is unpaid. Cancelling credits it in full, so the patient is not chased." The panel reads **Pre-payment credited**, "Credited · CN-2026-0001". The card stays at $1,380.00 (Nair's) with a Credited row reading $0.00.
  - The late payment reads "Late payment of $1,380.00 refunded to the payer." The panel then reads **Pre-payment refunded** and "Late payment of $1,380.00 refunded on 24 Nov". The card stays at $1,380.00, with Riley's rows Received $1,380.00, Credited (Cancelled) -$1,380.00 and Refunded (Late payment) $1,380.00.
- **Handset:** no mobile side.

### Beat 4: Events on a Procedure, on no List

- **Click:**
  - **Admin Day view**, Tue 17 Nov: Dr Sharma's AM List at Christchurch Public, then **Open** on Sarah Mitchell. The Beat 4 link opens the List's Review page instead. **Demo actions → Stage post-op scenario**, **Run**.
  - **Anaesthetist Mobile App**: search **Bennett**, open Coral Bennett's **Wed 18 Nov PM** Booking. **Add pre-op or post-op event → Post-op → Post-op ward review**, date Thu 19 Nov, start 08:00, **Record a time**, tap the minutes and type 45, **Add event**.
  - Coral Bennett's Admin Booking (`/admin/day/2026-11-18`, Dr Souter's PM List): **Add billing event → Charge**, "What is this for?" Nerve catheter, $180, Thu 19 Nov, **Add event**.
  - **Review queue → Events**. On the Bennett ward review and the Nerve catheter rows, **Review → Approve for billing**. Leave David Chen's row for Beat 5.
  - **Billing monitor**, **Demo actions → Run the next billing run**, **Run**.
- **Say:** "Dr Sharma's Tuesday List is an ordinary private List, already authorised and billed. Events sit on the Procedure, on no List. Dr Souter records a ward review the day after Coral Bennett's knee, from her phone, with its own date and time. The office adds a charge for a nerve catheter. Both go through the same review step and bill in the next run. Bennett's List isn't authorised yet, and they don't wait for the procedure's invoice. When an event can join an invoice to the same party in that run, it does. Otherwise it gets its own."
- **Expected:**
  - Stage: "Staged. Search Bennett, open Wednesday's Booking and use Add pre-op or post-op event. Sarah Mitchell's Tue 17 Nov List is authorised and billed for Create additional invoice." The List's Review page (the Beat 4 link) reads **Private** and "1 invoice raised. 1 emailed, 0 to post." (Sarah Mitchell, AA-2026-0004, $238.05).
  - Bennett on the phone: Contract "ACC elective services via St George's", "12 units x $25.00 = $300.00". The sheet reads "Billed to the same party as the procedure (St George's)" and "Reviewed by the office, then billed in the next run." The event shows "Post-op ward review · 45 min · Awaiting review · Raised by you · St George's".
  - The office sheet reads "The same party as the procedure unless you change it." Events tab: "Post-op ward review · 45 min · 3 time units x $25.00 Contract rate = $75.00"; each approval reads "Approved · invoiced in the next billing run".
  - Billing monitor: **Waiting for the next billing run** 2 waiting, then "Billing run done: 2 additional invoices raised (AA-2026-0005, AA-2026-0006)." AA-2026-0005: "Post-op event · Post-op ward review · 19 Nov 2026 · 45 min" $75.00, total $86.25. AA-2026-0006: "Billing event · Nerve catheter · 19 Nov 2026" $180.00, total $207.00. Both to St George's; the phone shows both events **Invoiced**.
- **Handset:** **Demo sheet → Stage post-op scenario** on Lists, add the ward review as above, then **Demo sheet → Office reviews this event** on Bennett's Booking ("Reviewed by the office (simulated). Invoice AA-2026-0005 raised in the next run."). The office's billing event is Admin only.

### Beat 5: An additional invoice to any party

- **Click:**
  - Sarah Mitchell's Admin Booking (the Beat 5 link, `/admin/day/2026-11-17/bookings/BK0032`). On the **Paid by** row, **Create additional invoice**. Line "Post-op ward review, Wed 18 Nov, 15 min", quantity 1, amount $30. Keep **Same as the original invoice (Christchurch Public)** ticked. **Save for review**.
  - Dr Souter's own: on web or the phone, search **Chen**, open David Chen's **Mon 26 Oct** Booking. Events shows her additional invoice waiting for review, created from **Create additional invoice** on the Contract row.
  - **Review queue → Events**: **Approve for billing** on both rows.
  - **Billing monitor**, **Demo actions → Run the next billing run**, **Run**.
- **Say:** "A ward review the day after surgery doesn't reopen the Booking. The office creates an additional invoice with free-form lines, to whoever should pay. The anaesthetist can do the same on her own Procedure. Both go through the same review and bill in the next run, each with its own number and its own Xero pair, linked to the original."
- **Expected:**
  - The dialog reads "Additional invoice · Sarah Mitchell · Appendicectomy, laparoscopic" and "Additional to AA-2026-0004"; subtotal $30.00, GST $4.50, total $34.50. The Booking's events show it Awaiting review, "Raised by the office · Christchurch Public".
  - David Chen: "Additional invoice · Tue 27 Oct · $85.00 ex GST · Post-op ward review, Tue 27 Oct, 20 min · Raised by you · St George's · Awaiting review".
  - "Billing run done: 2 additional invoices raised (AA-2026-0007, AA-2026-0008)." On **Invoices**, AA-2026-0007 David Chen, "Additional to AA-2026-H03", $97.75; AA-2026-0008 Sarah Mitchell, "Additional to AA-2026-0004", $34.50. AA-2026-0004 stays locked and unchanged.
- **Handset:** search Chen, open David Chen's Mon 26 Oct Booking, **Demo sheet → Office reviews this event** ("Reviewed by the office (simulated). Invoice AA-2026-0006 raised in the next run." on a handset-only run; the number is the next free one).

### Beat 6: Billing failure and retry

- **Click:**
  - **Billing monitor**, **Demo actions → Trigger billing failure**, **Run**.
  - Pause on the intro and the tiles. Turn on **Problems only**.
  - In **Xero sync queue**, **Retry now** on the hand-off row.
- **Say:** "The hand-off to Xero fails for one Booking on Dr Ropata's List. Each Booking bills from what was locked at authorise, so the rest of the List bills and only hers waits. Every call to Xero goes through a queue that retries by itself, and the office can retry it now as well. Nothing on the Contract changes. Where an insurer is named, the Booking asks for the approval number and nothing else."
- **Expected:**
  - "Done. In the billing monitor Losa Tuilagi's invoice waits for Xero in the sync queue while Hemi Walker's billed. Use Retry now on its queue row, or move the clock on." The Xero line reads "Connected · 1 waiting for their next try"; the tiles read AWAITING APPROVAL 10, AUTHORISED 694 (the whole practice), WITH PROBLEMS 1, PAYABLES DUE $661,802.67 (the practice's week, Beat 2's transfer included).
  - **Problems only**: "1 list". The queue row reads "Hand off AA-2026-0009", 1 attempt, next try 08:02, "Xero rejected the call (simulated fault)", Waiting.
  - **Retry now**: "Hand off AA-2026-0009: sent to Xero.", **Sent after waiting (1)**, "Nothing is waiting for Xero.", and the filter reads "0 lists".
  - **Invoices**: AA-2026-0009 Losa Tuilagi, Canterbury Orthopaedic Surgeons, $303.60; AA-2026-0010 Hemi Walker, St George's, $221.38. No duplicate invoice.
- **Handset:** no mobile side.

#### Optional aside: a part payment releases what was received

- **Click:** **Invoices → AA-2026-0010** (Hemi Walker), **Demo actions → Payment received · half**, **Run**. Then **Billing monitor**, the **Payment cycle** panel.
- **Say:** "St George's pays half. Dr Ropata's payable is released for exactly that half, and it waits for this week's run."
- **Expected:** "Webhook for AA-2026-0010: $110.69 received, the paired ACCPAY is authorised for exactly $110.69." **Waiting for this week's run** adds Dr Ropata, 1 BCTI, $110.69 (the BCTI count is provisional: OQ-29, OQ-60). If you run this aside, Beat 7's week also pays Dr Ropata, so its totals move: read them from the app.
- **Handset:** no mobile side.

#### Optional aside: the unmatched queue

- **Click:** **Intake → Matching**, **Demo actions → Import hospital file**, choose **Southern Cross**, **Run**. Filter **Unmatched**. Open Tama Henare, type **ZQA1008**, **Add NHI**. Open Grace Whitu, **Create a List in a session**, choose **Delaney, Mark** (Tier 1, Free PM), **Create List and Booking**.
- **Say:** "Nothing a hospital sends is dropped. A row with no NHI waits here, and a stub stands on the List until the office adds it. A row that matches no List waits until someone decides."
- **Expected:**
  - Import: "Southern Cross sent its theatre list: 5 rows are waiting on Matching. Nothing changes the schedule until the office decides." UNMATCHED 3.
  - Tama Henare: "A stub stands on Dr Souter's Tue 1 Dec PM List". Add NHI reads "Applied: Booking created on Dr Souter's Tue 1 Dec PM List" and "The Booking takes the stub's place on the List."
  - Grace Whitu: "No List at Southern Cross for Ms Patel on Thu 10 Dec PM". **Create List and Booking** reads "Choose the anaesthetist first." until one is picked, then "List and Booking created in Dr Delaney's Thu 10 Dec PM session".
  - No invoice numbers move.
- **Handset:** the import is Admin only, so on a handset alone Tue 1 Dec PM has no stub. Use Dr Souter's Tue 8 Dec PM List instead: on Mere Tipene's stub, **Demo sheet → Office adds the NHI to this stub**.

#### Optional aside: Xero outage, a void made in Xero, a bulk hospital remittance

- **Click:**
  - **Billing monitor**, **Demo actions → Simulate Xero outage**, **Run**. Open **Review queue → Dr Mark Delaney, Fri 20 Nov AM** (St George's), **Authorise for billing**, confirm. Back on the **Billing monitor**, **Demo clock → +15 min**, then **Demo actions → Restore Xero**, **Run**.
  - **Demo: Billing Monitor & Xero → Invoices → AA-2026-H05**, **Demo actions → Void this invoice in Xero**; on **AA-2026-H06**, **Demo actions → Edit this invoice's total in Xero**. Then **Billing monitor**, **Demo actions → Run reconciliation poll**.
  - **Demo: Billing Monitor & Xero → Invoices**, **Demo actions → Simulate bulk hospital remittance**, **Run**, then the **Bank reconciliation** tab.
- **Say:** "Xero going down doesn't stop the office. Authorising carries on, every call waits in the queue, and when Xero comes back the queue sends them in order, once each. If someone voids or edits an invoice straight in Xero, the daily poll flags it and the ledger keeps what AA issued. When a hospital pays many invoices with one bank payment, Xero matches the lines by invoice number."
- **Expected:**
  - Outage: "Xero is unavailable to the Billing Engine. Authorise a List: its hand-offs wait in the Xero sync queue, and every clock change retries what is due." Authorise reads "1 invoice raised. 1 emailed, 0 to post." (AA-2026-0011, Alan Prentice, $341.55). The line reads "Xero unavailable since 08:00 · 1 waiting"; the row "Xero API unavailable (simulated outage)", Waiting. After +15 min: 2 attempts, next try 08:19, Retrying. Restore: "Xero is back. The queue sent 1 waiting call in order.", "Nothing is waiting for Xero.", **Sent after waiting (2)** after Beat 6. This aside takes AA-2026-0011, so Beat 7's rebill reads AA-2026-0012.
  - Void and edit: "AA-2026-H05 is voided in Xero. The engine does not know yet: run the reconciliation poll (or Next day) and it is flagged on the Billing monitor." and "AA-2026-H06 now totals $1,910.00 in Xero. ..." The poll: "Reconciliation poll applied 1 missed payment, flagged 2 invoices changed directly in Xero." **Changed directly in Xero** lists AA-2026-H05 "Voided in Xero 08:15" against "Receivable open, $1,410.00" and AA-2026-H06 "Amended in Xero 08:15 · total $1,910.00" against "Receivable open, $1,930.00". **Resolve** reads "Provisional: the policy for each mismatch is to be agreed with AA." The missed payment releases AA-2026-H02 ($1,240.00) to Dr Souter's next run.
  - Bulk: "St George's remittance landed in Xero: 2 lines matched by invoice number ($1,365.50), and the engine learned each payment by webhook. 1 line could not be matched and waits in Bank reconciliation." Choose **AA-2026-H04 · $980.00 open** on the unmatched line, **Match in Xero**.
- **Handset:** no mobile side.

### Beat 7: The credit note and credit-and-rebill

- **Click:**
  - **Billing monitor**, **Demo actions → Stage refund after payout**, **Run**. Follow its **Open AA-2026-0004** link.
  - In **Correct this invoice**, **Credit in full and rebill**. Reason **Wrong amount**. Under **New invoices**, change the copied line's amount from $207.00 to $184.00. **Save for review**.
  - **Review queue → Events**: on the Credit row, **Review → Approve for billing**.
  - **Billing monitor**, **Demo actions → Run the next billing run**, **Run**. Open AA-2026-0004, then the credit note.
  - **Billing monitor**, **Demo actions → Stage a payment week**, choose **19 BCTIs**, **Run**. Then **Close the week**, **Approve week 48's BCTIs**, **Send payment schedule**, **Run payables in Xero**.
  - **Run payables in Xero** posts the whole practice's week: allow about half a minute before the screen answers. Under **Payment runs**, open Week 48's PR0002, then Dr Sharma's **Remittance advice**.
- **Say:** "Sarah Mitchell's invoice was paid and Dr Sharma has been paid for it. Then we find the amount was wrong. We never edit an issued invoice. We credit it in full and rebill from a corrected copy of the original's lines. A credit note always covers the whole invoice. The credit reverses Dr Sharma's payable with a negative invoice, and that negative nets in her next weekly payment run. Before an invoice goes out, the office edits the Booking instead. The weekly cycle is a proposal we're confirming with AA's accountant."
- **Expected:**
  - Stage: "Paid in full, approved for payment and paid out to Dr Sharma in Xero. Credit it to see the negative invoice. Once credited, the negative invoice is netted in Dr Sharma's next payment run." **Payment runs** gains Week 48 PR0001, $238.05, Paid, Staged.
  - The sheet: "Credit in full and rebill · Sarah Mitchell · Appendicectomy, laparoscopic", "Credits AA-2026-0004 in full. Nothing on it is edited.", TOTAL $238.05. **What happens to the money**: "Paid $238.05: $238.05 will be held for Christchurch Public.", "Dr Sharma was paid $238.05: a negative invoice for $238.05 nets in their next payment run.", "A credit note is not a refund." After the edit: subtotal $184.00, GST $27.60, total $211.60. **On issue**: Debit AA-2026-0004 $238.05, Credit "Credit note, numbered on issue" $238.05, Contra "Negative invoice to Dr Sharma, numbered on issue" $238.05, Debit "New invoice to Christchurch Public" $211.60.
  - Events tab: "Credit AA-2026-0004 in full, 1 new invoice", Wrong amount, $207.00, with its New invoice row $184.00. Approve reads "Approved · issued in the next billing run".
  - "Billing run done: 1 credit note and 1 additional invoice raised (CN-2026-0002, AA-2026-0011)." AA-2026-0004 reads "Credited in full by CN-2026-0002 on Tue 24 Nov 2026 · rebilled as AA-2026-0011". CN-2026-0002: reason Wrong amount, Raised by the office, **Negative invoice** "CN-2026-0002-P to Dr Sharma · $238.05 · $238.05 nets in the next payment run", **New invoices** AA-2026-0011 $211.60.
  - Ledger: "In balance · receipts held equal payables due", CREDITS HELD FOR PAYERS $498.05 ($260.00 seeded plus $238.05), NEGATIVE INVOICES TO NET $238.05.
  - Payment week: "19 payables released for Dr Sharma into Week 48. Close the week to start the run." **Waiting for this week's run** heads the practice's list with Dr Souter 1, $1,380.00 (Beat 2's transfer), and Dr Sharma 19, $10,837.86, negatives netted -$238.05, net $10,599.81. The run reads "Week 48 paid in Xero: 1617 BCTIs, 1 negative invoice netted, $672,402.48 paid to 71 anaesthetists." (the BCTI count is provisional: OQ-29, OQ-60), and the panel moves on to Week 49, "Nothing is waiting for this week's run."
  - Remittance advice RA-2026-W48-41267: nineteen BCTIs, the line "Negative invoice CN-2026-0002-P · credit of AA-2026-0004 -$238.05", BCTIs paid (19 BCTIs) $10,837.86, Negatives netted -$238.05, Paid to you $10,599.81. Dr Souter's advice RA-2026-W48-34821 lists "PXT0003 · AA-2026-0001 · Fri 27 Nov · Priya Nair $1,380.00".
- **Handset:** Dr Souter credits her own Procedure: search Chen, open David Chen's Mon 26 Oct Booking, **Credit note** on the Contract row ("Credits AA-2026-H03 in full", TOTAL EX GST $452.61, reasons Less work than expected, Wrong billable party, Paid twice; "Your payment for this invoice is reversed."), choose **Less work than expected**, **Save for review**, then **Demo sheet → Office reviews this credit** ("Approved by the office and issued in the next billing run (CN-2026-0002)." on a handset-only run). The Credit reads Issued. On web the same sheet is at `/web/lists/L-HIST-03/bookings/HBK03`; the office approves it on **Review queue → Events**.

#### Optional aside: split a combined Procedure by a credit

- **Click:** **Invoices**, **Demo actions → Stage combined procedure**, **Run**, then its **Open AA-2026-0012** link. **Split into additional invoices**: Facelift $2,400, Blepharoplasty $800, **Add an invoice**, Fat grafting, then **Put the rest on this invoice**. **Save 3 invoices for review**, approve the Credit row on **Review queue → Events**, then **Billing monitor**, **Demo actions → Run the next billing run**.
- **Say:** "Lorraine Petrie wants her facelift bundle in three pieces. We credit the bundle and raise three invoices. The office splits the amount any way it likes, as long as the pieces add up to what was credited."
- **Expected:**
  - Stage: "Staged: a billed Merivale combination. Open its invoice and use Split into additional invoices." AA-2026-0012 totals $4,255.00.
  - Split: before the third amount, **Left to allocate** reads $500.00. After **Put the rest on this invoice** it reads $0.00 and **Save 3 invoices for review** turns on.
  - Run: "Billing run done: 1 credit note and 3 additional invoices raised (CN-2026-0003, AA-2026-0013, AA-2026-0014, AA-2026-0015)." The original reads "Credited in full by CN-2026-0003 on Tue 24 Nov 2026 · replaced by AA-2026-0013, AA-2026-0014, AA-2026-0015".
- **Handset:** no mobile side.

### Beat 8: The date approaches

- **Click:**
  - **Admin Day view**, Tue 24 Nov: select the rail's **Pre-payments** tile, then read the **To-do** tab.
  - **Demo actions → Move to 2 days before procedure**, choose **Annette Riley · Tue 8 Dec**, **Run**.
  - Read the **To-do** tab and the **Pre-payments** tile, then her Booking's warning.
- **Say:** "Annette's new prepayment is still waiting for approval. Two days out, the warning turns strong, but it never blocks the procedure. The office chases it, and the anaesthetist sees it when she opens the Booking."
- **Expected:** before the jump, the Pre-payments tile reads "1 pre-payment · 1 to approve" and lists Annette Riley $1,350.00, "Dr Beaumont · Tue 8 Dec · In 14 days", Awaiting approval; the To-do tab reads 10 with no row for her. The action reads "The demo clock is now Sun 6 Dec, 2 days before Annette Riley's procedure. The prepayment warning is strong.", and the Day view opens on Sun 6 Dec. The To-do tab reads 11, its last row "Prepayment of $1,350.00 from Annette Riley is awaiting approval on Invoices and has not been sent." (Annette Riley · Dr Beaumont · Tue 8 Dec PM) with **Clear**; the tile reads "In 2 days"; her Booking shows the warning as Strong. The clock only moves forward: Reset restores Tue 24 Nov.
- **Handset:** no mobile side in this order, because the rebooked Booking is Dr Beaumont's, and Dr Souter has no outstanding prepayment left. To show it on a handset, end a handset run on Riley's Booking straight after Beat 1 with **Demo sheet → Move to 2 days before procedure** ("The demo clock is now Wed 25 Nov, 2 days before Annette Riley's procedure. The prepayment warning is strong.").

### Discovery points

- OQ-73 · Prepayment invoice when the patient is not the billable party: a prepaid Contract always bills the Procedure's payer (Beat 1), labelled on the Contract as awaiting AA's confirmation.
- OQ-120 · Does a prepayment invoice name the anaesthetist?: built as yes, so the letter in Beat 1 names Dr Souter; the anaesthetist-changed email carries "Provisional (OQ-120)".
- OQ-125 · What triggers the release of a prepayment from the holding account?: the transfer out of the AA Holding account runs when the office authorises the List (Beat 2), shown on the holding card's pill.
- OQ-29 · GST agency treatment of the receivable and payable invoices: the BCTI wording and the count in Beat 7's weekly run, one BCTI per paid receivable invoice, the transfer included.
- OQ-60 · What the AA per-invoice fee counts, and how the fee is paid: the same BCTI count, which AA's monthly fee is charged on.
- OQ-47 · Does the accountant agree to the weekly payment cycle?: proposed; Beat 7's run follows it while AA's accountant confirms it.

---

## S5 · Compliance tour

**Serves:** the audit trail, the NHI at entry and its absence from Xero, the lock on authorise and each Contract's history, a Contract replaced from a date, an anaesthetist who leaves on a last day, the questions evaluators ask about governance. **Time:** 9 to 10 minutes.

**Stage it:** Control Panel **S5 · Compliance tour → Jump → Confirm jump**. The jump resets the demo data and sets up two things. On Dr Souter's Tue 24 Nov PM List it builds David Chen's audit trail: an ASA III modifier claimed with its explanation, Kirsty W.'s save of his note and time as one change set, then the claim removed. It also authorises Dr Whitaker's Fri 20 Nov List, which raises five invoices, AA-2026-0002 to AA-2026-0006, Hemi Walker's first at $264.50. The jump shows five beat links:

- Beat 1 · Admin Booking History, David Chen
- Beat 2 · Admin Patients, Waiting for NHI
- Beat 3 · Data inspector
- Beat 4 · Master data, Contracts
- Beat 5 · Admin Review, Mon 23 Nov AM

Each link only opens the screen, in the same tab. In Beat 1 open **History** yourself. Beat 2's link opens Intake's **Waiting for NHI** tab, and Beat 4's opens the Contract's own page in the **Contracts** section; the two links keep their older names. Come back to the Control Panel for the next link; the links stay there until the next reset, and each beat also gives its route. Reset alone (**Reset demo data → Confirm reset**) is enough for Beats 2, 3 and 5, but Beats 1 and 4 need the jump. On the handset, sign in on the PWA as Dr Souter and leave **Play the office** off on More. The handset keeps its own demo data, so the jump does not reach it.

### Beat 1: The audit trail

- **Click:**
  - **Beat 1 · Admin Booking History, David Chen** (or `/admin/day/2026-11-24/bookings/BK0008`). The strip at the top reads "Saved · 2 changes · 08:00 · Kirsty W. CS0001".
  - **History**. Pause on **Modifier claimed**, then **Saved by Kirsty W.** (2 changes), then **Modifier claim removed**.
  - **View as at** on Kirsty W.'s save. **Close** the as-at view, then close History.
  - **Demo actions → Switch office user** → **Run**.
  - On the Booking, select **5 minutes later** beside the time and type a line under the office note ("Anything the office should know…"). **Save changes**.
  - **History** again: **Saved by Sam T.** sits above Kirsty W.'s save. Close it.
  - **Draft update email**. Sam T.'s save is ticked; tick Kirsty W.'s save too. Point at **Booking change**, **Surgeon's office** and the preview. **Close**.
  - **Demo actions → Switch office user** → **Run** to go back to Kirsty W.
- **Say:** "Every change to a Booking or a Procedure is in its history: who made it, their role, where it came from, and the value before and after. That includes changes the system makes. Dr Souter claimed ASA III with an explanation, then took it off. Both steps are here. The office saves on purpose, and each save is one change set with a name on it. We can show the Booking as it stood at any save. When a change matters to the surgeon, the office picks the saves to report and drafts the email from its own templates."
- **Expected:**
  - History, most recent first: 16:02 **Booking completed** and 16:00 **Procedure updated** (TIME UNITS 4, Start 24 Nov 15:12, Finish 24 Nov 15:58), both Dr Melanie Souter · anaesthetist.
  - Then at 08:00: **Modifier claim removed** (MODIFIER AS3 · ASA III → none, EXPLANATION Pre-op review: ASA III → not set), **Saved by Kirsty W.** with "2 changes", Kirsty W. · office · CS0001 (SCHEDULED TIME 15:10 → 15:25; NOTES FOR THE OFFICE not set → "Rooms called: confirmed self-funded account details ahead of invoicing."), and **Modifier claimed** (MODIFIER none → AS3 · ASA III, EXPLANATION not set → Pre-op review: ASA III).
  - Last, the Wed 11 Nov rows where Kirsty W. created the Booking.
  - View as at reads "As at Tue 24 Nov 08:00, after Kirsty W.'s change": time 15:25, her note, Contract "No contract · RVG · Anaesthesia Associates", Paid by David Chen (Patient).
  - Switch office user reads "The office is now Sam T.".
  - Before the save the bar reads "2 unsaved changes · Notes · Time" and **Draft update email** is disabled: "Save your changes first. The email uses saved changes."
  - After the save the strip reads "Saved · 2 changes · 08:00 · Sam T. CS0002", and Sam T.'s row shows SCHEDULED TIME 15:25 → 15:30.
  - With both saves ticked the email reads "Time: was 15:10, now 15:30" (the office note never goes in an email). It goes to admin@avonsidesurgical.example, subject "Booking update: David Chen, Tue 24 Nov PM", signed Sam T., with "Opens in your mail client. The system does not send it."
  - Chen's fee ends where it started: 9 units x $26.50 = $238.50.
- **Worth pointing at:**
  - Chen's time units read **T · Time 4 · Adjusted manually**.
  - A price typed by the office shows as **Price changed**, with the price before and after. Paula Westerman's Face lift (`/admin/day/2026-12-14/bookings/BK0187`) reads "Price changed · Kirsty W. · office · PRICE not set → $2,950.00".
  - The top bar keeps showing Kirsty W. after **Switch office user**. The save strip, History and the email name the user who saved.
  - If History opens on an as-at view, **Close** that view first.
- **Handset:** **Demo sheet → Office edits this Booking** on David Chen's Booking (Tue 24 Nov PM List): "The office moved this Booking to 15:40." Its **History** on the phone shows **Saved by Kirsty W.** · 1 change · CS0001, SCHEDULED TIME 15:10 → 15:40.

#### Optional aside: sign out and back in, and the sign-in rows

- **Click:**
  - On the handset, More → **Sign out** (or **Demo sheet → Sign out**, then close the sheet). The sign-in screen shows with the account filled in. **Sign in**.
  - In the framed build, do the same on the framed phone's More (**Sign out**, **Sign in**), then **Admin → Audit** and set Entity type to **account**.
  - **Demo actions → Simulate sign-in attempts** → **Run**.
- **Say:** "Signing in and out is recorded against the account. So are a failed attempt, a password reset and a new account. How anaesthetists sign in is still to be decided, so this screen stands in for it."
- **Expected:**
  - The sign-in screen carries a **Provisional** pill: "How anaesthetists sign in (two-step codes, single sign-on, Face ID) is still to be decided. This screen stands in for it." (OQ-83).
  - Audit, Entity type account: 2 entries, **Signed in** and **Signed out**, Dr Melanie Souter, account 34821, "App Mobile (PWA)".
  - Simulate sign-in attempts reads "Added 5 sign-in rows to the audit log. Set Entity type to account to see them together. The identity service itself is simulated: the proposal is Auth0 or Entra External ID."
  - The five rows are **Account provisioned** (Credentials visible to admin no), **Signed in** for Kirsty W. (MFA check passed), **Sign-in failed** for Kirsty W. (Incorrect password), **Password reset by user** and **Signed in** with Apple (social login) for Dr Souter.
  - The **account** choice appears under Entity type only once such a row exists.
- **Handset:** self-contained. The phone signs out and in on its own. Its rows land in the phone's own data, so show them from the framed phone.

### Beat 2: NHI at entry

- **Click:**
  - **Beat 2 · Admin Patients, Waiting for NHI** (or **Intake → Waiting for NHI**). One row: Mere Tipene, a stub on Ms K. Patel's List, Tue 8 Dec PM.
  - **Demo actions → Receive list with a missing NHI** → **Run**. It runs once per reset.
  - Point at Aroha Ngata (Urgent, 2 days to go) and Losa Tuilagi (6 days). **Email for the NHI** opens the office's mail client.
  - **Day view → Mon 30 Nov**, open Dr Souter's AM List (Forte Health, Mr C. Okafor): Losa Tuilagi stands at 10:30 as a stub.
  - Back on **Intake → Waiting for NHI**, **Add NHI** on Losa Tuilagi. Type `ZAA0068`, then `JKL1188`. **Add NHI**.
  - **Day view → Tue 24 Nov**, open Dr Souter's PM List (Southern Cross, Ms K. Patel), **Add Booking**. Type `ZIX41AL`, then `ZBX41AL`, **Look up**.
  - **Demo actions → Hub: Available / Slow / Unavailable**, choose **Unavailable**, **Run**. **Look up** again. Then set it back to **Available**.
  - Clear the NHI field and point at **Save booking**. Close the form.
- **Say:** "The NHI is the patient's identifier. No Booking saves without one. When a hospital or a surgeon's office sends a booking with no NHI, the row waits here, and the anaesthetist still sees it on the List as a stub. The office chases the NHI with whoever sent the List. Once the NHI is added, the Booking takes the stub's place, and a returning patient keeps their one record. Both NHI formats are checked as they are typed, so a bad number never reaches the Hub. If the Hub is down, the office types the details by hand."
- **Expected:**
  - Receive list reads "Forte Health sent two bookings with no NHI. They wait here and on Matching, and nothing is created yet. Add NHI ZQA3019 for Aroha Ngata (a new patient) and JKL1188 for Losa Tuilagi (an existing record)." **Waiting for NHI** goes from 1 to 3, and so does Intake's badge in the side nav.
  - Each row shows the patient as received, the List, "Stub on Mr C. Okafor's List", the address to chase (Avonside Surgical Rooms, admin@avonsidesurgical.example, 03 555 0118), **Email for the NHI**, **Add NHI** and **Open on matching**.
  - On the Day view the stub reads "Losa Tuilagi · carpal tunnel decomp L · Waiting at intake: no NHI · The office is resolving this" with **Resolve on Matching**.
  - In the Add NHI sheet, `ZAA0068` reads "The check digit does not match." `JKL1188` reads "Valid NHI", "On the NHI register: Losa Tuilagi, 1 JUN 1992." and "Matches Losa Tuilagi, born 1 JUN 1992, 2 earlier Bookings. The row uses this record; no second one is made."
  - **Add NHI** reads "Added. The Booking is on Mr C. Okafor's List in the stub's place." Waiting for NHI drops to 2.
  - On Add a booking, `ZIX41AL` reads "The letters I and O are never used in an NHI." with **Look up** disabled. `ZBX41AL` reads "Valid NHI", and Look up finds "Found Ana Fifita on the NHI register. Details pre-filled, still editable." with **New format NHI**.
  - The purpose note reads "Looked up on behalf of Dr Melanie Souter (HPI CPN 10SOUM), only to identify this patient. Health Information Privacy Code 2020."
  - With the Hub Unavailable the form shows **HUB SIMULATED AS UNAVAILABLE** and "The Digital Services Hub is not answering. Enter the details by hand, or try again." with **Retry**.
  - A blank NHI reads "An NHI is needed to save a Booking." and **Save booking** stays disabled.
- **Worth pointing at:** the Hub entry appears under **Demo actions** only while an NHI lookup is open (Add a booking, Add NHI, or Refresh from NHI register). **Slow** shows "The Hub is slow to answer. Keep waiting, or stop and enter the details by hand." with **Stop waiting**; the answer arrives after a few seconds.
- **Handset:**
  - On Dr Souter's Tue 8 Dec PM List, Mere Tipene shows "Waiting at intake: no NHI · The office is resolving this". **Demo sheet → Office adds the NHI to this stub** reads "The office added the NHI. The Booking now stands in the stub's place." (Mere Tipene, ZQA1024).
  - On the Mon 30 Nov AM List, **Demo sheet → Office adds the NHI** plays the whole round: "The office added the NHI: Tomasz Nowak is now on your List."
  - In **Add a booking**, **Demo sheet → Hub: Available / Slow / Unavailable** (Unavailable) gives the same manual fallback and **Retry**.

#### Optional aside: the validator, the patient view and the HPI CPN

- **Click:**
  - **Intake → Validators**: type `ZAA0067`, `ZBX41AL`, `ZAA0068`.
  - **People → Patients**, **All**, open Fiona Gray (`/admin/people/patients/ZAM1098`). **Refresh from NHI register**. Set Name to **Use register**, keep the address, **Apply**.
  - Open Kevin Doherty (`/admin/people/patients/ZAQ4425`), **Refresh from NHI register**, then **Cancel**.
  - **People → Anaesthetists**: the REG · HPI CPN column. **People → Surgeons**: Dr B. Osei.
- **Say:** "The patient's page holds what they owe, their invoices and Bookings, and a follow-up log for calls, notes and reminders. When it needs to, the office refreshes the patient's details from the NHI register, field by field. Every practitioner's HPI CPN shows the same way in each app. A surgeon can be saved before their HPI CPN is known, and books like any other."
- **Expected:**
  - The validator note reads "Current format AAANNNC uses a mod-11 check digit; the new format AAANNAX uses a mod-23 check letter. The requirement labels the current algorithm "Modulus 24", but its own example NHIs validate only under mod-11, so this demo uses mod-11, and the label is flagged for AA to confirm. Both formats are mandated dual-format from 1 July 2027."
  - `ZAA0067` reads "Valid NHI · Format: current (AAANNNC, mod-11)"; `ZBX41AL` "Valid NHI · Format: new (AAANNAX, mod-23)"; `ZAA0068` "Not valid · Format: current (AAANNNC, mod-11) · The check digit does not match."
  - Fiona Gray's page shows BALANCE $0.00, "No invoices for this patient yet.", two upcoming Bookings, the **Follow-up log** (Call, Note, Reminder, **Log call**), and "NHI register · Not refreshed yet" with a **Provisional** pill.
  - The refresh reads "On the NHI register: Fiona Tamihana, 17 OCT 1963." with Name (Fiona Gray to Fiona Tamihana) and Address (236 Clyde Road, Cashmere to 5 Kowhai Lane, Halswell), each **Keep** or **Use register**. After **Apply** the page reads Fiona Tamihana and "Last refreshed 24 Nov 2026, 08:00".
  - Kevin Doherty's address reads "Not held" against the register's 41 Harewood Road, Papanui, marked **Will be added**.
  - Dr Souter's HPI CPN is 10SOUM on the Anaesthetists list (under her registration, 34821), on the phone's More and in the lookup note.
  - Dr B. Osei, Dr A. Selwyn and Dr P. Whaanga read **No HPI CPN yet**. Dr Osei can be picked as the surgeon in **Assign List** like any other (OQ-143 stays open on surgeons without an HPI CPN or a full name).
- **Handset:** More shows "HPI CPN 10SOUM · Your unique identifier on the Health Provider Index." No other mobile side.

### Beat 3: No NHI in Xero, and the leak scan

- **Click:**
  - App switcher → **Demo: Billing Monitor & Xero**. Pause on **No personal information in Xero**, then open the **Contacts** tab.
  - **Beat 3 · Data inspector** (`/demo/data`), the **Privacy checks** panel.
  - **Demo actions → Scan for NHI leaks**, **Scan now**, **Run**.
  - Run it again with **Scan with a planted test leak (proves the scan finds one)**.
- **Say:** "No personal information goes to Xero. No NHI, no patient name. Xero knows each patient or payer only by a hidden ID, which links the transaction back to its invoice here. The scan checks the Xero records, the diagnostic log and every failure reason for anything that looks like an NHI. The planted line proves it finds one."
- **Expected:**
  - The callout reads "Xero holds no NHI and no other personal information about a patient or a person paying for one. Each such contact is known to Xero only by a hidden internal ID in ContactNumber, shown as its name, and by Xero's own ContactID, which link each transaction back to its invoice in the billing system. Patient lookup happens in the billing system, never in Xero."
  - On Contacts, patients read "Patient PT0005", "Patient PT0017" (Archived) and so on, and the paying party "Billable party BP0001". Hospitals, Parties and the anaesthetists keep their names.
  - Scan now, after Beat 2 as scripted, reads "Scanned 3 areas and 7,547 items in 117 ms. No NHI outside the core platform, and no personal details in Xero." The count moves with what Beat 2 added, and the time varies. Xero (7,545 items), Diagnostic log (0 items) and Failure reasons (2 items) each read **0 found**. Patients, Bookings, Hospital rows and Audit trail read **Held by design**.
  - The planted run reads "One hit found, the planted test line." with one masked hit, "planted test line · ZBC••••", in **Diagnostic log (planted test line)**. Every other area stays at 0.
- **Handset:** no mobile side.

#### Optional aside: the restricted raw row and the synthetic-data badge

- **Click:**
  - **Intake → Matching**, open Mere Tipene's row.
  - **View raw row**, pick **Find why this row did not match**, **View raw row**. **Close**, then close the row panel.
  - **Demo actions → View raw row as another role**, **As Dr Melanie Souter (anaesthetist)**, **Run**.
  - **Audit**, Entity type **importRow**.
- **Say:** "The office sees only what it needs to match the row. The rest of what the hospital sent is restricted and masked, and every view is recorded with a reason. Only office staff can open it."
- **Expected:**
  - The panel reads "Only the fields needed to match are shown. The rest of what the hospital sent is held under restricted access." View raw row stays disabled until a reason is chosen ("Give a reason first.").
  - The sheet reads "Mere Tipene · Restricted. Viewing is recorded with your reason." and "Masking policy is for AA to agree. Identifiers are masked. The audit keeps your reason, never these values." It shows Hospital patient number •••017, date of birth 1981-••-••, address •••, Ilam, email •••@example.net, next of kin J. T., NHI Blank.
  - The panel then reads "Raw row viewed once · last Kirsty W. 08:00".
  - The other role reads "Refused: only office staff can view a raw hospital row (Mere Tipene's row). The attempt is in the audit trail."
  - Audit shows **Raw row view refused** (Dr Melanie Souter, anaesthetist) above **Raw row viewed** (Kirsty W., Reason Find why this row did not match), and no values from the row.
  - **Synthetic data only** shows in the top bar, above the app.
  - Beat 2's **Add NHI** also left **Hospital row corrected** (NHI not set → JKL1188) and **Hospital row decided** under importRow, below the two raw row entries.
- **Handset:** no mobile side.

### Beat 4: The lock and each Contract's history

- **Click:**
  - **Beat 4 · Master data, Contracts** (or `/admin/contracts/CT-HNZ`). It opens Health NZ agreed rate, CPH-002, on its own page in the **Contracts** section.
  - **History** tab: "No changes yet", and **Procedures locked against this Contract**.
  - **Overview** tab: **Edit** on the **Price** card, change **RATE ($ PER UNIT)** from 23 to 24, **Save**.
  - **History** again.
  - Follow **AA-2026-0002** on Hemi Walker's row. Pause on the **Locked record**.
  - **Demo actions → Regenerate from locked data** → **Run**.
- **Say:** "A Contract is edited in place. Every change is kept with the values before and after, who made it and when, and nothing is deleted. A Booking's price follows its Contract until the office authorises the List. Authorising locks each Procedure's Contract onto it: the settings, the price range in force, the rate, the price, who is billed and who is paid. The invoice is raised from that lock, so a later change to the Contract leaves it as it was. Regenerate rebuilds the invoice from the lock and compares the two."
- **Expected:**
  - Before the edit, Dr Whitaker's five Fri 20 Nov Procedures are listed: Hemi Walker BK0017 (AA-2026-0002), Chris Liu BK0018 (0003), Laura Collins BK0019 (0004), Olive Patel BK0020 (0005), Gemma Kaur BK0021 (0006), each "Locked Tue 24 Nov, 08:00", under "Locked when their List was authorised. Their invoices keep the price and settings they were raised with, whatever changes here."
  - After the save the Price card reads "RVG at $24.00 per unit", and the History reads "TODAY · TUE 24 NOV · 08:00 · Saved by Kirsty W. · 1 change · Kirsty W. · office · CS0002 · Contract updated · PRICING RVG at $23.00 per unit → RVG at $24.00 per unit".
  - Hemi Walker's invoice still totals $264.50. Its Locked record reads Health NZ agreed rate, "CPH-002 · RVG at $23.00 per unit · bills holder", Billed to Christchurch Public, Price $230.00, "10 units @ $23.00/unit (Contract rate, locked)", Paid to Dr Ben Whitaker, Priced on Fri 20 Nov 2026, "Locked Tue 24 Nov, 08:00 by Kirsty W.".
  - Regenerate reads "Regenerated from locked data: identical (1 line, total $264.50)".
- **Worth pointing at:** the holder, the pricing kind and prepaid sit under "Fixed when it was created", with "Set when the Contract was created. To change one of these from a date, use Replace from a date." Health NZ agreed rate is an RVG rate, so it has no price ranges. A fixed price has them (see the aside below).
- **Handset:** no mobile side.

#### Optional aside: a backdated price range, Disable, and Replace from a date

- **Click:**
  - On Face lift's page (`/admin/contracts/CT-MER-FACELIFT`, or **Contracts**, search `MER-001`), **Demo actions → Demo: add a backdated price range** → **Run**. Read the **Price ranges** card.
  - Open Sophie Matthews' Face lift (`/admin/day/2026-12-14/bookings/BK0163`).
  - Back on Face lift, **Disable**, then **Disable** in the dialog.
  - Open Health NZ agreed rate (`/admin/contracts/CT-HNZ`) and press **Replace from a date**. Under NEW CONTRACT type 25 ($ per unit), set **CHANGE DATE** to Thu 26 Nov, leave every Procedure ticked and the old Contract active, then **Create CPH-003 and move 9**.
  - **Open CPH-002**, then **Demo actions → Demo: reach the change date** → **Run**. Read the notice, then open **Day view** and its **To-do**.
  - Back on CPH-002, press **Disable** on the notice, then **Disable** in the dialog.
- **Say:** "To change a fixed price, the office adds a price range, and its start can be in the past. Every Procedure on the Contract takes the new price unless something holds it. A locked one keeps its price and is listed. A Contract is never deleted. The office disables it, and anything not yet authorised on it is flagged at review. When more than a price range changes from a date, here Health NZ's agreed rate, the office replaces the Contract from that date in one step: the new Contract copies the old one, the Procedures from that date move across, and on the day a to-do reminds the office to disable the old one."
- **Expected:**
  - The Run reads "Added a range from 4 Nov 2026 at $3,300.00 to the Face lift. Unedited Face lift Bookings now price at $3,300.00; the typed and the invoiced ones are held. 3 authorised Procedures kept their old price: Daniel Poutama, $3,100.00; Ella Tawhiri, $3,100.00; Judith Calloway, $3,100.00."
  - The Price ranges card reads 2 ranges: 4 Nov 2026, Onwards, $3,300.00, +6.5%, In force; and 5 Oct 2026 to 3 Nov 2026, $3,100.00, First. Under them, "3 authorised Procedures kept their old price": Daniel Poutama (Wed 11 Nov), Ella Tawhiri (Wed 18 Nov) and Judith Calloway (Thu 19 Nov), each LOCKED $3,100.00, RANGE $3,300.00.
  - Sophie Matthews' Face lift reads $3,300.00 (it was $3,100.00).
  - The Disable dialog reads "Disable Face lift?" and "3 Procedures dated on or after Tue 24 Nov are still on Face lift. Nothing moves by itself: open each to move it.", listing Sophie Matthews, Fiona Lattimer and Paula Westerman (Mon 14 Dec, Souter · St George's PM), each with **Open**. Disabled, the page reads "Disabled on Tue 24 Nov: hidden from the Contract list unless asked for. Procedures already on it keep it; one not yet authorised and dated on or after Tue 24 Nov is flagged at review." and offers **Make active**.
  - The Replace sheet reads "Replace Health NZ agreed rate from a date" and "A new Contract takes over. Everything is copied except what you change here." Its step 3 reads "Procedures from Thu 26 Nov still on CPH-002", 9, all ticked: eight on Dr Souter's Christchurch Public AM List and Sione MacDonald on Dr Ropata's PM List, with "Authorised Lists are locked and are not listed." Step 4 defaults to "Leave CPH-002 active; a to-do on 26 Nov 2026 reminds you to disable it", and the sheet notes "A rate has no dates, so CPH-003 is offered from today, not from 26 Nov 2026. Until CPH-002 is disabled, both are offered."
  - Created, the new page reads "Replaced CPH-002. 9 Procedures moved.", "Replaces CPH-002 from 26 Nov 2026." and RVG at $25.00 per unit. CPH-002 reads "Replaced by CPH-003 from 26 Nov 2026." and its Bookings tab drops from 33 to 24.
  - The demo action reads "Clock now Thu 26 Nov: CPH-002 replaced by CPH-003 from 26 Nov 2026. Its to-do shows in the Day view and on its page." CPH-002's notice reads "Replaced by CPH-003 from 26 Nov 2026. Disable it so it is no longer offered." with **Disable**, and the Day view's To-do carries "Contract · Disable Health NZ agreed rate (CPH-002) · Replaced by CPH-003 from 26 Nov 2026" with **Open Contract**.
  - Its Disable dialog reads "No Procedure from today is on it." Disabled, the to-do leaves the list.
  - **Reset → Confirm reset** (or jump S5 again) to undo; the change date moved the clock.
- **Handset:** No mobile side.

### Beat 5: Authorise, then edit the rate per unit

- **Click:**
  - **Review queue**, open Dr Souter's Mon 23 Nov AM List, Forte Health (`/admin/review/L-34821-2026-11-23-AM`). Point at the rate in the totals row.
  - **Authorise for billing**, then **Authorise for billing** in the dialog.
  - **People → Anaesthetists**, open Dr Melanie Souter (`/admin/people/anaesthetists/34821`). On the **Rate and tier** card press **Edit**, change **RATE PER UNIT ($)** from 26.50 to 28.00, **Save**.
  - Back to the authorised List (`/admin/review/L-34821-2026-11-23-AM`). It has left the queue. **Review queue** lists it under **Recently billed**, which does not open it.
  - **Invoices**, open Brian Holt's **AA-2026-0007**. **Demo actions → Regenerate from locked data** → **Run**.
  - Open an ACTIVE Booking of hers: Hemi Walker on the Tue 24 Nov AM List (`/admin/day/2026-11-24/bookings/BK0001`).
- **Say:** "Dr Souter's rate per unit is read when the List is authorised and kept in the lock. Change it afterwards and her invoices stay as they were. Work not yet authorised takes the new rate."
- **Expected:**
  - Before authorise the totals read 34 units, $901.00, "@ $26.50/unit (list rate)".
  - The dialog reads "Authorise this list for billing?" and names what is locked: "its settings, the price range in force, the rate, the price, who is billed and who is paid."
  - After it the totals read "@ $26.50/unit (locked)".
  - The invoices list shows AA-2026-0007 Brian Holt $365.70, AA-2026-0008 Ruth Kim $396.18 and AA-2026-0009 Esther Patel $274.28, to Forte Health, "Emailed 08:00".
  - The Rate and tier card reads Rate per unit $28.00, and so does her row on **People → Anaesthetists**. Review still reads $901.00 "@ $26.50/unit (locked)".
  - Brian Holt's Locked record reads "10 units @ $26.50/unit (locked)" and "2 units @ $26.50/unit (locked)", Paid to Dr Melanie Souter, Priced on Mon 23 Nov 2026. Regenerate reads "Regenerated from locked data: identical (2 lines, total $365.70)".
  - Hemi Walker's ACTIVE Booking reads "13 units x $28.00 = $364.00" (it was $344.50).
  - From a plain Reset, Brian Holt's invoice is AA-2026-0002 instead. **Reset → Confirm reset** (or jump S5 again) afterwards.
- **Worth pointing at:** Dr Whitaker's invoices from Beat 4 price at his Contract's own rate ($23.00), so his rate per unit never enters them. Dr Souter's Forte Health List prices at her own rate, so the lock shows there.
- **Handset:** on Dr Souter's Mon 23 Nov AM List, **Demo sheet → Office authorises this List**, then **More → Rate per unit**, change it to 28.00 and save. Hemi Walker's ACTIVE Booking (Tue 24 Nov AM) then reads "13 units x $28.00 = $364.00", and Brian Holt's authorised invoice keeps $26.50 a unit.

#### Optional aside: a controlled go-live load

- **Click:**
  - **Master data → Seed load** (`/admin/masters?view=seedLoad`). **Demo actions → Load sample spreadsheet**, choose **contracts.csv**, **Run**. Point at the rejected rows and their reasons, then **Load 4 valid rows**.
  - **Demo actions → Go-live data load (demo)** → **Run**, then **Master data → Go-live load** (`/admin/masters?view=goLive`).
  - **Unapprove** Laparoscopic cholecystectomy, then **Load approved data**.
- **Say:** "AA starts clean. Before go-live a developer loads AA's own controlled spreadsheets once: hospitals, surgeons, anaesthetists, RVG groups, modifiers, Parties, Contracts with their price ranges, and the calendars. Every row goes through the same checks as one added by hand, and a row that fails is listed with its reason and left out. From Solutions Plus we take names only, never numbers. After go-live the office keeps everything by hand on these screens, and every change is audited. There is no Contract upload in the first release."
- **Expected:**
  - The sample reads "contracts.csv checked: 4 rows valid, 5 rejected. Open Master data, Seed load, and press Load."
  - The rejected rows read:
    - Septoplasty: "A prepaid Contract cannot be priced from RVG units; use a fixed price."
    - Cataract, open price: "Open-price Contracts are made by the system."
    - St George's RVG: "Already in master data: edit it there."
    - Blepharoplasty, lower lids: "A prepaid Contract always bills the payer."
    - AIA Health RVG: "The holder needs a billing name and delivery details before a Contract can bill it. Add them in Parties."
  - The page also reads "A blank cell is not set; 0 means zero." and "There is no Contract upload or export in the first release; Contracts are kept by hand after the load."
  - The load reads "Loaded 4 rows on 24 Nov 2026 · 5 rejected rows were not loaded".
  - The go-live Run reads "Go-live load prepared: 14 Solutions Plus names (5 excluded as junk, 2 not approved) and 6 controlled spreadsheets. Open Master data, Go-live load."
  - **10% discount** is Excluded ("Looks like a pricing note, not an operation") and the **SP UNITS** column reads **Not used**.
  - With the one name unapproved, the load reads "Loaded 3 surgeons, 1 RVG group, 1 Party, 4 Contracts with 3 price ranges and 4 public holidays. 12 Solutions Plus entries were not loaded." With every name left approved it reads 5 Contracts with 5 price ranges and 11 not loaded.
  - **Reset → Confirm reset** to run it again.
- **Handset:** no mobile side.

#### Optional aside: an anaesthetist leaves on a last day (run it last)

- **Click:**
  - **People → Anaesthetists**, open Dr Rawiri Hughes (`/admin/people/anaesthetists/46822`). On the **Status** card press **Make inactive**.
  - Read the refusal for today. Then set **LAST DAY** to Tue 15 Dec, keep the reason **Left the practice**, and press **Make inactive**.
  - **Demo actions → Demo: pass the last day** → **Run**.
  - On Mobile, **More → Sign out**. On the sign-in screen, **Demo actions → Demo: try signing in after the last day** → **Run**.
  - **Audit**, Entity type **account**.
  - Back on Dr Hughes's page, **Make active**, then **Make active** in the sheet.
- **Say:** "When an anaesthetist leaves, the office sets their last day, and nothing changes until then. The Lists come first: the office can't set a last day while Lists stand after it, so each one is reassigned beforehand. After the last day they have no sessions, they're never offered a List, they can't sign in, and any Contract of their own is disabled. Everything they did stays in the history. If they come back, the office makes them active again, and their sessions return."
- **Expected:**
  - The sheet opens on today: "Make Dr Rawiri Hughes inactive?", "Until their last day nothing changes." and "Dr Hughes has 4 Lists after Tue 24 Nov. Reassign them first.", listing Wed 25 Nov Southern Cross AM (Mr S. Tan), Wed 25 Nov Christchurch Eye Surgery PM (Ms A. Reid), Thu 3 Dec Forte Health PM (Ms G. Lim) and Tue 15 Dec Forte Health AM (Mr V. Nand), each with **Open day**. **Make inactive** is refused while they stand.
  - With Tue 15 Dec the sheet reads "After Tue 15 Dec · No sessions, and not offered for any List. No sign-in to the anaesthetist app. They hold no Contracts of their own." The Status card then reads "Inactive from Tue 15 Dec", Last day 15 Dec 2026, Reason Left the practice, "Until then nothing changes. After it they have no sessions and cannot sign in, and their own Contracts are disabled.", with **Clear last day**.
  - The demo action reads "Clock now Wed 16 Dec: Dr Hughes is inactive. Their sessions after Tue 15 Dec are gone and their own Contracts are disabled." His page reads "Registration 46822 · Inactive" and "Inactive since 16 Dec 2026", Next Lists 0, and his History keeps all 8 past Lists.
  - The try reads "Dr Rawiri Hughes tried to sign in: refused, no longer active. The refusal is in the audit." The sign-in screen reads "No longer active · Dr Rawiri Hughes's last day has passed, so they can no longer sign in. Ask the AA office if this is wrong." and "Logged: Sign-in failed, Wed 16 Dec, 08:00".
  - Audit, account: **Sign-in failed**, Dr Rawiri Hughes, account 46822, "App Mobile (PWA)", above Dr Souter's **Signed out**.
  - The Make active sheet reads "Make Dr Rawiri Hughes active again from today? They have sessions from today and can sign in again." and "No Contracts were disabled with them." After it the card reads Active, "Active since 16 Dec 2026".
  - **Reset → Confirm reset** afterwards: the clock has moved three weeks.
- **Worth pointing at:**
  - The seed already has one leaver: Dr Oscar Reeves (60070) left the practice on Fri 20 Nov, so his card reads "Inactive since 21 Nov 2026". From a plain Reset the sign-in try refuses him. **People → Anaesthetists** reads "84 anaesthetists active", with **Inactive** and **All** beside **Active**.
  - An anaesthetist who holds a Contract of their own (Dr Souter's Rhinoplasty, for one) has it disabled by the rule after the last day, and **Make active** offers it back. Each of them holds Lists to the end of the schedule, so narrate this rather than click it.
- **Handset:** on the PWA's sign-in screen (More → **Sign out** first), **Demo sheet → Demo: try signing in after the last day** → **Run**: "Dr Oscar Reeves tried to sign in: refused, no longer active. The refusal is in the audit." The handset keeps its own data, so it refuses the seed's leaver, Dr Reeves; the screen reads "Logged: Sign-in failed, Tue 24 Nov, 08:00".

### Discovery points

- OQ-83 · The anaesthetist's sign-in experience: the sign-in screen stands in for it, marked Provisional; two-step codes, single sign-on and Face ID are still to be decided.
- OQ-143 · Surgeons without an HPI CPN or a full name: a surgeon saves and books with no HPI CPN and reads "No HPI CPN yet"; whether rows with no title or surname should load is open.
- OQ-13 · Hospital download format and fields, per hospital: the missing-NHI sheet and Mere Tipene's row come from sample files that stand in until the integration team confirms each hospital's format.
- OQ-147 · How an anaesthetist who has left sees later remittances: after the last day sign-in stops entirely; later remittances would go by email from the office, and nothing for it is built.

---

## Recommended run orders

| Scenario | Beats | Time |
|---|---:|---:|
| S1 · Booking to theatre | 7 | 9 to 10 min |
| S2 · Office day | 8 | 12 to 14 min |
| S3 · Money end to end | 7 | 11 to 13 min |
| S4 · Exceptions | 8 | 12 to 14 min |
| S5 · Compliance tour | 5 | 9 to 10 min |

| Run | Order | Time |
|---|---|---:|
| Full run | S1, S2, S3, S4, S5, each from its own Reset or jump | 53 to 61 min |
| Short run | S1 Beats 2, 3, 5 and 6; S2 Beats 1, 3, 5, 7 and 8; S3 in full; S4 Beats 1 and 2; S5 Beats 1 and 4 | 30 to 40 min |
| Money-focused | S3 in full; S4 in full; S5 Beats 4 and 5 | 28 to 32 min |

Start each scenario from **Reset → Confirm reset** or its **Jump → Confirm jump**. S5 needs its jump, which stages the audit trail and Dr Whitaker's authorised List.

Run S4's beats in order. Each beat's figures were read after the beats before it, so skipping or reordering a beat can change the invoice numbers and totals a later beat shows. If you skip, read them off the screen. Beat 8 moves the clock forward, so it always comes last. In a short run you can stop S4 after Beat 2.

## What to narrate rather than click

These are Future scope, planned for after the first release. Where the app shows one, it carries a Future scope badge.

- Automatic hospital feeds over HL7 v2 and FHIR R4, in near real time, with retries, a dead-letter queue and a mapping per hospital. The **Demo: Future scope, HL7 and FHIR** surface (`/demo/integrations`) replays sample messages for discussion. In the first release, the office imports the St George's and Southern Cross files and the rooms' PDF lists on Admin Intake.
- A settings page for the warning rules (US-13.7.4). The one setting with a screen today is the patient balance threshold (**Master data → Patient balance warning**, 90 days).
- Booking from a photo of a paper booking (US-02.4.4). **Demo actions → Photo capture (Future scope)** on a List opens a simulated photo.
- Applying hospital changes automatically, and reschedule rules (US-02.5.x, US-02.2.3). Today every row waits on Matching for the office.
- Two people editing one Booking at the same time (US-02.5.6).
- Change emails sent automatically (US-02.3.5). Today the office sends the update email by hand.
- Uploading a Contract's schedule, exporting it and loading it back (US-04.2.13). Today each Contract is edited on its own page in **Contracts**, and every change is audited.
- Pricing a procedure that is not on the Contract's schedule (US-04.3.7).

Parked and not built: the A and B split of a session (US-01.1.5) and pre-op consults in AA's room (US-03.7.4, open as OQ-138).

A negative invoice that no later payment can net against is settled outside the system.

Xero, email and the reading of PDF lists are all simulated in the browser. Nothing reads a mailbox, and no OCR is built. The office uploads each PDF with the address it came from. The hospital files are samples and their wording is illustrative demo data.

The everyday demo data is already AA's whole practice: 85 anaesthetists (84 active; Dr Oscar Reeves left on Fri 20 Nov), each with sessions across the four-month horizon, and Invoices pages through "Showing 1 to 50 of 2,570". To show a full year of invoices, use **Demo actions → Load full-scale data** on Admin Day, then **Confirm**. It builds the practice again in the browser from the same seed, with twelve months of invoices. The banner reads "Full-scale data · 85 anaesthetists · 20,092 sessions over the scheduling horizon (4 months) · 28,361 invoices in the last 12 months · generated in 3.3 s · saving paused. Reset or reload returns to the demo data." (the time varies from run to run), and Invoices pages through "Showing 1 to 50 of 28,314". Saving pauses while it is loaded; **Reset** or a reload returns to the demo data.

The handset's sign-in screen stands in for the real one. How anaesthetists sign in is still to be decided (OQ-83), and the screen says so.

## Recovery from demo accidents

- Lost your place: after a jump, the Control Panel lists the scenario's beats, each a link to its screen. Every row under **Demo actions by screen** has an **Open screen** link to where that action shows. The browser's back button retraces your steps, and **Direct URLs** above has the address for every screen.
- An Admin Booking edit has gone wrong before saving: press **Discard** in the save bar ("1 unsaved change"). Leaving with unsaved changes asks "Leave without saving?", with **Discard and leave** and **Keep editing**.
- Imported a hospital file twice: nothing new is added. The **Demo actions → Import hospital file** entry greys out its **Run** and reads "This list is already on Matching". The page's own **Import hospital file** button says "All 5 rows were already imported. Nothing new."
- Raised the sample warnings twice: the entry blocks a second press. **Run** greys out and the entry reads "Samples already raised". To take them away, use **Demo actions → Clear sample warnings** on Admin Day ("Removed 8 sample warnings. The seeded values are back."), or **Demo sheet → Clear sample warnings** on a Booking on the handset.
- A List moved by mistake: the office puts it back from Admin Day. For a List handed to a colleague, open it on the colleague's row, press **Reassign list**, choose Dr Souter and **Confirm reassignment**. For a List returned to the office, open the Draft List and press **Assign** beside her name. The Notifications pool keeps the notice for the first move; resolve it once the List is back.
- Picked the wrong Contract: in the Booking's **Contract and price** part, open the Contract box and choose again, or press **Start again** on the step rail. On the phone, tap the Contract part. A change Dr Souter makes stays marked "Awaiting office approval" and is flagged at Review, even if she picks the first Contract back.
- The NHI lookup left Slow or Unavailable: with **Add a booking** open, use **Demo actions → Hub: Available / Slow / Unavailable** and choose Available, or Reset.
- Anything else: **Reset → Confirm reset** from the top bar on any screen, or the scenario's **Jump → Confirm jump** on the Control Panel. Reset returns the clock to Tuesday 24 November 2026 · 8:00 and restarts the numbering, so invoice numbers begin at the same point every time. **Demo: Future scope, HL7 and FHIR** has its own **Reset demo data**, beside **Start live feed**. It resets the whole demo the same way.
