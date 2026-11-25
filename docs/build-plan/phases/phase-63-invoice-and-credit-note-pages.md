# Phase 63 · The invoice and credit note pages

**Requirements covered:** none of its own (no unit; D114). It builds the record half of
[US-13.3.3](../../../requirements-board/requirements/stories/US-13.3.3.md) The Finances section ("Records on their own pages" and the **Record page** criterion: an invoice opens on its own page under Invoices, with a way back to the tab; graded Verify, unit and FT-13.3's on 58). It keeps the behaviour of [US-08.4.2](../../../requirements-board/requirements/stories/US-08.4.2.md) (the Delivery card) and [US-08.6.2](../../../requirements-board/requirements/stories/US-08.6.2.md) (credit notes, Correct this invoice) exactly as built.
No seed change, so no `PERSIST_VERSION` bump.
**Answered, built as answered** (owner, 26 November, for the build, not yet seen by AA): D107 (the record pattern; the paper stays custom), D110 (panels moved unchanged), D114 (the record half of US-13.3.3), D115 (the shared kit, no new component).
**Open, built to its default:** [OQ-114](../../../requirements-board/requirements/questions/OQ-114.md) (how each Party's invoices are delivered) and [OQ-122](../../../requirements-board/requirements/questions/OQ-122.md) (posted invoices for payers without email): the Delivery card reads exactly as today, `noAddress` included, with no new delivery route.

**Depends on:** 58 (the record routes, `financePaths.ts`, and the invoice and credit note record files) and 62 (first in Lane B: the Invoices tab that opens these pages, and its use of 59's invoice state). It calls `resendInvoice` from `store/billingRun.ts` through the `store` barrel; 60 (Lane A, parallel) may change that file's run, and this phase neither waits for it nor edits it.
**Estimated:** 1 session.

**Runs in:** Lane B of the build lanes, Wave 5, second after 62 (67 follows): built in the `AnaesthesiaAssociatesRFP-laneB` worktree, committed on `lane/b` with a `63 complete:` commit, joined with the rest of Wave 5 (the last lane to finish runs the full gate once, one review and writes `TEST-58-67.md`). [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-test and plan-page steps.

## Goal

An invoice and a credit note each open on a page under Invoices in the record pattern (mock `#records`, Invoice and Credit note; `#kit`).

- **The invoice page** (`/admin/finances/invoices/:invoiceId`): back link "Invoices"; the number with its payable's ID chip (`AA-2026-H07-P`) and its state `Pill` (Unpaid with its age, Part paid, Paid; 59's invoice state, the read 62 uses); a summary line (payer, patient, date, anaesthetist; the patient's name, never the NHI, D9); the paper unchanged and custom; the rail on shared components, History last.
- **The credit note page** (`/admin/finances/invoices/credit-notes/:creditNoteId`): back link; its number and status (Credited in full); what it credits; the paper unchanged; the rail with its negative invoice and where it was netted, what replaced the original, and History last.
- Every action keeps its store call (Resend, Credit note, Credit in full and rebill, Split, Create additional invoice, See history); no card is dropped.

## Before you start

1. **Drift check** against the plan baseline `f885f67`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-13.3.3,FT-13.3,US-08.4.2,US-08.6.2,OQ-114,OQ-122
   ```

   Re-read anything changed after `f885f67`. **Stop and tell the user** if US-13.3.3's Record page criterion changes (the way back, the record's place under its tab, tabs on a record), if OQ-114 or OQ-122 is answered so that delivery changes (a portal, posting from the app), or if a credit note is given a state or action this page lacks.
2. **Confirm 58 and 62 are DONE** (complete on `lane/b`, or on `master`) and read their PROGRESS entries and the lane's `notes.md`. From 58 note: the invoice record's route element and file (does it still render `InvoicesScreen`'s `selectedInvoiceId` block, or its own thin file around `AdminPage`?), the credit note's file (is `CreditNoteDocument` still in `InvoiceDocument.tsx`?), the `financePaths.ts` helpers every link here uses (invoice, credit note, Invoices tab, Billing with a List, Ledger with a pair), and the trigger context keys of the invoice screen. From 62 note: 59's invoice-state read (name, its Unpaid age and owing), the Invoices tab's list-state convention (URL, router state) the back link returns through, and any link shape into the record. Stop as blocked if either is not DONE.
3. **Test once, at the end (D113):** finish on the quick checks only (`phase-check.mjs --changed`, `npm run lint` in `aa-prototype/`); no full gate, adversarial review, screen-proof or checklist run. Wave 5's join does them and walks the Manual test checklist below. Files outside LANES.md's Lane B line for 63 (`AdminCatalogue.tsx` rows, the Playwright specs) are shared-file or new-file edits it allows; any other goes under "For the merge".
4. **Built as answered, no label:** D107, D110, D114, D115 (one line each in Reference).
5. **Open, built to default** (each a line on the owner's review list, none with an on-screen caption):
   - **Delivery reads as today:** Emailed (with the send history and reminder lines), To post (with the existing OQ-122 `Pill`), No address (`data-delivery="noAddress"`), the credit note's caption, and the credited invoice's disabled Resend. Seeded invoices and credit notes keep `noAddress` after 60's run change (D116); this page reads `delivery.status` and nothing else.
   - **Rail order:** the mock's three first (Delivery, Ledger, Correct this invoice), then the cards that appear only on some invoices (Locked record, Additional invoices, Related invoices), then History last. Today's file draws Ledger and Related after Correct; the mock wins.
   - **A credited or credit-pending invoice** shows its standing `Pill` (`invoice-standing`) in the header in place of the money state, as the paper's masthead badge does; a live invoice shows the state.
   - **Back goes to the Invoices tab,** returning to the filter the office came from when 62's convention carries it (router state), the tab's default otherwise. It is `AdminPage`'s `back` (`BackLink`), never a breadcrumb.
   - **The credit note page keeps its Delivery and Xero cards** (none is dropped) beside the mock's three (negative invoice, replaced by, History).
6. **Reads beyond the run-build-phase standard list:**
   - **Mock:** [finances-section.html](../../explorations/finances-section.html) `#records` (Invoice: header with number, payable chip and state, summary line, paper, the rail Delivery, Ledger, Correct this invoice, History; Credit note: header, paper, the rail's negative invoice, "Replaced by" and History); `#kit` (the rows Right-column cards and their lists, Status words, Invoice and credit note paper stays custom); `#moves` (the rows "Invoice document and its rail" and "Credit note page"); `#decide` for the back link and the record routes. **Ignore** the mock paper's NHI: the paper never prints it (D9).
   - **ROADMAP.md:** D107, D110, D111 (no trigger is registered here), D112, D113, D114, D115, D116 (`noAddress` stays readable); the sequencing rules "62 after 58 and 59 ... 63 after 62" and "No Wave 5 phase edits the shell"; the OQ-114 and OQ-122 rows ("as built"); "Demo triggers".
   - **GAP-ANALYSIS.md:** the EP-13 table's US-13.3.3 row only; no `gaps.json` entry is this phase's.
   - **Catalogue:** US-13.3.3 (Records on their own pages, the Record page criterion); US-08.4.2 and US-08.6.2 only for what the Delivery and Correct cards keep doing; OQ-114 and OQ-122 for the Delivery states.
   - **DECISIONS.md:** "Money prints one way", "Invoices print through the browser" (only `.aa-invoice-doc` prints), "Controls stay buttons ... every other back is `BackLink`". **BACKLOG.md:** closes no line.
   - **PROGRESS.md:** 45 and 53 (the record pattern: `IdChip`, `RailSection`, `RailRow`, the page frame; 47 only if 62 reused its URL-state convention), 58 and 59 (the file contract, `financePaths.ts`, the invoice-state read) and 62 (the tab the pages open from).
7. **Subagents (D112); the session keeps decisions and joins.** Reads, in parallel: (a) the invoice rail with `InvoiceDocumentLock.test.tsx`; (b) `CreditNoteDocument` with `CreditUi.test.tsx`; (c) the mock sections, 58's `notes.md` and the 58, 59 and 62 entries; (d) the props of `Card`, `RailSection`, `DefList`, `TextAction` and `RecordHistoryCard`, and the specs and ATLAS rows naming the rail's hooks. Build, in parallel once the reads are joined: **A** the invoice page (header and every invoice rail card; `DeliveryState` keeps its props) and **B** the credit note page (its file and rail, using `DeliveryState` as it stands), each told its own files. If 58 left both pages in `InvoiceDocument.tsx`, B builds in a new `CreditNotePage.tsx` beside it and `InvoiceDocument.tsx` re-exports `CreditNoteDocument`, so no import path 58's routes use moves. The session then joins frames, tests, catalogue rows and spec updates.

## Reference

- **Code:** `src/apps/admin/screens/InvoiceDocument.tsx` (`InvoiceDocument`, `InvoiceInfoRail`, `DeliveryState`, `LockedRecordCard`, `AdditionalInvoicesCard`, `CorrectInvoiceCard`, `CreditNoteDocument`, `CreditedBanner`, and the private `RailCard` and style objects this phase deletes); `apps/admin/components/` `documentDesk.ts` (the paper-and-rail desk, not edited), `AdminPage.tsx`, `ProfileChrome.tsx` (`IdChip`), `RecordHistoryCard.tsx`; `src/shared/ui` (`Card` with `tone="warning"`, `RailSection`, `RailRow`, `DefList`, `TextAction`, `Pill`, `FormError`); `shared/billing/docParts.tsx` (the paper's parts, not touched); `shared/procedureEventCopy.ts` (`CREDIT_LABELS`); `store/billingRun.ts` (`resendInvoice`, via the barrel); `screens/finances/financePaths.ts` (58's); the catalogue rows in `AdminCatalogue.tsx`.
- **Tests today:** `InvoiceDocumentLock.test.tsx` and `CreditUi.test.tsx` (this phase's); Playwright `visual/admin-phase08`, `admin-phase39`, `lock-phase25`, `phase38b-events` and `phase39b-events` specs.

## Work items

1. **The invoice page's frame** (58's `screens/finances/InvoicePage.tsx`, which the invoice route already renders; keep its export and params, so no route file is edited). `InvoicePage({ invoiceId, actor })` becomes: `AdminPage mode="document"` with `back` to the Invoices tab (through `financePaths`), `title` the invoice number, `aside` the payable `IdChip` and the state or standing `Pill` (`invoice-standing` hook kept), `sub` the summary line; it wraps today's `InvoiceDocument` desk, which keeps its props so the catalogue example and tests mount it unchanged. Keep `data-testid="invoice-detail-workspace"`, `invoice-info-rail` and `invoice-detail-screen`. Build all of this inside `InvoicePage.tsx`; the rail cards stay in `InvoiceDocument.tsx`.
2. **The rail on shared components** (A). Each private card becomes a shared one, hooks kept: **Delivery** (`Card`, `DeliveryState`'s three states and the credited disabled reason, `FormError`, the letter and reminder lines; Resend through `resendInvoice`), **Ledger** (`Card tone="warning"` while a hand-off waits or is flagged; `DefList` of Owing, receivable and payable numbers, the Xero IDs once in Xero; the waiting and flag lines and the two `TextAction`s, whose targets come from `financePaths`), **Correct this invoice** (`CorrectInvoiceCard` exported as today, its three `TextAction`s and credit sheet unchanged), **Locked record**, **Additional invoices** (`RailRow`s and Create additional invoice) and **Related invoices** (`RailSection`), then `RecordHistoryCard` (`entityIds`: the invoice, its pair, and its credit note and negative invoice where they exist; check the entity ids `resendInvoice` and `submitCredit` stamp in the audit). Delete `RailCard`, `railCardStyle`, `railMetaLabel` and the compact styles once nothing uses them. Count the cards today (the brief says seven; the file renders six on an invoice) and log any difference; none is dropped.
3. **The credit note page** (B). In 58's `screens/finances/CreditNotePage.tsx` (same export, already routed), `CreditNotePage({ creditNoteId })` on `AdminPage document`: back to Invoices, the number with `Pill` "Credited in full" (`CREDIT_LABELS.credited`), `sub` "Credits AA-... · payer · patient · anaesthetist" (the original links to its page); the paper unchanged (`credit-note-document`). Rail, hooks kept: the negative invoice (`negative-invoice-card`, with where it nets or netted, read as `LedgerScreen`'s credit trails read it, no new read), **Replaced by** (`credit-note-new-invoices`, `RailSection` of the new invoices, each opening its page), Delivery, Xero (`Card tone="warning"` on a failure; its link to the List on Billing through `financePaths`), then `RecordHistoryCard` on the credit note and its negative invoice.
4. **Links and paths.** Every link in the two files goes through `financePaths.ts` (invoice, credit note, Invoices tab, Billing List, Ledger pair); the old literals (`/admin/invoices/`, `/admin/credit-notes/`, `/admin/billing?list=`, `/admin/ledger?pair=`) are gone. A helper 58 did not give goes in `notes.md` and under "For the merge".
5. **Catalogue rows.** Edit only the `InvoiceDocument`, `CorrectInvoiceCard` and `CreditNoteDocument` rows' `what` text (header on the record pattern, the rail on shared Cards, History last) in `AdminCatalogue.tsx`; names, exports and props stay so `AdminCatalogue.test.tsx` and the examples compile. No new shared component or variant (D115).
6. **Tests.** Extend `InvoiceDocumentLock.test.tsx` and `CreditUi.test.tsx`; add an invoice-page test (new file beside them): the header shows the number, the payable chip and the state (Unpaid with its age on a seeded unpaid invoice, Paid on a paid one) and no NHI; the rail's headings run Delivery, Ledger, Correct this invoice and end at History; Resend calls `resendInvoice` and a refusal shows in place; a `noAddress` delivery reads "No address" (set on a store invoice); a credited invoice shows its standing and a disabled Resend with the reason; the credit note page shows the number, status, negative invoice, "Replaced by" links and History, and its original link opens the invoice page; the back link goes to the Invoices tab. Update the five Playwright specs above wherever they read the rail's structure or the old URLs (hooks survive; do not run them).
7. **Build on the shared components.** `AdminPage`, `Card`, `RailSection`, `RailRow`, `DefList`, `DefRow`, `TextAction`, `Pill`, `IdChip`, `Notice`, `RecordHistoryCard`, `Button`. No private `Card`, `Row`, `Pill` or `Section` in the file; the allow-list in `oneComponentPerJob.test.ts` only shrinks.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| (existing, as 58 placed them) | Regenerate from locked data, Payment received · full, Payment received · half, Replay last payment event, Stage refund after payout | Admin · an invoice's page | bar | unchanged; this phase edits no registry file | as today |
| (product) | Resend, Credit note, Credit in full and rebill, See history | Admin · an invoice's or credit note's page | none | normal use; each keeps its store call | as today |
| PWA | none (Admin only) | | | | |

No new trigger. If no seeded invoice or credit note still reads `noAddress` after 60's run change, the card's state is covered by the test in item 6 and noted on the owner's review list; staging an invoice without an address is 60's trigger, not this page's.

## Out of scope

- The Invoices tab and approval strip (62); the billing run and the no-address failure (60); the Xero tab (61); the payment run, remittance and account pages (65, 66).
- The paper itself (`DocMasthead`, `DocLinesTable`, `docParts`, print stylesheet), a new delivery route (OQ-114, OQ-122), the credit rules, a new shared component or variant, and the shell, path, count and registry files (58 and the join).
- Capture recipes, ATLAS and the demo guide (the owner's sweep).

## Manual test checklist

Material Wave 5's join walks for the owner's test sheet `TEST-58-67.md`; this phase does not run it (D113).

- [ ] Invoices, open an unpaid invoice (Sarah Mitchell, Dr Souter's): back link "Invoices", the number with its payable chip and "Unpaid" with its age, the summary line, the paper unchanged at print width; Back returns to the Invoices tab.
- [ ] The rail runs Delivery, Ledger, Correct this invoice, then any Locked record, Additional invoices and Related invoices, and History last ("N changes recorded", See history opens the sheet).
- [ ] Resend works and shows its refusal in place; a credited invoice shows Credited in the header and a disabled Resend with its sentence; a To post invoice keeps its provisional pill.
- [ ] Credit note, Credit in full and rebill and Split open the credit sheet as before; issue a credit on AA-2026-H03, then open its credit note page.
- [ ] The credit note page: number, "Credited in full", what it credits (link back to the invoice), the negative invoice and where it nets, "Replaced by" opening each new invoice, Delivery, Xero, History last.
- [ ] A payer with no address still reads No address on a seeded invoice or credit note (D116), or the owner's review list says none remains.
- [ ] Print the invoice: only the paper prints; the credit note, remittance and Xero simulator documents look as before.
- [ ] US-13.3.3's Record page criterion: open an invoice from the Invoices tab, it shows on its own page under Invoices with a way back.

## Demo guide updates

None by this phase: the owner's `/sweep` re-points the guide, the recipes and ATLAS. Keep `demoGuideSync.test.ts` green. **For the sweep** (list them in the progress entry): the recipes whose targets sit in the invoice or credit note rail (`US-08.4.2`, `US-08.6.2`, `US-08.6.6`, `US-08.3.1`, `US-13.5.2`, `US-11.3.3`); ATLAS's `/admin/invoices/:invoiceId` rows (the Ledger card's hooks and its links to Billing and the ledger, the rail's cards, `invoice-detail-screen`) and the credit note rows, now under Finances; the guide's invoice and credit note beats where they name the rail's cards or the old URLs.

## Review steer for Wave 5's join

- **The paper is untouched** and the rail never prints; no NHI on the page.
- **Every card kept, every action on its store call** (`resendInvoice` from the barrel, 60's file unedited), every `data-shot` surviving.
- **No private copy:** `RailCard` and its styles gone; no new shared component or variant.
- **Lane boundary and links:** only this phase's files changed; every link through `financePaths.ts`; Back reaches the Invoices tab; History last on both pages.

## PROGRESS.md updates

- **For the owner's review:** the built defaults of Before you start 5 (Delivery as today, the rail's order, the standing in the header, Back and its filter, the credit note's extra Delivery and Xero cards), the card count found against the brief's seven, and whether a seeded `noAddress` invoice remains.
- **For the merge** (also in `notes.md`): fallback only, if 58 did not ship `InvoicePage.tsx` and `CreditNotePage.tsx` as route targets: the one-line route-element swap; any `financePaths` helper missing; Playwright specs changed but not run.
- Status row and phase entry: drift check against `f885f67`; D107, D110, D114, D115 as built; the names 58 and 62 shipped that this phase used; `InvoicePage` and `CreditNotePage` as shipped; tests added; `PERSIST_VERSION` unchanged; the sweep list above.
- Decisions log (and one line in `docs/DECISIONS.md`): the paper stays custom, the rail is shared Cards, History last.
