import { useMemo, useState, type FormEvent } from 'react'
import { Logo } from '../../../shared/Logo'
import { DemoBadge } from '../../../shared/DemoBadge'
import { Button, Card, Notice, Pill, TextField } from '../../../shared/ui'
import { stampText } from '../../../shared/format'
import { useDemoTriggerContext } from '../../../shared/demoTriggers/context'
import { anaesthetistUserId } from '../../../shell/anaesthetistUser'
import { latestNoLongerActiveRefusal, recordAnaesthetistSignIn, signInRefusal, useAppStore } from '../../../store'
import { SIGN_IN_PROVISIONAL, signInSession } from '../../../shared/session/anaesthetistSession'
import { neutral, type as typeScale } from '../../../theme/tokens'

/**
 * A fixed masked demo value: the sign-in checks no password (OQ-83 is open, no
 * identity provider is built), so any non-empty password signs the demo account in.
 */
const DEMO_PASSWORD = 'demo-account'

const MESSAGES = {
  noEmail: 'Enter your email',
  noPassword: 'Enter your password',
  unknown: 'No account with that email. Use the demo account.',
} as const

type EmailError = 'noEmail' | 'unknown' | null

/**
 * The simulated sign-in (catch-up Phase 43a; US-13.5.3, PWA first). The mobile
 * canvas with the host's atmosphere showing through, the AA logo, then one
 * white card with Dr Souter's demo account filled in. Deterministic: the demo
 * account with any non-empty password signs in at once; another email is
 * refused with an inline message. Each attempt that reaches the account check
 * writes one audited `account` row; a blank field is caught on the form and
 * writes none. No "Forgot password", social buttons or Face ID: OQ-83, narrated.
 *
 * Rendered by `MobileApp`'s gate in place of the screens and the tab bar, so
 * the URL is untouched and sign-in lands where it already points.
 */
export function SignInScreen() {
  const demoEmail = useAppStore((s) => s.masters.anaesthetists[anaesthetistUserId(s.shell)]?.email ?? '')
  const [email, setEmail] = useState(demoEmail)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [emailError, setEmailError] = useState<EmailError>(null)
  const [passwordError, setPasswordError] = useState(false)
  // The "try signing in after the last day" trigger shows only while this screen does (Phase 52).
  useDemoTriggerContext('mobile.signIn', true)
  const audit = useAppStore((s) => s.audit)
  const refused = useMemo(() => latestNoLongerActiveRefusal({ audit }), [audit])
  // A new refusal fills the form with the refused account's email, so the notice and the field name the same person.
  const refusedEmail = useAppStore((s) => (refused === null ? null : (s.masters.anaesthetists[refused.anaesthetistId]?.email ?? null)))
  const refusedAt = refused?.atISO ?? null
  const [seenRefusal, setSeenRefusal] = useState(refusedAt)
  if (refusedAt !== seenRefusal) {
    setSeenRefusal(refusedAt)
    if (refusedEmail !== null) {
      setEmail(refusedEmail)
      setEmailError(null)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const typed = email.trim()
    const noEmail = typed === ''
    const noPassword = password === ''
    setPasswordError(noPassword)
    if (noEmail) {
      setEmailError('noEmail')
      return
    }
    if (noPassword) {
      setEmailError(null)
      return
    }
    // Phase 52 (US-13.5.3, DM-07): an anaesthetist whose last day has passed is refused, with its own audited reason.
    const state = useAppStore.getState()
    const account = Object.values(state.masters.anaesthetists).find((a) => a.email.toLowerCase() === typed.toLowerCase())
    const refusal = account === undefined ? null : signInRefusal(state, account.registrationNumber)
    if (account !== undefined && refusal !== null) {
      setEmailError(null)
      recordAnaesthetistSignIn(useAppStore, 'refused', { anaesthetistId: account.registrationNumber, reason: refusal })
      return
    }
    if (typed.toLowerCase() !== demoEmail.toLowerCase()) {
      setEmailError('unknown')
      recordAnaesthetistSignIn(useAppStore, 'refused')
      return
    }
    setEmailError(null)
    recordAnaesthetistSignIn(useAppStore, 'signedIn')
    signInSession(demoEmail)
  }

  return (
    <div
      data-shot="sign-in-screen"
      style={{
        height: '100%',
        overflow: 'auto',
        boxSizing: 'border-box',
        padding: 'calc(var(--aa-inset-top, 54px) + 36px) 20px calc(var(--aa-inset-bottom, 34px) + 24px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <Logo height={30} />

      <Card as="div" elevation="e1" style={{ gap: 16 }}>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: typeScale.title.size,
              lineHeight: `${typeScale.title.line}px`,
              fontWeight: typeScale.title.weight,
              letterSpacing: typeScale.title.tracking,
              color: neutral.ink,
            }}
          >
            Sign in
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: '20px', color: neutral.slate }}>
            Your Lists, Bookings and balances, on your phone.
          </p>
        </div>
        {refused !== null && (
          <Notice tone="warning" title="No longer active" live="status" shot="sign-in-no-longer-active">
            {refused.who}&apos;s last day has passed, so they can no longer sign in. Ask the AA office if this is wrong.
            <span style={{ display: 'block', marginTop: 4, fontSize: typeScale.small.size, color: neutral.slate }}>
              Logged: Sign-in failed, {stampText(refused.atISO)}
            </span>
          </Notice>
        )}
        <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v)
              setEmailError(null)
            }}
            inputMode="email"
            autoComplete="username"
            invalid={emailError !== null}
            hint={emailError === null ? undefined : MESSAGES[emailError]}
            shot="sign-in-email"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(v) => {
              setPassword(v)
              setPasswordError(false)
            }}
            autoComplete="current-password"
            invalid={passwordError}
            hint={passwordError ? MESSAGES.noPassword : undefined}
            shot="sign-in-password"
          />
          <Button type="submit" block shot="sign-in-submit" style={{ marginTop: 4 }}>
            Sign in
          </Button>
        </form>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <Pill tone="neutral" size="sm" title={`Provisional: ${SIGN_IN_PROVISIONAL.oq}`} shot="sign-in-provisional">
            Provisional
          </Pill>
          <span style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate }}>
            {SIGN_IN_PROVISIONAL.note}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <DemoBadge label="Demo prototype" />
        </div>
      </div>
    </div>
  )
}
