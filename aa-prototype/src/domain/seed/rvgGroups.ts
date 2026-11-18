/**
 * The RVG groups seed (catch-up Phase 19; RV-41; US-05.1.1, US-05.1.3).
 *
 * Demo-sized: the full NZSA 2021 set loads through Phase 42.
 *
 * Published rows are the NZSA RVG 2021, Section II (artifact AR-16), as
 * printed: code, a shortened description, the anatomy heading and base units,
 * with the printed range where there is one (the lower bound is the starting
 * figure, D35). They include every group the 8 October wording table maps to
 * (artifact AR-35), every Neurosurgery and Spine row (artifact AR-34's CSV; each
 * includes P1, catch-up Phase 19b), both T2s and both P6s (the same code on separate
 * rows), every ranged row and at least one row under every heading. The
 * "4 + Time" rows (M3, CP1, CP4, CP5) are seeded with their number: time is
 * always charged on top.
 *
 * AA's own rows sit beside them, unmarked (US-05.1.1): one for each code the
 * pre-Phase 19 demo seed used where no published row has its figure or range,
 * so every seeded Procedure keeps today's base units and the pristine seed
 * raises no out-of-range warning. Each carries the nearest published code with
 * AA's own description and figure (the same code may sit on several rows). The
 * figures are demo-plausible, not AA's.
 *
 * `LEGACY_CODE_TO_RVG_GROUP` is the one bridge from the invented five-digit
 * codes the seed generator still draws from (its RNG reads the legacy ranges,
 * so the generated Bookings are identical); it is seed-only. The hip and
 * shoulder rows include no modifier (catch-up Phase 19b, RV-09): P1 is an
 * ordinary claim there.
 *
 * No row draws from the seeded RNG.
 */

import type { BaseUnitsRange, RvgGroup, RvgGroupId } from '../billing/rvgGroups'
import { INCLUDED_MODIFIER_IDS_BY_RVG_CODE } from './modifiers'

/** The published base codes already split by age (RVG p.7 and p.10): no age modifier on them. */
const AGE_SPLIT_CODES = new Set(['H6b', 'P2'])

interface Row {
  /** A seed-only name for the row (never a printed code; never shown). */
  key: string
  code: string
  description: string
  anatomy: string
  baseUnits: number
  range?: BaseUnitsRange
}

const r = (key: string, code: string, anatomy: string, baseUnits: number, description: string, range?: [number, number]): Row => ({
  key,
  code,
  anatomy,
  baseUnits,
  description,
  ...(range !== undefined ? { range: { min: range[0], max: range[1] } } : {}),
})

const HEAD = 'Head'
const NEURO = 'Neurosurgery'
const NECK = 'Neck'
const UL = 'Upper limb'
const THORAX = 'Thorax'
const SPINE = 'Spine'
const ABDO = 'Abdomen'
const PERI = 'Perineum'
const PELVIC = 'Pelvic'
const VASC = 'Vascular'
const LL = 'Lower limb'
const REMOTE = 'Anaesthesia in remote locations'
const PAIN = 'Pain consultations and procedures'

/** The NZSA RVG 2021 rows, in guide order. */
const PUBLISHED: Row[] = [
  r('sp1', 'SP1', 'Supervision', 4, 'Provision of IV sedation and/or monitoring'),

  r('h1', 'H1', HEAD, 4, 'Minor procedures, e.g. excision of superficial lesions, myringotomies'),
  r('h2', 'H2', HEAD, 5, 'Simple but invasive procedures, e.g. adenoidectomy, tonsillectomy, myringoplasty, ear canal, septoplasty'),
  r('h3', 'H3', HEAD, 6, 'Moderate procedures, e.g. endoscopic sinus surgery, septo-rhinoplasty, micro-laryngoscopy, parotidectomy, face-lift'),
  r('h4', 'H4', HEAD, 10, 'Complex procedures, e.g. maxillary or mandibular osteotomy, tumour resection, free flap placement', [10, 12]),
  r('h5', 'H5', HEAD, 5, 'Dental extractions or dental restorations'),
  r('h6a', 'H6a', HEAD, 4, 'Ocular procedure under local anaesthetic, eye block or GA, over 2 years'),
  r('h6b', 'H6b', HEAD, 5, 'Ocular procedure under GA, younger than 2 years'),

  r('h7a', 'H7A', NEURO, 10, 'Cranioplasty or CSF shunt procedures, supine or lateral'),
  r('h7b', 'H7b', NEURO, 12, 'Cranioplasty or CSF shunt procedures, prone, park bench or sitting'),
  r('h8a', 'H8a', NEURO, 12, 'Non-vascular open intracranial or spinal cord, supine or lateral'),
  r('h8b', 'H8b', NEURO, 14, 'Non-vascular open intracranial or spinal cord, prone, park bench or sitting'),
  r('h9a', 'H9a', NEURO, 20, 'Vascular open intracranial or spinal cord procedures, supine or lateral'),
  r('h9b', 'H9b', NEURO, 22, 'Vascular open intracranial or spinal cord procedures, prone, park bench or sitting'),

  r('n1', 'N1', NECK, 4, 'Minor procedures, e.g. excision of superficial lesions'),
  r('n2', 'N2', NECK, 5, 'Simple but invasive procedures, e.g. closure of tracheostomy'),
  r('n3', 'N3', NECK, 6, 'Moderate procedures, e.g. thyroidectomy, simple neck dissection'),
  r('n4', 'N4', NECK, 10, 'Significant complex procedures, e.g. laryngectomy, carotid endarterectomy, tumour resection', [10, 14]),

  r('ul1', 'UL1', UL, 4, 'Minor procedures, e.g. excision of skin lesions, carpal tunnel release'),
  r('ul2', 'UL2', UL, 5, 'Simple but invasive procedures, e.g. simple tendon or nerve transposition, open radius or ulnar surgery'),
  r('ul3', 'UL3', UL, 6, 'Moderate soft tissue, muscle or nerve procedures, e.g. rotator cuff surgery, wrist arthroscopy'),
  r('ul4', 'UL4', UL, 8, 'Major bony or joint procedures, e.g. shoulder replacement arthroplasty'),

  r('t1', 'T1', THORAX, 4, 'Minor procedures, e.g. excision of superficial lesions (shoulder, chest or back)'),
  r('t2Minor', 'T2', THORAX, 4, 'Breast, minor procedures, e.g. removal of simple breast lesion'),
  r('t2Simple', 'T2', THORAX, 5, 'Breast, simple but invasive procedures, e.g. wide local excision breast lump, augmentation, reduction'),
  r('t3', 'T3', THORAX, 6, 'Breast, moderate procedures, e.g. complex mastectomy including axillary node surgery'),
  r('t4', 'T4', THORAX, 8, 'Breast, major procedures, e.g. TRAM flap'),
  r('t5a', 'T5a', THORAX, 6, 'Thoracic, mediastinoscopy'),
  r('t5c', 'T5c', THORAX, 8, 'Thoracic, pleurodesis or simple biopsy', [8, 10]),
  r('t6b', 'T6b', THORAX, 16, 'Cardiac, less complex surgery, e.g. CABG only, single valve replacement'),

  r('s1', 'S1', SPINE, 8, 'Removal of spinal hardware'),
  r('s2', 'S2', SPINE, 8, 'Cervical, anterior procedures, e.g. anterior disc fusion, disc replacement'),
  r('s3a', 'S3a', SPINE, 10, 'Cervical, posterior procedures, 1 to 2 levels, e.g. foraminotomy'),
  r('s3b', 'S3b', SPINE, 12, 'Cervical, posterior procedures, more than 2 levels or front and back'),
  r('s4', 'S4', SPINE, 16, 'Thoracic, intrathoracic spinal procedures'),
  r('s5', 'S5', SPINE, 20, 'Thoracic, extensive thoracic or lumbar decompression and fusion, e.g. scoliosis'),
  r('s6', 'S6', SPINE, 8, 'Lumbar, discectomy or decompression procedures, 1 to 2 levels'),
  r('s7', 'S7', SPINE, 8, 'Lumbar, minimally invasive lateral lumbar procedures'),
  r('s8a', 'S8a', SPINE, 8, 'Lumbar, anterior decompression or fusion, single level'),
  r('s8b', 'S8b', SPINE, 10, 'Lumbar, anterior decompression or fusion, multiple level'),
  r('s9a', 'S9a', SPINE, 10, 'Lumbar, posterior decompression or fusion, single level'),
  r('s9b', 'S9b', SPINE, 12, 'Lumbar, posterior decompression or fusion, two level'),
  r('s9c', 'S9c', SPINE, 14, 'Lumbar, posterior decompression or fusion, three or more levels'),
  r('s10', 'S10', SPINE, 18, 'Combined anterior and posterior surgical approach'),

  r('a1', 'A1', ABDO, 4, 'Minor procedures, e.g. excision of skin lesions, egg pick-up under sedation'),
  r('a2', 'A2', ABDO, 5, 'Simple but invasive procedures, e.g. hernias (open and laparoscopic), diagnostic laparoscopy, tubal ligation'),
  r('a3', 'A3', ABDO, 6, 'Moderate procedures, e.g. incisional hernia repair, laparoscopic cholecystectomy, appendectomy'),
  r('a4', 'A4', ABDO, 6, 'Gynae, moderate or major procedures, e.g. endometriosis surgery, abdominal hysterectomy', [6, 8]),
  r('a5', 'A5', ABDO, 8, 'Major procedures, e.g. extensive incisional hernia repair, abdominoplasty'),
  r('a6', 'A6', ABDO, 12, 'Complex procedures, e.g. phaeochromocytoma', [12, 14]),
  r('a7', 'A7', ABDO, 8, 'Upper GI, major laparoscopic procedures, e.g. Nissen fundoplication, gastric banding, sleeve gastrectomy'),
  r('a8', 'A8', ABDO, 10, 'Upper GI, major open procedure, e.g. gastric bypass'),
  r('a12', 'A12', ABDO, 8, 'Lower GI, major procedures, e.g. bowel resection, single section with re-anastomosis', [8, 10]),
  r('a13', 'A13', ABDO, 12, 'Lower GI, complex procedures, e.g. extensive bowel resection, cystectomy', [12, 14]),

  r('p1', 'P1', PERI, 4, 'Minor procedures, e.g. excision of skin tags, circumcision; gynae cystoscopy, hysteroscopy, D+C'),
  r('p2', 'P2', PERI, 5, 'Simple but invasive procedures, e.g. orchidopexy, ureteroscopy, TURBT; gynae anterior or posterior repair'),
  r('p3', 'P3', PERI, 4, 'Urology, minor procedures, e.g. trans-perineal prostate biopsy'),
  r('p4', 'P4', PERI, 6, 'Urology, moderate surgery, e.g. TURP'),
  r('p5', 'P5', PERI, 8, 'Urology, major surgery, e.g. percutaneous nephrolithotomy'),
  r('p6Urology', 'P6', PERI, 10, 'Urology, complex surgery, e.g. radical prostatectomy, nephrectomy, open cystectomy'),
  r('p6Obstetric', 'P6', PERI, 4, 'Obstetric vaginal procedures'),
  r('p7', 'P7', PERI, 5, 'Obstetric epidural pain relief or evacuation of uterus, post-partum'),
  r('p8', 'P8', PERI, 6, 'Caesarean section (spinal or GA), vaginal birth under GA'),

  r('pe1', 'PE1', PELVIC, 4, 'Minor procedures, e.g. application of hip spica'),
  r('pe2', 'PE2', PELVIC, 12, 'Significant procedures, e.g. open pelvic surgery'),

  r('v1', 'V1', VASC, 4, 'Minor procedure, e.g. varicose vein surgery, port insertion'),
  r('v2', 'V2', VASC, 6, 'Moderate procedure, e.g. infra-inguinal arterial surgery, fistula formation'),

  r('ll1', 'LL1', LL, 4, 'Minor procedures, e.g. excision of skin lesions, hip arthroscopy, knee arthroscopy'),
  r('ll2', 'LL2', LL, 5, 'Simple but invasive procedures, e.g. simple tendon or nerve transposition'),
  r('ll3', 'LL3', LL, 6, 'Moderate soft tissue, muscle or nerve procedures, e.g. ACL surgery, femoral or tibial osteotomy'),
  r('ll4', 'LL4', LL, 8, 'Major hip or knee joint procedures, e.g. hip replacement, knee replacement'),
  r('ll5', 'LL5', LL, 10, 'Complex hip or knee joint procedures, e.g. bilateral joint replacements, simple joint revision'),
  r('ll6', 'LL6', LL, 12, 'Significant hip or knee revision procedures, e.g. two component revisions'),

  r('e1', 'E1', REMOTE, 4, 'Endoscopy under sedation, gastroscopy or colonoscopy'),
  r('e2', 'E2', REMOTE, 5, 'Endoscopy under general anaesthesia, gastroscopy or colonoscopy'),
  r('e3', 'E3', REMOTE, 6, 'Moderate endoscopic procedures, e.g. ERCP, oesophageal stenting'),
  r('c1', 'C1', REMOTE, 4, 'Cardiology, minor procedures, e.g. cardioversion, sedation for TOE'),
  r('r1', 'R1', REMOTE, 5, 'Radiology, diagnostic, e.g. CT, PET or MRI scan'),
  r('r2', 'R2', REMOTE, 6, 'Radiology, major procedures, e.g. non-cerebral embolization, non-aortic stenting', [6, 8]),
  r('m1', 'M1', REMOTE, 4, 'Miscellaneous, minor procedures, e.g. electroconvulsive therapy'),
  r('m3', 'M3', REMOTE, 4, 'Medical transport, preparation, monitoring and support, plus time'),

  r('cp1', 'CP1', PAIN, 4, 'Chronic pain consultation, low complexity decision making, plus time'),
  r('cp4', 'CP4', PAIN, 4, 'Trigger point injections or infusions, plus time'),
  r('cp5', 'CP5', PAIN, 6, 'Regional blocks, plus time'),
]

/**
 * AA's own rows (unmarked), one per pre-Phase 19 code with no published match.
 * The last three keep the interim included positioning of their legacy codes.
 */
const AA_OWN: Row[] = [
  r('aaGastricBypass', 'A8', ABDO, 9, 'Gastric bypass, laparoscopic', [9, 11]),
  r('aaSleeveGastrectomy', 'A7', ABDO, 9, 'Sleeve gastrectomy'),
  r('aaLaparotomy', 'A5', ABDO, 7, 'Laparotomy, exploratory'),
  r('aaAppendicectomy', 'A3', ABDO, 5, 'Appendicectomy, laparoscopic'),
  r('aaUmbilicalHernia', 'A2', ABDO, 4, 'Umbilical hernia repair'),
  r('aaKneeReplacement', 'LL4', LL, 7, 'Knee, total replacement'),
  r('aaAclReconstruction', 'LL3', LL, 5, 'Knee, ACL reconstruction'),
  r('aaWristOrif', 'UL2', UL, 4, 'Wrist, ORIF distal radius'),
  r('aaTonsillectomy', 'H2', HEAD, 4, 'Tonsillectomy'),
  r('aaSeptoplasty', 'H2', HEAD, 4, 'Septoplasty'),
  r('aaRhinoplasty', 'H3', HEAD, 5, 'Rhinoplasty'),
  r('aaCataract', 'H6a', HEAD, 3, 'Cataract extraction with IOL'),
  r('aaTurp', 'P4', PERI, 5, 'TURP'),
  r('aaCystoscopy', 'P1', PERI, 3, 'Cystoscopy'),
  r('aaUreteroscopy', 'P2', PERI, 4, 'Ureteroscopy with lithotripsy'),
  r('aaSkinFlap', 'T1', THORAX, 4, 'Skin flap repair, complex', [4, 6]),
  r('aaBreastReduction', 'T2', THORAX, 6, 'Breast reduction'),
  r('aaHipReplacement', 'LL4', LL, 7, 'Hip, total replacement, primary'),
  r('aaHipHemiarthroplasty', 'LL4', LL, 6, 'Hip, hemiarthroplasty'),
  r('aaShoulderArthroscopy', 'UL3', UL, 5, 'Shoulder arthroscopy'),
]

const ALL_ROWS = [...PUBLISHED, ...AA_OWN]

const seedId = (i: number) => `RG${String(i + 1).padStart(3, '0')}`

/** The seeded rows, with their opaque ids. */
export const RVG_GROUPS: readonly RvgGroup[] = ALL_ROWS.map((row, i) => ({
  id: seedId(i),
  code: row.code,
  description: row.description,
  anatomy: row.anatomy,
  baseUnits: row.baseUnits,
  ...(row.range !== undefined ? { baseUnitsRange: { ...row.range } } : {}),
  modifierUnits: 0,
  retired: false,
  // The modifiers the base units include (catch-up Phase 19b, US-05.1.4, D43):
  // P1 on the 20 published Neurosurgery and Spine rows, from the catalogue's CSV.
  includedModifierIds: i < PUBLISHED.length ? [...(INCLUDED_MODIFIER_IDS_BY_RVG_CODE.get(row.code) ?? [])] : [],
  // The base codes the guide splits by age take no age modifier (D29,
  // OQ-95 part 1 answered), on every row that carries the code (AA's own P2 row too).
  ...(AGE_SPLIT_CODES.has(row.code) ? { noAgeModifier: true } : {}),
}))

/** Seed-only names for the rows' ids (for the seed, fixtures and tests). */
export const RVG_GROUP: Readonly<Record<string, RvgGroupId>> = Object.fromEntries(
  ALL_ROWS.map((row, i) => [row.key, seedId(i)]),
)

/** The number of AA's own rows (for the seed test). */
export const AA_OWN_ROW_KEYS: readonly string[] = AA_OWN.map((row) => row.key)

// ---------------------------------------------------------------------------
// The legacy bridge (seed-only)
// ---------------------------------------------------------------------------

export interface LegacyRvgCode {
  /** The row the legacy code now points at. */
  groupId: RvgGroupId
  /** The legacy description (the generated Procedures' text, unchanged). */
  description: string
  /** The legacy range, where the code had one: the generator's RNG draws from it. */
  legacyRange?: BaseUnitsRange
}

const legacy = (key: string, description: string, legacyRange?: [number, number]): LegacyRvgCode => {
  const groupId = RVG_GROUP[key]
  if (groupId === undefined) throw new Error(`No RVG group seeded for ${key}`)
  return {
    groupId,
    description,
    ...(legacyRange !== undefined ? { legacyRange: { min: legacyRange[0], max: legacyRange[1] } } : {}),
  }
}

/**
 * Every pre-Phase 19 code still used by the seed, to its row. A published row
 * only where its base units equal the legacy figure and its examples fit;
 * otherwise AA's own row with the legacy figure (and range).
 */
export const LEGACY_CODE_TO_RVG_GROUP: Readonly<Record<string, LegacyRvgCode>> = {
  // Published rows with the legacy figure
  '20941': legacy('a3', 'Laparoscopic cholecystectomy'),
  '49115': legacy('a2', 'Inguinal hernia repair'),
  '49558': legacy('ll1', 'Knee arthroscopy'),
  '50120': legacy('ll3', 'Femur, ORIF proximal'),
  '45623': legacy('n3', 'Thyroidectomy'),
  '42725': legacy('h6a', 'Vitrectomy'),
  '42794': legacy('h6a', 'Strabismus correction'),
  '34800': legacy('v1', 'Varicose veins, bilateral'),
  // AA's own rows
  '20880': legacy('aaGastricBypass', 'Gastric bypass, laparoscopic', [9, 11]),
  '20882': legacy('aaSleeveGastrectomy', 'Sleeve gastrectomy'),
  '20905': legacy('aaLaparotomy', 'Laparotomy, exploratory'),
  '20950': legacy('aaAppendicectomy', 'Appendicectomy, laparoscopic'),
  '49120': legacy('aaUmbilicalHernia', 'Umbilical hernia repair'),
  '49518': legacy('aaKneeReplacement', 'Knee, total replacement'),
  '49561': legacy('aaAclReconstruction', 'Knee, ACL reconstruction'),
  '46360': legacy('aaWristOrif', 'Wrist, ORIF distal radius'),
  '41764': legacy('aaTonsillectomy', 'Tonsillectomy'),
  '41789': legacy('aaSeptoplasty', 'Septoplasty'),
  '41800': legacy('aaRhinoplasty', 'Rhinoplasty'),
  '42702': legacy('aaCataract', 'Cataract extraction with IOL'),
  '36840': legacy('aaTurp', 'TURP'),
  '36561': legacy('aaCystoscopy', 'Cystoscopy'),
  '37623': legacy('aaUreteroscopy', 'Ureteroscopy with lithotripsy'),
  '45030': legacy('aaSkinFlap', 'Skin flap repair, complex', [4, 6]),
  '45200': legacy('aaBreastReduction', 'Breast reduction'),
  '47516': legacy('aaHipReplacement', 'Hip, total replacement, primary'),
  '47519': legacy('aaHipHemiarthroplasty', 'Hip, hemiarthroplasty'),
  '48939': legacy('aaShoulderArthroscopy', 'Shoulder arthroscopy'),
}

/** The row a legacy code points at (throws on a code the bridge does not hold: a seed bug). */
export function rvgGroupIdForLegacyCode(code: string): RvgGroupId {
  const entry = LEGACY_CODE_TO_RVG_GROUP[code]
  if (entry === undefined) throw new Error(`Legacy RVG code ${code} has no RVG group`)
  return entry.groupId
}

/** Eye codes for generated Christchurch Eye Surgery Bookings (the generator's pool; legacy codes). */
export const EYE_CODES: readonly string[] = ['42702', '42725', '42794'] as const

/** General filler codes for generated Bookings (excludes bariatric and eye codes; legacy codes). */
export const GENERAL_CODES: readonly string[] = [
  '20941', '20905', '20950', '49115', '49120', '47516', '47519', '50120',
  '49518', '49558', '49561', '48939', '46360', '41764', '41789', '45623',
  '36840', '36561', '37623', '45030', '45200', '34800',
] as const
