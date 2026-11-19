import { useState } from 'react'
import { neutral } from '../../../../theme/tokens'
import { formatGstNumber } from '../../../../domain/billing/invoicePresentation'
import { maskBankAccount } from '../../../../domain/bankAccount'
import { format, parseISO } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
import { tierFor } from '../../../../domain/pairingPreferences'
import { useAppStore, type Actor } from '../../../../store'
import { EditAnaesthetistSheet } from '../../flows/EditAnaesthetistSheet'
import { AddAnaesthetistFlow } from '../../flows/AddAnaesthetistFlow'
import { TierPill, usePriorityTiers } from '../../components/pairing'
import { ClickableRow } from '../../../../shared/table'
import { EditCell, MasterHeader, MasterTable } from './chrome'
import { rowCellStyle } from './tableStyles'
import { anaesthetistRecordPath } from '../../mastersPaths'

/**
 * Anaesthetists (catch-up Phase 17 adds the Tier column and the row that opens
 * the record; Phase 26 the HPI CPN, the masked bank account and the email, and
 * drops the GST period). Unit $ stays the third column: recipes highlight it. The row's "Edit" link and "Add anaesthetist" keep their names:
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
      <MasterHeader
        title="Anaesthetists"
        sub="Open an anaesthetist for their record, tier and pairing preferences. Adding one creates their sessions from their start date."
        add={{ label: 'Add anaesthetist', onClick: () => setAdding(true) }}
      />
      <MasterTable columns={['Name', 'Reg', 'Unit $', 'Tier', 'HPI CPN', 'Bank account', 'GST number', 'Phone', 'Email', 'Start date', 'Active', '']} rightAlign={[11]} shot="masters-anaesthetists" label="Anaesthetists">
        {rows.map((a) => (
          <ClickableRow
            key={a.registrationNumber}
            data-anaesthetist={a.registrationNumber}
            onOpen={() => navigate(anaesthetistRecordPath(a.registrationNumber))}
          >
            <td style={rowCellStyle}>
              <Link className="aa-table-entity-link" to={anaesthetistRecordPath(a.registrationNumber)}>
                <span className="aa-table-entity-link-title">{a.name}</span>
              </Link>
            </td>
            <td className="mono" style={rowCellStyle}>{a.registrationNumber}</td>
            <td className="mono" style={rowCellStyle}>{a.unitValue.toFixed(2)}</td>
            <td style={rowCellStyle}><TierPill tier={tierFor(tiers, a.registrationNumber)} /></td>
            <td className="mono" style={rowCellStyle}>{a.hpiId}</td>
            <td data-shot="anaesthetist-bank" className="mono" style={{ ...rowCellStyle, whiteSpace: 'nowrap' }}>{maskBankAccount(a.bankAccount.accountNumber)}</td>
            <td data-shot="anaesthetist-gst-number" className={a.gstNumber !== undefined ? 'mono' : undefined} style={{ ...rowCellStyle, whiteSpace: 'nowrap', ...(a.gstNumber === undefined ? { color: neutral.mist } : {}) }}>
              {a.gstNumber !== undefined ? formatGstNumber(a.gstNumber) : 'Not held'}
            </td>
            <td style={{ ...rowCellStyle, whiteSpace: 'nowrap' }}>{a.phone}</td>
            <td style={rowCellStyle}>{a.email}</td>
            <td className="mono" style={rowCellStyle}>{format(parseISO(a.startDateISO), 'd MMM yyyy')}</td>
            <td style={rowCellStyle}>{a.active ? 'Yes' : 'No'}</td>
            <EditCell onClick={() => setEditId(a.registrationNumber)} style={rowCellStyle} />
          </ClickableRow>
        ))}
      </MasterTable>
      {editing !== undefined && (
        <EditAnaesthetistSheet open anaesthetist={editing} actor={actor} onClose={() => setEditId(null)} />
      )}
      <AddAnaesthetistFlow open={adding} actor={actor} onClose={() => setAdding(false)} />
    </>
  )
}
