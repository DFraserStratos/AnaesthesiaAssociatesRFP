import { useEffect, useRef, useState } from 'react'

/** How long the pointer rests on the button before the panel opens, so sweeping past it doesn't flash it. */
const OPEN_MS = 90
/** How long the pointer may stray off the hover zone before it closes, so a slip doesn't snap it shut. */
const CLOSE_MS = 280

/**
 * A panel (the minimap) that opens while the pointer rests on its button and stays open while the
 * pointer moves across onto it (the two are one hover zone), closing a moment after it leaves
 * both. Pressing the button pins it open, or unpins it.
 */
export function useHoverPin() {
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const timer = useRef<number>(undefined)
  const later = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(fn, ms)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return {
    open: hover || pinned,
    pinned,
    togglePin: () => setPinned((p) => !p),
    enterButton: () => (hover ? window.clearTimeout(timer.current) : later(() => setHover(true), OPEN_MS)),
    enterMap: () => window.clearTimeout(timer.current),
    leaveZone: () => later(() => setHover(false), CLOSE_MS),
  }
}
