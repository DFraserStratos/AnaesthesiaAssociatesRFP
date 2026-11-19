/**
 * The Future-scope surface's chrome (catch-up Phase 34; EP-14, RV-14 to RV-16):
 * "Future scope: HL7 and FHIR" at `/demo/integrations`, its three pages (the
 * simulator, the message log and the feed mapping) on one route strip. The
 * HL7 v2 and FHIR tooling left Admin for here: it is shown for discussion,
 * never as in-scope product. The demo surface's badges stay (convention 13).
 */

import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { DemoSurface } from '../DemoSurface'
import { LineTabLink, LineTabs } from '../../../shared/ui'

export const FUTURE_SCOPE_TITLE = 'Future scope: HL7 and FHIR'

/** The one line under the header: what is Future scope and what is in scope today. */
export const FUTURE_SCOPE_LINE =
  "Automatic hospital sync, HL7 v2, FHIR R4, near real time messaging, retries with a dead-letter queue and per-hospital mapping are Future scope, shown for discussion. In scope today: St George's and Southern Cross files imported, and the rooms' PDF lists, on Admin Intake, matched by the office."

export const FUTURE_SCOPE_PAGES = [
  { path: '/demo/integrations', label: 'Simulator' },
  { path: '/demo/integrations/log', label: 'Message log' },
  { path: '/demo/integrations/mapping', label: 'Feed mapping' },
] as const

export function FutureScopeChrome({ subtitle, maxWidth, children }: { subtitle: string; maxWidth?: number; children: ReactNode }) {
  const { pathname } = useLocation()
  const here = pathname.replace(/\/$/, '')
  return (
    <DemoSurface title={FUTURE_SCOPE_TITLE} subtitle={subtitle} futureScope={FUTURE_SCOPE_LINE} subtitleMaxWidth={maxWidth ?? 900} {...(maxWidth !== undefined ? { maxWidth } : {})}>
      <LineTabs label="Future scope pages" shot="future-scope-pages">
        {FUTURE_SCOPE_PAGES.map((p) => (
          <LineTabLink key={p.path} to={p.path} active={here === p.path}>
            {p.label}
          </LineTabLink>
        ))}
      </LineTabs>
      {children}
    </DemoSurface>
  )
}
