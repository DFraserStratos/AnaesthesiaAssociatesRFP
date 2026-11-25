/**
 * Pairing preferences on a profile (catch-up Phase 17; US-13.6.3, US-13.6.4,
 * OQ-43 / D44). One component for both sides of the record: the surgeon
 * profile (`perspective="surgeon"`) and the Admin anaesthetist record
 * (`perspective="anaesthetist"`) read the same entries. Private to the office:
 * Admin only, never imported by an anaesthetist surface (officePrivacy.test.ts).
 * Every kind word and side sentence comes from the one label set.
 *
 * Build plan Phase 54: `layout="panel"` lays the same entries out for a record
 * page's side panel (412px): a card titled with the active count, Add in its
 * heading, the privacy line, rows grouped Not preferred then Preferred, the
 * first three with See all expanding in place, and the ended entries folded
 * away. The default `section` keeps today's look (the surgeon profile).
 */

import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PAIRING_LABELS, pairingSentence, pairingsOnProfile } from '../../../../domain/pairingPreferences'
import type { PairingKind, PairingPreference } from '../../../../domain/types'
import { neutral, radius } from '../../../../theme/tokens'
import { useAppStore, type Actor } from '../../../../store'
import { Button } from '../../../../shared'
import { anaesthetistRecordPath, surgeonProfilePath } from '../../peoplePaths'
import { Card, CountBadge, Disclosure, TextAction } from '../../../../shared/ui'
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
  /** `panel`: the record page's side panel look (Phase 54). Default `section`, today's look. */
  layout?: 'section' | 'panel'
}

/** Rows a panel shows before See all. */
const PANEL_LIMIT = 3

export function PairingSection({ perspective, subjectId, actor, layout = 'section' }: Props) {
  const entries = usePairingEntries()
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const [adding, setAdding] = useState(false)
  const [ending, setEnding] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
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

  const sheets = (
    <>
      {adding && <PairingAddSheet perspective={perspective} subjectId={subjectId} actor={actor} onClose={() => setAdding(false)} />}
      {endingEntry !== undefined && (
        <PairingEndSheet entry={endingEntry} sentence={sentenceOf(endingEntry)} actor={actor} onClose={() => setEnding(null)} />
      )}
    </>
  )

  if (layout === 'panel') {
    const active = [...groups.notPreferred, ...groups.preferred]
    const shown = expanded ? active : active.slice(0, PANEL_LIMIT)
    return (
      <Card
        shot="pairing-section"
        data-pairing-layout="panel"
        title={<>Pairings <CountBadge count={active.length} hideAtZero={false} mono srNoun="pairing preferences" /></>}
        action={<TextAction size="sm" flush onClick={() => setAdding(true)} shot="pairing-add">{PAIRING_LABELS.add}</TextAction>}
      >
        <div style={{ fontSize: 12, color: neutral.mist }}>{PAIRING_LABELS.privacyNote}</div>
        {active.length === 0 ? (
          <span style={{ fontSize: 13, color: neutral.mist }}>No pairing preferences recorded.</span>
        ) : (
          (['NOT_PREFERRED', 'PREFERRED'] as const).map((kind) => {
            const rows = shown.filter((e) => e.kind === kind)
            if (rows.length === 0) return null
            return (
              <div key={kind} data-pairing-group={kind} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>{kind === 'NOT_PREFERRED' ? <NotPreferredPill /> : <PreferredPill />}</div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
                  {rows.map((e, i) => (
                    <PanelRow key={e.id} entry={e} first={i === 0} counterpart={counterpart(e)} sentence={sentenceOf(e)} onEnd={() => setEnding(e.id)} />
                  ))}
                </ul>
              </div>
            )
          })
        )}
        {active.length > shown.length && (
          <TextAction size="sm" flush onClick={() => setExpanded(true)} shot="pairing-section-all">{`See all ${active.length}`}</TextAction>
        )}
        {expanded && active.length > PANEL_LIMIT && (
          <TextAction size="sm" flush onClick={() => setExpanded(false)} shot="pairing-section-fewer">Show fewer</TextAction>
        )}
        {groups.ended.length > 0 && (
          <Disclosure shot="pairing-ended" summary={`${PAIRING_LABELS.ended} (${groups.ended.length})`} gap={6}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
              {groups.ended.map((e, i) => (
                <li key={e.id} data-pairing={e.id} style={{ padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}`, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12, color: neutral.mist }}>
                  <TextAction size="sm" flush to={counterpart(e).to}>{counterpart(e).name}</TextAction>
                  <span style={{ color: neutral.slate }}>{sentenceOf(e)}</span>
                  <span>{endedLine(e.endedBy, e.endedAtISO ?? e.addedAtISO)}{e.endReason !== undefined && e.endReason !== '' ? ` · ${e.endReason}` : ''}</span>
                </li>
              ))}
            </ul>
          </Disclosure>
        )}
        {sheets}
      </Card>
    )
  }

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
        <Disclosure shot="pairing-ended" summary={`${PAIRING_LABELS.ended} (${groups.ended.length})`} gap={10} style={{ borderTop: `1px solid ${neutral.line}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
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
        </Disclosure>
      )}

      {sheets}
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
      <TextAction size="sm" onClick={onEnd} label={`${PAIRING_LABELS.end} ${sentence}`} style={{ flex: 'none', padding: '2px 0' }}>
        {PAIRING_LABELS.end}
      </TextAction>
    </div>
  )
}

/** One active entry in the panel: the counterpart, the side sentence, the reason and End. */
function PanelRow({ entry, first, counterpart, sentence, onEnd }: { entry: PairingPreference; first: boolean; counterpart: { name: string; to: string }; sentence: string; onEnd: () => void }) {
  return (
    <li data-pairing={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderTop: first ? 'none' : `1px solid ${neutral.line}` }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextAction size="sm" flush to={counterpart.to}>{counterpart.name}</TextAction>
        <span style={{ fontSize: 12, color: neutral.slate }}>{sentence}</span>
        {entry.reason !== undefined && <span style={{ fontSize: 12, color: neutral.mist }}>{entry.reason}</span>}
      </div>
      <TextAction size="sm" flush onClick={onEnd} label={`${PAIRING_LABELS.end} ${sentence}`} style={{ flex: 'none' }}>
        {PAIRING_LABELS.end}
      </TextAction>
    </li>
  )
}
