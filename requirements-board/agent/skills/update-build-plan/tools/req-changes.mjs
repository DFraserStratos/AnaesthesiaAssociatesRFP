// What changed in the requirements catalogue between two refs (or a ref and the working tree), by ID.
// Rename-aware: a catalogue can have lived in more than one place (its layouts, newest first: the
// board's requirements folder, then the plan config's `olderCatalogues`), and a plan's baseline can
// predate a move, so the diff spans every layout with rename detection. A pure move (R100) is not a
// change; a file moved and edited counts as changed; old-path entries map to IDs the same way as new
// ones. Used by plan-state.mjs; tested by req-changes.test.mjs.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { recodesPath, loadRecodes, normaliseStatus } from './scope.mjs'

/** The board's layout of a requirements folder. */
export const boardLayout = root => ({ root, items: 'stories', questions: 'questions', notes: 'notes', changes: 'changes', domainModel: 'domain-model.md' })
/** Every layout the catalogue has had, newest first, from a loaded plan config. */
export const layoutsOf = config => [boardLayout(config.requirements), ...(config.olderCatalogues || []).map(L => ({ ...boardLayout(L.root), ...L }))]
export const LAYOUTS = [boardLayout('requirements-board/requirements')]
const KINDS = ['items', 'questions', 'notes', 'changes']

/** Every path the catalogue's tracked parts have had, for a pathspec. */
export const pathspecs = (layouts = LAYOUTS) =>
  layouts.flatMap(L => [...KINDS.map(k => `${L.root}/${L[k]}`), `${L.root}/${L.domainModel}`])

/** { kind, id } for a repo-relative path in any layout, or null. */
export function classify(file, layouts = LAYOUTS) {
  for (const L of layouts) {
    if (file === `${L.root}/${L.domainModel}`) return { kind: 'domainModel', id: 'domain-model' }
    for (const k of KINDS) if (file.startsWith(`${L.root}/${L[k]}/`) && file.endsWith('.md')) return { kind: k, id: path.basename(file, '.md') }
  }
  return null
}

/** The current path of an item or question by ID, in the first layout where it exists (or the newest). */
export function pathOf(id, exists, layouts = LAYOUTS) {
  const kind = /^(OQ|MS)-/.test(id) ? 'questions' : 'items'
  const all = layouts.map(L => `${L.root}/${L[kind]}/${id}.md`)
  return all.find(exists) ?? all[0]
}

/**
 * Changes from `from` to `to` (default: the working tree, with untracked files).
 * Returns { items, questions: [{ id, change, file, was? }], notesAdded, changeLogsAdded: [file], domainModel: [entry] }.
 * `change` is A, M or D. Notes and change logs count as added only when new (a moved or path-fixed one existed already).
 */
export function requirementChanges({ cwd, from, to = null, layouts = LAYOUTS }) {
  const git = (...a) => execFileSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const specs = pathspecs(layouts)
  const range = to ? [from, to] : [from]
  const entries = git('diff', '-M', '-l0', '--name-status', ...range, '--', ...specs).split('\n').filter(Boolean).flatMap(line => {
    const [st, a, b] = line.split('\t')
    if (st.startsWith('R')) return Number(st.slice(1)) === 100 ? [] : [{ change: 'M', file: b, was: a }]
    return [{ change: st[0], file: a }]
  })
  if (!to) for (const file of git('ls-files', '--others', '--exclude-standard', '--', ...specs).split('\n').filter(Boolean)) entries.push({ change: 'A', file })

  const out = { items: [], questions: [], notesAdded: [], changeLogsAdded: [], domainModel: [] }
  const byId = { items: new Map(), questions: new Map() }
  // A note or log moved with its links rewritten can fall under git's similarity threshold: the same
  // file name deleted in one layout and added in another is the same file, not a new one.
  const deleted = new Set(entries.filter(e => e.change === 'D').map(e => `${classify(e.file, layouts)?.kind}:${path.basename(e.file)}`))
  const isNew = (e, kind) => e.change === 'A' && !deleted.has(`${kind}:${path.basename(e.file)}`)
  for (const e of entries) {
    const c = classify(e.file, layouts)
    if (!c) continue
    if (c.kind === 'domainModel') { if (!(e.change === 'D' && entries.some(x => x.change === 'A' && classify(x.file, layouts)?.kind === 'domainModel'))) out.domainModel.push(e) }
    else if (c.kind === 'notes') { if (isNew(e, 'notes')) out.notesAdded.push(e.file) }
    else if (c.kind === 'changes') { if (isNew(e, 'changes')) out.changeLogsAdded.push(e.file) }
    else {
      // A move git could not pair (under its similarity threshold) shows as D at one path and A at the other.
      const seen = byId[c.kind].get(c.id)
      if (seen && seen.change !== e.change && [seen.change, e.change].sort().join('') === 'AD') {
        const added = seen.change === 'A' ? seen : e
        byId[c.kind].set(c.id, { id: c.id, change: 'M', file: added.file, was: (seen.change === 'D' ? seen : e).file })
      } else if (!seen) byId[c.kind].set(c.id, { id: c.id, change: e.change, file: e.file, ...(e.was ? { was: e.was } : {}) })
    }
  }
  out.items = [...byId.items.values()]
  out.questions = [...byId.questions.values()]
  return out
}

// Fields and markup that are not requirement substance: links to evidence and other items, ordering,
// board lanes and screenshots. An item that changed only in these needs no re-grading.
export const COSMETIC_FIELDS = ['artifacts', 'related', 'sources', 'order', 'swimlane', 'images']

/**
 * An item or question's text with cosmetic front-matter fields and link markup taken out. Its status
 * reads as today's code (`recodes`, from scope.mjs `loadRecodes`), so a recode alone is no change.
 */
export function substance(text, recodes = [], kind = 'item') {
  if (text == null) return null
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const fm = m ? m[1] : ''
  const body = m ? m[2] : text
  let skip = false
  const kept = fm.split('\n').filter(line => {
    const key = line.match(/^([A-Za-z_]+):/)
    if (key) skip = COSMETIC_FIELDS.includes(key[1])
    return !skip
  }).map(line => line.replace(/^status:\s*(.*?)\s*$/, (_, v) => `status: ${normaliseStatus(recodes, kind, v.replace(/^(['"])(.*)\1$/, '$2'))}`))
  const unlink = s => s.replace(/\[([^\]]*)\]\((?![a-z]+:\/\/)[^)]*\)/g, '$1')
  return `${kept.join('\n')}\n---\n${unlink(body)}`.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim()
}

/** A changed entry's text at `from` and at `to` (default: the working tree); null where it does not exist. */
export function sidesOf({ cwd, from, to = null, entry }) {
  const show = (ref, file) => {
    try { return execFileSync('git', ['show', `${ref}:${file}`], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }) } catch { return null }
  }
  const before = entry.change === 'A' ? null : show(from, entry.was ?? entry.file)
  const after = entry.change === 'D' ? null : to ? show(to, entry.file) : (() => { try { return fs.readFileSync(path.join(cwd, entry.file), 'utf8') } catch { return null } })()
  return { before, after }
}

/** An item or question's text without its cosmetic front-matter fields (COSMETIC_FIELDS); the body as it is. */
export function withoutCosmetic(text) {
  if (text == null) return ''
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return text
  let skip = false
  const kept = m[1].split('\n').filter(line => {
    const key = line.match(/^([A-Za-z_]+):/)
    if (key) skip = COSMETIC_FIELDS.includes(key[1])
    return !skip
  })
  return `---\n${kept.join('\n')}\n---\n${m[2]}`
}

/**
 * A unified diff of two texts, hunks only (`@@ -a,n +b,m @@` then ' ', '-' and '+' lines), `context`
 * lines around each change. In-process (LCS), so it writes nothing: for catalogue-sized files.
 */
export function unifiedDiff(a, b, context = 2) {
  const A = a === '' ? [] : a.replace(/\n$/, '').split('\n')
  const B = b === '' ? [] : b.replace(/\n$/, '').split('\n')
  const n = A.length, m = B.length
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const ops = []
  let i = 0, j = 0
  while (i < n || j < m) {
    if (i < n && j < m && A[i] === B[j]) { ops.push([' ', A[i], i, j]); i++; j++ }
    else if (i < n && (j === m || L[i + 1][j] >= L[i][j + 1])) { ops.push(['-', A[i], i, j]); i++ }
    else { ops.push(['+', B[j], i, j]); j++ }
  }
  const out = []
  let k = 0
  while (k < ops.length) {
    if (ops[k][0] === ' ') { k++; continue }
    let s = Math.max(0, k - context)
    let e = k
    while (e < ops.length) {
      if (ops[e][0] !== ' ') { e++; continue }
      let run = e
      while (run < ops.length && ops[run][0] === ' ') run++
      if (run === ops.length || run - e > 2 * context) { e = Math.min(run, e + context); break }
      e = run
    }
    const h = ops.slice(s, e)
    const aN = h.filter(o => o[0] !== '+').length, bN = h.filter(o => o[0] !== '-').length
    out.push(`@@ -${h[0][2] + (aN ? 1 : 0)},${aN} +${h[0][3] + (bN ? 1 : 0)},${bN} @@`, ...h.map(o => o[0] + o[1]))
    k = e
  }
  return out.join('\n')
}

/**
 * The unified diff of a changed entry with cosmetic front-matter fields left out on both sides (so a diff
 * shows only what a reader of the requirement would notice), hunks only, `context` lines around each.
 */
export function substanceDiff({ cwd, from, to = null, entry, context = 2 }) {
  const { before, after } = sidesOf({ cwd, from, to, entry })
  return unifiedDiff(before == null ? '' : withoutCosmetic(before), after == null ? '' : withoutCosmetic(after), context)
}

/** True when a changed entry from requirementChanges() differs in substance (a real status move included; a recode is not). */
export function changedInSubstance({ cwd, from, to = null, entry, req = LAYOUTS[0].root }) {
  if (entry.change !== 'M') return true
  const show = (ref, file) => {
    try { return execFileSync('git', ['show', `${ref}:${file}`], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }) } catch { return null }
  }
  const { before, after } = sidesOf({ cwd, from, to, entry })
  // The newest recode list covers every older baseline: read it from the target side, else the working tree.
  const recodes = (() => {
    const text = to ? show(to, recodesPath(req)) : null
    try { return text ? JSON.parse(text) : loadRecodes(cwd, req) } catch { return [] }
  })()
  const kind = /^(OQ|MS)-/.test(entry.id) ? 'question' : 'item'
  return substance(before, recodes, kind) !== substance(after, recodes, kind)
}
