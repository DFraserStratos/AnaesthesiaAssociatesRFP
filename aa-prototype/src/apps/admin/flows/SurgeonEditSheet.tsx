import { useEffect, useRef, useState } from 'react'
import type { Surgeon, SurgeonContact } from '../../../domain/types'
import { createSurgeon, editSurgeon, useAppStore, type Actor } from '../../../store'
import { Button, Eyebrow, TextField, useSurface, FormError } from '../../../shared'
import { AddRowButton } from '../../../shared/ui'
import { OverlayHeader, SheetActions } from '../../../shared/surface'
import { ChipMultiSelect } from '../components/ChipMultiSelect'
import { ContactFields, EMPTY_CONTACT, type ContactDraft } from '../components/ContactFields'
import { specialtiesInOrder } from '../../../domain/specialties'
import { neutral } from '../../../theme/tokens'
import { RetireSection } from '../screens/masters/chrome'

interface Props {
  /** Absent: add a surgeon. */
  surgeon?: Surgeon
  actor: Actor
  onClose: () => void
}

/** A set on the form, keyed so React keeps each one's inputs as sets are added and removed. */
interface OfficeSet {
  key: number
  draft: ContactDraft
}

function draftOf(c: SurgeonContact | undefined): ContactDraft {
  return { name: c?.name ?? '', email: c?.email ?? '', phone: c?.phone ?? '' }
}

/** The store names a refused contact at the start of its sentence ("Office contact 2: ..."). */
function contactError(error: string | null, label: string): string | null {
  return error !== null && error.startsWith(`${label}:`) ? error : null
}

/**
 * Add or edit a surgeon (catch-up Phase 17, US-13.6.2; 18a's specialties,
 * US-13.6.6). Catch-up Phase 17b (US-13.6.2, US-13.6.5; D74, D76): no rooms;
 * the practice name as text; the HPI CPN optional (admin staff fill it in,
 * unique when held, the store's rule); one personal contact and one or more
 * office contacts on a plus and minus form. One office set always shows; "Add
 * office contact" appends an empty set and focuses its Name; a minus on sets 2
 * and on removes that set whole and focuses the set above. The store drops an
 * all-blank set and refuses a malformed email by the contact's name, shown
 * under that contact.
 */
export function SurgeonEditSheet({ surgeon, actor, onClose }: Props) {
  const { Overlay } = useSurface()
  const specialties = useAppStore((s) => s.masters.specialties)
  const [name, setName] = useState(surgeon?.name ?? '')
  const [practiceName, setPracticeName] = useState(surgeon?.practiceName ?? '')
  const [specialtyIds, setSpecialtyIds] = useState<string[]>(surgeon?.specialtyIds ?? [])
  const [hpiId, setHpiId] = useState(surgeon?.hpiId ?? '')
  const [registration, setRegistration] = useState(surgeon?.medicalRegistrationNumber ?? '')
  const [personal, setPersonal] = useState<ContactDraft>(draftOf(surgeon?.personalContact))
  // Adding a surgeon: the personal contact's Name follows the surgeon's Name until it is typed in.
  const [personalNameTouched, setPersonalNameTouched] = useState(surgeon !== undefined)
  const nextKey = useRef(0)
  const newSet = (draft: ContactDraft = EMPTY_CONTACT): OfficeSet => ({ key: nextKey.current++, draft })
  const [office, setOffice] = useState<OfficeSet[]>(() => {
    const held = surgeon?.officeContacts ?? []
    return held.length === 0 ? [newSet()] : held.map((c) => newSet(draftOf(c)))
  })
  const [error, setError] = useState<string | null>(null)
  const officeRef = useRef<HTMLDivElement>(null)
  const [focusSet, setFocusSet] = useState<number | null>(null)

  useEffect(() => {
    if (focusSet === null) return
    officeRef.current?.querySelector<HTMLInputElement>(`[data-office-contact="${focusSet}"] [data-contact-field="name"]`)?.focus()
    setFocusSet(null)
  }, [focusSet])

  const personalDraft = personalNameTouched ? personal : { ...personal, name }

  function addOffice() {
    setOffice((sets) => [...sets, newSet()])
    setFocusSet(office.length + 1)
    setError(null)
  }

  function removeOffice(index: number) {
    setOffice((sets) => sets.filter((_, i) => i !== index))
    setFocusSet(index)
    setError(null)
  }

  function save() {
    const fields = {
      name,
      specialtyIds,
      practiceName,
      personalContact: personalDraft,
      officeContacts: office.map((s) => s.draft),
      hpiId,
      medicalRegistrationNumber: registration,
    }
    const outcome = surgeon === undefined ? createSurgeon(useAppStore, actor, fields) : editSurgeon(useAppStore, actor, surgeon.id, fields)
    if (!outcome.ok) { setError(outcome.message); return }
    onClose()
  }

  const personalError = contactError(error, 'Personal contact')
  const officeErrorShown = office.some((_, i) => contactError(error, `Office contact ${i + 1}`) !== null)
  const sheetError = personalError !== null || officeErrorShown ? null : error

  return (
    <Overlay open onClose={onClose} size="wide">
      <div data-shot="surgeon-edit-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title={surgeon === undefined ? 'Add a surgeon' : 'Edit surgeon'} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Ms A. Reid" />
          <div data-shot="surgeon-practice-field">
            <TextField label="Practice (optional)" value={practiceName} onChange={setPracticeName} hint="As the office knows it" />
          </div>
        </div>
        <ChipMultiSelect
          label="Specialties"
          options={specialtiesInOrder(specialties)}
          value={specialtyIds}
          onChange={(ids) => { setSpecialtyIds(ids); setError(null) }}
          addLabel={specialtyIds.length === 0 ? 'Choose a specialty' : 'Add another specialty'}
          empty="None chosen yet"
          hint="At least one, from AA's list. Usually one."
          shot="surgeon-specialties-field"
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div data-shot="surgeon-hpi-field">
            <TextField label="HPI CPN (optional)" value={hpiId} onChange={setHpiId} mono placeholder="12ABCD" hint="Leave blank until known. No two practitioners share one." />
          </div>
          <TextField label="NZ medical registration number (optional)" value={registration} onChange={setRegistration} mono hint="For information" />
        </div>

        <section data-shot="surgeon-personal-contact" style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 14, borderTop: `1px solid ${neutral.line}` }}>
          <Eyebrow as="h3" style={{ margin: 0 }}>Personal contact</Eyebrow>
          <ContactFields
            legend="Personal contact"
            hideLegend
            value={personalDraft}
            onChange={(next) => {
              if (next.name !== personalDraft.name) setPersonalNameTouched(true)
              setPersonal(next)
              setError(null)
            }}
            error={personalError}
          />
        </section>

        <section data-shot="surgeon-office-contacts" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 14, borderTop: `1px solid ${neutral.line}` }}>
          <Eyebrow as="h3" style={{ margin: 0 }}>Office contacts</Eyebrow>
          <div ref={officeRef} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {office.map((set, i) => (
              <ContactFields
                key={set.key}
                index={i + 1}
                legend={`Office contact ${i + 1}`}
                value={set.draft}
                onChange={(draft) => {
                  setOffice((sets) => sets.map((s) => (s.key === set.key ? { ...s, draft } : s)))
                  setError(null)
                }}
                onRemove={i > 0 ? () => removeOffice(i) : undefined}
                error={contactError(error, `Office contact ${i + 1}`)}
              />
            ))}
          </div>
          <div data-shot="office-contact-add">
            <AddRowButton onClick={addOffice}>Add office contact</AddRowButton>
          </div>
        </section>

        <FormError message={sheetError} />
        <SheetActions primary={<Button variant="primary" block onClick={save}>{surgeon === undefined ? 'Add surgeon' : 'Save changes'}</Button>} />
        {surgeon !== undefined && <RetireSection kind="surgeon" id={surgeon.id} actor={actor} onDone={onClose} />}
      </div>
    </Overlay>
  )
}
