/**
 * Disable or Make active, in a Contract page's header (build plan Phase 45;
 * US-04.1.2 "Disable confirmed", DM-04). Disable asks first: the confirm lists
 * the Procedures still on the Contract from the day `disableFromISO` gives
 * (today: D90, OQ-144 open), and nothing moves. Make active acts at once. A
 * system Contract has neither (the page leaves this out).
 *
 * The header button stays a neutral secondary (DECISIONS "Buttons"); the
 * confirm's primary is the one red outline (`ConfirmSheet confirmVariant`).
 */

import { useMemo, useState } from 'react'
import type { Contract } from '../../../../domain/types'
import { ConfirmSheet } from '../../../../shared/surface'
import { Button, FormError, Notice } from '../../../../shared/ui'
import { disableContract, disableFromISO, enableContract, stillOnContract, useAppStore, useToday, type Actor } from '../../../../store'
import { StillOnNotice } from './StillOnNotice'

/** The confirm's body: what a Disable does and does not do. */
export const DISABLE_BODY = 'It leaves the step rail today, and no new Procedure can be put on it. Procedures already on it keep it and bill as normal. You can make it active again.'

export function ContractDisable({ contract, actor }: { contract: Contract; actor: Actor }) {
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const today = useToday()
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const fromISO = disableFromISO({ masters }, contract.id, today)
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
        {stillOn.length > 0 ? (
          <StillOnNotice rows={stillOn} fromISO={fromISO} contractName={contract.name} live />
        ) : (
          <Notice tone="neutral" shot="contract-still-on-none">No Procedure from today is on it.</Notice>
        )}
        <FormError message={error} />
      </ConfirmSheet>
    </div>
  )
}
