/**
 * Canned OCR "extractions" for the photo-capture demo. Each mirrors the text
 * drawn on its bundled sample paper card. Sample A is keyed to an already-seeded
 * patient (Wiremu Tane) so saving demonstrates NHI dedupe/reuse; Sample B is
 * keyed to a canned `lookupNhi` hit (Losa Tuilagi) so the review form's
 * "Look up NHI" confirms against the simulated Hub.
 */

import { PAPER_CARD_A, PAPER_CARD_B } from '../../../assets/samplePaperCards'
import type { ExtractionFields } from './ManualCardForm'

export interface SampleExtraction {
  id: string
  label: string
  imageUrl: string
  fields: ExtractionFields
}

export const SAMPLE_EXTRACTIONS: readonly SampleExtraction[] = [
  {
    id: 'A',
    label: 'Wiremu Tane · lap. chole',
    imageUrl: PAPER_CARD_A,
    fields: {
      nhi: 'ZBC1123',
      name: 'Wiremu Tane',
      dobISO: '1979-08-22',
      ethnicityCode: '21111',
      operation: 'Laparoscopic cholecystectomy',
      rvgBaseCode: '20941',
      billingRoute: 'hospital',
    },
  },
  {
    id: 'B',
    label: 'Losa Tuilagi · knee arthroscopy',
    imageUrl: PAPER_CARD_B,
    fields: {
      nhi: 'JKL1188',
      name: 'Losa Tuilagi',
      dobISO: '1992-01-27',
      ethnicityCode: '31111',
      operation: 'Right knee arthroscopy',
      rvgBaseCode: '49558',
      billingRoute: 'insurer',
      insurerId: 'I-NIB',
    },
  },
] as const
