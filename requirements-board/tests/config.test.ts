import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, componentCodeIn, kindHelpIn, parseConfig } from '../shared/config.ts'
import { DEFAULT_ITEM_STATUSES, DEFAULT_QUESTION_STATUSES, defaultStatus, isAnswered, isRetired, nextStatusCode, normaliseStatus, roleCode, settleTargets, statusClasses, statusCodes, statusHeading, statusHelp, statusLabel, waitingStatus, type Recode } from '../shared/statuses.ts'

describe('board.config.json', () => {
  it('reads a full config', () => {
    const { config, problems } = parseConfig(
      JSON.stringify({
        project: { name: 'Acme', accent: '#2B6CB0' },
        components: [{ name: 'Core', code: 'COR' }, 'Reports'],
        screenshotApps: [{ key: 'web', label: 'Web', viewport: 'desktop' }, { key: 'phone', viewport: 'mobile' }],
        statuses: [
          { code: 1, label: 'Draft', help: 'Needs sign-off from Acme', tone: 'neutral', role: 'default' },
          { code: 2, label: 'Agreed', help: 'Agreed with Acme', tone: 'green', settle: true },
          { code: 9, label: 'Gone', tone: 'hatched', role: 'retired' },
        ],
        questionKinds: { question: { help: 'Ask Acme' } },
        capture: { apps: { web: { url: 'http://localhost:3000/' }, phone: { url: 'http://localhost:3001', portEnv: 'PHONE_PORT' } }, timezone: 'Europe/London' },
      }),
    )
    expect(problems).toEqual([])
    expect(config.project).toEqual({ name: 'Acme', accent: '#2b6cb0' })
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
      apps: {
        web: { url: 'http://localhost:3000', setupRoute: '/', hideCss: '' },
        phone: { url: 'http://localhost:3001', setupRoute: '/', hideCss: '', portEnv: 'PHONE_PORT' },
      },
    })
  })

  it('falls back to neutral defaults, field by field, and says what was wrong', () => {
    expect(parseConfig('{').problems[0]).toMatch(/not valid JSON/)
    // Every other field at its neutral default; the status lists damaged, never the built-in ones (B02, R-01).
    expect({ ...parseConfig('{').config, statuses: DEFAULT_CONFIG.statuses, questionStatuses: DEFAULT_CONFIG.questionStatuses, statusState: DEFAULT_CONFIG.statusState, sectionState: DEFAULT_CONFIG.sectionState }).toEqual(DEFAULT_CONFIG)
    expect(parseConfig('{').config.sectionState.components.state).toBe('damaged')
    expect(parseConfig('{').config.statuses).toEqual([])
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
    // A components section read with problems is damaged, so Settings saves nothing over it (accepted decision 22).
    expect(config.sectionState).toEqual({ project: { state: 'healthy', problems: [] }, components: { state: 'damaged', problems: ['components: {"code":"X"} has no name', 'components: "Core" is listed twice'] } })
    expect(config.screenshotApps).toEqual([{ key: 'web', label: 'web', viewport: 'desktop' }])
    // The project's own lists as far as they read (B02, R-01), never the built-in ones.
    expect(config.statuses).toEqual([])
    expect(config.questionStatuses).toEqual([{ code: '1', label: '1', help: '', tone: 'neutral', role: 'default' }])
    expect(config.capture?.apps).toEqual({})
    const damaged = 'the board reads only the readable part of this list until it is fixed in board.config.json (status saves are refused meanwhile)'
    expect(problems).toEqual([
      'components: {"code":"X"} has no name',
      'components: "Core" is listed twice',
      'screenshotApps: {"key":"Web App"} needs a key in lower-case letters, digits and hyphens',
      'screenshotApps: "web" viewport must be desktop or mobile',
      'statuses must be a list of statuses ({ code, label, help, tone, role })',
      `statuses: ${damaged}`,
      'questionStatuses: {"code":"open"} needs a code: a whole number from 1',
      'questionStatuses: one status needs the answered role',
      `questionStatuses: ${damaged}`,
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

describe('voice rules', () => {
  it('reads the description warnings, with the flags defaulting to i', () => {
    const { config, problems } = parseConfig(
      JSON.stringify({
        voice: {
          descriptionWarnings: [
            { pattern: '\\bour reading\\b', message: 'an "our reading" marker' },
            { pattern: '^Update \\d{4}', flags: 'im', message: 'an update paragraph' },
          ],
        },
      }),
    )
    expect(problems).toEqual([])
    expect(config.voice.descriptionWarnings).toEqual([
      { pattern: '\\bour reading\\b', flags: 'i', message: 'an "our reading" marker' },
      { pattern: '^Update \\d{4}', flags: 'im', message: 'an update paragraph' },
    ])
  })

  it('has no rules when the block is missing', () => {
    expect(parseConfig('{}').config.voice).toEqual({ descriptionWarnings: [] })
    expect(parseConfig(JSON.stringify({ voice: {} })).config.voice).toEqual({ descriptionWarnings: [] })
    expect(parseConfig('{}').problems).toEqual([])
  })

  it('drops a rule that does not compile or is incomplete, and says so', () => {
    const { config, problems } = parseConfig(
      JSON.stringify({
        voice: {
          descriptionWarnings: [
            { pattern: '(unclosed', message: 'a broken rule' },
            { pattern: 'x', flags: 'q', message: 'a bad flag' },
            { pattern: 'x' },
            { pattern: 'ok', message: 'a good rule' },
          ],
        },
      }),
    )
    expect(config.voice.descriptionWarnings).toEqual([{ pattern: 'ok', flags: 'i', message: 'a good rule' }])
    expect(problems).toHaveLength(3)
    expect(problems[0]).toMatch(/^voice\.descriptionWarnings: "a broken rule" is not a valid regular expression/)
    expect(problems[1]).toMatch(/^voice\.descriptionWarnings: "a bad flag" is not a valid regular expression/)
    expect(problems[2]).toBe('voice.descriptionWarnings: {"pattern":"x"} needs a pattern and a message')
    expect(parseConfig(JSON.stringify({ voice: [] })).problems).toEqual(['voice must be an object'])
    expect(parseConfig(JSON.stringify({ voice: { descriptionWarnings: {} } })).problems).toEqual(['voice.descriptionWarnings must be a list of { pattern, flags, message }'])
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
    // Damaged: the readable part, with the doubled default role resolved by neither entry (B02, R-01).
    expect(config.statuses).toEqual([
      { code: '1', label: '1', help: '', tone: 'neutral' },
      { code: '2', label: '2', help: '', tone: 'neutral' },
    ])
    expect(config.statusState.statuses.state).toBe('damaged')
    expect(problems).toEqual([
      'statuses: "2" tone must be one of neutral, amber, olive, green, forest, sand, hatched',
      'statuses: "1" is listed twice',
      'statuses: only one status may have the default role',
      'statuses: one status needs the retired role',
      'statuses: at least one status needs settle (offered when a question is answered)',
      'statuses: the board reads only the readable part of this list until it is fixed in board.config.json (status saves are refused meanwhile)',
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

/** This repo's six-status list: 4 Agreed, 5 Confirmed, 6 Retired (the defaults have 5 Retired). */
const PROJECT = [
  { code: 1, label: 'Proposed', help: 'Needs agreement', tone: 'neutral', role: 'default' },
  { code: 2, label: 'Open', help: 'Waiting on an open question', tone: 'amber', role: 'waiting' },
  { code: 3, label: 'Verify', help: 'Question answered', tone: 'olive', settle: true },
  { code: 4, label: 'Agreed', help: 'Agreed, not signed off', tone: 'green', settle: true },
  { code: 5, label: 'Confirmed', help: 'Signed off', tone: 'forest', settle: true },
  { code: 6, label: 'Retired', help: 'No longer wanted', tone: 'hatched', role: 'retired' },
]
const withEntry = (i: number, patch: Record<string, unknown>) => PROJECT.map((d, j) => (j === i ? { ...d, ...patch } : d))

describe('status identity (R-01)', () => {
  const read = (statuses: unknown) => parseConfig(JSON.stringify({ statuses }))

  it('keeps every project code, label and role when one field is bad, falling back for that field alone', () => {
    const { config, problems } = read(withEntry(3, { tone: 'teal' }))
    expect(config.statuses.map((d) => [d.code, d.label, d.role ?? ''])).toEqual(PROJECT.map((d) => [String(d.code), d.label, d.role ?? '']))
    expect(config.statuses[3]!.tone).toBe('neutral')
    expect(config.statusState.statuses.state).toBe('degraded')
    expect(problems).toContain('statuses: "4" tone must be one of neutral, amber, olive, green, forest, sand, hatched')
    expect(isRetired(config, { status: '5' })).toBe(false)
    expect(isRetired(config, { status: '6' })).toBe(true)
    expect(statusLabel(config, 'item', '6')).toBe('Retired')
  })

  it('never reads a damaged list through the defaults', () => {
    const cases: Record<string, unknown> = {
      'a bad code': withEntry(2, { code: 'x' }),
      'a duplicated code': [...PROJECT, { ...PROJECT[1], label: 'Open again' }],
      'not a list': { Proposed: 1 },
      'two retired roles': withEntry(4, { role: 'retired' }),
      'no retired role': withEntry(5, { role: undefined }),
      'an unknown role': withEntry(4, { role: 'archived' }),
      'no settle': PROJECT.map((d) => ({ ...d, settle: undefined })),
    }
    for (const [name, statuses] of Object.entries(cases)) {
      const { config, problems } = read(statuses)
      expect(config.statusState.statuses.state, name).toBe('damaged')
      expect(config.statuses, name).not.toEqual(DEFAULT_ITEM_STATUSES)
      expect(isRetired(config, { status: '5' }), name).toBe(false)
      expect(statusLabel(config, 'item', '5'), name).not.toBe('Retired')
      expect(problems.some((p) => /using the defaults/.test(p)), name).toBe(false)
      if (name !== 'not a list') expect(statusLabel(config, 'item', '6'), name).toBe('Retired')
    }
    // A role two entries claim is resolved by neither; a role one entry holds still stands.
    expect(isRetired(read(withEntry(4, { role: 'retired' })).config, { status: '6' })).toBe(false)
    expect(defaultStatus(read(withEntry(4, { role: 'retired' })).config, 'item')).toBe('1')
    expect(defaultStatus(read({ Proposed: 1 }).config, 'item')).toBe('')
  })

  it('reads a config file that does not parse as damaged lists, never the defaults', () => {
    const { config, problems } = parseConfig('{ "statuses": [ ,')
    expect(problems[0]).toMatch(/not valid JSON/)
    expect(config.statuses).toEqual([])
    expect(config.questionStatuses).toEqual([])
    expect(config.statusState.statuses.state).toBe('damaged')
    expect(config.statusState.questionStatuses.state).toBe('damaged')
    expect(isRetired(config, { status: '5' })).toBe(false)
    expect(statusLabel(config, 'item', '6')).toBe('6')
  })

  it('uses the built-in lists only when the project defines none', () => {
    const { config, problems } = parseConfig('{}')
    expect(problems).toEqual([])
    expect(config.statuses).toEqual(DEFAULT_ITEM_STATUSES)
    expect(config.statusState.statuses.state).toBe('healthy')
  })
})

describe('status registry (R-68, D-02)', () => {
  it('derives the high-water marks with no registry fields (this repo: items 6, questions 4)', () => {
    const recodes: Recode[] = [{ date: '2026-10-20', items: { Proposed: '1', Future: '1', Open: '2', Verify: '3', Confirmed: '4', Retired: '6' }, questions: { Open: '1', Confirm: '2', Proposed: '3', Answered: '4' } }]
    const { config, problems } = parseConfig(JSON.stringify({ statuses: PROJECT, questionStatuses: DEFAULT_QUESTION_STATUSES.map((d) => ({ ...d, code: Number(d.code) })) }), recodes)
    expect(problems).toEqual([])
    expect(config.statusState.statuses).toEqual({ state: 'healthy', problems: [], highWater: 6 })
    expect(config.statusState.questionStatuses).toEqual({ state: 'healthy', problems: [], highWater: 4 })
    expect(config.removedStatuses).toEqual({ statuses: [], questionStatuses: [] })
  })

  it('never hands out a code used before: removed, recoded or held by a record', () => {
    expect(nextStatusCode(['1', '6'])).toBe('7')
    const { config } = parseConfig(JSON.stringify({ statuses: PROJECT, removedStatuses: { statuses: [{ code: 7, label: 'On hold' }] } }), [{ date: 'x', items: { '6': '9' }, questions: {} }])
    expect(config.statusState.statuses.highWater).toBe(9)
    expect(nextStatusCode(statusCodes(config, 'item'), [String(config.statusState.statuses.highWater)])).toBe('10')
    expect(nextStatusCode(['1', '2'], ['12'])).toBe('13')
    expect(statusLabel(config, 'item', '7')).toBe('On hold (removed)')
  })

  it('reports a removed code used again', () => {
    const { problems } = parseConfig(JSON.stringify({ statuses: PROJECT, removedStatuses: { statuses: [{ code: 5, label: 'Old five' }] } }))
    expect(problems.some((p) => /"5" was removed .*cannot be used again/.test(p))).toBe(true)
  })

  it('reports a live code a recode moved away', () => {
    const { config, problems } = parseConfig(JSON.stringify({ statuses: PROJECT }), [{ date: '2026-11-01', items: { '5': '9' }, questions: {} }])
    expect(problems.some((p) => /"5" was recoded away/.test(p))).toBe(true)
    expect(config.statusState.statuses.state).toBe('degraded')
  })

  it('reports a label, help or heading that is not text, and keeps the list usable', () => {
    const { config, problems } = parseConfig(JSON.stringify({ statuses: withEntry(1, { label: 7, help: ['x'] }) }))
    expect(problems).toEqual(['statuses: "2" label must be text', 'statuses: "2" help must be text'])
    expect(config.statusState.statuses.state).toBe('degraded')
    expect(config.statuses[1]).toMatchObject({ code: '2', label: '2', role: 'waiting' })
  })

  it('reports an overlapping recode history', () => {
    const { problems } = parseConfig(JSON.stringify({ statuses: PROJECT }), [{ date: '2026-11-01', items: { '4': '5', '5': '6' }, questions: {} }])
    expect(problems.some((p) => /status-recodes\.json/.test(p) && /"5"/.test(p))).toBe(true)
  })
})
