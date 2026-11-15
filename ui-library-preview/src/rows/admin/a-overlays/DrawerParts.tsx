import { useState } from 'react'
import { ActionBar, DrawerLink, Echo, Row, Section } from './parts'

/** The same session rows, link and three actions as the catalogue example, on Button (+ DropdownMenu). */
export function DrawerPartsReplacement({ layout = 'buttons', reasons = 'tooltip' }: { layout?: 'buttons' | 'menu'; reasons?: 'tooltip' | 'line' }) {
  const [last, setLast] = useState('Nothing clicked yet.')
  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      <Section label="Session">
        <Row label="Times">08:00 to 12:30</Row>
        <Row label="Hospital">St George's</Row>
        <Row label="Surgeon">
          <DrawerLink onClick={() => setLast('Opened the surgeon (stubbed).')}>Mr Hale</DrawerLink>
        </Row>
      </Section>
      <ActionBar
        layout={layout}
        reasons={reasons}
        wrap
        actions={[
          { label: 'Assign List', primary: true, onClick: () => setLast('Primary action.') },
          { label: 'Edit times', onClick: () => setLast('Secondary action.') },
          { label: 'Remove', disabledReason: 'Disabled reason, shown only as a title tooltip', onClick: () => setLast('Never fires.') },
        ]}
      />
      <Echo>{last}</Echo>
    </div>
  )
}
