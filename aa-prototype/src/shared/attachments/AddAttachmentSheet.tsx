import { useEffect, useState } from 'react'
import { Camera, FileText } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import { SAMPLE_FILES, SAMPLE_PHOTOS, type SampleAttachment } from '../../assets/sampleAttachments'
import { addAttachment, useAppStore, type Actor, type AttachmentTarget } from '../../store'
import { DemoBadge } from '../DemoBadge'
import { Button } from '../ui'
import { useSurface } from '../surface'

interface AddAttachmentSheetProps {
  open: boolean
  target: AttachmentTarget
  actor: Actor
  onClose: () => void
}

/**
 * Attach a file or photo to a Booking or a whole List (US-03.1.3). The picker
 * is SIMULATED and badged as such: there is no real camera or file input, only
 * the bundled samples, because a real file would persist as a data URL into
 * localStorage. A bottom sheet on mobile and a dialog on web, through the
 * surface seam. Picking a sample attaches it at once and closes the sheet; the
 * write goes through `addAttachment`, which allocates the id and audits it.
 */
export function AddAttachmentSheet({ open, target, actor, onClose }: AddAttachmentSheetProps) {
  const { Overlay } = useSurface()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  function pick(sample: SampleAttachment) {
    const outcome = addAttachment(useAppStore, actor, target, { name: sample.name, kind: sample.kind, dataUrl: sample.dataUrl })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="add-attachment-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {target.kind === 'list' ? 'Attach to this List' : 'Attach to this Booking'}
          </div>
          <DemoBadge label="Simulated file picker" style={{ alignSelf: 'flex-start' }} />
          <div style={{ fontSize: 13, color: neutral.slate }}>
            Pick a sample to attach. In the real app this opens the camera or the device's files.
          </div>
        </div>
        <SampleGroup title="Take a photo" icon={<Camera size={15} aria-hidden />} samples={SAMPLE_PHOTOS} onPick={pick} />
        <SampleGroup title="Choose a file" icon={<FileText size={15} aria-hidden />} samples={SAMPLE_FILES} onPick={pick} />
        {error !== null && (
          <div role="alert" style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
            {error}
          </div>
        )}
        <Button variant="secondary" block onClick={onClose}>
          Close
        </Button>
      </div>
    </Overlay>
  )
}

function SampleGroup({ title, icon, samples, onPick }: { title: string; icon: React.ReactNode; samples: readonly SampleAttachment[]; onPick: (sample: SampleAttachment) => void }) {
  return (
    <div role="group" aria-label={title} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: neutral.ink }}>
        <span style={{ color: neutral.slate, display: 'inline-flex' }}>{icon}</span>
        {title}
      </div>
      {samples.map((sample) => (
        <button
          key={sample.key}
          type="button"
          onClick={() => onPick(sample)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 12px', borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.surface, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
        >
          <img src={sample.dataUrl} alt="" style={{ width: 34, height: 44, objectFit: 'cover', borderRadius: 4, border: `1px solid ${neutral.line}`, flexShrink: 0 }} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{sample.name}</span>
            <span style={{ fontSize: 12, color: neutral.slate }}>{sample.detail}</span>
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: accent.base, flexShrink: 0 }}>Attach</span>
        </button>
      ))}
    </div>
  )
}
