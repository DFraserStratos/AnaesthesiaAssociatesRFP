import { useEffect, useMemo, useState } from 'react'
import { Building2, ChevronRight, Users } from 'lucide-react'
import { neutral, radius } from '../../theme/tokens'
import {
  markUnavailableAndMoveList,
  moveListToOffice,
  pushListToSlot,
  useAppStore,
  type Actor,
  type OwnMoveResult,
} from '../../store'
import { defaultVacated, pushTargets, type PushTarget } from '../../domain/listMoves'
import type { AssignedList, SlotStatusKey } from '../../domain/types'
import { drSurname, locationName, matchesNameQuery, plural, shortDay } from '../format'
import { resolveDisplayStatus, useSlotStatusRecords } from '../status/useSlotStatuses'
import { BackLink, Button, NameSearchBox, TextArea, FormError } from '../ui'
import { DoneStep } from '../ui/DoneStep'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { useSurface } from '../surface'
import { useMoveInput } from './useListMoves'
import { ChoiceRow } from './moveSheetParts'
import { Avatar } from '../Avatar'
import { VacatedSessionChoice } from './VacatedSessionChoice'
import { sessionText } from '../../domain/outOfHours'

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
 * never says "Draft List" or "slot". Every confirm, the unavailable prompt
 * included, asks what her session becomes (`VacatedSessionChoice`; D60,
 * catch-up Phase 32b).
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
  const [vacated, setVacated] = useState<SlotStatusKey>(defaultVacated(unavailable?.statusKey))
  const [message, setMessage] = useState('')
  /** The shared type-ahead (Phase 32a, US-01.4.2): narrows the free colleagues by name, never reorders them. */
  const [query, setQuery] = useState('')
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
    setVacated(defaultVacated(unavailable?.statusKey))
    setMessage('')
    setQuery('')
    setError(null)
    setDone(null)
    // Re-initialise only when it opens on a new List or target.
  }, [open, listId, toSlotId, unavailable?.statusKey])

  const list = snapshot ?? (liveList !== undefined && liveList.state !== 'DRAFT' ? liveList : undefined)

  const targets: PushTarget[] = useMemo(
    () => (step === 'done' ? [] : pushTargets(input, listId)),
    [input, listId, step],
  )
  const shownTargets = targets.filter((t) => matchesNameQuery(t.name, query))

  if (list === undefined) return null

  const dayLine = `${shortDay(list.dateISO)} · ${sessionText(list.session)}`
  const hospital = locationName(list.hospitalId, hospitals)
  const surgeon = surgeons[list.surgeonId]?.name
  const bookingCount = Object.values(bookings).filter((b) => b.listId === list.id && b.cancellation === undefined).length
  const bookingWord = plural(bookingCount, 'Booking')
  const colleague = targetSlotId !== undefined ? anaesthetists[slots[targetSlotId]?.anaesthetistId ?? ''] : undefined
  const colleagueShort = colleague !== undefined ? drSurname(colleague.name) : 'Your colleague'

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
        { vacatedStatus: vacated, ...(msg !== undefined ? { message: msg } : {}) },
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
                line={targets.length === 0 ? 'No colleague is free in this session.' : `${plural(targets.length, 'colleague is', 'colleagues are')} free on ${dayLine}.`}
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
            <BackLink size="step" onClick={() => setStep('where')}>Where it goes</BackLink>
            {header}
            <NameSearchBox value={query} onChange={setQuery} label="Find a colleague" placeholder="Type a name" shot="move-search" fill="well" />
            <div style={{ fontSize: 13, color: neutral.slate }}>Free on {dayLine}</div>
            <ul data-shot="move-colleagues" aria-label={`Free on ${dayLine}`} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', border: `1px solid ${neutral.line}`, borderRadius: radius.card, overflow: 'hidden', maxHeight: variant === 'web' ? 360 : undefined, overflowY: 'auto' }}>
              {targets.length === 0 && <li style={{ padding: 14, fontSize: 13, color: neutral.slate }}>No colleague is free in this session.</li>}
              {targets.length > 0 && shownTargets.length === 0 && <li style={{ padding: 14, fontSize: 13, color: neutral.slate }}>No free colleague matches</li>}
              {shownTargets.map((t, i) => (
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
                  <Avatar name={t.name} size={36} variant="neutral" />
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
            {toSlotId === undefined && <BackLink size="step" onClick={() => setStep(route === 'colleague' ? 'colleague' : 'where')}>{route === 'colleague' ? 'Who is free' : 'Where it goes'}</BackLink>}
            {route === 'colleague' && colleague !== undefined ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={colleague.name} size={44} variant="neutral" />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{colleague.name}</span>
                  <span style={{ fontSize: 13, color: neutral.slate }}>{dayLine} · {targetSlotId !== undefined ? resolveDisplayStatus(slots[targetSlotId]?.status ?? '', statuses).label : ''} session</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span aria-hidden style={{ width: 44, height: 44, borderRadius: radius.pill, background: neutral.sunken, color: neutral.slate, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
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
                ? `${colleagueShort} gets your ${hospital} ${sessionText(list.session)} List and its ${bookingWord} straight away. There is no need for ${colleagueShort} or the office to accept.`
                : `Your ${hospital} ${sessionText(list.session)} List goes back to the office with its ${bookingWord}, and the office finds someone for it.`}
            </div>

            <VacatedSessionChoice
              label="Your session after the move"
              value={vacated}
              onChange={setVacated}
              anaesthetist
              shot="move-vacated"
              {...(unavailable !== undefined ? { statusBeingSet: unavailable.statusKey } : {})}
            />

            <TextArea label="Add a message" value={message} onChange={setMessage} placeholder={route === 'colleague' ? `Optional note for ${colleagueShort} and the office` : 'Optional note for the office'} />
            <FormError message={error} />
            <SheetActions
              primary={
                <span data-shot="move-submit" style={{ display: 'contents' }}>
                  <Button variant="primary" block onClick={submit}>
                    Move List
                  </Button>
                </span>
              }
            />
          </div>
        )}

        {step === 'done' && done !== null && (
          <DoneStep
            shot="move-done"
            title={done.route === 'office' ? 'Returned to the office' : `Moved to ${drSurname(done.colleagueName ?? '')}`}
            detail={
              done.route === 'office'
                ? 'The office can see it in its notifications.'
                : `${drSurname(done.colleagueName ?? '')} and the office can see it now.`
            }
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

function ListHeader({ title, line, progress }: { title: string; line: string; progress?: { index: number; total: number } }) {
  return (
    <div data-shot="move-list-header" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {progress !== undefined && progress.total > 1 && (
        <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: neutral.mist }}>
          {progress.index} of {progress.total}
        </span>
      )}
      <OverlayHeader title="Move your List" />
      <span style={{ fontSize: 14, color: neutral.ink }}>{title}</span>
      <span style={{ fontSize: 13, color: neutral.slate }}>{line}</span>
    </div>
  )
}
