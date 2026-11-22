/**
 * The welcome card each app shows on a first visit (catch-up Phase 43a;
 * US-15.0.1): a calm inline card in the page flow, never a modal or a scrim,
 * that says where to start and that the info sign explains a heading. "Got it"
 * dismisses it for this browser (`firstRunHints.ts`); Reset and "Show first-run
 * hints again" bring it back. Imports nothing from apps or shell (PWA closure).
 */

import { Info } from 'lucide-react'
import type { CSSProperties } from 'react'
import { accent, neutral, type as typeScale } from '../../theme/tokens'
import { Card } from '../ui/Card'
import { TextAction } from '../ui/TextAction'
import { dismissHint, useHintShown, type HintApp } from './firstRunHints'
import { DRAFT_LISTS } from '../scheduleTerms'

export const FIRST_RUN_COPY: Readonly<Record<HintApp, { title: string; body: string }>> = {
  mobile: {
    title: 'Welcome to your Lists',
    body: "Today's Lists come first. Tap a List to see its Bookings, then a Booking to capture it. Tap the info sign beside a heading for a short explanation.",
  },
  web: {
    title: 'Welcome',
    body: 'Your week is here, and Lists holds every List and Booking. Select the info sign beside a heading for a short explanation.',
  },
  admin: {
    title: 'The day at a glance',
    body: `Every anaesthetist's morning and afternoon, ${DRAFT_LISTS} waiting for one, and your to-do list and notifications on the right. Select the info sign beside a heading for a short explanation.`,
  },
}

export function FirstRunHint({ app, style }: { app: HintApp; style?: CSSProperties }) {
  const shown = useHintShown(app)
  if (!shown) return null
  const copy = FIRST_RUN_COPY[app]
  const touch = app === 'mobile'
  return (
    // The shared Card (work item 17) on the teal tint the doc draws, e1, no border: a calm note, never a modal.
    <Card
      shot={`first-run-hint-${app}`}
      elevation="e1"
      style={{ background: accent.tint, borderColor: 'transparent', padding: touch ? '14px 16px' : '12px 16px', flexDirection: 'row', alignItems: 'flex-start', gap: 12, ...style }}
    >
      <Info size={20} strokeWidth={2} color={accent.base} aria-hidden style={{ flex: 'none', marginTop: 1 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: touch ? typeScale.body.size : 14, lineHeight: '20px', fontWeight: 700, color: neutral.ink }}>{copy.title}</div>
        <p style={{ margin: 0, fontSize: touch ? 14 : typeScale.labelLg.size, lineHeight: touch ? '20px' : '19px', color: neutral.slate }}>{copy.body}</p>
        <span style={{ marginTop: 2 }}>
          <TextAction size={touch ? 'lg' : 'md'} flush shot={`first-run-hint-${app}-dismiss`} onClick={() => dismissHint(app)}>
            Got it
          </TextAction>
        </span>
      </div>
    </Card>
  )
}
