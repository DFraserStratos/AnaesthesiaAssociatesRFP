import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { neutral, radius } from '../../../../theme/tokens'
import { LIST_KINDS, type SlotStatus } from '../../../../domain/types'
import { allStatusesForEditor } from '../../../../domain/slotStatus'
import { futureSessionsWithStatus, reorderSlotStatus, restoreSlotStatus, retireSlotStatus, useAppStore, type Actor } from '../../../../store'
import { Button, FormError, StatusChip, useSurface } from '../../../../shared'
import { SlotStatusSheet } from '../../flows/SlotStatusSheet'
import { Header, Table, TextAction } from './chrome'
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
      <Header
        title="Availability statuses"
        sub="The availability anaesthetists set on their AM and PM sessions. Every session is Free until changed, and a List placed in it shows instead. Rules use each status's ID, so you can rename or recolour a status, or add one, without changing how it behaves. This is a session's availability, not a List's state (Draft, Active, Submitted, Authorised), which shows on the List."
        action={<Button variant="secondary" onClick={() => setSheet({})} style={{ whiteSpace: 'nowrap', flex: 'none', padding: '0 18px' }}>Add status</Button>}
      />
      <FormError message={error} />
      <Table
        shot="admin-availability-statuses"
        heads={['Status', 'ID', 'Long label', 'Open for bookings', 'Anaesthetists can set', 'Default', 'Description', 'Use', '']}
      >
        {rows.map((s) => {
          const retired = s.retiredAtISO !== undefined
          const muted = retired ? { color: neutral.mist } : {}
          return (
            <tr key={s.key} data-status-row={s.key} style={retired ? { background: neutral.bg } : undefined}>
              <td style={cellStyle}><StatusChip status={s.key} style={retired ? { opacity: 0.6 } : undefined} /></td>
              <td className="mono" style={{ ...cellStyle, ...muted }}>{s.key}</td>
              <td style={{ ...cellStyle, ...muted }}>{s.longLabel}</td>
              <td style={{ ...cellStyle, ...muted }}>{yesNo(s.bookable)}</td>
              <td style={{ ...cellStyle, ...muted }}>{yesNo(s.anaesthetistCanSet)}</td>
              <td style={{ ...cellStyle, ...muted }}>{s.isDefault === true ? 'Default' : ''}</td>
              <td style={{ ...cellStyle, ...muted, maxWidth: 260 }}>{s.description}</td>
              <td style={{ ...cellStyle, ...muted, whiteSpace: 'nowrap' }}>
                {retired ? `Retired ${format(parseISO(s.retiredAtISO ?? ''), 'd MMM yyyy')}` : 'In use'}
              </td>
              <td style={{ ...cellStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', gap: 12 }}>
                  {!retired && inUse[0]?.key !== s.key && (
                    <TextAction onClick={() => reorderSlotStatus(useAppStore, actor, s.key, 'up')} label={`Move ${s.label} up`}>Up</TextAction>
                  )}
                  {!retired && inUse.at(-1)?.key !== s.key && (
                    <TextAction onClick={() => reorderSlotStatus(useAppStore, actor, s.key, 'down')} label={`Move ${s.label} down`}>Down</TextAction>
                  )}
                  <TextAction onClick={() => setSheet({ status: s })} label={`Edit ${s.label}`}>Edit</TextAction>
                  {retired ? (
                    <TextAction onClick={() => restore(s)} label={`Restore ${s.label}`}>Restore</TextAction>
                  ) : (
                    <TextAction onClick={() => { setError(null); setRetiring(s) }} label={`Retire ${s.label}`}>Retire</TextAction>
                  )}
                </span>
              </td>
            </tr>
          )
        })}
      </Table>
      <div data-shot="availability-statuses-list-types" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12.5, color: neutral.slate }}>
        <span>List types are fixed attributes of a List, not availability:</span>
        {LIST_KINDS.map((k) => <StatusChip key={k} status={k} />)}
        <span>A session holding a List shows the List in place of its status.</span>
      </div>
      {sheet !== null && <SlotStatusSheet key={sheet.status?.key ?? 'new'} status={sheet.status} actor={actor} onClose={() => setSheet(null)} />}
      {retiring !== null && <RetireConfirm status={retiring} actor={actor} onClose={() => setRetiring(null)} />}
    </>
  )
}

function RetireConfirm({ status, actor, onClose }: { status: SlotStatus; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
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
    <Overlay open onClose={onClose}>
      <div data-shot="admin-availability-status-retire" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Retire {status.label}?</div>
        <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px' }}>
          It leaves the choices and the legends. {carrying === 0 ? 'No session from today on carries it.' : `${carrying} ${carrying === 1 ? 'session' : 'sessions'} from today on ${carrying === 1 ? 'carries' : 'carry'} it. They keep it until changed.`} You can restore it later.
        </div>
        <div style={{ background: neutral.bg, borderRadius: radius.ctl, padding: 10 }}><StatusChip status={status.key} /></div>
        <FormError message={error} />
        <Button variant="primary" block onClick={retire}>Retire status</Button>
        <Button variant="secondary" block onClick={onClose}>Cancel</Button>
      </div>
    </Overlay>
  )
}
