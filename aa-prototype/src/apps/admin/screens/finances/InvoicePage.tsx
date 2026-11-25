/**
 * An invoice's page, under Finances' Invoices tab (build plan Phase 58; D108): the paper and its
 * rail as a `document` page. Inline rather than in a dialog, because the print stylesheet isolates
 * the `.aa-invoice-doc` node and a fixed-position Dialog ancestor would break its print isolation.
 * An unknown invoice falls back to the tab.
 */

import { useParams } from 'react-router-dom'
import { RequireEntity } from '../../../../shell/RequireEntity'
import { useAppStore } from '../../../../store'
import { AdminPage } from '../../components/AdminPage'
import { useAdminOutlet } from '../../outlet'
import { InvoiceDocument } from '../InvoiceDocument'
import { financePath } from './financePaths'

export function InvoicePage() {
  const { invoiceId = '' } = useParams()
  const { actor } = useAdminOutlet()
  const exists = useAppStore((s) => s.billing.invoices[invoiceId] !== undefined)
  return (
    <RequireEntity exists={exists}>
      <AdminPage mode="document" testId="invoice-detail-screen" back={{ label: 'Invoices', to: financePath('invoices') }}>
        <InvoiceDocument key={invoiceId} invoiceId={invoiceId} actor={actor} />
      </AdminPage>
    </RequireEntity>
  )
}
