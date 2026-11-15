import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Echo } from './Echo'

/**
 * The web Overlay as a shadcn Dialog (Base UI): same title, copy, field and
 * Cancel / Save pair. Base UI adds the focus trap, initial focus on the field,
 * focus returned to the trigger, scroll lock and aria-labelledby/describedby.
 * `closeX` adds the kit's corner close button; the prototype has none.
 */
export function DialogReplacement({ closeX = false }: { closeX?: boolean }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const inputId = useId()
  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" size="lg" />}>Open dialog</DialogTrigger>
        <DialogContent showCloseButton={closeX}>
          <DialogHeader className="tw:gap-3.5">
            <DialogTitle className={closeX ? undefined : 'tw:pr-0'}>Add a note</DialogTitle>
            <DialogDescription>The shared web Overlay: a centred dialog. Escape or the scrim closes it.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor={inputId}>
              Note
            </FieldLabel>
            <Input id={inputId} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Ring theatre at 7" />
          </Field>
          <DialogFooter className="tw:mt-0">
            <DialogClose render={<Button variant="outline" size="lg" className="tw:h-[54px]" />}>Cancel</DialogClose>
            <Button
              size="cta"
              onClick={() => {
                setSaved(note === '' ? '(empty)' : note)
                setOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Echo>{saved === null ? 'Local only: nothing is saved to the store.' : `Saved locally: ${saved}`}</Echo>
    </div>
  )
}
