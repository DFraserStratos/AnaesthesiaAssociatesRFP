import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { BellRing, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { OFFICE_ALERT_NOTE_MAX, officeAlertRefusal, useAppStore } from '@proto/store'
import { sessionText } from '@proto/domain/outOfHours'
import { Missing, useMobilePersona, useSeedPicks, type Actor } from './shared'
import { PRESS } from './Controls'

const MAX = OFFICE_ALERT_NOTE_MAX as number

/** The store's own note rule (alertOffice): 1 to 300 characters once trimmed, same wording. */
const schema = z.object({
  note: z
    .string()
    .trim()
    .min(1, 'Add a note for the office.')
    .max(MAX, `Keep the note to ${MAX} characters.`),
})
type FormIn = z.input<typeof schema>
type FormOut = z.output<typeof schema>

interface ListLite {
  dateISO: string
  session: string
  hospitalId: string
}

/**
 * The note form on React Hook Form + Zod inside shadcn Drawer. Send never writes to the store:
 * it checks the store's own refusal rule (read only) and then shows the sent state locally.
 */
function AlertForm({ actor, listId, submitGate, onSent }: { actor: Actor; listId: string; submitGate: 'disabled' | 'errors'; onSent: () => void }) {
  const list = useAppStore((s: any) => s.schedule.lists[listId]) as ListLite | undefined
  const hospital = useAppStore((s: any) => (list !== undefined ? s.masters.hospitals[list.hospitalId]?.name : undefined)) as string | undefined
  const [refusal, setRefusal] = useState<string | null>(null)
  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(schema),
    defaultValues: { note: '' },
    mode: submitGate === 'errors' ? 'onSubmit' : 'onChange',
    reValidateMode: 'onChange',
  })
  const note = useWatch({ control: form.control, name: 'note' }) ?? ''
  const trimmed = note.trim().length
  const error = form.formState.errors.note

  if (list === undefined) return null
  const line = [`${format(parseISO(list.dateISO), 'EEE d MMM')} ${sessionText(list.session)}`, hospital].filter((x): x is string => x !== undefined).join(' · ')

  const onSubmit = form.handleSubmit(() => {
    const out = officeAlertRefusal(useAppStore.getState(), actor, { listId }) as { message: string } | null
    if (out !== null) {
      setRefusal(out.message)
      return
    }
    onSent()
  })

  return (
    <form onSubmit={onSubmit} noValidate className="tw:flex tw:flex-col tw:gap-3.5">
      <div className="tw:flex tw:flex-col tw:gap-0.5">
        <DrawerTitle>Alert the office</DrawerTitle>
        <DrawerDescription>List · {line}</DrawerDescription>
      </div>
      <p className="tw:m-0 tw:text-[13px] tw:leading-[19px] tw:text-slate">
        The office sees your note in its notifications and checks this List. It stays there until someone in the office deals with it.
      </p>
      <Field data-invalid={error !== undefined || undefined}>
        <FieldLabel htmlFor="m-sheets-alert-note">Note for the office</FieldLabel>
        <Textarea
          id="m-sheets-alert-note"
          placeholder="What would you like checked?"
          aria-invalid={error !== undefined || undefined}
          aria-describedby="m-sheets-alert-count"
          {...form.register('note', { onChange: () => setRefusal(null) })}
        />
        <div className="tw:flex tw:items-start tw:gap-2">
          <FieldError className="tw:flex-1" errors={submitGate === 'errors' ? [error] : []} />
          <span
            id="m-sheets-alert-count"
            className={cn('tw:ml-auto tw:font-mono tw:text-[11.5px] tw:tabular-nums', trimmed > MAX ? 'tw:text-error-on-tint' : 'tw:text-mist')}
          >
            {trimmed}/{MAX}
          </span>
        </div>
      </Field>
      {refusal !== null && <Alert variant="destructive">{refusal}</Alert>}
      <Button
        type="submit"
        size="cta"
        className={cn('tw:w-full tw:disabled:bg-line tw:disabled:text-mist', PRESS)}
        disabled={submitGate === 'disabled' && (trimmed === 0 || trimmed > MAX)}
      >
        Send to the office
      </Button>
    </form>
  )
}

export function AlertOfficeSheetReplacement({ submitGate }: { submitGate: 'disabled' | 'errors' }) {
  const { actor, anaesthetistId } = useMobilePersona()
  const picks = useSeedPicks(anaesthetistId)
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  if (picks.listId === null) return <Missing what="List" />
  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className={PRESS}
        onClick={() => {
          setSent(false)
          setOpen(true)
        }}
      >
        <BellRing className="tw:size-4" aria-hidden /> Alert the office
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent style={{ bottom: 'var(--aa-keyboard-inset, 0px)', maxHeight: 'calc(90% - var(--aa-keyboard-inset, 0px))' }}>
          <div className="tw:overflow-auto tw:px-5 tw:pb-[max(calc(var(--aa-inset-bottom,34px)+2px),20px)]">
            {!sent ? (
              <AlertForm key={String(open)} actor={actor} listId={picks.listId} submitGate={submitGate} onSent={() => setSent(true)} />
            ) : (
              <div role="status" className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:pt-3 tw:pb-2">
                <span aria-hidden className="tw:grid tw:size-[72px] tw:place-items-center tw:rounded-full tw:bg-success-tint tw:text-success-on-tint">
                  <Check className="tw:size-9" strokeWidth={2.6} />
                </span>
                <DrawerTitle className="tw:text-success-on-tint">The office has been alerted</DrawerTitle>
                <DrawerDescription className="tw:text-center tw:leading-[19px]">It shows in the office's notifications with your note.</DrawerDescription>
                <DrawerClose render={<Button variant="outline" size="lg" className={cn('tw:mt-1 tw:w-full', PRESS)} />}>Done</DrawerClose>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
      <div className="tw:mt-2 tw:text-xs tw:text-mist">Send here checks the note and the store's rules, then shows the sent state; nothing is written.</div>
    </>
  )
}
