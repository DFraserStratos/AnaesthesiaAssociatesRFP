import { useEffect, useState, type ReactNode } from 'react'
import { CircleCheck, ListChecks, Send } from 'lucide-react'
import type { Scenario, Selection } from '../data'
import { RvgTypeahead } from '../pickers/shared'
import { accent, neutral, radius } from '../theme/tokens'
import { billingOf, outcomeOf } from './billing'

/**
 * What follows a Contract pick, the same in every option. For an RVG Contract the
 * RVG code field comes first (optional: left blank, the anaesthetist fills it in
 * on the card); then Ben's leaf, who fills in the price and who is invoiced.
 */
export function PricingExtras({ scenario, selection, onSelection, compact }: { scenario: Scenario; selection: Selection | null; onSelection: (s: Selection | null) => void; compact?: boolean }) {
  const b = billingOf(selection)
  const out = outcomeOf(selection, scenario)
  const who = `Dr ${scenario.anaesthetist.name.split(' ').pop()}`
  const by = priceByOf(selection)
  if (!out) return null
  const patientPays = b.mode === 'rvg' && Boolean(b.contract?.isDefault)
  const set = (patch: Partial<Selection>) => onSelection(selection ? { ...selection, ...patch } : null)
  const Icon = out.tone === 'card' ? Send : out.tone === 'filled' ? CircleCheck : ListChecks
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'aa-sheet-rise 180ms ease-out' }}>
      {patientPays && (
        <PriceByToggle
          value={by}
          onChange={(v) => onSelection(switchPriceBy(selection, v))}
        />
      )}

      {patientPays && by === 'amount' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Fixed price</FieldLabel>
          <AmountField value={b.amount} onChange={(amount) => set({ amount })} />
        </div>
      )}

      {b.mode === 'rvg' && !(patientPays && by === 'amount') &&
        (b.rvg ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: `1px solid ${neutral.line}`, background: neutral.surface, borderRadius: radius.ctl, padding: '9px 12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: '20px' }}>
                <span className="mono" style={{ color: accent.base, marginRight: 6 }}>{b.rvg.code}</span>
                {b.rvg.description}
              </div>
              <div style={{ fontSize: 12.5, color: neutral.slate }}>
                Base {b.rvg.baseUnits}
                {b.rvg.maxUnits ? ` to ${b.rvg.maxUnits}` : ''} units · {b.rvg.region}
              </div>
            </div>
            <LinkButton onClick={() => onSelection(selection ? { ...selection, rvgCode: undefined } : null)}>Change</LinkButton>
          </div>
        ) : (
          // The office can pick the code now; left blank, the anaesthetist fills it in on the card.
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>RVG code</FieldLabel>
            <div style={{ display: 'flex' }}>
              <RvgTypeahead compact={compact} onChange={(rvgCode) => onSelection(selection ? { ...selection, rvgCode } : null)} placeholder="Type a code, e.g. LL3" />
            </div>
          </div>
        ))}

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: `1px solid ${neutral.line}`, background: neutral.bg, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 14, lineHeight: '20px', color: neutral.ink }}>
        <Icon size={16} color={out.tone === 'todo' ? accent.base : neutral.slate} style={{ flex: 'none', marginTop: 2 }} />
        <span style={{ flex: 1 }}>{out.text}</span>
      </div>
      {b.mode === 'rvg' && !b.priced && <span style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.slate }}>This step is optional. If left blank, {who} completes it on the card.</span>}
    </div>
  )
}

function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ border: 'none', background: 'transparent', color: accent.base, fontWeight: 600, fontSize: 13.5, cursor: 'pointer', padding: 0 }}>
      {children}
    </button>
  )
}

/** A field's label above it: the same size and weight as the Contract label beside it. */
export function FieldLabel({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 12.5, lineHeight: '18px', fontWeight: 600, color: neutral.slate }}>{children}</span>
}

export type PriceBy = 'rvg' | 'amount'

/**
 * When the patient pays (No contract (RVG)), the price is the RVG or another
 * amount (Ben's tree). The choice lives on the booking, so the office and the
 * phone always agree; switching clears the other way's value.
 */
export function priceByOf(selection: Selection | null): PriceBy {
  return selection?.priceBy ?? (selection?.amount !== undefined ? 'amount' : 'rvg')
}

export function switchPriceBy(selection: Selection | null, by: PriceBy): Selection | null {
  return selection ? { ...selection, priceBy: by, ...(by === 'rvg' ? { amount: undefined } : { rvgCode: undefined }) } : null
}

/**
 * The two-way switch between the RVG code and a fixed price, full width, as the
 * prototype's SlidingSegmentedControl draws it (the ASA and age-extreme pickers):
 * a sunken track with a teal thumb that slides to the chosen cell.
 */
export function PriceByToggle({ value, onChange, large }: { value: PriceBy; onChange: (v: PriceBy) => void; large?: boolean }) {
  const second = value === 'amount'
  return (
    <div role="group" aria-label="Price by" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, borderRadius: 12, background: neutral.sunken, width: '100%' }}>
      <span
        aria-hidden
        style={{ position: 'absolute', top: 4, bottom: 4, left: 4, width: 'calc(50% - 6px)', borderRadius: 9, background: accent.base, boxShadow: '0 1px 3px rgba(23,35,32,0.2)', transform: second ? 'translateX(calc(100% + 4px))' : 'translateX(0)', transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)', pointerEvents: 'none' }}
      />
      {(['rvg', 'amount'] as const).map((v) => {
        const on = v === value
        return (
          <button key={v} type="button" aria-pressed={on} onClick={() => onChange(v)} style={{ position: 'relative', zIndex: 1, minHeight: large ? 44 : 40, padding: '0 12px', border: 'none', borderRadius: 9, background: 'transparent', color: on ? neutral.surface : neutral.slate, fontSize: large ? 16 : 14, fontWeight: 600, cursor: 'pointer', transition: 'color 150ms ease-out' }}>
            {v === 'rvg' ? 'RVG code' : 'Fixed price'}
          </button>
        )
      })}
    </div>
  )
}

/** A dollar amount the anaesthetist (or the office) types in. Empty or zero leaves it unset. */
export function AmountField({ value, onChange, large, autoFocus }: { value?: number; onChange: (amount: number | undefined) => void; large?: boolean; autoFocus?: boolean }) {
  const [text, setText] = useState(value !== undefined ? String(value) : '')
  useEffect(() => {
    // Follow a change made in the other view, without fighting the one being typed here.
    setText((t) => (Number(t) === value || (value === undefined && t === '') ? t : value !== undefined ? String(value) : ''))
  }, [value])
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${neutral.lineStrong}`, borderRadius: radius.ctl, padding: large ? '0 14px' : '0 12px', background: neutral.surface, maxWidth: large ? undefined : 220 }}>
      <span className="mono" style={{ fontSize: large ? 17 : 15, color: neutral.slate }}>$</span>
      <input
        autoFocus={autoFocus}
        inputMode="decimal"
        aria-label="Fixed price"
        placeholder="0.00"
        value={text}
        onChange={(e) => {
          const t = e.target.value.replace(/[^0-9.]/g, '')
          setText(t)
          const n = Number.parseFloat(t)
          onChange(Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined)
        }}
        className="mono"
        style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent', flex: 1, minWidth: 0, padding: large ? '12px 0' : '9px 0', fontSize: large ? 18 : 15, fontWeight: 600, color: neutral.ink }}
      />
    </label>
  )
}
