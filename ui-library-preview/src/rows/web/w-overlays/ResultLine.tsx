import { useState, type CSSProperties } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Toaster } from '@/components/ui/sonner'
import { Echo, KnobButton } from './shared'

const RESULT_SAMPLES = ['Your three days off are saved.', 'Thursday AM is open for cover again.'] as const
const TOASTER_ID = 'web-w-overlays-result-line'

export type ResultStyle = 'inline' | 'teal-toast' | 'neutral-toast'

/** Sonner reads these vars on the toast itself, so the tint stays local to this row. */
const TEAL_TOAST: CSSProperties = {
  '--normal-bg': 'var(--teal-tint)',
  '--normal-border': 'var(--teal-tint)',
  '--normal-text': 'var(--teal-pressed)',
} as CSSProperties

/**
 * An availability action's result line, three ways: kept inline as a
 * teal-tint shadcn Alert (role=status, today's look), or a Sonner toast, teal
 * tint or the kit's neutral card. The toaster is mounted inside this box (a
 * containing block for its fixed position) so toasts appear in the row.
 * Refusals stay inline (FormError) in every option.
 */
export function ResultLineReplacement({ style }: { style: ResultStyle }) {
  const [line, setLine] = useState<string | null>(style === 'inline' ? RESULT_SAMPLES[0] : null)
  const [last, setLast] = useState<string | null>(null)

  function show(text: string) {
    if (style === 'inline') {
      setLine(text)
      return
    }
    setLast(text)
    toast(<span className={style === 'teal-toast' ? 'tw:text-teal-pressed' : undefined}>{text}</span>, {
      toasterId: TOASTER_ID,
      id: 'availability-result',
      style: style === 'teal-toast' ? TEAL_TOAST : undefined,
    })
  }

  return (
    <div className="tw:relative tw:min-h-[150px] tw:[transform:translateZ(0)]">
      <div className="tw:mb-2.5 tw:flex tw:gap-1.5">
        {RESULT_SAMPLES.map((s, i) => (
          <KnobButton key={s} onClick={() => show(s)}>
            Sample {i + 1}
          </KnobButton>
        ))}
        <KnobButton
          onClick={() => {
            setLine(null)
            setLast(null)
            toast.dismiss('availability-result')
          }}
        >
          Clear
        </KnobButton>
      </div>
      {style === 'inline' ? (
        line !== null && (
          <Alert role="status" className="tw:bg-teal-tint tw:text-teal-pressed">
            <AlertDescription className="tw:text-teal-pressed">{line}</AlertDescription>
          </Alert>
        )
      ) : (
        <>
          <Echo>{last !== null ? 'The result shows as a toast (bottom right of this box) and is announced politely.' : 'Pick a sample to show its result.'}</Echo>
          <Toaster id={TOASTER_ID} position="bottom-right" offset={0} duration={6000} closeButton={false} />
        </>
      )}
    </div>
  )
}
