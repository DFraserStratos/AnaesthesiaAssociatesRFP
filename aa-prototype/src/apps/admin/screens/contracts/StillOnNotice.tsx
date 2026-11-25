/**
 * The Procedures still on a Contract from a day (catch-up Phase 25a, D79;
 * moved out of the Contract panel in build plan Phase 45): "2 Procedures dated
 * on or after Sat 1 Aug are still on Face lift. Nothing moves by itself: open
 * each to move it." Over the shared `ContractChangeNotice`. The Disable
 * confirm lists them from `disableFromISO`; the create panel's Replaces
 * section from its From date (until 46); Phase 49's late disable from the
 * change date.
 */

import { NOTHING_MOVES, stillOnTitle, type StillOnRow } from '../../../../domain/billing/contractChanges'
import { shortDay } from '../../../../domain/dateText'
import { useAppStore } from '../../../../store'
import { ContractChangeNotice, type ChangeNoticeRow } from '../../flows/ContractChangeNotice'
import { listShortLabel } from '../../util'

export function StillOnNotice({ rows, fromISO, contractName, live = false }: { rows: readonly StillOnRow[]; fromISO: string; contractName: string; live?: boolean }) {
  const lists = useAppStore((s) => s.schedule.lists)
  const masters = useAppStore((s) => s.masters)
  const noticeRows: ChangeNoticeRow[] = rows.map((r) => {
    const list = lists[r.listId]
    return {
      key: r.procedureId,
      bookingId: r.bookingId,
      dateISO: r.dateISO,
      patientName: r.patientName,
      cells: [shortDay(r.dateISO), list !== undefined ? listShortLabel(list, masters) : r.listId, r.procedureText ?? ''],
    }
  })
  return (
    <ContractChangeNotice
      title={stillOnTitle(rows.length, shortDay(fromISO), contractName)}
      columns={[{ label: 'Date', mono: true }, { label: 'List' }, { label: 'Procedure' }]}
      rows={noticeRows}
      shot="contract-still-on-warning"
      rowShot="contract-still-on-row"
      live={live}
    >
      {NOTHING_MOVES}
    </ContractChangeNotice>
  )
}
