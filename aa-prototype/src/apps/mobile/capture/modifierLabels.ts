/**
 * Short chip labels (UI wording only — units and semantics come from the
 * MODIFIER_CODES master; values are demo-plausible per the logged decision).
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
