/**
 * The one viewer rule (catch-up Phase 43a; US-15.0.1): who is looking decides
 * whether office-only detail shows. "Keep the anaesthetist's world simple":
 * the anaesthetist sees none of the Contract complexity the office handles.
 *
 * `'office'` only for an office actor; every other actor, `'system'` included,
 * gets the anaesthetist view, so an unexpected actor fails closed. Every place
 * in mobile, web or shared capture code that decides office-only detail (the
 * office's billing set-up and Change price mounts, the multi-procedure rule
 * wording, the old rate labels on the Booking total) reads this; nothing else
 * branches on role for that. Edit rights stay with the store's guards.
 *
 * Never used to fork what the catalogue gives both: the procedure stack
 * (US-03.1.9: the same in both apps) and the price, its calculation and the
 * Booking total (FT-03.5) are the same figures for both viewers.
 *
 * Pure TypeScript: no React, no store import, PWA-safe. Enforced in both
 * directions by `apps/anaesthetistSimplicity.test.tsx`.
 */

import type { ActorRole } from '../domain/types'

export type Viewer = 'office' | 'anaesthetist'

export function viewerOf(actor: { role: ActorRole }): Viewer {
  return actor.role === 'office' ? 'office' : 'anaesthetist'
}

/** Shorthand for the common branch. */
export function isOfficeViewer(actor: { role: ActorRole }): boolean {
  return viewerOf(actor) === 'office'
}
