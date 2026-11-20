/**
 * Catch-up Phase 43's copy: the banner, the triggers and the privacy surfaces
 * say sessions, never "slot" (OQ-64), and carry no en or em dash; the
 * Synthetic data badge renders in every shell with its label and tooltip.
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { scaleLoadedLine, SCALE_GENERATING_LINE } from './ScaleBanner'
import { TIMED_SCREENS } from './useScreenTiming'
import { SyntheticDataBadge, SYNTHETIC_DATA_LABEL, SYNTHETIC_DATA_TOOLTIP } from '../SyntheticDataBadge'
import { DEMO_TRIGGERS } from '../demoTriggers/registry'
import { RAW_ROW_NOT_ELIGIBLE, RAW_ROW_OFFICE_ONLY, RAW_ROW_REASONS } from '../../store/rawRowActions'
import { MASKING_POLICY_NOTE } from '../../domain/privacy/mask'
import { FULL_SCALE_LOADED_MESSAGE, FULL_SCALE_PAUSE_REASON } from '../../store/fullScaleActions'

const COUNTS = {
  anaesthetists: 85, slotsInHorizon: 21080, slotsTotal: 23460, lists: 20000, draftLists: 100, recurringBookings: 300, bookings: 28000, procedures: 30000,
  prepaidBookings: 15, patients: 28000, invoices: 28114, invoicesLast12Months: 28114, aaFeeInvoices: 852, ledgerPairs: 29000, xeroContacts: 5400,
  activeContacts: 1800, auditEntries: 140000, stubs: 6, events: 0, publicSessions: 340, problemLists: 18,
}

const SOURCES = import.meta.glob(
  ['./ScaleBanner.tsx', '../SyntheticDataBadge.tsx', '../../apps/admin/components/Pager.tsx', '../../apps/admin/matching/RawRowSheet.tsx', '../../apps/demo/PrivacyChecks.tsx', '../../store/privacyScan.ts', '../../store/fullScaleActions.ts'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

describe("Phase 43's copy", () => {
  it('the banner says sessions with the counted figures', () => {
    const line = scaleLoadedLine({ counts: COUNTS, generateMs: 3400, horizonMonths: 4 })
    expect(line).toBe('Full-scale data · 85 anaesthetists · 21,080 sessions over the scheduling horizon (4 months) · 28,114 invoices in the last 12 months · generated in 3.4 s · saving paused. Reset or reload returns to the demo data.')
  })

  it('never says "slot" and carries no en or em dash', () => {
    const phase43Triggers = DEMO_TRIGGERS.filter((t) => ['load-full-scale', 'scan-nhi-leaks', 'matching-raw-row-other-role'].includes(t.id))
    expect(phase43Triggers).toHaveLength(3)
    const strings = [
      scaleLoadedLine({ counts: COUNTS, generateMs: 3400, horizonMonths: 4 }),
      SCALE_GENERATING_LINE,
      ...TIMED_SCREENS.map((s) => s.label),
      SYNTHETIC_DATA_LABEL,
      SYNTHETIC_DATA_TOOLTIP,
      RAW_ROW_NOT_ELIGIBLE,
      RAW_ROW_OFFICE_ONLY,
      ...RAW_ROW_REASONS,
      MASKING_POLICY_NOTE,
      FULL_SCALE_LOADED_MESSAGE,
      FULL_SCALE_PAUSE_REASON,
      ...phase43Triggers.flatMap((t) => [t.label, t.description, t.confirm ?? '', t.screen]),
    ]
    for (const s of strings) {
      expect(/slot/i.test(s), s).toBe(false)
      expect(/[–—]/.test(s), s).toBe(false)
    }
    for (const [file, source] of Object.entries(SOURCES)) expect(/[–—]/.test(source), file).toBe(false)
  })
})

describe('SyntheticDataBadge', () => {
  it('renders its label and tooltip in both tones', () => {
    for (const tone of ['onInk', 'onLight'] as const) {
      const { unmount } = render(<SyntheticDataBadge tone={tone} />)
      const badge = screen.getByText(SYNTHETIC_DATA_LABEL)
      expect(badge.closest('[data-shot="synthetic-data-badge"]')?.getAttribute('title')).toBe(SYNTHETIC_DATA_TOOLTIP)
      unmount()
    }
  })

  it('is placed in the harness bar, the web nav, the admin side nav and the mobile More card', () => {
    const placements = import.meta.glob(['../../shell/AppShell.tsx', '../../apps/web/components/WebNav.tsx', '../../apps/admin/components/SideNav.tsx', '../../apps/mobile/screens/MoreScreen.tsx'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>
    expect(Object.keys(placements)).toHaveLength(4)
    for (const [file, source] of Object.entries(placements)) expect(source.includes('<SyntheticDataBadge'), file).toBe(true)
  })
})
