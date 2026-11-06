import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api.ts'
import { useCatalogueRefresh } from '../useCatalogueRefresh.ts'

/**
 * How many records differ from the last commit, minor changes left out: the Diff review tab's
 * count. Null with no git. The server counts (a few bytes, not the whole comparison), and only the
 * newest request's answer is kept, so two refreshes that cross never leave the older count.
 */
export function useUncommittedCount(): number | null {
  const [count, setCount] = useState<number | null>(null)
  const seq = useRef(0)
  const load = useCallback(() => {
    const n = ++seq.current
    api.diffCount().then(
      (res) => n === seq.current && setCount(res.available ? res.count : null),
      () => n === seq.current && setCount(null),
    )
  }, [])
  useEffect(load, [load])
  useCatalogueRefresh(load, true, 800)
  return count
}
