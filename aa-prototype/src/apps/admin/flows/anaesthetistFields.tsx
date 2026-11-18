import { normaliseNzBankAccount } from '../../../domain/bankAccount'
import { HPI_CPN_INVALID, isPlausibleHpiCpn } from '../../../domain/surgeons'
import { BANK_ACCOUNT_INVALID } from '../../../store'
import { TextField } from '../../../shared'

/**
 * The anaesthetist's mandatory identity and bank fields (catch-up Phase 26;
 * US-12.1.4): the HPI CPN and the bank account name and number, shared by the
 * Add and Edit forms so both mark them required and check them inline the same
 * way. The store refuses the same cases in the same words.
 */
export function hpiCpnInvalid(value: string): boolean {
  return value.trim() !== '' && !isPlausibleHpiCpn(value)
}

export function bankNumberInvalid(value: string): boolean {
  return value.trim() !== '' && normaliseNzBankAccount(value) === null
}

/** Why Save stays disabled, printed under it until every mandatory field is filled. */
export const MANDATORY_REASON = 'The HPI CPN and the bank details are required.'

/** Every mandatory field filled (Save stays disabled until then). */
export function mandatoryFilled(hpiId: string, accountName: string, accountNumber: string): boolean {
  return hpiId.trim() !== '' && accountName.trim() !== '' && accountNumber.trim() !== ''
}

export function HpiCpnField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const invalid = hpiCpnInvalid(value)
  return (
    <TextField
      label="HPI CPN (required)"
      value={value}
      onChange={onChange}
      mono
      placeholder="12ABCD"
      invalid={invalid}
      hint={invalid ? HPI_CPN_INVALID : "The anaesthetist's unique number on the Health Provider Index."}
      data-validation-field="hpiId"
      {...(invalid ? { 'data-validation-invalid': 'true' } : {})}
    />
  )
}

export function BankAccountFields({
  accountName,
  accountNumber,
  onAccountName,
  onAccountNumber,
}: {
  accountName: string
  accountNumber: string
  onAccountName: (value: string) => void
  onAccountNumber: (value: string) => void
}) {
  const invalid = bankNumberInvalid(accountNumber)
  return (
    <div data-shot="anaesthetist-bank-fields" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <TextField label="Bank account name (required)" value={accountName} onChange={onAccountName} placeholder="e.g. Nadia Kerr" data-validation-field="accountName" />
      <TextField
        label="Bank account number (required)"
        value={accountNumber}
        onChange={onAccountNumber}
        mono
        inputMode="numeric"
        placeholder="12-3456-7654321-00"
        invalid={invalid}
        hint={invalid ? BANK_ACCOUNT_INVALID : 'Held on file by the AA office. Payments are made in Xero.'}
        data-validation-field="accountNumber"
        {...(invalid ? { 'data-validation-invalid': 'true' } : {})}
      />
    </div>
  )
}
