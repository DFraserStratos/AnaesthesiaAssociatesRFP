import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import type { Contract, ContractId, RailAnswers, RvgGroupId } from '../../domain/types'
import { mayTypeEnteredPrice, OFFICE_TYPES_AMOUNT_MESSAGE } from '../../domain/billing/contractRail'
import { CodePickerSheet } from '../capture/CodePickerSheet'
import {
  contractRailFor,
  type ContractRailView,
  type RailActor,
  type RailContext,
} from '../../domain/billing/contractRail'
import { isRvgKind } from '../../domain/billing/contracts'
import { railMastersOf, useAppStore } from '../../store'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { NameSearchBox } from '../ui/NameSearchBox'
import { Button } from '../ui/Button'
import { TextAction } from '../ui/TextAction'
import { parseAmount } from '../format'
import { FormError } from '../ui'
import { Notice } from '../ui/Notice'
import { useRovingRadio } from '../ui/useRovingRadio'
import { BackstopAmountField, NoContractGroup, RailOptionGroup, StepRail, type RailStep } from '../contracts/railParts'
import { backstopPriceText, contractPriceText, railBackstops, railContractLabel } from '../contracts/railText'

/**
 * The step rail (catch-up Phase 20; US-04.3.8, US-04.3.9, US-04.3.2,
 * US-04.3.3): the one Contract picker, for the office on Admin and, mirrored,
 * the anaesthetist on mobile, web and the PWA. It draws `contractRailFor` and
 * knows nothing of the rules: three numbered steps shown from the start ("Where
 * does the invoice go?", then the step that narrows it, then the Contract by
 * typing), an answered step clickable to change it (the later ones clear), a
 * step that filled itself in reads "Only option", and the Contract list starts
 * with a "No contract" heading holding the destination's two backstops (No
 * contract · RVG and No contract · Fixed price, the latter with its typed
 * amount). A bottom sheet on mobile, the surface's Dialog on web and Admin.
 * Since 20 (9) only the creation forms open it; the Booking's Billing card is
 * inline. Its parts (step rail, answer options, the "No contract" group, the
 * amount field) are the Billing card's (`shared/contracts/railParts.tsx`, UI
 * unification U4).
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


export function ContractRail({ open, actor, context, start, currentContractId, currentEnteredPrice, onDone, onLeave, onClose }: ContractRailProps) {
  const { Overlay, variant } = useSurface()
  const masters = useAppStore((s) => s.masters)
  const [given, setGiven] = useState<RailAnswers | undefined>(start)
  const [editing, setEditing] = useState<Step | null>(null)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<ContractId | undefined>(currentContractId)
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
  const backstops = railBackstops(view.contract)
  // The step's own Contracts; the pinned No contract · RVG is one of the backstops, listed under "No contract".
  const listed = (view.contract?.shown ?? []).filter((r) => !r.pinned).map((r) => r.contract)
  const pickable = new Set([...backstops.map((c) => c.id), ...(view.contract?.rows.map((r) => r.contract.id) ?? [])])
  // What is chosen: the person's pick when still on offer, else what the step filled in (a lone Contract, or
  // No contract · Fixed price where nothing else fits).
  const finalId: ContractId | undefined =
    picked !== undefined && pickable.has(picked) ? picked : step === 3 || autoPick?.viaOtherPrice !== true ? autoPick?.contractId : undefined
  const finalContract = finalId !== undefined ? masters.contracts[finalId] : undefined
  const usingOther = finalId !== undefined && finalId === fallback?.contract.id

  const answer = (next: RailAnswers | undefined) => {
    setGiven(next)
    setEditing(null)
    setQuery('')
    setPicked(undefined)
    setError(null)
  }

  const close = () => {
    // Keep only answers the person gave (never one a step filled in for them),
    // and only when they moved on from where the rail opened.
    if (currentContractId === undefined && given !== undefined && JSON.stringify(given) !== JSON.stringify(start)) onLeave?.(given)
    onClose()
  }

  // Other price asks for the amount (US-04.3.9) wherever this person may type it.
  // Any open-priced Contract asks for its amount where this person may type it (as the Billing card does).
  const openPriced = finalContract?.pricing.kind === 'open'
  const mayTypeHere = openPriced && finalContract !== undefined && mayTypeEnteredPrice(actor, finalContract, masters.parties)
  const asksAmount = mayTypeHere
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
    3: finalContract !== undefined ? railContractLabel(finalContract) : undefined,
  }
  // Changing an answered step clears the later ones (US-04.3.8).
  if (editing !== null) {
    for (const later of [2, 3] as Step[]) if (later > editing) stepAnswer[later] = undefined
  }
  const stepAuto: Record<Step, boolean> = {
    1: view.destination.autoFilled,
    2: view.narrow?.autoFilled === true,
    3: autoPick !== undefined && picked === undefined && query === '',
  }
  const reachable = (s: Step) => s === 1 || (s === 2 && view.destination.answer !== undefined) || (s === 3 && view.narrow?.answer !== undefined)

  const railSteps: RailStep[] = ([1, 2, 3] as Step[]).map((s) => ({
    n: s,
    label: s === 2 && view.narrow !== undefined ? view.narrow.title : STEP_TITLE[s],
    ...(stepAnswer[s] !== undefined ? { value: stepAnswer[s] } : {}),
    auto: stepAuto[s],
    // The Contract step shows its answer once there is one, as the Billing card's finished path does.
    done: stepAnswer[s] !== undefined && (s !== step || s === 3),
    current: step === s,
    ...(reachable(s) && s !== step
      ? {
          onJump: () => {
            if (s === 3) {
              setEditing(null)
              return
            }
            const dest = view.destination.answer as RailAnswers['destination'] | undefined
            setGiven(s === 1 ? undefined : dest !== undefined ? { destination: dest } : undefined)
            setPicked(undefined)
            setQuery('')
            setEditing(s)
          },
        }
      : {}),
  }))

  let body: ReactNode
  if (step === 1) {
    body = (
      <RailOptionGroup
        layout="list"
        label="Where does the invoice go?"
        options={view.destination.options}
        value={view.destination.answer}
        onPick={(v) => answer({ destination: v as RailAnswers['destination'] })}
      />
    )
  } else if (step === 2 && view.narrow !== undefined) {
    const dest = view.destination.answer as RailAnswers['destination']
    body = (
      <RailOptionGroup
        layout="list"
        label={view.narrow.title}
        options={view.narrow.options}
        value={view.narrow.answer}
        onPick={(v) => answer({ destination: dest, narrow: v })}
      />
    )
  } else {
    const c = view.contract
    body = (
      <ContractList
        query={query}
        onQuery={setQuery}
        autoFocus={variant !== 'mobile'}
        mobile={variant === 'mobile'}
        backstops={backstops}
        listed={listed}
        dateISO={context.listDateISO}
        chosenId={finalId}
        onPick={(id) => {
          setPicked(id)
          setError(null)
        }}
        empty={
          query.trim() !== '' && listed.length === 0
            ? `No Contract matches "${query.trim()}".`
            : query.trim() === '' && listed.length === 0
              ? 'No Contract of its own fits this List.'
              : null
        }
        more={c !== undefined && c.rows.length > c.shown.length ? `Showing ${c.shown.length} of ${c.rows.length}. Type to narrow.` : null}
        amount={
          openPriced ? (
            mayTypeHere ? (
              <BackstopAmountField
                label={<span style={{ fontSize: 12.5, fontWeight: 600, color: neutral.slate }}>Amount, ex GST</span>}
                ariaLabel="Amount, ex GST"
                value={amount}
                onChange={setAmount}
                invalid={asksAmount && amount.trim() !== '' && typedAmount === undefined}
              />
            ) : (
              <div style={{ fontSize: 13, color: neutral.slate }}>{OFFICE_TYPES_AMOUNT_MESSAGE}</div>
            )
          ) : null
        }
      />
    )
  }

  const outcome = finalContract !== undefined && step === 3 ? outcomeLine(finalContract, actor, usingOther, mayTypeHere, context.listDateISO) : null

  return (
    <Overlay open={open} onClose={close} size="wide">
      <div className="aa-rail-scope" data-shot="contract-picker" role="group" aria-labelledby="contract-rail-title" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <OverlayHeader id="contract-rail-title" title="Choose the Contract" />
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>Where the invoice goes, then the Contract. Each step offers only what fits this List.</div>
        </div>
        {variant === 'mobile' ? (
          <>
            <StepRail steps={railSteps} orientation="compact" label="Steps" />
            <div>{body}</div>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '216px minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
            <StepRail steps={railSteps} orientation="vertical" label="Steps" />
            <div>{body}</div>
          </div>
        )}
        {outcome !== null && (
          <Notice
            tone="neutral"
            shot="contract-rail-outcome"
            action={
              actor === 'office' && finalContract !== undefined && isRvgKind(finalContract.pricing.kind) && !usingOther ? (
                <TextAction small shot="contract-rail-enter-rvg" onClick={() => setCodeOpen(true)}>
                  {rvgNow !== undefined ? 'Change code' : 'Enter it now'}
                </TextAction>
              ) : undefined
            }
          >
            <span>
              {outcome}
              {rvgNow !== undefined && masters.rvgGroups[rvgNow] !== undefined && (
                <span className="mono" style={{ marginLeft: 6, color: neutral.ink }}>RVG code {masters.rvgGroups[rvgNow]!.code}</span>
              )}
            </span>
          </Notice>
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
        <FormError message={error} />
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

/**
 * Step 3's list: the search (a grey well in the sheet, question 4), then one
 * radio group with one Tab stop (`useRovingRadio`): the "No contract" heading
 * with the destination's two backstops, then the step's own Contracts. A pick
 * here only marks the row (the footer's "Use this Contract" sets it), so the
 * arrows select as a native radio group does.
 */
function ContractList({
  query,
  onQuery,
  autoFocus,
  mobile,
  backstops,
  listed,
  dateISO,
  chosenId,
  onPick,
  empty,
  more,
  amount,
}: {
  query: string
  onQuery: (q: string) => void
  autoFocus: boolean
  mobile: boolean
  backstops: readonly Contract[]
  listed: readonly Contract[]
  dateISO: string
  chosenId: ContractId | undefined
  onPick: (id: ContractId) => void
  empty: string | null
  more: string | null
  amount: ReactNode
}) {
  const all = [...backstops, ...listed]
  const radio = useRovingRadio({ values: all.map((c) => c.id), value: chosenId, onChange: onPick })
  const row = (c: Contract, i: number, priceText: string) => (
    <ContractRow key={c.id} contract={c} priceText={priceText} selected={chosenId === c.id} itemProps={radio.itemProps(i)} onPick={() => onPick(c.id)} />
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <NameSearchBox value={query} onChange={onQuery} label="Type a name or code" placeholder="Type a name or code" autoFocus={autoFocus} fill="well" shot="contract-rail-search" />
      <div {...radio.groupProps} aria-label="Contracts" style={{ display: 'flex', flexDirection: 'column', maxHeight: mobile ? 300 : 340, overflow: 'auto', margin: '0 -4px', padding: '0 4px' }}>
        <NoContractGroup backstops={backstops} renderRow={(c) => row(c, backstops.indexOf(c), backstopPriceText(c))} />
        {listed.map((c, i) => row(c, backstops.length + i, contractPriceText(c, dateISO)))}
        {empty !== null && <div style={{ padding: '14px 6px', fontSize: 13.5, color: neutral.mist }}>{empty}</div>}
      </div>
      {more !== null && <div style={{ fontSize: 12.5, color: neutral.mist }}>{more}</div>}
      {amount}
    </div>
  )
}

function ContractRow({
  contract,
  priceText,
  selected,
  itemProps,
  onPick,
}: {
  contract: Contract
  priceText: string
  selected: boolean
  itemProps: ReturnType<ReturnType<typeof useRovingRadio>['itemProps']>
  onPick: () => void
}) {
  return (
    <button
      {...itemProps}
      type="button"
      data-contract-id={contract.id}
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
        <span style={{ fontSize: 14.5, fontWeight: 500, color: neutral.ink, lineHeight: 1.3 }}>{railContractLabel(contract)}</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{contract.aaCode}</span>
          {contract.holderReference !== undefined && (
            <span className="mono" style={{ fontSize: 12, color: neutral.mist }}>{contract.holderReference}</span>
          )}
        </span>
      </span>
      <span className={priceText.startsWith('$') || priceText.startsWith('Prepaid · $') ? 'mono' : undefined} style={{ fontSize: 13, fontWeight: 600, color: neutral.slate, whiteSpace: 'nowrap' }}>
        {priceText}
      </span>
    </button>
  )
}
