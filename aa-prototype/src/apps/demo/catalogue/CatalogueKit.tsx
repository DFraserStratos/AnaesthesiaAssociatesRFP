import type { CSSProperties, ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { DemoBadge, SurfaceProvider } from '../../../shared'
import { accent, neutral, radius } from '../../../theme/tokens'

/**
 * The UI component catalogue (demo only, reached by URL: /demo/catalogue/:app).
 * One page per app shows every hand-built component LIVE, one component per
 * row, grouped by the library that would replace it in the planned UI library
 * migration (docs/ui-library-research/). Not product UI.
 */

/** The replacement-library groups, in the order every page lists them. */
export const LIBRARY_GROUPS = {
  shadcn: {
    title: 'shadcn/ui on Base UI',
    blurb: 'The foundation: accessible primitives (dialogs, sheets, drawers, menus, tabs, toggles, fields, badges, buttons) restyled to our tokens.',
  },
  sonner: {
    title: 'Sonner',
    blurb: 'Toasts. Replaces inline success banners and snackbars; blocking errors stay inline.',
  },
  tanstack: {
    title: 'TanStack Table (+ Virtual)',
    blurb: 'Headless data tables with shadcn Table styling: sorting, grouping, pagination, row selection, virtualisation.',
  },
  forms: {
    title: 'React Hook Form + Zod',
    blurb: 'One form pattern: labels, descriptions, field-bound errors and aria-invalid, with schema validation.',
  },
  daypicker: {
    title: 'react-day-picker (shadcn Calendar / Date Picker)',
    blurb: 'Calendar grids and date inputs, keeping our own day-cell content.',
  },
  numberflow: {
    title: 'NumberFlow',
    blurb: 'Optional like-for-like swap for figures that already animate. No new animation.',
  },
  motion: {
    title: 'Motion (custom component kept)',
    blurb: 'Our own component stays, with its existing motion re-expressed on the Motion library. Behaviour unchanged.',
  },
  custom: {
    title: 'Stays custom (no library equivalent)',
    blurb: 'Domain components built from library primitives (tooltips, focus handling) but otherwise ours.',
  },
} as const

export type LibraryGroupId = keyof typeof LIBRARY_GROUPS

const APPS = [
  { id: 'admin', label: 'Admin Web App' },
  { id: 'web', label: 'Anaesthetist Web App' },
  { id: 'mobile', label: 'Anaesthetist Mobile App' },
] as const

export function CataloguePage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div style={{ minHeight: '100%', background: neutral.bg, color: neutral.ink }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 32px 72px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <DemoBadge />
          </div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>{title}</h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: neutral.slate, maxWidth: 900 }}>{intro}</p>
          <nav aria-label="Catalogue apps" style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {APPS.map((a) => (
              <NavLink
                key={a.id}
                to={`/demo/catalogue/${a.id}`}
                style={({ isActive }) => ({
                  padding: '7px 14px',
                  borderRadius: radius.pill,
                  fontSize: 13.5,
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: `1px solid ${isActive ? accent.base : neutral.line}`,
                  background: isActive ? accent.base : neutral.surface,
                  color: isActive ? '#fff' : neutral.slate,
                })}
              >
                {a.label}
              </NavLink>
            ))}
          </nav>
          <GroupIndex />
        </div>
        {children}
      </div>
    </div>
  )
}

function GroupIndex() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12.5, color: neutral.mist }}>
      <span style={{ fontWeight: 600 }}>Jump to:</span>
      {(Object.keys(LIBRARY_GROUPS) as LibraryGroupId[]).map((id) => (
        <a key={id} href={`#lib-${id}`} style={{ color: accent.base }}>
          {LIBRARY_GROUPS[id].title}
        </a>
      ))}
    </div>
  )
}

const COLS = 'minmax(420px, 460px) minmax(180px, 1fr) minmax(220px, 1.4fr) minmax(220px, 1.3fr)'

/** One replacement-library group: heading, column header, then its rows. Renders nothing when empty. */
export function LibraryGroup({ id, children }: { id: LibraryGroupId; children?: ReactNode }) {
  if (children === undefined || children === null || children === false) return null
  const g = LIBRARY_GROUPS[id]
  return (
    <section id={`lib-${id}`} aria-labelledby={`lib-${id}-h`} style={{ display: 'flex', flexDirection: 'column', gap: 0, scrollMarginTop: 16 }}>
      <h2 id={`lib-${id}-h`} style={{ margin: '18px 0 2px', fontSize: 20, fontWeight: 700 }}>
        {g.title}
      </h2>
      <p style={{ margin: '0 0 10px', fontSize: 14, color: neutral.slate }}>{g.blurb}</p>
      <div style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.card, overflow: 'hidden', background: neutral.surface }}>
        <div
          role="presentation"
          style={{
            display: 'grid',
            gridTemplateColumns: COLS,
            background: neutral.sunken,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: neutral.mist,
          }}
        >
          {['Live example', 'Component', 'What it does', 'Replace with'].map((h) => (
            <div key={h} style={{ padding: '9px 14px' }}>
              {h}
            </div>
          ))}
        </div>
        {children}
      </div>
    </section>
  )
}

export interface CatalogueRowProps {
  /** Component name as it appears in code, e.g. "BottomSheet". */
  name: string
  /** Source path relative to src/, e.g. "shared/surface/BottomSheet.tsx". */
  source: string
  /** Which apps use it, e.g. "Admin · Web · Mobile". */
  usedIn: string
  /** Plain-English description of what it does (one or two sentences). */
  what: string
  /** The library component that would replace it, e.g. "shadcn Drawer (Base UI Drawer)". */
  replaceWith: string
  /** Optional migration note or gap the library fixes. */
  note?: string
  /** 'mobile' renders inside a phone-width stage with the mobile surface; 'web' (default) uses the web surface. */
  stage?: 'web' | 'mobile'
  /** Stage height in px (default: auto for web, 320 for mobile). */
  height?: number
  /** The live, interactive example. */
  children: ReactNode
}

/** One component per row: live example, name, what it does, replacement. */
export function CatalogueRow({ name, source, usedIn, what, replaceWith, note, stage = 'web', height, children }: CatalogueRowProps) {
  const cell: CSSProperties = { padding: '14px', borderTop: `1px solid ${neutral.line}`, minWidth: 0 }
  return (
    <div data-catalogue-row={name} style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'stretch' }}>
      <div style={{ ...cell, background: neutral.bg }}>{stage === 'mobile' ? <MobileStage height={height ?? 320}>{children}</MobileStage> : <WebStage height={height}>{children}</WebStage>}</div>
      <div style={cell}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
        <div className="mono" style={{ fontSize: 11.5, color: neutral.mist, marginTop: 4, wordBreak: 'break-all' }}>
          {source}
        </div>
        <div style={{ fontSize: 12.5, color: neutral.slate, marginTop: 6 }}>{usedIn}</div>
      </div>
      <div style={{ ...cell, fontSize: 14, lineHeight: 1.5, color: neutral.ink }}>{what}</div>
      <div style={{ ...cell, fontSize: 14, lineHeight: 1.5 }}>
        <div style={{ fontWeight: 600, color: accent.base }}>{replaceWith}</div>
        {note !== undefined && <div style={{ marginTop: 6, color: neutral.slate, fontSize: 13 }}>{note}</div>}
      </div>
    </div>
  )
}

/** Web stage: the web surface (Overlay = centred Dialog), on a white card. */
export function WebStage({ height, children }: { height?: number; children: ReactNode }) {
  return (
    <SurfaceProvider variant="web">
      <div
        style={{
          background: neutral.surface,
          border: `1px solid ${neutral.line}`,
          borderRadius: radius.ctl,
          padding: 14,
          minHeight: 60,
          height,
          overflow: height !== undefined ? 'auto' : 'visible',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </SurfaceProvider>
  )
}

/**
 * Mobile stage: a phone-width canvas with the mobile surface, so Overlay
 * renders as the BottomSheet INSIDE this box (it positions absolutely against
 * the nearest relative ancestor, as in the phone frame). Insets are zeroed:
 * there is no fake status bar or home indicator here.
 */
export function MobileStage({ height, children }: { height: number; children: ReactNode }) {
  return (
    <SurfaceProvider variant="mobile">
      <div
        data-aa-mobile-product=""
        className="aa-mobile-canvas"
        style={
          {
            '--aa-inset-top': '0px',
            '--aa-inset-bottom': '0px',
            '--aa-inset-left': '0px',
            '--aa-inset-right': '0px',
            '--aa-keyboard-inset': '0px',
            width: 390,
            maxWidth: '100%',
            height,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: radius.card,
            border: `1px solid ${neutral.line}`,
            background: neutral.bg,
            WebkitFontSmoothing: 'antialiased',
          } as CSSProperties
        }
      >
        <div style={{ height: '100%', overflowY: 'auto', padding: 14, boxSizing: 'border-box' }}>{children}</div>
      </div>
    </SurfaceProvider>
  )
}

/** A small caption under a live example (e.g. "Click to open"). */
export function StageHint({ children }: { children: ReactNode }) {
  return <div style={{ marginTop: 8, fontSize: 12, color: neutral.mist }}>{children}</div>
}
