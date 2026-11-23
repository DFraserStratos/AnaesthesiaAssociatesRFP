/**
 * Test-only helpers for the catalogue tests (never imported by the pages): the
 * source files under src/ and the Shared component cells a rendered page shows.
 * The tests pass both to CatalogueKit's missingSharedFiles, so a cell naming a
 * file that has moved or been renamed fails the test.
 */

/** Every .ts, .tsx and .css file under src/, as a path relative to src/ ("shared/ui/Pill.tsx"). */
export const SRC_FILES: readonly string[] = Object.keys(import.meta.glob('../../../**/*.{ts,tsx,css}')).map((k) => k.replace(/^(\.\.\/){3}/, ''))

/** The Shared component cell of every row in `root`. */
export function sharedCells(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('[data-catalogue-shared]'), (el) => el.getAttribute('data-catalogue-shared') ?? '')
}
