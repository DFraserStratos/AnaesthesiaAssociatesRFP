import type { ReactNode } from 'react'
import { neutral, radius } from '../../theme/tokens'
import { BottomSheet } from './BottomSheet'
import { Dialog } from './Dialog'
import { SurfaceCtx, type BodyProps, type FooterProps, type Surface, type SurfaceVariant } from './context'

/**
 * `SurfaceProvider` supplies the platform surface (convention 16). Mobile's
 * `Overlay` is the existing `BottomSheet` verbatim (so mobile is byte-identical
 * after the Phase 05 extraction); web's is the new centred `Dialog`. The
 * `Footer` positions the sticky action bar per platform. `variant` is exposed
 * for the few density tweaks (touch 44/48px targets vs desktop).
 */

/**
 * Mobile footer — exactly the `CompleteBar` outer container Phase 04 shipped:
 * absolute to the phone-frame content region, blurred translucent bar. Keeping
 * these styles here (not in `CompleteBar`) is what "splits positioning into the
 * surface Footer" means — `CompleteBar` now renders only the button / success
 * bar, identical on both platforms.
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

/** Web footer — a bottom-sticky action bar inside the detail panel. */
function WebFooter({ children }: FooterProps) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(14px)',
        borderTop: `1px solid ${neutral.line}`,
        borderBottomLeftRadius: radius.panel,
        borderBottomRightRadius: radius.panel,
        zIndex: 20,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Mobile body — the phone-frame `flex:1; overflow:auto` scroll region with the
 * bottom padding that clears the absolute footer (exactly the old
 * `CardDetailScreen` scroll container). Web body — a normal-flow column; the
 * web page itself scrolls. Keeping the difference here (not a `variant` branch
 * in the shared body) keeps shared bodies platform-agnostic.
 */
function MobileBody({ children, footerClearance }: BodyProps) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: `14px 20px ${footerClearance === true ? 130 : 40}px`, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {children}
    </div>
  )
}

function WebBody({ children, footerClearance }: BodyProps) {
  return (
    <div style={{ padding: `20px 28px ${footerClearance === true ? 96 : 28}px`, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {children}
    </div>
  )
}

const MOBILE_SURFACE: Surface = {
  variant: 'mobile',
  Overlay: BottomSheet,
  Footer: MobileFooter,
  Body: MobileBody,
}

const WEB_SURFACE: Surface = {
  variant: 'web',
  Overlay: Dialog,
  Footer: WebFooter,
  Body: WebBody,
}

export function SurfaceProvider({ variant, children }: { variant: SurfaceVariant; children: ReactNode }) {
  return <SurfaceCtx.Provider value={variant === 'mobile' ? MOBILE_SURFACE : WEB_SURFACE}>{children}</SurfaceCtx.Provider>
}
