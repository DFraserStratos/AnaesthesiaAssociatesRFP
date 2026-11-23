import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { neutral, surface } from '../../theme/tokens'
import { dataAttributesOf, type DataAttributes } from './Field'

/**
 * The frosted dock pinned across the foot of a phone screen (UI unification U7, U35; J N3): the Booking's
 * commit dock, the List's submit footer and My calendar's "Add days off". One container, absolute to the
 * phone's content region, `14px 20px` with the bottom pad reading the host's inset (`inset - 2`, floored at
 * 14, so a zero-inset device gets a symmetric box), `surface.frosted` under a 14px blur and a `line` rule on
 * top. What sits inside is the screen's own (Mark complete at 56, the List dock at 54, the grey dock you can
 * still tap): the dock never restyles it.
 *
 * It MEASURES itself (`offsetHeight`, the untransformed box: PhoneFrame scales the whole device, so a
 * post-transform rect would read short) and publishes the height as `--aa-dock-height` on
 * `documentElement`, where host chrome that must clear the dock reads it (the PWA's `UpdatePrompt` and
 * `PwaDemoActions`). Docks stack (a Booking layer over its List): the one mounted last is on top, so it is
 * the one published, and the one under it is published again when the top one goes.
 */
export function StickyDock({
  children,
  testId,
  shot,
  riseWithKeyboard = false,
  zIndex,
  onHeight,
  ...rest
}: DataAttributes & {
  children: ReactNode
  testId?: string
  shot?: string
  /** Ride above the software keyboard (`--aa-keyboard-inset`, set only by the device host). The Booking's dock. */
  riseWithKeyboard?: boolean
  zIndex?: number
  /** The measured height, for a screen that sizes its own tail from it (the Booking's `DockSpacer`). */
  onHeight?: (height: number) => void
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const onHeightRef = useRef(onHeight)
  onHeightRef.current = onHeight

  useLayoutEffect(() => {
    const el = ref.current
    if (el === null) return
    const token = Symbol('dock')
    // A dock on a parked layer (a SlideStack screen under the one on show, or the calendar kept mounted after
    // it slid away: both `inert`) is not on screen, so it publishes nothing until its layer is back on top.
    const measure = () => {
      const height = el.offsetHeight
      if (el.closest('[inert]') === null) publishDockHeight(token, height)
      else withdrawDockHeight(token)
      onHeightRef.current?.(height)
    }
    measure()
    // jsdom has no ResizeObserver; the observer only refines the one-shot measurement.
    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure)
      observer.observe(el)
    }
    const parking = new MutationObserver(measure)
    parking.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['inert'] })
    return () => {
      observer?.disconnect()
      parking.disconnect()
      withdrawDockHeight(token)
      onHeightRef.current?.(0)
    }
  }, [])

  const style: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: riseWithKeyboard ? 'var(--aa-keyboard-inset, 0px)' : 0,
    paddingTop: 14,
    paddingLeft: 20,
    paddingRight: 20,
    // 32 = 34 - 2, reusing the home indicator's own lower margin; the 14px floor is the dock's own top pad.
    paddingBottom: 'max(calc(var(--aa-inset-bottom, 34px) - 2px), 14px)',
    background: surface.frosted,
    backdropFilter: 'blur(14px)',
    borderTop: `1px solid ${neutral.line}`,
    ...(zIndex !== undefined ? { zIndex } : {}),
  }
  return (
    <div ref={ref} data-testid={testId} data-shot={shot} data-sticky-dock="" {...dataAttributesOf(rest)} style={style}>
      {children}
    </div>
  )
}

/** Mounted docks, oldest first, with their heights: the newest is the one on screen. */
const mountedDocks = new Map<symbol, number>()

function republish() {
  const root = document.documentElement
  const heights = [...mountedDocks.values()]
  if (heights.length === 0) root.style.removeProperty('--aa-dock-height')
  else root.style.setProperty('--aa-dock-height', `${heights[heights.length - 1]}px`)
}

function publishDockHeight(token: symbol, height: number) {
  if (mountedDocks.get(token) === height) return
  mountedDocks.set(token, height)
  republish()
}

function withdrawDockHeight(token: symbol) {
  if (!mountedDocks.delete(token)) return
  republish()
}
