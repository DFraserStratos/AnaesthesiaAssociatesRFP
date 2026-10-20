import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, componentCodeIn, kindHelpIn, parseConfig } from '../shared/config.ts'
import { DEFAULT_ITEM_STATUSES, DEFAULT_QUESTION_STATUSES, defaultStatus, isAnswered, isRetired, normaliseStatus, roleCode, settleTargets, statusClasses, statusHeading, statusHelp, statusLabel, waitingStatus, type Recode } from '../shared/statuses.ts'

describe('board.config.json', () => {
  it('reads a full config', () => {
    const { config, problems } = parseConfig(
      JSON.stringify({
        project: { name: 'Acme', locale: 'en-GB' },
        components: [{ name: 'Core', code: 'COR' }, 'Reports'],
        screenshotApps: [{ key: 'web', label: 'Web', viewport: 'desktop' }, { key: 'phone', viewport: 'mobile' }],
        statuses: [
          { code: 1, label: 'Draft', help: 'Needs sign-off from Acme', tone: 'neutral', role: 'default' },
          { code: 2, label: 'Agreed', help: 'Agreed with Acme', tone: 'green', settle: true },
          { code: 9, label: 'Gone', tone: 'hatched', role: 'retired' },
        ],
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
    expect(statusLabel(config, 'item', '1')).toBe('Draft')
    expect(statusLabel(config, 'item', '7')).toBe('7')
    expect(statusHelp(config, 'item', '1')).toBe('Needs sign-off from Acme')
    expect(statusHelp(config, 'item', '9')).toBe('')
    expect(config.questionStatuses).toEqual(DEFAULT_QUESTION_STATUSES)
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
        statuses: { Maybe: { help: 'x' } },
        questionStatuses: [{ code: 1, role: 'default' }, { code: 'open' }],
        capture: { apps: { kiosk: { url: 'http://x' }, web: {} } },
      }),
    )
    expect(config.components).toEqual([{ name: 'Core' }])
    expect(config.screenshotApps).toEqual([{ key: 'web', label: 'web', viewport: 'desktop' }])
    expect(config.statuses).toEqual(DEFAULT_ITEM_STATUSES)
    expect(config.questionStatuses).toEqual(DEFAULT_QUESTION_STATUSES)
    expect(config.capture?.apps).toEqual({})
    expect(problems).toEqual([
      'components: {"code":"X"} has no name',
      'components: "Core" is listed twice',
      'screenshotApps: {"key":"Web App"} needs a key in lower-case letters, digits and hyphens',
      'screenshotApps: "web" viewport must be desktop or mobile',
      'statuses must be a list of statuses ({ code, label, help, tone, role })',
      'statuses: using the defaults until that is fixed',
      'questionStatuses: {"code":"open"} needs a code: a whole number from 1',
      'questionStatuses: one status needs the answered role',
      'questionStatuses: using the defaults until that is fixed',
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

describe('statuses', () => {
  const read = (statuses: unknown, questionStatuses?: unknown) => parseConfig(JSON.stringify({ statuses, questionStatuses }))

  it('hangs behaviour off roles, never names', () => {
    const c = DEFAULT_CONFIG
    expect(defaultStatus(c, 'item')).toBe('1')
    expect(defaultStatus(c, 'question')).toBe('1')
    expect(isRetired(c, { status: '5' })).toBe(true)
    expect(isRetired(c, { status: '1' })).toBe(false)
    expect(isAnswered(c, { status: '4' })).toBe(true)
    expect(waitingStatus(c)).toBe('2')
    expect(settleTargets(c)).toEqual(['3', '4'])
    expect(statusHeading(c, '2')).toBe('Awaiting confirmation')
    expect(statusClasses(c, 'item', '5')).toBe('tone-hatched is-retired')
    expect(statusClasses(c, 'question', '1')).toBe('tone-amber')
  })

  it('takes a project list in its order, with its own codes in the roles', () => {
    const { config, problems } = read([
      { code: 10, label: 'Idea', tone: 'sand', role: 'default' },
      { code: 20, label: 'Agreed', tone: 'green', settle: true },
      { code: 30, label: 'Binned', tone: 'hatched', role: 'retired' },
    ])
    expect(problems).toEqual([])
    expect(config.statuses.map((d) => d.code)).toEqual(['10', '20', '30'])
    expect(roleCode(config, 'item', 'retired')).toBe('30')
    expect(isRetired(config, { status: '5' })).toBe(false)
    expect(waitingStatus(config)).toBeUndefined()
  })

  it('refuses a list without its required roles, a doubled role or code, or no settle status', () => {
    const { config, problems } = read([
      { code: 1, role: 'default' },
      { code: 1, role: 'default' },
      { code: 2, tone: 'purple' },
    ])
    expect(config.statuses).toEqual(DEFAULT_ITEM_STATUSES)
    expect(problems).toEqual([
      'statuses: "2" tone must be one of neutral, amber, olive, green, forest, sand, hatched',
      'statuses: "1" is listed twice',
      'statuses: only one status may have the default role',
      'statuses: one status needs the retired role',
      'statuses: at least one status needs settle (offered when a question is answered)',
      'statuses: using the defaults until that is fixed',
    ])
  })

  it('follows recodes to today\'s code, and passes unknown values through', () => {
    const recodes: Recode[] = [
      { date: '2026-10-20', items: { Confirmed: 'agreed', Future: 'proposed' }, questions: { Answered: '4' } },
      { date: '2026-10-20', items: { agreed: '4', proposed: '1' }, questions: {} },
    ]
    expect(normaliseStatus(recodes, 'item', 'Confirmed')).toBe('4')
    expect(normaliseStatus(recodes, 'item', 'Future')).toBe('1')
    expect(normaliseStatus(recodes, 'item', '3')).toBe('3')
    expect(normaliseStatus(recodes, 'question', 'Answered')).toBe('4')
    expect(normaliseStatus(recodes, 'question', 'Confirmed')).toBe('Confirmed')
  })
})
