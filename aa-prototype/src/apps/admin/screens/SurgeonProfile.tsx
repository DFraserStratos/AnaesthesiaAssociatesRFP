import { useEffect, useMemo, useRef, useState } from 'react'
import { neutral, radius } from '../../../theme/tokens'
import { NO_HPI_CPN } from '../../../domain/surgeons'
import { cleanContact, officeAddressFor } from '../../../domain/surgeonContacts'
import { isRetired } from '../../../domain/masterLifecycle'
import type { Surgeon, SurgeonContact } from '../../../domain/types'
import { editSurgeon, useAppStore, withChangeSet, type Actor, type SurgeonFields } from '../../../store'
import { contractsLinkedToSurgeon, nextListsForSurgeon } from '../../../store/surgeonPageSelectors'
import { specialtiesInOrder } from '../../../domain/specialties'
import { PairingSection, useProfileHistory } from '../components/pairing'
import { PROFILE_CARD, PROFILE_COLS2, PROFILE_COLUMN, ProfilePage, StatusFactValue, type ProfileFact, type ProfileReach } from '../components/ProfileChrome'
import { RecordHistoryCard } from '../components/RecordHistoryCard'
import { PageBody } from '../components/AdminPage'
import { UsualWeekCard } from '../components/UsualWeekCard'
import { ChipMultiSelect } from '../components/ChipMultiSelect'
import { ContactFields, EMPTY_CONTACT, type ContactDraft } from '../components/ContactFields'
import { AddRowButton, Button, DefList, DefRow, EditableCard, Eyebrow, FieldHint, Pill, RailSection, TextField, useCardEdit, type CardCommit, type RailSectionRow } from '../../../shared/ui'
import { OverlayHeader, useSurface } from '../../../shared/surface'
import { RetireSection } from './masters/chrome'
import { peoplePath } from '../peoplePaths'
import { contractPath, contractsPath } from '../contractsPaths'
import { drSurname, HPI_CPN_LABEL, plainDate, shortDay } from '../../../shared/format'
import { sessionText } from '../../../domain/outOfHours'
import { DRAFT_LIST } from '../../../shared/scheduleTerms'

/**
 * The surgeon's page (build plan Phase 55; US-13.6.2, US-13.4.1 "One card, one change"; D99, D104,
 * D105), at `/admin/people/surgeons/:surgeonId`, laid out as docs/explorations/profile-ideas.html
 * tab 3 ("Contact on the right", 27 Nov 2026).
 *
 * - **Header**: the crimson initials disc, the name, "Surgeon · NZ medical registration n" (when
 *   held), and Retire (or Reinstate) at the row's end, opening the existing surgeon retire in a
 *   sheet; under it a fact strip: Status (Active, or Retired since the day), HPI CPN, Specialties,
 *   Practice, then the office's phone and "Email the office" (the personal contact's when no office
 *   contact is held).
 * - **Main column**: Identity (name, practice, registration number, HPI CPN) on the left; Specialties
 *   (neutral chips) over Contacts on the right. Each is edited and saved on its own through
 *   `editSurgeon` with only that card's fields, so each save is one audited change (a surgeon Party
 *   that follows a rename joins the same change set); a refusal shows on its card.
 *
 * The side panel shows the surgeon's private pairings both ways, their next Lists, the Contracts
 * linked to them (each naming its holder), a few each with See all, and the record's History (its
 * changes and its pairings', in the shared History sheet). A surgeon belongs to no group (DM-08): a
 * group that holds Contracts is a Party whose surgeons are linked on its Contracts.
 */
export function SurgeonProfile({ surgeonId, actor }: { surgeonId: string; actor: Actor }) {
  const surgeon = useAppStore((s) => s.masters.surgeons[surgeonId])
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const specialties = useAppStore((s) => s.masters.specialties)
  if (surgeon === undefined) return null
  const retired = isRetired(surgeon)
  const notRecorded = mist('Not recorded')
  const specialtyNames = surgeon.specialtyIds.flatMap((id) => (specialties[id] !== undefined ? [specialties[id].name] : []))
  const facts: ProfileFact[] = [
    {
      label: 'Status',
      value: retired ? <StatusFactValue tone="off" word="Retired" {...(surgeon.retiredAtISO !== undefined ? { note: `since ${plainDate(surgeon.retiredAtISO)}` } : {})} /> : <StatusFactValue tone="ok" word="Active" />,
      shot: 'surgeon-status',
      data: { 'data-retired': retired ? 'true' : 'false' },
    },
    { label: HPI_CPN_LABEL, value: surgeon.hpiId ?? notRecorded, mono: surgeon.hpiId !== undefined, shot: 'surgeon-hpi-chip' },
    { label: 'Specialties', value: specialtyNames.length > 0 ? specialtyNames.join(', ') : notRecorded },
    { label: 'Practice', value: surgeon.practiceName !== undefined && surgeon.practiceName !== '' ? surgeon.practiceName : notRecorded },
  ]
  const registration = surgeon.medicalRegistrationNumber

  return (
    <ProfilePage
      shot="surgeon-profile"
      back={{ label: 'Surgeons', to: peoplePath('surgeons') }}
      name={surgeon.name}
      avatar={surgeon.name}
      sub={registration !== undefined && registration !== '' ? <>Surgeon · NZ medical registration <span className="mono">{registration}</span></> : 'Surgeon'}
      action={<SurgeonRetireAction surgeon={surgeon} actor={actor} />}
      facts={facts}
      reach={surgeonReach(surgeons, surgeon)}
    >
      <PageBody rail={<SurgeonSidePanel surgeonId={surgeonId} actor={actor} />} railLabel="What this surgeon is on" gap={14}>
        <UsualWeekCard perspective="surgeon" subjectId={surgeonId} actor={actor} />
        <div data-profile-cards style={PROFILE_COLS2}>
          <div style={PROFILE_COLUMN}>
            <IdentityCard surgeon={surgeon} actor={actor} />
          </div>
          <div style={PROFILE_COLUMN}>
            <SpecialtiesCard surgeon={surgeon} actor={actor} />
            <ContactsCard surgeon={surgeon} actor={actor} />
          </div>
        </div>
      </PageBody>
    </ProfilePage>
  )
}

/**
 * How the office reaches the surgeon from the header: the office address it emails first
 * (`officeAddressFor`) with that contact's phone, as "Email the office"; with no office email, the
 * first office contact's phone; with no office contact at all, the surgeon's own phone and email.
 */
function surgeonReach(surgeons: Readonly<Record<string, Surgeon>>, surgeon: Surgeon): ProfileReach {
  const to = officeAddressFor({ surgeons }, surgeon.id).to
  if (to !== null) return { email: to.email, ...(to.phone !== undefined ? { phone: to.phone } : {}), emailLabel: 'Email the office' }
  const office = surgeon.officeContacts.map(cleanContact).find((c) => c.phone !== undefined || c.name !== undefined)
  if (office !== undefined) return { ...(office.phone !== undefined ? { phone: office.phone } : {}), emailLabel: 'Email the office' }
  const own = cleanContact(surgeon.personalContact)
  return { ...(own.phone !== undefined ? { phone: own.phone } : {}), ...(own.email !== undefined ? { email: own.email } : {}), emailLabel: 'Email' }
}

/**
 * Retire, or Reinstate a retired surgeon, at the end of the header's title row: opens the existing
 * surgeon retire (`RetireSection`: the reason, the blockers, Retire or Reinstate) in a sheet, which
 * closes once it is done. Hooks `surgeon-retire` or `surgeon-reinstate`, the sheet `surgeon-retire-sheet`.
 */
function SurgeonRetireAction({ surgeon, actor }: CardProps) {
  const { Overlay } = useSurface()
  const [open, setOpen] = useState(false)
  const retired = isRetired(surgeon)
  return (
    <>
      <Button variant="secondary" size="compact" onClick={() => setOpen(true)} shot={retired ? 'surgeon-reinstate' : 'surgeon-retire'}>
        {retired ? 'Reinstate' : 'Retire'}
      </Button>
      {open && (
        <Overlay open onClose={() => setOpen(false)}>
          <div data-shot="surgeon-retire-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <OverlayHeader title={retired ? `Reinstate ${surgeon.name}?` : `Retire ${surgeon.name}?`} />
            <RetireSection kind="surgeon" id={surgeon.id} actor={actor} titled={false} onDone={() => setOpen(false)} />
          </div>
        </Overlay>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// One card, one change
// ---------------------------------------------------------------------------

/** The surgeon's fields as `editSurgeon` takes them. */
function fieldsOf(s: Surgeon): SurgeonFields {
  return {
    name: s.name,
    specialtyIds: s.specialtyIds,
    practiceName: s.practiceName ?? '',
    personalContact: s.personalContact,
    officeContacts: s.officeContacts,
    hpiId: s.hpiId ?? '',
    medicalRegistrationNumber: s.medicalRegistrationNumber ?? '',
  }
}

/**
 * A card's save: the surgeon's current fields with only the card's own changed, through `editSurgeon`
 * (which audits only what changed), in one change set so a following Party rename joins the save.
 */
function useSurgeonCommit(surgeonId: string, actor: Actor): CardCommit<Partial<SurgeonFields>> {
  return (patch) => {
    const current = useAppStore.getState().masters.surgeons[surgeonId]
    if (current === undefined) return { ok: false, message: 'Surgeon not found.' }
    const outcome = withChangeSet(useAppStore, 'save', () => editSurgeon(useAppStore, actor, surgeonId, { ...fieldsOf(current), ...patch }))
    return outcome.ok ? { ok: true } : { ok: false, message: outcome.message }
  }
}

type CardProps = { surgeon: Surgeon; actor: Actor }

const mist = (text: string) => <span style={{ color: neutral.mist }}>{text}</span>

/** A card's label and value rows: the label in a 120px slate column beside its value, narrowed for the half-width cards (profile-ideas.html `.kv.n`), as on the anaesthetist's page. */
const KV = { layout: 'inline', labelWidth: 120, labelTone: 'slate' } as const

/** The cards' edit fields, side by side where the card is wide enough. */
const FIELDS = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, alignItems: 'start' } as const

/**
 * Name, practice, registration number and HPI CPN, edited together; `editSurgeon` audits only the
 * fields that changed, so one save is still one change. The registration and HPI CPN rows keep the
 * hooks of the cards they once were (`surgeon-registration-card`, `surgeon-identifiers`).
 */
function IdentityCard({ surgeon, actor }: CardProps) {
  const edit = useCardEdit(
    () => ({ name: surgeon.name, practiceName: surgeon.practiceName ?? '', medicalRegistrationNumber: surgeon.medicalRegistrationNumber ?? '', hpiId: surgeon.hpiId ?? '' }),
    useSurgeonCommit(surgeon.id, actor),
  )
  const draft = edit.draft
  return (
    <EditableCard style={PROFILE_CARD} title="Identity" shot="surgeon-name-card" editable editing={draft !== null} onEdit={edit.start} onCancel={edit.cancel} onSave={() => draft !== null && edit.save(draft)} error={edit.error}>
      {draft === null ? (
        <DefList gap={10}>
          <DefRow {...KV} label="Name">{surgeon.name}</DefRow>
          <DefRow {...KV} label="Practice" data-practice={surgeon.practiceName ?? ''}>{surgeon.practiceName ?? mist('Not recorded')}</DefRow>
          <DefRow {...KV} label="NZ medical registration number" mono={surgeon.medicalRegistrationNumber !== undefined} note="For information" shot="surgeon-registration-card">
            {surgeon.medicalRegistrationNumber ?? mist('Not recorded')}
          </DefRow>
          <DefRow {...KV} label={HPI_CPN_LABEL} mono={surgeon.hpiId !== undefined} note="Unique index on the Health Provider Index. Not the patient's NHI." shot="surgeon-identifiers" data-hpi={surgeon.hpiId ?? ''}>
            {surgeon.hpiId ?? mist(NO_HPI_CPN)}
          </DefRow>
        </DefList>
      ) : (
        <div style={FIELDS}>
          <TextField label="Name" value={draft.name} onChange={(name) => edit.setDraft({ ...draft, name })} placeholder="e.g. Ms A. Reid" />
          <div data-shot="surgeon-practice-field">
            <TextField label="Practice (optional)" value={draft.practiceName} onChange={(practiceName) => edit.setDraft({ ...draft, practiceName })} hint="As the office knows it" />
          </div>
          <TextField label="NZ medical registration number (optional)" value={draft.medicalRegistrationNumber} onChange={(v) => edit.setDraft({ ...draft, medicalRegistrationNumber: v })} mono hint="For information" />
          <div data-shot="surgeon-hpi-field">
            <TextField label={`${HPI_CPN_LABEL} (optional)`} value={draft.hpiId} onChange={(hpiId) => edit.setDraft({ ...draft, hpiId })} mono placeholder="12ABCD" hint="Leave blank until known. No two practitioners share one." />
          </div>
        </div>
      )}
    </EditableCard>
  )
}

const SPECIALTIES_HINT = "From AA's specialties list. One or more, usually one. Decides which Contracts are offered on this surgeon's Lists."

/** The surgeon's specialties as neutral chips with what they decide; Edit keeps the `ChipMultiSelect`. */
function SpecialtiesCard({ surgeon, actor }: CardProps) {
  const specialties = useAppStore((s) => s.masters.specialties)
  const edit = useCardEdit(() => ({ specialtyIds: surgeon.specialtyIds }), useSurgeonCommit(surgeon.id, actor))
  const draft = edit.draft
  return (
    <EditableCard style={PROFILE_CARD} title="Specialties" shot="surgeon-specialties" editable editing={draft !== null} onEdit={edit.start} onCancel={edit.cancel} onSave={() => draft !== null && edit.save(draft)} error={edit.error}>
      {draft === null ? (
        <>
          <div data-specialty-chips style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {surgeon.specialtyIds.filter((id) => specialties[id] !== undefined).map((id) => (
              <Pill key={id} size="md">{specialties[id]!.name}</Pill>
            ))}
          </div>
          <FieldHint tone="slate">{SPECIALTIES_HINT}</FieldHint>
        </>
      ) : (
        <ChipMultiSelect
          label="Specialties"
          options={specialtiesInOrder(specialties)}
          value={draft.specialtyIds}
          onChange={(ids) => edit.setDraft({ specialtyIds: ids })}
          addLabel={draft.specialtyIds.length === 0 ? 'Choose a specialty' : 'Add another specialty'}
          empty="None chosen yet"
          hint="At least one, from AA's list. Usually one."
          shot="surgeon-specialties-field"
        />
      )}
    </EditableCard>
  )
}

/** A set on the contacts form, keyed so React keeps each one's inputs as sets are added and removed. */
interface OfficeSet {
  key: number
  draft: ContactDraft
}

interface ContactsDraft {
  personal: ContactDraft
  office: OfficeSet[]
}

function draftOf(c: SurgeonContact | undefined): ContactDraft {
  return { name: c?.name ?? '', email: c?.email ?? '', phone: c?.phone ?? '' }
}

/** The store names a refused contact at the start of its sentence ("Office contact 2: ..."). */
function contactError(error: string | null, label: string): string | null {
  return error !== null && error.startsWith(`${label}:`) ? error : null
}

function ContactsCard({ surgeon, actor }: CardProps) {
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const commit = useSurgeonCommit(surgeon.id, actor)
  const edit = useCardEdit<ContactsDraft, ContactsDraft>(
    () => {
      const held = surgeon.officeContacts
      return { personal: draftOf(surgeon.personalContact), office: (held.length === 0 ? [undefined] : held).map((c, key) => ({ key, draft: draftOf(c) })) }
    },
    (d) => commit({ personalContact: d.personal, officeContacts: d.office.map((s) => s.draft) }),
  )
  const draft = edit.draft
  // Add focuses the new set's Name; a minus focuses the set above (as the add sheet does).
  const officeRef = useRef<HTMLElement>(null)
  const [focusSet, setFocusSet] = useState<number | null>(null)
  useEffect(() => {
    if (focusSet === null) return
    officeRef.current?.querySelector<HTMLInputElement>(`[data-office-contact="${focusSet}"] [data-contact-field="name"]`)?.focus()
    setFocusSet(null)
  }, [focusSet])
  const firstTo = officeAddressFor({ surgeons }, surgeon.id).to?.email.toLowerCase()
  const firstIndex = firstTo === undefined ? -1 : surgeon.officeContacts.findIndex((c) => cleanContact(c).email?.toLowerCase() === firstTo)
  // A contact's refusal shows under that contact; anything else under the card.
  const personalError = contactError(edit.error, 'Personal contact')
  const officeErrorShown = draft !== null && draft.office.some((_, i) => contactError(edit.error, `Office contact ${i + 1}`) !== null)
  const cardError = personalError !== null || officeErrorShown ? null : edit.error

  return (
    <EditableCard style={PROFILE_CARD} title="Contacts" shot="surgeon-contacts" editable editing={draft !== null} onEdit={edit.start} onCancel={edit.cancel} onSave={() => draft !== null && edit.save(draft)} error={cardError}>
      {draft === null ? (
        // The personal contact, then the office contacts, each a label and value row.
        <DefList gap={14}>
          <DefRow {...KV} label="Personal contact" shot="surgeon-personal-contact-card">
            <ContactLines contact={surgeon.personalContact} />
          </DefRow>
          <DefRow {...KV} label="Office contacts" shot="surgeon-office-contacts-card">
            {surgeon.officeContacts.length === 0 ? (
              mist('None held')
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 12, marginTop: 4 }}>
                {surgeon.officeContacts.map((contact, index) => (
                  <div key={index} data-office-contact={index + 1} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, minWidth: 0 }}>
                    <ContactLines contact={contact} />
                    {index === firstIndex && (
                      <div>
                        <Pill size="sm" shot="office-first-pill">Office emails go here first</Pill>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DefRow>
        </DefList>
      ) : (
        <>
          <section data-shot="surgeon-personal-contact" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Eyebrow as="h3" style={{ margin: 0 }}>Personal contact</Eyebrow>
            <ContactFields legend="Personal contact" hideLegend value={draft.personal} onChange={(personal) => edit.setDraft({ ...draft, personal })} error={personalError} />
          </section>
          <section ref={officeRef} data-shot="surgeon-office-contacts" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 14, borderTop: `1px solid ${neutral.line}` }}>
            <Eyebrow as="h3" style={{ margin: 0 }}>Office contacts</Eyebrow>
            {draft.office.map((set, i) => (
              <ContactFields
                key={set.key}
                index={i + 1}
                legend={`Office contact ${i + 1}`}
                value={set.draft}
                onChange={(next) => edit.setDraft({ ...draft, office: draft.office.map((s) => (s.key === set.key ? { ...s, draft: next } : s)) })}
                onRemove={
                  i > 0
                    ? () => {
                        edit.setDraft({ ...draft, office: draft.office.filter((s) => s.key !== set.key) })
                        setFocusSet(i)
                      }
                    : undefined
                }
                error={contactError(edit.error, `Office contact ${i + 1}`)}
              />
            ))}
            <div data-shot="office-contact-add">
              <AddRowButton
                onClick={() => {
                  edit.setDraft({ ...draft, office: [...draft.office, { key: Math.max(0, ...draft.office.map((s) => s.key)) + 1, draft: EMPTY_CONTACT }] })
                  setFocusSet(draft.office.length + 1)
                }}
              >
                Add office contact
              </AddRowButton>
            </div>
          </section>
        </>
      )}
    </EditableCard>
  )
}

/** A contact's name, mono email and phone; a blank one says which ("Email not recorded") in mist. */
function ContactLines({ contact }: { contact: SurgeonContact }) {
  const c = cleanContact(contact)
  const missing = (what: string) => mist(`${what} not recorded`)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: c.name !== undefined ? neutral.ink : neutral.mist }}>{c.name ?? 'Name not recorded'}</span>
      <span className={c.email !== undefined ? 'mono' : undefined} style={{ fontSize: 13, overflowWrap: 'anywhere' }}>{c.email ?? missing('Email')}</span>
      <span style={{ fontSize: 13 }}>{c.phone ?? missing('Phone')}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// The side panel
// ---------------------------------------------------------------------------

function SurgeonSidePanel({ surgeonId, actor }: { surgeonId: string; actor: Actor }) {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const todayISO = useAppStore((s) => s.clock.todayISO)
  const profileHistory = useProfileHistory('surgeon', surgeonId)
  const contracts = useMemo(() => contractsLinkedToSurgeon({ masters }, surgeonId), [masters, surgeonId])
  const lists = useMemo(() => nextListsForSurgeon({ schedule }, surgeonId, todayISO), [schedule, surgeonId, todayISO])

  const contractRows: RailSectionRow[] = contracts.map(({ contract, holderName }) => ({
    key: contract.id,
    to: contractPath(contract.id),
    title: contract.name,
    sub: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {holderName}
        <Pill size="sm" tone={contract.status === 'active' ? 'success' : 'neutral'}>{contract.status === 'active' ? 'Active' : 'Disabled'}</Pill>
      </span>
    ),
    data: { 'data-contract': contract.id },
  }))

  const listRows: RailSectionRow[] = lists.map((l) => {
    const anaesthetist = l.anaesthetistId !== undefined ? masters.anaesthetists[l.anaesthetistId] : undefined
    return {
      key: l.id,
      to: `/admin/day/${l.dateISO}`,
      state: { openListId: l.id },
      title: `${shortDay(l.dateISO)} · ${sessionText(l.session)}`,
      sub: `${masters.hospitals[l.hospitalId]?.name ?? l.hospitalId} · ${anaesthetist !== undefined ? drSurname(anaesthetist.name) : `${DRAFT_LIST}, no anaesthetist`}`,
      data: { 'data-list': l.id },
    }
  })

  return (
    <>
      <PairingSection perspective="surgeon" subjectId={surgeonId} actor={actor} />
      <RailSection title="Next Lists" countNoun="upcoming Lists" rows={listRows} empty="No upcoming List." shot="surgeon-side-lists" />
      <RailSection
        title="Contracts"
        countNoun="Contracts linked to this surgeon"
        rows={contractRows}
        empty="No Contract links this surgeon."
        // Disabled ones are in the count, so See all opens the catalogue on every status when any is Disabled.
        allTo={contractsPath({ group: 'surgeon', in: surgeonId, ...(contracts.some((r) => r.contract.status !== 'active') ? { status: 'all' as const } : {}) })}
        shot="surgeon-side-contracts"
      />
      <RecordHistoryCard entityIds={profileHistory.ids} entityLabels={profileHistory.labels} name={masters.surgeons[surgeonId]?.name ?? surgeonId} shot="surgeon-history" />
    </>
  )
}
