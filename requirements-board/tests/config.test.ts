import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, DEFAULT_STATUS_HELP, componentCodeIn, kindHelpIn, parseConfig, statusHelpIn, statusLabelIn } from '../shared/config.ts'

describe('board.config.json', () => {
  it('reads a full config', () => {
    const { config, problems } = parseConfig(
      JSON.stringify({
        project: { name: 'Acme', locale: 'en-GB' },
        components: [{ name: 'Core', code: 'COR' }, 'Reports'],
        screenshotApps: [{ key: 'web', label: 'Web', viewport: 'desktop' }, { key: 'phone', viewport: 'mobile' }],
        statuses: { Proposed: { label: 'Draft', help: 'Needs sign-off from Acme' } },
        questionKinds: { question: { help: 'Ask Acme' } },
        capture: { apps: { web: { url: 'http://localhost:3000/' } }, timezone: 'Europe/London' },
      }),
    )
    expect(problems).toEqual([])
    expect(config.project).toEqual({ name: 'Acme', locale: 'en-GB' })
    expect(config.components).toEqual([{ name: 'Core', code: 'COR' }, { name: 'Reports' }])
    expect(config.screenshotApps).toEqual([
      { key: 'web', label: 'Web', viewport: 'desktop' },
      { key: 'phone', label: 'phone', viewport: 'mobile' },
    ])
    expect(statusLabelIn(config, 'Proposed')).toBe('Draft')
    expect(statusLabelIn(config, 'Open')).toBe('Open')
    expect(statusHelpIn(config, 'Proposed')).toBe('Needs sign-off from Acme')
    expect(statusHelpIn(config, 'Retired')).toBe(DEFAULT_STATUS_HELP.Retired)
    expect(kindHelpIn(config, 'question')).toBe('Ask Acme')
    expect(componentCodeIn(config, 'Core')).toBe('COR')
    expect(componentCodeIn(config, 'Reports')).toBe('REP')
    expect(config.capture).toEqual({
      recipes: 'capture/recipes',
      report: 'capture/REPORT.md',
      timezone: 'Europe/London',
      apps: { web: { url: 'http://localhost:3000', setupRoute: '/', hideCss: '' } },
    })
  })

  it('falls back to neutral defaults, field by field, and says what was wrong', () => {
    expect(parseConfig('{').problems[0]).toMatch(/not valid JSON/)
    expect(parseConfig('{').config).toEqual(DEFAULT_CONFIG)
    const { config, problems } = parseConfig(
      JSON.stringify({
        components: [{ name: 'Core' }, { code: 'X' }, { name: 'Core' }],
        screenshotApps: [{ key: 'Web App' }, { key: 'web', viewport: 'tablet' }],
        statuses: { Maybe: { help: 'x' }, Open: 'oops' },
        capture: { apps: { kiosk: { url: 'http://x' }, web: {} } },
      }),
    )
    expect(config.components).toEqual([{ name: 'Core' }])
    expect(config.screenshotApps).toEqual([{ key: 'web', label: 'web', viewport: 'desktop' }])
    expect(config.statuses).toEqual({})
    expect(config.capture?.apps).toEqual({})
    expect(problems).toEqual([
      'components: {"code":"X"} has no name',
      'components: "Core" is listed twice',
      'screenshotApps: {"key":"Web App"} needs a key in lower-case letters, digits and hyphens',
      'screenshotApps: "web" viewport must be desktop or mobile',
      'statuses: "Maybe" is not one of Proposed, Open, Verify, Confirmed, Future, Retired',
      'statuses.Open must be an object with label and/or help',
      'capture.apps: "kiosk" is not one of the screenshotApps',
      'capture.apps.web needs a url',
    ])
  })

  it('leaves the defaults untouched when parsing', () => {
    parseConfig(JSON.stringify({ components: ['A'], screenshotApps: [{ key: 'a' }] }))
    expect(DEFAULT_CONFIG.components).toEqual([])
    expect(DEFAULT_CONFIG.screenshotApps).toEqual([])
  })
})
