import { contractLabel } from '../../../shared/contracts'
import { useMemo, useState } from 'react'
import { accent, neutral } from '../../../theme/tokens'
import { useAppStore } from '../../../store'
import { TextAction } from '../../../shared/ui'
import {
  actionLabel,
  auditFieldChanges,
  auditNamesFor,
  auditViewerEntries,
  formatAuditStamp,
  summariseAuditChanges,
} from '../../../shared/audit'
import { FilterDateInput, PageHeader, SelectField } from '../../../shared/ui'
import { TableShell, Td, Th } from '../../../shared/table'
import { auditNewestFirst } from '../../../store/indexes'
import { FULL_SCALE } from '../../../domain/seed/fullScale/constants'
import { Pager, pageOf } from '../components/Pager'
import { useScreenTiming } from '../../../shared/scale/useScreenTiming'
import { formatCount } from '../../../shared/format'


const SOURCES = ['all', 'anaesthetist', 'office', 'integration', 'system', 'demo'] as const


/**
 * The global audit viewer (Phase 07): a filterable feed over the one append-only
 * `state.audit`, newest first. Filter by entity type, source (anaesthetist /
 * office / integration / system / demo) and a date range. Each row shows the
 * acting Role · Source on every entry — the RBAC "who did what, as which role,
 * from which source" surface (A7). Reconstructs a Booking edited + reassigned +
 * authorised as a single mixed-source trail.
 *
 * Reads through the shared audit-narrative layer: the human action label leads,
 * with the machine code beneath it (this is the compliance surface, so the code
 * stays greppable), and the change cell is a COMPACT one-liner — the leading
 * field's movement plus a count of the rest. The full field ledger belongs on the
 * Booking history sheet, where someone is reading a single record; a long feed
 * has to stay scannable.
 *
 * Unlike the Booking sheet, this surface never collapses `Role · source` and never
 * coalesces consecutive edits: the compliance view stays explicit and one stored
 * entry stays one row.
 */
export function AuditViewer() {
  const stored = useAppStore((s) => s.audit)
  // Payments, receipts and disbursements are recorded in Xero, not here (catch-up Phase 39; US-13.5.2).
  const audit = useMemo(() => auditViewerEntries(stored), [stored])
  const contracts = useAppStore((s) => s.masters.contracts)
  const parties = useAppStore((s) => s.masters.parties)
  const specialties = useAppStore((s) => s.masters.specialties)
  const fundingTags = useAppStore((s) => s.masters.fundingTags)
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const patients = useAppStore((s) => s.masters.patients)
  const names = useMemo(() => auditNamesFor({ rvgGroups, contracts, patients }), [rvgGroups, contracts, patients])
  const [entityType, setEntityType] = useState('all')

  // A Contract reads by its AA code and name, a Party by its name (catch-up Phase 18).
  function entityName(type: string, id: string): string {
    if (type === 'contract') {
      const c = contracts[id]
      return c !== undefined ? contractLabel(c) : id
    }
    if (type === 'party') return parties[id]?.name ?? id
    // Catch-up Phase 18a: a specialty by its name, a funding tag by its code.
    if (type === 'specialty') return specialties[id]?.name ?? id
    if (type === 'fundingTag') return fundingTags[id]?.code ?? id
    // Catch-up Phase 19: an RVG group by its code and description, never its hidden id.
    if (type === 'rvgGroup') return names.rvgGroup?.(id) ?? 'An RVG group'
    // Catch-up Phase 40: a patient by NHI and name (the internal id is never shown); the balance setting by name.
    if (type === 'patient') {
      const p = patients[id]
      return p !== undefined ? `${p.nhi} · ${p.name}` : 'A patient'
    }
    if (type === 'settings' && id === 'patientBalance') return 'Patient balance warning'
    return id
  }
  const [source, setSource] = useState('all')
  const [fromISO, setFromISO] = useState('')
  const [toISO, setToISO] = useState('')
  // One change set at a time (catch-up Phase 35): set by clicking its id in the Change set column.
  const [changeSetId, setChangeSetId] = useState<string | null>(null)

  // Sorted and its entity types gathered once per audit array (catch-up Phase 43: indexed, so a
  // filter change is one linear pass over tens of thousands of entries, never a re-sort).
  const indexed = useMemo(() => auditNewestFirst(audit), [audit])
  const entityTypes = useMemo(() => ['all', ...indexed.entityTypes], [indexed])
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return indexed.sorted.filter((a) => {
      if (changeSetId !== null) return a.changeSetId === changeSetId
      if (entityType !== 'all' && a.entityType !== entityType) return false
      if (source !== 'all' && a.source !== source) return false
      const date = a.atISO.slice(0, 10)
      if (fromISO !== '' && date < fromISO) return false
      if (toISO !== '' && date > toISO) return false
      return true
    })
    // Sorted on `atISO` (id as the tiebreak), not insertion order: the same
    // shared sort the Booking history sheet uses, so the two agree (finding 01.3).
  }, [indexed, entityType, source, fromISO, toISO, changeSetId])

  // Pages of 100 (catch-up Phase 43; US-15.0.4): one stored entry stays one row; a filter returns to page 1.
  const pageSize = FULL_SCALE.pageSizes.audit
  const shown = pageOf(filtered, pageSize, page)
  useScreenTiming('audit', [audit, entityType, source, fromISO, toISO, changeSetId, page])
  const filterThen = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setPage(1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
      <PageHeader size="admin" title="Audit" sub="Every recorded action, with the acting role and source. Nothing here is ever edited or deleted." />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <SelectField label="Entity type" size="compact" fill="surface" value={entityType} onChange={filterThen(setEntityType)}>
          {entityTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </SelectField>
        <SelectField label="Source" size="compact" fill="surface" value={source} onChange={filterThen(setSource)}>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </SelectField>
        <FilterDateInput label="From" value={fromISO} onChange={filterThen(setFromISO)} />
        <FilterDateInput label="To" value={toISO} onChange={filterThen(setToISO)} />
        <span className="mono" data-shot="audit-count" style={{ fontSize: 12.5, color: neutral.mist, paddingBottom: 9 }}>{formatCount(filtered.length)} entries</span>
        {changeSetId !== null && (
          <span data-shot="audit-change-set-filter" style={{ fontSize: 12.5, color: neutral.slate, paddingBottom: 9 }}>
            Change set <span className="mono">{changeSetId}</span> ·{' '}
            <TextAction size="sm" flush onClick={() => { setChangeSetId(null); setPage(1) }}>
              Show all
            </TextAction>
          </span>
        )}
      </div>

      <TableShell label="Audit" density="dense" minWidth={900}>
          <thead>
            <tr>
              {['At', 'Action', 'Who', 'Role · source', 'Entity', 'Change set', 'Change'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <Td colSpan={7}>No matching audit entries.</Td>
              </tr>
            )}
            {shown.map((entry) => {
              const change = summariseAuditChanges(auditFieldChanges(entry, names))
              return (
                <tr key={entry.id}>
                  <Td mono nowrap>{formatAuditStamp(entry.atISO)}</Td>
                  <Td>
                    <div style={{ fontWeight: 600, color: accent.pressed }}>{actionLabel(entry.action)}</div>
                    <div className="mono" style={{ fontSize: 11, color: neutral.mist }}>{entry.action}</div>
                  </Td>
                  <Td>{entry.who}</Td>
                  <Td>{entry.role} · {entry.source}</Td>
                  <Td>
                    <div style={{ fontSize: 12 }}>{entry.entityType}</div>
                    <div className="mono" style={{ fontSize: 11, color: neutral.mist }}>{entityName(entry.entityType, entry.entityId)}</div>
                  </Td>
                  <Td mono nowrap>
                    {entry.changeSetId !== undefined && (
                      <TextAction size="sm" flush shot="audit-change-set" onClick={() => { setChangeSetId(entry.changeSetId!); setPage(1) }}>
                        {entry.changeSetId}
                      </TextAction>
                    )}
                  </Td>
                  <Td mono style={{ fontSize: 11.5, maxWidth: 300, color: neutral.slate }}>{change}</Td>
                </tr>
              )
            })}
          </tbody>
      </TableShell>
      {filtered.length > pageSize && <Pager total={filtered.length} size={pageSize} page={page} onPage={setPage} shot="audit-pager" />}
    </div>
  )
}
