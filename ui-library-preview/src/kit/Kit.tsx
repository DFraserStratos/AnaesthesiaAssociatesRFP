import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LIBRARY_GROUPS,
  MobileStage as ProtoMobileStage,
  WebStage as ProtoWebStage,
} from '@proto/apps/demo/catalogue/CatalogueKit.tsx'
import rowsJson from '../../rows.json'
import { getLoadFailure, getReplacement } from '../rows/registry'
import { RECOMMENDATIONS } from '../rows/recommendations'
import { getFit, type FitRating } from '../rows/fit'
import { MobileReplacementStage, WebReplacementStage } from './stages'
import { buildExport, download, setRowVerdict, useVerdicts, VERDICT_LABEL, type AppId, type Verdict } from './verdicts'

/**
 * The two-column preview kit. The prototype's own AdminCatalogue,
 * WebCatalogue and MobileCatalogue render unchanged; a Vite plugin points
 * their `./CatalogueKit` import here (ProtoKitShim). So column 1 is always
 * the prototype's real example inside the prototype's real stage, and column 2
 * is the replacement registered for the same (app, name).
 */

type GroupId = keyof typeof LIBRARY_GROUPS
interface RowMeta {
  name: string
  group: string
  replaceWith: string
}
const ROWS = rowsJson as unknown as Record<AppId, RowMeta[]>

export const AppIdContext = createContext<AppId>('admin')
const useApp = () => useContext(AppIdContext)

const T = {
  ink: '#172320',
  slate: '#58635F',
  mist: '#8A9490',
  line: '#E2E7E5',
  lineStrong: '#C9D1CE',
  sunken: '#EDF1EF',
  bg: '#F6F8F7',
  surface: '#FFFFFF',
  teal: '#0D6E63',
  tealTint: '#E1F0ED',
  warnTint: '#F9F0DC',
  warnOn: '#7C4D08',
  errTint: '#FAE9E7',
  errOn: '#9C332F',
  okTint: '#E3F4EB',
  okOn: '#157A49',
}

const APPS: { id: AppId; label: string }[] = [
  { id: 'admin', label: 'Admin Web App' },
  { id: 'web', label: 'Anaesthetist Web App' },
  { id: 'mobile', label: 'Anaesthetist Mobile App' },
]

const COLS = 'minmax(0, 1fr) minmax(0, 1fr) 230px 300px 340px'
export const MAX_WIDTH = 3200

export function CataloguePage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  const app = useApp()
  return (
    <div style={{ minHeight: '100%', background: T.bg, color: T.ink }}>
      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: '28px 32px 96px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.mist }}>
            UI library preview · current vs proposed
          </div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>{title}</h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: T.slate, maxWidth: 1100 }}>
            {intro} Left: the prototype's real component, live. Right: its proposed library replacement, live, local state only.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <nav aria-label="Preview apps" style={{ display: 'flex', gap: 8 }}>
              {APPS.map((a) => (
                <NavLink
                  key={a.id}
                  to={`/${a.id}`}
                  style={({ isActive }) => ({
                    padding: '7px 14px',
                    borderRadius: 999,
                    fontSize: 13.5,
                    fontWeight: 600,
                    textDecoration: 'none',
                    border: `1px solid ${isActive ? T.teal : T.line}`,
                    background: isActive ? T.teal : T.surface,
                    color: isActive ? '#fff' : T.slate,
                  })}
                >
                  {a.label}
                </NavLink>
              ))}
            </nav>
            <div style={{ flex: 1 }} />
            <FitSummary app={app} />
            <VerdictSummary app={app} />
          </div>
          <GroupIndex />
        </div>
        {children}
        <AppScorecard app={app} />
      </div>
    </div>
  )
}

function GroupIndex() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12.5, color: T.mist }}>
      <span style={{ fontWeight: 600 }}>Jump to:</span>
      {(Object.keys(LIBRARY_GROUPS) as GroupId[]).map((id) => (
        <a key={id} href={`#lib-${id}`} style={{ color: T.teal }}>
          {LIBRARY_GROUPS[id].title}
        </a>
      ))}
    </div>
  )
}

/** End-of-page scorecard: the app's overall shadcn fit, its spread, and the per-library breakdown. */
function AppScorecard({ app }: { app: AppId }) {
  const s = useVerdicts()
  const rows = ROWS[app] ?? []
  const rated = rows.map((r) => ({ r, f: getFit(app, r.name) })).filter((x) => x.f)
  if (!rated.length) return null
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const overall = avg(rated.map((x) => x.f!.score))
  const hist = [5, 4, 3, 2, 1].map((n) => ({ n, c: rated.filter((x) => x.f!.score === n).length }))
  const max = Math.max(...hist.map((h) => h.c))
  const groups = (Object.keys(LIBRARY_GROUPS) as GroupId[])
    .map((g) => {
      const xs = rated.filter((x) => x.r.group === g).map((x) => x.f!.score)
      return { g, n: xs.length, avg: xs.length ? avg(xs) : 0 }
    })
    .filter((x) => x.n)
  const libRows = rated.filter((x) => x.r.group !== 'custom')
  const libAvg = libRows.length ? avg(libRows.map((x) => x.f!.score)) : 0
  const v = { adopt: 0, adjust: 0, reject: 0 }
  rows.forEach((r) => {
    const k = s[app][r.name]?.verdict
    if (k) v[k]++
  })
  const appLabel = APPS.find((a) => a.id === app)?.label ?? app
  const cell: CSSProperties = { padding: '8px 12px', borderTop: `1px solid ${T.line}` }
  return (
    <section id="scorecard" aria-labelledby="scorecard-h" style={{ marginTop: 28, border: `1px solid ${T.line}`, borderRadius: 14, background: T.surface, padding: 24, display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) minmax(260px, 1fr) minmax(320px, 1.2fr)', gap: 32 }}>
      <div>
        <h2 id="scorecard-h" style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{appLabel}: overall</h2>
        <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.mist }}>shadcn fit</div>
        <div className="mono" style={{ fontSize: 44, lineHeight: '52px', fontWeight: 700, color: T.teal }}>
          {overall.toFixed(1)}<span style={{ fontSize: 20, color: T.mist }}>/5</span>
        </div>
        <div style={{ fontSize: 13, color: T.slate, lineHeight: 1.5 }}>
          Average over {rated.length} of {rows.length} rows. Library rows only (leaving out stays custom): <span className="mono" style={{ color: T.ink, fontWeight: 600 }}>{libAvg.toFixed(1)}/5</span>.
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: T.slate }}>
          Your verdicts: Adopt <b>{v.adopt}</b> · Adjust <b>{v.adjust}</b> · Reject <b>{v.reject}</b> · Undecided <b>{rows.length - v.adopt - v.adjust - v.reject}</b>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.mist, marginBottom: 8 }}>Spread</div>
        {hist.map((h) => (
          <div key={h.n} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 36px', alignItems: 'center', gap: 8, fontSize: 13, padding: '3px 0' }}>
            <span style={{ color: T.slate }}>
              <span className="mono" style={{ color: T.ink, fontWeight: 600 }}>{h.n}</span> · {FIT_LABEL[h.n]}
            </span>
            <span style={{ height: 10, borderRadius: 99, background: T.sunken, overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${max ? (h.c / max) * 100 : 0}%`, background: T.teal, borderRadius: 99 }} />
            </span>
            <span className="mono" style={{ textAlign: 'right' }}>{h.c}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.mist, marginBottom: 4 }}>By library</div>
        <div style={{ fontSize: 13 }}>
          {groups.map((x) => (
            <div key={x.g} style={{ ...cell, display: 'grid', gridTemplateColumns: '1fr 60px 70px', gap: 8 }}>
              <span>{LIBRARY_GROUPS[x.g].title}</span>
              <span className="mono" style={{ color: T.mist, textAlign: 'right' }}>{x.n} rows</span>
              <span className="mono" style={{ fontWeight: 600, textAlign: 'right' }}>{x.avg.toFixed(1)}/5</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FitSummary({ app }: { app: AppId }) {
  const scores = (ROWS[app] ?? []).map((r) => getFit(app, r.name)?.score).filter((x): x is FitRating['score'] => x !== undefined)
  const n = scores.length
  const avg = n ? scores.reduce((a: number, b) => a + b, 0) / n : 0
  if (!n) return null
  return (
    <span title="Average shadcn fit across this page's rated rows: 5 = out of the box, 1 = custom" style={{ fontSize: 12.5, color: T.slate, fontWeight: 600, marginRight: 12 }}>
      shadcn fit, page average: <span className="mono" style={{ color: T.ink }}>{avg.toFixed(1)}/5</span> ({n} rows) · <a href="#scorecard" style={{ color: T.teal }}>overall</a>
    </span>
  )
}

function VerdictSummary({ app }: { app: AppId }) {
  const s = useVerdicts()
  const rows = ROWS[app] ?? []
  const c = { adopt: 0, adjust: 0, reject: 0 }
  rows.forEach((r) => {
    const v = s[app][r.name]?.verdict
    if (v) c[v]++
  })
  const undecided = rows.length - c.adopt - c.adjust - c.reject
  const doExport = () => {
    const all = (['admin', 'web', 'mobile'] as AppId[]).flatMap((a) =>
      (ROWS[a] ?? []).map((r) => ({ app: a, name: r.name, group: r.group, replaceWith: r.replaceWith, recommended: RECOMMENDATIONS[a]?.[r.name]?.option, fit: getFit(a, r.name)?.score })),
    )
    const { markdown, json } = buildExport(all, s)
    download('ui-library-verdicts.md', markdown, 'text/markdown')
    download('ui-library-verdicts.json', json, 'application/json')
  }
  const chip = (label: string, n: number, bg: string, fg: string) => (
    <span style={{ padding: '4px 10px', borderRadius: 999, background: bg, color: fg, fontSize: 12.5, fontWeight: 600 }}>
      {label} {n}
    </span>
  )
  return (
    <div data-verdict-summary="" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12.5, color: T.slate, fontWeight: 600 }}>This page:</span>
      {chip('Adopt', c.adopt, T.okTint, T.okOn)}
      {chip('Adjust', c.adjust, T.warnTint, T.warnOn)}
      {chip('Reject', c.reject, T.errTint, T.errOn)}
      {chip('Undecided', undecided, T.sunken, T.slate)}
      <button
        type="button"
        onClick={doExport}
        style={{
          marginLeft: 6,
          padding: '6px 14px',
          borderRadius: 10,
          border: `1px solid ${T.teal}`,
          background: T.surface,
          color: T.teal,
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Export all verdicts (.md + .json)
      </button>
    </div>
  )
}

const HEADERS = ['Current · live', 'Proposed replacement · live', 'Component', 'What it does', 'Library and what changed']

export function LibraryGroup({ id, children }: { id: GroupId; children?: ReactNode }) {
  if (children === undefined || children === null || children === false) return null
  const g = LIBRARY_GROUPS[id]
  return (
    <section id={`lib-${id}`} aria-labelledby={`lib-${id}-h`} style={{ display: 'flex', flexDirection: 'column', scrollMarginTop: 16 }}>
      <h2 id={`lib-${id}-h`} style={{ margin: '18px 0 2px', fontSize: 20, fontWeight: 700 }}>
        {g.title}
      </h2>
      <p style={{ margin: '0 0 10px', fontSize: 14, color: T.slate }}>{g.blurb}</p>
      <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, background: T.surface }}>
        <div
          role="presentation"
          style={{
            display: 'grid',
            gridTemplateColumns: COLS,
            background: T.sunken,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: T.mist,
            borderRadius: '14px 14px 0 0',
            position: 'sticky',
            top: 0,
            zIndex: 5,
          }}
        >
          {HEADERS.map((h, i) => (
            <div key={h} style={{ padding: '9px 14px', color: i === 1 ? T.teal : undefined }}>
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
  name: string
  source: string
  usedIn: string
  what: string
  replaceWith: string
  note?: string
  stage?: 'web' | 'mobile'
  height?: number
  children: ReactNode
}

export function CatalogueRow({ name, source, usedIn, what, replaceWith, note, stage = 'web', height, children }: CatalogueRowProps) {
  const app = useApp()
  const rep = getReplacement(app, name)
  const verdicts = useVerdicts()
  const cell: CSSProperties = { padding: 14, borderTop: `1px solid ${T.line}`, minWidth: 0 }
  const options = rep?.options ?? []
  const chosenLabel = verdicts[app][name]?.option
  const rec = options.length > 1 ? RECOMMENDATIONS[app]?.[name] : undefined
  if (rec && !options.some((o) => o.label === rec.option)) console.warn(`[recommendations] ${app}:${name}: no option labelled "${rec.option}"`)
  const chosen = options.find((o) => o.label === chosenLabel) ?? options[0]
  const Rep = chosen?.Component ?? rep?.Component
  const replacementBody = Rep ? (
    // key: switching option remounts it, so each option starts from its own initial state
    <Rep key={chosen?.label ?? 'only'} />
  ) : (
    <Placeholder status={rep?.status} reason={rep?.customReason} failure={getLoadFailure(app, name)} />
  )
  return (
    <div data-catalogue-row={name} data-replacement-status={rep?.status ?? 'missing'} style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'stretch' }}>
      <div data-side="current" style={{ ...cell, background: T.bg }}>
        <SideCaption>Current · prototype</SideCaption>
        {stage === 'mobile' ? <ProtoMobileStage height={height ?? 320}>{children}</ProtoMobileStage> : <ProtoWebStage height={height}>{children}</ProtoWebStage>}
      </div>
      <div data-side="replacement" style={{ ...cell, background: T.tealTint + '66', borderLeft: `2px solid ${T.tealTint}` }}>
        <SideCaption>
          {options.length > 1 ? (
            <OptionPills
              name={name}
              labels={options.map((o) => o.label)}
              value={chosen?.label}
              recommended={rec?.option}
              onChange={(label) => setRowVerdict(app, name, { option: label })}
            />
          ) : (
            <span style={{ color: T.teal }}>Proposed</span>
          )}
        </SideCaption>
        {stage === 'mobile' ? (
          <MobileReplacementStage height={height ?? 320}>{replacementBody}</MobileReplacementStage>
        ) : (
          <WebReplacementStage height={height}>{replacementBody}</WebReplacementStage>
        )}
      </div>
      <div style={cell}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
        <div className="mono" style={{ fontSize: 11.5, color: T.mist, marginTop: 4, wordBreak: 'break-all' }}>
          {source}
        </div>
        <div style={{ fontSize: 12.5, color: T.slate, marginTop: 6 }}>{usedIn}</div>
      </div>
      <div style={{ ...cell, fontSize: 14, lineHeight: 1.5 }}>
        {what}
        {note !== undefined && <div style={{ marginTop: 8, color: T.slate, fontSize: 13 }}>{note}</div>}
      </div>
      <div style={{ ...cell, fontSize: 14, lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 600, color: T.teal }}>{rep?.library ?? replaceWith}</div>
          {rep && rep.library !== replaceWith && <div style={{ fontSize: 12, color: T.mist, marginTop: 2 }}>Research said: {replaceWith}</div>}
        </div>
        <FitBadge fit={getFit(app, name)} />
        {rep && rep.changes.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: T.slate, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {rep.changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
        {options.length > 1 && (
          <div data-option-notes="" style={{ fontSize: 12.5, color: T.slate, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontWeight: 700, color: T.ink }}>Options ({options.length})</div>
            {options.map((o, i) => (
              <div key={o.label} style={{ fontWeight: o.label === chosen?.label ? 600 : 400, color: o.label === chosen?.label ? T.ink : T.slate }}>
                {String.fromCharCode(65 + i)}. {o.label}
                {o.label === rec?.option && <span style={{ color: T.teal, fontWeight: 700 }}> ★ recommended</span>}
                {o.note ? ` · ${o.note}` : ''}
              </div>
            ))}
            {rec && (
              <div data-recommendation="" style={{ marginTop: 4, padding: '6px 8px', borderRadius: 8, background: T.tealTint, color: T.ink, lineHeight: 1.45 }}>
                <span style={{ fontWeight: 700, color: T.teal }}>★ Why {String.fromCharCode(65 + options.findIndex((o) => o.label === rec.option))}: </span>
                {rec.why}
              </div>
            )}
            <div style={{ color: T.mist }}>The option on screen is exported as your preferred one.</div>
          </div>
        )}
        <VerdictControl app={app} name={name} />
      </div>
    </div>
  )
}

/** A fixed-height strip above each live stage, on BOTH sides, so the two stages stay level. */
function SideCaption({ children }: { children: ReactNode }) {
  return (
    <div style={{ height: 30, marginBottom: 8, display: 'flex', alignItems: 'center', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: T.mist, overflowX: 'auto', whiteSpace: 'nowrap' }}>
      {children}
    </div>
  )
}

function OptionPills({ name, labels, value, recommended, onChange }: { name: string; labels: string[]; value?: string; recommended?: string; onChange: (label: string) => void }) {
  return (
    <div role="radiogroup" aria-label={`Options for ${name}`} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <span style={{ color: T.teal, marginRight: 2 }}>Options</span>
      {labels.map((label, i) => {
        const on = label === value
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(label)}
            title={label === recommended ? 'Recommended option' : undefined}
            style={{
              padding: '4px 11px',
              borderRadius: 999,
              border: `1px solid ${on ? T.teal : T.lineStrong}`,
              background: on ? T.teal : T.surface,
              color: on ? '#fff' : T.ink,
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: 0,
              textTransform: 'none',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {label === recommended && <span aria-label="Recommended" style={{ marginRight: 4 }}>★</span>}
            {String.fromCharCode(65 + i)} · {label}
          </button>
        )
      })}
    </div>
  )
}

const FIT_LABEL = ['', 'Custom', 'Bent', 'Restyled', 'Light touch', 'Out of the box']

/** The row's shadcn fit: 5 = out of the box, 1 = we work against the library. */
function FitBadge({ fit }: { fit?: FitRating }) {
  if (!fit) return null
  return (
    <div data-fit={fit.score} style={{ fontSize: 12.5, lineHeight: 1.45, color: T.slate }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontWeight: 700, color: T.ink }}>shadcn fit</span>
        <span aria-label={`${fit.score} out of 5`} style={{ display: 'inline-flex', gap: 3 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} aria-hidden style={{ width: 9, height: 9, borderRadius: 99, background: i <= fit.score ? T.teal : 'transparent', border: `1.5px solid ${i <= fit.score ? T.teal : T.lineStrong}` }} />
          ))}
        </span>
        <span className="mono" style={{ fontWeight: 600, color: T.ink }}>{fit.score}/5</span>
        <span style={{ color: T.mist }}>· {FIT_LABEL[fit.score]}</span>
      </div>
      <div style={{ marginTop: 2 }}>{fit.why}</div>
    </div>
  )
}

function Placeholder({ status, reason, failure }: { status?: string; reason?: string; failure?: string }) {
  const custom = status === 'custom'
  if (failure)
    return (
      <div role="alert" style={{ padding: 12, borderRadius: 10, background: T.errTint, color: T.errOn, fontSize: 13, lineHeight: 1.5 }}>
        <div style={{ fontWeight: 700 }}>Replacement failed to load</div>
        <div className="mono" style={{ marginTop: 4, fontSize: 12, wordBreak: 'break-word' }}>{failure}</div>
      </div>
    )
  return (
    <div style={{ padding: 12, borderRadius: 10, border: `1px dashed ${T.lineStrong}`, color: T.slate, fontSize: 13.5, lineHeight: 1.5 }}>
      <div style={{ fontWeight: 700, color: T.ink }}>{custom ? 'No library replacement · stays custom' : 'Replacement not built yet'}</div>
      {reason && <div style={{ marginTop: 4 }}>{reason}</div>}
    </div>
  )
}

const VERDICT_STYLE: Record<Verdict, { bg: string; fg: string }> = {
  adopt: { bg: T.okTint, fg: T.okOn },
  adjust: { bg: T.warnTint, fg: T.warnOn },
  reject: { bg: T.errTint, fg: T.errOn },
}

function VerdictControl({ app, name }: { app: AppId; name: string }) {
  const s = useVerdicts()
  const v = s[app][name]
  const [open, setOpen] = useState(Boolean(v?.note))
  return (
    <div data-verdict={v?.verdict ?? ''} style={{ marginTop: 'auto', paddingTop: 8, borderTop: `1px dashed ${T.line}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div role="radiogroup" aria-label={`Verdict for ${name}`} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {(Object.keys(VERDICT_LABEL) as Verdict[]).map((k) => {
          const on = v?.verdict === k
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setRowVerdict(app, name, { verdict: on ? undefined : k })}
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                border: `1px solid ${on ? VERDICT_STYLE[k].fg : T.line}`,
                background: on ? VERDICT_STYLE[k].bg : T.surface,
                color: on ? VERDICT_STYLE[k].fg : T.slate,
              }}
            >
              {VERDICT_LABEL[k]}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ marginLeft: 'auto', border: 0, background: 'none', color: T.teal, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {open ? 'Hide note' : v?.note ? 'Show note' : 'Add note'}
        </button>
      </div>
      {open && (
        <textarea
          aria-label={`Note for ${name}`}
          value={v?.note ?? ''}
          onChange={(e) => setRowVerdict(app, name, { note: e.target.value })}
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', borderRadius: 8, border: `1px solid ${T.lineStrong}`, padding: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
        />
      )}
    </div>
  )
}
