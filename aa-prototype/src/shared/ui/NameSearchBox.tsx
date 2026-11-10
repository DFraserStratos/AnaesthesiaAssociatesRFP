import { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'

/**
 * The one type-ahead name search box (catch-up Phase 32a; US-01.4.7 "the names
 * filter as each letter is typed", US-01.4.2 the finder's search). Controlled
 * and filter-free: every caller narrows its own rows with the one matcher,
 * `matchesNameQuery` (`domain/names.ts`), so there is one box and one filter.
 * Used by the single-Booking move sheet, the List move sheet's colleague step,
 * the web availability grid and the office's anaesthetist finders.
 *
 * Two sizes from the same parts: `field` (full width, 48px, in a sheet) and
 * `pill` (a compact toolbar control). It never reorders anything.
 */
export interface NameSearchBoxProps {
  value: string
  onChange: (value: string) => void
  /** The accessible name, and the placeholder unless one is given. */
  label: string
  placeholder?: string
  size?: 'field' | 'pill'
  autoFocus?: boolean
  /** `data-shot` hook for screenshots and Playwright. */
  shot?: string
  width?: number | string
}

export function NameSearchBox({ value, onChange, label, placeholder, size = 'field', autoFocus = false, shot, width }: NameSearchBoxProps) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pill = size === 'pill'
  const height = pill ? 36 : 48
  return (
    <div
      data-shot={shot}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: width ?? (pill ? 180 : '100%'),
        flex: pill ? 'none' : undefined,
      }}
    >
      <Search size={pill ? 14 : 16} strokeWidth={2.2} aria-hidden style={{ position: 'absolute', left: pill ? 11 : 14, color: neutral.mist, pointerEvents: 'none' }} />
      <input
        // Text, not "search": the browser's own clear button would double ours.
        ref={inputRef}
        type="text"
        role="searchbox"
        aria-label={label}
        value={value}
        // A type-ahead, not a form: no autocorrect or browser suggestions over the rows.
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        autoFocus={autoFocus}
        placeholder={placeholder ?? label}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value !== '') {
            e.stopPropagation()
            onChange('')
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          height,
          borderRadius: pill ? radius.pill : radius.ctl,
          border: `1px solid ${focused ? accent.base : neutral.line}`,
          boxShadow: focused ? accent.focusRing : 'none',
          outline: 'none',
          background: neutral.surface,
          padding: `0 ${value !== '' ? (pill ? 30 : 40) : 14}px 0 ${pill ? 30 : 40}px`,
          fontFamily: 'inherit',
          fontSize: pill ? 13 : 15,
          color: neutral.ink,
        }}
      />
      {value !== '' && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange('')
            // The button leaves with the text: keep focus in the box (and inside a sheet).
            inputRef.current?.focus()
          }}
          style={{
            position: 'absolute',
            right: pill ? 6 : 8,
            width: pill ? 24 : 32,
            height: pill ? 24 : 32,
            borderRadius: radius.pill,
            border: 'none',
            background: neutral.sunken,
            color: neutral.slate,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <X size={pill ? 12 : 14} strokeWidth={2.4} aria-hidden />
        </button>
      )}
    </div>
  )
}
