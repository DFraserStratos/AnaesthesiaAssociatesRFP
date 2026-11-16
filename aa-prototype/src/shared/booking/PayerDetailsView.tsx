/**
 * The payer as the Booking shows it (catch-up Phase 21; US-11.2.2, US-11.2.3,
 * US-11.2.4): the name with "Patient" or the relationship, then the email and
 * the postal address, and two warning-tint chips: "Email or postal address
 * needed" when a billed payer has neither, "Under 18" when the patient is a
 * child paying for a Procedure billed to the payer. Shared by the Payer
 * section in all three apps; it derives nothing (the caller passes the
 * `whoIsBilled.ts` results). No money.
 */

import { neutral } from '../../theme/tokens'
import { PAYER_CONTACT_NEEDED, type PayerDetails } from '../../domain/billing'
import { formatPostalAddress } from '../../domain/billing/payer'
import { Pill } from '../ui'

export function PayerDetailsView({
  details,
  contactMissing,
  child,
  holdersOnly,
}: {
  details: PayerDetails
  contactMissing: boolean
  child: boolean
  /** True when every Procedure's Contract bills its holder (`onlyHoldersBilled`): the payer is shown, quietly marked not invoiced. */
  holdersOnly: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <span data-aa-selectable style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{details.name}</span>
        {details.relationship !== undefined && <span style={{ fontSize: 13, color: neutral.slate }}>{details.relationship}</span>}
      </div>
      {details.email !== undefined && (
        <span data-aa-selectable style={{ fontSize: 13, color: neutral.slate, overflowWrap: 'anywhere' }}>{details.email}</span>
      )}
      {details.postalAddress !== undefined && (
        <span data-aa-selectable style={{ fontSize: 13, lineHeight: '18px', color: neutral.slate }}>{formatPostalAddress(details.postalAddress)}</span>
      )}
      {holdersOnly && <span style={{ fontSize: 12.5, color: neutral.mist }}>Not invoiced: every procedure bills its Contract&apos;s holder.</span>}
      {(contactMissing || child) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {contactMissing && (
            <Pill tone="warning" shot="payer-contact-missing">
              {PAYER_CONTACT_NEEDED}
            </Pill>
          )}
          {child && (
            <Pill tone="warning" shot="payer-under-18">
              Under 18
            </Pill>
          )}
        </div>
      )}
    </div>
  )
}
