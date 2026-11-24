/**
 * Snapshot mode: the board built by `npm run snapshot` to be hosted as static files and read by people
 * outside the team. It reads `catalogue.json` instead of the dev server, shows no editing, and lets a
 * reader answer, comment and suggest edits as responses kept in their browser (`src/responses/`).
 * One flag, fixed at build time, so the dev board's code paths stay as they are.
 */
export const SNAPSHOT = import.meta.env.MODE === 'snapshot'

/** Thrown by a store write in snapshot mode: a backstop, since no control that writes is shown. */
export const READ_ONLY = 'This is a read-only snapshot of the board.'
