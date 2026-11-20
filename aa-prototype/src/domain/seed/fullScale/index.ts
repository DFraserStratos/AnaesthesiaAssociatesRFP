/**
 * The full-scale dataset (catch-up Phase 43; US-15.0.4): the whole practice,
 * built in memory from the seeded RNG on top of the untouched pristine seed.
 *
 * 85 anaesthetists (the 14 demo anaesthetists plus 71 generated), their
 * sessions across the scheduling horizon setting, and about 28,000 invoices
 * raised over the last 12 months, each with its Booking, lock (the pricing
 * snapshot), ledger pair and Xero mirror.
 *
 * ONE BILLING MODULE. Every Party, Contract, candidate, price, snapshot,
 * invoice, ledger pair and prepayment comes from `domain/billing` (and the
 * seed's own builders): the step rail's `contractCandidatesFor`, 25's
 * `buildBookingLock` and `invoiceDraftsFromLock`, the stored invoice of
 * `invoiceRecordFromDraft`, 36's `newBookingPair` / `applyReceipt` /
 * `applyDisbursement`, 27's `prepaymentGroupsFor` / `prepaymentInvoiceDraftFor`,
 * 27a's `newPrepayTransfer`, 16's `buildAaFeeInvoice` and `bctisFor`, 18's and
 * 18a's validators and backstops. The generator declares no shape and no rule
 * of its own, so a change to the model is a contained edit there
 * (`fullScale.test.ts` scans this folder's imports).
 *
 * DETERMINISTIC. Randomness comes only from `slotRng` streams keyed off `SEED`;
 * time only from the demo day the caller passes. No record of the pristine seed
 * is changed; every id comes from the counters, returned advanced, and invoice
 * numbers use the reserved `AA-S-` series.
 *
 * Not re-exported from `domain/seed/index.ts`: the store imports it
 * dynamically, so neither the main chunk nor the PWA carries it until used.
 */

import { parseISO } from 'date-fns'
import type {
  Anaesthetist,
  AuditEntry,
  BillingException,
  Booking,
  BookingLedgerPair,
  Disbursement,
  Hospital,
  Invoice,
  InvoiceLine,
  LedgerDisbursement,
  LedgerPair,
  LedgerReceipt,
  LedgerTransfer,
  List,
  Patient,
  PaymentIn,
  Procedure,
  ProcedurePayer,
  RecurringBooking,
  SeedLeaveWindow,
  Slot,
  Surgeon,
  XeroAccPay,
  XeroAccRec,
  XeroContact,
  XeroJournal,
  XeroVolumeStory,
  AaFeeInvoice,
  AaFeeSettings,
  ImportBatch,
  ImportRow,
  Stub,
} from '../../types'
import { stubFor } from '../../intake/stubs'
import { rawRowFor } from '../../intake/rawRow'
import type { AppSettings } from '../../warnings/types'
import type { BookingLock, InvoiceBuildContext } from '../../billing/lock'
import type { HeldPrices } from '../../billing/procedurePrice'
import { buildBookingLock, invoiceDraftsFromLock } from '../../billing/lock'
import type { Contract, PricingKind } from '../../billing/contracts'
import { contractRefusal, isRvgKind, noContractRvg } from '../../billing/contracts'
import type { Party } from '../../billing/parties'
import { partyRefusal } from '../../billing/parties'
import { ensureFallbacks } from '../../billing/fallbacks'
import { contractCandidatesFor, type RailMasters } from '../../billing/contractRail'
import { invoiceLineRecord, invoiceRecordFromDraft } from '../../billing/invoiceRecord'
import { anaesthetistPayee, applyDisbursement, applyReceipt, bctiRecordsOf, gstComponentOf, HOLDING_PAYEE, newBookingPair, newPrepayTransfer } from '../../billing/ledger'
import { buyerCreatedTaxInvoiceFor, deliveryStampFor, supplierFor } from '../../billing/invoicePresentation'
import { AA_HOLDING_ACCOUNT, prepaymentGroupsFor, prepaymentInvoiceDraftFor } from '../../billing/prepayment'
import { bookingFeesFor } from '../../billing/validateBookingForBilling'
import { aaFeeAccRecFor, buildAaFeeInvoice } from '../../billing/aaFee'
import { BCTI_COUNT_RULE, bctiFeeHistory, bctisFor } from '../../billing/bcti'
import { eligibleArchiveContactIdsOf } from '../../billing/contactArchive'
import { refKey } from '../../billing/procedurePayer'
import { partyForCounterparty, payerCounterparty } from '../../billing/whoIsBilled'
import { roundToCents } from '../../billing/money'
import { xeroIndividualContactName } from '../../xeroContact'
import { billingHospitalId } from '../../listPairing'
import { generateNhi, validateNhi } from '../../nhi'
import { addDaysISO, enumerateDatesISO, horizonFor } from '../../clock'
import { projectedListId, slotIdFor } from '../../slots'
import { SEED_STATUS } from '../../slotStatus'
import { originForNewList } from '../../lists/listOrigin'
import { seedBankAccountNumber } from '../../bankAccount'
import { nameWithoutTitle } from '../../names'
import { ETHNICITY_DEMO_SUBSET } from '../../nzhis'
import { generateCanvasForDates } from '../canvas'
import { seedRecurringClashDraftLists } from '../draftLists'
import { slotRng } from '../slotHash'
import { FIRST_NAMES, SURNAMES, withSeedContact } from '../patients'
import { HOSP } from '../cast'
import { SPC } from '../specialties'
import { EYE_CODES, GENERAL_CODES, LEGACY_CODE_TO_RVG_GROUP, RVG_GROUP } from '../rvgGroups'
import { seedText } from '../procedureText'
import { finaliseSeedProcedureTexts } from '../procedureText'
import { syntheticGstNumber } from '../cast'
import { FULL_SCALE } from './constants'

export { FULL_SCALE } from './constants'

/** The seed stream every draw keys off (the seed's own `SEED`). */
const FULL_SCALE_SEED = 20260721

// ---------------------------------------------------------------------------
// The state the generator reads and writes (structural: the store's AppState fits)
// ---------------------------------------------------------------------------

export interface FullScaleInput {
  masters: {
    anaesthetists: Record<string, Anaesthetist>
    surgeons: Record<string, Surgeon>
    hospitals: Record<string, Hospital>
    parties: Record<string, Party>
    contracts: Record<string, Contract>
    patients: Record<string, Patient>
    recurringBookings: Record<string, RecurringBooking>
    rvgGroups: RailMasters['rvgGroups']
    fundingTags: RailMasters['fundingTags']
    specialties: Record<string, { id: string; name: string }>
    modifiers: InvoiceBuildContext['modifiers']
    rvgTimeRule: InvoiceBuildContext['timeRule']
    slotStatuses: Parameters<typeof generateCanvasForDates>[0]['statuses']
  }
  schedule: {
    slots: Record<string, Slot>
    lists: Record<string, List>
    bookings: Record<string, Booking>
    procedures: Record<string, Procedure>
  }
  billing: {
    invoices: Record<string, Invoice>
    invoiceLines: Record<string, InvoiceLine>
    ledger: Record<string, LedgerPair>
    receipts: Record<string, LedgerReceipt>
    disbursements: Record<string, LedgerDisbursement>
    exceptions: Record<string, BillingException>
    contactIdCache: Record<string, string>
    aaFeeInvoices: Record<string, AaFeeInvoice>
    locks: Record<string, BookingLock>
    transfers: Record<string, LedgerTransfer>
  }
  xero: {
    contacts: Record<string, XeroContact>
    accRecs: Record<string, XeroAccRec>
    accPays: Record<string, XeroAccPay>
    payments: Record<string, PaymentIn>
    disbursements: Record<string, Disbursement>
    journals: Record<string, XeroJournal>
  }
  intake: {
    batches: Record<string, ImportBatch>
    rows: Record<string, ImportRow>
    stubs: Record<string, Stub>
  }
  audit: AuditEntry[]
  counters: Record<string, number>
  settings: { contactArchiveInactivityDays: number; volumeStory: XeroVolumeStory }
  appSettings: AppSettings
}

export interface FullScaleCounts {
  anaesthetists: number
  slotsInHorizon: number
  slotsTotal: number
  lists: number
  draftLists: number
  recurringBookings: number
  bookings: number
  procedures: number
  prepaidBookings: number
  patients: number
  invoices: number
  invoicesLast12Months: number
  aaFeeInvoices: number
  ledgerPairs: number
  xeroContacts: number
  activeContacts: number
  auditEntries: number
  stubs: number
  events: number
  publicSessions: number
  problemLists: number
}

export interface FullScaleDataset<S extends FullScaleInput> {
  state: S
  counts: FullScaleCounts
  /** The generated Lists carrying a processing-monitor problem (for the integrity test). */
  problemListIds: string[]
}

export interface FullScaleOptions {
  /** The demo day (`clock.todayISO`): history ends the day before, the horizon starts here. */
  todayISO: string
  /** Who authorised the generated Lists (the office). */
  officeWho?: string
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

type Rng = () => number

function pick<T>(rng: Rng, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)]
  if (item === undefined) throw new Error('pick from an empty pool')
  return item
}

function intBetween(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

function time(minutes: number): string {
  return `${pad(Math.floor(minutes / 60), 2)}:${pad(minutes % 60, 2)}`
}

/** One second after an ISO date-time (to the second). */
function latestAfter(iso: string): string {
  const [d, t] = iso.split('T') as [string, string]
  const [h, m, sec] = t.slice(0, 8).split(':').map(Number) as [number, number, number]
  const total = h * 3600 + m * 60 + (sec || 0) + 1
  if (total >= 86400) return `${d}T23:59:59`
  return `${d}T${pad(Math.floor(total / 3600), 2)}:${pad(Math.floor((total % 3600) / 60), 2)}:${pad(total % 60, 2)}`
}

function earlier(a: string, b: string): string {
  return a < b ? a : b
}

function dayOfWeek(dateISO: string): number {
  return parseISO(dateISO).getDay()
}

function isWeekday(dateISO: string): boolean {
  const d = dayOfWeek(dateISO)
  return d >= 1 && d <= 5
}

/** The ids the runtime allocates, from the counters (the formats mirror `store/mutate.ts`'s `ID_FORMATS`). */
const FORMATS: Record<string, { prefix: string; pad: number }> = {
  audit: { prefix: 'A', pad: 4 },
  booking: { prefix: 'BK', pad: 4 },
  procedure: { prefix: 'P', pad: 4 },
  patient: { prefix: 'PT', pad: 4 },
  billableParty: { prefix: 'BP', pad: 4 },
  invoice: { prefix: 'INV', pad: 4 },
  invoiceLine: { prefix: 'IL', pad: 4 },
  ledgerPair: { prefix: 'BC', pad: 4 },
  xeroContact: { prefix: 'XC', pad: 4 },
  xeroAccRec: { prefix: 'XR', pad: 4 },
  xeroAccPay: { prefix: 'XP', pad: 4 },
  paymentIn: { prefix: 'PMT', pad: 4 },
  disbursement: { prefix: 'DSB', pad: 4 },
  receipt: { prefix: 'RCT', pad: 4 },
  billingException: { prefix: 'BX', pad: 4 },
  aaFeeInvoice: { prefix: 'AF', pad: 4 },
  prepayTransfer: { prefix: 'PXT', pad: 4 },
  xeroJournal: { prefix: 'XJ', pad: 4 },
  xeroJournalNumber: { prefix: 'MJ-', pad: 4 },
  ledgerDisbursement: { prefix: 'LD', pad: 4 },
  importBatch: { prefix: 'IB', pad: 4 },
  importRow: { prefix: 'IR', pad: 4 },
  stub: { prefix: 'STB', pad: 4 },
}

/** Three-letter prefixes the app's seven-character ids start with (the generator keeps patient NHIs off them). */
const ID_PREFIXES: ReadonlySet<string> = new Set(['PMT', 'DSB', 'RCT', 'STB', 'PDL', 'MOD'])

function makeAllocator(counters: Record<string, number>) {
  return (kind: string): string => {
    const n = counters[kind] ?? 1
    counters[kind] = n + 1
    const f = FORMATS[kind] ?? { prefix: kind.toUpperCase(), pad: 4 }
    return `${f.prefix}${pad(n, f.pad)}`
  }
}

// ---------------------------------------------------------------------------
// The build
// ---------------------------------------------------------------------------

export function buildFullScaleDataset<S extends FullScaleInput>(base: S, options: FullScaleOptions): FullScaleDataset<S> {
  const todayISO = options.todayISO
  const officeWho = options.officeWho ?? 'Kirsty W.'
  const horizon = horizonFor(todayISO, base.appSettings.schedule.horizonMonths)
  const historyStartISO = addDaysISO(todayISO, -Math.round((FULL_SCALE.historyMonths * 365) / 12))
  const counters: Record<string, number> = { ...base.counters }
  const nextId = makeAllocator(counters)
  const stream = (...parts: string[]): Rng => slotRng(FULL_SCALE_SEED, 'fullScale', ...parts)

  // Working copies (the pristine records are copied by reference, never edited).
  const anaesthetists = { ...base.masters.anaesthetists }
  const surgeons = { ...base.masters.surgeons }
  const parties = { ...base.masters.parties }
  let contracts = { ...base.masters.contracts }
  const patients = { ...base.masters.patients }
  const recurringBookings = { ...base.masters.recurringBookings }
  const slots = { ...base.schedule.slots }
  const lists = { ...base.schedule.lists }
  const bookings = { ...base.schedule.bookings }
  const procedures = { ...base.schedule.procedures }
  const invoices = { ...base.billing.invoices }
  const invoiceLines = { ...base.billing.invoiceLines }
  const ledger = { ...base.billing.ledger }
  const receipts = { ...base.billing.receipts }
  const ledgerDisbursements = { ...base.billing.disbursements }
  const exceptions = { ...base.billing.exceptions }
  const contactIdCache = { ...base.billing.contactIdCache }
  const aaFeeInvoices = { ...base.billing.aaFeeInvoices }
  const locks = { ...base.billing.locks }
  const transfers = { ...base.billing.transfers }
  const contacts = { ...base.xero.contacts }
  const accRecs = { ...base.xero.accRecs }
  const accPays = { ...base.xero.accPays }
  const payments = { ...base.xero.payments }
  const xeroDisbursements = { ...base.xero.disbursements }
  const journals = { ...base.xero.journals }
  const audit: AuditEntry[] = []

  const audited = (entry: Omit<AuditEntry, 'id'>): void => {
    audit.push({ id: '', ...entry })
  }

  // -------------------------------------------------------------------------
  // 1. The 71 generated anaesthetists (a reserved registration block)
  // -------------------------------------------------------------------------
  const generatedCount = FULL_SCALE.anaesthetists - Object.keys(base.masters.anaesthetists).length
  const anaesRng = stream('anaesthetists')
  const usedNames = new Set(Object.values(anaesthetists).map((a) => a.name))
  const usedHpi = new Set(Object.values(anaesthetists).map((a) => a.hpiId))
  const generatedAnaesthetistIds: string[] = []
  for (let i = 0; i < generatedCount; i++) {
    const registrationNumber = String(FULL_SCALE.registrationBase + i)
    let name = ''
    do name = `Dr ${pick(anaesRng, FIRST_NAMES)} ${pick(anaesRng, SURNAMES)}`
    while (usedNames.has(name))
    usedNames.add(name)
    let hpiId = ''
    do hpiId = `${pad(intBetween(anaesRng, 10, 99), 2)}${Array.from({ length: 4 }, () => String.fromCharCode(65 + intBetween(anaesRng, 0, 25))).join('')}`
    while (usedHpi.has(hpiId))
    usedHpi.add(hpiId)
    const local = nameWithoutTitle(name).toLowerCase().replace(/[^a-z ]/g, '').split(' ').join('.')
    const a: Anaesthetist = {
      registrationNumber,
      name,
      phone: `021 556 ${pad(1000 + i, 4)}`,
      email: `${local}@aa-associates.example`,
      unitValue: roundToCents(26 + intBetween(anaesRng, 0, 32) * 0.5),
      hpiId,
      bankAccount: { accountName: nameWithoutTitle(name), accountNumber: seedBankAccountNumber(registrationNumber) },
      startDateISO: `20${pad(intBetween(anaesRng, 8, 23), 2)}-${pad(intBetween(anaesRng, 1, 6), 2)}-01`,
      active: true,
      gstNumber: syntheticGstNumber(registrationNumber),
    }
    anaesthetists[registrationNumber] = a
    generatedAnaesthetistIds.push(registrationNumber)
  }
  const generatedSet = new Set(generatedAnaesthetistIds)

  // -------------------------------------------------------------------------
  // 2. Surgeons (17b: a practice name and contacts, an HPI CPN a few lack, no rooms)
  // -------------------------------------------------------------------------
  const surgRng = stream('surgeons')
  const usedCpn = new Set(Object.values(surgeons).flatMap((s) => (s.hpiId !== undefined ? [s.hpiId] : [])))
  const SPECIALTY_POOL = [SPC.generalSurgery, SPC.orthopaedics, SPC.plasticSurgery, SPC.ent, SPC.gynaecology, SPC.urology, SPC.gastroenterology, SPC.ophthalmology]
  const PRACTICES = ['Avonhead Surgical', 'Riccarton Specialists', 'Papanui Surgical Rooms', 'Sumner Road Clinic', 'Merivale Surgical', 'Halswell Specialists', 'Linwood Surgical Group', 'Cashmere Clinic']
  const generatedSurgeonIds: string[] = []
  for (let i = 0; i < FULL_SCALE.surgeons; i++) {
    const id = `SFS${pad(i + 1, 3)}`
    const first = pick(surgRng, FIRST_NAMES)
    const last = pick(surgRng, SURNAMES)
    const title = surgRng() < 0.5 ? 'Mr' : 'Ms'
    const name = `${title} ${first.charAt(0)}. ${last}`
    const practiceName = pick(surgRng, PRACTICES)
    const practiceDomain = practiceName.toLowerCase().replace(/[^a-z]/g, '')
    const specialty = i < 3 ? SPC.ophthalmology : pick(surgRng, SPECIALTY_POOL)
    const surgeon: Surgeon = {
      id,
      name,
      specialtyIds: [specialty],
      practiceName,
      personalContact: { name, email: `${first.charAt(0).toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, '')}@surgeons.example`, phone: `021 557 ${pad(2000 + i, 4)}` },
      officeContacts: [{ name: `${practiceName} reception`, email: `reception@${practiceDomain}.example`, phone: `03 555 ${pad(3000 + i, 4)}` }],
    }
    if (surgRng() >= FULL_SCALE.noCpnSurgeonShare) {
      let cpn = ''
      do cpn = `${pad(intBetween(surgRng, 50, 99), 2)}${Array.from({ length: 4 }, () => String.fromCharCode(65 + intBetween(surgRng, 0, 25))).join('')}`
      while (usedCpn.has(cpn))
      usedCpn.add(cpn)
      surgeon.hpiId = cpn
    }
    surgeons[id] = surgeon
    generatedSurgeonIds.push(id)
  }
  const eyeSurgeonIds = Object.values(surgeons).filter((s) => s.retiredAtISO === undefined && s.specialtyIds.includes(SPC.ophthalmology)).map((s) => s.id).sort()
  const generalSurgeonIds = Object.values(surgeons)
    .filter((s) => s.retiredAtISO === undefined && !s.specialtyIds.includes(SPC.ophthalmology) && s.specialtyIds.length > 0)
    .map((s) => s.id)
    .sort()

  // -------------------------------------------------------------------------
  // 3. Parties and flat Contracts (18 to 19a), validated by 18's guards; the backstops by 18a
  // -------------------------------------------------------------------------
  const partyRng = stream('parties')
  const takenPrefixes = new Set(Object.values(parties).map((p) => p.codePrefix))
  const prefixFor = (seedText: string): string => {
    const stem = seedText.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'PTY'
    let candidate = stem
    let n = 0
    while (takenPrefixes.has(candidate)) {
      n += 1
      candidate = `${stem.slice(0, 4)}${String.fromCharCode(65 + (n % 26))}${n >= 26 ? String.fromCharCode(65 + Math.floor(n / 26)) : ''}`.slice(0, 6)
    }
    takenPrefixes.add(candidate)
    return candidate
  }
  const addParty = (party: Party): void => {
    const refused = partyRefusal(party, { parties, hospitals: base.masters.hospitals } as never)
    if (refused !== null) throw new Error(`Generated Party ${party.id} refused: ${refused.message}`)
    parties[party.id] = party
  }
  // Each generated surgeon is a Party holding its own Contracts.
  const surgeonPartyId = new Map<string, string>()
  for (const id of generatedSurgeonIds) {
    const s = surgeons[id]!
    const pid = `PY-FS-${id}`
    addParty({ id: pid, kind: 'surgeon', name: s.name, codePrefix: prefixFor(`FS${s.name.split(' ').pop() ?? id}`), billingName: s.practiceName ?? s.name, email: s.officeContacts[0]?.email ?? 'accounts@surgeons.example', deliveryMethod: 'email', billingIdentity: { kind: 'surgeon', id } })
    surgeonPartyId.set(id, pid)
  }
  // Two insurers and a funder-style Party (no insurer master: insurers are Parties, D2).
  const insurerParties: string[] = []
  for (const [i, name] of ['Kowhai Health Cover', 'Tasman Medical Insurance'].entries()) {
    const pid = `PY-FS-INS${i + 1}`
    addParty({ id: pid, kind: 'insurer', name, codePrefix: prefixFor(name), billingName: `${name} Limited`, email: `claims@${name.toLowerCase().replace(/[^a-z]/g, '')}.example`, deliveryMethod: 'email' })
    insurerParties.push(pid)
  }
  // Prepaid price lists (19a, D42): a few generated anaesthetists' own Contracts, kept by the office.
  const prepaidAnaesthetistIds = generatedAnaesthetistIds.slice(0, FULL_SCALE.prepaidPriceListAnaesthetists)
  for (const id of prepaidAnaesthetistIds) {
    const a = anaesthetists[id]!
    addParty({ id: `PY-FS-A${id}`, kind: 'anaesthetist', name: a.name, codePrefix: prefixFor(`A${nameWithoutTitle(a.name).split(' ').pop() ?? id}`) })
  }

  const kinds = Object.entries(FULL_SCALE.pricingKindMix) as [PricingKind, number][]
  const kindTotal = kinds.reduce((s, [, w]) => s + w, 0)
  const drawKind = (rng: Rng): PricingKind => {
    let r = rng() * kindTotal
    for (const [k, w] of kinds) {
      if ((r -= w) < 0) return k
    }
    return kinds[0]![0]
  }
  const codeCounters = new Map<string, number>()
  const aaCodeFor = (prefix: string): string => {
    const n = (codeCounters.get(prefix) ?? 0) + 1
    codeCounters.set(prefix, n)
    return `${prefix}-${pad(n, 3)}`
  }
  const validation = () => ({
    parties,
    contracts,
    surgeonIds: new Set(Object.keys(surgeons)),
    anaesthetistIds: new Set(Object.keys(anaesthetists)),
    specialtyIds: new Set(Object.keys(base.masters.specialties)),
    fundingTagIds: new Set(Object.keys(base.masters.fundingTags)),
    rvgGroups: base.masters.rvgGroups,
  })
  const addContract = (c: Contract): void => {
    const refused = contractRefusal(c, validation())
    if (refused !== null) throw new Error(`Generated Contract ${c.id} refused: ${refused.message}`)
    contracts[c.id] = c
  }
  const historyRangeStart = '2025-01-01'
  const fixedRanges = (rng: Rng, price: number) => {
    // A few backdated changes, so older Bookings price from the range then in force.
    const ranges = [{ startISO: historyRangeStart, price }]
    if (rng() < 0.3) ranges.push({ startISO: '2026-04-01', price: roundToCents(price * 1.04) })
    return ranges
  }
  let contractN = 0
  for (const sid of generatedSurgeonIds) {
    const s = surgeons[sid]!
    const holderId = surgeonPartyId.get(sid)!
    const holder = parties[holderId]!
    const count = intBetween(partyRng, 1, 2)
    for (let k = 0; k < count; k++) {
      contractN += 1
      const kind = drawKind(partyRng)
      const code = s.specialtyIds.includes(SPC.ophthalmology) ? pick(partyRng, EYE_CODES) : pick(partyRng, GENERAL_CODES)
      const group = LEGACY_CODE_TO_RVG_GROUP[code]!
      const pricing: Contract['pricing'] =
        kind === 'rvgContractRate'
          ? { kind, unitRate: roundToCents(30 + intBetween(partyRng, 0, 20) * 0.5) }
          : kind === 'rvgDiscount'
            ? { kind, discountPct: pick(partyRng, [5, 10, 15]) }
            : kind === 'fixed'
              ? { kind, ranges: fixedRanges(partyRng, 400 + intBetween(partyRng, 0, 40) * 25) }
              : { kind: 'rvgAnaesthetistRate' }
      addContract({
        id: `CT-FS-${pad(contractN, 3)}`,
        aaCode: aaCodeFor(holder.codePrefix),
        holderReference: `${holder.codePrefix}${pad(100 + k, 3)}`,
        invoiceDescription: kind === 'fixed' ? group.description : null,
        defaultRvgGroupId: kind === 'fixed' ? group.groupId : null,
        name: kind === 'fixed' ? `${group.description}, fixed fee` : `${s.name} rate`,
        holderId,
        billsTo: partyRng() < 0.5 ? 'holder' : 'payer',
        linkedSurgeonIds: [sid],
        prepaid: false,
        anaesthetistMayOverridePrice: isRvgKind(kind) && partyRng() < 0.4,
        pricing,
        status: partyRng() < 0.05 ? 'disabled' : 'active',
        specialtyIds: [...s.specialtyIds],
      })
    }
  }
  for (const holderId of insurerParties) {
    const holder = parties[holderId]!
    contractN += 1
    addContract({
      id: `CT-FS-${pad(contractN, 3)}`,
      aaCode: aaCodeFor(holder.codePrefix),
      invoiceDescription: null,
      defaultRvgGroupId: null,
      name: `${holder.name} RVG`,
      holderId,
      billsTo: 'holder',
      linkedSurgeonIds: [],
      prepaid: false,
      anaesthetistMayOverridePrice: false,
      pricing: { kind: 'rvgContractRate', unitRate: 33 },
      status: 'active',
      specialtyIds: [],
    })
  }
  const prepaidContractIds: string[] = []
  for (const aid of prepaidAnaesthetistIds) {
    const holderId = `PY-FS-A${aid}`
    const holder = parties[holderId]!
    contractN += 1
    const id = `CT-FS-${pad(contractN, 3)}`
    addContract({
      id,
      aaCode: aaCodeFor(holder.codePrefix),
      invoiceDescription: 'Anaesthesia, prepaid',
      defaultRvgGroupId: RVG_GROUP.aaRhinoplasty ?? null,
      name: 'Cosmetic procedure, prepaid',
      holderId,
      billsTo: 'payer',
      linkedSurgeonIds: [],
      linkedAnaesthetistId: aid,
      prepaid: true,
      anaesthetistMayOverridePrice: false,
      pricing: { kind: 'fixed', ranges: [{ startISO: historyRangeStart, price: 600 + intBetween(partyRng, 0, 12) * 50 }] },
      status: 'active',
      specialtyIds: [],
    })
    prepaidContractIds.push(id)
  }
  // The two 'No contract' backstops per destination the new Parties imply (18a's builder).
  contracts = ensureFallbacks(contracts, parties, base.masters.fundingTags, (_d, key, kind) => `CT-FS-${kind === 'rvg' ? 'RVG' : 'FIX'}-${key.replace(/[^A-Za-z0-9]/g, '')}`).contracts
  const noContract = noContractRvg(contracts)
  const railMasters: RailMasters = { contracts, parties, fundingTags: base.masters.fundingTags, rvgGroups: base.masters.rvgGroups, surgeons }

  // -------------------------------------------------------------------------
  // 4. Recurring bookings, leave and Public sessions, then the canvas (Phase 28's generator)
  // -------------------------------------------------------------------------
  const HOSPITAL_POOL = [HOSP.stg, HOSP.sx, HOSP.forte, HOSP.ces]
  const recRng = stream('recurring')
  const generatedRecurring: RecurringBooking[] = []
  const recurringByAnaesthetist = new Map<string, RecurringBooking[]>()
  let recN = 0
  for (const aid of generatedAnaesthetistIds) {
    const count = intBetween(recRng, FULL_SCALE.recurringPerWeek.min, FULL_SCALE.recurringPerWeek.max)
    const taken = new Set<string>()
    const mine: RecurringBooking[] = []
    while (mine.length < count) {
      const dow = intBetween(recRng, 1, 5) as RecurringBooking['dayOfWeek']
      const session = recRng() < 0.55 ? 'AM' : 'PM'
      const key = `${dow}|${session}`
      if (taken.has(key)) continue
      taken.add(key)
      const hospitalId = pick(recRng, HOSPITAL_POOL)
      const surgeonId = hospitalId === HOSP.ces ? pick(recRng, eyeSurgeonIds) : pick(recRng, generalSurgeonIds)
      recN += 1
      const rb: RecurringBooking = {
        id: `RB-FS-${pad(recN, 4)}`,
        anaesthetistId: aid,
        dayOfWeek: dow,
        session,
        hospitalId,
        surgeonId,
        kind: 'private',
        effectiveFromISO: historyStartISO,
      }
      mine.push(rb)
      generatedRecurring.push(rb)
      recurringBookings[rb.id] = rb
    }
    recurringByAnaesthetist.set(aid, mine)
  }

  const horizonDates = enumerateDatesISO(horizon.startISO, horizon.endISO)
  const leave: SeedLeaveWindow[] = []
  let publicSessions = 0
  for (const aid of generatedAnaesthetistIds) {
    const rng = stream('leave', aid)
    const mine = recurringByAnaesthetist.get(aid) ?? []
    const patterned = new Set(mine.map((r) => `${r.dayOfWeek}|${r.session}`))
    // A few leave days ahead (their recurring Lists become Draft Lists by Phase 31's rule).
    const days = intBetween(rng, FULL_SCALE.leaveDaysPerAnaesthetist.min, FULL_SCALE.leaveDaysPerAnaesthetist.max)
    const future = horizonDates.filter((d) => d > todayISO && isWeekday(d))
    const start = pick(rng, future)
    for (const d of enumerateDatesISO(start, addDaysISO(start, days - 1))) {
      if (d > horizon.endISO) break
      for (const session of ['AM', 'PM'] as const) leave.push({ anaesthetistId: aid, dateISO: d, session, status: SEED_STATUS.holiday })
    }
    // Public sessions (32d, D86): bookless sessions with no recurring booking, the note "CPH".
    for (const d of horizonDates) {
      if (!isWeekday(d) || (d >= start && d <= addDaysISO(start, days - 1))) continue
      for (const session of ['AM', 'PM'] as const) {
        if (patterned.has(`${dayOfWeek(d)}|${session}`)) continue
        if (rng() < FULL_SCALE.publicSessionShare) {
          leave.push({ anaesthetistId: aid, dateISO: d, session, status: SEED_STATUS.publicHospital, note: 'CPH' })
          publicSessions += 1
        }
      }
    }
  }
  const generated = generateCanvasForDates(
    {
      anaesthetists: generatedAnaesthetistIds.map((id) => ({ id, startDateISO: anaesthetists[id]!.startDateISO, active: true })),
      recurringBookings: generatedRecurring,
      leave,
      series: [],
      statuses: base.masters.slotStatuses,
    },
    horizonDates,
  )
  for (const s of generated.slots) slots[s.id] = s
  for (const l of generated.lists) lists[l.id] = l
  const draftLists = seedRecurringClashDraftLists(generated.clashes, slots, generatedRecurring)
  for (const d of draftLists) {
    if (lists[d.id] !== undefined) continue
    lists[d.id] = d
  }

  // -------------------------------------------------------------------------
  // 5. Patients (valid, unique NHIs; synthetic names, DOBs and contacts)
  // -------------------------------------------------------------------------
  const usedNhis = new Set(Object.values(patients).flatMap((p) => (p.nhi !== undefined ? [p.nhi] : [])))
  const patRng = stream('patients')
  const ethnicity = ETHNICITY_DEMO_SUBSET.map((e) => e.code)
  const generatedPatientIds: string[] = []
  let patientN = 0
  const newPatient = (): Patient => {
    patientN += 1
    const format = patientN % 9 === 0 ? 'new' : 'current'
    // Unique, and never on a prefix the app's own record ids use (PMT0004 passes the check digit too).
    let nhi = generateNhi(format, patRng)
    while (usedNhis.has(nhi) || ID_PREFIXES.has(nhi.slice(0, 3))) nhi = generateNhi(format, patRng)
    usedNhis.add(nhi)
    const id = nextId('patient')
    // Mostly adults; a few children (their Procedures' payer is a guardian).
    const year = patRng() < 0.04 ? 2012 + intBetween(patRng, 0, 12) : 1938 + intBetween(patRng, 0, 66)
    const patient = withSeedContact({
      hiddenInternalId: id,
      nhi,
      name: `${pick(patRng, FIRST_NAMES)} ${pick(patRng, SURNAMES)}`,
      dobISO: `${year}-${pad(intBetween(patRng, 1, 12), 2)}-${pad(intBetween(patRng, 1, 28), 2)}`,
      ethnicityCode: pick(patRng, ethnicity),
      phone: `022 55${pad(patientN % 100000, 5)}`,
    })
    patients[id] = patient
    generatedPatientIds.push(id)
    return patient
  }
  const patientFor = (): Patient => {
    // The one-time share is the narrated figure (`settings.volumeStory.oneTimePct`), never a second copy.
    if (generatedPatientIds.length > 50 && patRng() >= base.settings.volumeStory.oneTimePct / 100) {
      return patients[pick(patRng, generatedPatientIds)]!
    }
    return newPatient()
  }
  const ageOn = (dobISO: string, dateISO: string): number => {
    const years = Number(dateISO.slice(0, 4)) - Number(dobISO.slice(0, 4))
    return dateISO.slice(5) < dobISO.slice(5) ? years - 1 : years
  }

  // -------------------------------------------------------------------------
  // 6. Bookings and their Procedures (the rail, the payer, the stack)
  // -------------------------------------------------------------------------
  let prepaidBookings = 0
  const prepaidAnaesthetists = new Set(prepaidAnaesthetistIds)

  interface BuiltBooking {
    booking: Booking
    procedures: Procedure[]
    patient: Patient
  }

  const buildBooking = (list: List & { anaesthetistId: string }, index: number, startMinutes: number, completed: boolean, rng: Rng): { built: BuiltBooking; endMinutes: number } => {
    const patient = patientFor()
    const bookingId = nextId('booking')
    const duration = 35 + Math.floor(rng() * 50)
    const start = startMinutes + Math.floor(rng() * 8)
    const end = start + duration
    // Booked a week before the List, never after the demo clock (an audit stamp is never in the future).
    const bookedISO = earlier(`${addDaysISO(list.dateISO, -7)}T09:00:00`, `${addDaysISO(todayISO, -1)}T16:00:00`)
    const atISO = completed ? `${list.dateISO}T${time(end + 4)}:00` : bookedISO
    const booking: Booking = {
      id: bookingId,
      listId: list.id,
      patientId: patient.hiddenInternalId,
      scheduledTime: time(start),
      completed,
      ...(completed ? { completedAtISO: atISO } : {}),
      source: list.hospitalId === HOSP.forte || list.hospitalId === HOSP.ces ? 'surgeonPdf' : 'hospitalDownload',
      lastModifiedBy: completed ? (anaesthetists[list.anaesthetistId]?.name ?? 'Anaesthetist') : officeWho,
      lastModifiedAtISO: completed ? atISO : bookedISO,
    }
    // The payer (22a, D85): the patient, or a synthetic guardian below `guardianPayerAgeUnder`.
    let payer: ProcedurePayer = { kind: 'patient' }
    if (ageOn(patient.dobISO, list.dateISO) < FULL_SCALE.guardianPayerAgeUnder) {
      const surname = patient.name.split(' ').pop() ?? 'Parent'
      payer = { kind: 'other', id: nextId('billableParty'), name: `${pick(rng, FIRST_NAMES)} ${surname}`, relationship: 'Parent', email: `guardian.${patient.hiddenInternalId.toLowerCase()}@example.net` }
    }
    const procs: Procedure[] = []
    const procedureCount = rng() < FULL_SCALE.secondProcedureShare ? 2 : 1
    const ctx = { listDateISO: list.dateISO, hospitalId: billingHospitalId(list.hospitalId, base.masters.hospitals), surgeonId: list.surgeonId, anaesthetistId: list.anaesthetistId }
    const prepaid = prepaidAnaesthetists.has(list.anaesthetistId) && procedureCount === 1 && payer.kind === 'patient' && rng() < (FULL_SCALE.prepaidShare * generatedAnaesthetistIds.length) / prepaidAnaesthetistIds.length
    for (let k = 0; k < procedureCount; k++) {
      const code = list.hospitalId === HOSP.ces ? pick(rng, EYE_CODES) : pick(rng, GENERAL_CODES)
      const legacy = LEGACY_CODE_TO_RVG_GROUP[code]!
      let contract: Contract
      if (prepaid) {
        contract = contracts[prepaidContractIds[prepaidAnaesthetistIds.indexOf(list.anaesthetistId)]!]!
      } else {
        const candidates = contractCandidatesFor(railMasters, ctx).filter((c) => !c.prepaid)
        contract = candidates.length === 0 || rng() < FULL_SCALE.noContractShare ? noContract : pick(rng, candidates)
      }
      const rvgGroupId = isRvgKind(contract.pricing.kind) ? legacy.groupId : (contract.defaultRvgGroupId ?? undefined)
      const procedure: Procedure = {
        id: nextId('procedure'),
        bookingId,
        // A second Procedure's payer is copied from the first (the same BP id), or, on a few, another person.
        payer: k === 1 && rng() < FULL_SCALE.secondPayerShare ? { kind: 'other', id: nextId('billableParty'), name: `${pick(rng, FIRST_NAMES)} ${pick(rng, SURNAMES)}`, relationship: 'Employer', email: `payer.${bookingId.toLowerCase()}@example.net` } : payer,
        procedureText: seedText(legacy.description, booking.source === 'surgeonPdf' ? 'surgeonPdf' : 'hospitalDownload'),
        invoiceDescription: null,
        governingContractId: contract.id,
        isPrimary: k === 0,
        modifierClaims: [],
        removedModifierIds: [],
      }
      if (rvgGroupId !== undefined) procedure.rvgGroupId = rvgGroupId
      if (completed) {
        procedure.anaestheticStartISO = `${list.dateISO}T${time(start)}:00`
        procedure.handoverISO = `${list.dateISO}T${time(end)}:00`
        procedure.modifiersConfirmed = true
      }
      // A typed price where the Contract allows it (24): the office on a fixed price, or an RVG Contract with the override.
      if (!prepaid && contract.systemRole === undefined && contract.anaesthetistMayOverridePrice && rng() < FULL_SCALE.typedPriceShare) {
        procedure.enteredPrice = 300 + intBetween(rng, 0, 30) * 20
      }
      procs.push(procedure)
    }
    if (prepaid) prepaidBookings += 1
    // A few insured patients (D28): the insurer, a Party, and an approval number on the Booking, so billed
    // history raises no missing-approval warning. The insurer only suggests a path; it never decides who is billed.
    if (!prepaid && insurerParties.length > 0 && rng() < FULL_SCALE.insuredShare) {
      booking.funderPartyId = pick(rng, insurerParties)
      booking.insuranceApprovalNumber = `AP-${bookingId.slice(2)}`
    }
    if (index === 0 && procs.length > 0) {
      // Nothing more: the primary is the first (23).
    }
    return { built: { booking, procedures: procs, patient }, endMinutes: end }
  }

  const placeBookings = (list: List & { anaesthetistId: string }, count: number, completed: boolean, rng: Rng): BuiltBooking[] => {
    let cursor = list.session === 'AM' ? 7 * 60 + 45 : 13 * 60 + 5
    const out: BuiltBooking[] = []
    for (let i = 0; i < count; i++) {
      const { built, endMinutes } = buildBooking(list, i, cursor, completed, rng)
      cursor = endMinutes + 8
      bookings[built.booking.id] = built.booking
      for (const p of built.procedures) procedures[p.id] = p
      out.push(built)
    }
    return out
  }

  // -------------------------------------------------------------------------
  // 7. The Lists to bill: the backdrop before the horizon, then the past fortnight
  // -------------------------------------------------------------------------
  const backdropDates = enumerateDatesISO(historyStartISO, addDaysISO(horizon.startISO, -1))
  const backdrop: (List & { anaesthetistId: string })[] = []
  for (const aid of generatedAnaesthetistIds) {
    for (const rb of recurringByAnaesthetist.get(aid) ?? []) {
      for (const d of backdropDates) {
        if (dayOfWeek(d) !== rb.dayOfWeek) continue
        const id = projectedListId(aid, d, rb.session)
        const list: List = {
          id,
          slotId: slotIdFor(aid, d, rb.session),
          dateISO: d,
          anaesthetistId: aid,
          session: rb.session,
          state: 'AUTHORISED',
          kind: 'private',
          hospitalId: rb.hospitalId,
          surgeonId: rb.surgeonId,
          conflicts: [],
          origin: originForNewList({ kind: 'recurring' }),
          recurringBookingId: rb.id,
        }
        lists[id] = list
        backdrop.push(list as List & { anaesthetistId: string })
      }
    }
  }
  // The past fortnight in the horizon: the generated canvas Lists before today.
  const pastCanvas = generated.lists.filter((l) => l.dateISO < todayISO) as (List & { anaesthetistId: string })[]
  // The review backlog: the last two working days before today stay SUBMITTED (not billed).
  const workingDaysBack: string[] = []
  for (let d = addDaysISO(todayISO, -1); workingDaysBack.length < 2; d = addDaysISO(d, -1)) if (isWeekday(d)) workingDaysBack.push(d)
  const backlogDates = new Set(workingDaysBack)
  const toBill = [...backdrop, ...pastCanvas].sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.id.localeCompare(b.id))

  // Calibrate the booking density so invoices land at about the yearly target.
  const existingRecent = Object.values(base.billing.invoices).filter((i) => (i.raisedAtISO ?? '') >= historyStartISO).length
  const invoiceTarget = FULL_SCALE.targetInvoicesPerYear - existingRecent
  const billable = toBill.filter((l) => !backlogDates.has(l.dateISO))
  const mean = invoiceTarget / billable.length / FULL_SCALE.invoicesPerBooking

  // -------------------------------------------------------------------------
  // 8. Billing: lock at authorise, invoices from the lock, pairs, the Xero mirror and the money
  // -------------------------------------------------------------------------
  const paidRng = stream('payments')
  const problemRng = stream('problems')
  const problemListIds: string[] = []
  let invoiceNumberN = 0
  const nextInvoiceNumber = (): string => {
    invoiceNumberN += 1
    return `${FULL_SCALE.invoiceNumberPrefix}${pad(invoiceNumberN, 6)}`
  }
  const contactFor = (kind: string, id: string, name: string, type: XeroContact['type']): string => {
    const key = `${kind}:${id}`
    const cached = contactIdCache[key]
    if (cached !== undefined) return cached
    const contactId = nextId('xeroContact')
    contacts[contactId] = { contactId, contactNumber: kind === 'anaesthetist' ? `ANAE-${id}` : id, name, type, archived: false }
    contactIdCache[key] = contactId
    return contactId
  }
  const counterpartyContact = (cp: Invoice['counterparty']): string => {
    switch (cp.kind) {
      case 'patient':
        return contactFor('patient', cp.id, xeroIndividualContactName('patient', cp.id), 'patient')
      case 'payer':
      case 'billableParty':
        return contactFor('billableParty', cp.id, xeroIndividualContactName('billableParty', cp.id), 'billableParty')
      case 'hospital':
        return contactFor('hospital', cp.id, base.masters.hospitals[cp.id]?.name ?? cp.id, 'organisation')
      default: {
        const party = cp.kind === 'party' ? parties[cp.id] : Object.values(parties).find((p) => p.billingIdentity?.kind === cp.kind && p.billingIdentity.id === cp.id)
        return contactFor(cp.kind, cp.id, party?.billingName ?? party?.name ?? cp.id, 'organisation')
      }
    }
  }
  const holdingContactId = (): string => {
    const cached = contactIdCache[AA_HOLDING_ACCOUNT.contactKey]
    if (cached !== undefined) return cached
    const contactId = nextId('xeroContact')
    contacts[contactId] = { contactId, contactNumber: AA_HOLDING_ACCOUNT.contactNumber, name: AA_HOLDING_ACCOUNT.name, type: 'organisation', archived: false }
    contactIdCache[AA_HOLDING_ACCOUNT.contactKey] = contactId
    return contactId
  }
  const weeklyPayDay = (afterISO: string): string => {
    // The weekly payment run: the next Wednesday on or after the day after.
    let d = addDaysISO(afterISO.slice(0, 10), 1)
    while (dayOfWeek(d) !== 3) d = addDaysISO(d, 1)
    return d
  }

  /** Money in and out on one pair, mirrored in Xero (the history's payment mix). */
  const settle = (pair: BookingLedgerPair, accRecId: string, accPayId: string | undefined, raisedISO: string, anaesthetistId: string, payeeContactId: string): BookingLedgerPair => {
    const ageDays = (Date.parse(todayISO) - Date.parse(raisedISO.slice(0, 10))) / 86400000
    const older = ageDays > FULL_SCALE.paymentMix.settledAfterDays
    const draw = paidRng()
    let share = 0
    if (older) share = draw < FULL_SCALE.paymentMix.olderOutstandingShare ? 0 : draw < FULL_SCALE.paymentMix.olderOutstandingShare + FULL_SCALE.paymentMix.olderPartPaidShare ? 0.5 : 1
    else share = draw < FULL_SCALE.paymentMix.newerPaidShare ? 1 : 0
    if (share === 0 || pair.receivable.amount === 0) return pair
    const paidAt = addDaysISO(raisedISO.slice(0, 10), intBetween(paidRng, 5, Math.max(6, Math.min(30, Math.floor(ageDays) - 1))))
    if (paidAt >= todayISO) return pair
    const paidAtISO = `${paidAt}T10:00:00`
    const amount = roundToCents(pair.receivable.amount * share)
    let next = applyReceipt(pair, amount, paidAtISO).pair
    const key = `FS-PAY-${pair.id}`
    const pmtId = nextId('paymentIn')
    payments[pmtId] = { id: pmtId, accRecId, amount, atISO: paidAtISO, idempotencyKey: key, source: 'webhook' }
    const rctId = nextId('receipt')
    receipts[rctId] = { id: rctId, pairId: pair.id, pairKind: 'procedure', anaesthetistId, accRecId, grossAmount: amount, gstAmount: gstComponentOf(amount), atISO: paidAtISO, idempotencyKey: key, source: 'webhook' }
    const accRec = accRecs[accRecId]!
    accRecs[accRecId] = { ...accRec, amountReceived: amount, status: share === 1 ? 'paid' : 'awaitingPayment', ...(share === 1 ? { paidAtISO } : {}) }
    // Paid out at the weekly run after the money arrived (released by 16's rule).
    const payDay = weeklyPayDay(paidAtISO)
    if (next.payable !== undefined && accPayId !== undefined) {
      const released = next.payable.releasedAmount
      const accPay = accPays[accPayId]!
      if (payDay < todayISO && released > 0) {
        const at = `${payDay}T09:00:00`
        const out = applyDisbursement(next.payable, released, at)
        if (out.ok) {
          next = { ...next, payable: out.leg }
          const dsbId = nextId('disbursement')
          const billPayKey = `BILLPAY-${dsbId}`
          xeroDisbursements[dsbId] = { id: dsbId, accPayId, amount: released, atISO: at, payablesRunId: `PR-FS-${payDay}`, idempotencyKey: billPayKey }
          const ldId = nextId('ledgerDisbursement')
          ledgerDisbursements[ldId] = { id: ldId, pairId: pair.id, anaesthetistId, amount: released, atISO: at, payablesRunId: `PR-FS-${payDay}`, xeroDisbursementId: dsbId, idempotencyKey: billPayKey, detectedBy: 'poll' }
          accPays[accPayId] = { ...accPay, amountAuthorised: released, amountDisbursed: released, status: out.leg.paidOutAtISO !== undefined ? 'paid' : 'authorised' }
        }
      } else {
        accPays[accPayId] = { ...accPay, amountAuthorised: released, status: 'authorised' }
      }
    }
    void payeeContactId
    return next
  }

  const raiseInvoices = (list: List & { anaesthetistId: string }, built: BuiltBooking, authorisedAtISO: string, billedAtISO: string, prepaidLeftOff?: InvoiceBuildContext['prepaidLeftOff'], held?: InvoiceBuildContext['held']): number => {
    const anaesthetist = anaesthetists[list.anaesthetistId]!
    const listHospitalId = billingHospitalId(list.hospitalId, base.masters.hospitals)
    const surgeonName = surgeons[list.surgeonId]?.name
    const ctx: InvoiceBuildContext = {
      anaesthetist,
      rvgGroups: base.masters.rvgGroups,
      contracts,
      parties,
      billingLines: [],
      listDateISO: list.dateISO,
      timeRule: base.masters.rvgTimeRule,
      patientDobISO: built.patient.dobISO,
      modifiers: base.masters.modifiers,
      patient: built.patient,
      patientId: built.patient.hiddenInternalId,
      ...(listHospitalId !== undefined ? { listHospitalId } : {}),
      ...(surgeonName !== undefined ? { surgeonName } : {}),
      ...(prepaidLeftOff !== undefined ? { prepaidLeftOff } : {}),
      ...(held !== undefined ? { held } : {}),
    }
    const lock = buildBookingLock({
      booking: built.booking,
      procedures: built.procedures,
      ctx,
      takenAtISO: authorisedAtISO,
      takenBy: officeWho,
      partyName: (ref) => {
        if (ref.kind === 'patient') return built.patient.name
        if (ref.kind === 'hospital') return base.masters.hospitals[ref.id]?.name ?? ref.id
        if (ref.kind === 'payer') {
          const other = built.procedures.flatMap((p) => (p.payer.kind === 'other' && p.payer.id === ref.id ? [p.payer.name] : []))[0]
          return other ?? ref.id
        }
        return partyForCounterparty(ref, parties)?.name ?? ref.id
      },
    })
    locks[built.booking.id] = lock
    const result = invoiceDraftsFromLock(lock)
    if (result.kind === 'exception') throw new Error(`Generated Booking ${built.booking.id} did not lock: ${result.code} ${result.message}`)
    const supplier = supplierFor(anaesthetist)
    const payeeContactId = contactFor('anaesthetist', anaesthetist.registrationNumber, anaesthetist.name, 'organisation')
    let raised = 0
    for (const draft of result.invoices) {
      const caseId = nextId('ledgerPair')
      const invoiceId = nextId('invoice')
      const invoiceNumber = nextInvoiceNumber()
      const invoice = invoiceRecordFromDraft(draft, { invoiceId, invoiceNumber, caseId, bookingId: built.booking.id, kind: 'standard', atISO: billedAtISO, supplier })
      if (draft.delivery !== undefined) invoice.delivery = deliveryStampFor(draft.delivery, billedAtISO, 'Billing run')
      invoices[invoiceId] = invoice
      for (const line of draft.lines) {
        const lineId = nextId('invoiceLine')
        invoiceLines[lineId] = invoiceLineRecord(line, lineId, invoiceId)
      }
      let pair = newBookingPair({ id: caseId, kind: 'procedure', invoice, lines: draft.lines, bookingId: built.booking.id, listId: list.id, payee: anaesthetistPayee(anaesthetist.registrationNumber), patientId: built.patient.hiddenInternalId, atISO: billedAtISO })
      // The Xero mirror: the payer's contact (no personal information, OQ-30), an ACCREC and its ACCPAY (the BCTI).
      const accRecId = nextId('xeroAccRec')
      accRecs[accRecId] = { id: accRecId, kind: 'procedure', invoiceId, contactId: counterpartyContact(invoice.counterparty), invoiceNumber, reference: caseId, issuedAtISO: billedAtISO, amountDue: invoice.total, amountReceived: 0, status: 'awaitingPayment' }
      let accPayId: string | undefined
      if (pair.payable !== undefined) {
        accPayId = nextId('xeroAccPay')
        accPays[accPayId] = {
          id: accPayId,
          accRecId,
          contactId: payeeContactId,
          invoiceNumber: `${invoiceNumber}-P`,
          reference: caseId,
          issuedAtISO: billedAtISO,
          anaesthetistId: anaesthetist.registrationNumber,
          amountPayable: pair.payable.amount,
          amountAuthorised: 0,
          amountDisbursed: 0,
          status: 'draft',
          taxInvoice: buyerCreatedTaxInvoiceFor(invoice, supplier),
        }
        pair = { ...pair, payable: { ...pair.payable, xeroAccPayId: accPayId } }
      }
      pair = { ...pair, receivable: { ...pair.receivable, xeroAccRecId: accRecId } }
      ledger[caseId] = settle(pair, accRecId, accPayId, billedAtISO, anaesthetist.registrationNumber, payeeContactId)
      audited({ entityType: 'invoice', entityId: invoiceId, who: 'Billing run', role: 'system', source: 'system', action: 'invoice.create', atISO: billedAtISO, after: { invoiceNumber, caseReference: caseId, bookingId: built.booking.id, total: invoice.total } })
      audited({ entityType: 'ledgerPair', entityId: caseId, who: 'Billing run', role: 'system', source: 'system', action: 'ledger.pairCreated', atISO: billedAtISO, after: { kind: 'procedure', bookingId: built.booking.id, invoiceNumber, amount: invoice.total } })
      raised += 1
    }
    return raised
  }

  /** A prepaid Booking (27, 27a): its prepayment raised and paid into the AA Holding account before the List. */
  const raisePrepayment = (list: List & { anaesthetistId: string }, built: BuiltBooking, approvedAtISO: string): { leftOff: NonNullable<InvoiceBuildContext['prepaidLeftOff']>; held: NonNullable<InvoiceBuildContext['held']>; pairIds: string[] } => {
    const anaesthetist = anaesthetists[list.anaesthetistId]!
    const ctx = {
      anaesthetist,
      rvgGroups: base.masters.rvgGroups,
      contracts,
      parties,
      billingLines: [],
      listDateISO: list.dateISO,
      timeRule: base.masters.rvgTimeRule,
      patientDobISO: built.patient.dobISO,
      modifiers: base.masters.modifiers,
    }
    const priced = bookingFeesFor(built.procedures, ctx)
    const groups = prepaymentGroupsFor({
      booking: built.booking,
      procedures: built.procedures,
      contracts,
      issued: [],
      priceOf: (p) => (priced.kind === 'structural' ? null : (priced.fees[p.id]?.needsPrice ?? true) ? null : priced.fees[p.id]!.total),
      patient: built.patient,
    })
    const leftOff: NonNullable<InvoiceBuildContext['prepaidLeftOff']> = {}
    const held: Record<string, HeldPrices> = {}
    const pairIds: string[] = []
    for (const group of groups) {
      const draft = prepaymentInvoiceDraftFor(group, built.procedures, { contracts, patientId: built.patient.hiddenInternalId, patient: built.patient })
      if (draft === null) continue
      const caseId = nextId('ledgerPair')
      const invoiceId = nextId('invoice')
      const invoiceNumber = nextInvoiceNumber()
      const invoice = invoiceRecordFromDraft(draft, { invoiceId, invoiceNumber, caseId, bookingId: built.booking.id, kind: 'prePayment', atISO: approvedAtISO, approval: { mode: 'approved', by: officeWho, role: 'office', atISO: approvedAtISO } })
      invoices[invoiceId] = invoice
      for (const line of draft.lines) {
        const lineId = nextId('invoiceLine')
        invoiceLines[lineId] = invoiceLineRecord(line, lineId, invoiceId)
        if (line.procedureId !== undefined) {
          leftOff[line.procedureId] = { amount: line.amount, prepaymentInvoiceId: invoiceId }
          held[line.procedureId] = { prepaid: line.amount }
        }
      }
      const accRecId = nextId('xeroAccRec')
      const accPayId = nextId('xeroAccPay')
      accRecs[accRecId] = { id: accRecId, kind: 'procedure', invoiceId, contactId: counterpartyContact(invoice.counterparty), invoiceNumber, reference: caseId, issuedAtISO: approvedAtISO, amountDue: invoice.total, amountReceived: invoice.total, paidAtISO: approvedAtISO, status: 'paid' }
      accPays[accPayId] = { id: accPayId, accRecId, contactId: holdingContactId(), invoiceNumber: `${invoiceNumber}-P`, reference: caseId, issuedAtISO: approvedAtISO, anaesthetistId: anaesthetist.registrationNumber, amountPayable: invoice.total, amountAuthorised: invoice.total, amountDisbursed: 0, status: 'authorised', payeeAccount: AA_HOLDING_ACCOUNT.payeeAccount }
      const pair = newBookingPair({ id: caseId, kind: 'prePayment', invoice, lines: draft.lines, bookingId: built.booking.id, listId: list.id, payee: HOLDING_PAYEE, patientId: built.patient.hiddenInternalId, atISO: approvedAtISO })
      const paid = applyReceipt(pair, invoice.total, approvedAtISO).pair
      ledger[caseId] = { ...paid, receivable: { ...paid.receivable, xeroAccRecId: accRecId }, ...(paid.payable !== undefined ? { payable: { ...paid.payable, xeroAccPayId: accPayId } } : {}) }
      const key = `FS-PREPAY-${caseId}`
      const pmtId = nextId('paymentIn')
      payments[pmtId] = { id: pmtId, accRecId, amount: invoice.total, atISO: approvedAtISO, idempotencyKey: key, source: 'webhook' }
      const rctId = nextId('receipt')
      receipts[rctId] = { id: rctId, pairId: caseId, pairKind: 'prePayment', anaesthetistId: anaesthetist.registrationNumber, accRecId, grossAmount: invoice.total, gstAmount: invoice.gst, atISO: approvedAtISO, idempotencyKey: key, source: 'webhook' }
      audited({ entityType: 'invoice', entityId: invoiceId, who: officeWho, role: 'office', source: 'office', action: 'invoice.prePaymentApproved', atISO: approvedAtISO, after: { invoiceNumber, bookingId: built.booking.id, total: invoice.total } })
      audited({ entityType: 'ledgerPair', entityId: caseId, who: officeWho, role: 'office', source: 'office', action: 'ledger.pairCreated', atISO: approvedAtISO, after: { kind: 'prePayment', bookingId: built.booking.id, invoiceNumber, amount: invoice.total, payee: 'AA Holding account' } })
      pairIds.push(caseId)
    }
    return { leftOff, held, pairIds }
  }

  const transferAtAuthorise = (list: List & { anaesthetistId: string }, built: BuiltBooking, pairIds: readonly string[], atISO: string): void => {
    for (const pairId of pairIds) {
      const pair = ledger[pairId]
      if (pair === undefined || pair.kind !== 'prePayment') continue
      const id = nextId('prepayTransfer')
      const made = newPrepayTransfer({ id, collectPair: pair as BookingLedgerPair, listId: list.id, payerKey: refKey(payerCounterparty(built.procedures[0]!, built.patient.hiddenInternalId)), payeeAnaesthetistId: list.anaesthetistId, atISO, transfers })
      if (!made.ok) continue
      // Its Xero manual journal, as the runtime posts it (27a: debit the AA Holding account, credit the anaesthetist).
      const invoice = invoices[made.transfer.invoiceId]
      const journalId = nextId('xeroJournal')
      const description = `Transfer of prepayment ${invoice?.invoiceNumber ?? made.transfer.invoiceId}`
      const anaesthetist = anaesthetists[list.anaesthetistId]!
      journals[journalId] = {
        id: journalId,
        journalNumber: nextId('xeroJournalNumber'),
        transferId: id,
        reference: invoice?.invoiceNumber ?? made.transfer.invoiceId,
        dateISO: atISO,
        lines: [
          { contactId: holdingContactId(), description, debit: made.transfer.in.amount, credit: 0 },
          { contactId: contactFor('anaesthetist', anaesthetist.registrationNumber, anaesthetist.name, 'organisation'), description, debit: 0, credit: made.transfer.in.amount },
        ],
      }
      transfers[id] = { ...made.transfer, xeroJournalId: journalId }
      audited({ entityType: 'ledgerPair', entityId: pairId, who: 'Billing run', role: 'system', source: 'system', action: 'prepayment.transfer', atISO, after: { transferId: id, to: list.anaesthetistId, amount: made.transfer.in.amount } })
    }
  }

  let invoicesRaised = 0
  let problemLists = 0
  for (const list of toBill) {
    const rng = stream('list', list.id)
    const count = Math.max(1, Math.floor(mean + rng()))
    const built = placeBookings(list, count, true, rng)
    const anaesthetistName = anaesthetists[list.anaesthetistId]!.name
    const submittedAtISO = `${list.dateISO}T17:30:00`
    for (const b of built) {
      audited({ entityType: 'booking', entityId: b.booking.id, who: officeWho, role: 'office', source: 'office', action: 'booking.create', atISO: `${addDaysISO(list.dateISO, -7)}T09:00:00`, after: { listId: list.id, patientId: b.patient.hiddenInternalId } })
      // The office set each Procedure's Contract on the rail (the runtime's code).
      for (const proc of b.procedures) audited({ entityType: 'procedure', entityId: proc.id, who: officeWho, role: 'office', source: 'office', action: 'procedure.contract', atISO: `${addDaysISO(list.dateISO, -7)}T09:05:00`, after: { contractId: proc.governingContractId } })
      audited({ entityType: 'booking', entityId: b.booking.id, who: anaesthetistName, role: 'anaesthetist', source: 'anaesthetist', action: 'booking.complete', atISO: b.booking.completedAtISO ?? submittedAtISO })
    }
    audited({ entityType: 'list', entityId: list.id, who: anaesthetistName, role: 'anaesthetist', source: 'anaesthetist', action: 'list.submit', atISO: submittedAtISO, after: { state: 'SUBMITTED' } })
    if (backlogDates.has(list.dateISO)) {
      lists[list.id] = { ...list, state: 'SUBMITTED' }
      continue
    }
    const authorisedAtISO = `${addDaysISO(list.dateISO, 1)}T10:00:00`
    const billedAtISO = `${addDaysISO(list.dateISO, 1)}T17:00:00`
    if (authorisedAtISO.slice(0, 10) >= todayISO) {
      lists[list.id] = { ...list, state: 'SUBMITTED' }
      continue
    }
    lists[list.id] = { ...list, state: 'AUTHORISED', billedAtISO }
    audited({ entityType: 'list', entityId: list.id, who: officeWho, role: 'office', source: 'office', action: 'list.authorise', atISO: authorisedAtISO, after: { state: 'AUTHORISED' } })
    // A practice-sized handful of problems the processing monitor recognises (37): a billing exception.
    const problem = problemRng() < FULL_SCALE.monitorProblemShare
    for (const [i, b] of built.entries()) {
      const prepaid = b.procedures.some((p) => contracts[p.governingContractId ?? '']?.prepaid === true)
      let leftOff: InvoiceBuildContext['prepaidLeftOff']
      let held: InvoiceBuildContext['held']
      if (prepaid) {
        const raisedPrepayment = raisePrepayment(list, b, `${addDaysISO(list.dateISO, -7)}T09:30:00`)
        leftOff = raisedPrepayment.leftOff
        held = raisedPrepayment.held
        transferAtAuthorise(list, b, raisedPrepayment.pairIds, authorisedAtISO)
      }
      if (problem && i === 0) {
        const bxId = nextId('billingException')
        exceptions[bxId] = { id: bxId, bookingId: b.booking.id, listId: list.id, code: 'deliveryFailed', message: 'The invoice could not be raised: the billing run stopped before this Booking. Retry from the monitor.', atISO: billedAtISO }
        audited({ entityType: 'booking', entityId: b.booking.id, who: 'Billing run', role: 'system', source: 'system', action: 'booking.billingException', atISO: billedAtISO, after: { billingExceptionId: bxId } })
        continue
      }
      invoicesRaised += raiseInvoices(list, b, authorisedAtISO, billedAtISO, leftOff, held)
    }
    if (problem) {
      problemListIds.push(list.id)
      problemLists += 1
    }
  }

  // -------------------------------------------------------------------------
  // 9. Forward Bookings on the 71's ACTIVE Lists (richest over the next ten days)
  // -------------------------------------------------------------------------
  const forwardEnd = addDaysISO(todayISO, FULL_SCALE.forwardDays)
  for (const list of generated.lists) {
    if (list.dateISO < todayISO || list.dateISO > forwardEnd || list.state !== 'ACTIVE' || list.anaesthetistId === undefined) continue
    const rng = stream('forward', list.id)
    const daysAhead = (Date.parse(list.dateISO) - Date.parse(todayISO)) / 86400000
    if (rng() > 0.95 * (1 - daysAhead / (FULL_SCALE.forwardDays + 4))) continue
    const count = intBetween(rng, FULL_SCALE.forwardBookingsPerList.min, FULL_SCALE.forwardBookingsPerList.max)
    const built = placeBookings(list as List & { anaesthetistId: string }, count, false, rng)
    for (const b of built) audited({ entityType: 'booking', entityId: b.booking.id, who: officeWho, role: 'office', source: 'office', action: 'booking.create', atISO: b.booking.lastModifiedAtISO, after: { listId: list.id, patientId: b.patient.hiddenInternalId } })
  }

  // -------------------------------------------------------------------------
  // 9b. A few stubs (33a, D66): a hospital row with no NHI waits at intake, its stub on the List
  // -------------------------------------------------------------------------
  const batches = { ...base.intake.batches }
  const rows = { ...base.intake.rows }
  const stubs = { ...base.intake.stubs }
  let stubCount = 0
  const stubRng = stream('stubs')
  const stubTargets = generated.lists
    .filter((l) => l.state === 'ACTIVE' && l.dateISO > addDaysISO(todayISO, 2) && l.dateISO <= forwardEnd && (l.hospitalId === HOSP.stg || l.hospitalId === HOSP.sx))
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.id.localeCompare(b.id))
  for (const list of stubTargets) {
    if (stubCount >= FULL_SCALE.stubs) break
    if (stubRng() < 0.7) continue
    const receivedAtISO = `${todayISO}T07:30:00`
    const hospitalName = base.masters.hospitals[list.hospitalId]?.name ?? list.hospitalId
    const label = `${hospitalName} theatre list, ${list.dateISO}`
    const batchId = nextId('importBatch')
    const rowId = nextId('importRow')
    const surgeon = surgeons[list.surgeonId]
    const row: ImportRow = {
      id: rowId,
      batchId,
      channel: 'download',
      source: 'hospital',
      receivedAtISO,
      incoming: {
        hospitalId: list.hospitalId,
        dateISO: list.dateISO,
        session: list.session,
        surgeon: { name: surgeon?.name ?? list.surgeonId, ...(surgeon?.hpiId !== undefined ? { hpiId: surgeon.hpiId } : {}) },
        scheduledTime: list.session === 'AM' ? '11:30' : '16:00',
        patient: { name: `${pick(stubRng, FIRST_NAMES)} ${pick(stubRng, SURNAMES)}`, dobISO: `19${intBetween(stubRng, 40, 99)}-0${intBetween(stubRng, 1, 9)}-1${intBetween(stubRng, 0, 9)}` },
        procedure: { text: pick(stubRng, ['Lap chole', 'Knee scope', 'Hernia repair', 'Cystoscopy']) },
        hospitalStatus: 'booked',
      },
      status: 'open',
    }
    row.raw = rawRowFor(row.incoming, row.channel)
    const stub = stubFor(row, { id: list.id, state: list.state }, label, receivedAtISO)
    if (stub === undefined) continue
    rows[rowId] = row
    batches[batchId] = { id: batchId, channel: 'download', source: 'hospital', hospitalId: list.hospitalId, label, importedBy: officeWho, importedAtISO: receivedAtISO, rowIds: [rowId], skippedCount: 0 }
    const stubId = nextId('stub')
    stubs[stubId] = { id: stubId, ...stub }
    stubCount += 1
  }

  // Each generated Procedure's text arrival and its invoice description (20a's one chain).
  const generatedProcedures: Record<string, Procedure> = {}
  for (const [id, p] of Object.entries(procedures)) if (base.schedule.procedures[id] === undefined) generatedProcedures[id] = p
  finaliseSeedProcedureTexts(generatedProcedures, bookings, lists, contracts)
  Object.assign(procedures, generatedProcedures)

  // -------------------------------------------------------------------------
  // 10. AA's monthly fee invoices (16, D1): one per generated anaesthetist per month
  // -------------------------------------------------------------------------
  const records = bctiRecordsOf(Object.values(ledger).filter((p) => p.kind === 'procedure' && p.anaesthetistId !== undefined && generatedSet.has(p.anaesthetistId)))
  const recordsByAnaesthetist = new Map<string, typeof records>()
  for (const r of records) {
    const bucket = recordsByAnaesthetist.get(r.anaesthetistId)
    if (bucket === undefined) recordsByAnaesthetist.set(r.anaesthetistId, [r])
    else bucket.push(r)
  }
  const months: string[] = []
  for (let d = historyStartISO.slice(0, 7); d < todayISO.slice(0, 7); ) {
    months.push(d)
    const y = Number(d.slice(0, 4))
    const m = Number(d.slice(5, 7))
    d = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1, 2)}`
  }
  const feeSettings: AaFeeSettings = base.appSettings.aaFee
  let aaFeeCount = 0
  let feeN = 0
  for (const aid of generatedAnaesthetistIds) {
    const mine = recordsByAnaesthetist.get(aid) ?? []
    const issued: AaFeeInvoice[] = []
    const payeeContactId = contactFor('anaesthetist', aid, anaesthetists[aid]!.name, 'organisation')
    for (const monthISO of months) {
      const y = Number(monthISO.slice(0, 4))
      const m = Number(monthISO.slice(5, 7))
      const raisedDate = m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1, 2)}-01`
      if (raisedDate >= todayISO) continue
      const raisedAtISO = `${raisedDate}T09:00:00`
      feeN += 1
      const built = buildAaFeeInvoice({
        id: nextId('aaFeeInvoice'),
        invoiceNumber: `AA-FEE-S-${pad(feeN, 6)}`,
        ledgerPairId: nextId('ledgerPair'),
        anaesthetistId: aid,
        monthISO,
        settings: feeSettings,
        counted: bctisFor(mine, aid, monthISO, BCTI_COUNT_RULE, bctiFeeHistory(issued, aid)),
        raisedAtISO,
        raisedBy: 'scheduled',
      })
      const accRecId = nextId('xeroAccRec')
      let pair = { ...built.pair, receivable: { ...built.pair.receivable, xeroAccRecId: accRecId } }
      const paidAt = addDaysISO(raisedDate, 5)
      if (paidAt < todayISO) {
        const paidAtISO = `${paidAt}T10:00:00`
        pair = applyReceipt(pair, built.invoice.total, paidAtISO).pair
        const key = `FS-AAFEE-${built.invoice.id}`
        const pmtId = nextId('paymentIn')
        payments[pmtId] = { id: pmtId, accRecId, amount: built.invoice.total, atISO: paidAtISO, idempotencyKey: key, source: 'aaFee' }
        const rctId = nextId('receipt')
        receipts[rctId] = { id: rctId, pairId: pair.id, pairKind: 'aaFee', accRecId, grossAmount: built.invoice.total, gstAmount: gstComponentOf(built.invoice.total), atISO: paidAtISO, idempotencyKey: key, source: 'aaFee' }
      }
      aaFeeInvoices[built.invoice.id] = built.invoice
      issued.push(built.invoice)
      ledger[pair.id] = pair
      accRecs[accRecId] = { ...aaFeeAccRecFor(built.invoice, pair, { accRecId, contactId: payeeContactId, issuedAtISO: raisedAtISO }), ...(paidAt < todayISO ? { amountReceived: built.invoice.total, status: 'paid' as const, paidAtISO: `${paidAt}T10:00:00` } : {}) }
      audited({ entityType: 'aaFeeInvoice', entityId: built.invoice.id, who: 'AA fee run', role: 'system', source: 'system', action: 'aaFee.invoiceRaised', atISO: raisedAtISO, after: { invoiceNumber: built.invoice.invoiceNumber, monthISO, total: built.invoice.total } })
      aaFeeCount += 1
    }
  }

  // -------------------------------------------------------------------------
  // 11. Archive by the real rule, then count the active contacts
  // -------------------------------------------------------------------------
  const archivable = eligibleArchiveContactIdsOf({ contacts, accRecs, payments, invoices, todayISO, windowDays: base.settings.contactArchiveInactivityDays })
  for (const id of archivable) contacts[id] = { ...contacts[id]!, archived: true }
  const activeContacts = Object.values(contacts).filter((c) => !c.archived).length

  // -------------------------------------------------------------------------
  // 12. The audit: the runtime's own codes, by date, ids from the counter, then the load entry
  // -------------------------------------------------------------------------
  audit.sort((a, b) => a.atISO.localeCompare(b.atISO))
  for (const entry of audit) entry.id = nextId('audit')
  const generatedSlotsInHorizon = generated.slots.filter((s) => s.dateISO >= todayISO).length
  const allSlots = Object.values(slots)
  const slotsInHorizon = allSlots.filter((s) => s.dateISO >= todayISO && s.dateISO <= horizon.endISO).length
  const invoiceCount = Object.keys(invoices).length
  const invoicesLast12Months = Object.values(invoices).filter((i) => (i.raisedAtISO ?? '').slice(0, 10) >= historyStartISO && (i.raisedAtISO ?? '').slice(0, 10) < todayISO).length
  const auditEntries = base.audit.length + audit.length + 1
  const loaded: AuditEntry = {
    id: nextId('audit'),
    entityType: 'demo',
    entityId: 'fullScale',
    who: 'Demo control',
    role: 'office',
    source: 'demo',
    action: 'demo.fullScaleLoaded',
    // The newest entry: just after the latest already in the trail (the seed holds a few later today).
    atISO: latestAfter([...base.audit, ...audit].reduce((m, e) => (e.atISO > m ? e.atISO : m), `${todayISO}T08:00:00`)),
    after: { anaesthetists: Object.keys(anaesthetists).length, sessions: slotsInHorizon, invoices: invoicesLast12Months, auditEntries },
  }

  const counts: FullScaleCounts = {
    anaesthetists: Object.keys(anaesthetists).length,
    slotsInHorizon,
    slotsTotal: allSlots.length,
    lists: Object.keys(lists).length,
    draftLists: Object.values(lists).filter((l) => l.state === 'DRAFT').length,
    recurringBookings: Object.keys(recurringBookings).length,
    bookings: Object.keys(bookings).length,
    procedures: Object.keys(procedures).length,
    prepaidBookings,
    patients: Object.keys(patients).length,
    invoices: invoiceCount,
    invoicesLast12Months,
    aaFeeInvoices: Object.keys(aaFeeInvoices).length,
    ledgerPairs: Object.keys(ledger).length,
    xeroContacts: Object.keys(contacts).length,
    activeContacts,
    auditEntries,
    stubs: stubCount,
    // Events (38b) are not generated: their raising and billing live in the store's actions, not a pure builder (logged for the owner).
    events: 0,
    publicSessions,
    problemLists,
  }
  void generatedSlotsInHorizon
  void invoicesRaised
  void aaFeeCount
  void validateNhi

  const state = {
    ...base,
    masters: { ...base.masters, anaesthetists, surgeons, parties, contracts, patients, recurringBookings },
    schedule: { ...base.schedule, slots, lists, bookings, procedures },
    billing: { ...base.billing, invoices, invoiceLines, ledger, receipts, disbursements: ledgerDisbursements, exceptions, contactIdCache, aaFeeInvoices, locks, transfers },
    xero: { ...base.xero, contacts, accRecs, accPays, payments, disbursements: xeroDisbursements, journals },
    intake: { ...base.intake, batches, rows, stubs },
    audit: [...base.audit, ...audit, loaded],
    counters,
    settings: { ...base.settings, volumeStory: { ...base.settings.volumeStory, activeContacts, invoicesPerYear: invoicesLast12Months } },
  } as S
  return { state, counts, problemListIds }
}
