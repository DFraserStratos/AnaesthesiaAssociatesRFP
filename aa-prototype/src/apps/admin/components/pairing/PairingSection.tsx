/**
 * Pairing preferences on a profile (catch-up Phase 17; US-13.6.3, US-13.6.4,
 * OQ-43 / D44). One component for both sides of the record: the surgeon
 * profile (`perspective="surgeon"`) and the Admin anaesthetist record
 * (`perspective="anaesthetist"`) read the same entries. Private to the office:
 * Admin only, never imported by an anaesthetist surface (officePrivacy.test.ts).
 * Every kind word and side sentence comes from the one label set.
 */

import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { PAIRING_LABELS, pairingSentence, pairingsOnProfile } from '../../../../domain/pairingPreferences'
import type { PairingKind, PairingPreference } from '../../../../domain/types'
import { neutral, radius } from '../../../../theme/tokens'
import { useAppStore, type Actor } from '../../../../store'
import { Button } from '../../../../shared'
import { anaesthetistRecordPath, surgeonProfilePath } from '../../mastersPaths'
import { textActionStyle } from '../../tableChrome'
import { pairingSubject, type PairingPerspective } from './perspective'
import { NotPreferredPill, PreferredPill } from './Pills'
import { PairingAddSheet } from './PairingAddSheet'
import { PairingEndSheet } from './PairingEndSheet'
import { addedLine, endedLine } from './pairingFormat'
import { usePairingEntries } from './useOfficePairings'

interface Props {
  perspective: PairingPerspective
  /** The surgeon id or the anaesthetist's registration number. */
  subjectId: string
  actor: Actor
}

export function PairingSection({ perspective, subjectId, actor }: Props) {
  const entries = usePairingEntries()
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const [adding, setAdding] = useState(false)
  const [ending, setEnding] = useState<string | null>(null)
  const titleId = useId()

  const groups = pairingsOnProfile(entries, pairingSubject(perspective, subjectId))
  const endingEntry = ending !== null ? entries[ending] : undefined

  const names = (e: PairingPreference) => ({
    anaesthetist: anaesthetists[e.anaesthetistId]?.name ?? e.anaesthetistId,
    surgeon: surgeons[e.surgeonId]?.name ?? e.surgeonId,
  })
  const sentenceOf = (e: PairingPreference) => {
    const n = names(e)
    return pairingSentence(e.kind, e.raisedBy, n.anaesthetist, n.surgeon)
  }
  const counterpart = (e: PairingPreference) =>
    perspective === 'surgeon'
      ? { name: names(e).anaesthetist, to: anaesthetistRecordPath(e.anaesthetistId) }
      : { name: names(e).surgeon, to: surgeonProfilePath(e.surgeonId) }

  return (
    <section
      data-shot="pairing-section"
      aria-labelledby={titleId}
      style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 id={titleId} style={{ margin: 0, fontSize: 17, lineHeight: '24px', fontWeight: 600 }}>{PAIRING_LABELS.section}</h2>
          <div style={{ fontSize: 12.5, color: neutral.mist, marginTop: 2 }}>{PAIRING_LABELS.privacyNote}</div>
        </div>
        <Button variant="secondary" onClick={() => setAdding(true)}>{PAIRING_LABELS.add}</Button>
      </div>

      {(['NOT_PREFERRED', 'PREFERRED'] as const).map((kind) => (
        <KindGroup
          key={kind}
          kind={kind}
          entries={kind === 'NOT_PREFERRED' ? groups.notPreferred : groups.preferred}
          renderRow={(e) => (
            <ActiveRow key={e.id} entry={e} counterpart={counterpart(e)} sentence={sentenceOf(e)} onEnd={() => setEnding(e.id)} />
          )}
        />
      ))}

      {groups.ended.length > 0 && (
        <details data-shot="pairing-ended" style={{ borderTop: `1px solid ${neutral.line}`, paddingTop: 14 }}>
          <summary className="aa-disclosure" style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: neutral.slate, listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ChevronRight size={14} aria-hidden className="aa-disclosure-chevron" />
            {PAIRING_LABELS.ended} ({groups.ended.length})
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10 }}>
            {groups.ended.map((e, i) => (
              <div key={e.id} data-pairing={e.id} style={{ padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}`, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Link to={counterpart(e).to} className="aa-table-entity-link" style={{ fontSize: 13.5, color: neutral.slate }}>
                    <span className="aa-table-entity-link-title">{counterpart(e).name}</span>
                  </Link>
                  <span style={{ fontSize: 11, color: neutral.mist }}>{PAIRING_LABELS.kind[e.kind]}</span>
                </div>
                <div style={{ fontSize: 13, color: neutral.slate }}>{sentenceOf(e)}</div>
                <div style={{ fontSize: 12, color: neutral.mist }}>
                  {endedLine(e.endedBy, e.endedAtISO ?? e.addedAtISO)}
                  {e.endReason !== undefined && e.endReason !== '' ? ` · ${e.endReason}` : ''}
                </div>
                <div style={{ fontSize: 12, color: neutral.mist }}>{addedLine(e.addedBy, e.addedAtISO)}{e.reason !== undefined ? ` · ${e.reason}` : ''}</div>
              </div>
            ))}
          </div>
        </details>
      )}

      {adding && <PairingAddSheet perspective={perspective} subjectId={subjectId} actor={actor} onClose={() => setAdding(false)} />}
      {endingEntry !== undefined && (
        <PairingEndSheet entry={endingEntry} sentence={sentenceOf(endingEntry)} actor={actor} onClose={() => setEnding(null)} />
      )}
    </section>
  )
}

function KindGroup({ kind, entries, renderRow }: { kind: PairingKind; entries: PairingPreference[]; renderRow: (e: PairingPreference) => ReactNode }) {
  return (
    <div data-pairing-group={kind} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: neutral.ink }}>
        {kind === 'NOT_PREFERRED' ? <NotPreferredPill /> : <PreferredPill />}
        {entries.length > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: neutral.mist }}>{entries.length}</span>}
      </h3>
      {entries.length === 0 ? (
        <div style={{ fontSize: 12.5, color: neutral.mist }}>{PAIRING_LABELS.emptyGroup}</div>
      ) : (
        <div style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, overflow: 'hidden' }}>{entries.map(renderRow)}</div>
      )}
    </div>
  )
}

function ActiveRow({ entry, counterpart, sentence, onEnd }: { entry: PairingPreference; counterpart: { name: string; to: string }; sentence: string; onEnd: () => void }) {
  return (
    <div data-pairing={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '12px 14px', borderTop: `1px solid ${neutral.line}`, marginTop: -1 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Link className="aa-table-entity-link" to={counterpart.to} style={{ fontSize: 14 }}>
          <span className="aa-table-entity-link-title">{counterpart.name}</span>
        </Link>
        <div style={{ fontSize: 13, color: neutral.ink }}>{sentence}</div>
        <div style={{ fontSize: 13, color: entry.reason !== undefined ? neutral.slate : neutral.mist }}>
          {entry.reason ?? PAIRING_LABELS.noReason}
        </div>
        <div style={{ fontSize: 12, color: neutral.mist }}>{addedLine(entry.addedBy, entry.addedAtISO)}</div>
      </div>
      <button
        type="button"
        onClick={onEnd}
        aria-label={`${PAIRING_LABELS.end} ${sentence}`}
        style={{ ...textActionStyle, flex: 'none', padding: '2px 0' }}
      >
        {PAIRING_LABELS.end}
      </button>
    </div>
  )
}
