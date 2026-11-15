import { useId, useMemo, useState, type ReactNode } from 'react'
import { Controller, useForm, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { NumberField } from '@base-ui/react/number-field'
import { BellRing, History, Minus, Paperclip, Plus, Users, XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore, useToday } from '@proto/store'
import { ageYears, BOOKING_SOURCE_LABELS, formatDob, nhiBadge } from '@proto/shared/format'
import { timeUnitsFromMinutes } from '@proto/domain/billing'
import { Missing, Said, useMobilePersona, useSeedPicks } from './shared'

// ---------------------------------------------------------------------------
// Seeded subject (read only; the preview never writes to the store)
// ---------------------------------------------------------------------------

interface Subject {
  scheduledTime: string
  notes: string
  source?: string
  nhi: string
  dob?: string
  contact: string
  description: string
  route?: string
  contractLine: string
  rvg?: { code: string; description: string; baseUnits: number }
  intNotes: string
  opNotes: string
  start: string
  finish: string
  modifierUnits: number
}

const ROUTE_LABEL: Record<string, string> = {
  hospital: "Hospital or the Contract's Party",
  billableParty: 'Billable party',
  insurer: 'Insurer',
}

const hhmm = (iso: string | undefined) => (iso !== undefined && iso.length >= 16 ? iso.slice(11, 16) : '')

function useSubject(bookingId: string | null, procedureId: string | null): Subject | undefined {
  const booking = useAppStore((s: any) => (bookingId !== null ? s.schedule.bookings[bookingId] : undefined))
  const procedure = useAppStore((s: any) => (procedureId !== null ? s.schedule.procedures[procedureId] : undefined))
  const masters = useAppStore((s: any) => s.masters)
  const todayISO = useToday() as string
  return useMemo(() => {
    if (booking === undefined) return undefined
    const patient = masters.patients[booking.patientId]
    const group = procedure?.rvgGroupId !== undefined ? masters.rvgGroups[procedure.rvgGroupId] : undefined
    const contract = procedure?.governingContractId !== undefined ? masters.contracts[procedure.governingContractId] : undefined
    return {
      scheduledTime: booking.scheduledTime ?? '',
      notes: booking.notes ?? '',
      source: booking.source !== undefined ? (BOOKING_SOURCE_LABELS[booking.source] as string) : undefined,
      nhi: (nhiBadge(patient?.nhi) as { text: string }).text,
      dob: patient !== undefined ? `${formatDob(patient.dobISO)} · ${ageYears(patient.dobISO, todayISO)} years` : undefined,
      contact: patient?.phone ?? 'Not recorded',
      description: procedure?.description || 'Operation to capture',
      route: procedure?.billingRoute !== undefined ? ROUTE_LABEL[procedure.billingRoute] : 'Route not set',
      contractLine: [contract?.name, procedure?.billingReference].filter(Boolean).join(' · '),
      rvg: group !== undefined ? { code: group.code, description: group.description, baseUnits: procedure?.baseUnitsSelected ?? group.baseUnits } : undefined,
      intNotes: procedure?.intNotes ?? '',
      opNotes: procedure?.opNotes ?? '',
      start: hhmm(procedure?.anaestheticStartISO),
      finish: hhmm(procedure?.handoverISO),
      modifierUnits: group?.modifierUnits ?? 0,
    }
    // Live from the store; the form below takes its starting values once (RHF defaultValues).
  }, [booking, procedure, masters, todayISO])
}

// ---------------------------------------------------------------------------
// The form: React Hook Form + Zod
// ---------------------------------------------------------------------------

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
const toTime = (m: number) => {
  const c = Math.max(0, Math.min(23 * 60 + 55, m))
  return `${String(Math.floor(c / 60)).padStart(2, '0')}:${String(c % 60).padStart(2, '0')}`
}

/** The completion rules this Booking meets today (validateBookingForBilling's times rules, its own words). */
function schemaFor(hasRvg: boolean) {
  return z
    .object({
      scheduledTime: z.string(),
      notes: z.string(),
      start: z.string(),
      finish: z.string(),
      baseUnits: z.number().int().min(0),
      /** T as set by hand; null follows the stamps (the computed value). */
      timeUnits: z.number().int().min(0).nullable(),
      modifierUnits: z.number().int().min(0),
      intNotes: z.string(),
      opNotes: z.string(),
    })
    .superRefine((v, ctx) => {
      if (!hasRvg) return
      if (v.start === '') ctx.addIssue({ code: 'custom', path: ['start'], message: 'Record the anaesthetic start time.' })
      if (v.finish === '') ctx.addIssue({ code: 'custom', path: ['finish'], message: 'Record the handover time.' })
      if (v.start !== '' && v.finish !== '' && toMin(v.finish) <= toMin(v.start)) {
        ctx.addIssue({ code: 'custom', path: ['finish'], message: 'Handover must be after the anaesthetic start.' })
      }
    })
}
type Values = z.infer<ReturnType<typeof schemaFor>>

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Eyebrow({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="tw:m-0 tw:text-[11px] tw:leading-[14px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">
      {children}
    </h3>
  )
}

/** A capture card: shadcn Card with the micro-caps label as a real heading that names it. */
function Section({ label, action, children }: { label: string; action?: ReactNode; children: ReactNode }) {
  const id = useId()
  return (
    <Card role="group" aria-labelledby={id} className="tw:gap-2.5 tw:py-4 tw:shadow-none tw:[--card-spacing:--spacing(4)]">
      <CardHeader className="tw:items-center">
        <Eyebrow id={id}>{label}</Eyebrow>
        {action !== undefined && <CardAction className="tw:row-span-1 tw:self-center">{action}</CardAction>}
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:gap-2.5">{children}</CardContent>
    </Card>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="tw:flex tw:items-baseline tw:gap-2.5">
      <span className="tw:w-24 tw:flex-none tw:text-xs tw:text-mist">{label}</span>
      <span className="tw:flex-1 tw:text-sm tw:text-ink">{children}</span>
    </div>
  )
}

const STEP = 'tw:size-11 tw:rounded-[12px] tw:border-line tw:text-slate'

/** A B / T / M row on Base UI NumberField: label and why on the left, minus, the value, plus. */
function UnitsRow({ name, control, label, why, computed }: { name: 'baseUnits' | 'timeUnits' | 'modifierUnits'; control: Control<Values>; label: string; why: string; computed?: number }) {
  const id = useId()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <NumberField.Root value={field.value ?? computed ?? 0} onValueChange={(v) => field.onChange(v ?? 0)} min={0} max={99} className="tw:flex tw:items-center tw:gap-2.5">
          <div className="tw:flex tw:flex-1 tw:flex-col">
            <label htmlFor={id} className="tw:text-[15px] tw:leading-[22px] tw:font-semibold">
              {label}
            </label>
            <span className="tw:text-xs tw:leading-4 tw:text-mist">{why}</span>
          </div>
          <NumberField.Group className="tw:flex tw:items-center tw:gap-2">
            <NumberField.Decrement render={<Button variant="outline" size="icon" className={STEP} aria-label={`Fewer ${label}`} />}>
              <Minus aria-hidden />
            </NumberField.Decrement>
            <NumberField.Input id={id} ref={field.ref} className="tw:w-9 tw:border-0 tw:bg-transparent tw:text-center tw:font-mono tw:text-xl tw:font-bold tw:tabular-nums tw:outline-none tw:focus-visible:shadow-focus tw:rounded-[6px]" />
            <NumberField.Increment render={<Button variant="outline" size="icon" className={STEP} aria-label={`More ${label}`} />}>
              <Plus aria-hidden />
            </NumberField.Increment>
          </NumberField.Group>
        </NumberField.Root>
      )}
    />
  )
}

// ---------------------------------------------------------------------------
// The body
// ---------------------------------------------------------------------------

/**
 * The Booking capture on React Hook Form + Zod over shadcn Cards, seeded from the same picked
 * Booking. Mark complete runs the Zod rules; RHF focuses the first invalid control
 * (shouldFocusError) instead of the hand-written query-and-focus. `banner` keeps today's
 * summary box at the top as well as the field errors.
 */
export function BookingDetailBodyReplacement({ banner }: { banner: boolean }) {
  const { anaesthetistId } = useMobilePersona()
  const picks = useSeedPicks(anaesthetistId)
  const subject = useSubject(picks.bookingId, picks.procedureId)
  if (picks.bookingId === null || subject === undefined) return <Missing what="Booking" />
  return <BookingForm subject={subject} banner={banner} />
}

function BookingForm({ subject, banner }: { subject: Subject; banner: boolean }) {
  const timeRule = useAppStore((s: any) => s.masters.rvgTimeRule)
  const clockMin = useAppStore((s: any) => s.clock.minutesSinceMidnight) as number
  const [completed, setCompleted] = useState(false)
  const [line, setLine] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schemaFor(subject.rvg !== undefined)),
    defaultValues: {
      scheduledTime: subject.scheduledTime,
      notes: subject.notes,
      start: subject.start,
      finish: subject.finish,
      baseUnits: subject.rvg?.baseUnits ?? 0,
      timeUnits: null,
      modifierUnits: subject.modifierUnits,
      intNotes: subject.intNotes,
      opNotes: subject.opNotes,
    },
    shouldFocusError: true,
    reValidateMode: 'onChange',
  })
  const { errors, isSubmitted } = form.formState
  const [start, finish, scheduled] = form.watch(['start', 'finish', 'scheduledTime'])
  const minutes = start !== '' && finish !== '' ? Math.max(0, toMin(finish) - toMin(start)) : 0
  const timeUnits = minutes > 0 ? (timeUnitsFromMinutes(minutes, timeRule) as number) : 0
  const firstError = errors.start?.message ?? errors.finish?.message
  const stub = (what: string) => () => setLine(what)
  const set = (name: keyof Values, value: string) => form.setValue(name, value, { shouldValidate: isSubmitted, shouldDirty: true })

  const complete = form.handleSubmit(() => {
    setCompleted(true)
    setLine('Completed: the screen would pop back to the List.')
  })

  return (
    <div className="tw:absolute tw:inset-0 tw:flex tw:flex-col tw:bg-background">
      <form noValidate onSubmit={complete} className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col">
        <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-3 tw:overflow-y-auto tw:px-5 tw:pt-2 tw:pb-4 tw:*:shrink-0">
          <div className="tw:flex tw:justify-end">
            <Button type="button" variant="link" className="tw:min-h-11 tw:gap-1 tw:text-[13px]!" onClick={stub('Would open the Booking history.')}>
              <History aria-hidden className="tw:size-[15px]!" /> History
            </Button>
          </div>

          {banner && firstError !== undefined && (
            <Alert variant="destructive" className="tw:rounded-card tw:p-3">
              <AlertTitle className="tw:font-bold">{firstError}</AlertTitle>
              {errors.start !== undefined && errors.finish !== undefined && <AlertDescription>{errors.finish.message}</AlertDescription>}
            </Alert>
          )}

          <Section label="Patient" action={<Button type="button" variant="link" className="tw:text-sm!" onClick={stub('Would open Edit patient.')}>Edit</Button>}>
            <InfoRow label="NHI">
              <span className="tw:font-mono">{subject.nhi}</span>
            </InfoRow>
            {subject.dob !== undefined && <InfoRow label="Date of birth">{subject.dob}</InfoRow>}
            <InfoRow label="Contact">{subject.contact}</InfoRow>
            <div className="tw:flex tw:min-h-11 tw:items-center tw:gap-2.5">
              <span className="tw:w-24 tw:flex-none tw:text-xs tw:text-mist">Scheduled</span>
              <span className="tw:flex-1 tw:font-mono tw:text-sm">{scheduled === '' ? 'Not set' : scheduled}</span>
              <Button type="button" variant="outline" size="icon" className={STEP} aria-label="5 minutes earlier" onClick={() => set('scheduledTime', toTime(toMin(scheduled || '08:00') - 5))}>
                <Minus aria-hidden />
              </Button>
              <Button type="button" variant="outline" size="icon" className={STEP} aria-label="5 minutes later" onClick={() => set('scheduledTime', toTime(toMin(scheduled || '08:00') + 5))}>
                <Plus aria-hidden />
              </Button>
            </div>
          </Section>

          {subject.source !== undefined && (
            <div className="tw:flex tw:items-baseline tw:gap-1.5 tw:px-0.5 tw:text-[11px] tw:text-mist">
              <span className="tw:font-semibold tw:tracking-[0.06em] tw:uppercase">Source</span>
              <span aria-hidden>·</span>
              <span className="tw:text-xs tw:text-slate">{subject.source}</span>
            </div>
          )}

          <Section label="Attachments" action={<Button type="button" variant="link" className="tw:gap-1 tw:text-sm!" onClick={stub('Would open Add attachment.')}><Paperclip aria-hidden /> Add attachment</Button>}>
            <span className="tw:text-[13px] tw:text-mist">No attachments.</span>
          </Section>

          <Section label="Notes for the office">
            <Textarea aria-label="Notes for the office" placeholder="Anything the office should know…" {...form.register('notes')} />
          </Section>

          <div className="tw:flex tw:flex-col tw:gap-2">
            <div className="tw:flex tw:items-baseline tw:gap-2.5">
              <span className="tw:text-base tw:font-semibold">{subject.description}</span>
              <Button type="button" variant="link" className="tw:text-sm!" onClick={stub('Would open Edit procedure.')}>
                Edit
              </Button>
            </div>
            {subject.route !== undefined && <Badge className="tw:px-2.5 tw:py-1 tw:text-xs">{subject.route}</Badge>}
            {subject.contractLine !== '' && <span className="tw:text-xs tw:text-mist">{subject.contractLine}</span>}
          </div>

          {subject.rvg !== undefined && (
            <Section label="RVG code">
              <button
                type="button"
                onClick={stub('Would open the RVG code picker.')}
                className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-ctl tw:border tw:border-line tw:bg-background tw:p-3.5 tw:text-left tw:outline-none tw:focus-visible:shadow-focus"
              >
                <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5">
                  <span className="tw:font-mono tw:text-sm tw:font-semibold tw:text-teal-pressed">{subject.rvg.code}</span>
                  <span className="tw:text-[15px] tw:font-semibold">{subject.rvg.description}</span>
                  <span className="tw:text-xs tw:text-mist">Base {subject.rvg.baseUnits} units · from the RVG group</span>
                </span>
                <span aria-hidden className="tw:flex-none tw:text-sm tw:font-semibold tw:text-primary">
                  Change
                </span>
              </button>
              <div className="tw:flex tw:justify-end">
                <Button type="button" variant="link" className="tw:text-[13px]!" onClick={stub('Would clear the RVG code.')}>
                  Clear
                </Button>
              </div>
            </Section>
          )}

          <Section label="Times">
            <div className="tw:grid tw:grid-cols-2 tw:gap-2.5">
              <TimeCell
                name="start"
                control={form.control}
                label="Start"
                now="Start now"
                invalid={errors.start !== undefined}
                onStamp={() => set('start', toTime(clockMin))}
                onNudge={(d) => set('start', toTime(Math.min(toMin(start) + d, finish !== '' ? toMin(finish) - 5 : 24 * 60)))}
              />
              {start !== '' && (
                <TimeCell
                  name="finish"
                  control={form.control}
                  label="Finish"
                  now="Finish now"
                  invalid={errors.finish !== undefined}
                  onStamp={() => set('finish', toTime(Math.max(clockMin, toMin(start) + 5)))}
                  onNudge={(d) => set('finish', toTime(Math.max(toMin(finish) + d, toMin(start) + 5)))}
                />
              )}
            </div>
            <FieldError id="m-cards-bdb-start-error" errors={[errors.start]} />
            <FieldError id="m-cards-bdb-finish-error" errors={[errors.finish]} />
          </Section>

          <Section label="Units">
            <UnitsRow name="baseUnits" control={form.control} label="B · Base" why="From the RVG group" />
            <UnitsRow name="timeUnits" control={form.control} label="T · Time" why="From start and finish stamps · RVG time tiers" computed={timeUnits} />
            <UnitsRow name="modifierUnits" control={form.control} label="M · Modifiers" why="None applied" />
          </Section>

          <Section label="Notes">
            <Field>
              <FieldLabel htmlFor="m-cards-bdb-int">Int notes</FieldLabel>
              <Textarea id="m-cards-bdb-int" placeholder="Internal notes for AA" {...form.register('intNotes')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="m-cards-bdb-op">Op notes</FieldLabel>
              <Textarea id="m-cards-bdb-op" placeholder="Operation notes" {...form.register('opNotes')} />
            </Field>
          </Section>

          <Button type="button" variant="outline" size="lg" className="tw:w-full" onClick={stub('Would open Alert the office.')}>
            <BellRing aria-hidden /> Alert the office
          </Button>
          <Button type="button" variant="outline" size="lg" className="tw:w-full" onClick={stub('Would open Move to a colleague.')}>
            <Users aria-hidden /> Move to a colleague
          </Button>
          <Button type="button" variant="destructive" size="lg" className="tw:w-full" onClick={stub('Would open Cancel booking.')}>
            <XCircle aria-hidden /> Cancel booking
          </Button>
        </div>

        <div className="tw:flex-none tw:border-t tw:border-line tw:bg-background tw:px-5 tw:py-3.5">
          {completed ? (
            <div role="status" className="tw:flex tw:h-14 tw:items-center tw:justify-center tw:gap-2 tw:rounded-card tw:bg-success-tint tw:text-[17px] tw:font-bold tw:text-success-on-tint">
              Booking complete
              <Button
                type="button"
                variant="link"
                className="tw:ml-1.5 tw:text-sm! tw:underline"
                onClick={() => {
                  setCompleted(false)
                  setLine(null)
                }}
              >
                Amend
              </Button>
            </div>
          ) : (
            <Button type="submit" size="cta" className="tw:w-full tw:shadow-e2">
              Mark complete
            </Button>
          )}
          <Said line={line} />
        </div>
      </form>
    </div>
  )
}

/**
 * One time cell. Before it is stamped: the teal "Start now" / "Finish now" block (it carries the
 * RHF ref, so a failed complete focuses it). After: the big mono time with -5 / +5.
 */
function TimeCell({
  name,
  control,
  label,
  now,
  invalid,
  onStamp,
  onNudge,
}: {
  name: 'start' | 'finish'
  control: Control<Values>
  label: string
  now: string
  invalid: boolean
  onStamp: () => void
  onNudge: (delta: number) => void
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) =>
        field.value === '' ? (
          <Button
            ref={field.ref}
            type="button"
            onClick={onStamp}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? `m-cards-bdb-${name}-error` : undefined}
            className="tw:h-24 tw:rounded-ctl tw:text-base tw:font-bold tw:aria-invalid:shadow-[0_0_0_2px_var(--error)]"
          >
            {now}
          </Button>
        ) : (
          <div className="tw:flex tw:flex-col tw:items-center tw:gap-1.5 tw:rounded-ctl tw:bg-background tw:p-2.5">
            <span className="tw:text-[11px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">{label}</span>
            <span ref={field.ref} tabIndex={-1} className="tw:font-mono tw:text-[26px] tw:leading-8 tw:font-bold tw:tabular-nums tw:outline-none">
              {field.value}
            </span>
            <div className="tw:flex tw:gap-1.5">
              <Button type="button" variant="outline" size="sm" className="tw:font-mono" aria-label={`${label} 5 minutes earlier`} onClick={() => onNudge(-5)}>
                −5
              </Button>
              <Button type="button" variant="outline" size="sm" className="tw:font-mono" aria-label={`${label} 5 minutes later`} onClick={() => onNudge(5)}>
                +5
              </Button>
            </div>
          </div>
        )
      }
    />
  )
}
