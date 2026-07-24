/**
 * Phase 11 domain tests — the mapping-driven extractor, the mapping DIFFERENCE
 * that makes the failure-fix flow load-bearing, the FHIR translation touches
 * (NHI identifier, HPI, ethnicity validation), and the canned library's
 * integrity (every create NHI validates, correlation ids present).
 */

import { describe, expect, it } from 'vitest'
import { extractViaMapping } from './hl7'
import { toFhirBundle, extractFromFhir, practitionerHpiOf, NHI_SYSTEM } from './fhir'
import { INTEGRATION_FEEDS, FEED, CPH_NHI_FIX } from './feeds'
import { CANNED_MESSAGES, cannedMessage, APPT } from './messages'
import { SURGEON_PDFS } from './pdfSamples'
import { validateNhi } from '../nhi'

const feed = (id: string) => {
  const f = INTEGRATION_FEEDS.find((x) => x.id === id)
  if (f === undefined) throw new Error(`missing feed ${id}`)
  return f
}

describe('HL7 mapping-driven extractor', () => {
  it("extracts St George's NHI correctly from PID-2 (mapping is right)", () => {
    const msg = cannedMessage('MSG-STG-1001')!
    const parsed = extractViaMapping(msg.raw!, feed(FEED.stg).fieldMapping)
    expect(parsed.eventType).toBe('S12')
    expect(parsed.messageControlId).toBe('MSG-STG-1001')
    expect(parsed.patient.nhi).toBe('CQY9304')
    expect(validateNhi(parsed.patient.nhi!).valid).toBe(true)
    expect(parsed.patient.name).toBe('Sarah Mitchell')
    expect(parsed.patient.dobISO).toBe('1988-04-12')
    expect(parsed.appointmentId).toBe(APPT.s12)
    expect(parsed.operation).toBe('Appendicectomy, laparoscopic')
    expect(parsed.scheduledDateISO).toBe('2026-07-28')
    expect(parsed.scheduledTime).toBe('08:30')
  })

  it('pulls a non-NHI value under Christchurch Public\'s misconfigured mapping, then the real NHI once fixed', () => {
    const msg = cannedMessage('MSG-CPH-2001')!
    // As onboarded: nhi <- PID-2, which holds the local MRN → not a valid NHI.
    const wrong = extractViaMapping(msg.raw!, feed(FEED.cph).fieldMapping)
    expect(wrong.patient.nhi).toBe('CPH-44718')
    expect(validateNhi(wrong.patient.nhi!).valid).toBe(false)
    // After the operator corrects the mapping to PID-3, the real NHI appears.
    const fixed = extractViaMapping(msg.raw!, { ...feed(FEED.cph).fieldMapping, nhi: CPH_NHI_FIX })
    expect(fixed.patient.nhi).toBe('ZBC1123')
    expect(validateNhi(fixed.patient.nhi!).valid).toBe(true)
  })

  it('is genuinely mapping-driven: the same raw yields different NHIs under different mappings', () => {
    const msg = cannedMessage('MSG-CPH-2001')!
    const fromPid2 = extractViaMapping(msg.raw!, { nhi: 'PID-2' })
    const fromPid3 = extractViaMapping(msg.raw!, { nhi: 'PID-3' })
    expect(fromPid2.patient.nhi).not.toBe(fromPid3.patient.nhi)
    expect(fromPid3.patient.nhi).toBe('ZBC1123')
  })

  it('reads the S14 note and S15 cancellation reason from their fixed positions', () => {
    const s14 = extractViaMapping(cannedMessage('MSG-STG-1012')!.raw!, feed(FEED.stg).fieldMapping)
    expect(s14.note).toBe('Bumped 15 min at surgeon request')
    const s15 = extractViaMapping(cannedMessage('MSG-STG-1013')!.raw!, feed(FEED.stg).fieldMapping)
    expect(s15.cancelReason).toContain('Cancelled by St George')
  })
})

describe('FHIR translation', () => {
  it('toFhirBundle carries the NHI identifier system, the HPI, and a validated ethnicity display', () => {
    const parsed = extractViaMapping(cannedMessage('MSG-STG-1001')!.raw!, feed(FEED.stg).fieldMapping)
    const bundle = toFhirBundle(parsed, { name: 'Dr Melanie Souter', hpiId: '10SOUM' })
    const patient = bundle.entry.find((e) => e.resource.resourceType === 'Patient')!.resource as {
      identifier?: { system?: string; value?: string }[]
      extension?: { valueCoding?: { code?: string; display?: string }; valueString?: string }[]
    }
    expect(patient.identifier?.[0]?.system).toBe(NHI_SYSTEM)
    expect(patient.identifier?.[0]?.value).toBe('CQY9304')
    expect(patient.extension?.[0]?.valueCoding?.display).toBe('New Zealand European')
    expect(patient.extension?.[0]?.valueString).toBeUndefined()
    expect(practitionerHpiOf(bundle)).toBe('10SOUM')
  })

  it('holds an out-of-range ethnicity code "pending correction" in the FHIR extension', () => {
    const parsed = extractViaMapping(cannedMessage('MSG-STG-1003')!.raw!, feed(FEED.stg).fieldMapping)
    expect(parsed.patient.ethnicityCode).toBe('77777')
    const bundle = toFhirBundle(parsed)
    const patient = bundle.entry.find((e) => e.resource.resourceType === 'Patient')!.resource as {
      extension?: { valueCoding?: { code?: string }; valueString?: string }[]
    }
    // The raw code is still carried (so the store can quarantine it), but it is
    // flagged, never presented as a settled code.
    expect(patient.extension?.[0]?.valueCoding?.code).toBe('77777')
    expect(patient.extension?.[0]?.valueString).toBe('pending correction')
  })

  it('the FHIR-native message round-trips through extractFromFhir', () => {
    const msg = cannedMessage('FHIR-SX-2001')!
    expect(msg.fhirBundle).toBeDefined()
    const parsed = extractFromFhir(msg.fhirBundle!, feed(FEED.sx).fieldMapping)
    expect(parsed.eventType).toBe('S12')
    expect(parsed.patient.nhi).toBe('MYY54SL')
    expect(validateNhi(parsed.patient.nhi!).valid).toBe(true)
    expect(parsed.patient.ethnicityCode).toBe('43111')
    expect(parsed.appointmentId).toBe(APPT.fhirCreate)
    expect(parsed.scheduledTime).toBe('14:30')
    expect(practitionerHpiOf(msg.fhirBundle!)).toBe('10SOUM')
  })

  it('the FHIR bundle has no HL7 raw (skips the translation pane)', () => {
    const msg = cannedMessage('FHIR-SX-2001')!
    expect(msg.raw).toBeUndefined()
    expect(msg.transport).toBe('fhir')
  })
})

describe('canned library integrity', () => {
  it('has unique message control ids', () => {
    const ids = CANNED_MESSAGES.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every create (S12) message carries a valid NHI once extracted with its own feed mapping', () => {
    for (const msg of CANNED_MESSAGES) {
      if (msg.eventType !== 'S12') continue
      if (msg.id === 'MSG-CPH-2001') continue // deliberately malformed under its onboarded mapping
      const f = feed(msg.feedId)
      const parsed = msg.transport === 'fhir'
        ? extractFromFhir(msg.fhirBundle!, f.fieldMapping)
        : extractViaMapping(msg.raw!, f.fieldMapping)
      expect(parsed.patient.nhi, `${msg.id} NHI`).toBeDefined()
      expect(validateNhi(parsed.patient.nhi!).valid, `${msg.id} NHI valid`).toBe(true)
      expect(parsed.appointmentId, `${msg.id} appt id`).toBeDefined()
    }
  })

  it('every S12 create routes to a target List and every modify carries a correlation id', () => {
    for (const msg of CANNED_MESSAGES) {
      if (msg.eventType === 'S12') expect(msg.routing, `${msg.id} routing`).toBeDefined()
      else expect(msg.correlationAppointmentId, `${msg.id} correlation`).toBeTruthy()
    }
  })
})

describe('surgeon PDFs', () => {
  it('each PDF carries a facsimile data URL, a target list, and rows', () => {
    for (const pdf of SURGEON_PDFS) {
      expect(pdf.facsimile.startsWith('data:image/svg+xml,')).toBe(true)
      expect(pdf.rows.length).toBeGreaterThan(0)
      expect(pdf.targetList.anaesthetistId).toBeTruthy()
    }
  })

  it('has exactly one deliberately-wrong row whose printed NHI fails validation and whose correction validates', () => {
    const wrong = SURGEON_PDFS.flatMap((p) => p.rows).filter((r) => r.deliberateError !== undefined)
    expect(wrong.length).toBe(1)
    const row = wrong[0]!
    expect(validateNhi(row.nhi).valid).toBe(false)
    expect(row.correctedNhi).toBeDefined()
    expect(validateNhi(row.correctedNhi!).valid).toBe(true)
  })
})
