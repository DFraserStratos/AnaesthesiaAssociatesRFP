# Contract picker mock

A throwaway workshop mock: one AA Admin booking screen, and six ways of choosing the Contract (two billable party first, four price first) for the
booking's procedure, switchable from the strip at the top. It exists to put the choice in front of
stakeholders with AA's real fee data. It is not part of `aa-prototype/` and shares no code, store or
conventions with it (no `PERSIST_VERSION`, no demo clock); it copies the prototype's design tokens, fonts,
wordmark and side nav so it looks like the same product.

```bash
npm install
npm run dev        # http://localhost:5181  (or `npm run dev:picker` from the repo root)
npm run build      # typecheck + production build
npm run extract    # re-read the fee files into src/data/generated/
```

**To send it to the client**, `npm run package` builds the mock and packs it into one self-contained file,
`release/AA-Contract-Picker.html` (about 570 KB, git-ignored): the code, styles and fonts are inlined, so it
opens by double-click in any modern browser, offline, with nothing beside it (`scripts/package-single.mjs`).
Re-run it after every change; the file is a snapshot.

**On a laptop** (window under 1600px) the mock packs itself: the Admin nav becomes a 64px icon rail (its toggle
opens the full menu), the phone bay narrows and scales the 390pt phone to fit, the harness drops its pill (and,
under 1360px, the row and step counter), and when the booking page has less than about 990px it moves the total
and status into a strip on top and puts the Patient, List and Attachments cards two-up under the capture cards
(`src/chrome/useViewport.ts`).

## Billable party first options

From Ben's decision tree and email (30 October): the first question is **where the invoice goes**.
- **Patient:** is it prepaid? Yes, the anaesthetist's own prepay price. No, No contract (RVG): the anaesthetist fills in the RVG or another amount.
- **The List's hospital:** under which of its contracts, SXAP, HNZ or ACC. Only the types that hospital holds are offered (Southern Endo has no ACC).
- **Special contract:** the hospital's other Contracts (Bariatric, Cochlear and the like), Contracts linked to the List's surgeon (Unisports, a surgeon's set fees), and insurers billed directly (NIB, NZDF, Veterans Affairs).

The office's job ends at the Contract. A Contract priced from the RVG sends the card to the anaesthetist ("Card sent to Dr Cole to fill in the RVG"); the office can still enter the code now. A Contract with agreed fees (Christchurch Eye Surgery, a surgeon's set fees) asks only for the procedure, and its fee is pre-filled. Fixed fee, RVG or prepay is no longer a question: it follows from the Contract.

**Every list is the List's.** A List is one anaesthetist, surgeon, hospital, day and session. Contracts are offered only if they are the List's hospital's, or linked to its surgeon or anaesthetist (by practitioner ID), and in force on its day (`validFrom`, `validTo`; Unisports runs 1 October 2026 to 30 June 2027). Another hospital's Contracts never show, and the hospital cannot be changed. The session narrows nothing: nothing in the requirements says it should. Insurers carry no link, so they show on every List (whether the patient's insurer should narrow the list is OQ-93). The List filter is always on, for the price first options too (the harness's Context filter toggle was removed).

The booking's funder suggests a path (tagged "Suggested") but never answers it, and a step with one possible answer fills itself in ("only option").

- **A. Step rail** (the default). One question at a time, with every step given a slot from the start:
  Invoice to, then Prepaid? or Contract, then Price, as a compact numbered rail down the left, with the
  rest of the card for the current question. Click an answered slot to change it. The code is in
  `src/billing/StepVariants.tsx`. (The earlier Guided steps, Step strip and Rows of buttons were dropped.)
- **B. Billing tree.** Ben's tree as columns (invoice to, the second question, Contract and price);
  picking a node narrows everything to its right.

**Hand-off to the anaesthetist, under every option.** The anaesthetist's phone is docked beside the page
for all six options, sharing the same booking. The office can stop at any step; the phone shows what is to do and can change anything, and each
change is flagged on the office's page ("Changed by the anaesthetist: …", **Mark reviewed**).

The code is in `src/billing/` (`paths.ts` is the pure path logic). Where each Contract sits in the tree
is an illustrative reading in `src/data/contracts.ts` (`branch`, `arrangement`, `holderBilled`), for AA
to correct. Holders are of four kinds (hospital, surgeon, anaesthetist, insurer) plus AA for the default;
surgeons' groups such as Unisports and BOSS are surgeon holders linked to their surgeons. Southern Endo's
single Contract in AA's list is split into SXAP and HNZ to match Ben's tree.

**Not modelled yet, questions for Ben:** MacMurray's core and non-core procedures (is MacMurray a
hospital or a surgeon, and is "core" a fixed list?); TMJ ("RVG or agreed rate"); whether each special
contract is tied to particular surgeons; and Bariatric's agreed fees (no fee file, so it prices from the
RVG here).

Bookings added for these options: a self-funding **facelift** (the anaesthetist's prepay price, or the
surgeon's set fees as a special contract), a **Forte knee arthroscopy** under SXAP (one RVG Contract, so
the card goes straight to the anaesthetist), an **NIB** cholecystectomy, and a **Southern Endo
colonoscopy** (no ACC there).

## Price first options

The earlier work, kept as it was.

### The four approaches

The approaches are labelled by what they do, not by who proposed them.

1. **Procedure first.** Find the procedure in the curated list (409 rows, by body section), then pick from
   the Contracts for it, grouped by organisation: under each, its lines linked to the procedure and its
   RVG-priced Contracts. No contract (RVG) is always first, then the booking's hospital.
2. **Contract, then lines.** Contracts that fit the List (No contract (RVG) first, then the hospital's,
   then the surgeon's and anaesthetist's, then insurers). Pick one, then pick its line. An
   RVG-priced Contract has no lines (marked "No lines") and is picked directly; most hospitals' Contracts
   outside Christchurch Eye Surgery are like this, as the fee files hold no lines for them.
3. **Organisation first.** Pick the organisation (the contract holder: a hospital, insurer, surgeon
   or anaesthetist), then one of its Contracts, where every priced row is a Contract of its own.
   No contract (RVG) is pinned at the top and picked directly.
4. **Single contracts.** No second level: every priced row is a Contract of its own, in one list under
   holder headings.

**Keyboard.** Focus a field and start typing: its list opens with that key as the search. Arrow keys
move through the rows (the first match is lit as you type, never the pinned No contract (RVG) row), Enter
picks, Escape closes and returns focus to the field. A filled field shows a ✕ to clear it (Backspace or Delete on the focused field does the same); clearing the procedure under approach 1 clears its Contract too. The RVG code type-ahead works the same way; its
codes sit under the RVG's body-part headings in the guide's order, the groups whose codes start with what
you typed first.

All four share the same data, the same search (every word must appear) and the same context filter, so
the comparison is like for like. Approaches 2 and 3 also take an optional RVG code first, which narrows
to the lines that answer to it (reverse lookup).

The page is laid out like aa-prototype's Admin booking detail (times and B·T·M units cards, the office
billing setup card, the booking total, patient and list cards). The top of the capture column is two
cards, side by side:

- **Procedure** (left). The procedure as received, one source at a time: a Rooms | Hospital switch in the
  card header flips between each system's wording (latest first). The wording never sets the card's
  height: it fills the space the row gives it, stepping its type down to fit, and past that fades with
  **Show all**. The two cards always stretch to the same height. Approach 1 moves the wording into its
  own full-width card on top (full size, up to three lines, then **Show all**), so the left card holds
  only the field to pick the procedure from the 409-row list (`Master Fee List.xlsx`).
- **Contract** (right). Approach 1: one field, locked until a procedure is picked, listing only the
  Contracts with a line for it. Approach 2: one field whose list has two layers: pick a Contract and the list moves into its lines
  (**Contracts** or Backspace on an empty search steps back); a Contract priced from the RVG has no lines and
  is picked at the first layer. Reopening starts on the current Contract's lines.
  Approach 3: one field whose list starts with the organisations, then that organisation's Contracts. Approach 4: one field over every priced row. In all four an **RVG code** field appears only when the
  chosen Contract prices from the RVG; a fixed-price line says no code is needed.

The workshop controls sit in the dark harness bar, as the prototype's demo controls do: the booking (its tooltip carries a presenter note), two dropdowns for the option (**Billable party first** and **Price first**; the one holding the current option is lit), and
a live count of the rows in the open list and the clicks taken (opening a list and picking a row each count). The funder is shown on the booking but
never narrows the list.

Holder kinds carry a quiet colour (`src/theme/kinds.ts`, from the design language's status hues): a tinted
group header with a coloured edge, and a dot on rows and filled fields. Default is neutral, hospitals
blue, insurers rose, surgeons amber, anaesthetists green; teal stays the action colour.

Rules the mock follows: a fixed-price line disables the RVG code (it may still name an RVG group for the
lookup); an RVG-priced Contract leaves the RVG code to the anaesthetist, optional for the office; No
contract (RVG) is always the top row.

## The data

`scripts/extract-fees.py` (Python standard library only) reads `docs/discovery-reference/Contract Files/`
and writes `src/data/generated/`:

| Output | Source |
|---|---|
| `procedures.json` (409) | `Master Fee List.xlsx` › Procedures |
| `rvgCodes.json` (106 base-unit groups) | `Master Fee List OLD.xlsx` › RVG Codes |
| `lines.json` (349) | The four SXAP schedules and the CESL guide (via the OLD master's faithful SRC tabs), the CESL workbook's SX lids, SX skin lesions, SX cataract and vitrectomy (its 5-minute vitrectomy brackets merged into 9 bands, one per anaesthetist fee) and ACC tabs, CES HNZ commitment and panel fees, the Merivale set fees, the gynaecology cost estimates, and the plastic surgeon's approximate fee card (transcribed in the script) |

Each line is the **anaesthetist's** fee, held **ex GST**: a GST-inclusive figure is divided by 1.15, or the
source's own ex-GST figure is used where it prints one (the CESL guide, the ACC table); `printed` keeps the
figure as the source shows it. The plastic surgeon's fee card does not say, so its figures stand as
printed. The screens show no GST tags: every price is ex GST.

Hand-made, and illustrative only:

- The Southern Cross Affiliated Provider fee schedules are one Contract each, as they are separate
  documents: SXAP MIGS, Ectropion and Entropion, Pterygium and Pinguecula, Ptosis and Blephs (the four PDFs)
  and Skin Lesions (the CESL workbook's SX skin lesions tab), all held by Southern Cross Health Society and tied to Christchurch Eye Surgery as the affiliated provider, so they list with its Contracts. AA's
  list also names "SX Affiliated Provider"; it is kept, priced from the RVG, with no lines.
- `src/data/contracts.ts`: AA's 42 Contracts (`Group 2/Contracts AA.xlsx`) plus No contract (RVG) and three
  surgeon arrangements. Which hospital or surgeon each applies to is a reading of the name, not AA's
  records. Ten Contracts carry lines from the files; the rest have no line data, so they price from the
  RVG.
- `src/data/mappings.ts`: keyword families linking procedure names and line descriptions to each other
  and to RVG groups. The fee files carry no RVG codes and the procedure list no prices, so nothing else
  links them. About 60 of the 349 lines match no family (GA add-on fees among them), so approach 1 never
  shows them: that is the real cost of keeping such a mapping.
- `src/data/prepayLists.ts`: each booking anaesthetist's own **prepay price list** (earlier versions of the
  requirements called these first-party Contracts): a Contract held by the anaesthetist, flagged as
  prepaid, one fixed price ex GST per procedure. No fee file carries one, so the lists are illustrative.
  They are offered on that anaesthetist's bookings, after the hospital's and the surgeon's Contracts;
  picking one shows the prepaid amount and "Prepayment required" on the booking.
- `src/data/scenarios.ts`: six bookings. Two open already set up, as the office would have left them (marked "pre-filled" in the booking menu): the ACL with the list procedure, Unisports Ortho Ltd and RVG LL3; the hysterectomy with the list procedure and the gynaecologist's "Total laparoscopic hysterectomy +/- adnexae with gelpoint morcellation" estimate. Switching approach or booking restores them; the ✕ clears them. Every person in the mock is fictional, including the surgeons
  behind the fee cards; business names are real.

Skipped on purpose: the CESL MIGS tab (its anaesthetist column does not match the printed SXAP schedule),
the archived 2025 tab, the scanned Operation Listing and the CESL "all fixed fees" summary blocks.
