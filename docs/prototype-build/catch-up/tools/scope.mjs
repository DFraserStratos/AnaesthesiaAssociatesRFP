// Status and scope rules shared by the catch-up tools. A catalogue file stores a status number whose
// meaning is in the board's config (requirements-board/requirements/board.config.json): which number
// is retired or answered comes from the roles there, never from the number. A value from before a
// recode recorded in status-recodes.json reads as today's code, so a baseline from before a recode
// still compares cleanly. Tested by req-changes.test.mjs.
import fs from 'node:fs'
import path from 'node:path'

export const RECODES = 'requirements-board/requirements/status-recodes.json'
export const CONFIG = 'requirements-board/requirements/board.config.json'
export const FUTURE_LANE = 'Future Work'

// The board's defaults (requirements-board/shared/statuses.ts) when the config has no lists.
const DEFAULTS = {
  statuses: [{ code: 1, label: 'Proposed', role: 'default' }, { code: 2, label: 'Open', role: 'waiting' }, { code: 3, label: 'Verify' }, { code: 4, label: 'Confirmed' }, { code: 5, label: 'Retired', role: 'retired' }],
  questionStatuses: [{ code: 1, label: 'Open', role: 'default' }, { code: 2, label: 'Confirm' }, { code: 3, label: 'Proposed' }, { code: 4, label: 'Answered', role: 'answered' }],
}

/** The project's statuses: the retired and answered codes, and a status as people read it ("Agreed (4)"). */
export function loadStatuses(root = process.cwd()) {
  let config = {}
  try {
    config = JSON.parse(fs.readFileSync(path.join(root, CONFIG), 'utf8'))
  } catch {}
  const list = kind => (Array.isArray(config[kind]) ? config[kind] : DEFAULTS[kind])
  const role = (kind, r) => String(list(kind).find(d => d.role === r)?.code ?? '')
  const label = (kind, code) => {
    const d = list(kind === 'item' ? 'statuses' : 'questionStatuses').find(x => String(x.code) === String(code))
    return d ? `${d.label} (${code})` : String(code)
  }
  return { retired: role('statuses', 'retired'), answered: role('questionStatuses', 'answered'), label }
}

/** The recorded recodes, oldest first; none when the file is absent. */
export function loadRecodes(root = process.cwd()) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(root, RECODES), 'utf8'))
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
 * one under a retired epic, a story in the Future Work lane, or a feature whose live stories are all
 * in that lane (a feature has no lane of its own, so its stories say where it belongs).
 */
export function outOfScopeRule(items, recodes, retired = loadStatuses().retired) {
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
    return live.length > 0 && live.every(k => items[k].swimlane === FUTURE_LANE)
  }
  return id => !items[id] || status(id) === retired || items[id].swimlane === FUTURE_LANE || status(epicOf(id)) === retired || futureFeature(id)
}
