import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { commitMasterLoad, discardMasterLoad, specFor, useAppStore } from '../../../../store'
import { SEED_LOAD_ACTOR } from '../../../../store/demoActors'
import { Button, FormError } from '../../../../shared'
import { Notice, Pill, ResultLine, SlidingSegmentedControl, TextAction } from '../../../../shared/ui'
import { TableShell, Td, Th } from '../../../../shared/table'
import { plainDate, plural, pluralWord } from '../../../../shared/format'
import { SAMPLE_SHEETS } from '../../../../domain/masterLoad/samples'
import type { LoadEntity, MasterLoad } from '../../../../domain/masterLoad/types'
import { neutral } from '../../../../theme/tokens'
import type { MastersView } from './view'

/** The Master data view that keeps each sheet's records (a row's link after a load). */
const VIEW_OF: Record<LoadEntity, MastersView> = {
  specialties: 'specialties',
  surgeons: 'surgeons',
  anaesthetists: 'anaesthetists',
  hospitals: 'hospitals',
  hospitalHolidays: 'hospitals',
  publicHolidays: 'publicHolidays',
  rvgGroups: 'rvgGroups',
  modifiers: 'modifiers',
  parties: 'parties',
  fundingTags: 'fundingTags',
  contracts: 'contracts',
  priceRanges: 'contracts',
}

/** The file a load was checked from: the file chosen, or the sample sheet's file name. */
function fileNameOf(load: MasterLoad): string {
  if (load.source.kind === 'file') return load.source.fileName
  const id = load.source.sampleId
  return SAMPLE_SHEETS.find((s) => s.id === id)?.fileName ?? id
}

/** Where a loaded record opens: the surgeon profile, the anaesthetist record, a Party's or Contract's panel, otherwise its view. */
function recordPath(entity: LoadEntity, recordId: string | undefined): string {
  if (entity === 'surgeons' && recordId !== undefined) return `/admin/masters/surgeons/${recordId}`
  if (entity === 'anaesthetists' && recordId !== undefined) return `/admin/masters/anaesthetists/${recordId}`
  if (entity === 'parties' && recordId !== undefined) return `/admin/masters?view=parties&party=${encodeURIComponent(recordId)}`
  if (entity === 'contracts' && recordId !== undefined) return `/admin/masters?view=contracts&contract=${encodeURIComponent(recordId)}`
  return `/admin/masters?view=${VIEW_OF[entity]}`
}

type Filter = 'all' | 'rejected'

/**
 * One checked sheet's result (catch-up Phase 42; US-13.4.3 AC1), shared by
 * Seed load and the go-live view: a summary line, an Admin Review style table
 * of every row (Row, the sheet's key columns, Valid or Rejected, the reasons
 * one per line, a valid row's notes), the "Only rejected" filter, and while
 * staged, "Load N valid rows" and "Discard" as the developer's seed load.
 * After a load the summary says what loaded, every count computed from the
 * stored rows and `loadedSummary`, and each valid row links to its record.
 * `showLoad` false hides both actions (the go-live view loads and discards the
 * whole batch).
 */
export function LoadResultPanel({ load, showLoad = true }: { load: MasterLoad; showLoad?: boolean }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState<string | null>(null)
  const spec = specFor(load.entity)
  const valid = load.rows.filter((r) => r.status === 'valid').length
  const rejected = load.rows.length - valid
  const loaded = load.status === 'loaded'
  const shown = filter === 'rejected' ? load.rows.filter((r) => r.status === 'rejected') : load.rows
  const keyIndex = spec.keyColumns.map((h) => load.header.indexOf(h))
  const pricingIndex = load.entity === 'contracts' ? load.header.indexOf('Pricing kind') : -1
  // A load's record ids follow its valid rows in row order (one create per valid row).
  const validRows = load.rows.filter((r) => r.status === 'valid').sort((a, b) => a.rowNumber - b.rowNumber)
  const recordOf = new Map(validRows.map((r, i) => [r.rowNumber, load.loadedRecordIds?.[i]]))
  const calendar = load.entity === 'hospitalHolidays' || load.entity === 'publicHolidays'

  function commit() {
    const out = commitMasterLoad(useAppStore, SEED_LOAD_ACTOR, load.id)
    setError(out.ok ? null : out.message)
  }

  function discard() {
    const out = discardMasterLoad(useAppStore, SEED_LOAD_ACTOR, load.id)
    setError(out.ok ? null : out.message)
  }

  const loadedLine = loaded
    ? [
        `Loaded ${plural(valid, 'row')} on ${plainDate(load.loadedAtISO ?? load.stagedAtISO)}`,
        ...(rejected > 0 ? [`${plural(rejected, 'rejected row')} ${pluralWord(rejected, 'was', 'were')} not loaded`] : []),
        ...(calendar ? [`${plural(load.loadedSummary?.flagged ?? 0, 'List')} flagged`] : []),
      ].join(' · ')
    : null

  return (
    <div data-shot="master-load-result" data-load-id={load.id} data-load-status={load.status} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: neutral.slate }}>
          <span className="mono" style={{ color: neutral.ink, fontWeight: 600 }}>{fileNameOf(load)}</span>
          {`: ${plural(load.rows.length, 'row')} · ${valid} valid · ${rejected} rejected`}
          {load.status === 'discarded' && ' · discarded'}
        </div>
        {load.rows.length > 0 && (
          <SlidingSegmentedControl<Filter>
            size="sm"
            variant="surface"
            layout="wrap"
            trackStyle={{ flex: 'none' }}
            buttonStyle={{ whiteSpace: 'nowrap' }}
            ariaLabel={`Rows of ${fileNameOf(load)}`}
            value={filter}
            onSelect={setFilter}
            options={[
              { value: 'all', label: 'All rows' },
              { value: 'rejected', label: 'Only rejected' },
            ]}
          />
        )}
      </div>
      {loadedLine !== null && <ResultLine line={loadedLine} shot="master-load-loaded" />}
      {load.headerErrors.length > 0 && (
        <Notice tone="error">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong>The sheet cannot be loaded:</strong>
            {load.headerErrors.map((e) => <span key={e}>{e}</span>)}
          </div>
        </Notice>
      )}
      {load.rows.length > 0 && (
        <TableShell density="dense" label={`${spec.label}: ${fileNameOf(load)}`}>
          <thead>
            <tr>
              <Th width={56}>Row</Th>
              {spec.keyColumns.map((h) => <Th key={h}>{h}</Th>)}
              <Th>Result</Th>
              <Th>Reasons</Th>
              {loaded && <Th align="right" />}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const pricing = pricingIndex >= 0 ? (r.cells[pricingIndex] ?? '').trim() : ''
              const fixed = /^fixed/i.test(pricing)
              const recordId = recordOf.get(r.rowNumber)
              return (
                <tr key={r.rowNumber} data-load-row={r.rowNumber} data-row-status={r.status}>
                  <Td mono>{r.rowNumber}</Td>
                  {keyIndex.map((i, k) => (
                    <Td key={spec.keyColumns[k]}>{i >= 0 && (r.cells[i] ?? '') !== '' ? r.cells[i] : <span style={{ color: neutral.mist }}>Blank</span>}</Td>
                  ))}
                  <Td nowrap>
                    <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                      <Pill tone={r.status === 'valid' ? 'success' : 'error'} size="sm">{r.status === 'valid' ? 'Valid' : 'Rejected'}</Pill>
                      {pricing !== '' && <Pill tone="neutral" size="sm">{pricing}</Pill>}
                      {pricing !== '' && fixed && r.status === 'valid' && <Pill tone="neutral" size="sm">1 range</Pill>}
                    </span>
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {r.reasons.map((reason) => <span key={reason}>{reason}</span>)}
                      {r.status === 'valid' && r.notes.map((note) => <span key={note} style={{ color: neutral.slate }}>{note}</span>)}
                      {r.reasons.length === 0 && (r.status === 'rejected' || r.notes.length === 0) && <span style={{ color: neutral.mist }}>None</span>}
                    </div>
                  </Td>
                  {loaded && (
                    <Td align="right" nowrap>
                      {r.status === 'valid' && (
                        <TextAction size="sm" flush onClick={() => navigate(recordPath(load.entity, recordId))} label={`Open the record from row ${r.rowNumber}`}>Open</TextAction>
                      )}
                    </Td>
                  )}
                </tr>
              )
            })}
            {shown.length === 0 && (
              <tr>
                <Td colSpan={spec.keyColumns.length + 3 + (loaded ? 1 : 0)}><span style={{ color: neutral.mist }}>No rejected rows.</span></Td>
              </tr>
            )}
          </tbody>
        </TableShell>
      )}
      <FormError message={error} />
      {showLoad && load.status === 'staged' && (
        <div
          data-load-footer
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderTop: `1px solid ${neutral.line}`, paddingTop: 12 }}
        >
          <div style={{ fontSize: 13, color: neutral.slate, minWidth: 0 }}>
            <span style={{ fontWeight: 600, color: neutral.ink }}>{`${plural(valid, 'valid row')} will load`}</span>
            {rejected > 0 && ` · ${plural(rejected, 'rejected row')} will not`}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 'none' }}>
          <Button variant="secondary" size="desktop" onClick={discard} style={{ whiteSpace: 'nowrap' }}>Discard</Button>
          <Button
            variant="primary"
            size="desktop"
            style={{ whiteSpace: 'nowrap' }}
            onClick={commit}
            disabled={valid === 0}
            disabledReason={valid === 0 ? 'No row in this sheet can be loaded.' : undefined}
            shot="master-load-commit"
          >
            {`Load ${plural(valid, 'valid row')}`}
          </Button>
          </div>
        </div>
      )}
    </div>
  )
}
