import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ITEM_STATUSES, type ItemStatus } from '../../shared/types.ts'
import { useDismiss } from '../useDismiss.ts'
import { ITEM_STATUS_HELP } from '../vocab.ts'
import { StatusLabel } from './bits.tsx'

/**
 * The status pill in an item sheet's read view, pressable: it opens a small menu of the statuses,
 * each pill beside what it means, and picking one hands it to `onPick` (which saves it). The menu
 * opens upward because the pill sits at the foot of the sheet.
 */
export function StatusPicker({ status, onPick, busy = false }: { status: ItemStatus; onPick: (s: ItemStatus) => void; busy?: boolean }) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) trigger.current?.focus({ preventScroll: true })
  }
  const menu = useDismiss<HTMLDivElement>(() => close(), trigger, open)

  // Opening puts focus on the current status, so the arrow keys start from where the item is.
  useEffect(() => {
    if (!open) return
    menu.current?.scrollIntoView({ block: 'nearest' })
    menu.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true })
  }, [open, menu])

  const pick = (s: ItemStatus) => {
    close()
    if (s !== status) onPick(s)
  }

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const rows = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])]
    const at = rows.indexOf(document.activeElement as HTMLElement)
    const to = e.key === 'ArrowDown' ? at + 1 : e.key === 'ArrowUp' ? at - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? rows.length - 1 : null
    if (to !== null) {
      e.preventDefault()
      rows[(to + rows.length) % rows.length]?.focus()
    } else if (e.key === 'Tab') close(false)
  }

  return (
    <div className="status-pick">
      <button
        ref={trigger}
        type="button"
        className="status-pick-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Status: ${status}. Change status`}
        title="Change status"
        disabled={busy}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        <StatusLabel status={status}>
          <ChevronDown size={12} strokeWidth={2.4} aria-hidden />
        </StatusLabel>
      </button>
      {open && (
        <div ref={menu} className="status-menu" role="menu" aria-label="Status" onKeyDown={onMenuKey}>
          {ITEM_STATUSES.map((s) => (
            <button key={s} type="button" role="menuitemradio" aria-checked={s === status} className={s === 'Retired' ? 'retire' : undefined} onClick={() => pick(s)}>
              <StatusLabel status={s} />
              <span className="status-menu-help">{ITEM_STATUS_HELP[s]}</span>
              {s === status && <Check size={15} strokeWidth={2.4} className="status-menu-check" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
