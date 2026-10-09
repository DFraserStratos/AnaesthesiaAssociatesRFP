import { useState } from 'react'
import { neutral } from '../../../theme/tokens'
import { TIER_LABELS, TIER_NAMES_PROVISIONAL, TIER_VALUES, isPriorityTier } from '../../../domain/pairingPreferences'
import { useAppStore, type Actor } from '../../../store'
import { selectPriorityTier, setPriorityTier } from '../../../store/officePrivate'
import { FormError } from '../../../shared'
import { HistorySheet } from '../../../shared/booking'
import { formatCurrency } from '../../../shared/format'
import { SlidingSegmentedControl } from '../../../shared/ui/SlidingSegmentedControl'
import { PairingSection, useProfileHistory } from '../components/pairing'
import { BackLink, Fact, HeaderActions, IdChip, ProfileCard, ProfileHeader, ProfilePage } from '../components/ProfileChrome'
import { EditAnaesthetistSheet } from '../flows/EditAnaesthetistSheet'
import { GST_OPTIONS } from '../flows/fieldChrome'
import { mastersViewPath } from '../mastersPaths'

const TIER_OPTIONS = TIER_VALUES.map((t) => ({ value: String(t), label: TIER_LABELS[t] }))

/**
 * The Admin anaesthetist record (catch-up Phase 17; US-12.1.4 Admin side,
 * US-01.3.6, US-13.6.3): the details the office keeps, the priority tier and
 * the pairing preferences. Built lean: Phase 26 adds the profile fields (bank
 * details, GST number, prepaid settings) here.
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

  const gstLabel = GST_OPTIONS.find((o) => o.value === anaesthetist.gstPeriod)?.label ?? anaesthetist.gstPeriod

  return (
    <ProfilePage shot="anaesthetist-record">
      <BackLink to={mastersViewPath('anaesthetists')}>Anaesthetists</BackLink>
      <ProfileHeader
        name={anaesthetist.name}
        chip={anaesthetist.hpiId !== '' ? <IdChip label="HPI CPN" value={anaesthetist.hpiId} shot="anaesthetist-hpi-chip" /> : <span style={{ fontSize: 12.5, color: neutral.mist }}>HPI CPN not set</span>}
        sub={<>Registration <span className="mono">{anaesthetist.registrationNumber}</span> · {anaesthetist.active ? 'Active' : 'Inactive'}</>}
        action={<HeaderActions onHistory={() => setHistory(true)} onEdit={() => setEditing(true)} />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        <ProfileCard title="Priority tier" shot="tier-card">
          <SlidingSegmentedControl ariaLabel="Priority tier" value={String(tier)} options={TIER_OPTIONS} onSelect={changeTier} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 12.5, color: neutral.mist }}>Only the office sees this. It orders the suggestions when you assign or move a List.</div>
            {TIER_NAMES_PROVISIONAL && <div style={{ fontSize: 12.5, color: neutral.mist }}>Tier names are provisional.</div>}
          </div>
          <FormError message={tierError} />
        </ProfileCard>

        <ProfileCard title="Details" shot="anaesthetist-details">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Fact label="Unit value" value={formatCurrency(anaesthetist.unitValue)} mono />
            <Fact label="Phone" value={anaesthetist.phone} />
            <Fact label="Email" value={anaesthetist.email} />
            <Fact label="GST period" value={gstLabel} />
          </div>
        </ProfileCard>
      </div>

      <PairingSection perspective="anaesthetist" subjectId={anaesthetist.registrationNumber} actor={actor} />

      <HistorySheet open={history} entityIds={profileHistory.ids} entityLabels={profileHistory.labels} title="Anaesthetist history" onClose={() => setHistory(false)} />
      {editing && <EditAnaesthetistSheet open anaesthetist={anaesthetist} actor={actor} onClose={() => setEditing(false)} onRecordPage />}
    </ProfilePage>
  )
}
