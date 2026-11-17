/**
 * The Contract chooser's parts in the component catalogue (UI unification U4,
 * `shared/contracts/railParts.tsx`): the answer options, the step rail, the
 * "No contract" group and the backstop's typed amount. Static options and
 * steps on local state; the backstops are read from the seed, never written.
 */

import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { accent, neutral, radius } from '../../../theme/tokens'
import type { Contract } from '../../../domain/types'
import type { RailOption } from '../../../domain/billing/contractRail'
import { useAppStore } from '../../../store'
import { BackstopAmountField, NoContractGroup, RailOptionGroup, StepRail, type RailStep } from '../../../shared/contracts/railParts'
import { backstopPriceText, railContractLabel } from '../../../shared/contracts/railText'
import { parseAmount } from '../../../shared/format'
import { Echo } from './admin/basicExamples'

const DESTINATIONS: readonly RailOption[] = [
  { value: 'patient', label: 'Patient', hint: 'The patient, or whoever pays for them', count: 4, selectable: true },
  { value: 'hospital', label: 'Forte Health', hint: "This List's hospital, under ACC", count: 2, selectable: true, suggested: true },
  { value: 'special', label: 'Special', hint: 'An insurer, a funder or a surgeon who is billed', count: 0, selectable: false },
]

const PAYMENT_TYPES: readonly RailOption[] = [
  { value: 'standard', label: 'Standard', hint: 'Invoiced after the procedure', count: 3, selectable: true },
  { value: 'prepaid', label: 'Prepaid', hint: 'Invoiced before the procedure', count: 0, selectable: false },
]

export function RailOptionGroupExample() {
  const [destination, setDestination] = useState<string | undefined>(undefined)
  const [payment, setPayment] = useState<string | undefined>('standard')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <RailOptionGroup layout="list" label="Where does the invoice go?" options={DESTINATIONS} value={destination} onPick={setDestination} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Payment type (tiles)</div>
        <RailOptionGroup layout="tiles" label="Payment type" options={PAYMENT_TYPES} value={payment} onPick={setPayment} />
      </div>
      <Echo>Invoice goes to {destination ?? '(not answered)'} · payment type {payment ?? '(not answered)'}</Echo>
    </div>
  )
}

const ANSWERS = ['Patient', 'Standard', 'No contract · RVG'] as const
const STEP_LABELS = ['Where does the invoice go?', 'Payment type', 'Contract'] as const

export function StepRailExample() {
  const [current, setCurrent] = useState(3)
  const steps: RailStep[] = STEP_LABELS.map((label, i) => {
    const n = i + 1
    const done = n < current
    return {
      n,
      label,
      ...(done ? { value: ANSWERS[i] } : {}),
      auto: n === 2,
      done,
      current: n === current,
      ...(done ? { onJump: () => setCurrent(n) } : {}),
    }
  })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '216px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
        <StepRail steps={steps} orientation="vertical" label="Steps (vertical)" />
        <div style={{ fontSize: 13, color: neutral.slate }}>
          Step {current} of 3. Click an answered step to go back to it.
          {current < 3 && (
            <button type="button" onClick={() => setCurrent((c) => c + 1)} style={{ display: 'block', marginTop: 8, border: 'none', background: 'transparent', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Answer this step
            </button>
          )}
        </div>
      </div>
      <div style={{ maxWidth: 390 }}>
        <div style={{ fontSize: 11.5, color: neutral.mist, marginBottom: 6 }}>compact: three across, the phone's sheet</div>
        <StepRail steps={steps} orientation="compact" label="Steps (compact)" />
      </div>
    </div>
  )
}

/** The seed's two backstops, in the rail's order: No contract · RVG, then No contract · Fixed price. */
function useBackstops(): Contract[] {
  const contracts = useAppStore((s) => s.masters.contracts)
  return useMemo(() => {
    const all = Object.values(contracts).sort((a, b) => a.id.localeCompare(b.id))
    const rvg = all.find((c) => c.systemRole === 'noContractRvg')
    const open = all.find((c) => c.systemRole === 'openPriceFallback' && c.prepaid !== true)
    return [rvg, open].filter((c): c is Contract => c !== undefined)
  }, [contracts])
}

export function NoContractGroupExample() {
  const backstops = useBackstops()
  const [chosen, setChosen] = useState<string | undefined>(undefined)
  return (
    <div>
      <div role="radiogroup" aria-label="Contracts" style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '4px 6px' }}>
        <NoContractGroup
          backstops={backstops}
          renderRow={(c) => {
            const on = chosen === c.id
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setChosen(c.id)}
                style={{ display: 'grid', gridTemplateColumns: '22px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: radius.ctl, background: on ? accent.tint : 'transparent', padding: '11px 8px', fontFamily: 'inherit', cursor: 'pointer' }}
              >
                <span aria-hidden style={{ width: 18, height: 18, borderRadius: radius.pill, border: `1.5px solid ${on ? accent.base : neutral.lineStrong}`, background: on ? accent.base : neutral.surface, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: neutral.surface }}>
                  {on && <Check size={12} strokeWidth={3} />}
                </span>
                <span style={{ fontSize: 14.5, fontWeight: 500, color: neutral.ink }}>{railContractLabel(c)}</span>
                <span style={{ fontSize: 12.5, color: neutral.slate }}>{backstopPriceText(c)}</span>
              </button>
            )
          }}
        />
      </div>
      <Echo>{backstops.length === 0 ? 'The seed has no backstops right now (try Demo reset).' : chosen === undefined ? 'Pick a backstop.' : `Picked ${railContractLabel(backstops.find((c) => c.id === chosen)!)}`}</Echo>
    </div>
  )
}

export function BackstopAmountFieldExample() {
  const [amount, setAmount] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const typed = amount.trim() === '' ? undefined : parseAmount(amount)
  const invalid = amount.trim() !== '' && typed === undefined
  return (
    <div style={{ maxWidth: 420 }}>
      <BackstopAmountField
        label={<span style={{ fontSize: 12.5, fontWeight: 600, color: neutral.slate }}>Amount, ex GST</span>}
        ariaLabel="Amount, ex GST"
        value={amount}
        onChange={setAmount}
        onCommit={() => setSaved(invalid || amount.trim() === '' ? null : amount.trim())}
        invalid={invalid}
      />
      <Echo>{saved === null ? 'Type an amount, then leave the field or press Enter.' : `Saved on commit: ${saved}`}</Echo>
    </div>
  )
}
