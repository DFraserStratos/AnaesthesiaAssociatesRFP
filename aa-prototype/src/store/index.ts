/**
 * Store layer — the one Zustand store over the seeded fake backend, the
 * audit-writing mutation wrapper, the lifecycle guards, patient intake, the
 * master-data invariants and the live demo clock (Phase 02).
 */

export {
  useAppStore,
  createAppStore,
  freshAppState,
  PERSIST_KEY,
  PERSIST_VERSION,
  type AppState,
  type AppStore,
  type AppStoreApi,
  type BoundAppStore,
} from './appStore'
export {
  mutate,
  resetDomainState,
  allocateId,
  clockISO,
  ok,
  refuse,
  type Actor,
  type Outcome,
  type MutationMeta,
  type DomainPatch,
} from './mutate'
export {
  completeCard,
  uncompleteCard,
  completionBlockersFor,
  submitList,
  authoriseList,
  cancelCard,
  editCard,
  editProcedure,
  reassignList,
  reassignCard,
  setAvailability,
  requestCover,
  editRefusal,
  getCard,
  type CompletionBlocker,
  type CardPatch,
  type ProcedurePatch,
} from './lifecycle'
export {
  upsertPatient,
  editPatient,
  type PatientIntakeDetails,
  type IntakeResult,
  type PatientEditPatch,
} from './intake'
export { createCard, copyCard, addProcedure, type CreateCardInput } from './cardActions'
export { addBillingLine, removeBillingLine, type AddBillingLineInput } from './billingLineActions'
export { createHospital, setInsurerDirectClaims } from './mastersActions'
export { advanceClockMinutes, advanceClockDays, resetDemo } from './clockActions'
export { onAppEvent, emitAppEvent, type AppEvent } from './events'
export * from './selectors'
