import { StatusLegend, Logo } from '../../shared'
import { Placeholder } from '../Placeholder'
import { neutral, brand, accent, radius, elevation } from '../../theme/tokens'

const TABS = ['Dashboard', 'Lists', 'Availability', 'Accounts'] as const

function TopNav() {
  return (
    <div style={{ background: neutral.surface, borderBottom: `1px solid ${neutral.line}` }}>
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '0 32px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 32,
        }}
      >
        {/* wordmark — the actual AA logo (identity) */}
        <Logo height={24} />

        <nav style={{ display: 'flex', gap: 4, height: '100%', alignItems: 'stretch', flex: 1 }}>
          {TABS.map((tab, i) => {
            const activeTab = i === 0
            return (
              <span
                key={tab}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 14px',
                  fontSize: 14,
                  fontWeight: activeTab ? 600 : 500,
                  color: activeTab ? neutral.ink : neutral.slate,
                  boxShadow: activeTab ? `inset 0 -3px 0 ${brand.base}` : 'none',
                  cursor: 'default',
                }}
              >
                {tab}
              </span>
            )
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: neutral.slate }}>Dr Melanie Souter</span>
          <span
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: brand.tint,
              color: brand.base,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            MS
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Anaesthetist web app — the shell only, with the white top-nav and crimson
 * serif wordmark from `Web Dashboard.dc.html`. The dashboard, lists, full
 * availability grid and accounts arrive in Phase 05.
 *
 * The status colour legend panel below doubles as the Phase-00 design-token
 * demonstration (all six statuses with the hatched / dashed treatments).
 */
export function WebApp() {
  return (
    <div style={{ minHeight: '100%', minWidth: 1240, background: neutral.bg, color: neutral.ink }}>
      <TopNav />
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 32px 48px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>
            Kia ora, Dr Souter
          </h1>
          <div style={{ fontSize: 14, color: neutral.slate, marginTop: 4 }}>
            Tuesday 21 July · 2 lists today · 9 cards · 1 list awaiting submission
          </div>
        </div>

        <Placeholder title="Dashboard" phase="Phase 05">
          The receivables aging, week strip, productivity, leave and "who's free" panels from{' '}
          <em>Web Dashboard.dc.html</em> are built in Phase 05. This screen is the shell only.
        </Placeholder>

        {/* Phase-00 design-token demonstration: the six status colours. */}
        <section
          style={{
            background: neutral.surface,
            border: `1px solid ${neutral.line}`,
            borderRadius: radius.card,
            padding: 20,
            boxShadow: elevation.e1,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Status colour legend</div>
            <span style={{ fontSize: 13, color: neutral.mist }}>
              Identical across all three apps · colour is never the only signal
            </span>
          </div>
          <StatusLegend />
          <div style={{ fontSize: 12, color: neutral.mist, borderTop: `1px solid ${neutral.sunken}`, paddingTop: 12 }}>
            Deep teal <span className="mono" style={{ color: accent.base }}>#0D6E63</span> is the only action
            colour; AA crimson is identity only.
          </div>
        </section>
      </div>
    </div>
  )
}
