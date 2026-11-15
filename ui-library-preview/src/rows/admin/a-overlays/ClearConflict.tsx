import { useId, useRef, useState } from 'react'
import { describeConflict } from '@proto/domain/conflicts'
import { useAppStore, useConflictLookups } from '@proto/store'
import { useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Echo, Missing } from './parts'

interface Conflict {
  cause: string
}
interface ListLike {
  hospitalId?: string
  conflicts: Conflict[]
}

/**
 * ClearConflictSheet as a shadcn AlertDialog: the same title, reason, detail,
 * reassurance, optional note and Cancel / Clear. Clearing is local here (the
 * prototype writes `clearListConflict` to the demo store).
 */
export function ClearConflictReplacement({ footer = 'block' }: { footer?: 'block' | 'end' }) {
  const { conflictedListId } = useSeedIds() as { conflictedListId?: string }
  const list = useAppStore((s: { schedule: { lists: Record<string, ListLike> } }) => (conflictedListId !== undefined ? s.schedule.lists[conflictedListId] : undefined))
  const lookups = useConflictLookups()
  const conflict = list?.conflicts[0]
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [cleared, setCleared] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const noteId = useId()
  if (conflictedListId === undefined || list === undefined || conflict === undefined) return <Missing what="conflicted Lists" />
  const described = describeConflict(conflict, list, lookups) as { reason: string; detail: string }
  return (
    <div>
      <Button
        variant="outline"
        size="lg"
        onClick={() => {
          setNote('')
          setOpen(true)
        }}
      >
        Clear conflict
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent initialFocus={cancelRef} className="tw:max-w-[min(520px,calc(100%-48px))]!">
          <AlertDialogHeader className="tw:place-items-start tw:gap-3.5 tw:text-left">
            <AlertDialogTitle>Clear this conflict</AlertDialogTitle>
            <AlertDialogDescription render={<div />} className="tw:flex tw:flex-col tw:gap-3.5 tw:leading-[19px]">
              <span>
                <strong className="tw:text-ink">{described.reason}.</strong> {described.detail}
              </span>
              <span>The List and its Bookings stay as they are. The flag stays cleared while this cause stands; if the clash goes and comes back, it flags again.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Field>
            <FieldLabel htmlFor={noteId}>Note (optional)</FieldLabel>
            <Textarea id={noteId} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Theatre confirmed running" />
          </Field>
          <AlertDialogFooter className={cn('tw:mt-0', footer === 'block' && 'tw:flex-row tw:*:flex-1')}>
            <AlertDialogCancel ref={cancelRef} size="lg">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              size="lg"
              onClick={() => {
                setCleared(note.trim() === '' ? 'Cleared locally, no note.' : `Cleared locally, note: ${note.trim()}`)
                setOpen(false)
              }}
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Echo>{cleared ?? `List ${conflictedListId}`}</Echo>
    </div>
  )
}
