import { useMemo, useState } from 'react'
import { neutral, type as typeScale } from '../../../theme/tokens'
import { profileFor, useAppStore, type Actor } from '../../../store'
import { Button, Card, DefList, FormError, PageHeader, ResultLine, TextField } from '../../../shared/ui'
import { BANK_CAPTION, HPI_CPN_CAPTION, OFFICE_HELD_CAPTION, ProfileRow, RATE_LABEL, RATE_NOTE, useRateEditor } from '../../../shared/profile'

const CAPTION = { fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.mist, margin: 0 } as const

/**
 * The anaesthetist's own profile on the web (catch-up Phase 26; US-12.1.4,
 * US-12.1.1), reached from the persona block in the top nav (the four tabs
 * are unchanged). Billing: the rate per unit, the one setting they change,
 * saved from its own panel. Contact, Identity and Bank account are held by the
 * office and read-only here, the bank number masked. Reads `masters` only.
 */
export function ProfileScreen({ anaesthetistId, actor }: { anaesthetistId: string; actor: Actor }) {
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const profile = useMemo(() => profileFor({ masters: { anaesthetists } }, anaesthetistId), [anaesthetists, anaesthetistId])
  if (profile === null) return null

  return (
    <div data-shot="web-profile" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader size="web" title="Your profile" sub="Your rate per unit is yours to set. The AA office holds your contact, identity and bank details." />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        <BillingPanel actor={actor} anaesthetistId={anaesthetistId} current={profile.unitValue} />

        <Card padding="panel" title="Contact" shot="web-contact-panel">
          <DefList gap={6}>
            <ProfileRow label="Phone" locked>{profile.phone}</ProfileRow>
            <ProfileRow label="Email" locked>{profile.email}</ProfileRow>
          </DefList>
          <p style={CAPTION}>{OFFICE_HELD_CAPTION}</p>
        </Card>

        <Card padding="panel" title="Identity" shot="web-identity-panel">
          <DefList gap={6}>
            <ProfileRow label="Registration" locked>{profile.registrationNumber}</ProfileRow>
            <ProfileRow label="HPI CPN" locked>{profile.hpiId}</ProfileRow>
          </DefList>
          <p style={CAPTION}>{HPI_CPN_CAPTION}</p>
        </Card>

        <Card padding="panel" title="Bank account" shot="web-bank-panel">
          <DefList gap={6}>
            <ProfileRow label="Account name" locked>{profile.bankAccountName}</ProfileRow>
            <ProfileRow label="Account number" locked>{profile.bankAccountMasked}</ProfileRow>
          </DefList>
          <p style={CAPTION}>{BANK_CAPTION}</p>
        </Card>
      </div>
    </div>
  )
}

/** The rate per unit, saved from its own panel; Save is enabled only when the typed rate differs. */
function BillingPanel({ actor, anaesthetistId, current }: { actor: Actor; anaesthetistId: string; current: number }) {
  const rate = useRateEditor(actor, anaesthetistId, current)
  const [saved, setSaved] = useState<string | null>(null)

  return (
    <Card padding="panel" title="Billing" shot="web-billing-panel">
      <div style={{ maxWidth: 360 }}>
        <TextField
          label={RATE_LABEL}
          value={rate.text}
          onChange={(v) => {
            rate.change(v)
            setSaved(null)
          }}
          mono
          inputMode="decimal"
          align="right"
          invalid={rate.error !== null}
          hint={RATE_NOTE}
        />
      </div>
      <FormError message={rate.error} />
      <ResultLine line={saved} />
      <div>
        <Button
          variant="primary"
          size="desktop"
          disabled={!rate.dirty}
          onClick={() => {
            if (rate.save()) setSaved('Rate saved.')
          }}
          shot="web-rate-save"
        >
          Save changes
        </Button>
      </div>
    </Card>
  )
}
