/**
 * Catalogue example for the docked workbench split (build plan Phase 68): a short fake feed on the
 * left and a placeholder bench on the right, in a fixed-height box so each column's own scrolling
 * shows. Picking a row only changes local state. Demo only.
 */

import { useState } from 'react'
import { neutral, space, type as typeScale } from '../../../../theme/tokens'
import { Eyebrow, OptionRow, Pill } from '../../../../shared/ui'
import { WorkbenchSplit } from '../../../../shared/surface'

const ITEMS = [
  { id: 'a1', title: 'Mr Okafor · Wed 25 Nov AM', from: "St George's · 06:10", kind: 'Update' },
  { id: 'a2', title: 'Ms Tait · Tue 15 Dec PM', from: 'Rooms PDF · 07:42', kind: 'New List' },
  { id: 'a3', title: 'Mr Ruane · Thu 26 Nov AM', from: 'Southern Cross · 08:05', kind: 'Cancellation' },
  { id: 'a4', title: 'Mr Bell · Fri 4 Dec AM', from: 'Rooms PDF · 07:15', kind: 'Update' },
  { id: 'a5', title: 'Mere Tipene · Tue 8 Dec PM', from: 'Southern Cross · 14 days', kind: 'Needs NHI' },
  { id: 'a6', title: 'Dr Kaur · Mon 30 Nov PM', from: 'Rooms PDF · 06:40', kind: 'New List' },
  { id: 'a7', title: 'Ms Novak · Wed 2 Dec AM', from: "St George's · 06:10", kind: 'Update' },
]

export function WorkbenchSplitExample() {
  const [picked, setPicked] = useState(ITEMS[0]!.id)
  const item = ITEMS.find((i) => i.id === picked) ?? ITEMS[0]!
  return (
    <div style={{ height: 300, display: 'flex', flexDirection: 'column', maxWidth: 760 }}>
      <WorkbenchSplit
        feedWidth={280}
        feedLabel="Arrivals"
        workbenchLabel="Workbench"
        shot="catalogue-workbench-split"
        feed={
          <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: space[2] }}>
            {ITEMS.map((i) => (
              <div role="listitem" key={i.id}>
                <OptionRow variant="nav" selected={i.id === picked} onClick={() => setPicked(i.id)} trailing={i.kind}>
                  {i.title}
                </OptionRow>
              </div>
            ))}
          </div>
        }
        workbench={
          <div style={{ padding: `${space[4]}px ${space[6]}px`, display: 'flex', flexDirection: 'column', gap: space[2] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: space[2] }}>
              <Pill tone="neutral" size="sm">{item.kind}</Pill>
              <span style={{ fontSize: typeScale.captionSm.size, color: neutral.mist }}>{item.from}</span>
            </div>
            <div style={{ fontSize: typeScale.heading.size, fontWeight: typeScale.heading.weight, color: neutral.ink }}>{item.title}</div>
            <Eyebrow>Workbench</Eyebrow>
            <div style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate }}>
              The picked arrival&apos;s detail sits here. The feed and the bench scroll on their own, and the page
              around them stays usable: no scrim, no focus trap.
            </div>
          </div>
        }
      />
    </div>
  )
}
