import { useRef, useState } from 'react'
import { specFor, stageMasterLoad, useAppStore, type Actor } from '../../../../store'
import { SEED_LOAD_ACTOR } from '../../../../store/demoActors'
import { Button, DemoBadge, FormError } from '../../../../shared'
import { Card, Eyebrow, Notice, PageHeader, TextAction } from '../../../../shared/ui'
import { csvLine } from '../../../../domain/masterLoad/csv'
import { LOAD_ORDER, type LoadEntity, type MasterLoad } from '../../../../domain/masterLoad/types'
import { neutral } from '../../../../theme/tokens'
import { LoadResultPanel } from './LoadResultPanel'

/** The latest load of a sheet outside any go-live batch (its live result), discarded ones left out. */
function lastLoadOf(loads: Readonly<Record<string, MasterLoad>>, entity: LoadEntity): MasterLoad | undefined {
  return Object.values(loads)
    .filter((l) => l.entity === entity && l.goLiveBatchId === undefined && l.status !== 'discarded')
    .sort((a, b) => (a.stagedAtISO === b.stagedAtISO ? a.id.localeCompare(b.id) : a.stagedAtISO.localeCompare(b.stagedAtISO)))
    .pop()
}

/** A sheet's template file name: "hospital-holidays-template.csv". */
function templateName(entity: LoadEntity): string {
  return `${entity.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}-template.csv`
}

/** Save a header-only CSV built here, in the browser: no fetch. */
function downloadTemplate(entity: LoadEntity) {
  const headers = specFor(entity).columns.map((c) => c.header)
  const blob = new Blob([`${csvLine(headers)}\n`], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = templateName(entity)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Seed load (catch-up Phase 42, group Go-live; US-13.4.3 AC1 and AC2): the
 * developer's one-off load of AA's controlled spreadsheets, shown as a demo
 * stand-in. Every sheet in load order, with its columns, a header-only
 * template, a `.csv` input and its last result. Every row is checked with the
 * same rules as adding the record by hand; "Load N valid rows" folds them in.
 * It acts as `SEED_LOAD_ACTOR`, never as the office.
 */
export function SeedLoadView(_props: { actor: Actor }) {
  const loads = useAppStore((s) => s.masterLoads.loads)
  return (
    <div data-shot="seed-load" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <PageHeader
        size="section"
        title="Seed load"
        sub="AA's controlled spreadsheets, checked and loaded once before go-live. Every row is checked with the same rules as adding it by hand."
      />
      <div>
        <DemoBadge
          label="Demo stand-in: in the real system a developer runs this load; the office never sees this screen."
          variant="notice"
        />
      </div>
      <Notice tone="neutral">There is no Contract upload or export in the first release; Contracts are kept by hand after the load.</Notice>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {LOAD_ORDER.map((entity, i) => (
          <li key={entity}>
            <SheetCard entity={entity} order={i + 1} last={lastLoadOf(loads, entity)} />
          </li>
        ))}
      </ol>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Eyebrow>Repeatable for a test system</Eyebrow>
        <div style={{ fontSize: 12.5, color: neutral.slate }}>Reset the demo and load the same sheets again: the records come back identical.</div>
      </div>
    </div>
  )
}

function SheetCard({ entity, order, last }: { entity: LoadEntity; order: number; last: MasterLoad | undefined }) {
  const spec = specFor(entity)
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function onFile(file: File | undefined) {
    if (file === undefined) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      const out = stageMasterLoad(useAppStore, SEED_LOAD_ACTOR, { entity, csvText: text, source: { kind: 'file', fileName: file.name } })
      setError(out.ok ? null : out.message)
    }
    reader.onerror = () => setError('The file could not be read.')
    reader.readAsText(file)
    if (input.current !== null) input.current.value = ''
  }

  return (
    <Card
      title={`${order}. ${spec.label}`}
      data-seed-sheet={entity}
      action={
        <span style={{ display: 'inline-flex', gap: 14, alignItems: 'center' }}>
          <TextAction size="sm" onClick={() => downloadTemplate(entity)} label={`Download the ${spec.label} template`}>Download template</TextAction>
          <Button variant="secondary" size="compact" onClick={() => input.current?.click()} ariaLabel={`Choose a CSV file for ${spec.label}`}>Choose CSV file</Button>
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv"
            aria-label={`${spec.label} CSV file`}
            data-seed-file={entity}
            onChange={(e) => onFile(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
        </span>
      }
    >
      <div style={{ fontSize: 12.5, color: neutral.slate, lineHeight: '19px' }}>
        <span style={{ color: neutral.mist }}>Columns: </span>
        {spec.columns.map((c, i) => (
          <span key={c.key} title={c.hint}>
            {i > 0 && <span style={{ color: neutral.mist }}> · </span>}
            <span style={c.required ? { color: neutral.ink, fontWeight: 600 } : undefined}>{c.header}</span>
            {c.required && <span style={{ color: neutral.mist }}> (required)</span>}
          </span>
        ))}
      </div>
      {spec.hint !== undefined && <div style={{ fontSize: 12.5, color: neutral.mist }}>{spec.hint}</div>}
      <FormError message={error} />
      {last !== undefined ? <LoadResultPanel key={last.id} load={last} /> : <div style={{ fontSize: 12.5, color: neutral.mist }}>No sheet checked yet.</div>}
    </Card>
  )
}
