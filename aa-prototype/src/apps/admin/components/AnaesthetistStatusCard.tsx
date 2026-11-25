import { useState } from 'react'
import { INACTIVE_REASON_LABELS, statusOn } from '../../../domain/anaesthetistStatus'
import { anaesthetistStatusLabel, plainDate } from '../../../shared/format'
import { Card, DefList, DefRow, FieldHint, FormError, Pill, TextAction } from '../../../shared/ui'
import { clearLastDay, useAppStore, useToday, type Actor } from '../../../store'
import { MakeActiveSheet } from '../flows/MakeActiveSheet'
import { MakeInactiveSheet } from '../flows/MakeInactiveSheet'
import { PROFILE_CARD } from './ProfileChrome'

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
 */
export function AnaesthetistStatusCard({ anaesthetistId, actor }: { anaesthetistId: string; actor: Actor }) {
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

  const action =
    status.kind === 'active' ? (
      <TextAction size="sm" flush onClick={() => setSheet('inactive')} shot="anaesthetist-make-inactive">Make inactive</TextAction>
    ) : status.kind === 'leaving' ? (
      <TextAction size="sm" flush onClick={clear} shot="anaesthetist-clear-last-day">Clear last day</TextAction>
    ) : (
      <TextAction size="sm" flush onClick={() => setSheet('active')} shot="anaesthetist-make-active">Make active</TextAction>
    )

  return (
    <Card style={PROFILE_CARD} title="Status" shot="anaesthetist-status" data-status={status.kind} action={action}>
      <div>
        <Pill tone={status.kind === 'active' ? 'success' : status.kind === 'leaving' ? 'warning' : 'neutral'} size="sm" shot="anaesthetist-status-pill">
          {anaesthetistStatusLabel(status)}
        </Pill>
      </div>
      <DefList gap={12} style={FACTS}>
        {status.kind === 'leaving' ? (
          <DefRow layout="stacked" label="Last day" mono>{plainDate(status.lastDayISO)}</DefRow>
        ) : (
          <DefRow layout="stacked" label={status.kind === 'active' ? 'Active since' : 'Inactive since'} mono>
            {plainDate(status.sinceISO)}
          </DefRow>
        )}
        {status.kind !== 'active' && status.reason !== null && (
          <DefRow layout="stacked" label="Reason">{INACTIVE_REASON_LABELS[status.reason]}</DefRow>
        )}
      </DefList>
      {status.kind === 'leaving' && (
        <FieldHint tone="slate">Until then nothing changes. After it they have no sessions and cannot sign in, and their own Contracts are disabled.</FieldHint>
      )}
      <FormError message={error} shot="anaesthetist-status-error" />
      {sheet === 'inactive' && <MakeInactiveSheet open anaesthetistId={anaesthetistId} actor={actor} onClose={() => setSheet(null)} />}
      {sheet === 'active' && <MakeActiveSheet open anaesthetistId={anaesthetistId} actor={actor} onClose={() => setSheet(null)} />}
    </Card>
  )
}
