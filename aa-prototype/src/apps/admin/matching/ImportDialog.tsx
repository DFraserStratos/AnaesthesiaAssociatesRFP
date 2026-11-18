/**
 * "Import hospital file" (catch-up Phase 33; US-02.1.1; D52: files are
 * imported, there is no sync). How each hospital provides its bookings is
 * still open (OQ-13), so the dialog offers the four labelled sample files,
 * badged "Sample file", one shared `RadioCard` each. A desktop dialog through the
 * surface's `Overlay`, titled by `OverlayHeader`, its footer `SheetActions`.
 */

import { useEffect, useState } from 'react'
import { neutral } from '../../../theme/tokens'
import { HOSPITAL_DOWNLOAD_SAMPLES } from '../../../domain/intake'
import { useAppStore } from '../../../store'
import { DemoBadge } from '../../../shared/DemoBadge'
import { OverlayHeader, SheetActions, useSurface } from '../../../shared/surface'
import { Button, RadioCard, useRovingRadio } from '../../../shared/ui'
import { locationName, plural } from '../../../shared/format'

export function ImportDialog({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (sampleId: string) => void }) {
  const { Overlay } = useSurface()
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const [picked, setPicked] = useState<string>(HOSPITAL_DOWNLOAD_SAMPLES[0]!.id)
  useEffect(() => {
    if (open) setPicked(HOSPITAL_DOWNLOAD_SAMPLES[0]!.id)
  }, [open])
  const ids = HOSPITAL_DOWNLOAD_SAMPLES.map((s) => s.id)
  const { groupProps, itemProps } = useRovingRadio({ values: ids, value: picked, onChange: setPicked })

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="matching-import" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <OverlayHeader
          title="Import hospital file"
          trailing={<DemoBadge label="Sample file" />}
          description="Choose the file to import. Its rows wait on Matching until you decide each one; nothing changes the schedule on import."
        />
        <div {...groupProps} aria-label="Sample files" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {HOSPITAL_DOWNLOAD_SAMPLES.map((s, i) => (
            <RadioCard
              key={s.id}
              radio={itemProps(i)}
              checked={s.id === picked}
              onSelect={() => setPicked(s.id)}
              title={locationName(s.hospitalId, hospitals)}
              titleExtra={<span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{plural(s.rows.length, 'row')}</span>}
              description={
                <>
                  <span style={{ fontSize: 13, color: neutral.ink }}>{s.label}</span>
                  <span>{s.description}</span>
                </>
              }
              data-sample-id={s.id}
            />
          ))}
        </div>
        <SheetActions
          secondary={<Button variant="secondary" size="desktop" onClick={onClose}>Cancel</Button>}
          primary={<Button variant="primary" size="desktop" block onClick={() => onImport(picked)} shot="matching-import-confirm">Import</Button>}
        />
      </div>
    </Overlay>
  )
}
