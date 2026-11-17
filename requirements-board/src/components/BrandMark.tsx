/**
 * The board's own mark: a card pinned on grid paper. With a project accent (Settings) the card is
 * filled with it, matching the tab icon, so boards for different projects tell apart.
 */
export function BrandMark({ accent }: { accent?: string }) {
  return (
    <svg className="brand-mark" width="20" height="20" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="6" fill="var(--paper)" />
      <path d="M0 8h32M0 16h32M0 24h32M8 0v32M16 0v32M24 0v32" stroke="var(--rule-strong)" strokeWidth="1" />
      <rect x="6" y="9" width="20" height="14" rx="2" fill={accent ?? 'var(--card)'} stroke={accent ?? 'var(--teal)'} strokeWidth="2.4" />
    </svg>
  )
}
