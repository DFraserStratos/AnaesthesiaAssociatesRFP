import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Approach } from '../App'
import { CONTRACT_BY_ID, PROCEDURES, basisOf, lineFee, type Scenario, type Selection } from '../data'
import { Combo, FieldValue } from '../pickers/Combo'
import { ContractThenLinesList, ContractsForProcedure, FlatContractList, HolderThenContractsList, ProcedureList } from '../pickers/lists'
import { accent, neutral, radius } from '../theme/tokens'
import { KIND } from '../theme/kinds'
import { KindDot, Pill } from '../ui'
import { billingOf } from './billing'
import { PricingExtras } from './PricingExtras'

interface Props {
  approach: Approach
  scenario: Scenario
  useContext: boolean
  selection: Selection | null
  procedureId?: string
  onSelection: (s: Selection | null) => void
  onProcedure: (id: string | undefined) => void
  onRows: (n: number | null) => void
  onStep: () => void
}

/**
 * The top of the booking's capture column: what the procedure is, beside which
 * Contract prices it. The left card is the procedure (as received, plus the
 * procedure list under approach 1); the right card is the Contract, with an RVG
 * code field only when the Contract prices from the RVG.
 */
export function TopCards({ approach, scenario, useContext, selection, procedureId, onSelection, onProcedure, onRows, onStep }: Props) {
  // Approaches 2 and 3: an RVG code typed first narrows both layers.
  const [narrow, setNarrow] = useState<string | undefined>()
  const procedure = procedureId ? PROCEDURES.find((p) => p.id === procedureId) : undefined
  const closed = () => onRows(null)

  const pick = (s: Selection | null, close: () => void) => {
    onSelection(s)
    onStep()
    close()
  }

  // Equal heights: both cards stretch to the row; the procedure text fits inside it, never sets it.
  // Approach 1 lifts the received wording into its own full-width card, so the
  // left card holds only the procedure list.
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'stretch' }}>
      {approach === 'procedure' && (
        <div style={{ gridColumn: '1 / -1', display: 'flex' }}>
          <Card>
            <Received scenario={scenario} title="Procedure as received" wide />
          </Card>
        </div>
      )}

      {/* Procedure */}
      <Card>
        {approach !== 'procedure' && <Received scenario={scenario} title="Procedure as received" />}
        {approach === 'procedure' && <CardHead>Procedure</CardHead>}
        {approach === 'procedure' && (
          <Combo
            placeholder="Find the procedure"
            clearLabel="procedure"
            onClear={() => {
              onProcedure(undefined)
              onSelection(null)
            }}
            width={560}
            onOpen={onStep}
            onClose={closed}
            value={procedure ? <FieldValue main={procedure.name} sub={`${procedure.section.replace(/^\d+ - /, '')} · ${procedure.subgroup.replace(/^\d+ - /, '')}`} aside={procedure.rvg ? <Pill tone="accent" mono>{procedure.rvg}</Pill> : undefined} /> : null}
          >
            {(close, seed) => (
              <ProcedureList
                seed={seed}
                selectedId={procedureId}
                onRows={onRows}
                onPick={(p) => {
                  if (p.id !== procedureId) onSelection(null)
                  onProcedure(p.id)
                  onStep()
                  close()
                }}
              />
            )}
          </Combo>
        )}
      </Card>

      {/* Contract */}
      <Card title="Contract">
        {approach === 'procedure' && (
          <Combo placeholder={procedure ? 'Choose from the Contracts for this procedure' : 'Pick the procedure first'} clearLabel="Contract" onClear={() => onSelection(null)} disabled={!procedure} align="right" onOpen={onStep} onClose={closed} value={contractValue(selection)}>
            {(close, seed) => procedure && <ContractsForProcedure seed={seed} procedure={procedure} scenario={scenario} useContext={useContext} pending={selection} onRows={onRows} onPick={(s) => pick(s, close)} />}
          </Combo>
        )}

        {approach === 'contract' && (
          <Combo placeholder="Choose the Contract, then its line" clearLabel="Contract" onClear={() => onSelection(null)} align="right" onOpen={onStep} onClose={closed} value={contractValue(selection)}>
            {(close, seed) => (
              <ContractThenLinesList
                seed={seed}
                scenario={scenario}
                useContext={useContext}
                narrow={narrow}
                onNarrow={(code) => {
                  setNarrow(code)
                  onStep()
                }}
                pending={selection}
                onRows={onRows}
                onStep={onStep}
                onPick={(s) => pick(s, close)}
              />
            )}
          </Combo>
        )}

        {approach === 'holder' && (
          <Combo placeholder="Choose the organisation, then its Contract" clearLabel="Contract" onClear={() => onSelection(null)} align="right" onOpen={onStep} onClose={closed} value={contractValue(selection)}>
            {(close, seed) => (
              <HolderThenContractsList
                seed={seed}
                scenario={scenario}
                useContext={useContext}
                narrow={narrow}
                onNarrow={(code) => {
                  setNarrow(code)
                  onStep()
                }}
                pending={selection}
                onRows={onRows}
                onStep={onStep}
                onPick={(s) => pick(s, close)}
              />
            )}
          </Combo>
        )}

        {approach === 'single' && (
          <Combo placeholder="Search every Contract" clearLabel="Contract" onClear={() => onSelection(null)} align="right" width={640} onOpen={onStep} onClose={closed} value={contractValue(selection)}>
            {(close, seed) => <FlatContractList seed={seed} scenario={scenario} useContext={useContext} pending={selection} onRows={onRows} onPick={(s) => pick(s, close)} />}
          </Combo>
        )}

        <PricingExtras scenario={scenario} selection={selection} onSelection={onSelection} />
      </Card>
    </div>
  )
}

export function contractValue(selection: Selection | null): ReactNode | null {
  const b = billingOf(selection)
  if (!b.contract) return null
  if (b.line) return lineValue(b.line, b.contract.name)
  return (
    <FieldValue
      main={b.contract.name}
      sub={
        <>
          <KindDot kind={b.contract.holderKind} />
          {b.contract.holder} · {basisOf(b.contract)}
        </>
      }
    />
  )
}

function lineValue(line: NonNullable<ReturnType<typeof billingOf>['line']>, context?: string) {
  const contract = CONTRACT_BY_ID.get(line.contract)!
  return (
    <FieldValue
      main={
        <>
          {line.code && <span className="mono" style={{ color: accent.base, marginRight: 6 }}>{line.code}</span>}
          {line.description}
        </>
      }
      sub={
        <>
          <KindDot kind={contract.holderKind} />
          {[context ?? contract.holder, line.band].filter(Boolean).join(' · ')}
        </>
      }
      aside={
        <>
          <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{lineFee(line)}</div>
          {contract.isPrepay && <div style={{ fontSize: 11, color: KIND.anaesthetist.onTint, fontWeight: 600 }}>Prepay</div>}
        </>
      }
    />
  )
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section style={{ flex: 1, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      {title && <CardHead>{title}</CardHead>}
      {children}
    </section>
  )
}

/** A card's title row, the same height whether or not it carries the source switch. */
function CardHead({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', minHeight: 24 }}>
      <CardTitle>{children}</CardTitle>
    </div>
  )
}

function CardTitle({ children }: { children: ReactNode }) {
  return <h3 style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.slate }}>{children}</h3>
}

/**
 * The procedure as received, one source at a time. The switch in the header
 * flips between each system's wording (the latest first); the wording swaps in
 * place and fits the same box, so the card never changes height. Nothing here
 * is ever edited.
 */
export function Received({ scenario, title, wide }: { scenario: Scenario; title: string; wide?: boolean }) {
  const last = scenario.received.length - 1
  const [index, setIndex] = useState(last)
  const [expanded, setExpanded] = useState(false)
  const [clipped, setClipped] = useState(false)
  const shown = scenario.received[index]!
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 24 }}>
        <CardTitle>{title}</CardTitle>
        {scenario.received.length > 1 && (
          <div role="tablist" aria-label="Wording from" style={{ display: 'flex', background: neutral.sunken, borderRadius: 8, padding: 2, gap: 2, flex: 'none' }}>
            {scenario.received.map((r, i) => (
              <button
                key={r.source}
                type="button"
                role="tab"
                aria-selected={i === index}
                onClick={() => {
                  setIndex(i)
                  setExpanded(false)
                }}
                style={{ border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: i === index ? neutral.surface : 'transparent', color: i === index ? accent.base : neutral.slate, boxShadow: i === index ? '0 1px 2px rgba(23,35,32,0.12)' : 'none' }}
              >
                {r.source === 'Hospital' ? 'Hospital' : 'Rooms'}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FitText key={index} expanded={expanded} onClipped={setClipped} max={17} min={13} minHeight={60} cap={wide ? 72 : undefined} weight={500} color={neutral.ink}>
          {shown.text}
        </FitText>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: neutral.slate, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span className="mono">{shown.at}</span>
            {index === last && scenario.received.length > 1 && ' · latest'} · {shown.system}
          </span>
          {(clipped || expanded) && <LinkButton onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'Show all'}</LinkButton>}
        </div>
      </div>
    </>
  )
}

/**
 * Text that fits the box it is given rather than sizing the box. It is laid out
 * out of flow, so the row's height comes from the other card (or `minHeight`);
 * the type then steps down from `max` to `min` px until it fits. Past `min` it
 * fades out at the foot and reports `onClipped`, so the card can offer "Show
 * all"; `expanded` lets it flow and grow the row.
 */
function FitText({ children, max, min, minHeight, cap, weight, color, expanded, onClipped }: { children: ReactNode; max: number; min: number; minHeight: number; /** In-flow instead: full size, up to `cap` px tall, then the fade. For a card with no neighbour to size it. */ cap?: number; weight: number; color: string; expanded: boolean; onClipped: (clipped: boolean) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(max)
  const [clipped, setClipped] = useState(false)

  useLayoutEffect(() => {
    if (expanded) return
    const fit = () => {
      const b = box.current
      const t = inner.current
      if (!b || !t) return
      if (cap) {
        const over = t.scrollHeight > cap + 1
        setClipped(over)
        onClipped(over)
        return
      }
      let s = max
      t.style.fontSize = `${s}px`
      while (s > min && t.scrollHeight > b.clientHeight) {
        s -= 0.5
        t.style.fontSize = `${s}px`
      }
      const over = t.scrollHeight > b.clientHeight + 1
      setSize(s)
      setClipped(over)
      onClipped(over)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box.current!)
    return () => ro.disconnect()
  }, [children, max, min, cap, expanded, onClipped])

  const text = { fontWeight: weight, color, lineHeight: 1.42, overflowWrap: 'anywhere' } as const

  if (expanded) return <div style={{ ...text, fontSize: min + 1 }}>{children}</div>

  if (cap) {
    return (
      <div ref={box} style={{ position: 'relative' }}>
        <div ref={inner} style={{ ...text, maxHeight: cap, overflow: 'hidden', fontSize: max }}>
          {children}
        </div>
        {clipped && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 28, background: `linear-gradient(to bottom, rgba(255,255,255,0), ${neutral.surface})` }} />}
      </div>
    )
  }

  return (
    <div ref={box} style={{ position: 'relative', flex: 1, minHeight }}>
      <div ref={inner} style={{ ...text, position: 'absolute', inset: 0, overflow: 'hidden', fontSize: size }}>
        {children}
      </div>
      {clipped && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 28, background: `linear-gradient(to bottom, rgba(255,255,255,0), ${neutral.surface})` }} />}
    </div>
  )
}

function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ flex: 'none', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: accent.base }}>
      {children}
    </button>
  )
}
