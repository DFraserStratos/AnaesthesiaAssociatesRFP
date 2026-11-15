import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Echo } from './Echo'

/**
 * The prototype's three button kinds, mapped onto the branded shadcn variants:
 * primary = default teal at the 54px CTA size, secondary = outline at 48px (lg),
 * pill = the teal-tint pill at the prototype's 44px.
 */
export function ButtonReplacement() {
  const [last, setLast] = useState('Nothing clicked yet.')
  return (
    <div>
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2.5">
        <Button size="cta" onClick={() => setLast('Primary clicked.')}>Primary</Button>
        <Button variant="outline" size="lg" onClick={() => setLast('Secondary clicked.')}>Secondary</Button>
        <Button variant="pill" className="tw:h-11" onClick={() => setLast('Pill clicked.')}>Pill</Button>
        <Button variant="outline" size="lg" disabled>Disabled</Button>
      </div>
      <Echo>{last}</Echo>
    </div>
  )
}
