import { createElement } from 'react'
import type { SliceReplacements } from '../../registry'
import { BottomSheetReplacement } from './BottomSheet'

export const replacements: SliceReplacements = {
  BottomSheet: {
    options: [
      {
        label: 'Drag only, handle is an affordance (library)',
        Component: () => createElement(BottomSheetReplacement),
        note: 'The handle is the Drawer’s drag grip; tapping it does nothing.',
      },
      {
        label: 'Tapping the handle also closes (as today)',
        Component: () => createElement(BottomSheetReplacement, { tapHandleCloses: true }),
        note: 'The handle is a "Close sheet" button as today; dragging still dismisses.',
      },
    ],
    library: 'shadcn Drawer (Base UI Drawer)',
    changes: [
      'Adds drag to dismiss (Base UI behaviour: the sheet follows the finger and the scrim fades with it)',
      'Adds Escape, a focus trap with focus restore, and nested-sheet stacking',
      'Keeps the scrim, slide-up, top radius, 90% cap, bottom inset and --aa-keyboard-inset line',
      'Changes the example copy to say drag and Escape now work',
    ],
    status: 'built',
  },
}
