/**
 * The parts the Admin List drawers share (catch-up Phase 32c): a labelled
 * section, a label and value row, the small teal-text link button and the
 * footer action button (teal only when primary). Used by the Draft List
 * drawer and the out-of-hours List drawer.
 */

import { accent, neutral, radius } from '../../../theme/tokens'

export function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  )
}

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{ width: 80, flex: 'none', fontSize: 12, color: neutral.mist }}>{label}</span>
      <span style={{ flex: 1, fontSize: 14, color: neutral.ink }}>{children}</span>
    </div>
  )
}

export function DrawerLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ border: `1px solid ${neutral.line}`, background: neutral.surface, color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', borderRadius: radius.sm, padding: '4px 10px' }}>
      {children}
    </button>
  )
}

export function ActionBtn({ onClick, children, primary, disabled, title, shot }: { onClick: () => void; children: React.ReactNode; primary?: boolean; disabled?: boolean; title?: string; shot?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-shot={shot}
      style={{ flex: primary === true ? '1 1 auto' : '0 0 auto', minWidth: 0, minHeight: 40, padding: '0 12px', borderRadius: radius.ctl, border: primary === true ? 'none' : `1px solid ${neutral.line}`, background: primary === true ? (disabled === true ? neutral.lineStrong : accent.base) : neutral.surface, color: primary === true ? neutral.surface : disabled === true ? neutral.mist : neutral.slate, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', cursor: disabled === true ? 'default' : 'pointer' }}
    >
      {children}
    </button>
  )
}
