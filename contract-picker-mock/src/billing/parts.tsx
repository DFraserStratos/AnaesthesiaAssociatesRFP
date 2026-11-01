import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { matches, type Branch, type Scenario, type Selection } from '../data'
import { PricingExtras } from '../booking/PricingExtras'
import { billingOf } from '../booking/billing'
import { contractValue } from '../booking/TopCards'
import { Combo } from '../pickers/Combo'
import { ContractRow, GroupHeader, LineRow, Note, ScrollArea, SearchField, Toolbar, isContract } from '../pickers/shared'
import { accent, neutral, radius } from '../theme/tokens'
import { SECOND_LABEL, branchOptions, hasSecond, hospitalName, onlyContract, onlyOption, rowsOnPath, secondOptions, selectionOf, type Path, type PathRow } from './paths'

/** Props every billable-party-first variant takes. */
export interface BillableProps {
  scenario: Scenario
  useContext: boolean
  selection: Selection | null
  onSelection: (s: Selection | null) => void
  path: Path
  onPath: (p: Path) => void
  onRows: (n: number | null) => void
  onStep: () => void
}

/** Ben's three steps: where the invoice goes, the second question, then the price. */
export type Step = 'branch' | 'second' | 'price'

/** Fill the second question if it has only one answer (e.g. no prepay list: Not prepaid). */
export function advance(s: Scenario, path: Path): Path {
  if (!hasSecond(path) || path.second) return path
  const only = onlyOption(secondOptions(s, path))
  return only ? { ...path, second: only } : path
}

/** Take an answer: fill what follows if it has only one answer, and pick a lone Contract. */
export function takeAnswer({ scenario, onPath, onSelection, onStep }: BillableProps, p: Path) {
  const next = advance(scenario, p)
  onPath(next)
  onSelection(onlyContract(scenario, next))
  onStep()
}

export const branchLabel = (s: Scenario, b: Branch) => (b === 'patient' ? 'Patient' : b === 'hospital' ? hospitalName(s.hospitalId) : 'Special contract')

/** Which steps of a path are answered, in order, and whether each was filled in for the user. */
export function stepsOf(s: Scenario, path: Path): { step: Step; label: string; auto: boolean }[] {
  const out: { step: Step; label: string; auto: boolean }[] = []
  if (!path.branch) return out
  out.push({ step: 'branch', label: branchLabel(s, path.branch), auto: false })
  if (path.second) out.push({ step: 'second', label: SECOND_LABEL[path.second], auto: onlyOption(secondOptions(s, { branch: path.branch })) === path.second })
  return out
}

/** The step a path still needs (null: done, though every answer stays open to change). */
export function nextStep(path: Path, selection: Selection | null): Step | null {
  if (!path.branch) return 'branch'
  // A special contract is picked straight from the list: that is its second step.
  if (path.branch === 'special') return selection ? null : 'second'
  if (!path.second) return 'second'
  return selection ? null : 'price'
}

/** Cut a path back to just before a step (to change an answer). */
export function upTo(path: Path, step: Step): Path {
  if (step === 'branch') return {}
  if (step === 'second') return { branch: path.branch }
  return path
}

/** The question each step asks, in the words of Ben's tree. */
export function questionOf(s: Scenario, path: Path, step: Step | null): string {
  if (step === 'branch') return 'Where does the invoice go?'
  if (step === 'second') return path.branch === 'patient' ? 'Is it prepaid?' : path.branch === 'hospital' ? `Under which of ${hospitalName(s.hospitalId)}’s contracts?` : 'Which special contract?'
  if (step === 'price') return pricePickIsProcedure(s, path) ? 'Which procedure? Its agreed fee is pre-filled.' : 'Which Contract?'
  return path.branch === 'special' || rowsOnPath(s, path).length > 1 ? 'Contract and price' : 'Price'
}

/** The label of the second step's slot, before and after the first answer. */
export const secondSlotLabel = (path: Path) => (path.branch === 'patient' ? 'Prepaid?' : 'Contract')

/** Are the rows to pick agreed fees (pick the procedure) rather than Contracts? */
const pricePickIsProcedure = (s: Scenario, path: Path) => rowsOnPath(s, path).every((r) => r.kind === 'line')

/** Answered steps as chips: click one to change it. Tags say what the user did not choose. */
export function StepChips({ scenario, path, onJump }: { scenario: Scenario; path: Path; onJump?: (s: Step) => void }) {
  const steps = stepsOf(scenario, path)
  if (steps.length === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {steps.map((st, i) => (
        <span key={st.step} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span style={{ color: neutral.mist }}>›</span>}
          <button
            type="button"
            disabled={!onJump}
            onClick={() => onJump?.(st.step)}
            title={onJump ? 'Change this answer' : undefined}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${accent.base}55`, background: accent.tint, color: accent.base, borderRadius: radius.pill, padding: '4px 12px', fontSize: 13.5, fontWeight: 600, cursor: onJump ? 'pointer' : 'default' }}
          >
            <Check size={13} strokeWidth={3} />
            {st.label}
            {st.auto && <span style={{ fontWeight: 500, color: neutral.slate }}>· only option</span>}
          </button>
        </span>
      ))}
    </div>
  )
}

export interface TileOption<T> {
  value: T
  label: string
  hint?: string
  count: number
}

/** Big choice tiles for one step. Empty answers are greyed; the booking's suggestion is tagged. */
export function ChoiceTiles<T extends string>({ options, value, suggested, onPick, columns }: { options: TileOption<T>[]; value?: T; suggested?: T; onPick: (v: T) => void; columns?: number }) {
  return (
    <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: columns ? `repeat(${columns}, minmax(0, 1fr))` : 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
      {options.map((o) => {
        const on = o.value === value
        const empty = o.count === 0
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={empty}
            onClick={() => onPick(o.value)}
            className={empty ? undefined : 'aa-tile'}
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
              cursor: empty ? 'default' : 'pointer',
              opacity: empty ? 0.55 : 1,
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: on ? accent.base : neutral.ink }}>{o.label}</span>
            {o.hint && <span style={{ fontSize: 12.5, lineHeight: '17px', color: neutral.slate }}>{o.hint}</span>}
            {/* The foot: the count, and the booking's suggestion on the right, so a long label never shares its line. */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginTop: 'auto', paddingTop: 6 }}>
              <span style={{ flex: 1, fontSize: 12, color: empty ? neutral.mist : neutral.slate }}>{empty ? 'None for this List' : `${o.count} ${o.count === 1 ? 'Contract' : 'Contracts'}`}</span>
              {o.value === suggested && !empty && (
                <span title="Suggested from the booking’s funder" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: accent.base, flex: 'none' }}>
                  <Sparkles size={12} /> Suggested
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Options for each step, ready for ChoiceTiles. */
export const branchTiles = (s: Scenario) => branchOptions(s)
export const secondTiles = (s: Scenario, path: Path) => secondOptions(s, { branch: path.branch })

/** The rows at the end of a path, grouped by holder, searchable. */
export function PathList({ scenario, path, selection, onPick, onRows, seed, fill }: { scenario: Scenario; path: Path; selection: Selection | null; onPick: (s: Selection) => void; onRows: (n: number) => void; seed?: string; fill?: boolean }) {
  const [q, setQ] = useState(seed ?? '')
  const rows = useMemo(
    () => rowsOnPath(scenario, path).filter((r) => (r.kind === 'line' ? matches(q, r.contract.holder, r.contract.name, r.line.code, r.line.description, r.line.band) : matches(q, r.contract.holder, r.contract.name))),
    [scenario, path, q],
  )
  useEffect(() => onRows(rows.length), [rows.length, onRows])

  const groups = useMemo(() => {
    const m = new Map<string, { title: string; kind: PathRow['contract']['holderKind']; rows: PathRow[] }>()
    for (const r of rows) {
      const key = r.contract.holderKind === 'insurer' ? 'Insurers and funders' : r.contract.holder
      const g = m.get(key) ?? { title: key, kind: r.contract.holderKind, rows: [] }
      g.rows.push(r)
      m.set(key, g)
    }
    return [...m.values()]
  }, [rows])

  const schedules = (holderRows: PathRow[]) => new Set(holderRows.map((r) => r.contract.id)).size
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: fill ? 1 : undefined, height: fill ? '100%' : undefined }}>
      <Toolbar>
        <SearchField autoFocus={!fill} value={q} onChange={setQ} placeholder="Search by name, code, description or band" />
      </Toolbar>
      <ScrollArea>
        {groups.map((g) => (
          <div key={g.title}>
            <GroupHeader kind={g.kind} count={g.rows.length}>{g.title}</GroupHeader>
            {g.rows.map((r) =>
              r.kind === 'contract' ? (
                <ContractRow key={r.contract.id} contract={r.contract} selected={isContract(selection, r.contract.id)} onClick={() => onPick(selectionOf(r))} />
              ) : (
                <LineRow key={r.line.id} line={r.line} context={schedules(g.rows) > 1 ? r.contract : undefined} selected={selection?.lineId === r.line.id} onClick={() => onPick(selectionOf(r))} />
              ),
            )}
          </div>
        ))}
        {rows.length === 0 && <Note>Nothing here for this List.</Note>}
      </ScrollArea>
    </div>
  )
}

/** A field that opens the path's list, as the price-first fields do. */
export function PathCombo({ scenario, path, selection, onSelection, onRows, onStep, placeholder, value, align }: BillableProps & { placeholder: string; value: ReactNode | null; align?: 'left' | 'right' }) {
  return (
    <Combo placeholder={placeholder} align={align} width={640} clearLabel="Contract" onClear={() => onSelection(null)} onOpen={onStep} onClose={() => onRows(null)} value={value}>
      {(close, seed) => (
        <PathList
          seed={seed}
          scenario={scenario}
          path={path}
          selection={selection}
          onRows={onRows}
          onPick={(sel) => {
            onSelection(sel)
            onStep()
            close()
          }}
        />
      )}
    </Combo>
  )
}

/**
 * The end of the path: a field to pick from when the path leaves more than one
 * row (the procedure for agreed fees, or one of several Contracts), then who
 * fills in the price. A lone RVG Contract was picked for the user already.
 */
export function PriceStep({ props, narrow, labelled }: { props: BillableProps; narrow?: boolean; labelled?: boolean }) {
  const { scenario, path, selection, onSelection } = props
  const rows = rowsOnPath(scenario, path)
  const pick = path.branch === 'special' || rows.length > 1 || Boolean(selection?.lineId)
  const procedure = path.branch !== 'special' && rows.every((r) => r.kind === 'line')
  const b = billingOf(selection)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: narrow || !pick || !b.contract ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
      {pick && (
        <div style={{ minWidth: 0, maxWidth: b.contract ? undefined : 640 }}>
          <SideLabelled label={procedure ? 'Procedures' : 'Contract'} narrow={narrow}>
          <PathCombo {...props} placeholder={procedure ? 'Choose the procedure' : path.branch === 'special' ? 'Choose the special contract' : 'Choose the Contract'} value={contractValue(selection)} />
        </SideLabelled>
          </div>
      )}
      {b.contract && (
        <div style={{ minWidth: 0, maxWidth: pick ? undefined : 640 }}>
          {labelled ? (
            <SideLabelled label="Price" narrow={narrow}>
              <PricingExtras scenario={scenario} selection={selection} onSelection={onSelection} />
            </SideLabelled>
          ) : (
            <PricingExtras scenario={scenario} selection={selection} onSelection={onSelection} />
          )}
        </div>
      )}
    </div>
  )
}

/** A field with its label to the left, centred on the field's first line (above it where the column is narrow). */
function SideLabelled({ label, narrow, children }: { label: string; narrow?: boolean; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: narrow ? 'column' : 'row', alignItems: narrow ? 'stretch' : 'flex-start', gap: narrow ? 6 : 12, minWidth: 0 }}>
      <span style={{ flex: 'none', paddingTop: narrow ? 0 : 10, fontSize: 12.5, lineHeight: '20px', fontWeight: 600, color: neutral.slate }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

/** In a few words, what the price came to, for a step's slot. */
export function priceSummary(selection: Selection | null): string {
  const b = billingOf(selection)
  if (!b.contract) return ''
  if (b.mode === 'fixed') return `${b.prepay ? 'Prepaid' : 'Agreed fee'} ${b.line!.approx ? 'about ' : ''}$${b.line!.fee.toLocaleString('en-NZ')}`
  if (b.mode === 'line') return 'Procedure to choose'
  return b.amount !== undefined ? `Fixed price $${b.amount.toLocaleString('en-NZ')}` : b.rvg ? `RVG ${b.rvg.code}` : 'Card to the anaesthetist'
}
