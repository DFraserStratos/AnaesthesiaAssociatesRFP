/**
 * The NHI leak scan (catch-up Phase 43; US-15.0.6, US-09.3.1, OQ-30 "No PII in
 * Xero"). It proves the policy, area by area:
 *
 * - **Xero** (must be zero): the whole Xero slice and the engine's Xero sync
 *   queue, checked for any NHI and for the personal information of patients and
 *   payers (names, phones, emails, addresses, dates of birth). Organisation
 *   names (hospitals, insurers, surgeons, anaesthetist payees) are not personal
 *   information here.
 * - **Diagnostic log**: every kept entry, refusals included.
 * - **Failure reasons**: billing exceptions, Xero queue errors and divergence
 *   notes, unmatched-row reasons and flags, hospital message failures, and the
 *   master loader's row messages.
 * - **Held inside the core platform** (allowed, never a leak): patients,
 *   Bookings, import rows (their raw payload included) and the audit trail,
 *   reported as counts "Held by design".
 *
 * Linear at full scale: each area's text is walked once; the known NHIs and the
 * known personal values are sets built once. The report never holds an
 * unmasked NHI or personal value. The scan time comes from `timed()`.
 */

import type { AppState } from './appStore'
import { findNhiTokens, maskNhi } from '../domain/privacy/nhiDetect'
import { recentDiagnostics, type DiagnosticEntry } from './diagnostics'
import { timed } from './scaleMode'
import { importRowViews } from './matchingSelectors'

export type LeakAreaKey = 'xero' | 'diagnostics' | 'planted' | 'failures' | 'patients' | 'bookings' | 'importRows' | 'audit'

export interface LeakHit {
  /** Where, as record ids and field names (never the value). */
  location: string
  /** The masked token ("ZAA••••"), or what kind of personal detail ("A patient's name"). */
  what: string
}

export interface LeakArea {
  key: LeakAreaKey
  label: string
  scanned: string
  items: number
  /** Leak areas only; `heldByDesign` rows report counts. */
  hits: LeakHit[]
  heldByDesign: boolean
  /** The Xero area also checks personal details. */
  checksPersonalDetails: boolean
}

export interface LeakScanReport {
  areas: LeakArea[]
  /** Items scanned across the leak areas. */
  items: number
  hits: number
  ms: number
  /** The demo clock time the scan ran. */
  atISO: string
  planted: boolean
}

export interface LeakScanOptions {
  /** Adds one labelled synthetic diagnostic line with a real seeded NHI to the scan input only (never to the log or the store). */
  plantTestLeak?: boolean
}

type ScanState = Pick<AppState, 'xero' | 'billing' | 'masters' | 'schedule' | 'intake' | 'audit' | 'integrations' | 'masterLoads' | 'clock'>

/** Every string under `value`, with its path. */
function walk(value: unknown, path: string, visit: (text: string, path: string) => void): void {
  if (typeof value === 'string') visit(value, path)
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`, visit))
  else if (value !== null && typeof value === 'object') for (const [k, v] of Object.entries(value as Record<string, unknown>)) walk(v, path === '' ? k : `${path}.${k}`, visit)
}

/** The known personal values (lower-cased), each with what kind it is. */
function personalValues(state: ScanState): Map<string, string> {
  const known = new Map<string, string>()
  const add = (v: string | undefined, kind: string) => {
    const t = v?.trim().toLowerCase()
    if (t !== undefined && t.length >= 5) known.set(t, kind)
  }
  for (const p of Object.values(state.masters.patients)) {
    add(p.name, "A patient's name")
    add(p.phone, "A patient's phone")
    add(p.email, "A patient's email")
    add(p.dobISO, "A patient's date of birth")
    add(p.postalAddress?.line1, "A patient's address")
  }
  for (const pr of Object.values(state.schedule.procedures)) {
    if (pr.payer.kind !== 'other') continue
    add(pr.payer.name, "A payer's name")
    add(pr.payer.email, "A payer's email")
    add(pr.payer.phone, "A payer's phone")
  }
  return known
}

/** Personal values in one string: the whole value, or a run of two or three words in it. */
function personalIn(text: string, known: Map<string, string>): string | undefined {
  const lower = text.trim().toLowerCase()
  const whole = known.get(lower)
  if (whole !== undefined) return whole
  const words = lower.split(/[^a-z0-9@.\-'ʻāēīōū]+/).filter((w) => w !== '')
  for (let i = 0; i < words.length; i++) {
    for (const n of [2, 3]) {
      if (i + n > words.length) continue
      const hit = known.get(words.slice(i, i + n).join(' '))
      if (hit !== undefined) return hit
    }
    const single = known.get(words[i]!)
    if (single !== undefined && single !== "A patient's name" && single !== "A payer's name") return single
  }
  return undefined
}

/**
 * The app's own record ids (`PMT0004`, `DSB0003`): a few happen to pass the NHI
 * check digit, but an id is not an NHI. A token that is a patient's NHI is never excused (the
 * full-scale generator also keeps patient NHIs off the app's id prefixes).
 */
function internalIdsOf(state: ScanState): Set<string> {
  const ids = new Set<string>()
  const maps: Record<string, unknown>[] = [
    state.xero.contacts, state.xero.accRecs, state.xero.accPays, state.xero.payments, state.xero.disbursements, state.xero.journals, state.xero.remittances, state.xero.bankLines, state.xero.creditNotes, state.xero.refunds,
    state.billing.invoices, state.billing.invoiceLines, state.billing.ledger, state.billing.receipts, state.billing.disbursements, state.billing.exceptions, state.billing.xeroQueue, state.billing.transfers, state.billing.aaFeeInvoices,
    state.billing.creditNotes, state.billing.negativeInvoices, state.billing.prepaymentRefunds,
    state.schedule.lists, state.schedule.bookings, state.schedule.procedures, state.intake.rows, state.intake.batches, state.intake.stubs, state.integrations.messages,
  ]
  for (const m of maps) for (const k of Object.keys(m)) if (k.length === 7) ids.add(k.toUpperCase())
  // A patient's NHI is always a hit, even where a synthetic NHI happens to equal a record id.
  for (const p of Object.values(state.masters.patients)) if (p.nhi !== undefined) ids.delete(p.nhi.toUpperCase())
  return ids
}

let INTERNAL_IDS: ReadonlySet<string> = new Set()

function nhiHits(text: string, path: string, into: LeakHit[]): void {
  for (const nhi of findNhiTokens(text)) if (!INTERNAL_IDS.has(nhi)) into.push({ location: path, what: maskNhi(nhi) })
}

function diagnosticText(e: DiagnosticEntry): string {
  return e.context !== undefined ? `${e.message} ${JSON.stringify(e.context)}` : e.message
}

export function scanForNhiLeaks(state: ScanState, options: LeakScanOptions = {}): LeakScanReport {
  const run = timed(() => {
    INTERNAL_IDS = internalIdsOf(state)
    const areas: LeakArea[] = []

    // Xero: NHIs and personal details, record by record.
    const known = personalValues(state)
    // Organisation names are not personal information here (OQ-30): an anaesthetist payee, hospital, Party or surgeon.
    const organisations = new Set<string>()
    for (const a of Object.values(state.masters.anaesthetists)) organisations.add(a.name.toLowerCase())
    for (const h of Object.values(state.masters.hospitals)) organisations.add(h.name.toLowerCase())
    for (const pt of Object.values(state.masters.parties)) {
      organisations.add(pt.name.toLowerCase())
      if (pt.billingName !== undefined) organisations.add(pt.billingName.toLowerCase())
    }
    for (const sg of Object.values(state.masters.surgeons)) organisations.add(sg.name.toLowerCase())
    // One pattern of every organisation name, longest first, to strip them from a sentence (a BCTI's wording names its anaesthetist).
    const escaped = [...organisations].filter((n) => n.length >= 4).sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const orgPattern = escaped.length > 0 ? new RegExp(escaped.join('|'), 'g') : null
    const xeroHits: LeakHit[] = []
    let xeroItems = 0
    const xeroMaps: [string, Record<string, unknown>][] = [
      ['contacts', state.xero.contacts],
      ['accRecs', state.xero.accRecs],
      ['accPays', state.xero.accPays],
      ['payments', state.xero.payments],
      ['disbursements', state.xero.disbursements],
      ['journals', state.xero.journals],
      ['remittances', state.xero.remittances],
      ['bankLines', state.xero.bankLines],
      ['creditNotes', state.xero.creditNotes],
      // Catch-up Phase 41: the refunds paid in Xero.
      ['refunds', state.xero.refunds],
      ['syncQueue', state.billing.xeroQueue],
    ]
    for (const [name, map] of xeroMaps) {
      for (const [id, record] of Object.entries(map)) {
        xeroItems += 1
        walk(record, `${name}.${id}`, (text, path) => {
          nhiHits(text, path, xeroHits)
          const lower = text.trim().toLowerCase()
          if (organisations.has(lower)) return
          const personal = personalIn(orgPattern !== null ? lower.replace(orgPattern, ' ') : lower, known)
          if (personal !== undefined) xeroHits.push({ location: path, what: personal })
        })
      }
    }
    areas.push({ key: 'xero', label: 'Xero', scanned: 'Contacts, invoices and bills, credit notes, payments, bill payments, journals, remittances, bank lines and the sync queue', items: xeroItems, hits: xeroHits, heldByDesign: false, checksPersonalDetails: true })

    // The diagnostic log, refusals included.
    const diag = recentDiagnostics()
    const diagHits: LeakHit[] = []
    diag.forEach((e, i) => nhiHits(diagnosticText(e), `diagnostic ${i + 1} (${e.level})`, diagHits))
    areas.push({ key: 'diagnostics', label: 'Diagnostic log', scanned: 'Errors, warnings and the refusal messages people see', items: diag.length, hits: diagHits, heldByDesign: false, checksPersonalDetails: false })

    if (options.plantTestLeak === true) {
      const seeded = Object.values(state.masters.patients).find((p) => p.nhi !== undefined)
      const line = `Planted test line: lookup failed for ${seeded?.nhi ?? ''}`
      const planted: LeakHit[] = []
      nhiHits(line, 'planted test line', planted)
      areas.push({ key: 'planted', label: 'Diagnostic log (planted test line)', scanned: 'One synthetic line added to this scan only, to prove the scan finds one', items: 1, hits: planted, heldByDesign: false, checksPersonalDetails: false })
    }

    // Failure reasons, wherever the office or monitoring sees one.
    const failHits: LeakHit[] = []
    let failItems = 0
    for (const x of Object.values(state.billing.exceptions)) {
      failItems += 1
      nhiHits(x.message, `billing exception ${x.id}`, failHits)
    }
    for (const q of Object.values(state.billing.xeroQueue)) {
      if (q.lastError === undefined) continue
      failItems += 1
      nhiHits(q.lastError, `Xero queue ${q.id}`, failHits)
    }
    for (const d of Object.values(state.billing.xeroDivergences)) {
      failItems += 1
      walk(d.resolution ?? {}, `Xero divergence ${d.id}`, (t, p) => nhiHits(t, p, failHits))
    }
    for (const v of importRowViews(state as AppState, 'open')) {
      failItems += 1
      const a = v.assessment
      const text = [a?.unmatchedReason ?? '', ...(a?.flags ?? []).map((f) => f.label)].join(' ')
      nhiHits(text, `import row ${v.row.id}`, failHits)
    }
    for (const u of Object.values(state.billing.unmatchedReceipts)) {
      failItems += 1
      walk(u, `unmatched receipt ${u.id}`, (t, p) => nhiHits(t, p, failHits))
    }
    for (const m of Object.values(state.integrations.messages)) {
      if (m.failureReason === undefined) continue
      failItems += 1
      nhiHits(m.failureReason, `hospital message ${m.id}`, failHits)
    }
    for (const [id, load] of Object.entries(state.masterLoads.loads)) {
      failItems += 1
      walk(load, `master load ${id}`, (t, p) => nhiHits(t, p, failHits))
    }
    areas.push({ key: 'failures', label: 'Failure reasons', scanned: 'Billing exceptions, Xero queue errors and divergences, unmatched receipts, hospital rows needing resolving, hospital message failures and loader rows', items: failItems, hits: failHits, heldByDesign: false, checksPersonalDetails: false })

    // Held inside the core platform, by design.
    const held = (key: LeakAreaKey, label: string, scanned: string, items: number): LeakArea => ({ key, label, scanned, items, hits: [], heldByDesign: true, checksPersonalDetails: false })
    areas.push(held('patients', 'Patients', 'The patient record, keyed on the NHI', Object.keys(state.masters.patients).length))
    areas.push(held('bookings', 'Bookings', 'Each Booking names its patient', Object.keys(state.schedule.bookings).length))
    areas.push(held('importRows', 'Hospital rows', 'Rows as received, the raw payload restricted', Object.keys(state.intake.rows).length))
    areas.push(held('audit', 'Audit trail', 'Every recorded action, inside the core platform', state.audit.length))
    return areas
  })
  const leakAreas = run.result.filter((a) => !a.heldByDesign)
  return {
    areas: run.result,
    items: leakAreas.reduce((n, a) => n + a.items, 0),
    hits: leakAreas.reduce((n, a) => n + a.hits.length, 0),
    ms: Math.round(run.ms),
    atISO: `${state.clock.todayISO}T${String(Math.floor(state.clock.minutesSinceMidnight / 60)).padStart(2, '0')}:${String(state.clock.minutesSinceMidnight % 60).padStart(2, '0')}:00`,
    planted: options.plantTestLeak === true,
  }
}

/** The trigger's message: "Scanned 3 areas and 31,204 items in 180 ms. ..." (figures from the report). */
export function leakScanSummary(report: LeakScanReport, formatCount: (n: number) => string): string {
  const leakAreas = report.areas.filter((a) => !a.heldByDesign && a.key !== 'planted').length
  const head = `Scanned ${leakAreas} areas and ${formatCount(report.items)} items in ${report.ms} ms.`
  if (report.hits === 0) return `${head} No NHI outside the core platform, and no personal details in Xero.`
  const real = report.hits - (report.planted ? 1 : 0)
  if (real === 0) return `${head} One hit found, the planted test line.`
  return `${head} ${report.hits === 1 ? 'One hit' : `${report.hits} hits`} found${report.planted ? ', the planted test line among them' : ''}.`
}
