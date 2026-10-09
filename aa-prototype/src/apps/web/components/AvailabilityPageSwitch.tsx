import { useNavigate } from 'react-router-dom'
import { SlidingSegmentedControl } from '../../../shared/ui'

/**
 * The two Availability pages (catch-up Phase 29; US-03.1.4): Find cover (the
 * colleague grid, `/web/availability`) and My availability (the calendar,
 * `/web/availability/mine`).
 */
export function AvailabilityPageSwitch({ current }: { current: 'find' | 'mine' }) {
  const navigate = useNavigate()
  return (
    <div style={{ width: 320 }}>
      <SlidingSegmentedControl
        value={current}
        ariaLabel="Availability page"
        variant="surface"
        options={[
          { value: 'find', label: 'Find cover' },
          { value: 'mine', label: 'My availability' },
        ]}
        onSelect={(v) => navigate(v === 'find' ? '/web/availability' : '/web/availability/mine')}
        buttonStyle={{ height: 38 }}
      />
    </div>
  )
}
