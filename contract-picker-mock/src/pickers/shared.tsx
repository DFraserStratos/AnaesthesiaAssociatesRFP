import { useMemo, useState, type ReactNode } from 'react'
import { Check, ChevronRight, Search, X } from 'lucide-react'
import { RVG_CODES, basisOf, lineFee, matches, type Contract, type MappedLine, type Selection } from '../data'
import { accent, elevation, neutral, radius } from '../theme/tokens'
import type { HolderKind } from '../data/types'
import { KIND } from '../theme/kinds'
import { KindDot, Micro, Pill } from '../ui'

export function SearchField({ value, onChange, placeholder, autoFocus }: { value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${neutral.lineStrong}`, borderRadius: radius.ctl, padding: '0 12px', background: neutral.surface, flex: 1 }}>
      <Search size={16} color={neutral.mist} />
      <input autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ border: 'none', outline: 'none', padding: '9px 0', flex: 1, fontSize: 14, background: 'transparent', boxShadow: 'none' }} />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: neutral.mist, padding: 0, display: 'flex' }}>
          <X size={14} />
        </button>
      )}
    </label>
  )
}

/**
 * Optional RVG code type-ahead. Typing "H6" narrows straight to the ocular
 * groups; the arrows move through the options, Enter picks, Escape closes.
 * It keeps its own keys (`data-own-keys`), so a list around it does not react.
 */
export function RvgTypeahead({ value, onChange, placeholder = 'RVG code (optional)', compact, autoFocus }: { value?: string; onChange: (code: string | undefined) => void; placeholder?: string; compact?: boolean; autoFocus?: boolean }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  // Grouped by body part in the RVG's own order (Head, Head · Ocular, Neck…). Typing
  // filters; groups whose codes start with what was typed come first ("LL" → Lower Limb).
  const groups = useMemo(() => {
    const t = q.trim().toLowerCase()
    const hits = RVG_CODES.filter((r) => !t || r.code.toLowerCase().startsWith(t) || matches(q, r.description, r.region, r.sub))
    const byGroup = new Map<string, typeof hits>()
    for (const r of hits) {
      const key = r.sub ? `${r.region} · ${r.sub}` : r.region
      byGroup.set(key, [...(byGroup.get(key) ?? []), r])
    }
    const all = [...byGroup.entries()]
    if (!t) return all
    const prefixed = (rows: typeof hits) => rows.some((r) => r.code.toLowerCase().startsWith(t))
    return [...all.filter(([, rows]) => prefixed(rows)), ...all.filter(([, rows]) => !prefixed(rows))]
  }, [q])
  const options = useMemo(() => groups.flatMap(([, rows]) => rows), [groups])

  if (value) {
    const r = RVG_CODES.find((x) => x.code === value)
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: accent.tint, borderRadius: radius.ctl, padding: compact ? '4px 8px' : '7px 10px', fontSize: 13.5, minWidth: 0 }}>
        <span className="mono" style={{ fontWeight: 700, color: accent.base }}>{value}</span>
        <span style={{ color: neutral.ink, maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r?.description}</span>
        {r?.baseUnits != null && <span className="mono" style={{ color: neutral.slate }}>B {r.baseUnits}{r.maxUnits ? `-${r.maxUnits}` : ''}</span>}
        <button type="button" aria-label="Clear RVG code" onClick={() => onChange(undefined)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: neutral.slate, padding: 0, display: 'flex' }}>
          <X size={14} />
        </button>
      </span>
    )
  }

  const choose = (code: string) => {
    onChange(code)
    setQ('')
    setOpen(false)
  }

  return (
    <div data-own-keys style={{ position: 'relative', flex: compact ? undefined : 1, minWidth: 220 }}>
      <input
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            setOpen(true)
            setActive((i) => Math.max(0, Math.min(options.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1))))
          } else if (e.key === 'Enter' && open && options[active]) {
            e.preventDefault()
            choose(options[active].code)
          } else if (e.key === 'Escape' && open) {
            e.stopPropagation()
            setOpen(false)
          }
        }}
        role="combobox"
        aria-expanded={open}
        placeholder={placeholder}
        className={q ? 'mono' : undefined}
        style={{ width: '100%', height: compact ? undefined : 40, border: `1px solid ${neutral.lineStrong}`, borderRadius: radius.ctl, padding: '8px 12px', fontSize: 14, background: neutral.surface }}
      />
      {open && options.length > 0 && (
        <div role="listbox" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, maxHeight: 360, overflowY: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, boxShadow: elevation.e2, zIndex: 5, minWidth: compact ? 0 : 380 }}>
          {groups.map(([group, rows]) => (
            <div key={group} role="group" aria-label={group}>
              <div style={{ position: 'sticky', top: 0, zIndex: 1, padding: '5px 12px', background: neutral.sunken, borderBottom: `1px solid ${neutral.line}`, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.slate }}>{group}</div>
              {rows.map((r) => {
                const i = options.indexOf(r)
                return (
            <button
              key={`${r.code}-${i}`}

              ref={(el) => {
                if (el && i === active) el.scrollIntoView({ block: 'nearest' })
              }}
              type="button"
              role="option"
              aria-selected={i === active}
              data-active={i === active}
              className="aa-row"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(r.code)}
              style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '7px 12px', cursor: 'pointer', fontSize: 13 }}
            >
              <span className="mono" style={{ width: 44, flex: 'none', fontWeight: 700, color: accent.base }}>{r.code}</span>
              <span style={{ flex: 1, color: neutral.ink }}>{r.description}</span>
              <span className="mono" style={{ color: neutral.slate }}>B {r.baseUnits}{r.maxUnits ? `-${r.maxUnits}` : ''}</span>
            </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 20px', borderBottom: `1px solid ${neutral.line}`, flexWrap: 'wrap' }}>{children}</div>
}

export function ScrollArea({ children }: { children: ReactNode }) {
  return <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>{children}</div>
}

/** A group's header; with a `kind` it takes that holder kind's tint, edge and name. */
export function GroupHeader({ children, count, sticky = true, kind }: { children: ReactNode; count?: number; sticky?: boolean; kind?: HolderKind }) {
  const k = kind ? KIND[kind] : null
  return (
    <div style={{ position: sticky ? 'sticky' : undefined, top: 0, zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 20px', background: k ? k.tint : neutral.sunken, boxShadow: k ? `inset 3px 0 0 ${k.solid}` : 'none', borderBottom: `1px solid ${neutral.line}` }}>
      <Micro style={{ flex: 1, color: k ? k.onTint : undefined }}>{children}</Micro>
      {k && kind !== 'aa' && <span style={{ fontSize: 11.5, color: k.onTint, opacity: 0.8 }}>{k.label}</span>}
      {count !== undefined && <span className="mono" style={{ fontSize: 11.5, color: neutral.slate }}>{count}</span>}
    </div>
  )
}

/** True when the pending pick is this Contract itself (an RVG-priced Contract, no line). */
export function isContract(pending: Selection | null, contractId: string): boolean {
  return pending?.contractId === contractId && !pending.lineId
}

/** The chosen row: teal selection tint with a left rule, as the prototype marks selection. */
const selectedStyle = { background: accent.tint, boxShadow: `inset 3px 0 0 ${accent.base}` } as const

const rowStyle = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', border: 'none', borderBottom: `1px solid ${neutral.line}`, background: 'transparent', padding: '10px 20px', cursor: 'pointer' } as const

export function ContractRow({ contract, onClick, drills, aside, selected }: { contract: Contract; onClick: () => void; drills?: boolean; aside?: ReactNode; selected?: boolean }) {
  return (
    <button type="button" data-pick data-pinned={contract.isDefault || undefined} className="aa-row" aria-pressed={selected} onClick={onClick} style={{ ...rowStyle, ...(selected ? selectedStyle : null) }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: neutral.ink }}>
          <KindDot kind={contract.holderKind} />
          {contract.name}
        </div>
        <div style={{ fontSize: 12.5, color: neutral.slate }}>
          {contract.holder} · {basisOf(contract)}
        </div>
      </div>
      {aside}
      {contract.isPrepay && <Pill tone="success">Prepay</Pill>}
      {contract.isDefault && <Pill>Default</Pill>}
      {selected && <Check size={18} color={accent.base} />}
      {drills && <ChevronRight size={18} color={neutral.mist} />}
    </button>
  )
}

/** One priced line. `context` is the Contract it sits in, shown where the row stands alone. */
export function LineRow({ line, onClick, context, selected }: { line: MappedLine; onClick: () => void; /** The Contract it sits in, shown where the row stands alone. */ context?: Contract; selected?: boolean }) {
  return (
    <button type="button" data-pick className="aa-row" aria-pressed={selected} onClick={onClick} style={{ ...rowStyle, alignItems: 'flex-start', ...(selected ? selectedStyle : null) }}>
      <span className="mono" style={{ width: 78, flex: 'none', fontSize: 12.5, fontWeight: 600, color: line.code ? accent.base : neutral.mist, paddingTop: 2 }}>{line.code ?? 'no code'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: neutral.ink }}>{line.description}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3, alignItems: 'center' }}>
          {context && (
            <span style={{ fontSize: 12.5, color: neutral.slate, marginRight: 4 }}>
              <KindDot kind={context.holderKind} />
              {context.name}
            </span>
          )}
          {context?.isPrepay && <Pill tone="success">Prepay</Pill>}
          {line.band && <Pill>{line.band}</Pill>}
          {line.addOn && <Pill tone="warning">Add-on</Pill>}
          {line.approx && <Pill tone="warning">Estimate</Pill>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flex: 'none' }}>
        <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{lineFee(line)}</div>
      </div>
      {selected && <Check size={18} color={accent.base} style={{ flex: 'none', marginTop: 2 }} />}
    </button>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <div style={{ padding: '14px 20px', fontSize: 13, color: neutral.slate, lineHeight: '19px' }}>{children}</div>
}
