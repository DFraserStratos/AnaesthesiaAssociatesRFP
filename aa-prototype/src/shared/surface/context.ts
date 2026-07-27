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

/** One line above the total: a procedure on a multi-procedure Card, or one of a
 *  single procedure's fee lines when it has more than one. */
export interface CardTotalLine {
  label: string
  amount: number
  /** A short qualifier, e.g. "time units only". */
  note?: string
}

/**
 * The Card's money. Both surfaces are handed the same figures and each renders
 * what its shape can hold: the desktop rail has room for the full breakdown as
 * stacked rows, the phone's dock has one line, so it turns the procedures into
 * chips and leaves fee-line detail to the `BillingLinesCard` in the column.
 *
 * `action` is the complete / amend bar, which every surface embeds so the figure
 * and the button that commits it are one object. Where it sits inside that
 * object is the surface's business.
 */
export interface CardTotalProps {
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
   * The platform masthead, as a function of whether the scroll region has moved
   * off the top. Mobile hands one in so it can fold to a nav row as you work
   * (the room that pays for the pinned total); web and admin render their own
   * page header above the body and pass null. Only a surface that OWNS the
   * scroll region can honour the argument, so a surface that does not simply
   * calls it with false.
   */
  header: ((collapsed: boolean) => ReactNode) | null
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
   * BOTH surfaces pin it and pass `completeBar` in, so the figure and the button
   * that commits it are one block that stays on screen while the capture column
   * scrolls under it: desktop beside the column, mobile above the home
   * indicator. That is the whole point of the object — a modifier tap has to
   * tick a fee the thumb can see. Null on a cancelled or procedure-less Card,
   * where the layout falls back to `completeBar` alone.
   */
  summary: ((action: ReactNode) => ReactNode) | null
  /**
   * The complete / amend bar, or null when the Card offers neither. Handed to
   * `summary` wherever there is one, so exactly one thing renders it.
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
   * The Card's money object — the desktop rail's full ink panel, or the phone
   * dock's one-line strip. Same figures, same tick, different shape: the panel
   * stacks a row per procedure, the strip turns them into fixed-height chips so
   * the dock is the same height for one procedure or five.
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
