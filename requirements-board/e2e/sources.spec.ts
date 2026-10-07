/// <reference lib="dom" />
/**
 * Sources open the artifact spot they cite, over the fixture catalogue (port 5182). A card shows its
 * Screenshots, then Diagrams, then Sources (each source a row naming the artifact and spot, a
 * source citing several points with a link per point, a non-citation plain); a question's sources
 * and an artifact's Details do the same.
 */
import { expect, test } from '@playwright/test'
import { writeItem, writeQuestion } from '../server/catalogueFs.ts'
import type { CatalogueSnapshot, Question } from '../shared/types.ts'
import { FIXTURE_DIR, fixtureItems, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const SOURCES = ['Test spec p.1 · Introduction', 'Notes 2026-01-02 · Fixture meeting #2 #3', 'Typed decision 2026-01-03 · Donald']
const question: Question = { id: 'OQ-01', kind: 'question', title: 'Which totals?', status: 'Open', owner: '', question: 'Which totals count?', answer: '', affects: ['US-01.1.1'], sources: ['Notes 2026-01-02 · Fixture meeting #1'], extra: {} }

test.beforeEach(async ({ page, request }) => {
  writeFixture()
  const base = fixtureItems().find((i) => i.id === 'US-01.1.1')!
  writeItem({ ...base, sources: SOURCES, artifacts: ['AR-01#totals', 'AR-04'] }, FIXTURE_DIR)
  writeQuestion(question, FIXTURE_DIR)
  await expect
    .poll(async () => {
      const snap = (await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot
      return `${snap.items['US-01.1.1']?.data.sources.length}|${!!snap.questions['OQ-01']}`
    })
    .toBe('3|true')
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test.afterAll(() => writeFixture())

test('a card shows Diagrams then Sources, in the order cited, and no Sources in its facts', async ({ page }) => {
  await page.goto('/#/outline?item=US-01.1.1')
  const sheet = page.locator('.sheet')
  await expect(sheet.locator('.artifacts-section .section-head')).toHaveText([/^Diagrams\s*1/, /^Sources\s*3/])
  await expect(sheet.locator('.artifacts-section').first().locator('.link-row')).toHaveText([/Fixture drawing\s*·?\s*Totals/])
  const rows = sheet.locator('.sources-section .link-row')
  await expect(rows).toHaveText([/Fixture document\s*·?\s*Page 1/, /Fixture note.*Point 2.*Point 3/, /Typed decision 2026-01-03 · Donald/])
  // The note linked whole by `artifacts:` gives way to the points the sources open in it.
  await expect(rows.filter({ hasText: 'Fixture note' })).toHaveCount(1)
  // The plain one is text, not a button; the original wording is the tooltip of the others.
  await expect(rows.nth(2).locator('button')).toHaveCount(0)
  await expect(rows.nth(0)).toHaveAttribute('title', /^Test spec p\.1 · Introduction/)
  await expect(sheet.locator('.sheet-tail .facts .section-head', { hasText: 'Sources' })).toHaveCount(0)
})

test('a printed page opens the PDF one page on, and each cited point opens its own lines', async ({ page }) => {
  await page.goto('/#/outline?item=US-01.1.1')
  const rows = page.locator('.sheet .sources-section .link-row')
  await rows.nth(0).click()
  await expect(page).toHaveURL(/#\/artifacts\/AR-05\?region=p2$/)
  await expect(page.locator('.pdf-page[data-page="2"] .region-box')).toBeVisible({ timeout: 15_000 })

  await page.goto('/#/outline?item=US-01.1.1')
  await rows.nth(1).getByRole('button', { name: 'Point 3' }).click()
  await expect(page).toHaveURL(/#\/artifacts\/AR-04\?region=L19$/)
  await expect(page.locator('.doc-sheet .region-box')).toBeVisible()
  await expect(page.locator('.viewer-flag')).toHaveCount(0)

  // The name opens the first point cited.
  await page.goto('/#/outline?item=US-01.1.1')
  await rows.nth(1).locator('.multi-spot-name').click()
  await expect(page).toHaveURL(/#\/artifacts\/AR-04\?region=L17-18$/)
  await expect(page.locator('.doc-sheet .region-box')).toBeVisible()
})

test("a question's sources open their spot", async ({ page }) => {
  await page.goto('/#/outline?question=OQ-01')
  const row = page.locator('.sheet .sources-section .link-row')
  await expect(row).toHaveText([/Fixture note\s*·?\s*Point 1/])
  await row.click()
  await expect(page).toHaveURL(/#\/artifacts\/AR-04\?region=L16$/)
})

test("an artifact's Details lists its sources as rows and how it is cited", async ({ page }) => {
  await page.goto('/#/artifacts/AR-05')
  await page.getByRole('tab', { name: 'Details' }).click()
  await expect(page.locator('.sources-section .link-row')).toHaveText(['Fixture'])
  await expect(page.locator('.facts', { hasText: 'Cited as' })).toContainText('Test spec')
})
