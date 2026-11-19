/**
 * The scale banner (catch-up Phase 43; US-15.0.4): harness chrome under the
 * harness bar while the full-scale data is generating or loaded (and after a
 * failed load). Every figure comes from the loaded counts, the horizon setting
 * and the timings, never typed. The app says sessions, never "slot" (OQ-64).
 * Rendered by `AppShell` only, so never in the PWA, and never product UI.
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, Gauge } from 'lucide-react'
import { Notice, TextAction } from '../ui'
import { formatCount } from '../format'
import { medianOf, useScaleMode, type ScaleModeState } from '../../store/scaleMode'
import { TIMED_SCREENS } from './useScreenTiming'
import { fontFamily, neutral } from '../../theme/tokens'

const MONO: React.CSSProperties = { fontFamily: fontFamily.mono, fontVariantNumeric: 'tabular-nums' }

function seconds(ms: number | null): string {
  return ms === null ? '' : `${(ms / 1000).toFixed(1)} s`
}

function ms(value: number | undefined): string {
  return value === undefined ? 'not yet' : `${Math.round(value)} ms`
}

/** The loaded line (the counts, the horizon setting and the generation time). */
export function scaleLoadedLine(s: Pick<ScaleModeState, 'counts' | 'generateMs' | 'horizonMonths'>): string {
  const c = s.counts
  if (c === null) return ''
  const horizon = s.horizonMonths !== null ? ` (${s.horizonMonths} months)` : ''
  return `Full-scale data · ${formatCount(c.anaesthetists)} anaesthetists · ${formatCount(c.slotsInHorizon)} sessions over the scheduling horizon${horizon} · ${formatCount(c.invoicesLast12Months)} invoices in the last 12 months · generated in ${seconds(s.generateMs)} · saving paused. Reset or reload returns to the demo data.`
}

export const SCALE_GENERATING_LINE = 'Generating full-scale data from the seed. This takes a few seconds.'

function heapLine(): string | null {
  const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
  return memory !== undefined ? `JS heap about ${formatCount(memory.usedJSHeapSize / 1048576)} MB` : null
}

export function ScaleBanner() {
  const scale = useScaleMode()
  const [open, setOpen] = useState(false)
  if (scale.mode === 'demo' && scale.error === null) return null
  if (scale.mode === 'demo') {
    return (
      <div style={{ flex: 'none', padding: '8px 16px', background: neutral.bg }}>
        <Notice tone="error" shot="scale-banner" live="alert">{scale.error}</Notice>
      </div>
    )
  }
  if (scale.mode === 'generating') {
    return (
      <div style={{ flex: 'none', padding: '8px 16px', background: neutral.bg }}>
        <Notice tone="warning" shot="scale-banner" live="status" icon={<Gauge size={16} />}>{SCALE_GENERATING_LINE}</Notice>
      </div>
    )
  }
  const heap = heapLine()
  return (
    <div style={{ flex: 'none', padding: '8px 16px', background: neutral.bg }}>
      <Notice
        tone="warning"
        shot="scale-banner"
        live="status"
        icon={<Gauge size={16} />}
        action={
          <TextAction size="sm" flush shot="scale-timings-toggle" ariaExpanded={open} onClick={() => setOpen((o) => !o)}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {open ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
              Timings
            </span>
          </TextAction>
        }
      >
        <span>{scaleLoadedLine(scale)}</span>
        {open && (
          <div data-shot="scale-timings" style={{ marginTop: 6, color: neutral.ink }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ color: neutral.slate, textAlign: 'left' }}>
                  <th style={{ padding: '2px 16px 2px 0', fontWeight: 600 }}>Screen</th>
                  <th style={{ padding: '2px 16px 2px 0', fontWeight: 600, textAlign: 'right' }}>Demo data</th>
                  <th style={{ padding: '2px 16px 2px 0', fontWeight: 600, textAlign: 'right' }}>Full scale</th>
                  <th style={{ padding: '2px 0', fontWeight: 600, textAlign: 'right' }}>Full scale, painted</th>
                </tr>
              </thead>
              <tbody>
                {TIMED_SCREENS.map(({ key, label }) => {
                  const s = scale.samples[key]
                  return (
                    <tr key={key} data-timing={key}>
                      <td style={{ padding: '2px 16px 2px 0' }}>{label}</td>
                      <td style={{ ...MONO, padding: '2px 16px 2px 0', textAlign: 'right' }}>{ms(medianOf(s?.demo ?? []))}</td>
                      <td style={{ ...MONO, padding: '2px 16px 2px 0', textAlign: 'right' }}>{ms(medianOf(s?.fullScale ?? []))}</td>
                      <td style={{ ...MONO, padding: '2px 0', textAlign: 'right' }}>{ms(medianOf(s?.fullScalePaint ?? []))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ ...MONO, marginTop: 6, fontSize: 12.5, color: neutral.slate }}>
              Generation {ms(scale.generateMs ?? undefined)} · install {ms(scale.installMs ?? undefined)} · first paint {ms(scale.firstPaintMs ?? undefined)}
              {heap !== null ? ` · ${heap}` : ''}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: neutral.slate }}>Median of the last five samples on this laptop. Formal performance testing is a Testing-milestone task.</div>
          </div>
        )}
      </Notice>
    </div>
  )
}
