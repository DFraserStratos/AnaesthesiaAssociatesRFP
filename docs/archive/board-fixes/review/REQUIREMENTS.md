# Requirements-fidelity review of the board-fixes Buildbook

## Recheck (2026-11-18)

Re-read PLAN.md, PROGRESS.md (accepted decisions 7 to 12, conventions 13 and 14) and all 15 specs
after the corrections. The coverage script was re-run unchanged.

**Coverage result:** all 164 findings have an owner in PLAN and appear in the owner spec's
"Detailed requirements" and "Acceptance and evidence" sections, each with a requirement and a proof.
R-07 is still the only ID PLAN lists twice, by design. No ID is missing and none is orphaned. Each
split delivery is now covered on both sides:

| Split | Side A | Side B (closer in bold) |
|---|---|---|
| R-01 | B02-REQ-01, -02 (board and server) | **B06-REQ-12** (lock-out UI; R-01 proof row) |
| R-07 | B02-REQ-05 (board half) | **B12-REQ-14** (plan tools; proof row 14) |
| R-45 | B05-REQ-06 (config base and 409) | **B06-REQ-11** |
| R-111 | B05-REQ-05 (no-op write) | **B06-REQ-03** |
| R-54 | B08-REQ-11 (deletion bound; proof "R-54 support") | **B05-REQ-20** (see FID-18) |
| R-56 | **B05-REQ-13** (route, plus store `renameLane` and `deleteLane`; store proof in R-56 row) | B07 and B11 consume only |
| R-68 | **B02-REQ-03** (rule, plus Settings call site; proof covers the Settings Add row) | B06 renders |
| R-119 | B05-REQ-13 (lane route) | **B11-REQ-07** (merge form, under touch rights) |

PLAN deliverables without an R-id are now in specs: D-10 (B07-REQ-08 with a decision entry and
proof), the HistoryView screenshot label (B10-REQ-11), tool tests in `verify:board` (B12-REQ-16),
A-2 (B02-REQ-07), A-4 and A-10 (B12-REQ-15), the REPO_ROOT case of R-47 (B01-REQ-07, PR-07). B15
confirms rather than adjudicates (B15 SPEC:5-7, :20), and checks D-01 to D-10 (B15-REQ-09).

**Counts:** of the original 17 findings, 17 are Resolved, 0 Partly resolved, 0 Not resolved. The
corrections introduced **2 new findings**: FID-18 (should-fix, B05 with B08) and FID-19 (minor,
B12). Nothing is blocking. Both new findings were resolved in the final recheck below.

### Final recheck (2026-11-18): FID-18 and FID-19

| FID | Severity | Disposition | Evidence |
|---|---|---|---|
| FID-18 | Should-fix | Resolved | B05-REQ-20 covers a reissue made before the deletion is committed, conditional on D-05 "reuse allowed" and not applicable under "never reused" (B05 SPEC:352-360). The B05 R-54 proof row adds commit, board delete, re-create with the same ID, commit, and fails first (:433). B08-REQ-11.4 and the B05 contract say no bound is produced in that case and that B05-REQ-20 owns the cut (B08 SPEC:305-311, :340). |
| FID-19 | Minor | Resolved | B12 proof row 15: "The fixture decides each verdict". The fixture runs at B12's start; fail-first applies only if the defect reproduces, otherwise the disposition is "Not reproducible at HEAD" with the fixture as evidence (B12 SPEC:429). |

No new issue was introduced. **Final counts:** 19 findings in all (3 blocking, 9 should-fix and
7 minor at raising), all 19 Resolved; nothing open; coverage stays 164 of 164 with every split
delivery covered on both sides.

### Dispositions of FID-01 to FID-17

| FID | Severity | Disposition | Evidence |
|---|---|---|---|
| FID-01 | Blocking | Resolved | B07-REQ-08 and the D-10 decision entry (B07 SPEC:307-330, :405, :419); B09-REQ-13.3 and B10-REQ-06.5 consume it; B09-Q1 and B10-Q1 answered; B15-REQ-09 checks D-01 to D-10 |
| FID-02 | Blocking | Resolved | B05 SPEC:23, :273 (store `renameLane` and `deleteLane` switched); R-56 proof row adds the store case (:420); B07:359-360 and B11:30 consume |
| FID-03 | Blocking | Resolved | B12-REQ-14 plus proof row 14; B02-REQ-05 limited to the board half; B02-Q2 answered; B12 Depends on B02 |
| FID-04 | Should-fix | Resolved | B02-REQ-07 (A-2) with proof; B12-REQ-15 (A-4, A-10) with proof row 15; B15 SPEC:5-7, :47 confirm only |
| FID-05 | Should-fix | Resolved | B12-REQ-16 (tests in `verify`); B12-REQ-11 (deny terms and starter placeholders, leak-check proof); B12-REQ-10 (`capture.ts`); B12-Q1, Q2 and Q4 answered |
| FID-06 | Should-fix | Resolved | B03-REQ-02.4 (Freeform orphan stack) and .5 (check names cycles); B03-REQ-03.3 and .4 (`ItemModal`, labels); R-10 and R-11 proof rows extended |
| FID-07 | Should-fix | Resolved | B08-REQ-11 with proof "R-54 support"; B08-REQ-10.4 reworded; B05-REQ-20 consumes the bound; B05-Q1 and B08-Q4 answered |
| FID-08 | Should-fix | Resolved | B12-REQ-10 (a stale-notes note does not count; accepted decision 12); proof row 10 checks the report file itself |
| FID-09 | Should-fix | Resolved | Convention 13; B12 acceptance preamble; B13 SPEC:398-399 |
| FID-10 | Should-fix | Resolved | B10-REQ-11 and its proof row (B10 SPEC:370-385, :449); B07 (D-10) added to B10's Depends on |
| FID-11 | Should-fix | Resolved | B06 R-42 proof row (a) reproduces the FINDINGS path: Esc keeps the draft, then a New card reuses the ID (B06 SPEC:368) |
| FID-12 | Minor | Resolved | B02 R-01(c) now reads "refused or writes the project's own list (per B02-Q4)"; damaged cases refused (B02 SPEC:317-320); B06's R-01 row matches |
| FID-13 | Minor | Resolved | B01-REQ-07 REPO_ROOT bullet and PR-07 (accepted decision 11); B03 defers to it (B03 SPEC:37, :126) |
| FID-14 | Minor | Resolved | B01 SPEC:233 (nosniff marked as hardening); B09 rule 5 timings non-gating (SPEC:157-159, B09-Q2); B04 SPEC:247, :403 (extension corpus); B06 SPEC:286 (added scope only if accepted) |
| FID-15 | Minor | Resolved | B14-Q1: the env-path sweep is B14's under touch rights; only the choice remains |
| FID-16 | Minor | Resolved | B14 SPEC:51, :59, :385 now cite R-127 |
| FID-17 | Minor | Resolved | Depends-on lines match PLAN (B03:51, B04:46, B06:40, B11:28, B12:36); B06-Q1, Q6 and B07-Q1 to Q4 marked answered; no "parallel-safe" text left; B13 owns `link-index.ts` (SPEC:18) |

### New findings introduced or exposed by the corrections

#### FID-18 · Should-fix · B05 (with B08) · R-54 is not closed when a deleted ID is reissued before the deletion is committed

- **Location:** B08-REQ-11.4 (B08 SPEC:305-307): only committed deletions on the first-parent chain
  make a bound; "a delete and re-add made in the working tree since HEAD is invisible to git; B05's
  journal handling covers it". B05-REQ-20 (B05 SPEC:338-351) applies B08's bound for the git side
  and `forget` for the journal side. The B05 R-54 proof row (:423) does not say whether a commit
  separates the delete from the re-create.
- **Issue:** the board reissues the top freed ID straight away (`shared/ids.ts`, max plus one over
  files and state). The usual sequence is: delete a committed card on the board, create a new card
  (it gets the same ID), then commit. Git then records a *modification* of that path, not a
  deletion, so B08's bound never appears. The journal side only covers journal entries. Nothing cuts
  the old card's git versions, and the FINDINGS failure ("A new US-01.1.6 shows as an edit of the
  deleted 'Old mistaken card', with its commits underneath") still occurs. FINDINGS' own candidate
  ("cut at the last null version") shares the gap. The B05-REQ-20 outcome is still correct as
  written ("holds for a delete through the board ... and for a file removed by hand"); the
  mechanism and the proof do not reach this case.
- **Consequence:** under a D-05 "reuse stays" answer, R-54 can be recorded Fixed while its most
  common path still misattributes history. Under "never reuse" the case is moot.
- **Correction:** state in B05-REQ-20 that the rule holds when no commit separates the deletion
  from the reissue. The means stays open for B05's planning (for example the journal keeps a
  reissue marker with the deleted record's last version, and the timeline cuts git versions at or
  before it, including after the commit). Add a proof case: commit a card, delete it on the board,
  create a new card that receives the ID, commit, and the History shows only the new card. Reword
  B08-REQ-11.4's handoff to say B05 covers the git-side cut for that case, not only the journal.
  Owner: B05 (closer); B08 wording only.

#### FID-19 · Minor · B12 · The A-10 and A-4 proofs assume the verdict

- **Location:** B12 proof row 15: "the page does not flag 're-plan first' (flags today)" and lane
  rows "(missing today)".
- **Issue:** B12-REQ-15 asks B12 to adjudicate both items, and FINDINGS refuted A-10's failure as
  described. The proof row states the defect as fact, while the acceptance preamble allows a
  "does not reproduce" verdict. The row should let the fixture decide.
- **Correction:** reword row 15: run the fixture at B12's start; if the failure shows, the fix must
  make the row pass (fails first); if it does not, record the fixture and the "refuted" verdict.

### Corrections still to route

| Spec | Correction |
|---|---|
| B05 | FID-18: add the delete-then-reissue-before-commit case to B05-REQ-20 and to the R-54 proof row |
| B08 | FID-18: reword B08-REQ-11.4's handoff (B05 covers the git-side cut when no deletion is committed) |
| B12 | FID-19: proof row 15 lets the fixture decide the A-4 and A-10 verdicts |

Notes, not findings: B03-REQ-06.2 (one shape-checked reader for every browser JSON store) goes
beyond R-51. It is accepted scope (accepted decision 10, PLAN B03 territory) and marked as such.
B14-REQ-14 (`artifact:new` without `git mv`) comes from PROGRESS "Discovered for later" and has a
proof row. PLAN's Phases table lists R-01 under B02 while the split note makes B06 the closer;
B15-REQ-02's split-delivery rule (B15 SPEC:128) covers this.

The original review follows unchanged.

---

Reviewer: fresh requirements-fidelity reviewer (Buildbook Section 4, Step 5). Read in full:
`docs/BUILD-BOOK.md` Sections 1 to 4, `FINDINGS.md`, `PLAN.md`, `PROGRESS.md` and all 15
`phases/*/SPEC.md`. Disputed claims checked against `requirements-board/` at d4341735 (read only).
The coverage table was produced mechanically: a script expanded every `R-nn` and `R-nn to R-mm`
range in PLAN's Phases table and in each spec's "Detailed requirements" and "Acceptance and
evidence" sections, then the result was corrected by hand where a spec numbers requirements by
heading only (B05, B13) and where a review finding below qualifies the result.

## Coverage result

- **PLAN mapping:** 164 of 164 findings have an owner; no ID is missing. R-07 is the only ID listed
  twice (B02 and B12), which matches accepted decision 4 (B12 closes it). No orphaned IDs: no spec
  claims an R-id outside FINDINGS.
- **Specs:** every R-01 to R-164 appears in the owning phase's "Detailed requirements" and in its
  "Acceptance and evidence" section. Other specs mention R-ids only as cross-references, except two
  real overlaps: R-07 (B02-REQ-05 claims the plan-tool half that accepted decision 4 gives to B12;
  B12 has no requirement for it, FID-03) and R-56 (each of B05, B07 and B11 assumes another phase
  wires the client, FID-02).
- **Qualified coverage:** 7 findings are covered only in part or on contested ground (R-07, R-10,
  R-42, R-54, R-56, R-96/R-104, R-139). See the Notes column and the findings.
- **Programme items outside FINDINGS that PLAN assigns:** D-10 (asset change signal, B07) is in **no
  spec** (FID-01). The HistoryView screenshot failure label (B10) is in no spec (FID-10). A-2, A-4
  and A-10 are adjudicated by the wrong phase (FID-04).

### Coverage table

| R-id | Owner per PLAN | Spec requirement(s) | Proof present | Notes |
|---|---|---|---|---|
| R-01 | B02 | B02-REQ-01, B02-REQ-02 | Yes (R-01(c) wording) | FID-12 |
| R-02 | B06 | B06-REQ-01 | Yes |  |
| R-03 | B01 | B01-REQ-01, B01-REQ-02, B01-REQ-03 | Yes |  |
| R-04 | B01 | B01-REQ-04, B01-REQ-05 | Yes |  |
| R-05 | B14 | B14-REQ-01 | Yes |  |
| R-06 | B02 | B02-REQ-04 | Yes |  |
| R-07 | B12 closes (B02 board half) | B02-REQ-05 only; **no B12 requirement** | Partial (B02 only) | FID-03 |
| R-08 | B13 | B13-REQ-11 | Yes | FID-09 |
| R-09 | B13 | B13-REQ-03 | Yes | FID-09 |
| R-10 | B03 | B03-REQ-01, B03-REQ-02 | Yes (Freeform part open) | FID-06 |
| R-11 | B03 | B03-REQ-01, B03-REQ-03 | Yes |  |
| R-12 | B06 | B06-REQ-07 | Yes |  |
| R-13 | B10 | B10-REQ-01 | Yes |  |
| R-14 | B12 | B12-REQ-01 | Yes | FID-09 |
| R-15 | B12 | B12-REQ-08 | Yes | FID-09 |
| R-16 | B12 | B12-REQ-03 | Yes | FID-09 |
| R-17 | B12 | B12-REQ-02 | Yes | FID-09 |
| R-18 | B12 | B12-REQ-05 | Yes | FID-09 |
| R-19 | B12 | B12-REQ-06 | Yes | FID-09 |
| R-20 | B13 | B13-REQ-04 | Yes | FID-09 |
| R-21 | B13 | B13-REQ-05 | Yes | FID-09 |
| R-22 | B01 | B01-REQ-06 | Yes |  |
| R-23 | B08 | B08-REQ-01, B08-REQ-04 | Yes |  |
| R-24 | B08 | B08-REQ-02 | Yes |  |
| R-25 | B09 | B09-REQ-01 | Yes |  |
| R-26 | B05 | B05-REQ-14 | Yes |  |
| R-27 | B04 | B04-REQ-04 | Yes |  |
| R-28 | B04 | B04-REQ-02 | Yes |  |
| R-29 | B11 | B11-REQ-01 | Yes |  |
| R-30 | B02 | B02-REQ-07 | Yes |  |
| R-31 | B14 | B14-REQ-01, B14-REQ-07 | Yes |  |
| R-32 | B09 | B09-REQ-08 | Yes |  |
| R-33 | B10 | B10-REQ-09 | Yes |  |
| R-34 | B13 | B13-REQ-01 | Yes |  |
| R-35 | B01 | B01-REQ-07 | Yes |  |
| R-36 | B01 | B01-REQ-08 | Yes |  |
| R-37 | B05 | B05-REQ-09, -10 | Yes |  |
| R-38 | B04 | B04-REQ-08 | Yes |  |
| R-39 | B14 | B14-REQ-08 | Yes |  |
| R-40 | B07 | B07-REQ-02, B07-REQ-03 | Yes |  |
| R-41 | B06 | B06-REQ-02 | Yes |  |
| R-42 | B06 | B06-REQ-05 | Partial (post-Discard only) | FID-11 |
| R-43 | B06 | B06-REQ-06 | Yes |  |
| R-44 | B02 | B02-REQ-06 | Yes |  |
| R-45 | B06 | B06-REQ-11 | Yes |  |
| R-46 | B02 | B02-REQ-08 | Yes |  |
| R-47 | B03 | B03-REQ-04 | Yes (REPO_ROOT 'also' unassigned) | FID-13 |
| R-48 | B03 | B03-REQ-04 | Yes |  |
| R-49 | B03 | B03-REQ-04 | Yes |  |
| R-50 | B03 | B03-REQ-05 | Yes |  |
| R-51 | B03 | B03-REQ-06 | Yes |  |
| R-52 | B03 | B03-REQ-01, B03-REQ-06 | Yes |  |
| R-53 | B03 | B03-REQ-02 | Yes |  |
| R-54 | B05 | B05-REQ-19, -20 | Yes (cut location contested) | FID-07 |
| R-55 | B05 | B05-REQ-15, -16 | Yes |  |
| R-56 | B05 | B05-REQ-12, -13 (server half only) | Partial (API only) | FID-02 |
| R-57 | B07 | B07-REQ-04 | Yes |  |
| R-58 | B07 | B07-REQ-01 | Yes |  |
| R-59 | B07 | B07-REQ-05 | Yes |  |
| R-60 | B04 | B04-REQ-01 | Yes |  |
| R-61 | B04 | B04-REQ-01 | Yes |  |
| R-62 | B04 | B04-REQ-01 | Yes |  |
| R-63 | B01 | B01-REQ-09 | Yes |  |
| R-64 | B05 | B05-REQ-17 | Yes |  |
| R-65 | B03 | B03-REQ-04 | Yes |  |
| R-66 | B03 | B03-REQ-05 | Yes |  |
| R-67 | B05 | B05-REQ-18 | Yes |  |
| R-68 | B02 | B02-REQ-03 | Yes |  |
| R-69 | B08 | B08-REQ-04 | Yes |  |
| R-70 | B08 | B08-REQ-03 | Yes |  |
| R-71 | B08 | B08-REQ-03 | Yes |  |
| R-72 | B08 | B08-REQ-05 | Yes |  |
| R-73 | B08 | B08-REQ-06 | Yes |  |
| R-74 | B08 | B08-REQ-07 | Yes |  |
| R-75 | B04 | B04-REQ-06 | Yes |  |
| R-76 | B04 | B04-REQ-06 | Yes |  |
| R-77 | B04 | B04-REQ-06 | Yes |  |
| R-78 | B04 | B04-REQ-07 | Yes |  |
| R-79 | B04 | B04-REQ-06 | Yes |  |
| R-80 | B04 | B04-REQ-07 | Yes |  |
| R-81 | B04 | B04-REQ-07 | Yes |  |
| R-82 | B04 | B04-REQ-07 | Yes |  |
| R-83 | B04 | B04-REQ-02, B04-REQ-03 | Yes |  |
| R-84 | B04 | B04-REQ-05 | Yes |  |
| R-85 | B04 | B04-REQ-08 | Yes |  |
| R-86 | B11 | B11-REQ-03 | Yes |  |
| R-87 | B09 | B09-REQ-12 | Yes |  |
| R-88 | B09 | B09-REQ-03 | Yes |  |
| R-89 | B09 | B09-REQ-02 | Yes |  |
| R-90 | B09 | B09-REQ-04 | Yes |  |
| R-91 | B09 | B09-REQ-05, B09-REQ-06 | Yes |  |
| R-92 | B09 | B09-REQ-05 | Yes |  |
| R-93 | B09 | B09-REQ-09 | Yes |  |
| R-94 | B09 | B09-REQ-07 | Yes |  |
| R-95 | B09 | B09-REQ-10 | Yes |  |
| R-96 | B09 | B09-REQ-13 | Yes (signal owner contested) | FID-01 |
| R-97 | B09 | B09-REQ-11 | Yes |  |
| R-98 | B10 | B10-REQ-03 | Yes |  |
| R-99 | B10 | B10-REQ-04 | Yes |  |
| R-100 | B10 | B10-REQ-03 | Yes |  |
| R-101 | B04 | B04-REQ-03 | Yes |  |
| R-102 | B01 | B01-REQ-03 | Yes |  |
| R-103 | B10 | B10-REQ-05 | Yes |  |
| R-104 | B10 | B10-REQ-06 | Yes, blocked on B10-Q1 | FID-01 |
| R-105 | B10 | B10-REQ-07 | Yes |  |
| R-106 | B10 | B10-REQ-08 | Yes |  |
| R-107 | B06 | B06-REQ-05 | Yes |  |
| R-108 | B06 | B06-REQ-08 | Yes |  |
| R-109 | B06 | B06-REQ-09 | Yes |  |
| R-110 | B06 | B06-REQ-10 | Yes |  |
| R-111 | B06 | B06-REQ-03 | Yes |  |
| R-112 | B06 | B06-REQ-04 | Yes |  |
| R-113 | B11 | B11-REQ-02, B11-REQ-03 | Yes |  |
| R-114 | B11 | B11-REQ-02 | Yes |  |
| R-115 | B11 | B11-REQ-04 | Yes |  |
| R-116 | B11 | B11-REQ-05 | Yes |  |
| R-117 | B11 | B11-REQ-05 | Yes |  |
| R-118 | B11 | B11-REQ-06 | Yes |  |
| R-119 | B11 | B11-REQ-07 | Yes |  |
| R-120 | B11 | B11-REQ-08 | Yes |  |
| R-121 | B03 | B03-REQ-07 | Yes |  |
| R-122 | B03 | B03-REQ-07 | Yes |  |
| R-123 | B06 | B06-REQ-13 | Yes |  |
| R-124 | B06 | B06-REQ-13, B06-REQ-14 | Yes |  |
| R-125 | B06 | B06-REQ-14 | Yes |  |
| R-126 | B11 | B11-REQ-09 | Yes |  |
| R-127 | B11 | B11-REQ-10 | Yes |  |
| R-128 | B11 | B11-REQ-11 | Yes |  |
| R-129 | B14 | B14-REQ-10 | Yes |  |
| R-130 | B14 | B14-REQ-10 | Yes |  |
| R-131 | B14 | B14-REQ-02, B14-REQ-10 | Yes |  |
| R-132 | B14 | B14-REQ-10 | Yes |  |
| R-133 | B13 | B13-REQ-12 | Yes |  |
| R-134 | B14 | B14-REQ-09 | Yes |  |
| R-135 | B12 | B12-REQ-07 | Yes |  |
| R-136 | B12 | B12-REQ-09 | Yes |  |
| R-137 | B12 | B12-REQ-09 | Yes |  |
| R-138 | B12 | B12-REQ-03 | Yes |  |
| R-139 | B12 | B12-REQ-10 | Weak (accepts a stale report) | FID-08 |
| R-140 | B13 | B13-REQ-02 | Yes |  |
| R-141 | B13 | B13-REQ-07 | Yes |  |
| R-142 | B13 | B13-REQ-07e | Yes |  |
| R-143 | B13 | B13-REQ-08 | Yes |  |
| R-144 | B13 | B13-REQ-06 | Yes |  |
| R-145 | B13 | B13-REQ-09 | Yes |  |
| R-146 | B13 | B13-REQ-13 | Yes |  |
| R-147 | B13 | B13-REQ-10 | Yes |  |
| R-148 | B14 | B14-REQ-12 | Yes |  |
| R-149 | B14 | B14-REQ-03, B14-REQ-04 | Yes |  |
| R-150 | B12 | B12-REQ-11 | Yes |  |
| R-151 | B12 | B12-REQ-12 | Yes |  |
| R-152 | B14 | B14-REQ-04 | Yes |  |
| R-153 | B14 | B14-REQ-04 | Yes |  |
| R-154 | B14 | B14-REQ-02, B14-REQ-03 | Yes |  |
| R-155 | B14 | B14-REQ-11 | Yes |  |
| R-156 | B14 | B14-REQ-13 | Yes |  |
| R-157 | B14 | B14-REQ-12 | Yes |  |
| R-158 | B07 | B07-REQ-06 | Yes |  |
| R-159 | B07 | B07-REQ-07 | Yes |  |
| R-160 | B03 | B03-REQ-08 | Yes |  |
| R-161 | B08 | B08-REQ-08 | Yes |  |
| R-162 | B08 | B08-REQ-09 | Yes |  |
| R-163 | B10 | B10-REQ-02 | Yes |  |
| R-164 | B12 | B12-REQ-04 | Yes |  |

### Systemic issues: is the root fix required?

| Issue | Root fix in FINDINGS | Where required | Verdict |
|---|---|---|---|
| 1. Writes from a stale or lossy model | Field patches with base rev merged on disk; YAML in place; refuse fallback-derived saves | B05-REQ-01 to -09, -12, -13; B06-REQ-01, -11, -12; B02-REQ-02; B07-REQ-05 | Required, except that no spec wires the store's lane rename to B05's one-write request (FID-02) |
| 2. Status codes without identity | Registry with high-water mark and tombstones; recode versions scoped; refuse partial maps; damaged list is an error | B02-REQ-01 to -09 (D-02) | Required for the board. The plan tools' half has no requirement in B12 (FID-03) |
| 3. History readers skip careful git | One reader: first-parent, `-z`, bounded renames, clean hashing, both widths, promise LRU | B08-REQ-01 to -09 (D-07) | Required as observable behaviour (one module left to the planner, consistent with Step 3). Deletion bound for R-54 contested (FID-07) |
| 4. Same rule coded twice | One helper per concept | B04-REQ-01 to -09 (D-03); B13-REQ-07b | Required; D-03 option B keeps two copies under a parity test, which the spec states openly |
| 5. Bad data crashes or misleads | Error boundary, visited sets, per-record try/catch, validate on read, 404 not `next()` | B03-REQ-01 to -07; B01-REQ-06 | Required, except Freeform placement of cycle members (FID-06) |

### Refuted findings A-1 to A-10

| ID | PLAN / accepted decision | Specs | Verdict |
|---|---|---|---|
| A-1 | Context for D-05; B15 confirms | B05 D-05, B14-REQ-06, B15-REQ-13 | OK |
| A-2 | **B02 adjudicates** (accepted decision 3) | B02 says B15 re-adjudicates; B15-REQ-10 adjudicates | Wrong owner (FID-04) |
| A-3 | B15 confirms | B14 context, B15-REQ-13 | OK |
| A-4 | **B12 adjudicates and fixes** | B12 Excludes it to B15; B12-Q5 open; B15-REQ-11 adjudicates | Wrong owner (FID-04) |
| A-5 to A-9 | B15 confirms | B15-REQ-13 (A-5 also excluded in B09, A-7 in B10) | OK |
| A-10 | **B12 adjudicates and fixes** | B12 Excludes it to B15; B15-REQ-13 only re-checks the premise | Wrong owner (FID-04) |

## Findings (ranked)

Counts: **3 blocking**, **8 should-fix**, **6 minor**. Spec locations are `SPEC.md` line numbers
in the phase folder. "AD n" means PROGRESS.md "Accepted decisions", item n.

### FID-01 · Blocking · B07 (also B09, B10, B15) · D-10 has no owner in any spec

- **Location:** B07 SPEC:344 ("Owned shared decisions: none"); no B07 requirement or proof mentions
  an asset version or change signal. B09 SPEC:46, :317-318 and B09-Q1 (:416, "Recommended: B09
  produces it"). B10 SPEC:247-248 (REQ-06 "Blocked on B10-Q1") and B10-Q1 (:409, "Alternatively
  Moved to B07"). B15-REQ-09 (:141) checks "D-01 to D-09" only. `grep D-10 phases/*/SPEC.md` finds
  nothing.
- **Issue:** PLAN (B07 row, D-10 row) and AD 5 give "the asset version and change signal (D-10)" to
  B07, consumed by B09 (R-96) and B10 (R-104). FINDINGS R-96's fix is "Emit an assets event or
  fingerprint, shared with R-104". The owner spec neither owns the decision nor builds the signal,
  while the two consumer specs each claim or defer it.
- **Consequence:** B07 builds and closes without the signal. B09 then builds its own (against
  B07's finished event shape) and B10 waits on a question already settled by PLAN, or builds a second
  mechanism. R-104's unconditional proof cannot run until someone builds the signal. B15 never checks
  that D-10 was answered.
- **Correction:** add to B07 a requirement (for example B07-REQ-08) and a D-10 entry in "Deferred
  decisions": when a screenshot or other asset file changes on disk, open tabs receive, once per
  re-sync, which cards' assets changed and a version token per changed file; unchanged files keep
  their token; the token is accepted by B01's guarded asset route. Options (event kind, per-asset
  version in snapshot or item meta, URL token form) stay open for B07's planning. Proof: rewrite one
  screenshot on disk and observe one delivery naming that card with a new token; an unchanged file's
  token is stable across catalogue events. Then reword B09-REQ-13 and B10-REQ-06 as consumers of
  D-10, mark B09-Q1 and B10-Q1 resolved by AD 5, add B07 to B09's and B10's Depends on (PLAN already
  lists it), and make B15-REQ-09 read "D-01 to D-10".

### FID-02 · Blocking · B05 (also B07, B11) · R-56's client half has no owner

- **Location:** B05 SPEC:31 (Excludes "B07: R-56 client half"), :54 ("B07 builds the lane rename
  client half"), :255-256 ("Wiring the store to this request ... is B07"). B07 SPEC:33 (Excludes
  "lane rename as one write (R-56) ... (all B05)"), :39 ("R-56, which edits `store.ts`
  `renameLane`/`setLanes`"), :298. B11 SPEC:175 ("Writes go through the lane-rename path as B05
  leaves it").
- **Issue:** FINDINGS R-56's mechanism and failure are in the client (`src/store.ts:313-314`: the
  batch renames stories, then `setLanes` runs). B05 builds only a server route; B07 and B11 both
  assume B05 rewired `renameLane`. PLAN's touch-rights constraint says the owner phase delivers the
  whole fix. B05's R-56 proof is API-level only (SPEC:391), so it passes while the board still makes
  two writes. The same gap applies to `deleteLane`, which B05 took into scope (PROGRESS "Discovered
  for later").
- **Consequence:** R-56 can be recorded Fixed with the FINDINGS failure ("a merge-conflict marker in
  board-layout.json turns a rename into stories in an unlisted lane 'Now', with nothing to undo")
  still reproducible from the board.
- **Correction:** B05 adds a requirement that the store's lane rename and lane removal use the
  single request; a refusal or failure leaves stories, lanes and the store unchanged and shows the
  existing "Lane not renamed" problem. Add a proof row: a store-level test with the layout file
  unreadable (422) shows no story file changed and no local state changed. Remove "R-56 client half"
  from B05's Excludes and Unblocks, and reword B07:39 as "consumes B05's rewired `renameLane`".

### FID-03 · Blocking · B12 (also B02) · R-07's plan-tool half has no requirement in the phase that closes it

- **Location:** B12 SPEC:25-26 (Excludes "Status registry and recode versioning (R-07, D-02): B02");
  the only mention is B12-REQ-04's conditional last bullet (:187). B02 SPEC:164-167 (REQ-05 proven
  "in every listed consumer, including the plan tools' separate copy (B02-Q2)"), :289-293 (R-07 proof
  "in ... each listed plan tool"), B02-Q2 (:364, "Deliver in B02 ... or Move to B12").
- **Issue:** AD 4: "R-07 board half B02, plan-tool half B12 (B12 closes)". FINDINGS R-07 names
  `update-build-plan/tools/scope.mjs:41` and its callers, with the failure "The build-plan tools
  treat Confirmed items as retired and drop them from grading". B12 has no requirement or proof for
  it; B02 still claims it and leaves the split as an open question.
- **Consequence:** the closer cannot close R-07. Either B02 edits B12's shared modules (which B12
  edits in parallel in another worktree), or the plan tools keep re-mapping post-recode values.
- **Correction:** add B12-REQ-14 "Plan tools read stored statuses by B02's rule (R-07 plan-tool
  half)": every plan-tool status reader (`scope.mjs` and its callers `req-changes`, `assemble-gaps`,
  `build-args`, `phase-context`, and `build-index` per A-10) applies the D-02b rule. Proof: if D-02b
  is version scoping, a fixture with an overlapping renumber (`4=5,5=6`) keeps a Confirmed item
  graded and detects a later real move; if D-02b is no-overlap, a test that chain-following is
  idempotent on post-recode values in the plan tools' copy. The names-to-codes entry reads as today.
  In B02, limit REQ-05 and the R-07 proof to the shared rule, the diff and the history route; mark
  B02-Q2 resolved by AD 4; fix B12's Excludes line and add "after B02" to B12's Depends on.

### FID-04 · Should-fix · B02, B12, B15 · A-2, A-4 and A-10 are adjudicated by the wrong phase

- **Location:** B02 SPEC:6-7 ("refuted A-2 and A-10 (B15 re-adjudicates)"), :17 (Excludes
  "recode-while-running (A-2, B15)"), :381-385. B12 SPEC:28 (Excludes "Re-adjudication of A-4 and
  A-10 ... B15"), B12-Q5 (:418). B15-REQ-10 to -12 (:147-171) and B15-Q1.
- **Issue:** AD 3 re-homed A-2 to B02 and A-4 and A-10 to B12, which adjudicate and fix; B15 only
  confirms. The specs still route all three to B15, where B15-REQ-12 can only fix under B15-Q1 or
  move the defect to "Discovered for later". B12's own evidence says A-4 "appears to hold by
  reading" (:120-121), and B02's Risks show A-2's mechanism gets worse under an overlapping map.
- **Consequence:** a likely-real defect in each of B02's and B12's territory reaches the programme's
  close without a building owner.
- **Correction:** B02 adds a requirement to adjudicate A-2 (move B15-REQ-10's reproduction rules:
  scratch catalogue and history folder, journal path actually exercised) and fix it if confirmed,
  with proof. B12 adds requirements for A-4 (lane rows and prompts render when no phase is safe) and
  A-10 (the "re-plan first" flag compares normalised statuses), each adjudicated with a fixture
  proof and fixed if confirmed. B15-REQ-10 to -12 become "confirm the owner's verdict still holds
  at the audit commit"; remove B15-Q1 and B12-Q5.

### FID-05 · Should-fix · B12 (also B14) · Items PLAN gives to B12 are left as open questions

- **Location:** B12-Q1 (:414, add tool tests to `verify:board` or not), B12-Q2 (:415, deny terms and
  starter placeholders, "Default: hand off"), B12-Q4 and SPEC:21-22 (R-139's `capture.ts` is "B14's").
  B14-REQ-03.4 (:179-181, adds terms "if B12 hands them over").
- **Issue:** AD 6 ("Agent-tool tests join `verify:board` in B12") and PLAN's B12 territory ("adding
  the agent-tool test suites to `verify:board`, the R-139 fix in `scripts/capture.ts`, and the deny
  terms and starter 'This repo' placeholders R-150 needs") settle all three. FINDINGS R-150's fix
  includes "add the terms to deny.txt".
- **Consequence:** R-150 could close in B12 without the leak-check terms that stop the vocabulary
  coming back, and every phase between B12 and B14 can break the tools while `verify:board` stays
  green.
- **Correction:** turn each into a requirement with proof: `verify` runs the `node --test` suites
  (proof: a deliberately failing tool test turns `verify:board` red); B12 adds the deny terms and
  starter placeholders (proof: a scratch `kit:export --dry-run` passes its leak check, and a planted
  term fails it); B12 may edit `capture.ts` for R-139. Remove B12-Q1, Q2 and Q4. B14-REQ-03.4
  becomes "verify B12's terms are present".

### FID-06 · Should-fix · B03 (also B11) · R-10's Freeform omission and other PLAN-assigned B03 items are left open

- **Location:** B03-Q1 (:409-416, Freeform cycle members, owner "orchestrator", option "Moved to
  B11"), B03-Q4 (:435-441, labels), B03-Q6 (:451-456, "B04 owns `shared/check.ts`; B03 proposes"),
  collision 6 (:328-329, `ItemModal.tsx:223`). B11 SPEC:262-264 (collision 1 assumes B03 lands the
  Freeform fix); B11-REQ-01 covers Mapped only.
- **Issue:** FINDINGS R-10 (Medium): "In Freeform, cycle members are silently missing instead
  (autoLayout.ts:43)", with the fix "Place unreached items in Freeform's orphan stack". PLAN's B03
  territory names "Freeform placement of cycle members", "safe type lookups (`canParent`, labels,
  `ItemModal`'s type use)" and "naming parent cycles in the check".
- **Consequence:** B03 can close R-10 on the crash alone while Freeform still silently omits cycle
  members (programme outcome 3), and B11 will not pick it up.
- **Correction:** add to B03-REQ-02 "in Freeform every card not reached from an epic, cycle members
  included, is placed (the orphan stack)", with a proof clause in the R-10 row. Resolve B03-Q1, Q4
  and Q6 and collision 6 as PLAN assigns them (B03 delivers each, with touch rights in B11's,
  B04's and B06's files), and add their proofs: a label fallback test, a check issue naming a
  cycle's members, and the `ItemModal` delete confirmation (already in the R-11 row).

### FID-07 · Should-fix · B08 (also B05) · R-54's deletion bound contradicts AD 4

- **Location:** B08 SPEC:31-32 (Excludes the deletion case), :163-164 (REQ-03.2 "Deletion followed
  by re-adding a path is R-54 (B05)"), :257-258 (REQ-10.4 "B08 must not drop or move it"), B08-Q4
  (:383-389, open). B05-Q1 (:458-461, "PLAN's default": B05 edits `gitHistory.ts`) and :360-362
  ("B08 ... in the serial order runs after it").
- **Issue:** AD 4 says "R-54 ID rule and journal B05, history cut by B08's deletion bound (B05
  closes)"; PLAN's B08 row says it "owns cutting history at a deletion"; the serial order now puts
  B08 before B05. Neither spec has B08 provide the bound.
- **Consequence:** B08 builds first and freezes a contract without a deletion bound; B05 must then
  edit B08's reader against that contract, or each phase waits on the other's question.
- **Correction:** add a B08 requirement that the readers report a deletion bound (where a path's
  history was cut by a deletion, so a later re-add starts a new segment), as an optional field in
  the B09 contract, with a fixture proof (add, delete, re-add the same path: the bound is reported
  and the re-added file's segment starts after it). B05-REQ-20 then consumes it. Reword
  B08-REQ-10.4 to "deletion versions stay visible and carry the bound". Mark B08-Q4 and B05-Q1
  resolved; fix B05's sequencing sentence.

### FID-08 · Should-fix · B12 · R-139 can close with the stale report still committed

- **Location:** B12-REQ-10 (:246-248, "or the session's final notes and progress entry say plainly
  that the report is stale and why"); proof row 10 (:353, "or the notes state it is stale. Manual
  check acceptable").
- **Issue:** the FINDINGS failure is "The phase ends with a stale 'Failed recipe 1'"; the fix is
  "Re-run `--capture all` until it is clean, or have `--only` update its own row". Saying the report
  is stale is not in FINDINGS and leaves the failure in place.
- **Consequence:** R-139 recorded Fixed while every committed REPORT.md can still carry a fixed
  failure.
- **Correction:** delete the "notes say stale" alternative. Require that the committed report shows
  no recipe the session fixed as failed, by a full capture or by `--only` updating its own rows.
  Keep the lane exception as stated (lanes skip the final full capture; the join's capture must
  leave the report true). The proof walks the fixture close-out and checks the report itself.

### FID-09 · Should-fix · B12, B13 · Proofs do not have to fail before the fix

- **Location:** B12 "Acceptance and evidence" (:339-340, "tests are the execution agent's choice of
  form"); B13 (:364-366, "Each is a fixture run, a test, or a recorded manual check"). Neither says a
  proof must fail at HEAD, unlike B01 to B11 and B14.
- **Issue:** PLAN "Proof and integration" requires a failing-then-passing test for every fixable
  finding where practical. B12 and B13 own 10 Medium findings (R-08, R-09, R-14 to R-21).
- **Consequence:** a fixture that passes on the old code can be recorded as proof. B15-REQ-03 would
  catch it only at the close.
- **Correction:** add to both acceptance sections: "each proof fails on the code at the phase's
  start, or the recorded manual check shows the failure, and passes after the fix".

### FID-10 · Should-fix · B10 · The HistoryView screenshot failure label is in no requirement

- **Location:** B10 SPEC has no requirement, proof or mention of HistoryView's `Shot`. PLAN B10 row
  ("plus the HistoryView screenshot failure label (found while authoring B09)"), PLAN B10 territory,
  AD 5, PROGRESS "Discovered for later" ("taken into B10 scope"). B09 SPEC:374-377 says "B10 or B15
  can decide".
- **Issue:** the programme took this into B10's scope; B10's spec omitted it.
- **Consequence:** the same false "never committed" label R-103 fixes in VisualCompare stays in the
  card timeline, and B15 finds an unaccounted PLAN deliverable.
- **Correction:** extend B10-REQ-05 so HistoryView's screenshot `Shot` uses the same truthful
  states (404 means "Not kept"; any other failure "Could not be read"), with a proof row. Add B07
  (D-10) to B10's Depends on, as PLAN states.

### FID-11 · Should-fix · B06 · R-42's proof does not reproduce the FINDINGS failure

- **Location:** B06 acceptance R-42 row (:347): "after confirming Discard, reload does not prompt;
  New card that receives the same ID opens clean".
- **Issue:** FINDINGS R-42's failure is that Esc keeps the dead draft and a new card that reuses the
  ID opens with it under a conflict banner. B06-REQ-05 lets Esc keep the draft ("or proceeds while
  keeping the draft intact"), and its third bullet requires a New card never to open with a leftover
  draft. The proof checks the New card case only after Discard, which already removes the draft.
- **Consequence:** the R-42 scenario can still occur when the Esc path keeps the draft, and the
  proof would pass.
- **Correction:** add to the R-42 row: orphan a draft, leave it by Esc with the draft kept, then
  create a New card that receives the same ID; it opens with no draft and no conflict banner.

### FID-12 · Minor · B02 · The R-01(c) proof wording can conflict with B02-Q4

- **Location:** B02 acceptance R-01(c) (:276-278): the FINDINGS scenario (a bad tone, then a
  reworded save) "is refused".
- **Issue:** under B02-REQ-01 a bad tone is a *degraded* list, and B02-Q4 may let degraded lists be
  repaired through Settings. The behaviour that closes R-01 is that no save replaces the project's
  list with the defaults. Refusal is required only for a damaged list.
- **Correction:** reword: for the FINDINGS scenario, either the save is refused or it writes the
  project's own list with codes 5 and 6 keeping their meanings (per B02-Q4); for every damaged case
  the save is refused and the file is byte-identical.

### FID-13 · Minor · B03 (also B01) · R-47's "also" on REPO_ROOT symlink paths is unassigned in practice

- **Location:** B01 SPEC:27-28 gives "R-47 including its 'also' on REPO_ROOT symlink paths" to B03;
  B03 never mentions it. B01-REQ-07 bullet 3 states the behaviour ("a base that is itself reached
  through a symlink keeps working ... `REPO_ROOT` and the requirements folder may differ"), but
  PR-07 proves only a symlinked requirements folder.
- **Correction:** either B03 names the item, with a proof that a `/`-rooted artifact resolves when
  `REPO_ROOT` or the git top-level and the requirements folder differ by a symlink, or B01 takes it
  explicitly and adds that case to PR-07.

### FID-14 · Minor · B01, B04, B06, B09 · Additions beyond FINDINGS that are not marked as additions

- B01-REQ-05's `nosniff` on every file response goes beyond R-04's fix (CSP on SVG). It is the same
  defect class (files opened as pages); mark it as hardening.
- B09-REQ-01.5's timing targets (100, 250 and 50 ms) and sizes (2,000 blocks, 5,000 tokens) are
  unsourced. B09-Q2 flags them, but they sit in R-25's proof row. State that R-25 closes on the
  behavioural rules 1 to 4, with the timings recorded, not gating.
- B04-REQ-04.1's corpus (subgraphs, `click` and `classDef` lines, long arrows) is wider than R-27.
  Same class; mark it as an extension so a gap there is not read as R-27 failing.
- B06-Q4 recommends extending the lock-out to `components` and `project`. No finding owns this. If
  accepted, record it as added scope with the user's acceptance.

### FID-15 · Minor · B14 · The server environment-path sweep is offered as a doc-only change outside B14's territory

- **Location:** B14-Q1 (:446-454), "touches server files outside B14's territory, so it needs the
  orchestrator's agreement".
- **Issue:** AD 5 gives "R-31 path sweep across all scripts and server env paths" to B14. R-31's text
  covers arguments only, so a doc-only answer is defensible, but the spec should not treat the
  server env paths as another phase's territory.
- **Correction:** keep B14-Q1 as a user choice (resolve or document), and state that B14 owns either
  outcome.

### FID-16 · Minor · B14 · About scrolling cited as R-126

- **Location:** B14 SPEC:41 ("About page scrolling (R-126, B11)") and :354.
- **Correction:** R-127 is About scrolling; R-126 is the Outline twisty.

### FID-17 · Minor · several · Stale ownership and dependency text after AD 1 to 6

These do not lose a finding, but they contradict PLAN and can send a planning session to ask a
question that is already settled: B02-Q1 (lock-out UI: PLAN says B06 renders it) and B02 boundary
flag 3 (B08 "parallel-safe" with B02); B03 "Depends on: none (Wave 1)" (PLAN: B01); B04 "No hard
producer dependency" (PLAN: B03); B05:375-376 and B05-Q4 (`src/api.ts` "unassigned"; PLAN gives the
transport to B05); B06-Q1 (B05-REQ-06 already covers config conflicts) and B06-Q6 (`nav.ts` and the
artifact details form are B06's per AD 5); B07-Q1 to Q4 (partly answered by PLAN's territory text);
B08 Risks "PLAN lists B08 as safe in parallel with B02 to B05"; B12 "Depends on: no producer phase"
(PLAN: after B02); B13 boundary issue 2 (`link-index.ts` is B13's per AD 5); B06:38 and B11:24 call
B07 "recommended" where PLAN makes it a dependency. Correct each to match PLAN, or mark the
question "resolved by PLAN / AD n".

## Not raised (checked and found sound)

- Every Medium finding has an unconditional requirement and proof in its owner spec (apart from the
  FIDs above). None is made optional: decisions such as D-04, D-07 and D-08 choose the means, while
  each spec keeps an unconditional outcome floor (for example B12-REQ-02 and B05-REQ-02).
- Proposed fixes are treated as candidates, not mandates, consistently with PLAN Sources and Step 3.
  Required safety rules are mandatory where they should be (B01-REQ-01, B14-REQ-01.1 and .2,
  B13-REQ-01, B14-REQ-10.5).
- Additions recorded in PROGRESS "Discovered for later" and taken into scope (`deleteLane`,
  out-of-order layout saves, the StrictMode double load) are marked in their specs.
- Where a better fix is noted in FINDINGS (R-04 `fs.deny`, R-07 version scoping, R-25 trimming
  inside `lcsPairs`, R-37 Document API), the specs keep it available and do not contradict the
  verifier evidence.

## Per-spec correction list (for routing)

| Spec | Corrections |
|---|---|
| B01 | FID-13 (take REPO_ROOT case into PR-07, or hand it to B03 explicitly); FID-14 (mark `nosniff` as hardening) |
| B02 | FID-03 (limit REQ-05 and the R-07 proof to the board half; resolve B02-Q2); FID-04 (add A-2 adjudication and fix); FID-12 (R-01(c) wording); FID-17 (B02-Q1, flag 3) |
| B03 | FID-06 (Freeform cycle members into REQ-02 with proof; resolve Q1, Q4, Q6 and collision 6 per PLAN); FID-13 (if B03 keeps the REPO_ROOT case); FID-17 (Depends on B01) |
| B04 | FID-14 (mark the mermaid corpus extension); FID-17 (Depends on B03); accept B03's cycle check under FID-06 |
| B05 | FID-02 (wire the store's lane rename and removal, with proof); FID-07 (consume B08's deletion bound; resolve B05-Q1; fix sequencing text); FID-17 (`src/api.ts`, B05-Q4) |
| B06 | FID-11 (R-42 proof); FID-14 (mark B06-Q4 as added scope if accepted); FID-17 (B06-Q1, Q6, B07 dependency) |
| B07 | FID-01 (own D-10: requirement, decision entry, proof); FID-02 (consume B05's rewired lane rename); FID-17 (B07-Q1 to Q4) |
| B08 | FID-07 (provide and prove the deletion bound; reword REQ-10.4; resolve B08-Q4); FID-17 (parallel-safety text) |
| B09 | FID-01 (REQ-13 consumes D-10; resolve B09-Q1; add B07 to Depends on); FID-14 (timings non-gating) |
| B10 | FID-01 (REQ-06 consumes D-10; resolve B10-Q1); FID-10 (HistoryView `Shot` label into REQ-05 with proof; add B07 to Depends on) |
| B11 | FID-02 (lane merge builds on B05's wired rename: wording only); FID-06 (drop the Freeform assumption once B03 owns it); FID-17 (B07 dependency) |
| B12 | FID-03 (new REQ for R-07's plan-tool half, proof, Excludes fix, Depends on B02); FID-04 (A-4 and A-10 adjudicate and fix; remove B12-Q5); FID-05 (tool tests in `verify`, deny terms and starter placeholders, R-139 in `capture.ts`; remove Q1, Q2, Q4); FID-08 (R-139 closure and proof); FID-09 (fail-before clause) |
| B13 | FID-09 (fail-before clause); FID-17 (`link-index.ts` is B13's) |
| B14 | FID-05 (REQ-03.4 becomes verify); FID-15 (env-path ownership wording); FID-16 (R-127) |
| B15 | FID-01 (REQ-09: D-01 to D-10); FID-04 (REQ-10 to -12 confirm the owners' verdicts; remove B15-Q1) |
