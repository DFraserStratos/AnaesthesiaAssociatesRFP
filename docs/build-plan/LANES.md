# Build lanes: the Finances section, Phases 58 to 67, in Waves 4 and 5

The owner's decisions of 26 November 2026. The Admin app's Finances section (US-13.3.3 and the stories
under it) is built in **lanes**: each lane is its own git worktree, branch and dev-server ports, run by
its own Claude session. The work is cut into **waves**. In a wave, each lane works through a short queue
of phases; when the wave's lanes have finished, one session **joins** them on a wave branch, checks the
joined code and fast-forwards `master`. The next wave starts from `master`.

- **Wave 4** lays the groundwork in two lanes: Lane A builds the section shell (58: the nav entry and
  badge, the six routed tabs, the record routes, every redirect and link, the tab counts, every demo
  trigger re-homed, and today's panels moved unchanged into their tabs); Lane B builds the read models
  the Billing and Invoices tabs stand on (59: pure domain, no screen).
- **Wave 5** builds the six tabs and the record pages side by side in three lanes, each in its own tab
  and record files.

Waves 1 to 3 (Phases 46 to 57, the Contracts and People sections) were built in these lanes on
25 November 2026 and joined onto `master` (Wave 1 at 449fea69, Waves 2 and 3 on `wave/2` and `wave/3`);
their records are their `PROGRESS.md` entries and `TEST-45-49.md` and `TEST-50-57.md`. The worktrees
and branches were torn down after Wave 3; "Setting up the lanes" makes them again.

**Test once, at the very end** (owner, 26 Nov 2026: speed first; this is a prototype). This overrides
the run-build-phase skill's gate, review, screen-proof and checklist steps, ROADMAP's per-phase owner
test, the phase docs' checklists and CLAUDE.md's "full gate before merging a branch", for 58 to 67:

- **A phase** finishes on the quick checks only: `node
  requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --changed` plus `npm run lint` in
  `aa-prototype/` (about a minute). It skips the adversarial review, the screen-proof against the design
  and the manual test checklist run. Assume the work is good enough and move on.
- **Wave 4's join** merges, runs the same quick checks on the merged code, fixes what they find, and
  fast-forwards `master`. No full gate, no review, no owner test.
- **Wave 5's join is the only full gate:** `phase-check.mjs` without `--changed` (both builds, all of
  Vitest, verify-board, all of Playwright) plus lint, one review of all ten phases, fixes, the merge to
  `master`, and one owner test sheet for the whole Finances build, `docs/build-plan/TEST-58-67.md`.

The owner runs the lanes from two Claude accounts (`claude` and `claude2`), so the sessions never talk to
each other through Claude: everything they share goes through git and a folder in the shared git
directory, described below.

**This file overrides** the phase's kick-off prompt, the run-build-phase skill and CLAUDE.md wherever they
differ, for a lane session only.

**Use subagents as much as possible** (owner, 26 Nov 2026). A lane session sends parallel subagents to
read code and requirements, to build independent pieces of a phase (one per panel, file or tab part,
each told exactly which files are its own), and, at the final join, to review. The session keeps its own
context for decisions, for the parts that need the whole picture, and for joining the pieces.

## The lanes

| | Lane A | Lane B | Lane C |
|---|---|---|---|
| Worktree | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneA` | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneB` | `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-laneC` |
| Branch | `lane/a` | `lane/b` | `lane/c` |
| Ports (prototype, PWA, board) | 5273, 5274, 5280 | 5373, 5374, 5380 | 5473, 5474, 5480 |
| Usually run by | `claude` | `claude2` | either |
| Wave 4 theme | the section shell (58) | the read models (59) | idle |
| Wave 5 theme | Billing, then Xero (60, 61) | Invoices, the invoice and credit note pages, then AA fees (62, 63, 67) | Ledger, the anaesthetist's account, then Payments (64, 65, 66) |

- The main checkout (`/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP`, branch
  `master`) is the owner's. Its servers hold 5173, 5174 and 5180. A lane never edits, builds or runs
  anything there. The exceptions are "Setting up the lanes" (Lane A's first session, before it enters
  its worktree) and the fast-forward at a join, each a few git commands.
- A lane belongs to its worktree, not to an account. Any account can resume any lane: all the state is
  in the worktree and in git.
- Each worktree holds a git-ignored `.lane.env` at its root (`LANE`, `AA_PROTO_PORT`, `AA_PWA_PORT`,
  `BOARD_PORT`). `aa-prototype/laneEnv.ts` (imported by both Vite configs and the Playwright config), the
  board's `server/laneEnv.ts`, `phase-check.mjs` and the capture runner read it themselves, filling any
  variable not already set. So `npm run dev`, `npm run shots` and `phase-check` all run on the lane's own
  ports however the session was started. If `.lane.env` is missing, stop and tell the owner.
- **A session can start anywhere.** The owner usually starts every session in the main checkout. The
  lane prompt has the session switch into its worktree with the `EnterWorktree` tool (`path`, never
  `name`) before doing anything else.
- If the worktree has no `node_modules` (in `aa-prototype/`, `requirements-board/` or the root), run
  `npm run setup` from the worktree root first. `git status` must stay clean afterwards; if it does not,
  stop and tell the owner.

## Setting up the lanes

Only Lane A's session does this, once, at the start of Wave 4, from the main checkout, before it enters
its worktree. Lane B's and Lane C's sessions never set up: if their worktree does not exist, they stop
and tell the owner "Paste Lane A's prompt first: it sets the lanes up."

1. `git worktree list` shows no `-laneA` worktree (if it does, the lanes exist: skip this section).
2. The main checkout is on `master` with no tracked changes (`git status --porcelain
   --untracked-files=no` empty), and `master` holds this file as it is now. Otherwise stop and tell the
   owner to commit first.
3. Start the coordination folder afresh: if `"$(git rev-parse --git-common-dir)/lanes/"` exists, rename
   its `notes.md` to `notes-waves-1-3.md` and delete its `*.status` files.
4. Run, from the main checkout:

   ```
   bash "/Users/d.fraser/Development/Stratos Dev/skills/worktree-lanes/scripts/setup-lanes.sh" \
     --vars AA_PROTO_PORT,AA_PWA_PORT,BOARD_PORT \
     --lane A=5273,5274,5280 --lane B=5373,5374,5380 --lane C=5473,5474,5480
   ```

   It makes the three worktrees and branches from `master`, each `.lane.env`, the status files (at
   `ready`) and a fresh `notes.md`. If a `lane/a`, `lane/b` or `lane/c` branch already exists, stop and
   tell the owner.
5. Write `C.status` as `waiting Wave 4` (Lane C has nothing in Wave 4). Then carry on with the lane
   prompt: enter Lane A's worktree and run `npm run setup` there.

## Waves

Each lane runs its queue in order, one phase at a time. A phase is **complete on a lane** when the lane
branch holds a commit whose subject starts `<id> complete:`. A wave **starts** when its start condition
holds on `master` (and so, after step 2 below, on your branch). A wave is **on `master`** when every
phase in it is DONE in `master`'s `docs/build-plan/PROGRESS.md`.

### Current wave: Wave 5 (Wave 4 joined 2026-11-26)

| Wave | Starts when | Lane A | Lane B | Lane C | Joined on | Checks at the join | Owner test after it |
|---|---|---|---|---|---|---|---|
| 4 | this plan is committed on `master` | 58 | 59 | (none) | `wave/4` | quick checks only | none |
| 5 | 58 and 59 are on `master` | 60, then 61 | 62, then 63, then 67 | 64, then 65, then 66 | `wave/5` | the full gate and the review | 58 to 67, from `TEST-58-67.md` |

Sessions: 58 1 to 2; 59 1; 60 1 to 2; 61 1; 62 1; 63 1; 64 1; 65 1; 66 1; 67 1.

(Waves 1 to 3 are in the record above; their rows are gone from this table, so a lane never finds a
phase of theirs left to build.)

**Why this split.**
- Wave 4: 58 owns every shared shell file (router, side nav, `AdminApp`, `routes.tsx`, the redirects,
  the demo trigger registry, in-app links), so it goes first and alone among the screen phases. 59 is
  pure domain in new files, so it runs beside 58 with nothing to merge but barrels.
- Wave 5: once 58 has given each tab its own file and 59 its read models, every tab is a separate set
  of files. Lane A takes Billing and Xero (the old Billing monitor's pipeline and its Xero panels, and
  the one shared-table change). Lane B takes everything about invoices (the list, the invoice and credit
  note pages) and then AA fees (AA's own invoices). Lane C takes the money held and paid out: the
  Ledger, the anaesthetist's account page (which shares the Ledger's components) and the Payments tab
  with its run pages. Within a lane, 61 follows 60, 63 follows 62, and 65 follows 64 because they share
  files; 67 and 66 are last in their lanes only to balance the queues.

### The file contract 58 sets up

58 gives every tab and record its own file, so Wave 5's lanes never meet in a file. The phase doc may
refine the names; whatever 58 ships, it writes in `notes.md` and its PROGRESS entry, and Wave 5 follows
that.

- `aa-prototype/src/apps/admin/screens/finances/`: the section frame (`FinancesSection.tsx` or as named:
  `AdminPage` with the title, the `LineTabs` strip and the counts), `financePaths.ts` (every
  `/admin/finances/...` link goes through it), `financeCounts.ts` (each tab's "needs doing" count and
  the nav badge), and one file per tab: `BillingTab.tsx`, `InvoicesTab.tsx`, `PaymentsTab.tsx`,
  `LedgerTab.tsx`, `XeroTab.tsx`, `AaFeesTab.tsx`. At 58's end each tab file hosts today's panels, moved
  unchanged (the mock's `#moves` table).
- Each record route renders a component in its own file in `screens/finances/`, never a body in
  `routes.tsx` or `router.tsx`: `InvoicePage.tsx` (wraps `InvoiceDocument.tsx`), `CreditNotePage.tsx`,
  `PaymentRunPage.tsx` and `RemittancePage.tsx` (wrap `PaymentRunScreen.tsx`) and
  `AnaesthetistAccountPage.tsx` (renders the one-anaesthetist Ledger view). 63, 65 and 66 rebuild their
  pages inside these files, so no Wave 5 phase edits a route file.

### Who owns what in Wave 4

| | Owns |
|---|---|
| Lane A (58) | `router.tsx` (the new Finances block and every old-URL redirect), `SideNav.tsx` (the entry and its amber badge), `AdminApp.tsx`, `apps/admin/routes.tsx`, the new `screens/finances/` folder, the split of `BillingMonitorScreen.tsx` into its homes, the moves of `InvoicesScreen.tsx`, `LedgerScreen.tsx`, `AaFeesScreen.tsx` and `PaymentRunScreen.tsx` under their tabs, every in-app link to the old URLs (Admin Day, Review queue, rails, dashboards, Xero simulator links), `shared/demoTriggers/registry.ts` (every trigger re-homed), `shared/demoTriggers/context.ts` (the `adminFinances.tab` key), `shared/procedureEventCopy.ts` (copy naming gone screens), `apps/demo/DemoControlPanel.tsx`, `apps/demo/demoScenarios.ts`, `apps/demo/catalogue/` rows, the link-only edits in what become Wave 5 files (`XeroPanels.tsx`, `PaymentCyclePanel.tsx`, `HoldingAccountPanel.tsx`, `LedgerPaymentRuns.tsx`, `ReconciliationCard.tsx`, `InvoiceDocument.tsx`; Wave 4 is over before Wave 5 starts) and the Playwright specs whose URLs move |
| Lane B (59) | New files only in `aa-prototype/src/domain/billing/` (the Booking and List billing status with its reason-and-fix vocabulary, including the new no-address `BillingException` code (D116); the invoice state, owing, kind and search keys; the problem-List count) with their Vitest tests, their lines in `domain/billing/index.ts`, and two optional fields on `BillingException` in `domain/types.ts` (`resolvedBy`, `resolvedNote`) |

- **Where they meet:** nowhere: 58 adds nothing under `domain/billing/` and leaves `domain/types.ts` to
  59. 58 counts the Billing tab's problem Lists with today's `billingAttentionCount`; Wave 5's 60
  re-points that count to 59's model. Neither lane edits the other's files.

### Who owns what in Wave 5

| | Owns |
|---|---|
| Lane A | 60: `screens/finances/BillingTab.tsx` and what is left of `BillingMonitorScreen.tsx` and its components, `GroupRow` in `shared/table/cells.tsx` (additive: the List's counts on `level="sub"`; `68229e4e` already gave `Td` a `rowSpan` there) and its catalogue row, the Billing count and the badge's billing part in `financeCounts.ts`, the new audited store actions behind Retry, Fix the payer and Mark resolved, and the one billing-run change (D116: `store/billingRun.ts`, `store/invoiceMaterialise.ts`, `billingRun.test.ts`'s no-address cases). It re-checks the other `noAddress` readers but edits none in another lane's files (`InvoiceDocument.tsx` is Lane B's; note any change needed there for the join). It writes the "Payer loses billing email" trigger's body for the join to register. 61: `screens/finances/XeroTab.tsx`, `components/XeroPanels.tsx` and its test, new `screens/finances/xeroTabRows.ts` and its test. Also new in 60: `screens/finances/billingTabState.ts`, `store/billingFix.ts` (with tests; exports on the `store/index.ts` barrel) and `shared/demoTriggers/payerLosesBillingEmail.ts` (the trigger body, registered by the join), and a one-line comment edit to `domain/billing/invoicePresentation.ts` |
| Lane B | 62: `screens/finances/InvoicesTab.tsx`, `InvoicesScreen.tsx`, `PrepaymentApprovalStrip.tsx` and their tests. 63: `InvoiceDocument.tsx` and its rail, the credit note page. 67: `screens/finances/AaFeesTab.tsx`, `AaFeesScreen.tsx` and its test, new `screens/aaFeeRows.ts` and its test. 62 also adds `screens/invoiceListRows.ts` and its test. 63 builds the pages in 58's `screens/finances/InvoicePage.tsx` and `CreditNotePage.tsx` |
| Lane C | 64: `screens/finances/LedgerTab.tsx`, `LedgerScreen.tsx`, `HoldingAccountPanel.tsx`, the Ledger's use of `ReconciliationCard.tsx` (the Admin Day dashboard's use stays as it is). 65: the anaesthetist's account page (58's `screens/finances/AnaesthetistAccountPage.tsx`, new `AccountPairs.tsx`), `LedgerPaymentRuns.tsx`, and `LedgerScreen.tsx` (same lane as 64). 64 also adds `LedgerRail.tsx`, `LedgerReceiptDialogs.tsx`, `LedgerLists.tsx`, `domain/billing/ledgerLists.ts` and `store/ledgerListSelectors.ts` (with tests and barrel lines). 66: `screens/finances/PaymentsTab.tsx`, `PaymentCyclePanel.tsx`, `PaymentRunScreen.tsx`, 58's `PaymentRunPage.tsx` and `RemittancePage.tsx`, new `PaymentRunsTable.tsx`, `EventsAwaitingRun.tsx`, `components/paymentCycleSteps.ts`, and (only for the freeze fix) `store/xeroSimActions.ts`, `store/payablesActions.ts`, `domain/billing/payablesRun.ts`, which no other lane edits |

- **No Wave 5 phase edits** `router.tsx`, `SideNav.tsx`, `AdminApp.tsx`, `routes.tsx`, the redirects,
  `financePaths.ts` or `shared/demoTriggers/registry.ts`: 58 placed every route, link and trigger. If a
  phase needs a change there, it notes it in `notes.md` and under "For the merge", and the Wave 5 join
  makes it.
- **`financeCounts.ts`:** Lane A changes only the Billing count; a lane that finds its own tab's count
  wrong notes it for the join.
- **Files every lane may add to:** `domain/types.ts`, `domain/billing/index.ts`, `store/index.ts`,
  `shared/format.ts`, `shared/audit/` label maps, `src/apps/demo/catalogue/AdminCatalogue.tsx` and its
  example files, the Playwright specs in `aa-prototype/visual/` (change only your own steps and cases),
  `docs/build-plan/PROGRESS.md`, `docs/DECISIONS.md` and `docs/BACKLOG.md`. Add your own lines, rows,
  exports, tests and entries. Never rewrite, sort or re-wrap what is already there.
- If your work seems to need another lane's side, don't build it there. Note it under "For the merge"
  in your progress entry, and in `notes.md`.

## How a lane session runs

The owner pastes the same lane prompt every time (in `lanes/`). The session then does this.

1. **Check where you are.** After the lane prompt's `EnterWorktree` switch, `pwd` is your lane's
   worktree and `git branch --show-current` is your lane branch, or `wave/<n>` if you are the session
   doing a join. Otherwise stop and tell the owner. `cat .lane.env` shows your ports.
2. **Pick up `master`.** With a clean tree (no uncommitted changes to tracked files), run
   `git merge master`. Then re-read this file: the merge may have changed it. Skip this step with a dirty
   tree (a phase stopped mid-way: you are resuming it).
3. **Which wave is yours?** It is the first wave in the table whose queue for your lane holds a phase
   with no `<id> complete:` commit on your branch and not DONE in your branch's `PROGRESS.md` (none for
   your lane in that wave: look at the next).
   - If no wave has a phase left for your lane, this lane has finished: write `done` in your status file
     and tell the owner "Lane <X> has finished every wave."
   - If that wave's start condition does not hold in your branch's `PROGRESS.md` (after step 2), stop.
     Write `waiting <condition>` in your status file and tell the owner: "Lane <X> is waiting for
     <condition> on master. Paste this lane's prompt again once it is."
4. **Read the lane state.** Read `"$(git rev-parse --git-common-dir)/lanes/"`: every status file and
   `notes.md` (not `notes-waves-1-3.md`). Read `git log --oneline master..lane/a`, `master..lane/b` and
   `master..lane/c`.
5. **Find your phase.** It is the first phase in your lane's queue for that wave that has no
   `<id> complete:` commit on your branch.
   - If every phase in your queue for the wave is complete, go to "Joining a wave".
   - If the phase has `<id> checkpoint:` commits or uncommitted work in the worktree, you are resuming:
     the skill's resume path (Stage 0) applies.
   - Check every id in the phase's `depends_on` (in `docs/build-plan/plan.json`). Each must be DONE in
     your branch's `PROGRESS.md`, or complete earlier in your own lane. If one is neither, stop: write
     `blocked <id>` in your status file and tell the owner.
6. **Sync with the other lanes, at a phase start only.** For each other lane: if it has an
   `<id> complete:` commit of the current wave your branch does not hold, merge it
   (`git merge <that commit>`) and resolve by "Resolving conflicts". Then make
   `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --only typecheck` green
   before you start. Never merge another lane mid-phase, and never merge its work in progress.
7. **Build the phase.** Open its kick-off prompt (`docs/build-plan/phases/phase-<id>-*.prompt.md`) and
   follow it as if the owner had pasted it: load the run-build-phase skill and run its stages, with the
   overrides below. Write `started` in your status file.

### Overrides for a lane session

- **Where:** only in your worktree, every path from its root. Never in the main checkout or in another
  lane's worktree.
- **Subagents, as much as possible:** parallel subagents for reading (the code a phase moves, the
  stories, the mock's sections), for independent pieces of the build (each given its own files and the
  shared components to use), and for any review the join runs. Keep decisions and joining in your own
  context.
- **Commits are part of the job.** Commit on your lane branch only, staging by path (`git add <paths>`,
  never `-A` or `.`).
  - At a two-session phase's checkpoint, once the quick checks are green: commit with the subject
    `<id> checkpoint: ...`.
  - When the phase is finished (built, quick checks green, `PROGRESS.md` updated): commit with the
    subject `<id> complete: ...`. End the message with the attribution lines your session is given, if
    any.
  - Never push. Never amend, rebase or reset a commit another lane or the owner made. Never delete a
    branch or a worktree.
- **Quick checks only; test once at the very end** (owner, 26 Nov 2026). In the run-build-phase skill:
  - Your gate, at a checkpoint and at the end, is
    `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --changed` (typecheck,
    the Vitest tests related to your changes, the catalogue check) plus `npm run lint` in
    `aa-prototype/`, both green.
  - Never run the full Vitest suite, either build, verify-board or the Playwright suite, whatever the
    phase doc's checklist or the skill says. Update the Playwright specs your phase moves (URLs, hooks)
    so they would pass, but don't run them: Wave 5's join runs everything. Note any test you suspect
    breaks under "For the merge".
  - Skip the Stage 4 screen-proof against the design and the manual test checklist run, and the Stage 5
    adversarial review. Wave 5's join reviews all ten phases at once, with each phase doc's review
    steer bullets, and walks the checklists for the owner's test sheet.
  - Assume the work is good enough: if it typechecks, lints and its own tests pass, commit and move on.
- **No owner test between phases or waves.** Build your next phase straight after the last one's
  `complete:` commit, in the same session if it has room or the next one. Put everything for the owner
  on the phase's "For the owner's review" list as usual.
- **Ports:** your lane's own. Never stop a server you didn't start. Run
  `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --stop-servers` at the
  end if you started any.
- **Screenshots, recipes, ATLAS and the demo guide:** don't touch them and never run the capture, even
  `--dry`. The owner's sweep re-points them (about 76 recipes, the guide's "Billing monitor" mentions and
  S3 Beats 6 and 7). Keep `demoGuideSync.test.ts` green. Generated Playwright output under
  `aa-prototype/visual/.output` is never committed.
- **The plan page is the join's job.** Skip the skill's Stage 7 edits to `status.json` and
  `index.html`, and don't change ROADMAP's run order. Write your status file instead. Your final message
  to the owner ends `Next: <the next phase in this lane's queue>`, or `this lane has finished Wave <n>`.
- **`PERSIST_VERSION`:** no phase of 58 to 67 expects to bump it (no seed change). If one must, set it
  one past the higher of any other lane's bump, and write it in `notes.md`.
- **Your memory doesn't carry over.** Claude's memory is kept per account and per folder, so a worktree
  session starts without the owner's saved rules. The rules that matter are in this file, the phase
  doc, the skill and CLAUDE.md.

### Talking to the other lanes

Everything goes through `"$(git rev-parse --git-common-dir)/lanes/"`. That is the main checkout's
`.git/lanes/`, visible from every worktree and never committed.

- **`A.status`, `B.status` and `C.status`:** one line, overwritten at each change:
  `<date +'%F %T'> <phase> <started|checkpoint|complete|wave-done|waiting|blocked|joining|joined|done> <a few words>`.
- **`notes.md`:** append-only, newest at the bottom. Head each entry `## <date> Lane <X>, <phase>`.
  Write what the other lanes need before they merge your work:
  - the commit id of your `complete:`
  - 58: the file contract as shipped (the section folder's file names, `financePaths.ts`'s helpers,
    `financeCounts.ts`'s exports, the screen names the triggers now bind to, every route)
  - 59: the read models' exports and what each returns
  - renamed or removed types, fields, exports, helpers or `data-shot` hooks
  - shared components or props you added (60's `GroupRow` counts)
  - a route, link or trigger change you need from the join
  - tests the other lanes will see fail, and shared files you touched

  Read it at every phase start (step 4).
- Never wait or poll for another lane. If you need something from one, write it in `notes.md` and carry
  on, or stop as `blocked` and tell the owner.

## Joining a wave

When your last phase in the wave is complete, write `wave-done` in your status file. The last lane of
the wave to finish joins. Look for the other lanes' last phases of the wave (`git log lane/<y>
--grep='^<id> complete:' --oneline`): Wave 4, `58` on `lane/a` and `59` on `lane/b`; Wave 5, `61` on
`lane/a`, `67` on `lane/b` and `66` on `lane/c`.

- **Not all there: you finished first.** Stop. Tell the owner: "Lane <X> finished Wave <n>, on
  `lane/<x>`. The last lane to finish does the join." Do not wait or poll.
- **All there: you join.** Claim it with `git branch wave/<n> lane/<x>`. If that fails because the
  branch exists, another session is already joining: stop as above. Otherwise write `joining` in your
  status file, `git switch wave/<n>`, merge each other lane branch of the wave one at a time (resolving
  by "Resolving conflicts"), then `git merge master` if `master` has moved since the wave began.

Then run the checks for your wave, write it up and fast-forward `master`.

### Checking Wave 4's join: quick checks only

- The quick checks over the merged code (after the merge commit there is nothing uncommitted, so
  `--changed` alone would test nothing): `node
  requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --only typecheck`, then in
  `aa-prototype/` `npx vitest run --changed master` (the tests related to everything the wave changed)
  and `npm run lint`, all green. Fix what they find.
- One look in the running app on your ports that `/admin/finances` opens on Billing with six tabs, and
  that `/admin/billing` redirects. Nothing more: no full gate, no review.

### Checking Wave 5's join: the full gate, once

This is the one full test of the Finances build.

- **The full gate, all green:**
  `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs` (typecheck, both builds,
  all of Vitest, verify-board, all Playwright) and `npm run lint` in `aa-prototype/`. No lane ran the
  heavy checks, so fix any failure from any of 58 to 67 here, then re-run the gate. `master`'s
  Playwright suite carried known failures from before 45 (`docs/BACKLOG.md`): don't count those as the
  wave's, but don't add to them.
- Seed pins, fingerprints and count tests are re-measured on the joined code, never added up.
- No hook was lost: `git diff <the commit before Wave 4>...HEAD -- aa-prototype | grep '^-.*data-'`,
  and account for every line (about 60 `data-shot` hooks moved with their elements).
- **The routes and joins the join makes:** any route, link, trigger or count change a lane noted in
  `notes.md` or under "For the merge".
- **In the running app on your ports, check where the lanes meet:**
  - The nav: one Finances entry with one amber badge (billing problems plus failed ledger checks),
    never crimson; Invoices, Billing monitor and Ledger are gone from the nav.
  - Six tabs, each with its own URL, opening on Billing; each tab's count counts only what needs
    doing (Billing problem Lists, Invoices prepayments to approve, Ledger checks failed, Xero alerts and
    divergences; Payments and AA fees none). Contracts' and People's tabs still count what they list.
  - Every old URL redirects with replace (`/admin/invoices`, `/admin/invoices/:id`,
    `/admin/credit-notes/:id`, `/admin/billing`, `/admin/billing/aa-fees`, `.../aa-fees/settings`,
    `/admin/billing/payment-runs/:runId` and its remittance, `/admin/ledger`,
    `/admin/ledger/anaesthetists/:id`), and Back does not loop.
  - Each record page opens from its tab's row and goes back to it: an invoice, a credit note, a payment
    run and a remittance, an anaesthetist's account.
  - Billing opens on Problems; a List awaiting approval opens the Review queue, never approves here.
    Xero's Retry and Resolve, the Ledger's Allocate and Mark refunded, the Payments cycle and Run
    payables, the AA fee run and settings all still work, each from its one home.
  - Every demo trigger 58 re-homed shows on its one screen only.
  - The BACKLOG lines the split was meant to help: the Billing page height, Run payables' freeze and the
    Ledger's open time. Note what changed in BACKLOG.
- **The review, once for all ten phases.** Three Opus subagents (`model: opus`), read-only, over the
  diff since the commit before Wave 4, one per lens: bugs and correctness (guards, audit, determinism,
  the redirects, the counts, money moved between tabs without a store call changed), plan adherence
  (every work item of 58 to 67 delivered), and the joins (one lane's work lost in a conflict, a part
  built twice, a hook dropped, a route or trigger lost, a private copy of a shared component). Give
  each the phase docs' review steer bullets. Ask for findings that would stop something working or
  break a rule in CLAUDE.md, not polish. Verify each finding yourself, fix the confirmed ones, and
  re-run the full gate.

### Writing up a join

- In `docs/build-plan/PROGRESS.md`, under the joined phases' last entry, add a short `Wave <n> joined`
  note: the date, which lanes it took in, each conflict and how it was resolved, the checks run (Wave
  5: the re-measured Vitest and Playwright counts), and anything for the owner.
- **Wave 5's join writes the owner's test sheet,** `docs/build-plan/TEST-58-67.md`, like
  `TEST-50-57.md`: one walk through the app on 5173 covering 58 to 67 in about 20 numbered steps, each
  with where to click, the seed record to use and what should happen. Draw it from the ten phases'
  manual checklists and the join's checks; leave out what a test already proves. End it with "Decisions
  to look at": the ten phases' "For the owner's review" lists merged into one short list, one line
  each. Wave 4's join writes no test sheet.
- **Mark the wave** in this file's "Waves" heading: "Current wave: Wave 5 (Wave 4 joined <date>)", or
  after Wave 5: "Current wave: none (Wave 5 joined <date>)".
- **Update the plan page:** in `docs/build-plan/status.json`, add every joined phase to `done`, keep
  `in_progress` to phases still building, set `next` to the next wave's phases, and set `guidance.lanes`
  to the next wave's queues (remove it after Wave 5). Keep the Intake lanes' entries (Lanes D to G, LANES-INTAKE.md) in
  `guidance.lanes`, and their phases (68 to 72) out of `done`: they are another build. Write a `headline` saying what is on `master` and,
  after Wave 5, for the owner's test, with `headline_sub` linking `TEST-58-67.md`. Then
  `node requirements-board/agent/skills/update-build-plan/tools/build-index.mjs` from the worktree root,
  which must print no warnings.
- Commit with the subject `Wave <n> joined: ...`.

### Fast-forwarding `master`

1. `git -C "/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP" merge --ff-only <your wave branch>`.
   Git refuses rather than touch the owner's uncommitted changes.
   - If it refuses because `master` moved: merge `master` into your wave branch, re-run the checks of
     your wave (Wave 4: the quick checks; Wave 5: `phase-check.mjs --only
     typecheck,build,build-pwa,vitest,verify-board`), commit, and try again.
   - If it refuses because of the owner's uncommitted changes, stop. Tell the owner the exact command to
     run once they have committed.
   - If this session isn't allowed to write to the main checkout (a session that entered its worktree
     with `EnterWorktree` usually isn't), don't keep trying. Write
     `joined, master fast-forward pending the owner` in every status file and stop. Tell the owner to
     paste this into a Claude session in the main folder: "Finish the Wave <n> join: fast-forward master
     to <your wave branch> as docs/build-plan/LANES.md's 'Fast-forwarding master' says (merging master
     into it first if it moved), then bring the lane branches up to master as its step 2 says."
2. **Bring your own lane branch up:** `git switch lane/<x>` then `git merge --ff-only master`. The other
   lanes pick `master` up at their next start (step 2 of "How a lane session runs"). From the main
   folder, a lane branch checked out in a clean worktree is brought up with
   `git -C <worktree> merge --ff-only master`.
3. Write `joined` in every status file of a lane this join took in, and append a `notes.md` entry naming
   the wave branch, the phases it took in and the next wave's queues. Tell the owner what `master` now
   holds (not pushed) and:
   - after Wave 4's join: to paste all three lane prompts for Wave 5;
   - after Wave 5's: that 58 to 67 are ready to test on 5173 from `docs/build-plan/TEST-58-67.md`, and
     to paste into a main-folder session: "Tear down the build lanes as docs/build-plan/LANES.md's Tear
     down section says."

### Resolving conflicts

This applies at a sync (step 6) and at a join.

- **A file only one lane owns** shouldn't conflict. If it does, keep the owning lane's version and
  re-apply the other side's lines by hand, checked against that phase's work items.
- **Imports, index exports, the store barrel, the billing barrel, the audit labels, the catalogue
  rows:** take the union, with no duplicates.
- **`types.ts`:** keep every lane's additions. If two touched one type, keep every set of fields.
- **The Finances route block, `financePaths.ts`, `financeCounts.ts`, the demo trigger registry:** 58's
  version, plus the changes lanes noted for the join.
- **`PERSIST_VERSION`:** one past the higher number, with every comment line and every migrate case.
- **Tests and specs:** keep every lane's tests. Where two changed one assertion, make it hold for the
  joined behaviour.
- **`PROGRESS.md`:** every status row and every entry, in phase order. Keep every Decisions-log line and
  handoff list.
- **`docs/DECISIONS.md` and `docs/BACKLOG.md`:** take the union. Where order is free, Lane A's comes
  first, then B's, then C's.
- **A hook** (`shot`, `data-shot`, `data-testid`, a row `data-*`): if any side kept it, it stays.
- **`status.json` and `index.html`:** take `master`'s, then regenerate at the join. Lanes don't edit
  them.
- **Never** resolve by taking one side's whole file, and never drop one lane's work to make a conflict go
  away. If a conflict can't be resolved without changing what another lane built, resolve it the
  smallest way that keeps both behaviours, and log it under "For the owner's review".

## Tear down

Only after Wave 5's join, from a session in the main folder, once `master` holds `wave/5`
(`git branch --contains wave/5` lists `master`):

1. Check every worktree is clean (`git -C <worktree> status --short` empty). If one isn't, stop and tell
   the owner.
2. `git worktree remove` each lane's worktree.
3. `git branch -d lane/a lane/b lane/c wave/4 wave/5` (`-d` refuses an unmerged branch: if it does, stop
   and tell the owner).
4. Remove `"$(git rev-parse --git-common-dir)/lanes/"`.
5. Mark this file closed with a line at the top ("Closed <date>: Wave 5 joined; later phases run in the
   main folder"), and commit it by path. Leave the port plumbing in place: it is harmless without a
   `.lane.env`.

Don't tear down after Wave 4: the lanes carry on into Wave 5.

## The lane prompts

The prompts are in `lanes/lane-a.prompt.md`, `lanes/lane-b.prompt.md` and `lanes/lane-c.prompt.md`, and
on the plan page (`index.html`, "Start now": a **Copy Lane A prompt**, **Copy Lane B prompt** and **Copy
Lane C prompt** button; each queued phase's card copies its lane's prompt too). The owner pastes each
into its own session, usually started in the main checkout: Lane A's first in Wave 4, since it sets the
lanes up. The same prompt starts, resumes and joins, in every wave: the session works out which. A
phase's own kick-off prompt is what a lane session follows inside its worktree; never paste a lane
phase's own prompt into a session on `master`.

## Another build in lanes beside this one: the Intake rebuild

The Intake rebuild (Phases 68 to 72) runs in its own lanes, D to G, in Waves 6 and 7, from
[LANES-INTAKE.md](LANES-INTAKE.md): its own worktrees (`-laneD` to `-laneG`), branches (`lane/d` to
`lane/g`, `wave/7`), ports (5573 to 5880) and coordination folder (`.git/lanes-intake/`). A Finances
lane session ignores it: it never merges, edits or tears down anything of the Intake build, and the
Intake build never edits a Finances file or lands on `master` before Wave 5 has joined. Intake's
Phase 68 takes `PERSIST_VERSION` to 82 on `lane/d` and says so in this build's `notes.md`; it reaches
`master` only at the Intake join, after Wave 5's.
