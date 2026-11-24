/**
 * Catch-up Phase 36's one declared move (work item 8): an invoice is owed, and
 * its BCTI issued, from the moment it is raised, mirrored in Xero or not. The
 * seed holds one invoice raised but never handed off: Phase 24's range beat,
 * AA-2026-S2401 ($3,565.00, Dr Souter's Face lift on Thu 16 Jul PM, raised
 * Fri 17 Jul). Before the ledger, an anaesthetist row and a BCTI record needed
 * the Xero mirror, so it was hidden; now it shows in Dr Souter's outstanding
 * rows and aging, and has a BCTI record (counted only under `paidOnly: false`:
 * it is unpaid, so every paid-only count and every fee holds). Everything else
 * must read exactly as before; `withoutDeclared36` takes exactly this out of a
 * capture so the rest is compared with the baseline unchanged.
 */

export const DECLARED_36 = {
  invoiceNumber: 'AA-2026-S2401',
  billNumber: 'AA-2026-S2401-P',
  anaesthetistId: '34821',
  amount: 3565,
  /** The month its BCTI is issued in. */
  issuedMonth: '2026-11',
  reason: 'an unmirrored invoice is owed and its BCTI issued (AA-2026-S2401, the seed range beat)',
} as const

type Json = unknown

function centsSub(a: number, b: number): number {
  return Math.round(a * 100 - b * 100) / 100
}

/** Deep-copy `value` with the declared row, record and counts taken out. */
export function withoutDeclared36<T>(value: T): T {
  return strip(value) as T
}

function strip(value: Json): Json {
  if (Array.isArray(value)) return value.map(strip)
  if (value === null || typeof value !== 'object') return value
  const obj = value as Record<string, Json>
  const out: Record<string, Json> = {}
  for (const [k, v] of Object.entries(obj)) out[k] = strip(v)

  // An anaesthetist's views: the row (and, on a baseline, its share of the aging).
  if (Array.isArray(out.rows) && Array.isArray(out.history)) {
    const rows = out.rows as { invoiceNumber?: string; outstanding?: number; bucket?: string }[]
    const declared = rows.find((r) => r.invoiceNumber === DECLARED_36.invoiceNumber)
    if (declared !== undefined) {
      out.rows = rows.filter((r) => r !== declared)
      if (out.aging !== undefined && typeof out.aging === 'object') {
        const aging = { ...(out.aging as Record<string, number>) }
        const bucket = declared.bucket ?? 'current'
        aging[bucket] = centsSub(aging[bucket] ?? 0, declared.outstanding ?? 0)
        aging.total = centsSub(aging.total ?? 0, declared.outstanding ?? 0)
        out.aging = aging
      }
    }
  }
  // The BCTI records and the by-issue count.
  if (Array.isArray(out.records) && out.counts !== undefined && typeof out.counts === 'object') {
    const records = out.records as { billNumber?: string }[]
    if (records.some((r) => r.billNumber === DECLARED_36.billNumber)) {
      out.records = records.filter((r) => r.billNumber !== DECLARED_36.billNumber)
      const counts = out.counts as Record<string, Record<string, { paidOnly: number; byIssue: number }>>
      const month = counts[DECLARED_36.anaesthetistId]?.[DECLARED_36.issuedMonth]
      if (month !== undefined) month.byIssue -= 1
    }
  }
  return out
}

/**
 * Catch-up Phase 38's retirement (D8, RV-33): the ageing buckets, the receipts-based GST activity and
 * the fee flow's GST snapshot are gone from the app, so the baseline is read without them. Every
 * ledger figure the capture still takes (rows, history, payables, BCTIs, flows) is compared unchanged.
 */
export function withoutRetired38<T>(value: T): T {
  return retire(value) as T
}

function retire(value: Json): Json {
  if (Array.isArray(value)) return value.map(retire)
  if (value === null || typeof value !== 'object') return value
  const obj = value as Record<string, Json>
  const views = Array.isArray(obj.rows) && Array.isArray(obj.history)
  const out: Record<string, Json> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'souterGst') continue
    if (views && (k === 'aging' || k === 'gst')) continue
    if (views && k === 'rows') {
      out[k] = (v as Record<string, Json>[]).map(({ bucket: _b, ...row }) => retire(row))
      continue
    }
    out[k] = retire(v)
  }
  return out
}
