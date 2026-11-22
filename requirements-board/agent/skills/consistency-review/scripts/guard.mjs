// What an accepted edit may touch, and how a decision is tied to the change it was made on.
// Shared by build-review.mjs (marks edits that will not apply) and apply.mjs (refuses them).
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { artifactFilePath, isRetiredArtifact } from './board-kit.mjs'

// The catalogue folders an edit never touches: notes are append only, change logs and reference are records.
const RECORD_FOLDERS = new Set(['notes', 'changes', 'reference'])

/** The real path of `abs`, following links, even when the file (or some of its folders) does not exist yet. */
function realish(abs) {
  let dir = abs
  const rest = []
  for (;;) {
    try {
      return path.join(fs.realpathSync(dir), ...rest.reverse())
    } catch {
      const up = path.dirname(dir)
      if (up === dir) return abs
      rest.push(path.basename(dir))
      dir = up
    }
  }
}

const inside = (child, parent) => {
  const r = path.relative(parent, child)
  return r === '' || (r !== '..' && !r.startsWith('..' + path.sep) && !path.isAbsolute(r))
}

const frontmatter = (text) => text.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
const field = (fm, key) => {
  const m = fm.match(new RegExp(`^${key}:[ \\t]*(.*)$`, 'm'))
  return m ? m[1].trim().replace(/^(['"])(.*)\1$/, '$2') : ''
}

/**
 * The edit rules for one run. repo: the repository root; req: the catalogue folder relative to it;
 * protectedIds: artifact ids nobody may edit (their sidecar and their drawn file).
 * Names inside the catalogue are compared ignoring case, so a file system that ignores case (macOS, Windows)
 * cannot reach a record or a protected file by another spelling; containment itself is compared exactly, so
 * another spelling of the catalogue folder is refused, never let in.
 */
export function makeGuard({ repo, req, protectedIds = [] }) {
  const REPO = path.resolve(repo)
  const REQ = path.resolve(REPO, req)
  const REQ_REAL = realish(REQ)
  const config = (() => {
    try {
      return JSON.parse(fs.readFileSync(path.join(REQ, 'board.config.json'), 'utf8').replace(/^﻿/, ''))
    } catch {
      return {}
    }
  })()
  const retiredItemCode = String((Array.isArray(config.statuses) ? config.statuses.find((s) => s?.role === 'retired')?.code : undefined) ?? 5)
  const protectedSet = new Set(protectedIds.map((id) => String(id).toUpperCase()))

  // Artifacts: which are retired, and which real files are drawn files of a protected or retired one.
  const artifacts = {}
  const artDir = path.join(REQ, 'artifacts')
  for (const f of fs.existsSync(artDir) ? fs.readdirSync(artDir) : []) {
    if (!/^AR-\d+\.md$/.test(f)) continue
    const fm = frontmatter(fs.readFileSync(path.join(artDir, f), 'utf8'))
    const id = f.slice(0, -3)
    const file = field(fm, 'file')
    artifacts[id] = {
      retired: isRetiredArtifact({ status: field(fm, 'status'), superseded_by: field(fm, 'superseded_by') }),
      drawn: file ? realish(artifactFilePath(REPO, req, file)) : null,
    }
  }
  const drawnBy = new Map()
  for (const [id, a] of Object.entries(artifacts)) if (a.drawn) drawnBy.set(a.drawn.toLowerCase(), id)

  const isProtected = (id) => protectedSet.has(String(id).toUpperCase())
  const retiredId = (id) => !!artifacts[String(id).toUpperCase()]?.retired
  /** Protected ids that name no artifact in the catalogue (a typo protects nothing). */
  const unknownProtected = [...protectedSet].filter((id) => !artifacts[id])

  /** The real absolute path an edit's `file` lands on (repo-relative or absolute). */
  const target = (file) => realish(path.resolve(REPO, file))

  /** Why an edit to `file` replacing `old` must not be applied, or null when it may be. */
  function refusal(file, old) {
    if (typeof file !== 'string' || !file) return 'no file named'
    const abs = target(file)
    if (!inside(abs, REQ_REAL)) return `outside the catalogue folder (${req}): ${file}`
    const rel = path.relative(REQ_REAL, abs).split(path.sep).join('/')
    const low = rel.toLowerCase()
    const top = low.split('/')[0]
    if (RECORD_FOLDERS.has(top)) return `${top}/ is a record and is never edited`
    const drawnId = drawnBy.get(abs.toLowerCase())
    const sidecar = low.match(/^artifacts\/(ar-\d+)\.md$/)?.[1]?.toUpperCase()
    for (const id of [sidecar, drawnId].filter(Boolean)) {
      if (isProtected(id)) return `${id} is a protected artifact`
      if (retiredId(id)) return `${id} is a retired artifact`
    }
    if (!fs.existsSync(abs)) return null // reported as "file not found" by the caller
    let text
    try {
      if (!fs.statSync(abs).isFile()) return 'not a file'
      text = fs.readFileSync(abs, 'utf8')
    } catch (e) {
      return `cannot be read (${e.code ?? e.message})`
    }
    if (/^stories\/[^/]+\.md$/.test(low) && field(frontmatter(text), 'status') === retiredItemCode) return `${rel.slice(8, -3)} is a retired item`
    if (/^questions\/[^/]+\.md$/.test(low)) {
      const answer = text.search(/^## Answer[ \t]*\r?$/m)
      const at = typeof old === 'string' ? text.indexOf(old) : -1
      if (answer >= 0 && at >= 0 && at + old.length > answer) return `the edit changes ${rel.slice(10, -3)}'s answer`
    }
    return null
  }

  return { refusal, target, isProtected, isRetiredArtifact: retiredId, unknownProtected, REQ: REQ_REAL }
}

// ---- fingerprints: what a decision is tied to

const sha = (v) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 12)
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

/**
 * A change's fingerprint: its proposed effect. With edits: the edits (file, old, new), in any order.
 * Without: its title, items and action. Any difference is a different change.
 */
export function fingerprint(ch) {
  const edits = (ch.edits ?? []).map((e) => [e.file, e.old, e.new])
  if (edits.length) return sha({ edits: edits.sort((a, b) => cmp(a.join('\0'), b.join('\0'))) })
  return sha({ title: ch.title ?? '', items: [...(ch.items ?? [])].sort(), action: ch.action ?? (ch.needsRedraw ? 'redraw' : 'flag') })
}

/** A question's fingerprint: its title, body and affected items. */
export const questionFingerprint = (q) => sha({ title: q.title ?? '', body: q.body ?? '', affects: [...(q.affects ?? [])].sort() })

/** A change or question id, optionally with its fingerprint: `L-01`, `S-0104`, `Q-03@1a2b3c4d5e6f`. */
export const DECISION_ID = /^([LMSQ]-\d+)(?:@([0-9a-f]{12}))?$/

/** Ids of a series: two digits up to 99, four past it, never three (three-digit S- and R- codes are rulings). */
export const seriesId = (letter, n, count) => `${letter}-${String(n).padStart(count > 99 ? 4 : 2, '0')}`
