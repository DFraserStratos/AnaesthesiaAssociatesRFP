import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, ChevronRight, RotateCcw, Search } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import type { Contract, ContractId, Procedure, RailAnswers } from '../../domain/types'
import {
  OFFICE_TYPES_AMOUNT_MESSAGE,
  contractRailFor,
  railAnswersText,
  type RailOption,
} from '../../domain/billing/contractRail'
import { isRvgKind } from '../../domain/billing/contracts'
import {
  railActorOf,
  railContextForList,
  railMastersOf,
  railStartFor,
  setProcedureContract,
  setRailAnswers,
  useAppStore,
  type Actor,
} from '../../store'
import { useSurface } from '../surface'
import { CaptureSection } from '../capture/ui'
import { Pill } from '../ui/Pill'
import { Button } from '../ui/Button'
import { ContractRail, contractPriceText } from '../flows/ContractRail'

/**
 * The Booking's Billing card (catch-up Phase 20; US-04.3.8, US-04.3.9,
 * US-04.3.2, US-04.3.3, US-03.4.1): the step rail, inline on the Booking, one
 * card per Procedure. The look follows the contract picker mock's "A. Step
 * rail": the steps as a compact numbered rail down the left (Invoice to, the
 * step that narrows it, the Contract), each answer shown under its label and
 * clickable to change it; the rest of the card is the current question, its
 * answers as tiles with their counts; the last step a "Choose the Contract"
 * field that drops down the Contracts on offer, searchable; "Start again".
 * Answers save as they are given (the answers so far, until a Contract is
 * chosen), so whoever opens the Booking next carries on from there.
 *
 * On the phone the card shows two rows (Invoice to, Contract) that open the
 * same steps in a bottom sheet (`ContractRail`).
 *
 * Every rule is `contractRailFor`'s; the store applies the guards.
 */

type Step = 1 | 2 | 3

interface BillingCardProps {
  procedure: Procedure
  actor: Actor
  /** The actor may edit this Booking (38a's window). */
  canEdit: boolean
  /** "Procedure n" when the Booking has more than one. */
  ordinal?: number
  procedureCount?: number
}

export const NEEDS_INVOICE_DESTINATION = 'Needs an invoice destination'
export const CONTRACT_CHANGE_CAPTION = 'The office sees any change to the Contract at review.'

export function BillingCard(props: BillingCardProps) {
  const { variant } = useSurface()
  return variant === 'mobile' ? <MobileBillingCard {...props} /> : <InlineBillingCard {...props} />
}

function useBilling(procedure: Procedure) {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const booking = schedule.bookings[procedure.bookingId]
  const list = booking !== undefined ? schedule.lists[booking.listId] : undefined
  const context = useMemo(() => (list !== undefined ? railContextForList({ masters }, list) : undefined), [masters, list])
  const contract = procedure.governingContractId !== undefined ? masters.contracts[procedure.governingContractId] : undefined
  const start = railStartFor({ masters, schedule }, procedure.id)
  return { masters, schedule, context, contract, start, list }
}

/** The card's title. */
function cardLabel(ordinal?: number, count?: number): string {
  return count !== undefined && count > 1 && ordinal !== undefined ? `Billing · procedure ${ordinal}` : 'Billing'
}

// ---------------------------------------------------------------------------
// Web and Admin: the inline card
// ---------------------------------------------------------------------------

function InlineBillingCard({ procedure, actor, canEdit, ordinal, procedureCount }: BillingCardProps) {
  const { masters, context, contract, start } = useBilling(procedure)
  const railActor = railActorOf(actor)
  const officeOnly = railActor === 'anaesthetist' && contract?.prepaid === true
  const editable = canEdit && !officeOnly && context !== undefined

  const [given, setGiven] = useState<RailAnswers | undefined>(start)
  const [editing, setEditing] = useState<Step | null>(null)
  const [otherOn, setOtherOn] = useState(contract?.pricing.kind === 'open')
  const [amount, setAmount] = useState(procedure.enteredPrice !== undefined ? procedure.enteredPrice.toFixed(2) : '')
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  // Follow the Procedure when its Contract or answers change elsewhere.
  const startKey = JSON.stringify([procedure.governingContractId, procedure.railAnswers, procedure.enteredPrice])
  useEffect(() => {
    setGiven(start)
    setEditing(null)
    setOtherOn(contract?.pricing.kind === 'open')
    setAmount(procedure.enteredPrice !== undefined ? procedure.enteredPrice.toFixed(2) : '')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startKey])

  const view = useMemo(
    () => (context !== undefined ? contractRailFor(railMastersOf({ masters }), context, given, { actor: railActor }) : undefined),
    [masters, context, given, railActor],
  )
  if (view === undefined || context === undefined) return null

  const step: Step = editing ?? (view.destination.answer === undefined ? 1 : view.narrow?.answer === undefined ? 2 : 3)
  const fallback = view.contract?.otherPrice
  const onThisPath = contract !== undefined && view.contract?.rows.some((r) => r.contract.id === contract.id)
  const onThisFallback = contract !== undefined && fallback?.contract.id === contract.id

  /** Answers so far are kept on a Procedure with no Contract (US-04.3.8). */
  const keep = (next: RailAnswers | undefined) => {
    setGiven(next)
    setEditing(null)
    setError(null)
    setNote(null)
    setOtherOn(false)
    if (procedure.governingContractId === undefined) {
      const res = setRailAnswers(useAppStore, actor, procedure.id, next)
      if (!res.ok) setError(res.message)
    }
  }

  const choose = (contractId: ContractId, enteredPrice?: number) => {
    const changing = procedure.governingContractId !== undefined && procedure.governingContractId !== contractId
    const res = setProcedureContract(useAppStore, actor, procedure.id, contractId, enteredPrice !== undefined ? { enteredPrice } : {})
    if (!res.ok) {
      setError(res.message)
      return
    }
    setError(null)
    setNote(changing ? 'Any typed price was cleared for the new Contract.' : null)
  }

  const destLabel = view.destination.options.find((o) => o.value === view.destination.answer)?.label
  const narrowLabel = view.narrow?.options.find((o) => o.value === view.narrow?.answer)?.label
  const contractValue = contract !== undefined && editing === null ? `${contract.name} · ${contractPriceText(contract, context.listDateISO)}` : undefined
  const slots: { n: Step; label: string; value?: string; auto: boolean }[] = [
    { n: 1, label: 'Invoice to', ...(destLabel !== undefined ? { value: destLabel } : {}), auto: view.destination.autoFilled },
    { n: 2, label: view.narrow?.title ?? 'Narrow it down', ...(narrowLabel !== undefined && (editing === null || editing > 1) ? { value: narrowLabel } : {}), auto: view.narrow?.autoFilled === true },
    { n: 3, label: 'Contract', ...(contractValue !== undefined && (onThisPath || onThisFallback) ? { value: contractValue } : {}), auto: false },
  ]

  const reachable = (n: Step) => n === 1 || (n === 2 && view.destination.answer !== undefined) || (n === 3 && view.narrow?.answer !== undefined)
  const jump = (n: Step) => {
    if (!editable) return
    setError(null)
    setNote(null)
    if (n === 3) return setEditing(null)
    const dest = view.destination.answer as RailAnswers['destination'] | undefined
    setGiven(n === 1 ? undefined : dest !== undefined ? { destination: dest } : undefined)
    setEditing(n)
  }
  const restart = () => {
    setOtherOn(false)
    keep(undefined)
    setEditing(1)
  }

  let body: ReactNode
  if (!editable) {
    body = (
      <ReadOnlySummary
        contract={contract}
        answersText={railAnswersText(masters, context, procedure.railAnswers)}
        dateISO={context.listDateISO}
        officeOnly={officeOnly}
      />
    )
  } else if (step === 1) {
    body = (
      <StepFrame question="Where does the invoice go?" aside={<StartAgain onClick={restart} hidden={given === undefined} />}>
        <ChoiceTiles options={view.destination.options} value={view.destination.answer} onPick={(v) => keep({ destination: v as RailAnswers['destination'] })} />
      </StepFrame>
    )
  } else if (step === 2 && view.narrow !== undefined) {
    const dest = view.destination.answer as RailAnswers['destination']
    const q = dest === 'patient' ? 'Standard or prepaid?' : dest === 'hospital' ? `Under which of ${destLabel ?? 'the hospital'}'s funding tags?` : 'Which holder?'
    body = (
      <StepFrame question={q} aside={<StartAgain onClick={restart} hidden={false} />}>
        <ChoiceTiles options={view.narrow.options} value={view.narrow.answer} onPick={(v) => keep({ destination: dest, narrow: v })} />
      </StepFrame>
    )
  } else {
    const c = view.contract
    const pinned = c?.rows.find((r) => r.pinned)
    const auto = c?.autoPick
    const current = contract !== undefined && (onThisPath || onThisFallback) ? contract : undefined
    const suggested = current === undefined && auto !== undefined && !auto.viaOtherPrice ? masters.contracts[auto.contractId] : undefined
    const typed = parseAmount(amount)
    body = (
      <StepFrame question={current !== undefined ? 'Contract and price' : c !== undefined && c.rows.length === 0 ? 'No Contract here fits this List' : 'Which Contract?'} aside={<StartAgain onClick={restart} hidden={false} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!otherOn && (
            <ContractCombo
              rows={c?.rows ?? []}
              {...(current !== undefined && !onThisFallback ? { value: current } : {})}
              dateISO={context.listDateISO}
              onPick={(id) => choose(id)}
              pinnedId={pinned?.contract.id}
            />
          )}
          {suggested !== undefined && !otherOn && (
            <div data-shot="contract-rail-only-contract" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: accent.tint, borderRadius: radius.ctl, padding: '8px 8px 8px 14px' }}>
              <span style={{ fontSize: 13.5, color: neutral.ink }}>
                <strong>{suggested.name}</strong> is the only option here.
              </span>
              <Button variant="primary" onClick={() => choose(suggested.id)}>Use it</Button>
            </div>
          )}
          {fallback !== undefined && (
            <div data-shot="contract-rail-other-price" style={{ border: `1px solid ${otherOn ? accent.base : neutral.line}`, borderRadius: radius.ctl, padding: '10px 12px', background: otherOn ? accent.tint : neutral.surface }}>
              <button
                type="button"
                role="switch"
                aria-checked={otherOn}
                className="aa-rail-focus"
                onClick={() => setOtherOn(!otherOn)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: 'none', background: 'transparent', padding: 0, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' }}
              >
                <span aria-hidden style={{ width: 36, height: 20, borderRadius: 999, background: otherOn ? accent.base : neutral.lineStrong, position: 'relative', flex: 'none', transition: 'background 150ms' }}>
                  <span style={{ position: 'absolute', top: 2, left: otherOn ? 18 : 2, width: 16, height: 16, borderRadius: 999, background: neutral.surface, transition: 'left 150ms' }} />
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: otherOn ? accent.base : neutral.ink }}>Other price</span>
                  <span style={{ fontSize: 12.5, color: neutral.slate }}>{fallback.contract.name}, for anything no Contract here prices</span>
                </span>
              </button>
              {otherOn && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  {fallback.mayTypeAmount ? (
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: neutral.slate }}>
                      Amount, ex GST
                      <input
                        data-shot="contract-rail-amount"
                        inputMode="decimal"
                        className="mono aa-rail-focus"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        style={{ minHeight: 40, borderRadius: radius.ctl, border: `1px solid ${amount.trim() !== '' && typed === undefined ? semantic.error.solid : neutral.line}`, background: neutral.surface, padding: '0 12px', fontSize: 15, color: neutral.ink, width: 160 }}
                      />
                    </label>
                  ) : (
                    <span style={{ fontSize: 13, color: neutral.slate }}>{OFFICE_TYPES_AMOUNT_MESSAGE}</span>
                  )}
                  <Button
                    variant="primary"
                    disabled={fallback.mayTypeAmount && typed === undefined}
                    onClick={() => choose(fallback.contract.id, fallback.mayTypeAmount ? typed : undefined)}
                  >
                    {onThisFallback ? 'Save amount' : 'Use Other price'}
                  </Button>
                </div>
              )}
            </div>
          )}
          {current !== undefined && <Outcome contract={current} actor={railActor} dateISO={context.listDateISO} amount={procedure.enteredPrice} />}
        </div>
      </StepFrame>
    )
  }

  return (
    <CaptureSection label={cardLabel(ordinal, procedureCount)} shot="billing">
      <div className="aa-rail-scope" data-shot="contract-picker" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {contract === undefined && (
          <div data-shot="needs-invoice-destination" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: semantic.warning.onTint, background: semantic.warning.tint, borderRadius: radius.ctl, padding: '8px 12px' }}>
            {NEEDS_INVOICE_DESTINATION}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'clamp(168px, 28%, 236px) minmax(0, 1fr)' }}>
          <nav aria-label="Billing steps" style={{ borderRight: `1px solid ${neutral.line}`, paddingRight: 12 }}>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {slots.map((s, i) => {
                // A Contract set on this path finishes the rail: every step ticked, as the mock's finished path.
                const complete = s.n === 3 && s.value !== undefined && editing === null
                const done = s.value !== undefined && (s.n !== step || complete)
                const current = editable && s.n === step && !complete
                return (
                  <li key={s.n}>
                    <RailSlot
                      n={s.n}
                      label={s.label}
                      value={s.value}
                      auto={s.auto && s.value !== undefined}
                      done={done}
                      current={current}
                      last={i === slots.length - 1}
                      onJump={editable && reachable(s.n) && s.n !== step ? () => jump(s.n) : undefined}
                    />
                  </li>
                )
              })}
            </ol>
          </nav>
          <div style={{ paddingLeft: 18, minWidth: 0 }}>{body}</div>
        </div>
        {error !== null && (
          <div role="alert" style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '8px 12px', fontSize: 13.5 }}>{error}</div>
        )}
        {note !== null && <span data-shot="contract-price-cleared" style={{ fontSize: 12.5, color: neutral.slate }}>{note}</span>}
        {railActor === 'anaesthetist' && editable && <span style={{ fontSize: 12, color: neutral.mist }}>{CONTRACT_CHANGE_CAPTION}</span>}
      </div>
    </CaptureSection>
  )
}

function parseAmount(text: string): number | undefined {
  const t = text.replace(/[$,\s]/g, '')
  if (t === '' || !/^\d+(\.\d{1,2})?$/.test(t)) return undefined
  return Math.round(Number(t) * 100) / 100
}

function StepFrame({ question, aside, children }: { question: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h4 style={{ flex: 1, margin: 0, fontSize: 17, lineHeight: '24px', fontWeight: 600, color: neutral.ink }}>{question}</h4>
        {aside}
      </div>
      {children}
    </div>
  )
}

function StartAgain({ onClick, hidden }: { onClick: () => void; hidden: boolean }) {
  return (
    <button
      type="button"
      data-shot="contract-rail-start-again"
      onClick={onClick}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden}
      className="aa-rail-focus"
      style={{ visibility: hidden ? 'hidden' : 'visible', display: 'inline-flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', color: neutral.slate, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, whiteSpace: 'nowrap', fontFamily: 'inherit' }}
    >
      <RotateCcw size={13} aria-hidden /> Start again
    </button>
  )
}

/** One step of the rail: its marker (with the line on to the next), its label and its answer. */
function RailSlot({ n, label, value, auto, done, current, last, onJump }: { n: Step; label: string; value?: string; auto: boolean; done: boolean; current: boolean; last: boolean; onJump?: () => void }) {
  return (
    <button
      type="button"
      data-shot={`contract-rail-step-${n}`}
      disabled={onJump === undefined}
      onClick={onJump}
      title={onJump !== undefined ? 'Change this answer' : undefined}
      aria-current={current ? 'step' : undefined}
      className="aa-rail-focus"
      style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', border: 'none', background: current ? accent.tint : 'transparent', borderRadius: radius.ctl, padding: '8px 10px', cursor: onJump !== undefined ? 'pointer' : 'default', position: 'relative', fontFamily: 'inherit' }}
    >
      <span style={{ position: 'relative', flex: 'none', width: 24, display: 'flex', justifyContent: 'center' }}>
        <span
          className="mono"
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 600,
            background: done ? accent.base : neutral.surface,
            color: done ? neutral.surface : current ? accent.base : neutral.mist,
            border: done ? 'none' : `1.5px solid ${current ? accent.base : neutral.lineStrong}`,
            zIndex: 1,
          }}
        >
          {done ? <Check size={13} strokeWidth={3} aria-hidden /> : n}
        </span>
        {!last && <span aria-hidden style={{ position: 'absolute', top: 26, bottom: -22, width: 1.5, background: done ? accent.base : neutral.line }} />}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: done ? 12 : 14, lineHeight: done ? '16px' : '24px', fontWeight: 600, color: current ? accent.base : done ? neutral.slate : neutral.mist }}>{label}</span>
        {done && value !== undefined && (
          <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: neutral.ink, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{value}</span>
        )}
        {auto && <span data-shot="contract-rail-only-option" style={{ fontSize: 12, color: neutral.slate }}>Only option</span>}
      </span>
    </button>
  )
}

/** The step's answers as tiles, each with its count; one with none is greyed (its fallback still fills in). */
function ChoiceTiles({ options, value, onPick }: { options: readonly RailOption[]; value?: string; onPick: (v: string) => void }) {
  return (
    <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
      {options.map((o) => {
        const on = o.value === value
        const empty = o.count === 0
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            data-rail-option={o.value}
            disabled={!o.selectable}
            onClick={() => onPick(o.value)}
            className="aa-rail-focus"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
              textAlign: 'left',
              padding: '12px 14px',
              borderRadius: radius.ctl,
              border: `1px solid ${on ? accent.base : neutral.lineStrong}`,
              boxShadow: on ? `inset 0 0 0 1px ${accent.base}` : 'none',
              background: on ? accent.tint : empty ? neutral.bg : neutral.surface,
              cursor: o.selectable ? 'pointer' : 'default',
              opacity: o.selectable ? 1 : 0.55,
              minWidth: 0,
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: on ? accent.base : neutral.ink }}>{o.label}</span>
            {o.hint !== undefined && <span style={{ fontSize: 12.5, lineHeight: '17px', color: neutral.slate }}>{o.hint}</span>}
            <span style={{ marginTop: 'auto', paddingTop: 6, fontSize: 12, color: empty ? neutral.mist : neutral.slate }}>
              {empty ? 'None for this List' : `${o.count} ${o.count === 1 ? 'Contract' : 'Contracts'}`}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** "Choose the Contract": a field that drops down the step's Contracts, searchable, grouped by holder. */
function ContractCombo({
  rows,
  value,
  dateISO,
  onPick,
  pinnedId,
}: {
  rows: readonly { contract: Contract; pinned: boolean }[]
  value?: Contract
  dateISO: string
  onPick: (id: ContractId) => void
  pinnedId?: ContractId
}) {
  const parties = useAppStore((s) => s.masters.parties)
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e: MouseEvent) => {
      if (rootRef.current !== null && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // The rail's own rows for this step (No contract · RVG pinned first, never searched away); the search
  // narrows them with 18's matcher fields, shown here.
  const groups = useMemo(() => {
    const needle = q.replace(/\s+/g, '').toLowerCase()
    const hit = (c: Contract) => {
      if (needle === '') return true
      const code = c.defaultRvgGroupId !== null ? (rvgGroups[c.defaultRvgGroupId]?.code ?? '') : ''
      return [c.name, c.aaCode, c.holderReference ?? '', c.invoiceDescription ?? ''].some((f) => f.replace(/\s+/g, '').toLowerCase().includes(needle)) || code.toLowerCase() === needle
    }
    const out = new Map<string, { title: string; rows: { contract: Contract; pinned: boolean }[] }>()
    for (const r of rows) {
      if (!r.pinned && !hit(r.contract)) continue
      const title = r.pinned ? 'Always first' : (parties[r.contract.holderId]?.name ?? r.contract.holderId)
      const g = out.get(title) ?? { title, rows: [] }
      g.rows.push(r)
      out.set(title, g)
    }
    return [...out.values()]
  }, [rows, q, parties, rvgGroups])
  const matched = groups.reduce((n, g) => n + g.rows.filter((r) => !r.pinned).length, 0)

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        data-shot="contract-combo"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="aa-rail-focus"
        onClick={() => {
          setOpen(!open)
          setQ('')
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 44, boxSizing: 'border-box', borderRadius: radius.ctl, border: `1px solid ${open ? accent.base : neutral.lineStrong}`, background: neutral.surface, padding: '8px 12px', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
      >
        {value !== undefined ? (
          <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: neutral.ink }}>{value.name}</span>
            <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{value.aaCode}</span>
          </span>
        ) : (
          <span style={{ flex: 1, fontSize: 14.5, color: neutral.mist }}>Choose the Contract</span>
        )}
        <ChevronDown size={18} color={neutral.slate} aria-hidden />
      </button>
      {open && (
        <div
          data-shot="contract-combo-list"
          style={{ position: 'absolute', zIndex: 30, top: 'calc(100% + 6px)', left: 0, right: 0, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, boxShadow: '0 8px 16px rgba(23,35,32,0.10), 0 24px 56px rgba(23,35,32,0.18)', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${neutral.line}` }}>
            <Search size={16} color={neutral.mist} aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type a name or code"
              aria-label="Type a name or code"
              className="aa-rail-focus"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14.5, fontFamily: 'inherit', color: neutral.ink, background: 'transparent' }}
            />
          </div>
          <div role="listbox" aria-label="Contracts" style={{ maxHeight: 340, overflow: 'auto', padding: '4px 0' }}>
            {groups.map((g) => (
              <div key={g.title}>
                <div style={{ padding: '8px 14px 4px', fontSize: 11.5, fontWeight: 700, color: neutral.mist }}>{g.title}</div>
                {g.rows.slice(0, 50).map(({ contract, pinned }) => {
                  const selected = value?.id === contract.id
                  return (
                    <button
                      key={contract.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      data-contract-id={contract.id}
                      className="aa-rail-focus"
                      onClick={() => {
                        setOpen(false)
                        onPick(contract.id)
                      }}
                      style={{ display: 'grid', gridTemplateColumns: '18px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 10, width: '100%', textAlign: 'left', border: 'none', background: selected ? accent.tint : 'transparent', padding: '9px 14px', fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      <span aria-hidden style={{ color: accent.base, display: 'flex' }}>{selected && <Check size={15} strokeWidth={3} />}</span>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: neutral.ink }}>{contract.name}</span>
                        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span className="mono" style={{ fontSize: 11.5, color: neutral.slate }}>{contract.aaCode}</span>
                          {contract.holderReference !== undefined && <span className="mono" style={{ fontSize: 11.5, color: neutral.mist }}>{contract.holderReference}</span>}
                          {pinned && pinnedId === contract.id && <Pill size="small" shot="contract-rail-pinned">Always first</Pill>}
                        </span>
                      </span>
                      <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: neutral.slate, whiteSpace: 'nowrap' }}>{contractPriceText(contract, dateISO)}</span>
                    </button>
                  )
                })}
              </div>
            ))}
            {q.trim() !== '' && matched === 0 && <div style={{ padding: '10px 14px', fontSize: 13.5, color: neutral.mist }}>No Contract matches "{q.trim()}".</div>}
            {rows.length === 0 && <div style={{ padding: '10px 14px', fontSize: 13.5, color: neutral.mist }}>Nothing here for this List. Use Other price.</div>}
          </div>
        </div>
      )}
    </div>
  )
}

/** What follows the Contract, by its pricing kind (US-04.3.8). */
function Outcome({ contract, actor, dateISO, amount }: { contract: Contract; actor: 'office' | 'anaesthetist'; dateISO: string; amount?: number }) {
  let text: string
  if (contract.pricing.kind === 'open') text = amount !== undefined ? `Typed price $${amount.toFixed(2)}.` : 'No price yet: type the amount above.'
  else if (contract.prepaid) text = `Prepaid: ${contractPriceText(contract, dateISO)}, invoiced before the procedure.`
  else if (isRvgKind(contract.pricing.kind)) text = actor === 'office' ? 'Priced from RVG units: the anaesthetist fills in the RVG code below.' : 'Priced from RVG units: fill in the RVG code below.'
  else text = `A fixed price of ${contractPriceText(contract, dateISO)}. No RVG code is needed.`
  return (
    <div data-shot="contract-rail-outcome" style={{ fontSize: 13.5, color: neutral.slate, background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '10px 12px' }}>
      {text}
    </div>
  )
}

function ReadOnlySummary({ contract, answersText, dateISO, officeOnly }: { contract?: Contract; answersText: string; dateISO: string; officeOnly: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {contract !== undefined ? (
        <>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{contract.name}</span>
            <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{contract.aaCode}</span>
          </span>
          <span style={{ fontSize: 13, color: neutral.slate }}>{contractPriceText(contract, dateISO)}</span>
        </>
      ) : (
        <span style={{ fontSize: 13.5, color: neutral.slate }}>So far: {answersText}</span>
      )}
      {officeOnly && <span data-shot="contract-set-by-office" style={{ fontSize: 12.5, color: neutral.slate }}>Set by the office</span>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Phone: the card's rows open the steps in a bottom sheet
// ---------------------------------------------------------------------------

function MobileBillingCard({ procedure, actor, canEdit, ordinal, procedureCount }: BillingCardProps) {
  const { masters, context, contract, start } = useBilling(procedure)
  const [open, setOpen] = useState(false)
  if (context === undefined) return null
  const railActor = railActorOf(actor)
  const officeOnly = railActor === 'anaesthetist' && contract?.prepaid === true
  const editable = canEdit && !officeOnly
  const answers = contract !== undefined ? railAnswersText(masters, context, start) : procedure.railAnswers !== undefined ? railAnswersText(masters, context, procedure.railAnswers) : undefined
  return (
    <CaptureSection label={cardLabel(ordinal, procedureCount)} shot="billing">
      <div className="aa-rail-scope" data-shot="billing-contract-rows" style={{ display: 'flex', flexDirection: 'column' }}>
        {contract === undefined && (
          <div data-shot="needs-invoice-destination" style={{ fontSize: 13.5, fontWeight: 600, color: semantic.warning.onTint, background: semantic.warning.tint, borderRadius: radius.ctl, padding: '8px 12px', marginBottom: 8 }}>
            {NEEDS_INVOICE_DESTINATION}
          </div>
        )}
        <MobileRow label="Invoice to" value={answers} todo={answers === undefined ? 'Not set by the office' : undefined} onOpen={editable ? () => setOpen(true) : undefined} />
        <MobileRow
          label="Contract"
          value={contract !== undefined ? `${contract.name} · ${contractPriceText(contract, context.listDateISO)}` : undefined}
          todo={contract === undefined ? 'After where the invoice goes' : undefined}
          onOpen={editable ? () => setOpen(true) : undefined}
          last
        />
        {officeOnly && <span data-shot="contract-set-by-office" style={{ fontSize: 12.5, color: neutral.slate, marginTop: 6 }}>Set by the office</span>}
        {railActor === 'anaesthetist' && editable && <span style={{ fontSize: 12, color: neutral.mist, marginTop: 6 }}>{CONTRACT_CHANGE_CAPTION}</span>}
      </div>
      <ContractRail
        open={open}
        actor={railActor}
        context={context}
        start={start}
        {...(procedure.governingContractId !== undefined ? { currentContractId: procedure.governingContractId } : {})}
        {...(procedure.enteredPrice !== undefined ? { currentEnteredPrice: procedure.enteredPrice } : {})}
        onDone={(pick) => {
          const res = setProcedureContract(useAppStore, actor, procedure.id, pick.contractId, pick.enteredPrice !== undefined ? { enteredPrice: pick.enteredPrice } : {})
          return res.ok ? null : res.message
        }}
        onLeave={(next) => {
          if (next !== undefined) setRailAnswers(useAppStore, actor, procedure.id, next)
        }}
        onClose={() => setOpen(false)}
      />
    </CaptureSection>
  )
}

function MobileRow({ label, value, todo, onOpen, last }: { label: string; value?: string; todo?: string; onOpen?: () => void; last?: boolean }) {
  return (
    <button
      type="button"
      data-shot={`billing-row-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`}
      disabled={onOpen === undefined}
      onClick={onOpen}
      className="aa-rail-focus"
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderBottom: last === true ? 'none' : `1px solid ${neutral.line}`, background: 'transparent', padding: '12px 0', fontFamily: 'inherit', cursor: onOpen !== undefined ? 'pointer' : 'default' }}
    >
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: todo !== undefined ? accent.base : neutral.slate }}>
          {label}
          {todo !== undefined && ' · to do'}
        </span>
        <span style={{ fontSize: 15, fontWeight: value !== undefined ? 600 : 400, color: value !== undefined ? neutral.ink : neutral.mist }}>{value ?? todo}</span>
      </span>
      {onOpen !== undefined && <ChevronRight size={18} color={neutral.slate} aria-hidden />}
    </button>
  )
}
