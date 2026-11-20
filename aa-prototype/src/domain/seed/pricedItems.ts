/**
 * The seed's priced items: every fixed price is a Contract of its own with
 * dated price ranges (catch-up Phase 19a; US-04.2.15, US-04.2.18, US-04.2.11,
 * US-04.2.14, DM-09; AR-58 sections 8.2 and 8.3). DEMO-SIZED: a handful of
 * items per holder, figures from the fee files (`contract-picker-mock`
 * `lines.json`, seeded from `docs/discovery-reference/Contract Files/`);
 * Phase 43 seeds the full set.
 *
 * Readings (AR-58 8.2, 8.3):
 * - A schedule item's name and invoice description are its line description;
 *   its holder reference code is the line's code (not unique, A23); a time
 *   band is one Contract per band, the band in the name.
 * - Prices ex GST: incl-GST sources are divided (the vitrectomy bands, the
 *   SXAP cataract and Merivale's set fees print incl GST).
 * - One range each, from the source's date (CES SXAP 1 Apr 2026, Merivale
 *   1 Jun 2026), otherwise 1 Jan 2026 (A28); Doyle's list keeps its old
 *   figures as ranges.
 * - The default RVG code only where Phase 19 holds a matching row (H6a for
 *   eye work, H3 for face and nose, A8 and A7 for Doyle's); none for the
 *   breast items (T2 is ambiguous, AR-58 8.3).
 * - Fee extras (a GA add-on fee, "per 15 minutes over 120", Merivale's
 *   liposuction "per area") are not Contracts and are not seeded: they are
 *   events or additional invoices (A46; Phases 38b, 39b). A separately priced
 *   add-on (the anterior vitrectomy added to a cataract) stays a Contract.
 * - The rate Contracts (SXAP $26.50, Health NZ $23, ACC $25 and $24, Aria,
 *   Unisports) stay as Phase 18 left them, so no scripted figure moves.
 *
 * No seeded Procedure moves onto the CES items or Dr Souter's list (offering
 * is Phase 20's, the prepaid amount Phase 27's). One unedited Booking sits on
 * Merivale's Face lift (`seed/pricedItemBookings.ts`) for the backdated-range
 * demo.
 */

import type { ContractPricing, PriceRange } from '../types'
import { ANAE, SURG } from './cast'
import { PARTY } from './parties'
import { RVG_GROUP } from './rvgGroups'
import { SPC } from './specialties'
import { TAG } from './fundingTags'

/** A fixed price from its ranges (ex GST). */
export const fixed = (...ranges: [startISO: string, price: number][]): ContractPricing => ({
  kind: 'fixed',
  ranges: ranges.map(([startISO, price]): PriceRange => ({ startISO, price })),
})

/** A Merivale Plastic Surgery surgeon from the directory (Plastic surgery), linked beside Ms G. Lim. */
export const MERIVALE_DIRECTORY_SURGEON = 'S-WOLFENDEN'

export const PRICED_ITEM = {
  doyleSleeve: 'CT-DOYLE-SLEEVE',
  cesCataractIol: 'CT-CES-SXAP-CATIOL',
  cesBleph: 'CT-CES-SXAP-BLEPH',
  cesAntVit: 'CT-CES-SXAP-ANTVIT',
  cesVit60: 'CT-CES-SXAP-VIT60',
  cesVit90: 'CT-CES-SXAP-VIT90',
  cesVit120: 'CT-CES-SXAP-VIT120',
  cesHnzCataract: 'CT-CES-HNZ-CAT',
  cesAccCataract: 'CT-CES-ACC-CAT',
  merFaceLift: 'CT-MER-FACELIFT',
  merFaceLift1: 'CT-MER-FACELIFT-1',
  merFaceLift2: 'CT-MER-FACELIFT-2',
  souterRhinoplasty: 'CT-SOUTER-RHINO',
  souterBleph: 'CT-SOUTER-BLEPH',
  souterBreastAug: 'CT-SOUTER-BREAST',
  souterRhinoCosmetic: 'CT-SOUTER-RHINO-COS',
  beaumontRhinoplasty: 'CT-BEAUMONT-RHINO',
} as const

/** The fields a seeded priced item carries (the rest default as `buildContracts` sets them). */
export interface SeedPricedItem {
  id: string
  name: string
  holderId: string
  billsTo: 'holder' | 'payer'
  pricing: ContractPricing
  holderReference?: string
  invoiceDescription?: string
  defaultRvgGroupId?: string
  linkedSurgeonIds?: string[]
  linkedAnaesthetistId?: string
  prepaid?: boolean
  fundingTagId?: string
  specialtyIds?: string[]
}

const H6A = RVG_GROUP.h6a
const H3 = RVG_GROUP.h3

/** Christchurch Eye Surgery's items: hospital-held, billing CES, Ophthalmology. */
const ces = (item: Omit<SeedPricedItem, 'holderId' | 'billsTo' | 'specialtyIds'>): SeedPricedItem => ({
  ...item,
  holderId: PARTY.ces,
  billsTo: 'holder',
  specialtyIds: [SPC.ophthalmology],
})

/** Merivale Plastic Surgery's set fees: held by the surgeon group, linked to its surgeons, billing the payer. */
const merivale = (id: string, name: string, priceExGst: number): SeedPricedItem => ({
  id,
  name,
  invoiceDescription: name,
  holderId: PARTY.merivale,
  billsTo: 'payer',
  pricing: fixed(['2026-06-01', priceExGst]),
  defaultRvgGroupId: H3,
  linkedSurgeonIds: [SURG.lim, MERIVALE_DIRECTORY_SURGEON],
  specialtyIds: [SPC.plasticSurgery],
})

/** Dr Souter's own price list: one prepaid Contract per item, kept by the office, every range above zero. */
const souter = (
  item: Pick<SeedPricedItem, 'id' | 'name' | 'pricing'> & { defaultRvgGroupId?: string; specialtyIds?: string[] },
): SeedPricedItem => ({
  ...item,
  invoiceDescription: item.name,
  holderId: PARTY.souter,
  billsTo: 'payer',
  prepaid: true,
  linkedAnaesthetistId: ANAE.souter,
  specialtyIds: item.specialtyIds ?? [SPC.plasticSurgery],
})

export const PRICED_ITEMS: readonly SeedPricedItem[] = [
  // --- Mr P. Doyle's bariatric price list (US-05.2.5): the old figures as ranges.
  // CT-DOYLE-BAR (DOYLE-001, "Gastric bypass") stays in the main table so its id and code hold.
  {
    id: PRICED_ITEM.doyleSleeve,
    name: 'Sleeve gastrectomy',
    invoiceDescription: 'Sleeve gastrectomy, laparoscopic',
    holderId: PARTY.doyle,
    billsTo: 'payer',
    pricing: fixed(['2025-01-01', 2400]),
    defaultRvgGroupId: RVG_GROUP.aaSleeveGastrectomy,
    linkedSurgeonIds: [SURG.doyle],
    specialtyIds: [SPC.generalSurgery],
  },

  // --- CES · SXAP ("Ch Ch Eyes SXAP", "SXAP Ptosis and Blephs"), valid from 1 Apr 2026, incl GST divided.
  ces({ id: PRICED_ITEM.cesCataractIol, name: 'Cataract IOL (LA by Anaesthetist)', invoiceDescription: 'Cataract IOL (LA by Anaesthetist)', holderReference: '8268', pricing: fixed(['2026-04-01', 357.39]), defaultRvgGroupId: H6A, fundingTagId: TAG.sxap }),
  ces({ id: PRICED_ITEM.cesBleph, name: 'Blepharoplasty, unilateral, LA (Day Stay/Theatre)', invoiceDescription: 'Blepharoplasty, unilateral, LA (Day Stay/Theatre)', holderReference: 'AP0126', pricing: fixed(['2026-04-01', 791.3]), fundingTagId: TAG.sxap }),
  // A separately priced add-on stays a Contract, picked as a further Procedure (A46).
  ces({ id: PRICED_ITEM.cesAntVit, name: 'Ant Vitrectmy addn to Catrct', invoiceDescription: 'Anterior vitrectomy added to cataract', holderReference: '8433', pricing: fixed(['2026-04-01', 100]), defaultRvgGroupId: H6A, fundingTagId: TAG.sxap }),
  // The vitrectomy time table: one Contract per band, the band in the name (AR-58 8.3).
  ces({ id: PRICED_ITEM.cesVit60, name: 'Vitrectomy · 0 to 60 mins', invoiceDescription: 'Vitrectomy', holderReference: 'AP0163', pricing: fixed(['2026-04-01', 739.13]), defaultRvgGroupId: H6A, fundingTagId: TAG.sxap }),
  ces({ id: PRICED_ITEM.cesVit90, name: 'Vitrectomy · 61 to 90 mins', invoiceDescription: 'Vitrectomy', holderReference: 'AP0163', pricing: fixed(['2026-04-01', 834.78]), defaultRvgGroupId: H6A, fundingTagId: TAG.sxap }),
  ces({ id: PRICED_ITEM.cesVit120, name: 'Vitrectomy · 91 to 120 mins', invoiceDescription: 'Vitrectomy', holderReference: 'AP0163', pricing: fixed(['2026-04-01', 865.22]), defaultRvgGroupId: H6A, fundingTagId: TAG.sxap }),
  // --- CES · HNZ ("Ch Ch Eye CDHB", the commitment set, A44), ex GST, undated so 1 Jan 2026 (A28).
  ces({ id: PRICED_ITEM.cesHnzCataract, name: 'Cataract, inclusive of Standard Intraocular Lens (Unilateral)', invoiceDescription: 'Cataract, inclusive of Standard Intraocular Lens (Unilateral)', holderReference: 'HNZCATall', pricing: fixed(['2026-01-01', 420]), defaultRvgGroupId: H6A, fundingTagId: TAG.hnz }),
  // --- CES · ACC ("Ch Ch Eye ACC"), ex GST.
  ces({ id: PRICED_ITEM.cesAccCataract, name: 'Cataract Extraction Simple, Phacoemulsion + IOL', invoiceDescription: 'Cataract Extraction Simple, Phacoemulsion + IOL', holderReference: 'OPT101', pricing: fixed(['2026-01-01', 450]), defaultRvgGroupId: H6A, fundingTagId: TAG.acc }),

  // --- Merivale Plastic Surgery's combinations (US-04.2.11, OQ-53, D48): each a Contract of its own.
  // Printed $3,565, $3,910 and $4,255 incl GST. No "ADD ON Liposuction ... per area" (a fee extra).
  merivale(PRICED_ITEM.merFaceLift, 'Face lift', 3100),
  merivale(PRICED_ITEM.merFaceLift1, 'Facelift plus 1 add on (eg bleph)', 3400),
  merivale(PRICED_ITEM.merFaceLift2, 'Facelift plus 2 add ons (eg bleph & fat grafting)', 3700),

  // --- Dr Melanie Souter's own price list (US-04.2.14; D42, D30, D65): demo figures.
  // Rhinoplasty is the $1,200 Riley's and Nair's prepayments use, with a price change from 1 Sep 2026.
  // Done with a plastic or an ENT surgeon, so it fits Mr Nand's Lists too (Nair, catch-up Phase 27).
  souter({ id: PRICED_ITEM.souterRhinoplasty, name: 'Rhinoplasty', pricing: fixed(['2026-01-01', 1200], ['2026-09-01', 1300]), defaultRvgGroupId: RVG_GROUP.aaRhinoplasty, specialtyIds: [SPC.plasticSurgery, SPC.ent] }),
  souter({ id: PRICED_ITEM.souterBleph, name: 'Blepharoplasty, upper lids', pricing: fixed(['2026-01-01', 900]) }),
  souter({ id: PRICED_ITEM.souterBreastAug, name: 'Breast augmentation', pricing: fixed(['2026-01-01', 1450]) }),
  // Catch-up Phase 20: the cosmetic component of a septorhinoplasty, done with an
  // ENT surgeon, so it fits Mr Nand's Lists too. Nair's full prepayment is on it,
  // at the figure she prepaid ($238.50 ex GST).
  souter({
    id: PRICED_ITEM.souterRhinoCosmetic,
    name: 'Rhinoplasty, cosmetic component',
    pricing: fixed(['2026-01-01', 238.5]),
    specialtyIds: [SPC.plasticSurgery, SPC.ent],
  }),
]

/**
 * Dr Sarah Beaumont's own price list (catch-up Phase 41; US-06.5.3): one
 * prepaid Rhinoplasty at $1,350.00 ex GST from 1 Jan 2026, a DEMO-PLAUSIBLE
 * figure (no fee file names it), so a true cancellation of Dr Souter's $1,200
 * prepayment can be rebooked with a colleague at her own different price.
 * Narrowed like Dr Souter's (plastic or ENT surgeons). Appended in
 * `contracts.ts` after every other Contract, so no AA code moves; no seeded
 * Procedure is on it.
 */
export const BEAUMONT_RHINOPLASTY: SeedPricedItem = {
  id: PRICED_ITEM.beaumontRhinoplasty,
  name: 'Rhinoplasty',
  invoiceDescription: 'Rhinoplasty',
  holderId: PARTY.beaumont,
  billsTo: 'payer',
  prepaid: true,
  linkedAnaesthetistId: ANAE.beaumont,
  pricing: fixed(['2026-01-01', 1350]),
  defaultRvgGroupId: RVG_GROUP.aaRhinoplasty,
  specialtyIds: [SPC.plasticSurgery, SPC.ent],
}
