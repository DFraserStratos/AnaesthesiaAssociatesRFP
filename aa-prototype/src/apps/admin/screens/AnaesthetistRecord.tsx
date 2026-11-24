import { useState } from 'react'
import { neutral } from '../../../theme/tokens'
import { TIER_LABELS, TIER_VALUES, isPriorityTier } from '../../../domain/pairingPreferences'
import { useAppStore, type Actor } from '../../../store'
import { selectPriorityTier, setPriorityTier } from '../../../store/officePrivate'
import { FormError, RATE_PER_UNIT } from '../../../shared'
import { HistorySheet } from '../../../shared/booking'
import { formatCurrency, HPI_CPN_LABEL } from '../../../shared/format'
import { SlidingSegmentedControl } from '../../../shared/ui/SlidingSegmentedControl'
import { PairingSection, useProfileHistory } from '../components/pairing'
import { HeaderActions, IdChip, PROFILE_CARD, ProfileHeader, ProfilePage } from '../components/ProfileChrome'
import { BackLink, Card, DefList, DefRow } from '../../../shared/ui'
import { EditAnaesthetistSheet } from '../flows/EditAnaesthetistSheet'
import { maskBankAccount } from '../../../domain/bankAccount'
import { mastersViewPath } from '../mastersPaths'

const TIER_OPTIONS = TIER_VALUES.map((t) => ({ value: String(t), label: TIER_LABELS[t] }))

/**
 * The Admin anaesthetist record (catch-up Phase 17; US-12.1.4 Admin side,
 * US-01.3.6, US-13.6.3): the priority tier, the anaesthetist's profile and the
 * pairing preferences. The Profile card (catch-up Phase 26) shows what the
 * office holds: the rate per unit, contact, HPI CPN, the bank account (masked
 * here too; the full number only in the editor) and whether they are active.
 * The header's "Edit details" opens the one editor, `EditAnaesthetistSheet`.
 * `/admin/masters/anaesthetists/:anaesthetistId`.
 */
export function AnaesthetistRecord({ anaesthetistId, actor }: { anaesthetistId: string; actor: Actor }) {
  const anaesthetist = useAppStore((s) => s.masters.anaesthetists[anaesthetistId])
  const tier = useAppStore((s) => selectPriorityTier(s, anaesthetistId))
  const [editing, setEditing] = useState(false)
  const [tierError, setTierError] = useState<string | null>(null)
  const [history, setHistory] = useState(false)
  const profileHistory = useProfileHistory('anaesthetist', anaesthetistId)
  if (anaesthetist === undefined) return null

  function changeTier(value: string) {
    const next = Number(value)
    if (!isPriorityTier(next)) return
    const outcome = setPriorityTier(useAppStore, actor, anaesthetistId, next)
    setTierError(outcome.ok ? null : outcome.message)
  }

  return (
    <ProfilePage shot="anaesthetist-record">
      <BackLink to={mastersViewPath('anaesthetists')} size="desktop">Anaesthetists</BackLink>
      <ProfileHeader
        name={anaesthetist.name}
        chip={<IdChip label={HPI_CPN_LABEL} value={anaesthetist.hpiId} shot="anaesthetist-hpi-chip" />}
        sub={<>Registration <span className="mono">{anaesthetist.registrationNumber}</span> · {anaesthetist.active ? 'Active' : 'Inactive'}</>}
        action={<HeaderActions onHistory={() => setHistory(true)} onEdit={() => setEditing(true)} />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        <Card style={PROFILE_CARD} title="Priority tier" shot="tier-card">
          <SlidingSegmentedControl ariaLabel="Priority tier" value={String(tier)} options={TIER_OPTIONS} onSelect={changeTier} />
          <div style={{ fontSize: 12.5, color: neutral.mist }}>Only the office sees this. It orders the suggestions when you assign or move a List.</div>
          <FormError message={tierError} />
        </Card>

        <Card style={PROFILE_CARD} title="Profile" shot="anaesthetist-details">
          <DefList gap={12} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <DefRow layout="stacked" label={RATE_PER_UNIT} mono>{formatCurrency(anaesthetist.unitValue)}</DefRow>
            <DefRow layout="stacked" label="Status">{anaesthetist.active ? 'Active' : 'Inactive'}</DefRow>
            <DefRow layout="stacked" label="Phone">{anaesthetist.phone}</DefRow>
            <DefRow layout="stacked" label="Email">{anaesthetist.email}</DefRow>
            <DefRow layout="stacked" label={HPI_CPN_LABEL} mono>{anaesthetist.hpiId}</DefRow>
            <DefRow layout="stacked" label="Bank account" mono note={anaesthetist.bankAccount.accountName} shot="anaesthetist-bank-account">
              {maskBankAccount(anaesthetist.bankAccount.accountNumber)}
            </DefRow>
          </DefList>
        </Card>
      </div>

      <PairingSection perspective="anaesthetist" subjectId={anaesthetist.registrationNumber} actor={actor} />

      <HistorySheet open={history} entityIds={profileHistory.ids} entityLabels={profileHistory.labels} title="Anaesthetist history" onClose={() => setHistory(false)} />
      {editing && <EditAnaesthetistSheet open anaesthetist={anaesthetist} actor={actor} onClose={() => setEditing(false)} onRecordPage />}
    </ProfilePage>
  )
}
