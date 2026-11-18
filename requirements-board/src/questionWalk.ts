import { create } from 'zustand'
import type { BoardConfig } from '../shared/config.ts'
import { isAnswered, statusCodes } from '../shared/statuses.ts'
import type { Question, QuestionKind, QuestionStatus } from '../shared/types.ts'

/**
 * The Outstanding items list's filters. They live here rather than in the view so the question
 * sheet can step through the same list the page shows. Not persisted: a reload starts afresh.
 */
export interface QuestionFilters {
  owner: string
  kind: QuestionKind | ''
  query: string
  showAnswered: boolean
}

interface QuestionFilterState extends QuestionFilters {
  set: (patch: Partial<QuestionFilters>) => void
}

export const useQuestionFilters = create<QuestionFilterState>((set) => ({
  owner: '',
  kind: '',
  query: '',
  showAnswered: true,
  set: (patch) => set(patch),
}))

/** Does a question pass the list's owner, kind and search filters? (Answered visibility is by group.) */
export function questionFilter(q: Question, f: QuestionFilters): boolean {
  if (f.owner && q.owner !== f.owner) return false
  if (f.kind && q.kind !== f.kind) return false
  const words = f.query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const hay = `${q.id} ${q.title} ${q.question} ${q.answer} ${q.affects.join(' ')}`.toLowerCase()
  return words.every((w) => hay.includes(w))
}

/** The groups the list shows, in order: the config's status order, the answered one only when shown. */
export const shownGroups = (c: BoardConfig, f: QuestionFilters): QuestionStatus[] => statusCodes(c, 'question').filter((s) => f.showAnswered || !isAnswered(c, { status: s }))

/**
 * Every group the list shows, in order: the configured ones (`shownGroups`), then one per status a
 * question holds that the config does not define (a typo, a removed status), as stored. Those are
 * never answered, so they show whether or not answered questions do, and every question the
 * masthead counts is listed (FINDINGS R-121).
 */
export function questionGroups(c: BoardConfig, questions: readonly Question[], f: QuestionFilters): { status: QuestionStatus; configured: boolean }[] {
  const known = new Set(statusCodes(c, 'question'))
  const unknown = [...new Set(questions.map((q) => q.status).filter((s) => !known.has(s)))].sort()
  return [...shownGroups(c, f).map((status) => ({ status, configured: true })), ...unknown.map((status) => ({ status, configured: false }))]
}

/**
 * The questions in the order the list shows them, for stepping through in a sheet. `anchor` keeps
 * the open question where it stood when it was opened: answer an Open one and it still sits among
 * the Open ones, so Previous and Next go to its old neighbours rather than into Answered.
 */
export function questionWalk(c: BoardConfig, questions: readonly Question[], f: QuestionFilters, anchor?: { id: string; status: QuestionStatus }): Question[] {
  const groupOf = (q: Question) => (anchor && q.id === anchor.id ? anchor.status : q.status)
  const shown = questions.filter((q) => questionFilter(q, f))
  return questionGroups(c, questions, f).flatMap(({ status }) => shown.filter((q) => groupOf(q) === status))
}
