import { useCallback, useLayoutEffect, useRef, useState, type ReactNode, type UIEvent } from 'react'
import { neutral, radius, zIndex } from '../../theme/tokens'
import { BookingTotalPanel, BookingTotalStrip } from '../capture'
import { DockSpacer } from '../ui/DockSpacer'
import { StickyDock } from '../ui/StickyDock'
import { BottomSheet } from './BottomSheet'
import { Dialog } from './Dialog'
import { SurfaceCtx, type BookingLayoutSlots, type Surface, type SurfaceVariant } from './context'

/**
 * `SurfaceProvider` supplies the platform surface (convention 16). Mobile's
 * `Overlay` is the existing `BottomSheet` verbatim; web's is the centred
 * `Dialog`. `BookingLayout` arranges the booking-detail slots per platform, `BookingTotal`
 * is the money object (the web panel, or the phone's dock strip since catch-up
 * Phase 24), and `Pair` is the one density
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
 * Mobile booking layout — the phone-frame `flex:1; overflow:auto` scroll region,
 * every slot in one column in capture order, between a masthead that folds as
 * you work and the pinned completion dock.
 *
 * The dock is the `CompleteBar` container Phase 04 shipped (absolute to the
 * phone-frame content region, blurred translucent bar, `14 / 20 / 32` so the
 * bottom padding clears the home indicator). That 32 is now derived rather
 * than literal: it reads the host's `--aa-inset-bottom` so the same dock clears
 * a real iPhone's home bar, a gesture-nav Android bar, or nothing at all. See
 * the inset contract in `theme/global.css`.
 * Keeping these styles here rather than in `CompleteBar` is what "splits
 * positioning into the surface" means.
 *
 * The bar swaps for the shorter success state, so bottom clearance is MEASURED.
 */
function MobileBookingLayout({ contentRef, header, history, banners, context, capture, actions, summary, completeBar, overlay }: BookingLayoutSlots) {
  const commit = summary !== null ? summary(completeBar) : completeBar
  // The dock's MEASURED height (the shared `StickyDock` measures and publishes it as `--aa-dock-height`
  // for the PWA's update pill and demo chip): the bar swaps for the shorter success state, so the
  // booking's tail clearance below tracks it rather than a number.
  const [dockHeight, setDockHeight] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

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
        data-testid="mobile-booking-scroll"
        style={{
          flex: 1,
          overflow: 'auto',
          paddingTop: 14,
          paddingLeft: 20,
          paddingRight: 20,
          // Zero, because the dock clearance is the `DockSpacer` at the tail of
          // this column instead. Trailing padding contributes no scrollable
          // extent, so on a booking whose content stops just short of filling the
          // scroller the tail would sit under the dock with no way to scroll it
          // out; see `DockSpacer` for the measurement that found this.
          paddingBottom: 0,
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
        {/* With a dock this auto-tracks the MEASURED dock height (which itself
            tracks the inset) plus whatever the keyboard is covering: the dock
            rides up by `--aa-keyboard-inset` (see below), so the clearance has
            to move with it or the booking's tail (the last BTM block, "Add another
            procedure", the quiet actions) ends up behind the dock or the keys.
            Only the device host sets that var, so in the frame it resolves to
            0 and the reserved space is unchanged. Without a dock, clear the
            host's bottom inset plus a little air, floored so a zero-inset
            device still gets a sensible tail. Both arms are 12 less than the
            old padding, which is this column's `gap`. */}
        <DockSpacer
          height={
            commit !== null
              ? `calc(${dockHeight + 4}px + var(--aa-keyboard-inset, 0px))`
              : 'max(calc(var(--aa-inset-bottom, 34px) - 6px), 12px)'
          }
        />
      </div>
      {commit !== null && (
        // Rides above the software keyboard when one is up (the var is set only by the device host, so in
        // the frame it resolves to 0 and the dock is pixel-identical).
        <StickyDock testId="mobile-booking-commit" riseWithKeyboard zIndex={zIndex.sticky} onHeight={setDockHeight}>
          {commit}
        </StickyDock>
      )}
      {overlay}
    </>
  )
}

/**
 * Web booking layout — the desktop record page, on the same 12-column grid as the
 * dashboard (`repeat(12, 1fr)`, 16px gutters, panels on the grey canvas rather
 * than nested inside one big white panel).
 *
 *   span 12  booking-wide banners when present (warnings, cancelled, post-op, prepayment)
 *   span 8   capture: the per-procedure BTM blocks
 *   span 4   commit rail: starts level with the ASA / procedure-code pair, then
 *            pins the Booking calculation (office Bookings) with a separate,
 *            matching-width complete/amend bar below it, or the bar alone on an
 *            anaesthetist Booking; patient
 *            / time / notes and quiet actions follow.
 *
 * The commit block is `sticky`, so the calculation or completion
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
function WebBookingLayout({ contentRef, header, history, banners, context, capture, actions, summary, completeBar, overlay }: BookingLayoutSlots) {
  // The rail starts level with the first card of the capture column (the
  // Procedure card since catch-up Phase 20a, as the contract picker mock sets
  // the top row): measured, not a fixed lead-in, because what sits above it varies.
  const captureColRef = useRef<HTMLDivElement>(null)
  const [railLead, setRailLead] = useState(74)
  useLayoutEffect(() => {
    const col = captureColRef.current
    if (col === null) return undefined
    const measure = () => {
      const card = col.querySelector('[data-shot="procedure-stack"], [data-shot^="capture-"]')
      if (card === null) return
      const lead = Math.max(0, Math.round(card.getBoundingClientRect().top - col.getBoundingClientRect().top))
      setRailLead((prev) => (prev === lead ? prev : lead))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(col)
    return () => ro.disconnect()
  }, [])
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

        <div ref={captureColRef} style={{ gridColumn: 'span 8', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {capture}
        </div>

        <aside
          style={{
            gridColumn: 'span 4',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            // Offset by the measured lead-in so the total panel starts level
            // with the first capture card.
            paddingTop: railLead,
          }}
        >
          {commit !== null && (
            <div
              data-testid="web-booking-commit"
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
      {overlay !== null && <div style={{ position: 'fixed', inset: 0, zIndex: zIndex.overlay, borderRadius: radius.panel }}>{overlay}</div>}
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
  BookingLayout: MobileBookingLayout,
  BookingTotal: BookingTotalStrip,
  Pair: MobilePair,
}

const WEB_SURFACE: Surface = {
  variant: 'web',
  Overlay: Dialog,
  BookingLayout: WebBookingLayout,
  BookingTotal: BookingTotalPanel,
  Pair: WebPair,
}

export function SurfaceProvider({ variant, children }: { variant: SurfaceVariant; children: ReactNode }) {
  return <SurfaceCtx.Provider value={variant === 'mobile' ? MOBILE_SURFACE : WEB_SURFACE}>{children}</SurfaceCtx.Provider>
}
