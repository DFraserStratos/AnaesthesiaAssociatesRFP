/**
 * Place this List (build plan Phase 70; US-02.1.2's placement half, US-01.6.1, DM-19, D118, D125;
 * `docs/explorations/intake-ideas.html` `#idea1` mock B and `#reco`, the session picker reading who is free that day).
 * Intake's own card, built from shared parts: the named anaesthetist's session first while it is free (Suggested),
 * the other anaesthetists free that day and session, the Lists AA holds that could take it, and a Draft List. One
 * primary button names the result; the whole List lands as one change set (`placeArrivalList`). A session taken
 * since the card was drawn is refused in place.
 *
 * Hooks: `data-shot="intake-place-list"` (or `shot`); each option `data-place-option` (`suggested`, `session`, `list`,
 * `draft`) with `data-slot-id` or `data-list-id`; `intake-place-list-submit`, `-error`, `-summary`, `-named-busy`,
 * `-surgeon`, `-more`.
 */

import { useMemo, useState } from 'react'
import type { ArrivalItem } from '../../../../../../domain/intake/arrivals'
import { rowWaitsForNhi } from '../../../../../../domain/intake/arrivals'
import { sessionLabel, type MatchingList, type MatchingSlot } from '../../../../../../domain/intake/matching'
import { placementSlotLabel } from '../../../../../../domain/intake/placement'
import type { Session } from '../../../../../../domain/types'
import { plural, shortDay, titledSurname } from '../../../../../../shared/format'
import { DRAFT_LIST, DRAFT_LISTS } from '../../../../../../shared/scheduleTerms'
import { Button, Card, FormError, Pill, RadioCard, SelectField, TextAction, useRovingRadio } from '../../../../../../shared/ui'
import { placeArrivalList, placeChoicesFor, sessionChoice, useAppStore, type Actor, type PlaceChoice } from '../../../../../../store'
import { neutral, space, type as typeScale } from '../../../../../../theme/tokens'

/** How many other free anaesthetists show before "Show more". */
const FIRST_SLOTS = 5

const SMALL = { fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate } as const

type OptionKind = 'suggested' | 'session' | 'list' | 'draft'

interface PlaceOption {
  /** The radio value: unique per option. */
  value: string
  kind: OptionKind
  slot?: MatchingSlot
  list?: MatchingList
}

/** "Dr Rutherford", or "An anaesthetist" when the id is unknown. */
function titledAnaesthetist(anaesthetists: Readonly<Record<string, { name: string }>>, id: string | undefined): string {
  const name = id !== undefined ? anaesthetists[id]?.name : undefined
  return name !== undefined ? titledSurname(name) : 'An anaesthetist'
}

/** "that morning", "that afternoon", "out of hours". */
function partOfDay(session: Session): string {
  return session === 'AM' ? 'that morning' : session === 'PM' ? 'that afternoon' : 'out of hours'
}

/** "PM", or "out-of-hours session". */
function sessionWord(session: Session): string {
  return session === 'OOH' ? 'out-of-hours session' : session
}

/** "Sione Faleolo", "Sione Faleolo and Aroha Ngata", "A, B and C". */
function namesList(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** "with 3 Bookings and a stub for Sione Faleolo" (the parts that are there). */
function contentsPhrase(bookings: number, stubNames: readonly string[]): string {
  const parts: string[] = []
  if (bookings > 0) parts.push(plural(bookings, 'Booking'))
  if (stubNames.length === 1) parts.push(`a stub for ${stubNames[0]}`)
  else if (stubNames.length > 1) parts.push(`stubs for ${namesList(stubNames)}`)
  return parts.join(' and ')
}

export function PlaceListCard({
  arrival,
  actor,
  disabledReason,
  onPlaced,
  shot = 'intake-place-list',
}: {
  arrival: ArrivalItem
  actor: Actor
  disabledReason?: string
  onPlaced: (r: { listId: string }) => void
  shot?: string
}) {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const intake = useAppStore((s) => s.intake)
  const choices = useMemo(() => placeChoicesFor({ masters, schedule, intake }, arrival.key), [masters, schedule, intake, arrival.key])

  const anaesthetistName = (id: string | undefined) => titledAnaesthetist(masters.anaesthetists, id)

  // The rows the List would take: Bookings for those with an NHI, stubs for those waiting for one.
  const rows = arrival.openRowIds.flatMap((id) => {
    const row = intake.rows[id]
    return row !== undefined && row.status === 'open' && row.removalOfBookingId === undefined ? [row] : []
  })
  const stubNames = rows.filter((r) => rowWaitsForNhi(r)).map((r) => r.incoming.patient.name)
  const bookingCount = rows.length - stubNames.length

  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState<string | undefined>(() => (choices?.suggested !== undefined ? `suggested:${choices.suggested.id}` : undefined))
  const [surgeonPick, setSurgeonPick] = useState('')
  const [refusal, setRefusal] = useState<string | null>(null)

  const otherSlots = useMemo(() => {
    const name = (id: string) => titledAnaesthetist(masters.anaesthetists, id)
    return [...(choices?.otherSlots ?? [])].sort((a, b) => name(a.anaesthetistId).localeCompare(name(b.anaesthetistId)) || a.id.localeCompare(b.id))
  }, [choices, masters.anaesthetists])
  const shownSlots = showAll ? otherSlots : otherSlots.slice(0, FIRST_SLOTS)
  const options: PlaceOption[] = [
    ...(choices?.suggested !== undefined ? [{ value: `suggested:${choices.suggested.id}`, kind: 'suggested' as const, slot: choices.suggested }] : []),
    ...shownSlots.map((slot) => ({ value: `slot:${slot.id}`, kind: 'session' as const, slot })),
    ...(choices?.lists ?? []).map((list) => ({ value: `list:${list.id}`, kind: 'list' as const, list })),
    { value: 'draft', kind: 'draft' },
  ]
  // A choice no longer offered (its session was taken) is no choice: the office chooses again.
  const chosen = options.find((o) => o.value === selected)
  const { groupProps, itemProps } = useRovingRadio({
    values: options.map((o) => o.value),
    value: chosen?.value,
    onChange: (v) => {
      setSelected(v)
      setRefusal(null)
    },
  })

  if (choices === undefined || arrival.dateISO === undefined || arrival.session === undefined) return null
  const { dateISO, session } = arrival

  const needsSurgeon = !choices.surgeonKnown && (chosen?.kind === 'suggested' || chosen?.kind === 'session' || chosen?.kind === 'draft')
  const surgeonOptions = Object.values(masters.surgeons).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
  const namedBusy = choices.namedAnaesthetistId !== undefined && choices.suggested === undefined
  const namedBy = arrival.source.kind === 'rooms' ? 'Named on the PDF' : 'Named by the hospital'

  const listTitle = (list: MatchingList) => (list.anaesthetistId !== undefined ? `Add to ${anaesthetistName(list.anaesthetistId)}'s List` : `Add to the ${DRAFT_LIST}`)
  const listLine = (list: MatchingList) => {
    const surgeon = list.surgeonId !== undefined ? masters.surgeons[list.surgeonId]?.name : undefined
    return [surgeon !== undefined ? titledSurname(surgeon) : 'No surgeon', sessionLabel(list.dateISO, list.session), list.state === 'DRAFT' ? 'no anaesthetist yet' : undefined]
      .filter((p) => p !== undefined)
      .join(' · ')
  }

  const contents = contentsPhrase(bookingCount, stubNames)
  const summary =
    chosen === undefined
      ? `Choose where this List goes. It holds ${contents}.`
      : chosen.kind === 'list' && chosen.list !== undefined
        ? `Adds ${contents} to ${listTitle(chosen.list).replace(/^Add to /, '')}.`
        : chosen.kind === 'draft'
          ? `Makes a ${DRAFT_LIST} with ${contents}.`
          : `Creates the List with ${contents}.`

  const buttonLabel =
    chosen === undefined
      ? 'Place this List'
      : chosen.kind === 'list'
        ? 'Add to the List'
        : chosen.kind === 'draft'
          ? `Make a ${DRAFT_LIST}`
          : `Place in ${anaesthetistName(chosen.slot?.anaesthetistId)}'s ${sessionWord(session)}`

  const blockedBy =
    disabledReason ??
    (chosen === undefined ? 'Choose where this List goes first.' : needsSurgeon && surgeonPick === '' ? 'Choose the surgeon for this List first.' : undefined)

  const place = () => {
    if (chosen === undefined) return
    const surgeon = needsSurgeon && surgeonPick !== '' ? { surgeonId: surgeonPick } : {}
    const choice: PlaceChoice =
      chosen.kind === 'list' && chosen.list !== undefined
        ? { kind: 'list', listId: chosen.list.id }
        : chosen.kind === 'draft'
          ? { kind: 'draft', ...surgeon }
          : sessionChoice(chosen.slot?.id ?? '', needsSurgeon && surgeonPick !== '' ? surgeonPick : undefined)
    const out = placeArrivalList(useAppStore, actor, arrival.key, choice)
    if (!out.ok) {
      setRefusal(out.message)
      if (out.code === 'slotTaken') setSelected(undefined)
      return
    }
    setRefusal(null)
    onPlaced({ listId: out.value.listId })
  }

  const surgeonField = needsSurgeon ? (
    <SelectField label="Surgeon" value={surgeonPick} onChange={setSurgeonPick} size="compact" fill="well" shot={`${shot}-surgeon`} hint={`${arrival.surgeonName ?? 'The surgeon sent'} is not in the master data.`}>
      <option value="">Choose a surgeon</option>
      {surgeonOptions.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </SelectField>
  ) : undefined

  return (
    <Card title="Place this List" shot={shot} data-arrival-key={arrival.key}>
      {namedBusy && (
        <p data-shot={`${shot}-named-busy`} style={{ margin: 0, ...SMALL }}>
          {namedBy}: {anaesthetistName(choices.namedAnaesthetistId)}, whose {sessionWord(session)} on {shortDay(dateISO)} is not free.
        </p>
      )}
      <div {...groupProps} aria-label="Where this List goes" style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
        {options.map((o, i) => {
          const common = { radio: itemProps(i), checked: chosen?.value === o.value, onSelect: () => { setSelected(o.value); setRefusal(null) }, 'data-place-option': o.kind }
          if (o.kind === 'suggested' && o.slot !== undefined) {
            return (
              <RadioCard
                key={o.value}
                {...common}
                data-slot-id={o.slot.id}
                title={`${anaesthetistName(o.slot.anaesthetistId)}'s ${sessionWord(session)}, ${shortDay(dateISO)}`}
                titleExtra={<Pill size="sm" tone="success">Suggested</Pill>}
                description={`${namedBy} · free ${partOfDay(session)}`}
              >
                {surgeonField}
              </RadioCard>
            )
          }
          if (o.kind === 'session' && o.slot !== undefined) {
            return (
              <RadioCard key={o.value} {...common} data-slot-id={o.slot.id} title={placementSlotLabel(o.slot, masters.anaesthetists)}>
                {surgeonField}
              </RadioCard>
            )
          }
          if (o.kind === 'list' && o.list !== undefined) {
            return <RadioCard key={o.value} {...common} data-list-id={o.list.id} title={listTitle(o.list)} description={listLine(o.list)} />
          }
          return (
            <RadioCard key={o.value} {...common} title={`Make a ${DRAFT_LIST}`} description={`No anaesthetist yet · shows in ${DRAFT_LISTS} until someone is assigned`}>
              {surgeonField}
            </RadioCard>
          )
        })}
      </div>
      {otherSlots.length > FIRST_SLOTS && (
        <TextAction size="sm" flush shot={`${shot}-more`} onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show fewer anaesthetists' : `Show ${plural(otherSlots.length - FIRST_SLOTS, 'more free anaesthetist')}`}
        </TextAction>
      )}
      <FormError message={refusal} shot={`${shot}-error`} />
      <div style={{ display: 'flex', alignItems: 'center', gap: space[3], flexWrap: 'wrap', borderTop: `1px solid ${neutral.line}`, paddingTop: space[3] }}>
        <p data-shot={`${shot}-summary`} style={{ margin: 0, flex: '1 1 240px', ...SMALL }}>
          {summary}
        </p>
        <Button variant="primary" size="desktop" onClick={place} disabled={blockedBy !== undefined} disabledReason={blockedBy} shot={`${shot}-submit`}>
          {buttonLabel}
        </Button>
      </div>
    </Card>
  )
}
