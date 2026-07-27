/**
 * Full modifier labels (UI wording only — units and semantics come from the
 * MODIFIER_CODES master; values are demo-plausible per the logged decision).
 *
 * Used for the free-stacking chips, the M row's breakdown caption and the
 * segment `title` tooltips. A code inside an exclusive BAND is captioned twice:
 * here in full, and in `MODIFIER_SEGMENT_LABELS` in the shortened form its
 * segmented control needs, where the band's own title already carries the
 * subject ("BMI band" + "30 to 35", not "BMI 30 to 35").
 */
export const MODIFIER_CHIP_LABELS: Readonly<Record<string, string>> = {
  PA1: 'Phone pre-assessment, brief',
  PA2: 'Phone pre-assessment, complex',
  PA3: 'Pre-assessment, standard',
  PA4: 'Pre-assessment, complex',
  PA5: 'Phone follow-up',
  A1: 'Very old',
  A2: 'Very young',
  ASE: 'Emergency',
  OB1: 'BMI under 30',
  OB2: 'BMI 30 to 35',
  OB3: 'BMI 35 to 40',
  OB4: 'BMI over 40',
  P1: 'Positioning',
  AI1: 'Awake intubation',
  PO1: 'Post-op ward review',
  PO2: 'Post-op pain management',
}

/**
 * Band titles for the picker's segmented controls. The domain has its own
 * `modifierBandLabel` ("BMI band") for the calculator's refusal sentences; this
 * is the UI's heading register, and the two are allowed to differ in case.
 */
export const MODIFIER_BAND_TITLES: Readonly<Record<string, string>> = {
  PA: 'Pre-assessment',
  A: 'Age extreme',
  OB: 'BMI band',
}

/**
 * Segment wording inside a band control. Shorter than the chip label because
 * the band title beside it already names the subject: the BMI band's segments
 * read "Under 30 / 30 to 35 / 35 to 40 / Over 40", not four copies of "BMI".
 */
export const MODIFIER_SEGMENT_LABELS: Readonly<Record<string, string>> = {
  PA1: 'Phone, brief',
  PA2: 'Phone, complex',
  PA3: 'Standard',
  PA4: 'Complex',
  A1: 'Very old',
  A2: 'Very young',
  OB1: 'Under 30',
  OB2: '30 to 35',
  OB3: '35 to 40',
  OB4: 'Over 40',
}
