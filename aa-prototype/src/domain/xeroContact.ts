/**
 * No personal information in Xero (catch-up Phase 16; US-09.3.1, OQ-30
 * answered). A patient or billable-party contact is known to Xero only by the
 * hidden internal ID (its ContactNumber); its name is a neutral label built from
 * that ID, never a person's name, NHI, phone, email or address. Organisation
 * contacts (hospitals, insurers, surgeons, groups, the anaesthetist payees) keep
 * their names. The handoff and both seeds name individual contacts through this
 * one helper.
 */

import type { XeroContact } from './types'

export type XeroIndividualContactType = Exclude<XeroContact['type'], 'organisation'>

const LABEL: Record<XeroIndividualContactType, string> = {
  patient: 'Patient',
  billableParty: 'Billable party',
}

/** The Xero Name of an individual contact: "Patient PT0001", "Billable party BP0001". */
export function xeroIndividualContactName(type: XeroIndividualContactType, hiddenId: string): string {
  return `${LABEL[type]} ${hiddenId}`
}
