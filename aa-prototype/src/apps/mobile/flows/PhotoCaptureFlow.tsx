import { useEffect, useState } from 'react'
import { accent, neutral, radius } from '../../../theme/tokens'
import { type Actor } from '../../../store'
import { DemoBadge } from '../../../shared'
import { ManualCardForm } from './ManualCardForm'
import { SAMPLE_EXTRACTIONS, type SampleExtraction } from './sampleExtractions'

interface PhotoCaptureFlowProps {
  listId: string
  actor: Actor
  onSaved: (result: { cardId: string; reused: boolean }) => void
}

type Step = { kind: 'pick' } | { kind: 'processing'; sample: SampleExtraction } | { kind: 'review'; sample: SampleExtraction }

/**
 * The photo-of-paper-list path: pick one of two bundled sample cards, a brief
 * simulated processing state (demo-badged), then a pre-filled `ManualCardForm`
 * for review/correct/save. No real OCR — the extraction is canned per sample.
 */
export function PhotoCaptureFlow({ listId, actor, onSaved }: PhotoCaptureFlowProps) {
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
        <DemoBadge label="Simulated capture · sample cards" />
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
        <div style={{ fontSize: 16, fontWeight: 600, color: accent.pressed }}>Reading the card…</div>
        <DemoBadge label="Simulated OCR · no real processing" />
      </div>
    )
  }

  // review
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <DemoBadge label="Review the extracted details" />
      <div style={{ fontSize: 13, color: neutral.slate }}>
        We pre-filled the card from the scan. Check and correct anything before saving.
      </div>
      <ManualCardForm
        listId={listId}
        actor={actor}
        initial={step.sample.fields}
        attachment={{ name: `Paper card ${step.sample.id}`, kind: 'photo', dataUrl: step.sample.imageUrl }}
        onSaved={onSaved}
      />
    </div>
  )
}
