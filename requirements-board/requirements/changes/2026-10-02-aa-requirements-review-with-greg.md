# Requirements update, 2026-10-02 (afternoon): AA requirements review with Greg

What the afternoon update of 2026-10-02 did to the catalogue. It follows the morning run
([2026-10-02-requirements-update.md](2026-10-02-requirements-update.md)), whose changes are still
uncommitted in the same files. **How to separate the two in git:** the index (staged) holds the
morning run plus Donald's board edits of the session (12:17 to 14:00 NZDT); this run's edits are
unstaged (`git diff`, plus the untracked files listed below). The unstaged diff also holds Donald's
later board edits (14:31 onwards), which this run did not touch (see "Board edits after the
session"). `#n` means `Notes 2026-10-02 · AA requirements review with Greg #n`.

**Counts.** 0 questions answered (OQ-81 settled in part, still Open) · 2 open questions given a
meeting update (OQ-43, OQ-79) · 57 items changed (20 of them only by the session's board edit plus
the session citation) · 2 items added (US-13.5.3, US-01.4.7) · 0 retired · 0 moved · 1 link-only
edit (US-02.5.2) · 4 new questions (OQ-83 to OQ-86) · domain-model.md updated. This run moved no
status: all 37 status moves of the session were made on the board by Donald and stand; the two new
stories start at Verify.

## 1. Inputs

- Note: [notes/2026-10-02-aa-requirements-review-with-greg.md](../notes/2026-10-02-aa-requirements-review-with-greg.md) (points #1 to #95)
- Transcript: [AA Meeting with Greg Oct 2 B.md](../artifacts/files/AA%20Meeting%20with%20Greg%20Oct%202%20B.md) (ends mid-sentence at the US-02.1.5 discussion)
- Board edits during the session, 12:17 to 14:00 NZDT, from `requirements-board/.history` (edits
  tagged `board`): 37 status moves and text edits on 16 items (EP-13, EP-01, start of EP-02). The
  12:17 to 12:59 edits are also listed in the morning log as "(board, Donald)"; here they are this
  session's evidence (note #4 to #36).
- Donald's two typed requirements: the login experience is to be defined (#2); anaesthetists move a
  List or a single Booking (#3).
- Link pass: link-requirements over EP-01, EP-02 and EP-13; 8 links applied across 8 items, 74
  skipped (`requirements-board/.links/links-report.md`).
- Not an input: OQ-82 ("Do we want to automate the change emails", affects US-02.3.3, owner "Donald
  to ask AA") was created on the board by Donald at 14:40, after the session. This run did not touch
  it.

## 2. Questions answered

No question was answered on the board in the session. Status before was Open in every case.

| Question | Title | What changed | Status | Source |
| --- | --- | --- | --- | --- |
| [OQ-81](../questions/OQ-81.md) | Which calendar wins when Lists are generated | Partly settled in the room. New "## Meeting update": part 1, the order, is the anaesthetist's availability first, then the surgeons' recurring bookings (Greg: "Yes"); part 2, a recurring booking landing on an unavailable Slot becomes a Draft List for the office, not a flagged List (reverses the question's recommendation and Greg's morning view); part 3, short-notice sickness, not discussed. `affects` adds FT-01.6 (critic fix). Carried into US-01.1.1, US-01.3.2, US-01.5.2, US-01.5.4, FT-01.6. | Open (unchanged) | #1 |
| [OQ-43](../questions/OQ-43.md) | What the blacklist warning shows an anaesthetist | New "## Meeting update": Greg would design for two lists ("double view", "more flexible"), since a surgeon may refuse an anaesthetist too; whether each side learns of the other's entry deferred ("Implementation detail"); Donald still wants Ben's view on sensitivity. | Open (unchanged) | #25 #44 #66 |
| [OQ-79](../questions/OQ-79.md) | What posts to the shared notification pool, and how long notices last | New "## Meeting update" on part 2 (expiry): the pool is paginated (Donald, tentative); Greg: it need only hold what has not been seen, "The rest of it's just a log file", archive rules perhaps later. | Open (unchanged) | #18 #48 |

## 3. Items changed, added, retired or moved

Status is at `HEAD` (`b342a7d`) → now. "(board hh:mm)" means Donald moved it on the board in the
session; "(morning)" means the morning run did. This run moved no status. **Board + citation** in
the What changed column marks an item whose only change is the session's board edit plus the
session citation in `sources`. No item was retired or moved to another parent. The Source column
gives note points.

### EP-01 · Schedule canvas, Slots and Lists

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-01](../stories/EP-01.md) | Schedule canvas, Slots and Lists | Changed | Confirmed (unchanged) | Board (12:59): an assigned List belongs to "one surgeon, one anaesthetist and one hospital". Run: "a rolling four-month schedule" becomes "a rolling schedule, four months ahead in current practice", to match FT-01.1. | #19 #20 #82 #92 |
| [FT-01.1](../stories/FT-01.1.md) | Rolling canvas generation | Changed | Proposed (unchanged) | Board (13:02): "Four months in the current practice, but the system should be flexible enough to have any number of months." Run, Notes: four months is Vanessa's practice, stretched over Christmas (why four is in doubt); changing the length is rare (shorter drops days, longer fills them); very long horizons may hit performance limits, not a worry now. | #20 #82 |
| [US-01.1.1](../stories/US-01.1.1.md) | Two Slots per anaesthetist per day | Changed | Proposed → Confirmed (morning) | OQ-81 parts 1 and 2: the generation run paints the anaesthetist's own calendar first, then surgeons' recurring bookings; "order not settled (OQ-81)" removed; a recurring booking on an already unavailable Slot becomes a Draft List for the office. Horizon wording "four months in current practice". | #1 #20 #82 |
| [US-01.1.2](../stories/US-01.1.2.md) | Horizon rolls forward daily | Changed | Proposed → Confirmed (board 13:03) | "extends the four-month horizon" becomes "extends the horizon (four months in current practice)". | #21 #82 |
| [US-01.1.3](../stories/US-01.1.3.md) | New anaesthetist gets a populated canvas | Changed | Proposed → Confirmed (board 13:04) | "across the four-month horizon" becomes "across the horizon (four months in current practice)". | #21 #82 |
| [US-01.1.4](../stories/US-01.1.4.md) | Slot default times | Changed | Proposed → Confirmed (board 13:06) | Notes: a Slot keeps its standard default shape on screen even with one Booking (Greg: "I agree. Even if there's just one booking in it."). Link pass: related US-01.1.1. | #21 #51 |
| [FT-01.2](../stories/FT-01.2.md) | Slot availability status | Changed | Verify → Confirmed (board 13:08) | Board + citation. | #22 |
| [US-01.2.1](../stories/US-01.2.1.md) | Anaesthetist sets half-day availability | Changed | Verify → Confirmed (board 13:14) | Notes: Greg: several kinds of unavailable (unavailable, public hospital, annual leave), "all of which have the same effect... it's for information". | #22 #56 |
| [US-01.2.2](../stories/US-01.2.2.md) | Slot status master data | Changed | Verify → Confirmed (board 13:13) | Notes: Greg endorsed statuses as master data (an ERP's enum statuses "caused horrendous problems"). | #22 #55 |
| [FT-01.3](../stories/FT-01.3.md) | List assignment | Changed | Verify → Confirmed (board 13:23) | Board + citation. | #23 |
| [US-01.3.2](../stories/US-01.3.2.md) | Recurring bookings drive most assignments | Changed | Proposed → Verify (board 13:25) | New AC: a recurring booking whose Slot is already marked unavailable creates a Draft List with no anaesthetist. Body horizon "four months in current practice" (reviewer fix). Notes: calendar painted before recurring bookings (OQ-81); Donald doubts "most" (title unchanged); surgeon and anaesthetist keep their own blockouts, "the shared view is the list"; who may edit a recurring arrangement not settled. | #1 #23 #54 #82 #91 |
| [US-01.3.3](../stories/US-01.3.3.md) | Manual List assignment | Changed | Proposed → Confirmed (board 13:28) | Notes (Donald's requested note): Lists can be created by finding an anaesthetist on a day, or as a Draft List assigned later; may be removed once another story covers it; Greg: "Not how they work at the moment, but they could". Link pass: "availability view" links US-01.4.2. | #23 #58 |
| [US-01.3.5](../stories/US-01.3.5.md) | Blacklist warning when assigning a List | Changed | Proposed → Confirmed (board 13:29) | Board + citation. | #23 |
| [FT-01.4](../stories/FT-01.4.md) | List reassignment and locum search | Changed | Proposed → Confirmed (board 13:30) | "A List can move..." becomes "A List, or a single Booking from it, can move...". | #3 #24 |
| [US-01.4.1](../stories/US-01.4.1.md) | Reassign a List with its bookings | Changed | Proposed → Confirmed (board 13:30) | Notes: what the vacated Slot shows after a List moves is OQ-84 (the Technical discussion's reading is the RFP response's). | #3 #24 #56 |
| [US-01.4.2](../stories/US-01.4.2.md) | Availability finder | Changed | Proposed → Confirmed (board 13:31) | Board + citation. | #24 |
| [US-01.4.3](../stories/US-01.4.3.md) | Anaesthetist moves their own List | Changed | Verify → Confirmed (board 13:31) | Adds a pointer to moving a single Booking (US-01.4.7). Notes: the Slot status left behind is OQ-84 (the prototype asks). "Ben is still to confirm" left as is (owner check). Link pass: "shared notification pool" in the ACs links FT-13.8. | #3 #24 #56 |
| [US-01.4.5](../stories/US-01.4.5.md) | Blacklist warning when an anaesthetist reassigns their own List | Changed | Proposed → Verify (board 13:32) | Board + citation. Link pass: "shared notification pool" in Notes links FT-13.8. | #25 |
| [US-01.4.6](../stories/US-01.4.6.md) | The List's anaesthetist did its procedures | Changed | Verify (unchanged) | Board + citation. Board (13:33): "(before the procedure)" inserted after "moved to that anaesthetist's List". | #26 |
| [US-01.4.7](../stories/US-01.4.7.md) | Anaesthetist moves a single Booking | Added | Verify | New story under FT-01.4 (order 6), Donald's typed requirement. An anaesthetist can move one Booking to a colleague as well as a whole List; receiver found by searching by anaesthetist; a receiver on leave or unavailable sets their own Slot available first (their acceptance); two ACs. Notes: experience not defined (OQ-85); payable and prepayment follow the Booking (US-01.4.6, linked in text, so no `related` entry); Greg's favour List not built now. | #3 #50 #68 #76 |
| [FT-01.5](../stories/FT-01.5.md) | Hospital holiday calendar and conflicts | Changed | Proposed → Confirmed (board 13:34) | Board + citation. | #27 |
| [US-01.5.1](../stories/US-01.5.1.md) | Hospital holiday calendar | Changed | Proposed → Confirmed (board 13:34) | Board + citation. | #27 |
| [US-01.5.2](../stories/US-01.5.2.md) | Conflict flagging | Changed | Verify (unchanged) | Board (13:38) NOTE ("We now think this is wrong, and the new recurring list becomes a draft") folded into the text and removed: a recurring booking landing on an unavailable Slot is not flagged, its List is created as a Draft List; AC 3 replaced to match; the morning's accept-and-flag note replaced by the requirements review's settlement (OQ-81); sickness stays open (part 3). | #1 #28 #75 |
| [US-01.5.4](../stories/US-01.5.4.md) | Availability conflict dashboard | Changed | Proposed (unchanged) | Rewritten at Donald's request: a List whose anaesthetist is unavailable goes back to the office as a Draft List (when returned rather than assigned to a colleague, US-01.5.5, reviewer fix; or when a recurring booking lands on an unavailable Slot), worked from the Draft List view; the dashboard keeps hospital closures and Bookings on an unavailable anaesthetist's List; sickness to Notes (OQ-81 part 3). AC 1 narrowed; new AC (recurring booking shows as a Draft List). Notes: Greg: "Becomes its own to do list". | #1 #59 |
| [US-01.5.5](../stories/US-01.5.5.md) | Mark unavailable while holding a List | Changed | new → Confirmed (morning) | Citation only: agreed in the room, no board edit. | #60 |
| [FT-01.6](../stories/FT-01.6.md) | Draft Lists | Changed | Verify → Confirmed (morning) | Bullets 2 and 3 rewritten (Greg: "It just needs to say moves the list to the office"): an anaesthetist moves a List to the office, including marking its Slot unavailable; a surgeon's recurring booking lands on an unavailable Slot (OQ-81). Notes: anaesthetists pulling Draft Lists themselves is OQ-86, an office job for now. | #1 #61 #62 |
| [US-01.6.1](../stories/US-01.6.1.md) | Create a Draft List | Changed | Verify → Confirmed (board 13:45) | Notes: Greg asked what "enters the matching process" means (Donald: the office's matching today); Donald thinks a draft might lack some attributes, Greg: they stay required. | #19 #29 #83 |
| [US-01.6.2](../stories/US-01.6.2.md) | See Draft Lists flagged in the Admin App | Changed | Proposed → Confirmed (morning) | Board + citation. Board (13:48): new AC "Sorting" (ascending date order). | #30 |
| [US-01.6.3](../stories/US-01.6.3.md) | Assign a Draft List to an anaesthetist | Changed | Verify → Confirmed (board 13:52) | Board (13:49): the admin chooses only the anaesthetist; the AM or PM Slot is predefined on the Draft List. Run, Notes: an admin opening a Draft List sees everyone potentially available (Greg: "Absolutely. Great."). | #31 #32 #93 |
| [US-01.6.4](../stories/US-01.6.4.md) | Remove or re-date an unfilled Draft List | Changed | Verify → Confirmed (board 13:53) | Board + citation. | #32 |

### EP-02 · Booking intake and change handling

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-02](../stories/EP-02.md) | Booking intake and change handling | Changed | Confirmed (unchanged) | Board (13:54) slash form "applied to the list/booking" resolved: a new Booking goes onto its List, an update edits the existing Booking (Donald). First sentence still says "a hospital download". | #33 #79 |
| [US-02.1.1](../stories/US-02.1.1.md) | Import hospital bookings | Retitled, changed | Confirmed (unchanged) | Retitled from "Import a hospital booking download" (Greg: "just import"). Board (13:56, 13:57) "The system / Admins import" resolved to "The system imports hospital bookings, however each hospital provides them." Notes: how each hospital provides them (download only for HL7 v2; FHIR is REST) is for the integration team (OQ-13). | #34 #79 |
| [US-02.1.2](../stories/US-02.1.2.md) | Match rows to Lists and Bookings | Changed | Confirmed (unchanged) | Board (13:57) split bullet given its verb ("create a Draft List when nobody is assigned yet"); "imported from a hospital download" kept (Donald: "leave it as it is"). Notes: Greg's "why is this a manual task"; Donald: the first release keeps an import gate, as Ben said; Greg: "Okay". | #35 #80 |
| [US-02.1.3](../stories/US-02.1.3.md) | Show differences on match | Changed | Proposed → Confirmed (board 14:00) | Notes: an update to a matched Booking still goes through this approval; for a row with no match the admin effectively accepts it as a new record (reviewer wording); automating after the first match "wouldn't take too much", left for now. | #36 |
| [US-02.1.5](../stories/US-02.1.5.md) | Automatic sync from St George's and Southern Cross | Changed | Proposed (unchanged) | Trimmed at Donald's request ("remove all of the faff"): St George's and Southern Cross are in scope, technical particulars to come; pull bullets, last-sync sentence and the Scheduled pull, Pull on open, Manual sync and Last sync ACs removed; "No silent apply" kept; cadence dropped from Technical discussion. Notes: Donald called the detail "a bit overkill"; Greg: "Let's leave it out". | #65 |
| [US-02.5.2](../stories/US-02.5.2.md) | Apply a reschedule | Link only | Confirmed → Verify (board 14:55, after the session) | Link pass: "draft list" in Donald's post-session text links FT-01.6. Not otherwise touched by this run. | link pass |

### EP-13 · Admin oversight and master data

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [FT-13.1](../stories/FT-13.1.md) | Schedule dashboard | Changed | Proposed → Confirmed (board 12:17) | Board + citation. | #4 |
| [US-13.1.1](../stories/US-13.1.1.md) | One-day dashboard | Changed | Proposed → Confirmed (board 12:18) | Board + citation. | #4 |
| [US-13.1.2](../stories/US-13.1.2.md) | Review future days in the day view | Retitled, changed | Proposed (unchanged) | Retitled from "Pre-op review of tomorrow" at Donald's spoken request: admins review any future day in the same day view, as far ahead as Slots exist (tomorrow the usual case); "no tracked state" kept. Notes: why it said tomorrow; Donald called it 13.1.3. | #37 |
| [US-13.2.1](../stories/US-13.2.1.md) | Ledger balance views | Changed | Confirmed (unchanged) | Notes: "what is owing to them, and what they owe" unclear on who owes whom; Greg: the office should see one anaesthetist's ledger is out of balance ("It's just a list"); screen AC to come with the prototype. Link pass: "receivables outstanding" links US-08.3.1. | #38 #70 |
| [US-13.2.2](../stories/US-13.2.2.md) | Per-patient balance | Changed | Confirmed (unchanged) | Board (12:24): "This is attached to the patient, even if it's a guardian who is going to pay." Run, Notes: Greg: balances are always the patient's ("a patient-centric view"), insurance claims too. | #5 #85 |
| [FT-13.3](../stories/FT-13.3.md) | Billing flow monitoring | Changed | Proposed → Confirmed (board 12:25) | Board + citation. | #6 |
| [US-13.3.1](../stories/US-13.3.1.md) | Processing monitor | Changed | Proposed → Confirmed (board 12:27) | Board (12:27): large list, restyle with standard sorting and filtering. Run, Notes: grouped by anaesthetist, where authorised Lists are approved; Greg's problems-only and one-or-all-anaesthetists filters not settled. | #7 #70 |
| [US-13.3.2](../stories/US-13.3.2.md) | Manual intervention | Changed | Proposed → Confirmed (board 12:28) | Board + citation. | #8 |
| [US-13.4.1](../stories/US-13.4.1.md) | Maintain reference tables | Changed | Confirmed (unchanged) | Notes: Greg: "I wouldn't call those reference tables. Some of those are definitely master data"; developers to sort out. Title unchanged (owner check). | #39 #86 |
| [US-13.4.2](../stories/US-13.4.2.md) | Clean-cut start, not a full migration | Changed | Proposed → Confirmed (board 12:30) | Board + citation. | #9 |
| [US-13.4.3](../stories/US-13.4.3.md) | Reference data loaded from controlled spreadsheets | Changed | Proposed (unchanged) | Board (12:35) kept "fixed fee schedules and any Contracts (Could be RVG, fixed or other style)"; run drops "fixed fee schedules" on Greg's and Donald's words, leaving "any Contracts (Could be RVG, fixed or other style)". Notes: inference sentence removed; Greg's reason; calendars from spreadsheets too, for repeatable test loads; whether calendars join the list unclear. | #10 #40 #77 |
| [US-13.5.1](../stories/US-13.5.1.md) | Role-based access | Changed | Proposed → Confirmed (board 12:36) | Notes: Greg: "a very small number of roles"; this story is permissions, sign-in is US-13.5.3. | #11 #41 |
| [US-13.5.2](../stories/US-13.5.2.md) | Audit trail of all actions | Changed | Proposed → Confirmed (board 12:39) | Board (12:39) removed "disbursements"; run replaces "payments" with "credit notes" (Greg: "invoices and credit notes, but not disbursements or payment... Or receipts... It's done in Xero"). Notes: audit depth for developers, storage cost in mind. Link pass: "credit notes" links US-08.6.2. | #12 #42 #78 |
| [US-13.5.3](../stories/US-13.5.3.md) | Sign in to the anaesthetist app | Added | Verify | New story under FT-13.5 (order 3), Donald's typed requirement. Anaesthetists sign in with an account login, PWA first; Auth0 (Stratos' default) handles passwords and MFA, higher tiers allow single sign-on; biometrics likely native only; platforms first, then the experience. One AC. Notes: nothing decided beyond an account login (OQ-83); FT-13.5's RFP-response proposal not confirmed. | #2 #41 #68 #84 |
| [FT-13.6](../stories/FT-13.6.md) | Surgeons and surgeons' rooms | Changed | Proposed → Confirmed (board 12:40) | Board + citation. | #13 |
| [US-13.6.1](../stories/US-13.6.1.md) | Surgeons' rooms master record | Changed | Proposed → Confirmed (board 12:40) | Notes: Greg's picture of the room record (office contacts, its surgeons as children, or an actor-and-role relationship). | #13 #43 |
| [US-13.6.2](../stories/US-13.6.2.md) | Surgeon profile | Changed | Proposed → Confirmed (board 12:41) | Board + citation. | #13 |
| [US-13.6.3](../stories/US-13.6.3.md) | Blacklist of anaesthetist and surgeon pairings | Changed | Proposed (unchanged) | Notes: Greg would design for two lists; who learns of the other's entry deferred; Ben's view on sensitivity wanted (OQ-43). Accepted in the room, status left (owner check). | #44 #66 #87 |
| [US-13.7.1](../stories/US-13.7.1.md) | Warning routine | Changed | Verify → Confirmed (board 12:44) | Board + citation. | #14 |
| [US-13.7.2](../stories/US-13.7.2.md) | Warnings on the dashboard to-do list | Changed | Verify → Confirmed (board 12:45) | Notes: Greg asked whether clearing from the to-do list clears the Booking's warning; "Don't worry about it". | #14 #46 |
| [US-13.7.3](../stories/US-13.7.3.md) | Warning flag on a Booking | Changed | Verify → Confirmed (board 12:49) | Board (12:47, 12:48): "much like the prototype" example, warning visually clear on opening, confirm step and tap removed. Run aligns the rest: "on on" typo and missing blank line fixed; AC "Confirm step" removed; "Flag" reworded without the tap clause ("either app" kept); new ACs "Visible on opening" and "No confirm step"; Notes: confirm step dropped (Greg: "we don't need a pop up"), office sees the warning too. | #15 #16 #73 |
| [FT-13.8](../stories/FT-13.8.md) | Shared notification pool | Changed | new → Confirmed (board 12:50) | Board + citation. | #17 |
| [US-13.8.1](../stories/US-13.8.1.md) | See the team's notifications | Changed | new → Confirmed (board 12:50) | Board's stray "Paginate" line folded into the text: staff "page back through older notifications". Morning quote "Just let them scroll" moved to Notes; Donald "It'll paginate"; Greg: the rest is "just a log file", archive rules later; expiry and "actioned" stay OQ-79. No AC (paging tentative). | #18 #48 #74 |
| [US-13.8.2](../stories/US-13.8.2.md) | Notify the team when an anaesthetist moves a List | Changed | new → Verify (morning) | Notes: Greg: anaesthetists must move a single Booking too (US-01.4.7); whether that move notifies is OQ-85. Body and ACs unchanged. Link pass: "shared pool" links US-13.8.1. | #3 #76 |

### Links applied by the link pass (8)

US-01.1.4 related US-01.1.1 · US-01.3.3 "availability view" → US-01.4.2 · US-01.4.3 "shared
notification pool" (ACs) → FT-13.8 · US-01.4.5 "shared notification pool" (Notes) → FT-13.8 ·
US-02.5.2 "draft list" → FT-01.6 · US-13.2.1 "receivables outstanding" → US-08.3.1 · US-13.5.2
"credit notes" → US-08.6.2 · US-13.8.2 "shared pool" → US-13.8.1. All but US-02.5.2 are changed
items above.

### domain-model.md

[domain-model.md](../domain-model.md): header adds the afternoon review.

- **Slots, Lists, Draft Lists** (section 1 rows and the Slot, List and Draft List section): horizon
  "a rolling schedule, four months ahead in current practice", length a rarely changed setting;
  generation order settled (anaesthetist's calendar, then recurring bookings); a recurring booking on
  an unavailable Slot becomes a Draft List (only a Booking is accepted and flagged); Draft List
  wording follows FT-01.6, "or withdraws" dropped; only short-notice sickness stays open (OQ-81).
  "Creates its List four months ahead" becomes "at the far end of the rolling schedule".
- **Moves:** an anaesthetist can move a single Booking to a colleague, the receiver setting
  themselves available first (OQ-85; vacated Slot status OQ-84).
- **Warnings:** visually clear on opening, much like the prototype; no confirm step on submit.
- **Reference data:** "Contracts (RVG, fixed or other style)" replaces "fixed fee schedules and
  Contract overrides".
- **Carries forward unchanged** line gains an exception: audit covers invoices and credit notes, not
  disbursements, payments or receipts (done in Xero), depth for developers; sign-in is an account
  login for the anaesthetist PWA, Auth0 is Stratos' default, the rest open (OQ-83). Reviewer fixes:
  "Auth0 by default" softened; audit wording checked against US-13.5.2.
- **Glossary:** Slot "(four months ahead in current practice)".

### New files (untracked)

`notes/2026-10-02-aa-requirements-review-with-greg.md`, `requirements/US-01.4.7.md`,
`requirements/US-13.5.3.md`, `questions/OQ-83.md` to `OQ-86.md`, this log. (`questions/OQ-82.md` is
also untracked; it is Donald's board question, not this run's.)

### Board edits after the session (not processed by this run)

Donald kept editing the board after the recording ended; these are in the unstaged diff but are not
from this note and were not reviewed: FT-02.3, US-02.3.1, US-02.3.2, US-02.3.4, US-02.5.4,
US-05.1.4, US-05.1.5, US-05.2.1, FT-05.2 to Confirmed; US-05.1.1 and US-05.1.6 Verify to Confirmed;
US-02.5.2 Confirmed to Verify; US-04.1.1 to Verify (via Confirmed); text on US-02.5.2, US-02.5.4,
US-05.1.1 (description and AC) and US-05.1.4 (retitled "Default modifiers"); US-02.2.1, US-02.5.1,
US-02.5.2, US-02.5.3, US-02.5.4, US-02.5.6 moved to the "Future Work" swimlane; OQ-82 created.
14:31 to 15:34 NZDT at the time of writing.

## 4. New questions

All Open, created by the questions agent from the change list.

| Question | Title | Owner | Affects |
| --- | --- | --- | --- |
| [OQ-83](../questions/OQ-83.md) | The anaesthetist's sign-in experience | Donald | US-13.5.3, FT-13.5 |
| [OQ-84](../questions/OQ-84.md) | What a Slot shows after its List is moved away | Donald | US-01.4.3, US-01.4.1, US-01.2.1 |
| [OQ-85](../questions/OQ-85.md) | How an anaesthetist moves a single Booking | Donald | US-01.4.7, US-13.8.2, US-01.4.5 |
| [OQ-86](../questions/OQ-86.md) | Should anaesthetists browse and pull Draft Lists themselves | Donald to ask Ben | FT-01.6, US-01.6.3 |

Also on the board, not from this run: [OQ-82](../questions/OQ-82.md) "Do we want to
automate the change emails" (affects US-02.3.3, owner "Donald to ask AA"), created by Donald at
14:40, after the session.

## 5. For Donald to check

**Conflicts between your board edits and the morning run (board version kept in every case).**

| Item | Morning run | Board (session) |
| --- | --- | --- |
| [FT-01.2](../stories/FT-01.2.md) | Kept Verify: final status values still to define with AA's users (OQ-64) | Confirmed (13:08) |
| [US-01.2.1](../stories/US-01.2.1.md) | Held at Verify on the owner decision for OQ-64 part 4; final values with AA's users | Confirmed (13:14) |
| [US-01.2.2](../stories/US-01.2.2.md) | Verify; final values with Vanessa and the users | Confirmed (13:13) |
| [US-01.4.3](../stories/US-01.4.3.md) | Verify; "Ben is still to confirm" (OQ-65 owner) | Confirmed (13:31); the Ben sentence is still in the text |
| [US-01.5.2](../stories/US-01.5.2.md) | New AC: a recurring booking on an unavailable Slot is accepted and flagged (Greg's tentative view) | NOTE (13:38): "we now think this is wrong", it becomes a Draft List. This run rewrote the item to the board's view and removed the NOTE |
| [US-01.1.1](../stories/US-01.1.1.md), [EP-01](../stories/EP-01.md) | Slots stored "across the four months"; "a rolling four-month schedule" | FT-01.1 (13:02): "any number of months". This run reconciled to "four months in current practice" |
| [US-13.7.1](../stories/US-13.7.1.md) | Verify (change list); kinds and strengths not yet set | Confirmed (12:44) |
| [US-13.7.2](../stories/US-13.7.2.md) | Verify; clearing semantics open | Confirmed (12:45) |
| [US-13.7.3](../stories/US-13.7.3.md) | ACs and Notes described the confirm step and tap | Description drops both (12:47, 12:48), Confirmed (12:49). This run aligned ACs and Notes to the board |
| [FT-13.8](../stories/FT-13.8.md), [US-13.8.1](../stories/US-13.8.1.md) | Created at Verify; lifecycle open (OQ-79) | Confirmed (12:50); "Paginate" line added to US-13.8.1 (folded into the text by this run) |

**From the change list (forOwner).**

1. **Spoken vs board status (#81), board kept:** US-01.6.3 Confirmed though you said "Yep, verify"
   (may mean verified); US-01.3.3 Confirmed though you asked for a note you said may be deleted;
   US-02.1.3 Confirmed at 14:00 as the recording ends.
2. **Board confirmations ahead of the morning holds (#72), board kept:** see the table above.
3. **US-13.5.2:** "payments" replaced by "credit notes" on Greg's words, although your board edit
   kept "payments" when confirming it. Keep the change?
4. **US-13.7.3:** the tap clause was dropped from AC "Flag" but "either app" kept; confirm. Example
   "Fitzgerald, Emma on July 21st PM" vs the transcript's "Ferguson and Emma" not checked against the
   prototype seed.
5. **US-01.5.2 and US-01.5.4:** your NOTE was folded into US-01.5.2's body and removed. US-01.5.4 now
   sends Lists of unavailable anaesthetists to Draft Lists, leaving hospital closures and Bookings on
   an unavailable anaesthetist's List as conflicts; sickness still OQ-81 part 3.
6. **US-01.6.3** still lets an admin assign a Draft List onto an unavailable Slot with a soft warning,
   while the room agreed the office should not assign work to someone marked unavailable without
   them knowing (#3, US-01.4.7). Align?
7. **New items and questions:** US-01.4.7 created at Verify (agreed, experience undefined); OQ-85 for
   that experience alongside the requested OQ-84; OQ-86 for Ben on your spoken request (#62).
8. **US-02.1.5:** the last-sync display and its AC went with the pull triggers, reading "remove all of
   the faff" broadly. Restore the last-sync line?
9. **Accepted in the room, status unchanged on the board:** FT-13.4 (Proposed; your "Confirmed" may
   have meant US-13.4.1), US-13.6.3 (Proposed; Greg "Yeah, good"), FT-13.7 (Verify; Greg "Yep"),
   FT-02.1 (Verify; read with no objection). Move any?
10. **US-01.6.1:** "we can go ahead and delete this piece of text" (L805): which text is unclear;
    nothing deleted.
11. **US-13.4.1** title "Maintain reference tables": Greg would call them master data. Retitle?
12. **US-13.2.1:** "what is owing to them, and what they owe" left as is; clarify who owes whom when
    the screen AC is written.
13. **Horizon (#82):** why it is four months is in doubt (Vanessa's practice stretched at Christmas,
    or Christmas as the reason). EP-01 and US-01.1.1 to US-01.1.3 now say "four months in current
    practice".
14. **US-13.8.1:** "It'll paginate" was tentative, so paging is in the text but has no AC.

**From the reviewers and the critic (open).**

15. **US-01.5.4 vs US-01.6.3:** the dashboard still lists "a Booking landing on a List whose
    anaesthetist is unavailable", a case that only arises through US-01.6.3's soft-warning
    assignment (item 6). US-01.5.2 also says a Booking "lands on a Slot", where a Booking lands on a
    List. Settle with item 6.
16. **"Download" wording:** EP-02's first sentence ("a hospital download"), FT-02.1's title and text
    ("Hospital booking download") and US-02.1.4's body still say download, while US-02.1.1 now says
    import. US-02.1.2's "imported from a hospital download" kept on purpose. Bring in line? The
    US-02.1.5 title ("Automatic sync...") also still suggests the removed mechanism.
17. **US-01.6.3 AC "Becomes a List"** still says "exactly one surgeon and one hospital"; EP-01 now
    says "one surgeon, one anaesthetist and one hospital".
18. **US-01.3.2 Notes** do not record Greg's question (#54) on how a surgeon's holiday six months out
    is flagged.
19. **"Four months" outside EP-01:** US-03.1.6, US-15.0.4 and OQ-17 still say it plainly; FT-01.1's
    first sentence ("four months ahead") is board wording and stays.
20. **OQ-81's Recommendation** still says create-and-flag, which its Meeting update now reverses.
21. **US-01.1.1** still introduces the generation run "as Greg described it", though step 2 is now
    Donald's order with Greg's agreement. Wording nit.
22. **One-way question links (optional tidy-up):** OQ-83 lists FT-13.5, OQ-84 US-01.2.1, OQ-85
    US-01.4.5 and OQ-86 US-01.6.3 in `affects`, but those items do not mention the question.
    `affects` is enough for the link.
23. **"## Meeting update"** is now used on OQ-43, OQ-79 and OQ-81 as well as the morning's OQ-60,
    OQ-61 and OQ-76; SCHEMA still defines no such heading (morning log, item 5).

Fixed by the critic: OQ-81 `affects` now includes FT-01.6, which cites it.

## 6. Points with no requirement change

| Point | Why no item changed |
| --- | --- |
| OQ-81 | Parts 1 and 2 are in its Meeting update and carried into US-01.1.1, US-01.3.2, US-01.5.2, US-01.5.4 and FT-01.6; stays Open because part 3 (sickness) was not discussed. |
| #36 (US-02.1.4) | Read and accepted; already Confirmed. |
| #45 | Warnings are not notifications: FT-13.7's Notes already send notices to the shared pool. |
| #47 | US-13.7.4 already says thresholds stay fixed (a constant) until AA asks. |
| #49 | US-01.3.2 already says a recurring booking makes a List with no Bookings. |
| #50 | The favour List was "not built now"; only a Note on US-01.4.7 and part of OQ-85. |
| #52 | Prototype List colours: "made-up stuff", a prototype matter. |
| #53 | No change made in the room; US-01.2.3's "stays meaningful" accepted though disliked. |
| #56 (US-01.5.3) | Recorded on US-01.2.1 instead; US-01.5.3 unchanged. |
| #57 | Reviews with Vanessa and anaesthetists are a process step. |
| #63 | Which text Donald meant to delete from US-01.6.1 is unclear (section 5, item 10). |
| #64, #95 | Showing the surgeon's regulars first was declined for now. |
| #66 to #69 | Follow-ups, each carried by its own change, the OQ-43 or OQ-79 update, or a new question; #67's spreadsheet calendars noted on US-13.4.3. |
| #70 | Later with the prototype; recorded as Notes on US-13.2.1 and US-13.3.1, no AC yet. |
| #71 | OQ-80 left for later with Greg; no evidence to add. |
| #72, #81 | Board statuses kept although they run ahead of earlier holds or the spoken words (section 5). |
| #85 | Each sub-point handled under its own point; the unclear blacklist name and the transcript ending mid-sentence are not requirements. |
| #86 to #89 | Accepted in the room, board status unchanged on FT-13.4, US-13.6.3, FT-13.7 and FT-02.1 (section 5, item 9; US-13.6.3's Notes record the acceptance). |
| #90 | US-13.8.2's open question left unanswered; it links OQ-65, already Answered. |
| #92 | One anaesthetist per Slot per day: carried by the EP-01 board edit. |
| #94 | The "Draft" label in the prototype is a prototype matter. |
