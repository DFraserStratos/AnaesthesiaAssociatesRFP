import { contractLabel } from '../../../shared/contracts'
import { useMemo, useState } from 'react'
import { accent, neutral } from '../../../theme/tokens'
import { useAppStore } from '../../../store'
import {
  actionLabel,
  auditFieldChanges,
  auditNamesFor,
  formatAuditStamp,
  sortAuditNewestFirst,
  summariseAuditChanges,
} from '../../../shared/audit'
import { FilterDateInput, PageHeader, SelectField } from '../../../shared/ui'
import { TableShell, Td, Th } from '../../../shared/table'


const SOURCES = ['all', 'anaesthetist', 'office', 'integration', 'system', 'demo'] as const

const CAP = 500

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
 * Booking history sheet, where someone is reading a single record; a 500-row feed
 * has to stay scannable.
 *
 * Unlike the Booking sheet, this surface never collapses `Role · source` and never
 * coalesces consecutive edits: the compliance view stays explicit and one stored
 * entry stays one row.
 */
export function AuditViewer() {
  const audit = useAppStore((s) => s.audit)
  const contracts = useAppStore((s) => s.masters.contracts)
  const parties = useAppStore((s) => s.masters.parties)
  const specialties = useAppStore((s) => s.masters.specialties)
  const fundingTags = useAppStore((s) => s.masters.fundingTags)
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const names = useMemo(() => auditNamesFor({ rvgGroups }), [rvgGroups])
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
    return id
  }
  const [source, setSource] = useState('all')
  const [fromISO, setFromISO] = useState('')
  const [toISO, setToISO] = useState('')

  const entityTypes = useMemo(() => ['all', ...Array.from(new Set(audit.map((a) => a.entityType))).sort()], [audit])

  const filtered = useMemo(() => {
    const rows = audit.filter((a) => {
      if (entityType !== 'all' && a.entityType !== entityType) return false
      if (source !== 'all' && a.source !== source) return false
      const date = a.atISO.slice(0, 10)
      if (fromISO !== '' && date < fromISO) return false
      if (toISO !== '' && date > toISO) return false
      return true
    })
    // Sorted on `atISO` (id as the tiebreak), not insertion order — the same
    // shared sort the Booking history sheet uses, so the two agree (finding 01.3).
    return sortAuditNewestFirst(rows)
  }, [audit, entityType, source, fromISO, toISO])

  const shown = filtered.slice(0, CAP)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
      <PageHeader size="admin" title="Audit" sub="Every recorded action, with the acting role and source. Nothing here is ever edited or deleted." />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <SelectField label="Entity type" size="compact" fill="surface" value={entityType} onChange={setEntityType}>
          {entityTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </SelectField>
        <SelectField label="Source" size="compact" fill="surface" value={source} onChange={setSource}>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </SelectField>
        <FilterDateInput label="From" value={fromISO} onChange={setFromISO} />
        <FilterDateInput label="To" value={toISO} onChange={setToISO} />
        <span style={{ fontSize: 12.5, color: neutral.mist, paddingBottom: 9 }}>{filtered.length} entries</span>
      </div>

      <TableShell label="Audit" density="dense" minWidth={900}>
          <thead>
            <tr>
              {['At', 'Action', 'Who', 'Role · source', 'Entity', 'Change'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <Td colSpan={6}>No matching audit entries.</Td>
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
                  <Td mono style={{ fontSize: 11.5, maxWidth: 300, color: neutral.slate }}>{change}</Td>
                </tr>
              )
            })}
          </tbody>
      </TableShell>
      {filtered.length > CAP && (
        <div style={{ fontSize: 12, color: neutral.mist }}>Showing the {CAP} most recent of {filtered.length} matching entries. Narrow the filters to see older ones.</div>
      )}
    </div>
  )
}
