import { useRef, type KeyboardEvent } from 'react'
import { vacatedChoices } from '../../domain/listMoves'
import type { SlotStatusKey } from '../../domain/types'
import { accent, neutral } from '../../theme/tokens'
import { resolveDisplayStatus, useSlotStatusRecords } from '../status/useSlotStatuses'

/**
 * What the session a List leaves becomes (catch-up Phase 32b; D60, OQ-84
 * answered; US-01.4.1, US-01.4.3, US-01.5.5). The one control every move path
 * shows, the anaesthetist's and the office's alike: a radiogroup of status
 * chips from the master (labels and colours by fixed id), no hint text and no
 * "keep as is". The store validates the answer (`vacatedStatusRefusal`).
 *
 * - A plain move offers Free, then Unavailable.
 * - Marking the session not available (`statusBeingSet`) offers that status,
 *   then Free.
 * - An anaesthetist sees only statuses she may set.
 */
export function VacatedSessionChoice({
  label,
  value,
  onChange,
  statusBeingSet,
  anaesthetist = false,
  shot = 'vacated-choice',
}: {
  /** "Your session after the move", or "Dr Rutherford's session after the move". */
  label: string
  value: SlotStatusKey
  onChange: (key: SlotStatusKey) => void
  statusBeingSet?: SlotStatusKey
  /** Drop statuses an anaesthetist may not set. */
  anaesthetist?: boolean
  shot?: string
}) {
  const statuses = useSlotStatusRecords()
  const choices = vacatedChoices(statusBeingSet).filter((k) => {
    const s = statuses[k]
    return s !== undefined && s.retiredAtISO === undefined && (!anaesthetist || s.anaesthetistCanSet)
  })
  return <StatusRadioGroup label={label} choices={choices} value={value} onChange={onChange} shot={shot} />
}

/**
 * A radiogroup of status chips from the master (labels and colours by fixed
 * id), with a roving tab stop and arrow keys, as a native radio group: the
 * vacated-session choice and the office's status sheet share it. Each chip is
 * `[data-shot=<shot>-<key>]` and `[data-status-choice=<key>]`.
 */
export function StatusRadioGroup({
  label,
  choices,
  value,
  onChange,
  shot,
  showLabel = true,
  labelOf = 'label',
}: {
  label: string
  choices: readonly SlotStatusKey[]
  value: SlotStatusKey
  onChange: (key: SlotStatusKey) => void
  shot: string
  /** Show the label above the chips (it is always the group's accessible name). */
  showLabel?: boolean
  labelOf?: 'label' | 'longLabel'
}) {
  const statuses = useSlotStatusRecords()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  // Arrow keys move the choice, as a native radio group does.
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return
    e.preventDefault()
    const at = Math.max(0, choices.indexOf(value))
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
    const next = (at + step + choices.length) % choices.length
    const key = choices[next]
    if (key === undefined) return
    onChange(key)
    refs.current[next]?.focus()
  }

  return (
    <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {showLabel && <span style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>{label}</span>}
      <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {choices.map((k, i) => {
          const r = resolveDisplayStatus(k, statuses)
          const selected = value === k
          return (
            <button
              key={k}
              ref={(el) => { refs.current[i] = el }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (!choices.includes(value) && i === 0) ? 0 : -1}
              data-shot={`${shot}-${k}`}
              data-status-choice={k}
              onClick={() => onChange(k)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 40,
                padding: '0 14px',
                borderRadius: 999,
                border: selected ? `2px solid ${accent.base}` : `1px solid ${neutral.line}`,
                background: selected ? accent.tint : neutral.surface,
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                color: neutral.ink,
                cursor: 'pointer',
              }}
            >
              <span aria-hidden style={{ width: 12, height: 12, borderRadius: 4, background: r.visual.blockBackground, border: r.visual.border ?? `1px solid ${r.visual.solid}` }} />
              {labelOf === 'longLabel' ? r.longLabel : r.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
