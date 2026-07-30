import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { neutral } from '../theme/tokens'
import { gradientCssVars } from '../theme/mobileGradient'
import { AtmosphereLayer } from '../shell/gradientLab/AtmosphereLayer'
import { useMobileGradient } from '../shell/gradientLab/useGradientLab'
import { UpdatePrompt } from './UpdatePrompt'

/**
 * The installed PWA's mounting host — `PhoneFrame`'s opposite number, and the
 * other half of the `MobileApp host={…}` seam.
 *
 * It provides everything the frame was silently providing, minus the emulation:
 * a `position: relative` box for the absolutely positioned sheets and docks,
 * the four `--aa-inset-*` custom properties (from `env(safe-area-inset-*)`
 * rather than the frame's fake 54 / 34), the atmosphere, and hidden scrollbars.
 * There is no bezel, no dynamic island, no fake status bar, no home indicator,
 * no presenter zoom and no Gradient Lab: the real device supplies all of that.
 *
 * The atmosphere is NOT optional. `SlideStack` paints each layer from
 * `var(--aa-atmos-base, #F6F8F7)` / `var(--aa-atmos-image, none)`, which
 * `PhoneFrame` sets on the device box. Without a host setting them here the
 * whole canvas silently degrades to flat grey and the app loses its visual
 * character, so this reuses `useMobileGradient()` and paints the same
 * `AtmosphereLayer`. Importing the two modules directly rather than through
 * `shell/gradientLab`'s barrel keeps the 497-line lab out of this bundle.
 *
 * `overflow: hidden`, not `auto`, so the inner screen scrollers own all
 * scrolling and there is NO DOCUMENT SCROLL AT ALL. That is the single best
 * property of this layout on iOS: no body-scroll-lock hack when a sheet opens,
 * and both `position: fixed` and `100dvh` behave.
 */
export function MobileViewport({ children }: { children: ReactNode }) {
  const { config: gradient } = useMobileGradient()
  const rootRef = useRef<HTMLDivElement | null>(null)

  /**
   * The iOS `:active` unlock. WebKit does not fire `:active` at all unless a
   * touch handler is attached somewhere in the tree, so without this the press
   * response defined in `global.css` would silently do nothing and every tap on
   * a real iPhone would feel dead. A passive no-op listener is the documented
   * fix and costs nothing.
   */
  useEffect(() => {
    const el = rootRef.current
    if (el === null) return
    const unlock = () => undefined
    el.addEventListener('touchstart', unlock, { passive: true })
    return () => el.removeEventListener('touchstart', unlock)
  }, [])

  /**
   * Publish the software keyboard's height as `--aa-keyboard-inset`, consumed
   * by `BottomSheet` and the card dock so neither ends up behind the keys.
   *
   * On iOS the keyboard shrinks only the VISUAL viewport; the layout viewport
   * is unchanged. WebKit then tries to scroll the layout viewport to reveal the
   * focused field, finds nothing scrollable inside this `overflow: hidden`
   * host, and pans the whole page instead. The guarded `scrollTo` undoes that
   * pan; it cannot loop, because once `scrollY` is 0 the branch is skipped.
   *
   * KEYBOARD OCCLUSION ONLY — the name is the contract, and both consumers read
   * it that way. `innerHeight - vv.height` is equally non-zero under pinch zoom,
   * because the visual viewport shrinks with `vv.scale` while the layout
   * viewport does not, and pinch zoom is deliberately available here (no
   * `maximum-scale`, no `user-scalable=no`: WCAG 2.1 SC 1.4.4). So a scale past
   * 1.01 publishes 0 rather than half a screen of imaginary keyboard.
   *
   * The trade, stated plainly: while the user is deliberately zoomed a GENUINE
   * keyboard inset is suppressed too. That is acceptable because `global.css`
   * forces every focused control to 16px, so iOS never auto-zooms a field —
   * scale > 1 is always the user's own pinch, never a side effect of focus.
   * The dock and any open sheet then stay put in the page while zoomed, panning
   * out of the visible band like the content they belong to, rather than gluing
   * themselves to the bottom of that band and covering what is being read.
   *
   * `interactive-widget=resizes-content` in the viewport meta is the
   * complementary zero-JS path for Chrome 108+. Safari ignores it, which is why
   * this listener exists.
   */
  useEffect(() => {
    const vv = window.visualViewport
    const el = rootRef.current
    if (vv === null || vv === undefined || el === null) return
    const apply = () => {
      const inset = vv.scale > 1.01 ? 0 : Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      el.style.setProperty('--aa-keyboard-inset', `${Math.round(inset)}px`)
      if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0)
    }
    apply()
    vv.addEventListener('resize', apply)
    vv.addEventListener('scroll', apply)
    return () => {
      vv.removeEventListener('resize', apply)
      vv.removeEventListener('scroll', apply)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      // `aa-inset-device` publishes the real safe-area insets;
      // `aa-mobile-canvas` scopes native-style hidden scrollbars and
      // `overscroll-behavior: contain` to this whole subtree (its rule is
      // already written as `.aa-mobile-canvas, .aa-mobile-canvas *`, so moving
      // it up from the frame's inner scroll div to this root needs no change);
      // `aa-mobile-viewport` carries the 100vh/100dvh pair.
      className="aa-inset-device aa-mobile-canvas aa-mobile-viewport"
      style={
        {
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          // The horizontal insets are consumed HERE and nowhere else: indenting
          // the whole column in landscape, past the notch, is two lines in one
          // file instead of rewriting 40-odd gutter literals across the app.
          paddingLeft: 'var(--aa-inset-left, 0px)',
          paddingRight: 'var(--aa-inset-right, 0px)',
          boxSizing: 'border-box',
          // Opaque fallback beneath the atmosphere, exactly as the frame does.
          background: neutral.bg,
          color: neutral.ink,
          WebkitFontSmoothing: 'antialiased',
          ...gradientCssVars(gradient),
        } as CSSProperties
      }
    >
      <AtmosphereLayer enabled={gradient.enabled} />
      {children}
      {/* Host chrome, in the same seat `PhoneFrame` keeps its zoom control and
          Gradient Lab. Rendering it here rather than at the router root is what
          lets the pill inherit `--aa-inset-bottom` and sit correctly above the
          tab bar on every device. Its other input, `--aa-dock-height`, does not
          depend on this seat: `MobileCardLayout` publishes it on
          `documentElement`, so it inherits wherever the pill is mounted. */}
      <UpdatePrompt />
    </div>
  )
}
