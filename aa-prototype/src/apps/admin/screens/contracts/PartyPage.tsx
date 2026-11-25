/**
 * A Party's page (build plan Phase 48; US-04.1.5, D92):
 * `/admin/contracts/parties/:partyId`, on the Admin profile frame
 * (`ProfilePage`, fluid) with the rail. Layout: docs/explorations/
 * contracts-section.html #parties.
 *
 * - **Details**, edited in place on the shared Card's editing variant over
 *   `PartyFormFields`: Save sends `editParty` (one audited `party.update`);
 *   the store's `partyRefusal` sentence shows on the card and nothing changes.
 *   Anaesthesia Associates reads the same page with no Edit.
 * - **Its Contracts**, counted by funding tag in the step rail's order, No tag
 *   last, then Disabled (`partyContractCounts`); each count opens the
 *   catalogue at exactly those Contracts (`contractsCatalogueLink`).
 * - The rail: **On the step rail**, where its Contracts sit
 *   (`partyStepRailPlaces`), and **History**, the shared History sheet.
 *
 * "New contract for this party" opens the New contract page with the holder set.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NO_TAG, partyContractCounts, partyStepRailPlaces, type StepRailPlace } from '../../../../domain/billing/partyContracts'
import type { Party } from '../../../../domain/types'
import { DELIVERY_LABEL, PARTY_KIND_LABEL } from '../../../../shared/contracts'
import { HistorySheet } from '../../../../shared/booking'
import { TableShell, Td, Th } from '../../../../shared/table'
import { Button, Card, CountBadge, DefList, DefRow, EmptyState, FormError, Notice, Pill, TextAction, visuallyHidden } from '../../../../shared/ui'
import { editParty, partyContractFacts, useAppStore, type Actor } from '../../../../store'
import { neutral } from '../../../../theme/tokens'
import { PageBody } from '../../components/AdminPage'
import { PROFILE_CARD, ProfilePage } from '../../components/ProfileChrome'
import { contractsCatalogueLink, newContractPath, partiesPath } from '../../contractsPaths'
import { partyDraftFrom, partyFieldsOf, PartyFormFields, type PartyDraft } from '../../flows/PartyFormFields'

/** A label and value row on the Details card (contracts-section.html #parties `.kv`). */
const KV = { layout: 'inline', labelWidth: 150, labelTone: 'slate' } as const

/** The read-only sentence on Anaesthesia Associates' page. */
export const AA_PARTY_SENTENCE = 'Anaesthesia Associates holds No contract · RVG. It is never billed, and its record cannot be changed.'

/** "Email · accounts@...", "Post · 12 High St", or "Not set". */
function deliveryText(party: Party): string {
  if (party.deliveryMethod === 'email') return `${DELIVERY_LABEL.email} · ${party.email ?? 'no address'}`
  if (party.deliveryMethod === 'post') return `${DELIVERY_LABEL.post} · ${party.postalAddress ?? 'no address'}`
  return 'Not set'
}

export function PartyPage({ partyId, actor }: { partyId: string; actor: Actor }) {
  const party = useAppStore((s) => s.masters.parties[partyId])!
  const contracts = useAppStore((s) => s.masters.contracts)
  const navigate = useNavigate()
  const tags = useAppStore((s) => s.masters.fundingTags)
  const counts = useMemo(() => partyContractCounts(contracts, tags, partyId), [contracts, tags, partyId])
  const isAa = party.kind === 'aa'
  const meta = [`Holds ${counts.total} ${counts.total === 1 ? 'Contract' : 'Contracts'}`]
  if (party.deliveryMethod !== undefined) meta.push(`invoices by ${DELIVERY_LABEL[party.deliveryMethod].toLowerCase()}`)

  return (
    <ProfilePage
      shot="party-page"
      back={{ label: 'Parties', to: partiesPath() }}
      name={party.name}
      chip={<Pill shot="party-kind">{PARTY_KIND_LABEL[party.kind]}</Pill>}
      sub={meta.join(' · ')}
      action={
        <Button variant="primary" size="desktop" shot="party-new-contract" onClick={() => navigate(newContractPath({ holder: partyId }))}>
          New contract for this party
        </Button>
      }
    >
      <PageBody
        railLabel="On the step rail"
        rail={
          <>
            <StepRailCard partyId={partyId} />
            <HistoryCard party={party} />
          </>
        }
      >
        {isAa ? <AaDetails party={party} /> : <DetailsCard party={party} actor={actor} />}
        <ItsContractsCard partyId={partyId} />
      </PageBody>
    </ProfilePage>
  )
}

/** The Details card: read as label and value rows; Edit opens the Party's fields on the card, Save and Cancel in its footer. */
function DetailsCard({ party, actor }: { party: Party; actor: Actor }) {
  const masters = useAppStore((s) => s.masters)
  const facts = useMemo(() => partyContractFacts({ masters }, party.id), [masters, party.id])
  const [draft, setDraft] = useState<PartyDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hospital = party.hospitalId !== undefined ? masters.hospitals[party.hospitalId] : undefined

  function save() {
    if (draft === null) return
    const outcome = editParty(useAppStore, actor, party.id, partyFieldsOf(draft, draft.codePrefix))
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setDraft(null)
    setError(null)
  }

  const editing = draft !== null
  return (
    <Card
      style={PROFILE_CARD}
      title="Details"
      shot="party-details"
      editing={editing}
      {...(!editing
        ? {
            action: (
              <TextAction size="sm" flush shot="party-details-edit" label={`Edit the details of ${party.name}`} onClick={() => { setDraft(partyDraftFrom(party)); setError(null) }}>
                Edit
              </TextAction>
            ),
          }
        : {
            footer: (
              <>
                <Button variant="secondary" size="compact" shot="party-details-cancel" onClick={() => { setDraft(null); setError(null) }}>Cancel</Button>
                <Button variant="primary" size="compact" shot="party-details-save" onClick={save}>Save</Button>
              </>
            ),
          })}
    >
      {draft === null ? (
        <DefList gap={10}>
          <DefRow {...KV} label="Short name" note="What the step rail shows">{party.name}</DefRow>
          <DefRow {...KV} label="Kind">{hospital !== undefined ? `${PARTY_KIND_LABEL[party.kind]} · ${hospital.name}` : PARTY_KIND_LABEL[party.kind]}</DefRow>
          <DefRow {...KV} label="Billing name">{party.billingName ?? <span style={{ color: neutral.mist }}>Not set</span>}</DefRow>
          <DefRow {...KV} label="Invoices by">{deliveryText(party)}</DefRow>
          <DefRow {...KV} label="Code prefix" mono>{party.codePrefix}</DefRow>
        </DefList>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <PartyFormFields
            draft={draft}
            onChange={setDraft}
            party={party}
            holdsContracts={facts.holdsContracts}
            billedByAContract={facts.billedByAContract}
            codePrefix={draft.codePrefix}
          />
        </div>
      )}
      <FormError message={error} shot="party-details-error" />
    </Card>
  )
}

/** Anaesthesia Associates: the same Details, never edited. */
function AaDetails({ party }: { party: Party }) {
  return (
    <Card style={PROFILE_CARD} title="Details" shot="party-details">
      <Notice tone="neutral" shot="party-aa-note">{AA_PARTY_SENTENCE}</Notice>
      <DefList gap={10}>
        <DefRow {...KV} label="Short name">{party.name}</DefRow>
        <DefRow {...KV} label="Code prefix" mono>{party.codePrefix}</DefRow>
      </DefList>
    </Card>
  )
}

/** Its Contracts, counted by funding tag (No tag last, then Disabled), each count opening the catalogue at those Contracts. */
function ItsContractsCard({ partyId }: { partyId: string }) {
  const contracts = useAppStore((s) => s.masters.contracts)
  const tags = useAppStore((s) => s.masters.fundingTags)
  const parties = useAppStore((s) => s.masters.parties)
  const counts = useMemo(() => partyContractCounts(contracts, tags, partyId), [contracts, tags, partyId])
  const name = parties[partyId]?.name ?? partyId
  return (
    <Card
      style={PROFILE_CARD}
      title={<>Its Contracts <CountBadge count={counts.total} hideAtZero={false} mono srNoun="active Contracts" /></>}
      shot="party-contracts-by-tag"
      {...(counts.total + counts.disabled > 0
        ? { action: <TextAction size="sm" flush to={contractsCatalogueLink({ holderId: partyId })} shot="party-open-in-contracts">Open in Contracts</TextAction> }
        : {})}
    >
      {counts.total + counts.disabled === 0 ? (
        <EmptyState title="Holds no Contracts">{`${name} can still be chosen as a Booking's funder. New contract for this party gives it one.`}</EmptyState>
      ) : (
        <TableShell label={`Contracts ${name} holds, by funding tag`} density="dense">
          <thead>
            <tr>
              <Th>Funding tag</Th>
              <Th>Funder</Th>
              <Th align="right">Contracts</Th>
              <Th align="right"><span style={visuallyHidden}>View</span></Th>
            </tr>
          </thead>
          <tbody>
            {counts.byTag.map((row) => {
              const tag = row.tagId !== NO_TAG ? tags[row.tagId] : undefined
              const funder = tag?.funderPartyId !== undefined ? parties[tag.funderPartyId] : undefined
              const label = row.tagId === NO_TAG ? 'No tag' : (tag?.code ?? row.tagId)
              return (
                <tr key={row.tagId} data-party-tag={row.tagId}>
                  <Td><Pill size="sm" mono={row.tagId !== NO_TAG}>{label}</Pill></Td>
                  <Td>{funder !== undefined ? funder.name : <span style={{ color: neutral.mist }}>·</span>}</Td>
                  <Td align="right" mono>{row.count}</Td>
                  <Td align="right">
                    <TextAction size="sm" flush to={contractsCatalogueLink({ holderId: partyId, tagId: row.tagId })} label={`View the ${row.count} ${label} Contracts`}>View</TextAction>
                  </Td>
                </tr>
              )
            })}
            {counts.disabled > 0 && (
              <tr data-party-tag="disabled">
                <Td><Pill size="sm">Disabled</Pill></Td>
                <Td><span style={{ color: neutral.mist }}>Hidden from the Contract list unless asked for</span></Td>
                <Td align="right" mono>{counts.disabled}</Td>
                <Td align="right">
                  <TextAction size="sm" flush to={contractsCatalogueLink({ holderId: partyId, status: 'disabled' })} label={`View the ${counts.disabled} Disabled Contracts`}>View</TextAction>
                </Td>
              </tr>
            )}
          </tbody>
        </TableShell>
      )}
    </Card>
  )
}

/** One place on step 1 of the step rail, in the rail's words: "Christchurch Eye Surgery › SXAP", "Special › Mr P. Doyle". */
function placeLabel(place: StepRailPlace, names: { party: (id: string) => string; tag: (id: string) => string }): string {
  const d = place.destination
  if (d.kind === 'hospital') return `${names.party(d.holderPartyId)} › ${names.tag(d.fundingTagId)}`
  if (d.kind === 'special') return `Special › ${names.party(d.holderPartyId)}`
  return d.prepaid ? 'Patient › Prepaid' : 'Patient'
}

function StepRailCard({ partyId }: { partyId: string }) {
  const contracts = useAppStore((s) => s.masters.contracts)
  const parties = useAppStore((s) => s.masters.parties)
  const tags = useAppStore((s) => s.masters.fundingTags)
  const places = useMemo(() => partyStepRailPlaces(contracts, parties, tags, partyId), [contracts, parties, tags, partyId])
  const names = { party: (id: string) => parties[id]?.name ?? id, tag: (id: string) => tags[id]?.code ?? id }
  return (
    <Card title="On the step rail" shot="party-step-rail">
      {places.length === 0 ? (
        <span style={{ fontSize: 13, color: neutral.mist }}>None of its Contracts is offered yet.</span>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {places.map((p, i) => (
            <li key={p.key} data-step-rail-place={p.key} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}`, fontSize: 13 }}>
              <span style={{ color: neutral.ink, fontWeight: 500 }}>{placeLabel(p, names)}</span>
              <span style={{ fontSize: 12, color: neutral.slate }}>
                <span className="mono">{p.count}</span> {p.count === 1 ? 'Contract' : 'Contracts'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/** The Party's audited changes, newest first, in the shared History sheet. */
function HistoryCard({ party }: { party: Party }) {
  const changes = useAppStore((s) => s.audit.filter((a) => a.entityId === party.id).length)
  const [open, setOpen] = useState(false)
  return (
    <Card title="History" shot="party-history">
      <span style={{ fontSize: 13, color: neutral.slate }}>
        <span className="mono">{changes}</span> {changes === 1 ? 'change recorded' : 'changes recorded'}
      </span>
      {changes > 0 && (
        <TextAction size="sm" flush shot="party-history-open" onClick={() => setOpen(true)}>See history</TextAction>
      )}
      <HistorySheet open={open} entityIds={[party.id]} title={`History · ${party.name}`} onClose={() => setOpen(false)} />
    </Card>
  )
}
