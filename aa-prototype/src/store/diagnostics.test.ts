import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearDiagnostics, DIAGNOSTICS_KEPT, recentDiagnostics, reportDiagnostic } from './diagnostics'
import { refuse } from './mutate'
import { generateNhi } from '../domain/nhi'
import { mulberry32 } from '../domain/rng'

const NHI = generateNhi('current', mulberry32(7))

afterEach(() => {
  clearDiagnostics()
  vi.restoreAllMocks()
})

describe('the diagnostic log (catch-up Phase 43)', () => {
  it('redacts NHIs from the message and every string in the context before keeping or printing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    reportDiagnostic('warn', `lookup failed for ${NHI}`, { row: { nhi: NHI, list: ['x', NHI] }, error: new Error(`bad ${NHI}`) })
    const [entry] = recentDiagnostics()
    expect(JSON.stringify(entry)).not.toContain(NHI)
    expect(entry!.message).toBe('lookup failed for [NHI]')
    expect(JSON.stringify(warn.mock.calls)).not.toContain(NHI)
  })

  it('keeps the last 200 entries and records refusals without printing them', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    for (let i = 0; i < DIAGNOSTICS_KEPT + 5; i++) reportDiagnostic('info', `entry ${i}`)
    expect(recentDiagnostics()).toHaveLength(DIAGNOSTICS_KEPT)
    expect(recentDiagnostics()[0]!.message).toBe('entry 5')
    info.mockClear()
    refuse('notFound', 'List not found.')
    expect(recentDiagnostics().at(-1)).toMatchObject({ level: 'refusal', message: 'List not found.', context: { code: 'notFound' } })
    expect(info).not.toHaveBeenCalled()
  })
})

describe('no console call outside diagnostics.ts', () => {
  const SOURCES = {
    ...import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }),
    ...import.meta.glob('../../pwa/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }),
  } as Record<string, string>

  it('finds the sources', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(100)
  })

  it('writes to the console only through reportDiagnostic', () => {
    for (const [file, source] of Object.entries(SOURCES)) {
      if (file.endsWith('/diagnostics.ts') || /\.test\.tsx?$/.test(file) || file.includes('__fixtures__')) continue
      expect(/\bconsole\.(log|warn|error|info|debug)\s*\(/.test(source), `${file} calls console directly`).toBe(false)
    }
  })
})
