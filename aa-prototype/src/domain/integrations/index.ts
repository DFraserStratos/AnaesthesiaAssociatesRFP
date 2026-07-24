/**
 * Integration domain layer (Phase 11) — pure HL7/FHIR translation, the canned
 * message + PDF libraries, and the seeded feed configs. No React, no store
 * (domain purity convention 3). Behaviour (applying a parsed message to the
 * schedule) lives in the store's `integrationActions.ts`.
 */

export {
  parseHl7,
  readField,
  resolvePath,
  extractViaMapping,
  HL7_MAPPING_KEYS,
  type ParsedMessage,
  type ParsedHl7,
  type Hl7Segment,
} from './hl7'
export {
  toFhirBundle,
  extractFromFhir,
  practitionerHpiOf,
  NHI_SYSTEM,
  HPI_SYSTEM,
  ETHNICITY_EXT_URL,
  type FhirBundle,
  type FhirResource,
  type FhirPractitionerInput,
} from './fhir'
export {
  FEED,
  FEED_META,
  INTEGRATION_FEEDS,
  CPH_NHI_FIX,
  type FeedMeta,
} from './feeds'
export {
  APPT,
  CANNED_MESSAGES,
  CANNED_BY_ID,
  cannedMessage,
  type CannedMessage,
} from './messages'
export {
  SURGEON_PDFS,
  PDF_BY_ID,
  type SurgeonPdf,
  type PdfRow,
} from './pdfSamples'
