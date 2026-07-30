import { useEffect, useState, type ReactNode } from 'react'
import { format, parseISO } from 'date-fns'
import { Check, RefreshCw, RotateCcw } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../theme/tokens'
import { BottomSheet } from '../shared/surface'
import { SlidingSegmentedControl } from '../shared/ui/SlidingSegmentedControl'
import {
  PERSIST_KEY,
  persistStatus,
  persistedBytes,
  resetDemo,
  resilientLocalStorage,
  useAppStore,
  useClockTimeLabel,
  useToday,
  type CardCalculationMode,
} from '../store'
import { demoClockShortcuts } from '../shared/demoClockShortcuts'
import {
  OFFICE_SIM_COPY,
  isOfficeSimulationEnabled,
  setOfficeSimulationEnabled,
} from './officeSimulation'
import { bootMs } from './bootMetrics'
import { checkForUpdate, serviceWorkerReady } from './swRegistration'
import { InstallCoach, clearInstallCoachDismissal } from './InstallCoach'

/**
 * The presenter controls the installed PWA has no harness bar for.
 *
 * `AppShell` supplies `DemoClockMenu`, `DemoResetButton`,
 * `CardCalculationControl` and `AppSwitcher`. The PWA renders none of it, which
 * is correct for the illusion but takes the clock and Reset with it. The fake
 * status bar was also the only place the DEMO clock was visible, and that
 * matters, because "Start now" and "Finish now" stamp from it.
 *
 * This lives behind the More tab, injected by the PWA entry through
 * `MobileApp`'s `moreExtra` slot, so none of it reaches the prototype bundle
 * and the framed More tab is untouched. More is the right home rather than a
 * line in the Lists header: that header is the demo's opening screen, and a
 * demo badge there would be the first thing the panel sees. `MoreScreen` is
 * already fenced off from product UI, badge and all.
 *
 * Every control here is presenter chrome. None of it is proposed product UI.
 */

const CALCULATION_MODES: readonly { value: CardCalculationMode; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'units', label: 'Units' },
  { value: 'fee', label: 'Fee' },
]

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: 16,
        background: neutral.surface,
        border: `1px solid ${neutral.line}`,
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>
        {title}
      </div>
      {children}
    </div>
  )
}

/** A borderless label / value row. Static, not a target, so its 32px min-height
 *  is row rhythm rather than the phone's 44px touch minimum: the four of them
 *  read as one block. */
function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 32 }}>
      <span style={{ flex: 1, fontSize: 14, color: neutral.slate }}>{label}</span>
      <span className="mono" style={{ fontSize: 13, color: neutral.ink, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

function DemoClockCard() {
  const todayISO = useToday()
  const timeLabel = useClockTimeLabel()
  const shortcuts = demoClockShortcuts(useAppStore, todayISO)

  return (
    <Card title="Demo clock">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className="mono" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {timeLabel}
        </span>
        <span style={{ fontSize: 14, color: neutral.slate }}>{format(parseISO(todayISO), 'EEEE d MMMM yyyy')}</span>
      </div>
      <div style={{ fontSize: 13, color: neutral.mist, lineHeight: '18px' }}>
        Start now and Finish now stamp from this clock, not the phone's.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon
          return (
            <button
              key={shortcut.id}
              type="button"
              onClick={shortcut.run}
              disabled={shortcut.disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                minHeight: 44,
                padding: '0 10px',
                borderRadius: radius.pill,
                border: `1px solid ${shortcut.disabled ? neutral.line : accent.base}`,
                background: neutral.surface,
                color: shortcut.disabled ? neutral.mist : accent.base,
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                cursor: shortcut.disabled ? 'default' : 'pointer',
              }}
            >
              <Icon size={15} strokeWidth={2.2} aria-hidden />
              {shortcut.label}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

/** A label plus a switch. No such control exists in the design language yet, so
 *  the track borrows the pill radius and the accent fill from the rest of the
 *  phone rather than inventing a new visual idiom, and sizes to the platform
 *  switch (52x32).
 *
 *  THE WHOLE ROW is the control, not the track. A bare 52x32 track is under the
 *  44px minimum the rest of the phone honours (convention 16, N1), and a thumb
 *  landing a few pixels high or low would have missed it entirely; making the
 *  row the button gives a 44px-tall, full-width target and turns the label from
 *  decoration into part of it, the way the iOS Settings rows behave. */
function ToggleRow({ on, onChange, label }: { on: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        minHeight: 44,
        padding: 0,
        border: 'none',
        background: 'none',
        color: 'inherit',
        font: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{label}</span>
      <span
        aria-hidden
        style={{
          flex: 'none',
          width: 52,
          height: 32,
          padding: 3,
          borderRadius: radius.pill,
          background: on ? accent.base : neutral.lineStrong,
          display: 'flex',
          justifyContent: on ? 'flex-end' : 'flex-start',
          alignItems: 'center',
          transition: 'background 150ms cubic-bezier(0.2,0.8,0.2,1)',
        }}
      >
        <span
          style={{ display: 'block', width: 26, height: 26, borderRadius: radius.pill, background: neutral.surface }}
        />
      </span>
    </button>
  )
}

function OfficeSimulationCard() {
  const [on, setOn] = useState(isOfficeSimulationEnabled)

  return (
    <Card title="Office simulation">
      <ToggleRow
        on={on}
        label="Play the office"
        onChange={(next) => {
          setOfficeSimulationEnabled(next)
          setOn(next)
        }}
      />
      <div style={{ fontSize: 13, color: neutral.slate, lineHeight: '18px' }}>{OFFICE_SIM_COPY}</div>
      <div style={{ fontSize: 12, color: neutral.mist, lineHeight: '17px' }}>
        Off, and a submitted list simply waits, as it really would until the office reviews it. There is no
        Admin app on the phone, so nothing else would move it on. Switch it back on and the office picks
        that same list up a few seconds later.
      </div>
    </Card>
  )
}

function CardCalculationCard() {
  const mode = useAppStore((s) => s.shell.cardCalculationMode)
  const setMode = useAppStore((s) => s.setCardCalculationMode)

  return (
    <Card title="Card calculation">
      <SlidingSegmentedControl
        value={mode}
        options={CALCULATION_MODES}
        onSelect={setMode}
        variant="surface"
        ariaLabel="Anaesthetist Card calculation"
        buttonStyle={{ height: 40 }}
      />
      <div style={{ fontSize: 13, color: neutral.slate, lineHeight: '18px' }}>
        What the Card shows above the completion bar. On the desktop prototype this sits in the harness bar.
      </div>
    </Card>
  )
}

function ResetCard() {
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <Card title="Demo data">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 48,
            borderRadius: radius.ctl,
            border: `1px solid ${neutral.lineStrong}`,
            background: neutral.surface,
            color: neutral.ink,
            fontFamily: 'inherit',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={17} strokeWidth={2.2} aria-hidden />
          Reset demo data
        </button>
        {/* Hedged deliberately, matching README "The origin trap": an installed
            iOS app MAY have storage of its own for the same origin (the
            behaviour has moved across versions), and on Android Chrome it
            shares the browser profile's. Either way this control is the
            reliable way in, which is the sentence the presenter needs. */}
        <div style={{ fontSize: 12, color: neutral.mist, lineHeight: '17px' }}>
          An installed app may keep its own copy of the data, separate from the browser's, so clearing it
          in the browser is not a reliable way to start a fresh run. Use this.
        </div>
      </Card>

      {/* A bottom sheet rather than a port of the desktop popover: a popover
          anchored to a control near the bottom of a phone opens under the
          thumb, and this app already has one confirmation idiom. */}
      <BottomSheet open={confirming} onClose={() => setConfirming(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Reset all demo data?</div>
          <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px' }}>
            This restores the pristine seed and returns the demo clock to Tuesday 21 July 2026, 8:00. Your
            display choices are preserved.
          </div>
          <button
            type="button"
            onClick={() => {
              // Clear the persisted key FIRST. `resetDemo` is a `setState`, so
              // its write goes through the persist middleware — and if a storage
              // error has latched writes off (persistStorage.ts) that write is
              // dropped, leaving the pre-failure mid-demo payload in storage for
              // the next launch to rehydrate. A `removeItem` is let past the
              // latch precisely so a hard reset can recover, and an installed
              // app has no browser UI to clear site data from. Same call
              // zustand's `persist.clearStorage()` would make, minus the cast:
              // `BoundAppStore` is typed without the persist mutator.
              resilientLocalStorage.removeItem(PERSIST_KEY)
              resetDemo(useAppStore)
              // The install coaching is per-handset presenter chrome, not demo
              // data, but the X that hides it is one tap on a phone that gets
              // passed around a room, and nothing else can bring it back. It
              // reappears on the next visit to More, because `InstallCoach`
              // reads the key when it mounts.
              clearInstallCoachDismissal()
              setConfirming(false)
            }}
            style={{
              minHeight: 52,
              borderRadius: radius.card,
              border: 'none',
              background: accent.base,
              color: neutral.surface,
              fontFamily: 'inherit',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Confirm reset
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            style={{
              minHeight: 48,
              borderRadius: radius.card,
              border: `1px solid ${neutral.lineStrong}`,
              background: neutral.surface,
              color: neutral.ink,
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </BottomSheet>
    </>
  )
}

const BYTES_PER_MB = 1024 * 1024

/** Without a visible build id you cannot tell whether the phone picked up a
 *  deploy, and that burns workshop-prep time. */
function BuildCard() {
  const [state, setState] = useState<'idle' | 'checking' | 'checked' | 'unavailable' | 'failed'>('idle')
  const [offlineReady, setOfflineReady] = useState<boolean | null>(null)
  const boot = bootMs()

  // Read at render, which for this card means once per visit to the More tab
  // (`MoreScreen` unmounts when you leave it) — enough for a diagnostic, and the
  // latch is sticky, so a failure cannot be missed by looking a moment late.
  // Worth the row only on this surface: `/demo/data` carries the same readout for
  // the framed prototype, but the PWA bundle deliberately excludes it, so
  // without this a phone whose writes have latched off says nothing at all and
  // the presenter demos a session that will not survive the next launch.
  const storage = persistStatus()
  const storageBytes = persistedBytes()

  // Asked after mount, not read synchronously: registration completes well
  // after first paint, so a render-time read reports "no" on a healthy install.
  useEffect(() => {
    let live = true
    void serviceWorkerReady().then((ready) => {
      if (live) setOfflineReady(ready)
    })
    return () => {
      live = false
    }
  }, [])

  async function check() {
    setState('checking')
    setState(await checkForUpdate())
  }

  const message =
    state === 'checking'
      ? 'Checking'
      : state === 'checked'
        ? 'Up to date, or the reload pill is about to appear'
        : state === 'unavailable'
          ? 'No service worker on this origin, so nothing to check'
          : // Two causes now land on 'failed': the re-check itself threw, or
            // `register()` failed earlier and `swRegistration` latched it. The
            // wording has to cover both, or a worker that could not install
            // reads as a flaky venue wifi.
            state === 'failed'
            ? 'Could not reach the server, or the worker could not install'
            : null

  return (
    <Card title="Build">
      <Row label="Version" value={__BUILD_ID__} />
      <Row label="Cold launch" value={boot === null ? 'measuring' : `${boot} ms`} />
      <Row label="Offline ready" value={offlineReady === null ? 'checking' : offlineReady ? 'yes' : 'no'} />
      <Row
        label="Saved data"
        value={
          storage.disabled
            ? 'paused after a storage error'
            : storageBytes === 0
              ? 'not written yet'
              : `${(storageBytes / BYTES_PER_MB).toFixed(2)} MB`
        }
      />
      <button
        type="button"
        onClick={() => void check()}
        disabled={state === 'checking'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 44,
          borderRadius: radius.ctl,
          border: `1px solid ${neutral.lineStrong}`,
          background: neutral.surface,
          color: state === 'checking' ? neutral.mist : neutral.ink,
          fontFamily: 'inherit',
          fontSize: 14,
          fontWeight: 600,
          cursor: state === 'checking' ? 'default' : 'pointer',
        }}
      >
        {state === 'checked' ? (
          <Check size={16} strokeWidth={2.4} aria-hidden />
        ) : (
          <RefreshCw size={16} strokeWidth={2.2} aria-hidden />
        )}
        Check for updates
      </button>
      {message !== null && (
        <div
          role="status"
          style={{
            fontSize: 12,
            lineHeight: '17px',
            color: state === 'failed' ? semantic.warning.onTint : neutral.mist,
          }}
        >
          {message}
        </div>
      )}
      <div style={{ fontSize: 12, color: neutral.mist, lineHeight: '17px' }}>
        Once installed, pulling to refresh will not fetch a new build. The app checks on its own every
        minute, and shows a reload pill when one is ready.
      </div>
    </Card>
  )
}

export function PwaDemoPanel() {
  return (
    <>
      <InstallCoach />
      <DemoClockCard />
      <OfficeSimulationCard />
      <CardCalculationCard />
      <ResetCard />
      <BuildCard />
    </>
  )
}
