/**
 * Per-hospital feed mapping (`/demo/integrations/mapping`). Moved from Admin
 * Integrations' Feed config tab in catch-up Phase 34 (RV-14): Future scope, on
 * the demo surface, in its plain look. The mapping fix still recovers a
 * dead-lettered message (the Christchurch Public example, not integrated today).
 */

import { useMemo, useState } from 'react'
import { accent, fontFamily, neutral, radius } from '../../../theme/tokens'
import { OFFICE_ACTOR, setFeedMapping, useAppStore } from '../../../store'
import { FEED, FEED_META } from '../../../domain/integrations'
import { FutureScopeChrome } from './FutureScopeChrome'

export function FutureScopeFeedMapping() {
  const feeds = useAppStore((s) => s.integrations.feeds)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const ordered = useMemo(() => Object.values(feeds).sort((a, b) => a.id.localeCompare(b.id)), [feeds])

  return (
    <FutureScopeChrome subtitle="Each hospital feed maps its own source fields to the domain. A wrong mapping is what a dead-lettered message needs fixed: correct it here and reprocess the message on the log.">
      <div data-shot="future-scope-mapping" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 12.5, color: neutral.slate, lineHeight: 1.5, maxWidth: 820 }}>
          The mappings genuinely differ (St George&rsquo;s sends the NHI in PID-2, Christchurch Public in PID-3).
          Christchurch Public is not integrated today: it is an example of a further feed (Future Work).
        </div>
        {ordered.map((feed) => {
          const meta = FEED_META[feed.id]
          return (
            <div key={feed.id} data-feed-id={feed.id} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{meta?.name ?? feed.id}</span>
                <span style={{ fontSize: 12, color: neutral.mist }}>
                  {hospitals[feed.hospitalId]?.name ?? feed.hospitalId} · {feed.transport === 'fhir' ? 'FHIR-native' : 'HL7 v2'}
                  {feed.id === FEED.cph ? ' · not integrated today' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(feed.fieldMapping).map(([key, value]) => (
                  <MappingRow key={key} feedId={feed.id} field={key} value={value} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </FutureScopeChrome>
  )
}

function MappingRow({ feedId, field, value }: { feedId: string; field: string; value: string }) {
  const [draft, setDraft] = useState(value)
  const changed = draft.trim() !== value
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, width: 130, color: neutral.ink }}>{field}</span>
      <span style={{ fontSize: 12, color: neutral.mist }}>←</span>
      <input
        value={draft}
        aria-label={`${field} mapping`}
        onChange={(e) => setDraft(e.target.value)}
        className="mono"
        style={{ font: 'inherit', fontFamily: fontFamily.mono, fontSize: 12.5, padding: '5px 9px', borderRadius: radius.ctl, border: `1px solid ${changed ? accent.base : neutral.lineStrong}`, background: neutral.surface, color: neutral.ink, width: 160 }}
      />
      <button
        type="button"
        disabled={!changed}
        onClick={() => setFeedMapping(useAppStore, OFFICE_ACTOR, feedId, field, draft.trim())}
        style={{ font: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '5px 12px', borderRadius: radius.ctl, border: 'none', background: changed ? accent.base : neutral.line, color: changed ? neutral.surface : neutral.mist, cursor: changed ? 'pointer' : 'default' }}
      >
        Save
      </button>
    </div>
  )
}
