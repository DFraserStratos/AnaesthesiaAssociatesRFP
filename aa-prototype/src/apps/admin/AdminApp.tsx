import { Wordmark } from '../../shared'
import { Placeholder } from '../Placeholder'
import { DEMO_TODAY_LABEL } from '../../domain/clock'
import { neutral, brand } from '../../theme/tokens'

interface NavItem {
  label: string
  /** Optional count badge (e.g. Review queue). */
  badge?: number
}

/**
 * Side-nav items per `Admin Day.dc.html`, extended to the build's full set
 * (Decisions log 2026-07-21: the design shows a subset; we add Billing monitor,
 * Master data and Audit using the same pattern).
 */
const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Day view' },
  { label: 'Review queue', badge: 3 },
  { label: 'Billing monitor' },
  { label: 'Master data' },
  { label: 'Audit' },
]

function SideNav() {
  return (
    <div
      style={{
        width: 216,
        flex: 'none',
        background: neutral.ink,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        gap: 24,
        boxSizing: 'border-box',
      }}
    >
      {/* wordmark (serif text, echoing the logo) + crimson ADMIN eyebrow, on the dark nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0 8px' }}>
        <Wordmark tone="dark" size={15} />
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', color: '#D89AA9', paddingLeft: 2 }}>
          ADMIN
        </span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item, i) => {
          const activeItem = i === 0
          return (
            <span
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 9,
                fontSize: 13.5,
                fontWeight: activeItem ? 600 : 500,
                color: activeItem ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                background: activeItem ? 'rgba(255,255,255,0.08)' : 'transparent',
                boxShadow: activeItem ? `inset 3px 0 0 ${brand.base}` : 'none',
                cursor: 'default',
              }}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  style={{
                    background: brand.base,
                    color: '#FFFFFF',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </span>
          )
        })}
      </nav>

      {/* persona footer */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: 8 }}>
        <span
          aria-hidden
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            background: brand.tint,
            color: brand.base,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            flex: 'none',
          }}
        >
          KW
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#FFFFFF' }}>Kirsty W.</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Office</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Admin web app — the shell only, with the dark-ink side nav from
 * `Admin Day.dc.html`. The one-day dashboard, review queue, authorisation,
 * master data and audit views arrive in Phases 06 to 07.
 */
export function AdminApp() {
  return (
    <div style={{ display: 'flex', minHeight: '100%', minWidth: 1320, background: neutral.bg, color: neutral.ink }}>
      <SideNav />
      <div style={{ flex: 1, minWidth: 0, padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            {DEMO_TODAY_LABEL}
          </h1>
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>
            14 anaesthetists · 22 sessions · 5 free · 2 lists submitted today
          </div>
        </div>
        <Placeholder title="One-day dashboard" phase="Phase 06">
          The day grid, right-rail calendar, internal notes and review queue from{' '}
          <em>Admin Day.dc.html</em> are built in Phases 06 to 07. This screen is the shell only.
        </Placeholder>
      </div>
    </div>
  )
}
