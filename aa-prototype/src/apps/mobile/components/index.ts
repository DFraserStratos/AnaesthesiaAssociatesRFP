/**
 * Mobile component barrel. Phase 05 moved the load-bearing primitives to
 * `src/shared/` (so the web app reuses them, not forks them); this barrel
 * re-exports them under their mobile names so existing mobile imports are
 * unchanged. `Button` is re-exported as `MobileButton` (its mobile name).
 * `SlideStack` and `MobileHeader` stay mobile-only (phone-frame chrome).
 */
export { BottomSheet } from '../../../shared/surface'
export { Button as MobileButton, TickBadge, FieldLabel, TextField, TextArea, Segmented } from '../../../shared/ui'
export { ListRow, type ListRowRight } from '../../../shared/schedule'
export { SlideStack, type SlideLayer } from './SlideStack'
export { MobileHeader } from './MobileHeader'
