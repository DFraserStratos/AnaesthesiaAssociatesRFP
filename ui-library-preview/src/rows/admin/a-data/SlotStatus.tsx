import { useId, useMemo, useState, type CSSProperties } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { validateSlotStatusDraft } from '@proto/domain/slotStatus'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { useStore } from './data'
import { Echo } from './shared'

const TOKENS = ['private', 'public', 'preop', 'holiday', 'unavailable', 'free'] as const
type Token = (typeof TOKENS)[number]
const TREATMENTS = [
  { value: 'solid', label: 'Solid' },
  { value: 'hatched', label: 'Hatched' },
  { value: 'dashed', label: 'Dashed' },
] as const
type Treatment = (typeof TREATMENTS)[number]['value']

/** Literal class names per token, so Tailwind sees each one. */
const SWATCH: Record<Token, string> = {
  private: 'tw:bg-status-private-tint tw:border-l-status-private',
  public: 'tw:bg-status-public-tint tw:border-l-status-public',
  preop: 'tw:bg-status-preop-tint tw:border-l-status-preop',
  holiday: 'tw:bg-status-holiday-tint tw:border-l-status-holiday',
  unavailable: 'tw:bg-status-unavailable-tint tw:border-l-status-unavailable',
  free: 'tw:bg-status-free-tint tw:border-l-status-free',
}
const ON_TINT: Record<Token, string> = {
  private: 'tw:text-status-private-on-tint',
  public: 'tw:text-status-public-on-tint',
  preop: 'tw:text-status-preop-on-tint',
  holiday: 'tw:text-status-holiday-on-tint',
  unavailable: 'tw:text-status-unavailable-on-tint',
  free: 'tw:text-status-free-on-tint',
}

/** The session block's fill for any token and treatment, from the theme's own variables (no new colour). */
function blockStyle(token: Token, treatment: Treatment): CSSProperties {
  const tint = `var(--status-${token}-tint)`
  const solid = `var(--status-${token})`
  if (treatment === 'hatched') return { background: `repeating-linear-gradient(135deg, ${tint} 0 5px, var(--aa-line) 5px 10px)`, boxShadow: `inset 3px 0 0 ${solid}` }
  if (treatment === 'dashed') return { background: tint, border: `1.5px dashed ${solid}` }
  return { background: tint, boxShadow: `inset 3px 0 0 ${solid}` }
}

interface Draft {
  label: string
  longLabel: string
  description: string
  colour: Token
  treatment: Treatment
  bookable: boolean
  anaesthetistCanSet: boolean
  isDefault: boolean
}

const EMPTY: Draft = { label: '', longLabel: '', description: '', colour: 'unavailable', treatment: 'hatched', bookable: false, anaesthetistCanSet: true, isDefault: false }

/** Which field a validator sentence is about (the validator returns plain sentences, not paths). */
function fieldOf(issue: string): keyof Draft | 'root' {
  const s = issue.toLowerCase()
  if (s.includes('long label')) return 'longLabel'
  if (s.includes('description')) return 'description'
  if (s.includes('default')) return 'isDefault'
  if (s.includes('label') || s.includes('called') || s.includes("list's state") || s.includes('list type')) return 'label'
  return 'root'
}

/**
 * SlotStatusSheet as a shadcn Dialog on React Hook Form. The prototype's own validator
 * (`validateSlotStatusDraft`) is the Zod schema's refinement, so every rule and sentence is
 * unchanged and checked as you type. Colour swatches and Fill are ToggleGroups (radio semantics,
 * arrow keys), the flags shadcn Checkboxes, the preview a status Badge and a session block.
 * Saving is local: nothing reaches the store. `issues`: listed above Save (as today) or each
 * under its own field.
 */
export function SlotStatusSheetReplacement({ issues: placement }: { issues: 'list' | 'field' }) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  return (
    <div>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        New availability status
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="tw:max-h-[calc(100%-48px)] tw:gap-3.5 tw:overflow-y-auto tw:sm:max-w-[560px]">
          {open && (
            <StatusForm
              placement={placement}
              onSave={(d) => {
                setSaved(`Added ${d.label.trim()} (${d.colour}, ${d.treatment}) locally: nothing is saved to the store.`)
                setOpen(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Echo>{saved ?? 'Local only: nothing is saved to the store.'}</Echo>
    </div>
  )
}

function StatusForm({ placement, onSave }: { placement: 'list' | 'field'; onSave: (d: Draft) => void }) {
  const statuses = useStore((s) => s.masters.slotStatuses)
  const ids = { label: useId(), long: useId(), desc: useId() }
  const schema = useMemo(
    () =>
      z
        .object({
          label: z.string(),
          longLabel: z.string(),
          description: z.string(),
          colour: z.enum(TOKENS),
          treatment: z.enum(['solid', 'hatched', 'dashed']),
          bookable: z.boolean(),
          anaesthetistCanSet: z.boolean(),
          isDefault: z.boolean(),
        })
        .superRefine((draft, ctx) => {
          for (const issue of validateSlotStatusDraft(draft, statuses) as string[]) {
            const field = fieldOf(issue)
            ctx.addIssue({ code: 'custom', path: [field], message: issue })
          }
        }),
    [statuses],
  )
  const form = useForm<Draft>({ resolver: zodResolver(schema) as never, defaultValues: EMPTY, mode: 'onChange' })
  const draft = useWatch({ control: form.control }) as Draft
  const touched = form.formState.isDirty
  const issues = useMemo(() => validateSlotStatusDraft(draft, statuses) as string[], [draft, statuses])
  const e = form.formState.errors
  const showField = placement === 'field' && touched
  const err = (k: keyof Draft | 'root') => (showField ? (e as Record<string, { message?: string } | undefined>)[k] : undefined)

  const previewLabel = draft.label.trim() === '' ? 'Label' : draft.label.trim()
  const previewLong = draft.longLabel.trim() === '' ? 'Long label' : draft.longLabel.trim()

  return (
    <form noValidate className="tw:flex tw:flex-col tw:gap-3.5" onSubmit={form.handleSubmit((d) => onSave(d))}>
      <DialogHeader className="tw:gap-0.5">
        <DialogTitle className="tw:pr-0">Add an availability status</DialogTitle>
        <DialogDescription>Rules read the ID, so a new name or colour changes how it looks, never how it behaves.</DialogDescription>
      </DialogHeader>

      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-ctl tw:bg-background tw:px-3 tw:py-2.5">
        <span className="tw:text-[11px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">ID</span>
        <span className="tw:font-mono tw:text-[13px] tw:text-mist">Assigned when saved</span>
      </div>

      <div className="tw:grid tw:grid-cols-[1fr_1.4fr] tw:gap-3">
        <Field data-invalid={err('label') !== undefined ? true : undefined}>
          <FieldLabel htmlFor={ids.label}>Label</FieldLabel>
          <Input id={ids.label} placeholder="e.g. Lecturing" aria-invalid={err('label') !== undefined ? true : undefined} {...form.register('label')} />
          {err('label') === undefined ? <FieldDescription>On chips, up to 16 characters.</FieldDescription> : <FieldError errors={[err('label')]} />}
        </Field>
        <Field data-invalid={err('longLabel') !== undefined ? true : undefined}>
          <FieldLabel htmlFor={ids.long}>Long label</FieldLabel>
          <Input id={ids.long} placeholder="e.g. Teaching or lecturing" aria-invalid={err('longLabel') !== undefined ? true : undefined} {...form.register('longLabel')} />
          {err('longLabel') === undefined ? <FieldDescription>In headers and pickers, up to 32.</FieldDescription> : <FieldError errors={[err('longLabel')]} />}
        </Field>
      </div>
      <Field data-invalid={err('description') !== undefined ? true : undefined}>
        <FieldLabel htmlFor={ids.desc}>Description</FieldLabel>
        <Textarea
          id={ids.desc}
          placeholder="What this status means, in a sentence."
          className="tw:h-[72px] tw:field-sizing-fixed"
          aria-invalid={err('description') !== undefined ? true : undefined}
          {...form.register('description')}
        />
        <FieldError errors={[err('description')]} />
      </Field>

      <FieldSet className="tw:gap-2">
        <FieldLegend variant="label" className="tw:mb-0 tw:text-[11px]! tw:leading-[14px]! tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">Colour</FieldLegend>
        <Controller
          control={form.control}
          name="colour"
          render={({ field }) => (
            <ToggleGroup
              variant="outline"
              aria-label="Colour"
              value={[field.value]}
              onValueChange={(v: unknown[]) => {
                if (typeof v[0] === 'string') field.onChange(v[0])
              }}
              className="tw:grid tw:w-full tw:grid-cols-6 tw:gap-2"
            >
              {TOKENS.map((token) => (
                <ToggleGroupItem
                  key={token}
                  value={token}
                  aria-label={`Colour ${token}`}
                  className="tw:h-auto tw:flex-col tw:gap-1.5 tw:min-w-0 tw:rounded-ctl! tw:border tw:border-line tw:bg-surface tw:px-0.5 tw:pt-2.5 tw:pb-2 tw:data-pressed:border-2 tw:data-pressed:border-primary tw:data-pressed:bg-surface tw:data-pressed:px-px tw:data-pressed:pt-[9px] tw:data-pressed:pb-[7px]"
                >
                  <span aria-hidden className={cn('tw:h-5 tw:w-7 tw:rounded-[6px] tw:border-l-4', SWATCH[token])} />
                  <span className={cn('tw:font-mono tw:text-[10.5px] tw:font-normal tw:tracking-[-0.03em]', field.value === token ? 'tw:text-teal-pressed' : 'tw:text-slate')}>{token}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
      </FieldSet>

      <Field>
        <FieldLabel>Fill</FieldLabel>
        <Controller
          control={form.control}
          name="treatment"
          render={({ field }) => (
            <ToggleGroup
              variant="teal"
              aria-label="Fill"
              value={[field.value]}
              onValueChange={(v: unknown[]) => {
                if (typeof v[0] === 'string') field.onChange(v[0])
              }}
              className="tw:w-full"
            >
              {TREATMENTS.map((t) => (
                <ToggleGroupItem key={t.value} value={t.value}>
                  {t.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
      </Field>

      <div className="tw:flex tw:flex-col tw:rounded-ctl tw:border tw:border-line">
        {(
          [
            ['bookable', 'Open for bookings', 'The office may place a List here and the finders count it as free.'],
            ['anaesthetistCanSet', 'Anaesthetists can set this', "Offered in the anaesthetists' availability calendar."],
            ['isDefault', 'Default for new sessions', 'Every new session starts here, and a removed day off returns to it.'],
          ] as const
        ).map(([name, title, hint], i) => (
          <Controller
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <Field orientation="horizontal" className={cn('tw:cursor-pointer tw:px-3 tw:py-2.5', i > 0 && 'tw:border-t tw:border-line')}>
                <Checkbox id={`${ids.label}-${name}`} checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} className="tw:mt-0.5" />
                <FieldContent>
                  <FieldTitle className="tw:text-sm">
                    <label htmlFor={`${ids.label}-${name}`} className="tw:cursor-pointer">
                      {title}
                    </label>
                  </FieldTitle>
                  <FieldDescription>{hint}</FieldDescription>
                  {name === 'isDefault' && <FieldError errors={[err('isDefault')]} />}
                </FieldContent>
              </Field>
            )}
          />
        ))}
      </div>

      <div className="tw:flex tw:flex-col tw:gap-2">
        <span className="tw:text-[11px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">Preview</span>
        <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-ctl tw:bg-background tw:p-3">
          <Badge variant={draft.colour} className="tw:flex-none">
            {previewLabel}
          </Badge>
          <span className="tw:block tw:min-w-0 tw:flex-1 tw:rounded-[6px] tw:px-[9px] tw:py-1.5" style={blockStyle(draft.colour, draft.treatment)}>
            <span className={cn('tw:block tw:text-[11px] tw:font-semibold', ON_TINT[draft.colour])}>{previewLong}</span>
            <span className={cn('tw:block tw:text-[10px] tw:opacity-75', ON_TINT[draft.colour])}>AM · a session with no List</span>
          </span>
        </div>
      </div>

      {placement === 'list' && touched && issues.length > 0 && (
        <ul className="tw:m-0 tw:pl-[18px] tw:text-[12.5px] tw:leading-[18px] tw:text-slate">
          {issues.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
      {placement === 'field' && <FieldError errors={[err('root')]} />}
      <Button type="submit" size="cta" className="tw:w-full" disabled={issues.length > 0}>
        Add status
      </Button>
    </form>
  )
}
