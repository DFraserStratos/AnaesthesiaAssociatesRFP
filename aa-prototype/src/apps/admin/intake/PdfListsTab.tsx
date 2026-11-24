/**
 * The rooms' PDF lists (catch-up Phase 34; FT-02.2, US-02.2.1, US-02.2.4):
 * product UI, unbadged. The inbox holds one row per stored list (who sent it,
 * the surgeon, the hospital, when it arrived, the List it suggests, a Re-sent
 * chip and its status); "Upload PDF list" (Intake's page action on this tab)
 * adds one from the sample picker; opening a row reviews it beside its
 * facsimile, with the Intake page `fluid` while it does.
 */

import { useState } from 'react'
import { neutral } from '../../../theme/tokens'
import { sessionLabel } from '../../../domain/intake'
import { uploadPdfList, useAppStore, type Actor } from '../../../store'
import { Button, EmptyState, Pill } from '../../../shared/ui'
import { ClickableRow, RowOpenButton, TableShell, Td, Th } from '../../../shared/table'
import { dateTimeMicroCap, drSurname, locationName, plural } from '../../../shared/format'
import { PdfUploadDialog } from './PdfUploadDialog'
import { PdfListReview } from './PdfListReview'
import { PageBody, PageToolbar } from '../components/AdminPage'
import { useIntakePage } from '../screens/IntakeScreen'

export function PdfListsTab({ actor }: { actor: Actor }) {
  const pdfLists = useAppStore((s) => s.intake.pdfLists)
  const masters = useAppStore((s) => s.masters)
  const [openId, setOpenId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const open = openId !== null ? pdfLists[openId] : undefined
  // Intake's page action while the inbox shows (only a stable setter inside: see `useIntakePage`).
  const uploadAction =
    open === undefined ? (
      <Button variant="primary" size="desktop" onClick={() => setUploading(true)} shot="pdf-upload-open">
        Upload PDF list
      </Button>
    ) : undefined
  const hosted = useIntakePage(uploadAction, open !== undefined)
  if (open !== undefined) return <PdfListReview list={open} actor={actor} onBack={() => setOpenId(null)} />

  const rows = Object.values(pdfLists).sort((a, b) => b.receivedAtISO.localeCompare(a.receivedAtISO) || b.id.localeCompare(a.id))
  return (
    <>
      <PageToolbar
        end={
          <>
            <span className="mono">{plural(rows.length, 'list')}</span>
            {!hosted && uploadAction}
          </>
        }
      >
        <span style={{ fontSize: 13, color: neutral.slate }}>
          The rooms email each List as a PDF, and again whenever it changes. Check its rows, then send them to Matching.
        </span>
      </PageToolbar>

      <PageBody>
      {rows.length === 0 ? (
        <EmptyState variant="card" title="No PDF lists yet">Upload the PDF list the rooms emailed to check it and send it to Matching.</EmptyState>
      ) : (
        // At the admin compact density the inbox fits 1008 at 1280 (Sent from breaks after the @).
        <TableShell fit label="PDF lists" shot="pdf-inbox" density="compact" minWidth={880}>
          <thead>
            <tr>
              <Th>Sent from</Th>
              <Th>Surgeon</Th>
              <Th>Hospital</Th>
              <Th nowrap>Received</Th>
              <Th nowrap>Suggested List</Th>
              <Th>Rows</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <ClickableRow key={l.id} onOpen={() => setOpenId(l.id)} data-pdf-list-id={l.id} data-status={l.status}>
                <Td nowrap={false}>
                  {/* Breaks after the @ when the table is tight, so the row's Open stays in view. */}
                  <span className="mono" style={{ fontSize: 12.5 }}>
                    {l.senderEmail.split('@')[0]}
                    {l.senderEmail.includes('@') && (
                      <>
                        @<wbr />
                        {l.senderEmail.slice(l.senderEmail.indexOf('@') + 1)}
                      </>
                    )}
                  </span>
                </Td>
                <Td>{masters.surgeons[l.surgeonId]?.name ?? l.surgeonId}</Td>
                <Td>{locationName(l.hospitalId, masters.hospitals)}</Td>
                <Td nowrap>{dateTimeMicroCap(l.receivedAtISO)}</Td>
                <Td nowrap>
                  {masters.anaesthetists[l.target.anaesthetistId] !== undefined ? `${drSurname(masters.anaesthetists[l.target.anaesthetistId]!.name)}, ` : ''}
                  {sessionLabel(l.target.dateISO, l.target.session)}
                </Td>
                <Td>{plural(l.rows.length, 'row')}</Td>
                <Td>
                  <span style={{ display: 'inline-flex', gap: 6 }}>
                    {l.replacesId !== undefined && <Pill tone="neutral">Re-sent</Pill>}
                    <Pill tone={l.status === 'sent' ? 'success' : 'neutral'}>{l.status === 'sent' ? 'Sent to matching' : 'Received'}</Pill>
                  </span>
                </Td>
                <Td align="right">
                  <RowOpenButton onOpen={() => setOpenId(l.id)} label={`Open ${l.subject}`}>Open</RowOpenButton>
                </Td>
              </ClickableRow>
            ))}
          </tbody>
        </TableShell>
      )}
      </PageBody>

      <PdfUploadDialog
        open={uploading}
        onClose={() => setUploading(false)}
        onUpload={(sampleId, sender) => {
          const out = uploadPdfList(useAppStore, actor, sampleId, sender)
          if (!out.ok) return out.message
          setUploading(false)
          setOpenId(out.value.pdfListId)
          return null
        }}
      />
    </>
  )
}
