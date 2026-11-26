/**
 * The inbox's toolbar (docs/explorations/intake-inbox-iterations.html #inbox): the search, four drop-downs (Show,
 * Kind, Source, Surgery) and the "Needs a look" checkbox, the count at the right. Built as the Conflicts screen's
 * toolbar is: compact controls that name themselves by their value, an accessible label each.
 */

import { ARRIVAL_KIND_LABELS, ARRIVAL_KINDS, type ArrivalKind } from '../../../../../domain/intake/arrivals'
import { INBOX_SHOW_LABELS, INBOX_SURGERY_LABELS, type InboxQuery, type InboxShow, type InboxSurgery } from '../../../../../domain/intake/inbox'
import { Checkbox, NameSearchBox, SelectField } from '../../../../../shared/ui'
import { useConnectedHospitals } from '../../../../../store/intakeSelectors'
import { neutral, space, type as typeScale } from '../../../../../theme/tokens'
import { PageToolbar } from '../../../components/AdminPage'

export function InboxToolbar({
  query,
  typed,
  count,
  onSearch,
  onChange,
}: {
  query: InboxQuery
  /** The search box's text as typed (the query keeps it trimmed). */
  typed: string
  /** The toolbar's count, in words. */
  count: string
  onSearch: (text: string) => void
  onChange: (next: InboxQuery) => void
}) {
  const hospitals = useConnectedHospitals()
  const set = (patch: Partial<InboxQuery>) => onChange({ ...query, ...patch })
  return (
    <PageToolbar
      shot="intake-inbox-filters"
      end={
        <span data-shot="intake-inbox-count" style={{ color: neutral.ink, fontWeight: typeScale.label.weight }}>
          {count}
        </span>
      }
    >
      <NameSearchBox size="pill" width={280} label="Search patient, NHI, surgeon" placeholder="Search patient, NHI, surgeon" value={typed} onChange={onSearch} shot="intake-search" />
      <SelectField label="Show" hideLabel size="compact" fill="surface" value={query.show} onChange={(v) => set({ show: v as InboxShow })}>
        {(Object.keys(INBOX_SHOW_LABELS) as InboxShow[]).map((k) => (
          <option key={k} value={k}>{INBOX_SHOW_LABELS[k]}</option>
        ))}
      </SelectField>
      <SelectField label="Kind" hideLabel size="compact" fill="surface" value={query.kind} onChange={(v) => set({ kind: v as ArrivalKind | 'all' })}>
        <option value="all">All kinds</option>
        {ARRIVAL_KINDS.map((k) => (
          <option key={k} value={k}>{ARRIVAL_KIND_LABELS[k]}</option>
        ))}
      </SelectField>
      <SelectField label="Source" hideLabel size="compact" fill="surface" value={query.source} onChange={(v) => set({ source: v })}>
        <option value="all">All sources</option>
        <option value="rooms">Rooms&apos; PDFs</option>
        {hospitals.map((h) => (
          <option key={h.hospitalId} value={h.hospitalId}>{h.name}</option>
        ))}
      </SelectField>
      <SelectField label="Date of surgery" hideLabel size="compact" fill="surface" value={query.surgery} onChange={(v) => set({ surgery: v as InboxSurgery })}>
        {(Object.keys(INBOX_SURGERY_LABELS) as InboxSurgery[]).map((k) => (
          <option key={k} value={k}>{INBOX_SURGERY_LABELS[k]}</option>
        ))}
      </SelectField>
      <Checkbox checked={query.look} onChange={(c) => set({ look: c })} shot="intake-inbox-look" style={{ display: 'inline-flex', gap: space[2], fontSize: typeScale.small.size, color: neutral.slate }}>
        Needs a look
      </Checkbox>
    </PageToolbar>
  )
}
