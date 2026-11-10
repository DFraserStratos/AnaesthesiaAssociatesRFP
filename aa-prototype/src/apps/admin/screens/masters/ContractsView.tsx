/**
 * Master data, Contracts (catch-up Phase 18; US-04.1.1, US-04.1.2, US-04.1.4,
 * US-04.2.1). One search over name, holder reference code and AA code, the
 * Active (default), Disabled or All filter and a holder Party filter (also
 * reached from a Party's "active" link as `?holder=`), results under holder
 * headings with No contract · RVG first. Office only (D42). Each row opens the
 * Contract editor; nothing is deleted. Hundreds of Contracts arrive with
 * Phase 19a, so the list is always searched, never browsed bare.
 */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { contractSearch, type ContractStatusFilter } from '../../../../domain/billing/contracts'
import type { Contract } from '../../../../domain/types'
import { useAppStore, type Actor } from '../../../../store'
import { Button, FieldLabel, Segmented } from '../../../../shared'
import { NameSearchBox } from '../../../../shared/ui'
import { BILLS_LABEL, PARTY_KIND_LABEL, STATUS_LABEL, pricingLabel } from '../../../../shared/contracts'
import { neutral } from '../../../../theme/tokens'
import { ContractPanel } from '../../flows/ContractEditSheet'
import { selectControlStyle } from '../../flows/fieldChrome'
import { Pill } from '../../components/MasterPills'
import { isInteractiveRowTarget } from '../../tableChrome'
import { EditCell, Header, Table, TextAction } from './chrome'
import { rowCellStyle } from './tableStyles'

const COLUMNS = ['AA code', 'Name', 'Bills', 'Pricing', 'Tags', 'Status', '']

export function ContractsView({ actor }: { actor: Actor }) {
  const contracts = useAppStore((s) => s.masters.contracts)
  const parties = useAppStore((s) => s.masters.parties)
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  // Active by default; a Party's link that holds only Disabled Contracts opens on All.
  const [status, setStatus] = useState<ContractStatusFilter>(() => {
    const h = params.get('holder')
    return h !== null && !Object.values(contracts).some((c) => c.holderId === h && c.status === 'active') ? 'all' : 'active'
  })
  const [panel, setPanel] = useState<{ id?: string } | null>(null)
  const holderParam = params.get('holder') ?? ''
  const holderId = parties[holderParam] !== undefined ? holderParam : ''

  function setHolder(next: string) {
    setParams((prev) => {
      const copy = new URLSearchParams(prev)
      if (next === '') copy.delete('holder')
      else copy.set('holder', next)
      return copy
    }, { replace: true })
  }

  const results = useMemo(
    () =>
      contractSearch(query, {
        contracts,
        parties,
        filters: { status, ...(holderId !== '' ? { holderId } : {}) },
      }),
    [query, contracts, parties, status, holderId],
  )
  const groups = useMemo(() => {
    const map = new Map<string, Contract[]>()
    for (const c of results) map.set(c.holderId, [...(map.get(c.holderId) ?? []), c])
    return [...map.entries()]
  }, [results])
  const holderOptions = useMemo(
    () => Object.values(parties).filter((p) => Object.values(contracts).some((c) => c.holderId === p.id)).sort((a, b) => a.name.localeCompare(b.name)),
    [parties, contracts],
  )

  const filtered = query.trim() !== '' || status !== 'active' || holderId !== ''

  return (
    <>
      <Header
        title="Contracts"
        sub="Every arrangement is a Contract held by a Party, with its own AA code, who it bills and how it is priced. Contracts are edited in place and disabled, never deleted; a change that must start on a date is a new Contract."
        action={<Button variant="secondary" onClick={() => setPanel({})}>New contract</Button>}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div data-shot="contract-search" style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Search</FieldLabel>
          <NameSearchBox value={query} onChange={setQuery} label="Search by name, code or AA code" />
          <div data-shot="contract-result-count" style={{ fontSize: 12.5, color: neutral.slate }}>
            <span className="mono">{results.length}</span> {results.length === 1 ? 'Contract' : 'Contracts'}
            {status === 'active' ? ' active' : status === 'disabled' ? ' disabled' : ''}
            {holderId !== '' ? ` held by ${parties[holderId]?.name ?? holderId}` : ''}
            {query.trim() !== '' ? ` matching "${query.trim()}"` : ''}
          </div>
        </div>
        <div data-shot="contract-status-filter" style={{ width: 280 }}>
          <Segmented
            label="Status"
            value={status}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'disabled', label: 'Disabled' },
              { value: 'all', label: 'All' },
            ]}
            onChange={setStatus}
          />
        </div>
        <label data-shot="contract-holder-filter" style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Holder</FieldLabel>
          <select value={holderId} onChange={(e) => setHolder(e.target.value)} style={selectControlStyle}>
            <option value="">Every holder</option>
            {holderOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      </div>

      {results.length === 0 ? (
        <div data-shot="contract-catalogue" style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 14, padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No Contracts match.</div>
          <div style={{ fontSize: 13, color: neutral.slate }}>Check the spelling, or search all Contracts, Disabled ones included.</div>
          {filtered && (
            <TextAction
              onClick={() => {
                setQuery('')
                setStatus('all')
                setHolder('')
              }}
            >
              Search all Contracts
            </TextAction>
          )}
        </div>
      ) : (
        <Table heads={COLUMNS} rightAlign={[6]} shot="contract-catalogue">
          {groups.map(([holder, list]) => {
            const party = parties[holder]
            return [
              <tr key={`h-${holder}`} data-contract-holder={holder}>
                <td colSpan={COLUMNS.length} style={{ ...rowCellStyle, background: neutral.bg, paddingTop: 10, paddingBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: neutral.ink, marginRight: 8 }}>{party?.name ?? holder}</span>
                  {party !== undefined && party.kind !== 'aa' && <Pill>{PARTY_KIND_LABEL[party.kind]}</Pill>}
                </td>
              </tr>,
              ...list.map((c) => (
                <tr
                  key={c.id}
                  data-contract={c.id}
                  className="aa-clickable-table-row"
                  onClick={(event) => {
                    if (!isInteractiveRowTarget(event.target)) setPanel({ id: c.id })
                  }}
                >
                  <td className="mono" style={{ ...rowCellStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>{c.aaCode}</td>
                  <td style={{ ...rowCellStyle, fontWeight: 500 }}>
                    {c.name}
                    {c.holderReference !== undefined && <span className="mono" style={{ color: neutral.mist, marginLeft: 8 }}>{c.holderReference}</span>}
                  </td>
                  <td style={rowCellStyle}>{BILLS_LABEL[c.billsTo]}</td>
                  <td style={rowCellStyle}><PricingText contract={c} /></td>
                  <td style={rowCellStyle}>
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      {c.prepaid && <Pill>Prepaid</Pill>}
                      {c.anaesthetistMayOverridePrice && <Pill>Override</Pill>}
                    </span>
                  </td>
                  <td style={rowCellStyle}>
                    <Pill tone={c.status === 'active' ? 'success' : 'neutral'}>{STATUS_LABEL[c.status]}</Pill>
                  </td>
                  <EditCell onClick={() => setPanel({ id: c.id })} label={`Edit ${c.name}`} style={rowCellStyle} />
                </tr>
              )),
            ]
          })}
        </Table>
      )}

      {panel !== null && (
        <ContractPanel
          key={panel.id ?? 'new'}
          open
          actor={actor}
          contract={panel.id !== undefined ? contracts[panel.id] : undefined}
          {...(panel.id === undefined && holderId !== '' ? { initialHolderId: holderId } : {})}
          onClose={() => setPanel(null)}
        />
      )}
    </>
  )
}

/** The pricing phrase, with money in mono tabular figures. */
function PricingText({ contract }: { contract: Contract }) {
  const p = contract.pricing
  if (p.kind === 'rvgContractRate') {
    return (
      <span>
        RVG at <span className="mono">${p.unitRate.toFixed(2)}</span> per unit
      </span>
    )
  }
  if (p.kind === 'rvgDiscount') {
    return (
      <span>
        RVG less <span className="mono">{p.discountPct}%</span>
      </span>
    )
  }
  return <span>{pricingLabel(p)}</span>
}
