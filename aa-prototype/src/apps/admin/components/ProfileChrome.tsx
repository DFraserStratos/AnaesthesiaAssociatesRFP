/**
 * The chrome of the Admin profile pages (catch-up Phase 17): the surgeon
 * profile and the Admin anaesthetist record. `ProfilePage` is the Admin page
 * frame (`AdminPage`, fluid) with the back link to the Master data view, the
 * name as the title, its identifier chip beside it and the page's actions; its
 * cards are the shared `Card` and its facts `DefRow layout="stacked"` since UI
 * unification U6. `PROFILE_GRID` lays the cards across the full width.
 * Phase 26 extends the anaesthetist record on it.
 */

import type { CSSProperties, ReactNode } from 'react'
import { neutral, radius } from '../../../theme/tokens'
import { Button, PageHeader } from '../../../shared/ui'
import { AdminPage } from './AdminPage'

export function ProfilePage({
  shot,
  back,
  name,
  chip,
  sub,
  action,
  children,
}: {
  shot: string
  /** The Master data view the record belongs to: "Anaesthetists", "Surgeons". */
  back: { label: string; to: string }
  name: string
  chip?: ReactNode
  sub?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <AdminPage
      mode="fluid"
      shot={shot}
      back={back}
      title={name}
      {...(chip !== undefined ? { aside: chip } : {})}
      {...(sub !== undefined ? { sub } : {})}
      {...(action !== undefined ? { actions: action } : {})}
    >
      {children}
    </AdminPage>
  )
}

/**
 * The record's cards side by side across the full width (docs/admin-layout-audit.md): columns of at
 * least 320px, the cards stretching to fill the row. A wide card spans two (`PROFILE_WIDE_CARD`).
 */
export const PROFILE_GRID: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }

/** A card that takes two of the grid's columns (the anaesthetist's Profile). */
export const PROFILE_WIDE_CARD: CSSProperties = { minWidth: 0, gridColumn: 'span 2' }

/** A label and value list inside a profile card, flowing into as many columns as the card holds. */
export const PROFILE_FACTS: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }

/**
 * The title row on its own (the component catalogue's preview; the pages take it from `ProfilePage`):
 * the shared `PageHeader` (admin, 24/30; UI unification U6) with the identifier
 * chip beside the name (outside the heading, 12px from it, as before), the sub-line and the
 * page's action.
 */
export function ProfileHeader({ name, chip, sub, action }: { name: string; chip?: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <PageHeader
      size="admin"
      title={name}
      {...(chip !== undefined ? { aside: chip, asideGap: 12 } : {})}
      {...(sub !== undefined ? { sub } : {})}
      {...(action !== undefined ? { actions: action } : {})}
      style={{ paddingBottom: 4 }}
    />
  )
}

/** An identifier as a mono chip: "HPI CPN 47REIA". */
export function IdChip({ label, value, empty, shot }: { label: string; value: string | undefined; empty?: string; shot?: string }) {
  // No value held (catch-up Phase 17b: a surgeon with no HPI CPN yet): `empty` in mist, not mono.
  const held = value !== undefined && value !== ''
  return (
    <span data-shot={shot} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '3px 10px', borderRadius: radius.pill, background: neutral.sunken, border: `1px solid ${neutral.line}` }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: neutral.mist }}>{label}</span>
      {held ? (
        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>{value}</span>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 500, color: neutral.mist }}>{empty ?? 'None'}</span>
      )}
    </span>
  )
}

/** A profile card's style on the shared `Card`: it may shrink inside the page's card grid. */
export const PROFILE_CARD: CSSProperties = { minWidth: 0 }

/** The page's actions: the record's History, then Edit details. */
export function HeaderActions({ onHistory, onEdit }: { onHistory: () => void; onEdit: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
      <Button variant="secondary" onClick={onHistory}>History</Button>
      <Button variant="secondary" onClick={onEdit}>Edit details</Button>
    </div>
  )
}
