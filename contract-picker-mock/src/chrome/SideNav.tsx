import { useState } from 'react'
import { Activity, Bell, CalendarDays, Database, FileStack, Inbox, PanelLeftClose, PanelLeftOpen, Plug, Receipt, ScrollText, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Wordmark } from './Wordmark'
import { brand, fontFamily, neutral } from '../theme/tokens'

/**
 * The admin dark side nav, stripped from aa-prototype's SideNav: same look,
 * inert items, no store. Day view is lit because the booking is reached from it.
 *
 * On a laptop it starts as a 64px icon rail (names as tooltips) so the booking
 * and the phone have room; the toggle at its foot opens the full nav either way.
 */
const ITEMS: [string, LucideIcon][] = [
  ['Day view', CalendarDays],
  ['Draft Lists', FileStack],
  ['Conflicts', TriangleAlert],
  ['Notifications', Bell],
  ['Review queue', Inbox],
  ['Invoices', Receipt],
  ['Billing monitor', Activity],
  ['Integrations', Plug],
  ['Master data', Database],
  ['Audit', ScrollText],
]

export function SideNav({ compactByDefault }: { compactByDefault: boolean }) {
  // null: follow the screen size; true or false: the presenter's own choice.
  const [choice, setChoice] = useState<boolean | null>(null)
  const compact = choice ?? compactByDefault

  return (
    <div style={{ width: compact ? 64 : 216, flex: 'none', background: neutral.ink, display: 'flex', flexDirection: 'column', padding: compact ? '20px 10px' : '20px 12px', gap: 24, transition: 'width 180ms cubic-bezier(0.2, 0.8, 0.2, 1)', overflow: 'hidden' }}>
      {compact ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          {/* The wordmark's initials: crimson is identity, as in the full wordmark. */}
          <span style={{ fontFamily: fontFamily.serif, fontSize: 19, color: '#FFFFFF', lineHeight: '22px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            A<span aria-hidden style={{ width: 1.5, height: 20, background: '#C25B72' }} />A
          </span>
          <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.14em', color: '#D89AA9' }}>ADMIN</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0 8px' }}>
          <Wordmark tone="dark" size={15} />
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', color: '#D89AA9', paddingLeft: 2 }}>ADMIN</span>
        </div>
      )}

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ITEMS.map(([label, Icon]) => {
          const active = label === 'Day view'
          return (
            <span
              key={label}
              title={compact ? label : undefined}
              aria-label={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: compact ? 'center' : 'flex-start',
                gap: 10,
                height: 40,
                padding: compact ? 0 : '0 12px',
                borderRadius: 9,
                fontSize: 13.5,
                fontWeight: active ? 600 : 500,
                whiteSpace: 'nowrap',
                color: active ? '#FFFFFF' : 'rgba(255,255,255,0.9)',
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                boxShadow: active ? `inset 3px 0 0 ${brand.base}` : 'none',
              }}
            >
              {compact ? <Icon size={18} strokeWidth={1.8} color={active ? '#FFFFFF' : 'rgba(255,255,255,0.72)'} /> : label}
            </span>
          )
        })}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: compact ? 'center' : 'stretch', gap: 10 }}>
        <button
          type="button"
          onClick={() => setChoice(!compact)}
          aria-label={compact ? 'Show the full menu' : 'Collapse the menu'}
          title={compact ? 'Show the full menu' : 'Collapse the menu'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: compact ? 'center' : 'flex-start', gap: 10, height: 36, padding: compact ? 0 : '0 12px', width: compact ? 40 : undefined, border: 'none', borderRadius: 9, background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          {compact ? <PanelLeftOpen size={18} strokeWidth={1.8} /> : <><PanelLeftClose size={18} strokeWidth={1.8} /> Collapse</>}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: compact ? 0 : 8 }}>
          <span aria-hidden title={compact ? 'Kirsty W. · Office' : undefined} style={{ width: 30, height: 30, borderRadius: 999, background: brand.tint, color: brand.base, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flex: 'none' }}>KW</span>
          {!compact && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#FFFFFF' }}>Kirsty W.</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Office</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
