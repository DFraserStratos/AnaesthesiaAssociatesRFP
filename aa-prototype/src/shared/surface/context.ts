import { createContext, useContext, type ReactNode, type RefObject } from 'react'

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

/** One line above the total: a procedure on a multi-procedure Card, or one of a
 *  single procedure's fee lines when it has more than one. */
export interface CardTotalLine {
  label: string
  amount: number
  /** A short qualifier, e.g. "time units only". */
  note?: string
}

export type CardTotalDisplayMode = 'units' | 'fee'

/**
 * The Card calculation. Both surfaces are handed the same figures and each
 * renders either units alone or the full fee presentation in its own shape.
 * The desktop has room for a stacked breakdown; the phone turns procedures
 * into chips and leaves fee-line detail to the capture column.
 *
 * `action` is the complete / amend bar. The phone total embeds it in the dock's
 * stack; the web layout passes null and renders the control as a separate,
 * matching-width sibling below the total.
 */
export interface CardTotalProps {
  /** Units-only privacy view, or the full units-and-fee presentation. */
  displayMode: CardTotalDisplayMode
  /** Summed billable units across the Card's procedures (`cardFee`). */
  units: number
  /** Summed fee across the Card's procedures (`cardFee`). */
  fee: number
  /** Breakdown rows; empty when there is nothing to break down. */
  lines: readonly CardTotalLine[]
  /**
   * True when `lines` are one per PROCEDURE, false when they are one
   * procedure's several fee lines. The two are not interchangeable: a surface
   * that shows procedures as chips must not chip up fee lines, which have no
   * ordinal to name them by.
   */
  linesArePerProcedure: boolean
  /** The applied rate, e.g. "FEE @ $26.50/UNIT", or null when procedures disagree. */
  rateLabel: string | null
  /** Price-override note, or null. */
  overrideNote: string | null
  /** The complete / amend bar. Omitted on a locked Card. */
  action?: ReactNode
}

/**
 * The card-detail slots. `CardDetailBody` builds each one and hands the set to
 * the surface, which decides the arrangement: mobile stacks them in one scroll
 * column with the total and the action bar pinned to the phone frame; web lays
 * them on the 12-column desktop grid (capture left, a sticky commit rail
 * right). The body itself never branches on platform — it only says what the
 * pieces ARE.
 */
export interface CardLayoutSlots {
  /**
   * The rendered content region. Card validation uses this scope to find the
   * first incomplete control without reaching into another mounted Card in the
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
  /** Card-wide notices: cancelled, copied, post-op, pre-payment gate, refusals. */
  banners: ReactNode
  /** Patient, scheduled time, attachments, notes for the office. */
  context: ReactNode
  /** The per-procedure BTM capture blocks plus Add another procedure. */
  capture: ReactNode
  /** Copy for an additional procedure, cancel card, post-op addendum. */
  actions: ReactNode
  /**
   * The Card's visible calculation, as a function of the action to embed in it.
   * Fee and Units modes pin it while the capture column scrolls; Off passes null
   * and leaves only the completion control. Mobile passes `completeBar` into the
   * calculation stack; web passes null and renders it as a separate sibling.
   * Cancelled and procedure-less Cards also pass null.
   */
  summary: ((action: ReactNode) => ReactNode) | null
  /**
   * The complete / amend bar, or null when the Card offers neither. Handed to
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
  /** Card-detail arranger — one scroll column (mobile) / two-column grid (web). */
  CardLayout: (props: CardLayoutSlots) => ReactNode
  /**
   * The Card's calculation object — the desktop rail's ink panel, or the phone
   * dock's compact strip. Fee mode stacks or chips procedures; Units mode
   * suppresses every monetary field.
   */
  CardTotal: (props: CardTotalProps) => ReactNode
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
