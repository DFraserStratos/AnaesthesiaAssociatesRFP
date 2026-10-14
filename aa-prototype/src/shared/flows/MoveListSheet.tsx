import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Building2, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import {
  markUnavailableAndMoveList,
  moveListToOffice,
  pushListToSlot,
  useAppStore,
  type Actor,
  type OwnMoveResult,
} from '../../store'
import { pushTargets, VACATED_SESSION_CHOICES, VACATED_SESSION_DEFAULT, type PushTarget } from '../../domain/listMoves'
import { isOpenForBooking, statusFor } from '../../domain/slotStatus'
import type { AssignedList, SlotStatusKey } from '../../domain/types'
import { drSurname, initialsOf, locationName } from '../format'
import { resolveDisplayStatus, useSlotStatusRecords } from '../status/useSlotStatuses'
import { Button, TextArea, TickBadge } from '../ui'
import { useSurface } from '../surface'
import { useMoveInput } from './useListMoves'

interface MoveListSheetProps {
  open: boolean
  actor: Actor
  listId: string
  /** A colleague's session chosen already (the availability view's gesture): the sheet opens on the confirm step. */
  toSlotId?: string
  /** US-01.5.5: she is marking this List's session with a closed status; the List must go first. */
  unavailable?: { statusKey: SlotStatusKey }
  /** A range or series of days off resolves one List per prompt: "1 of 2". */
  progress?: { index: number; total: number }
  onClose: () => void
  onMoved?: (result: OwnMoveResult) => void
}

type Step = 'where' | 'colleague' | 'confirm' | 'done'

/**
 * The anaesthetist moves one of her own Lists (catch-up Phase 32; US-01.4.3,
 * US-01.4.5, US-01.5.5), in the Mobile Availability sheet's anatomy: a bottom
 * sheet on mobile, a dialog on web (`useSurface().Overlay`, convention 16).
 *
 * Two choices, the same in both modes: "Return to the office" or "Hand on to a
 * colleague". The colleagues are the receive rule's `pushTargets`: one flat list
 * in surname order, by availability alone, never grouped, marked or ordered by
 * a preference or a tier, and the confirm step shows no warning of any kind
 * (US-01.4.5). It takes effect at once: nobody accepts or confirms (D7). It
 * never says "Draft List" or "slot".
 */
export function MoveListSheet({ open, actor, listId, toSlotId, unavailable, progress, onClose, onMoved }: MoveListSheetProps) {
  const { Overlay, variant } = useSurface()
  const statuses = useSlotStatusRecords()
  const liveList = useAppStore((s) => s.schedule.lists[listId])
  const input = useMoveInput()
  const { slots, anaesthetists } = input
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const bookings = useAppStore((s) => s.schedule.bookings)

  // Start where the props say, so "Move here" never flashes the first step.
  const [step, setStep] = useState<Step>(toSlotId !== undefined ? 'confirm' : 'where')
  const [route, setRoute] = useState<'office' | 'colleague'>(toSlotId !== undefined ? 'colleague' : 'office')
  const [targetSlotId, setTargetSlotId] = useState<string | undefined>(toSlotId)
  const [vacated, setVacated] = useState<SlotStatusKey>(VACATED_SESSION_DEFAULT)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  // What the header shows: the List as it was when the sheet opened (it moves on submit).
  const [snapshot, setSnapshot] = useState<AssignedList | undefined>(undefined)
  const [done, setDone] = useState<{ route: 'office' | 'colleague'; colleagueName?: string } | null>(null)

  useEffect(() => {
    if (!open) return
    const l = useAppStore.getState().schedule.lists[listId]
    setSnapshot(l !== undefined && l.state !== 'DRAFT' ? l : undefined)
    setRoute(toSlotId !== undefined ? 'colleague' : 'office')
    setTargetSlotId(toSlotId)
    setStep(toSlotId !== undefined ? 'confirm' : 'where')
    setVacated(VACATED_SESSION_DEFAULT)
    setMessage('')
    setError(null)
    setDone(null)
    // Re-initialise only when it opens on a new List or target.
  }, [open, listId, toSlotId])

  const list = snapshot ?? (liveList !== undefined && liveList.state !== 'DRAFT' ? liveList : undefined)

  const targets: PushTarget[] = useMemo(
    () => (step === 'done' ? [] : pushTargets(input, listId)),
    [input, listId, step],
  )

  if (list === undefined) return null

  const dayLine = `${format(parseISO(list.dateISO), 'EEE d MMM')} · ${list.session}`
  const hospital = locationName(list.hospitalId, hospitals)
  const surgeon = surgeons[list.surgeonId]?.name
  const bookingCount = Object.values(bookings).filter((b) => b.listId === list.id && b.cancellation === undefined).length
  const bookingWord = `${bookingCount} ${bookingCount === 1 ? 'Booking' : 'Bookings'}`
  const colleague = targetSlotId !== undefined ? anaesthetists[slots[targetSlotId]?.anaesthetistId ?? ''] : undefined
  const colleagueShort = colleague !== undefined ? drSurname(colleague.name) : 'Your colleague'

  // Her own session: a plain move offers Free (default) or Unavailable, unless it is already closed (a move never reopens it).
  const ownSlot = slots[list.slotId]
  const ownStatus = statusFor(statuses, ownSlot?.status)
  const ownAlreadyClosed = ownSlot !== undefined && !isOpenForBooking(ownStatus)
  const vacatedChoices = VACATED_SESSION_CHOICES.filter((k) => {
    const s = statusFor(statuses, k)
    return s !== undefined && s.retiredAtISO === undefined && s.anaesthetistCanSet
  })
  const unavailableLabel = unavailable !== undefined ? resolveDisplayStatus(unavailable.statusKey, statuses).label : ''

  function submit() {
    setError(null)
    const api = useAppStore
    const msg = message.trim() !== '' ? message : undefined
    let out
    if (unavailable !== undefined) {
      out = markUnavailableAndMoveList(
        api,
        actor,
        list!.slotId,
        unavailable.statusKey,
        route === 'colleague' && targetSlotId !== undefined ? { route: 'colleague', toSlotId: targetSlotId } : { route: 'office' },
        msg,
      )
    } else if (route === 'colleague' && targetSlotId !== undefined) {
      out = pushListToSlot(api, actor, list!.id, targetSlotId, { vacatedStatus: vacated, ...(msg !== undefined ? { message: msg } : {}) })
    } else {
      out = moveListToOffice(api, actor, list!.id, { vacatedStatus: vacated, ...(msg !== undefined ? { message: msg } : {}) })
    }
    if (!out.ok) {
      setError(out.message)
      return
    }
    setDone({ route, ...(colleague !== undefined ? { colleagueName: colleague.name } : {}) })
    setStep('done')
    onMoved?.(out.value)
  }

  const header = (
    <ListHeader
      title={surgeon !== undefined ? `${hospital} · ${surgeon}` : hospital}
      line={`${dayLine} · ${bookingWord}`}
      progress={progress}
    />
  )

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="move-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14, width: variant === 'web' ? 460 : undefined, maxWidth: '100%' }}>
        {step === 'where' && (
          <>
            {unavailable !== undefined && (
              <div data-shot="move-unavailable-line" style={{ fontSize: 13, lineHeight: '19px', color: neutral.ink, fontWeight: 600 }}>
                You are marking this session {unavailableLabel}. Its List needs someone else.
              </div>
            )}
            {header}
            <div data-shot="move-where" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ChoiceRow
                shot="move-choice-office"
                icon={<Building2 size={18} strokeWidth={2.2} aria-hidden />}
                title="Return to the office"
                line={unavailable === undefined ? 'The office will find someone for it. Its Bookings go with it. Use this to withdraw from the List.' : 'The office will find someone for it. Its Bookings go with it.'}
                onClick={() => {
                  setRoute('office')
                  setTargetSlotId(undefined)
                  setStep('confirm')
                }}
              />
              <ChoiceRow
                shot="move-choice-colleague"
                icon={<Users size={18} strokeWidth={2.2} aria-hidden />}
                title="Hand on to a colleague"
                line={targets.length === 0 ? 'No colleague is free in this session.' : `${targets.length} ${targets.length === 1 ? 'colleague is' : 'colleagues are'} free on ${dayLine}.`}
                disabled={targets.length === 0}
                onClick={() => {
                  setRoute('colleague')
                  setStep('colleague')
                }}
              />
            </div>
          </>
        )}

        {step === 'colleague' && (
          <>
            <BackLink onClick={() => setStep('where')}>Where it goes</BackLink>
            {header}
            <div style={{ fontSize: 13, color: neutral.slate }}>Free on {dayLine}</div>
            <ul data-shot="move-colleagues" aria-label={`Free on ${dayLine}`} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', border: `1px solid ${neutral.line}`, borderRadius: radius.card, overflow: 'hidden', maxHeight: variant === 'web' ? 360 : undefined, overflowY: 'auto' }}>
              {targets.length === 0 && <li style={{ padding: 14, fontSize: 13, color: neutral.slate }}>No colleague is free in this session.</li>}
              {targets.map((t, i) => (
                <li key={t.anaesthetistId} style={{ display: 'flex' }}>
                <button
                  type="button"
                  data-shot={`move-colleague-${t.anaesthetistId}`}
                  onClick={() => {
                    setTargetSlotId(t.slotId)
                    setStep('confirm')
                  }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', minHeight: 56, border: 'none', borderTop: i === 0 ? 'none' : `1px solid ${neutral.sunken}`, background: neutral.surface, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                >
                  <Initials name={t.name} />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{t.name}</span>
                    {t.phone !== '' && <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{t.phone}</span>}
                  </span>
                  <ChevronRight size={16} strokeWidth={2.2} color={neutral.mist} aria-hidden />
                </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {step === 'confirm' && (
          <div data-shot="move-confirm" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {toSlotId === undefined && <BackLink onClick={() => setStep(route === 'colleague' ? 'colleague' : 'where')}>{route === 'colleague' ? 'Who is free' : 'Where it goes'}</BackLink>}
            {route === 'colleague' && colleague !== undefined ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Initials name={colleague.name} size={44} />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{colleague.name}</span>
                  <span style={{ fontSize: 13, color: neutral.slate }}>{dayLine} · {targetSlotId !== undefined ? resolveDisplayStatus(slots[targetSlotId]?.status ?? '', statuses).label : ''} session</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span aria-hidden style={{ width: 44, height: 44, borderRadius: 999, background: neutral.sunken, color: neutral.slate, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Building2 size={20} strokeWidth={2.2} />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>Return to the office</span>
                  <span style={{ fontSize: 13, color: neutral.slate }}>{dayLine} · {hospital}</span>
                </div>
              </div>
            )}
            <div style={{ background: neutral.bg, borderRadius: radius.ctl, padding: 14, fontSize: 13, lineHeight: '19px', color: neutral.slate }}>
              {route === 'colleague'
                ? `${colleagueShort} gets your ${hospital} ${list.session} List and its ${bookingWord} straight away. There is no need for ${colleagueShort} or the office to accept.`
                : `Your ${hospital} ${list.session} List goes back to the office with its ${bookingWord}, and the office finds someone for it.`}
            </div>

            {unavailable !== undefined ? (
              <div style={{ fontSize: 13, color: neutral.ink }}>
                Your session: <strong>{resolveDisplayStatus(unavailable.statusKey, statuses).longLabel}</strong>
              </div>
            ) : ownAlreadyClosed ? (
              <div style={{ fontSize: 13, color: neutral.ink }}>
                Your session stays <strong>{ownStatus?.longLabel ?? ''}</strong>
              </div>
            ) : (
              <div data-shot="move-vacated" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>Your session after the move</span>
                <div role="radiogroup" aria-label="Your session after the move" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {vacatedChoices.map((k) => (
                    <StatusChoice key={k} statusKey={k} selected={vacated === k} onSelect={() => setVacated(k)} />
                  ))}
                </div>
                {/* OQ-84, open: the one provisional hint (VACATED_SESSION_DEFAULT). */}
                <span style={{ fontSize: 12, color: neutral.mist }}>Free unless you choose otherwise. What a session becomes after a move is still being confirmed with AA.</span>
              </div>
            )}

            <TextArea label="Add a message" value={message} onChange={setMessage} placeholder={route === 'colleague' ? `Optional note for ${colleagueShort} and the office` : 'Optional note for the office'} />
            {error !== null && (
              <div role="alert" style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
                {error}
              </div>
            )}
            <span data-shot="move-submit" style={{ display: 'contents' }}>
              <Button variant="primary" block onClick={submit}>
                Move List
              </Button>
            </span>
          </div>
        )}

        {step === 'done' && done !== null && (
          <div data-shot="move-done" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0 8px' }}>
            <TickBadge size={72} animate />
            <div style={{ fontSize: 18, fontWeight: 700, color: semantic.success.onTint }}>
              {done.route === 'office' ? 'Returned to the office' : `Moved to ${drSurname(done.colleagueName ?? '')}`}
            </div>
            <div style={{ fontSize: 13, color: neutral.slate, textAlign: 'center', lineHeight: '19px' }}>
              {done.route === 'office'
                ? 'The office can see it in its notifications.'
                : `${drSurname(done.colleagueName ?? '')} and the office can see it now.`}
            </div>
            <Button variant="secondary" block onClick={onClose} style={{ marginTop: 4 }}>
              Done
            </Button>
          </div>
        )}
      </div>
    </Overlay>
  )
}

function ListHeader({ title, line, progress }: { title: string; line: string; progress?: { index: number; total: number } }) {
  return (
    <div data-shot="move-list-header" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {progress !== undefined && progress.total > 1 && (
        <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: neutral.mist }}>
          {progress.index} of {progress.total}
        </span>
      )}
      <span style={{ fontSize: 18, fontWeight: 700, color: neutral.ink }}>Move your List</span>
      <span style={{ fontSize: 14, color: neutral.ink }}>{title}</span>
      <span style={{ fontSize: 13, color: neutral.slate }}>{line}</span>
    </div>
  )
}

function ChoiceRow({ icon, title, line, onClick, disabled = false, shot }: { icon: React.ReactNode; title: string; line: string; onClick: () => void; disabled?: boolean; shot: string }) {
  return (
    <button
      type="button"
      data-shot={shot}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        minHeight: 64,
        borderRadius: radius.card,
        border: `1px solid ${neutral.line}`,
        background: neutral.surface,
        fontFamily: 'inherit',
        textAlign: 'left',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span aria-hidden style={{ width: 36, height: 36, borderRadius: 999, background: neutral.sunken, color: neutral.slate, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{title}</span>
        <span style={{ fontSize: 12.5, lineHeight: '17px', color: neutral.slate }}>{line}</span>
      </span>
      {!disabled && <ChevronRight size={16} strokeWidth={2.2} color={neutral.mist} aria-hidden />}
    </button>
  )
}

function BackLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 2, border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
      <ChevronLeft size={15} strokeWidth={2.4} aria-hidden /> {children}
    </button>
  )
}

/** A colleague's initials in a neutral disc (no tint that could read as a mark). */
function Initials({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span aria-hidden style={{ width: size, height: size, borderRadius: 999, background: neutral.sunken, color: neutral.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size > 40 ? 14 : 12, fontWeight: 700, flex: 'none' }}>
      {initialsOf(name)}
    </span>
  )
}

/** A vacated-session status choice: the master's swatch and label (by fixed id), teal ring when chosen. */
function StatusChoice({ statusKey, selected, onSelect }: { statusKey: SlotStatusKey; selected: boolean; onSelect: () => void }) {
  const statuses = useSlotStatusRecords()
  const r = resolveDisplayStatus(statusKey, statuses)
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-shot={`move-vacated-${statusKey}`}
      onClick={onSelect}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 40,
        padding: '0 14px',
        borderRadius: 999,
        border: selected ? `2px solid ${accent.base}` : `1px solid ${neutral.line}`,
        background: selected ? accent.tint : neutral.surface,
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        color: neutral.ink,
        cursor: 'pointer',
      }}
    >
      <span aria-hidden style={{ width: 12, height: 12, borderRadius: 4, background: r.visual.blockBackground, border: r.visual.border ?? `1px solid ${r.visual.solid}` }} />
      {r.label}
    </button>
  )
}
