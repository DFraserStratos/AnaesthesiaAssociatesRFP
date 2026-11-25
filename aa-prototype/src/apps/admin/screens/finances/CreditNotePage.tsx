/**
 * A credit note's page, under Finances' Invoices tab (catch-up Phase 39; build plan Phase 58,
 * D108). An unknown credit note falls back to the tab, as an unknown invoice does.
 */

import { useParams } from 'react-router-dom'
import { RequireEntity } from '../../../../shell/RequireEntity'
import { useAppStore } from '../../../../store'
import { AdminPage } from '../../components/AdminPage'
import { CreditNoteDocument } from '../InvoiceDocument'
import { financePath } from './financePaths'

export function CreditNotePage() {
  const { creditNoteId = '' } = useParams()
  const creditNote = useAppStore((s) => s.billing.creditNotes[creditNoteId])
  return (
    <RequireEntity exists={creditNote !== undefined}>
      {creditNote !== undefined && (
        <AdminPage mode="document" testId="credit-note-detail-screen" back={{ label: 'Invoices', to: financePath('invoices') }}>
          <CreditNoteDocument key={creditNote.id} creditNoteId={creditNote.id} />
        </AdminPage>
      )}
    </RequireEntity>
  )
}
