import { useId, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { NumberField } from '@base-ui/react/number-field'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { CaptureHost, type Procedure } from './capture'
import { CaptureCard, Echo } from './shared'

type Mode = 'none' | 'adjustment' | 'charge'
type Saved = { kind: 'dollarAdjustment' | 'fixedFee'; amount: number; reason: string } | undefined

/** `disabled`: Save stays disabled until the form is valid (today). `submit`: Save is live and errors show on submit (RHF default). */
export type ValidationStyle = 'disabled' | 'submit'

const REASON_REQUIRED = 'A reason is required before the override can be saved.'

const schema = z
  .object({
    mode: z.enum(['none', 'adjustment', 'charge']),
    amount: z.number().nullable(),
    reason: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.mode === 'none') return
    if (v.amount === null) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Enter an amount.' })
    else if (v.mode === 'charge' && v.amount <= 0) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'A charge must be more than $0.' })
    else if (v.mode === 'adjustment' && v.amount === 0) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'An adjustment cannot be $0.' })
    if (v.reason.trim() === '') ctx.addIssue({ code: 'custom', path: ['reason'], message: REASON_REQUIRED })
  })
type Values = z.infer<typeof schema>

const modeOf = (o: Saved): Mode => (o === undefined ? 'none' : o.kind === 'fixedFee' ? 'charge' : 'adjustment')
const money = (n: number) => `$${n.toFixed(2)}`

export function OverrideCardReplacement({ validation }: { validation: ValidationStyle }) {
  return <CaptureHost>{({ procedure, canCapture }) => <Override seeded={procedure} canCapture={canCapture} validation={validation} />}</CaptureHost>
}

/**
 * The Adjustment and charge card under React Hook Form + Zod: the mode as a
 * single-select ToggleGroup (teal segmented), the amount on a Base UI
 * NumberField (two decimals, negative allowed for an adjustment), the reason
 * as a shadcn Field. One schema carries today's rules: a charge above $0, an
 * adjustment not $0, a reason always. Saving is local.
 */
function Override({ seeded, canCapture, validation }: { seeded: Procedure; canCapture: boolean; validation: ValidationStyle }) {
  const initial = seeded.priceOverride
  const [saved, setSaved] = useState<Saved>(initial !== undefined && initial.kind !== 'percentAdjustment' ? initial : undefined)
  const [said, setSaid] = useState<string | null>(null)
  const amountId = useId()
  const reasonId = useId()
  const defaults = (o: Saved): Values => ({ mode: modeOf(o), amount: o?.amount ?? null, reason: o?.reason ?? '' })
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults(saved),
    // Errors appear only after a Save attempt; with Save disabled until valid (today) there never is one.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    // RHF focuses in registration order, which puts the reason (register) before the amount (Controller); focus in screen order instead.
    shouldFocusError: false,
  })
  const [mode, amount, reason] = useWatch({ control: form.control, name: ['mode', 'amount', 'reason'] })
  const errors = form.formState.errors

  if (initial?.kind === 'percentAdjustment') {
    return (
      <CaptureCard label="Adjustment and charge" className="tw:gap-2.5">
        <p className="tw:m-0 tw:text-xs tw:text-slate">
          A percentage adjustment set by the office applies ({initial.percent > 0 ? '+' : ''}
          {initial.percent}%): {initial.reason}
        </p>
        <p className="tw:m-0 tw:text-xs tw:text-mist">Percentage adjustments are set by the office.</p>
      </CaptureCard>
    )
  }
  if (!canCapture) {
    return (
      <CaptureCard label="Adjustment and charge" className="tw:gap-2.5">
        <p className="tw:m-0 tw:text-xs tw:text-mist">
          {saved === undefined ? 'No price override.' : `${saved.kind === 'fixedFee' ? 'Charge' : 'Adjustment'} ${money(saved.amount)} · ${saved.reason}`}
        </p>
      </CaptureCard>
    )
  }

  const dirty =
    mode !== modeOf(saved) || (mode !== 'none' && (saved === undefined || amount !== saved.amount || reason.trim() !== saved.reason))
  const valid = schema.safeParse({ mode, amount, reason }).success
  const saveDisabled = !dirty || (validation === 'disabled' && !valid)

  const onSave = form.handleSubmit((v) => {
    const next: Saved = v.mode === 'none' ? undefined : { kind: v.mode === 'charge' ? 'fixedFee' : 'dollarAdjustment', amount: v.amount ?? 0, reason: v.reason.trim() }
    setSaved(next)
    form.reset(defaults(next))
    setSaid(next === undefined ? 'Saved locally: no override.' : `Saved locally: ${next.kind === 'fixedFee' ? 'Charge' : 'Adjustment'} ${money(next.amount)} · ${next.reason}`)
  }, (errs) => {
    if (errs.amount !== undefined) form.setFocus('amount')
    else if (errs.reason !== undefined) form.setFocus('reason')
  })

  return (
    <>
      <form noValidate onSubmit={onSave}>
        <CaptureCard
          label="Adjustment and charge"
          footer={
            <>
              <Button type="submit" variant="outline" size="lg" className="tw:w-full" disabled={saveDisabled}>
                {mode === 'none' ? 'Save (no override)' : 'Save override'}
              </Button>
              <p className="tw:m-0 tw:text-xs tw:leading-4 tw:text-mist">Percentage adjustments are set by the office.</p>
            </>
          }
        >
          <Controller
            control={form.control}
            name="mode"
            render={({ field }) => (
              <ToggleGroup
                variant="teal"
                role="radiogroup"
                aria-label="Price override"
                className="tw:w-full"
                value={[field.value]}
                onValueChange={(next) => {
                  const picked = next[0] as Mode | undefined
                  if (picked !== undefined) field.onChange(picked)
                }}
              >
                {(
                  [
                    ['none', 'None'],
                    ['adjustment', 'Adjustment $'],
                    ['charge', 'Charge $'],
                  ] as const
                ).map(([value, label]) => (
                  <ToggleGroupItem key={value} value={value} role="radio" aria-checked={field.value === value} aria-pressed={undefined} className="tw:h-10 tw:min-w-0">
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          />
          {mode !== 'none' && (
            <>
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor={amountId}>{mode === 'charge' ? 'Charge amount $' : 'Adjustment $ (negative reduces)'}</FieldLabel>
                    <NumberField.Root
                      id={amountId}
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                      format={{ minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }}
                      step={1}
                      inputRef={field.ref}
                      {...(mode === 'charge' ? { min: 0 } : {})}
                    >
                      <NumberField.Group
                        className={cn(
                          'tw:flex tw:h-12 tw:items-center tw:rounded-ctl tw:border tw:border-line tw:bg-background tw:px-3.5 tw:transition-[border-color,box-shadow] tw:has-[input:focus-visible]:border-primary tw:has-[input:focus-visible]:shadow-focus',
                          fieldState.invalid && 'tw:border-error',
                        )}
                      >
                        <span aria-hidden className="tw:pr-1 tw:font-mono tw:text-[15px] tw:text-mist">
                          $
                        </span>
                        <NumberField.Input
                          onBlur={field.onBlur}
                          aria-invalid={fieldState.invalid || undefined}
                          placeholder={mode === 'charge' ? '450.00' : '-25.00'}
                          className="tw:h-full tw:min-w-0 tw:flex-1 tw:border-0 tw:bg-transparent tw:font-mono tw:text-[15px] tw:text-ink tw:tabular-nums tw:outline-none tw:placeholder:text-mist"
                        />
                      </NumberField.Group>
                    </NumberField.Root>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Field data-invalid={errors.reason !== undefined || undefined}>
                <FieldLabel htmlFor={reasonId}>Reason (required)</FieldLabel>
                <Input id={reasonId} placeholder="Why the price differs" aria-invalid={errors.reason !== undefined || undefined} {...form.register('reason')} />
                {validation === 'disabled' ? (
                  reason.trim() === '' && <p className="tw:m-0 tw:text-xs tw:leading-4 tw:text-warning-on-tint">{REASON_REQUIRED}</p>
                ) : (
                  <FieldError errors={[errors.reason]} />
                )}
              </Field>
            </>
          )}
        </CaptureCard>
      </form>
      <Echo>{said ?? 'Local only: saving does not change the demo data.'}</Echo>
    </>
  )
}
