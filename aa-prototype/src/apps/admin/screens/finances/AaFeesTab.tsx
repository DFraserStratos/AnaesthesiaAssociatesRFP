/**
 * Finances' AA fees tab (D107, D110): the fee invoices, the month's run and the fee settings on one
 * page. Its settings address (`view="settings"`) opens the settings card for a change, in view.
 */

import { useAdminOutlet } from '../../outlet'
import { AaFeesScreen } from '../AaFeesScreen'

export function AaFeesTab({ view }: { view: 'invoices' | 'settings' }) {
  const { actor } = useAdminOutlet()
  return <AaFeesScreen actor={actor} settingsOpen={view === 'settings'} />
}
