/**
 * The seed's priced items (catch-up Phase 19a; US-04.2.15, US-04.2.18,
 * US-04.2.11, US-04.2.14; AR-58 8.2 and 8.3): every fixed price a Contract of
 * its own with valid ranges, Merivale's combinations and Dr Souter's prepaid
 * price list as Contracts, and no fee extra seeded as a Contract.
 */

import { describe, expect, it } from 'vitest'
import { freshAppState } from './appStore'
import { contractSearch, linkFits } from '../domain/billing/contracts'
import { rangeInForce, validatePriceRanges } from '../domain/billing/priceRanges'
import { PRICED_ITEM, MERIVALE_DIRECTORY_SURGEON } from '../domain/seed/pricedItems'
import { ANAE, SURG } from '../domain/seed'

const state = freshAppState()
const { contracts, parties, rvgGroups } = state.masters
const fixedContracts = Object.values(contracts).filter((c) => c.pricing.kind === 'fixed')

describe('every fixed price is a Contract with valid ranges', () => {
  it('each has at least one range, unique starts, and every range above zero on a prepaid Contract', () => {
    expect(fixedContracts.length).toBeGreaterThan(10)
    for (const c of fixedContracts) {
      expect(validatePriceRanges(c.pricing.kind === 'fixed' ? c.pricing.ranges : [], { prepaid: c.prepaid }), c.id).toBeNull()
    }
  })

  it('every seeded Procedure on a fixed price has a range in force on its List date', () => {
    const onFixed = Object.values(state.schedule.procedures).filter(
      (p) => p.governingContractId !== undefined && contracts[p.governingContractId]?.pricing.kind === 'fixed',
    )
    expect(onFixed.length).toBeGreaterThan(0)
    for (const p of onFixed) {
      const list = state.schedule.lists[state.schedule.bookings[p.bookingId]!.listId]!
      expect(rangeInForce(contracts[p.governingContractId!]!, list.dateISO), p.id).not.toBeNull()
    }
  })

  it('no fee extra is a Contract (A46): no GA add-on fee, per-15-minute increment or per-area liposuction', () => {
    for (const c of Object.values(contracts)) {
      expect(c.name, c.id).not.toMatch(/GA by Anaesthetist|under GA|per additional 15|per area|liposuction/i)
    }
  })

  it('no Procedure was moved onto a CES schedule item, nor onto Dr Souter’s price list but Riley and Nair (catch-up Phase 20, figures unchanged)', () => {
    const ids = new Set<string>([
      PRICED_ITEM.cesCataractIol,
      PRICED_ITEM.cesBleph,
      PRICED_ITEM.cesAntVit,
      PRICED_ITEM.cesVit60,
      PRICED_ITEM.cesVit90,
      PRICED_ITEM.cesVit120,
      PRICED_ITEM.cesHnzCataract,
      PRICED_ITEM.cesAccCataract,
      PRICED_ITEM.souterRhinoplasty,
      PRICED_ITEM.souterBleph,
      PRICED_ITEM.souterBreastAug,
    ])
    expect(Object.values(state.schedule.procedures).filter((p) => ids.has(p.governingContractId ?? '')).map((p) => p.id)).toEqual(['P0036'])
    expect(state.schedule.procedures.P0036?.governingContractId).toBe(PRICED_ITEM.souterRhinoplasty)
  })
})

describe("Doyle's price list (US-05.2.5)", () => {
  it('Gastric bypass $2,800 then $2,950 from 28 Jul 2026; Sleeve gastrectomy $2,400', () => {
    const bypass = contracts['CT-DOYLE-BAR']!
    expect(bypass).toMatchObject({ name: 'Gastric bypass', aaCode: 'DOYLE-001' })
    expect(rangeInForce(bypass, '2026-07-14')?.price).toBe(2800)
    expect(rangeInForce(bypass, '2026-07-28')?.price).toBe(2950)
    expect(rangeInForce(contracts[PRICED_ITEM.doyleSleeve]!, '2026-07-21')?.price).toBe(2400)
  })
})

describe('the schedule items (US-04.2.18)', () => {
  it('carry the holder reference code and the invoice description from the line', () => {
    expect(contracts[PRICED_ITEM.cesBleph]).toMatchObject({ holderReference: 'AP0126', invoiceDescription: 'Blepharoplasty, unilateral, LA (Day Stay/Theatre)' })
    expect(contracts[PRICED_ITEM.cesHnzCataract]?.holderReference).toBe('HNZCATall')
    expect(contracts[PRICED_ITEM.cesAccCataract]?.holderReference).toBe('OPT101')
    // A time band is one Contract per band, the band in the name.
    expect([PRICED_ITEM.cesVit60, PRICED_ITEM.cesVit90, PRICED_ITEM.cesVit120].map((id) => contracts[id]!.name)).toEqual([
      'Vitrectomy · 0 to 60 mins',
      'Vitrectomy · 61 to 90 mins',
      'Vitrectomy · 91 to 120 mins',
    ])
  })

  it('"CAT" finds the cataract items by name and HNZCATall; AP0126 finds the blepharoplasty', () => {
    const found = contractSearch('CAT', { contracts, parties, rvgGroups }).map((c) => c.id)
    expect(found).toEqual(expect.arrayContaining([PRICED_ITEM.cesCataractIol, PRICED_ITEM.cesHnzCataract, PRICED_ITEM.cesAccCataract]))
    expect(contractSearch('AP0126', { contracts, parties, rvgGroups }).map((c) => c.id)).toEqual([PRICED_ITEM.cesBleph])
  })
})

describe("Merivale Plastic Surgery's combinations (US-04.2.11, D48)", () => {
  const merivale = [PRICED_ITEM.merFaceLift, PRICED_ITEM.merFaceLift1, PRICED_ITEM.merFaceLift2].map((id) => contracts[id]!)

  it('three fixed-price Contracts held by the surgeon group, billing the payer, from 1 Jun 2026', () => {
    expect(merivale.map((c) => [c.name, c.holderId, c.billsTo, rangeInForce(c, '2026-07-21')?.price])).toEqual([
      ['Face lift', 'PY-MER', 'payer', 3100],
      ['Facelift plus 1 add on (eg bleph)', 'PY-MER', 'payer', 3400],
      ['Facelift plus 2 add ons (eg bleph & fat grafting)', 'PY-MER', 'payer', 3700],
    ])
    expect(merivale.every((c) => c.pricing.kind === 'fixed' && c.pricing.ranges[0]?.startISO === '2026-06-01')).toBe(true)
  })

  it('a search by H3 finds all three', () => {
    const found = contractSearch('H3', { contracts, parties, rvgGroups }).map((c) => c.id)
    expect(found).toEqual(expect.arrayContaining(merivale.map((c) => c.id)))
  })

  it('are offered for both linked surgeons and no other', () => {
    for (const c of merivale) {
      expect(linkFits(c, parties[c.holderId], { surgeonId: SURG.lim })).toBe(true)
      expect(linkFits(c, parties[c.holderId], { surgeonId: MERIVALE_DIRECTORY_SURGEON })).toBe(true)
      expect(linkFits(c, parties[c.holderId], { surgeonId: SURG.hale })).toBe(false)
    }
  })
})

describe("Dr Souter's own price list (US-04.2.14; D42, D30)", () => {
  const souter = Object.values(contracts).filter((c) => c.holderId === 'PY-SOUTER')

  it('one prepaid fixed-price Contract per item, linked to her, billing the payer, every range above zero', () => {
    expect(souter.map((c) => c.name).sort()).toEqual(['Blepharoplasty, upper lids', 'Breast augmentation', 'Rhinoplasty', 'Rhinoplasty, cosmetic component'])
    for (const c of souter) {
      expect(c).toMatchObject({ prepaid: true, billsTo: 'payer', linkedAnaesthetistId: ANAE.souter, anaesthetistMayOverridePrice: false })
      expect(c.pricing.kind === 'fixed' && c.pricing.ranges.every((r) => r.price > 0)).toBe(true)
    }
  })

  it('Rhinoplasty is $1,200 (the figure Riley’s prepayment uses), with a price change from 1 Sep 2026', () => {
    const rhino = contracts[PRICED_ITEM.souterRhinoplasty]!
    expect(rangeInForce(rhino, '2026-07-24')?.price).toBe(1200)
    expect(rangeInForce(rhino, '2026-09-01')?.price).toBe(1300)
  })
})
