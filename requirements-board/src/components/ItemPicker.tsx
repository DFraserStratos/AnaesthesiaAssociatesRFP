import { X } from 'lucide-react'
import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import type { Item, ItemType } from '../../shared/types.ts'
import { lineageTitles, searchItems } from '../itemSearch.ts'
import type { Index } from '../store.ts'
import { typeClass } from '../vocab.ts'
import { ItemName, TypeIcon } from './bits.tsx'

/** What an item of this type may sit under: a feature under an epic, a story under a feature or straight under an epic. */
export const PARENT_TYPES: Record<ItemType, readonly ItemType[]> = { epic: [], feature: ['epic'], story: ['feature', 'epic'] }

/** One result row: the name first, then where it sits, so two features of the same name can be told apart. */
function Option({ item, index, active, id, onPick }: { item: Item; index: Index; active: boolean; id: string; onPick: () => void }) {
  const lineage = lineageTitles(index, item)
  return (
    <button id={id} type="button" role="option" tabIndex={-1} aria-selected={active} className={active ? 'active' : ''} onMouseDown={(e) => e.preventDefault()} onClick={onPick}>
      <span className="picker-name">
        <ItemName item={item} />
        {lineage.length > 0 && <span className="picker-lineage">{lineage.join(' › ')}</span>}
      </span>
      <span className="mono">{item.id}</span>
    </button>
  )
}

/** Arrow keys walk the list, Enter picks, Esc closes it without closing the sheet or popover around it. */
function listKeys(e: KeyboardEvent<HTMLInputElement>, count: number, setActive: (f: (a: number) => number) => void, pickActive: () => void, onEscape: () => boolean) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    setActive((a) => Math.min(a + 1, count - 1))
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    setActive((a) => Math.max(a - 1, 0))
  } else if (e.key === 'Enter') {
    e.preventDefault()
    pickActive()
  } else if (e.key === 'Escape' && onEscape()) {
    e.stopPropagation()
  }
}

/** Pick the epic or feature an item sits under. Focus shows the likely parents; typing narrows them. */
export function ParentPicker({
  type,
  value,
  excludeId,
  index,
  onPick,
  autoFocus,
}: {
  type: ItemType
  value: string | null
  excludeId?: string
  index: Index
  onPick: (id: string) => void
  autoFocus?: boolean
}) {
  const [query, setQuery] = useState('')
  const [openList, setOpenList] = useState(false)
  const [active, setActive] = useState(0)
  const current = value ? index.byId.get(value) : undefined
  const candidates = useMemo(() => searchItems(index, query, { types: PARENT_TYPES[type], exclude: excludeId ? [excludeId] : [], limit: 80 }), [index, type, excludeId, query])

  const listId = useId()
  const pick = (it: Item) => {
    onPick(it.id)
    setOpenList(false)
    setQuery('')
    setActive(0)
  }
  return (
    <div className="picker">
      <input
        className="input"
        role="combobox"
        aria-expanded={openList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={openList && candidates[active] ? `${listId}-${active}` : undefined}
        placeholder={current ? current.title : type === 'feature' ? 'Search epics' : 'Search features and epics'}
        value={openList ? query : current ? current.title : ''}
        autoFocus={autoFocus}
        onFocus={() => {
          setOpenList(true)
          setActive(0)
        }}
        onBlur={() => setTimeout(() => setOpenList(false), 120)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpenList(true)
          setActive(0)
        }}
        onKeyDown={(e) => {
          if (!openList) {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpenList(true)
            }
            return
          }
          listKeys(
            e,
            candidates.length,
            setActive,
            () => {
              const c = candidates[active]
              if (c) pick(c)
            },
            () => {
              setOpenList(false)
              return true
            },
          )
        }}
      />
      {openList && (
        <div className="picker-list" role="listbox" id={listId}>
          {candidates.map((c, i) => (
            <Option key={c.id} id={`${listId}-${i}`} item={c} index={index} active={i === active} onPick={() => pick(c)} />
          ))}
          {candidates.length === 0 && <p className="empty">No match</p>}
        </div>
      )}
    </div>
  )
}

/** The items an outstanding item bears on: chips for those picked, a search to add more. */
export function AffectsPicker({ value, index, onChange }: { value: string[]; index: Index; onChange: (v: string[]) => void }) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const matches = useMemo(() => (query.trim() ? searchItems(index, query, { exclude: value, limit: 40 }) : []), [query, index, value])
  const add = (id: string) => {
    onChange([...value, id])
    setQuery('')
    setActive(0)
  }
  return (
    <div className="picker">
      {value.length > 0 && (
        <div className="chip-row" style={{ marginBottom: 6 }}>
          {value.map((a) => {
            const it = index.byId.get(a)
            return (
              <span key={a} className={`chip item ${it ? typeClass(it.type) : ''}`} title={a}>
                {it ? <TypeIcon type={it.type} size={12} /> : null}
                <span>{it?.title ?? a}</span>
                <button type="button" className="x" aria-label={`Remove ${it?.title ?? a}`} onClick={() => onChange(value.filter((x) => x !== a))}>
                  <X size={12} />
                </button>
              </span>
            )
          })}
        </div>
      )}
      <input
        className="input"
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={matches[active] ? `${listId}-${active}` : undefined}
        placeholder="Add an epic, feature or story by title or ID"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
        }}
        onKeyDown={(e) =>
          listKeys(
            e,
            matches.length,
            setActive,
            () => {
              const m = matches[active]
              if (m) add(m.id)
            },
            () => {
              if (!query) return false
              setQuery('')
              return true
            },
          )
        }
      />
      {matches.length > 0 && (
        <div className="picker-list" role="listbox" id={listId}>
          {matches.map((m, i) => (
            <Option key={m.id} id={`${listId}-${i}`} item={m} index={index} active={i === active} onPick={() => add(m.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
