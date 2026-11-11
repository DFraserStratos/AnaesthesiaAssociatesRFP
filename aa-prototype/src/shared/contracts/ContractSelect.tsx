/**
 * The office's Contract choice on a Procedure (catch-up Phase 18; US-04.3.2):
 * No contract · RVG first, then every Active Contract as "<AA code> · <name>"
 * under its holder Party. A Disabled Contract shows only when it is already
 * the Procedure's, marked "(disabled)", so a Procedure keeps it (D81).
 * Narrowing by the Booking is Phase 20's step rail. Shared by the office
 * billing setup and the billing monitor's "Choose a Contract".
 */

import { contractChoosableForProcedure } from '../../domain/billing/fallbacks'
import { useMemo, type CSSProperties } from 'react'
import { contractSearch } from '../../domain/billing/contracts'
import { useAppStore } from '../../store'
import { FieldLabel } from '../ui'
import { contractLabel } from './labels'

interface ContractSelectProps {
  value: string
  onChange: (contractId: string) => void
  selectStyle: CSSProperties
  label?: string
  /** The empty choice's words; omit to require a Contract. */
  emptyLabel?: string
  shot?: string
  /** Only these Contracts (and the current one) are listed (the step rail's candidate rule, catch-up Phase 20). */
  allowed?: (contractId: string) => boolean
}

export function ContractSelect({ value, onChange, selectStyle, label = 'Governing contract', emptyLabel, shot, allowed }: ContractSelectProps) {
  const contracts = useAppStore((s) => s.masters.contracts)
  const parties = useAppStore((s) => s.masters.parties)

  const groups = useMemo(() => {
    // Never an open-price fallback (catch-up Phase 18a): it has no price of its
    // own, and Phase 20's "Other price" picks one with the amount typed.
    const listed = contractSearch('', { contracts, parties, filters: { status: 'all' } }).filter(
      (c) => (c.status === 'active' || c.id === value) && contractChoosableForProcedure(c) && (allowed === undefined || c.id === value || allowed(c.id)),
    )
    const system = listed.filter((c) => c.systemRole !== undefined)
    const byHolder = new Map<string, typeof listed>()
    for (const c of listed) {
      if (c.systemRole !== undefined) continue
      const name = parties[c.holderId]?.name ?? c.holderId
      byHolder.set(name, [...(byHolder.get(name) ?? []), c])
    }
    return { system, byHolder: [...byHolder.entries()] }
  }, [contracts, parties, value, allowed])

  const option = (c: (typeof groups.system)[number]) => (
    <option key={c.id} value={c.id}>
      {contractLabel(c, { withStatus: true })}
    </option>
  )

  return (
    <label data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <FieldLabel>{label}</FieldLabel>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
        {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
        {emptyLabel === undefined && value === '' && <option value="" disabled>Choose a Contract</option>}
        {groups.system.map(option)}
        {groups.byHolder.map(([holder, list]) => (
          <optgroup key={holder} label={holder}>
            {list.map(option)}
          </optgroup>
        ))}
      </select>
    </label>
  )
}
