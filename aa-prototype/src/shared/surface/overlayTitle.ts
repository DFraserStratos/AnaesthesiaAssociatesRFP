/**
 * The seam between an overlay and its `OverlayHeader` (UI unification U2,
 * README U03): the header registers its h2's id, the enclosing `Dialog` or
 * `BottomSheet` sets `aria-labelledby` from it, and the web `Dialog` shows the
 * corner X only while a header is present (question 11). `corner` tells the
 * header to leave room for that X.
 */

import { createContext, useContext } from 'react'

export interface OverlayTitleSeam {
  register: (id: string | null) => void
  corner: boolean
}

export const OverlayTitleContext = createContext<OverlayTitleSeam | null>(null)

export function useOverlayTitleSeam(): OverlayTitleSeam | null {
  return useContext(OverlayTitleContext)
}
