import { useCallback, useLayoutEffect, useRef, useState, type ReactNode, type UIEvent } from 'react'
import { neutral, radius } from '../../theme/tokens'
import { CardTotalPanel, CardTotalStrip } from '../capture'
import { BottomSheet } from './BottomSheet'
import { Dialog } from './Dialog'
import { SurfaceCtx, type CardLayoutSlots, type Surface, type SurfaceVariant } from './context'

/**
 * `SurfaceProvider` supplies the platform surface (convention 16). Mobile's
 * `Overlay` is the existing `BottomSheet` verbatim; web's is the centred
 * `Dialog`. `CardLayout` arranges the card-detail slots per platform, `CardTotal`
 * is the money object in that platform's shape, and `Pair` is the one density
 * primitive a shared capture block needs. `variant` is exposed for the few
 * remaining density tweaks (touch 44/48px targets vs desktop).
 */

/** Fold the masthead past this much scroll; unfold again below `EXPAND_AT`.
 *  Two thresholds, not one: folding lengthens the scroll region, and a single
 *  threshold can then hand back a scrollTop that immediately unfolds it. */
const COLLAPSE_AT = 24
const EXPAND_AT = 6
const WEB_COMMIT_HALO = 12

/**
 * Mobile card layout — the phone-frame `flex:1; overflow:auto` scroll region,
 * every slot in one column in capture order, between a masthead that folds as
 * you work and the pinned calculation / completion dock.
 *
 * The dock is the `CompleteBar` container Phase 04 shipped (absolute to the
 * phone-frame content region, blurred translucent bar, `14 / 20 / 32` so the
 * bottom padding clears the home indicator) and optionally carrying the Card
 * calculation above it.
 * Keeping these styles here rather than in `CompleteBar` / `CardTotalStrip` is
 * what "splits positioning into the surface" means.
 *
 * Its height is content-dependent: Off carries only the action, Units adds a
 * compact count, and Fee may add procedure chips or an override note. The bar
 * also swaps for the shorter success state, so bottom clearance is MEASURED.
 */
function MobileCardLayout({ contentRef, header, history, banners, context, capture, actions, summary, completeBar, overlay }: CardLayoutSlots) {
  const commit = summary !== null ? summary(completeBar) : completeBar
  const dockRef = useRef<HTMLDivElement | null>(null)
  const [dockHeight, setDockHeight] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  useLayoutEffect(() => {
    const el = dockRef.current
    if (el === null) {
      setDockHeight(0)
      return
    }
    const measure = () => setDockHeight(el.getBoundingClientRect().height)
    measure()
    // jsdom has no ResizeObserver, and the observer only REFINES a value the
    // one-shot measurement already set, so there is nothing to shim.
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [commit])

  const onScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const y = e.currentTarget.scrollTop
    setCollapsed((was) => (was ? y > EXPAND_AT : y > COLLAPSE_AT))
  }, [])

  return (
    <>
      {header !== null && header(collapsed, history)}
      <div
        ref={contentRef}
        onScroll={onScroll}
        data-testid="mobile-card-scroll"
        style={{
          flex: 1,
          overflow: 'auto',
          padding: `14px 20px ${commit !== null ? dockHeight + 16 : 40}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {header === null && history}
        {banners}
        {context}
        {capture}
        {actions}
      </div>
      {commit !== null && (
        <div
          ref={dockRef}
          data-testid="mobile-card-commit"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '14px 20px 32px',
            background: 'rgba(246,248,247,0.92)',
            backdropFilter: 'blur(14px)',
            borderTop: `1px solid ${neutral.line}`,
            zIndex: 45,
          }}
        >
          {commit}
        </div>
      )}
      {overlay}
    </>
  )
}

/**
 * Web card layout — the desktop record page, on the same 12-column grid as the
 * dashboard (`repeat(12, 1fr)`, 16px gutters, panels on the grey canvas rather
 * than nested inside one big white panel).
 *
 *   span 12  card-wide banners when present (a pre-payment gate governs everything)
 *   span 8   capture: the per-procedure BTM blocks
 *   span 4   commit rail: starts level with the ASA / procedure-code pair, then
 *            pins the chosen Card calculation with a separate, matching-width
 *            complete/amend bar below it, or the bar alone in Off mode; patient
 *            / time / attachments / notes and quiet actions follow.
 *
 * The commit block is `sticky`, so the selected calculation or completion
 * action stays in place while the capture column scrolls under it. It carries
 * the canvas colour as its own background (with the padding
 * cancelled by equal negative margins) so rail content passes behind it rather
 * than through it. The 8px separation and equal widths mirror the phone dock,
 * while keeping the two controls visually independent. Its background extends
 * 12px around both sides and the bottom without narrowing either control. The
 * lower corners continue the button's curve through that halo: the outer radius
 * is the button radius plus the halo. The top stays square so no scrolling
 * content peeks through beside the pinned panel. The grid deliberately does NOT
 * set `align-items: start`: the rail must stretch to the row height or the sticky
 * block has nowhere to travel.
 */
function WebCardLayout({ contentRef, header, history, banners, context, capture, actions, summary, completeBar, overlay }: CardLayoutSlots) {
  const commit =
    summary !== null ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {summary(null)}
        {completeBar}
      </div>
    ) : (
      completeBar
    )

  return (
    <>
      {/* A supplied web header absorbs History into its patient/action group.
          Admin owns its header outside this seam and therefore keeps the
          standalone History row below. */}
      {header !== null && header(false, history)}
      <div ref={contentRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
        {(header === null || banners !== null) && (
          <div style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {header === null && history}
            {banners}
          </div>
        )}

        <div style={{ gridColumn: 'span 8', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {capture}
        </div>

        <aside
          style={{
            gridColumn: 'span 4',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            // The capture column opens with its procedure title and billing
            // context. Offset the rail by that standard two-row lead-in so its
            // black total panel starts level with the first capture-card pair.
            paddingTop: 74,
          }}
        >
          {commit !== null && (
            <div
              data-testid="web-card-commit"
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 5,
                background: neutral.bg,
                padding: `16px ${WEB_COMMIT_HALO}px ${WEB_COMMIT_HALO}px`,
                margin: `-16px -${WEB_COMMIT_HALO}px -${WEB_COMMIT_HALO}px`,
                borderRadius: `0 0 ${radius.card + WEB_COMMIT_HALO}px ${radius.card + WEB_COMMIT_HALO}px`,
              }}
            >
              {commit}
            </div>
          )}
          {context}
          {actions}
        </aside>
      </div>

      {/* Fixed, not absolute: the record page is taller than the viewport, so an
          absolute flood would centre its tick somewhere off screen. */}
      {overlay !== null && <div style={{ position: 'fixed', inset: 0, zIndex: 60, borderRadius: radius.panel }}>{overlay}</div>}
    </>
  )
}

/** Mobile pair — no grouping at all; the two cards stay stacked in the column. */
function MobilePair({ children }: { children: ReactNode }) {
  return <>{children}</>
}

/**
 * Web pair — two equal columns, matched in height by default: two white cards
 * side by side with different bottom edges read as a fault, however little
 * content the shorter one has. The cards absorb the slack through
 * `CaptureSection`'s `footer` slot, which anchors the caption or trailing
 * action to the card's foot instead of leaving it stranded mid-card.
 * `align="start"` is for halves that are not cards (see the seam's docblock).
 */
function WebPair({ children, align = 'stretch' }: { children: ReactNode; align?: 'stretch' | 'start' }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: align }}>{children}</div>
}

const MOBILE_SURFACE: Surface = {
  variant: 'mobile',
  Overlay: BottomSheet,
  CardLayout: MobileCardLayout,
  CardTotal: CardTotalStrip,
  Pair: MobilePair,
}

const WEB_SURFACE: Surface = {
  variant: 'web',
  Overlay: Dialog,
  CardLayout: WebCardLayout,
  CardTotal: CardTotalPanel,
  Pair: WebPair,
}

export function SurfaceProvider({ variant, children }: { variant: SurfaceVariant; children: ReactNode }) {
  return <SurfaceCtx.Provider value={variant === 'mobile' ? MOBILE_SURFACE : WEB_SURFACE}>{children}</SurfaceCtx.Provider>
}
