import { useMemo, useState } from 'react'
import { contractPriceText } from '../../../shared/contracts/railText'
import { ConfirmSheet } from '../../../shared/surface'
import { Checkbox, FormError, Notice, TextAction } from '../../../shared/ui'
import { makeAnaesthetistActive, offerBackFor, useAppStore, useToday, type Actor } from '../../../store'
import { contractPath } from '../contractsPaths'

/**
 * Make an inactive anaesthetist active again from today (build plan Phase 52;
 * US-12.1.6 "Active again", US-04.1.2 "Inactive anaesthetist"), over the shared
 * `ConfirmSheet`. It offers back the Contracts the system disabled with them
 * (`offerBackFor`: never one the office disabled by hand), each ticked, with its
 * price as the Contract list shows it and its name a link to the Contract's
 * page; the ticked ones are made active again in the same change. Slots and
 * sign-in come back from today.
 *
 * Hooks: `make-active-sheet`, `make-active-contract` (`data-contract-id`,
 * `data-ticked`), `make-active-none`, `make-active-confirm`.
 */
export function MakeActiveSheet({ open, anaesthetistId, actor, onClose }: { open: boolean; anaesthetistId: string; actor: Actor; onClose: () => void }) {
  const todayISO = useToday()
  const anaesthetist = useAppStore((s) => s.masters.anaesthetists[anaesthetistId])
  const masters = useAppStore((s) => s.masters)
  const audit = useAppStore((s) => s.audit)
  const offered = useMemo(() => offerBackFor({ masters, audit }, anaesthetistId), [masters, audit, anaesthetistId])
  const [unticked, setUnticked] = useState<ReadonlySet<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  if (anaesthetist === undefined) return null

  function toggle(id: string, ticked: boolean) {
    const next = new Set(unticked)
    if (ticked) next.delete(id)
    else next.add(id)
    setUnticked(next)
  }

  function confirm() {
    const ids = offered.filter((c) => !unticked.has(c.id)).map((c) => c.id)
    const outcome = makeAnaesthetistActive(useAppStore, actor, anaesthetistId, ids)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title={`Make ${anaesthetist.name} active again from today?`}
      description="They have sessions from today and can sign in again."
      confirmLabel="Make active"
      confirmShot="make-active-confirm"
      cancelLabel="Cancel"
      onConfirm={confirm}
      shot="make-active-sheet"
    >
      {offered.length === 0 ? (
        <Notice tone="neutral" shot="make-active-none">No Contracts were disabled with them.</Notice>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Make these Contracts active again</div>
          {offered.map((c) => (
            <Checkbox
              key={c.id}
              checked={!unticked.has(c.id)}
              onChange={(ticked) => toggle(c.id, ticked)}
              hint={contractPriceText(c, todayISO)}
              data-shot="make-active-contract"
              data-contract-id={c.id}
              data-ticked={!unticked.has(c.id)}
            >
              <TextAction size="sm" flush to={contractPath(c.id)} newTab label={`Open ${c.name} in a new tab`}>{c.name}</TextAction>
            </Checkbox>
          ))}
        </div>
      )}
      <FormError message={error} />
    </ConfirmSheet>
  )
}
