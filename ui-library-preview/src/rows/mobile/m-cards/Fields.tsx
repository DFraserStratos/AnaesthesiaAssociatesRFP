import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Col } from './shared'

// ---------------------------------------------------------------------------
// TextField
// ---------------------------------------------------------------------------

/**
 * shadcn Field + FieldLabel + Input + FieldDescription. The label is a real <label htmlFor>
 * (the eyebrow look is the kit FieldLabel); the hint is tied by aria-describedby.
 */
export function TextFieldReplacement() {
  const [value, setValue] = useState('')
  return (
    <Field>
      <FieldLabel htmlFor="m-cards-patient-name">Patient name</FieldLabel>
      <Input id="m-cards-patient-name" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Surname, first name" aria-describedby="m-cards-patient-name-hint" />
      <FieldDescription id="m-cards-patient-name-hint">As it appears on the List</FieldDescription>
    </Field>
  )
}

// ---------------------------------------------------------------------------
// TextArea
// ---------------------------------------------------------------------------

export function TextAreaReplacement() {
  const [value, setValue] = useState('')
  return (
    <Field>
      <FieldLabel htmlFor="m-cards-office-note">Note for the office</FieldLabel>
      <Textarea id="m-cards-office-note" value={value} onChange={(e) => setValue(e.target.value)} placeholder="What should the office check?" />
    </Field>
  )
}

// ---------------------------------------------------------------------------
// FormError
// ---------------------------------------------------------------------------

const MESSAGE = 'Add a note of at least 3 characters.'
const schema = z.object({ note: z.string().trim().min(3, MESSAGE) })
type Values = z.infer<typeof schema>

/**
 * Two placements for the refused save:
 *  - form: today's error-tint box under the form, as a shadcn Alert (destructive, role=alert);
 *  - field: a FieldError under the field that caused it, bound by React Hook Form + Zod, with
 *    aria-invalid on the textarea and the message tied by aria-describedby.
 */
export function FormErrorReplacement({ placement }: { placement: 'form' | 'field' }) {
  const [show, setShow] = useState(true)
  if (placement === 'form') {
    return (
      <Col>
        {show && (
          <Alert variant="destructive" className="tw:px-3 tw:py-2.5">
            <AlertDescription>{MESSAGE}</AlertDescription>
          </Alert>
        )}
        <Button variant="pill" onClick={() => setShow((s) => !s)}>
          {show ? 'Clear the error' : 'Show the error'}
        </Button>
      </Col>
    )
  }
  return <FieldBoundError />
}

function FieldBoundError() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { note: '' }, mode: 'onSubmit', reValidateMode: 'onChange' })
  const error = form.formState.errors.note
  useEffect(() => {
    form.setError('note', { type: 'manual', message: MESSAGE })
  }, [form])
  return (
    <form noValidate onSubmit={form.handleSubmit(() => form.clearErrors())}>
      <Col>
        <Field data-invalid={error !== undefined || undefined}>
          <FieldLabel htmlFor="m-cards-error-note">Note for the office</FieldLabel>
          <Textarea
            id="m-cards-error-note"
            placeholder="What should the office check?"
            aria-invalid={error !== undefined || undefined}
            aria-describedby={error !== undefined ? 'm-cards-error-note-msg' : undefined}
            {...form.register('note', { onChange: () => void (form.getFieldState('note').invalid && form.trigger('note')) })}
          />
          <FieldError id="m-cards-error-note-msg" errors={[error]} />
        </Field>
        <div className="tw:flex tw:gap-2">
          <Button variant="pill" type="button" onClick={() => (error !== undefined ? form.clearErrors('note') : form.setError('note', { type: 'manual', message: MESSAGE }, { shouldFocus: true }))}>
            {error !== undefined ? 'Clear the error' : 'Show the error'}
          </Button>
          <Button variant="pill" type="submit">
            Send
          </Button>
        </div>
      </Col>
    </form>
  )
}
