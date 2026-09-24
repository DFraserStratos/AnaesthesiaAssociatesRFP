/**
 * Catalogue integrity rules. Run by `npm run check`, by the dev server before
 * every write, and shown live in the app. Mirrors (and extends) the checks the
 * old build_requirements.py generator ran.
 */
import {
  COMPONENTS,
  ITEM_STATUSES,
  ITEM_TYPES,
  QUESTION_KINDS,
  QUESTION_STATUSES,
  VIEWPORTS,
  type Issue,
  type Item,
  type Question,
} from './types.ts'

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
}

export function checkCatalogue({ items, questions, fileExists }: CheckInput): Issue[] {
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
      else if (it.type === 'feature' && parent.type !== 'epic') err(it.id, `a feature's parent must be an epic, ${it.parent} is a ${parent.type}`)
      else if (it.type === 'story' && parent.type === 'story') err(it.id, `a story's parent must be a feature or epic, ${it.parent} is a story`)
    }

    for (const img of it.images) {
      if (!img.src) err(it.id, 'image with no src')
      else if (!img.src.startsWith('assets/')) err(it.id, `image ${img.src} must live under assets/ (the board only serves that folder)`)
      else if (fileExists && !fileExists(img.src)) err(it.id, `image file ${img.src} is missing`)
      if (!VIEWPORTS.includes(img.viewport)) err(it.id, `image viewport "${img.viewport}" is not desktop or mobile`)
    }
  }

  const qIds = new Set<string>()
  for (const q of questions) {
    if (qIds.has(q.id)) err(q.id, `duplicate ID ${q.id}`)
    qIds.add(q.id)
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
