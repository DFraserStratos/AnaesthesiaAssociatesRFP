import { describe, expect, it } from 'vitest'
import { toggleEmphasis, type Emphasis } from '../src/emphasis.ts'

/** Apply the toggle to `text`, where `[` and `]` mark the selection; return the result the same way. */
const run = (text: string, kind: Emphasis) => {
  const start = text.indexOf('[')
  const end = text.indexOf(']') - 1
  const value = text.replace('[', '').replace(']', '')
  const e = toggleEmphasis(value, start, end, kind)
  const out = value.slice(0, e.from) + e.insert + value.slice(e.to)
  return out.slice(0, e.selStart) + '[' + out.slice(e.selStart, e.selEnd) + ']' + out.slice(e.selEnd)
}

describe('toggleEmphasis', () => {
  it('wraps the selection and keeps it selected', () => {
    expect(run('a [word] b', 'bold')).toBe('a **[word]** b')
    expect(run('a [word] b', 'italic')).toBe('a *[word]* b')
  })

  it('unwraps when the markers sit just outside the selection', () => {
    expect(run('a **[word]** b', 'bold')).toBe('a [word] b')
    expect(run('a *[word]* b', 'italic')).toBe('a [word] b')
  })

  it('unwraps when the markers are inside the selection', () => {
    expect(run('a [**word**] b', 'bold')).toBe('a [word] b')
    expect(run('a [*word*] b', 'italic')).toBe('a [word] b')
  })

  it('treats bold and italic independently', () => {
    expect(run('**[word]**', 'italic')).toBe('***[word]***')
    expect(run('***[word]***', 'italic')).toBe('**[word]**')
    expect(run('***[word]***', 'bold')).toBe('*[word]*')
    expect(run('*[word]*', 'bold')).toBe('***[word]***')
  })

  it('leaves surrounding whitespace outside the markers', () => {
    expect(run('a[ word ]b', 'bold')).toBe('a **[word]** b')
  })

  it('puts the cursor between fresh markers, and removes an empty pair', () => {
    expect(run('a []b', 'bold')).toBe('a **[]**b')
    expect(run('a **[]**b', 'bold')).toBe('a []b')
  })
})
