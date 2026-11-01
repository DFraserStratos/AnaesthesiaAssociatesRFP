import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Check, ChevronLeft, ChevronRight, History, Sparkles, X } from 'lucide-react'
import { billingOf } from '../booking/billing'
import { HOSPITALS, RVG_BY_CODE, RVG_CODES, matches, type Selection } from '../data'
import { PathList, branchTiles, secondTiles, stepsOf, takeAnswer, type BillableProps } from './parts'
import { hasSecond, rowsOnPath, suggestedPath, type Path } from './paths'
import { SearchField } from '../pickers/shared'
import { AmountField, PriceByToggle, priceByOf, switchPriceBy } from '../booking/PricingExtras'
import { accent, elevation, neutral, radius, scrim, semantic } from '../theme/tokens'

/** The Anaesthetist Mobile App's atmosphere (aa-prototype AA_DEFAULT_GRADIENT): a faint brand-rose haze. */
const ATMOSPHERE = `linear-gradient(to bottom, rgba(246,248,247,0) 56%, rgba(246,248,247,1) 96%), radial-gradient(174% 106% at 34% -20%, rgba(236,206,213,0.45) 0%, rgba(236,206,213,0) 84%)`

type Sheet = 'payer' | 'pricing' | 'rvg' | null

/** The design language's Private status, as the real app's booking header shows it. */
const PRIVATE = { solid: '#2E66E5', tint: '#E8EEFC', onTint: '#1F44A3' }

/**
 * The same booking as the anaesthetist sees it on the phone, in the mobile
 * app's style: bottom sheets, not dropdowns. Whatever the office left open is
 * marked "To do"; the anaesthetist can change anything, and every change is
 * flagged for the office to review.
 */
export function PhoneBooking(props: BillableProps) {
  const { scenario, selection, onSelection, path, onRows, onStep } = props
  const [sheet, setSheet] = useState<Sheet>(null)
  // Cosmetic in the mock: times and completion rules are not modelled.
  const [completed, setCompleted] = useState(false)
  const b = billingOf(selection)
  const steps = stepsOf(scenario, path)
  const [receivedIndex, setReceivedIndex] = useState(scenario.received.length - 1)
  const shown = scenario.received[receivedIndex]!
  const ready = Boolean(path.branch && (!hasSecond(path) || path.second))

  const go = (p: Path) => takeAnswer(props, p)
  const close = () => {
    setSheet(null)
    onRows(null)
  }

  // Escape closes an open sheet, for the demo on a laptop.
  useEffect(() => {
    if (!sheet) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSheet(null)
        onRows(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheet, onRows])

  const payerText = steps.map((s) => s.label).join(' › ')
  const pricingText = !b.contract ? null : b.line ? `${b.line.code ? b.line.code + ' · ' : ''}${b.line.description}` : b.contract.name
  // The card the office sends: an RVG Contract leaves the code to the anaesthetist.
  const suggestion = suggestedPath(scenario)
  const by = priceByOf(selection)
  const patientPays = b.mode === 'rvg' && Boolean(b.contract?.isDefault)
  const onlyPricing = rowsOnPath(scenario, path).length < 2 && path.branch !== 'special'
  const todo = !ready ? 'payer' : !selection || b.mode === 'line' ? 'pricing' : b.mode === 'rvg' && !b.priced ? 'rvg' : null

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: neutral.bg, backgroundImage: ATMOSPHERE, overflow: 'hidden' }}>
      {/* Status bar */}
      <div className="mono" style={{ height: 44, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px', fontSize: 14, fontWeight: 600 }}>
        <span />
        <span style={{ fontSize: 12 }}>●●●</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* The real app's booking header: back to the List, the patient, the route pill and History. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: accent.base, fontSize: 15, fontWeight: 600 }}>
            <ChevronLeft size={18} /> List
          </span>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: '30px' }}>{scenario.patient.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: PRIVATE.tint, color: PRIVATE.onTint, borderRadius: 999, padding: '3px 10px', fontSize: 13, fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: PRIVATE.solid }} /> Private
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: accent.base, fontSize: 14, fontWeight: 600 }}>
              <History size={15} /> History
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: neutral.slate }}>
            <span className="mono">{scenario.time}</span> · {HOSPITALS[scenario.hospitalId]} · NHI <span className="mono">{scenario.patient.nhi}</span>
          </div>
        </div>

        <MobileCard
          title="Procedure"
          aside={
            scenario.received.length > 1 && (
              // The wording as each source sent it, as the office's card switches it.
              <div role="tablist" aria-label="Wording from" style={{ display: 'flex', background: neutral.sunken, borderRadius: 9, padding: 2, gap: 2 }}>
                {scenario.received.map((r, i) => (
                  <button key={r.source} type="button" role="tab" aria-selected={i === receivedIndex} onClick={() => setReceivedIndex(i)} style={{ border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: i === receivedIndex ? neutral.surface : 'transparent', color: i === receivedIndex ? accent.base : neutral.slate, boxShadow: i === receivedIndex ? '0 1px 2px rgba(23,35,32,0.12)' : 'none' }}>
                    {r.source === 'Hospital' ? 'Hospital' : 'Rooms'}
                  </button>
                ))}
              </div>
            )
          }
        >
          <div style={{ fontSize: 15, lineHeight: '21px' }}>{shown.text}</div>
          <div style={{ fontSize: 12, color: neutral.mist }}>
            {shown.at}
            {receivedIndex === scenario.received.length - 1 && scenario.received.length > 1 && ' · latest'} · {shown.system}
          </div>
        </MobileCard>

        <MobileCard title="Billing">
          <Row label="Invoice to" value={payerText || null} placeholder="Not set by the office" todo={todo === 'payer'} onTap={() => { setSheet('payer'); onStep() }} />
          <Row label="Pricing" value={pricingText} sub={b.contract && b.line ? b.contract.name : b.contract && onlyPricing ? 'The only option' : undefined} placeholder={ready ? 'Choose the price' : 'After where the invoice goes'} todo={todo === 'pricing'} disabled={!ready || onlyPricing} onTap={() => { setSheet('pricing'); onStep() }} />
          {patientPays && (
            // The patient pays: the anaesthetist prices it from the RVG or names a fixed price.
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${neutral.line}`, padding: '11px 0 2px' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: neutral.slate }}>Price by</span>
              <PriceByToggle
                large
                value={by}
                onChange={(v) => onSelection(switchPriceBy(selection, v))}
              />
            </div>
          )}
          {patientPays && by === 'amount' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 0 2px' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: todo === 'rvg' ? accent.base : neutral.slate }}>Fixed price{todo === 'rvg' && ' · to do'}</span>
              <AmountField large value={b.amount} onChange={(amount) => onSelection(selection ? { ...selection, amount } : null)} />
            </div>
          )}
          {b.mode === 'rvg' && !(patientPays && by === 'amount') &&
            (b.rvg ? (
              <button type="button" onClick={() => { setSheet('rvg'); onStep() }} style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left', border: 'none', borderTop: `1px solid ${neutral.line}`, background: 'transparent', padding: '11px 0 2px', cursor: 'pointer' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: neutral.slate }}>Procedure code</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '10px 12px' }}>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: accent.base }}>{b.rvg.code}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink, lineHeight: '20px' }}>{b.rvg.description}</span>
                  <span style={{ fontSize: 12.5, color: neutral.slate }}>Base {b.rvg.baseUnits}{b.rvg.maxUnits ? ` to ${b.rvg.maxUnits}` : ''} units</span>
                </span>
              </button>
            ) : (
              <Row label="Procedure code" value={null} placeholder="Choose the RVG code" todo={todo === 'rvg'} onTap={() => { setSheet('rvg'); onStep() }} />
            ))}
        </MobileCard>

      </div>

      {/* The real app's completion dock (aa-prototype CompleteBar): the phone shows no fee, only Mark complete. */}
      <div style={{ flex: 'none', padding: '14px 20px 22px', background: 'rgba(246,248,247,0.92)', borderTop: `1px solid ${neutral.line}` }}>
        {completed && !todo ? (
          <div style={{ height: 56, borderRadius: radius.card, background: semantic.success.tint, color: semantic.success.onTint, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 17, fontWeight: 700 }}>
            <Check size={18} strokeWidth={3} /> Booking complete
            <button type="button" onClick={() => setCompleted(false)} style={{ border: 'none', background: 'none', padding: '4px 0', marginLeft: 6, fontSize: 14, fontWeight: 600, color: accent.base, cursor: 'pointer', textDecoration: 'underline' }}>
              Amend
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Billing must be resolved first: where the invoice goes, the price, and the RVG code where one is needed. */}
            {todo && <span style={{ fontSize: 13, textAlign: 'center', color: neutral.slate }}>Finish the billing to mark it complete</span>}
            <button type="button" disabled={Boolean(todo)} onClick={() => setCompleted(true)} style={{ height: 56, width: '100%', borderRadius: radius.card, border: 'none', background: todo ? neutral.sunken : accent.base, color: todo ? neutral.mist : neutral.surface, fontSize: 17, fontWeight: 700, cursor: todo ? 'not-allowed' : 'pointer', boxShadow: todo ? 'none' : elevation.e2 }}>
              Mark complete
            </button>
          </div>
        )}
      </div>

      {sheet && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          <div onClick={close} style={{ position: 'absolute', inset: 0, background: scrim, animation: 'aa-fade-in 160ms ease-out' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '82%', height: sheet === 'payer' ? undefined : '82%', background: neutral.surface, borderRadius: `${radius.sheet}px ${radius.sheet}px 0 0`, boxShadow: elevation.e3, display: 'flex', flexDirection: 'column', animation: 'aa-sheet-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            <div style={{ width: 40, height: 5, borderRadius: 999, background: neutral.lineStrong, margin: '8px auto 4px' }} />
            <div style={{ display: 'flex', alignItems: 'center', padding: '4px 16px 10px' }}>
              <span style={{ flex: 1, fontSize: 17, fontWeight: 700 }}>{sheet === 'payer' ? 'Where does the invoice go?' : sheet === 'rvg' ? 'Procedure code' : 'Choose the price'}</span>
              <button type="button" aria-label="Close" onClick={close} style={{ border: 'none', background: neutral.sunken, borderRadius: 999, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {sheet === 'payer' && (
              <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                {branchTiles(scenario).map((o) => (
                  <SheetOption key={o.value} label={o.label} count={o.count} suggested={suggestion.branch === o.value} on={path.branch === o.value} onPick={() => (go({ branch: o.value }), o.value === 'special' && close())} />
                ))}
                {hasSecond(path) && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: neutral.slate, marginTop: 8 }}>{path.branch === 'patient' ? 'Is it prepaid?' : 'Under which contract?'}</div>
                    {secondTiles(scenario, path).map((o) => (
                      <SheetOption key={o.value} label={o.label} count={o.count} suggested={suggestion.branch === path.branch && suggestion.second === o.value} on={path.second === o.value} onPick={() => (go({ ...path, second: o.value }), close())} />
                    ))}
                  </>
                )}
              </div>
            )}

            {sheet === 'rvg' && (
              <RvgSheet
                value={selection?.rvgCode}
                onPick={(rvgCode) => {
                  onSelection(selection ? { ...selection, rvgCode } : null)
                  close()
                }}
              />
            )}

            {sheet === 'pricing' && (
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderTop: `1px solid ${neutral.line}` }}>
                <PathList
                  fill
                  scenario={scenario}
                  path={path}
                  selection={selection}
                  onRows={onRows}
                  onPick={(sel: Selection) => {
                    onSelection(sel)
                    onStep()
                    close()
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MobileCard({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ background: neutral.surface, borderRadius: radius.card, boxShadow: elevation.e1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 24 }}>
        <h3 style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.slate }}>{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Row({ label, value, sub, placeholder, todo, disabled, onTap }: { label: string; value: string | null; sub?: string; placeholder: string; todo?: boolean; disabled?: boolean; onTap: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onTap}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderTop: `1px solid ${neutral.line}`, background: 'transparent', padding: '11px 0', cursor: disabled ? 'default' : 'pointer' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: todo ? accent.base : neutral.slate }}>
          {label}
          {todo && ' · to do'}
        </div>
        <div style={{ fontSize: 15, fontWeight: value ? 600 : 400, color: value ? neutral.ink : neutral.mist, lineHeight: '20px' }}>{value ?? placeholder}</div>
        {sub && <div style={{ fontSize: 12.5, color: neutral.slate }}>{sub}</div>}
      </div>
      {!disabled && <ChevronRight size={18} color={neutral.mist} />}
    </button>
  )
}

function SheetOption({ label, count, suggested, on, onPick }: { label: string; count: number; suggested?: boolean; on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      disabled={count === 0}
      onClick={onPick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '13px 14px', borderRadius: 12, border: `1px solid ${on ? accent.base : neutral.line}`, background: on ? accent.tint : neutral.surface, color: count === 0 ? neutral.mist : on ? accent.base : neutral.ink, fontSize: 15.5, fontWeight: 600, cursor: count === 0 ? 'default' : 'pointer' }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      {suggested && count > 0 && (
        <span title="Suggested from the booking’s funder" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, color: accent.base }}>
          <Sparkles size={14} /> Suggested
        </span>
      )}
      <span className="mono" style={{ fontSize: 12.5, color: neutral.slate }}>{count === 0 ? 'none' : count}</span>
    </button>
  )
}

/** The RVG code picker as a sheet: search, then tap a code (codes that start with what was typed first). */
function RvgSheet({ value, onPick }: { value?: string; onPick: (code: string | undefined) => void }) {
  const [q, setQ] = useState('')
  // Grouped by body part in the RVG's own order, as the office's RVG field groups them;
  // typing filters, and groups with codes that start with what was typed come first.
  const groups = useMemo(() => {
    const t = q.trim().toLowerCase()
    const hits = RVG_CODES.filter((r) => !t || r.code.toLowerCase().startsWith(t) || matches(q, r.description, r.region, r.sub))
    const byGroup = new Map<string, typeof hits>()
    for (const r of hits) {
      const key = r.sub ? `${r.region} · ${r.sub}` : r.region
      byGroup.set(key, [...(byGroup.get(key) ?? []), r])
    }
    const all = [...byGroup.entries()]
    if (!t) return all
    const prefixed = (rows: typeof hits) => rows.some((r) => r.code.toLowerCase().startsWith(t))
    return [...all.filter(([, rows]) => prefixed(rows)), ...all.filter(([, rows]) => !prefixed(rows))]
  }, [q])
  const current = value ? RVG_BY_CODE.get(value) : undefined
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderTop: `1px solid ${neutral.line}` }}>
      <div style={{ display: 'flex', padding: '10px 16px' }}>
        <SearchField autoFocus value={q} onChange={setQ} placeholder="Code or procedure, e.g. LL3" />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {current && (
          <button type="button" onClick={() => onPick(undefined)} style={{ border: 'none', background: 'transparent', color: accent.base, fontSize: 14, fontWeight: 600, textAlign: 'left', padding: '4px 0 8px', cursor: 'pointer' }}>
            Clear {current.code}, leave it for later
          </button>
        )}
        {groups.map(([group, rows]) => (
          <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 1, background: neutral.surface, padding: '10px 2px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.slate }}>{group}</div>
            {rows.map((r, i) => {
              const on = r.code === value
              return (
                <button key={`${r.code}-${i}`} type="button" onClick={() => onPick(r.code)} style={{ display: 'flex', gap: 10, alignItems: 'baseline', textAlign: 'left', padding: '10px 12px', borderRadius: 12, border: `1px solid ${on ? accent.base : neutral.line}`, background: on ? accent.tint : neutral.surface, cursor: 'pointer' }}>
                  <span className="mono" style={{ flex: 'none', minWidth: 44, fontSize: 13.5, fontWeight: 700, color: accent.base }}>{r.code}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: neutral.ink, lineHeight: '19px' }}>{r.description}</span>
                    <span style={{ fontSize: 12, color: neutral.slate }}>Base {r.baseUnits}{r.maxUnits ? ` to ${r.maxUnits}` : ''} units</span>
                  </span>
                </button>
              )
            })}
          </div>
        ))}
        {groups.length === 0 && <div style={{ fontSize: 14, color: neutral.slate, padding: '8px 0' }}>No RVG code matches.</div>}
      </div>
    </div>
  )
}
