import type { CSSProperties, ReactNode } from 'react'
import { brand, neutral, semantic, type as typeScale } from '../../theme/tokens'
import type { DataAttributes } from './Field'

export type EyebrowTone = 'mist' | 'slate' | 'warning' | 'brand'

const TONE: Record<EyebrowTone, string> = {
  mist: neutral.mist,
  slate: neutral.slate,
  warning: semantic.warning.onTint,
  brand: brand.base,
}

/**
 * The 11px caps tracked label above a value, a section or a field (UI unification U6, group U22):
 * `type.micro`, 11/600/0.06em caps, one size and weight everywhere (question 23). `as="h3"` (or `h2`)
 * where it titles a section, so heading navigation reaches it; otherwise a `div` (or `span` inline).
 * Tones: mist (default), slate, warning, brand (the crimson eyebrow the Mobile App mockup draws).
 * `FieldLabel` is this component. Line height is inherited, as every copy it replaced had it.
 */
export function Eyebrow({
  children,
  as: Tag = 'div',
  tone = 'mist',
  id,
  shot,
  style,
  ...data
}: {
  children: ReactNode
  as?: 'div' | 'span' | 'h2' | 'h3'
  tone?: EyebrowTone
  id?: string
  shot?: string
  style?: CSSProperties
} & DataAttributes) {
  return (
    <Tag
      {...data}
      id={id}
      data-shot={shot}
      style={{
        ...(Tag === 'div' || Tag === 'span' ? {} : { margin: 0 }),
        fontSize: typeScale.micro.size,
        fontWeight: typeScale.micro.weight,
        letterSpacing: typeScale.micro.tracking,
        textTransform: 'uppercase',
        color: TONE[tone],
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}
