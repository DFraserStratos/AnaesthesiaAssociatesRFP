import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useAppStore } from '@proto/store'
import { useMovableLists } from '@proto/shared/flows'
import { locationName } from '@proto/shared/format'
import { sessionText } from '@proto/domain/outOfHours'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Echo, Hint, useReturnFocus, type WebFixtures } from './shared'

interface MovableList {
  id: string
  dateISO: string
  session: string
  hospitalId: string
  surgeonId: string
}

/**
 * The web Overlay with the dashboard's Which List? picker, on shadcn Dialog
 * (Base UI). Same title, line and list of her movable Lists in the next six
 * days (read from the store); a row "would open" the move sheet. Base UI adds
 * the focus trap, initial focus on the first row, focus restore and scroll lock.
 */
export function WhichListDialog({ closeX = false }: { closeX?: boolean }) {
  const f = useWebFixtures() as WebFixtures
  const movable = useMovableLists(f.anaesthetistId, 6) as MovableList[]
  const hospitals = useAppStore((s: { masters: { hospitals: unknown } }) => s.masters.hospitals)
  const surgeons = useAppStore((s: { masters: { surgeons: Record<string, { name: string }> } }) => s.masters.surgeons)
  const [open, setOpen] = useState(false)
  const { finalFocus, remember } = useReturnFocus()
  const [said, setSaid] = useState<string | null>(null)
  const when = (l: MovableList) => `${format(parseISO(l.dateISO), 'EEE d MMM')} ${sessionText(l.session)}`

  return (
    <>
      <Button
        variant="outline"
        onClick={(e) => {
          remember(e)
          setOpen(true)
        }}
      >
        Open the Which List? dialog
      </Button>
      <Echo>{said}</Echo>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={closeX} finalFocus={finalFocus} className="tw:w-[min(520px,calc(100%-48px))] tw:gap-3">
          <DialogHeader className="tw:gap-0.5">
            <DialogTitle className={closeX ? undefined : 'tw:pr-0'}>Which List?</DialogTitle>
            <DialogDescription>Your Lists in the next six days. Choose one to move it back to the office or to a colleague.</DialogDescription>
          </DialogHeader>
          <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:overflow-hidden tw:rounded-card tw:border tw:border-line tw:p-0">
            {movable.length === 0 && <li className="tw:px-3.5 tw:py-3 tw:text-[13px] tw:text-mist">No upcoming Lists to move.</li>}
            {movable.map((l, i) => (
              <li key={l.id} className="tw:flex">
                <button
                  type="button"
                  autoFocus={i === 0}
                  onClick={() => {
                    setOpen(false)
                    setSaid(`Would open the move sheet for ${when(l)}.`)
                  }}
                  className={cn(
                    'tw:flex tw:flex-1 tw:cursor-pointer tw:items-center tw:gap-3 tw:border-0 tw:bg-surface tw:px-3.5 tw:py-3 tw:text-left tw:outline-none tw:hover:bg-sunken tw:focus-visible:bg-sunken tw:focus-visible:shadow-[inset_0_0_0_2px_var(--teal)]',
                    i > 0 && 'tw:border-t tw:border-sunken',
                  )}
                >
                  <span className="tw:w-[92px] tw:flex-none tw:font-mono tw:text-xs tw:font-semibold tw:text-slate tw:tabular-nums">{when(l)}</span>
                  <span className="tw:min-w-0 tw:flex-1 tw:text-sm tw:font-semibold tw:text-ink">{locationName(l.hospitalId, hospitals)}</span>
                  <span className="tw:text-[13px] tw:text-slate">{surgeons[l.surgeonId]?.name ?? ''}</span>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
      <Hint>Escape or a scrim click closes it; focus stays inside and returns to the button.</Hint>
    </>
  )
}
