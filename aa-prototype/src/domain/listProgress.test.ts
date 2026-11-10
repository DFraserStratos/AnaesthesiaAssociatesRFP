import { describe, expect, it } from 'vitest'
import { hasLeftMainView, LIST_PROGRESS_LABEL, listProgress } from './listProgress'

const TODAY = '2026-07-21'
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
    expect(listProgress({ state: 'ACTIVE', dateISO: '2026-07-14' }, [open], TODAY)).toBe('toFinish')
    expect(listProgress({ state: 'ACTIVE', dateISO: '2026-07-27' }, [open], TODAY)).toBe('upcoming')
  })

  it('a past completed ACTIVE List is ready to submit; an empty one is upcoming', () => {
    expect(listProgress({ state: 'ACTIVE', dateISO: '2026-07-14' }, [done, done], TODAY)).toBe('readyToSubmit')
    expect(listProgress({ state: 'ACTIVE', dateISO: '2026-07-14' }, [], TODAY)).toBe('upcoming')
  })

  it('SUBMITTED is submitted whatever its Bookings say', () => {
    expect(listProgress({ state: 'SUBMITTED', dateISO: '2026-07-20' }, [done], TODAY)).toBe('submitted')
    expect(listProgress({ state: 'SUBMITTED', dateISO: '2026-07-20' }, [open], TODAY)).toBe('submitted')
  })

  it('AUTHORISED is invoiced with the billing stamp and authorised without it', () => {
    expect(listProgress({ state: 'AUTHORISED', dateISO: '2026-07-20', billedAtISO: '2026-07-21T09:00:00' }, [done], TODAY)).toBe('invoiced')
    expect(listProgress({ state: 'AUTHORISED', dateISO: '2026-07-20' }, [done], TODAY)).toBe('authorised')
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
