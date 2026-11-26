/**
 * Sources (build plan Phase 68; D117; docs/explorations/intake-ideas.html #sources): where arrivals come from,
 * one line each (its name, its protocol or address, its state in words), and the promise that Intake is
 * inbound only. Phase 71 rebuilds this view with each source's traffic and the message log.
 */

import { Card } from '../../../../shared/ui'
import { useIntakeSources } from '../../../../store/intakeSelectors'
import { fontFamily, neutral, radius, semantic, type as typeScale } from '../../../../theme/tokens'
import { SOURCE_STATE_WORDS } from './feed/feedText'

export function SourcesView() {
  const sources = useIntakeSources()
  return (
    <div data-shot="intake-sources" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card padding="panel" title="Sources" style={{ maxWidth: 720 }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {sources.map((s, i) => {
            const detail = s.kind === 'mailbox' ? s.address : s.protocol
            const live = s.state !== 'notConnected'
            return (
              <li
                key={s.id}
                data-source-id={s.id}
                data-source-kind={s.kind}
                data-source-state={s.state}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${neutral.sunken}`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: typeScale.data.size, lineHeight: `${typeScale.data.line}px`, fontWeight: 600, color: neutral.ink }}>{s.name}</div>
                  {detail !== undefined && detail !== '' && (
                    <div style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate, ...(s.kind === 'mailbox' ? { fontFamily: fontFamily.mono } : {}) }}>
                      {detail}
                    </div>
                  )}
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: typeScale.small.size, color: live ? neutral.ink : neutral.mist, whiteSpace: 'nowrap' }}>
                  <span aria-hidden style={{ width: 7, height: 7, borderRadius: radius.pill, background: live ? semantic.success.solid : neutral.lineStrong }} />
                  {SOURCE_STATE_WORDS[s.state].charAt(0).toUpperCase() + SOURCE_STATE_WORDS[s.state].slice(1)}
                </span>
              </li>
            )
          })}
        </ul>
        <p style={{ margin: 0, fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate }}>
          Inbound only: nothing is ever sent back to a hospital or the rooms.
        </p>
      </Card>
    </div>
  )
}
