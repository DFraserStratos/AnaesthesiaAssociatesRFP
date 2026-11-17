import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { accent, neutral, radius, elevation, zIndex } from '../../theme/tokens'
import { motion } from '../../theme/motion'

export type SlidingSegmentLayout = 'row' | 'two-column' | 'wrap'
export type SlidingSegmentVariant = 'teal' | 'surface'
/** `md` today's control (40px items, default); `sm` the 36px toolbar fit (30px items, 12px type; Admin Day's row order, U5). */
export type SlidingSegmentSize = 'sm' | 'md'

export interface SlidingSegmentOption<T extends string> {
  value: T
  label: ReactNode
  disabled?: boolean
  title?: string
}

interface SlidingSegmentedControlProps<T extends string> {
  value: T | undefined
  options: readonly SlidingSegmentOption<T>[]
  onSelect: (value: T) => void
  layout?: SlidingSegmentLayout
  variant?: SlidingSegmentVariant
  size?: SlidingSegmentSize
  disabled?: boolean
  ariaLabel?: string
  trackStyle?: CSSProperties
  indicatorStyle?: CSSProperties
  buttonStyle?: CSSProperties | ((option: SlidingSegmentOption<T>, selected: boolean) => CSSProperties)
}

interface IndicatorState {
  x: number
  y: number
  width: number
  height: number
  visible: boolean
  animatePosition: boolean
  animateOpacity: boolean
}

const EMPTY_INDICATOR: IndicatorState = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  visible: false,
  animatePosition: false,
  animateOpacity: false,
}

const VARIANT_STYLE: Record<
  SlidingSegmentVariant,
  { background: string; active: string; inactive: string; shadow: string }
> = {
  teal: {
    background: accent.base,
    active: neutral.surface,
    inactive: neutral.slate,
    shadow: elevation.thumb,
  },
  surface: {
    background: neutral.surface,
    active: accent.base,
    inactive: neutral.slate,
    shadow: '0 1px 3px rgba(23,35,32,0.15)',
  },
}

/** Track and item metrics per size. `md` is today's control; `sm` is SortToggle's (U5). */
const SIZE_STYLE: Record<SlidingSegmentSize, { trackPad: number; trackGap: number; trackRadius: number; itemHeight: number; itemPad: string; itemRadius: number; fontSize: number }> = {
  md: { trackPad: 4, trackGap: 4, trackRadius: radius.md, itemHeight: 40, itemPad: '0 12px', itemRadius: 9, fontSize: 14 },
  sm: { trackPad: 3, trackGap: 2, trackRadius: radius.ctl, itemHeight: 30, itemPad: '0 10px', itemRadius: radius.sm, fontSize: 12 },
}

/**
 * A segmented control whose single selection highlight moves between real
 * buttons. Measuring the active button rather than deriving a percentage lets
 * the same primitive handle equal rows, two-column grids and wrapped,
 * variable-width segments on both product surfaces.
 */
export function SlidingSegmentedControl<T extends string>({
  value,
  options,
  onSelect,
  layout = 'row',
  variant = 'teal',
  size = 'md',
  disabled = false,
  ariaLabel,
  trackStyle,
  indicatorStyle,
  buttonStyle,
}: SlidingSegmentedControlProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef(new Map<T, HTMLButtonElement>())
  const hasCompletedInitialLayout = useRef(false)
  const [indicator, setIndicator] = useState<IndicatorState>(EMPTY_INDICATOR)
  const colours = VARIANT_STYLE[variant]
  const metrics = SIZE_STYLE[size]

  const measure = useCallback(() => {
    if (value === undefined) {
      setIndicator((current) =>
        current.visible
          ? { ...current, visible: false, animatePosition: false, animateOpacity: true }
          : current,
      )
      return
    }

    const track = trackRef.current
    const button = buttonRefs.current.get(value)
    if (track === null || button === undefined) return
    const next = {
      // Local layout coordinates stay correct when PhoneFrame applies its
      // presenter scale. Viewport rects would already contain that scale and
      // the indicator would then inherit it a second time.
      x: button.offsetLeft,
      y: button.offsetTop,
      width: button.offsetWidth,
      height: button.offsetHeight,
    }

    setIndicator((current) => {
      const unchanged =
        current.visible &&
        current.x === next.x &&
        current.y === next.y &&
        current.width === next.width &&
        current.height === next.height
      if (unchanged) return current
      return {
        ...next,
        visible: true,
        animatePosition: current.visible,
        animateOpacity: !current.visible && hasCompletedInitialLayout.current,
      }
    })
  }, [value])

  useLayoutEffect(() => {
    measure()
    hasCompletedInitialLayout.current = true
    const track = trackRef.current
    const active = value === undefined ? undefined : buttonRefs.current.get(value)
    if (typeof ResizeObserver === 'undefined' || track === null) return
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    if (active !== undefined) observer.observe(active)
    return () => observer.disconnect()
  }, [measure, options.length, layout, value])

  const trackLayout: CSSProperties =
    layout === 'two-column'
      ? { display: 'grid', gridTemplateColumns: '1fr 1fr' }
      : layout === 'wrap'
        ? { display: 'inline-flex', flexWrap: 'wrap', maxWidth: '100%' }
        : { display: 'flex' }

  const positionTransition = indicator.animatePosition
    ? [
        `transform ${motion.selectionSlide.duration}ms ${motion.selectionSlide.easing}`,
        `width ${motion.selectionSlide.duration}ms ${motion.selectionSlide.easing}`,
        `height ${motion.selectionSlide.duration}ms ${motion.selectionSlide.easing}`,
        'opacity 120ms ease-out',
      ].join(', ')
    : indicator.animateOpacity
      ? 'opacity 120ms ease-out'
      : 'none'

  return (
    <div
      ref={trackRef}
      role="group"
      aria-label={ariaLabel}
      data-sliding-segmented-control
      style={{
        position: 'relative',
        background: neutral.sunken,
        borderRadius: metrics.trackRadius,
        padding: metrics.trackPad,
        gap: metrics.trackGap,
        opacity: disabled ? 0.55 : 1,
        ...trackLayout,
        ...trackStyle,
      }}
    >
      <span
        aria-hidden
        data-sliding-segment-indicator
        data-selected-value={value}
        className="aa-sliding-segment-indicator"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: indicator.width,
          height: indicator.height,
          borderRadius: metrics.itemRadius,
          background: colours.background,
          boxShadow: colours.shadow,
          opacity: indicator.visible ? 1 : 0,
          transform: `translate3d(${indicator.x}px, ${indicator.y}px, 0)`,
          transition: positionTransition,
          pointerEvents: 'none',
          zIndex: 0,
          ...indicatorStyle,
        }}
      />
      {options.map((option) => {
        const selected = option.value === value
        const inert = disabled || option.disabled === true
        const optionStyle =
          typeof buttonStyle === 'function' ? buttonStyle(option, selected) : buttonStyle
        return (
          <button
            key={option.value}
            ref={(node) => {
              if (node === null) buttonRefs.current.delete(option.value)
              else buttonRefs.current.set(option.value, node)
            }}
            type="button"
            className="aa-ctl"
            disabled={inert}
            aria-pressed={selected}
            title={option.title}
            onClick={inert ? undefined : () => onSelect(option.value)}
            style={{
              position: 'relative',
              zIndex: zIndex.raised,
              flex: layout === 'row' ? 1 : layout === 'wrap' ? '0 0 auto' : undefined,
              minWidth: 0,
              minHeight: metrics.itemHeight,
              padding: metrics.itemPad,
              borderRadius: metrics.itemRadius,
              border: 'none',
              background: 'transparent',
              color: inert ? neutral.lineStrong : selected ? colours.active : colours.inactive,
              fontFamily: 'inherit',
              fontSize: metrics.fontSize,
              fontWeight: 600,
              cursor: inert ? 'default' : 'pointer',
              transition: `color ${motion.uiFade.duration}ms ${motion.uiFade.easing}`,
              ...optionStyle,
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
