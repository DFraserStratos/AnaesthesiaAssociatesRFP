/**
 * NZ bank account numbers for the anaesthetist's bank details (catch-up Phase
 * 26; US-12.1.4, OQ-14, DM-32). The account is master data the office holds:
 * payments to anaesthetists are made in Xero (D53), so nothing in the app pays
 * from it. Stored dashed, `BB-bbbb-AAAAAAA-SS` (or a 3-digit suffix).
 *
 * Demo simplification: the shape is checked (2-digit bank, 4-digit branch,
 * 7-digit account, 2 or 3-digit suffix) but not the bank's modulus check
 * digit. Pure: no React, no store.
 */

/** The dashed form of a typed NZ bank account number, or `null` when it is not one. Accepts dashes, spaces or none. */
export function normaliseNzBankAccount(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed === '') return null
  const grouped = /^(\d{2})[-\s]?(\d{4})[-\s]?(\d{7})[-\s]?(\d{2,3})$/.exec(trimmed)
  if (grouped === null) return null
  const [, bank, branch, account, suffix] = grouped
  return `${bank}-${branch}-${account}-${suffix}`
}

/**
 * The number with the account's first five digits hidden, e.g.
 * `99-0101-•••••21-00`: what every screen but the office's editor, and every
 * audit entry, shows. A value that is not a dashed account is masked whole.
 */
export function maskBankAccount(accountNumber: string): string {
  const parts = /^(\d{2})-(\d{4})-(\d{7})-(\d{2,3})$/.exec(accountNumber)
  if (parts === null) return '•'.repeat(Math.max(accountNumber.length, 4))
  const [, bank, branch, account, suffix] = parts
  return `${bank}-${branch}-•••••${account!.slice(5)}-${suffix}`
}

/**
 * The seed's account number for an anaesthetist (Phase 26): built from the
 * registration number on bank 99, a code no NZ bank is issued, so every seeded
 * account is plainly fictional. No RNG draw. Souter's 34821 gives
 * `99-0101-0034821-00`.
 */
export function seedBankAccountNumber(registrationNumber: string): string {
  const digits = registrationNumber.replace(/\D/g, '').slice(-7).padStart(7, '0')
  return `99-0101-${digits}-00`
}
