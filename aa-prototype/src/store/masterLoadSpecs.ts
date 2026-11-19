/**
 * The seed load's sheets (catch-up Phase 42; US-13.4.3, DM-38; AR-58 section
 * 8): one spec per master, in load order. Each maps its columns onto the
 * fields the master's own planner takes (beside its create action) and
 * resolves names against the working masters; it declares no second shape and
 * no second rule. A blank optional number cell is not set and 0 is a value,
 * through `parseOptionalNumber`. The template's headers are the contract.
 *
 * The specs live in the store, not `domain/masterLoad`, because their fields
 * are the planners' input types (`SurgeonFields`, `ContractInput`, ...),
 * which the store owns; the engine, the CSV and the samples stay in the domain.
 *
 * No sheet for: surgeon groups, recurring bookings, availability statuses,
 * preferences and priority tiers, body sections, the open-price fallbacks
 * (18a makes them), No contract · RVG, the RVG modifier table (built from
 * AR-34's files by 19b) and Contract event fees (39b is not built yet).
 */

import type { LoaderSpec, LoadEntity } from '../domain/masterLoad/types'
import { DATE_INVALID, foldName, parseDateCell, parseListCell, parseOptionalNumber, parseYesNo } from '../domain/masterLoad/validate'
import { normaliseAaCode } from '../domain/billing/contracts'
import { suggestCodePrefix } from '../domain/billing/parties'
import { normaliseTagCode } from '../domain/billing/fundingTags'
import { normaliseHpiCpn } from '../domain/surgeons'
import type { Contract, DeliveryMethod, PartyKind, PublicHoliday } from '../domain/types'
import type { PublicHolidayFields } from '../domain/masterValidation'
import type { RvgGroupInput } from '../domain/billing/rvgGroups'
import type { AppState } from './appStore'
import type { Planner } from './masterPlanners'
import { planAnaesthetistCreate, planHospitalCreate, planHospitalHolidayCreate, type NewAnaesthetistFields } from './mastersActions'
import { planSurgeonCreate, type SurgeonFields } from './surgeonActions'
import { planSpecialtyCreate } from './specialtyActions'
import { planRvgGroupCreate } from './rvgGroupActions'
import { planAaModifierCreate, type AaModifierInput } from './modifierActions'
import { planPartyCreate, type PartyFields } from './partyActions'
import { planFundingTagCreate, type FundingTagFields } from './fundingTagActions'
import { planContractCreate, planPriceRangeAdd, type ContractInput } from './contractActions'
import { planPublicHolidayCreate } from './publicHolidayActions'

type Masters = AppState['masters']

/** A sheet's spec with the planner its valid rows fold through. */
export interface StoreLoaderSpec<F> extends LoaderSpec<F, Masters> {
  plan: Planner<F>
}

const col = (key: string, header: string, required: boolean, hint?: string) => ({ key, header, required, ...(hint !== undefined ? { hint } : {}) })

/** A name cell resolved by folded name, or the reason it is not one. */
function byName<T extends { id: string; name: string }>(rows: Readonly<Record<string, T>>, name: string): T | undefined {
  const f = foldName(name)
  return Object.values(rows).find((r) => foldName(r.name) === f)
}

const numberReason = (header: string): string => `${header} must be a number.`

// ---------------------------------------------------------------------------
// Specialties (US-13.4.4; AR-58 2.5)
// ---------------------------------------------------------------------------

const specialties: StoreLoaderSpec<{ name: string }> = {
  entity: 'specialties',
  label: 'Specialties',
  columns: [col('name', 'Name', true)],
  keyColumns: ['Name'],
  parseRow: (c) => ({ fields: { name: c['Name'] ?? '' } }),
  keyOf: (f) => foldName(f.name),
  // 18a's own rule names a duplicate; the load adds to the seeded list and never overwrites it.
  existing: () => false,
  plan: planSpecialtyCreate,
}

// ---------------------------------------------------------------------------
// Surgeons, in the shape of AA's specialist list (D74, D76, D89)
// ---------------------------------------------------------------------------

const TITLE = /^(dr|mr|mrs|ms|miss|mx|prof|professor|assoc prof|a\/prof)\.?\s+/i

/** What a loaded surgeon's name leaves for admin staff to complete (D89, OQ-143 open: loaded and listed). */
export function surgeonNameNotes(name: string): string[] {
  const t = name.trim()
  const notes: string[] = []
  const hasTitle = TITLE.test(t)
  if (!hasTitle) notes.push('No title: complete it in Master data.')
  const rest = t.replace(TITLE, '').trim()
  if (rest.split(/\s+/).filter((w) => w !== '').length < 2) notes.push('No surname: complete it in Master data.')
  return notes
}

const surgeons: StoreLoaderSpec<SurgeonFields> = {
  entity: 'surgeons',
  label: 'Surgeons',
  columns: [
    col('name', 'Name', true),
    col('specialty', 'Specialty', true, 'One or more from the specialties list, separated by ";"'),
    col('practices', 'Practice names', false, 'Separated by ";", the main practice first'),
    col('emails', 'Practice emails', false, 'One per practice, in the same order'),
    col('pas', 'PA names', false, 'One per practice, in the same order'),
    col('hpi', 'HPI CPN', false, 'May be left blank: admin staff fill it in'),
    col('reg', 'NZ registration number', false, 'For information'),
  ],
  hint: 'A surgeon needs at least one specialty; an HPI CPN may be left blank.',
  keyColumns: ['Name', 'HPI CPN'],
  parseRow: (c, masters) => {
    const reasons: string[] = []
    const names = parseListCell(c['Specialty'] ?? '')
    const specialtyIds: string[] = []
    for (const n of names) {
      const s = byName(masters.specialties, n)
      if (s === undefined) reasons.push(`No specialty named ${n}.`)
      else specialtyIds.push(s.id)
    }
    if (reasons.length > 0) return { reasons }
    const practices = parseListCell(c['Practice names'] ?? '')
    const emails = parseListCell(c['Practice emails'] ?? '')
    const pas = parseListCell(c['PA names'] ?? '')
    const contacts = Array.from({ length: Math.max(practices.length, emails.length, pas.length) }, (_, i) => ({
      ...(pas[i] !== undefined ? { name: pas[i] } : {}),
      ...(emails[i] !== undefined ? { email: emails[i] } : {}),
    }))
    const name = c['Name'] ?? ''
    const fields: SurgeonFields = {
      name,
      specialtyIds,
      ...(practices.length > 0 ? { practiceName: practices.join(' and ') } : {}),
      officeContacts: contacts,
      hpiId: c['HPI CPN'] ?? '',
      medicalRegistrationNumber: c['NZ registration number'] ?? '',
    }
    return { fields, notes: name.trim() === '' ? [] : surgeonNameNotes(name) }
  },
  keyOf: (f) => {
    const hpi = normaliseHpiCpn(f.hpiId ?? '')
    return hpi !== '' ? `hpi:${hpi}` : `name:${foldName(f.name)}|${foldName((f.practiceName ?? '').split(' and ')[0] ?? '')}`
  },
  existing: (f, masters) => {
    const hpi = normaliseHpiCpn(f.hpiId ?? '')
    if (hpi !== '') return false // a held HPI CPN is 17b's unique-when-held rule, word for word
    const practice = foldName((f.practiceName ?? '').split(' and ')[0] ?? '')
    return Object.values(masters.surgeons).some((s) => foldName(s.name) === foldName(f.name) && foldName((s.practiceName ?? '').split(' and ')[0] ?? '') === practice)
  },
  plan: planSurgeonCreate,
}

// ---------------------------------------------------------------------------
// Anaesthetists (26's and 28's fields)
// ---------------------------------------------------------------------------

const anaesthetists: StoreLoaderSpec<NewAnaesthetistFields> = {
  entity: 'anaesthetists',
  label: 'Anaesthetists',
  columns: [
    col('reg', 'Registration number', true),
    col('name', 'Name', true),
    col('email', 'Email', false),
    col('phone', 'Phone', false),
    col('hpi', 'HPI CPN', true),
    col('unit', 'Unit value', true, 'Dollars per unit'),
    col('bankName', 'Bank account name', true),
    col('bankNumber', 'Bank account number', true),
    col('start', 'Start date', true),
  ],
  hint: 'Each anaesthetist gets their Slots from the start date.',
  keyColumns: ['Registration number', 'Name'],
  parseRow: (c) => {
    const reasons: string[] = []
    const unit = parseOptionalNumber(c['Unit value'] ?? '')
    if (unit !== null && Number.isNaN(unit)) reasons.push(numberReason('Unit value'))
    const start = parseDateCell(c['Start date'] ?? '')
    if (start === null) reasons.push(DATE_INVALID)
    if (reasons.length > 0) return { reasons }
    return {
      fields: {
        registrationNumber: c['Registration number'] ?? '',
        name: c['Name'] ?? '',
        email: c['Email'] ?? '',
        phone: c['Phone'] ?? '',
        hpiId: c['HPI CPN'] ?? '',
        unitValue: unit ?? 0,
        bankAccount: { accountName: c['Bank account name'] ?? '', accountNumber: c['Bank account number'] ?? '' },
        startDateISO: start!,
      },
    }
  },
  keyOf: (f) => f.registrationNumber.trim(),
  existing: (f, masters) => masters.anaesthetists[f.registrationNumber.trim()] !== undefined,
  plan: planAnaesthetistCreate,
}

// ---------------------------------------------------------------------------
// Hospitals and the two calendars
// ---------------------------------------------------------------------------

const hospitals: StoreLoaderSpec<{ name: string; contactEmail?: string }> = {
  entity: 'hospitals',
  label: 'Hospitals',
  columns: [col('name', 'Hospital name', true), col('email', 'Contact email', true, 'For booking updates; may be left blank')],
  keyColumns: ['Hospital name'],
  parseRow: (c) => ({ fields: { name: c['Hospital name'] ?? '', contactEmail: c['Contact email'] ?? '' } }),
  keyOf: (f) => foldName(f.name),
  existing: (f, masters) => f.name.trim() !== '' && byName(masters.hospitals, f.name) !== undefined,
  plan: planHospitalCreate,
}

const hospitalHolidays: StoreLoaderSpec<{ hospitalId: string; dateISO: string; name: string }> = {
  entity: 'hospitalHolidays',
  label: 'Hospital holidays',
  columns: [col('hospital', 'Hospital', true), col('date', 'Date', true), col('name', 'Name', true)],
  keyColumns: ['Hospital', 'Date'],
  parseRow: (c, masters) => {
    const reasons: string[] = []
    const hospital = byName(masters.hospitals, c['Hospital'] ?? '')
    if (hospital === undefined) reasons.push(`No hospital named ${c['Hospital'] ?? ''}.`)
    const dateISO = parseDateCell(c['Date'] ?? '')
    if (dateISO === null) reasons.push(DATE_INVALID)
    if (reasons.length > 0) return { reasons }
    return { fields: { hospitalId: hospital!.id, dateISO: dateISO!, name: c['Name'] ?? '' } }
  },
  keyOf: (f) => `${f.hospitalId}|${f.dateISO}`,
  // 30's own rule refuses a second closure on a hospital's date, in its words.
  existing: () => false,
  plan: planHospitalHolidayCreate,
}

const KINDS: Record<string, PublicHoliday['kind']> = { national: 'national', regional: 'regional' }

const publicHolidays: StoreLoaderSpec<PublicHolidayFields> = {
  entity: 'publicHolidays',
  label: 'Public holidays',
  columns: [
    col('date', 'Date', true),
    col('name', 'Name', true),
    col('kind', 'Kind', true, 'National or Regional'),
    col('region', 'Region', false),
    col('open', 'Open hospitals', false, 'Hospital names separated by ";"; every other hospital is closed'),
  ],
  keyColumns: ['Date', 'Name'],
  parseRow: (c, masters) => {
    const reasons: string[] = []
    const dateISO = parseDateCell(c['Date'] ?? '')
    if (dateISO === null) reasons.push(DATE_INVALID)
    const kind = KINDS[(c['Kind'] ?? '').trim().toLowerCase()]
    if (kind === undefined) reasons.push('Kind must be National or Regional.')
    const openHospitalIds: string[] = []
    for (const n of parseListCell(c['Open hospitals'] ?? '')) {
      const h = byName(masters.hospitals, n)
      if (h === undefined) reasons.push(`No hospital named ${n}.`)
      else openHospitalIds.push(h.id)
    }
    if (reasons.length > 0) return { reasons }
    const region = c['Region'] ?? ''
    return { fields: { dateISO: dateISO!, name: c['Name'] ?? '', kind: kind!, ...(region !== '' ? { region } : {}), openHospitalIds } }
  },
  keyOf: (f) => f.dateISO,
  // One public holiday per date is the calendar's own rule, in its words.
  existing: () => false,
  plan: planPublicHolidayCreate,
}

// ---------------------------------------------------------------------------
// RVG groups (US-05.1.1) and AA's own modifiers (US-05.1.5)
// ---------------------------------------------------------------------------

/** A whole-number cell for 19's rules: blank is NaN unless `blank` is given. */
function units(cell: string, blank?: number): number {
  const n = parseOptionalNumber(cell)
  return n === null ? (blank ?? Number.NaN) : n
}

const rvgGroups: StoreLoaderSpec<RvgGroupInput> = {
  entity: 'rvgGroups',
  label: 'RVG groups',
  columns: [
    col('code', 'Code', true),
    col('description', 'Description', true),
    col('anatomy', 'Anatomy heading', true),
    col('base', 'Base units', true, 'The starting figure, a whole number above 0'),
    col('from', 'Range from', false, 'Both range cells or neither'),
    col('to', 'Range to', false),
    col('modifier', 'Modifier units', false, 'Blank is 0'),
  ],
  hint: 'A code may appear on more than one row.',
  keyColumns: ['Code', 'Description'],
  parseRow: (c) => {
    const from = parseOptionalNumber(c['Range from'] ?? '')
    const to = parseOptionalNumber(c['Range to'] ?? '')
    const fields: RvgGroupInput = {
      code: c['Code'] ?? '',
      description: c['Description'] ?? '',
      anatomy: c['Anatomy heading'] ?? '',
      baseUnits: units(c['Base units'] ?? ''),
      // One cell of the two is not a range: 19's rule refuses it in its own words.
      baseUnitsRange: from === null && to === null ? undefined : { min: from ?? Number.NaN, max: to ?? Number.NaN },
      modifierUnits: units(c['Modifier units'] ?? '', 0),
    }
    return { fields }
  },
  keyOf: (f) => `${f.code.trim().toUpperCase()}|${foldName(f.description)}`,
  existing: (f, masters) =>
    Object.values(masters.rvgGroups).some((g) => g.code.trim().toUpperCase() === f.code.trim().toUpperCase() && foldName(g.description) === foldName(f.description)),
  plan: planRvgGroupCreate,
}

const modifiers: StoreLoaderSpec<AaModifierInput> = {
  entity: 'modifiers',
  label: "AA's own modifiers",
  columns: [col('code', 'Code', true), col('factor', 'Factor', true), col('units', 'Units', true, 'A whole number of 0 or more')],
  hint: 'The NZSA RVG 2021 modifier table is built from the catalogue, not loaded.',
  keyColumns: ['Code', 'Factor'],
  parseRow: (c) => ({ fields: { code: c['Code'] ?? '', factor: c['Factor'] ?? '', units: units(c['Units'] ?? '') } }),
  keyOf: (f) => f.code.trim().toLowerCase(),
  // 19b's rule refuses a code clashing with an AA row, in its words.
  existing: () => false,
  plan: planAaModifierCreate,
}

// ---------------------------------------------------------------------------
// Parties (US-04.1.5; AR-58 2.1) and funding tags (US-13.4.5; AR-58 2.6)
// ---------------------------------------------------------------------------

const PARTY_KINDS: Record<string, Exclude<PartyKind, 'aa'> | 'aa'> = {
  hospital: 'hospital',
  insurer: 'insurer',
  funder: 'funder',
  surgeon: 'surgeon',
  'surgeon group': 'surgeonGroup',
  anaesthetist: 'anaesthetist',
  aa: 'aa',
  'anaesthesia associates': 'aa',
}
const DELIVERY: Record<string, DeliveryMethod> = { email: 'email', post: 'post' }

const parties: StoreLoaderSpec<PartyFields> = {
  entity: 'parties',
  label: 'Parties',
  columns: [
    col('name', 'Name', true, 'The short name lists show'),
    col('kind', 'Kind', true, 'Hospital, Insurer, Funder, Surgeon, Surgeon group or Anaesthetist'),
    col('hospital', 'Hospital', false, "A hospital Party's hospital"),
    col('billingName', 'Billing name', false),
    col('delivery', 'Delivery', false, 'Email or Post; blank is not set'),
    col('email', 'Email', false),
    col('post', 'Postal address', false),
  ],
  keyColumns: ['Name', 'Kind'],
  parseRow: (c, masters) => {
    const reasons: string[] = []
    const kind = PARTY_KINDS[(c['Kind'] ?? '').trim().toLowerCase()]
    if (kind === undefined) reasons.push('Kind must be Hospital, Insurer, Funder, Surgeon, Surgeon group or Anaesthetist.')
    if (kind === 'aa') reasons.push('Anaesthesia Associates is built in and never loaded.')
    const deliveryCell = (c['Delivery'] ?? '').trim().toLowerCase()
    const delivery = deliveryCell === '' ? undefined : DELIVERY[deliveryCell]
    if (deliveryCell !== '' && delivery === undefined) reasons.push('Delivery must be Email or Post.')
    const hospitalCell = c['Hospital'] ?? ''
    const hospital = hospitalCell === '' ? undefined : byName(masters.hospitals, hospitalCell)
    if (hospitalCell !== '' && hospital === undefined) reasons.push(`No hospital named ${hospitalCell}.`)
    if (reasons.length > 0) return { reasons }
    const name = c['Name'] ?? ''
    return {
      fields: {
        kind: kind as Exclude<PartyKind, 'aa'>,
        name,
        codePrefix: suggestCodePrefix(name.trim(), new Set(Object.values(masters.parties).map((p) => p.codePrefix))),
        billingName: c['Billing name'] ?? '',
        email: c['Email'] ?? '',
        postalAddress: c['Postal address'] ?? '',
        ...(delivery !== undefined ? { deliveryMethod: delivery } : {}),
        ...(hospital !== undefined ? { hospitalId: hospital.id } : {}),
      },
    }
  },
  keyOf: (f) => foldName(f.name),
  existing: (f, masters) => f.name.trim() !== '' && byName(masters.parties, f.name) !== undefined,
  plan: planPartyCreate,
}

const fundingTags: StoreLoaderSpec<FundingTagFields> = {
  entity: 'fundingTags',
  label: 'Funding tags',
  columns: [col('code', 'Code', true), col('funder', 'Funder', false, "An insurer or funder Party's name")],
  hint: 'New tags join the end of the step rail order.',
  keyColumns: ['Code'],
  parseRow: (c, masters) => {
    const funderCell = c['Funder'] ?? ''
    if (funderCell === '') return { fields: { code: c['Code'] ?? '' } }
    const funder = byName(masters.parties, funderCell)
    if (funder === undefined) return { reasons: [`No Party named ${funderCell}.`] }
    return { fields: { code: c['Code'] ?? '', funderPartyId: funder.id } }
  },
  keyOf: (f) => normaliseTagCode(f.code),
  // 18a's rule refuses a code already held, in its words.
  existing: () => false,
  plan: planFundingTagCreate,
}

// ---------------------------------------------------------------------------
// Contracts, one per priced item (AR-58 2.2, 2.3, 5.10), and price ranges (2.4, 5.6)
// ---------------------------------------------------------------------------

const PRICING: Record<string, Contract['pricing']['kind']> = {
  'rvg at the anaesthetist’s rate': 'rvgAnaesthetistRate',
  "rvg at the anaesthetist's rate": 'rvgAnaesthetistRate',
  "rvg at the contract's rate": 'rvgContractRate',
  'rvg at the contract’s rate': 'rvgContractRate',
  'rvg less a discount': 'rvgDiscount',
  'fixed price': 'fixed',
  'open price': 'open',
}

export const OPEN_PRICE_LOAD_REFUSAL = 'Open-price Contracts are made by the system.'

/** The Contracts sheet's fields: 18's create input. */
const contracts: StoreLoaderSpec<ContractInput> = {
  entity: 'contracts',
  label: 'Contracts',
  columns: [
    col('aaCode', 'AA code', false, "Blank takes the holder's next code"),
    col('name', 'Name', true),
    col('party', 'Party', true, 'The holder, by short name'),
    col('ref', 'Holder reference code', false),
    col('desc', 'Invoice description', false),
    col('rvg', 'Default RVG code', false),
    col('bills', 'Bills', true, 'Holder or Payer'),
    col('payment', 'Payment type', true, 'Standard or Prepaid'),
    col('kind', 'Pricing kind', true, "RVG at the anaesthetist's rate, RVG at the Contract's rate, RVG less a discount, or Fixed price"),
    col('rate', 'Unit rate', false),
    col('discount', 'Discount (%)', false),
    col('price', 'Fixed price', false, "A fixed price's first range"),
    col('from', 'Price from', false),
    col('override', 'Anaesthetist may override', false, 'Yes or No'),
    col('tag', 'Funding tag', false),
    col('specialties', 'Specialties', false, 'Separated by ";"; none means every specialty'),
    col('surgeons', 'Surgeons', false, 'HPI CPNs separated by ";"'),
    col('anaesthetist', 'Anaesthetist', false, 'One HPI CPN'),
  ],
  hint: 'A blank cell is not set; 0 means zero.',
  keyColumns: ['AA code', 'Name'],
  parseRow: (c, masters) => {
    const reasons: string[] = []
    const holder = byName(masters.parties, c['Party'] ?? '')
    if (holder === undefined) reasons.push(`No Party named ${c['Party'] ?? ''}.`)
    const kind = PRICING[(c['Pricing kind'] ?? '').trim().toLowerCase()]
    if (kind === undefined) reasons.push("Pricing kind must be RVG at the anaesthetist's rate, RVG at the Contract's rate, RVG less a discount, or Fixed price.")
    if (kind === 'open') reasons.push(OPEN_PRICE_LOAD_REFUSAL)
    const billsCell = (c['Bills'] ?? '').trim().toLowerCase()
    const billsTo: Contract['billsTo'] | undefined = billsCell === 'holder' ? 'holder' : billsCell === 'payer' ? 'payer' : undefined
    if (billsTo === undefined) reasons.push('Bills must be Holder or Payer.')
    const paymentCell = (c['Payment type'] ?? '').trim().toLowerCase()
    const prepaid = paymentCell === 'prepaid' ? true : paymentCell === 'standard' ? false : null
    if (prepaid === null) reasons.push('Payment type must be Standard or Prepaid.')
    const override = parseYesNo(c['Anaesthetist may override'] ?? '', false)
    if (override === null) reasons.push('Anaesthetist may override must be Yes or No.')
    const rate = parseOptionalNumber(c['Unit rate'] ?? '')
    const discount = parseOptionalNumber(c['Discount (%)'] ?? '')
    const price = parseOptionalNumber(c['Fixed price'] ?? '')
    for (const [h, v] of [['Unit rate', rate], ['Discount (%)', discount], ['Fixed price', price]] as const) if (v !== null && Number.isNaN(v)) reasons.push(numberReason(h))
    const fromCell = c['Price from'] ?? ''
    const from = fromCell === '' ? null : parseDateCell(fromCell)
    if (fromCell !== '' && from === null) reasons.push(DATE_INVALID)
    const rvgCell = (c['Default RVG code'] ?? '').trim()
    const group = rvgCell === '' ? undefined : Object.values(masters.rvgGroups).find((g) => !g.retired && g.code.trim().toUpperCase() === rvgCell.toUpperCase())
    if (rvgCell !== '' && group === undefined) reasons.push(`No RVG group with code ${rvgCell}.`)
    const tagCell = c['Funding tag'] ?? ''
    const tag = tagCell === '' ? undefined : Object.values(masters.fundingTags).find((t) => t.code === normaliseTagCode(tagCell))
    if (tagCell !== '' && tag === undefined) reasons.push(`No funding tag ${tagCell}.`)
    const specialtyIds: string[] = []
    for (const n of parseListCell(c['Specialties'] ?? '')) {
      const s = byName(masters.specialties, n)
      if (s === undefined) reasons.push(`No specialty named ${n}.`)
      else specialtyIds.push(s.id)
    }
    const linkedSurgeonIds: string[] = []
    for (const hpi of parseListCell(c['Surgeons'] ?? '')) {
      const s = Object.values(masters.surgeons).find((x) => x.hpiId === normaliseHpiCpn(hpi))
      if (s === undefined) reasons.push(`No surgeon with HPI CPN ${hpi}.`)
      else linkedSurgeonIds.push(s.id)
    }
    const anaesthetistCell = (c['Anaesthetist'] ?? '').trim()
    const anaesthetist = anaesthetistCell === '' ? undefined : Object.values(masters.anaesthetists).find((a) => a.hpiId === normaliseHpiCpn(anaesthetistCell))
    if (anaesthetistCell !== '' && anaesthetist === undefined) reasons.push(`No anaesthetist with HPI CPN ${anaesthetistCell}.`)
    if (reasons.length > 0) return { reasons }
    // A cell on the wrong kind is passed through, so 18's guard refuses it in its own words.
    let pricing: Contract['pricing']
    switch (kind!) {
      case 'rvgContractRate':
        pricing = { kind: 'rvgContractRate', unitRate: rate ?? Number.NaN }
        break
      case 'rvgDiscount':
        pricing = { kind: 'rvgDiscount', discountPct: discount ?? Number.NaN }
        break
      case 'fixed':
        pricing = { kind: 'fixed', ranges: price !== null && from !== null ? [{ startISO: from, price }] : [] }
        break
      default:
        pricing = { kind: 'rvgAnaesthetistRate' }
    }
    const wrongCells =
      (kind !== 'rvgContractRate' && rate !== null) || (kind !== 'rvgDiscount' && discount !== null) || (kind !== 'fixed' && (price !== null || from !== null))
    if (wrongCells) return { reasons: ['A unit rate, discount or fixed price is set for a pricing kind that has none.'] }
    if (kind === 'fixed' && (price === null) !== (from === null)) return { reasons: ['A fixed price needs both its first price and the date it applies from.'] }
    return {
      fields: {
        aaCode: c['AA code'] ?? '',
        name: c['Name'] ?? '',
        holderId: holder!.id,
        billsTo: billsTo!,
        pricing,
        prepaid: prepaid!,
        anaesthetistMayOverridePrice: override!,
        linkedSurgeonIds,
        ...(anaesthetist !== undefined ? { linkedAnaesthetistId: anaesthetist.registrationNumber } : {}),
        holderReference: c['Holder reference code'] ?? '',
        invoiceDescription: c['Invoice description'] ?? '',
        defaultRvgGroupId: group?.id ?? null,
        specialtyIds,
        ...(tag !== undefined ? { fundingTagId: tag.id } : {}),
      },
    }
  },
  keyOf: (f) => ((f.aaCode ?? '').trim() !== '' ? `code:${normaliseAaCode(f.aaCode!)}` : `name:${foldName(f.name)}|${f.holderId}`),
  existing: (f, masters) => (f.aaCode ?? '').trim() !== '' && Object.values(masters.contracts).some((x) => normaliseAaCode(x.aaCode) === normaliseAaCode(f.aaCode!)),
  plan: planContractCreate,
}

const priceRanges: StoreLoaderSpec<{ contractId: string; range: { startISO: string; price: number } }> = {
  entity: 'priceRanges',
  label: 'Price ranges',
  columns: [col('aaCode', 'AA code', true), col('start', 'Start date', true, 'May be in the past'), col('price', 'Price (ex GST)', true)],
  hint: 'A blank cell is not set; 0 means zero.',
  keyColumns: ['AA code', 'Start date'],
  parseRow: (c, masters) => {
    const reasons: string[] = []
    const code = c['AA code'] ?? ''
    const contract = Object.values(masters.contracts).find((x) => normaliseAaCode(x.aaCode) === normaliseAaCode(code))
    if (contract === undefined) reasons.push(`No Contract with AA code ${code}.`)
    const startISO = parseDateCell(c['Start date'] ?? '')
    if (startISO === null) reasons.push(DATE_INVALID)
    const price = parseOptionalNumber(c['Price (ex GST)'] ?? '')
    if (price === null) reasons.push('A price range needs a price: the cell is blank.')
    else if (Number.isNaN(price)) reasons.push(numberReason('Price (ex GST)'))
    if (reasons.length > 0) return { reasons }
    return { fields: { contractId: contract!.id, range: { startISO: startISO!, price: price! } } }
  },
  keyOf: (f) => `${f.contractId}|${f.range.startISO}`,
  // 19a's rule refuses a repeated start on its Contract, in its words.
  existing: () => false,
  plan: planPriceRangeAdd,
}

/** Every sheet, by entity, in load order. */
export const LOADER_SPECS: { [E in LoadEntity]: StoreLoaderSpec<never> } = {
  specialties,
  surgeons,
  anaesthetists,
  hospitals,
  hospitalHolidays,
  publicHolidays,
  rvgGroups,
  modifiers,
  parties,
  fundingTags,
  contracts,
  priceRanges,
} as unknown as { [E in LoadEntity]: StoreLoaderSpec<never> }

/** A sheet's spec, typed loosely for the engine. */
export function specFor(entity: LoadEntity): StoreLoaderSpec<unknown> {
  return LOADER_SPECS[entity] as unknown as StoreLoaderSpec<unknown>
}
