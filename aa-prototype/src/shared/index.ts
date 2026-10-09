/** Cross-app shared components. */
export { Logo } from './Logo'
export { Wordmark } from './Wordmark'
export { Avatar } from './Avatar'
export { StatusChip, StatusChipView } from './StatusChip'
export { StatusBlock } from './StatusBlock'
export { StatusLegend, useLegendKeys } from './StatusLegend'
export { blockFill } from './StatusBlock'
// Catch-up Phase 29: the availability status master as the apps read it.
export {
  resolveDisplayStatus,
  emptySessionLine,
  useSlotStatusRecords,
  useSlotStatuses,
  useAnaesthetistStatusChoices,
  useSlotStatus,
  useDisplayStatus,
  useDefaultStatus,
  type ResolvedStatus,
} from './status/useSlotStatuses'
export { DemoBadge } from './DemoBadge'

// Phase 05 — shared surface, UI primitives, schedule row, formatting.
export { SurfaceProvider, useSurface, BottomSheet, Dialog, type Surface, type SurfaceVariant } from './surface'
export { Button, TickBadge, SuccessOverlay, FieldLabel, FormError, TextField, TextArea, Segmented, DockSpacer } from './ui'
export { ListRow, type ListRowRight } from './schedule'

// Catch-up Phase 15a: warnings (triangle, panel, hooks).
export { useBookingWarnings, useListWarnings, WarningTriangle, WarningsPanel, ClearWarningButton } from './warnings'
