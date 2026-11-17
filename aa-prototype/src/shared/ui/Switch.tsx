import { accent, neutral, radius } from '../../theme/tokens'
import { motion } from '../../theme/motion'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  /** `sm` the 36x20 track of the step rail's old switch (default); `lg` the 52x32 touch track. */
  size?: 'sm' | 'lg'
  disabled?: boolean
  shot?: string
}

const TRACK = { sm: { w: 36, h: 20, knob: 16 }, lg: { w: 52, h: 32, knob: 26 } } as const

/**
 * The one on/off switch (UI unification U4, group U15): a button with
 * `role="switch"` and `aria-checked`, so click and Space both toggle it. The
 * look is the step rail's 36x20 switch (Phase 20) at `sm`. Built here for
 * Phase 27's approval-step toggle; the PWA demo panel's `ToggleRow` stays its
 * own (a demo surface, question 2).
 */
export function Switch({ checked, onChange, label, description, size = 'sm', disabled = false, shot }: SwitchProps) {
  const t = TRACK[size]
  const inset = (t.h - t.knob) / 2
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      data-shot={shot}
      className="aa-switch"
      onClick={() => onChange(!checked)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: 'none', background: 'transparent', padding: 0, fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer', textAlign: 'left', opacity: disabled ? 0.55 : 1 }}
    >
      <span aria-hidden className="aa-switch-track" style={{ width: t.w, height: t.h, borderRadius: radius.pill, background: checked ? accent.base : neutral.lineStrong, position: 'relative', flex: 'none', transition: `background ${motion.uiFade.duration}ms` }}>
        <span style={{ position: 'absolute', top: inset, left: checked ? t.w - t.knob - inset : inset, width: t.knob, height: t.knob, borderRadius: radius.pill, background: neutral.surface, transition: `left ${motion.uiFade.duration}ms` }} />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: checked ? accent.base : neutral.ink }}>{label}</span>
        {description !== undefined && <span style={{ fontSize: 12.5, color: neutral.slate }}>{description}</span>}
      </span>
    </button>
  )
}
