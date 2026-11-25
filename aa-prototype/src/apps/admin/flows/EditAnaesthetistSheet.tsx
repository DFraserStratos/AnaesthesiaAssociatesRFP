import { useEffect, useState } from 'react'
import { formatGstNumber, normaliseGstNumber } from '../../../domain/billing/invoicePresentation'
import { Link } from 'react-router-dom'
import { neutral } from '../../../theme/tokens'
import type { Anaesthetist } from '../../../domain/types'
import { normaliseNzBankAccount } from '../../../domain/bankAccount'
import { normaliseHpiCpn } from '../../../domain/surgeons'
import { editAnaesthetist, useAppStore, type Actor } from '../../../store'
import { Button, Segmented, TextField } from '../../../shared'
import { OverlayHeader, SheetActions } from '../../../shared/surface'
import { useSurface } from '../../../shared'
import { anaesthetistRecordPath } from '../mastersPaths'
import { textActionStyle } from '../tableChrome'
import { FormError } from '../../../shared/ui'
import { BankAccountFields, HpiCpnField, MANDATORY_REASON, mandatoryFilled } from './anaesthetistFields'

interface Props {
  open: boolean
  anaesthetist: Anaesthetist
  actor: Actor
  onClose: () => void
  /** Opened from the record page itself: no "Open record" link. */
  onRecordPage?: boolean
}

/**
 * Edit an anaesthetist's profile (office): contact, HPI CPN, bank details, GST
 * number, start date and active flag. The HPI CPN and the bank details are
 * mandatory (catch-up Phase 26; US-12.1.4): marked required,
 * checked inline, Save disabled until filled, and refused by the store in the
 * same words. The full bank number shows only here; everywhere else it is
 * masked. The store compares and audits only the fields that changed. The
 * start date and the active flag add or remove their sessions from today on,
 * and are refused while a removed session holds a List (catch-up Phase 28;
 * US-01.1.3, FT-01.1). The rate per unit and the tier are edited on the record
 * page's Rate and tier card (build plan Phase 50), and pairings there too.
 */
export function EditAnaesthetistSheet({ open, anaesthetist, actor, onClose, onRecordPage = false }: Props) {
  const { Overlay } = useSurface()
  const [hpiId, setHpiId] = useState(anaesthetist.hpiId)
  const [phone, setPhone] = useState(anaesthetist.phone)
  const [email, setEmail] = useState(anaesthetist.email)
  const [accountName, setAccountName] = useState(anaesthetist.bankAccount.accountName)
  const [accountNumber, setAccountNumber] = useState(anaesthetist.bankAccount.accountNumber)
  const [active, setActive] = useState<'active' | 'inactive'>(anaesthetist.active ? 'active' : 'inactive')
  const [startDateISO, setStartDateISO] = useState(anaesthetist.startDateISO)
  const [gstNumber, setGstNumber] = useState(anaesthetist.gstNumber !== undefined ? formatGstNumber(anaesthetist.gstNumber) : '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPhone(anaesthetist.phone)
      setEmail(anaesthetist.email)
      setAccountName(anaesthetist.bankAccount.accountName)
      setAccountNumber(anaesthetist.bankAccount.accountNumber)
      setActive(anaesthetist.active ? 'active' : 'inactive')
      setHpiId(anaesthetist.hpiId)
      setStartDateISO(anaesthetist.startDateISO)
      setGstNumber(anaesthetist.gstNumber !== undefined ? formatGstNumber(anaesthetist.gstNumber) : '')
      setError(null)
    }
  }, [open, anaesthetist])

  const filled = mandatoryFilled(hpiId, accountName, accountNumber)

  function save() {
    const bankChanged =
      accountName.trim() !== anaesthetist.bankAccount.accountName ||
      (normaliseNzBankAccount(accountNumber) ?? accountNumber.trim()) !== anaesthetist.bankAccount.accountNumber
    const outcome = editAnaesthetist(useAppStore, actor, anaesthetist.registrationNumber, {
      phone,
      email,
      active: active === 'active',
      // Only a changed start date is sent (it may add or remove sessions).
      ...(startDateISO !== anaesthetist.startDateISO ? { startDateISO } : {}),
      // Only a changed HPI CPN is sent, so an unrelated save never re-checks it.
      ...(normaliseHpiCpn(hpiId) !== anaesthetist.hpiId ? { hpiId } : {}),
      // The bank details (Phase 26): replaced whole when either part changes.
      ...(bankChanged ? { bankAccount: { accountName, accountNumber } } : {}),
      // The GST number (catch-up Phase 22, DM-62): only a change is sent; blank clears it.
      ...(normaliseGstNumber(gstNumber.trim()) !== (anaesthetist.gstNumber ?? '') ? { gstNumber } : {}),
    })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="edit-anaesthetist-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader
          title={anaesthetist.name}
          trailingLayout="end"
          trailing={
            !onRecordPage && (
              <Link to={anaesthetistRecordPath(anaesthetist.registrationNumber)} onClick={onClose} style={{ ...textActionStyle, flex: 'none', fontSize: 13 }}>
                Open record
              </Link>
            )
          }
        />
        <div className="mono" style={{ fontSize: 12, color: neutral.mist }}>Registration {anaesthetist.registrationNumber}</div>
        <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
        <TextField label="Email" value={email} onChange={setEmail} type="email" />
        <HpiCpnField value={hpiId} onChange={setHpiId} />
        <BankAccountFields accountName={accountName} accountNumber={accountNumber} onAccountName={setAccountName} onAccountNumber={setAccountNumber} />
        <div data-shot="anaesthetist-gst-number-field">
          <TextField label="GST number (optional)" value={gstNumber} onChange={setGstNumber} mono placeholder="123-456-789" hint="Printed on every invoice issued in their name. Leave it blank if it is not held." />
        </div>
        <TextField
          label="Start date"
          type="date"
          value={startDateISO}
          onChange={setStartDateISO}
          hint="Sessions are created from this date to the end of the schedule horizon."
        />
        <Segmented label="Status" value={active} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} onChange={setActive} />
        {anaesthetist.active && active === 'inactive' && (
          <div style={{ fontSize: 12.5, color: neutral.slate }}>Their sessions from today are removed.</div>
        )}
        <FormError message={error} />
        <SheetActions
          primary={
            <Button variant="primary" block onClick={save} disabled={!filled} disabledReason={filled ? undefined : MANDATORY_REASON}>
              Save changes
            </Button>
          }
        />
      </div>
    </Overlay>
  )
}
