import { useCallback, useRef } from 'react'
import { useSearchParams, type NavigateOptions } from 'react-router-dom'

/**
 * `useSearchParams` whose functional setter reads the latest params, not the last render's.
 *
 * React Router 6's `setSearchParams(prev => ...)` hands `prev` from the render that made the setter,
 * so two quick edits before a re-render (a filter pill, then a select) build the second URL from the
 * stale params and drop the first. This keeps the params last written (or last rendered, whichever is
 * newer) in a ref and builds every functional update from them, so each edit lands.
 */
export function useLiveSearchParams() {
  const [params, setParams] = useSearchParams()
  const latest = useRef(params)
  const rendered = useRef(params)
  if (rendered.current !== params) {
    rendered.current = params
    latest.current = params
  }
  const set = useCallback(
    (next: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams), options?: NavigateOptions) => {
      const value = typeof next === 'function' ? next(new URLSearchParams(latest.current)) : next
      latest.current = value
      setParams(value, options)
    },
    [setParams],
  )
  return [params, set] as const
}
