/** Cross-app shared components. */
export { Logo } from './Logo'
export { Wordmark } from './Wordmark'
export { Avatar, avatarFontSize, type AvatarVariant } from './Avatar'
export { PersonaChip } from './PersonaChip'
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
export { Button, TickBadge, SuccessOverlay, FieldLabel, FormError, TextField, TextArea, Segmented, DockSpacer, Eyebrow, Card, PageHeader, StatTile, DefList, DefRow } from './ui'
// UI unification U6: the table kit.
export { Th, Td, GroupRow, TableShell, ClickableRow, RowOpenButton, isInteractiveRowTarget, type TableDensity } from './table'
export { ListRow, ProgressPill, type ListRowRight } from './schedule'

// Catch-up Phase 26: the anaesthetist's own profile (row, rate editor, copy).
export { ProfileRow, useRateEditor, BANK_CAPTION, HPI_CPN_CAPTION, OFFICE_HELD_CAPTION, RATE_EXPLAINER, RATE_LABEL, RATE_NOTE, RATE_PER_UNIT } from './profile'

// Catch-up Phase 15a: warnings (triangle, panel, hooks).
export { useBookingWarnings, useListWarnings, WarningTriangle, WarningsPanel, ClearWarningButton } from './warnings'

// Catch-up Phase 43a: point-of-need help.
export { InfoTip, useInfoTip, infoTipShot, type InfoTipParts } from './help/InfoTip'
export { HELP_TOPICS, type HelpTopic, type HelpTopicId } from './help/helpTopics'
