/**
 * The single atmosphere paint. A non-interactive layer pinned to the device box
 * (behind the scrolling content, above the opaque `neutral.bg` fallback) that
 * reads the shared `--aa-atmos-*` custom properties PhoneFrame sets on the
 * device div. Because it sits inside the device (not the scroll region), the
 * content scrolls over a fixed atmosphere (G1).
 *
 * `data-atmosphere` reflects the master switch so tests can assert on/off; the
 * `--aa-atmos-image` is already `none` when the master is off, so this is a flat
 * base at that point.
 */
export function AtmosphereLayer({ enabled }: { enabled: boolean }) {
  return (
    <div
      data-testid="mobile-atmosphere"
      data-atmosphere={enabled ? 'on' : 'off'}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'var(--aa-atmos-base)',
        backgroundImage: 'var(--aa-atmos-image)',
      }}
    />
  )
}
