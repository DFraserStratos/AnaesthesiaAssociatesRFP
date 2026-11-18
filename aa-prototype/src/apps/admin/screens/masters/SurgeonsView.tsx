import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { neutral } from '../../../../theme/tokens'
import { pairingCounts } from '../../../../domain/pairingPreferences'
import { compareBySurname, NO_HPI_CPN } from '../../../../domain/surgeons'
import { officeAddressFor } from '../../../../domain/surgeonContacts'
import type { Surgeon, SurgeonGroup } from '../../../../domain/types'
import { useAppStore, type Actor } from '../../../../store'
import { surgeonSpecialtyLabel } from '../../../../domain/specialties'
import { Button } from '../../../../shared'
import { SurgeonEditSheet } from '../../flows/SurgeonEditSheet'
import { SurgeonGroupSheet } from '../../flows/SurgeonGroupSheet'
import { NotPreferredPill, PreferredPill, usePairingEntries } from '../../components/pairing'
import { isInteractiveRowTarget } from '../../tableChrome'
import { EditCell, Header, Table } from './chrome'
import { rowCellStyle } from './tableStyles'
import { surgeonProfilePath } from '../../mastersPaths'

/**
 * Surgeons and Surgeon groups (catch-up Phase 17; US-13.4.1, US-13.6.2).
 * Editable by the office; a surgeon row opens the profile. No delete or
 * deactivate here (Phase 42). Catch-up Phase 17b (D74, OQ-126): no surgeons'
 * rooms; the surgeon list is AA's address book of surgeons, showing each
 * surgeon's practice, the office contact the office's emails go to first
 * (`officeAddressFor`) and the HPI CPN or "No HPI CPN yet".
 */

const mist = { color: neutral.mist }

function SurgeonLink({ id, name }: { id: string; name: string }) {
  return (
    <Link className="aa-table-entity-link" to={surgeonProfilePath(id)} style={{ color: 'inherit' }}>
      <span className="aa-table-entity-link-title" style={{ fontWeight: 500 }}>{name}</span>
    </Link>
  )
}

export function SurgeonsView({ actor }: { actor: Actor }) {
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const specialties = useAppStore((s) => s.masters.specialties)
  const entries = usePairingEntries()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<{ surgeon?: Surgeon } | null>(null)
  const rows = Object.values(surgeons).sort(compareBySurname)

  return (
    <>
      <Header
        title="Surgeons"
        sub="AA's address book of surgeons. Open a surgeon for their contacts, groups and pairing preferences."
        action={<Button variant="secondary" onClick={() => setSheet({})}>Add surgeon</Button>}
      />
      <Table heads={['Name', 'Specialties', 'Practice', 'Office contact', 'HPI CPN', 'Pairings', '']} rightAlign={[6]} shot="masters-surgeons">
        {rows.map((s) => {
          const counts = pairingCounts(entries, { surgeonId: s.id })
          const to = officeAddressFor({ surgeons }, s.id).to
          return (
            <tr
              key={s.id}
              data-surgeon={s.id}
              data-practice={s.practiceName ?? ''}
              data-hpi={s.hpiId ?? ''}
              className="aa-clickable-table-row"
              onClick={(event) => {
                if (!isInteractiveRowTarget(event.target)) navigate(surgeonProfilePath(s.id))
              }}
            >
              <td style={rowCellStyle}><SurgeonLink id={s.id} name={s.name} /></td>
              <td style={rowCellStyle}>{surgeonSpecialtyLabel({ specialties }, s)}</td>
              <td style={rowCellStyle}>{s.practiceName ?? <span style={mist}>Not recorded</span>}</td>
              <td style={rowCellStyle} data-office-to={to?.email ?? ''}>
                {to === null ? (
                  <span style={mist}>None held</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                    {to.name !== undefined && <span>{to.name}</span>}
                    <span className="mono" style={{ fontSize: 12.5, color: neutral.slate, overflowWrap: 'anywhere' }}>{to.email}</span>
                  </div>
                )}
              </td>
              <td style={{ ...rowCellStyle, whiteSpace: 'nowrap' }}>{s.hpiId !== undefined ? <span className="mono">{s.hpiId}</span> : <span style={mist}>{NO_HPI_CPN}</span>}</td>
              <td style={rowCellStyle}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {counts.NOT_PREFERRED > 0 && <NotPreferredPill count={counts.NOT_PREFERRED} />}
                  {counts.PREFERRED > 0 && <PreferredPill count={counts.PREFERRED} />}
                  {counts.NOT_PREFERRED === 0 && counts.PREFERRED === 0 && <span style={mist}>·</span>}
                </div>
              </td>
              <EditCell onClick={() => setSheet({ surgeon: s })} label={`Edit ${s.name}`} style={rowCellStyle} />
            </tr>
          )
        })}
      </Table>
      {sheet !== null && <SurgeonEditSheet key={sheet.surgeon?.id ?? 'new'} surgeon={sheet.surgeon} actor={actor} onClose={() => setSheet(null)} />}
    </>
  )
}

export function SurgeonGroupsView({ actor }: { actor: Actor }) {
  const groups = useAppStore((s) => s.masters.surgeonGroups)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const [sheet, setSheet] = useState<{ group?: SurgeonGroup } | null>(null)
  const rows = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <Header
        title="Surgeon groups"
        sub="Surgeons who work as a group. A group that holds Contracts is a Party; its Contracts link the surgeons they are offered for."
        action={<Button variant="secondary" onClick={() => setSheet({})}>Add group</Button>}
      />
      <Table heads={['Name', 'Members', 'Description', '']} rightAlign={[3]} shot="masters-surgeon-groups">
        {rows.map((g) => {
          const members = g.memberSurgeonIds.map((id) => surgeons[id]).filter((s) => s !== undefined).sort(compareBySurname)
          return (
            <tr key={g.id} data-group={g.id}>
              <td style={{ ...rowCellStyle, fontWeight: 600 }}>{g.name}</td>
              <td style={rowCellStyle}>
                {members.length === 0 ? (
                  <span style={mist}>No members</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 12, rowGap: 2 }}>
                    {members.map((m) => <SurgeonLink key={m.id} id={m.id} name={m.name} />)}
                  </div>
                )}
              </td>
              <td style={rowCellStyle}>{g.description ?? <span style={mist}>·</span>}</td>
              <EditCell onClick={() => setSheet({ group: g })} label={`Edit ${g.name}`} style={rowCellStyle} />
            </tr>
          )
        })}
      </Table>
      {sheet !== null && <SurgeonGroupSheet key={sheet.group?.id ?? 'new'} group={sheet.group} actor={actor} onClose={() => setSheet(null)} />}
    </>
  )
}
