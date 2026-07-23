import { useEffect, useMemo, useState } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'
import type { RvgCode } from '../../domain/types'
import { useSurface } from '../surface'

interface CodePickerSheetProps {
  open: boolean
  currentCode?: string
  rvgCodes: Record<string, RvgCode>
  onPick: (code: string) => void
  onClose: () => void
}

function baseUnitsLabel(code: RvgCode): string {
  return code.baseUnits.kind === 'single'
    ? `B ${code.baseUnits.units}`
    : `B ${code.baseUnits.min} to ${code.baseUnits.max}`
}

/**
 * The RVG base-code picker (mockup screen 3's bottom sheet): search across
 * code and name, rows grouped by anatomical site, mono code + name + base
 * units, the selected row tinted teal.
 */
export function CodePickerSheet({ open, currentCode, rvgCodes, onPick, onClose }: CodePickerSheetProps) {
  const { Overlay } = useSurface()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = Object.values(rvgCodes).filter(
      (c) => q === '' || c.code.includes(q) || c.description.toLowerCase().includes(q),
    )
    const bySite = new Map<string, RvgCode[]>()
    for (const code of matches) {
      const arr = bySite.get(code.anatomicalSite)
      if (arr === undefined) bySite.set(code.anatomicalSite, [code])
      else arr.push(code)
    }
    return [...bySite.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([site, codes]) => ({ site, codes: codes.sort((a, b) => a.code.localeCompare(b.code)) }))
  }, [rvgCodes, query])

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Procedure code</div>
      <input
        placeholder="Search code or name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          height: 48,
          borderRadius: radius.ctl,
          border: `1px solid ${neutral.line}`,
          background: neutral.bg,
          padding: '0 14px',
          fontFamily: 'inherit',
          fontSize: 15,
          color: neutral.ink,
          marginBottom: 8,
        }}
      />
      <div style={{ maxHeight: 420, overflow: 'auto' }}>
        {groups.length === 0 && (
          <div style={{ padding: '18px 4px', fontSize: 14, color: neutral.mist }}>No codes match that search.</div>
        )}
        {groups.map((group) => (
          <div key={group.site}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: neutral.mist,
                textTransform: 'uppercase',
                padding: '12px 10px 4px',
              }}
            >
              {group.site}
            </div>
            {group.codes.map((code) => {
              const selected = code.code === currentCode
              return (
                <button
                  key={code.code}
                  type="button"
                  onClick={() => onPick(code.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderBottom: `1px solid ${neutral.sunken}`,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    padding: '14px 10px',
                    borderRadius: 8,
                    background: selected ? accent.tint : 'transparent',
                  }}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: accent.base }}>
                      {code.code}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 500, color: neutral.ink }}>{code.description}</span>
                  </span>
                  <span className="mono" style={{ fontSize: 12, color: neutral.mist, flex: 'none' }}>
                    {baseUnitsLabel(code)}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </Overlay>
  )
}
