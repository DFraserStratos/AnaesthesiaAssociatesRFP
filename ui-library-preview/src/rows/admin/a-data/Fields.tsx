import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { DatePicker } from './DatePicker'
import { dayText } from '../../shared/DatePickerTrigger'
import { useDemoToday, useHorizon } from './data'
import { Echo, FormAlert } from './shared'

// ---------------------------------------------------------------------------
// TextField
// ---------------------------------------------------------------------------

const textFieldSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name.'),
  code: z.string(),
})

/**
 * TextField as shadcn Field + Input, registered with React Hook Form. Same two fields, labels,
 * placeholder, mono variant and hint as the example. The hint is FieldDescription (tied by
 * aria-describedby); a Zod rule shows how an error binds to its field with aria-invalid.
 */
export function TextFieldReplacement() {
  const nameId = useId()
  const codeId = useId()
  const hintId = useId()
  const errorId = useId()
  const form = useForm({
    resolver: zodResolver(textFieldSchema),
    defaultValues: { name: 'Labour Day', code: 'H3' },
    mode: 'onTouched',
  })
  const nameError = form.formState.errors.name
  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      <Field data-invalid={nameError !== undefined ? true : undefined}>
        <FieldLabel htmlFor={nameId}>Name</FieldLabel>
        <Input
          id={nameId}
          placeholder="e.g. Labour Day"
          aria-invalid={nameError !== undefined ? true : undefined}
          aria-describedby={nameError !== undefined ? errorId : undefined}
          {...form.register('name')}
        />
        <FieldError id={errorId} errors={[nameError]} />
      </Field>
      <Field>
        <FieldLabel htmlFor={codeId}>RVG code</FieldLabel>
        <Input id={codeId} className="tw:font-mono" aria-describedby={hintId} {...form.register('code')} />
        <FieldDescription id={hintId}>Mono variant with a hint line.</FieldDescription>
      </Field>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TextArea
// ---------------------------------------------------------------------------

/**
 * TextArea as shadcn Field + Textarea, same label, placeholder and blur count. `grow` keeps
 * shadcn's field-sizing-content (the box grows with the text); off keeps today's fixed 72px box.
 */
export function TextAreaReplacement({ grow = false }: { grow?: boolean }) {
  const id = useId()
  const [text, setText] = useState('')
  const [blurred, setBlurred] = useState(0)
  return (
    <div>
      <Field>
        <FieldLabel htmlFor={id}>Internal note</FieldLabel>
        <Textarea
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => setBlurred((n) => n + 1)}
          placeholder="Visible to the office only"
          className={cn(grow ? 'tw:max-h-[200px]' : 'tw:h-[72px] tw:field-sizing-fixed')}
        />
      </Field>
      <Echo>
        {text.length} characters · blurred {blurred} time{blurred === 1 ? '' : 's'}
      </Echo>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FieldLabel / FormError
// ---------------------------------------------------------------------------

const BASE_UNITS_MESSAGE = 'Base units must be a whole number above 0.'
const baseUnitsSchema = z.object({
  baseUnits: z.string().trim().regex(/^[1-9]\d*$/, BASE_UNITS_MESSAGE),
})

/**
 * The field label (FieldLabel, the 11px uppercase eyebrow) and the refused-save message, on React
 * Hook Form + Zod: the rule is a schema, Validate submits the form. `placement` decides where the
 * message shows: the error-tint box under the form (as today), or FieldError under its field.
 * Either way the input carries aria-invalid and points at the message with aria-describedby.
 */
export function FormErrorReplacement({ placement }: { placement: 'form' | 'field' }) {
  const id = useId()
  const errorId = useId()
  const [checked, setChecked] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(baseUnitsSchema),
    defaultValues: { baseUnits: '' },
    mode: 'onSubmit',
    reValidateMode: placement === 'field' ? 'onChange' : 'onSubmit',
  })
  const error = form.formState.errors.baseUnits
  return (
    <form
      noValidate
      className="tw:flex tw:flex-col tw:gap-2"
      onSubmit={form.handleSubmit(
        (v) => setChecked(`Valid: ${v.baseUnits.trim()} base units.`),
        () => setChecked(null),
      )}
    >
      <Field data-invalid={error !== undefined ? true : undefined} className="tw:gap-2">
        <FieldLabel htmlFor={id}>Base units (FieldLabel)</FieldLabel>
        <Input
          id={id}
          placeholder="A whole number above 0"
          aria-invalid={error !== undefined ? true : undefined}
          aria-describedby={error !== undefined ? errorId : undefined}
          {...form.register('baseUnits')}
        />
        {placement === 'field' && <FieldError id={errorId} errors={[error]} />}
      </Field>
      <div className="tw:flex tw:gap-2">
        <Button type="submit" variant="pill">
          Validate
        </Button>
      </div>
      {placement === 'form' && (
        <div id={errorId}>
          <FormAlert message={error?.message} />
        </div>
      )}
      <Echo>{checked ?? ''}</Echo>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Native date input (TextField type=date)
// ---------------------------------------------------------------------------

/**
 * The date TextField as the shadcn Date Picker (Popover + Calendar), bounded by the demo clock's
 * today and the schedule horizon. `typed` keeps a field the office can type a date into (closest
 * to the native input); off, the field is a button that opens the calendar (shadcn's pattern).
 */
export function DateFieldReplacement({ typed }: { typed: boolean }) {
  const id = useId()
  const hintId = useId()
  const { todayISO, today } = useDemoToday()
  const horizon = useHorizon()
  const [dateISO, setDateISO] = useState(todayISO)
  return (
    <div>
      <Field>
        <FieldLabel htmlFor={id}>Date</FieldLabel>
        <DatePicker
          id={id}
          value={dateISO}
          onChange={setDateISO}
          today={today}
          min={horizon.startISO}
          max={horizon.endISO}
          typed={typed}
          aria-describedby={hintId}
        />
        <FieldDescription id={hintId}>
          {typed ? 'Type a date, or pick one from the calendar.' : 'Opens the calendar.'} Today to {dayText(horizon.endISO)}, the schedule horizon.
        </FieldDescription>
      </Field>
      <Echo>Value: {dateISO === '' ? '(none)' : dayText(dateISO)}</Echo>
    </div>
  )
}
