import { useMemo } from 'react'
import { accent, neutral, radius } from '../../../theme/tokens'
import { billedLists, invoiceCountsByList, useAppStore } from '../../../store'
import { dayMicroCap, hhmm } from '../../../shared/format'
import { listShortLabel } from '../util'

interface ReviewQueueProps {
  onOpen: (listId: string) => void
  onViewInvoices: () => void
}

/**
 * The authorisation review queue (Phase 07): every SUBMITTED list awaiting
 * sanity-check + authorisation, ordered by date then anaesthetist. Selecting one
 * opens the `ReviewScreen`. At the foot, a "Recently billed" panel shows where
 * authorised lists went — the Phase 08 billing run raises invoices in the same
 * moment a list is authorised, so authorising is never a dead end. (An
 * AUTHORISED-but-unbilled list is a transient state that Phase 09's monitor
 * surfaces if a run ever leaves one behind.)
 */
export function ReviewQueue({ onOpen, onViewInvoices }: ReviewQueueProps) {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const audit = useAppStore((s) => s.audit)
  const listsRecord = schedule.lists
  const cardsRecord = schedule.cards

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

  const recentlyBilled = useMemo(() => billedLists({ schedule }).slice(0, 6), [schedule])
  const invoiceCountByList = useMemo(() => invoiceCountsByList({ schedule, billing }), [schedule, billing])

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
              <span style={{ fontSize: 14.5, fontWeight: 600, color: neutral.ink }}>{listShortLabel(l, masters)}</span>
              <span style={{ fontSize: 12, color: neutral.slate }}>
                {dayMicroCap(l.dateISO)} · {cardCount[l.id] ?? 0} card{(cardCount[l.id] ?? 0) === 1 ? '' : 's'}
                {submitTimes[l.id] !== undefined ? ` · submitted ${hhmm(submitTimes[l.id])}` : ' · submitted'}
              </span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: neutral.mist }}>Review →</span>
          </button>
        ))}
      </div>

      {/* Where authorised lists went — the billing run raises invoices immediately. */}
      <div style={{ background: neutral.sunken, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Recently billed</span>
          <button onClick={onViewInvoices} style={{ border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            View invoices →
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: neutral.slate }}>
          Authorising a list hands it to the Billing Engine as a unit; its invoices are raised in the same moment.
        </div>
        {recentlyBilled.length === 0 ? (
          <div style={{ fontSize: 12.5, color: neutral.mist }}>Nothing billed yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recentlyBilled.map((l) => (
              <div key={l.id} style={{ fontSize: 12.5, color: neutral.ink }}>
                {listShortLabel(l, masters)} · {dayMicroCap(l.dateISO)}
                <span style={{ color: neutral.mist }}>
                  {' '}· billed {hhmm(l.billedAtISO)} · {invoiceCountByList[l.id] ?? 0} invoice{(invoiceCountByList[l.id] ?? 0) === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
