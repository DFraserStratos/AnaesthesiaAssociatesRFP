import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Info, Play, Radio, RotateCw } from 'lucide-react'
import { DemoSurface } from './DemoSurface'
import { processMessage, useAppStore } from '../../store'
import { neutral, accent, radius, semantic } from '../../theme/tokens'
import {
  CANNED_MESSAGES,
  FEED,
  FEED_META,
  cannedMessage,
  extractFromFhir,
  extractViaMapping,
  toFhirBundle,
  type CannedMessage,
  type ParsedMessage,
} from '../../domain/integrations'
import { ANAE } from '../../domain/seed'

const FEED_ORDER = [FEED.stg, FEED.cph, FEED.sx]

/**
 * The integration simulator (`/demo/integrations`) — demo-badged. Pick a feed,
 * replay a canned SIU message (or drip the whole feed live), and watch it
 * translate and land on the schedule:
 *  - HL7 feeds show THREE panes: raw HL7 (segment-highlighted) -> the FHIR R4
 *    bundle the mapping produces -> the resulting schedule change.
 *  - The FHIR-native feed (Southern Cross) shows TWO panes (FHIR -> effect): the
 *    target state, no translation step.
 *
 * Translation is genuinely mapping-driven: the FHIR pane is built from the feed
 * mapping the store holds, so an operator's mapping fix changes what this shows.
 * Discovery callouts reference the HNZ FHIR-first mandate, the Digital Services
 * Hub NHI lookup and Keycloak (referenced, not implemented).
 */
export function DemoIntegrations() {
  const feeds = useAppStore((s) => s.integrations.feeds)
  const messages = useAppStore((s) => s.integrations.messages)
  const cards = useAppStore((s) => s.schedule.cards)
  const lists = useAppStore((s) => s.schedule.lists)
  const patients = useAppStore((s) => s.masters.patients)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)

  const [feedId, setFeedId] = useState<string>(FEED.stg)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [live, setLive] = useState(false)

  const feed = feeds[feedId]
  const library = useMemo(() => CANNED_MESSAGES.filter((m) => m.feedId === feedId), [feedId])
  const selected = cannedMessage(selectedId ?? '') ?? library[0]

  const souter = anaesthetists[ANAE.souter]
  const practitioner = useMemo(
    () => (souter !== undefined ? { name: souter.name, hpiId: souter.hpiId } : undefined),
    [souter],
  )

  // Live drip: process each of the feed's messages ~1/sec, then stop.
  useEffect(() => {
    if (!live) return
    const ids = library.map((m) => m.id)
    let i = 0
    const timer = setInterval(() => {
      if (i >= ids.length) {
        setLive(false)
        return
      }
      const id = ids[i]
      if (id !== undefined) processMessage(useAppStore, id)
      i += 1
    }, 1000)
    return () => clearInterval(timer)
  }, [live, library])

  // The parsed message + FHIR bundle for the selected message, using the LIVE
  // feed mapping (so a mapping fix is reflected here).
  const parsed: ParsedMessage | null = useMemo(() => {
    if (selected === undefined || feed === undefined) return null
    try {
      return selected.transport === 'fhir' && selected.fhirBundle !== undefined
        ? extractFromFhir(selected.fhirBundle, feed.fieldMapping)
        : extractViaMapping(selected.raw ?? '', feed.fieldMapping)
    } catch {
      return null
    }
  }, [selected, feed])

  const fhirJson = useMemo(() => {
    if (selected === undefined) return ''
    if (selected.transport === 'fhir' && selected.fhirBundle !== undefined) {
      return JSON.stringify(selected.fhirBundle, null, 2)
    }
    if (parsed === null) return '(could not translate under the current feed mapping)'
    return JSON.stringify(toFhirBundle(parsed, practitioner), null, 2)
  }, [selected, parsed, practitioner])

  // The message-log row for the selected canned message (latest), for the effect pane.
  const row = useMemo(() => {
    if (selected === undefined) return undefined
    return Object.values(messages)
      .filter((m) => m.messageControlId === selected.id)
      .sort((a, b) => (b.updatedAtISO ?? '').localeCompare(a.updatedAtISO ?? ''))[0]
  }, [messages, selected])

  const resultCard = row?.resultCardId !== undefined ? cards[row.resultCardId] : undefined

  function replay() {
    if (selected === undefined) return
    setSelectedId(selected.id)
    processMessage(useAppStore, selected.id)
  }

  return (
    <DemoSurface
      title="Integration simulator"
      subtitle="Replay canned hospital messages into the fake backend and watch them translate and land on the schedule. HL7 v2 feeds are translated to FHIR R4; the Southern Cross feed is FHIR-native. All in-browser, no real endpoints."
    >
      <Callout tone="info" title="Target state: FHIR-first, via the Digital Services Hub">
        Health NZ's direction is FHIR-first. This prototype translates each hospital's HL7 v2 into FHIR
        R4 on the way in (per-hospital field mapping) and treats a FHIR-native feed as the target. Today
        these messages arrive as SFTP batches; the target is near-real-time, per-message processing, which
        the replay and live drip here demonstrate. Patient identity is validated (NHI format and check
        digit) and deduped into a single record, and provider identity carries the HPI; a production build
        would confirm identity against the NHI FHIR API and authenticate to the Hub with Keycloak
        (referenced here, not implemented).
      </Callout>

      {/* Feed picker */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {FEED_ORDER.map((id) => {
          const meta = FEED_META[id]
          const activeFeed = id === feedId
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setFeedId(id)
                setSelectedId(null)
                setLive(false)
              }}
              style={{
                font: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: radius.card,
                border: `1px solid ${activeFeed ? accent.base : neutral.line}`,
                background: activeFeed ? accent.tint : neutral.surface,
                padding: '12px 16px',
                minWidth: 190,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: neutral.ink }}>{meta?.name}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: neutral.slate }}>
                {meta?.transport === 'fhir' ? 'FHIR-native' : 'HL7 v2 · translated'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Live-feed control + mapping summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setLive((v) => !v)}
          style={{ ...pillButton, background: live ? semantic.warning.tint : neutral.surface, borderColor: live ? semantic.warning.solid : neutral.lineStrong, color: live ? semantic.warning.onTint : neutral.ink }}
        >
          <Radio size={14} strokeWidth={2.5} aria-hidden />
          {live ? 'Streaming live feed...' : 'Start live feed'}
        </button>
        <span style={{ fontSize: 12, color: neutral.mist }}>
          Drips this feed's messages one per second into the backend.
        </span>
      </div>

      {feed !== undefined && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>Mapping</span>
          {Object.entries(feed.fieldMapping).map(([k, v]) => (
            <span key={k} className="mono" style={{ fontSize: 11, background: neutral.sunken, color: neutral.slate, borderRadius: 999, padding: '2px 9px' }}>
              {k} ← {v}
            </span>
          ))}
        </div>
      )}

      {/* Message library */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {library.map((m) => (
          <MessageRow
            key={m.id}
            message={m}
            active={selected?.id === m.id}
            statusLabel={statusLabelFor(m.id, messages)}
            onSelect={() => setSelectedId(m.id)}
            onReplay={() => {
              setSelectedId(m.id)
              processMessage(useAppStore, m.id)
            }}
          />
        ))}
      </div>

      {/* Panes */}
      {selected !== undefined && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{selected.label}</div>
            <button type="button" onClick={replay} style={{ ...pillButton, background: accent.base, borderColor: accent.base, color: '#FFFFFF' }}>
              <RotateCw size={14} strokeWidth={2.5} aria-hidden />
              Replay message
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: selected.transport === 'fhir' ? '1fr 1fr' : '1fr 1fr 1fr', gap: 12 }}>
            {selected.transport !== 'fhir' && (
              <Pane title="1 · Raw HL7 v2" subtitle={FEED_META[selected.feedId]?.name}>
                <Hl7View raw={selected.raw ?? ''} />
              </Pane>
            )}
            <Pane title={selected.transport === 'fhir' ? 'FHIR R4 (native)' : '2 · FHIR R4 (translated)'} subtitle="Appointment · Patient · Practitioner">
              <pre style={codeBlock}>{fhirJson}</pre>
            </Pane>
            <Pane title={selected.transport === 'fhir' ? 'Effect' : '3 · Schedule change'} subtitle="Applied to the fake backend">
              <EffectView
                status={row?.status}
                displayLabel={row !== undefined ? statusSentence(row.status, row.attempts) : undefined}
                failureReason={row?.failureReason}
                cardLabel={
                  resultCard !== undefined
                    ? cardEffectLabel(resultCard.id, resultCard.patientId, resultCard.listId, patients, lists, anaesthetists)
                    : undefined
                }
              />
            </Pane>
          </div>
        </div>
      )}
    </DemoSurface>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const pillButton: React.CSSProperties = {
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  padding: '8px 14px',
  borderRadius: radius.pill,
  border: `1px solid ${neutral.lineStrong}`,
  background: neutral.surface,
  color: neutral.ink,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
}

const codeBlock: React.CSSProperties = {
  margin: 0,
  fontFamily: "'Spline Sans Mono', ui-monospace, monospace",
  fontSize: 11,
  lineHeight: 1.5,
  color: neutral.ink,
  background: neutral.sunken,
  borderRadius: radius.ctl,
  padding: 12,
  overflowX: 'auto',
  maxHeight: 320,
  whiteSpace: 'pre',
}

function MessageRow({
  message,
  active,
  statusLabel,
  onSelect,
  onReplay,
}: {
  message: CannedMessage
  active: boolean
  statusLabel?: { label: string; tone: 'ok' | 'warn' | 'err' | 'muted' }
  onSelect: () => void
  onReplay: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: neutral.surface,
        border: `1px solid ${active ? accent.base : neutral.line}`,
        borderRadius: radius.card,
        padding: '12px 14px',
      }}
    >
      <button type="button" onClick={onSelect} style={{ font: 'inherit', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: neutral.ink }}>{message.label}</span>
          <span className="mono" style={{ fontSize: 10.5, color: neutral.mist }}>{message.id}</span>
          {statusLabel !== undefined && <StatusPill {...statusLabel} />}
        </span>
        <span style={{ fontSize: 12, lineHeight: 1.45, color: neutral.slate }}>{message.description}</span>
      </button>
      <button
        type="button"
        onClick={onReplay}
        style={{ ...pillButton, flex: 'none', padding: '6px 12px', fontSize: 12.5 }}
      >
        <Play size={13} strokeWidth={2.5} aria-hidden />
        Replay
      </button>
    </div>
  )
}

function Pane({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: neutral.ink }}>{title}</div>
        {subtitle !== undefined && <div style={{ fontSize: 11, color: neutral.mist }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

// Decorative syntax-highlight tones for the raw HL7 segment names. Deliberately
// NOT the teal action colour (reserved for actions) and NOT crimson (identity):
// MSH stays ink; the rest are muted hues just to aid scanning.
const SEGMENT_TONES: Record<string, string> = {
  MSH: neutral.ink,
  SCH: '#6E56CF',
  AIS: '#C26A0E',
  PID: semantic.success.solid,
  NTE: neutral.slate,
}

function Hl7View({ raw }: { raw: string }) {
  const lines = raw.split(/\r\n|\r|\n/).filter((l) => l.trim() !== '')
  return (
    <div style={{ ...codeBlock, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {lines.map((line, i) => {
        const seg = line.slice(0, 3)
        const tone = SEGMENT_TONES[seg] ?? neutral.slate
        return (
          <div key={i} style={{ display: 'flex', gap: 8 }}>
            <span style={{ flex: 'none', fontWeight: 700, color: tone }}>{seg}</span>
            <span style={{ color: neutral.ink, wordBreak: 'break-all' }}>{line.slice(3)}</span>
          </div>
        )
      })}
    </div>
  )
}

function EffectView({
  status,
  displayLabel,
  failureReason,
  cardLabel,
}: {
  status?: string
  displayLabel?: string
  failureReason?: string
  cardLabel?: string
}) {
  if (status === undefined) {
    return <div style={{ fontSize: 12.5, color: neutral.mist, padding: '4px 0' }}>Not replayed yet. Click Replay to apply this message.</div>
  }
  const tone: 'ok' | 'warn' | 'err' | 'muted' =
    status === 'processed' ? 'ok' : status === 'deadLetter' ? 'err' : status === 'manualIntervention' || status === 'retrying' ? 'warn' : 'muted'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <StatusPill label={displayLabel ?? status} tone={tone} />
      {cardLabel !== undefined && (
        <div style={{ fontSize: 12.5, color: neutral.ink, background: neutral.sunken, borderRadius: radius.ctl, padding: '8px 10px' }}>{cardLabel}</div>
      )}
      {failureReason !== undefined && status !== 'processed' && (
        <div style={{ fontSize: 12, color: tone === 'err' ? semantic.error.onTint : semantic.warning.onTint }}>{failureReason}</div>
      )}
      {status === 'processed' && (
        <div style={{ fontSize: 11.5, color: neutral.mist }}>Open the Anaesthetist Mobile App to see it live on the list.</div>
      )}
    </div>
  )
}

function StatusPill({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'err' | 'muted' }) {
  const colours =
    tone === 'ok'
      ? { bg: semantic.success.tint, fg: semantic.success.onTint }
      : tone === 'warn'
        ? { bg: semantic.warning.tint, fg: semantic.warning.onTint }
        : tone === 'err'
          ? { bg: semantic.error.tint, fg: semantic.error.onTint }
          : { bg: neutral.sunken, fg: neutral.slate }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap', background: colours.bg, color: colours.fg }}>
      {label}
    </span>
  )
}

function Callout({ tone, title, children }: { tone: 'warn' | 'info'; title: string; children: React.ReactNode }) {
  const colours =
    tone === 'warn'
      ? { bg: semantic.warning.tint, fg: semantic.warning.onTint, border: semantic.warning.solid }
      : { bg: neutral.sunken, fg: neutral.slate, border: neutral.lineStrong }
  const Icon = tone === 'warn' ? AlertTriangle : Info
  return (
    <div style={{ display: 'flex', gap: 10, background: colours.bg, border: `1px solid ${colours.border}44`, borderRadius: radius.card, padding: '12px 14px' }}>
      <Icon size={16} strokeWidth={2} aria-hidden style={{ flex: 'none', marginTop: 2, color: colours.fg }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: colours.fg }}>{title}</span>
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: colours.fg }}>{children}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusLabelFor(
  controlId: string,
  messages: Record<string, { messageControlId: string; status: string; attempts: number; updatedAtISO?: string }>,
): { label: string; tone: 'ok' | 'warn' | 'err' | 'muted' } | undefined {
  const row = Object.values(messages)
    .filter((m) => m.messageControlId === controlId)
    .sort((a, b) => (b.updatedAtISO ?? '').localeCompare(a.updatedAtISO ?? ''))[0]
  if (row === undefined) return undefined
  const tone: 'ok' | 'warn' | 'err' | 'muted' =
    row.status === 'processed' ? 'ok' : row.status === 'deadLetter' ? 'err' : row.status === 'manualIntervention' || row.status === 'retrying' ? 'warn' : 'muted'
  return { label: statusSentence(row.status, row.attempts), tone }
}

function statusSentence(status: string, attempts: number): string {
  switch (status) {
    case 'processed':
      return attempts > 1 ? `Retried · processed (attempt ${attempts})` : 'Processed'
    case 'retrying':
      return `Retrying (attempt ${attempts})`
    case 'deadLetter':
      return `Dead-letter after ${attempts} attempts`
    case 'manualIntervention':
      return 'Manual intervention'
    case 'duplicate':
      return 'Duplicate (deduped)'
    default:
      return status
  }
}

function cardEffectLabel(
  cardId: string,
  patientId: string,
  listId: string,
  patients: Record<string, { name: string }>,
  lists: Record<string, { anaesthetistId: string; dateISO: string; session: string }>,
  anaesthetists: Record<string, { name: string }>,
): string {
  const patient = patients[patientId]?.name ?? patientId
  const list = lists[listId]
  const who = list !== undefined ? anaesthetists[list.anaesthetistId]?.name ?? list.anaesthetistId : ''
  const when = list !== undefined ? `${list.dateISO} ${list.session}` : ''
  return `Card ${cardId} · ${patient} · ${who} ${when}`.trim()
}
