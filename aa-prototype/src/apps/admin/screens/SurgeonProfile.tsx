import { useState } from 'react'
import { neutral, radius } from '../../../theme/tokens'
import { groupsForSurgeon, NO_HPI_CPN } from '../../../domain/surgeons'
import { cleanContact, officeAddressFor } from '../../../domain/surgeonContacts'
import type { SurgeonContact } from '../../../domain/types'
import { useAppStore, type Actor } from '../../../store'
import { surgeonSpecialtyLabel } from '../../../domain/specialties'
import { Pill } from '../components/MasterPills'
import { HistorySheet } from '../../../shared/booking'
import { PairingSection, useProfileHistory } from '../components/pairing'
import { HeaderActions, IdChip, PROFILE_CARD, ProfileHeader, ProfilePage } from '../components/ProfileChrome'
import { BackLink, Card, DefList, DefRow } from '../../../shared/ui'
import { SurgeonEditSheet } from '../flows/SurgeonEditSheet'
import { mastersViewPath } from '../mastersPaths'

/**
 * The surgeon profile (catch-up Phase 17; US-13.6.2, US-13.6.3, US-13.6.4):
 * one identified record, the groups, and the office's private pairing
 * preferences. Catch-up Phase 17b (US-13.6.5; D74, D76): no surgeons' rooms;
 * one "Practice and contacts" card holds the practice name, the personal
 * contact and each office contact, the one the office's emails go to first
 * marked (`officeAddressFor`); a surgeon with no HPI CPN reads "No HPI CPN
 * yet". `/admin/masters/surgeons/:surgeonId`.
 */
export function SurgeonProfile({ surgeonId, actor }: { surgeonId: string; actor: Actor }) {
  const surgeon = useAppStore((s) => s.masters.surgeons[surgeonId])
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const groups = useAppStore((s) => s.masters.surgeonGroups)
  const specialties = useAppStore((s) => s.masters.specialties)
  const [editing, setEditing] = useState(false)
  const [history, setHistory] = useState(false)
  const profileHistory = useProfileHistory('surgeon', surgeonId)
  if (surgeon === undefined) return null

  const memberOf = groupsForSurgeon(groups, surgeon.id)
  const firstTo = officeAddressFor({ surgeons }, surgeon.id).to?.email.toLowerCase()
  const firstIndex = firstTo === undefined ? -1 : surgeon.officeContacts.findIndex((c) => cleanContact(c).email?.toLowerCase() === firstTo)

  return (
    <ProfilePage shot="surgeon-profile">
      <BackLink to={mastersViewPath('surgeons')} size="desktop">Surgeons</BackLink>
      <ProfileHeader
        name={surgeon.name}
        chip={<IdChip label="HPI CPN" value={surgeon.hpiId} empty={NO_HPI_CPN} shot="surgeon-hpi-chip" />}
        sub={[surgeonSpecialtyLabel({ specialties }, surgeon), surgeon.practiceName].filter((v) => v !== undefined && v !== '').join(' · ')}
        action={<HeaderActions onHistory={() => setHistory(true)} onEdit={() => setEditing(true)} />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'start' }}>
        <Card style={PROFILE_CARD} title="Specialties" shot="surgeon-specialties">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {surgeon.specialtyIds.filter((id) => specialties[id] !== undefined).map((id) => (
              <Pill key={id}>{specialties[id]!.name}</Pill>
            ))}
          </div>
          <div style={{ fontSize: 12, color: neutral.mist }}>From AA&apos;s specialties list. One or more, usually one.</div>
        </Card>

        <Card style={PROFILE_CARD} title="Identifiers" shot="surgeon-identifiers">
          <DefList gap={10}>
            <DefRow layout="stacked" label="HPI CPN" mono={surgeon.hpiId !== undefined} note="Unique index on the Health Provider Index. Not the patient's NHI." data-hpi={surgeon.hpiId ?? ''}>
              {surgeon.hpiId ?? <span style={{ color: neutral.mist }}>{NO_HPI_CPN}</span>}
            </DefRow>
            <DefRow layout="stacked" label="NZ medical registration number" mono={surgeon.medicalRegistrationNumber !== undefined} note="For information">
              {surgeon.medicalRegistrationNumber ?? <span style={{ color: neutral.mist }}>Not recorded</span>}
            </DefRow>
          </DefList>
        </Card>

        <Card style={PROFILE_CARD} title="Groups" shot="surgeon-groups">
          {memberOf.length === 0 ? (
            <div style={{ fontSize: 13, color: neutral.mist }}>Not in a surgeon group.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {memberOf.map((g) => (
                <Pill key={g.id} size="lg" data-group={g.id}>
                  {g.name}
                </Pill>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card style={PROFILE_CARD} title="Practice and contacts" shot="surgeon-contacts">
        <DefList gap={14}>
          <DefRow layout="stacked" label="Practice" data-practice={surgeon.practiceName ?? ''}>
            {surgeon.practiceName ?? <span style={{ color: neutral.mist }}>Not recorded</span>}
          </DefRow>
          <DefRow layout="stacked" label="Personal contact" shot="surgeon-personal-contact-card">
            <ContactLines contact={surgeon.personalContact} />
          </DefRow>
          <DefRow layout="stacked" label="Office contacts" shot="surgeon-office-contacts-card">
            {surgeon.officeContacts.length === 0 ? (
              <span style={{ color: neutral.mist }}>None held</span>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginTop: 4 }}>
                {surgeon.officeContacts.map((contact, index) => (
                  <div
                    key={index}
                    data-office-contact={index + 1}
                    style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, minWidth: 0 }}
                  >
                    <ContactLines contact={contact} />
                    {index === firstIndex && (
                      <div>
                        <Pill size="sm" shot="office-first-pill">Office emails go here first</Pill>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DefRow>
        </DefList>
      </Card>

      <PairingSection perspective="surgeon" subjectId={surgeon.id} actor={actor} />

      <HistorySheet open={history} entityIds={profileHistory.ids} entityLabels={profileHistory.labels} title="Surgeon history" onClose={() => setHistory(false)} />
      {editing && <SurgeonEditSheet surgeon={surgeon} actor={actor} onClose={() => setEditing(false)} />}
    </ProfilePage>
  )
}

/** A contact's name, mono email and phone, "Not recorded" in mist for each blank. */
function ContactLines({ contact }: { contact: SurgeonContact }) {
  const c = cleanContact(contact)
  const missing = <span style={{ color: neutral.mist }}>Not recorded</span>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: c.name !== undefined ? neutral.ink : neutral.mist }}>{c.name ?? 'No name recorded'}</span>
      <span className={c.email !== undefined ? 'mono' : undefined} style={{ fontSize: 13, overflowWrap: 'anywhere' }}>{c.email ?? missing}</span>
      <span style={{ fontSize: 13 }}>{c.phone ?? missing}</span>
    </div>
  )
}
