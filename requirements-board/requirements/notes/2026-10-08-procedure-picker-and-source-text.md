# Procedure picker and source text, 2026-10-08

- **Who:** Donald Fraser (Stratos), working in a Claude Code session.
- **Covered:** the procedure list (formerly the master procedure list) and its viability, a second
  route into the procedure picker through the RVG codes, how a Booking shows the wording that came
  from the rooms or hospital, and keeping that wording as received.
- **Inputs gathered here:** Donald's typed statement on 2026-10-08, recalling a meeting that was not
  recorded and has no transcript, and his answers in the same session to four questions Claude put to
  him (picker layout, what an RVG code pick resolves to, what the Contract part of a booking screen
  shows, and what to do with example source wording). Points #3, #4, #5 and #8 are options Claude
  proposed and Donald chose; the illustrative source wording at the end is AI-made, not from AA.

Cite a point as `"Notes 2026-10-08 · Procedure picker and source text #n"`. Points are numbered once
across the whole note. Donald's wording is kept (filler dropped).

## Donald's notes

1. **The procedure list is still worth proving.** "There's been lots of conversations floating
   around over the past week related to our current concept of having a master procedure list that
   helps bridge the gap between a potentially infinite number of named procedures and selecting
   contracts, which are our concept of fixed prices or fixed rate or fixed discount or standard RVG
   pricing on any given procedure. I still see a lot of value in this, but there are some questions
   and concerns about the viability, and this is something I want to prove out once the prototype is
   built so people can see it."
2. **A second route: browse the RVG codes by body area.** From a meeting that was not recorded: "when
   it comes to picking a procedure, let's say for an administrator, but this will be true for an
   anaesthetist as well... what you would normally think of is selecting a body area and then picking
   a procedure. We also need the ability to select a body area and then look at all of the available
   RVG codes as reference. And maybe this is picking an area then showing another list or maybe it's
   simply showing the RVG list with headings that group the RVG code by body area, much like the RVG
   guide already does. And so this means that users can search for appropriate contracts via either of
   the two methods." This is the route Donald raised with Greg on 7 October ("pick just via RVG",
   Notes 2026-10-07 · AA meeting with Greg #16), which no story yet said.
3. **Picker layout: two tabs.** Chosen in the session: one picker with two tabs, **Procedures** and
   **RVG codes**. Each tab is a single scrolling list under body-area headings, as the printed guide
   groups its codes, with jump-to-section and one search across name, RVG code and system code.
4. **What an RVG code pick leads to.** Chosen in the session: after picking an RVG code (for example
   H3) rather than a procedure, the Contract list offers No contract (RVG) first, then every Contract
   line for any procedure in that RVG group, grouped by holder, under the usual holder, date and
   context filters. Picking a Contract line also sets the procedure. Picking No contract (RVG) sets
   the group's general procedure.
5. **Every RVG code has a general procedure.** Following from #4, chosen in the session: a general
   procedure for each RVG group is a rule, not only the data clean-up Vanessa and Ben began on
   7 October ("a row for any RVG code with no procedure").
6. **The source wording is not plain English.** "The descriptions that come in from surgeons' rooms
   or the hospitals don't describe plain English standard names for procedures; they'll often have
   these little codes and snippets of text that are short, and for someone who knows what they're
   doing they can read that and understand what the procedure actually is, but there's potentially an
   infinite variety of what these could be."
7. **Every booking screen shows three things, stacked.** "All of the booking screens, for the admins
   or for anaesthetists, need to show the exact text that the original bookings from other systems
   have, and then below that would be our selected procedure / selected RVG code, and then below that
   would be the contract that's been selected, to understand who's paying for it and what they're
   paying." Chosen in the session: the Contract part shows the Contract's name and holder, who is
   invoiced, and the pricing basis with its figure (for example Fixed $2,400, a rate, 10% off RVG, or
   RVG).
8. **Keep the source wording as received.** Proposed by Claude as defaults and accepted by Donald:
   the wording is kept verbatim from every intake channel (hospital download or feed, HL7 or FHIR,
   surgeon's PDF, email) and never overwritten; each later update is added beside it with its source
   system and time; manual and ad hoc entry get an optional "as given" field; the hospital matching
   screen shows the wording on each row.
9. **Examples for the prototype.** "I need the prototype to have some examples, and again these will
   probably need to be generated or made up by AI." Chosen in the session: requirements only today;
   an illustrative, AI-made set goes in the catalogue (below), clearly marked as not from AA, for the
   build plan to seed the prototype from later.

## Illustrative source wording

**AI-made, not from AA.** Realistic shorthand of the kind Donald describes in #6, written by an agent
for the prototype's demo data (#9). Only "WLE MM", "RTK", "blephs", "wide local excision", "right
total knee" and the long skin-cancer line (row 27) come from AA (Notes 2026-10-07 · AA client meeting #26, #27, #29);
everything else is invented. RVG codes, descriptions, sections and base units are as printed in the
NZSA RVG 2021 ([AR-16](../artifacts/AR-16.md)), read by text extraction: spot-check the two-column
rows against the PDF before relying on them. The procedure wording is a suggestion, not AA's list.

How the guide is laid out, for the RVG codes tab: section (an anatomical site, such as Head or
LOWER LIMB) > an optional sub-heading (such as Dental, Ocular, Neurosurgery under Head) > code (H3,
UL2, LL4), most codes a complexity tier (Minor, Simple but Invasive, Moderate, Major, Complex,
Significant) with
"e.g." example procedures and its base units (a number, a range such as 10-12, or "4 + Time"). The
guide has no procedure names of its own, so matching wording to a code is a judgement against those
examples.

| Row | As received | Source | Meaning | Procedure (invoice wording) | Section | RVG code | Base units | Guide p. |
|---|---|---|---|---|---|---|---|---|
| 1 | `RTK` | Rooms PDF | Right total knee replacement | Total knee replacement, right | LOWER LIMB | LL4 | 8 | 11 |
| 2 | `right total knee` | Hospital download | Same Booking as row 1, the hospital's wording | Total knee replacement, right | LOWER LIMB | LL4 | 8 | 11 |
| 3 | `L TKJR` | Rooms PDF | Left total knee joint replacement | Total knee replacement, left | LOWER LIMB | LL4 | 8 | 11 |
| 4 | `bilat TKJR` | Email | Both knees replaced under one anaesthetic | Bilateral total knee replacement | LOWER LIMB | LL5 | 10 | 11 |
| 5 | `Rev THJR R, 2 component` | Rooms PDF | Right hip revision, both components | Revision hip replacement, right | LOWER LIMB | LL6 | 12 | 11 |
| 6 | `L knee scope + partial menisectomy` | Rooms PDF | Left knee arthroscopy and partial meniscectomy (misspelt) | Knee arthroscopy, left | LOWER LIMB | LL1 | 4 | 10 |
| 7 | `ACL recon R` | Hospital download | Right anterior cruciate ligament reconstruction | ACL reconstruction, right | LOWER LIMB | LL3 | 6 | 11 |
| 8 | `ORIF # R dist radius` | Email | Open reduction and internal fixation, right distal radius fracture | Open reduction internal fixation, right distal radius | UPPER LIMB | UL2 | 5 | 8 |
| 9 | `carpal tunnel decomp L` | Rooms PDF | Left carpal tunnel release | Carpal tunnel release, left | UPPER LIMB | UL1 | 4 | 8 |
| 10 | `L RC repair + ASD` | Rooms PDF | Left rotator cuff repair (primary) and subacromial decompression | Rotator cuff repair, left | UPPER LIMB | UL3 | 6 | 8 |
| 11 | `lap chole +/- IOC` | Rooms PDF | Laparoscopic cholecystectomy, perhaps with an operative cholangiogram | Laparoscopic cholecystectomy | ABDOMEN | A3 | 6 | 9 |
| 12 | `lap chole` | Hospital download | Same procedure, hospital shorthand | Laparoscopic cholecystectomy | ABDOMEN | A3 | 6 | 9 |
| 13 | `R inguinal hernia mesh` | Rooms PDF | Right inguinal hernia repair with mesh | Inguinal hernia repair, right | ABDOMEN | A2 | 5 | 9 |
| 14 | `lap appy ?conv to open` | Email | Laparoscopic appendicectomy, may convert to open | Appendicectomy | ABDOMEN | A3 | 6 | 9 |
| 15 | `gastro/colon` | Rooms PDF | Gastroscopy and colonoscopy; sedation or GA not said | Gastroscopy and colonoscopy | ANAESTHESIA IN REMOTE LOCATIONS (Endoscopy) | E1 (sedation) or E2 (GA) | 4 or 5 | 11 |
| 16 | `phaco + IOL R` | Hospital download | Right cataract surgery with lens implant | Cataract surgery with lens implant, right | Head (Ocular) | H6a | 4 | 7 |
| 17 | `blephs` | Rooms PDF | Blepharoplasty (eyelid surgery) | Blepharoplasty | Head | no example names it; AA to judge (H6a, H1 or H3) | | 7 |
| 18 | `FESS + septo` | Rooms PDF | Endoscopic sinus surgery (primary) and septoplasty | Endoscopic sinus surgery with septoplasty | Head | H3 | 6 | 7 |
| 19 | `grommets bilat` | Rooms PDF | Bilateral myringotomy and ventilation tubes | Myringotomy with grommets, bilateral | Head | H1 | 4 | 7 |
| 20 | `T&A` | Hospital download | Tonsillectomy and adenoidectomy | Tonsillectomy and adenoidectomy | Head | H2 | 5 | 7 |
| 21 | `hystero D&C` | Rooms PDF | Hysteroscopy with dilatation and curettage ("hystero" could also mean hysterectomy) | Hysteroscopy and D+C | PERINEUM | P1 | 4 | 10 |
| 22 | `hystroscopy + D+C` | Email | Same as row 21, misspelt | Hysteroscopy and D+C | PERINEUM | P1 | 4 | 10 |
| 23 | `TAH BSO` | Rooms PDF | Total abdominal hysterectomy, bilateral salpingo-oophorectomy | Abdominal hysterectomy with bilateral salpingo-oophorectomy | ABDOMEN | A4 | 6-8 | 9 |
| 24 | `TURBT` | Rooms PDF | Transurethral resection of bladder tumour | Transurethral resection of bladder tumour | PERINEUM | P2 | 5 | 10 |
| 25 | `TURP` | Hospital download | Transurethral resection of the prostate | Transurethral resection of prostate | PERINEUM (Urology) | P4 | 6 | 10 |
| 26 | `WLE MM` | Rooms PDF | Wide local excision of a melanoma; the site is not given, and the code depends on it | Wide local excision, melanoma | Head, Neck, THORAX, UPPER LIMB, LOWER LIMB or ABDOMEN | H1, N1, T1, UL1, LL1 or A1 | 4 | 7 to 10 |
| 27 | `WLE MM, left shoulder + flap repair + SNB + excision SCC and flap, left sternum + BCC` | Hospital download | Melanoma excision left shoulder (primary), flap, sentinel node biopsy, SCC excision and flap on the sternum, BCC excision, one anaesthetic | Wide local excision melanoma, left shoulder, with flap repair, SNB, and SCC and BCC excisions | THORAX | T1 (one base unit for the anaesthetic; an expert may judge a higher tier) | 4 | 8 |
| 28 | `L breast WLE + SLNB` | Rooms PDF | Left breast wide local excision (primary), sentinel node biopsy | Wide local excision breast lump, left | THORAX (Breast) | T2 (the guide prints two T2s; this is the 5-unit one) | 5 | 8 |
| 29 | `R mastectomy + ALND` | Email | Right mastectomy with axillary node dissection | Mastectomy with axillary node dissection, right | THORAX (Breast) | T3 | 6 | 8 |
| 30 | `XLA x4 wisdoms` | Rooms PDF | Extraction of four wisdom teeth | Dental extraction, four wisdom teeth | Head (Dental) | H5 | 5 | 7 |
| 31 | `BSSO + genio` | Rooms PDF | Bilateral sagittal split osteotomy (primary) and genioplasty | Mandibular osteotomy with genioplasty | Head | H4 | 10-12 | 7 |
| 32 | `L4/5 microdisc` | Hospital download | Lumbar microdiscectomy at L4/5 | Lumbar microdiscectomy | SPINE (Lumbar) | S6 | 8 | 9 |
| 33 | `ACDF C5/6` | Rooms PDF | Anterior cervical discectomy and fusion at C5/6 | Anterior cervical discectomy and fusion | SPINE (Cervical) | S2 | 8 | 9 |
| 34 | `L3-5 decomp + fusion` | Email | Lumbar decompression and fusion over two levels; the approach is not stated | Lumbar decompression and fusion | SPINE (Lumbar) | S9b (or S8b if anterior) | 12 (or 10) | 9 |
| 35 | `EUA +/- cysto +/- biopsy` | Rooms PDF | Examination under anaesthesia, perhaps cystoscopy and biopsy; site unclear | Examination under anaesthesia with possible cystoscopy | PERINEUM | P1 if cystoscopy goes ahead | 4 | 10 |

Rows that need an expert, and so show why the source wording must stay on screen: 14, 15, 17, 21,
26, 27, 34 and 35. No example in the guide names row 17, so AA judges its group: the case
the procedure list is for. Abbreviations the agent was less than sure of: ASD
(arthroscopic subacromial decompression), genio (genioplasty), XLA (dental extraction), SNB/SLNB
(sentinel node biopsy), MM (malignant melanoma), "hystero".
