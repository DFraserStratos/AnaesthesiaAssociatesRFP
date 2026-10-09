import { format, parseISO } from 'date-fns'

/** "10 Mar 2026" from a stored ISO stamp (the pairing rows' added and ended lines). */
export function pairingDate(iso: string): string {
  return format(parseISO(iso.slice(0, 10)), 'd MMM yyyy')
}

/** "Added by Kirsty W. on 10 Mar 2026". */
export function addedLine(by: string, iso: string): string {
  return `Added by ${by} on ${pairingDate(iso)}`
}

/** "Ended by Kirsty W. on 12 May 2026". */
export function endedLine(by: string | undefined, iso: string): string {
  return by !== undefined ? `Ended by ${by} on ${pairingDate(iso)}` : `Ended on ${pairingDate(iso)}`
}
