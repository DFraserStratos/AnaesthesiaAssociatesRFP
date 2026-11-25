import { describe, expect, it } from 'vitest'
import {
  INACTIVE_CONTRACTS_RULE_WHO,
  contractsToOfferBack,
  isActiveDuring,
  isActiveInMonth,
  isActiveOn,
  listsAfterLastDay,
  ownContracts,
  statusOn,
  type ActivitySpan,
} from './anaesthetistStatus'
import type { Contract } from './billing/contracts'
import type { Party } from './billing/parties'
import type { AuditEntry, List } from './types'

const span = (over: Partial<ActivitySpan> = {}): ActivitySpan => ({ startDateISO: '2011-09-05', lastDayISO: null, activeAgainISO: null, ...over })
const beaumont = span({ lastDayISO: '2027-01-31' })

describe('isActiveOn (US-12.1.6, US-01.1.1)', () => {
  it('Last day chosen: active up to and on 31 January, inactive from 1 February', () => {
    expect(isActiveOn(beaumont, '2027-01-20')).toBe(true)
    expect(isActiveOn(beaumont, '2027-01-31')).toBe(true)
    expect(isActiveOn(beaumont, '2027-02-01')).toBe(false)
    expect(isActiveOn(beaumont, '2027-02-28')).toBe(false)
  })

  it('Active again from 1 March', () => {
    const again = { ...beaumont, activeAgainISO: '2027-03-01' }
    expect(isActiveOn(again, '2027-02-28')).toBe(false)
    expect(isActiveOn(again, '2027-03-01')).toBe(true)
    expect(isActiveOn(again, '2027-01-15')).toBe(true)
  })

  it('never before the start date, and always after it with no last day', () => {
    expect(isActiveOn(span(), '2011-09-04')).toBe(false)
    expect(isActiveOn(span(), '2011-09-05')).toBe(true)
    expect(isActiveOn(span(), '2030-01-01')).toBe(true)
  })

  it('a month counts when active on any day of it (the AA fee run)', () => {
    expect(isActiveInMonth(beaumont, '2027-01')).toBe(true)
    expect(isActiveInMonth(beaumont, '2027-02')).toBe(false)
    expect(isActiveInMonth({ ...beaumont, activeAgainISO: '2027-02-27' }, '2027-02')).toBe(true)
    expect(isActiveInMonth(span({ startDateISO: '2026-12-15' }), '2026-12')).toBe(true)
    expect(isActiveInMonth(span({ startDateISO: '2026-12-15' }), '2026-11')).toBe(false)
    expect(isActiveDuring(beaumont, '2027-02-01', '2027-02-28')).toBe(false)
  })
})

describe('statusOn', () => {
  it('reads active, leaving with the last day, inactive from the day after, and active again', () => {
    const reason = { inactiveReason: 'leftPractice' as const }
    expect(statusOn({ ...span(), inactiveReason: null }, '2026-11-24')).toEqual({ kind: 'active', sinceISO: '2011-09-05' })
    expect(statusOn({ ...beaumont, ...reason }, '2027-01-31')).toEqual({ kind: 'leaving', lastDayISO: '2027-01-31', reason: 'leftPractice' })
    expect(statusOn({ ...beaumont, ...reason }, '2027-02-01')).toEqual({
      kind: 'inactive',
      sinceISO: '2027-02-01',
      lastDayISO: '2027-01-31',
      reason: 'leftPractice',
    })
    expect(statusOn({ ...beaumont, activeAgainISO: '2027-03-01', ...reason }, '2027-03-01')).toEqual({ kind: 'active', sinceISO: '2027-03-01' })
  })
})

const list = (id: string, dateISO: string, anaesthetistId: string | undefined, over: Partial<List> = {}): List =>
  ({ id, dateISO, session: 'AM', anaesthetistId, state: anaesthetistId === undefined ? 'DRAFT' : 'ACTIVE', ...over }) as List

describe('listsAfterLastDay (Refused while holding Lists)', () => {
  it('lists the anaesthetist\'s Lists after the day, in date order, never a removed or a colleague\'s one', () => {
    const lists = [
      list('L3', '2027-02-10', 'B'),
      list('L1', '2027-02-03', 'B'),
      list('L0', '2027-01-31', 'B'),
      list('LX', '2027-02-03', 'C'),
      list('LR', '2027-02-05', 'B', { removedAtISO: '2026-11-24T08:00:00' }),
      list('LD', '2027-02-05', undefined),
    ]
    expect(listsAfterLastDay(lists, 'B', '2027-01-31').map((l) => l.id)).toEqual(['L1', 'L3'])
  })
})

const contract = (id: string, over: Partial<Contract> = {}): Contract =>
  ({ id, name: id, holderId: 'PY-B', linkedAnaesthetistId: 'B', status: 'active', ...over }) as Contract
const parties: Record<string, Party> = {
  'PY-B': { id: 'PY-B', kind: 'anaesthetist', name: 'Dr Sarah Beaumont', codePrefix: 'BEAU' },
  'PY-H': { id: 'PY-H', kind: 'hospital', name: 'Southern Cross', codePrefix: 'SX' },
}
const disable = (entityId: string, who: string, atISO: string): AuditEntry => ({
  id: `A-${entityId}-${atISO}`,
  entityType: 'contract',
  entityId,
  who,
  role: 'office',
  source: 'system',
  action: 'contract.disable',
  atISO,
})

describe('own Contracts and the offer back (US-04.1.2 Inactive anaesthetist)', () => {
  it('own: held by an anaesthetist-kind Party and linked to them', () => {
    const own = ownContracts([contract('Rhinoplasty'), contract('Hosp', { holderId: 'PY-H' }), contract('Other', { linkedAnaesthetistId: 'C' })], parties, 'B')
    expect(own.map((c) => c.id)).toEqual(['Rhinoplasty'])
  })

  it('offers back only Contracts the rule disabled after the last day, never one the office disabled by hand', () => {
    const contracts = [
      contract('Rhinoplasty', { status: 'disabled' }),
      contract('ByHand', { status: 'disabled' }),
      contract('Before', { status: 'disabled' }),
      contract('Enabled', { status: 'active' }),
    ]
    const audit = [
      disable('Rhinoplasty', INACTIVE_CONTRACTS_RULE_WHO, '2027-02-01T08:00:00'),
      disable('ByHand', 'Kirsty W.', '2027-02-02T09:00:00'),
      disable('Before', INACTIVE_CONTRACTS_RULE_WHO, '2026-06-01T08:00:00'),
      disable('Enabled', INACTIVE_CONTRACTS_RULE_WHO, '2027-02-01T08:00:00'),
    ]
    expect(contractsToOfferBack(contracts, audit, 'B', '2027-01-31').map((c) => c.id)).toEqual(['Rhinoplasty'])
    // The office disabled it by hand after the rule did: the latest disable is the office's, so it is not offered.
    expect(contractsToOfferBack(contracts, [...audit, disable('Rhinoplasty', 'Kirsty W.', '2027-02-05T09:00:00')], 'B', '2027-01-31')).toEqual([])
  })
})
