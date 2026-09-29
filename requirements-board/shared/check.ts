/**
 * Catalogue integrity rules. Run by `npm run check`, by the dev server before
 * every write, and shown live in the app. Mirrors (and extends) the checks the
 * old build_requirements.py generator ran.
 */
import {
  COMPONENTS,
  IMAGE_APPS,
  ITEM_STATUSES,
  PARENT_TYPES,
  ITEM_TYPES,
  QUESTION_KINDS,
  QUESTION_STATUSES,
  VIEWPORTS,
  type Issue,
  type Item,
  type Question,
} from './types.ts'
import { isQuestionId, itemTexts, mentions } from './links.ts'

export const ID_PATTERNS = {
  epic: /^EP-\d{2}$/,
  feature: /^FT-\d{2}\.\d+$/,
  story: /^US-\d{2}\.\d+\.\d+$/,
  question: /^OQ-\d{2,}$/,
} as const

export interface CheckInput {
  items: Item[]
  questions: Question[]
  /** Returns whether a catalogue-relative path exists. Omit to skip image checks (browser). */
  fileExists?: (relPath: string) => boolean
  /** The board's named swim lanes (`board-layout.json`). Omit to skip the lane check. */
  lanes?: string[]
}

export function checkCatalogue({ items, questions, fileExists, lanes }: CheckInput): Issue[] {
  const issues: Issue[] = []
  const err = (id: string, message: string) => issues.push({ severity: 'error', id, message })
  const warn = (id: string, message: string) => issues.push({ severity: 'warning', id, message })

  const byId = new Map<string, Item>()
  for (const it of items) {
    if (byId.has(it.id)) err(it.id, `duplicate ID ${it.id}`)
    byId.set(it.id, it)
  }

  for (const it of items) {
    if (!ITEM_TYPES.includes(it.type)) {
      err(it.id, `type "${it.type}" is not one of ${ITEM_TYPES.join(', ')}`)
      continue
    }
    if (!ID_PATTERNS[it.type].test(it.id)) err(it.id, `ID ${it.id} does not match the ${it.type} pattern`)
    if (!it.title.trim()) err(it.id, 'title is empty')
    if (!ITEM_STATUSES.includes(it.status)) err(it.id, `status "${it.status}" is not one of ${ITEM_STATUSES.join(', ')}`)
    for (const c of it.components) {
      if (!(COMPONENTS as readonly string[]).includes(c)) err(it.id, `component "${c}" is not in the vocabulary`)
    }
    if (it.components.length === 0) warn(it.id, 'no component')
    if (it.sources.length === 0 && it.status !== 'Retired') warn(it.id, 'no source')

    if (it.type === 'epic') {
      if (it.parent) err(it.id, 'an epic has no parent')
    } else if (!it.parent) {
      err(it.id, `a ${it.type} needs a parent`)
    } else {
      const parent = byId.get(it.parent)
      if (!parent) err(it.id, `parent ${it.parent} does not exist`)
      else if (!PARENT_TYPES[it.type].includes(parent.type)) {
        const allowed = PARENT_TYPES[it.type].join(' or ')
        err(it.id, `a ${it.type}'s parent must be ${/^[aeiou]/.test(allowed) ? 'an' : 'a'} ${allowed}, ${it.parent} is a ${parent.type}`)
      }
    }

    if (it.swimlane !== null) {
      if (it.type !== 'story') warn(it.id, `swimlane "${it.swimlane}" is set on ${it.type === 'epic' ? 'an' : 'a'} ${it.type}; only stories sit in lanes, so the board ignores it`)
      else if (lanes && !lanes.includes(it.swimlane)) warn(it.id, `swimlane "${it.swimlane}" is not a lane on the board; add it on the Mapped board or fix the name`)
    }

    for (const img of it.images) {
      if (!img.src) err(it.id, 'image with no src')
      else if (!img.src.startsWith('assets/')) err(it.id, `image ${img.src} must live under assets/ (the board only serves that folder)`)
      else if (fileExists && !fileExists(img.src)) err(it.id, `image file ${img.src} is missing`)
      if (!VIEWPORTS.includes(img.viewport)) err(it.id, `image viewport "${img.viewport}" is not desktop or mobile`)
      if (img.app !== undefined && !IMAGE_APPS.includes(img.app)) err(it.id, `image app "${img.app}" is not one of ${IMAGE_APPS.join(', ')}`)
      else if (img.app === 'mobile' && img.viewport !== 'mobile') warn(it.id, `image ${img.src} is from the mobile app but its viewport is ${img.viewport}`)
    }
  }

  const qIds = new Set<string>()
  for (const q of questions) {
    if (qIds.has(q.id)) err(q.id, `duplicate ID ${q.id}`)
    qIds.add(q.id)
  }

  // Related items: stored on one side, shown on both.
  const pairs = new Set<string>()
  for (const it of items) {
    const seen = new Set<string>()
    for (const r of it.related) {
      if (seen.has(r)) warn(it.id, `related lists ${r} twice`)
      seen.add(r)
      if (r === it.id) err(it.id, 'related lists the item itself')
      else if (isQuestionId(r)) err(it.id, `related lists ${r}, an outstanding item; list the item under its affects instead`)
      else if (!byId.has(r)) err(it.id, `related lists ${r}, which does not exist`)
      else {
        if (byId.get(r)!.status === 'Retired' && it.status !== 'Retired') warn(it.id, `related lists ${r}, which is retired`)
        if (pairs.has(`${r}|${it.id}`)) warn(it.id, `related lists ${r}, which already lists this item; keep it on one side`)
        pairs.add(`${it.id}|${r}`)
      }
    }
  }

  // Links in the text. A question can be deleted, so a link to a missing one warns rather than blocking the delete.
  // A bare mention of a retired item is history ("merges the former US-01.3.4"), so only a link to one warns.
  const linksIn = (id: string, texts: string[], live: boolean) => {
    for (const m of mentions(texts.join('\n\n'))) {
      const how = m.bare ? 'mentions' : 'links to'
      if (isQuestionId(m.id)) {
        if (!qIds.has(m.id)) warn(id, `the text ${how} ${m.id}, which does not exist`)
      } else if (!byId.has(m.id)) {
        if (m.bare) warn(id, `the text mentions ${m.id}, which does not exist`)
        else err(id, `the text links to ${m.id}, which does not exist`)
      } else if (live && !m.bare && byId.get(m.id)!.status === 'Retired') warn(id, `the text links to ${m.id}, which is retired`)
    }
  }
  for (const it of items) linksIn(it.id, itemTexts(it), it.status !== 'Retired')
  for (const q of questions) linksIn(q.id, [q.question, q.answer], q.status !== 'Answered')

  for (const q of questions) {
    if (!ID_PATTERNS.question.test(q.id)) err(q.id, `ID ${q.id} does not match OQ-nn`)
    if (!QUESTION_KINDS.includes(q.kind)) err(q.id, `kind "${q.kind}" is not one of ${QUESTION_KINDS.join(', ')}`)
    if (!q.title.trim()) err(q.id, 'title is empty')
    if (!QUESTION_STATUSES.includes(q.status)) err(q.id, `status "${q.status}" is not one of ${QUESTION_STATUSES.join(', ')}`)
    for (const a of q.affects) if (!byId.has(a)) err(q.id, `affects ${a}, which does not exist`)
    if (q.affects.length === 0) warn(q.id, 'affects no items')
    if (q.status === 'Answered' && !q.answer.trim()) warn(q.id, 'answered but the answer is empty')
  }

  return issues
}

export const hasErrors = (issues: Issue[]) => issues.some((i) => i.severity === 'error')
export const issueKey = (i: Issue) => `${i.severity}|${i.id}|${i.message}`
