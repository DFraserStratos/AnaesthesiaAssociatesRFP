import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * An Admin list's state in the URL (People, Lists): read a param (with its default when absent) and
 * set some at once. Every change replaces the history entry, a value equal to its default leaves the
 * URL, and any change but the page's own goes back to page 1. Pass `defaults` as a module constant so
 * its identity is stable. `page` reads '' when absent (`pageParam` turns that into 1).
 */
export function useListParams<K extends string>(defaults: Readonly<Record<K, string>>) {
  const [params, setParams] = useSearchParams()
  const get = useCallback((key: K | 'page'): string => params.get(key) ?? (key === 'page' ? '' : defaults[key as K]), [params, defaults])
  const set = useCallback(
    (patch: Partial<Record<K | 'page', string>>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(patch) as [K | 'page', string][]) {
            const fallback = key === 'page' ? '1' : defaults[key as K]
            if (value === fallback || value === '') next.delete(key)
            else next.set(key, value)
          }
          if (!('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams, defaults],
  )
  return { get, set }
}
