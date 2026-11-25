/** Finances' AA fees tab (build plan Phase 58; D107): the fee invoices, or the fee settings. */

import { useAdminOutlet } from '../../outlet'
import { AaFeesScreen } from '../AaFeesScreen'

export function AaFeesTab({ view }: { view: 'invoices' | 'settings' }) {
  const { actor } = useAdminOutlet()
  return <AaFeesScreen actor={actor} tab={view} />
}
