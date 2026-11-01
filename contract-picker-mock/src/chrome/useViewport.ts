import { useEffect, useState, type RefObject } from 'react'

/** The window's width, kept current. Laptop layouts key off it (see `LAPTOP`). */
export function useWindowWidth() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const on = () => setW(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return w
}

/** Below this window width the mock packs itself for a laptop: icon nav, narrower phone, tighter harness. */
export const LAPTOP = 1600

/** An element's content box, kept current. */
export function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ width: e!.contentRect.width, height: e!.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}
