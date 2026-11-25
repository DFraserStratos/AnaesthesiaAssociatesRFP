import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { brand, elevation, neutral, radius, semantic } from '../../theme/tokens'
import { Card } from './Card'
import { DefList, DefRow } from './DefRow'
import { Eyebrow } from './Eyebrow'
import { FieldLabel } from './Field'
import { PageHeader } from './PageHeader'
import { StatTile } from './StatTile'

/** UI unification U6 (U14, U22, U31): card, eyebrow, page header, stat tile, label and value rows. */
describe('Eyebrow', () => {
  it('is 11/600/0.06em caps in mist, a div by default', () => {
    render(<Eyebrow>Recently billed</Eyebrow>)
    const e = screen.getByText('Recently billed')
    expect(e.tagName).toBe('DIV')
    expect(e).toHaveStyle({ fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist })
  })

  it('as h3 titles a section, reachable by heading; tones and id', () => {
    render(
      <>
        <Eyebrow as="h3" id="sect">Times</Eyebrow>
        <Eyebrow tone="warning">Unassigned</Eyebrow>
        <Eyebrow tone="brand">Today</Eyebrow>
        <Eyebrow tone="slate">Billing</Eyebrow>
      </>,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'Times' })).toHaveAttribute('id', 'sect')
    expect(screen.getByText('Unassigned')).toHaveStyle({ color: semantic.warning.onTint })
    expect(screen.getByText('Today')).toHaveStyle({ color: brand.base })
    expect(screen.getByText('Billing')).toHaveStyle({ color: neutral.slate })
  })

  it('FieldLabel is the Eyebrow', () => {
    expect(FieldLabel).toBe(Eyebrow)
  })
})

describe('Card', () => {
  it('card: 16, gap 10, flat; the title an h2 naming the section', () => {
    render(<Card title="Notifications" shot="admin-notifications-rail" data-room="r1">body</Card>)
    const section = screen.getByRole('region', { name: 'Notifications' })
    expect(section.tagName).toBe('SECTION')
    expect(section).toHaveAttribute('data-shot', 'admin-notifications-rail')
    expect(section).toHaveAttribute('data-room', 'r1')
    expect(section).toHaveStyle({ padding: '16px', gap: '10px', borderRadius: `${radius.card}px` })
    expect(section.style.boxShadow).toBe('')
    expect(screen.getByRole('heading', { level: 2, name: 'Notifications' })).toHaveStyle({ fontSize: '14px', fontWeight: '600' })
  })

  it('panel: 20, gap 14, e1, a 17/600 heading; h3 with titleLevel; flush keeps the heading inset', () => {
    render(<Card padding="panel" title="Leave" titleLevel={3} flush>body</Card>)
    const section = screen.getByRole('region', { name: 'Leave' })
    expect(section).toHaveStyle({ padding: '0px', gap: '14px', boxShadow: elevation.e1 })
    const heading = screen.getByRole('heading', { level: 3, name: 'Leave' })
    expect(heading).toHaveStyle({ fontSize: '17px' })
    expect(heading.parentElement).toHaveStyle({ padding: '20px 20px 0px' })
  })

  it('elevation overrides the look; tone warning tints it; headingRef takes focus', () => {
    const ref = createRef<HTMLHeadingElement>()
    render(
      <>
        <Card title="Rail" elevation="e1" shot="a">x</Card>
        <Card title="Handoff" tone="warning" headingRef={ref} shot="b">y</Card>
      </>,
    )
    expect(document.querySelector('[data-shot="a"]')).toHaveStyle({ boxShadow: elevation.e1 })
    expect(document.querySelector('[data-shot="b"]')).toHaveStyle({ background: semantic.warning.tint })
    expect(ref.current).toHaveAttribute('tabindex', '-1')
    ref.current?.focus()
    expect(document.activeElement).toBe(ref.current)
  })

  it('without a title there is no heading and no label', () => {
    render(<Card shot="plain">x</Card>)
    expect(document.querySelector('[data-shot="plain"]')).not.toHaveAttribute('aria-labelledby')
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('step: a numbered chip before the heading, which keeps its own name (Phase 46)', () => {
    render(<Card title="Pricing" step={2} shot="stepped">body</Card>)
    const card = document.querySelector('[data-shot="stepped"]')!
    expect(card).toHaveAttribute('data-card-step', '2')
    const chip = card.querySelector('[data-card-step-chip]')!
    expect(chip).toHaveTextContent('2')
    expect(chip).toHaveAttribute('aria-hidden')
    expect(screen.getByRole('heading', { name: 'Pricing' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Pricing' })).toHaveTextContent('body')
  })

  it('no step by default: no chip', () => {
    render(<Card title="Plain" shot="unstepped">x</Card>)
    expect(document.querySelector('[data-shot="unstepped"] [data-card-step-chip]')).toBeNull()
    expect(document.querySelector('[data-shot="unstepped"]')).not.toHaveAttribute('data-card-step')
  })
})

describe('PageHeader', () => {
  it('an h1 by default: web 28/34, admin 24/30; actions beside it', () => {
    const { rerender } = render(<PageHeader size="web" title="Lists" sub="Your Lists" actions={<button type="button">Go</button>} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Lists' })).toHaveStyle({ fontSize: '28px', lineHeight: '34px' })
    expect(screen.getByText('Your Lists')).toHaveStyle({ fontSize: '14px', color: neutral.slate })
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
    rerender(<PageHeader size="admin" title="Invoices" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Invoices' })).toHaveStyle({ fontSize: '24px', lineHeight: '30px' })
  })

  it('level 2, section size, count and headingRef', () => {
    const ref = createRef<HTMLHeadingElement>()
    render(
      <>
        <PageHeader size="section" title="Contracts" />
        <PageHeader size="admin" title="Notifications" count={<span>3</span>} headingRef={ref} />
      </>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Contracts' })).toHaveStyle({ fontSize: '18px' })
    const h1 = screen.getByRole('heading', { level: 1, name: /^Notifications/ })
    expect(h1).toBe(ref.current)
    expect(h1).toHaveAttribute('tabindex', '-1')
  })
})

describe('StatTile', () => {
  it('quiet: bg, radius 10, mono 24, the success pill', () => {
    render(<StatTile variant="quiet" label="Lists this week" value="9" pill="+2" shot="q" />)
    const tile = document.querySelector('[data-shot="q"]')!
    expect(tile).toHaveStyle({ background: neutral.bg, borderRadius: `${radius.ctl}px`, padding: '12px 14px' })
    expect(screen.getByText('9')).toHaveStyle({ fontSize: '24px' })
    expect(screen.getByText('+2')).toHaveStyle({ color: semantic.success.onTint })
    expect(screen.getByText('Lists this week')).toHaveStyle({ fontSize: '11px', fontWeight: '600' })
  })

  it('outlined: white, line, radius 12, 14px 16px, mono 22; sub and the warning figure', () => {
    render(<StatTile variant="outlined" label="Flags" value="2" sub="to check before authorising" tone="warning" shot="o" />)
    const tile = document.querySelector('[data-shot="o"]')!
    expect(tile).toHaveStyle({ background: neutral.surface, borderRadius: `${radius.md}px`, padding: '14px 16px' })
    expect(screen.getByText('2')).toHaveStyle({ fontSize: '22px', color: semantic.warning.onTint })
    expect(screen.getByText('to check before authorising')).toBeInTheDocument()
  })
})

describe('DefRow', () => {
  it('a dl of terms and values; inline at an 80px label by default', () => {
    render(
      <DefList shot="rows">
        <DefRow label="Hospital">Mercy</DefRow>
        <DefRow label="Note" labelWidth={96} note="Typed by the office">Late start</DefRow>
      </DefList>,
    )
    const list = document.querySelector('[data-shot="rows"]')!
    expect(list.tagName).toBe('DL')
    const term = screen.getByText('Hospital')
    expect(term.tagName).toBe('DT')
    expect(term).toHaveStyle({ width: '80px', fontSize: '12px', color: neutral.mist })
    expect(screen.getByText('Mercy').tagName).toBe('DD')
    expect(screen.getByText('Note')).toHaveStyle({ width: '96px' })
    expect(screen.getByText('Typed by the office')).toHaveStyle({ color: neutral.mist })
  })

  it('stacked: the label over a mono value with its note', () => {
    render(<DefList><DefRow layout="stacked" label="HPI CPN" mono note="From the register">47REIA</DefRow></DefList>)
    expect(screen.getByText('HPI CPN')).toHaveStyle({ fontWeight: '600' })
    expect(screen.getByText('47REIA')).toHaveClass('mono')
    expect(screen.getByText('From the register').tagName).toBe('DD')
  })

  it('settings: slate label left, mono value right, trailing after', () => {
    render(<DefList><DefRow layout="settings" label="Bank account" trailing={<span data-testid="lock">lock</span>}>12-3456</DefRow></DefList>)
    expect(screen.getByText('Bank account')).toHaveStyle({ color: neutral.slate, fontSize: '14px' })
    expect(screen.getByText('12-3456')).toHaveStyle({ textAlign: 'right' })
    expect(screen.getByText('12-3456')).toHaveClass('mono')
    expect(screen.getByTestId('lock')).toBeInTheDocument()
  })

  it('tone warning colours the value; labelTone slate', () => {
    render(<DefList><DefRow label="Email" labelTone="slate" tone="warning">Missing</DefRow></DefList>)
    expect(screen.getByText('Email')).toHaveStyle({ color: neutral.slate })
    expect(screen.getByText('Missing')).toHaveStyle({ color: semantic.warning.onTint })
  })
})
