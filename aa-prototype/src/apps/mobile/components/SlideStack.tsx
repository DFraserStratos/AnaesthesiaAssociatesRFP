import type { ReactNode } from 'react'
import { motion } from '../../../theme/motion'

export interface SlideLayer {
  key: string
  /** Rendered only when true; the slot otherwise sits empty off-screen right. */
  mounted: boolean
  node: ReactNode
}

interface SlideStackProps {
  layers: SlideLayer[]
  /** Active layer index (0 = base). Layers before it park at −24% + dim; after, off-screen right. */
  depth: number
}

/**
 * The card-advance choreography (Design Language §05; convention 17): every
 * layer stays mounted and absolutely positioned; the active one sits at
 * translateX(0), the one behind parallaxes to −24% and dims 8%, layers ahead
 * wait off-screen right. Transform transitions run at `motion.cardAdvance`, so
 * pushing and popping both animate. Matches the mockup's translateX approach —
 * screens stay mounted for the slide.
 */
export function SlideStack({ layers, depth }: SlideStackProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {layers.map((layer, i) => {
        let transform: string
        if (i === depth) transform = 'translateX(0)'
        else if (i < depth) transform = `translateX(${motion.cardAdvance.parallax})`
        else transform = 'translateX(100%)'
        const behind = i < depth
        return (
          <div
            key={layer.key}
            aria-hidden={i !== depth}
            style={{
              // Opaque layers (so a parked layer-behind never shows through the
              // active layer's gutters) that paint the SAME atmosphere as the
              // rest of the canvas via PhoneFrame's shared `--aa-atmos-*` vars.
              // Pixel-aligned with the fixed AtmosphereLayer at rest, so push /
              // pop stays seamless (no flash or restart) and parallax is intact.
              position: 'absolute',
              inset: 0,
              background: 'var(--aa-atmos-base, #F6F8F7)',
              backgroundImage: 'var(--aa-atmos-image, none)',
              transform,
              transition: `transform ${motion.cardAdvance.in}ms ${motion.cardAdvance.easing}`,
              boxShadow: i === depth && i > 0 ? '-16px 0 32px rgba(23,35,32,0.12)' : 'none',
              // Off-screen layers must not intercept taps.
              pointerEvents: i === depth ? 'auto' : 'none',
            }}
          >
            {layer.mounted ? layer.node : null}
            {behind && (
              <div
                aria-hidden
                style={{ position: 'absolute', inset: 0, background: `rgba(23,35,32,${motion.cardAdvance.dim})`, pointerEvents: 'none' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
