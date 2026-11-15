import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'

/**
 * The mobile bottom sheet on shadcn Drawer (Base UI Drawer), portalled into the phone stage. Same
 * trigger, title, line and Close as the prototype example. The scrim, the handle, the slide-up and
 * the 90% height cap come from the branded Drawer; drag to dismiss, Escape and the focus trap are
 * Base UI's behaviour, so the example's line says so instead of "no drag, no Escape".
 */
export function BottomSheetReplacement({ tapHandleCloses = false }: { tapHandleCloses?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="cta" onClick={() => setOpen(true)}>
        Open a bottom sheet
      </Button>
      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle={!tapHandleCloses}>
        <DrawerContent
          // The prototype sheet rides above the software keyboard (--aa-keyboard-inset); keep that line.
          style={{ bottom: 'var(--aa-keyboard-inset, 0px)', maxHeight: 'calc(90% - var(--aa-keyboard-inset, 0px))' }}
        >
          {tapHandleCloses && (
            // Today's handle: a button that closes the sheet, drawn where the Drawer's drag handle sits.
            <DrawerClose
              aria-label="Close sheet"
              className="tw:mx-auto tw:flex tw:h-[30px] tw:w-16 tw:shrink-0 tw:cursor-pointer tw:justify-center tw:border-0 tw:bg-transparent tw:px-3.5 tw:pt-3 tw:outline-none tw:focus-visible:shadow-focus tw:rounded-ctl"
            >
              <span aria-hidden className="tw:block tw:h-1 tw:w-9 tw:rounded-full tw:bg-line-strong" />
            </DrawerClose>
          )}
          <div className="tw:flex tw:flex-col tw:gap-2.5 tw:overflow-auto tw:px-5 tw:pb-[max(calc(var(--aa-inset-bottom,34px)+2px),20px)]">
            <DrawerTitle className="tw:text-[17px]">A bottom sheet</DrawerTitle>
            <DrawerDescription className="tw:text-sm tw:text-slate">
              {tapHandleCloses ? 'Drag it down, tap the scrim, the handle or Close.' : 'Drag it down, tap the scrim or Close.'} Escape closes it too, and focus stays inside while it is open.
            </DrawerDescription>
            <DrawerClose render={<Button variant="outline" size="lg" className="tw:w-full" />}>Close</DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
      <div className="tw:mt-2 tw:text-xs tw:leading-[normal] tw:text-mist">{tapHandleCloses ? 'Drag it down, tap the scrim or the handle, or press Escape to dismiss.' : 'Drag it down, tap the scrim or press Escape to dismiss.'}</div>
    </>
  )
}
