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

function Harness({ procedureId }: { procedureId: string }) {
  const procedure = useAppStore((state) => state.schedule.procedures[procedureId])
  if (procedure === undefined) return null
  return (
    <SurfaceProvider variant="mobile">
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

describe('mobile Times card action', () => {
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

    const slider = screen.getByTestId('mobile-time-action-slider')
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
})
