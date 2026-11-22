import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Info, Play, Radio, RotateCcw, RotateCw } from 'lucide-react'
import { useDemoTriggerContext } from '../../shared/demoTriggers'
import { FutureScopeChrome } from './futureScope/FutureScopeChrome'
import { assessImportRow, matchingView, processMessage, useAppStore } from '../../store'
import { resetFramedDemo } from '../../shell/framedReset'
import { CHANGE_TYPE_LABELS, suggestionText } from '../../domain/intake'
import { neutral, accent, radius, semantic } from '../../theme/tokens'
import {
  CANNED_MESSAGES,
  FEED,
  FEED_META,
  isIntegratedFeed,
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
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const intake = useAppStore((s) => s.intake)

  const [feedId, setFeedId] = useState<string>(FEED.stg)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)

  const feed = feeds[feedId]
  const library = useMemo(() => CANNED_MESSAGES.filter((m) => m.feedId === feedId), [feedId])
  const selected = cannedMessage(selectedId ?? '') ?? library[0]
  // Publish the EFFECTIVE selection (the feed's first message until one is
  // clicked) so the Demo actions menu's "Fire hospital message" preselects it.
  useDemoTriggerContext('integrationsSim.selectedMessageId', selected?.id ?? '')

  const souter = anaesthetists[ANAE.souter]
  const practitioner = useMemo(
    () => (souter !== undefined ? { name: souter.name, hpiId: souter.hpiId } : undefined),
    [souter],
  )

  // Live drip: process each of the feed's messages ~1/sec, then stop. Only the
  // integrated hospitals stream (catch-up Phase 34, RV-16): Christchurch Public
  // is not integrated today, so its messages are fired by hand only.
  const canStream = isIntegratedFeed(feedId)
  useEffect(() => {
    if (!live || !canStream) return
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
  }, [live, canStream, library])

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

  // The row the message staged on the matching screen (catch-up Phase 33; RV-13: nothing is applied by itself).
  const staged = useMemo(() => {
    const rowId = row?.resultImportRowId
    if (rowId === undefined || intake.rows[rowId] === undefined) return undefined
    const state = { masters, schedule, intake }
    const assessment = assessImportRow(state, rowId)
    if (assessment === undefined) return undefined
    return { row: intake.rows[rowId]!, assessment, suggestion: suggestionText(matchingView(state), assessment) }
  }, [row, intake, masters, schedule])

  function replay() {
    if (selected === undefined) return
    setSelectedId(selected.id)
    processMessage(useAppStore, selected.id)
  }

  function resetSimulator() {
    resetFramedDemo({ clearHints: false })
    setFeedId(FEED.stg)
    setSelectedId(null)
    setLive(false)
    setConfirmingReset(false)
  }

  return (
    <FutureScopeChrome
      subtitle="Replay hospital messages through the mock integration pipeline, from source payload to translated FHIR. Fired messages land on Admin Intake as rows for the office to decide."
      maxWidth={1440}
    >
      <div
        data-testid="integration-workspace"
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(480px, 0.85fr) minmax(0, 1.15fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <aside
          data-testid="integration-inspector"
          style={{
            position: 'sticky',
            top: 68,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minWidth: 0,
            background: neutral.surface,
            border: `1px solid ${neutral.line}`,
            borderRadius: radius.panel,
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionLabel title="Hospital source" description="Choose the source feed to inspect." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
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
                      borderRadius: radius.ctl,
                      border: `1px solid ${activeFeed ? accent.base : neutral.line}`,
                      background: activeFeed ? accent.tint : neutral.bg,
                      padding: '9px 10px',
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 12.5, lineHeight: 1.25, fontWeight: 700, color: neutral.ink }}>{meta?.name}</span>
                    <span style={{ fontSize: 10.5, lineHeight: 1.3, fontWeight: 600, color: neutral.slate }}>
                      {meta?.transport === 'fhir' ? 'FHIR-native' : 'HL7 v2 · translated'}
                    </span>
                    {!isIntegratedFeed(id) && (
                      <span data-shot="integrations-cph-not-integrated" style={{ fontSize: 10.5, lineHeight: 1.3, color: neutral.mist }}>
                        Not integrated today · example of a further feed (Future Work)
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={!canStream}
                onClick={() => setLive((v) => !v)}
                style={{ ...pillButton, ...(canStream ? {} : { opacity: 0.5, cursor: 'default' }), background: live ? semantic.warning.tint : neutral.surface, borderColor: live ? semantic.warning.solid : neutral.lineStrong, color: live ? semantic.warning.onTint : neutral.ink }}
              >
                <Radio size={14} strokeWidth={2.5} aria-hidden />
                {live ? 'Streaming live feed...' : 'Start live feed'}
              </button>
              {!confirmingReset && (
                <button type="button" onClick={() => setConfirmingReset(true)} style={pillButton}>
                  <RotateCcw size={14} strokeWidth={2.5} aria-hidden />
                  Reset demo data
                </button>
              )}
            </div>
            {confirmingReset ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: semantic.warning.tint, borderRadius: radius.ctl, padding: 8 }}>
                <span style={{ flex: 1, minWidth: 180, fontSize: 11.5, color: semantic.warning.onTint }}>
                  Reset all demo apps to the pristine seed?
                </span>
                <button
                  type="button"
                  onClick={resetSimulator}
                  style={{ ...pillButton, padding: '6px 10px', background: accent.base, borderColor: accent.base, color: '#FFFFFF' }}
                >
                  Confirm reset
                </button>
                <button type="button" onClick={() => setConfirmingReset(false)} style={{ ...pillButton, padding: '6px 10px' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <span style={{ fontSize: 11.5, color: neutral.mist }}>
                {canStream ? 'Live feed processes one message per second.' : 'Christchurch Public is not integrated today, so it has no live feed. Replay its messages one at a time.'}
              </span>
            )}
          </div>

          {selected !== undefined && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>
                    Selected message
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{selected.label}</div>
                </div>
                <button type="button" data-shot="integrations-replay" onClick={replay} style={{ ...pillButton, flex: 'none', background: accent.base, borderColor: accent.base, color: '#FFFFFF' }}>
                  <RotateCw size={14} strokeWidth={2.5} aria-hidden />
                  Replay
                </button>
              </div>
              {selected.transport !== 'fhir' && (
                <Pane shot="integrations-raw-hl7" title={`1 · Raw HL7 v2 · ${FEED_META[selected.feedId]?.name ?? 'Hospital feed'}`}>
                  <Hl7View raw={selected.raw ?? ''} />
                </Pane>
              )}
              <Pane shot="integrations-fhir" title={selected.transport === 'fhir' ? 'FHIR R4 · Native source' : '2 · Translated FHIR R4'}>
                <pre style={codeBlock}>{fhirJson}</pre>
              </Pane>
              <Pane shot="integrations-schedule-change" title={selected.transport === 'fhir' ? 'Sent to matching' : '3 · Sent to matching'}>
                <EffectView
                  status={row?.status}
                  displayLabel={row !== undefined ? statusSentence(row.status, row.attempts, row.resultImportRowId !== undefined) : undefined}
                  failureReason={row?.failureReason}
                  staged={
                    staged !== undefined
                      ? {
                          rowId: staged.row.id,
                          changeType: CHANGE_TYPE_LABELS[staged.assessment.changeType],
                          suggestion: staged.suggestion,
                          wording: staged.row.incoming.procedure?.text,
                        }
                      : undefined
                  }
                />
              </Pane>
            </>
          )}
        </aside>

        <section data-testid="integration-library" style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
            <SectionLabel title="Message library" description="Select a message to inspect it in the rail, or replay it directly." />
            <span className="mono" style={{ flex: 'none', fontSize: 11, color: neutral.slate, background: neutral.sunken, borderRadius: radius.pill, padding: '3px 9px' }}>
              {library.length} messages
            </span>
          </div>
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
        </section>
      </div>

      {/* Feed configuration is supporting reference material, so it follows
          the message demo rather than interrupting the primary story. */}
      {feed !== undefined && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>
              Feed mapping
            </div>
            <div style={{ fontSize: 12, color: neutral.slate }}>
              Fields used to translate this hospital's source message.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {Object.entries(feed.fieldMapping).map(([k, v]) => (
              <span key={k} className="mono" style={{ fontSize: 11, background: neutral.sunken, color: neutral.slate, borderRadius: 999, padding: '2px 9px' }}>
                {k} ← {v}
              </span>
            ))}
          </div>
        </div>
      )}

      <Callout tone="info" title="Target state: FHIR-first, via the Digital Services Hub">
        In scope today, St George&rsquo;s and Southern Cross send their files through an integration and the office
        imports each one on Admin Intake, where every row waits for its decision; there is no automatic sync. Health
        NZ&rsquo;s direction is FHIR-first: this demo translates each hospital&rsquo;s HL7 v2 into FHIR R4 (per-hospital
        field mapping) and treats a FHIR-native feed as the target, with near real time, per-message processing. That
        is Future scope, shown for discussion. Patient identity is validated (NHI format and check digit) and deduped
        into a single record, and provider identity carries the HPI. Looking up an NHI is in scope (Phase 40a); a
        production build would confirm identity against the NHI FHIR API and authenticate to the Hub with Keycloak
        (referenced here, not implemented).
      </Callout>
    </FutureScopeChrome>
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
  maxHeight: 120,
  whiteSpace: 'pre',
}

function SectionLabel({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: neutral.slate }}>{description}</div>
    </div>
  )
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

function Pane({ title, subtitle, shot, children }: { title: string; subtitle?: string; shot?: string; children: React.ReactNode }) {
  return (
    <div
      data-shot={shot}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
        background: neutral.bg,
        border: `1px solid ${neutral.line}`,
        borderRadius: radius.card,
        padding: 8,
      }}
    >
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
  staged,
}: {
  status?: string
  displayLabel?: string
  failureReason?: string
  staged?: { rowId: string; changeType: string; suggestion: string; wording?: string }
}) {
  if (status === undefined) {
    return <div style={{ fontSize: 12.5, color: neutral.mist, padding: '4px 0' }}>Not replayed yet. Click Replay to send this message to matching.</div>
  }
  const tone: 'ok' | 'warn' | 'err' | 'muted' =
    status === 'processed' ? 'ok' : status === 'deadLetter' ? 'err' : status === 'retrying' ? 'warn' : 'muted'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <StatusPill label={displayLabel ?? status} tone={tone} />
      {staged !== undefined && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: neutral.ink, background: neutral.sunken, borderRadius: radius.ctl, padding: '8px 10px' }}>
          <span>
            <strong>{staged.changeType}</strong> · row <span className="mono">{staged.rowId}</span>
          </span>
          <span>Suggested: {staged.suggestion}</span>
          <span className="mono" style={{ color: neutral.slate }}>{staged.wording !== undefined ? `"${staged.wording}"` : 'No wording supplied'}</span>
        </div>
      )}
      {failureReason !== undefined && status !== 'processed' && (
        <div style={{ fontSize: 12, color: tone === 'err' ? semantic.error.onTint : semantic.warning.onTint }}>{failureReason}</div>
      )}
      {status === 'processed' && (
        <div style={{ fontSize: 11.5, color: neutral.mist }}>Nothing is applied automatically. Open Admin, Intake to decide.</div>
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
  messages: Record<string, { messageControlId: string; status: string; attempts: number; updatedAtISO?: string; resultImportRowId?: string }>,
): { label: string; tone: 'ok' | 'warn' | 'err' | 'muted' } | undefined {
  const row = Object.values(messages)
    .filter((m) => m.messageControlId === controlId)
    .sort((a, b) => (b.updatedAtISO ?? '').localeCompare(a.updatedAtISO ?? ''))[0]
  if (row === undefined) return undefined
  const tone: 'ok' | 'warn' | 'err' | 'muted' =
    row.status === 'processed' ? 'ok' : row.status === 'deadLetter' ? 'err' : row.status === 'retrying' ? 'warn' : 'muted'
  return { label: statusSentence(row.status, row.attempts, row.resultImportRowId !== undefined), tone }
}

function statusSentence(status: string, attempts: number, sentToMatching = false): string {
  switch (status) {
    case 'processed':
      if (sentToMatching) return attempts > 1 ? `Retried · sent to matching (attempt ${attempts})` : 'Sent to matching'
      return attempts > 1 ? `Retried · processed (attempt ${attempts})` : 'Processed'
    case 'retrying':
      return `Retrying (attempt ${attempts})`
    case 'deadLetter':
      return `Dead-letter after ${attempts} attempts`
    case 'duplicate':
      return 'Duplicate (deduped)'
    default:
      return status
  }
}

