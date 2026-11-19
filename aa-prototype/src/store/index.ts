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
  copyStateIntoDraft,
  onDomainReset,
  withChangeSet,
  type Actor,
  type Outcome,
  type MutationMeta,
  type DomainPatch,
  type MutateOptions,
  type MutateResult,
} from './mutate'
export {
  completeBooking,
  uncompleteBooking,
  completionBlockersFor,
  submitList,
  authoriseList,
  authoriseBlockersFor,
  type AuthoriseBlocker,
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
  type MarkUnavailableOptions,
} from './listMoveActions'
// Alert the office about a List or a Booking (catch-up Phase 32b; US-03.6.3).
export { alertOffice, officeAlertRefusal, officeResolvesAlert, officeResolvesAlertRefusal, OFFICE_ALERT_NOTE_MAX, type OfficeAlertInput } from './officeAlertActions'
// An anaesthetist moves a single Booking to a colleague (catch-up Phase 32a).
export { moveBookingToAnaesthetist, type BookingMoveOptions, type BookingMoveResult } from './listMoveActions'
export {
  colleagueMoveCandidates,
  colleagueMoveRefusal,
  stageColleagueMoveToOffice,
  stageBusyMorning,
  moveToPersonaCandidate,
  moveToPersonaRefusal,
  stageColleagueMoveToPersona,
  bookingMoveCandidates,
  bookingMoveCandidateRefusal,
  stageColleagueBookingMove,
  makeAvailableRefusal,
  makeSessionAvailableAsColleague,
  closedColleagueSessions,
  type BookingMoveCandidate,
  BUSY_MORNING_MOVES,
  LIST_MOVE_DEMO_PERSONA,
} from './listMoveDemo'
export { closedEmptyColleagueSlots } from './selectors'
export {
  notificationPool,
  latestNotifications,
  activeNotificationCount,
  resolveNotification,
  activeAlertFor,
  latestAlertFor,
  latestNotificationForList,
  movedToMe,
  movedToMeForList,
  bookingsMovedToMe,
  bookingMovedToMe,
  bookingMoveEntries,
  bookingMoveFor,
  bookingMovesOntoList,
  type BookingMove,
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
  PATIENT_NHI_REQUIRED_MESSAGE,
  PATIENT_NHI_OFFICE_ONLY_MESSAGE,
  type PatientIntakeDetails,
  type IntakeResult,
  type PatientEditPatch,
} from './intake'
export {
  createBooking,
  addProcedure,
  removeProcedure,
  addPostOpAddendum,
  setPrimaryProcedure,
  PRIMARY_NOT_REMOVABLE_MESSAGE,
  PRIMARY_COMPLETED_MESSAGE,
  type CreateBookingInput,
} from './bookingActions'
export {
  approvePrepayment,
  autoSendPrepayments,
  readyPendingPrepaymentCount,
  setPrepaymentApprovalRequired,
  PREPAYMENT_ALREADY_SENT,
  PREPAYMENT_NOT_NEEDED,
  PREPAYMENT_PAYER_CONTACT,
} from './prepaymentActions'
export * from './prepaymentSelectors'
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
export {
  applyDefaultInvoiceDescription,
  INVOICE_DESCRIPTION_BLANK_MESSAGE,
  PROCEDURE_TEXT_BLANK_MESSAGE,
  replaceProcedureText,
  setInvoiceDescription,
} from './procedureTextActions'
export {
  addBillingLine,
  removeBillingLine,
  type AddBillingLineInput,
} from './billingLineActions'
export {
  NO_FEE_TO_SPLIT_MESSAGE,
  PREPAID_PROCEDURE_MESSAGE,
  contractPartyFor,
  partyOptionsForProcedure,
  procedureFeeNow,
  setProcedureSplit,
  type FeeSplitInput,
  type SplitPersonInput,
  type SplitShareInput,
} from './splitActions'
export { savePaidBy, type PaidByChange } from './paidByActions'
export { addDayNote, initialsFor } from './dayNoteActions'
export {
  createHospital,
  editHospital,
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
  BANK_ACCOUNT_INVALID,
  UNIT_VALUE_INVALID,
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
  createSurgeonGroup,
  editSurgeonGroup,
  type SurgeonFields,
  type SurgeonGroupFields,
} from './surgeonActions'
export { createParty, editParty, partyContractFacts, type PartyFields } from './partyActions'
// Catch-up Phase 18a: AA's specialties and funding tags (Admin Master data).
export { createSpecialty, renameSpecialty, removeSpecialty } from './specialtyActions'
export { createRvgGroup, editRvgGroup, retireRvgGroup, restoreRvgGroup, pickRvgGroup } from './rvgGroupActions'
// Catch-up Phase 19b: modifiers claimed with an explanation, pre-applied ones removed and put back, AA's own added.
export {
  claimModifier,
  confirmNoModifiers,
  editModifierExplanation,
  removeModifier,
  restoreModifier,
  addAaModifier,
  type ClaimInput,
  type AaModifierInput,
} from './modifierActions'
export { modifierFactsFor } from './modifierFacts'
export { MODIFIERS_THROUGH_ACTIONS_MESSAGE } from './lifecycle'
export { createFundingTag, editFundingTag, moveFundingTagInList, removeFundingTag, type FundingTagFields } from './fundingTagActions'
export {
  createContract,
  editContract,
  disableContract,
  enableContract,
  addPriceRange,
  editPriceRange,
  deletePriceRange,
  type ContractInput,
  type ContractEditPatch,
} from './contractActions'
export {
  runBillingForList,
  retryBillingException,
  resendInvoice,
  wireBillingRun,
  type BillingRunResult,
  type BillingRunException,
} from './billingRun'
export { handoffPair, handoffPairsForBooking, handoffListPairs, type HandoffResult } from './xeroHandoff'
export { createXeroPair } from './xeroHandoff'
// The internal ledger (catch-up Phase 36): its reads and the office's actions on unmatched receipts.
export * from './ledgerSelectors'
export { allocateUnmatchedReceipt, allocationRefusal, markUnmatchedRefunded, OVER_ALLOCATION } from './ledgerActions'
export { recordUnmatchedReceipt, type UnmatchedReceiptInput } from './paymentActions'
// The AA Holding account's transfer and its Xero journal (catch-up Phase 27a).
export { postTransferJournal } from './xeroHandoff'
export { settlePrepaymentsForList, transfersDueForList } from './prepaymentSettlement'
export { setArchiveWindowDays, armHandoffFault } from './demoSettingsActions'
export { anaesthetistActor, OFFICE_ACTOR, SECOND_OFFICE_ACTOR, OFFICE_USERS, officeActorOf, otherOfficeUser, SOUTER_ACTOR, OFFICE_SIMULATION_ACTOR, DEMO_TRIGGER_ACTOR, DEMO_OFFICE_ACTOR, OFFICE_ACCOUNT_ID, type OfficeUserId } from './demoActors'
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
  clearSamplesFor,
  sampleBookingsFor,
  sampleTarget,
  skippedSampleNotes,
  raiseDaySamples,
  clearAllSamples,
  type WarningSample,
} from './warningSamples'
export { openOutOfHoursSession, closeOutOfHoursSession, closeOutOfHoursRefusal } from './outOfHoursActions'
export {
  addOutOfHoursListAsSimulatedOffice,
  outOfHoursStandInRefusal,
  assignDraftListAsSimulatedOffice,
  assignNextFreeSlotAsSimulatedOffice,
  authoriseAsSimulatedOffice,
  nextOpenSlotFor,
  officeStandInRefusal,
  STAND_IN_INCOMPLETE,
  STAND_IN_ASSIGN_CHOICES,
  approvePrepaymentAsSimulatedOffice,
  prepaymentApprovalChoices,
  prepaymentStandInRefusal,
  OFFICE_PUBLIC_NOTE,
  officeSetsPublicRefusal,
  setSessionPublicAsSimulatedOffice,
} from './officeStandIn'
export {
  addPrepaidBooking,
  addPrepaidBookingRefusal,
  moveToTwoDaysBefore,
  nextPrepaidSouterList,
  outstandingPrepaymentBookings,
  PREPAID_DEMO,
  prepaymentAccRecChoices,
  prepaymentPaymentRefusal,
  twoDaysBeforeRefusal,
  type AddPrepaidMode,
} from './prepaymentDemo'
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
export { wireReconciliationPoll, runReconciliationPoll, type PollResult } from './reconciliationPoll'
// Xero mirror resilience (catch-up Phase 37; EP-09, US-09.2.4): the gate, the sync queue, detection, divergence, and the Xero side.
export { deliverPaymentWebhook, xeroBalanceOf, XERO_SIDE_ACTOR, type PaymentWebhookInput } from './paymentActions'
export { xeroAvailable, gateFor, XERO_OUTAGE_ERROR, XERO_FAULT_ERROR, XERO_QUEUE_ACTOR } from './xeroGate'
export { setXeroOutage, processXeroQueue, retryXeroItemNow, wireXeroQueue, type ProcessResult } from './xeroQueue'
export { recordDisbursement, disbursementKeySeen, DETECTION_ACTOR, type RecordDisbursementInput } from './disbursementDetection'
export { flagXeroDivergences, resolveXeroDivergence, DIVERGENCE_OUTCOMES } from './xeroDivergenceActions'
export {
  payBillsInXero,
  xeroBillPayable,
  voidAccRecInXero,
  voidInXeroRefusal,
  amendAccRecInXero,
  amendInXeroRefusal,
  XERO_DEMO_AMENDMENT,
  XERO_PAYABLES_ACTOR,
  XERO_STAFF_ACTOR,
  XERO_REMITTANCE_ACTOR,
  bulkRemittanceRefusal,
  receiveBulkRemittance,
  bankLineMatchRefusal,
  matchBankLineInXero,
  type BulkRemittanceResult,
  type XeroBill,
  type BillPaid,
  type PayBillsResult,
} from './xeroSimActions'
export * from './reconciliationSelectors'
export * from './billingMonitorView'
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
  payableLegsDue,
  type DueLeg,
  type PayablesRunResult,
  type PayablesDue,
} from './payablesActions'
export { runArchiveJob, eligibleArchiveContactIds, wireArchiveJob, ARCHIVE_SKIPPED_OUTAGE, type ArchiveJobResult } from './archiveActions'
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
  wireIntegrationRetry,
  MAX_ATTEMPTS,
} from './integrationActions'
export { onAppEvent, emitAppEvent, type AppEvent } from './events'
export * from './selectors'
// Catch-up Phase 38a: the edit window's completeness check, the main view, the
// "Changed since submitted" cue, look-back and search (selectors only).
export { incompleteBookingsOn } from './lifecycle'
export {
  approveContractChangeAsSimulatedOffice,
  approveContractChangesOnList,
  approveContractRefusal,
  approveContractSelection,
  contractChangeFor,
  pendingContractChangesOnList,
} from './contractApprovalActions'
export {
  stageMultiProcedureBooking,
  multiProcedureLoadRefusal,
  nextOpenSouterList,
  feedChangesPrimary,
  feedChangesPrimaryRefusal,
  nextPrimaryFor,
} from './demoMultiProcedure'
export { reviewFlagsFor, reviewFlagsOnList, reviewInputFor } from './reviewSelectors'
// The Contract change warnings' lists (catch-up Phase 25a).
export { keptPriceForRange, stillOnContract } from './contractChangeSelectors'
export * from './lookback'

// The step rail's writes and reads (catch-up Phase 20).
export { contractPickRefusal, railActorOf, setProcedureContract, setRailAnswers } from './contractSelectionActions'
export { BACKDATED_RANGE, BACKDATED_RANGE_CONTRACT_ID, addBackdatedRangeDemo, backdatedRangeAdded } from './demoBackdatedRange'
export { anaesthetistPriceRightFor, priceChangeRefusal, setProcedurePrice } from './pricingActions'
export { CHOOSE_INSURER_OR_FUNDER, setBookingInsurance, type InsuranceInput } from './insuranceActions'
export { PAYER_LOCKED_BY_PREPAYMENT, PAYER_NAME_REQUIRED, payerAuditText, payerFromInput, payerInputRefusal, sameName, setProcedurePayer, type PayerInput } from './payerActions'
export {
  billablePartyForProcedureId,
  contractRailForNewBooking,
  contractRailForProcedure,
  needsInvoiceDestinationBookings,
  railContextForList,
  railContextForProcedure,
  railMastersOf,
  railStartFor,
  rvgCodeToFillFor,
  completionContextFor,
  type NeedsInvoiceDestinationRow,
} from './selectors'
export * from './locks'
export { stageBillingFailure, BILLING_FAILURE_ALREADY } from './demoStaging'
// Catch-up Phase 33: the matching screen (intake rows, the office's decision, its selectors).
// `stageImportRows` is the one place rows enter; it stays internal to the store.
export {
  correctImportRow,
  decideImportRow,
  importHospitalDownload,
  INVALID_NHI_MESSAGE,
  LIST_LOCKED_MESSAGE,
  NHI_REQUIRED_MESSAGE,
  SURGEON_REQUIRED_MESSAGE,
  WORDING_KEPT_MESSAGE,
  WORDING_OR_CODE_MESSAGE,
  type DecisionInput,
} from './matchingActions'
// The rooms' PDF lists (catch-up Phase 34; DM-61): upload, correct, send to matching; the re-send trigger's body.
export {
  correctPdfListRow,
  INVALID_NHI_SEND_MESSAGE,
  receiveResentPdfList,
  resendRefusal,
  sendPdfListToMatching,
  SENDER_REQUIRED_MESSAGE,
  uploadPdfList,
  type PdfRowPatch,
} from './pdfListActions'
export {
  assessImportRow,
  importRowViews,
  matchingAttentionCount,
  matchingCounts,
  matchingView,
  rowStackViews,
  type ImportRowView,
  type MatchingFilter,
} from './matchingSelectors'
// Catch-up Phase 33a: stubs on a List (never Bookings) and the office's one resolve path.
export { resolveStub, type ResolveStubInput, type ResolveStubResult } from './stubActions'
export { resolvedStubForRow, standingStubCount, standingStubCountsByList, stubForRow, stubsForList, useListStubs, useStubCountsByList } from './stubSelectors'
// Catch-up Phase 33a: the PWA office stand-in that adds the NHI to a List's stub.
export { fixtureNhiForRow, officeAddsNhiRefusal, officeAddsNhiToStub } from './stubDemo'
// Catch-up Phase 33: the matching screen's demo trigger bodies (bar entries and the PWA office stand-in).
export {
  officeMatchesHospitalRow,
  officeImportsS1File,
  receiveTheatreList,
  sendUpdateRefusal,
  stageUpdateForBooking,
  standInRefusal,
  theatreListRefusal,
  updateTarget,
  type StandInChoice,
} from './matchingDemo'
// Catch-up Phase 35: the office's explicit save, one change set per save (US-02.3.2, DM-35).
export {
  SAVE_NHI_REQUIRED_MESSAGE,
  RECEIVED_TEXT_MESSAGE,
  SAVE_NO_CHANGES_MESSAGE,
  SAVE_OFFICE_ONLY_MESSAGE,
  saveBookingChanges,
  saveBookingPatch,
  type BookingDraftChanges,
  type FieldRef,
} from './bookingSaveActions'
export { isDraftStore, markDraftStore } from './draftMode'
// Catch-up Phase 35: the update email templates and the drafted-email record (US-02.3.3, US-02.3.4).
export {
  addEmailTemplate,
  recordUpdateEmailDrafted,
  saveEmailTemplate,
  setEmailTemplateActive,
  type EmailTemplateFields,
  type UpdateEmailDraftRecord,
} from './emailTemplateActions'
export { changeSetEntries, lastChangeSetFor, type ChangeSetSummary } from './changeSetSelectors'
// Catch-up Phase 35: the PWA's office stand-in for an office save.
export { officeEditsBooking, officeEditsBookingRefusal } from './officeSaveDemo'
