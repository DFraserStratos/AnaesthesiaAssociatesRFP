import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { isQuestionId } from '../shared/links.ts'

/**
 * The docked item panel on the board registers its unsaved-edit guard here, so
 * the board can switch cards (click, arrows, search) without losing a draft
 * silently: with unsaved edits the panel asks first, in its own frame.
 */
let leaveGuard: ((go: () => void) => void) | null = null
export function setLeaveGuard(guard: typeof leaveGuard) {
  leaveGuard = guard
}
export const guarded = (go: () => void) => (leaveGuard ? leaveGuard(go) : go())

/**
 * Sheets are deep-linkable: `?item=US-01.1.1` or `?question=OQ-01` over whatever view is open.
 * On the board an item docks as a side panel, and a question opens over it without closing it.
 * `?edit=<id>` opens that one record's sheet in its edit form (see `useEditOnOpen`).
 */
export function useOpen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const onBoard = location.pathname === '/board'

  const withParams = useCallback(
    (patch: Record<string, string | null>, pathname = location.pathname, replace = false) => {
      const next = new URLSearchParams(params)
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) next.delete(k)
        else next.set(k, v)
      }
      const qs = next.toString()
      navigate({ pathname, search: qs ? `?${qs}` : '' }, { replace })
    },
    [navigate, location.pathname, params],
  )

  return {
    item: (id: string, opts?: { edit?: boolean; replace?: boolean }) => withParams({ item: id, question: null, edit: opts?.edit ? id : null }, location.pathname, opts?.replace),
    question: (id: string, opts?: { edit?: boolean }) => withParams({ question: id, item: onBoard ? params.get('item') : null, edit: opts?.edit ? id : null }),
    /** Closes the top sheet: a question over the board's item panel leaves the panel open. */
    close: () => withParams(params.has('question') ? { question: null, edit: null } : { item: null, edit: null }),
    showOnBoard: (id: string) => withParams({ item: id, question: null, edit: null, focus: id }, '/board'),
    /** An artifact's own page, fitted to a region when one is given. Leaves any open sheet behind. */
    artifact: (id: string, region?: string | null, opts?: { replace?: boolean }) =>
      navigate({ pathname: `/artifacts/${encodeURIComponent(id)}`, search: region ? `?region=${encodeURIComponent(region)}` : '' }, { replace: opts?.replace }),
    clearFocus: () => withParams({ focus: null }, location.pathname, true),
    clearEdit: () => withParams({ edit: null }, location.pathname, true),
    params,
  }
}

/**
 * A link to a record's sheet on the board, for pasting anywhere: over a selection in a Markdown
 * field it becomes `[selection](ID)` (see `pasteLink`).
 */
export function recordUrl(id: string): string {
  return `${location.origin}${location.pathname}#/board?${isQuestionId(id) ? 'question' : 'item'}=${encodeURIComponent(id)}`
}

/** A link to an artifact (and a spot in it), for pasting: over a selection in a Markdown field it becomes `[selection](AR-01#region)`. */
export function artifactUrl(id: string, region?: string | null): string {
  return `${location.origin}${location.pathname}#/artifacts/${encodeURIComponent(id)}${region ? `?region=${encodeURIComponent(region)}` : ''}`
}

/**
 * Whether this record's sheet should open in its edit form. The request is
 * one-shot: it is read once on mount and then dropped from the URL, so a
 * reload (or Back) reopens the sheet read-only rather than editing again.
 */
export function useEditOnOpen(id: string): boolean {
  const open = useOpen()
  const [asked] = useState(() => open.params.get('edit') === id)
  useEffect(() => {
    if (asked) open.clearEdit()
  }, []) // once, on mount
  return asked
}
