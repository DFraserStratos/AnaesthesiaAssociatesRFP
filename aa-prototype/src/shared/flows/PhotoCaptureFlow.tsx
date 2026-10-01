import { useEffect, useState } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'
import { type Actor } from '../../store'
import type { BookingSource } from '../../domain/types'
import { DemoBadge } from '../DemoBadge'
import { ManualBookingForm } from './ManualBookingForm'
import { SAMPLE_EXTRACTIONS, type SampleExtraction } from './sampleExtractions'

interface PhotoCaptureFlowProps {
  listId: string
  actor: Actor
  source?: BookingSource
  onSaved: (result: { bookingId: string; reused: boolean }) => void
}

type Step = { kind: 'pick' } | { kind: 'processing'; sample: SampleExtraction } | { kind: 'review'; sample: SampleExtraction }

/**
 * The photo-of-paper-list path: pick one of two bundled sample cards, a brief
 * simulated processing state (demo-badged), then a pre-filled `ManualBookingForm`
 * for review/correct/save. No real OCR — the extraction is canned per sample.
 */
export function PhotoCaptureFlow({ listId, actor, source, onSaved }: PhotoCaptureFlowProps) {
  const [step, setStep] = useState<Step>({ kind: 'pick' })

  useEffect(() => {
    if (step.kind !== 'processing') return
    const sample = step.sample
    const t = setTimeout(() => setStep({ kind: 'review', sample }), 900)
    return () => clearTimeout(t)
  }, [step])

  if (step.kind === 'pick') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Photo of the paper list</div>
        <DemoBadge label="Simulated capture · sample paper cards" />
        <div style={{ fontSize: 13, color: neutral.slate }}>Pick a sample paper card to scan.</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {SAMPLE_EXTRACTIONS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => setStep({ kind: 'processing', sample })}
              style={{
                flex: 1,
                border: `1px solid ${neutral.line}`,
                borderRadius: radius.card,
                background: neutral.surface,
                padding: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <img
                src={sample.imageUrl}
                alt={`Sample paper card: ${sample.label}`}
                style={{ width: '100%', borderRadius: 8, display: 'block', border: `1px solid ${neutral.line}` }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: neutral.slate }}>{sample.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step.kind === 'processing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '32px 0' }}>
        <img
          src={step.sample.imageUrl}
          alt="Scanning"
          style={{ width: 160, borderRadius: 8, border: `1px solid ${neutral.line}`, opacity: 0.85 }}
        />
        <div style={{ fontSize: 16, fontWeight: 600, color: accent.pressed }}>Reading the paper card…</div>
        <DemoBadge label="Simulated OCR · no real processing" />
      </div>
    )
  }

  // review
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <DemoBadge label="Review the extracted details" />
      <div style={{ fontSize: 13, color: neutral.slate }}>
        We pre-filled the booking from the scan. Check and correct anything before saving.
      </div>
      <ManualBookingForm
        listId={listId}
        actor={actor}
        initial={step.sample.fields}
        attachment={{ name: `Paper card ${step.sample.id}`, kind: 'photo', dataUrl: step.sample.imageUrl }}
        source={source}
        onSaved={onSaved}
      />
    </div>
  )
}
