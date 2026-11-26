/**
 * What Add NHI did (build plan Phase 72; US-11.1.5, US-02.6.3), shown as the Add NHI sheet's last step:
 * - resolved: the Booking took the stub's place, "<Patient> is now on Dr X's List", with the List one click away;
 * - needsDecision: the row has its NHI and has left Needs NHI, but the office decides it with its arrival (another
 *   List suggested, differences to review, a refused create): the reason, and a link to the row under its own kind.
 *
 * Hooks: `add-nhi-done` on the resolved notice, `add-nhi-needs-decision` on the other, `add-nhi-open-row` on its link.
 */

import { useNavigate } from 'react-router-dom'
import { useAppStore, type AddNhiResult } from '../../../../../../store'
import { arrivalKeyForRow } from '../../../../../../store/intakeSelectors'
import { Notice, TextAction } from '../../../../../../shared/ui'
import { space } from '../../../../../../theme/tokens'
import { arrivalsPath } from '../../intakePaths'
import { addedLine, useListDayLink, useListOwner } from './waitingRow'

export function AddNhiOutcome({ result, rowId, patientName, onClose }: { result: AddNhiResult; rowId: string; patientName: string; onClose: () => void }) {
  const navigate = useNavigate()
  const listId = result.kind === 'resolved' ? result.listId : undefined
  const owner = useListOwner(listId)
  const link = useListDayLink(listId)

  if (result.kind === 'resolved') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
        <Notice tone="success" live="status" shot="add-nhi-done">{addedLine(patientName, owner)}</Notice>
        {link !== undefined && (
          <span>
            <TextAction size="md" flush to={link.to} linkState={link.state} shot="add-nhi-open-list" onClick={onClose}>
              Open the List
            </TextAction>
          </span>
        )}
      </div>
    )
  }

  const openRow = () => {
    const item = arrivalKeyForRow(useAppStore.getState(), rowId)
    onClose()
    navigate(arrivalsPath(item !== undefined ? { item } : {}))
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
      <Notice tone="neutral" live="status" shot="add-nhi-needs-decision">
        {result.kind === 'needsDecision' ? result.reason : 'The row is decided.'}
      </Notice>
      {result.kind === 'needsDecision' && (
        <span>
          <TextAction size="md" flush onClick={openRow} shot="add-nhi-open-row" label={`Open ${patientName}'s row with its arrival`}>
            Open the row
          </TextAction>
        </span>
      )}
    </div>
  )
}
