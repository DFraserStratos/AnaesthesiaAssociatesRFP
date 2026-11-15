import { SearchIcon, XIcon } from 'lucide-react'
import { useRef, type CSSProperties } from 'react'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

/**
 * The one search box look, taken from the prototype's NameSearchBox (its shared type-ahead box):
 * white surface, the `line` border, a mist search glyph at the start and a round sunken clear
 * button once there is text. Sizes as the prototype's: `field` 48px on `rounded-ctl` (in a sheet or
 * a page), `pill` 36px x 180 (a toolbar), `wide` 38px x 280 (the web Lists page's WebSearchField).
 * Apply the parts to shadcn InputGroup / InputGroupAddon / InputGroupInput.
 */
export type SearchSize = 'field' | 'pill' | 'wide'

export function searchFieldClass(size: SearchSize = 'field') {
  const round = size !== 'field'
  return {
    group: cn(
      'tw:bg-surface tw:border-line',
      size === 'field' && 'tw:h-12 tw:w-full',
      size === 'pill' && 'tw:h-9 tw:w-[180px] tw:flex-none tw:rounded-pill!',
      size === 'wide' && 'tw:h-[38px] tw:w-[280px] tw:flex-none tw:rounded-pill!',
    ),
    startAddon: cn('tw:text-mist', round ? 'tw:pl-3' : 'tw:pl-3.5'),
    icon: size === 'field' ? 'tw:size-4!' : 'tw:size-3.5!',
    input: cn('tw:text-ink tw:placeholder:text-mist', size === 'field' ? 'tw:text-[15px]' : size === 'wide' ? 'tw:text-sm' : 'tw:text-[13px]'),
    endAddon: round ? 'tw:pr-1.5' : 'tw:pr-2',
    clear: cn('tw:rounded-pill! tw:bg-sunken tw:text-slate tw:hover:bg-line', size === 'field' ? 'tw:size-8' : 'tw:size-6'),
  }
}

/** The leading search glyph addon, in the shared look. */
export function SearchFieldIcon({ size = 'field' }: { size?: SearchSize }) {
  const c = searchFieldClass(size)
  return (
    <InputGroupAddon align="inline-start" className={c.startAddon}>
      <SearchIcon aria-hidden className={c.icon} strokeWidth={2.2} />
    </InputGroupAddon>
  )
}

/** The trailing round clear button addon, in the shared look (render it only when there is text). */
export function SearchFieldClear({ size = 'field', onClear, label = 'Clear search' }: { size?: SearchSize; onClear: () => void; label?: string }) {
  const c = searchFieldClass(size)
  return (
    <InputGroupAddon align="inline-end" className={c.endAddon}>
      <InputGroupButton size={size === 'field' ? 'icon-sm' : 'icon-xs'} aria-label={label} className={c.clear} onClick={onClear}>
        <XIcon strokeWidth={2.4} />
      </InputGroupButton>
    </InputGroupAddon>
  )
}

/**
 * The whole search box (NameSearchBox, WebSearchField, the finders): InputGroup in the shared look,
 * a role=searchbox input with no browser suggestions, and the clear button once there is text
 * (focus stays in the box). The first Escape clears typed text and stops there, as today.
 */
export function SearchField({
  value,
  onChange,
  label,
  placeholder,
  size = 'field',
  width,
  id,
  clearLabel,
  className,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  placeholder?: string
  size?: SearchSize
  width?: CSSProperties['width']
  id?: string
  clearLabel?: string
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const c = searchFieldClass(size)
  return (
    <InputGroup className={cn(c.group, className)} style={width !== undefined ? { width } : undefined}>
      <SearchFieldIcon size={size} />
      <InputGroupInput
        ref={ref}
        id={id}
        type="text"
        role="searchbox"
        aria-label={label}
        placeholder={placeholder ?? label}
        value={value}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        className={c.input}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value !== '') {
            e.stopPropagation()
            onChange('')
          }
        }}
      />
      {value !== '' && (
        <SearchFieldClear
          size={size}
          label={clearLabel}
          onClear={() => {
            onChange('')
            ref.current?.focus()
          }}
        />
      )}
    </InputGroup>
  )
}
