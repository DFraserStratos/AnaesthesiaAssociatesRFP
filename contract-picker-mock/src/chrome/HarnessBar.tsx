import type { CSSProperties } from 'react'
import type { Approach } from '../App'
import { SCENARIOS } from '../data'
import { neutral, radius } from '../theme/tokens'
import { LAPTOP, useWindowWidth } from './useViewport'

/** The harness pill, as aa-prototype's harness bar draws its menus. */
const trigger: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  height: 34,
  padding: '0 10px',
  borderRadius: radius.ctl,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.08)',
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

/** Height of the harness, so lists that open upward stay clear of it. */
export const HARNESS_HEIGHT = 50

/** The options, in two families: billable party first (Ben's decision tree, 30 Oct) and price first (the earlier work). */
export const GROUPS: { title: string; options: { id: Approach; mark: string; label: string }[] }[] = [
  {
    title: 'Billable party first',
    options: [
      { id: 'bp-rail', mark: 'A', label: 'Step rail' },
      { id: 'bp-tree', mark: 'B', label: 'Billing tree' },
    ],
  },
  {
    title: 'Price first',
    options: [
      { id: 'procedure', mark: '1', label: 'Procedure first' },
      { id: 'contract', mark: '2', label: 'Contract, then lines' },
      { id: 'holder', mark: '3', label: 'Organisation first' },
      { id: 'single', mark: '4', label: 'Single contracts' },
    ],
  },
]

interface Props {
  approach: Approach
  onApproach: (a: Approach) => void
  scenarioId: string
  onScenario: (id: string) => void
  rows: number | null
  steps: number
}

/**
 * The demo harness: everything here is workshop control, not product. It sits
 * where aa-prototype's harness bar sits, in the same ink, so nobody mistakes it
 * for part of the Admin screen below.
 */
export function HarnessBar({ approach, onApproach, scenarioId, onScenario, rows, steps }: Props) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)
  // On a laptop the pill goes, the booking menu narrows and the counter waits for room.
  const width = useWindowWidth()
  const laptop = width < LAPTOP
  return (
    <header data-keep-open style={{ flex: 'none', height: HARNESS_HEIGHT, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', background: neutral.ink, color: '#FFFFFF', borderBottom: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto' }}>
      <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>AA Booking &amp; Billing</span>
      {!laptop && <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', borderRadius: 999, padding: '2px 8px', flex: 'none' }}>Contract workshop</span>}

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none', marginLeft: laptop ? 2 : 8 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>Booking</span>
      <select title={scenario?.note} value={scenarioId} onChange={(e) => onScenario(e.target.value)} style={{ ...trigger, maxWidth: laptop ? 230 : 300 }}>
        {SCENARIOS.map((s) => (
          <option key={s.id} value={s.id} style={{ color: neutral.ink }}>
            {s.title}
            {s.prefill ? ' (pre-filled)' : ''}
          </option>
        ))}
      </select>
      </label>

      {/* The two option families, one dropdown each; the one holding the current option is lit. */}
      {GROUPS.map((g) => {
        const current = g.options.find((o) => o.id === approach)
        return (
          <label key={g.title} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none', marginLeft: laptop ? 2 : 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>{g.title}</span>
            <select
              value={current?.id ?? ''}
              onChange={(e) => onApproach(e.target.value as Approach)}
              style={{ ...trigger, ...(current ? { background: '#FFFFFF', color: neutral.ink, border: '1px solid #FFFFFF' } : { color: 'rgba(255,255,255,0.78)' }) }}
            >
              {!current && (
                <option value="" disabled style={{ color: neutral.ink }}>
                  Choose an option
                </option>
              )}
              {g.options.map((o) => (
                <option key={o.id} value={o.id} style={{ color: neutral.ink }}>
                  {o.mark}. {o.label}
                </option>
              ))}
            </select>
          </label>
        )
      })}

      {width >= 1360 && <span className="mono" style={{ marginLeft: 'auto', paddingLeft: 12, fontSize: 12.5, color: 'rgba(255,255,255,0.72)', whiteSpace: 'nowrap' }} aria-live="polite">
        {rows === null ? 'No list open' : `${rows} rows`} · {steps} {steps === 1 ? 'step' : 'steps'}
      </span>}
    </header>
  )
}
