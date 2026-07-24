import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { Check, ClipboardCopy, Code2, RotateCcw, SlidersHorizontal, TriangleAlert, X } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import { DemoBadge } from '../../shared'
import {
  configToCssText,
  envelopeWarnings,
  gradientCssVars,
  GRADIENT_PRESETS,
  normalizeHex,
  serializeConfig,
  type GradientField,
  type MobileGradientConfig,
} from '../../theme/mobileGradient'
import { LAB_NARROW_BREAKPOINT, type GradientLabController } from './useGradientLab'

/**
 * The Gradient Lab — a TEMPORARY prototype control (Phase 13), behind
 * `GRADIENT_LAB_ENABLED`. It lives in the grey preview area OUTSIDE the phone
 * frame and tunes a live copy of the mobile atmosphere: master switch, global
 * intensity, base colour, the two radial fields (accent teal + identity blush)
 * and the lower neutral return. It writes only the decorative `--aa-atmos-*`
 * variables (never status/domain state) and persists under its own key.
 *
 * On wide viewports it docks open in the left gutter (clear of the centred
 * device and the bottom-right zoom toolbar). On narrow viewports it collapses to
 * a small toggle button and opens as a floating overlay over the grey canvas.
 */

const PANEL_WIDTH = 300
const PANEL_TOP = 56
const PANEL_LEFT = 12
const PANEL_GUTTER_MARGIN = 8
const PANEL_Z = 150

/** Advisory-warning amber for the lab. It deliberately mirrors the warning
 *  onTint value, but is kept as a plain literal rather than importing
 *  `semantic` from tokens: the lab has NO coupling to the status/domain token
 *  system (the isolation guard stays mechanical) and remains pure decoration
 *  outside the product surface. */
const WARN_INK = '#7C4D08'

// ---------------------------------------------------------------------------
// Small, keyboard-operable native controls
// ---------------------------------------------------------------------------

const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 600, color: neutral.slate }
const valueStyle: CSSProperties = { fontSize: 12, fontWeight: 600, color: neutral.ink, fontVariantNumeric: 'tabular-nums' }

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  decimals = 0,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  decimals?: number
  onChange: (n: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={labelStyle}>{label}</span>
        <span style={valueStyle} className="mono">
          {value.toFixed(decimals)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        style={{ width: '100%', accentColor: accent.base, cursor: 'pointer' }}
      />
    </div>
  )
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  const [text, setText] = useState(value)
  const [invalid, setInvalid] = useState(false)
  const hintId = useId()

  // Re-sync when the value changes from outside (Reset to AA default, etc.).
  useEffect(() => {
    setText(value)
    setInvalid(false)
  }, [value])

  const commit = (raw: string) => {
    setText(raw)
    const norm = normalizeHex(raw)
    if (norm === null) {
      setInvalid(true) // keep the last valid preview; just flag the input
      return
    }
    setInvalid(false)
    onChange(norm)
  }

  const swatch = normalizeHex(value) ?? '#000000'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={labelStyle}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={swatch}
          onChange={(e) => commit(e.target.value)}
          aria-label={`${label} colour picker`}
          style={{ width: 34, height: 28, padding: 0, border: `1px solid ${neutral.line}`, borderRadius: 6, background: 'none', cursor: 'pointer', flex: 'none' }}
        />
        <input
          type="text"
          value={text}
          onChange={(e) => commit(e.target.value)}
          aria-label={`${label} hex`}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? hintId : undefined}
          spellCheck={false}
          style={{
            flex: 1,
            minWidth: 0,
            height: 28,
            padding: '0 8px',
            border: `1px solid ${invalid ? WARN_INK : neutral.line}`,
            borderRadius: 6,
            fontFamily: "'Spline Sans Mono', ui-monospace, monospace",
            fontSize: 12,
            color: neutral.ink,
            background: neutral.surface,
          }}
        />
      </div>
      {invalid && (
        <span id={hintId} role="alert" style={{ fontSize: 11, color: WARN_INK }}>
          Enter a hex like #E1F0ED
        </span>
      )}
    </div>
  )
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: accent.base, cursor: 'pointer', flex: 'none' }}
      />
      <span style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>{label}</span>
    </label>
  )
}

function FieldSection({
  title,
  field,
  onToggle,
  onChange,
}: {
  title: string
  field: GradientField
  onToggle: (enabled: boolean) => void
  onChange: (partial: Partial<GradientField>) => void
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: `1px solid ${neutral.line}` }}>
      <SwitchRow label={title} checked={field.enabled} onChange={onToggle} />
      {field.enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ColorControl label="Colour" value={field.color} onChange={(color) => onChange({ color })} />
          <RangeControl label="Anchor X" value={field.x} min={-50} max={150} step={1} unit="%" onChange={(x) => onChange({ x })} />
          <RangeControl label="Anchor Y" value={field.y} min={-50} max={150} step={1} unit="%" onChange={(y) => onChange({ y })} />
          <RangeControl label="Spread horizontal" value={field.spreadX} min={0} max={200} step={1} unit="%" onChange={(spreadX) => onChange({ spreadX })} />
          <RangeControl label="Spread vertical" value={field.spreadY} min={0} max={200} step={1} unit="%" onChange={(spreadY) => onChange({ spreadY })} />
          <RangeControl label="Opacity" value={field.opacity} min={0} max={1} step={0.01} decimals={2} onChange={(opacity) => onChange({ opacity })} />
          <RangeControl label="Inner stop" value={field.innerStop} min={0} max={100} step={1} unit="%" onChange={(innerStop) => onChange({ innerStop })} />
          <RangeControl label="Fade / falloff" value={field.fade} min={0} max={100} step={1} unit="%" onChange={(fade) => onChange({ fade })} />
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// The panel
// ---------------------------------------------------------------------------

interface GradientLabProps {
  config: MobileGradientConfig
  controller: GradientLabController
}

function useViewportWidth(): number {
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth))
  useEffect(() => {
    const on = () => setW(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return w
}

export function GradientLab({ config, controller }: GradientLabProps) {
  const { patch, setField, applyPreset, resetToDefault, panelOpen, setPanelOpen } = controller
  const activePresetKey = serializeConfig(config)
  const viewportW = useViewportWidth()
  const narrow = viewportW < LAB_NARROW_BREAKPOINT

  const [copied, setCopied] = useState<'config' | 'css' | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Measure the (scaled) device's left edge so the OPEN panel can be capped to
  // the left gutter on narrow viewports and never cover the centred phone
  // (plan L1). Re-measures on open and on resize (which is when autofit runs).
  const [deviceLeft, setDeviceLeft] = useState<number | null>(null)
  useEffect(() => {
    const measure = () =>
      requestAnimationFrame(() => {
        const dev = document.querySelector('[data-testid="mobile-atmosphere"]')?.parentElement
        setDeviceLeft(dev ? dev.getBoundingClientRect().left : null)
      })
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [panelOpen])

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current) }, [])

  const flashCopied = (kind: 'config' | 'css') => {
    setCopied(kind)
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(null), 1400)
  }

  const copy = async (kind: 'config' | 'css') => {
    const text = kind === 'config' ? serializeConfig(config) : configToCssText(config)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* clipboard unavailable (permissions/private mode) — feedback still fires */
    }
    flashCopied(kind)
  }

  const vars = gradientCssVars(config)
  const warnings = envelopeWarnings(config)

  if (!panelOpen) {
    return (
      <button
        type="button"
        aria-label="Open Gradient Lab"
        onClick={() => setPanelOpen(true)}
        style={{
          position: 'fixed',
          top: PANEL_TOP,
          left: PANEL_LEFT,
          zIndex: PANEL_Z,
          width: 38,
          height: 38,
          borderRadius: 999,
          border: `1px solid ${neutral.line}`,
          background: neutral.surface,
          color: accent.base,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(23,35,32,0.06), 0 8px 20px rgba(23,35,32,0.09)',
        }}
      >
        <SlidersHorizontal size={18} strokeWidth={2.2} aria-hidden />
      </button>
    )
  }

  const btn: CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 34,
    borderRadius: radius.ctl,
    border: `1px solid ${neutral.line}`,
    background: neutral.surface,
    color: neutral.ink,
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  }

  // Narrow: cap the panel to the measured left gutter so it clears the device.
  // (Pre-measurement, fall back to the viewport-relative min.)
  const narrowGutter = deviceLeft !== null ? Math.max(0, Math.floor(deviceLeft) - PANEL_LEFT - PANEL_GUTTER_MARGIN) : null
  const panelWidth: number | string = !narrow
    ? PANEL_WIDTH
    : narrowGutter !== null
      ? Math.min(PANEL_WIDTH, narrowGutter)
      : `min(${PANEL_WIDTH}px, calc(100vw - 24px))`

  return (
    <div
      role="region"
      aria-label="Gradient Lab"
      style={{
        position: 'fixed',
        top: PANEL_TOP,
        left: PANEL_LEFT,
        zIndex: PANEL_Z,
        width: panelWidth,
        maxHeight: `calc(100vh - ${PANEL_TOP + 16}px)`,
        display: 'flex',
        flexDirection: 'column',
        background: neutral.surface,
        border: `1px solid ${neutral.line}`,
        borderRadius: radius.card,
        boxShadow: '0 8px 16px rgba(23,35,32,0.10), 0 24px 56px rgba(23,35,32,0.18)',
        fontFamily: "'Schibsted Grotesk', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Header — a short badge (fits one line at any panel width) plus a muted
          subtitle carrying the full "temporary prototype control" wording. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 12px 10px', borderBottom: `1px solid ${neutral.line}`, flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <DemoBadge label="Gradient Lab" />
          <button
            type="button"
            aria-label="Close Gradient Lab"
            onClick={() => setPanelOpen(false)}
            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'none', color: neutral.slate, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}
          >
            <X size={16} strokeWidth={2.2} aria-hidden />
          </button>
        </div>
        <span style={{ fontSize: 11, color: neutral.mist }}>Temporary prototype control · tuning only</span>
      </div>

      {/* Scrolling body */}
      <div style={{ overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Presets — switchable ideas (mostly single-hue). Click to apply. */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelStyle}>Presets</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {GRADIENT_PRESETS.map((preset) => {
              const active = serializeConfig(preset.config) === activePresetKey
              const pv = gradientCssVars(preset.config)
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-label={`Apply preset: ${preset.name}`}
                  aria-pressed={active}
                  title={preset.note}
                  onClick={() => applyPreset(preset.config)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    padding: 6,
                    borderRadius: radius.ctl,
                    border: `1px solid ${active ? accent.base : neutral.line}`,
                    boxShadow: active ? `0 0 0 1px ${accent.base}` : 'none',
                    background: neutral.surface,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      height: 40,
                      borderRadius: 6,
                      border: `1px solid ${neutral.line}`,
                      background: pv['--aa-atmos-base'],
                      backgroundImage: pv['--aa-atmos-image'],
                    }}
                  />
                  <span style={{ fontSize: 10.5, fontWeight: 600, lineHeight: '13px', color: active ? accent.base : neutral.ink }}>
                    {preset.name}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Live mini preview — phone-proportioned so the radial anchors read the
            same shape as the device (the gradient % are relative to the box). */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            aria-hidden
            title="Live preview (phone proportions)"
            style={{
              width: 84,
              aspectRatio: '390 / 844',
              borderRadius: radius.ctl,
              border: `1px solid ${neutral.line}`,
              background: vars['--aa-atmos-base'],
              backgroundImage: vars['--aa-atmos-image'],
            }}
          />
        </div>

        <SwitchRow label="Master atmosphere" checked={config.enabled} onChange={(enabled) => patch({ enabled })} />
        <RangeControl label="Global intensity" value={config.intensity} min={0} max={2} step={0.05} unit="×" decimals={2} onChange={(intensity) => patch({ intensity })} />
        <ColorControl label="Base colour" value={config.baseColor} onChange={(baseColor) => patch({ baseColor })} />

        <FieldSection
          title="Primary field"
          field={config.accent}
          onToggle={(enabled) => setField('accent', { enabled })}
          onChange={(p) => setField('accent', p)}
        />
        <FieldSection
          title="Secondary field"
          field={config.identity}
          onToggle={(enabled) => setField('identity', { enabled })}
          onChange={(p) => setField('identity', p)}
        />

        {/* Lower neutral return */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: `1px solid ${neutral.line}` }}>
          <SwitchRow label="Lower neutral return" checked={config.lowerFade.enabled} onChange={(enabled) => patch({ lowerFade: { enabled } })} />
          {config.lowerFade.enabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <RangeControl label="Return start" value={config.lowerFade.start} min={0} max={100} step={1} unit="%" onChange={(start) => patch({ lowerFade: { start } })} />
              <RangeControl label="Return end" value={config.lowerFade.end} min={0} max={100} step={1} unit="%" onChange={(end) => patch({ lowerFade: { end } })} />
            </div>
          )}
        </section>

        {/* Envelope warnings (non-blocking, announced politely) */}
        {warnings.length > 0 && (
          <div role="status" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, borderRadius: radius.ctl, background: neutral.sunken, border: `1px solid ${neutral.line}` }}>
            {warnings.map((w) => (
              <div key={w} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11.5, lineHeight: '16px', color: neutral.slate }}>
                <TriangleAlert size={13} strokeWidth={2} color={WARN_INK} aria-hidden style={{ flex: 'none', marginTop: 1 }} />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderTop: `1px solid ${neutral.line}`, flex: 'none' }}>
        <button
          type="button"
          onClick={resetToDefault}
          style={{ ...btn, color: accent.base, borderColor: accent.base }}
        >
          <RotateCcw size={14} strokeWidth={2.2} aria-hidden />
          Reset to AA default
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => copy('config')} style={btn}>
            {copied === 'config' ? <Check size={14} strokeWidth={2.4} aria-hidden /> : <ClipboardCopy size={14} strokeWidth={2.2} aria-hidden />}
            {copied === 'config' ? 'Copied' : 'Copy config'}
          </button>
          <button type="button" onClick={() => copy('css')} style={btn}>
            {copied === 'css' ? <Check size={14} strokeWidth={2.4} aria-hidden /> : <Code2 size={14} strokeWidth={2.2} aria-hidden />}
            {copied === 'css' ? 'Copied' : 'Copy CSS'}
          </button>
        </div>
      </div>
    </div>
  )
}
