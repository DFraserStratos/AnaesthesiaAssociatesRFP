import { useMemo, useState } from 'react'
import type { Anaesthetist } from '../../../domain/types'
import { statusOn } from '../../../domain/anaesthetistStatus'
import { linkedContractsOf, nextListsOf } from '../../../domain/anaesthetistPanel'
import { maskBankAccount, normaliseNzBankAccount } from '../../../domain/bankAccount'
import { formatGstNumber, normaliseGstNumber } from '../../../domain/billing/invoicePresentation'
import { normaliseHpiCpn } from '../../../domain/surgeons'
import { sessionText } from '../../../domain/outOfHours'
import { HistorySheet } from '../../../shared/booking'
import { anaesthetistStatusLabel, HPI_CPN_LABEL, locationName, shortDay } from '../../../shared/format'
import { Button, DefList, DefRow, EditableCard, Pill, RailSection, TextField, useCardEdit, type CardCommit, type RailSectionRow } from '../../../shared/ui'
import {
  ANAESTHETIST_HPI_CPN_REQUIRED,
  BANK_ACCOUNT_REQUIRED,
  editAnaesthetist,
  useAppStore,
  useToday,
  type Actor,
  type AnaesthetistPatch,
} from '../../../store'
import { PairingSection, useProfileHistory } from '../components/pairing'
import { RateTierCard } from '../components/RateTierCard'
import { AnaesthetistStatusCard } from '../components/AnaesthetistStatusCard'
import { AnaesthetistHistoryCard } from '../components/AnaesthetistHistoryCard'
import { IdChip, PROFILE_CARD, ProfilePage } from '../components/ProfileChrome'
import { PageBody } from '../components/AdminPage'
import { BankAccountFields, HpiCpnField } from '../flows/anaesthetistFields'
import { contractPath } from '../contractsPaths'
import { peoplePath } from '../peoplePaths'

/**
 * The anaesthetist's page in People (build plan Phase 54; US-12.1.4, D99, D104, D105):
 * `/admin/people/anaesthetists/:anaesthetistId`, keyed by the registration number, which never
 * changes. On 53's record pattern, as the Contract page (contracts-section.html #record): cards
 * stacked in the main column, each edited and saved on its own (`EditableCard`, `useCardEdit`), and a
 * side panel of short sections with See all (`RailSection`).
 *
 * - **Identity**: the name and registration number, read-only, and the HPI CPN (mandatory, unique).
 * - **Contact**: phone and email.
 * - **Bank and GST**: the bank account (mandatory; masked at rest, the full number only while
 *   editing) and the GST number (optional; blank clears it).
 * - 50's **Rate and tier** card and 52's **Status** card (with the start date, Phase 54's prop) and
 *   **History** card, placed as they are.
 *
 * Each card's Save is `editAnaesthetist` with that card's changed fields only, so one audited
 * `anaesthetist.update`; a refusal shows on that card and nothing changes. The side panel: their
 * pairings (office only), the Contracts linked to them and their next Lists, three of each, See all
 * expanding the section in place. The tier and the pairings are seen only here, in Admin.
 */
export function AnaesthetistPage({ anaesthetistId, actor }: { anaesthetistId: string; actor: Actor }) {
  const anaesthetist = useAppStore((s) => s.masters.anaesthetists[anaesthetistId])
  const todayISO = useToday()
  const [history, setHistory] = useState(false)
  const profileHistory = useProfileHistory('anaesthetist', anaesthetistId)
  if (anaesthetist === undefined) return null

  return (
    <ProfilePage
      shot="anaesthetist-record"
      back={{ label: 'Anaesthetists', to: peoplePath('anaesthetists') }}
      name={anaesthetist.name}
      chip={<IdChip label={HPI_CPN_LABEL} value={anaesthetist.hpiId} shot="anaesthetist-hpi-chip" />}
      sub={<>Registration <span className="mono">{anaesthetist.registrationNumber}</span> · <span data-shot="anaesthetist-status-sub">{anaesthetistStatusLabel(statusOn(anaesthetist, todayISO))}</span></>}
      action={<Button variant="secondary" onClick={() => setHistory(true)} shot="anaesthetist-history-open">History</Button>}
    >
      <PageBody rail={<AnaesthetistPanel anaesthetist={anaesthetist} actor={actor} />} railLabel="About this anaesthetist">
        <IdentityCard anaesthetist={anaesthetist} actor={actor} />
        <ContactCard anaesthetist={anaesthetist} actor={actor} />
        <BankCard anaesthetist={anaesthetist} actor={actor} />
        <RateTierCard anaesthetistId={anaesthetistId} actor={actor} />
        <AnaesthetistStatusCard anaesthetistId={anaesthetistId} actor={actor} editStartDate />
        <AnaesthetistHistoryCard anaesthetistId={anaesthetistId} />
      </PageBody>
      <HistorySheet open={history} entityIds={profileHistory.ids} entityLabels={profileHistory.labels} title="Anaesthetist history" onClose={() => setHistory(false)} />
    </ProfilePage>
  )
}

/** A card's label and value rows: the label in a 150px slate column beside its value (contracts-section.html #record `.kv`). */
const KV = { layout: 'inline', labelWidth: 150, labelTone: 'slate' } as const

/** The cards' edit fields, side by side where the card is wide enough. */
const FIELDS = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, alignItems: 'start' } as const

/** A card's save: `editAnaesthetist` with only that card's fields. */
function anaesthetistCommit(actor: Actor, registrationNumber: string): CardCommit<AnaesthetistPatch> {
  return (patch) => editAnaesthetist(useAppStore, actor, registrationNumber, patch)
}

interface CardProps {
  anaesthetist: Anaesthetist
  actor: Actor
}

/** The name and registration number (read-only) and the HPI CPN. */
function IdentityCard({ anaesthetist: a, actor }: CardProps) {
  const edit = useCardEdit(() => ({ hpiId: a.hpiId }), anaesthetistCommit(actor, a.registrationNumber))
  const d = edit.draft
  function save() {
    if (d === null) return
    // Only a changed HPI CPN is sent, so a save with no change never re-checks it.
    edit.save(normaliseHpiCpn(d.hpiId) !== a.hpiId ? { hpiId: d.hpiId } : {})
  }
  return (
    <EditableCard
      style={PROFILE_CARD}
      title="Identity"
      shot="anaesthetist-identity"
      editable
      editing={d !== null}
      onEdit={edit.start}
      onCancel={edit.cancel}
      onSave={save}
      error={edit.error}
      saveDisabledReason={d !== null && d.hpiId.trim() === '' ? ANAESTHETIST_HPI_CPN_REQUIRED : null}
    >
      <DefList gap={10}>
        <DefRow {...KV} label="Name">{a.name}</DefRow>
        <DefRow {...KV} label="Registration number" mono>{a.registrationNumber}</DefRow>
        {d === null && <DefRow {...KV} label={HPI_CPN_LABEL} mono>{a.hpiId}</DefRow>}
      </DefList>
      {d !== null && (
        <div style={FIELDS}>
          <HpiCpnField value={d.hpiId} onChange={(hpiId) => edit.setDraft({ hpiId })} />
        </div>
      )}
    </EditableCard>
  )
}

/** Phone and email. */
function ContactCard({ anaesthetist: a, actor }: CardProps) {
  const edit = useCardEdit(() => ({ phone: a.phone, email: a.email }), anaesthetistCommit(actor, a.registrationNumber))
  const d = edit.draft
  function save() {
    if (d === null) return
    edit.save({
      ...(d.phone.trim() !== a.phone ? { phone: d.phone } : {}),
      ...(d.email.trim() !== a.email ? { email: d.email } : {}),
    })
  }
  return (
    <EditableCard style={PROFILE_CARD} title="Contact" shot="anaesthetist-contact" editable editing={d !== null} onEdit={edit.start} onCancel={edit.cancel} onSave={save} error={edit.error}>
      {d === null ? (
        <DefList gap={10}>
          <DefRow {...KV} label="Phone">{a.phone}</DefRow>
          <DefRow {...KV} label="Email">{a.email}</DefRow>
        </DefList>
      ) : (
        <div style={FIELDS}>
          <TextField label="Phone" value={d.phone} onChange={(phone) => edit.setDraft({ ...d, phone })} type="tel" shot="anaesthetist-phone-field" />
          <TextField label="Email" value={d.email} onChange={(email) => edit.setDraft({ ...d, email })} type="email" shot="anaesthetist-email-field" />
        </div>
      )}
    </EditableCard>
  )
}

/** The bank account (masked at rest; the full number only here, while editing) and the GST number. */
function BankCard({ anaesthetist: a, actor }: CardProps) {
  const gstText = a.gstNumber !== undefined ? formatGstNumber(a.gstNumber) : ''
  const edit = useCardEdit(
    () => ({ accountName: a.bankAccount.accountName, accountNumber: a.bankAccount.accountNumber, gstNumber: gstText }),
    anaesthetistCommit(actor, a.registrationNumber),
  )
  const d = edit.draft
  function save() {
    if (d === null) return
    const bankChanged =
      d.accountName.trim() !== a.bankAccount.accountName ||
      (normaliseNzBankAccount(d.accountNumber) ?? d.accountNumber.trim()) !== a.bankAccount.accountNumber
    edit.save({
      // Replaced whole when either part changes.
      ...(bankChanged ? { bankAccount: { accountName: d.accountName, accountNumber: d.accountNumber } } : {}),
      // Only a change is sent; blank clears it.
      ...(normaliseGstNumber(d.gstNumber.trim()) !== (a.gstNumber ?? '') ? { gstNumber: d.gstNumber } : {}),
    })
  }
  const blank = d !== null && (d.accountName.trim() === '' || d.accountNumber.trim() === '')
  return (
    <EditableCard
      style={PROFILE_CARD}
      title="Bank and GST"
      shot="anaesthetist-bank"
      editable
      editing={d !== null}
      onEdit={edit.start}
      onCancel={edit.cancel}
      onSave={save}
      error={edit.error}
      saveDisabledReason={blank ? BANK_ACCOUNT_REQUIRED : null}
    >
      {d === null ? (
        <DefList gap={10}>
          <DefRow {...KV} label="Bank account" mono note={a.bankAccount.accountName} shot="anaesthetist-bank-account">
            {maskBankAccount(a.bankAccount.accountNumber)}
          </DefRow>
          <DefRow {...KV} label="GST number" mono={gstText !== ''} shot="anaesthetist-gst-number">{gstText !== '' ? gstText : 'Not held'}</DefRow>
        </DefList>
      ) : (
        <div style={FIELDS}>
          <BankAccountFields
            accountName={d.accountName}
            accountNumber={d.accountNumber}
            onAccountName={(accountName) => edit.setDraft({ ...d, accountName })}
            onAccountNumber={(accountNumber) => edit.setDraft({ ...d, accountNumber })}
          />
          <div data-shot="anaesthetist-gst-number-field">
            <TextField
              label="GST number (optional)"
              value={d.gstNumber}
              onChange={(gstNumber) => edit.setDraft({ ...d, gstNumber })}
              mono
              placeholder="123-456-789"
              hint="Printed on every invoice issued in their name. Leave it blank if it is not held."
            />
          </div>
        </div>
      )}
    </EditableCard>
  )
}

/** Rows shown in each side panel section before See all. */
const PANEL_LIMIT = 3

/** The side panel: pairings, the Contracts linked to them, their next Lists. */
function AnaesthetistPanel({ anaesthetist: a, actor }: CardProps) {
  const contracts = useAppStore((s) => s.masters.contracts)
  const parties = useAppStore((s) => s.masters.parties)
  const lists = useAppStore((s) => s.schedule.lists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const todayISO = useToday()
  const id = a.registrationNumber

  const contractRows: RailSectionRow[] = useMemo(
    () =>
      linkedContractsOf(contracts, id).map((c) => ({
        key: c.id,
        to: contractPath(c.id),
        title: c.name,
        sub: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {parties[c.holderId]?.name ?? c.holderId}
            {c.status === 'disabled' && <Pill size="sm">Disabled</Pill>}
          </span>
        ),
        data: { 'data-contract-id': c.id, 'data-contract-status': c.status },
      })),
    [contracts, parties, id],
  )

  const listRows: RailSectionRow[] = useMemo(
    () =>
      nextListsOf(lists, id, todayISO).map((l) => ({
        key: l.id,
        to: `/admin/day/${l.dateISO}`,
        state: { openListId: l.id },
        title: `${shortDay(l.dateISO)} · ${sessionText(l.session)}`,
        sub: `${locationName(l.hospitalId, hospitals)} · ${surgeons[l.surgeonId]?.name ?? l.surgeonId}`,
        data: { 'data-list-id': l.id },
      })),
    [lists, hospitals, surgeons, id, todayISO],
  )

  return (
    <div data-shot="anaesthetist-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div data-shot="panel-pairings">
        <PairingSection perspective="anaesthetist" subjectId={id} actor={actor} layout="panel" />
      </div>
      <RailSection title="Contracts" countNoun="Contracts linked to them" rows={contractRows} limit={PANEL_LIMIT} empty="No Contract is linked to them." shot="panel-contracts" />
      <RailSection title="Next Lists" countNoun="Lists from today" rows={listRows} limit={PANEL_LIMIT} empty="No List from today on." shot="panel-lists" />
    </div>
  )
}
