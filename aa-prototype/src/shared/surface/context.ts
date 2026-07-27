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

/**
 * The card-detail slots. `CardDetailBody` builds each one and hands the set to
 * the surface, which decides the arrangement: mobile stacks them in one scroll
 * column with the action bar pinned to the phone frame; web lays them on the
 * 12-column desktop grid (capture left, a sticky commit rail right). The body
 * itself never branches on platform — it only says what the pieces ARE.
 */
export interface CardLayoutSlots {
  /** The History affordance (right-aligned; a page action on desktop). */
  history: ReactNode
  /** Card-wide notices: cancelled, copied, post-op, pre-payment gate, refusals. */
  banners: ReactNode
  /** Patient, scheduled time, attachments, notes for the office. */
  context: ReactNode
  /** The per-procedure BTM capture blocks plus Add another procedure. */
  capture: ReactNode
  /** Copy for an additional procedure, cancel card, post-op addendum. */
  actions: ReactNode
  /**
   * The Card's running units + fee, as a function of the action to embed in it.
   * Desktop pins it beside the capture column and passes `completeBar` in, so
   * the figure and the button that commits it are one block; mobile drops it
   * (the phone already carries the per-procedure fee panel and the completion
   * overlay, and a second total would cost a screenful). Null on a cancelled or
   * procedure-less Card.
   */
  summary: ((action: ReactNode) => ReactNode) | null
  /**
   * The complete / amend bar, or null when the Card offers neither. Mobile pins
   * it to the phone frame; desktop hands it to `summary`. Exactly one surface
   * renders it.
   */
  completeBar: ReactNode
  /** The completion flood, or null. Each surface positions it. */
  overlay: ReactNode
}

export type SurfaceVariant = 'mobile' | 'web'

export interface Surface {
  variant: SurfaceVariant
  /** Modal container — mobile `BottomSheet`, web `Dialog` (same signature). */
  Overlay: (props: OverlayProps) => ReactNode
  /** Card-detail arranger — one scroll column (mobile) / two-column grid (web). */
  CardLayout: (props: CardLayoutSlots) => ReactNode
  /**
   * Two related cards: stacked on the phone, side by side on the desktop. Lets a
   * shared capture block use the width a desktop has without knowing it is on one.
   */
  Pair: (props: { children: ReactNode }) => ReactNode
  /**
   * Where the Card's money is shown. `inline` puts a fee panel under each
   * procedure's capture block — the phone's only option, since it has nowhere
   * to pin one. `pinned` shows it once in the desktop commit rail, where it
   * stays on screen; an inline panel would then repeat the same figure, which
   * on the common one-procedure Card is the same dollar amount twice.
   */
  feePlacement: 'inline' | 'pinned'
}

export const SurfaceCtx = createContext<Surface | null>(null)

/** Read the active surface. Throws if used outside a `SurfaceProvider`. */
export function useSurface(): Surface {
  const surface = useContext(SurfaceCtx)
  if (surface === null) throw new Error('useSurface must be used within a <SurfaceProvider>')
  return surface
}
