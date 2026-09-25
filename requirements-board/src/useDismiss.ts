import { useEffect, useRef, type RefObject } from 'react'

/**
 * Put a popover away on Esc or a press outside it. Presses inside `anchor`
 * (the button that toggles it) are left to that button, so it can close it
 * without the press reopening it. Esc is taken in the capture phase, so the
 * docked panel behind never sees it and closes too.
 */
export function useDismiss<T extends HTMLElement>(onClose: () => void, anchor?: RefObject<HTMLElement | null>) {
  const ref = useRef<T>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopImmediatePropagation()
      close.current()
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target instanceof Node ? e.target : null
      if (!t || ref.current?.contains(t) || anchor?.current?.contains(t)) return
      close.current()
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [anchor])
  return ref
}
