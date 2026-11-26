import type { CSSProperties } from 'react'
import { PersonaChip, Wordmark } from '../../../shared'
import { brand, neutral, semantic, radius } from '../../../theme/tokens'
import { RolesInfo } from '../RolesInfo'
import { officePersona } from '../../../shell/appConfig'
import { useAppStore } from '../../../store'

export type NavSection = 'day' | 'intake' | 'lists' | 'notifications' | 'finances' | 'people' | 'contracts' | 'masters' | 'audit'

interface NavItem {
  section: NavSection
  label: string
  badge?: number
  /** 'warn' badges (billing exceptions) read amber; the default is crimson. */
  badgeTone?: 'warn'
}

interface SideNavProps {
  active: NavSection
  /**
   * Lists (US-13.1.3; OQ-151): the Lists that need something across Draft Lists, Conflicts, Contracts to
   * set and To authorise, each counted once (`listsCounts.ts`'s `listsBadge`, in the harness bar's
   * All or Urgent mode): amber, an attention count.
   */
  listsBadge?: number
  /** Finances (build plan Phase 58; D109): billing problems plus failed ledger checks, one number from `financeCounts.ts`'s `financeBadge`: amber, never crimson. */
  financesBadge?: number
  /** Active notices in the shared pool (catch-up Phase 32b; US-13.8.1) — amber, an attention count. */
  notificationBadge?: number
  /** Open rows on Intake's matching screen (catch-up Phases 33 and 34; US-02.1.4) — amber, an attention count. */
  intakeBadge?: number
  /** Patients needing the office (catch-up Phase 40; `patientAttentionCount`), on People where Patients was (build plan Phase 53): amber, an attention count. */
  peopleBadge?: number
  onNavigate: (section: NavSection) => void
  /** The scroll box's height: the nav's contents stay this tall and in view while a long page scrolls. */
  stickyHeight?: number
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
 * (Decisions log 2026-07-21). Every badge is an amber attention count from the
 * store; Lists counts each List that needs something once (US-13.1.3).
 */
export function SideNav({ active, listsBadge = 0, financesBadge = 0, notificationBadge = 0, intakeBadge = 0, peopleBadge = 0, onNavigate, onHelp, stickyHeight }: SideNavProps) {
  const officeUser = useAppStore((s) => s.shell.officeUser)
  const items: NavItem[] = [
    { section: 'day', label: 'Day view' },
    // Intake (catch-up Phase 34): matching, PDF lists, data quality and validators. Its badge counts
    // only the rows waiting for the office's decision on matching: amber, never crimson.
    { section: 'intake', label: 'Intake', badge: intakeBadge, badgeTone: 'warn' },
    // Lists (US-13.1.3): Draft Lists, Conflicts, Contracts to set and To authorise in one section, with one amber badge.
    { section: 'lists', label: 'Lists', badge: listsBadge, badgeTone: 'warn' },
    // The shared notification pool: its active notices (catch-up Phase 32b, D58; a resolved notice leaves the count).
    { section: 'notifications', label: 'Notifications', badge: notificationBadge, badgeTone: 'warn' },
    // Finances (build plan Phase 58; D107, D109): Invoices, the Billing monitor and the Ledger in one section, with one amber badge.
    { section: 'finances', label: 'Finances', badge: financesBadge, badgeTone: 'warn' },
    // People (build plan Phase 53; D99): where Patients was, with its count; anaesthetists, surgeons, specialties and patients.
    { section: 'people', label: 'People', badge: peopleBadge, badgeTone: 'warn' },
    // Contracts (build plan Phase 45; D92): its own section, before Master data.
    { section: 'contracts', label: 'Contracts' },
    { section: 'masters', label: 'Master data' },
    { section: 'audit', label: 'Audit' },
  ]

  return (
    // The ink column runs the page's full height; its contents stick to the top of the scroll box at the
    // window's height, so Help and the persona stay in view on a long page.
    <div style={{ width: 216, flex: 'none', background: neutral.ink }}>
    <div style={{ position: 'sticky', top: 0, ...(stickyHeight !== undefined ? { height: stickyHeight } : { minHeight: '100%' }), overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: 24, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0 8px' }}>
        <Wordmark tone="dark" size={15} />
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', color: brand.onDarkMuted, paddingLeft: 2 }}>ADMIN</span>
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
    </div>
  )
}
