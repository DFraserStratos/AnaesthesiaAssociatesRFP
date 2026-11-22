#!/usr/bin/env node
// The context pack for one build phase: a single compact Markdown file holding exactly what that phase's
// session needs from the plan's large documents, so the agent reads it (plus its phase doc and prompt)
// instead of the progress file, ROADMAP.md, the gap analysis, the domain model and the catalogue whole.
// Usage (repo root):
//   node <tools>/phase-context.mjs <phase id> [--out <file> | --stdout] [--plan <dir>]
//   <phase id>   a phase number from plan.json (21a, U2, 44)
//   --out        where to write the pack; default <logDir>/<id>.md, logDir being the plan config's
//                runner.logDir (default .build-phase), with a .gitignore of "*" written beside it
//   --stdout     print the pack on stdout and write nothing at all (no <logDir>, no .gitignore): for a
//                session that must stay read-only, such as one in plan mode; the summary goes to stderr
// Prints the output path, its size and each section's size (and what was trimmed to fit the budget).
// Reads only: git and the plan, catalogue and progress files; the one write is the pack itself.
//
// The pack, every excerpt labelled with its source path and heading:
//   1. the phase's plan.json entry and its built status (DONE, IN PROGRESS: session 1 built and frozen, or
//      not built), its dependencies' status and the phases waiting on it; its place in ROADMAP's run order
//      (config runner.context.runOrder: [{ section, marker }], the first statement naming it: the phase
//      before, the next unbuilt one after, its "then" step); the plan page's status.json entries naming it
//      or that next phase, verbatim; and the doc's session split ("**Estimated:**", "**Session N: …**");
//   2. the drift check, already run, since the phase doc's own baseline (the commit on its first drift or
//      baseline line, else plan.json's; the pack prints the plan-state --diff --from command for that same
//      baseline): its covered items and the catalogue ids its plan-state --diff line
//      names, unchanged ones in one line, cosmetic-only changes in one line, changes in substance with their
//      diff (cosmetic front-matter fields left out); domain-model.md's changed sections; ids now retired or
//      out of scope; notes and change logs added;
//   3. the owner decision rows that gate it (ROADMAP.md "| D<n> |" rows), verbatim, and the others its doc
//      names;
//   4. its covered catalogue items, current text, and the questions they or its doc name: open ones and
//      ones answered since the baseline in brief, older answers in one line each;
//   5. from the progress file: the house rules (config runner.context.progressSections), the status rows of
//      its dependencies, each built dependency's phase entry (trimmed to its handoff, seams, deviations and
//      owner's review parts and anything naming this phase, whole when under 8 KB), its own entry when IN
//      PROGRESS, the lines of other built phases' entries that name it, the Decisions-log entries its doc
//      names by date and title, and the handoff-list items that name it;
//   6. from ROADMAP.md: the sequencing rules that name it plus the always-on ones, and the standing-rule
//      sections every phase follows (config runner.context.roadmapSections; a phase table in them keeps
//      only this phase's row);
//   7. pointers, not content: gap analysis, epic, data-model delta and reverse-check anchors for its units,
//      the code maps, domain-model sections, design files, artifacts and documents its doc or prompt names,
//      its catalogue screenshot recipes with whether each exists, and the doc's "Recipes this phase breaks".
// Over the budget (runner.context.budgetKB, default 60) the largest progress-file excerpts are trimmed
// first, then catalogue text, then ROADMAP excerpts; the pack says what was trimmed.
//
// Config (plan.config.json, all optional): "runner": { "logDir": ".build-phase", "context": {
//   "budgetKB": 60, "progressSections": ["Binding conventions"], "roadmapSections": ["Demo triggers", ...],
//   "sequencingSection": "Sequencing rules", "sequencingAlways": ["Every phase", ...], "designDir": "docs/design",
//   "runOrder": [{ "section": "Sequencing rules", "marker": "**Run order.**" }],
//   "fullEntryKB": 8,
//   "countNouns": ["tickets?"],         words after a number that make it a count, not a phase (regex fragments,
//                                        added to the generic ones: tests, files, items, days and so on)
//   "notPhaseBefore": ["TK0*"],         what before a number makes it not a phase (regex fragments, added to
//                                        the generic ones: a VERSION constant, "line", "#" and so on)
//   "decisionsSection": "Decisions log", "handoffSection": "Discovered for later"
//                                        the progress file's decisions log and handoff list headings (these
//                                        defaults; a configured one the file lacks is noted in the pack) } }
// Tested by phase-context.test.mjs (the pure parts).
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// ---------------------------------------------------------------------------------------------------
// Pure parts (exported for phase-context.test.mjs)
// ---------------------------------------------------------------------------------------------------

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** A phase id as a token: "22" not inside "2026-11-22", "$22", "D22", "US-03.22" or "22%". */
export const phaseIdRe = (id, flags = '') => new RegExp(`(?<![\\w.$/#:-])${esc(id)}(?![\\w%$]|[.,:/-]\\d)`, flags)
// A plain number is often not a phase: a day ("Mon 27", "27 Oct"), a count ("27 tests"), a version
// ("APP_VERSION 26 to 27"), a line number or the end of a numeric range. The generic words are here; a
// plan adds its own (config runner.context.countNouns: words after a number that make it a count, such as
// "tickets?"; runner.context.notPhaseBefore: what before a number makes it not a phase, such as "TK0*"),
// each a regular-expression fragment.
const DAY_BEFORE = /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\.?\s$/
const MONTH_AFTER = /^\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/
const BAD_BEFORE_WORDS = ['(?:[A-Z][A-Z0-9]*_)*VERSION\\D{0,16}', 'version\\s', 'lines?\\s', 'line\\s~?', ':\\s?', '\\d\\s(to|and|or|by)\\s', '\\d[–-]', '#', '~', '\\bp\\.\\s?', '\\bL']
const COUNT_WORDS = ['tests?', 'files?', 'lines?', 'rows?', 'KB', 'items?', 'recipes?', 'days?', 'weeks?', 'months?', 'years?', 'hours?', 'min', 'minutes?', 'seconds?', 'units?', 'questions?', 'ids?', 'IDs', 'groups?', 'specs?', 'cases?', 'shots?', 'codes?', 'people', 'sessions? (?!\\d)', 'of\\b', 'x\\b', '×', '\\+', '-', 'to \\d']
const strings = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x) : [])
/** The "not a phase" patterns for a plan's runner.context (countNouns, notPhaseBefore added to the generic ones). */
export function vocabulary(ctx = {}) {
  const build = (bad, count) => ({ badBefore: new RegExp(`(${bad.join('|')})$`), countAfter: new RegExp(`^\\s(${count.join('|')})`) })
  try {
    return build([...BAD_BEFORE_WORDS, ...strings(ctx.notPhaseBefore)], [...COUNT_WORDS, ...strings(ctx.countNouns)])
  } catch (e) {
    console.error(`phase-context: runner.context countNouns / notPhaseBefore hold an invalid pattern (${e.message}); using the generic words only.`)
    return build(BAD_BEFORE_WORDS, COUNT_WORDS)
  }
}
let VOCAB = vocabulary()
/** Sets the vocabulary every later `mentions` call uses by default (the pack sets the plan's once). */
export function useVocabulary(ctx) { VOCAB = vocabulary(ctx) }
/** Does the text name phase `id`? A plain number must not read as a day, a count, a version or a line. */
export function mentions(text, id, vocab = VOCAB) {
  for (const m of text.matchAll(phaseIdRe(id, 'g'))) {
    if (!/^\d+$/.test(id)) return true
    const before = text.slice(Math.max(0, m.index - 24), m.index)
    const after = text.slice(m.index + id.length, m.index + id.length + 16)
    if (DAY_BEFORE.test(before) || vocab.badBefore.test(before) || MONTH_AFTER.test(after) || vocab.countAfter.test(after)) continue
    return true
  }
  return false
}

/** The section under a heading whose text starts with `title` (any level), to the next heading at the same or a higher level; null if absent. */
export function sectionOf(text, title) {
  const lines = text.split('\n')
  const at = lines.findIndex(l => { const m = l.match(/^(#+)\s+(.*)$/); return m && m[2].trim().toLowerCase().startsWith(title.toLowerCase()) })
  if (at < 0) return null
  const level = lines[at].match(/^#+/)[0].length
  let end = lines.findIndex((l, i) => i > at && /^#+\s/.test(l) && l.match(/^#+/)[0].length <= level)
  if (end < 0) end = lines.length
  return { heading: lines[at].replace(/^#+\s+/, ''), line: at + 1, text: lines.slice(at, end).join('\n').trimEnd() }
}

/** Every heading of a Markdown text: { level, title, line, end } (end: the line before the next heading at the same or a higher level). */
export function headingsOf(text) {
  const lines = text.split('\n')
  const hs = []
  let fence = false
  lines.forEach((l, i) => {
    if (/^```/.test(l)) fence = !fence
    const m = !fence && l.match(/^(#+)\s+(.*)$/)
    if (m) hs.push({ level: m[1].length, title: m[2].trim(), line: i + 1 })
  })
  for (const h of hs) {
    const next = hs.find(x => x.line > h.line && x.level <= h.level)
    h.end = next ? next.line - 1 : lines.length
  }
  return hs
}

/**
 * A progress-file phase entry split into blocks: the heading and its intro, then one block per paragraph
 * that opens with a bold label (`**Handoffs.**`) or a `####` heading, each with the lines under it.
 */
export function entryBlocks(entry) {
  const blocks = []
  let cur = null
  for (const line of entry.split('\n')) {
    const label = line.match(/^\*\*([^*]{1,160}?)\*\*/) || line.match(/^#{4,}\s+(.*)$/)
    if (!cur || label) { cur = { label: label ? label[1].replace(/[.:]\s*$/, '').trim() : '', lines: [] }; blocks.push(cur) }
    cur.lines.push(line)
  }
  return blocks.map(b => ({ label: b.label, text: b.lines.join('\n').trimEnd() }))
}

/** Block labels a later phase needs: what was left for it, the seams, what deviated, what the owner must see. */
export const HANDOFF_LABEL = /hand-?off|for later|later phases|seam|owner'?s review|names? (used|map)|shipped names|\bleft\b|deviation|unbuilt dependenc|registry contract|still to do|remains|deferred/i

/** The parts of a long line (over `max` characters) that name the phase: its sentences that do, joined. */
function sentencesNaming(line, id, max = 1200) {
  if (line.length <= max) return line
  const parts = line.split(/(?<=[.;])\s+(?=[A-Z(*`'"\d-])/)
  const kept = parts.filter(p => mentions(p, id))
  return kept.length ? `${kept.join(' … ')}` : ''
}

/**
 * A Markdown text split into passages: a paragraph, a bullet or numbered item (its wrapped lines with it;
 * a nested bullet is its own passage), a bold-label paragraph, a heading or a table row.
 */
export function passagesOf(text) {
  const out = []
  let cur = null
  for (const l of text.split('\n')) {
    if (!l.trim()) { cur = null; continue }
    const starts = /^\s*([-*]|\d+\.)\s|^\*\*|^#|^\|/.test(l)
    if (!cur || starts) { cur = [l]; out.push(cur) } else cur.push(l)
  }
  return out.map(p => p.join('\n'))
}

/** The passages of a text that name the phase; a long one cut to its sentences that do. */
export function linesNaming(text, id) {
  return passagesOf(text).filter(p => mentions(p, id)).map(p => sentencesNaming(p.replace(/\s*\n\s*/g, ' '), id)).filter(Boolean)
}

/**
 * A built dependency's phase entry at three levels of detail, each a string:
 *   0. whole when under `fullBytes`, else its heading, its handoff-type blocks whole and, from every other
 *      block, the lines naming this phase;
 *   1. its heading, the handoff-type blocks cut to 3 KB each and the lines naming this phase;
 *   2. its heading and the lines naming this phase only.
 * Each level ends with a line naming what was left out.
 */
export function entryLevels(entry, id, { fullBytes = 8000 } = {}) {
  const blocks = entryBlocks(entry)
  const [head, ...rest] = blocks
  const headLine = head.text.split('\n')[0]
  const naming = b => linesNaming(b.text.split('\n').slice(1).join('\n'), id)
  const build = (handoffCap) => {
    const out = [headLine]
    const dropped = []
    const intro = linesNaming(head.text.split('\n').slice(1).join('\n'), id)
    if (intro.length) out.push('', ...intro)
    for (const b of rest) {
      const isHandoff = handoffCap !== 0 && HANDOFF_LABEL.test(b.label)
      if (isHandoff) {
        out.push('', handoffCap && b.text.length > handoffCap ? `${b.text.slice(0, handoffCap)} … (cut)` : b.text)
        continue
      }
      const n = mentions(b.text, id) ? (mentions(b.text.split('\n')[0], id) && b.text.length < 1500 ? [b.text] : [`**${b.label}** (lines naming ${id}):`, ...naming(b)]) : []
      if (n.length) out.push('', ...n)
      else if (b.label) dropped.push(b.label)
    }
    if (dropped.length) out.push('', `_(Left out: ${dropped.join('; ')}.)_`)
    return out.join('\n')
  }
  const whole = entry.length <= fullBytes ? entry.trimEnd() : build(null)
  return [whole, build(3000), build(0)]
}

/** The Decisions-log entries (`- **<date> · <title>**`) of a progress-file section: { date, title, text, line }. */
export function decisionLogEntries(section, firstLine = 1) {
  const lines = section.split('\n')
  const out = []
  lines.forEach((l, i) => {
    const m = l.match(/^- \*\*(\d{4}-\d{2}-\d{2})\s*·\s*(.+?)\*\*/)
    if (m) {
      let j = i + 1
      while (j < lines.length && !/^- \*\*\d{4}-/.test(lines[j]) && !/^#/.test(lines[j])) j++
      out.push({ date: m[1], title: m[2].replace(/[.:]\s*$/, ''), text: lines.slice(i, j).join('\n').trimEnd(), line: firstLine + i })
    }
  })
  return out
}

const STOP = new Set('the and for with from that this into over when then than are was were not its their his her has have had one two all any each own per via but out off our who what which where only also plus still shown show phase entry build built'.split(' '))
const wordsOf = s => s.toLowerCase().replace(/[`*"'“”‘’()[\],.;:!?]/g, ' ').split(/\s+/).filter(w => (w.length >= 3 || /^\d+$/.test(w)) && !STOP.has(w))

/**
 * The Decisions-log entries a phase doc names "by date and title": for each date in the doc, the entry of
 * that date whose title words best match the 240 characters after it (at least half of them, and two).
 */
export function decisionsNamed(docText, entries) {
  const flat = docText.replace(/\s+/g, ' ')
  const found = new Map()
  for (const m of flat.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)) {
    const window = new Set(wordsOf(flat.slice(m.index + 10, m.index + 250)))
    let best = null
    for (const e of entries.filter(x => x.date === m[1])) {
      const tw = [...new Set(wordsOf(e.title))]
      const hit = tw.filter(w => window.has(w)).length
      const score = tw.length ? hit / tw.length : 0
      if (hit >= Math.min(2, tw.length) && score >= 0.5 && (!best || score > best.score)) best = { e, score }
    }
    if (best) found.set(best.e.line, best.e)
  }
  return [...found.values()].sort((a, b) => a.line - b.line)
}

/**
 * The top-level rules of a ROADMAP sequencing section: one block per top-level bullet, up to the first
 * paragraph that is not a list item (where the section's history begins). Returns { text, label }.
 */
export function ruleBlocks(section) {
  const lines = section.split('\n').slice(1)
  const blocks = []
  for (const l of lines) {
    if (/^- /.test(l)) blocks.push([l])
    else if (/^\S/.test(l) && blocks.length) break
    else if (blocks.length) blocks[blocks.length - 1].push(l)
  }
  return blocks.map(b => { const text = b.join('\n').trimEnd(); return { text, label: (text.match(/^- \*\*(.+?)\*\*/) || [, ''])[1] } })
}

/** The rules of a sequencing section that name the phase, or whose label starts with one of `always`. */
export function rulesFor(section, id, always = []) {
  return ruleBlocks(section).filter(b => mentions(b.text, id) || always.some(a => b.label.toLowerCase().startsWith(a.toLowerCase())))
}

/** Does a passage name at least `n` phases other than this one (from the plan's phase ids)? Then it is about them. */
export function aboutOtherPhases(text, id, phases, n = 3) {
  return phases.filter(p => p !== id && mentions(text, p)).length >= n
}

/** The first `n` sentences of a passage (each cut at `lead` characters), and its other sentences or clauses that name the phase. */
function leadAndNaming(text, id, lead = 300, n = 1) {
  const parts = text.replace(/\s*\n\s*/g, ' ').split(/(?<=[.;:])\s+/)
  const first = parts.slice(0, n).map(p => (p.length > lead ? `${p.slice(0, lead)} …` : p)).join(' ')
  const rest = parts.slice(n).filter(p => mentions(p, id))
  return rest.length ? `${first} … ${rest.join(' … ')}` : parts.length > n ? `${first} …` : first
}

/**
 * A passage cut to what concerns this phase when it is longer than `max`: its lead sentence, its
 * sub-bullets that name the phase (each cut the same way when long) and, with no sub-bullets, its
 * clauses that name it (its first two sentences when none does). Short passages and numbered steps are kept whole,
 * and so, given the plan's phase ids, is a passage that is not about other phases (names fewer than 3).
 */
export function focusBlock(text, id, max = 900, phases = null) {
  if (text.length <= max || /^\s*\d+\.\s/.test(text)) return text
  if (phases && !aboutOtherPhases(text, id, phases)) return text
  const lines = text.split('\n')
  const subAt = lines.findIndex((l, i) => i > 0 && /^\s+- /.test(l))
  if (subAt < 0) return `${text.match(/^\s*(- |\d+\.\s)?/)[0]}${leadAndNaming(text.replace(/^\s*(- |\d+\.\s)/, ''), id, 300, mentions(text, id) ? 1 : 2)}`
  const lead = lines.slice(0, subAt).join('\n')
  const subs = []
  let cur = null
  for (const l of lines.slice(subAt)) { if (/^\s+- /.test(l)) { cur = [l]; subs.push(cur) } else if (cur) cur.push(l) }
  const kept = subs.map(b => b.join('\n')).filter(b => mentions(b, id)).map(b => (b.length > max ? `${b.match(/^\s*- /)[0]}${leadAndNaming(b.replace(/^\s*- /, ''), id)}` : b))
  const leadText = lead.length > 600 ? `${lead.match(/^\s*(- )?/)[0]}${leadAndNaming(lead.replace(/^\s*- /, ''), id)}` : lead
  return [leadText, ...kept, ...(kept.length < subs.length ? [`  - _(${subs.length - kept.length} sub-points about other phases left out.)_`] : [])].join('\n')
}

/**
 * A standing-rule section focused on this phase: its passages (paragraphs, bullets, numbered steps) kept
 * whole when short or general, long ones about other phases cut by focusBlock (dropped when they do not
 * name this one), and a note of how many were left out.
 */
export function focusSection(text, id, max = 900, phases = null) {
  const lines = text.split('\n')
  const blocks = []
  let cur = null
  for (const l of lines) {
    if (!l.trim()) { cur = null; continue }
    if (!cur || /^(- |\d+\.\s|\|)/.test(l) && !/^\|/.test(cur[0]) || /^#/.test(l)) { cur = [l]; blocks.push(cur) } else cur.push(l)
  }
  let dropped = 0
  const out = []
  for (const b of blocks) {
    const t = b.join('\n')
    const f = /^(#|\|)/.test(t) ? t : focusBlock(t, id, max, phases)
    if (f) out.push(f); else dropped++
  }
  if (dropped) out.push(`_(${dropped} long passage${dropped > 1 ? 's' : ''} about other phases left out.)_`)
  return out.join('\n\n')
}

/** A section cut to the lead sentence of each passage (headings and table rows kept): the rules' headlines. */
export function leadsOnly(text, lead = 250) {
  return passagesOf(text).map(p => (/^(#|\|)/.test(p) ? p : `${p.match(/^\s*([-*]|\d+\.)?\s*/)[0]}${leadAndNaming(p.replace(/^\s*([-*]|\d+\.)?\s*/, ''), '\u0000', lead)}`)).join('\n')
}

/** A section with any table keyed by phase number (first cell `| 21a |`) cut to this phase's rows. */
export function phaseRowsOnly(text, id, isPhase = n => /^(\d{2}[a-z]?|[A-Z]\d+)$/.test(n)) {
  return text.split('\n').filter(l => {
    const m = l.match(/^\|\s*([^|]+?)\s*\|/)
    return !(m && isPhase(m[1]) && m[1] !== id)
  }).join('\n')
}

/** Markdown link markup made compact: `[text](US-01.2)` → `text (US-01.2)`, other links to their text. */
export const compactLinks = s => s.replace(/\[([^\]]*)\]\(([^)\s]*)\)/g, (_, t, href) => (/^[A-Z]{2}-[\d.]+(#[\w.-]+)?$/.test(href) ? `${t} (${href})` : t))

/** The phase doc's drift-check baseline: the first commit on a baseline line (drift section first), else null. */
export function docBaseline(doc, baselineLine, isCommit = () => true) {
  const drift = sectionOf(doc, 'Before you start')
  for (const text of [drift?.text, doc].filter(Boolean)) {
    for (const line of text.split('\n')) {
      if (!baselineLine.test(line)) continue
      for (const m of line.matchAll(/(\.\.)?`?\b([0-9a-f]{7,40})\b`?(?!\.\.)/g)) if (!m[1] && /[a-f]/.test(m[2]) && isCommit(m[2])) return { sha: m[2], line }
    }
  }
  return null
}

/**
 * A passage that starts at `marker` inside a section: the marker's line from the marker on, and its
 * wrapped lines, up to a blank line or the next bullet. Null if the marker is absent.
 */
export function passageAt(section, marker) {
  const lines = section.split('\n')
  const at = lines.findIndex(l => l.includes(marker))
  if (at < 0) return null
  const out = [lines[at].slice(lines[at].indexOf(marker))]
  for (const l of lines.slice(at + 1)) { if (!l.trim() || /^\s*([-*]|\d+\.)\s/.test(l) || /^#/.test(l)) break; out.push(l.trim()) }
  return out.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * A run-order statement ("21, then U1, then U2 and U3 side by side, then 21a and 22, …, Intake, Money
 * and 40 to 43a") read against the plan's phases ([{ num, track }], in plan order). Steps split at
 * "then"; within a step, phase ids in order, "A to B" ranges expanded over the plan's order (numbered
 * ends over numbered phases only, track ends such as U1 to U6 over that track's phases only), a number
 * followed by a month ("18 November") is a date, not a phase, and a track name expanded to its phases. Returns
 * { steps: [[id]], order: [id] } with each phase once, where it first appears.
 */
export function parseRunOrder(text, phases) {
  const nums = phases.map(p => p.num)
  const idx = new Map(nums.map((n, i) => [n, i]))
  const tracks = [...new Set(phases.map(p => p.track).filter(Boolean))].sort((a, b) => b.length - a.length)
  const NUM = '\\d{2}[a-z]?|[A-Z]\\d+'
  const re = new RegExp(`${tracks.length ? `\\b(${tracks.map(esc).join('|')})\\b|` : ''}\\b(${NUM})\\s+to\\s+(${NUM})\\b|(?<![\\w.-])(${NUM})(?![\\w.-]*\\d)`, 'g')
  const seen = new Set()
  const steps = []
  for (const chunk of text.split(/\bthen\b/)) {
    const step = []
    const push = n => { if (idx.has(n) && !seen.has(n)) { seen.add(n); step.push(n) } }
    for (const m of chunk.matchAll(re)) {
      const [, track, a, b, single] = tracks.length ? m : [m[0], undefined, m[1], m[2], m[3]]
      if (track) phases.filter(p => p.track === track).forEach(p => push(p.num))
      else if (a) {
        if (!idx.has(a) || !idx.has(b)) continue
        const numbered = /^\d/.test(a) && /^\d/.test(b)
        const trackOf = n => n.match(/^[A-Z]+/)?.[0]
        const sameTrack = !numbered && trackOf(a) && trackOf(a) === trackOf(b)
        nums.slice(idx.get(a), idx.get(b) + 1).filter(n => (numbered ? /^\d/.test(n) : sameTrack ? trackOf(n) === trackOf(a) : true)).forEach(push)
      } else {
        const rest = chunk.slice(m.index + m[0].length, m.index + m[0].length + 12)
        if (/^\d/.test(single) && MONTH_AFTER.test(rest)) continue
        push(single)
      }
    }
    if (step.length) steps.push(step)
  }
  return { steps, order: steps.flat() }
}

/**
 * Where a phase sits in a parsed run order: `previous`, the phase just before it; `next`, the first phase
 * after it that is not built (`built`, a set of ids); and its step's neighbours.
 */
export function runOrderPosition(parsed, id, built = new Set()) {
  const i = parsed.order.indexOf(id)
  if (i < 0) return null
  const s = parsed.steps.findIndex(st => st.includes(id))
  return {
    previous: parsed.order[i - 1] ?? null,
    next: parsed.order.slice(i + 1).find(n => !built.has(n)) ?? null,
    previousStep: parsed.steps[s - 1] ?? [],
    sameStep: parsed.steps[s].filter(n => n !== id),
    nextStep: parsed.steps[s + 1] ?? [],
  }
}

/**
 * The plan page's status (status.json) entries that name any of `ids`: `in_progress`, `next` (when its
 * phases or note name one), and each `guidance` entry keyed by one or whose text names one. Verbatim.
 */
export function statusEntriesNaming(status, ids) {
  const names = t => ids.some(id => mentions(String(t ?? ''), id))
  const out = []
  if ((status.in_progress || []).length) out.push(['in_progress', status.in_progress])
  if (status.next && ((status.next.phases || []).some(p => ids.includes(String(p))) || names(status.next.note))) out.push(['next', status.next])
  for (const [k, v] of Object.entries(status.guidance || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [n, why] of Object.entries(v)) if (ids.includes(n) || names(why)) out.push([`guidance.${k}.${n}`, why])
    } else if (['parallel', 'headline', 'headline_sub'].includes(k) && names(v)) out.push([`guidance.${k}`, v])
  }
  return out
}

/** A phase doc's session split: its "**Estimated:**" paragraph and its "**Session N: …**" work-item headings. */
export function sessionSplit(doc) {
  const est = passagesOf(doc).find(p => /^\*\*Estimated:?\*\*/.test(p))
  const heads = [...doc.matchAll(/^\*\*(Session \d+:[^*]*)\*\*/gm)].map(m => m[1].replace(/[.:]$/, ''))
  return { estimated: est ? est.replace(/\s*\n\s*/g, ' ') : null, heads }
}

/** The "**Recipes this phase breaks**" passage of a phase doc's screenshots section, with its bullets, up to the next bold label or heading. */
export function recipesBreaks(doc) {
  const lines = doc.split('\n')
  const at = lines.findIndex(l => /^\*\*Recipes this phase breaks/.test(l))
  if (at < 0) return null
  let end = at + 1
  while (end < lines.length && !/^(\*\*|#)/.test(lines[end])) end++
  return lines.slice(at, end).join('\n').trim()
}

/** The catalogue and question ids on a phase doc's `plan-state.mjs --diff <ids>` lines. */
export function diffIds(doc) {
  const ids = []
  for (const m of doc.matchAll(/plan-state\.mjs[^\n]*?--diff\s+([A-Z0-9.,\- ]+)/g)) for (const id of m[1].split(/[,\s]+/)) if (/^(EP|FT|US|OQ|MS)-[\d.]+$/.test(id) && !ids.includes(id)) ids.push(id)
  return ids
}

/**
 * Fit a pack to a byte budget. `parts` are { key, group, label, levels: [string, ...], level? }; their
 * current text is levels[level], level 0 the fullest. `steps` is the cutting order, [[group, level], ...]:
 * at each step, while over budget, the largest part of that group still above that level steps down one
 * level; the next step starts only when that group is down to that level. Groups no step names are never
 * cut. Returns { parts, size, trimmed: [message per part cut], over: bool }.
 */
export function fitBudget(parts, budget, steps, sizeOf = s => Buffer.byteLength(s)) {
  for (const p of parts) { p.level ??= 0; p.from = sizeOf(p.levels[0]) }
  const now = p => sizeOf(p.levels[p.level])
  const total = () => parts.reduce((n, p) => n + now(p), 0)
  let size = total()
  for (const [group, level] of steps) {
    while (size > budget) {
      const can = parts.filter(p => p.group === group && p.level < Math.min(level, p.levels.length - 1))
      if (!can.length) break
      can.sort((a, b) => now(b) - now(a))
      can[0].level++
      size = total()
    }
    if (size <= budget) break
  }
  const trimmed = parts.filter(p => p.level > 0).map(p => `${p.label} (${(p.from / 1024).toFixed(1)} to ${kb(now(p))})`)
  return { parts, size, trimmed, over: size > budget }
}

export const kb = n => `${(n / 1024).toFixed(1)} KB`

// ---------------------------------------------------------------------------------------------------
// The pack
// ---------------------------------------------------------------------------------------------------

async function main() {
  const T = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../update-build-plan/tools')
  const { loadConfig, phaseStatus, stripPlanArg } = await import(path.join(T, 'config.mjs'))
  const { layoutsOf, requirementChanges, substanceVerdicts, sidesMany, substanceDiff, pathOf } = await import(path.join(T, 'req-changes.mjs'))
  const { decisionRows, decisionsGating, BASELINE_LINE } = await import(path.join(T, 'plan-docs.mjs'))
  const { loadStatuses, loadRecodes, normaliseStatus, outOfScopeRule } = await import(path.join(T, 'scope.mjs'))

  const ROOT = process.cwd()
  const config = loadConfig()
  const argv = stripPlanArg()
  const valueOf = f => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : null)
  const id = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--out')
  if (!id) { console.error('usage: phase-context.mjs <phase id> [--out <file>] [--plan <dir>]'); process.exit(2) }

  const raw = config.configExists ? JSON.parse(fs.readFileSync(path.join(ROOT, config.configFile), 'utf8')) : {}
  const runner = raw.runner ?? {}
  const ctx = runner.context ?? {}
  useVocabulary(ctx)
  const BUDGET = (ctx.budgetKB ?? 60) * 1024
  const FULL_ENTRY = (ctx.fullEntryKB ?? 8) * 1024

  const CU = config.plan
  const rd = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8')
  const exists = rel => fs.existsSync(path.join(ROOT, rel))
  const size = rel => (exists(rel) ? fs.statSync(path.join(ROOT, rel)).size : 0)
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  const isCommit = sha => { try { git('rev-parse', '--verify', '--quiet', `${sha}^{commit}`); return true } catch { return false } }
  const fm = (text, k) => (text.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1]?.trim().replace(/^"|"$/g, '')
  const fence = (lang, s) => `\`\`\`${lang}\n${s.replace(/```/g, '``​`')}\n\`\`\``

  const plan = JSON.parse(rd(`${CU}/plan.json`))
  const phase = plan.phases.find(p => p.num === id)
  const phaseIds = plan.phases.map(p => p.num)
  if (!phase) { console.error(`no phase "${id}" in ${CU}/plan.json (phases: ${plan.phases.map(p => p.num).join(' ')})`); process.exit(2) }
  const docPath = `${CU}/${phase.file}`
  const promptPath = `${CU}/${phase.prompt_file || phase.file.replace(/\.md$/, '.prompt.md')}`
  const doc = rd(docPath)
  const prompt = exists(promptPath) ? rd(promptPath) : ''
  const named = `${doc}\n${prompt}`
  const namedFlat = decodeURIComponent(named.replace(/%(?![0-9A-F]{2})/g, '%25')).replace(/\s+/g, ' ')

  const st = phaseStatus(config, ROOT)
  const progress = st.text
  const progressPath = config.progress
  const statusOf = n => (st.doneRows.includes(n) ? `DONE ${st.doneDate.get(n) || ''}`.trim() : st.inProgressRows.includes(n) ? 'IN PROGRESS' : st.built.includes(n) ? 'built (entry only)' : 'not built')
  const roadmapPath = `${CU}/ROADMAP.md`
  const roadmap = exists(roadmapPath) ? rd(roadmapPath) : ''
  const statuses = loadStatuses(ROOT, config.requirements)
  const recodes = loadRecodes(ROOT, config.requirements)
  const LAYOUTS = layoutsOf(config)
  const REQ = config.requirements

  const parts = []
  // Each level must be smaller than the one before it; a cut that saves nothing is dropped.
  const add = (key, group, label, levels) => parts.push({ key, group, label, levels: (Array.isArray(levels) ? levels : [levels]).filter((t, i, all) => i === 0 || Buffer.byteLength(t) < Buffer.byteLength(all[i - 1])) })
  const src = (p, h) => `_Source: \`${p}\`${h ? `, "${h}"` : ''}._`

  // ---- catalogue (front matter of every item, for status and scope) ----
  const STORIES = `${REQ}/stories`
  const catalogue = {}
  for (const f of fs.readdirSync(path.join(ROOT, STORIES)).filter(f => f.endsWith('.md'))) {
    const head = rd(`${STORIES}/${f}`).split('\n---')[0]
    const cid = f.replace(/\.md$/, '')
    catalogue[cid] = { id: cid, parent: fm(head, 'parent'), status: fm(head, 'status') ?? '', swimlane: fm(head, 'swimlane'), title: fm(head, 'title') }
  }
  const outOfScope = outOfScopeRule(catalogue, recodes, statuses.retired, config.outOfScopeLanes)
  const itemPath = cid => pathOf(cid, exists, LAYOUTS)
  const statusLabel = (cid, text) => statuses.label(/^(OQ|MS)-/.test(cid) ? 'question' : 'item', normaliseStatus(recodes, /^(OQ|MS)-/.test(cid) ? 'question' : 'item', fm(text, 'status')))

  // ================= 1. The phase =================
  {
    const self = statusOf(id)
    const s = [`## 1. The phase (plan.json)`, '', src(`${CU}/plan.json`, `phases[num=${id}]`), '']
    s.push(`**Phase ${id} · ${phase.title}** (track: ${phase.track || 'none'}; ${phase.est_sessions || '? sessions'}).`, '')
    if (self === 'IN PROGRESS') s.push(`**Status: IN PROGRESS.** Session 1 is built and frozen: build only what remains (its progress entry, below, says what; the log's last \`Checkpoint:\` line may show more built since). Its doc keeps its own drift-check baseline.`, '')
    else if (self.startsWith('DONE') || self.startsWith('built')) s.push(`**Status: ${self}.** This phase is already built; it is frozen. Follow-up work belongs in a later phase.`, '')
    else s.push(`**Status:** not built.`, '')
    s.push(`- **Goal:** ${phase.goal}`, `- **Delivers:** ${phase.delivers}`)
    s.push(`- **Covers:** ${phase.covers.length ? phase.covers.join(', ') : 'nothing (by design: no catalogue item, gap, delta or finding)'}`)
    s.push(`- **Depends on:** ${phase.depends_on.length ? phase.depends_on.map(n => `${n} (${statusOf(n)})`).join(', ') : 'nothing'}`)
    const waiting = plan.phases.filter(p => p.depends_on.includes(id)).map(p => p.num)
    if (waiting.length) s.push(`- **Phases that depend on this one:** ${waiting.join(', ')}`)
    if (phase.demo_triggers?.length) s.push(`- **Demo triggers:**`, ...phase.demo_triggers.map(t => `  - ${t}`))
    if (phase.blocked_by_oqs?.length) s.push(`- **Blocked by questions:** ${phase.blocked_by_oqs.join(', ')}`)
    if (phase.risks) s.push(`- **Risks:** in plan.json and the phase doc.`)
    const ms = (plan.milestones || []).filter(m => String(m.after) === id)
    for (const m of ms) s.push(`- **Milestone demo after this phase:** ${m.can_show || JSON.stringify(m)}`)
    s.push('', `Phase doc: \`${docPath}\` (${kb(size(docPath))}); kick-off prompt: \`${promptPath}\` (${kb(size(promptPath))}).`)
    add('phase', 'fixed', '1. Phase', s.join('\n'))

    // Where it sits in the run order (ROADMAP statements from config runner.context.runOrder, first that names it).
    let next = []
    const st_built = [...st.doneRows, ...st.built]
    const statements = (ctx.runOrder ?? []).map(r => { const sec = sectionOf(roadmap, r.section); const text = sec && passageAt(sec.text, r.marker); return text ? { ...r, text, line: sec.line } : null }).filter(Boolean)
    const ro = []
    for (const st of statements) {
      const pos = runOrderPosition(parseRunOrder(st.text, plan.phases), id, new Set(st_built))
      if (!pos) continue
      next = pos.next ? [pos.next] : []
      const few = l => (l.length > 8 ? `${l.slice(0, 8).join(', ')} and ${l.length - 8} more` : l.join(', ')) || 'none'
      ro.push(`**Run order** (\`${roadmapPath}\`, "${st.section}", "${st.marker.replace(/\*/g, '')}"): the phase before this one is ${pos.previous ?? 'none'}; the next unbuilt phase after it is ${pos.next ?? 'none'}. Its "then" step${pos.sameStep.length ? ` also holds ${few(pos.sameStep)}` : ' holds it alone'}; the step before: ${few(pos.previousStep)}; the step after: ${few(pos.nextStep)}.`, '', `> ${st.text}`)
      break
    }
    if (!ro.length && statements.length) ro.push(`**Run order:** no run-order statement in ROADMAP.md names ${id}; follow the dependencies above.`)
    // The plan page's status entries that name this phase or the next one.
    let status = null
    try { status = JSON.parse(rd(`${CU}/status.json`)) } catch {}
    const entries = status ? statusEntriesNaming(status, [id, ...next]) : []
    const stHead = `**Plan page status** (\`${CU}/status.json\`, the entries naming ${[id, ...next].join(' or ')}; verbatim; Stage 7 rewrites them):`
    const show = (k, v, n) => { const t = typeof v === 'string' ? v : JSON.stringify(v); return `- \`${k}\`: ${n && t.length > n ? `${t.slice(0, n)} … (cut)` : t}` }
    if (ro.length) add('run-order', 'fixed', '1. Run order', ro.join('\n'))
    if (status) add('status-json', 'roadmap', '1. status.json', entries.length ? [[stHead, '', ...entries.map(([k, v]) => show(k, v))].join('\n'), [stHead, '', ...entries.map(([k, v]) => show(k, v, 300))].join('\n')] : `${stHead} none.`)
    // The phase doc's session split.
    const split = sessionSplit(doc)
    if (split.estimated || split.heads.length) {
      const sp = [`**Sessions** (\`${docPath}\`):`, '', ...(split.estimated ? [`> ${split.estimated}`] : []), ...(split.heads.length ? ['', `Work-item headings: ${split.heads.map(h => `"${h}"`).join('; ')}.`] : [])].join('\n')
      add('sessions', 'fixed', '1. Sessions', split.estimated && split.estimated.length > 1200 ? [sp, sp.replace(split.estimated, `${split.estimated.slice(0, 1200)} … (cut)`)] : sp)
    }
  }

  // ================= 2. Drift check =================
  const covered = phase.covers.filter(c => /^(EP|FT|US)-/.test(c))
  const extra = diffIds(doc).filter(c => !covered.includes(c))
  const checkIds = [...covered, ...extra]
  const base = docBaseline(doc, BASELINE_LINE, isCommit)
  const baseline = base?.sha ?? plan.commit
  const baselineShort = baseline.slice(0, 7)
  const changes = requirementChanges({ cwd: ROOT, from: baseline, layouts: LAYOUTS })
  const changedById = new Map([...changes.items, ...changes.questions].map(c => [c.id, c]))
  // Every changed entry's two sides in one git read, and their substance verdicts from them.
  const { sides } = sidesMany({ cwd: ROOT, from: baseline, entries: [...changedById.values()] })
  const verdict = substanceVerdicts({ cwd: ROOT, from: baseline, entries: [...changedById.values()], req: REQ, sides })
  const substantive = new Map()
  {
    const s = [`## 2. Drift check since \`${baselineShort}\` (already run)`, '']
    s.push(`Baseline: \`${baselineShort}\`, ${base ? `the phase doc's own (\`${docPath}\`: "${base.line.trim().slice(0, 140)}${base.line.trim().length > 140 ? ' …' : ''}")` : `plan.json's (the phase doc names none)`}; compared with the working tree. Rename-aware (\`${config.tools}/req-changes.mjs\`); the full diff of any id, from this same baseline: \`node ${config.tools}/plan-state.mjs${config.planFlag} --diff <ID> --from ${baseline}\`.`, '')
    const cosmetic = []
    const unchanged = []
    for (const cid of checkIds) {
      const c = changedById.get(cid)
      if (!c) { unchanged.push(cid); continue }
      if (verdict.get(c)) substantive.set(cid, c)
      else cosmetic.push(cid)
    }
    if (!checkIds.length) s.push(`This phase covers no catalogue item and its doc names none to diff.`, '')
    else if (!substantive.size) s.push(`**Nothing changed since \`${baselineShort}\`** in substance for the ${checkIds.length} ids checked (${covered.length} covered, ${extra.length} more named by the doc's drift check).`, '')
    else s.push(`**${substantive.size} of ${checkIds.length} ids changed in substance since \`${baselineShort}\`:** ${[...substantive.keys()].join(', ')}. Re-read them and adjust the plan before building.`, '')
    if (unchanged.length) s.push(`- Unchanged: ${unchanged.join(', ')}.`)
    if (cosmetic.length) s.push(`- Changed only in links, sources, screenshots or order (no substance): ${cosmetic.join(', ')}.`)
    const gone = checkIds.filter(cid => catalogue[cid] && outOfScope(cid)).map(cid => `${cid} (${catalogue[cid].swimlane && config.outOfScopeLanes.includes(catalogue[cid].swimlane) ? catalogue[cid].swimlane : statuses.label('item', normaliseStatus(recodes, 'item', catalogue[cid].status))})`)
    const missing = checkIds.filter(cid => !/^(OQ|MS)-/.test(cid) && !catalogue[cid])
    s.push(`- Now Retired or out of scope: ${gone.length ? `${gone.join(', ')}. Drop them and say so in the progress entry.` : 'none.'}`)
    if (missing.length) s.push(`- No longer in the catalogue: ${missing.join(', ')}.`)
    if (changes.notesAdded.length || changes.changeLogsAdded.length) s.push(`- Added to the catalogue since: ${[...changes.notesAdded, ...changes.changeLogsAdded].map(f => `\`${path.basename(f)}\``).join(', ')}.`)
    s.push('')
    const diffParts = []
    for (const [cid, c] of substantive) {
      const d = substanceDiff({ cwd: ROOT, from: baseline, entry: c, sides: sides.get(c) })
      const now = c.change === 'D' ? 'deleted' : statusLabel(cid, rd(c.file))
      const head = `### ${cid} (${c.change === 'A' ? 'new' : c.change === 'D' ? 'deleted' : 'changed'}, now ${now}) · \`${c.file}\``
      const cutDiff = n => `${head}\n\n${fence('diff', d.length > n ? `${d.slice(0, n)}\n… (cut: the whole diff is \`node ${config.tools}/plan-state.mjs${config.planFlag} --diff ${cid} --from ${baseline}\`)` : d)}`
      diffParts.push([`${head}\n\n${fence('diff', d)}`, cutDiff(2500), cutDiff(900)])
    }
    // domain-model.md: which sections changed, and the diff of those the doc names.
    const dmFile = `${REQ}/domain-model.md`
    const dmText = exists(dmFile) ? rd(dmFile) : ''
    const dmHeads = headingsOf(dmText)
    const dmNamed = dmHeads.filter(h => h.level >= 2 && namedSection(h.title, namedFlat))
    let dmLines = [`**domain-model.md:** unchanged since \`${baselineShort}\`.`]
    let dmDiff = ''
    if (changes.domainModel.length) {
      const d = git('diff', '-U0', baseline, '--', dmFile)
      const hunks = [...d.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)].map(m => ({ start: +m[1], n: m[2] === undefined ? 1 : +m[2] }))
      const inSection = new Map()
      for (const h of hunks) {
        const sec = [...dmHeads].filter(x => x.line <= Math.max(h.start, 1)).pop()
        const k = sec ? sec.title : '(top)'
        inSection.set(k, (inSection.get(k) || 0) + Math.max(h.n, 1))
      }
      dmLines = [`**domain-model.md changed** since \`${baselineShort}\`, in: ${[...inSection].map(([k, n]) => `"${k}" (${n} line${n > 1 ? 's' : ''})`).join(', ')}.`]
      const namedChanged = dmNamed.filter(h => inSection.has(h.title))
      if (namedChanged.length) {
        const full = git('diff', '-U1', baseline, '--', dmFile)
        const blocks = full.split(/^(?=@@ )/m).slice(1).filter(b => { const m = b.match(/^@@ -\d+(?:,\d+)? \+(\d+)/); const at = m ? +m[1] : 0; return namedChanged.some(h => at >= h.line && at <= h.end) })
        dmDiff = blocks.join('').trim()
        dmLines.push(`Sections this phase's doc names that changed: ${namedChanged.map(h => `"${h.title}"`).join(', ')} (diff below).`)
      } else if (dmNamed.length) dmLines.push(`None of the sections the doc names (${dmNamed.map(h => `"${h.title}"`).join(', ')}) changed.`)
    }
    const dm = [dmLines.join(' '), ...(dmDiff ? ['', fence('diff', dmDiff)] : [])].join('\n')
    const dmShort = dmLines.join(' ') + (dmDiff ? `\n\n(diff left out: \`git diff ${baselineShort} -- "${dmFile}"\`)` : '')
    add('drift', 'fixed', '2. Drift check', s.join('\n').trimEnd())
    diffParts.forEach((lv, i) => add(`drift-diff-${i}`, 'diffs', `2. Drift diff ${[...substantive.keys()][i]}`, lv))
    add('drift-dm', 'diffs', '2. Domain model diff', [dm, dmShort])
  }

  // ================= 3. Owner decisions =================
  {
    const rows = decisionsGating(roadmap, id)
    const gatingIds = new Set(rows.map(r => r.split('|')[1].trim()))
    const namedIds = [...new Set([...named.matchAll(/\bD(\d+)\b/g)].map(m => `D${m[1]}`))]
    const others = decisionRows(roadmap).filter(r => { const d = r.split('|')[1].trim(); return namedIds.includes(d) && !gatingIds.has(d) })
    const header = roadmap.split('\n').find(l => /^\| # \| Decision/.test(l)) || '| # | Decision | Gates | Answer |'
    const s = [`## 3. Owner decisions that gate this phase`, '', src(roadmapPath, 'Owner decisions'), '']
    s.push(rows.length ? [header, '|---|---|---|---|', ...rows].join('\n') : 'None gate this phase.')
    const cut = n => [...s.slice(0, -1), [header, '|---|---|---|---|', ...rows.map(r => (r.length > n ? `${r.slice(0, n)} … (cut: open ROADMAP.md) |` : r))].join('\n')].join('\n')
    add('decisions', 'decisions', '3. Owner decisions', rows.length ? [s.join('\n'), cut(1200), cut(600)] : [s.join('\n')])
    if (others.length) {
      const full = ['', `**Also named by the phase doc or prompt** (they gate other phases):`, '', header, '|---|---|---|---|', ...others].join('\n')
      const short = ['', `**Also named by the phase doc or prompt** (they gate other phases; rows in \`${roadmapPath}\`): ${others.map(r => `${r.split('|')[1].trim()} (${r.split('|')[2].trim().slice(0, 80)})`).join('; ')}.`].join('\n')
      add('decisions-named', 'pointers', '3. Decisions the doc names', [full, short])
    }
  }

  // ================= 4. Catalogue items and questions =================
  {
    add('items-head', 'fixed', '4. Catalogue', [`## 4. Catalogue items covered (current text)`, '', covered.length ? `Front matter cut to id, title, status and parent; links shown as their text and target id. Files under \`${STORIES}/\`.` : 'This phase covers no catalogue items.'].join('\n'))
    for (const cid of covered) {
      const file = itemPath(cid)
      if (!exists(file)) { add(`item-${cid}`, 'catalogue', `4. ${cid}`, `### ${cid}: not in the catalogue any more.`); continue }
      const text = rd(file)
      const body = compactLinks((text.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/) || [, text])[1]).trim().replace(/^## /gm, '#### ')
      const sw = fm(text, 'swimlane')
      const head = `### ${cid} · ${fm(text, 'title')} · ${statusLabel(cid, text)}${sw ? ` · lane ${sw}` : ''}${fm(text, 'parent') ? ` · parent ${fm(text, 'parent')}` : ''}\n\n${src(file)}`
      const noNotes = body.replace(/\n#### (Notes|Technical discussion)\n[\s\S]*?(?=\n#### |$)/g, '').trim()
      const desc = body.split(/\n#### /)[0].trim()
      const acs = [...((body.match(/\n#### Acceptance criteria\n([\s\S]*?)(?=\n#### |$)/) || [, ''])[1].matchAll(/^- \*\*(.+?)\*\*/gm))].map(m => m[1].replace(/\.$/, ''))
      const brief = `${head}\n\n${desc.length > 600 ? `${desc.slice(0, 600)} …` : desc}${acs.length ? `\n\nAcceptance criteria: ${acs.join('; ')}.` : ''}\n\n_(Cut to fit: open the file for the full text.)_`
      const line = `### ${cid} · ${fm(text, 'title')} · ${statusLabel(cid, text)}\n\n${desc.split(/(?<=\.)\s/)[0].slice(0, 300)} _(Cut to fit: open \`${file}\`.)_`
      add(`item-${cid}`, 'catalogue', `4. ${cid}`, [`${head}\n\n${body}`, `${head}\n\n${noNotes}${noNotes !== body ? '\n\n_(Notes and technical discussion left out: open the file.)_' : ''}`, brief, line])
    }
    // Questions: named by the doc or prompt, by the covered items, or open and affecting a covered item.
    const qDir = `${REQ}/questions`
    const qIds = new Set()
    for (const m of named.matchAll(/\b(OQ-\d+)\b/g)) qIds.add(m[1])
    for (const cid of covered) { const f = itemPath(cid); if (exists(f)) for (const m of rd(f).matchAll(/\b(OQ-\d+)\b/g)) qIds.add(m[1]) }
    if (exists(qDir)) for (const f of fs.readdirSync(path.join(ROOT, qDir)).filter(f => f.endsWith('.md'))) {
      const t = rd(`${qDir}/${f}`)
      const aff = (t.match(/^affects:\n((?:\s+-.*\n?)+)/m) || [, ''])[1]
      if (fm(t, 'status') !== statuses.answered && covered.some(c => new RegExp(`-\\s*${esc(c)}\\s*$`, 'm').test(aff))) qIds.add(f.replace(/\.md$/, ''))
    }
    const open = []
    const recent = []
    const openBrief = []
    const recentBrief = []
    const older = []
    for (const q of [...qIds].sort((a, b) => parseInt(a.slice(3), 10) - parseInt(b.slice(3), 10))) {
      const f = `${qDir}/${q}.md`
      if (!exists(f)) continue
      const t = rd(f)
      const title = fm(t, 'title')
      const stat = statusLabel(q, t)
      const answered = normaliseStatus(recodes, 'question', fm(t, 'status')) === statuses.answered
      const body = compactLinks((t.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/) || [, t])[1])
      if (!answered) {
        const paras = body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
        const ask = paras.filter(p => !/^#/.test(p)).slice(0, 3).join(' ').replace(/\s+/g, ' ')
        const rec = (body.match(/^\**Recommendation\**:?.*$/im) || [''])[0]
        const affects = (t.match(/^affects:\n((?:\s+-.*\n?)+)/m) || [, ''])[1].split('\n').map(l => l.replace(/^\s*-\s*/, '').trim()).filter(Boolean).join(', ') || 'nothing listed'
        open.push(`- **${q} · ${title}** (${stat}; affects ${affects}): ${ask.slice(0, 700)}${ask.length > 700 ? ' …' : ''}${rec && !ask.includes(rec.slice(0, 40)) ? ` ${rec.slice(0, 400)}` : ''}`)
        openBrief.push(`- **${q} · ${title}** (${stat}): ${ask.slice(0, 250)}${ask.length > 250 ? ' …' : ''}`)
      } else if (changedById.has(q) && verdict.get(changedById.get(q))) {
        const ans = (body.match(/\n## Answer\n([\s\S]*?)(?=\n## |$)/) || [, ''])[1].replace(/\s+/g, ' ').trim()
        recent.push(`- **${q} · ${title}** (${stat}, answered or changed since \`${baselineShort}\`): ${ans.slice(0, 1000)}${ans.length > 1000 ? ' … (open the file)' : ''}`)
        recentBrief.push(`- **${q} · ${title}** (${stat}, since \`${baselineShort}\`): ${ans.slice(0, 300)}${ans.length > 300 ? ' …' : ''}`)
      } else older.push(`${q} (${title})`)
    }
    const s = [`### Questions`, '', `Named by the phase doc or prompt or by the covered items, or open and affecting a covered item. Files under \`${qDir}/\`.`, '']
    s.push(open.length ? `**Open, or waiting for a decision** (build the default the doc or the decision row states, logged for the owner):\n\n${open.join('\n')}` : '**Open:** none.', '')
    if (recent.length) s.push(`**Answered or changed since the baseline** (build as answered):\n\n${recent.join('\n')}`, '')
    if (older.length) s.push(`**Answered before the baseline** (already in the phase doc; build as answered): ${older.join('; ')}.`)
    const qShort = [`### Questions`, '', `Open: ${open.map(l => l.match(/\*\*(OQ-\d+)/)[1]).join(', ') || 'none'}. Answered since the baseline: ${recent.map(l => l.match(/\*\*(OQ-\d+)/)[1]).join(', ') || 'none'}. Answered before: ${older.map(o => o.split(' ')[0]).join(', ') || 'none'}. (Detail left out: open \`${qDir}/<id>.md\`.)`].join('\n')
    const qMid = [`### Questions`, '', `Cut to fit; files under \`${qDir}/\`.`, '', openBrief.length ? `**Open:**\n\n${openBrief.join('\n')}` : '**Open:** none.', ...(recentBrief.length ? ['', `**Answered or changed since the baseline:**\n\n${recentBrief.join('\n')}`] : []), ...(older.length ? ['', `**Answered before the baseline:** ${older.map(o => o.split(' ')[0]).join(', ')}.`] : [])].join('\n')
    add('questions', 'catalogue', '4. Questions', [s.join('\n').trimEnd(), qMid, qShort])
  }

  // ================= 5. Progress file =================
  if (progress) {
    add('progress-head', 'fixed', '5. Progress', [`## 5. From the progress file`, '', `Excerpts of \`${progressPath}\` (never read it whole; grep its headings for more).`].join('\n'))
    for (const name of ctx.progressSections ?? ['Binding conventions']) {
      const sec = sectionOf(progress, name)
      if (sec) add(`progress-${name}`, 'fixed', `5. ${sec.heading}`, `### ${sec.heading} (verbatim)\n\n${src(progressPath, sec.heading)}\n\n${sec.text.split('\n').slice(1).join('\n').trim()}`)
    }
    // Status rows of the dependencies (and this phase).
    const rows = progress.split('\n').filter(l => { const m = l.match(/^\|\s*([^|]+?)\s*\|/); return m && [...phase.depends_on, id].includes(m[1]) })
    const statusHead = progress.split('\n').find(l => /^\| # \| Phase/.test(l)) || '| # | Phase | Status | Session date | Notes |'
    if (rows.length) {
      const tab = r => [`### Status rows: this phase and its dependencies`, '', src(progressPath, 'Status'), '', statusHead, '|---|---|---|---|---|', ...r].join('\n')
      add('progress-status', 'progress', '5. Status rows', [tab(rows), tab(rows.map(r => (r.length > 400 ? `${r.slice(0, 400)} … |` : r))), tab(rows.map(r => (r.length > 160 ? `${r.slice(0, 160)} … |` : r)))])
    }
    // Phase entries: `### ... Phase <n> ...` to the next `### `.
    const lines = progress.split('\n')
    const entryAt = n => lines.findIndex(l => new RegExp(`^###\\s.*\\bPhase\\s+${esc(n)}\\b`).test(l))
    const entryOf = n => {
      const at = entryAt(n)
      if (at < 0) return null
      let end = lines.findIndex((l, i) => i > at && /^#{1,3}\s/.test(l))
      if (end < 0) end = lines.length
      return { line: at + 1, text: lines.slice(at, end).join('\n').trimEnd() }
    }
    const deps = phase.depends_on
    const many = deps.filter(n => st.built.includes(n)).length > 6
    const entryParts = []
    const builtDeps = deps.filter(n => st.built.includes(n) || st.inProgressRows.includes(n))
    const selfEntry = st.inProgressRows.includes(id) || st.built.includes(id) ? entryOf(id) : null
    if (selfEntry) add(`entry-self`, 'progress', `5. Own entry (Phase ${id})`, [`### This phase's own entry (${statusOf(id)}): session 1 is built and frozen\n\n${src(progressPath, `line ${selfEntry.line}`)}\n\n${selfEntry.text}`, ...entryLevels(selfEntry.text, id, { fullBytes: FULL_ENTRY }).slice(1).map(t => `### This phase's own entry (${statusOf(id)})\n\n${src(progressPath, `line ${selfEntry.line}`)}\n\n${t}`)])
    for (const n of builtDeps) {
      const e = entryOf(n)
      if (!e) continue
      const lv = entryLevels(e.text, id, { fullBytes: FULL_ENTRY }).map(t => `### Dependency ${n}: its entry\n\n${src(progressPath, `line ${e.line}`)}\n\n${t}`)
      lv.push(`### Dependency ${n}: ${e.text.split('\n')[0].replace(/^###\s+/, '')}\n\nLeft out to fit: read its handoff and owner's-review parts at \`${progressPath}\` line ${e.line} (${linesNaming(e.text, id).length} passages name ${id}).`)
      entryParts.push({ n, lv: many ? lv.slice(1) : lv })
    }
    if (deps.length) add('entries-head', 'fixed', '5. Entries head', `### Built dependencies' entries\n\nTrimmed to what this phase needs: the handoff, seams, deviations and owner's-review parts and every line naming ${id}; whole when under ${kb(FULL_ENTRY)}.${deps.filter(n => !builtDeps.includes(n)).length ? ` Not built yet: ${deps.filter(n => !builtDeps.includes(n)).join(', ')}.` : ''}`)
    for (const { n, lv } of entryParts) add(`entry-${n}`, 'progress', `5. Entry ${n}`, lv)
    // Other built phases' entries: the lines naming this phase.
    const others = []
    for (const m of progress.matchAll(/^###\s.*\bPhase\s+(\d{2}[a-z]?|[A-Z]\d+)\b.*$/gm)) {
      const n = m[1]
      if (deps.includes(n) || n === id) continue
      const e = entryOf(n)
      if (!e) continue
      const hits = linesNaming(e.text.split('\n').slice(1).join('\n'), id)
      if (hits.length) others.push({ n, line: e.line, title: e.text.split('\n')[0].replace(/^###\s+/, ''), hits })
    }
    if (others.length) {
      const full = [`### Other built phases' entries: the lines naming ${id}`, '', ...others.flatMap(o => [`**${o.title}** (${progressPath} line ${o.line}):`, ...o.hits.map(h => (h.startsWith('-') ? h : `- ${h}`)), ''])].join('\n').trimEnd()
      const short = [`### Other built phases' entries: the lines naming ${id}`, '', ...others.flatMap(o => [`**${o.title}** (line ${o.line}):`, ...o.hits.map(h => `- ${h.replace(/^- /, '').slice(0, 500)}${h.length > 500 ? ' …' : ''}`), ''])].join('\n').trimEnd()
      const shorter = [`### Other built phases' entries: the lines naming ${id}`, '', ...others.flatMap(o => [`**${o.title}** (line ${o.line}):`, ...o.hits.slice(0, 3).map(h => `- ${h.replace(/^- /, '').slice(0, 200)}${h.length > 200 ? ' …' : ''}`), ...(o.hits.length > 3 ? [`- _(${o.hits.length - 3} more)_`] : []), ''])].join('\n').trimEnd()
      const list = [`### Other built phases' entries that name ${id}`, '', `Cut to fit; grep each entry for "${id}": ${others.map(o => `${o.n} (line ${o.line}, ${o.hits.length})`).join(', ')}.`].join('\n')
      add('entries-others', 'progress', '5. Other entries naming this phase', [full, short, shorter, list])
    }
    // Decisions-log entries the doc names by date and title.
    // The progress file's decisions log and handoff list (config runner.context.decisionsSection and
    // handoffSection; a configured name the file lacks is noted).
    const dlName = typeof ctx.decisionsSection === 'string' && ctx.decisionsSection ? ctx.decisionsSection : 'Decisions log'
    const hoName = typeof ctx.handoffSection === 'string' && ctx.handoffSection ? ctx.handoffSection : 'Discovered for later'
    const dl = sectionOf(progress, dlName)
    const lacking = [[ctx.decisionsSection, dl, 'decisionsSection'], [ctx.handoffSection, sectionOf(progress, hoName), 'handoffSection']].filter(([given, sec]) => typeof given === 'string' && given && !sec)
    if (progress && lacking.length) add('sections-missing', 'fixed', '5. Sections not found', lacking.map(([given, , key]) => `_The progress file has no section headed "${given}" (config runner.context.${key}), so nothing was read from it._`).join('\n'))
    if (dl) {
      const picked = decisionsNamed(named, decisionLogEntries(dl.text, dl.line))
      if (picked.length) {
        const full = [`### Decisions-log entries the phase doc names`, '', src(progressPath, dl.heading), '', ...picked.map(e => `${e.text.length > 3000 ? `${e.text.slice(0, 3000)} … (cut; line ${e.line})` : e.text}`)].join('\n')
        const short = [`### Decisions-log entries the phase doc names`, '', ...picked.map(e => `- **${e.date} · ${e.title}** (${progressPath} line ${e.line})`)].join('\n')
        add('decisions-log', 'progress', '5. Decisions log', [full, short])
      }
    }
    const ho = sectionOf(progress, hoName)
    if (ho) {
      const items = ho.text.split(/\n(?=\d+\.\s|- )/).filter(b => mentions(b, id))
      if (items.length) add('handoff-list', 'progress', '5. Handoff list', [[`### "${ho.heading}" items naming ${id}`, '', ...items.map(i => i.trim())].join('\n'), `### "${ho.heading}": ${items.length} item(s) name ${id} (${progressPath} line ${ho.line}).`])
    }
  }

  // ================= 6. ROADMAP =================
  if (roadmap) {
    add('roadmap-head', 'fixed', '6. Roadmap', `## 6. From ROADMAP.md\n\n${src(roadmapPath)}`)
    const seq = sectionOf(roadmap, ctx.sequencingSection ?? 'Sequencing rules')
    if (seq) {
      const rules = rulesFor(seq.text, id, ctx.sequencingAlways ?? [])
      const title = `### ${seq.heading}: the rules naming ${id}, and those every phase follows\n\n${src(roadmapPath, `${seq.heading}, line ${seq.line}`)}\n\n`
      const always = r => (ctx.sequencingAlways ?? []).some(a => r.label.toLowerCase().startsWith(a.toLowerCase()))
      add('seq', 'roadmap', '6. Sequencing rules', [
        title + rules.map(r => r.text).join('\n'),
        title + rules.map(r => (always(r) ? r.text : focusBlock(r.text, id, 1500))).join('\n'),
        title + rules.map(r => (always(r) ? r.text : focusBlock(r.text, id, 600))).filter(Boolean).join('\n'),
        title + rules.map(r => (always(r) ? leadsOnly(r.text) : focusBlock(r.text, id, 600))).filter(Boolean).join('\n'),
      ])
    }
    for (const name of ctx.roadmapSections ?? []) {
      const sec = sectionOf(roadmap, name)
      if (!sec) continue
      const body = focusSection(phaseRowsOnly(sec.text, id).split('\n').slice(1).join('\n'), id, 900, phaseIds)
      const h = `### ${sec.heading} (standing rule; \`${roadmapPath}\` line ${sec.line})`
      const leads = `${h}\n\n${leadsOnly(body)}\n\n_(Cut to each rule's first sentence to fit: open the source for the rest.)_`
      add(`rm-${name}`, 'standing', `6. ${sec.heading}`, leads.length < h.length + body.length ? [`${h}\n\n${body}`, leads] : [`${h}\n\n${body}`])
    }
  }

  // ================= 7. Pointers =================
  {
    const s = [`## 7. Pointers (open these only where you need more)`, '']
    const units = [...phase.covers]
    let gaps = null
    try { gaps = JSON.parse(rd(`${CU}/gaps.json`)) } catch {}
    const gapOf = new Map(gaps ? [...gaps.items, ...(gaps.dataModelDeltas || []), ...(gaps.reverseFindings || [])].map(x => [x.id, x]) : [])
    const lineOf = (file, re) => { if (!exists(file)) return null; const i = rd(file).split('\n').findIndex(l => re.test(l)); return i < 0 ? null : i + 1 }
    const gapRows = []
    for (const u of units) {
      const g = gapOf.get(u)
      const where = []
      const ga = lineOf(`${CU}/GAP-ANALYSIS.md`, new RegExp(`^\\|\\s*(\\[${esc(u)}\\]|${esc(u)}\\b)`))
      if (ga) where.push(`GAP-ANALYSIS.md:${ga}`)
      if (/^(EP|FT|US)-(\d+)/.test(u)) {
        const ep = `EP-${u.match(/-(\d+)/)[1]}`
        const l = lineOf(`${CU}/epics/${ep}.md`, new RegExp(`^#+\\s+${esc(u)}\\b`))
        if (l) where.push(`epics/${ep}.md:${l}`)
      }
      if (/^DM-/.test(u)) { const l = lineOf(`${CU}/analysis/domain-model-delta.md`, new RegExp(`^#+\\s+${esc(u)}\\b`)); if (l) where.push(`analysis/domain-model-delta.md:${l}`) }
      if (/^RV-/.test(u)) { const l = lineOf(`${CU}/analysis/reverse-check.md`, new RegExp(`^#+\\s+${esc(u)}\\b`)); if (l) where.push(`analysis/reverse-check.md:${l}`) }
      const what = !g ? 'no gap entry (Matches or closed)' : g.verdict ? `${g.verdict}, size ${g.size || '?'}: ${String(g.summary || '').slice(0, 220)}` : `${g.kind || ''}, size ${g.size || '?'}: ${String(g.title || '').slice(0, 200)}`
      gapRows.push(`- **${u}** · ${where.join(' · ') || 'no anchor'} · ${what}`)
    }
    s.push(`**Gap analysis anchors** (paths under \`${CU}/\`, \`file:line\`):`, '')
    const gapHead = s.join('\n')
    add('gaps', 'pointers', '7. Gap anchors', [`${gapHead}\n${(gapRows.length ? gapRows : ['- none (this phase covers no unit).']).join('\n')}`, `${gapHead}\n${(gapRows.length ? gapRows.map(r => r.replace(/ · [^·]*$/, '')) : ['- none (this phase covers no unit).']).join('\n')}`])
    s.length = 0

    // Code maps.
    const mapKeys = (config.gapAnalysis?.maps || []).map(m => m.key)
    const maps = mapKeys.map(k => `${CU}/analysis/${config.appNoun}-map-${k}.md`).filter(exists)
    const namedMaps = maps.filter(m => namedFlat.includes(path.basename(m)) || namedFlat.includes(path.basename(m, '.md')))
    if (maps.length) {
      const head = `**Code maps** (\`${CU}/analysis/\`; the code is the truth, the maps are leads):`
      const rest = maps.filter(m => !namedMaps.includes(m))
      const also = rest.length ? [`- Also: ${rest.map(m => `\`${path.basename(m)}\` (${kb(size(m))})`).join(', ')}`] : []
      const full = [head, '', ...namedMaps.map(m => `- \`${path.basename(m)}\` (${kb(size(m))}, named by the doc): ${headingsOf(rd(m)).filter(h => h.level === 2).map(h => `${h.title.replace(/`/g, '')} :${h.line}`).join(' · ')}`), ...also]
      const short = [head, '', `- Named by the doc: ${namedMaps.map(m => `\`${path.basename(m)}\` (${kb(size(m))})`).join(', ') || 'none'} (grep their \`## \` headings).`, ...also]
      add('maps', 'pointers', '7. Code maps', [full.join('\n'), short.join('\n')])
    }

    // Domain model sections the doc names.
    const dmFile = `${REQ}/domain-model.md`
    if (exists(dmFile)) {
      const hs = headingsOf(rd(dmFile)).filter(h => h.level >= 2 && namedSection(h.title, namedFlat))
      s.push(`**Domain model** (\`${dmFile}\`, ${kb(size(dmFile))}): ${hs.length ? `the sections the doc names: ${hs.map(h => `"${h.title}" lines ${h.line} to ${h.end}`).join('; ')}.` : 'the doc names no section of it.'}`, '')
    }

    // Design files.
    const designDir = ctx.designDir
    if (designDir && exists(designDir)) {
      const files = fs.readdirSync(path.join(ROOT, designDir)).filter(f => /\.html?$/.test(f))
      const hit = files.filter(f => namedFlat.includes(f))
      s.push(`**Design files the doc names** (\`${designDir}/\`): ${hit.length ? hit.map(f => `${f} (${kb(size(`${designDir}/${f}`))})`).join(', ') : 'none named'}.`, '')
    }

    // Artifacts named.
    const arIds = [...new Set([...named.matchAll(/\bAR-(\d+)\b/g)].map(m => `AR-${m[1]}`))]
    if (arIds.length) {
      const rows = arIds.map(a => {
        const f = `${REQ}/artifacts/${a}.md`
        if (!exists(f)) return `- ${a}: no sidecar`
        const t = rd(f)
        const file = fm(t, 'file')
        return `- **${a}** · ${fm(t, 'title')} · ${fm(t, 'status') || ''} · sidecar \`${f}\`${file ? ` · file \`${REQ}/${file}\` (${kb(size(`${REQ}/${file}`))})` : ''}`
      })
      s.push(`**Artifacts the doc or prompt names:**`, '', ...rows, '')
    }

    // Other documents named (Markdown and HTML outside the app's code), with size.
    const docRefs = new Set()
    const resolveRef = (ref, fromDir) => {
      const clean = decodeURIComponent(ref.replace(/#.*$/, '').replace(/%(?![0-9A-F]{2})/g, '%25'))
      for (const cand of [path.normalize(path.join(fromDir, clean)), path.normalize(clean)]) if (exists(cand) && fs.statSync(path.join(ROOT, cand)).isFile()) return cand
      return null
    }
    for (const m of named.matchAll(/\]\(([^)\s]+\.(?:md|html))(?:#[^)]*)?\)|`([^`\s]+\.(?:md|html))`/g)) {
      const r = resolveRef(m[1] || m[2], path.dirname(docPath))
      const covered = [docPath, promptPath, progressPath, roadmapPath, config.captureAtlas, `${REQ}/domain-model.md`].filter(Boolean)
      if (r && !covered.includes(r) && !r.startsWith(STORIES) && !r.startsWith(`${REQ}/questions`) && !r.startsWith(`${REQ}/artifacts`) && !maps.includes(r) && !(designDir && r.startsWith(`${designDir}/`)) && !(config.appCode || []).some(c => r.startsWith(c))) docRefs.add(r)
    }
    if (docRefs.size) {
      // Large Markdown ones with their section outline, so a section can be read by line range.
      const outline = r => {
        if (!r.endsWith('.md') || size(r) < 15 * 1024) return ''
        const hs = headingsOf(rd(r))
        const lv = hs.filter(h => h.level === 2).length >= 3 ? 2 : 3
        const pick = hs.filter(h => h.level === lv)
        return pick.length ? `: ${pick.slice(0, 30).map(h => `${h.title.replace(/`/g, '').slice(0, 60)} :${h.line}`).join(' · ')}${pick.length > 30 ? ' · …' : ''}` : ''
      }
      const refs = [...docRefs].sort()
      add('pointers-docs-head', 'fixed', '7. Pointers', s.join('\n').trimEnd())
      s.length = 0
      const head = `**Other documents the doc or prompt names** (size; the large ones' sections with their line):`
      add('docs', 'pointers', '7. Documents named', [[head, '', ...refs.map(r => `- \`${r}\` (${kb(size(r))})${outline(r)}`)].join('\n'), [head, '', ...refs.map(r => `- \`${r}\` (${kb(size(r))})`)].join('\n')])
    }

    // Capture recipes.
    if (config.capture) {
      const shotSec = sectionOf(doc, 'Catalogue screenshots')
      const ids = shotSec ? [...new Set([...shotSec.text.matchAll(/\b((?:EP|FT|US)-[\d.]*\d)\b/g)].map(m => m[1]))] : []
      let owned = ''
      try { owned = execFileSync('node', [path.join(T, 'recipe-status.mjs'), '--plan', config.plan, id], { cwd: ROOT, encoding: 'utf8' }).trim() } catch (e) { owned = String(e.stdout || e.message).trim() }
      const ownedIds = new Set([...owned.matchAll(/^\s+((?:EP|FT|US)-[\d.]*\d)\s/gm)].map(m => m[1]))
      const others = ids.filter(x => !ownedIds.has(x))
      const has = others.filter(x => exists(`${config.captureRecipes}/${x}.json`))
      const also = [...(has.length ? [`with a recipe: ${has.join(', ')}`] : []), ...(has.length < others.length ? [`no recipe: ${others.filter(x => !has.includes(x)).join(', ')}`] : [])]
      s.push(`**Catalogue screenshots** (recipes in \`${config.captureRecipes}/\`; the doc's "Catalogue screenshots" section says what to do):`, '', fence('', owned || 'recipe-status printed nothing'), '')
      if (also.length) s.push(`Also named in that section (recipes it may break or re-shoot), ${also.join('; ')}.`, '')
      const breaks = recipesBreaks(doc)
      if (breaks) {
        add('pointers-capture', 'fixed', '7. Pointers', s.join('\n').trimEnd())
        s.length = 0
        const h = `**The doc's "Recipes this phase breaks"** (\`${docPath}\`, "Catalogue screenshots"):`
        add('breaks', 'pointers', '7. Recipes this phase breaks', [`${h}\n\n${breaks}`, `${h}\n\n${breaks.length > 1500 ? `${breaks.slice(0, 1500)} … (cut: open the doc)` : breaks}`])
      }
      if (config.captureAtlas && exists(config.captureAtlas)) s.push(`ATLAS (\`${config.captureAtlas}\`, ${kb(size(config.captureAtlas))}) sections: ${headingsOf(rd(config.captureAtlas)).filter(h => h.level === 2).map(h => `${h.title.replace(/`/g, '')} :${h.line}`).join(' · ')}.`, '')
    }
    add('pointers-rest', 'fixed', '7. Pointers', s.join('\n').trimEnd())
  }

  // ================= Fit, write =================
  // Fit the parts, then again with less room if the header (which lists what was trimmed) tips it over.
  const HEAD_SHA = git('rev-parse', '--short', 'HEAD').trim()
  const render = fit => {
    const head = [
      `# Context pack · Phase ${id} · ${phase.title}`,
      '',
      `Written by \`${path.relative(ROOT, fileURLToPath(import.meta.url))}\` at HEAD \`${HEAD_SHA}\` (working tree). Read this, then the phase doc \`${docPath}\`, instead of the reading list in the kick-off prompt: every excerpt below names its source, and the prompt's other instructions still stand. Open a source only where you need more than its excerpt.`,
      '',
    ]
    if (fit.trimmed.length) head.push(`**Trimmed to fit ${kb(BUDGET)}** (each excerpt says what it left out; open its source for the rest): ${fit.trimmed.join('; ')}.${fit.over ? ' Still over budget: everything left is the phase entry, the house rules and the decisions that gate it.' : ''}`, '')
    return `${head.join('\n')}\n${parts.map(p => p.levels[p.level]).join('\n\n')}\n`
  }
  // The cutting order: the progress file's excerpts first, then pointers and ROADMAP excerpts, the
  // catalogue's text and the decisions that gate the phase last.
  const ORDER = [['progress', 1], ['pointers', 1], ['roadmap', 1], ['diffs', 1], ['progress', 2], ['roadmap', 2], ['standing', 1], ['roadmap', 3], ['catalogue', 1], ['diffs', 2], ['progress', 3], ['catalogue', 2], ['decisions', 1], ['decisions', 2], ['catalogue', 3]]
  let room = BUDGET
  let fit
  let text
  for (let i = 0; i < 4; i++) {
    for (const p of parts) p.level = 0
    fit = fitBudget(parts, room, ORDER, t => Buffer.byteLength(t) + 2)
    text = render(fit)
    const over = Buffer.byteLength(text) - BUDGET
    if (over <= 0 || fit.over) break
    room -= over + 512
  }
  fit.over = Buffer.byteLength(text) > BUDGET
  text = render(fit)
  const toStdout = argv.includes('--stdout')
  const say = toStdout ? (...a) => console.error(...a) : (...a) => console.log(...a)
  let where = 'stdout'
  if (toStdout) process.stdout.write(text)
  else {
    const out = valueOf('--out') ? path.resolve(ROOT, valueOf('--out')) : path.join(ROOT, runner.logDir ?? '.build-phase', `${id}.md`)
    fs.mkdirSync(path.dirname(out), { recursive: true })
    if (!valueOf('--out')) { const ig = path.join(path.dirname(out), '.gitignore'); if (!fs.existsSync(ig)) fs.writeFileSync(ig, '*\n') }
    fs.writeFileSync(out, text)
    where = path.relative(ROOT, out)
  }
  const bySection = new Map()
  for (const p of parts) { const k = p.label.match(/^\d+/)?.[0] ?? '?'; bySection.set(k, (bySection.get(k) || 0) + Buffer.byteLength(p.levels[p.level]) + 2) }
  say(`${where} ${kb(Buffer.byteLength(text))} (budget ${kb(BUDGET)})`)
  say(`sections: ${[...bySection].map(([k, n]) => `${k} ${kb(n)}`).join(' · ')}`)
  if (fit.trimmed.length) say(`trimmed: ${fit.trimmed.join('; ')}`)
}

/** Is a domain-model heading named by the doc: quoted ("Booking"), or "the Booking section" / "Booking and Party sections"? */
export function namedSection(title, flat) {
  const t = title.replace(/^\d+(\.\d+)*\.?\s+/, '').trim()
  if (t.length < 3) return false
  if (flat.includes(`"${t}"`) || flat.includes(`“${t}”`)) return true
  const re = new RegExp(`\\b${esc(t)}\\b(?:[^.]{0,60}?)\\bsections?\\b`)
  const dm = /domain model/i
  for (const m of flat.matchAll(new RegExp(esc(t), 'g'))) {
    const around = flat.slice(Math.max(0, m.index - 200), m.index + t.length + 80)
    if (dm.test(around) && re.test(flat.slice(m.index, m.index + t.length + 80))) return true
  }
  return false
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
