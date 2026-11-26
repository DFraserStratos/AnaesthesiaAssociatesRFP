/**
 * The matches-exactly bench (build plan Phase 71; US-02.1.6, D118): St George's day-before message on the practice
 * lists its Lists that match exactly, and Confirm unchanged (N) decides all N at once, then hands back.
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OFFICE_ACTOR, useAppStore } from '../../../../../store'
import { practiceAppState } from '../../../../../store/appStore'
import { receiveHospitalBatch, stgDayBeforeRows } from '../../../../../store/intakeIngest'
import { arrivalItemsOf } from '../../../../../store/intakeSelectors'
import { OKAFOR_STORY } from '../../../../../domain/intake/hospitalDownloads'
import { HOSP } from '../../../../../domain/seed/cast'
import { MatchesExactlyBench } from './MatchesExactlyBench'

let batchId = ''

beforeEach(() => {
  useAppStore.setState(practiceAppState())
  const out = receiveHospitalBatch(useAppStore, HOSP.stg, OKAFOR_STORY.stgDayBefore.label, stgDayBeforeRows(useAppStore.getState()))
  if (!out.ok) throw new Error(out.message)
  batchId = out.value.batchId
})

function firstExact() {
  return arrivalItemsOf(useAppStore.getState()).find((i) => i.batchId === batchId && i.kind === 'matchesExactly')!
}

describe('MatchesExactlyBench', () => {
  it('lists every List that matches exactly and confirms them all with one click', () => {
    const n = OKAFOR_STORY.stgDayBefore.matchingListCount
    const onDone = vi.fn()
    const { container } = render(<MatchesExactlyBench arrival={firstExact()} actor={OFFICE_ACTOR} onDone={onDone} />)
    const rows = container.querySelectorAll('[data-shot="intake-unchanged-lists"] tr[data-arrival-key]')
    expect(rows).toHaveLength(n)
    expect(rows[0]).toHaveTextContent("St George's")
    expect(rows[0]).toHaveTextContent('Booking')
    expect(screen.getByText('Nothing on the schedule changes. Each List is marked as checked.')).toBeInTheDocument()
    const button = container.querySelector('[data-shot="intake-confirm-unchanged"]')!
    expect(button).toHaveTextContent(`Confirm unchanged (${n})`)
    expect(container.querySelectorAll('[data-shot^="intake-bench-"]')).toHaveLength(1)
    expect(container.textContent ?? '').not.toMatch(/[–—]/)

    act(() => {
      fireEvent.click(button)
    })
    expect(onDone).toHaveBeenCalledTimes(1)
    const exact = arrivalItemsOf(useAppStore.getState()).filter((i) => i.batchId === batchId && i.kind === 'matchesExactly')
    expect(exact).toHaveLength(n)
    expect(exact.every((i) => i.decided)).toBe(true)
    expect(container.querySelector('[data-shot="intake-confirm-unchanged"]')).toBeNull()
    expect(screen.getByText('Nothing left to confirm')).toBeInTheDocument()
  })

  it('a decided arrival shows no button', () => {
    const { container } = render(<MatchesExactlyBench arrival={{ ...firstExact(), decided: true }} actor={OFFICE_ACTOR} onDone={vi.fn()} />)
    expect(container.querySelector('[data-shot="intake-confirm-unchanged"]')).toBeNull()
    expect(container.querySelectorAll('button')).toHaveLength(0)
  })
})
