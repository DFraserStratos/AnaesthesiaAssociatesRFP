/**
 * Keyword families: the hand-made link between procedure names, contract line
 * descriptions and RVG groups. The fee files carry no RVG codes and the
 * procedure list carries no prices, so nothing links them except a mapping
 * someone maintains. That is the honest cost of the "Procedure first" approach:
 * a line no family recognises never appears under any procedure.
 *
 * `rvg` is the RVG group a family's lines answer to in a reverse lookup
 * (search by RVG code). Illustrative, not clinical advice.
 */
export interface Family {
  id: string
  label: string
  match: RegExp
  rvg: string
}

export const FAMILIES: Family[] = [
  { id: 'cataract', label: 'Cataract', match: /cataract|catrct|phaco|\bIOL\b|intraocular lens/i, rvg: 'H6a' },
  { id: 'glaucoma', label: 'Glaucoma', match: /glaucoma|goniotomy|trabec|trabul|tube implant/i, rvg: 'H6a' },
  { id: 'vitrectomy', label: 'Vitrectomy', match: /vitrect|\bvity\b|vitreo/i, rvg: 'H6a' },
  { id: 'cornea', label: 'Cornea', match: /cornea|keratect|keratopl|DSAEK|DMEK|crosslink/i, rvg: 'H6a' },
  { id: 'squint', label: 'Squint', match: /squint|strabismus/i, rvg: 'H6a' },
  { id: 'pterygium', label: 'Pterygium', match: /pteryg|pinguecula/i, rvg: 'H6a' },
  { id: 'eyelid', label: 'Eyelid', match: /blephar|bleph\b|ptosis|levator|entropi[oa]n|ectropi[oa]n|tarsal strip|lid surgery|lid\/adnexa|canth|chalazion|gold weight|wedge excision|pentagon/i, rvg: 'H6a' },
  { id: 'eyelid-lesion', label: 'Eyelid lesion', match: /periocular|mohs|removal or closure of lesion/i, rvg: 'H1' },
  { id: 'skin-lesion', label: 'Skin lesion', match: /lesion|mohs/i, rvg: 'H1' },
  { id: 'lacrimal', label: 'Tear duct', match: /dacryocyst|\bDCR\b|lacrimal|punctoplasty/i, rvg: 'H6a' },
  { id: 'facelift', label: 'Face and brow', match: /face ?lift|facelift|face &|brow ?lift/i, rvg: 'H3' },
  { id: 'rhinoplasty', label: 'Rhinoplasty', match: /rhinoplast/i, rvg: 'H3' },
  { id: 'otoplasty', label: 'Otoplasty', match: /otoplast/i, rvg: 'H2' },
  { id: 'breast', label: 'Breast', match: /breast|mastopexy|mammopl|augmentation/i, rvg: 'T2' },
  { id: 'abdominoplasty', label: 'Abdominoplasty', match: /abdominoplast|\babdo\b|body lift/i, rvg: 'A1' },
  { id: 'liposuction', label: 'Liposuction', match: /liposuction|\blipo\b|fat (graft|transfer)/i, rvg: 'A1' },
  { id: 'limb-lift', label: 'Limb lift', match: /thigh lift|brachioplast/i, rvg: 'UL1' },
  { id: 'carpal', label: 'Carpal and cubital tunnel', match: /carpal tunnel|cubital/i, rvg: 'UL1' },
  { id: 'ganglion', label: 'Ganglion', match: /ganglion/i, rvg: 'UL1' },
  { id: 'dupuytren', label: 'Dupuytren’s', match: /dupuytren/i, rvg: 'UL2' },
  { id: 'hysterectomy', label: 'Hysterectomy', match: /hysterectomy/i, rvg: 'A4' },
  { id: 'endometriosis', label: 'Endometriosis', match: /endometrio/i, rvg: 'A4' },
  { id: 'gynae-laparoscopy', label: 'Gynae laparoscopy', match: /laparoscop|salping|oophor|filshie|ovarian cyst/i, rvg: 'A2' },
  { id: 'myomectomy', label: 'Myomectomy', match: /myomectomy/i, rvg: 'A4' },
  { id: 'gynae-minor', label: 'Gynae minor', match: /colposcop|hysteroscop|vulva|labiapl|IUCD|perineorrhaphy|cervical|D&C|dilatation and curettage/i, rvg: 'P1' },
  { id: 'acl', label: 'ACL', match: /cruciate|\bACL\b/i, rvg: 'LL3' },
  { id: 'knee-hip', label: 'Hip and knee replacement', match: /(knee|hip) (replacement|arthroplasty)|total (knee|hip)/i, rvg: 'LL4' },
  { id: 'sentinel-node', label: 'Sentinel node', match: /sentinel node/i, rvg: 'T2' },
]

export function familiesOf(text: string): string[] {
  return FAMILIES.filter((f) => f.match.test(text)).map((f) => f.id)
}

export const FAMILY_BY_ID = new Map(FAMILIES.map((f) => [f.id, f]))
