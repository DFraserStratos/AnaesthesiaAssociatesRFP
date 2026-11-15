import { Autocomplete } from '@base-ui/react/autocomplete'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { usePortalContainer } from '@/kit/portal'
import { cn } from '@/lib/utils'

/**
 * Free text with suggestions, on Base UI Autocomplete (the library's answer to `<input list>`):
 * the value is whatever is typed; the popup filters the known values as you type, arrows and Enter
 * pick one. `mode="both"` also completes the highlighted suggestion inline in the field.
 * Styled as the kit's field (48px on the bg colour) and the kit's Combobox popup.
 */
export function AutocompleteField({
  items,
  value,
  onValueChange,
  id,
  placeholder,
  mode = 'list',
  mono = false,
  size = 'default',
  invalid,
  className,
  emptyText = 'No suggestions. The text is kept as typed.',
  ...aria
}: {
  items: readonly string[]
  value: string
  onValueChange: (value: string) => void
  id?: string
  placeholder?: string
  mode?: 'list' | 'both'
  mono?: boolean
  size?: 'default' | 'sm'
  invalid?: boolean
  className?: string
  emptyText?: string
  'aria-label'?: string
  'aria-describedby'?: string
}) {
  const container = usePortalContainer()
  return (
    <Autocomplete.Root items={items} value={value} onValueChange={(v) => onValueChange(v)} mode={mode} openOnInputClick>
      <InputGroup className={cn(size === 'sm' && 'tw:h-9', className)}>
        <Autocomplete.Input
          id={id}
          placeholder={placeholder}
          aria-invalid={invalid === true ? true : undefined}
          {...aria}
          render={<InputGroupInput className={cn(size === 'sm' ? 'tw:text-[13px]' : 'tw:text-[15px]', mono && 'tw:font-mono tw:tabular-nums')} />}
        />
      </InputGroup>
      <Autocomplete.Portal container={container}>
        <Autocomplete.Positioner sideOffset={6} align="start" className="tw:isolate tw:z-50">
          <Autocomplete.Popup className="aa-motion-fade tw:max-h-(--available-height) tw:w-(--anchor-width) tw:overflow-hidden tw:rounded-ctl tw:border tw:border-line tw:bg-surface tw:text-ink tw:shadow-e2">
            <Autocomplete.Empty className="tw:px-3 tw:py-2.5 tw:text-[13px] tw:text-mist tw:empty:hidden">{emptyText}</Autocomplete.Empty>
            <Autocomplete.List className="tw:max-h-[260px] tw:scroll-py-1 tw:overflow-y-auto tw:overscroll-contain tw:p-1 tw:outline-none tw:data-empty:p-0">
              {(item: string) => (
                <Autocomplete.Item
                  key={item}
                  value={item}
                  className={cn(
                    'tw:flex tw:w-full tw:cursor-default tw:items-center tw:rounded-[6px] tw:px-2.5 tw:py-2 tw:text-sm tw:outline-hidden tw:select-none tw:data-highlighted:bg-sunken',
                    mono && 'tw:font-mono tw:tabular-nums',
                  )}
                >
                  {item}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  )
}
