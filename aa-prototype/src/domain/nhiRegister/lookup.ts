/**
 * A lookup on the synthetic NHI register (catch-up Phase 40a). Pure. The NHI
 * is validated first with `validateNhi`, and an invalid one never reads the
 * register: it is never "sent to the Hub".
 */

import { NHI_REASONS, validateNhi } from '../nhi'
import type { NhiRegister, NhiRegisterPerson } from './types'

export type RegisterLookup =
  | { kind: 'invalid'; reason: string }
  | { kind: 'found'; person: NhiRegisterPerson }
  | { kind: 'notFound'; nhi: string }

export function lookupOnRegister(register: NhiRegister, input: string): RegisterLookup {
  const verdict = validateNhi(input)
  if (!verdict.valid) return { kind: 'invalid', reason: verdict.reason ?? NHI_REASONS.notValid }
  const person = register.get(verdict.normalised)
  return person !== undefined ? { kind: 'found', person } : { kind: 'notFound', nhi: verdict.normalised }
}
