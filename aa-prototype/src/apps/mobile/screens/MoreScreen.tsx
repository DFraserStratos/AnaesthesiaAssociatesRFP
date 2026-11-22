import { useMemo, useState, type ReactNode } from 'react'
import { SyntheticDataBadge } from '../../../shared/SyntheticDataBadge'
import { neutral, type as typeScale } from '../../../theme/tokens'
import { profileFor, recordAnaesthetistSignIn, useAppStore, type Actor } from '../../../store'
import { signOutSession } from '../../../shared/session/anaesthetistSession'
import { Avatar, DemoBadge, DockSpacer } from '../../../shared'
import { formatCurrency } from '../../../shared/format'
import { DefList, TextAction } from '../../../shared/ui'
import { BANK_CAPTION, HPI_CPN_CAPTION, ProfileRow } from '../../../shared/profile'
import { EditRateSheet, MobileHeader } from '../components'
import { Card } from '../../../shared/ui/Card'

interface MoreScreenProps {
  personaName: string
  personaRole: string
  initials: string
  actor: Actor
  anaesthetistId: string
  /**
   * Host-supplied presenter controls, appended below the demo note. The
   * installed PWA has no harness bar, so it passes its clock, Reset and office
   * simulation here; the framed prototype passes nothing and is unchanged.
   */
  extra?: ReactNode
}

const CAPTION = { fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.mist, margin: 0 } as const
const DIVIDER = { height: 1, background: neutral.line, margin: '2px 0' } as const

/**
 * More tab: the persona, the anaesthetist's own profile (catch-up Phase 26;
 * US-12.1.4, US-12.1.1) and the demo note. The profile shows the rate per unit
 * (the one thing they change, in a bottom sheet), contact, registration, HPI
 * CPN and the bank account masked; the office holds the rest, so those rows
 * carry the lock glyph. Reads `masters` only (never a tier or a pairing).
 */
export function MoreScreen({ personaName, personaRole, initials, actor, anaesthetistId, extra }: MoreScreenProps) {
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const profile = useMemo(() => profileFor({ masters: { anaesthetists } }, anaesthetistId), [anaesthetists, anaesthetistId])
  const [rateOpen, setRateOpen] = useState(false)
  const [rateKey, setRateKey] = useState(0)

  const accountEmail = anaesthetists[anaesthetistId]?.email ?? ''

  function signOut() {
    recordAnaesthetistSignIn(useAppStore, 'signedOut')
    signOutSession()
  }

  function openRate() {
    setRateKey((k) => k + 1)
    setRateOpen(true)
  }

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        // Tab bar clearance is the `DockSpacer` at the tail, not padding here.
        padding: 'calc(var(--aa-inset-top, 54px) + 10px) 20px 0',
      }}
    >
      <MobileHeader eyebrow="Settings" title="More" initials={initials} />

      {/* The shared card at the mockups' radius 14 (UI unification U6, question 20). */}
      <Card as="div" style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar initials={initials} size={44} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{personaName}</div>
          <div style={{ fontSize: 13, color: neutral.slate }}>{personaRole}</div>
        </div>
      </Card>

      {profile !== null && (
        <Card title="Profile" shot="mobile-profile" style={{ marginTop: 16 }}>
          <DefList gap={4}>
            <ProfileRow
              label="Rate per unit"
              shot="mobile-profile-rate"
              trailing={<TextAction onClick={openRate} shot="mobile-profile-rate-change">Change</TextAction>}
            >
              {formatCurrency(profile.unitValue)}
            </ProfileRow>
          </DefList>
          <div style={DIVIDER} />
          <DefList gap={4}>
            <ProfileRow label="Phone" locked>{profile.phone}</ProfileRow>
            <ProfileRow label="Email" locked>{profile.email}</ProfileRow>
          </DefList>
          <div style={DIVIDER} />
          <DefList gap={4}>
            <ProfileRow label="Registration" locked>{profile.registrationNumber}</ProfileRow>
            <ProfileRow label="HPI CPN" locked shot="mobile-profile-hpi">{profile.hpiId}</ProfileRow>
          </DefList>
          <p style={CAPTION}>{HPI_CPN_CAPTION}</p>
          <div style={DIVIDER} />
          <DefList gap={4}>
            <ProfileRow label="Bank account" locked shot="mobile-profile-bank">{profile.bankAccountMasked}</ProfileRow>
          </DefList>
          <p style={CAPTION}>{BANK_CAPTION}</p>
        </Card>
      )}

      {/* The account row (catch-up Phase 43a; US-13.5.3): one tap signs out, no confirm, and the
          sign-in screen shows at once with the account filled in. Shown in both builds. */}
      <Card as="div" shot="more-account" style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: neutral.slate }}>Signed in as</div>
          <div style={{ fontSize: 15, fontWeight: 600, overflowWrap: 'anywhere' }}>{accountEmail}</div>
        </div>
        <TextAction size="lg" shot="more-sign-out" onClick={signOut}>
          Sign out
        </TextAction>
      </Card>

      <Card as="div" style={{ marginTop: 16, gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <DemoBadge label="Demo prototype" />
          <SyntheticDataBadge tone="onLight" />
        </div>
        <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px' }}>
          This is a demonstration of the Anaesthesia Associates mobile app. All patients, NHIs, Lists and
          figures are synthetic.{' '}
          {extra === undefined
            ? 'Use the demo control panel to advance the clock or reset the data.'
            : 'The controls below stand in for the presenter harness.'}
        </div>
      </Card>

      {extra}
      <DockSpacer height="calc(var(--aa-inset-bottom, 34px) + 82px)" />

      {profile !== null && (
        <EditRateSheet
          key={rateKey}
          open={rateOpen}
          actor={actor}
          anaesthetistId={anaesthetistId}
          current={profile.unitValue}
          onClose={() => setRateOpen(false)}
        />
      )}
    </div>
  )
}
