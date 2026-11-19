/** Shared UI primitives (moved from mobile in Phase 05; identical on both apps). */
export { Button, type ButtonVariant, type ButtonSize } from './Button'
export { TextAction, type TextActionSize } from './TextAction'
export { BackLink, type BackLinkSize } from './BackLink'
export { IconButton, CloseButton, type IconButtonSize, type IconButtonShape, type IconButtonTone } from './IconButton'
export { LineTabs, LineTabLink, LineTab } from './LineTabs'
export { FilterPills, type FilterPillsSize } from './FilterPills'
export { ProgressBar } from './ProgressBar'
export { FieldLabel, FieldHint, FormError, TextField, TextArea, SelectField, Segmented, type DataAttributes } from './Field'
export { FIELD_HEIGHT, FIELD_FILL, FIELD_CLASS, fieldControlStyle, controlStyle, selectControlStyle, type FieldSize, type FieldFill } from './fieldChrome'
export { Checkbox, type CheckboxProps } from './Checkbox'
export { Switch, type SwitchProps } from './Switch'
export {
  SlidingSegmentedControl,
  type SlidingSegmentLayout,
  type SlidingSegmentOption,
  type SlidingSegmentVariant,
  type SlidingSegmentSize,
} from './SlidingSegmentedControl'
export { TickBadge } from './TickBadge'
export { TickButton } from './TickButton'
export { SuccessOverlay } from './SuccessOverlay'
export { DockSpacer } from './DockSpacer'
export { NameSearchBox, type NameSearchBoxProps } from './NameSearchBox'
export { Pill, PILL_TONES, type PillTone, type PillSize, type PillVariant } from './Pill'
export { usePopover, type Popover } from './usePopover'
export { PopoverPanel, type PopoverPanelProps } from './PopoverPanel'
export { DoneStep, type DoneStepProps } from './DoneStep'
export { InlineConfirm, type InlineConfirmProps } from './InlineConfirm'
// UI unification U3: the passive vocabulary.
export { CountBadge, type CountBadgeTone } from './CountBadge'
export { visuallyHidden } from './visuallyHidden'
export { Notice, type NoticeTone, type NoticeProps } from './Notice'
export { ResultLine } from './ResultLine'
export { EmptyState, type EmptyStateVariant } from './EmptyState'
// UI unification U4: date and time parts.
export { DateJumpInput, FilterDateInput, TimeRangeFields, acceptedJumpDate, type DateJumpInputProps, type FilterDateInputProps, type TimeRange, type TimeRangeFieldsProps, type ToolbarHeight } from './DateFields'
export { useRovingRadio } from './useRovingRadio'
// UI unification U6: page chrome.
export { Eyebrow, type EyebrowTone } from './Eyebrow'
export { Card, type CardPadding, type CardElevation } from './Card'
export { PageHeader, type PageHeaderSize } from './PageHeader'
export { StatTile, type StatTileVariant } from './StatTile'
export { DefList, DefRow, type DefRowLayout } from './DefRow'
export { DayChip } from './DayChip'
export { AddRowButton } from './AddRowButton'
// Catch-up Phase 33's review: option cards and pick-list rows.
export { RadioCard, type RadioCardProps, type RadioItemProps } from './RadioCard'
export { OptionRow, type OptionRowProps } from './OptionRow'
// Catch-up Phase 39: the quick option chip (the credit's reasons).
export { OptionChip, type OptionChipProps } from './OptionChip'
