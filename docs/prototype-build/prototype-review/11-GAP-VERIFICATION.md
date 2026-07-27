# Review 11 - gap verification register (the adversarial audit trail)

This is the raw register behind `00-SUMMARY.md`. Ten reviewers each took one slice of
`docs/rfp-reference/RFP.md`, mapped it feature by feature onto the prototype, and raised every
shortfall they could evidence: 44 claims in all. A separate verification pass then took each claim
one at a time, re-opened the cited source files, tests and screenshots, and **tried to break it**.
The bias was refute-by-default: the burden sat on the claim, not on the build, and a claim survived
only where the verifier could reproduce the shortfall independently and could find no logged
decision, no compensating surface and no governing scope fence that disposed of it. Read the
verdicts with that bias in mind. **CONFIRMED means a hostile reader could not make the claim go
away**, so even a cosmetic CONFIRMED finding is real. **DOWNGRADED** almost never means the
reviewer's facts were wrong: in most cases the facts held exactly as stated and the impact was
smaller than claimed, because a Decisions-log ruling, a mockup-authority convention or a
one-tap-away alternative surface absorbed it. **REFUTED** means the claim was aimed at something
explicitly scoped out, or its own evidence disproved it. No claim rose in severity. The net effect
of the pass was to cut "notable" findings from 13 to 5, resolve 4 claims to BUILT and 3 to
OUT-OF-SCOPE, and leave nothing at high or demo-blocking severity.

Reading notes: paths written as `src/...` are relative to `aa-prototype/`; screenshot names are
files in `aa-prototype/visual/shots/`. Every `file:line` pointer below is the reviewer's or the
verifier's, passed through as they recorded it, and attributed as such. RFP line numbers are the
reviewers' own, against `docs/rfp-reference/RFP.md`.

## Verdict tally

| Verdict | Claims | Final statuses | Final severities |
|---|---|---|---|
| CONFIRMED | 27 | 25 PARTIAL, 2 MISSING | 5 notable, 22 cosmetic |
| DOWNGRADED | 13 | 10 PARTIAL, 3 BUILT | 10 cosmetic, 3 none |
| REFUTED | 4 | 3 OUT-OF-SCOPE, 1 BUILT | 4 none |
| **Total** | **44** | 35 PARTIAL, 4 BUILT, 3 OUT-OF-SCOPE, 2 MISSING | 5 notable, 32 cosmetic, 7 none |

## Index

| Claim | Slice | Title | Claimed | Verdict | Verified status | Verified severity |
|---|---|---|---|---|---|---|
| 02.2 | 02 | Newly added anaesthetist gets a canvas but no day-grid row | notable | CONFIRMED | PARTIAL | notable |
| 03.1 | 03 | Governing-contract picker unfiltered by route and holder | notable | CONFIRMED | PARTIAL | notable |
| 04.1 | 04 | Booked Free List never repainted, Cards invisible to the anaesthetist | notable | CONFIRMED | PARTIAL | notable |
| 04.3 | 04 | Seeded audit trail too thin for principle 10; S5 Beat 1 over-promises | notable | CONFIRMED | PARTIAL | notable |
| 05.1 | 05 | One-Card-many-invoices is not on the guided demo path | notable | CONFIRMED | PARTIAL | notable |
| 09.4 | 09 | No acknowledgement returned to the sending hospital system | cosmetic | CONFIRMED | MISSING | cosmetic |
| 10.2 | 10 | "Open" vs "genuinely overdue" not raised as a discovery item | cosmetic | CONFIRMED | MISSING | cosmetic |
| 01.3 | 01 | Audit viewer lists entries in insertion order, not chronologically | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 02.1 | 02 | `Anaesthetist.active` is inert in the canvas generator | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 02.5 | 02 | Informational insurer on the Hospital route cannot be recorded | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 02.6 | 02 | Admin day-view drawer lists Cards by id and shows no times | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 03.2 | 03 | List Status colour is not a field of the master | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 03.4 | 03 | Informational insurer cannot be recorded on the Hospital route (route editors) | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 04.4 | 04 | `Anaesthetist.active` editable with no behaviour behind it | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 05.2 | 05 | Sanity-check screen has no insurer column, no unresolved-contract flag, no fix path | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 05.3 | 05 | Xero-as-add-on framing not stated in app copy | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 06.1 | 06 | Base-unit table never reaches the RFP's stated top end | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 06.3 | 06 | `accRelated` cannot be set by any user surface | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 06.4 | 06 | ACC pre-op flat-fee code set not modelled or flagged | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 06.5 | 06 | M row caption still credits an absorbed modifier | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 06.6 | 06 | Review footer labels one unit rate on a list that priced at two | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 07.1 | 07 | Contract price rows cannot be keyed by surgeon in the UI | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 07.2 | 07 | No office-side per-anaesthetist ledger view | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 08.1 | 08 | ACCPAY "Buyer Generated Tax Invoice" framing absent | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 08.4 | 08 | Mobile GST peek ignores the anaesthetist's GST period | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 09.6 | 09 | S13 to a session the anaesthetist does not hold degrades silently | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 10.3 | 10 | Sequential-to-randomised NHI issuance not narrated | cosmetic | CONFIRMED | PARTIAL | cosmetic |
| 01.1 | 01 | Overdue view drops the Surgeon and Contract columns | notable | DOWNGRADED | PARTIAL | cosmetic |
| 02.3 | 02 | `lastModifiedBy` / `lastModifiedAt` captured but never shown | notable | DOWNGRADED | PARTIAL | cosmetic |
| 02.4 | 02 | List Status master is a closed six-value enum | cosmetic | DOWNGRADED | PARTIAL | cosmetic |
| 04.2 | 04 | Office cannot add a Card to an already-booked List | notable | DOWNGRADED | PARTIAL | cosmetic |
| 04.5 | 04 | `lastModifiedBy` / `lastModifiedAtISO` stamped but never shown | cosmetic | DOWNGRADED | PARTIAL | cosmetic |
| 04.6 | 04 | Two RFP open questions have no position and no talking-point surface | notable | DOWNGRADED | PARTIAL | cosmetic |
| 06.2 | 06 | No non-procedural codes for post-op / consult events | notable | DOWNGRADED | PARTIAL | cosmetic |
| 08.2 | 08 | InvoiceNumber vs Reference split not shown on the Xero side | notable | DOWNGRADED | PARTIAL | cosmetic |
| 08.3 | 08 | ACCPAY DRAFT to AUTHORISED flip never printed as a status | notable | DOWNGRADED | PARTIAL | cosmetic |
| 09.5 | 09 | Integration message log ships empty | notable | DOWNGRADED | PARTIAL | cosmetic |
| 01.2 | 01 | Dashboard productivity and locum panels differ from Appendix 5 | cosmetic | DOWNGRADED | BUILT | none |
| 07.3 | 07 | `isAdditional` flag not locked in the store | none | DOWNGRADED | BUILT | none |
| 10.1 | 10 | Outstanding-balance check surfaced at billing time, not check-in | cosmetic | DOWNGRADED | BUILT | none |
| 03.3 | 03 | No browsable Patient master surface in the Admin app | cosmetic | REFUTED | OUT-OF-SCOPE | none |
| 09.1 | 09 | HL7 messages carry no AIP personnel segments | cosmetic | REFUTED | OUT-OF-SCOPE | none |
| 09.3 | 09 | No RESTful FHIR interaction shown, even simulated | cosmetic | REFUTED | OUT-OF-SCOPE | none |
| 09.2 | 09 | Internal representation is a neutral parsed message, not FHIR | cosmetic | REFUTED | BUILT | none |

---

# CONFIRMED

Ordered by verified severity, then by slice.

## 02.2 · CONFIRMED · PARTIAL · notable

**A newly added anaesthetist gets a canvas but never gets a day-grid row.** Slice 02
(`docs/prototype-build/prototype-review/02-schedule-entities.md`). Claimed notable, held at notable.

**Claim as made.** `addAnaesthetist` correctly creates the master row and generates two Lists per
day from today to the horizon end, and the admin Add flow tells the user so, but the Day view's
roster is built by mapping over the static seed cast array `ANAESTHETISTS` rather than the live
master (`src/apps/admin/AdminApp.tsx:53-56`), for both sort modes. A runtime-added anaesthetist
therefore has no row, while the header summary counts distinct anaesthetists from the day's Lists,
so the strip reads "15 anaesthetists" above 14 rows. Mobile Availability and Master data both read
the live master and do show them. The flow's own docblock asserts the opposite of the behaviour
(`src/apps/admin/flows/AddAnaesthetistFlow.tsx:17`).

**Verifier evidence.** `src/apps/admin/AdminApp.tsx:6,50-59` and `:82-86`;
`src/apps/admin/components/DayGrid.tsx:51-54,100-102`; `src/store/mastersActions.ts:241-305`;
`src/apps/admin/flows/AddAnaesthetistFlow.tsx:16-18,54-57`.

**Verifier reasoning.** Verified independently in `DayGrid`, which the reviewer had not read: rows
come from the `anaesthetists` prop only, and that prop is `ANAESTHETISTS.map(...)` for both sort
modes, with a comment explaining the cast-array order is deliberate (roster order matching the Tue
21 mockup). A runtime-added registration number is not in the cast array, so it can never yield a
row; `DayGrid.tsx:100-102` even hardcodes "Showing the demo's 14 anaesthetists" while
`AdminApp.tsx:82-86` counts from the day's Lists, producing the 15-versus-14 mismatch.
`addAnaesthetist` does create the master row plus forward Lists, and the flow copy promises the grid
gains rows. Not demo-blocking: a grep of `docs/demo-guide` finds no "add anaesthetist" beat, so it
only bites off-script.

## 03.1 · CONFIRMED · PARTIAL · notable

**The governing-contract picker is unfiltered by route and holder.** Slice 03
(`docs/prototype-build/prototype-review/03-billing-routes-and-master-data.md`). Claimed notable,
held at notable.

**Claim as made.** Automatic resolution is correctly counterparty-based, but the office override
picker at `shared/flows/EditBillingSetupSheet.tsx:169-179` maps `Object.values(contracts)` into the
select with no filter on route, List hospital or holder kind, and the billing run derives the
invoice counterparty from the picked contract's holder
(`domain/billing/invoiceBuild.ts:186-207`). A billableParty- or surgeon-held contract can therefore
be picked on a hospital-route procedure and silently redirect the invoice, and no `reviewFlag`
catches an incoherent holder. `PROGRESS.md` handoff item 1 (P1) records this exact issue as parked,
not excluded.

**Verifier evidence.** `aa-prototype/src/shared/flows/EditBillingSetupSheet.tsx:169-179`;
`src/domain/billing/invoiceBuild.ts:183-207` (`counterpartyForProcedure` returns
`{kind: resolvedContract.holderType, id: resolvedContract.holderId}`);
`docs/prototype-build/PROGRESS.md` handoff item (P1).

**Verifier reasoning.** Verified the mechanism end to end rather than the picker alone: the select
has no route, holder or hospital predicate, and on the contract-holder route the invoice
counterparty **is** the resolved contract's `holderType` / `holderId`
(`invoiceBuild.ts:203-205`), so a wrong pick redirects both the invoice and its layout. PROGRESS's
handoff list records exactly this as open item (P1), "Holder-coherence advisory flag ... deferred
again", with the same failure example, so OUT-OF-SCOPE is not available. Notable rather than
demo-blocking: it requires the office to make a wrong pick, and PROGRESS states none of the handoff
items blocks S1 to S5.

## 04.1 · CONFIRMED · PARTIAL · notable

**A Free List that receives a booking is never repainted, so its Cards are invisible in both
anaesthetist apps.** Slice 04
(`docs/prototype-build/prototype-review/04-design-principles-and-open-questions.md`). Claimed
notable, held at notable.

**Claim as made.** No runtime action paints private/public/preop onto a List: `editList`'s
`ListPatch` deliberately excludes `statusKey` (PROGRESS Phase 06 decision 5), so an office
phone-advice booking leaves `statusKey='free'` while setting hospital, times and a Card. The admin
day grid compensates with a derived display (`DayGrid.tsx:110-111`), but the two anaesthetist
surfaces do not: `ForwardListsScreen.tsx:104-118` renders any free List as "Free session · Open for
bookings or cover" with no card count and no drill-in, and `ListsScreen.tsx:50/:72` marks the row
non-clickable. The Card the office just booked is unreachable from both anaesthetist apps,
contradicting `docs/demo-guide/03-demo-script.md` S2 Beat 2's stated expected result.

**Verifier evidence.** `src/store/lifecycle.ts:490-523` (`ListPatch` excludes `statusKey`);
`src/apps/admin/flows/PhoneAdviceBooking.tsx:27-32,68-72`;
`src/apps/mobile/screens/ForwardListsScreen.tsx:103-118`;
`src/apps/web/screens/ListsScreen.tsx:50,70-72`; `src/apps/web/components/WeekStrip.tsx:45,149`;
`src/apps/web/screens/DashboardScreen.tsx:74-81`; `docs/demo-guide/03-demo-script.md:100-107`.

**Verifier reasoning.** Confirmed and slightly broader than claimed.
`ListPatch = Partial<Pick<List,'hospitalId'|'surgeonId'|'startTime'|'endTime'|'notes'>>`, so no
runtime action can repaint `statusKey`, and `PhoneAdviceBooking` only calls `editList` with
hospital, surgeon and times. Only `DayGrid` derives a booked display. Beyond the two surfaces cited,
the web `WeekStrip` also renders such a List as "Free / Open for cover" and non-clickable, and the
dashboard day summary counts only private/public/preop Lists, so the booked Card is missing from the
greeting line too. Demo script Beat 2 asserts "the new Card appears on that List, immediately
visible in the anaesthetist's app", and `PhoneAdviceBooking`'s own docblock says "appears in the
anaesthetist's own views". Notable, not blocking: the presenter must pick Souter's own Free slot and
then switch apps to see it.

## 04.3 · CONFIRMED · PARTIAL · notable

**The seeded audit trail is too thin to demonstrate principle 10, and S5 Beat 1 over-promises.**
Slice 04. Claimed notable, held at notable.

**Claim as made.** The audit mechanism is complete and provable, but the seed writes audit rows only
for staged lifecycle facts (PROGRESS decision 2026-07-23 "Seed audit is minimal"): 37 entries
against 170 Cards and 173 Procedures. David Chen's Card, the one the guided script points at, is
seeded with exactly one `card.complete` entry, and its "T adjusted +1 manually" story is seeded as
state, not as an audit row. Yet `DemoControlPanel.tsx:457` (S5) says "open David Chen's much-edited
Card History for the full audit trail" and `docs/demo-guide/03-demo-script.md` S5 Beat 1 promises "a
full audit trail, including the manual time-unit adjustment provenance". From a pristine reset the
History sheet shows one line.

**Verifier evidence.** `aa-prototype/visual/shots/demo-data.png` (170 cards / 173 procedures / 37
audit); `aa-prototype/visual/shots/a7-08-history.png` (Card history sheet with a single
`card.complete` line); `src/domain/seed/cards.ts:195-208, :282-295, :368-391`;
`src/apps/demo/DemoControlPanel.tsx:449-457` (S5 is a plain `resetDemo`).

**Verifier reasoning.** Verified from the seed and the shots. The only audit writers in
`seed/cards.ts` are the `card.complete` branch, the soft-cancel branch and `addListAudit` for
submits; there is no procedure-level or billing-line-level seed audit, so the History sheet's merged
card plus procedure plus line query has nothing extra to show. `demo-data.png` confirms 37 audit
rows against 170 cards, and `a7-08-history.png` shows a real Card history rendering exactly one
entry. Chen's card is seeded `auditComplete: true` with `timeUnitsOverride: 4` as state, not as an
audited override, so from a pristine S5 reset the "much-edited Card History" promise cannot be met.
Notable: the mechanism is sound, but a guided compliance beat visibly under-delivers.

## 05.1 · CONFIRMED · PARTIAL · notable

**The one-Card-many-invoices case is not on the guided demo path.** Slice 05
(`docs/prototype-build/prototype-review/05-card-anchor-and-list-approval.md`). Claimed notable, held
at notable.

**Claim as made.** The rule is implemented, seeded and tested (`invoiceBuild.ts:397-427`; the seeded
two-funder Card at `cards.ts:588-618` bills nib $132.50 plus St George's $79.50, asserted in
`billingRun.test.ts:278`; the monitor prints "2 invoices raised."). What is absent is the demo path:
scenario S3 stages Souter's Mon 20 Jul AM List and calls it "the split-billing List", but that
List's split Card has both Procedures on the Forte hospital route and therefore correctly yields one
invoice, while `docs/demo-guide/03-demo-script.md:151` instructs the presenter to show separate
invoices on that staged List. The two-funder Card sits on the Mon 20 PM List, which S3 does not
submit. The Invoices table also has no Card column.

**Verifier evidence.** `src/domain/seed/cards.ts:510-542` (Souter Mon 20 AM split card: both
procedures `billingRoute 'hospital'`, `CONTRACT.forteDefault`) versus `:583-618` (two-funder card on
Mon 20 PM, nib $132.50 / patient $79.50); `src/apps/demo/DemoControlPanel.tsx:417-429` (S3 submits
`listIdForSlot(ANAE.souter,'2026-07-20','AM')`); `docs/demo-guide/03-demo-script.md:141-151`;
`src/apps/admin/screens/InvoicesScreen.tsx:113-118`.

**Verifier reasoning.** Confirmed by reading the seed both sides of the boundary. S3 stages only the
AM List, whose "split-billing Card" is two hospital-route Forte procedures and therefore correctly
yields one invoice; the two-funder Card that produces two invoices sits on the PM List, which S3
never submits, yet script Beat 1 tells the presenter to show separate invoices where funders differ
on the staged List. The Invoices table columns are Number, Raised, Counterparty, Layout, Total,
Status, so two rows cannot be attributed to one Card there. A mitigation was found but is not enough
to downgrade: the PM List is stageable off-script from the Data Inspector's guard console
(`DemoData.tsx:242,539` "Submit list"), which is not the guided path the claim is about.

## 09.4 · CONFIRMED · MISSING · cosmetic

**No acknowledgement is returned to the sending hospital system.** Slice 09
(`docs/prototype-build/prototype-review/09-health-systems-integration.md`). Claimed cosmetic, held
at cosmetic.

**Claim as made.** Nothing outbound exists: no ACK/MSA construction, no per-message acknowledgement
to the PAS, and no outbound interface at all. Delivery guarantees are demonstrated inbound only
(store-then-process, MSH-10 dedupe, `MAX_ATTEMPTS=3` with auto-retry, dead-letter, manual
intervention). PROGRESS's 2026-07-24 Phase 11 review-fix entry records that the monitor copy
deliberately dropped its earlier "acknowledged per message" claim, so nothing on screen over-claims;
the RFP frames this as a "describe your approach" ask (line 1783).

**Verifier evidence.** `grep -rn 'MSA|acknowledg'` over `aa-prototype/src` returns only
`IntegrationMonitorScreen.tsx:36` (a docblock, not rendered);
`src/apps/admin/screens/IntegrationMonitorScreen.tsx:44-50` (rendered intro: stored on receipt,
processed, retried with a dead-letter queue, no ack claim); `src/store/integrationActions.ts:226-298`
(inbound only); `docs/prototype-build/phases/phase-11-integrations.md:90`.

**Verifier reasoning.** Genuinely absent: no MSA/ACK construction, no outbound interface, and the
message pipeline is inbound-only. The recorded decision only removed the over-claim from rendered
copy rather than scoping the capability out, and the phase plan had actually asked for the ack
posture to be noted in UI copy, so this is not OUT-OF-SCOPE. Cosmetic stands: the RFP frames it as a
describe-your-approach item, section 10 fences real endpoints, and the rendered copy no longer
over-promises, though the screen's docblock at line 36 still lists "per-message acknowledgement" as
surfaced posture, which is now stale.

## 10.2 · CONFIRMED · MISSING · cosmetic

**The "open" vs "genuinely overdue" decision is not raised as a discovery item.** Slice 10
(`docs/prototype-build/prototype-review/10-nhi-and-patient-identity.md`). Claimed cosmetic, held at
cosmetic.

**Claim as made.** RFP lines 1978-1979 explicitly say "Decide whether to separately distinguish
'open' vs 'genuinely overdue' in this filter." The prototype implements a single boolean
(`caseOutstandingAmount > 0`) with the tooltip "This patient has an unpaid prior episode (intake
check)" and neither picks a reading nor flags the decision anywhere, which is inconsistent with the
prototype's own habit of surfacing every other Appendix 1 / Appendix 2 open item on screen. Aging
machinery exists elsewhere but is not wired to this check.

**Verifier evidence.** `RFP.md:1978-1979`; `src/store/selectors.ts:280-291`
(`patientHasOutstandingPriorEpisode` returns a plain boolean off `caseOutstandingAmount > 0` with no
aging input); `src/apps/admin/screens/BillingMonitorScreen.tsx:200-204` (single "Prior balance" chip
with the intake-check tooltip); `REQUIREMENTS.md` section 11 read in full, the item is in neither the
tensions list nor the "Pure discovery items" paragraph.

**Verifier reasoning.** Verified end to end. The intake check itself is built and correct, but it
collapses the RFP's explicit either/or into one boolean and the decision is raised nowhere: not in
REQUIREMENTS section 11, not among the ten cheat-sheet ambiguity items
(`docs/demo-guide/04-presenter-cheat-sheet.md:202-266`), and not as a UI callout, even though the
aging machinery to distinguish the two readings already exists in the same file
(`receivablesAgingFor` / `bucketForAgingDays`) and even though the neighbouring Appendix 1 and 2 open
items are surfaced (`DemoXero.tsx:58-70`; `xeroHandoff.ts:41-42`). MISSING is the right status for
the discovery-flag obligation, cosmetic the right severity: the chip works and no money is wrong.

## 01.3 · CONFIRMED · PARTIAL · cosmetic

**Audit viewer lists entries in insertion order, not chronological order.** Slice 01
(`docs/prototype-build/prototype-review/01-nfr-reporting-and-app-screens.md`). Claimed cosmetic,
held at cosmetic.

**Claim as made.** The NFR ("audit trails of manual and automated actions are required", RFP line
356) is met, but the admin Audit viewer does not sort: `return rows.slice().reverse() // newest
first` (`src/apps/admin/screens/AuditViewer.tsx:41`) assumes insertion order equals chronological
order, which the seeded audit does not satisfy. `a7-07-audit.png` shows the AT column reading
2026-07-17, 07-16, 07-16, 07-16, 07-14, 07-09, 07-16, 07-15, 07-14, 07-20, 07-20, 07-20. Runtime
entries appended during a demo still land at the top.

**Verifier evidence.** `src/apps/admin/screens/AuditViewer.tsx:41`; `visual/shots/a7-07-audit.png`.

**Verifier reasoning.** Verified independently and could not find a sort anywhere: a repo-wide grep
for `atISO` combined with `sort`/`localeCompare` returns no hit in any audit-rendering path, and the
shared per-entity timeline (`src/shared/card/HistoryTimeline.tsx`) is documented as "oldest first"
but likewise only renders the array it is handed (`HistorySheet.tsx:33-36` filters, never sorts).
The screenshot proves the seeded feed is not chronological, so the "newest first" comment is wrong
for seeded rows. Severity is right: the NFR itself is met, and runtime entries do land at the top, so
the live audit beat is unaffected.

## 02.1 · CONFIRMED · PARTIAL · cosmetic

**The `Anaesthetist` active flag is inert: the canvas is generated for every anaesthetist, active or
not.** Slice 02. Claimed cosmetic, held at cosmetic.

**Claim as made.** The RFP says the structure is created "for every active Anaesthetist".
`Anaesthetist.active` is typed (`src/domain/types.ts:150`), seeded true for all 14, displayed as an
Active column and made editable, with the Master data subheading advertising it as editable. No
module reads the flag for behaviour: the canvas generator receives every anaesthetist id unfiltered
both at seed time (`src/domain/seed/index.ts:333`) and on every roll-forward
(`src/store/clockActions.ts:42`), and the admin day-grid roster does not filter on it. Setting
someone inactive changes one table cell and nothing else.

**Verifier evidence.** `src/domain/types.ts:150`; `src/domain/seed/cast.ts:45-58`;
`src/apps/admin/screens/MasterData.tsx:175-184`; `src/store/mastersActions.ts:176,270`;
`src/domain/seed/index.ts:333`; `src/apps/admin/AdminApp.tsx:50-59`.

**Verifier reasoning.** A repo-wide grep for the domain flag (filtering UI-local `active` variables
in `AppSwitcher`, `GradientLab`, `Field`, `AsaCard`) returns only the type, the 14 seeded
`active: true` rows, the MasterData Active column plus its "active flag are editable" subheading,
and the `editAnaesthetist` patch. No behavioural read anywhere: `active` does not appear in
`src/domain/seed/canvas.ts` or `src/store/clockActions.ts` at all, the seed passes
`ANAESTHETISTS.map((a) => a.registrationNumber)` unfiltered, and the day-grid roster has no filter.
Nothing in REQUIREMENTS sections 10 or 11 or the Decisions log scopes the flag as display-only, so
the claim stands, at cosmetic severity since all 14 seeded anaesthetists are active.

## 02.5 · CONFIRMED · PARTIAL · cosmetic

**An informational insurer on the Hospital route cannot be recorded and is actively cleared.** Slice
02. Claimed cosmetic, held at cosmetic.

**Claim as made.** The RFP says insurer "may otherwise be recorded informationally when noted by the
hospital under the Hospital route". The type is route-agnostic (`Procedure.insurerId`,
`src/domain/types.ts:456`) and read paths display it on any route, but every write path forbids it:
both route editors set `patch.insurerId` only when the route is insurer
(`EditBillingSetupSheet.tsx:109`, `EditProcedureSheet.tsx:52`), the manual card form behaves the
same, no seeded hospital-route procedure carries one, and the integration paths never set an insurer
at all.

**Verifier evidence.** `src/shared/flows/EditBillingSetupSheet.tsx:109,128-147`;
`src/shared/flows/EditProcedureSheet.tsx:52`; `src/shared/flows/ManualCardForm.tsx:105`;
`src/domain/seed/cards.ts:717-737` and `:1110-1124`; `src/store/cardActions.ts:137`.

**Verifier reasoning.** Re-checked every write path plus places the reviewer did not look. The store
action is in fact route-agnostic (`cardActions.ts:137` sets `procedure.insurerId` from input
regardless of route, and `:224/:348/:428` copy it forward), so the restriction is purely at the UI
layer: both sheets wipe it off-route and the insurer select renders only under `route === 'insurer'`.
The plan's "informationally-noted insurer" seed item is realised as prose on a billableParty-route
card ("patient to claim from AIA Health"), not as `insurerId`. So a hospital-route informational
insurer genuinely cannot be recorded through any UI, and switching route silently clears it.
Cosmetic: the read paths handle it and no seeded data depends on it.

## 02.6 · CONFIRMED · PARTIAL · cosmetic

**The admin day-view List drawer lists Cards by id, not in time order, and shows no times.** Slice
02. Claimed cosmetic, held at cosmetic.

**Claim as made.** The RFP requires a List's Cards to be "displayed in time order". The four working
views sort explicitly on `scheduledTime` with an id tiebreak and render the time. The shared
selector `cardsForList` sorts by `c.id` (`src/store/selectors.ts:71-75`) and the day-view drawer
repeats that local id sort (`src/apps/admin/components/ListDrawer.tsx:31-33`) while showing only
patient name and completion state, with no scheduled time at all. Because runtime ids are allocated
sequentially, a Card added out of chronological order lands at the bottom regardless of its time.

**Verifier evidence.** `src/apps/admin/components/ListDrawer.tsx:30-33`
(`.sort((a, b) => a.id.localeCompare(b.id))`) and `:74-92` (card row renders patient name plus
Completed / In progress only); `src/store/selectors.ts:70-74`; contrast
`src/apps/mobile/screens/ListDetailScreen.tsx:65` and `src/apps/web/screens/ListDetailView.tsx:52`,
which both sort on `(a.scheduledTime ?? '99:99')` with an id tiebreak.

**Verifier reasoning.** Verified by reading `ListDrawer.tsx` in full (the reviewer's grep for
`scheduledTime` on it correctly returns nothing) and by confirming the two time-ordered comparators
the claim cites really exist. Seeded ids happen to run in time order, so the mis-order only shows
for a runtime-added Card (phone-advice booking, S12, or `reassignCard` moving one in), which is
exactly the claim. Severity is right: it is a drawer summary list, the office can still open each
card, and the views the RFP's "displayed in time order" most obviously targets all comply.

## 03.2 · CONFIRMED · PARTIAL · cosmetic

**List Status colour is not a field of the master and is not shown on the master screen.** Slice 03.
Claimed cosmetic, held at cosmetic.

**Claim as made.** RFP lines 693-694 name colour as a field of the List Status master.
`domain/types.ts:606-610` defines `ListStatus` as key, label and description only, and
`apps/admin/screens/MasterData.tsx:451-468` renders Key / Label / Description with no swatch, so no
app surface displays or edits a status colour as master data. Colour is modelled separately in
`theme/statusColours.ts:39` and held key-for-key by `domain/statusKeyParity.test.ts`.

**Verifier evidence.** `src/domain/types.ts:605-610`;
`src/apps/admin/screens/MasterData.tsx:455-467` (table heads `['Key','Label','Description']`, no
swatch); a grep for `statusColour` / `StatusChip` / `swatch` / `legend` in `MasterData.tsx` returns
only the `:456` sub-line word "legend"; `visual/shots/a7-04-masters.png`; `RFP.md:693-694` "Fields:
description, colour. (to be confirmed)".

**Verifier reasoning.** Accurate, and no colour swatch exists on any master-data surface. Worth
noting for the record that the omission is architecturally deliberate: PROGRESS binding convention
10 states the colour legend "is defined once in `src/theme/statusColours.ts` ... and used by all
three apps", with `domain/statusKeyParity.test.ts` holding the theme and domain key sets identical,
so colour is single-sourced in the theme layer rather than duplicated as an editable master field.
The RFP does name colour as a field of that master and hedges it "(to be confirmed)", so the
cosmetic rating and PARTIAL status both stand; a one-cell swatch column would close it.

## 03.4 · CONFIRMED · PARTIAL · cosmetic

**An informational insurer cannot be recorded on the Hospital route.** Slice 03. Claimed cosmetic,
held at cosmetic. (Same defect as 02.5, raised independently by a second reviewer; both are recorded
here rather than merged, because they were verified separately.)

**Claim as made.** RFP lines 606-607 (and 576-577) allow an insurer to be noted informationally
under the Hospital route. `Procedure.insurerId` is an independent nullable field so the model allows
it, but `EditBillingSetupSheet.tsx:109` sets `patch.insurerId` to `undefined` unless
`route === 'insurer'` and only renders the insurer picker on that route; `ManualCardForm.tsx:105`
behaves identically. No seeded card pairs a hospital route with an insurer. Rating and invoicing are
unaffected; `billingReference` does capture the hospital's contract reference.

**Verifier evidence.** `src/shared/flows/EditBillingSetupSheet.tsx:109` and `:128-129`; identical
logic at `src/shared/flows/EditProcedureSheet.tsx:52` and `src/shared/flows/ManualCardForm.tsx:105`;
`RFP.md:576-577`.

**Verifier reasoning.** Widened the search to every `insurerId` consumer in `src/apps` and
`src/shared` and found only three writers, all of which coerce `insurerId` to `undefined` off the
insurer route, so switching a procedure to the Hospital route provably clears any noted insurer. The
display side would already cope (`src/shared/card/OfficeBillingSetup.tsx:42` and
`src/shared/capture/BtmCaptureBlock.tsx:94` both resolve `procedure.insurerId` unconditionally),
which makes this a two-line UI gap rather than a model gap. Nothing in REQUIREMENTS section 10 or 11
or the Decisions log excludes it.

## 04.4 · CONFIRMED · PARTIAL · cosmetic

**`Anaesthetist.active` is an editable flag with no behaviour behind it.** Slice 04. Claimed
cosmetic, held at cosmetic. (Second, independent raise of 02.1.)

**Claim as made.** RFP principle 1 says "every ACTIVE Anaesthetist has exactly two Lists projected
forward", but the canvas generator projects for every anaesthetist in the masters record regardless
of the flag: `clockActions.ts:42` passes `Object.keys(state.masters.anaesthetists)` and
`mastersActions.ts:273-280` does the same for a newly added one. The flag is read only for display
and for the edit control, so setting an anaesthetist inactive is a visible no-op. Nothing in the
demo script toggles the flag.

**Verifier evidence.** `grep -rn '\.active\b|active:' src` (excluding `isActive` / `activeTab`): the
only reads outside seed, type and tests are `src/apps/admin/screens/MasterData.tsx:184` and
`src/apps/admin/flows/EditAnaesthetistSheet.tsx:23/32/48`; `src/store/clockActions.ts:42`;
`src/domain/seed/canvas.ts:101` iterates `masters.anaesthetistIds` unfiltered;
`src/store/mastersActions.ts:270` (`active: true`); `visual/shots/a7-04-masters.png`.

**Verifier reasoning.** Verified from the other end: `canvas.ts`'s generator consumes a flat
`anaesthetistIds` array with no activity predicate, and `clockActions.ts` hands it every key of
`masters.anaesthetists`, so the flag provably does not gate projection. No selector, day grid or
availability grid reads it either; the only test touching it
(`mastersActions.test.ts:45-50`) asserts the write, not any consequence. Severity is right: all
seeded anaesthetists are active, `addAnaesthetist` hardcodes `active: true`, and no demo beat
toggles it, so the no-op is never exercised in front of an audience. RFP principle 1's "every ACTIVE
Anaesthetist" is satisfied vacuously rather than enforced.

## 05.2 · CONFIRMED · PARTIAL · cosmetic

**The sanity-check screen flags reference completeness, shows Contract by column, exposes Insurer
only via the Route label, and offers no fix path.** Slice 05. Claimed cosmetic, held at cosmetic.

**Claim as made.** RFP line 898 names the office check as "typically Contract, Insurer, and
reference completeness". `reviewFlags.ts:62-116` builds flags for not-completed, missing billing
reference, the ACC advisory, pre-payment state and manual B/T/M override provenance;
`ReviewScreen.tsx:221-222` shows Route and the resolved Contract name. Absent: any insurer column or
insurer-specific flag; any pre-authorisation flag for an unresolvable contract on a
surgeon/group/organisation holder; and any drill-down from the review row to the Card.

**Verifier evidence.** `src/apps/admin/reviewFlags.ts:63-116` (five flag kinds, none
insurer-specific); `src/apps/admin/screens/ReviewScreen.tsx:76-77` (`routeText` is `routeLabel`
only), `:205-207` (heads Time / Patient / Route / Contract / Code / Times / B·T·M / Units / Fee /
Flags) and `:229-233` (row actions are `FlagPill` plus History only); `src/shared/format.ts:43-45`;
`src/apps/admin/AdminApp.tsx:165` (ReviewScreen gets `onBack` / `onOpen` / `onViewInvoices`, no
`onOpenCard`, unlike `ListDrawer` at `:202`).

**Verifier reasoning.** All three sub-points hold after reading `ReviewScreen` top to bottom and
checking `AdminApp`'s wiring. The Route cell renders `routeLabel([...routes][0])`, the bare word
"Insurer", so which insurer and whether it accepts direct claims never reach this screen. The
Contract cell prints "None" with no tone, and `billingRun.test.ts:331` confirms an organisation-held
dated-out contract surfaces only later as a per-card billing exception. `AdminApp` mounts
`ReviewScreen` without any card-open callback, so the fix path really is Day view to List drawer to
Open. Severity is right: `reviewFlags.ts`'s header documents the RFP-grounded flag set as a
Decisions-log ruling, the capture validator already blocks a bad insurer upstream, and the office
can reach the card in two clicks.

## 05.3 · CONFIRMED · PARTIAL · cosmetic

**The Xero-as-add-on framing (separate instance, AR and banking only) is not stated in app copy.**
Slice 05. Claimed cosmetic, held at cosmetic.

**Claim as made.** RFP lines 833-837 make two explicit points: a separate Xero instance, and that it
provides accounts receivable and banking only, not general accounting. The behaviour matches, and
`DemoXero.tsx:56` says the sim is "the simulated Xero organisation the Billing Engine hands off to
... the apps never read this". But no on-screen copy states "separate instance" or "receivables and
banking only": a grep for separate, receivab, banking, ledger or general accounting across `src`
returns nothing, and `demo-xero.png` shows only the NHI, duplicate-invoice-number and archiving
callouts. The point depends on the presenter saying it.

**Verifier evidence.** `src/apps/demo/DemoXero.tsx:53-69` (subtitle plus the only two callouts:
NHI-never-in-Xero and duplicate-invoice-number) and `:152-159` (archiving callout);
`docs/prototype-build/REQUIREMENTS.md:88` (X1, "showing the separate AR/banking instance").

**Verifier reasoning.** Independently re-grepped the whole of `src` for the framing words: the only
"receivables" strings are the anaesthetist receivables-aging panel titles, and "separate" appears
only in unrelated copy (the invoice document's two-money-states note, the billing monitor's location
note). `DemoXero`'s subtitle describes what the org contains but never says separate instance or
AR-and-banking-only. X1 explicitly asks the sim to show "the separate AR/banking instance", so this
is a real requirement-level copy gap, cosmetic in effect since behaviour and the demo script both
carry the point.

## 06.1 · CONFIRMED · PARTIAL · cosmetic

**Base-unit table never reaches the RFP's stated top end.** Slice 06
(`docs/prototype-build/prototype-review/06-btm-calculation.md`). Claimed cosmetic, held at cosmetic.

**Claim as made.** The RFP says base values range roughly from 4 units to 20-22 units (major
vascular, neurosurgery), but the seeded RVG master spans only 3 to 11 units: the largest is 20880
gastric bypass (range 9 to 11), there is no neurosurgery anatomical site, the only vascular code is
34800 varicose veins at 4 units, and two codes (42702 cataract, 36561 cystoscopy) sit at 3 units,
below the RFP's stated floor. The logged "demo-plausible values" decision covers value accuracy, not
a deliberately truncated range.

**Verifier evidence.** `src/domain/seed/rvgCodes.ts:15-57` (all 34 codes; max is 20880 range 9 to
11; 42702 and 36561 both 3; only vascular code is 34800 at 4; `anatomicalSite` values are Abdomen,
Hip, Femur, Knee, Shoulder, Arm, Spine, Head and neck, Eye, Urinary tract, Skin, Chest wall, Leg,
with no neurosurgery); `RFP.md:973-980`.

**Verifier reasoning.** Verified by reading the whole seed file and the RFP range statement. The
seed's own header comment (`rvgCodes.ts:7`, "demo values within RFP-stated ranges") is contradicted
by the two 3-unit codes sitting below the RFP's stated 4-unit floor, and nothing approaches 20 to
22. REQUIREMENTS P10 asks only for "a curated RVG code subset (~30 codes across anatomical sites,
incl. range codes and position-absorbing codes)" and the 2026-07-22 ruling covers value provenance,
so no logged decision covers the truncated span. Severity is right: the maths, range prompting and
absorption behaviour are all demonstrated; only the headline spread is narrower than the RFP's prose.

## 06.3 · CONFIRMED · PARTIAL · cosmetic

**`accRelated` cannot be set by any user surface.** Slice 06. Claimed cosmetic, held at cosmetic.

**Claim as made.** The ACC flag is typed, seeded, displayed (web Accounts ACC column, mobile
Balances chip) and drives the authorisation advisory, but no UI writes it: a grep for `accRelated`
across all `.tsx` files returns display code only, `EditProcedureSheet` patches description, route,
insurer, category and reference but not ACC, and all four procedure-create paths hardcode
`accRelated: false`. A presenter can only demonstrate the ACC advisory on the seeded card.

**Verifier evidence.** `grep -rn accRelated src` (excluding tests): writers are only
`src/domain/seed/{cards,history}.ts`, `src/domain/billing/fixtures.ts` and four hardcoded
`accRelated: false` sites in `src/store/cardActions.ts:132/217/341/421`; readers are
`src/apps/web/screens/AccountsScreen.tsx:111`, `src/apps/mobile/screens/BalancesScreen.tsx:92/133`,
`src/apps/admin/reviewFlags.ts:85` and `src/store/selectors.ts:629`;
`src/shared/flows/EditBillingSetupSheet.tsx:107-112`.

**Verifier reasoning.** Confirmed with a wider net than the reviewer used: also checked the
integration write path (`src/store/integrationActions.ts:150-160` calls `createCard` with
`billingRoute 'hospital'` and never `accRelated`) and every shared flow, so no path (manual, photo,
phone-advice or HL7/FHIR) can set or clear the flag, and no card-detail surface even displays it. It
is technically patchable via `editProcedure` since
`ProcedurePatch = Partial<Omit<Procedure,'id'|'cardId'>>` (`src/store/lifecycle.ts:443`), just not
wired to a control. Severity is right: the flag is seeded on two cards plus the history ledger, and
the ACC advisory and the W4/Balances ACC chips all demo off that seed.

## 06.4 · CONFIRMED · PARTIAL · cosmetic

**ACC pre-op flat-fee code set not modelled or flagged as a discovery item.** Slice 06. Claimed
cosmetic, held at cosmetic.

**Claim as made.** The RFP names CS250, CS260 and CS70 as a possible ACC pre-operative-assessment
flat-fee code set and marks it a confirmation item. The app names none of them and offers only a
generic hint on the fixed-amount billing-line option ("e.g. an ACC pre-op flat fee",
`AddBillingLineSheet.tsx:85`). Unlike the time-rounding assumption, this RFP TBC is not surfaced
anywhere as a discovery talking point, though REQUIREMENTS B9 promised the codes would be "noted".

**Verifier evidence.** `grep -rn 'CS250|CS260|CS70'` over `aa-prototype/src`,
`docs/prototype-build/REQUIREMENTS.md` and `docs/prototype-build/phases/*.md` returns no hits;
`src/shared/capture/AddBillingLineSheet.tsx:83-87`; `REQUIREMENTS.md:84` (B9, "optional flat-fee
pre-op codes noted").

**Verifier reasoning.** Widened the search to the planning docs as well as `src`: the three code
names appear nowhere in the repo's prototype-build docs or the app, so they were never carried past
the RFP. In-UI discovery notes do exist for other TBCs (GST rate at `InvoiceDocument.tsx:204`, the
mod-24 label at `IntegrationMonitorScreen.tsx:414-418`, split-billing wording at
`InvoicesScreen.tsx:72`, the Xero duplicate-number setting), which makes the absence of an ACC
pre-op equivalent a genuine inconsistency against B9's "noted". The generic fixed-amount hint is the
only trace.

## 06.5 · CONFIRMED · PARTIAL · cosmetic

**M row caption still credits a modifier the base code absorbs.** Slice 06. Claimed cosmetic, held
at cosmetic.

**Claim as made.** `modifierBreakdown` at `shared/capture/UnitsCard.tsx:89-102` iterates
`selectedModifierCodes` and prints "+units" for every code with no absorption check, while the M
total correctly excludes absorbed codes. Reachable sequence: pick a non-absorbing code (20941), tap
the P1 chip, then change to 47516 (which absorbs P1). `ProcedureCodeCard.tsx:40-45` clears
`baseUnitsSelected` and `baseUnitsCaptured` but deliberately not `selectedModifierCodes`, so the
caption reads "AS1 +0 · P1 positioning +2" while the M stepper shows 0.

**Verifier evidence.** `src/shared/capture/UnitsCard.tsx:88-102` (`modifierBreakdown` iterates
`procedure.selectedModifierCodes`, skips only `asaClass`, prints `+${modifier.units}` with no
`absorbsModifierCodes` check) and `:68-71` (the same row shows `btm.modifiers.units` from
`resolveBtm` to `modifierUnits`, which does exclude absorbed codes, and uses `mBreakdown` as its
caption unless the source is overridden); `src/shared/capture/ProcedureCodeCard.tsx:40-45`.

**Verifier reasoning.** Reproduced the code path exactly as described. Caption and number are
computed by two different functions, `modifierBreakdown` (absorption-blind) versus `modifierUnits`
via `resolveBtm` (absorption-aware), and `ProcedureCodeCard.pick` deliberately leaves
`selectedModifierCodes` intact. Worth adding for whoever fixes it: the same stale selection also
leaves the P1 chip struck through **and** disabled (`ModifierChips.tsx:46-48` sets inert for absorbed
chips), so the user cannot deselect it to clear the caption. Mitigating, and why cosmetic is right:
`ModifierChips.tsx:72-75` renders the domain's verbatim absorption refusal reason directly beneath
the chips, so the explanation is on screen immediately below the misleading caption.

## 06.6 · CONFIRMED · PARTIAL · cosmetic

**Admin review footer labels one unit rate on a list that priced at two.** Slice 06. Claimed
cosmetic, held at cosmetic.

**Claim as made.** `apps/admin/screens/ReviewScreen.tsx:92` and `:248` print
"@ $<anaesthetist unitValue>/unit (list rate)" on the totals row. On the seeded Morrison list this
reads "@ $35.00/unit (list rate)" beside "50 units / $1,660.00", but the ACC Type 2 card on that same
list priced at $25.00 per unit, so 50 x $35.00 = $1,750.00, not $1,660.00. Per-card fees are correct;
only the footer label invites a mismatched multiplication.

**Verifier evidence.** `src/apps/admin/screens/ReviewScreen.tsx:92`
(`const unitRate = anaesthetist?.unitValue ?? 0`) and `:248`;
`aa-prototype/visual/shots/a7-08-history.png` (Totals row: 50 units, $1,660.00, "@ $35.00/unit (list
rate)", with Gavin Brown's ACC row 9 units / $225.00 = $25/unit); `src/domain/seed/cast.ts:55`.

**Verifier reasoning.** Reproduced directly from a screenshot the reviewer cited only for another
purpose: `a7-08-history.png` shows the Morrison review table with the totals row reading 50 units /
$1,660.00 next to "@ $35.00/unit (list rate)", while the ACC Type 2 row on the same list prices 9
units at $225.00. `ReviewScreen.tsx:92` takes the label straight from the anaesthetist master,
unaware of contract-derived rates, so the footer invites 50 x 35 = $1,750. Per-card fees are correct;
label only.

## 07.1 · CONFIRMED · PARTIAL · cosmetic

**Contract price rows cannot be keyed by surgeon in the UI.** Slice 07
(`docs/prototype-build/prototype-review/07-invoicing-methods-and-payments.md`). Claimed cosmetic,
held at cosmetic.

**Claim as made.** The RFP's contract price list should be keyable by holder, surgeon and/or
procedure type. `ContractPrice` carries `surgeonId` and `matchContractPrice` scores it, but the admin
price-row editor exposes only RVG code, ordinal and price, and no seeded `ContractPrice` row sets
`surgeonId`, so the surgeon-keyed price row is engine-only and never demonstrated. The surgeon case
is separately visible by holder (the seeded Doyle-held bariatric Type 3), and procedure type is
represented by `rvgBaseCode` as a logged demo simplification.

**Verifier evidence.** `src/domain/billing/contracts.ts:64` (`ContractPrice.surgeonId?`) and
`:92-93` (`matchContractPrice` scores it); `src/apps/admin/flows/ContractEditSheet.tsx:232-247`
(`addContractPrice` passes only `contractId`, `rvgBaseCode`, `procedureOrdinal`, `price`) and
`:277-284` (the Add-row controls are a code select, an "ord" input and a "price" input), `:256`
(existing-row display prints `{rvgBaseCode ?? 'any'}` plus ordinal only);
`grep surgeonId src/domain/seed/contracts.ts` returns no match.

**Verifier reasoning.** Verified: the engine really does support the surgeon key
(`contracts.ts:92-93` skips a row whose `surgeonId` does not equal `query.surgeonId`) and the editor
really cannot produce such a row, nor does any seeded row set it, so that third of the RFP's
"holder, surgeon and/or procedure type" keying is engine-only. Severity is right and the claim is
fair about the mitigations: the surgeon case is visible by holder, procedure type is a logged demo
simplification (PROGRESS fifth external review #3), and `matchContractPrice` is unit-tested, so
nothing in the demo computes a wrong fee.

## 07.2 · CONFIRMED · PARTIAL · cosmetic

**No office-side per-anaesthetist ledger view.** Slice 07. Claimed cosmetic, held at cosmetic.

**Claim as made.** The RFP's Agency Perspective says AA's internal accounting revolves around each
anaesthetist's ledger position (what is owing and what is owed). The prototype models this and shows
it on the anaesthetist surfaces, and every invoice reads "Billed by Anaesthesia Associates as agent
for Dr X". But the admin app has no per-anaesthetist ledger screen: the billing monitor groups by
List with the anaesthetist name only as a heading, the Invoices table has no anaesthetist column or
filter, and the payables run reports one aggregate figure. The only office-visible per-anaesthetist
money is the Payee column in the demo-badged Xero simulator.

**Verifier evidence.** `src/store/payablesActions.ts:35-46` (`payablesDue` returns only
`{count,total}`) and `:55-140` (`runPayables` reports `disbursedCount` / `totalDisbursed` only);
`src/apps/admin/screens/BillingMonitorScreen.tsx:126,163`;
`src/apps/admin/screens/InvoicesScreen.tsx:113-118`; `src/apps/demo/DemoXero.tsx:122-136`.

**Verifier reasoning.** Checked the money layer rather than the screens: `payablesDue` and
`runPayables` are both purely aggregate over ACCPAYs with no per-payee grouping, and the monitor uses
the anaesthetist only as a List heading. The Invoices table columns carry no anaesthetist. The
per-anaesthetist money story genuinely lives on the anaesthetist surfaces plus the Xero sim's Payee
column. As the claim notes, no A-series requirement asks for an office ledger view and sections 10
and 11 do not exclude it either, so it stays a real but unscoped cosmetic gap.

## 08.1 · CONFIRMED · PARTIAL · cosmetic

**The ACCPAY's "Buyer Generated Tax Invoice" framing is absent.** Slice 08
(`docs/prototype-build/prototype-review/08-xero-integration.md`). Claimed cosmetic, held at cosmetic.

**Claim as made.** The ACCPAY behaviour is complete (drafted at handoff, authorised on payment,
disbursed by the payables run) and the agency wording is on the invoice
(`InvoiceDocument.tsx:129-131`), but the RFP's own accounting term for the record appears nowhere in
the app or the presenter material, against binding convention 10 (RFP vocabulary exactly as the RFP
uses it).

**Verifier evidence.** `grep -rni 'buyer generated|buyer-generated|BGTI' docs/ aa-prototype/src`:
the only source-document hit is `RFP.md:1399` ("This is effectively a form of a Buyer Generated Tax
Invoice"); no hit anywhere in `aa-prototype/src` or `docs/demo-guide`;
`src/apps/admin/screens/InvoiceDocument.tsx:129-131` carries the agency wording instead.

**Verifier reasoning.** The grep result is reproducible and the term genuinely appears nowhere in the
app or presenter material, and convention 10 gives the claim a hook. In fairness the RFP uses BGTI as
a parenthetical accounting aside about the ACCPAY, not as a modelled entity name; the RFP's own
working term throughout is ACCPAY, which the prototype uses verbatim everywhere, and the ACCPAY
behaviour is complete and test-pinned. Cosmetic is right: one sentence in the Xero sim intro would
close it.

## 08.4 · CONFIRMED · PARTIAL · cosmetic

**The mobile GST peek ignores the anaesthetist's own GST period.** Slice 08. Claimed cosmetic, held
at cosmetic.

**Claim as made.** The web Accounts screen fully honours the requirement (defaults to
`masters.anaesthetists[id].gstPeriod` and offers monthly, bi-monthly and six-monthly,
`AccountsScreen.tsx:146-166`). The mobile Balances tab's GST section is hardcoded to the current
calendar month (`BalancesScreen.tsx:41`) and never reads `gstPeriod`, so for Dr Ben Whitaker, the one
seeded six-monthly anaesthetist, the mobile figure would not match his return period. Mitigating:
the demo persona is seeded monthly, the section is honestly labelled "GST this month", and the source
docblock states the web screen owns the period selector.

**Verifier evidence.** `src/apps/mobile/screens/BalancesScreen.tsx:18-23,41-45,74-77,98-124`;
`src/apps/web/screens/AccountsScreen.tsx:145-166`; `REQUIREMENTS.md:53` (M11);
`src/domain/seed/cast.ts:56`; `src/shell/appConfig.ts:27,47`.

**Verifier reasoning.** Confirmed, and the shortfall is actually against a mobile requirement rather
than only the master flag: M11 sits in REQUIREMENTS section 3 (Anaesthetist Mobile App) and asks for
the GST activity report "period selectable monthly/bi-monthly/six-monthly". The mobile section renders
the right rows (amount received, GST component, total) but no selector and a hardcoded calendar
month. Severity stays cosmetic: the mobile persona is hardwired to Souter (`appConfig.ts:27,47`), who
is monthly, so the Whitaker mismatch is unreachable in the demo, the label is honest, and the web
screen implements the selector fully.

## 09.6 · CONFIRMED · PARTIAL · cosmetic

**An S13 to a session the anaesthetist does not hold silently degrades to a time-only edit.** Slice
09. Claimed cosmetic, held at cosmetic.

**Claim as made.** In `integrationActions.ts:179-201` a cross-day S13 resolves its target with
`listForSlot(currentList.anaesthetistId, parsed.scheduledDateISO, timeToSession(...))`. When that
anaesthetist has no List on the new date, `target` is `undefined` and control falls through to the
same-List branch, which applies only `scheduledTime`: the Card keeps its original day and session,
the date component is discarded with no trace, and the monitor reports processed instead of parking a
`manualIntervention` item as the no-match, locked-target and cancelled-target cases do. Not reachable
in the demo: the only cross-List S13 targets a List that exists.

**Verifier evidence.** `src/store/integrationActions.ts:178-201`
(`const target = parsed.scheduledDateISO !== undefined ? listForSlot(...) : undefined` then
`if (target !== undefined && target.id !== card.listId) {...}` falls through to the same-List branch,
which builds `patch.scheduledTime` only); contrast the explicit `refuse('noTargetList')` guard the
S12 path has at `:147-149`.

**Verifier reasoning.** The control-flow reading is exactly right: an undefined target is
indistinguishable from a same-List reschedule, so the date component is dropped and the message
reports processed rather than parking a manual-intervention item the way the other three failure
cases do (all have explicit `refuse()` calls, and S12 even has a dedicated `noTargetList` refusal, so
the asymmetry is clearly unintended). Reachability is narrower still than the claim allows: the fixed
canvas guarantees two Lists per anaesthetist for every day in the rolling four-month horizon, so
`listForSlot` only misses for a date outside that horizon. That, plus the one cross-List demo message
targeting an existing list, keeps this cosmetic: a latent robustness hole, not a demo defect.

## 10.3 · CONFIRMED · PARTIAL · cosmetic

**The sequential-to-randomised NHI issuance change is not narrated in any UI copy.** Slice 10.
Claimed cosmetic, held at cosmetic.

**Claim as made.** Appendix 1 lines 1815-1818, 1838 and 1840-1844 cover the range exhaustion, the
sequential-to-randomised issuance change, the 33 million additional identifiers and the
multiple-births privacy rationale. The prototype's validator copy
(`IntegrationMonitorScreen.tsx:414-418`) covers only the two shapes, the two algorithms, the mod-24
label discrepancy and the 1 July 2027 mandate. Structurally the rule is honoured (`generateNhi` is
random for both formats; seeded NHIs are non-sequential and mixed-format; `hiddenInternalId` is the
invariant key), so this is UI copy only.

**Verifier evidence.** `src/apps/admin/screens/IntegrationMonitorScreen.tsx:410-420` (validator copy:
two formats, mod-11 versus mod-23, the "Modulus 24" label discovery item, the 1 July 2027 dual-format
mandate, and nothing on exhaustion, randomisation, 33 million or multiple births);
`src/domain/nhi.ts:132-154` (`generateNhi` draws every character from the RNG for both formats).

**Verifier reasoning.** Verified both halves. The validator panel's explanatory paragraph is the only
NHI narration in the app and covers exactly the four points listed, so the issuance-history material
appears nowhere. Structurally the rule is honoured: `generateNhi` is random for both formats with
only the check character derived, and `hiddenInternalId` remains the invariant key, so nothing sorts
or increments on the NHI. Copy only.

---

# DOWNGRADED

Ordered by verified severity, then by slice. In every case below the reviewer's facts survived
checking; what changed was the impact, because a logged decision, a governing convention or a
compensating surface absorbed it.

## 01.1 · DOWNGRADED · PARTIAL · notable to cosmetic

**Overdue view drops the Surgeon and Contract columns.** Slice 01.

**Claim as made.** The web Accounts to Overdue table renders Invoice / Patient / Payer / Raised /
Current / 31 to 60 / 61 to 90 / 90+ / ACC. Appendix 5's Overdue List, REQUIREMENTS W4 ("patient,
contract, surgeon, first account date, aging buckets, ACC flag") and
`phases/phase-05-anaesthetist-web-app.md:58` all name a Surgeon column and a Contract column. Neither
is rendered, and `AccpayInvoiceRow` carries no `surgeonId` and no `contractId`, so the data is not
even plumbed. No decisions-log entry records dropping them.

**Verifier evidence.** `src/apps/web/screens/AccountsScreen.tsx:88-96` (header row);
`src/store/selectors.ts:592-608` (`AccpayInvoiceRow` has no `surgeonId` / `contractId`);
`visual/shots/w-09-overdue.png`.

**Verifier reasoning.** Factually correct and irrefutable on the facts: a search of the whole tree
for another Overdue surface found only `src/apps/mobile/screens/BalancesScreen.tsx`, which also
renders no surgeon and no contract, and `AccpayInvoiceRow` genuinely carries neither field. Severity
was overstated, though: the RFP's own text for this screen (`RFP.md:2037-2041`, Appendix 5) asks only
for "a classic accounts outstanding view, ordered by date". The Surgeon and Contract columns come
from our own W4 restatement (`REQUIREMENTS.md:60`), the data is one join away (`list.surgeonId` is
already used at `selectors.ts:766`; the contract resolves via `procedureFee`, as the admin review row
proves), and nothing in the demo flow breaks. Two display columns on a secondary anaesthetist view.

## 02.3 · DOWNGRADED · PARTIAL · notable to cosmetic

**`lastModifiedBy` / `lastModifiedAt` are captured but never shown anywhere in the UI.** Slice 02.

**Claim as made.** Both fields are required on `Card` (`src/domain/types.ts:396-397`) and stamped by
the single mutation wrapper in lockstep with each audit entry, including procedure and billing-line
edits which stamp the parent Card (`src/store/mutate.ts:199`). No user-visible surface renders
either: the mobile card screen, web card detail, admin card detail, admin review table, day-view
drawer and the demo data inspector all omit them. The RFP names them as Card attributes precisely
because Cards are mutable from multiple sources.

**Verifier evidence.** `grep -rn lastModified src` returns hits only in `src/domain/types.ts:396-397`,
`src/domain/seed/{history,cards}.ts`, `src/domain/billing/fixtures.ts`,
`src/store/{mutate,cardActions,prepaymentActions}.ts` and tests, with no hit in `src/apps` or
`src/shared`; contrast `src/shared/card/CardDetailBody.tsx:276-284` (History button) and
`src/shared/card/HistorySheet.tsx`.

**Verifier reasoning.** The absence is real, including in the places the reviewer did not check: the
demo data inspector has no `lastModified` reference, and synonym copy ("last edit", "last changed",
"updated by", "changed by") returns nothing in `src/apps` or `src/shared`. But severity is overstated:
`mutate.ts` stamps the two fields in lockstep with the audit entry (pinned by a test), which makes the
last audit row the same information, and `CardDetailBody.tsx:276-284` puts a one-tap History
affordance on every card surface (mobile, web and admin all mount `CardDetailBody`) showing who,
role, source and before-to-after for the latest change. "Who touched this last" is one tap away on the
same screen, so this is a redundant-summary-field omission.

## 02.4 · DOWNGRADED · PARTIAL · cosmetic (substance narrowed)

**List Status master is a closed six-value enum; no available-for-emergency row and no add action.**
Slice 02.

**Claim as made.** A real `ListStatus` master exists, is seeded with six rows and has its own Master
data tab. Two shortfalls against the RFP: (a) there is no status for "available for emergency" or
on-call, so the demo carries it as free text in List and day notes and it cannot be filtered, counted
or coloured; (b) the tab is explicitly "A fixed enumerated set (view only)"
(`MasterData.tsx:456`) and the key union is compile-time, so the screen shows a reference table that
cannot take a new row, unlike every other master screen.

**Verifier evidence.** `src/domain/types.ts:53-61` (`LIST_STATUS_KEYS`) and `:605-610`;
`src/domain/seed/cast.ts:142-149`; `src/apps/admin/screens/MasterData.tsx:455-467`;
`visual/shots/a-01-day.png` (Ngata "Unavailable / Not available / ICU on call", Delaney "Free / keep
free, on call for ICU tonight"); `RFP.md:693-694`.

**Verifier reasoning.** Both observations are factually right, and the screenshot confirms on-call is
carried as free text while the master tab has no Add action where every other tab does. But sub-point
(b) is deliberate, not a build error: `RFP.md:693-694`'s own List Status master entry enumerates
exactly the six the prototype uses, and PROGRESS binding convention 10 pins the legend 1:1 with the
legacy legend for those same six keys, with `domain/statusKeyParity.test.ts` holding the parity. A
settable seventh row would break that logged invariant. Only (a), that `RFP.md:538`'s "available for
emergency" status example is unmodelled and therefore unfilterable, is a genuine residual.

## 04.2 · DOWNGRADED · PARTIAL · notable to cosmetic

**The office cannot add a Card to an already-booked List.** Slice 04.

**Claim as made.** The only office add-card entry point is "Book (phone advice)" in the admin List
drawer, gated on `isFreeEmpty` (free status and zero active Cards, `ListDrawer.tsx:39` and `:98`), so
a Free List accepts exactly one phone booking and an already-booked private List accepts none from the
office; no other admin surface mounts `AddCardFlow`. Integrations and the anaesthetist apps can add
Cards to already-booked DRAFT Lists, so this is an office-surface restriction rather than a missing
store capability.

**Verifier evidence.** `src/apps/admin/components/ListDrawer.tsx:39` and `:98`; but
`src/shared/card/CardDetailBody.tsx:181`
(`canEdit = !cancelled && list.state !== 'AUTHORISED' && (list.state === 'DRAFT' || actor.role === 'office')`)
gating `:457-460` "Copy for an additional procedure" to `src/store/cardActions.ts:179-210`, where
`copyCard` creates a new Card on `listId: source.listId`;
`src/apps/admin/screens/AdminCardDetail.tsx:65` mounts `CardDetailBody` with the office actor;
`src/apps/admin/flows/MoveCardFlow.tsx:37-40` accepts any non-AUTHORISED target List.

**Verifier reasoning.** The `isFreeEmpty` gate is real, but the claim's conclusion, that an
already-booked private List accepts none from the office, is wrong. Two office paths add a Card to an
already-booked List today. Card Copy: `AdminApp.tsx:180` mounts `AdminCardDetail` with the office
actor, `CardDetailBody`'s `canEdit` is true for office on DRAFT and SUBMITTED lists, and `copyCard`
writes a brand-new Card onto `source.listId`. `MoveCardFlow`, reached from the same drawer
(`ListDrawer.tsx:87`), lets the office move any Card into any non-AUTHORISED List on any day, booked
or not, with only an advisory pairing flag. There is also "Add post-op event"
(`CardDetailBody.tsx:472-486`). What genuinely remains missing is de-novo, new-patient Card creation
on an already-booked List from an office surface: a narrow entry-point gap.

## 04.5 · DOWNGRADED · PARTIAL · cosmetic (substance narrowed)

**`lastModifiedBy` / `lastModifiedAtISO` are stamped but never shown on any screen.** Slice 04.

**Claim as made.** Principle 9 explicitly "reinforces the last Modified By / last Modified At
requirement at the Card level". The wrapper stamps both fields on the touched Card in the same commit
as the audit entry, including for Procedure and BillingLine edits (`mutate.ts:190-202`), but no screen
renders either value: a grep for `lastModified` across `aa-prototype/src` returns only the seed
builders, the store writers and a test fixture. The Card detail body offers a History affordance
instead.

**Verifier evidence.** `src/apps/demo/DemoData.tsx:168-182,405`
(`JSON.stringify(markerEntity, null, 2)` renders the selected Card verbatim, including
`lastModifiedBy` / `lastModifiedAtISO`); `src/store/mutate.ts:190-202`; `grep -rn lastModified src`
returns `types.ts:396-397`, `seed/cards.ts:178-191`, `seed/history.ts:217-218`, `store/mutate.ts`,
`store/cardActions.ts` and `domain/billing/fixtures.ts` only.

**Verifier reasoning.** The stamping is real and the product surfaces genuinely omit the named field,
but "never shown on any screen" is too strong: the Data Inspector renders the whole selected Card as
pretty-printed JSON, so both values are visible in-app on the scenario-finder surface. Combined with
the shared History affordance on `CardDetailBody`, which answers the underlying provenance need more
fully, this is a labelling gap on the product screens rather than an unsurfaced field.

## 04.6 · DOWNGRADED · PARTIAL · notable to cosmetic

**Two of the six RFP open questions (insurer rate structure, hospital-route non-payment fallback)
have no position and no talking-point surface.** Slice 04.

**Claim as made.** `REQUIREMENTS.md` section 11 registers OQ4 (insurer route own rate structure) and
OQ5 (hospital disputes or fails to pay: fallback to Billable Party, or Hospital final?) as "pure
discovery items (RFP open questions the prototype flags as talking points)". Neither is actually
flagged anywhere the audience can see: a grep of `aa-prototype/src` for "rate table", "own rate",
"disput", "non-payment" and "fails to pay" returns nothing, and neither appears among the ten
ambiguity items in `docs/demo-guide/04-presenter-cheat-sheet.md`. The other four open questions are
surfaced.

**Verifier evidence.** `grep -rni 'disput|fails to pay|non-payment|rate structure|own rate'
aa-prototype/src` returns no domain hits; `docs/demo-guide/04-presenter-cheat-sheet.md:202-266` (all
ten "RFP ambiguities" items, neither question appears) and `:268-310` (evaluator questions,
likewise); the eight in-app discovery callouts are all accounted for by `grep -rni discovery src`
(`DemoXero.tsx:58-70`, `DemoIntegrations.tsx:32`, `InvoiceDocument.tsx:204/317`,
`IntegrationMonitorScreen.tsx:416`, `InvoicesScreen.tsx:72`, `timeUnits.ts`, `modifierCodes.ts`).

**Verifier reasoning.** Confirmed factually: the cheat sheet's ambiguity list and evaluator-question
list were read in full and neither OQ4 nor OQ5 is there, and no app string raises either.
REQUIREMENTS section 11 does register both as items "the prototype flags as talking points", so the
obligation is real. Severity is overstated at notable: this is presenter material only, no app
behaviour is wrong, and the mechanism each question hangs off is on screen and self-explanatory (the
insurer's single default Type 1 contract is visible and its creation narrated at
`MasterData.tsx:376`; hospital-route contract resolution is shown on every review row). A presenter
can field both verbally, and closing it is two bullets in the cheat sheet.

## 06.2 · DOWNGRADED · PARTIAL · notable to cosmetic

**No non-procedural codes for separately itemised post-op / consult events.** Slice 06.

**Claim as made.** The RFP says pain consultations, medical transport and HDU/ward review visits
"carry their own separate time-based charges". The addendum mechanism is fully built, but the RVG
master contains only 34 surgical procedure codes with no pain-consult, ward-review, HDU-review or
transport code. Because `validateCardForBilling.ts:130` requires an RVG base code or at least one
billing line, the only way to charge such an event is a hand-typed fixed amount or a
contract-permitted rate x time line, not a time-based RVG charge. The six seeded pre-op assessment
cards carry a description with no code and no billing line.

**Verifier evidence.** `src/domain/seed/rvgCodes.ts:1-9` (docblock: "demo values within RFP-stated
ranges - not sourced from an NZSA schedule (Decisions log 2026-07-22; discovery item for AA/NZSA to
supply real tables)") and `:15-57` (34 surgical codes); `src/domain/billing/fee.ts:224-250`;
`src/store/cardActions.ts:255-268,336-357`; `src/apps/admin/screens/MasterData.tsx:415`.

**Verifier reasoning.** The factual core is right: 34 surgical codes only, and `fee.ts` emits no
unit-based line when `rvgBaseCode` is undefined, so a pain consult can only be charged as a fixed
amount or a contract-permitted rate x time line. But the RVG master is explicitly a labelled demo
stand-in with the real tables recorded as a discovery item for AA and NZSA, echoed by the master
screen's "Base-unit reference (view only). Demo-plausible values.", and B8's requirement (demo a
post-op event as a linked Card running its own cycle) is fully built, with the addendum inheriting
funding context and capturing its own B/T/M. A missing row in an acknowledged placeholder table is a
data-load gap, not a modelling one.

## 08.2 · DOWNGRADED · PARTIAL · notable to cosmetic

**The InvoiceNumber vs Reference split is not shown on the Xero side.** Slice 08.

**Claim as made.** Both values exist and are correctly separated in the Billing Engine model
(`types.ts:659-661`; `billingRun.ts:186-194` comments the case reference as "display-only, never the
remittance key"), and the invoice document prints both with an "internal reference only" caption. What
is absent is the Xero-side rendering the RFP's field table describes: `XeroAccRec`
(`types.ts:765-774`) carries neither an `invoiceNumber` nor a `reference` field, and the Xero sim's
Invoices tab has no Reference column. This also diverges from the repo's own candidate data model,
which places both fields on `XERO_ACCREC` (`docs/rfp-reference/Data-Model-and-Flow.md:228-234`).

**Verifier evidence.** `src/domain/types.ts:765-774` (`XeroAccRec`: `id`, `invoiceId`, `contactId`,
`amountDue`, `amountReceived`, `status`); `src/apps/demo/DemoXero.tsx:36-46,120-136` (Invoices tab
headers; the number is borrowed via `invoice?.invoiceNumber`);
`docs/rfp-reference/Data-Model-and-Flow.md:228-234`.

**Verifier reasoning.** Facts verified: `XeroAccRec` carries neither field and the sim's Invoices tab
has no Reference column, diverging from the repo's own `XERO_ACCREC` block. But the remittance key is
displayed (`DemoXero.tsx:43` renders the linked billing invoice's number, with the `-P` suffix for the
pair), the two values are correctly modelled and separated in the engine, and the invoice document
prints both with the caption. The shortfall is one absent column on a demo-badged simulation surface.

## 08.3 · DOWNGRADED · PARTIAL · notable to cosmetic

**The ACCPAY's DRAFT to AUTHORISED flip is never printed as a status.** Slice 08.

**Claim as made.** `XeroAccPay.status` is a real `'draft' | 'authorised' | 'paid'` field
(`types.ts:776-786`) set to draft at handoff and flipped on first receipt, test-pinned. But no surface
renders the ACCPAY's own status word: the Xero sim's per-row `StatusChip` maps a draft ACCPAY to
"Awaiting payment" and an authorised one to "Part paid", the billing monitor's pill uses the case's
derived label, and the invoice footer shows only the pair numbers. The words DRAFT and AUTHORISED
appear only in the sim's intro paragraph, and the flip is observable per row only via the "ACCPAY
authorised" money column moving off $0.00. The demo script asks the presenter to "show ... its draft
ACCPAY".

**Verifier evidence.** `src/apps/demo/DemoXero.tsx:122` (column heads including "ACCPAY authorised"
as a money column) and `:204`
(`label = disbursed ? 'Disbursed' : paid ? 'Paid · not disbursed' : payStatus === 'authorised' ? 'Part paid' : 'Awaiting payment'`);
`:110-112` (intro paragraph "an ACCREC ... paired with a DRAFT then AUTHORISED ACCPAY");
`visual/shots/demo-xero.png`.

**Verifier reasoning.** Accurate on the facts: `StatusChip` never prints the record's own status word.
But notable overstates it: the flip is directly observable per row in the "ACCPAY authorised" money
column moving off $0.00, which the claim itself concedes; the model is spelled out in the RFP's own
vocabulary two lines above the table; and the demo script's beat is satisfiable by pointing at that
$0.00 cell. This is a chip-wording gap on a demo-only simulator surface over a real, test-pinned
field.

## 09.5 · DOWNGRADED · PARTIAL · notable to cosmetic

**Integration message log ships empty, so the reliability surface is blank on a cold open.** Slice 09.

**Claim as made.** The pristine seed contains feeds but zero messages
(`appStore.ts:125-129` returns `{ feeds, messages: {} }`), so the Admin Integrations Messages tab
shows only the empty note, the amber attention badge reads zero, and the four seeded
integration-origin Cards have no corresponding log rows. Every reliability story (dedupe, retry,
dead-letter, manual intervention) depends on the presenter firing the simulator or the control panel
first. Not demo-blocking: S1 and S4 fire messages before the monitor is opened, and the empty state
names the fix.

**Verifier evidence.** `src/store/appStore.ts:124-129` (`seededIntegrationsSlice` docblock "the three
feed configs, no messages yet (Phase 11)"; returns `{ feeds, messages: {} }`);
`src/apps/admin/screens/IntegrationMonitorScreen.tsx:44-50,86-87`;
`docs/prototype-build/phases/phase-11-integrations.md:75-90`.

**Verifier reasoning.** The empty seed is real and documented in the code itself, but the phase 11
plan never asks for pre-seeded log rows: every reliability behaviour it specifies (dedupe replay,
transient auto-retry with attempt count, dead-letter, manual intervention) is defined as
trigger-produced, precisely so the statuses are "produced by a real mechanism, not hand-set". The
monitor's intro paragraph carries the delivery-guarantee narrative even with zero rows, and the empty
state names the fix. With S1 and S4 both firing messages before the monitor is opened, this is a
cold-open presentation nuance.

## 01.2 · DOWNGRADED to BUILT · none

**Dashboard productivity and locum panels differ from Appendix 5.** Slice 01.

**Claim as made.** Appendix 5's Dashboard shows Productivity as 30 Days / 60 Days / 6 Months against
Amount / Last year / 2 years ago, and Unassigned Anaesthetists (next 5 days) with a visible Mobile
column. The prototype shows four stat tiles for a single period ("July so far") plus one footer line
"6 months: 1,542 units +6% vs last year", and the locum's phone number appears only in the chip's
title tooltip, never on screen. The reviewer noted the mitigation themselves: this matches the design
mockup exactly, so convention 17 arguably governs.

**Verifier evidence.** `src/apps/web/screens/DashboardScreen.tsx:220-252` and `:294-320`;
`docs/design/Web Dashboard.dc.html:112-119`; `src/domain/seed/anaesthetistDashboard.ts:1-9,24,46-57`.

**Verifier reasoning.** Facts check out, but the deviation is governed, not accidental. The design
mockup shows exactly the same four tiles and the same period label
(`Web Dashboard.dc.html:112-119`: "Productivity / July so far / UNITS 274 +8% / LISTS 21 / AVG UNITS
per LIST 13.0 / FEES INVOICED $7,261"), convention 17 makes it authoritative, the screen's own
docblock says "Web Dashboard mockup is authoritative; W1", and the seed docblock records why
prior-year periods cannot be derived ("W1 wants '6 months vs prior years', which the 4-month demo
canvas cannot produce"). RFP Appendix 5 is a legacy-system screenshot, not a layout spec. The
residual W1 wording not rendered (a 30/60-day toggle, "holiday notes") is copy level only.

## 07.3 · DOWNGRADED to BUILT · none

**No-double-charge rule is enforced at the engine, but the `isAdditional` flag itself is not locked in
the store.** Slice 07. (The reviewer had already rated this severity "none".)

**Claim as made.** The RFP wants the no-double-charge rule enforced structurally. The strong form is
present: `splitBillingUnits` charges time units only for `isAdditional` so stored base and modifier
values are irrelevant, the Type 3 path refuses an ordinal-agnostic fixed price for an additional
procedure, and the B/M steppers, reset link, ASA selector and modifier chips are disabled with
explanatory captions and a banner. The residual looseness is that
`ProcedurePatch = Partial<Omit<Procedure,'id'|'cardId'>>`, so `editProcedure` would technically accept
`isAdditional: false`.

**Verifier evidence.** `src/domain/billing/fee.ts:107-109` (`splitBillingUnits` returns
`procedure.isAdditional ? btm.time.units : btm.totalUnits`) and `:182` (the only unit source for the
fee); `src/store/lifecycle.ts:443`; `src/store/cardActions.ts:213-220` (`copyCard` hardcodes
`isAdditional: true`).

**Verifier reasoning.** Every factual assertion checks out, including the one that matters most:
`splitBillingUnits` makes stored base and modifier values irrelevant for an additional procedure, so
the RFP's no-double-charge rule is enforced at the point of fee composition rather than by UI
discipline, and `copyCard` sets the flag at creation so Card Copy cannot become a side door.
`ProcedurePatch` is permissive enough to accept `isAdditional: false`, but no UI path constructs that
patch and the charged fee would recompute correctly either way. The RFP requirement is fully met, so
the honest status is BUILT with a real-build hardening note.

## 10.1 · DOWNGRADED to BUILT · none

**Outstanding-balance check is surfaced at billing time, not at check-in.** Slice 10.

**Claim as made.** The unpaid-prior-episode check exists and is displayed, but on exactly one
surface: the Admin billing-monitor card row (post-authorisation), as an amber "Prior balance" chip.
Nothing surfaces it at the intake / check-in moment the RFP names (lines 1977-1978), and there is no
unit test on the selector. The narrowing is a recorded decision, not an accident
(`phase-10` doc line 41; `PROGRESS.md:519` deviation 3), as is reading the billing mirror instead of
the simulated Xero API.

**Verifier evidence.** `src/store/selectors.ts:280` and `:487`
(`patientHasOutstandingPriorEpisode` consumed only by `billingMonitor`);
`src/apps/admin/screens/BillingMonitorScreen.tsx:196-203` ("Prior balance" chip, title "This patient
has an unpaid prior episode (intake check)"); `docs/prototype-build/REQUIREMENTS.md:90` (X3, "...an
outstanding-balance check surfacing unpaid prior episodes before a new one bills");
`docs/prototype-build/PROGRESS.md:519` deviation 3.

**Verifier reasoning.** The placement matches the prototype's own requirement verbatim: X3 asks for
the check to surface "before a new one bills", which is exactly where it sits, and PROGRESS deviation
3 records the plan's "card / monitor row" wording as an either-or consciously resolved to the monitor
row. The check is real, derived from the billing mirror, and rendered with intake-framed tooltip copy.
The RFP's check-in framing is a placement preference for the production workflow rather than an absent
capability. The only residual nit is the missing unit test on the selector, which the manual checklist
covers.

---

# REFUTED

## 03.3 · REFUTED to OUT-OF-SCOPE · none

**No browsable Patient master surface in the Admin app.** Slice 03.

**Claim as made.** The Patient master itself is complete and real (151 seeded; `upsertPatient` /
`editPatient`; editable from the card PATIENT panel), but `MasterData.tsx:40-51` lists eleven entities
and Patients is not among them, so the patient master cannot be browsed or searched as a table. The
reviewer noted that this matches REQUIREMENTS A6, which enumerates the master screens and omits
Patients.

**Verifier evidence.** `src/apps/admin/screens/MasterData.tsx:20-52` (NAV array, eleven entities, no
Patients); `docs/prototype-build/REQUIREMENTS.md:69` (A6);
`src/shared/flows/ManualCardForm.tsx:73-142` (`lookupNhi` patient search);
`src/apps/demo/DemoData.tsx:168-182,405`.

**Verifier reasoning.** The absence is scoped, not dropped. A6 enumerates the master screens
("Hospitals, Surgeons, Anaesthetists, Insurers, Contracts (+ price lists), List Statuses, Permanent
Lists, Hospital Holidays, RVG & modifier tables") and deliberately omits Patients, and MasterData's
NAV matches that list exactly. The patient master is otherwise reachable: editable from the card
PATIENT panel, searchable by NHI through the shared manual-card flow's simulated lookup (used by the
admin app too), and inspectable as raw records in the Data Inspector. A deliberate scoping decision
makes this OUT-OF-SCOPE.

## 09.1 · REFUTED to OUT-OF-SCOPE · none

**HL7 messages carry no AIP personnel segments; routing and the FHIR Practitioner come from demo
metadata.** Slice 09.

**Claim as made.** The canned SIU messages are assembled from MSH, SCH, AIS, PID and (S14 only) NTE,
so the AIP segments the RFP's annotated sample lists as key (surgeon 12952, anaesthetist 49641, line
1650) never appear in the raw pane, and the repeating-field and subcomponent delimiters are never
exercised. Target-List routing comes from the canned routing field, not the wire, and the Practitioner
rendered in the translated FHIR pane is always Dr Melanie Souter. The reviewer noted PROGRESS
2026-07-24 fences AIL/AIP out of the demo extractor.

**Verifier evidence.** `src/domain/integrations/messages.ts:15` ("AIL/AIP location/personnel segments
a real feed carries are out of the [demo extractor's] scope"); `PROGRESS.md:138` item (3) and `:139`
("the missing AIL/AIP personnel segments are honestly fenced (section 10, routing is demo config)");
`PROGRESS.md:560` restates the same fence.

**Verifier reasoning.** This omission is explicitly and repeatedly logged as deliberate: the Phase 11
message-shape decision fences AIL/AIP out of the demo extractor, the Phase 11 adversarial review pass
re-examined it and recorded it as noted-not-a-defect, and the code carries the same note at
`messages.ts:15`. Per the standing rule, a deliberate logged omission is OUT-OF-SCOPE, not a gap. The
segments the extractor does read were corrected to the RFP's annotated sample in that same pass (SCH-2
appointment id, SCH-7 procedure, AIS-4 start time). One genuine residual the claim surfaces in passing
and worth parking: `src/apps/demo/DemoIntegrations.tsx:51-55` hardcodes the FHIR Practitioner to
`ANAE.souter`, so the locked-target message whose Card sits on Dr Delaney's list still renders
Souter's HPI. A two-line fix, cosmetic, and not what the title claims.

## 09.3 · REFUTED to OUT-OF-SCOPE · none

**No RESTful FHIR interaction shown, even in simulated form.** Slice 09.

**Claim as made.** The RFP asks for consuming FHIR resources "directly via RESTful API" (line 1756)
and lists Bundle (transaction) among the key resources. The FHIR-native feed is modelled as a
`type:'message'` bundle with a MessageHeader and replayed in-browser; no endpoint, HTTP verb, search
parameter, subscription or transaction-bundle framing appears anywhere, and there is no `fetch` in the
app by design. The simulator subtitle is honest, so the gap is only the absence of a simulated REST
framing.

**Verifier evidence.** `REQUIREMENTS.md` section 10 ("real Xero/API connections, real HL7/FHIR
endpoints or SFTP" out of scope); PROGRESS binding convention 4 ("Fake backend only ... No `fetch`, no
real endpoints"); `src/domain/integrations/fhir.ts:84` and `:171` do build a real
`resourceType: 'Bundle'` with MessageHeader, Patient, Practitioner and Appointment entries;
`src/apps/demo/DemoIntegrations.tsx:115` subtitle "All in-browser, no real endpoints".

**Verifier reasoning.** The claim disproves itself: it cites the two governing scope fences
(REQUIREMENTS section 10 and convention 4) that put REST endpoints out of scope by design, and the
simulator says so on screen. A simulated HTTP verb and search-parameter framing would be gold-plating
against convention 15. Also partly refuted on facts: the RFP's Bundle resource is modelled and
rendered (`fhir.ts:84-87`, `:171` emit a real Bundle whose entries the translated pane prints as
JSON), a message bundle rather than a transaction bundle; and the FHIR-first direction, the Digital
Services Hub NHI lookup and Keycloak are named as referenced-not-implemented in the on-screen callout.

## 09.2 · REFUTED to BUILT · none

**The internal representation the store consumes is a neutral parsed message, not FHIR.** Slice 09.

**Claim as made.** For an HL7 feed the pipeline is raw to `extractViaMapping` to `ParsedMessage` to
store effect; the FHIR bundle in pane 2 is produced by `toFhirBundle` for display and is never
re-consumed. The reviewer noted the RFP's translation paragraph asks only for "FHIR-equivalent
internal representations", which `ParsedMessage` satisfies, so the shortfall is against the stricter
"engine should operate natively using FHIR R4" ideal at line 1762 only, and is invisible to an
audience.

**Verifier evidence.** `src/domain/integrations/fhir.ts:3-8` (docblock: `toFhirBundle` from a neutral
`ParsedMessage`, `extractFromFhir` reads a bundle back into the same `ParsedMessage` so both feeds
converge on one internal shape) and `:110`, `:196`; `src/store/integrationActions.ts:237-243`;
`docs/prototype-build/REQUIREMENTS.md:95-96` (I1, I2).

**Verifier reasoning.** The pipeline is exactly as described, but that is the specified design, not a
shortfall. `attemptMessage` branches on transport and both branches converge on `ParsedMessage`, which
`fhir.ts` documents as the deliberate single internal shape. I1 asks only that each message show raw
HL7 to translated FHIR R4 resource to resulting Card, and I2 that one feed deliver FHIR bundles
directly; both are satisfied, and the FHIR feed's bundle really is the parse source via
`extractFromFhir`. The RFP's translation paragraph asks for FHIR-equivalent internal representations,
which `ParsedMessage` is; the stricter natively-FHIR ideal is an architecture aspiration for the real
build with no observable consequence in a fake-backend prototype.

---

## Not adjudicated

Every one of the 44 claims in the review set received a verdict, so nothing was dropped. For
completeness, two items in the slice files sat outside the adjudicated set and are recorded here so
they are not lost:

- **Note 01.4 - Appendix 3 card fields the modern card does not show**
  (`01-nfr-reporting-and-app-screens.md:144`). The reviewer raised it explicitly as
  "[NOTE, not claimed as a gap]", so no verdict was sought and none was given. It remains an
  unverified observation, not a finding.
- **The `Deliberate exclusions in this section` blocks in all ten slices.** These are the reviewers'
  own account of what is scoped out and why, cited against `REQUIREMENTS.md` sections 10 and 11, the
  binding conventions or the Decisions log. They were not put through the refute pass, because they
  are not claims of shortfall. Three claims (03.3, 09.1, 09.3) were nevertheless resolved *into* this
  category by the verifier, which is a reminder that the exclusion lists are load-bearing and worth
  reading before treating any absence as a gap.
