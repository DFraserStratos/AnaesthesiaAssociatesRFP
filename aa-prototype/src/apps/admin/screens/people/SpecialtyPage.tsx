/**
 * A specialty's page (build plan Phase 56; US-13.4.4 Specialty page; D99, D104), at
 * `/admin/people/specialties/:specialtyId`, reached from the Specialties tab. On the shared record
 * pattern: the Name card edited and saved on its own (one audited `specialty.update`, which every
 * surgeon and Contract holding it reads by id), the surgeons who hold it and the Contracts that carry
 * it, each counted and opening its page. The side panel says who holds it, holds Remove (refused in
 * place with the store's sentence while anything holds it) and the History. Who holds it comes from
 * one pure place, `specialtyHolders`, so the lists, the counts and Remove's refusal agree.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { specialtyHolders, specialtyUsage, specialtyUsageText } from '../../../../domain/specialties'
import { removeSpecialty, renameSpecialty, useAppStore, type Actor } from '../../../../store'
import { ClickableRow, TableShell, Td, Th } from '../../../../shared/table'
import { Card, CountBadge, EditableCard, EmptyState, FormError, Pill, TextAction, TextField, useCardEdit } from '../../../../shared/ui'
import { ConfirmSheet } from '../../../../shared/surface'
import { HistorySheet } from '../../../../shared/booking'
import { neutral } from '../../../../theme/tokens'
import { PageBody } from '../../components/AdminPage'
import { PROFILE_CARD, ProfilePage } from '../../components/ProfileChrome'
import { peoplePath, surgeonProfilePath } from '../../peoplePaths'
import { contractPath } from '../../contractsPaths'

const mist = { color: neutral.mist }

export function SpecialtyPage({ specialtyId, actor }: { specialtyId: string; actor: Actor }) {
  const specialty = useAppStore((s) => s.masters.specialties[specialtyId])
  const specialties = useAppStore((s) => s.masters.specialties)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const contracts = useAppStore((s) => s.masters.contracts)
  const parties = useAppStore((s) => s.masters.parties)
  const fundingTags = useAppStore((s) => s.masters.fundingTags)
  // Derived once per render, never inside a row (165 surgeons, about 343 Contracts at practice scale).
  const held = useMemo(
    () => specialtyHolders({ specialties, surgeons, contracts, parties, fundingTags }, specialtyId),
    [specialties, surgeons, contracts, parties, fundingTags, specialtyId],
  )
  if (specialty === undefined) return null
  const usage = { surgeons: held.surgeons.length, contracts: held.contracts.length }
  const heldBy = usage.surgeons + usage.contracts === 0 ? 'Held by no surgeon or Contract' : `Held by ${specialtyUsageText(usage)}`

  return (
    <ProfilePage shot="specialty-page" back={{ label: 'Specialties', to: peoplePath('specialties') }} name={specialty.name} sub={heldBy}>
      <PageBody railLabel="Remove and history" rail={<SpecialtyRail specialtyId={specialtyId} name={specialty.name} heldBy={heldBy} actor={actor} />}>
        <NameCard specialtyId={specialtyId} name={specialty.name} actor={actor} />
        <SurgeonsCard rows={held.surgeons} />
        <ContractsCard rows={held.contracts} />
      </PageBody>
    </ProfilePage>
  )
}

function NameCard({ specialtyId, name, actor }: { specialtyId: string; name: string; actor: Actor }) {
  const edit = useCardEdit<string, string>(
    () => name,
    (next) => {
      const outcome = renameSpecialty(useAppStore, actor, specialtyId, next)
      return outcome.ok ? { ok: true } : { ok: false, message: outcome.message }
    },
  )
  const draft = edit.draft
  return (
    <EditableCard style={PROFILE_CARD} title="Name" shot="specialty-name" editable editing={draft !== null} onEdit={edit.start} onCancel={edit.cancel} onSave={() => draft !== null && edit.save(draft)} error={edit.error}>
      {draft === null ? (
        <span style={{ fontSize: 15, fontWeight: 600 }}>{name}</span>
      ) : (
        <TextField label="Name" value={draft} onChange={edit.setDraft} placeholder="e.g. Paediatric surgery" hint="Every surgeon and Contract holding it shows the new name." />
      )}
    </EditableCard>
  )
}

function SurgeonsCard({ rows }: { rows: ReturnType<typeof specialtyHolders>['surgeons'] }) {
  const navigate = useNavigate()
  return (
    <Card style={PROFILE_CARD} title={<>Surgeons <CountBadge count={rows.length} hideAtZero={false} mono srNoun="surgeons hold it" /></>} shot="specialty-surgeons">
      {rows.length === 0 ? (
        <EmptyState title="No surgeon holds this specialty yet." />
      ) : (
        <TableShell label="Surgeons who hold this specialty" density="dense" nested>
          <thead>
            <tr>
              <Th>Surgeon</Th>
              <Th>Practice</Th>
              <Th>Also holds</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ surgeon, alsoHolds, retired }) => (
              <ClickableRow key={surgeon.id} data-surgeon={surgeon.id} onOpen={() => navigate(surgeonProfilePath(surgeon.id))}>
                <Td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <TextAction size="sm" flush to={surgeonProfilePath(surgeon.id)}>{surgeon.name}</TextAction>
                    {retired && <Pill size="sm">Retired</Pill>}
                  </span>
                </Td>
                <Td>{surgeon.practiceName ?? <span style={mist}>Not recorded</span>}</Td>
                <Td>{alsoHolds !== '' ? alsoHolds : <span style={mist}>·</span>}</Td>
              </ClickableRow>
            ))}
          </tbody>
        </TableShell>
      )}
    </Card>
  )
}

function ContractsCard({ rows }: { rows: ReturnType<typeof specialtyHolders>['contracts'] }) {
  const navigate = useNavigate()
  return (
    <Card style={PROFILE_CARD} title={<>Contracts <CountBadge count={rows.length} hideAtZero={false} mono srNoun="Contracts carry it" /></>} shot="specialty-contracts">
      {rows.length === 0 ? (
        <EmptyState title="No Contract is limited to this specialty." />
      ) : (
        <TableShell label="Contracts that carry this specialty" density="dense" nested>
          <thead>
            <tr>
              <Th>Contract</Th>
              <Th>Held by</Th>
              <Th>Funding tag</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ contract, holderName, fundingTagCode, disabled }) => (
              <ClickableRow key={contract.id} data-contract={contract.id} onOpen={() => navigate(contractPath(contract.id))}>
                <Td>
                  <TextAction size="sm" flush to={contractPath(contract.id)} style={{ whiteSpace: 'normal', textAlign: 'left' }}>{contract.name}</TextAction>
                </Td>
                <Td>{holderName}</Td>
                <Td>{fundingTagCode !== undefined ? <Pill size="sm" mono>{fundingTagCode}</Pill> : <span style={mist}>No tag</span>}</Td>
                <Td>
                  <Pill size="sm" tone={disabled ? 'neutral' : 'success'}>{disabled ? 'Disabled' : 'Active'}</Pill>
                </Td>
              </ClickableRow>
            ))}
          </tbody>
        </TableShell>
      )}
      <span style={{ fontSize: 12, color: neutral.mist }}>A Contract with no specialty is offered for every specialty, so it is not listed here.</span>
    </Card>
  )
}

/** Who holds it, Remove (the store's refusal in place while held; a confirm first otherwise) and History. */
function SpecialtyRail({ specialtyId, name, heldBy, actor }: { specialtyId: string; name: string; heldBy: string; actor: Actor }) {
  const navigate = useNavigate()
  const changes = useAppStore((s) => s.audit.filter((a) => a.entityId === specialtyId).length)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [history, setHistory] = useState(false)

  function askRemove() {
    // The store decides: a held specialty is refused with its own sentence; an unheld one asks first.
    const usage = specialtyUsage(useAppStore.getState().masters, specialtyId)
    if (usage.surgeons + usage.contracts > 0) {
      const outcome = removeSpecialty(useAppStore, actor, specialtyId)
      setError(outcome.ok ? null : outcome.message)
      return
    }
    setError(null)
    setConfirming(true)
  }

  function remove() {
    const outcome = removeSpecialty(useAppStore, actor, specialtyId)
    setConfirming(false)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    navigate(peoplePath('specialties'), { replace: true })
  }

  return (
    <div data-shot="specialty-rail" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card title="Remove" shot="specialty-remove-card">
        <span style={{ fontSize: 13, color: neutral.slate }}>{heldBy}. A specialty anyone holds cannot be removed; rename it instead.</span>
        <FormError message={error} shot="specialty-remove-error" />
        <TextAction size="sm" flush onClick={askRemove} shot="specialty-remove" label={`Remove ${name}`}>Remove</TextAction>
      </Card>
      <Card title="History" shot="specialty-history">
        <span style={{ fontSize: 13, color: neutral.slate }}>
          <span className="mono">{changes}</span> {changes === 1 ? 'change recorded' : 'changes recorded'}
        </span>
        <TextAction size="sm" flush shot="specialty-history-open" onClick={() => setHistory(true)}>See history</TextAction>
      </Card>
      <ConfirmSheet
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Remove ${name}?`}
        description="No surgeon or Contract holds it. It leaves AA's list; its history stays in the audit."
        confirmLabel="Remove specialty"
        onConfirm={remove}
        cancelLabel="Keep it"
        confirmVariant="danger"
        shot="specialty-remove-confirm"
      />
      <HistorySheet open={history} entityIds={[specialtyId]} title={`History · ${name}`} onClose={() => setHistory(false)} />
    </div>
  )
}
