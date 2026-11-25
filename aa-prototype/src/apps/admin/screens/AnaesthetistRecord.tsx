import { useState } from 'react'
import { useAppStore, useToday, type Actor } from '../../../store'
import { statusOn } from '../../../domain/anaesthetistStatus'
import { HistorySheet } from '../../../shared/booking'
import { anaesthetistStatusLabel, HPI_CPN_LABEL } from '../../../shared/format'
import { PairingSection, useProfileHistory } from '../components/pairing'
import { RateTierCard } from '../components/RateTierCard'
import { AnaesthetistStatusCard } from '../components/AnaesthetistStatusCard'
import { AnaesthetistHistoryCard } from '../components/AnaesthetistHistoryCard'
import { HeaderActions, IdChip, PROFILE_FACTS, PROFILE_GRID, PROFILE_WIDE_CARD, ProfilePage } from '../components/ProfileChrome'
import { Card, DefList, DefRow } from '../../../shared/ui'
import { EditAnaesthetistSheet } from '../flows/EditAnaesthetistSheet'
import { maskBankAccount } from '../../../domain/bankAccount'
import { peoplePath } from '../peoplePaths'

/**
 * The Admin anaesthetist record (catch-up Phase 17; US-12.1.4 Admin side,
 * US-01.3.6, US-13.6.3): the rate and tier card, the anaesthetist's profile and
 * the pairing preferences. `RateTierCard` (build plan Phase 50) holds the rate
 * per unit and the priority tier, edited together and saved as one change. The
 * Profile card (catch-up Phase 26) shows the rest the office holds: contact,
 * HPI CPN, the bank account (masked here too; the full number only in the
 * editor). The header's "Edit details" opens `EditAnaesthetistSheet` for those.
 * Build plan Phase 52: `AnaesthetistStatusCard` (active, a last day ahead, or
 * inactive, with Make inactive, Clear last day and Make active) beside it, and
 * `AnaesthetistHistoryCard` (past Lists, the ledger link) under the Profile.
 * `/admin/people/anaesthetists/:anaesthetistId`.
 */
export function AnaesthetistRecord({ anaesthetistId, actor }: { anaesthetistId: string; actor: Actor }) {
  const anaesthetist = useAppStore((s) => s.masters.anaesthetists[anaesthetistId])
  const todayISO = useToday()
  const [editing, setEditing] = useState(false)
  const [history, setHistory] = useState(false)
  const profileHistory = useProfileHistory('anaesthetist', anaesthetistId)
  if (anaesthetist === undefined) return null

  return (
    <ProfilePage
      shot="anaesthetist-record"
      back={{ label: 'Anaesthetists', to: peoplePath('anaesthetists') }}
      name={anaesthetist.name}
      chip={<IdChip label={HPI_CPN_LABEL} value={anaesthetist.hpiId} shot="anaesthetist-hpi-chip" />}
      sub={<>Registration <span className="mono">{anaesthetist.registrationNumber}</span> · <span data-shot="anaesthetist-status-sub">{anaesthetistStatusLabel(statusOn(anaesthetist, todayISO))}</span></>}
      action={<HeaderActions onHistory={() => setHistory(true)} onEdit={() => setEditing(true)} />}
    >
      <div style={PROFILE_GRID}>
        <RateTierCard anaesthetistId={anaesthetistId} actor={actor} />
        <AnaesthetistStatusCard anaesthetistId={anaesthetistId} actor={actor} />

        <Card style={PROFILE_WIDE_CARD} title="Profile" shot="anaesthetist-details">
          <DefList gap={12} style={PROFILE_FACTS}>
            <DefRow layout="stacked" label="Phone">{anaesthetist.phone}</DefRow>
            <DefRow layout="stacked" label="Email">{anaesthetist.email}</DefRow>
            <DefRow layout="stacked" label={HPI_CPN_LABEL} mono>{anaesthetist.hpiId}</DefRow>
            <DefRow layout="stacked" label="Bank account" mono note={anaesthetist.bankAccount.accountName} shot="anaesthetist-bank-account">
              {maskBankAccount(anaesthetist.bankAccount.accountNumber)}
            </DefRow>
          </DefList>
        </Card>
        <AnaesthetistHistoryCard anaesthetistId={anaesthetistId} />
      </div>

      <PairingSection perspective="anaesthetist" subjectId={anaesthetist.registrationNumber} actor={actor} />

      <HistorySheet open={history} entityIds={profileHistory.ids} entityLabels={profileHistory.labels} title="Anaesthetist history" onClose={() => setHistory(false)} />
      {editing && <EditAnaesthetistSheet open anaesthetist={anaesthetist} actor={actor} onClose={() => setEditing(false)} onRecordPage />}
    </ProfilePage>
  )
}
