/**
 * The simulated Health NZ Digital Services Hub (catch-up Phase 40a;
 * US-14.4.1). No network: the answer is a pure function of the demo mode,
 * the synthetic register and the typed NHI. An invalid NHI is never sent;
 * `slow` answers as `available` does, only its presentation differs.
 */

import type { NhiHubMode } from '../../domain/types'
import { lookupOnRegister, type NhiRegister, type NhiRegisterPerson } from '../../domain/nhiRegister'
import { NHI_REASONS, validateNhi } from '../../domain/nhi'

export type HubAnswer =
  | { kind: 'invalid'; reason: string }
  | { kind: 'unavailable'; nhi: string }
  | { kind: 'found'; person: NhiRegisterPerson }
  | { kind: 'notFound'; nhi: string }

export function askHub(mode: NhiHubMode, register: NhiRegister, input: string): HubAnswer {
  const verdict = validateNhi(input)
  if (!verdict.valid) return { kind: 'invalid', reason: verdict.reason ?? NHI_REASONS.notValid }
  if (mode === 'unavailable') return { kind: 'unavailable', nhi: verdict.normalised }
  return lookupOnRegister(register, verdict.normalised)
}

/**
 * How long the visible wait lasts (a UI-layer timer, the only wall-time
 * element: every stored time comes from the demo clock).
 */
export const HUB_TIMING = { answerMs: 600, slowAnswerMs: 6000, slowNoticeMs: 1500 } as const

export type HubTiming = { answerMs: number; slowAnswerMs: number; slowNoticeMs: number }

/** Mode labels for Demo actions and the form's badge. */
export const NHI_HUB_MODE_LABELS: Record<NhiHubMode, string> = {
  available: 'Available',
  slow: 'Slow',
  unavailable: 'Unavailable',
}
