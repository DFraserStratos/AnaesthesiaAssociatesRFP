import type { ReactNode } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import { Eyebrow } from './Eyebrow'
import type { DataAttributes } from './Field'

export type StatTileVariant = 'quiet' | 'outlined'

/**
 * A summary figure tile (UI unification U6, group U31). Two looks, both from the mockups and kept
 * apart on purpose: `quiet` is the Web Dashboard tile (`neutral.bg`, radius 10, `12px 14px`, mono
 * 24/700, `Web Dashboard.dc.html` 116 to 119); `outlined` is the Admin Review tile (white, `line`,
 * `radius.md` 12, `14px 16px`, mono 22/700, `Admin Review.dc.html` 68 to 71). The label is the shared
 * `Eyebrow`. `pill` is the quiet tile's success pill beside the figure; `sub` a mist line under it;
 * `tone="warning"` colours the figure (Review's flags).
 */
export function StatTile({
  variant,
  label,
  value,
  sub,
  pill,
  tone,
  shot,
  ...data
}: {
  variant: StatTileVariant
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  pill?: ReactNode
  tone?: 'warning'
  shot?: string
} & DataAttributes) {
  const figureColour = tone === 'warning' ? semantic.warning.onTint : undefined
  if (variant === 'quiet') {
    return (
      <div {...data} data-shot={shot} style={{ background: neutral.bg, borderRadius: radius.ctl, padding: '12px 14px' }}>
        <Eyebrow>{label}</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <span className="mono" style={{ fontSize: 24, fontWeight: 700, ...(figureColour !== undefined ? { color: figureColour } : {}) }}>{value}</span>
          {pill !== undefined && (
            <span style={{ fontSize: 11, fontWeight: 600, color: semantic.success.onTint, background: semantic.success.tint, borderRadius: radius.pill, padding: '2px 7px' }}>{pill}</span>
          )}
        </div>
        {sub !== undefined && <div style={{ fontSize: 11, color: neutral.mist, marginTop: 4 }}>{sub}</div>}
      </div>
    )
  }
  return (
    <div {...data} data-shot={shot} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.md, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Eyebrow as="span">{label}</Eyebrow>
      <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: figureColour ?? neutral.ink }}>{value}</span>
      {sub !== undefined && <span style={{ fontSize: 11, color: neutral.mist }}>{sub}</span>}
      {pill !== undefined && (
        <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, color: semantic.success.onTint, background: semantic.success.tint, borderRadius: radius.pill, padding: '2px 7px' }}>{pill}</span>
      )}
    </div>
  )
}
