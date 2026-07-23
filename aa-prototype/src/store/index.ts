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
  logListNote,
  cancelCard,
  editCard,
  editProcedure,
  reassignList,
  reassignCard,
  setAvailability,
  requestCover,
  editList,
  editRefusal,
  getCard,
  type CompletionBlocker,
  type CardPatch,
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
export { createCard, copyCard, addProcedure, addPostOpAddendum, type CreateCardInput } from './cardActions'
export { raisePreProcedureInvoice, overridePrepaymentGate } from './prepaymentActions'
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
export { handoffCase, handoffCasesForCard, type HandoffResult } from './xeroHandoff'
export { setArchiveWindowDays, armHandoffFault } from './demoSettingsActions'
export { receivePayment, gstComponentOf, proRataAuthorised, type ReceivePaymentInput } from './paymentActions'
export { wireReconciliationPoll, runReconciliationPoll } from './reconciliationPoll'
export { runPayables, payablesDue, type PayablesRunResult, type PayablesDue } from './payablesActions'
export { runArchiveJob, eligibleArchiveContactIds, wireArchiveJob, type ArchiveJobResult } from './archiveActions'
export { advanceClockMinutes, advanceClockDays, resetDemo } from './clockActions'
export { onAppEvent, emitAppEvent, type AppEvent } from './events'
export * from './selectors'
