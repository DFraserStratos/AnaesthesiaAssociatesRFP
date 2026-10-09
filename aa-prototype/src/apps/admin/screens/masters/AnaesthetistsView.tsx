import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
import { tierFor } from '../../../../domain/pairingPreferences'
import { useAppStore, type Actor } from '../../../../store'
import { Button } from '../../../../shared'
import { EditAnaesthetistSheet } from '../../flows/EditAnaesthetistSheet'
import { AddAnaesthetistFlow } from '../../flows/AddAnaesthetistFlow'
import { TierPill, usePriorityTiers } from '../../components/pairing'
import { isInteractiveRowTarget } from '../../tableChrome'
import { EditCell, Header, Table } from './chrome'
import { rowCellStyle } from './tableStyles'
import { anaesthetistRecordPath } from '../../mastersPaths'

/**
 * Anaesthetists (catch-up Phase 17 adds the Tier column and the row that opens
 * the record). The row's "Edit" link and "Add anaesthetist" keep their names:
 * the catalogue's capture recipes click them.
 */
export function AnaesthetistsView({ actor }: { actor: Actor }) {
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const tiers = usePriorityTiers()
  const navigate = useNavigate()
  const [editId, setEditId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const rows = Object.values(anaesthetists).sort((a, b) => a.name.localeCompare(b.name))
  const editing = editId !== null ? anaesthetists[editId] : undefined

  return (
    <>
      <Header
        title="Anaesthetists"
        sub="Open an anaesthetist for their record, tier and pairing preferences. Adding one creates their sessions from their start date."
        action={<Button variant="secondary" onClick={() => setAdding(true)}>Add anaesthetist</Button>}
      />
      <Table heads={['Name', 'Reg', 'Tier', 'Unit $', 'GST', 'Phone', 'Start date', 'Active', '']} rightAlign={[8]} shot="masters-anaesthetists">
        {rows.map((a) => (
          <tr
            key={a.registrationNumber}
            className="aa-clickable-table-row"
            data-anaesthetist={a.registrationNumber}
            onClick={(event) => {
              if (!isInteractiveRowTarget(event.target)) navigate(anaesthetistRecordPath(a.registrationNumber))
            }}
          >
            <td style={rowCellStyle}>
              <Link className="aa-table-entity-link" to={anaesthetistRecordPath(a.registrationNumber)}>
                <span className="aa-table-entity-link-title">{a.name}</span>
              </Link>
            </td>
            <td className="mono" style={rowCellStyle}>{a.registrationNumber}</td>
            <td style={rowCellStyle}><TierPill tier={tierFor(tiers, a.registrationNumber)} /></td>
            <td className="mono" style={rowCellStyle}>{a.unitValue.toFixed(2)}</td>
            <td style={rowCellStyle}>{a.gstPeriod}</td>
            <td style={rowCellStyle}>{a.phone}</td>
            <td className="mono" style={rowCellStyle}>{format(parseISO(a.startDateISO), 'd MMM yyyy')}</td>
            <td style={rowCellStyle}>{a.active ? 'Yes' : 'No'}</td>
            <EditCell onClick={() => setEditId(a.registrationNumber)} style={rowCellStyle} />
          </tr>
        ))}
      </Table>
      {editing !== undefined && (
        <EditAnaesthetistSheet open anaesthetist={editing} actor={actor} onClose={() => setEditId(null)} />
      )}
      <AddAnaesthetistFlow open={adding} actor={actor} onClose={() => setAdding(false)} />
    </>
  )
}
