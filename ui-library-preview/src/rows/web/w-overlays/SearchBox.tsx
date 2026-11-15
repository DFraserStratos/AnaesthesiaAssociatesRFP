import { useState } from 'react'
import { SearchField } from '../../shared/searchField'
import { Echo } from './shared'

/**
 * The one search box the research proposes for WebSearchField, NameSearchBox and mobile's
 * LookbackSearchRow: the shared SearchField (src/rows/shared/searchField), on shadcn Input Group.
 * Sizes: `pill` 36px (the Find cover toolbar), `wide` 38px x 280 (the Lists page), `field` 48px.
 */
export const SearchBox = SearchField

/** WebSearchField: the Lists page's patient name or NHI search, handing its query up. */
export function WebSearchFieldReplacement() {
  const [query, setQuery] = useState('')
  return (
    <>
      <SearchBox size="wide" value={query} onChange={setQuery} label="Search your Bookings" placeholder="Search patient name or NHI" clearLabel="Clear the search field" />
      <Echo>{query === '' ? null : `Query handed up: "${query}"`}</Echo>
    </>
  )
}

/** NameSearchBox: the shared name filter in both its sizes, pill (Find cover) and field (in a sheet). */
export function NameSearchBoxReplacement() {
  const [pill, setPill] = useState('')
  const [field, setField] = useState('')
  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      <div className="tw:flex tw:items-center tw:gap-3">
        <span className="tw:w-10 tw:text-[11.5px] tw:font-semibold tw:text-mist">pill</span>
        <SearchBox size="pill" value={pill} onChange={setPill} label="Search name" />
      </div>
      <div className="tw:flex tw:items-center tw:gap-3">
        <span className="tw:w-10 tw:text-[11.5px] tw:font-semibold tw:text-mist">field</span>
        <SearchBox size="field" value={field} onChange={setField} label="Search name" />
      </div>
    </div>
  )
}
