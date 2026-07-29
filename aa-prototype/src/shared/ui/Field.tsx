import type { CSSProperties, ReactNode } from 'react'
import { neutral, radius } from '../../theme/tokens'
import { SlidingSegmentedControl } from './SlidingSegmentedControl'

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}

const controlStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 48,
  borderRadius: radius.ctl,
  border: `1px solid ${neutral.line}`,
  background: neutral.bg,
  padding: '0 14px',
  fontFamily: 'inherit',
  fontSize: 15,
  color: neutral.ink,
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'date' | 'email' | 'tel'
  mono?: boolean
}

export function TextField({ label, value, onChange, placeholder, type = 'text', mono }: TextFieldProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={mono === true ? 'mono' : undefined}
        style={controlStyle}
      />
    </label>
  )
}

interface TextAreaProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onBlur?: () => void
}

export function TextArea({ label, value, onChange, placeholder, onBlur }: TextAreaProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label !== undefined && <FieldLabel>{label}</FieldLabel>}
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        style={{ ...controlStyle, minHeight: 72, padding: 12, resize: 'none', lineHeight: '20px' }}
      />
    </label>
  )
}

interface SegmentedProps<T extends string> {
  label?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  /** Read-only rendering: selection stays visible, taps do nothing. */
  disabled?: boolean
}

/** A segmented control (convention 16: prefer over a dropdown). Teal selection. */
export function Segmented<T extends string>({ label, value, options, onChange, disabled }: SegmentedProps<T>) {
  const isDisabled = disabled === true
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label !== undefined && <FieldLabel>{label}</FieldLabel>}
      <SlidingSegmentedControl
        value={value}
        options={options}
        onSelect={onChange}
        disabled={isDisabled}
        ariaLabel={label}
      />
    </div>
  )
}
