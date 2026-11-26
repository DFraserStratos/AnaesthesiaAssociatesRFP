/** The surface seam (Phase 05): one shared body, two platform containers. */
export { BottomSheet } from './BottomSheet'
export { Dialog } from './Dialog'
export { SurfaceProvider } from './SurfaceProvider'
export { useModalLayer, MODAL_SCOPE_ATTR, type ModalLayerOptions, type ModalLayerKind } from './useModalLayer'
export { OverlayHeader, type OverlayHeaderProps } from './OverlayHeader'
export { SheetActions, type SheetActionsProps } from './SheetActions'
export { ConfirmSheet, type ConfirmSheetProps } from './ConfirmSheet'
export { SidePanel, SIDE_PANEL_WIDTH, type SidePanelProps, type SidePanelAttrs } from './SidePanel'
export { DecisionColumn, DecisionHeading, type DecisionColumnProps, type DecisionFooter } from './DecisionColumn'
export {
  useSurface,
  type Surface,
  type SurfaceVariant,
  type OverlayProps,
  type FooterProps,
  type BookingLayoutSlots,
  type BookingTotalLine,
  type BookingTotalProps,
} from './context'
