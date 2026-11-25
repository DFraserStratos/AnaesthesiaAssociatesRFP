/**
 * Disable or Make active, in a Contract page's header (build plan Phase 45;
 * US-04.1.2 "Disable confirmed", DM-04). Disable asks first: the confirm lists
 * the Procedures still on the Contract from the day `disableFromISO` gives
 * (today: D90, OQ-144 open; for a Contract replaced from a date already past,
 * that change date: Phase 49's late disable), and nothing moves. Make active
 * acts at once. A system Contract has neither (the page leaves this out).
 *
 * The header button stays a neutral secondary (DECISIONS "Buttons"); the
 * confirm's primary is the one red outline (`ConfirmSheet confirmVariant`).
 * The page may open the confirm itself (`asking`, `onAskingChange`): the
 * replaced Contract's notice has its own Disable (Phase 49).
 */

import { useMemo, useState } from 'react'
import { replacementOf } from '../../../../domain/billing/contractHistory'
import { shortDay } from '../../../../domain/dateText'
import type { Contract } from '../../../../domain/types'
import { ConfirmSheet } from '../../../../shared/surface'
import { Button, FieldHint, FormError, Notice } from '../../../../shared/ui'
import { disableContract, disableFromISO, enableContract, stillOnContract, useAppStore, useToday, type Actor } from '../../../../store'
import { StillOnNotice } from './StillOnNotice'

/** The confirm's body: what a Disable does and does not do. */
export const DISABLE_BODY = 'It leaves the step rail today, and no new Procedure can be put on it. Procedures already on it keep it and bill as normal. You can make it active again.'

export function ContractDisable({
  contract,
  actor,
  asking: askingProp,
  onAskingChange,
}: {
  contract: Contract
  actor: Actor
  /** Controlled open state, when the page also opens the confirm. */
  asking?: boolean
  onAskingChange?: (asking: boolean) => void
}) {
  const [askingState, setAskingState] = useState(false)
  const asking = askingProp ?? askingState
  const setAsking = (v: boolean) => {
    setAskingState(v)
    onAskingChange?.(v)
  }
  const [error, setError] = useState<string | null>(null)
  const today = useToday()
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const audit = useAppStore((s) => s.audit)
  const fromISO = disableFromISO({ audit }, contract.id, today)
  const late = fromISO !== today
  const replacement = useMemo(() => (late ? replacementOf(audit, contract.id) : null), [late, audit, contract.id])
  const stillOn = useMemo(() => (asking ? stillOnContract({ schedule, masters }, contract.id, fromISO) : []), [asking, schedule, masters, contract.id, fromISO])

  function disable() {
    const outcome = disableContract(useAppStore, actor, contract.id)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    setAsking(false)
  }

  function makeActive() {
    const outcome = enableContract(useAppStore, actor, contract.id)
    setError(outcome.ok ? null : outcome.message)
  }

  const replacedBy = replacement !== null ? masters.contracts[replacement.contractId]?.aaCode : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      {contract.status === 'active' ? (
        <Button variant="secondary" size="desktop" shot="contract-disable" onClick={() => setAsking(true)}>
          Disable
        </Button>
      ) : (
        <Button variant="secondary" size="desktop" shot="contract-make-active" onClick={makeActive}>
          Make active
        </Button>
      )}
      {!asking && <FormError variant="inline" message={error} />}
      <ConfirmSheet
        open={asking}
        onClose={() => {
          setAsking(false)
          setError(null)
        }}
        title={`Disable ${contract.name}?`}
        description={DISABLE_BODY}
        confirmLabel="Disable"
        confirmVariant="danger"
        size={stillOn.length > 0 ? 'wide' : 'default'}
        confirmShot="contract-disable-confirm"
        cancelLabel="Keep it active"
        onConfirm={disable}
        shot="contract-disable-sheet"
      >
        {late && (
          <FieldHint tone="slate" shot="contract-disable-from-change-date">
            {`Listed from ${shortDay(fromISO)}, the date it was replaced${replacedBy !== undefined ? ` by ${replacedBy}` : ''}.`}
          </FieldHint>
        )}
        {stillOn.length > 0 ? (
          <StillOnNotice rows={stillOn} fromISO={fromISO} contractName={contract.name} live />
        ) : (
          <Notice tone="neutral" shot="contract-still-on-none">{late ? `No Procedure from ${shortDay(fromISO)} is on it.` : 'No Procedure from today is on it.'}</Notice>
        )}
        <FormError message={error} />
      </ConfirmSheet>
    </div>
  )
}
