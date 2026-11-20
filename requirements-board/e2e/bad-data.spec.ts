/// <reference lib="dom" />
/**
 * Bad data never white-screens the board (B03), over the fixture catalogue with bad
 * records added: a self-parented card, a two-card cycle, a card of a type the board does not know, a
 * parent typo, and a question whose status is not configured. Then the error boundary itself, by a
 * test-only crash in one region at a time (`window.__BOARD_CRASH_TEST__`, `RegionBoundary.tsx`).
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { writeItem, writeQuestion } from '../server/catalogueFs.ts'
import { serialiseItem } from '../shared/files.ts'
import type { CatalogueSnapshot, Item } from '../shared/types.ts'
import { FIXTURE_DIR, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const base = { status: '1', components: ['Core'], sources: ['Fixture'], images: [], description: '', acceptance: '', technical: '', notes: '', extra: {}, swimlane: null, related: [], artifacts: [], order: 9 } as const
const story = (id: string, parent: string | null, title: string, type = 'story'): Item => ({ ...base, id, parent, title, type, components: ['Core'], sources: ['Fixture'], images: [], related: [], artifacts: [] }) as unknown as Item

function writeBadData() {
  writeItem(story('US-01.0.1', 'US-01.0.1', 'Its own parent'), FIXTURE_DIR)
  writeItem(story('US-01.0.2', 'US-01.0.3', 'Cycle one'), FIXTURE_DIR)
  writeItem(story('US-01.0.3', 'US-01.0.2', 'Cycle two'), FIXTURE_DIR)
  writeItem(story('US-02.1.7', 'FT-02.9', 'Parent typo'), FIXTURE_DIR)
  // A type the board does not know: written as text, the way a hand edit would.
  writeFileSync(join(FIXTURE_DIR, 'stories', 'US-01.1.9.md'), serialiseItem(story('US-01.1.9', 'FT-01.1', 'Odd type', 'user-story')))
  writeQuestion({ id: 'OQ-01', kind: 'question', title: 'Status typo', status: 'Open', owner: 'Client', affects: [], sources: [], question: 'Why?', answer: '', extra: {} }, FIXTURE_DIR)
}

const crashIn = (page: Page, region: string | null) => page.evaluate((r) => (window.__BOARD_CRASH_TEST__ = r ?? undefined), region)
const pill = (page: Page) => page.locator('.masthead .problem-pill')

test.beforeEach(async ({ page, request }) => {
  writeFixture()
  writeBadData()
  // The board picks the files up through its watcher: wait until it serves all of them.
  await expect
    .poll(async () => {
      const snap = (await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot
      return ['US-01.0.1', 'US-01.0.2', 'US-01.0.3', 'US-02.1.7', 'US-01.1.9'].every((id) => snap.items[id]) && !!snap.questions['OQ-01']
    })
    .toBe(true)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})
test.afterAll(() => writeFixture())

test.describe('bad data (R-10, R-11, R-121, R-122)', () => {
  test('a self-parented card opens on the board, in both modes and on reload, and the check names it', async ({ page }) => {
    await page.goto('/#/board?item=US-01.0.1')
    await expect(page.locator('.sheet.docked h2')).toHaveText('Its own parent')
    await page.reload()
    await expect(page.locator('.sheet.docked h2')).toHaveText('Its own parent')
    await pill(page).click()
    await expect(page.locator('.problem-panel')).toContainText('is its own parent')
    await page.evaluate(() => localStorage.setItem('requirements-board:view', JSON.stringify({ boardMode: 'freeform' })))
    await page.goto('/#/board?item=US-01.0.2')
    await expect(page.locator('.sheet.docked h2')).toHaveText('Cycle one')
    for (const id of ['US-01.0.1', 'US-01.0.2', 'US-01.0.3', 'US-02.1.7']) await expect(page.locator(`.react-flow__node[data-id="${id}"]`)).toHaveCount(1)
    await expect(page.locator('.crash-panel')).toHaveCount(0)
  })

  test('a card of an unknown type: Mapped board draws it, its sheet and delete question open, its type shows as stored', async ({ page }) => {
    await page.goto('/#/board')
    await expect(page.locator('.react-flow__node[data-id="US-01.1.9"]')).toHaveCount(1)
    await page.goto('/#/board?item=US-01.1.9')
    const sheet = page.locator('.sheet.docked')
    await expect(sheet.locator('h2')).toHaveText('Odd type')
    await sheet.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('alertdialog', { name: 'Delete this user-story?' })).toBeVisible()
    await expect(page.locator('.react-flow__node[data-id="US-01.1.9"] .card')).toHaveAttribute('title', /^user-story US-01\.1\.9/)
    await expect(page.locator('.crash-panel')).toHaveCount(0)
  })

  test('the Outline lists every card; search and the keyboard reach them', async ({ page }) => {
    await page.goto('/#/outline')
    await expect(page.locator('.tree-group-head')).toHaveText('Not under an epic')
    for (const id of ['US-02.1.7', 'US-01.0.1', 'US-01.0.2', 'US-01.0.3']) await expect(page.locator(`.tree-row[data-id="${id}"]`)).toHaveCount(1)
    await expect(page.locator('.tree-row[data-id="US-02.1.7"] .tree-reason')).toHaveText('parent FT-02.9 does not exist')
    await page.locator('.tree-row').first().focus()
    await page.keyboard.press('End')
    await expect(page.locator('.tree-row:focus')).toHaveAttribute('data-id', /US-01\.0\./)
    await page.getByPlaceholder('Search IDs, titles and text').fill('US-02.1.7')
    await expect(page.locator('.tree-row[data-id="US-02.1.7"]')).toHaveCount(1)
    await expect(page.locator('.empty')).toHaveCount(0)
  })

  test('a question with an unconfigured status is listed, counted and opens', async ({ page }) => {
    await page.goto('/#/questions')
    await expect(page.locator('.tabs .tab', { hasText: 'Outstanding items' }).locator('.count')).toHaveText('1')
    await expect(page.locator('.group-head')).toContainText('Open · not a configured status')
    await expect(page.locator('.q-row')).toHaveCount(1)
    await expect(page.getByText('Nothing matches.')).toHaveCount(0)
    await page.locator('.q-row').click()
    await expect(page.locator('.sheet h2')).toHaveText('Status typo')
  })
})

test.describe('the error boundary (B03-REQ-01, accepted decision 17)', () => {
  test('a failed view shows its panel; the masthead and problem list work; Try again that fails shows it again; fixed, it recovers', async ({ page }) => {
    await page.goto('/#/outline')
    await expect(page.locator('.tree-row').first()).toBeVisible()
    await crashIn(page, 'view')
    await page.goto('/#/questions') // a fresh view boundary renders the probe
    await expect(page.locator('.crash-panel h2')).toHaveText(/Outstanding items couldn't be shown\./)
    await expect(pill(page)).toBeVisible()
    await pill(page).click()
    await expect(page.locator('.problem-panel')).toContainText('This page')
    await expect(page.locator('.problem-panel')).not.toContainText('Error: crash test') // listed once, as a crash
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.locator('.crash-panel')).toHaveCount(1)
    await crashIn(page, null)
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.locator('.q-row')).toHaveCount(1)
    await expect(page.locator('.crash-panel')).toHaveCount(0)
    await expect(page.locator('.masthead .problem-pill.bad')).toHaveCount(1) // only the check's errors remain
  })

  test('a failed docked sheet leaves the board; Close card clears it, and a reload stays clear', async ({ page }) => {
    await page.goto('/#/board')
    await crashIn(page, 'dock:item')
    await page.locator('.react-flow__node[data-id="US-01.1.1"]').click()
    const dock = page.locator('.sheet.docked')
    await expect(dock.locator('.crash-panel h2')).toHaveText(/This card couldn't be shown\./)
    await expect(page.locator('.react-flow__node[data-id="US-01.1.2"]')).toBeVisible()
    await dock.getByRole('button', { name: 'Close card' }).click()
    await expect(page).not.toHaveURL(/item=/)
    await crashIn(page, null)
    await page.reload()
    await expect(page.locator('.crash-panel')).toHaveCount(0)
  })

  test('a failed modal sheet keeps the unsaved draft and the leave prompt; the retried sheet gets the draft back', async ({ page }) => {
    await page.goto('/#/outline?item=US-01.1.1')
    const sheet = page.locator('.sheet').first()
    await sheet.getByRole('button', { name: 'Edit' }).click()
    await sheet.locator('input').first().fill('Draft title, not saved')
    await crashIn(page, 'sheet:item')
    // Any catalogue change re-renders the sheet's region: an agent edits another card.
    writeItem(story('US-01.1.3', 'FT-01.1', 'Changed on disk'), FIXTURE_DIR)
    await expect(page.locator('.sheet .crash-panel')).toHaveCount(1)
    await expect(page.locator('.page-head h1')).toHaveText('Outline') // the view behind still stands
    const prompts = await page.evaluate(() => {
      const e = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(e)
      return e.defaultPrevented
    })
    expect(prompts).toBe(true)
    await crashIn(page, null)
    await page.locator('.sheet').getByRole('button', { name: 'Try again' }).click()
    await expect(page.locator('.sheet input').first()).toHaveValue('Draft title, not saved')
  })
})
