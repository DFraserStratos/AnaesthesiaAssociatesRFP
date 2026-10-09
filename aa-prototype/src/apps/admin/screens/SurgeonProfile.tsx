import { useState } from 'react'
import { Link } from 'react-router-dom'
import { neutral, radius } from '../../../theme/tokens'
import { groupsForSurgeon, surgeonsInRoom } from '../../../domain/surgeons'
import { useAppStore, type Actor } from '../../../store'
import { HistorySheet } from '../../../shared/booking'
import { PairingSection, useProfileHistory } from '../components/pairing'
import { BackLink, Fact, HeaderActions, IdChip, ProfileCard, ProfileHeader, ProfilePage } from '../components/ProfileChrome'
import { SurgeonEditSheet } from '../flows/SurgeonEditSheet'
import { mastersViewPath, surgeonProfilePath } from '../mastersPaths'

/**
 * The surgeon profile (catch-up Phase 17; US-13.6.2, US-13.6.1, US-13.6.3,
 * US-13.6.4): one identified record keyed on the HPI CPN, the surgeon's room
 * and its contacts, the groups, and the office's private pairing preferences.
 * `/admin/masters/surgeons/:surgeonId`.
 */
export function SurgeonProfile({ surgeonId, actor }: { surgeonId: string; actor: Actor }) {
  const surgeon = useAppStore((s) => s.masters.surgeons[surgeonId])
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const rooms = useAppStore((s) => s.masters.surgeonRooms)
  const groups = useAppStore((s) => s.masters.surgeonGroups)
  const [editing, setEditing] = useState(false)
  const [history, setHistory] = useState(false)
  const profileHistory = useProfileHistory('surgeon', surgeonId)
  if (surgeon === undefined) return null

  const room = rooms[surgeon.roomId]
  const colleagues = room !== undefined ? surgeonsInRoom(surgeons, room.id).filter((s) => s.id !== surgeon.id) : []
  const memberOf = groupsForSurgeon(groups, surgeon.id)

  return (
    <ProfilePage shot="surgeon-profile">
      <BackLink to={mastersViewPath('surgeons')}>Surgeons</BackLink>
      <ProfileHeader
        name={surgeon.name}
        chip={<IdChip label="HPI CPN" value={surgeon.hpiId} shot="surgeon-hpi-chip" />}
        sub={[surgeon.specialty, room?.name].filter((v) => v !== undefined).join(' · ')}
        action={<HeaderActions onHistory={() => setHistory(true)} onEdit={() => setEditing(true)} />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'start' }}>
        <ProfileCard title="Identifiers" shot="surgeon-identifiers">
          <Fact label="HPI CPN" value={surgeon.hpiId} mono note="Unique index on the Health Provider Index. Not the patient's NHI." />
          <Fact
            label="NZ medical registration number"
            value={surgeon.medicalRegistrationNumber ?? <span style={{ color: neutral.mist }}>Not recorded</span>}
            mono={surgeon.medicalRegistrationNumber !== undefined}
            note="For information"
          />
        </ProfileCard>

        <ProfileCard title="Surgeons' room" shot="surgeon-room-card">
          {room === undefined ? (
            <div style={{ fontSize: 13, color: neutral.mist }}>No room recorded.</div>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{room.name}</div>
              <Fact label="Contact email" value={room.contactEmail} />
              <Fact label="Phone" value={room.phone !== '' ? room.phone : <span style={{ color: neutral.mist }}>Not recorded</span>} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: neutral.mist }}>Also in this room</div>
                {colleagues.length === 0 ? (
                  <div style={{ fontSize: 13, color: neutral.mist }}>No other surgeons.</div>
                ) : (
                  colleagues.map((c) => (
                    <Link key={c.id} to={surgeonProfilePath(c.id)} className="aa-table-entity-link" style={{ fontSize: 14 }}>
                      <span className="aa-table-entity-link-title" style={{ fontWeight: 500 }}>{c.name}</span>
                    </Link>
                  ))
                )}
              </div>
            </>
          )}
        </ProfileCard>

        <ProfileCard title="Groups" shot="surgeon-groups">
          {memberOf.length === 0 ? (
            <div style={{ fontSize: 13, color: neutral.mist }}>Not in a surgeon group.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {memberOf.map((g) => (
                <span key={g.id} data-group={g.id} style={{ fontSize: 12.5, fontWeight: 500, padding: '4px 10px', borderRadius: radius.pill, background: neutral.sunken, color: neutral.slate }}>
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </ProfileCard>
      </div>

      <PairingSection perspective="surgeon" subjectId={surgeon.id} actor={actor} />

      <HistorySheet open={history} entityIds={profileHistory.ids} entityLabels={profileHistory.labels} title="Surgeon history" onClose={() => setHistory(false)} />
      {editing && <SurgeonEditSheet surgeon={surgeon} actor={actor} onClose={() => setEditing(false)} />}
    </ProfilePage>
  )
}
