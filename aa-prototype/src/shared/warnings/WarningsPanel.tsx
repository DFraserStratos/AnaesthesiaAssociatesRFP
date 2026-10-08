import { useState, type ReactNode } from 'react'
import { Check, TriangleAlert } from 'lucide-react'
import type { Warning } from '../../domain/warnings'
import { isOpen } from '../../domain/warnings'
import { clearWarning, useAppStore, type Actor } from '../../store'
import { accent, neutral, radius } from '../../theme/tokens'
import { hhmm, shortDay } from '../format'
import { strongestOpen } from './useBookingWarnings'
import { KIND_LABELS, STRENGTH_LABELS, warningTone } from './tone'

/** "Tue 21 Jul 10:05" for a clearance time. */
export function clearanceWhen(atISO: string): string {
  return `${shortDay(atISO)} ${hhmm(atISO)}`
}

/** The teal Clear button (the only action colour). A mild warning's clear is optional. */
export function ClearWarningButton({
  warning,
  onClear,
  compact = false,
  label,
}: {
  warning: Warning
  onClear: () => void
  compact?: boolean
  /** The accessible name, giving the row's context ("Clear warning for Annette Riley"). */
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        minHeight: compact ? 30 : 36,
        padding: compact ? '0 10px' : '0 12px',
        borderRadius: radius.ctl,
        border: `1px solid ${accent.base}`,
        background: neutral.surface,
        color: accent.base,
        fontFamily: 'inherit',
        fontSize: compact ? 12 : 13,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <Check size={compact ? 13 : 14} aria-hidden />
      {warning.strength === 'mild' ? 'Clear (optional)' : 'Clear'}
    </button>
  )
}

function StrengthPill({ warning }: { warning: Warning }) {
  const tone = warningTone(isOpen(warning) ? warning.strength : undefined)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 8px',
        borderRadius: radius.pill,
        border: `1px solid ${tone.solid}`,
        color: tone.onTint,
        background: neutral.surface,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: '16px',
      }}
    >
      {STRENGTH_LABELS[warning.strength]}
    </span>
  )
}

/**
 * The Booking's warnings, first in the Booking detail's banners so they are
 * on screen the moment the Booking opens (US-13.7.3 "Visible on opening"). One
 * row per warning: the rule's own text, its kind and strength, and for a
 * cleared one who cleared it and when. The office gets a teal Clear on each
 * open warning; the anaesthetist reads the rows. `extra` lets the Booking add
 * a rule-specific office action to its row (the prepayment row's "Raise
 * pre-procedure invoice"); `rowShot` names a row's capture hook.
 */
export function WarningsPanel({
  warnings,
  actor,
  canClear,
  extra,
  rowShot,
}: {
  warnings: readonly Warning[]
  actor: Actor
  /** The office may clear (US-13.7.2); the anaesthetist never sees Clear. */
  canClear: boolean
  extra?: (warning: Warning) => ReactNode
  rowShot?: (warning: Warning) => string | undefined
}) {
  const [error, setError] = useState<string | null>(null)
  if (warnings.length === 0) return null
  const open = warnings.filter(isOpen)
  const tone = warningTone(strongestOpen(warnings))
  const headingId = `warnings-${warnings[0]!.bookingId}`

  const clear = (w: Warning) => {
    const res = clearWarning(useAppStore, actor, w.bookingId, w.key)
    setError(res.ok ? null : res.message)
  }

  return (
    <section
      aria-labelledby={headingId}
      data-shot="booking-warnings"
      style={{
        background: tone.tint,
        color: tone.onTint,
        borderRadius: radius.card,
        padding: '12px 14px',
        fontSize: 13,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <h2 id={headingId} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, lineHeight: '18px', fontWeight: 700 }}>
        <TriangleAlert size={16} aria-hidden />
        <span>Warnings</span>
        <span style={{ fontWeight: 600, opacity: 0.8, fontVariantNumeric: 'tabular-nums' }}>
          {open.length > 0 ? `${open.length} open` : 'All cleared'}
        </span>
      </h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
        {warnings.map((w, i) => {
          const cleared = w.clearance !== undefined
          const rowExtra = extra?.(w) ?? null
          return (
            <li
              key={w.key}
              data-shot={rowShot?.(w)}
              data-warning-key={w.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: i === 0 ? '0 0 10px' : '10px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${tone.solid}33`,
                paddingBottom: i === warnings.length - 1 ? 0 : 10,
              }}
            >
              <span style={{ fontWeight: 600, lineHeight: '18px', color: cleared ? neutral.slate : tone.onTint }}>{w.text}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12, color: cleared ? neutral.slate : tone.onTint }}>
                <span>{KIND_LABELS[w.kind]}</span>
                <StrengthPill warning={w} />
                {w.clearance !== undefined && (
                  <span style={{ color: neutral.slate }}>
                    Cleared by {w.clearance.by}, {clearanceWhen(w.clearance.atISO)}
                  </span>
                )}
              </span>
              {((canClear && !cleared) || rowExtra !== null) && (
                <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                  {rowExtra}
                  {canClear && !cleared && <ClearWarningButton warning={w} onClear={() => clear(w)} label={`${w.strength === 'mild' ? 'Clear (optional)' : 'Clear'} warning: ${w.text}`} />}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      {open.length > 0 && (
        <span style={{ fontSize: 11.5, opacity: 0.85 }}>A warning, never a block: it never stops completion or submission.</span>
      )}
      {error !== null && <span role="alert" style={{ fontSize: 12, fontWeight: 600 }}>{error}</span>}
    </section>
  )
}
