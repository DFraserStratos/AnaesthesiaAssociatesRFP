/**
 * The chrome of the Admin profile pages (catch-up Phase 17): the surgeon
 * profile and the Admin anaesthetist record. A back link to the Master data
 * view, a header with the name, its identifier chip and the page's action,
 * and plain white cards. Phase 26 extends the anaesthetist record on it.
 */

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { neutral, radius } from '../../../theme/tokens'
import { Button } from '../../../shared'

export function ProfilePage({ shot, children }: { shot: string; children: ReactNode }) {
  return <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>{children}</div>
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="aa-table-entity-link" style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 600, color: neutral.slate, gap: 2 }}>
      <ChevronLeft size={16} aria-hidden />
      <span className="aa-table-entity-link-title">{children}</span>
    </Link>
  )
}

export function ProfileHeader({ name, chip, sub, action }: { name: string; chip?: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, paddingBottom: 4 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>{name}</h1>
          {chip}
        </div>
        {sub !== undefined && <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4 }}>{sub}</div>}
      </div>
      {action}
    </div>
  )
}

/** An identifier as a mono chip: "HPI CPN 47REIA". */
export function IdChip({ label, value, shot }: { label: string; value: string; shot?: string }) {
  return (
    <span data-shot={shot} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '3px 10px', borderRadius: radius.pill, background: neutral.sunken, border: `1px solid ${neutral.line}` }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: neutral.mist }}>{label}</span>
      <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>{value}</span>
    </span>
  )
}

export function ProfileCard({ title, shot, action, children }: { title: string; shot?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section data-shot={shot} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, lineHeight: '22px', fontWeight: 600 }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** One labelled value in a card; `mono` for identifiers, `note` a mist line under it. */
export function Fact({ label, value, mono, note }: { label: string; value: ReactNode; mono?: boolean; note?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: neutral.mist }}>{label}</div>
      <div className={mono === true ? 'mono' : undefined} style={{ fontSize: 14, color: neutral.ink, overflowWrap: 'anywhere' }}>{value}</div>
      {note !== undefined && <div style={{ fontSize: 12, color: neutral.mist }}>{note}</div>}
    </div>
  )
}

/** The page's actions: the record's History, then Edit details. */
export function HeaderActions({ onHistory, onEdit }: { onHistory: () => void; onEdit: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
      <Button variant="secondary" onClick={onHistory}>History</Button>
      <Button variant="secondary" onClick={onEdit}>Edit details</Button>
    </div>
  )
}
