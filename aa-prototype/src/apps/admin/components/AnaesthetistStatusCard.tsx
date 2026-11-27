import { useState } from 'react'
import { Button, TextField } from '../../../shared'
import { INACTIVE_REASON_LABELS, statusOn, type AnaesthetistStatus } from '../../../domain/anaesthetistStatus'
import { anaesthetistStatusLabel, plainDate, shortDay } from '../../../shared/format'
import { Card, DefList, DefRow, FieldHint, FormError, Pill, TextAction } from '../../../shared/ui'
import { clearLastDay, editAnaesthetist, useAppStore, useToday, type Actor } from '../../../store'
import { MakeActiveSheet } from '../flows/MakeActiveSheet'
import { MakeInactiveSheet } from '../flows/MakeInactiveSheet'
import { PROFILE_CARD, type StatusDotTone } from './ProfileChrome'

/** Two facts side by side, as the Rate and tier card beside it lays its own out. */
const FACTS = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } as const

/**
 * Whether an anaesthetist is active, and the office's one action for it (build
 * plan Phase 52; US-12.1.6). Self-contained on today's anaesthetist record (54
 * places it on the anaesthetist's page as it is), beside 50's `RateTierCard`:
 *
 * - Active, since the start date (or the day made active again): Make inactive
 *   opens `MakeInactiveSheet`.
 * - A last day ahead: "Inactive from <day>" with the reason, and Clear last day
 *   (straight away: nothing has changed yet).
 * - Inactive since the day after: the reason, and Make active opens
 *   `MakeActiveSheet` with the Contracts offered back.
 *
 * Hooks: `anaesthetist-status` (`data-status`), `anaesthetist-make-inactive`,
 * `anaesthetist-clear-last-day`, `anaesthetist-make-active`, `anaesthetist-status-error`.
 *
 * Build plan Phase 54 (the anaesthetist's page): `editStartDate` (default off)
 * shows the start date, read as "Active from" while it is the day they became
 * active, with Change start date: a date field, Cancel and Save, saving
 * `{ startDateISO }` alone (one audited change; the store's Slot rule refuses a
 * date that removes a session holding a List, shown here). Hooks
 * `anaesthetist-start-date`, `-change`, `-field`, `-cancel`, `-save`.
 */
export function AnaesthetistStatusCard({
  anaesthetistId,
  actor,
  editStartDate = false,
  showAction = true,
}: {
  anaesthetistId: string
  actor: Actor
  editStartDate?: boolean
  /** Off on the anaesthetist's page, whose header carries the action (`AnaesthetistStatusAction`); the card keeps the facts and the start date. */
  showAction?: boolean
}) {
  const anaesthetist = useAppStore((s) => s.masters.anaesthetists[anaesthetistId])
  const todayISO = useToday()
  const [sheet, setSheet] = useState<'inactive' | 'active' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [startDraft, setStartDraft] = useState<string | null>(null)
  if (anaesthetist === undefined) return null
  const status = statusOn(anaesthetist, todayISO)
  // The start date, where it is shown: on the "Active from" row while it is the day they became active, else its own row.
  const startOnActiveRow = editStartDate && status.kind === 'active' && status.sinceISO === anaesthetist.startDateISO

  function saveStartDate() {
    if (startDraft === null) return
    const outcome = editAnaesthetist(useAppStore, actor, anaesthetistId, { startDateISO: startDraft })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setStartDraft(null)
    setError(null)
  }

  function clear() {
    const outcome = clearLastDay(useAppStore, actor, anaesthetistId)
    setError(outcome.ok ? null : outcome.message)
  }

  const action =
    status.kind === 'active' ? (
      <TextAction size="sm" flush onClick={() => setSheet('inactive')} shot="anaesthetist-make-inactive">Make inactive</TextAction>
    ) : status.kind === 'leaving' ? (
      <TextAction size="sm" flush onClick={clear} shot="anaesthetist-clear-last-day">Clear last day</TextAction>
    ) : (
      <TextAction size="sm" flush onClick={() => setSheet('active')} shot="anaesthetist-make-active">Make active</TextAction>
    )

  return (
    <Card style={PROFILE_CARD} title="Status" shot="anaesthetist-status" data-status={status.kind} {...(showAction ? { action } : {})}>
      <div>
        <Pill tone={status.kind === 'active' ? 'success' : status.kind === 'leaving' ? 'warning' : 'neutral'} size="sm" shot="anaesthetist-status-pill">
          {anaesthetistStatusLabel(status)}
        </Pill>
      </div>
      <DefList gap={12} style={FACTS}>
        {status.kind === 'leaving' ? (
          <DefRow layout="stacked" label="Last day" mono>{plainDate(status.lastDayISO)}</DefRow>
        ) : (
          <DefRow layout="stacked" label={startOnActiveRow ? 'Active from' : status.kind === 'active' ? 'Active since' : 'Inactive since'} mono {...(startOnActiveRow ? { shot: 'anaesthetist-start-date' } : {})}>
            {plainDate(status.sinceISO)}
          </DefRow>
        )}
        {editStartDate && !startOnActiveRow && (
          <DefRow layout="stacked" label="Start date" mono shot="anaesthetist-start-date">{plainDate(anaesthetist.startDateISO)}</DefRow>
        )}
        {status.kind !== 'active' && status.reason !== null && (
          <DefRow layout="stacked" label="Reason">{INACTIVE_REASON_LABELS[status.reason]}</DefRow>
        )}
      </DefList>
      {status.kind === 'leaving' && (
        <FieldHint tone="slate">Until then nothing changes. After it they have no sessions and cannot sign in, and their own Contracts are disabled.</FieldHint>
      )}
      {editStartDate &&
        (startDraft === null ? (
          <div>
            <TextAction size="sm" flush onClick={() => { setStartDraft(anaesthetist.startDateISO); setError(null) }} shot="anaesthetist-start-date-change">Change start date</TextAction>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <TextField
              label="Start date"
              type="date"
              value={startDraft}
              onChange={setStartDraft}
              hint="Sessions are created from this date to the end of the schedule horizon."
              shot="anaesthetist-start-date-field"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="secondary" size="compact" onClick={() => { setStartDraft(null); setError(null) }} shot="anaesthetist-start-date-cancel">Cancel</Button>
              <Button variant="primary" size="compact" onClick={saveStartDate} shot="anaesthetist-start-date-save">Save</Button>
            </div>
          </div>
        ))}
      <FormError message={error} shot="anaesthetist-status-error" />
      {sheet === 'inactive' && <MakeInactiveSheet open anaesthetistId={anaesthetistId} actor={actor} onClose={() => setSheet(null)} />}
      {sheet === 'active' && <MakeActiveSheet open anaesthetistId={anaesthetistId} actor={actor} onClose={() => setSheet(null)} />}
    </Card>
  )
}

/**
 * The anaesthetist's status as the page header's fact strip reads it (profile-ideas.html tab 3): the
 * word with its dot, and a short note on the same line. Active "since" the day they became active;
 * a last day ahead still reads Active, with "last day" and the warning dot; Inactive "since" the day
 * after their last day, in mist.
 */
export function anaesthetistStatusFact(status: AnaesthetistStatus): { tone: StatusDotTone; word: string; note: string } {
  if (status.kind === 'leaving') return { tone: 'warn', word: 'Active', note: `last day ${shortDay(status.lastDayISO)}` }
  if (status.kind === 'inactive') return { tone: 'off', word: 'Inactive', note: `since ${plainDate(status.sinceISO)}` }
  return { tone: 'ok', word: 'Active', note: `since ${plainDate(status.sinceISO)}` }
}

/**
 * The Status card's one action as the anaesthetist's page header button (a secondary compact
 * `Button` at the end of the title row), opening the same flows: Make inactive opens
 * `MakeInactiveSheet`; with a last day ahead, Clear last day clears it straight away; inactive,
 * Make active again opens `MakeActiveSheet`. Keeps the card's hooks: `anaesthetist-make-inactive`,
 * `anaesthetist-clear-last-day`, `anaesthetist-make-active`; a refusal shows under it
 * (`anaesthetist-status-action-error`).
 */
export function AnaesthetistStatusAction({ anaesthetistId, actor }: { anaesthetistId: string; actor: Actor }) {
  const anaesthetist = useAppStore((s) => s.masters.anaesthetists[anaesthetistId])
  const todayISO = useToday()
  const [sheet, setSheet] = useState<'inactive' | 'active' | null>(null)
  const [error, setError] = useState<string | null>(null)
  if (anaesthetist === undefined) return null
  const status = statusOn(anaesthetist, todayISO)

  function clear() {
    const outcome = clearLastDay(useAppStore, actor, anaesthetistId)
    setError(outcome.ok ? null : outcome.message)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      {status.kind === 'active' ? (
        <Button variant="secondary" size="compact" onClick={() => setSheet('inactive')} shot="anaesthetist-make-inactive">Make inactive</Button>
      ) : status.kind === 'leaving' ? (
        <Button variant="secondary" size="compact" onClick={clear} shot="anaesthetist-clear-last-day">Clear last day</Button>
      ) : (
        <Button variant="secondary" size="compact" onClick={() => setSheet('active')} shot="anaesthetist-make-active">Make active again</Button>
      )}
      <FormError message={error} variant="inline" shot="anaesthetist-status-action-error" />
      {sheet === 'inactive' && <MakeInactiveSheet open anaesthetistId={anaesthetistId} actor={actor} onClose={() => setSheet(null)} />}
      {sheet === 'active' && <MakeActiveSheet open anaesthetistId={anaesthetistId} actor={actor} onClose={() => setSheet(null)} />}
    </div>
  )
}
