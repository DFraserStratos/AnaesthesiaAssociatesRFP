import { useMemo, useState } from 'react'
import { deletePublicHoliday, listsFlaggedByPublicHoliday, useAppStore, type Actor } from '../../../../store'
import { FormError } from '../../../../shared'
import { EmptyState, ResultLine, TextAction } from '../../../../shared/ui'
import { ConfirmSheet } from '../../../../shared/surface'
import { TableShell, Td, Th } from '../../../../shared/table'
import { dayWithYear, plural, shortDay } from '../../../../shared/format'
import type { Hospital, PublicHoliday } from '../../../../domain/types'
import { PublicHolidaySheet } from '../../flows/PublicHolidaySheet'
import { MasterHeader } from './chrome'

/** "National", or "Regional · Canterbury". */
function publicHolidayKindText(p: Pick<PublicHoliday, 'kind' | 'region'>): string {
  if (p.kind === 'national') return 'National'
  return p.region !== undefined && p.region !== '' ? `Regional · ${p.region}` : 'Regional'
}

/** "All hospitals", or "All except Christchurch Public". */
function publicHolidayAppliesText(p: Pick<PublicHoliday, 'openHospitalIds'>, hospitals: Readonly<Record<string, Hospital>>): string {
  if (p.openHospitalIds.length === 0) return 'All hospitals'
  return `All except ${p.openHospitalIds.map((id) => hospitals[id]?.name ?? id).join(', ')}`
}

/**
 * Master data, Public holidays (catch-up Phase 42; DM-38, US-13.4.1): the
 * master calendar of national and regional public holidays. Each closes every
 * hospital not listed open that day, and the one conflict rule flags its
 * Lists. Add, edit and delete are the office's; a row referenced by nothing
 * keeps its delete, behind a confirmation that states how many flags clear.
 */
export function PublicHolidaysView({ actor }: { actor: Actor }) {
  const publicHolidays = useAppStore((s) => s.masters.publicHolidays)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const schedule = useAppStore((s) => s.schedule)
  const [sheet, setSheet] = useState<{ id?: string } | null>(null)
  const [confirm, setConfirm] = useState<PublicHoliday | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rows = useMemo(() => Object.values(publicHolidays).sort((a, b) => a.dateISO.localeCompare(b.dateISO)), [publicHolidays])
  const flagged = useMemo(() => new Map(rows.map((p) => [p.id, listsFlaggedByPublicHoliday({ schedule }, p.id)])), [rows, schedule])

  function remove(p: PublicHoliday) {
    const out = deletePublicHoliday(useAppStore, actor, p.id)
    setConfirm(null)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    setResult(`Public holiday deleted. ${plural(out.value.resolved, 'flag')} cleared.`)
  }

  function openSheet(id?: string) {
    setError(null)
    setResult(null)
    setSheet(id !== undefined ? { id } : {})
  }

  const confirmCount = confirm !== null ? (flagged.get(confirm.id) ?? 0) : 0

  return (
    <div data-shot="masters-public-holidays" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <MasterHeader
        title="Public holidays"
        sub="The national and regional public holidays. Every hospital not listed open that day is closed, and its Lists are flagged."
        add={{ label: 'Add public holiday', onClick: () => openSheet() }}
      />
      <ResultLine line={result} shot="public-holiday-result" onDismiss={() => setResult(null)} />
      <FormError message={error} />
      {rows.length === 0 ? (
        <EmptyState variant="card" title="No public holidays">Add one to close the hospitals on that day.</EmptyState>
      ) : (
        <TableShell density="dense" label="Public holidays">
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Name</Th>
              <Th>Kind</Th>
              <Th>Applies to</Th>
              <Th align="right">Lists affected</Th>
              <Th align="right" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} data-public-holiday={p.id}>
                <Td mono nowrap>{dayWithYear(p.dateISO)}</Td>
                <Td bold>{p.name}</Td>
                <Td>{publicHolidayKindText(p)}</Td>
                <Td>{publicHolidayAppliesText(p, hospitals)}</Td>
                <Td mono align="right">{flagged.get(p.id) ?? 0}</Td>
                <Td align="right" nowrap>
                  <span style={{ display: 'inline-flex', gap: 12 }}>
                    <TextAction size="sm" flush onClick={() => openSheet(p.id)} label={`Edit ${p.name}`}>Edit</TextAction>
                    <TextAction size="sm" flush onClick={() => { setResult(null); setConfirm(p) }} label={`Delete ${p.name}`}>Delete</TextAction>
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      <PublicHolidaySheet
        open={sheet !== null}
        actor={actor}
        {...(sheet?.id !== undefined ? { publicHolidayId: sheet.id } : {})}
        onClose={() => setSheet(null)}
        onDone={setResult}
      />
      <ConfirmSheet
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title="Delete this public holiday?"
        description={confirm !== null ? `Deleting ${confirm.name} on ${shortDay(confirm.dateISO)} clears ${plural(confirmCount, 'flagged List')}.` : undefined}
        confirmLabel="Delete public holiday"
        cancelLabel="Keep it"
        onConfirm={() => {
          if (confirm !== null) remove(confirm)
        }}
        shot="public-holiday-delete-confirm"
      />
    </div>
  )
}
