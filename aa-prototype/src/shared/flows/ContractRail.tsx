import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import type { Contract, ContractId, RailAnswers, RvgGroupId } from '../../domain/types'
import { OFFICE_TYPES_AMOUNT_MESSAGE } from '../../domain/billing/contractRail'
import { CodePickerSheet } from '../capture/CodePickerSheet'
import {
  contractRailFor,
  type ContractRailView,
  type RailActor,
  type RailContext,
  type RailOption,
} from '../../domain/billing/contractRail'
import { isRvgKind } from '../../domain/billing/contracts'
import { rangeInForce } from '../../domain/billing/priceRanges'
import { railMastersOf, useAppStore } from '../../store'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { NameSearchBox } from '../ui/NameSearchBox'
import { Pill } from '../ui/Pill'
import { Button } from '../ui/Button'
import { TextAction } from '../ui/TextAction'
import { formatCurrency, parseAmount, plural } from '../format'
import { motion } from '../../theme/motion'

/**
 * The step rail (catch-up Phase 20; US-04.3.8, US-04.3.9, US-04.3.2,
 * US-04.3.3): the one Contract picker, for the office on Admin and, mirrored,
 * the anaesthetist on mobile, web and the PWA. It draws `contractRailFor` and
 * knows nothing of the rules: three numbered steps shown from the start ("Where
 * does the invoice go?", then the step that narrows it, then the Contract by
 * typing), an answered step clickable to change it (the later ones clear), a
 * step that filled itself in reads "Only option", and one "Other price" toggle
 * onto the destination's open-price fallback. A bottom sheet on mobile, the
 * surface's Dialog on web and Admin. The interaction follows the contract
 * picker mock's step rail; nothing is shared with it.
 */

export interface ContractRailPick {
  contractId: ContractId
  enteredPrice?: number
  /** "Enter it now" (the office, on an RVG-priced Contract): the RVG code, set after the Contract. */
  rvgGroupId?: RvgGroupId
}

interface ContractRailProps {
  open: boolean
  actor: RailActor
  /** The List the Procedure sits on (`railContextForList`). */
  context: RailContext
  /** Where the rail opens: the answers so far, or those leading to the current Contract. */
  start: RailAnswers | undefined
  /** The Procedure's Contract today, ticked when it is on a row. */
  currentContractId?: ContractId
  /** The amount typed on today's fallback, if any. */
  currentEnteredPrice?: number
  /** Done: set the Contract. Returns the store's refusal, shown verbatim, or null. */
  onDone: (pick: ContractRailPick) => string | null
  /** Closed before a Contract was chosen: keep the answers so far (`setRailAnswers`). */
  onLeave?: (answers: RailAnswers | undefined) => void
  onClose: () => void
}

type Step = 1 | 2 | 3

const CLOSED_VIEW: ContractRailView = { destination: { options: [], autoFilled: false } }

const STEP_TITLE: Record<Step, string> = { 1: 'Invoice to', 2: 'Payment type', 3: 'Contract' }

/** A Contract's price as a row shows it: its fixed price in force, "Prepaid" before it, or how it is priced. */
export function contractPriceText(contract: Contract, dateISO: string): string {
  if (contract.pricing.kind === 'open') return 'Other price'
  if (isRvgKind(contract.pricing.kind)) return contract.pricing.kind === 'rvgAnaesthetistRate' ? 'RVG' : contract.pricing.kind === 'rvgContractRate' ? 'RVG, agreed rate' : 'RVG, discounted'
  const range = rangeInForce(contract, dateISO)
  const price = range === null ? 'Needs a price' : formatCurrency(range.price)
  return contract.prepaid ? `Prepaid · ${price}` : price
}

export function ContractRail({ open, actor, context, start, currentContractId, currentEnteredPrice, onDone, onLeave, onClose }: ContractRailProps) {
  const { Overlay, variant } = useSurface()
  const masters = useAppStore((s) => s.masters)
  const [given, setGiven] = useState<RailAnswers | undefined>(start)
  const [editing, setEditing] = useState<Step | null>(null)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<ContractId | undefined>(currentContractId)
  const [otherPrice, setOtherPrice] = useState(false)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [rvgNow, setRvgNow] = useState<RvgGroupId | undefined>(undefined)
  const [codeOpen, setCodeOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setGiven(start)
    setEditing(null)
    setQuery('')
    setPicked(currentContractId)
    const current = currentContractId !== undefined ? masters.contracts[currentContractId] : undefined
    setOtherPrice(current?.pricing.kind === 'open')
    setAmount(currentEnteredPrice !== undefined ? currentEnteredPrice.toFixed(2) : '')
    setError(null)
    setRvgNow(undefined)
    // Opening resets the rail to the Procedure; the masters do not change mid-pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Only an open rail is worked out (one is mounted per Procedure).
  const view: ContractRailView = useMemo(
    () => (open ? contractRailFor(railMastersOf({ masters }), context, given, { actor, query }) : CLOSED_VIEW),
    [open, masters, context, given, actor, query],
  )

  // The step on show: the one being changed, else the first still open.
  const step: Step = editing ?? (view.destination.answer === undefined ? 1 : view.narrow?.answer === undefined ? 2 : 3)
  const fallback = view.contract?.otherPrice
  const autoPick = view.contract?.autoPick
  const rowIds = new Set(view.contract?.rows.map((r) => r.contract.id) ?? [])
  // What is chosen: the person's pick when still on offer, else what the step filled in.
  const chosenId: ContractId | undefined = otherPrice
    ? fallback?.contract.id
    : picked !== undefined && rowIds.has(picked)
      ? picked
      : autoPick !== undefined && !autoPick.viaOtherPrice
        ? autoPick.contractId
        : undefined
  const usingOther = otherPrice || (chosenId === undefined && autoPick?.viaOtherPrice === true && step === 3)
  const finalId = usingOther ? fallback?.contract.id : chosenId
  const finalContract = finalId !== undefined ? masters.contracts[finalId] : undefined

  const answer = (next: RailAnswers | undefined) => {
    setGiven(next)
    setEditing(null)
    setQuery('')
    setPicked(undefined)
    setOtherPrice(false)
    setError(null)
  }

  const close = () => {
    // Keep only answers the person gave (never one a step filled in for them),
    // and only when they moved on from where the rail opened.
    if (currentContractId === undefined && given !== undefined && JSON.stringify(given) !== JSON.stringify(start)) onLeave?.(given)
    onClose()
  }

  // Other price asks for the amount (US-04.3.9) wherever this person may type it.
  const asksAmount = usingOther && fallback?.mayTypeAmount === true
  const typedAmount = asksAmount ? parseAmount(amount) : undefined
  const amountMissing = asksAmount && typedAmount === undefined

  const done = () => {
    if (finalId === undefined || amountMissing) return
    const pickedRvg = rvgNow !== undefined && finalContract !== undefined && isRvgKind(finalContract.pricing.kind) ? { rvgGroupId: rvgNow } : {}
    const refusal = onDone({ contractId: finalId, ...(typedAmount !== undefined ? { enteredPrice: typedAmount } : {}), ...pickedRvg })
    if (refusal !== null) setError(refusal)
    else onClose()
  }

  const destinationLabel = view.destination.options.find((o) => o.value === view.destination.answer)?.label
  const narrowLabel = view.narrow?.options.find((o) => o.value === view.narrow?.answer)?.label
  const stepAnswer: Record<Step, string | undefined> = {
    1: destinationLabel,
    2: narrowLabel,
    3: finalContract !== undefined ? (usingOther ? `Other price · ${finalContract.name}` : finalContract.name) : undefined,
  }
  // Changing an answered step clears the later ones (US-04.3.8).
  if (editing !== null) {
    for (const later of [2, 3] as Step[]) if (later > editing) stepAnswer[later] = undefined
  }
  const stepAuto: Record<Step, boolean> = {
    1: view.destination.autoFilled,
    2: view.narrow?.autoFilled === true,
    3: autoPick !== undefined && picked === undefined && !otherPrice && query === '',
  }
  const reachable = (s: Step) => s === 1 || (s === 2 && view.destination.answer !== undefined) || (s === 3 && view.narrow?.answer !== undefined)

  const railItems = ([1, 2, 3] as Step[]).map((s) => (
    <div role="listitem" key={s} style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
    <RailStepButton
      n={s}
      title={s === 2 && view.narrow !== undefined ? view.narrow.title : STEP_TITLE[s]}
      answer={stepAnswer[s]}
      auto={stepAuto[s]}
      active={step === s}
      done={stepAnswer[s] !== undefined && s !== step}
      disabled={!reachable(s)}
      compact={variant === 'mobile'}
      onClick={() => {
        if (s === 3) {
          setEditing(null)
          return
        }
        const dest = view.destination.answer as RailAnswers['destination'] | undefined
        setGiven(s === 1 ? undefined : dest !== undefined ? { destination: dest } : undefined)
        setPicked(undefined)
        setOtherPrice(false)
        setQuery('')
        setEditing(s)
      }}
    />
    </div>
  ))

  let body: ReactNode
  if (step === 1) {
    body = (
      <OptionList
        heading="Where does the invoice go?"
        options={view.destination.options}
        current={view.destination.answer}
        onPick={(v) => answer({ destination: v as RailAnswers['destination'] })}
      />
    )
  } else if (step === 2 && view.narrow !== undefined) {
    const dest = view.destination.answer as RailAnswers['destination']
    body = (
      <OptionList
        heading={view.narrow.title}
        options={view.narrow.options}
        current={view.narrow.answer}
        onPick={(v) => answer({ destination: dest, narrow: v })}
      />
    )
  } else {
    const c = view.contract
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <NameSearchBox value={query} onChange={setQuery} label="Type a name or code" placeholder="Type a name or code" autoFocus={variant !== 'mobile'} shot="contract-rail-search" />
        <div role="radiogroup" aria-label="Contracts" style={{ display: 'flex', flexDirection: 'column', maxHeight: variant === 'mobile' ? 300 : 340, overflow: 'auto', margin: '0 -4px', padding: '0 4px' }}>
          {(c?.shown ?? []).map(({ contract, pinned }) => (
            <ContractRow
              key={contract.id}
              contract={contract}
              priceText={contractPriceText(contract, context.listDateISO)}
              pinned={pinned}
              selected={!usingOther && chosenId === contract.id}
              onPick={() => {
                setPicked(contract.id)
                setOtherPrice(false)
                setError(null)
              }}
            />
          ))}
          {query.trim() !== '' && c !== undefined && c.rows.every((r) => r.pinned) && (
            <div style={{ padding: '14px 6px', fontSize: 13.5, color: neutral.mist }}>No Contract matches "{query.trim()}".</div>
          )}
          {query.trim() === '' && c !== undefined && c.rows.length === 0 && (
            <div style={{ padding: '14px 6px', fontSize: 13.5, color: neutral.mist }}>No Contract here fits this List, so its Other price is filled in.</div>
          )}
        </div>
        {c !== undefined && c.rows.length > c.shown.length && (
          <div style={{ fontSize: 12.5, color: neutral.mist }}>Showing {c.shown.length} of {c.rows.length}. Type to narrow.</div>
        )}
        {fallback !== undefined && (
          <OtherPriceToggle
            on={usingOther}
            fallbackName={fallback.contract.name}
            mayType={fallback.mayTypeAmount}
            amount={amount}
            onToggle={() => {
              setOtherPrice(!usingOther)
              setError(null)
            }}
            onAmount={setAmount}
            invalid={asksAmount && amount.trim() !== '' && typedAmount === undefined}
          />
        )}
      </div>
    )
  }

  const outcome = finalContract !== undefined && step === 3 ? outcomeLine(finalContract, actor, usingOther, fallback?.mayTypeAmount === true, context.listDateISO) : null

  return (
    <Overlay open={open} onClose={close} size="wide">
      <div className="aa-rail-scope" data-shot="contract-picker" role="group" aria-labelledby="contract-rail-title" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <OverlayHeader id="contract-rail-title" title="Choose the Contract" />
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>Where the invoice goes, then the Contract. Each step offers only what fits this List.</div>
        </div>
        {variant === 'mobile' ? (
          <>
            <div role="list" aria-label="Steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
              {railItems}
            </div>
            <div>{body}</div>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '216px minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
            <div role="list" aria-label="Steps" style={{ display: 'flex', flexDirection: 'column', gap: 4, borderRight: `1px solid ${neutral.line}`, paddingRight: 14 }}>
              {railItems}
            </div>
            <div>{body}</div>
          </div>
        )}
        {outcome !== null && (
          <div data-shot="contract-rail-outcome" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 13.5, color: neutral.slate, background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '10px 12px' }}>
            <span>
              {outcome}
              {rvgNow !== undefined && masters.rvgGroups[rvgNow] !== undefined && (
                <span className="mono" style={{ marginLeft: 6, color: neutral.ink }}>RVG code {masters.rvgGroups[rvgNow]!.code}</span>
              )}
            </span>
            {actor === 'office' && finalContract !== undefined && isRvgKind(finalContract.pricing.kind) && !usingOther && (
              <TextAction small shot="contract-rail-enter-rvg" onClick={() => setCodeOpen(true)}>
                {rvgNow !== undefined ? 'Change code' : 'Enter it now'}
              </TextAction>
            )}
          </div>
        )}
        <CodePickerSheet
          open={codeOpen}
          {...(rvgNow !== undefined ? { currentId: rvgNow } : {})}
          rvgGroups={masters.rvgGroups}
          onPick={(id) => {
            setRvgNow(id)
            setCodeOpen(false)
          }}
          onClose={() => setCodeOpen(false)}
        />
        {error !== null && (
          <div role="alert" style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13.5 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" onClick={close}>
            {currentContractId === undefined && view.answers !== undefined ? 'Keep answers and close' : 'Cancel'}
          </Button>
          <Button onClick={done} disabled={finalId === undefined || step !== 3 || amountMissing}>
            Use this Contract
          </Button>
        </div>
      </div>
    </Overlay>
  )
}

function outcomeLine(contract: Contract, actor: RailActor, usingOther: boolean, mayType: boolean, dateISO: string): string {
  if (usingOther || contract.pricing.kind === 'open') {
    return mayType ? 'No price of its own: type the amount for this procedure.' : 'The office types this amount.'
  }
  if (contract.prepaid) return `Starts the prepayment: ${contractPriceText(contract, dateISO)}, invoiced before the procedure.`
  if (isRvgKind(contract.pricing.kind)) {
    return actor === 'office' ? 'Priced from RVG units: the anaesthetist fills in the RVG code.' : 'Priced from RVG units: fill in the RVG code on the Booking.'
  }
  return `A fixed price of ${contractPriceText(contract, dateISO)}. No RVG code is needed.`
}

function RailStepButton({
  n,
  title,
  answer,
  auto,
  active,
  done,
  disabled,
  compact,
  onClick,
}: {
  n: Step
  title: string
  answer: string | undefined
  auto: boolean
  active: boolean
  done: boolean
  disabled: boolean
  compact: boolean
  onClick: () => void
}) {
  const filled = done && !active
  return (
    <button
      type="button"
      data-shot={`contract-rail-step-${n}`}
      aria-current={active ? 'step' : undefined}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: compact ? 6 : 10,
        flexDirection: compact ? 'column' : 'row',
        textAlign: 'left',
        border: `1px solid ${active ? accent.base : 'transparent'}`,
        background: active ? accent.tint : 'transparent',
        borderRadius: radius.ctl,
        padding: compact ? '8px 8px' : '10px 10px',
        fontFamily: 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        minWidth: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          flex: 'none',
          width: 22,
          height: 22,
          borderRadius: radius.pill,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          background: filled ? accent.base : neutral.surface,
          color: filled ? neutral.surface : active ? accent.base : neutral.mist,
          border: `1.5px solid ${filled || active ? accent.base : neutral.lineStrong}`,
        }}
      >
        {filled ? <Check size={13} strokeWidth={3} /> : n}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, width: '100%' }}>
        <span style={{ fontSize: compact ? 11.5 : 12.5, color: neutral.slate, lineHeight: 1.25 }}>{title}</span>
        <span
          style={{
            fontSize: compact ? 12.5 : 14,
            fontWeight: 600,
            color: answer !== undefined ? neutral.ink : neutral.mist,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: compact ? 'nowrap' : 'normal',
          }}
        >
          {answer ?? 'Not answered'}
        </span>
        {auto && answer !== undefined && (
          <span>
            <Pill size="sm" shot="contract-rail-only-option">Only option</Pill>
          </span>
        )}
      </span>
    </button>
  )
}

function OptionList({
  heading,
  options,
  current,
  onPick,
}: {
  heading: string
  options: readonly RailOption[]
  current: string | undefined
  onPick: (value: string) => void
}) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: neutral.ink, marginBottom: 8 }}>{heading}</div>
      <div role="radiogroup" aria-label={heading} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {options.map((o) => {
          const live = o.selectable
          const selected = o.value === current
          return (
            <button
              key={o.value}
              type="button"
              data-rail-option={o.value}
              disabled={!live}
              role="radio"
              aria-checked={selected}
              onClick={() => onPick(o.value)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 12,
                textAlign: 'left',
                border: `1px solid ${selected ? accent.base : neutral.line}`,
                background: selected ? accent.tint : neutral.surface,
                borderRadius: radius.ctl,
                padding: '12px 14px',
                fontFamily: 'inherit',
                cursor: live ? 'pointer' : 'default',
                opacity: live ? 1 : 0.55,
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{o.label}</span>
                  {/* The Booking's funder marks one path (catch-up Phase 21, US-04.3.10): never a filter. */}
                  {o.suggested === true && (
                    <Pill size="sm" shot="rail-suggested">
                      Suggested
                    </Pill>
                  )}
                </span>
                {o.hint !== undefined && <span style={{ fontSize: 12.5, color: neutral.slate }}>{o.hint}</span>}
              </span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: neutral.slate }} aria-label={plural(o.count, 'Contract')}>
                {o.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ContractRow({
  contract,
  priceText,
  pinned,
  selected,
  onPick,
}: {
  contract: Contract
  priceText: string
  pinned: boolean
  selected: boolean
  onPick: () => void
}) {
  return (
    <button
      type="button"
      data-contract-id={contract.id}
      role="radio"
      aria-checked={selected}
      onClick={onPick}
      style={{
        display: 'grid',
        gridTemplateColumns: '22px minmax(0, 1fr) auto',
        alignItems: 'center',
        columnGap: 10,
        width: '100%',
        textAlign: 'left',
        border: 'none',
        borderBottom: `1px solid ${neutral.sunken}`,
        borderRadius: radius.ctl,
        background: selected ? accent.tint : 'transparent',
        padding: '11px 8px',
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 18,
          height: 18,
          borderRadius: radius.pill,
          border: `1.5px solid ${selected ? accent.base : neutral.lineStrong}`,
          background: selected ? accent.base : neutral.surface,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: neutral.surface,
        }}
      >
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <span style={{ fontSize: 14.5, fontWeight: 500, color: neutral.ink, lineHeight: 1.3 }}>{contract.name}</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{contract.aaCode}</span>
          {contract.holderReference !== undefined && (
            <span className="mono" style={{ fontSize: 12, color: neutral.mist }}>{contract.holderReference}</span>
          )}
          {pinned && <Pill size="sm" shot="contract-rail-pinned">Always first</Pill>}
        </span>
      </span>
      <span className={priceText.startsWith('$') || priceText.startsWith('Prepaid · $') ? 'mono' : undefined} style={{ fontSize: 13, fontWeight: 600, color: neutral.slate, whiteSpace: 'nowrap' }}>
        {priceText}
      </span>
    </button>
  )
}

function OtherPriceToggle({
  on,
  fallbackName,
  mayType,
  amount,
  onToggle,
  onAmount,
  invalid,
}: {
  on: boolean
  fallbackName: string
  mayType: boolean
  amount: string
  onToggle: () => void
  onAmount: (v: string) => void
  invalid: boolean
}) {
  return (
    <div data-shot="contract-rail-other-price" style={{ border: `1px solid ${on ? accent.base : neutral.line}`, borderRadius: radius.ctl, padding: '10px 12px', background: on ? accent.tint : neutral.surface }}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: 'none', background: 'transparent', padding: 0, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' }}
      >
        <span
          aria-hidden
          style={{ width: 36, height: 20, borderRadius: radius.pill, background: on ? accent.base : neutral.lineStrong, position: 'relative', flex: 'none', transition: `background ${motion.uiFade.duration}ms` }}
        >
          <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: radius.pill, background: neutral.surface, transition: `left ${motion.uiFade.duration}ms` }} />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: on ? accent.base : neutral.ink }}>Other price</span>
          <span style={{ fontSize: 12.5, color: neutral.slate }}>{fallbackName}, for anything no Contract here prices</span>
        </span>
      </button>
      {on && (
        <div style={{ marginTop: 10 }}>
          {mayType ? (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: neutral.slate }}>
              Amount, ex GST
              <input
                data-shot="contract-rail-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => onAmount(e.target.value)}
                placeholder="0.00"
                className="mono"
                aria-invalid={invalid}
                style={{ minHeight: 44, borderRadius: radius.ctl, border: `1px solid ${invalid ? semantic.error.solid : neutral.line}`, background: neutral.surface, padding: '0 12px', fontSize: 15, color: neutral.ink, maxWidth: 200 }}
              />
              <span style={{ color: invalid ? semantic.error.onTint : neutral.mist }}>{invalid ? 'Type the amount in dollars and cents.' : 'Type the price for this procedure.'}</span>
            </label>
          ) : (
            <div style={{ fontSize: 13, color: neutral.slate }}>{OFFICE_TYPES_AMOUNT_MESSAGE}</div>
          )}
        </div>
      )}
    </div>
  )
}
