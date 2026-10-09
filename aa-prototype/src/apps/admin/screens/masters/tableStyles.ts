import type { CSSProperties } from 'react'
import { cellStyle as cellFactory, headCellStyle as headFactory } from '../../tableChrome'
export { textActionStyle } from '../../tableChrome'

/** Master data's dense table cells (the compact admin variant). */
export const cellStyle: CSSProperties = cellFactory(true)
export const headCellStyle: CSSProperties = headFactory(true)
/** A row that opens a page: middle-aligned like the other clickable admin tables. */
export const rowCellStyle: CSSProperties = { ...cellStyle, verticalAlign: 'middle' }
