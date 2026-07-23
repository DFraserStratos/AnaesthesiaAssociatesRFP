import { useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { Contract } from '../../../domain/types'
import {
  createHospital,
  eligibleArchiveContactIds,
  runArchiveJob,
  setArchiveWindowDays,
  setInsurerDirectClaims,
  useAppStore,
  type Actor,
} from '../../../store'
import { Button, TextField, useSurface } from '../../../shared'
import { cellStyle as cellFactory, headCellStyle as headFactory } from '../tableChrome'
import { EditAnaesthetistSheet } from '../flows/EditAnaesthetistSheet'
import { AddAnaesthetistFlow } from '../flows/AddAnaesthetistFlow'
import { ContractEditSheet } from '../flows/ContractEditSheet'
import { PermanentListSheet } from '../flows/PermanentListSheet'
import { AddHolidaySheet } from '../flows/AddHolidaySheet'

interface MasterDataProps {
  actor: Actor
  todayISO: string
}

type Entity =
  | 'anaesthetists'
  | 'contracts'
  | 'permanentLists'
  | 'hospitals'
  | 'surgeons'
  | 'insurers'
  | 'organisations'
  | 'rvgCodes'
  | 'modifierCodes'
  | 'listStatuses'
  | 'xeroArchiving'

const NAV: { entity: Entity; label: string }[] = [
  { entity: 'anaesthetists', label: 'Anaesthetists' },
  { entity: 'contracts', label: 'Contracts' },
  { entity: 'permanentLists', label: 'Permanent lists' },
  { entity: 'hospitals', label: 'Hospitals & holidays' },
  { entity: 'surgeons', label: 'Surgeons' },
  { entity: 'insurers', label: 'Insurers' },
  { entity: 'organisations', label: 'Organisations' },
  { entity: 'rvgCodes', label: 'RVG codes' },
  { entity: 'modifierCodes', label: 'Modifier codes' },
  { entity: 'listStatuses', label: 'List statuses' },
  { entity: 'xeroArchiving', label: 'Xero & archiving' },
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const cellStyle = cellFactory(true)
const headCellStyle = headFactory(true)

type Sheet =
  | { kind: 'none' }
  | { kind: 'editAnae'; id: string }
  | { kind: 'addAnae' }
  | { kind: 'contract'; id?: string }
  | { kind: 'permList'; id?: string }
  | { kind: 'holiday'; hospitalId?: string }
  | { kind: 'addHospital' }

export function MasterData({ actor }: MasterDataProps) {
  const masters = useAppStore((s) => s.masters)
  const [entity, setEntity] = useState<Entity>('anaesthetists')
  const [sheet, setSheet] = useState<Sheet>({ kind: 'none' })

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', maxWidth: 1180 }}>
      {/* Entity sub-nav */}
      <div style={{ width: 190, flex: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Master data</h1>
        {NAV.map((n) => {
          const active = n.entity === entity
          return (
            <button
              key={n.entity}
              type="button"
              onClick={() => setEntity(n.entity)}
              style={{ textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none', background: active ? accent.tint : 'transparent', color: active ? accent.pressed : neutral.slate, fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer' }}
            >
              {n.label}
            </button>
          )
        })}
      </div>

      {/* Right view */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entity === 'anaesthetists' && <AnaesthetistsView onEdit={(id) => setSheet({ kind: 'editAnae', id })} onAdd={() => setSheet({ kind: 'addAnae' })} />}
        {entity === 'contracts' && <ContractsView onEdit={(id) => setSheet({ kind: 'contract', id })} onNew={() => setSheet({ kind: 'contract' })} />}
        {entity === 'permanentLists' && <PermanentListsView onEdit={(id) => setSheet({ kind: 'permList', id })} onAdd={() => setSheet({ kind: 'permList' })} />}
        {entity === 'hospitals' && <HospitalsView actor={actor} onAddHospital={() => setSheet({ kind: 'addHospital' })} onAddHoliday={(hospitalId) => setSheet({ kind: 'holiday', hospitalId })} />}
        {entity === 'surgeons' && <SurgeonsView />}
        {entity === 'insurers' && <InsurersView actor={actor} />}
        {entity === 'organisations' && <OrganisationsView />}
        {entity === 'rvgCodes' && <RvgCodesView />}
        {entity === 'modifierCodes' && <ModifierCodesView />}
        {entity === 'listStatuses' && <ListStatusesView />}
        {entity === 'xeroArchiving' && <XeroArchivingView actor={actor} />}
      </div>

      {/* Sheets */}
      {sheet.kind === 'editAnae' && masters.anaesthetists[sheet.id] !== undefined && (
        <EditAnaesthetistSheet open anaesthetist={masters.anaesthetists[sheet.id]!} actor={actor} onClose={() => setSheet({ kind: 'none' })} />
      )}
      <AddAnaesthetistFlow open={sheet.kind === 'addAnae'} actor={actor} onClose={() => setSheet({ kind: 'none' })} />
      {sheet.kind === 'contract' && (
        <ContractEditSheet open actor={actor} contract={sheet.id !== undefined ? masters.contracts[sheet.id] : undefined} onClose={() => setSheet({ kind: 'none' })} />
      )}
      {sheet.kind === 'permList' && (
        <PermanentListSheet open actor={actor} template={sheet.id !== undefined ? masters.permanentLists[sheet.id] : undefined} onClose={() => setSheet({ kind: 'none' })} />
      )}
      <AddHolidaySheet open={sheet.kind === 'holiday'} actor={actor} hospitalId={sheet.kind === 'holiday' ? sheet.hospitalId : undefined} onClose={() => setSheet({ kind: 'none' })} />
      {sheet.kind === 'addHospital' && <AddHospitalSheet actor={actor} onClose={() => setSheet({ kind: 'none' })} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared table chrome
// ---------------------------------------------------------------------------

function Header({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>
        {sub !== undefined && <div style={{ fontSize: 12.5, color: neutral.mist, marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  )
}

function Table({ heads, children, rightAlign }: { heads: string[]; children: React.ReactNode; rightAlign?: number[] }) {
  return (
    <div style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            {heads.map((h, i) => (
              <th key={h} style={{ ...headCellStyle, textAlign: rightAlign?.includes(i) ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function EditCell({ onClick }: { onClick: () => void }) {
  return (
    <td style={{ ...cellStyle, textAlign: 'right' }}>
      <button onClick={onClick} style={{ border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Edit</button>
    </td>
  )
}

// ---------------------------------------------------------------------------
// Anaesthetists
// ---------------------------------------------------------------------------

function AnaesthetistsView({ onEdit, onAdd }: { onEdit: (id: string) => void; onAdd: () => void }) {
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const rows = Object.values(anaesthetists).sort((a, b) => a.name.localeCompare(b.name))
  return (
    <>
      <Header title="Anaesthetists" sub="Unit value, contact, GST period and active flag are editable. Adding one extends the canvas forward." action={<Button variant="secondary" onClick={onAdd}>Add anaesthetist</Button>} />
      <Table heads={['Name', 'Reg', 'Unit $', 'GST', 'Phone', 'Active', '']} rightAlign={[6]}>
        {rows.map((a) => (
          <tr key={a.registrationNumber}>
            <td style={cellStyle}>{a.name}</td>
            <td className="mono" style={cellStyle}>{a.registrationNumber}</td>
            <td className="mono" style={cellStyle}>{a.unitValue.toFixed(2)}</td>
            <td style={cellStyle}>{a.gstPeriod}</td>
            <td style={cellStyle}>{a.phone}</td>
            <td style={cellStyle}>{a.active ? 'Yes' : 'No'}</td>
            <EditCell onClick={() => onEdit(a.registrationNumber)} />
          </tr>
        ))}
      </Table>
    </>
  )
}

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

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
      <Table heads={['Anaesthetist', 'Day', 'Session', 'Status', 'Hospital', 'Surgeon', '']} rightAlign={[6]}>
        {rows.map((p) => (
          <tr key={p.id}>
            <td style={cellStyle}>{masters.anaesthetists[p.anaesthetistId]?.name ?? p.anaesthetistId}</td>
            <td style={cellStyle}>{DAY_LABELS[p.dayOfWeek]}</td>
            <td style={cellStyle}>{p.session}</td>
            <td style={cellStyle}>{p.statusKey}</td>
            <td style={cellStyle}>{p.hospitalId !== null ? (masters.hospitals[p.hospitalId]?.name ?? p.hospitalId) : 'AA rooms'}</td>
            <td style={cellStyle}>{p.surgeonId !== null ? (masters.surgeons[p.surgeonId]?.name ?? p.surgeonId) : '·'}</td>
            <EditCell onClick={() => onEdit(p.id)} />
          </tr>
        ))}
      </Table>
    </>
  )
}

// ---------------------------------------------------------------------------
// Hospitals & holidays
// ---------------------------------------------------------------------------

function HospitalsView({ actor: _actor, onAddHospital, onAddHoliday }: { actor: Actor; onAddHospital: () => void; onAddHoliday: (hospitalId: string) => void }) {
  const masters = useAppStore((s) => s.masters)
  const hospitals = Object.values(masters.hospitals).sort((a, b) => a.name.localeCompare(b.name))
  const holidaysByHospital = useMemo(() => {
    const map: Record<string, { id: string; dateISO: string; name: string }[]> = {}
    for (const h of Object.values(masters.holidays)) (map[h.hospitalId] ??= []).push(h)
    for (const list of Object.values(map)) list.sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    return map
  }, [masters.holidays])

  return (
    <>
      <Header title="Hospitals & holidays" sub="Adding a hospital atomically creates its protected default Type 1 contract (visible in Contracts). A holiday flags booked lists at that hospital." action={<Button variant="secondary" onClick={onAddHospital}>Add hospital</Button>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hospitals.map((h) => (
          <div key={h.id} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</span>
              <button onClick={() => onAddHoliday(h.id)} style={{ border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Add holiday</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {(holidaysByHospital[h.id] ?? []).length === 0 ? (
                <span style={{ fontSize: 12, color: neutral.mist }}>No holidays recorded.</span>
              ) : (
                (holidaysByHospital[h.id] ?? []).map((hol) => (
                  <span key={hol.id} className="mono" style={{ fontSize: 11.5, background: neutral.sunken, borderRadius: 999, padding: '3px 10px', color: neutral.slate }}>
                    {hol.dateISO} · {hol.name}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function AddHospitalSheet({ actor, onClose }: { actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  function save() {
    const outcome = createHospital(useAppStore, actor, name)
    if (!outcome.ok) { setError(outcome.message); return }
    setError(null)
    setResult(`Added ${outcome.value.hospital.name}. Its default Type 1 contract "${outcome.value.defaultContract.name}" now appears in Contracts.`)
  }

  return (
    <Overlay open onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Add a hospital</div>
        <TextField label="Hospital name" value={name} onChange={setName} placeholder="e.g. Rangiora Day Surgery" />
        {error !== null && <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>}
        {result !== null ? (
          <>
            <div style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{result}</div>
            <Button variant="primary" block onClick={onClose}>Done</Button>
          </>
        ) : (
          <Button variant="primary" block onClick={save}>Add hospital</Button>
        )}
      </div>
    </Overlay>
  )
}

// ---------------------------------------------------------------------------
// Surgeons / Insurers / Organisations / codes / statuses (read-only + insurer flip)
// ---------------------------------------------------------------------------

function SurgeonsView() {
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const rows = Object.values(surgeons).sort((a, b) => a.name.localeCompare(b.name))
  return (
    <>
      <Header title="Surgeons" sub="Reference master (view only in this prototype)." />
      <Table heads={['Name', 'Specialty']}>
        {rows.map((s) => (
          <tr key={s.id}><td style={cellStyle}>{s.name}</td><td style={cellStyle}>{s.specialty ?? '·'}</td></tr>
        ))}
      </Table>
    </>
  )
}

function InsurersView({ actor }: { actor: Actor }) {
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

function OrganisationsView() {
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

function RvgCodesView() {
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

function ModifierCodesView() {
  const modifierCodes = useAppStore((s) => s.masters.modifierCodes)
  const rows = Object.values(modifierCodes).sort((a, b) => a.code.localeCompare(b.code))
  return (
    <>
      <Header title="Modifier codes" sub="Modifier-unit reference (view only). Demo-plausible values within the RFP ranges." />
      <Table heads={['Code', 'Group', 'Units', 'Description']} rightAlign={[2]}>
        {rows.map((m) => (
          <tr key={m.code}>
            <td className="mono" style={cellStyle}>{m.code}</td>
            <td style={cellStyle}>{m.group}</td>
            <td className="mono" style={{ ...cellStyle, textAlign: 'right' }}>{m.units}</td>
            <td style={cellStyle}>{m.description}</td>
          </tr>
        ))}
      </Table>
    </>
  )
}

function ListStatusesView() {
  const listStatuses = useAppStore((s) => s.masters.listStatuses)
  const rows = Object.values(listStatuses)
  return (
    <>
      <Header title="List statuses" sub="A fixed enumerated set (view only) shared by every app's status legend." />
      <Table heads={['Key', 'Label', 'Description']}>
        {rows.map((s) => (
          <tr key={s.key}>
            <td className="mono" style={cellStyle}>{s.key}</td>
            <td style={cellStyle}>{s.label}</td>
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

function XeroArchivingView({ actor }: { actor: Actor }) {
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
