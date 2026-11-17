import { useRef, type KeyboardEvent } from 'react'

/**
 * The one radio-group keyboard model (UI unification U4, group U34; from
 * StatusRadioGroup, Phase 28): one Tab stop for the group (the checked option,
 * else the first enabled one), arrow keys move round the options, Home and End
 * jump to the ends, disabled options are skipped. By default a move also
 * selects, as a native radio group does. `selectOnMove: false` moves focus
 * only, and Space, Enter or a click picks: for groups where a pick saves and
 * moves on (the Contract step rail's answers), so an arrow never writes.
 */
export function useRovingRadio<T>({
  values,
  value,
  onChange,
  isDisabled,
  selectOnMove = true,
}: {
  values: readonly T[]
  value: T | undefined
  onChange: (next: T) => void
  isDisabled?: (v: T) => boolean
  selectOnMove?: boolean
}) {
  const refs = useRef<(HTMLElement | null)[]>([])
  const enabled = (i: number) => {
    const v = values[i]
    return v !== undefined && isDisabled?.(v) !== true
  }
  const checkedAt = value === undefined ? -1 : values.indexOf(value)
  const firstEnabled = values.findIndex((_v, i) => enabled(i))
  const tabStop = checkedAt >= 0 && enabled(checkedAt) ? checkedAt : firstEnabled

  function moveTo(i: number) {
    const v = values[i]
    if (v === undefined) return
    refs.current[i]?.focus()
    if (selectOnMove) onChange(v)
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    const n = values.length
    // Leave the browser's own shortcuts (Alt+Arrow back and forward, Ctrl+Home) alone.
    if (n === 0 || e.altKey || e.ctrlKey || e.metaKey) return
    const from = refs.current.findIndex((el) => el !== null && el === document.activeElement)
    const at = from >= 0 ? from : tabStop
    let target = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
      for (let k = 1; k <= n; k++) {
        const i = (at + step * k + n * k) % n
        if (enabled(i)) {
          target = i
          break
        }
      }
    } else if (e.key === 'Home') {
      target = firstEnabled
    } else if (e.key === 'End') {
      for (let i = n - 1; i >= 0; i--) {
        if (enabled(i)) {
          target = i
          break
        }
      }
    } else {
      return
    }
    e.preventDefault()
    if (target >= 0) moveTo(target)
  }

  return {
    groupProps: { role: 'radiogroup' as const, onKeyDown },
    itemProps: (i: number) => ({
      ref: (el: HTMLElement | null) => {
        refs.current[i] = el
      },
      role: 'radio' as const,
      'aria-checked': i === checkedAt,
      tabIndex: i === tabStop ? 0 : -1,
    }),
  }
}
