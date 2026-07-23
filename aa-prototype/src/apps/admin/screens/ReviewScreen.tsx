import { useMemo, useState } from 'react'
import { ChevronLeft, Check, Lock } from 'lucide-react'
import { accent, elevation, neutral, radius, semantic } from '../../../theme/tokens'
import type { BillingRoute, Card, Procedure } from '../../../domain/types'
import { authoriseList, logListNote, prepaymentStatusFor, useAppStore, type Actor } from '../../../store'
import { Button, StatusChip, TextArea, useSurface } from '../../../shared'
import { cardFee, procedureFee } from '../../../shared/capture'
import { dayMicroCap, formatCurrency, hhmm, routeLabel, sessionTimeRange } from '../../../shared/format'
import { HistorySheet } from '../../../shared/card'
import { cellStyle as adminCell, headCellStyle as adminHead } from '../tableChrome'
import { reviewFlagsForCard, type ReviewFlag } from '../reviewFlags'

interface ReviewScreenProps {
  listId: string
  actor: Actor
  onBack: () => void
  /** Open another list (the "Next in queue" jump). */
  onOpen: (listId: string) => void
  /** Jump to the Invoices section (post-authorise, Phase 08). */
  onViewInvoices: () => void
}

const cellStyle = adminCell()
const headCellStyle = adminHead()
const numCell = { ...cellStyle, textAlign: 'right' as const }

/**
 * The sanity-check authorisation review (Phase 07). The mockup's anatomy
 * (convention 17, visual only): breadcrumb, header (title · context · status
 * pill · submitted pill), a 4-tile summary strip, the review table and totals
 * row, and the authorise action bar + choreography. Every figure comes from the
 * REAL Phase 01 calculator (procedureFee / cardFee looped over the non-cancelled
 * cards) — NOT the mockup's simplified numbers (Decisions log). The ROUTE column
 * shows the RFP billing route, not the anaesthetic technique. FLAGS come from
 * the RFP-grounded `reviewFlags` helper (no invented duration-outlier flag).
 */
export function ReviewScreen({ listId, actor, onBack, onOpen, onViewInvoices }: ReviewScreenProps) {
  const { Overlay } = useSurface()
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const cardsRecord = useAppStore((s) => s.schedule.cards)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const billingLinesRecord = useAppStore((s) => s.schedule.billingLines)
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const invoicesRecord = useAppStore((s) => s.billing.invoices)
  const masters = useAppStore((s) => s.masters)
  const audit = useAppStore((s) => s.audit)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [historyIds, setHistoryIds] = useState<readonly string[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const list = listsRecord[listId]

  const rows = useMemo(() => {
    if (list === undefined) return []
    const cards = Object.values(cardsRecord)
      .filter((c) => c.listId === listId && c.cancellation === undefined)
      .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '') || a.id.localeCompare(b.id))
    return cards.map((card: Card) => {
      const procs = Object.values(proceduresRecord)
        .filter((p) => p.cardId === card.id)
        .sort((a, b) => a.id.localeCompare(b.id))
      const views = procs.map((p, i) => procedureFee({ procedure: p, list, ordinal: i + 1, masters, billingLines: billingLinesRecord }))
      const totals = cardFee(procs, list, masters, billingLinesRecord)
      const flags = reviewFlagsForCard({
        card,
        procedures: procs.map((p, i) => ({ procedure: p, fee: views[i]!.fee, baseCode: views[i]!.baseCode })),
        prepaymentStatus: prepaymentStatusFor({ schedule, billing }, card.id),
      })
      const primary: Procedure | undefined = procs[0]
      const primaryView = views[0]
      const routes = new Set(procs.map((p) => p.billingRoute).filter((r): r is BillingRoute => r !== undefined))
      const routeText = routes.size === 0 ? 'Not set' : routes.size > 1 ? 'Mixed' : routeLabel([...routes][0])
      const procIds = new Set(procs.map((p) => p.id))
      const lineIds = Object.values(billingLinesRecord).filter((l) => procIds.has(l.procedureId)).map((l) => l.id)
      const entityIds = [card.id, ...procs.map((p) => p.id), ...lineIds]
      return { card, primary, primaryView, totals, flags, routeText, procCount: procs.length, entityIds }
    })
  }, [list, listId, cardsRecord, proceduresRecord, billingLinesRecord, masters, schedule, billing])

  if (list === undefined) return null
  const anaesthetist = masters.anaesthetists[list.anaesthetistId]
  const surgeon = list.surgeonId !== undefined ? masters.surgeons[list.surgeonId] : undefined
  const hospitalName = list.hospitalId !== undefined ? (masters.hospitals[list.hospitalId]?.name ?? 'Hospital') : 'AA rooms'
  const authorised = list.state === 'AUTHORISED'

  const listTotals = rows.reduce((acc, r) => ({ units: acc.units + r.totals.units, fee: acc.fee + r.totals.total }), { units: 0, fee: 0 })
  const allFlags: ReviewFlag[] = rows.flatMap((r) => r.flags)
  const unitRate = anaesthetist?.unitValue ?? 0

  const submitAt = audit.filter((a) => a.entityId === listId && a.action === 'list.submit').at(-1)?.atISO
  const authAt = audit.filter((a) => a.entityId === listId && a.action === 'list.authorise').at(-1)?.atISO
  const dayLabel = dayMicroCap(list.dateISO)

  // Invoices the billing run raised for this list (via its cards) — the run is
  // synchronous with authorise, so these exist by the time the banner renders.
  const listCardIds = new Set(Object.values(cardsRecord).filter((c) => c.listId === listId).map((c) => c.id))
  // Only standard (run) invoices — a pre-payment pre-invoice is not run output (Phase 09).
  const raisedCount = Object.values(invoicesRecord).filter((i) => i.kind === 'standard' && listCardIds.has(i.cardId)).length

  const nextListId = Object.values(listsRecord)
    .filter((l) => l.state === 'SUBMITTED' && l.id !== listId)
    .sort((a, b) => (a.dateISO === b.dateISO ? a.anaesthetistId.localeCompare(b.anaesthetistId) : a.dateISO.localeCompare(b.dateISO)))[0]?.id

  function doAuthorise() {
    const outcome = authoriseList(useAppStore, actor, listId)
    setConfirmOpen(false)
    if (!outcome.ok) setError(outcome.message)
    else setError(null)
  }

  function saveNote() {
    const outcome = logListNote(useAppStore, actor, listId, noteText)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    setNoteText('')
    setNoteOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: neutral.mist }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', padding: 0, color: neutral.ink, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Review queue</button>
        <span style={{ color: neutral.lineStrong }}> / </span>
        <span>{anaesthetist !== undefined ? anaesthetist.name : list.anaesthetistId} · {hospitalName} {list.session}</span>
      </div>

      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        <ChevronLeft size={16} strokeWidth={2.4} aria-hidden /> Back to queue
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>{hospitalName} · {list.session} list</h1>
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4 }}>
            {anaesthetist !== undefined ? anaesthetist.name : list.anaesthetistId}
            {surgeon !== undefined ? ` · ${surgeon.name}` : ''}
            {surgeon?.specialty !== undefined ? ` · ${surgeon.specialty}` : ''}
            {` · ${dayLabel} · ${sessionTimeRange(list)}`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusChip status={list.statusKey} />
          {submitAt !== undefined && !authorised && (
            <span style={{ fontSize: 12, fontWeight: 600, color: semantic.warning.onTint, background: semantic.warning.tint, borderRadius: 999, padding: '4px 10px' }}>
              Submitted {hhmm(submitAt)}
            </span>
          )}
        </div>
      </div>

      {/* Authorised banner (choreography) */}
      {authorised && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: semantic.success.tint, border: `1px solid ${semantic.success.solid}44`, borderRadius: radius.card, padding: 16, animation: 'aa-fade-in 260ms ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span aria-hidden style={{ width: 30, height: 30, borderRadius: 999, background: semantic.success.solid, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', animation: 'aa-circle-pop 320ms ease' }}>
              <Check size={18} strokeWidth={3} aria-hidden />
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: semantic.success.onTint }}>List authorised · locked for billing</div>
              <div style={{ fontSize: 12, color: semantic.success.onTint }}>
                {dayLabel}{authAt !== undefined ? `, ${hhmm(authAt)}` : ''} · {actor.who} ·{' '}
                {raisedCount > 0 ? `${raisedCount} invoice${raisedCount === 1 ? '' : 's'} raised by the billing run` : 'Handed to the billing run'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {raisedCount > 0 && (
              <button onClick={onViewInvoices} style={{ border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                View invoices →
              </button>
            )}
            <button onClick={() => (nextListId !== undefined ? onOpen(nextListId) : onBack())} style={{ border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {nextListId !== undefined ? 'Next in queue →' : 'Back to queue →'}
            </button>
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <Tile label="Cards" value={String(rows.length)} />
        <Tile label="Total units" value={String(listTotals.units)} />
        <Tile label="Total fee" value={formatCurrency(listTotals.fee)} />
        <Tile label="Flags" value={String(allFlags.length)} tone={allFlags.length > 0 ? 'warn' : undefined} sub="to check before authorising" />
      </div>

      {error !== null && (
        <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
      )}

      {/* Review table */}
      <div style={{ overflowX: 'auto', opacity: authorised ? 0.72 : 1, transition: 'opacity 300ms', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 960 }}>
          <thead>
            <tr>
              {['Time', 'Patient', 'Route', 'Contract', 'Code', 'Times', 'B · T · M', 'Units', 'Fee', 'Flags'].map((h, i) => (
                <th key={h} style={{ ...headCellStyle, textAlign: i === 7 || i === 8 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ card, primary, primaryView, totals, flags, routeText, procCount, entityIds }) => {
              const patient = masters.patients[card.patientId]
              const btm = primaryView?.fee.btm
              return (
                <tr key={card.id}>
                  <td className="mono" style={cellStyle}>{card.scheduledTime ?? '·'}</td>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{patient?.name ?? 'Unknown'}</div>
                    <div className="mono" style={{ fontSize: 11.5, color: neutral.mist }}>{patient?.nhi ?? 'NHI pending'} · {primary?.description ?? 'Procedure'}{procCount > 1 ? ` · +${procCount - 1} more` : ''}</div>
                  </td>
                  <td style={cellStyle}>{routeText}</td>
                  <td style={cellStyle}>{primaryView?.contract?.name ?? 'None'}</td>
                  <td className="mono" style={{ ...cellStyle, color: accent.base }}>{primary?.rvgBaseCode ?? '·'}</td>
                  <td className="mono" style={cellStyle}>{primary?.anaestheticStartISO !== undefined ? `${hhmm(primary.anaestheticStartISO)} to ${hhmm(primary.handoverISO)}` : '·'}</td>
                  <td className="mono" style={{ ...cellStyle, color: neutral.slate }}>{btm !== undefined ? `${btm.base.units} · ${btm.time.units} · ${btm.modifiers.units}` : '·'}</td>
                  <td className="mono" style={{ ...numCell, fontWeight: 700 }}>{totals.units}</td>
                  <td className="mono" style={{ ...numCell, fontWeight: 600 }}>{formatCurrency(totals.total)}</td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                      {flags.map((f, i) => (
                        <FlagPill key={i} flag={f} />
                      ))}
                      {authorised && <Lock size={13} aria-hidden style={{ color: neutral.mist }} />}
                      <button onClick={() => setHistoryIds(entityIds)} style={{ border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>History</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {/* Totals */}
            <tr style={{ background: neutral.bg }}>
              <td style={cellStyle} />
              <td style={{ ...cellStyle, fontWeight: 700 }}>Totals</td>
              <td style={cellStyle} colSpan={4} />
              <td style={cellStyle} />
              <td className="mono" style={{ ...numCell, fontWeight: 700 }}>{listTotals.units}</td>
              <td className="mono" style={{ ...numCell, fontWeight: 700 }}>{formatCurrency(listTotals.fee)}</td>
              <td style={{ ...cellStyle, color: neutral.mist, fontSize: 12 }}>@ ${unitRate.toFixed(2)}/unit (list rate)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Phone notes */}
      {list.phoneNotes !== undefined && list.phoneNotes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {list.phoneNotes.map((n, i) => (
            <div key={i} style={{ fontSize: 12.5, color: neutral.slate }}>
              <span className="mono" style={{ color: neutral.mist }}>Phone note {hhmm(n.atISO)} · {n.by}</span> · {n.text}
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, boxShadow: elevation.e1, padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{rows.length} card{rows.length === 1 ? '' : 's'} · {listTotals.units} units · {formatCurrency(listTotals.fee)}</div>
          {!authorised && allFlags.length > 0 && (
            <div style={{ fontSize: 12.5, color: semantic.warning.onTint }}>{allFlags.length} flag{allFlags.length === 1 ? '' : 's'} open. Check or note them before authorising.</div>
          )}
          <div style={{ fontSize: 11.5, color: neutral.mist }}>Authorisation is an OfficeAdmin action · acting as {actor.who} (Office)</div>
        </div>
        {authorised ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: semantic.success.onTint, background: semantic.success.tint, borderRadius: 999, padding: '8px 14px' }}>
            <Lock size={14} aria-hidden /> Authorised · locked
          </span>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setNoteOpen(true)}>Log phone note</Button>
            <Button variant="primary" onClick={() => setConfirmOpen(true)} style={{ minHeight: 48, fontSize: 15 }}>Authorise for billing</Button>
          </div>
        )}
      </div>

      {/* Authorise confirm */}
      <Overlay open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Authorise this list for billing?</div>
          <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px' }}>
            Authorising locks every Card on this List immutable (no further edits by anyone) and hands the List to the Billing Engine as a single unit. Invoices are raised immediately, grouped by counterparty. There is no return to the anaesthetist from here.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" block onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" block onClick={doAuthorise}>Authorise for billing</Button>
          </div>
        </div>
      </Overlay>

      {/* Log phone note */}
      <Overlay open={noteOpen} onClose={() => setNoteOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Log a phone note</div>
          <div style={{ fontSize: 13, color: neutral.slate }}>Record a call about this list. It attaches to the list and its audit trail. It never returns the list to the anaesthetist.</div>
          <TextArea label="Note" value={noteText} onChange={setNoteText} placeholder="e.g. Confirmed the missing reference with the hospital." />
          <Button variant="primary" block disabled={noteText.trim() === ''} onClick={saveNote}>Log note</Button>
        </div>
      </Overlay>

      {historyIds !== null && (
        <HistorySheet open entityIds={historyIds} title="Card history" onClose={() => setHistoryIds(null)} />
      )}
    </div>
  )
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'warn' }) {
  return (
    <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>{label}</span>
      <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: tone === 'warn' ? semantic.warning.onTint : neutral.ink }}>{value}</span>
      {sub !== undefined && <span style={{ fontSize: 11, color: neutral.mist }}>{sub}</span>}
    </div>
  )
}

function FlagPill({ flag }: { flag: ReviewFlag }) {
  const warn = flag.tone === 'warn'
  return (
    <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '2px 8px', background: warn ? semantic.warning.tint : neutral.sunken, color: warn ? semantic.warning.onTint : neutral.slate }}>
      {flag.text}
    </span>
  )
}
