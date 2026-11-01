import type { Contract, HospitalId } from './types'

/**
 * The Contracts: AA's list of 42 (Group 2/Contracts AA.xlsx, names kept as AA
 * writes them), plus No contract (RVG) and three surgeon arrangements from the
 * fee files, sorted into Ben's decision tree (30 Oct): the patient, the List's
 * hospital under SXAP, HNZ or ACC, or a special contract. Holder, hospital and
 * surgeon links are an illustrative reading of the names, not AA's records
 * (see README).
 *
 * Ten of them carry real agreed fees from the fee files (`lines` pricing). The
 * rest have none in the files, so they price from the RVG: the card goes to the
 * anaesthetist to fill in, which Ben says is most of them.
 */

export const HOSPITALS: Record<HospitalId, string> = {
  ces: 'Christchurch Eye Surgery',
  stg: 'St George’s Hospital',
  sxh: 'Southern Cross Hospital',
  forte: 'Forte Health',
  chch: 'Christchurch Hospital',
  macmurray: 'MacMurray Centre',
  endo: 'Southern Endo Centre',
  intus: 'Intus Christchurch',
  pacific: 'Pacific Radiology',
}

/** Fictional surgeons behind the arrangements and the scenarios. */
export const SURGEONS = {
  ophth: { id: 's-ophth', name: 'Dr Anna Whitcombe' },
  oculoplastic: { id: 's-oculo', name: 'Dr Rajiv Menon' },
  plasticSet: { id: 's-plastic-set', name: 'Dr Harriet Lowe' },
  plasticCard: { id: 's-plastic-card', name: 'Dr Oliver Pryce' },
  gynae: { id: 's-gynae', name: 'Dr Mei Tanaka' },
  ortho: { id: 's-ortho', name: 'Dr Sam Kerr' },
  general: { id: 's-general', name: 'Dr Tom Bright' },
  gastro: { id: 's-gastro', name: 'Dr Ana Ruru' },
} as const

/** Fictional anaesthetists: the bookings' and the prepay price lists'. */
export const ANAESTHETISTS = {
  fairbairn: { id: 'a-fairbairn', name: 'Dr Lucy Fairbairn' },
  hollis: { id: 'a-hollis', name: 'Dr Peter Hollis' },
  cole: { id: 'a-cole', name: 'Dr Hannah Cole' },
} as const

const rvg = { kind: 'rvg' } as const
const lines = { kind: 'lines' } as const

/** A hospital's own contract (SXAP, HNZ or ACC): the hospital is invoiced. */
const hosp = (id: string, name: string, h: HospitalId, holder: string, arrangement: Contract['arrangement'], pricing: Contract['pricing'] = rvg, extra: Partial<Contract> = {}): Contract => ({ id, name, holder, holderKind: 'hospital', branch: 'hospital', arrangement, hospitals: [h], holderBilled: true, pricing, ...extra })

/** A hospital's special contract (Bariatric, Cochlear and the like): offered on its own Lists. */
const special = (id: string, name: string, h: HospitalId, holder: string, pricing: Contract['pricing'] = rvg, extra: Partial<Contract> = {}): Contract => ({ id, name, holder, holderKind: 'hospital', branch: 'special', hospitals: [h], holderBilled: true, pricing, ...extra })

const CES = 'Christchurch Eye Surgery'
const STG = 'St George’s Hospital'
const SXH = 'Southern Cross Hospital'

export const CONTRACTS: Contract[] = [
  // The one default: no prices of its own, so the anaesthetist fills in the card at their own unit value.
  { id: 'no-contract', name: 'No contract (RVG)', holder: 'Anaesthesia Associates', holderKind: 'aa', branch: 'patient', holderBilled: false, pricing: rvg, isDefault: true },

  // Anaesthetists' own prepay price lists (illustrative): the patient is invoiced the full price before the day.
  ...Object.values(ANAESTHETISTS).map(
    (a): Contract => ({ id: `prepay-${a.id}`, name: `${a.name} prepay list`, holder: a.name, holderKind: 'anaesthetist', branch: 'patient', anaesthetistIds: [a.id], isPrepay: true, holderBilled: false, pricing: lines }),
  ),

  // ── Hospital contracts: SXAP, HNZ and ACC ────────────────────────────────
  // Christchurch Eye Surgery: agreed fees pre-filled for each contract (Ben). Its SXAP fee schedules are each a Contract.
  hosp('chch-eyes-sxap', 'Ch Ch Eyes SXAP', 'ces', CES, 'sxap', lines, { validFrom: '2026-04-01' }),
  hosp('sxap-migs', 'SXAP MIGS fee schedule', 'ces', CES, 'sxap', lines, { validFrom: '2026-04-01' }),
  hosp('sxap-ectropion', 'SXAP Ectropion and Entropion fee schedule', 'ces', CES, 'sxap', lines, { validFrom: '2026-04-01' }),
  hosp('sxap-pterygium', 'SXAP Pterygium and Pinguecula fee schedule', 'ces', CES, 'sxap', lines, { validFrom: '2026-04-01' }),
  hosp('sxap-ptosis-bleph', 'SXAP Ptosis and Blephs fee schedule', 'ces', CES, 'sxap', lines, { validFrom: '2026-04-01' }),
  hosp('sxap-skin-lesions', 'SXAP Skin Lesions fee schedule', 'ces', CES, 'sxap', lines, { validFrom: '2026-04-01' }),
  hosp('chch-eye-cdhb', 'Ch Ch Eye CDHB', 'ces', CES, 'hnz', lines),
  hosp('chch-eye-wcdhb', 'Ch Ch Eye WCDHB', 'ces', CES, 'hnz', lines),
  hosp('outplaced-ces', 'Outplaced CES', 'ces', CES, 'hnz', lines),
  hosp('chch-eye-acc', 'Ch Ch Eye ACC', 'ces', CES, 'acc', lines),

  hosp('stg-ltd-sxap', 'STG LTD SXAP', 'stg', STG, 'sxap'),
  hosp('stg-cdhb', 'STG CDHB Contracts', 'stg', STG, 'hnz'),
  hosp('stg-cdhb-dupuytrens', 'STG CDHB Dupuytrens', 'stg', STG, 'hnz'),
  hosp('stg-acc', 'STG ACC Clinical Services', 'stg', STG, 'acc'),
  hosp('stg-ltd-acc', 'STG LTD ACC', 'stg', STG, 'acc'),

  hosp('forte-sxap', 'Forte’ SXAP', 'forte', 'Forte Health', 'sxap'),
  hosp('forte-cdhb', 'Forte CDHB', 'forte', 'Forte Health', 'hnz'),
  hosp('forte-acc', 'Forte ACC', 'forte', 'Forte Health', 'acc'),

  hosp('sx-affiliated', 'SX Affiliated Provider', 'sxh', SXH, 'sxap'),
  hosp('sx-cdhb', 'SX CDHB', 'sxh', SXH, 'hnz'),
  hosp('sx-acc', 'SX ACC', 'sxh', SXH, 'acc'),
  hosp('sx-treatment-injury', 'SX Treatment Injury', 'sxh', SXH, 'acc'),

  // Southern Endo: SXAP and HNZ, no ACC (Ben's tree). AA's list has one "Southern Endo Centre"; split here to match.
  hosp('southern-endo-sxap', 'Southern Endo Centre SXAP', 'endo', 'Southern Endo Centre', 'sxap'),
  hosp('southern-endo-hnz', 'Southern Endo Centre HNZ', 'endo', 'Southern Endo Centre', 'hnz'),

  hosp('plastics-dhb', 'Plastics DHB', 'chch', 'Christchurch Hospital', 'hnz'),

  // ── Special contracts ────────────────────────────────────────────────────
  // The hospitals' own, offered on their Lists.
  special('stg-bariatric', 'STG Bariatric', 'stg', STG),
  special('stg-cochlear', 'STG Cochlear Implant', 'stg', STG),
  special('stg-eye', 'STG Eye Contract', 'stg', STG),
  special('stg-heart', 'STG Heart Centre', 'stg', STG),
  special('stg-heaton', 'STG Heaton Joint Venture', 'stg', STG),
  special('stg-inc', 'STG Inc', 'stg', STG),
  special('stg-rtt', 'STG Return to Theatre', 'stg', STG),
  special('sx-bariatric', 'SX Bariatric', 'sxh', SXH),
  special('sx-charity', 'SX Charity Trust', 'sxh', SXH),
  special('sx-eyes', 'SX Eyes Contract', 'sxh', SXH, lines),
  special('sx-radiology', 'SX Radiology', 'sxh', SXH),
  special('sx-robotic', 'SX Robotic Prostatectomy', 'sxh', SXH),
  special('macmurray', 'MacMurray Centre', 'macmurray', 'MacMurray Centre'),
  special('intus', 'Intus Christchurch Ltd', 'intus', 'Intus Christchurch'),
  special('pacific-radiology', 'Pacific Radiology', 'pacific', 'Pacific Radiology'),

  // Surgeons' contracts: one Contract linked to many surgeons, offered on those surgeons' Lists wherever they work.
  { id: 'unisports', name: 'Unisports Ortho Ltd', holder: 'Unisports Ortho', holderKind: 'surgeon', branch: 'special', surgeonIds: [SURGEONS.ortho.id], holderBilled: true, pricing: { kind: 'rvg', rate: 93.47, gst: 'excl' }, validFrom: '2026-10-01', validTo: '2027-06-30' },
  { id: 'boss-acc', name: 'BOSS BWD Ortho ACC', holder: 'BOSS BWD Ortho', holderKind: 'surgeon', branch: 'special', surgeonIds: [SURGEONS.ortho.id], holderBilled: true, pricing: rvg },
  { id: 'cant-ortho', name: 'Canterbury Orthopaedics', holder: 'Canterbury Orthopaedics', holderKind: 'surgeon', branch: 'special', surgeonIds: [], holderBilled: true, pricing: rvg },
  { id: 'ua-brachy', name: 'UA Brachytherapy Services', holder: 'Urology Associates', holderKind: 'surgeon', branch: 'special', surgeonIds: [], holderBilled: true, pricing: rvg },
  { id: 'urology-associates', name: 'Urology Associates', holder: 'Urology Associates', holderKind: 'surgeon', branch: 'special', surgeonIds: [], holderBilled: true, pricing: rvg },
  { id: 'cant-breastcare', name: 'Canterbury Breastcare', holder: 'Canterbury Breastcare', holderKind: 'surgeon', branch: 'special', surgeonIds: [], holderBilled: true, pricing: rvg },
  // Surgeons' set fees and estimates for self-funders: agreed fees, the patient invoiced.
  { id: 'merivale', name: 'Merivale Plastic Surgery set fees', holder: 'Merivale Plastic Surgery', holderKind: 'surgeon', branch: 'special', surgeonIds: [SURGEONS.plasticSet.id], holderBilled: false, pricing: lines, validFrom: '2026-06-01' },
  { id: 'plastics-fee-card', name: `Plastic surgery approximate fees (${SURGEONS.plasticCard.name})`, holder: SURGEONS.plasticCard.name, holderKind: 'surgeon', branch: 'special', surgeonIds: [SURGEONS.plasticCard.id], holderBilled: false, pricing: lines },
  { id: 'gynae-estimates', name: `Gynaecology anaesthetic cost estimates (${SURGEONS.gynae.name})`, holder: SURGEONS.gynae.name, holderKind: 'surgeon', branch: 'special', surgeonIds: [SURGEONS.gynae.id], holderBilled: false, pricing: lines },

  // Billed straight to the funder or insurer: no hospital or surgeon link, so offered on every List
  // (whether the patient's insurer should narrow this is open, OQ-93).
  { id: 'nib', name: 'NIB', holder: 'NIB', holderKind: 'insurer', branch: 'special', holderBilled: true, pricing: rvg },
  { id: 'nzdf', name: 'New Zealand Defence Force', holder: 'New Zealand Defence Force', holderKind: 'insurer', branch: 'special', holderBilled: true, pricing: rvg },
  { id: 'veterans', name: 'Veterans Affairs New Zealand', holder: 'Veterans Affairs New Zealand', holderKind: 'insurer', branch: 'special', holderBilled: true, pricing: rvg },
]
