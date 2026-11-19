/**
 * Divergence between the engine and Xero (catch-up Phase 37; EP-09's
 * divergence case, US-09.2.2's technical discussion: the poll "confirms that
 * authorised invoices in Xero still match what the engine issued"). An
 * invoice voided or amended directly in Xero by AA staff is invisible to the
 * engine until something looks; the reconciliation poll runs this and the
 * office resolves what it finds. Pure, deterministic.
 */

import type { XeroAccRec, XeroDivergence } from '../types'
import { toCents } from '../billing/money'

/** What the engine issued for one mirrored receivable (the ledger's receivable leg). */
export interface EngineReceivable {
  pairId: string
  invoiceId: string
  accRecId: string
  /** The engine-issued total (the receivable leg's amount). */
  amount: number
  receivedAmount: number
  /** True when the engine itself voided or credited it (Phase 39's credit note): never drift. */
  creditedByEngine?: boolean
}

/** One new finding, before the store gives it an id and a time. */
export interface DivergenceFinding {
  kind: XeroDivergence['kind']
  accRecId: string
  pairId: string
  invoiceId: string
  xeroShows: XeroDivergence['xeroShows']
  engineHolds: XeroDivergence['engineHolds']
}

const KIND_ORDER: Record<XeroDivergence['kind'], number> = { voidedInXero: 0, amendedInXero: 1 }

/**
 * New findings: `voidedInXero` for an ACCREC Xero shows voided while the
 * engine's receivable is still open; `amendedInXero` for one whose Xero total
 * differs from what the engine issued. None for an ACCREC already flagged with
 * that kind for the same change in Xero (open, or resolved by the office: a
 * resolution moves no money, so the mismatch stays and is never re-flagged
 * unless Xero changes again), an AA fee ACCREC, or one the engine credited.
 * In ACCREC id order, then kind.
 */
export function detectXeroDivergences(
  engineReceivables: readonly EngineReceivable[],
  xeroAccRecs: Readonly<Record<string, XeroAccRec>>,
  existingFlags: readonly (Pick<XeroDivergence, 'accRecId' | 'kind' | 'status'> & { xeroShows?: Pick<XeroDivergence['xeroShows'], 'total' | 'changedAtISO'> })[],
): DivergenceFinding[] {
  // A flag covers its change in Xero: the same kind, total and change time. Open or resolved, it is never raised twice.
  const flagKey = (accRecId: string, kind: string, shows: { total?: number; changedAtISO?: string } | undefined) => `${accRecId}:${kind}:${shows?.total !== undefined ? toCents(shows.total) : ''}:${shows?.changedAtISO ?? ''}`
  const flagged = new Set(existingFlags.map((f) => flagKey(f.accRecId, f.kind, f.xeroShows)))
  const legacy = new Set(existingFlags.filter((f) => f.xeroShows === undefined).map((f) => `${f.accRecId}:${f.kind}`))
  const seen = (accRecId: string, kind: string, shows: { total: number; changedAtISO?: string }) => legacy.has(`${accRecId}:${kind}`) || flagged.has(flagKey(accRecId, kind, shows))
  const out: DivergenceFinding[] = []
  for (const r of engineReceivables) {
    if (r.creditedByEngine === true) continue
    const rec = xeroAccRecs[r.accRecId]
    if (rec === undefined || rec.kind !== 'procedure') continue
    const outstanding = Math.max(0, toCents(r.amount) - toCents(r.receivedAmount)) / 100
    const base = {
      accRecId: r.accRecId,
      pairId: r.pairId,
      invoiceId: r.invoiceId,
      xeroShows: { status: rec.status, total: rec.amountDue, ...((rec.status === 'voided' ? rec.voidedAtISO : rec.amendedAtISO) !== undefined ? { changedAtISO: (rec.status === 'voided' ? rec.voidedAtISO : rec.amendedAtISO)! } : {}) },
      engineHolds: { amount: r.amount, outstanding },
    }
    if (rec.status === 'voided') {
      // A paid receivable is never flagged as voided (Xero refuses to void one with payments applied).
      if (outstanding > 0 && !seen(r.accRecId, 'voidedInXero', base.xeroShows)) out.push({ kind: 'voidedInXero', ...base })
      continue
    }
    if (toCents(rec.amountDue) !== toCents(r.amount) && !seen(r.accRecId, 'amendedInXero', base.xeroShows)) out.push({ kind: 'amendedInXero', ...base })
  }
  return out.sort((a, b) => a.accRecId.localeCompare(b.accRecId) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind])
}
