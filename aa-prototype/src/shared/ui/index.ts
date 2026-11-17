/** Shared UI primitives (moved from mobile in Phase 05; identical on both apps). */
export { Button } from './Button'
export { FieldLabel, FieldHint, FormError, TextField, TextArea, SelectField, Segmented, type DataAttributes } from './Field'
export { FIELD_HEIGHT, FIELD_FILL, FIELD_CLASS, fieldControlStyle, controlStyle, selectControlStyle, type FieldSize, type FieldFill } from './fieldChrome'
export { Checkbox, type CheckboxProps } from './Checkbox'
export { Switch, type SwitchProps } from './Switch'
export {
  SlidingSegmentedControl,
  type SlidingSegmentLayout,
  type SlidingSegmentOption,
  type SlidingSegmentVariant,
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
