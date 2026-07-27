import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

/**
 * Route ids outlive the seed — a bookmarked `/web/lists/L-0412` must survive a
 * `PERSIST_VERSION` bump that dropped that list. Every screen already
 * null-guards a missing entity, but a blank page reads as broken; this turns the
 * blank into a redirect to the parent route.
 *
 * `to=".."` is route-relative (not path-relative), so the `:listId` / `:cardId`
 * / `:invoiceId` routes are nested one segment deep under the collection they
 * fall back to — see `router.tsx`.
 */
export function RequireEntity({ exists, children }: { exists: boolean; children: ReactNode }) {
  return exists ? <>{children}</> : <Navigate to=".." replace />
}
