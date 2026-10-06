/**
 * The red box that marks a spot: drawn into screenshots by `npm run capture` and over artifacts
 * by the board, so both look the same. Pixels on screen: the stroke sits just outside the padded
 * box, with a soft red glow.
 */
export const HIGHLIGHT = {
  pad: 8,
  colour: '#E0243A',
  width: 3,
  radius: 12,
  glow: '0 0 0 3px rgba(224,36,58,0.18), 0 0 18px 2px rgba(224,36,58,0.35)',
} as const
