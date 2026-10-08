# Phase 43a · Sign-in and ease of use: simple anaesthetist screens and point-of-need help

**Requirements covered:**
[US-15.0.1](../../../../requirements-board/requirements/stories/US-15.0.1.md)
Ease of use (Proposed, unchanged at 60e2d1e: intuitive for people who are not comfortable with
modern systems, most of all on the operational screens; guidance embedded at the point of need so
standalone documentation stays short; and, from the 2026-10-01 Notes, "anaesthetists see none of the
Contract complexity, which the office handles, and the new system should not add it") ·
[US-13.5.3](../../../../requirements-board/requirements/stories/US-13.5.3.md)
Sign in to the anaesthetist app (Verify, unchanged at 60e2d1e, one acceptance criterion: "Given an
anaesthetist with an account, when they open the PWA, then they sign in with their account login";
graded **Missing**: the PWA and mobile app open straight into the persona's data, and the only
sign-in anywhere is Phase 14's "Simulate sign-in attempts", which writes audit rows).
US-15.0.1's two catalogue images are the layout targets for the help:
[mobile Booking capture](../../../../requirements-board/requirements/assets/US-15.0.1/mobile-card-capture.png)
and [the Admin Day view](../../../../requirements-board/requirements/assets/US-15.0.1/admin-day-view.png).
US-13.5.3 has no image.

**What the 2026-10-08 update changed for this phase.** Neither covered item changed, but the
catalogue around US-15.0.1's Note did. Three **Confirmed** stories now put Contract detail on the
anaesthetist's screens on purpose:
[US-03.1.2](../../../../requirements-board/requirements/stories/US-03.1.2.md) (the anaesthetist sees
each Procedure's Contract: "its name and holder, who is invoiced, and its pricing basis with the
figure"),
[US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) (every booking screen,
in both apps, shows each Procedure as a three-part stack: source wording as received, procedure and
RVG code, Contract) and
[FT-03.5](../../../../requirements-board/requirements/stories/FT-03.5.md) with
[US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md) (Verify: a typed price
or percentage discount on No contract (RVG) and their own first-party Contracts, a read-only
third-party price, a locked fixed discount), plus
[US-03.1.8](../../../../requirements-board/requirements/stories/US-03.1.8.md) (Confirmed, new: the
prepaid amount shown on the Booking and where units are recorded). US-15.0.1 is **Proposed** and
**yields** to them: this phase no longer reduces the Contract to its name. It keeps Phase 20a's
stack, Phase 24's Price section and Phase 27's prepaid amount on every anaesthetist screen, and
sweeps only what stays office-only (below). US-15.0.1's gap-analysis grading (Contradicts) was made
at 3d3a18c and was not re-graded because the item did not change; of its WRONG bullets, the Contract
name and billable party are now required (20a shows them), the route chip and insurer field go in
Phase 20, and only the "FIXED CONTRACT PRICE" rate label and the missing help remain for this phase.

Read alongside (not closed here, must stay green):
[FT-13.5](../../../../requirements-board/requirements/stories/FT-13.5.md) (Proposed, Matches: roles and audit; its Technical discussion is the RFP response's identity proposal, Auth0 or Entra, MFA for admins, self-service reset, logged sign-ins, social login on mobile, none confirmed; Phase 14's "Simulate sign-in attempts" on `/admin/audit` stays as it is),
[US-15.0.2](../../../../requirements-board/requirements/stories/US-15.0.2.md) (mobile-first; web a full alternative),
US-03.1.2, US-03.1.9, US-03.1.8, FT-03.5 and US-03.5.1 (above: what the anaesthetist **must** see),
[FT-03.4](../../../../requirements-board/requirements/stories/FT-03.4.md) and
[US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) (Confirmed: the anaesthetist can change the procedure or the Contract until they submit, no reason needed, flagged at office review; Phase 20's "Change" stays),
[FT-04.3](../../../../requirements-board/requirements/stories/FT-04.3.md) and
[US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) (Confirmed: the two-tab picker, No contract (RVG) first, Contracts that fit under holder headings, one search; Phases 19 and 20),
[FT-03.3](../../../../requirements-board/requirements/stories/FT-03.3.md),
[US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) (Verify) and
[US-03.3.8](../../../../requirements-board/requirements/stories/US-03.3.8.md) (Confirmed: optional modifiers each with a short explanation, the age modifier and P1 added and locked; Phase 19b),
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) (Confirmed, retitled "Payer on the Booking, editable to a guardian": prefilled from the patient, editable by the office or the anaesthetist; Phase 21),
[US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) (Verify: the line terms and the adjustable rule; Phase 24),
[US-08.2.3](../../../../requirements-board/requirements/stories/US-08.2.3.md) (Verify: the Split, a Booking action for the office and the anaesthetist; Phase 22),
[US-13.6.3](../../../../requirements-board/requirements/stories/US-13.6.3.md) and
[US-01.3.6](../../../../requirements-board/requirements/stories/US-01.3.6.md) (pairing preferences and priority tiers, admin only, never shown to anaesthetists; Phase 17's privacy boundary and its `officePrivacy.test.ts` enforce it, and this phase reuses rather than repeats that test),
[FT-13.7](../../../../requirements-board/requirements/stories/FT-13.7.md) (the to-do list is for warnings that need action; notices go to the notification pool),
[US-13.7.2](../../../../requirements-board/requirements/stories/US-13.7.2.md) and
[US-13.7.3](../../../../requirements-board/requirements/stories/US-13.7.3.md) (both Confirmed: the to-do list, and the triangle with the warning visually clear on opening the Booking and **no confirm step at submit**; Phase 15a),
[FT-13.8](../../../../requirements-board/requirements/stories/FT-13.8.md) and
[US-13.8.1](../../../../requirements-board/requirements/stories/US-13.8.1.md) (the shared notification pool, Vanessa agreed 2026-10-07; Phase 32's Notifications card on the Admin Day rail),
[US-13.1.1](../../../../requirements-board/requirements/stories/US-13.1.1.md) (the one-day dashboard, Phase 31's Draft Lists band and rail card),
[FT-01.6](../../../../requirements-board/requirements/stories/FT-01.6.md) (Confirmed: a Draft List is the List's DRAFT state, never offered to anaesthetists, OQ-86 answered no) and
[US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) (Confirmed: office review shows the stack for each Procedure, the payer on the Booking, and the insured-but-no-insurer-Contract warning; Phase 21's Review).
The plain-language guide [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md),
which Donald asks be taken as true as written, is the source for the help copy's wording: regions
`rvg-groups-and-procedures`, `no-contract-rvg`, `who-gets-the-invoice`,
`what-the-anaesthetist-can-change` and `modifiers`.
Evidence: points 51 ("keep the anaesthetist's world simple") and 52 (the working rule that an
unanswered question is built as its recommendation) of
[the 2026-10-01 meeting note](../../../../requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md),
points 2, 41, 68 and 84 of
[the 2026-10-02 requirements review](../../../../requirements-board/requirements/notes/2026-10-02-aa-requirements-review-with-greg.md)
(Greg: "what's the experience going to be when the anaesthetist brings up the app on the phone?";
only an account login for the PWA is assumed), and point 7 of
[the 2026-10-08 procedure picker note](../../../../requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md)
(the Contract part's content, agreed for both apps).
No DM or RV item is owned here. The phase builds on
[DM-10](../analysis/domain-model-delta.md#dm-10) (one Contract per Procedure, the anaesthetist's
change flagged for office review; DM-37 merged into it) and
[DM-51](../analysis/domain-model-delta.md#dm-51) (source wording on the Procedure, Phase 20a); no
[reverse-check](../analysis/reverse-check.md) finding is closed here.
**Open question:** [OQ-83](../../../../requirements-board/requirements/questions/OQ-83.md)
(the anaesthetist's sign-in experience: platforms, biometrics, MFA, single sign-on, identity
provider; Open and unchanged at 60e2d1e, and its recommendation is a process step, "define the
deployable platforms first, then the experience"). The phase builds the one thing assumed, an account
login on the PWA, as a simulated screen, and labels it provisional in one place (the meeting's working
rule; log it on the "For the owner's review" list). The help copy states as settled only answered
decisions: D3, D12 (as superseded 2026-10-08), D14, D15, D16 and D17 (as superseded), D25, D42 (OQ-91),
D43 (OQ-94), D44 (OQ-43), D46 (OQ-86) and OQ-78's answer (work item 11); none gates the phase.
**Depends on:** 20a (the `ProcedureStack` on every Booking screen, `procedureStackView`,
`whoIsInvoicedFor`, `pricingBasisFor` and `formatPricingBasis`), 21 (the payer on the Booking, its
sheet and `setBookingPayer`, the read-only Insurance row, holder references, completion, and Review's
stack, payer and warnings), 24 (the one price precedence, `PriceCard` and its states, the price source,
the anaesthetist's office-override caption, no calculated total on anaesthetist surfaces), 31 (the
DRAFT state, the Draft Lists band on the Day grid and the Draft Lists rail card) and 39b (pre-op and
post-op events and the billing-line sheet on the capture screen).
By the roadmap order 14 (the trigger registry, the PWA demo sheet and "Simulate sign-in attempts"),
15 (Booking vocabulary), 15a (the warning triangle, the warnings section on the Booking and the Admin
To-do rail card), 15b (ACTIVE for an assigned List), 17 (the privacy boundary for preferences and
tiers), 18 (contract holders), 19 (the two-tab `ProcedurePickerSheet`), 19a (Contract lines and the
resolver), 19b (itemised modifiers with explanations, age and P1 locked), 20 (one Contract per
Procedure, the Contract picker with No contract (RVG) first and the "Needs a Contract" card), 22 (the
Split button on the stack's Contract part), 23 (the RVG default multi-procedure rule), 25 (the pricing
snapshot), 26 (the anaesthetist profile on More, the prepaid card), 27 (the prepaid amount on the
Booking), 29 (the user-maintained status list), 32 and 32a (the Notifications card and the move
sheets), 38a (the main view, archive and search), 38b and 39 (the anaesthetist's own additional
invoice and credit note) and 43 (`SyntheticDataBadge`) have also run. The capture and review screens
are settled by now, which is why this phase sits late.
**Estimated:** 1 session, in three parts: the sign-in (items 1 to 4), the sweep (items 5 to 9) and the
help (items 10 to 16). If it runs long, stop green after work item 9 (sign-in, the sweep and its guard
test) and do the help and its trigger (items 10 to 16) in a second session.

## Goal

US-13.5.3 is graded **Missing** and US-15.0.1 **Contradicts** in the gap analysis. This phase closes
both gaps (US-15.0.1's has two halves: what is left of the office's complexity on anaesthetist
screens, and the missing help).

- **The anaesthetist signs in to the PWA** (US-13.5.3, PWA first). On launch the installed PWA shows a
  **simulated sign-in screen**: the AA logo, an email and a password field with Dr Souter's demo
  account pre-filled, and one teal "Sign in". It is deterministic, has no real identity provider and
  sends nothing anywhere. The session is kept across reloads (per-device browser storage), so a
  handset signs in once; a **Sign out** row on the mobile More tab returns to the sign-in screen with
  the account still pre-filled. The framed all-apps prototype opens **signed in**, so no workshop
  ever starts on a login. A successful sign-in, a refused one and a sign-out each append one audited
  `account` row, reusing Phase 14's pattern, so the Audit viewer shows the logged attempts the
  proposal describes. Auth0, MFA, single sign-on, biometrics and password reset are **narrated, not
  built** (OQ-83); one small provisional caption on the sign-in screen says the experience is still
  to be decided.
- **The anaesthetist's world stays simple, without losing what the catalogue gives them**
  (US-15.0.1 Notes, read with US-03.1.2, US-03.1.9, FT-03.5 and US-03.1.8). By now Phases 18 to 39b
  have rebuilt every Contract surface: 20 removed the route, the payment category and the Procedure's
  insurer; 20a put the three-part stack on every Booking screen; 21 put the payer on the Booking; 24
  built the Price section and kept the calculated total off anaesthetist surfaces; 17 kept preferences
  and tiers office-only. This phase **sweeps every anaesthetist-facing screen on mobile, web and the
  PWA** for what is still office-only and leaks: the old rate labels ("FIXED CONTRACT PRICE", "FEE @
  $x/UNIT"), the running fee and Booking total, the office override's figures, the Contract catalogue's
  internal pills and version or line grids, the holder's billing settings, any route, category,
  "Method 3" or hourly wording that survived, and any preference or tier. It **keeps**, and proves it
  keeps, the stack (the source wording, the procedure and RVG code, the Contract's name and AA code,
  its holder, who is invoiced and the pricing basis with its figure), the Price section in each of its
  states (a typed price or discount on No contract (RVG) and their own Contracts, a read-only
  third-party price, a locked fixed discount), the prepaid amount, the payer, the Split and the
  Contract and procedure "Change". It reads 20a's view and 24's selector and re-derives nothing. One
  viewer rule decides what is office-only, and one render-scan test checks both directions (nothing
  office-only leaks; nothing the catalogue gives the anaesthetist is stripped), so the rule holds for
  every later change.
- **Help at the point of need.** There is no help affordance anywhere today (only a few native `title`
  tooltips). This phase adds **one shared `InfoTip`** in the design's own patterns: a small info glyph
  beside a section label that opens a short explanation, as a bottom sheet on the phone and an
  anchored popover on desktop. All copy lives in **one topic file**, written to the answered decisions
  and the plain-language guide (AR-28): how to read the three-part stack, the two-tab picker and base
  units from the Contract line, the procedure or its RVG group, No contract (RVG) first and billing the
  payer on the Booking, what the anaesthetist can change on the price, the locked age and P1 modifiers
  and the explanation asked for any other, Draft Lists assigned only by the office, warnings that never
  block or ask for confirmation, notices kept apart from the to-do list, and the price order the office
  reviews. Tips sit on the three operational screens US-15.0.1 names through its images and its "used
  every day" sentence: **mobile Booking capture** (the stack, the two-tab picker, the Contract, the
  modifiers and the Price section; the anaesthetist web app's shared capture gets them too), **the
  Admin Day view** and **Admin Review**. Each app also gets **one first-run hint**: a calm inline
  card, not a modal, that says where to start and that the info glyph explains a heading. A dismissal
  is kept per browser, like the PWA's install coaching, and Reset or the "Show first-run hints again"
  demo action brings the hints back.

No domain state changes: the sign-in session and the dismissed hints are per-viewer browser state,
the sweep is presentation and the help is copy and UI. The pricing model (RVG groups, procedures,
holders, Contracts, lines, booking procedures, the resolver and the precedence) stays where Phases 18
to 25 put it, in one place in `aa-prototype/src/domain/billing`; this phase only reads its view types
and never adds a second derivation of who is invoiced, the pricing basis or the price. The sign-in rows
are audit-only (`mutate()` with an empty patch on the existing `account` entity type, as Phase 14
does), so no slice and no seed changes and `PERSIST_VERSION` does not move. Training per user group,
short standalone documentation and a web-app sign-in stay presenter-narrated.

## Before you start: drift check

1. Run the catalogue diff since the plan's baseline:

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-15.0.1,US-13.5.3,FT-13.5,OQ-83,US-15.0.2,US-03.1.2,US-03.1.9,US-03.1.8,FT-03.5,US-03.5.1,FT-03.4,US-03.4.1,FT-04.3,US-04.3.2,FT-03.3,US-03.3.4,US-03.3.8,US-11.2.2,US-04.2.2,US-08.2.3,US-13.6.3,US-01.3.6,FT-13.7,US-13.7.1,US-13.7.2,US-13.7.3,FT-13.8,US-13.8.1,US-13.1.1,FT-01.6,US-07.2.2,EP-13,EP-15,OQ-49,OQ-60,OQ-78,OQ-79,OQ-86,OQ-89,OQ-90,OQ-93,OQ-95,OQ-96,OQ-102,OQ-103
   ```

   (it diffs from the baseline, `60e2d1e`, to the working tree; add `--to <ref>` to stop at a commit;
   the tool is rename-aware, so never use a plain git diff of the catalogue folder.) Read the hunks for every item listed, any new note that cites
   US-15.0.1, US-13.5.3, US-03.1.2 or US-03.1.9, and the domain-model lines on what the anaesthetist
   sees of a Contract and its price. At 60e2d1e US-15.0.1 is **Proposed** with no acceptance criteria
   and no linked OQ; US-13.5.3 is **Verify** with one criterion and OQ-83 **Open**; US-03.1.2,
   US-03.1.9, US-03.1.8 and FT-03.5 are **Confirmed** and US-03.5.1 **Verify**; US-13.7.2 and
   US-13.7.3 are **Confirmed** (no confirm step); US-11.2.2 is **Confirmed** (the payer on the
   Booking); OQ-78 and OQ-86 are **Answered**.
2. If an item changed, re-read it in full and adjust the work items. Specifically:
   - **OQ-83 answered.** Build the answer inside the simulated screen where it fits one session (for
     example a simulated MFA code step, or a "Sign in with Google" button that signs in the same demo
     account), drop the provisional caption and record it. If the answer needs a real identity
     provider, a native app or real biometrics, keep the simulated screen, narrate the rest and tell
     the owner in the PROGRESS entry rather than growing the phase.
   - **US-13.5.3 adds the web app** (or the admin app) as a sign-in surface: the session module (work
     item 1) is app-agnostic, so add the same screen to that app only if it fits; otherwise log it.
   - **US-15.0.1 gains acceptance criteria** (a named screen list, a help centre, a searchable manual,
     guided tours, or a training mode): build only what fits one session inside the three screens and
     the first-run hint, and tell the owner what is left, rather than growing the phase.
   - **The anaesthetist is to see less of the Contract** (for example a later note hides the pricing
     basis or the holder again, or US-03.1.2 is narrowed): change the stack's content in 20a's one
     module for the anaesthetist viewer only if the catalogue says so per viewer, move the field into
     work item 6's office-only list in one place, and record it. **The anaesthetist is to see more**
     (for example the calculated fee): move it out of the office-only list in one place and record
     it. Never strip a field a Confirmed story still gives the anaesthetist.
   - **US-03.4.1 now takes the procedure or Contract change away from the anaesthetist:** stop and
     tell the owner. Removing Phase 20's "Change" is that phase's rule, not a display sweep.
   - **US-11.2.2 changes who edits the payer** (for example the office only): make 21's payer sheet
     read-only for the anaesthetist through the store's existing refusal (one line) and record it.
3. If US-15.0.1 or US-13.5.3 is now Retired or Future, drop that half of the phase (the help and sweep,
   or the sign-in) and tell the owner. If only a context item is Retired or Future, drop the tip that
   explains it.
4. **Open questions.** OQ-83 is the only one this phase builds against: the sign-in is simulated and
   carries the provisional caption (work item 3). The help copy is the other risk: a tip never states
   as settled anything still open. At 60e2d1e the copy in work item 11 is written to the answers (D3,
   D12 and D16 and D17 as superseded 2026-10-08, D14, D15, D25, D42, D43, D44, D46, OQ-78's answer,
   US-13.7.3) and to AR-28, and avoids what is still open:
   - a Booking without an NHI (D11, OQ-49, still Open though Vanessa leans to a mandatory NHI; no tip
     mentions it);
   - the BCTI count (OQ-60 and the ROADMAP's BCTI granularity);
   - what else posts to the notification pool (OQ-79; the to-do tip names a moved List only, as the
     example US-13.8.1 gives);
   - whether the anaesthetist may add their own discount on top of a fixed discount, and Contract
     time bands (OQ-89, D40; the price tip says only that a fixed discount is shown locked);
   - the multi-procedure rule (OQ-90, D26; no tip states it);
   - where the insurance indication is stored and whether it narrows the picker (OQ-93, D28; the
     review tip names only the insured-but-no-insurer-Contract warning, which US-07.2.2 confirms);
   - the age bands and stacking (OQ-95, D29; the modifiers tip says only that age modifiers are added
     and locked);
   - whether the price on a prepaid procedure can change (OQ-96, D30; no tip mentions it);
   - the names of the preference lists and tiers (OQ-102, D36; no tip names a tier);
   - how a general procedure is worded on the invoice (OQ-103, D37) and where the system code sits
     (OQ-88, D39; the picker tip says "a name or code");
   - the sign-in experience (OQ-83; no tip mentions sign-in).

   Re-read each of these in the diff. If one is answered, the copy may say more; if a topic must touch
   an open point, it carries `provisional` (work item 10) and shows the small neutral "Provisional"
   pill with the OQ in its tooltip, as earlier phases do. At 60e2d1e no topic needs it. If Greg comes
   back on OQ-78 (who No contract (RVG) bills), change the one `capture.contract` entry.
5. **Prerequisite names.** Confirm 20a, 21, 24, 31 and 39b are DONE in PROGRESS.md and read their
   entries, name maps and handoff notes, and the entries for 14, 15, 15a, 15b, 17, 19, 19a, 19b, 20,
   22, 23, 26, 27, 29, 32, 32a, 38a, 38b, 39 and 43. Note in particular:
   - **14:** the registry entry shape (`DemoTrigger` in `src/shared/demoTriggers/types.ts`), route
     matching, `PwaDemoActions` (mounted by `MobileViewport`, so its Demo chip can show over the
     sign-in screen), and `simulateSignInAttempts` in `src/store/authDemoActions.ts` (the `account`
     audit rows, `PROVIDER`, `SOUTER_ACTOR`);
   - **15 and 15b:** the Booking detail body and route names, the
     `/mobile/lists/:listId/bookings/:bookingId` route, and ACTIVE for an assigned List;
   - **15a:** the triangle component (`data-shot="booking-warning"`, a marker, not a button), the
     Booking's warnings section (`data-shot="booking-warnings"`), the To-do rail card (`WarningsToDo`,
     `data-shot="admin-warnings-todo"`), and that `SubmitListSheet` has no warnings step;
   - **17:** the `officePrivate` slice, `src/store/officePrivate.ts` (not re-exported from the store
     barrel), `apps/admin/components/pairing/` and `src/apps/officePrivacy.test.ts` (the source scan,
     PWA closure, history and vocabulary checks): this phase relies on it for preferences and tiers and
     does not duplicate it; if a new anaesthetist-reachable file trips it, fix the file, not the test;
   - **19:** `ProcedurePickerSheet` (Procedures and RVG codes tabs, one search, the
     `capture-procedure-code` hook and "Change") and the after-procedure out-of-range warning;
   - **19b:** the modifiers section on capture, the locked age and P1 pills, and where the explanation
     field opens when a modifier is claimed;
   - **20:** the anaesthetist's Contract action in the stack, `ContractPickerSheet` (No contract (RVG)
     first, holder headings, the same rows as the office's, never a colleague's first-party
     Contract), the "Changed by you · office to check" pill, and the Admin Day "Needs a Contract" card
     and its hook;
   - **20a:** `ProcedureStack` (`shared/booking/ProcedureStack.tsx`, `data-shot="procedure-stack"`,
     `procedure-stack-received`, `procedure-stack-procedure`, `procedure-contract`),
     `procedureStackView`, `whoIsInvoicedFor`, `pricingBasisFor` and `formatPricingBasis`, and
     `AddWordingSheet`;
   - **21:** the Payer row and sheet (`setBookingPayer`), the read-only Insurance row, holder
     references asked in plain words, completion, and Review's stack, payer column and warnings;
   - **22:** the Split button on the stack's Contract part, `SplitFeeSheet` and the "Split: ..."
     reading;
   - **23:** the multi-procedure caption on capture (its handoff: "43a keeps the multi-procedure
     captions simple on the anaesthetist screens");
   - **24:** `PriceCard` and its `data-state` values (`adjustable`, `own-price`, `third-party`,
     `fixed-discount`, `read-only`), the price-source selector 20a's `pricingBasisFor` now reads, the
     anaesthetist's one caption when an office override exists ("The office has set a price override on
     this procedure.", no figures), `priceLayers` and Review's Fee cell, and the Contract catalogue's
     `contract-adjustable-pill` (office only); its handoff: "keep the anaesthetist's Price section and
     the read-only and locked states the catalogue gives them; strip only office-only wording";
   - **26 and 27:** the profile on More (unit value, prepaid card, the read-only "Your price list"
     sheet) and the prepaid amount on the Booking and the capture block;
   - **29:** the status master (labels and colours editable), so the Day tip names no status colour;
   - **31:** `DraftListBand.tsx` (`data-shot="daygrid-draft-band"`), the Draft Lists rail card
     (`data-shot="admin-draft-lists-rail"`) and its handoff ("point-of-need help on Admin Day should
     explain the Draft Lists card and band");
   - **32 and 32a:** the Notifications card on the Admin Day rail, and the move-List and move-Booking
     sheets (for the inventory);
   - **38a, 38b and 39:** the main view, archive and search; the anaesthetist's "Raise additional
     invoice" and credit note on their own Procedure (for the inventory);
   - **39b:** the event sheet and the billing-line sheet (fixed amount only after 24);
   - **43:** `SyntheticDataBadge` (`src/shared/SyntheticDataBadge.tsx`) and its tone on the PWA's More
     card, and the handoff asking for it on the sign-in screen.
6. Note the current `PERSIST_VERSION` (16 at 60e2d1e, higher after the seed phases). This phase must
   not change it.

## Reference

**Design files (convention 17):**

- `docs/design/Design Language.dc.html`: tokens. Teal `#0D6E63` is the only action colour (Sign in,
  the tip glyph when focused or open, "Got it"); crimson stays identity only (the logo on the sign-in
  screen, the avatar on More) and never appears in a tip, hint or button. The micro-caps section
  label (11px, 600, 0.06em, mist) is where a tip sits. Radius `card` (14) and elevation e-2 for the
  desktop popover; e-1 and `accent.tint` for the inline first-run card; `sheet-in` motion for the
  mobile sheet; 80ms fades under reduced motion.
- `docs/design/Mobile App.dc.html`: screen 3 (Booking capture: the white capture cards and their
  micro-caps labels, the stepper rows, the docked Mark complete), the Forward Lists header, where the
  mobile first-run card sits under the greeting, and the form fields and full-width primary button
  the sign-in screen reuses. No mockup draws a sign-in screen: build it from the mobile canvas (the
  host's atmosphere shows through), the shared `Logo`, one white card and the existing field and
  button anatomy.
- `docs/design/Admin Day.dc.html`: the day header, the status legend chips over the grid and the right
  rail cards. The Admin first-run card sits between the day header and the grid.
- `docs/design/Admin Review.dc.html`: the summary tiles, the table header row and the action bar.
- `docs/design/Web Dashboard.dc.html`: the greeting block, where the web first-run card sits.
- No mockup draws a tip, popover or onboarding card. Extend the section-label row, the rail card and
  the bottom sheet; do not invent new chrome (no coach marks, no spotlight scrim, no tour).

**Catalogue items:** the covered and context files above, OQ-83, US-15.0.1's two images, and AR-28's
regions named above (the help copy's plain-language source).

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: the EP-13 section's US-13.5.3 row (Missing) and
  FT-13.5 row (Matches), the EP-15 section's US-15.0.1 row (Contradicts, graded at 3d3a18c and not
  re-graded) and the EP-03 rows for US-03.1.2, US-03.1.9, US-03.1.8 and FT-03.5 (re-graded at
  60e2d1e: what the anaesthetist must see).
- `docs/prototype-build/catch-up/epics/EP-13.md` (the US-13.5.3 entry: no sign-in or sign-out, the
  suggested PWA "Sign out" trigger with the demo account pre-filled), `epics/EP-15.md` (the
  US-15.0.1 entry: the "WRONG" and "MISSING" bullets and the evidence lines; read the WRONG bullets
  against the Confirmed stories above) and `epics/EP-03.md` (the US-03.1.2 and US-03.1.9 entries).
- `analysis/prototype-map-apps-mobile-web.md` (Booking detail, capture block, List rows, More),
  `analysis/prototype-map-shared.md` (the capture components, the surface seam and the flows),
  `analysis/prototype-map-admin.md` (Day view, Review) and `analysis/prototype-map-shell-demo-pwa.md`
  (the harness bar, Reset, the PWA entry, panel and install coaching).

**Code entry points** (paths under `aa-prototype/src/` unless they start `aa-prototype/`; line numbers
from 60e2d1e; phases 15a to 43 will have moved them):

- Sign-in:
  - `aa-prototype/pwa/main.tsx` (76: `<MobileApp host={MobileViewport} moreExtra={<PwaDemoPanel />} />`,
    the PWA entry) and `router.tsx` (115: `<MobileApp host={PhoneFrame} />`, the framed build).
  - `apps/mobile/MobileApp.tsx` (the layout: `APP_CONFIG.mobile.persona`, the `actor`, the outlet
    context, `showTabBar`, `SurfaceProvider` and `Host`); the sign-in gate goes here, in place of the
    `Outlet` and tab bar, so the URL and the router are untouched.
  - `apps/mobile/screens/MoreScreen.tsx` (the persona card, which 26 turned into the profile, the demo
    note and the host's `extra`) and `apps/mobile/routes.tsx` (`MobileMoreRoute`).
  - `shell/appConfig.ts` (`PERSONAS.souter`) and `domain/seed/cast.ts` (Dr Souter's
    `m.souter@aa-associates.example`, the account the screen pre-fills).
  - `store/authDemoActions.ts` (`simulateSignInAttempts`: the `account` audit rows through `mutate()`
    with an empty patch), `store/demoActors.ts` (`SOUTER_ACTOR`) and the `simulate-sign-in` registry
    entry.
  - `store/persistStorage.ts` (`resilientLocalStorage`: the try/catch storage wrapper to reuse).
  - The framed reset paths that call `resetDemo(useAppStore)` directly: `shell/DemoResetButton.tsx`
    (`confirmReset`), `apps/demo/DemoControlPanel.tsx` ("Reset to pristine seed" and the scenario
    jumps) and `apps/demo/DemoIntegrations.tsx` (`resetSimulator`); work item 4 routes them through
    the new `shell/framedReset.ts`.
  - `pwa/MobileViewport.tsx` (`<PwaDemoActions />`) and `pwa/PwaDemoPanel.tsx`.
- What the anaesthetist sees of a Contract and its price:
  - `shared/booking/ProcedureStack.tsx` and `domain/billing/procedureStack.ts` (20a; 21 and 24
    re-pointed its two selectors): kept on every anaesthetist screen, never forked per viewer here.
  - `shared/capture/BtmCaptureBlock.tsx`: rebuilt by 20, 20a, 21, 23 and 24; at 60e2d1e it still has
    `ROUTE_LABEL`, `CONTEXT_FIELDS` and the read-only context line, which 20 and 20a replace. Confirm
    nothing of them is left.
  - `shared/capture/PriceCard.tsx` (24; replaced `OverrideCard.tsx`): kept in every state.
  - The Booking detail body (`shared/booking/BookingDetailBody.tsx`): `showBookingTotal` (135 at
    60e2d1e, `actor.role !== 'anaesthetist'`), the rate labels "FIXED CONTRACT PRICE" and "FEE @
    $x/UNIT" (218, computed for every viewer, shown only through the office's total), 24's
    `priceLayers`, 27's prepaid amount, `OfficeBillingSetup` (office only).
    `shared/capture/BookingTotalPanel.tsx` (`rateLabel`) and `shared/surface/context.ts`.
  - `shared/capture/AddBillingLineSheet.tsx` (24 and 39b reworked it: fixed amount only, no hours x
    rate, no Method 3); 39b's event sheet; 38b's additional invoice sheet and 39's credit note sheet
    where the anaesthetist raises them on their own Procedure.
  - The pickers and sheets reachable by the anaesthetist: 19's `ProcedurePickerSheet`, 20's
    `ContractPickerSheet`, 21's payer sheet, 22's `SplitFeeSheet`, 20a's `AddWordingSheet`, 19b's
    modifier sheet, `shared/flows/EditProcedureSheet.tsx` and the add-Booking form.
  - Office only, to confirm unreachable with an anaesthetist actor: `shared/flows/EditBillingSetupSheet.tsx`,
    `OfficeBillingSetup`, 24's `PriceOverrideSheet` and `contract-adjustable-pill`, 18 and 19a's
    Contract catalogue, detail panel and lines grid.
  - Mobile `apps/mobile/screens/ListDetailScreen.tsx`, `BookingDetailScreen.tsx`, `BalancesScreen.tsx`,
    `MoreScreen.tsx` (26's profile), 38a's main view, archive and search; web
    `apps/web/screens/ListDetailView.tsx`, the Booking detail view, `AccountsScreen.tsx`,
    `DashboardScreen.tsx`, 26's `ProfileScreen.tsx`.
  - Guards to copy the style of: `apps/moneyViewPurity.test.ts` (a source scan over
    `src/apps/mobile` and `src/apps/web`; 20a and 24 may have adjusted it for the stack and the Price
    section), 17's `apps/officePrivacy.test.ts` and `pwa/pwaPurity.test.ts`.
- Help anchors:
  - `shared/capture/ui.tsx`: `CaptureSection` (the micro-caps label row is where a capture tip goes)
    and `Caption`. 20a's `ProcedureStack` labels, 19's picker sheet header, 19b's modifiers section,
    24's `PriceCard` ("Price"), `TimesCard.tsx` (`label="Times"`), 15a's warnings section, wherever
    they now sit.
  - Admin Day: `apps/admin/routes.tsx` (`AdminDayRoute`, which renders `DayNav`, `DayGrid` and
    `RightRail`), `apps/admin/components/DayNav.tsx` (the day header), `DayGrid.tsx` (the
    `StatusLegend variant="chips"`; the conflict `title` tooltip), `RightRail.tsx` (`MiniCalendar`,
    then 15a's To-do, 20's Needs a Contract, 31's Draft Lists and 32's Notifications cards), 31's
    `DraftListBand.tsx`; `shared/StatusLegend.tsx` (its native `title`s).
  - Admin Review: `apps/admin/screens/ReviewScreen.tsx` (the header, the summary `Tile`s, the table
    headings, which 20a, 21 and 24 reshaped (the stack column, the payer, the Fee cell), the action bar
    and its "Authorise for billing", the authorise confirm copy).
  - First-run hint seats: 38a's mobile main view (today `apps/mobile/screens/ForwardListsScreen.tsx`,
    `MobileHeader`), `apps/web/screens/DashboardScreen.tsx` (the greeting `h1`), `AdminDayRoute`
    (between `DayNav` and the grid).
- Per-viewer storage, the pattern to copy: `pwa/installPrompt.ts` (`COACH_DISMISS_KEY`,
  `wasCoachDismissed`, `rememberCoachDismissed`, `clearInstallCoachDismissal`, all wrapped in
  try/catch), `pwa/InstallCoach.tsx`, and the two Reset paths: `pwa/PwaDemoPanel.tsx` (`ResetCard`;
  its `clearInstallCoachDismissal()` call) and `shell/DemoResetButton.tsx` (`confirmReset`).
- Surface: `shared/surface/context.ts` (`Surface.variant`, `Overlay`) and `SurfaceProvider.tsx`
  (mobile `Overlay` is `BottomSheet`, web is the centred `Dialog`); `shared/ui/index.ts` and
  `shared/index.ts` (the component barrels); `shared/Logo.tsx`; `shared/DemoBadge.tsx`.
- Demo triggers: `shared/demoTriggers/registry.ts`, `types.ts`, `match.ts`, `memory.ts` (14),
  `shell/DemoActionsMenu.tsx`, `pwa/PwaDemoActions.tsx`.
- Tests and shots: `pwa/pwaPurity.test.ts`, `domain/domainPurity.test.ts`,
  `aa-prototype/playwright.config.ts` (two projects: `pwa-device` on 5174, which runs only
  `pwa-device.spec.ts`, and `prototype` on 5173), `visual/mobile-interactions.spec.ts`,
  `visual/mobile-insets.spec.ts`, `visual/pwa-device.spec.ts`, `visual/screens.spec.ts`,
  `visual/demo-actions.spec.ts`, and 15a's `visual/warnings.spec.ts`.

## Work items

Sign-in first, then the sweep guarded by its test, then the help. Keep `npm run build`,
`npm run build:pwa` and `npx vitest run` green after each group.

New files (none exists at 60e2d1e): `src/shared/session/anaesthetistSession.ts` and its test,
`src/apps/mobile/screens/SignInScreen.tsx`, `src/shell/framedReset.ts`, `src/shared/viewer.ts` (unless
20a, 21 or 24 built the helper it extends), `src/apps/anaesthetistSimplicity.test.tsx`,
`src/shared/help/` (`helpTopics.ts`, `InfoTip.tsx`, `firstRunHints.ts`, `FirstRunHint.tsx` and their
tests), `visual/ease-of-use.spec.ts` and `visual/storage/demo-ready.json`. Everything else named
below exists today or is built by the phase that names it.

### Sign-in (US-13.5.3)

1. **The session** (`src/shared/session/anaesthetistSession.ts`, no React, PWA-safe, imports nothing
   from apps, shell or store):
   - One storage key, `aa-anaesthetist-session`, beside the existing `aa-*` keys, holding
     `{ signedIn: boolean; account: string }`; every read and write wrapped in try/catch (reuse
     `resilientLocalStorage` or copy `installPrompt.ts`'s pattern), so blocked storage falls back to
     the host's default and never throws.
   - A tiny non-persisted zustand store (like Phase 14's `memory.ts`) mirroring it:
     `useAnaesthetistSession()`, `signInSession(account)`, `signOutSession()`,
     `clearAnaesthetistSession()` and `isSignedIn(defaultSignedIn)`.
   - The default when nothing is stored is the host's: **signed in** in the framed build, **signed
     out** in the PWA (work item 2). So the framed demo opens signed in, a fresh handset opens on the
     sign-in screen, and a signed-in handset stays signed in across reloads and relaunches.
   - `SIGN_IN_PROVISIONAL = { oq: 'OQ-83', note: 'How anaesthetists sign in (two-step codes, single
     sign-on, Face ID) is still to be decided. This screen stands in for it.' }`: the one place the
     provisional reading lives.
   - `SIGN_IN_RULE = { platform: 'pwa', provider: 'simulated', preFilled: true }`: the one constant
     an OQ-83 answer changes.
   - Vitest (`anaesthetistSession.test.ts`): the default by host; sign in, sign out and clear persist
     across a fresh store over the same storage; a throwing `localStorage` gives the default and no
     exception.
2. **The gate** in `MobileApp`:
   - New prop `sessionDefault: 'signed-in' | 'signed-out'` (required, like `host`, so neither entry
     can forget it): `router.tsx` passes `'signed-in'`, `aa-prototype/pwa/main.tsx` passes
     `'signed-out'`.
   - When not signed in, `MobileApp` renders `SignInScreen` inside the same `SurfaceProvider` and
     `Host`, in place of the `Outlet` and the tab bar. The URL is not changed, so after sign-in the
     presenter lands where the URL already points (a deep link to a Booking still works).
   - The actor stays the persona actor; the session decides only whether the app shows. No store
     guard or view scope changes.
3. **`SignInScreen`** (`src/apps/mobile/screens/SignInScreen.tsx`, invoke the frontend-design skill
   first):
   - The mobile canvas with the host's atmosphere showing through, the shared `Logo` at the top,
     then one white card (radius `card`, e-1): title "Sign in", then "Email" pre-filled with Dr
     Souter's address from the store (the anaesthetist record, never retyped), "Password" pre-filled
     with a fixed masked demo value, and a full-width teal "Sign in" (52px, `data-shot="sign-in-submit"`).
     Inputs at 16px so iOS does not zoom; `autocomplete="username"` and `"current-password"`.
   - Under the card, one small neutral "Provisional" pill with `SIGN_IN_PROVISIONAL.note` (OQ-83 in its
     tooltip), the `DemoBadge` "Demo prototype", and Phase 43's `SyntheticDataBadge` ("Synthetic data
     only", the tone the More card uses; Phase 43's handoff asks for it here), in the More tab's style.
     Nothing else: no "Forgot password", no social buttons, no Face ID (narrated, OQ-83).
   - Behaviour, all deterministic: an empty field shows an inline message under it ("Enter your
     email", "Enter your password"); an email other than the demo account's (case-insensitive,
     trimmed) shows "No account with that email. Use the demo account." under the email field; the
     demo account with any non-empty password signs in at once, with no spinner or delay.
   - Respects the four `--aa-inset-*` properties; the card stays clear of the home indicator and the
     on-screen keyboard (it scrolls); `data-shot="sign-in-screen"` on the root.
   - No en or em dashes.
4. **Audit and sign-out.**
   - Extend `src/store/authDemoActions.ts` with `recordAnaesthetistSignIn(api, outcome)`, where
     `outcome` is `'signedIn' | 'refused' | 'signedOut'`: one `mutate()` row with an empty patch as
     `SOUTER_ACTOR`, entity `account` and id Dr Souter's registration number, actions `auth.signIn`,
     `auth.signInFailed` (`reason: 'Unknown account'`) and `auth.signOut`, each `after` leading with
     `app: 'Mobile (PWA)'` and `provider: PROVIDER`. Time from the demo clock. Vitest: each outcome
     writes exactly one row and touches no domain slice.
   - `SignInScreen` calls it on each attempt; the framed build's default signed-in state writes no
     row.
   - **More tab:** under the profile card (26), an account row "Signed in as {email}" with a teal text
     button "Sign out" (`data-shot="more-sign-out"`, 44px target). It records `signedOut` and calls
     `signOutSession()`; the sign-in screen shows at once with the account pre-filled. No confirm
     step (one tap brings the presenter back). Shown in both builds.
   - **Reset:** the framed build has several reset paths, and at 60e2d1e each calls
     `resetDemo(useAppStore)` directly: `DemoResetButton`'s `confirmReset`, the Control Panel's "Reset
     to pristine seed" and each scenario jump (`apps/demo/DemoControlPanel.tsx`, about six calls) and
     the Integrations simulator's reset (`apps/demo/DemoIntegrations.tsx`). Add one framed-build
     helper (new, `src/shell/framedReset.ts`, `resetFramedDemo({ clearHints })`) that calls
     `resetDemo(useAppStore)` then `clearAnaesthetistSession()` (and, when asked, work item 14's
     `clearFirstRunHintDismissals()`), and route every framed call through it, so a framed Reset and
     every scenario jump always land signed in. The PWA's `ResetCard` (it calls `resetDemo` itself)
     leaves the session as it is, so Reset on a handset never signs the presenter out. A Vitest checks
     no file under `src/apps/demo` or `src/shell` calls `resetDemo(` except `framedReset.ts`.
   - `pwaPurity.test.ts` holds: `src/shared/session/` imports nothing from apps or shell.

### Simple anaesthetist screens, keeping what the catalogue gives them

5. **Inventory.** Before changing anything, list every component an anaesthetist actor can render on
   mobile, web and the PWA: the sign-in screen and the More tab with 26's profile, prepaid card and
   "Your price list" sheet (work items 3 and 4), the Booking detail body with 20a's stack and the
   capture block, every sheet reachable from it (19's two-tab procedure picker, 20's Contract picker,
   21's payer sheet, 22's Split sheet, 20a's "Add wording as given" sheet, 19b's modifier sheet and
   explanation, 24's Price section, 39b's events and billing-line sheets, 38b's additional invoice and
   39's credit note on their own Procedure, submit, cancel, attachments), 15a's warnings section,
   27's prepaid amount, the List detail and List rows, the add-Booking form (the "as given" field),
   32's move-List and 32a's move-Booking sheets, 38a's main view, archive, calendar and search
   results, the PWA's demo sheet results (21's "Office approves this Contract change", 27's approve
   and send, 31's Draft List assignment, 38b's and 39b's office reviews), Dashboard, Lists, Accounts
   and Balances. For each, note any text or control that shows office-only detail (the lists below),
   **and** confirm each field the catalogue gives the anaesthetist is present. Record the list in the
   PROGRESS entry; it is the reviewers' checklist.

   **Kept on anaesthetist screens (Confirmed or Verify catalogue, built by earlier phases; never
   stripped):**
   - 20a's three-part stack on every Procedure (US-03.1.9, US-03.1.2): the source wording as received
     with its channel and date; the procedure and RVG code (a general procedure marked as one); the
     Contract's name and AA code, "Held by {holder}" (and "own price list"), "Invoiced: {party}" and
     the pricing basis with its figure as `formatPricingBasis` gives it ("Fixed $2,400", "Fixed $2,400
     · own price", "$125.00 per unit", "10% off RVG", "RVG", or what 24 re-pointed it to); "Procedure
     to choose" and "Contract to choose" when empty.
   - 20's procedure and Contract "Change" until submit, the picker rows (No contract (RVG) first,
     holder headings, name and AA code, the same rows the office sees, never a colleague's first-party
     Contract), the RVG codes route, and the "Changed by you · office to check" pill and 21's
     "Approved by the office".
   - 24's Price section in every state: "Your price $" or "Discount %" with a reason on No contract
     (RVG) and their own price list; "Agreed price $2,800.00", "Fixed rate $26.50 a unit" or "RVG
     pricing at your unit value" read-only with "Agreed with {holder}. To use a different price, change
     the Contract." on a third-party Contract; "10% fixed discount, set by the Contract" locked; the
     read-only views; and the one caption when an office override exists, with no figures.
   - 27's prepaid amount and whether it is paid (US-03.1.8); 26's own unit value and prepaid prices.
   - 21's payer on the Booking (name, relationship, email, editable), the read-only Insurance row,
     holder references asked in plain words ("{Contract} needs a member number."), and the mild
     under-18 note.
   - 19b's modifiers: the locked age and P1 pills, the optional modifiers with their units and the
     explanation field.
   - 22's Split button and the "Split: ..." reading; 38b's and 39's own additional invoice and credit
     note; 39b's events with the amounts the anaesthetist types.

   **Office only (must not reach an anaesthetist screen):**
   - the running calculated fee and the Booking total, and every rate label built for them ("FIXED
     CONTRACT PRICE", "FEE @ $x/UNIT", "per unit" beside a total) (the 2026-09-28 ruling, kept by 20a
     and 24 for the total);
   - the office override's figures and its "was $..." line, 24's `priceLayers` and Review's Fee cell;
   - the Contract catalogue's internal detail: versions and their dates, the lines grid, 24's
     "Anaesthetist may adjust" and "Price locked for the anaesthetist" pills, the holder's
     billing settings ("Holder is billed", billable party set-up), invoicing and delivery settings;
   - internal words: "first-party" and "third-party" as labels (the anaesthetist reads "own price list"
     and "Agreed with {holder}"), `isAdjustable`, "price source" as a label;
   - anything Phase 20 or 24 removed, should a string survive: route words ("Route", "direct claim",
     "Insurer (direct claim)"), the old categories ("Type 1", "Type 2", "Type 3"), the payment setting
     ("FULL", "SPLIT" as a setting), "Method 3", "individually arranged", "Hourly rate";
   - the multi-procedure rule's wording (23's 3/2/2 and "base units on the primary only" captions):
     the anaesthetist sees one neutral line;
   - preferences and tiers ("Not preferred", "Preferred", the tier labels): 17's boundary, which this
     phase only re-checks.

6. **One viewer rule** (`src/shared/viewer.ts`, pure TypeScript, no React, no store import, PWA-safe;
   or extend the helper 20a, 21 or 24 already built, never a second one):
   - `viewerOf(actor): 'office' | 'anaesthetist'`: `'office'` only for `actor.role === 'office'`;
     everything else, `'system'` included, is the anaesthetist view, so an unexpected actor fails
     closed. The Booking detail body's `showBookingTotal` (today `actor.role !== 'anaesthetist'`) and
     24's choice between the office's layers and the anaesthetist's override caption move to it. No
     other place in mobile, web or shared capture code branches on role to decide office-only detail.
   - `rateLabelFor(fee)` moves the "FIXED CONTRACT PRICE", "FEE @ $x/UNIT" and any later price-source
     label builder for the total out of the Booking detail body, so it is called only on the office's
     total (work item 7).
   - `OFFICE_ONLY_LABELS`: the office label constants imported from where 18, 19a, 22, 23 and 24 own
     them (never retyped), for the guard test.
   - The stack is **not** branched here: 20a's `procedureStackView` gives both viewers the same stack
     (US-03.1.9: the same in both apps). If 24's re-pointed `pricingBasisFor` shows an office override
     figure in the stack while 24's `PriceCard` hides it from the anaesthetist, make the anaesthetist
     view consistent with the `PriceCard` (the Contract's basis, no override figure) inside 20a's module,
     and log it.
   - Vitest (`viewer.test.ts`): each role maps as stated; `rateLabelFor` over a fixed fee, a unit-rate
     fee and a fixed-rate fee; deterministic.
7. **Apply it** (fix what the inventory found; at plan time these were the known spots, and 20 to 39b
   will have fixed most):
   - `BtmCaptureBlock`: confirm `ROUTE_LABEL`, `CONTEXT_FIELDS` and the old context line are gone
     (20, 20a); the Contract is shown only by 20a's stack.
   - The Booking detail body: compute the rate label only inside the office branch
     (`viewerOf(actor) === 'office'`), through `rateLabelFor`. At 60e2d1e the label is computed for
     every viewer and drawn only on the office's total; this makes it office-only by construction.
   - The capture block's multi-procedure wording (23): the anaesthetist sees one neutral line, "Second
     procedure. Record its times as usual." (or "Third", by ordinal), unless 23's caption already reads
     as plainly; the office keeps 23's rule wording.
   - `AddBillingLineSheet`, 39b's events sheet, 38b's additional invoice and 39's credit note sheets:
     line types and amounts the anaesthetist types, by plain name; no rate basis, "Method" or hourly
     wording.
   - 21's payer sheet and Insurance row: plain words only; no "billable party" or holder-setting
     caption.
   - 24's `PriceCard`: keep every state as built; a refusal message that names the internal rule
     ("isAdjustable", "first-party") cannot occur from the UI; leave the store messages as they are.
   - `EditProcedureSheet`, the add-Booking form, `ListDetailScreen`, `ListDetailView`, the List row
     caption, 38a's rows, Dashboard, Lists, Accounts and Balances: fix any item the inventory found.
   - `EditBillingSetupSheet`, `OfficeBillingSetup`, `PriceOverrideSheet` and the Contract catalogue:
     confirm each is mounted only for an office actor.
8. **No copy with a dash** in anything touched; keep "·", commas or "to".
9. **The guard test** (`src/apps/anaesthetistSimplicity.test.tsx`), the rule's one enforcement point,
   in both directions:
   - **Render scan.** For an anaesthetist actor (Dr Souter), inside the mobile and then the web
     `SurfaceProvider`, render the Booking detail for a set of Bookings that between them cover every
     Contract and price case: No contract (RVG) with the patient as payer and with a guardian payer
     (21); a third-party fixed-price line (the Southern Cross case of US-03.1.9's AC); a fixed-rate
     line; a fixed-discount line; a holder's plain RVG Contract (D32); her own first-party Contract on
     a prepaid Booking (27); ACC as a holder; a combination Contract (23); a split Procedure (22); her
     typed price and her discount (24); an office override (24); a Procedure with no Contract yet and
     one with no procedure yet (D33); a general procedure (D37); and a Booking with a pre-op and a
     post-op event (39b). Use seeded Bookings where they exist and build the rest in the test with the
     billing fixtures (`domain/billing/fixtures.ts`: `mkContract`, `mkProcedure`, `mkBooking`, or the
     builders 18 to 24 added) over a test-local store state, never in the seed. Render each on an
     ACTIVE and on a SUBMITTED List. Also open the procedure picker, the Contract picker, the payer
     sheet, the Split sheet, the billing-line and events sheets, and render List detail and the List
     rows for those Lists.
   - **Forbidden text** is built from `OFFICE_ONLY_LABELS` and `rateLabelFor` over a fixed fee, a
     unit-rate fee and a fixed-rate fee, plus each office override figure as formatted, plus a short
     literal list: "FIXED CONTRACT PRICE", "/UNIT", "Anaesthetist may adjust", "Price locked for the
     anaesthetist", "first-party", "third-party", "Method 3", "individually arranged", "Hourly rate",
     "direct claim", "Route", "Type 1", "Type 2", "Type 3", "Not preferred", "Tier 1" to "Tier 4" (or
     17's D36 labels). The scan reads `textContent` and every `aria-label` and `title`.
   - **Kept text (the other direction).** For the same anaesthetist renders: every Procedure with a
     Contract shows `[data-shot=procedure-stack]` with its Contract's name, holder name, invoiced
     party and `formatPricingBasis` output; the Southern Cross case shows the fixed price; the
     `PriceCard`'s `data-state` matches the Contract (`adjustable`, `own-price`, `third-party`,
     `fixed-discount`, `read-only` on SUBMITTED); the prepaid Booking shows its prepaid amount; the
     payer's name shows. So the sweep cannot pass by stripping what the catalogue requires.
   - **Positive control.** The same renders for the office actor contain the Booking total's rate
     label and the office override's figure for at least one Booking, so the forbidden scan cannot
     pass by rendering nothing.
   - **Source scan** (in the style of `moneyViewPurity.test.ts`): no file under `src/apps/mobile` or
     `src/apps/web` imports `OfficeBillingSetup`, `EditBillingSetupSheet`, `PriceOverrideSheet`, the
     Contract catalogue components or the office label maps. Preferences and tiers stay 17's
     `officePrivacy.test.ts`; if importing 17's labels here would trip its allowlist, use the literal
     labels instead.

### Point-of-need help

10. **One topic file** (`src/shared/help/helpTopics.ts`, pure TypeScript, PWA-safe):
    - `type HelpTopicId` is a string union; `HELP_TOPICS: Record<HelpTopicId, HelpTopic>` where
      `HelpTopic = { title: string; body: readonly string[]; provisional?: { oq: string; note: string } }`.
      The body is one to three short sentences per paragraph and at most 60 words in all.
    - All help copy in the app lives here, so a later screen change keeps its tip by keeping the topic
      id, and an answered OQ changes one entry. At 60e2d1e no topic is provisional; the field stays
      for a later open point.
    - Vitest (`helpTopics.test.ts`): no en or em dash in any title or body; every body at most 60 words;
      no body contains "slot" (OQ-64: the word never reaches app copy), "event" (38b keeps that label
      in one place), "estimate" or "deposit" (the prepaid amount is never called either), "blacklist"
      or "DRAFT"; every `provisional.oq` matches `OQ-\d+`; every id used by a component exists (a typed
      union makes this a compile error; the test checks the reverse, that no topic is unused).
11. **The topics** (copy verbatim unless the drift check changed a rule; each must match what phases 15a
    to 39b actually built, so re-read the screen before keeping a sentence):

    | id | Where | Title | Body |
    |---|---|---|---|
    | `capture.stack` | Booking capture, 20a's stack (its first label) | Reading a procedure | "Each procedure shows three parts. As received is the wording the rooms or hospital sent, kept exactly. Procedure is what it was matched to, with its RVG code. Contract shows who holds it, who is invoiced and how it is priced." (US-03.1.9, US-03.1.2) |
    | `capture.procedure` | 19's procedure picker, beside its tabs | Choosing a procedure | "Search once by name or code. Procedures lists named operations; RVG codes lists the published codes, each with a general procedure. The starting base units come from the Contract, the procedure or its RVG group. You can change them: any value is accepted, and an unusual one gives the office a note to check." (D3, D12 as superseded, AR-28 `rvg-groups-and-procedures`) |
    | `capture.contract` | 20's Contract picker header, and beside the stack's Contract action | Contract | "No contract (RVG) comes first. It prices on the RVG and invoices the payer on the Booking. Below it are the Contracts that fit this Booking, under who holds them. You can change the Contract until you submit, for example when insurance pre-approval falls through. The office sees every change." (D16, D17 as superseded, OQ-78 answered, US-03.4.1, AR-28 `no-contract-rvg`, `who-gets-the-invoice`) |
    | `capture.price` | 24's Price section | Price | "What you can change depends on the Contract. On No contract (RVG) or your own price list, type your price or a discount, with a reason. Another party's agreed price stays as it is: to use a different price, change the Contract. A fixed discount is shown, locked." (FT-03.5, US-03.5.1, AR-28 `what-the-anaesthetist-can-change`) |
    | `capture.modifiers` | 19b's modifiers section | Modifiers | "Age modifiers, and P1 on neurosurgery and spine codes, are added for you and locked. Every other modifier, ASA included, is optional: tick it and add a short explanation of why it applies." (US-03.3.8, US-05.1.4 and D43, US-03.3.4, AR-28 `modifiers`) |
    | `capture.times` | `TimesCard` | Times | "Tap Start now when the anaesthetic starts and Finish now at handover. You can adjust either time afterwards. Time units come from these two times, and a part interval always counts as a whole one." (D25) |
    | `capture.warnings` | Booking capture, 15a's warnings section | Warnings | "A warning is a reminder, never a block. It shows here when you open the Booking. You can still complete and submit as usual. The office sees the same warning on its to-do list." (US-13.7.3: no confirm step) |
    | `day.statuses` | Admin Day, beside the status legend | Reading the day | "Each row is one anaesthetist's day: a morning and an afternoon session. A session shows its List, or its availability when it has none. The legend names each kind of List, then each availability status from the office's own list. Select one in the legend to hide or show it." (D14; names no colour, because 29 makes the availability statuses editable) |
    | `day.draftLists` | Admin Day, 31's band and the Draft Lists rail card | Draft Lists | "A Draft List has a hospital, surgeon, day and session, but no anaesthetist yet. Only the office assigns one; anaesthetists never see them. A List lands here when, for example, its anaesthetist returns it or a surgeon's regular booking falls on a session marked unavailable. Suggestions come in priority order, with any not-preferred pairing shown apart." (FT-01.6, D14, D44, D46; names no tier) |
    | `day.needsContract` | Admin Day, 20's "Needs a Contract" card | Needs a Contract | "Every procedure needs a Contract before it can be completed. These Bookings arrived without one. Open one and pick: No contract (RVG) comes first, then the Contracts that fit. Nothing is chosen for you from the hospital." (US-04.3.4, US-04.3.3, OQ-78 answered) |
    | `day.todo` | Admin Day, 15a's To-do rail card | To-do | "Warnings that need action land here. None of them blocks anything. Open one to see the Booking, and Clear it once it is dealt with. Notices that need no action, such as a List an anaesthetist moved, go to Notifications instead." (FT-13.7 note, D15) |
    | `review.flags` | Admin Review, the Flags tile | Flags | "Flags are things to check before you authorise. Fix them here, or phone the anaesthetist. A List is never sent back to the anaesthetist for changes." (US-07.2.3, US-07.2.2: no warning blocks authorise) |
    | `review.contracts` | Admin Review, the stack column heading (20a, 21) | Procedures and Contracts | "Each procedure shows its wording as received, the procedure and the Contract. Check the Contract and the payer; a change the anaesthetist made is marked. A Booking that says an insurer pays, with no insurer Contract chosen, is flagged, but you can still authorise." (US-07.2.2) |
    | `review.price` | Admin Review, 24's Fee heading | How the price is set | "The first that applies sets the price: your override; the anaesthetist's own price, allowed only on No contract (RVG) or their own price list; the Contract's fixed price; otherwise units at the Contract's fixed rate or the anaesthetist's unit value, less any discount: the Contract's fixed one or the anaesthetist's own." (FT-05.2, DM-50) |
    | `review.authorise` | Admin Review, the action bar beside "Authorise for billing" | Authorising | "Authorising locks the List, its Bookings and the prices they use, and passes it to billing for its invoices. Anything added afterwards is invoiced in the next run. A correction is made by hand, with an additional invoice or a credit note." (US-07.3.1, 25, 38b, 39; nothing is raised automatically; avoids the word "event", whose label 38b keeps in one place) |

    Keep the list at about fifteen. Do not add tips to other screens in this phase. If a sentence
    depends on an open point after the drift check, give the topic `provisional` and show the pill.
    `capture.units` (planned at 3d3a18c) is dropped: the stack, the picker, the modifiers and the
    Price section now explain the units and the price, and no screen shows a computed fee to explain.
12. **`InfoTip`** (`src/shared/help/InfoTip.tsx`, exported from `src/shared/index.ts`; PWA-safe):
    - Props: `topic: HelpTopicId`, optional `placement` hint for the popover. It reads `useSurface()`.
    - **Trigger:** a `button` with lucide `Info` at 16px in `neutral.mist`, teal (`accent.base`) on
      hover, focus and while open; `aria-label="About {title}"`, `aria-expanded`, `aria-controls`;
      `data-shot="info-tip-{topic id with dots as dashes}"`. On mobile the hit area is 44 by 44 with
      the glyph centred, made with padding and a balancing negative margin so the label row does not
      grow; it must never overlap another control (tested in work item 15). On desktop the hit area is
      28 by 28.
    - **Mobile:** opens through `useSurface().Overlay` (the `BottomSheet`, `sheet-in`): the title (18px,
      700), the body paragraphs (14px, slate), the Provisional pill when set, and one secondary "Got it"
      button. Never a centred modal (convention 16). A tip inside a sheet that is itself a bottom
      sheet (the procedure or Contract picker) opens a stacked sheet or an inline expandable note under
      the header, whichever the surface seam supports cleanly; never a second modal layer that traps
      the picker.
    - **Desktop (web and admin):** an anchored popover, not the centred `Dialog`: about 320px wide,
      radius `card`, e-2, `neutral.surface`, `role="dialog"` labelled by its title, rendered through a
      portal with fixed positioning from the trigger's rect (flipping above or left when it would leave
      the viewport), so Review's horizontally scrolling table and the List drawer never clip it. Esc,
      an outside click or the trigger closes it, and focus returns to the trigger. One popover open at a
      time.
    - Reduced motion: 80ms fades.
    - The existing native `title` tooltips (`StatusLegend`, `DayGrid` conflicts, segmented controls,
      20a's compact stack titles) stay as hover extras; they are not the help mechanism and are not
      replaced.
    - Component test (`InfoTip.test.tsx`): mobile renders the sheet with the topic's copy; web renders
      the popover with `role="dialog"`; Esc closes and refocuses the trigger; opening a second tip
      closes the first; the accessible name is "About {title}".
13. **Place the tips** (work item 11's table):
    - `CaptureSection` gains an optional `help?: HelpTopicId`, drawn at the right end of its micro-caps
      label row. Times, the modifiers section and the Price section pass theirs where they are
      `CaptureSection`s; 20a's `ProcedureStack` (beside its first label, full density only), the
      pickers' headers, 15a's warnings section and any other element that is not a `CaptureSection`
      places `InfoTip` beside its own label. Because the capture block and the stack are shared, the
      anaesthetist web app gets the same tips; the office's view of the same Booking gets them too,
      which is fine (the copy reads for both).
    - Admin Day: beside the `StatusLegend` chips in `DayGrid`, in 31's band label and the Draft Lists
      rail card heading (one topic, two places), in 20's Needs a Contract card heading and in 15a's
      To-do card heading.
    - Admin Review: in the Flags tile label, the stack column heading, the Fee column heading (or
      wherever 24 shows the price layers) and beside "Authorise for billing" in the action bar.
    - Nothing else on these screens moves; tips add no rows and no new cards.
14. **First-run hints** (`src/shared/help/firstRunHints.ts` and `src/shared/help/FirstRunHint.tsx`):
    - `firstRunHints.ts` (no React; PWA-safe): `type HintApp = 'mobile' | 'web' | 'admin'`; keys
      `aa-first-run-hint-mobile`, `-web` and `-admin`; a tiny non-persisted zustand store (like work
      item 1's) mirroring `{ dismissed: Record<HintApp, boolean> }`, read from `localStorage` once and
      written through on change, every access wrapped in try/catch so a blocked storage shows the hint
      and never throws; `dismissHint(app)`, `clearFirstRunHintDismissals()` and `anyHintDismissed()`.
      It is per-viewer browser state, never in `AppState`, never audited, and `PERSIST_VERSION` does
      not move.
    - `FirstRunHint({ app })`: an inline card in page flow (never a modal, never a scrim, nothing
      positioned over other content), radius `card`, `accent.tint` fill, e-1, a 20px `Info` glyph in
      teal, a title, one or two lines, and a teal text button "Got it" that calls `dismissHint`.
      `data-shot="first-run-hint-{app}"`. Copy:
      - **Mobile** (under the greeting on 38a's main view, after sign-in; the PWA shows the same):
        title "Welcome to your Lists"; body "Today's Lists come first. Tap a List to see its Bookings,
        then a Booking to capture it. Tap the info sign beside a heading for a short explanation."
      - **Web** (under the Dashboard greeting): title "Welcome"; body "Your week is here, and Lists
        holds every List and Booking. Select the info sign beside a heading for a short explanation."
      - **Admin** (between `DayNav` and the grid on the Day view): title "The day at a glance"; body
        "Every anaesthetist's morning and afternoon, Draft Lists waiting for one, and your to-do list
        and notifications on the right. Select the info sign beside a heading for a short
        explanation."
    - The two Reset buttons clear the dismissals: the framed build's `DemoResetButton` (`confirmReset`)
      and the Control Panel's "Reset to pristine seed", both through work item 4's
      `resetFramedDemo({ clearHints: true })`, and `PwaDemoPanel`'s `ResetCard` beside its
      `clearInstallCoachDismissal()` call. Scenario jumps and the Integrations simulator's reset call
      `resetFramedDemo({ clearHints: false })`: they land signed in but keep the presenter's dismissals,
      so a welcome card the presenter dismissed before the audience arrived never reappears mid-demo
      (a built default; log it on the "For the owner's review" list).
    - On mobile the card respects the insets and `DockSpacer`; it never pushes the tab bar.
    - Vitest (`firstRunHints.test.ts`): dismiss persists across a fresh store over the same storage;
      clear restores all three; a throwing `localStorage` leaves every hint showing and no exception.
15. **Tests and shots.**
    - **Keep existing specs as they were.** In `playwright.config.ts`, give both projects a
      `storageState` file (`visual/storage/demo-ready.json`): the three hint keys set for the 5173 and
      5174 origins, and `aa-anaesthetist-session` signed in for 5174, so no existing spec sees a
      first-run card or the PWA sign-in screen and no flow or screenshot moves. The new specs opt out
      with `test.use({ storageState: { cookies: [], origins: [] } })`.
    - New `visual/ease-of-use.spec.ts` (prototype project):
      - fresh storage: the Admin Day, web Dashboard and mobile main view show their hint; "Got it"
        hides it and it stays hidden after a reload;
      - "Show first-run hints again" in Demo actions brings them back;
      - the framed phone opens signed in; More → Sign out shows the sign-in screen with the account
        pre-filled; Sign in returns to the same route; Reset leaves it signed in;
      - mobile Booking capture: tap `info-tip-capture-stack`, the sheet opens with the stack copy,
        "Got it" closes it; the stack, its Contract part (holder, invoiced party, basis) and the Price
        section are still on screen (`data-shot` captures for the guide);
      - Admin Day: the `day-statuses` popover opens beside the legend; Esc closes it and focus returns;
      - Admin Review: the `review-contracts` popover renders whole inside the viewport although the
        table scrolls horizontally;
      - **touch targets:** on mobile capture, for every `[data-shot^="info-tip-"]`, the four corners of
        its 44px box resolve through `document.elementFromPoint` to the tip itself, and the tip's box
        does not intersect any other `button`, `a`, `input` or `[role="button"]` (the stack's
        Change, Split and "Add wording as given" actions included).
    - `visual/pwa-device.spec.ts`, in a fresh-storage block: the PWA opens on the sign-in screen at
      `/mobile/lists` and at a deep Booking URL; an empty password and a wrong email show their inline
      messages; Sign in lands on the URL it opened; a reload stays signed in; the PWA Reset stays
      signed in; the Demo chip's "Sign out" returns to the sign-in screen; the sign-in card and the
      mobile hint clear the insets and the dock floor; the Demo chip on Lists offers "Show first-run
      hints again".
    - Admin Audit (prototype project): after a sign-in, a refused attempt and a sign-out on the
      framed phone, the Audit viewer filtered to `account` shows the three rows.
    - Component tests: `SignInScreen` (pre-fill from the store, the three messages, sign-in calls the
      session and the audit action); the gate in `MobileApp` for each `sessionDefault`; `CaptureSection`
      with and without `help`; `FirstRunHint` dismiss; the Review and Day placements render their
      tips.
    - `pwaPurity.test.ts` holds (`src/shared/help/`, `src/shared/session/` and `src/shared/viewer.ts`
      sit in the PWA closure and import nothing from apps or shell).

### Demo triggers

16. Register both in `src/shared/demoTriggers/registry.ts`; their bodies live in `src/shared/session`,
    `src/shared/help` and `src/store`, PWA-safe:
    - **"Sign out"** (`id: 'pwa-sign-out'`; the PWA stand-in ROADMAP.md's PWA parity list names for
      43a): description "Signs Dr Souter out, as at the end of a shift. The sign-in screen shows with
      the account filled in.", screen "Mobile · any screen", routes `/mobile/*`, surfaces `['pwa']`.
      `run` records `signedOut` and calls `signOutSession()`, returning `{ ok: true, message: 'Signed
      out. Tap Sign in to come back.' }`. `disabledReason` is "Already signed out" while signed out.
      `indexPath: () => '/mobile/more'`, `indexHint: 'On a handset, from the Demo sheet; in the framed
      phone, use Sign out on More.'`
    - **"Show first-run hints again"** (`id: 'show-first-run-hints'`): description "Brings back the
      welcome card on Mobile, Web and Admin, as for a first visit.", screen "All apps", routes
      `/mobile/*`, `/web/*` and `/admin/*`, surfaces `['bar', 'pwa']`. `run` calls
      `clearFirstRunHintDismissals()` and returns `{ ok: true, message: 'The welcome cards will show
      again.' }`; it touches no domain state. `disabledReason` is "No welcome card has been dismissed"
      while `anyHintDismissed()` is false. `indexPath: () => '/admin'`.
    - The session and hint stores are not `AppState`, so the harness bar's Demo actions menu and
      `PwaDemoActions` must re-evaluate `disabledReason` when either changes (subscribe to both, or
      compute on open); otherwise "Got it" or Sign in leaves an entry in the wrong state until the next
      route change.
    - Vitest in the registry's tests: "Sign out" visible only on the PWA surface on a mobile route,
      disabled while signed out, and running it signs out and writes one audit row; "Show first-run
      hints again" visible on a mobile, web and admin route and on the PWA surface, disabled until a
      hint is dismissed, and running it clears all three.

## Demo triggers

| Trigger | Screen | Surfaces | What it does |
|---|---|---|---|
| Sign out | Every Mobile route | PWA demo sheet only | Signs Dr Souter out (one audited row) so the PWA shows the sign-in screen with the account pre-filled. Disabled with "Already signed out". The framed phone uses the product's own Sign out on More. |
| Show first-run hints again | Every Mobile, Web and Admin route | Harness bar and PWA demo sheet | Clears the three per-browser dismissals so each app's welcome card shows again. Disabled with "No welcome card has been dismissed". |

Everything else is demoable through normal use: the sign-in screen shows on any fresh handset and
after Sign out on More, the tips are product UI on the screens they explain, and the hints show on
any fresh browser and after Reset. Nothing waits on the office, a colleague or a backend event, so
"Sign out" is the only PWA stand-in. The Control Panel page gains nothing; Phase 14's index lists both
triggers under their screens.

## Out of scope

- A real identity provider (Auth0 or Entra), password storage or checking, MFA, single sign-on or
  social login, biometrics, self-service password reset, session expiry and a native app (OQ-83;
  narrated, and Phase 14's "Simulate sign-in attempts" audit rows stay the account-service story on
  `/admin/audit`).
- A sign-in on the anaesthetist web app or the Admin app (US-13.5.3 says PWA first; narrated), and
  any persona switch on the sign-in screen (one demo account).
- Training per user group and short standalone documentation (presenter-narrated, as US-15.0.1's
  technical discussion describes them).
- A help centre, a searchable manual, a per-app Help page, guided tours, coach marks or a spotlight
  overlay, and any AI assistant.
- Tips on any screen other than Booking capture (with its pickers), Admin Day and Admin Review
  (Lists, Availability, Accounts, Invoices, Billing monitor, Masters, Intake, Notifications, the
  archive). A later phase adds a topic and a `help` prop if AA asks.
- Hiding anything the catalogue gives the anaesthetist: the three-part stack (US-03.1.9, US-03.1.2),
  the Price section and its states (FT-03.5, US-03.5.1), the prepaid amount (US-03.1.8), the payer
  (US-11.2.2), the Split (US-08.2.3), the modifiers (US-03.3.4). Rewording 20a's stack or 24's Price
  section beyond removing office-only words.
- Rewording the office's own Contract detail, the Contract editor, or Review's columns beyond placing
  tips.
- Removing the anaesthetist's procedure or Contract "Change" (US-03.4.1, Phase 20's rule) or the payer
  edit (US-11.2.2, Phase 21's).
- Any calculated fee or Booking total on the anaesthetist's Booking screens (the 2026-09-28 ruling as
  20a and 24 kept it: the amounts shown are the Contract's figure in the stack, the Price section's
  figures and typed amounts, and 27's prepaid amount); any change to web Accounts beyond the sweep.
- Preferences and tiers (17's privacy boundary and test own them).
- Localisation, te reo Māori copy beyond the existing greeting, and accessibility work beyond the new
  components (a full audit is not in scope).
- The S1 to S5 rewrite (Phase 44).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] PWA (`npm run dev:pwa`, fresh storage): `/mobile/lists` opens on the sign-in screen with Dr
      Souter's email and a masked password filled in, the AA logo, a teal Sign in, the Provisional
      caption naming OQ-83 and the Synthetic data only badge. Clear the password: "Enter your
      password". Type another email: "No account with that email. Use the demo account." Restore and
      tap Sign in: the main view shows at once.
- [ ] PWA: reload and relaunch stay signed in. Open a deep Booking URL while signed out: after Sign
      in it lands on that Booking. PWA Reset leaves the handset signed in.
- [ ] PWA: More shows "Signed in as m.souter@aa-associates.example" and Sign out under the profile;
      Sign out returns to the sign-in screen with the account pre-filled. The Demo chip's "Sign out"
      does the same and is disabled with "Already signed out" on the sign-in screen.
- [ ] Framed prototype: Reset, then Mobile opens signed in with no sign-in screen. More → Sign out
      shows the sign-in screen inside the phone frame; Sign in returns. Admin → Audit, entity type
      account: the sign-in, refused and sign-out rows are there, as Dr Souter, at demo-clock time.
- [ ] Framed prototype: sign out on More, then run a Control Panel scenario jump: Mobile opens signed
      in. Dismiss the welcome cards, run a scenario jump: they stay dismissed; Reset brings them back.
- [ ] Reset. Mobile main view: the "Welcome to your Lists" card sits under the greeting; "Got it" hides
      it; a reload keeps it hidden. Web Dashboard and Admin Day show their own card the same way.
- [ ] Demo actions → "Show first-run hints again": all three cards come back. With none dismissed, the
      entry is disabled with its reason.
- [ ] **Kept.** Mobile, Dr Souter, on an ACTIVE List: open a No contract (RVG) Booking, a third-party
      fixed-price Booking (20a's or 24's Southern Cross case), the "RTK" Booking (20a) and her prepaid
      Booking on her own price list (27). Each Procedure shows the stack: the wording as received, the
      procedure and RVG code, then the Contract's name, holder, who is invoiced and its pricing basis
      with the figure. The Price section shows its state (typed price or discount offered; "Agreed
      price" read-only with "change the Contract"; a fixed discount locked; "Your price list" on her
      own Contract), and the prepaid Booking shows its prepaid amount. The payer row shows the payer.
- [ ] **Swept.** On the same Bookings, their sheets and the List: no Booking total or running fee, no
      "FIXED CONTRACT PRICE" or "FEE @" label, no office override figure (only "The office has set a
      price override on this procedure." where one exists), no "Anaesthetist may adjust" or "Price
      locked" pill, no version or lines grid, no route, category, Method 3 or hourly wording, no
      "first-party" or "third-party", no preference or tier. Admin's view of the same Bookings still
      shows the total, the rate label, the override and its layers.
- [ ] Open the Contract picker as the anaesthetist: No contract (RVG) first, then holder headings with
      name and AA code, the same rows the office sees, no colleague's own price list. Change the
      Contract: the "Changed by you · office to check" pill shows and the stack updates.
- [ ] Add a second procedure on mobile: the anaesthetist sees a plain line with no rule wording; Admin's
      view of the same Booking shows 23's rule wording.
- [ ] Add a billing line and a post-op event on mobile: line types by plain name, amounts typed, no
      "Method", rate or computed amount.
- [ ] On capture, tap the info sign on the stack, the procedure picker, the Contract, the modifiers, the
      Price section, Times and Warnings: each opens a bottom sheet with its copy and "Got it"; none is a
      centred modal and none traps the picker sheet; each tip is easy to hit without touching a
      stepper, chip, Change, Split or "Add wording as given". The Warnings copy mentions no confirm
      step, and submitting a Booking with a warning goes straight through.
- [ ] Web → the same Booking: the same tips open as popovers; Esc closes and returns focus.
- [ ] Admin Day Tue 21 Jul: the tips beside the legend, on the Draft Lists band and rail card, on the
      Needs a Contract card and on the To-do card open popovers that stay on screen at 1280px and
      1440px. No tip carries a Provisional pill; no tip text says "slot", "event", "estimate" or a tier
      name; the To-do tip points to Notifications.
- [ ] Admin Review (Dr Morrison, Mon 20 Jul, or the submitted List 21's recipes use): the Flags, stack
      column, Fee and Authorise tips open, and the stack column popover is not clipped by the table.
      Each tip's copy matches what the screen does (the price order, the insurer warning, nothing
      automatic after authorise).
- [ ] PWA (fresh storage, after sign-in): the mobile card clears the insets, the tips open as sheets,
      and the Demo chip offers "Show first-run hints again" and "Sign out".
- [ ] Keyboard: every tip is reachable by Tab and opens on Enter or Space; screen-reader names read
      "About {title}"; the sign-in fields are labelled and Enter submits.
- [ ] No en or em dashes in any new string; teal the only action colour; crimson only in the logo and
      avatar; the Provisional pill shows only on the sign-in screen.
- [ ] Catalogue screenshots: the recipes for US-15.0.1 are updated and the one for US-13.5.3 created,
      any recipe this phase broke is re-pointed, the capture runner presets the three first-run
      dismissals and the PWA session, a full `npm run capture` ends with no failed recipe and no story
      without a recipe, the covered items' new shots are checked by eye (the stack and Price section
      visible in the capture shot), and `npm run verify:board` is green.
- [ ] `PERSIST_VERSION` unchanged; `npm run build`, `npm run build:pwa`, `npx vitest run`,
      `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch in the same session (`docs/demo-guide/`, the same sections of `master-demo-guide.html`; earlier
phases have rewritten these beats, so locate each passage by text):

- `03-demo-script.md`:
  - **Pre-demo setup:** after Reset the welcome cards show on all three apps. Dismiss them before the
    audience arrives, or leave the mobile one to open S1 with. "Show first-run hints again" in Demo
    actions brings them back. On a handset, the installed PWA opens on the sign-in screen the first
    time: tap Sign in (the account is filled in) before the audience arrives, or use it as the opener.
    The framed phone always opens signed in.
  - **S1 Beat 3 (capture), Worth pointing at:** add "The anaesthetist sees what the Contract means for
    them: the wording as received, the procedure, the Contract with who is invoiced and how it is
    priced, and what they may change on the price. Rates, overrides and Contract set-up stay with the
    office. Tap the info sign on the procedure for the point-of-need explanation." Say: "Help sits on
    the screen, where it is needed, so the manual stays short." On a handset, optionally open with the
    sign-in: "An anaesthetist signs in once with their account; how, exactly, is still being decided."
    Replace any line 20a or an earlier plan left saying the anaesthetist sees the Contract "by name
    only".
  - **S2 Beat 1:** after the grid pause, open the tip beside the status legend and, if the band is on
    screen, the Draft Lists tip; optionally the Needs a Contract tip. Expected: a small popover,
    closed with Esc.
  - **S2 Beat 4:** optionally open the stack column or price tip before authorising. Add a discovery
    point: "which screens AA wants help on next, and whether training per user group is enough".
  - **S5 Beat 1 (optional aside):** with entity type account, the sign-in and sign-out rows from the
    handset sit beside Phase 14's simulated rows.
  - **What to narrate rather than click:** add training per user group before go-live, the short
    standalone guides, and the identity service (Auth0 proposed, MFA, single sign-on, Face ID on a
    native app, self-service password reset; OQ-83).
- `04-presenter-cheat-sheet.md`: under "Likely evaluator questions" add "How will people who are not
  comfortable with new systems cope?" (answer: large controls and one clear action, each procedure
  shown the same way in every app (as received, matched, on its Contract), only what the anaesthetist
  needs on their screens with rates and Contract set-up left to the office, help beside each heading
  on the daily screens, a welcome card, and training per group) and "How do anaesthetists sign in?"
  (answer: an account login on the PWA, shown simulated; the identity provider, MFA, single sign-on and
  biometrics are still to be decided, and the audit logs every attempt); "Built and clickable" lists
  the sign-in, the tips and the welcome cards; the handset section names the Demo chip's "Sign out";
  "What each app is for" (Anaesthetist Mobile and Web) gains "sees each procedure's Contract, who is
  invoiced and the price they may change; never rates, overrides, tiers or preferences". Remove any
  cheat-sheet line that says the anaesthetist sees the Contract "by name only".
- `02-workflows-and-handoffs.md`: one line in the capture workflow that the anaesthetist sees the
  Contract summary and their price options while the office keeps rates, overrides and Contract
  set-up, and one that the anaesthetist signs in to the PWA once.
- `01-personas-and-responsibilities.md`: Dr Souter's entry gains her demo sign-in account.
- `master-demo-guide.html`: the same passages.
- Control Panel scenario text: no change.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 43a` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-15.0.1](../../../../requirements-board/requirements/stories/US-15.0.1.md) Ease of use | partial · mobile-card-capture and admin-day-view (reason: "Ease of use is a quality that screenshots can only suggest ... needs usability testing, which the prototype has not had") | partial, with a rewritten reason: the shots show the calm capture screen with the procedure, its Contract and the price options plainly, the point-of-need help and the welcome cards, but whether people not comfortable with modern systems find it intuitive needs usability testing, which the prototype has not had (no later phase builds it). Keep both shot names (`card-capture`, app mobile, and `day-view`, app admin; today one state each, giving `mobile-card-capture.png` and `admin-day-view.png`; with named states the runner writes `mobile-card-capture-<state>.png` and `admin-day-view-<state>.png` and rewrites the item's `images`, so check the two old single images leave the frontmatter) and re-shoot: `card-capture` (mobile on :5174, signed in by the runner's preset; keep the recipe's start on Margaret Ellison's Booking BK0009 at `/mobile/lists/L-34821-2026-07-21-PM/bookings/BK0009`, re-pointed to the List id 28 gave it if that route moved) with states `stack-kept` (highlight `[data-shot=procedure-stack]` and `[data-shot=price-card]`: the wording as received, the procedure and RVG code, the Contract with holder, who is invoiced and basis, and the Price section; no total, rate label or override figure) and `tip-open` (tap `[data-shot=info-tip-capture-stack]`: the bottom sheet with the stack copy and "Got it"); `day-view` (admin, `/admin/day/2026-07-21`) with states `day` (highlight the grid and the to-do list) and `tip-open` (open `info-tip-day-statuses`: the popover beside the legend). Add shots `first-run-hint` for the mobile main view, web Dashboard and Admin Day (`first-run-hint-mobile`, `-web`, `-admin`: the welcome card, reached with the "Show first-run hints again" entry because the capture preset hides it) and `review-tip` (admin `/admin/review/:listId`, the stack column popover whole inside the viewport, `info-tip-review-contracts`). Add a web Booking shot with `info-tip-capture-price` open as a popover beside the Price section. Captions: `card-capture`'s "Booking capture on the phone, large controls and one clear action" becomes "Booking capture: the procedure, its Contract and the price options, nothing the office handles"; `day-view` keeps "Office day view, the main operational screen"; the `tip-open` states and the tip shots use "Help at the point of need"; the hint shots "Welcome card shown on first visit" |
| [US-13.5.3](../../../../requirements-board/requirements/stories/US-13.5.3.md) Sign in to the anaesthetist app | none (create it) | create, status captured. Mobile on :5174. Shot `pwa-sign-in`: open `/mobile/more`, tap `[data-shot=more-sign-out]` (the runner's preset starts signed in), state `sign-in` highlighting `[data-shot=sign-in-screen]`'s card (the pre-filled account, Sign in and the OQ-83 Provisional caption); then tap `[data-shot=sign-in-submit]`, state `signed-in` on `/mobile/lists`. Shot `more-account`: `/mobile/more`, highlight the "Signed in as" row and Sign out only (crop above the PWA build panel, which changes every run, and below 26's profile card). Caption: "The anaesthetist signs in to the PWA with their account (simulated sign-in; the identity service is still to be decided)" |

**Recipes this phase must not break.** The stack and Price section recipes other phases own
(US-03.1.2 and US-03.1.9 at `[data-shot=procedure-contract]` and `procedure-stack`, 20a; US-03.5.1,
US-05.4.3 and US-05.2.6 at `price-card`, 24; US-03.1.8, 27; US-11.2.2, 21; US-04.3.3, 20) must still
show on the anaesthetist screens exactly what they captured before this phase. Run them with `--dry`
and check their images by eye; a change there means the sweep stripped something it must keep.

**Recipes this phase breaks.**

- **The PWA opens on the sign-in screen with fresh storage.** Every mobile shot runs on :5174, and each
  capture state starts from empty browser storage, so without a preset every mobile recipe would shoot
  the sign-in screen. Make `requirements-board/scripts/capture.ts` start each :5174 context with
  `aa-anaesthetist-session` signed in (set as in `visual/storage/demo-ready.json`), and have the
  US-13.5.3 states reach the sign-in screen through More → Sign out. Check several mobile images by
  eye.
- **First-run welcome cards appear in every fresh context.** The new welcome card shows on the mobile
  main view, the web Dashboard and the Admin Day view in the shots of every recipe that opens them.
  Do what the Playwright specs do: make `capture.ts` start each context with the three dismissal
  keys (`aa-first-run-hint-mobile`, `-web`, `-admin`) on both origins, and have the `first-run-hint`
  states above bring the card back with the "Show first-run hints again" entry. Check one image per
  app by eye. Roughly seven recipes start on a bare app root or Lists page, and the many
  `/admin/day/` recipes (about fifty) start on the Day view.
- **The More tab gains the account row.** Recipes that start on `/mobile/more` (26's `mobile-profile`
  and `mobile-prepaid` for US-12.1.1 and US-12.1.3) shift by one row; re-check their highlights.
- `CaptureSection`, the stack, the pickers and the Price section gain an info tip in their label rows,
  so recipes selecting by a section label's exact text (for example `text="Times"` or
  `text="Price"`) may now match the tip's accessible name too; re-run with `--dry`.
- Work item 15 keeps the existing Playwright specs green with a storage preset; the capture runner
  needs the same, which is the one non-doc change this step makes outside `aa-prototype/`.

**ATLAS.md.** Update "Gotchas" (the PWA sign-in screen and the session preset, the first-run welcome
card and the dismissal preset the runner now applies), "Existing hooks" (`sign-in-screen`,
`sign-in-submit`, `more-sign-out`, `pwa-demo-action-pwa-sign-out`, `info-tip-*`, `first-run-hint-*`),
the `/mobile/more` route note (the account row) and "Overlays that need clicks" (the info tip as a
bottom sheet on mobile and an anchored popover on web and admin).

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**: three independent Opus review subagents, one each for
**quality**, **bugs/correctness** and **plan adherence**, each given US-13.5.3, US-15.0.1, OQ-83,
US-03.1.2, US-03.1.9, US-03.1.8, FT-03.5, US-03.5.1, the context items, this doc, the work item 5
inventory and the diff. This session verifies every finding against the catalogue, this doc and the
code, fixes the confirmed ones (with a test wherever a bug had none), re-greens and records the pass.
Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **Sign-in never blocks a workshop.** The framed build opens signed in after Reset and every scenario
  jump; the PWA keeps its session across reloads and its own Reset; the account is pre-filled from the
  store and the demo account always works; blocked storage falls back to the host default and never
  throws; a deep link survives sign-in; existing specs and capture recipes are unaffected (the
  presets).
- **Sign-in is honest.** Nothing claims a real identity provider, MFA, single sign-on or biometrics;
  the OQ-83 caption lives in one constant and shows only on the sign-in screen; the audit rows are
  audit-only (no domain slice, no `PERSIST_VERSION` change) and deterministic (demo clock); no password
  value is stored or logged.
- **Nothing the catalogue gives the anaesthetist is stripped.** The stack's three parts with the
  Contract's name, holder, who is invoiced and basis with figure (US-03.1.2, US-03.1.9); every
  `PriceCard` state (FT-03.5, US-03.5.1); the prepaid amount (US-03.1.8); the payer; the Split; the
  modifiers and explanations; the procedure and Contract Change. The guard test's "kept" half covers
  each and is not vacuous.
- **Leaks.** Hunt for any anaesthetist path that still shows office-only detail: a sheet the inventory
  missed, an `aria-label` or `title`, a refusal message surfaced in the UI, a List row caption, 38a's
  archive or search rows, web Accounts, the PWA, a SUBMITTED or AUTHORISED Booking, a Booking moved
  from a colleague (32, 32a), an office override's figure through the stack's basis, a preference or
  tier. Check the scan covers each and is not vacuous (the office positive control).
- **Office unchanged.** The office still sees every detail it saw before: the total and rate label, the
  override and its layers, the Contract catalogue's pills and lines, the rule wording.
- **One rule, one source.** No mobile, web or shared capture file decides office-only detail by role
  outside `viewerOf`; no label is retyped instead of imported; the stack and the price are read from
  20a's and 24's selectors, never re-derived; nothing of the pricing model moves out of
  `domain/billing`.
- **Help copy is true.** Each topic matches what the screen actually does after 15a to 39b and states
  only answered rules (D3, D12, D14 to D17, D25, D42 to D44, D46, OQ-78, US-13.7.3) and AR-28's
  plain words; none states as settled a point still open (OQ-49, OQ-60, OQ-79, OQ-83, OQ-88, OQ-89,
  OQ-90, OQ-93's storage, OQ-95, OQ-96, OQ-102, OQ-103, BCTI granularity); no topic says "slot",
  "event", "estimate", "deposit" or a tier name; every string is dash-free and within 60 words.
- **Touch and focus.** Mobile tip hit areas are 44px and overlap nothing; a tip inside a picker sheet
  does not trap it; the desktop popover is not clipped, flips at the edges, closes on Esc and outside
  click, returns focus, and only one is open; the sheet is a bottom sheet; no nested interactive
  elements (a tip inside a clickable row or `th` button).
- **Hints and session are per-viewer, not domain.** Nothing in `AppState` or the persisted payload;
  storage failures are swallowed; Reset and the triggers do what the doc says; the PWA closure is clean.
- **Design.** Teal only for action, crimson only in the logo and avatar, the design's label row, rail
  card, field and sheet anatomy, no new chrome, reduced motion respected.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the simulated sign-in built for OQ-83 (account login on the PWA only, pre-filled,
  framed build signed in, PWA Reset keeps the session) with its provisional caption; scenario jumps
  landing signed in but keeping the welcome-card dismissals (only the Reset buttons bring them back);
  the reading that
  US-15.0.1's Proposed note yields to the Confirmed US-03.1.2, US-03.1.9, FT-03.5 and US-03.1.8 (the
  anaesthetist keeps the stack, the Price section and the prepaid amount; only office-only detail is
  swept), with the office-only list; any other default built for an open question; anything logged
  rather than fixed; and the screens worth a look, each with its route and persona (the PWA sign-in on
  a fresh handset, More, mobile capture with the stack and a tip open, Admin Day and Review with a
  popover).
- **Status row** for catch-up Phase 43a, and a phase entry with:
  - the drift-check result against 60e2d1e (US-15.0.1 and US-13.5.3 changed or not; OQ-83 still open
    or answered; any OQ answered that changed a tip; any change to what the anaesthetist sees);
  - the work item 5 inventory, what was fixed in each place and what was confirmed kept;
  - the name map: `anaesthetistSession.ts` (`useAnaesthetistSession`, `signInSession`,
    `signOutSession`, `clearAnaesthetistSession`, `SIGN_IN_PROVISIONAL`, `SIGN_IN_RULE`, the
    `aa-anaesthetist-session` key); `resetFramedDemo` in `shell/framedReset.ts`; `MobileApp`'s
    `sessionDefault`; `SignInScreen`;
    `recordAnaesthetistSignIn`; `viewerOf`, `rateLabelFor` and `OFFICE_ONLY_LABELS` in
    `src/shared/viewer.ts` (or the earlier helper it extends); `HELP_TOPICS` and `HelpTopicId` in
    `src/shared/help/helpTopics.ts`; `InfoTip`; `CaptureSection`'s `help` prop; `firstRunHints.ts`
    (`dismissHint`, `clearFirstRunHintDismissals`, `anyHintDismissed`, the three storage keys);
    `FirstRunHint`; the `pwa-sign-out` and `show-first-run-hints` triggers;
    `anaesthetistSimplicity.test.tsx`;
  - `PERSIST_VERSION` unchanged (state it);
  - tests added and the before and after Vitest and Playwright counts, and the `demo-ready.json`
    storage preset;
  - the review pass.
- **Catalogue screenshots:** the recipes created or changed (by ID), the `capture/REPORT.md` counts
  before and after (captured, partial, absent, failed), the recipes this phase broke and how they were
  re-pointed, confirmation that 20a's, 21's, 24's and 27's anaesthetist recipes are unchanged, and any
  partial reason handed to a later phase.
- **Decisions log:**
  1. **New:** anaesthetists sign in to the PWA with a simulated account login (US-13.5.3, PWA first):
     the demo account pre-filled, the session kept per device, the framed build signed in by default,
     sign-in, refusal and sign-out audited as `account` rows; the identity service is narrated
     (OQ-83, provisional, one constant).
  2. **New:** what the anaesthetist sees of a Contract and its price is what the Confirmed catalogue
     gives them (US-03.1.2, US-03.1.9, FT-03.5, US-03.5.1, US-03.1.8): 20a's three-part stack, 24's
     Price section, 27's prepaid amount, 21's payer. US-15.0.1's Proposed note yields to them.
     Office only: the calculated fee and total and their rate labels, the override's figures, the
     Contract catalogue's internal pills, versions and lines, the holder's billing settings, internal
     words, the multi-procedure rule wording, and preferences and tiers (17). One viewer rule
     (`viewerOf`) decides it and `anaesthetistSimplicity.test.tsx` enforces both directions
     (US-15.0.1 Notes, note point 51). This supersedes the 3d3a18c plan's reading of "the Contract by
     its plain name only".
  3. **New:** point-of-need help is one `InfoTip` and one topic file, placed beside section labels on
     Booking capture (the stack, the pickers, the modifiers, the Price section, Times, Warnings), Admin
     Day and Admin Review; a bottom sheet on the phone and an anchored popover on desktop. Native
     `title` tooltips stay as hover extras and are not the help mechanism.
  4. **New:** first-run hints are per-viewer browser storage, like the PWA install coaching: not domain
     state, not audited, no `PERSIST_VERSION` change; Reset and "Show first-run hints again" clear them;
     Playwright and the capture runner preset them dismissed (and the PWA signed in) for existing specs
     and recipes.
  5. **Closed:** the Phase 06 reading that "route-setting is office knowledge" with the route chip still
     drawn on the anaesthetist's capture line (superseded by Phase 20's route removal); the Contract on
     the anaesthetist's capture is now 20a's stack.
- **Handoff notes:**
  - For **44**: S1 Beat 3 and S2 Beats 1 and 4 now carry optional tip moments, the pre-demo note covers
    the welcome cards and the handset sign-in, and S5 Beat 1 has an optional account aside; keep them
    in the rewrite and audit both triggers on all three apps and the PWA (PWA parity: "Sign out").
  - For **44**: `visual/storage/demo-ready.json` (signed in on 5174, the three hints dismissed) is the
    test helper its PWA parity spec can reuse instead of signing in through the screen.
  - For any later phase that adds an operational screen section: give it a topic and pass `help`, and
    add any new anaesthetist-reachable sheet to the simplicity scan, in both its directions.
  - When OQ-83 is answered, change `SIGN_IN_RULE` and the sign-in screen, and drop
    `SIGN_IN_PROVISIONAL`. When an OQ that a tip steers around is answered (OQ-89, OQ-90, OQ-93,
    OQ-95, OQ-96, OQ-102, OQ-103) or Greg reopens OQ-78, update its `HELP_TOPICS` entry. When the
    draft technical design (AR-29, AR-30) moves to v5, the stack and the price stay in 20a's and 24's
    modules; this phase's help copy names no field of the design and needs no change unless a rule
    changes.
