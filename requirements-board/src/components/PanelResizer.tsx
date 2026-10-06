import type { PointerEvent as ReactPointerEvent } from 'react'

/** A docked panel's share of the width, in percent: a third by default. */
export const PANEL_DEFAULT = 100 / 3
export const PANEL_MIN = 25
export const PANEL_MAX = 70
export const clampPanel = (w: number) => Math.min(PANEL_MAX, Math.max(PANEL_MIN, w))

/** A panel width kept per browser under `key`, or the default. */
export function readPanel(key: string): number {
  try {
    const w = Number(localStorage.getItem(key))
    return w ? clampPanel(w) : PANEL_DEFAULT
  } catch {
    return PANEL_DEFAULT
  }
}
export function writePanel(key: string, w: number) {
  try {
    localStorage.setItem(key, String(w))
  } catch {
    /* not persisted */
  }
}

/** The divider between a docked panel and what sits beside it: drag, arrow keys, or double-click to reset to a third. */
export function PanelResizer({ width, onChange, label = 'Resize the item panel' }: { width: number; onChange: (w: number) => void; label?: string }) {
  const start = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const split = el.parentElement!.getBoundingClientRect()
    el.setPointerCapture(e.pointerId)
    el.classList.add('dragging')
    const move = (ev: PointerEvent) => onChange(clampPanel(((ev.clientX - split.left) / split.width) * 100))
    const up = () => {
      el.classList.remove('dragging')
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }
  return (
    <div
      className="dock-resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={Math.round(width)}
      aria-valuemin={PANEL_MIN}
      aria-valuemax={PANEL_MAX}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      onPointerDown={start}
      onDoubleClick={() => onChange(PANEL_DEFAULT)}
      onKeyDown={(e) => {
        const step = e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0
        if (!step) return
        e.preventDefault()
        onChange(clampPanel(width + step))
      }}
    />
  )
}
