import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { neutral } from '../../../theme/tokens'
import { parseAmount } from '../../../domain/billing/money'
import { UNIT_VALUE_INVALID, addAnaesthetist, useAppStore, useToday, type Actor } from '../../../store'
import { Button, TextField } from '../../../shared'
import { OverlayHeader, SheetActions } from '../../../shared/surface'
import { useSurface } from '../../../shared'
import { FormError } from '../../../shared/ui'
import { ResultLine } from '../../../shared/ui/ResultLine'
import { BankAccountFields, HpiCpnField, MANDATORY_REASON, mandatoryFilled } from './anaesthetistFields'

interface Props {
  open: boolean
  actor: Actor
  onClose: () => void
}

/**
 * Add an anaesthetist. The HPI CPN and the bank details are mandatory
 * (catch-up Phase 26; US-12.1.4): marked required, checked inline, the add
 * button disabled until filled, and refused by the store in the same words.
 * On save the store creates their sessions, an AM and a PM a day, all free,
 * from their start date (default the demo clock's today) to the end of the
 * schedule horizon (catch-up Phase 28; US-01.1.3), so the day grid gains their
 * row from that date. Reports the store `Outcome` refusal verbatim.
 */
export function AddAnaesthetistFlow({ open, actor, onClose }: Props) {
  const { Overlay } = useSurface()
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [unitValue, setUnitValue] = useState('30')
  const [hpiId, setHpiId] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const todayISO = useToday()
  const [startDateISO, setStartDateISO] = useState(todayISO)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setRegistrationNumber('')
      setName('')
      setPhone('')
      setEmail('')
      setUnitValue('30')
      setHpiId('')
      setAccountName('')
      setAccountNumber('')
      setGstNumber('')
      setStartDateISO(todayISO)
      setError(null)
      setResult(null)
    }
  }, [open, todayISO])

  const filled = mandatoryFilled(hpiId, accountName, accountNumber)

  function save() {
    const uv = parseAmount(unitValue)
    if (uv === undefined || uv <= 0) {
      setError(UNIT_VALUE_INVALID)
      return
    }
    const outcome = addAnaesthetist(useAppStore, actor, {
      registrationNumber,
      name,
      phone,
      email,
      unitValue: uv,
      hpiId,
      bankAccount: { accountName, accountNumber },
      startDateISO,
      gstNumber,
    })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    const from = format(parseISO(outcome.value.fromISO), 'd MMM')
    setResult(
      outcome.value.generatedSlots > 0
        ? `Added. ${outcome.value.generatedSlots} forward sessions created from ${from}.`
        : `Added. Sessions start on ${format(parseISO(startDateISO), 'd MMM yyyy')}, when the schedule horizon reaches it.`,
    )
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="add-anaesthetist-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Add an anaesthetist" />
        <div style={{ fontSize: 12.5, color: neutral.slate }}>Adding an anaesthetist creates their AM and PM sessions, free, from their start date.</div>
        <TextField label="Registration number (ID)" value={registrationNumber} onChange={setRegistrationNumber} mono placeholder="e.g. 41552" />
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Dr Nadia Kerr" />
        <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
        <TextField label="Email" value={email} onChange={setEmail} type="email" />
        <TextField label="Unit value ($)" value={unitValue} onChange={setUnitValue} mono inputMode="decimal" />
        <HpiCpnField value={hpiId} onChange={setHpiId} />
        <BankAccountFields accountName={accountName} accountNumber={accountNumber} onAccountName={setAccountName} onAccountNumber={setAccountNumber} />
        <TextField label="GST number (optional)" value={gstNumber} onChange={setGstNumber} mono placeholder="123-456-789" />
        <div data-shot="admin-add-anaesthetist-start">
          <TextField
            label="Start date"
            type="date"
            value={startDateISO}
            onChange={setStartDateISO}
            hint="Sessions are created from this date to the end of the schedule horizon."
          />
        </div>
        <FormError message={error} />
        <ResultLine line={result} />
        {result !== null ? (
          <SheetActions primary={<Button variant="primary" block onClick={onClose}>Done</Button>} />
        ) : (
          <SheetActions
            primary={
              <Button variant="primary" block onClick={save} disabled={!filled} disabledReason={filled ? undefined : MANDATORY_REASON}>
                Add anaesthetist
              </Button>
            }
          />
        )}
      </div>
    </Overlay>
  )
}
