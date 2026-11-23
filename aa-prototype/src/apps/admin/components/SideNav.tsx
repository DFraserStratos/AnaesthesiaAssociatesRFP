import type { CSSProperties } from 'react'
import { PersonaChip, Wordmark } from '../../../shared'
import { SyntheticDataBadge } from '../../../shared/SyntheticDataBadge'
import { brand, neutral, semantic, radius } from '../../../theme/tokens'
import { RolesInfo } from '../RolesInfo'
import { officePersona } from '../../../shell/appConfig'
import { useAppStore } from '../../../store'
import { DRAFT_LISTS } from '../../../shared/scheduleTerms'

export type NavSection = 'day' | 'intake' | 'draftLists' | 'conflicts' | 'notifications' | 'review' | 'invoices' | 'patients' | 'billing' | 'ledger' | 'masters' | 'audit'

interface NavItem {
  section: NavSection
  label: string
  badge?: number
  /** 'warn' badges (billing exceptions) read amber; the default is crimson. */
  badgeTone?: 'warn'
}

interface SideNavProps {
  active: NavSection
  reviewBadge: number
  /** Billing-monitor exceptions count (Phase 09) — amber, distinct from the crimson review badge. */
  billingBadge?: number
  /** Open conflicts from today to the horizon (catch-up Phase 30; US-01.5.4) — amber. */
  conflictBadge?: number
  /** Waiting Draft Lists (catch-up Phase 31; US-01.6.2 "one visible place") — amber, an attention count. */
  draftListBadge?: number
  /** Active notices in the shared pool (catch-up Phase 32b; US-13.8.1) — amber, an attention count. */
  notificationBadge?: number
  /** Open rows on Intake's matching screen (catch-up Phases 33 and 34; US-02.1.4) — amber, an attention count. */
  intakeBadge?: number
  /** The ledger's checks, a held receipt among them (catch-up Phase 36; US-13.2.1) — amber, an attention count. */
  ledgerBadge?: number
  /** Patients needing the office (catch-up Phase 40; `patientAttentionCount`): amber, an attention count. */
  patientBadge?: number
  onNavigate: (section: NavSection) => void
  /** Opens the support panel (catch-up Phase 43b): an action at the foot, not a section. Shown only when given. */
  onHelp?: () => void
}

/** One nav row's look: the sections and, at the foot, the Help action (catch-up Phase 43b). */
function navItemStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 9,
    border: 'none',
    fontFamily: 'inherit',
    fontSize: 13.5,
    fontWeight: active ? 600 : 500,
    color: active ? neutral.surface : 'rgba(255,255,255,0.9)',
    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
    boxShadow: active ? `inset 3px 0 0 ${brand.base}` : 'none',
    cursor: 'pointer',
    textAlign: 'left',
  }
}

/**
 * Admin dark-ink side nav (Admin Day.dc.html), extended to the build's full set
 * (Decisions log 2026-07-21). The Review-queue badge derives from the SUBMITTED
 * list count (2026-07-23 decision) rather than a hardcoded figure.
 */
export function SideNav({ active, reviewBadge, billingBadge = 0, conflictBadge = 0, draftListBadge = 0, notificationBadge = 0, intakeBadge = 0, ledgerBadge = 0, patientBadge = 0, onNavigate, onHelp }: SideNavProps) {
  const officeUser = useAppStore((s) => s.shell.officeUser)
  const items: NavItem[] = [
    { section: 'day', label: 'Day view' },
    // Intake (catch-up Phase 34): matching, PDF lists, data quality and validators. Its badge counts
    // only the rows waiting for the office's decision on matching: amber, never crimson.
    { section: 'intake', label: 'Intake', badge: intakeBadge, badgeTone: 'warn' },
    { section: 'draftLists', label: DRAFT_LISTS, badge: draftListBadge, badgeTone: 'warn' },
    { section: 'conflicts', label: 'Conflicts', badge: conflictBadge, badgeTone: 'warn' },
    // The shared notification pool: its active notices (catch-up Phase 32b, D58; a resolved notice leaves the count).
    { section: 'notifications', label: 'Notifications', badge: notificationBadge, badgeTone: 'warn' },
    { section: 'review', label: 'Review queue', badge: reviewBadge },
    { section: 'invoices', label: 'Invoices' },
    // Patients (catch-up Phase 40): search, rows waiting for an NHI, follow-up and the record.
    { section: 'patients', label: 'Patients', badge: patientBadge, badgeTone: 'warn' },
    { section: 'billing', label: 'Billing monitor', badge: billingBadge, badgeTone: 'warn' },
    { section: 'ledger', label: 'Ledger', badge: ledgerBadge, badgeTone: 'warn' },
    { section: 'masters', label: 'Master data' },
    { section: 'audit', label: 'Audit' },
  ]

  return (
    <div style={{ width: 216, flex: 'none', background: neutral.ink, display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: 24, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0 8px' }}>
        <Wordmark tone="dark" size={15} />
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', color: brand.onDarkMuted, paddingLeft: 2 }}>ADMIN</span>
        {/* Catch-up Phase 43 (US-15.0.6): an environment marker, neutral. */}
        <span style={{ marginTop: 4 }}><SyntheticDataBadge tone="onInk" /></span>
      </div>

      <nav aria-label="Admin" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item) => {
          const activeItem = item.section === active
          return (
            <button
              key={item.section}
              type="button"
              aria-current={activeItem ? 'page' : undefined}
              onClick={() => onNavigate(item.section)}
              style={navItemStyle(activeItem)}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span data-shot={`nav-badge-${item.section}`} style={{ background: item.badgeTone === 'warn' ? semantic.warning.solid : brand.base, color: neutral.surface, borderRadius: radius.pill, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>{item.badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {onHelp !== undefined && (
          <button
            type="button"
            data-shot="nav-help"
            onClick={onHelp}
            style={navItemStyle(false)}
          >
            Help
          </button>
        )}
        <RolesInfo />
        <div style={{ padding: 8 }}>
          <PersonaChip persona={officePersona(officeUser)} />
        </div>
      </div>
    </div>
  )
}
