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
import { OFFICE_ACCOUNT_ID, OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
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
