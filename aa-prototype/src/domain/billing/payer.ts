/**
 * The postal address and contact rules for the payer on a Booking (catch-up
 * Phase 21; US-11.2.2, US-11.2.3; Greg, 28 October: "using the NZ Post
 * standard... address format"). Pure: the payer sheet, the patient sheet,
 * `setBookingPayer` and the invoice all read these, never their own copy.
 */

import type { PostalAddress } from '../types'

/** The sentences the payer and patient sheets show (the store refuses with the same words). */
export const EMAIL_PROBLEM = 'Enter a valid email.'
export const POSTCODE_PROBLEM = 'Enter a four-digit postcode.'
export const ADDRESS_LINE_PROBLEM = 'Enter the street address, PO Box or Private Bag.'
export const CITY_PROBLEM = 'Enter the town or city.'

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** True when `email` has the shape of an email address (blank is not an email). */
export function isEmailShaped(email: string | undefined): boolean {
  return email !== undefined && EMAIL_SHAPE.test(email.trim())
}

/** The email's problem, or null when it is blank or well formed. */
export function emailProblem(email: string | undefined): string | null {
  if (email === undefined || email.trim() === '') return null
  return isEmailShaped(email) ? null : EMAIL_PROBLEM
}

/** True when every part of the address is blank (the form's "no address"). */
export function isBlankPostalAddress(address: Partial<PostalAddress> | undefined): boolean {
  if (address === undefined) return true
  return [address.line1, address.line2, address.suburb, address.city, address.postcode].every((v) => v === undefined || v.trim() === '')
}

/**
 * What is wrong with a postal address in the NZ Post standard: an address
 * line, a town or city and a four-digit postcode are needed; the second line
 * (unit, building or RD) and the suburb are optional. Null when it is valid.
 */
export function postalAddressProblem(address: Partial<PostalAddress> | undefined): string | null {
  if (address === undefined) return ADDRESS_LINE_PROBLEM
  if (address.line1 === undefined || address.line1.trim() === '') return ADDRESS_LINE_PROBLEM
  if (address.city === undefined || address.city.trim() === '') return CITY_PROBLEM
  if (address.postcode === undefined || !/^\d{4}$/.test(address.postcode.trim())) return POSTCODE_PROBLEM
  return null
}

/** True when the address is complete and valid. */
export function isValidPostalAddress(address: Partial<PostalAddress> | undefined): address is PostalAddress {
  return postalAddressProblem(address) === null
}

/** A form's address trimmed to the stored shape, empty optional parts dropped; undefined when blank. */
export function cleanPostalAddress(address: Partial<PostalAddress> | undefined): PostalAddress | undefined {
  if (isBlankPostalAddress(address) || address === undefined) return undefined
  const out: PostalAddress = { line1: (address.line1 ?? '').trim(), city: (address.city ?? '').trim(), postcode: (address.postcode ?? '').trim() }
  if (address.line2 !== undefined && address.line2.trim() !== '') out.line2 = address.line2.trim()
  if (address.suburb !== undefined && address.suburb.trim() !== '') out.suburb = address.suburb.trim()
  return out
}

/**
 * The address in NZ Post layout, one line each: the address line, the second
 * line, the suburb, then the town or city with the postcode
 * ("Christchurch 8014").
 */
export function postalAddressLines(address: PostalAddress): string[] {
  const lines = [address.line1]
  if (address.line2 !== undefined && address.line2 !== '') lines.push(address.line2)
  if (address.suburb !== undefined && address.suburb !== '') lines.push(address.suburb)
  lines.push(`${address.city} ${address.postcode}`)
  return lines
}

/** The address on one line, parts joined by commas. */
export function formatPostalAddress(address: PostalAddress): string {
  return postalAddressLines(address).join(', ')
}
