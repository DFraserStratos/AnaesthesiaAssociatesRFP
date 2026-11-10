import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Building2, Users } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import { activeStatuses, isClosedKey, statusFor } from '../../../domain/slotStatus'
import { defaultVacated } from '../../../domain/listMoves'
import type { SlotStatusKey } from '../../../domain/types'
import { closedEmptyColleagueSlots, listInSlot, markUnavailableAndMoveList, openSlotViews, setAvailability, useAppStore, type Actor } from '../../../store'
import { Button, FormError, TextArea, TickBadge } from '../../../shared/ui'
import { useSurface } from '../../../shared/surface'
import { BackLink, ChoiceRow } from '../../../shared/flows/moveSheetParts'
import { StatusRadioGroup, VacatedSessionChoice } from '../../../shared/flows/VacatedSessionChoice'
import { useDemoTriggerContextWhile } from '../../../shared/demoTriggers'
import { bookingCountLabel, DRAFT_LISTS } from '../../../shared/scheduleTerms'
import { drSurname, locationName } from '../../../shared/format'
import { surnameFirst } from '../util'
import { AnaesthetistCandidates, NotPreferredWarning, useNotPreferredWarning, useSuggestionKey } from '../components/pairing'
import { NotAvailableColleagues } from '../components/pairing/AnaesthetistCandidates'
import { sessionText } from '../../../domain/outOfHours'

type Step = 'status' | 'where' | 'colleague' | 'confirm' | 'done'

/**
 * The office changes one anaesthetist's session status (catch-up Phase 32b;
 * FT-01.2, US-01.5.5, US-01.5.4; D59, D60), from the Admin Day drawer. A
 * sickness phoned in is the usual reason.
 *
 * - An empty session, or a status that keeps the session open, saves at once
 *   (`setAvailability`).
 * - A status that closes a session holding a List never leaves the List in
 *   place (unavailability is never a conflict): the sheet asks "Where does this
 *   List go?", Return to the office (a Draft List) or Hand on to a colleague
 *   (open sessions only, by tier, then preferred pairing; Not preferred apart;
 *   colleagues marked not available shown but never selectable), then what the
 *   session becomes once the List has gone (the status being set, or Free), and
 *   commits through `markUnavailableAndMoveList` as the office, in one step.
 * - A SUBMITTED List can only be handed on; an AUTHORISED List refuses.
 *
 * The Mobile Availability sheet's anatomy in the Admin dialog: the same choice
 * rows, back link and confirm card as the anaesthetist's own move sheet, so the
 * one rule reads the same in both apps. Teal is the only action colour; no
 * "slot" in the copy.
 */
export function SessionStatusSheet({ open, slotId, actor, onClose }: { open: boolean; slotId: string; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const state = useAppStore()
  const slot = state.schedule.slots[slotId]
  const statuses = state.masters.slotStatuses
  const masters = state.masters
  const bookings = state.schedule.bookings
  const liveList = listInSlot(state, slotId)

  const [step, setStep] = useState<Step>('status')
  const [statusKey, setStatusKey] = useState<SlotStatusKey>('')
  const [note, setNote] = useState('')
  const [route, setRoute] = useState<'office' | 'colleague'>('office')
  const [targetId, setTargetId] = useState<string | null>(null)
  const [vacated, setVacated] = useState<SlotStatusKey>('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  // What the header and the done step show: the List as it was when the sheet opened.
  const [listId, setListId] = useState<string | undefined>(undefined)
  const [done, setDone] = useState<{ line: string; detail: string } | null>(null)
  const requestKey = useSuggestionKey(listId ?? slotId, open)

  useEffect(() => {
    if (!open) return
    const s = useAppStore.getState()
    const current = s.schedule.slots[slotId]
    setStep('status')
    setStatusKey(current?.status ?? '')
    setNote(current?.note ?? '')
    setRoute('office')
    setTargetId(null)
    setVacated('')
    setQuery('')
    setError(null)
    setListId(listInSlot(s, slotId)?.id)
    setDone(null)
  }, [open, slotId])
  useDemoTriggerContextWhile('adminPicker.listId', listId ?? '', open && listId !== undefined && step === 'colleague')

  const list = listId !== undefined ? state.schedule.lists[listId] : undefined
  const assigned = list !== undefined && list.state !== 'DRAFT' ? list : undefined
  const choices = useMemo(() => activeStatuses(statuses), [statuses])
  const anaesthetist = slot !== undefined ? masters.anaesthetists[slot.anaesthetistId] : undefined
  const who = anaesthetist !== undefined ? drSurname(anaesthetist.name) : 'The anaesthetist'
  const target = targetId !== null ? masters.anaesthetists[targetId] : undefined
  const pairingWarning = useNotPreferredWarning(route === 'colleague' ? targetId ?? undefined : undefined, assigned?.surgeonId)

  // Open colleague sessions that day and session (a colleague made available joins at once).
  const candidateIds = useMemo(() => {
    if (slot === undefined || !open) return []
    return openSlotViews(state, slot.dateISO, slot.session)
      .filter((v) => v.slot.anaesthetistId !== slot.anaesthetistId)
      .map((v) => v.slot.anaesthetistId)
  }, [state, slot, open])
  const closedColleagues = useMemo(() => (slot === undefined || !open ? [] : closedEmptyColleagueSlots(state, slot.dateISO, slot.session, slot.anaesthetistId)), [state, slot, open])

  if (slot === undefined) return null
  const { session, dateISO } = slot

  const dayLine = `${format(parseISO(dateISO), 'EEE d MMM')} · ${sessionText(session)}`
  const closing = statusKey !== '' && isClosedKey(statuses, statusKey)
  const holdsList = assigned !== undefined && liveList?.id === assigned.id
  const needsWhere = holdsList && closing && statusKey !== slot.status
  const locked = holdsList && assigned.state === 'AUTHORISED'
  const submitted = holdsList && assigned.state === 'SUBMITTED'
  const bookingCount = assigned !== undefined ? Object.values(bookings).filter((b) => b.listId === assigned.id && b.cancellation === undefined).length : 0
  const listLine = assigned !== undefined ? `${locationName(assigned.hospitalId, masters.hospitals)} · ${masters.surgeons[assigned.surgeonId]?.name ?? assigned.surgeonId} · ${bookingCountLabel(bookingCount)}` : ''
  const statusLabel = statusFor(statuses, statusKey)?.longLabel ?? statusKey
  const vacatedLabel = statusFor(statuses, vacated)?.longLabel ?? vacated
  const colleagueCount = candidateIds.length

  function saveStatus() {
    setError(null)
    if (slot === undefined) return
    if (needsWhere) {
      setVacated(defaultVacated(statusKey))
      setStep('where')
      return
    }
    const out = setAvailability(useAppStore, actor, slot.anaesthetistId, slot.dateISO, slot.session, statusKey, note)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setDone({ line: out.value.result === 'noChange' ? 'Nothing changed' : 'Status saved', detail: `${who}'s ${sessionText(session)} session on ${format(parseISO(dateISO), 'EEE d MMM')} is ${statusLabel}.` })
    setStep('done')
  }

  function confirmMove() {
    setError(null)
    if (slot === undefined || assigned === undefined) return
    const toSlotId = route === 'colleague' && targetId !== null ? openSlotViews(state, slot.dateISO, slot.session).find((v) => v.slot.anaesthetistId === targetId)?.slot.id : undefined
    if (route === 'colleague' && toSlotId === undefined) {
      setError('That colleague is no longer free this session. Choose another.')
      return
    }
    const out = markUnavailableAndMoveList(
      useAppStore,
      actor,
      slot.id,
      statusKey,
      toSlotId !== undefined ? { route: 'colleague', toSlotId } : { route: 'office' },
      { vacatedStatus: vacated, note },
    )
    if (!out.ok) {
      setError(out.message)
      return
    }
    const sessionLine = `${who}'s ${sessionText(session)} session is ${vacatedLabel}.`
    setDone(
      out.value.route === 'colleague'
        ? { line: `Moved to ${drSurname(target?.name ?? '')}`, detail: `The List and its ${bookingCountLabel(bookingCount)} are in ${drSurname(target?.name ?? '')}'s session now. ${sessionLine}` }
        : { line: 'Returned to the office', detail: `The List waits in the ${DRAFT_LISTS} with its ${bookingCountLabel(bookingCount)}. ${sessionLine}` },
    )
    setStep('done')
  }

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: neutral.ink }}>{step === 'status' || step === 'done' ? 'Change status' : 'Where does this List go?'}</span>
      <span style={{ fontSize: 13, color: neutral.slate }}>
        {anaesthetist !== undefined ? surnameFirst(anaesthetist.name) : slot.anaesthetistId} · {dayLine}
      </span>
      {step !== 'status' && step !== 'done' && assigned !== undefined && <span style={{ fontSize: 13, color: neutral.ink }}>{listLine}</span>}
    </div>
  )

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="office-status-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 480, maxWidth: '100%' }}>
        {step === 'status' && (
          <>
            {header}
            <StatusRadioGroup
              label="Status"
              choices={choices.map((c) => c.key)}
              value={statusKey}
              onChange={(k) => {
                setStatusKey(k)
                setError(null)
              }}
              shot="office-status-choices"
              labelOf="longLabel"
            />
            <TextArea label="Note" value={note} onChange={setNote} placeholder="Optional, for example: Unwell, short notice" />
            {needsWhere && !locked && (
              <div data-shot="office-status-holds-list" style={{ background: neutral.bg, borderRadius: radius.ctl, padding: 12, fontSize: 13, lineHeight: '19px', color: neutral.ink }}>
                This session has a List ({listLine}). {submitted ? 'It has been submitted, so it can only be handed on to a colleague.' : 'Next, choose whether it goes back to the office or to a colleague.'}
              </div>
            )}
            {needsWhere && locked && (
              <div role="status" style={{ background: neutral.bg, borderRadius: radius.ctl, padding: 12, fontSize: 13, lineHeight: '19px', color: neutral.ink }}>
                This session's List is authorised and locked, so the session cannot be marked {statusLabel}.
              </div>
            )}
            <FormError message={error} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <span data-shot="office-status-save" style={{ display: 'contents' }}>
                <Button variant="primary" block disabled={statusKey === '' || locked} onClick={saveStatus}>
                  {needsWhere ? 'Continue' : 'Save status'}
                </Button>
              </span>
            </div>
          </>
        )}

        {step === 'where' && (
          <>
            <BackLink onClick={() => setStep('status')}>Status</BackLink>
            {header}
            <div style={{ fontSize: 13, lineHeight: '19px', color: neutral.slate }}>
              {who} will be {statusLabel} for this session, so the List cannot stay with them.
            </div>
            <div data-shot="office-status-where" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ChoiceRow
                shot="office-status-choice-office"
                icon={<Building2 size={18} strokeWidth={2.2} aria-hidden />}
                title="Return to the office"
                line={submitted ? 'Not for a submitted List: hand it on to a colleague.' : `It waits in the ${DRAFT_LISTS} with its Bookings, nearest day first.`}
                disabled={submitted}
                onClick={() => {
                  setRoute('office')
                  setTargetId(null)
                  setStep('confirm')
                }}
              />
              <ChoiceRow
                shot="office-status-choice-colleague"
                icon={<Users size={18} strokeWidth={2.2} aria-hidden />}
                title="Hand on to a colleague"
                line={colleagueCount === 0 ? 'No colleague is free this session.' : `${colleagueCount} ${colleagueCount === 1 ? 'colleague is' : 'colleagues are'} free on ${dayLine}, by tier, then preferred pairing.`}
                disabled={colleagueCount === 0 && closedColleagues.length === 0}
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
            <AnaesthetistCandidates
              candidates={candidateIds}
              surgeonId={assigned?.surgeonId}
              requestKey={requestKey}
              query={query}
              onQueryChange={setQuery}
              onPick={(id) => {
                setTargetId(id)
                setStep('confirm')
              }}
              emptyText={`No colleague has a free ${sessionText(session)} session on this day.`}
              trailing={() => <span style={{ fontSize: 12, color: accent.base, fontWeight: 600 }}>Free {sessionText(slot.session)}</span>}
            />
            <NotAvailableColleagues slots={closedColleagues} session={session} query={query} shot="office-status-not-available" />
          </>
        )}

        {step === 'confirm' && (
          <div data-shot="office-status-confirm" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <BackLink onClick={() => setStep(route === 'colleague' ? 'colleague' : 'where')}>{route === 'colleague' ? 'Who is free' : 'Where it goes'}</BackLink>
            {header}
            <div style={{ background: neutral.bg, borderRadius: radius.ctl, padding: 14, fontSize: 13, lineHeight: '19px', color: neutral.slate }}>
              {route === 'colleague'
                ? `${drSurname(target?.name ?? '')} gets the List and its ${bookingCountLabel(bookingCount)} straight away, in their ${sessionText(session)} session.`
                : `The List goes back to the office with its ${bookingCountLabel(bookingCount)} and waits in the ${DRAFT_LISTS} for someone to take it.`}
            </div>
            <VacatedSessionChoice label={`${who}'s session after the move`} value={vacated} onChange={setVacated} statusBeingSet={statusKey} shot="office-status-vacated" />
            {route === 'colleague' && <NotPreferredWarning warning={pairingWarning} shot="office-status-pairing-warning" />}
            <FormError message={error} />
            <span data-shot="office-status-confirm-button" style={{ display: 'contents' }}>
              <Button variant="primary" block onClick={confirmMove}>
                {route === 'colleague' ? `Move to ${drSurname(target?.name ?? '')}${pairingWarning !== null ? ' anyway' : ''}` : 'Return to the office'}
              </Button>
            </span>
          </div>
        )}

        {step === 'done' && done !== null && (
          <div data-shot="office-status-done" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0 8px' }}>
            <TickBadge size={72} animate />
            <div style={{ fontSize: 18, fontWeight: 700, color: semantic.success.onTint }}>{done.line}</div>
            <div style={{ fontSize: 13, color: neutral.slate, textAlign: 'center', lineHeight: '19px', maxWidth: 380 }}>{done.detail}</div>
            <Button variant="secondary" block onClick={onClose} style={{ marginTop: 4 }}>
              Done
            </Button>
          </div>
        )}
      </div>
    </Overlay>
  )
}
