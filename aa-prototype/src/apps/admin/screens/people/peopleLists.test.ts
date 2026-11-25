/**
 * The People lists' pure filters (build plan Phase 53; US-13.4.1 "Find a
 * person"): search, status, tier and specialty, and the lists' order.
 */

import { describe, expect, it } from 'vitest'
import { ANAE, SURG } from '../../../../domain/seed'
import { freshAppState } from '../../../../store'
import { anaesthetistRows, specialtyRows, surgeonRows } from './peopleLists'
import { surnameOf } from '../../../../shared/format'

const state = freshAppState()
const anaesthetists = Object.values(state.masters.anaesthetists)
const surgeons = Object.values(state.masters.surgeons)
const TODAY = '2026-11-24'
const tierOf = (id: string) => (id === ANAE.souter ? 1 : 3)

describe('anaesthetistRows', () => {
  const all = { q: '', status: 'all', tier: 'all' } as const

  it('searches by name (any case), registration number and HPI CPN (spaces ignored)', () => {
    expect(anaesthetistRows(anaesthetists, { ...all, q: 'SHARMA' }, TODAY, tierOf).map((a) => a.registrationNumber)).toEqual([ANAE.sharma])
    expect(anaesthetistRows(anaesthetists, { ...all, q: ANAE.ropata }, TODAY, tierOf).map((a) => a.registrationNumber)).toEqual([ANAE.ropata])
    const hpi = state.masters.anaesthetists[ANAE.chen]!.hpiId
    const spaced = `${hpi.slice(0, 2)} ${hpi.slice(2).toLowerCase()}`
    expect(anaesthetistRows(anaesthetists, { ...all, q: spaced }, TODAY, tierOf).map((a) => a.registrationNumber)).toEqual([ANAE.chen])
  })

  it('Inactive and Active read isActiveOn on the day given', () => {
    const left = anaesthetists.map((a) => (a.registrationNumber === ANAE.ngata ? { ...a, lastDayISO: '2026-11-01' } : a))
    expect(anaesthetistRows(left, { ...all, status: 'inactive' }, TODAY, tierOf).map((a) => a.registrationNumber)).toEqual([ANAE.ngata])
    expect(anaesthetistRows(left, { ...all, status: 'active' }, TODAY, tierOf).map((a) => a.registrationNumber)).not.toContain(ANAE.ngata)
    // Before the last day they are still active.
    expect(anaesthetistRows(left, { ...all, status: 'active' }, '2026-10-30', tierOf).map((a) => a.registrationNumber)).toContain(ANAE.ngata)
  })

  it('one who starts later, or whose last day is ahead, is Active, never Inactive', () => {
    const later = anaesthetists.map((a) => (a.registrationNumber === ANAE.chen ? { ...a, startDateISO: '2027-01-05' } : a.registrationNumber === ANAE.ngata ? { ...a, lastDayISO: '2026-12-31' } : a))
    const active = anaesthetistRows(later, { ...all, status: 'active' }, TODAY, tierOf).map((a) => a.registrationNumber)
    expect(active).toContain(ANAE.chen)
    expect(active).toContain(ANAE.ngata)
    expect(anaesthetistRows(later, { ...all, status: 'inactive' }, TODAY, tierOf)).toEqual([])
  })

  it('filters by tier, and lists in surname order', () => {
    expect(anaesthetistRows(anaesthetists, { ...all, tier: '1' }, TODAY, tierOf).map((a) => a.registrationNumber)).toEqual([ANAE.souter])
    const surnames = anaesthetistRows(anaesthetists, all, TODAY, tierOf).map((a) => surnameOf(a.name))
    expect(surnames).toEqual([...surnames].sort((a, b) => a.localeCompare(b)))
  })
})

describe('surgeonRows', () => {
  it("Find a person: a name search and a specialty filter show only the matching surgeons", () => {
    const reid = state.masters.surgeons[SURG.reid]!
    const found = surgeonRows(surgeons, { q: 'reid', status: 'active', specialtyId: reid.specialtyIds[0]! })
    expect(found.map((s) => s.id)).toContain(SURG.reid)
    for (const s of found) {
      expect(s.name.toLowerCase()).toContain('reid')
      expect(s.specialtyIds).toContain(reid.specialtyIds[0])
    }
    const other = Object.values(state.masters.specialties).find((sp) => !reid.specialtyIds.includes(sp.id))!
    expect(surgeonRows(surgeons, { q: 'reid', status: 'active', specialtyId: other.id }).map((s) => s.id)).not.toContain(SURG.reid)
  })

  it('searches the practice name and the HPI CPN', () => {
    const reid = state.masters.surgeons[SURG.reid]!
    expect(surgeonRows(surgeons, { q: reid.practiceName!.toUpperCase(), status: 'all', specialtyId: 'all' }).map((s) => s.id)).toContain(SURG.reid)
    expect(surgeonRows(surgeons, { q: reid.hpiId!.toLowerCase(), status: 'all', specialtyId: 'all' }).map((s) => s.id)).toEqual([SURG.reid])
  })

  it('Retired, Active and All by isRetired; surname order', () => {
    const retired = surgeons.map((s) => (s.id === SURG.lim ? { ...s, retiredAtISO: '2026-10-01' } : s))
    expect(surgeonRows(retired, { q: '', status: 'retired', specialtyId: 'all' }).map((s) => s.id)).toEqual([SURG.lim])
    expect(surgeonRows(retired, { q: '', status: 'active', specialtyId: 'all' }).map((s) => s.id)).not.toContain(SURG.lim)
    expect(surgeonRows(retired, { q: '', status: 'all', specialtyId: 'all' })).toHaveLength(surgeons.length)
    const surnames = surgeonRows(surgeons, { q: '', status: 'all', specialtyId: 'all' }).map((s) => s.name.split(/\s+/).at(-1)!.toLowerCase())
    expect(surnames).toEqual([...surnames].sort((a, b) => a.localeCompare(b)))
  })

  it('a word-only search never matches an identifier by chance', () => {
    expect(surgeonRows(surgeons, { q: 'zzzz', status: 'all', specialtyId: 'all' })).toEqual([])
  })
})

describe('specialtyRows', () => {
  it('searches by name, in name order', () => {
    const specialties = Object.values(state.masters.specialties)
    expect(specialtyRows(specialties, { q: 'OPHTH' }).map((s) => s.name)).toEqual(['Ophthalmology'])
    const names = specialtyRows(specialties, { q: '' }).map((s) => s.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })
})
