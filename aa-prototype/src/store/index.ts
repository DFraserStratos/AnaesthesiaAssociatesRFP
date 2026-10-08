/**
 * Store layer — the one Zustand store over the seeded mock backend, the
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
  resilientLocalStorage,
  flushPersist,
  persistStatus,
  STORAGE_BUDGET_BYTES,
  // `bytes` is unambiguous inside its own module; the barrel gives it a name
  // that still reads clearly at a call site in a component.
  bytes as persistedBytes,
} from './persistStorage'
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
  completeBooking,
  uncompleteBooking,
  completionBlockersFor,
  submitList,
  authoriseList,
  logListNote,
  cancelBooking,
  editBooking,
  editProcedure,
  reassignList,
  reassignBooking,
  setAvailability,
  requestCover,
  editList,
  editRefusal,
  getBooking,
  type CompletionBlocker,
  type BookingPatch,
  type ProcedurePatch,
  type ListPatch,
} from './lifecycle'
export {
  upsertPatient,
  editPatient,
  type PatientIntakeDetails,
  type IntakeResult,
  type PatientEditPatch,
} from './intake'
export {
  createBooking,
  copyBooking,
  addProcedure,
  removeProcedure,
  addPostOpAddendum,
  type CreateBookingInput,
} from './bookingActions'
export { raisePreProcedureInvoice } from './prepaymentActions'
export {
  warningFactsFor,
  warningsForBooking,
  warningsForList,
  openWarnings,
  warningSummaryByList,
  clearWarning,
  type WarningState,
  type OpenWarningRow,
  type ListWarningSummary,
} from './warnings'
export { addAttachment, removeAttachment, type AttachmentFile, type AttachmentTarget } from './attachmentActions'
export {
  addBillingLine,
  removeBillingLine,
  setBillingLineAllocation,
  setProcedureFunderAllocation,
  type AddBillingLineInput,
  type BillingLineAllocationPatch,
  type FunderAllocationEntry,
} from './billingLineActions'
export { createBillableParty, type BillablePartyDetails } from './billablePartyActions'
export { addDayNote, initialsFor } from './dayNoteActions'
export {
  createHospital,
  setInsurerDirectClaims,
  editAnaesthetist,
  addAnaesthetist,
  addHospitalHoliday,
  addPermanentList,
  editPermanentList,
  type AnaesthetistPatch,
  type NewAnaesthetistFields,
  type NewPermanentListFields,
  type PermanentListPatch,
} from './mastersActions'
export {
  createContract,
  editContract,
  deleteContract,
  addContractPrice,
  editContractPrice,
  type ContractInput,
  type ContractEditPatch,
  type ContractPriceInput,
  type ContractPricePatch,
} from './contractActions'
export {
  runBillingForList,
  retryBillingCase,
  markInvoiceEmailed,
  wireBillingRun,
  handoffListCases,
  type BillingRunResult,
  type BillingRunException,
} from './billingRun'
export { handoffCase, handoffCasesForBooking, type HandoffResult } from './xeroHandoff'
export { setArchiveWindowDays, armHandoffFault } from './demoSettingsActions'
export { OFFICE_ACTOR, SOUTER_ACTOR, OFFICE_SIMULATION_ACTOR, DEMO_TRIGGER_ACTOR, OFFICE_ACCOUNT_ID } from './demoActors'
export {
  WARNING_SAMPLES,
  WARNING_RULE_COUNT,
  hasStagedSample,
  stagedSampleBookings,
  sampleRaiseRefusal,
  daySampleRaiseRefusal,
  sampleClearRefusal,
  allSampleClearRefusal,
  raiseSamplesOn,
  clearSamplesOn,
  raiseDaySamples,
  clearAllSamples,
  type WarningSample,
} from './warningSamples'
export { authoriseAsSimulatedOffice, officeStandInRefusal } from './officeStandIn'
export { simulateSignInAttempts } from './authDemoActions'
export { receivePayment, gstComponentOf, proRataAuthorised, type ReceivePaymentInput } from './paymentActions'
export { wireReconciliationPoll, runReconciliationPoll } from './reconciliationPoll'
export {
  runPayables,
  disbursePayable,
  payablesDue,
  type PayablesRunResult,
  type PayablesDue,
} from './payablesActions'
export { runArchiveJob, eligibleArchiveContactIds, wireArchiveJob, type ArchiveJobResult } from './archiveActions'
export {
  advanceClockMinutes,
  advanceClockDays,
  advanceClockToNextMorning,
  advanceClockToDate,
  resetDemo,
} from './clockActions'
export {
  processMessage,
  retryMessage,
  reprocessMessage,
  setFeedMapping,
  correctEthnicityCode,
  ingestPdfRow,
  wireIntegrationRetry,
  MAX_ATTEMPTS,
} from './integrationActions'
export { onAppEvent, emitAppEvent, type AppEvent } from './events'
export * from './selectors'
