import { useState, type ReactNode } from 'react'
import { Camera, FileText, Paperclip } from 'lucide-react'
import { SAMPLE_FILES, SAMPLE_PHOTOS } from './sampleAttachments'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DemoBadge, Echo, Missing, useReturnFocus, type WebFixtures } from './shared'

interface SampleAttachment {
  key: string
  name: string
  kind: string
  dataUrl: string
  detail: string
}

/**
 * Add attachment as a shadcn Button (link variant, paperclip) and the simulated
 * picker as a shadcn Dialog: the same title, demo badge, line, the two sample
 * groups and Close. Picking a sample attaches it locally (never to the store)
 * and closes the dialog, as today.
 */
export function AddAttachmentReplacement() {
  const f = useWebFixtures() as WebFixtures
  const [open, setOpen] = useState(false)
  const [attached, setAttached] = useState<string[]>([])
  const { finalFocus, remember } = useReturnFocus()
  if (f.detailListId === undefined) return <Missing what="active List" />

  function pick(sample: SampleAttachment) {
    setAttached((prev) => [...prev, sample.name])
    setOpen(false)
  }

  return (
    <>
      <Button variant="link" className="tw:min-h-8 tw:gap-1 tw:text-sm!" onClick={(e) => {
          remember(e)
          setOpen(true)
        }}
      >
        <Paperclip className="tw:size-[15px]!" aria-hidden /> Add attachment
      </Button>
      <Echo>{attached.length > 0 ? `Attached locally: ${attached.join(', ')} (nothing saved to the store)` : null}</Echo>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} finalFocus={finalFocus} data-shot="add-attachment-sheet-replacement">
          <DialogHeader className="tw:gap-1.5">
            <DialogTitle className="tw:pr-0">Attach to this List</DialogTitle>
            <span className="tw:self-start">
              <DemoBadge label="Simulated file picker" />
            </span>
            <DialogDescription>Pick a sample to attach. In the real app this opens the camera or the device's files.</DialogDescription>
          </DialogHeader>
          <SampleGroup title="Take a photo" icon={<Camera className="tw:size-[15px]" aria-hidden />} samples={SAMPLE_PHOTOS} onPick={pick} />
          <SampleGroup title="Choose a file" icon={<FileText className="tw:size-[15px]" aria-hidden />} samples={SAMPLE_FILES} onPick={pick} />
          <DialogClose render={<Button variant="outline" size="lg" className="tw:w-full" />}>Close</DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SampleGroup({ title, icon, samples, onPick }: { title: string; icon: ReactNode; samples: readonly SampleAttachment[]; onPick: (s: SampleAttachment) => void }) {
  return (
    <div role="group" aria-label={title} className="tw:flex tw:flex-col tw:gap-1.5">
      <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[13px] tw:font-semibold tw:text-ink">
        <span className="tw:inline-flex tw:text-slate">{icon}</span>
        {title}
      </div>
      {samples.map((sample) => (
        <Button
          key={sample.key}
          variant="outline"
          onClick={() => onPick(sample)}
          aria-label={`Attach ${sample.name}`}
          className="tw:h-auto tw:min-h-[60px] tw:justify-start tw:gap-3 tw:px-3 tw:py-2 tw:text-left tw:whitespace-normal"
        >
          <img src={sample.dataUrl} alt="" className="tw:h-11 tw:w-[34px] tw:flex-none tw:rounded-[4px] tw:border tw:border-line tw:object-cover" />
          <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5">
            <span className="tw:text-[15px] tw:font-semibold tw:text-ink">{sample.name}</span>
            <span className="tw:text-xs tw:font-normal tw:text-slate">{sample.detail}</span>
          </span>
          <span aria-hidden className="tw:flex-none tw:text-sm tw:font-semibold tw:text-primary">
            Attach
          </span>
        </Button>
      ))}
    </div>
  )
}
