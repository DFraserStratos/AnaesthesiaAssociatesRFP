import { createContext, useContext, type ReactNode, type RefObject } from 'react'

/**
 * SurfaceContext — the seam that lets ONE shared implementation of every
 * flow / capture sheet / booking body satisfy convention 16 on both platforms
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

/** One line above the total: a procedure on a multi-procedure Booking, or one of a
 *  single procedure's fee lines when it has more than one. */
export interface BookingTotalLine {
  label: string
  amount: number
  /** A short qualifier, e.g. "time units only". */
  note?: string
}

/**
 * The Booking calculation: units, fee and breakdown. Office Bookings only; the
 * anaesthetist Booking shows none, so only the desktop surface renders it (the
 * phone's `BookingTotal` renders nothing).
 *
 * `action` is the complete / amend bar. The web layout passes null and renders
 * the control as a separate, matching-width sibling below the total.
 */
export interface BookingTotalProps {
  /** Summed billable units across the Booking's procedures (`bookingFee`). */
  units: number
  /** Summed fee across the Booking's procedures (`bookingFee`). */
  fee: number
  /** Breakdown rows; empty when there is nothing to break down. */
  lines: readonly BookingTotalLine[]
  /** The applied rate, e.g. "FEE @ $26.50/UNIT", or null when procedures disagree. */
  rateLabel: string | null
  /** Price-override note, or null. */
  overrideNote: string | null
  /** The complete / amend bar. Omitted on a locked Booking. */
  action?: ReactNode
}

/**
 * The booking-detail slots. `BookingDetailBody` builds each one and hands the set to
 * the surface, which decides the arrangement: mobile stacks them in one scroll
 * column with the total and the action bar pinned to the phone frame; web lays
 * them on the 12-column desktop grid (capture left, a sticky commit rail
 * right). The body itself never branches on platform — it only says what the
 * pieces ARE.
 */
export interface BookingLayoutSlots {
  /**
   * The rendered content region. Booking validation uses this scope to find the
   * first incomplete control without reaching into another mounted Booking in the
   * mobile slide stack.
   */
  contentRef: RefObject<HTMLDivElement>
  /**
   * The platform masthead, as a function of whether the scroll region has moved
   * off the top. Mobile hands one in so it can fold to a nav row as you work
   * (the room that pays for the pinned total); web and admin render their own
   * page header above the body and pass null. The second argument lets desktop
   * and mobile chrome group the History action with that header instead of
   * stranding it in a separate row. Only a surface that OWNS the scroll region
   * can honour `collapsed`.
   */
  header: ((collapsed: boolean, history: ReactNode) => ReactNode) | null
  /** The History affordance (right-aligned; a page action on desktop). */
  history: ReactNode
  /** Booking-wide notices: cancelled, copied, post-op, prepayment warning, refusals. */
  banners: ReactNode
  /** Patient, scheduled time, attachments, notes for the office. */
  context: ReactNode
  /** The per-procedure BTM capture blocks plus Add another procedure. */
  capture: ReactNode
  /** Copy booking, cancel booking, post-op addendum. */
  actions: ReactNode
  /**
   * The Booking's visible calculation, as a function of the action to embed in it.
   * Fee and Units modes pin it while the capture column scrolls; Off passes null
   * and leaves only the completion control. Mobile passes `completeBar` into the
   * calculation stack; web passes null and renders it as a separate sibling.
   * Cancelled and procedure-less Bookings also pass null.
   */
  summary: ((action: ReactNode) => ReactNode) | null
  /**
   * The complete / amend bar, or null when the Booking offers neither. Handed to
   * `summary` on mobile and rendered beside it by the web layout, so exactly one
   * thing renders it.
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
  /** Booking-detail arranger — one scroll column (mobile) / two-column grid (web). */
  BookingLayout: (props: BookingLayoutSlots) => ReactNode
  /**
   * The Booking's calculation object — the desktop rail's ink panel, or the phone
   * dock's compact strip. Fee mode stacks or chips procedures; Units mode
   * suppresses every monetary field.
   */
  BookingTotal: (props: BookingTotalProps) => ReactNode
  /**
   * Two related cards: stacked on the phone, side by side on the desktop. Lets a
   * shared capture block use the width a desktop has without knowing it is on one.
   *
   * Side by side they match heights, because two peer cards on one row with
   * different bottom edges read as a fault. `align="start"` opts out, for the
   * pair whose halves are content blocks INSIDE one card rather than two cards:
   * there the shorter half has no border to justify the extra height, so it
   * would just be a stretched box of background colour.
   */
  Pair: (props: { children: ReactNode; align?: 'stretch' | 'start' }) => ReactNode
}

export const SurfaceCtx = createContext<Surface | null>(null)

/** Read the active surface. Throws if used outside a `SurfaceProvider`. */
export function useSurface(): Surface {
  const surface = useContext(SurfaceCtx)
  if (surface === null) throw new Error('useSurface must be used within a <SurfaceProvider>')
  return surface
}
