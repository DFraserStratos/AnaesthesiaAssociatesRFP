import type { ReactNode } from 'react'
import { accent, neutral, radius } from '../../../theme/tokens'
import { BottomSheet } from '../../../shared/surface'
import { Button } from '../../../shared/ui'
import { OverlayHeader } from '../../../shared/surface/OverlayHeader'
import { SheetActions } from '../../../shared/surface/SheetActions'

/**
 * The mobile List's options (opened from the ⋯ in the List detail nav bar):
 * the secondary things she can do with her own List, so the header keeps to
 * the List itself. Each row says in one line what it does. New List options
 * join here as more rows.
 */
export interface ListOption {
  key: string
  shot: string
  icon: ReactNode
  label: string
  hint: string
  disabled?: boolean
  onSelect: () => void
}

export function ListOptionsSheet({ open, title, subtitle, options, onClose }: { open: boolean; title: string; subtitle: string; options: ListOption[]; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div data-shot="list-options-sheet" role="menu" aria-label="List options" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 4px 8px' }}>
          <OverlayHeader title={title} description={subtitle} />
        </div>
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            role="menuitem"
            data-shot={o.shot}
            disabled={o.disabled}
            onClick={o.onSelect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              width: '100%',
              minHeight: 60,
              padding: '10px 6px',
              border: 'none',
              borderRadius: radius.md,
              background: 'none',
              fontFamily: 'inherit',
              textAlign: 'left',
              cursor: o.disabled ? 'default' : 'pointer',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 40,
                height: 40,
                flex: 'none',
                borderRadius: radius.md,
                display: 'grid',
                placeItems: 'center',
                background: o.disabled ? neutral.sunken : accent.tint,
                color: o.disabled ? neutral.mist : accent.base,
              }}
            >
              {o.icon}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <span style={{ fontSize: 16, lineHeight: '22px', fontWeight: 600, color: o.disabled ? neutral.slate : neutral.ink }}>{o.label}</span>
              <span style={{ fontSize: 13, lineHeight: '18px', color: neutral.slate }}>{o.hint}</span>
            </span>
          </button>
        ))}
        <SheetActions
          primary={
            <Button variant="secondary" block onClick={onClose}>
              Close
            </Button>
          }
        />
      </div>
    </BottomSheet>
  )
}

