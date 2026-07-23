import { useMemo } from 'react'
import { neutral, radius, semantic } from '../../../theme/tokens'
import { isListBilled, useAppStore } from '../../../store'
import { dayMicroCap, hhmm } from '../../../shared/format'
import { surnameOf } from '../util'

interface ReviewQueueProps {
  onOpen: (listId: string) => void
}

/**
 * The authorisation review queue (Phase 07): every SUBMITTED list awaiting
 * sanity-check + authorisation, ordered by date then anaesthetist. Selecting one
 * opens the `ReviewScreen`. At the foot, a visible "Handed to billing · Phase 08"
 * panel lists AUTHORISED, not-yet-billed lists — so authorising a list is not a
 * dead end (the billing run that empties this inbox arrives in Phase 08; the
 * `listAuthorised` event is already emitted for it to consume).
 */
export function ReviewQueue({ onOpen }: ReviewQueueProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const cardsRecord = useAppStore((s) => s.schedule.cards)
  const masters = useAppStore((s) => s.masters)
  const audit = useAppStore((s) => s.audit)

  const cardCount = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of Object.values(cardsRecord)) {
      if (c.cancellation === undefined) counts[c.listId] = (counts[c.listId] ?? 0) + 1
    }
    return counts
  }, [cardsRecord])

  const submitTimes = useMemo(() => {
    const map: Record<string, string> = {}
    for (const a of audit) if (a.action === 'list.submit') map[a.entityId] = a.atISO
    return map
  }, [audit])

  const submitted = useMemo(
    () =>
      Object.values(listsRecord)
        .filter((l) => l.state === 'SUBMITTED')
        .sort((a, b) => (a.dateISO === b.dateISO ? a.anaesthetistId.localeCompare(b.anaesthetistId) : a.dateISO.localeCompare(b.dateISO))),
    [listsRecord],
  )

  const handedToBilling = useMemo(
    () =>
      Object.values(listsRecord)
        .filter((l) => l.state === 'AUTHORISED' && !isListBilled(l))
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
    [listsRecord],
  )

  function label(anaesthetistId: string): string {
    const anae = masters.anaesthetists[anaesthetistId]
    return anae !== undefined ? anae.name : anaesthetistId
  }
  function hospitalOf(hospitalId: string | undefined): string {
    return hospitalId !== undefined ? (masters.hospitals[hospitalId]?.name ?? 'Hospital') : 'Unassigned'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>Review queue</h1>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4 }}>
          Submitted lists awaiting a sanity check and authorisation for billing. {submitted.length} in the queue.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {submitted.length === 0 && <div style={{ fontSize: 13, color: neutral.mist }}>Nothing awaiting review.</div>}
        {submitted.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onOpen(l.id)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: neutral.ink }}>{surnameOf(label(l.anaesthetistId))} · {hospitalOf(l.hospitalId)} {l.session}</span>
              <span style={{ fontSize: 12, color: neutral.slate }}>
                {dayMicroCap(l.dateISO)} · {cardCount[l.id] ?? 0} card{(cardCount[l.id] ?? 0) === 1 ? '' : 's'}
                {submitTimes[l.id] !== undefined ? ` · submitted ${hhmm(submitTimes[l.id])}` : ' · submitted'}
              </span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: neutral.mist }}>Review →</span>
          </button>
        ))}
      </div>

      {/* Phase 08 handoff — the billing-run inbox. */}
      <div style={{ background: neutral.sunken, border: `1px dashed ${neutral.lineStrong}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Handed to billing</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: semantic.warning.onTint, background: semantic.warning.tint, borderRadius: 999, padding: '2px 8px' }}>Phase 08</span>
        </div>
        <div style={{ fontSize: 12.5, color: neutral.slate }}>
          Authorised lists waiting for the billing run to raise their invoices. The run is built in Phase 08.
        </div>
        {handedToBilling.length === 0 ? (
          <div style={{ fontSize: 12.5, color: neutral.mist }}>No authorised lists waiting.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {handedToBilling.map((l) => (
              <div key={l.id} style={{ fontSize: 12.5, color: neutral.ink }}>
                {surnameOf(label(l.anaesthetistId))} · {hospitalOf(l.hospitalId)} {l.session} · {dayMicroCap(l.dateISO)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
