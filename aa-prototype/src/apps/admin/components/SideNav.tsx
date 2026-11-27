import { useEffect, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { create } from 'zustand'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { PersonaChip, Wordmark } from '../../../shared'
import { brand, neutral, semantic, radius } from '../../../theme/tokens'
import { easing, motion } from '../../../theme/motion'
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
  /** Finances (build plan Phase 58; D109, US-13.3.3): billing problems, failed ledger checks and events awaiting approval, one number from `financeCounts.ts`'s `financeBadge`: amber, never crimson. */
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

/** The sections folded under More at the foot: back office pages, not daily work. */
const MORE_SECTIONS: readonly NavSection[] = ['masters', 'audit']

/** React 18 knows no `inert`: the attribute as a string, cast (as `Disclosure` does). */
const INERT = { inert: '' } as unknown as HTMLAttributes<HTMLDivElement>

/**
 * Whether More is folded open: UI state, kept for the page's life (not persisted, never the app
 * store's), so it stays as the office left it while they move between sections.
 */
const useSideNavMore = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))

/** One nav row's look: the sections and, at the foot, the Help action (catch-up Phase 43b). */
function navItemStyle(active: boolean, quiet = false): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: quiet ? '7px 12px' : '10px 12px',
    borderRadius: 9,
    border: 'none',
    fontFamily: 'inherit',
    fontSize: quiet ? 12.5 : 13.5,
    fontWeight: active ? 600 : 500,
    color: active ? neutral.surface : quiet ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.9)',
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
  ]
  // Master data and Audit fold away under More at the foot. More stays put and they open above it, so
  // the same click hides them again; arriving on either page opens it.
  const moreItems: NavItem[] = [
    { section: 'masters', label: 'Master data' },
    { section: 'audit', label: 'Audit' },
  ]
  const moreOpen = useSideNavMore((s) => s.open)
  const setMoreOpen = useSideNavMore((s) => s.setOpen)
  const activeInMore = MORE_SECTIONS.includes(active)
  useEffect(() => {
    if (activeInMore) setMoreOpen(true)
  }, [activeInMore, setMoreOpen])

  /** Every row on the nav: the sections, More and Help share one look (question 3: nav items stay buttons). */
  const navRow = ({ key, active: on = false, quiet = false, onClick, children, ...attrs }: { key: string; active?: boolean; quiet?: boolean; onClick: () => void; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement> & { 'data-shot'?: string }) => (
    <button key={key} type="button" aria-current={on ? 'page' : undefined} onClick={onClick} style={navItemStyle(on, quiet)} {...attrs}>
      {children}
    </button>
  )
  const navButton = (item: NavItem, quiet = false) =>
    navRow({
      key: item.section,
      active: item.section === active,
      quiet,
      onClick: () => onNavigate(item.section),
      children: (
        <>
          <span>{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span data-shot={`nav-badge-${item.section}`} style={{ background: item.badgeTone === 'warn' ? semantic.warning.solid : brand.base, color: neutral.surface, borderRadius: radius.pill, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>{item.badge}</span>
          )}
        </>
      ),
    })
  const MoreChevron = moreOpen ? ChevronDown : ChevronUp

  return (
    // The ink column runs the page's full height; its contents stick to the top of the scroll box at the
    // window's height, so Help and the persona stay in view on a long page.
    <div style={{ width: 216, flex: 'none', background: neutral.ink }}>
    <div style={{ position: 'sticky', top: 0, ...(stickyHeight !== undefined ? { height: stickyHeight } : { minHeight: '100%' }), overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: 8, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0 8px', marginBottom: 16 }}>
        <Wordmark tone="dark" size={15} />
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', color: brand.onDarkMuted, paddingLeft: 2 }}>ADMIN</span>
      </div>

      <nav aria-label="Admin" style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {items.map((item) => navButton(item))}

        <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', flexDirection: 'column' }}>
          <div
            id="admin-nav-more"
            className="aa-disclosure-region"
            data-open={moreOpen}
            style={{ transition: `grid-template-rows ${motion.sheetIn.out}ms ${easing.sheet}` }}
            {...(moreOpen ? {} : { ...INERT, 'aria-hidden': true })}
          >
            <div style={{ overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 2 }}>
              {moreItems.map((item) => navButton(item, true))}
            </div>
          </div>
          {/* Folded away on Master data or Audit, More itself carries the active mark (no aria-current: it is not a page). */}
          {navRow({
            key: 'more',
            quiet: true,
            onClick: () => setMoreOpen(!moreOpen),
            'aria-expanded': moreOpen,
            'aria-controls': 'admin-nav-more',
            'data-shot': 'nav-more',
            style: navItemStyle(activeInMore && !moreOpen, true),
            children: (
              <>
                <span>More</span>
                <MoreChevron size={14} aria-hidden />
              </>
            ),
          })}
        </div>
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {onHelp !== undefined && navRow({ key: 'help', quiet: true, onClick: onHelp, 'data-shot': 'nav-help', children: 'Help' })}
        <RolesInfo />
        <div style={{ padding: 8 }}>
          <PersonaChip persona={officePersona(officeUser)} />
        </div>
      </div>
    </div>
    </div>
  )
}
