/**
 * The synthetic NHI register (catch-up Phase 40a; US-14.4.1, FT-14.4).
 *
 * It stands for the national NHI register behind the Health NZ Digital
 * Services Hub: an external system, so it is built from the seed by a pure
 * function and never put in the store, persisted or touched by reset. A
 * person on it is what the simulated Hub returns, a subset of a FHIR Patient,
 * and never holds an AA id.
 */

import type { NhiFormat } from '../nhi'
import type { IsoDate, PostalAddress } from '../types'

export interface NhiRegisterPerson {
  nhi: string
  name: string
  dobISO: IsoDate
  phone?: string
  postalAddress?: PostalAddress
  ethnicityCode?: string
  format: NhiFormat
}

/** What the register knows that AA does not yet (a new name, a move). */
export type NhiRegisterUpdate = Partial<Pick<NhiRegisterPerson, 'name' | 'dobISO' | 'phone' | 'postalAddress' | 'ethnicityCode'>>

export type NhiRegister = ReadonlyMap<string, NhiRegisterPerson>

/** A field the register refresh compares (the register holds no email). */
export type RegisterField = 'name' | 'dobISO' | 'phone' | 'address' | 'ethnicityCode'
