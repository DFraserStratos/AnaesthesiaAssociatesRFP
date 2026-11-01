import type { ReactNode } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { billingOf } from '../booking/billing'
import { accent, neutral, radius } from '../theme/tokens'
import { suggestedPath, type Path } from './paths'
import { ChoiceTiles, PriceStep, branchTiles, nextStep, priceSummary, questionOf, secondSlotLabel, secondTiles, stepsOf, takeAnswer, upTo, type BillableProps, type Step } from './parts'

/*
 * Ben's questions in one place: every step has a slot from the start (answered,
 * current or still to come), so answering one fills its slot.
 *
 *   A  Step rail: the slots as a compact numbered rail down the left; the rest
 *                 of the card is the current question. The default.
 */

const ORDER: Step[] = ['branch', 'second', 'price']

type SlotState = 'done' | 'current' | 'todo'
interface Slot {
  step: Step
  label: string
  state: SlotState
  value: string
  auto: boolean
}

/** The guided path's state and actions, shared by both layouts. */
function useGuided(props: BillableProps) {
  const { scenario, selection, onSelection, path, onPath, onStep } = props
  const step = nextStep(path, selection)
  const answered = stepsOf(scenario, path)
  const special = path.branch === 'special'

  const jump = (s: Step) => {
    if (s === 'price') return
    onPath(upTo(path, s))
    onSelection(null)
    onStep()
  }
  const restart = () => {
    onPath({})
    onSelection(null)
  }

  const contract = billingOf(selection).contract
  const price = priceSummary(selection)
  const slots: Slot[] = ORDER.map((s) => {
    const label = s === 'branch' ? 'Invoice to' : s === 'second' ? secondSlotLabel(path) : 'Price'
    const a = answered.find((x) => x.step === s)
    // A special contract's second step is the Contract itself, picked from the list.
    if (s === 'second' && special) return contract ? { step: s, label, state: 'done', value: contract.name, auto: false } : { step: s, label, state: 'current', value: '', auto: false }
    if (s === 'price') return price ? { step: s, label, state: 'done', value: price, auto: false } : { step: s, label, state: step === 'price' ? 'current' : 'todo', value: '', auto: false }
    if (a) return { step: s, label, state: 'done', value: a.label, auto: a.auto }
    return { step: s, label, state: s === step ? 'current' : 'todo', value: '', auto: false }
  })

  return { step, slots, answer: (p: Path) => takeAnswer(props, p), jump, restart, started: Boolean(path.branch) }
}

/** The current step's question and answers; `narrow` stacks the price under its field. */
function StepBody({ props, step, answer, narrow, aside }: { props: BillableProps; step: Step | null; answer: (p: Path) => void; narrow?: boolean; aside?: ReactNode }) {
  const { scenario, path } = props
  const suggestion = suggestedPath(scenario)

  if (step === 'branch')
    return (
      <StepFrame aside={aside} question={questionOf(scenario, path, step)}>
        <ChoiceTiles options={branchTiles(scenario)} columns={narrow ? undefined : 3} suggested={suggestion.branch} onPick={(branch) => answer({ branch })} />
      </StepFrame>
    )

  if (step === 'second' && path.branch !== 'special')
    return (
      <StepFrame aside={aside} question={questionOf(scenario, path, step)}>
        <ChoiceTiles options={secondTiles(scenario, path)} columns={narrow ? undefined : 3} suggested={suggestion.branch === path.branch ? suggestion.second : undefined} onPick={(second) => answer({ ...path, second })} />
      </StepFrame>
    )

  // The price (or a special contract's pick), and the finished path (still open to change).
  return (
    <StepFrame aside={aside} question={questionOf(scenario, path, step)}>
      <PriceStep props={props} narrow={narrow} />
    </StepFrame>
  )
}

function StepFrame({ question, aside, children }: { question: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'aa-fade-in 160ms ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h4 style={{ flex: 1, margin: 0, fontSize: 17, lineHeight: '24px', fontWeight: 600, color: neutral.ink }}>{question}</h4>
        {aside}
      </div>
      {children}
    </div>
  )
}

function Restart({ onClick, hidden }: { onClick: () => void; hidden: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden}
      style={{ visibility: hidden ? 'hidden' : 'visible', display: 'inline-flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', color: neutral.slate, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}
    >
      <RotateCcw size={13} /> Start again
    </button>
  )
}

/* ------------------------------------------------------------------ A */

/** A: the steps as a compact rail on the left; the rest of the card is the current question. */
export function StepRail(props: BillableProps) {
  const g = useGuided(props)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'clamp(168px, 28%, 256px) minmax(0, 1fr)' }}>
      <nav aria-label="Billing steps" style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${neutral.line}`, paddingRight: 12 }}>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {g.slots.map((s, i) => (
            <li key={s.step}>
              <RailStep slot={s} n={i + 1} last={i === g.slots.length - 1} onJump={s.state === 'done' && s.step !== 'price' ? () => g.jump(s.step) : undefined} />
            </li>
          ))}
        </ol>
      </nav>
      <div style={{ paddingLeft: 18, minWidth: 0 }}>
        <StepBody props={props} step={g.step} answer={g.answer} narrow aside={<Restart onClick={g.restart} hidden={!g.started} />} />
      </div>
    </div>
  )
}

function RailStep({ slot, n, last, onJump }: { slot: Slot; n: number; last: boolean; onJump?: () => void }) {
  const current = slot.state === 'current'
  const done = slot.state === 'done'
  const value = slot.value
  return (
    <button
      type="button"
      disabled={!onJump}
      onClick={onJump}
      title={onJump ? 'Change this answer' : undefined}
      aria-current={current ? 'step' : undefined}
      className={onJump ? 'aa-slot' : undefined}
      style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', border: 'none', background: current ? accent.tint : 'transparent', borderRadius: radius.ctl, padding: '8px 10px', cursor: onJump ? 'pointer' : 'default', position: 'relative' }}
    >
      {/* The marker, and the line on to the next step. */}
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
          {done ? <Check size={13} strokeWidth={3} /> : n}
        </span>
        {!last && <span aria-hidden style={{ position: 'absolute', top: 26, bottom: -22, width: 1.5, background: done ? accent.base : neutral.line }} />}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: done ? 12 : 14, lineHeight: done ? '16px' : '24px', fontWeight: 600, color: current ? accent.base : done ? neutral.slate : neutral.mist }}>{slot.label}</span>
        {done && (
          <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: neutral.ink, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            <span className="aa-slot-value">{value}</span>
          </span>
        )}
        {slot.auto && <span style={{ fontSize: 12, color: neutral.slate }}>Only option</span>}
      </span>
    </button>
  )
}
