/**
 * The parts the Admin List drawers share (catch-up Phase 32c): a labelled
 * section (its label the shared `Eyebrow`; its label and value rows the shared
 * `DefRow` in a `DefList` since UI unification U6), the small teal-text link button and the
 * footer actions' layout styles (the actions themselves are compact `Button`s
 * since UI unification U5 folded `ActionBtn` into it). Used inside `SidePanel`
 * by the Draft List drawer and by SlotDrawer's List and empty-session drawers
 * (one copy since UI unification U2).
 */

import type { CSSProperties } from 'react'
import { accent, neutral, radius } from '../../../theme/tokens'
import { Eyebrow } from '../../../shared/ui'

/** A drawer section: its label is an `h3` Eyebrow under the drawer's `h2`, reachable by heading (U6). */
export function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Eyebrow as="h3">{label}</Eyebrow>
      {children}
    </div>
  )
}

export function DrawerLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="aa-ctl" onClick={onClick} style={{ border: `1px solid ${neutral.line}`, background: neutral.surface, color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', borderRadius: radius.sm, padding: '4px 10px' }}>
      {children}
    </button>
  )
}

/**
 * The footer's one primary (a compact `Button`): it takes the row's spare width (U5). The drawer's
 * 12px side padding is kept so a List's four actions still fit on one row of the 440px drawer.
 */
export const DRAWER_ACTION_PRIMARY: CSSProperties = { flex: '1 1 auto', minWidth: 0, whiteSpace: 'nowrap', padding: '0 12px' }

/** The footer's other actions (compact secondary `Button`s): their own width, the same 12px padding (U5). */
export const DRAWER_ACTION: CSSProperties = { flex: '0 0 auto', minWidth: 0, whiteSpace: 'nowrap', padding: '0 12px' }
