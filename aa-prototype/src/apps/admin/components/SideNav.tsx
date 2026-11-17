import { PersonaChip, Wordmark } from '../../../shared'
import { brand, neutral, semantic, radius } from '../../../theme/tokens'
import { RolesInfo } from '../RolesInfo'
import { PERSONAS } from '../../../shell/appConfig'
import { DRAFT_LISTS } from '../../../shared/scheduleTerms'

export type NavSection = 'day' | 'draftLists' | 'conflicts' | 'notifications' | 'review' | 'invoices' | 'billing' | 'integrations' | 'masters' | 'audit'

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
  /** Integration-monitor attention count (Phase 11; dead-letter + manual intervention) — amber. */
  integrationBadge?: number
  /** Open conflicts from today to the horizon (catch-up Phase 30; US-01.5.4) — amber. */
  conflictBadge?: number
  /** Waiting Draft Lists (catch-up Phase 31; US-01.6.2 "one visible place") — amber, an attention count. */
  draftListBadge?: number
  /** Active notices in the shared pool (catch-up Phase 32b; US-13.8.1) — amber, an attention count. */
  notificationBadge?: number
  onNavigate: (section: NavSection) => void
}

/**
 * Admin dark-ink side nav (Admin Day.dc.html), extended to the build's full set
 * (Decisions log 2026-07-21). The Review-queue badge derives from the SUBMITTED
 * list count (2026-07-23 decision) rather than a hardcoded figure.
 */
export function SideNav({ active, reviewBadge, billingBadge = 0, integrationBadge = 0, conflictBadge = 0, draftListBadge = 0, notificationBadge = 0, onNavigate }: SideNavProps) {
  const items: NavItem[] = [
    { section: 'day', label: 'Day view' },
    { section: 'draftLists', label: DRAFT_LISTS, badge: draftListBadge, badgeTone: 'warn' },
    { section: 'conflicts', label: 'Conflicts', badge: conflictBadge, badgeTone: 'warn' },
    // The shared notification pool: its active notices (catch-up Phase 32b, D58; a resolved notice leaves the count).
    { section: 'notifications', label: 'Notifications', badge: notificationBadge, badgeTone: 'warn' },
    { section: 'review', label: 'Review queue', badge: reviewBadge },
    { section: 'invoices', label: 'Invoices' },
    { section: 'billing', label: 'Billing monitor', badge: billingBadge, badgeTone: 'warn' },
    { section: 'integrations', label: 'Integrations', badge: integrationBadge, badgeTone: 'warn' },
    { section: 'masters', label: 'Master data' },
    { section: 'audit', label: 'Audit' },
  ]

  return (
    <div style={{ width: 216, flex: 'none', background: neutral.ink, display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: 24, boxSizing: 'border-box' }}>
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
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 9,
                border: 'none',
                fontFamily: 'inherit',
                fontSize: 13.5,
                fontWeight: activeItem ? 600 : 500,
                color: activeItem ? neutral.surface : 'rgba(255,255,255,0.9)',
                background: activeItem ? 'rgba(255,255,255,0.08)' : 'transparent',
                boxShadow: activeItem ? `inset 3px 0 0 ${brand.base}` : 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
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
        <RolesInfo />
        <div style={{ padding: 8 }}>
          <PersonaChip persona={PERSONAS.kirsty} />
        </div>
      </div>
    </div>
  )
}
