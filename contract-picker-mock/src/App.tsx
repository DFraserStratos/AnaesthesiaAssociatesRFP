import { useCallback, useRef, useState } from 'react'
import { BillableTop, HandoffStatus } from './billing/BillableTop'
import { PhoneBooking } from './billing/PhoneBooking'
import { SECOND_LABEL, pathOf, type Path } from './billing/paths'
import { branchLabel } from './billing/parts'
import { BookingPage } from './booking/BookingPage'
import { billingOf } from './booking/billing'
import { TopCards } from './booking/TopCards'
import { HarnessBar } from './chrome/HarnessBar'
import { SideNav } from './chrome/SideNav'
import { LAPTOP, useSize, useWindowWidth } from './chrome/useViewport'
import { SCENARIOS, type Selection } from './data'
import { neutral } from './theme/tokens'

export type Approach = 'bp-rail' | 'bp-tree' | 'procedure' | 'contract' | 'holder' | 'single'

export const isBillableFirst = (a: Approach) => a.startsWith('bp-')

/** A booking opens as the office left it: empty, or with its pre-filled picks. */
const prefillOf = (id: string) => SCENARIOS.find((s) => s.id === id)?.prefill

/** In words, what a phone-side change did, for the office's review flag. */
function describe(sel: Selection | null): string {
  const b = billingOf(sel)
  if (!b.contract) return 'cleared the price'
  if (b.line) return `chose ${b.line.code ? b.line.code + ' ' : ''}${b.line.description}`
  if (b.amount !== undefined) return `set a fixed price of $${b.amount.toLocaleString('en-NZ')}`
  return b.rvg ? `chose ${b.contract.name}, RVG ${b.rvg.code}` : `chose ${b.contract.name}`
}

export function App() {
  const [approach, setApproach] = useState<Approach>('bp-rail')
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0]!.id)
  // The List filter is always on: every Contract list is the List's (hospital, surgeon, anaesthetist, day).
  const useContext = true
  const [selection, setSelection] = useState<Selection | null>(prefillOf(SCENARIOS[0]!.id)?.selection ?? null)
  const [procedureId, setProcedureId] = useState<string | undefined>(prefillOf(SCENARIOS[0]!.id)?.procedureId)
  // Ben's path (where the invoice goes, then prepaid or the hospital's contract), shared by the office and the phone.
  const [path, setPath] = useState<Path>(pathOf(SCENARIOS[0]!, prefillOf(SCENARIOS[0]!.id)?.selection ?? null))
  const [review, setReview] = useState<string | null>(null)
  const [rows, setRows] = useState<number | null>(null)
  const [steps, setSteps] = useState(0)

  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!
  const laptop = useWindowWidth() < LAPTOP
  const phoneBay = useRef<HTMLDivElement>(null)
  const bay = useSize(phoneBay)
  const phoneZoom = bay.width ? Math.min(1, bay.width / 412) : 1

  const reset = (id = scenarioId) => {
    const s = SCENARIOS.find((x) => x.id === id)!
    const sel = prefillOf(id)?.selection ?? null
    setSelection(sel)
    setProcedureId(prefillOf(id)?.procedureId)
    setPath(pathOf(s, sel))
    setReview(null)
    setRows(null)
    setSteps(0)
  }
  const onRows = useCallback((n: number | null) => setRows(n), [])
  const onStep = useCallback(() => setSteps((n) => n + 1), [])

  const billable = { scenario, useContext, selection, onSelection: setSelection, path, onPath: setPath, onRows, onStep }
  // The phone: the same booking, but every change is flagged for the office to review.
  const phone = {
    ...billable,
    onSelection: (sel: Selection | null) => {
      setSelection(sel)
      // A path change clears the price as a side effect; keep its message rather than "cleared the price".
      setReview((prev) => (sel ? describe(sel) : (prev ?? describe(sel))))
    },
    onPath: (p: Path) => {
      setPath(p)
      setReview(`set the invoice to ${[p.branch && branchLabel(scenario, p.branch), p.second && SECOND_LABEL[p.second]].filter(Boolean).join(' › ')}`)
    },
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <HarnessBar
        approach={approach}
        onApproach={(a) => {
          setApproach(a)
          reset()
        }}
        scenarioId={scenarioId}
        onScenario={(id) => {
          setScenarioId(id)
          reset(id)
        }}
        rows={rows}
        steps={steps}
      />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* The office's Admin app, titled so the workshop can tell the two views apart. */}
        <section aria-label="Admin view" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <ViewTitle title="Admin view" sub="The AA office, booking and billing" />
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <SideNav compactByDefault={laptop} />
        <main style={{ flex: 1, minWidth: 0, overflow: 'auto', background: neutral.bg }}>
          <BookingPage
            scenario={scenario}
            selection={selection}
            top={
              isBillableFirst(approach) ? (
                <BillableTop key={`${approach}-${scenarioId}`} approach={approach} review={review} onReviewed={() => setReview(null)} {...billable} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <TopCards
                  key={`${approach}-${scenarioId}`}
                  approach={approach}
                  scenario={scenario}
                  useContext={useContext}
                  selection={selection}
                  procedureId={procedureId}
                  onSelection={(sel) => {
                    setSelection(sel)
                    setPath(pathOf(scenario, sel))
                  }}
                  onProcedure={setProcedureId}
                  onRows={onRows}
                  onStep={onStep}
                />
                <HandoffStatus review={review} onReviewed={() => setReview(null)} />
                </div>
              )
            }
          />
        </main>
        </div>
        </section>

        {/* The anaesthetist's phone, docked beside the office's page under every option: one booking, two views. */}
        <aside aria-label="Anaesthetist view" style={{ flex: 'none', width: laptop ? 392 : 460, background: '#E4E8E6', borderLeft: `1px solid ${neutral.lineStrong}`, display: 'flex', flexDirection: 'column' }}>
          <ViewTitle title="Anaesthetist view" sub={`${scenario.anaesthetist.name}'s phone`} />
          <div ref={phoneBay} style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: laptop ? 12 : 16 }}>
            {/* A real 390pt phone, scaled down (never up) to fit a laptop's narrower bay; its height fills the bay. */}
            <div style={{ zoom: phoneZoom, width: 412, height: `min(844px, ${Math.floor(bay.height / phoneZoom)}px)`, borderRadius: 48, border: `11px solid ${neutral.ink}`, boxShadow: '0 24px 56px rgba(23,35,32,0.25)', overflow: 'hidden', background: neutral.bg }}>
              <PhoneBooking key={scenarioId} {...phone} />
            </div>
          </div>
          </aside>
      </div>
    </div>
  )
}

/** A workshop title over one of the two views: which app it is, and whose. */
function ViewTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ flex: 'none', height: 40, display: 'flex', alignItems: 'baseline', gap: 10, padding: '10px 16px 0', background: neutral.sunken, borderBottom: `1px solid ${neutral.lineStrong}`, whiteSpace: 'nowrap', overflow: 'hidden' }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: neutral.ink }}>{title}</span>
      <span style={{ fontSize: 13, color: neutral.slate, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>
    </div>
  )
}
