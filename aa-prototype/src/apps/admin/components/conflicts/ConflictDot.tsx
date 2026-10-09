import { neutral, semantic } from '../../../../theme/tokens'

/**
 * The conflict "!" (catch-up Phase 30): the design's attention badge in the
 * warning solid, with the glyph in the surface colour. Decorative: the text
 * beside it always names the conflict (colour is never the only signal).
 */
export function ConflictDot({ size = 14, muted = false }: { size?: number; muted?: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 99,
        background: muted ? neutral.mist : semantic.warning.solid,
        color: neutral.surface,
        fontSize: Math.round(size * 0.64),
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
      }}
    >
      !
    </span>
  )
}
