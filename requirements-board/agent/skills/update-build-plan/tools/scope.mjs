// Status and scope rules shared by the build-plan tools. A catalogue file stores a status number whose
// meaning is in the board's config (<requirements>/board.config.json): which number is retired or
// answered comes from the roles there, never from the number. A value from before a recode recorded in
// status-recodes.json reads as today's code, so a baseline from before a recode still compares cleanly.
// `req` below is the requirements folder, repo-relative (the plan config's `requirements`).
// Tested by req-changes.test.mjs.
import fs from 'node:fs'
import path from 'node:path'
import { statusListsOf } from './config.mjs'

const DEFAULT_REQ = 'requirements-board/requirements'
export const recodesPath = (req = DEFAULT_REQ) => `${req}/status-recodes.json`

/** The project's statuses: the retired and answered codes, and a status as people read it ("Agreed (4)"). */
export function loadStatuses(root = process.cwd(), req = DEFAULT_REQ) {
  let config = {}
  try {
    config = JSON.parse(fs.readFileSync(path.join(root, req, 'board.config.json'), 'utf8'))
  } catch {}
  const lists = statusListsOf(config)
  const list = kind => lists[kind]
  const role = (kind, r) => String(list(kind).find(d => d.role === r)?.code ?? '')
  const label = (kind, code) => {
    const d = list(kind === 'item' ? 'statuses' : 'questionStatuses').find(x => String(x.code) === String(code))
    return d ? `${d.label} (${code})` : String(code)
  }
  return { retired: role('statuses', 'retired'), answered: role('questionStatuses', 'answered'), label }
}

/** The recorded recodes, oldest first; none when the file is absent. */
export function loadRecodes(root = process.cwd(), req = DEFAULT_REQ) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(root, recodesPath(req)), 'utf8'))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

/** A stored status as today's code (kind: 'item' or 'question'), following every recode in turn. */
export function normaliseStatus(recodes, kind, value) {
  let v = value ?? ''
  for (const r of recodes) {
    const map = (kind === 'item' ? r.items : r.questions) || {}
    if (Object.hasOwn(map, v)) v = map[v]
  }
  return v
}

/**
 * Out of scope for grading, over `items` ({ id: { id, parent, status, swimlane } }): a retired item,
 * one under a retired epic, a story in an out-of-scope lane (`lanes`, the plan config's
 * `outOfScopeLanes`), or a feature whose live stories are all in such lanes (a feature has no lane of
 * its own, so its stories say where it belongs).
 */
export function outOfScopeRule(items, recodes, retired = loadStatuses().retired, lanes = []) {
  const outLane = lane => !!lane && lanes.includes(lane)
  const status = id => normaliseStatus(recodes, 'item', items[id]?.status)
  const kids = {}
  for (const it of Object.values(items)) if (it.parent) (kids[it.parent] ||= []).push(it.id)
  const epicOf = id => {
    let x = items[id]
    while (x && x.parent && items[x.parent]) x = items[x.parent]
    return x?.id
  }
  const futureFeature = id => {
    if (!id.startsWith('FT-')) return false
    const live = (kids[id] || []).filter(k => status(k) !== retired)
    return live.length > 0 && live.every(k => outLane(items[k].swimlane))
  }
  return id => !items[id] || status(id) === retired || outLane(items[id].swimlane) || status(epicOf(id)) === retired || futureFeature(id)
}
