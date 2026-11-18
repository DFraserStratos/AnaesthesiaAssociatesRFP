/**
 * Catalogue examples for UI unification U6's shared page parts: the table kit, the card, the eyebrow,
 * the page header and the label and value rows. Each renders the real shared component. Demo only.
 */

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { neutral } from '../../../../theme/tokens'
import { ClickableRow, GroupRow, RowOpenButton, TableShell, Td, Th, type TableDensity } from '../../../../shared/table'
import { DRAFT_LIST, DRAFT_LISTS, UNASSIGNED } from '../../../../shared/scheduleTerms'
import { Button, Card, DefList, DefRow, Eyebrow, PageHeader, visuallyHidden } from '../../../../shared/ui'

function Echo({ children }: { children: string }) {
  return <div style={{ fontSize: 12.5, color: neutral.slate }}>{children}</div>
}

const ROWS = [
  { id: 'LD-001', day: 'Tue 21 Jul', session: 'PM', where: "St George's · Mr Hale", since: '3 d 22 h' },
  { id: 'LD-002', day: 'Wed 22 Jul', session: 'AM', where: 'Mercy Hospital · Ms Reid', since: '1 d 4 h' },
]

export function TableKitExample() {
  const [density, setDensity] = useState<TableDensity>('compact')
  const [last, setLast] = useState('Click a row, or Tab to a session and press Enter.')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {(['comfortable', 'compact', 'dense'] as const).map((d) => (
          <Button key={d} size="compact" variant={d === density ? 'primary' : 'secondary'} onClick={() => setDensity(d)}>
            {d}
          </Button>
        ))}
      </div>
      <TableShell label={DRAFT_LISTS} density={density} minWidth={560}>
        <thead>
          <tr>
            <Th>Date</Th>
            <Th>Session</Th>
            <Th>Hospital and surgeon</Th>
            <Th align="right" nowrap>Waiting</Th>
            <Th><span style={visuallyHidden}>Actions</span></Th>
          </tr>
        </thead>
        <tbody>
          <GroupRow span={5}>This week</GroupRow>
          {ROWS.map((r) => (
            <ClickableRow key={r.id} onOpen={() => setLast(`Row click opened ${r.id}.`)} data-draft-list-row={r.id}>
              <Td>{r.day}</Td>
              <Td mono>
                <RowOpenButton label={`Open ${DRAFT_LIST} ${r.day} ${r.session}, ${r.where}`} onOpen={() => setLast(`The handle opened ${r.id}.`)}>
                  {r.session}
                </RowOpenButton>
              </Td>
              <Td>{r.where}</Td>
              <Td align="right" mono>{r.since}</Td>
              <Td align="right">
                <Button size="compact" variant="secondary" onClick={() => setLast(`Assign on ${r.id} (the row did not open).`)}>Assign</Button>
              </Td>
            </ClickableRow>
          ))}
        </tbody>
      </TableShell>
      <Echo>{last}</Echo>
    </div>
  )
}

export function PageHeaderExample() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader size="admin" title="Invoices" sub="Raised and sent by the billing run when a list is authorised." actions={<Button size="desktop" variant="secondary">Export</Button>} />
      <PageHeader size="web" title="Lists" sub="Your Lists from today, with any earlier ones not yet authorised." />
      <PageHeader size="section" title="Contracts" sub="Each Contract is one priced item." />
    </div>
  )
}

export function CardExample() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
      <Card title="Internal notes">
        <span style={{ fontSize: 13, color: neutral.slate }}>The rail card: 16px, flat, a 14/600 h2.</span>
      </Card>
      <Card padding="panel" title="Leave" action={<span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>2 booked</span>}>
        <span style={{ fontSize: 13, color: neutral.slate }}>The panel: 20px, e1, a 17/600 h2.</span>
      </Card>
      <Card title="Xero handoff" tone="warning">
        <span style={{ fontSize: 13 }}>The warning tone.</span>
      </Card>
    </div>
  )
}

export function EyebrowExample() {
  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'baseline' }}>
      <Eyebrow>Recently billed</Eyebrow>
      <Eyebrow tone="slate">Office billing setup</Eyebrow>
      <Eyebrow tone="warning">{UNASSIGNED}</Eyebrow>
      <Eyebrow tone="brand">Today</Eyebrow>
      <Eyebrow as="h3">Times (a section heading)</Eyebrow>
    </div>
  )
}

export function DefRowExample() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, alignItems: 'start' }}>
      <DefList>
        <DefRow label="Times">08:00 to 12:30</DefRow>
        <DefRow label="Hospital">St George&apos;s</DefRow>
        <DefRow label="Email" tone="warning">Missing</DefRow>
      </DefList>
      <DefList gap={12}>
        <DefRow layout="stacked" label="HPI CPN" mono>47REIA</DefRow>
        <DefRow layout="stacked" label="Mobile" note="Shown to the office only.">021 000 0000</DefRow>
      </DefList>
      <DefList gap={0}>
        <DefRow layout="settings" label="Bank account" trailing={<Lock size={14} aria-hidden color={neutral.mist} />}>12-3456-•••••12-00</DefRow>
        <DefRow layout="settings" label="Rate per unit">$26.50</DefRow>
      </DefList>
    </div>
  )
}
