/**
 * Master data, Parties (catch-up Phase 18; US-04.1.5): everyone who holds
 * Contracts, one row each with its kind, billing name and delivery, and its
 * Active Contracts linking to the Contracts list filtered to it. Replaces the
 * Insurers and Organisations tabs (RV-39). A row opens the Party panel.
 */

import { isOfficeContract } from '../../../../domain/billing/fallbacks'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Party, PartyKind } from '../../../../domain/types'
import { useAppStore, type Actor } from '../../../../store'
import { DELIVERY_LABEL, PARTY_KIND_LABEL } from '../../../../shared/contracts'
import { neutral } from '../../../../theme/tokens'
import { PartyPanel } from '../../flows/PartyPanel'
import { Pill } from '../../components/MasterPills'
import { ClickableRow } from '../../../../shared/table'
import { MasterHeader, MasterTable } from './chrome'
import { TextAction } from '../../../../shared/ui'
import { HistorySheet } from '../../../../shared/booking'
import { rowCellStyle } from './tableStyles'

const KIND_ORDER: readonly PartyKind[] = ['aa', 'hospital', 'insurer', 'funder', 'surgeonGroup', 'surgeon', 'anaesthetist']
const mist = { color: neutral.mist }

export function PartiesView({ actor }: { actor: Actor }) {
  const parties = useAppStore((s) => s.masters.parties)
  const contracts = useAppStore((s) => s.masters.contracts)
  const [params, setParams] = useSearchParams()
  // `?party=<id>` opens that Party's panel (a loaded row's link from Seed load); the param is then dropped.
  const [panel, setPanel] = useState<{ party?: Party } | null>(() => {
    const p = parties[params.get('party') ?? '']
    return p !== undefined ? { party: p } : null
  })
  useEffect(() => {
    if (params.get('party') === null) return
    setParams((prev) => {
      const copy = new URLSearchParams(prev)
      copy.delete('party')
      return copy
    }, { replace: true })
  }, [params, setParams])
  const [history, setHistory] = useState<Party | null>(null)

  const rows = useMemo(
    () =>
      Object.values(parties).sort(
        (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.name.localeCompare(b.name),
      ),
    [parties],
  )
  const counts = useMemo(() => {
    const active = new Map<string, number>()
    const held = new Map<string, number>()
    for (const c of Object.values(contracts)) {
      // The system's Fixed price fallbacks are never counted as a Party's Contracts (catch-up Phase 18a).
      if (!isOfficeContract(c)) continue
      held.set(c.holderId, (held.get(c.holderId) ?? 0) + 1)
      if (c.status === 'active') active.set(c.holderId, (active.get(c.holderId) ?? 0) + 1)
    }
    return { active, held }
  }, [contracts])

  function showContracts(partyId: string) {
    setParams((prev) => {
      const copy = new URLSearchParams(prev)
      copy.set('view', 'contracts')
      copy.set('holder', partyId)
      return copy
    })
  }

  return (
    <>
      <MasterHeader
        title="Parties"
        sub="Everyone who holds Contracts: hospitals, insurers, funders, surgeons and surgeon groups, anaesthetists and AA. A Party's billing name and delivery are needed once a Contract bills it."
        add={{ label: 'Add Party', onClick: () => setPanel({}) }}
      />
      <MasterTable columns={['Name', 'Kind', 'Billing name', 'Delivery', 'Contracts', '']} rightAlign={[4, 5]} shot="parties" label="Parties">
        {rows.map((p) => {
          const count = counts.active.get(p.id) ?? 0
          const held = counts.held.get(p.id) ?? 0
          return (
            <ClickableRow
              key={p.id}
              data-party={p.id}
              onOpen={() => setPanel({ party: p })}
            >
              <td style={{ ...rowCellStyle, fontWeight: 500 }}>{p.name}</td>
              <td style={rowCellStyle}><Pill>{PARTY_KIND_LABEL[p.kind]}</Pill></td>
              <td style={rowCellStyle}>{p.billingName ?? <span style={mist}>·</span>}</td>
              <td style={rowCellStyle}>{p.deliveryMethod !== undefined ? DELIVERY_LABEL[p.deliveryMethod] : <span style={mist}>·</span>}</td>
              <td style={{ ...rowCellStyle, textAlign: 'right' }}>
                {held === 0 ? (
                  <span style={mist}>None</span>
                ) : (
                  <TextAction size="sm" flush onClick={() => showContracts(p.id)} label={`Show the Contracts ${p.name} holds`}>
                    <span className="mono">{count}</span> active
                  </TextAction>
                )}
              </td>
              {/* A Party's audited edits with before and after (catch-up Phase 25, US-04.1.3): the shared History sheet, as RVG groups have. */}
              <td style={{ ...rowCellStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', gap: 12 }}>
                  <TextAction size="sm" flush onClick={() => setHistory(p)} label={`History of ${p.name}`}>History</TextAction>
                  <TextAction size="sm" flush onClick={() => setPanel({ party: p })} label={p.kind === 'aa' ? `View ${p.name}` : `Edit ${p.name}`}>Edit</TextAction>
                </span>
              </td>
            </ClickableRow>
          )
        })}
      </MasterTable>
      <HistorySheet open={history !== null} entityIds={history !== null ? [history.id] : []} title={history !== null ? `History · ${history.name}` : 'Party history'} onClose={() => setHistory(null)} />
      {panel !== null && <PartyPanel key={panel.party?.id ?? 'new'} open actor={actor} party={panel.party !== undefined ? parties[panel.party.id] : undefined} onClose={() => setPanel(null)} />}
    </>
  )
}
