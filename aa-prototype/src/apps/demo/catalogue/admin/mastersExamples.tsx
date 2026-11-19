import { useState } from 'react'
import { neutral } from '../../../../theme/tokens'
import { Button, FormError } from '../../../../shared'
import { Td } from '../../../../shared/table'
import { OFFICE_ACTOR, stageMasterLoad, stagedLoadFor, useAppStore } from '../../../../store'
import { SEED_LOAD_ACTOR } from '../../../../store/demoActors'
import { sampleFor } from '../../../../domain/masterLoad/samples'
import { LoadResultBanner, MasterTable, RetiredPill, RetireSection, retiredRowStyle, ShowRetiredToggle } from '../../../admin/screens/masters/chrome'
import { LoadResultPanel } from '../../../admin/screens/masters/LoadResultPanel'
import { PublicHolidaySheet } from '../../../admin/flows/PublicHolidaySheet'
import { RvgTimeRuleSheet } from '../../../admin/flows/RvgTimeRuleSheet'
import { Echo } from './basicExamples'

/**
 * The Master data pattern's parts (catch-up Phase 42) for the Admin catalogue:
 * the retired-row toggle and pill, the retire section, the waiting-load banner,
 * the load result panel, and the public holiday and RVG time rule sheets.
 */

function Missing({ what }: { what: string }) {
  return <div style={{ fontSize: 13, color: neutral.mist }}>No {what} in the seed.</div>
}

const RETIRE_ROWS = [
  { id: 'a', name: 'Rangiora Day Surgery', retired: false },
  { id: 'b', name: 'Ashburton Hospital', retired: false },
  { id: 'c', name: 'Old Mill Surgical', retired: true, reason: 'Closed in March' },
]

/** ShowRetiredToggle over a small table: off hides the retired row; on shows it in mist with the Retired pill. Local state only. */
export function ShowRetiredToggleExample() {
  const [show, setShow] = useState(false)
  const rows = show ? RETIRE_ROWS : RETIRE_ROWS.filter((r) => !r.retired)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ShowRetiredToggle checked={show} onChange={setShow} count={RETIRE_ROWS.filter((r) => r.retired).length} />
      <MasterTable columns={['Hospital', '']} label="Hospitals">
        {rows.map((r) => (
          <tr key={r.id}>
            <Td bold style={r.retired ? retiredRowStyle : undefined}>{r.name}</Td>
            <Td align="right" style={r.retired ? retiredRowStyle : undefined}>{r.retired && <RetiredPill reason={r.reason} />}</Td>
          </tr>
        ))}
      </MasterTable>
    </div>
  )
}

/** RetireSection for the first seeded surgeon group: Retire (with a reason) or Reinstate, as at the foot of its edit sheet. */
export function RetireSectionExample() {
  const groupId = useAppStore((s) => Object.keys(s.masters.surgeonGroups).sort()[0])
  const name = useAppStore((s) => (groupId !== undefined ? s.masters.surgeonGroups[groupId]?.name : undefined))
  const [last, setLast] = useState('Nothing done yet.')
  if (groupId === undefined) return <Missing what="surgeon group" />
  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ fontSize: 13, color: neutral.slate, marginBottom: 8 }}>{name}</div>
      <RetireSection kind="surgeonGroup" id={groupId} actor={OFFICE_ACTOR} onDone={() => setLast('Done: the surgeon group changed in the demo store.')} />
      <Echo>{last}</Echo>
    </div>
  )
}

/** Stage the sample hospitals sheet as the developer's seed load, unless one is already waiting. */
function useStageHospitals(): { staged: boolean; stage: () => void; error: string | null } {
  const staged = useAppStore((s) => stagedLoadFor(s, 'hospitals') !== undefined)
  const [error, setError] = useState<string | null>(null)
  function stage() {
    const sample = sampleFor('hospitals')
    const out = stageMasterLoad(useAppStore, SEED_LOAD_ACTOR, { entity: 'hospitals', csvText: sample.csv, source: { kind: 'sample', sampleId: sample.id } })
    setError(out.ok ? null : out.message)
  }
  return { staged, stage, error }
}

/** LoadResultBanner on the Hospitals view: shown while a seed load for its sheets (or the go-live load) waits. */
export function LoadResultBannerExample() {
  const { staged, stage, error } = useStageHospitals()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <LoadResultBanner view="hospitals" />
      {!staged && <div style={{ fontSize: 13, color: neutral.mist }}>No load is waiting for Hospitals, so the banner shows nothing.</div>}
      <div>
        <Button variant="secondary" size="compact" onClick={stage} disabled={staged} disabledReason={staged ? 'A hospitals load is already waiting.' : undefined}>
          Check the sample hospitals.csv
        </Button>
      </div>
      <FormError message={error} />
    </div>
  )
}

/** LoadResultPanel for the latest hospitals seed load: the summary, the row table, Only rejected, and Load or Discard. */
export function LoadResultPanelExample() {
  const { staged, stage, error } = useStageHospitals()
  const load = useAppStore((s) =>
    Object.values(s.masterLoads.loads)
      .filter((l) => l.entity === 'hospitals' && l.goLiveBatchId === undefined && l.status !== 'discarded')
      .sort((a, b) => a.stagedAtISO.localeCompare(b.stagedAtISO) || a.id.localeCompare(b.id))
      .pop(),
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {load !== undefined ? <LoadResultPanel key={load.id} load={load} /> : <div style={{ fontSize: 13, color: neutral.mist }}>No hospitals sheet checked yet.</div>}
      {!staged && (
        <div>
          <Button variant="secondary" size="compact" onClick={stage}>Check the sample hospitals.csv</Button>
        </div>
      )}
      <FormError message={error} />
    </div>
  )
}

/** PublicHolidaySheet: add a public holiday, or change the first seeded one. */
export function PublicHolidaySheetExample() {
  const firstId = useAppStore((s) => Object.values(s.masters.publicHolidays).sort((a, b) => a.dateISO.localeCompare(b.dateISO))[0]?.id)
  const [open, setOpen] = useState<'add' | 'edit' | null>(null)
  const [last, setLast] = useState('Nothing saved yet.')
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={() => setOpen('add')}>Add public holiday</Button>
        <Button variant="secondary" disabled={firstId === undefined} onClick={() => setOpen('edit')}>Change the first public holiday</Button>
      </div>
      <PublicHolidaySheet
        open={open !== null}
        actor={OFFICE_ACTOR}
        {...(open === 'edit' && firstId !== undefined ? { publicHolidayId: firstId } : {})}
        onClose={() => setOpen(null)}
        onDone={setLast}
      />
      <Echo>{last}</Echo>
    </div>
  )
}

/** RvgTimeRuleSheet: the tiers, the fixed part interval, the live preview and the worked examples. */
export function RvgTimeRuleSheetExample() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>Edit the RVG time rule</Button>
      {open && <RvgTimeRuleSheet actor={OFFICE_ACTOR} onClose={() => setOpen(false)} />}
    </div>
  )
}
