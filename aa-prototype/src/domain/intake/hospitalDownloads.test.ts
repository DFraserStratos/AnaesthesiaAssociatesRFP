import { describe, expect, it } from 'vitest'
import { validateNhi } from '../nhi'
import { CANNED_MESSAGES } from '../integrations/messages'
import {
  FORTE_CORRECTED_NHI,
  FORTE_MISTYPED_NHI,
  FOSTER_HOSPITAL_WORDING,
  HOSPITAL_DOWNLOAD_SAMPLES,
  SAMPLE_FORTE_SHEET,
  SAMPLE_STG,
  SAMPLE_STG_UPDATE,
  SAMPLE_SX,
  SARAH_UPDATE_WORDING,
  SX_NO_NHI_TYPED,
  hospitalSourceKey,
} from './hospitalDownloads'

/** AR-35's "Illustrative source wording" rows the samples use, as received (and row 14's meaning, spelt by a hospital). */
const AR35 = new Set(['lap appy ?conv to open', 'Wrist ORIF, distal radius', 'ACL recon R', 'T&A', 'lap chole', 'phaco + IOL R', 'carpal tunnel decomp L', 'TURBT', FOSTER_HOSPITAL_WORDING, SARAH_UPDATE_WORDING])

const rawOf = (id: string) => CANNED_MESSAGES.find((m) => m.id === id)?.raw ?? ''

describe('the sample hospital files (OQ-13 interim)', () => {
  it('four samples with unique ids; rows unique within each sample', () => {
    expect(HOSPITAL_DOWNLOAD_SAMPLES.map((s) => s.id)).toEqual(['SAMPLE_STG', 'SAMPLE_STG_UPDATE', 'SAMPLE_SX', 'SAMPLE_FORTE_SHEET'])
    for (const sample of HOSPITAL_DOWNLOAD_SAMPLES) {
      const keys = sample.rows.map((r) => JSON.stringify(r))
      expect(new Set(keys).size).toBe(keys.length)
      for (const r of sample.rows) expect(r.hospitalId).toBe(sample.hospitalId)
    }
  })
  it('every NHI validates except Forte R2 (mistyped) and Southern Cross R4 (none)', () => {
    for (const sample of HOSPITAL_DOWNLOAD_SAMPLES) {
      sample.rows.forEach((r, i) => {
        const exempt = (sample === SAMPLE_FORTE_SHEET && i === 1) || (sample === SAMPLE_SX && i === 3)
        if (!exempt) expect(validateNhi(r.patient.nhi ?? '').valid, `${sample.id} R${i + 1}`).toBe(true)
      })
    }
    expect(SAMPLE_SX.rows[3]!.patient.nhi).toBeUndefined()
    expect(SAMPLE_FORTE_SHEET.rows[1]!.patient.nhi).toBe(FORTE_MISTYPED_NHI)
    expect(validateNhi(FORTE_MISTYPED_NHI).valid).toBe(false)
    expect(validateNhi(FORTE_CORRECTED_NHI).valid).toBe(true)
    expect(validateNhi(SX_NO_NHI_TYPED).valid).toBe(true)
  })
  it("every wording is AR-35's, verbatim; Foster's and Sarah's agree with the canned messages", () => {
    for (const sample of HOSPITAL_DOWNLOAD_SAMPLES) for (const r of sample.rows) if (r.procedure?.text !== undefined) expect(AR35.has(r.procedure.text)).toBe(true)
    expect(rawOf('MSG-STG-1001')).toContain(`^${SAMPLE_STG.rows[0]!.procedure!.text!}`)
    expect(rawOf('MSG-STG-1012')).toContain(`^${SAMPLE_STG.rows[2]!.procedure!.text!}`)
  })
  it("the update shares R1's List and patient, differing only in time, note and wording", () => {
    const [r1] = SAMPLE_STG.rows
    const [u] = SAMPLE_STG_UPDATE.rows
    const strip = (r: typeof r1) => ({ ...r!, scheduledTime: undefined, note: undefined, procedure: undefined })
    expect(strip(u)).toEqual(strip(r1))
    expect([u!.scheduledTime, u!.procedure?.text]).toEqual(['09:00', SARAH_UPDATE_WORDING])
  })
  it("a hospital's source key is its feed, else MANUAL", () => {
    expect([hospitalSourceKey('H-STG'), hospitalSourceKey('H-SX'), hospitalSourceKey('H-FORTE')]).toEqual(['FEED-STG', 'FEED-SX', 'MANUAL-H-FORTE'])
  })
})
