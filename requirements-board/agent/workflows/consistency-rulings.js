export const meta = {
  name: 'consistency-rulings',
  description: 'Stage 1 of the consistency review: Sonnet per note, change-log batch and answered-question batch extracts decisions; Opus merges them into a newest-wins current-rulings list (rulings.md). Read-only on the catalogue.',
  whenToUse:
    'Run by the consistency-review skill, after `build-packs.mjs` has written <run>/index.json. Pass out (the run folder), baseline, notes, changes and answered (from index.json: notes, changes, answeredQuestions), plus the "This repo" arguments (project, owner, levels, fixedRulings, topics).',
  phases: [
    { title: 'Extract', detail: 'Sonnet per note, change-log batch and answered-question batch', model: 'sonnet' },
    { title: 'Merge', detail: 'Opus merges into rulings.md, newest-wins within each level', model: 'opus' },
  ],
}

/*
 * args:
 *   out          required: the run folder (absolute); the merge agent writes <out>/rulings.md
 *   baseline     required: the committed baseline (short hash)
 *   notes        required: note paths relative to the repo root (index.json "notes")
 *   changes      change-log paths relative to the repo root (index.json "changes")
 *   answered     answered question IDs (index.json "answeredQuestions")
 *   repo         repo root, absolute (default: paths stay relative to the agents' working directory, the repo root)
 *   req          catalogue folder relative to the repo (default requirements-board/requirements)
 *   project      one line naming the system, e.g. "the Acme booking and billing system"
 *   owner        who outranks everything, e.g. "Donald (product owner)" (default "the product owner")
 *   levels       [{id, desc}] highest authority first (default: owner, meeting, doc, catalogue, original)
 *   fixedRulings strings: settled rulings that must appear as F-1, F-2 ... (never re-litigated)
 *   topics       suggested topic names (optional; the extractors invent short ones when absent)
 *   batch        files per change-log or question batch (defaults 3 change logs, 30 questions)
 */
const A = args || {}
const ROOT = A.repo ? A.repo.replace(/\/$/, '') + '/' : ''
const REQ_REL = (A.req || 'requirements-board/requirements').replace(/\/$/, '')
const REQ = ROOT + REQ_REL
const OUT = A.out
const OWNER = A.owner || 'the product owner'
const PROJECT = A.project || 'the system this catalogue describes'
if (!OUT || !A.baseline || !Array.isArray(A.notes)) {
  log('Missing args: out, baseline and notes are required (notes, changes and answeredQuestions come from <run>/index.json).')
  return { error: 'missing args' }
}

const LEVEL_LIST = A.levels || [
  { id: 'owner', desc: `${OWNER}'s typed decisions, or explicit instructions to change the requirements (for example "Claude, update X" in a meeting).` },
  { id: 'meeting', desc: 'what was said and agreed in a meeting and not contested there (includes client staff stating how they work).' },
  { id: 'doc', desc: 'written documents and proposals (designs, pricing documents, summaries) where not separately agreed in a meeting.' },
  { id: 'catalogue', desc: 'an editorial reading the catalogue recorded in a change log, with no meeting or owner source behind it.' },
  { id: 'original', desc: 'the original brief or RFP.' },
]
const LEVELS = `Levels (highest authority first; within a level, newer beats older):
${LEVEL_LIST.map((l) => `- "${l.id}": ${l.desc}`).join('\n')}`
const TOPICS = A.topics || []
const chunk = (xs, n) => { const out = []; for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n)); return out }

const SCHEMA = {
  type: 'object',
  properties: {
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'One of the suggested topics, or a new short topic if none fits' },
          rule: { type: 'string', description: 'The rule or fact as it now stands, one or two plain sentences' },
          level: { type: 'string', enum: LEVEL_LIST.map((l) => l.id) },
          date: { type: 'string', description: 'YYYY-MM-DD the statement was made' },
          cite: { type: 'string', description: 'Citation in catalogue form, e.g. "Notes 2026-10-16 · <note title words> #8", "OQ-62", "Typed decision <date> · <who>"' },
          quote: { type: 'string', description: 'Short verbatim quote (under 300 chars) that carries the rule' },
          replaces: { type: 'string', description: 'The earlier understanding this explicitly replaces or reverses, with its source if known; empty if none' },
          items: { type: 'array', items: { type: 'string' }, description: 'Catalogue IDs (EP/FT/US/OQ/AR) the source names for this rule' },
        },
        required: ['topic', 'rule', 'level', 'date', 'cite', 'quote', 'replaces', 'items'],
      },
    },
    caveats: { type: 'string', description: 'Anything that made levels or dates hard to read in this source' },
  },
  required: ['decisions', 'caveats'],
}

const COMMON = `You are extracting the DECISIONS and RULES from requirements evidence for ${PROJECT}, so a later step can build a newest-wins list of current rulings. Read-only: do not edit any file.

Extract every decision, rule, fact about how the client works, rename, retirement, or reversal that should shape the requirements. Skip chit-chat, process talk and things merely discussed without an outcome (record a question that was raised but not settled only if it explicitly reverses an earlier rule). Be thorough: a 50k-character note may hold 40 to 80 decisions. Give each one a level:
${LEVELS}
${TOPICS.length ? `\nSuggested topics (use these names where they fit): ${TOPICS.join('; ')}.\n` : ''}
Rules:
- Quote verbatim; never invent a citation. Use the note's numbered points (#n) in cites where the rule sits under one.
- Fill "replaces" whenever the source says something changed, was dropped, renamed, or no longer holds; this is the most important field.
- Open questions are NOT rulings. Only an answered question (status Answered with an ## Answer) defines a rule.`

const notePrompts = A.notes.map((n) => ({
  label: `note:${n.split('/').pop().replace('.md', '')}`,
  prompt: `${COMMON}

Source: the note ${ROOT}${n}. Read the whole file (use offset/limit reads if it is long). Its date is in the file name. Notes summarise meetings; the speaker tells you the level (${OWNER}'s instructions or typed decisions = ${LEVEL_LIST[0].id}; agreed or stated in the meeting = meeting; points summarising written documents = the documents' level).`,
}))

const changePrompts = chunk(A.changes || [], (A.batch && A.batch.changes) || 3).map((b, i) => ({
  label: `changes:${i + 1}`,
  prompt: `${COMMON}

Sources: these change logs (each records what one requirements update did and why):
${b.map((c) => `- ${ROOT}${c}`).join('\n')}

From change logs extract: (1) ${OWNER}'s typed decisions and instructions they record (level ${LEVEL_LIST[0].id}, cite them as the change log records them); (2) the precedence or readings each update chose ("Precedence used", "not adopted", "retired", "renamed", "dropped"); (3) retirements and renames with what replaced them. Do not re-extract every meeting point the log merely repeats unless it records a decision about how to read it. Give a decision the level of the source behind it; an editorial reading with no source behind it is "catalogue".`,
}))

const questionPrompts = chunk(A.answered || [], (A.batch && A.batch.questions) || 30).map((b, i) => ({
  label: `questions:${i + 1}`,
  prompt: `${COMMON}

Sources: these answered questions in ${REQ}/questions/: ${b.join(', ')} (file name = ID + .md). Read each. The ## Answer is the ruling; its date and level come from the answer's own source lines or sources field (an answer from ${OWNER} is ${LEVEL_LIST[0].id}, from a meeting is meeting). Cite each as its OQ ID. If an answer was later extended or partly reversed inside the same file, record the latest state and put the earlier one in "replaces".`,
}))

phase('Extract')
const jobs = [...notePrompts, ...changePrompts, ...questionPrompts]
const extracted = (await parallel(jobs.map((j) => () =>
  agent(j.prompt, { label: j.label, phase: 'Extract', schema: SCHEMA, model: 'sonnet', effort: 'medium' })
    .then((r) => r && { source: j.label, ...r })))).filter(Boolean)
const total = extracted.reduce((n, r) => n + r.decisions.length, 0)
log(`${extracted.length}/${jobs.length} sources extracted, ${total} decisions`)
if (extracted.length < jobs.length) log(`MISSING: ${jobs.map((j) => j.label).filter((l) => !extracted.find((e) => e.source === l)).join(', ')}`)

const FIXED = A.fixedRulings || []
phase('Merge')
const merged = await agent(`You are building the CURRENT RULINGS list for a consistency review of the requirements catalogue at ${REQ} (baseline commit ${A.baseline}). Cheap agents will later read this list alongside each feature and flag text that contradicts it, so it must be correct, compact and unambiguous. Read-only on the catalogue: the only file you write is ${OUT}/rulings.md.

Below are ${total} decisions extracted by other agents from every note, change log and answered question, as JSON. They overlap heavily and some are stale.

${LEVELS}

Merge rules:
1. Group by topic. For each distinct rule, keep the version from the highest level; within a level, the newest date wins. Older versions become "No longer true" entries.
2. A newer statement at a LOWER level does not override an older higher-level one (for example a written document does not override ${OWNER}'s earlier typed decision); list such cases under Conflicts.
3. When extractions disagree on what a source says, or a merge is unclear, open the source file and check before writing. Cite only what you verified or what the extraction quoted.
4. Open questions are never rulings.
${FIXED.length ? `5. These settled rulings are fixed and must appear in a "Fixed rulings" section, worded neutrally:\n${FIXED.map((f) => `   - ${f}`).join('\n')}` : '5. There are no fixed rulings: leave the "Fixed rulings" section with the line "None."'}

Write ${OUT}/rulings.md with this structure (keep it under about 60,000 characters; one or two lines per ruling):

# Current rulings
Baseline commit \`${A.baseline}\`, date built, the ranking in one line, "Open questions are not rulings".
A "Cite shorthand" line if you abbreviate note cites: \`KEY = Notes <date> · <note title words>\` entries separated by " · " (for example \`G1016 = Notes 2026-10-16 · Meeting with the client\`), then \`CL<date> = change log of that date · TD<date> = ${OWNER}'s typed decision of that date (as recorded in the change log)\`. The review pages resolve exactly that shape.
## Fixed rulings
- **F-1** ... (the fixed rulings above)
## Rulings by topic
### <Topic>
- **R-001** <rule>. _<date> · <level> · <cite>[; <cite>]_ <if it replaced something: "Replaces: <old> (<date>)">
## No longer true
Stale understandings a requirement might still contain, each pointing at what replaced it: - **S-001** <old understanding> (was <cite>, <date>) → see R-0nn. Include renamed and retired terms and concepts (old name → new name). This section is what reviewers use to spot stale text, so be complete.
## Terminology
Current names for key things, and retired names to avoid ("Avoid (retired): ...").
## Conflicts for ${OWNER.split(' ')[0]}
- **C-1 <short title>.** Each: the two (or more) positions with level, date, cite; why it is unresolved; "Recommendation: ...". Only real conflicts, not things the ranking settles.

Then return a short summary.

EXTRACTIONS:
${JSON.stringify(extracted)}`, {
  label: 'merge:rulings', phase: 'Merge', model: 'opus', effort: 'high',
  schema: {
    type: 'object',
    properties: {
      rulings: { type: 'number' }, noLongerTrue: { type: 'number' }, conflicts: { type: 'number' },
      conflictTitles: { type: 'array', items: { type: 'string' } },
      chars: { type: 'number', description: 'Size of rulings.md' },
      notes: { type: 'string' },
    },
    required: ['rulings', 'noLongerTrue', 'conflicts', 'conflictTitles', 'chars', 'notes'],
  },
})
return { total, sources: extracted.length, merged }
