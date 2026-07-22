/**
 * RVG code master (~30 codes across anatomical sites). Base units for the
 * mockup-pinned codes come from the design (47516 hip THR base 7, 20941 lap
 * chole 6, 49558 knee arthroscopy 4, 49115 inguinal hernia 5, ...); everything
 * else is demo-plausible.
 *
 * demo values within RFP-stated ranges — not sourced from an NZSA schedule
 * (Decisions log 2026-07-22; discovery item for AA/NZSA to supply real tables).
 */

import type { RvgCode } from '../types'

export const RVG_CODES: readonly RvgCode[] = [
  // --- Abdomen / general surgery ---
  { code: '20941', description: 'Laparoscopic cholecystectomy', anatomicalSite: 'Abdomen', baseUnits: { kind: 'single', units: 6 }, absorbsModifierCodes: [] },
  { code: '20880', description: 'Gastric bypass, laparoscopic', anatomicalSite: 'Abdomen', baseUnits: { kind: 'range', min: 9, max: 11 }, absorbsModifierCodes: [] },
  { code: '20882', description: 'Sleeve gastrectomy', anatomicalSite: 'Abdomen', baseUnits: { kind: 'single', units: 9 }, absorbsModifierCodes: [] },
  { code: '20905', description: 'Laparotomy, exploratory', anatomicalSite: 'Abdomen', baseUnits: { kind: 'single', units: 7 }, absorbsModifierCodes: [] },
  { code: '20950', description: 'Appendicectomy, laparoscopic', anatomicalSite: 'Abdomen', baseUnits: { kind: 'single', units: 5 }, absorbsModifierCodes: [] },
  { code: '49115', description: 'Inguinal hernia repair', anatomicalSite: 'Abdomen', baseUnits: { kind: 'single', units: 5 }, absorbsModifierCodes: [] },
  { code: '49120', description: 'Umbilical hernia repair', anatomicalSite: 'Abdomen', baseUnits: { kind: 'single', units: 4 }, absorbsModifierCodes: [] },
  // --- Hip & femur (positioning included in the lateral approaches) ---
  { code: '47516', description: 'Hip, total replacement, primary', anatomicalSite: 'Hip', baseUnits: { kind: 'single', units: 7 }, absorbsModifierCodes: ['P1'] },
  { code: '47519', description: 'Hip, hemiarthroplasty', anatomicalSite: 'Hip', baseUnits: { kind: 'single', units: 6 }, absorbsModifierCodes: ['P1'] },
  { code: '47522', description: 'Hip, revision replacement', anatomicalSite: 'Hip', baseUnits: { kind: 'range', min: 8, max: 10 }, absorbsModifierCodes: ['P1'] },
  { code: '50120', description: 'Femur, ORIF proximal', anatomicalSite: 'Femur', baseUnits: { kind: 'single', units: 6 }, absorbsModifierCodes: [] },
  // --- Knee ---
  { code: '49518', description: 'Knee, total replacement', anatomicalSite: 'Knee', baseUnits: { kind: 'single', units: 7 }, absorbsModifierCodes: [] },
  { code: '49558', description: 'Knee arthroscopy', anatomicalSite: 'Knee', baseUnits: { kind: 'single', units: 4 }, absorbsModifierCodes: [] },
  { code: '49561', description: 'Knee, ACL reconstruction', anatomicalSite: 'Knee', baseUnits: { kind: 'single', units: 5 }, absorbsModifierCodes: [] },
  // --- Shoulder & arm ---
  { code: '48900', description: 'Shoulder, total replacement', anatomicalSite: 'Shoulder', baseUnits: { kind: 'single', units: 7 }, absorbsModifierCodes: ['P1'] },
  { code: '48939', description: 'Shoulder arthroscopy', anatomicalSite: 'Shoulder', baseUnits: { kind: 'single', units: 5 }, absorbsModifierCodes: ['P1'] },
  { code: '46360', description: 'Wrist, ORIF distal radius', anatomicalSite: 'Arm', baseUnits: { kind: 'single', units: 4 }, absorbsModifierCodes: [] },
  // --- Spine (prone positioning included) ---
  { code: '51011', description: 'Lumbar laminectomy', anatomicalSite: 'Spine', baseUnits: { kind: 'range', min: 6, max: 8 }, absorbsModifierCodes: ['P1'] },
  { code: '51020', description: 'Lumbar fusion, posterior', anatomicalSite: 'Spine', baseUnits: { kind: 'single', units: 9 }, absorbsModifierCodes: ['P1'] },
  // --- Head, neck & ENT ---
  { code: '41764', description: 'Tonsillectomy', anatomicalSite: 'Head and neck', baseUnits: { kind: 'single', units: 4 }, absorbsModifierCodes: [] },
  { code: '41789', description: 'Septoplasty', anatomicalSite: 'Head and neck', baseUnits: { kind: 'single', units: 4 }, absorbsModifierCodes: [] },
  { code: '41800', description: 'Rhinoplasty', anatomicalSite: 'Head and neck', baseUnits: { kind: 'single', units: 5 }, absorbsModifierCodes: [] },
  { code: '45623', description: 'Thyroidectomy', anatomicalSite: 'Head and neck', baseUnits: { kind: 'single', units: 6 }, absorbsModifierCodes: [] },
  { code: '41575', description: 'Tympanoplasty, middle ear', anatomicalSite: 'Head and neck', baseUnits: { kind: 'single', units: 5 }, absorbsModifierCodes: [] },
  // --- Eye ---
  { code: '42702', description: 'Cataract extraction with IOL', anatomicalSite: 'Eye', baseUnits: { kind: 'single', units: 3 }, absorbsModifierCodes: [] },
  { code: '42725', description: 'Vitrectomy', anatomicalSite: 'Eye', baseUnits: { kind: 'single', units: 4 }, absorbsModifierCodes: [] },
  { code: '42794', description: 'Strabismus correction', anatomicalSite: 'Eye', baseUnits: { kind: 'single', units: 4 }, absorbsModifierCodes: [] },
  // --- Urology ---
  { code: '36840', description: 'TURP', anatomicalSite: 'Urinary tract', baseUnits: { kind: 'single', units: 5 }, absorbsModifierCodes: [] },
  { code: '36561', description: 'Cystoscopy', anatomicalSite: 'Urinary tract', baseUnits: { kind: 'single', units: 3 }, absorbsModifierCodes: [] },
  { code: '37623', description: 'Ureteroscopy with lithotripsy', anatomicalSite: 'Urinary tract', baseUnits: { kind: 'single', units: 4 }, absorbsModifierCodes: [] },
  // --- Plastics & skin ---
  { code: '45030', description: 'Skin flap repair, complex', anatomicalSite: 'Skin', baseUnits: { kind: 'range', min: 4, max: 6 }, absorbsModifierCodes: [] },
  { code: '45200', description: 'Breast reduction', anatomicalSite: 'Chest wall', baseUnits: { kind: 'single', units: 6 }, absorbsModifierCodes: [] },
  { code: '31340', description: 'Abdominoplasty', anatomicalSite: 'Abdomen', baseUnits: { kind: 'single', units: 6 }, absorbsModifierCodes: [] },
  // --- Vascular ---
  { code: '34800', description: 'Varicose veins, bilateral', anatomicalSite: 'Leg', baseUnits: { kind: 'single', units: 4 }, absorbsModifierCodes: [] },
] as const

/** Eye-site codes, used to keep Christchurch Eye Surgery lists ophthalmic. */
export const EYE_CODES: readonly string[] = ['42702', '42725', '42794'] as const

/** General filler codes for generated cards (excludes bariatric and eye codes). */
export const GENERAL_CODES: readonly string[] = [
  '20941', '20905', '20950', '49115', '49120', '47516', '47519', '50120',
  '49518', '49558', '49561', '48939', '46360', '41764', '41789', '45623',
  '36840', '36561', '37623', '45030', '45200', '34800',
] as const
