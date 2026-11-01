import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { HARNESS_HEIGHT } from '../chrome/HarnessBar'
import { accent, elevation, neutral, radius } from '../theme/tokens'

interface Props {
  /** Shown above the field only where the card title does not already name it. */
  label?: string
  placeholder: string
  /** What is chosen, as the field shows it; null shows the placeholder. */
  value: ReactNode | null
  disabled?: boolean
  /** Popover width in px and which edge it hangs from. */
  width?: number
  align?: 'left' | 'right'
  onOpen?: () => void
  onClose?: () => void
  /** Offered as a ✕ in the filled field, and on Backspace or Delete while it has focus. */
  onClear?: () => void
  /** What the ✕ clears, for its label ("procedure", "Contract"). */
  clearLabel?: string
  /** The list. `seed` is the key typed on the closed field, to start its search with. */
  children: (close: () => void, seed: string) => ReactNode
}

/** Rows the keyboard moves through: the list's own rows, not the RVG type-ahead's options. */
const ROWS = 'button[data-pick]'

/**
 * A field that opens a searchable list under it, as a select would, but with
 * room for grouped rows, prices and a second filter.
 *
 * Keyboard: typing on the closed field opens it with that key as the search;
 * ArrowDown, Enter or Space open it too. In the list the arrows move through
 * the rows (the first match is lit as you type), Enter picks, Escape closes
 * and hands focus back to the field.
 */
export function Combo({ label, placeholder, value, disabled, width = 600, align = 'left', onOpen, onClose, onClear, clearLabel = 'selection', children }: Props) {
  const clearable = Boolean(onClear && value && !disabled)
  const [open, setOpen] = useState(false)
  const [seed, setSeed] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLButtonElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState<{ height: number; up: boolean }>({ height: 480, up: false })

  // Size the list to the window: fill the space below the field (or above it, when
  // that is roomier), within a floor and a ceiling. Re-measured on scroll and resize.
  useLayoutEffect(() => {
    if (!open) return
    const measure = () => {
      const rect = field.current?.getBoundingClientRect()
      if (!rect) return
      const GAP = 6
      const MARGIN = 16
      const below = window.innerHeight - rect.bottom - GAP - MARGIN
      const above = rect.top - GAP - MARGIN - HARNESS_HEIGHT // stay clear of the harness bar
      const up = below < 260 && above > below
      setFit({ height: Math.max(240, Math.min(1000, up ? above : below)), up })
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open])
  const active = useRef(-1)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  const close = (refocus = true) => {
    setOpen(false)
    closeRef.current?.()
    if (refocus) field.current?.focus()
  }

  const openWith = (key: string) => {
    setSeed(key)
    setOpen(true)
    onOpen?.()
  }

  /** The first row a search found: skips the pinned default row. */
  const firstMatch = () => [...(pop.current?.querySelectorAll<HTMLButtonElement>(ROWS) ?? [])].findIndex((r) => !r.dataset.pinned)

  /** Light the active row and keep it in view. */
  const paint = () => {
    const rows = [...(pop.current?.querySelectorAll<HTMLButtonElement>(ROWS) ?? [])]
    if (active.current >= rows.length) active.current = rows.length - 1
    rows.forEach((r, i) => (r.dataset.active = String(i === active.current)))
    rows[active.current]?.scrollIntoView({ block: 'nearest' })
  }

  useEffect(() => {
    if (!open) return
    active.current = -1
    requestAnimationFrame(() => {
      if (seed) active.current = Math.max(0, firstMatch())
      paint()
    })
    const onDown = (e: MouseEvent) => {
      // The workshop harness (data-keep-open) is not "outside": toggling its context
      // filter with a list open should update the list in place, not close it.
      const t = e.target as HTMLElement
      if (ref.current && !ref.current.contains(t) && !t.closest('[data-keep-open]')) close(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const onFieldKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (open || disabled) return
    if ((e.key === 'Backspace' || e.key === 'Delete') && clearable) {
      e.preventDefault()
      onClear!()
      return
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && e.key !== ' ') {
      e.preventDefault()
      openWith(e.key)
    } else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openWith('')
    }
  }

  const onListKey = (e: KeyboardEvent<HTMLDivElement>) => {
    // The RVG type-ahead inside a list runs its own arrows and Enter.
    if ((e.target as HTMLElement).closest('[data-own-keys]')) return
    const rows = pop.current?.querySelectorAll<HTMLButtonElement>(ROWS) ?? []
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      active.current = Math.max(0, Math.min(rows.length - 1, active.current + step))
      paint()
    } else if (e.key === 'Enter' && active.current >= 0) {
      e.preventDefault()
      rows[active.current]?.click()
      // If the pick opened a second layer (a Contract's lines), start at its top.
      active.current = -1
      requestAnimationFrame(paint)
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <span style={{ fontSize: 12.5, fontWeight: 600, color: disabled ? neutral.mist : neutral.slate }}>{label}</span>}
      <div style={{ position: 'relative' }}>
      <button
        ref={field}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onKeyDown={onFieldKey}
        onClick={() => (open ? close() : openWith(''))}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          minHeight: 40,
          textAlign: 'left',
          padding: '7px 12px',
          borderRadius: radius.ctl,
          border: `1px solid ${open ? accent.base : neutral.lineStrong}`,
          boxShadow: open ? accent.focusRing : 'none',
          background: disabled ? neutral.bg : neutral.surface,
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>{value ?? <span style={{ fontSize: 14, color: neutral.mist }}>{placeholder}</span>}</div>
        {/* Room for the ✕, which sits over the field as its own button (buttons cannot nest). */}
        {clearable && <span aria-hidden style={{ width: 22, flex: 'none' }} />}
        <ChevronDown size={17} color={disabled ? neutral.lineStrong : neutral.slate} style={{ flex: 'none', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }} />
      </button>
      {clearable && (
        <button
          type="button"
          aria-label={`Clear ${clearLabel}`}
          title={`Clear ${clearLabel}`}
          onClick={() => {
            if (open) close(false)
            onClear!()
            field.current?.focus()
          }}
          style={{ position: 'absolute', right: 34, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 999, background: neutral.sunken, color: neutral.slate, cursor: 'pointer', padding: 0 }}
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      )}
      </div>
      {open && (
        <div
          ref={pop}
          role="dialog"
          aria-label={label ?? placeholder}
          onKeyDown={onListKey}
          onInput={() => {
            // A new search: light its first match so Enter picks it. The pinned
            // No contract (RVG) row stays on top but is not the match.
            requestAnimationFrame(() => {
              active.current = Math.max(0, firstMatch())
              paint()
            })
          }}
          style={{
            position: 'absolute',
            ...(fit.up ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
            [align]: 0,
            width,
            maxWidth: '90vw',
            height: fit.height,
            zIndex: 30,
            background: neutral.surface,
            border: `1px solid ${neutral.line}`,
            borderRadius: radius.card,
            boxShadow: elevation.e3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'aa-sheet-rise 160ms ease-out',
          }}
        >
          {children(() => close(), seed)}
        </div>
      )}
    </div>
  )
}

/** The two-line value a filled field shows: what it is, where it comes from, and a price on the right. */
export function FieldValue({ main, sub, aside }: { main: ReactNode; sub?: ReactNode; aside?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: '20px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{main}</div>
        {sub && <div style={{ fontSize: 12.5, color: neutral.slate, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>
      {aside && <div style={{ flex: 'none', textAlign: 'right' }}>{aside}</div>}
    </div>
  )
}
