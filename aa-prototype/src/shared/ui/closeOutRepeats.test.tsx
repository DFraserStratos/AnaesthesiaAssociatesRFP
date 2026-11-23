import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StickyDock } from './StickyDock'
import { NoticeLine } from './NoticeLine'
import { PickRow } from './PickRow'
import { Disclosure, DisclosureButton } from './Disclosure'
import { TickBadge, TickGlyph } from './TickBadge'
import { DayChip } from './DayChip'
import { ProgressPill, progressLabel, progressTone } from '../schedule/ProgressPill'
import { ListRow } from '../schedule/ListRow'
import { LIST_PROGRESS_LABEL, type ListProgress } from '../../domain/listProgress'

/** UI unification U7 (U35): the rest of the small repeats, one shared component each. */

const dockHeight = () => document.documentElement.style.getPropertyValue('--aa-dock-height')

describe('StickyDock', () => {
  it('publishes its height while mounted and clears it on unmount; hooks land on the dock', () => {
    const { unmount } = render(
      <StickyDock testId="mobile-list-footer">
        <button type="button">Mark list completed</button>
      </StickyDock>,
    )
    expect(screen.getByTestId('mobile-list-footer')).toHaveStyle({ position: 'absolute', bottom: '0px' })
    expect(dockHeight()).toBe('0px') // jsdom lays nothing out: the published value is the measured offsetHeight
    unmount()
    expect(dockHeight()).toBe('')
  })

  it('stacked docks: the newest is published, the one under it again when the top goes', () => {
    const heights = new Map<string, number>([['list', 70], ['booking', 96]])
    const spy = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return heights.get(this.dataset.testid ?? '') ?? 0
    })
    const list = render(<StickyDock testId="list">x</StickyDock>)
    expect(dockHeight()).toBe('70px')
    const booking = render(<StickyDock testId="booking" riseWithKeyboard>y</StickyDock>)
    expect(dockHeight()).toBe('96px')
    expect(screen.getByTestId('booking')).toHaveStyle({ bottom: 'var(--aa-keyboard-inset, 0px)' })
    booking.unmount()
    expect(dockHeight()).toBe('70px')
    list.unmount()
    expect(dockHeight()).toBe('')
    spy.mockRestore()
  })

  it('reports its height to the screen that sizes its tail from it', () => {
    const onHeight = vi.fn()
    const { unmount } = render(<StickyDock onHeight={onHeight}>x</StickyDock>)
    expect(onHeight).toHaveBeenCalledWith(0)
    unmount()
  })
})

describe('StickyDock on a parked layer', () => {
  it('publishes nothing while its layer is inert, and publishes again when the layer comes back', async () => {
    const spy = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(88)
    const { container, unmount } = render(
      <div data-layer="" {...({ inert: '' } as object)}>
        <StickyDock>x</StickyDock>
      </div>,
    )
    expect(dockHeight()).toBe('')
    container.querySelector('[data-layer]')!.removeAttribute('inert')
    await waitFor(() => expect(dockHeight()).toBe('88px'))
    unmount()
    expect(dockHeight()).toBe('')
    spy.mockRestore()
  })
})

describe('NoticeLine', () => {
  it('prints the sentence, the quoted message and the stamp as "Tue 21 Jul, 08:00" (question 24)', () => {
    render(<NoticeLine shot="n" text="Dr Hughes moved a List to you" message="Can you take it?" atISO="2026-07-21T08:00:00" stampSuffix=" · Kirsty W." />)
    const line = document.querySelector('[data-shot="n"]')!
    expect(line).toHaveTextContent('Dr Hughes moved a List to you')
    expect(line).toHaveTextContent('"Can you take it?"')
    expect(line).toHaveTextContent('Tue 21 Jul, 08:00 · Kirsty W.')
  })

  it('opening: the whole row is one button named by its words, the chevron hidden', () => {
    const onOpen = vi.fn()
    render(<NoticeLine boxed shot="moved-to-you-booking-row" data-row="r1" text="Dr Hughes moved a Booking to you" atISO="2026-07-21T08:00:00" onOpen={onOpen} />)
    const button = screen.getByRole('button', { name: /Dr Hughes moved a Booking to you/ })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveAttribute('data-shot', 'moved-to-you-booking-row')
    expect(button).toHaveAttribute('data-row', 'r1')
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden')
    fireEvent.click(button)
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('an action sits beside the words, which still open', () => {
    const onOpen = vi.fn()
    const onResolve = vi.fn()
    render(
      <NoticeLine
        text="Dr Souter moved a List"
        onOpen={onOpen}
        chevron={false}
        action={<button type="button" aria-label="Resolve notice: Dr Souter moved a List" onClick={onResolve}>Resolve</button>}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Dr Souter moved a List' }))
    fireEvent.click(screen.getByRole('button', { name: 'Resolve notice: Dr Souter moved a List' }))
    expect(onOpen).toHaveBeenCalledOnce()
    expect(onResolve).toHaveBeenCalledOnce()
  })

  it('inline stamp: inside the sentence, after a middot', () => {
    render(<NoticeLine shot="d" stampInline text="Moved here by Dr Souter" atISO="2026-07-21T08:05:00" />)
    expect(document.querySelector('[data-shot="d"]')).toHaveTextContent('Moved here by Dr Souter · Tue 21 Jul, 08:05')
  })
})

describe('PickRow', () => {
  it('colleague: one button named for the colleague, the chevron hidden, hooks passed through', () => {
    const onPick = vi.fn()
    render(<PickRow look="colleague" shot="move-booking-receiver" data-anaesthetist-id="an-1" name="Dr Hughes" line="Free on Tue 21 Jul" minHeight={60} first onPick={onPick} />)
    const row = screen.getByRole('button', { name: /Dr Hughes/ })
    expect(row).toHaveAttribute('type', 'button')
    expect(row).toHaveAttribute('data-anaesthetist-id', 'an-1')
    expect(row).toHaveStyle({ minHeight: '60px' })
    expect(row.querySelector('svg.lucide-chevron-right')).toHaveAttribute('aria-hidden')
    fireEvent.click(row)
    expect(onPick).toHaveBeenCalledOnce()
  })

  it('colleague without a pick: the same row, not a button', () => {
    render(<PickRow look="colleague" shot="move-booking-blocked" name="Dr Chen" line="Away that day" minHeight={60} />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(document.querySelector('[data-shot="move-booking-blocked"]')).toHaveAttribute('aria-disabled', 'true')
  })

  it('blocked: a labelled group, never a button', () => {
    render(<PickRow look="blocked" groupLabel="Chen, Lin: not available this session" data-candidate-closed="an-2" name="Chen, Lin" line="Not available this session" />)
    const group = screen.getByRole('group', { name: 'Chen, Lin: not available this session' })
    expect(group).toHaveAttribute('data-candidate-closed', 'an-2')
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('Disclosure', () => {
  it('a type="button" summary whose aria-expanded flips; the region is hidden and inert while closed', () => {
    render(
      <Disclosure shot="pairing-ended" summary="Ended (2)">
        <span>Dr Chen</span>
      </Disclosure>,
    )
    const toggle = screen.getByRole('button', { name: 'Ended (2)' })
    expect(toggle).toHaveAttribute('type', 'button')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    const region = document.getElementById(toggle.getAttribute('aria-controls')!)!
    expect(region).toHaveAttribute('aria-hidden', 'true')
    expect(region).toHaveAttribute('inert')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(region).not.toHaveAttribute('inert')
    expect(region).toHaveAttribute('data-open', 'true')
    // `[data-shot] > button` is the summary (recipe US-13.6.3).
    expect(document.querySelector('[data-shot="pairing-ended"] > button')).toBe(toggle)
  })

  it('the summary is a native <button type="button"> (the browser gives it Enter and Space; Playwright presses them in the checklist); a function summary reads the state', () => {
    const onOpenChange = vi.fn()
    render(
      <Disclosure chevron={false} summary={(open) => (open ? 'Hide the 3 steps' : 'Show the 3 steps')} onOpenChange={onOpenChange}>
        <span>steps</span>
      </Disclosure>,
    )
    const toggle = screen.getByRole('button', { name: 'Show the 3 steps' })
    expect(toggle.tagName).toBe('BUTTON')
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Hide the 3 steps' })).toHaveAttribute('aria-expanded', 'true')
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('DisclosureButton: a named type="button" with aria-expanded and aria-controls', () => {
    const onToggle = vi.fn()
    render(<DisclosureButton open={false} label="Tue 21 Jul AM details" controls="detail-1" onToggle={onToggle} />)
    const toggle = screen.getByRole('button', { name: 'Tue 21 Jul AM details' })
    expect(toggle).toHaveAttribute('type', 'button')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAttribute('aria-controls', 'detail-1')
    fireEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledOnce()
  })
})

describe('TickGlyph', () => {
  it("is the brand tick, hidden from screen readers, and TickBadge draws it", () => {
    const { container } = render(<TickGlyph size={18} color="#fff" />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg.querySelector('path')).toHaveAttribute('d', 'M2.5 7.5 L5.5 10.5 L11.5 3.5')
    const badge = render(<TickBadge size={24} />)
    expect(badge.container.querySelector('[data-tick-glyph] path')).toHaveAttribute('stroke-width', '2.2')
  })
})

describe('the progress label: one source', () => {
  const states = (Object.keys(LIST_PROGRESS_LABEL) as ListProgress[]).filter((p): p is Exclude<ListProgress, 'upcoming'> => p !== 'upcoming')

  it('every progress state has one word and one tone', () => {
    expect(states.length).toBe(5)
    for (const p of states) {
      expect(progressLabel(p)).toBe(LIST_PROGRESS_LABEL[p])
      expect(['done', 'warning', 'neutral']).toContain(progressTone(p))
    }
    expect(progressTone('submitted')).toBe('done')
    expect(progressTone('toFinish')).toBe('warning')
  })

  it('ProgressPill and the phone ListRow print the same word for every state (upcoming prints nothing)', () => {
    for (const p of states) {
      const pill = render(<ProgressPill progress={p} />)
      expect(pill.container.querySelector(`[data-progress="${p}"]`)).toHaveTextContent(LIST_PROGRESS_LABEL[p])
      pill.unmount()
      const right = p === 'toFinish' ? ({ kind: 'toFinish', count: 2 } as const) : ({ kind: 'progress', progress: p } as const)
      const row = render(<ListRow statusKey="private" title="St George's" right={right} />)
      expect(row.container).toHaveTextContent(p === 'toFinish' ? `2 ${LIST_PROGRESS_LABEL.toFinish.toLowerCase()}` : LIST_PROGRESS_LABEL[p])
      row.unmount()
    }
    expect(render(<ProgressPill progress="upcoming" />).container).toBeEmptyDOMElement()
  })
})

describe('DayChip focus return', () => {
  it('closing hands keyboard focus to the date control, not the page body', async () => {
    const target = document.createElement('input')
    document.body.appendChild(target)
    const onClose = vi.fn()
    render(<DayChip dateISO="2026-03-13" onClose={onClose} returnFocusTo={() => target} />)
    fireEvent.click(screen.getByRole('button', { name: /Friday 13 March 2026/ }))
    expect(onClose).toHaveBeenCalledOnce()
    await waitFor(() => expect(document.activeElement).toBe(target))
    target.remove()
  })
})
