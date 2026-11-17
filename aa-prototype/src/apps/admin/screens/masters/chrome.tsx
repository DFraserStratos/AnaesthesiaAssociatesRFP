import type { CSSProperties, ReactNode } from 'react'
import { neutral } from '../../../../theme/tokens'
import { TableShell, Th } from '../../../../shared/table'
import { cellStyle, textActionStyle } from './tableStyles'

/** A view's title row: heading, one mist line, and its action on the right. */
export function Header({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>
        {sub !== undefined && <div style={{ fontSize: 12.5, color: neutral.mist, marginTop: 2, maxWidth: 820 }}>{sub}</div>}
      </div>
      {action !== undefined && <div style={{ flex: 'none', whiteSpace: 'nowrap' }}>{action}</div>}
    </div>
  )
}

/**
 * A master view's table: the shared `TableShell` (dense, e1) and `Th` since UI unification U6, with
 * this signature kept until Phase 42 renames `heads` to columns. `label` names the scroller when it
 * overflows ("Master data" until 42 passes each view's title).
 */
export function Table({ heads, children, rightAlign, shot, label = 'Master data' }: { heads: string[]; children: ReactNode; rightAlign?: number[]; shot?: string; label?: string }) {
  return (
    <TableShell density="dense" shot={shot} label={label}>
      <thead>
        <tr>
          {heads.map((h, i) => (
            <Th key={`${h}-${i}`} align={rightAlign?.includes(i) ? 'right' : 'left'}>{h}</Th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </TableShell>
  )
}

export function TextAction({ onClick, children, label, disabled }: { onClick: () => void; children: ReactNode; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      style={disabled === true ? { ...textActionStyle, color: neutral.mist, cursor: 'default' } : textActionStyle}
    >
      {children}
    </button>
  )
}

export function EditCell({ onClick, label, style }: { onClick: () => void; label?: string; style?: CSSProperties }) {
  return (
    <td style={{ ...(style ?? cellStyle), textAlign: 'right' }}>
      <TextAction onClick={onClick} label={label}>Edit</TextAction>
    </td>
  )
}
