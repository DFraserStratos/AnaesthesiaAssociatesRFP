/**
 * The version track (build plan Phase 69, Work item 3; docs/explorations/intake-ideas.html #reco "the lifeline", #idea1
 * mock A "This List so far"): a held List's versions as one line of stops, each with its source mark and its day
 * ("Rooms PDF 28 Oct", "Rooms PDF re-sent 12 Nov", "St George's now"), the List as it stands marked current and the
 * arrival on the bench marked proposed: a hollow warning ring at the end of a dashed join while it waits. Reads
 * `useVersionStops`; draws nothing for an arrival with no held List.
 */

import { PencilLine, Repeat } from 'lucide-react'
import type { ArrivalItem } from '../../../../../../domain/intake/arrivals'
import { stampText } from '../../../../../../shared/format'
import { Eyebrow, Pill, visuallyHidden } from '../../../../../../shared/ui'
import { neutral, radius, semantic, type as typeScale } from '../../../../../../theme/tokens'
import { SourceMark } from '../../feed/SourceMark'
import { useVersionStops, type VersionStop } from './updateReads'

/** The stop's day ("28 Oct"), or "now" for the arrival waiting on the bench. */
function whenText(stop: VersionStop): string {
  if (stop.pending) return 'now'
  return stop.atISO === '' ? '' : stampText(stop.atISO.slice(0, 10), { weekday: false })
}

function Dot({ stop }: { stop: VersionStop }) {
  const fill = stop.pending ? neutral.surface : stop.current ? neutral.ink : neutral.slate
  const ring = stop.pending ? `inset 0 0 0 2px ${semantic.warning.solid}` : stop.proposed ? `0 0 0 2px ${neutral.surface}, 0 0 0 3.5px ${neutral.lineStrong}` : undefined
  return <span aria-hidden style={{ width: 10, height: 10, borderRadius: radius.pill, background: fill, flex: 'none', ...(ring !== undefined ? { boxShadow: ring } : {}) }} />
}

function StopSource({ stop }: { stop: VersionStop }) {
  if (stop.source.kind === 'mark') return <SourceMark source={stop.source.mark} />
  const Icon = stop.source.recurring ? Repeat : PencilLine
  return (
    <Pill tone="neutral" size="sm" variant="outline" leading={<Icon size={10} strokeWidth={2.2} aria-hidden />} data-source-kind="office" style={{ flex: 'none' }}>
      {stop.source.label}
    </Pill>
  )
}

export function VersionTrack({ arrival, listId, shot = 'intake-version-track' }: { arrival: ArrivalItem; listId: string | undefined; shot?: string }) {
  const stops = useVersionStops(listId, arrival)
  if (stops.length === 0) return null
  return (
    <div
      data-shot={shot}
      data-list-id={listId}
      style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 14, rowGap: 6, padding: '9px 14px', background: neutral.bg, borderRadius: radius.ctl }}
    >
      <Eyebrow as="h3" style={{ margin: 0, flex: 'none' }}>
        This List so far
      </Eyebrow>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 6, rowGap: 6, minWidth: 0 }}>
        {stops.map((stop, i) => {
          const when = whenText(stop)
          return (
              <li
                key={stop.key}
                data-version-kind={stop.kind}
                data-proposed={stop.proposed ? 'true' : 'false'}
                data-current={stop.current ? 'true' : 'false'}
                style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontSize: typeScale.captionSm.size, lineHeight: `${typeScale.captionSm.line}px`, color: neutral.slate }}
              >
                {i > 0 && <span aria-hidden style={{ width: 26, margin: '0 2px', borderTop: `1.5px ${stop.pending ? 'dashed' : 'solid'} ${neutral.lineStrong}` }} />}
                <Dot stop={stop} />
                <StopSource stop={stop} />
                {stop.resent && <span style={{ color: neutral.ink, fontWeight: 600 }}>re-sent</span>}
                {when !== '' && <span style={stop.pending ? { color: semantic.warning.onTint, fontWeight: 600 } : undefined}>{when}</span>}
                {stop.current && <span style={{ color: neutral.mist }}>· current</span>}
                {stop.proposed && <span style={visuallyHidden}>{stop.pending ? ', proposed: this arrival, not yet decided' : ', this arrival'}</span>}
              </li>
          )
        })}
      </ol>
    </div>
  )
}
