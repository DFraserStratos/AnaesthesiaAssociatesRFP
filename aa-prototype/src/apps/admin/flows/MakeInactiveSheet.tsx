import { useMemo, useState } from 'react'
import { INACTIVE_REASONS, INACTIVE_REASON_LABELS, listsAfterLastDay } from '../../../domain/anaesthetistStatus'
import { sessionText } from '../../../domain/outOfHours'
import type { InactiveReason } from '../../../domain/types'
import { drSurname, locationName, shortDay } from '../../../shared/format'
import { ConfirmSheet } from '../../../shared/surface'
import { TableShell, Td, Th } from '../../../shared/table'
import { FormError, Notice, SelectField, TextAction, TextField } from '../../../shared/ui'
import { makeAnaesthetistInactive, ownActiveContracts, useAppStore, useToday, type Actor } from '../../../store'

/**
 * Make an anaesthetist inactive (build plan Phase 52; US-12.1.6), over the
 * shared `ConfirmSheet` (docs/explorations/people-section.html #inactive: the
 * last day, the Lists that refuse it, what happens after it, the reason).
 *
 * The Lists after the chosen day are read as the day changes, so the refusal
 * shows in place before Make inactive is pressed ("Dr Beaumont has 2 Lists after
 * Thu 31 Dec. Reassign them first."), each List a link to the Day view at its
 * date, where the office reassigns it; Make inactive waits until none is left.
 * The store refuses the same way if anything changed meanwhile.
 *
 * Hooks: `make-inactive-sheet`, `make-inactive-last-day`, `make-inactive-reason`,
 * `make-inactive-lists` (rows `make-inactive-list-row`, `data-list-id`),
 * `make-inactive-after`, `make-inactive-confirm`.
 */
export function MakeInactiveSheet({ open, anaesthetistId, actor, onClose }: { open: boolean; anaesthetistId: string; actor: Actor; onClose: () => void }) {
  const todayISO = useToday()
  const anaesthetist = useAppStore((s) => s.masters.anaesthetists[anaesthetistId])
  const lists = useAppStore((s) => s.schedule.lists)
  const masters = useAppStore((s) => s.masters)
  const own = useMemo(() => ownActiveContracts({ masters }, anaesthetistId), [masters, anaesthetistId])
  const [lastDayISO, setLastDayISO] = useState(todayISO)
  const [reason, setReason] = useState<InactiveReason>('leftPractice')
  const [error, setError] = useState<string | null>(null)
  const validDay = /^\d{4}-\d{2}-\d{2}$/.test(lastDayISO) && lastDayISO >= todayISO
  const held = useMemo(() => (validDay ? listsAfterLastDay(Object.values(lists), anaesthetistId, lastDayISO) : []), [validDay, lists, anaesthetistId, lastDayISO])
  if (anaesthetist === undefined) return null
  const who = drSurname(anaesthetist.name)
  const day = validDay ? shortDay(lastDayISO) : null

  function confirm() {
    const outcome = makeAnaesthetistInactive(useAppStore, actor, anaesthetistId, lastDayISO, reason)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title={`Make ${anaesthetist.name} inactive?`}
      description="Until their last day nothing changes."
      confirmLabel="Make inactive"
      confirmVariant="danger"
      confirmDisabled={!validDay || held.length > 0}
      confirmShot="make-inactive-confirm"
      cancelLabel="Cancel"
      onConfirm={confirm}
      size={held.length > 0 ? 'wide' : 'default'}
      shot="make-inactive-sheet"
    >
      <TextField
        label="Last day"
        type="date"
        value={lastDayISO}
        min={todayISO}
        onChange={(v) => {
          setLastDayISO(v)
          setError(null)
        }}
        invalid={!validDay}
        hint={validDay ? 'The last day they work. Today or later.' : 'Choose today or a later day.'}
        shot="make-inactive-last-day"
      />
      {held.length > 0 && day !== null && (
        <Notice tone="warning" live="status" title={`${who} has ${held.length} ${held.length === 1 ? 'List' : 'Lists'} after ${day}. Reassign ${held.length === 1 ? 'it' : 'them'} first.`} shot="make-inactive-lists">
          <TableShell label="Lists after the last day" density="dense" style={{ marginTop: 6 }}>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Hospital</Th>
                <Th>Surgeon</Th>
                <Th align="right">Reassign</Th>
              </tr>
            </thead>
            <tbody>
              {held.map((l) => (
                <tr key={l.id} data-shot="make-inactive-list-row" data-list-id={l.id}>
                  <Td mono nowrap>{shortDay(l.dateISO)}</Td>
                  <Td>{`${locationName(l.hospitalId, masters.hospitals)} ${sessionText(l.session)}`}</Td>
                  <Td>{masters.surgeons[l.surgeonId]?.name ?? l.surgeonId}</Td>
                  <Td align="right" nowrap>
                    <TextAction size="sm" flush to={`/admin/day/${l.dateISO}`} label={`Open ${shortDay(l.dateISO)} on the Day view`}>Open day</TextAction>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </Notice>
      )}
      {day !== null && held.length === 0 && (
        <Notice tone="neutral" title={`After ${day}`} shot="make-inactive-after">
          No sessions, and not offered for any List. No sign-in to the anaesthetist app.{' '}
          {own.length === 0
            ? 'They hold no Contracts of their own.'
            : `Their own ${own.length === 1 ? 'Contract' : 'Contracts'} ${own.map((c) => c.name).join(', ')} ${own.length === 1 ? 'is' : 'are'} disabled.`}
        </Notice>
      )}
      <SelectField label="Reason" value={reason} onChange={(v) => setReason(v as InactiveReason)} shot="make-inactive-reason">
        {INACTIVE_REASONS.map((r) => (
          <option key={r} value={r}>{INACTIVE_REASON_LABELS[r]}</option>
        ))}
      </SelectField>
      <FormError message={error} />
    </ConfirmSheet>
  )
}
