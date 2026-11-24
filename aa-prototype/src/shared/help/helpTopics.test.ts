import { describe, expect, it } from 'vitest'
import { HELP_TOPICS, helpWordCount, type HelpTopicId } from './helpTopics'

/** Every app source file, to check each topic is placed somewhere (the reverse of the typed union). */
const SOURCES = import.meta.glob(['../../**/*.{ts,tsx}', '!../../**/*.test.{ts,tsx}', '!./helpTopics.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const entries = Object.entries(HELP_TOPICS) as [HelpTopicId, (typeof HELP_TOPICS)[HelpTopicId]][]

describe('help topics (Phase 43a, US-15.0.1)', () => {
  it('has about fifteen topics', () => {
    expect(entries.length).toBe(15)
  })

  it.each(entries)('%s is dash-free and at most 60 words', (_id, topic) => {
    for (const text of [topic.title, ...topic.body]) expect(text).not.toMatch(/[–—]/)
    expect(helpWordCount(topic)).toBeLessThanOrEqual(60)
    expect(topic.body.length).toBeGreaterThan(0)
  })

  it.each(entries)('%s avoids the words app copy never uses', (id, topic) => {
    const text = [topic.title, ...topic.body].join(' ')
    expect(text).not.toMatch(/\bslots?\b/i)
    expect(text).not.toMatch(/\bevents?\b/i)
    expect(text).not.toMatch(/\bestimates?\b/i)
    expect(text).not.toMatch(/\bdeposits?\b/i)
    expect(text).not.toMatch(/blacklist/i)
    expect(text).not.toMatch(/DRAFT/)
    expect(text).not.toMatch(/sign(ed)? ?in\b/i)
    // D36: only the Admin Draft Lists tip names a tier or a preference.
    if (id !== 'day.draftLists') {
      expect(text).not.toMatch(/\bTier\b/)
      expect(text).not.toMatch(/Preferred/)
    }
  })

  it('no topic is provisional today, and a provisional note names an OQ', () => {
    for (const [, topic] of entries) {
      if (topic.provisional?.oq !== undefined) expect(topic.provisional.oq).toMatch(/^OQ-\d+$/)
    }
    expect(entries.filter(([, t]) => t.provisional !== undefined)).toEqual([])
  })

  it.each(entries.map(([id]) => id))('%s is placed on a screen', (id) => {
    const used = Object.values(SOURCES).some((src) => src.includes(`'${id}'`) || src.includes(`"${id}"`))
    expect(used).toBe(true)
  })
})
