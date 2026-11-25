/**
 * FT-13.5 demonstrated as audit rows (catch-up Phase 14): "Simulate sign-in
 * attempts". The proposed product is an Identity-as-a-Service (Auth0 or Entra
 * External ID) with MFA enforced for Admin, self-service password reset that
 * admins never see, every login attempt logged, and Google/Apple social login
 * on mobile. None of that is built; this appends the audit rows such a service
 * would produce, so the Audit viewer can show that every attempt is recorded.
 *
 * Audit only: every row goes through `mutate()` with an empty patch, so only
 * `audit` and `counters` change and no domain slice is touched. Entity type
 * `account`; Dr Souter's account is her anaesthetist id, Kirsty W.'s is the
 * fixed `OFFICE_ACCOUNT_ID`. Each row's `after` leads with the field that
 * tells its story (MFA result, failure reason, provider), because the Audit
 * viewer's Change column shows the first field inline.
 */

import { ANAE } from '../domain/seed'
import type { AppStoreApi } from './appStore'
import { OFFICE_ACCOUNT_ID, OFFICE_ACTOR, SOUTER_ACTOR, anaesthetistActor } from './demoActors'
import { mutate, ok, type Outcome } from './mutate'

const PROVIDER = 'Identity provider (simulated)'

export function simulateSignInAttempts(api: AppStoreApi): Outcome<{ rows: number }> {
  // The office provisions Dr Souter's account without ever seeing her credentials.
  mutate(
    api,
    OFFICE_ACTOR,
    {
      entityType: 'account',
      entityId: ANAE.souter,
      action: 'account.provisioned',
      after: { credentialsVisibleToAdmin: false, provider: PROVIDER },
    },
    () => ({}),
  )
  // Kirsty W. signs in to the Admin app; MFA is enforced for Admin accounts.
  mutate(
    api,
    OFFICE_ACTOR,
    {
      entityType: 'account',
      entityId: OFFICE_ACCOUNT_ID,
      action: 'auth.signIn',
      after: { mfa: 'passed', app: 'Admin', provider: PROVIDER },
    },
    () => ({}),
  )
  // A failed Admin attempt on the same account is logged too.
  mutate(
    api,
    OFFICE_ACTOR,
    {
      entityType: 'account',
      entityId: OFFICE_ACCOUNT_ID,
      action: 'auth.signInFailed',
      after: { reason: 'Incorrect password', app: 'Admin', provider: PROVIDER },
    },
    () => ({}),
  )
  // Dr Souter resets her own password (self-service; no admin involved).
  mutate(
    api,
    SOUTER_ACTOR,
    {
      entityType: 'account',
      entityId: ANAE.souter,
      action: 'auth.passwordReset',
      after: { credentialsVisibleToAdmin: false, provider: PROVIDER },
    },
    () => ({}),
  )
  // Dr Souter signs in to the mobile app with one-tap social login.
  mutate(
    api,
    SOUTER_ACTOR,
    {
      entityType: 'account',
      entityId: ANAE.souter,
      action: 'auth.signIn',
      after: { provider: 'Apple (social login)', app: 'Mobile' },
    },
    () => ({}),
  )
  return ok({ rows: 5 })
}

/** What one anaesthetist sign-in attempt came to (catch-up Phase 43a; US-13.5.3). */
export type AnaesthetistSignInOutcome = 'signedIn' | 'refused' | 'signedOut'

/**
 * The simulated PWA sign-in's audit row (catch-up Phase 43a): one `account`
 * row per attempt, as Dr Souter, through `mutate()` with an empty patch, so no
 * domain slice moves and the Audit viewer shows every attempt logged. Never
 * holds a password. The sign-in session itself is per-device browser state
 * (`shared/session/anaesthetistSession.ts`), not `AppState`.
 *
 * Build plan Phase 52 (US-13.5.3, DM-07): the row may name another
 * anaesthetist's account and carry a reason ("No longer active" after a last
 * day, on a refusal or a sign-out by the stored-session gate). The defaults
 * keep Dr Souter's rows exactly as before.
 */
export function recordAnaesthetistSignIn(
  api: AppStoreApi,
  outcome: AnaesthetistSignInOutcome,
  options: { anaesthetistId?: string; reason?: string } = {},
): Outcome<{ rows: number }> {
  const app = 'Mobile (PWA)'
  const id = options.anaesthetistId ?? ANAE.souter
  const actor = id === ANAE.souter ? SOUTER_ACTOR : (anaesthetistActor(api.getState(), id) ?? SOUTER_ACTOR)
  const reason = options.reason !== undefined ? { reason: options.reason } : {}
  if (outcome === 'signedIn') {
    mutate(api, actor, { entityType: 'account', entityId: id, action: 'auth.signIn', after: { app, provider: PROVIDER } }, () => ({}))
  } else if (outcome === 'refused') {
    mutate(api, actor, { entityType: 'account', entityId: id, action: 'auth.signInFailed', after: { app, provider: PROVIDER, reason: options.reason ?? 'Unknown account' } }, () => ({}))
  } else {
    // A reason leads, so the Audit viewer's Change column shows why the handset was signed out.
    mutate(api, actor, { entityType: 'account', entityId: id, action: 'auth.signOut', after: { ...reason, app, provider: PROVIDER } }, () => ({}))
  }
  return ok({ rows: 1 })
}
