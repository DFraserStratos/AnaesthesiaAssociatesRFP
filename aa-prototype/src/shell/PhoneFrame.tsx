import type { ReactNode } from 'react'
import { useClockTimeLabel } from '../store'
import { neutral, phoneBackdrop } from '../theme/tokens'

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

interface PhoneFrameProps {
  children: ReactNode
  /** Status-bar time override (defaults to the live demo clock). */
  time?: string
}

export function PhoneFrame({ children, time }: PhoneFrameProps) {
  const clockTime = useClockTimeLabel()
  return (
    <div
      style={{
        minHeight: '100%',
        width: '100%',
        background: phoneBackdrop,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          flex: 'none',
          width: DEVICE_WIDTH,
          height: DEVICE_HEIGHT,
          borderRadius: 48,
          overflow: 'hidden',
          position: 'relative',
          background: neutral.bg,
          boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
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
  )
}
