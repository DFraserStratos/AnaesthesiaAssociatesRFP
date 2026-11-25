/** Finances' Invoices tab (build plan Phase 58; D107): today's invoice list, with its view switch. */

import { useAdminOutlet } from '../../outlet'
import { InvoicesScreen } from '../InvoicesScreen'

export function InvoicesTab() {
  const { actor } = useAdminOutlet()
  return <InvoicesScreen actor={actor} />
}
