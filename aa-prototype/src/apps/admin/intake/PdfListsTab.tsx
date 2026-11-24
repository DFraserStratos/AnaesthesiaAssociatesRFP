/**
 * The rooms' PDF lists (catch-up Phase 34; FT-02.2, US-02.2.1, US-02.2.4):
 * product UI, unbadged. The inbox holds one row per stored list (who sent it,
 * the surgeon, the hospital, when it arrived, the List it suggests, a Re-sent
 * chip and its status); "Upload PDF list" adds one from the sample picker;
 * opening a row reviews it beside its facsimile.
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

export function PdfListsTab({ actor }: { actor: Actor }) {
  const pdfLists = useAppStore((s) => s.intake.pdfLists)
  const masters = useAppStore((s) => s.masters)
  const [openId, setOpenId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const open = openId !== null ? pdfLists[openId] : undefined
  if (open !== undefined) return <PdfListReview list={open} actor={actor} onBack={() => setOpenId(null)} />

  const rows = Object.values(pdfLists).sort((a, b) => b.receivedAtISO.localeCompare(a.receivedAtISO) || b.id.localeCompare(a.id))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320, fontSize: 13, color: neutral.slate, maxWidth: 760 }}>
          A surgeon&rsquo;s practice emails its Lists as PDFs, and sends the whole List again whenever it changes. Upload each one
          with the address it came from, check and correct its rows, then send them to Matching, where each waits for
          your decision.
        </div>
        <Button variant="primary" size="compact" onClick={() => setUploading(true)} shot="pdf-upload-open" style={{ marginLeft: 'auto' }}>
          Upload PDF list
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState variant="card" title="No PDF lists yet">Upload the PDF list the rooms emailed to check it and send it to Matching.</EmptyState>
      ) : (
        <TableShell label="PDF lists" shot="pdf-inbox" minWidth={880}>
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
    </div>
  )
}
