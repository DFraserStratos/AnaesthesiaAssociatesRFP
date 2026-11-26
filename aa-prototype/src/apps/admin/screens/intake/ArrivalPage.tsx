/**
 * One arrival opened on its own page (27 Nov 2026 rebuild; docs/explorations/intake-inbox-iterations.html, O1). The
 * header moves you and never decides: Back to the inbox, the List's name in words with one quiet line under it, and
 * Previous, "n of N" and Next at the top right. Below, the bench for the arrival's kind: the document on the grey
 * desk and the decision column, whose footer holds the decision's buttons under the choice (`workbench/Bench.tsx`).
 *
 * The inbox's query rides in the URL (`intakePaths.ts`), so Previous, Next and Back keep its order and filters. Once
 * the arrival is decided it may leave that order: the page keeps the order it last saw, so Previous and Next still
 * step on from where it was. A Needs NHI arrival stops existing once its NHI is added, so the last arrival seen for
 * the key is held and its bench keeps showing the outcome. The bench remounts per key, so nothing carries over.
 * J and K step, Escape goes back to the inbox (`workbench/useArrivalKeys.ts`).
 *
 * Hooks: `intake-arrival-page` (`data-arrival-key`, `data-arrival-kind`), `intake-arrival-back`,
 * `intake-arrival-previous`, `intake-arrival-position`, `intake-arrival-next`, `intake-arrival-gone`.
 */

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ARRIVAL_KIND_LABELS, type ArrivalItem } from '../../../../domain/intake/arrivals'
import { arrivalFromText, daysToSurgery, inboxPosition } from '../../../../domain/intake/inbox'
import { drSurname, plural } from '../../../../shared/format'
import { Button, EmptyState, TextAction } from '../../../../shared/ui'
import { useAppStore, useToday } from '../../../../store'
import { useArrival, useInboxItems } from '../../../../store/intakeSelectors'
import type { Actor } from '../../../../store/mutate'
import { neutral, space, type as typeScale } from '../../../../theme/tokens'
import { AdminPage } from '../../components/AdminPage'
import { arrivalPath, inboxPath, inboxQueryFromParams } from './intakePaths'
import { Bench } from './workbench/Bench'
import { arrivalTitleText, receivedWhenText, surgeryWhenText } from './workbench/arrivalText'
import { useArrivalKeys } from './workbench/useArrivalKeys'

export function ArrivalPage({ actor }: { actor: Actor }) {
  const { key = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const todayISO = useToday()
  const query = inboxQueryFromParams(params)

  // The arrival by key from every arrival, else the last one shown under this key (a Needs NHI item is gone once its NHI is added).
  const fromStore = useArrival(key)
  const [held, setHeld] = useState<ArrivalItem | undefined>(fromStore)
  if (fromStore !== undefined && fromStore !== held) setHeld(fromStore)
  const arrival = fromStore ?? (held?.key === key ? held : undefined)

  // The inbox's order, and the last order in which this arrival still stood.
  const items = useInboxItems(query, todayISO)
  const liveKeys = useMemo(() => items.map((i) => i.key), [items])
  const [seenKeys, setSeenKeys] = useState<readonly string[]>(liveKeys)
  const live = liveKeys.includes(key)
  if (live && (seenKeys.length !== liveKeys.length || seenKeys.some((k, i) => k !== liveKeys[i]))) setSeenKeys(liveKeys)

  let previous: string | undefined
  let next: string | undefined
  if (live) {
    ;({ previous, next } = inboxPosition(liveKeys, key))
  } else {
    // Decided and gone from the order: step on from where it stood, to arrivals still in the inbox.
    const at = seenKeys.indexOf(key)
    if (at < 0) next = liveKeys[0]
    else {
      // Nothing after it: wrap to the first arrival still in the inbox, so the office can carry on.
      next = seenKeys.slice(at + 1).find((k) => liveKeys.includes(k)) ?? liveKeys[0]
      previous = [...seenKeys.slice(0, at)].reverse().find((k) => liveKeys.includes(k))
    }
  }
  const position = live ? `${liveKeys.indexOf(key) + 1} of ${liveKeys.length}` : `${plural(liveKeys.length, 'more', 'more')} in the inbox`

  const hospitalName = useAppStore((s) => (arrival !== undefined ? s.masters.hospitals[arrival.hospitalId]?.name : undefined))
  const anaesthetistName = useAppStore((s) => {
    const listId = arrival?.heldListId
    const anaesthetistId = listId !== undefined ? s.schedule.lists[listId]?.anaesthetistId : undefined
    return anaesthetistId !== undefined && anaesthetistId !== null ? s.masters.anaesthetists[anaesthetistId]?.name : undefined
  })
  const batches = useAppStore((s) => s.intake.batches)
  const pdfLists = useAppStore((s) => s.intake.pdfLists)

  const back = inboxPath(query)
  const go = (to: string | undefined) => {
    if (to !== undefined) navigate(arrivalPath(to, query))
  }
  const goNext = next !== undefined ? () => go(next) : undefined
  const goPrevious = previous !== undefined ? () => go(previous) : undefined
  useArrivalKeys({ ...(goNext !== undefined ? { onNext: goNext } : {}), ...(goPrevious !== undefined ? { onPrevious: goPrevious } : {}), onBack: () => navigate(back) })

  const nav = (
    <div data-testid="intake-arrival-navigation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: space[2], flexWrap: 'wrap', marginLeft: 'auto' }}>
      <Button variant="secondary" size="compact" disabled={goPrevious === undefined} onClick={goPrevious} shot="intake-arrival-previous" title="Previous (K)">
        <ArrowLeft size={15} strokeWidth={2.2} aria-hidden /> Previous
      </Button>
      <span data-shot="intake-arrival-position" style={{ fontSize: typeScale.label.size, color: neutral.slate, whiteSpace: 'nowrap', padding: `0 ${space[1]}px` }}>
        {position}
      </span>
      <Button variant="secondary" size="compact" disabled={goNext === undefined} onClick={goNext} shot="intake-arrival-next" title="Next (J)">
        Next <ArrowRight size={15} strokeWidth={2.2} aria-hidden />
      </Button>
    </div>
  )

  if (arrival === undefined) {
    return (
      <AdminPage mode="fit" title="Arrival" back={{ label: 'Arrivals', to: back, shot: 'intake-arrival-back' }} shot="intake-arrival-page">
        <EmptyState
          variant="card"
          shot="intake-arrival-gone"
          action={
            <TextAction flush to={back}>
              Back to Arrivals
            </TextAction>
          }
        >
          This arrival is no longer here.
        </EmptyState>
      </AdminPage>
    )
  }

  const kindText = arrival.kind === 'update' && anaesthetistName !== undefined ? `Update to ${drSurname(anaesthetistName)}'s List` : ARRIVAL_KIND_LABELS[arrival.kind]
  const hasRows = arrival.kind !== 'unreadable' && arrival.kind !== 'held' && arrival.kind !== 'needsNhi'
  const sub = [
    kindText,
    hasRows ? plural(arrival.counts.rows, 'patient') : undefined,
    surgeryWhenText(daysToSurgery(arrival, todayISO)),
    `from ${arrivalFromText(arrival, { batches, pdfLists })}, ${receivedWhenText(arrival.receivedAtISO, todayISO)}`,
  ]
    .filter((p) => p !== undefined)
    .join(' · ')

  return (
    <AdminPage
      mode="fit"
      title={arrivalTitleText(arrival, hospitalName)}
      sub={sub}
      actions={nav}
      back={{ label: 'Arrivals', to: back, shot: 'intake-arrival-back' }}
      shot="intake-arrival-page"
      data-arrival-key={arrival.key}
      data-arrival-kind={arrival.kind}
    >
      <Bench key={arrival.key} arrival={arrival} actor={actor} onDone={() => undefined} {...(goNext !== undefined ? { onNext: goNext } : {})} />
    </AdminPage>
  )
}
