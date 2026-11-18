import { fontFamily, neutral, radius, semantic } from '../../../theme/tokens'

/**
 * A small labelled in-row input for correcting one field of an incoming row:
 * the Integrations PDF review's extracted rows (Phase 11) and the Matching
 * panel's identifying fields (catch-up Phase 33). Moved out of
 * `IntegrationMonitorScreen`'s `PdfReview` so both use the one component; it
 * lives in `apps/admin/components` because it serves both screens.
 * `readOnly` shows a value that is kept as received (never corrected).
 */
export function RowField({
  label,
  value,
  onChange,
  width,
  mono,
  invalid,
  readOnly,
  shot,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  width: number
  mono?: boolean
  invalid?: boolean
  readOnly?: boolean
  shot?: string
}) {
  return (
    <label data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>{label}</span>
      <input
        value={value}
        readOnly={readOnly === true}
        aria-invalid={invalid === true ? true : undefined}
        onChange={(e) => onChange?.(e.target.value)}
        className={mono === true ? 'mono' : undefined}
        style={{ font: 'inherit', ...(mono === true ? { fontFamily: fontFamily.mono } : {}), fontSize: 12.5, padding: '5px 8px', borderRadius: radius.ctl, border: `1px solid ${invalid === true ? semantic.error.solid : readOnly === true ? neutral.line : neutral.lineStrong}`, background: readOnly === true ? neutral.bg : neutral.surface, color: neutral.ink, width }}
      />
    </label>
  )
}
