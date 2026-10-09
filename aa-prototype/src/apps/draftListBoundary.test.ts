/**
 * No Draft List reaches an anaesthetist surface (catch-up Phase 31; FT-01.6
 * "never offered to anaesthetists"; OQ-86 answered no, D46). Nothing under the
 * mobile and web apps or the PWA imports the Draft List selectors, actions,
 * screens or words; the PWA stand-in's body lives in `src/store`.
 */

import { describe, expect, it } from 'vitest'

const SOURCES = import.meta.glob(['./mobile/**/*.{ts,tsx}', './web/**/*.{ts,tsx}', '../pwa/**/*.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const DRAFT_NAMES = /\b(waitingDraftLists|draftListsForDate|waitingDraftListCount|finishedDraftLists|draftListAvailabilityFor|createDraftList|assignDraftList|redateDraftList|removeDraftList|DraftListDrawer|DraftListsScreen|DraftListBand|DraftListsCard|scheduleTerms|isDraftList)\b/

describe('Draft Lists stay in the office (OQ-86 answered no)', () => {
  it('no mobile, web or PWA source names a Draft List selector, action, screen or word', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(10)
    const hits = Object.entries(SOURCES)
      .filter(([file]) => !file.includes('.test.'))
      .filter(([, source]) => DRAFT_NAMES.test(source))
      .map(([file]) => file)
    expect(hits).toEqual([])
  })
})
