/**
 * New contract's "Already held" (build plan Phase 46; US-04.1.2 Similar name):
 * the holder's Contracts, those with a name like the one being typed first
 * (`similarContracts`, the one rule), each marked "Similar name", then its
 * other Active Contracts by name, five rows in all. A hint so the office does
 * not make a duplicate by mistake: it never blocks Create. Links open in a new
 * tab, so the half-filled form survives.
 */

import { useMemo } from 'react'
import { similarContracts } from '../../../../../domain/billing/contractSimilarity'
import type { Contract } from '../../../../../domain/billing/contracts'
import { rangeSummary, rangeSummaryText } from '../../../../../domain/billing/priceRanges'
import type { Party } from '../../../../../domain/billing/parties'
import { pricingLabel } from '../../../../../shared/contracts'
import { Card, CountBadge, Pill, TextAction } from '../../../../../shared/ui'
import { useAppStore, useToday } from '../../../../../store'
import { neutral } from '../../../../../theme/tokens'
import { contractPath, contractsPath } from '../../../contractsPaths'

/** How many Contracts the card lists. */
const HELD_ROWS = 5

/** A Contract's price as the list reads it: the range in force, or the kind's phrase. */
function priceText(contract: Contract, todayISO: string): string {
  return contract.pricing.kind === 'fixed' ? rangeSummaryText(rangeSummary(contract, todayISO)) : pricingLabel(contract.pricing)
}

export function AlreadyHeld({ holder, name }: { holder: Party | undefined; name: string }) {
  const contracts = useAppStore((s) => s.masters.contracts)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const today = useToday()
  const held = useMemo(
    () => (holder === undefined ? [] : Object.values(contracts).filter((c) => c.holderId === holder.id && c.systemRole === undefined)),
    [contracts, holder],
  )
  const active = useMemo(() => held.filter((c) => c.status === 'active').sort((a, b) => a.name.localeCompare(b.name)), [held])
  const similar = useMemo(() => (holder === undefined ? [] : similarContracts(name, held, holder.id)), [name, held, holder])
  const similarIds = new Set(similar.map((c) => c.id))
  const rows = [...similar, ...active.filter((c) => !similarIds.has(c.id))].slice(0, HELD_ROWS)

  if (holder === undefined) {
    return (
      <Card title="Already held" shot="new-contract-held">
        <span style={{ fontSize: 13, color: neutral.mist }}>Choose the holder to see the Contracts it already has.</span>
      </Card>
    )
  }
  return (
    <Card
      title={<>{`${holder.name} already has`} <CountBadge count={active.length} hideAtZero={false} mono srNoun="Active Contracts" /></>}
      shot="new-contract-held"
    >
      {rows.length === 0 ? (
        <span style={{ fontSize: 13, color: neutral.mist }}>{`${holder.name} holds no Contract yet.`}</span>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {rows.map((c, i) => {
            const linked = c.linkedSurgeonIds.map((id) => surgeons[id]?.name ?? id)
            return (
              <li
                key={c.id}
                data-held-contract={c.id}
                {...(similarIds.has(c.id) ? { 'data-similar': '' } : {})}
                style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}`, fontSize: 13 }}
              >
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <TextAction size="sm" flush to={contractPath(c.id)} newTab style={{ whiteSpace: 'normal', textAlign: 'left' }}>{c.name}</TextAction>
                  <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{c.aaCode}</span>
                </span>
                <span style={{ fontSize: 12, color: neutral.slate }}>{[priceText(c, today), ...linked].join(' · ')}</span>
                {(similarIds.has(c.id) || c.status === 'disabled') && (
                  <span style={{ display: 'flex', gap: 6 }}>
                    {similarIds.has(c.id) && <Pill tone="warning" size="sm" shot="contract-similar-pill">Similar name</Pill>}
                    {c.status === 'disabled' && <Pill size="sm">Disabled</Pill>}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {active.length > 0 && (
        <TextAction size="sm" flush to={contractsPath({ holder: holder.id })} newTab shot="new-contract-held-all">{`See all ${active.length}`}</TextAction>
      )}
    </Card>
  )
}
