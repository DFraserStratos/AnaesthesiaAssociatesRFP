import type { CSSProperties, ReactNode } from 'react'
import { neutral, radius } from '../../../../theme/tokens'
import { cellStyle, headCellStyle, textActionStyle } from './tableStyles'

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

export function Table({ heads, children, rightAlign, shot }: { heads: string[]; children: ReactNode; rightAlign?: number[]; shot?: string }) {
  return (
    <div data-shot={shot} style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            {heads.map((h, i) => (
              <th key={`${h}-${i}`} style={{ ...headCellStyle, textAlign: rightAlign?.includes(i) ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function TextAction({ onClick, children, label }: { onClick: () => void; children: ReactNode; label?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} style={textActionStyle}>{children}</button>
  )
}

export function EditCell({ onClick, label, style }: { onClick: () => void; label?: string; style?: CSSProperties }) {
  return (
    <td style={{ ...(style ?? cellStyle), textAlign: 'right' }}>
      <TextAction onClick={onClick} label={label}>Edit</TextAction>
    </td>
  )
}
