import { useMemo, useState } from 'react'
import { useAppStore } from '@proto/store'
import { matchesNameQuery } from '@proto/domain/names'
import { SearchField } from '../../shared/searchField'

/** The shared search box (src/rows/shared/searchField): one look for every search in the preview. */
const SearchBox = SearchField

export function NameSearchBoxReplacement() {
  const names: Record<string, { name: string }> = useAppStore((s: { masters: { anaesthetists: Record<string, { name: string }> } }) => s.masters.anaesthetists)
  const [query, setQuery] = useState('')
  const [pill, setPill] = useState('')
  const matches = useMemo(() => Object.values(names).filter((a) => matchesNameQuery(a.name, query)).map((a) => a.name), [names, query])
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      <SearchBox value={query} onChange={setQuery} label="Search anaesthetists" />
      <div className="tw:text-[12.5px] tw:text-slate">
        {matches.length} match{matches.length === 1 ? '' : 'es'}: {matches.slice(0, 4).join(' · ')}
        {matches.length > 4 ? ' …' : ''}
      </div>
      <SearchBox value={pill} onChange={setPill} label="Pill size" size="pill" />
    </div>
  )
}
