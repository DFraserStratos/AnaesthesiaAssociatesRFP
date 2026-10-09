/**
 * Admin-only pairing pieces (catch-up Phase 17). Never import these into a
 * mobile, web, PWA or shared surface: `src/apps/officePrivacy.test.ts` fails.
 */
export { SurgeonPicker } from './SurgeonPicker'
export { AnaesthetistCandidates } from './AnaesthetistCandidates'
export { NotPreferredWarning } from './NotPreferredWarning'
export { TierPill, PreferredPill, NotPreferredPill } from './Pills'
export { useNotPreferredWarning, usePairingEntries, usePriorityTiers, useProfileHistory, useSuggestionKey } from './useOfficePairings'
export { PairingSection } from './PairingSection'
export { pairingSubject, type PairingPerspective } from './perspective'
export { PairingAddSheet } from './PairingAddSheet'
export { PairingEndSheet } from './PairingEndSheet'
