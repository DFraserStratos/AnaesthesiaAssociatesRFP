/**
 * The Parties tab of the Contracts section (catch-up Phase 18; build plan Phase
 * 48; US-04.1.5, D92): everyone who can hold a Contract, grouped by kind,
 * including Parties that hold none (an insurer or funder is also chosen as a
 * Booking's funder). Layout: docs/explorations/contracts-section.html #parties.
 * Each row shows the billing name, delivery and Active Contracts (opening the
 * catalogue at that holder, `contractsCatalogueLink`), and opens the Party's
 * page. New party is the page's one primary action: a side panel, create only.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { contractCountsByHolder } from '../../../../domain/billing/partyContracts'
import type { Party } from '../../../../domain/types'
import { useAppStore, type Actor } from '../../../../store'
import { DELIVERY_LABEL, PARTY_KIND_LABEL, PARTY_LIST_GROUPS } from '../../../../shared/contracts'
import { neutral } from '../../../../theme/tokens'
import { ClickableRow, GroupRow, RowOpenButton } from '../../../../shared/table'
import { Button, Pill, TextAction } from '../../../../shared/ui'
import { HistorySheet } from '../../../../shared/booking'
import { AdminPage, PageBody } from '../../components/AdminPage'
import { contractsCatalogueLink, partyPath } from '../../contractsPaths'
import { PartyPanel } from '../../flows/PartyPanel'
import { LoadResultBanner, MasterTable } from '../masters/chrome'
import { SEEDED_SUBTITLE } from '../masters/masterViews'
import { rowCellStyle } from '../masters/tableStyles'
import { ContractsTabs } from './ContractsSection'
import { CONTRACTS_TAB_SEEDED } from './contractsTabs'

const COLUMNS = ['Name', 'Billing name', 'Delivery', { label: 'Contracts', align: 'right' as const }, '']
const mist = { color: neutral.mist }

export function PartiesTab({ actor }: { actor: Actor }) {
  const parties = useAppStore((s) => s.masters.parties)
  const contracts = useAppStore((s) => s.masters.contracts)
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [history, setHistory] = useState<Party | null>(null)

  const groups = useMemo(
    () =>
      PARTY_LIST_GROUPS.map((g) => ({
        ...g,
        rows: Object.values(parties)
          .filter((p) => g.kinds.includes(p.kind))
          .sort((a, b) => a.name.localeCompare(b.name)),
      })).filter((g) => g.rows.length > 0),
    [parties],
  )
  const counts = useMemo(() => contractCountsByHolder(contracts), [contracts])

  return (
    <AdminPage
      mode="fit"
      shot="contracts-section"
      title="Contracts"
      sub={`Everyone who can hold a Contract, with the billing name and delivery its invoices use. ${SEEDED_SUBTITLE}`}
      actions={
        <Button variant="primary" size="desktop" shot="party-new" onClick={() => setCreating(true)}>
          New party
        </Button>
      }
      tabs={<ContractsTabs active="parties" />}
    >
      <PageBody gap={12}>
      <LoadResultBanner seeded={CONTRACTS_TAB_SEEDED.parties} />
      <MasterTable columns={COLUMNS} shot="parties" label="Parties">
        {groups.map((g) => [
          <GroupRow key={`g-${g.key}`} span={COLUMNS.length} data-party-group={g.key} style={{ paddingTop: 10, paddingBottom: 8 }}>
            <span style={{ fontWeight: 700, color: neutral.ink, marginRight: 8 }}>{g.label}</span>
            <Pill size="sm" mono>{g.rows.length}</Pill>
          </GroupRow>,
          ...g.rows.map((p) => {
            const active = counts.active.get(p.id) ?? 0
            const held = counts.held.get(p.id) ?? 0
            const open = () => navigate(partyPath(p.id))
            return (
              <ClickableRow key={p.id} data-party={p.id} data-party-kind={p.kind} onOpen={open}>
                <td style={{ ...rowCellStyle, fontWeight: 500 }}>
                  <RowOpenButton label={`Open ${p.name}`} onOpen={open}>{p.name}</RowOpenButton>
                  {g.kinds.length > 1 && <span style={{ ...mist, fontWeight: 400, marginLeft: 8 }}>{PARTY_KIND_LABEL[p.kind]}</span>}
                </td>
                <td style={rowCellStyle}>{p.billingName ?? <span style={mist}>·</span>}</td>
                <td style={rowCellStyle}>{p.deliveryMethod !== undefined ? DELIVERY_LABEL[p.deliveryMethod] : <span style={mist}>·</span>}</td>
                <td style={{ ...rowCellStyle, textAlign: 'right' }}>
                  {held === 0 ? (
                    <span style={mist}>None</span>
                  ) : (
                    <TextAction size="sm" flush to={contractsCatalogueLink({ holderId: p.id })} label={`Show the ${active} active Contracts ${p.name} holds`}>
                      <span className="mono">{active}</span> active
                    </TextAction>
                  )}
                </td>
                {/* A Party's audited edits with before and after (catch-up Phase 25, US-04.1.3): the shared History sheet. */}
                <td style={{ ...rowCellStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', gap: 12 }}>
                    <TextAction size="sm" flush onClick={() => setHistory(p)} label={`History of ${p.name}`}>History</TextAction>
                    <TextAction size="sm" flush to={partyPath(p.id)} label={`Open ${p.name}`}>Open</TextAction>
                  </span>
                </td>
              </ClickableRow>
            )
          }),
        ])}
      </MasterTable>
      </PageBody>
      <HistorySheet open={history !== null} entityIds={history !== null ? [history.id] : []} title={history !== null ? `History · ${history.name}` : 'Party history'} onClose={() => setHistory(null)} />
      {creating && <PartyPanel open actor={actor} onClose={() => setCreating(false)} onCreated={(p) => navigate(partyPath(p.id))} />}
    </AdminPage>
  )
}
