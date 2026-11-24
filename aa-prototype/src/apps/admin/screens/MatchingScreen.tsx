/**
 * Matching (catch-up Phase 33; US-02.1.1 to US-02.1.4, FT-02.5; AR-21; Admin
 * Intake's first tab since Phase 34, so it sits under Intake's title;
 * `matching-screen`, `rows-wait`). Hospital bookings and sheets land here as
 * rows; the office matches each to a Booking or List, creates what is
 * missing, or rejects it. Nothing changes the schedule until it decides (no
 * silent apply, RV-13). Intake's `fit` list page: Import hospital file is
 * Intake's page action while this tab shows; the toolbar holds the Open,
 * Unmatched and Decided filter with counts and the New, Modifications and
 * Cancellations summary; one table with a flags column and the sample-file
 * note in its footer; and the decided row's banner, tick and dimmed row with
 * Next row. The row panel is the Admin Day drawer's.
 *
 * Built on the shared kit (UI unification): `FilterPills`, the table kit,
 * `SidePanel`, `Pill`, `EmptyState`, `Notice`, `ResultLine`, `TextField`,
 * `useRovingRadio` and `Button`.
 */

import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { neutral } from '../../../theme/tokens'
import { importHospitalDownload, importRowViews, matchingCounts, matchingView, useAppStore, type Actor, type ImportRowView, type MatchingFilter } from '../../../store'
import { Button, EmptyState, FilterPills, ResultLine } from '../../../shared/ui'
import { useDemoTriggerContextWhile } from '../../../shared/demoTriggers'
import { locationName, plural } from '../../../shared/format'
import { hospitalDownloadSample } from '../../../domain/intake'
import { ImportDialog } from '../matching/ImportDialog'
import { MatchingTable } from '../matching/MatchingTable'
import { RowPanel } from '../matching/RowPanel'
import { PageBody, PageToolbar } from '../components/AdminPage'
import { useIntakePage } from './IntakeScreen'

const EMPTY: Record<MatchingFilter, string> = {
  open: "No rows waiting. Imported St George's and Southern Cross files, the rooms' PDF lists and received sheets land here.",
  unmatched: 'No unmatched rows. Rows with no match, or waiting for an NHI, show here.',
  decided: 'Nothing decided yet. Applied and rejected rows show here, newest first.',
}

/** The row id a link passes in router state (`{ selectRowId }`), e.g. the Booking's "From hospital row". */
function selectRowIdFrom(state: unknown): string | null {
  return typeof state === 'object' && state !== null && 'selectRowId' in state && typeof state.selectRowId === 'string' ? state.selectRowId : null
}

export function MatchingScreen({ actor, todayISO, onOpenBooking }: { actor: Actor; todayISO: string; onOpenBooking: (dateISO: string, bookingId: string) => void }) {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const intake = useAppStore((s) => s.intake)
  const { state: navigationState } = useLocation()
  const view = useMemo(() => matchingView({ masters, schedule, intake }), [masters, schedule, intake])
  const counts = useMemo(() => matchingCounts({ masters, schedule, intake }, view), [masters, schedule, intake, view])
  const openRows = useMemo(() => importRowViews({ masters, schedule, intake }, 'open', view), [masters, schedule, intake, view])
  const decidedRows = useMemo(() => importRowViews({ masters, schedule, intake }, 'decided', view), [masters, schedule, intake, view])

  const [filter, setFilter] = useState<MatchingFilter>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  // The row just decided in the panel: it stays in place, dimmed, until the office moves on.
  const [justDecided, setJustDecided] = useState<{ rowId: string; index: number } | null>(null)

  useDemoTriggerContextWhile('matching.selectedRowId', selectedId ?? '', selectedId !== null)

  // Intake's page action while this tab shows (only a stable setter inside: see `useIntakePage`).
  const importAction = (
    <Button variant="primary" size="desktop" onClick={() => setImportOpen(true)} shot="matching-import-open">
      <Upload size={16} aria-hidden /> Import hospital file
    </Button>
  )
  const hosted = useIntakePage(importAction)

  // Rows staged while the screen is open (the bar's "Import hospital file" or "Send update"):
  // select the first new row, as the dialog's import does.
  const batchIds = useMemo(() => Object.keys(intake.batches).sort(), [intake.batches])
  const [seenBatches, setSeenBatches] = useState(batchIds)
  useEffect(() => {
    if (batchIds.length === seenBatches.length) return
    const added = batchIds.filter((id) => !seenBatches.includes(id))
    setSeenBatches(batchIds)
    const first = added.length > 0 ? intake.batches[added[added.length - 1]!]?.rowIds[0] : undefined
    if (first !== undefined && intake.rows[first]?.status === 'open') {
      setFilter('open')
      setSelectedId(first)
    }
  }, [batchIds, seenBatches, intake])

  // A link may name a row to open (router state, like the Invoices List column's `openListId`).
  useEffect(() => {
    const id = selectRowIdFrom(navigationState)
    if (id === null) return
    const row = useAppStore.getState().intake.rows[id]
    if (row === undefined) return
    setFilter(row.status === 'open' ? 'open' : 'decided')
    setSelectedId(id)
    setJustDecided(null)
  }, [navigationState])

  const rows: ImportRowView[] = useMemo(() => {
    const base = filter === 'decided' ? decidedRows : filter === 'unmatched' ? openRows.filter((r) => r.assessment?.queue === 'unmatched') : openRows
    if (justDecided === null || filter === 'decided') return base
    const decided = intake.rows[justDecided.rowId]
    if (decided === undefined || base.some((r) => r.row.id === decided.id)) return base
    const out = [...base]
    out.splice(Math.min(justDecided.index, out.length), 0, { row: decided, batch: intake.batches[decided.batchId] })
    return out
  }, [filter, openRows, decidedRows, justDecided, intake])

  // Next row: the open row now at the decided row's place in the Open order, else the first.
  const nextRowId = useMemo(() => {
    const pool = openRows.filter((r) => r.row.id !== selectedId)
    if (pool.length === 0) return undefined
    const at = justDecided !== null ? Math.min(justDecided.index, pool.length - 1) : 0
    return pool[at]!.row.id
  }, [openRows, selectedId, justDecided])

  function open(rowId: string) {
    setSelectedId(rowId)
    if (justDecided !== null && justDecided.rowId !== rowId) setJustDecided(null)
  }

  function runImport(sampleId: string) {
    const out = importHospitalDownload(useAppStore, actor, sampleId)
    setImportOpen(false)
    if (!out.ok) {
      setResult(out.message)
      return
    }
    const sample = hospitalDownloadSample(sampleId)
    const hospital = sample !== undefined ? locationName(sample.hospitalId, masters.hospitals) : 'the hospital'
    const { added, skipped, batchId } = out.value
    if (added === 0) {
      setResult(`All ${plural(skipped, 'row')} were already imported. Nothing new.`)
      return
    }
    setResult(`${plural(added, 'row')} imported from ${hospital}${skipped > 0 ? `. ${skipped} already imported` : ''}`)
    setFilter('open')
    setJustDecided(null)
    const first = batchId !== undefined ? useAppStore.getState().intake.batches[batchId]?.rowIds[0] : undefined
    if (first !== undefined) setSelectedId(first)
  }

  // Nothing changes the schedule until the office decides; the samples stand in for the hospitals' files (OQ-13).
  const note = (
    <span style={{ fontSize: 12.5, color: neutral.slate }}>
      Nothing changes the schedule until you decide.{' '}
      <span data-shot="matching-interim">Sample files stand in for each hospital's bookings while the integration team confirms how each hospital provides them.</span>
    </span>
  )

  const table =
    rows.length === 0 ? (
      <>
        <EmptyState variant="card" shot="matching-empty">
          {EMPTY[filter]}
        </EmptyState>
        {note}
      </>
    ) : (
      <MatchingTable rows={rows} view={view} decided={filter === 'decided'} selectedId={selectedId} dimmedId={justDecided?.rowId ?? null} todayISO={todayISO} onOpen={open} footer={note} />
    )

  const count = (stat: string, label: string, n: number) => (
    <span data-stat={stat}>
      {label} <span className="mono" style={{ color: neutral.ink }}>{n}</span>
    </span>
  )

  return (
    <>
      <PageToolbar
        end={
          <>
            <span data-shot="matching-stats" style={{ display: 'inline-flex', gap: 6 }}>
              {count('new', 'New', counts.new)} · {count('modification', 'Modifications', counts.modification)} · {count('cancellation', 'Cancellations', counts.cancellation)}
            </span>
            {!hosted && importAction}
          </>
        }
      >
        <FilterPills
          ariaLabel="Show rows"
          value={filter}
          onSelect={(f) => setFilter(f)}
          options={[
            { value: 'open', label: <span data-stat="open">Open · {counts.open}</span> },
            { value: 'unmatched', label: <span data-stat="unmatched">Unmatched · {counts.unmatched}</span> },
            { value: 'decided', label: <span data-stat="decided">Decided · {decidedRows.length}</span> },
          ]}
        />
      </PageToolbar>

      <PageBody shot="admin-matching">
        <ResultLine shot="matching-import-result" line={result} onDismiss={() => setResult(null)} />
        {filter === 'unmatched' ? <div data-shot="matching-unmatched" style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>{table}</div> : table}
      </PageBody>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImport={runImport} />

      {selectedId !== null && intake.rows[selectedId] !== undefined && (
        <RowPanel
          key={selectedId}
          rowId={selectedId}
          actor={actor}
          todayISO={todayISO}
          justDecided={justDecided?.rowId === selectedId}
          nextRowId={nextRowId}
          onClose={() => {
            setSelectedId(null)
            setJustDecided(null)
          }}
          onDecided={(rowId) => {
            const index = openRows.findIndex((r) => r.row.id === rowId)
            setJustDecided({ rowId, index: index < 0 ? 0 : index })
          }}
          onNext={() => {
            if (nextRowId === undefined) return
            setJustDecided(null)
            setSelectedId(nextRowId)
          }}
          onOpenBooking={onOpenBooking}
        />
      )}
    </>
  )
}
