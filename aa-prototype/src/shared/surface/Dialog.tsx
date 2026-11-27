import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { elevation, neutral, radius, scrim, space, zIndex } from '../../theme/tokens'
import { motion } from '../../theme/motion'
import { useModalLayer } from './useModalLayer'
import { OverlayTitleContext } from './overlayTitle'
import { DialogSlotsContext, type DialogSlots } from './dialogSlots'
import { CloseButton } from '../ui/IconButton'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Accepted for signature parity with the mobile bottom sheet; unused on web. */
  hideHandle?: boolean
  /** `wide` for a two-column body (the step rail). */
  size?: 'default' | 'wide'
  /** The control that takes focus on open (a confirm's safe button). */
  initialFocusRef?: RefObject<HTMLElement>
}

/** A slot element the header or footer portals into, made once per dialog. */
function slotElement(name: 'header' | 'footer', gap: number): HTMLElement {
  const el = document.createElement('div')
  el.setAttribute('data-aa-dialog-slot', name)
  el.style.display = 'flex'
  el.style.flexDirection = 'column'
  el.style.gap = `${gap}px`
  return el
}

/** A ref that hosts a slot element inside a React-rendered wrapper. */
function useHost(slot: HTMLElement) {
  return useCallback((wrapper: HTMLDivElement | null) => {
    if (wrapper !== null && slot.parentNode !== wrapper) wrapper.appendChild(slot)
  }, [slot])
}

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
 * The card never scrolls as a whole (docs/explorations/dialog-scroll-ideas.html,
 * option C): the `OverlayHeader` pins to a fixed header with the X, the
 * `SheetActions` row pins to a fixed footer, and only the body between them
 * scrolls, with a slim scrollbar kept off the rounded corners. A hairline shows
 * under the header while content is hidden above, and over the footer while
 * content is hidden below.
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

  const [footers, setFooters] = useState(0)
  const [header] = useState(() => slotElement('header', space[2]))
  const [footer] = useState(() => slotElement('footer', space[3]))
  const slots = useMemo<DialogSlots>(() => ({
    header,
    footer,
    registerFooter: () => {
      setFooters((n) => n + 1)
      return () => setFooters((n) => n - 1)
    },
  }), [header, footer])
  const hostHeader = useHost(header)
  const hostFooter = useHost(footer)

  // Hidden content above or below the scrolling body: the hairlines' cue.
  const bodyRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  // An empty body (a confirm whose header and footer say it all) collapses.
  const [edges, setEdges] = useState({ above: false, below: false, empty: false })
  const measure = useCallback(() => {
    const body = bodyRef.current
    if (body === null) return
    const above = body.scrollTop > 1
    const below = body.scrollTop + body.clientHeight < body.scrollHeight - 1
    const empty = (contentRef.current?.offsetHeight ?? 0) === 0 && typeof ResizeObserver !== 'undefined'
    setEdges((e) => (e.above === above && e.below === below && e.empty === empty ? e : { above, below, empty }))
  }, [])
  useEffect(() => {
    if (!open) return undefined
    measure()
    // jsdom has no ResizeObserver; there nothing is laid out to measure.
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    if (bodyRef.current !== null) observer.observe(bodyRef.current)
    if (contentRef.current !== null) observer.observe(contentRef.current)
    return () => observer.disconnect()
  }, [open, measure])

  if (!open) return null
  const hasHeader = titleId !== null
  const hasFooter = footers > 0
  const hairline = (on: boolean) => `1px solid ${on ? neutral.line : 'transparent'}`
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
          width: size === 'wide' ? 'min(760px, 100%)' : 'min(520px, 100%)',
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
        <div
          ref={hostHeader}
          data-aa-dialog-header
          style={{
            flex: 'none',
            padding: hasHeader ? `${space[6]}px ${space[6]}px 14px` : 0,
            borderBottom: hasHeader ? hairline(edges.above) : 'none',
            transition: `border-color ${motion.sheetIn.scrimFade}ms`,
          }}
        />
        <div
          ref={bodyRef}
          data-aa-dialog-body
          onScroll={measure}
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            // The scrollbar sits in a 6px gutter, clear of the card's rounded edge.
            marginRight: 6,
            padding: edges.empty ? 0 : `${hasHeader ? space[1] : space[6]}px 18px ${hasFooter ? space[1] : 28}px ${space[6]}px`,
            scrollbarWidth: 'thin',
            scrollbarColor: `${neutral.lineStrong} transparent`,
          }}
        >
          <div ref={contentRef}>
            <DialogSlotsContext.Provider value={slots}>
              <OverlayTitleContext.Provider value={seam}>{children}</OverlayTitleContext.Provider>
            </DialogSlotsContext.Provider>
          </div>
        </div>
        <div
          ref={hostFooter}
          data-aa-dialog-footer
          style={{
            flex: 'none',
            padding: hasFooter ? `14px ${space[6]}px ${space[6]}px` : 0,
            borderTop: hasFooter ? hairline(edges.below) : 'none',
            transition: `border-color ${motion.sheetIn.scrimFade}ms`,
          }}
        />
        {hasHeader && (
          // The drawer's corner X, through the layer's one onClose (question 11; the shared CloseButton since U5).
          <CloseButton onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, display: 'flex' }} />
        )}
      </div>
    </div>
  )
}
