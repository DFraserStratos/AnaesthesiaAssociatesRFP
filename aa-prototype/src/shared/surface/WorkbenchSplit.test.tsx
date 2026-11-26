import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { WORKBENCH_FEED_WIDTH, WorkbenchSplit } from './WorkbenchSplit'

afterEach(cleanup)

describe('WorkbenchSplit', () => {
  it('renders the feed and the workbench as two labelled regions, generic names by default', () => {
    render(<WorkbenchSplit feed={<p>Feed body</p>} workbench={<p>Bench body</p>} />)
    const feed = screen.getByRole('region', { name: 'List' })
    const bench = screen.getByRole('region', { name: 'Detail' })
    expect(feed).toHaveTextContent('Feed body')
    expect(bench).toHaveTextContent('Bench body')
    expect(feed).toHaveAttribute('data-workbench-split-feed')
    expect(bench).toHaveAttribute('data-workbench-split-bench')
    // Feed first, then the bench.
    expect(feed.compareDocumentPosition(bench) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("takes the caller's labels", () => {
    render(<WorkbenchSplit feed="a" workbench="b" feedLabel="Arrivals" workbenchLabel="Workbench" />)
    expect(screen.getByRole('region', { name: 'Arrivals' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Workbench' })).toBeInTheDocument()
  })

  it('sets the feed at 400px by default, or the width given; each column scrolls on its own', () => {
    const { container, rerender } = render(<WorkbenchSplit feed="a" workbench="b" />)
    const feed = () => container.querySelector('[data-workbench-split-feed]') as HTMLElement
    const bench = () => container.querySelector('[data-workbench-split-bench]') as HTMLElement
    expect(WORKBENCH_FEED_WIDTH).toBe(400)
    expect(feed().style.width).toBe('400px')
    expect(feed().style.flex).toMatch(/^0 0 auto|none$/)
    rerender(<WorkbenchSplit feed="a" workbench="b" feedWidth={360} />)
    expect(feed().style.width).toBe('360px')
    for (const col of [feed(), bench()]) {
      expect(col.style.overflow).toBe('auto')
      expect(col.style.minHeight).toBe('0px')
    }
  })

  it('fills a fit page body, framed by default and flush on request', () => {
    const { container, rerender } = render(<WorkbenchSplit feed="a" workbench="b" shot="intake-split" />)
    const root = () => container.querySelector('[data-shot="intake-split"]') as HTMLElement
    expect(root().style.minHeight).toBe('0px')
    expect(root().style.display).toBe('flex')
    expect(root().style.borderRadius).not.toBe('')
    rerender(<WorkbenchSplit feed="a" workbench="b" shot="intake-split" framed={false} />)
    expect(root().style.borderRadius).toBe('')
  })

  it('puts shot and data-* on the root, and the caller style wins', () => {
    const { container } = render(
      <WorkbenchSplit feed="a" workbench="b" shot="intake-split" data-testid="split" data-arrival="A-1" style={{ minHeight: 480 }} />,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('data-shot', 'intake-split')
    expect(root).toHaveAttribute('data-testid', 'split')
    expect(root).toHaveAttribute('data-arrival', 'A-1')
    expect(root.style.minHeight).toBe('480px')
  })

  it('is not modal: no dialog, no aria-modal, nothing inert, no scrim', () => {
    const { container, baseElement } = render(
      <div>
        <button type="button">Outside</button>
        <WorkbenchSplit feed={<button type="button">In the feed</button>} workbench={<button type="button">In the bench</button>} />
      </div>,
    )
    expect(baseElement.querySelector('[role="dialog"]')).toBeNull()
    expect(baseElement.querySelector('[aria-modal]')).toBeNull()
    expect(baseElement.querySelector('[inert]')).toBeNull()
    expect(baseElement.querySelector('[aria-hidden="true"]')).toBeNull()
    // Rendered in place, not portalled.
    expect(container.contains(screen.getByRole('button', { name: 'In the bench' }))).toBe(true)
    for (const name of ['Outside', 'In the feed', 'In the bench']) {
      const button = screen.getByRole('button', { name })
      button.focus()
      expect(document.activeElement).toBe(button)
    }
  })
})
