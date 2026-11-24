/**
 * The field parts UI unification U4 built, in the Admin catalogue: SelectField,
 * Checkbox, Switch, FieldHint and the date and time parts. Each example holds
 * its own state; nothing writes to the demo store. Dates are fixed strings, so
 * the rows are the same on every load.
 */

import { useState, type ReactNode } from 'react'
import { neutral, radius } from '../../../../theme/tokens'
import { Checkbox, DateJumpInput, FieldHint, FilterDateInput, SelectField, Switch, TextField, TimeRangeFields, type TimeRange } from '../../../../shared/ui'
import { Echo } from './basicExamples'

/** A strip of page (the grey canvas), where a field takes the white `surface` fill. */
export function OnPage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ background: neutral.bg, borderRadius: radius.ctl, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 11.5, color: neutral.mist }}>{label}</span>
      {children}
    </div>
  )
}

const HOSPITALS = ['Forte Health', 'Southern Cross Christchurch', "St George's Hospital"]

export function SelectFieldExample() {
  const [hospital, setHospital] = useState('')
  const [entity, setEntity] = useState('All')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SelectField label="Hospital" value={hospital} onChange={setHospital} hint="field size, well fill: inside a sheet or card.">
        <option value="">Choose a hospital</option>
        {HOSPITALS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </SelectField>
      <OnPage label="compact size, surface fill: a toolbar on the page">
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <SelectField label="Entity type" size="compact" fill="surface" value={entity} onChange={setEntity}>
            {['All', 'Booking', 'List', 'Contract'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </SelectField>
          <SelectField label="Entity type (hidden label)" hideLabel size="compact" fill="surface" value={entity} onChange={setEntity}>
            {['All', 'Booking', 'List', 'Contract'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </SelectField>
        </div>
      </OnPage>
      <Echo>Hospital {hospital === '' ? '(none)' : hospital} · entity type {entity}</Echo>
    </div>
  )
}

export function CheckboxExample() {
  const [cleared, setCleared] = useState(false)
  const [range, setRange] = useState(true)
  const [flag, setFlag] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Checkbox checked={cleared} onChange={setCleared} style={{ fontSize: 13, color: neutral.slate }}>Show cleared</Checkbox>
      <Checkbox checked={range} onChange={setRange} hint="A from and to range on the code's base units.">
        <span style={{ fontSize: 14, fontWeight: 600 }}>Has a range</span>
      </Checkbox>
      <Checkbox size="lg" checked={flag} onChange={setFlag} style={{ fontSize: 15 }}>The lg box, as on a mobile card</Checkbox>
      <Echo>Show cleared {cleared ? 'on' : 'off'} · range {range ? 'on' : 'off'} · lg {flag ? 'on' : 'off'}</Echo>
    </div>
  )
}

export function SwitchExample() {
  const [step, setStep] = useState(true)
  const [big, setBig] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420 }}>
      <Switch checked={step} onChange={setStep} label="Approval step" description="sm, the 36 by 20 track (default)." />
      <Switch size="lg" checked={big} onChange={setBig} label="Play the office" description="lg, the 52 by 32 touch track." />
      <Switch checked={false} onChange={() => {}} label="Disabled" description="Shown off and dimmed." disabled />
      <Echo>Approval step {step ? 'on' : 'off'} · Play the office {big ? 'on' : 'off'}</Echo>
    </div>
  )
}

export function FieldHintExample() {
  const [code, setCode] = useState('H3')
  const [units, setUnits] = useState('0')
  const unitsInvalid = !/^[1-9]\d*$/.test(units.trim())
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TextField label="RVG code" value={code} onChange={setCode} mono hint="Users find the group by its code or a word from its description." />
      <TextField label="Base units" value={units} onChange={setUnits} mono invalid={unitsInvalid} hint={unitsInvalid ? 'A whole number above 0.' : 'The starting figure.'} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Standalone, under any control</span>
        <FieldHint>Fills a Procedure's RVG code when it has none.</FieldHint>
        <FieldHint tone="error">Type the amount in dollars and cents.</FieldHint>
      </div>
    </div>
  )
}

const JUMP_MIN = '2026-11-24'
const JUMP_MAX = '2027-06-06'

export function DateJumpInputExample() {
  const [admin, setAdmin] = useState(JUMP_MIN)
  const [web, setWeb] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OnPage label="Admin Day: 36px, the label names the input">
        <DateJumpInput label="Go to date" height={36} width={139} value={admin} min={JUMP_MIN} max={JUMP_MAX} onPick={(d) => d !== null && setAdmin(d)} />
      </OnPage>
      <OnPage label="Web Lists: 38px, the label beside it">
        <DateJumpInput label="Go to date" labelVisible height={38} value={web ?? ''} min={JUMP_MIN} max={JUMP_MAX} onPick={setWeb} />
      </OnPage>
      <Echo>Admin {admin} · web {web ?? '(cleared)'} · only a full day from {JUMP_MIN} to {JUMP_MAX} is taken</Echo>
    </div>
  )
}

export function FilterDateInputExample() {
  const [from, setFrom] = useState('2026-11-04')
  const [to, setTo] = useState('')
  const [toInline, setToInline] = useState('')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OnPage label="above: the Admin filter bars (36px)">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <FilterDateInput label="From" value={from} onChange={setFrom} />
          <FilterDateInput label="To" value={to} min={from} onChange={setTo} />
        </div>
      </OnPage>
      <OnPage label="inline: the web Lists row's To (38px)">
        <FilterDateInput label="To" labelPlacement="inline" height={38} value={toInline} min={JUMP_MIN} onChange={setToInline} />
      </OnPage>
      <Echo>From {from === '' ? '(any)' : from} to {to === '' ? '(any)' : to}</Echo>
    </div>
  )
}

export function TimeRangeFieldsExample() {
  const [times, setTimes] = useState<TimeRange>({ start: '08:00', end: '12:30' })
  const [optional, setOptional] = useState<TimeRange>({ start: '', end: '' })
  const valid = times.start !== '' && times.end !== '' && times.start < times.end
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <TimeRangeFields value={times} onChange={setTimes} hint={<span>{valid ? `${times.start} to ${times.end}` : 'The start time must be before the end time.'}</span>} />
      <TimeRangeFields value={optional} onChange={setOptional} startLabel="From" endLabel="To" optional size="compact" />
    </div>
  )
}
