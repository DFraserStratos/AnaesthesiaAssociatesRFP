# AA Prototype · Build plan roadmap

The requirements catch-up (phases 14 to 44 and the UI unification track U1 to U7, archived in
`docs/archive/prototype-build/`) left the prototype matching the requirements catalogue at commit
`64b3dff7` (24 November 2026). This plan started empty there. Phases come only from requirement changes
committed after it: `/update-requirements` records a change, the owner commits it, and
`/update-build-plan` grades only the changed items and appends phases here, numbered upward from 45.
Most are expected to be UI and UX improvements. Routine fixes and polish are not phases: they use the
`app-change` skill. Neither phases nor routine changes touch the screenshots or the demo guide: the
owner brings both in step with one sweep (`/sweep`, last run in `docs/SWEEP.md`).

The plan is now planned against catalogue commit `67cba2c` (25 November 2026). It holds **thirteen
phases, 45 to 57**, from two changes of 25 November, every changed item at Verify, not yet seen by AA.

- **The Contracts section (45 to 49).** Donald's decisions that give Contracts their own section of
  the Admin app, with a page for each Contract, a grouped catalogue, Parties and Funding tags as tabs,
  and Replace a Contract from a date (change log
  `requirements-board/requirements/changes/2026-11-25-donald-contracts-section.md`, note AR-69). The
  Contract model is unchanged; how the office finds, reads and changes Contracts changes. 12 units,
  with the data-model deltas DM-01 to DM-04. 45 is DONE on `master`; 46 to 49 are building in two lanes.
- **The People section (50 to 57).** Anaesthetists, surgeons, specialties and patients become one
  People section of the Admin app where Patients was. Every record gets a page in the Contract page's
  pattern, surgeon groups are cut, the priority tier is edited in a card with the rate, Waiting for
  NHI moves to Intake, and an anaesthetist can be made inactive from a chosen last day (change log
  `requirements-board/requirements/changes/2026-11-25-donald-people-section.md`, note AR-70). The gap
  analysis graded its 17 items (8 Contradicts, 7 Partial, 2 Grouping) and found six data-model deltas
  (DM-05 to DM-10).

In all, **31 units: 27 planned in phases, 4 parked** (DM-01 to DM-04, which Phase 49 is building now; see Parked). The layout references are design pages, not catalogue
artifacts (cite the paths): `docs/explorations/contracts-section.html` (sections `#map`, `#catalogue`,
`#record`, `#updating`, `#new`, `#parties`, `#tagstab`; the first pass is `contracts-ideas.html`) for
the Contracts phases, and `docs/explorations/people-section.html` (sections `#map`, `#nav`, `#groups`,
`#patients`, `#tier`, `#inactive`, `#changes`; the first pass is `people-ideas.html`) for the People
phases.

Settled prototype rulings are in `docs/DECISIONS.md`; known open work is in `docs/BACKLOG.md`. The
archived catch-up ROADMAP, PROGRESS and phase docs are history: read them as leads, never as rules.

## Owner decisions

These readings shape what a phase delivers. Rows are numbered from D90, above the archived catch-up's
D1 to D89, which code comments, tests and `docs/BACKLOG.md` still cite. The 2026-11-25 update
(catalogue `5f87781`) adds **D90 and D91**, the two new open questions that gate an unbuilt phase,
each with the default its phases build (none is answered: build without them), and **D92 to D96**, the
owner's directives for the Contracts section. OQ-146 gates no phase (see Open questions). The second
2026-11-25 update (catalogue `67cba2c`, the People section) adds **D97 and D98**, its two new open
questions, each with the default its phases build, and **D99 to D105**, the owner's directives for the
People section and its lanes. It rewrites D96 (US-04.1.2's unit moves from 47 to 52) and adds 52 to
D90's gates.

| ID | Decision | Gates | Source |
|---|---|---|---|
| D90 | **Disabling a Contract from a future date (OQ-144). Open** (new 2026-11-25; Donald to ask AA; no recommendation). Default, the catalogue's own fallback: no future-dated disable and no date on a Contract. Disable acts at once, after 45's confirm; a Contract replaced from a date and left active gets a to-do on the change date that stands in for a scheduled disable (49). Until the office disables it, both Contracts are offered, and 49's message for a replacement not priced as a fixed price says so. 52 is untouched by it: an inactive anaesthetist's last day is the anaesthetist's, never a date on a Contract. | 45, 49, 52 | OQ-144; US-04.1.8 Technical discussion; US-04.1.2 |
| D91 | **A hospital's untagged Contracts on the step rail (OQ-145). Open** (new 2026-11-25; Donald to ask Ben; no recommendation). Default: as built. A hospital-held Contract with no funding tag sits under Special (`destinationOf`, US-04.2.17, which still Matches). 46's "Where it will show" and 47's "where the invoice goes" grouping both read `destinationOf` and never place a Contract themselves, so an answer changes one function. | 46, 47 | OQ-145 |
| D92 | **The Contracts section's shape. Decided** (owner, 2026-11-25 plan update). One Admin side-nav entry, Contracts, between Ledger and Master data, with routed tabs Contracts (`/admin/contracts`), Parties (`/admin/contracts/parties`) and Funding tags (`/admin/contracts/tags`). A Contract's page is `/admin/contracts/:contractId`, keyed by the Contract's id, never its AA code, because the AA code is editable. This overrides `contracts-section.html` `#record`, "a page at its AA code"; `#map` already says the id. New contract is `/admin/contracts/new` (with `?holder=`). All of it sits on the AdminPage frame: fit for the lists, ProfilePage fluid with the 412px rail for a Contract or a Party. The section opens on the catalogue. | 45 to 49 | Owner directive; US-13.4.1, FT-04.1, US-04.1.7; `docs/explorations/contracts-section.html` `#map` |
| D93 | **Old Master data links redirect until the owner's sweep. Decided** (owner). `/admin/masters?view=contracts`, with `&contract=<id>` or `&holder=<PartyId>`, goes to `/admin/contracts` or the Contract's page (45). The holder link maps to the holder grouping once 47 lands. `?view=parties` and `?view=fundingTags` go to the new tabs (48). The redirects keep the capture recipes, the demo guide (S5's `?view=contracts` links) and Playwright loading. In-app links go to the new routes directly. No phase edits the recipes, ATLAS or the guide: the sweep re-points them. The redirects stay after 49. | 45, 47, 48 | Owner directive; standing rule "Demo guide and catalogue screenshots" |
| D94 | **The to-do on the change date, and the late disable. Decided** (owner). The reminder is a warning rule in `src/domain/warnings/rules/`, a To-do and never a blocker in `lifecycle.ts`: "a replaced Contract is still active on or after its replacement's date". It shows in the Day view To-do and on the old Contract's page, and goes once the old Contract is disabled. Disabling a replaced Contract after its change date lists the Procedures from that date, not from today. Default for DM-01's home (the delta's recommendation): the link and date ride the new Contract's `contract.create` audit entry (`replaces: { contractId, fromISO }`), with no field on the Contract, which keeps "No dates" (US-04.1.2) and leaves OQ-144 open. So there is no `PERSIST_VERSION` bump unless the seed gains a replacement. | 49 | Owner directive; US-04.1.8 (Old one left active, Late disable); DM-01, DM-03, DM-04 |
| D95 | **Considered and not built. Decided** (catalogue). No desk page of Contract work, no adding one price range to many Contracts at once (every change is made on one Contract, from its page), and no "Try a List" screen for testing what the step rail offers. The label stays "Funding tag" and the tab stays "Parties". | 45 to 49 | US-04.1.2, US-04.2.15, US-04.1.5 and US-13.4.5 Notes; change log 2026-11-25 |
| D96 | **Contracts stories split across phases. Decided** (owner; updated by the People plan update). US-04.1.2 is built across four phases, with its unit on 52, which finishes it: 45 builds Disable confirmed; 46 builds New contract order and Similar name, and removes the warning-only "Replaces" picker on create; 47 builds Grouped, Two surgeons, the search and the Active, Disabled or all filter, where the holder filter becomes the holder grouping (47's doc, written before the People change, says it finishes the story: it closes the criteria it builds); 52 builds the new Inactive anaesthetist criterion from new files that call `disableContract` and `enableContract`, and walks the whole story at its close. US-04.1.3 spans 45 (one audited change per card) and 49 (what a replacement audits), with its unit on 49. DM-04's confirm (list from today) is built in 45; its replaced case, listing from the change date, is US-04.1.8's Late disable in 49. DM-01 to DM-04 are parked in the plan (Parked), because only 49 builds what remains of them. | 45, 46, 47, 49, 52 | Owner directive |
| D97 | **How an anaesthetist who has left sees later remittances (OQ-147). Open** (new 2026-11-25; Donald to ask AA; no recommendation). Default, the reading DM-07 builds: sign-in stops entirely after the last day, and comes back when the anaesthetist is made active again; no read-only sign-in is kept. Nothing is built for remittances that arrive later: the office sends them by email, and 52 puts that on its owner's review list. | 52 | OQ-147; US-12.1.6 Technical discussion; US-13.5.3 |
| D98 | **Any record of surgeons who practise together (OQ-148). Open** (new 2026-11-25; Donald to ask AA and Greg; no recommendation). Default, as the catalogue says: no surgeon group record. A group that holds Contracts is a Party of kind surgeon group, its surgeons are the ones linked on its Contracts, and each surgeon's practice name says who practises together. 53 removes the Surgeon groups list and 55 the record behind it. An answer that brings a list back is a new phase, not a reprieve. | 53, 55 | OQ-148; US-13.4.1, US-13.6.2; domain model |
| D99 | **The People section's shape. Decided** (owner, People plan update; Notes 2026-11-25 · Donald people section #1, #2). One Admin side-nav entry, People, where Patients was, taking Patients' attention count. Routed tabs Anaesthetists (`/admin/people/anaesthetists`, where the section opens), Surgeons (`/admin/people/surgeons`), Specialties (`/admin/people/specialties`) and Patients (`/admin/people/patients`), each an AdminPage fit list, searched, filtered and paged. A page per record, keyed by an id that never changes: `/admin/people/anaesthetists/:anaesthetistId` (the registration number, which is the anaesthetist's id), `/admin/people/surgeons/:surgeonId`, `/admin/people/specialties/:specialtyId` and `/admin/people/patients/:nhi`, on ProfilePage fluid with the 412px rail as the side panel. Master data keeps hospitals and their holidays ("People and places" becomes "Places") and the rest, with a pointer line. Waiting for NHI goes to Intake (51). Considered and not built: tabs on a record listing every List and Contract, Patients as a section of their own, and a grouped Surgeons list. | 50 to 57 | Owner directive; US-13.4.1, US-12.1.4, US-11.1.1; `docs/explorations/people-section.html` `#map`, `#nav` |
| D100 | **Old People links redirect until the owner's sweep. Decided** (owner, as D93). `/admin/masters?view=anaesthetists`, `surgeons` and `specialties` go to their People tabs, and `?view=surgeonGroups` to Surgeons. `/admin/masters/anaesthetists/:id` and `/admin/masters/surgeons/:id` go to the record pages. `/admin/patients`, `/admin/patients/follow-up` and `/admin/patients/:nhi` go to the Patients tab, its Needs follow-up filter (once 57 builds it) and the patient's page (53). `/admin/patients/waiting` goes to `/admin/intake/waiting` (51). In-app links go to the new routes directly. No phase edits the recipes, ATLAS or the guide. The redirects stay. | 51, 53, 57 | Owner directive; standing rule "Demo guide and catalogue screenshots" |
| D101 | **Wave 2's split. Decided** (owner, 25 Nov 2026, revised the same day). The Contracts phases (46 to 49) join onto `master` first, as Wave 1 with Lanes A and B only. Wave 2 then runs Lane A: 50, then 52, then 53, with Lane B's 51 beside it; 53 merges 51's `complete:` commit at its start. Wave 3 is as before. The earlier Lane C boundary (a list of Contracts files 50 to 52 must not touch, and one router exception for 51) is withdrawn, because no Contracts lane runs beside the People phases. 50's card stays self-contained on today's anaesthetist record, and 52 still disables and re-enables Contracts through the existing store actions from new files, as design choices: 54 reuses the card, and the Contracts code stays untouched. | 50 to 53 | Owner directive |
| D102 | **The rate and tier card's save (DM-09). Decided** (owner; the delta's recommendation). No new data: the tier stays in the office-private slice and the rate on the anaesthetist. Save writes only what changed. When both changed, the two writes (`editAnaesthetist`'s `unitValue` and `setPriorityTier`) run in one change set (`withChangeSet`), so one save is one audited change. Cancel writes nothing, and a click on a tier never saves. | 50, 54 | Owner directive; US-01.3.6, US-12.1.4; DM-09 |
| D103 | **Making an anaesthetist inactive: the built defaults (DM-05 to DM-07). Decided** (owner; the deltas' recommendations). The last day and the reason are stored on the anaesthetist; activity is derived through one pure `isActiveOn(anaesthetist, dateISO)`, so no clock hook keeps a flag in step. The last day is today or later. Slots after it go when it is set (the refusal means none holds a List) and come back if it is cleared; made active again, the anaesthetist has Slots from that day (today on the demo clock). "Own Party" is derived, with no stored link: a Contract whose holder is an anaesthetist-kind Party and whose `linkedAnaesthetistId` is the person. When the demo clock passes the last day (the `dayAdvanced` event), the system disables those Contracts, one audited change each; only the Contracts that rule disabled are offered back. Sign-in is refused after the last day, at the attempt and at the stored-session gate, with its own audited reason. The shape change bumps `PERSIST_VERSION`. | 52, 54 | Owner directive; US-12.1.6, US-01.1.1, US-04.1.2, US-13.5.3; DM-05, DM-06, DM-07 |
| D104 | **One record pattern, lifted once. Decided** (owner). 53 lifts the Contract page's cards, edited and saved one at a time (`EditableCard` and `useCardEdit` in `ContractCards.tsx`), and a side panel of short sections with See all into shared components with `/demo/catalogue` rows, and re-points the Contract page onto them with no change in behaviour. 54 to 57 build every People page on them and none copies them; a phase that needs more extends them with a prop. A side panel shows a few rows of each kind with See all, never a tab listing everything. | 53 to 57 | Owner directive; US-13.4.1, US-12.1.4, US-13.6.2, US-13.4.4, US-11.1.1; `people-section.html` `#map` |
| D105 | **People stories split across phases. Decided** (owner). US-13.4.1's unit is on 53, which builds Three places, No surgeon group record (the list) and Find a person. The Surgeons list's search, specialty filter and Active or Retired filter are built there rather than in 55, because Find a person is that unit's own criterion. Its One card, one change is US-13.6.2's One card at a time, built and verified in 55, which also removes the surgeon group record (DM-08). US-12.1.4's unit is on 54, which finishes it: 50 builds Rate and tier together, 52 the make-inactive action, 53 the Anaesthetists list's search, filters and pager. US-01.3.6 is finished in 50, and 53 keeps its list filter when the list moves. DM-10 spans 51 (waiting rows leave the patient count) and 57 (one row per patient), with its unit on 57. US-11.1.1 and US-11.3.1 move with the section in 53 and are finished in 57. | 50 to 57 | Owner directive |

## Track

```
Contracts   45 the section & the Contract page                                        (DONE)

Wave 1      Lane A  46 New contract page ─▶ 49 Replace a Contract from a date
            Lane B  47 the grouped catalogue ─▶ 48 Parties & Funding tags tabs
            ── join: owner tests 45 to 49 (TEST-45-49.md) ──
Wave 2      Lane A  50 rate & tier card ─▶ 52 make an anaesthetist inactive
                    ─▶ 53 the People section & the shared record pattern (merges 51 first)
            Lane B  51 Waiting for NHI on Intake
            ── join (Lane A, last to finish): takes in 50 to 53; no owner test ──
Wave 3      Lane A  54 the anaesthetist's page
            Lane B  55 the surgeon's page, surgeon groups cut ─▶ 56 the specialty's page
            Lane C  57 the Patients tab & the patient's page
            ── join: owner tests 50 to 57 (TEST-50-57.md) ──
```

45 ran alone. Everything after it runs in build lanes, wave by wave ([LANES.md](LANES.md)): the
Contracts phases in two lanes, then the first People phases (50, 52 and 53 in Lane A, 51 in Lane B),
then the four People pages in three lanes.

## Phases

| Phase | Title | Track | Depends on | Sessions | Delivers |
|---|---|---|---|---|---|
| 45 | [The Contracts section and the Contract page](phases/phase-45-contracts-section-and-contract-page.md) | Contracts | none | 2 sessions | A Contracts entry in the Admin side nav between Ledger and Master data, with the Contract list moved there on AdminPage fit with a tab strip; the old Master data links redirected (D93). A page per Contract at its id (D92), on ProfilePage fluid with a rail: cards edited and saved one at a time, each one audited change, refused in place; the holder Party's billing details read-only; the price ranges as a newest-first table with To, Change and Procedures priced, ended ranges folded after three; the Procedures on it, its event fees and its history; Disable confirmed, listing the Procedures from today; system Contracts limited. The side panel's edit path retired (create keeps it until 46). Covers US-04.1.7, US-04.2.15 (plus US-04.1.2's Disable confirmed and US-04.1.3's per-card audit, D96, and DM-04's confirm; the delta is parked) |
| 46 | [The New contract page](phases/phase-46-new-contract-page.md) | Lane A | 45 | 1 session | New contract as a full page (`/admin/contracts/new`, `?holder=`), filled in the order its rules depend on (holder and who it bills, pricing, where it is offered, name and codes), with a live "Where it will show" and the holder's similarly named Contracts as a hint, never a block. Saving lands on the new Contract's page. `ContractEditSheet` deleted, with its warning-only "Replaces" picker. No unit of its own: US-04.1.2's New contract order and Similar name (D96) |
| 47 | [The grouped Contract catalogue](phases/phase-47-grouped-contract-catalogue.md) | Lane B | 45 | 1 session | The catalogue grouped by holder, kind of holder, funding tag (No tag included), surgeon (a two-surgeon Contract under both), where the invoice goes or pricing kind, by a pure tested `groupContracts`. An index pane of groups with counts sits beside the list, with a GroupRow sub-heading variant. `?group=` and `?in=` live in the URL, and the last grouping is remembered per office user. The holder filter becomes the holder grouping. No unit of its own now: US-04.1.2's Grouped, Two surgeons, search and filter, with the story's unit moved to 52 (D96) |
| 48 | [The Parties and Funding tags tabs](phases/phase-48-parties-and-funding-tags-tabs.md) | Lane B | 45, 47 | 1 session | Parties and Funding tags as tabs of the Contracts section. Parties are grouped by kind, Contract-less ones included, and each Party has a page with its Contracts counted by funding tag, each count opening the catalogue. Picking a tag shows its Contracts grouped by hospital with counts. The three views leave Master data, with redirects and a pointer line. Covers US-04.1.5, US-13.4.5 (plus US-13.4.1's Contracts-section half; the story's unit moved to 53, D105) |
| 49 | [Replace a Contract from a date](phases/phase-49-replace-contract-from-a-date.md) | Lane A | 45, 46 | 1 to 2 sessions | Replace from a date as one action, from a SidePanel record sheet: a copy with any setting changed and a new AA code; the Procedures from the date listed, locked ones left out, only the ticked ones moved; the old Contract left active with a to-do on the date, or disabled now. Every step is audited, in one change set (`replaceContract`). The to-do is a warning rule, never a blocker (D94). A late disable lists the Procedures from the change date. A "Demo: reach the change date" button. Covers US-04.1.8, US-04.1.3 (it builds DM-01 to DM-03 and DM-04's replaced case as its doc says; the deltas are parked) |
| 50 | The rate and priority tier card | Lane A | 45 | 1 session | The rate per unit and the priority tier on one self-contained card on today's anaesthetist record: Edit, choose, Save (Cancel leaves it), one audited change per save (D102), never a single click. The rate leaves the edit sheet, and the Anaesthetists list filters by tier. Covers US-01.3.6, DM-09 |
| 51 | Waiting for an NHI as a tab on Intake | Lane B | none | 1 session | A Waiting for NHI tab on Intake beside Matching, with the view moved from Patients unchanged and `/admin/patients/waiting` redirected. The rows count once, in Intake's attention count, which drops when the NHI is added; the Patients count stops counting them. The counts change in the selectors, not in AdminApp or SideNav. Covers US-11.1.5, US-11.1.4, US-02.1.4 |
| 52 | Make an anaesthetist inactive from a last day | Lane A | 49, 50 | 2 sessions | A last day and a reason, refused while the anaesthetist holds a List after it (those Lists shown), cleared before the day, each step audited (D103). After the day: no Slots, not offered or picked, no sign-in in the mobile app, the PWA or the web app, and their own Contracts disabled by the system. Made active again: Slots and sign-in back from that day, and the disabled Contracts offered back, ticked with prices. A status card and two sheets on today's anaesthetist record; the edit sheet's Active toggle goes. "Demo: pass the last day". Covers US-12.1.6, US-13.5.3, US-01.1.1, US-04.1.2 (its Inactive anaesthetist criterion, finishing the story, D96), DM-05, DM-06, DM-07 |
| 53 | The People section and the shared record pattern | Lane A | 46 to 52 | 2 sessions | A People entry where Patients was, with its attention count, and four routed tabs (Anaesthetists, Surgeons, Specialties, Patients), each list searched, filtered and paged (D99). Every record route moves under People, and the old Master data, profile and Patients links redirect (D100). Master data keeps Places with a pointer across, and the Surgeon groups list goes (D98). The Contract page's cards and a side panel are lifted into shared components with catalogue rows, the Contract page unchanged (D104). Covers US-13.4.1 (D105) |
| 54 | The anaesthetist's page | Lane A | 50, 52, 53 | 1 session | A page per anaesthetist keyed by registration number: identity, contact, bank, rate and tier (50's card) and status (52's card) cards, each saved on its own as one audited change; a side panel of pairings, linked Contracts and next Lists with See all; Make inactive on the page. The all-fields edit sheet goes. Covers US-12.1.4 |
| 55 | The surgeon's page, and surgeon groups cut | Lane B | 53 | 1 to 2 sessions | A page per surgeon: name and practice, registration, HPI CPN, specialties and contacts cards, each saved on its own as one audited change; a side panel of pairings both ways, linked Contracts and next Lists with See all; no Groups card. The surgeon group record, its actions, seed and screens removed, with a `PERSIST_VERSION` bump; the surgeon-group Party stays (D98). Covers US-13.6.2, DM-08 |
| 56 | The specialty's page | Lane B | 53, 55 | 1 session | A page per specialty listing its surgeons and its Contracts with counts, where it is renamed (one audited change, reaching every holder) or removed (refused while held). Covers US-13.4.4 |
| 57 | The Patients tab and the patient's page | Lane C | 51, 53 | 1 to 2 sessions | The Patients tab with Coming up (default), Needs follow-up (one row per patient with its reasons, from a pure `patientsNeedingOffice`) and All, searched and paged; its count is People's attention count. Follow-up actions move from the rows to the patient's page, which follows the shared record pattern with the details in the side panel. Covers US-11.3.1, US-11.3.3, US-11.1.1, DM-10 |

## Open questions

Five questions were added on 2026-11-25, three with the Contracts section and two with the People
section, all open; none is answered, so the phases build without them. Three older open questions
touch planned phases.

| Question | Owner | Gates | Built meanwhile |
|---|---|---|---|
| OQ-144 Disabling a Contract from a future date | Donald to ask AA | 45, 49 (D90); 52 (no effect) | No scheduled disable; the to-do on the change date stands in. An inactive anaesthetist's last day is never a date on a Contract |
| OQ-145 A hospital's untagged Contracts on the step rail | Donald to ask Ben | 46, 47 (D91) | As built: under Special, read through `destinationOf` |
| OQ-146 Which backstops each hospital and funding tag gets | Donald | none | As built (US-04.3.9 Matches): an RVG and a Fixed price backstop per place. 45's system-Contract pages and 47's groupings show whatever system Contracts the seed makes. Nothing is built for it |
| OQ-147 How an anaesthetist who has left sees later remittances | Donald to ask AA | 52 (D97) | Sign-in stops entirely after the last day; later remittances go by email from the office, and nothing is built for them |
| OQ-148 Whether AA needs any record of surgeons who practise together | Donald to ask AA (Greg) | 53, 55 (D98) | No surgeon group record: a group that holds Contracts is a Party, its surgeons the ones linked on its Contracts |
| OQ-114 How each Party's invoices are delivered (older) | Donald to ask Ben and Vanessa | 48 (no new work) | As built: email or post, shown on the Party page |
| OQ-83 The anaesthetist's sign-in experience (older) | Donald | 52 | As built: the simulated account sign-in for the demo account (Dr Souter), provisional. 52 adds only the inactive refusal |
| OQ-143 Surgeons without an HPI CPN or a full name (older) | Donald to ask Vanessa | 55 | As built: a blank HPI CPN saves ("No HPI CPN yet") and a duplicate is refused |

## Sequencing rules

- **Every phase after 45 runs in a build lane** (owner, 2026-11-25), in its own git worktree, wave by
  wave; [LANES.md](LANES.md) holds the lanes, the ownership tables, the sync, the joins and the
  conflict rules, and overrides a phase's kick-off prompt, the run-build-phase skill and CLAUDE.md for
  a lane session. A phase starts only when every phase in its `depends_on` is DONE and committed on its
  branch. A session on `master` never runs a lane phase from its own prompt.
- **Wave 1: two lanes, once 45 is DONE on `master`.** **Lane A** builds 46 then 49 and **Lane B** 47
  then 48. Whichever finishes second joins them onto `master` as soon as the full gate is green and
  writes `TEST-45-49.md`. Lane C does not run in Wave 1 ([LANES.md](LANES.md), "Joining Wave 1").
- **Wave 2: once 46 to 49 are on `master`.** **Lane A** builds 50, then 52, then 53. **Lane B** builds
  51 beside it. 53 starts only once 51 is complete: at 53's start Lane A merges Lane B's `51 complete:`
  commit, and if 51 is not complete Lane A stops as blocked. Lane C is idle. The join, by Lane A (the
  last to finish), takes in 50 to 53 once the full gate is green; there is no owner test after it.
- **Wave 3: three lanes, once 53 is on `master`.** **Lane A** builds 54, **Lane B** 55 then 56, and
  **Lane C** 57. The last to finish joins them and writes `TEST-50-57.md`; then the lanes are torn down.
- **The owner tests twice, never between phases or waves.** 45 to 49 once after Wave 1's join, from
  `TEST-45-49.md`. 50 to 57 once after Wave 3's join, from `TEST-50-57.md` (Wave 2's join is not
  tested on its own). Wave 2 starts at Wave 1's join without waiting for the owner's test of 45 to 49:
  a fix from that test lands on `master` and reaches the lanes through their `git merge master` at
  each phase start. Inside the lanes each phase runs only the quick checks and its own specs, and skips its own review; each
  join runs the full gate and one review over its wave.
- **Run order.** 45; Wave 1 (46 and 47 side by side; then 49 and 48); join; Wave 2 (50 and 51 side by
  side; then 52; then 53); join; Wave 3 (54, 55 and 57 side by side; then 56); join.
- **45 first.** It makes the section, its routes, the redirects (D93) and the Contract page. It also
  adds the shared pieces the later phases reuse: the Card editing and footer variant (46's and 48's
  pages, 49's sheet, 50's card) and the ConfirmSheet danger variant over `stillOnContract` (49's late
  disable). From 45 to 46, New contract still opens the old `ContractEditSheet` in create mode; its
  edit path is gone.
- **46 after 45.** The new page lands on 45's Contract page. 46 deletes `ContractEditSheet` and its
  warning-only "Replaces" picker. From then until 49, a dated change is a new Contract made by hand,
  with no warning list, and Replace from a date waits for 49 (on 46's owner review list).
  `stillOnContract` and `proceduresStillOnContract` stay: 45 and 49 read them.
- **47 after 45.** It groups 45's moved list. 47 maps `?holder=` (and D93's redirected `&holder=`) to
  the holder grouping. Its doc still says it finishes US-04.1.2; 52 now does (D96).
- **48 after 47.** Each Party's per-tag counts open the catalogue through 47's `?group=` and `?in=`
  URL, and the tags tab's hospital grouping reuses `groupContracts`. 48 removes the last three Master
  data views. It builds as its doc says, US-13.4.1's Contracts-section half and its "two places" test
  wording included; the story's unit is 53's, which moves `masterViews.test.ts` to three places.
- **49 after 45 and 46, last in Lane A's Wave 1 queue.** Replace sits in 45's Contract page header and
  shares 45's still-on-Contract list (the late disable reads it from the change date). Its sheet
  reuses 46's rule-order form sections. 49 also has the only new Contract store action.
- **Wave 2 (D101).** 50 and 51 need nothing from each other. **50 first, in Lane A:** its card is
  self-contained on today's anaesthetist record, on 45's Card editing and footer props. **51 in Lane B,
  beside it:** it adds its Intake route, turns the Patients `waiting` route into a redirect and adds its
  route component, and writes in its notes what it changed in `router.tsx`, `routes.tsx` and the
  selectors. **52 next in Lane A, after 50:** 49 is on `master` already, so there is nothing to merge;
  it builds on 50's card in the same file and calls `disableContract` and `enableContract` from new
  files, which leaves the Contracts code untouched.
- **53 last in Lane A's Wave 2 queue, after 50 and 52 and after Lane B's 51.** At its start it merges
  Lane B's `51 complete:` commit (stopping as blocked if 51 is not complete). It owns every shared shell
  file (router, side nav, AdminApp, routes, the Master data registry, the redirects) and lifts the
  record pattern, so nothing else runs while it does except Lane B's 51 if not yet finished, which 53
  merges first. The Contract page's behaviour must not change. It moves the record routes with
  today's screens, which Wave 3 rebuilds.
- **Wave 3 after 53.** 54 reuses 50's and 52's cards and 53's pattern. 55 cuts surgeon groups and
  rebuilds the surgeon's page. 56 follows 55 in Lane B: its rows open the surgeon's page. 57 rebuilds
  the Patients tab and the patient's page on 51's counts and 53's tab. Each adds or swaps only its own
  routes in the People block and never reorders it, and extends 53's shared components with a prop,
  never rewriting them.
- **`PERSIST_VERSION`.** 45 to 51 expect no bump (49 only if DM-01 takes a stored field or the seed
  gains a replacement). 52 bumps it (the anaesthetist's last day) and 55 bumps it (the surgeon group
  slice removed). A join that meets two bumps sets one past the higher. Any phase that seeds an
  acceptance criterion's example bumps it.
- **The screenshots and the guide wait for the sweep.** The redirects (D93, D100) keep the recipes,
  ATLAS routes and the guide's links loading. Recipes that click into a retired panel, view or sheet
  break until the owner's sweep re-points them, and each phase lists those under "For the sweep".
  Phases update the Playwright specs in `aa-prototype/visual/` that they break, because the full gate
  runs them.

## Milestones

- **After 45:** Contracts as its own Admin section. Open any Contract on its own linkable page and
  change it one card at a time, one audit entry each. Read ten years of price ranges as a table with
  the Procedures each priced. See who a Contract touches before changing it, and disable it only
  after confirming the Procedures still on it.
- **After 47:** The catalogue grouped six ways with an index of groups and counts: every SXAP
  Contract across hospitals, or what one surgeon's Lists can be priced at. New Contracts are entered
  on their own page in rule order, with a live step-rail preview and a similar-name hint.
- **After 48:** The whole Contracts section: the Contracts, Parties and Funding tags tabs, a page per
  Party with its Contracts counted by tag, and each tag's Contracts by hospital. Master data keeps
  the rest of the reference data and points across.
- **After 49:** Replace a Contract from a date in one action: copied at the new rate, the ticked
  Procedures moved, the old one left active with a to-do on the date or disabled now, and a late
  disable listing from the change date. S5's "a new Contract supersedes the old one" now works as the
  guide scripts it; the owner's sweep brings the guide's wording in step.
- **After 52:** The tier edited with the rate in one card (Edit, choose, Save), and the Anaesthetists
  list filtered by tier. Waiting for NHI as its own tab on Intake, counted once. Make Dr Beaumont
  inactive from a last day: refused while she holds a List after it; after the day she has no Slots,
  is not offered, cannot sign in, and her Rhinoplasty Contract is disabled; made active again, it is
  offered back ticked at $1,350.00.
- **After 53:** One People section where Patients was: anaesthetists, surgeons, specialties and
  patients as tabs, each list searched, filtered and paged, and every old link still lands. The
  Surgeon groups list is gone, and Master data keeps the places.
- **After 57 (Wave 3 joined):** A page for every anaesthetist, surgeon, specialty and patient, its
  cards saved one at a time, with a side panel of pairings, Contracts and next Lists. Surgeon groups
  are gone from the model. The Patients tab shows Coming up, Needs follow-up (one row per patient,
  the reason on it) and All, and the action is taken on the patient's page.

## Parked

Four data-model deltas are parked, all of them Phase 49's work. They were re-graded at `67cba2c` and are still gaps because 49 is still building in Lane A, but 49 counts as built here so its doc stays frozen, and a built phase cannot hold a re-graded gap. No other phase builds them; 49's doc covers them, and the Wave 1 join's full gate and review check them. The next plan update should re-grade them as Matches and drop them from this list.

| Unit | Why parked |
|---|---|
| DM-01 | A Contract remembers which Contract it replaces, and from when. Unchanged at `67cba2c`; Phase 49 builds it (D94: the link and date ride the new Contract's `contract.create` audit entry), in progress in Lane A. |
| DM-02 | Replace a Contract from a date, as one action (`replaceContract`). Unchanged; Phase 49 builds it, in progress in Lane A. |
| DM-03 | A Contract still Active after its replacement's date is a To-do. Unchanged apart from the verifier's note (a `Warning` is Booking-keyed, so 49 widens it or derives a `ToDoItem`); Phase 49 builds it, in progress in Lane A. |
| DM-04 | Disabling is confirmed and lists the Procedures first. Narrowed: the confirm is built on `master` (45); only the replaced case, listing from the change date (`disableFromISO`), remains, and Phase 49 builds it as US-04.1.8's Late disable, in progress in Lane A. |

## Standing rules

The rules every phase follows. The `run-build-phase` context pack quotes these sections to each phase.

### Running a phase

Every kick-off prompt is short: it names the phase, tells the agent to load the `run-build-phase`
skill (`requirements-board/agent/skills/run-build-phase/`), and adds only what the phase doc does not
already say. Every prompt carries the same Override block: commit when green (stage by path, never
push); skip the screenshot recipes, the demo guide and the capture (the owner's sweep does them). The
skill holds the rest, the same for every phase: a context pack (`phase-context.mjs`); the drift check;
plan and build; quick partial checks while building and the full green set at gates
(`phase-check.mjs`); the design-fidelity check and the manual checklist; the review; a short PROGRESS entry with a Handoffs block; and updating `status.json` and the plan page
so it names the next phase. A prompt line wins over the skill; the phase doc wins over the skill for
what to build.

### Owner review: agents test themselves

- **No plan-approval stop.** After the drift check, the agent writes its step plan and starts building
  straight away. It never enters plan mode itself. When the owner starts a session in plan mode, the
  agent does all its reading and the drift check first and presents the plan once; after approval it
  builds to the end without further stops.
- **The agent is the tester.** It runs the phase's manual test checklist itself, in the running app
  (start root `npm run dev` in the background if 5173 or 5174 is down), driving it with Playwright or
  the `/run` skill and checking screenshots by eye. "Handset" checks use the emulated mobile viewport
  unless a real phone is attached. Each item is reported pass or fail with its evidence.
- **Defaults over questions.** Where a phase doc says "ask the owner" about a product choice, the agent
  builds the stated default, labels it provisional where the doc says so, and logs it on the phase's
  "For the owner's review" list instead of asking.
- **Stop and ask only when it is very needed:** a drift-check stop the phase doc names, a blocker no
  documented default resolves, or an action that is destructive or hard to undo.
- **Then the owner tests.** The phase commits when green and hands over: what changed, where to try
  it and the "For the owner's review" list. For the lane phases the owner tests twice
  ([LANES.md](LANES.md)): 45 to 49 once, after Wave 1's join, from `TEST-45-49.md`, and 50 to 57 once,
  after Wave 3's join, from `TEST-50-57.md`.

### Front-end design

Before building or reshaping any screen, sheet, dialog, panel, row, banner or state, the agent loads
the `frontend-design` skill (the `run-build-phase` skill holds this step). It works inside the design
system, not over it: the `docs/design` files and `src/theme` tokens stay authoritative (PROGRESS
binding convention 17, CLAUDE.md "Design"), so it shapes layout, hierarchy, spacing, states and finish,
never a new palette, typeface or visual language, and the two hard rules (crimson identity only, teal
the only action colour) hold. Each changed screen is screenshotted beside its mockup at the same
viewport and compared before the phase is called done. A phase that touches UI names, in its doc, the
design page and screen for each screen it changes. Store, seed and pure-domain steps do not need it.

### One component per job

- UI in a phase is built from the shared components: `src/shared/ui/` (controls and feedback),
  `src/shared/surface/` (sheets, dialogs, modal behaviour), `src/shared/table/` (tables) and
  `src/shared/calendar/`. `src/shared/ui/README.md` lists what exists and how to add a variant.
- If a shared component cannot do what a phase needs, the phase extends it with a variant or prop that
  defaults to today's look and matches a pattern in `docs/design/`; it never copies the component into
  a screen file. A new private copy of a shared component is a review finding, and
  `src/apps/oneComponentPerJob.test.ts` enforces it (its allow-list only shrinks).
- A phase that rebuilds a screen also migrates any remaining copies on that screen.
- A shared component keeps its hooks: it takes `shot`, emits `data-shot` on the element recipes
  target, and passes `data-*` attributes through.
- The catalogue rows (`/demo/catalogue/*`) change in the same session as the component.
- A phase that touches UI carries the "Build on the shared components" work item and the review line.

### Demo triggers

The mechanism exists (`src/shared/demoTriggers`). A phase registers new entries or re-points existing
ones; none adds a trigger to the Control Panel page. Each entry declares:

- the route patterns it belongs to;
- the surfaces it shows on: harness bar, PWA sheet, or both;
- a `run(api, ctx)` that acts on the entity in the URL (`listId`, `bookingId`, `invoiceId`,
  `dateISO`) or on screen state published through `useDemoTriggerContext`, not a hardcoded seed id
  wherever possible;
- a disabled state.

The harness bar shows a trigger only on its screen. The Control Panel keeps the scenario jumps, the
clock and reset, and lists every trigger under its screen. Trigger bodies, the context hook and the
shared actor constants live in `src/shared` or `src/store`, so the PWA purity test holds. Product
actions stay in the product UI, not the bar. A trigger added or renamed keeps
`src/shared/demoTriggers/demoGuideSync.test.ts` green.

### PWA parity

The PWA has no harness bar and no Admin app, so a handset demo cannot switch to the office. A phase
whose beat has a mobile side that waits on the office, a colleague or a backend event registers a
PWA-surface entry for the mobile screen concerned (an office stand-in, run as
`OFFICE_SIMULATION_ACTOR`). These stand-ins show on the PWA only: in the framed build the presenter
plays the office in Admin.

### Demo guide and catalogue screenshots

A version of the demo guide (`docs/demo-guide/`, with `master-demo-guide.html`) and the catalogue
screenshots goes to Anaesthesia Associates for testing and approvals. They are brought in step with
the app in one **sweep the owner triggers** (`/sweep`, the project skill `.claude/skills/sweep/`),
which takes everything changed since the last sweep (`docs/SWEEP.md`), updates the recipes, ATLAS and
the guide, runs the full gate and the capture, and commits.

- **Phases do not touch** the capture recipes, `ATLAS.md` or the demo guide, and never run the
  capture, not even `--dry`. A phase doc may note, under "For the sweep", anything new worth a
  screenshot or a guide beat.
- A phase keeps tests that read the guide green: `src/shared/demoTriggers/demoGuideSync.test.ts`
  (a renamed or new demo trigger fixes the guide line the test names, nothing more).
- Recipes and images are never touched while updating the plan.

### Confirm before building

Phases that carry unresolved open questions (OQ) or Verify, Open or Proposed items are listed here.
Each checks them at its drift check, and if they are still open builds the owner-decision default or
the recommended reading and labels it provisional in the UI.

| Phase | Items | Open questions |
|---|---|---|
| 45 | US-04.1.7, US-04.2.15 and DM-04, plus US-04.1.2's Disable confirmed and US-04.1.3's per-card audit (all Verify: Donald's 25 November decisions, not yet seen by AA): the page per Contract and its cards, the price ranges table, the confirmed disable | OQ-144 (D90) |
| 46 | US-04.1.2's New contract order and Similar name (Verify): the New contract page in rule order and the similar-name hint | OQ-145 (D91) |
| 47 | US-04.1.2 (Verify): the six groupings, the index and the search; the holder filter folded into the holder grouping | OQ-145 (D91) |
| 48 | US-04.1.5 and US-13.4.5 (Verify), and US-13.4.1's Contracts-section half: Parties and Funding tags as tabs, the Party page, each tag's Contracts by hospital | OQ-114 (as built) |
| 49 | US-04.1.8 and US-04.1.3 (Verify), DM-01 to DM-03: Replace from a date, the to-do on the date, the late disable from the change date | OQ-144 (D90) |
| 50 | US-01.3.6 (Verify) and DM-09: the rate and tier card, Edit then Save; the Anaesthetists list's tier filter | none |
| 51 | US-11.1.5, US-11.1.4 and US-02.1.4 (Verify): Waiting for NHI as a tab on Intake, counted once | none |
| 52 | US-12.1.6, US-13.5.3 and US-04.1.2's Inactive anaesthetist (Verify), US-01.1.1 (Agreed; its "active" now links to US-12.1.6), DM-05 to DM-07: the last day and its refusal, the Slots, sign-in, the Contracts disabled and offered back | OQ-147 (D97), OQ-83 (as built), OQ-144 (D90, no effect) |
| 53 | US-13.4.1 (Verify): the People section, its lists, the redirects, the Surgeon groups list gone, the record pattern lifted | OQ-148 (D98) |
| 54 | US-12.1.4 (Verify): the anaesthetist's page, its cards and side panel | none |
| 55 | US-13.6.2 (Verify) and DM-08: the surgeon's page, surgeon groups cut from the model | OQ-148 (D98), OQ-143 (as built) |
| 56 | US-13.4.4 (Verify): the specialty's page | none |
| 57 | US-11.3.1, US-11.3.3 and US-11.1.1 (Verify), DM-10: the Patients tab's filters, Needs follow-up one row per patient, the patient's page | none |
