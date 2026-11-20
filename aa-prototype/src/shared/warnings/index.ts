/** Shared warning UI (catch-up Phase 15a; US-13.7.2, US-13.7.3). Reads the store through hooks; owns no domain state. */
export { useBookingWarnings, useListWarnings, strongestOpen } from './useBookingWarnings'
export { WarningTriangle } from './WarningTriangle'
export { AttentionDot, attentionGlyphSize, type AttentionTone } from './AttentionDot'
export { WarningsPanel, ClearWarningButton, clearanceWhen } from './WarningsPanel'
export { warningTone, warningPillTone, KIND_LABELS, STRENGTH_LABELS } from './tone'
export { WarningPreviewRow } from './WarningPreviewRow'
export { StrengthPill } from './StrengthPill'
export { warningsFor, OFFICE_ONLY_WARNING_RULES } from './useBookingWarnings'
