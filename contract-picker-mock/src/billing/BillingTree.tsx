import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { PricingExtras } from '../booking/PricingExtras'
import { accent, neutral, radius } from '../theme/tokens'
import { hasSecond, suggestedPath } from './paths'
import { PathList, branchTiles, secondSlotLabel, secondTiles, takeAnswer, type BillableProps } from './parts'

/**
 * Variant C: Ben's whole tree across the card. Columns run where the invoice
 * goes, the second question, then the Contract or procedure; picking a node
 * narrows everything to its right, and branches with nothing behind them are
 * greyed out.
 */
export function BillingTree(props: BillableProps) {
  const { scenario, selection, onSelection, path, onRows, onStep } = props
  const suggestion = suggestedPath(scenario)
  const ready = path.branch && (!hasSecond(path) || path.second)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 200px minmax(0, 1fr)', border: `1px solid ${neutral.line}`, borderRadius: radius.card, overflow: 'hidden', minHeight: 360 }}>
        <Column title="Invoice to" first>
          {branchTiles(scenario).map((o) => (
            <Node key={o.value} label={o.label} count={o.count} on={path.branch === o.value} suggested={suggestion.branch === o.value} onPick={() => takeAnswer(props, { branch: o.value })} />
          ))}
        </Column>

        <Column title={path.branch ? secondSlotLabel(path) : 'Then'} muted={!hasSecond(path)}>
          {hasSecond(path) ? (
            secondTiles(scenario, path).map((o) => (
              <Node key={o.value} label={o.label} count={o.count} on={path.second === o.value} suggested={suggestion.branch === path.branch && suggestion.second === o.value} onPick={() => takeAnswer(props, { ...path, second: o.value })} />
            ))
          ) : (
            <Empty>{path.branch === 'special' ? 'Nothing to ask: pick the contract' : 'After where the invoice goes'}</Empty>
          )}
        </Column>

        <Column title="Contract and price" muted={!ready} flush>
          {ready ? (
            <PathList
              key={`${path.branch}-${path.second}`}
              fill
              scenario={scenario}
              path={path}
              selection={selection}
              onRows={onRows}
              onPick={(sel) => {
                onSelection(sel)
                onStep()
              }}
            />
          ) : (
            <div style={{ padding: 10 }}>
              <Empty>After the second question</Empty>
            </div>
          )}
        </Column>
      </div>

      {selection && (
        <div style={{ display: 'grid', gridTemplateColumns: '420px minmax(0, 1fr)', gap: 16 }}>
          <div />
          <PricingExtras scenario={scenario} selection={selection} onSelection={onSelection} />
        </div>
      )}
    </div>
  )
}

function Column({ title, children, muted, flush, first }: { title: string; children: ReactNode; muted?: boolean; flush?: boolean; first?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderLeft: first ? 'none' : `1px solid ${neutral.line}`, background: muted ? neutral.bg : neutral.surface, minWidth: 0, maxHeight: 460 }}>
      <div style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.slate, borderBottom: `1px solid ${neutral.line}`, background: neutral.sunken }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: flush ? 0 : 6, padding: flush ? 0 : 10, flex: 1, minHeight: 0, overflow: flush ? 'hidden' : 'auto' }}>{children}</div>
    </div>
  )
}

function Node({ label, count, on, suggested, onPick }: { label: string; count: number; on: boolean; suggested?: boolean; onPick: () => void }) {
  const empty = count === 0
  return (
    <button
      type="button"
      disabled={empty}
      aria-pressed={on}
      title={suggested && !empty ? 'Suggested from the booking’s funder' : undefined}
      onClick={onPick}
      style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', padding: '9px 12px', borderRadius: radius.ctl, border: `1px solid ${on ? accent.base : neutral.line}`, background: on ? accent.tint : neutral.surface, color: on ? accent.base : empty ? neutral.mist : neutral.ink, fontSize: 14, fontWeight: 600, cursor: empty ? 'default' : 'pointer', opacity: empty ? 0.6 : 1 }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
      {suggested && !empty && <Sparkles size={13} color={accent.base} aria-label="Suggested" style={{ flex: 'none' }} />}
      <span className="mono" style={{ fontSize: 12, fontWeight: 500, color: on ? accent.base : empty ? neutral.lineStrong : neutral.mist, flex: 'none' }}>{count}</span>
    </button>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <div style={{ padding: '6px 2px', fontSize: 13, color: neutral.mist }}>{children}</div>
}
