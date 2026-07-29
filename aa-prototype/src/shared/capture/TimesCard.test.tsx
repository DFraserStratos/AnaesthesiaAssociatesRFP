import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ANAE, SEED_MARKERS } from '../../domain/seed'
import {
  editProcedure,
  proceduresForCard,
  resetDemo,
  useAppStore,
  type Actor,
} from '../../store'
import { SurfaceProvider } from '../surface/SurfaceProvider'
import type { SurfaceVariant } from '../surface'
import { TimesCard } from './TimesCard'

const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.souter,
}

function pendingProcedureId(): string {
  const cardId = SEED_MARKERS.pendingCaptureCard?.entityId
  if (cardId === undefined) throw new Error('Missing pending capture marker')
  const procedure = proceduresForCard(useAppStore.getState(), cardId)[0]
  if (procedure === undefined) throw new Error('Pending card has no procedure')
  return procedure.id
}

function Harness({
  procedureId,
  variant = 'mobile',
}: {
  procedureId: string
  variant?: SurfaceVariant
}) {
  const procedure = useAppStore((state) => state.schedule.procedures[procedureId])
  if (procedure === undefined) return null
  return (
    <SurfaceProvider variant={variant}>
      <TimesCard
        procedure={procedure}
        actor={SOUTER}
        canCapture
        failures={[]}
        onError={() => undefined}
      />
    </SurfaceProvider>
  )
}

describe('Times card action', () => {
  beforeEach(() => {
    resetDemo(useAppStore)
    const procedureId = pendingProcedureId()
    const outcome = editProcedure(useAppStore, SOUTER, procedureId, {
      anaestheticStartISO: undefined,
      handoverISO: undefined,
    })
    if (!outcome.ok) throw new Error(outcome.message)
  })

  afterEach(() => {
    resetDemo(useAppStore)
  })

  it('keeps one action button while it moves right and reveals the start controls', () => {
    const procedureId = pendingProcedureId()
    render(<Harness procedureId={procedureId} />)

    const slider = screen.getByTestId('time-action-slider')
    const startButton = screen.getByRole('button', { name: 'Start now' })
    expect(slider).toHaveAttribute('data-position', 'left')
    expect(slider).toHaveStyle({ transform: 'translateX(0)' })

    fireEvent.click(startButton)

    const finishButton = screen.getByRole('button', { name: 'Finish now' })
    expect(finishButton).toBe(startButton)
    expect(slider).toHaveAttribute('data-position', 'right')
    expect(slider.style.transform).toContain('calc(100% + 12px)')
    expect(screen.getByText('Start', { exact: true })).toBeVisible()
    expect(screen.getByText('08:00', { exact: true })).toBeVisible()
    expect(screen.getByRole('button', { name: '−5' })).toBeVisible()
    expect(screen.getByRole('button', { name: '+5' })).toBeVisible()
    expect(screen.queryByText('Stamped from the demo clock')).not.toBeInTheDocument()
  })

  it('uses the same full-width two-position track on the web', () => {
    const procedureId = pendingProcedureId()
    render(<Harness procedureId={procedureId} variant="web" />)

    const track = screen.getByTestId('time-capture-track')
    const slider = screen.getByTestId('time-action-slider')
    const startButton = screen.getByRole('button', { name: 'Start now' })

    expect(track).toHaveStyle({
      gridTemplateColumns: '1fr 1fr',
      minHeight: '56px',
      width: '100%',
    })
    expect(track).toHaveAttribute('data-layout', 'compact')
    expect(slider).toHaveStyle({
      width: 'calc((100% - 12px) / 2)',
      transform: 'translateX(0)',
    })
    expect(startButton).toHaveStyle({ minHeight: '56px' })

    fireEvent.click(startButton)

    expect(screen.getByRole('button', { name: 'Finish now' })).toBe(startButton)
    expect(slider).toHaveAttribute('data-position', 'right')
    expect(screen.getByText('Start', { exact: true })).toBeVisible()
  })

  it.each(['mobile', 'web'] as const)(
    'defaults a future appointment finish to five minutes after its start on %s',
    (variant) => {
      const procedureId = pendingProcedureId()
      const outcome = editProcedure(useAppStore, SOUTER, procedureId, {
        anaestheticStartISO: '2026-07-21T16:05:00',
      })
      if (!outcome.ok) throw new Error(outcome.message)

      render(<Harness procedureId={procedureId} variant={variant} />)
      fireEvent.click(screen.getByRole('button', { name: 'Finish now' }))

      expect(screen.getByText('16:10', { exact: true })).toBeVisible()
      expect(useAppStore.getState().schedule.procedures[procedureId]?.handoverISO).toBe(
        '2026-07-21T16:10:00',
      )
      expect(screen.queryByText(/^Duration /)).not.toBeInTheDocument()
      expect(screen.queryByText(/1 unit per 15 min/)).not.toBeInTheDocument()
    },
  )
})
