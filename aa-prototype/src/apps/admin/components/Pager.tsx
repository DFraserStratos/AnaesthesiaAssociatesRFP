/**
 * The admin pager (catch-up Phase 43; US-15.0.4): "Showing 1 to 50 of 28,114"
 * with first, previous, a "1 of 3" page count, next and last. Shown by its
 * screens only when there is more than one page, so the demo-scale screens are
 * unchanged. Figures in the mono face with tabular figures; the buttons are
 * keyboard-focusable teal text actions (the action colour), the current page
 * mono. One component for the Day view, Invoices, Audit, the Ledger, Patients
 * and the Billing monitor's groups and per-group rows.
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { formatCount } from '../../../shared/format'
import { accent, fontFamily, neutral } from '../../../theme/tokens'
import { IconButton } from '../../../shared/ui'

/** The page window for `total` rows at `size` per page, with the page clamped into range. */
export function pageWindow(total: number, size: number, page: number): { page: number; pages: number; start: number; end: number } {
  const pages = Math.max(1, Math.ceil(total / Math.max(1, size)))
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pages)
  const start = total === 0 ? 0 : (p - 1) * size
  return { page: p, pages, start, end: Math.min(total, start + size) }
}

/** The rows of one page. */
export function pageOf<T>(rows: readonly T[], size: number, page: number): T[] {
  const w = pageWindow(rows.length, size, page)
  return rows.slice(w.start, w.end)
}

/** The page from a `?page=` value (1 when absent or not a number). */
export function pageParam(value: string | null): number {
  const n = value === null ? NaN : Number(value)
  return Number.isInteger(n) && n > 0 ? n : 1
}

export interface PagerProps {
  total: number
  size: number
  page: number
  onPage: (page: number) => void
  /** The noun in the range ("Anaesthetists 1 to 30 of 85"); default "Showing". */
  lead?: string
  shot?: string
  /** A smaller pager inside a table (the monitor's per-group rows). */
  nested?: boolean
  /** Where the range sits: `start` across from the buttons (default), `end` beside them (the Day view's footer). */
  rangeAt?: 'start' | 'end'
}

const MONO = { fontFamily: fontFamily.mono, fontVariantNumeric: 'tabular-nums' as const }

export function Pager({ total, size, page, onPage, lead = 'Showing', shot, nested = false, rangeAt = 'start' }: PagerProps) {
  const w = pageWindow(total, size, page)
  const range = total === 0 ? `${lead} 0 of 0` : `${lead} ${formatCount(w.start + 1)} to ${formatCount(w.end)} of ${formatCount(total)}`
  return (
    <nav
      aria-label="Pages"
      data-shot={shot}
      data-page={w.page}
      data-pages={w.pages}
      style={{ display: 'flex', alignItems: 'center', justifyContent: rangeAt === 'end' ? 'flex-end' : 'space-between', gap: 12, flexWrap: 'wrap', padding: nested ? '6px 0' : '8px 0', fontSize: nested ? 'inherit' : 12.5, color: nested ? 'inherit' : neutral.slate }}
    >
      <span style={MONO} data-pager-range>{range}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <IconButton size={32} tone="action" title="First page" label="First page" disabled={w.page <= 1} onClick={() => onPage(1)}>
          <ChevronsLeft size={15} aria-hidden />
        </IconButton>
        <IconButton size={32} tone="action" title="Previous page" label="Previous page" disabled={w.page <= 1} onClick={() => onPage(w.page - 1)}>
          <ChevronLeft size={15} aria-hidden />
        </IconButton>
        <span aria-current="page" style={{ ...MONO, minWidth: 56, textAlign: 'center', color: accent.base, fontWeight: 600 }} data-pager-page>
          {w.page} of {w.pages}
        </span>
        <IconButton size={32} tone="action" title="Next page" label="Next page" disabled={w.page >= w.pages} onClick={() => onPage(w.page + 1)}>
          <ChevronRight size={15} aria-hidden />
        </IconButton>
        <IconButton size={32} tone="action" title="Last page" label="Last page" disabled={w.page >= w.pages} onClick={() => onPage(w.pages)}>
          <ChevronsRight size={15} aria-hidden />
        </IconButton>
      </span>
    </nav>
  )
}
