import type { CSSProperties, ReactNode } from 'react'
import type { HolderKind } from './data/types'
import { KIND } from './theme/kinds'
import { accent, neutral, radius, semantic, type } from './theme/tokens'

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <section style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 20, ...style }}>{children}</section>
}

export function Micro({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ fontSize: type.micro.size, lineHeight: `${type.micro.line}px`, fontWeight: type.micro.weight, letterSpacing: type.micro.tracking, textTransform: 'uppercase', color: neutral.slate, ...style }}>{children}</div>
}

type Tone = 'neutral' | 'accent' | 'warning' | 'success'

const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: neutral.sunken, fg: neutral.slate },
  accent: { bg: accent.tint, fg: accent.base },
  warning: { bg: semantic.warning.tint, fg: semantic.warning.onTint },
  success: { bg: semantic.success.tint, fg: semantic.success.onTint },
}

export function Pill({ children, tone = 'neutral', mono }: { children: ReactNode; tone?: Tone; mono?: boolean }) {
  const t = TONES[tone]
  return (
    <span className={mono ? 'mono' : undefined} style={{ display: 'inline-flex', alignItems: 'center', background: t.bg, color: t.fg, borderRadius: radius.pill, padding: '1px 8px', fontSize: 11.5, fontWeight: 600, lineHeight: '18px', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

export function Button({ children, onClick, variant = 'primary', disabled, style }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean; style?: CSSProperties }) {
  const look: CSSProperties =
    variant === 'primary'
      ? { background: accent.base, color: '#FFFFFF', border: `1px solid ${accent.base}` }
      : variant === 'secondary'
        ? { background: neutral.surface, color: accent.base, border: `1px solid ${neutral.lineStrong}` }
        : { background: 'transparent', color: accent.base, border: '1px solid transparent' }
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: radius.ctl, padding: '8px 14px', fontSize: 13.5, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, ...look, ...style }}>
      {children}
    </button>
  )
}

/** Label / value row, as in the prototype's office billing setup card. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '7px 0', borderTop: `1px solid ${neutral.line}` }}>
      <span style={{ width: 96, flex: 'none', fontSize: 12.5, fontWeight: 600, color: neutral.slate }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: neutral.ink }}>{children}</div>
    </div>
  )
}

/** The holder kind's dot: the quiet colour code on rows and filled fields. */
export function KindDot({ kind }: { kind: HolderKind }) {
  return <span aria-hidden title={KIND[kind].label} style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: KIND[kind].solid, flex: 'none', marginRight: 6, verticalAlign: 'middle', position: 'relative', top: -1 }} />
}
