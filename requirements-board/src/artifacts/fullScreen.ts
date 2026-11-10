/**
 * Full screen for the artifact page: the masthead and the panel go (a class on the root element
 * that the stylesheet reads) and the browser is asked to fill the screen too. Where it says no (an
 * iframe, a refused request) the artifact still fills the window. Leaving the browser's full screen
 * (Esc, the browser's own controls) leaves the board's too; Esc leaves it when the browser was never
 * in full screen, unless a sheet is open over the artifact or the key is meant for a field.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export interface FullScreen {
  on: boolean
  toggle: () => void
}

const ROOT_CLASS = 'artifact-full'

export function useFullScreen(): FullScreen {
  const [on, setOn] = useState(false)
  // Whether this page put the browser in full screen, so it only takes it out again if it did.
  const asked = useRef(false)

  const leave = useCallback(() => {
    setOn(false)
    if (asked.current && document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    asked.current = false
  }, [])

  const toggle = useCallback(() => {
    if (on) return leave()
    setOn(true)
    const root = document.documentElement
    if (!document.fullscreenElement && root.requestFullscreen) {
      root.requestFullscreen().then(
        () => (asked.current = true),
        () => (asked.current = false),
      )
    }
  }, [on, leave])

  useEffect(() => {
    if (!on) return
    const root = document.documentElement
    root.classList.add(ROOT_CLASS)
    const onChange = () => {
      if (!document.fullscreenElement && asked.current) {
        asked.current = false
        setOn(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || document.fullscreenElement) return
      const t = e.target
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (document.querySelector('.scrim')) return
      setOn(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    window.addEventListener('keydown', onKey)
    return () => {
      root.classList.remove(ROOT_CLASS)
      document.removeEventListener('fullscreenchange', onChange)
      window.removeEventListener('keydown', onKey)
    }
  }, [on])

  // Leaving the page (another tab of the board) leaves full screen.
  useEffect(
    () => () => {
      if (asked.current && document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    },
    [],
  )

  return { on, toggle }
}
