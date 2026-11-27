/**
 * The rate and tier card (build plan Phase 50; US-01.3.6, DM-09, D102): a click never saves, Cancel
 * leaves both, Save writes only what changed, both in one change set, and a refused rate writes
 * nothing.
 */

import { fireEvent, render, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ANAE } from '../../../domain/seed'
import { UNIT_VALUE_INVALID, freshAppState, useAppStore, type Actor } from '../../../store'
import { selectPriorityTier } from '../../../store/officePrivate'
import { TIER_SHORT_LABELS } from '../../../domain/pairingPreferences'
import { RateTierCard } from './RateTierCard'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderCard() {
  render(<RateTierCard anaesthetistId={ANAE.sharma} actor={OFFICE} />)
  return document.querySelector('[data-shot="rate-tier-card"]') as HTMLElement
}

const audit = () => useAppStore.getState().audit
const rate = () => useAppStore.getState().masters.anaesthetists[ANAE.sharma]!.unitValue
const tier = () => selectPriorityTier(useAppStore.getState(), ANAE.sharma)

function edit(card: HTMLElement) {
  fireEvent.click(within(card).getByRole('button', { name: 'Edit rate and offer order' }))
}

function setRate(card: HTMLElement, value: string) {
  fireEvent.change(within(card).getByLabelText(/Rate per unit/), { target: { value } })
}

/** A tier the anaesthetist is not in now. */
function otherTier() {
  return tier() === 1 ? 2 : 1
}

describe('RateTierCard', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('at rest shows the rate and the tier, office only, and writes nothing', () => {
    const before = audit().length
    const card = renderCard()
    expect(within(card).getByText('Rate and offer order')).toBeInTheDocument()
    expect(within(card).getByText('Rate per unit')).toBeInTheDocument()
    expect(within(card).getByText(TIER_SHORT_LABELS[tier()])).toBeInTheDocument()
    expect(within(card).getByText('· office only')).toBeInTheDocument()
    expect(card.getAttribute('data-tier')).toBe(String(tier()))
    expect(within(card).queryByRole('button', { name: 'First' })).toBeNull()
    expect(audit().length).toBe(before)
  })

  it('a tier click moves only the draft; Cancel restores both values', () => {
    const before = audit().length
    const tierBefore = tier()
    const rateBefore = rate()
    const card = renderCard()
    edit(card)
    expect(card.hasAttribute('data-editing')).toBe(true)
    fireEvent.click(within(card).getByRole('button', { name: TIER_SHORT_LABELS[otherTier()] }))
    setRate(card, '99.00')
    expect(audit().length).toBe(before)
    expect(tier()).toBe(tierBefore)
    fireEvent.click(within(card).getByRole('button', { name: 'Cancel' }))
    expect(card.hasAttribute('data-editing')).toBe(false)
    expect(audit().length).toBe(before)
    expect(tier()).toBe(tierBefore)
    expect(rate()).toBe(rateBefore)
    edit(card)
    expect((within(card).getByLabelText(/Rate per unit/) as HTMLInputElement).value).toBe(rateBefore.toFixed(2))
  })

  it('Save with only the tier changed writes one anaesthetist.tierSet', () => {
    const before = audit().length
    const next = otherTier()
    const card = renderCard()
    edit(card)
    fireEvent.click(within(card).getByRole('button', { name: TIER_SHORT_LABELS[next] }))
    fireEvent.click(within(card).getByRole('button', { name: 'Save' }))
    expect(tier()).toBe(next)
    expect(audit().slice(before).map((e) => e.action)).toEqual(['anaesthetist.tierSet'])
    expect(card.hasAttribute('data-editing')).toBe(false)
  })

  it('Save with only the rate changed writes one anaesthetist.update', () => {
    const before = audit().length
    const tierBefore = tier()
    const card = renderCard()
    edit(card)
    setRate(card, '31.50')
    fireEvent.click(within(card).getByRole('button', { name: 'Save' }))
    expect(rate()).toBe(31.5)
    expect(tier()).toBe(tierBefore)
    expect(audit().slice(before).map((e) => e.action)).toEqual(['anaesthetist.update'])
  })

  it('Save with both changed writes both in one change set', () => {
    const before = audit().length
    const next = otherTier()
    const card = renderCard()
    edit(card)
    setRate(card, '32.00')
    fireEvent.click(within(card).getByRole('button', { name: TIER_SHORT_LABELS[next] }))
    fireEvent.click(within(card).getByRole('button', { name: 'Save' }))
    const written = audit().slice(before)
    expect(written.map((e) => e.action)).toEqual(['anaesthetist.update', 'anaesthetist.tierSet'])
    expect(written[0]!.changeSetId).toBeDefined()
    expect(written[1]!.changeSetId).toBe(written[0]!.changeSetId)
    expect(rate()).toBe(32)
    expect(tier()).toBe(next)
  })

  it('a bad rate shows the refusal on the card and writes neither', () => {
    const before = audit().length
    const tierBefore = tier()
    const rateBefore = rate()
    const card = renderCard()
    edit(card)
    setRate(card, '')
    fireEvent.click(within(card).getByRole('button', { name: TIER_SHORT_LABELS[otherTier()] }))
    fireEvent.click(within(card).getByRole('button', { name: 'Save' }))
    expect(within(card).getByText(UNIT_VALUE_INVALID)).toBeInTheDocument()
    expect(card.hasAttribute('data-editing')).toBe(true)
    expect(audit().length).toBe(before)
    expect(rate()).toBe(rateBefore)
    expect(tier()).toBe(tierBefore)
  })

  it('Save with no change closes the card and writes nothing', () => {
    const before = audit().length
    const card = renderCard()
    edit(card)
    fireEvent.click(within(card).getByRole('button', { name: 'Save' }))
    expect(card.hasAttribute('data-editing')).toBe(false)
    expect(audit().length).toBe(before)
  })
})
