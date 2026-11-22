/**
 * Object URLs the board makes (a drawn mermaid diagram as an image), counted so each is revoked once
 * nothing shows it (FINDINGS R-163). `dropUrl` revokes only a URL made here, so a file's URL or a data
 * URL passed to it is left alone.
 */
const made = new Set<string>()

/** An object URL for `blob`, kept until `dropUrl`. */
export function ownUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob)
  made.add(url)
  return url
}

/** Revoke a URL `ownUrl` made; anything else is ignored. */
export function dropUrl(url: string) {
  if (!made.delete(url)) return
  URL.revokeObjectURL(url)
}

/** How many object URLs are outstanding (tests, and the development hook below). */
export const objectUrlCount = () => made.size

// The leak check in `e2e/artifacts.spec.ts` reads the count from the page.
if (import.meta.env?.DEV && typeof window !== 'undefined') (window as { __BOARD_URLS__?: () => number }).__BOARD_URLS__ = objectUrlCount
