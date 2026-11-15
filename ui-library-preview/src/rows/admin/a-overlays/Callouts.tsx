import { useId, useMemo, useState } from 'react'
import { TriangleAlertIcon } from 'lucide-react'
import { useAppStore, useConflictLookups } from '@proto/store'
import { conflictPreview, describeConflict } from '@proto/domain/conflicts'
import { useNotPreferredWarning } from '@proto/apps/admin/components/pairing'
import { useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Missing } from './parts'
import { useNotPreferredPair } from './SurgeonPicker'

/**
 * The amber soft-warning callout on shadcn Alert (warning variant): the
 * triangle in the solid warning colour, a bold first line and the plain lines
 * under it. role=status as today (Alert defaults to role=alert, which would
 * interrupt a screen reader on every surgeon change).
 */
function WarningCallout({ titles, lines, fit = false }: { titles: readonly string[]; lines: readonly string[]; fit?: boolean }) {
  return (
    <Alert variant="warning" role="status" className={cn('tw:gap-y-1 tw:rounded-card tw:px-3.5 tw:py-3 tw:leading-[18px]', fit && 'tw:w-auto')}>
      <TriangleAlertIcon aria-hidden className="tw:text-warning!" />
      {titles.map((t) => (
        <AlertTitle key={t}>{t}</AlertTitle>
      ))}
      <AlertDescription className="tw:col-start-2 tw:flex tw:flex-col tw:gap-1 tw:leading-[18px]">
        {lines.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </AlertDescription>
    </Alert>
  )
}

interface PairingWarning {
  message: string
  entries: { reason?: string }[]
}

export function NotPreferredWarningReplacement() {
  const pair = useNotPreferredPair()
  const [on, setOn] = useState(true)
  const warning = useNotPreferredWarning(pair?.anaesthetistId, on ? pair?.surgeonId : undefined) as PairingWarning | null
  if (pair === undefined) return <Missing what="not-preferred pairings" />
  const reasons = (warning?.entries ?? []).map((e) => e.reason).filter((r): r is string => r !== undefined && r !== '')
  return (
    <div className="tw:flex tw:flex-col tw:items-start tw:gap-2.5">
      <Button variant="pill" onClick={() => setOn((v) => !v)}>
        {on ? 'Choose another surgeon' : 'Choose the not-preferred surgeon'}
      </Button>
      {warning !== null && (
        <WarningCallout
          fit
          titles={[warning.message]}
          lines={[...reasons.map((r) => `Reason: ${r}`), 'You can still go ahead. Only the office sees this, and going ahead is noted in the history.']}
        />
      )}
      {!on && <div className="tw:text-[12.5px] tw:text-mist">No warning: the pairing is fine.</div>}
    </div>
  )
}

interface Holiday {
  dateISO: string
  hospitalId: string
}

export function ConflictCalloutReplacement() {
  const hospitals: Record<string, { id: string; name: string }> = useAppStore((s: { masters: { hospitals: Record<string, { id: string; name: string }> } }) => s.masters.hospitals)
  const holidays: Record<string, Holiday> = useAppStore((s: { masters: { holidays: Record<string, Holiday> } }) => s.masters.holidays)
  const { holidayId } = useSeedIds() as { holidayId?: string }
  const holiday = holidayId !== undefined ? holidays[holidayId] : undefined
  const lookups = useConflictLookups()
  const [hospitalId, setHospitalId] = useState(holiday?.hospitalId ?? '')
  const conflicts = useMemo(
    () => (holiday === undefined ? [] : (conflictPreview({ dateISO: holiday.dateISO, hospitalId: hospitalId === '' ? undefined : hospitalId, holidays }) as { cause: string }[])),
    [holiday, hospitalId, holidays],
  )
  const items = useMemo(() => Object.values(hospitals).map((h) => ({ value: h.id, label: h.name })), [hospitals])
  const selectId = useId()
  if (holiday === undefined) return <Missing what="hospital holidays" />
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      <Select items={items} value={hospitalId} onValueChange={(v) => setHospitalId((v as string | null) ?? '')}>
        <SelectTrigger id={selectId} aria-label={`Hospital on ${holiday.dateISO}`} className="tw:w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {items.map((h) => (
            <SelectItem key={h.value} value={h.value}>
              {h.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="tw:text-[12.5px] tw:text-slate">A List on {holiday.dateISO} at this hospital:</div>
      {conflicts.length > 0 && (
        <WarningCallout
          titles={conflicts.map((c) => (describeConflict(c, { hospitalId }, lookups) as { detail: string }).detail)}
          lines={['The List will be accepted and flagged as a conflict. You can still go ahead.']}
        />
      )}
      {conflicts.length === 0 && <div className="tw:text-[12.5px] tw:text-mist">Open that day: no callout. Pick a closed hospital.</div>}
    </div>
  )
}
