import type { ReactNode } from 'react'
import { neutral, radius } from '../../theme/tokens'
import { BottomSheet } from './BottomSheet'
import { Dialog } from './Dialog'
import { SurfaceCtx, type CardLayoutSlots, type FooterProps, type Surface, type SurfaceVariant } from './context'

/**
 * `SurfaceProvider` supplies the platform surface (convention 16). Mobile's
 * `Overlay` is the existing `BottomSheet` verbatim; web's is the centred
 * `Dialog`. `CardLayout` arranges the card-detail slots per platform and `Pair`
 * is the one density primitive a shared capture block needs. `variant` is
 * exposed for the few remaining density tweaks (touch 44/48px targets vs desktop).
 */

/**
 * Mobile footer — exactly the `CompleteBar` outer container Phase 04 shipped:
 * absolute to the phone-frame content region, blurred translucent bar. Keeping
 * these styles here (not in `CompleteBar`) is what "splits positioning into the
 * surface" means — `CompleteBar` renders only the button / success bar,
 * identical on both platforms.
 */
function MobileFooter({ children }: FooterProps) {
  return (
    <div
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
      {children}
    </div>
  )
}

/**
 * Mobile card layout — the phone-frame `flex:1; overflow:auto` scroll region
 * with the bottom padding that clears the absolute footer, holding every slot
 * in one column in capture order. Byte-identical to the pre-desktop stack: the
 * slots are fragments, so each piece is still a direct flex child on the same
 * 12px gap.
 */
function MobileCardLayout({ history, banners, context, capture, actions, completeBar, overlay }: CardLayoutSlots) {
  return (
    <>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: `14px 20px ${completeBar !== null ? 130 : 40}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {history}
        {banners}
        {context}
        {capture}
        {actions}
      </div>
      {completeBar !== null && <MobileFooter>{completeBar}</MobileFooter>}
      {overlay}
    </>
  )
}

/**
 * Web card layout — the desktop record page, on the same 12-column grid as the
 * dashboard (`repeat(12, 1fr)`, 16px gutters, panels on the grey canvas rather
 * than nested inside one big white panel).
 *
 *   span 12  history + card-wide banners (a pre-payment gate governs everything)
 *   span 8   capture: the per-procedure BTM blocks
 *   span 4   commit rail: the Card total with the complete/amend bar inside it,
 *            pinned; then the patient / time / attachments / notes context and
 *            the quiet secondary actions.
 *
 * The commit block is `sticky`, so the fee ticks in place while the capture
 * column scrolls under it — the one thing a desktop can do that the phone
 * cannot. It carries the canvas colour as its own background (with the padding
 * cancelled by equal negative margins) so rail content passes behind it rather
 * than through it. The grid deliberately does NOT set `align-items: start`: the
 * rail must stretch to the row height or the sticky block has nowhere to travel.
 */
function WebCardLayout({ history, banners, context, capture, actions, summary, completeBar, overlay }: CardLayoutSlots) {
  const commit = summary !== null ? summary(completeBar) : completeBar

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
        <div style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {history}
          {banners}
        </div>

        <div style={{ gridColumn: 'span 8', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {capture}
        </div>

        <aside style={{ gridColumn: 'span 4', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {commit !== null && (
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 5,
                background: neutral.bg,
                padding: '16px 0 12px',
                margin: '-16px 0 -12px',
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
  Pair: MobilePair,
  feePlacement: 'inline',
}

const WEB_SURFACE: Surface = {
  variant: 'web',
  Overlay: Dialog,
  CardLayout: WebCardLayout,
  Pair: WebPair,
  feePlacement: 'pinned',
}

export function SurfaceProvider({ variant, children }: { variant: SurfaceVariant; children: ReactNode }) {
  return <SurfaceCtx.Provider value={variant === 'mobile' ? MOBILE_SURFACE : WEB_SURFACE}>{children}</SurfaceCtx.Provider>
}
