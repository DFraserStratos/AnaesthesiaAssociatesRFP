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
  reassignBooking,
  editList,
  editRefusal,
  getBooking,
  type CompletionBlocker,
  type BookingPatch,
  type ProcedurePatch,
  type ListPatch,
} from './lifecycle'
// Slots and Lists (catch-up Phase 28). `placeListOnSlot`, `moveListToSlot` and
// the generation helpers stay internal to the store.
export {
  assignListToSlot,
  reassignList,
  setAvailability,
  setSlotTimes,
  setSlotDefaultTimes,
  setHorizonMonths,
  previewHorizonChange,
  HORIZON_MONTHS_MIN,
  HORIZON_MONTHS_MAX,
  type AssignListFields,
  type SlotTimesPatch,
  type HorizonChangePreview,
} from './slotActions'
// Draft Lists (catch-up Phase 31). `insertDraftList`, `attachListToSlot` and
// `detachListToDraft` stay internal (slotActions.ts); Phase 32 imports the last directly.
export {
  createDraftList,
  assignDraftList,
  redateDraftList,
  removeDraftList,
  draftListFitsAnaesthetist,
  surgeonFitsAnaesthetist,
  type NewDraftListInput,
  type AssignDraftListResult,
} from './draftListActions'
// An anaesthetist moves her own List, and the shared notification pool
// (catch-up Phase 32). `postNotification` stays internal: the moves are its only callers.
export {
  moveListToOffice,
  pushListToSlot,
  markUnavailableAndMoveList,
  type OwnMoveResult,
  type OwnMoveInput,
  type UnavailableChoice,
} from './listMoveActions'
export {
  colleagueMoveCandidates,
  colleagueMoveRefusal,
  stageColleagueMoveToOffice,
  stageBusyMorning,
  moveToPersonaCandidate,
  moveToPersonaRefusal,
  stageColleagueMoveToPersona,
  BUSY_MORNING_MOVES,
  LIST_MOVE_DEMO_PERSONA,
} from './listMoveDemo'
export {
  notificationPool,
  latestNotifications,
  latestNotificationForList,
  movedToMe,
  movedToMeForList,
  type NotificationRow,
  type NotificationTarget,
  type PoolState,
} from './notifications'
// Availability: days off, repeating days off and the status master (catch-up Phase 29).
export {
  setAvailabilityRange,
  clearAvailability,
  createAvailabilitySeries,
  deleteAvailabilitySeries,
  type AvailabilityOutcome,
  type AvailabilityRangeInput,
} from './availabilityActions'
export {
  addSlotStatus,
  editSlotStatus,
  retireSlotStatus,
  restoreSlotStatus,
  reorderSlotStatus,
  futureSessionsWithStatus,
} from './slotStatusActions'
export {
  upsertPatient,
  editPatient,
  type PatientIntakeDetails,
  type IntakeResult,
  type PatientEditPatch,
} from './intake'
export {
  createBooking,
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
  editHospital,
  setInsurerDirectClaims,
  editAnaesthetist,
  addAnaesthetist,
  addHospitalHoliday,
  editHospitalHoliday,
  deleteHospitalHoliday,
  listsFlaggedByHoliday,
  addRecurringBooking,
  editRecurringBooking,
  retireRecurringBooking,
  applyRecurringBookingsToCanvas,
  type AnaesthetistPatch,
  type HospitalPatch,
  type NewAnaesthetistFields,
  type NewRecurringBookingFields,
  type RecurringBookingApplyResult,
  type RecurringBookingPatch,
} from './mastersActions'
// Conflicts (catch-up Phase 30): the office clear and "Flag again"; raising and
// resolving is the reconcile inside mutate().
export { clearListConflict, restoreListConflict } from './conflictActions'
export { conflictLookups, type MutationResult } from './conflictReconcile'
// Surgeon master data (catch-up Phase 17). The office-private pairing and tier
// actions are NOT here: Admin imports `./officePrivate` by path, so the PWA,
// which imports this barrel, never reaches them (officePrivacy.test.ts).
export {
  createSurgeon,
  editSurgeon,
  createSurgeonRoom,
  editSurgeonRoom,
  createSurgeonGroup,
  editSurgeonGroup,
  type SurgeonFields,
  type SurgeonRoomFields,
  type SurgeonGroupFields,
} from './surgeonActions'
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
export { anaesthetistActor, OFFICE_ACTOR, SOUTER_ACTOR, OFFICE_SIMULATION_ACTOR, DEMO_TRIGGER_ACTOR, OFFICE_ACCOUNT_ID } from './demoActors'
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
export {
  assignDraftListAsSimulatedOffice,
  assignNextFreeSlotAsSimulatedOffice,
  authoriseAsSimulatedOffice,
  nextOpenSlotFor,
  officeStandInRefusal,
  STAND_IN_ASSIGN_CHOICES,
} from './officeStandIn'
export {
  simulateIncomingDraftListRequest,
  incomingRequestRefusal,
  cannedRequestDay,
  addDraftListForDay,
  dayDraftListRefusal,
  stageRecurringClash,
  stageableRecurringBookings,
  stagedAlready,
  firstUnpaintedDay,
  STAGED_CLASH_NOTE,
} from './draftListDemo'
export { simulateSignInAttempts } from './authDemoActions'
export { receivePayment, gstComponentOf, type ReceivePaymentInput } from './paymentActions'
export { wireReconciliationPoll, runReconciliationPoll } from './reconciliationPoll'
export {
  saveAaFeeSettings,
  runMonthlyFeeInvoices,
  raiseAnaesthetistInvoiceInto,
  recordAaFeePayment,
  aaFeeRunDisabledReason,
  aaFeePaymentDisabledReason,
  AA_FEE_RUN_ACTOR,
  AA_FEE_PAYMENT_ACTOR,
  type MonthlyFeeRunResult,
  type AnaesthetistInvoiceDraft,
} from './aaFeeActions'
export { seedMonthOfBctis, seedBctisDisabledReason, BCTI_SEED_MONTH, BCTI_SEED_TARGET } from './demoBctiSeed'
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
