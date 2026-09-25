import { describe, expect, it } from 'vitest'
import { classifyWheel } from '../src/board/trackpad.ts'

const wheel = (over: Partial<Parameters<typeof classifyWheel>[0]>) => ({ ctrlKey: false, shiftKey: false, deltaX: 0, deltaY: 0, deltaMode: 0, ...over })

describe('classifyWheel', () => {
  it('leaves a pinch to zoom', () => {
    expect(classifyWheel(wheel({ ctrlKey: true, deltaY: -3.2 }))).toBe('pinch')
  })
  it('knows a trackpad by its sideways motion or its -3x wheelDelta', () => {
    expect(classifyWheel(wheel({ deltaX: 2, deltaY: 1 }))).toBe('trackpad')
    expect(classifyWheel(wheel({ deltaY: 4, wheelDeltaY: -12 }))).toBe('trackpad')
    // Chrome rounds wheelDeltaY: a fractional trackpad deltaY is not exactly -3x.
    expect(classifyWheel(wheel({ deltaY: 2.5, wheelDeltaY: -7 }))).toBe('trackpad')
    expect(classifyWheel(wheel({ deltaY: 13.33, wheelDeltaY: -40 }))).toBe('trackpad')
  })
  it('knows a mouse wheel by its 120-step notches, or by line scrolling (Firefox)', () => {
    expect(classifyWheel(wheel({ deltaY: 100, wheelDeltaY: -120 }))).toBe('mouse')
    expect(classifyWheel(wheel({ deltaY: 200, wheelDeltaY: -240 }))).toBe('mouse')
    expect(classifyWheel(wheel({ deltaY: 3, deltaMode: 1 }))).toBe('mouse')
    expect(classifyWheel(wheel({ deltaY: 6 }))).toBe('trackpad') // pixels, no legacy delta: Firefox trackpad
  })
  it('treats Shift+wheel (sideways scroll on a mouse) as a mouse', () => {
    expect(classifyWheel(wheel({ shiftKey: true, deltaX: 100, wheelDeltaY: 0, deltaMode: 1 }))).toBe('mouse')
  })
})
