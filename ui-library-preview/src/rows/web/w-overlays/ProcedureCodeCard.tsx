import { useState } from 'react'
import { useAppStore } from '@proto/store'
import { baseUnitsFor, baseUnitsText } from '@proto/domain/billing/rvgGroups'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CaptureHost, UnitsStepper, type Procedure } from './capture'
import { RvgPickerDialog, type RvgGroup } from './RvgPickerDialog'
import { CaptureCard, Echo, useReturnFocus } from './shared'

const OUTSIDE_GUIDE_CAPTION = 'Outside the guide range. The office will see a warning after the procedure.'

type CodeState = Pick<Procedure, 'rvgGroupId' | 'baseUnitsSelected' | 'baseUnitsCaptured'>

export function ProcedureCodeCardReplacement() {
  return <CaptureHost>{({ procedure, canCapture }) => <CodeCard seeded={procedure} canCapture={canCapture} />}</CaptureHost>
}

/**
 * The RVG code capture card on shadcn Card: the current code as one outline
 * button (Choose or Change opens the type-ahead dialog), Clear as a link
 * button, and a ranged code's base value on a Base UI NumberField. Picks and
 * values are local: a pick clears a chosen or typed base value when the code
 * changes, as `pickRvgGroup` does, and the value and caption come from the
 * prototype's own resolver (`baseUnitsFor`).
 */
function CodeCard({ seeded, canCapture }: { seeded: Procedure; canCapture: boolean }) {
  const rvgGroups = useAppStore((s: { masters: { rvgGroups: Record<string, RvgGroup> } }) => s.masters.rvgGroups)
  const [code, setCode] = useState<CodeState>({
    rvgGroupId: seeded.rvgGroupId,
    baseUnitsSelected: seeded.baseUnitsSelected,
    baseUnitsCaptured: seeded.baseUnitsCaptured,
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  const { finalFocus, remember } = useReturnFocus()
  const group = code.rvgGroupId !== undefined ? rvgGroups[code.rvgGroupId] : undefined

  function pick(id: string | undefined) {
    setPickerOpen(false)
    setCode((c) => (id === c.rvgGroupId ? c : { rvgGroupId: id, baseUnitsSelected: undefined, baseUnitsCaptured: undefined }))
  }

  return (
    <>
      <CaptureCard label="RVG code" className="tw:gap-2.5">
        <Button
          variant="outline"
          disabled={!canCapture}
          onClick={(e) => {
            remember(e)
            setPickerOpen(true)
          }}
          aria-label={group !== undefined ? `RVG code ${group.code}, ${group.description}. Change` : 'No RVG code. Choose'}
          className="tw:h-auto tw:w-full tw:justify-between tw:gap-3 tw:rounded-[12px]! tw:bg-background tw:px-3.5 tw:py-3 tw:text-left tw:whitespace-normal tw:hover:bg-sunken tw:disabled:text-ink"
        >
          {group !== undefined ? (
            <span className="tw:flex tw:min-w-0 tw:flex-col tw:gap-0.5">
              <span className="tw:font-mono tw:text-[13px] tw:font-semibold tw:text-primary">{group.code}</span>
              <span className="tw:text-[15px] tw:font-semibold tw:text-ink">{group.description}</span>
              <span className="tw:text-xs tw:font-normal tw:text-mist">Base {baseUnitsText(group)} units · from the RVG group</span>
            </span>
          ) : (
            <span className="tw:text-[15px] tw:font-normal tw:text-mist">
              {code.rvgGroupId !== undefined ? 'This RVG code is no longer in the RVG groups' : 'No RVG code'}
            </span>
          )}
          {canCapture && (
            <span aria-hidden className="tw:flex-none tw:text-sm tw:font-semibold tw:text-primary">
              {code.rvgGroupId !== undefined ? 'Change' : 'Choose'}
            </span>
          )}
        </Button>

        {group?.baseUnitsRange !== undefined && !seeded.isAdditional && (
          <RangeUnits code={code} group={group} canCapture={canCapture} onSelect={(n) => setCode((c) => ({ ...c, baseUnitsSelected: n, baseUnitsCaptured: undefined }))} />
        )}

        {canCapture && code.rvgGroupId !== undefined && (
          <div className="tw:flex tw:justify-end">
            <Button variant="link" className="tw:py-0.5! tw:text-[13px]" onClick={() => pick(undefined)}>
              Clear
            </Button>
          </div>
        )}
      </CaptureCard>
      <Echo>Local only: picks and values are not saved to the demo data.</Echo>
      <RvgPickerDialog finalFocus={finalFocus} open={pickerOpen} onOpenChange={setPickerOpen} rvgGroups={rvgGroups} currentId={code.rvgGroupId} onPick={pick} />
    </>
  )
}

function RangeUnits({ code, group, canCapture, onSelect }: { code: CodeState; group: RvgGroup & { baseUnitsRange: { min: number; max: number } }; canCapture: boolean; onSelect: (n: number) => void }) {
  const resolved = baseUnitsFor({ procedure: code, group }) as { units: number; source: string; outsideGuide: boolean }
  const value = resolved.units
  const status = resolved.source === 'chosen' ? `${value} chosen` : resolved.source === 'overridden' ? `${value} set manually` : `starts at ${value}`
  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      <div className="tw:flex tw:items-center tw:gap-3">
        <span className="tw:flex-1 tw:text-[13px] tw:text-slate">
          Guide {group.baseUnitsRange.min} to {group.baseUnitsRange.max} · {resolved.source === 'rvgGroup' ? status : <strong className="tw:text-ink">{status}</strong>}
        </span>
        {canCapture && <UnitsStepper label="base units" value={value} onChange={onSelect} />}
      </div>
      {resolved.outsideGuide && (
        <Alert variant="warning" role="status" className="tw:px-2.5 tw:py-1.5">
          <AlertDescription className="tw:text-[12.5px] tw:leading-[1.4]">{OUTSIDE_GUIDE_CAPTION}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
