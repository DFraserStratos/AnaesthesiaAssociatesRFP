import { useState } from 'react'
import { useAppStore } from '@proto/store'
import { Button } from '@/components/ui/button'
import { RvgPickerDialog, type RvgGroup, type RvgPickerOptions } from './RvgPickerDialog'
import { Echo, useReturnFocus } from './shared'

/** CodePickerSheet's catalogue example: a trigger, the type-ahead dialog, the pick held locally. */
export function CodePickerReplacement(options: RvgPickerOptions) {
  const rvgGroups = useAppStore((s: { masters: { rvgGroups: Record<string, RvgGroup> } }) => s.masters.rvgGroups)
  const [open, setOpen] = useState(false)
  const { finalFocus, remember } = useReturnFocus()
  const [picked, setPicked] = useState<string | undefined>(undefined)
  const row = picked !== undefined ? rvgGroups[picked] : undefined
  return (
    <>
      <Button variant="outline" onClick={(e) => {
          remember(e)
          setOpen(true)
        }}
      >
        Choose an RVG code
      </Button>
      <Echo>{row !== undefined ? `Picked ${row.code} · ${row.description} (held locally, nothing saved)` : null}</Echo>
      <RvgPickerDialog
        {...options}
        open={open}
        finalFocus={finalFocus}
        onOpenChange={setOpen}
        rvgGroups={rvgGroups}
        currentId={picked}
        onPick={(id) => {
          setPicked(id)
          setOpen(false)
        }}
      />
    </>
  )
}
