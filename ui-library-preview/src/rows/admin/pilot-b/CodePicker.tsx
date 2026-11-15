import { useMemo, useRef, useState } from 'react'
import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAppStore } from '@proto/store'
import { baseUnitsShort, defaultPickerRows, searchRvgGroups } from '@proto/domain/billing/rvgGroups'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { SearchFieldClear, SearchFieldIcon, searchFieldClass } from '../../shared/searchField'
import { cn } from '@/lib/utils'

/** The fields of the prototype's RvgGroup this row reads. */
interface RvgGroup {
  id: string
  code: string
  description: string
  anatomy: string
  baseUnits: number
  baseUnitsRange?: { min: number; max: number }
  retired?: boolean
}

const SEARCH_LABEL = 'Search RVG code or description'
/** A first guess at a row's height before it is measured (one-line description plus the anatomy pill). */
const ESTIMATED_ROW = 66

/**
 * The RVG code type-ahead on Base UI Combobox, rendered inline (`<Combobox.Root inline open>`) in a
 * shadcn Dialog, as the prototype's CodePickerSheet renders in the web surface's dialog. The
 * prototype's own search (`searchRvgGroups`, `defaultPickerRows`) does the filtering, so the codes,
 * ranking and the 12-row default list are identical; Base UI adds the combobox and listbox roles,
 * arrow, Home/End and Enter selection; TanStack Virtual renders only the rows in view.
 */
export function CodePickerReplacement({ closeX = false, escapeClearsFirst = true }: { closeX?: boolean; escapeClearsFirst?: boolean }) {
  const rvgGroups: Record<string, RvgGroup> = useAppStore((s: { masters: { rvgGroups: Record<string, RvgGroup> } }) => s.masters.rvgGroups)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<string | undefined>(undefined)
  const [query, setQuery] = useState('')
  const label = current !== undefined ? rvgGroups[current] : undefined

  /**
   * One gate for the Dialog's and the Combobox's close requests. As today, the first Escape only
   * clears a typed search (cancelling Base UI's dismissal); with the option off, Escape closes at once.
   */
  function requestOpenChange(next: boolean, details: { reason: string; cancel: () => void }) {
    if (!next && escapeClearsFirst && details.reason === 'escape-key' && query !== '') {
      details.cancel()
      setQuery('')
      return
    }
    setOpen(next)
  }

  return (
    <div>
      <Button
        variant="outline"
        size="lg"
        onClick={() => {
          setQuery('')
          setOpen(true)
        }}
      >
        {label !== undefined ? `RVG ${label.code}` : 'Choose an RVG code'}
      </Button>
      <Dialog open={open} onOpenChange={requestOpenChange}>
        <DialogContent showCloseButton={closeX} className="tw:gap-0" data-shot="rvg-type-ahead-replacement">
          <DialogTitle className={cn("tw:mb-3 tw:text-[17px] tw:font-semibold", !closeX && "tw:pr-0")}>RVG code</DialogTitle>
          <RvgCombobox
            open={open}
            rvgGroups={rvgGroups}
            currentId={current}
            query={query}
            onQueryChange={setQuery}
            onOpenChange={requestOpenChange}
            onPick={(id) => {
              setCurrent(id)
              setOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
      <div role="status" className="tw:mt-2 tw:min-h-[18px] tw:text-[12.5px] tw:text-slate">
        {label !== undefined ? `${label.code} · ${label.description}` : 'Nothing picked yet.'}
      </div>
    </div>
  )
}

function RvgCombobox({
  open,
  rvgGroups,
  currentId,
  query,
  onQueryChange: setQuery,
  onOpenChange,
  onPick,
}: {
  open: boolean
  rvgGroups: Record<string, RvgGroup>
  currentId: string | undefined
  query: string
  onQueryChange: (query: string) => void
  onOpenChange: (open: boolean, details: { reason: string; cancel: () => void }) => void
  onPick: (id: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Every live row is the item set; the prototype's search decides what shows and in what order.
  const allRows = useMemo<RvgGroup[]>(() => searchRvgGroups('', rvgGroups), [rvgGroups])
  const rows = useMemo<RvgGroup[]>(
    () => (query.trim() === '' ? defaultPickerRows(rvgGroups, currentId) : searchRvgGroups(query, rvgGroups)),
    [rvgGroups, query, currentId],
  )
  const selected = currentId !== undefined ? (rvgGroups[currentId] ?? null) : null

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW,
    overscan: 6,
    getItemKey: (index) => rows[index]?.id ?? index,
  })

  return (
    <ComboboxPrimitive.Root<RvgGroup>
      inline
      open={open}
      onOpenChange={onOpenChange}
      virtualized
      items={allRows}
      filteredItems={rows}
      inputValue={query}
      onInputValueChange={(value) => setQuery(value)}
      value={selected}
      onValueChange={(group) => {
        if (group !== null) onPick(group.id)
      }}
      itemToStringLabel={(group) => group.code}
      isItemEqualToValue={(a, b) => a.id === b.id}
      autoHighlight
      onItemHighlighted={(_group, details) => {
        if (details.reason === 'keyboard' && details.index >= 0) virtualizer.scrollToIndex(details.index, { align: 'auto' })
      }}
    >
      <InputGroup className={searchFieldClass('field').group}>
        <SearchFieldIcon />
        <ComboboxPrimitive.Input
          ref={inputRef}
          aria-label={SEARCH_LABEL}
          placeholder={SEARCH_LABEL}
          autoFocus
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          render={<InputGroupInput className={searchFieldClass('field').input} />}
        />
        {query !== '' && (
          <SearchFieldClear
            onClear={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
          />
        )}
      </InputGroup>

      <div aria-live="polite" className="tw:min-h-[18px] tw:px-1 tw:py-1.5 tw:text-[12.5px] tw:text-mist">
        {query.trim() === ''
          ? 'Type a code such as H1, or a word from the description.'
          : `${rows.length} ${rows.length === 1 ? 'match' : 'matches'}`}
      </div>

      {rows.length === 0 && (
        <div className="tw:px-1 tw:py-[18px] tw:text-sm tw:text-mist">No RVG codes match that search.</div>
      )}

      <ComboboxPrimitive.List
        ref={scrollRef}
        aria-label="RVG codes"
        className="tw:max-h-[420px] tw:overflow-auto tw:outline-none tw:data-empty:hidden"
      >
        <div role="presentation" className="tw:relative tw:w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((v) => {
            const group = rows[v.index]
            if (group === undefined) return null
            const isCurrent = group.id === currentId
            return (
              <ComboboxPrimitive.Item
                key={v.key}
                index={v.index}
                value={group}
                ref={virtualizer.measureElement}
                data-index={v.index}
                data-rvg-code={group.code}
                aria-label={`${group.code}, ${group.description}, ${group.anatomy}, ${baseUnitsShort(group)}`}
                className={cn(
                  'tw:absolute tw:top-0 tw:left-0 tw:grid tw:w-full tw:cursor-pointer tw:grid-cols-[52px_1fr_auto] tw:items-start tw:gap-x-3 tw:rounded-ctl tw:border-b tw:border-sunken tw:px-2.5 tw:py-3 tw:text-left tw:outline-none tw:select-none',
                  'tw:data-highlighted:bg-sunken',
                  isCurrent && 'tw:bg-teal-tint tw:data-highlighted:bg-teal-tint',
                )}
                style={{ transform: `translateY(${v.start}px)` }}
              >
                <span className="tw:pt-px tw:font-mono tw:text-[13.5px] tw:font-semibold tw:text-primary">{group.code}</span>
                <span className="tw:flex tw:min-w-0 tw:flex-col tw:items-start tw:gap-1">
                  <span className="tw:text-[14.5px] tw:leading-[1.35] tw:font-medium tw:text-ink">{group.description}</span>
                  <Badge className="tw:px-[7px] tw:py-0 tw:text-[11px] tw:leading-4">{group.anatomy}</Badge>
                </span>
                <span className="tw:pt-px tw:font-mono tw:text-[12.5px] tw:font-semibold tw:whitespace-nowrap tw:text-slate">
                  {baseUnitsShort(group)}
                </span>
              </ComboboxPrimitive.Item>
            )
          })}
        </div>
      </ComboboxPrimitive.List>
    </ComboboxPrimitive.Root>
  )
}
