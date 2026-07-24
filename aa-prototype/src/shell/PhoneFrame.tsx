import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Maximize2, Minus, Plus } from 'lucide-react'
import { useClockTimeLabel } from '../store'
import { accent, neutral, phoneBackdrop } from '../theme/tokens'
import { gradientCssVars } from '../theme/mobileGradient'
import { AtmosphereLayer, GradientLab, useMobileGradient } from './gradientLab'

/**
 * iOS device frame — adapted from `docs/design/ios-frame.jsx` (`IOSDevice`)
 * into typed, dependency-free React (Decisions log 2026-07-21). Bezel, dynamic
 * island, status bar and home indicator; a 390×844 logical content area that
 * floats centred on a full-viewport grey backdrop.
 *
 * This is the ONLY mobile emulation (PROGRESS convention 12) — the mobile app
 * never relies on the browser viewport. Content scrolls inside the frame.
 */

const DEVICE_WIDTH = 390
const DEVICE_HEIGHT = 844

function StatusBar({ time }: { time: string }) {
  const c = neutral.ink
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 54,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px 0',
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          fontFamily: '-apple-system, "SF Pro", system-ui, sans-serif',
          fontWeight: 600,
          fontSize: 15,
          lineHeight: '20px',
          color: c,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {time}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {/* cellular */}
        <svg width="19" height="12" viewBox="0 0 19 12" aria-hidden>
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={c} />
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={c} />
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={c} />
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={c} />
        </svg>
        {/* wifi */}
        <svg width="17" height="12" viewBox="0 0 17 12" aria-hidden>
          <path
            d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z"
            fill={c}
          />
          <path
            d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z"
            fill={c}
          />
          <circle cx="8.5" cy="10.5" r="1.5" fill={c} />
        </svg>
        {/* battery */}
        <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden>
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={c} strokeOpacity="0.35" fill="none" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill={c} />
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill={c} fillOpacity="0.4" />
        </svg>
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Presenter zoom (prototype chrome, not product UI)
// ---------------------------------------------------------------------------

const SCALE_MIN = 0.5
const SCALE_MAX = 1.3
const SCALE_STEP = 0.1
const BACKDROP_PADDING = 24
const SCALE_STORAGE_KEY = 'aa-phone-scale'

const clampScale = (s: number): number => Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(s * 100) / 100))

function readStoredScale(): number | null {
  try {
    const raw = window.localStorage.getItem(SCALE_STORAGE_KEY)
    if (raw === null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? clampScale(n) : null
  } catch {
    return null
  }
}

/** A small zoom toolbar pinned outside the phone (demo convenience on small screens). */
function ZoomControl({
  scale,
  onChange,
  onFit,
}: {
  scale: number
  onChange: (next: number) => void
  onFit: () => void
}) {
  const btn: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: `1px solid ${neutral.line}`,
    background: neutral.surface,
    color: neutral.slate,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  }
  return (
    <div
      role="group"
      aria-label="Resize the phone preview"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: 6,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${neutral.line}`,
        boxShadow: '0 2px 4px rgba(23,35,32,0.06), 0 8px 20px rgba(23,35,32,0.09)',
      }}
    >
      <button type="button" aria-label="Zoom out" style={btn} onClick={() => onChange(scale - SCALE_STEP)}>
        <Minus size={16} strokeWidth={2.2} aria-hidden />
      </button>
      <span
        className="mono"
        style={{ minWidth: 44, textAlign: 'center', fontSize: 13, fontWeight: 600, color: neutral.ink }}
      >
        {Math.round(scale * 100)}%
      </span>
      <button type="button" aria-label="Zoom in" style={btn} onClick={() => onChange(scale + SCALE_STEP)}>
        <Plus size={16} strokeWidth={2.2} aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Fit to screen"
        title="Fit to screen"
        style={{ ...btn, width: 'auto', padding: '0 10px', gap: 6, color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}
        onClick={onFit}
      >
        <Maximize2 size={15} strokeWidth={2.2} aria-hidden />
        Fit
      </button>
    </div>
  )
}

interface PhoneFrameProps {
  children: ReactNode
  /** Status-bar time override (defaults to the live demo clock). */
  time?: string
}

export function PhoneFrame({ children, time }: PhoneFrameProps) {
  const clockTime = useClockTimeLabel()
  const { config: gradient, controller: labController } = useMobileGradient()
  const atmosVars = gradientCssVars(gradient)
  const backdropRef = useRef<HTMLDivElement>(null)
  const [scale, setScaleState] = useState<number>(() => readStoredScale() ?? 1)
  // Until the user has an explicit preference we auto-fit to the viewport.
  const [autoFit, setAutoFit] = useState<boolean>(() => readStoredScale() === null)

  const setScale = useCallback((next: number) => {
    const clamped = clampScale(next)
    setAutoFit(false)
    setScaleState(clamped)
    try {
      window.localStorage.setItem(SCALE_STORAGE_KEY, String(clamped))
    } catch {
      /* ignore storage failures (private mode etc.) */
    }
  }, [])

  const computeFit = useCallback((): number => {
    const el = backdropRef.current
    if (el === null) return 1
    // The backdrop's own height grows with its content, so measure the visible
    // space instead: viewport height below the backdrop's top (the harness bar).
    const rect = el.getBoundingClientRect()
    const availH = window.innerHeight - rect.top - BACKDROP_PADDING * 2
    const availW = el.clientWidth - BACKDROP_PADDING * 2
    if (availH <= 0 || availW <= 0) return 1
    return clampScale(Math.min(availH / DEVICE_HEIGHT, availW / DEVICE_WIDTH))
  }, [])

  const fitNow = useCallback(() => setScale(computeFit()), [computeFit, setScale])

  // While in auto-fit mode, keep the phone fitted to the backdrop as it resizes.
  useLayoutEffect(() => {
    if (!autoFit) return
    const apply = () => setScaleState(computeFit())
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [autoFit, computeFit])

  return (
    <div
      ref={backdropRef}
      style={{
        minHeight: '100%',
        width: '100%',
        background: phoneBackdrop,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: BACKDROP_PADDING,
        boxSizing: 'border-box',
        overflow: 'auto',
      }}
    >
      {/* Wrapper reserves the SCALED footprint so flex-centring and scrollbars stay correct. */}
      <div style={{ flex: 'none', width: DEVICE_WIDTH * scale, height: DEVICE_HEIGHT * scale }}>
        <div
          style={{
            width: DEVICE_WIDTH,
            height: DEVICE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            borderRadius: 48,
            overflow: 'hidden',
            position: 'relative',
            // Opaque fallback beneath the atmosphere; the shared `--aa-atmos-*`
            // vars (set here) drive the fixed AtmosphereLayer AND the SlideStack
            // layers so the whole mobile canvas paints one seamless field.
            background: neutral.bg,
            boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
            WebkitFontSmoothing: 'antialiased',
            ...atmosVars,
          } as CSSProperties}
        >
          {/* atmospheric background — pinned to the device, content scrolls over it */}
          <AtmosphereLayer enabled={gradient.enabled} />

          {/* dynamic island */}
        <div
          style={{
            position: 'absolute',
            top: 11,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 126,
            height: 37,
            borderRadius: 24,
            background: '#000',
            zIndex: 50,
          }}
        />

        <StatusBar time={time ?? clockTime} />

        {/* scrollable content region — the mobile app renders here */}
        <div style={{ height: '100%', overflow: 'auto', position: 'relative' }}>{children}</div>

        {/* home indicator — always on top */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 60,
            height: 34,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            paddingBottom: 8,
            pointerEvents: 'none',
          }}
        >
          <div style={{ width: 139, height: 5, borderRadius: 100, background: 'rgba(0,0,0,0.25)' }} />
        </div>
        </div>
      </div>

      <ZoomControl scale={scale} onChange={setScale} onFit={fitNow} />

      {/* Temporary Phase 13 tuning lab — outside the device, behind the gate. */}
      {labController !== null && <GradientLab config={gradient} controller={labController} />}
    </div>
  )
}
