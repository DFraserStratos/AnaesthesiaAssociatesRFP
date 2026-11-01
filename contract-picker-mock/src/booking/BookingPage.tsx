import { useRef, type ReactNode } from 'react'
import { useSize } from '../chrome/useViewport'
import { AlertTriangle, ChevronLeft, CircleCheck, History, Paperclip, Wallet } from 'lucide-react'
import { HOSPITALS, money, type Scenario, type Selection } from '../data'
import { accent, neutral, radius, semantic } from '../theme/tokens'
import { billingOf } from './billing'

/** Booking-route chip colour: the design language's Private status. */
const PRIVATE = { solid: '#2E66E5', tint: '#E8EEFC', onTint: '#1F44A3' }

interface Props {
  scenario: Scenario
  selection: Selection | null
  /** The approach's procedure and Contract cards, at the top of the capture column. */
  top: ReactNode
}

/**
 * The Admin booking detail, laid out as aa-prototype's AdminBookingDetail:
 * header, the procedure with its contract-holder chip, capture cards in an
 * 8-column main area, and the total, status and context cards in a 4-column aside.
 */
export function BookingPage({ scenario, selection, top }: Props) {
  const b = billingOf(selection)
  const p = scenario.patient
  const latest = scenario.received[scenario.received.length - 1]!
  // Laid out by the room it has, not the window: the nav and the phone take their share first.
  const root = useRef<HTMLDivElement>(null)
  const { width } = useSize(root)
  const narrow = width > 0 && width < 990

  const summary = (
    <>
      <div style={{ background: neutral.ink, borderRadius: radius.card, padding: '18px 18px 16px', color: '#FFFFFF', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)' }}>BOOKING TOTAL</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="mono" style={{ fontSize: 28, fontWeight: 700 }}>{b.mode === 'fixed' || b.amount !== undefined ? 'Fixed' : (b.baseUnits ?? 0)}</span>
            {b.mode !== 'fixed' && b.amount === undefined && <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>units so far</span>}
          </span>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', minWidth: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{b.rateLabel}</span>
          <span className="mono" style={{ fontSize: 28, fontWeight: 700 }}>{b.fee === null ? '$0.00' : `${b.line?.approx ? '~' : ''}$${b.fee.toFixed(2)}`}</span>
        </span>
      </div>

      {b.prepay ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: semantic.warning.tint, color: semantic.warning.onTint, borderRadius: radius.card, padding: '13px 16px', fontSize: 14.5, fontWeight: 600 }}>
          <Wallet size={18} />
          <span style={{ flex: 1 }}>Prepayment required · invoice raised on approval</span>
        </div>
      ) : b.mode === 'none' || b.mode === 'line' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: semantic.warning.tint, color: semantic.warning.onTint, borderRadius: radius.card, padding: '13px 16px', fontSize: 14.5, fontWeight: 600 }}>
          <AlertTriangle size={18} />
          <span style={{ flex: 1 }}>{b.mode === 'line' ? 'Needs the procedure' : 'Needs a Contract'}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: semantic.success.tint, color: semantic.success.onTint, borderRadius: radius.card, padding: '13px 16px', fontSize: 14.5, fontWeight: 600 }}>
          <CircleCheck size={18} />
          <span style={{ flex: 1 }}>{b.mode === 'rvg' && !b.priced ? 'Contract set · card with the anaesthetist' : 'Contract set · ready for the day'}</span>
        </div>
      )}
    </>
  )
  const context = (
    <>
      <SideCard title="Patient" action="Edit">
        <KV k="NHI" v={<span className="mono">{p.nhi}</span>} />
        <KV k="Date of birth" v={`${p.dob} · ${p.age} years`} />
        <KV k="Contact" v={<span className="mono">{scenario.contact}</span>} />
        <KV k="Scheduled" v={<span className="mono">{scenario.date.slice(4)} · {scenario.session} · {scenario.time}</span>} />
      </SideCard>

      <SideCard title="List">
        <KV k="Hospital" v={HOSPITALS[scenario.hospitalId]} />
        <KV k="Surgeon" v={scenario.surgeon.name} />
        <KV k="Anaesthetist" v={scenario.anaesthetist.name} />
        <KV k="Funder" v={<span>{scenario.funder} <span style={{ color: neutral.mist, fontSize: 12.5 }}>· suggests, never narrows</span></span>} />
      </SideCard>

      <div style={{ fontSize: 12.5, color: neutral.slate, padding: '0 4px' }}>
        <span style={{ fontWeight: 600, letterSpacing: '0.06em', fontSize: 11 }}>SOURCE</span> · {scenario.received[0]!.system}, updated by {latest.system}
      </div>

      <SideCard title="Attachments" action={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Paperclip size={14} /> Add attachment</span>}>
        <div style={{ fontSize: 13.5, color: neutral.slate }}>No attachments.</div>
      </SideCard>
    </>
  )

  return (
    // The ref sits outside the padding, so the padding that `narrow` changes can never move the width it measures.
    <div ref={root}>
    <div style={{ padding: narrow ? '20px 22px 48px' : '24px 28px 56px', display: 'flex', flexDirection: 'column', gap: narrow ? 16 : 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: accent.base, fontSize: 14, fontWeight: 600 }}>
          <ChevronLeft size={16} /> Day view
        </span>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.02em' }}>{p.name}</h1>
            <span className="mono" style={{ fontSize: 12.5, color: neutral.slate, textTransform: 'uppercase' }}>
              NHI {p.nhi} · DOB {p.dob} ({p.age}y)
            </span>
            <span style={{ fontSize: 14.5 }}>
              {scenario.date} · <span className="mono">{scenario.time}</span> · {HOSPITALS[scenario.hospitalId]}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14, flex: 'none' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: PRIVATE.tint, color: PRIVATE.onTint, borderRadius: 999, padding: '3px 10px', fontSize: 13, fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: PRIVATE.solid }} /> Private
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: accent.base, fontSize: 13.5, fontWeight: 600 }}>
              <History size={15} /> History
            </span>
          </div>
        </div>
      </div>

      {narrow ? (
        // A laptop: no room for a side column, so the total and status lead and the context cards sit two-up after the capture cards.
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, alignItems: 'stretch' }}>{summary}</div>
          {top}

          <Panel title="Times" foot="Captured on the day.">
            <div style={{ display: 'flex', gap: 48, alignItems: 'baseline', padding: '4px 0' }}>
              {['Start', 'Finish'].map((t) => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 13.5, color: neutral.slate }}>{t}</span>
                  <span className="mono" style={{ fontSize: 24, fontWeight: 600, color: neutral.lineStrong }}>--:--</span>
                </span>
              ))}
            </div>
          </Panel>

          <Panel title="Units">
            {b.mode === 'fixed' || b.amount !== undefined ? (
              <div style={{ fontSize: 14, color: neutral.slate, padding: '2px 0 4px' }}>
                Units are not used. {b.amount !== undefined ? 'The fixed price' : 'The agreed fee'} sets the price: <span className="mono" style={{ color: neutral.ink, fontWeight: 600 }}>{money(b.fee!)}</span>.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <UnitRow name="B · Base" hint={b.rvg ? `From RVG ${b.rvg.code}` : 'From the RVG code'} value={b.baseUnits} />
                <UnitRow name="T · Time" hint="From start and finish times" value={null} />
                <UnitRow name="M · Modifiers" hint="ASA, age, BMI and the rest, on the day" value={null} />
              </div>
            )}
          </Panel>

          <OfficeBillingSetup selection={selection} />
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, alignItems: 'start' }}>{context}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 16, alignItems: 'start' }}>
          {/* Capture column */}
          <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {top}

            <Panel title="Times" foot="Captured on the day.">
              <div style={{ display: 'flex', gap: 48, alignItems: 'baseline', padding: '4px 0' }}>
                {['Start', 'Finish'].map((t) => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontSize: 13.5, color: neutral.slate }}>{t}</span>
                    <span className="mono" style={{ fontSize: 24, fontWeight: 600, color: neutral.lineStrong }}>--:--</span>
                  </span>
                ))}
              </div>
            </Panel>

            <Panel title="Units">
              {b.mode === 'fixed' || b.amount !== undefined ? (
                <div style={{ fontSize: 14, color: neutral.slate, padding: '2px 0 4px' }}>
                  Units are not used. {b.amount !== undefined ? 'The fixed price' : 'The agreed fee'} sets the price: <span className="mono" style={{ color: neutral.ink, fontWeight: 600 }}>{money(b.fee!)}</span>.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <UnitRow name="B · Base" hint={b.rvg ? `From RVG ${b.rvg.code}` : 'From the RVG code'} value={b.baseUnits} />
                  <UnitRow name="T · Time" hint="From start and finish times" value={null} />
                  <UnitRow name="M · Modifiers" hint="ASA, age, BMI and the rest, on the day" value={null} />
                </div>
              )}
            </Panel>

            <OfficeBillingSetup selection={selection} />
          </div>

          {/* Aside */}
          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 20 }}>
            {summary}
            {context}
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

function Panel({ title, foot, children }: { title: string; foot?: string; children: ReactNode }) {
  return (
    <section style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.slate }}>{title}</h3>
      {children}
      {foot && <div style={{ fontSize: 13, color: neutral.slate }}>{foot}</div>}
    </section>
  )
}

function UnitRow({ name, hint, value }: { name: string; hint: string; value: number | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 13, color: neutral.slate }}>{hint}</div>
      </div>
      {value === null ? <span style={{ fontSize: 13, color: neutral.mist }}>On the day</span> : <span className="mono" style={{ fontSize: 20, fontWeight: 700 }}>{value}</span>}
    </div>
  )
}

function SideCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.slate }}>{title}</h3>
        {action && <span style={{ color: accent.base, fontSize: 13.5, fontWeight: 600 }}>{action}</span>}
      </div>
      {children}
    </section>
  )
}

function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 14, lineHeight: '20px' }}>
      <span style={{ width: 96, flex: 'none', color: neutral.slate, fontSize: 13 }}>{k}</span>
      <span style={{ flex: 1, minWidth: 0 }}>{v}</span>
    </div>
  )
}

/** The prototype's "Office billing setup" card: accent tint, label rows, grey actions under. */
function OfficeBillingSetup({ selection }: { selection: Selection | null }) {
  const b = billingOf(selection)
  const missing = { color: semantic.warning.onTint, fontWeight: 600 }
  const rows: [string, ReactNode][] = [
    ['Route', 'Contract holder'],
    ['Contract', b.contract ? b.contract.name : <span style={missing}>Missing</span>],
    ['Holder', b.contract ? b.contract.holder : '·'],
    ['Line', b.line ? `${b.line.code ? b.line.code + ' · ' : ''}${b.line.description}${b.line.band ? ` (${b.line.band})` : ''}` : b.amount !== undefined ? 'None, a fixed price' : b.mode === 'rvg' ? 'None, priced from the RVG' : '·'],
    ['Reference', 'None'],
    ['Override', 'None'],
    ['Prepayment', b.prepay ? `Required · ${money(b.line!.fee)}, from ${b.contract!.name}` : 'Not required'],
  ]
  const grey = { border: 'none', background: neutral.sunken, color: neutral.ink, borderRadius: radius.ctl, padding: '9px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' } as const
  return (
    <section style={{ background: accent.tint, border: `1px solid ${accent.base}33`, borderRadius: radius.card, padding: 16 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent.base }}>Office billing setup · procedure 1</h3>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', gap: 12, padding: '4px 0', fontSize: 14 }}>
          <span style={{ width: 84, flex: 'none', color: accent.base, fontSize: 13 }}>{k}</span>
          <span style={{ flex: 1, minWidth: 0 }}>{v}</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" style={{ ...grey, cursor: 'default', opacity: 0.6 }}>Price override</button>
        <button type="button" style={{ ...grey, cursor: 'default', opacity: 0.6 }}>Funder allocation</button>
      </div>
    </section>
  )
}
