/**
 * Where an arrival came from, as a quiet mark on its item and its file's heading (build plan Phase 68;
 * docs/explorations/intake-ideas.html #reco: "the source is a mark, not a tab"). A hospital's feed is
 * the neutral tint with a building; the rooms' PDF the neutral outline with a page, "by hand" when the
 * office added it. Never crimson, never a status colour: the kind pill beside it carries the meaning.
 */

import { Building2, FileText } from 'lucide-react'
import type { ArrivalSourceMark } from '../../../../domain/intake/arrivals'
import { Pill } from '../../../../shared/ui'

export function SourceMark({ source, size = 'sm' }: { source: ArrivalSourceMark; size?: 'sm' | 'md' }) {
  const icon = size === 'sm' ? 10 : 12
  const label = source.kind === 'rooms' && source.byHand === true ? `${source.label} · by hand` : source.label
  return (
    <Pill
      tone="neutral"
      size={size}
      variant={source.kind === 'rooms' ? 'outline' : 'tint'}
      leading={source.kind === 'rooms' ? <FileText size={icon} strokeWidth={2.2} aria-hidden /> : <Building2 size={icon} strokeWidth={2.2} aria-hidden />}
      {...(source.kind === 'rooms' && source.senderEmail !== undefined ? { title: source.senderEmail } : {})}
      data-source-kind={source.kind}
      style={{ minWidth: 0, flex: 'none' }}
    >
      {label}
    </Pill>
  )
}
