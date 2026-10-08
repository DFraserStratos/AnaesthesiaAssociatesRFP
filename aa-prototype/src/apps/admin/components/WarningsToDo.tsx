import { useState } from 'react'
import { clearWarning, useAppStore, type Actor, type OpenWarningRow } from '../../../store'
import { accent, neutral, radius } from '../../../theme/tokens'
import { drSurname, shortDay } from '../../../shared/format'
import { ClearWarningButton, WarningTriangle, warningTone } from '../../../shared/warnings'

/** Rows shown before "Show all". */
export const TODO_VISIBLE_ROWS = 6

/**
 * The dashboard to-do list (US-13.7.2): every OPEN warning, all dates, soonest
 * first, each with Open and the office's Clear. Warnings that need action
 * only: notices that need none go to the shared notification pool (FT-13.7,
 * Phase 32), which stacks below this card with Phase 31's Draft Lists.
 */
export function WarningsToDo({
  rows,
  actor,
  onOpenBooking,
}: {
  rows: readonly OpenWarningRow[]
  actor: Actor
  onOpenBooking: (dateISO: string, bookingId: string) => void
}) {
  const masters = useAppStore((s) => s.masters)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shown = expanded ? rows : rows.slice(0, TODO_VISIBLE_ROWS)

  return (
    <section
      data-shot="admin-warnings-todo"
      aria-labelledby="admin-todo-heading"
      style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <h2 id="admin-todo-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
        To-do
        {rows.length > 0 && (
          <span style={{ padding: '0 7px', borderRadius: radius.pill, background: neutral.sunken, color: neutral.slate, fontSize: 11.5, fontWeight: 700, lineHeight: '18px', fontVariantNumeric: 'tabular-nums' }}>
            {rows.length}
          </span>
        )}
      </h2>
      {rows.length === 0 && <div style={{ fontSize: 12.5, color: neutral.mist }}>Nothing needs attention.</div>}
      {shown.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map((r) => {
            const patient = masters.patients[r.patientId]?.name ?? 'Unknown patient'
            const anae = masters.anaesthetists[r.anaesthetistId]
            const tone = warningTone(r.warning.strength)
            return (
              <li
                key={r.warning.key}
                data-warning-key={r.warning.key}
                style={{ display: 'flex', gap: 10, padding: '10px 12px', background: neutral.bg, borderRadius: 10, boxShadow: `inset 3px 0 0 ${tone.solid}` }}
              >
                <span style={{ paddingTop: 1 }}>
                  <WarningTriangle warnings={[r.warning]} size="sm" />
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 12.5, lineHeight: '17px', fontWeight: 600, color: neutral.ink }}>{r.warning.text}</span>
                  <span style={{ fontSize: 11, lineHeight: '15px', color: neutral.slate }}>
                    {patient} · {anae !== undefined ? drSurname(anae.name) : r.anaesthetistId} · {shortDay(r.dateISO)} {r.session}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      aria-label={`Open ${patient}'s Booking`}
                      onClick={() => onOpenBooking(r.dateISO, r.bookingId)}
                      style={{ border: 'none', background: 'none', padding: 0, minHeight: 30, color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Open
                    </button>
                    <ClearWarningButton
                      compact
                      warning={r.warning}
                      label={`${r.warning.strength === 'mild' ? 'Clear (optional)' : 'Clear'} warning for ${patient}`}
                      onClear={() => {
                        const res = clearWarning(useAppStore, actor, r.bookingId, r.warning.key)
                        setError(res.ok ? null : res.message)
                      }}
                    />
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {rows.length > TODO_VISIBLE_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          style={{ alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, minHeight: 28, color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          {expanded ? 'Show fewer' : `Show all (${rows.length})`}
        </button>
      )}
      {error !== null && <div role="alert" style={{ fontSize: 12, color: neutral.slate }}>{error}</div>}
    </section>
  )
}
