import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { neutral, radius } from '../../theme/tokens'
import { FIELD_CLASS, FIELD_FILL, type FieldFill } from './fieldChrome'

/**
 * The one type-ahead name search box (catch-up Phase 32a; US-01.4.7 "the names
 * filter as each letter is typed", US-01.4.2 the finder's search). Controlled
 * and filter-free: every caller narrows its own rows with the one matcher,
 * `matchesNameQuery` (`domain/names.ts`), so there is one box and one filter.
 * Used by the single-Booking move sheet, the List move sheet's colleague step,
 * the web availability grid and the office's anaesthetist finders.
 *
 * Two sizes from the same parts: `field` (full width, 48px, in a sheet) and
 * `pill` (a compact toolbar control, 36px, or 38px beside the web Lists' Go to
 * date). It never reorders anything. UI unification U4 (question 4): `fill`
 * `well` (grey) inside white sheets, cards and drawers, `surface` (white, the
 * default) on the page or the phone canvas; `aa-field` gives the one focus
 * ring. Since U4 it is also both anaesthetist Lists searches (`testId`,
 * `clearLabel`, the 44px `touch` clear on the phone).
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
  /** `well` grey inside white containers; `surface` white on the page (default). */
  fill?: FieldFill
  /** `data-testid` on the input. */
  testId?: string
  /** The clear button's name (default "Clear search"). */
  clearLabel?: string
  /** A 44px clear target (the phone's Lists page, convention 16). */
  touch?: boolean
  /** The pill's height: 36 (default) or 38 (the web Lists row, beside Go to date). */
  height?: 36 | 38
}

export function NameSearchBox({
  value,
  onChange,
  label,
  placeholder,
  size = 'field',
  autoFocus = false,
  shot,
  width,
  fill = 'surface',
  testId,
  clearLabel = 'Clear search',
  touch = false,
  height: pillHeight = 36,
}: NameSearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const pill = size === 'pill'
  const height = pill ? pillHeight : 48
  const clearSize = touch ? 44 : pill ? 24 : 32
  // The 38px pill is the web Lists row's (14px text, as its Go to date neighbour).
  const roomy = pill && pillHeight === 38
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
      <Search size={roomy ? 15 : pill ? 14 : 16} strokeWidth={2.2} aria-hidden style={{ position: 'absolute', left: pill ? 11 : 14, color: neutral.mist, pointerEvents: 'none' }} />
      <input
        // Text, not "search": the browser's own clear button would double ours.
        ref={inputRef}
        type="text"
        role="searchbox"
        // The phone keyboard's Search key, as a search field shows.
        inputMode="search"
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
        data-testid={testId}
        className={FIELD_CLASS}
        style={{
          width: '100%',
          height,
          borderRadius: pill ? radius.pill : radius.ctl,
          border: `1px solid ${neutral.line}`,
          background: FIELD_FILL[fill],
          padding: `0 ${value !== '' ? (touch ? 48 : pill ? 30 : 40) : 14}px 0 ${pill ? 30 : 40}px`,
          fontFamily: 'inherit',
          fontSize: roomy ? 14 : pill ? 13 : 15,
          color: neutral.ink,
        }}
      />
      {value !== '' && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => {
            onChange('')
            // The button leaves with the text: keep focus in the box (and inside a sheet).
            inputRef.current?.focus()
          }}
          style={{
            position: 'absolute',
            right: touch ? 2 : pill ? 6 : 8,
            width: clearSize,
            height: clearSize,
            borderRadius: radius.pill,
            border: 'none',
            background: touch ? 'transparent' : neutral.sunken,
            color: neutral.slate,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <X size={touch ? 18 : pill ? 12 : 14} strokeWidth={touch ? 2 : 2.4} aria-hidden />
        </button>
      )}
    </div>
  )
}
