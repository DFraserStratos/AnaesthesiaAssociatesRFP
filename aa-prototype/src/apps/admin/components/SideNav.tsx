import { Wordmark } from '../../../shared'
import { brand, neutral } from '../../../theme/tokens'

export type NavSection = 'day' | 'review' | 'billing' | 'masters' | 'audit'

interface NavItem {
  section: NavSection
  label: string
  badge?: number
}

interface SideNavProps {
  active: NavSection
  reviewBadge: number
  onNavigate: (section: NavSection) => void
}

/**
 * Admin dark-ink side nav (Admin Day.dc.html), extended to the build's full set
 * (Decisions log 2026-07-21). The Review-queue badge derives from the SUBMITTED
 * list count (2026-07-23 decision) rather than a hardcoded figure.
 */
export function SideNav({ active, reviewBadge, onNavigate }: SideNavProps) {
  const items: NavItem[] = [
    { section: 'day', label: 'Day view' },
    { section: 'review', label: 'Review queue', badge: reviewBadge },
    { section: 'billing', label: 'Billing monitor' },
    { section: 'masters', label: 'Master data' },
    { section: 'audit', label: 'Audit' },
  ]

  return (
    <div style={{ width: 216, flex: 'none', background: neutral.ink, display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: 24, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0 8px' }}>
        <Wordmark tone="dark" size={15} />
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', color: '#D89AA9', paddingLeft: 2 }}>ADMIN</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item) => {
          const activeItem = item.section === active
          return (
            <button
              key={item.section}
              type="button"
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
                color: activeItem ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                background: activeItem ? 'rgba(255,255,255,0.08)' : 'transparent',
                boxShadow: activeItem ? `inset 3px 0 0 ${brand.base}` : 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span style={{ background: brand.base, color: '#FFFFFF', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>{item.badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: 8 }}>
        <span aria-hidden style={{ width: 30, height: 30, borderRadius: 999, background: brand.tint, color: brand.base, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flex: 'none' }}>KW</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#FFFFFF' }}>Kirsty W.</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Office</span>
        </div>
      </div>
    </div>
  )
}
