/**
 * Catalogue examples for the shared record pattern and the People tab strip
 * (build plan Phase 53; D99, D104): `EditableCard` with `useCardEdit`, a side
 * panel's `RailSection`, and the People section's tabs.
 */

import { useState } from 'react'
import { DefList, DefRow, EditableCard, RailSection, TextField, useCardEdit } from '../../../../shared/ui'
import { PROFILE_CARD } from '../../../admin/components/ProfileChrome'
import { PeopleTabs } from '../../../admin/screens/people/PeopleSection'

/** Two cards edited one at a time: Save commits the card's patch (stubbed here); a blank name is refused on the card. */
export function EditableCardExample() {
  const [saved, setSaved] = useState({ practice: 'Merivale Eye Rooms' })
  const [last, setLast] = useState('Nothing saved yet.')
  const edit = useCardEdit(
    () => ({ practice: saved.practice }),
    (patch: { practice: string }) => {
      if (patch.practice.trim() === '') return { ok: false, message: 'A practice needs a name.' }
      setSaved(patch)
      setLast(`Saved one change: practice "${patch.practice}".`)
      return { ok: true }
    },
  )
  const d = edit.draft
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480 }}>
      <EditableCard style={PROFILE_CARD} title="Practice" shot="catalogue-editable-card" editable editing={d !== null} onEdit={edit.start} onCancel={edit.cancel} onSave={() => d !== null && edit.save({ practice: d.practice })} error={edit.error}>
        {d === null ? (
          <DefList>
            <DefRow layout="inline" labelWidth={150} labelTone="slate" label="Practice">{saved.practice}</DefRow>
          </DefList>
        ) : (
          <TextField label="Practice" value={d.practice} onChange={(practice) => edit.setDraft({ practice })} />
        )}
      </EditableCard>
      <span style={{ fontSize: 12.5 }}>{last}</span>
    </div>
  )
}

const RAIL_ROWS = ['Mon 30 Nov · St George\'s PM', 'Tue 1 Dec · Southern Cross AM', 'Thu 3 Dec · Forte PM', 'Mon 7 Dec · St George\'s AM', 'Wed 9 Dec · Southern Cross PM', 'Fri 11 Dec · Forte AM', 'Mon 14 Dec · St George\'s PM', 'Wed 16 Dec · Forte AM']

/** A side panel's section: five of eight rows with See all 8, and an empty one. */
export function RailSectionExample() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 412 }}>
      <RailSection
        title="Next Lists"
        countNoun="Lists"
        rows={RAIL_ROWS.map((r, i) => ({ key: String(i), to: '/demo/catalogue/admin', title: r, sub: 'Mr J. Whitford', data: { 'data-example-row': String(i) } }))}
        empty="No Lists ahead."
        allTo="/demo/catalogue/admin"
        shot="catalogue-rail-section"
      />
      <RailSection title="Contracts for him" rows={[]} empty="No Contract names him." allTo="/demo/catalogue/admin" shot="catalogue-rail-empty" />
    </div>
  )
}

/** The People section's tab strip, live: its counts come from the store. */
export function PeopleTabsExample() {
  return <PeopleTabs active="surgeons" />
}
