import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { contractsPath } from '../../contractsPaths'
import { commitGoLiveLoad, discardGoLiveLoad, setGoLiveApproval, specFor, useAppStore, type Actor } from '../../../../store'
import { SEED_LOAD_ACTOR } from '../../../../store/demoActors'
import { Button, DemoBadge, FormError } from '../../../../shared'
import { Card, EmptyState, PageHeader, Pill, ResultLine, StatTile, TextAction, visuallyHidden } from '../../../../shared/ui'
import { TableShell, Td, Th } from '../../../../shared/table'
import { formatMoney, parseAmount, plural, pluralWord } from '../../../../shared/format'
import { evaluateGoLive, INVOICE_DESCRIPTION_HEADER, outcomeText, type GoLiveOutcome } from '../../../../domain/masterLoad/goLive'
import { normaliseOperationName } from '../../../../domain/masterLoad/solutionsPlus'
import type { GoLiveBatch, GoLiveCandidate, LoadEntity, MasterLoad } from '../../../../domain/masterLoad/types'
import { elevation, neutral, radius } from '../../../../theme/tokens'
import { LoadResultPanel } from './LoadResultPanel'
import type { MastersView } from './view'

/** How a count of each sheet's records reads in the result line, with the view it links to. */
const SHEET_WORDS: Partial<Record<LoadEntity, { one: string; many: string; view: MastersView; link: string }>> = {
  specialties: { one: 'specialty', many: 'specialties', view: 'specialties', link: 'Specialties' },
  surgeons: { one: 'surgeon', many: 'surgeons', view: 'surgeons', link: 'Surgeons' },
  anaesthetists: { one: 'anaesthetist', many: 'anaesthetists', view: 'anaesthetists', link: 'Anaesthetists' },
  hospitals: { one: 'hospital', many: 'hospitals', view: 'hospitals', link: 'Hospitals' },
  hospitalHolidays: { one: 'hospital holiday', many: 'hospital holidays', view: 'hospitals', link: 'Hospital holidays' },
  rvgGroups: { one: 'RVG group', many: 'RVG groups', view: 'rvgGroups', link: 'RVG groups' },
  modifiers: { one: 'modifier', many: 'modifiers', view: 'modifiers', link: 'Modifiers' },
  parties: { one: 'Party', many: 'Parties', view: 'parties', link: 'Parties' },
  fundingTags: { one: 'funding tag', many: 'funding tags', view: 'fundingTags', link: 'Funding tags' },
  contracts: { one: 'Contract', many: 'Contracts', view: 'contracts', link: 'Contracts' },
  publicHolidays: { one: 'public holiday', many: 'public holidays', view: 'publicHolidays', link: 'Public holidays' },
}

/** "A, B and C". */
function joinAnd(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/** The counts a load would make or made, sheet by sheet in pack order, as words ("3 surgeons", "5 Contracts with 6 price ranges"). */
function countWords(order: readonly LoadEntity[], bySheet: Partial<Record<LoadEntity, number>>, priceRanges: number): string[] {
  const out: string[] = []
  for (const entity of order) {
    const n = bySheet[entity] ?? 0
    const words = SHEET_WORDS[entity]
    if (n === 0 || words === undefined) continue
    const text = plural(n, words.one, words.many)
    out.push(entity === 'contracts' && priceRanges > 0 ? `${text} with ${plural(priceRanges, 'price range')}` : text)
  }
  return out
}

/** The go-live result line, computed from the batch's stored counts. */
function loadedLine(order: readonly LoadEntity[], counts: NonNullable<GoLiveBatch['loadedCounts']>): string {
  const made = countWords(order, counts.bySheet, counts.priceRanges)
  const head = made.length > 0 ? `Loaded ${joinAnd(made)}.` : 'Nothing was loaded.'
  return `${head} ${plural(counts.notLoaded, 'Solutions Plus entry', 'Solutions Plus entries')} ${pluralWord(counts.notLoaded, 'was', 'were')} not loaded.`
}

/** The Contracts-sheet row a name matches by invoice description, as the controlled spreadsheet shows it. */
interface ControlledRow {
  name: string
  party: string
  rvgCode: string
  fixedPrice: string
}

function controlledRowFor(contracts: MasterLoad | undefined, name: string): ControlledRow | undefined {
  if (contracts === undefined) return undefined
  const col = (h: string) => contracts.header.indexOf(h)
  const desc = col(INVOICE_DESCRIPTION_HEADER)
  if (desc < 0) return undefined
  const key = normaliseOperationName(name)
  const row = contracts.rows.find((r) => normaliseOperationName(r.cells[desc] ?? '') === key)
  if (row === undefined) return undefined
  const cell = (h: string) => {
    const i = col(h)
    return i >= 0 ? (row.cells[i] ?? '').trim() : ''
  }
  const price = parseAmount(cell('Fixed price'))
  return { name: cell('Name'), party: cell('Party'), rvgCode: cell('Default RVG code'), fixedPrice: price !== undefined ? formatMoney(price) : '' }
}

/**
 * The Result cell: "Loads" or "Not loaded", with at most one short reason line. A name AA did not
 * approve or excluded gets no line (its AA decision cell already says why); the full sentence is
 * the cell's tooltip.
 */
function ResultCell({ outcome }: { outcome: GoLiveOutcome | undefined }) {
  if (outcome === undefined) return null
  if (outcome.kind === 'loads') return <span title={outcomeText(outcome)}>Loads</span>
  const reason =
    outcome.kind === 'noControlledRow' ? 'No spreadsheet row'
    : outcome.kind === 'alreadyInMaster' ? 'Already in master data'
    : outcome.kind === 'controlledRowRejected' ? `Row ${outcome.rowNumber} rejected`
    : undefined
  return (
    <div title={outcomeText(outcome)} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ whiteSpace: 'nowrap' }}>Not loaded</span>
      {reason !== undefined && <span style={{ color: neutral.slate, whiteSpace: 'nowrap' }}>{reason}</span>}
    </div>
  )
}

function DecisionPill({ c }: { c: GoLiveCandidate }) {
  if (c.decision === 'approved') return <Pill tone="success" size="sm">Approved</Pill>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
      {c.decision === 'notApproved' ? <Pill tone="warning" size="sm">Not approved</Pill> : <Pill tone="neutral" size="sm">Excluded</Pill>}
      {c.reason !== undefined && <span style={{ color: neutral.slate }}>{c.reason}</span>}
    </div>
  )
}

/**
 * Go-live load (catch-up Phase 42, group Go-live; US-13.4.2, US-13.4.3 AC3): a
 * clean cut from Solutions Plus, as a demo. The scanned operation names sit
 * beside AA's decision on each and the controlled spreadsheet row that would
 * load it; the controlled sheets show their own results. Approve and
 * Unapprove are AA's decision (the Admin app's actor); "Load approved data"
 * and "Discard" are the developer's step (`SEED_LOAD_ACTOR`). Every count is
 * computed from the store.
 */
export function GoLiveLoadView({ actor }: { actor: Actor }) {
  const [, setParams] = useSearchParams()
  const navigate = useNavigate()
  const batch = useAppStore((s) => s.masterLoads.goLive)
  const allLoads = useAppStore((s) => s.masterLoads.loads)
  const contracts = useAppStore((s) => s.masters.contracts)
  const [error, setError] = useState<string | null>(null)
  const [openSheets, setOpenSheets] = useState<ReadonlySet<string>>(new Set())

  const loads = useMemo(
    () => (batch === null ? [] : batch.loadIds.map((id) => allLoads[id]).filter((l): l is MasterLoad => l !== undefined)),
    [batch, allLoads],
  )
  const contractsLoad = loads.find((l) => l.entity === 'contracts')
  // Each name's outcome, as the store's `goLiveOutcomes` works it out; once loaded, the Contracts this
  // load made are left out of "already in master data", so the Result column keeps saying what loaded.
  const outcomes = useMemo(() => {
    if (batch === null) return new Map<number, GoLiveOutcome>()
    const made = new Set(contractsLoad?.loadedRecordIds ?? [])
    const inMaster = new Set(
      Object.values(contracts)
        .filter((c) => !made.has(c.id))
        .map((c) => normaliseOperationName(c.invoiceDescription ?? ''))
        .filter((d) => d !== ''),
    )
    return evaluateGoLive(batch.candidates, contractsLoad, inMaster)
  }, [batch, contractsLoad, contracts])
  const order = loads.map((l) => l.entity)

  function go(view: MastersView) {
    // The Contract list moved to its own section (build plan Phase 45): go there directly.
    if (view === 'contracts') {
      navigate(contractsPath())
      return
    }
    setParams((prev) => {
      const copy = new URLSearchParams(prev)
      copy.set('view', view)
      return copy
    }, { replace: true })
  }

  const header = (
    <>
      <PageHeader
        size="section"
        title="Go-live load"
        sub="A clean cut from Solutions Plus. Only data AA has approved is loaded, and it comes from AA's controlled spreadsheets. Nothing comes across because it exists in Solutions Plus."
      />
      <div>
        <DemoBadge variant="notice" label="Demo: loads into today's master data; at go-live the masters start empty." />
      </div>
    </>
  )

  if (batch === null || batch.status === 'discarded') {
    return (
      <div data-shot="masters-go-live" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {header}
        <EmptyState variant="card" title="No go-live load prepared">
          At go-live AA makes a clean cut: no Solutions Plus record comes across. AA approves the operation names it keeps, and only the data in its controlled
          spreadsheets loads. To prepare the demo load, open the Demo actions menu in the harness bar and choose Go-live data load (demo).
        </EmptyState>
      </div>
    )
  }

  const staged = batch.status === 'staged'
  const validBySheet: Partial<Record<LoadEntity, number>> = {}
  for (const l of loads) validBySheet[l.entity] = l.rows.filter((r) => r.status === 'valid').length
  const fixedRanges = contractsLoad === undefined ? 0 : contractsLoad.rows.filter((r) => r.status === 'valid' && /^fixed/i.test(r.cells[contractsLoad.header.indexOf('Pricing kind')] ?? '')).length
  const willLoad = staged ? Object.values(validBySheet).reduce((n, v) => n + (v ?? 0), 0) : Object.values(batch.loadedCounts?.bySheet ?? {}).reduce((n, v) => n + (v ?? 0), 0)
  const willLoadWords = staged ? countWords(order, validBySheet, fixedRanges + (validBySheet.priceRanges ?? 0)) : countWords(order, batch.loadedCounts?.bySheet ?? {}, batch.loadedCounts?.priceRanges ?? 0)
  const notLoaded = [...outcomes.values()].filter((o) => o.kind !== 'loads').length
  const rejectedRows = loads.reduce((n, l) => n + l.rows.filter((r) => r.status === 'rejected').length, 0)
  const approved = batch.candidates.filter((c) => c.decision === 'approved').length

  function approve(c: GoLiveCandidate, next: boolean) {
    const out = setGoLiveApproval(useAppStore, actor, c.scanRow, next)
    setError(out.ok ? null : out.message)
  }

  function commit() {
    const out = commitGoLiveLoad(useAppStore, SEED_LOAD_ACTOR)
    setError(out.ok ? null : out.message)
  }

  function discard() {
    const out = discardGoLiveLoad(useAppStore, SEED_LOAD_ACTOR)
    setError(out.ok ? null : out.message)
  }

  function toggleSheet(id: string) {
    setOpenSheets((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const linkViews = batch.loadedCounts !== undefined
    ? [...new Set(order.filter((e) => (batch.loadedCounts!.bySheet[e] ?? 0) > 0).map((e) => SHEET_WORDS[e]).filter((w) => w !== undefined))]
    : []

  return (
    <div data-shot="masters-go-live" data-go-live-status={batch.status} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {header}
      {batch.loadedCounts !== undefined && (
        <ResultLine
          line={loadedLine(order, batch.loadedCounts)}
          shot="go-live-result"
          actions={
            <span style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap' }}>
              {linkViews.map((w) => (
                <TextAction key={w.view} size="sm" flush onClick={() => go(w.view)}>{w.link}</TextAction>
              ))}
            </span>
          }
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <StatTile variant="outlined" label={staged ? 'Will load' : 'Loaded'} value={willLoad} sub="From the controlled spreadsheets" shot="go-live-tile-load" />
          <StatTile variant="outlined" label="Not loaded" value={notLoaded} sub="Solutions Plus entries" />
          <StatTile variant="outlined" label="Rows rejected" value={rejectedRows} tone={rejectedRows > 0 ? 'warning' : undefined} sub="In the controlled spreadsheets" />
          <StatTile variant="outlined" label="Approved names" value={approved} sub={`Of ${batch.candidates.length} on the Solutions Plus list`} />
        </div>
        {willLoadWords.length > 0 && (
          <div data-go-live-breakdown style={{ fontSize: 12.5, color: neutral.slate }}>{`${staged ? 'Will load' : 'Loaded'}: ${willLoadWords.join(' · ')}`}</div>
        )}
      </div>

      <FormError message={error} />

      <Card title="Solutions Plus operation list (names only)" padding="card">
        <TableShell density="dense" label="Solutions Plus operation list" shot="go-live-candidates" nested>
          <thead>
            <tr>
              <Th width={44}>Row</Th>
              <Th width="18%">Operation name</Th>
              <Th align="right" width={72} nowrap>
                <div>SP units</div>
                <div style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>Not used</div>
              </Th>
              <Th width="16%" nowrap>AA decision</Th>
              <Th nowrap>Controlled spreadsheet</Th>
              <Th width={124} nowrap>Result</Th>
              {staged && <Th align="right" width={104} nowrap>Action</Th>}
            </tr>
          </thead>
          <tbody>
            {batch.candidates.map((c) => {
              const row = controlledRowFor(contractsLoad, c.name)
              const outcome = outcomes.get(c.scanRow)
              const junk = c.decision === 'junk'
              return (
                <tr key={c.scanRow} data-scan-row={c.scanRow} data-decision={c.decision}>
                  <Td mono>{c.scanRow}</Td>
                  <Td bold>{c.name}</Td>
                  <Td mono align="right">
                    <span style={{ textDecoration: 'line-through', color: neutral.mist }}>{c.spUnits ?? 'None'}</span>
                  </Td>
                  <Td><DecisionPill c={c} /></Td>
                  <Td>
                    {row === undefined ? (
                      <span style={{ color: neutral.mist }}>No row</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600 }}>{row.name}</span>
                        <span style={{ color: neutral.slate }}>{row.party}</span>
                        {(row.rvgCode !== '' || row.fixedPrice !== '') && (
                          <span className="mono" style={{ color: neutral.slate }}>{[row.rvgCode, row.fixedPrice].filter((p) => p !== '').join(' · ')}</span>
                        )}
                      </div>
                    )}
                  </Td>
                  <Td><ResultCell outcome={outcome} /></Td>
                  {staged && (
                    <Td align="right" nowrap>
                      <Button
                        variant="secondary"
                        size="compact"
                        disabled={junk}
                        title={junk ? c.reason : undefined}
                        disabledReason={junk && c.reason !== undefined ? <span style={visuallyHidden}>{c.reason}</span> : undefined}
                        ariaLabel={`${c.decision === 'approved' ? 'Unapprove' : 'Approve'} ${c.name.trim()}`}
                        onClick={() => approve(c, c.decision !== 'approved')}
                      >
                        {c.decision === 'approved' ? 'Unapprove' : 'Approve'}
                      </Button>
                    </Td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </TableShell>
        <div style={{ fontSize: 12.5, color: neutral.slate }}>Solutions Plus identifiers and unit values are not carried over. Only operation names are used.</div>
      </Card>

      {loads.map((l) => {
        const spec = specFor(l.entity)
        const valid = l.rows.filter((r) => r.status === 'valid').length
        const open = openSheets.has(l.id)
        return (
          <Card
            key={l.id}
            title={spec.label}
            data-go-live-sheet={l.entity}
            aside={<span style={{ fontSize: 12.5, color: neutral.slate }}>{`${plural(l.rows.length, 'row')} · ${valid} valid · ${l.rows.length - valid} rejected`}</span>}
            action={
              <TextAction size="sm" ariaExpanded={open} onClick={() => toggleSheet(l.id)} label={`${open ? 'Hide' : 'Show'} the ${spec.label} sheet`}>
                {open ? 'Hide' : 'Show'}
              </TextAction>
            }
          >
            {open && <LoadResultPanel load={l} showLoad={false} />}
          </Card>
        )
      })}
      <Card title="RVG modifiers">
        <div style={{ fontSize: 12.5, color: neutral.slate }}>NZSA RVG 2021 modifier table: built from the published guide, already in master data</div>
      </Card>

      {staged && (
        <div
          data-go-live-footer
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, boxShadow: elevation.e1, padding: 16 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{`${plural(approved, 'approved name')} · ${plural(willLoad, 'record')} will load · ${notLoaded} not loaded`}</div>
            <div style={{ fontSize: 12.5, color: neutral.slate }}>Only approved names with a valid controlled spreadsheet row load. Nothing else comes from Solutions Plus.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 'none' }}>
            <Button variant="secondary" size="desktop" onClick={discard} style={{ whiteSpace: 'nowrap' }}>Discard</Button>
            <Button variant="primary" size="desktop" onClick={commit} shot="go-live-commit" style={{ whiteSpace: 'nowrap' }}>Load approved data</Button>
          </div>
        </div>
      )}
    </div>
  )
}
