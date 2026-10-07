// What changed in the requirements catalogue between two refs (or a ref and the working tree), by ID.
// Rename-aware: the catalogue has lived in more than one place (LAYOUTS, newest first), and a plan's
// baseline can predate a move, so the diff spans every layout with rename detection. A pure move
// (R100) is not a change; a file moved and edited counts as changed; old-path entries map to IDs the
// same way as new ones. Used by plan-state.mjs; tested by req-changes.test.mjs.
import path from 'node:path'
import { execFileSync } from 'node:child_process'

export const LAYOUTS = [
  { root: 'requirements-board/requirements', items: 'stories', questions: 'questions', notes: 'notes', changes: 'changes', domainModel: 'domain-model.md' },
  { root: 'docs/discovery-reference/Updated Requirements', items: 'catalogue/requirements', questions: 'catalogue/questions', notes: 'catalogue/notes', changes: 'changes', domainModel: 'domain-model.md' },
]
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
