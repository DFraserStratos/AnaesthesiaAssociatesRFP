import { ANAESTHETISTS } from './contracts'
import type { Line } from './types'

/**
 * Each anaesthetist's prepay price list: one fixed price per procedure they
 * price this way, ex GST, which is the prepaid amount. No fee file carries one,
 * so these are illustrative (prices in the range of the fee files' self-funded
 * figures), not any anaesthetist's real list.
 */
const LISTS: Record<keyof typeof ANAESTHETISTS, [string, number][]> = {
  fairbairn: [
    ['Cataract extraction with IOL, one eye', 480],
    ['Cataract extraction with IOL and MIGS, one eye', 650],
    ['Bilateral cataract extraction, same day', 860],
    ['Abdominoplasty', 2100],
    ['Abdominoplasty with liposuction', 2450],
    ['Breast augmentation', 1350],
    ['Breast reduction', 2050],
    ['Face lift', 3100],
  ],
  hollis: [
    ['Upper blepharoplasty, bilateral', 950],
    ['Blepharoplasty and ptosis repair, bilateral', 1250],
    ['Ptosis repair, unilateral', 900],
    ['Entropion or ectropion repair', 950],
    ['Eyelid lesion excision and reconstruction', 1100],
    ['Pterygium excision with graft', 950],
  ],
  cole: [
    ['Knee arthroscopy', 780],
    ['ACL reconstruction', 1650],
    ['Total knee replacement', 2600],
    ['Total laparoscopic hysterectomy', 2000],
    ['Diagnostic laparoscopy', 850],
    ['Hysteroscopy', 650],
  ],
}

export const PREPAY_LINES: Line[] = (Object.keys(LISTS) as (keyof typeof ANAESTHETISTS)[]).flatMap((k) =>
  LISTS[k].map(([description, fee], i) => ({
    id: `prepay-${ANAESTHETISTS[k].id}:${i + 1}`,
    contract: `prepay-${ANAESTHETISTS[k].id}`,
    code: null,
    description,
    fee,
    gst: 'excl',
    band: null,
    addOn: false,
    approx: false,
    source: 'Illustrative anaesthetist prepay price list',
  })),
)
