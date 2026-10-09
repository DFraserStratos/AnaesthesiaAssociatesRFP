import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { neutral } from '../../../../theme/tokens'
import { pairingCounts } from '../../../../domain/pairingPreferences'
import { compareBySurname, surgeonsInRoom } from '../../../../domain/surgeons'
import type { Surgeon, SurgeonGroup, SurgeonRoom } from '../../../../domain/types'
import { useAppStore, type Actor } from '../../../../store'
import { Button } from '../../../../shared'
import { SurgeonEditSheet } from '../../flows/SurgeonEditSheet'
import { SurgeonRoomSheet } from '../../flows/SurgeonRoomSheet'
import { SurgeonGroupSheet } from '../../flows/SurgeonGroupSheet'
import { NotPreferredPill, PreferredPill, usePairingEntries } from '../../components/pairing'
import { isInteractiveRowTarget } from '../../tableChrome'
import { EditCell, Header, Table } from './chrome'
import { rowCellStyle } from './tableStyles'
import { surgeonProfilePath } from '../../mastersPaths'

/**
 * Surgeons, Surgeons' rooms and Surgeon groups (catch-up Phase 17; US-13.4.1,
 * US-13.6.1, US-13.6.2). Editable by the office; a surgeon row opens the
 * profile. No delete or deactivate here (Phase 42).
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
  const rooms = useAppStore((s) => s.masters.surgeonRooms)
  const entries = usePairingEntries()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<{ surgeon?: Surgeon } | null>(null)
  const rows = Object.values(surgeons).sort(compareBySurname)

  return (
    <>
      <Header
        title="Surgeons"
        sub="One record per surgeon, keyed on the HPI CPN. Open a surgeon for their room, groups and pairing preferences."
        action={<Button variant="secondary" onClick={() => setSheet({})}>Add surgeon</Button>}
      />
      <Table heads={['Name', 'Specialty', 'Room', 'HPI CPN', 'Pairings', '']} rightAlign={[5]} shot="masters-surgeons">
        {rows.map((s) => {
          const counts = pairingCounts(entries, { surgeonId: s.id })
          return (
            <tr
              key={s.id}
              data-surgeon={s.id}
              className="aa-clickable-table-row"
              onClick={(event) => {
                if (!isInteractiveRowTarget(event.target)) navigate(surgeonProfilePath(s.id))
              }}
            >
              <td style={rowCellStyle}><SurgeonLink id={s.id} name={s.name} /></td>
              <td style={rowCellStyle}>{s.specialty ?? <span style={mist}>·</span>}</td>
              <td style={rowCellStyle}>{rooms[s.roomId]?.name ?? s.roomId}</td>
              <td className="mono" style={rowCellStyle}>{s.hpiId}</td>
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

export function SurgeonRoomsView({ actor }: { actor: Actor }) {
  const rooms = useAppStore((s) => s.masters.surgeonRooms)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const [sheet, setSheet] = useState<{ room?: SurgeonRoom } | null>(null)
  const rows = Object.values(rooms).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <Header
        title="Surgeons' rooms"
        sub="Each room holds its contact email, phone and surgeons. A surgeon joins a room from their own record."
        action={<Button variant="secondary" onClick={() => setSheet({})}>Add room</Button>}
      />
      <Table heads={['Name', 'Contact email', 'Phone', 'Surgeons', '']} rightAlign={[4]} shot="masters-surgeon-rooms">
        {rows.map((r) => {
          const members = surgeonsInRoom(surgeons, r.id)
          return (
            <tr key={r.id} data-room={r.id}>
              <td style={{ ...rowCellStyle, fontWeight: 600 }}>{r.name}</td>
              <td style={rowCellStyle}>{r.contactEmail}</td>
              <td style={{ ...rowCellStyle, whiteSpace: 'nowrap' }}>{r.phone !== '' ? r.phone : <span style={mist}>·</span>}</td>
              <td style={rowCellStyle}>
                {members.length === 0 ? (
                  <span style={mist}>No surgeons yet</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 12, rowGap: 2 }}>
                    {members.map((m) => <SurgeonLink key={m.id} id={m.id} name={m.name} />)}
                  </div>
                )}
              </td>
              <EditCell onClick={() => setSheet({ room: r })} label={`Edit ${r.name}`} style={rowCellStyle} />
            </tr>
          )
        })}
      </Table>
      {sheet !== null && <SurgeonRoomSheet key={sheet.room?.id ?? 'new'} room={sheet.room} actor={actor} onClose={() => setSheet(null)} />}
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
        sub="Surgeons who work as a group. A group can hold a contract once contract holders are reworked."
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
