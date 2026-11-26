/**
 * The Intake update bench's parts in the admin catalogue (build plan Phase 69): the List-level difference table on
 * static rows, and the match basis, the List's versions and where it lands on the seed's decided arrival (St George's
 * update to Dr Rutherford's Mon 23 Nov AM List). Nothing here writes to the demo data.
 */

import { useMemo, useState } from 'react'
import type { ListChangeRow } from '../../../../domain/intake/listChanges'
import { arrivalItemsOf } from '../../../../store/intakeSelectors'
import { useAppStore } from '../../../../store/appStore'
import { ListDiffTable } from '../../../admin/screens/intake/workbench/update/ListDiffTable'
import { MatchBasisStrip } from '../../../admin/screens/intake/workbench/update/MatchBasisStrip'
import { SlotCard } from '../../../admin/screens/intake/workbench/update/SlotCard'
import { VersionTrack } from '../../../admin/screens/intake/workbench/update/VersionTrack'
import { StageHint } from '../CatalogueKit'

const ROWS: ListChangeRow[] = [
  {
    rowId: 'EX-1',
    change: 'changed',
    status: 'open',
    patientName: 'Aroha Ngata',
    nhi: 'ZKC4417',
    dobISO: '1961-03-12',
    scheduledTime: '08:00',
    procedureText: 'Right total knee joint replacement',
    bookingId: 'EX-B1',
    diffs: [
      { key: 'procedureText', label: 'Procedure', current: 'RTK', incoming: 'Right total knee joint replacement', effect: 'replaces' },
      { key: 'insurer', label: 'Insurer', current: 'Southern Cross', incoming: 'Southern Cross · Approval 448812', effect: 'sets' },
    ],
    flags: [],
  },
  {
    rowId: 'EX-2',
    change: 'changed',
    status: 'open',
    patientName: 'Peter Lindqvist',
    nhi: 'ZLM2290',
    dobISO: '1958-08-02',
    scheduledTime: '10:45',
    procedureText: 'Arthroscopy left knee',
    bookingId: 'EX-B2',
    diffs: [{ key: 'time', label: 'Time', current: '10:30', incoming: '10:45', effect: 'sets' }],
    flags: [],
  },
  { rowId: 'EX-3', change: 'added', status: 'open', patientName: 'Sina Faleolo', nhi: 'ZFA3306', dobISO: '1994-01-30', scheduledTime: '11:00', procedureText: 'Anterior cruciate ligament reconstruction, right', diffs: [], flags: [] },
  { rowId: 'EX-4', change: 'removed', status: 'open', patientName: 'Hannah Brooks', nhi: 'ZBR5521', dobISO: '1987-09-09', scheduledTime: '12:30', procedureText: 'Arthroscopy right knee', bookingId: 'EX-B4', diffs: [], flags: [] },
]

/** ListDiffTable: a wording and approval change, a time change, a stub's NHI arriving and a removal to confirm. */
export function ListDiffTableExample() {
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set(['EX-1', 'EX-2', 'EX-3', 'EX-4']))
  return (
    <ListDiffTable
      rows={ROWS}
      ticked={ticked}
      onToggle={(rowId, next) =>
        setTicked((cur) => {
          const out = new Set(cur)
          if (next) out.add(rowId)
          else out.delete(rowId)
          return out
        })
      }
      stubs={{ 'EX-3': [{ stubId: 'EX-S1', label: 'Sina Faleolo · 30 Jan 1994' }] }}
      extras={{ 'EX-1': { insurer: 'Southern Cross · Approval 448812' }, 'EX-2': { insurer: 'Self funded' } }}
      shot="catalogue-intake-update-diff"
    />
  )
}

/** The seed's update arrivals, newest first: decided ones included, so the catalogue always has one to show. */
function useSeedUpdate() {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const intake = useAppStore((s) => s.intake)
  return useMemo(() => arrivalItemsOf({ masters, schedule, intake }).find((i) => i.kind === 'update' && i.heldListId !== undefined), [masters, schedule, intake])
}

/** MatchBasisStrip and VersionTrack on the seed's update arrival. */
export function UpdateHeaderExample() {
  const arrival = useSeedUpdate()
  if (arrival === undefined || arrival.heldListId === undefined) return <StageHint>No update arrival in the store.</StageHint>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <MatchBasisStrip arrival={arrival} shot="catalogue-intake-match-basis" />
      <VersionTrack arrival={arrival} listId={arrival.heldListId} shot="catalogue-intake-version-track" />
    </div>
  )
}

/** SlotCard on the List the seed's update arrival lands on. */
export function SlotCardExample() {
  const arrival = useSeedUpdate()
  if (arrival?.heldListId === undefined) return <StageHint>No update arrival in the store.</StageHint>
  return (
    <div style={{ maxWidth: 300 }}>
      <SlotCard listId={arrival.heldListId} shot="catalogue-intake-lands-card" />
    </div>
  )
}
