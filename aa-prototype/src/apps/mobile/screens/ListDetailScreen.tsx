import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeftRight, BellRing, Lock, MoreHorizontal } from 'lucide-react'
import { accent, elevation, neutral, radius, semantic, surface } from '../../../theme/tokens'
import { motion } from '../../../theme/motion'
import { BackLink } from '../../../shared/ui/BackLink'
import { ProgressBar } from '../../../shared/ui/ProgressBar'
import type { Booking, Procedure } from '../../../domain/types'
import { isAssignedList } from '../../../domain/draftLists'
import { bookingContractCue, editRefusal, officeAlertRefusal, useAppStore, useToday, type Actor, useListTimes } from '../../../store'
import { DockSpacer, StatusChip, useListWarnings, WarningTriangle } from '../../../shared'
import { SuccessOverlay } from '../../../shared/ui/SuccessOverlay'
import { AddRowButton } from '../../../shared/ui/AddRowButton'
import { ListOptionsSheet, TickBadge, type ListOption } from '../components'
import { ListInvoices, useListInvoices } from '../../../shared/schedule'
import { LIST_PROGRESS_LABEL, listProgress } from '../../../domain/listProgress'
import { AlertOfficeEntry, AlertOfficeSheet, SubmitListSheet, movedToYouByLine, useIsMovable, useMovedToMeNotice, useMoveListPrompt } from '../../../shared/flows'
import { slotTimeRange, locationName, dayWithYear } from '../../../shared/format'
import { procedureLabel } from '../../../domain/billing/procedureStack'
import { sessionText } from '../../../domain/outOfHours'
import { surgeonSpecialtyLabel } from '../../../domain/specialties'

interface ListDetailScreenProps {
  listId: string
  actor: Actor
  onBack: () => void
  onOpenBooking: (bookingId: string) => void
  onAddBooking: () => void
}

interface BookingRow {
  booking: Booking
  time: string
  patientName: string
  nhi: string | undefined
  procedure: string
  cue: string | undefined
}

export function ListDetailScreen({ listId, actor, onBack, onOpenBooking, onAddBooking }: ListDetailScreenProps) {
  const list = useAppStore((s) => s.schedule.lists[listId])
  const times = useListTimes(list)
  const bookingsRecord = useAppStore((s) => s.schedule.bookings)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const patients = useAppStore((s) => s.masters.patients)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const specialties = useAppStore((s) => s.masters.specialties)
  const todayISO = useToday()
  // Catch-up Phase 32: her own move, and the notice when a colleague moved it to her.
  const movable = useIsMovable(listId, actor.anaesthetistId)
  const movePrompt = useMoveListPrompt()
  const moved = useMovedToMeNotice(listId, actor.anaesthetistId)
  // Alert the office (catch-up Phase 32b): a string, so the selector stays stable between renders.
  const alertRefusal = useAppStore((s) => officeAlertRefusal(s, actor, { listId })?.code ?? null)
  const [sheet, setSheet] = useState<'none' | 'blockers' | 'confirm' | 'options' | 'alert'>('none')
  const [showSubmitted, setShowSubmitted] = useState(false)

  useEffect(() => {
    if (!showSubmitted) return undefined
    const timer = window.setTimeout(() => setShowSubmitted(false), 1050)
    return () => window.clearTimeout(timer)
  }, [showSubmitted])

  // Tick choreography: rows completed AFTER this screen last showed the list
  // animate their tick in (the mockup's tick-pop); rows already done render
  // still. The set resets when the screen moves to a different list.
  const initialCompleted = useRef<Set<string> | null>(null)
  const seenListId = useRef(listId)
  if (seenListId.current !== listId) {
    seenListId.current = listId
    initialCompleted.current = null
  }
  if (initialCompleted.current === null) {
    initialCompleted.current = new Set(
      Object.values(bookingsRecord)
        .filter((c) => c.listId === listId && c.completed)
        .map((c) => c.id),
    )
  }

  // The cue's reads (catch-up Phase 20): the whole state, so the memo re-runs when they change.
  const cueState = useAppStore((s) => s)
  const model = useMemo(() => {
    if (list === undefined) return undefined
    // The row's operation is the Booking's primary Procedure (catch-up Phase 23).
    const firstProcByBooking = new Map<string, Procedure>()
    for (const p of Object.values(proceduresRecord)) {
      if (p.isPrimary) firstProcByBooking.set(p.bookingId, p)
    }
    const rows: BookingRow[] = Object.values(bookingsRecord)
      .filter((c) => c.listId === listId)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
      .map((booking) => {
        const patient = patients[booking.patientId]
        return {
          booking,
          time: booking.scheduledTime ?? '·',
          patientName: patient?.name ?? 'Unknown patient',
          nhi: patient?.nhi,
          procedure: (() => {
            const first = firstProcByBooking.get(booking.id)
            return first !== undefined ? procedureLabel(first, cueState.masters.rvgGroups, 1) : 'Procedure to capture'
          })(),
          // "Needs an invoice destination" or "RVG code to fill in" (catch-up Phase 20).
          cue: booking.cancellation === undefined ? bookingContractCue(cueState, booking.id) : undefined,
        }
      })
    const active = rows.filter((r) => r.booking.cancellation === undefined)
    const done = active.filter((r) => r.booking.completed).length
    return { rows, activeCount: active.length, done }
  }, [list, listId, bookingsRecord, proceduresRecord, patients, cueState])

  const warningsByBooking = useListWarnings(listId)
  // An authorised List is read only and shows its invoices (catch-up Phase 38a).
  const invoices = useListInvoices(listId)

  // A Draft List is office only (OQ-86): nothing to show an anaesthetist.
  if (!isAssignedList(list) || model === undefined) return null

  const hospitalName = locationName(list.hospitalId, hospitals)
  const surgeon = surgeons[list.surgeonId]
  const isPreop = list.kind === 'preop'
  const title = isPreop ? 'Pre-op assessment' : hospitalName
  const dayLabel = list.dateISO === todayISO ? 'Today' : dayWithYear(list.dateISO)
  const authorised = list.state === 'AUTHORISED'
  const sublineParts = [
    surgeon?.name,
    surgeonSpecialtyLabel({ specialties }, surgeon),
    dayLabel,
    times !== undefined ? slotTimeRange(times) : undefined,
  ].filter((p): p is string => p !== undefined && p !== '')
  // The ⋯ List options: the secondary things she can do with her own List, kept
  // out of the header so it holds the List itself. New options join as rows.
  const listOptions: ListOption[] = []
  if (movable && movePrompt !== null) {
    listOptions.push({
      key: 'move',
      shot: 'list-move',
      icon: <ArrowLeftRight size={18} strokeWidth={2.2} />,
      label: 'Move this List',
      hint: 'Give it to a colleague or back to the office',
      onSelect: () => {
        setSheet('none')
        movePrompt.openMove(listId)
      },
    })
  }
  if (alertRefusal === null || alertRefusal === 'alreadyAlerted') {
    const already = alertRefusal === 'alreadyAlerted'
    listOptions.push({
      key: 'alert',
      shot: 'list-alert-office',
      icon: <BellRing size={18} strokeWidth={2.2} />,
      label: already ? 'The office has been alerted' : 'Alert the office',
      hint: already ? 'It stays with the office until someone there deals with it' : 'Ask the office to check this List, with a note',
      disabled: already,
      onSelect: () => setSheet('alert'),
    })
  }
  // ACTIVE or SUBMITTED, own List: editable until the office authorises it (catch-up Phase 38a).
  const canEdit = editRefusal(actor, list) === null
  const incomplete = model.activeCount - model.done

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Host inset + 6px: a drill-in screen leads with a 44px back button, so
          it needs less air than a tab screen's large title. */}
      <div data-testid="mobile-list-header" style={{ padding: 'calc(var(--aa-inset-top, 54px) + 6px) 20px 14px', flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <BackLink size="touch" onClick={onBack}>
          Lists
        </BackLink>
        {listOptions.length > 0 && (
          <button
            type="button"
            data-shot="list-options"
            aria-label="List options"
            aria-haspopup="menu"
            aria-expanded={sheet === 'options'}
            onClick={() => setSheet('options')}
            style={{
              width: 44,
              height: 44,
              marginRight: -10,
              display: 'grid',
              placeItems: 'center',
              border: 'none',
              borderRadius: radius.pill,
              background: sheet === 'options' ? accent.tint : 'none',
              color: accent.base,
              cursor: 'pointer',
            }}
          >
            <MoreHorizontal size={22} strokeWidth={2.4} aria-hidden />
          </button>
        )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>
              {title} {sessionText(list.session)}
            </div>
            <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4 }}>{sublineParts.join(' · ')}</div>
          </div>
          <StatusChip status={list.kind} style={{ marginTop: 4, flex: 'none' }} />
        </div>
        {moved !== undefined && (
          <div data-shot="list-moved-to-you" style={{ fontSize: 12.5, color: neutral.slate, marginTop: 8 }}>
            {movedToYouByLine(moved.atISO, moved.fromName)}
          </div>
        )}

        {/* An open or dealt-with office alert is status, so it stays in view; the action is in List options. */}
        <AlertOfficeEntry actor={actor} target={{ listId }} compact statusOnly style={{ marginTop: 10 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 4px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: neutral.slate, flex: 'none' }}>
            {model.done} of {model.activeCount} complete
          </span>
          <ProgressBar done={model.done} total={model.activeCount} width="fill" />
        </div>
      </div>

      {/* Clearance for the submit footer below (which tracks the inset 1:1) is
          a `DockSpacer` at the tail, NOT padding here. See that component: this
          screen is where trailing padding was found to create no scroll extent
          on WebKit, stranding "Add a booking" under the dock. */}
      <div data-testid="mobile-list-scroll" style={{ flex: 1, overflow: 'auto', padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {model.rows.map((r) => {
          const cancelled = r.booking.cancellation !== undefined
          return (
            <button
              key={r.booking.id}
              onClick={() => onOpenBooking(r.booking.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: neutral.surface,
                border: `1px solid ${neutral.line}`,
                borderRadius: radius.card,
                fontFamily: 'inherit',
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                opacity: cancelled ? 0.6 : 1,
              }}
            >
              <span className="mono" style={{ width: 44, flex: 'none', fontSize: 12, fontWeight: 600, color: neutral.mist }}>
                {r.time}
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span
                    data-aa-selectable
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      textDecoration: cancelled ? 'line-through' : 'none',
                    }}
                  >
                    {r.patientName}
                  </span>
                  <WarningTriangle warnings={warningsByBooking.get(r.booking.id) ?? []} size="sm" />
                </span>
                {r.nhi !== undefined && (
                  <span className="mono" style={{ fontSize: 11, color: neutral.mist }}>
                    {r.nhi}
                  </span>
                )}
                <span style={{ fontSize: 13, color: neutral.slate }}>{r.procedure}</span>
                {r.cue !== undefined && (
                  <span data-shot="list-row-contract-cue" style={{ fontSize: 11.5, color: neutral.slate }}>{r.cue}</span>
                )}
              </span>
              {cancelled ? (
                <span style={{ fontSize: 11, fontWeight: 600, color: semantic.error.onTint, flex: 'none' }}>Cancelled</span>
              ) : r.booking.completed ? (
                <TickBadge size={28} animate={!(initialCompleted.current?.has(r.booking.id) ?? false)} />
              ) : (
                <span
                  style={{
                    padding: '9px 16px',
                    borderRadius: radius.pill,
                    background: accent.tint,
                    fontSize: 13,
                    fontWeight: 600,
                    color: accent.pressed,
                    flex: 'none',
                  }}
                >
                  Capture
                </span>
              )}
            </button>
          )
        })}

        {authorised && (
          <section
            aria-label="Invoices"
            style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>Invoices</span>
            <ListInvoices rows={invoices} />
          </section>
        )}

        {canEdit && <AddRowButton size="touch" onClick={onAddBooking}>Add a booking</AddRowButton>}
        {/* 96 - 10 for the column gap, so the reserved space is unchanged. */}
        <DockSpacer height="calc(var(--aa-inset-bottom, 34px) + 86px)" />
      </div>

      {/* Sticky submit footer — the mockup's disabled → enabled → submitted
          walk. Completion-gated at the store; the greyed bar stays TAPPABLE
          and opens the explanatory sheet naming the offenders. */}
      <div
        data-testid="mobile-list-footer"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: 14,
          paddingLeft: 20,
          paddingRight: 20,
          // Matches the booking dock: inset - 2, floored at the footer's own top pad.
          paddingBottom: 'max(calc(var(--aa-inset-bottom, 34px) - 2px), 14px)',
          background: surface.frosted,
          backdropFilter: 'blur(14px)',
          borderTop: `1px solid ${neutral.line}`,
        }}
      >
        {authorised ? (
          <div
            data-shot="list-authorised-status"
            style={{ height: 54, borderRadius: radius.card, background: neutral.sunken, color: neutral.slate, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 700 }}
          >
            <Lock size={17} strokeWidth={2.4} aria-hidden />
            {LIST_PROGRESS_LABEL[listProgress(list, [], todayISO)]} · read only
          </div>
        ) : list.state !== 'ACTIVE' ? (
          <div
            style={{
              height: 54,
              borderRadius: radius.card,
              background: semantic.success.solid,
              color: neutral.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 17,
              fontWeight: 700,
              animation: `aa-tick-pop 340ms ${motion.completeTick.easing}`,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M2.5 7.5 L5.5 10.5 L11.5 3.5"
                fill="none"
                stroke={neutral.surface}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Submitted to office
          </div>
        ) : incomplete > 0 ? (
          <button
            type="button"
            onClick={() => setSheet('blockers')}
            style={{
              height: 54,
              width: '100%',
              borderRadius: radius.card,
              border: 'none',
              background: neutral.line,
              color: neutral.mist,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 600,
              textAlign: 'center',
              lineHeight: '18px',
              cursor: 'pointer',
            }}
          >
            <span>Mark list completed · {incomplete} to finish</span>
            <span style={{ fontSize: 11, fontWeight: 500 }}>Tap to see what is left</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSheet('confirm')}
            style={{
              height: 54,
              width: '100%',
              borderRadius: radius.card,
              border: 'none',
              background: accent.base,
              color: neutral.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit',
              fontSize: 17,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: elevation.e2,
            }}
          >
            Mark list completed
          </button>
        )}
      </div>

      <ListOptionsSheet
        open={sheet === 'options'}
        title={`${title} ${sessionText(list.session)}`}
        subtitle={sublineParts.slice(2).join(' · ')}
        options={listOptions}
        onClose={() => setSheet('none')}
      />
      {sheet === 'alert' && <AlertOfficeSheet open actor={actor} target={{ listId }} onClose={() => setSheet('none')} />}
      {(sheet === 'blockers' || sheet === 'confirm') && (
        <SubmitListSheet
          open
          listId={listId}
          actor={actor}
          mode={sheet}
          onClose={() => setSheet('none')}
          onSubmitted={() => {
            setSheet('none')
            setShowSubmitted(true)
          }}
        />
      )}

      {showSubmitted ? (
        <SuccessOverlay
          title="List submitted"
          testId="list-submission-overlay"
          // The same thing the 1050ms timer does. A full-surface blocker with
          // no dismiss is unrecoverable in a standalone PWA, where there is no
          // reload affordance, if the timer is ever lost to an unmount race.
          onDismiss={() => setShowSubmitted(false)}
        >
          <div style={{ fontSize: 14, color: neutral.slate }}>Sent to the office for review</div>
        </SuccessOverlay>
      ) : null}
    </div>
  )
}
