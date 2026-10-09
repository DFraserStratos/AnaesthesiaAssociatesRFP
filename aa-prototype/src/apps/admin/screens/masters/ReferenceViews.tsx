import { useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../../../theme/tokens'
import type { Contract } from '../../../../domain/types'
import { modifierBandOf } from '../../../../domain/billing'
import { displayStatusLabel } from '../../../../domain/slots'
import {
  eligibleArchiveContactIds,
  runArchiveJob,
  setArchiveWindowDays,
  setInsurerDirectClaims,
  useAppStore,
  type Actor,
} from '../../../../store'
import { Button, TextField } from '../../../../shared'
import { ContractEditSheet } from '../../flows/ContractEditSheet'
import { PermanentListSheet } from '../../flows/PermanentListSheet'
import { EditCell, Header, Table } from './chrome'
import { cellStyle } from './tableStyles'

/**
 * The Master data views catch-up Phase 17 did not change, moved out of the
 * old single file as they were: contracts, permanent lists, insurers,
 * organisations, the code tables, list statuses, and Xero & archiving.
 */

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export function ContractsMaster({ actor }: { actor: Actor }) {
  const contracts = useAppStore((s) => s.masters.contracts)
  const [sheet, setSheet] = useState<{ id?: string } | null>(null)
  return (
    <>
      <ContractsView onEdit={(id) => setSheet({ id })} onNew={() => setSheet({})} />
      {sheet !== null && (
        <ContractEditSheet open actor={actor} contract={sheet.id !== undefined ? contracts[sheet.id] : undefined} onClose={() => setSheet(null)} />
      )}
    </>
  )
}

function ContractsView({ onEdit, onNew }: { onEdit: (id: string) => void; onNew: () => void }) {
  const masters = useAppStore((s) => s.masters)
  const rows = Object.values(masters.contracts).sort((a, b) => a.name.localeCompare(b.name))

  function holderName(c: Contract): string {
    switch (c.holderType) {
      case 'hospital': return masters.hospitals[c.holderId]?.name ?? c.holderId
      case 'insurer': return masters.insurers[c.holderId]?.name ?? c.holderId
      case 'surgeon': return masters.surgeons[c.holderId]?.name ?? c.holderId
      case 'organisation': return masters.organisations[c.holderId]?.name ?? c.holderId
      case 'billableParty': return masters.billableParties[c.holderId]?.name ?? c.holderId
    }
  }

  return (
    <>
      <Header title="Contracts" sub="Hospital and direct-insurer default Type 1 contracts are protected (locked): they cannot be deleted or end-dated." action={<Button variant="secondary" onClick={onNew}>New contract</Button>} />
      <Table heads={['Name', 'Type', 'Holder', 'Scope', 'From', 'To', '']} rightAlign={[6]}>
        {rows.map((c) => {
          const protectedDefault = c.isDefault && c.type === 1
          return (
            <tr key={c.id}>
              <td style={cellStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {protectedDefault && <Lock size={12} aria-hidden style={{ color: neutral.mist }} />}
                  {c.name}
                </div>
              </td>
              <td style={cellStyle}>{c.type}</td>
              <td style={cellStyle}>{holderName(c)} <span style={{ color: neutral.mist }}>({c.holderType})</span></td>
              <td style={cellStyle}>{c.scope.kind === 'individualAnaesthetist' ? 'Individual' : 'Org'}</td>
              <td className="mono" style={cellStyle}>{c.effectiveFromISO}</td>
              <td className="mono" style={cellStyle}>{c.effectiveToISO ?? '·'}</td>
              <EditCell onClick={() => onEdit(c.id)} />
            </tr>
          )
        })}
      </Table>
    </>
  )
}

// ---------------------------------------------------------------------------
// Permanent lists
// ---------------------------------------------------------------------------

export function PermanentListsMaster({ actor }: { actor: Actor }) {
  const permanentLists = useAppStore((s) => s.masters.permanentLists)
  const [sheet, setSheet] = useState<{ id?: string } | null>(null)
  return (
    <>
      <PermanentListsView onEdit={(id) => setSheet({ id })} onAdd={() => setSheet({})} />
      {sheet !== null && (
        <PermanentListSheet open actor={actor} template={sheet.id !== undefined ? permanentLists[sheet.id] : undefined} onClose={() => setSheet(null)} />
      )}
    </>
  )
}

function PermanentListsView({ onEdit, onAdd }: { onEdit: (id: string) => void; onAdd: () => void }) {
  const masters = useAppStore((s) => s.masters)
  const rows = Object.values(masters.permanentLists).sort((a, b) => {
    const an = masters.anaesthetists[a.anaesthetistId]?.name ?? ''
    const bn = masters.anaesthetists[b.anaesthetistId]?.name ?? ''
    return an.localeCompare(bn) || a.dayOfWeek - b.dayOfWeek || a.session.localeCompare(b.session)
  })
  return (
    <>
      <Header title="Permanent lists" sub="Weekly templates the canvas generates from, including the usual surgeon. Edits apply to future generated days." action={<Button variant="secondary" onClick={onAdd}>Add permanent list</Button>} />
      <Table heads={['Anaesthetist', 'Day', 'Session', 'Kind', 'Hospital', 'Surgeon', '']} rightAlign={[6]}>
        {rows.map((p) => (
          <tr key={p.id}>
            <td style={cellStyle}>{masters.anaesthetists[p.anaesthetistId]?.name ?? p.anaesthetistId}</td>
            <td style={cellStyle}>{DAY_LABELS[p.dayOfWeek]}</td>
            <td style={cellStyle}>{p.session}</td>
            <td style={cellStyle}>{displayStatusLabel(p.kind)}</td>
            <td style={cellStyle}>{p.hospitalId !== null ? (masters.hospitals[p.hospitalId]?.name ?? p.hospitalId) : 'AA rooms'}</td>
            <td style={cellStyle}>{p.surgeonId !== null ? (masters.surgeons[p.surgeonId]?.name ?? p.surgeonId) : '·'}</td>
            <EditCell onClick={() => onEdit(p.id)} />
          </tr>
        ))}
      </Table>
    </>
  )
}

export function InsurersView({ actor }: { actor: Actor }) {
  const insurers = useAppStore((s) => s.masters.insurers)
  const [error, setError] = useState<string | null>(null)
  const rows = Object.values(insurers).sort((a, b) => a.name.localeCompare(b.name))

  function flip(id: string, next: boolean) {
    const outcome = setInsurerDirectClaims(useAppStore, actor, id, next)
    if (!outcome.ok) setError(outcome.message)
    else setError(null)
  }

  return (
    <>
      <Header title="Insurers" sub="Flipping an insurer to direct claims atomically creates its default Type 1 contract (visible in Contracts)." />
      {error !== null && <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>}
      <Table heads={['Name', 'Accepts direct claims', '']} rightAlign={[2]}>
        {rows.map((i) => (
          <tr key={i.id}>
            <td style={cellStyle}>{i.name}</td>
            <td style={cellStyle}>{i.acceptsDirectClaims ? 'Yes' : 'No'}</td>
            <td style={{ ...cellStyle, textAlign: 'right' }}>
              <button onClick={() => flip(i.id, !i.acceptsDirectClaims)} style={{ border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                {i.acceptsDirectClaims ? 'Turn off' : 'Turn on'}
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </>
  )
}

export function OrganisationsView() {
  const organisations = useAppStore((s) => s.masters.organisations)
  const rows = Object.values(organisations).sort((a, b) => a.name.localeCompare(b.name))
  return (
    <>
      <Header title="Contract-holder organisations" sub="External groups that hold contracts (view only)." />
      <Table heads={['Name', 'Description']}>
        {rows.map((o) => (
          <tr key={o.id}><td style={cellStyle}>{o.name}</td><td style={cellStyle}>{o.description ?? '·'}</td></tr>
        ))}
      </Table>
    </>
  )
}

export function RvgCodesView() {
  const rvgCodes = useAppStore((s) => s.masters.rvgCodes)
  const rows = Object.values(rvgCodes).sort((a, b) => a.code.localeCompare(b.code))
  return (
    <>
      <Header title="RVG codes" sub="Base-unit reference (view only). Demo-plausible values." />
      <Table heads={['Code', 'Description', 'Site', 'Base units', 'Absorbs']}>
        {rows.map((c) => (
          <tr key={c.code}>
            <td className="mono" style={cellStyle}>{c.code}</td>
            <td style={cellStyle}>{c.description}</td>
            <td style={cellStyle}>{c.anatomicalSite}</td>
            <td className="mono" style={cellStyle}>{c.baseUnits.kind === 'single' ? c.baseUnits.units : `${c.baseUnits.min} to ${c.baseUnits.max}`}</td>
            <td className="mono" style={cellStyle}>{c.absorbsModifierCodes.join(', ') || '·'}</td>
          </tr>
        ))}
      </Table>
    </>
  )
}

export function ModifierCodesView() {
  const modifierCodes = useAppStore((s) => s.masters.modifierCodes)
  const rows = Object.values(modifierCodes).sort((a, b) => a.code.localeCompare(b.code))
  return (
    <>
      <Header title="Modifier codes" sub="Modifier-unit reference (view only). Demo-plausible values within the RFP ranges. Selection reads the RFP's per-group example ranges as one code per group, which the RFP implies rather than states: a question for AA." />
      <Table heads={['Code', 'Group', 'Selection', 'Units', 'Description']} rightAlign={[3]}>
        {rows.map((m) => (
          <tr key={m.code}>
            <td className="mono" style={cellStyle}>{m.code}</td>
            <td style={cellStyle}>{m.group}</td>
            <td style={cellStyle}>{modifierBandOf(m.code) !== undefined ? 'Pick one' : 'Adds on top'}</td>
            <td className="mono" style={{ ...cellStyle, textAlign: 'right' }}>{m.units}</td>
            <td style={cellStyle}>{m.description}</td>
          </tr>
        ))}
      </Table>
    </>
  )
}

export function ListStatusesView() {
  const listStatuses = useAppStore((s) => s.masters.listStatuses)
  const rows = Object.values(listStatuses)
  return (
    <>
      <Header title="List statuses" sub="A fixed enumerated set (view only) shared by every app's status legend." />
      <Table heads={['Key', 'Label', 'Description']}>
        {rows.map((s) => (
          <tr key={s.key}>
            <td className="mono" style={cellStyle}>{s.key}</td>
            <td style={cellStyle}>{displayStatusLabel(s.key)}</td>
            <td style={cellStyle}>{s.description ?? '·'}</td>
          </tr>
        ))}
      </Table>
    </>
  )
}

// ---------------------------------------------------------------------------
// Xero & archiving (the configurable inactivity window + the nightly job)
// ---------------------------------------------------------------------------

export function XeroArchivingView({ actor }: { actor: Actor }) {
  const settings = useAppStore((s) => s.settings)
  const xero = useAppStore((s) => s.xero)
  const billing = useAppStore((s) => s.billing)
  const clock = useAppStore((s) => s.clock)
  const [windowInput, setWindowInput] = useState(String(settings.contactArchiveInactivityDays))
  const [windowMsg, setWindowMsg] = useState<string | null>(null)
  const [runMsg, setRunMsg] = useState<string | null>(null)

  const eligible = useMemo(
    () => eligibleArchiveContactIds({ xero, billing, settings, clock }),
    [xero, billing, settings, clock],
  )
  const archivedCount = useMemo(() => Object.values(xero.contacts).filter((c) => c.archived).length, [xero.contacts])
  const vs = settings.volumeStory

  function saveWindow() {
    const outcome = setArchiveWindowDays(useAppStore, actor, Number(windowInput))
    setWindowMsg(
      outcome.ok
        ? `Archive window set to ${Math.round(Number(windowInput))} days. Next-run eligibility updated.`
        : outcome.message,
    )
  }

  function runNow() {
    const outcome = runArchiveJob(useAppStore)
    if (!outcome.ok) {
      setRunMsg(outcome.message)
      return
    }
    setRunMsg(
      outcome.value.count === 0
        ? 'No individual contacts are eligible to archive right now (fully paid + inactive beyond the window).'
        : `Archived ${outcome.value.count} contact${outcome.value.count === 1 ? '' : 's'}. Active-contact count is now ${useAppStore.getState().settings.volumeStory.activeContacts.toLocaleString('en-NZ')}.`,
    )
  }

  return (
    <>
      <Header title="Xero & archiving" sub="Contact-archive policy for the Xero contact store. Patient and Billable Party contacts archive once fully paid and inactive; organisational contacts never archive." />

      {/* Configurable window */}
      <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Contact archive inactivity window</div>
        <div style={{ fontSize: 12.5, color: neutral.slate }}>
          The RFP gives 90 days as an illustrative example, not a fixed rule, so it is a configurable
          setting. Changing it changes which contacts the next nightly run archives.
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ width: 160 }}>
            <TextField label="Inactivity days" value={windowInput} onChange={setWindowInput} mono />
          </div>
          <Button variant="secondary" onClick={saveWindow}>Save window</Button>
        </div>
        {windowMsg !== null && <div style={{ fontSize: 12.5, color: accent.pressed }}>{windowMsg}</div>}
      </div>

      {/* Nightly job */}
      <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Nightly contact-archive job</div>
        <div style={{ fontSize: 12.5, color: neutral.slate }}>
          The scheduled job runs automatically each time the demo clock advances a day. Run it now to
          archive currently-eligible contacts. {eligible.length} contact{eligible.length === 1 ? '' : 's'} eligible right now;
          {' '}{archivedCount} already archived.
        </div>
        <div style={{ fontSize: 12, color: neutral.mist, background: neutral.sunken, borderRadius: radius.ctl, padding: '8px 12px' }}>
          Scale (narrated, not simulated): ~{vs.invoicesPerYear.toLocaleString('en-NZ')} invoices/year, ~{vs.oneTimePct}% one-time
          clients, {vs.activeContacts.toLocaleString('en-NZ')} active contacts against Xero's ~{vs.softLimit.toLocaleString('en-NZ')} soft limit.
        </div>
        <div>
          <Button variant="secondary" onClick={runNow}>Run nightly archive job now</Button>
        </div>
        {runMsg !== null && <div style={{ fontSize: 12.5, color: accent.pressed }}>{runMsg}</div>}
      </div>
    </>
  )
}
