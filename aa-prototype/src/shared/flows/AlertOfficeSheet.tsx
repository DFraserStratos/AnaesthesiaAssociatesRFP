import { useEffect, useState, type CSSProperties } from 'react'
import { format, parseISO } from 'date-fns'
import { BellRing, CheckCircle2 } from 'lucide-react'
import { neutral, radius, semantic } from '../../theme/tokens'
import { alertOffice, activeAlertFor, latestAlertFor, officeAlertRefusal, OFFICE_ALERT_NOTE_MAX, resolveNotification, useAppStore, type Actor } from '../../store'
import { Button, FormError, TextArea, TickButton } from '../ui'
import { DoneStep } from '../ui/DoneStep'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { useSurface } from '../surface'
import { drSurname } from '../format'
import { sessionText } from '../../domain/outOfHours'

type Target = { listId: string; bookingId?: string }

const whenLabel = (iso: string) => format(parseISO(iso), 'EEE d MMM, HH:mm')

/**
 * "Alert the office" (catch-up Phase 32b; US-03.6.3): the anaesthetist asks the
 * office to check one of her Lists or Bookings, with a note. One entry for both
 * anaesthetist apps (the Booking's action stack, the List's actions), owner
 * only, in three states:
 * - nothing open: the "Alert the office" button and a one-line why;
 * - an open alert: "The office has been alerted", the note and when, no button
 *   (one active alert per target);
 * - ticked by the office: "The office has dealt with this", and the button to
 *   ask again.
 * It never says "flag", "Draft List" or "slot", and it changes nothing about
 * submitting: whether an alerted Booking may be submitted is undecided, so the
 * app says nothing about it.
 */
export function AlertOfficeEntry({
  actor,
  target,
  compact = false,
  statusOnly = false,
  style,
}: {
  actor: Actor
  target: Target
  compact?: boolean
  /** Show the open or dealt-with status only; the caller offers the action elsewhere (the mobile List's options sheet). */
  statusOnly?: boolean
  /** Extra style on the entry's root (spacing from its neighbours; nothing renders when there is nothing to show). */
  style?: CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const active = useAppStore((s) => activeAlertFor(s, target))
  const latest = useAppStore((s) => latestAlertFor(s, target))
  // A string, so the selector stays stable between renders.
  const refusal = useAppStore((s) => officeAlertRefusal(s, actor, target)?.code ?? null)
  const canAlert = refusal === null
  const isOwner = refusal === null || refusal === 'alreadyAlerted' || (refusal === 'listAuthorised' && latest !== undefined)
  if (!isOwner) return null
  if (statusOnly && active === undefined && latest?.resolvedAt === undefined) return null
  const what = target.bookingId !== undefined ? 'Booking' : 'List'

  return (
    <div data-shot={`alert-office-${target.bookingId !== undefined ? 'booking' : 'list'}`} style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {active !== undefined ? (
        <div data-shot="alert-office-sent" role="status" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '12px 14px' }}>
          <BellRing size={16} aria-hidden style={{ color: neutral.slate, flex: 'none', marginTop: 2 }} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: neutral.ink }}>The office has been alerted</span>
            {active.message !== undefined && <span style={{ fontSize: 13, lineHeight: '18px', color: neutral.slate }}>"{active.message}"</span>}
            <span style={{ fontSize: 11.5, color: neutral.mist }}>{whenLabel(active.atISO)} · It stays with the office until someone there deals with it.</span>
          </span>
        </div>
      ) : (
        latest?.resolvedAt !== undefined && (
          <div data-shot="alert-office-resolved" role="status" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: semantic.success.tint, borderRadius: radius.card, padding: '12px 14px' }}>
            <CheckCircle2 size={16} aria-hidden style={{ color: semantic.success.onTint, flex: 'none', marginTop: 2 }} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: semantic.success.onTint }}>The office has dealt with this</span>
              {latest.message !== undefined && <span style={{ fontSize: 13, lineHeight: '18px', color: semantic.success.onTint }}>Your note: "{latest.message}"</span>}
              <span style={{ fontSize: 11.5, color: semantic.success.onTint }}>{whenLabel(latest.resolvedAt)}</span>
            </span>
          </div>
        )
      )}
      {canAlert && !statusOnly && (
        <div data-shot="alert-office-action" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Button variant="secondary" block={!compact} onClick={() => setOpen(true)}>
            <BellRing size={16} aria-hidden /> Alert the office
          </Button>
          {!compact && (
            <span style={{ fontSize: 12, lineHeight: '17px', color: neutral.slate }}>
              Unsure about this {what}? Ask the office to check it, with a note.
            </span>
          )}
        </div>
      )}
      {open && <AlertOfficeSheet open={open} actor={actor} target={target} onClose={() => setOpen(false)} />}
    </div>
  )
}

/** The note sheet: a bottom sheet on mobile, a dialog on web (`useSurface().Overlay`). */
export function AlertOfficeSheet({ open, actor, target, onClose }: { open: boolean; actor: Actor; target: Target; onClose: () => void }) {
  const { Overlay, variant } = useSurface()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const list = useAppStore((s) => s.schedule.lists[target.listId])
  const hospital = useAppStore((s) => (list !== undefined ? s.masters.hospitals[list.hospitalId]?.name : undefined))
  const patient = useAppStore((s) => {
    const b = target.bookingId !== undefined ? s.schedule.bookings[target.bookingId] : undefined
    return b !== undefined ? s.masters.patients[b.patientId]?.name : undefined
  })

  useEffect(() => {
    if (!open) return
    setNote('')
    setError(null)
    setSent(false)
  }, [open])

  if (list === undefined) return null
  const what = target.bookingId !== undefined ? 'Booking' : 'List'
  const line = [patient, `${format(parseISO(list.dateISO), 'EEE d MMM')} ${sessionText(list.session)}`, hospital].filter((x): x is string => x !== undefined).join(' · ')
  const trimmed = note.trim().length

  function send() {
    const out = alertOffice(useAppStore, actor, { ...target, note })
    if (!out.ok) {
      setError(out.message)
      return
    }
    setSent(true)
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="alert-office-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14, width: variant === 'web' ? 440 : undefined, maxWidth: '100%' }}>
        {!sent ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <OverlayHeader title="Alert the office" description={<>{what} · {line}</>} />
            </div>
            <div style={{ fontSize: 13, lineHeight: '19px', color: neutral.slate }}>
              The office sees your note in its notifications and checks this {what}. It stays there until someone in the office deals with it.
            </div>
            <span data-shot="alert-office-note" style={{ display: 'contents' }}>
              <TextArea label="Note for the office" value={note} onChange={(v) => { setNote(v); setError(null) }} placeholder="What would you like checked?" />
            </span>
            <span className="mono" style={{ alignSelf: 'flex-end', marginTop: -8, fontSize: 11.5, color: trimmed > OFFICE_ALERT_NOTE_MAX ? semantic.error.onTint : neutral.mist, fontVariantNumeric: 'tabular-nums' }}>
              {trimmed}/{OFFICE_ALERT_NOTE_MAX}
            </span>
            <FormError message={error} />
            <SheetActions
              primary={
                <span data-shot="alert-office-send" style={{ display: 'contents' }}>
                  <Button variant="primary" block disabled={trimmed === 0 || trimmed > OFFICE_ALERT_NOTE_MAX} onClick={send}>
                    Send to the office
                  </Button>
                </span>
              }
            />
          </>
        ) : (
          <DoneStep
            shot="alert-office-done"
            title="The office has been alerted"
            detail="It shows in the office's notifications with your note."
            action={
              <Button variant="secondary" block onClick={onClose}>
                Done
              </Button>
            }
          />
        )}
      </div>
    </Overlay>
  )
}

/**
 * The office's view of an open alert, where it works (catch-up Phase 32b;
 * US-03.6.3, US-13.8.3): "Alert from Dr Souter" with the note, on the Admin
 * List drawer and Booking detail, with the same tick as the pool (resolving it
 * here resolves the notice for every admin). Phase 21a adds it to review.
 */
export function OfficeAlertLine({ actor, target }: { actor: Actor; target: Target }) {
  const active = useAppStore((s) => activeAlertFor(s, target))
  const from = useAppStore((s) => (active !== undefined ? s.masters.anaesthetists[active.fromAnaesthetistId]?.name : undefined))
  const [error, setError] = useState<string | null>(null)
  if (active === undefined || actor.role !== 'office') return null
  const who = from !== undefined ? drSurname(from) : 'the anaesthetist'
  return (
    <div data-shot="office-alert-line" role="status" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '12px 14px' }}>
      <BellRing size={16} aria-hidden style={{ color: neutral.slate, flex: 'none', marginTop: 2 }} />
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: neutral.ink }}>Alert from {who}</span>
        {active.message !== undefined && <span style={{ fontSize: 13, lineHeight: '18px', color: neutral.slate }}>"{active.message}"</span>}
        <span style={{ fontSize: 11.5, color: neutral.mist }}>{whenLabel(active.atISO)}</span>
        {error !== null && <span role="alert" style={{ fontSize: 12, color: semantic.error.onTint }}>{error}</span>}
      </span>
      <TickButton
        compact
        shot="office-alert-tick"
        label={`Resolve alert from ${who}`}
        onClick={() => {
          const out = resolveNotification(useAppStore, actor, active.id)
          setError(out.ok ? null : out.message)
        }}
      >
        Resolve
      </TickButton>
    </div>
  )
}
