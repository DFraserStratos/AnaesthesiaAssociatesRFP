import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

/** Modals are deep-linkable: `?item=US-01.1.1` or `?question=OQ-01` over whatever view is open. */
export function useOpen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()

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
    item: (id: string, opts?: { edit?: boolean }) => withParams({ item: id, question: null, edit: opts?.edit ? '1' : null }),
    question: (id: string, opts?: { edit?: boolean }) => withParams({ question: id, item: null, edit: opts?.edit ? '1' : null }),
    close: () => withParams({ item: null, question: null, edit: null }),
    showOnBoard: (id: string) => withParams({ item: null, question: null, edit: null, focus: id }, '/board'),
    clearFocus: () => withParams({ focus: null }, location.pathname, true),
    params,
  }
}
