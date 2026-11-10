import { useState } from 'react'
import { useInRouterContext, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store'
import { accent, neutral, radius } from '../../theme/tokens'
import { useDemoTriggerPublished } from './context'
import { DemoTriggerBadge } from './DemoTriggerBadge'
import { DEMO_TRIGGERS } from './registry'
import type { DemoTriggerCtx } from './types'

/**
 * A registry entry run from inside a product sheet, on the row it acts on
 * (catch-up Phase 32b): the Assign and Reassign pickers are dialogs whose
 * scrim covers the harness bar, so the colleague stand-in sits on each
 * unavailable colleague's row instead. It is still the registry's entry (its
 * `disabledReason` and `run`), badged as a demo trigger, never product UI.
 */
type InlineDemoTriggerProps = { id: string; choiceId: string; label: string; onRan?: () => void }

export function InlineDemoTrigger(props: InlineDemoTriggerProps) {
  // A sheet rendered outside the router (a component test) still runs the entry.
  return useInRouterContext() ? <RoutedInlineDemoTrigger {...props} /> : <InlineDemoTriggerAt {...props} pathname="" />
}

function RoutedInlineDemoTrigger(props: InlineDemoTriggerProps) {
  const { pathname } = useLocation()
  return <InlineDemoTriggerAt {...props} pathname={pathname} />
}

function InlineDemoTriggerAt({ id, choiceId, label, onRan, pathname }: InlineDemoTriggerProps & { pathname: string }) {
  const published = useDemoTriggerPublished()
  const state = useAppStore()
  const [message, setMessage] = useState<string | null>(null)
  const trigger = DEMO_TRIGGERS.find((t) => t.id === id)
  if (trigger === undefined) return null
  const ctx: DemoTriggerCtx = { pathname, params: {}, published }
  const reason = trigger.disabledReason(state, ctx, choiceId)
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <DemoTriggerBadge badge={trigger.badge} />
        <button
          type="button"
          data-shot={`demo-action-${id}-inline`}
          disabled={reason !== null}
          title={reason ?? trigger.description}
          onClick={() => {
            const res = trigger.run(useAppStore, ctx, choiceId)
            setMessage(res.ok ? null : res.message)
            if (res.ok) onRan?.()
          }}
          style={{
            border: `1px dashed ${accent.base}`,
            background: neutral.surface,
            color: accent.base,
            borderRadius: radius.ctl,
            padding: '4px 10px',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 600,
            cursor: reason === null ? 'pointer' : 'default',
            opacity: reason === null ? 1 : 0.6,
          }}
        >
          {label}
        </button>
      </span>
      {reason !== null && <span style={{ fontSize: 11.5, color: neutral.mist }}>{reason}</span>}
      {message !== null && <span role="status" style={{ fontSize: 11.5, color: neutral.slate }}>{message}</span>}
    </span>
  )
}
