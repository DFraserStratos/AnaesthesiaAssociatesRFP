/**
 * J and K through the Arrivals feed (build plan Phase 68; docs/explorations/intake-ideas.html #idea1: "J and
 * K move through it"): J picks the next item and K the one before, across groups in feed order. Never while
 * the office types (focus in an input, textarea, select or editable text), inside a modal dialog, or with a
 * modifier held, so Ctrl+K and a capital J typed elsewhere keep their own meaning.
 */

import { useEffect, useRef } from 'react'

/** The element is somewhere the J and K keys are words, not moves. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') !== null) return true
  return target.closest('[aria-modal="true"]') !== null
}

/** The key the feed moves to from `selectedKey` (`step` +1 for J, -1 for K); undefined at either end. */
export function feedKeyAfter(keys: readonly string[], selectedKey: string | undefined, step: 1 | -1): string | undefined {
  if (keys.length === 0) return undefined
  const at = selectedKey === undefined ? -1 : keys.indexOf(selectedKey)
  if (at === -1) return keys[0]
  return keys[at + step]
}

export function useFeedKeys(keys: readonly string[], selectedKey: string | undefined, onSelect: (key: string) => void): void {
  const latest = useRef({ keys, selectedKey, onSelect })
  latest.current = { keys, selectedKey, onSelect }
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      const key = event.key.toLowerCase()
      if (key !== 'j' && key !== 'k') return
      if (isTypingTarget(event.target)) return
      const { keys: now, selectedKey: at, onSelect: select } = latest.current
      const next = feedKeyAfter(now, at, key === 'j' ? 1 : -1)
      if (next === undefined || next === at) return
      event.preventDefault()
      select(next)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
