import type { CSSProperties } from 'react'
import { densityCellStyle, densityHeadCellStyle } from '../../../../shared/table'
export { textActionStyle } from '../../tableChrome'

/** Master data's dense table cells (the kit's `dense` density, UI unification U6). */
export const cellStyle: CSSProperties = densityCellStyle('dense')
export const headCellStyle: CSSProperties = densityHeadCellStyle('dense')
/** A row that opens a page: middle-aligned like the other clickable admin tables. */
export const rowCellStyle: CSSProperties = { ...cellStyle, verticalAlign: 'middle' }
