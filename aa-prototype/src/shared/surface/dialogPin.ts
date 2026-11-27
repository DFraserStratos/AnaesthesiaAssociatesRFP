/**
 * The web `Dialog`'s pinned header and footer (docs/explorations/dialog-scroll-ideas.html,
 * option C): only the dialog's body scrolls, while the shared `OverlayHeader`
 * and `SheetActions` stick to its top and bottom. They stay where the sheet put
 * them in the DOM (tests, specs and capture recipes find them inside the
 * sheet), and pin with `position: sticky` only when they sit directly in the
 * sheet's own column; one nested deeper (an inline confirm in a grey box)
 * stays inline. The phone's `BottomSheet` provides no pin, so its sheets render
 * as before.
 */

import { createContext, useContext, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { neutral, space, zIndex } from '../../theme/tokens'

export type PinnedPart = 'header' | 'footer'

/** Marks the element wrapping the dialog's children (Dialog.tsx). */
export const CONTENT_ATTR = 'data-aa-dialog-content'

export interface DialogPin {
  /** The body scrolls; content is hidden above or below. */
  edges: { scrollable: boolean; above: boolean; below: boolean }
  /** A pinned header or footer arrived (its element) or left (null). */
  report: (part: PinnedPart, el: HTMLElement | null) => void
}

export const DialogPinContext = createContext<DialogPin | null>(null)

/** The body's padding the pinned parts stretch across (Dialog.tsx). */
export const BODY_INSET = { left: space[6], right: 18 } as const

/**
 * A header or footer inside a web `Dialog`: `pinned` once it is known to sit
 * directly in the sheet's column; `style` is its wrapper (`display: contents`
 * until then, so an unpinned part lays out exactly as it always did).
 */
export function usePinnedPart(part: PinnedPart): { pin: DialogPin | null; ref: RefObject<HTMLDivElement>; style: CSSProperties } {
  const pin = useContext(DialogPinContext)
  const ref = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(false)
  const report = pin?.report
  useLayoutEffect(() => {
    // Found through the DOM: the dialog's own ref is not attached yet when a child's layout effect runs.
    const el = ref.current
    const root = el?.closest<HTMLElement>(`[${CONTENT_ATTR}]`)
    if (el === null || root === null || root === undefined || report === undefined) return undefined
    const parent = el.parentElement
    const direct = parent === root || parent === root.firstElementChild
    setPinned(direct)
    if (!direct) return undefined
    report(part, el)
    return () => report(part, null)
  }, [report, part])
  if (pin === null || !pinned) return { pin, ref, style: { display: 'contents' } }
  const { scrollable, above, below } = pin.edges
  const line = (on: boolean) => `1px solid ${on ? neutral.line : 'transparent'}`
  const shared: CSSProperties = {
    position: 'sticky',
    zIndex: zIndex.sticky,
    background: neutral.surface,
    marginLeft: -BODY_INSET.left,
    marginRight: -BODY_INSET.right,
    paddingLeft: BODY_INSET.left,
    paddingRight: BODY_INSET.right,
  }
  // Room for the hairline only while the body scrolls; a dialog that fits keeps its spacing.
  return {
    pin,
    ref,
    style:
      part === 'header'
        ? { ...shared, top: 0, display: 'flex', flexDirection: 'column', gap: space[2], paddingTop: space[6], paddingBottom: scrollable ? 10 : 0, borderBottom: line(above) }
        : { ...shared, bottom: 0, display: 'flex', flexDirection: 'column', gap: space[3], paddingTop: scrollable ? 10 : 0, paddingBottom: space[6], borderTop: line(below) },
  }
}
