/**
 * A UTF-8 byte-order mark (U+FEFF) at the start of a file, as some editors on Windows save one.
 * Readers ignore it (records, `board-layout.json`, `board.config.json`, `status-recodes.json`), and
 * a rewrite keeps it (`writeAtomic` in `server/catalogueFs.ts`), so the board never changes a byte
 * the user did not change. Record revisions are taken without it.
 */
export const BOM = '﻿'

export const hasBom = (text: string) => text.startsWith(BOM)

export const stripBom = (text: string) => (hasBom(text) ? text.slice(1) : text)
