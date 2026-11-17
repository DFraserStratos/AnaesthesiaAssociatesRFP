import { LineTabLink, LineTabs } from '../../../shared/ui'

/**
 * The two Availability pages (catch-up Phase 29; US-03.1.4): Find cover (the
 * colleague grid, `/web/availability`) and My availability (the calendar,
 * `/web/availability/mine`). Sibling routes, so an underline strip of real
 * links, the current one `aria-current="page"` (UI unification U5, question 18).
 */
export function AvailabilityPageSwitch({ current }: { current: 'find' | 'mine' }) {
  return (
    <LineTabs label="Availability page">
      <LineTabLink to="/web/availability" active={current === 'find'}>
        Find cover
      </LineTabLink>
      <LineTabLink to="/web/availability/mine" active={current === 'mine'}>
        My availability
      </LineTabLink>
    </LineTabs>
  )
}
