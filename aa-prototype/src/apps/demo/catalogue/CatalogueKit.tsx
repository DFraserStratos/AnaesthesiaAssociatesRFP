import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { DemoBadge, SurfaceProvider } from '../../../shared'
import { accent, neutral, radius } from '../../../theme/tokens'

/**
 * The UI component catalogue (demo only, reached by URL: /demo/catalogue/:app).
 * One page per app shows every hand-built component LIVE, one component per
 * row, grouped by component family. Each row names the shared component it is,
 * or is built on, in src/ (or says it stays custom), so the page documents the
 * shared kit (src/shared/ui/README.md, docs/archive/ui-unification/). Not product UI.
 */

/** The component families, in the order every page lists them. */
export const FAMILIES = {
  actions: {
    title: 'Buttons and actions',
    blurb: 'Buttons, icon buttons, text actions, add-row buttons and the other controls that run one command.',
  },
  pills: {
    title: 'Pills and badges',
    blurb: 'Tone labels, status chips, attention marks, avatars and progress indicators.',
  },
  fields: {
    title: 'Fields and search',
    blurb: 'Text fields, selects, checkboxes, switches, radio cards, search boxes and pick lists, on the one field chrome.',
  },
  dates: {
    title: 'Dates and calendars',
    blurb: 'Date and time fields, jump-to-date inputs, day steppers and month calendars.',
  },
  tabs: {
    title: 'Tabs and navigation',
    blurb: 'Underline tabs, segmented controls, filter pills, back links, step rails and the app navigation.',
  },
  overlays: {
    title: 'Overlays',
    blurb: 'Sheets, dialogs, side panels and popovers on the one modal stack: a bottom sheet on the phone, a dialog on web and Admin.',
  },
  feedback: {
    title: 'Feedback',
    blurb: 'Notices, errors, result lines, empty states and the success moments.',
  },
  tables: {
    title: 'Tables',
    blurb: 'The one table kit (shell, cells, group rows, clickable rows) and the tables built on it.',
  },
  cards: {
    title: 'Cards and page chrome',
    blurb: 'Cards, page headers, eyebrows, label and value rows, stat tiles, headers and docks.',
  },
  custom: {
    title: 'Stays custom',
    blurb: 'Domain surfaces with no shared equivalent: the grids, strips, stacks, timelines and print documents. They use the shared parts where they can.',
  },
  demo: {
    title: 'Demo only',
    blurb: 'Presenter and harness controls that never ship in the product.',
  },
} as const

export type FamilyId = keyof typeof FAMILIES

/** The values a row's Shared component cell may take besides a file path. */
export const SHARED_LITERALS: readonly string[] = ['Stays custom', 'Demo only']

/**
 * The Shared component cells that are neither a literal (Stays custom, Demo
 * only) nor a file in `knownFiles` (paths relative to src/, such as
 * "shared/ui/Pill.tsx"). For tests: pass the keys of an import.meta.glob over
 * src/, so a moved or renamed file fails the catalogue test.
 */
export function missingSharedFiles(cells: readonly string[], knownFiles: readonly string[]): string[] {
  const known = new Set(knownFiles)
  return cells.filter((c) => !SHARED_LITERALS.includes(c) && !known.has(c))
}

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

/** Jump links to the family sections this page has (a page holds only some of the families). */
function GroupIndex() {
  const ref = useRef<HTMLDivElement>(null)
  const [present, setPresent] = useState<ReadonlySet<string> | null>(null)
  useLayoutEffect(() => {
    const page = ref.current?.parentElement?.parentElement ?? document
    setPresent(new Set([...page.querySelectorAll('section[id^="fam-"]')].map((el) => el.id.slice(4))))
  }, [])
  return (
    <div ref={ref} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12.5, color: neutral.mist }}>
      <span style={{ fontWeight: 600 }}>Jump to:</span>
      {(Object.keys(FAMILIES) as FamilyId[]).filter((id) => present === null || present.has(id)).map((id) => (
        <a key={id} href={`#fam-${id}`} style={{ color: accent.base }}>
          {FAMILIES[id].title}
        </a>
      ))}
    </div>
  )
}

const COLS = 'minmax(420px, 460px) minmax(180px, 1fr) minmax(220px, 1.4fr) minmax(220px, 1.3fr)'

/** One component family: heading, column header, then its rows. Renders nothing when empty. */
export function FamilySection({ id, children }: { id: FamilyId; children?: ReactNode }) {
  if (children === undefined || children === null || children === false) return null
  const g = FAMILIES[id]
  return (
    <section id={`fam-${id}`} aria-labelledby={`fam-${id}-h`} style={{ display: 'flex', flexDirection: 'column', gap: 0, scrollMarginTop: 16 }}>
      <h2 id={`fam-${id}-h`} style={{ margin: '18px 0 2px', fontSize: 20, fontWeight: 700 }}>
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
          {['Live example', 'Component', 'What it does', 'Shared component'].map((h) => (
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
  /**
   * The shared component it is, or is built on: a file path relative to src/
   * (e.g. "shared/ui/Pill.tsx"), or "Stays custom" or "Demo only".
   */
  shared: string
  /** Optional note: what the example shows, a known gap, or what it writes. */
  note?: string
  /** 'mobile' renders inside a phone-width stage with the mobile surface; 'web' (default) uses the web surface. */
  stage?: 'web' | 'mobile'
  /** Stage height in px (default: auto for web, 320 for mobile). */
  height?: number
  /** The live, interactive example. */
  children: ReactNode
}

/**
 * One component per row: live example, name, what it does, shared component.
 * The stage stays the row's first child: the shots (docs/archive/ui-unification/shots)
 * capture it by that position.
 */
export function CatalogueRow({ name, source, usedIn, what, shared, note, stage = 'web', height, children }: CatalogueRowProps) {
  const isPath = !SHARED_LITERALS.includes(shared)
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
        <div
          data-catalogue-shared={shared}
          className={isPath ? 'mono' : undefined}
          style={isPath ? { fontWeight: 600, fontSize: 12.5, color: accent.base, wordBreak: 'break-all' } : { fontWeight: 600, color: neutral.slate }}
        >
          {shared}
        </div>
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
