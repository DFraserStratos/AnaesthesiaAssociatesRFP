import { accent, neutral } from '../../theme/tokens'

/**
 * A teal text action, the only action colour (convention 17): Remove, Put back,
 * Edit, Add a modifier. Shared by the capture modifier ledger and its picker.
 */
export function TextAction({
  children,
  onClick,
  small,
  shot,
  disabled,
  label,
}: {
  children: string
  onClick: () => void
  small?: boolean
  shot?: string
  disabled?: boolean
  /** An accessible name when the visible text alone is ambiguous ("Remove A1"). */
  label?: string
}) {
  return (
    <button
      type="button"
      data-shot={shot}
      aria-label={label}
      disabled={disabled}
      onClick={disabled === true ? undefined : onClick}
      style={{
        border: 'none',
        background: 'none',
        padding: small === true ? '4px 0' : '6px 0',
        fontFamily: 'inherit',
        fontSize: small === true ? 12.5 : 14,
        fontWeight: 600,
        color: disabled === true ? neutral.mist : accent.base,
        cursor: disabled === true ? 'default' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}
