import { useMemo, useState } from 'react'
import { neutral, accent, radius, semantic } from '../../../theme/tokens'
import {
  cardsOnListByNhi,
  correctEthnicityCode,
  dataQualityItems,
  integrationMonitor,
  ingestPdfRow,
  reprocessMessage,
  setFeedMapping,
  useAppStore,
  type Actor,
  type IntegrationMonitorRow,
} from '../../../store'
import { SURGEON_PDFS, FEED_META, type PdfRow, type SurgeonPdf } from '../../../domain/integrations'
import { validateNhi } from '../../../domain/nhi'
import { validateEthnicityCode, ETHNICITY_DEMO_SUBSET } from '../../../domain/nzhis'
import { dayMicroCap } from '../../../shared/format'
import { cellStyle as adminCell, headCellStyle as adminHead } from '../tableChrome'

interface Props {
  actor: Actor
}

type Tab = 'messages' | 'feeds' | 'pdfs' | 'quality' | 'validators'

const cell = adminCell()
const head = adminHead()

/**
 * The integration monitor (Phase 11) — proposed product UI, so NOT demo-badged
 * (only its simulation triggers, on the demo control panel, carry the badge).
 * Tabs: the message log, editable per-hospital feed mappings (the failure-fix
 * flow), the surgeon-PDF inbox + extraction review, the ethnicity data-quality
 * queue, and the NHI/ethnicity validators. It surfaces the RFP's reliability
 * posture: per-message acknowledgement, store-then-process, retry with a
 * dead-letter queue and manual intervention.
 */
export function IntegrationMonitorScreen({ actor }: Props) {
  const [tab, setTab] = useState<Tab>('messages')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>Integrations</h1>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4, maxWidth: 820 }}>
          Hospital HL7 v2 messages are translated to FHIR R4 and applied to the schedule; a FHIR-native
          feed shows the target state; surgeon PDFs are read and ingested. Each message is stored on
          receipt, then processed, and retried with a dead-letter queue, so nothing is lost when a
          message cannot be applied.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${neutral.line}`, flexWrap: 'wrap' }}>
        <TabButton active={tab === 'messages'} onClick={() => setTab('messages')}>Messages</TabButton>
        <TabButton active={tab === 'feeds'} onClick={() => setTab('feeds')}>Feed config</TabButton>
        <TabButton active={tab === 'pdfs'} onClick={() => setTab('pdfs')}>Surgeon PDFs</TabButton>
        <TabButton active={tab === 'quality'} onClick={() => setTab('quality')}>Data quality</TabButton>
        <TabButton active={tab === 'validators'} onClick={() => setTab('validators')}>Validators</TabButton>
      </div>

      {tab === 'messages' && <MessagesTab />}
      {tab === 'feeds' && <FeedConfigTab actor={actor} />}
      {tab === 'pdfs' && <SurgeonPdfsTab actor={actor} />}
      {tab === 'quality' && <DataQualityTab actor={actor} />}
      {tab === 'validators' && <ValidatorsTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Messages tab
// ---------------------------------------------------------------------------

function MessagesTab() {
  const integrations = useAppStore((s) => s.integrations)
  const rows = useMemo(() => integrationMonitor({ integrations }), [integrations])
  const attention = rows.filter((r) => r.status === 'deadLetter' || r.status === 'manualIntervention')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {attention.length > 0 && (
        <div style={{ background: semantic.warning.tint, border: `1px solid ${semantic.warning.solid}44`, borderRadius: radius.card, padding: '10px 14px', fontSize: 13, color: semantic.warning.onTint }}>
          {attention.length} message{attention.length === 1 ? '' : 's'} need attention (dead-letter or manual intervention). Reprocess after fixing the cause below.
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyNote>No messages received yet. Replay one from the integration simulator (demo control) to see the log fill.</EmptyNote>
      ) : (
        <div style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 920 }}>
            <thead>
              <tr>{['Time', 'Source', 'Type', 'Control ID', 'Appointment', 'Patient', 'Status', ''].map((h) => <th key={h === '' ? 'a' : h} style={head}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r) => <MessageLogRow key={r.id} row={r} />)}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ fontSize: 12, color: neutral.mist, lineHeight: 1.5 }}>
        "Retried" is a processed message that took more than one attempt. Duplicates are deduped by the
        message control ID (no second Card). Dead-letter and manual-intervention rows are retained for the
        office to action, never dropped.
      </div>
    </div>
  )
}

function MessageLogRow({ row }: { row: IntegrationMonitorRow }) {
  const needsAction = row.status === 'deadLetter' || row.status === 'manualIntervention'
  return (
    <tr>
      <td className="mono" style={cell}>{row.atISO.slice(11, 16)}</td>
      <td style={cell}>{row.feedName}</td>
      <td style={cell}>{row.eventType}</td>
      <td className="mono" style={cell}>{row.messageControlId}</td>
      <td className="mono" style={cell}>{row.appointmentId ?? '·'}</td>
      <td style={cell}>{row.patientRef ?? '·'}</td>
      <td style={cell}>
        <StatusChip label={row.displayStatus} status={row.status} />
        {row.failureReason !== undefined && needsAction && (
          <div style={{ fontSize: 11.5, color: semantic.warning.onTint, marginTop: 4, maxWidth: 260 }}>{row.failureReason}</div>
        )}
      </td>
      <td style={cell}>
        {needsAction && (
          <button
            type="button"
            onClick={() => reprocessMessage(useAppStore, row.id)}
            style={{ minHeight: 32, padding: '0 12px', borderRadius: radius.ctl, border: 'none', background: accent.base, color: '#FFFFFF', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          >
            Reprocess
          </button>
        )}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Feed config tab
// ---------------------------------------------------------------------------

function FeedConfigTab({ actor }: Props) {
  const feeds = useAppStore((s) => s.integrations.feeds)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const ordered = useMemo(() => Object.values(feeds).sort((a, b) => a.id.localeCompare(b.id)), [feeds])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 12.5, color: neutral.slate, lineHeight: 1.5, maxWidth: 820 }}>
        Each hospital feed maps its own source fields to the domain. The mappings genuinely differ (St
        George's sends the NHI in PID-2, Christchurch Public in PID-3), so the mapping is what a
        dead-lettered message needs to recover: correct it here and reprocess the message.
      </div>
      {ordered.map((feed) => {
        const meta = FEED_META[feed.id]
        return (
          <div key={feed.id} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{meta?.name ?? feed.id}</span>
              <span style={{ fontSize: 12, color: neutral.mist }}>{hospitals[feed.hospitalId]?.name ?? feed.hospitalId} · {feed.transport === 'fhir' ? 'FHIR-native' : 'HL7 v2'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(feed.fieldMapping).map(([key, value]) => (
                <MappingRow key={key} feedId={feed.id} field={key} value={value} actor={actor} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MappingRow({ feedId, field, value, actor }: { feedId: string; field: string; value: string; actor: Actor }) {
  const [draft, setDraft] = useState(value)
  const changed = draft.trim() !== value
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, width: 130, color: neutral.ink }}>{field}</span>
      <span style={{ fontSize: 12, color: neutral.mist }}>←</span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="mono"
        style={{ font: 'inherit', fontFamily: "'Spline Sans Mono', ui-monospace, monospace", fontSize: 12.5, padding: '5px 9px', borderRadius: radius.ctl, border: `1px solid ${changed ? accent.base : neutral.lineStrong}`, background: neutral.surface, color: neutral.ink, width: 160 }}
      />
      <button
        type="button"
        disabled={!changed}
        onClick={() => setFeedMapping(useAppStore, actor, feedId, field, draft.trim())}
        style={{ font: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '5px 12px', borderRadius: radius.ctl, border: 'none', background: changed ? accent.base : neutral.line, color: changed ? '#FFFFFF' : neutral.mist, cursor: changed ? 'pointer' : 'default' }}
      >
        Save
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Surgeon PDFs tab
// ---------------------------------------------------------------------------

function SurgeonPdfsTab({ actor }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const pdf = openId !== null ? SURGEON_PDFS.find((p) => p.id === openId) : undefined
  if (pdf !== undefined) return <PdfReview pdf={pdf} actor={actor} onBack={() => setOpenId(null)} />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12.5, color: neutral.slate, maxWidth: 820 }}>
        Surgeons email their operating lists as PDFs. Open one to review the extracted rows beside the
        document, correct anything the parse got wrong, then ingest. A row already booked on the target
        List updates rather than duplicating. Parsing is simulated for the demo.
      </div>
      {SURGEON_PDFS.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '14px 16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{p.subject}</div>
            <div style={{ fontSize: 12.5, color: neutral.slate }}>{p.fromSurgeon} · {p.hospitalName} · {p.receivedLabel} · {p.rows.length} rows</div>
          </div>
          <button type="button" onClick={() => setOpenId(p.id)} style={{ font: 'inherit', fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: radius.ctl, border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, color: neutral.ink, cursor: 'pointer' }}>
            Open
          </button>
        </div>
      ))}
    </div>
  )
}

function PdfReview({ pdf, actor, onBack }: { pdf: SurgeonPdf; actor: Actor; onBack: () => void }) {
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const lists = schedule.lists
  const hospitals = masters.hospitals

  const suggestedListId = useMemo(() => {
    const l = Object.values(lists).find(
      (x) => x.anaesthetistId === pdf.targetList.anaesthetistId && x.dateISO === pdf.targetList.dateISO && x.session === pdf.targetList.session,
    )
    return l?.id
  }, [lists, pdf.targetList])

  const listOptions = useMemo(() => {
    return Object.values(lists)
      .filter((l) => l.anaesthetistId === pdf.targetList.anaesthetistId && l.state === 'DRAFT' && l.dateISO >= pdf.targetList.dateISO)
      .sort((a, b) => (a.dateISO === b.dateISO ? a.session.localeCompare(b.session) : a.dateISO.localeCompare(b.dateISO)))
      .slice(0, 12)
  }, [lists, pdf.targetList])

  const [targetListId, setTargetListId] = useState(suggestedListId ?? listOptions[0]?.id ?? '')
  const [rows, setRows] = useState<PdfRow[]>(pdf.rows.map((r) => ({ ...r })))
  const [results, setResults] = useState<Record<string, { outcome: 'created' | 'updated' | 'error'; message: string }>>({})

  function updateRow(id: string, patch: Partial<PdfRow>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    setResults((res) => {
      const { [id]: _removed, ...rest } = res
      return rest
    })
  }

  function ingest(row: PdfRow) {
    const outcome = ingestPdfRow(useAppStore, actor, targetListId, row)
    setResults((res) => ({
      ...res,
      [row.id]: outcome.ok ? { outcome: outcome.value.outcome, message: outcome.value.outcome === 'updated' ? 'Updated existing Card (not duplicated).' : 'New Card created.' } : { outcome: 'error', message: outcome.message },
    }))
  }

  function ingestAll() {
    for (const row of rows) ingest(row)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button type="button" onClick={onBack} style={{ alignSelf: 'flex-start', font: 'inherit', fontSize: 13, color: accent.base, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>‹ Back to inbox</button>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist, marginBottom: 6 }}>The emailed PDF</div>
          <img src={pdf.facsimile} alt={`${pdf.subject} facsimile`} style={{ width: 380, maxWidth: '100%', border: `1px solid ${neutral.line}`, borderRadius: radius.card, boxShadow: '0 1px 2px rgba(23,35,32,0.06)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>Extracted rows · review and correct</div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: neutral.slate }}>
            Ingest onto
            <select value={targetListId} onChange={(e) => setTargetListId(e.target.value)} style={{ font: 'inherit', fontSize: 12.5, padding: '5px 8px', borderRadius: radius.ctl, border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, color: neutral.ink }}>
              {listOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {dayMicroCap(l.dateISO)} {l.session} · {l.hospitalId !== undefined ? hospitals[l.hospitalId]?.name ?? l.hospitalId : 'Unassigned'}
                </option>
              ))}
            </select>
          </label>

          {rows.map((row) => {
            const nhiVerdict = row.nhi.trim() !== '' ? validateNhi(row.nhi) : undefined
            const normalised = nhiVerdict?.valid === true ? nhiVerdict.normalised : undefined
            const match = normalised !== undefined ? cardsOnListByNhi({ schedule, masters }, targetListId, normalised)[0] : undefined
            const result = results[row.id]
            return (
              <div key={row.id} style={{ background: neutral.surface, border: `1px solid ${result?.outcome === 'error' ? semantic.error.solid : neutral.line}`, borderRadius: radius.card, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <RowField label="NHI" value={row.nhi} mono onChange={(v) => updateRow(row.id, { nhi: v })} width={110} invalid={nhiVerdict?.valid === false} />
                  <RowField label="Name" value={row.name} onChange={(v) => updateRow(row.id, { name: v })} width={150} />
                  <RowField label="Time" value={row.scheduledTime} mono onChange={(v) => updateRow(row.id, { scheduledTime: v })} width={70} />
                  <RowField label="Operation" value={row.operation} onChange={(v) => updateRow(row.id, { operation: v })} width={210} />
                </div>
                {row.deliberateError !== undefined && result === undefined && nhiVerdict?.valid === false && (
                  <div style={{ fontSize: 12, color: semantic.warning.onTint }}>{row.deliberateError}</div>
                )}
                {nhiVerdict?.valid === false && (
                  <div style={{ fontSize: 12, color: semantic.error.onTint }}>NHI invalid: {nhiVerdict.reason}. Correct it before ingesting.</div>
                )}
                {match !== undefined && result === undefined && (
                  <div style={{ fontSize: 12, color: semantic.warning.onTint }}>Already booked on this List · will update, not duplicate.</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button" onClick={() => ingest(row)} style={{ font: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '5px 12px', borderRadius: radius.ctl, border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, color: neutral.ink, cursor: 'pointer' }}>Ingest row</button>
                  {result !== undefined && (
                    <span style={{ fontSize: 12, color: result.outcome === 'error' ? semantic.error.onTint : semantic.success.onTint }}>{result.message}</span>
                  )}
                </div>
              </div>
            )
          })}

          <button type="button" onClick={ingestAll} style={{ alignSelf: 'flex-start', font: 'inherit', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: radius.ctl, border: 'none', background: accent.base, color: '#FFFFFF', cursor: 'pointer' }}>Ingest all rows</button>
        </div>
      </div>
    </div>
  )
}

function RowField({ label, value, onChange, width, mono, invalid }: { label: string; value: string; onChange: (v: string) => void; width: number; mono?: boolean; invalid?: boolean }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={mono === true ? 'mono' : undefined}
        style={{ font: 'inherit', ...(mono === true ? { fontFamily: "'Spline Sans Mono', ui-monospace, monospace" } : {}), fontSize: 12.5, padding: '5px 8px', borderRadius: radius.ctl, border: `1px solid ${invalid === true ? semantic.error.solid : neutral.lineStrong}`, background: neutral.surface, color: neutral.ink, width }}
      />
    </label>
  )
}

// ---------------------------------------------------------------------------
// Data quality tab
// ---------------------------------------------------------------------------

function DataQualityTab({ actor }: Props) {
  const masters = useAppStore((s) => s.masters)
  const items = useMemo(() => dataQualityItems({ masters }), [masters])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12.5, color: neutral.slate, maxWidth: 820, lineHeight: 1.5 }}>
        The RFP mandates NZHIS Level 4 ethnicity codes, so an inbound code that is not a valid code is
        quarantined "pending correction", never stored, and the Card still books. Supply a valid code to
        clear each item.
      </div>
      {items.length === 0 ? (
        <EmptyNote>No data-quality items. Every stored ethnicity code is a valid NZHIS code.</EmptyNote>
      ) : (
        items.map((item) => <DataQualityCard key={item.patientId} item={item} actor={actor} />)
      )}
    </div>
  )
}

function DataQualityCard({ item, actor }: { item: { patientId: string; name: string; nhi?: string; receivedCode: string; reason: string }; actor: Actor }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  function apply() {
    const outcome = correctEthnicityCode(useAppStore, actor, item.patientId, code)
    setError(outcome.ok ? null : outcome.message)
  }
  return (
    <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</span>
        {item.nhi !== undefined && <span className="mono" style={{ fontSize: 12, color: neutral.mist }}>{item.nhi}</span>}
        <span style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: '2px 9px', background: semantic.warning.tint, color: semantic.warning.onTint }}>
          Pending correction · received {item.receivedCode}
        </span>
      </div>
      <div style={{ fontSize: 12, color: neutral.slate }}>{item.reason}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Valid NZHIS code" className="mono" style={{ font: 'inherit', fontFamily: "'Spline Sans Mono', ui-monospace, monospace", fontSize: 12.5, padding: '5px 9px', borderRadius: radius.ctl, border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, color: neutral.ink, width: 150 }} />
        <button type="button" onClick={apply} style={{ font: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '5px 12px', borderRadius: radius.ctl, border: 'none', background: accent.base, color: '#FFFFFF', cursor: 'pointer' }}>Apply code</button>
      </div>
      {error !== null && <div style={{ fontSize: 12, color: semantic.error.onTint }}>{error}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Validators tab
// ---------------------------------------------------------------------------

function ValidatorsTab() {
  const [nhi, setNhi] = useState('')
  const [eth, setEth] = useState('')
  const nhiVerdict = nhi.trim() !== '' ? validateNhi(nhi) : undefined
  const ethVerdict = eth.trim() !== '' ? validateEthnicityCode(eth) : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>NHI validator</div>
        <div style={{ fontSize: 12, color: neutral.slate }}>
          Current format AAANNNC uses a mod-11 check digit; the new format AAANNAX uses a mod-23 check
          letter. The RFP labels the current algorithm "Modulus 24", but its own example NHIs validate
          only under mod-11, so this demo uses mod-11 and flags the label as a discovery item. Both
          formats are mandated dual-format from 1 July 2027.
        </div>
        <input value={nhi} onChange={(e) => setNhi(e.target.value.toUpperCase())} placeholder="e.g. ZAA0067 or ACA31FM" className="mono" style={inputStyle} />
        {nhiVerdict !== undefined && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <VerdictLine ok={nhiVerdict.valid} text={nhiVerdict.valid ? 'Valid NHI' : 'Not valid'} />
            <div style={{ fontSize: 12.5, color: neutral.slate }}>
              Format: {nhiVerdict.format === 'current' ? 'current (AAANNNC, mod-11)' : nhiVerdict.format === 'new' ? 'new (AAANNAX, mod-23)' : 'unrecognised'}
              {nhiVerdict.reason !== undefined ? ` · ${nhiVerdict.reason}` : ''}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Ethnicity code validator</div>
        <div style={{ fontSize: 12, color: neutral.slate }}>
          NZHIS Level 4 codes are 5 digits. This demo validates against a curated subset; a well-formed
          code outside it may still be a valid NZHIS code, so it is labelled as such, never "invalid".
        </div>
        <input value={eth} onChange={(e) => setEth(e.target.value)} placeholder="e.g. 21111" className="mono" style={inputStyle} />
        {ethVerdict !== undefined && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ethVerdict.verdict === 'valid' ? (
              <>
                <VerdictLine ok text="Valid NZHIS code" />
                <div style={{ fontSize: 12.5, color: neutral.slate }}>{ethVerdict.label} · {ethVerdict.level1Group}</div>
              </>
            ) : ethVerdict.verdict === 'outsideDemoSubset' ? (
              <>
                <VerdictLine ok={undefined} text="Outside this demo's curated subset" />
                <div style={{ fontSize: 12.5, color: neutral.slate }}>{ethVerdict.message}</div>
              </>
            ) : (
              <>
                <VerdictLine ok={false} text="Malformed" />
                <div style={{ fontSize: 12.5, color: neutral.slate }}>{ethVerdict.reason}</div>
              </>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {ETHNICITY_DEMO_SUBSET.map((e) => (
            <span key={e.code} className="mono" style={{ fontSize: 11, background: neutral.sunken, color: neutral.slate, borderRadius: 999, padding: '2px 8px' }} title={`${e.label} · ${e.level1Group}`}>{e.code}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  font: 'inherit',
  fontFamily: "'Spline Sans Mono', ui-monospace, monospace",
  fontSize: 14,
  padding: '8px 12px',
  borderRadius: radius.ctl,
  border: `1px solid ${neutral.lineStrong}`,
  background: neutral.surface,
  color: neutral.ink,
  maxWidth: 280,
}

function VerdictLine({ ok, text }: { ok: boolean | undefined; text: string }) {
  const colour = ok === true ? semantic.success.onTint : ok === false ? semantic.error.onTint : semantic.warning.onTint
  return <div style={{ fontSize: 13.5, fontWeight: 700, color: colour }}>{text}</div>
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ border: 'none', background: 'none', padding: '10px 14px', fontFamily: 'inherit', fontSize: 14, fontWeight: active ? 600 : 500, color: active ? neutral.ink : neutral.slate, boxShadow: active ? `inset 0 -2px 0 ${neutral.ink}` : 'none', cursor: 'pointer' }}
    >
      {children}
    </button>
  )
}

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  processed: { bg: semantic.success.tint, fg: semantic.success.onTint },
  duplicate: { bg: neutral.sunken, fg: neutral.slate },
  retrying: { bg: semantic.warning.tint, fg: semantic.warning.onTint },
  manualIntervention: { bg: semantic.warning.tint, fg: semantic.warning.onTint },
  deadLetter: { bg: semantic.error.tint, fg: semantic.error.onTint },
  pending: { bg: neutral.sunken, fg: neutral.slate },
}

function StatusChip({ label, status }: { label: string; status: string }) {
  const tone = STATUS_TONE[status] ?? { bg: neutral.sunken, fg: neutral.slate }
  return <span style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap', background: tone.bg, color: tone.fg }}>{label}</span>
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: neutral.mist, padding: '8px 0' }}>{children}</div>
}
