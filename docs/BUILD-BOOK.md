# Buildbook

Buildbook is a documentation-driven, restartable framework for long-running AI-assisted software
delivery. It turns a large body of requirements into a sequence of bounded development phases that
can be executed by fresh coding-agent sessions without losing decisions, context, or quality.

The framework is suitable for new products, feature programmes, migrations, refactors, remediation
work, and other projects that are too large or risky for one continuous coding session.

Its central rule is:

> Plan in phases. Challenge every delivery. Carry the verified truth forward.

## 1. The Buildbook model

A Buildbook has four core document types and one mandatory review protocol.

1. **Source-of-truth requirements**
   - Describes what the programme must achieve and why.
   - May be a requirements catalogue, findings report, accepted design, migration brief, or a
     combination of these.
   - Uses stable identifiers where useful so phase documents can cite exact requirements.

2. **Human-facing HTML programme overview**
   - Explains the programme, its boundaries, phase sequence, dependencies, risks, and expected
     outcome.
   - Summarises every phase and links to its detailed contract.
   - Contains a copyable kick-off prompt for every phase.
   - Acts as the control panel for the human directing the work.

3. **One detailed execution contract per phase**
   - Defines the goal, evidence, scope, work breakdown, verification, risks, and completion criteria.
   - Is detailed enough for a fresh coding agent to execute without reconstructing the plan.
   - Divides the phase into small, independently verifiable bites.

4. **Living progress, decisions, and handoff ledger**
   - Records binding conventions, phase status, accepted decisions, deferred discoveries, and what
     each phase actually delivered.
   - Is read first and updated last by every execution session.
   - Describes reality when completed work differs from the original plan.

5. **Mandatory adversarial multi-agent review**
   - Every completed phase is independently reviewed by multiple subagents before it is closed.
   - At minimum, reviewers examine quality, completeness against the plan, and bugs or correctness.
   - The primary agent verifies the findings, fixes confirmed problems, reruns verification, and only
     then records the phase as complete.

Optional review documents can record a pre-execution plan audit, cross-phase conflict analysis,
closing audit, or reviewer response. These are especially useful for high-risk or externally
reviewed programmes.

## 2. Recommended folder structure

Use project-appropriate names, but keep the roles obvious and stable.

```text
docs/
  buildbook/
    REQUIREMENTS.md          # Or FINDINGS.md for audit-led work
    index.html               # Human-facing programme overview and phase launch prompts
    PROGRESS.md              # Shared memory and authoritative execution record
    phases/
      phase-00-....md
      phase-01-....md
      phase-02-....md
    review/                   # Optional plan and closing reviews
      PRE-EXECUTION-REVIEW.md
      CLOSING-REVIEW.md
```

Existing project documents do not need to be copied merely to match this layout. Link to an
authoritative product brief, design system, issue set, or architectural decision record when it
already exists.

## 3. Authority and truth

Buildbook separates intended work from completed reality.

- Requirements define the desired outcome.
- The phase contract defines intended execution.
- The progress ledger records what actually happened.
- The decisions log records accepted interpretations and changes.
- The HTML overview presents the programme but does not override the detailed records.

When documents conflict, follow this order:

1. Current user direction and repository instructions.
2. Accepted decisions recorded in `PROGRESS.md`.
3. Source-of-truth requirements.
4. Completed phase entries describing the live implementation.
5. The current phase contract.
6. Summaries in the HTML overview.

Do not silently resolve a material conflict. Record the conflict, the selected interpretation, who
accepted it, and why. Later sessions should not repeatedly reopen a settled decision unless new
evidence invalidates it.

## 4. Creating a Buildbook

### Step 1: Establish the evidence base

Inspect the current project before proposing phases. Read repository instructions, relevant source
code, tests, designs, requirements, prior decisions, and known defects.

Use subagents extensively for bounded, parallel investigation. Good research assignments include:

- Mapping requirements to existing behaviour.
- Auditing one subsystem or user journey.
- Identifying test and verification gaps.
- Finding cross-cutting dependencies and likely file contention.
- Checking architecture, data, security, accessibility, or operational constraints.

Subagent findings are evidence, not automatic truth. The coordinating agent deduplicates them and
verifies important claims against primary sources and the live project.

The output of this step is a requirements or findings document that clearly distinguishes:

- Required outcomes.
- Current-state facts.
- Accepted constraints.
- Open decisions.
- Explicit exclusions.
- Assumptions that still need validation.

### Step 2: Design the phase programme

Divide the work into coherent phases. Each phase should deliver one understandable outcome and
leave the project in a usable, verifiable state.

A good phase:

- Has a single dominant goal.
- Has explicit prerequisites and consumers.
- Fits within one focused session when practical, or defines safe session-sized chunks.
- Avoids unnecessary overlap with other phases.
- Creates any seam or prerequisite before work that depends on it.
- Names what it will not do.
- Has a credible verification story.
- Can stop after any completed bite without leaving ambiguous half-work.

Do not impose a universal phase sequence. A safety-net phase, visual gate, migration scaffold, or
data-model phase should exist only when the project's evidence says it is needed.

### Step 3: Write each phase contract

Write the detailed phase documents before implementation begins. References to files, symbols,
counts, or current behaviour should be verified against the live project and dated when likely to
drift.

Each phase contract should contain:

```markdown
# Phase NN: Descriptive title

**Status:** PLANNED
**Depends on:** ...
**Unblocks:** ...
**Estimated:** ...
**Risk:** ...

## Objective

The concrete outcome and why it matters.

## Current-state evidence

Verified facts the executor must understand. Include corrections to earlier assumptions.

## Scope

### In scope
- ...

### Out of scope
- ...

## Work breakdown

### Bite 0: Reconfirm the starting point
- Re-read PROGRESS.md.
- Verify named files, seams, and preconditions against the live project.
- Stop and reconcile any material drift.

### Bite 1: First independently shippable change
- Exact work.
- Required tests or checks.
- Expected observable effect, including "none" where relevant.

### Bite 2: Next independently shippable change
- ...

## Verification strategy

- Automated checks appropriate to the project.
- Manual checks for claims automation cannot prove.
- Expected changes and prohibited regressions.

## Adversarial phase review

- Quality review.
- Plan-completeness review.
- Bugs and correctness review.
- Any extra specialist lens justified by the phase risk.

## Acceptance criteria

- [ ] Every in-scope work item is complete.
- [ ] Required automated checks pass.
- [ ] Required manual checks are recorded.
- [ ] Adversarial findings were verified and confirmed issues fixed.
- [ ] Verification was rerun after review fixes.
- [ ] PROGRESS.md reflects the final truth.

## Risks, mitigations, and rollback

1. Risk, consequence, prevention, detection, and recovery.

## PROGRESS.md obligations

The exact facts the closing entry must preserve for future sessions.
```

The work breakdown should describe outcomes and constraints rather than forcing an implementation
that live evidence may disprove. Where a specific implementation seam is load-bearing, say why.

### Step 4: Build the HTML programme overview

The HTML overview should be attractive and easy to scan, but its primary purpose is operational.
It should include:

- Programme purpose and desired end state.
- Starting point and evidence sources.
- Major boundaries and non-goals.
- How to run the Buildbook.
- Phase dependency and sequencing rules.
- A phase-at-a-glance table with effort and risk.
- One section per phase containing its goal, dependencies, risks, proof, and plan link.
- A copyable kick-off prompt for every phase.

The overview should tell a stakeholder what the whole programme does. It should not duplicate every
line of the phase contracts.

### Step 5: Create the progress ledger

`PROGRESS.md` is the shared memory of the programme. Start it before the first execution phase.

Use this general structure:

```markdown
# Programme name - Shared Progress Log

Every phase session reads this file first and updates it last. Plans describe intent; completed
entries describe reality.

## Binding conventions

1. Project-specific execution rule.
2. Scope and behaviour rule.
3. Required verification rule.
4. Documentation and handoff rule.
5. Adversarial review rule.

## Sequencing gates

- Phase relationships that are genuinely mandatory.
- Work that may run in parallel.
- High-contention phases that must run alone.

## Phase status

| Phase | Title | Risk | Status | Completed | Notes |
|------:|-------|------|--------|-----------|-------|

## Phase entry template

### Phase NN: Title - COMPLETE | IN PROGRESS | ABANDONED (date)

**What shipped:**
- ...

**Deviations from the plan:** ...

**Verification:** ...

**Adversarial review:** reviewers used, findings confirmed/refuted, fixes made

**Manual checks:** ...

**For future phases:** moved seams, new constraints, surprises, remaining work

## Decisions log

- Date, decision owner, decision, rationale, and any superseded plan text.

## Discovered for later

- Discovery, why it is deferred, and the likely owner.

## Phase entries

Completed and partial execution records, appended in order.
```

Status must be honest. If required work remains, use `IN PROGRESS` and name exactly what remains.
Do not mark a phase complete because the session is ending.

### Step 6: Review the plan before execution

For a substantial or risky Buildbook, run a pre-execution multi-agent review of the complete plan.
Useful independent lenses include:

- Requirement coverage.
- Phase scope and internal completeness.
- Cross-phase dependencies, conflicts, and file contention.
- Verification adequacy.
- Architecture and maintainability.
- Security, accessibility, data integrity, or deployment, when relevant.

The coordinator verifies proposed corrections and applies them to the phase contracts, overview,
and progress conventions before implementation starts. Record rejected suggestions as killed or
deferred candidates when they are likely to be rediscovered later.

## 5. Executing a phase

Every phase session follows the same lifecycle.

### 1. Read before acting

Read, in order:

1. Repository instructions.
2. `PROGRESS.md` in full, especially conventions, decisions, status, and previous entries.
3. The source-of-truth requirements cited by the phase.
4. The current phase contract.
5. Relevant code, tests, designs, and review notes.

Do not assume that the original plan still matches the repository. Earlier phases may have moved
files, changed seams, resolved decisions, or completed part of the work.

### 2. Reconfirm the starting point

Before editing:

- Check that prerequisites are actually complete.
- Reverify referenced files, symbols, behaviour, and counts.
- Inspect the working tree and preserve unrelated user changes.
- Reconcile any difference between the plan and the live project.
- Record a material deviation rather than hiding it.

### 3. Turn the phase into execution bites

Convert the contract into a short working plan. Each bite should be independently understandable,
reviewable, and verifiable.

Use subagents for bounded parallel work when it reduces risk or latency. Suitable implementation
delegations have clear ownership and non-overlapping files or responsibilities. The coordinating
agent remains responsible for integration, correctness, and the final result.

Avoid multiple agents making overlapping edits without explicit coordination. `PROGRESS.md` should
have one writer at a time.

### 4. Execute and verify each bite

For each bite:

1. Make only the scoped change.
2. Add or update focused tests where needed.
3. Run the checks proportionate to the change.
4. Inspect failures and fix their cause.
5. Confirm the project is in a safe state before starting the next bite.

The required checks are project-specific. They may include compilation, unit tests, integration
tests, type checking, linting, browser tests, data validation, security checks, deployment smoke
tests, or manual inspection. Buildbook does not prescribe a particular tool or universal gate.

### 5. Run the mandatory adversarial phase review

After the planned implementation and initial verification are complete, launch independent review
subagents in parallel. At minimum use these three lenses:

#### Reviewer A: Quality and maintainability

Checks structure, clarity, unnecessary complexity, duplication, conventions, maintainability,
scope discipline, and whether the implementation uses the project's established patterns.

#### Reviewer B: Completeness against the plan

Checks every requirement, work item, acceptance criterion, decision, exclusion, and promised test.
Looks for work that is claimed complete but absent, partially implemented, or implemented in the
wrong place.

#### Reviewer C: Bugs and correctness

Looks for logic errors, edge cases, unsafe state transitions, incorrect assumptions, regression
paths, failure handling, concurrency problems, data loss, security issues, and tests that do not
actually prove their claim.

Add specialist reviewers when the phase warrants them, such as accessibility, security, money and
data integrity, performance, infrastructure, visual quality, or API compatibility.

Reviewers should:

- Read the requirements, `PROGRESS.md`, current phase contract, relevant decisions, and actual diff.
- Review independently rather than inheriting another reviewer's conclusions.
- Return ranked, concrete findings with evidence and a failure scenario.
- Avoid editing the implementation during the review unless explicitly assigned a separate fix.

The coordinating agent then:

1. Deduplicates the findings.
2. Verifies each material claim against primary sources and the implementation.
3. Refutes false findings with evidence.
4. Fixes every confirmed in-scope issue.
5. Adds regression coverage where a bug lacked it.
6. Reruns the appropriate complete verification set.
7. Records the review result in the phase entry.

Do not accept findings merely because a reviewer sounds confident. Do not dismiss them merely
because the original implementation passed tests.

### 6. Update the ledger last

Only after review fixes and final verification:

- Update the phase status.
- Record what shipped, not merely what was planned.
- Record deviations and why they were necessary.
- Record verification results and manual checks.
- Record the adversarial review and its disposition.
- Add new accepted decisions.
- Add out-of-scope discoveries to the later-work ledger.
- Give future phases the exact seams, paths, constraints, and surprises they need.

## 6. Kick-off prompt template

Every HTML phase section should contain a prompt based on this template and customised to the
phase's actual risks.

```text
Please execute Phase NN (TITLE) of the PROJECT Buildbook.

Before changing anything, read:
1. Repository instructions.
2. docs/buildbook/PROGRESS.md - binding conventions, decisions, status, and what earlier phases
   actually delivered. Completed entries describe reality when they differ from the original plan.
3. The requirements or findings sections cited by this phase.
4. docs/buildbook/phases/phase-NN-title.md - the detailed execution contract.

Reverify the phase's assumptions, file references, dependencies, and current repository state.
Turn the contract into small, independently verifiable execution bites before editing.

Stay within the phase scope. Record unrelated discoveries under "Discovered for later" rather
than expanding the phase. Use subagents for bounded parallel research or implementation where
helpful, while keeping integration ownership with the primary session.

After implementation and initial verification, launch independent adversarial subagents for:
- quality and maintainability;
- completeness against every phase requirement and acceptance criterion;
- bugs and correctness.

Verify their findings yourself, fix confirmed issues, add missing regression coverage, and rerun
the required verification. Then update PROGRESS.md last with the actual result, deviations, review
outcomes, remaining work, and anything future phases need to know.

Do not mark the phase complete while required work remains.
```

Add phase-specific instructions below the common prompt, including dangerous areas, required
manual tests, expected observable changes, and prohibited changes.

## 7. Restart and recovery

Buildbook assumes that sessions can end unexpectedly and that a different agent may continue.

- Complete bites should leave the project in a safe state.
- Partial phases remain `IN PROGRESS`.
- The latest phase entry names completed bites, verification run, uncommitted state, and exact next
  work.
- A replacement session uses the same kick-off prompt, reads the ledger, checks the live project,
  and resumes from verified reality.
- Never rely on private conversational memory for a decision future sessions need.

The progress ledger is the recovery mechanism. If another agent cannot determine the programme's
state from the repository and the ledger, the handoff is incomplete.

## 8. Closing a programme

The final phase should close the programme deliberately. Depending on the project, it may include:

- A requirements coverage audit.
- A convention-conformance review.
- End-to-end verification of the finished system.
- Resolution or consolidation of deferred discoveries.
- Documentation truth pass.
- Operational or reviewer-facing handoff.
- Final status and known limitations.

Use independent subagents for the closing audit, including at least one reviewer searching for
unmet promises rather than only reviewing changed code. The closing phase must distinguish:

- Completed requirements.
- Accepted deviations.
- Explicit exclusions.
- Deferred follow-up.
- Manual acceptance still owed.

## 9. Standalone example: new product capability

Suppose a team must add organisation-level invitations to an existing SaaS product.

### Requirements source

`REQUIREMENTS.md` defines invitation roles, expiry, duplicate handling, acceptance, cancellation,
audit history, email simulation, accessibility, and security constraints.

### Programme

```text
Phase 00: Confirm domain and security decisions
Phase 01: Invitation model, rules, and tests
Phase 02: Storage and service operations
Phase 03: Admin invitation UI
Phase 04: Acceptance flow
Phase 05: Notifications and failure handling
Phase 06: End-to-end polish and closing audit
```

Phase 03's contract cites the relevant role and accessibility requirements, depends on the Phase 02
service operations, explicitly excludes acceptance, and includes manual keyboard checks. When the
phase appears complete, separate reviewers inspect UI quality, coverage against the Phase 03
contract, and correctness around duplicate or expired invitations. Confirmed issues are fixed before
the progress ledger marks Phase 03 complete.

If Phase 04 discovers that acceptance needs an additional membership state, it does not silently
rewrite Phase 01's model. The decision is verified, recorded in the decisions log, implemented with
appropriate migration and tests, and handed forward to later phases.

## 10. Standalone example: behaviour-preserving refactor

Suppose a mature application has one 4,000-line reporting controller that mixes queries,
calculations, formatting, and rendering.

### Findings source

`FINDINGS.md` records verified responsibilities, duplicated rules, existing tests, untested paths,
intentional divergences, and current public interfaces.

### Programme

```text
Phase 00: Map behaviour and strengthen missing characterization coverage
Phase 01: Extract pure reporting calculations
Phase 02: Extract query and loading orchestration
Phase 03: Extract presentation models
Phase 04: Reduce the controller to coordination
Phase 05: Remove proven dead compatibility paths
Phase 06: Closing behaviour and architecture audit
```

Phase 02 is not allowed to redesign the query API merely because the current API is awkward. Its
contract says which behaviour must remain, which failure paths need tests before movement, and which
larger changes belong in the later-work ledger.

At phase completion, the quality reviewer examines whether the extraction created clean ownership or
only moved complexity. The completeness reviewer checks every loader named in the contract. The bug
reviewer tests cancellation, partial failure, retry, and stale response ordering. The coordinator
verifies their claims, fixes confirmed issues, reruns the project checks, and records the actual file
and interface changes for Phase 03.

## 11. Standalone example: one phase contract in miniature

```markdown
# Phase 02: Password-reset service

**Depends on:** Phase 01 token model
**Unblocks:** Phase 03 reset UI
**Risk:** Medium - authentication and replay protection

## Objective

Implement request, validation, consumption, and audit operations for password-reset tokens without
adding the user interface or real email delivery.

## Current-state evidence

- Authentication writes go through `AccountService`.
- The project clock is injectable in tests.
- Email delivery is simulated by `NotificationOutbox`.

## In scope

- Requesting a reset without disclosing whether the email exists.
- Expiring and single-use token consumption.
- Invalidating older outstanding tokens.
- Audit events and focused tests.

## Out of scope

- Reset screens.
- Production email-provider integration.
- Changes to unrelated session expiry.

## Bites

1. Add failing service-rule tests.
2. Implement reset request and outbox entry.
3. Implement validation and one-time consumption.
4. Add audit events and failure-path coverage.

## Verification

- Unit and service integration tests.
- Security review for enumeration, replay, and token leakage.

## Acceptance

- [ ] All named operations and failure cases pass.
- [ ] No account-existence information leaks.
- [ ] Three adversarial reviewers complete their lenses.
- [ ] Confirmed findings are fixed and tests rerun.
- [ ] PROGRESS.md records the service interface used by Phase 03.
```

## 12. Common failure modes

- **The HTML becomes decoration.** Fix by giving every phase a real plan link, dependency, proof,
  and copyable launch prompt.
- **Phase documents are vague task lists.** Fix by adding verified evidence, scope fences, bites,
  acceptance criteria, and recovery information.
- **The progress ledger becomes a diary.** Fix by recording decisions, actual interfaces,
  deviations, verification, and concrete future-session facts.
- **Plans are treated as more truthful than the repository.** Reverify before editing and update the
  plan or decision record when evidence changes.
- **A phase absorbs every discovery.** Defer unrelated work with rationale and ownership.
- **Subagents divide ownership without coordination.** Give them bounded, non-overlapping work and
  retain one integrating coordinator.
- **Review agents rubber-stamp the result.** Give them independent lenses and require concrete
  evidence and failure scenarios.
- **Reviewer findings are fixed blindly.** The coordinator must adjudicate every material finding.
- **Passing tests are mistaken for complete proof.** Name manual or specialist checks for claims the
  automated suite cannot establish.
- **A session marks partial work complete.** Use `IN PROGRESS` and write a precise recovery handoff.
- **Settled choices are repeatedly relitigated.** Keep decisions and killed candidates explicit.
- **The final implementation outgrows its documentation.** End with a truth pass and closing audit.

## 13. Definition of a successful Buildbook

A Buildbook is successful when:

- A new agent can understand the programme without the original planning conversation.
- A fresh session can execute one phase from the repository documents alone.
- Requirements are traceable to phase contracts and completed outcomes.
- Scope and sequencing decisions are explicit.
- Every phase ends with independent adversarial review and verified remediation.
- The progress ledger makes interruption and resumption safe.
- The programme can explain what was completed, changed, excluded, deferred, and still needs human
  acceptance.

The documentation is not an account of the work after the fact. It is the operating system used to
plan, execute, review, recover, and complete the work.
