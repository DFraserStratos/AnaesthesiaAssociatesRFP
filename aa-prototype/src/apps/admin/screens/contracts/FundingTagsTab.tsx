/**
 * The Funding tags tab of the Contracts section (catch-up Phase 18a; build
 * plan Phase 48; US-13.4.5, D92): who funds a hospital's work, such as SXAP,
 * HNZ and ACC. Layout: docs/explorations/contracts-section.html #tagstab.
 *
 * The list order is the order the step rail shows a hospital's tags (Up and
 * Down); each tag may name its insurer or funder Party; add, edit and remove
 * are the store's audited actions, and a tag any Contract carries cannot be
 * removed (the store's sentence shows). The Contracts column counts Active
 * office Contracts carrying the tag.
 *
 * Picking a tag (`?tag=`, replace; the first tag when absent) shows its
 * Contracts grouped by hospital with each hospital's count and its place on
 * the step rail, each opening the catalogue at that hospital narrowed by the
 * tag (`contractsCatalogueLink`), and "Not under a hospital" last.
 */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fundingTagsInOrder, type FundingTag } from '../../../../domain/billing/fundingTags'
import { tagContractsByHospital } from '../../../../domain/billing/partyContracts'
import { moveFundingTagInList, removeFundingTag, useAppStore, type Actor } from '../../../../store'
import { HistorySheet } from '../../../../shared/booking'
import { ClickableRow, RowOpenButton, TableShell, Td, Th } from '../../../../shared/table'
import { Button, Card, CountBadge, EmptyState, FieldHint, FormError, TextAction } from '../../../../shared/ui'
import { neutral } from '../../../../theme/tokens'
import { AdminPage, PageBody } from '../../components/AdminPage'
import { contractsCatalogueLink } from '../../contractsPaths'
import { FundingTagSheet } from '../../flows/FundingTagSheet'
import { LoadResultBanner, MasterTable } from '../masters/chrome'
import { SEEDED_SUBTITLE } from '../masters/masterViews'
import { cellStyle } from '../masters/tableStyles'
import { ContractsTabs } from './ContractsSection'
import { CONTRACTS_TAB_SEEDED } from './contractsTabs'

const COLUMNS = ['Tag', 'Funder', { label: 'Contracts', align: 'right' as const }, '']

export function FundingTagsTab({ actor }: { actor: Actor }) {
  const tags = useAppStore((s) => s.masters.fundingTags)
  const contracts = useAppStore((s) => s.masters.contracts)
  const parties = useAppStore((s) => s.masters.parties)
  const [params, setParams] = useSearchParams()
  const [sheet, setSheet] = useState<{ tag?: FundingTag } | null>(null)
  const [history, setHistory] = useState<FundingTag | null>(null)
  const [error, setError] = useState<string | null>(null)
  const rows = useMemo(() => fundingTagsInOrder(tags), [tags])
  const picked = tags[params.get('tag') ?? ''] ?? rows[0]

  const totals = useMemo(() => new Map(rows.map((t) => [t.id, tagContractsByHospital(contracts, parties, tags, t.id).total])), [rows, contracts, parties, tags])

  function act(outcome: { ok: boolean; message?: string }) {
    setError(outcome.ok ? null : (outcome.message ?? null))
  }

  function pick(tag: FundingTag) {
    setParams((prev) => {
      const copy = new URLSearchParams(prev)
      copy.set('tag', tag.id)
      return copy
    }, { replace: true })
  }

  return (
    <AdminPage
      mode="fluid"
      shot="contracts-section"
      title="Contracts"
      sub={`Who funds a hospital's work. A Contract carries at most one tag; a hospital's tags show on the step rail in this order. ${SEEDED_SUBTITLE}`}
      actions={
        <Button variant="primary" size="desktop" shot="funding-tag-add" onClick={() => { setError(null); setSheet({}) }}>
          Add funding tag
        </Button>
      }
      tabs={<ContractsTabs active="fundingTags" />}
    >
      <PageBody gap={12}>
        <LoadResultBanner seeded={CONTRACTS_TAB_SEEDED.fundingTags} />
        <FormError message={error} />
        <MasterTable columns={COLUMNS} shot="masters-funding-tags" label="Funding tags in step rail order">
          {rows.map((t, i) => {
            const funder = t.funderPartyId !== undefined ? parties[t.funderPartyId] : undefined
            const selected = picked?.id === t.id
            return (
              <ClickableRow key={t.id} data-tag={t.id} {...(selected ? { 'data-tag-selected': 'true' } : {})} selected={selected} onOpen={() => pick(t)}>
                <td className="mono" style={{ ...cellStyle, fontWeight: 600 }}>
                  <RowOpenButton label={`Show the Contracts under ${t.code}`} onOpen={() => pick(t)}>{t.code}</RowOpenButton>
                </td>
                <td style={cellStyle}>{funder !== undefined ? funder.name : <span style={{ color: neutral.mist }}>No funder named</span>}</td>
                <td className="mono" style={{ ...cellStyle, textAlign: 'right' }}>{totals.get(t.id) ?? 0}</td>
                <td style={{ ...cellStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', gap: 12 }}>
                    <TextAction size="sm" flush disabled={i === 0} onClick={() => act(moveFundingTagInList(useAppStore, actor, t.id, 'up'))} label={`Move ${t.code} up`}>Up</TextAction>
                    <TextAction size="sm" flush disabled={i === rows.length - 1} onClick={() => act(moveFundingTagInList(useAppStore, actor, t.id, 'down'))} label={`Move ${t.code} down`}>Down</TextAction>
                    <TextAction size="sm" flush onClick={() => setHistory(t)} label={`History of ${t.code}`}>History</TextAction>
                    <TextAction size="sm" flush onClick={() => { setError(null); setSheet({ tag: t }) }} label={`Edit ${t.code}`}>Edit</TextAction>
                    <TextAction size="sm" flush onClick={() => act(removeFundingTag(useAppStore, actor, t.id))} label={`Remove ${t.code}`}>Remove</TextAction>
                  </span>
                </td>
              </ClickableRow>
            )
          })}
        </MasterTable>
        {picked !== undefined && <TagContracts tag={picked} />}
      </PageBody>
      {sheet !== null && <FundingTagSheet key={sheet.tag?.id ?? 'new'} tag={sheet.tag} actor={actor} onClose={() => setSheet(null)} />}
      <HistorySheet open={history !== null} entityIds={history !== null ? [history.id] : []} title="Funding tag history" onClose={() => setHistory(null)} />
    </AdminPage>
  )
}

/** A picked tag's Contracts by hospital, each opening the catalogue at that hospital narrowed by the tag. */
function TagContracts({ tag }: { tag: FundingTag }) {
  const contracts = useAppStore((s) => s.masters.contracts)
  const parties = useAppStore((s) => s.masters.parties)
  const tags = useAppStore((s) => s.masters.fundingTags)
  const spread = useMemo(() => tagContractsByHospital(contracts, parties, tags, tag.id), [contracts, parties, tags, tag.id])
  return (
    <Card
      title={<>Contracts under <span className="mono">{tag.code}</span> <CountBadge count={spread.total} hideAtZero={false} mono srNoun="active Contracts" /></>}
      shot="tag-contracts"
      data-tag={tag.id}
    >
      {spread.total === 0 ? (
        <EmptyState title="No Contract carries this tag yet." />
      ) : (
        <TableShell label={`Contracts under ${tag.code}, by hospital`} density="dense">
          <thead>
            <tr>
              <Th>Hospital</Th>
              <Th align="right">Contracts</Th>
              <Th>On the step rail</Th>
              <Th align="right" />
            </tr>
          </thead>
          <tbody>
            {spread.hospitals.map((h) => {
              const name = parties[h.partyId]?.name ?? h.partyId
              return (
                <tr key={h.partyId} data-hospital={h.partyId}>
                  <Td bold nowrap>{name}</Td>
                  <Td align="right" mono>{h.count}</Td>
                  <Td>{`${name} › ${tag.code}`}</Td>
                  <Td align="right">
                    <TextAction size="sm" flush to={contractsCatalogueLink({ holderId: h.partyId, tagId: tag.id })} label={`View the ${h.count} ${tag.code} Contracts ${name} holds`}>View Contracts</TextAction>
                  </Td>
                </tr>
              )
            })}
            <tr data-hospital="none">
              <Td bold>Not under a hospital</Td>
              <Td align="right" mono>{spread.notUnderHospital}</Td>
              <Td><span style={{ color: neutral.mist }}>Tagged Contracts that bill a surgeon group or the payer sit elsewhere; the tag is only a label on them</span></Td>
              <Td align="right">
                {spread.notUnderHospital > 0 && (
                  <TextAction size="sm" flush to={contractsCatalogueLink({ tagId: tag.id })} label={`View every ${tag.code} Contract`}>View Contracts</TextAction>
                )}
              </Td>
            </tr>
          </tbody>
        </TableShell>
      )}
      <FieldHint>A tag can't be removed while a Contract carries it. Renaming the code or changing its funder is audited.</FieldHint>
    </Card>
  )
}
