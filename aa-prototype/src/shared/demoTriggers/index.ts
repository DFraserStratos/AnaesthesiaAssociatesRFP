/**
 * Screen-contextual demo triggers (catch-up Phase 14). Imported by path, like
 * `shared/demoClockShortcuts.ts`, and deliberately NOT re-exported from the
 * `src/shared/index.ts` component barrel: it pulls in the store and the seed,
 * which a screen importing a shared button should not.
 */
export type { DemoTrigger, DemoTriggerChoice, DemoTriggerCtx, DemoTriggerResult, DemoTriggerSurface } from './types'
export { BILLING_MONITOR_SCREEN, DEMO_TRIGGERS, POST_OP_ORIGINAL_LIST_ID, paymentDisabledReason, recordFeePaymentFor, sendPaymentWebhook } from './registry'
export { demoTriggersFor, groupTriggersByScreen, initialChoice, type MatchedDemoTrigger } from './match'
export { useDemoTriggers, useDemoTriggerRows, type DemoTriggerRow } from './useDemoTriggers'
export { DemoTriggerBadge } from './DemoTriggerBadge'
export { InlineDemoTrigger } from './InlineDemoTrigger'
export { useDemoTriggerMemory, type DemoTriggerMemory } from './memory'
export {
  useDemoTriggerContext,
  useDemoTriggerContextWhile,
  useDemoTriggerPublished,
  useDemoContextStore,
  type DemoContextKey,
  type DemoContextValues,
} from './context'
