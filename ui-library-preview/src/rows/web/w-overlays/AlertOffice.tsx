import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { BellRing, CheckCircle2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { activeAlertFor, clockISO, latestAlertFor, officeAlertRefusal, OFFICE_ALERT_NOTE_MAX, useAppStore } from '@proto/store'
import { sessionText } from '@proto/domain/outOfHours'
import { TickBadge } from '@proto/shared/ui'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { KnobButton, Missing, useReturnFocus, type WebFixtures } from './shared'

const MAX = OFFICE_ALERT_NOTE_MAX as number
const whenLabel = (iso: string) => format(parseISO(iso), 'EEE d MMM, HH:mm')

const schema = z.object({
  note: z
    .string()
    .trim()
    .min(1, 'Write a note for the office.')
    .max(MAX, `Keep the note to ${MAX} characters.`),
})
type Values = z.infer<typeof schema>

interface AlertRecord {
  message?: string
  atISO: string
  resolvedAt?: string
}

/**
 * "Alert the office" for a List: the entry (a button while nothing is open,
 * then the open alert's status as a shadcn Alert) and the note dialog (shadcn
 * Dialog + Field + Textarea under React Hook Form and Zod: required, trimmed,
 * at most 300 characters, with the live count). Sending is local: the alert
 * shows as open in this row only, never in the office's notifications.
 */
export function AlertOfficeReplacement() {
  const f = useWebFixtures() as WebFixtures
  if (f.detailListId === undefined) return <Missing what="active List" />
  return <AlertOfficeEntry f={f} listId={f.detailListId} />
}

function AlertOfficeEntry({ f, listId }: { f: WebFixtures; listId: string }) {
  const target = { listId }
  const storeActive = useAppStore((s: unknown) => activeAlertFor(s, target)) as AlertRecord | undefined
  const latest = useAppStore((s: unknown) => latestAlertFor(s, target)) as AlertRecord | undefined
  const refusal = useAppStore((s: unknown) => (officeAlertRefusal(s, f.actor, target) as { code: string } | undefined)?.code ?? null)
  const [localActive, setLocalActive] = useState<AlertRecord | null>(null)
  const [open, setOpen] = useState(false)
  const { finalFocus, remember } = useReturnFocus()
  const active = localActive ?? storeActive
  const canAlert = refusal === null && localActive === null
  const isOwner = refusal === null || refusal === 'alreadyAlerted' || (refusal === 'listAuthorised' && latest !== undefined)
  if (!isOwner) return null

  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      {active !== undefined ? (
        <Alert role="status" className="tw:rounded-card tw:bg-background tw:px-3.5 tw:py-3">
          <BellRing aria-hidden className="tw:text-slate!" />
          <AlertTitle className="tw:text-[13.5px]">The office has been alerted</AlertTitle>
          <AlertDescription className="tw:flex tw:flex-col tw:gap-0.5">
            {active.message !== undefined && <span className="tw:text-[13px] tw:leading-[18px]">"{active.message}"</span>}
            <span className="tw:text-[11.5px] tw:text-mist">{whenLabel(active.atISO)} · It stays with the office until someone there deals with it.</span>
          </AlertDescription>
        </Alert>
      ) : (
        latest?.resolvedAt !== undefined && (
          <Alert variant="success" role="status" className="tw:rounded-card tw:px-3.5 tw:py-3">
            <CheckCircle2 aria-hidden />
            <AlertTitle className="tw:text-[13.5px]">The office has dealt with this</AlertTitle>
            <AlertDescription className="tw:flex tw:flex-col tw:gap-0.5">
              {latest.message !== undefined && <span className="tw:text-[13px]">Your note: "{latest.message}"</span>}
              <span className="tw:text-[11.5px]">{whenLabel(latest.resolvedAt)}</span>
            </AlertDescription>
          </Alert>
        )
      )}
      {canAlert && (
        <div>
          <Button variant="outline" size="lg" className="tw:w-full"
            onClick={(e) => {
              remember(e)
              setOpen(true)
            }}
          >
            <BellRing aria-hidden /> Alert the office
          </Button>
        </div>
      )}
      {localActive !== null && (
        <div>
          <KnobButton onClick={() => setLocalActive(null)}>Reset the local alert</KnobButton>
        </div>
      )}
      <AlertOfficeDialog
        open={open}
        onOpenChange={setOpen}
        listId={listId}
        finalFocus={finalFocus}
        onSent={(note) => setLocalActive({ message: note, atISO: clockISO(useAppStore.getState().clock) as string })}
      />
    </div>
  )
}

function AlertOfficeDialog({
  open,
  onOpenChange,
  listId,
  finalFocus,
  onSent,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  listId: string
  finalFocus: { current: HTMLElement | null }
  onSent: (note: string) => void
}) {
  const list = useAppStore((s: { schedule: { lists: Record<string, { dateISO: string; session: string; hospitalId: string }> } }) => s.schedule.lists[listId])
  const hospital = useAppStore((s: { masters: { hospitals: Record<string, { name: string }> } }) => (list !== undefined ? s.masters.hospitals[list.hospitalId]?.name : undefined))
  const [sent, setSent] = useState(false)
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { note: '' }, mode: 'onChange' })
  const note = useWatch({ control: form.control, name: 'note' }) ?? ''
  const count = note.trim().length
  const error = form.formState.errors.note

  if (list === undefined) return null
  const line = [`${format(parseISO(list.dateISO), 'EEE d MMM')} ${sessionText(list.session)}`, hospital].filter((x): x is string => x !== undefined).join(' · ')

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) {
          setSent(false)
          form.reset({ note: '' })
        }
      }}
    >
      <DialogContent showCloseButton={false} finalFocus={finalFocus} className="tw:w-[min(488px,calc(100%-48px))]">
        {!sent ? (
          <form
            noValidate
            className="tw:flex tw:flex-col tw:gap-3.5"
            onSubmit={form.handleSubmit((v) => {
              onSent(v.note)
              setSent(true)
            })}
          >
            <DialogHeader className="tw:gap-0.5">
              <DialogTitle className="tw:pr-0">Alert the office</DialogTitle>
              <DialogDescription>List · {line}</DialogDescription>
            </DialogHeader>
            <p className="tw:m-0 tw:text-[13px] tw:leading-[19px] tw:text-slate">
              The office sees your note in its notifications and checks this List. It stays there until someone in the office deals with it.
            </p>
            <Field data-invalid={error !== undefined && count > 0 ? true : undefined}>
              <FieldLabel htmlFor="alert-office-note">Note for the office</FieldLabel>
              <Textarea
                id="alert-office-note"
                autoFocus
                placeholder="What would you like checked?"
                aria-invalid={count > MAX || undefined}
                aria-describedby="alert-office-count"
                {...form.register('note')}
              />
              <FieldDescription id="alert-office-count" className={cn('tw:self-end tw:font-mono tw:text-[11.5px] tw:tabular-nums', count > MAX && 'tw:text-error-on-tint')}>
                {count}/{MAX}
              </FieldDescription>
              {count > MAX && <FieldError errors={[error]} />}
            </Field>
            <Button type="submit" size="cta" className="tw:w-full" disabled={count === 0 || count > MAX}>
              Send to the office
            </Button>
          </form>
        ) : (
          <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:pt-3 tw:pb-2">
            <TickBadge size={72} animate />
            <DialogTitle className="tw:pr-0 tw:text-success-on-tint">The office has been alerted</DialogTitle>
            <DialogDescription className="tw:text-center tw:leading-[19px]">It shows in the office's notifications with your note.</DialogDescription>
            <DialogClose render={<Button variant="outline" size="lg" className="tw:mt-1 tw:w-full" />}>Done</DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
