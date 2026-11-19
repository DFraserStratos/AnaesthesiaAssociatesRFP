/**
 * The Booking as at a point in its history (catch-up Phase 35; US-02.5.5,
 * DM-35): a read-only reconstruction from the audit (`bookingAsAt`), Admin
 * only. Patient, List, time, each Procedure (its procedure text as received
 * by then, invoice description, RVG code, Contract and holder, payer) and the
 * notes. No money, and nothing from `officePrivate`. A Contract's settings
 * are its own audit's (18; no versions): the Contract is named as it stands,
 * and its History tab holds its changes.
 */

import { useMemo } from 'react'
import { useAppStore } from '../../store'
import { bookingAsAt } from '../../domain/bookingAsAt'
import { snapshotBooking } from '../../domain/changeSets'
import { inDisplayOrder } from '../../domain/billing/multiProcedure'
import { procedureLabel } from '../../domain/billing/procedureStack'
import { neutral, radius } from '../../theme/tokens'
import { DefList, DefRow } from '../ui'
import { Eyebrow } from '../ui/Eyebrow'
import { TextAction } from '../ui/TextAction'
import { dayHeading, hhmm } from '../format'
import { useToday } from '../../store'

function payerText(payer: unknown): string {
  if (payer === null || typeof payer !== 'object') return 'Payer: not billed yet'
  const p = payer as { kind?: string; name?: string }
  if (p.kind === 'patient') return 'The patient'
  return p.name ?? 'Another person'
}

export function BookingAsAtPanel({ bookingId, entryId, onClose }: { bookingId: string; entryId: string; onClose: () => void }) {
  const todayISO = useToday()
  const audit = useAppStore((s) => s.audit)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const result = useMemo(() => {
    const now = snapshotBooking({ schedule, masters }, bookingId)
    if (now === undefined) return undefined
    const procedureIds = new Set(Object.keys(now.procedures))
    for (const e of audit) if (e.entityType === 'procedure' && (e.before as { bookingId?: string } | undefined)?.bookingId === bookingId) procedureIds.add(e.entityId)
    const ids = new Set([bookingId, now.booking.patientId, ...procedureIds, ...Object.keys(now.billingLines)])
    const entries = audit.filter((e) => ids.has(e.entityId))
    return bookingAsAt(now, entries, { afterEntryId: entryId }, { modifiers: masters.modifiers })
  }, [audit, schedule, masters, bookingId, entryId])
  const cut = audit.find((e) => e.id === entryId)
  if (result === undefined || cut === undefined) return null
  const { snapshot, incompleteAt } = result
  const list = schedule.lists[snapshot.booking.listId]
  const procedures = inDisplayOrder(Object.values(snapshot.procedures).sort((a, b) => a.id.localeCompare(b.id)))
  const label = cut.action === 'booking.save' || cut.changeSetId !== undefined ? `after ${cut.who}'s ${cut.changeSetKind === 'save' || cut.action === 'booking.save' ? 'save' : 'change'}` : `after ${cut.who}'s change`
  return (
    <div data-shot="booking-as-at" style={{ display: 'flex', flexDirection: 'column', gap: 10, background: neutral.sunken, borderRadius: radius.card, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <strong style={{ fontSize: 14, flex: 1 }}>
          As at {dayHeading(cut.atISO.slice(0, 10), todayISO)} <span className="mono">{hhmm(cut.atISO)}</span>, {label}
        </strong>
        <TextAction size="sm" flush onClick={onClose}>
          Close
        </TextAction>
      </div>
      {incompleteAt !== undefined && <div style={{ fontSize: 12.5, color: neutral.mist }}>History before this point is incomplete ({incompleteAt.action}).</div>}
      <DefList>
        <DefRow label="Patient">{snapshot.patient?.name ?? 'Unknown'}</DefRow>
        {list !== undefined && (
          <DefRow label="List">
            {list.dateISO} · {list.session} · {masters.hospitals[list.hospitalId]?.name ?? list.hospitalId} · {masters.surgeons[list.surgeonId]?.name ?? list.surgeonId}
          </DefRow>
        )}
        <DefRow label="Time" mono>
          {snapshot.booking.scheduledTime ?? 'Not set'}
        </DefRow>
        <DefRow label="Notes">{snapshot.booking.notes ?? 'No notes.'}</DefRow>
        {snapshot.booking.cancellation !== undefined && <DefRow label="Cancelled">{snapshot.booking.cancellation.reason}</DefRow>}
      </DefList>
      {procedures.map((p, i) => {
        const contract = p.governingContractId !== undefined ? masters.contracts[p.governingContractId] : undefined
        const holder = contract !== undefined ? masters.parties[contract.holderId]?.name : undefined
        return (
          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Eyebrow>{procedures.length > 1 ? `Procedure ${i + 1}` : 'Procedure'}</Eyebrow>
            <DefList>
              <DefRow label="As received">{p.procedureText?.text ?? 'None received'}</DefRow>
              <DefRow label="Invoice description">{p.invoiceDescription?.text ?? 'Not set'}</DefRow>
              <DefRow label="RVG code">{p.rvgGroupId !== undefined ? procedureLabel(p, masters.rvgGroups, i + 1) : 'None'}</DefRow>
              <DefRow label="Contract">{contract !== undefined ? `${contract.name}${holder !== undefined ? ` · ${holder}` : ''}` : 'Needs a Contract'}</DefRow>
              <DefRow label="Paid by">{contract === undefined ? 'Payer: not billed yet' : payerText(p.payer)}</DefRow>
            </DefList>
          </div>
        )
      })}
    </div>
  )
}
