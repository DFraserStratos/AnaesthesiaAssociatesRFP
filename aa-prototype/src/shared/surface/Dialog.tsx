import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { elevation, neutral, radius, scrim, space, zIndex } from '../../theme/tokens'
import { motion } from '../../theme/motion'
import { useModalLayer } from './useModalLayer'
import { OverlayTitleContext } from './overlayTitle'
import { BODY_INSET, CONTENT_ATTR, DialogPinContext, type DialogPin, type PinnedPart } from './dialogPin'
import { CloseButton } from '../ui/IconButton'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Accepted for signature parity with the mobile bottom sheet; unused on web. */
  hideHandle?: boolean
  /** `DIALOG_WIDTH`: `wide` for tables, pairs and two columns, `large` for a document or an editor with a preview. */
  size?: 'default' | 'wide' | 'large'
  /** The control that takes focus on open (a confirm's safe button). */
  initialFocusRef?: RefObject<HTMLElement>
}

/** The desktop widths (docs/explorations/overlay-changes.html): one column, wide, and a document or editor with a preview. */
export const DIALOG_WIDTH = { default: 520, wide: 760, large: 1040 } as const

/**
 * The web `SurfaceProvider`'s `Overlay` (convention 16): a centred desktop
 * dialog with the same `{open, onClose, children, hideHandle}` signature as the
 * mobile `BottomSheet`, so every shared flow/capture sheet renders unchanged on
 * both platforms. Scrim (`aa-fade-in`) + a `radius.panel` card at `elevation.e3`;
 * closes on Escape (the one modal stack, `useModalLayer`) or a scrim click.
 * `position:fixed; inset:0` so it centres over the viewport regardless of where
 * the detail panel sits. An `OverlayHeader` inside names it and shows the
 * corner X (UI unification U2, questions 11 and 12).
 *
 * The card clips to its corners and only its body scrolls
 * (docs/explorations/dialog-scroll-ideas.html, option C): the sheet's
 * `OverlayHeader` sticks to the top under the X and its `SheetActions` to the
 * bottom (dialogPin.ts), a hairline shows while content is hidden past either,
 * and the slim scrollbar (global.css) runs only between them, in a gutter clear
 * of the rounded edge.
 */
export function Dialog({ open, onClose, children, size = 'default', initialFocusRef }: DialogProps) {
  // One modal stack (U2): Escape closes only the top layer (the RVG code
  // picker over the Add booking dialog, catch-up Phase 19), focus goes in and
  // comes back, Tab stays inside, the page behind is inert.
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  useModalLayer({ open, onClose, rootRef, panelRef, initialFocusRef })
  // The `OverlayHeader` inside names the dialog and brings the corner X (question 11).
  const [titleId, setTitleId] = useState<string | null>(null)
  const seam = useMemo(() => ({ register: setTitleId, corner: true }), [])

  const bodyRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [parts, setParts] = useState<Record<PinnedPart, HTMLElement | null>>({ header: null, footer: null })
  const report = useCallback((part: PinnedPart, el: HTMLElement | null) => setParts((p) => (p[part] === el ? p : { ...p, [part]: el })), [])
  const [edges, setEdges] = useState({ scrollable: false, above: false, below: false })
  const [inset, setInset] = useState({ head: 0, foot: 0 })
  const measure = useCallback(() => {
    const body = bodyRef.current
    if (body === null) return
    const scrollable = body.scrollHeight > body.clientHeight + 1
    const above = body.scrollTop > 1
    const below = body.scrollTop + body.clientHeight < body.scrollHeight - 1
    setEdges((e) => (e.scrollable === scrollable && e.above === above && e.below === below ? e : { scrollable, above, below }))
  }, [])
  useEffect(() => {
    if (!open) return undefined
    const sizes = () => {
      measure()
      const head = parts.header?.offsetHeight ?? 0
      const foot = parts.footer?.offsetHeight ?? 0
      setInset((i) => (i.head === head && i.foot === foot ? i : { head, foot }))
    }
    sizes()
    // jsdom has no ResizeObserver; there nothing is laid out to measure.
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(sizes)
    for (const el of [bodyRef.current, contentRef.current, parts.header, parts.footer]) if (el !== null) observer.observe(el)
    return () => observer.disconnect()
  }, [open, measure, parts])
  const pin = useMemo<DialogPin>(() => ({ edges, report }), [edges, report])

  if (!open) return null
  const hasHeader = parts.header !== null
  const hasFooter = parts.footer !== null
  const bodyStyle = {
    flex: '1 1 auto',
    minHeight: 0,
    overflowY: 'auto',
    // The scrollbar sits in a 6px gutter, clear of the card's rounded edge.
    marginRight: 6,
    padding: `${hasHeader ? 0 : space[6]}px ${BODY_INSET.right}px ${hasFooter ? 0 : 28}px ${BODY_INSET.left}px`,
    // A field scrolled to (Tab, a refusal) lands clear of the pinned parts.
    scrollPaddingTop: inset.head,
    scrollPaddingBottom: inset.foot,
    // The scrollbar's track starts under the header and ends over the footer (global.css).
    '--aa-dialog-head': `${Math.max(inset.head, space[3])}px`,
    '--aa-dialog-foot': `${Math.max(inset.foot, space[3])}px`,
  } as CSSProperties
  return (
    <div ref={rootRef} data-aa-dialog style={{ position: 'fixed', inset: 0, zIndex: zIndex.dialog, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: space[6] }}>
      <div
        onClick={onClose}
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: scrim,
          animation: `aa-fade-in ${motion.sheetIn.scrimFade}ms ${motion.sheetIn.easing}`,
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-labelledby={titleId ?? undefined}
        tabIndex={-1}
        style={{
          position: 'relative',
          outline: 'none',
          width: `min(${DIALOG_WIDTH[size]}px, 100%)`,
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: neutral.surface,
          borderRadius: radius.panel,
          boxShadow: elevation.e3,
          animation: `aa-fade-in ${motion.sheetIn.scrimFade}ms ${motion.sheetIn.easing}`,
        }}
      >
        <div ref={bodyRef} data-aa-dialog-body onScroll={measure} style={bodyStyle}>
          <div ref={contentRef} {...{ [CONTENT_ATTR]: '' }}>
            <DialogPinContext.Provider value={pin}>
              <OverlayTitleContext.Provider value={seam}>{children}</OverlayTitleContext.Provider>
            </DialogPinContext.Provider>
          </div>
        </div>
        {titleId !== null && (
          // The drawer's corner X, through the layer's one onClose (question 11; the shared CloseButton since U5).
          <CloseButton onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, display: 'flex', zIndex: zIndex.sticky }} />
        )}
      </div>
    </div>
  )
}
