/** Finances' Invoices tab (D107): the one invoice list, its filters (Awaiting approval among them) and its rail. */

import { useAdminOutlet } from '../../outlet'
import { InvoicesScreen } from '../InvoicesScreen'

export function InvoicesTab() {
  const { actor } = useAdminOutlet()
  return <InvoicesScreen actor={actor} />
}
