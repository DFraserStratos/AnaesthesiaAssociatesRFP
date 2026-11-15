import { useEffect, useRef } from 'react'
import { accent, neutral } from '../../theme/tokens'
import type { RvgGroup, RvgGroupId } from '../../domain/types'
import { baseUnitsShort, searchRvgGroups } from '../../domain/billing/rvgGroups'

/** The RVG codes as sections under their anatomy headings, in the guide's order. Every code, or those matching the search. */
export function rvgSections(query: string, groups: Readonly<Record<string, RvgGroup>>): { anatomy: string; rows: RvgGroup[] }[] {
  const guide = searchRvgGroups('', groups)
  const order = new Map<string, number>()
  for (const g of guide) if (!order.has(g.anatomy)) order.set(g.anatomy, order.size)
  const rows = query.trim() === '' ? guide : searchRvgGroups(query, groups)
  const out = new Map<string, RvgGroup[]>()
  for (const g of rows) out.set(g.anatomy, [...(out.get(g.anatomy) ?? []), g])
  return [...out.entries()].sort(([a], [b]) => (order.get(a) ?? 0) - (order.get(b) ?? 0)).map(([anatomy, rows]) => ({ anatomy, rows }))
}

/**
 * Every RVG code, under its anatomy heading (owner review, 2026-11-16): the
 * heading stays pinned to the top of the list until its rows have scrolled past,
 * then the next takes its place. Nothing is suggested from the Procedure's text;
 * the search only narrows. Shared by the type-ahead field and the code sheet.
 */
export function RvgCodeList({
  sections,
  currentId,
  activeId,
  onActive,
  onPick,
  maxHeight,
  role = 'listbox',
}: {
  sections: { anatomy: string; rows: RvgGroup[] }[]
  currentId?: RvgGroupId
  activeId?: RvgGroupId
  onActive?: (id: RvgGroupId) => void
  onPick: (id: RvgGroupId) => void
  maxHeight: number
  role?: 'listbox' | 'list'
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  // Open on the current code, centred, so the whole guide is still a scroll away.
  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>('[data-rvg-current="true"]')
    if (el !== null && el !== undefined && scrollRef.current !== null) scrollRef.current.scrollTop = Math.max(0, el.offsetTop - scrollRef.current.clientHeight / 2)
    // Only on mount: the list then scrolls as the person scrolls it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (activeId === undefined) return
    scrollRef.current?.querySelector<HTMLElement>(`[data-rvg-id="${activeId}"]`)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeId])
  const option = role === 'listbox'
  return (
    <div ref={scrollRef} role={role} aria-label="RVG codes" style={{ maxHeight, overflow: 'auto', overscrollBehavior: 'contain', position: 'relative' }}>
      {sections.length === 0 && <div style={{ padding: '12px 14px', fontSize: 13.5, color: neutral.mist }}>No RVG codes match that search.</div>}
      {sections.map((section) => (
        <div key={section.anatomy} role="group" aria-label={section.anatomy} data-shot="rvg-section">
          <div
            aria-hidden
            data-shot="rvg-section-heading"
            style={{ position: 'sticky', top: 0, zIndex: 1, padding: '7px 14px 6px', background: neutral.bg, borderTop: `1px solid ${neutral.line}`, borderBottom: `1px solid ${neutral.line}`, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.slate }}
          >
            {section.anatomy}
          </div>
          {section.rows.map((group) => {
            const selected = group.id === currentId
            const active = group.id === activeId
            return (
              <button
                key={group.id}
                type="button"
                {...(option ? { role: 'option', 'aria-selected': selected } : { 'aria-current': selected ? ('true' as const) : undefined })}
                aria-label={`${group.code}, ${group.description}, ${group.anatomy}, ${baseUnitsShort(group)}`}
                data-rvg-code={group.code}
                data-rvg-id={group.id}
                data-rvg-current={selected ? 'true' : undefined}
                onMouseEnter={onActive !== undefined ? () => onActive(group.id) : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(group.id)}
                style={{ display: 'grid', gridTemplateColumns: '52px minmax(0, 1fr) auto', alignItems: 'start', columnGap: 12, width: '100%', textAlign: 'left', border: 'none', borderBottom: `1px solid ${neutral.sunken}`, background: active || selected ? accent.tint : 'transparent', padding: '10px 14px', fontFamily: 'inherit', cursor: 'pointer' }}
              >
                <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: accent.base, paddingTop: 1 }}>{group.code}</span>
                <span style={{ fontSize: 14, fontWeight: selected ? 600 : 500, color: neutral.ink, lineHeight: 1.35, minWidth: 0 }}>{group.description}</span>
                <span className="mono" data-shot="rvg-base-units" style={{ fontSize: 12.5, fontWeight: 600, color: neutral.slate, whiteSpace: 'nowrap', paddingTop: 1 }}>
                  {baseUnitsShort(group)}
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
