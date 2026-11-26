/**
 * The feed's search and filters (build plan Phase 68; D125; docs/explorations/intake-ideas.html #idea1,
 * layout A's `.fhead`): the one search box over the shared `FilterPills`, To decide (the default), Needs
 * NHI, Rooms PDFs, one per connected hospital and Decided. Filters, not tabs: the source is a mark on each
 * item. A pill shows its number only where something waits to be decided (hidden at zero, as the tab
 * badges are); Decided is history and has none.
 */

import { CountBadge, FilterPills, NameSearchBox } from '../../../../../shared/ui'
import type { FeedFilter } from '../../../../../domain/intake/arrivals'
import { useArrivalFeedCounts, useConnectedHospitals } from '../../../../../store/intakeSelectors'
import { feedFilterFromParam, feedFilterParam } from '../intakePaths'

/** To decide's value in the pills (it has no URL value of its own). */
const TO_DECIDE_VALUE = 'to-decide'

function pillValue(filter: FeedFilter): string {
  return feedFilterParam(filter) ?? TO_DECIDE_VALUE
}

function FilterLabel({ label, count }: { label: string; count?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {label}
      {count !== undefined && <CountBadge count={count} mono />}
    </span>
  )
}

export function FeedFilters({
  filter,
  q,
  onFilterChange,
  onSearchChange,
}: {
  filter: FeedFilter
  /** The search box's text as typed. */
  q: string
  onFilterChange: (filter: FeedFilter) => void
  onSearchChange: (q: string) => void
}) {
  const counts = useArrivalFeedCounts()
  const hospitals = useConnectedHospitals()
  const options = [
    { value: TO_DECIDE_VALUE, label: <FilterLabel label="To decide" count={counts.toDecide} /> },
    { value: pillValue({ kind: 'needsNhi' }), label: <FilterLabel label="Needs NHI" count={counts.needsNhi} /> },
    { value: pillValue({ kind: 'roomsPdfs' }), label: <FilterLabel label="Rooms PDFs" count={counts.roomsPdfs} /> },
    ...hospitals.map((h) => ({
      value: pillValue({ kind: 'hospital', hospitalId: h.hospitalId }),
      label: <FilterLabel label={h.name} count={counts.byHospital[h.hospitalId] ?? 0} />,
    })),
    { value: pillValue({ kind: 'decided' }), label: <FilterLabel label="Decided" /> },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <NameSearchBox
        size="pill"
        width="100%"
        fill="well"
        label="Search patient, NHI, surgeon"
        value={q}
        onChange={onSearchChange}
        shot="intake-search"
      />
      <div data-shot="intake-filters">
        <FilterPills
          ariaLabel="Show arrivals"
          value={pillValue(filter)}
          options={options}
          onSelect={(value) => onFilterChange(feedFilterFromParam(value === TO_DECIDE_VALUE ? null : value))}
          style={{ flexWrap: 'wrap', gap: 6 }}
        />
      </div>
    </div>
  )
}
