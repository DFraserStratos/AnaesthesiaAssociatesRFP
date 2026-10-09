/**
 * The status chip reads the availability status master (catch-up Phase 29;
 * US-01.2.2): a rename or recolour shows at once, a List kind keeps its fixed
 * label and colour, and an unknown ID never shows its raw ID.
 */

import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../store'
import { freshAppState } from '../store/appStore'
import { OFFICE_ACTOR } from '../store/demoActors'
import { editSlotStatus } from '../store/slotStatusActions'
import { STATUS_PALETTE } from '../theme/statusColours'
import { StatusChip } from './StatusChip'

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

describe('StatusChip', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('renders a status\'s label and follows a rename and a recolour without a reload', () => {
    render(<StatusChip status="unavailable" />)
    expect(screen.getByText('Unavailable')).toBeTruthy()
    const s = useAppStore.getState().masters.slotStatuses['unavailable']!
    act(() => {
      editSlotStatus(useAppStore, OFFICE_ACTOR, 'unavailable', {
        label: 'Blocked', longLabel: 'Blocked', description: s.description, colour: 'public', treatment: s.treatment, bookable: s.bookable, anaesthetistCanSet: s.anaesthetistCanSet, isDefault: false,
      })
    })
    const label = screen.getByText('Blocked')
    expect((label.parentElement as HTMLElement).style.background).toBe(hexToRgb(STATUS_PALETTE.public.tint))
  })

  it('renders a List kind with its fixed label and token', () => {
    render(<StatusChip status="preop" />)
    const label = screen.getByText('Pre-op')
    expect((label.parentElement as HTMLElement).style.background).toBe(hexToRgb(STATUS_PALETTE.preop.tint))
  })

  it('renders an unknown ID as "Unknown status", never the raw ID', () => {
    render(<StatusChip status="ST9999" />)
    expect(screen.getByText('Unknown status')).toBeTruthy()
    expect(screen.queryByText('ST9999')).toBeNull()
  })
})
