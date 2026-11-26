/**
 * The opened arrival's document, for the benches that read rows (27 Nov 2026 rebuild; O1): a rooms' PDF as its page
 * (read only), else the rows as the hospital sent them on a white card under "As received from <hospital>".
 *
 * Hooks: `intake-pdf-page` (the page), `intake-as-received` (the hospital's rows, the table `intake-as-received-rows`).
 */

import { pdfPageCount } from '../../../../../domain/intake/pdfRead'
import type { ArrivalItem } from '../../../../../domain/intake/arrivals'
import { DecisionHeading } from '../../../../../shared/surface'
import { useAppStore } from '../../../../../store'
import { space } from '../../../../../theme/tokens'
import { ArrivalRowsTable } from './ArrivalRowsTable'
import { PdfPage } from './newList/PdfPage'

export function AsReceived({ arrival }: { arrival: ArrivalItem }) {
  const hospital = useAppStore((s) => s.masters.hospitals[arrival.hospitalId]?.name)
  const from = arrival.source.kind === 'hospital' ? arrival.source.label : (hospital ?? arrival.source.label)
  return (
    <section data-shot="intake-as-received" style={{ display: 'flex', flexDirection: 'column', gap: space[3], width: '100%', minWidth: 0 }}>
      <DecisionHeading>As received from {from}</DecisionHeading>
      <ArrivalRowsTable arrivalKey={arrival.key} shot="intake-as-received-rows" />
    </section>
  )
}

/** The rooms' PDF the arrival was read from, when it was one; else the rows as received. */
export function ArrivalDocument({ arrival }: { arrival: ArrivalItem }) {
  const batch = useAppStore((s) => s.intake.batches[arrival.batchId])
  const pdf = useAppStore((s) => (batch?.pdfListId !== undefined ? s.intake.pdfLists[batch.pdfListId] : undefined))
  if (pdf !== undefined) return <PdfPage facsimile={pdf.file.facsimile} fileName={pdf.file.name} {...(pdf.file.pages !== undefined ? { pages: pdf.file.pages } : { pageCount: pdfPageCount(pdf.rows.length) })} />
  return <AsReceived arrival={arrival} />
}
