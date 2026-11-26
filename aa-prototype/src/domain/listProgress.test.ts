import { describe, expect, it } from 'vitest'
import { hasLeftMainView, LIST_PROGRESS_LABEL, listProgress } from './listProgress'

const TODAY = '2026-11-24'
const done = { completed: true }
const open = { completed: false }

describe('hasLeftMainView (OQ-31, D9)', () => {
  it('is true at AUTHORISED only', () => {
    expect(hasLeftMainView({ state: 'AUTHORISED' })).toBe(true)
    for (const state of ['ACTIVE', 'SUBMITTED', 'DRAFT'] as const) expect(hasLeftMainView({ state })).toBe(false)
  })
})

describe('listProgress', () => {
  it('ACTIVE today or earlier with an incomplete Booking is to finish; later is upcoming', () => {
    expect(listProgress({ state: 'ACTIVE', dateISO: TODAY }, [done, open], TODAY)).toBe('toFinish')
    expect(listProgress({ state: 'ACTIVE', dateISO: '2026-11-17' }, [open], TODAY)).toBe('toFinish')
    expect(listProgress({ state: 'ACTIVE', dateISO: '2026-11-30' }, [open], TODAY)).toBe('upcoming')
  })

  it('a past completed ACTIVE List is ready to submit; an empty one is upcoming', () => {
    expect(listProgress({ state: 'ACTIVE', dateISO: '2026-11-17' }, [done, done], TODAY)).toBe('readyToSubmit')
    expect(listProgress({ state: 'ACTIVE', dateISO: '2026-11-17' }, [], TODAY)).toBe('upcoming')
  })

  it('SUBMITTED is submitted, or to finish while a reopened or added Booking is incomplete', () => {
    expect(listProgress({ state: 'SUBMITTED', dateISO: '2026-11-23' }, [done], TODAY)).toBe('submitted')
    expect(listProgress({ state: 'SUBMITTED', dateISO: '2026-11-23' }, [done, open], TODAY)).toBe('toFinish')
    expect(listProgress({ state: 'SUBMITTED', dateISO: '2026-11-30' }, [open], TODAY)).toBe('toFinish')
  })

  it('AUTHORISED is invoiced with the billing stamp and authorised without it', () => {
    expect(listProgress({ state: 'AUTHORISED', dateISO: '2026-11-23', billedAtISO: '2026-11-24T09:00:00' }, [done], TODAY)).toBe('invoiced')
    expect(listProgress({ state: 'AUTHORISED', dateISO: '2026-11-23' }, [done], TODAY)).toBe('authorised')
  })

  it('a List held by its stub (no live Booking, a stub standing) is never done: ACTIVE or SUBMITTED reads upcoming (US-02.6.4)', () => {
    expect(listProgress({ state: 'ACTIVE', dateISO: '2026-11-17' }, [], TODAY, 1)).toBe('upcoming')
    expect(listProgress({ state: 'ACTIVE', dateISO: '2026-12-08' }, [], TODAY, 1)).toBe('upcoming')
    // Every Booking cancelled after submit, the stub still standing: not done.
    expect(listProgress({ state: 'SUBMITTED', dateISO: '2026-11-23' }, [], TODAY, 1)).toBe('upcoming')
    expect(listProgress({ state: 'SUBMITTED', dateISO: '2026-11-23' }, [], TODAY)).toBe('submitted')
    // AUTHORISED is unchanged.
    expect(listProgress({ state: 'AUTHORISED', dateISO: '2026-11-23' }, [], TODAY, 1)).toBe('authorised')
  })

  it('a List with a live Booking and a stub reads as without the stub (never held up)', () => {
    expect(listProgress({ state: 'ACTIVE', dateISO: '2026-11-17' }, [done, done], TODAY, 1)).toBe('readyToSubmit')
    expect(listProgress({ state: 'SUBMITTED', dateISO: '2026-11-23' }, [done], TODAY, 2)).toBe('submitted')
    expect(listProgress({ state: 'ACTIVE', dateISO: TODAY }, [open], TODAY, 1)).toBe('toFinish')
  })

  it('labels come from one table', () => {
    expect(LIST_PROGRESS_LABEL.submitted).toBe('Done · unbilled')
    expect(LIST_PROGRESS_LABEL.invoiced).toBe('Invoiced')
    expect(LIST_PROGRESS_LABEL.toFinish).toBe('To finish')
    expect(LIST_PROGRESS_LABEL.readyToSubmit).toBe('Ready to submit')
    expect(LIST_PROGRESS_LABEL.authorised).toBe('Authorised')
  })

  it('is deterministic', () => {
    const a = listProgress({ state: 'ACTIVE', dateISO: TODAY }, [open], TODAY)
    const b = listProgress({ state: 'ACTIVE', dateISO: TODAY }, [open], TODAY)
    expect(a).toBe(b)
  })
})
