/**
 * The simulated Digital Services Hub NHI lookup (catch-up Phase 40a). Its own
 * barrel, not re-exported from `src/shared/index.ts`; nothing here imports
 * from `src/apps` or `src/shell`, so the PWA closure stays pure.
 */
export type { NhiHubMode } from '../../domain/types'
export { askHub, HUB_TIMING, NHI_HUB_MODE_LABELS, type HubAnswer, type HubTiming } from './hub'
export { useNhiHubLookup, type NhiHubLookup, type NhiLookupState } from './useNhiHubLookup'
export { NhiLookupStatus, NHI_LOOKUP_COPY } from './NhiLookupStatus'
export { NhiPurposeNote, nhiPurposeText, usePurposePractitioner, AA_OFFICE, AA_OFFICE_PRACTITIONER, type PurposePractitioner } from './NhiPurposeNote'
