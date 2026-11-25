import { neutral } from '../../../theme/tokens'
import { parseAmount } from '../../../domain/billing/money'
import { TIER_LABELS, TIER_VALUES, isPriorityTier } from '../../../domain/pairingPreferences'
import { UNIT_VALUE_INVALID, editAnaesthetist, useAppStore, withChangeSet, type Actor } from '../../../store'
import { selectPriorityTier, setPriorityTier } from '../../../store/officePrivate'
import { RATE_LABEL, RATE_PER_UNIT } from '../../../shared/profile/profileCopy'
import { amountInputText, formatCurrency } from '../../../shared/format'
import { DefList, DefRow, EditableCard, FieldHint, Segmented, TextField, useCardEdit, type CardCommit } from '../../../shared/ui'
import { PROFILE_CARD } from './ProfileChrome'

const TIER_OPTIONS = TIER_VALUES.map((t) => ({ value: String(t), label: TIER_LABELS[t] }))

/** At rest the two facts sit side by side (people-section.html #tier, "Proposed, at rest"). */
const AT_REST_FACTS = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } as const

const RATE_HINT = 'The dollar value per RVG unit. The anaesthetist can change it too.'
const TIER_HINT = 'Orders suggestions when the office assigns or moves a List. Never shown to anaesthetists.'

interface Draft {
  rate: string
  tier: string
}

/**
 * The anaesthetist's rate per unit and priority tier on one card (build plan Phase 50; US-01.3.6,
 * DM-09, D102; docs/explorations/people-section.html #tier), on the shared `EditableCard` and
 * `useCardEdit` (moved onto them at the Wave 2 join, build plan Phase 53's lift). At rest it shows
 * both, with Edit. Editing holds a draft: a click on a tier only moves the draft, never saves. Cancel
 * drops it. Save writes only what changed, the rate first and then the tier, inside one change set,
 * so one save is one audited change; a refused rate stops the save before the tier is written, and
 * the refusal shows on the card.
 *
 * Self-contained (`anaesthetistId`, `actor`): it reads the anaesthetist and the tier itself, so the
 * anaesthetist's page (Phase 54) places it as it is. Admin only: the tier lives in the office-private
 * slice and never reaches the anaesthetist apps.
 */
export function RateTierCard({ anaesthetistId, actor }: { anaesthetistId: string; actor: Actor }) {
  const anaesthetist = useAppStore((s) => s.masters.anaesthetists[anaesthetistId])
  const tier = useAppStore((s) => selectPriorityTier(s, anaesthetistId))

  const commit: CardCommit<Draft> = (draft) => {
    if (anaesthetist === undefined) return { ok: true }
    const rate = parseAmount(draft.rate)
    if (rate === undefined || rate <= 0) return { ok: false, message: UNIT_VALUE_INVALID }
    const picked = Number(draft.tier)
    const newTier = isPriorityTier(picked) && picked !== tier ? picked : null
    const rateChanged = rate !== anaesthetist.unitValue
    // Nothing changed: Save closes the card and writes nothing.
    if (!rateChanged && newTier === null) return { ok: true }
    const refusal = withChangeSet(useAppStore, 'save', () => {
      if (rateChanged) {
        const outcome = editAnaesthetist(useAppStore, actor, anaesthetistId, { unitValue: rate })
        if (!outcome.ok) return outcome.message
      }
      if (newTier !== null) {
        const outcome = setPriorityTier(useAppStore, actor, anaesthetistId, newTier)
        if (!outcome.ok) return outcome.message
      }
      return null
    })
    return refusal === null ? { ok: true } : { ok: false, message: refusal }
  }

  const edit = useCardEdit<Draft, Draft>(() => ({ rate: amountInputText(anaesthetist?.unitValue ?? 0), tier: String(tier) }), commit)
  if (anaesthetist === undefined) return null
  const draft = edit.draft

  return (
    <EditableCard
      style={PROFILE_CARD}
      title="Rate and tier"
      shot="rate-tier-card"
      data-tier={tier}
      editable
      editing={draft !== null}
      onEdit={edit.start}
      onCancel={edit.cancel}
      onSave={() => draft !== null && edit.save(draft)}
      error={edit.error}
    >
      {draft === null ? (
        <DefList gap={12} style={AT_REST_FACTS}>
          <DefRow layout="stacked" label={RATE_PER_UNIT} mono shot="rate-tier-rate">{formatCurrency(anaesthetist.unitValue)}</DefRow>
          <DefRow layout="stacked" label="Priority tier" shot="rate-tier-tier">
            {TIER_LABELS[tier]} <span style={{ fontSize: 12, color: neutral.mist }}>· office only</span>
          </DefRow>
        </DefList>
      ) : (
        <>
          <TextField
            label={RATE_LABEL}
            value={draft.rate}
            onChange={(rate) => edit.setDraft({ ...draft, rate })}
            mono
            inputMode="decimal"
            hint={RATE_HINT}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Segmented label="Priority tier" value={draft.tier} options={TIER_OPTIONS} onChange={(t) => edit.setDraft({ ...draft, tier: t })} />
            <FieldHint>{TIER_HINT}</FieldHint>
          </div>
        </>
      )}
    </EditableCard>
  )
}
