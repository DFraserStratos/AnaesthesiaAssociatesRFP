import { createContext, useContext, type ReactNode } from 'react'

/**
 * SurfaceContext — the seam that lets ONE shared implementation of every
 * flow / capture sheet / card body satisfy convention 16 on both platforms
 * (mobile bottom sheet vs desktop dialog / panel) with no per-platform
 * branching in the bodies themselves. A shared component asks `useSurface()`
 * for its `Overlay` (modal container) and `Footer` (sticky action-bar
 * container); the provider (`SurfaceProvider`) supplies the platform versions.
 *
 * The context + hook live here (pure, no JSX) so the provider file can export
 * only its component.
 */

export interface OverlayProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Hide the drag handle on mobile (sheet owns its own header chrome). */
  hideHandle?: boolean
}

export interface FooterProps {
  children: ReactNode
}

export interface BodyProps {
  children: ReactNode
  /** Reserve bottom space so a sticky/absolute action footer never hides content. */
  footerClearance?: boolean
}

export type SurfaceVariant = 'mobile' | 'web'

export interface Surface {
  variant: SurfaceVariant
  /** Modal container — mobile `BottomSheet`, web `Dialog` (same signature). */
  Overlay: (props: OverlayProps) => ReactNode
  /** Sticky action-bar container — absolute bottom (mobile) / sticky bar (web). */
  Footer: (props: FooterProps) => ReactNode
  /** Scroll/content container — the phone's `flex:1;overflow:auto` scroll region
   *  vs the web page's normal-flow column. Lets a shared body avoid branching on
   *  `variant` for its own scroll chrome. */
  Body: (props: BodyProps) => ReactNode
}

export const SurfaceCtx = createContext<Surface | null>(null)

/** Read the active surface. Throws if used outside a `SurfaceProvider`. */
export function useSurface(): Surface {
  const surface = useContext(SurfaceCtx)
  if (surface === null) throw new Error('useSurface must be used within a <SurfaceProvider>')
  return surface
}
