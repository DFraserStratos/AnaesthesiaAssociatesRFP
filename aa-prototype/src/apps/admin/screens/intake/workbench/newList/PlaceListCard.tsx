/**
 * Place this List (build plan Phase 70; US-02.1.2's placement half, US-01.6.1, DM-19, D118, D125; the opened arrival's
 * O1 in docs/explorations/intake-inbox-iterations.html). Four choices as radio cards: the anaesthetist named on the
 * PDF or by the hospital, while their session is free (Suggested); another anaesthetist free that session, picked
 * from a drop-down; a List AA holds that could take it, picked from a drop-down; or a Draft List. The whole List
 * lands as one change set (`placeArrivalList`); a session taken since the card was drawn is refused in place.
 *
 * `usePlaceList` gives the choices (`node`) apart from what confirms them (`summary`, `primaryLabel`, `submit`,
 * `blockedBy`, `error`), so the opened arrival puts the button in the decision column's footer directly under the
 * choice. `PlaceListCard` is the same thing as one standalone card with its own button (the component catalogue).
 *
 * Hooks: `data-shot="intake-place-list"` (or `shot`); each option `data-place-option` (`suggested`, `session`,
 * `list`, `draft`), the chosen one's `data-slot-id` or `data-list-id`; `-session-pick`, `-list-pick`, `-surgeon`,
 * `-error`, `-named-busy`; the standalone card's `-summary` and `-submit` (the opened arrival's footer primary takes
 * `intake-place-list-submit`).
 */

import { useMemo, useState, type ReactNode } from 'react'
import type { ArrivalItem } from '../../../../../../domain/intake/arrivals'
import { rowWaitsForNhi } from '../../../../../../domain/intake/arrivals'
import { sessionLabel, type MatchingList } from '../../../../../../domain/intake/matching'
import type { Session } from '../../../../../../domain/types'
import { plural, shortDay, titledSurname } from '../../../../../../shared/format'
import { DRAFT_LIST, DRAFT_LISTS } from '../../../../../../shared/scheduleTerms'
import { DecisionHeading } from '../../../../../../shared/surface'
import { Button, Card, FormError, Pill, RadioCard, SelectField, useRovingRadio } from '../../../../../../shared/ui'
import { placeArrivalList, placeChoicesFor, sessionChoice, useAppStore, type Actor, type PlaceChoice } from '../../../../../../store'
import { neutral, space, type as typeScale } from '../../../../../../theme/tokens'

const SMALL = { fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate } as const

type OptionKind = 'suggested' | 'session' | 'list' | 'draft'

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

export interface PlaceListOptions {
  arrival: ArrivalItem
  actor: Actor
  /** Why the List cannot be placed yet (an invalid NHI): the primary is disabled with it. */
  disabledReason?: string
  onPlaced: (r: { listId: string }) => void
  shot?: string
}

export interface PlaceList {
  /** The choices, as a group of radio cards. */
  node: ReactNode
  /** What the primary will do: "Creates the List with 3 Bookings and a stub for Sina Leota." */
  summary: string
  /** The primary's label, naming the result: "Place in Dr Delaney's PM". */
  primaryLabel: string
  submit: () => void
  /** Why the primary is disabled; undefined when it can place. */
  blockedBy?: string
  /** A refusal from the store (a session just taken). */
  error: string | null
  /** The patients waiting for an NHI, who go on the List as stubs. */
  stubNames: string[]
}

/** Place this List, its choices apart from its confirm. Undefined when the arrival has no date or session to place by. */
export function usePlaceList({ arrival, actor, disabledReason, onPlaced, shot = 'intake-place-list' }: PlaceListOptions): PlaceList | undefined {
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

  const [selected, setSelected] = useState<OptionKind | undefined>(() => (choices?.suggested !== undefined ? 'suggested' : undefined))
  const [slotPick, setSlotPick] = useState('')
  const [listPick, setListPick] = useState('')
  const [surgeonPick, setSurgeonPick] = useState('')
  const [refusal, setRefusal] = useState<string | null>(null)

  const otherSlots = useMemo(() => {
    const name = (id: string) => titledAnaesthetist(masters.anaesthetists, id)
    return [...(choices?.otherSlots ?? [])].sort((a, b) => name(a.anaesthetistId).localeCompare(name(b.anaesthetistId)) || a.id.localeCompare(b.id))
  }, [choices, masters.anaesthetists])
  const lists = choices?.lists ?? []
  // The drop-downs start on their first entry; a pick no longer offered (taken meanwhile) falls back to it.
  const slot = otherSlots.find((s) => s.id === slotPick) ?? otherSlots[0]
  const list = lists.find((l) => l.id === listPick) ?? lists[0]

  const offered: OptionKind[] = [
    ...(choices?.suggested !== undefined ? (['suggested'] as const) : []),
    ...(slot !== undefined ? (['session'] as const) : []),
    ...(list !== undefined ? (['list'] as const) : []),
    'draft',
  ]
  // A choice no longer offered (its session was taken) is no choice: the office chooses again.
  const chosen = selected !== undefined && offered.includes(selected) ? selected : undefined
  const choose = (v: OptionKind) => {
    setSelected(v)
    setRefusal(null)
  }
  const { groupProps, itemProps } = useRovingRadio({ values: offered, value: chosen, onChange: choose })

  if (choices === undefined || arrival.dateISO === undefined || arrival.session === undefined) return undefined
  const { dateISO, session } = arrival

  const needsSurgeon = !choices.surgeonKnown && (chosen === 'suggested' || chosen === 'session' || chosen === 'draft')
  const surgeonOptions = Object.values(masters.surgeons).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
  const namedBusy = choices.namedAnaesthetistId !== undefined && choices.suggested === undefined
  const namedBy = arrival.source.kind === 'rooms' ? 'Named on the PDF' : 'Named by the hospital'

  const listOwner = (l: MatchingList) => (l.anaesthetistId !== undefined ? `${anaesthetistName(l.anaesthetistId)}'s List` : `the ${DRAFT_LIST}`)
  const listLine = (l: MatchingList) => {
    const surgeon = l.surgeonId !== undefined ? masters.surgeons[l.surgeonId]?.name : undefined
    return [surgeon !== undefined ? titledSurname(surgeon) : 'No surgeon', sessionLabel(l.dateISO, l.session), l.state === 'DRAFT' ? 'no anaesthetist yet' : undefined]
      .filter((p) => p !== undefined)
      .join(', ')
  }

  const contents = contentsPhrase(bookingCount, stubNames)
  const summary =
    chosen === undefined
      ? `Choose where this List goes. It holds ${contents}.`
      : chosen === 'list' && list !== undefined
        ? `Adds ${contents} to ${listOwner(list)}.`
        : chosen === 'draft'
          ? `Makes a ${DRAFT_LIST} with ${contents}.`
          : `Creates the List with ${contents}.`

  const primaryLabel =
    chosen === undefined
      ? 'Place this List'
      : chosen === 'list' && list !== undefined
        ? `Add to ${listOwner(list)}`
        : chosen === 'draft'
          ? `Make a ${DRAFT_LIST}`
          : `Place in ${anaesthetistName((chosen === 'suggested' ? choices.suggested : slot)?.anaesthetistId)}'s ${sessionWord(session)}`

  const blockedBy =
    disabledReason ??
    (chosen === undefined ? 'Choose where this List goes first.' : needsSurgeon && surgeonPick === '' ? 'Choose the surgeon for this List first.' : undefined)

  const submit = () => {
    if (chosen === undefined || blockedBy !== undefined) return
    const surgeonId = needsSurgeon && surgeonPick !== '' ? surgeonPick : undefined
    const choice: PlaceChoice =
      chosen === 'list' && list !== undefined
        ? { kind: 'list', listId: list.id }
        : chosen === 'draft'
          ? { kind: 'draft', ...(surgeonId !== undefined ? { surgeonId } : {}) }
          : sessionChoice((chosen === 'suggested' ? choices.suggested : slot)?.id ?? '', surgeonId)
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

  const common = (v: OptionKind, i: number) => ({ radio: itemProps(i), checked: chosen === v, onSelect: () => choose(v), 'data-place-option': v })
  const at = (v: OptionKind) => offered.indexOf(v)

  const node = (
    <section data-shot={shot} data-arrival-key={arrival.key} aria-label="Place this List" style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
      <DecisionHeading>Place this List</DecisionHeading>
      {namedBusy && (
        <p data-shot={`${shot}-named-busy`} style={{ margin: 0, ...SMALL }}>
          {namedBy}: {anaesthetistName(choices.namedAnaesthetistId)}, whose {sessionWord(session)} on {shortDay(dateISO)} is not free.
        </p>
      )}
      <div {...groupProps} aria-label="Where this List goes" style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
        {choices.suggested !== undefined && (
          <RadioCard
            {...common('suggested', at('suggested'))}
            data-slot-id={choices.suggested.id}
            title={`${anaesthetistName(choices.suggested.anaesthetistId)}'s ${sessionWord(session)}, ${shortDay(dateISO)}`}
            titleExtra={<Pill size="sm" tone="success">Suggested</Pill>}
            description={`${namedBy}, free ${partOfDay(session)}`}
          >
            {surgeonField}
          </RadioCard>
        )}
        {slot !== undefined && (
          <RadioCard
            {...common('session', at('session'))}
            data-slot-id={slot.id}
            title={`Another anaesthetist's ${sessionWord(session)}`}
            description={`${otherSlots.length} free ${partOfDay(session)}`}
          >
            <SelectField label="Anaesthetist" value={slot.id} onChange={(v) => { setSlotPick(v); setRefusal(null) }} size="compact" fill="well" shot={`${shot}-session-pick`}>
              {otherSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {anaesthetistName(s.anaesthetistId)}
                </option>
              ))}
            </SelectField>
            {surgeonField}
          </RadioCard>
        )}
        {list !== undefined && (
          <RadioCard
            {...common('list', at('list'))}
            data-list-id={list.id}
            title="Add to a List we hold"
            description={lists.length === 1 ? `1 List ${partOfDay(session)} could take it` : `${lists.length} Lists ${partOfDay(session)} could take it`}
          >
            <SelectField label="List" value={list.id} onChange={(v) => { setListPick(v); setRefusal(null) }} size="compact" fill="well" shot={`${shot}-list-pick`}>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {`${listOwner(l).replace(/^the /, 'The ')} · ${listLine(l)}`}
                </option>
              ))}
            </SelectField>
          </RadioCard>
        )}
        <RadioCard {...common('draft', at('draft'))} title={`Make a ${DRAFT_LIST}`} description={`No anaesthetist yet, shows in ${DRAFT_LISTS} until someone is assigned`}>
          {surgeonField}
        </RadioCard>
      </div>
      <FormError message={refusal} shot={`${shot}-error`} />
    </section>
  )

  return { node, summary, primaryLabel, submit, ...(blockedBy !== undefined ? { blockedBy } : {}), error: refusal, stubNames }
}

/** Place this List as one standalone card with its own summary and button (the component catalogue). */
export function PlaceListCard(props: PlaceListOptions) {
  const place = usePlaceList(props)
  const shot = props.shot ?? 'intake-place-list'
  if (place === undefined) return null
  return (
    <Card shot={`${shot}-card`}>
      {place.node}
      <div style={{ display: 'flex', alignItems: 'center', gap: space[3], flexWrap: 'wrap', borderTop: `1px solid ${neutral.line}`, paddingTop: space[3] }}>
        <p data-shot={`${shot}-summary`} style={{ margin: 0, flex: '1 1 240px', ...SMALL }}>
          {place.summary}
        </p>
        <Button variant="primary" size="desktop" onClick={place.submit} disabled={place.blockedBy !== undefined} disabledReason={place.blockedBy} shot={`${shot}-submit`}>
          {place.primaryLabel}
        </Button>
      </div>
    </Card>
  )
}
