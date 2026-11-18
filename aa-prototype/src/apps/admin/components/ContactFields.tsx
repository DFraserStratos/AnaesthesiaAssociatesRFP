import { Minus } from 'lucide-react'
import { neutral } from '../../../theme/tokens'
import { FormError, IconButton, TextField, visuallyHidden } from '../../../shared/ui'

/** A contact as the form holds it: three strings, blank allowed (the store drops blanks). */
export interface ContactDraft {
  name: string
  email: string
  phone: string
}

export const EMPTY_CONTACT: ContactDraft = { name: '', email: '', phone: '' }

/**
 * One contact's Name, Email and Phone (catch-up Phase 17b, US-13.6.5): a
 * `fieldset` whose legend names it ("Personal contact", "Office contact 2"),
 * the three shared `TextField`s in one row, and, on an office contact after
 * the first, a minus `IconButton` that removes the set whole. Used twice on
 * the surgeon edit sheet. The Name input carries `data-contact-field="name"`
 * so the sheet can move focus to it.
 */
export function ContactFields({
  legend,
  value,
  onChange,
  onRemove,
  error,
  shot,
  index,
  hideLegend = false,
}: {
  legend: string
  /** The legend for screen readers only, where a section heading above already names the set. */
  hideLegend?: boolean
  value: ContactDraft
  onChange: (next: ContactDraft) => void
  /** Present on a removable set only: the minus, labelled "Remove <legend>". */
  onRemove?: () => void
  /** The store's refusal for this contact (a malformed email), shown under the set. */
  error?: string | null
  shot?: string
  /** `data-office-contact` on the set, 1-based. */
  index?: number
}) {
  const invalidEmail = error !== undefined && error !== null
  return (
    <fieldset
      data-shot={shot}
      data-office-contact={index}
      style={{ margin: 0, padding: 0, border: 'none', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {/* The legend stays the fieldset's first child, so it names the group; the visible title sits beside the minus. */}
      <legend style={visuallyHidden}>{legend}</legend>
      {!hideLegend && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 }}>
          <span aria-hidden style={{ fontSize: 13, fontWeight: 600, color: neutral.slate }}>{legend}</span>
          {onRemove !== undefined && (
            <IconButton label={`Remove ${legend.toLowerCase()}`} onClick={onRemove} size={32} bordered shot="office-contact-remove">
              <Minus size={16} strokeWidth={2.2} aria-hidden />
            </IconButton>
          )}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: 10 }}>
        <TextField label="Name" value={value.name} onChange={(name) => onChange({ ...value, name })} data-contact-field="name" />
        <TextField label="Email" type="email" mono value={value.email} onChange={(email) => onChange({ ...value, email })} invalid={invalidEmail} placeholder="name@example.co.nz" />
        <TextField label="Phone" type="tel" value={value.phone} onChange={(phone) => onChange({ ...value, phone })} placeholder="03 555 0100" />
      </div>
      <FormError message={error} variant="inline" />
    </fieldset>
  )
}
