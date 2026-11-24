/**
 * A board snapshot: a static, read-only copy of the board for people outside the team, written by
 * `scripts/snapshot.ts` and read by the board built in snapshot mode (`src/snapshot.ts`). Shared so the
 * script and the page agree on the data file's shape and where each file sits.
 */
import type { CatalogueSnapshot } from './types.ts'

/** What the snapshot was taken from, shown on its masthead and written into every reader's responses. */
export interface SnapshotInfo {
  /** When it was taken (ISO 8601). */
  takenAt: string
  /** The commit the catalogue was at, or null outside git. */
  commit: string | null
  /** True when the catalogue had changes not yet committed. */
  dirty: boolean
  /** The board kit's version that built it. */
  boardVersion: string
  /** The project's name from board.config.json (empty when it has none). */
  project: string
}

/** `catalogue.json` in a snapshot: the dev server's catalogue, plus where it came from. */
export interface StaticCatalogue extends CatalogueSnapshot {
  snapshot: SnapshotInfo
}

/** The data file, beside the snapshot's index.html. */
export const SNAPSHOT_DATA = 'catalogue.json'

/** The marker a snapshot folder carries, so a later snapshot may replace it and nothing else. */
export const SNAPSHOT_MARKER = '.board-snapshot.json'

/** The folder an artifact's file is copied to, beside index.html. */
export const SNAPSHOT_ARTIFACT_DIR = 'artifact-file'

/**
 * Where an artifact's file sits in a snapshot: its ID with the file's own extension, so a static host
 * sends the right content type (an SVG must arrive as image/svg+xml to show in an <img>).
 */
export function snapshotArtifactFile(id: string, file: string): string {
  const name = file.split('/').pop() ?? ''
  const dot = name.lastIndexOf('.')
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : ''
  return `${SNAPSHOT_ARTIFACT_DIR}/${encodeURIComponent(id)}${ext}`
}
