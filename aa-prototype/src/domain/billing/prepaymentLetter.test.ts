import { describe, expect, it } from 'vitest'
import { LETTER_MERGE_FIELDS, LETTER_MESSAGES, LETTER_NOT_SET, LETTER_PREVIEW_SAMPLE, defaultTemplateOf, letterMergeDataOf, mergeFieldsIn, renderPrepaymentLetter, validateLetterTemplate } from './prepaymentLetter'
import { SEED_LETTER_TEMPLATES } from '../seed/prepaymentLetters'
import type { PrepaymentLetterTemplate } from '../types'

const request = (body: string, name = 'Letter') => ({ kind: 'request' as const, name, body })

describe('validateLetterTemplate (US-06.3.6)', () => {
  it('every seeded template validates and has no en or em dash', () => {
    for (const t of SEED_LETTER_TEMPLATES) {
      expect(validateLetterTemplate(t)).toBeNull()
      expect(t.body).not.toMatch(/[–—]/)
    }
  })

  it('refuses an empty or long name or body, and unknown fields by name', () => {
    expect(validateLetterTemplate(request('{{prepaidAmount}}', ' '))?.code).toBe('emptyName')
    expect(validateLetterTemplate(request('{{prepaidAmount}}', 'x'.repeat(61)))?.code).toBe('nameTooLong')
    expect(validateLetterTemplate(request('  '))?.code).toBe('emptyBody')
    expect(validateLetterTemplate(request(`{{prepaidAmount}} ${'x'.repeat(2000)}`))?.code).toBe('bodyTooLong')
    expect(validateLetterTemplate(request('{{prepaidAmount}} {{estimate}}'))).toMatchObject({ code: 'unknownMergeField', message: LETTER_MESSAGES.unknownMergeField('estimate') })
  })

  it('each kind states its own field', () => {
    expect(validateLetterTemplate(request('Dear {{patientName}}'))?.code).toBe('missingPrepaidAmount')
    expect(validateLetterTemplate({ kind: 'reminder', name: 'R', body: 'Pay {{invoiceNumber}}' })?.code).toBe('missingAmountOutstanding')
    expect(validateLetterTemplate({ kind: 'anaesthetistChanged', name: 'A', body: 'Dear {{patientName}}' })?.code).toBe('missingAnaesthetist')
  })

  it('the prepaid amount is the price, never an estimate or a deposit (any case)', () => {
    for (const words of ['an Estimate of', 'the estimated fee', 'a DEPOSIT of', 'which may be higher or lower']) {
      expect(validateLetterTemplate(request(`This is ${words} {{prepaidAmount}}.`))?.code).toBe('estimateWording')
    }
  })

  it('while prepayment invoices do not name the anaesthetist (OQ-120), a request or reminder cannot either; the changed-anaesthetist email still does', () => {
    expect(validateLetterTemplate(request('{{prepaidAmount}} with {{anaesthetist}}'), false)?.code).toBe('anaesthetistNotNamed')
    expect(validateLetterTemplate({ kind: 'anaesthetistChanged', name: 'A', body: 'Now {{anaesthetist}}' }, false)).toBeNull()
  })
})

describe('renderPrepaymentLetter', () => {
  it('fills every field and renders a missing one "[not set]"', () => {
    const body = LETTER_MERGE_FIELDS.map((f) => `{{${f.field}}}`).join('|')
    expect(renderPrepaymentLetter({ body }, LETTER_PREVIEW_SAMPLE)).toBe(LETTER_MERGE_FIELDS.map((f) => LETTER_PREVIEW_SAMPLE[f.field]).join('|'))
    expect(renderPrepaymentLetter({ body: 'Dear {{patientName}}, {{ invoiceNumber }}' }, {})).toBe(`Dear ${LETTER_NOT_SET}, ${LETTER_NOT_SET}`)
  })

  it('is deterministic and lists the fields a body uses once each', () => {
    const body = SEED_LETTER_TEMPLATES[0]!.body
    expect(renderPrepaymentLetter({ body }, LETTER_PREVIEW_SAMPLE)).toBe(renderPrepaymentLetter({ body }, LETTER_PREVIEW_SAMPLE))
    expect(mergeFieldsIn('{{a}} {{b}} {{a}}')).toEqual(['a', 'b'])
  })
})

describe('letterMergeDataOf and defaultTemplateOf', () => {
  it('joins names with "and", spells the date in full and formats money', () => {
    expect(letterMergeDataOf({ procedureNames: ['Rhinoplasty', 'Septoplasty', 'Turbinates'], procedureDateISO: '2026-07-24', prepaidAmount: 1380, amountOutstanding: 690 })).toEqual({
      procedure: 'Rhinoplasty, Septoplasty and Turbinates',
      procedureDate: 'Friday 24 July 2026',
      prepaidAmount: '$1,380.00',
      amountOutstanding: '$690.00',
    })
  })

  it('the default active template of a kind, else the first active one', () => {
    const rec = Object.fromEntries(SEED_LETTER_TEMPLATES.map((t) => [t.id, t])) as Record<string, PrepaymentLetterTemplate>
    expect(defaultTemplateOf(rec, 'request')?.id).toBe('LT001')
    expect(defaultTemplateOf({ ...rec, LT001: { ...rec['LT001']!, isDefault: false } }, 'request')?.id).toBe('LT001')
    expect(defaultTemplateOf({ ...rec, LT001: { ...rec['LT001']!, active: false } }, 'request')).toBeUndefined()
  })
})
