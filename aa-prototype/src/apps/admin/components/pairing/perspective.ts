import type { PairingSubject } from '../../../../domain/pairingPreferences'

/** Which profile a pairing piece sits on: the surgeon profile or the Admin anaesthetist record. */
export type PairingPerspective = 'surgeon' | 'anaesthetist'

/** The profile's subject for the pure helpers: `{ surgeonId }` or `{ anaesthetistId }`. */
export function pairingSubject(perspective: PairingPerspective, id: string): PairingSubject {
  return perspective === 'surgeon' ? { surgeonId: id } : { anaesthetistId: id }
}
