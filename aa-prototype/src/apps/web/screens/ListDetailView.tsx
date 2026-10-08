import { useMemo, useState } from 'react'
import { Check, ChevronLeft, Plus } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import { statusColours } from '../../../theme/statusColours'
import type { Booking, Procedure } from '../../../domain/types'
import { removeAttachment, useAppStore, type Actor } from '../../../store'
import { StatusChip, TickBadge, useListWarnings, WarningTriangle } from '../../../shared'
import { bookingFee } from '../../../shared/capture'
import { AddBookingFlow, SubmitListSheet } from '../../../shared/flows'
import { formatCurrency, sessionTimeRange } from '../../../shared/format'
import { Panel } from '../components'
import { AddAttachmentButton, AddAttachmentSheet, AttachmentStrip } from '../../../shared/attachments'

interface ListDetailViewProps {
  listId: string
  actor: Actor
  todayISO: string
  onBack: () => void
  onOpenBooking: (bookingId: string) => void
}

interface BookingRow {
  booking: Booking
  time: string
  patientName: string
  nhi: string
  operation: string
  extraProcedures: number
  units: number
  fee: number
}

/**
 * Web List detail (drill-down page; W2 / M6-M7 parity). Same guarded flows as
 * mobile — the shared `AddBookingFlow` (a dialog on web via the surface seam) and
 * the shared completion-gated `SubmitListSheet` — but a desktop screen rather
 * than the phone's stack of tappable cards: the page header and `Panel flush`
 * table of the neighbouring Lists screen, so drilling in never changes idiom.
 *
 * The width a desktop has buys columns the phone cannot afford: NHI, units and
 * fee per booking, and a totals row. Figures come from the Phase 01 calculator via
 * `bookingFee`, the same call the review screen and the completion overlay make.
 * Submitting is the page's primary action, top right, where every other web
 * screen puts one.
 */
export function ListDetailView({ listId, actor, todayISO, onBack, onOpenBooking }: ListDetailViewProps) {
  const list = useAppStore((s) => s.schedule.lists[listId])
  const bookingsRecord = useAppStore((s) => s.schedule.bookings)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const billingLinesRecord = useAppStore((s) => s.schedule.billingLines)
  const masters = useAppStore((s) => s.masters)
  const [addOpen, setAddOpen] = useState(false)
  const [attachOpen, setAttachOpen] = useState(false)
  const [submitSheet, setSubmitSheet] = useState<'none' | 'blockers' | 'confirm'>('none')

  const model = useMemo(() => {
    if (list === undefined) return undefined
    const procsByBooking = new Map<string, Procedure[]>()
    for (const p of Object.values(proceduresRecord)) {
      const bucket = procsByBooking.get(p.bookingId)
      if (bucket === undefined) procsByBooking.set(p.bookingId, [p])
      else bucket.push(p)
    }
    for (const bucket of procsByBooking.values()) bucket.sort((a, b) => a.id.localeCompare(b.id))

    const rows: BookingRow[] = Object.values(bookingsRecord)
      .filter((c) => c.listId === listId)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
      .map((booking) => {
        const procs = procsByBooking.get(booking.id) ?? []
        const totals = booking.cancellation === undefined ? bookingFee(procs, list, masters, billingLinesRecord) : { units: 0, total: 0 }
        return {
          booking,
          time: booking.scheduledTime ?? '·',
          patientName: masters.patients[booking.patientId]?.name ?? 'Unknown patient',
          nhi: masters.patients[booking.patientId]?.nhi ?? 'NHI pending',
          operation: procs[0]?.description || 'Procedure to capture',
          extraProcedures: Math.max(0, procs.length - 1),
          units: totals.units,
          fee: totals.total,
        }
      })

    const active = rows.filter((r) => r.booking.cancellation === undefined)
    return {
      rows,
      activeCount: active.length,
      done: active.filter((r) => r.booking.completed).length,
      units: active.reduce((n, r) => n + r.units, 0),
      fee: active.reduce((n, r) => n + r.fee, 0),
    }
  }, [list, listId, bookingsRecord, proceduresRecord, billingLinesRecord, masters])

  const warningsByBooking = useListWarnings(listId)

  if (list === undefined || model === undefined) return null

  const hospitalName = list.hospitalId !== undefined ? (masters.hospitals[list.hospitalId]?.name ?? 'Hospital') : 'AA rooms'
  const surgeon = list.surgeonId !== undefined ? masters.surgeons[list.surgeonId] : undefined
  const isPreop = list.statusKey === 'preop'
  const title = isPreop ? 'Pre-op assessment' : hospitalName
  const dayLabel = list.dateISO === todayISO ? 'Today' : list.dateISO
  const subline = [surgeon?.name, surgeon?.specialty, dayLabel, sessionTimeRange(list)]
    .filter((p): p is string => p !== undefined && p !== '')
    .join(' · ')
  const canEdit = list.state === 'ACTIVE'
  const listAttachments = list.attachments ?? []
  const incomplete = model.activeCount - model.done
  const pct = model.activeCount > 0 ? Math.round((model.done / model.activeCount) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
      >
        <ChevronLeft size={16} strokeWidth={2.4} aria-hidden /> Lists
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>
              {title} {list.session}
            </h1>
            <StatusChip status={list.statusKey} />
          </div>
          <div style={{ fontSize: 14, color: neutral.slate, marginTop: 4 }}>{subline}</div>
        </div>
        <SubmitAction
          state={list.state}
          incomplete={incomplete}
          onBlockers={() => setSubmitSheet('blockers')}
          onConfirm={() => setSubmitSheet('confirm')}
        />
      </div>

      <Panel
        flush
        title="Bookings"
        action={
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: neutral.slate, flex: 'none' }}>
              {model.done} of {model.activeCount} complete
            </span>
            <span style={{ width: 200, height: 6, borderRadius: 99, background: neutral.line, overflow: 'hidden', display: 'block' }}>
              <span style={{ display: 'block', height: '100%', borderRadius: 99, background: semantic.success.solid, transition: 'width 300ms cubic-bezier(0.2,0.8,0.2,1)', width: `${pct}%` }} />
            </span>
          </span>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${neutral.line}` }}>
                <Th>Time</Th>
                <Th>Patient</Th>
                <Th>Procedure</Th>
                <Th align="right">Units</Th>
                <Th align="right">Fee</Th>
                <Th align="right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {model.rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px 20px', textAlign: 'center', color: neutral.mist }}>
                    No bookings on this List yet.
                  </td>
                </tr>
              )}
              {model.rows.map((r) => {
                const cancelled = r.booking.cancellation !== undefined
                return (
                  <tr
                    key={r.booking.id}
                    onClick={() => onOpenBooking(r.booking.id)}
                    style={{ borderBottom: `1px solid ${neutral.sunken}`, cursor: 'pointer', opacity: cancelled ? 0.6 : 1 }}
                  >
                    <Td mono>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <span aria-hidden style={{ width: 3, height: 26, borderRadius: 99, background: statusColours[list.statusKey].solid, flex: 'none' }} />
                        {r.time}
                      </span>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, textDecoration: cancelled ? 'line-through' : 'none' }}>{r.patientName}</span>
                        <WarningTriangle warnings={warningsByBooking.get(r.booking.id) ?? []} size="sm" />
                      </div>
                      <div className="mono" style={{ fontSize: 11.5, color: neutral.mist, marginTop: 2 }}>{r.nhi}</div>
                    </Td>
                    <Td>
                      {r.operation}
                      {r.extraProcedures > 0 && (
                        <span style={{ color: neutral.mist }}> · +{r.extraProcedures} more</span>
                      )}
                    </Td>
                    <Td mono align="right">{cancelled ? '·' : r.units}</Td>
                    <Td mono align="right">{cancelled ? '·' : formatCurrency(r.fee)}</Td>
                    <Td align="right">
                      {cancelled ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: semantic.error.onTint }}>Cancelled</span>
                      ) : r.booking.completed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: semantic.success.onTint }}>
                          Complete <TickBadge size={26} />
                        </span>
                      ) : (
                        <span style={{ padding: '7px 14px', borderRadius: 999, background: accent.tint, fontSize: 13, fontWeight: 600, color: accent.pressed }}>
                          Capture
                        </span>
                      )}
                    </Td>
                  </tr>
                )
              })}
              {model.activeCount > 0 && (
                <tr style={{ background: neutral.bg }}>
                  <Td />
                  <Td>
                    <span style={{ fontWeight: 700 }}>Totals</span>
                  </Td>
                  <Td />
                  <Td mono align="right"><strong>{model.units}</strong></Td>
                  <Td mono align="right"><strong>{formatCurrency(model.fee)}</strong></Td>
                  <Td />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {canEdit && (
          <div style={{ padding: '0 20px 20px' }}>
            <button
              onClick={() => setAddOpen(true)}
              style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 16px', background: neutral.surface, border: `1.5px dashed ${neutral.lineStrong}`, borderRadius: radius.ctl, fontFamily: 'inherit', color: accent.base, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={17} strokeWidth={2.4} aria-hidden /> Add a booking
            </button>
          </div>
        )}
      </Panel>

      {/* List attachments (US-03.1.3): the web List detail's second panel, the
          Booking detail's panel pattern. Hidden when the List is locked and
          holds none. */}
      {(canEdit || listAttachments.length > 0) && (
        <div data-shot="list-attachments">
          <Panel title="List attachments" action={canEdit ? <AddAttachmentButton onClick={() => setAttachOpen(true)} /> : undefined}>
            <AttachmentStrip
              attachments={listAttachments}
              canRemove={canEdit}
              onRemove={(id) => removeAttachment(useAppStore, actor, { kind: 'list', id: listId }, id)}
              emptyText="No attachments on this List."
            />
          </Panel>
        </div>
      )}

      <AddAttachmentSheet open={attachOpen} target={{ kind: 'list', id: listId }} actor={actor} onClose={() => setAttachOpen(false)} />
      <AddBookingFlow open={addOpen} listId={listId} actor={actor} onClose={() => setAddOpen(false)} onCreated={() => undefined} />
      {submitSheet !== 'none' && (
        <SubmitListSheet open listId={listId} actor={actor} mode={submitSheet} onClose={() => setSubmitSheet('none')} onSubmitted={() => setSubmitSheet('none')} />
      )}
    </div>
  )
}

/**
 * The page's primary action, in the header slot the dashboard uses for "Offer
 * cover". Three states, all of them the same object: already submitted (a
 * static confirmation), blocked (the count of what is left, still clickable so
 * the blockers sheet can say which bookings), or ready.
 */
function SubmitAction({
  state,
  incomplete,
  onBlockers,
  onConfirm,
}: {
  state: string
  incomplete: number
  onBlockers: () => void
  onConfirm: () => void
}) {
  const shared = {
    height: 42,
    padding: '0 20px',
    borderRadius: 12,
    border: 'none',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  } as const

  if (state !== 'ACTIVE') {
    return (
      <span style={{ ...shared, background: semantic.success.tint, color: semantic.success.onTint }}>
        <Check size={16} strokeWidth={3} aria-hidden /> Submitted to office
      </span>
    )
  }
  if (incomplete > 0) {
    return (
      <button
        type="button"
        onClick={onBlockers}
        title="See what is left to finish"
        style={{ ...shared, background: neutral.surface, color: neutral.slate, border: `1px solid ${neutral.lineStrong}`, cursor: 'pointer' }}
      >
        {incomplete} to finish before submitting
      </button>
    )
  }
  return (
    <button type="button" onClick={onConfirm} style={{ ...shared, background: accent.base, color: neutral.surface, cursor: 'pointer' }}>
      Mark list completed
    </button>
  )
}

function Th({ children, align }: { children?: React.ReactNode; align?: 'right' }) {
  return (
    <th style={{ textAlign: align ?? 'left', padding: '12px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  )
}

function Td({ children, mono, align }: { children?: React.ReactNode; mono?: boolean; align?: 'right' }) {
  return (
    <td
      className={mono === true ? 'mono' : undefined}
      style={{ padding: '12px 20px', color: neutral.ink, verticalAlign: 'middle', textAlign: align ?? 'left', whiteSpace: 'nowrap' }}
    >
      {children}
    </td>
  )
}
