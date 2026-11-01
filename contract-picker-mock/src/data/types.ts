export type HospitalId = 'ces' | 'stg' | 'sxh' | 'forte' | 'chch' | 'macmurray' | 'endo' | 'intus' | 'pacific'

export type HolderKind = 'aa' | 'hospital' | 'insurer' | 'surgeon' | 'anaesthetist'

/**
 * Ben's first question (decision tree, 30 Oct): where does the invoice go? To
 * the patient, to the List's hospital under one of its contracts, or under a
 * special contract (Bariatric, Unisports and the like).
 */
export type Branch = 'patient' | 'hospital' | 'special'

/** For the List's hospital: which of its contracts. Ben's three, as he names them. */
export type Arrangement = 'sxap' | 'hnz' | 'acc'

export type Pricing =
  /** Agreed fees, procedure by procedure: pre-filled once the procedure is chosen. */
  | { kind: 'lines' }
  /** Priced from the RVG. No `rate`: the anaesthetist fills in the card at their own unit value. */
  | { kind: 'rvg'; rate?: number; gst?: 'excl' | 'incl' }

export interface Contract {
  id: string
  /** As AA names it (Contracts AA.xlsx), or a plain description for the surgeon arrangements. */
  name: string
  holder: string
  holderKind: HolderKind
  /** Where Ben's tree puts it. */
  branch: Branch
  /** A hospital contract's type (SXAP, HNZ or ACC). */
  arrangement?: Arrangement
  /** The hospital whose Lists it is offered on (hospital-held Contracts). */
  hospitals?: HospitalId[]
  /** Surgeons whose Lists it is offered on, by practitioner ID. */
  surgeonIds?: string[]
  /** The anaesthetist whose own price list it is, by practitioner ID. */
  anaesthetistIds?: string[]
  /** Picking it starts a prepayment: its line's price is the prepaid amount (never a deposit). */
  isPrepay?: boolean
  pricing: Pricing
  /** No contract (RVG): the one default, always first. */
  isDefault?: boolean
  /** The holder receives the invoice; otherwise the patient does. */
  holderBilled: boolean
  /** In force from (and to), ISO dates: offered only on Lists inside these dates. */
  validFrom?: string
  validTo?: string
}

export interface Line {
  id: string
  contract: string
  code: string | null
  description: string
  /** The anaesthetist's fee as printed. */
  fee: number
  gst: 'incl' | 'excl' | 'unstated'
  band: string | null
  addOn: boolean
  /** An estimate ("approximate fees"), not a fixed price. */
  approx: boolean
  source: string
  /** The fee as the source printed it, before conversion to ex GST. */
  printed?: string
}

export interface Procedure {
  id: string
  section: string
  subgroup: string
  name: string
  rvg: string | null
  baseUnits: string | null
}

export interface RvgCode {
  code: string
  region: string
  sub: string | null
  description: string
  baseUnits: number | null
  maxUnits: number | null
}

export interface ReceivedText {
  source: 'Surgeon’s rooms' | 'Hospital'
  system: string
  at: string
  text: string
}

export interface Scenario {
  id: string
  title: string
  patient: { name: string; nhi: string; dob: string; age: number }
  date: string
  /** The List's day, ISO: Contracts are offered only if in force on it. */
  day: string
  /** The List's session. Nothing in the requirements filters on it. */
  session: 'AM' | 'PM'
  time: string
  contact: string
  hospitalId: HospitalId
  surgeon: { id: string; name: string }
  anaesthetist: { id: string; name: string }
  funder: string
  received: ReceivedText[]
  /** What the scenario is good for showing, for the presenter. */
  note: string
  /** Set up earlier by the office: the booking opens with these picks already made. */
  prefill?: { procedureId: string; selection: Selection }
}

/** What the office has picked for the procedure. */
export interface Selection {
  contractId: string
  lineId?: string
  rvgCode?: string
  /** A fixed price instead of the RVG: only on No contract (RVG), when the patient pays (Ben's "the RVG or another amount"). */
  amount?: number
  /** Which way the patient-paid price is being given, shared by the office and the phone. */
  priceBy?: 'rvg' | 'amount'
}
