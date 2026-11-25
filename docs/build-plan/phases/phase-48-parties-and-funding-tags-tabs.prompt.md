Please run build plan Phase 48 (The Parties and Funding tags tabs) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane B of the build lanes (docs/build-plan/LANES.md). If this session is not the Lane B session inside its worktree (branch lane/b), stop and tell me to paste docs/build-plan/lanes/lane-b.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 session). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Hold to these above all:
- One count, one URL: every Party, tag and hospital count comes from the pure `partyContracts.ts` and counts Active office Contracts only (no Fixed price fallbacks, no Disabled); one `contractsCatalogueLink` opens the catalogue on the holder grouping narrowed by the tag, and each count equals the rows the catalogue then lists.
- Funding tag order, funder, audited changes and the remove refusal must not regress; Party rules stay in `partyRefusal`, edits go through `editParty` on 45's Card editing variant, and the Party form fields exist once (`PartyFormFields`, shared by the Details card and the create panel).
- The Contract's id keys its page, never the AA code; the three Master data views leave `masterViews.ts`, `view.ts` and `MasterData.tsx`, and every old `?view=parties`, `insurers`, `organisations`, `fundingTags` and `&party=` link redirects (replace, no loop).
- `MasterHeader` and `LoadResultBanner` take the seeded sheet list explicitly; Seed load and Go-live load stay in Master data and still load the contracts, priceRanges, parties and fundingTags sheets, their copy naming the Contracts section.
- Move files with `mv`, never `git mv`; never touch the capture recipes, ATLAS or the demo guide; no seed change, so no `PERSIST_VERSION` bump.

Phase goal: Parties and Funding tags become tabs of the Contracts section at /admin/contracts/parties and /admin/contracts/tags. Parties are grouped by kind with Contract-less ones included, each Party has a page (details edited in place, its Contracts counted by funding tag, No tag included, each count opening the catalogue), and the tags tab keeps the ordered list while picking a tag shows its Contracts grouped by hospital with counts. The three views leave Master data, which shows a one-line pointer, with the old links redirecting and the sample-sheet triggers re-pointed to the tabs.
