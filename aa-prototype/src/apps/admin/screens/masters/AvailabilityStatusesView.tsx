import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { neutral, radius } from '../../../../theme/tokens'
import { LIST_KINDS, type SlotStatus } from '../../../../domain/types'
import { allStatusesForEditor } from '../../../../domain/slotStatus'
import { futureSessionsWithStatus, reorderSlotStatus, restoreSlotStatus, retireSlotStatus, useAppStore, type Actor } from '../../../../store'
import { FormError, StatusChip } from '../../../../shared'
import { ConfirmSheet } from '../../../../shared/surface'
import { SlotStatusSheet } from '../../flows/SlotStatusSheet'
import { MasterHeader, MasterTable } from './chrome'
import { TextAction } from '../../../../shared/ui'
import { cellStyle } from './tableStyles'

const yesNo = (v: boolean) => (v ? 'Yes' : 'No')

/**
 * Master data, Availability statuses (catch-up Phase 29; US-01.2.2, OQ-64
 * answered): the user-maintained list of what a session can be marked. Each
 * row shows its live chip and its fixed ID; the office adds, edits, retires
 * and restores statuses here, and every app follows. A List's state is never
 * a row, chip or filter here; the List types are named in the footnote as
 * fixed List attributes.
 */
export function AvailabilityStatusesView({ actor }: { actor: Actor }) {
  const records = useAppStore((s) => s.masters.slotStatuses)
  const rows = allStatusesForEditor(records)
  const inUse = rows.filter((r) => r.retiredAtISO === undefined)
  const [sheet, setSheet] = useState<{ status?: SlotStatus } | null>(null)
  const [retiring, setRetiring] = useState<SlotStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  function restore(status: SlotStatus) {
    const outcome = restoreSlotStatus(useAppStore, actor, status.key)
    setError(outcome.ok ? null : outcome.message)
  }

  return (
    <>
      <MasterHeader
        title="Availability statuses"
        sub="The availability anaesthetists set on their AM and PM sessions. Every session is Free until changed, and a List placed in it shows instead. Rules use each status's ID, so you can rename or recolour a status, or add one, without changing how it behaves. This is a session's availability, not a List's state (Draft, Active, Submitted, Authorised), which shows on the List."
        add={{ label: 'Add status', onClick: () => setSheet({}) }}
      />
      <FormError message={error} />
      <MasterTable
        shot="admin-availability-statuses"
        columns={['Status · ID', 'Long label', 'Open for bookings', 'Anaesthetists can set', 'Default', 'Description', '']}
      >
        {rows.map((s) => {
          const retired = s.retiredAtISO !== undefined
          const muted = retired ? { color: neutral.mist } : {}
          return (
            <tr key={s.key} data-status-row={s.key} style={retired ? { background: neutral.bg } : undefined}>
              {/* The chip over its ID and whether it is in use: one column, so the table fits a 1280 laptop. */}
              <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                <StatusChip status={s.key} style={retired ? { opacity: 0.6 } : undefined} />
                <div className="mono" style={{ marginTop: 4, color: neutral.slate, ...muted }}>{s.key}</div>
                <div style={{ fontSize: 12, color: neutral.mist }}>
                  {retired ? `Retired ${format(parseISO(s.retiredAtISO ?? ''), 'd MMM yyyy')}` : 'In use'}
                </div>
              </td>
              <td style={{ ...cellStyle, ...muted }}>{s.longLabel}</td>
              <td style={{ ...cellStyle, ...muted }}>{yesNo(s.bookable)}</td>
              <td style={{ ...cellStyle, ...muted }}>{yesNo(s.anaesthetistCanSet)}</td>
              <td style={{ ...cellStyle, ...muted }}>{s.isDefault === true ? 'Default' : ''}</td>
              <td style={{ ...cellStyle, ...muted }}>{s.description}</td>
              <td style={{ ...cellStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', gap: 12 }}>
                  {!retired && inUse[0]?.key !== s.key && (
                    <TextAction size="sm" flush onClick={() => reorderSlotStatus(useAppStore, actor, s.key, 'up')} label={`Move ${s.label} up`}>Up</TextAction>
                  )}
                  {!retired && inUse.at(-1)?.key !== s.key && (
                    <TextAction size="sm" flush onClick={() => reorderSlotStatus(useAppStore, actor, s.key, 'down')} label={`Move ${s.label} down`}>Down</TextAction>
                  )}
                  <TextAction size="sm" flush onClick={() => setSheet({ status: s })} label={`Edit ${s.label}`}>Edit</TextAction>
                  {retired ? (
                    <TextAction size="sm" flush onClick={() => restore(s)} label={`Restore ${s.label}`}>Restore</TextAction>
                  ) : (
                    <TextAction size="sm" flush onClick={() => { setError(null); setRetiring(s) }} label={`Retire ${s.label}`}>Retire</TextAction>
                  )}
                </span>
              </td>
            </tr>
          )
        })}
      </MasterTable>
      <div data-shot="availability-statuses-list-types" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12.5, color: neutral.slate }}>
        {/* Catch-up Phase 32d: Public is a status above, so only Private and Pre-op are kinds of List. */}
        {LIST_KINDS.map((k) => <StatusChip key={k} status={k} />)}
        <span>Private and Pre-op are kinds of List, shown on the List, not availability.</span>
      </div>
      {sheet !== null && <SlotStatusSheet key={sheet.status?.key ?? 'new'} status={sheet.status} actor={actor} onClose={() => setSheet(null)} />}
      {retiring !== null && <RetireConfirm status={retiring} actor={actor} onClose={() => setRetiring(null)} />}
    </>
  )
}

function RetireConfirm({ status, actor, onClose }: { status: SlotStatus; actor: Actor; onClose: () => void }) {
  const carrying = useAppStore((s) => futureSessionsWithStatus(s, status.key))
  const [error, setError] = useState<string | null>(null)

  function retire() {
    const outcome = retireSlotStatus(useAppStore, actor, status.key)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <ConfirmSheet
      open
      onClose={onClose}
      title={<>Retire {status.label}?</>}
      confirmLabel="Retire status"
      onConfirm={retire}
      cancelLabel="Cancel"
      shot="admin-availability-status-retire"
    >
      <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px' }}>
        It leaves the choices and the legends. {carrying === 0 ? 'No session from today on carries it.' : `${carrying} ${carrying === 1 ? 'session' : 'sessions'} from today on ${carrying === 1 ? 'carries' : 'carry'} it. They keep it until changed.`} You can restore it later.
      </div>
      <div style={{ background: neutral.bg, borderRadius: radius.ctl, padding: 10 }}><StatusChip status={status.key} /></div>
      <FormError message={error} />
    </ConfirmSheet>
  )
}
