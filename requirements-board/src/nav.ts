import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

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
    item: (id: string, opts?: { edit?: boolean; replace?: boolean }) => withParams({ item: id, question: null, edit: opts?.edit ? '1' : null }, location.pathname, opts?.replace),
    question: (id: string, opts?: { edit?: boolean }) => withParams({ question: id, item: onBoard ? params.get('item') : null, edit: opts?.edit ? '1' : null }),
    /** Closes the top sheet: a question over the board's item panel leaves the panel open. */
    close: () => withParams(params.has('question') ? { question: null, edit: null } : { item: null, edit: null }),
    showOnBoard: (id: string) => withParams({ item: id, question: null, edit: null, focus: id }, '/board'),
    clearFocus: () => withParams({ focus: null }, location.pathname, true),
    params,
  }
}
